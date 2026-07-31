# TableGate 10.0.0 Multipart Release Instructions

The release is split into five ordinary ZIP archives because the complete project contains hundreds of megabytes of application code, integrated tools, assets, retained source references, documentation, and the injected knowledge pack.

## Extraction

1. Download **all five** `TableGate_10.0.0_Release_Part*_of_5.zip` files.
2. Place the five ZIP files in the same folder.
3. Extract every part into the same destination.
4. Allow the non-overlapping `TableGate/` folders to merge. The parts do not contain duplicate project paths.
5. Open the merged `TableGate/README.md` and `TableGate/docs/RELEASE_README_v10.md`.
6. Serve the merged `TableGate/` directory over HTTPS or localhost and open `TableGate.html`.

Each part is a self-contained standard ZIP, but no individual part is the complete application. Do not run or publish the project until all five parts have been merged.

## Integrity

Use the separately supplied `TableGate_10.0.0_SHA256SUMS.txt` file to verify the five archives. Each archive is also tested with a full ZIP integrity scan during packaging. The union of archive entries is compared to the assembled project tree to ensure there are no omissions, duplicates, or extra paths.

## GitHub publishing

Extract all parts first, then upload the contents of the merged `TableGate/` folder to the repository. Do not commit the five release ZIP files inside the repository unless you intentionally attach them to a GitHub Release. No individual file inside the extracted project exceeds 23 MiB.

The project contains no nested legacy/source ZIP files. Retained source and reference material is extracted into documented folders and classified in `docs/manifests/CODE_USAGE_MANIFEST_v10.json`.
