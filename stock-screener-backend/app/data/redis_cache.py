import redis
import json
import pandas as pd
import numpy as np
from app.config import REDIS_URL

# Connect to Redis using REDIS_URL directly instead of parsed individual variables
def get_redis_client():
    if REDIS_URL:
        # Parse REDIS_URL to get connection details
        from urllib.parse import urlparse
        parsed = urlparse(REDIS_URL)
        
        # Extract Redis connection details from URL
        host = parsed.hostname
        port = parsed.port or 6379
        db = int(parsed.path.lstrip('/') or 0)
        
        # Handle password if present
        if parsed.password:
            return redis.StrictRedis(
                host=host, 
                port=port, 
                db=db, 
                password=parsed.password,
                decode_responses=True
            )
        else:
            return redis.StrictRedis(
                host=host, 
                port=port, 
                db=db, 
                decode_responses=True
            )
    else:
        # Fallback to individual variables only if REDIS_URL is missing
        from app.config import REDIS_HOST, REDIS_PORT, REDIS_DB
        return redis.StrictRedis(
            host=REDIS_HOST, 
            port=REDIS_PORT, 
            db=REDIS_DB, 
            decode_responses=True
        )

# Create Redis client
redis_client = get_redis_client()

# ex: APPL -> price:APPL
def _price_key(symbol):
    return f"price:{symbol.upper()}"

# Get price from Redis cache
def get_price(symbol):
    price = redis_client.get(_price_key(symbol))
    if price is not None:
        try:
            return float(price)
        except ValueError:
            return None
    return None

# time to live 
def set_price(symbol, price):
    redis_client.set(_price_key(symbol), price) 

def _stock_data_key(symbol):
    return f"stockdata:{symbol.upper()}"

def make_json_serializable(obj):

    if isinstance(obj, pd.DataFrame):
        json_str = obj.to_json(orient="split", date_format="iso")
        return json_str

    elif isinstance(obj, (pd.Timestamp, np.datetime64)):
        return str(obj)

    elif isinstance(obj, dict):
        return {
            str(make_json_serializable(k)): make_json_serializable(v)
            for k, v in obj.items()
        }

    elif isinstance(obj, list):
        return [make_json_serializable(i) for i in obj]

    else:
        return obj


def set_stock_data(symbol, data, ttl=172800):  # 2 days
    serializable_data = make_json_serializable(data)
    redis_client.setex(_stock_data_key(symbol), ttl, json.dumps(serializable_data))

def get_stock_data(symbol):
    value = redis_client.get(_stock_data_key(symbol))
    if value is not None:
        try:
            return json.loads(value)
        except Exception:
            return None
    return None 