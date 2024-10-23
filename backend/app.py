from flask import Flask, request, jsonify
import datetime
import os
from werkzeug.utils import secure_filename

upload_folder = 'uploads'
allowed_extensions = {'xlsx'}

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = upload_folder

os.makedirs(upload_folder, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'message': 'No file part'}), 400
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'message': 'No selected file'}), 400
    if file and allowed_file(file.filename):
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        name = request.form.get('name')
        email = request.form.get('email')
        filename = f"{timestamp}_{secure_filename(email.split('@')[0])}.xlsx"
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))

        print(f"Received Name: {name}, Email: {email}, File saved as: {filename}")
        
        print("Data is being scraped...")
        return jsonify({'message': 'Your data is being scraped. We will send an email once the data is found.'}), 200
    else:
        return jsonify({'message': 'File type not allowed'}), 400

if __name__ == '__main__':
    app.run(debug=True)
