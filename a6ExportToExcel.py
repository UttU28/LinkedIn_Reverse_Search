import pandas as pd
import json
from datetime import datetime
from colorama import init, Fore, Style
from dotenv import load_dotenv
import os

init()
load_dotenv()

def printStatus(message: str, color: str = Fore.WHITE):
    print(f"{color}{message}{Style.RESET_ALL}")

def convertJsonToExcel():
    try:
        # Get consolidated data file name from environment variable
        consolidatedFile = os.getenv('CONSOLIDATED_DATA_FILE', 'consolidatedLinkedinData.json')
        with open(consolidatedFile, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        df = pd.DataFrame(data)
        
        df = df.fillna("")
        
        initialCount = len(df)
        if 'Full Name' in df.columns and 'Company Name' in df.columns:
            df = df.drop_duplicates(subset=['Full Name', 'Company Name'], keep='first')
            printStatus(f"Removed {initialCount - len(df)} duplicate entries", Fore.CYAN)
        else:
            df = df.drop_duplicates()
            printStatus(f"Removed {initialCount - len(df)} duplicate entries", Fore.CYAN)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        outputFile = f'linkedin_data_{timestamp}.xlsx'
        
        df.to_excel(outputFile, index=False, sheet_name='LinkedIn Data')
        
        printStatus(f"Successfully converted to Excel: {outputFile}", Fore.GREEN)
        printStatus(f"Final count: {len(df)} unique entries", Fore.WHITE)
        
    except FileNotFoundError:
        printStatus(f"Error: {consolidatedFile} not found!", Fore.RED)
    except Exception as e:
        printStatus(f"An error occurred: {str(e)}", Fore.RED)

if __name__ == "__main__":
    convertJsonToExcel()