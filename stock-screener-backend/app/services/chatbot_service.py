import google.generativeai as genai
from app.config import GEMINI_API_KEY
import logging

logger = logging.getLogger(__name__)

class StockScreenerChatbot:
    def __init__(self):
        if not GEMINI_API_KEY:
            logger.warning("GEMINI_API_KEY not found. Chatbot will not work.")
            self.model = None
            return
            
        try:
            genai.configure(api_key=GEMINI_API_KEY)
            self.model = genai.GenerativeModel('gemini-2.5-flash')
            logger.info("✅ Gemini chatbot initialized successfully!")
        except Exception as e:
            logger.error(f"❌ Failed to initialize Gemini chatbot: {e}")
            self.model = None
    
    def get_index_advice(self, user_question):
        """Get advice about which stock index to use for screening"""
        if not self.model:
            return {
                "success": False,
                "message": "Chatbot is not available. Please check your API key configuration."
            }
        
        try:
            # Create a context-aware prompt with actual supported fields
            prompt = f"""
You are a financial advisor specializing in stock screening. A user wants to know which stock index to use for screening.

Available indices:
- S&P 500 (sp500): 500 largest US companies, good for large-cap stocks
- NASDAQ 100 (nasdaq100): 100 largest non-financial companies on NASDAQ, tech-heavy
- Dow 30 (dow30): 30 large, well-established US companies, blue-chip stocks

Available Fundamental Screening Fields:
- market_cap, pe_ratio, forward_pe, price_to_book, price_to_sales
- dividend_yield, payout_ratio, return_on_equity, return_on_assets
- profit_margin, operating_margin, revenue_growth, earnings_growth
- beta, current_ratio, debt_to_equity, enterprise_to_revenue, enterprise_to_ebitda
- sector, industry, country (exact match fields)

Available Technical Screening Fields:
- ma (Moving Average), ema (Exponential Moving Average)
- rsi (Relative Strength Index), macd_hist (MACD Histogram)
- boll_upper/boll_lower (Bollinger Bands), atr (Average True Range)
- obv (On Balance Volume), stoch_k/stoch_d (Stochastic Oscillator)
- roc (Rate of Change)

User question: {user_question}

Respond with:
- The best index (one line)
- 1-sentence reason why
- 3–5 recommended screening fields for that index

⚠️ Do NOT include section titles, paragraphs, or explanations. Just concise bullet points or short sentences. Max 5 lines. Keep response under 150 words.
"""
            
            response = self.model.generate_content(prompt)
            
            return {
                "success": True,
                "advice": response.text,
                "model": "gemini-2.5-flash"
            }
            
        except Exception as e:
            logger.error(f"Error getting chatbot advice: {e}")
            return {
                "success": False,
                "message": f"Sorry, I encountered an error: {str(e)}"
            }
    
    def get_screening_advice(self, user_question):
        """Get advice about screening criteria and fields"""
        if not self.model:
            return {
                "success": False,
                "message": "Chatbot is not available. Please check your API key configuration."
            }
        
        try:
            prompt = f"""
You are a helpful financial advisor specializing in stock screening strategies. A user is asking about screening criteria and field selection.

Available Fundamental Screening Fields:
- market_cap, pe_ratio, forward_pe, price_to_book, price_to_sales
- dividend_yield, payout_ratio, return_on_equity, return_on_assets
- profit_margin, operating_margin, revenue_growth, earnings_growth
- beta, current_ratio, debt_to_equity, enterprise_to_revenue, enterprise_to_ebitda
- sector, industry, country (exact match fields)

Available Technical Screening Fields:
- ma (Moving Average), ema (Exponential Moving Average)
- rsi (Relative Strength Index), macd_hist (MACD Histogram)
- boll_upper/boll_lower (Bollinger Bands), atr (Average True Range)
- obv (On Balance Volume), stoch_k/stoch_d (Stochastic Oscillator)
- roc (Rate of Change)

Common Screening Strategies:
- Value Investing: low pe_ratio, low price_to_book, high dividend_yield
- Growth Investing: high revenue_growth, high earnings_growth, high pe_ratio
- Quality Investing: high return_on_equity, high profit_margin, low debt_to_equity
- Momentum Trading: rsi > 50, price > ma, macd_hist > 0
- Mean Reversion: rsi < 30, price < boll_lower, stoch_k < 20

User question: {user_question}

Respond with:
- Strategy type if mentioned or implied
- 3–5 recommended fields
- 1-line example combo

⚠️ Be concise. No sections or paragraphs. Just bullet points or short lines. Max 7 lines. Keep response under 150 words.
"""
            
            response = self.model.generate_content(prompt)
            
            return {
                "success": True,
                "advice": response.text,
                "model": "gemini-2.5-flash"
            }
            
        except Exception as e:
            logger.error(f"Error getting screening advice: {e}")
            return {
                "success": False,
                "message": f"Sorry, I encountered an error: {str(e)}"
            }
    
    def get_general_advice(self, user_question):
        """Get general stock screening advice"""
        if not self.model:
            return {
                "success": False,
                "message": "Chatbot is not available. Please check your API key configuration."
            }
        
        try:
            prompt = f"""
You are a helpful financial advisor specializing in stock screening and investment strategies. 

User question: {user_question}

Respond with:
- Direct answer (2-3 lines max)
- Key point or tip if relevant

⚠️ Be concise. No sections or paragraphs. Just short, clear sentences. Max 4 lines. Keep response under 150 words.
"""
            
            response = self.model.generate_content(prompt)
            
            return {
                "success": True,
                "advice": response.text,
                "model": "gemini-2.5-flash"
            }
            
        except Exception as e:
            logger.error(f"Error getting general advice: {e}")
            return {
                "success": False,
                "message": f"Sorry, I encountered an error: {str(e)}"
            }

chatbot = StockScreenerChatbot()
