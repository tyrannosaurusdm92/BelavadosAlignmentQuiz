Set-Location -LiteralPath $PSScriptRoot
$env:ONYX_MAP_ASSET_DIR = 'C:\Users\Public\Pictures\map_assets'
Write-Host 'Starting Onyx local preview and image bridge...'
Write-Host "Real image folder: $env:ONYX_MAP_ASSET_DIR"
Write-Host 'Open http://127.0.0.1:5177/ in Chrome or Edge and keep this window open.'
node tools/start-local-preview.mjs
Read-Host 'Press Enter to close'
