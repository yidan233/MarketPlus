# Stock Screener Application

A comprehensive stock screening application with both backend and frontend components, featuring fundamental and technical analysis capabilities, user authentication, and a modern web interface.

---

## Project Overview

This is a full-stack stock screening application consisting of:

- **Backend**: Python Flask API with authentication and screening engine
- **Frontend**: React-based web interface with real-time data visualization
- **Database**: SQLite with Redis caching for performance
- **Authentication**: Secure user management with session handling

---

## Features

### **Backend Features**
- **Multi-Modal Interface**: CLI and REST API support
- **User Authentication**: Secure login, registration, and profile management
- **Comprehensive Screening**: Fundamental, technical, and combined screening
- **Multiple Indices**: S&P 500, NASDAQ 100, and Dow 30 support
- **Technical Indicators**: RSI, Moving Averages, MACD, Bollinger Bands, ATR, OBV, Stochastic, ROC
- **Database Integration**: SQLite with caching and backup/restore capabilities
- **Flexible Output**: Console, JSON, and CSV formats
- **Data Sources**: Yahoo Finance (yfinance) integration

### **Frontend Features**
- **Modern UI**: Dark theme with responsive design
- **Interactive Charts**: Price history, candlestick, and volume charts
- **Real-time Data**: Live stock prices and updates
- **User Authentication**: Login/register forms with protected routes
- **Dynamic Screening**: Add/remove criteria with instant results
- **Pagination**: Handle large result sets efficiently
- **Stock Details**: Comprehensive stock information pages
- **URL State Management**: Preserve screening results across navigation

### **Planned Features**
- **User Watchlists**: Personalized stock tracking .. in dev


---

## Project Structure

```
stock-screener/
├── stock-screener-backend/     # Python Flask Backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── auth/               # Authentication routes
│   │   ├── api/                # API endpoints
│   │   ├── models/             # Database models
│   │   ├── screener/           # Screening logic
│   │   ├── data/               # Data fetching
│   │   └── database.py         # Database config
│   ├── tests/                  # Backend tests
│   ├── venv/                   # Python virtual environment
│   └── README.md
├── stock-screener-frontend/    # React Frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Main application pages
│   │   ├── contexts/           # React context providers
│   │   ├── services/           # API integration
│   │   └── styles/             # CSS modules
│   ├── public/                 # Static assets
│   └── package.json
├── requirements.txt            # Backend dependencies
└── README.md                   # This file
```

---

## Getting Started

### **Prerequisites**
- Python 3.8+
- Node.js 16+
- npm or yarn
- Redis (optional, for caching)

### **1. Clone the Repository**

```bash
git clone 
cd stock-screener
```

### **2. Backend Setup**

```bash
# Navigate to backend directory
cd stock-screener-backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On Linux/Mac:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install --upgrade pip
pip install -r ../requirements.txt

# Set up configuration files
cp app/config_template.py app/config.py
cp env.example .env

# Edit both files with your settings:
# - app/config.py: Update database credentials and other settings
# - .env: Set environment variables
```

**Important**: You need to set up two configuration files:

1. **`app/config.py`** (copied from `config_template.py`):
```python
# Update these values with your actual database credentials
DB_USER = "your_username"
DB_PASSWORD = "your_password"
SECRET_KEY = "your-super-secret-key-change-this-in-production"
```

2. **`.env`** file:
```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=stock_screener
DB_USER=your_username
DB_PASSWORD=your_password

# Flask Configuration
SECRET_KEY=your-super-secret-key-change-this-in-production

# Redis Configuration (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
```

**Note**: Both `config.py` and `.env` are ignored by git to protect your credentials. The template files (`config_template.py` and `env.example`) are safe to commit.

### **3. Frontend Setup**

```bash
# Navigate to frontend directory
cd ../stock-screener-frontend

# Install dependencies
npm install
# or
yarn install
```

### **4. Start the Application**

#### **Start Backend Server**
```bash
# In stock-screener-backend directory with venv activated
python -m app.main --mode api
```
Backend will be available at `http://localhost:5000`

#### **Start Frontend Development Server**
```bash
# In stock-screener-frontend directory
npm run dev
# or
yarn dev
```
Frontend will be available at `http://localhost:5173`

---

## Usage

### **Web Interface (Recommended)**

1. **Open your browser** and go to `http://localhost:5173`
2. **Register/Login** to access the screening features
3. **Set screening criteria** using the form:
   - Choose fundamental criteria (market cap, P/E ratio, etc.)
   - Choose technical criteria (RSI, moving averages, etc.)
   - Select stock index (S&P 500, NASDAQ 100, Dow 30)
4. **View results** in the interactive table
5. **Click on stocks** to see detailed information and charts
6. **Navigate through pages** using pagination controls

