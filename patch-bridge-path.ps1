$ErrorActionPreference = 'Stop'

$ProjectRoot  = 'C:\PROJECT\matchpoint-website'
$BridgePath   = Join-Path $ProjectRoot 'aegis_sse_bridge.py'
$BackupRoot   = Join-Path $ProjectRoot '_safety-backups'
$Timestamp    = Get-Date -Format 'yyyyMMdd-HHmmss'
$BackupFolder = Join-Path $BackupRoot "bridge-patch-$Timestamp"

if (-not (Test-Path -LiteralPath $BridgePath)) {
  throw "STOPPED: Bridge file not found: $BridgePath"
}

New-Item -ItemType Directory -Path $BackupFolder -Force | Out-Null
Copy-Item -LiteralPath $BridgePath -Destination $BackupFolder -Force
Write-Host "Backed up aegis_sse_bridge.py" -ForegroundColor DarkGray

$content = Get-Content -LiteralPath $BridgePath -Raw -Encoding UTF8

$oldPatterns = @(
  'Path("ao2022frames.json")',
  "Path('ao2022frames.json')",
  'Path("ao2022_frames.json")',
  "Path('ao2022_frames.json')"
)

$newPath = 'Path(__file__).parent / "ao2022_frames.json"'
$patched = $false

foreach ($old in $oldPatterns) {
  if ($content -like "*$old*") {
    $content = $content.Replace($old, $newPath)
    Write-Host "Replaced: $old" -ForegroundColor Yellow
    $patched = $true
  }
}

if (-not $patched) {
  Write-Host ''
  Write-Host 'WARNING: No matching path pattern found in bridge file.' -ForegroundColor Yellow
  Write-Host 'Search the bridge manually for the telemetry load line.' -ForegroundColor Yellow
  Write-Host 'No changes were made.' -ForegroundColor Cyan
  exit 0
}

Set-Content -LiteralPath $BridgePath -Value $content -Encoding UTF8 -NoNewline

Write-Host ''
Write-Host 'SUCCESS: Bridge path patched.' -ForegroundColor Green
Write-Host "Bridge: $BridgePath"
Write-Host "Backup: $BackupFolder"
Write-Host ''
Write-Host 'The bridge will now always find ao2022_frames.json' -ForegroundColor Cyan
Write-Host 'relative to its own file location, regardless of' -ForegroundColor Cyan
Write-Host 'which directory the server is launched from.' -ForegroundColor Cyan