import json
import time
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

    for entry in data:
        if entry['hasViewed'] == False:
            entry['hasViewed'] = True
            companyName, lastName, firstName = entry['company'], entry['lastName'], entry['firstName']
            # print(companyName, lastName, firstName)
            thisData = scrapeDataFrom(driver, companyName, lastName, firstName)
            print(thisData)
            if thisData:
                entry['companyName'], entry['companyPosition'], entry['companyLocation'], entry['currentUrl'], entry['found'] = thisData['companyName'], thisData['companyPosition'], thisData['companyLocation'], thisData['currentUrl'], True
            else:
                entry['found'] = False

            
            writeJson(file_path, data)

file_path = 'output.json'  
processJson(file_path)