### **Command-Line Interface (Backend Only)**

```bash
# Fundamental screening
python -m app.main --mode cli --fundamental "market_cap>1000000000,pe_ratio<20"

# Technical screening
python -m app.main --mode cli --technical "rsi<30,ma>100"

# Combined screening
python -m app.main --mode cli --fundamental "sector=Technology" --technical "rsi>40"
```

### **API Endpoints (Backend)**

#### **Authentication**
```bash
# Register
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "email": "test@example.com", "password": "securepassword"}'

# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "securepassword"}'
```

#### **Stock Screening**
```bash
# Fundamental screening
curl -X POST http://localhost:5000/api/v1/screen/fundamental \
  -H "Content-Type: application/json" \
  -d '{"index": "sp500", "criteria": "market_cap>1000000000,pe_ratio<20", "limit": 10}'

# Get stock details
curl http://localhost:5000/api/v1/stock/AAPL
```

---

## Technology Stack

### **Backend Stack**
- **Framework**: Flask (Python)
- **Database**: SQLite + Redis (caching)
- **Authentication**: Flask-Login + Werkzeug
- **Data Source**: Yahoo Finance (yfinance)
- **Technical Analysis**: pandas-ta
- **API**: RESTful endpoints

### **Frontend Stack**
- **Framework**: React 18
- **Build Tool**: Vite
- **Routing**: React Router v6
- **State Management**: React Context + useState
- **Styling**: CSS Modules
- **HTTP Client**: Fetch API
- **Charts**: Chart.js (planned)

---

## Screening Criteria

### **Fundamental Fields**
- `market_cap`: Market capitalization
- `pe_ratio`: Price-to-earnings ratio
- `forward_pe`: Forward P/E ratio
- `price_to_book`: Price-to-book ratio
- `price_to_sales`: Price-to-sales ratio
- `dividend_yield`: Dividend yield
- `payout_ratio`: Dividend payout ratio
- `return_on_equity`: Return on equity
- `return_on_assets`: Return on assets
- `profit_margin`: Profit margin
- `operating_margin`: Operating margin
- `revenue_growth`: Revenue growth
- `earnings_growth`: Earnings growth
- `beta`: Beta coefficient
- `current_ratio`: Current ratio
- `debt_to_equity`: Debt-to-equity ratio
- `enterprise_to_revenue`: Enterprise value to revenue
- `enterprise_to_ebitda`: Enterprise value to EBITDA
- `sector`: Industry sector (exact match)
- `industry`: Industry (exact match)
- `country`: Country (exact match)

### **Technical Indicators**
- `rsi`: Relative Strength Index
- `ma`: Moving Average (20-day)
- `ema`: Exponential Moving Average (20-day)
- `macd_hist`: MACD Histogram
- `boll_upper`: Bollinger Bands Upper
- `boll_lower`: Bollinger Bands Lower
- `atr`: Average True Range
- `obv`: On-Balance Volume
- `stoch_k`: Stochastic %K
- `stoch_d`: Stochastic %D
- `roc`: Rate of Change

### **Operators**
- `>`: Greater than
- `<`: Less than
- `>=`: Greater than or equal to
- `<=`: Less than or equal to
- `==`: Equal to
- `!=`: Not equal to

---



### **Code Structure**
- **Modular Design**: Each component is in its own module
- **Separation of Concerns**: Data fetching, screening, and API are separate
- **Authentication**: User management with Flask-Login
- **Database**: SQLAlchemy models for user data
- **Frontend**: Component-based architecture with CSS modules

---

## Security Notes

- **Password Hashing**: All passwords are hashed using Werkzeug's security functions
- **Session Management**: Flask-Login handles secure session management
- **Input Validation**: All user inputs are validated and sanitized
- **SQL Injection Protection**: SQLAlchemy provides protection against SQL injection
- **CORS**: Configured for secure cross-origin requests
- **Environment Variables**: Sensitive data stored in environment variables

---

## Configuration

### **Backend Configuration**

The backend uses two configuration files to manage settings and credentials:

#### **1. Configuration File (`app/config.py`)**
This file contains application settings and database credentials. It's created by copying the template:

```bash
cp app/config_template.py app/config.py
```

**Key Configuration Options:**
```python
# Database Configuration
DB_HOST = "localhost"          # Database host
DB_PORT = 5432                 # Database port
DB_NAME = "stock_screener"     # Database name
DB_USER = "your_username"      # Database username
DB_PASSWORD = "your_password"  # Database password

# Flask Configuration
SECRET_KEY = "your-secret-key" # Flask session secret

# Redis Configuration
REDIS_HOST = "localhost"       # Redis host
REDIS_PORT = 6379             # Redis port
REDIS_DB = 0                  # Redis database number

# Logging Configuration
LOG_LEVEL = "INFO"            # Logging level
LOG_FILE = "stock_screener.log" # Log file path
```

