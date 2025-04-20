import pandas as pd
import json
from datetime import datetime
from colorama import init, Fore, Style
from dotenv import load_dotenv
import os
from service.utils import printStatus, getEnvPath, loadJsonFile

init()
load_dotenv()

def ensureDirectoryExists(dirPath):
    """Ensure the directory exists, creating it and all parent directories if needed."""
    if not os.path.exists(dirPath):
        os.makedirs(dirPath, exist_ok=True)
        printStatus(f"Created directory: {dirPath}", Fore.GREEN)

def convertJsonToExcel():
    try:
        # Get consolidated data file name from environment variable
        consolidatedFile = getEnvPath('CONSOLIDATED_DATA_FILE', 'data/consolidatedLinkedinData.json')
        
        # Check if the file exists
        if not os.path.exists(consolidatedFile):
            printStatus(f"Error: {consolidatedFile} not found!", Fore.RED)
            return
            
        # Load the data
        data = loadJsonFile(consolidatedFile)
        if not data:
            printStatus("No data found in the consolidated file.", Fore.YELLOW)
            return
            
        df = pd.DataFrame(data)
        
        df = df.fillna("")
        
        initialCount = len(df)
        if 'Full Name' in df.columns and 'Company Name' in df.columns:
            df = df.drop_duplicates(subset=['Full Name', 'Company Name'], keep='first')
            printStatus(f"Removed {initialCount - len(df)} duplicate entries", Fore.CYAN)
        else:
            df = df.drop_duplicates()
            printStatus(f"Removed {initialCount - len(df)} duplicate entries", Fore.CYAN)
        
        # Create output directory
        outputDir = "data/exports"
        ensureDirectoryExists(outputDir)
        
        # Generate filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        outputFile = os.path.join(outputDir, f'linkedin_data_{timestamp}.xlsx')
        
        df.to_excel(outputFile, index=False, sheet_name='LinkedIn Data')
        
        printStatus(f"Successfully converted to Excel: {outputFile}", Fore.GREEN)
        printStatus(f"Final count: {len(df)} unique entries", Fore.WHITE)
        
    except FileNotFoundError:
        printStatus(f"Error: {consolidatedFile} not found!", Fore.RED)
    except Exception as e:
        printStatus(f"An error occurred: {str(e)}", Fore.RED)

if __name__ == "__main__":
    convertJsonToExcel()