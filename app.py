import os
import sys
import subprocess
import time
import shutil
from dotenv import load_dotenv

def clean_data_directories():
    """Clean all data directories except for exports before running scripts."""
    print(f"\n{'=' * 50}")
    print("Cleaning data directories...")
    print(f"{'=' * 50}\n")
    
    # Get directory paths from environment variables
    data_split_dir = os.getenv("DATA_SPLIT_DIR", "data/linkedinData")
    search_results_dir = os.getenv("SEARCH_RESULTS_DIR", "data/searchResults")
    openai_responses_dir = os.getenv("OPENAI_RESPONSES_DIR", "data/openaiResponses")
    consolidated_data_file = os.getenv("CONSOLIDATED_DATA_FILE", "data/consolidatedLinkedinData.json")
    
    # Directories to clean
    directories = [data_split_dir, search_results_dir, openai_responses_dir]
    
    # Clean directories
    for directory in directories:
        if os.path.exists(directory):
            print(f"Cleaning directory: {directory}")
            try:
                # Remove all files in directory
                for file in os.listdir(directory):
                    file_path = os.path.join(directory, file)
                    if os.path.isfile(file_path):
                        os.unlink(file_path)
                    elif os.path.isdir(file_path):
                        shutil.rmtree(file_path)
            except Exception as e:
                print(f"Error cleaning directory {directory}: {e}")
        else:
            print(f"Creating directory: {directory}")
            os.makedirs(directory, exist_ok=True)
    
    # Remove consolidated data file if it exists
    if os.path.exists(consolidated_data_file):
        print(f"Removing file: {consolidated_data_file}")
        try:
            os.unlink(consolidated_data_file)
        except Exception as e:
            print(f"Error removing file {consolidated_data_file}: {e}")
    
    # Ensure parent directory of consolidated file exists
    os.makedirs(os.path.dirname(consolidated_data_file), exist_ok=True)
    
    print("Data directories cleaned successfully.\n")

def run_script(script_name):
    """Run a Python script and return True if it completes successfully."""
    print(f"\n{'=' * 50}")
    print(f"Running {script_name}...")
    print(f"{'=' * 50}\n")
    
    try:
        result = subprocess.run([sys.executable, script_name], check=True)
        print(f"\n{script_name} completed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"\nError running {script_name}: {e}")
        return False
    except Exception as e:
        print(f"\nUnexpected error running {script_name}: {e}")
        return False

def main():
    # Load environment variables from .env file
    load_dotenv()
    
    # Clean data directories before running scripts
    clean_data_directories()
    
    # List of scripts to run in order
    scripts = [
        "a1SplitContactData.py",
        "a2SearchLinkedinProfiles.py",
        "a3ExtractLinkedinUrls.py",
        "a4MergeSearchResults.py",
        "a5ConsolidateProfileData.py",
        "a6ExportToExcel.py"
    ]
    
    # Run each script in sequence
    for script in scripts:
        start_time = time.time()
        success = run_script(script)
        end_time = time.time()
        
        # Print execution time
        elapsed_time = end_time - start_time
        print(f"Time taken: {elapsed_time:.2f} seconds")
        
        if not success:
            print(f"\nExecution stopped due to failure in {script}")
            sys.exit(1)
    
    print("\n✅ All scripts executed successfully!")

if __name__ == "__main__":
    main() 