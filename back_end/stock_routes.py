from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, status
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Settings
from auth import get_current_user
from pydantic import BaseModel
from polygon import RESTClient
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(
    prefix='/stocks',
    tags=['stocks']
)


polygonapi = RESTClient("POLYGON_API_KEY") 


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class StockRequest(BaseModel):
    ticker: str

class StockCustomBars(BaseModel):
    tick: str
    multiplier: int
    timeframe: str
    From: str
    To: str
    adjusted: bool
    sort: str
    limit: int

# WebSocket endpoint for retrieving the last quote.
@router.websocket("/ws/getlastquote")
async def websocket_lastquote(websocket: WebSocket):

    await websocket.accept()
    try:

        while True:
            data = await websocket.receive_json()

            try:
                request = StockRequest(**data)
            except Exception as validation_error:
                await websocket.send_json({"error": "Invalid data format", "detail": str(validation_error)})
                continue


            try:
                quote = polygonapi.get_last_quote(request.ticker)

                await websocket.send_json(quote)
            except Exception as api_error:

                await websocket.send_json({"error": "Failed to fetch quote", "detail": str(api_error)})
    except WebSocketDisconnect:

        print("Client disconnected from /ws/getlastquote")


@router.websocket("/ws/getcustombars")
async def websocket_custombars(websocket: WebSocket):

    await websocket.accept()
    try:
        while True:

            data = await websocket.receive_json()

            try:
                request = StockCustomBars(**data)
            except Exception as validation_error:
                await websocket.send_json({"error": "Invalid data format", "detail": str(validation_error)})
                continue

            try:
                custombars = polygonapi.list_aggs(
                    request.tick,
                    request.multiplier,
                    request.timeframe,
                    request.From,
                    request.To,
                    request.adjusted,
                    request.sort,
                    request.limit
                )
                await websocket.send_json(custombars)
            except Exception as api_error:
                await websocket.send_json({"error": "Failed to fetch custom bars", "detail": str(api_error)})
    except WebSocketDisconnect:
        print("Client disconnected from /ws/getcustombars")





        @router.get("/news/{ticker}", status_code=status.HTTP_200_OK)
async def get_ticker_news(
    ticker: str,
    limit: Optional[int] = 10,
    order: Optional[str] = "desc",
    published_utc: Optional[str] = None
):
    """
    Retrieve recent news articles for a specific stock ticker.
    Optional query parameters:
      - limit: number of articles to return (default 10)
      - order: sort order 'asc' or 'desc' (default 'desc')
      - published_utc: filter articles published on or after this timestamp (ISO format)
    """
    try:
        if published_utc:
            news_iter = polygonapi.list_ticker_news(
                ticker,
                limit=limit,
                order=order,
                published_utc=published_utc
            )
        else:
            news_iter = polygonapi.list_ticker_news(
                ticker,
                limit=limit,
                order=order
            )
        # Convert Pydantic models to dicts
        news_list = [n.dict() for n in news_iter if isinstance(n, TickerNews)]
        return news_list
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@router.post("/predict/5", status_code=200)
def predict(req: PredictionRequest):
    if model is None:
        raise HTTPException(status_code=500, detail="Model not loaded")
    X = [[req.feature_a, req.feature_b, req.feature_c]]
    preds = model.predict(X)

    return {"prediction": preds.tolist()}