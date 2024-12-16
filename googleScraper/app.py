import argparse
import subprocess
import json
import socket
from time import sleep
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from collections import defaultdict
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from plyer import notification  # Import for notifications

PTATH_TILL_PROJECT = 'C:/Users/UtsavChaudhary/OneDrive - EDGE196/Desktop/LinkedIn_Reverse_Search/'

chromeDriverPath = f'{PTATH_TILL_PROJECT}backend/chromeDriver/chromedriver.exe'

options = Options()
options.add_experimental_option("debuggerAddress", "localhost:8990")
options.add_argument(f"webdriver.chrome.driver={chromeDriverPath}")
options.add_argument("--disable-notifications")
options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
options.add_argument("window-size=1920x1080")

def isChromeRunning():
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    result = sock.connect_ex(('localhost', 8990))
    sock.close()
    return result != 0

def prepareChromeAndSelenium():
    if isChromeRunning():
        subprocess.Popen([
            'C:/Program Files/Google/Chrome/Application/chrome.exe',
            '--remote-debugging-port=8990',
            f'--user-data-dir={PTATH_TILL_PROJECT}backend/agamSir/'
        ])
    driver = webdriver.Chrome(options=options)
    return driver

def getSingleLinkedIn(thisDriver, companyName, lastName, firstName):
    query = f'"{firstName} {lastName}" "{companyName}" site:linkedin.com/in/'
    try:
        thisDriver.get(f"https://www.google.com/search?q={query.replace(' ', '+')}")
                
        if "id=\"captcha-form\"" in thisDriver.page_source: 
            print("\nCAPTCHA detected. Attempting to resolve...")
            try:
                recaptcha_frame = WebDriverWait(thisDriver, 5).until(
                    EC.presence_of_element_located((By.XPATH, "//iframe[contains(@title, 'reCAPTCHA')]"))
                )
                thisDriver.switch_to.frame(recaptcha_frame)
                checkbox = WebDriverWait(thisDriver, 5).until(
                    EC.element_to_be_clickable((By.CLASS_NAME, "recaptcha-checkbox-border"))
                )
                checkbox.click()
                thisDriver.switch_to.default_content()
                sleep(5)

                while "id=\"captcha-form\"" in thisDriver.page_source:
                    print("Waiting for CAPTCHA to be resolved...")
                    notification.notify(
                        title="CAPTCHA Detected",
                        message="Please solve the CAPTCHA manually in the browser window.",
                        app_name="LinkedIn Scraper",
                        timeout=10
                    )
                    sleep(5)

                print("CAPTCHA successfully resolved. Continuing...")

            except Exception as e:
                notification.notify(
                    title="CAPTCHA Detected",
                    message="CAPTCHA could not be resolved automatically. Please solve it manually.",
                    app_name="LinkedIn Scraper",
                    timeout=10
                )
                print("\nCAPTCHA could not be resolved automatically. Please solve it in the browser window.")
                while "id=\"captcha-form\"" in thisDriver.page_source:
                    print("Waiting for CAPTCHA to be resolved...")
                    sleep(5)  # Wait for 5 seconds before checking again


        srContainer = WebDriverWait(thisDriver, 4).until(
            EC.presence_of_element_located((By.ID, 'search'))
        )
        searchContainer = WebDriverWait(srContainer, 4).until(
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
                continue

        if linkCounter:
            theLink, _count = max(linkCounter.items(), key=lambda x: x[1])
            return theLink

    except Exception as e:
        print(f"Error during search")
        return None


def processAllEntries(dataFile):
    driver = prepareChromeAndSelenium()

    try:
        with open(dataFile, 'r') as file:
            data = json.load(file)

        total = len(data)
        found_count = 0
        not_found_count = 0
        error_count = 0

        for person in data:
            if not person.get("hasViewed", False):
                try:
                    result = getSingleLinkedIn(
                        driver,
                        person["company"],
                        person["lastName"],
                        person["firstName"]
                    )

                    if result:
                        person["hasViewed"] = True
                        person["currentUrl"] = result
                        found_count += 1
                    else:
                        not_found_count += 1

                except Exception:
                    error_count += 1

                with open(dataFile, 'w') as file:
                    json.dump(data, file, indent=4)
                print(f"\rTotal: {total} | Found: {found_count} | Not Found: {not_found_count} | Errors: {error_count}", end="", flush=True)
                # sleep(1)

        print(f"\n\nSummary:")
        print(f"Total Profiles: {total}")
        print(f"Found: {found_count}")
        print(f"Not Found: {not_found_count}")
        print(f"Errors: {error_count}")

    except Exception as e:
        print(f"Error processing entries")

    finally:
        driver.quit()

# Run the main function
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="LinkedIn Profile Scraper")
    parser.add_argument("batchNumber", type=int, help="Specify the batch number, e.g., 5 for batch_5.json")
    args = parser.parse_args()
    batchFileName = f'myBatch/batch_{args.batchNumber}.json'

    processAllEntries(batchFileName)

