# Source and Copy Audit v10

## No hidden archives

The release tree contains no `.zip`, `.7z`, `.rar`, `.tar`, or `.gz` source bundle. All supplied archive contents are extracted into normal files. Release ZIP parts are created outside the project tree and contain non-overlapping paths.

## Runtime versus reference copies

Files under `docs/source-code/`, `docs/source-character-sheets/`, and similarly named documentation directories are retained as auditable source references. They are not loaded by `TableGate.html`. Their purpose is provenance, reconstruction, licensing, and review. Active integrated copies live under `js/`, `css/`, `assets/`, and `tools/`.

These documentation references are not concealed legacy code: every file is included in `docs/manifests/FILE_MANIFEST_v10.json` and classified by path in `docs/manifests/CODE_USAGE_MANIFEST_v10.json`.

## Duplicate policy

No archive path was duplicated across the six supplied project parts during extraction. Intentional source/reference similarities are documented rather than deleted where they preserve provenance or license evidence.

## GitHub file limits

No project file exceeds 23 MiB. The three intelligence corpus parts are each approximately 15.6 MiB and remain separately integrated. Release ZIP parts are distribution artifacts, not files intended to be committed inside the repository.
