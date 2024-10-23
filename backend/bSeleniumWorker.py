from utils.workingSelenium import *

async def getLinkedInFor(driver, thisGuy):
    print(thisGuy)
    if not thisGuy.get('hasViewed', False):
        thisGuy['hasViewed'] = True
        companyName, lastName, firstName = thisGuy['company'], thisGuy['lastName'], thisGuy['firstName']
        thisData = await scrapeDataFrom(driver, companyName, lastName, firstName)
        print(thisData)
        # thisData = {'currentUrl': 'curl', 'companyPosition': 'cposition', 'companyLocation': 'clocation'}
        if thisData:
            thisGuy['currentUrl'] = thisData['currentUrl']
            thisGuy['companyName'] = thisData.get('companyName', '')
            thisGuy['companyPosition'] = thisData.get('companyPosition', '')
            thisGuy['companyLocation'] = thisData.get('companyLocation', '')
            thisGuy['found'] = True
        else:
            thisGuy['found'] = False
    return thisGuy
