import json
import time
from tqdm import tqdm
from utils.workingSelenium import prepareChromeAndSelenium, scrapeDataFrom

chromeProcess, driver = prepareChromeAndSelenium()

def readJson(file_path):
    with open(file_path, 'r') as file:
        return json.load(file)

def writeJson(file_path, data):
    with open(file_path, 'w') as file:
        json.dump(data, file, indent=4)

def processJson(file_path):
    data = readJson(file_path)

    # Use tqdm to create a progress bar
    for entry in tqdm(data, desc="Processing entries"):
        if not entry['hasViewed']:
            entry['hasViewed'] = True
            companyName, lastName, firstName = entry['company'], entry['lastName'], entry['firstName']
            thisData = scrapeDataFrom(driver, companyName, lastName, firstName)
            if thisData:
                entry['currentUrl'] = thisData['currentUrl']
                try:
                    entry['companyName'] = thisData['companyName']
                    entry['companyPosition'] = thisData['companyPosition']
                    entry['companyLocation'] = thisData['companyLocation']
                except:
                    entry['companyName'] = ''
                    entry['companyPosition'] = ''
                    entry['companyLocation'] = ''
                entry['found'] = True
            else:
                entry['found'] = False

            writeJson(file_path, data)

file_path = 'output.json'  
processJson(file_path)
