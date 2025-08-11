import pandas as pd
import yfinance as yf
import logging
import time
from datetime import datetime
from app.data.redis_cache import get_stock_data, set_stock_data
import threading
import traceback

logger = logging.getLogger(__name__)

# --------------------------------------------------------------------
# Helper: run in background thread to refresh cache from Yahoo
# --------------------------------------------------------------------
def refresh_cache_async(symbols, period, interval, save_to_db):
    fresh_data = _fetch_fresh_data(symbols, period, interval)
    for symbol, data in fresh_data.items():
        if save_to_db:
            try:
                save_to_db(symbol, data)
            except Exception as e:
                logger.warn(f"save_to_db failed for {symbol}: {e}")
        try:
            set_stock_data(symbol, data)
        except Exception as e:
            logger.warn(f"set_stock_data failed for {symbol}: {e}")


# --------------------------------------------------------------------
# High-level: fetch data, using Redis/DB caches before Yahoo
# --------------------------------------------------------------------
def fetch_yfinance_data(symbols, period="1y", interval="1d", reload=False, load_from_db=None, save_to_db=None):
    result = {}
    symbols_to_fetch = []

    # Normalize input -> list of unique Yahoo-ready symbols
    if isinstance(symbols, str):
        symbols = [symbols]
    elif symbols is None:
        symbols = []

    cleaned = []
    seen = set()
    for s in symbols:
        if not isinstance(s, str):
            continue
        sym = s.strip()
        if not sym:
            continue
        sym = sym.upper().replace(".", "-")  # Yahoo Finance format
        if sym not in seen:
            seen.add(sym)
            cleaned.append(sym)
    symbols = cleaned

    if not symbols:
        return result

    # If reload -> fetch everything fresh
    if reload:
        logger.info(f"Reload=True, fetching {len(symbols)} symbols fresh.")
        fresh_data = _fetch_fresh_data(symbols, period, interval)
        for symbol, data in fresh_data.items():
            if not data:
                continue
            result[symbol] = data
            if save_to_db:
                try:
                    save_to_db(symbol, data)
                except Exception as e:
                    logger.debug(f"save_to_db failed for {symbol}: {e}")
            try:
                set_stock_data(symbol, data)
            except Exception as e:
                logger.debug(f"set_stock_data failed for {symbol}: {e}")
        return result

    # Otherwise, check caches first
    for symbol in symbols:
        # 1) Try Redis cache
        try:
            cached_data = get_stock_data(symbol)
        except Exception as e:
            logger.debug(f"get_stock_data failed for {symbol}: {e}")
            cached_data = None

        if cached_data:
            result[symbol] = cached_data
            continue

        # 2) Try DB cache
        db_data = None
        if load_from_db:
            try:
                db_data = load_from_db(symbol)
            except Exception as e:
                logger.debug(f"load_from_db failed for {symbol}: {e}")

        if db_data:
            result[symbol] = db_data
            threading.Thread(
                target=refresh_cache_async,
                args=([symbol], period, interval, save_to_db),
                daemon=True
            ).start()
            continue

        # 3) Need fresh data
        symbols_to_fetch.append(symbol)

    if symbols_to_fetch:
        logger.info(f"Fetching fresh data for {len(symbols_to_fetch)} symbols: {symbols_to_fetch}")
        fresh_data = _fetch_fresh_data(symbols_to_fetch, period, interval)
        for symbol, data in fresh_data.items():
            if not data:
                continue
            result[symbol] = data
            if save_to_db:
                try:
                    save_to_db(symbol, data)
                except Exception as e:
                    logger.debug(f"save_to_db failed for {symbol}: {e}")
            try:
                set_stock_data(symbol, data)
            except Exception as e:
                logger.debug(f"set_stock_data failed for {symbol}: {e}")

    return result


