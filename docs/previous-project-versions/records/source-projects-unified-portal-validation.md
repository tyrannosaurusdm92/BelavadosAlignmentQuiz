# TableGate Validation Report

Build version: `2026-07-28.6`  
Backend API version: `2.2.0`  
Apps Script library version: `5`

## Result

**PASS — 32 of 32 automated static checks passed.**

Validated items include:

- Exactly one physical HTML file: `tablegate.html`
- Exact requested top-level structure: `css`, `js`, `json`, `assets`, `docs`, plus root `tablegate.html` and `service-worker.js`
- No `.bat`, `.cmd`, or PowerShell launchers
- JavaScript syntax for every runtime file
- Apps Script syntax for `docs/ttrpgmessenger.gs`
- JSON and PWA-manifest parsing
- Unique element IDs and valid local HTML references
- Service-worker precache paths and `tablegate.html` navigation fallback
- Replacement Apps Script endpoint and library version 5 only
- No fixed Admins Place hosting URL and no stale `messenger.html` entry-point references
- Nine native character systems retained
- Shared 3D rolling from messenger, sheets, and rules assistant
- Dedicated auditable `record3dDiceRoll` backend route
- Backend rejection of legacy ordinary channel rolling
- Backend-validated creator/admin private-roll exception in admin-only direct messages
- Decoding and protocol checks for the embedded central 3D roller

## Runtime testing boundary

The build could not be fully exercised against real Google accounts, Drive persistence, microphones, cameras, WebRTC peers, or the deployed Apps Script database from this isolated build environment. A local Chromium launch was also blocked by the environment's browser policy. Those features require HTTPS deployment and real-user testing. No claim of live multi-user or media testing is made here.
