from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from datetime import datetime
from bson import ObjectId
import os
import shutil
import uuid
from dotenv import load_dotenv
import motor.motor_asyncio
from google.genai import types
from google.adk.sessions import DatabaseSessionService
from google.adk.runners import Runner
from google.adk.agents import Agent
from utility import utils
import uvicorn
from typing import List
from PyPDF2 import PdfReader


# Agent Imports
from legal.agent import legal_agent_tool
from education.agent import education_agent_tool
from finance.agent import finance_agent_tool

load_dotenv()

# FastAPI app initialization
app = FastAPI(title="PaperMind API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================= MONGODB CONNECTION (UPDATED) =================
# We now attempt to use the database name from the connection string first.
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URL)

try:
    # This aligns Python with Node.js/Mongoose behavior
    db = client.get_default_database()
    print(f"[INFO] Connected to database: {db.name}")
except Exception:
    # Fallback if the URL doesn't specify a DB name
    db = client.papermind_db
    print(f"[INFO] No DB in URL, defaulting to: {db.name}")

# Collections
users_collection = db.users
chats_collection = db.chats

# Session service for ADK
db_url = "sqlite:///chat.db"
session_service = DatabaseSessionService(db_url=db_url)
APP_NAME = "PaperMind"

# Upload directory
UPLOAD_DIR = "uploaded_files"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ================= HELPER FUNCTIONS =================

def get_agent_tools(agent_type: str) -> list:
    """Return appropriate tools based on agent type"""
    tool_list = []
    if agent_type.lower() == "legal":
        tool_list.append(legal_agent_tool)
    elif agent_type.lower() == "education":
        tool_list.append(education_agent_tool)
    elif agent_type.lower() == "finance":
        tool_list.append(finance_agent_tool)
    return tool_list


def create_agent(agent_type: str) -> Agent:
    """Create agent with appropriate tools"""
    tools = get_agent_tools(agent_type)

    if agent_type.lower() == "general":
        description = """
        You are a helpful general assistant.
        Provide clear, concise, and accurate responses to user queries.
        Be friendly and professional in your interactions.
        """
    else:
        description = f"""
        You are a {agent_type} document assistant.
        Use only the provided document context and the user request.
        Rules:
        - Do not use external knowledge.
        - Do not invent facts.
        - If info is missing, say so.
        """

    return Agent(
        name=f"{agent_type}_agent",
        description=description,
        tools=tools,
        model="gemini-2.5-flash"
        
    )


async def get_user_id(username: str) -> ObjectId:
    """Get user ID from username (email) with Debugging"""
    user = await users_collection.find_one({"email": username})

    if not user:
        # Debugging: Print failure details to console
        print(f"[ERROR] User '{username}' not found in DB '{db.name}'.")
        raise HTTPException(status_code=404, detail="User not found")

    return user["_id"]


async def ensure_chat_document(user_id: ObjectId) -> dict:
    """Ensure chat document exists for user"""
    chat_doc = await chats_collection.find_one({"userId": user_id})

    if not chat_doc:
        chat_doc = {
            "userId": user_id,
            "sessions": [],
            "createdAt": datetime.now(),
            "updatedAt": datetime.now()
        }
        result = await chats_collection.insert_one(chat_doc)
        chat_doc["_id"] = result.inserted_id

    return chat_doc


async def create_adk_session(username: str) -> str:
    """Create a new ADK session internally"""
    initial_state = {"user_name": username}
    new_session = await session_service.create_session(
        app_name=APP_NAME,
        user_id=username,
        state=initial_state,
    )
    adk_id = new_session.id
    await utils.add_new_session(username, adk_id)
    print(f"[INFO] Created internal ADK session: {adk_id}")
    return adk_id


async def add_session_to_mongo(user_id: ObjectId, chat_session_id: str, adk_session_id: str):
    """Add new session to MongoDB chat document"""
    new_session = {
        "sessionId": chat_session_id,     # Public UUID
        "adkSessionId": adk_session_id,   # Internal ADK ID
        "messages": [],
        "createdAt": datetime.now(),
        "updatedAt": datetime.now()
    }
    await chats_collection.update_one(
        {"userId": user_id},
        {
            "$push": {"sessions": new_session},
            "$set": {"updatedAt": datetime.now()}
        }
    )


async def get_adk_id_for_session(user_id: ObjectId, chat_session_id: str) -> Optional[str]:
    """Retrieve the internal ADK session ID"""
    chat_doc = await chats_collection.find_one(
        {"userId": user_id, "sessions.sessionId": chat_session_id},
        {"sessions.$": 1}
    )
    if chat_doc and "sessions" in chat_doc and chat_doc["sessions"]:
        session = chat_doc["sessions"][0]
        return session.get("adkSessionId", session.get("sessionId"))
    return None


async def update_adk_id_for_session(user_id: ObjectId, chat_session_id: str, new_adk_id: str):
    """Update the ADK ID for an existing mongo session"""
    await chats_collection.update_one(
        {"userId": user_id, "sessions.sessionId": chat_session_id},
        {"$set": {"sessions.$.adkSessionId": new_adk_id}}
    )


async def save_message_to_session(user_id: ObjectId, chat_session_id: str, message: str, answer: str):
    """Save message and answer to session in MongoDB"""
    new_message = {
        "message": message,
        "answer": answer,
        "timestamp": datetime.now()
    }
    await chats_collection.update_one(
        {"userId": user_id, "sessions.sessionId": chat_session_id},
        {
            "$push": {"sessions.$.messages": new_message},
            "$set": {
                "sessions.$.updatedAt": datetime.now(),
                "updatedAt": datetime.now()
            }
        }
    )


