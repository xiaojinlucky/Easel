# 为「Beav采集 → Easel」解压版扩展注册 Native Messaging 宿主。
# 不占用商业版 Beav 的 com.redbox.browser_control。
param(
  [Parameter(Mandatory = $true)][string]$ExtensionId
)
$ErrorActionPreference = 'Stop'
if ($ExtensionId -notmatch '^[a-z]{32}$') {
  throw '请提供 chrome://extensions 里 32 位扩展 ID。'
}
$root = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path -LiteralPath (Join-Path $root 'scripts\beav_native_host.py'))) {
  $root = Split-Path -Parent $PSScriptRoot
}
$project = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$python = Join-Path $project '.venv\Scripts\python.exe'
if (-not (Test-Path -LiteralPath $python)) {
  throw "找不到 $python"
}
$runtime = Join-Path $project '.runtime'
New-Item -ItemType Directory -Force -Path $runtime | Out-Null
$cmd = Join-Path $runtime 'beav-native-host.cmd'
$py = Join-Path $project 'scripts\beav_native_host.py'
@(
  '@echo off'
  "set PYTHONUTF8=1"
  "`"$python`" -u `"$py`""
) | Set-Content -LiteralPath $cmd -Encoding ASCII
$origin = "chrome-extension://$ExtensionId/"
$manifest = @{
  name = 'com.easel.research_clipper'
  description = 'Easel research ingest for personal non-commercial Beav capture plugin'
  path = $cmd
  type = 'stdio'
  allowed_origins = @($origin)
}
$manifestPath = Join-Path $runtime 'com.easel.research_clipper.json'
$manifest | ConvertTo-Json -Compress | Set-Content -LiteralPath $manifestPath -Encoding UTF8
foreach ($key in @(
  'HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.easel.research_clipper',
  'HKCU:\Software\Microsoft\Edge\NativeMessagingHosts\com.easel.research_clipper'
)) {
  New-Item -Path $key -Force | Out-Null
  Set-ItemProperty -Path $key -Name '(default)' -Value $manifestPath
}
Write-Host "registered $origin -> $manifestPath"
