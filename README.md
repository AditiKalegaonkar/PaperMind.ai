# PaperMind.ai

PaperMind.ai is a secure full-stack AI platform that processes complex legal documents and delivers human-friendly explanations powered by a multi-agent analytical workflow.

## Quick Links

- **[Project Logic & Research Documentation](./logic.md)** - Comprehensive technical documentation including problem statement, market analysis, comparison with existing solutions, and evidence of usability
- **[Backend API Documentation](./backend/Documentation.md)** - FastAPI backend documentation

## Problem Statement

PaperMind.ai addresses the critical challenge of making complex legal, financial, and educational documents accessible to non-expert users.

### Measurable Objectives

| Objective | Target |
|-----------|--------|
| Document Processing Accuracy | ≥80% retrieval hit rate |
| Answer Quality | ≥0.65 BLEU score |
| Response Time | <3 seconds streaming |
| Test Coverage | 100% pass rate |

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React 19)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │Dashboard │  │ Login/   │  │  User    │  │  Components:     │ │
│  │   Page   │  │ SignUp  │  │Dashboard │  │  Navbar,Footer,  │ │
│  └──────────┘  └──────────┘  └──────────┘  │  DocumentViewer, │ │
│                                            │  FlashcardViewer │ │
│                                            └──────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  NODE.JS EXPRESS PROXY SERVER                   │
│  (Authentication, Session Management, Request Proxying)          │
│  Port: 5000                                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐   ┌─────────────────────────────────┐
│    MONGODB              │   │     PYTHON FASTAPI SERVER       │
│  (User Data, Chat       │   │     (AI Agent Processing)      │
│   History, Sessions)    │   │     Port: 8000                  │
└─────────────────────────┘   └─────────────────────────────────┘
                                          │
                                          ▼
                        ┌───────────────────────────────────────┐
                        │     GOOGLE ADK MULTI-AGENT SYSTEM      │
                        │  ┌───────────┐ ┌───────────┐ ┌─────┐  │
                        │  │   Legal   │ │ Education │ │Finance│ │
                        │  │   Agent   │ │   Agent   │ │Agent │ │
                        │  └───────────┘ └───────────┘ └─────┘  │
                        │        │            │          │        │
                        │        ▼            ▼          ▼        │
                        │  ┌─────────────────────────────┐       │
                        │  │    RAG & TOOL AGENTS        │       │
                        │  │  (Qdrant, Web Search, etc)  │       │
                        │  └─────────────────────────────┘       │
                        └───────────────────────────────────────┘
