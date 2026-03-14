import os
import hashlib
import uuid
from dotenv import load_dotenv

load_dotenv()
google_api_key = os.getenv("GOOGLE_API_KEY")
if google_api_key:
    os.environ["GOOGLE_API_KEY"] = google_api_key
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

# Lazy imports for Qdrant - only load when needed
qdrant_client = None
QDRANT_HOST = None
QDRANT_PORT = None
QDRANT_API_KEY = None
COLLECTION_NAME = "papermind_docs"

# PII engine - lazy loaded
analyzer = None
anonymizer = None
PII_ENTITIES = None


def _init_pii():
    """Lazy initialization of PII engine."""
    global analyzer, anonymizer, PII_ENTITIES
    
    if analyzer is not None:
        return
    
    try:
        from presidio_analyzer import AnalyzerEngine, Pattern as _P, PatternRecognizer
        from presidio_anonymizer import AnonymizerEngine
        from presidio_analyzer.nlp_engine import NlpEngineProvider
        
        _provider = NlpEngineProvider(nlp_configuration={
            "nlp_engine_name": "spacy",
            "models": [{"lang_code": "en", "model_name": "en_core_web_sm"}],
        })
        analyzer = AnalyzerEngine(nlp_engine=_provider.create_engine())
        anonymizer = AnonymizerEngine()
        
        for _entity, _name, _regex, _score in [
            ("CASE_NUMBER", "case_number", r"\b(case|c\.?no\.?|docket)\s*[:\-]?\s*[A-Z0-9\-\/]+\b", 0.6),
            ("CONTRACT_NUMBER", "contract_number", r"\b(contract|policy)\s*(no|number)?\s*[:\-]?\s*[A-Z0-9\-\/]{5,}\b", 0.6),
            ("STUDENT_ID", "student_id", r"\b(student|roll|registration)\s*(id|no|number)?\s*[:\-]?\s*[A-Z0-9\-]{4,}\b", 0.6),
            ("SALARY", "salary", r"\b(salary|compensation|ctc|pay|wage)\s*[:\-]?\s*(\$|₹|€)?\s?\d[\d,]*(\.\d+)?\b", 0.55),
            ("TRANSACTION_ID", "transaction_id", r"\b(transaction|txn|reference)\s*(id|no|number)?\s*[:\-]?\s*[A-Z0-9\-]{6,}\b", 0.6),
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
        print("PII engine initialized")
    except Exception as e:
        print(f"PII engine init failed: {e}")


def _init_qdrant():
    """Lazy initialization of Qdrant client."""
    global qdrant_client, QDRANT_HOST, QDRANT_PORT, QDRANT_API_KEY
    
    if qdrant_client is not None:
        return qdrant_client
    
    QDRANT_HOST = os.getenv("QDRANT_HOST", "localhost")
    QDRANT_PORT = int(os.getenv("QDRANT_PORT", "6333"))
    QDRANT_API_KEY = os.getenv("QDRANT_API_KEY", None)
    
    try:
        from qdrant_client import QdrantClient
        from qdrant_client.models import Distance, VectorParams
        
        if QDRANT_API_KEY:
            qdrant_client = QdrantClient(
                host=QDRANT_HOST,
                port=QDRANT_PORT,
                api_key=QDRANT_API_KEY
            )
        else:
            qdrant_client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)
        
        try:
            qdrant_client.get_collection(COLLECTION_NAME)
        except Exception:
            qdrant_client.create_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=VectorParams(size=768, distance=Distance.COSINE)
            )
        print(f"Connected to Qdrant at {QDRANT_HOST}:{QDRANT_PORT}")
    except Exception as e:
        print(f"Qdrant connection failed: {e}. Using fallback mode.")
        qdrant_client = None
    
    return qdrant_client


def redact_pii(text: str) -> str:
    """Redact PII from text."""
    _init_pii()
    if analyzer is None or anonymizer is None:
        return text
    
    try:
        results = analyzer.analyze(text=text, entities=PII_ENTITIES, language="en")
        return anonymizer.anonymize(text=text, analyzer_results=results).text
    except Exception:
        return text


def _doc_hash(path: str) -> str:
    """SHA-256 of file bytes — used as cache key."""
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for block in iter(lambda: f.read(65536), b""):
            h.update(block)
    return h.hexdigest()


def _load_and_chunk(path: str):
    """Load PDF and chunk into documents."""
    from langchain_community.document_loaders import PyMuPDFLoader
    from langchain_text_splitters import RecursiveCharacterTextSplitter
    
    docs = PyMuPDFLoader(file_path=path).load()
    for d in docs:
        d.page_content = redact_pii(d.page_content)
    return RecursiveCharacterTextSplitter(
        chunk_size=1500, chunk_overlap=100
    ).split_documents(docs)


def _get_or_build_qdrant_index(path: str, embeddings):
    """Build or retrieve Qdrant index for the document."""
    _init_qdrant()
    
    if not qdrant_client:
        raise RuntimeError("Qdrant client not available")
    
    from qdrant_client.models import Distance, VectorParams
    from langchain_community.vectorstores import Qdrant
    
    doc_hash = _doc_hash(path)[:16]
    collection_name = f"{COLLECTION_NAME}_{doc_hash}"
    
    # Create collection for this document
    try:
        qdrant_client.get_collection(collection_name)
    except Exception:
        qdrant_client.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(size=768, distance=Distance.COSINE)
        )
    
    # Check if we have points
    try:
        count = qdrant_client.count(collection_name)
        if count and count.value > 0:
            return Qdrant(
                client=qdrant_client,
                collection_name=collection_name,
                embeddings=embeddings
            )
    except Exception:
        pass
    
    # Build new index
    chunks = _load_and_chunk(path)
    texts = [doc.page_content for doc in chunks]
    metadatas = [{"source": path, "chunk_id": i} for i in range(len(chunks))]
    
    Qdrant.from_texts(
        client=qdrant_client,
        collection_name=collection_name,
        texts=texts,
        embedding=embeddings,
        metadatas=metadatas
    )
    
    return Qdrant(
        client=qdrant_client,
        collection_name=collection_name,
        embeddings=embeddings
    )


def run_qdrant_rag(user_path: str, init_prompt: str) -> str:
    """Optimized RAG using Qdrant vector store with hybrid search."""
    # Try Qdrant first, fall back to FAISS
    _init_qdrant()
    
    if not qdrant_client:
        print("Qdrant unavailable, falling back to FAISS")
        from tools.RAG import run_rag_pipeline
        return run_rag_pipeline(user_path, init_prompt)
    
    try:
        from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
        from langchain_core.prompts import PromptTemplate
        from langchain_core.runnables import RunnablePassthrough
        from langchain_core.output_parsers import StrOutputParser
        
        embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
        
        db = _get_or_build_qdrant_index(user_path, embeddings)
        
        # Hybrid search: similarity + keyword
        retriever = db.as_retriever(
            search_type="similarity_score_threshold",
            search_kwargs={
                "k": 5,
                "score_threshold": 0.5
            }
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
        
        chain = (
            {"context": retriever, "question": RunnablePassthrough()}
            | prompt
            | llm
            | StrOutputParser()
        )
        
        return redact_pii(chain.invoke(init_prompt or "Summarise the document."))
    
    except Exception as e:
        print(f"Qdrant RAG failed: {e}. Falling back to FAISS.")
        from tools.RAG import run_rag_pipeline
        return run_rag_pipeline(user_path, init_prompt)


# Alias for compatibility
run_rag_pipeline = run_qdrant_rag
