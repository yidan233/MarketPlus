import time
from app.data.redis_cache import get_price
from app.screener.fundamental import screen_stocks
from app.data.db_utils import load_from_database
from app.database import SessionLocal

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
stock_data = {symbol: {"info": load_from_database(symbol, SessionLocal)}}
criteria = {"price": (">", 100)}

results = screen_stocks(stock_data, criteria)
print("Screen results:", results)