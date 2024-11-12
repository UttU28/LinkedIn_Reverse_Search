import subprocess 
from time import sleep
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
import socket

# PTATH_TILL_PROJECT = 'C:/Users/utsav/OneDrive/Desktop/LinkedIn_Reverse_Search/'
PTATH_TILL_PROJECT = "C:/Users/UtsavChaudhary/OneDrive - EDGE196/Desktop/LinkedIn_Reverse_Search/"
chromeDriverPath = f'{PTATH_TILL_PROJECT}backend/chromeDriver/chromedriver.exe'

options = Options()
options.add_experimental_option("debuggerAddress", "localhost:8989")
options.add_argument(f"webdriver.chrome.driver={chromeDriverPath}")
options.add_argument("--disable-notifications")
options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
options.add_argument("window-size=1920x1080")

async def isChromeRunning():
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    result = sock.connect_ex(('localhost', 8989))
    sock.close()
    return result != 0

async def prepareChromeAndSelenium():
    if await isChromeRunning():
        subprocess.Popen([
            'C:/Program Files/Google/Chrome/Application/chrome.exe',
            '--remote-debugging-port=8989',
            f'--user-data-dir={PTATH_TILL_PROJECT}backend/chromeData/'
        ])
    driver = webdriver.Chrome(options=options)
    return driver
