# Previous TableGate Project Versions

This release consolidates the five TableGate 10.0.0 source shards into one application layout. Complete obsolete code trees were not copied into documentation. Unique active implementations were moved into the central `css`, `js`, `json`, `assets`, and `backend` trees; retained historical Markdown, text, and documentation JSON were deduplicated under `records/`.

## Source packages

- TableGate 10.0.0 Release Part 1 of 5
- TableGate 10.0.0 Release Part 2 of 5
- TableGate 10.0.0 Release Part 3 of 5
- TableGate 10.0.0 Release Part 4 of 5
- TableGate 10.0.0 Release Part 5 of 5

The source inventory contained 2,972 files totaling 784.0 MB.

## Consolidation decisions

- Retained the strongest active single-page application and renamed its entry point to `tablegate.html`.
- Preserved `tablegate_backend_v3.gs` byte-for-byte at `backend/api/tablegate-backend-v3.gs`.
- Distributed Campaign Hub, Effects Studio, Paint by Number, Creator Forge, LifeSimulator, character sheets, Session Dice, maps, bots, and other tools by file type and functional division.
- Merged repeated nine-system and knowledge-pack references under `json/tablegate/`.
- Removed old executable source-code copies from documentation after confirming active equivalents or recording unresolved differences.
- Consolidated shared third-party libraries and exact duplicate assets, then rewrote references to canonical files.
- Retained unavailable external race-token metadata without pretending the absent 3,486 image files were bundled.

## Historical records

The `records/` directory contains prior audits, manifests, source notes, license notices, build reports, test evidence, and migration context in `.md`, `.txt`, and `.json` formats only. These records are not loaded as application code.
