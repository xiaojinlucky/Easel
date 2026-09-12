$ErrorActionPreference = 'Stop'
$desktopExe = Join-Path $PSScriptRoot '.runtime\desktop-app\Easel-win32-x64\Easel.exe'
if (-not (Test-Path -LiteralPath $desktopExe)) { throw '桌面程序尚未构建，请先在 desktop 目录执行 npm ci 和 npm run package。' }
Start-Process -FilePath $desktopExe -WorkingDirectory $PSScriptRoot
