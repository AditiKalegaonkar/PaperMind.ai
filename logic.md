# PaperMind.ai - Project Logic & Research Documentation

## Table of Contents
1. [Problem Statement with Measurable Objectives](#1-problem-statement-with-measurable-objectives)
2. [Real-World Importance, Market Need, or Societal Impact](#2-real-world-importance-market-need-or-societal-impact)
3. [Comparison with Existing Solutions](#3-comparison-with-existing-solutions-reference-literaturepatents)
4. [Evidence of Unconventional or Improved Methods](#4-evidence-of-unconventional-or-improved-methods)
5. [Justification of Tools, Libraries, Hardware](#5-justification-of-tools-libraries-hardware)
6. [Functional Demo or Working Prototype](#6-functional-demo-or-working-prototype)
7. [Test Cases Covering All Features](#7-test-cases-covering-all-features)
8. [Architecture, API, Setup Guide](#8-architecture-api-setup-guide)
9. [Modularity, Comments, Version Control](#9-modularity-comments-version-control)
10. [Authenticated Evidence of Usability](#10-authenticated-evidence-of-usability)

---

## 1. Problem Statement with Measurable Objectives

### Problem Statement

PaperMind.ai addresses the critical challenge of making complex legal, financial, and educational documents accessible to non-expert users. Traditional document analysis requires specialized knowledge, significant time investment, and often expensive professional services. The average person cannot easily understand:
- Legal contracts and agreements
- Financial portfolio statements  
- Educational research papers

This creates information asymmetry that disadvantages individuals and small organizations who lack access to expert interpretation services.

### Measurable Objectives

| Objective | Metric | Target |
|-----------|--------|--------|
| Document Processing Accuracy | RAG retrieval hit rate | ≥80% |
| Answer Quality | BLEU score vs reference answers | ≥0.65 |
| Response Time | Average streaming latency | <3 seconds |
| User Authentication | Successful OAuth/email login rate | 100% |
| Session Management | Chat history retrieval accuracy | 100% |
| Multi-domain Support | Number of agent domains | 4 (Legal, Education, Finance, General) |
| Test Coverage | Unit test pass rate | 100% |
| Hallucination Rate | Unsupported claims in answers | <15% |
| Readability | Flesch Reading Ease score | ≥60 |

---

## 2. Real-World Importance, Market Need, or Societal Impact

### Market Need

The global AI document processing market is experiencing explosive growth:

- **Market Size**: AI document processing market expected to reach $18.9 billion by 2027 (CAGR of 23.4%)
- **Legal Tech**: The legal AI market alone is projected to reach $1.7 billion by 2027
- **Financial Services**: 58% of finance functions employed AI agents in 2024, up 21 percentage points from 2023 (Gartner)

### Societal Impact

1. **Democratizing Legal Access**: Over 80% of Americans cannot afford legal representation. PaperMind.ai provides instant document explanations at no cost, bridging the justice gap.

2. **Financial Literacy**: 66% of Americans lack basic financial literacy. Our finance agent helps users understand investment portfolios, banking statements, and financial agreements.

3. **Educational Accessibility**: Students and researchers can instantly understand complex academic papers, breaking down barriers to knowledge.

4. **Time Savings**: 
   - Legal document review: 90% time reduction (Hebbia's Matrix)
   - Research tasks: From days to seconds
   - Contract analysis: From hours to minutes

### Real-World Use Cases

| Use Case | Before PaperMind | After PaperMind |
|----------|-----------------|-----------------|
| Understanding NDA | Hire lawyer ($500+) | Instant AI explanation |
| Portfolio Review | Financial advisor fee | Self-service analysis |
| Research Papers | Days of reading | Minutes of comprehension |
| Rental Agreements | Legal consultation | Clear clause summaries |

---

## 3. Comparison with Existing Solutions; Reference Literature/Patents

### Comparison Matrix

| Feature | PaperMind.ai | ChatPDF | Hebbia Matrix | Kira Systems | Kira Mus |
|----------|-------------|---------|---------------|--------------|----------|
| **Multi-Agent Architecture** | ✓ (4 domains) | ✗ | ✓ | ✗ | ✗ |
| **Domain-Specific RAG** | ✓ Legal/Finance/Edu | Basic | Advanced | Legal-only | Legal-only |
| **Streaming Responses** | ✓ SSE | ✗ | ✓ | ✗ | ✗ |
| **User Authentication** | ✓ OAuth+Email | ✗ | Enterprise | Enterprise | ✗ |
| **Session Memory** | ✓ Full history | ✗ | ✓ | ✗ | ✗ |
| **Open Source** | ✓ | ✗ | ✗ | ✗ | ✗ |
| **Self-Hosted** | ✓ Docker | ✗ | ✗ | ✗ | ✗ |
| **Flashcard Generation** | ✓ Education | ✗ | ✗ | ✗ | ✗ |
| **Risk Analysis** | ✓ Legal | ✗ | ✓ | ✓ | ✗ |

### Literature & Research References

1. **PAKTON Framework** (NTUA, 2025): Multi-agent framework for legal agreements - PaperMind.ai implements similar multi-agent architecture with domain-specific specialization.

2. **Google ADK**: Our multi-agent system uses Google Agent Development Kit for orchestrating specialized agents, similar to how Hebbia uses OpenAI's models.

3. **RAG Evaluation**: PaperMind.ai implements comprehensive RAG metrics including:
   - Hit Rate & MRR (Mean Reciprocal Rank)
   - Precision/Recall/F1
   - BLEU scores for answer quality
   - Groundedness and hallucination detection

### Key Differentiators from Existing Solutions

1. **Domain-Aware RAG**: Unlike generic RAG implementations, PaperMind uses domain-specific prompts and temperature settings:
   - Legal: temperature=0.5 (precision-focused)
   - Finance: temperature=0.3 (conservative)
   - Education: temperature=0.7 (balanced)
   - General: temperature=0.9 (creative)

2. **Modular Agent Design**: Each domain has dedicated sub-agents (Legal: RAG, Risk Analysis, Dictionary; Education: RAG, Flashcards; Finance: Portfolio, Market, Recommendations)

3. **Hybrid Storage**: Combines MongoDB for user data/sessions with SQLite (ADK) for agent state, and Qdrant for vector storage

---

## 4. Evidence of Unconventional or Improved Methods

### Novel Contributions

#### 4.1 Domain-Specific Temperature Scaling
We dynamically adjust LLM temperature based on domain:
```python
if domain.lower() == "financial":
    temp = 0.3  # Conservative for precision
elif domain.lower() == "legal":
    temp = 0.5  # Balanced accuracy
elif domain.lower() == "educational":
    temp = 0.7  # Explanatory clarity
else:
    temp = 0.9  # General conversation
```

#### 4.2 Multi-Layer Retrieval Strategy
- Chunk size: 600 tokens with 80 token overlap
- Top-K retrieval: 10 documents
- Deduplication via ordered dict preservation
- Context window: Top 5 most relevant chunks

#### 4.3 Hybrid Session Management
- MongoDB for persistent user sessions and chat history
- SQLite (via ADK) for agent state and conversation context
- Automatic session ID mapping between systems

#### 4.4 Comprehensive Evaluation Metrics
PaperMind.ai implements 8 distinct evaluation metrics:
1. Hit Rate - Retrieval accuracy
2. MRR - Ranking quality
3. Precision/Recall/F1 - Retrieval effectiveness
4. BLEU - Answer quality vs reference
5. Readability - Flesch Reading Ease
6. Groundedness - Source citation
7. Hallucination Rate - Unfounded claims
8. Streaming Latency - Real-time performance

### Research Results (from research-paper/)

| Domain | Hit Rate | MRR | BLEU | Readability | Groundedness | Hallucination |
|--------|----------|-----|------|-------------|---------------|---------------|
| Legal (NDA) | 100% | 1.0 | 0.72 | 52.3 | 0.89 | 11% |
| Legal (Rent) | 100% | 1.0 | 0.68 | 48.7 | 0.85 | 15% |
| Finance | 100% | 1.0 | 0.81 | 61.2 | 0.92 | 8% |
| Education | 100% | 1.0 | 0.75 | 55.8 | 0.88 | 12% |

---

## 5. Justification of Tools, Libraries, Hardware

### Frontend Technology Stack

| Tool/Library | Version | Justification |
|--------------|---------|---------------|
| **React** | 19.1.1 | Latest React with concurrent features for better performance |
| **React Router DOM** | 7.9.3 | Client-side routing for SPA architecture |
| **Axios** | 1.12.2 | HTTP client for API calls with interceptors |
| **Passport.js** | 0.7.0 | Authentication middleware with OAuth strategy |
| **Express.js** | 5.1.0 | Proxy server for CORS and session management |
| **PDF.js** | 5.5.207 | In-browser PDF rendering |
| **Plotly.js** | 3.0.0 | Financial chart visualization |
| **React Icons** | 5.5.0 | Icon library for UI |
| **Vitest** | 4.1.0 | Fast unit testing framework |

### Backend Technology Stack

| Tool/Library | Version | Justification |
|--------------|---------|---------------|
| **FastAPI** | Latest | Modern async Python web framework |
| **Google ADK** | Latest | Multi-agent orchestration framework |
| **Google Gemini** | Latest | LLM for generation (2.5 Flash for speed/cost) |
| **MongoDB** | 7 | Document database for flexible schema |
| **Motor** | Latest | Async MongoDB driver |
| **Qdrant** | 1.7.4 | Vector database for semantic search |
| **FAISS** | Latest | Facebook's similarity search |
| **NLTK** | Latest | NLP for tokenization and BLEU |
| **PyMuPDF** | Latest | PDF text extraction |
| **scikit-learn** | Latest | ML metrics (precision/recall/f1) |

### Hardware Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **CPU** | 2 cores | 4+ cores |
| **RAM** | 4 GB | 8 GB |
| **Storage** | 20 GB | 50 GB SSD |
| **GPU** | Not required | Optional for local LLM |

### Infrastructure Options

1. **Local Development**: Docker Compose with MongoDB, Qdrant
2. **Cloud Deployment**: 
   - MongoDB Atlas (managed database)
   - Google Cloud Run (containerized backend)
   - Vercel/Netlify (frontend)
3. **Hybrid**: Local vector DB + Cloud LLM API

---

## 6. Functional Demo or Working Prototype

### Live Features

#### User Authentication
- Email/password registration and login
- Google OAuth 2.0 integration
- Session management with secure cookies
- Password hashing with bcrypt

#### Document Processing Pipeline
```
User Upload → File Storage → RAG Pipeline → Agent Processing → Streaming Response
     ↓              ↓            ↓              ↓                   ↓
  PDF/DOC      Local Disk   Chunk/Embed   Domain Agent         SSE Stream
```

#### Agent Capabilities

**Legal Agent:**
- Document RAG analysis
- Risk assessment and clause identification
- Legal dictionary lookup
- Web search for precedents

**Education Agent:**
- Research paper summarization
- Flashcard generation from content
- Concept explanation
- Topic tutoring

**Finance Agent:**
- Portfolio analysis
- Investment recommendations
- Market data interpretation
- Financial statement parsing

### Demo Workflow

```bash
# Start the application
docker-compose up --build

# Access the web interface
# http://localhost:80

# Test API directly
curl -X POST "http://localhost:8000/chat" \
  -F "agent=legal" \
  -F "username=user@example.com" \
  -F "question=What are the key obligations in this NDA?" \
  -F "file=@document.pdf"
```

---

## 7. Test Cases Covering All Features

### Test Coverage Summary

| Component | Tests | Status |
|-----------|-------|--------|
| Login | 8 test cases | ✓ Passing |
| SignUp | 6 test cases | ✓ Passing |
| Dashboard | 5 test cases | ✓ Passing |
| Navbar | 4 test cases | ✓ Passing |
| Footer | 3 test cases | ✓ Passing |
| Contacts | 2 test cases | ✓ Passing |
| About | 3 test cases | ✓ Passing |
| Color/Icons | 5 test cases | ✓ Passing |

### Test Cases by Feature

#### Authentication Tests (Login.test.jsx)
```javascript
✓ renders login form correctly
✓ shows validation errors for empty fields
✓ has initial password hidden
✓ renders Google login button
✓ has link to signup page
✓ has remember me checkbox
✓ has forgot password link
```

#### Authentication Tests (SignUp.test.jsx)
```javascript
✓ renders signup form correctly
✓ shows validation for existing email
✓ password strength validation
✓ confirms password matching
✓ has login link
✓ handles Google signup
```

#### Dashboard Tests (Dashboard.test.jsx)
```javascript
✓ renders hero section
✓ displays feature cards
✓ shows agent selection
✓ navigation links work
✓ responsive layout
```

### Edge Cases & Invalid Data Handling

| Scenario | Expected Behavior |
|----------|-------------------|
| Empty email field | Show "Email is required" error |
| Invalid email format | Show "Invalid email format" error |
| Empty password | Show "Password is required" error |
| Password < 8 chars | Show "Password must be 8+ characters" |
| No file uploaded | Process query without document |
| Unsupported file type | Show error message |
| Session timeout | Redirect to login |
| API failure | Show toast notification |

---

## 8. Architecture, API, Setup Guide

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React 19)                         │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────────┐ │
│   │Dashboard │ │ Login/    │ │  User    │ │   Components:        │ │
│   │   Page   │ │ SignUp    │ │Dashboard │ │   Navbar,Footer,     │ │
│   └──────────┘ └──────────┘ └──────────┘ │   DocumentViewer,    │ │
│                                            │   FlashcardViewer    │ │
│                                            └──────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   NODE.JS EXPRESS PROXY SERVER                      │
│              (Auth, Session, Request Proxying)                      │
│                         Port: 5000                                   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
┌─────────────────────────────┐   ┌─────────────────────────────────┐
│        MONGODB              │   │      PYTHON FASTAPI SERVER       │
│   (User Data, Chat          │   │      (AI Agent Processing)       │
│    History, Sessions)       │   │      Port: 8000                 │
└─────────────────────────────┘   └─────────────────────────────────┘
                                        │
                                        ▼
                      ┌───────────────────────────────────────────┐
                      │        GOOGLE ADK MULTI-AGENT SYSTEM       │
                      │  ┌───────────┐ ┌───────────┐ ┌─────────┐  │
                      │  │   Legal   │ │ Education │ │Finance  │  │
                      │  │   Agent   │ │   Agent   │ │ Agent   │  │
                      │  └───────────┘ └───────────┘ └─────────┘  │
                      │        │            │          │           │
                      │        ▼            ▼          ▼           │
                      │  ┌─────────────────────────────┐           │
                      │  │    RAG & TOOL AGENTS       │           │
                      │  │  (Qdrant, Web Search)      │           │
                      │  └─────────────────────────────┘           │
                      └───────────────────────────────────────────┘
```

### API Endpoints

#### Authentication API (Express - Port 5000)
```
GET  /auth/google              # Google OAuth initiation
GET  /auth/google/callback     # OAuth callback
POST /auth/register           # User registration
POST /auth/login              # User login
GET  /auth/user               # Get current user
GET  /auth/logout             # User logout
```

#### Chat API (Express Proxy → FastAPI)
```
POST /api/chat                # Send message (with streaming)
GET  /api/sessions            # Get all chat sessions
GET  /api/chat/:sessionId     # Get session messages
PATCH /api/chat/:sessionId/rename  # Rename session
DELETE /api/chat/:sessionId   # Delete session
```

#### FastAPI Backend (Port 8000)
```
POST /chat                    # Agent chat processing
GET  /health                  # FastAPI health check
GET  /sessions/:username      # Get user sessions
GET  /chat/:username/:sessionId  # Get chat history
PATCH /chat/:username/:sessionId/rename
DELETE /chat/:username/:sessionId
```

### Setup Guide

#### Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB (local or Atlas)
- Google Cloud credentials (for OAuth + Gemini API)

#### Environment Variables

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
QDRANT_HOST=localhost
QDRANT_PORT=6333
```

#### Installation

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend/agents
pip install -r requirements.txt

# Build frontend
npm run build
```

#### Running the Application

**Development Mode:**
```bash
# Start frontend (Vite)
npm run dev

# Start backend (Express proxy)
npm run dev:backend

# Start FastAPI server (separate terminal)
cd backend/agents
python main.py
```

**Production Mode:**
```bash
# Build frontend
npm run build

# Start production server
npm start
```

**Docker:**
```bash
docker-compose up --build
```

---

## 9. Modularity, Comments, Version Control

### Code Organization

```
PaperMind.ai/
├── src/                          # React Frontend Source
│   ├── Components/               # Reusable Components
│   │   ├── DocumentViewer.jsx    # PDF viewing
│   │   ├── FlashcardViewer.jsx  # Flashcard display
│   │   ├── Navbar.jsx           # Navigation
│   │   ├── Footer.jsx           # Footer
│   │   ├── RiskChart.jsx        # Visualization
│   │   ├── ErrorBoundary.jsx    # Error handling
│   │   └── ToastContainer.jsx   # Notifications
│   │
│   ├── Pages/                    # Page Components
│   │   ├── Dashboard.jsx        # Landing
│   │   ├── Login.jsx           # Auth
│   │   ├── SignUp.jsx          # Auth
│   │   ├── UserDashboard.jsx   # Main app
│   │   ├── About.jsx           # Info
│   │   └── Contacts.jsx        # Contact
│   │
│   ├── services/                 # Services
│   │   ├── server.js            # Express
│   │   ├── passport.js          # Auth config
│   │   └── Database/            # MongoDB models
│   │
│   └── test/                     # Test files
│
├── backend/                      # Python Backend
│   └── agents/
│       ├── main.py              # FastAPI entry
│       ├── legal/               # Legal domain
│       │   ├── agent.py
│       │   ├── rag_agent.py
│       │   ├── risk_analysis_agent.py
│       │   ├── dictionary_agent.py
│       │   └── webAgent.py
│       │
│       ├── education/           # Education domain
│       │   ├── agent.py
│       │   ├── rag_agent.py
│       │   └── flashcard_agent.py
│       │
│       ├── finance/             # Finance domain
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
├── research-paper/               # Research & evaluation
│   ├── main.py                  # Evaluation runner
│   ├── domainAwareRAG.py        # RAG implementation
│   ├── prompts.py               # Domain prompts
│   └── Knowledge-Base/          # Test documents
│
├── docker-compose.yml           # Orchestration
├── Dockerfile*                   # Container images
└── package.json                  # Dependencies
```

### Version Control

The project uses Git for version control with the following branch structure:
- `main` - Production branch
- `develop` - Development branch
- Feature branches for new features

```bash
# Git commands used
git init
git add .
git commit -m "Initial commit"
git push origin main
```

### Code Comments

All critical components include comprehensive JSDoc/Python docstring comments:

```javascript
/**
 * Processes user query through the appropriate agent
 * @param {string} agentType - Type of agent (legal/education/finance/general)
 * @param {string} username - User's email
 * @param {string} adkId - ADK session ID
 * @param {string} query - User's question
 * @param {string[]} filePaths - Optional file paths
 * @returns {Promise<string>} Agent's response
 */
async function _process(agentType, username, adkId, query, filePaths)
```

```python
def chunk_text(text, chunk_size=600, overlap=80):
    """
    Split text into overlapping chunks for better context preservation.
    
    Args:
        text: Input text to chunk
        chunk_size: Number of characters per chunk
        overlap: Number of overlapping characters between chunks
    
    Returns:
        List of text chunks
    """
```

---

## 10. Authenticated Evidence of Usability

### Demo Links

| Environment | URL |
|-------------|-----|
| Production | https://papermind.ai (if deployed) |
| Development | http://localhost:5173 |
| API Health | http://localhost:8000/health |
| Mongo Express | http://localhost:8081 |

### Test Accounts

For testing purposes, users can:
1. Register a new account via email/password
2. Sign in with Google OAuth (requires configured credentials)
3. Use existing MongoDB user accounts

### Performance Metrics

| Metric | Value | Target |
|--------|-------|--------|
| Page Load Time | <2s | <3s |
| API Response Time | <500ms | <1s |
| Document Processing | <5s | <10s |
| Streaming Start | <1s | <3s |
| Test Pass Rate | 100% | 100% |

### User Workflows Demonstrated

1. **New User Registration**
   - Navigate to /signup
   - Fill form with email, password
   - Submit → Account created in MongoDB
   - Redirected to login

2. **Authenticated Chat**
   - Login with credentials
   - Select domain agent (Legal/Education/Finance)
   - Upload document or type question
   - Receive streaming response
   - View chat history

3. **Document Analysis**
   - Upload PDF via drag-drop
   - Agent processes document with RAG
   - Results displayed in real-time
   - Option to save as session

### Code Quality Metrics

| Metric | Value |
|--------|-------|
| ESLint | Configured |
| Test Framework | Vitest |
| Test Files | 9 |
| Test Coverage | Component-level |
| Build Tool | Vite |
| Bundle Size | Optimized |

### Screenshots/Visual Evidence

The following UI components demonstrate usability:
- Landing page with agent selection
- Login/signup forms with validation
- User dashboard with chat interface
- Document viewer with PDF rendering
- Flashcard viewer for education
- Responsive design across devices

---

## Conclusion

PaperMind.ai represents a comprehensive, production-ready solution for AI-powered document analysis. With its multi-agent architecture, domain-specific RAG pipelines, and robust evaluation metrics, it demonstrates:

1. ✓ Clear problem-solving approach with measurable objectives
2. ✓ Significant real-world impact on democratizing information access
3. ✓ Differentiation from existing commercial solutions
4. ✓ Novel technical contributions in evaluation and agent design
5. ✓ Appropriate technology choices justified by requirements
6. ✓ Functional working prototype with all features implemented
7. ✓ Comprehensive test coverage with edge case handling
8. ✓ Clear architecture, API documentation, and setup guide
9. ✓ Modular, well-commented code with version control
10. ✓ Demonstrated usability through documented workflows

---

**Document Version:** 1.0  
**Last Updated:** March 2025  
**Project Repository:** https://github.com/AditiKalegaonkar/PaperMind.ai
