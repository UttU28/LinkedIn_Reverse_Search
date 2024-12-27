import json
import requests
from bs4 import BeautifulSoup
from collections import defaultdict
from time import sleep

def search(firstName, lastName, companyName):
    url = "https://www.bing.com/search"
    query = f'{firstName} {lastName} {companyName} site:linkedin.com/in/'
    params = {"q": query}
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }

    try:
        response = requests.get(url, params=params, headers=headers, timeout=10)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, 'html.parser')
        print(soup)
        search_results = soup.find_all('a', href=True)

        linkCounter = defaultdict(int)
        for result in search_results:
            href = result['href']
            if 'linkedin.com/in/' in href and '/posts/' not in href:
                linkCounter[href] += 1

        if linkCounter:
            theLink, _count = max(linkCounter.items(), key=lambda x: x[1])
            print(f"Found LinkedIn profile: {theLink}")
            return theLink

        print("No LinkedIn profile found.")
        return None

    except requests.exceptions.RequestException as e:
        print(f"Error during search: {e}")
        return None

def processAllEntries(dataFile):
    try:
        with open(dataFile, 'r') as file:
            data = json.load(file)

        if not data:
            print("No data available in data.json")
            return

        total = len(data)
        found_count = 0
        not_found_count = 0
        error_count = 0

        print(f"Processing {total} entries from {dataFile}")

        for index, person in enumerate(data, start=1):
            print(f"\nProcessing entry {index}/{total}: {person}")

            if not person.get("hasViewed", False):
                try:
                    result = search(
                        person["company"],
                        person["lastName"],
                        person["firstName"]
                    )

                    if result:
                        person["hasViewed"] = True
                        person["currentUrl"] = result
                        found_count += 1
                    else:
                        not_found_count += 1

                except Exception as e:
                    print(f"Error processing entry {index}: {e}")
                    error_count += 1

                with open(dataFile, 'w') as file:
                    json.dump(data, file, indent=4)

                print(f"\rTotal: {total} | Found: {found_count} | Not Found: {not_found_count} | Errors: {error_count}", end="", flush=True)
                sleep(1)

        print(f"\n\nSummary:")
        print(f"Total Profiles: {total}")
        print(f"Found: {found_count}")
        print(f"Not Found: {not_found_count}")
        print(f"Errors: {error_count}")

    except Exception as e:
        print(f"Error processing entries: {e}")

if __name__ == "__main__":
    processAllEntries('data.json')
