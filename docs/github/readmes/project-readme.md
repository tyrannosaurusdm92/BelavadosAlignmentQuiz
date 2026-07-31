# TableGate 10.0.0 — Unified Reorganized Release

TableGate is a single-page, multi-system campaign workspace combining authentication, campaign messaging, voice/video signaling, character tools, worldbuilding, Campaign Hub, maps and tokens, Effects Studio, Creator Forge, NPC life simulation, session dice, organizer tools, and the included nine-system reference library.

## Open the project

Serve this directory from HTTPS or localhost and open `tablegate.html`. The archive extracts directly to the project root; there is no wrapper directory. The only root files are `tablegate.html` and `service-worker.js`. All remaining material is under `css/`, `js/`, `json/`, `assets/`, `backend/`, and `docs/`.

A simple local server can be started with a static host such as `python -m http.server` from the project root. Direct `file://` use is not recommended because browser security rules can block modules, fetches, storage, service workers, and embedded tools.

## Supplied backend integration

The frontend is configured for the supplied Apps Script deployment and library version 6:

- Web app: `https://script.google.com/macros/s/AKfycbylmceRVx5UcgMvMDkwym_9h0wv8gM5B9Msuui7-7Z6lqoYlqZBR6Y47hmsauQgoGXY/exec`
- Apps Script library: `https://script.google.com/macros/library/d/18ET55A9uVNx3IUzoAM_eRj8v7jqagPgjVdxil3P1SoUqrFnnAJp6CjVr/6`
- Preserved source: `backend/api/tablegate-backend-v3.gs`

The supplied `.gs` source was moved without modification. Its SHA-256 is `8a439d64e740e7f5e8eaf3cdcaa018b2966e7a999cd232742986c3be91accc67` before and after reorganization. No replacement backend was generated. Frontend adapters, paths, configuration metadata, and embedded-workspace context were repaired around the supplied backend.

## Final organization

- `css/tablegate`, `js/tablegate`, `json/tablegate`: shared platform, authentication, messaging, systems, state, PWA, navigation, rules, and shared utilities.
- `css/admins`, `js/admins`, `json/admins`: Effects Studio, Campaign Hub, Creator Forge, map/NPC/encounter tools, campaign helpers, moderation, and backend capability interfaces.
- `css/players`, `js/players`, `json/players`: character sheets, imports, consent, saved player records, notes, and personal campaign interfaces.
- `css/sessions`, `js/sessions`, `json/sessions`: live play, session dice, private campaign-runner dice, published maps, roll logs, and session execution.
- `assets/images|svg|audio/<division>`: media only.
- `backend`: preserved server code and backend-focused static tests.
- `docs`: Markdown, text, and documentation JSON only.

## Important operational notes

- Campaign-runner titles—DM, GM, MOL, Master of Lore, Storyteller, Keeper, Referee, and equivalents—share permission gates; no title is made the universal default.
- Players receive only authorized or published campaign/session material. UI hiding is supplemented by frontend permission checks and the supplied backend's authorization routes.
- Normal player dice rolls use Session Dice. Private chat rolls remain restricted to authorized campaign runners/moderators.
- The complete external 3,486-image race portrait token library was referenced by prior registries but was not present in the five supplied archives. Those entries are retained as unavailable external-token metadata and fall back to the existing labeled placeholder rather than producing broken local paths.

## Validation and documentation

- Full file inventory: `docs/github/manifests/file-manifest.json`
- Old-to-new migration map: `docs/github/manifests/migration-map.json`
- Exact duplicate decisions: `docs/github/manifests/exact-duplicate-consolidation.json`
- Test evidence: `docs/github/manifests/test-results.json`
- Audits: `docs/github/audits/`
- Historical, non-executable records: `docs/previous-project-versions/`
