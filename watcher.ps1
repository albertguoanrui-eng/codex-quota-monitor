$ErrorActionPreference = 'SilentlyContinue'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$electron = Join-Path $root 'node_modules\electron\dist\electron.exe'
$widgetPid = $null
while ($true) {
    $codexRunning = @(Get-Process -Name 'codex' -ErrorAction SilentlyContinue).Count -gt 0
    $widgetRunning = $widgetPid -and (Get-Process -Id $widgetPid -ErrorAction SilentlyContinue)
    if ($codexRunning -and -not $widgetRunning -and (Test-Path $electron)) {
        $widgetPid = (Start-Process -FilePath $electron -ArgumentList @('.') -WorkingDirectory $root -WindowStyle Hidden -PassThru).Id
    }
    if (-not $codexRunning -and $widgetRunning) {
        & taskkill.exe /PID $widgetPid /T /F | Out-Null
        $widgetPid = $null
    }
    Start-Sleep -Seconds 3
}
