import requests
import json
from time import sleep
import random  # Import random module

def makeAPIRequest(linkedInUrl):
    API_TOKEN = "ZAuOYiUjklVmhWoVVUKqoXzboZ9XSQ7s"

    url = f"https://api-public.salesql.com/v1/persons/enrich/?linkedin_url={linkedInUrl}"

    headers = {
        "accept": "application/json",
        "Authorization": f"Bearer {API_TOKEN}"
    }

    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        data = response.json()
        companyUrl = ''
        emails = list(map(lambda x: x['email'], data['emails'])) if data.get('emails') else []
        phones = list(map(lambda x: x['phone'], data['phones'])) if data.get('phones') else []
        companyUrl = data.get('organization', {}).get('website', '')
        return emails, phones, companyUrl
    else:
        return [], [], ''

def readJson(file_path):
    with open(file_path, 'r') as file:
        return json.load(file)

def writeJson(file_path, data):
    with open(file_path, 'w') as file:
        json.dump(data, file, indent=4)

def processJson(file_path):
    data = readJson(file_path)

    for i, entry in enumerate(data):
        if entry.get('found') and not entry.get('called'):
                currentUrl = entry.get('currentUrl')
                if currentUrl:
                    allEmail, allPhone, companyUrl = makeAPIRequest(currentUrl)

                    entry['email0'] = allEmail[0] if len(allEmail) > 0 else None
                    entry['email1'] = allEmail[1] if len(allEmail) > 1 else None
                    entry['phone'] = allPhone[0] if len(allPhone) > 0 else None
                    entry['companyUrl'] = companyUrl or ''
                    entry['called'] = True

                    writeJson(file_path, data)
                    print(f"Updated entry {i + 1} in the file")

                    sleep(random.uniform(9, 12))

file_path = 'output.json'
processJson(file_path)
