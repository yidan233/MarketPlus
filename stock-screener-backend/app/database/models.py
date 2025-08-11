from sqlalchemy import Column, String, Float, Integer, Date, ForeignKey, JSON, DateTime, Text, UniqueConstraint, Boolean
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.sql import func
import json
from datetime import datetime

# Create declarative base
Base = declarative_base()

class Stock(Base):
    __tablename__ = 'stocks'
    symbol = Column(String(10), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    sector = Column(String(100), index=True)
    industry = Column(String(100))
    market_cap = Column(Float)
    current_price = Column(Float)
    pe_ratio = Column(Float)
    dividend_yield = Column(Float)
    beta = Column(Float)
    info = Column(JSON)  
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # one stock can have many historical prices (one to many )
    prices = relationship("HistoricalPrice", back_populates="stock", cascade="all, delete-orphan")
    
    # Add relationship to watchlist matches
    watchlist_matches = relationship("WatchlistMatch", back_populates="stock", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Stock(symbol='{self.symbol}', name='{self.name}')>"

class HistoricalPrice(Base):
    __tablename__ = 'historical_prices'
    id = Column(Integer, primary_key=True, autoincrement=True)
    symbol = Column(String(10), ForeignKey('stocks.symbol', ondelete='CASCADE'), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    open = Column(Float, nullable=False)
    high = Column(Float, nullable=False)
    low = Column(Float, nullable=False)
    close = Column(Float, nullable=False)
    volume = Column(Integer, nullable=False)
    adj_close = Column(Float)
    created_at = Column(DateTime, default=func.now())
    stock = relationship("Stock", back_populates="prices") # price is linked to this 
    
    # ensure no duplicate data 
    __table_args__ = (
        UniqueConstraint('symbol', 'date', name='uq_symbol_date'),
    )
    
    def __repr__(self):
        return f"<HistoricalPrice(symbol='{self.symbol}', date='{self.date}', close={self.close})>"

class ScreeningResult(Base):
    __tablename__ = 'screening_results'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    criteria_hash = Column(String(64), unique=True, index=True) 
    criteria = Column(JSON, nullable=False)  
    results = Column(JSON, nullable=False) 
    index_used = Column(String(20), nullable=False)
    execution_time = Column(Float)  
    created_at = Column(DateTime, default=func.now())
    expires_at = Column(DateTime)  
    
    def __repr__(self):
        return f"<ScreeningResult(criteria_hash='{self.criteria_hash}', index='{self.index_used}')>"

class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(80), unique=True, nullable=False, index=True)
    email = Column(String(120), unique=True, nullable=False, index=True)
    created_at = Column(DateTime, default=func.now())
    
    # Relationship to watchlists
    watchlists = relationship("Watchlist", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User(username='{self.username}', email='{self.email}')>"
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat()
        }

class Watchlist(Base):
    __tablename__ = 'watchlists'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    criteria = Column(Text, nullable=False)  # JSON string
    is_active = Column(Boolean, default=True)
    is_monitoring = Column(Boolean, default=True)
    email_alerts = Column(Boolean, default=True)  # Add this field
    last_alert_sent = Column(DateTime)  # Add this field
    last_checked = Column(DateTime)
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="watchlists")
    matches = relationship("WatchlistMatch", back_populates="watchlist", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Watchlist(name='{self.name}', user_id={self.user_id})>"
    
    def to_dict(self):
        import json
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'criteria': json.loads(self.criteria) if self.criteria else {},
            'is_active': self.is_active,
            'is_monitoring': self.is_monitoring,
            'email_alerts': self.email_alerts,
            'last_alert_sent': self.last_alert_sent.isoformat() if self.last_alert_sent else None,
            'last_checked': self.last_checked.isoformat() if self.last_checked else None,
            'created_at': self.created_at.isoformat()
        }

class WatchlistMatch(Base):
    __tablename__ = 'watchlist_matches'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    watchlist_id = Column(Integer, ForeignKey('watchlists.id', ondelete='CASCADE'), nullable=False, index=True)
    symbol = Column(String(10), ForeignKey('stocks.symbol', ondelete='CASCADE'), nullable=False, index=True)
    matched_criteria = Column(Text)  # JSON string of which criteria matched
    matched_at = Column(DateTime, default=func.now())
    
    # Relationships
    watchlist = relationship("Watchlist", back_populates="matches")
    stock = relationship("Stock")  # Reference to existing Stock table
    
    # Ensure unique watchlist-symbol combinations
    __table_args__ = (UniqueConstraint('watchlist_id', 'symbol', name='unique_watchlist_stock'),)
    
    def __repr__(self):
        return f"<WatchlistMatch(symbol='{self.symbol}', watchlist_id={self.watchlist_id})>"
    
    def to_dict(self):
        import json
        return {
            'id': self.id,
            'watchlist_id': self.watchlist_id,
            'symbol': self.symbol,
            'name': self.stock.name if self.stock else None,
            'sector': self.stock.sector if self.stock else None,
            'price': self.stock.current_price if self.stock else None,
            'market_cap': self.stock.market_cap if self.stock else None,
            'pe_ratio': self.stock.pe_ratio if self.stock else None,
            'dividend_yield': self.stock.dividend_yield if self.stock else None,
            'beta': self.stock.beta if self.stock else None,
            'industry': self.stock.industry if self.stock else None,
            'matched_criteria': json.loads(self.matched_criteria) if self.matched_criteria else {},
            'matched_at': self.matched_at.isoformat()
        }

# database cacheing 
class NewsArticle(Base):
    __tablename__ = 'news_articles'
    
    id = Column(Integer, primary_key=True)
    title = Column(String(500), nullable=False)
    summary = Column(Text)
    url = Column(String(1000), nullable=False)
    published_at = Column(String(50))
    source = Column(String(100))
    sentiment = Column(String(50), default='neutral')
    tickers = Column(Text)  # JSON string of ticker data
    news_type = Column(String(50))  # 'market' or 'headlines'
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'summary': self.summary,
            'url': self.url,
            'published_at': self.published_at,
            'source': self.source,
            'sentiment': self.sentiment,
            'tickers': json.loads(self.tickers) if self.tickers else [],
            'news_type': self.news_type,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


def create_tables(engine=None):
    if engine is None:
        from .connection import engine
    
    # Drop old watchlist_matches table if it exists
    try:
        Base.metadata.drop_all(engine, tables=[WatchlistMatch.__table__])
        print("Dropped old watchlist_matches table")
    except:
        pass
    
    # Create new tables
    Base.metadata.create_all(engine)
    print("✅ Database tables created successfully!")

if __name__ == "__main__":
    # Only import engine when running directly
    from .connection import engine
    create_tables(engine)
    print("✅ Database tables created successfully!")