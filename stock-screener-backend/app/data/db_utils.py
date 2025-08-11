import pandas as pd
from datetime import datetime, timedelta
import logging
from app.database.models import Stock, HistoricalPrice
from io import StringIO

# for interacting with database 

logger = logging.getLogger(__name__)

def load_from_database(symbol, session_factory, max_age_days=7):
    session = session_factory()
    try:
        cutoff_date = datetime.now().date() - timedelta(days=max_age_days)
        recent_count = (
            session.query(HistoricalPrice)
            .filter(HistoricalPrice.symbol == symbol,
                    HistoricalPrice.date >= cutoff_date)
            .count()
        )
        if recent_count < 1:
            return None

        rows = (
            session.query(HistoricalPrice)
            .filter(HistoricalPrice.symbol == symbol)
            .order_by(HistoricalPrice.date.asc())
            .all()
        )
        if not rows:
            return None

        df = pd.DataFrame([{
            "Date": r.date,
            "Open": r.open,
            "High": r.high,
            "Low":  r.low,
            "Close": r.close,
            "Volume": r.volume,
        } for r in rows])
        df["Date"] = pd.to_datetime(df["Date"])
        df.set_index("Date", inplace=True)

        stock = session.query(Stock).filter(Stock.symbol == symbol).first()
        stock_info = {
            "symbol": symbol,
            "shortName": stock.name if stock else symbol,
            "sector": stock.sector if stock else "Unknown",
            "industry": stock.industry if stock else None,
            "marketCap": stock.market_cap if stock else None,
            "currentPrice": stock.current_price if stock else None,
            "peRatio": stock.pe_ratio if stock else None,
            "dividendYield": stock.dividend_yield if stock else None,
            "beta": stock.beta if stock else None,
        }
        if stock and stock.info:
            stock_info.update(stock.info)

        return {"historical_json": df.to_json(orient="split"), "info": stock_info, "last_updated": datetime.now().isoformat()}
    except Exception as e:
        logger.error(f"Error loading {symbol} from database: {e}")
        return None
    finally:
        session.close()


def save_to_database(symbol, data, session_factory):
    session = session_factory()
    try:
        info = data.get('info', {})
        stock = session.query(Stock).filter(Stock.symbol == symbol).first()

        stock_fields = dict(
            symbol=symbol,
            name=info.get('shortName', symbol),
            sector=info.get('sector'),
            industry=info.get('industry'),
            market_cap=info.get('marketCap'),
            current_price=info.get('currentPrice'),
            pe_ratio=info.get('trailingPE'),
            dividend_yield=info.get('dividendYield'),
            beta=info.get('beta'),
            info=info,
        )

        if not stock:
            stock = Stock(**stock_fields)
            session.add(stock)
        else:
            for k, v in stock_fields.items():
                setattr(stock, k, v)

        session.flush()  # ensure parent 

        # Replace existing history
        session.query(HistoricalPrice)\
               .filter(HistoricalPrice.symbol == symbol)\
               .delete(synchronize_session=False)

        historical = data.get("historical")
        if isinstance(historical, str):
            historical = pd.read_json(historical, orient="split")
        elif "historical_json" in data and isinstance(data["historical_json"], str):
            historical = pd.read_json(data["historical_json"], orient="split")

        if isinstance(historical, pd.DataFrame) and not historical.empty:
            df = historical.copy()
            if df.index.name is None or str(df.index.name).lower() != "date":
                df.index.name = "Date"
            df = df.reset_index()

            to_add = []
            for row in df.itertuples(index=False):
                date_val = pd.to_datetime(getattr(row, "Date")).date()
                to_add.append(HistoricalPrice(
                    symbol=symbol,
                    date=date_val,
                    open=float(getattr(row, "Open")) if "Open" in df.columns and pd.notna(getattr(row, "Open")) else None,
                    high=float(getattr(row, "High")) if "High" in df.columns and pd.notna(getattr(row, "High")) else None,
                    low=float(getattr(row, "Low")) if "Low" in df.columns and pd.notna(getattr(row, "Low")) else None,
                    close=float(getattr(row, "Close")) if "Close" in df.columns and pd.notna(getattr(row, "Close")) else None,
                    volume=int(getattr(row, "Volume")) if "Volume" in df.columns and pd.notna(getattr(row, "Volume")) else None,
                ))

            # Use add_all (respects ORM ordering) instead of bulk_save_objects
            session.add_all(to_add)

        session.commit()
    except Exception:
        session.rollback()
        logger.exception(f"Error saving {symbol} to database")
    finally:
        session.close()
