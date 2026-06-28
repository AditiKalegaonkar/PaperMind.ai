import requests
from bs4 import BeautifulSoup
import yfinance
from typing import List, Dict

# Legal Tools
def get_legal_definition(word: str):
    """Look up a legal term in the Nolo Legal Dictionary."""
    try:
        url = f"https://www.nolo.com/dictionary/{word.lower()}-term.html"
        r = requests.get(url, timeout=5)
        r.raise_for_status()
        div = BeautifulSoup(r.text, "html.parser").find("div", class_="definition")
        return div.get_text(separator="\n").strip() if div else None
    except requests.RequestException:
        return None


def get_article_information():
    """Fetch Constitution of India article listing."""
    try:
        r = requests.get("https://www.constitutionofindia.net/articles/article", timeout=5)
        r.raise_for_status()
        div = BeautifulSoup(r.text, "html.parser").find("div")
        return div.get_text(strip=True) if div else None
    except requests.RequestException:
        return None
    
# Finance tools

def get_market_summary(symbols: List[str]) -> Dict:
    """
    Get the latest market summary for one or more Yahoo Finance symbols.

    Args:
        symbols: List of Yahoo Finance ticker symbols.

    Returns:
        Dictionary containing current price, previous close, daily change,
        volume, and trading date.
    """
    summary = {}

    for symbol in symbols:
        try:
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period="5d")

            if hist.empty or len(hist) < 2:
                summary[symbol] = {
                    "error": "Not enough historical data available."
                }
                continue

            current = hist["Close"].iloc[-1]
            previous = hist["Close"].iloc[-2]

            summary[symbol] = {
                "current_price": round(float(current), 2),
                "previous_close": round(float(previous), 2),
                "daily_change_percent": round(
                    ((current - previous) / previous) * 100, 2
                ),
                "volume": int(hist["Volume"].iloc[-1]),
                "date": str(hist.index[-1].date()),
            }

        except Exception as e:
            summary[symbol] = {"error": str(e)}

    return summary


def get_asset_performance(symbols: List[str], period: str = "1y") -> Dict:
    """
    Get historical performance of assets.

    Args:
        symbols: Yahoo Finance ticker symbols.
        period: Valid yfinance period
                (1mo,3mo,6mo,1y,2y,5y,10y,max)

    Returns:
        Percentage return and current price.
    """
    performance = {}

    for symbol in symbols:
        try:
            hist = yf.Ticker(symbol).history(period=period)

            if hist.empty or len(hist) < 2:
                performance[symbol] = {
                    "error": "Not enough historical data available."
                }
                continue

            start_price = hist["Close"].iloc[0]
            end_price = hist["Close"].iloc[-1]

            performance[symbol] = {
                "period": period,
                "current_price": round(float(end_price), 2),
                "return_percent": round(
                    ((end_price / start_price) - 1) * 100,
                    2,
                ),
                "high": round(float(hist["High"].max()), 2),
                "low": round(float(hist["Low"].min()), 2),
            }

        except Exception as e:
            performance[symbol] = {"error": str(e)}

    return performance


def analyze_market_trend(
    symbols: List[str],
    period: str = "3mo",
) -> Dict:
    """
    Analyze market trend using moving averages.

    Args:
        symbols: Yahoo Finance ticker symbols.
        period: Historical period.

    Returns:
        Trend analysis for each symbol.
    """
    results = []

    for symbol in symbols:
        try:
            hist = yf.Ticker(symbol).history(period=period)

            if hist.empty or len(hist) < 20:
                results.append({
                    "symbol": symbol,
                    "error": "Insufficient historical data.",
                })
                continue

            sma20 = hist["Close"].tail(20).mean()
            current = hist["Close"].iloc[-1]
            start = hist["Close"].iloc[0]

            trend = (
                "Bullish"
                if current > sma20
                else "Bearish"
            )

            results.append({
                "symbol": symbol,
                "trend": trend,
                "current_price": round(float(current), 2),
                "20_day_average": round(float(sma20), 2),
                "change_percent": round(
                    ((current / start) - 1) * 100,
                    2,
                ),
            })

        except Exception as e:
            results.append({
                "symbol": symbol,
                "error": str(e),
            })

    bullish = sum(
        1 for r in results if r.get("trend") == "Bullish"
    )
    bearish = sum(
        1 for r in results if r.get("trend") == "Bearish"
    )

    if bullish > bearish:
        overall = "Bullish"
    elif bearish > bullish:
        overall = "Bearish"
    else:
        overall = "Neutral"

    return {
        "overall_trend": overall,
        "bullish_count": bullish,
        "bearish_count": bearish,
        "analysis": results,
    }


def get_latest_news(symbol: str) -> Dict:
    """
    Get latest Yahoo Finance news for a ticker.

    Args:
        symbol: Yahoo Finance ticker.

    Returns:
        Latest news articles.
    """
    try:
        ticker = yf.Ticker(symbol)

        articles = []

        for item in ticker.news:
            articles.append({
                "title": item.get("title"),
                "publisher": item.get("publisher"),
                "link": item.get("link"),
            })

        return {
            "symbol": symbol,
            "news": articles,
        }

    except Exception as e:
        return {"error": str(e)}


def get_price_snapshot(
    symbols: List[str],
    period: str = "7d",
) -> Dict:
    """
    Get latest prices and percentage change.

    Args:
        symbols: Yahoo Finance ticker symbols.
        period: Historical period.

    Returns:
        Latest price information.
    """
    prices = {}

    for symbol in symbols:
        try:
            hist = yf.Ticker(symbol).history(period=period)

            if hist.empty or len(hist) < 2:
                prices[symbol] = {
                    "error": "Not enough historical data."
                }
                continue

            current = hist["Close"].iloc[-1]
            start = hist["Close"].iloc[0]

            prices[symbol] = {
                "price": round(float(current), 2),
                "change_percent": round(
                    ((current / start) - 1) * 100,
                    2,
                ),
            }

        except Exception as e:
            prices[symbol] = {"error": str(e)}

    return prices