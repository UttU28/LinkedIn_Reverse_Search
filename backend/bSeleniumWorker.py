from utils.workingSelenium import *

async def getLinkedInFor(driver, thisGuy):
    companyName, lastName, firstName = thisGuy['company'], thisGuy['lastName'], thisGuy['firstName']
    thisData = await scrapeDataFromLinkedIn(driver, companyName, lastName, firstName)
    # thisData = {'currentUrl': 'curl', 'companyPosition': 'cposition', 'companyLocation': 'clocation'}
    if thisData:
        thisGuy['currentUrl'] = thisData['currentUrl']
        thisGuy['companyName'] = thisData.get('companyName', '')
        thisGuy['companyPosition'] = thisData.get('companyPosition', '')
        thisGuy['companyLocation'] = thisData.get('companyLocation', '')
    else:
        thisGuy['currentUrl'] = None
        thisGuy['companyName'] = companyName
        thisGuy['companyPosition'] = ''
        thisGuy['companyLocation'] = ''
    return thisGuy