import json
import openpyxl
from openpyxl.utils import get_column_letter
from openpyxl.styles import Font, Border, Side, PatternFill

def readJson(file_path):
    with open(file_path, 'r') as file:
        return json.load(file)

def writeJson(file_path, data):
    with open(file_path, 'w') as file:
        json.dump(data, file, indent=4)

def writeToExcel(data, output_file):
    # Create a new Excel workbook and sheet
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Enriched Data"

    # Define headers
    headers = [
        "Full Name", "Position", "LinkedIn URL", "Email 1", "Email 2", "Phone", 
        "Company Name", "Company URL", "Location", "First Name", "Last Name"
    ]
    
    # Add headers to the first row
    for col_num, header in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col_num, value=header)
        cell.font = Font(bold=True, color="FFFFFF")  # Bold white text
        cell.fill = PatternFill(start_color="4F81BD", end_color="4F81BD", fill_type="solid")  # Blue fill

    # Populate the sheet with data
    for row_num, entry in enumerate(data, 2):
        ws.cell(row=row_num, column=1, value=entry['fullName'])
        ws.cell(row=row_num, column=2, value=entry['companyPosition'])
        
        # Create hyperlinks
        ws.cell(row=row_num, column=3, value=entry['currentUrl']).hyperlink = entry['currentUrl']
        ws.cell(row=row_num, column=3).font = Font(color="0000FF", underline="single")  # Blue, underlined
        
        ws.cell(row=row_num, column=4, value=entry['email0'] or '').hyperlink = f'mailto:{entry["email0"]}' if entry['email0'] else ''
        ws.cell(row=row_num, column=4).font = Font(color="0000FF", underline="single") if entry['email0'] else Font()  # Blue, underlined if exists
        
        ws.cell(row=row_num, column=5, value=entry['email1'] or '').hyperlink = f'mailto:{entry["email1"]}' if entry['email1'] else ''
        ws.cell(row=row_num, column=5).font = Font(color="0000FF", underline="single") if entry['email1'] else Font()  # Blue, underlined if exists
        
        ws.cell(row=row_num, column=6, value=entry['phone'] or '')
        ws.cell(row=row_num, column=7, value=entry['companyName'])
        
        ws.cell(row=row_num, column=8, value=entry['companyUrl']).hyperlink = entry['companyUrl']
        ws.cell(row=row_num, column=8).font = Font(color="0000FF", underline="single")  # Blue, underlined
        
        ws.cell(row=row_num, column=9, value=entry['companyLocation'])
        ws.cell(row=row_num, column=10, value=entry['firstName'])
        ws.cell(row=row_num, column=11, value=entry['lastName'])

    # Set column widths
    ws.column_dimensions[get_column_letter(1)].width = max(len(entry['fullName']) for entry in data) + 2
    ws.column_dimensions[get_column_letter(2)].width = 25
    ws.column_dimensions[get_column_letter(3)].width = 15
    ws.column_dimensions[get_column_letter(4)].width = 15
    ws.column_dimensions[get_column_letter(5)].width = 15
    ws.column_dimensions[get_column_letter(6)].width = 15
    ws.column_dimensions[get_column_letter(7)].width = 45
    ws.column_dimensions[get_column_letter(8)].width = 15
    ws.column_dimensions[get_column_letter(9)].width = 45
    ws.column_dimensions[get_column_letter(10)].width = 20
    ws.column_dimensions[get_column_letter(11)].width = 20

    # Apply border styles
    thin = Side(border_style="thin", color="000000")
    for row in ws.iter_rows(min_row=1, max_col=len(headers), max_row=len(data)+1):
        for cell in row:
            cell.border = Border(left=thin, right=thin, top=thin, bottom=thin)

    wb.save(output_file)

def processJson(file_path):
    data = readJson(file_path)

    formatted_data = []
    for entry in data:
        formatted_entry = {
            'fullName': entry['fullName'],
            'companyPosition': entry.get('companyPosition', ''),
            'currentUrl': entry.get('currentUrl', ''),
            'email0': entry.get('email0', ''),
            'email1': entry.get('email1', ''),
            'phone': entry.get('phone', ''),
            'companyName': entry.get('companyName', ''),
            'companyUrl': entry.get('companyUrl', ''),
            'companyLocation': entry.get('companyLocation', ''),
            'firstName': entry.get('firstName', ''),
            'lastName': entry.get('lastName', '')
        }

        formatted_data.append(formatted_entry)

    output_file = 'contacts.xlsx'
    writeToExcel(formatted_data, output_file)
    print(f"Data has been written to {output_file}")

file_path = 'output.json'
processJson(file_path)
