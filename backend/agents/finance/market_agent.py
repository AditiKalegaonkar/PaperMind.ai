
from google.adk.agents import Agent
from google.adk.tools import FunctionTool, google_search
from google.adk.tools.agent_tool import AgentTool
from google.genai import types
from tools.tool import get_market_summary, get_asset_performance, analyze_market_trend, get_latest_news, get_price_snapshot

get_market_summary_tool = FunctionTool(func=get_market_summary)
get_asset_performance_tool = FunctionTool(func=get_asset_performance)
get_latest_news_tool = FunctionTool(func=get_latest_news)
analyze_market_trend_tool = FunctionTool(func=analyze_market_trend)
get_prices_snapshot_tool = FunctionTool(func=get_price_snapshot)


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
    generate_content_config=types.GenerateContentConfig(
          temperature=0.3,
          max_output_tokens=2048,   
          top_p=0.95,
    ),
    tools=[
        get_market_summary_tool,
        get_asset_performance_tool,
        get_latest_news_tool,
        analyze_market_trend_tool,
        get_prices_snapshot_tool,
        google_search,
    ],
)

market_analyst_tool = AgentTool(agent=market_analyst_agent)
