# start-pitch.ps1 - Start the MatchPoint Unified Pitch Stack (Production Grade)
$ErrorActionPreference = "Stop"

Write-Host ">>> Starting MatchPoint Unified Pitch Stack..." -ForegroundColor Cyan

# 1. Cleanup old processes
& "$PSScriptRoot\stop-aegis.ps1"
Start-Sleep -Seconds 1

# 2. Start Full Backend (Port 5000) - Primary State, SSE, and Echo Protocol
Write-Host "[1/2] Starting Production Backend (Port 5000)..." -ForegroundColor Yellow
$flaskCmd = "& { python aegis_sse_bridge.py }"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $flaskCmd -WindowStyle Normal
Start-Sleep -Seconds 5

# 3. Start Frontend (Port 8000) - The Champion Pitch Deck
Write-Host "[2/2] Starting Frontend (Port 8000)..." -ForegroundColor Yellow
# Using python's built-in http.server as a robust fallback/alternative to Vite for simple static sites
$frontendCmd = "& { python -m http.server 8000 }"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd -WindowStyle Normal
Start-Sleep -Seconds 5

Write-Host "`n>>> MatchPoint Pitch Stack is LIVE!" -ForegroundColor Green
Write-Host "Frontend Dashboard: http://localhost:8000" -ForegroundColor Cyan
Write-Host "Backend Full API:   http://localhost:5000" -ForegroundColor Cyan
Write-Host "`nPress Ctrl+C in service windows to stop, or use .\stop-aegis.ps1" -ForegroundColor Gray

# Open browser to the frontend
Start-Process "http://localhost:8000"
