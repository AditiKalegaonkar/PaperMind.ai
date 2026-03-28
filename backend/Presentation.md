# PaperMind.ai — Competition Presentation Script
### International Level | All Time Slots Covered | Judge Objections Pre-handled

---

> **HOW TO USE THIS SCRIPT**
> - Each section is labelled with a time budget so you can cut or expand based on your slot
> - `[PAUSE]` = stop, make eye contact, let the point land
> - `[SHOW]` = point to your screen / slide
> - Words in `(parentheses)` are delivery notes, not spoken aloud
> - The **"Why not just use ChatGPT?"** section is the most important — memorise it cold

---

## OPENING HOOK
### ⏱ 30 seconds — use this no matter how long your slot is

*"Let me ask you something.*

*Imagine you receive a 40-page rental agreement tomorrow. Or your company sends you a Non-Disclosure Agreement to sign by end of day. Or you get a financial portfolio statement you don't understand.*

*What do you do?*

*Most people sign without reading. Or they pay hundreds of dollars for a professional to explain it. Or they copy-paste it into ChatGPT — and hope the answer is right.*

*[PAUSE]*

*We built PaperMind.ai because none of those options are good enough."*

---

## THE PROBLEM
### ⏱ 45 seconds

*"The world is drowning in documents that ordinary people cannot understand.*

*Over 80% of people globally cannot afford legal representation. 66% of adults lack basic financial literacy. And academic research — the kind that shapes medicine, policy, and technology — is locked behind jargon that even educated people struggle with.*

*This is not a small problem. The AI document processing market alone is projected to reach 18.9 billion dollars by 2027 — because the need is massive and existing solutions are failing ordinary users.*

*[PAUSE]*

*So what does exist today? And why isn't it enough?"*

---

## THE EXISTING SOLUTIONS — AND WHY THEY FAIL
### ⏱ 45 seconds

*"You have tools like ChatPDF — you upload a PDF and ask questions. Simple. But it has no memory between conversations, no domain specialisation, no authentication, no session history. It treats a legal contract and a physics textbook exactly the same way.*

*You have enterprise tools like Kira Systems or Hebbia Matrix — genuinely powerful, but they start at thousands of dollars a month and are built for law firms and hedge funds, not individuals or small organisations.*

*And then you have raw LLMs — ChatGPT, Claude, Gemini. Excellent general models. But they have a critical problem: [PAUSE] they have no access to your specific document unless you paste it in. They can hallucinate legal clauses. They cannot do risk analysis on a contract they haven't been trained to understand. And they have no memory — every conversation starts from zero.*

*[PAUSE]*

*This is the gap PaperMind fills."*

---

## WHAT IS PAPERMIND — ONE CLEAR SENTENCE
### ⏱ 15 seconds

*"PaperMind.ai is a secure, multi-agent AI platform that reads your specific documents and delivers accurate, domain-expert explanations — across legal, financial, and educational content — with full session memory and real-time streaming responses."*

---

## THE CORE TECHNICAL INNOVATION
### ⏱ This is your most important section. Never skip it. ⏱ 2–3 minutes

*(Take a breath. Slow down here. This is where you win or lose the technical judges.)*

*"Now — I know what some of you might be thinking. 'This is just an API wrapper around Gemini. Anyone can do this in an afternoon.'*

*[PAUSE — make eye contact]*

*I want to address that directly, because it is the most important technical distinction in this project.*

*[PAUSE]*

**"ChatGPT and Claude are general-purpose language models. PaperMind is a domain-expert system built on top of one."**

*The difference is the same as asking a random intelligent person to explain your NDA — versus asking a lawyer who has read thousands of NDAs, knows which clauses create risk, knows the legal vocabulary, and remembers everything you discussed last week.*

*Let me show you exactly what we built that makes that difference.*

---

### DIFFERENTIATOR 1: Multi-Agent Architecture with Domain Specialisation

*"When you select the Legal agent in PaperMind, you are not talking to a single LLM. You are activating a coordinated team of four specialised sub-agents — all working in parallel on your document.*

