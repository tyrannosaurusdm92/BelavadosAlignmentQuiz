# TableGate Campaign Studio v5 — Build Audit

## Scope

This release combines the campaign-isolated TableGate core, nine supplied character sheets, shared 3D session dice, Creator Forge, hierarchical map generation, living NPC schedules, and an in-application provenance catalog.

## Required architecture

- One physical HTML entry point: `tablegate.html`.
- Root `service-worker.js` and `manifest.webmanifest`.
- Runtime folders limited to `css`, `js`, `json`, `assets`, and `docs`.
- No Windows batch or command files.
- No individual distributed file above 24,000,000 bytes.
- Four merge-in-place release ZIPs, each above 80,000 KB and below 100,000 KB.

## Functional verification

- Nine character systems loaded from the supplied collection.
- Campaign and owner scoped character vault with unlimited default and runner-set caps.
- Session character dropdown restricted to characters owned in the active campaign.
- Sheet-state persistence separated by campaign, user, character, and sheet.
- Session rolls routed to the shared dice tray while stat generation remains native to the sheet.
- Runner public rolls use the shared session tray; private rolls remain in the runner-only dice-bot workspace.
- DM, GM, MOL, Master of Lore, Storyteller, Keeper, Referee, and equivalent titles use the same capability check.
- Map hierarchy supports world, continent, country, kingdom, and settlement records.
- NPC generator creates adult identities, schedules, traits, hobbies, rumors, secrets, memories, and varied consensual relationships.
- Data & Sources distinguishes incorporated, reference-only, and excluded projects.

## Responsive navigation verification

Every sheet was tested at desktop and mobile widths. The hamburger opens a viewport-safe drawer or mobile bottom sheet; it is no longer constrained to the old narrow column. Tests cover backdrop and Escape closing, readable jump targets, scroll locking, and recovery from stale dragged-button coordinates.

See `MENU_RESPONSIVE_ALL_SYSTEMS_v5.json` and `MENU_REPAIR_AUDIT.md`.
