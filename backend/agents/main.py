import logging
import os
import shutil
import uuid
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Optional, List, AsyncGenerator

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from bson import ObjectId
from dotenv import load_dotenv
import motor.motor_asyncio
from google.genai import types
from google.adk.sessions import DatabaseSessionService
from google.adk.runners import Runner
from google.adk.agents import Agent
from utility import utils
import uvicorn

from legal.agent import legal_agent, legal_agent_tool
from education.agent import education_agent, education_agent_tool
from finance.agent import finance_agent, finance_agent_tool
from general.rag_agent import general_rag_agent, general_rag_agent_tool
from fastapi.responses import JSONResponse

load_dotenv()

# ── Structured logging ────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("papermind")

_REQUIRED_ENV_VARS = ["MONGODB_URL", "GOOGLE_API_KEY"]
_missing = [v for v in _REQUIRED_ENV_VARS if not os.getenv(v)]
if _missing:
    log.error(
        "Missing required environment variable(s): %s. Set these in Railway's Variables tab.",
        ", ".join(_missing),
    )
    raise RuntimeError(f"Missing required environment variables: {', '.join(_missing)}")

# ── MongoDB ───────────────────────────────────────────────────────────────────
MONGODB_URL = os.getenv("MONGODB_URL")
client = motor.motor_asyncio.AsyncIOMotorClient(
    MONGODB_URL,
    serverSelectionTimeoutMS=5000,
)
try:
    db = client.get_default_database()
    log.info("Connected to MongoDB database: %s", db.name)
except Exception as e:
    db = client.papermind_db
    log.warning("No DB name in MONGODB_URL (%s) — defaulting to: %s", e, db.name)

users_collection    = db.users
chats_collection    = db.chats

# ── ADK session service (SQLite) ──────────────────────────────────────────────
session_service: Optional[DatabaseSessionService] = None
SESSION_DB_URL = "sqlite+aiosqlite:///chat2.db"
APP_NAME       = "PaperMind"

UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "uploaded_files"))
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ── Lifespan ──────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: "FastAPI"):
    global session_service

    try:
        await db.command("ping")
        log.info("MongoDB ping succeeded — database reachable.")
    except Exception as e:
        log.error(
            "MongoDB unreachable at startup: %s. "
            "Check MONGODB_URL and Atlas Network Access "
            "(Railway uses dynamic IPs — allow 0.0.0.0/0).",
            e,
        )

    try:
        session_service = DatabaseSessionService(SESSION_DB_URL)
        log.info("ADK Session service initialized")
    except Exception as e:
        log.error("Failed to initialize ADK session service: %s", e)
        session_service = None

    if not os.getenv("RAILWAY_VOLUME_MOUNT_PATH"):
        log.warning(
            "No Railway volume detected — SQLite session DB and uploaded files "
            "will be wiped on redeploy.",
        )

    try:
        await chats_collection.create_index(
            [("userId", 1), ("sessions.sessionId", 1)],
            name="userId_sessionId",
        )
        log.info("MongoDB indexes ensured.")
    except Exception as e:
        log.error("Failed to ensure MongoDB indexes: %s", e)

    yield


# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(title="PaperMind API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Session-Id", "X-Adk-Session-Id"],
)


# ── Pydantic models ───────────────────────────────────────────────────────────
class MetadataUpdate(BaseModel):
    documents: Optional[List[str]] = None
    agent:     Optional[str]       = None


# ── Agent cache ───────────────────────────────────────────────────────────────
_cached_agents: dict = {}


def _get_agent(agent_type: str) -> Optional[Agent]:
    agent_type_lower = agent_type.lower()
    if agent_type_lower in _cached_agents:
        return _cached_agents[agent_type_lower]
    agent = {
        "general":   general_rag_agent,
        "legal":     legal_agent,
        "education": education_agent,
        "finance":   finance_agent,
    }.get(agent_type_lower)
    if agent:
        _cached_agents[agent_type_lower] = agent
        log.info("Cached %s agent", agent_type_lower)
    return agent


def _get_runner(agent_type: str) -> Runner:
    agent_type_lower = agent_type.lower()
    agent = _get_agent(agent_type_lower)
    if not agent:
        raise ValueError(f"Unknown agent type: {agent_type}")
    if session_service:
        return Runner(agent=agent, app_name=APP_NAME, session_service=session_service)
    from google.adk.sessions import InMemorySessionService
    return Runner(agent=agent, app_name=APP_NAME, session_service=InMemorySessionService())


async def _get_user_id(username: str) -> ObjectId:
    user = await users_collection.find_one({"email": username})
    if not user:
        log.warning("User not found: %s", username)
        raise HTTPException(status_code=404, detail="User not found")
    return user["_id"]


