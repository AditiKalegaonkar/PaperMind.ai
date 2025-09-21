import requests
from bs4 import BeautifulSoup      

def get_legal_definition(word: str):
    """Look up a legal word in Nolo Legal Dictionary and return its definition."""
    word_lower = word.lower()
    try:
        url = f"https://www.nolo.com/dictionary/{word_lower}-term.html"
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")
        content_div = soup.find("div", class_="definition")
        if content_div:
            text = content_div.get_text(separator="\n").strip()
            return text
        else:
            return None
    except requests.RequestException:
        return None
