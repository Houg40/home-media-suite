@echo off
title Create Desktop Shortcut - Aurora Media Suite
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$WshShell = New-Object -ComObject WScript.Shell; " ^
  "$Desktop = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop); " ^
  "$Shortcut = $WshShell.CreateShortcut(\"$Desktop\Aurora Media Suite.lnk\"); " ^
  "$Shortcut.TargetPath = 'wscript.exe'; " ^
  "$Shortcut.Arguments = '\"%~dp0start-silent.vbs\"'; " ^
  "$Shortcut.WorkingDirectory = '%~dp0'; " ^
  "$Shortcut.Description = 'Aurora Home Media Suite'; " ^
  "$Shortcut.IconLocation = 'shell32.dll,220'; " ^
  "$Shortcut.Save(); " ^
  "Write-Host 'Shortcut created successfully on your Desktop!' -ForegroundColor Green"

echo.
timeout /t 2 >nul
