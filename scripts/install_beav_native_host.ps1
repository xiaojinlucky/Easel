# Register Native Messaging host for unpacked Beav capture -> Easel.
# Chrome Native Messaging breaks if the host cmd/json path contains non-ASCII.
# A .cmd wrapper also makes Chrome show an Errors badge even when ping works.
# Live host files stay under %LOCALAPPDATA%\easel-native-host (ASCII .exe).
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
$stubGo = Join-Path $project 'scripts\beav_native_host_stub.go'
if (-not (Test-Path -LiteralPath $sourcePy)) {
  throw "missing $sourcePy"
}
if (-not (Test-Path -LiteralPath $stubGo)) {
  throw "missing $stubGo"
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
[System.IO.File]::WriteAllText(
  (Join-Path $hostDir 'python-path.txt'),
  $python.Trim(),
  [System.Text.ASCIIEncoding]::new()
)

$exe = Join-Path $hostDir 'host.exe'
$go = $null
try { $go = (Get-Command go.exe -ErrorAction Stop).Source } catch {}
if (-not $go) {
  throw 'Need go.exe to build the Native Messaging launcher (host.cmd makes Chrome show Errors)'
}
$env:CGO_ENABLED = '0'
$env:GO111MODULE = 'off'
& $go build -trimpath -ldflags '-s -w' -o $exe $stubGo
if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $exe)) {
  throw "go build failed for $exe"
}
if (-not (Test-AsciiPath $exe)) {
  throw "host.exe path is not ASCII: $exe"
}

$origin = "chrome-extension://$ExtensionId/"
$manifestPath = Join-Path $hostDir 'com.easel.research_clipper.json'
$manifest = @{
  name = 'com.easel.research_clipper'
  description = 'Easel research ingest'
  path = $exe
  type = 'stdio'
  allowed_origins = @($origin)
}
$json = $manifest | ConvertTo-Json -Compress
if (-not (Test-AsciiPath $json)) {
  throw 'native host manifest must stay ASCII'
}
[System.IO.File]::WriteAllText($manifestPath, $json, [System.Text.ASCIIEncoding]::new())

foreach ($key in @(
  'HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.easel.research_clipper',
  'HKCU:\Software\Microsoft\Edge\NativeMessagingHosts\com.easel.research_clipper'
)) {
  New-Item -Path $key -Force | Out-Null
  Set-ItemProperty -Path $key -Name '(default)' -Value $manifestPath
}

$oldCmd = Join-Path $hostDir 'host.cmd'
if (Test-Path -LiteralPath $oldCmd) {
  Remove-Item -LiteralPath $oldCmd -ErrorAction SilentlyContinue
}

Write-Host "registered $origin -> $manifestPath"
Write-Host "host $exe"
Write-Host "python $python"
