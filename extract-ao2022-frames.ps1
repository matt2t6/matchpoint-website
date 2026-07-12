$ErrorActionPreference = 'Stop'

$ProjectRoot  = 'C:\PROJECT\matchpoint-website'
$SourceJs     = Join-Path $ProjectRoot 'assets\js\ao2022_frames.js'
$OutputJson   = Join-Path $ProjectRoot 'ao2022_frames.json'
$BackupRoot   = Join-Path $ProjectRoot '_safety-backups'
$Timestamp    = Get-Date -Format 'yyyyMMdd-HHmmss'
$BackupFolder = Join-Path $BackupRoot "frames-extract-$Timestamp"

if (-not (Test-Path -LiteralPath $SourceJs)) {
  throw "STOPPED: Source file not found: $SourceJs"
}

New-Item -ItemType Directory -Path $BackupFolder -Force | Out-Null

if (Test-Path -LiteralPath $OutputJson) {
  Copy-Item -LiteralPath $OutputJson -Destination $BackupFolder -Force
  Write-Host "Backed up existing ao2022_frames.json" -ForegroundColor DarkGray
}

$js = Get-Content -LiteralPath $SourceJs -Raw -Encoding UTF8

@"
import json, re, sys
from pathlib import Path

js = Path(r'$SourceJs').read_text(encoding='utf-8-sig')

patterns = [
    r'window\.AO2022FRAMES\s*=\s*(\[[\s\S]*\])\s*;?\s*$',
    r'(?:const|var|let)\s+\w+\s*=\s*(\[[\s\S]*\])\s*;?\s*$',
    r'(?:module\.exports\s*=\s*)?(\[[\s\S]*\])\s*;?\s*$',
]

data = None
for pat in patterns:
    m = re.search(pat, js.strip())
    if m:
        try:
            data = json.loads(m.group(1))
            print(f'Matched pattern: {pat[:40]}...')
            break
        except json.JSONDecodeError as e:
            print(f'Pattern matched but JSON invalid: {e}', file=sys.stderr)

if data is None:
    print('ERROR: Could not extract a JSON array from the JS file.', file=sys.stderr)
    sys.exit(1)

out = Path(r'$OutputJson')
out.write_text(json.dumps(data, separators=(',', ':')), encoding='utf-8')

print(f'Frames extracted: {len(data):,}')
print(f'Output:           {out.resolve()}')
print(f'Output size:      {out.stat().st_size:,} bytes')
print('SUCCESS')
"@ | python -