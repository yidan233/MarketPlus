from flask import Blueprint, request, jsonify
from app.database import get_db_session
from app.database.models import Stock, HistoricalPrice, ScreeningResult
from app.screener import StockScreener, screen_stocks, screen_by_technical, create_combined_screen
from app.data.redis_cache import get_stock_data, set_stock_data, get_price
from app.data.yfinance_fetcher import _fetch_fresh_data
from app.data.db_utils import load_from_database
from app.services.chatbot_service import chatbot
import logging

logging.basicConfig(
    level=logging.ERROR,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)



screener = StockScreener()
api_bp = Blueprint('api', __name__, url_prefix='/api/v1')



# those routes are for the screener method ------------------- should be cleaned later 

# screen with fundamental criteria
@api_bp.route('/screen/fundamental', methods=['POST'])
def screen_fundamental():
    try:
        data = request.get_json() or {}
        
        index = data.get('index', 'sp500')
        criteria_str = data.get('criteria', '')
        limit = data.get('limit', 50)
        reload = data.get('reload', False)
        period = data.get('period', '1y')
        interval = data.get('interval', '1d')
        
        criteria = parse_criteria(criteria_str)
        if not criteria:
            return jsonify({'error': 'Fundamental criteria required'}), 400
        
        symbols = get_stock_symbols(index=index)
        screener.load_data(symbols=symbols, reload=reload, period=period, interval=interval)
        results = screen_stocks(screener.stock_data, criteria, limit=limit)
        
        return jsonify({
            'count': len(results),
            'criteria': criteria,
            'index': index,
            'stocks': results
        })
    
    except Exception as e:
        logger.error(f"Error in fundamental screening: {e}")
        return jsonify({'error': str(e)}), 500


# screen with technical criteria 
@api_bp.route('/screen/technical', methods=['POST'])
def screen_technical():
    try:
        data = request.get_json() or {}
        
        index = data.get('index', 'sp500')
        criteria_str = data.get('criteria', '')
        limit = data.get('limit', 50)
        reload = data.get('reload', False)
        period = data.get('period', '1y')
        interval = data.get('interval', '1d')
        
    
        criteria = parse_criteria(criteria_str)
        if not criteria:
            return jsonify({'error': 'Technical criteria required'}), 400
        
      
        symbols = get_stock_symbols(index=index)
        screener.load_data(symbols=symbols, reload=reload, period=period, interval=interval)
        results = screen_by_technical(screener.stock_data, screener.indicators, criteria)
        
        # Apply limit
        if limit and results:
            results = results[:limit]
        
        return jsonify({
            'count': len(results),
            'criteria': criteria,
            'index': index,
            'stocks': results
        })
    except Exception as e:
        logger.error(f"Error in technical screening: {e}")
        return jsonify({'error': str(e)}), 500


@api_bp.route('/screen/combined', methods=['POST'])
def screen_combined():
    try:
        data = request.get_json() or {}
        
        index = data.get('index', 'sp500')
        fundamental_criteria_str = data.get('fundamental_criteria', '')
        technical_criteria_str = data.get('technical_criteria', '')
        limit = data.get('limit', 50)
        reload = data.get('reload', False)
        period = data.get('period', '1y')
        interval = data.get('interval', '1d')
        
        fundamental_criteria = parse_criteria(fundamental_criteria_str)
        technical_criteria = parse_criteria(technical_criteria_str)
        
        if not fundamental_criteria or not technical_criteria:
            return jsonify({'error': 'Both fundamental and technical criteria required'}), 400
        

        symbols = get_stock_symbols(index=index)
        screener.load_data(symbols=symbols, reload=reload, period=period, interval=interval)
        
        results = create_combined_screen(screener, fundamental_criteria, technical_criteria, limit=limit)
        
        return jsonify({
            'count': len(results),
            'fundamental_criteria': fundamental_criteria,
            'technical_criteria': technical_criteria,
            'index': index,
            'stocks': results
        })
    except Exception as e:
        logger.error(f"Error in combined screening: {e}")
        return jsonify({'error': str(e)}), 500

# ===== SUPPORTING ROUTES =====

@api_bp.route('/indexes', methods=['GET'])
def get_indexes():
    """Get available stock indexes"""
    return jsonify({
        'indexes': ['sp500', 'nasdaq100', 'dow30'],
        'count': 3
    })

@api_bp.route('/symbols/<index>', methods=['GET'])
def get_symbols(index):
    """Get stock symbols for a given index"""
    try:
        symbols = get_stock_symbols(index=index)
        return jsonify({
            'index': index,
            'symbols': symbols,
            'count': len(symbols)
        })
    except Exception as e:
        logger.error(f"Error getting symbols for {index}: {e}")
        return jsonify({'error': str(e)}), 500

