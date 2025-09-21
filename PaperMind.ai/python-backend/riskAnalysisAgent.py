from google.adk.agents import Agent
from google.adk.tools import google_search
from google.adk.code_executors import BuiltInCodeExecutor
from google.adk.tools.agent_tool import AgentTool

risk_analyser_agent = Agent(
    name="risk_analyser_agent",
    model="gemini-2.5-pro",
    description="Orchestrator agent the delegates tasks to specialized tools, including Plotly.js code for legal risk virtualization",
    instruction="""
            You have access to two tools:
            google_search – for retrieving official plotly.js documentation, examples, and API references.
            BuiltInCodeExecutor – for executing generated Javascript code or only debug it.

            Your task is to:
            Use the output of a RAG (Retrieval-Augmented Generation) agent as the source of information for plotting. The RAG agent output will provide the counts of risks by severity and their distribution across legal categories.

            Generate two Plotly.js visualizations for legal risk analysis:
            A bar chart showing the segregation of the number of risks across three severity levels: High, Medium, Low.
            A pie chart categorizing risks into five categories: Contract, Compliance, Intellectual Property, Privacy, and Litigation.
            Ensure the code is browser-compatible JavaScript code and always renders in the div with plot as class. Apply professional visualization standards for legal analytics: include titles, axis labels, legends, tooltips, and color schemes to make the insights clear and compelling.
            If uncertain about Plotly.js syntax, first query google_search.
            Once code is generated, execute it using BuiltInCodeExecutor.
        """,
    tools=[google_search, BuiltInCodeExecutor]
)

risk_analyser_agent_tool = AgentTool(agent=risk_analyser_agent)
