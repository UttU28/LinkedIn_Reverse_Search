import asyncio
import json
import aiofiles

lock = asyncio.Lock()  # Create a global lock

async def readJson(THIS_FILE_PATH):
    async with lock:  # Ensure exclusive access
        try:
            async with aiofiles.open(THIS_FILE_PATH, 'r') as file:
                contents = await file.read()
                return json.loads(contents)
        except: return False

async def writeJson(THIS_FILE_PATH, data):
    async with lock:
        async with aiofiles.open(THIS_FILE_PATH, 'w') as file:
            await file.write(json.dumps(data, indent=4))