@api_bp.route('/indicators', methods=['GET'])
def get_available_indicators():
    """Get list of available technical indicators and fundamental fields"""
    return jsonify({
        'technical_indicators': [
            'rsi', 'ma', 'ema', 'macd_hist', 'boll_upper', 'boll_lower',
            'atr', 'obv', 'stoch_k', 'stoch_d', 'roc'
        ],
        'fundamental_fields': [
            'market_cap', 'pe_ratio', 'forward_pe', 'price_to_book', 'price_to_sales',
            'dividend_yield', 'payout_ratio', 'return_on_equity', 'return_on_assets',
            'profit_margin', 'operating_margin', 'revenue_growth', 'earnings_growth',
            'beta', 'current_ratio', 'debt_to_equity', 'enterprise_to_revenue',
            'enterprise_to_ebitda', 'price', 'sector', 'industry', 'country'
        ],
        'operators': ['>', '<', '>=', '<=', '==', '!=']
    })

@api_bp.route('/', methods=['GET'])
def api_docs():
    """API documentation"""
    return jsonify({
        'name': 'Stock Screener API',
        'version': '1.0.0',
        'description': 'REST API for stock screening using fundamental and technical analysis',
        'endpoints': {
            'POST /api/v1/screen/fundamental': 'Screen stocks by fundamental criteria',
            'POST /api/v1/screen/technical': 'Screen stocks by technical criteria', 
            'POST /api/v1/screen/combined': 'Screen stocks by both criteria',
            'GET /api/v1/indexes': 'Get available stock indexes',
            'GET /api/v1/symbols/<index>': 'Get stock symbols for an index',
            'GET /api/v1/indicators': 'Get available indicators and fields',
            'GET /api/v1/stock/<symbol>': 'Get detailed stock information',
            'POST /api/v1/chatbot/advice': 'Get advice from the AI chatbot',
            'GET /api/v1/chatbot/health': 'Check chatbot availability',
            'GET /api/v1/news/market': 'Get general market news',
            'GET /api/v1/news/stock/<symbol>': 'Get news for a specific stock',
            'GET /api/v1/news/top-headlines': 'Get top financial headlines',
            'GET /api/v1/news/health': 'Check news service availability'
        },
        'examples': {
            'fundamental_screening': {
                'url': '/api/v1/screen/fundamental',
                'method': 'POST',
                'body': {
                    'index': 'sp500',
                    'criteria': 'market_cap>1000000000,pe_ratio<20',
                    'limit': 10
                }
            },
            'technical_screening': {
                'url': '/api/v1/screen/technical',
                'method': 'POST',
                'body': {
                    'index': 'sp500',
                    'criteria': 'rsi<30,ma>100',
                    'limit': 10
                }
            },
            'combined_screening': {
                'url': '/api/v1/screen/combined',
                'method': 'POST',
                'body': {
                    'index': 'sp500',
                    'fundamental_criteria': 'sector=Technology',
                    'technical_criteria': 'rsi>40',
                    'limit': 10
                }
            },
            'chatbot_advice': {
                'url': '/api/v1/chatbot/advice',
                'method': 'POST',
                'body': {
                    'question': 'Which index should I use for technology stocks?'
                }
            },
            'market_news': {
                'url': '/api/v1/news/market?limit=5',
                'method': 'GET',
                'description': 'Get 5 latest market news articles'
            },
            'stock_news': {
                'url': '/api/v1/news/stock/AAPL?limit=3',
                'method': 'GET',
                'description': 'Get 3 latest news articles for Apple'
            },
            'top_headlines': {
                'url': '/api/v1/news/top-headlines?limit=10',
                'method': 'GET',
                'description': 'Get 10 top financial headlines'
            }
        }
    })

@api_bp.route('/stock/<symbol>', methods=['GET'])
def get_stock_detail(symbol):
    try:
        data = load_from_database(symbol, SessionLocal)
        if not data:
            return jsonify({'error': 'Stock not found'}), 404

        # Optionally, add live price from Redis
        live_price = get_price(symbol)
        data['live_price'] = live_price

        # Convert historical data from JSON string to records format for charts
        if 'historical_json' in data:
            try:
                import pandas as pd
                hist_df = pd.read_json(data['historical_json'], orient="split")
                # Convert to the format expected by frontend charts
                data['historical'] = hist_df.reset_index().to_dict(orient='records')
                logger.info(f"Successfully converted historical data for {symbol}, {len(data['historical'])} records")
            except Exception as e:
                logger.error(f"Error converting historical data for {symbol}: {e}")
                data['historical'] = []
        elif 'historical' in data and hasattr(data['historical'], 'to_dict'):
            # Fallback for old format
            data['historical'] = data['historical'].reset_index().to_dict(orient='records')

        return jsonify(data)
    except Exception as e:
        logger.error(f"Error getting stock detail for {symbol}: {e}")
        return jsonify({'error': str(e)}), 500


