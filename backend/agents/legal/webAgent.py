from google.adk.agents import Agent
from google.adk.tools import google_search
from google.adk.tools.agent_tool import AgentTool
from google.genai import types

search_the_web = Agent(
    name="search_the_web",
    model="gemini-2.0-flash",
    description="Agent that performs Google searches and gives proper structured output.",
    tools=[google_search],
    generate_content_config=types.GenerateContentConfig(
          temperature=0.3,
          max_output_tokens=2048,   
          top_p=0.95,
    ),
    instruction="""
        You are a helpful agent that searches the web using GoogleSearchTool.
        Gives proper structured output to the user.
        Rules:
        - Always keep answers clear and under 1500 characters.
    """

)
# Wrap the sub-agent in an AgentTool
search_the_web_tool = AgentTool(agent=search_the_web, skip_summarization=False)
