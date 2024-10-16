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


excel_file = 'People.xlsx'
df = pd.read_excel(excel_file)

data = []
for index, row in df.iterrows():
    result = splitFullName(row['Full Name'])
    entry = {
        'fullName': row['Full Name'],
        'firstName': result['firstName'],
        'lastName': result['lastName'],
        'company': row['Company'],
        'hasViewed': False
    }
    data.append(entry)

json_data = json.dumps(data, indent=4)

with open('output.json', 'w') as json_file:
    json_file.write(json_data)

print("JSON file has been created successfully.")
