import subprocess 
from time import sleep
import json
import random
from utils.getJson import getMeJsonData, findClosestMatch
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup  # Ensure you have this import

chromeDriverPath = 'C:/Users/utsav/OneDrive/Desktop/LinkedIn_Reverse_Search/chromeDriver/chromedriver.exe'

options = Options()
options.add_experimental_option("debuggerAddress", "localhost:8989")
options.add_argument(f"webdriver.chrome.driver={chromeDriverPath}")
options.add_argument("--disable-notifications")
options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
options.add_argument("window-size=1920x1080")

def getDataFromFile():
    try:
        with open('data/baseData.json', 'r') as jsonFile:
            allEventData = json.load(jsonFile)
    except FileNotFoundError:
        allEventData = {}
    return allEventData

def putDataToFile(taazaMaal):
    with open('data/baseData.json', 'w') as jsonFile:
        json.dump(taazaMaal, jsonFile, indent=4)

def prepareChromeAndSelenium():
    chromeProcess = subprocess.Popen([
        'C:/Program Files/Google/Chrome/Application/chrome.exe',
        '--remote-debugging-port=8989',
        '--user-data-dir=C:/Users/utsav/OneDrive/Desktop/LinkedIn_Reverse_Search/chromeData/'
    ])
    # chromeProcess = ''
    driver = webdriver.Chrome(options=options)
    return chromeProcess, driver

def runSelenium(thisDriver, mainLink):
    thisDriver.get(f"{mainLink}")
    sleep(random.uniform(0.5, 2.5))

def countParents(element):
    count = 0
    while element:
        element = element.find_element(By.XPATH(".."))
        if element.getAttribute('tagName') == 'section':
            return count
        count += 1
    return count

def scrapeDataFrom(thisDriver, companyToFind):
    srContainer = WebDriverWait(thisDriver, 10).until(
        EC.presence_of_element_located((By.CLASS_NAME, 'search-results-container'))
    )

    childDivs = srContainer.find_elements(By.TAG_NAME, 'div')
    print(f"Number of child divs in 'search-results-container': {len(childDivs)}")

    for div in childDivs:
        try:
            ulElement = div.find_element(By.CSS_SELECTOR, "ul.reusable-search__entity-result-list")
            if ulElement:
                liElements = ulElement.find_elements(By.CSS_SELECTOR, "li.reusable-search__result-container")
                print(f"Number of <li> elements in this <ul>: {len(liElements)}")
                
                if liElements:
                    liElements[0].click()
                    sleep(2)

                    currentUrl = thisDriver.current_url
                    # currentUrl = 'https://www.linkedin.com/in/johnjdagostino1/'
                    print(f"Redirected URL: {currentUrl}")

                    sectionList = thisDriver.find_elements(By.CSS_SELECTOR, "section.artdeco-card.pv-profile-card.break-words")
                    print(f"Number of sections found: {len(sectionList)}")

                    for section in sectionList:
                        try:
                            experienceDiv = section.find_element(By.ID, 'experience')
                            jobDataList = []
                            if experienceDiv:
                                print('IM EXP')
                                ulElements = section.find_elements(By.TAG_NAME, 'ul')
                                listElements = ulElements[0].find_elements(By.TAG_NAME, 'li')

                                for li in listElements:
                                    liClass = li.get_attribute("class")
                                    if 'artdeco-list__item' in liClass:
                                        jobData = getMeJsonData(li.get_attribute('innerHTML'))
                                        jobDataList.append(jobData)

                                thisData = findClosestMatch(companyToFind, jobDataList)
                                return thisData
                        except Exception:
                            continue  
                    break  
        except:
            continue  

