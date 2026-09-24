@echo off
title Aurora Media Suite - Enable Windows Auto-Start
echo =======================================================================
echo     Configure Aurora Media Suite to Start Automatically with Windows
echo =======================================================================
echo.

set "STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "TARGET_VBS=%~dp0start-silent.vbs"
set "SHORTCUT_VBS=%STARTUP_DIR%\Aurora-Media-Suite.vbs"

echo Creating background startup trigger...
(
    echo Set WshShell = CreateObject^("WScript.Shell"^)
    echo WshShell.Run "wscript.exe ""%TARGET_VBS%""", 0, False
) > "%SHORTCUT_VBS%"

echo.
echo [SUCCESS] Aurora Media Suite will now start automatically in the background
echo           whenever you turn on your PC.
echo.
echo Your Samsung Galaxy and other devices can now stream anytime!
echo (To disable this at any time, run: uninstall-autostart.bat)
echo.
pause
