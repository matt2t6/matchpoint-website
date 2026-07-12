$ErrorActionPreference = 'Stop'

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -LiteralPath $ProjectRoot

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  throw 'npm was not found. Install Node.js LTS first.'
}

Write-Host 'Starting MatchPoint Vite + FastAPI pitch stack...' -ForegroundColor Cyan

Write-Host 'Starting FastAPI backend on http://127.0.0.1:5000 ...' -ForegroundColor Yellow
Start-Process powershell `
  -ArgumentList '-NoExit', '-Command', "Set-Location -LiteralPath '$ProjectRoot'; python .\aegis_sse_bridge.py" `
  -WorkingDirectory $ProjectRoot

Start-Sleep -Seconds 3

Write-Host 'Starting Vite frontend on http://127.0.0.1:8000 ...' -ForegroundColor Yellow
Start-Process powershell `
  -ArgumentList '-NoExit', '-Command', "Set-Location -LiteralPath '$ProjectRoot'; npm run dev" `
  -WorkingDirectory $ProjectRoot

Start-Sleep -Seconds 4
Start-Process 'http://127.0.0.1:8000'

Write-Host ''
Write-Host 'Vite pitch stack started.' -ForegroundColor Green
Write-Host 'Frontend: http://127.0.0.1:8000' -ForegroundColor Cyan
Write-Host 'Backend:  http://127.0.0.1:5000' -ForegroundColor Cyan
Write-Host 'Backup:   ' $BackupRoot -ForegroundColor DarkGray
