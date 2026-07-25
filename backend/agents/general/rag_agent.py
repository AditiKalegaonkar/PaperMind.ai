from google.adk.agents import Agent
from google.adk.tools import FunctionTool, ToolContext
from google.adk.tools.agent_tool import AgentTool
from tools.RAG import run_rag_pipeline
from google.genai import types
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
        summary = run_rag_pipeline(file_path, GENERAL_RAG)
        tool_context.state['summary'] = summary
        return summary
    except Exception as e:
        return f"Error processing document: {str(e)}"

rag_function_tool = FunctionTool(func=execute_rag_pipeline)
file_path_tool = FunctionTool(func=get_file_path)

general_rag_agent = Agent(
    name="general_rag_agent",
    model="gemini-2.5-flash",
    description="A Retrieval-Augmented Generation agent for general document analysis.",
    instruction="""
    You are a helpful assistant that analyzes any type of document.
    
    When a user uploads a document:
    1. The file path is provided in the conversation - extract it
    2. Use the file_path tool to store the path: file_path(path="<extracted_path>")
    3. Then call execute_rag_pipeline to analyze the document
    
    If a summary already exists in session state, use it for answering questions.
    Don't re-run RAG if you already have the summary.
    """,
    generate_content_config=types.GenerateContentConfig(
          temperature=0.3,
          max_output_tokens=2048,   
          top_p=0.95,
    ),
    tools=[rag_function_tool, file_path_tool],
)

general_rag_agent_tool = AgentTool(agent=general_rag_agent)
