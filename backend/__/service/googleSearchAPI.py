from googleapiclient.discovery import build
import json
import os
from typing import Dict, Any, Optional, List
from dotenv import load_dotenv
from colorama import init, Fore, Style

init()
load_dotenv()

def printStatus(message: str, color: str = Fore.WHITE):
    print(f"{color}{message}{Style.RESET_ALL}")

class GoogleCustomSearch:
    def __init__(self, apiKey: str, searchEngineId: str):
        self.apiKey = apiKey
        self.searchEngineId = searchEngineId
        self.service = build("customsearch", "v1", developerKey=apiKey)

    def search(self, query: str, **kwargs) -> Optional[Dict[str, Any]]:
        try:
            searchRequest = self.service.cse().list(
                q=query,
                cx=self.searchEngineId,
                **kwargs
            )
            return searchRequest.execute()

        except Exception as e:
            printStatus(f"An error occurred: {str(e)}", Fore.RED)
            return None

def createLinkedinSearchQuery(name: str, company: str) -> str:
    return f'site:linkedin.com/in "{name}" "{company}"'

def extractEssentialData(results: Dict[str, Any]) -> List[Dict[str, str]]:
    if 'items' not in results:
        return []
    
    return [
        {
            'title': item['title'],
            'link': item['link'],
            'snippet': item['snippet']
        }
        for item in results['items']
    ]

def saveSearchResults(metadata: Dict[str, str], searchResults: List[Dict[str, str]], filename: str):
    # Get search results directory from environment variable
    resultsDir = os.getenv('SEARCH_RESULTS_DIR', 'searchResults')
    os.makedirs(resultsDir, exist_ok=True)
    
    combinedData = {
        'metadata': metadata,
        'search_results': searchResults
    }
    
    filepath = os.path.join(resultsDir, filename)
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(combinedData, f, indent=2, ensure_ascii=False)
        printStatus(f"\nResults have been saved to '{filepath}'", Fore.GREEN)

def displayResults(results: Dict[str, Any], query: str):
    printStatus(f"\nSearch Results for: {query}\n", Fore.CYAN)
    if 'items' in results:
        for item in results['items']:
            printStatus(f"Title: {item['title']}", Fore.WHITE)
            printStatus(f"Link: {item['link']}", Fore.CYAN)
            printStatus(f"Snippet: {item['snippet']}", Fore.WHITE)
            printStatus("-" * 80 + "\n", Fore.WHITE)
    else:
        printStatus("No results found.", Fore.YELLOW)

def searchLinkedinProfile(name: str, company: str, position: str, apiKey: str, searchEngineId: str, outputFilename: str):
    searchClient = GoogleCustomSearch(apiKey, searchEngineId)
    query = createLinkedinSearchQuery(name, company)
    printStatus(f"\nSearching for: {query}", Fore.CYAN)
    
    results = searchClient.search(query, num=7)
    if results:
        essentialData = extractEssentialData(results)
        metadata = {
            'fullName': name,
            'companyName': company,
            'positionName': position
        }
        saveSearchResults(metadata, essentialData, outputFilename)
        return True
    return False

def main():
    API_KEY = os.getenv('GOOGLE_API_KEY')
    SEARCH_ENGINE_ID = os.getenv('GOOGLE_SEARCH_ENGINE_ID')

    if not API_KEY or not SEARCH_ENGINE_ID:
        printStatus("Error: Missing API credentials in environment variables", Fore.RED)
        return

    searchClient = GoogleCustomSearch(API_KEY, SEARCH_ENGINE_ID)

    name = "Dan Kalafatas"
    company = "3Degrees"
    position = "Software Engineer"
    outputFilename = "linkedin_search_results.json"
    searchLinkedinProfile(name, company, position, API_KEY, SEARCH_ENGINE_ID, outputFilename)

if __name__ == "__main__":
    main()
