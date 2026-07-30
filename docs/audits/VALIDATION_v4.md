# Validation Report v4

The merged campaign-isolated build passed the following checks:

- Exactly one HTML file exists: `tablegate.html`.
- Root structure contains only the requested application folders plus `tablegate.html`, `service-worker.js`, and the PWA manifest.
- No `.bat`, `.cmd`, `.ps1`, or `.sh` launch dependency is included.
- No individual file exceeds 24,000,000 bytes.
- All 114 JSON files parsed successfully before the generated v4 audit files were added.
- All 81 JavaScript files passed `node --check` syntax validation.
- Both embedded applications parsed successfully and all static `src`/`href` resource references resolve.
- All nine standalone character sheets are present and contain complete HTML documents inside the JavaScript sheet library.
- Active runtime configuration contains only the replacement Apps Script endpoint and library version 5.
- Browser smoke tests passed creator visibility, checkbox selection, publication, server binding, cross-campaign non-leakage, selection reset, locked destination naming, cyan creator link, campaign-scoped Forge loading, and character-sheet loading.
- ZIP integrity and reconstruction checks are performed after packaging; their results are recorded in `PACKAGE_MANIFEST_v4.json` and the external SHA-256 checksum file.
