import json
import os
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import aiofiles
import asyncio

try: from utils.seleniumManager import *
except: from seleniumManager import *


# async def checkMaybeLinkedIn(thisDriver, linkedInUrl):
    # try:
    #     thisDriver.get(linkedInUrl)
    #     WebDriverWait(thisDriver, 10).until(
    #         EC.presence_of_element_located((By.CSS_SELECTOR, "section.artdeco-card.pv-profile-card.break-words"))
    #     )
    #     htmlContent = thisDriver.page_source
    #     thisData = await readLinkedInProfile(linkedInUrl, htmlContent)
    #     return thisData
    # except:
    #     return {'currentUrl': linkedInUrl}


# async def readLinkedInProfile(currentUrl, htmlContent):
#     try:
#         soup = BeautifulSoup(htmlContent, 'html.parser')
#         sectionList = soup.select("section.artdeco-card.pv-profile-card.break-words")
#         for section in sectionList:
#             experienceDiv = section.select_one("div.pv-profile-card__anchor")
#             if experienceDiv and experienceDiv.get('id') == 'experience':
#                 jobDataList = []
#                 ulElements = section.find_all('ul')
#                 if ulElements:
#                     listElements = ulElements[0].find_all('li')
#                     for li in listElements:
#                         liClass = li.get('class', [])
#                         if 'artdeco-list__item' in liClass:
#                             jobData = await getMeJsonData(str(li))
#                             jobDataList.append(jobData)
#                     thisData = await findClosestMatch(companyName, jobDataList)
#                     thisData['currentUrl'] = currentUrl
#                     return thisData
#         return {'currentUrl': currentUrl, 'companyName': None, 'companyPosition': None, 'companyLocation': None}
#     except Exception as e:
#         print(f"Error in readLinkedInProfile: {e}")
#         return {'currentUrl': currentUrl, 'companyName': None, 'companyPosition': None, 'companyLocation': None}
#     # thisData = await readLinkedInProfile(currentUrl, htmlContent)


async def scrapeDataFromLinkedIn(thisDriver, searchUrl):
    thisDriver.get(searchUrl)
    
    try:
        allData = {}
        
        while True:
            try:
                srContainer = WebDriverWait(thisDriver, 5).until(
                    EC.presence_of_element_located((By.CLASS_NAME, 'search-results-container'))
                )
                childDivs = srContainer.find_elements(By.TAG_NAME, 'div')
                for div in childDivs:
                    try:
                        ulElement = div.find_element(By.CSS_SELECTOR, "ul.reusable-search__entity-result-list")
                        if ulElement:
                            liElements = ulElement.find_elements(By.CSS_SELECTOR, "li.reusable-search__result-container")
                            for li in liElements:
                                try:
                                    dataBlock = li.find_element(By.CLASS_NAME, "entity-result__title-text")
                                    thisABlock = dataBlock.find_element(By.TAG_NAME, 'a')
                                    linkedInUrl = thisABlock.get_attribute('href').split('?mini')[0].strip()
                                    linkedInUser = thisABlock.text.split('View')[0].strip()
                                    allData[linkedInUrl] = {'fullName': linkedInUser}
                                except: continue
                                # WORK ON THIS CURRESNTSESSION JSON FILE
                            await appendToJsonFile('currentSession.json', allData)
                    except: continue

                bottomContainer = thisDriver.find_element(By.CLASS_NAME, 'artdeco-pagination--has-controls')
                nextButton = bottomContainer.find_element(By.CSS_SELECTOR, 'button[aria-label="Next"]')
                
                if 'disabled' in nextButton.get_attribute('class'):
                    print("Reached the last page.")
                    return 1
                
                nextButton.click()
                await asyncio.sleep(0.5)

            except Exception as e:
                print(f"Error in LinkedIn search or pagination: {e}")
                break
        
        currentData = await readTheJsonFile('currentSession.json')
        return currentData

                
    except Exception as e:
        print(f"Error in LinkedIn search setup: {e}")



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