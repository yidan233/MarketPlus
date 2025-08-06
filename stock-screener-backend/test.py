# Debug script for DataFrame structure issue

import sys
import os
import pandas as pd
import yfinance as yf
from datetime import datetime

# Add the current directory to the path since we're in the root
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

from app.data.db_utils import save_to_database
from app.database import SessionLocal  # Fixed import

def test_dataframe_structure():
    """Test to understand the DataFrame structure issue"""
    print("🔍 Testing DataFrame structure...")
    
    # Fetch AAPL data
    ticker = yf.Ticker("AAPL")
    hist_data = ticker.history(period="1mo", interval="1d")
    
    print(f"1. Original DataFrame:")
    print(f"   Shape: {hist_data.shape}")
    print(f"   Columns: {list(hist_data.columns)}")
    print(f"   Index: {type(hist_data.index)}")
    print(f"   First few rows:")
    print(hist_data.head())
    
    # Test the problematic section
    print(f"\n2. Testing reset_index():")
    hist_df = hist_data.reset_index()
    print(f"   After reset_index() - columns: {list(hist_df.columns)}")
    print(f"   After reset_index() - first row:")
    print(hist_df.head(1))
    
    # Test the specific problematic line
    print(f"\n3. Testing the problematic iteration:")
    for idx, row in hist_df.iterrows():
        print(f"   Row {idx}:")
        print(f"     row['Date'] type: {type(row['Date'])}")
        print(f"     row['Date'] value: {row['Date']}")
        print(f"     row['Open'] type: {type(row['Open'])}")
        print(f"     row['Open'] value: {row['Open']}")
        
        # Test the problematic line
        date_val = row['Date'].iloc[0] if isinstance(row['Date'], pd.Series) else row['Date']
        print(f"     date_val after processing: {date_val}")
        print(f"     date_val type: {type(date_val)}")
        break

def test_save_to_database_debug():
    """Test save_to_database with detailed debugging"""
    print(f"\n🔍 Testing save_to_database with debugging...")
    
    # Create test data
    ticker = yf.Ticker("AAPL")
    hist_data = ticker.history(period="1mo", interval="1d")
    info = ticker.info
    
    test_data = {
        'historical': hist_data,
        'info': info
    }
    
    print(f"1. Test data prepared:")
    print(f"   - historical type: {type(test_data['historical'])}")
    print(f"   - historical shape: {test_data['historical'].shape}")
    
    # Try to save with detailed error handling
    try:
        save_to_database("AAPL", test_data, SessionLocal)
        print("✅ Successfully saved to database!")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

def test_multiple_symbols():
    """Test with multiple symbols to reproduce the original error"""
    print(f"\n🔍 Testing multiple symbols (like the original error)...")
    
    # Test with the symbols that were in the original error log
    symbols = ["BA", "CAT", "CVX", "CSCO", "KO", "DIS", "GS", "HD", "HON", "IBM", "JNJ", "JPM", "MCD", "MRK", "NKE", "NVDA", "PG", "CRM", "SHW", "TRV", "UNH", "VZ", "V"]
    
    for symbol in symbols[:5]:  # Test first 5 to avoid too many API calls
        print(f"\nTesting {symbol}...")
        try:
            ticker = yf.Ticker(symbol)
            hist_data = ticker.history(period="1mo", interval="1d")
            info = ticker.info
            
            test_data = {
                'historical': hist_data,
                'info': info
            }
            
            save_to_database(symbol, test_data, SessionLocal)
            print(f"✅ Successfully saved {symbol} to database!")
            
        except Exception as e:
            print(f"❌ Error saving {symbol}: {e}")
            import traceback
            traceback.print_exc()

def test_original_scenario():
    """Test the original scenario that was causing the error"""
    print(f"\n🔍 Testing original scenario (auto_setup_db=True)...")
    
    try:
        from app.screener.screener import StockScreener
        from app.data import get_stock_symbols
        
        # Create screener with auto_setup_db=True (the original scenario)
        screener = StockScreener(auto_setup_db=True)
        print("✅ StockScreener created with auto_setup_db=True")
        
    except Exception as e:
        print(f"❌ Error in original scenario: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_dataframe_structure()
    test_save_to_database_debug()
    test_multiple_symbols()
    test_original_scenario()
