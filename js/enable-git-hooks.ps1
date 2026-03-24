<#
Sets Git to use the .githooks directory for hooks.
Run once: powershell -NoProfile -File scripts/enable-git-hooks.ps1
#>
$ErrorActionPreference = 'Stop'
git config core.hooksPath .githooks
Write-Host "Configured git core.hooksPath to .githooks" -ForegroundColor Green

