$ErrorActionPreference = 'Stop'
$env:PYTHONUTF8 = '1'
Push-Location $PSScriptRoot
try { & (Join-Path $PSScriptRoot '.venv\Scripts\python.exe') -m easel.services stop web gateway cloak platforms }
finally { Pop-Location }