*[SHOW architecture diagram]*

*One agent performs RAG — Retrieval Augmented Generation — on your specific uploaded contract. It does not guess. It reads your document, chunks it into 600-token segments, generates vector embeddings, and retrieves only the top five most relevant passages before answering.*

*A second agent performs risk analysis — it identifies specific clauses in your contract that create legal liability for you.*

*A third agent is a legal dictionary — it catches technical legal terms and explains them in plain English.*

*A fourth agent performs live web search — to find relevant case law or regulation that applies to your situation.*

*[PAUSE]*

*These four agents are orchestrated using Google's Agent Development Kit — not manually with if-else conditions. The orchestrator decides in real-time which sub-agents to invoke based on your query.*

*ChatGPT cannot do this. It has one brain. PaperMind has four lawyers in the room."*

---

### DIFFERENTIATOR 2: Domain-Aware Temperature Scaling

*"Here is something subtle that most document AI tools miss entirely.*

*The confidence level an AI should have depends entirely on the domain.*

*In legal analysis, you want precision. Being wrong about a contract clause has real consequences. So our legal agent runs at temperature 0.5 — tightly controlled, low creative variance.*

*In finance, you want even more conservatism. Our finance agent runs at 0.3.*

*In education, you want clarity and explanation — so temperature 0.7.*

*[PAUSE]*

*This is not a minor setting. Temperature directly controls how much the model deviates from its most confident answer. We spent time calibrating this by domain based on our evaluation results. No generic chatbot does this. ChatGPT uses a single default temperature for everything.*"

---

### DIFFERENTIATOR 3: Measured, Evaluated Results — Not Just Vibes

*"This is where I want to be very direct with the judges.*

*We did not just build the product and say 'it seems to work.' We ran a formal evaluation across four document types — an NDA, a rental agreement, a financial statement, and an education paper.*

*[SHOW results table if possible]*

*Across all four domains, we measured eight metrics: Hit Rate, Mean Reciprocal Rank, BLEU score for answer quality, Flesch Readability, groundedness — meaning answers traceable back to the source document — and hallucination rate, meaning claims the model made that were not supported by the document.*

*Our results:*
*— Retrieval hit rate: 100% across all four domains*
*— BLEU score: between 0.68 and 0.81 — above our target of 0.65*
*— Hallucination rate: between 8% and 15% — finance being the most grounded at 8%*
*— Groundedness: up to 92% in financial documents*

*[PAUSE]*

*We can prove our system works. We did not just submit a demo — we submitted a research evaluation with numbers.*"

---

### DIFFERENTIATOR 4: Hybrid Triple Storage Architecture

*"General LLMs have no memory. Every conversation starts fresh. This is fine for casual chat — it is completely unacceptable for professional document work.*

*PaperMind solves this with a hybrid storage architecture that no single-LLM tool uses.*

*We have three separate storage systems working together:*

*MongoDB stores your user account, your conversation history, and your session IDs — so you can come back days later and continue exactly where you left off.*

*SQLite, through Google ADK, stores the agent's internal conversation state — so within a session, the agent remembers everything it already told you and builds on it.*

*And Qdrant, our vector database, stores the embeddings of your document — indexed by a hash of the file — so if you upload the same contract again, we do not reprocess it. We reuse the cached index instantly.*

*[PAUSE]*

*This is a production-grade architecture. Not a prototype."*

---

### DIFFERENTIATOR 5: Security — PII Redaction Before the LLM Ever Sees Your Data

*"Legal and financial documents contain sensitive personal information. Names, account numbers, social security data, addresses.*

*Before any of your document content reaches the language model, PaperMind runs it through Microsoft Presidio — an enterprise PII detection and redaction engine. Sensitive entities are identified and stripped before the LLM call.*

*[PAUSE]*

*ChatGPT offers no such guarantee. Uploading your employment contract or bank statement to a general-purpose chatbot means that data may be used for model training. PaperMind is designed to be self-hosted — your data never has to leave your infrastructure."*

---

## THE DIRECT ANSWER TO "THIS IS JUST CLAUDE / CHATGPT"
### ⏱ 60 seconds — memorise this cold