async def _ensure_chat_doc(user_id: ObjectId) -> dict:
    doc = await chats_collection.find_one({"userId": user_id})
    if not doc:
        doc = {
            "userId":    user_id,
            "sessions":  [],
            "createdAt": datetime.now(),
            "updatedAt": datetime.now(),
        }
        result = await chats_collection.insert_one(doc)
        doc["_id"] = result.inserted_id
    return doc


async def _create_adk_session(username: str) -> str:
    if not session_service:
        fallback_id = f"{username}_{datetime.now().timestamp()}"
        log.warning("Session service unavailable, fallback: %s", fallback_id)
        return fallback_id
    try:
        session = await session_service.create_session(
            app_name=APP_NAME,
            user_id=username,
            state={"user_name": username},
        )
        if not session or not session.id:
            raise RuntimeError("Failed to create ADK session")
        try:
            await utils.add_new_session(username, session.id)
        except Exception as e:
            log.error("Failed to add new session to utility: %s", e)
        log.info("Created ADK session %s for %s", session.id, username)
        return session.id
    except Exception as e:
        log.error("Error creating ADK session: %s", e)
        return f"{username}_{datetime.now().timestamp()}"


async def _add_session_to_mongo(
    user_id: ObjectId, chat_id: str, adk_id: str, agent: str = "general"
):
    await chats_collection.update_one(
        {"userId": user_id},
        {
            "$push": {
                "sessions": {
                    "sessionId":    chat_id,
                    "adkSessionId": adk_id,
                    "agent":        agent,
                    "title":        None,
                    "messages":     [],
                    "documents":    [],
                    "filePaths":    [],
                    "createdAt":    datetime.now(),
                    "updatedAt":    datetime.now(),
                }
            },
            "$set": {"updatedAt": datetime.now()},
        },
    )


async def _get_adk_id(user_id: ObjectId, chat_id: str) -> Optional[str]:
    doc = await chats_collection.find_one(
        {"userId": user_id, "sessions.sessionId": chat_id},
        {"sessions.$": 1},
    )
    if doc and doc.get("sessions"):
        s = doc["sessions"][0]
        return s.get("adkSessionId") or s.get("sessionId")
    return None


async def _update_adk_id(user_id: ObjectId, chat_id: str, adk_id: str):
    await chats_collection.update_one(
        {"userId": user_id, "sessions.sessionId": chat_id},
        {"$set": {"sessions.$.adkSessionId": adk_id}},
    )


async def _get_session_file_paths(user_id: ObjectId, chat_id: str) -> List[str]:
    doc = await chats_collection.find_one(
        {"userId": user_id, "sessions.sessionId": chat_id},
        {"sessions.$": 1},
    )
    if doc and doc.get("sessions"):
        raw = doc["sessions"][0].get("filePaths", [])
        return [p for p in raw if os.path.exists(p)]
    return []


async def _append_session_file_paths(
    user_id: ObjectId, chat_id: str, new_paths: List[str]
):
    if not new_paths:
        return
    await chats_collection.update_one(
        {"userId": user_id, "sessions.sessionId": chat_id},
        {"$push": {"sessions.$.filePaths": {"$each": new_paths}}},
    )


async def _save_message(user_id: ObjectId, chat_id: str, message: str, answer: str):
    await chats_collection.update_one(
        {"userId": user_id, "sessions.sessionId": chat_id},
        {
            "$push": {
                "sessions.$.messages": {
                    "message":   message,
                    "answer":    answer,
                    "timestamp": datetime.now(),
                }
            },
            "$set": {
                "sessions.$.updatedAt": datetime.now(),
                "updatedAt":            datetime.now(),
            },
        },
    )


def read_file_content(path: str) -> str:
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()
    except Exception as e:
        log.error("Failed to read file %s: %s", path, e)
        return ""


def _build_prompt(agent_type: str, query: str, file_paths: List[str]) -> str:
    agent_type_lower = agent_type.lower()

    if agent_type_lower == "general":
        prompt = f"User Query: {query}"
    else:
        prompt = f'Please perform a full {agent_type_lower} analysis.\nUser Query: "{query}"'

    if file_paths:
        prompt += "\n\nDocuments:\n"
        for p in file_paths:
            prompt += f"\nFile path: {p}\n"
            if not p.lower().endswith(".pdf"):
                content = read_file_content(p)
                if content:
                    prompt += f"{content}\n"

    return prompt


