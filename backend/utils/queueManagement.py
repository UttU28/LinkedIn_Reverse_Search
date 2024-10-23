import json
import os
from datetime import datetime
from utils.fileActions import readJson, writeJson

def addEntryToQueue(email, name, location, status='pending', filename='data.json'):
    if not os.path.isfile(filename):
        with open(filename, 'w') as f:
            json.dump({}, f)
    with open(filename, 'r') as f:
        data = json.load(f)

    timestamp = datetime.now().isoformat()

    newEntry = {
        timestamp: {
            'name': name,
            'email': email,
            'location': location,
            'status': status
        }
    }

    if email in data:
        data[email].update(newEntry)  # Add new timestamp entry
    else:
        data[email] = newEntry  # Create new user entry
    with open(filename, 'w') as f:
        json.dump(data, f, indent=4)

    return timestamp

async def checkQueueAndChangeStatus(queueID, email, status='waiting'):
    allData = readJson("data.json")
    

# one function to change status of the specific id event to waiting and changing at the end , so 2 function :)

