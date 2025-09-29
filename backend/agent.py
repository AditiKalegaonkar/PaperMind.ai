import asyncio
import jsonify
import aiohttp
import utils
import os
from flask import Flask, request
import requests
from riskAnalysisAgent import risk_analyser_agent
from dictionaryAgent import legal_dict_agent
from ragAgent import rag_agent
from google.genai import types
from google.adk.sessions import DatabaseSessionService
from google.adk.runners import Runner
from google.adk.agents import SequentialAgent
from dotenv import load_dotenv
load_dotenv()

# Flask backend to get userdata
app = Flask(__name__)

root_agent = SequentialAgent(
    name="root_agent",
    description="Processes a legal document through a sequence of analysis tools.",
    sub_agents=[
        rag_agent,
        legal_dict_agent,
        risk_analyser_agent,
    ],
)

db_url = "sqlite:///chat.db"
session_service = DatabaseSessionService(db_url=db_url)
APP_NAME = "PaperMind"


async def process_request(session_id, query, username, path):
    initial_state = {
        "user_name": username,
    }
    USER_ID = username

    # Handle session
    if session_id != -1:
        SESSION_ID = session_id
        print(f"Continuing existing session: {SESSION_ID}")
    else:
        new_session = await session_service.create_session(
            app_name=APP_NAME,
            user_id=USER_ID,
            state=initial_state,
        )
        SESSION_ID = new_session.id
        await utils.add_new_session(USER_ID, SESSION_ID)
        print(f"Created new session: {SESSION_ID}")

    # Runner
    runner = Runner(
        agent=root_agent,
        app_name=APP_NAME,
        session_service=session_service,
    )

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

    final_response = await utils.call_agent_async(runner, USER_ID, SESSION_ID, content)
    print("Final response raw:", final_response)
    async with aiohttp.ClientSession() as session:
        async with session.post("http://127.0.0.1:5000/receive_json", json=final_response) as response:
            node_response = await response.text()
            print("Node.js server response:", node_response)

    return final_response


@app.route("/receive", methods=["POST"])
def receive():
    session_id = request.form.get("session_id")
    query = request.form.get("query")
    username = request.form.get("username")
    uploaded_file = request.form.get("filepath")
    asyncio.run(process_request(session_id, query, username, uploaded_file))

    return jsonify({
        "status": "success",
        "sessionId": session_id,
        "username": username,
        "file_path": uploaded_file
    })


if __name__ == "__main__":
    app.run(port=5000, debug=True)
