import asyncio
import sys
import json
from dotenv import load_dotenv

from google.adk.agents import SequentialAgent
from google.adk.runners import Runner
from google.adk.sessions import DatabaseSessionService
from google.genai import types
from ragAgent import rag_agent
from riskAnalysisAgent import risk_analyser_agent
from dictionaryAgent import legal_dict_agent

load_dotenv()

root_agent = SequentialAgent(
    name="root_agent",
    description="Processes a legal document through a sequence of analysis tools.",
    sub_agents=[
        rag_agent,
        legal_dict_agent,
        risk_analyser_agent,
    ],
)

db_url = "sqlite:///chat_memory.db"
session_service = DatabaseSessionService(db_url=db_url)
APP_NAME = "PaperMind"


async def call_agent_async(runner, USER_ID, SESSION_ID, content):
    final_text_response = "No final text response captured."
    final_js_code = None

    try:
        async for event in runner.run_async(
            user_id=USER_ID, session_id=SESSION_ID, new_message=content
        ):
            print(
                f"Event ID: {event.id}, Author: {event.author}", file=sys.stderr)
            if event.content and event.content.parts:
                for part in event.content.parts:
                    if part.text and not part.text.isspace():
                        print(f"  Text: '{part.text.strip()}'",
                              file=sys.stderr)
                        if event.is_final_response():
                            final_text_response = part.text.strip()
                    elif part.executable_code:
                        final_js_code = part.executable_code.code

    except Exception as e:
        print(f"ERROR during agent run: {e}", file=sys.stderr)

    combined_response = final_text_response
    if final_js_code:
        js_markdown = f"```javascript\n{final_js_code}\n```"
        combined_response = f"{final_text_response}\n\n{js_markdown}"

    return combined_response


async def main_async():
    try:
        input_data = json.load(sys.stdin)

        USER_ID = input_data['userId']
        query = input_data['query']
        path = input_data['path']

        print(f"Received USER_ID: {USER_ID}", file=sys.stderr)
        print(f"Received Query: {query}", file=sys.stderr)
        print(f"Received Path: {path}", file=sys.stderr)
    except Exception as e:
        print(
            f"Error reading or parsing input from stdin: {e}", file=sys.stderr)
        return

    existing_sessions = await session_service.list_sessions(
        app_name=APP_NAME,
        user_id=USER_ID,
    )

    if existing_sessions and len(existing_sessions.sessions) > 0:
        SESSION_ID = existing_sessions.sessions[0].id
        print(f"Continuing existing session: {SESSION_ID}", file=sys.stderr)
    else:
        new_session = await session_service.create_session(
            app_name=APP_NAME,
            user_id=USER_ID,
        )
        SESSION_ID = new_session.id
        print(f"Created new session: {SESSION_ID}", file=sys.stderr)

    runner = Runner(
        agent=root_agent,
        app_name=APP_NAME,
        session_service=session_service,
    )

    print("...Agent is thinking...", file=sys.stderr)

    user_prompt = f"""
    Please perform a full legal analysis of the document based on the following details.
    Start with the RAG agent tool.

    User Query: "{query}"
    Document Path: "{path}"
    """
    content = types.Content(
        role="user",
        parts=[types.Part(text=user_prompt)],
    )

    final_response_string = await call_agent_async(
        runner, USER_ID, SESSION_ID, content
    )

    print(final_response_string)

if __name__ == "__main__":
    asyncio.run(main_async())
