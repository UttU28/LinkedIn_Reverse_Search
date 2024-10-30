from fastapi import FastAPI
from pydantic import BaseModel
import logging
import os
import httpx
from eJobsPipeline import thisMainFunction

app = FastAPI()

class ProcessRequest(BaseModel):
    email: str
    firstName: str
    filePath: str
    thisID: str

os.makedirs('logs', exist_ok=True)
logging.basicConfig(level=logging.INFO)

@app.post("/process")
async def processData(request: ProcessRequest):
    try:
        await thisMainFunction(request.email, request.firstName, request.filePath, request.thisID, sendNotification)
    except Exception as e:
        logging.error(f"Error processing {request.filePath} for {request.email}: {str(e)}")

async def sendNotification(email: str, message: str, statusMessage: str):
    async with httpx.AsyncClient() as client:
        try:
            await client.post(
                "http://localhost:8000/task_done",
                json={"email": email, "message": message, "statusMessage": statusMessage}
            )
        except Exception as e:
            logging.error(f"Error notifying Server A: {e}")
