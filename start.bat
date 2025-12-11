@echo off
echo Starting FYP System...
echo.

echo [1/2] Starting Backend (ASP.NET Core)...
start cmd /k "cd /d %~dp0fyp-backend\FYPSystem.API && dotnet run"

timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend (React)...
start cmd /k "cd /d %~dp0fyp-frontend && npm run dev"

echo.
echo Both servers are starting!
echo - Backend: http://localhost:5073
echo - Frontend: http://localhost:5173
echo.
pause

