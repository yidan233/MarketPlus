import time
from app.database.connection import SessionLocal
from app.database.models import Stock
from app.data.yfinance_fetcher import _fetch_fresh_data
from app.data.redis_cache import set_price


REFRESH_INTERVAL = 60

def get_all_symbols():
    session = SessionLocal()
    try:
        symbols = [stock.symbol for stock in session.query(Stock.symbol).all()]
        return symbols
    finally:
        session.close()

def fetch_and_cache_prices():
    symbols = get_all_symbols()
    if not symbols:
        print("No symbols found in database.")
        return
    print(f"Fetching prices for {len(symbols)} symbols...")

    fresh_data = _fetch_fresh_data(symbols, period="1d", interval="1m")
    for symbol, data in fresh_data.items():
        try:
            hist = data.get('historical')
            if hist is not None and not hist.empty:
                latest_price = hist['Close'].iloc[-1]
                set_price(symbol, latest_price)
                print(f"Updated Redis: {symbol} = {latest_price}")
            else:
                print(f"No historical data for {symbol}")
        except Exception as e:
            print(f"Error updating price for {symbol}: {e}")

def main():
    print("Starting price worker...")
    while True:
        fetch_and_cache_prices()
        print(f"Sleeping for {REFRESH_INTERVAL} seconds...")
        time.sleep(REFRESH_INTERVAL)

if __name__ == "__main__":
    main() 