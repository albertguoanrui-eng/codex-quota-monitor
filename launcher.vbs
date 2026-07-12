Option Explicit
Dim shell, fso, root, watcher
Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
root = fso.GetParentFolderName(WScript.ScriptFullName)
watcher = fso.BuildPath(root, "watcher.ps1")
shell.Run "powershell.exe -NoLogo -NoProfile -NonInteractive -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & watcher & """", 0, True
