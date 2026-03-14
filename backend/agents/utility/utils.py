"""
Utility functions for agent processing
"""
from typing import Any, Dict

async def call_agent_async(runner, user_id: str, session_id: str, content: Any) -> Dict[str, Any]:
    try:
      
    

        # 1. Start the generator
        # Note: We use new_messages (plural) to pass our list
        generator = runner.run_async(
            user_id=user_id,
            session_id=session_id,
            new_message=content
        )

        full_response_text = ""

        # 2. FIX THE CHUNK ERROR:
        # Dig into the object to get only the 'text'
        async for chunk in generator:
            if hasattr(chunk, "content") and chunk.content.parts:
                for part in chunk.content.parts:
                    if hasattr(part, "text"):
                        full_response_text += part.text
            elif isinstance(chunk, str):
                full_response_text += chunk

        return {
            "response": full_response_text.strip(),
            "status": "success"
        }

    except Exception as e:
        print(f"[ERROR] Agent execution failed: {e}")
        return {
            "response": f"Error processing request: {str(e)}",
            "status": "error",
            "error": str(e)
        }

async def add_new_session(user_id: str, session_id: str) -> bool:
    try:
        print(f"[INFO] New ADK session created for user {user_id}: {session_id}")
        return True
    except Exception as e:
        print(f"[ERROR] Failed to add session: {e}")
        return False