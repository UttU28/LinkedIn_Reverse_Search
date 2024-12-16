import json
import os
import pandas as pd

batch_dir = 'myBatch'
output_file = 'merged_data.json'
merged_data = []

for file_name in os.listdir(batch_dir):
    if file_name.endswith('.json') and file_name.startswith('batch_'):
        file_path = os.path.join(batch_dir, file_name)
        with open(file_path, 'r') as batch_file:
            batch_data = json.load(batch_file)
            for record in batch_data:
                if record.get('currentUrl'):
                    merged_data.append(record)

with open(output_file, 'w') as output:
    json.dump(merged_data, output, indent=4)

print(f"Merged data with non-empty 'currentUrl' saved to '{output_file}'.")
excel_data = []

for record in merged_data:
    excel_data.append({
        'Full Name': record.get('fullName', ''),
        'First Name': record.get('firstName', ''),
        'Last Name': record.get('lastName', ''),
        'Title': record.get('position', ''),
        'Company Name': record.get('company', ''),
        'LinkedIn': record.get('currentUrl', '')
    })

df = pd.DataFrame(excel_data)
excel_output_file = 'merged_data.xlsx'
df.to_excel(excel_output_file, index=False)

print(f"Excel file created with merged data and saved to '{excel_output_file}'.")
