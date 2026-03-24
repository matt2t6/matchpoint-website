$ErrorActionPreference = 'SilentlyContinue'

Write-Host "[demo] Stopping beacon container..."
docker rm -f mp-echo-beacon-demo | Out-Null

Get-Process | Where-Object { $_.MainWindowTitle -like '*MatchPoint Gateway*' } | ForEach-Object { $_.CloseMainWindow() | Out-Null }

Write-Host "[demo] Stop complete."

