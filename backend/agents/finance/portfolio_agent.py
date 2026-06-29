import yfinance as yf
from google.adk.agents import Agent
from google.adk.tools.function_tool import FunctionTool
from google.adk.tools.agent_tool import AgentTool
from google.genai import types

def get_stock_info(symbol: str) -> dict:
    """
    Get detailed stock information for a given symbol.
    Returns: price, volume, market cap, P/E ratio, 52-week high/low, etc.
    """
    try:
        stock = yf.Ticker(symbol)
        info = stock.info
        return {
            "symbol": symbol.upper(),
            "company_name": info.get("shortName", info.get("longName", "Unknown")),
            "current_price": info.get("currentPrice", info.get("regularMarketPrice", "N/A")),
            "previous_close": info.get("previousClose", "N/A"),
            "open": info.get("open", "N/A"),
            "day_low": info.get("dayLow", "N/A"),
            "day_high": info.get("dayHigh", "N/A"),
            "52_week_low": info.get("fiftyTwoWeekLow", "N/A"),
            "52_week_high": info.get("fiftyTwoWeekHigh", "N/A"),
            "market_cap": info.get("marketCap", "N/A"),
            "volume": info.get("volume", "N/A"),
            "avg_volume": info.get("averageVolume", "N/A"),
            "pe_ratio": info.get("trailingPE", "N/A"),
            "eps": info.get("trailingEps", "N/A"),
            "dividend_yield": info.get("dividendYield", "N/A"),
            "beta": info.get("beta", "N/A"),
            "sector": info.get("sector", "N/A"),
            "industry": info.get("industry", "N/A"),
        }
    except Exception as e:
        return {"error": f"Failed to fetch data for {symbol}: {str(e)}"}


def get_portfolio_holdings(holdings_text: str) -> dict:
    """
    Parse portfolio holdings from text and fetch current values.
    Input format: "AAPL:10, GOOGL:5, MSFT:20" or list of symbol:quantity
    """
    holdings = {}
    lines = holdings_text.strip().split('\n')
    
    total_value = 0
    total_invested = 0
    
    for line in lines:
        line = line.strip()
        if ':' not in line:
            continue
        symbol, qty = line.split(':')
        symbol = symbol.strip().upper()
        quantity = int(qty.strip())
        
        stock_info = get_stock_info(symbol)
        if "error" not in stock_info:
            current_price = stock_info.get("current_price", 0)
            current_value = current_price * quantity
            holdings[symbol] = {
                "quantity": quantity,
                "current_price": current_price,
                "current_value": current_value,
            }
            total_value += current_value
    
    return {
        "holdings": holdings,
        "total_portfolio_value": total_value,
        "holdings_count": len(holdings),
    }


def calculate_allocation(holdings: dict) -> dict:
    """
    Calculate allocation percentages for portfolio holdings.
    """
    total_value = sum(h.get("current_value", 0) for h in holdings.values())
    
    allocation = {}
    for symbol, data in holdings.items():
        value = data.get("current_value", 0)
        percentage = (value / total_value * 100) if total_value > 0 else 0
        allocation[symbol] = {
            "value": value,
            "percentage": round(percentage, 2),
        }
    
    return {
        "allocations": allocation,
        "total_value": total_value,
    }


get_stock_info_tool = FunctionTool(func=get_stock_info)
get_portfolio_holdings_tool = FunctionTool(func=get_portfolio_holdings)
calculate_allocation_tool = FunctionTool(func=calculate_allocation)


portfolio_analyzer_agent = Agent(
    name="portfolio_analyzer",
    model="gemini-2.0-flash",
    description="Analyzes investment portfolios, calculates holdings allocation, and provides insights on stock positions",
    instruction="""
    You are a Portfolio Analyzer agent specialized in analyzing investment portfolios.
    
    Your capabilities:
    1. Fetch current stock information (price, volume, market cap, P/E ratio, etc.)
    2. Parse portfolio holdings from uploaded documents or user input
    3. Calculate portfolio allocation percentages
    4. Generate portfolio summary reports
    
    When analyzing a portfolio:
    1. First, parse the holdings using get_portfolio_holdings if user provides holdings text
    2. Fetch individual stock info using get_stock_info for each symbol
    3. Calculate allocation using calculate_allocation
    4. Provide a comprehensive summary including:
       - Total portfolio value
       - Allocation by stock (pie chart data)
       - Top holdings by value
       - Sector diversification if available
       - Risk indicators (concentration risk if any holding > 20%)
    
    Always present data in a clear, organized manner suitable for financial analysis.
    """,
    generate_content_config=types.GenerateContentConfig(
          temperature=0.3,
          max_output_tokens=2048,   
          top_p=0.95,
    ),
    tools=[get_stock_info_tool, get_portfolio_holdings_tool, calculate_allocation_tool],
)

portfolio_analyzer_tool = AgentTool(agent=portfolio_analyzer_agent)