## Database Setup

### **SQLite Database (Default)**

The application uses SQLite by default, which requires no additional setup:

```bash
# Database will be created automatically on first run
python -m app.main --mode api
```

**Database Location:** `stock_screener.db` in the backend directory

### **PostgreSQL Database (Optional)**

For production use, you can configure PostgreSQL:

1. **Install PostgreSQL:**
```bash
# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib

# macOS
brew install postgresql

# Windows
# Download from https://www.postgresql.org/download/windows/
```

2. **Create Database:**
```bash
sudo -u postgres psql
CREATE DATABASE stock_screener;
CREATE USER your_username WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE stock_screener TO your_username;
\q
```

3. **Update Configuration:**
```python
# In app/config.py
DB_HOST = "localhost"
DB_PORT = 5432
DB_NAME = "stock_screener"
DB_USER = "your_username"
DB_PASSWORD = "your_password"
```

### **Redis Database Setup**

Redis is used for caching stock prices and improving performance:

#### **Install Redis:**

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

**macOS:**
```bash
brew install redis
brew services start redis
```

**Windows:**
```bash
# Download from https://redis.io/download
# Or use WSL2 with Ubuntu
```

#### **Verify Redis Installation:**
```bash
redis-cli ping
# Should return: PONG
```

#### **Configure Redis (Optional):**
```bash
# Edit Redis configuration
sudo nano /etc/redis/redis.conf

# Key settings to consider:
# maxmemory 256mb
# maxmemory-policy allkeys-lru
# save 900 1
# save 300 10
# save 60 10000
```

#### **Redis Configuration in App:**
```python
# In app/config.py
REDIS_HOST = "localhost"
REDIS_PORT = 6379
REDIS_DB = 0

# Optional: Redis password (if configured)
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", None)
```

### **Database Management**

#### **Backup Database:**
```python
from app.database import backup_database
backup_file = backup_database()
print(f"Backup created: {backup_file}")
```

#### **Reset Database:**
```python
from app.database import reset_database
reset_database()  # ⚠️ Destructive - removes all data
```

#### **Database Statistics:**
```python
from app.database import get_database_stats
stats = get_database_stats()
print(f"Database stats: {stats}")
```

### **Production Database Considerations**

1. **Use PostgreSQL** for production instead of SQLite
2. **Set up Redis** for caching and performance
3. **Configure backups** for data safety
4. **Set proper permissions** for database users
5. **Use connection pooling** for high traffic
6. **Monitor database performance** and optimize queries

---

## Troubleshooting

### **Common Issues**

1. **Import Errors**: Make sure you're in the virtual environment
2. **Database Errors**: Run database setup manually
3. **API Connection Issues**: Check if the server is running on port 5000
4. **Data Fetching Issues**: Check internet connection and Yahoo Finance availability
5. **Authentication Issues**: Ensure Flask-Login is properly configured
6. **Frontend Build Issues**: Clear node_modules and reinstall dependencies
7. **CORS Issues**: Ensure backend CORS is configured for frontend domain
8. **Redis Connection Issues**: Check if Redis is running and accessible
9. **Configuration Issues**: Verify config.py and .env files are set up correctly

### **Database Troubleshooting**

**SQLite Issues:**
```bash
# Check database file permissions
ls -la stock_screener.db

# Repair corrupted database
sqlite3 stock_screener.db "VACUUM;"
```

**PostgreSQL Issues:**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection
psql -h localhost -U your_username -d stock_screener

# Check logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

**Redis Issues:**
```bash
# Check Redis status
sudo systemctl status redis-server

# Test Redis connection
redis-cli ping

# Check Redis logs
sudo tail -f /var/log/redis/redis-server.log

# Monitor Redis memory usage
redis-cli info memory
```

### **Logs**
- **Backend**: Check console output for Python logging messages
- **Frontend**: Check browser console for JavaScript errors
- **Network**: Use browser dev tools to inspect API requests
- **Database**: Check database-specific log files
- **Redis**: Check Redis server logs for connection issues

---

## Deployment

### **Backend Deployment**
- Use Gunicorn or uWSGI for production
- Set up environment variables
- Configure database for production
- Set up Redis for caching

### **Frontend Deployment**
- Build for production: `npm run build`
- Serve static files with nginx or similar
- Configure API proxy for production backend

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for both backend and frontend
5. Ensure both applications start correctly
6. Submit a pull request

---

## License

[Your License Here]

---

## Support

For issues and questions:
- Check the troubleshooting section
- Review the logs for error messages
- Ensure all dependencies are installed correctly
- Verify both backend and frontend are running
