# TableGate v9 Test Report

Created By William Saville AKA The Transgender T-Rex #TheTransgenderTrex developer of Belavadös Galaxy TTRPG System

Test date: 2026-07-30

## Source and structure

- all eight original supplied ZIP inputs and the replacement dice ZIP passed CRC checks
- all input paths were checked for traversal and unsafe symlinks before extraction
- exactly one physical HTML file exists: `TableGate.html`
- no ZIP, RAR, 7z, tar, gzip, or numbered archive chunk is nested in the project
- no file exceeds 24,000 KB; the largest active file is an intelligence-corpus JavaScript part at 16,391,819 bytes
- the main page, manifest, service worker, icon, stylesheet, and script references resolve
- 223 active JSON files parse successfully
- 96 active JavaScript files pass `node --check`

## Automated application checks

The final source passed **67 of 67** automated structural, deterministic rules, accessibility, and full-application integration checks. The dedicated standards-oriented DOM/browser behavior harness passed **29 of 29** additional checks.

The mocked authenticated campaign session verified:

- Campaign Runner Creator Area renders
- ten campaign-runner creation tool cards render
- DM, GM, MOL, Master of Lore, Storyteller, Keeper, and Referee are presented as equal title choices
- Effects Studio appears in campaign-runner creation tools
- the complete Effects Studio document embeds successfully
- Effects Studio loads its own color, texture, core, and studio styles
- the shipped Effects Studio CSS and asset directories are byte-identical to the supplied Effects Studio input
- Session Dice embeds the supplied replacement live rolling board
- all nine system rules definitions validate and return the expected deterministic fixture outcomes
- the replacement board exposes all nine systems and four system-aware bot actions for each
- a completed saved character sheet is serialized into the session board without losing filled fields
- nested character-sheet state messages return through both iframe boundaries
- exact authoritative die faces reach the 3D renderer
- selected user colors reach the 3D material and both live popup layers
- public events contain character, campaign, channel, system, roller, rule outcome, and color metadata
- eleven tool-specific tutorials render
- tutorial selection, completion, reset, and disable controls exist
- Docs renders the full searchable catalog and current v9 records
- a player is denied Effects Studio
- Campaign Hub changes to player read-only mode
- the exact creator credit renders in the application workspace

## Backend and permission contract

- the active runtime contains the supplied Apps Script endpoint and library version 6
- no active runtime file contains an earlier URL for the supplied Apps Script library
- 97 direct `API.call` actions were inventoried, in addition to organizer wrappers and tool-specific requests
- runner-only workspaces, chat dice, map publication, creator publication, character management, moderation, and private dice have frontend permission checks
- unsupported optional creator actions retain campaign-scoped local mirrors without presenting them as confirmed backend persistence
- public dice use a durable channel-message event, optional campaign broadcast action, and same-origin live relay
- private dice do not enter shared paths unless the runner deliberately chooses an admin channel

The test environment could not contact `script.google.com`; remote deployment behavior was therefore validated through request-contract inspection and mocked successful/error responses rather than a live production write.

## Visual and accessibility checks

- all 24 requested palette values are present
- cyan `#00FFFF` on `#001010`: 15.48:1
- lime `#32CD32` on `#001010`: 9.17:1
- Dodger Blue `#1E90FF` on `#001010`: 6.00:1
- `#F2FFFF` on `#003333`: 13.49:1
- bright identity controls use dark text
- main focus outlines use `#40FFFF`
- manifest, mobile metadata, rail home control, and browser icons use the supplied icon family
- shared roll announcements use assertive live regions and user-selected colors with computed contrasting ink
- tablet and phone session breakpoints are defined and exercised by the DOM/browser behavior harness

## Browser execution note

A visible cloud Chrome session was connected for the requested browser pass. Its URL safety policy rejected workspace-local HTTP and self-contained test URLs before page execution. No external site was deployed without authorization. The release therefore does not claim a live cloud-browser pass.

The actual production rules engine, replacement iframe bridge, session integration, styles, and embedded document were executed in a standards-oriented DOM/browser behavior harness. That harness passed 29 of 29 checks. See `BROWSER_QA_REPORT_v9.md`.

## Multipart release validation

The six release archives passed `unzip -t` CRC validation.

| Archive | Bytes | KiB | Result |
| --- | ---: | ---: | --- |
| Part 1 | 121,816,662 | 118,961.58 | passes requested 100,000 KB minimum |
| Part 2 | 121,816,499 | 118,961.42 | passes requested 100,000 KB minimum |
| Part 3 | 121,816,300 | 118,961.23 | passes requested 100,000 KB minimum |
| Part 4 | 121,818,286 | 118,963.17 | passes requested 100,000 KB minimum |
| Part 5 | 121,817,770 | 118,962.67 | passes requested 100,000 KB minimum |
| Part 6 | 2,254,972 | 2,202.12 | permitted smaller sixth manifest/test archive |

Archive union checks:

- 2,698 entries
- every entry is beneath one `TableGate/` folder
- exactly one HTML entry: `TableGate/TableGate.html`
- zero nested archives
- zero missing files after reconstruction
- zero unexpected files after reconstruction
- zero SHA-256 mismatches against the source project
- reconstructed application suite: 67 of 67 passed
- reconstructed dice/browser-behavior harness: 29 of 29 passed

The final Part 6 is regenerated after this report and its matching package manifest are embedded. Its exact final byte size and digest are recorded alongside the other archives in the release checksum file.
