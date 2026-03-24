<#
Runs quick scans:
 - ESLint via npm (if available)
 - Python syntax check for backend/*.py via py_compile
#>
$ErrorActionPreference = 'Stop'

function Try-Eslint {
  try {
    Write-Host "Running ESLint (npm run lint)" -ForegroundColor Cyan
    npm run lint --silent
  }
  catch {
    Write-Warning "ESLint run failed or not installed. Skipping. ($_ )"
  }
}

function Py-Syntax {
  Write-Host "Python syntax check (py_compile)" -ForegroundColor Cyan
  Get-ChildItem -Recurse -Path "backend" -Filter *.py |
    ForEach-Object { python -m py_compile $_.FullName }
}

Try-Eslint
Py-Syntax
Write-Host "Scans complete" -ForegroundColor Green

