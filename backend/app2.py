from fastapi import FastAPI
from pydantic import BaseModel
import logging
import os
import httpx
import uvicorn
from eJobsPipeline import extractFromExcel, scrapeFromLinkedIn, companyFromLinkedIn
from typing import Optional


app = FastAPI()

class ProcessRequest(BaseModel):
    email: str
    fileName: Optional[str] = None
    filePath: Optional[str] = None
    thisID: str
    searchUrl: Optional[str] = None

os.makedirs('logs', exist_ok=True)
logging.basicConfig(level=logging.INFO)

@app.post("/linkedinfromcompany")
async def processData(request: ProcessRequest):
    try:
        await extractFromExcel(request.email, request.filePath, request.thisID, sendNotification)
    except Exception as e:
        logging.error(f"Error processing {request.filePath} for {request.email}: {str(e)}")

@app.post("/scrapelinkedinfor")
async def processData(request: ProcessRequest):
    try:
        await scrapeFromLinkedIn(request.email, request.searchUrl, request.thisID, sendNotification)
    except Exception as e:
        logging.error(f"Error processing {request.searchUrl} for {request.email}: {str(e)}")

@app.post("/companyfromlinkedin")
async def processData(request: ProcessRequest):
    try:
        await companyFromLinkedIn(request.email, request.filePath, request.thisID, sendNotification)
    except Exception as e:
        logging.error(f"Error processing {request.searchUrl} for {request.email}: {str(e)}")

async def sendNotification(email: str, message: str, statusMessage: str):
    async with httpx.AsyncClient() as client:
        try:
            await client.post(
                "http://localhost:8000/task_done",
                json={"email": email, "message": message, "statusMessage": statusMessage}
            )
        except Exception as e:
            logging.error(f"Error notifying Server A: {e}")

if __name__ == '__main__':
    uvicorn.run(app, host="localhost", port=8001, log_level="info")
# uvicorn app2:app --host 0.0.0.0 --port 8001 --reload --log-level info
# cd backend/; .\env\Scripts\activate; python app2.py