async def process_agent_request(
    agent_type: str,
    username: str,
    adk_session_id: str,
    query: str,
    file_path: Optional[str] = None
) -> str:
    """Process request through the agent"""
    agent = create_agent(agent_type)
    runner = Runner(
        agent=agent,
        app_name=APP_NAME,
        session_service=session_service,
    )
    document_context = ""
    if file_path and os.path.exists(file_path):
        try:
            if file_path.endswith(".pdf"):
                reader = PdfReader(file_path)
                document_context = "\n".join([page.extract_text() for page in reader.pages])
            elif file_path.endswith(".txt"):
                with open(file_path, "r", encoding="utf-8") as f:
                    document_context = f.read()
        except Exception as file_err:
            print(f"[ERROR] Failed to read file: {file_err}")
            document_context = "Could not read the document content."

    # Combine the query with the ACTUAL text from the document
    if agent_type.lower() == "general":
        user_prompt = f"User Query: {query}"
    else:
        user_prompt = f"""
        Analysis Type: {agent_type}
        
        DOCUMENT CONTENT:
        {document_context}
        
        USER REQUEST:
        {query}
        """
    # --- END OF NEW LOGIC ---


    content = types.Content(
        role="user",
        parts=[types.Part(text=user_prompt)],
    )

    try:
        final_response = await utils.call_agent_async(runner, username, adk_session_id, content)
        if isinstance(final_response, dict):
            answer = final_response.get("response", str(final_response))
        else:
            answer = str(final_response)
        return answer
    except Exception as e:
        print(f"[ERROR] Agent processing failed: {e}")
        return f"Error processing request: {str(e)}"


# ================= API ROUTES =================

@app.get("/health")
async def health_check():
    try:
        await db.command("ping")
        mongo_status = "connected"
    except Exception as e:
        mongo_status = f"error: {str(e)}"
    return {
        "status": "ok",
        "mongodb": mongo_status,
        "db_name": db.name
    }


@app.post("/chat")
async def chat(
    agent: str = Form(..., description="Agent type"),
    username: str = Form(..., description="User's email"),
    question: str = Form(..., description="User's question"),
    sessionId: Optional[str] = Form(None, description="MongoDB Session UUID"),
    files: Optional[List[UploadFile]] = File(None)

):
    try:
        valid_agents = ["legal", "education", "finance", "general"]
        if agent.lower() not in valid_agents:
            raise HTTPException(status_code=400, detail="Invalid agent type")

        file_path = None
        uploaded_file = None

        if files and len(files) > 0:
            uploaded_file = files[0]   # take first file only
            safe_filename = (f"{username}_{datetime.now().timestamp()}_{uploaded_file.filename}")
            file_path = os.path.join(UPLOAD_DIR, safe_filename)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(uploaded_file.file, buffer)


        # DEBUG: This is where it was failing
        user_id = await get_user_id(username)
        chat_doc = await ensure_chat_document(user_id)

        active_chat_id = None
        active_adk_id = None

        if sessionId:
            # Resume existing session
            active_chat_id = sessionId
            active_adk_id = await get_adk_id_for_session(user_id, active_chat_id)
            if not active_adk_id:
                active_adk_id = await create_adk_session(username)
                await update_adk_id_for_session(user_id, active_chat_id, active_adk_id)
        else:
            # Create or Auto-resume
            existing_sessions = chat_doc.get("sessions", [])
            if existing_sessions:
                latest_session = sorted(
                    existing_sessions,
                    key=lambda x: x.get("updatedAt", x.get(
                        "createdAt", datetime.min)),
                    reverse=True
                )[0]
                active_chat_id = latest_session["sessionId"]
                active_adk_id = latest_session.get(
                    "adkSessionId", active_chat_id)
            else:
                active_chat_id = str(uuid.uuid4())
                active_adk_id = await create_adk_session(username)
                await add_session_to_mongo(user_id, active_chat_id, active_adk_id)

        answer = await process_agent_request(
            agent_type=agent,
            username=username,
            adk_session_id=active_adk_id,
            query=question,
            file_path=file_path
        )

        await save_message_to_session(user_id, active_chat_id, question, answer)

        return {
            "sessionId": active_chat_id,
            "answer": answer,
            "timestamp": datetime.now().isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Chat endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/chat/latest/{username}")
async def get_latest_chat(username: str):
    try:
        user_id = await get_user_id(username)
        chat_doc = await chats_collection.find_one({"userId": user_id})

        if not chat_doc or not chat_doc.get("sessions"):
            return {"sessionId": None, "messages": []}

        latest_session = sorted(
            chat_doc.get("sessions", []),
            key=lambda x: x.get("updatedAt", x.get("createdAt", datetime.min)),
            reverse=True
        )[0]

        return {
            "sessionId": latest_session["sessionId"],
            "messages": latest_session.get("messages", [])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/sessions/{username}")
async def get_all_sessions(username: str):
    try:
        user_id = await get_user_id(username)
        chat_doc = await chats_collection.find_one({"userId": user_id})

        if not chat_doc:
            return {"sessions": []}

        sessions = []
        for session in chat_doc.get("sessions", []):
            sessions.append({
                "sessionId": session["sessionId"],
                "messageCount": len(session.get("messages", [])),
                "createdAt": session.get("createdAt"),
                "lastMessage": session.get("messages", [])[-1] if session.get("messages") else None
            })

        return {"sessions": sessions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/chat/{username}/{session_id}")
async def get_session_chat(username: str, session_id: str):
    try:
        user_id = await get_user_id(username)
        chat_doc = await chats_collection.find_one({"userId": user_id})

        if not chat_doc:
            raise HTTPException(status_code=404, detail="No history")

        session = next((s for s in chat_doc.get("sessions", [])
                       if s["sessionId"] == session_id), None)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        return {
            "sessionId": session["sessionId"],
            "messages": session.get("messages", [])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
