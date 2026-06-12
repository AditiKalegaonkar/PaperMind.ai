from google.adk.agents import Agent
from google.adk.tools import FunctionTool, ToolContext
from google.adk.tools.agent_tool import AgentTool
from tools.RAG import run_rag_pipeline
import os


GENERAL_RAG = """
You are a helpful assistant that analyzes any type of document and provides clear, concise summaries.
Use only the provided document context. Do not add external knowledge.

Produce a well-structured response with:

1. Document Summary
Provide a clear overview of what the document contains.

2. Key Points
Extract the main ideas and important information from the document.

3. Terminology
Identify and explain any technical or specialized terms used in the document.

4. Actionable Insights
Provide useful takeaways from the document.

5. Questions for Further Exploration
Suggest areas that might need more clarification.

Be clear, concise, and helpful.
"""


async def execute_rag_pipeline(file_path: str, tool_context: ToolContext):
    if not os.path.exists(file_path):
        return f"Document not found at path: {file_path}"

    try:
        summary = run_rag_pipeline(file_path, GENERAL_RAG)
        tool_context.state['summary'] = summary
        return summary
    except Exception as e:
        return f"Error processing document: {str(e)}"


rag_function_tool = FunctionTool(func=execute_rag_pipeline)

general_rag_agent = Agent(
    name="general_rag_agent",
    model="gemini-2.5-flash",
    description="A Retrieval-Augmented Generation agent for general document analysis.",
    instruction="""
    You are a helpful assistant that analyzes any type of document.

    When a file path is provided in the conversation:
    1. Extract the file path from the conversation text
    2. Call execute_rag_pipeline(file_path="<extracted_path>") to analyze the document

    If a summary already exists in session state, use it for answering questions.
    Don't re-run RAG if you already have the summary.
    """,
    tools=[rag_function_tool],
)

general_rag_agent_tool = AgentTool(agent=general_rag_agent)
