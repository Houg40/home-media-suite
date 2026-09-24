@echo off
title Aurora Media Suite
cd /d "%~dp0server"

echo =======================================================================
echo          Starting Aurora: Home Media Suite (Universal Streaming)
echo =======================================================================
echo.

:: Ensure port 3001 is clean
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001 ^| findstr LISTENING 2^>nul') do (
    taskkill /f /pid %%a >nul 2>&1
)

echo Starting media server & unified web application...
start "Aurora Media Suite Engine" /b node index.js

echo.
echo Waiting for server startup...
timeout /t 2 /nobreak >nul

echo Opening Aurora in your browser...
start http://localhost:3001

echo.
echo =======================================================================
echo  Aurora is RUNNING!
echo  - PC Web Access:      http://localhost:3001
echo  - Galaxy Mobile App:  Check Wi-Fi icon in Aurora header for LAN IP
echo.
echo  To STOP Aurora at any time, run: stop.bat
echo =======================================================================
echo.
echo (You can minimize this window or press Ctrl+C to stop)
pause >nul
