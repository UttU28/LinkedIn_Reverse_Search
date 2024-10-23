from bs4 import BeautifulSoup
import json

async def checkDuplicate(data):
    if data is None:
        return ""
    if data[:len(data)//2] == data[len(data)//2:]:
        data = data[:len(data)//2]
    return data.strip()

async def getMeJsonData(htmlContent):
    li_element = BeautifulSoup(htmlContent, 'html.parser')
    
    position = None
    company_name = None
    location = None
    
    position_tag = li_element.find('div', class_='display-flex align-items-center mr1 t-bold')
    if position_tag:
        position = position_tag.get_text(strip=True)
    
    company_info_tag = li_element.find('span', class_='t-14 t-normal')
    if company_info_tag:
        company_info = company_info_tag.get_text(strip=True)
        # print("company_info", company_info)
        company_info_parts = company_info.split(' · ')
        company_name = company_info_parts[0] if company_info_parts else None

    location_tags = li_element.find_all('span', class_='t-14 t-normal t-black--light')
    if len(location_tags) > 1:
        location = location_tags[1].get_text(strip=True)

    jobData = {
        "companyName": await checkDuplicate(company_name),
        "companyPosition": await checkDuplicate(position),
        "companyLocation": await checkDuplicate(location)
    }
    
    return jobData



# //////////////////////////////////

async def normalizeString(s):
    """Normalize the string by lowering case and removing extra spaces."""
    return ' '.join(s.lower().strip().split())

async def findClosestMatch(inputString, data):
    normalized_input = await normalizeString(inputString)
    
    for index, entry in enumerate(data):
        normalized_company_name = await normalizeString(entry['companyName'])
        if normalized_company_name in normalized_input or normalized_input in normalized_company_name:
            return data[index]
        input_components = normalized_input.split()
        if all(comp in normalized_company_name for comp in input_components):
            return data[index]
        
        if normalized_input.replace(" ", "") in normalized_company_name.replace(" ", ""):
            return data[index]
        
    return None
