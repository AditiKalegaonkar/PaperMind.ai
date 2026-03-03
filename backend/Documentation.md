# PaperMind FastAPI Backend - Full Documentation

FastAPI backend with MongoDB integration and ADK session management.

## Architecture

- **Sessions**: Created via ADK `session_service.create_session()` - NOT auto-generated UUIDs
- **Users**: Must exist in MongoDB (created separately, not by app.py)
- **Storage**: ADK session IDs stored in MongoDB chats collection

## API Endpoints

### POST /chat

**Purpose**: Process user query and save to MongoDB

**Form Data:**
- `agent` (required): "legal", "education", "finance", or "general"
- `username` (required): User's email (must exist in users collection)
- `question` (required): User's question
- `sessionId` (optional): ADK Session ID (creates new if not provided)
- `file` (optional): File upload

**Response:**
```json
{
  "sessionId": "adk-generated-session-id",
  "answer": "Agent's response",
  "timestamp": "2024-02-03T10:30:00"
}
```

**Session Behavior:**

NO sessionId provided:
```
1. Creates ADK session via session_service.create_session()
2. Gets session_id from ADK
3. Stores session_id in MongoDB
4. Returns ADK session_id to client
```

sessionId provided:
```
1. Uses existing ADK session
2. Saves message to MongoDB under that session
3. Returns same session_id
```

**Examples:**

```bash
# New session
curl -X POST "http://localhost:8000/chat" \
  -F "agent=general" \
  -F "username=user@example.com" \
  -F "question=What is AI?"

# Response: { "sessionId": "adk-uuid-here", ... }

# Continue session
curl -X POST "http://localhost:8000/chat" \
  -F "agent=general" \
  -F "username=user@example.com" \
  -F "sessionId=adk-uuid-here" \
  -F "question=Tell me more"
```

### GET /chat/{username}/{session_id}

Load chat history for a session.

```bash
curl "http://localhost:8000/chat/user@example.com/adk-session-id"
```

### GET /sessions/{username}

Get all sessions for a user.

```bash
curl "http://localhost:8000/sessions/user@example.com"
```

## Database Schema

### users collection
```javascript
{
  _id: ObjectId,
  firstName: String,
  lastName: String,
  email: String (unique),
  phone: { countryCode: String, number: String },
  password: String,
  googleId: String,
  createdAt: Date,
  updatedAt: Date
}
```

### chats collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  sessions: [
    {
      sessionId: String,  // ADK session ID from session_service
      messages: [
        {
          message: String,
          answer: String,
          timestamp: Date
        }
      ],
      createdAt: Date,
      updatedAt: Date
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

## Code Flow

### New Session:
```python
# In POST /chat when sessionId is None:
adk_session_id = await create_adk_session(username)
# ↓ creates session via:
new_session = await session_service.create_session(
    app_name=APP_NAME,
    user_id=username,
    state=initial_state
)
session_id = new_session.id  # This is the ADK session ID

# Then store in MongoDB:
await add_session_to_mongo(user_id, adk_session_id)
```

### Continue Session:
```python
# In POST /chat when sessionId is provided:
adk_session_id = sessionId  # Use existing ADK session ID
# Process through agent using this session
# Save message to MongoDB
```

## Agent Types

- **general**: No tools, conversational responses
- **legal**: Legal document analysis (requires legal_agent_tool)
- **education**: Education content analysis (requires education_agent_tool)
- **finance**: Finance analysis (requires finance_agent_tool)

## Setup

```bash
pip install -r requirements.txt
cp .env.example .env
# Edit .env
uvicorn app:app --reload --port 8000
```

## Python Example

```python
import requests

username = "existing-user@example.com"  # Must exist!

# New chat - creates ADK session
resp = requests.post(
    "http://localhost:8000/chat",
    data={"agent": "general", "username": username, "question": "Hello"}
)
session_id = resp.json()["sessionId"]  # ADK session ID

# Continue - uses existing ADK session
resp = requests.post(
    "http://localhost:8000/chat",
    data={"agent": "general", "username": username, 
          "sessionId": session_id, "question": "More info"}
)

# Load history
resp = requests.get(f"http://localhost:8000/chat/{username}/{session_id}")
print(resp.json()["messages"])
```
## Troubleshooting

**"User not found"** → User must exist in MongoDB users collection

**"Session not found"** → Use the ADK session ID from POST /chat response

**MongoDB connection error** → `sudo systemctl start mongod`