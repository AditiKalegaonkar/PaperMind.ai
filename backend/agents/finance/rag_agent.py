from google.adk.agents import Agent
from google.adk.tools import FunctionTool, ToolContext
from google.adk.tools.agent_tool import AgentTool
from tools.RAG import run_rag_pipeline
from tools.prompts import FINANCE_RAG
import os


async def execute_rag_pipeline(file_path: str, tool_context: ToolContext):
    if not os.path.exists(file_path):
        return f"Document not found at path: {file_path}"

    try:
        summary = run_rag_pipeline(file_path, FINANCE_RAG)
        tool_context.state['summary'] = summary
        return summary
    except Exception as e:
        return f"Error processing document: {str(e)}"


rag_function_tool = FunctionTool(func=execute_rag_pipeline)

finance_rag_agent = Agent(
    name="finance_rag_agent",
    model="gemini-2.5-flash",
    description="A Retrieval-Augmented Generation agent for financial document analysis.",
    instruction="""
    You are a helpful assistant that analyzes financial documents.

    When a file path is provided in the conversation:
    1. Extract the file path from the conversation text
    2. Call execute_rag_pipeline(file_path="<extracted_path>") to analyze the document

    If a summary already exists in session state, use it for answering questions.
    Don't re-run RAG if you already have the summary.
    """,
    tools=[rag_function_tool],
)

finance_rag_agent_tool = AgentTool(agent=finance_rag_agent)
