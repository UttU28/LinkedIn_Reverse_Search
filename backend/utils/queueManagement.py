import json
import os
from utils.fileActions import readJson, writeJson
import logging

async def addEntryToQueue(email, firstName, location, timeStamp, status='pending', fileName='data/data.json'):
    logging.info(f"Adding entry for firstName: {firstName}, email: {email}")
    newEntry = { 
        timeStamp: { 
            'firstName': firstName, 
            'email': email, 
            'location': location, 
            'status': status 
        }
    }

    if not os.path.isfile(fileName):
        with open(fileName, 'w') as f:
            json.dump({}, f)
    data = await readJson(fileName)

    if email in data:
        data[email].update(newEntry) 
    else:
        data[email] = newEntry 
    await writeJson(fileName, data)

    logging.info(f"Entry added for {firstName}, timestamp: {timeStamp}")
    return timeStamp


async def changeQueueStatus(queueID, email, status='waiting', fileName='data/data.json'):
    print(queueID, email)
    queueID = str(queueID)
    data = await readJson(fileName)
    # print(data)
    data[email][queueID]['status'] = status
    await writeJson(fileName, data)
