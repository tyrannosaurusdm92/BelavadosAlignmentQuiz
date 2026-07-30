# TableGate v8 Release Notes

## Unified assistant

TableGate now includes a project-aware assistant that reads a compact summary of the active project and can help with people, locations, settlements, rules terminology, simulation planning, maps, transit, and project auditing. The configured project backend is the supplied AI-brain deployment and library version.

Structured assistant changes are review-first. Generated actions remain pending until the user applies them. The allowlist covers NPC, location, settlement, transit, trip-plan, and project-note operations; ordinary chat never mutates the project.

The Image Studio sends image requests to the project backend, saves returned URL/data-URL/base64 image results in the local asset store, and can attach them to NPCs, locations, or map nodes. Generated local assets are included in project ZIP exports when the browser makes their binary data available.

## Transit and trip planning

- Editable transit types with custom labels, categories, colors, speed units, capacities, fares, dwell, frequency, and notes.
- Starter models span overland, water, aerial, submerged, gateway, orbital, and deep-space movement without locking the project to any setting.
- Constant-speed, accelerated, fixed-duration, and gateway travel calculations.
- Ordered stops and segment distances, including map-inferred distance when stops share a map.
- Frequency, explicit-departure, continuous, and on-demand services.
- Earliest-arrival planning with waits, transfers, ride time, dwell time, and optional activity visits.
- Visit records can hold purpose, expected duration, NPC, exchanged goods, requested services, and notes.
- Tracked vehicles advance with simulation time.
- Transit colors render as glowing route arcs in the Map Viewer.

## Single-page package

The application entry point is now only `tablegate.html`. The root contains `service-worker.js` and exactly five folders: `css`, `js`, `json`, `assets`, and `docs`. No launcher scripts or secondary HTML pages are included.

## Preserved systems and simulator depth

All nine supplied rules-system JSON files remain byte-for-byte identical to their attached versions. The fourteen protected gender identities, custom identities, complete editable pronoun grammar, per-NPC overrides, LifeSimulator records, old D&D/homebrew visual treatment, TableGate system switching, and generated NPC/location Map Viewer bridge remain intact.
