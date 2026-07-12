$ErrorActionPreference = 'Stop'

$ProjectRoot = 'C:\PROJECT\matchpoint-website'
Set-Location -LiteralPath $ProjectRoot

$Timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$BackupRoot = Join-Path $ProjectRoot "_safety-backups\vite-setup-$Timestamp"
New-Item -ItemType Directory -Path $BackupRoot -Force | Out-Null

if (-not (Test-Path -LiteralPath (Join-Path $ProjectRoot 'package.json') -PathType Leaf)) {
  throw "STOPPED: package.json was not found in $ProjectRoot"
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  throw 'STOPPED: npm was not found. Install Node.js LTS, then run this script again.'
}

$ViteConfigPath = Join-Path $ProjectRoot 'vite.config.js'
$StartScriptPath = Join-Path $ProjectRoot 'start-vite-pitch.ps1'
$PackagePath = Join-Path $ProjectRoot 'package.json'

if (Test-Path -LiteralPath $ViteConfigPath) {
  Copy-Item -LiteralPath $ViteConfigPath -Destination $BackupRoot -Force
}

if (Test-Path -LiteralPath $StartScriptPath) {
  Copy-Item -LiteralPath $StartScriptPath -Destination $BackupRoot -Force
}

Copy-Item -LiteralPath $PackagePath -Destination $BackupRoot -Force

$ViteConfig = @'
import { defineConfig } from 'vite'

const backend = 'http://127.0.0.1:5000'

export default defineConfig({
  server: {
    host: '127.0.0.1',
    port: 8000,
    strictPort: true,
    proxy: {
      '/api': {
        target: backend,
        changeOrigin: true
      },
      '/sse': {
        target: backend,
        changeOrigin: true
      },
      '/stream': {
        target: backend,
        changeOrigin: true
      },
      '/metrics': {
        target: backend,
        changeOrigin: true
      },
      '/health': {
        target: backend,
        changeOrigin: true
      }
    }
  }
})
'@

Set-Content -LiteralPath $ViteConfigPath -Value $ViteConfig -Encoding utf8

$Package = Get-Content -LiteralPath $PackagePath -Raw | ConvertFrom-Json

if (-not $Package.PSObject.Properties['scripts']) {
  $Package | Add-Member -MemberType NoteProperty -Name scripts -Value ([PSCustomObject]@{})
}

$Package.scripts | Add-Member `
  -MemberType NoteProperty `
  -Name 'dev' `
  -Value 'vite --host 127.0.0.1 --port 8000 --strictPort' `
  -Force

$Package.scripts | Add-Member `
  -MemberType NoteProperty `
  -Name 'start:frontend' `
  -Value 'npm run dev' `
  -Force

$Package |
  ConvertTo-Json -Depth 20 |
  Set-Content -LiteralPath $PackagePath -Encoding utf8

$StartScript = @'
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
'@

Set-Content -LiteralPath $StartScriptPath -Value $StartScript -Encoding utf8

$ViteInstalled = $false
try {
  npm exec vite -- --version | Out-Null
  $ViteInstalled = $true
}
catch {
  $ViteInstalled = $false
}

Write-Host ''
if ($ViteInstalled) {
  Write-Host 'SUCCESS: Vite is available and the proxy setup is ready.' -ForegroundColor Green
  Write-Host 'Run: .\start-vite-pitch.ps1' -ForegroundColor Cyan
}
else {
  Write-Host 'Vite config and startup script were created, but Vite is not installed yet.' -ForegroundColor Yellow
  Write-Host 'Run this once: npm install --save-dev vite' -ForegroundColor Cyan
  Write-Host 'Then run:      .\start-vite-pitch.ps1' -ForegroundColor Cyan
}

Write-Host "Backup: $BackupRoot" -ForegroundColor DarkGray