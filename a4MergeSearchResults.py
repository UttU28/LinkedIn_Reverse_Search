import json
import os
from pathlib import Path
from colorama import init, Fore, Style
from dotenv import load_dotenv

init()
load_dotenv()

def printStatus(message: str, color: str = Fore.WHITE):
    print(f"{color}{message}{Style.RESET_ALL}")

def processJsonFile(filePath):
    with open(filePath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    filteredData = [entry for entry in data if entry.get('search_results') and len(entry['search_results']) > 0]
    
    for entry in filteredData:
        if len(entry['search_results']) > 2:
            entry['search_results'] = entry['search_results'][:2]
    
    return filteredData

def main():
    # Get search results directory from environment variable
    resultsDir = os.getenv('SEARCH_RESULTS_DIR', 'searchResults')
    searchResultsDir = Path(resultsDir)
    
    allEntries = []
    
    totalEntries = 0
    for filePath in searchResultsDir.glob('*.json'):
        # Skip the merged results file if it exists
        if filePath.name == 'mergedResults.json':
            continue
            
        printStatus(f"Processing {filePath.name}...", Fore.CYAN)
        entries = processJsonFile(filePath)
        allEntries.extend(entries)
        totalEntries += len(entries)
        printStatus(f"Processed {len(entries)} entries from {filePath.name}", Fore.GREEN)
    
    outputFile = searchResultsDir / 'mergedResults.json'
    with open(outputFile, 'w', encoding='utf-8') as f:
        json.dump(allEntries, f, indent=2, ensure_ascii=False)
    
    printStatus(f"\nTotal entries processed: {totalEntries}", Fore.CYAN)
    printStatus(f"Merged results saved to: {outputFile}", Fore.GREEN)

if __name__ == "__main__":
    main()