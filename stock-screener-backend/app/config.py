import os
from dotenv import load_dotenv
from urllib.parse import urlparse

# Load environment variables from .env file
load_dotenv()

STOCK_LISTS = {
    "sp500": "https://en.wikipedia.org/wiki/List_of_S%26P_500_companies",
    "nasdaq100": "https://en.wikipedia.org/wiki/Nasdaq-100",
    "dow30": "https://en.wikipedia.org/wiki/Dow_Jones_Industrial_Average"
}

# Database Configuration - ONLY use DATABASE_URL
DATABASE_URL = os.getenv("DATABASE_URL")

# Don't parse individual variables - let Railway handle it
# DB_HOST, DB_PORT, etc. will be None if not explicitly set

# Redis Configuration - ONLY use REDIS_URL  
REDIS_URL = os.getenv("REDIS_URL")

# Don't parse individual variables - let Railway handle it
# REDIS_HOST, REDIS_PORT, etc. will be None if not explicitly set

LOG_LEVEL = os.getenv("LOG_LEVEL")
LOG_FILE = os.getenv("LOG_FILE")

# Gemini AI Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# News API Configuration
NEWS_API_KEY = os.getenv("NEWS_API_KEY")

# Frontend URL for CORS
FRONTEND_URL = os.getenv("FRONTEND_URL")