$ErrorActionPreference = 'Stop'
$easelRoot = Split-Path -Parent $PSScriptRoot
$easelExe = Join-Path $easelRoot '.runtime\desktop-app\Easel-win32-x64\Easel.exe'
if (-not (Test-Path -LiteralPath $easelExe)) { throw '先运行 npm run package 生成桌面程序。' }
$shortcutShell = New-Object -ComObject WScript.Shell
foreach ($folder in @([Environment]::GetFolderPath('DesktopDirectory'), [Environment]::GetFolderPath('Programs'))) {
    $shortcutPath = Join-Path $folder 'Easel 自媒体工作台.lnk'
    $shortcut = $shortcutShell.CreateShortcut($shortcutPath)
    $shortcut.TargetPath = $easelExe
    $shortcut.WorkingDirectory = $easelRoot
    $shortcut.IconLocation = $easelExe + ',0'
    $shortcut.Description = 'Easel 自媒体桌面工作台'
    $shortcut.WindowStyle = 1
    $shortcut.Save()
    $readback = $shortcutShell.CreateShortcut($shortcutPath)
    if ($readback.TargetPath -ne $easelExe) { throw '快捷方式读回不一致。' }
    Write-Output $shortcutPath
}
