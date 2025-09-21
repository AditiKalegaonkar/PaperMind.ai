from google.adk.agents import Agent
from google.adk.tools import google_search
from google.adk.tools.agent_tool import AgentTool

# Define the sub-agent (agent as tool)
search_the_web = Agent(
    name="search_the_web",
    model="gemini-2.5-pro",
    description="Agent that performs Google searches and gives proper structured output.",
    tools=[google_search],
    instruction="""
        You are a helpful agent that searches the web using GoogleSearchTool.
        Gives proper structured output to the user.

        Rules:
        - Always keep answers clear and under 1500 characters.
    """
    
 )


# Wrap the sub-agent in an AgentTool
search_the_web_tool = AgentTool(agent=search_the_web, skip_summarization=False)
