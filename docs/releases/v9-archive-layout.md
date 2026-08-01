# Six-part archive layout

All parts extract into one shared `TableGate/` directory. No file path appears in more than one part.

- Part 1: every new or modified file in the unified rebuild, plus enough unchanged assets/data to satisfy the requested archive size.
- Parts 2–6: unchanged recovered GitHub files only.

Part 1 contains the full release manifest, archive membership manifest, SHA-256 checksums, validation report, and this documentation. Parts 2–6 contain no newly generated metadata, so their payloads remain unchanged recovered GitHub files only.

The archive builder targets at least 100,000 KB of contained files per part and verifies both uncompressed member bytes and final ZIP size before delivery.
