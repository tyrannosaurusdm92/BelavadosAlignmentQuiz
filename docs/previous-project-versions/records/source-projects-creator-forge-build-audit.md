# TableGate v8 Build Audit

## Requested package structure

- PASS: exactly one HTML file, `tablegate.html`.
- PASS: root folders are limited to `css`, `js`, `json`, `assets`, and `docs`.
- PASS: root `service-worker.js` is included.
- PASS: no `.bat`, `.cmd`, or PowerShell launcher is included.
- PASS: legacy world-builder branding is absent.
- PASS: prohibited inspiration names are absent from the front-facing HTML.

## Functional integration

- PASS: TableGate v7 state migrates to schema v8 on import and from known legacy browser storage keys.
- PASS: all nine supplied system reference JSON files remain present.
- PASS: LifeSimulator NPCs and locations continue to feed the semantic Map Viewer.
- PASS: protected identity registry, custom identities, editable pronouns, and per-NPC pronoun overrides remain present.
- PASS: transit types, stops, ordered routes, services, vehicles, trip plans, visits, map placements, and route colors are project state.
- PASS: simulation advances tracked transit vehicles.
- PASS: semantic map export includes transit state.
- PASS: project ZIP export includes transit JSON and locally stored generated images when available.
- PASS: assistant backend endpoints were replaced with the supplied deployment and library version.
- PASS: assistant structured actions are allowlisted and review-first.
- PASS: assistant image responses support URL, data URL, and common base64 fields.

## Automated checks

- PASS: JavaScript syntax checks for application modules and all three intelligence-corpus parts.
- PASS: every JSON file parses.
- PASS: all local script and stylesheet references resolve.
- PASS: all statically referenced `byId()` elements exist in `tablegate.html`.
- PASS: no duplicate HTML IDs.
- PASS: transit planner unit test covers defaults, route creation, frequency services, transfer routing, activity-stop dwell, arrival calculation, and vehicle progress.
- PASS: both release ZIPs passed archive integrity checks and remained below 80,000 KB.
- PASS: extracting both parts into one directory reproduced all 1,747 source files byte-for-byte with no missing, extra, or changed files.

## Browser QA limitation

The system Chromium binary did not terminate correctly even for a blank headless page because of the container browser environment. Browser-render automation was therefore not used as a passing claim. Static DOM/reference audits, JavaScript parsing, JSON parsing, and direct transit-engine execution were used instead. Manual browser smoke testing remains recommended after extraction.
