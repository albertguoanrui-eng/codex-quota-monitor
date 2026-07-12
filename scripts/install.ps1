$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Node.js 20 or newer is required.' }
$env:ELECTRON_MIRROR = 'https://npmmirror.com/mirrors/electron/'
npm ci
if (-not (Test-Path (Join-Path $root 'node_modules\electron\dist\electron.exe'))) {
    node (Join-Path $root 'node_modules\electron\install.js')
}

$watcher = Join-Path $root 'watcher.ps1'
$launcher = Join-Path $root 'launcher.vbs'
Remove-ItemProperty -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run' -Name 'LiquidQuotaFollowCodex' -ErrorAction SilentlyContinue
$action = New-ScheduledTaskAction -Execute 'wscript.exe' -Argument "`"$launcher`""
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit ([TimeSpan]::Zero) -RestartCount 99 -RestartInterval (New-TimeSpan -Minutes 1) -MultipleInstances IgnoreNew -Hidden
Register-ScheduledTask -TaskName 'CodexQuotaMonitor' -Action $action -Trigger $trigger -Settings $settings -Description 'Starts and stops Codex quota monitor with the Codex desktop app.' -Force | Out-Null
Start-ScheduledTask -TaskName 'CodexQuotaMonitor'
Write-Host 'Installed. The widget will follow the Codex desktop app.' -ForegroundColor Green
