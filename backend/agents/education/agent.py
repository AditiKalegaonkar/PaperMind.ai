from google.adk.agents import Agent
from google.adk.tools import FunctionTool, ToolContext
from .flashcard_agent import flashcard_agent_tool
from .Rag_agent import rag_agent_tool
from google.adk.tools import AgentTool

from dotenv import load_dotenv
load_dotenv()


def store_quiz_data(correct_answer: str, tool_context: ToolContext):
    """Stores the correct answer in the session context for later checking."""
    tool_context.state['correct_quiz_key'] = correct_answer


quiz_storage_tool = FunctionTool(func=store_quiz_data)

education_agent = Agent(
    name="tools_lol",
    model="gemini-2.5-flash",
    description="A Retrieval-Augmented Generation agent for document analysis.and flashcard generation",
    instruction="""
    ## MANDATORY WORKFLOW (Initial Summary)
    When a user provides a file path, you MUST execute the RAG process first:

    1.  *Check State:* Inspect the session context. If the session state contains a key named 'summary', skip the RAG process and proceed to step 4.
    2.  *RAG Delegation:* Call the *'rag_agent_tool'* with the file path and user query to process the document. (The RAG Agent handles its own internal steps and stores the summary.)
        * CRITICAL: Capture the summary output returned by the 'rag_agent_tool'.
    3.  *Store Globally:* Store the captured summary text into the session context under the key 'summary'.
    4.  Conclude by informing the user that the summary is complete and that they can now request 'flashcards' or a 'quiz'.
    
    # OPTIONAL WORKFLOW (Flashcards)
    If the user explicitly asks for *flashcards*(after the summary is generated):
    1.  Retrieve the summary text directly from the session context using the key 'summary'.
    2.  Pass the retrieved summary text directly to the 'flashcard_agent_tool'.
    3.  Return the final JSON output from the 'flashcard_agent_tool' directly to the user.
    
    # OPTIONAL WORKFLOW (Quizzingg)
    If the user explicitly asks for a *quiz*:
    #Turn 1: Generate & Store Question (Stateful) 
    1.  Check/Reset:Inspect prompt. If user asks for *new quiz*, clear 'correct_quiz_key', then proceed to Step 3. Otherwise, if 'correct_quiz_key' exists, proceed to *Turn 2* logic.
    2.  Prerequisites:Retrieve summary ('summary').
    3.  Generation: Generate the question stem, *correct answer* (key fact), and **three plausible distractors**.
    4.  Presentation: Present the assembled question and options. Instruct user to reply with *only* the letter.
    5.  Assembly & Storage: Assemble the final 4-option question (A, B, C, D). **IMMEDIATELY call 'quiz_storage_tool'** with the *correct option letter* to store the key.
    

    # Turn 2: Check User's Answer
    When the user sends their next message:
    1.  Comparison:Check 'correct_quiz_key'*. If found, extract the user's letter and compare it against the stored key.
    2.  Feedback & Cleanup: Provide feedback. *Clear the 'correct_quiz_key'* afterward.""",
    tools=[rag_agent_tool, flashcard_agent_tool, quiz_storage_tool],
)

education_agent_tool = AgentTool(education_agent)
