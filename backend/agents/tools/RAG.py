import os
import hashlib
from dotenv import load_dotenv

load_dotenv()
google_api_key = os.getenv("GOOGLE_API_KEY")
if google_api_key:
    os.environ["GOOGLE_API_KEY"] = google_api_key
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

from langchain_community.vectorstores import FAISS
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from langchain_community.document_loaders import PyMuPDFLoader
from presidio_analyzer import AnalyzerEngine, Pattern as _P, PatternRecognizer
from presidio_anonymizer import AnonymizerEngine
from presidio_analyzer.nlp_engine import NlpEngineProvider

# ── PII engine ────────────────────────────────────────────────────────────────
_provider = NlpEngineProvider(nlp_configuration={
    "nlp_engine_name": "spacy",
    "models": [{"lang_code": "en", "model_name": "en_core_web_sm"}],
})
analyzer = AnalyzerEngine(nlp_engine=_provider.create_engine())
anonymizer = AnonymizerEngine()

for _entity, _name, _regex, _score in [
    ("CASE_NUMBER",     "case_number",     r"\b(case|c\.?no\.?|docket)\s*[:\-]?\s*[A-Z0-9\-\/]+\b",                            0.6),
    ("CONTRACT_NUMBER", "contract_number", r"\b(contract|policy)\s*(no|number)?\s*[:\-]?\s*[A-Z0-9\-\/]{5,}\b",                0.6),
    ("STUDENT_ID",      "student_id",      r"\b(student|roll|registration)\s*(id|no|number)?\s*[:\-]?\s*[A-Z0-9\-]{4,}\b",     0.6),
    ("SALARY",          "salary",          r"\b(salary|compensation|ctc|pay|wage)\s*[:\-]?\s*(\$|₹|€)?\s?\d[\d,]*(\.\d+)?\b", 0.55),
    ("TRANSACTION_ID",  "transaction_id",  r"\b(transaction|txn|reference)\s*(id|no|number)?\s*[:\-]?\s*[A-Z0-9\-]{6,}\b",    0.6),
]:
    analyzer.registry.add_recognizer(
        PatternRecognizer(supported_entity=_entity, patterns=[_P(_name, _regex, _score)])
    )

PII_ENTITIES = [
    "PERSON", "NRP", "PHONE_NUMBER", "EMAIL_ADDRESS", "LOCATION",
    "CREDIT_CARD", "IBAN_CODE", "BANK_ACCOUNT", "CRYPTO", "US_SSN",
    "MEDICAL_LICENSE", "DATE_TIME", "URL",
    "CASE_NUMBER", "CONTRACT_NUMBER", "STUDENT_ID", "SALARY", "TRANSACTION_ID",
]

# ── FAISS disk cache ──────────────────────────────────────────────────────────
FAISS_CACHE_DIR = "faiss_cache"
os.makedirs(FAISS_CACHE_DIR, exist_ok=True)


def redact_pii(text: str) -> str:
    results = analyzer.analyze(text=text, entities=PII_ENTITIES, language="en")
    return anonymizer.anonymize(text=text, analyzer_results=results).text


def _doc_hash(path: str) -> str:
    """SHA-256 of file bytes — used as cache key."""
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for block in iter(lambda: f.read(65536), b""):
            h.update(block)
    return h.hexdigest()


def _load_and_chunk(path: str):
    docs = PyMuPDFLoader(file_path=path).load()
    for d in docs:
        d.page_content = redact_pii(d.page_content)
    return RecursiveCharacterTextSplitter(
        chunk_size=1500, chunk_overlap=100
    ).split_documents(docs)


def _get_or_build_index(path: str, embeddings) -> FAISS:
    """Return a cached FAISS index when the same file is uploaded again."""
    index_path = os.path.join(FAISS_CACHE_DIR, _doc_hash(path)[:16])  # truncated to avoid Windows MAX_PATH
    if os.path.isdir(index_path):
        return FAISS.load_local(
            index_path, embeddings, allow_dangerous_deserialization=True
        )
    db = FAISS.from_documents(_load_and_chunk(path), embeddings)
    db.save_local(index_path)
    return db


def run_rag_pipeline(user_path: str, init_prompt: str) -> str:
    embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
    db = _get_or_build_index(user_path, embeddings)

    retriever = db.as_retriever(
        search_type="similarity",
        search_kwargs={"k": 5},   # reduced from 20 → faster, cheaper
    )

    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.4)

    prompt = PromptTemplate(
        template=(
            "Use only the following context to answer.\n"
            "If the answer is not present, say: "
            '"I do not have that information in the provided documents."\n\n'
            "Context:\n{context}\n\n"
            "Question:\n{question}\n"
            + init_prompt
        ),
        input_variables=["context", "question"],
    )

    # Fixed pipeline — question flows through correctly
    chain = (
        {"context": retriever, "question": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )

    return redact_pii(chain.invoke(init_prompt or "Summarise the document."))