*(If a judge says this, do not get defensive. Smile. This is your moment.)*

*"I appreciate that question — and I want to answer it precisely, because it's the right question to ask.*

*Claude and ChatGPT are foundation models. They are trained on general internet data. They are designed to answer anything about everything. That is their strength.*

*PaperMind is a system built on top of a foundation model — the same way Gmail is built on top of the internet. Gmail is not 'just the internet.' It is authentication, storage, search, spam filtering, threading, and a UI — all engineered on top of the internet's infrastructure.*

*PaperMind is:*
*— Multi-agent orchestration coordinating four specialised sub-agents per domain*
*— A RAG pipeline with domain-specific chunking, embedding, and retrieval*
*— A measured, evaluated system with BLEU scores and hallucination rates*
*— A triple-hybrid storage system: MongoDB, SQLite, and Qdrant*
*— A privacy layer with PII redaction before LLM access*
*— A full-stack authenticated application with session memory across visits*

*[PAUSE]*

*If you give Claude or ChatGPT your NDA right now and ask 'what clauses put me at risk?' — it will give you a general answer. If you ask PaperMind, it will retrieve the three specific clauses in your actual document, cross-reference them against known risk patterns in NDAs, explain the legal vocabulary, and remember this conversation when you return tomorrow.*

*That is the difference between a general-purpose model and a purpose-built expert system."*

---

## LIVE DEMO WALKTHROUGH
### ⏱ 90 seconds — practice this until it's under 2 minutes

*(Open the app before you present. Have a real PDF ready — ideally a short NDA or rental agreement.)*

*"Let me show you this in action.*

*[SHOW] I'm logging in — PaperMind supports email-password and Google OAuth.*

*[SHOW] I'll select the Legal agent. Notice the agent selector — this is where the domain specialisation begins.*

*[SHOW] I'm uploading a real NDA — [drag and drop]. The document is now being chunked and embedded by our Qdrant RAG pipeline.*

*[SHOW] I'll ask: 'What clauses in this document create risk for me as the receiving party?'*

*[SHOW — watch the streaming response appear in real-time]*

*Notice three things as this streams:*
*First — the response is appearing in real-time, token by token. This is our Server-Sent Events streaming architecture. Sub-3-second first response.*
*Second — the answer is specific to this document. It is referencing actual clauses, not generic legal advice.*
*Third — if I ask a follow-up question in the same session, the agent remembers what we just discussed.*

*[PAUSE]*

*This is not a demo environment. This is the production application."*

---

## REAL-WORLD IMPACT — MAKE IT HUMAN
### ⏱ 30 seconds

*"I want to leave you with one concrete image.*

*A first-generation university student receives a scholarship agreement in English — a language that is not their first. It is 28 pages. They do not have a lawyer. They cannot afford one. They are afraid to sign something they don't understand. They are afraid not to.*

*PaperMind is free. It is accessible. It reads that document in seconds and explains every clause in plain language. It identifies that one clause that requires them to repay the scholarship if they fail a single module.*

*[PAUSE]*

*That is who we built this for."*

---

## CLOSING — WHAT WE ARE ASKING FOR
### ⏱ 15 seconds

*"PaperMind.ai is a full-stack, evaluated, production-ready AI expert system for legal, financial, and educational documents.*

*We have the architecture. We have the evaluation data. We have a working product.*

*What we are building toward is making expert knowledge accessible to everyone — not just those who can afford it.*

*Thank you."*

---

## Q&A PREPARATION — ANTICIPATED JUDGE QUESTIONS

---

**Q: "Why use Gemini and not a local/open-source model?"**

*"Two reasons. First, speed — Gemini 2.5 Flash gives us sub-3-second first tokens, which is essential for the streaming UX. Second, the system is architecturally model-agnostic. The ADK orchestration layer and the RAG pipeline are decoupled from the LLM provider. Swapping Gemini for an open-source model like Llama or Mistral is a configuration change, not an architectural redesign. For production deployments in regulated environments, we already support self-hosted configurations."*

