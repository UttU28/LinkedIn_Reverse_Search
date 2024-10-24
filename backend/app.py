import uvicorn
import json
import logging
import time
import os
import asyncio, urllib
from fastapi import FastAPI, UploadFile, File, Form, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import JSONResponse
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from utils.queueManagement import addEntryToQueue
from utils.initialCleanup import createInitialDirs
from eJobsPipeline import thisMainFunction
from utils.fileActions import readJson, writeJson
import aiofiles
# Define the folder to save uploads and allowed file types
uploadFolder = 'uploads'
downloadFolder = 'downloads'
allowedExtensions = {'xlsx'}

# Create FastAPI app
app = FastAPI()

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, this should be limited to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure the upload folder exists
os.makedirs(uploadFolder, exist_ok=True)
os.makedirs(downloadFolder, exist_ok=True)

logging.basicConfig(level=logging.INFO)

# Keep track of active WebSocket connections per email
active_connections = {}
# Store notifications for emails that do not have active WebSocket connections
pending_notifications = {}

# Check if a file extension is allowed
def allowedFile(fileName: str) -> bool:
    return '.' in fileName and fileName.rsplit('.', 1)[1].lower() in allowedExtensions

# Pydantic model for email requests
class EmailRequest(BaseModel):
    email: str


# @app.get("/download/{fileName}")
# async def download_file(fileName: str):
#     file_path = '/downloads/1729791124.xlsx'
#     if os.path.exists(file_path):
#         return FileResponse(file_path, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
#     else:
#         raise HTTPException(status_code=404, detail="File not found")

@app.get("/download/{fileName}")
async def download_file(fileName: str):
    file_path = f'downloads/{fileName}.xlsx'  # This should dynamically reference `fileName`
    if os.path.exists(file_path):
        return FileResponse(file_path, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    else:
        raise HTTPException(status_code=404, detail="File not found")


def readTheFile(filePath):
    with open(filePath, 'r') as file:
        return json.load(file)

@app.post("/startup")
async def get_startup_data(email_request: EmailRequest):
    email = email_request.email
    allData = await readJson(f"data/data.json")
    thisUserData = allData[email]
    if email:
        return {"email": email, "thisUserData": thisUserData, "status": "active"}
    else:
        raise HTTPException(status_code=400, detail="Invalid email")

# POST route to handle file uploads
@app.post("/upload")
async def uploadFile(
    name: str = Form(...),
    email: str = Form(...),
    file: UploadFile = File(...),
):
    if not allowedFile(file.filename):
        return JSONResponse(content={'message': 'File type not allowed'}, status_code=400)

    timeStamp = int(time.time())
    fileName = f"{timeStamp}.xlsx"
    filePath = os.path.join(uploadFolder, fileName)

    # Use aiofiles to write the file asynchronously
    async with aiofiles.open(filePath, "wb") as buffer:
        content = await file.read()
        await buffer.write(content)

    logging.info(f"Received Name: {name}, Email: {email}, File saved as: {fileName}")
    thisID = await addEntryToQueue(email, name, filePath, timeStamp)

    # Run the background job and send notification when ready
    asyncio.create_task(thisMainFunction(email, filePath, thisID, sendNotification))

    return JSONResponse(content={'message': 'Your data is being scraped. We will send an email once the data is found.'}, status_code=200)


# Function to send a notification
async def sendNotification(email: str, message: str, statusMessage: str):
    logging.info(f"Attempting to send notification to {email}")
    newMessage = {"status": statusMessage, "message": message}
    if email in active_connections:
        connection = active_connections[email]
        notificationData = {
            "timestamp": int(time.time()),
            "message": newMessage
        }
        await connection.send_text(json.dumps(notificationData))
        logging.info(f"Sent notification to {email} with timestamp")
    else:
        logging.warning(f"No active connection for {email}, storing notification")
        # Store the notification for later if the user is not connected
        if email not in pending_notifications:
            pending_notifications[email] = []
        pending_notifications[email].append(message)

# WebSocket endpoint for receiving real-time notifications
@app.websocket("/ws/{email}")
async def websocket_endpoint(websocket: WebSocket, email: str):
    email = urllib.parse.unquote(email)
    await websocket.accept()

    logging.info(f"WebSocket connection accepted for {email}")
    if email in active_connections:
        old_websocket = active_connections[email]
        try:
            await old_websocket.close()
            logging.info(f"Closed previous WebSocket for {email}")
        except Exception as e:
            logging.error(f"Error closing previous WebSocket: {e}")

    active_connections[email] = websocket

    # Send any pending notifications when the user reconnects
    if email in pending_notifications:
        for message in pending_notifications[email]:
            notificationData = {
                "timestamp": int(time.time()),
                "message": message
            }
            await websocket.send_text(json.dumps(notificationData))
            logging.info(f"Sent pending notification to {email}")

        # Clear the stored notifications after sending
        del pending_notifications[email]

    try:
        while True:
            data = await websocket.receive_text()
            logging.info(f"Received data from {email}: {data}")
    except WebSocketDisconnect:
        if email in active_connections:
            del active_connections[email]
        logging.info(f"WebSocket disconnected for {email}")
    except Exception as e:
        logging.error(f"Error during WebSocket connection: {e}")



if __name__ == '__main__':
    createInitialDirs()
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")



# Add function to call the history websocket_endpoint every 30 seconds and update the start up queue by calling the function fetchData fron StartUp.js and refreshing the content in html again Along with a notification using toast saying 'Updating the Data'.
# StartUp