param(
  [string]$DestRoot = "coaching_personas"
)

$ErrorActionPreference = 'Stop'

function Ensure-Dir($p) {
  if (-not (Test-Path $p)) { New-Item -ItemType Directory -Path $p | Out-Null }
}

Write-Host "Preparing destination under: $DestRoot" -ForegroundColor Cyan
Ensure-Dir $DestRoot
Ensure-Dir (Join-Path $DestRoot 'sources')

$sources = @(
  'C:\OLDMatchPoint_SloganMining',
  'C:\OLDmatchpoint_slogan_synth_bundle',
  'C:\OLDmatchpoint_pipeline_export\night_miner',
  'C:\matchpoint-dashboard\public\assets\coach_slogans'
)

foreach ($src in $sources) {
  if (Test-Path $src) {
    $name = Split-Path $src -Leaf
    $target = Join-Path (Join-Path $DestRoot 'sources') $name
    Write-Host "Copying $src -> $target" -ForegroundColor Green
    Copy-Item -Path $src -Destination $target -Recurse -Force -ErrorAction Continue
  } else {
    Write-Warning "Source not found: $src (skipping)"
  }
}

Write-Host "Done. Sources copied under $DestRoot\sources" -ForegroundColor Green

