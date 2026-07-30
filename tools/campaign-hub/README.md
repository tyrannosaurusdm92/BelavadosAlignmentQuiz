# TableGate Setting-Agnostic Campaign Hub

Open `campaign_hub.html` directly in a modern desktop browser. No server, installation, batch file, or command line is required.

## Included systems

- Dungeons & Dragons 5e / 2024 revised rules
- Pathfinder Second Edition Remastered
- GURPS Fourth Edition Revised
- Call of Cthulhu Seventh Edition
- Savage Worlds Adventure Edition
- Fate Core
- Daggerheart
- Blades in the Dark
- Powered by the Apocalypse framework

The complete attached JSON references are preserved in `json/systems/`. They are also converted into the offline `js/system-data.js` bundle so the site can switch and search systems while opened through `file://` without browser fetch restrictions.

## Map Viewer

The Map Viewer is the first page module and begins empty. It can load:

- one or more map files;
- a complete nested map folder;
- a `tablegate.map-hierarchy.v1` manifest;
- self-contained interactive SVG or HTML maps that request child-map navigation;
- GeoJSON rendered directly in the browser.

See `docs/MAP_VIEWER_GUIDE.md` and `json/map-manifest.example.json`.

## Campaign editing

Editable campaign text is saved to the browser's local storage. Use the Home section to export or import campaign-page data as JSON. Map files are not embedded in that export because browser-selected local files must be re-authorized when the page is reopened.

## Main files

- `campaign_hub.html` — site entry point
- `css/campaign-hub.css` — visual layout and themes
- `js/campaign-hub.js` — system switching, editing, search, and Map Viewer behavior
- `js/system-data.js` — offline copy of all attached system data
- `json/systems/` — original attached system JSON files
