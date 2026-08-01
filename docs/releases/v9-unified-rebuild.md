# TableGate V9 unified rebuild

## What was merged

- The rebuilt social, group-finder, profile, messaging, safety, and community shell is now the only root application shell.
- The current V8 Apps Script backend source is included at `backend/api/tablegate-backend-v8.gs` and the browser configuration points to library version 8.
- Intact admin, player, and session domains from the supplied GitHub archives are preserved under their original paths.
- Recovered complete iframe documents run Creator Forge, Effects Studio, Campaign Hub, and the Live Session/Dice board without depending on the corrupted legacy shell.
- New adapters run Character Sheets, VTT Worldbuilder, Map Foundry, NPC Lives, and Encounter Lab in isolated, campaign-scoped workspaces.
- System Reference and Organizer were rebuilt as direct views so the release retains one root HTML file.

## Corruption boundary

The legacy root `tablegate.html`, legacy `service-worker.js`, and legacy `js/tablegate` shell were excluded. The following narrowly scoped dependencies were recovered because they belong to intact tool/session domains:

- Creator Forge embedded document template
- Campaign Hub, Effects Studio, and Live Session/Dice document templates
- `js/tablegate/systems/tablegate-nine-systems.js`
- `js/tablegate/vendor/jszip-min.js`
- `js/tablegate/vendor/mammoth-browser-min.js`
- supporting workspace/theme CSS

All recovered templates are emitted through `js/tablegate/shell/workspace-templates.js` and loaded only inside sandboxed workspace iframes.

## Role boundaries

- Owner and Admin: admin creation suites plus player/session tools.
- Moderator: player and live-session tools; no admin creation suites.
- Player: character sheets and live-session/dice tools.
- Visitor: shell, community, discovery, messaging where allowed, safety, organizer, and system references; player/admin workspaces remain locked.

## Canonical application

`tablegate.html` is the sole application entry. It loads the modular shell from `js/tablegate/shell/`, registers the V9 service worker, and lazy-loads heavy tool domains only when opened.
