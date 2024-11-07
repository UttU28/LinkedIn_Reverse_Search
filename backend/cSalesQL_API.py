import json
import aiohttp
import asyncio
from tqdm import tqdm
from time import sleep

async def makeAPIRequest(linkedInUrl):
    API_TOKEN = "ZAuOYiUjklVmhWoVVUKqoXzboZ9XSQ7s"
    url = f"https://api-public.salesql.com/v1/persons/enrich/?linkedin_url={linkedInUrl}"

    headers = {
        "accept": "application/json",
        "Authorization": f"Bearer {API_TOKEN}"
    }

    async with aiohttp.ClientSession() as session:
        async with session.get(url, headers=headers) as response:
            if response.status == 200:
                data = await response.json()
                
                emails = data.get('emails', [])
                phones = data.get('phones', [])
                
                emailList = [email for email in emails if isinstance(email, dict) and 'email' in email]
                phoneList = [phone['phone'] for phone in phones if isinstance(phone, dict) and 'phone' in phone]
                companyUrl = data.get('organization', {}).get('website', '')

                return emailList, phoneList, companyUrl
            else:
                print(response.status)
                return [], [], ''

async def getEmailAndPhoneFor(thisGuy, currentUrl):
    if currentUrl:
        allEmail, allPhone, companyUrl = await makeAPIRequest(currentUrl)

        sortedEmails = sorted(allEmail, key=lambda x: x.get('status') != 'Valid') if isinstance(allEmail, list) else []
        emailList = [email['email'] for email in sortedEmails if isinstance(email, dict) and 'email' in email]
        phoneList = [phone for phone in allPhone if isinstance(phone, str)]

        thisGuy['email0'] = emailList[0] if len(emailList) > 0 else None
        thisGuy['email1'] = emailList[1] if len(emailList) > 1 else None
        thisGuy['phone'] = phoneList[0] if len(phoneList) > 0 else None
        thisGuy['companyUrl'] = companyUrl or ''
        thisGuy['called'] = True

async def main():
    try:
        with open("linkedin_members.json", "r") as json_file:
            membersDict = json.load(json_file)
    except FileNotFoundError:
        print("No data file found.")
        membersDict = {}

    for linkedInUrl, profileData in tqdm(membersDict.items(), desc="Updating profiles"):
        if not profileData.get("called"):
            await getEmailAndPhoneFor(profileData, linkedInUrl)

            with open("linkedin_members.json", "w") as json_file:
                json.dump(membersDict, json_file, indent=4)
            sleep(5)

if __name__ == "__main__":
    asyncio.run(main())
