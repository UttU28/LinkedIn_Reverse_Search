from bs4 import BeautifulSoup
from fuzzywuzzy import fuzz

async def checkDuplicate(data):
    if data is None:
        return ""
    if data[:len(data)//2] == data[len(data)//2:]:
        data = data[:len(data)//2]
    return data.strip()

async def getMeJsonData(htmlContent):
    li_element = BeautifulSoup(htmlContent, 'html.parser')
    
    companyPosition = None
    companyName = None
    companyLocation = None
    
    mainTags = li_element.find_all('div', class_='display-flex flex-wrap align-items-center full-height')
    if len(mainTags) > 1:
        companyName = mainTags[0].find('div', class_='display-flex').get_text(strip=True)
        companyPosition = mainTags[1].find('div', class_='display-flex').get_text(strip=True)
        companyLocation = li_element.find_all('span', class_='pvs-entity__caption-wrapper')[0].get_text(strip=True)
    else:
        positionTag = li_element.find('div', class_='display-flex align-items-center mr1 t-bold')
        if positionTag:
            companyPosition = positionTag.get_text(strip=True)
        
        company_info_tag = li_element.find('span', class_='t-14 t-normal')
        if company_info_tag:
            company_info = company_info_tag.get_text(strip=True)
            company_info_parts = company_info.split(' · ')
            companyName = company_info_parts[0] if company_info_parts else None

        location_tags = li_element.find_all('span', class_='t-14 t-normal t-black--light')
        if len(location_tags) > 1:
            companyLocation = location_tags[1].get_text(strip=True)

    jobData = {
        "companyName": await checkDuplicate(companyName),
        "companyPosition": await checkDuplicate(companyPosition),
        "companyLocation": await checkDuplicate(companyLocation)
    }
    
    return jobData

# //////////////////////////////////
