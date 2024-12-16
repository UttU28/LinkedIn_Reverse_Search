import requests
from bs4 import BeautifulSoup
import json
from collections import defaultdict
from time import sleep

def getSingleLinkedIn(companyName, lastName, firstName):
    # Prepare the search query
    joinedCompanyName = '+'.join(companyName.split(' '))
    joinedFirstName = '+'.join(firstName.split(' '))
    joinedLastName = '+'.join(lastName.split(' '))
    query = f'"{joinedFirstName}"+"{joinedLastName}"+"{joinedCompanyName}"+linkedin+profile'

    # Define headers to mimic a browser
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    }

    try:
        # Make the request to Google Search
        response = requests.get(f"https://www.google.com/search?q={query}", headers=headers)

        # Check for CAPTCHA
        if "id=\"captcha-form\"" in response.text:
            print("CAPTCHA detected. Unable to proceed.")
            return None

        # Parse the response content with BeautifulSoup
        soup = BeautifulSoup(response.text, 'html.parser')
        search_results = soup.find_all('a', href=True)

        # Extract LinkedIn profile links
        linkCounter = defaultdict(int)
        for result in search_results:
            href = result['href']
            if 'linkedin.com/in/' in href and '/posts/' not in href:
                linkCounter[href] += 1

        if linkCounter:
            theLink, _count = max(linkCounter.items(), key=lambda x: x[1])
            return theLink

    except Exception as e:
        print(f"Error during search: {e}")
        return None


def processAllEntries(dataFile):
    try:
        with open(dataFile, 'r') as file:
            data = json.load(file)

        total = len(data)
        found_count = 0
        not_found_count = 0
        error_count = 0

        for person in data:
            if not person.get("hasViewed", False):
                try:
                    result = getSingleLinkedIn(
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

                except Exception:
                    error_count += 1

                # Save progress to file after each person
                with open(dataFile, 'w') as file:
                    json.dump(data, file, indent=4)

                print(f"\rTotal: {total} | Found: {found_count} | Not Found: {not_found_count} | Errors: {error_count}", end="", flush=True)
                sleep(1)  # Avoid making requests too quickly

        print(f"\n\nSummary:")
        print(f"Total Profiles: {total}")
        print(f"Found: {found_count}")
        print(f"Not Found: {not_found_count}")
        print(f"Errors: {error_count}")

    except Exception as e:
        print(f"Error processing entries: {e}")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="LinkedIn Profile Scraper")
    parser.add_argument("batchNumber", type=int, help="Specify the batch number, e.g., 5 for batch_5.json")
    args = parser.parse_args()
    batchFileName = f'myBatch/batch_{args.batchNumber}.json'

    processAllEntries(batchFileName)
