from flask import Blueprint, request, jsonify
from app.screener import StockScreener, screen_stocks, screen_by_technical, create_combined_screen
from app.data import get_stock_symbols
from app.cli import parse_criteria
import logging
from app.data.db_utils import load_from_database
from app.database import SessionLocal
from app.data.redis_cache import get_price
from app.services.chatbot_service import chatbot


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

        # Convert historical DataFrame to JSON-serializable format
        if 'historical' in data and hasattr(data['historical'], 'to_dict'):
            data['historical'] = data['historical'].reset_index().to_dict(orient='records')

        return jsonify(data)
    except Exception as e:
        logger.error(f"Error getting stock detail for {symbol}: {e}")
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