import os
from colorama import init, Fore, Style
from dotenv import load_dotenv

# Initialize colorama and load environment variables
init()
load_dotenv()

def printStatus(message: str, color: str = Fore.WHITE):
    """
    Print a colorized status message using colorama.
    
    Args:
        message (str): The message to print
        color (str): The color to use (from colorama.Fore)
    """
    print(f"{color}{message}{Style.RESET_ALL}")

def loadJsonFile(filepath: str) -> dict:
    """
    Load JSON data from a file with error handling.
    
    Args:
        filepath (str): Path to the JSON file
        
    Returns:
        dict: The loaded JSON data or empty dict if error
    """
    try:
        import json
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        printStatus(f"Error loading JSON file {filepath}: {str(e)}", Fore.RED)
        return {}

def saveJsonFile(data: dict, filepath: str, pretty: bool = True) -> bool:
    """
    Save data to a JSON file with error handling.
    
    Args:
        data (dict): Data to save
        filepath (str): Path to save the file
        pretty (bool): Whether to format JSON with indentation
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        import json
        with open(filepath, 'w', encoding='utf-8') as f:
            if pretty:
                json.dump(data, f, indent=2, ensure_ascii=False)
            else:
                json.dump(data, f, ensure_ascii=False)
        return True
    except Exception as e:
        printStatus(f"Error saving JSON file {filepath}: {str(e)}", Fore.RED)
        return False

def getEnvPath(env_var: str, default_path: str) -> str:
    """
    Get a file or directory path from environment variables with a default.
    
    Args:
        env_var (str): The environment variable name
        default_path (str): Default path to use if env var not found
        
    Returns:
        str: The path from environment or default
    """
    return os.getenv(env_var, default_path) 