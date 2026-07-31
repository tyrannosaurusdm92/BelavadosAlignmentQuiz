# Nine-System JSON Knowledge Pack Integration

## Embedded dataset

The supplied knowledge archive is extracted directly into `json/knowledge-pack/`; no nested ZIP remains. The catalog records 244 JSON files, nine systems, and 208,836,941 uncompressed JSON bytes.

Systems:

1. Dungeons & Dragons
2. Pathfinder
3. Fate Core
4. GURPS
5. Call of Cthulhu
6. Daggerheart
7. Powered by the Apocalypse
8. Savage Worlds Adventure Edition
9. Blades in the Dark / Forged in the Dark

## Frontend use

`js/knowledge-pack-browser.js` provides search, system filtering, metadata, SHA-256 display, local preview, direct file access, and optional ingestion into the active campaign’s backend Knowledge store. The browser is available from both the workspace navigation and server rail.

Ingestion uses the existing `ingestKnowledge` route and divides content into 34,000-character chunks, below the supplied backend’s 40,000-character input constraint. Each chunk includes the packaged file path, hash, system, and chunk position.

## Runtime relationships

The embedded JSON is available to:

- the Knowledge Pack browser;
- campaign knowledge ingestion and search;
- system-library references;
- rules assistance;
- dice/helpers/generators that consume structured local data;
- future frontend modules through the stable catalog.

## Integrity

`json/knowledge-pack/catalog.json` stores path, byte size, SHA-256, system, top-level keys, record count, title, summary, and origin metadata for every embedded file. The release audit recomputes all hashes.

## Licensing and provenance

The pack’s own manifests distinguish original compatibility summaries, open/SRD material, and user-supplied reference imports. System-specific policy summaries and official reference URLs remain in the system entries. See `docs/LICENSES_AND_PROVENANCE_v10.md` and each system manifest before redistributing content outside this complete release.
