from .portfolio_agent import portfolio_analyzer_tool
from .recommendation_agent import recommendation_agent_tool
from .market_agent import market_analyst_tool
from .rag_agent import finance_rag_agent_tool
from google.adk.agents import Agent
from google.adk.tools import ToolContext
from dotenv import load_dotenv
from google.adk.tools.agent_tool import AgentTool
from google.genai import types

load_dotenv()


def store_portfolio_data(holdings: str, tool_context: ToolContext):
    """Store portfolio holdings in session state."""
    tool_context.state['portfolio_holdings'] = holdings


def store_risk_tolerance(risk: str, tool_context: ToolContext):
    """Store user's risk tolerance preference."""
    tool_context.state['risk_tolerance'] = risk


store_portfolio_tool = store_portfolio_data
store_risk_tool = store_risk_tolerance


# Root Finance Agent
finance_agent = Agent(
    name="finance_agent",
    model="gemini-2.5-flash",
    description="A comprehensive financial advisor agent that analyzes portfolios, provides investment recommendations, and monitors market trends",
    instruction="""
    You are a Finance Agent - a comprehensive financial advisor that helps users with:
    1. Portfolio analysis and allocation
    2. Investment recommendations (buy/sell/hold)
    3. Market trend analysis
    4. Stock comparisons
    5. Financial document analysis (using RAG)
    
    Available Tools:
    - finance_rag_agent: Analyze financial documents using RAG
    - portfolio_analyzer: Analyze portfolio holdings and calculate allocation
    - recommendation_agent: Get investment recommendations and stock analysis
    - market_analyst: Analyze market trends and sector performance
    
    Workflow:
    1. For document uploads:
       - Use finance_rag_agent to analyze financial documents
       - Extract key financial metrics, terms, and insights
       - Summarize findings
    
    2. For portfolio questions:
       - Use portfolio_analyzer to analyze holdings
       - Calculate allocation percentages
       - Provide diversification insights
    
    3. For investment recommendations:
       - Use recommendation_agent to analyze specific stocks
       - Consider user's risk tolerance
       - Provide clear buy/sell/hold signals with reasoning
    
    4. For market analysis:
       - Use market_analyst for overall market health
       - Identify sector trends
       - Provide market outlook
    
    Always provide clear, actionable financial insights with appropriate disclaimers.
    Remind users that this is not financial advice and they should consult a financial advisor.
    """,
    generate_content_config=types.GenerateContentConfig(
          temperature=0.3,
          max_output_tokens=2048,   
          top_p=0.95,
    ),
    tools=[
        finance_rag_agent_tool,
        portfolio_analyzer_tool,
        recommendation_agent_tool,
        market_analyst_tool,
    ],
)

finance_agent_tool = AgentTool(agent=finance_agent)
