import os
import shutil
from tqdm import tqdm

def remove_pycache_dirs(root_dir):
    pycache_dirs = []

    # First, gather all __pycache__ directories
    for dirpath, dirnames, filenames in os.walk(root_dir):
        for dirname in dirnames:
            if dirname == '__pycache__':
                pycache_dirs.append(os.path.join(dirpath, dirname))

    # Remove the gathered __pycache__ directories with a progress bar
    for dir_to_remove in tqdm(pycache_dirs, desc='Removing __pycache__ directories', unit='dir'):
        shutil.rmtree(dir_to_remove)

if __name__ == "__main__":
    # Specify the directory you want to clean up
    directory_to_clean = '/'
    remove_pycache_dirs(directory_to_clean)
