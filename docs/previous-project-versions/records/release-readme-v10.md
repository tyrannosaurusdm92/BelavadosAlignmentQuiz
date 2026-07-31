# TableGate 10.0.0 Release Readme

## Release composition

This release merges all six supplied TableGate v9 archive parts into one extractable application tree and injects the complete supplied nine-system JSON knowledge pack. Original source ZIP files are not nested inside the result. The release has one HTML entry point: `TableGate.html`.

The supplied Apps Script backend is preserved at `backend/tablegate_backend_v3.gs`. Its SHA-256 is `8a439d64e740e7f5e8eaf3cdcaa018b2966e7a999cd232742986c3be91accc67`, identical to the uploaded backend. No alternate backend was written.

## Backend configuration

- Web app: `https://script.google.com/macros/s/AKfycbylmceRVx5UcgMvMDkwym_9h0wv8gM5B9Msuui7-7Z6lqoYlqZBR6Y47hmsauQgoGXY/exec`
- Library ID: `18ET55A9uVNx3IUzoAM_eRj8v7jqagPgjVdxil3P1SoUqrFnnAJp6CjVr`
- Library version: `6`

These values are locked in `js/messenger-core.js` and recorded in `json/app-config.json`.

## Major integration work

The frontend now translates legacy server terminology to the backend’s tablegate terminology, normalizes response shapes used by the existing UI, and persists formerly local-only workspaces using the backend’s existing Projects and ProjectItems routes. Campaign assets use the supplied Attachment/Asset routes. Rules search uses Knowledge routes. System-library uploads resolve an attached system before calling the supplied System Documents routes.

The new Backend Center is an advanced frontend for all 223 supplied routes. The backend remains responsible for authentication and permissions; exposing a route in the UI does not bypass backend checks.

The new Knowledge Pack workspace exposes all 244 embedded JSON files across nine systems. Files may be previewed locally and ingested into a campaign’s existing backend Knowledge store in backend-safe chunks.

## Hosting

Use HTTPS or localhost. For GitHub Pages, publish the extracted `TableGate/` tree without changing relative paths. Do not upload only one release part: all parts must be extracted into the same destination so their non-overlapping paths combine.
