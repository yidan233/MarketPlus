#!/usr/bin/env python3
from app.data.symbols import get_stock_symbols
from app.data.yfinance_fetcher import fetch_yfinance_data
from app.screener.screener import setup_initial_database_load


def test_setup_initial_database_load():
    setup_initial_database_load()
    # Add assertions or checks here to verify the database state
    print("Initial database load completed.")


def main():
    test_setup_initial_database_load()
    
if __name__ == "__main__":
    main()