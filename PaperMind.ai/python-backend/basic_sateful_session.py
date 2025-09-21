import uuid
from dotenv import load_dotenv
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

# --- IMPORTANT: Import your agent from the other file ---
from tool_agent import legal_tool_agent

# Load environment variables
load_dotenv()

# --- Set up the Runner and Session ---

session_service_stateful = InMemorySessionService()

APP_NAME = "Legal Assistant"
USER_ID = "test_user_123"
SESSION_ID = str(uuid.uuid4())

stateful_session = session_service_stateful.create_session(
    app_name=APP_NAME,
    user_id=USER_ID,
    session_id=SESSION_ID,
)
print("CREATED NEW SESSION FOR LEGAL AGENT:")
print(f"\tSession ID: {SESSION_ID}")

# Pass the imported legal_agent to the Runner
runner = Runner(
    agent=legal_tool_agent, 
    app_name=APP_NAME,
    session_service=session_service_stateful,
)

# --- Run the Agent with a Relevant Question ---

new_message = types.Content(
    role="user", parts=[types.Part(text="What is a tort?")]
)

print(f"\nUser Query: {new_message.parts[0].text}\n")

for event in runner.run(
    user_id=USER_ID,
    session_id=SESSION_ID,
    new_message=new_message,
):
    if event.is_final_response():
        if event.content and event.content.parts:
            print(f"Final Response: {event.content.parts[0].text}")