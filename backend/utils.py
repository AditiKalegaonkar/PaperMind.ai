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

    combined_response = final_text_response
    if final_js_code:
        js_markdown = f"```javascript\n{final_js_code}\n```"
        combined_response = f"{final_text_response}\n\n{js_markdown}"

    return combined_response

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


# extract the code Function
def extract_js(final_response: str):
    if final_response is None:
        raise ValueError("Agent did not return a response")
    code_match = re.search(r"<div class='plot'>(.*?)</div>",
                           final_response, re.DOTALL | re.IGNORECASE)
    code = code_match.group(0) if code_match else ""
    summary = re.sub(r"<div>.*?</div>", "", final_response,
                     flags=re.DOTALL | re.IGNORECASE).strip()

    return {
        "summary": summary,
        "code": code
    }
