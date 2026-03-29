from google.adk.agents import Agent
from google.adk.tools import google_search
from google.adk.tools.agent_tool import AgentTool

risk_analyser_agent = Agent(
    name="risk_analyser_agent",
    model="gemini-2.5-flash",
    description="Agent that analyzes risk information from RAG output and provides structured legal-risk insights.",
    instruction="""
            You have access to the tool:
            google_search – for retrieving authoritative information related to legal risk frameworks, definitions, and domain standards.

            Your task is to analyze the outputs of a Retrieval-Augmented Generation (RAG) system. 
            The RAG output will provide:
            - Counts of risks segmented by severity (High, Medium, Low).
            - Distribution of risks across five legal categories (Contract, Compliance, Intellectual Property, Privacy, Litigation).

            Your responsibilities:
            - Interpret the severity distribution.
            - Assess potential concentration of risk.
            - Identify trends or imbalances across legal categories.
            - Provide clear, concise, and professional analytical commentary suitable for legal-risk reporting.
            - If needed, use google_search to verify definitions or contextual information.
        """,
    tools=[google_search]
)

risk_analyser_agent_tool = AgentTool(agent=risk_analyser_agent)