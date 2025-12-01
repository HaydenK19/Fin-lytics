# Finlytics AI Model Service
# Hugging Face Spaces Deployment

This space provides stock prediction services for the Finlytics application using AutoGluon time series models.

## Features
- Stock price prediction using AutoGluon
- RESTful API for integration with Finlytics backend
- Automatic model loading and caching
- Health checks and monitoring

## API Endpoints

### Health Check
```
GET /health
```

### Stock Prediction  
```
POST /predict
{
    "symbol": "AAPL",
    "periods": 30,
    "data": [...] // Historical price data
}
```

### Model Info
```
GET /models
```

## Usage
This service is automatically called by the Finlytics backend when users request stock predictions.

## Local Development
```bash
pip install -r requirements.txt
python app.py
```