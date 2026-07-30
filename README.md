# TableGate 10.0.0 Release Candidate

TableGate is a single-page, multi-system campaign workspace combining campaign messaging, voice/video signaling, character tools, worldbuilding, maps and tokens, session dice, organizer tools, Effects Studio, a campaign hub, NPC life simulation, and an embedded nine-system JSON knowledge library.

## Start

Serve this folder from HTTPS or localhost and open `TableGate.html`. GitHub Pages is suitable for the frontend. The frontend is locked to the supplied Apps Script web app and library version listed in `json/app-config.json`.

## Release changes

- The supplied `tablegate_backend_v3.gs` is preserved byte-for-byte under `backend/`; it was not rewritten.
- Legacy frontend “server” calls now translate to the backend’s actual “tablegate” routes.
- Existing backend Projects, ProjectItems, Assets, Attachments, Knowledge, Dice, and System Documents routes synchronize tools that were formerly local-only.
- The Backend Center exposes all 223 supplied backend routes through a searchable, permission-enforced frontend.
- The nine-system pack is embedded under `json/knowledge-pack/` with 244 JSON files and a searchable browser.
- Password recovery uses the backend’s actual email/code reset workflow.

See `docs/RELEASE_README_v10.md`, `docs/BACKEND_FRONTEND_PARITY_v10.md`, `docs/KNOWLEDGE_PACK_INTEGRATION_v10.md`, and `docs/TEST_REPORT_v10.md`.
