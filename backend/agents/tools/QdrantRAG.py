import os
import hashlib
import re
from dotenv import load_dotenv

load_dotenv()
google_api_key = os.getenv("GOOGLE_API_KEY")
if google_api_key:
    os.environ["GOOGLE_API_KEY"] = google_api_key
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

# Collection prefix shared across all document collections
_COLLECTION_PREFIX = "papermind_docs"

# ── Lazy globals ──────────────────────────────────────────────────────────────
_qdrant_client = None
_pii_analyzer = None
_pii_anonymizer = None
_PII_ENTITIES: list = []


# ── PII engine ────────────────────────────────────────────────────────────────

def _init_pii():
    """Lazy-initialise Presidio once."""
    global _pii_analyzer, _pii_anonymizer, _PII_ENTITIES
    if _pii_analyzer is not None:
        return
    try:
        from presidio_analyzer import AnalyzerEngine, Pattern as _P, PatternRecognizer
        from presidio_anonymizer import AnonymizerEngine
        from presidio_analyzer.nlp_engine import NlpEngineProvider

        _provider = NlpEngineProvider(nlp_configuration={
            "nlp_engine_name": "spacy",
            "models": [{"lang_code": "en", "model_name": "en_core_web_sm"}],
        })
        _pii_analyzer = AnalyzerEngine(nlp_engine=_provider.create_engine())
        _pii_anonymizer = AnonymizerEngine()

        for _entity, _name, _regex, _score in [
            ("CASE_NUMBER",     "case_number",
             r"\b(case|c\.?no\.?|docket)\s*[:\-]?\s*[A-Z0-9\-\/]+\b", 0.6),
            ("CONTRACT_NUMBER", "contract_number",
             r"\b(contract|policy)\s*(no|number)?\s*[:\-]?\s*[A-Z0-9\-\/]{5,}\b", 0.6),
            ("STUDENT_ID",      "student_id",
             r"\b(student|roll|registration)\s*(id|no|number)?\s*[:\-]?\s*[A-Z0-9\-]{4,}\b", 0.6),
            ("SALARY",          "salary",
             r"\b(salary|compensation|ctc|pay|wage)\s*[:\-]?\s*(\$|₹|€)?\s?\d[\d,]*(\.\d+)?\b", 0.55),
            ("TRANSACTION_ID",  "transaction_id",
             r"\b(transaction|txn|reference)\s*(id|no|number)?\s*[:\-]?\s*[A-Z0-9\-]{6,}\b", 0.6),
        ]:
            _pii_analyzer.registry.add_recognizer(
                PatternRecognizer(
                    supported_entity=_entity,
                    patterns=[_P(_name, _regex, _score)],
                )
            )

        _PII_ENTITIES = [
            "PERSON", "NRP", "PHONE_NUMBER", "EMAIL_ADDRESS", "LOCATION",
            "CREDIT_CARD", "IBAN_CODE", "BANK_ACCOUNT", "CRYPTO", "US_SSN",
            "MEDICAL_LICENSE", "DATE_TIME", "URL",
            "CASE_NUMBER", "CONTRACT_NUMBER", "STUDENT_ID", "SALARY", "TRANSACTION_ID",
        ]
        print("PII engine initialized (QdrantRAG.py)")
    except Exception as e:
        print(f"PII engine init failed (QdrantRAG.py): {e}")


def redact_pii(text) -> str:
    _init_pii()
    text = str(text)
    if _pii_analyzer is None or _pii_anonymizer is None:
        return text
    try:
        results = _pii_analyzer.analyze(text=text, entities=_PII_ENTITIES, language="en")
        return _pii_anonymizer.anonymize(text=text, analyzer_results=results).text
    except Exception:
        return text


# ── Qdrant client ─────────────────────────────────────────────────────────────

