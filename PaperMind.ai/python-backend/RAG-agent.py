from google.adk.agents import Agent
from google.adk.tools import FunctionTool, ToolContext
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types
import tools
import asyncio

APP_NAME = "rag_agent_app"
USER_ID = "user1234"
SESSION_ID = "sess123"


def get_path(path: str, tool_context: ToolContext):
    tool_context.state['path'] = path


def RAG_pipeline(tool_context: ToolContext):
    """
    Processes a document using a path stored in the session context.
    """
    file_path = tool_context.state.get('path')
    if not file_path:
        return "Error: File path not found in context. Please call 'get_path' first."
    print(f"--- Running RAG pipeline on: {file_path} ---")
    summary = tools.RAG_pipeline(file_path)
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
    """,
    tools=[rag_function_tool, get_path],
)


async def main():
    session_service = InMemorySessionService()
    await session_service.create_session(app_name=APP_NAME, user_id=USER_ID, session_id=SESSION_ID)
    runner = Runner(agent=rag_agent, app_name=APP_NAME,
                    session_service=session_service)

    path = str(input("Enter the complete path of the PDF: "))

    # The user's message containing the path to be processed
    content = types.Content(
        role="user", parts=[types.Part(text=f"Please analyze the document at this path: {path}")])

    # The runner.run method returns an iterator for the conversation events
    events = runner.run(
        user_id=USER_ID, session_id=SESSION_ID, new_message=content)

    for event in events:
        if event.is_final_response():
            print("\nAgent's Final Response:")
            print(event.content.parts[0].text)

if __name__ == "__main__":
    asyncio.run(main())
