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
        self.predictor = None
        self.fmp_api_key = os.getenv("FMP_API_KEY")
        self.fmp_base_url = "https://financialmodelingprep.com/api/v3"
        self.model_path = os.path.join(os.path.dirname(__file__), "..", "AI_model", "AutoGluonModels_multi")
        self.is_running = False
        self.prediction_thread = None
        
    def load_model(self):
        """Load the trained Chronos model"""
        try:
            if not os.path.exists(self.model_path):
                logger.error(f"Model path not found: {self.model_path}")
                return False
                
            self.predictor = TimeSeriesPredictor.load(self.model_path, require_version_match=False)
            logger.info("Chronos model loaded successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            return False
    
    def fetch_stock_data(self, ticker: str, days_back: int = 730) -> Optional[pd.DataFrame]:
        """Fetch historical stock data from FMP API"""
        try:
            # Calculate date range
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days_back)
            
            # Format dates for FMP API
            from_date = start_date.strftime("%Y-%m-%d")
            to_date = end_date.strftime("%Y-%m-%d")
            
            # FMP API endpoint for intraday data (5-minute intervals)
            url = f"{self.fmp_base_url}/historical-chart/5min/{ticker}"
            params = {
                'from': from_date,
                'to': to_date,
                'apikey': self.fmp_api_key
            }
            
            response = requests.get(url, params=params)
            response.raise_for_status()
            
            data = response.json()
            
            if not data:
                logger.warning(f"No data received for {ticker}")
                return None
            
            # Convert to DataFrame
            df = pd.DataFrame(data)
            
            # Rename columns to match expected format
            df = df.rename(columns={
                'date': 'datetime',
                'open': 'open',
                'high': 'high', 
                'low': 'low',
                'close': 'close',
                'volume': 'volume'
            })
            
            # Convert datetime column
            df['datetime'] = pd.to_datetime(df['datetime'])
            df = df.sort_values('datetime')
            
            # Regularize to 5-minute intervals
            df = self._regularize_data(df, ticker)
            
            logger.info(f"Fetched {len(df)} records for {ticker}")
            return df
            
        except requests.exceptions.RequestException as e:
            logger.error(f"API request failed for {ticker}: {e}")
            return None
        except Exception as e:
            logger.error(f"Failed to fetch data for {ticker}: {e}")
            return None
    
    def _regularize_data(self, df: pd.DataFrame, ticker: str) -> pd.DataFrame:
        """Regularize data to 5-minute intervals """
        FMT = "%Y-%m-%d %H:%M:%S"
        FREQ = "5min"
        
        # Ensure datetime column is properly formatted
        df['datetime'] = pd.to_datetime(df['datetime'])
        df = df.sort_values('datetime')
        
        # Create full 5-minute index
        full_idx = pd.date_range(df['datetime'].min(), df['datetime'].max(), freq=FREQ)
        
        # Reindex OHLCV data
        prices = (
            df.set_index('datetime')[['open', 'high', 'low', 'close', 'volume']]
            .astype('float32')
            .reindex(full_idx)
        )
        
        # Day-scoped forward fill (no overnight leakage)
        prices = prices.groupby(prices.index.normalize()).ffill()
        
        # Convert to AutoGluon format
        out = pd.DataFrame({
            'item_id': ticker,
            'timestamp': prices.index,
            'target': prices['close'].values,
            'open': prices['open'].values,
            'high': prices['high'].values,
            'low': prices['low'].values,
            'volume': prices['volume'].values,
        })
        
        return out
    
    async def make_prediction(self, ticker: str) -> Optional[Dict]:
        """Make prediction for a given ticker using Hugging Face AI service"""
        try:
            # Call Hugging Face AI service
            result = await get_stock_prediction(ticker, periods=30)
            
            if result and result.get('predictions'):
                # Get the first prediction (next day)
                first_prediction = result['predictions'][0]
                
                prediction_data = {
                    'ticker': ticker.upper(),
                    'predicted_price': float(first_prediction['predicted_price']),
                    'confidence_low': float(first_prediction['confidence_lower']),
                    'confidence_high': float(first_prediction['confidence_upper']),
                    'prediction_time': datetime.now(),
                    'horizon_minutes': 1440,  # 24 hours (1 day)
                    'model_version': result.get('model_used', 'HuggingFace')
                }
                
                logger.info(f"Generated prediction for {ticker}: ${prediction_data['predicted_price']:.2f}")
                return prediction_data
            else:
                logger.warning(f"No valid prediction received for {ticker}")
                return None
            
        except Exception as e:
            logger.error(f"Prediction failed for {ticker}: {e}")
            return None

    async def make_interval_predictions(self, ticker: str) -> Optional[List[Dict]]:
        """Generate multi-interval predictions for a given ticker using Hugging Face AI service"""
        try:
            # Get predictions from Hugging Face AI service
            result = await get_stock_prediction(ticker, periods=30)
            
            if not result or not result.get('predictions'):
                logger.warning(f"No predictions received for {ticker}")
                return None

            predictions = result['predictions']
            
            # Simulate different intervals based on the daily predictions
            intervals = [
                {"label": "5m", "days": 0.003472},   # ~5 minutes as fraction of day
                {"label": "15m", "days": 0.0104},    # ~15 minutes 
                {"label": "30m", "days": 0.0208},    # ~30 minutes
                {"label": "1h", "days": 0.0417},     # ~1 hour
                {"label": "1d", "days": 1}           # 1 day
            ]
            
            results = []
            base_price = float(predictions[0]['predicted_price'])
            
            for interval in intervals:
                # Find the closest prediction day
                target_day = min(len(predictions) - 1, int(interval['days'] * len(predictions)))
                prediction = predictions[target_day]
                
                predicted_price = float(prediction['predicted_price'])
                
                # Calculate change from current/base price
                change = ((predicted_price - base_price) / base_price) * 100
                
                results.append({
                    "ticker": ticker.upper(),
                    "interval": interval['label'],
                    "predicted_price": predicted_price,
                    "change": change
                })

            logger.info(f"Generated {len(results)} interval predictions for {ticker}")
            return results

        except Exception as e:
            logger.error(f"Interval prediction failed for {ticker}: {e}")
            return None

    
    def save_prediction(self, prediction_data: Dict):
        """Save prediction to database"""
        try:
            db = SessionLocal()
            try:
                # Create new prediction record
                prediction = Stock_Prediction(
                    ticker=prediction_data['ticker'],
                    predicted_price=prediction_data['predicted_price'],
                    confidence_low=prediction_data['confidence_low'],
                    confidence_high=prediction_data['confidence_high'],
                    prediction_time=prediction_data['prediction_time'],
                    horizon_minutes=prediction_data['horizon_minutes'],
                    model_version=prediction_data['model_version']
                )
                
                db.add(prediction)
                db.commit()
                logger.info(f"Saved prediction for {prediction_data['ticker']}")
                
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Failed to save prediction: {e}")
    
    def prediction_loop(self, tickers: List[str] = None):
        """Main prediction loop that runs periodically"""
        if tickers is None:
            tickers = ['AAPL']  # Default to AAPL, can be expanded
        
        logger.info(f"Starting prediction loop for tickers: {tickers}")
        
        while self.is_running:
            try:
                # Run async predictions in the sync loop
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                
                for ticker in tickers:
                    # Make prediction using async method
                    prediction_data = loop.run_until_complete(self.make_prediction(ticker))
                    if prediction_data:
                        # Save to database
                        self.save_prediction(prediction_data)
                
                loop.close()
                
                # Wait for 1 hour (3600 seconds) - longer interval for Hugging Face
                time.sleep(3600)
                
            except Exception as e:
                logger.error(f"Error in prediction loop: {e}")
                time.sleep(300)  # Wait 5 minutes before retrying
    
    def start_predictions(self, tickers: List[str] = None):
        """Start the background prediction service"""
        if self.is_running:
            logger.warning("Prediction service is already running")
            return
        
        # No need to load local model - using Hugging Face service
        logger.info("Using Hugging Face AI service for predictions")
        
        self.is_running = True
        self.prediction_thread = threading.Thread(
            target=self.prediction_loop,
            args=(tickers,),
            daemon=True
        )
        self.prediction_thread.start()
        logger.info("Prediction service started with Hugging Face backend")
    
    def stop_predictions(self):
        """Stop the background prediction service"""
        if not self.is_running:
            logger.warning("Prediction service is not running")
            return
        
        self.is_running = False
        if self.prediction_thread:
            self.prediction_thread.join(timeout=10)
        logger.info("Prediction service stopped")
    
    def get_latest_predictions(self, ticker: str = None, limit: int = 10) -> List[Dict]:
        """Get latest predictions from database"""
        try:
            db = SessionLocal()
            try:
                query = db.query(Stock_Prediction)
                if ticker:
                    query = query.filter(Stock_Prediction.ticker == ticker)
                
                predictions = query.order_by(Stock_Prediction.prediction_time.desc()).limit(limit).all()
                
                return [
                    {
                        'id': pred.id,
                        'ticker': pred.ticker,
                        'predicted_price': pred.predicted_price,
                        'confidence_low': pred.confidence_low,
                        'confidence_high': pred.confidence_high,
                        'prediction_time': pred.prediction_time,
                        'horizon_minutes': pred.horizon_minutes,
                        'model_version': pred.model_version
                    }
                    for pred in predictions
                ]
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Failed to get predictions: {e}")
            return []

    def get_daily_prediction_tickers(self) -> List[str]:
        """
        Simplified: only returns one ticker at a time (random pick from blue-chips + movers).
        Keeps predictions lightweight and prevents multi-list output issues.
        """
        core_tickers = ["AAPL", "MSFT", "NVDA", "AMZN", "META", "GOOGL", "TSLA", "BRK.B"]
        mover_type = random.choice(["gainers", "losers"])

        try:
            url = f"{self.fmp_base_url}/stock_market/{mover_type}"
            params = {"apikey": self.fmp_api_key}
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()

            trending = [
                d["ticker"] for d in data
                if d.get("ticker") 
                and not any(x in d["ticker"].upper() for x in ["^", "-", "ETF", "INDEX"])
            ]
        except Exception as e:
            logger.warning(f"Failed to fetch {mover_type}: {e}")
            trending = []

        tickers = list(dict.fromkeys(core_tickers + trending))
        chosen = [random.choice(tickers)]  # pick one ticker only
        logger.info(f"Selected ticker for Chronos run: {chosen}")
        return chosen


# Global instance
prediction_service = StockPredictionService()
