import fitz
import faiss
import numpy as np
import google.generativeai as genai
import nltk
from nltk.translate.bleu_score import sentence_bleu, SmoothingFunction
from textstat import flesch_reading_ease
from sklearn.metrics import precision_score, recall_score, f1_score
from dotenv import load_dotenv
import os

from prompts import (
    build_education_prompt,
    build_financial_prompt,
    build_legal_prompt,
    build_miscellaneous_prompt
)

load_dotenv()
genai.configure()

nltk.download("punkt")


def load_pdf(file_path):
    doc = fitz.open(file_path)
    text = ""
    for page in doc:
        text += page.get_text()
    return text


def chunk_text(text, chunk_size=600, overlap=80):
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start = end - overlap
    return chunks


def embed_texts(texts):
    embeddings = []
    for t in texts:
        emb = genai.embed_content(
            model="models/embedding-001",
            content=t
        )["embedding"]
        embeddings.append(emb)

    embeddings = np.array(embeddings, dtype="float32")
    faiss.normalize_L2(embeddings)
    return embeddings


class VectorStore:
    def __init__(self, embeddings, documents):
        self.documents = documents
        dim = embeddings.shape[1]
        self.index = faiss.IndexFlatIP(dim)
        self.index.add(embeddings)

    def search(self, query_embedding, k=10):
        distances, indices = self.index.search(query_embedding, k)
        return [self.documents[i] for i in indices[0]]


def retrieve(query, store, k=10):
    q_emb = genai.embed_content(
        model="models/embedding-001",
        content=query
    )["embedding"]

    q_emb = np.array([q_emb], dtype="float32")
    faiss.normalize_L2(q_emb)

    results = store.search(q_emb, k)
    return list(dict.fromkeys(results))[:k]


def hit_rate(relevant, retrieved):
    def match(rel, ret):
        return rel.lower() in ret.lower() or ret.lower() in rel.lower()

    for r in relevant:
        if any(match(r, x) for x in retrieved):
            return 1
    return 0


def mrr(relevant, retrieved):
    for i, doc in enumerate(retrieved, start=1):
        if doc in relevant:
            return 1 / i
    return 0


def precision_recall_f1(relevant, retrieved):
    def match(rel, ret):
        return rel.lower() in ret.lower() or ret.lower() in rel.lower()

    true_positive = 0
    for r in relevant:
        if any(match(r, x) for x in retrieved):
            true_positive += 1

    precision = true_positive / len(retrieved) if retrieved else 0
    recall = true_positive / len(relevant) if relevant else 0

    f1 = (
        2 * precision * recall / (precision + recall)
        if precision + recall > 0 else 0
    )

    return {
        "precision": precision,
        "recall": recall,
        "f1": f1
    }


def bleu_score(pred, ref):
    smoothing = SmoothingFunction().method1
    return sentence_bleu(
        [nltk.word_tokenize(ref)],
        nltk.word_tokenize(pred),
        smoothing_function=smoothing
    )


def groundedness(answer, docs):
    ans_words = set(nltk.word_tokenize(answer.lower()))
    doc_words = set(w for d in docs for w in nltk.word_tokenize(d.lower()))
    return len(ans_words & doc_words) / len(ans_words) if ans_words else 0


def hallucination_rate(answer, docs):
    ans_words = set(nltk.word_tokenize(answer.lower()))
    doc_words = set(w for d in docs for w in nltk.word_tokenize(d.lower()))
    unsupported = ans_words - doc_words
    return len(unsupported) / len(ans_words) if ans_words else 0


def readability(answer):
    return flesch_reading_ease(answer)


def generate_answer_auto(context, query, domain="miscellaneous"):
    temp = 0.9
    if domain.lower() == "financial":
        prompt = build_financial_prompt(context, query)
        temp = 0.3
    elif domain.lower() == "legal":
        prompt = build_legal_prompt(context, query)
        temp = 0.5
    elif domain.lower() == "educational":
        prompt = build_education_prompt(context, query)
        temp = 0.7
    else:
        prompt = build_miscellaneous_prompt(context, query)

    response = model.generate_content(
        prompt,
        generation_config={
            "temperature": temp,
            "top_p": 0.9,
        }
    )

    return response.text.strip()


def RAG_pipeline_auto(file_path, query, reference_answer=None, relevant_chunks=None, domain="miscellaneous"):
    text = load_pdf(file_path)
    chunks = chunk_text(text)

    embeddings = embed_texts(chunks)
    store = VectorStore(embeddings, chunks)

    retrieved = retrieve(query, store, k=10)

    context = "\n".join(retrieved[:5])
    answer = generate_answer_auto(context, query, domain=domain)

    metrics = {}

    if reference_answer and relevant_chunks:
        metrics = {
            "retrieval": {
                "hit_rate": hit_rate(relevant_chunks, retrieved),
                "mrr": mrr(relevant_chunks, retrieved),
                **precision_recall_f1(relevant_chunks, retrieved)
            },
            "generation": {
                "bleu": bleu_score(answer, reference_answer),
                "readability": readability(answer)
            },
            "end_to_end": {
                "groundedness": groundedness(answer, retrieved),
                "hallucination_rate": hallucination_rate(answer, retrieved)
            }
        }

    return answer, metrics
