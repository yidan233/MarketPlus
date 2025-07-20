import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

STOCK_LISTS = {
    "sp500": "https://en.wikipedia.org/wiki/List_of_S%26P_500_companies",
    "nasdaq100": "https://en.wikipedia.org/wiki/Nasdaq-100",
    "dow30": "https://en.wikipedia.org/wiki/Dow_Jones_Industrial_Average"
}

# Database settings - all from environment variables
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "5432"))
DB_NAME = os.getenv("DB_NAME", "stock_screener")
DB_USER = os.getenv("DB_USER", "")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")

# Logging configuration
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
LOG_FILE = os.getenv("LOG_FILE", "stock_screener.log")

# Flask secret key for sessions
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")

# Redis configuration (optional)
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_DB = int(os.getenv("REDIS_DB", "0")) 