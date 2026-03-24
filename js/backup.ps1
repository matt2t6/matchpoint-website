<#
Creates a timestamped ZIP backup of the workspace under ./backups
#>
$ErrorActionPreference = 'Stop'

$root = Get-Location
$backupDir = Join-Path -Path $root -ChildPath 'backups'
if (-not (Test-Path $backupDir)) { New-Item -ItemType Directory -Path $backupDir | Out-Null }

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$zip = Join-Path -Path $backupDir -ChildPath ("workspace-$stamp.zip")

Write-Host "Creating backup: $zip" -ForegroundColor Cyan
Compress-Archive -Path (Join-Path $root '*') -DestinationPath $zip -Force -CompressionLevel Optimal
Write-Host "Backup created: $zip" -ForegroundColor Green