---

**Q: "What is your accuracy? How do you know it actually works?"**

*"We ran a formal evaluation on four document types using eight metrics. Our RAG retrieval hit rate was 100% across all four domains. Our BLEU score — which measures how close our answers are to reference expert answers — ranged from 0.68 to 0.81, above our stated target of 0.65. Our hallucination rate ranged from 8% in finance to 15% in legal documents. We have the full evaluation report available."*

---

**Q: "Is this scalable? What happens under load?"**

*"Two key design decisions handle scale. First, agent and runner caching — agents are initialised once at server startup and reused across all requests, rather than rebuilt per request. This eliminates cold-start overhead entirely. Second, Qdrant indices are cached by document hash — the same document uploaded by 100 users creates one index, not 100. The application is fully Dockerised and the backend services can be horizontally scaled independently."*

---

**Q: "What about data privacy and GDPR?"**

*"Three layers. First, Microsoft Presidio redacts PII — names, account numbers, addresses — before document content reaches the LLM. Second, the application is fully self-hostable via Docker, so enterprise users can run it entirely within their own infrastructure with no external data transmission. Third, session data is stored in MongoDB with the user's own account, not shared with any third party. We treat user documents as private by design."*

---

**Q: "How is this different from a RAG chatbot I could build in one hour with LangChain?"**

*"A basic RAG chatbot has one retriever and one LLM. It treats every query and every document identically. PaperMind adds five layers on top of that baseline: multi-agent orchestration where specialised sub-agents handle different analytical tasks; domain-calibrated temperature scaling per vertical; a triple storage architecture that persists context across sessions; automatic PII redaction before LLM access; and a formal evaluation pipeline with eight measurable metrics. The one-hour LangChain prototype is a proof-of-concept. PaperMind is a production system."*

---

**Q: "What is your business model / monetisation?"**

*"The current version is open-source and free, targeting individual users and researchers who cannot access expensive enterprise tools. The monetisation roadmap has three tiers: a free tier for individuals, a professional tier for small legal and financial practices, and an enterprise tier for organisations needing self-hosted deployment with SLAs, dedicated support, and custom domain agents. The $18.9 billion document AI market and the cost of alternative solutions — enterprise tools starting at thousands per month — give us significant room to grow."*

---

**Q: "Why four domains? Why not just make it general?"**

*"This is actually the core design insight. A general system gives general answers. The moment you introduce domain specialisation — specific temperature settings, specific chunking strategies, specific sub-agents trained on domain vocabulary — the quality of answers increases measurably. Our evaluation shows a BLEU score of 0.81 for finance documents, which outperforms generic RAG benchmarks precisely because the finance agent uses conservative temperature, domain-specific prompts, and a dedicated portfolio analysis sub-agent. Generality is a feature of foundation models. Specialisation is our feature."*

---

## TIME SLOT QUICK REFERENCE

| Slot | Sections to Include |
|------|-------------------|
| 2–3 min | Opening Hook + One Clear Sentence + Differentiators 1 & 3 only + Direct Answer to "it's just ChatGPT" + Closing |
| 5 min | All of the above + Problem + What Exists Today + Demo (shortened to 60 sec) |
| 10 min | Full script except you can expand demo to 3 minutes |
| 15 min+ | Full script + Q&A prep woven into presentation as pre-emptive answers |

---

## WORDS TO AVOID — REPLACE THESE

| Weak phrasing | Replace with |
|---------------|-------------|
| "basically it's like ChatGPT but..." | "Unlike general-purpose LLMs, PaperMind..." |
| "we just used the Gemini API" | "We built an orchestration layer on top of Gemini that..." |
| "it's a chatbot for documents" | "It is a multi-agent expert system for document analysis" |
| "I think it works well" | "Our evaluation shows a BLEU score of 0.81 and 100% retrieval accuracy" |
| "the AI reads your document" | "Our RAG pipeline chunks, embeds, and retrieves specific passages from your document" |
| "it's similar to..." | "The key difference from [X] is..." |

---

*Good luck. You built something real. Now explain it like you know that.*