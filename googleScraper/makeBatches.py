import json
import os

with open('output.json', 'r') as file:
    data = json.load(file)
batch_size = 250
output_dir = 'myBatch'
os.makedirs(output_dir, exist_ok=True)
for i in range(0, len(data), batch_size):
    batch = data[i:i+batch_size]
    file_name = f'batch_{i//batch_size + 1}.json'
    file_path = os.path.join(output_dir, file_name)
    with open(file_path, 'w') as batch_file:
        json.dump(batch, batch_file, indent=4)

print(f"Data split into {len(data)//batch_size + (1 if len(data) % batch_size != 0 else 0)} files in '{output_dir}' directory.")