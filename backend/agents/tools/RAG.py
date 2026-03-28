import os
import hashlib
from dotenv import load_dotenv
import json

load_dotenv()
google_api_key = os.getenv("GOOGLE_API_KEY")
if google_api_key:
    os.environ["GOOGLE_API_KEY"] = google_api_key
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

# ── FAISS disk cache ──────────────────────────────────────────────────────────
# FIX: Use an absolute path so the cache is always found regardless of CWD.
_HERE = os.path.dirname(os.path.abspath(__file__))
FAISS_CACHE_DIR = os.path.join(_HERE, "faiss_cache")
os.makedirs(FAISS_CACHE_DIR, exist_ok=True)

# ── Lazy PII engine ───────────────────────────────────────────────────────────
_analyzer = None
_anonymizer = None
_PII_ENTITIES: list = []


def _init_pii():
    """Initialize Presidio once; subsequent calls are no-ops."""
    global _analyzer, _anonymizer, _PII_ENTITIES
    if _analyzer is not None:
        return
    try:
        from presidio_analyzer import AnalyzerEngine, Pattern as _P, PatternRecognizer
        from presidio_anonymizer import AnonymizerEngine
        from presidio_analyzer.nlp_engine import NlpEngineProvider

        _provider = NlpEngineProvider(nlp_configuration={
            "nlp_engine_name": "spacy",
            "models": [{"lang_code": "en", "model_name": "en_core_web_sm"}],
        })
        _analyzer = AnalyzerEngine(nlp_engine=_provider.create_engine())
        _anonymizer = AnonymizerEngine()

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
            _analyzer.registry.add_recognizer(
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
        print("PII engine initialized (RAG.py)")
    except Exception as e:
        print(f"PII engine init failed (RAG.py): {e}")


def redact_pii(text) -> str:
    """Redact PII from text, initialising the engine on first use."""
    _init_pii()
    text = str(text)
    if _analyzer is None or _anonymizer is None:
        return text
    try:
        results = _analyzer.analyze(text=text, entities=_PII_ENTITIES, language="en")
        return _anonymizer.anonymize(text=text, analyzer_results=results).text
    except Exception:
        return text
    
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


def _doc_hash(path: str) -> str:
    """Full SHA-256 of file bytes — used as cache key."""
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for block in iter(lambda: f.read(65536), b""):
            h.update(block)
    return h.hexdigest()


def _load_and_chunk(path: str):
    from langchain_community.document_loaders import PyMuPDFLoader
    from langchain_text_splitters import RecursiveCharacterTextSplitter

    docs = PyMuPDFLoader(file_path=path).load()
    for d in docs:
        d.page_content = redact_pii(str(d.page_content))
    return RecursiveCharacterTextSplitter(
        chunk_size=2000,
        chunk_overlap=200,
    ).split_documents(docs)


def _get_or_build_index(path: str, embeddings):
    """Return a cached FAISS index, building and persisting it on first use."""
    from langchain_community.vectorstores import FAISS

    # FIX: use full hash to prevent prefix collisions
    index_path = os.path.join(FAISS_CACHE_DIR, _doc_hash(path))
    if os.path.isdir(index_path):
        return FAISS.load_local(
            index_path, embeddings, allow_dangerous_deserialization=True
        )
    db = FAISS.from_documents(_load_and_chunk(path), embeddings)
    db.save_local(index_path)
    return db


def run_rag_pipeline(user_path: str, question: str) -> str:
    """
    Run RAG over *user_path* and answer *question*.

    Parameters
    ----------
    user_path : str
        Absolute path to the PDF (or text) file to query.
    question : str
        The user's question / prompt.
    """
    from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
    from langchain_core.prompts import PromptTemplate
    from langchain_core.runnables import RunnablePassthrough
    from langchain_core.output_parsers import StrOutputParser

    embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
    db = _get_or_build_index(user_path, embeddings)

    # candidate pool while k=6 keeps the context window lean.
    retriever = db.as_retriever(
        search_type="mmr",
        search_kwargs={"k": 6, "fetch_k": 20, "lambda_mult": 0.6},
    )

    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.3)

    # variables — no more double-injection of the question string.
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

    chain = (
        {"context": retriever, "question": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )

    raw_output = chain.invoke(question or "Summarise the document.")

    if "[" in raw_output and "question" in raw_output and "answer" in raw_output:
        return raw_output

    return redact_pii_safe(raw_output)