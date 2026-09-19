# 启动上游原版 Easel Web（与二次开发版隔离的目录与虚拟环境）。
# 默认端口 7870，避免和二次开发版的 7860 抢端口。
# 同一时间不要开两套「对话网关」：对话功能需要 18789。若桌面版二次开发还在跑，先关掉它再在本目录执行：
#   .\.venv\Scripts\easel.exe gateway start
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Easel = Join-Path $Root '.venv\Scripts\easel.exe'
if (-not (Test-Path $Easel)) {
    Write-Error "还没装好。请先在本目录用 .venv 安装： .\.venv\Scripts\python.exe -m pip install -e ."
}
$env:PYTHONUTF8 = '1'
$env:EASEL_PORT = '7870'
Write-Host "请用 http://127.0.0.1:7870 ，不要点桌面上的「Easel 自媒体工作台」快捷方式（那是二次开发版）。" -ForegroundColor Yellow
Write-Host "正在启动对话网关（18789）..." -ForegroundColor Cyan
& powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $Root 'scripts\gateway.ps1') start
Write-Host "原版工作台：http://127.0.0.1:7870" -ForegroundColor Cyan
& $Easel web --port 7870
