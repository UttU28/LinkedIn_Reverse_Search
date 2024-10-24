import json
import os
from utils.fileActions import readJson, writeJson

async def addEntryToQueue(email, name, location, timeStamp, status='pending', fileName='data/data.json'):
    if not os.path.isfile(fileName):
        with open(fileName, 'w') as f:
            json.dump({}, f)
    data = await readJson(fileName)

    newEntry = { timeStamp: { 'name': name, 'email': email, 'location': location, 'status': status } }

    if email in data:
        data[email].update(newEntry) 
    else:
        data[email] = newEntry 

    await writeJson(fileName, data)
    return timeStamp

async def changeQueueStatus(queueID, email, status='waiting', fileName='data/data.json'):
    print(queueID, email)
    data = await readJson(fileName)
    print(data)
    data[email][queueID]['status'] = status
    await writeJson(fileName, data)
