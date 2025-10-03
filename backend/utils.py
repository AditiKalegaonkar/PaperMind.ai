from pymongo import MongoClient
from datetime import datetime
import re
import sys
client = MongoClient("mongodb://localhost:27017/")
db = client["local"]
chats_collection = db["chats"]


# function to process the query

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

    return {
        "session_id": SESSION_ID,
        "summary": final_text_response,
        "code": final_js_code
    }

# to update session in mongodb database


async def add_new_session(user_id: str, new_session_id: str):
    """
    Adds a new session with the given sessionId for the user.
    user_id is a string, not ObjectId.
    """
    new_session = {
        "sessionId": new_session_id,
        "messages": [],
        "createdAt": datetime.now(),
        "updatedAt": datetime.now()
    }

    result = chats_collection.update_one(
        {"userId": user_id},
        {"$push": {"sessions": new_session}},
        upsert=True
    )

    return result.modified_count > 0 or result.upserted_id is not None
