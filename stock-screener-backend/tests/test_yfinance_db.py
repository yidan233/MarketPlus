import sys
import os
import pandas as pd

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import get_db_session
from app.database.models import Stock, HistoricalPrice
from app.data.yfinance_fetcher import _fetch_fresh_data
from app.data.db_utils import save_to_database, load_from_database
import unittest
import logging

logger = logging.getLogger(__name__)

def test_save_and_load():
    """Test saving and loading stock data"""
    symbol = "AAPL"
    
    # Test data
    test_data = {
        'symbol': symbol,
        'name': 'Apple Inc.',
        'current_price': 150.0,
        'market_cap': 2500000000000
    }
    
    # Save to database
    with get_db_session() as db:
        save_to_database(symbol, test_data)
        logger.info(f"✅ Saved test data for {symbol}")
        
        # Load from database
        loaded_data = load_from_database(symbol)
        if loaded_data:
            logger.info(f"✅ Loaded data for {symbol}: {loaded_data}")
        else:
            logger.error(f"❌ Failed to load data for {symbol}")

if __name__ == "__main__":
    test_save_and_load()