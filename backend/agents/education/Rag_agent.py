from google.adk.agents import Agent
from google.adk.tools import FunctionTool, ToolContext
from google.adk.tools.agent_tool import AgentTool
from tools.RAG import RAG_pipeline
from tools.prompts import EDUCATION_RAG
import io


def get_path(path: str, query: str, tool_context: ToolContext):
    tool_context.state['path'] = path
    tool_context.state['query'] = query


async def RAG_pipeline(tool_context: ToolContext):
    artifact_ids = await tool_context.list_artifacts()
    artifact_id = artifact_ids[0]
    try:
        artifact_content = await tool_context.load_artifact(artifact_id)
        print("The doc type: ", artifact_content.inline_data.mime_type)
        file_name = artifact_content.inline_data.display_name
        summary = RAG_pipeline(file_name, EDUCATION_RAG)
        tool_context.state['summary'] = summary
        pdf_bytes = artifact_content.inline_data.data
        pdf_bytes_stream = io.BytesIO(pdf_bytes)
    except FileNotFoundError:
        print(f"Error: Artifact '{file_name}' not found.")

    return summary

rag_function_tool = FunctionTool(func=RAG_pipeline)
path_tool = FunctionTool(func=get_path)

rag_agent = Agent(
    name="RAG_agent",
    model="gemini-2.5-flash",
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
    Extract suitable articles and get information for them using the get_article_information tool.
    Don't use RAG agent if you have got the summary already. 
    """,
    tools=[rag_function_tool, get_path],
)

rag_agent_tool = AgentTool(agent=rag_agent)
