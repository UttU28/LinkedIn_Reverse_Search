import pandas as pd
import math
import os
import json
from colorama import init, Fore, Style
from dotenv import load_dotenv
from service.utils import printStatus, getEnvPath, saveJsonFile

init()
load_dotenv()

def ensureDirectoryExists(dirPath):
    """Ensure the directory exists, creating it and all parent directories if needed."""
    if not os.path.exists(dirPath):
        os.makedirs(dirPath, exist_ok=True)
        printStatus(f"Created directory: {dirPath}", Fore.GREEN)

def splitContactData(inputFilename=None):
    try:
        # Get input file from environment variable or use default
        if inputFilename is None:
            inputFilename = getEnvPath('DATA_INPUT_DIR', 'people.csv')
        
        # Ensure data directory exists
        dataDir = os.path.dirname(inputFilename)
        if dataDir:
            ensureDirectoryExists(dataDir)
            
        encodings = ['utf-8', 'latin1', 'iso-8859-1', 'cp1252']
        df = None
        
        for encoding in encodings:
            try:
                df = pd.read_csv(inputFilename, encoding=encoding)
                printStatus(f"Successfully read file with {encoding} encoding", Fore.GREEN)
                break
            except UnicodeDecodeError:
                continue
            except FileNotFoundError:
                printStatus(f"Warning: Input file {inputFilename} not found. Will continue with empty DataFrame.", Fore.YELLOW)
                df = pd.DataFrame(columns=['Full Name', 'Company', 'Position'])
                break
        
        if df is None:
            raise Exception("Could not read the CSV file with any of the attempted encodings")
            
        entriesPerPage = 100
        totalEntries = len(df)
        totalPages = math.ceil(totalEntries / entriesPerPage) if totalEntries > 0 else 0
        
        printStatus(f"\nTotal entries: {totalEntries}", Fore.CYAN)
        printStatus(f"Creating {totalPages} files with {entriesPerPage} entries each", Fore.CYAN)
        printStatus("-"*80, Fore.WHITE)
        
        # Get output directory from environment variable
        baseDir = getEnvPath('DATA_SPLIT_DIR', 'data/linkedinData')
        ensureDirectoryExists(baseDir)
        
        processingStatus = {}
        
        for pageNum in range(totalPages):
            startIdx = pageNum * entriesPerPage
            endIdx = min((pageNum + 1) * entriesPerPage, totalEntries)
            
            pageData = df.iloc[startIdx:endIdx]
            
            filename = f'profile_batch_{pageNum + 1}.csv'
            filepath = os.path.join(baseDir, filename)
            
            pageData.to_csv(filepath, index=False, encoding='utf-8')
            printStatus(f"Created {filepath} with {len(pageData)} entries", Fore.GREEN)
            
            processingStatus[filename] = {
                "processed": False,
                "entries": len(pageData),
                "createdAt": pd.Timestamp.now().isoformat()
            }
        
        statusFilepath = os.path.join(baseDir, 'processingStatus.json')
        with open(statusFilepath, 'w', encoding='utf-8') as f:
            json.dump(processingStatus, f, indent=4)
        
        printStatus("\nAll files have been created successfully!", Fore.GREEN)
        printStatus(f"Files are saved in the '{baseDir}' directory", Fore.WHITE)
        printStatus(f"Files are named as: profile_batch_1.csv to profile_batch_{totalPages}.csv", Fore.WHITE)
        printStatus(f"Processing status saved to: {statusFilepath}", Fore.WHITE)

    except FileNotFoundError:
        printStatus(f"Error: {inputFilename} file not found!", Fore.RED)
    except Exception as e:
        printStatus(f"An error occurred: {str(e)}", Fore.RED)

if __name__ == "__main__":
    inputFile = getEnvPath('DATA_INPUT_DIR', 'people.csv')
    splitContactData(inputFile) 