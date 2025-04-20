import pandas as pd
import json
import os
from tqdm import tqdm
from colorama import init, Fore, Style
from dotenv import load_dotenv
from service.googleSearchAPI import (
    searchLinkedinProfile, 
    extractEssentialData,
    GoogleCustomSearch,
    createLinkedinSearchQuery
)
from service.utils import printStatus, loadJsonFile, saveJsonFile, getEnvPath

# Initialize colorama and load environment variables
init()
load_dotenv()

def loadExistingResults(filepath: str) -> list:
    if os.path.exists(filepath):
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return []
    return []

def saveResults(results: list, filepath: str):
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

def processFile(unprocessedFile: str, statusFilepath: str) -> bool:
    try:
        # Get data directory from environment variable
        dataDir = getEnvPath('DATA_SPLIT_DIR', 'linkedinData')
        filepath = os.path.join(dataDir, unprocessedFile)
        df = pd.read_csv(filepath, encoding='utf-8')
        
        # Print column names to help diagnose issues
        printStatus(f"\nAvailable columns in CSV: {', '.join(df.columns)}", Fore.CYAN)
        printStatus(f"\nProcessing file: {unprocessedFile}", Fore.CYAN)
        printStatus(f"Total entries: {len(df)}", Fore.CYAN)
        
        # Check if required column exists
        if 'Full Name' not in df.columns:
            printStatus("Error: 'Full Name' column not found in CSV", Fore.RED)
            return False
            
        # Map expected column names to actual column names
        column_mappings = {
            'Full Name': 'Full Name',  # Default mapping
            'Company': None,           # Will be mapped if found
            'Position': None           # Will be mapped if found
        }
        
        # Try to find similar columns if exact names are not found
        for col in df.columns:
            if col.lower() == 'company' or 'company' in col.lower() or 'organization' in col.lower():
                column_mappings['Company'] = col
            elif col.lower() == 'position' or 'position' in col.lower() or 'title' in col.lower() or 'job' in col.lower():
                column_mappings['Position'] = col
                
        printStatus(f"Using column mappings: {column_mappings}", Fore.CYAN)
        
        # Get Google API credentials from environment variables
        API_KEY = os.getenv('GOOGLE_API_KEY')
        SEARCH_ENGINE_ID = os.getenv('GOOGLE_SEARCH_ENGINE_ID')
        
        if not API_KEY or not SEARCH_ENGINE_ID:
            printStatus("Error: Missing API credentials in environment variables", Fore.RED)
            return False

        # Get search results directory from environment variable
        resultsDir = getEnvPath('SEARCH_RESULTS_DIR', 'searchResults')
        os.makedirs(resultsDir, exist_ok=True)
        outputFilename = f"linkedin_results_{os.path.splitext(unprocessedFile)[0]}.json"
        outputFilepath = os.path.join(resultsDir, outputFilename)
        
        # Load existing results if any
        allResults = loadExistingResults(outputFilepath)
        processedNames = {result['metadata']['fullName'] for result in allResults}
        
        printStatus(f"Found {len(processedNames)} previously processed entries", Fore.CYAN)
        
        # Process each entry with progress bar
        for index, row in tqdm(df.iterrows(), total=len(df), desc="Processing entries"):
            try:
                # Get full name (required)
                fullname = row['Full Name']
                
                # Get company and position with defaults if columns don't exist
                company = row[column_mappings['Company']] if column_mappings['Company'] in df.columns else "Unknown"
                position = row[column_mappings['Position']] if column_mappings['Position'] in df.columns else "Unknown"
                
                # Skip if already processed
                if fullname in processedNames:
                    continue
                
                # Search LinkedIn profile
                searchClient = GoogleCustomSearch(API_KEY, SEARCH_ENGINE_ID)
                query = createLinkedinSearchQuery(fullname, company)
                
                results = searchClient.search(query, num=7)
                if results:
                    essentialData = extractEssentialData(results)
                    resultEntry = {
                        'metadata': {
                            'fullName': fullname,
                            'companyName': company,
                            'positionName': position
                        },
                        'search_results': essentialData
                    }
                    allResults.append(resultEntry)
                    processedNames.add(fullname)
                    
                    # Save after each successful search
                    saveResults(allResults, outputFilepath)
                else:
                    printStatus(f"No results found for {fullname}", Fore.YELLOW)
                
            except KeyError as e:
                printStatus(f"Error processing entry at index {index}: Missing column {str(e)}", Fore.RED)
                continue
            except Exception as e:
                printStatus(f"Error processing entry at index {index}: {str(e)}", Fore.RED)
                continue

        printStatus(f"\nResults saved to '{outputFilepath}'", Fore.GREEN)
        printStatus(f"Total entries processed: {len(allResults)}", Fore.GREEN)

        # Update the processing status
        processingStatus = loadJsonFile(statusFilepath)
        processingStatus[unprocessedFile]['processed'] = True
        saveJsonFile(processingStatus, statusFilepath)
        
        printStatus(f"\nFile {unprocessedFile} marked as processed!", Fore.GREEN)
        return True

    except Exception as e:
        printStatus(f"Error processing file {unprocessedFile}: {str(e)}", Fore.RED)
        return False

def readProfileData():
    try:
        # Get data directory from environment variable
        dataDir = getEnvPath('DATA_SPLIT_DIR', 'linkedinData')
        statusFilepath = os.path.join(dataDir, 'processingStatus.json')
        if not os.path.exists(statusFilepath):
            printStatus("Error: processingStatus.json not found!", Fore.RED)
            return

        while True:
            # Read current status
            processingStatus = loadJsonFile(statusFilepath)

            # Find the first unprocessed file
            unprocessedFile = None
            for filename, status in processingStatus.items():
                if not status['processed']:
                    unprocessedFile = filename
                    break

            if not unprocessedFile:
                printStatus("\nAll files have been processed!", Fore.GREEN)
                break

            # Process the file
            success = processFile(unprocessedFile, statusFilepath)
            if not success:
                printStatus("\nError occurred. Stopping processing.", Fore.RED)
                break

            # Add a small delay between files
            import time
            time.sleep(2)

    except FileNotFoundError:
        printStatus("Error: File not found!", Fore.RED)
    except Exception as e:
        printStatus(f"An error occurred: {str(e)}", Fore.RED)

if __name__ == "__main__":
    readProfileData() 