import os
from dotenv import load_dotenv
from langchain_community.vectorstores import FAISS
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.prompts import PromptTemplate
from langchain.chains import RetrievalQA
from langchain_community.document_loaders import PyMuPDFLoader
load_dotenv()
os.environ["GOOGLE_API_KEY"] = os.getenv("GOOGLE_API_KEY")


def load_and_chunk(path):
    loader = PyMuPDFLoader(file_path=path)
    documents = loader.load()
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1500, chunk_overlap=20)
    return splitter.split_documents(documents)


def RAG_pipeline(user_path):
    embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
    all_docs = load_and_chunk(user_path)
    db = FAISS.from_documents(all_docs, embeddings)
    retriever = db.as_retriever(
        search_type="similarity", search_kwargs={"k": 20})
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-pro", temperature=0.4)
    prompt_template = """
        {context}
        {question}
        You are analyzing legal documents to help an individual understand potential risks. Provide a comprehensive, structured summary that includes the following:
        1. Risk Categorization :
        Clearly differentiate between financial risks (e.g., penalties, damages, costs, loss of assets, payment obligations) and legal risks (e.g., contract breaches, regulatory violations, compliance failures, lawsuits).

        2.Lawsuits & Breaches :
        Identify any lawsuits, disputes, breaches of contract, or potential violations explicitly stated or implied in the document.
        Summarize the possible outcomes or consequences if such breaches occur.
        
        3.Difficult Terms & Explanations :
        Extract difficult or uncommon legal/financial terms and provide simplified explanations so that a non-lawyer can easily understand them.

        4.Overall Summary : 
        End with a clear executive summary that brings together the key financial and legal risks, the most critical threats, and any urgent issues to be addressed.
    """
    prompt = PromptTemplate(
        template=prompt_template, input_variables=["context", "question"]
    )
    retrieval_qa = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=retriever,
        return_source_documents=True,
        chain_type_kwargs={"prompt": prompt}
    )
    result = retrieval_qa.invoke({"query": "Summarize the document"})
    return result["result"]
