import uvicorn
import json
import logging
import time
import os
import asyncio
import urllib
from fastapi import FastAPI, UploadFile, File, Form, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from utils.queueManagement import addEntryToQueue
from utils.initialCleanup import createInitialDirs
from utils.fileActions import readJson
import aiofiles
import httpx

uploadFolder = 'uploads'
downloadFolder = 'downloads'
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
os.makedirs(downloadFolder, exist_ok=True)

logging.basicConfig(level=logging.INFO)

activeConnections = {}
pendingNotifications = {}

class EmailRequest(BaseModel):
    email: str

def allowedFile(fileName: str) -> bool:
    return '.' in fileName and fileName.rsplit('.', 1)[1].lower() in allowedExtensions

@app.get("/download/{fileName}")
async def downloadFile(fileName: str):
    filePath = f'{downloadFolder}/{fileName}.xlsx'
    if os.path.exists(filePath):
        return FileResponse(filePath, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    raise HTTPException(status_code=404, detail="File not found")

@app.post("/startup")
async def getStartupData(emailRequest: EmailRequest):
    email = emailRequest.email
    allData = await readJson("data/data.json")
    userData = allData.get(email)
    if userData:
        return {"email": email, "thisUserData": userData, "status": "active"}
    raise HTTPException(status_code=400, detail="Invalid email")

@app.post("/upload")
async def uploadFile(firstName: str = Form(...), email: str = Form(...), file: UploadFile = File(...)):
    if not allowedFile(file.filename):
        return JSONResponse(content={'message': 'File type not allowed'}, status_code=400)

    timeStamp = int(time.time())
    fileName = f"{timeStamp}.xlsx"
    filePath = os.path.join(uploadFolder, fileName)

    async with aiofiles.open(filePath, "wb") as buffer:
        await buffer.write(await file.read())

    thisID = await addEntryToQueue(email, firstName, filePath, timeStamp)
    await sendNotification(email, "Data scraping started!", 'notif')

    asyncio.create_task(sendToServerB(email, firstName, filePath, thisID))

    return JSONResponse(content={'message': 'Your data is being processed. We will notify you when it is ready.'}, status_code=200)

async def sendToServerB(email: str, firstName: str, filePath: str, thisID: str):
    async with httpx.AsyncClient() as client:
        try:
            await client.post(
                "http://localhost:8001/process",
                json={"email": email, "firstName": firstName, "filePath": filePath, "thisID": str(thisID)}
            )
        except Exception as e:
            logging.error(f"Error sending data to Server B: {e}")

async def sendNotification(email: str, message: str, statusMessage: str):
    notification = {"status": statusMessage, "message": message}
    if email in activeConnections:
        await activeConnections[email].send_text(json.dumps({"timestamp": int(time.time()), "message": notification}))
    else:
        pendingNotifications.setdefault(email, []).append(notification)

@app.post("/task_done")
async def taskDone(data: dict):
    await sendNotification(data["email"], data.get("message", "Task completed!"), data.get("statusMessage", "notif"))
    return JSONResponse(content={'message': 'Notification sent'}, status_code=200)

@app.websocket("/ws/{email}")
async def websocketEndpoint(websocket: WebSocket, email: str):
    email = urllib.parse.unquote(email)
    await websocket.accept()

    if email in activeConnections:
        await activeConnections[email].close()
    activeConnections[email] = websocket

    if email in pendingNotifications:
        for notification in pendingNotifications.pop(email):
            await websocket.send_text(json.dumps({"timestamp": int(time.time()), "message": notification}))

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        activeConnections.pop(email, None)

if __name__ == '__main__':
    createInitialDirs()
    uvicorn.run(app, host="localhost", port=8000, log_level="info")

# uvicorn app:app --host 0.0.0.0 --port 8000 --reload --log-level info
# cd backend/; .\env\Scripts\activate; python app.py
