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
    logger.info(f"🔍 DATABASE_URL from config: {'SET' if DATABASE_URL else 'NOT SET'}")
    
    if DATABASE_URL:
        logger.info(f"✅ Using DATABASE_URL: {DATABASE_URL[:20]}...")  # Show first 20 chars
        return DATABASE_URL
    else:
        # No fallback - DATABASE_URL must be set
        logger.error("❌ DATABASE_URL is required but not set!")
        raise ValueError("DATABASE_URL environment variable is required")

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


engine = None

def get_session_maker():
    global engine
    if engine is None:
        engine = get_engine()
    return sessionmaker(autocommit=False, autoflush=False, bind=engine)


# Don't initialize SessionLocal at import time - make it lazy-loaded
SessionLocal = None

def get_session_local():
    global SessionLocal
    if SessionLocal is None:
        SessionLocal = get_session_maker()
    return SessionLocal

# Update the functions to use get_session_local()
def get_db():
    db = get_session_local()()
    try:
        yield db
    finally:
        db.close()

@contextmanager
def get_db_session():
    db = get_session_local()()
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