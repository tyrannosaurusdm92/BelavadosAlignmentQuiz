# Emperor Onyx Map Request Packager

This version changes Onyx from a final map/image/audio generator into a **map request packager**.

Onyx now helps you prepare a ZIP package that you can bring back to ChatGPT for actual map-building work. The package contains your settlement JSON, a generated manifest/request JSON, the Belavadös locations/pins template JSON, the color-changing SVG marker, and the best matching image assets from your `map_assets` folder.

## Main file

Open:

```text
onyx_map_request_packager.html
```

## What Onyx does now

- Accepts settlement JSON uploads.
- Lets you enter settlement name and settlement type: capital, city, town, or village.
- Lets you cache up to 3 biome choices.
- Reads local image assets through either:
  - the browser folder picker / image picker, or
  - a generated `map_assets_catalog.json` file.
- Scores and ranks matching assets by filename, tags, category, settlement type, and biome fit.
- Lets you review/check/uncheck candidate images.
- Builds a downloadable ZIP containing:
  - `manifest/map_request_manifest.json`
  - your uploaded settlement JSON, or a generated settlement request JSON
  - `README_FOR_CHATGPT.txt`
  - `templates/belavados_locations_pins_template.json` when enabled
  - `templates/assets/map-marker.svg` for color-changing pin markers
  - selected image assets grouped into folders by detected category.

## What Onyx no longer tries to do in this workflow

- No final map rendering.
- No final image creation.
- No sound-file creation.
- No dice roller.
- No character-sheet UI.

The old scanner and legacy forge internals remain available in the code/package for reference, but the visible primary workflow is the request-packaging workflow.

## How to use your map_assets folder

### Option A — browser folder picker

1. Open `onyx_map_request_packager.html`.
2. Upload your settlement JSON.
3. Keep the built-in locations + pins template loaded, or import your own locations/pins JSON.
4. Set settlement type and biome cache.
5. Click **Pick folder** and choose your `map_assets` folder.
6. Click **Fetch matching assets**.
7. Review the selected image candidates.
8. Click **Build ZIP package**.

### Option B — local asset catalog

1. Put images inside:

```text
assets/map_assets/
```

2. From the `Onyx_Map_Request_Packager` folder, run:

```bash
node tools/build-map-asset-catalog.mjs
```

3. Open the app through a local server, or run:

```bash
node tools/start-local-preview.mjs
```

4. Click **Load local asset catalog**, then **Fetch matching assets**, then **Build ZIP package**.

## ZIP size note

The UI allows a requested ZIP size limit up to **100,000 MB**, but actual successful export size still depends on the browser, operating system, and available memory. If a browser refuses a huge ZIP, make smaller packages by lowering **Max images in package** or **Max ZIP size / MB**.

## Chat examples

- `fetch assets for a town named Gloamhollow with Deep forest and Beach and reefs with water`
- `fetch assets for a floating capital with Ocean Surface floating settlement`
- `load the locations and pins template`
- `build the zip package`
- `scan this uploaded map and promote geojson overlays`

## Included folders

- `assets/map_assets/` — place your map assets here if using the catalog builder.
- `assets/onyx-moods/` — Onyx mood images.
- `css/` — app styling.
- `js/` — app logic.
- `json/` — Onyx biome, persona, keyword, pin, distribution, immersive locations, and GeoJSON/NPC assignment template data.
- `scanner_legacy/` — older scanner tools kept for reference.
- `tools/` — local catalog builder and preview server.
- `tests/` — simple smoke tests.


This revised build intentionally keeps only `onyx_map_request_packager.html` as the saved/opened HTML entry point. Other outdated HTML demos were removed; useful scanner code/assets remain as support files.
