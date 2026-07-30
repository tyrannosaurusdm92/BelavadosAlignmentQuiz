# Validation Checklist

- Exactly one HTML file: `tablegate.html`.
- Requested top-level folders only: `css`, `js`, `json`, `assets`, `docs`.
- Root runtime files: `tablegate.html`, `service-worker.js`, `manifest.webmanifest`.
- No BAT, CMD, or PowerShell files.
- All browser JavaScript and service worker files pass `node --check`.
- All JSON and web manifest files parse successfully.
- All local HTML/CSS/JS/image/audio references resolve.
- Backend and library references match the supplied deployment and version 5.
- Service worker caches the renamed entry file and new studio assets.
- System reference JSON files are preserved under `json/systems`.
- Source licenses/readmes and integration decisions are recorded under `docs`.
- ZIP package remains below the requested 80,000 KB limit.

Live authentication, Google Drive persistence, microphone/camera permissions, multi-user WebRTC, and optional studio backend actions require testing against the deployed Apps Script service over HTTPS.

## Headless browser smoke test

A Chromium test with mocked backend responses completed without console or page errors. It authenticated a test campaign, opened World, created and saved an article, uploaded an atlas image, placed a pin, opened Tabletop, uploaded a scene background, added a token, added and rolled initiative, rolled `2d6+3`, rerolled a character stat, and saved a new character.
