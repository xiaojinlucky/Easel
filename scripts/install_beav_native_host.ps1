# Register Native Messaging host for unpacked Beav capture -> Easel.
# Chrome Native Messaging breaks if the host cmd/json path contains non-ASCII.
# Live host files stay under %LOCALAPPDATA%\easel-native-host (ASCII).
# Does not overwrite commercial Beav host com.redbox.browser_control.
param(
  [Parameter(Mandatory = $true)][string]$ExtensionId
)
$ErrorActionPreference = 'Stop'
if ($ExtensionId -notmatch '^[a-z]{32}$') {
  throw 'Need 32-letter extension id from chrome://extensions'
}

function Test-AsciiPath([string]$Path) {
  return [string]::IsNullOrEmpty($Path) -eq $false -and $Path -match '^[\x00-\x7F]+$'
}

$project = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$sourcePy = Join-Path $project 'scripts\beav_native_host.py'
if (-not (Test-Path -LiteralPath $sourcePy)) {
  throw "missing $sourcePy"
}

$hostDir = Join-Path $env:LOCALAPPDATA 'easel-native-host'
if (-not (Test-AsciiPath $hostDir)) {
  throw "LOCALAPPDATA is not ASCII: $hostDir"
}
New-Item -ItemType Directory -Force -Path $hostDir | Out-Null

$python = $null
$candidates = @(
  (Join-Path $env:APPDATA 'uv\python\cpython-3.12-windows-x86_64-none\python.exe'),
  (Join-Path $project '.venv\Scripts\python.exe')
)
try { $candidates += (Get-Command python.exe -ErrorAction Stop).Source } catch {}
foreach ($candidate in $candidates) {
  if ($candidate -and (Test-Path -LiteralPath $candidate) -and (Test-AsciiPath $candidate)) {
    $python = $candidate
    break
  }
}
if (-not $python) {
  throw 'Need a Python interpreter on an ASCII-only path for Chrome Native Messaging'
}

Copy-Item -LiteralPath $sourcePy -Destination (Join-Path $hostDir 'beav_native_host.py') -Force
[System.IO.File]::WriteAllText(
  (Join-Path $hostDir 'easel-root.txt'),
  $project.Trim(),
  [System.Text.UTF8Encoding]::new($false)
)

$pyHost = Join-Path $hostDir 'beav_native_host.py'
$cmd = Join-Path $hostDir 'host.cmd'
@(
  '@echo off'
  'set PYTHONUTF8=1'
  "`"$python`" -u `"$pyHost`""
) | Set-Content -LiteralPath $cmd -Encoding ASCII

$origin = "chrome-extension://$ExtensionId/"
$manifestPath = Join-Path $hostDir 'com.easel.research_clipper.json'
$manifest = @{
  name = 'com.easel.research_clipper'
  description = 'Easel research ingest'
  path = $cmd
  type = 'stdio'
  allowed_origins = @($origin)
}
$json = $manifest | ConvertTo-Json -Compress
if (-not (Test-AsciiPath $json)) {
  throw 'native host manifest must stay ASCII'
}
Set-Content -LiteralPath $manifestPath -Value $json -Encoding ASCII

foreach ($key in @(
  'HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.easel.research_clipper',
  'HKCU:\Software\Microsoft\Edge\NativeMessagingHosts\com.easel.research_clipper'
)) {
  New-Item -Path $key -Force | Out-Null
  Set-ItemProperty -Path $key -Name '(default)' -Value $manifestPath
}

Write-Host "registered $origin -> $manifestPath"
Write-Host "python $python"
