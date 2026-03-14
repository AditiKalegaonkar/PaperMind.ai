import domainAwareRAG as rag
import google.generativeai as genai
import nltk
import markdown
import os
from dotenv import load_dotenv

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

nltk.download("punkt")
nltk.download("punkt_tab")
genai.configure()


def main():

    # LEGAL AGENT – NDA

    nda_file = "nda.pdf"

    nda_query = "What are the obligations of the Receiving Party under the NDA?"

    nda_reference_answer = (
        "The Receiving Party must keep confidential information private, use it only for the permitted purpose, "
        "protect it with reasonable care, limit access to authorized persons, return or destroy it upon request, "
        "and disclose it only when legally required with prior notice."
    )

    nda_relevant_chunks = [
        "The Receiving Party shall refrain from disclosing Confidential Information.",
        "The Parties shall protect the confidentiality of each other's Confidential Information.",
        "Within seven (7) days of a written request the Receiving Party shall return/destroy Confidential Information.",
        "The Receiving Party may disclose Confidential Information to the extent required by law."
    ]

    nda_answer, nda_metrics = rag.RAG_pipeline_auto(
        file_path=nda_file,
        query=nda_query,
        domain="legal",
        reference_answer=nda_reference_answer,
        relevant_chunks=nda_relevant_chunks
    )

    print("\nLEGAL NDA ANSWER:")
    print(nda_answer)
    print("LEGAL NDA METRICS:")
    print(nda_metrics)

    # LEGAL AGENT – RENT AGREEMENT

    rent_file = "extended_rental_agreement.pdf"

    rent_query = "What actions can the landlord take if the tenant violates the agreement?"

    rent_reference_answer = (
        "If the tenant violates the agreement, the landlord may terminate the lease, initiate eviction proceedings, "
        "withhold the security deposit, and claim damages for resulting losses."
    )

    rent_relevant_chunks = [
        "Non-payment for 15 days constitutes a material breach and triggers eviction proceedings.",
        "Violation results in immediate lease termination.",
        "Landlord remedies include lease termination and eviction filing.",
        "Withholding security deposit."
    ]

    rent_answer, rent_metrics = rag.RAG_pipeline_auto(
        file_path=rent_file,
        query=rent_query,
        domain="legal",
        reference_answer=rent_reference_answer,
        relevant_chunks=rent_relevant_chunks
    )

    print("\nLEGAL RENT ANSWER:")
    print(rent_answer)
    print("LEGAL RENT METRICS:")
    print(rent_metrics)

    # FINANCE AGENT

    finance_file = "finance_docs.pdf"

    finance_query = "What is the total net portfolio value at the end of the statement period?"

    finance_reference_answer = (
        "The total net portfolio value at the end of the statement period is $1,483,680.50."
    )

    finance_relevant_chunks = [
        "Total Net Portfolio Value $1,483,680.50",
        "Statement Period: December 1, 2025 – December 31, 2025",
        "Market Change +$28,450.50"
    ]

    finance_answer, finance_metrics = rag.RAG_pipeline_auto(
        file_path=finance_file,
        query=finance_query,
        domain="finance",
        reference_answer=finance_reference_answer,
        relevant_chunks=finance_relevant_chunks
    )

    print("\nFINANCE ANSWER:")
    print(finance_answer)
    print("FINANCE METRICS:")
    print(finance_metrics)

    # EDUCATION AGENT

    education_file = "education_docs.pdf"

    education_query = "Why are AI guardrails necessary in large language model systems?"

    education_reference_answer = (
        "AI guardrails are necessary to prevent harmful outputs, protect personal data, maintain ethical compliance, "
        "ensure topic adherence, and reduce hallucinations in AI systems."
    )

    education_relevant_chunks = [
        "AI Guardrails are mechanisms designed to keep AI systems operating within safe boundaries.",
        "Preventing the generation of hate speech, violence, and self-harm content.",
        "Data Privacy: Ensuring the model does not leak Personally Identifiable Information.",
        "Hallucination Detection checks generated facts."
    ]

    education_answer, education_metrics = rag.RAG_pipeline_auto(
        file_path=education_file,
        query=education_query,
        domain="education",
        reference_answer=education_reference_answer,
        relevant_chunks=education_relevant_chunks
    )

    print("\nEDUCATION ANSWER:")
    print(education_answer)
    print("EDUCATION METRICS:")
    print(education_metrics)

    # MISCELLANEOUS – NDA

    nda_misc_query = "How does the NDA manage confidentiality risks between the parties?"

    nda_misc_reference_answer = (
        "The NDA manages confidentiality risks by restricting disclosure, requiring reasonable protection, "
        "limiting access on a need-to-know basis, and allowing legal remedies for breaches."
    )

    nda_misc_relevant_chunks = [
        "The Receiving Party shall refrain from disclosing Confidential Information.",
        "The Parties shall protect the confidentiality of each other's Confidential Information.",
        "Confidential Information shall at all times remain the property of the Disclosing Party.",
        "The non-breaching party is entitled to seek injunctive relief."
    ]

    nda_answer, nda_metrics = rag.RAG_pipeline_auto(
        file_path=nda_file,
        query=nda_misc_query,
        domain="miscellaneous",
        reference_answer=nda_misc_reference_answer,
        relevant_chunks=nda_misc_relevant_chunks
    )

    print("\nMISC NDA ANSWER:")
    print(nda_answer)
    print("MISC NDA METRICS:")
    print(nda_metrics)

    # MISC – RENT

    rent_misc_query = "What risk mitigation steps does the rental agreement impose on the tenant?"

    rent_misc_reference_answer = (
        "The rental agreement mitigates risk by restricting improper use, prohibiting pets and subletting, "
        "defining eviction conditions, and requiring tenant indemnification."
    )

    rent_misc_relevant_chunks = [
        "Premises shall be used solely for residential purposes.",
        "Pets are strictly prohibited.",
        "Events of default include rent unpaid for 10+ days.",
        "Tenant indemnifies the Landlord against damages."
    ]

    rent_answer, rent_metrics = rag.RAG_pipeline_auto(
        file_path=rent_file,
        query=rent_misc_query,
        domain="miscellaneous",
        reference_answer=rent_misc_reference_answer,
        relevant_chunks=rent_misc_relevant_chunks
    )

    print("\nMISC RENT ANSWER:")
    print(rent_answer)
    print("MISC RENT METRICS:")
    print(rent_metrics)

    # MISC – FINANCE

    finance_misc_query = "What financial risk disclosures or safeguards are included in the statement?"

    finance_misc_reference_answer = (
        "The statement includes safeguards through asset diversification, benchmark comparison, "
        "and disclaimers that the data is for educational purposes and not investment advice."
    )

    finance_misc_relevant_chunks = [
        "Asset Allocation: US Equities, Fixed Income, Cash, Alternative Investments.",
        "Year-to-Date (YTD) Returns vs Benchmark.",
        "This document is a mockup for educational and formatting purposes only.",
        "Past performance is not indicative of future results."
    ]

    finance_answer, finance_metrics = rag.RAG_pipeline_auto(
        file_path=finance_file,
        query=finance_misc_query,
        domain="miscellaneous",
        reference_answer=finance_misc_reference_answer,
        relevant_chunks=finance_misc_relevant_chunks
    )

    print("\nMISC FINANCE ANSWER:")
    print(finance_answer)
    print("MISC FINANCE METRICS:")
    print(finance_metrics)

    # MISC – EDUCATION

    education_misc_query = "How do AI guardrails reduce operational and ethical risks?"

    education_misc_reference_answer = (
        "AI guardrails reduce risk by preventing harmful content, protecting personal data, "
        "ensuring topic compliance, and validating outputs to avoid hallucinations."
    )

    education_misc_relevant_chunks = [
        "AI Guardrails are mechanisms, rules, and filters designed to keep AI systems operating safely.",
        "Preventing the generation of hate speech, violence, self-harm content.",
        "Data Privacy: Ensuring the model does not leak Personally Identifiable Information.",
        "Hallucination Detection checks generated facts."
    ]

    education_answer, education_metrics = rag.RAG_pipeline_auto(
        file_path=education_file,
        query=education_misc_query,
        domain="miscellaneous",
        reference_answer=education_misc_reference_answer,
        relevant_chunks=education_misc_relevant_chunks
    )

    print("\nMISC EDUCATION ANSWER:")
    print(education_answer)
    print("MISC EDUCATION METRICS:")
    print(education_metrics)


if __name__ == "__main__":
    main()