```

### Project Structure

```
PaperMind.ai/
├── src/                          # React Frontend Source
│   ├── assets/                   # Static assets (images, videos, icons)
│   │   ├── Logo.png
│   │   ├── Background.png
│   │   ├── video.mp4
│   │   ├── *.svg (icons)
│   │   └── *.png (mascots)
│   │
│   ├── Components/               # Reusable React Components
│   │   ├── DocumentViewer.jsx    # PDF/Image document viewer
│   │   ├── FlashcardViewer.jsx  # Flashcard display component
│   │   ├── Footer.jsx           # Site footer
│   │   ├── Navbar.jsx           # Navigation bar
│   │   ├── RiskChart.jsx       # Risk visualization
│   │   ├── ErrorBoundary.jsx   # Error handling
│   │   └── ToastContainer.jsx   # Notifications
│   │
│   ├── Pages/                    # Page Components
│   │   ├── Dashboard.jsx        # Landing page
│   │   ├── Login.jsx           # User login
│   │   ├── SignUp.jsx          # User registration
│   │   ├── UserDashboard.jsx   # Main app dashboard (chat interface)
│   │   ├── About.jsx           # About page
│   │   └── Contacts.jsx        # Contact page
│   │
│   ├── services/                 # Frontend services
│   │   ├── server.js            # Express proxy server
│   │   ├── passport.js          # Authentication config
│   │   └── Database/
│   │       ├── User.js          # Mongoose User model
│   │       └── Chat.js          # Chat data model
│   │
│   ├── test/                     # Test files
│   │   ├── setup.js             # Test configuration
│   │   └── *.test.jsx           # Component tests
│   │
│   ├── App.jsx                  # Main app component
│   ├── main.jsx                 # Entry point
│   └── index.css                # Global styles
│
├── backend/                      # Python Backend
│   └── agents/                  # AI Agent System
│       ├── main.py              # FastAPI server entry point
│       ├── utility/
│       │   └── utils.py         # Utility functions
│       │
│       ├── legal/               # Legal domain agents
│       │   ├── agent.py         # Root legal agent
│       │   ├── rag_agent.py     # Document RAG
│       │   ├── risk_analysis_agent.py
│       │   ├── dictionary_agent.py
│       │   └── webAgent.py
│       │
│       ├── education/           # Education domain agents
│       │   ├── agent.py
│       │   ├── rag_agent.py
│       │   └── flashcard_agent.py
│       │
│       ├── finance/             # Finance domain agents
│       │   ├── agent.py
│       │   ├── portfolio_agent.py
│       │   ├── recommendation_agent.py
│       │   └── market_agent.py
│       │
│       └── tools/               # Shared tools
│           ├── RAG.py
│           ├── QdrantRAG.py
│           ├── tool.py
│           └── prompts.py
│
├── dist/                         # Production build output
├── public/                       # Public static files
├── package.json                 # Node.js dependencies
├── vite.config.js              # Vite configuration
├── vitest.config.js            # Test configuration
├── docker-compose.yml          # Docker orchestration
└── Dockerfile*                  # Docker images
```

## Features

### Frontend Features
- **Landing Page (Dashboard)**: Hero section, agent cards, feature showcase, CTA
- **User Authentication**: Email/password login + Google OAuth 2.0
- **User Dashboard**: 
  - Chat interface with streaming responses
  - Multi-domain agent selection (Legal, Education, Finance, General)
  - File upload (drag & drop support)
  - Session management (create, rename, delete)
  - Document viewer with PDF support
  - Flashcard generation and display
- **Responsive Design**: Mobile-friendly with adaptive layouts

### Backend Features
- **Multi-Agent AI System**: 
  - Legal Document Analysis (RAG, Risk Analysis, Dictionary)
  - Education Assistant (Flashcards, Tutoring)
  - Finance Advisor (Portfolio Analysis, Recommendations)
- **Session Management**: MongoDB-based chat history
- **File Processing**: PDF, DOC, DOCX, TXT, Images
- **Streaming Responses**: Server-Sent Events (SSE)
- **RESTful API**: FastAPI-based endpoints

## Color Palette

The application uses a consistent color scheme:

| Color Name      | Hex Code  | Usage                          |
|-----------------|-----------|--------------------------------|
| Primary         | #525FE1   | Main text, buttons, accents   |
| Primary Light   | #A29BFE   | Hover states, secondary       |
| Primary Dark    | #3A4499   | Active states                  |
| Accent          | #F86F03   | CTAs, highlights              |
| Accent Light    | #FFA41B   | Secondary accents             |
| Background      | #F5F6FF   | Page backgrounds              |
| Surface         | #FFFFFF   | Card backgrounds              |
| Surface 2       | #EEF0FF   | Input backgrounds             |
| Error           | #D63031   | Error messages                |

## Icons & Assets

### SVG Icons
- `search.svg` - Semantic search feature
- `robot.svg` - AI/Multi-agent system
- `article.svg` - RAG technology
- `lock.svg` - Security/Session memory

### Image Assets
- `Logo.png` - Application logo
- `Background.png` - Login/Signup background
- `video.mp4` - Hero animation
- `legaldocs.png` - Legal agent mascot
- `edudoc.png` - Education agent mascot
- `financialdocs.png` - Finance agent mascot
- `other.png` - General agent mascot
- `google-logo.png` - Google OAuth button

## API Endpoints

### Authentication (Express - Port 5000)
```
GET  /auth/google              # Google OAuth initiation
GET  /auth/google/callback     # OAuth callback
POST /auth/register           # User registration
POST /auth/login              # User login
GET  /auth/user               # Get current user
GET  /auth/logout             # User logout
```

### Chat API (Express Proxy → FastAPI)
```
POST /api/chat                # Send message (with streaming)
GET  /api/sessions            # Get all chat sessions
GET  /api/chat/:sessionId     # Get session messages
PATCH /api/chat/:sessionId/rename  # Rename session
DELETE /api/chat/:sessionId   # Delete session
```

### Health Check
```
GET /health                   # Server health status
```

### FastAPI Backend (Port 8000)
```
POST /chat                    # Agent chat processing
GET  /health                  # FastAPI health
GET  /sessions/:username      # Get user sessions
GET  /chat/:username/:sessionId  # Get chat history
PATCH /chat/:username/:sessionId/rename
DELETE /chat/:username/:sessionId
```

## Setup Instructions

### Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB (local or Atlas)
- Google Cloud credentials (for OAuth + Gemini API)

### Environment Variables

Create `.env` file in project root:

```bash
# Frontend/Node.js
GOOGLE_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK=/auth/google/callback
PORT=5000
FRONTEND_URL=http://localhost:5173
SESSION_SECRET=your-secret-key
MONGO_URI=mongodb://localhost:27017/papermind

# Backend (Python)
GOOGLE_API_KEY=
GOOGLE_GENAI_USE_VERTEXAI=FALSE
MONGODB_URL=mongodb://localhost:27017
```

### Installation

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
pip install -r requirements.txt

# Build frontend
npm run build
```

### Running the Application

#### Development Mode
```bash
# Start frontend (Vite)
npm run dev

# Start backend (Express proxy)
npm run dev:backend

# Start FastAPI server (separate terminal)
cd backend/agents
python main.py
```

#### Production Mode
```bash
# Build frontend
npm run build

# Start production server
npm start
```

#### Docker
```bash
docker-compose up --build
```

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run unit tests
npm run test:unit
```

## Research & Evaluation

The `research-paper/` directory contains:

- `main.py` - Evaluation script testing all domains
- `domainAwareRAG.py` - Domain-specific RAG implementation
- `prompts.py` - Domain-specific prompt templates
- `Knowledge-Base/` - Test documents (NDA, Rental Agreement, Finance Statement, Education Paper)

### Evaluation Metrics

| Metric | Description |
|--------|-------------|
| Hit Rate | Retrieval accuracy |
| MRR | Ranking quality |
| BLEU | Answer quality vs reference |
| Readability | Flesch Reading Ease |
| Groundedness | Source citation rate |
| Hallucination | Unfounded claim rate |

## License

MIT License © 2025 PaperMind.ai Team
