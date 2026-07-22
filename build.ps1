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

# Compress-Archive (PS 5.1) ecrit des antislashs dans les entrees du zip,
# ce que AMO et le Chrome Web Store rejettent. On zippe donc via .NET
# en forcant des slashs.
Add-Type -AssemblyName System.IO.Compression | Out-Null
Add-Type -AssemblyName System.IO.Compression.FileSystem | Out-Null
function New-CleanZip([string]$sourceDir, [string]$zipPath) {
  if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
  $zip = [System.IO.Compression.ZipFile]::Open($zipPath, [System.IO.Compression.ZipArchiveMode]::Create)
  try {
    Get-ChildItem $sourceDir -Recurse -File | ForEach-Object {
      $rel = $_.FullName.Substring($sourceDir.Length).TrimStart('\', '/').Replace('\', '/')
      [void][System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $rel)
    }
  } finally { $zip.Dispose() }
}
New-CleanZip (Join-Path $dist 'firefox') (Join-Path $dist "opuschange-firefox-$version.zip")
New-CleanZip (Join-Path $dist 'chrome') (Join-Path $dist "opuschange-chrome-$version.zip")
Write-Host "Build OK - dist/firefox, dist/chrome, zips v$version"
