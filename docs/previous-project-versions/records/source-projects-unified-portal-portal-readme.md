# TableGate Multi-System Session Portal

Open `tablegate.html`. No Windows batch file or local server is required.

## Session architecture

- TableGate is the shell.
- The Dice Roller is the second internal page.
- The iframe underneath the transparent 3D dice stage accepts only characters already saved to the signed-in Portal profile.
- Blank sheets and character creation remain in Character Studio.
- Every gameplay roll is intercepted and sent to the central multi-system 3D dice engine.
- Ability/stat generation and explicitly provided stat rerolls remain local to character creation sheets.

## Backend

- Endpoint: `https://script.google.com/macros/s/AKfycbylmceRVx5UcgMvMDkwym_9h0wv8gM5B9Msuui7-7Z6lqoYlqZBR6Y47hmsauQgoGXY/exec`
- Apps Script library: `18ET55A9uVNx3IUzoAM_eRj8v7jqagPgjVdxil3P1SoUqrFnnAJp6CjVr`
- Version: `5`

`service-worker.js` enables caching when the project is served over HTTP/HTTPS. Direct opening remains supported without it.

## Documentation

- `ARCHITECTURE.md` — component and message-routing design
- `SOURCE_AUDIT.md` — merge inputs and package constraints
- `LICENSES.md` — licensing boundary and source notices
- `SYSTEM_FEATURE_MATRIX.md` — supported systems and roll behavior
- `TEST_REPORT.md` / `VALIDATION_REPORT.json` — validation evidence
- `GITHUB_PACKAGE_MANIFEST.json` / `BUILD_MANIFEST.json` — deploy and file manifests

## Character token studio

- Open **Player Profile** and choose **Create Token** or **Edit Token** on any saved character.
- Upload character artwork or reuse compatible artwork already stored in the character sheet.
- Drag, zoom, and precisely reposition the circular crop.
- Use the supplied gold reference ring, choose a solid border color, or upload an image to texture the circular border.
- Custom border textures can fill or tile around the ring.
- Save a compact transparent token to the character and download a 1024 × 1024 transparent PNG.
- Editable source artwork and texture settings are retained in IndexedDB when the browser supports it; the finished token remains part of the saved character/profile record.
