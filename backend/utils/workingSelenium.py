import subprocess 
from time import sleep
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup
from collections import defaultdict
from fuzzywuzzy import fuzz
try: from utils.getJson import getMeJsonData
except: from getJson import getMeJsonData
import asyncio
import json

async def normalizeString(s):
    return ' '.join(s.lower().strip().split())

async def findClosestMatch(inputString, data):
    normalInput = await normalizeString(inputString)
    potential_matches = {}
    
    for index, entry in enumerate(data):
        normalCompanyName = await normalizeString(entry['companyName'])
        input_components = normalInput.split()
        if normalCompanyName in normalInput or normalInput in normalCompanyName:
            return data[index]
        elif all(comp in normalCompanyName for comp in input_components):
            return data[index]
        elif normalInput.replace(" ", "") in normalCompanyName.replace(" ", ""):
            return data[index]

        match_score = fuzz.partial_ratio(normalCompanyName, normalInput)
        if match_score > 50:
            potential_matches[index] = match_score

    if potential_matches:
        best_match_index = max(potential_matches, key=potential_matches.get)
        return data[best_match_index]
    return {}


# PTATH_TILL_PROJECT = 'C:/Users/utsav/OneDrive/Desktop/LinkedIn_Reverse_Search/'
PTATH_TILL_PROJECT = "C:/Users/UtsavChaudhary/OneDrive - EDGE196/Desktop/LinkedIn_Reverse_Search/"
chromeDriverPath = f'{PTATH_TILL_PROJECT}backend/chromeDriver/chromedriver.exe'

options = Options()
options.add_experimental_option("debuggerAddress", "localhost:8989")
options.add_argument(f"webdriver.chrome.driver={chromeDriverPath}")
options.add_argument("--disable-notifications")
options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
options.add_argument("window-size=1920x1080")


def prepareChromeAndSelenium(wantChrome):
    if wantChrome:
        subprocess.Popen([
            'C:/Program Files/Google/Chrome/Application/chrome.exe',
            '--remote-debugging-port=8989',
            f'--user-data-dir={PTATH_TILL_PROJECT}backend/agamSir/'
        ])
    # chromeProcess = ''
    driver = webdriver.Chrome(options=options)
    return driver

async def readLinkedInProfile(thisDriver, companyName):
    try:
        currentUrl = thisDriver.current_url
        htmlContent = thisDriver.page_source
        soup = BeautifulSoup(htmlContent, 'html.parser')
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
                    thisData = await findClosestMatch(companyName, jobDataList)
                    thisData['currentUrl'] = currentUrl
                    return thisData
        return {'currentUrl': currentUrl}
    except:
        return {'currentUrl': currentUrl}

async def findPersonOnChrome(thisDriver, companyName, lastName, firstName):
    joinedCompanyName = '+'.join(companyName.split(' '))
    joinedFirstName = '+'.join(firstName.split(' '))
    joinedLastName = '+'.join(lastName.split(' '))
    query = f'"{joinedFirstName}"+"{joinedLastName}"+"{joinedCompanyName}"+linkedin+profile'
    
    thisDriver.get(f"https://www.google.com/search?q={query}")
    
    srContainer = WebDriverWait(thisDriver, 5).until(
        EC.presence_of_element_located((By.ID, 'search'))
    )
    searchContainer = WebDriverWait(srContainer, 5).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, '[data-async-context]'))
    )

    childDivs = searchContainer.find_elements(By.TAG_NAME, 'div')
    linkCounter = defaultdict(int)
    
    for div in childDivs:
        try:
            link_element = div.find_element(By.TAG_NAME, 'a')
            if link_element:
                href = link_element.get_attribute('href')
                if 'www.linkedin.com' in href and '/posts/' not in href:
                    linkCounter[href] += 1
        except:
            pass

    # print("\nLink Occurrences:")
    if linkCounter:
        theLink, _count = max(linkCounter.items(), key=lambda x: x[1])
        driver.get(theLink)
        thisData = await readLinkedInProfile(thisDriver, companyName)
        return thisData
    return None


