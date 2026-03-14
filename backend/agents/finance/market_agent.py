import yfinance as yf
from google.adk.agents import Agent
from google.adk.tools import FunctionTool, google_search
from google.adk.tools.agent_tool import AgentTool
from dotenv import load_dotenv
from datetime import datetime, timedelta
import json

load_dotenv()


def get_market_summary() -> dict:
    """
    Get summary of major market indices (S&P 500, NASDAQ, DOW, etc.)
    """
    indices = {
        "^GSPC": "S&P 500",
        "^DJI": "Dow Jones",
        "^IXIC": "NASDAQ",
        "^RUT": "Russell 2000",
        "^VIX": "VIX (Volatility)",
    }
    
    summary = {}
    for symbol, name in indices.items():
        try:
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period="5d")
            if len(hist) >= 2:
                current = hist['Close'].iloc[-1]
                previous = hist['Close'].iloc[-2]
                change = ((current - previous) / previous) * 100
                summary[name] = {
                    "current": round(current, 2),
                    "change": round(change, 2),
                    "previous_close": round(previous, 2),
                }
        except Exception as e:
            summary[name] = {"error": str(e)}
    
    return summary


def get_sector_performance() -> dict:
    """
    Get performance of major market sectors.
    """
    sector_etfs = {
        "Technology": "XLK",
        "Healthcare": "XLV",
        "Financials": "XLF",
        "Energy": "XLE",
        "Consumer Discretionary": "XLY",
        "Consumer Staples": "XLP",
        "Industrials": "XLI",
        "Materials": "XLB",
        "Real Estate": "XLRE",
        "Utilities": "XLU",
        "Communication Services": "XLC",
    }
    
    performance = {}
    for sector, etf in sector_etfs.items():
        try:
            ticker = yf.Ticker(etf)
            hist = ticker.history(period="1y")
            if len(hist) >= 2:
                yearly_return = ((hist['Close'].iloc[-1] / hist['Close'].iloc[0]) - 1) * 100
                performance[sector] = {
                    "etf": etf,
                    "yearly_return": round(yearly_return, 2),
                    "current_price": round(hist['Close'].iloc[-1], 2),
                }
        except Exception as e:
            performance[sector] = {"error": str(e)}
    
    # Sort by yearly return
    sorted_performance = dict(sorted(
        performance.items(),
        key=lambda x: x[1].get("yearly_return", 0),
        reverse=True
    ))
    
    return sorted_performance


def get_market_news() -> dict:
    """
    Get latest market news and trends.
    """
    try:
        # Get major indices news
        tickers = ["^GSPC", "^DJI", "^IXIC"]
        news_items = []
        
        for symbol in tickers:
            ticker = yf.Ticker(symbol)
            news = ticker.news
            if news:
                for item in news[:2]:
                    news_items.append({
                        "title": item.get("title", ""),
                        "publisher": item.get("publisher", ""),
                        "link": item.get("link", ""),
                    })
        
        return {"news": news_items[:10]}
    except Exception as e:
        return {"error": str(e)}


def analyze_market_trend(symbols: list) -> dict:
    """
    Analyze overall market trend based on multiple symbols.
    """
    trends = []
    for symbol in symbols:
        try:
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period="3mo")
            
            if len(hist) >= 20:
                # Simple trend analysis
                recent = hist['Close'].iloc[-10:].mean()
                earlier = hist['Close'].iloc[:10].mean()
                trend = "Bullish" if recent > earlier else "Bearish"
                change_pct = ((hist['Close'].iloc[-1] / hist['Close'].iloc[0]) - 1) * 100
                
                trends.append({
                    "symbol": symbol,
                    "trend": trend,
                    "3month_change": round(change_pct, 2),
                    "current_price": round(hist['Close'].iloc[-1], 2),
                })
        except Exception as e:
            trends.append({"symbol": symbol, "error": str(e)})
    
    bullish_count = sum(1 for t in trends if t.get("trend") == "Bullish")
    bearish_count = len(trends) - bullish_count
    
    overall_trend = "Bullish" if bullish_count > bearish_count else "Bearish" if bearish_count > bullish_count else "Neutral"
    
    return {
        "individual_trends": trends,
        "overall_trend": overall_trend,
        "bullish_count": bullish_count,
        "bearish_count": bearish_count,
    }


def get_crypto_prices() -> dict:
    """
    Get prices of major cryptocurrencies.
    """
    crypto_symbols = {
        "Bitcoin": "BTC-USD",
        "Ethereum": "ETH-USD",
        "Solana": "SOL-USD",
        "Cardano": "ADA-USD",
        "Ripple": "XRP-USD",
    }
    
    prices = {}
    for name, symbol in crypto_symbols.items():
        try:
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period="7d")
            if len(hist) >= 2:
                current = hist['Close'].iloc[-1]
                weekly_change = ((current / hist['Close'].iloc[0]) - 1) * 100
                prices[name] = {
                    "price": round(current, 2),
                    "weekly_change": round(weekly_change, 2),
                }
        except Exception as e:
            prices[name] = {"error": str(e)}
    
    return prices


def get_economic_indicators() -> dict:
    """
    Get key economic indicators (simulated based on common data).
    """
    # These would typically come from FRED API or other economic data sources
    # For now, providing structure and common indicators
    return {
        "indicators": {
            "US_10Y_Treasury": "Tracking bond yields",
            "USD_Index": "US Dollar strength",
            "Gold": "Safe haven indicator",
            "Oil": "Energy market health",
        },
        "note": "Connect to FRED API for live data"
    }


get_market_summary_tool = FunctionTool(func=get_market_summary)
get_sector_performance_tool = FunctionTool(func=get_sector_performance)
get_market_news_tool = FunctionTool(func=get_market_news)
analyze_market_trend_tool = FunctionTool(func=analyze_market_trend)
get_crypto_prices_tool = FunctionTool(func=get_crypto_prices)
get_economic_indicators_tool = FunctionTool(func=get_economic_indicators)


market_analyst_agent = Agent(
    name="market_analyst",
    model="gemini-2.5-flash",
    description="Analyzes market trends, sector performance, and provides market insights",
    instruction="""
    You are a Market Analyst agent specialized in market-wide analysis and trends.
    
    Your capabilities:
    1. Market summary (major indices performance)
    2. Sector performance analysis
    3. Market trend analysis
    4. Cryptocurrency prices
    5. Economic indicators
    6. Latest market news
    
    When analyzing the market:
    1. Use get_market_summary for overall market health
    2. Use get_sector_performance to identify top/bottom sectors
    3. Use analyze_market_trend for specific symbol analysis
    4. Use get_market_news for latest developments
    
    Provide insights on:
    - Overall market direction (bullish/bearish)
    - Best and worst performing sectors
    - Key levels to watch
    - Potential market risks
    
    Use google_search to get latest market news and developments.
    """,
    tools=[
        get_market_summary_tool,
        get_sector_performance_tool,
        get_market_news_tool,
        analyze_market_trend_tool,
        get_crypto_prices_tool,
        get_economic_indicators_tool,
        google_search,
    ],
)

market_analyst_tool = AgentTool(agent=market_analyst_agent)
