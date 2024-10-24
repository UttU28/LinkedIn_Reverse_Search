import subprocess 
from time import sleep
import json
import random
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup
from utils.getJson import getMeJsonData, findClosestMatch
import pygetwindow as gw
import psutil


chromeDriverPath = 'C:/Users/UtsavChaudhary/OneDrive - EDGE196/Desktop/LinkedIn_Reverse_Search/chromeDriver/chromedriver.exe'
chromeDriverPath = 'C:/Users/utsav/OneDrive/Desktop/LinkedIn_Reverse_Search/backend/chromeDriver/chromedriver.exe'

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
            '--user-data-dir=C:/Users/utsav/OneDrive/Desktop/LinkedIn_Reverse_Search/backend/chromeData/'
        ])
    # chromeProcess = ''
    driver = webdriver.Chrome(options=options)
    return driver


async def scrapeDataFrom(thisDriver, companyName, lastName, firstName):
    thisDriver.get(f"https://www.linkedin.com/search/results/people/?company={companyName}&firstName={firstName}&lastName={lastName}&origin=FACETED_SEARCH")
    srContainer = WebDriverWait(thisDriver, 10).until(
        EC.presence_of_element_located((By.CLASS_NAME, 'search-results-container'))
    )

    childDivs = srContainer.find_elements(By.TAG_NAME, 'div')
    # print(f"Number of child divs in 'search-results-container': {len(childDivs)}")

    for div in childDivs:
        try:
            ulElement = div.find_element(By.CSS_SELECTOR, "ul.reusable-search__entity-result-list")
            if ulElement:
                liElements = ulElement.find_elements(By.CSS_SELECTOR, "li.reusable-search__result-container")
                if liElements:
                    liElements[0].click()

                    # THIS IS AFTER CLICKING ON THE PERSON
                    sleep(2)

                    currentUrl = thisDriver.current_url
                    htmlContent = thisDriver.page_source
                    soup = BeautifulSoup(htmlContent, 'html.parser')
                    sectionList = soup.select("section.artdeco-card.pv-profile-card.break-words")
                    # print(f"Number of sections found: {len(sectionList)}")

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
                else:
                    return None
            else:
                return None
        except:
            continue  