async def _process(
    agent_type: str, username: str, adk_id: str, query: str, file_paths: List[str]
) -> str:
    runner  = _get_runner(agent_type)
    prompt  = _build_prompt(agent_type, query, file_paths)
    content = types.Content(role="user", parts=[types.Part(text=prompt)])
    result_text = ""
    async for chunk in runner.run_async(
        user_id=username, session_id=adk_id, new_message=content
    ):
        if hasattr(chunk, "content") and chunk.content:
            for part in getattr(chunk.content, "parts", []):
                if hasattr(part, "text") and part.text:
                    result_text += part.text
    return result_text


async def _stream_process(
    agent_type: str, username: str, adk_id: str, query: str, file_paths: List[str]
) -> AsyncGenerator[str, None]:
    """Yield SSE lines `data: <token>\n\n`."""
    runner  = _get_runner(agent_type)
    prompt  = _build_prompt(agent_type, query, file_paths)
    content = types.Content(role="user", parts=[types.Part(text=prompt)])
    try:
        async for chunk in runner.run_async(
            user_id=username, session_id=adk_id, new_message=content
        ):
            log.info("Chunk: %s", chunk)
            text = ""
            try:
                if hasattr(chunk, "content") and chunk.content:
                    for part in getattr(chunk.content, "parts", []):
                        if hasattr(part, "function_response") and part.function_response:
                            response = part.function_response.response
                            if isinstance(response, str):
                                text = response
                            elif isinstance(response, dict):
                                text = response.get("result", "")
                        elif hasattr(part, "text") and part.text:
                            text = part.text
            except Exception as e:
                log.error("Chunk parse error: %s", e)

            if text:
                yield f"data: {text}\n\n"
    except Exception as e:
        log.error("Stream agent failed for %s: %s", username, e)
        yield f"data: Error: {e}\n\n"

    yield "data: [DONE]\n\n"


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
async def health_check():
    try:
        await db.command("ping")
        mongo_status = "connected"
        mongo_ok     = True
    except Exception as e:
        mongo_status = f"error: {e}"
        mongo_ok     = False
        log.error("Health check: MongoDB unreachable: %s", e)

    payload = {
        "status":          "ok" if mongo_ok else "degraded",
        "mongodb":         mongo_status,
        "db_name":         db.name,
        "session_service": "ready" if session_service else "unavailable (using in-memory fallback)",
    }

    if not mongo_ok:
        return JSONResponse(status_code=503, content=payload)

    return payload


@app.post("/chat")
async def chat(
    agent:     str                        = Form(...),
    username:  str                        = Form(...),
    question:  str                        = Form(...),
    sessionId: Optional[str]              = Form(None),
    stream:    Optional[str]              = Form(None),
    files:     Optional[List[UploadFile]] = File(None),
):
    valid = {"legal", "education", "finance", "general"}
    if agent.lower() not in valid:
        raise HTTPException(status_code=400, detail="Invalid agent type")

    log.info(
        "Chat | user=%s agent=%s stream=%s sessionId=%s",
        username, agent, stream, sessionId,
    )

    # ── Save uploaded files ────────────────────────────────────────────────────
    new_file_paths: List[str] = []
    if files:
        for f in files:
            if f and f.filename:
                safe_filename = os.path.basename(f.filename)
                safe = f"{username}_{datetime.now().timestamp()}_{safe_filename}"
                dest = os.path.join(UPLOAD_DIR, safe)
                try:
                    with open(dest, "wb") as buf:
                        shutil.copyfileobj(f.file, buf)
                except OSError as e:
                    log.error("Failed to save upload %s: %s", f.filename, e)
                    raise HTTPException(
                        status_code=500,
                        detail=f"Could not save uploaded file '{f.filename}'. Check server storage.",
                    )
                new_file_paths.append(dest)
                log.info("Saved upload: %s", dest)

    # ── User + chat doc ────────────────────────────────────────────────────────
    user_id = await _get_user_id(username)
    await _ensure_chat_doc(user_id)

    # ── Session resolution ─────────────────────────────────────────────────────
    if sessionId:
        active_chat_id = sessionId
        adk_id = await _get_adk_id(user_id, active_chat_id)
        if not adk_id:
            adk_id = await _create_adk_session(username)
            await _update_adk_id(user_id, active_chat_id, adk_id)
    else:
        active_chat_id = str(uuid.uuid4())
        adk_id         = await _create_adk_session(username)
        await _add_session_to_mongo(user_id, active_chat_id, adk_id, agent)

    stored_paths = await _get_session_file_paths(user_id, active_chat_id)
    if new_file_paths:
        await _append_session_file_paths(user_id, active_chat_id, new_file_paths)
    file_paths = stored_paths + new_file_paths

    log.info(
        "Resolved | session=%s adk=%s files=%d",
        active_chat_id, adk_id, len(file_paths),
    )

    # ── Streaming SSE response ─────────────────────────────────────────────────
    if stream and stream.lower() == "true":
        collected: List[str] = []

        async def sse_with_save():
            async for chunk in _stream_process(agent, username, adk_id, question, file_paths):
                if chunk != "data: [DONE]\n\n":
                    payload = chunk.replace("data: ", "").strip()
                    collected.append(payload)
                yield chunk
            await _save_message(user_id, active_chat_id, question, "".join(collected))

        return StreamingResponse(
            sse_with_save(),
            media_type="text/event-stream",
            headers={
                "X-Session-Id":     active_chat_id,
                "X-Adk-Session-Id": adk_id,
                "Cache-Control":    "no-cache",
                "Connection":       "keep-alive",
                "X-Accel-Buffering": "no",
            },
        )

    # ── Standard JSON response ─────────────────────────────────────────────────
    answer = await _process(agent, username, adk_id, question, file_paths)
    await _save_message(user_id, active_chat_id, question, answer)
    log.info("Response: %s", answer[:200])

    return JSONResponse(
        content={
            "sessionId":    active_chat_id,
            "adkSessionId": adk_id,
            "response":     answer,
            "timestamp":    datetime.now().isoformat(),
        },
        headers={
            "X-Session-Id":     active_chat_id,
            "X-Adk-Session-Id": adk_id,
        },
    )


