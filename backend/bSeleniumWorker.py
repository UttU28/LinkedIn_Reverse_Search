import json
import time
from tqdm import tqdm
from utils.workingSelenium import prepareChromeAndSelenium, scrapeDataFrom
from utils.fileActions import readJson, writeJson
import asyncio

THIS_FILE_PATH = 'output.json'

chromeProcess, driver = prepareChromeAndSelenium()

async def processJson(THIS_FILE_PATH):
    data = await readJson(THIS_FILE_PATH)
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

            await writeJson(THIS_FILE_PATH, data)

if __name__ == '__main__':
    asyncio.run(processJson(THIS_FILE_PATH))
