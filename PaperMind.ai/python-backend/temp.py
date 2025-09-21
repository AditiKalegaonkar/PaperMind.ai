import requests
from bs4 import BeautifulSoup

url = "https://www.constitutionofindia.net/read/"
try:
    response = requests.get(url)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")
    main_content = soup.find("div")
    if main_content:
        print(main_content.get_text(strip=True))
    else:
        print("Main content not found.")

except requests.exceptions.RequestException as e:
    print(f"Error: {e}")