@api_bp.route('/stock/<symbol>/indicators', methods=['GET'])
def get_stock_indicators(symbol):
    """Get technical indicators for a specific stock"""
    try:
        from app.indicators.indicators import TechnicalIndicators
        import pandas as pd
        
        # Load stock data from database
        data = load_from_database(symbol, SessionLocal)
        if not data:
            logger.error(f"Stock {symbol} not found in database")
            return jsonify({'error': 'Stock not found'}), 404
        
        logger.info(f"Loaded data for {symbol}, keys: {list(data.keys())}")
        
        # Get historical data
        hist_raw = data.get('historical_json')  
        if not hist_raw:
            logger.error(f"No historical data found for {symbol}. Available keys: {list(data.keys())}")
            return jsonify({'error': 'No historical data available'}), 400
        
        # Convert to DataFrame if it's a string
        if isinstance(hist_raw, str):
            try:
                hist = pd.read_json(hist_raw, orient="split")
                logger.info(f"Successfully converted JSON to DataFrame for {symbol}, shape: {hist.shape}")
            except Exception as e:
                logger.error(f"Error converting JSON to DataFrame for {symbol}: {e}")
                return jsonify({'error': 'Invalid historical data format'}), 400
        else:
            hist = hist_raw
            logger.info(f"Historical data already DataFrame for {symbol}, shape: {hist.shape}")
        
        if hist.empty or len(hist) < 20:
            return jsonify({'error': 'Insufficient historical data (need at least 20 data points)'}), 400
        
        # Initialize technical indicators calculator
        indicators_calc = TechnicalIndicators()
        
        # Calculate indicators
        close_prices = hist['Close']
        high_prices = hist['High']
        low_prices = hist['Low']
        volumes = hist['Volume']
        
        calculated_indicators = {}
        
        try:
            # Moving Average (20-day)
            ma20 = indicators_calc.moving_average(close_prices, window=20)
            if ma20 is not None and not ma20.empty and not pd.isna(ma20.iloc[-1]):
                calculated_indicators['ma20'] = round(float(ma20.iloc[-1]), 2)
            
            # Exponential Moving Average (20-day)
            ema20 = indicators_calc.exponential_moving_average(close_prices, span=20)
            if ema20 is not None and not ema20.empty and not pd.isna(ema20.iloc[-1]):
                calculated_indicators['ema20'] = round(float(ema20.iloc[-1]), 2)
            
            # RSI (14-day)
            rsi = indicators_calc.relative_strength_index(close_prices, window=14)
            if rsi is not None and not rsi.empty and not pd.isna(rsi.iloc[-1]):
                calculated_indicators['rsi'] = round(float(rsi.iloc[-1]), 1)
            
            # MACD
            macd_line, signal_line, histogram = indicators_calc.macd(close_prices)
            if macd_line is not None and not macd_line.empty and not pd.isna(macd_line.iloc[-1]):
                calculated_indicators['macd'] = round(float(macd_line.iloc[-1]), 2)
            if signal_line is not None and not signal_line.empty and not pd.isna(signal_line.iloc[-1]):
                calculated_indicators['macd_signal'] = round(float(signal_line.iloc[-1]), 2)
            if histogram is not None and not histogram.empty and not pd.isna(histogram.iloc[-1]):
                calculated_indicators['macd_histogram'] = round(float(histogram.iloc[-1]), 2)
            
            # Bollinger Bands
            upper, middle, lower = indicators_calc.bollinger_bands(close_prices)
            if upper is not None and not upper.empty and not pd.isna(upper.iloc[-1]):
                calculated_indicators['bollinger_upper'] = round(float(upper.iloc[-1]), 2)
            if middle is not None and not middle.empty and not pd.isna(middle.iloc[-1]):
                calculated_indicators['bollinger_middle'] = round(float(middle.iloc[-1]), 2)
            if lower is not None and not lower.empty and not pd.isna(lower.iloc[-1]):
                calculated_indicators['bollinger_lower'] = round(float(lower.iloc[-1]), 2)
            
            # ATR
            atr = indicators_calc.average_true_range(high_prices, low_prices, close_prices)
            if atr is not None and not atr.empty and not pd.isna(atr.iloc[-1]):
                calculated_indicators['atr'] = round(float(atr.iloc[-1]), 2)
            
            # Rate of Change
            roc = indicators_calc.rate_of_change(close_prices, window=12)
            if roc is not None and not roc.empty and not pd.isna(roc.iloc[-1]):
                calculated_indicators['roc'] = round(float(roc.iloc[-1]), 2)
            
            # Current price for reference
            current_price = float(close_prices.iloc[-1])
            calculated_indicators['current_price'] = round(current_price, 2)
            
        except Exception as e:
            logger.error(f"Error calculating indicators for {symbol}: {e}")
            return jsonify({'error': f'Error calculating indicators: {str(e)}'}), 500
        
        return jsonify({
            'symbol': symbol,
            'indicators': calculated_indicators,
            'data_points': len(hist),
            'last_updated': hist.index[-1].isoformat() if hasattr(hist.index[-1], 'isoformat') else str(hist.index[-1])
        })
        
    except Exception as e:
        logger.error(f"Error getting indicators for {symbol}: {e}")
        return jsonify({'error': str(e)}), 500

