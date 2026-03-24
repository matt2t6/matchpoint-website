<#
Auto-setup for workspace (Windows/PowerShell)
 - Installs Node deps if node_modules missing
 - Creates backend/.venv if missing
 - Installs backend requirements
 - Ensures debugpy is installed
Safe to re-run; skips work when already set up.
#>

$ErrorActionPreference = 'Stop'

function Write-Section($text) { Write-Host "`n=== $text ===" -ForegroundColor Cyan }
function Exists($path) { Test-Path -Path $path -PathType Any }

function Ensure-NodeDeps {
  if (-not (Exists "node_modules")) {
    Write-Section "Installing Node dependencies (npm install)"
    npm install
  }
  else {
    Write-Host "node_modules exists — skipping" -ForegroundColor DarkGray
  }
}

function Ensure-Venv {
  $venvPath = Join-Path -Path "backend" -ChildPath ".venv"
  if (-not (Exists $venvPath)) {
    Write-Section "Creating Python venv at backend/.venv"
    if (Get-Command py -ErrorAction SilentlyContinue) {
      py -3 -m venv $venvPath
    }
    else {
      python -m venv $venvPath
    }
  }
  else {
    Write-Host "backend/.venv exists — skipping" -ForegroundColor DarkGray
  }
}

function Ensure-BackendRequirements {
  if (Exists "backend/requirements.txt") {
    Write-Section "Installing backend requirements"
    $pip = Join-Path -Path "backend/.venv/Scripts" -ChildPath "pip.exe"
    if (-not (Exists $pip)) { throw "pip not found at $pip. Was venv created?" }
    & $pip install -r "backend/requirements.txt"
  }
  else {
    Write-Host "backend/requirements.txt not found — skipping" -ForegroundColor DarkGray
  }
}

function Ensure-Debugpy {
  Write-Section "Ensuring debugpy is installed"
  $pyExe = Join-Path -Path "backend/.venv/Scripts" -ChildPath "python.exe"
  if (-not (Exists $pyExe)) { throw "python.exe not found at $pyExe. Was venv created?" }
  & $pyExe -m pip install --upgrade debugpy
}

Write-Section "Auto-setup starting"
Ensure-NodeDeps
Ensure-Venv
Ensure-BackendRequirements
Ensure-Debugpy
Write-Section "Auto-setup complete"

