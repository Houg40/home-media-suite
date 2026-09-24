@echo off
echo =======================================================================
echo          Starting Aurora: Home Media Suite (Universal Streaming)
echo =======================================================================
echo.

start "Aurora Media Server (Node.js)" cmd /k "cd /d %~dp0server && node index.js"
timeout /t 2 /nobreak >nul

start "Aurora Web Client (Vite)" cmd /k "cd /d %~dp0client && npm run dev"

echo Media Server running on: http://localhost:3001
echo Web Client running on:   http://localhost:5173
echo.
echo Opening browser...
timeout /t 2 /nobreak >nul
start http://localhost:5173
