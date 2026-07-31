# Code Audit

## Scope

The five TableGate 10.0.0 release shards were inventoried as one complementary source release. The source contained 2,972 files totaling 784.0 MB. The reorganized tree currently contains 2,617 files totaling 562.8 MB before the final manifest self-entry is refreshed.

## Structural result

- Root layout: **pass** — only `tablegate.html`, `service-worker.js`, and the six approved folders are present.
- Primary HTML entry points: **pass** — one application HTML file remains.
- Maximum loose files in one directory: **301** in `assets/svg/admins/creator-forge/legacy-activities`; limit is 900.
- Largest project file: `js/admins/creator-forge/bot/intelligence-corpus-part-3.js` at 15.6 MB; limit is 24,000 KB.
- JavaScript/Google Apps Script syntax, JSON parsing, root rules, docs extensions, code/media boundaries, and static local references: **pass** in `test-results.json` / validation v9.
- Exact-content duplicate groups after consolidation: **0**.
- Reproducible release audit: **18 passed, 0 failed**.

## Major integrations retained and merged

1. Authentication, account registration, show-password, forgot-password, messaging, channels, links, voice signaling, notifications, profiles, campaign navigation, and server/campaign management.
2. Campaign Hub and its map hierarchy, campaign references, handouts, rules/system selection, runner editing, and player-safe viewing.
3. Effects Studio, including drawing, assets, lighting, sound/effects, animation, map-oriented creation, and Paint by Number.
4. Creator Forge, LifeSimulator, NPC/location/world generation, map/transit integration, project assistant, imports/exports, and generation workflows.
5. Character sheet library, universal import/conversion, save/ownership/consent logic, progression support, and player character vaults.
6. Session Dice, nine-system resolution, 3D renderer, dice bots, shared rolls, private runner rolls, session roll history, and live-play tools.
7. Included TTRPG system definitions, rules indexes, advancement/mechanics references, and a 244-entry logical knowledge catalog under the shared TableGate division. Nine large references are stored once in the shared system-reference directory and resolved by catalog path rather than duplicated.

## Repaired issues

- Rewrote application, stylesheet, script, asset, fetch, JSON, and service-worker paths for the central layout.
- Corrected five obsolete nested 3D dice renderer script references to `js/sessions/dice-roller/`.
- Corrected Creator Forge's Apps Script library metadata from version 5 to the supplied version 6.
- Corrected Creator Forge reaction and token-border media roots after moving SVG assets.
- Replaced 3,486 nonexistent local race-token paths with explicit unavailable external-token metadata and the existing placeholder behavior.
- Removed compiled/repeated system-data copies where a shared canonical JSON source exists.
- Removed all exact-byte duplicate files and rewrote references to canonical copies.

## Removed duplicate/obsolete material

`exact-duplicate-consolidation.json` records 42 exact duplicate files removed after reference rewrites. Complete superseded application trees were not retained. Prior Markdown, text, JSON audits, manifests, and source notes were preserved under `docs/previous-project-versions/records/`; obsolete executable code copies were excluded.

## Limits of this audit

This is a release-integration and static/runtime smoke audit, not a formal proof that every route or every rule-data entry is semantically correct. Remote authenticated backend actions, multi-user synchronization, voice connections, email delivery, and deployment-specific permissions require a real Apps Script deployment session and test accounts.
