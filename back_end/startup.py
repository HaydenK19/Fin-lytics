"""
Startup script to initialize the prediction service when the backend starts
"""
import logging
import threading
from stock_prediction_service import prediction_service
from eod_updater import eod_updater

logger = logging.getLogger(__name__)

def initialize_prediction_service():
    """Initialize the prediction service on startup in a background thread"""
    def _load_in_background():
        try:
            logger.info("Starting prediction service initialization in background...")
            # Load the model (this can take time, so it's in a background thread)
            if prediction_service.load_model():
                logger.info("Prediction service initialized successfully")
                # Optionally start predictions for default tickers
                tickers = prediction_service.get_daily_prediction_tickers()
                if tickers:
                    prediction_service.start_predictions(tickers)
                    logger.info(f"Started prediction service for tickers: {tickers}")
                else:
                    logger.warning("No tickers available to start prediction service")
            else:
                logger.warning("Failed to initialize prediction service - model could not be loaded. Predictions will not be available until model is loaded.")
        except Exception as e:
            logger.error(f"Error initializing prediction service: {e}", exc_info=True)
    
    # Run model loading in background thread to avoid blocking startup
    # Use daemon=True so it doesn't prevent server shutdown
    thread = threading.Thread(target=_load_in_background, daemon=True, name="PredictionServiceInit")
    thread.start()
    logger.info("Model loading started in background thread - server will continue starting")

def cleanup_prediction_service():
    """Cleanup the prediction service on shutdown"""
    try:
        eod_updater.stop()
    except Exception:
        pass
    try:
        prediction_service.stop_predictions()
        logger.info("Prediction service cleaned up successfully")
    except Exception as e:
        logger.error(f"Error cleaning up prediction service: {e}")