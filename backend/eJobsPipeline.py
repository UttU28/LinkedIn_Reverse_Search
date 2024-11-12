import asyncio
import os
import socket
import json
from tqdm import tqdm 
from time import sleep

from aExcel2json import scrapeDataFromExcel
from bSeleniumWorker import getLinkedInFor, prepareChromeAndSelenium
from cSalesQL_API import getEmailAndPhoneFor
from dConvertExcel import makeExcelForThisSession

from utils.queueManagement import changeQueueStatus, addEntryToQueue
from utils.fileActions import readJson, writeJson
from utils.bulkLinkedInScraper import *


THE_DATA_FILE = 'data/data.json'

thisChromeDriver = None

async def writeDataToJson(refinedData):
    currentSessionData = {}
    global_session_data = {}

    if os.path.exists('data/currentSession.json'):
        with open('data/currentSession.json', 'r') as f:
            currentSessionData = json.load(f)

    if os.path.exists('data/globalSession.json'):
        with open('data/globalSession.json', 'r') as f:
            global_session_data = json.load(f)

    fullName = refinedData.get('fullName')

    if fullName not in currentSessionData:
        currentSessionData[fullName] = refinedData
    if fullName not in global_session_data:
        global_session_data[fullName] = refinedData

    with open('data/currentSession.json', 'w') as f:
        json.dump(currentSessionData, f, indent=4)
    with open('data/globalSession.json', 'w') as f:
        json.dump(global_session_data, f, indent=4)

async def oneProcessOne(queueOne, queueTwo):
    global thisChromeDriver 
    while True:
        jsonData = await queueOne.get()
        if jsonData is None:
            break
        try:
            for item in jsonData:
                result = await getLinkedInFor(thisChromeDriver, item)
                await queueTwo.put(result)
        except Exception as e:
            print(f"Error processing item {item}: {e}")
        finally:
            queueOne.task_done()

async def twoProcessOne(queueOne, queueTwo):
    global thisChromeDriver 
    while True:
        jsonData = await queueOne.get()
        if jsonData is None:
            break
        try:
            for item in jsonData:
                result = await scrapeDataFromLinkedIn(thisChromeDriver, item)
                await queueTwo.put(result)
        except Exception as e:
            print(f"Error processing item {item}: {e}")
        finally:
            queueOne.task_done()

async def oneProcessTwo(queueTwo):
    while True:
        baseData = await queueTwo.get()
        if baseData is None:
            break

        refinedData = await getEmailAndPhoneFor(baseData)
        await writeDataToJson(refinedData)
        queueTwo.task_done()

async def processZero(queueOne, excelFileName):
    # CHACK: QUEUE IF ANY ACTIVE, 
    jsonData = scrapeDataFromExcel(excelFileName)
    with open('data/output.json', 'w') as json_file:
        json_file.write(json.dumps(jsonData, indent=4))

    await queueOne.put(jsonData)

async def statusMonitor(queueOne, queueTwo, totalItems):
    with tqdm(total=totalItems, desc="Process 1 Progress", 
               bar_format="{l_bar}{bar}| {n_fmt}/{total_fmt} completed", 
               leave=True, ascii=True) as pbarOne, \
         tqdm(total=totalItems, desc="Process 2 Progress", 
               bar_format="{l_bar}{bar}| {n_fmt}/{total_fmt} completed", 
               leave=True, ascii=True) as pbarTwo:
        
        while True:
            sizeOne = queueOne.qsize()
            sizeTwo = queueTwo.qsize()

            completedTasksOne = totalItems - sizeOne
            completedTasksTwo = totalItems - sizeTwo

            pbarOne.n = completedTasksOne
            pbarTwo.n = completedTasksTwo
            pbarOne.refresh()
            pbarTwo.refresh()

            if completedTasksOne >= totalItems and completedTasksTwo >= totalItems:
                break

            await asyncio.sleep(1)


