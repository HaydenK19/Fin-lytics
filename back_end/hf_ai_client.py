"""
Hugging Face Spaces AI Model Client for Railway Backend
Handles all communication with the HF Spaces AI model service
"""
import requests
import logging
from typing import Dict, List, Optional
from datetime import datetime
import os
from dotenv import load_dotenv
import asyncio
import aiohttp

load_dotenv()
logger = logging.getLogger(__name__)

class HFAIClient:
    def __init__(self):
        # Set your HF Spaces URL here - update when you deploy to HF
        self.base_url = os.getenv("HF_AI_SERVICE_URL", "https://haydenk19-finlytics-ai.hf.space")
        self.predict_url = f"{self.base_url}/predict"
        self.batch_predict_url = f"{self.base_url}/batch_predict"
        self.health_url = f"{self.base_url}/health"
        self.model_info_url = f"{self.base_url}/model/info"
        
        # Request timeout settings
        self.timeout = 30
        self.batch_timeout = 120
        
        logger.info(f"🤖 HF AI Client initialized with base URL: {self.base_url}")
    
    async def health_check(self) -> Dict:
        """Check if the HF AI service is healthy"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(self.health_url, timeout=10) as response:
                    if response.status == 200:
                        data = await response.json()
                        logger.info("✅ HF AI service is healthy")
                        return data
                    else:
                        logger.warning(f"⚠️ HF AI service returned status {response.status}")
                        return {"status": "unhealthy", "status_code": response.status}
        except Exception as e:
            logger.error(f"❌ HF AI service health check failed: {e}")
            return {"status": "unreachable", "error": str(e)}
    
    def health_check_sync(self) -> Dict:
        """Synchronous health check"""
        try:
            response = requests.get(self.health_url, timeout=10)
            if response.status_code == 200:
                logger.info("✅ HF AI service is healthy (sync)")
                return response.json()
            else:
                logger.warning(f"⚠️ HF AI service returned status {response.status_code}")
                return {"status": "unhealthy", "status_code": response.status_code}
        except Exception as e:
            logger.error(f"❌ HF AI service health check failed (sync): {e}")
            return {"status": "unreachable", "error": str(e)}
    
    async def predict_stock(self, ticker: str, days: int = 30, historical_data: Optional[List[Dict]] = None) -> Dict:
        """
        Get stock price predictions from HF AI service
        """
        try:
            payload = {
                "ticker": ticker.upper(),
                "days": min(days, 365),
                "historical_data": historical_data
            }
            
            logger.info(f"🔮 Requesting prediction for {ticker} ({days} days)")
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    self.predict_url,
                    json=payload,
                    timeout=self.timeout
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        logger.info(f"✅ Received prediction for {ticker}")
                        return data
                    else:
                        error_text = await response.text()
                        logger.error(f"❌ Prediction request failed for {ticker}: {response.status} - {error_text}")
                        return self.generate_fallback_prediction(ticker, days)
        except Exception as e:
            logger.error(f"❌ Prediction request error for {ticker}: {e}")
            return self.generate_fallback_prediction(ticker, days)
    
    def predict_stock_sync(self, ticker: str, days: int = 30, historical_data: Optional[List[Dict]] = None) -> Dict:
        """Synchronous version of predict_stock"""
        try:
            payload = {
                "ticker": ticker.upper(),
                "days": min(days, 365),
                "historical_data": historical_data
            }
            
            logger.info(f"🔮 Requesting prediction for {ticker} ({days} days) [sync]")
            
            response = requests.post(
                self.predict_url,
                json=payload,
                timeout=self.timeout
            )
            
            if response.status_code == 200:
                data = response.json()
                logger.info(f"✅ Received prediction for {ticker} [sync]")
                return data
            else:
                logger.error(f"❌ Prediction request failed for {ticker}: {response.status_code} - {response.text}")
                return self.generate_fallback_prediction(ticker, days)
        except Exception as e:
            logger.error(f"❌ Prediction request error for {ticker} [sync]: {e}")
            return self.generate_fallback_prediction(ticker, days)
    
    def generate_fallback_prediction(self, ticker: str, days: int = 30) -> Dict:
        """Generate a fallback prediction when HF service is unavailable"""
        logger.info(f"🔄 Generating fallback prediction for {ticker}")
        
        # Simple mock prediction
        predictions = []
        base_price = 150.0
        
        for i in range(days):
            date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            date = date.replace(day=date.day + i + 1)
            
            # Simple price movement simulation
            price_change = (hash(f"{ticker}-{i}") % 20) - 10  # -10 to +10
            price = base_price + (i * 0.5) + (price_change * 0.1)
            
            predictions.append({
                "date": date.strftime("%Y-%m-%d"),
                "predicted_price": round(max(price, 10.0), 2),
                "confidence_low": round(max(price * 0.95, 9.5), 2),
                "confidence_high": round(price * 1.05, 2),
                "timestamp": date.isoformat()
            })
        
        return {
            "ticker": ticker,
            "predictions": predictions,
            "model": "fallback",
            "confidence": "low",
            "generated_at": datetime.now().isoformat(),
            "note": "HF AI service unavailable - using fallback prediction"
        }

# Global instance
hf_ai_client = HFAIClient()