# Emperor Onyx Map Request Packager

This version changes Onyx from a final map/image/audio generator into a **map request packager**.

Onyx now helps you prepare a ZIP package that you can bring back to ChatGPT for actual map-building work. The package contains your settlement JSON, a generated manifest/request JSON, and the best matching image assets from your `map_assets` folder.

## Main file

Open:

```text
onyx_map_request_packager.html
```

## What Onyx does now

- Accepts settlement JSON uploads.
- Lets you enter a settlement or location name and choose settlement type: capital, city, town, village, or location (specific interior map).
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

1. Open `onyx_map_request_packager.html` (the older `onyx_map_image_creator.html` alias is also included).
2. Upload your settlement JSON.
3. Set settlement type and biome cache.
4. Click **Pick folder** and choose your `map_assets` folder.
5. Click **Fetch matching assets**.
6. Review the selected image candidates.
7. Click **Build ZIP package**.

### Option B — local asset catalog

1. Put images inside:

```text
assets/map_assets/
```

2. From the `Onyx_Map_Image_Creator` folder, run:

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
- `build the zip package`
- `scan this uploaded map and promote geojson overlays`

## Included folders

- `assets/map_assets/` — place your map assets here if using the catalog builder.
- `assets/onyx-moods/` — Onyx mood images.
- `css/` — app styling.
- `js/` — app logic.
- `json/` — Onyx biome, persona, keyword, pin, and distribution data.
- `scanner_legacy/` — older scanner tools kept for reference.
- `tools/` — local catalog builder and preview server.
- `tests/` — simple smoke tests.


This revised build intentionally keeps only `onyx_map_request_packager.html` as the saved/opened HTML entry point. Other outdated HTML demos were removed; useful scanner code/assets remain as support files.


## Interior Location Rule

- The new **Location** dropdown option is for a specific interior map only.
- Only **Location** requests should suggest indoor props such as beds, bunks, hearths, fireplaces, tables, chairs, wardrobes, shelves, kitchens, and similar room furnishings.
- Settlement-scale requests should not suggest those props unless the input JSON explicitly asks for a specific interior sub-map.

## Future Generator Rules Included In Export

The exported ZIP now explicitly tells the future generator that:

- it is responsible for placing pins in their correct colors,
- it must create or add each relevant building, park, bridge, large treehouse, lake, dock, and other major clickable feature,
- each such feature should receive a clickable colored pin plus matching GeoJSON where appropriate,
- no settlement maps may have grids,
- only indoor/location maps may use grids.


Latest revision notes:
- Added a Settlement Type option named `Location` for specific interior maps only.
- Interior props like beds, hearths, fireplaces, tables, and similar furnishings should only be suggested for `Location` requests.
- Exported ZIP instructions now explicitly require the future generator to output SVG maps with GeoJSON overlays and to use the bundled `templates/map_viewer_requirements.css` viewer CSS.
- Settlement maps must not use grids. Only interior/location maps may use grids if the final generator decides they are helpful.
