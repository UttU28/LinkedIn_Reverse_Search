# Python server with improved WebSocket management

import logging
import time
import os
import asyncio, urllib
from fastapi import FastAPI, UploadFile, File, Form, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from utils.queueManagement import addEntryToQueue
from eJobsPipeline import thisMainFunction

uploadFolder = 'uploads'
allowedExtensions = {'xlsx'}

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs(uploadFolder, exist_ok=True)

logging.basicConfig(level=logging.INFO)

# Keep track of active WebSocket connections per email
active_connections = {}

def allowedFile(filename: str) -> bool:
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowedExtensions

@app.post("/upload")
async def uploadFile(
    name: str = Form(...),
    email: str = Form(...),
    file: UploadFile = File(...)
):
    if not allowedFile(file.filename):
        return JSONResponse(content={'message': 'File type not allowed'}, status_code=400)

    timeStamp = int(time.time())
    filename = f"{timeStamp}.xlsx"
    filePath = os.path.join(uploadFolder, filename)

    with open(filePath, "wb") as buffer:
        buffer.write(await file.read())

    logging.info(f"Received Name: {name}, Email: {email}, File saved as: {filename}")
    thisID = await addEntryToQueue(email, name, filePath, timeStamp)

    # Run the background job and send notification when ready
    asyncio.create_task(thisMainFunction(email, filePath, thisID, sendNotification))

    return JSONResponse(content={'message': 'Your data is being scraped. We will send an email once the data is found.'}, status_code=200)

async def sendNotification(email: str, message: str):
    logging.info(f"Attempting to send notification to {email}")
    if email in active_connections:
        connection = active_connections[email]
        await connection.send_text(message)
        logging.info(f"Sent notification to {email}")
    else:
        logging.warning(f"No active connection for {email}")

@app.websocket("/ws/{email}")
async def websocket_endpoint(websocket: WebSocket, email: str):
    email = urllib.parse.unquote(email)  # Decode the email if needed
    await websocket.accept()
    logging.info(f"WebSocket connection accepted for {email}")

    if email in active_connections:
        # Close the old connection if it exists
        old_websocket = active_connections[email]
        await old_websocket.close()
        logging.info(f"Closed previous WebSocket for {email}")
    
    active_connections[email] = websocket

    try:
        while True:
            data = await websocket.receive_text()
            logging.info(f"Received data from {email}: {data}")
    except WebSocketDisconnect:
        del active_connections[email]
        logging.info(f"WebSocket disconnected for {email}")


if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
