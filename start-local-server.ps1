$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = 4173
$serverIsRunning = @(Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue).Count -gt 0

if (-not $serverIsRunning) {
  if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    throw 'Python was not found. Install Python 3, then run this script again.'
  }
  Start-Process -FilePath 'python' -ArgumentList "-m http.server $port --bind 127.0.0.1" -WorkingDirectory $root -WindowStyle Hidden
  Start-Sleep -Milliseconds 700
}

Start-Process "http://127.0.0.1:$port/index.html"
