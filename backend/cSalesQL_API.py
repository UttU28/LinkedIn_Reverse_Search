import requests
import json
from time import sleep
import random
from tqdm import tqdm  # Import tqdm for progress bar
import asyncio

from utils.fileActions import readJson, writeJson
THIS_FILE_PATH = 'output.json'

async def makeAPIRequest(linkedInUrl):
    API_TOKEN = "ZAuOYiUjklVmhWoVVUKqoXzboZ9XSQ7s"

    url = f"https://api-public.salesql.com/v1/persons/enrich/?linkedin_url={linkedInUrl}"

    headers = {
        "accept": "application/json",
        "Authorization": f"Bearer {API_TOKEN}"
    }

    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        data = response.json()
        emails = list(map(lambda x: x['email'], data['emails'])) if data.get('emails') else []
        phones = list(map(lambda x: x['phone'], data['phones'])) if data.get('phones') else []
        companyUrl = data.get('organization', {}).get('website', '')
        return emails, phones, companyUrl
    else:
        return [], [], ''

async def processJson(THIS_FILE_PATH):
    data = await readJson(THIS_FILE_PATH)

    # Use tqdm to create a progress bar
    for i, entry in tqdm(enumerate(data), total=len(data), desc="Processing Entries"):
        if entry.get('found') and not entry.get('called'):
            currentUrl = entry.get('currentUrl')
            if currentUrl:
                allEmail, allPhone, companyUrl = await makeAPIRequest(currentUrl)

                entry['email0'] = allEmail[0] if len(allEmail) > 0 else None
                entry['email1'] = allEmail[1] if len(allEmail) > 1 else None
                entry['phone'] = allPhone[0] if len(allPhone) > 0 else None
                entry['companyUrl'] = companyUrl or ''
                entry['called'] = True

                await writeJson(THIS_FILE_PATH, data)
                await asyncio.sleep(random.uniform(9, 12))

if __name__ == '__main__':
    asyncio.run(processJson(THIS_FILE_PATH))
