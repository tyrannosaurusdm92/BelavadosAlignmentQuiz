# TableGate V8 Frontend Update

## Backend lock

- Web app: `https://script.google.com/macros/s/AKfycbyTmuPyMg0ueiWAJSEpcrvXlkykD5g4Qo1cb0ybM1WDoTLAW43QG-6mvElxsWFVjx-vpg/exec`
- Apps Script library: `18ET55A9uVNx3IUzoAM_eRj8v7jqagPgjVdxil3P1SoUqrFnnAJp6CjVr`, version `8`
- Frontend route catalog: 354 routes from the attached V8 source, including 37 storage/document/sync/accessibility routes
- The backend source is intentionally not included in the update archives.

## VTT Worldbuilder

The Table workspace now includes a native scene and map editor with grid/snap controls, freehand and polygon drawing, semantic buildings, walls and doors, dynamic lights, fog reveal/hide tools, ambient audio zones, background maps, tokens, import/export, local save, and backend map synchronization.

Each building stores a stable location ID, functional category, capacity, services, tags, access state, provenance, and resident/worker/visitor NPC links. Auto-assignment uses NPC job, workplace, schedule, and home data rather than placing NPCs randomly. The backend mapping uses `MapFeatures` while preserving the Life Simulator's semantic location ownership boundary.

The protected settlement pin colors remain unchanged: Capital `#DC143C`, City `#32FF32`, Town `#FFA500`, and Village `#000080`. One to three biome records are accepted only when their weights total exactly 100%.

## Discovery and safety

The Find Games & Safety workspace adds public TableGate browsing, public campaign joining, group-finder profiles, normal and Right Now posts, online/in-person modes, 5–50 mile public-place radii, interests and recommendations, player approval management, trusted contacts, check-ins, private incident journals, and safety reporting.

## Storage and accessibility

`js/tablegate/backend/v8-storage-accessibility.js` exposes the V8 Drive-backed storage, files, folders, categories, documents, scan/OCR handoff, read-aloud preparation, reading progress, accessibility preferences, transcripts, and sync-state routes through one frontend client.

## Audio

The six supplied archives produced 99 unique audio files after three exact SHA-256 duplicates were removed. User-facing paths and titles are in English. Every track is disabled by default until its source and redistribution license are verified. See `docs/licenses/admin-audio-license-audit.md` and `docs/manifests/admin-audio-renames.csv`.

## Paint by Number removal

Paint by Number was removed from Effects Studio, embedded tool documents, styles, scripts, and runtime references. Because a drag-and-drop update cannot delete files already in GitHub, delete the 28 paths listed in `docs/update/DELETE_THESE_FILES.txt` after uploading both archives.
