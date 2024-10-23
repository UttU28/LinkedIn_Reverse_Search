import json
from tqdm import tqdm
from utils.workingSelenium import prepareChromeAndSelenium, scrapeDataFrom
from utils.fileActions import readJson, writeJson

# chromeProcess, driver = prepareChromeAndSelenium()

async def getLinkedInFor(thisGuy):
    if not thisGuy.get('hasViewed', False):
        thisGuy['hasViewed'] = True
        companyName, lastName, firstName = thisGuy['company'], thisGuy['lastName'], thisGuy['firstName']
        # thisData = scrapeDataFrom(driver, companyName, lastName, firstName)
        thisData = {'currentUrl': 'curl', 'companyPosition': 'cposition', 'companyLocation': 'clocation'}
        if thisData:
            thisGuy['currentUrl'] = thisData['currentUrl']
            thisGuy['companyName'] = thisData.get('companyName', '')
            thisGuy['companyPosition'] = thisData.get('companyPosition', '')
            thisGuy['companyLocation'] = thisData.get('companyLocation', '')
            thisGuy['found'] = True
        else:
            thisGuy['found'] = False
    return thisGuy