def _init_qdrant():
    """
    Lazy-initialise the Qdrant client.

    RCA of the original "not working without API key" issue
    --------------------------------------------------------
    The original code correctly skipped passing `api_key` when it was falsy,
    so the API key was always optional at the code level.  The real failure
    mode was a *connection error* (Qdrant not running / wrong host/port) being
    swallowed silently by `except Exception: qdrant_client = None`.  This
    looked like an auth problem because the client was None and the fallback
    triggered, but the root cause was connectivity, not authentication.

    Fix: log the exception type and message so operators can distinguish
    "connection refused" from "401 Unauthorized" immediately.
    """
    global _qdrant_client
    if _qdrant_client is not None:
        return _qdrant_client

    host = os.getenv("QDRANT_HOST", "localhost")
    port = int(os.getenv("QDRANT_PORT", "6333"))
    api_key = os.getenv("QDRANT_API_KEY") or None  # None if empty string

    try:
        from qdrant_client import QdrantClient
        from qdrant_client.models import Distance, VectorParams

        # api_key is genuinely optional — Qdrant runs without auth by default.
        connect_kwargs = {"host": host, "port": port}
        if api_key:
            connect_kwargs["api_key"] = api_key

        client = QdrantClient(**connect_kwargs)

        # Health-check: list collections to verify the connection is live.
        # This is the step that was missing — without it the client object
        # exists but every subsequent call would fail.
        client.get_collections()

        _qdrant_client = client
        print(f"Connected to Qdrant at {host}:{port} (auth={'yes' if api_key else 'no'})")
    except Exception as e:
        # Log the real error class so operators can distinguish auth vs
        # connectivity vs version-mismatch issues.
        print(
            f"Qdrant connection failed [{type(e).__name__}]: {e}. "
            "Will fall back to FAISS for all requests."
        )
        _qdrant_client = None

    return _qdrant_client


# ── Helpers ───────────────────────────────────────────────────────────────────

def _doc_hash(path: str) -> str:
    """Full SHA-256 of file bytes."""
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for block in iter(lambda: f.read(65536), b""):
            h.update(block)
    return h.hexdigest()


def _collection_name(path: str) -> str:
    """Human-readable, Qdrant-safe collection name: prefix_basename_hash."""
    base = re.sub(r"[^a-zA-Z0-9_\-]", "_", os.path.basename(path))[:40]
    return f"{_COLLECTION_PREFIX}_{base}_{_doc_hash(path)}"


def _load_and_chunk(path: str):
    from langchain_community.document_loaders import PyMuPDFLoader
    from langchain_text_splitters import RecursiveCharacterTextSplitter

    docs = PyMuPDFLoader(file_path=path).load()
    for d in docs:
        d.page_content = redact_pii(str(d.page_content))
    return RecursiveCharacterTextSplitter(
        chunk_size=2000, chunk_overlap=200
    ).split_documents(docs)


def _deduplicate_docs(docs, threshold: float = 0.95) -> list:
    """Remove near-duplicate chunks by Jaccard similarity on token sets."""
    seen: list = []
    result: list = []
    for doc in docs:
        tokens = set(doc.page_content.lower().split())
        duplicate = False
        for seen_tokens in seen:
            if not tokens or not seen_tokens:
                continue
            jaccard = len(tokens & seen_tokens) / len(tokens | seen_tokens)
            if jaccard >= threshold:
                duplicate = True
                break
        if not duplicate:
            seen.append(tokens)
            result.append(doc)
    return result


def _get_or_build_qdrant_index(path: str, embeddings):
    """Return a Qdrant vectorstore for *path*, building it if not cached."""
    from qdrant_client.models import Distance, VectorParams
    from langchain_community.vectorstores import Qdrant

    coll = _collection_name(path)

    try:
        _qdrant_client.get_collection(coll)
        count = _qdrant_client.count(coll)
        if count and count.value > 0:
            return Qdrant(
                client=_qdrant_client,
                collection_name=coll,
                embeddings=embeddings,
            )
    except Exception:
        pass

    # Create collection and index document
    try:
        _qdrant_client.delete_collection(coll)
    except Exception:
        pass

    _qdrant_client.create_collection(
        collection_name=coll,
        vectors_config=VectorParams(size=768, distance=Distance.COSINE),
    )

    chunks = _load_and_chunk(path)
    texts = [d.page_content for d in chunks]
    metadatas = [{"source": path, "chunk_id": i} for i in range(len(chunks))]

    Qdrant.from_texts(
        client=_qdrant_client,
        collection_name=coll,
        texts=texts,
        embedding=embeddings,
        metadatas=metadatas,
    )

    return Qdrant(
        client=_qdrant_client,
        collection_name=coll,
        embeddings=embeddings,
    )

