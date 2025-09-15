# MarketPlus – Stock Screening & Analysis Platform

**MarketPlus** is a full-stack platform designed for real-time stock screening, investment analysis, and research. It combines a powerful backend with an intuitive frontend interface to deliver actionable insights for both technical and fundamental stock evaluation.

---
<img width="1903" height="907" alt="f080f18931311da6b009243ac59a6fe" src="https://github.com/user-attachments/assets/5cd44bc1-9fcc-489e-89f7-2215683660ba" />
<img width="1913" height="912" alt="21da4beca6281f393a2be2a07c742fd" src="https://github.com/user-attachments/assets/9554a969-8898-4aaf-8701-bb7057896c6d" />
<img width="1910" height="892" alt="image" src="https://github.com/user-attachments/assets/1b5fba35-9642-41df-98a9-00579c3a293d" />


<img width="1891" height="870" alt="a0db1ff459a30c1c3f8da62339ffe06" src="https://github.com/user-attachments/assets/6f94f749-18fa-467a-8e84-9d7cf6664c24" />
<img width="1882" height="917" alt="fed9ef8c33296146f1a6353c0965779" src="https://github.com/user-attachments/assets/0cae1d31-d85d-4387-bb8f-567906eb1b26" />
<img width="1540" height="871" alt="83e1a28de68c352511fc67f46f528cb" src="https://github.com/user-attachments/assets/c697f404-f6eb-45f7-9762-3b7de4cc535e" />






!
## 🚀 Overview

- **Backend**: Python Flask API with Redis caching and a modular screening engine
- **Frontend**: React-based UI with real-time data visualization and user authentication
- **Database**: SQLite (default) with optional PostgreSQL for production use
- **Authentication**: Flask-Login and secure session handling

---

## 🔑 Features

### Backend
- REST API and CLI for screening workflows
- Supports screening on S&P 500, NASDAQ 100, and Dow 30
- Technical indicators: RSI, MACD, Moving Averages, Bollinger Bands, etc.
- Fundamental metrics: P/E Ratio, Market Cap, ROE, Debt/Equity, etc.
- Redis caching for improved performance
- Data integration with Yahoo Finance (yfinance)
- Output formats: JSON, CSV, CLI

### Frontend
- Responsive, modern UI with dark mode
- Dynamic stock screening with custom filters
- Secure login/register system
- Real-time data visualization (charts, prices, indicators)
- Pagination, detailed stock views, and saved screeners (planned)

---

## 🛠️ Tech Stack

- **Backend**: Python, Flask, Redis, SQLite/PostgreSQL
- **Frontend**: React, Vite, React Router
- **Visualization**: Chart.js (planned)
- **Styling**: Tailwind / CSS Modules
- **DevOps**: Docker, GCP, Git
- **Testing**: Unit & integration tests for backend

---

## 📦 Project Structure

```
marketplus/
├── backend/
│   ├── app/
│   ├── api/
│   ├── auth/
│   ├── screener/
│   └── models/
├── frontend/
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── styles/
├── tests/
├── README.md
└── requirements.txt
```

---

## ⚙️ Setup Guide

### Prerequisites
- Python 3.8+
- Node.js 16+
- Redis (optional, recommended)

### Backend Setup
```bash
cd marketplus/backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate
pip install -r ../requirements.txt
cp app/config_template.py app/config.py
cp env.example .env
```

Update `config.py` and `.env` with your DB and Redis credentials.

### Frontend Setup
```bash
cd ../frontend
npm install
```

### Run Application
```bash
# Backend
python -m app.main --mode api  # http://localhost:5000

# Frontend
npm run dev  # http://localhost:5173
```

---

## 🧪 Usage

### Web Interface
- Register/Login
- Set screening criteria (e.g., RSI < 30, Market Cap > $1B)
- View, sort, and navigate results
- Inspect stock details and visualizations

### CLI
```bash
python -m app.main --mode cli --fundamental "market_cap>1000000000"
```

---

## 🔐 Security Features

- Password hashing with Werkzeug
- Session handling with Flask-Login
- SQL injection protection via SQLAlchemy
- CORS configuration and input sanitization

---

## 🚀 Deployment Tips

- Use Gunicorn or uWSGI in production
- PostgreSQL + Redis recommended for scale
- Serve frontend via Nginx or any static file server
- Configure `.env` securely and set logging levels

---

## 🙌 Contributing

1. Fork and create a feature branch
2. Add your changes with tests
3. Submit a pull request with a description

---

## 📄 License

MIT or your license here

---

## 💬 Support

- Log issues on GitHub
- Check the Troubleshooting section
- Ensure both servers are running and configs are correct

---

**Built with ❤️ by developers for investors.**
