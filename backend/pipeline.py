import asyncio
from tqdm import tqdm
from aExcel2json import scrapeDataFromExcel
from bSeleniumWorker import processJson
import json

async def processOne(queueOne, queueTwo):
    while True:
        item = await queueOne.get()
        if item is None:
            break
        await result = asyncio.run(processJson('output.json'))
        result = f"Processed {item}"
        await queueTwo.put(result)
        queueOne.task_done()

async def processTwo(queueTwo):
    while True:
        result = await queueTwo.get()
        if result is None:
            break
        await asyncio.sleep(4)
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
    # items = inputString.split(',')
    excelFile = 'People.xlsx'
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

    print("\nTask finished")

if __name__ == "__main__":
    inputData = "task1,task2,task3,task4,task5"
    asyncio.run(main(inputData))
