# TableGate Unified TTRPG Campaign App

Open `tablegate.html`. It is the only physical HTML file in the package.

TableGate combines the invite-only campaign messenger, text and direct messaging, WebRTC voice/video, shared organizer, task board, approval-based calendar, availability tracking, TTRPG rules-file library, grounded rules assistant, nine native character systems, character token studio, and shared 3D session dice table.

## Backend

- Web app: `https://script.google.com/macros/s/AKfycbylmceRVx5UcgMvMDkwym_9h0wv8gM5B9Msuui7-7Z6lqoYlqZBR6Y47hmsauQgoGXY/exec`
- Apps Script library: `18ET55A9uVNx3IUzoAM_eRj8v7jqagPgjVdxil3P1SoUqrFnnAJp6CjVr`
- Library version: `5`

The application is portable. Copy the complete folder into any campaign location while preserving relative paths. Invite links derive from the currently opened `tablegate.html`, not from a fixed GitHub Pages folder.

## Rolling policy

All ordinary campaign and character-sheet rolls open the shared 3D session area. Native character-sheet roll controls route to that same central 3D resolver. Character-creation stat generation and explicitly allowed stat rerolls remain inside the native character sheet.

The only private exception is an administrator-only direct message. The campaign creator or an authorized administrator may use the private roll control only when every participant in the selected DM is also an administrator for that campaign. The backend independently validates this rule.

## Hosting and installation

Use a normal HTTPS host such as GitHub Pages. The root `service-worker.js` and `assets/manifest.webmanifest` support installation on compatible desktop and mobile browsers. No Windows batch, command, or PowerShell launcher is required.
