import time
from app.data.redis_cache import get_price
from app.screener.fundamental import screen_stocks
from app.data.db_utils import load_from_database
from app.database import get_db_session
from app.database.models import Stock, HistoricalPrice
from app.data.redis_cache import get_stock_data, set_stock_data
import unittest
import logging

logger = logging.getLogger(__name__)

symbol = "AAPL"

# Wait a bit to ensure the worker has had time to fetch and save prices
print("Waiting for price_worker to update Redis...")

# Fetch the price from Redis
price = get_price(symbol)
print(f"Price for {symbol} from Redis: {price}")

if price is not None:
    print("✅ Successfully fetched price from Redis (set by background worker).")
else:
    print("❌ Price not found in Redis. Is the worker running and is the symbol in your DB?")

# Use empty info to force Redis usage, or load from DB for fallback
stock_data = {symbol: {"info": load_from_database(symbol, get_db_session())}}
criteria = {"price": (">", 100)}

results = screen_stocks(stock_data, criteria)
print("Screen results:", results)

def test_redis_integration():
    """Test Redis cache integration with database"""
    symbol = "AAPL"
    
    # Test data
    test_data = {
        'symbol': symbol,
        'name': 'Apple Inc.',
        'current_price': 150.0,
        'market_cap': 2500000000000
    }
    
    # Test setting data in Redis
    set_stock_data(symbol, test_data)
    logger.info(f"✅ Set test data in Redis for {symbol}")
    
    # Test getting data from Redis
    cached_data = get_stock_data(symbol)
    if cached_data:
        logger.info(f"✅ Retrieved data from Redis for {symbol}: {cached_data}")
    else:
        logger.error(f"❌ Failed to retrieve data from Redis for {symbol}")
    
    # Test database integration
    with get_db_session() as db:
        stock = db.query(Stock).filter_by(symbol=symbol.upper()).first()
        if stock:
            stock_data = {symbol: {"info": stock.info}}
            logger.info(f"✅ Retrieved stock data from database for {symbol}")
        else:
            logger.error(f"❌ Failed to retrieve stock data from database for {symbol}")

if __name__ == "__main__":
    test_redis_integration()