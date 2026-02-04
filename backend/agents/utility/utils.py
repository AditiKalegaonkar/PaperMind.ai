"""
Utility functions for agent processing
"""
from typing import Any, Dict


async def call_agent_async(runner, user_id: str, session_id: str, content: Any) -> Dict[str, Any]:
    """
    Call the agent asynchronously and process the response

    Args:
        runner: The ADK Runner instance
        user_id: User identifier
        session_id: Session identifier
        content: The content to send to the agent

    Returns:
        Dictionary containing the agent's response
    """
    try:
        # Execute the agent with the provided content
        response = await runner.run_async(
            user_id=user_id,
            session_id=session_id,
            content=content
        )

        # Process the response based on its structure
        if hasattr(response, 'content'):
            result = {
                "response": response.content,
                "status": "success"
            }
        elif isinstance(response, dict):
            result = response
        else:
            result = {
                "response": str(response),
                "status": "success"
            }

        return result

    except Exception as e:
        print(f"[ERROR] Agent execution failed: {e}")
        return {
            "response": f"Error processing request: {str(e)}",
            "status": "error",
            "error": str(e)
        }


async def add_new_session(user_id: str, session_id: str) -> bool:
    """
    Add a new session (placeholder for any additional session setup)

    Args:
        user_id: User identifier
        session_id: Session identifier

    Returns:
        Boolean indicating success
    """
    try:
        print(
            f"[INFO] New ADK session created for user {user_id}: {session_id}")
        return True
    except Exception as e:
        print(f"[ERROR] Failed to add session: {e}")
        return False
