# map_assets catalog folder

This folder is intentionally for **JSON asset catalogues only**.

Do not put the 2 million+ image library in this GitHub project. Keep the real images on the Windows machine at:

```text
C:\Users\Public\Pictures\map_assets
```

Run the catalog builder from the `OnyxImagePackager` folder:

```bash
node tools/build-map-asset-catalog.mjs
```

It scans `C:\Users\Public\Pictures\map_assets` by default and writes JSON catalogue files here:

- `map_assets_catalog_manifest.json`
- `map_assets_catalog_index.json`
- `map_assets_catalog.json`
- `map_asset_catalog_chunks/chunk_*.json`

Commit this `map_assets` folder to GitHub. The catalogue lets Onyx search millions of image records without uploading the images themselves. To export actual image files into a request ZIP, run the local preview/image bridge:

```bash
node tools/start-local-preview.mjs
```

That local server exposes the real images from `C:\Users\Public\Pictures\map_assets` at `http://127.0.0.1:5177/local-map-assets/` for OnyxImagePackager to fetch during ZIP export.
