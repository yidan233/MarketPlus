import schedule
import time
import json
import logging
from datetime import datetime, timedelta
from app.database import SessionLocal
from app.database.models import Watchlist, User, WatchlistMatch, Stock
from app.screener import StockScreener, screen_stocks, screen_by_technical
from app.data import get_stock_symbols
from app.services.email_service import send_watchlist_alert

logger = logging.getLogger(__name__)

class WatchlistMonitor:
    def __init__(self):
        self.screener = StockScreener()
    
    def check_watchlist(self, watchlist):
        """Check if any stocks match the watchlist criteria"""
        try:
            # Parse criteria
            criteria = json.loads(watchlist.criteria)
            fundamental_criteria = criteria.get('fundamental_criteria', [])
            technical_criteria = criteria.get('technical_criteria', [])
            
            # Convert criteria to dictionary format
            fundamental_criteria_dict = self._convert_criteria_to_dict(fundamental_criteria)
            technical_criteria_dict = self._convert_criteria_to_dict(technical_criteria)
            
            # Get stock symbols
            index = criteria.get('index', 'sp500')
            symbols = get_stock_symbols(index=index)
      
            self.screener.load_data(symbols=symbols, reload=False, period='1y', interval='1d')
            
            results = []
            
            if fundamental_criteria_dict:
                try:
                    fundamental_results = screen_stocks(self.screener.stock_data, fundamental_criteria_dict)
                    results.extend(fundamental_results)
                    logger.info(f"Fundamental screening found {len(fundamental_results)} results")
                except Exception as e:
                    logger.error(f"Error in fundamental screening: {e}")
            
            if technical_criteria_dict:
                try:
                    technical_results = screen_by_technical(self.screener.stock_data, self.screener.indicators, technical_criteria_dict)
                    results.extend(technical_results)
                    logger.info(f"Technical screening found {len(technical_results)} results")
                except Exception as e:
                    logger.error(f"Error in technical screening: {e}")
            
            # Update matches
            self.update_watchlist_matches(watchlist, results)
            
            # Send email alert if enabled and should send
            if watchlist.email_alerts and self.should_send_alert(watchlist) and results:
                self.send_email_alert(watchlist, results)
            
            # Update last checked time
            db = SessionLocal()
            try:
                watchlist.last_checked = datetime.utcnow()
                db.commit()
            finally:
                db.close()
            
            logger.info(f"Watchlist {watchlist.name}: Found {len(results)} matching stocks")
            return results
            
        except Exception as e:
            logger.error(f"Error checking watchlist {watchlist.id}: {e}")
            return []
    
    def update_watchlist_matches(self, watchlist, current_results):
        """Update watchlist matches - only store symbol references"""
        try:
            db = SessionLocal()
            
            # Get current matching symbols
            current_matching_symbols = {stock['symbol'] for stock in current_results}
            
            # Get existing matches for this watchlist
            existing_matches = db.query(WatchlistMatch).filter_by(
                watchlist_id=watchlist.id
            ).all()
            
            # Remove matches that no longer match criteria
            for existing_match in existing_matches:
                if existing_match.symbol not in current_matching_symbols:
                    db.delete(existing_match)
                    logger.info(f"Removed non-matching stock: {existing_match.symbol}")
            
            # Add new matches (only symbol references)
            for stock in current_results:
                # Check if match already exists
                existing_match = db.query(WatchlistMatch).filter_by(
                    watchlist_id=watchlist.id,
                    symbol=stock['symbol']
                ).first()
                
                if not existing_match:
                    # Create new match record (just symbol reference)
                    match = WatchlistMatch(
                        watchlist_id=watchlist.id,
                        symbol=stock['symbol'],
                        matched_criteria=json.dumps({
                            'fundamental_criteria': json.loads(watchlist.criteria).get('fundamental_criteria', []),
                            'technical_criteria': json.loads(watchlist.criteria).get('technical_criteria', [])
                        })
                    )
                    db.add(match)
                    logger.info(f"Added new match: {stock['symbol']}")
            
            db.commit()
            logger.info(f"Updated watchlist {watchlist.name}: {len(current_results)} current matches")
            
        except Exception as e:
            logger.error(f"Error updating watchlist matches: {e}")
            db.rollback()
        finally:
            db.close()
    
    def _convert_criteria_to_dict(self, criteria_list):
        """Convert frontend criteria format to screener format"""
        criteria_dict = {}
        for criterion in criteria_list:
            if criterion.get('field') and criterion.get('operator') and criterion.get('value'):
                field = criterion['field']
                operator = criterion['operator']
                try:
                    value = float(criterion['value'])
                    criteria_dict[field] = (operator, value)
                except (ValueError, TypeError):
                    # Handle non-numeric values (like sector names)
                    criteria_dict[field] = criterion['value']
        return criteria_dict
    
    def check_all_watchlists(self):
        """Check all active and monitoring watchlists"""
        db = SessionLocal()
        try:
            watchlists = db.query(Watchlist).filter(
                Watchlist.is_active == True,
                Watchlist.is_monitoring == True
            ).all()
            
            logger.info(f"Checking {len(watchlists)} active watchlists")
            
            for watchlist in watchlists:
                try:
                    self.check_watchlist(watchlist)
                except Exception as e:
                    logger.error(f"Error checking watchlist {watchlist.id}: {e}")
                    
        finally:
            db.close()
    
    def should_send_alert(self, watchlist):
        """Check if we should send an email alert"""
        # Simple logic: send email if alerts are enabled and we have matches
        return watchlist.email_alerts
    
    def send_email_alert(self, watchlist, matches):
        """Send email alert for watchlist matches"""
        try:
            db = SessionLocal()
            user = db.query(User).filter_by(id=watchlist.user_id).first()
            
            if not user or not user.email:
                logger.warning(f"No email found for user {watchlist.user_id}")
                return
            
            # Convert matches to email format
            email_matches = []
            for match in matches:
                stock = db.query(Stock).filter_by(symbol=match['symbol']).first()
                email_matches.append({
                    'symbol': match['symbol'],
                    'price': stock.current_price if stock else match.get('price', 0),
                    'sector': stock.sector if stock else match.get('sector', 'N/A'),
                    'name': stock.name if stock else match.get('name', 'N/A')
                })
            
            # Send email
            success = send_watchlist_alert(
                user_email=user.email,
                username=user.username,
                watchlist_name=watchlist.name,
                matches=email_matches
            )
            
            if success:
                # Update last alert sent time
                watchlist.last_alert_sent = datetime.utcnow()
                db.commit()
                logger.info(f"Email alert sent for watchlist {watchlist.name}")
            else:
                logger.error(f"Failed to send email alert for watchlist {watchlist.name}")
                
        except Exception as e:
            logger.error(f"Error sending email alert: {e}")
        finally:
            db.close()
    
    def start_monitoring(self):
        """Start the background monitoring service"""
        logger.info("Starting watchlist monitoring service...")
        
        # Schedule monitoring every 5 minutes
        schedule.every(5).minutes.do(self.check_all_watchlists)
        
        # Run initial check
        self.check_all_watchlists()
        
        # Keep running
        while True:
            schedule.run_pending()
            time.sleep(60)  # Check every minute

def start_watchlist_monitor():
    """Start the watchlist monitoring service"""
    monitor = WatchlistMonitor()
    monitor.start_monitoring()

if __name__ == '__main__':
    start_watchlist_monitor() 