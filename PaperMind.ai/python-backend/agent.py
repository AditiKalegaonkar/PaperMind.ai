import asyncio
import sys
import json
import os
from dotenv import load_dotenv

from google.adk.agents import SequentialAgent
from google.adk.runners import Runner
from google.adk.sessions import DatabaseSessionService
from google.genai import types
from ragAgent import rag_agent
from riskAnalysisAgent import risk_analyser_agent
from dictionaryAgent import legal_dict_agent

# Load environment variables
load_dotenv()

# Initialize the root agent with sub-agents
root_agent = SequentialAgent(
    name="root_agent",
    description="Processes a legal document through a sequence of analysis tools.",
    sub_agents=[
        rag_agent,
        legal_dict_agent,
        risk_analyser_agent,
    ],
)

# Database configuration
db_url = "sqlite:///chat_memory.db"
session_service = DatabaseSessionService(db_url=db_url)
APP_NAME = "PaperMind"


def log_error(message, error=None):
    if error:
        print(f"ERROR: {message} - {str(error)}", file=sys.stderr)
    else:
        print(f"ERROR: {message}", file=sys.stderr)


def log_info(message):
    print(f"INFO: {message}", file=sys.stderr)


async def call_agent_async(runner, user_id, session_id, content):
    """
    Call the agent and capture outputs from all sub-agents.
    Returns a list of responses with agent names.
    """
    all_responses = []

    try:
        log_info("Starting agent execution...")

        async for event in runner.run_async(
            user_id=user_id,
            session_id=session_id,
            new_message=content
        ):
            if event.content and event.content.parts:
                text_parts = []
                for part in event.content.parts:
                    if part.text and not part.text.isspace():
                        text_parts.append(part.text.strip())
                if text_parts:
                    combined_text = "\n".join(text_parts)
                    all_responses.append({
                        "agent": event.author,  # sub-agent name
                        "text": combined_text,
                        "is_final": event.is_final_response()
                    })

    except Exception as e:
        log_error("Agent execution failed", e)
        all_responses.append({
            "agent": "error",
            "text": f"Agent execution failed: {str(e)}",
            "is_final": True
        })

    return all_responses


async def main_async():
    try:
        log_info("Reading input from stdin...")
        input_data = json.load(sys.stdin)

        user_id = str(input_data.get('userId', ''))
        query = input_data.get('query', '')
        file_path = input_data.get('path', '')

        log_info(f"Received USER_ID: {user_id}")
        log_info(f"Received Query: {query[:100]}...")
        log_info(f"Received Path: {file_path}")

        if not user_id:
            raise ValueError("Missing userId in input data")
        if not query:
            raise ValueError("Missing query in input data")
        if not file_path:
            raise ValueError("Missing file path in input data")
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Document file not found: {file_path}")

        file_size = os.path.getsize(file_path)
        log_info(f"File size: {file_size} bytes")

    except Exception as e:
        log_error("Input validation failed", e)
        print(f"ERROR: {str(e)}")
        return

    try:
        # Session management
        log_info("Managing session...")
        existing_sessions = await session_service.list_sessions(
            app_name=APP_NAME,
            user_id=user_id,
        )

        if existing_sessions and len(existing_sessions.sessions) > 0:
            session_id = existing_sessions.sessions[0].id
            log_info(f"Continuing existing session: {session_id}")
        else:
            new_session = await session_service.create_session(
                app_name=APP_NAME,
                user_id=user_id,
            )
            session_id = new_session.id
            log_info(f"Created new session: {session_id}")

        runner = Runner(
            agent=root_agent,
            app_name=APP_NAME,
            session_service=session_service,
        )

        log_info("Agent is analyzing document...")

        user_prompt = f"""
Please perform a full legal analysis of the document based on the following details.
Start with the RAG agent tool.

User Query: "{query}"
Document Path: "{file_path}"
"""

        content = types.Content(
            role="user",
            parts=[types.Part(text=user_prompt)],
        )

        all_agent_outputs = await call_agent_async(runner, user_id, session_id, content)

        # Combine outputs in order
        final_text_response = ""
        for output in all_agent_outputs:
            final_text_response += f"[{output['agent']}]:\n{output['text']}\n\n"

        # Send plain text to stdout for Node backend
        print(final_text_response.strip())
        log_info("Analysis completed successfully")

    except Exception as e:
        log_error("Analysis failed", e)
        print(f"ERROR: Analysis failed - {str(e)}")


def main():
    try:
        asyncio.run(main_async())
    except KeyboardInterrupt:
        log_info("Process interrupted by user")
    except Exception as e:
        log_error("Unexpected error in main", e)
        print(f"ERROR: Unexpected error - {str(e)}")


if __name__ == "__main__":
    main()
