from google.adk.agents import Agent
from tool_agent.legal_definition import get_legal_definition
from tool_agent.search_web import search_the_web_tool


# Root agent
legal_tool_agent = Agent(
    name="legal_tool_agent",
    model="gemini-2.0-flash",
    description="Agent that provides legal definitions.",
    instruction="""
    You are a helpful legal assistant.
    You have access to two tools:
    1. get_legal_definition(term) → Nolo Legal Dictionary.
    2. search_the_web(query) → A general web search sub-agent.
    

    Rules:
    - First, try to use the specialized scraper (Nolo).
    - If a scraper fails (returns None) or the query is too broad for the scrapers, use search_the_web to find the answer.
    - If the scraper returns text longer than 1000 characters, simplify it in your own words if the language is too professional.
    - If all tools fail, answer directly from your own knowledge.
    - Always keep answers clear and under 1500 characters.
    """,
    tools=[get_legal_definition, search_the_web_tool]
)