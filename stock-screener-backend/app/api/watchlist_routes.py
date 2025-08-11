from app.database import get_db_session
from app.database.models import Stock, HistoricalPrice
from app.data.redis_cache import get_stock_data, set_stock_data
from flask import Blueprint, request, jsonify
import logging

logger = logging.getLogger(__name__)

watchlist_bp = Blueprint('watchlist', __name__)

@watchlist_bp.route('/watchlist', methods=['GET'])
def get_watchlist():
    with get_db_session() as db:
        # Get all stocks in watchlist (you might want to add a watchlist field to Stock model)
        stocks = db.query(Stock).all()
        watchlist = []
        
        for stock in stocks:
            # Try to get cached data first
            cached_data = get_stock_data(stock.symbol)
            if cached_data:
                stock_data = {
                    'symbol': stock.symbol,
                    'name': stock.name,
                    'current_price': cached_data.get('current_price', stock.current_price),
                    'change': cached_data.get('change', 0),
                    'change_percent': cached_data.get('change_percent', 0)
                }
            else:
                stock_data = {
                    'symbol': stock.symbol,
                    'name': stock.name,
                    'current_price': stock.current_price,
                    'change': 0,
                    'change_percent': 0
                }
            watchlist.append(stock_data)
        
        return jsonify({'watchlist': watchlist})

@watchlist_bp.route('/watchlist/<symbol>', methods=['POST'])
def add_to_watchlist(symbol):
    with get_db_session() as db:
        # Check if stock exists
        stock = db.query(Stock).filter_by(symbol=symbol.upper()).first()
        if not stock:
            return jsonify({'error': 'Stock not found'}), 404
        
        # Add to watchlist logic here
        # You might want to add a watchlist field to Stock model
        return jsonify({'message': f'{symbol} added to watchlist'})

@watchlist_bp.route('/watchlist/<symbol>', methods=['DELETE'])
def remove_from_watchlist(symbol):
    with get_db_session() as db:
        # Check if stock exists
        stock = db.query(Stock).filter_by(symbol=symbol.upper()).first()
        if not stock:
            return jsonify({'error': 'Stock not found'}), 404
        
        # Remove from watchlist logic here
        return jsonify({'message': f'{symbol} removed from watchlist'})

@watchlist_bp.route('/watchlist/<symbol>/price', methods=['GET'])
def get_stock_price(symbol):
    with get_db_session() as db:
        # Check if stock exists
        stock = db.query(Stock).filter_by(symbol=symbol.upper()).first()
        if not stock:
            return jsonify({'error': 'Stock not found'}), 404
        
        # Try to get cached price data
        cached_data = get_stock_data(symbol)
        if cached_data:
            return jsonify({
                'symbol': symbol,
                'current_price': cached_data.get('current_price', stock.current_price),
                'change': cached_data.get('change', 0),
                'change_percent': cached_data.get('change_percent', 0),
                'timestamp': cached_data.get('timestamp')
            })
        else:
            return jsonify({
                'symbol': symbol,
                'current_price': stock.current_price,
                'change': 0,
                'change_percent': 0,
                'timestamp': None
            })

@watchlist_bp.route('/watchlist/<symbol>/history', methods=['GET'])
def get_stock_history(symbol):
    with get_db_session() as db:
        # Check if stock exists
        stock = db.query(Stock).filter_by(symbol=symbol.upper()).first()
        if not stock:
            return jsonify({'error': 'Stock not found'}), 404
        
        # Get historical prices
        prices = db.query(HistoricalPrice).filter_by(symbol=symbol.upper()).order_by(HistoricalPrice.date.desc()).limit(30).all()
        
        history = []
        for price in prices:
            history.append({
                'date': price.date.isoformat(),
                'open': price.open,
                'high': price.high,
                'low': price.low,
                'close': price.close,
                'volume': price.volume
            })
        
        return jsonify({'symbol': symbol, 'history': history}) 