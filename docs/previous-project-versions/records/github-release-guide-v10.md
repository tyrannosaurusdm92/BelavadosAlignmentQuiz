# GitHub and Community Release Guide

## Repository upload

1. Extract every TableGate release part into the same parent folder. Paths are non-overlapping and merge into one `TableGate/` directory.
2. Confirm `TableGate/TableGate.html`, `service-worker.js`, `manifest.webmanifest`, and the `css`, `js`, `json`, `assets`, `backend`, `docs`, `tests`, and `tools` folders are present.
3. Commit the extracted project files, not the multipart ZIPs.
4. Enable GitHub Pages from the branch/folder containing `TableGate.html`, or deploy the folder to another HTTPS static host.
5. Test sign-in, campaign creation, attachment upload/download, knowledge ingestion, a session dice roll, voice signaling, and one privileged Backend Center action against the deployed Apps Script endpoint.

No individual project file exceeds 23 MiB. GitHub’s normal repository and release limits still apply to total history and release assets.

## Release post checklist

For Facebook, YouTube, Patreon, or Reddit, include the release version, installation/extraction instructions, backend requirements, license/provenance link, known deployment-test limitation, and SHA-256 checksum file. Do not describe the browser fixture test as a live production-backend test.
