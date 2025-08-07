import pandas as pd
import yfinance as yf
import logging
import time
from datetime import datetime
from app.data.redis_cache import get_stock_data, set_stock_data
import copy 
import threading

logger = logging.getLogger(__name__)

# use yfinance to fetech data info 
# default: period = 1 year, interval = 1d 
def refresh_cache_async(symbols, period, interval, save_to_db):
    # This function runs in a background thread
    fresh_data = _fetch_fresh_data(symbols, period, interval)
    for symbol, data in fresh_data.items():
        if save_to_db:
            save_to_db(symbol, data)
        set_stock_data(symbol, data)

def fetch_yfinance_data(symbols, period="1y", interval="1d", reload=False, load_from_db=None, save_to_db=None):
    result = {}
    symbols_to_fetch = []

    if isinstance(symbols, str):
        symbols = [symbols]

    for symbol in symbols:
        if reload:
            # User explicitly wants fresh data - BLOCK and wait
            symbols_to_fetch.append(symbol)
            continue

        # 1. Try Redis cache
        cached_data = get_stock_data(symbol)
        if cached_data:
            result[symbol] = cached_data
            continue

        # 2. Redis cache failed? Try DB cache
        db_data = load_from_db(symbol) if load_from_db else None
        if db_data:
            result[symbol] = db_data
            # Cache expired but we have DB data - refresh in background
            threading.Thread(
                target=refresh_cache_async,
                args=([symbol], period, interval, save_to_db),
                daemon=True
            ).start()
            continue

        # 3. No cache or DB data - BLOCK and fetch (user needs data)
        symbols_to_fetch.append(symbol)

    # Fetch fresh data for symbols that need it (blocking)
    if symbols_to_fetch:
        fresh_data = _fetch_fresh_data(symbols_to_fetch, period, interval)
        for symbol, data in fresh_data.items():
            if data:
                result[symbol] = data
                if save_to_db:
                    save_to_db(symbol, data)
                set_stock_data(symbol, data)

    return result

def _fetch_fresh_data(symbols, period="1y", interval="1d"):
    result = {}

    if isinstance(symbols, str):
        symbols = [symbols]
    
    batch_size = 20
    symbol_batches = [symbols[i:i + batch_size] for i in range(0, len(symbols), batch_size)]

    for batch in symbol_batches:
        try:
            tickers_str = batch[0] if len(batch) == 1 else batch

            data = yf.download(
                tickers=tickers_str,
                period=period,
                interval=interval,
                group_by='ticker',
                auto_adjust=True,
                prepost=False,
                threads=True
            )

            for symbol in batch:
                try:
                    symbol_data = data if len(batch) == 1 else data[symbol]
                    if symbol_data.empty:
                        logger.warning(f"No data available for {symbol}")
                        continue

                    symbol_data = symbol_data.dropna()
                    if symbol_data.empty:
                        logger.warning(f"No valid data available for {symbol} after removing NaN values")
                        continue
                    
                    # Standardize the return result 
                    # somtimes its like ("AAPL", "CLOSE") -> AAPL_CLOSE 
                    if isinstance(symbol_data.columns, pd.MultiIndex):
                        symbol_data.columns = ['_'.join(col).strip() if isinstance(col, tuple) else col for col in symbol_data.columns.values]
                        logger.info(f"Flattened MultiIndex columns for {symbol}: {symbol_data.columns.tolist()}")
                    
                    column_rename_map = {}
                    for col in symbol_data.columns:
                        if col.startswith(f'{symbol}_'):
                            standard_col_name = col[len(f'{symbol}_'):] # AAPL_CLOSE -> CLOSE
                            column_rename_map[col] = standard_col_name
                    
                    if column_rename_map:
                        symbol_data = symbol_data.rename(columns=column_rename_map)
                        logger.info(f"Renamed symbol-prefixed columns for {symbol}: {symbol_data.columns.tolist()}")

                    result[symbol] = {
                        'historical': symbol_data,
                        'last_updated': datetime.now().isoformat()
                    }

                    # NEW: More resilient info fetching
                    info = {'symbol': symbol}  # Start with basic info
                    
                    try:
                        ticker = yf.Ticker(symbol)
                        
                        # Try to fetch the full info dict first
                        try:
                            full_info = ticker.info
                            if full_info and isinstance(full_info, dict):
                                info.update(full_info)
                                logger.info(f"Successfully fetched full info for {symbol} ({len(full_info)} fields)")
                            else:
                                logger.warning(f"Full info fetch returned empty/invalid data for {symbol}")
                        except Exception as e:
                            logger.warning(f"Full info fetch failed for {symbol}: {e}")
                        
                        # If full info failed, try fetching individual important fields
                        if len(info) <= 1:  # Only has symbol
                            logger.info(f"Attempting individual field fetch for {symbol}")
                            
                            # Define important fields to try individually
                            important_fields = [
                                'longBusinessSummary', 'sector', 'industry', 'marketCap', 
                                'currentPrice', 'trailingPE', 'profitMargins', 'grossProfits',
                                'totalRevenue', 'revenueGrowth', 'earningsGrowth'
                            ]
                            
                            for field in important_fields:
                                try:
                                    # Try different methods to get the field
                                    if hasattr(ticker, field):
                                        value = getattr(ticker, field)
                                        if value is not None:
                                            info[field] = value
                                    elif hasattr(ticker, 'info') and hasattr(ticker.info, 'get'):
                                        value = ticker.info.get(field)
                                        if value is not None:
                                            info[field] = value
                                except Exception as e:
                                    logger.debug(f"Failed to fetch {field} for {symbol}: {e}")
                                    continue
                        
                        result[symbol]['info'] = info
                        
                    except Exception as e:
                        logger.error(f"Could not create ticker for {symbol}: {e}")
                        result[symbol]['info'] = {'symbol': symbol}
                    
                    # Fetch financial statements (keep existing logic)
                    try:
                        ticker = yf.Ticker(symbol)
                        result[symbol]['financials'] = {
                            'income_statement': ticker.income_stmt,
                            'balance_sheet': ticker.balance_sheet,
                            'cash_flow': ticker.cashflow
                        }
                    except Exception as e:
                        logger.warning(f"Could not fetch financial statements for {symbol}: {e}")
                        
                except Exception as e:
                    logger.error(f"Error processing data for {symbol}: {e}")
            time.sleep(1)
        except Exception as e:
            logger.error(f"Error fetching data for batch {batch}: {e}")
    return result 