@api_bp.route('/stock/<symbol>/peers', methods=['GET'])
def get_stock_peers(symbol):
    """Get peer companies for comparison"""
    try:
        # For now, return some common peers based on sector/industry
        # In a real implementation, you'd query a database for companies in the same sector
        
        # Common tech peers
        tech_peers = ['MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA', 'NFLX', 'ADBE']
        # Common financial peers  
        financial_peers = ['JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'USB', 'PNC']
        # Common healthcare peers
        healthcare_peers = ['JNJ', 'PFE', 'UNH', 'ABBV', 'TMO', 'DHR', 'LLY', 'ABT']
        # Common consumer peers
        consumer_peers = ['PG', 'KO', 'PEP', 'WMT', 'HD', 'MCD', 'NKE', 'SBUX']
        
        # Default to tech peers for now
        peer_symbols = tech_peers[:6]  # Limit to 6 peers
        
        # Get basic info for each peer
        peers_data = []
        for peer_symbol in peer_symbols:
            try:
                peer_data = load_from_database(peer_symbol, SessionLocal)
                if peer_data and 'info' in peer_data:
                    info = peer_data['info']
                    peers_data.append({
                        'symbol': peer_symbol,
                        'name': info.get('longName', peer_symbol),
                        'sector': info.get('sector', 'N/A'),
                        'industry': info.get('industry', 'N/A'),
                        'market_cap': info.get('marketCap', 0),
                        'pe_ratio': info.get('trailingPE', 0),
                        'price': info.get('currentPrice', 0),
                        'change_percent': info.get('regularMarketChangePercent', 0)
                    })
            except Exception as e:
                logger.warning(f"Could not load peer {peer_symbol}: {e}")
                continue
        
        return jsonify({
            'symbol': symbol,
            'peers': peers_data,
            'count': len(peers_data)
        })
        
    except Exception as e:
        logger.error(f"Error getting peers for {symbol}: {e}")
        return jsonify({'error': str(e)}), 500

# Add chatbot routes before register_routes function
@api_bp.route('/chatbot/advice', methods=['POST'])
def get_chatbot_advice():
    """Get advice from the chatbot"""
    try:
        data = request.get_json()
        if not data or 'question' not in data:
            return jsonify({'error': 'Question is required'}), 400
        
        question = data['question'].strip()
        if not question:
            return jsonify({'error': 'Question cannot be empty'}), 400
        
        # Determine the type of advice needed
        index_keywords = ['index', 'sp500', 'nasdaq', 'dow', 's&p', 'which index', 'what index']
        screening_keywords = ['screening', 'criteria', 'fields', 'fundamental', 'technical', 'pe_ratio', 'rsi', 'market_cap']
        
        is_index_question = any(keyword in question.lower() for keyword in index_keywords)
        is_screening_question = any(keyword in question.lower() for keyword in screening_keywords)
        
        if is_index_question:
            response = chatbot.get_index_advice(question)
        elif is_screening_question:
            response = chatbot.get_screening_advice(question)
        else:
            response = chatbot.get_general_advice(question)
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Error in chatbot advice endpoint: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@api_bp.route('/chatbot/health', methods=['GET'])
def chatbot_health_check():
    """Check if chatbot is available"""
    return jsonify({
        'available': chatbot.model is not None,
        'model': 'gemini-flash' if chatbot.model else None
    })

def register_routes(app):
    app.register_blueprint(api_bp)
    from app.api.news_routes import news_bp
    app.register_blueprint(news_bp)