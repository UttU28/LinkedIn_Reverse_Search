import os

def createInitialDirs():
    dir_names = ['uploads', 'downloads', 'data']

    for name in dir_names:
        try:
            os.makedirs(name, exist_ok=True)
            print(f"Created directory: {name}")
        except Exception as e:
            print(f"Error creating directory {name}: {e}")

    for name in dir_names:
        if os.path.isdir(name):
            print(f"{name} exists.")
        else:
            print(f"{name} does not exist.")
