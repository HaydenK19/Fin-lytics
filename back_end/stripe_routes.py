from fastapi import APIRouter, Depends, HTTPException, status, Header, Request
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Users
from auth import get_current_user
from pydantic import BaseModel
from typing import Optional
import stripe
import os
from dotenv import load_dotenv

# Import Stripe exceptions - handle different Stripe library versions
try:
    from stripe.error import StripeError, InvalidRequestError, SignatureVerificationError
except ImportError:
    # Fallback for different Stripe library versions
    try:
        from stripe import StripeError, InvalidRequestError, SignatureVerificationError
    except ImportError:
        # Use base exception if specific ones aren't available
        StripeError = Exception
        InvalidRequestError = ValueError
        SignatureVerificationError = ValueError

load_dotenv()

router = APIRouter(
    prefix='/stripe',
    tags=['stripe']
)

# Initialize Stripe with secret key from .env
stripe.api_key = os.getenv("STRIPE_KEY")
if not stripe.api_key:
    print("WARNING: STRIPE_KEY not found in environment variables. Stripe features will not work until STRIPE_KEY is added to .env file.")
    # Don't raise error - allow server to start, Stripe routes will handle missing key gracefully

# Subscription price ID - you'll need to create this in Stripe Dashboard
# For now, using a placeholder. You should create a product and price in Stripe Dashboard
SUBSCRIPTION_PRICE_ID = os.getenv("STRIPE_PRICE_ID", "price_placeholder")  # Replace with your actual price ID

if SUBSCRIPTION_PRICE_ID == "price_placeholder":
    print("WARNING: STRIPE_PRICE_ID not set. Please create a product in Stripe Dashboard and set STRIPE_PRICE_ID in .env")
elif SUBSCRIPTION_PRICE_ID and SUBSCRIPTION_PRICE_ID.startswith("prod_"):
    print(f"INFO: STRIPE_PRICE_ID is set to a product ID ({SUBSCRIPTION_PRICE_ID}). The system will automatically retrieve the price ID when needed.")
    print("For better performance, consider updating STRIPE_PRICE_ID to use the Price ID directly (starts with 'price_').")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_price_id_from_product(product_id: str) -> Optional[str]:
    """
    Helper function to retrieve the default price ID from a product ID.
    This is useful if someone accidentally uses a product ID instead of a price ID.
    """
    try:
        if not stripe.api_key:
            return None
        
        product = stripe.Product.retrieve(product_id)
        # Get the default price ID from the product
        if hasattr(product, 'default_price') and product.default_price:
            return product.default_price
        # If no default price, try to list prices for this product
        prices = stripe.Price.list(product=product_id, limit=1)
        if prices.data and len(prices.data) > 0:
            return prices.data[0].id
        return None
    except StripeError:
        return None


class SubscriptionStatusResponse(BaseModel):
    has_subscription: bool
    subscription_status: Optional[str]
    subscription_id: Optional[str]


class VerifySessionRequest(BaseModel):
    session_id: str


