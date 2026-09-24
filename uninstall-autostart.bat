@echo off
title Aurora Media Suite - Disable Windows Auto-Start
set "SHORTCUT_VBS=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\Aurora-Media-Suite.vbs"

if exist "%SHORTCUT_VBS%" (
    del /f /q "%SHORTCUT_VBS%"
    echo Aurora Media Suite auto-start has been removed.
) else (
    echo Auto-start is not currently configured.
)

ping 127.0.0.1 -n 2 >nul
