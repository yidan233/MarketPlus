# Stock Screener Backend

A modular Python stock screener backend with fundamental and technical analysis capabilities, featuring CLI and REST API interfaces with user authentication.

---

## Features

- **Multi-Modal Interface**: CLI and REST API support
- **User Authentication**: Secure login, registration, and profile management
- **Comprehensive Screening**: Fundamental, technical, and combined screening
- **Multiple Indices**: S&P 500, NASDAQ 100, and Dow 30 support
- **Technical Indicators**: RSI, Moving Averages, MACD, Bollinger Bands, ATR, OBV, Stochastic, ROC
- **Database Integration**: SQLite with caching and backup/restore capabilities
- **Flexible Output**: Console, JSON, and CSV formats
- **Data Sources**: Yahoo Finance (yfinance) integration
- **User Watchlists**: Personalized stock watchlists (coming soon)

---

## Getting Started

### 1. **Clone the Repository**

```bash
git clone <your-repo-url>
cd stock-screener-backend
```

### 2. **Set Up Python Environment**

```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On Linux/Mac:
source venv/bin/activate
# On Windows:
venv\Scripts\activate
```

### 3. **Install Dependencies**

```bash
# Upgrade pip
pip install --upgrade pip

# Install requirements
pip install -r ../requirements.txt
```

### 4. **Set Up Database**

The application will automatically create the database on first run, but you can manually set it up:

```bash
# From the project root
python -c "from app.database import setup_database; setup_database()"
```

---

## Usage

### **Command-Line Interface (CLI)**

The CLI supports fundamental, technical, and combined screening:

#### **Basic Usage**
```bash
# Fundamental screening
python -m app.main --mode cli --fundamental "market_cap>1000000000,pe_ratio<20"

# Technical screening
python -m app.main --mode cli --technical "rsi<30,ma>100"

# Combined screening
python -m app.main --mode cli --fundamental "sector=Technology" --technical "rsi>40"
```

#### **Advanced Options**
```bash
# Different index
python -m app.main --mode cli --fundamental "market_cap>1000000000" --index dow30

# Custom data period
python -m app.main --mode cli --fundamental "market_cap>1000000000" --period 1y --interval 1d

# Force reload data
python -m app.main --mode cli --fundamental "market_cap>1000000000" --reload

# Output to file
python -m app.main --mode cli --fundamental "market_cap>1000000000" --output json --output-file results.json
```

#### **CLI Options**
- `--index`: Choose from `sp500`, `nasdaq100`, `dow30` (default: sp500)
- `--fundamental`: Fundamental criteria string
- `--technical`: Technical criteria string
- `--limit`: Maximum results (default: 20)
- `--output`: Output format - `console`, `json`, `csv` (default: console)
- `--output-file`: Output file path
- `--reload`: Force reload data (ignore cache)
- `--period`: Data period - `1d`, `5d`, `1mo`, `3mo`, `6mo`, `1y`, `2y`, `5y`, `10y`, `ytd`, `max` (default: 1mo)
- `--interval`: Data interval - `1m`, `2m`, `5m`, `15m`, `30m`, `60m`, `90m`, `1h`, `1d`, `5d`, `1wk`, `1mo`, `3mo` (default: 1d)

### **REST API**

#### **Start the API Server**
```bash
python -m app.main --mode api
```

The API will be available at `http://localhost:5000`

#### **Authentication Endpoints**

**User Registration**
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "securepassword"
  }'
```

**User Login**
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "securepassword"
  }'
```

**Get User Profile**
```bash
curl http://localhost:5000/api/v1/auth/profile \
  -H "Cookie: session=your-session-cookie"
```

**Update User Profile**
```bash
curl -X PUT http://localhost:5000/api/v1/auth/profile \
  -H "Content-Type: application/json" \
  -H "Cookie: session=your-session-cookie" \
  -d '{
    "email": "newemail@example.com",
    "password": "newpassword"
  }'
```

**User Logout**
```bash
curl -X POST http://localhost:5000/api/v1/auth/logout \
  -H "Cookie: session=your-session-cookie"
```

#### **Stock Screening Endpoints**

**Get Available Indexes**
```bash
curl http://localhost:5000/api/v1/indexes
```

**Get Stock Symbols**
```bash
curl http://localhost:5000/api/v1/symbols/sp500
```

**Fundamental Screening**
```bash
curl -X POST http://localhost:5000/api/v1/screen/fundamental \
  -H "Content-Type: application/json" \
  -d '{
    "index": "sp500",
    "criteria": "market_cap>1000000000,pe_ratio<20",
    "limit": 10
  }'
```

**Technical Screening**
```bash
curl -X POST http://localhost:5000/api/v1/screen/technical \
  -H "Content-Type: application/json" \
  -d '{
    "index": "sp500",
    "criteria": "rsi<30,ma>100",
    "limit": 10
  }'
```

**Combined Screening**
```bash
curl -X POST http://localhost:5000/api/v1/screen/combined \
  -H "Content-Type: application/json" \
  -d '{
    "index": "sp500",
    "fundamental_criteria": "sector=Technology",
    "technical_criteria": "rsi>40",
    "limit": 10
  }'
```

**Get Stock Details**
```bash
curl http://localhost:5000/api/v1/stock/AAPL
```

**Get Available Indicators**
```bash
curl http://localhost:5000/api/v1/indicators
```

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

### **Criteria Examples**
```bash
# Fundamental examples
"market_cap>1000000000,pe_ratio<20"
"sector=Technology,market_cap>50000000000"

# Technical examples
"rsi<30,ma>100"
"rsi>70,ema<50"

# Combined examples
fundamental: "sector=Technology,market_cap>10000000000"
technical: "rsi>40,rsi<70"
```

---

## Database Management

### **Database Utilities**
```python
from app.database import get_database_stats, backup_database, reset_database

# Get database statistics
stats = get_database_stats()

# Create backup
backup_file = backup_database()

# Reset database (⚠️ Destructive!)
reset_database()
```

---

## Development

### **Running Tests**
```bash
# Run all tests
python -m pytest

# Run specific test file
python -m pytest tests/test_screener.py
```

### **Code Structure**
- **Modular Design**: Each component is in its own module
- **Separation of Concerns**: Data fetching, screening, and API are separate
- **Authentication**: User management with Flask-Login
- **Database**: SQLAlchemy models for user data

### **Project Structure**
```
stock-screener-backend/
├── app/
│   ├── __init__.py
│   ├── auth/           # Authentication routes and logic
│   ├── api/            # API routes
│   ├── models/         # Database models (User, etc.)
│   ├── screener/       # Screening logic
│   ├── data/           # Data fetching and caching
│   └── database.py     # Database configuration
├── tests/              # Test files
├── venv/               # Virtual environment
└── README.md
```

---

## Security Notes

- **Password Hashing**: All passwords are hashed using Werkzeug's security functions
- **Session Management**: Flask-Login handles secure session management
- **Input Validation**: All user inputs are validated and sanitized
- **SQL Injection Protection**: SQLAlchemy provides protection against SQL injection

---

## Future Features

- [ ] User watchlists with personalized stock tracking
- [ ] Email notifications for price alerts
- [ ] Advanced charting and technical analysis
- [ ] Portfolio tracking and performance analysis
- [ ] Social features (sharing screens, following other users)
- [ ] API rate limiting and usage tracking 