@router.get("/subscription/status", response_model=SubscriptionStatusResponse)
async def get_subscription_status(
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Check if user has an active subscription"""
    user_model = db.query(Users).filter(Users.id == user["id"]).first()
    if not user_model:
        raise HTTPException(status_code=404, detail="User not found")
    
    has_subscription = user_model.subscription_status == "active"
    
    return {
        "has_subscription": has_subscription,
        "subscription_status": user_model.subscription_status,
        "subscription_id": user_model.subscription_id
    }


@router.post("/refresh-subscription")
async def refresh_subscription_status(
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Manually refresh subscription status from Stripe.
    Useful if webhooks haven't updated the status yet.
    """
    try:
        if not stripe.api_key:
            raise HTTPException(
                status_code=500,
                detail="Stripe is not configured. Please set STRIPE_KEY in .env file."
            )
        
        user_model = db.query(Users).filter(Users.id == user["id"]).first()
        if not user_model:
            raise HTTPException(status_code=404, detail="User not found")
        
        if not user_model.subscription_id:
            return {
                "success": False,
                "message": "No subscription ID found. User may not have an active subscription.",
                "has_subscription": False
            }
        
        # Retrieve subscription from Stripe
        subscription = stripe.Subscription.retrieve(user_model.subscription_id)
        
        # Map Stripe status to our status
        status_map = {
            "active": "active",
            "canceled": "canceled",
            "past_due": "past_due",
            "unpaid": "inactive",
            "trialing": "active"
        }
        
        new_status = status_map.get(subscription.status, "inactive")
        
        # Update database if status changed
        if user_model.subscription_status != new_status:
            user_model.subscription_status = new_status
            db.commit()
        
        return {
            "success": True,
            "message": "Subscription status refreshed",
            "subscription_id": user_model.subscription_id,
            "subscription_status": new_status,
            "stripe_status": subscription.status,
            "has_subscription": new_status == "active"
        }
    
    except InvalidRequestError as e:
        # Subscription might have been deleted
        if "No such subscription" in str(e):
            user_model.subscription_id = None
            user_model.subscription_status = "inactive"
            db.commit()
            return {
                "success": False,
                "message": "Subscription not found in Stripe. Status updated to inactive.",
                "has_subscription": False
            }
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
    except StripeError as e:
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to refresh subscription: {str(e)}")


@router.post("/verify-session")
async def verify_checkout_session(
    request_body: VerifySessionRequest,
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Verify a checkout session and update subscription status.
    This is useful when webhooks haven't fired yet (e.g., in local development).
    """
    try:
        if not stripe.api_key:
            raise HTTPException(
                status_code=500,
                detail="Stripe is not configured. Please set STRIPE_KEY in .env file."
            )
        
        user_model = db.query(Users).filter(Users.id == user["id"]).first()
        if not user_model:
            raise HTTPException(status_code=404, detail="User not found")
        
        session_id = request_body.session_id
        
        # Retrieve the checkout session from Stripe
        session = stripe.checkout.Session.retrieve(session_id)
        
        # Verify this session belongs to the current user
        session_user_id = session.metadata.get("user_id") if session.metadata else None
        if not session_user_id or session_user_id != str(user_model.id):
            raise HTTPException(
                status_code=403,
                detail="This checkout session does not belong to you."
            )
        
        # Check if the session is completed and has a subscription
        if session.payment_status == "paid" and session.mode == "subscription":
            subscription_id = session.subscription
            
            if subscription_id:
                # Verify the subscription is active
                subscription = stripe.Subscription.retrieve(subscription_id)
                
                if subscription.status in ["active", "trialing"]:
                    # Update user's subscription status
                    user_model.subscription_id = subscription_id
                    user_model.subscription_status = "active"
                    db.commit()
                    
                    return {
                        "success": True,
                        "message": "Subscription verified and activated",
                        "subscription_id": subscription_id,
                        "subscription_status": "active"
                    }
                else:
                    return {
                        "success": False,
                        "message": f"Subscription exists but status is {subscription.status}",
                        "subscription_status": subscription.status
                    }
            else:
                return {
                    "success": False,
                    "message": "Checkout session completed but no subscription found"
                }
        else:
            return {
                "success": False,
                "message": f"Checkout session not completed. Payment status: {session.payment_status}"
            }
    
    except InvalidRequestError as e:
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
    except StripeError as e:
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to verify session: {str(e)}")


@router.post("/create-checkout-session")
async def create_checkout_session(
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a Stripe checkout session for subscription"""
    try:
        # Check if Stripe is configured
        if not stripe.api_key:
            raise HTTPException(
                status_code=500,
                detail="Stripe is not configured. Please set STRIPE_KEY in .env file."
            )
        
        user_model = db.query(Users).filter(Users.id == user["id"]).first()
        if not user_model:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check if user already has an active subscription
        if user_model.subscription_status == "active":
            raise HTTPException(
                status_code=400,
                detail="User already has an active subscription"
            )
        
        # Validate price ID
        if not SUBSCRIPTION_PRICE_ID or SUBSCRIPTION_PRICE_ID == "price_placeholder":
            raise HTTPException(
                status_code=500,
                detail="Subscription price not configured. Please set STRIPE_PRICE_ID in .env file."
            )
        
        # If a product ID was provided instead of a price ID, try to get the price ID automatically
        price_id = SUBSCRIPTION_PRICE_ID
        if SUBSCRIPTION_PRICE_ID.startswith("prod_"):
            # Try to automatically retrieve the price ID from the product
            retrieved_price_id = get_price_id_from_product(SUBSCRIPTION_PRICE_ID)
            if retrieved_price_id:
                price_id = retrieved_price_id
                print(f"INFO: Automatically retrieved price ID '{price_id}' from product ID '{SUBSCRIPTION_PRICE_ID}'. "
                      "Consider updating STRIPE_PRICE_ID in .env to use the price ID directly.")
            else:
                raise HTTPException(
                    status_code=500,
                    detail=f"Invalid STRIPE_PRICE_ID format. You provided a product ID '{SUBSCRIPTION_PRICE_ID}', but it must be a Price ID (starting with 'price_'). "
                           "Go to Stripe Dashboard > Products > Your Product > Pricing, and copy the Price ID (it starts with 'price_')."
                )
        elif not SUBSCRIPTION_PRICE_ID.startswith("price_"):
            raise HTTPException(
                status_code=500,
                detail=f"Invalid STRIPE_PRICE_ID format. Expected a price ID (starting with 'price_') but got '{SUBSCRIPTION_PRICE_ID}'. "
                       "Go to Stripe Dashboard > Products > Your Product > Pricing, and copy the Price ID."
            )
        
        # Create checkout session
        checkout_session = stripe.checkout.Session.create(
            customer_email=user_model.email,
            payment_method_types=["card"],
            line_items=[{
                "price": price_id,
                "quantity": 1,
            }],
            mode="subscription",
            success_url=f"http://localhost:5173/stock?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url="http://localhost:5173/stock?canceled=true",
            metadata={
                "user_id": str(user_model.id),
            },
        )
        
        return {"checkout_url": checkout_session.url, "session_id": checkout_session.id}
    
    except InvalidRequestError as e:
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
    except StripeError as e:
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create checkout session: {str(e)}")


@router.post("/create-portal-session")
async def create_portal_session(
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a Stripe customer portal session for managing subscription"""
    try:
        user_model = db.query(Users).filter(Users.id == user["id"]).first()
        if not user_model:
            raise HTTPException(status_code=404, detail="User not found")
        
        if not user_model.subscription_id:
            raise HTTPException(
                status_code=400,
                detail="User does not have a subscription"
            )
        
        # Retrieve the subscription to get customer ID
        subscription = stripe.Subscription.retrieve(user_model.subscription_id)
        customer_id = subscription.customer
        
        # Create portal session
        portal_session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url="http://localhost:5173/stock",
        )
        
        return {"portal_url": portal_session.url}
    
    except StripeError as e:
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create portal session: {str(e)}")


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None, alias="stripe-signature")
):
    """
    Handle Stripe webhook events
    You should set the webhook endpoint in Stripe Dashboard to: http://your-domain.com/stripe/webhook
    Note: For local testing, use Stripe CLI: stripe listen --forward-to localhost:8000/stripe/webhook
    """
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
    
    if not webhook_secret:
        raise HTTPException(status_code=500, detail="Webhook secret not configured")
    
    if not stripe_signature:
        raise HTTPException(status_code=400, detail="Missing stripe-signature header")
    
    try:
        # Get raw body as bytes (important for signature verification)
        body = await request.body()
        
        # Verify webhook signature
        event = stripe.Webhook.construct_event(
            body,
            stripe_signature,
            webhook_secret
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid payload: {str(e)}")
    except SignatureVerificationError as e:
        raise HTTPException(status_code=400, detail=f"Invalid signature: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Webhook verification failed: {str(e)}")
    
    # Handle the event
    event_type = event["type"]
    data = event["data"]["object"]
    
    db = SessionLocal()
    try:
        if event_type == "checkout.session.completed":
            # Subscription was created
            session = data
            user_id = int(session["metadata"]["user_id"])
            subscription_id = session.get("subscription")
            
            user = db.query(Users).filter(Users.id == user_id).first()
            if user:
                user.subscription_id = subscription_id
                user.subscription_status = "active"
                db.commit()
        
        elif event_type == "customer.subscription.updated":
            # Subscription was updated (e.g., renewed, canceled)
            subscription = data
            subscription_id = subscription["id"]
            status = subscription["status"]
            
            user = db.query(Users).filter(Users.subscription_id == subscription_id).first()
            if user:
                # Map Stripe status to our status
                status_map = {
                    "active": "active",
                    "canceled": "canceled",
                    "past_due": "past_due",
                    "unpaid": "inactive",
                    "trialing": "active"
                }
                user.subscription_status = status_map.get(status, "inactive")
                db.commit()
        
        elif event_type == "customer.subscription.deleted":
            # Subscription was canceled
            subscription = data
            subscription_id = subscription["id"]
            
            user = db.query(Users).filter(Users.subscription_id == subscription_id).first()
            if user:
                user.subscription_status = "canceled"
                user.subscription_id = None
                db.commit()
        
        return {"status": "success", "received": True}
    
    except KeyError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Missing required field in webhook: {str(e)}")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Webhook processing error: {str(e)}")
    finally:
        db.close()


def check_subscription(user: dict, db: Session) -> bool:
    """Helper function to check if user has active subscription"""
    user_model = db.query(Users).filter(Users.id == user["id"]).first()
    if not user_model:
        return False
    return user_model.subscription_status == "active"

