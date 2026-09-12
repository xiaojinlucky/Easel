param([ValidateSet('start','stop','restart','status','logs')][string]$Action='status')
$ErrorActionPreference = 'Stop'
$EaselRoot = Split-Path -Parent $PSScriptRoot
if ($Action -eq 'logs') {
    Get-Content -LiteralPath (Join-Path $EaselRoot '.runtime\logs\gateway.log') -Tail 50 -Wait
    exit
}
Push-Location $EaselRoot
try { & '.\.venv\Scripts\python.exe' -m easel.services $Action gateway; exit $LASTEXITCODE }
finally { Pop-Location }
