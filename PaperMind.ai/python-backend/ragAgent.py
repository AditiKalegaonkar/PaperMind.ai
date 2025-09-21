from google.adk.agents import Agent
from google.adk.tools import FunctionTool, ToolContext
from google.adk.tools.agent_tool import AgentTool
import tools


def get_path(path: str, query: str, tool_context: ToolContext):
    tool_context.state['path'] = path
    tool_context.state['query'] = query


def RAG_pipeline(tool_context: ToolContext):
    """
    Processes a document using a path stored in the session context.
    """
    file_path = tool_context.state.get('path')
    if not file_path:
        return "Error: File path not found in context. Please call 'get_path' first."
    print(f"--- Running RAG pipeline on: {file_path} ---")
    summary = tools.RAG_pipeline(file_path)
    tool_context.state['summary'] = summary
    return summary


rag_function_tool = FunctionTool(func=RAG_pipeline)
path_tool = FunctionTool(func=get_path)

rag_agent = Agent(
    name="RAG_agent",
    model="gemini-2.5-pro",
    description="A Retrieval-Augmented Generation agent for document analysis.",
    instruction="""
    You are a helpful assistant that analyzes documents. 
    When a user provides a prompt that includes a file path, you must:

    1. Use the 'get_path' tool to save the file path in the session context.
    2. Then call the 'RAG_pipeline' tool to process the document located at that path.

    Example workflow:
        - Extract the file path from the user's message.
        - Call get_path(path) to store it.
        - Call RAG_pipeline() to analyze the document using the stored path.
    Respond with results from RAG_pipeline and any relevant analysis.
    Extract suitable articles and get information for them using the get_article_information tool
    """,
    tools=[rag_function_tool, get_path, tools.get_article_information],
)

rag_agent_tool = AgentTool(agent=rag_agent)
