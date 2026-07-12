$ErrorActionPreference = 'Stop'

$ProjectRoot  = 'C:\PROJECT\matchpoint-website'
$IndexPath    = Join-Path $ProjectRoot 'index.html'
$BackupRoot   = Join-Path $ProjectRoot '_safety-backups'
$Timestamp    = Get-Date -Format 'yyyyMMdd-HHmmss'
$BackupFolder = Join-Path $BackupRoot "null-widget-fix-$Timestamp"

New-Item -ItemType Directory -Path $BackupFolder -Force | Out-Null
Copy-Item -LiteralPath $IndexPath -Destination $BackupFolder -Force
Write-Host "Backed up index.html" -ForegroundColor DarkGray

@"
import re
from pathlib import Path

index = Path(r'$IndexPath')
content = index.read_text(encoding='utf-8')

old_serve = '''      function refreshServeSpeed() {
        const speed = Math.floor(Math.random() * 12) + 112; // 112-123 mph — Nadal AO2022 avg 116, max 124
        const maxSpeed = Math.floor(Math.random() * 5) + 120; // 120-125 mph
        document.getElementById("serve-speed").textContent = speed;
        document.getElementById("max-serve").textContent = maxSpeed + " mph";
      }'''

new_serve = '''      function refreshServeSpeed(data) {
        const speed = (data && data.serveSpeed !== undefined) ? data.serveSpeed : Math.floor(Math.random() * 12) + 112;
        const maxSpeed = (data && data.maxServe !== undefined) ? data.maxServe : Math.floor(Math.random() * 5) + 120;
        const el1 = document.getElementById("serve-speed");
        const el2 = document.getElementById("max-serve");
        if (el1) el1.textContent = speed;
        if (el2) el2.textContent = maxSpeed + " mph";
      }'''

old_spin = '''      function refreshSpinRate() {
        const spinRate = Math.floor(Math.random() * 1500) + 2000; // 2000-3500 rpm
        const spinTypes = ["Topspin", "Backspin", "Sidespin", "Flat"];
        const spinType = spinTypes[Math.floor(Math.random() * spinTypes.length)];
        document.getElementById("spin-rate").textContent = spinRate;
        document.getElementById("spin-type").textContent = spinType;
      }'''

new_spin = '''      function refreshSpinRate(data) {
        const spinRate = (data && data.spinRate !== undefined) ? data.spinRate : Math.floor(Math.random() * 1500) + 2000;
        const spinTypes = ["Topspin", "Backspin", "Sidespin", "Flat"];
        const spinType = (data && data.spinType) ? data.spinType : spinTypes[Math.floor(Math.random() * spinTypes.length)];
        const el1 = document.getElementById("spin-rate");
        const el2 = document.getElementById("spin-type");
        if (el1) el1.textContent = spinRate;
        if (el2) el2.textContent = spinType;
      }'''

fixed = content
patched = []

if old_serve in fixed:
    fixed = fixed.replace(old_serve, new_serve)
    patched.append('refreshServeSpeed')
else:
    print('WARNING: refreshServeSpeed pattern not matched exactly')

if old_spin in fixed:
    fixed = fixed.replace(old_spin, new_spin)
    patched.append('refreshSpinRate')
else:
    print('WARNING: refreshSpinRate pattern not matched exactly')

if patched:
    index.write_text(fixed, encoding='utf-8')
    print(f'SUCCESS: Patched {len(patched)} functions: {patched}')
else:
    print('ERROR: No functions were patched - check whitespace/indentation')
"@ | python -