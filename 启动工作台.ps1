param([switch]$NoBrowser, [switch]$NoPlatforms)
$ErrorActionPreference = 'Stop'
$env:PYTHONUTF8 = '1'
Push-Location $PSScriptRoot
try {
    & (Join-Path $PSScriptRoot '.venv\Scripts\python.exe') -m easel.services start gateway web
    if ($LASTEXITCODE -ne 0) { throw '启动失败，请查看 .runtime/logs。' }
    if (-not $NoPlatforms) {
        & (Join-Path $PSScriptRoot '.venv\Scripts\python.exe') -m easel.services start platforms
        if ($LASTEXITCODE -ne 0) { throw '发布 / 订阅服务启动失败，请查看 .runtime/logs/platforms.log。' }
    }
    if (-not $NoBrowser) { Start-Process 'http://127.0.0.1:7860/' }
} finally { Pop-Location }
