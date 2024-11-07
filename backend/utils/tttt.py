import subprocess 
from time import sleep
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup
import json
from tqdm import tqdm


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
            # f'--user-data-dir={PTATH_TILL_PROJECT}backend/agamSir/'
            f'--user-data-dir={PTATH_TILL_PROJECT}backend/chromeData/'
        ])
    driver = webdriver.Chrome(options=options)
    return driver

def checkDuplicate(data):
    if data is None:
        return ""
    if data[:len(data)//2] == data[len(data)//2:]:
        data = data[:len(data)//2]
    return data.strip()

def getMeJsonData(htmlContent):
    li_element = BeautifulSoup(htmlContent, 'html.parser')
    companyPosition = None
    companyName = None

    mainTags = li_element.find_all('div', class_='display-flex flex-wrap align-items-center full-height')
    if len(mainTags) > 1:
        companyName = mainTags[0].find('div', class_='display-flex').get_text(strip=True)
        companyPosition = mainTags[1].find('div', class_='display-flex').get_text(strip=True)
    else:
        positionTag = li_element.find('div', class_='display-flex align-items-center mr1 t-bold')
        if positionTag:
            companyPosition = positionTag.get_text(strip=True)
        
        company_info_tag = li_element.find('span', class_='t-14 t-normal')
        if company_info_tag:
            company_info = company_info_tag.get_text(strip=True)
            company_info_parts = company_info.split(' · ')
            companyName = company_info_parts[0] if company_info_parts else None

    jobData = {
        "companyName": checkDuplicate(companyName),
        "companyPosition": checkDuplicate(companyPosition)
    }
    
    return jobData

def scrapeMembersFromLinkedIn(thisDriver, searchUrl, currentPage, membersDict):
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
                                membersDict[profileUrl] = {"fullName": fullName, "location": location}
                        except:
                            pass
            except:
                continue

        # Save membersDict to JSON file after each page scrape
        with open("linkedin_members.json", "w") as json_file:
            json.dump(membersDict, json_file, indent=4)

        scrapeMembersFromLinkedIn(thisDriver, searchUrl, currentPage + 1, membersDict)

    except Exception as e:
        print(f"Error on page {currentPage}: {e}")

def getCompanyFor(thisDriver, linkedInUrl):
    try:
        thisDriver.get(linkedInUrl)

        # Wait until the experience section or some other unique profile element is present
        WebDriverWait(thisDriver, 10).until(
            EC.presence_of_element_located((By.CLASS_NAME, 'pv-profile-card'))
        )
        
        # Additional short delay
        sleep(0.2)

        htmlContent = thisDriver.page_source
        soup = BeautifulSoup(htmlContent, 'html.parser')
        sectionList = soup.select("section.artdeco-card.pv-profile-card.break-words")

        jobDataList = []
        for section in sectionList:
            experienceDiv = section.select_one("div.pv-profile-card__anchor")
            if experienceDiv and experienceDiv.get('id') == 'experience':
                ulElements = section.find_all('ul')
                if ulElements:
                    listElements = ulElements[0].find_all('li')
                    i = 0
                    for li in listElements:
                        i += 1
                        if i >= 2: continue
                        liClass = li.get('class', [])
                        if 'artdeco-list__item' in liClass:
                            jobData = getMeJsonData(str(li))
                            jobDataList.append(jobData)
        
        if jobDataList:
            try:
                with open("linkedin_members.json", "r") as json_file:
                    membersDict = json.load(json_file)
            except FileNotFoundError:
                membersDict = {}

            if linkedInUrl in membersDict:
                membersDict[linkedInUrl]["jobDataList"] = jobDataList
            else:
                membersDict[linkedInUrl] = {"jobDataList": jobDataList}

            with open("linkedin_members.json", "w") as json_file:
                json.dump(membersDict, json_file, indent=4)
                
    except Exception as e:
        pass
        # print(f"Error fetching data for {linkedInUrl}: {e}")


if __name__ == "__main__":
    driver = prepareChromeAndSelenium(True)
    siteUrl = "https://www.linkedin.com/search/results/people/?geoUrn=%5B103644278%2C90000070%2C102095887%5D&keywords=real%20estate%20tokenization&origin=FACETED_SEARCH&page="

    try:
        with open("linkedin_members.json", "r") as json_file:
            membersDict = json.load(json_file)
    except FileNotFoundError:
        membersDict = {}

    # scrapeMembersFromLinkedIn(driver, siteUrl, 1, membersDict)
    for linkedInUrl, data in tqdm(membersDict.items(), desc="Processing LinkedIn URLs"):
        if "jobDataList" in data: continue
        getCompanyFor(driver, linkedInUrl)
    driver.quit()
