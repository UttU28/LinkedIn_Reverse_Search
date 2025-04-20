import json
import os
from tqdm import tqdm
from colorama import init, Fore, Style
from dotenv import load_dotenv

# Initialize colorama
init()
load_dotenv()

def printStatus(message: str, color: str = Fore.WHITE):
    print(f"{color}{message}{Style.RESET_ALL}")

def processJsonFile(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        processedEntries = []
        for entry in data:
            if 'linkedIn' not in entry['metadata']:
                continue
                
            processedEntry = {
                'Full Name': entry['metadata'].get('fullName', ''),
                'Company Name': entry['metadata'].get('companyName', ''),
                'Position': entry['metadata'].get('positionName', ''),
                'LinkedIn URL': entry['metadata'].get('linkedIn', '')
            }
            processedEntries.append(processedEntry)
            
        return processedEntries
        
    except Exception as e:
        printStatus(f"Error processing {filepath}: {str(e)}", Fore.RED)
        return []

def consolidateLinkedinData():
    try:
        # Get directory from environment variable
        resultsDir = os.getenv('SEARCH_RESULTS_DIR', 'searchResults')
        jsonFiles = [f for f in os.listdir(resultsDir) if f.endswith('.json')]
        
        if not jsonFiles:
            printStatus(f"No JSON files found in {resultsDir} directory!", Fore.RED)
            return
            
        printStatus(f"\nProcessing {len(jsonFiles)} JSON files...", Fore.CYAN)
        
        allEntries = []
        totalEntries = 0
        entriesWithLinkedin = 0
        
        for filename in tqdm(jsonFiles, desc="Processing files", unit="file"):
            filepath = os.path.join(resultsDir, filename)
            processedEntries = processJsonFile(filepath)
            
            totalEntries += len(processedEntries)
            entriesWithLinkedin += len(processedEntries)
            allEntries.extend(processedEntries)
            
        # Get output file name from environment variable
        consolidatedFile = os.getenv('CONSOLIDATED_DATA_FILE', 'consolidatedLinkedinData.json')
        with open(consolidatedFile, 'w', encoding='utf-8') as f:
            json.dump(allEntries, f, indent=2, ensure_ascii=False)
            
        printStatus(f"\nProcessing completed!", Fore.GREEN)
        printStatus(f"JSON data saved to: {consolidatedFile}", Fore.GREEN)
        printStatus(f"Total entries processed: {totalEntries}", Fore.WHITE)
        printStatus(f"Entries with LinkedIn URLs: {entriesWithLinkedin}", Fore.GREEN)
        
    except Exception as e:
        printStatus(f"An error occurred: {str(e)}", Fore.RED)

if __name__ == "__main__":
    consolidateLinkedinData()