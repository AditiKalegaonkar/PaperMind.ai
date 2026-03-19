from google.adk.agents import Agent
from google.adk.tools import FunctionTool, ToolContext
from google.adk.tools.agent_tool import AgentTool
from tools.QdrantRAG import run_qdrant_rag
from tools.RAG import run_rag_pipeline
from tools.prompts import EDUCATION_RAG
import io
import os


def get_file_path(file_path: str, tool_context: ToolContext):
    """Store the uploaded file path in session state."""
    tool_context.state['file_path'] = file_path
    return f"File path stored: {file_path}"


async def execute_rag_pipeline(tool_context: ToolContext):
    """Execute RAG pipeline using the stored file path."""
    file_path = tool_context.state.get('file_path')
    
    if not file_path:
        return "No document uploaded. Please upload a document first."
    
    if not os.path.exists(file_path):
        return f"Document not found at path: {file_path}"
    
    try:
        summary = run_rag_pipeline(file_path, EDUCATION_RAG)
        tool_context.state['summary'] = summary
        return summary
    except Exception as e:
        return f"Error processing document: {str(e)}"

rag_function_tool = FunctionTool(func=execute_rag_pipeline)
file_path_tool = FunctionTool(func=get_file_path)

rag_agent = Agent(
    name="RAG_agent",
    model="gemini-2.5-flash",
    description="A Retrieval-Augmented Generation agent for document analysis.",
    instruction="""
    You are a helpful assistant that analyzes educational documents.
    
    When a user uploads a document:
    1. The file path is provided in the conversation - extract it
    2. Use the file_path tool to store the path: file_path(path="<extracted_path>")
    3. Then call execute_rag_pipeline to analyze the document
    
    If a summary already exists in session state, use it for answering questions.
    Don't re-run RAG if you already have the summary.
    """,
    tools=[rag_function_tool, file_path_tool],
)

rag_agent_tool = AgentTool(agent=rag_agent)
