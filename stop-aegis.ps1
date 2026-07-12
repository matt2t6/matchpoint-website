# stop-aegis.ps1 - Kill all MatchPoint related processes
Write-Host ">>> Stopping MatchPoint Aegis Services..." -ForegroundColor Yellow

# Ports to clear: 3000 (Alt Vite), 5000 (Flask), 5001 (FastAPI Echo), 8000 (Main Vite), 8081 (SSE Bridge)
$ports = @(3000, 5000, 5001, 8000, 8081)

foreach ($port in $ports) {
    $procIds = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue |
               Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($procId in $procIds) {
        try {
            $name = (Get-Process -Id $procId).ProcessName
            Write-Host "   Stopping $name on port $port (PID: $procId)" -ForegroundColor Gray
            Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
        } catch {}
    }
}

# General cleanup for leftover Node/Python processes
Get-Process | Where-Object {
    $_.ProcessName -match "node|npm" -or
    ($_.ProcessName -match "python" -and ($_.CommandLine -match "app.py|matchpoint_api.py|sse_bridge_pro.py"))
} | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "   All MatchPoint services stopped." -ForegroundColor Green
