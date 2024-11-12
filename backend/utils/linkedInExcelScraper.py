from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup
from collections import defaultdict

try: from utils.getJson import getMeJsonData, findClosestMatch
except: from getJson import getMeJsonData, findClosestMatch

try: from utils.seleniumManager import *
except: from seleniumManager import *

async def checkMaybeLinkedIn(thisDriver, companyName, linkedInUrl):
    try:
        thisDriver.get(linkedInUrl)
        WebDriverWait(thisDriver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "section.artdeco-card.pv-profile-card.break-words"))
            )
        htmlContent = thisDriver.page_source
        thisData = await readLinkedInProfile(linkedInUrl, htmlContent, companyName)
        return thisData
    except:
        return {'currentUrl': linkedInUrl}
    
    
async def readLinkedInProfile(currentUrl, htmlContent, companyName):
    try:
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
        # Return a consistent structure if no data is found
        return {'currentUrl': currentUrl, 'companyName': None, 'companyPosition': None, 'companyLocation': None}
    except Exception as e:
        print(f"Error in readLinkedInProfile: {e}")
        return {'currentUrl': currentUrl, 'companyName': None, 'companyPosition': None, 'companyLocation': None}


async def getSingleLinkedIn(thisDriver, companyName, lastName, firstName):
    thisDriver.get(f"https://www.linkedin.com/search/results/people/?company={companyName}&firstName={firstName}&lastName={lastName}&origin=FACETED_SEARCH")
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
                    if liElements:
                        liElements[0].click()
                        sleep(2)
                        currentUrl = thisDriver.current_url
                        htmlContent = thisDriver.page_source
                        thisData = await readLinkedInProfile(currentUrl, htmlContent, companyName)
                        return thisData
            except:
                continue
    except Exception as e:
        print(f"Error in LinkedIn search: {e}")
    
    # Fallback in case no LinkedIn profile is found in the main search
    joinedCompanyName = '+'.join(companyName.split(' '))
    joinedFirstName = '+'.join(firstName.split(' '))
    joinedLastName = '+'.join(lastName.split(' '))
    query = f'"{joinedFirstName}"+"{joinedLastName}"+"{joinedCompanyName}"+linkedin+profile'
    
    try:
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
                    if 'linkedin.com/in/' in href and '/posts/' not in href:
                        linkCounter[href] += 1
            except: 
                pass

        if linkCounter:
            theLink, _count = max(linkCounter.items(), key=lambda x: x[1])
            return {'maybeUrl': theLink}

    except Exception as e:
        print(f"Error during Google search fallback: {e}")

    # Return None to indicate no result if neither LinkedIn nor Google results are available
    return {'currentUrl': None, 'companyName': None, 'companyPosition': None, 'companyLocation': None}
