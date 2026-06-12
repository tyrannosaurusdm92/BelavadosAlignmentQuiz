@echo off
cd /d "%~dp0"
set "ONYX_MAP_ASSET_DIR=C:\Users\Public\Pictures\map_assets"
echo Starting Onyx local preview and image bridge...
echo Real image folder: %ONYX_MAP_ASSET_DIR%
echo.
echo When the server starts, open this address in Chrome or Edge:
echo http://127.0.0.1:5177/
echo.
echo Keep this window open while Onyx builds ZIP packages.
echo.
node tools\start-local-preview.mjs
pause
