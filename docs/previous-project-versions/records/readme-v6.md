# TableGate Campaign Studio v6

Open `tablegate.html` from a static HTTPS host. No Windows batch file, package manager, build command, or secondary HTML entry point is required.

## Required top-level layout

- `tablegate.html`
- `service-worker.js`
- `manifest.webmanifest`
- `assets/`
- `css/`
- `docs/`
- `js/`
- `json/`

## v6 changes

- Replaced all nine embedded character sheets with the upgraded Complete Options + Homebrew Engine versions.
- Preserved the true responsive hamburger menu on every sheet.
- Added Encounter Lab with campaign-editable weighted roll tables and system-neutral encounter generation.
- Added Campaign Helpers with relationship webs, local name generation, and fictional tavern dice games.
- Added campaign-scoped publication records for encounter results, tables, people, relationships, and pinned names.
- Expanded Data & Sources with attached repositories, external websites, license status, and exact use classifications.

## Campaign isolation

All new helper data uses the active campaign server ID in its browser-storage key. Changing campaigns changes the data namespace. Creator inventory publication remains locked to the active campaign and requires the existing explicit confirmation.

## Character rolls

During a live session, sheet controls for attacks, initiative, skills, saves, checks, moves, damage, and healing route to the shared 3D dice tray. Character-stat generation, standard arrays, point-buy, and randomization remain on the character sheet.
