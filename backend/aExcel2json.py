import pandas as pd
import json
import re

def splitFullName(fullName):
    prefixPattern = r'^(Dr\.?|H\.E\.?\.?)\s+'
    match = re.match(prefixPattern, fullName)
    
    if match:
        namePart = fullName[match.end():].strip()
    else:
        namePart = fullName.strip()
    
    nameParts = re.split(r'(?<!^)\s+(?=[A-Z])|(?<=[a-z])(?=[A-Z])', namePart)
    
    if len(nameParts) > 1:
        firstName = ' '.join(nameParts[:-1])
        lastName = nameParts[-1]
    else:
        firstName = namePart
        lastName = ''
    
    return {
        'firstName': firstName.strip(),
        'lastName': lastName.strip()
    }

def scrapeDataFromExcel(whichExcel):
    thisDataFrame = pd.read_excel(whichExcel)

    data = []
    for index, row in thisDataFrame.iterrows():
        if not (row.get('Full Name') or row.get('Full_Name')):
            firstName = str(row.get('First Name') or row.get('First_Name', ''))
            lastName = str(row.get('Last Name') or row.get('Last_Name', ''))
            fullName = firstName+' '+lastName
        else:
            fullName = str(row.get('Full Name') or row.get('Full_Name', ''))
            result = splitFullName(fullName.strip())
            firstName = result['firstName']
            lastName = result['lastName']
        companyName = str(row.get('Company Name') or row.get('Company', ''))
        linkedInUrl = str(row.get('Linkedin') or row.get('LinkedIn', ''))
        if 'linkedin.com/in/' in linkedInUrl:
            entry = {
                'fullName': fullName.strip(),
                'firstName': firstName.strip(),
                'lastName': lastName.strip(),
                'company': companyName.strip(),
                'currentUrl': linkedInUrl.strip(),
                'hasViewed': False
            }
            data.append(entry)

    return data


if __name__ == '__main__':
    excel_file = 'People.xlsx'
    jsonData = scrapeDataFromExcel(excel_file)
    with open('output.json', 'w') as json_file:
        jsonData = json.dumps(jsonData, indent=4)
        json_file.write(jsonData)