async def extractFromExcel(email, excelFileName, timeStamp, sendNotification):
    try:
        timeStamp = str(timeStamp)
        # await writeJson(THE_DATA_FILE,{})
        await writeJson('data/currentSession.json',{})
        await writeJson('data/output.json',{})

        global thisChromeDriver
        thisChromeDriver = await prepareChromeAndSelenium()

        await changeQueueStatus(timeStamp, email)
        queueOne = asyncio.Queue()
        queueTwo = asyncio.Queue()
        totalItems = len('jsonData')


        # Start Process 0
        p0 = asyncio.create_task(processZero(queueOne, excelFileName))
        p1 = asyncio.create_task(oneProcessOne(queueOne, queueTwo))
        p2 = asyncio.create_task(oneProcessTwo(queueTwo))
        monitor = asyncio.create_task(statusMonitor(queueOne, queueTwo, totalItems))

        await p0  # Wait for Process 0 to finish
        await queueOne.join()
        await queueOne.put(None)
        
        await queueTwo.join()
        await queueTwo.put(None)

        await p1
        await p2
        monitor.cancel()

        sleep(1)
        fileLocation = await makeExcelForThisSession(timeStamp)
        currentQueue = await readJson(THE_DATA_FILE)
        currentQueue[email][timeStamp]['status'] = 'finished'
        currentQueue[email][timeStamp]['newLocation'] = fileLocation
        await writeJson(THE_DATA_FILE, currentQueue)
        await sendNotification(email, "Data scraping completed successfully!", 'notif')
    except Exception as e:
        print(f"An error occurred: {e}")
        currentQueue = await readJson(THE_DATA_FILE)
        currentQueue[email][timeStamp]['status'] = 'error'
        await writeJson(THE_DATA_FILE, currentQueue)
        await sendNotification(email, "An error occurred during data scraping.", 'notif')
    finally:
        if thisChromeDriver:
            await thisChromeDriver.quit()

async def scrapeFromLinkedIn(email, searchUrl, timeStamp, sendNotification):
    try:
        timeStamp = str(timeStamp)
        # await writeJson(THE_DATA_FILE,{})
        await writeJson('data/currentSession.json',{})
        await writeJson('data/output.json',{})

        global thisChromeDriver
        thisChromeDriver = await prepareChromeAndSelenium()

        await changeQueueStatus(timeStamp, email)

        print(email, searchUrl, timeStamp)
        await sendNotification(email, f"{email} {searchUrl}", 'notif')


        await scrapeDataFromLinkedIn(thisChromeDriver, searchUrl)

        sleep(1)
        fileLocation = await makeExcelForThisSession(timeStamp)
        currentQueue = await readJson(THE_DATA_FILE)
        currentQueue[email][timeStamp]['status'] = 'finished'
        currentQueue[email][timeStamp]['newLocation'] = fileLocation
        await writeJson(THE_DATA_FILE, currentQueue)
        await sendNotification(email, "Data scraping completed successfully!", 'notif')
    except Exception as e:
        print(f"An error occurred: {e}")
        currentQueue = await readJson(THE_DATA_FILE)
        currentQueue[email][timeStamp]['status'] = 'error'
        await writeJson(THE_DATA_FILE, currentQueue)
        await sendNotification(email, "An error occurred during data scraping.", 'notif')
    finally:
        if thisChromeDriver:
            await thisChromeDriver.quit()


async def companyFromLinkedIn(email, excelFileName, timeStamp, sendNotification):
    # Make 2 processes, for this called twoProcess1 process0 will be same as the 
    # try:
        timeStamp = str(timeStamp)
        # await writeJson(THE_DATA_FILE,{})
        await writeJson('data/currentSession.json',{})
        await writeJson('data/output.json',{})

        global thisChromeDriver
        thisChromeDriver = await prepareChromeAndSelenium()

        await changeQueueStatus(timeStamp, email)
        queueOne = asyncio.Queue()
        queueTwo = asyncio.Queue()
        totalItems = len('jsonData')


        # Start Process 0
        p0 = asyncio.create_task(processZero(queueOne, excelFileName))
        p1 = asyncio.create_task(oneProcessOne(queueOne))
        monitor = asyncio.create_task(statusMonitor(queueOne, queueTwo, totalItems))

        await p0  # Wait for Process 0 to finish
        await queueOne.join()
        await queueOne.put(None)
        

        await p1
        monitor.cancel()