import json
import re

def redact_pii_safe(text: str) -> str:
    """
    Redact PII from text while preserving valid JSON arrays.
    """

    def find_json_arrays(s):
        positions = []
        stack = []
        in_string = False
        escape = False

        for i, ch in enumerate(s):
            if ch == '"' and not escape:
                in_string = not in_string
            elif ch == '\\' and in_string:
                escape = not escape
                continue
            else:
                escape = False

            if in_string:
                continue

            if ch == '[':
                stack.append(i)
            elif ch == ']' and stack:
                start = stack.pop()
                if not stack:  # top-level candidate
                    candidate = s[start:i+1]
                    try:
                        parsed = json.loads(candidate)
                        if isinstance(parsed, list):
                            positions.append((start, i+1))
                    except:
                        pass

        return positions

    arrays = find_json_arrays(text)

    if not arrays:
        return redact_pii(text)

    result = []
    last = 0

    for start, end in arrays:
        # redact before
        result.append(redact_pii(text[last:start]))
        # keep JSON intact
        result.append(text[start:end])
        last = end

    # redact remaining
    result.append(redact_pii(text[last:]))

    return ''.join(result)

# ── Public entry point ────────────────────────────────────────────────────────

def run_qdrant_rag(user_path: str, question: str) -> str:
    """
    Answer *question* using the document at *user_path*.

    Tries Qdrant first; falls back to FAISS if Qdrant is unavailable.

    Parameters
    ----------
    user_path : str
        Absolute path to the PDF (or text) file.
    question : str
        The user's question.
    """
    _init_qdrant()

    if not _qdrant_client:
        print("Qdrant unavailable — falling back to FAISS")
        from tools.RAG import run_rag_pipeline
        # FIX: pass question (not init_prompt) to match updated RAG.py signature
        return run_rag_pipeline(user_path, question)

    try:
        from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
        from langchain_core.prompts import PromptTemplate
        from langchain_core.output_parsers import StrOutputParser

        embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
        db = _get_or_build_qdrant_index(user_path, embeddings)

        # Retrieve more candidates than needed, then de-duplicate in Python
        # to approximate MMR behaviour (Qdrant's LangChain wrapper doesn't
        # expose native MMR).
        retriever = db.as_retriever(
            search_type="similarity_score_threshold",
            search_kwargs={"k": 10, "score_threshold": 0.45},
        )

        raw_docs = retriever.invoke(question or "Summarise the document.")
        docs = _deduplicate_docs(raw_docs)[:6]  # keep at most 6 diverse chunks
        context = "\n\n---\n\n".join(d.page_content for d in docs)

        llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.3)

        # FIX: question and system instructions are now separate — no double
        # injection of the question into the prompt.
        prompt = PromptTemplate(
            template=(
                "You are a precise document assistant.\n"
                "Use ONLY the context below to answer. "
                "If the answer is not present say: "
                '"I do not have that information in the provided documents."\n\n'
                "Context:\n{context}\n\n"
                "Question:\n{question}\n"
            ),
            input_variables=["context", "question"],
        )

        chain = prompt | llm | StrOutputParser()
        answer = chain.invoke({"context": context, "question": question or "Summarise the document."})
            
        raw_output = chain.invoke(question or "Summarise the document.")

        if "[" in raw_output and "question" in raw_output and "answer" in raw_output:
            return raw_output

        return redact_pii_safe(raw_output)

    except Exception as e:
        print(f"Qdrant RAG failed [{type(e).__name__}]: {e} — falling back to FAISS")
        from tools.RAG import run_rag_pipeline
        return run_rag_pipeline(user_path, question)
