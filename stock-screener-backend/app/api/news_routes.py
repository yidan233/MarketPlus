from flask import Blueprint, request, jsonify
from app.services.new_service import NewsService
from app.config import NEWS_API_KEY
import logging

logger = logging.getLogger(__name__)

news_bp = Blueprint('news', __name__, url_prefix='/api/v1/news')

# Initialize news service
news_service = NewsService(NEWS_API_KEY) if NEWS_API_KEY else None

@news_bp.route('/market', methods=['GET'])
def get_market_news():
    """Get general market news"""
    try:
        if not news_service:
            return jsonify({'error': 'News service not configured. Please set NEWS_API_KEY'}), 500
        
        limit = request.args.get('limit', 20, type=int)
        news = news_service.get_market_news(limit=limit)
        
        return jsonify({
            'success': True,
            'count': len(news),
            'news': news
        })
    except Exception as e:
        logger.error(f"Error getting market news: {e}")
        return jsonify({'error': str(e)}), 500

@news_bp.route('/top-headlines', methods=['GET'])
def get_top_headlines():
    """Get top financial headlines"""
    try:
        if not news_service:
            return jsonify({'error': 'News service not configured. Please set NEWS_API_KEY'}), 500
        
        limit = request.args.get('limit', 10, type=int)
        news = news_service.get_top_headlines(limit=limit)
        
        return jsonify({
            'success': True,
            'count': len(news),
            'news': news
        })
    except Exception as e:
        logger.error(f"Error getting top headlines: {e}")
        return jsonify({'error': str(e)}), 500

@news_bp.route('/health', methods=['GET'])
def news_health_check():
    """Check if news service is available"""
    return jsonify({
        'available': news_service is not None,
        'api_key_configured': bool(NEWS_API_KEY)
    }) 

@news_bp.route('/cache-status', methods=['GET'])
def get_cache_status():
    """Get information about cached news"""
    try:
        if not news_service:
            return jsonify({'error': 'News service not configured'}), 500
        
        status = news_service.get_cache_status()
        return jsonify({
            'success': True,
            'status': status
        })
    except Exception as e:
        logger.error(f"Error getting cache status: {e}")
        return jsonify({'error': str(e)}), 500

@news_bp.route('/refresh', methods=['POST'])
def refresh_cache():
    """Manually refresh news cache"""
    try:
        if not news_service:
            return jsonify({'error': 'News service not configured'}), 500
        
        success = news_service.refresh_news_cache()
        return jsonify({
            'success': success,
            'message': 'Cache refreshed successfully' if success else 'Failed to refresh cache'
        })
    except Exception as e:
        logger.error(f"Error refreshing cache: {e}")
        return jsonify({'error': str(e)}), 500 