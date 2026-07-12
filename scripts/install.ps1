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
$run = "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$watcher`""
New-ItemProperty -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run' -Name 'LiquidQuotaFollowCodex' -Value $run -PropertyType String -Force | Out-Null
Start-Process powershell.exe -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-WindowStyle','Hidden','-File',("`"$watcher`"")) -WindowStyle Hidden
Write-Host 'Installed. The widget will follow the Codex desktop app.' -ForegroundColor Green
