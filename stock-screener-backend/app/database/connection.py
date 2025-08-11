import os
import logging
from contextlib import contextmanager
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool

# only WARNING log will be printed 
logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)
logger = logging.getLogger(__name__)

# Use DATABASE_URL directly instead of parsed individual variables
def get_database_url():
    from app.config import DATABASE_URL
    if DATABASE_URL:
        return DATABASE_URL
    else:
        # Fallback to individual variables only if DATABASE_URL is missing
        from app.config import DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
        if DB_PASSWORD:
            return f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
        else:
            return "sqlite:///./stock_screener.db"

# Create engine lazily - only when needed
def get_engine():
    return create_engine(
        get_database_url(),
        echo=False,
        poolclass=QueuePool,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True, 
        pool_recycle=3600,   
    )

# Don't create engine at import time
engine = None

def get_session_maker():
    global engine
    if engine is None:
        engine = get_engine()
    return sessionmaker(autocommit=False, autoflush=False, bind=engine)

SessionLocal = get_session_maker()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@contextmanager
def get_db_session():
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Database session error: {e}")
        raise
    finally:
        db.close()

def test_connection():
    global engine
    if engine is None:
        engine = get_engine() # Ensure engine is created if not already
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            logger.info("✅ Database connection successful!")
            return True
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
        return False

if __name__ == "__main__":
    test_connection() 