@echo off
title Stop Aurora Media Suite
echo Stopping Aurora Media Suite...

set found=0
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001 ^| findstr LISTENING 2^>nul') do (
    taskkill /f /pid %%a >nul 2>&1
    set found=1
)

if "%found%"=="1" (
    echo Aurora Media Suite has been stopped successfully.
) else (
    echo Aurora Media Suite is not currently running.
)

ping 127.0.0.1 -n 2 >nul
