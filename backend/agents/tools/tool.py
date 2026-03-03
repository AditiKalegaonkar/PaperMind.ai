# Imports
import os
import requests
from bs4 import BeautifulSoup

# Legal terms definition


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


def get_article_information():
    url = f"https://www.constitutionofindia.net/articles/article"
    try:
        response = requests.get(url)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")
        main_content = soup.find("div")

        if main_content:
            response = main_content.get_text(strip=True)
        else:
            return None
    except requests.RequestException:
        return None
    return response
