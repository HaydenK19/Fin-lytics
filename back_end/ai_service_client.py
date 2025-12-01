import requests
import logging
from typing import Dict, List, Any, Optional
import asyncio
import aiohttp
from datetime import datetime

logger = logging.getLogger(__name__)

class HuggingFaceAIService:
    """Service to interact with Hugging Face Spaces AI model"""
    
    def __init__(self, base_url: str = None):
        # You'll update this URL once you deploy to Hugging Face
        self.base_url = base_url or "https://your-username-finlytics-ai.hf.space"
        self.timeout = 60  # seconds
        
    async def health_check(self) -> bool:
        """Check if the AI service is healthy"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.base_url}/health", timeout=self.timeout) as response:
                    return response.status == 200
        except Exception as e:
            logger.error(f"AI service health check failed: {str(e)}")
            return False
    
    async def wake_up_service(self) -> bool:
        """Wake up the Hugging Face Space if it's sleeping"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.base_url}/wake", timeout=self.timeout) as response:
                    return response.status == 200
        except Exception as e:
            logger.error(f"Failed to wake up AI service: {str(e)}")
            return False
    
    async def predict_stock(self, symbol: str, periods: int = 30, data: Optional[List] = None) -> Dict[str, Any]:
        """Get stock prediction from AI service"""
        try:
            payload = {
                "symbol": symbol.upper(),
                "periods": periods
            }
            if data:
                payload["data"] = data
            
            # First try to wake up the service
            await self.wake_up_service()
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/predict", 
                    json=payload,
                    timeout=self.timeout
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        logger.info(f"Successfully got prediction for {symbol}")
                        return result
                    else:
                        error_text = await response.text()
                        logger.error(f"AI service error {response.status}: {error_text}")
                        return self._fallback_prediction(symbol, periods)
                        
        except asyncio.TimeoutError:
            logger.warning(f"AI service timeout for {symbol}, using fallback")
            return self._fallback_prediction(symbol, periods)
        except Exception as e:
            logger.error(f"Error calling AI service for {symbol}: {str(e)}")
            return self._fallback_prediction(symbol, periods)
    
    async def batch_predict(self, symbols: List[str], periods: int = 30) -> Dict[str, Any]:
        """Get batch predictions from AI service"""
        try:
            payload = {
                "symbols": [s.upper() for s in symbols],
                "periods": periods
            }
            
            # Wake up service first
            await self.wake_up_service()
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/batch_predict",
                    json=payload,
                    timeout=self.timeout * 2  # Longer timeout for batch requests
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        logger.info(f"Successfully got batch predictions for {len(symbols)} symbols")
                        return result
                    else:
                        error_text = await response.text()
                        logger.error(f"Batch prediction error {response.status}: {error_text}")
                        return self._fallback_batch_prediction(symbols, periods)
                        
        except Exception as e:
            logger.error(f"Error in batch prediction: {str(e)}")
            return self._fallback_batch_prediction(symbols, periods)
    
    def _fallback_prediction(self, symbol: str, periods: int) -> Dict[str, Any]:
        """Fallback prediction when AI service is unavailable"""
        import random
        from datetime import datetime, timedelta
        
        predictions = []
        base_price = 150.0 + random.uniform(-50, 50)
        current_price = base_price
        
        for i in range(periods):
            change_percent = random.uniform(-0.05, 0.05)  # 5% daily volatility
            current_price *= (1 + change_percent)
            
            predictions.append({
                "date": (datetime.now() + timedelta(days=i+1)).strftime("%Y-%m-%d"),
                "predicted_price": round(current_price, 2),
                "confidence_lower": round(current_price * 0.9, 2),
                "confidence_upper": round(current_price * 1.1, 2)
            })
        
        return {
            "symbol": symbol,
            "periods": periods,
            "predictions": predictions,
            "model_used": "fallback",
            "generated_at": datetime.now().isoformat(),
            "note": "AI service unavailable, using fallback predictions"
        }
    
    def _fallback_batch_prediction(self, symbols: List[str], periods: int) -> Dict[str, Any]:
        """Fallback batch prediction"""
        results = {}
        for symbol in symbols:
            results[symbol] = self._fallback_prediction(symbol, periods)
        
        return {
            "batch_results": results,
            "total_symbols": len(symbols),
            "successful_predictions": len(symbols),
            "generated_at": datetime.now().isoformat(),
            "note": "Using fallback predictions"
        }

# Global AI service instance
ai_service = HuggingFaceAIService()

# Utility functions for backward compatibility
async def get_stock_prediction(symbol: str, periods: int = 30) -> Dict[str, Any]:
    """Get stock prediction - main function to use in your routes"""
    return await ai_service.predict_stock(symbol, periods)

async def get_batch_predictions(symbols: List[str], periods: int = 30) -> Dict[str, Any]:
    """Get batch predictions"""
    return await ai_service.batch_predict(symbols, periods)