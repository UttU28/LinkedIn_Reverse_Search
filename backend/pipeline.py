import asyncio, os
from tqdm import tqdm
from time import sleep

from aExcel2json import scrapeDataFromExcel
from bSeleniumWorker import getLinkedInFor
from cSalesQL_API import getEmailAndPhoneFor
from dConvertExcel import makeExcelForThisSession

import json

async def writeDataToJson(refinedData):
    currentSessionData = {}
    global_session_data = {}

    if os.path.exists('currentSession.json'):
        with open('currentSession.json', 'r') as f:
            currentSessionData = json.load(f)

    if os.path.exists('globalSession.json'):
        with open('globalSession.json', 'r') as f:
            global_session_data = json.load(f)

    fullName = refinedData.get('fullName')

    if fullName not in currentSessionData: currentSessionData[fullName] = refinedData
    if fullName not in global_session_data: global_session_data[fullName] = refinedData

    with open('currentSession.json', 'w') as f: json.dump(currentSessionData, f, indent=4)
    with open('globalSession.json', 'w') as f: json.dump(global_session_data, f, indent=4)


async def processOne(queueOne, queueTwo):
    while True:
        item = await queueOne.get()
        if item is None:
            break
        try:
            result = await getLinkedInFor(item)
            await queueTwo.put(result)
        except Exception as e:
            print(f"Error processing item {item}: {e}")
        finally:
            queueOne.task_done()

async def processTwo(queueTwo):
    while True:
        baseData = await queueTwo.get()
        if baseData is None: break

        refinedData = await getEmailAndPhoneFor(baseData)
        await writeDataToJson(refinedData)

        # await asyncio.sleep(4)
        queueTwo.task_done()

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

async def main(inputString):
    excelFile = inputString
    jsonData = scrapeDataFromExcel(excelFile)
    with open('output.json', 'w') as json_file:
        json_file.write(json.dumps(jsonData, indent=4))
    
    queueOne = asyncio.Queue()
    queueTwo = asyncio.Queue()
    totalItems = len(jsonData)

    p1 = asyncio.create_task(processOne(queueOne, queueTwo))
    p2 = asyncio.create_task(processTwo(queueTwo))
    monitor = asyncio.create_task(statusMonitor(queueOne, queueTwo, totalItems))

    for item in jsonData:
        await queueOne.put(item)

    await queueOne.join()
    await queueOne.put(None)
    
    await queueTwo.join()
    await queueTwo.put(None)

    await p1
    await p2
    monitor.cancel()

    sleep(2)
    await makeExcelForThisSession()

    print("\nTask finished")

if __name__ == "__main__":
    inputData = "People.xlsx"
    asyncio.run(main(inputData))
    
