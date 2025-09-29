from google.adk.agents import Agent
from google.adk.tools import google_search
from google.adk.tools.agent_tool import AgentTool

risk_analyser_agent = Agent(
    name="risk_analyser_agent",
    model="gemini-2.5-pro",
    description="Orchestrator agent the delegates tasks to specialized tools, including Plotly.js code for legal risk virtualization",
    instruction="""
            You have access to the tool:
            google_search – for retrieving official plotly.js documentation, examples, and API references.
            Your task is to generate two professional-quality Plotly.js visualizations using the output of a RAG (Retrieval-Augmented Generation) agent as the data source. The RAG agent output will provide:
            The counts of risks segmented by severity (High, Medium, Low).
            The distribution of risks across five legal categories (Contract, Compliance, Intellectual Property, Privacy, Litigation).
            
            Visualization Requirements:
            Bar Chart – Risks by Severity
            X-axis: Severity levels (High, Medium, Low)
            Y-axis: Number of risks

            Include axis titles, gridlines, and a legend (if needed).
            Professional color scheme (e.g., red for High, amber for Medium, green for Low).
            Tooltip on hover showing severity and count.
            Title: "Risk Distribution by Severity"
            Pie Chart – Risks by Legal Category
            Categories: Contract, Compliance, Intellectual Property, Privacy, Litigation
            Show percentage distribution of risks.
            Distinct color scheme with a professional legal/business tone (e.g., muted blues, greys, and purples).
            Tooltip on hover showing category and percentage.
            Title: "Risk Categorization by Legal Area"
            Legend enabled and positioned clearly.
            Code Requirements:
            Must be browser-compatible JavaScript using Plotly.js.
            Both charts must render into <div> with class="plot".
            Apply professional standards for legal analytics: clean design, readable fonts, clear labels, and polished layout.
            If uncertain about specific Plotly.js syntax, first query google_search for clarification before coding.
            Give the coded output like:
            <div class='plot'> code </div>
        """,
    tools=[google_search]
)

risk_analyser_agent_tool = AgentTool(agent=risk_analyser_agent)