@app.patch("/chat/{username}/{session_id}/rename")
async def rename_session(username: str, session_id: str, title: str = Form(...)):
    user_id = await _get_user_id(username)
    result  = await chats_collection.update_one(
        {"userId": user_id, "sessions.sessionId": session_id},
        {"$set": {"sessions.$.title": title.strip()[:60]}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    log.info("Renamed session %s → '%s'", session_id, title)
    return {"ok": True, "title": title.strip()[:60]}


# ── Metadata: accepts JSON body (Node sends application/json) ─────────────────
@app.patch("/chat/{username}/{session_id}/metadata")
async def update_session_metadata(
    username:   str,
    session_id: str,
    body:       MetadataUpdate,
):
    user_id = await _get_user_id(username)
    update_fields = {}
    if body.agent:
        update_fields["sessions.$.agent"] = body.agent
    if body.documents is not None:
        update_fields["sessions.$.documents"] = body.documents
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await chats_collection.update_one(
        {"userId": user_id, "sessions.sessionId": session_id},
        {"$set": update_fields},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    log.info(
        "Updated metadata for session %s: agent=%s docs=%s",
        session_id, body.agent, body.documents,
    )
    return {"ok": True}


@app.delete("/chat/{username}/{session_id}")
async def delete_session(username: str, session_id: str):
    user_id = await _get_user_id(username)
    result  = await chats_collection.update_one(
        {"userId": user_id},
        {"$pull": {"sessions": {"sessionId": session_id}}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    log.info("Deleted session %s for %s", session_id, username)
    return {"ok": True}


@app.get("/sessions/{username}")
async def get_sessions(username: str):
    user_id = await _get_user_id(username)
    doc     = await chats_collection.find_one({"userId": user_id})
    if not doc:
        return {"sessions": []}
    sessions = [
        {
            "sessionId":    s["sessionId"],
            "title":        s.get("title"),
            "agent":        s.get("agent", "general"),
            "documents":    s.get("documents", []),
            "messageCount": len(s.get("messages", [])),
            "createdAt":    s.get("createdAt"),
            "updatedAt":    s.get("updatedAt"),
            "lastMessage":  s["messages"][-1] if s.get("messages") else None,
        }
        for s in doc.get("sessions", [])
    ]
    sessions.sort(
        key=lambda x: x.get("updatedAt") or x.get("createdAt") or datetime.min,
        reverse=True,
    )
    return {"sessions": sessions}


@app.get("/chat/{username}/{session_id}")
async def get_session(username: str, session_id: str):
    user_id = await _get_user_id(username)
    doc     = await chats_collection.find_one({"userId": user_id})
    if not doc:
        raise HTTPException(status_code=404, detail="No history")
    session = next(
        (s for s in doc.get("sessions", []) if s["sessionId"] == session_id), None
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"sessionId": session["sessionId"], "messages": session.get("messages", [])}


if __name__ == "__main__":
    port_str = os.getenv("PORT") or os.getenv("FAST_API_PORT", "8000")
    try:
        port = int(port_str)
    except ValueError:
        log.error("Invalid port value %r — falling back to 8000.", port_str)
        port = 8000
    log.info("Starting FastAPI on 0.0.0.0:%d", port)
    uvicorn.run("main:app", host="0.0.0.0", port=port)