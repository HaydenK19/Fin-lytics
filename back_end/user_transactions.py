from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Annotated
from database import SessionLocal
from models import Users, Plaid_Transactions, Plaid_Bank_Account
from auth import get_current_user
from plaid.api import plaid_api
from plaid.model.transactions_get_request import TransactionsGetRequest
from datetime import datetime, timedelta
try:
    from dateutil.relativedelta import relativedelta
    HAS_DATEUTIL = True
except ImportError:
    HAS_DATEUTIL = False
from plaid_routes import decrypt_token, PLAID_CLIENT_ID, PLAID_SECRET, client

router = APIRouter(
    prefix="/user_transactions",
    tags=["User Transactions"]
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def generate_recurring_transactions(recurring_transaction, start_date, end_date):
    """
    Generate future instances of a recurring transaction within the date range.
    
    It allows users to:

    1. Project future expenses and income
    2. Create budgets based on predictable recurring items
    3. Manipulate the Plaid_Transactions table with synthetic future data (TBD RIGHT NOW)
    
    This encapsulates the budgeter branch's basic functionality while extending
    it with advanced financial planning capabilities.
    """
    print(f"[RECURRING] Generating recurring transactions for {recurring_transaction.transaction_id}")
    generated = []
    
    current_date = recurring_transaction.date
    frequency = getattr(recurring_transaction, 'frequency', None)
    
    # skip if no frequency (not a recurring transaction)
    if not frequency:
        print(f"[RECURRING] No frequency found for transaction {recurring_transaction.transaction_id}")
        return []
    
    print(f"[RECURRING] Processing {frequency} transaction from {start_date} to {end_date}")
    
    # generate future instances
    while current_date <= end_date:
        if current_date >= start_date:
            # create a transaction-like dict for the recurring instance
            instance = {
                "transaction_id": f"{recurring_transaction.transaction_id}-{current_date.isoformat()}",
                "account_id": recurring_transaction.account_id,
                "amount": recurring_transaction.amount,
                "currency": recurring_transaction.currency,
                "category": recurring_transaction.category,
                "merchant_name": recurring_transaction.merchant_name,
                "date": current_date.isoformat(),
                "is_recurring": True,
                "original_transaction_id": recurring_transaction.transaction_id
            }
            generated.append(instance)
            print(f"[RECURRING] Generated instance for {current_date}")
        
        # calculate next occurrence
        if frequency == 'weekly':
            current_date += timedelta(weeks=1)
        elif frequency == 'biweekly':
            current_date += timedelta(weeks=2)
        elif frequency == 'monthly' and HAS_DATEUTIL:
            current_date += relativedelta(months=1)
        elif frequency == 'quarterly' and HAS_DATEUTIL:
            current_date += relativedelta(months=3)
        elif frequency == 'yearly' and HAS_DATEUTIL:
            current_date += relativedelta(years=1)
        elif frequency in ['monthly', 'quarterly', 'yearly'] and not HAS_DATEUTIL:
            # fallback for monthly/quarterly/yearly without dateutil (Approximate)
            if frequency == 'monthly':
                current_date += timedelta(days=30)  
            elif frequency == 'quarterly':
                current_date += timedelta(days=90)  
            elif frequency == 'yearly':
                current_date += timedelta(days=365)  
        else:
            print(f"[RECURRING] Unknown frequency: {frequency}")
            break 
    
    print(f"[RECURRING] Generated {len(generated)} recurring instances")
    return generated

@router.get("/", status_code=status.HTTP_200_OK)
async def get_user_transactions(
    user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    start_date: str | None = None,
    end_date: str | None = None,
):
    """
    Fetch the user's transactions from Plaid and the database.
    """
    try:
        print(f"[TRANSACTIONS] User received: {user}")  # debug from budgeter branch
        db_user = db.query(Users).filter(Users.id == user["id"]).first()
        print(f"[TRANSACTIONS] Database user found: {db_user is not None}")  # DEbug

        # handle date parameters with defaults (dev branch flexibility)
        if end_date:
            end_dt = datetime.fromisoformat(end_date).date()
        else:
            end_dt = datetime.now().date()

        if start_date:
            start_dt = datetime.fromisoformat(start_date).date()
        else:
            start_dt = (datetime.now() - timedelta(days=30)).date()

        print(f"[TRANSACTIONS] Date range: {start_dt} to {end_dt}")

        transactions = []
        # handling: only attempt Plaid call if user has linked a Plaid access token
        if db_user and db_user.plaid_access_token:
            try:
                decrypted_access_token = decrypt_token(db_user.plaid_access_token)
                print(f"[PLAID] Decrypted access token available")  # Debug

                request = TransactionsGetRequest(
                    access_token=decrypted_access_token,
                    start_date=start_dt,
                    end_date=end_dt,
                    client_id=PLAID_CLIENT_ID,
                    secret=PLAID_SECRET
                )
                response = client.transactions_get(request).to_dict()
                print(f"[PLAID] Retrieved {len(response.get('transactions', []))} transactions")  # Debug

                transactions = [
                    {
                        "transaction_id": t["transaction_id"],
                        "account_id": t["account_id"],
                        "amount": t["amount"],
                        "currency": t.get("iso_currency_code"),
                        "category": ", ".join(t["category"]) if t.get("category") else None,
                        "merchant_name": t.get("merchant_name"),
                        "date": t["date"]
                    }
                    for t in response.get("transactions", [])
                ]
            except Exception as plaid_err:
                # Graceful error handling: Log plaid error but continue to return DB transactions
                print(f"[PLAID] Fetch error (continuing with DB transactions): {str(plaid_err)}")
        else:
            print("[PLAID] No access token found, using database transactions only")

        # Fetch transactions from the database with advanced error handling
        # This maintains schema flexibility for database migrations
        db_transactions = []
        try:
            # Try to query with frequency column (advanced feature)
            q = db.query(Plaid_Transactions).filter(
                Plaid_Transactions.account_id.in_(
                    db.query(Plaid_Bank_Account.account_id).filter(
                        Plaid_Bank_Account.user_id == user["id"]
                    )
                )
            )
            if start_date:
                q = q.filter(Plaid_Transactions.date >= start_dt)
            if end_date:
                q = q.filter(Plaid_Transactions.date <= end_dt)

            db_transactions = q.all()
            print(f"[DATABASE] Retrieved {len(db_transactions)} transactions from database")
        except Exception as db_err:
            # Schema migration compatibility: Handle missing frequency column gracefully
            if "Unknown column" in str(db_err) and "frequency" in str(db_err):
                print("[DATABASE] Frequency column not found, querying without it")
                # Query specific columns excluding frequency
                q = db.query(
                    Plaid_Transactions.id,
                    Plaid_Transactions.transaction_id,
                    Plaid_Transactions.account_id,
                    Plaid_Transactions.amount,
                    Plaid_Transactions.currency,
                    Plaid_Transactions.category,
                    Plaid_Transactions.merchant_name,
                    Plaid_Transactions.date,
                    Plaid_Transactions.created_at
                ).filter(
                    Plaid_Transactions.account_id.in_(
                        db.query(Plaid_Bank_Account.account_id).filter(
                            Plaid_Bank_Account.user_id == user["id"]
                        )
                    )
                )
                if start_date:
                    q = q.filter(Plaid_Transactions.date >= start_dt)
                if end_date:
                    q = q.filter(Plaid_Transactions.date <= end_dt)

                # Convert query results to mock objects with frequency=None
                results = q.all()
                db_transactions = []
                for r in results:
                    # Create a mock object that behaves like Plaid_Transactions
                    mock_transaction = type('MockTransaction', (), {
                        'id': r.id,
                        'transaction_id': r.transaction_id,
                        'account_id': r.account_id,
                        'amount': r.amount,
                        'currency': r.currency,
                        'category': r.category,
                        'merchant_name': r.merchant_name,
                        'date': r.date,
                        'created_at': r.created_at,
                        'frequency': None
                    })()
                    db_transactions.append(mock_transaction)
                print(f"[DATABASE] Fallback query retrieved {len(db_transactions)} transactions")
            else:
                raise db_err

        # Transform database transactions with enhanced data structure
        db_transactions_data = [
            {
                "transaction_id": t.transaction_id,
                "account_id": t.account_id,
                "amount": t.amount,
                "currency": t.currency,
                "category": t.category,
                "merchant_name": t.merchant_name,
                "date": t.date,
                "frequency": getattr(t, 'frequency', None),  # Handle missing column gracefully
                "is_recurring": bool(getattr(t, 'frequency', None))
            }
            for t in db_transactions
        ]

        print(f"[DATABASE] Processed {len(db_transactions_data)} transaction records")

        # Generate future recurring transactions (advanced feature)
        # This enables budget projections and financial planning
        recurring_transactions = []
        try:
            recurring_base_transactions = [t for t in db_transactions if getattr(t, 'frequency', None)]
            print(f"[RECURRING] Found {len(recurring_base_transactions)} recurring base transactions")
            
            for recurring_transaction in recurring_base_transactions:
                generated = generate_recurring_transactions(
                    recurring_transaction, 
                    start_dt, 
                    end_dt
                )
                recurring_transactions.extend(generated)
        except AttributeError:
            # Frequency column doesn't exist yet, skip recurring transactions
            print("[RECURRING] Frequency column not available, skipping recurring transactions")
            pass

        # Enhanced response structure that encapsulates budgeter's basic functionality
        # while extending with advanced features for budget manipulation
        response_data = {
            "plaid_transactions": transactions, 
            "db_transactions": db_transactions_data,
            "recurring_transactions": recurring_transactions,
            "summary": {
                "plaid_count": len(transactions),
                "db_count": len(db_transactions_data),
                "recurring_count": len(recurring_transactions),
                "date_range": {"start": start_dt.isoformat(), "end": end_dt.isoformat()}
            }
        }
        
        print(f"[RESPONSE] Returning {response_data['summary']}")
        return response_data

    except Exception as e:
        print(f"[ERROR] Error in get_user_transactions: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_transaction(
    payload: dict,
    user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """
    Create a manual transaction in the Plaid_Transactions table for the user's account.
    
    DESIGN CHOICE: This POST endpoint enables full manipulation of the Plaid_Transactions table,
    allowing users to add manual transactions, recurring transactions, and budget projections.
    This extends beyond basic budgeter functionality to provide comprehensive financial control.
    
    Expected payload: { transaction_id, account_id, amount, currency, category, merchant_name, date, frequency }
    """
    try:
        print(f"[CREATE_TRANSACTION] Creating transaction for user {user['id']}")
        db_user = db.query(Users).filter(Users.id == user["id"]).first()
        if not db_user:
            raise HTTPException(status_code=404, detail="User not found")

        # Minimal validation
        required = ["transaction_id", "account_id", "amount", "date"]
        for r in required:
            if r not in payload:
                raise HTTPException(status_code=400, detail=f"Missing field: {r}")

        print(f"[CREATE_TRANSACTION] Payload validated: {list(payload.keys())}")

        # Enhanced account handling: Support manual entries for budget manipulation
        acct_id = payload["account_id"]

        if acct_id == 'manual' or not db.query(Plaid_Bank_Account).filter(Plaid_Bank_Account.account_id == acct_id, Plaid_Bank_Account.user_id == db_user.id).first():
            # find existing manual account for user
            manual = db.query(Plaid_Bank_Account).filter(Plaid_Bank_Account.user_id == db_user.id, Plaid_Bank_Account.name == 'Manual Entries').first()
            if not manual:
                # create a synthetic manual account row
                import uuid
                manual_account_id = f"manual-{db_user.id}-{uuid.uuid4().hex[:8]}"
                manual = Plaid_Bank_Account(
                    user_id=db_user.id,
                    account_id=manual_account_id,
                    name='Manual Entries',
                    type='manual',
                    subtype='manual',
                    current_balance=0.0,
                    available_balance=0.0,
                    currency='USD'
                )
                db.add(manual)
                db.commit()
                db.refresh(manual)
                print(f"[CREATE_TRANSACTION] Created manual account: {manual_account_id}")
            acct_id = manual.account_id

        # create Plaid_Transactions row with advanced features
        transaction_data = {
            "transaction_id": payload["transaction_id"],
            "account_id": acct_id,
            "amount": payload["amount"],
            "currency": payload.get("currency"),
            "category": payload.get("category"),
            "merchant_name": payload.get("merchant_name"),
            "date": datetime.fromisoformat(payload["date"]).date()
        }
        
        # support recurring transactions for budget projections
        if payload.get("frequency") and hasattr(Plaid_Transactions, 'frequency'):
            transaction_data["frequency"] = payload.get("frequency")
            print(f"[CREATE_TRANSACTION] Added recurring frequency: {payload.get('frequency')}")
            
        new = Plaid_Transactions(**transaction_data)
        db.add(new)
        db.commit()
        db.refresh(new)

        print(f"[CREATE_TRANSACTION] Successfully created transaction: {new.transaction_id}")
        return {"status": "created", "transaction_id": new.transaction_id}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[CREATE_TRANSACTION] Error creating transaction: {str(e)}")
        raise HTTPException(status_code=500, detail="Error creating transaction")
