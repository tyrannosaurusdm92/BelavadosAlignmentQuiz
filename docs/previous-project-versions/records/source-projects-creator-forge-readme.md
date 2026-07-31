# TableGate v8 Unified LifeSimulator, Transit, Map Viewer, and Assistant

Open `tablegate.html` to launch the project. It is the only HTML file in the package.

TableGate remains the authoritative project shell. LifeSimulator supplies living people, identities, pronouns, households, relationships, schedules, locations, dialogue, reactions, and simulation. The Map Viewer reads those same records. The transit engine adds user-defined movement types, stops, routes, services, vehicles, trip planning, transfers, activity stops, and neon route overlays. The integrated assistant can use the configured project AI backend for project-aware help and image generation.

## Package layout

- `tablegate.html` - the only application page.
- `service-worker.js` - optional hosted/offline caching. It registers only on HTTP or HTTPS.
- `css/` - application, LifeSimulator, map, transit, and assistant styles.
- `js/` - application engines, system adapters, assistant intelligence, transit, maps, simulation, import/export, and local registries.
- `json/` - system references, TableGate schemas, transit presets, dialogue contracts, and token manifests.
- `assets/` - reactions, activity art, SVG token borders, and related media.
- `docs/` - deployment notes, manifests, audits, source notes, licenses, and guides.

## Start

1. Extract all supplied parts into the same parent folder. Each part contains a `TableGate` folder and is designed to merge without replacing unrelated files.
2. Open `TableGate/tablegate.html`.
3. For installable/offline behavior, host the `TableGate` folder on a static web host. Direct local opening still provides the core single-page project, but browser security rules can limit service workers and some remote requests.
4. Export the project periodically from Import / Export. Browser storage is convenient, not a replacement for backups.

## Design guarantees

- No dependency on Windows batch files.
- One HTML file only.
- Setting, genre, era, species, identity, biological form, culture, rules role, profession, and transit technology are independent layers.
- The fourteen protected built-in gender identities remain present. Custom identities and editable pronouns remain supported.
- The initial D&D-flavored LifeSimulator appearance is presentation only. Other attached systems continue to supply their own terminology and option layers.
- Transit labels are editable. For example, the built-in aerial vessel label can be renamed without changing its speed model, route color, or saved routes.
- Assistant actions are review-first. The assistant cannot silently apply structured project changes.
