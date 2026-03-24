Param(
  [string]$GatewayEnvPath = "api-gateway/.env",
  [string]$BeaconEnvPath = "echo_protocol/.env"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Load-DotEnv {
  Param([string]$Path)
  if (-not (Test-Path $Path)) { return }
  Get-Content -Raw $Path | ForEach-Object {
    $_.Split("`n") | ForEach-Object {
      $line = $_.Trim()
      if (-not $line -or $line.StartsWith('#')) { return }
      if ($line -match '^(?<k>[^=]+)=(?<v>.*)$') {
        $k = $matches['k'].Trim()
        $v = $matches['v']
        [Environment]::SetEnvironmentVariable($k, $v, 'Process') | Out-Null
      }
    }
  }
}

Set-Location (Split-Path -Parent $PSScriptRoot)

if (-not (Test-Path $GatewayEnvPath)) { $GatewayEnvPath = 'api-gateway/.env.example' }
if (-not (Test-Path $BeaconEnvPath))  { $BeaconEnvPath  = 'echo_protocol/.env.example' }
Load-DotEnv $GatewayEnvPath
Load-DotEnv $BeaconEnvPath

Write-Host "[demo] Using gateway env: $GatewayEnvPath"
Write-Host "[demo] Using beacon env:  $BeaconEnvPath"

$beaconImage = 'mp-echo-beacon'
$beaconName  = 'mp-echo-beacon-demo'

$imgOk = $false
try { docker image inspect $beaconImage *>$null; $imgOk = $true } catch { $imgOk = $false }
if (-not $imgOk) {
  Write-Host "[demo] Building beacon image..."
  docker build -t $beaconImage -f echo_protocol/Dockerfile .
}

try { docker rm -f $beaconName *>$null } catch {}
Write-Host "[demo] Starting beacon container on :5001 ..."
docker run -d --name $beaconName -p 5001:5001 --env-file $BeaconEnvPath $beaconImage | Out-Null

Write-Host "[demo] Launching backend + frontend via start-system.bat ..."
Start-Process -WindowStyle Minimized -FilePath cmd.exe -ArgumentList '/c', 'start-system.bat'

$gwTitle = 'MatchPoint Gateway'
Write-Host "[demo] Starting API Gateway on :8000 ..."
$gwCmd = "title $gwTitle && python gateway.py"
Start-Process -WindowStyle Minimized -WorkingDirectory 'api-gateway' -FilePath cmd.exe -ArgumentList '/c', $gwCmd

Start-Sleep -Seconds 2
try { Start-Process 'http://localhost:3000' } catch {}

Write-Host "[demo] Demo startup sequence dispatched."

