import httpx
import asyncio
import logging
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

class HuggingFaceAIClient:
    def __init__(self, hf_api_url: str = None):
        # This will be your Hugging Face Space URL
        self.hf_api_url = hf_api_url or "https://your-username-finlytics-ai.hf.space"
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def predict_stock(self, symbol: str, days_ahead: int = 5) -> Optional[Dict]:
        """
        Call Hugging Face AI service for stock predictions
        """
        try:
            url = f"{self.hf_api_url}/api/predict"
            
            payload = {
                "symbol": symbol.upper(),
                "days_ahead": days_ahead
            }
            
            response = await self.client.post(url, json=payload)
            response.raise_for_status()
            
            result = response.json()
            logger.info(f"Received prediction for {symbol} from Hugging Face")
            return result
            
        except httpx.RequestError as e:
            logger.error(f"Request to Hugging Face failed: {e}")
            return None
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error from Hugging Face: {e.response.status_code}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error calling Hugging Face: {e}")
            return None
    
    async def batch_predict(self, symbols: List[str], days_ahead: int = 5) -> Dict[str, Optional[Dict]]:
        """
        Batch predictions for multiple symbols
        """
        tasks = [
            self.predict_stock(symbol, days_ahead) 
            for symbol in symbols
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        return {
            symbol: result if not isinstance(result, Exception) else None
            for symbol, result in zip(symbols, results)
        }
    
    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()

# Global client instance
hf_client = HuggingFaceAIClient()

# Convenience functions
async def get_stock_prediction(symbol: str, periods: int = 5) -> Optional[Dict]:
    """Get prediction for a single stock"""
    return await hf_client.predict_stock(symbol, periods)

async def get_batch_predictions(symbols: List[str], periods: int = 5) -> Dict[str, Optional[Dict]]:
    """Get predictions for multiple stocks"""
    return await hf_client.batch_predict(symbols, periods)

# For backward compatibility
ai_service = hf_client