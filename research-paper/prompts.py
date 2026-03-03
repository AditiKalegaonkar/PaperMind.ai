def build_financial_prompt(context, question):
    return f"""
You are acting as a financial domain expert.

Answer ONLY using the context below.

Context:
{context}

Question:
{question}

Rules:
- Use standard financial terminology found in the context.
- Reuse wording from the context where possible.
- Do not introduce new financial concepts, numbers, or assumptions.
- If the answer is not in the context, say: "Not available in the provided context."
- Maximum 3 lines.

Answer:
"""


def build_legal_prompt(context, question):
    return f"""
You are acting as a legal domain expert.

Answer ONLY using the context below.

Context:
{context}

Question:
{question}

Rules:
- Use legal terminology exactly as stated in the context.
- Do not infer legal interpretations beyond the text.
- Quote or closely paraphrase relevant sentences.
- If the context does not specify, say: "The context does not specify this."
- Maximum 3 lines.

Answer:
"""


def build_education_prompt(context, question):
    return f"""
You are acting as an education domain expert.

Answer ONLY using the context below.

Context:
{context}

Question:
{question}

Rules:
- Explain using simple academic language from the context.
- Do not add examples, analogies, or explanations outside the context.
- Highlight key terms only if present in the context.
- Maximum 3 lines.

Answer:
"""


def build_miscellaneous_prompt(context, question):
    return f"""
You are acting as a subject-matter expert for this topic.

Answer strictly from the context below.

Context:
{context}

Question:
{question}

Rules:
- Use terminology appropriate to the topic found in the context.
- Do not use outside knowledge.
- If the answer is missing, clearly state that.
- Maximum 3 lines.

Answer:
"""
