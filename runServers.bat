@echo off
REM Navigate to the backend folder
cd backend

REM Optional: Activate virtual environment if needed
call env\Scripts\activate.bat

echo Starting Server A on port 8000...
start "Server A" cmd /k uvicorn app:app --host 0.0.0.0 --port 8000 --reload

echo Starting Server B on port 8001...
start "Server B" cmd /k uvicorn app2:app --host 0.0.0.0 --port 8001 --reload

REM Navigate back to the parent directory
cd ..

REM Navigate to the frontend folder
cd frontend

echo Starting frontend with npm...
start "Frontend" cmd /k npm start

echo All servers started successfully.
echo Close this window to stop all servers.

pause
