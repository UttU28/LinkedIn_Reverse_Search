import json
import os
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup
import aiofiles
import asyncio

try: from utils.seleniumManager import *
except: from seleniumManager import *
try: from utils.getJson import getMeJsonData, findClosestMatch
except: from getJson import getMeJsonData, findClosestMatch

from aExcel2json import splitFullName

async def companyScrapingLinkedIn(thisDriver, allItems):
    try:
        currentUrl = allItems['currentUrl']
        thisDriver.get(currentUrl)
        WebDriverWait(thisDriver, 5).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "section.artdeco-card.pv-profile-card.break-words"))
        )
        htmlContent = thisDriver.page_source
        soup = BeautifulSoup(htmlContent, 'html.parser')
        mainHeader = soup.select_one("div.mt2.relative")
        fullName = mainHeader.select_one("h1.text-heading-xlarge").get_text().strip()
        companyPosition = mainHeader.select_one("div.text-body-medium").get_text().strip()
        companyLocation = mainHeader.select_one("span.text-body-small.inline").get_text().strip()

        sectionList = soup.select("section.artdeco-card.pv-profile-card.break-words")
        for section in sectionList:
            experienceDiv = section.select_one("div.pv-profile-card__anchor")
            if experienceDiv and experienceDiv.get('id') == 'experience':
                jobDataList = []
                ulElements = section.find_all('ul')
                if ulElements:
                    listElements = ulElements[0].find_all('li')
                    for li in listElements:
                        liClass = li.get('class', [])
                        if 'artdeco-list__item' in liClass:
                            jobData = await getMeJsonData(str(li))
                            jobDataList.append(jobData)
                    thisData = jobDataList[0]
                    thisData['fullName'] = fullName
                    spliData = splitFullName(fullName)
                    thisData['firstName'], thisData['lastName'] = spliData['firstName'], spliData['lastName']
                    thisData['companyPosition'] = companyPosition
                    thisData['companyLocation'] = companyLocation
                    thisData['currentUrl'] = currentUrl
                    thisData['company'] = allItems['company']
                    return thisData
        return None
    except Exception as e:
        print(f"Error in readLinkedInProfile: {e}")
        return None


async def appendToJsonFile(file_path, data):
    if os.path.exists(file_path):
        async with aiofiles.open(file_path, 'r') as file:
            existing_data = json.loads(await file.read())
    else:
        existing_data = {}
    existing_data.update(data)
    async with aiofiles.open(file_path, 'w') as file:
        await file.write(json.dumps(existing_data, indent=4))


async def readTheJsonFile(file_path):
    if os.path.exists(file_path):
        async with aiofiles.open(file_path, 'r') as file:
            existing_data = json.loads(await file.read())
            return existing_data