# OnyxImagePackager

This package turns Emperor Onyx into a map/settlement request packager that can search a massive local image library without committing the images to GitHub.

## Main file

Open through the local preview server:

```bash
node tools/start-local-preview.mjs
```

Then visit:

```text
http://127.0.0.1:5177/
```

The main app file is:

```text
OnyxImagePackager.html
```

## Important folder rule

The project folder named `map_assets` now holds **JSON asset catalogues only**.

Do **not** put the 2 million+ image files in the GitHub project. Keep the actual images on your computer at:

```text
C:\Users\Public\Pictures\map_assets
```

The JSON catalogues inside `map_assets/` tell Onyx what images exist, what tags/categories they match, and where to fetch them locally.

## Build the JSON catalogue

From the `OnyxImagePackager` folder, run:

```bash
node tools/build-map-asset-catalog.mjs
```

By default it scans:

```text
C:\Users\Public\Pictures\map_assets
```

and writes:

```text
map_assets/map_assets_catalog_manifest.json
map_assets/map_assets_catalog_index.json
map_assets/map_assets_catalog.json
map_assets/map_asset_catalog_chunks/chunk_*.json
```

Commit the `map_assets` JSON catalogue folder to GitHub. Do not commit the real images.

## Open real images from the local image library

Run:

```bash
node tools/start-local-preview.mjs
```

That serves the app and exposes the real local images from:

```text
C:\Users\Public\Pictures\map_assets
```

at:

```text
http://127.0.0.1:5177/local-map-assets/
```

The app uses this bridge when it needs to package selected real image files into a ZIP. This avoids the browser/GitHub limit problem while still letting Onyx search the JSON catalogues.

## Custom local image folder

If the real images are somewhere else, set `ONYX_MAP_ASSET_DIR` before running the builder and preview server.

PowerShell example:

```powershell
$env:ONYX_MAP_ASSET_DIR="D:\MapLibraries\map_assets"
node tools/build-map-asset-catalog.mjs
node tools/start-local-preview.mjs
```

## What Onyx exports

A ZIP export includes:

- `manifest/map_request_manifest.json`
- `manifest/future_image_generator_instructions.json`
- `manifest/map_module_requirements.css`
- settlement JSON or generated request JSON
- `templates/onyx_pin_types.json`
- `templates/assets/map-marker.svg`
- selected image files pulled from the real local image folder
- `template_program/interactive_map_builder/`, copied from the attached biome merged interactive map builder templates

## Template program added

The attached template program is included inside this package at:

```text
templates/interactive_map_builder/
```

When Onyx builds an export ZIP, those capital/city/town/village map builder templates are also copied into the export under:

```text
template_program/interactive_map_builder/
```

## Settlement vs. Location asset rules

Settlement requests prioritize:

- outer walls
- roofs
- building clusters
- government/civic buildings
- houses, hotels, apartments
- chapels, churches, temples
- paths, bridges, roads
- plants, trees, gardens
- ground textures
- surface water and deep water when applicable

`Location` requests are the only request type that strongly prioritizes interior assets such as beds, hearths, furniture, storage, and room fixtures.

## Interactive map builder merge

This build includes the coordinate-tracking Belavadös interactive map builder under `templates/interactive_map_builder/`. When Onyx exports a ZIP package, he now includes:

- the full builder program,
- the correct selected capital/city/town/village template for the current request,
- `selected_interactive_map_builder/biome_location_generation_plan.json`,
- selected biome JSON profiles,
- scale targets for location slots, named NPC slots, and world-travel NPC slots.

For one selected biome, 100% of the allotted location slots come from that biome JSON. For two selected biomes, the split is 50/50. For three selected biomes, the first two use about 33.33% each and the final biome receives the rounding remainder so the total is exactly 100%.