async def scrapeDataFromLinkedIn(thisDriver, companyName, lastName, firstName):
    thisDriver.get(f"https://www.linkedin.com/search/results/people/?company={companyName}&firstName={firstName}&lastName={lastName}&origin=FACETED_SEARCH")
    srContainer = WebDriverWait(thisDriver, 5).until(
        EC.presence_of_element_located((By.CLASS_NAME, 'search-results-container'))
    )

    childDivs = srContainer.find_elements(By.TAG_NAME, 'div')

    for div in childDivs:
        try:
            ulElement = div.find_element(By.CSS_SELECTOR, "ul.reusable-search__entity-result-list")
            if ulElement:
                liElements = ulElement.find_elements(By.CSS_SELECTOR, "li.reusable-search__result-container")
                if liElements:
                    liElements[0].click()
                    # THIS IS AFTER CLICKING ON THE PERSON
                    sleep(2)
                    return await readLinkedInProfile(thisDriver, companyName)
                else: return await findPersonOnChrome(thisDriver, companyName, lastName, firstName)
            else: return None
        except: continue
    return await findPersonOnChrome(thisDriver, companyName, lastName, firstName)  


async def scrapeMembersFromLinkedIn(thisDriver, searchUrl, currentPage, membersDict):
    thisDriver.get(searchUrl + str(currentPage) + '&sid=-4y')
    try:
        srContainer = WebDriverWait(thisDriver, 5).until(
            EC.presence_of_element_located((By.CLASS_NAME, 'search-results-container'))
        )

        try:
            srContainer.find_element(By.CLASS_NAME, 'search-reusable-search-no-results')
            return
        except:
            pass

        childDivs = srContainer.find_elements(By.TAG_NAME, 'div')
        for div in childDivs:
            try:
                ulElement = div.find_element(By.CSS_SELECTOR, "ul.reusable-search__entity-result-list")
                if ulElement:
                    ulElements = ulElement.find_elements(By.CSS_SELECTOR, "li.reusable-search__result-container")
                    for eachPerson in ulElements:
                        try:
                            fullName = eachPerson.find_element(By.CLASS_NAME, "entity-result__title-text").text.strip().split("\n")[0]
                            thisPerson = eachPerson.find_element(By.CLASS_NAME, "entity-result__universal-image")
                            profileUrl = thisPerson.find_element(By.TAG_NAME, 'a').get_attribute('href').split('?miniProfileUrn')[0]
                            location = eachPerson.find_element(By.CLASS_NAME, 'entity-result__secondary-subtitle').text.strip()
                            if 'www.linkedin.com/in/' in profileUrl:
                                membersDict[fullName] = {"profileUrl": profileUrl, "location": location}
                                with open("linkedin_members.json", "a") as json_file:
                                    json_file.write(json.dumps({fullName: membersDict[fullName]}) + "\n")
                        except:
                            pass
            except:
                continue

        await scrapeMembersFromLinkedIn(thisDriver, searchUrl, currentPage + 1, membersDict)

    except Exception as e:
        print(f"Error on page {currentPage}: {e}")

async def getCompanyFor(thisDriver, linkedInUrl):
    try:
        currentUrl = thisDriver.get(linkedInUrl)
        htmlContent = thisDriver.page_source
        soup = BeautifulSoup(htmlContent, 'html.parser')
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
                    thisData = {}
                    thisData['jobDataList'] = jobDataList
                    thisData['currentUrl'] = currentUrl
                    print(thisData)
        return {'currentUrl': currentUrl}
    except:
        return {'currentUrl': currentUrl}
    

if __name__ == "__main__":
    driver = prepareChromeAndSelenium(True)
    siteUrl = "https://www.linkedin.com/search/results/people/?geoUrn=%5B103644278%2C90000070%2C102095887%5D&keywords=real%20estate%20tokenization&origin=FACETED_SEARCH&page="

    try:
        with open("linkedin_members.json", "r") as json_file:
            membersDict = {k: v for line in json_file for k, v in json.loads(line).items()}
    except FileNotFoundError:
        membersDict = {}

    # asyncio.run(scrapeMembersFromLinkedIn(driver, siteUrl, 1, membersDict))
    asyncio.run(getCompanyFor(driver, 'https://www.linkedin.com/in/kellieharvell/'))

    driver.quit()
