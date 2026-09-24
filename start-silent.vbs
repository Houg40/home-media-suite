Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Get project folder directory
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
serverDir = scriptDir & "\server"

' Kill any lingering process on port 3001
WshShell.Run "cmd /c for /f ""tokens=5"" %a in ('netstat -aon ^| findstr :3001 ^| findstr LISTENING 2^>nul') do taskkill /f /pid %a", 0, True

' Start node index.js hidden (window style 0 = hidden)
WshShell.CurrentDirectory = serverDir
WshShell.Run "cmd /c node index.js", 0, False

' Wait 2 seconds and open browser
WScript.Sleep 2000
WshShell.Run "http://localhost:3001"
