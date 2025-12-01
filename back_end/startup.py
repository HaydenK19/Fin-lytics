"""
Startup script to initialize the prediction service when the backend starts
"""
import logging
from stock_prediction_service_lite import start_prediction_service, stop_prediction_service

logger = logging.getLogger(__name__)

def initialize_prediction_service():
    """Initialize the prediction service on startup (using Hugging Face AI service)"""
    try:
        logger.info("Initializing Finlytics prediction service with Hugging Face AI")
        
        # Start the lightweight prediction service
        start_prediction_service()
        logger.info("Prediction service started successfully")
        
    except Exception as e:
        logger.error(f"Error initializing prediction service: {e}")

def cleanup_prediction_service():
    """Cleanup the prediction service on shutdown"""
    try:
        stop_prediction_service()
        logger.info("Prediction service cleaned up successfully")
    except Exception as e:
        logger.error(f"Error cleaning up prediction service: {e}")

