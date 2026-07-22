# OpusChange - assemble les versions Firefox (MV2) et Chromium (MV3) dans dist/.
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$manifest = Get-Content (Join-Path $root 'manifest.json') -Raw | ConvertFrom-Json
$version = $manifest.version
$dist = Join-Path $root 'dist'
if (Test-Path $dist) { Remove-Item $dist -Recurse -Force }

foreach ($target in 'firefox', 'chrome') {
  $out = Join-Path $dist $target
  New-Item -ItemType Directory -Force $out | Out-Null
  Copy-Item (Join-Path $root 'background.js') $out
  Copy-Item (Join-Path $root 'content') $out -Recurse
  Copy-Item (Join-Path $root '_locales') $out -Recurse
  Copy-Item (Join-Path $root 'LICENSE') $out
  New-Item -ItemType Directory -Force (Join-Path $out 'icons') | Out-Null
  Copy-Item (Join-Path $root 'icons\*.png') (Join-Path $out 'icons')
}
Copy-Item (Join-Path $root 'manifest.json') (Join-Path $dist 'firefox\manifest.json')
Copy-Item (Join-Path $root 'manifest.chrome.json') (Join-Path $dist 'chrome\manifest.json')

Compress-Archive -Path (Join-Path $dist 'firefox\*') -DestinationPath (Join-Path $dist "opuschange-firefox-$version.zip") -Force
Compress-Archive -Path (Join-Path $dist 'chrome\*') -DestinationPath (Join-Path $dist "opuschange-chrome-$version.zip") -Force
Write-Host "Build OK - dist/firefox, dist/chrome, zips v$version"
