import asyncio
import sys
import json
import os
from pathlib import Path
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

# Initialize the root agent
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
    """Log error messages to stderr"""
    if error:
        print(f"ERROR: {message} - {str(error)}", file=sys.stderr)
    else:
        print(f"ERROR: {message}", file=sys.stderr)


def log_info(message):
    """Log info messages to stderr"""
    print(f"INFO: {message}", file=sys.stderr)


async def call_agent_async(runner, user_id, session_id, content):
    """Call the agent and capture the response"""
    final_text_response = "No final text response captured."
    final_js_code = None

    try:
        log_info("Starting agent execution...")

        async for event in runner.run_async(
            user_id=user_id,
            session_id=session_id,
            new_message=content
        ):
            log_info(f"Event ID: {event.id}, Author: {event.author}")

            if event.content and event.content.parts:
                for part in event.content.parts:
                    if part.text and not part.text.isspace():
                        text_content = part.text.strip()
                        log_info(f"Text: '{text_content[:100]}...'")

                        if event.is_final_response():
                            final_text_response = text_content

                    elif hasattr(part, 'executable_code') and part.executable_code:
                        final_js_code = part.executable_code.code
                        log_info("Captured executable code")

    except Exception as e:
        log_error("Agent execution failed", e)
        final_text_response = f"Agent execution failed: {str(e)}"

    # Combine response
    combined_response = final_text_response
    if final_js_code:
        js_markdown = f"```javascript\n{final_js_code}\n```"
        combined_response = f"{final_text_response}\n\n{js_markdown}"

    return combined_response


async def main_async():
    """Main async function"""
    try:
        # Read input from stdin
        log_info("Reading input from stdin...")
        input_data = json.load(sys.stdin)

        user_id = str(input_data.get('userId', ''))
        query = input_data.get('query', '')
        file_path = input_data.get('path', '')

        log_info(f"Received USER_ID: {user_id}")
        log_info(f"Received Query: {query[:100]}...")
        log_info(f"Received Path: {file_path}")

        # Validate inputs
        if not user_id:
            raise ValueError("Missing userId in input data")
        if not query:
            raise ValueError("Missing query in input data")
        if not file_path:
            raise ValueError("Missing file path in input data")

        # Validate file exists
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Document file not found: {file_path}")

        # Get file info
        file_size = os.path.getsize(file_path)
        log_info(f"File size: {file_size} bytes")

    except json.JSONDecodeError as e:
        log_error("Failed to parse JSON input", e)
        print(json.dumps({
            "error": "Invalid JSON input",
            "details": str(e)
        }))
        return
    except (ValueError, FileNotFoundError) as e:
        log_error("Input validation failed", e)
        print(json.dumps({
            "error": "Input validation failed",
            "details": str(e)
        }))
        return
    except Exception as e:
        log_error("Error reading input", e)
        print(json.dumps({
            "error": "Failed to read input",
            "details": str(e)
        }))
        return

    try:
        # Handle session management
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

        # Initialize runner
        runner = Runner(
            agent=root_agent,
            app_name=APP_NAME,
            session_service=session_service,
        )

        log_info("Agent is analyzing document...")

        # Prepare user prompt
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

        # Call agent
        final_response = await call_agent_async(
            runner, user_id, session_id, content
        )

        # Output the result
        result = {
            "success": True,
            "response": final_response,
            "userId": user_id,
            "sessionId": session_id
        }

        print(json.dumps(result))
        log_info("Analysis completed successfully")

    except Exception as e:
        log_error("Analysis failed", e)
        error_result = {
            "error": "Analysis failed",
            "details": str(e),
            "success": False
        }
        print(json.dumps(error_result))


def main():
    """Main synchronous entry point"""
    try:
        asyncio.run(main_async())
    except KeyboardInterrupt:
        log_info("Process interrupted by user")
    except Exception as e:
        log_error("Unexpected error in main", e)
        print(json.dumps({
            "error": "Unexpected error",
            "details": str(e),
            "success": False
        }))


if __name__ == "__main__":
    main()
