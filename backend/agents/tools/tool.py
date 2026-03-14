import requests
from bs4 import BeautifulSoup


def get_legal_definition(word: str):
    """Look up a legal term in the Nolo Legal Dictionary."""
    try:
        url = f"https://www.nolo.com/dictionary/{word.lower()}-term.html"
        r = requests.get(url, timeout=5)
        r.raise_for_status()
        div = BeautifulSoup(r.text, "html.parser").find("div", class_="definition")
        return div.get_text(separator="\n").strip() if div else None
    except requests.RequestException:
        return None


def get_article_information():
    """Fetch Constitution of India article listing."""
    try:
        r = requests.get("https://www.constitutionofindia.net/articles/article", timeout=5)
        r.raise_for_status()
        div = BeautifulSoup(r.text, "html.parser").find("div")
        return div.get_text(strip=True) if div else None
    except requests.RequestException:
        return None