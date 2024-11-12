import json
import os
from utils.fileActions import readJson, writeJson
import logging

async def addEntryToQueue(email, fileName, location, timeStamp, status='pending', thisFileName='data/data.json'):
    logging.info(f"Adding entry for fileName: {fileName}, email: {email}")
    newEntry = { 
        timeStamp: { 
            'fileName': fileName, 
            'email': email, 
            'location': location, 
            'status': status 
        }
    }

    if not os.path.isfile(thisFileName):
        with open(thisFileName, 'w') as f:
            json.dump({}, f)
    data = await readJson(thisFileName)

    if email in data:
        data[email].update(newEntry) 
    else:
        data[email] = newEntry 
    await writeJson(thisFileName, data)

    logging.info(f"Entry added for {fileName}, timestamp: {timeStamp}")
    return timeStamp


async def changeQueueStatus(queueID, email, status='waiting', fileName='data/data.json'):
    print(queueID, email)
    queueID = str(queueID)
    data = await readJson(fileName)
    # print(data)
    data[email][queueID]['status'] = status
    await writeJson(fileName, data)
