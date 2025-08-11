import requests
import logging
import json
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from app.database import get_db_session
from app.database.models import NewsArticle, Stock, HistoricalPrice
from app.data.redis_cache import get_stock_data, set_stock_data

logger = logging.getLogger(__name__)

class NewsService:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://www.alphavantage.co/query"
        self.daily_api_calls = 0
        self.last_api_call_date = None
    
    def get_market_news(self, limit: int = 15) -> List[Dict]:
        """Get market news from database cache"""
        try:
            # Check if we have recent news in database
            with get_db_session() as db:
                try:
                    # Get news from last 24 hours
                    yesterday = datetime.utcnow() - timedelta(days=1)
                    cached_news = db.query(NewsArticle)\
                        .filter(NewsArticle.news_type == 'market')\
                        .filter(NewsArticle.created_at >= yesterday)\
                        .order_by(NewsArticle.created_at.desc())\
                        .limit(limit)\
                        .all()
                    
                    if cached_news:
                        logger.info(f"Returning {len(cached_news)} cached market news articles")
                        return [article.to_dict() for article in cached_news]
                    
                    # No cached news, fetch from API (but check daily limit)
                    if self._can_make_api_call():
                        logger.info("No cached market news found, fetching from API")
                        return self._fetch_and_cache_all_news(limit)
                    else:
                        logger.warning("Daily API limit reached, returning empty results")
                        return []
                    
                finally:
                    db.close()
                
        except Exception as e:
            logger.error(f"Error getting market news: {e}")
            return []
    
    def get_top_headlines(self, limit: int = 10) -> List[Dict]:
        """Get top headlines from database cache"""
        try:
            with get_db_session() as db:
                try:
                    # Get news from last 24 hours
                    yesterday = datetime.utcnow() - timedelta(days=1)
                    cached_news = db.query(NewsArticle)\
                        .filter(NewsArticle.news_type == 'headlines')\
                        .filter(NewsArticle.created_at >= yesterday)\
                        .order_by(NewsArticle.created_at.desc())\
                        .limit(limit)\
                        .all()
                    
                    if cached_news:
                        logger.info(f"Returning {len(cached_news)} cached headline articles")
                        return [article.to_dict() for article in cached_news]
                    
                    # No cached news, fetch from API (but check daily limit)
                    if self._can_make_api_call():
                        logger.info("No cached headlines found, fetching from API")
                        return self._fetch_and_cache_all_news(limit)
                    else:
                        logger.warning("Daily API limit reached, returning empty results")
                        return []
                    
                finally:
                    db.close()
                
        except Exception as e:
            logger.error(f"Error getting top headlines: {e}")
            return []
    
    def _can_make_api_call(self) -> bool:
        """Check if we can make an API call (daily limit check)"""
        today = datetime.utcnow().date()
        
        # Reset counter if it's a new day
        if self.last_api_call_date != today:
            self.daily_api_calls = 0
            self.last_api_call_date = today
        
        # Check if we're under the limit (leave some buffer)
        return self.daily_api_calls < 20  # Leave 5 calls buffer
    
    def _fetch_and_cache_all_news(self, limit: int) -> List[Dict]:
        """Make ONE API call and cache both market and headlines"""
        try:
            # Increment API call counter
            self.daily_api_calls += 1
            
            params = {
                'function': 'NEWS_SENTIMENT',
                'topics': 'financial_markets',
                'apikey': self.api_key,
                'limit': 25  # Get max articles in one call
            }
            response = requests.get(self.base_url, params=params)
            data = response.json()
            
            if 'feed' in data:
                all_news = data['feed']
                formatted_news = self._format_news(all_news)
                
                # Split the news: first 15 for market, next 10 for headlines
                market_news = formatted_news[:15]
                headlines = formatted_news[15:25]
                
                # Cache both types
                self._cache_news(market_news, 'market')
                self._cache_news(headlines, 'headlines')
                
                # Return based on what was requested
                if len(formatted_news) >= limit:
                    return formatted_news[:limit]
                return formatted_news
            
            return []
        except Exception as e:
            logger.error(f"Error fetching news from API: {e}")
            return []
    
    def _cache_news(self, news_list: List[Dict], news_type: str):
        try:
            with get_db_session() as db:
                try:
                    for article in news_list:
                        existing = db.query(NewsArticle)\
                            .filter(NewsArticle.url == article['url'])\
                            .first()
                        
                        if not existing:
                            news_article = NewsArticle(
                                title=article['title'],
                                summary=article['summary'],
                                url=article['url'],
                                published_at=article['published_at'],
                                source=article['source'],
                                sentiment=article['sentiment'],
                                tickers=json.dumps(article['tickers']),
                                news_type=news_type
                            )
                            db.add(news_article)
                    
                    db.commit()
                    logger.info(f"Cached {len(news_list)} {news_type} articles")
                    
                except Exception as e:
                    db.rollback()
                    logger.error(f"Error caching news: {e}")
                finally:
                    db.close()
                    
        except Exception as e:
            logger.error(f"Error in cache_news: {e}")
    
    def _format_news(self, news_feed: List[Dict]) -> List[Dict]:
        """Format news data for frontend consumption"""
        formatted_news = []
        for article in news_feed:
            formatted_news.append({
                'title': article.get('title', ''),
                'summary': article.get('summary', ''),
                'url': article.get('url', ''),
                'published_at': article.get('time_published', ''),
                'source': article.get('source', ''),
                'sentiment': article.get('overall_sentiment_label', 'neutral'),
                'tickers': article.get('ticker_sentiment', [])
            })
        return formatted_news
    
    def get_cache_status(self) -> Dict:
        """Get information about cached news and API usage"""
        try:
            with get_db_session() as db:
                try:
                    yesterday = datetime.utcnow() - timedelta(days=1)
                    
                    market_count = db.query(NewsArticle)\
                        .filter(NewsArticle.news_type == 'market')\
                        .filter(NewsArticle.created_at >= yesterday)\
                        .count()
                    
                    headlines_count = db.query(NewsArticle)\
                        .filter(NewsArticle.news_type == 'headlines')\
                        .filter(NewsArticle.created_at >= yesterday)\
                        .count()
                    
                    latest_article = db.query(NewsArticle)\
                        .order_by(NewsArticle.created_at.desc())\
                        .first()
                    
                    return {
                        'market_articles': market_count,
                        'headlines_articles': headlines_count,
                        'last_updated': latest_article.created_at.isoformat() if latest_article else None,
                        'cache_age_hours': (datetime.utcnow() - latest_article.created_at).total_seconds() / 3600 if latest_article else None,
                        'daily_api_calls_used': self.daily_api_calls,
                        'daily_api_calls_remaining': 25 - self.daily_api_calls,
                        'can_make_api_call': self._can_make_api_call()
                    }
                finally:
                    db.close()
        except Exception as e:
            logger.error(f"Error getting cache status: {e}")
            return {}
