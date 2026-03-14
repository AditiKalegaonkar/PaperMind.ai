import os
from dotenv import load_dotenv


from langchain_community.vectorstores import FAISS
from langchain_google_genai import (
    GoogleGenerativeAIEmbeddings,
    ChatGoogleGenerativeAI
)
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.prompts import PromptTemplate
from langchain.chains import RetrievalQA
from langchain_community.document_loaders import PyMuPDFLoader
from presidio_analyzer import AnalyzerEngine, Pattern, PatternRecognizer
from presidio_anonymizer import AnonymizerEngine
from presidio_analyzer.nlp_engine import NlpEngineProvider
# ENV

load_dotenv()
os.environ["GOOGLE_API_KEY"] = os.getenv("GOOGLE_API_KEY")
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

# PII / SENSITIVE DATA GUARDRAILS
configuration = {
    "nlp_engine_name": "spacy",
    "models": [
        {"lang_code": "en", "model_name": "en_core_web_sm"}
    ]
}

provider = NlpEngineProvider(nlp_configuration=configuration)
analyzer = AnalyzerEngine(nlp_engine=provider.create_engine())
anonymizer = AnonymizerEngine()

case_number_recognizer = PatternRecognizer(
    supported_entity="CASE_NUMBER",
    patterns=[
        Pattern(
            name="case_number",
            regex=r"\b(case|c\.?no\.?|docket)\s*[:\-]?\s*[A-Z0-9\-\/]+\b",
            score=0.6
        )
    ]
)

contract_number_recognizer = PatternRecognizer(
    supported_entity="CONTRACT_NUMBER",
    patterns=[
        Pattern(
            name="contract_number",
            regex=r"\b(contract|policy)\s*(no|number)?\s*[:\-]?\s*[A-Z0-9\-\/]{5,}\b",
            score=0.6
        )
    ]
)

student_id_recognizer = PatternRecognizer(
    supported_entity="STUDENT_ID",
    patterns=[
        Pattern(
            name="student_id",
            regex=r"\b(student|roll|registration)\s*(id|no|number)?\s*[:\-]?\s*[A-Z0-9\-]{4,}\b",
            score=0.6
        )
    ]
)

salary_recognizer = PatternRecognizer(
    supported_entity="SALARY",
    patterns=[
        Pattern(
            name="salary",
            regex=r"\b(salary|compensation|ctc|pay|wage)\s*[:\-]?\s*(\$|₹|€)?\s?\d[\d,]*(\.\d+)?\b",
            score=0.55
        )
    ]
)

transaction_id_recognizer = PatternRecognizer(
    supported_entity="TRANSACTION_ID",
    patterns=[
        Pattern(
            name="transaction_id",
            regex=r"\b(transaction|txn|reference)\s*(id|no|number)?\s*[:\-]?\s*[A-Z0-9\-]{6,}\b",
            score=0.6
        )
    ]
)

analyzer.registry.add_recognizer(case_number_recognizer)
analyzer.registry.add_recognizer(contract_number_recognizer)
analyzer.registry.add_recognizer(student_id_recognizer)
analyzer.registry.add_recognizer(salary_recognizer)
analyzer.registry.add_recognizer(transaction_id_recognizer)

PII_ENTITIES = [
    "PERSON",
    "NRP",
    "PHONE_NUMBER",
    "EMAIL_ADDRESS",
    "LOCATION",
    "CREDIT_CARD",
    "IBAN_CODE",
    "BANK_ACCOUNT",
    "CRYPTO",
    "US_SSN",
    "MEDICAL_LICENSE",
    "DATE_TIME",
    "URL",
    "CASE_NUMBER",
    "CONTRACT_NUMBER",
    "STUDENT_ID",
    "SALARY",
    "TRANSACTION_ID"
]


def redact_pii(text: str) -> str:
    results = analyzer.analyze(
        text=text,
        entities=PII_ENTITIES,
        language="en"
    )

    anonymized = anonymizer.anonymize(
        text=text,
        analyzer_results=results
    )
    return anonymized.text


# LOAD + CHUNK WITH GUARDRAIL
def load_and_chunk(path):
    loader = PyMuPDFLoader(file_path=path)
    documents = loader.load()
    for d in documents:
        d.page_content = redact_pii(d.page_content)
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1500,
        chunk_overlap=20
    )
    return splitter.split_documents(documents)


# RAG PIPELINE
def RAG_pipeline(user_path, init_prompt):

    embeddings = GoogleGenerativeAIEmbeddings(
        model="models/embedding-001"
    )

    all_docs = load_and_chunk(user_path)

    db = FAISS.from_documents(all_docs, embeddings)

    retriever = db.as_retriever(
        search_type="similarity",
        search_kwargs={"k": 20}
    )

    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        temperature=0.4
    )

    prompt_template = """
Use only the following context to answer.
If the answer is not present, say:
"I do not have that information in the provided documents."

Context:
{context}

Question:
{question}
""" + init_prompt

    prompt = PromptTemplate(
        template=prompt_template,
        input_variables=["context", "question"]
    )

    retrieval_qa = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=retriever,
        return_source_documents=True,
        chain_type_kwargs={"prompt": prompt}
    )  
    print("llm gve summary")

    result = retrieval_qa.invoke(
        {"query": "Answer the question as per the context"}
    )

    final_answer = redact_pii(result["result"])

    return final_answer



