@echo off
title Allow Aurora Media Suite Through Firewall
echo =======================================================================
echo          Allow Aurora Home Media Suite Through Windows Firewall
echo =======================================================================
echo.

net session >nul 2>&1
if %errorLevel% == 0 (
    netsh advfirewall firewall add rule name="Aurora Media Suite" dir=in action=allow protocol=TCP localport=3001
    echo.
    echo =======================================================================
    echo  [SUCCESS] Port 3001 is now open in Windows Firewall!
    echo  Your Galaxy tablet, phone, and other Wi-Fi devices can now connect.
    echo =======================================================================
    echo.
    pause
) else (
    echo Requesting Administrator permission...
    echo Please click YES on the Windows prompt if asked.
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
)
