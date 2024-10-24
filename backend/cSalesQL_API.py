import aiohttp

import aiohttp
from urllib.parse import quote

async def makeAPIRequest(linkedInUrl):
    API_TOKEN = "ZAuOYiUjklVmhWoVVUKqoXzboZ9XSQ7s"
    
    # URL encode the LinkedIn URL
    url = f"https://api-public.salesql.com/v1/persons/enrich/?linkedin_url={linkedInUrl}"

    headers = {
        "accept": "application/json",
        "Authorization": f"Bearer {API_TOKEN}"
    }

    async with aiohttp.ClientSession() as session:
        async with session.get(url, headers=headers) as response:
            if response.status == 200:
                data = await response.json()
                emails = list(map(lambda x: x['email'], data.get('emails', [])))
                phones = list(map(lambda x: x['phone'], data.get('phones', [])))
                companyUrl = data.get('organization', {}).get('website', '')
                return emails, phones, companyUrl
            else:
                # print(f"Error: {response.status}")
                return [], [], ''

async def getEmailAndPhoneFor(thisGuy):
    currentUrl = thisGuy.get('currentUrl')
    if currentUrl:
        allEmail, allPhone, companyUrl = await makeAPIRequest(currentUrl)
        # allEmail, allPhone, companyUrl = '','',''
        thisGuy['email0'] = allEmail[0] if len(allEmail) > 0 else None
        thisGuy['email1'] = allEmail[1] if len(allEmail) > 1 else None
        thisGuy['phone'] = allPhone[0] if len(allPhone) > 0 else None
        thisGuy['companyUrl'] = companyUrl or ''
        thisGuy['called'] = True

    return thisGuy
