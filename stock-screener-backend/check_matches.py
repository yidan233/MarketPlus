#!/usr/bin/env python3
"""
Test script to check database info completeness and field availability
"""

import sys
import os
import pandas as pd
import yfinance as yf
from datetime import datetime
import time
import logging

# Add the project root to the path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

# Set up logging
logging.basicConfig(level=logging.INFO)

def safe_yfinance_fetch(symbol, period="1mo", interval="1d", max_retries=3):
    """Safely fetch data from yfinance with retry logic"""
    for attempt in range(max_retries):
        try:
            print(f"   Attempting to fetch {symbol} (attempt {attempt + 1})...")
            ticker = yf.Ticker(symbol)
            hist_data = ticker.history(period=period, interval=interval)
            
            if not hist_data.empty:
                print(f"   ✅ Successfully fetched {symbol}")
                return ticker
            else:
                print(f"   ⚠️ Empty data for {symbol}")
                return None
                
        except Exception as e:
            print(f"   ❌ Error fetching {symbol}: {e}")
            if "Rate limit" in str(e) or "Too Many Requests" in str(e):
                wait_time = (attempt + 1) * 5
                print(f"   ⏳ Rate limited. Waiting {wait_time} seconds...")
                time.sleep(wait_time)
            else:
                print(f"   ⚠️ Non-rate-limit error, retrying...")
                time.sleep(2)
    
    print(f"   ❌ Failed to fetch {symbol} after {max_retries} attempts")
    return None

def test_database_info_completeness():
    """Test what info is actually saved in the database for different symbols"""
    print("🔍 Testing Database Info Completeness")
    print("=" * 60)
    
    try:
        from app.database.models import Stock
        from app.database import SessionLocal
        
        session = SessionLocal()
        
        test_symbols = ["ZTS", "AAPL", "MSFT", "GOOGL", "AMZN", "MAR", "ZBH"]
        
        for symbol in test_symbols:
            stock = session.query(Stock).filter(Stock.symbol == symbol).first()
            if stock:
                print(f"\n📊 {symbol} database info:")
                print(f"   Has info dict: {stock.info is not None}")
                if stock.info:
                    print(f"   Info dict keys: {list(stock.info.keys())}")
                    print(f"   Info dict length: {len(stock.info)}")
                    
                    # Check for specific important fields
                    important_fields = [
                        'longBusinessSummary', 'profitMargins', 'sector', 'industry',
                        'marketCap', 'currentPrice', 'trailingPE', 'grossProfits',
                        'totalRevenue', 'revenueGrowth', 'earningsGrowth'
                    ]
                    for field in important_fields:
                        has_field = field in stock.info
                        value = stock.info.get(field, 'MISSING')
                        if has_field and value is not None:
                            print(f"   {field}: ✅ {value}")
                        else:
                            print(f"   {field}: ❌ MISSING")
                else:
                    print(f"   ❌ No info dict saved")
            else:
                print(f"   ❌ {symbol} not found in database")
        
        session.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")

def test_yfinance_vs_database():
    """Compare yfinance data vs what's saved in database"""
    print("\n🔍 Comparing yfinance vs Database Data")
    print("=" * 60)
    
    test_symbols = ["ZTS", "AAPL", "MAR", "ZBH"]
    
    for symbol in test_symbols:
        print(f"\n📊 Testing {symbol}:")
        print("-" * 40)
        
        # Test yfinance data
        print("   🔄 Fetching from yfinance...")
        ticker = safe_yfinance_fetch(symbol)
        if ticker:
            info = ticker.info
            if info:
                print(f"   yfinance info fields: {len(info)}")
                important_fields = ['longBusinessSummary', 'profitMargins', 'sector', 'industry']
                for field in important_fields:
                    has_field = field in info
                    value = info.get(field, 'MISSING')
                    if has_field and value is not None:
                        print(f"   yfinance {field}: ✅ {value}")
                    else:
                        print(f"   yfinance {field}: ❌ MISSING")
            else:
                print(f"   ❌ No yfinance info available")
        
        # Test database data
        print("   💾 Checking database...")
        try:
            from app.database.models import Stock
            from app.database import SessionLocal
            
            session = SessionLocal()
            stock = session.query(Stock).filter(Stock.symbol == symbol).first()
            
            if stock and stock.info:
                print(f"   Database info fields: {len(stock.info)}")
                for field in important_fields:
                    has_field = field in stock.info
                    value = stock.info.get(field, 'MISSING')
                    if has_field and value is not None:
                        print(f"   Database {field}: ✅ {value}")
                    else:
                        print(f"   Database {field}: ❌ MISSING")
            else:
                print(f"   ❌ No database data for {symbol}")
            
            session.close()
            
        except Exception as e:
            print(f"   ❌ Database error: {e}")
        
        # Add delay between symbols
        if symbol != test_symbols[-1]:
            print("   ⏳ Waiting 3 seconds...")
            time.sleep(3)

