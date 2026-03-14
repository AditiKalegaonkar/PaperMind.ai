import os
import yfinance as yf
from typing import List, Dict


# Simple, deterministic domain-to-ticker mapping (extendable in config)
# Domain-to-ticker hardcoding removed. Recommender will rely on LLM-driven guidance.


def _normalize_domains(domains: List[str]) -> List[str]:
    if not domains:
        return []
    return [d for d in domains if isinstance(d, str)]


def get_stock_recommendations(domains: List[str], holdings_text: str, limit: int = 5) -> Dict[str, object]:
    """
    Generate stock recommendations using an LLM path when configured; otherwise return a placeholder or empty list.
    The hard-coded domain-to-ticker mapping has been removed. The intention is to rely on the LLM to
    propose tickers tailored to the user's portfolio and domains.
    """
    domains = _normalize_domains(domains or [])
    use_llm = bool(int(os.getenv('USE_LLM', '0')))
    # If an LLM-based recommender is configured, you should wire it here.
    # For now, provide a clear placeholder/fallback when LLM is not wired.
    if not use_llm:
        return { 'recommendations': [] }

    # Placeholder: LLM path would generate actual tickers. Since the environment here
    # doesn't include an LLMed endpoint, return a structured placeholder to indicate intent.
    return {
        'recommendations': [
            {
                'ticker': 'LLM-RECOMM-1',
                'domain': (domains[0] if domains else 'Unknown'),
                'score': 0.0,
                'rationale': 'LLM path configured but not wired in this environment.',
                'name': 'LLM Generated Stock 1'
            },
            {
                'ticker': 'LLM-RECOMM-2',
                'domain': (domains[0] if domains else 'Unknown'),
                'score': 0.0,
                'rationale': 'LLM path configured but not wired in this environment.',
                'name': 'LLM Generated Stock 2'
            }
        ][:limit]
    }
