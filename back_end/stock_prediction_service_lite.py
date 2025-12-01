import os
import pandas as pd
import asyncio
import logging
import requests
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Stock_Prediction
import threading
import time
import random
from ai_service_client import ai_service, get_stock_prediction, get_batch_predictions

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class StockPredictionService:
    def __init__(self):
        self.fmp_api_key = os.getenv("FMP_API_KEY")
        self.fmp_base_url = "https://financialmodelingprep.com/api/v3"
        self.is_running = False
        self.prediction_thread = None
        
        # Initialize AI service with Hugging Face URL
        hugging_face_url = os.getenv("HUGGING_FACE_URL", "https://your-model.hf.space")
        ai_service.base_url = hugging_face_url
        logger.info(f"AI service configured with URL: {hugging_face_url}")
        
    def fetch_stock_data(self, ticker: str, days_back: int = 730) -> Optional[pd.DataFrame]:
        """Fetch historical stock data from FMP API"""
        try:
            # Calculate date range
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days_back)
            
            # Format dates for API
            start_str = start_date.strftime('%Y-%m-%d')
            end_str = end_date.strftime('%Y-%m-%d')
            
            # Construct API URL
            url = f"{self.fmp_base_url}/historical-price-full/{ticker}"
            params = {
                'from': start_str,
                'to': end_str,
                'apikey': self.fmp_api_key
            }
            
            response = requests.get(url, params=params, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            
            if 'historical' not in data or not data['historical']:
                logger.warning(f"No historical data found for {ticker}")
                return None
            
            # Convert to DataFrame
            df = pd.DataFrame(data['historical'])
            df['date'] = pd.to_datetime(df['date'])
            df = df.sort_values('date')
            
            logger.info(f"Fetched {len(df)} data points for {ticker}")
            return df
            
        except requests.exceptions.RequestException as e:
            logger.error(f"API request failed for {ticker}: {e}")
            return None
        except Exception as e:
            logger.error(f"Error fetching data for {ticker}: {e}")
            return None

    async def predict_stock_price(self, ticker: str, periods: int = 30) -> Dict:
        """Generate stock price predictions using Hugging Face AI service"""
        try:
            # Fetch recent stock data
            stock_data = self.fetch_stock_data(ticker, days_back=365)
            
            # Prepare data for AI service if available
            recent_prices = None
            if stock_data is not None and len(stock_data) > 0:
                recent_prices = stock_data['close'].tail(100).tolist()
            
            # Call Hugging Face AI service
            prediction_result = await get_stock_prediction(ticker, periods)
            
            if prediction_result and 'predictions' in prediction_result:
                logger.info(f"Successfully generated {len(prediction_result['predictions'])} predictions for {ticker}")
                return prediction_result
            else:
                logger.warning(f"No predictions returned from AI service for {ticker}")
                return self._generate_fallback_prediction(ticker, periods)
                
        except Exception as e:
            logger.error(f"Error predicting {ticker}: {e}")
            return self._generate_fallback_prediction(ticker, periods)

    def _generate_fallback_prediction(self, ticker: str, periods: int) -> Dict:
        """Generate simple fallback predictions when AI service is unavailable"""
        predictions = []
        base_price = 100.0 + random.uniform(-50, 50)
        current_price = base_price
        
        for i in range(periods):
            # Simple random walk with slight upward bias
            change_percent = random.uniform(-0.03, 0.04)
            current_price *= (1 + change_percent)
            
            predictions.append({
                "date": (datetime.now() + timedelta(days=i+1)).strftime("%Y-%m-%d"),
                "predicted_price": round(current_price, 2),
                "confidence_lower": round(current_price * 0.92, 2),
                "confidence_upper": round(current_price * 1.08, 2)
            })
        
        return {
            "symbol": ticker,
            "periods": periods,
            "predictions": predictions,
            "model_used": "fallback",
            "generated_at": datetime.now().isoformat(),
            "note": "Using fallback predictions - AI service unavailable"
        }

    async def get_cached_prediction(self, ticker: str) -> Optional[Dict]:
        """Get cached prediction from database"""
        try:
            db = SessionLocal()
            
            # Look for recent prediction (less than 1 hour old)
            cutoff_time = datetime.now() - timedelta(hours=1)
            
            prediction = db.query(Stock_Prediction).filter(
                Stock_Prediction.ticker == ticker.upper(),
                Stock_Prediction.created_at > cutoff_time
            ).order_by(Stock_Prediction.created_at.desc()).first()
            
            db.close()
            
            if prediction:
                logger.info(f"Found cached prediction for {ticker}")
                return {
                    "symbol": prediction.ticker,
                    "predicted_price": float(prediction.predicted_price),
                    "confidence_low": float(prediction.confidence_low or prediction.predicted_price * 0.9),
                    "confidence_high": float(prediction.confidence_high or prediction.predicted_price * 1.1),
                    "created_at": prediction.created_at.isoformat(),
                    "cached": True
                }
                
        except Exception as e:
            logger.error(f"Error getting cached prediction for {ticker}: {e}")
            
        return None

    async def save_prediction(self, ticker: str, predicted_price: float, confidence_score: float):
        """Save prediction to database"""
        try:
            db = SessionLocal()
            
            prediction = Stock_Prediction(
                ticker=ticker.upper(),
                predicted_price=predicted_price,
                confidence_low=predicted_price * 0.9,  # Simple confidence bounds
                confidence_high=predicted_price * 1.1
            )
            
            db.add(prediction)
            db.commit()
            db.close()
            
            logger.info(f"Saved prediction for {ticker}: ${predicted_price}")
            
        except Exception as e:
            logger.error(f"Error saving prediction for {ticker}: {e}")

    def start_background_predictions(self):
        """Start background prediction updates"""
        if self.is_running:
            return
            
        self.is_running = True
        self.prediction_thread = threading.Thread(target=self._run_prediction_loop, daemon=True)
        self.prediction_thread.start()
        logger.info("Started background prediction service")

    def stop_background_predictions(self):
        """Stop background prediction updates"""
        self.is_running = False
        if self.prediction_thread:
            self.prediction_thread.join(timeout=5)
        logger.info("Stopped background prediction service")

    def _run_prediction_loop(self):
        """Background prediction loop"""
        popular_stocks = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'AMD', 'NFLX', 'DIS']
        
        while self.is_running:
            try:
                for ticker in popular_stocks:
                    if not self.is_running:
                        break
                        
                    # Check if we already have a recent prediction
                    cached = asyncio.run(self.get_cached_prediction(ticker))
                    if not cached:
                        # Generate new prediction
                        result = asyncio.run(self.predict_stock_price(ticker, periods=1))
                        if result and 'predictions' in result and len(result['predictions']) > 0:
                            first_prediction = result['predictions'][0]
                            asyncio.run(self.save_prediction(
                                ticker, 
                                first_prediction['predicted_price'],
                                0.75  # Default confidence
                            ))
                    
                    # Sleep between predictions to avoid rate limiting
                    time.sleep(2)
                
                # Sleep for 30 minutes before next batch
                for _ in range(1800):  # 30 minutes = 1800 seconds
                    if not self.is_running:
                        break
                    time.sleep(1)
                    
            except Exception as e:
                logger.error(f"Error in prediction loop: {e}")
                time.sleep(60)  # Wait 1 minute before retrying

# Global service instance
prediction_service = StockPredictionService()

# Utility functions
async def get_stock_prediction_with_cache(ticker: str, periods: int = 30) -> Dict:
    """Get stock prediction with caching"""
    # Try to get cached prediction first
    cached = await prediction_service.get_cached_prediction(ticker)
    if cached:
        return cached
    
    # Generate new prediction
    return await prediction_service.predict_stock_price(ticker, periods)

def start_prediction_service():
    """Start the prediction service"""
    # Temporarily disabled to prevent 404 errors from Hugging Face
    # Enable this when you have a working Hugging Face model deployed
    logger.info("Prediction service disabled until Hugging Face model is deployed")
    # prediction_service.start_background_predictions()

def stop_prediction_service():
    """Stop the prediction service"""
    prediction_service.stop_background_predictions()