def test_zbh_specific():
    """Test ZBH specifically to understand why it might be missing company info"""
    print("\n🔍 Testing ZBH (Zimmer Biomet Holdings) Specifically")
    print("=" * 60)
    
    print("📊 Testing ZBH yfinance data:")
    print("-" * 40)
    
    try:
        ticker = yf.Ticker("ZBH")
        print("   ✅ Ticker created successfully")
        
        # Test different ways to get company description
        print("\n   🔍 Testing different methods to get company description:")
        
        # Method 1: Direct info access
        try:
            info = ticker.info
            if info:
                print(f"   Method 1 (ticker.info): {len(info)} fields")
                print(f"   Has longBusinessSummary: {'longBusinessSummary' in info}")
                if 'longBusinessSummary' in info:
                    print(f"   longBusinessSummary: {info['longBusinessSummary']}")
                else:
                    print(f"   Available fields: {list(info.keys())}")
                    
                    # Check for any business-related fields
                    business_fields = [k for k in info.keys() if any(term in k.lower() for term in ['business', 'company', 'description', 'summary', 'about'])]
                    if business_fields:
                        print(f"   Business-related fields found: {business_fields}")
                    else:
                        print(f"   No business-related fields found")
            else:
                print(f"   Method 1: No info available")
        except Exception as e:
            print(f"   Method 1 failed: {e}")
        
        # Method 2: Try different field names
        print("\n   🔍 Testing alternative field names:")
        alternative_fields = [
            'longBusinessSummary', 'businessSummary', 'description', 'companyDescription',
            'longDescription', 'summary', 'companySummary', 'about', 'companyAbout',
            'shortBusinessSummary', 'businessDescription'
        ]
        
        for field in alternative_fields:
            try:
                if hasattr(ticker, field):
                    value = getattr(ticker, field)
                    if value:
                        print(f"   {field}: ✅ {value}")
                    else:
                        print(f"   {field}: ❌ Empty/None")
                else:
                    print(f"   {field}: ❌ Not available")
            except Exception as e:
                print(f"   {field}: ❌ Error - {e}")
        
        # Method 3: Check if it's in a different attribute
        print("\n   🔍 Checking other ticker attributes:")
        ticker_attrs = [attr for attr in dir(ticker) if not attr.startswith('_')]
        print(f"   Available ticker attributes: {ticker_attrs}")
        
        # Method 4: Try to get company info from different sources
        print("\n   🔍 Testing company info methods:")
        try:
            # Try to get company info
            company_info = ticker.company_info
            if company_info:
                print(f"   company_info: ✅ {company_info}")
            else:
                print(f"   company_info: ❌ Not available")
        except Exception as e:
            print(f"   company_info: ❌ Error - {e}")
        
        # Method 5: Check if there are any other info-related methods
        print("\n    Testing other info methods:")
        try:
            # Try different info access methods
            if hasattr(ticker, 'get_info'):
                info_method = ticker.get_info()
                print(f"   get_info(): ✅ {info_method}")
            else:
                print(f"   get_info(): ❌ Not available")
        except Exception as e:
            print(f"   get_info(): ❌ Error - {e}")
        
    except Exception as e:
        print(f"   ❌ Error creating ZBH ticker: {e}")

def test_frontend_expected_fields():
    """Test what fields the frontend expects vs what's available"""
    print("\n🔍 Testing Frontend Expected Fields")
    print("=" * 60)
    
    # Fields that the frontend expects (from StockDetail.jsx)
    frontend_fields = [
        'marketCap', 'trailingPE', 'forwardPE', 'priceToBook', 'enterpriseValue',
        'enterpriseToEbitda', 'pegRatio', 'profitMargins', 'operatingMargins',
        'returnOnAssets', 'returnOnEquity', 'grossMargins', 'revenueGrowth',
        'earningsGrowth', 'ebitdaMargins', 'dividendYield', 'payoutRatio',
        'dividendRate', 'debtToEquity', 'currentRatio', 'quickRatio',
        'longBusinessSummary', 'shortBusinessSummary'
    ]
    
    try:
        from app.database.models import Stock
        from app.database import SessionLocal
        
        session = SessionLocal()
        
        test_symbols = ["ZTS", "AAPL", "MSFT", "MAR", "ZBH"]
        
        for symbol in test_symbols:
            stock = session.query(Stock).filter(Stock.symbol == symbol).first()
            if stock and stock.info:
                print(f"\n📊 {symbol} frontend field availability:")
                available_count = 0
                for field in frontend_fields:
                    has_field = field in stock.info and stock.info[field] is not None
                    if has_field:
                        available_count += 1
                        print(f"   ✅ {field}")
                    else:
                        print(f"   ❌ {field}")
                
                print(f"   📈 Coverage: {available_count}/{len(frontend_fields)} ({available_count/len(frontend_fields)*100:.1f}%)")
            else:
                print(f"\n❌ {symbol}: No database data available")
        
        session.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    print("🚀 Starting Database Info Analysis...")
    print("⚠️ Note: This test includes delays to avoid yfinance rate limiting")
    
    # Test 1: Database info completeness (including ZBH)
    test_database_info_completeness()
    
    # Test 2: Compare yfinance vs database (including ZBH)
    test_yfinance_vs_database()
    
    # Test 3: ZBH specific test
    test_zbh_specific()
    
    # Test 4: Frontend field availability (including ZBH)
    test_frontend_expected_fields()
    
    print("\n✅ Analysis complete!")
