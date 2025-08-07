import pandas as pd
from datetime import datetime, timedelta
import logging
from app.database.models import Stock, HistoricalPrice
from io import StringIO

# for interacting with database 

logger = logging.getLogger(__name__)

def load_from_database(symbol, session_factory, max_age_days=7):
    session = session_factory()
    try:
        # make sure not expired 
        cutoff_date = datetime.now().date() - timedelta(days=max_age_days)
        recent_count = session.query(HistoricalPrice)\
            .filter(HistoricalPrice.symbol == symbol)\
            .filter(HistoricalPrice.date >= cutoff_date)\
            .count()
        
        if recent_count < 1:
            return None
        
        historical_prices = session.query(HistoricalPrice)\
            .filter(HistoricalPrice.symbol == symbol)\
            .order_by(HistoricalPrice.date)\
            .all()
        
        if not historical_prices:
            return None
        data = []
        # loads all info to a dataframe 
        for price in historical_prices:
            data.append({
                'Date': price.date,
                'Open': price.open,
                'High': price.high,
                'Low': price.low,
                'Close': price.close,
                'Volume': price.volume,
                'Adj Close': price.adj_close
            })

        df = pd.DataFrame(data)
        df['Date'] = pd.to_datetime(df['Date'])
        df.set_index('Date', inplace=True)

   
        stock = session.query(Stock).filter(Stock.symbol == symbol).first()

        stock_info = {
            'symbol': symbol,
            'shortName': stock.name if stock else symbol,
            'sector': stock.sector if stock else 'Unknown',
            'industry': stock.industry if stock else None,
            'marketCap': stock.market_cap if stock else None,
            'currentPrice': stock.current_price if stock else None,
            'peRatio': stock.pe_ratio if stock else None,
            'dividendYield': stock.dividend_yield if stock else None,
            'beta': stock.beta if stock else None,
        }

        if stock and stock.info:
            stock_info.update(stock.info)

        return {
            'historical': df,
            'info': stock_info,
            'last_updated': datetime.now().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Error loading {symbol} from database: {e}")
        return None
    
    finally:
        session.close()

def save_to_database(symbol, data, session_factory):
    session = session_factory()
    from app.database.models import Stock, HistoricalPrice
    try:
        info = data.get('info', {})
        stock = session.query(Stock).filter(Stock.symbol == symbol).first()

        # query from yfinance 
        stock_fields = dict(
            symbol=symbol,
            name=info.get('shortName', symbol),
            sector=info.get('sector', None),
            industry=info.get('industry', None),
            market_cap=info.get('marketCap', None),
            current_price=info.get('currentPrice', None),
            pe_ratio=info.get('trailingPE', None),
            dividend_yield=info.get('dividendYield', None),
            beta=info.get('beta', None),
            info=info
        )

        # if stock not exist, create the entry based on fetched from yfinance 
        if not stock:
            stock = Stock(**stock_fields)
            session.add(stock)

        # if exist, update the field with fetched from yfinance  
        else:
            for k, v in stock_fields.items():
                setattr(stock, k, v)

        session.query(HistoricalPrice).filter(HistoricalPrice.symbol == symbol).delete()

        historical = data.get('historical')
        # Convert list back to DataFrame if needed
        if isinstance(historical, str):
            # Convert JSON string back to DataFrame
            historical = pd.read_json(StringIO(historical), orient="split")
        if historical is not None and not historical.empty:
            # Now you can safely use DataFrame methods
            hist_df = historical.reset_index()
            if 'index' in hist_df.columns:
                hist_df = hist_df.rename(columns={'index': 'Date'})
            prices_to_add = []
            
            for _, row in hist_df.iterrows():
                try:
                    # Handle potential MultiIndex columns
                    date_val = row['Date']
                    if isinstance(date_val, pd.Series):
                        date_val = date_val.iloc[0]
                    
                    date_obj = pd.to_datetime(date_val).date() if not isinstance(date_val, datetime) else date_val.date()
                    
                    # Get all available columns for debugging
                    available_columns = list(row.index)
                    logger.debug(f"{symbol}: Available columns: {available_columns}")
                    
                    # Helper function to find column by pattern
                    def find_column_value(row, column_patterns):
                        """Find column value by trying multiple patterns"""
                        for pattern in column_patterns:
                            if pattern in row:
                                return row[pattern]
                        return None
                    
                    # Define all possible column patterns for each field
                    open_patterns = [
                        'Open',  # Standard
                        f'{symbol}_Open',  # Symbol prefix
                        ('Open',),  # Tuple format
                        (symbol, 'Open'),  # Symbol tuple
                        f'Open_{symbol}',  # Reverse prefix
                        'OPEN',  # Uppercase
                        'open'   # Lowercase
                    ]
                    
                    high_patterns = [
                        'High',
                        f'{symbol}_High',
                        ('High',),
                        (symbol, 'High'),
                        f'High_{symbol}',
                        'HIGH',
                        'high'
                    ]
                    
                    low_patterns = [
                        'Low',
                        f'{symbol}_Low',
                        ('Low',),
                        (symbol, 'Low'),
                        f'Low_{symbol}',
                        'LOW',
                        'low'
                    ]
                    
                    close_patterns = [
                        'Close',
                        f'{symbol}_Close',
                        ('Close',),
                        (symbol, 'Close'),
                        f'Close_{symbol}',
                        'CLOSE',
                        'close'
                    ]
                    
                    volume_patterns = [
                        'Volume',
                        f'{symbol}_Volume',
                        ('Volume',),
                        (symbol, 'Volume'),
                        f'Volume_{symbol}',
                        'VOLUME',
                        'volume'
                    ]
                    
                    adj_close_patterns = [
                        'Adj Close',
                        f'{symbol}_Adj Close',
                        ('Adj Close',),
                        (symbol, 'Adj Close'),
                        f'Adj Close_{symbol}',
                        'ADJ CLOSE',
                        'adj close',
                        'Adj_Close',
                        f'{symbol}_Adj_Close',
                        ('Adj_Close',),
                        (symbol, 'Adj_Close')
                    ]
                    
                    # Try to find values using patterns
                    open_val = find_column_value(row, open_patterns)
                    high_val = find_column_value(row, high_patterns)
                    low_val = find_column_value(row, low_patterns)
                    close_val = find_column_value(row, close_patterns)
                    volume_val = find_column_value(row, volume_patterns)
                    adj_close_val = find_column_value(row, adj_close_patterns)
                    
                    # If still not found, try fuzzy matching
                    if open_val is None:
                        open_columns = [col for col in available_columns if 'open' in str(col).lower()]
                        if open_columns:
                            open_val = row[open_columns[0]]
                            logger.debug(f"{symbol}: Found Open via fuzzy match: {open_columns[0]}")
                    
                    if high_val is None:
                        high_columns = [col for col in available_columns if 'high' in str(col).lower()]
                        if high_columns:
                            high_val = row[high_columns[0]]
                            logger.debug(f"{symbol}: Found High via fuzzy match: {high_columns[0]}")
                    
                    if low_val is None:
                        low_columns = [col for col in available_columns if 'low' in str(col).lower()]
                        if low_columns:
                            low_val = row[low_columns[0]]
                            logger.debug(f"{symbol}: Found Low via fuzzy match: {low_columns[0]}")
                    
                    if close_val is None:
                        close_columns = [col for col in available_columns if 'close' in str(col).lower()]
                        if close_columns:
                            close_val = row[close_columns[0]]
                            logger.debug(f"{symbol}: Found Close via fuzzy match: {close_columns[0]}")
                    
                    if volume_val is None:
                        volume_columns = [col for col in available_columns if 'volume' in str(col).lower()]
                        if volume_columns:
                            volume_val = row[volume_columns[0]]
                            logger.debug(f"{symbol}: Found Volume via fuzzy match: {volume_columns[0]}")
                    
                    if adj_close_val is None:
                        adj_close_columns = [col for col in available_columns if 'adj' in str(col).lower() and 'close' in str(col).lower()]
                        if adj_close_columns:
                            adj_close_val = row[adj_close_columns[0]]
                            logger.debug(f"{symbol}: Found Adj Close via fuzzy match: {adj_close_columns[0]}")
                    
                    # Log what we found
                    logger.info(f"{symbol} - Date: {date_obj}, Open: {open_val}, Close: {close_val}, High: {high_val}, Low: {low_val}, Volume: {volume_val}")
                    
                    # Skip rows where we can't get the required data
                    if open_val is None or close_val is None:
                        logger.error(f"Skipping row for {symbol} - missing required price data. Available columns: {available_columns}")
                        logger.error(f"Row data: {dict(row)}")
                        continue
                        
                    historical_price = HistoricalPrice(
                        symbol=symbol,
                        date=date_obj,
                        open=float(open_val) if pd.notna(open_val) else None,
                        high=float(high_val) if pd.notna(high_val) else None,
                        low=float(low_val) if pd.notna(low_val) else None,
                        close=float(close_val) if pd.notna(close_val) else None,
                        volume=int(volume_val) if pd.notna(volume_val) else None,
                        adj_close=float(adj_close_val) if pd.notna(adj_close_val) else None
                    )
                    prices_to_add.append(historical_price)
                    
                except Exception as e:
                    logger.error(f"Error processing row for {symbol}: {e}")
                    logger.error(f"Row data: {dict(row)}")
                    logger.error(f"Exception details: {type(e).__name__}: {str(e)}")
                    import traceback
                    logger.error(f"Traceback: {traceback.format_exc()}")
                    continue
            session.add_all(prices_to_add)
        session.commit()
        
    except Exception as e:
        logger.error(f"Error saving {symbol} to database: {e}")
        session.rollback()
    finally:
        session.close()

def debug_print_stock_data(symbol, session_factory):
    session = session_factory()
    from app.database.models import Stock, HistoricalPrice
    try:
        stock = session.query(Stock).filter(Stock.symbol == symbol).first()
        if stock:
            logger.info(f"Stock in database: {stock.symbol}, {stock.name}, {stock.sector}")
        else:
            logger.warning(f"No stock found for symbol {symbol}")
        prices = session.query(HistoricalPrice).filter(HistoricalPrice.symbol == symbol).all()
        logger.info(f"Found {len(prices)} historical prices for {symbol}")
        if prices:
            logger.info(f"Most recent price: {prices[-1].date} - Close: {prices[-1].close}")
    finally:
        session.close() 