import requests
import json
import aiohttp

async def makeAPIRequest(linkedInUrl):
    API_TOKEN = "ZAuOYiUjklVmhWoVVUKqoXzboZ9XSQ7s-55555"

    url = f"https://api-public.salesql.com/v1/persons/enrich/?linkedin_url={linkedInUrl}"

    headers = {
        "accept": "application/json",
        "Authorization": f"Bearer {API_TOKEN}"
    }

    async with aiohttp.ClientSession() as session:
        async with session.get(url, headers=headers) as response:
            if response.status == 200:
                data = await response.json()
                emails = list(map(lambda x: x['email'], data['emails'])) if data.get('emails') else []
                phones = list(map(lambda x: x['phone'], data['phones'])) if data.get('phones') else []
                companyUrl = data.get('organization', {}).get('website', '')
                return emails, phones, companyUrl
            else:
                return [], [], ''

async def getEmailAndPhoneFor(thisGuy):
    if thisGuy.get('found') and not thisGuy.get('called'):
        currentUrl = thisGuy.get('currentUrl')
        if currentUrl:
            # allEmail, allPhone, companyUrl = await makeAPIRequest(currentUrl)  # Await the API request
            allEmail, allPhone, companyUrl = '','',''
            thisGuy['email0'] = allEmail[0] if len(allEmail) > 0 else None
            thisGuy['email1'] = allEmail[1] if len(allEmail) > 1 else None
            thisGuy['phone'] = allPhone[0] if len(allPhone) > 0 else None
            thisGuy['companyUrl'] = companyUrl or ''
            thisGuy['called'] = True

    return thisGuy