# --------------------------------------------------------------------
# Low-level: always fetch fresh data from Yahoo Finance
# --------------------------------------------------------------------
def _fetch_fresh_data(symbols, period="1y", interval="1d"):
    result = {}

    if isinstance(symbols, str):
        symbols = [symbols]

    # Normalize and de-dupe safely
    cleaned = []
    seen = set()
    for s in symbols:
        if not isinstance(s, str):
            continue
        sym = s.strip().upper().replace(".", "-")
        if sym and sym not in seen:
            seen.add(sym)
            cleaned.append(sym)
    symbols = cleaned

    batch_size = 20
    batches = [symbols[i:i + batch_size] for i in range(0, len(symbols), batch_size)]

    for batch in batches:
        logger.info(f"Fetching batch of {len(batch)} symbols from Yahoo: {batch}")
        try:
            tickers_arg = batch[0] if len(batch) == 1 else batch

            data = yf.download(
                tickers=tickers_arg,
                period=period,
                interval=interval,
                group_by="ticker",
                auto_adjust=True,
                prepost=False,
                threads=True,
                progress=False,
            )

            if data is None:
                logger.warning(f"yfinance returned None for batch: {batch}")
                continue

            single = len(batch) == 1
            logger.warning("getting stock info from yfinance=======")

            for symbol in batch:
                try:
                    symbol_df = data if single else data.get(symbol)
                    if symbol_df is None or not hasattr(symbol_df, "empty") or symbol_df.empty:
                        logger.warning(f"No data available for {symbol}")
                        continue

                    symbol_df = symbol_df.dropna()
                    if symbol_df.empty:
                        logger.warning(f"No valid data for {symbol} after dropna()")
                        continue

                    # Flatten MultiIndex -> "AAPL_Close" then strip "AAPL_"
                    if isinstance(symbol_df.columns, pd.MultiIndex):
                        symbol_df.columns = [
                            "_".join(col).strip() if isinstance(col, tuple) else col
                            for col in symbol_df.columns.values
                        ]
                        prefix = f"{symbol}_"
                        rename_map = {c: c[len(prefix):] for c in symbol_df.columns if c.startswith(prefix)}
                        if rename_map:
                            symbol_df = symbol_df.rename(columns=rename_map)

                    # Expected OHLCV columns
                    expected_cols = {"Open", "High", "Low", "Close", "Volume"}
                    have_cols = set(symbol_df.columns)
                    if not expected_cols.issubset(have_cols):
                        logger.warning(f"Column mismatch for {symbol}: have {list(have_cols)}, expected {list(expected_cols)}")

                    # Keep only standard OHLCV if present
                    wanted_cols = [c for c in expected_cols if c in symbol_df.columns]
                    if wanted_cols:
                        symbol_df = symbol_df[wanted_cols]

                    entry = {
                        "historical": symbol_df,
                        "last_updated": datetime.now().isoformat(),
                        "info": {"symbol": symbol},
                        "financials": {},
                    }

                    # Best-effort metadata & financials
                    try:
                        t = yf.Ticker(symbol)

                        # fast_info (lightweight)
                        try:
                            fi = getattr(t, "fast_info", None)
                            if fi:
                                entry["info"].update(dict(fi))
                        except Exception:
                            pass

                        # info (heavier / flaky)
                        try:
                            info = t.info
                            if isinstance(info, dict) and info:
                                entry["info"].update(info)
                        except Exception as e:
                            logger.debug(f"ticker.info failed for {symbol}: {e}\n{traceback.format_exc()}")

                        # financials (best-effort)
                        try:
                            entry["financials"] = {
                                "income_statement": t.income_stmt,
                                "balance_sheet": t.balance_sheet,
                                "cash_flow": t.cashflow,
                            }
                        except Exception as e:
                            logger.debug(f"financials fetch failed for {symbol}: {e}\n{traceback.format_exc()}")

                    except Exception as e:
                        logger.debug(f"yf.Ticker init failed for {symbol}: {e}\n{traceback.format_exc()}")

                    result[symbol] = entry

                except Exception as e:
                    logger.error(f"Error processing data for {symbol}: {e}\n{traceback.format_exc()}")

        except Exception as e:
            logger.error(f"Error fetching data for batch {batch}: {e}\n{traceback.format_exc()}")

    return result
