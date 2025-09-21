from google.adk.agents import Agent
from google.adk.tools import google_search
from google.adk.code_executors import BuiltInCodeExecutor
from google.adk.tools.agent_tool import AgentTool

code_agent = Agent(
    name="ploty_code_generator",
    model="gemini-2.5-pro",
    description="Ploty.js code  is generated and executed",
    instruction="""
    You have access to two tools -
        1.google_search - for retriving relevant data or example
        2.BuiltInCodeExecutor - for executing generated JavaScript code
    Your task is to generate and execute Plotly.js visializations for legal risk analysis. Ensure the code is browser-compatible and targets a div with id='plot'.
""",
    tools=[google_search,BuiltInCodeExecutor],
)

code_agent_tool=AgentTool(agent=code_agent)

root_agent = Agent(
    name="tool_agent",
    model="gemini-2.0-flash",
    description="Orchestrator agent the delegates tasks to specialized tools, including Plotly.js code for legal risk virtualization",
    instruction="""
    You are a high-level orchestrator agent.When a user requests a user requests a visualization or code generation task, delegate it to the appropriate tool agent.
    Use the Plotly code generator tool for any requests invloving chart creation, data visualization or frontend-compatible JavaScript output.
""",
    tools=[code_agent_tool],
)

task_prompt="""
Generate a Plotly.js bar chart legal risk Analysis severity across five categories:
Contract, Compliance, Intellectual Property, Privacy and Litigation.
Use JavaScript syntax compatible with Plotly.js and ensure it targets a div with id='plot.
"""
