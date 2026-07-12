$ErrorActionPreference = 'SilentlyContinue'
Remove-ItemProperty -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run' -Name 'LiquidQuotaFollowCodex'
Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*LiquidQuotaWidget*watcher.ps1*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
Get-Process electron | Where-Object { $_.Path -like '*LiquidQuotaWidget*' } | Stop-Process -Force
Write-Host 'Codex Quota Monitor has been removed from startup.' -ForegroundColor Green
