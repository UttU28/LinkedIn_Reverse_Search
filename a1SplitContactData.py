import pandas as pd
import math
import os
import json
from colorama import init, Fore, Style
from dotenv import load_dotenv

init()
load_dotenv()

def printStatus(message: str, color: str = Fore.WHITE):
    print(f"{color}{message}{Style.RESET_ALL}")

def splitContactData(inputFilename=None):
    try:
        # Get input file from environment variable or use default
        if inputFilename is None:
            inputFilename = os.getenv('DATA_INPUT_DIR', 'people.csv')
            
        encodings = ['utf-8', 'latin1', 'iso-8859-1', 'cp1252']
        df = None
        
        for encoding in encodings:
            try:
                # Read the CSV file with different encoding
                df = pd.read_csv(inputFilename, encoding=encoding)
                printStatus(f"Successfully read file with {encoding} encoding", Fore.GREEN)
                break
            except UnicodeDecodeError:
                continue
        
        if df is None:
            raise Exception("Could not read the CSV file with any of the attempted encodings")
        # Calculate number of pages needed
        entriesPerPage = 100
        totalEntries = len(df)
        totalPages = math.ceil(totalEntries / entriesPerPage)
        
        printStatus(f"\nTotal entries: {totalEntries}", Fore.CYAN)
        printStatus(f"Creating {totalPages} files with {entriesPerPage} entries each", Fore.CYAN)
        printStatus("-"*80, Fore.WHITE)
        
        # Get output directory from environment variable or use default
        baseDir = os.getenv('DATA_SPLIT_DIR', 'linkedinData')
        if not os.path.exists(baseDir):
            os.makedirs(baseDir)
        
        # Dictionary to store file processing status
        processingStatus = {}
        
        # Split and save data into multiple files
        for pageNum in range(totalPages):
            startIdx = pageNum * entriesPerPage
            endIdx = min((pageNum + 1) * entriesPerPage, totalEntries)
            
            # Get the chunk of data for this page
            pageData = df.iloc[startIdx:endIdx]
            
            # Create filename with page number in the directory
            filename = f'profile_batch_{pageNum + 1}.csv'
            filepath = os.path.join(baseDir, filename)
            
            # Save to CSV
            pageData.to_csv(filepath, index=False, encoding='utf-8')
            printStatus(f"Created {filepath} with {len(pageData)} entries", Fore.GREEN)
            
            # Add to processing status
            processingStatus[filename] = {
                "processed": False,
                "entries": len(pageData),
                "createdAt": pd.Timestamp.now().isoformat()
            }
        
        # Save processing status to JSON file
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
    # Read input file from environment variable or use default
    inputFile = os.getenv('DATA_INPUT_DIR', 'people.csv')
    splitContactData(inputFile)  # Pass the filename to the function 