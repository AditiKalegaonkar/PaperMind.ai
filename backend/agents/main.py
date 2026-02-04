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

# MongoDB connection
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URL)
db = client.papermind_db

# Collections
users_collection = db.users
chats_collection = db.chats

# Session service for ADK
# ADK uses this internally. We will map our Mongo IDs to these ADK IDs.
db_url = "sqlite:///chat.db"
session_service = DatabaseSessionService(db_url=db_url)
APP_NAME = "PaperMind"

# Upload directory
UPLOAD_DIR = "uploaded_files"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ============== Helper Functions ==============

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
        Your task is to understand the user's intent and produce a clear, helpful response that strictly follows the
        domain instructions.
        Rules:
        - Do not use external knowledge.
        - Do not invent facts or examples.
        - If the requested information is not present, clearly say that it is not available.
        - Keep the response concise, well structured, and directly aligned with the user request.
        """

    return Agent(
        name=f"{agent_type}_agent",
        description=description,
        tools=tools
    )


async def get_user_id(username: str) -> ObjectId:
    """Get user ID from username (email)"""
    user = await users_collection.find_one({"email": username})
    if not user:
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
    """
    Create a new ADK session internally and return its ID.
    This ID is private to the backend and mapped to the MongoDB session ID.
    """
    initial_state = {"user_name": username}

    new_session = await session_service.create_session(
        app_name=APP_NAME,
        user_id=username,
        state=initial_state,
    )

    adk_id = new_session.id
    # We still track it in utils if needed for debug/metrics
    await utils.add_new_session(username, adk_id)
    print(f"[INFO] Created internal ADK session: {adk_id}")

    return adk_id


async def add_session_to_mongo(user_id: ObjectId, chat_session_id: str, adk_session_id: str):
    """
    Add new session to MongoDB chat document.
    Stores BOTH the public chat_session_id (UUID) and the private adk_session_id.
    """
    new_session = {
        "sessionId": chat_session_id,     # Public UUID (Frontend sees this)
        "adkSessionId": adk_session_id,   # Internal ADK ID (Hidden)
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
    """
    Retrieve the internal ADK session ID mapped to a specific public chat session ID.
    """
    chat_doc = await chats_collection.find_one(
        {"userId": user_id, "sessions.sessionId": chat_session_id},
        {"sessions.$": 1}
    )
    
    if chat_doc and "sessions" in chat_doc and chat_doc["sessions"]:
        session = chat_doc["sessions"][0]
        # Fallback: if adkSessionId is missing (legacy data), use sessionId
        return session.get("adkSessionId", session.get("sessionId"))
    return None


async def update_adk_id_for_session(user_id: ObjectId, chat_session_id: str, new_adk_id: str):
    """
    Update the ADK ID for an existing mongo session (Self-healing).
    Used if the ADK internal DB was wiped but we want to keep the Mongo chat history.
    """
    await chats_collection.update_one(
        {"userId": user_id, "sessions.sessionId": chat_session_id},
        {"$set": {"sessions.$.adkSessionId": new_adk_id}}
    )


async def save_message_to_session(user_id: ObjectId, chat_session_id: str, message: str, answer: str):
    """Save message and answer to session in MongoDB using the public chat ID"""
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
    """Process request through the agent using the provided internal ADK session ID"""
    agent = create_agent(agent_type)
    runner = Runner(
        agent=agent,
        app_name=APP_NAME,
        session_service=session_service,
    )

    if agent_type.lower() == "general":
        user_prompt = f"User Query: {query}"
    else:
        user_prompt = f"""
        Please perform a full {agent_type} analysis of the document based on the following details.
        Start with the RAG agent tool.
        User Query: "{query}"
        """
        if file_path:
            user_prompt += f'\nDocument Path: "{file_path}"'

    content = types.Content(
        role="user",
        parts=[types.Part(text=user_prompt)],
    )

    try:
        final_response = await utils.call_agent_async(runner, username, adk_session_id, content)
        print("[DEBUG] Final response raw:", final_response)
        if isinstance(final_response, dict):
            answer = final_response.get("response", str(final_response))
        else:
            answer = str(final_response)

        return answer
    except Exception as e:
        print(f"[ERROR] Agent processing failed: {e}")
        return f"I apologize, but I encountered an error processing your request: {str(e)}"


# API Routes
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        await db.command("ping")
        mongo_status = "connected"
    except Exception as e:
        mongo_status = f"error: {str(e)}"

    return {
        "status": "ok",
        "service": "Python Agent",
        "mongodb": mongo_status,
        "timestamp": datetime.now().isoformat()
    }


@app.post("/chat")
async def chat(
    agent: str = Form(..., description="Agent type: legal, education, finance, or general"),
    username: str = Form(..., description="User's email/username"),
    question: str = Form(..., description="User's question"),
    sessionId: Optional[str] = Form(None, description="The MongoDB Session UUID"),
    file: Optional[UploadFile] = File(None, description="Optional file upload")
):
    """
    Main chat endpoint.
    Uses 'sessionId' as the MongoDB identifier.
    Internally maps to 'adkSessionId' for the AI runner.
    """

    try:
        valid_agents = ["legal", "education", "finance", "general"]
        if agent.lower() not in valid_agents:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid agent type. Must be one of: {', '.join(valid_agents)}"
            )

        file_path = None
        if file:
            safe_filename = f"{username}_{datetime.now().timestamp()}_{file.filename}"
            file_path = os.path.join(UPLOAD_DIR, safe_filename)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            print(f"[INFO] File uploaded: {file_path}")

        user_id = await get_user_id(username)
        chat_doc = await ensure_chat_document(user_id)

        # Variables to hold the IDs we will use
        active_chat_id = None
        active_adk_id = None

        # 1. Determine which session we are working with
        if sessionId:
            # Case A: User sent a specific session ID (MongoDB UUID)
            print(f"[INFO] Resuming session ID: {sessionId}")
            active_chat_id = sessionId
            
            # Lookup the mapped ADK ID
            active_adk_id = await get_adk_id_for_session(user_id, active_chat_id)
            
            if not active_adk_id:
                print("[WARN] Mongo session found, but ADK ID missing. Creating new ADK link.")
                active_adk_id = await create_adk_session(username)
                await update_adk_id_for_session(user_id, active_chat_id, active_adk_id)

        else:
            # Case B: No ID sent. Try to find latest or create new.
            existing_sessions = chat_doc.get("sessions", [])
            
            if existing_sessions:
                # Get latest session
                latest_session = sorted(
                    existing_sessions, 
                    key=lambda x: x.get("updatedAt", x.get("createdAt", datetime.min)), 
                    reverse=True
                )[0]
                
                active_chat_id = latest_session["sessionId"]
                active_adk_id = latest_session.get("adkSessionId")
                
                # Check for legacy data where adkSessionId might be missing
                if not active_adk_id:
                     active_adk_id = active_chat_id # Legacy fallback
                     
                print(f"[INFO] Auto-resumed latest session: {active_chat_id}")
            
            else:
                # Create brand new session (First time user)
                active_chat_id = str(uuid.uuid4()) # Generate our own MongoDB UUID
                active_adk_id = await create_adk_session(username) # Generate ADK ID
                
                await add_session_to_mongo(user_id, active_chat_id, active_adk_id)
                print(f"[INFO] Created NEW session. MongoID: {active_chat_id}")

        # 2. Process request using the ADK ID
        answer = await process_agent_request(
            agent_type=agent,
            username=username,
            adk_session_id=active_adk_id, # Run logic using internal ID
            query=question,
            file_path=file_path
        )

        # 3. Save result using the Mongo ID (Frontend only sees this)
        await save_message_to_session(user_id, active_chat_id, question, answer)

        return {
            "sessionId": active_chat_id, # Return the MongoDB UUID only!
            "answer": answer,
            "timestamp": datetime.now().isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Chat endpoint error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@app.get("/chat/latest/{username}")
async def get_latest_chat(username: str):
    """
    Get the most recent chat session for a user.
    Returns the MongoDB Session ID (UUID), never the internal ADK ID.
    """
    try:
        user = await users_collection.find_one({"email": username})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        chat_doc = await chats_collection.find_one({"userId": user["_id"]})

        if not chat_doc or not chat_doc.get("sessions"):
            return {
                "sessionId": None,
                "messages": [],
                "createdAt": None,
                "updatedAt": None
            }

        sessions = chat_doc.get("sessions", [])
        latest_session = sorted(
            sessions, 
            key=lambda x: x.get("updatedAt", x.get("createdAt", datetime.min)), 
            reverse=True
        )[0]

        return {
            "sessionId": latest_session["sessionId"], # Public ID
            "messages": latest_session.get("messages", []),
            "createdAt": latest_session.get("createdAt"),
            "updatedAt": latest_session.get("updatedAt")
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Get latest chat error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@app.get("/chat/{username}/{session_id}")
async def get_session_chat(username: str, session_id: str):
    """
    Get chat history for a specific public session ID
    """
    try:
        user = await users_collection.find_one({"email": username})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user_id = user["_id"]
        chat_doc = await chats_collection.find_one({"userId": user_id})

        if not chat_doc:
            raise HTTPException(status_code=404, detail="No chat history found")

        # Search by public sessionId
        session = next((s for s in chat_doc.get("sessions", [])
                       if s["sessionId"] == session_id), None)

        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        return {
            "sessionId": session["sessionId"], # Public ID
            "messages": session.get("messages", []),
            "createdAt": session.get("createdAt"),
            "updatedAt": session.get("updatedAt")
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Get session error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@app.get("/sessions/{username}")
async def get_all_sessions(username: str):
    """
    Get all sessions for a user
    """
    try:
        user = await users_collection.find_one({"email": username})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user_id = user["_id"]
        chat_doc = await chats_collection.find_one({"userId": user_id})

        if not chat_doc:
            return {"sessions": []}

        sessions = []
        for session in chat_doc.get("sessions", []):
            sessions.append({
                "sessionId": session["sessionId"], # Public ID
                "messageCount": len(session.get("messages", [])),
                "createdAt": session.get("createdAt"),
                "updatedAt": session.get("updatedAt"),
                "lastMessage": session.get("messages", [])[-1] if session.get("messages") else None
            })

        return {"sessions": sessions}

    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Get sessions error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)