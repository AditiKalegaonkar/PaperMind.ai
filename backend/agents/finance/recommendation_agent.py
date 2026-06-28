import yfinance as yf
from google.adk.agents import Agent
from google.adk.tools import FunctionTool
from google.adk.tools.agent_tool import AgentTool
from google.genai import types


def analyze_stock(symbol: str) -> dict:
    """
    Comprehensive stock analysis including technical indicators and fundamentals.
    """
    try:
        stock = yf.Ticker(symbol)
        info = stock.info
        history = stock.history(period="1y")
        
        # Calculate moving averages
        if len(history) >= 50:
            ma50 = history['Close'].rolling(window=50).mean().iloc[-1]
            ma200 = history['Close'].rolling(window=200).mean().iloc[-1] if len(history) >= 200 else None
        else:
            ma50 = ma200 = None
        
        # Current price
        current_price = history['Close'].iloc[-1] if len(history) > 0 else None
        
        # Calculate returns
        if len(history) >= 30:
            monthly_return = ((history['Close'].iloc[-1] / history['Close'].iloc[-30]) - 1) * 100
        else:
            monthly_return = None
            
        if len(history) >= 365:
            yearly_return = ((history['Close'].iloc[-1] / history['Close'].iloc[0]) - 1) * 100
        else:
            yearly_return = None
        
        # Volatility (standard deviation of daily returns)
        daily_returns = history['Close'].pct_change().dropna()
        volatility = daily_returns.std() * (252 ** 0.5) * 100 if len(daily_returns) > 0 else None
        
        # RSI calculation
        delta = history['Close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        rsi = (100 - (100 / (1 + rs))).iloc[-1] if len(rs) > 0 else None
        
        return {
            "symbol": symbol.upper(),
            "company_name": info.get("shortName", "Unknown"),
            "current_price": current_price,
            "moving_averages": {
                "ma50": round(ma50, 2) if ma50 else None,
                "ma200": round(ma200, 2) if ma200 else None,
            },
            "returns": {
                "monthly": round(monthly_return, 2) if monthly_return else None,
                "yearly": round(yearly_return, 2) if yearly_return else None,
            },
            "volatility": round(volatility, 2) if volatility else None,
            "rsi": round(rsi, 2) if rsi else None,
            "volume": info.get("volume", "N/A"),
            "market_cap": info.get("marketCap", "N/A"),
            "pe_ratio": info.get("trailingPE", "N/A"),
            "beta": info.get("beta", "N/A"),
            "recommendation": info.get("recommendationKey", "N/A"),
        }
    except Exception as e:
        return {"error": f"Failed to analyze {symbol}: {str(e)}"}


def get_investment_recommendation(symbol: str, risk_tolerance: str = "moderate") -> dict:
    """
    Generate investment recommendation based on analysis.
    Risk tolerance: conservative, moderate, aggressive
    """
    analysis = analyze_stock(symbol)
    
    if "error" in analysis:
        return analysis
    
    recommendation = "HOLD"
    reasoning = []
    
    # RSI-based signals
    rsi = analysis.get("rsi")
    if rsi:
        if rsi > 70:
            reasoning.append("Stock is overbought (RSI > 70)")
        elif rsi < 30:
            reasoning.append("Stock is oversold (RSI < 30)")
    
    # Moving average signals
    ma50 = analysis.get("moving_averages", {}).get("ma50")
    ma200 = analysis.get("moving_averages", {}).get("ma200")
    current_price = analysis.get("current_price")
    
    if ma50 and ma200 and current_price:
        if current_price > ma50 > ma200:
            recommendation = "BUY"
            reasoning.append("Strong uptrend: Price > MA50 > MA200")
        elif current_price < ma50 < ma200:
            recommendation = "SELL"
            reasoning.append("Strong downtrend: Price < MA50 < MA200")
    
    # Returns-based signals
    yearly_return = analysis.get("returns", {}).get("yearly")
    if yearly_return:
        if yearly_return > 20:
            reasoning.append(f"Strong yearly return: {yearly_return}%")
        elif yearly_return < -20:
            reasoning.append(f"Weak yearly performance: {yearly_return}%")
    
    # Risk-based adjustment
    risk_tolerance = risk_tolerance.lower()
    if risk_tolerance == "conservative":
        if analysis.get("volatility", 0) > 30:
            recommendation = "SELL"
            reasoning.append("High volatility not suitable for conservative investors")
    elif risk_tolerance == "aggressive":
        if rsi and rsi < 30:
            recommendation = "BUY"
            reasoning.append("Oversold conditions good for aggressive investors")
    
    return {
        "symbol": symbol.upper(),
        "recommendation": recommendation,
        "reasoning": reasoning,
        "analysis": analysis,
        "risk_tolerance": risk_tolerance,
    }


def compare_stocks(symbols: list) -> dict:
    """
    Compare multiple stocks side by side.
    """
    comparisons = []
    for symbol in symbols:
        analysis = analyze_stock(symbol)
        if "error" not in analysis:
            comparisons.append({
                "symbol": symbol.upper(),
                "price": analysis.get("current_price"),
                "pe_ratio": analysis.get("pe_ratio"),
                "beta": analysis.get("beta"),
                "yearly_return": analysis.get("returns", {}).get("yearly"),
                "volatility": analysis.get("volatility"),
                "rsi": analysis.get("rsi"),
            })
    
    return {
        "comparisons": comparisons,
        "best_by": {
            "pe_ratio": min(comparisons, key=lambda x: x.get("pe_ratio", float('inf')) if x.get("pe_ratio") not in [None, "N/A"] else float('inf')).get("symbol") if comparisons else None,
            "lowest_volatility": min(comparisons, key=lambda x: x.get("volatility", float('inf')) if x.get("volatility") else float('inf')).get("symbol") if comparisons else None,
            "best_return": max(comparisons, key=lambda x: x.get("yearly_return", -float('inf')) if x.get("yearly_return") else -float('inf')).get("symbol") if comparisons else None,
        }
    }


analyze_stock_tool = FunctionTool(func=analyze_stock)
get_recommendation_tool = FunctionTool(func=get_investment_recommendation)
compare_stocks_tool = FunctionTool(func=compare_stocks)


recommendation_agent = Agent(
    name="investment_recommender",
    model="gemini-2.5-flash",
    description="Provides investment recommendations, buy/sell/hold signals, and stock comparison analysis",
    instruction="""
    You are an Investment Recommender agent specialized in providing financial investment advice.
    
    Your capabilities:
    1. Analyze individual stocks (technical and fundamental analysis)
    2. Generate buy/sell/hold recommendations
    3. Compare multiple stocks
    4. Factor in risk tolerance
    
    Analysis includes:
    - Moving averages (MA50, MA200)
    - RSI (Relative Strength Index)
    - Volatility metrics
    - Price returns (monthly, yearly)
    - Fundamental metrics (P/E, beta, market cap)
    
    When providing recommendations:
    1. Use analyze_stock for detailed analysis
    2. Use get_investment_recommendation for final recommendation
    3. Use compare_stocks when comparing multiple investments
    
    Always consider user's risk tolerance (conservative/moderate/aggressive) in recommendations.
    Present recommendations with clear reasoning.
    
    Disclaimer: Always remind users that this is not financial advice and they should consult a financial advisor.
    """,
    generate_content_config=types.GenerateContentConfig(
          temperature=0.3,
          max_output_tokens=2048,   
          top_p=0.95,
    ),
    tools=[analyze_stock_tool, get_recommendation_tool, compare_stocks_tool],
)

recommendation_agent_tool = AgentTool(agent=recommendation_agent)
