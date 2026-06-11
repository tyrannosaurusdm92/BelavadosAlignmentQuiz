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


## 2M+ map_assets catalog workflow

Do **not** use the browser folder picker for the full 2 million+ image library. Browser file inputs can silently cap, stall, or run out of memory on extremely large folders. For the full library, Onyx now uses a static chunked catalog:

```bash
node tools/build-map-asset-catalog.mjs
```

That scans `assets/map_assets` and writes:

- `json/map_assets_catalog_manifest.json`
- `json/map_assets_catalog_index.json`
- `json/map_asset_catalog_chunks/chunk_*.json`

Commit those JSON files **and** the full `assets/map_assets` folder to GitHub. In the page, click **Load 2M+ asset catalog**. Onyx will search the metadata catalog and fetch only selected images when building the ZIP.

Use the folder picker only for small temporary batches.
