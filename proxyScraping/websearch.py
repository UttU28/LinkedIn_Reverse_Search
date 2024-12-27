import json
import requests
from bs4 import BeautifulSoup

def get_working_proxies():
    with open("proxies.json", "r") as file:
        return json.load(file)

def search(query, num_results=5):
    url = "https://www.google.com/search"
    params = {"q": query}
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }

    proxies = get_working_proxies()

    for proxy in proxies:
        proxy_dict = {
            proxy['protocols'][0]: f"{proxy['protocols'][0]}://{proxy['ip']}:{proxy['port']}"
        }
        try:
            # Sending GET request to Google using a proxy
            response = requests.get(url, params=params, headers=headers, proxies=proxy_dict, timeout=10)

            # Print response status code and debug info
            print(f"Response Status Code: {response.status_code} using proxy {proxy_dict}")

            response.raise_for_status()

            soup = BeautifulSoup(response.text, "html.parser")

            results = []
            for link in soup.select(".tF2Cxc")[:num_results]:
                title = link.select_one(".DKV0Md").text
                href = link.select_one(".yuRUbf a")["href"]
                results.append({"title": title, "link": href})

            return results

        except requests.exceptions.RequestException as e:
            print(f"Error with proxy {proxy_dict}: {e}")

    print("All proxies failed. Could not complete the search.")
    return []

if __name__ == "__main__":
    query = input("Enter your search query: ")
    results = search(query)

    # Print out results
    if results:
        print("Search Results:")
        for i, result in enumerate(results, 1):
            print(f"{i}. {result['title']}\n   {result['link']}\n")
    else:
        print("No results found or there was an error.")