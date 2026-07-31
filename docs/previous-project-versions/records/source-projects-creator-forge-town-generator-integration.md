# TownGeneratorOS Integration

The integration is intentionally narrow. It uses only semantic ideas relevant to population and locations:

- Settlement size profiles
- Approximate district counts
- Weighted ward/district categories
- District-to-location type pools
- District-to-profession pools

It does **not** import or call TownGeneratorOS geometry, Voronoi code, roads, walls, gates, building polygons, rendering, labels, or image generation.

## Output hierarchy

The adapter creates:

- Settlement root
- District/ward children
- Structure or landmark children
- NPC workplace and residence assignments
- NPC relationships and normal LifeSimulator schedules

All generated records are ordinary TableGate records. They can be renamed, re-parented, edited, exported, opened in Map Viewer, linked to physical map files, and placed as records on maps.

## Presentation modes

- **Classic fantasy / homebrew:** uses labels such as Craftsmen Ward, Temple Ward, Castle, taverns, inns, and smithies where appropriate.
- **Setting-neutral:** uses functional district labels such as Trade and Exchange District, Civic and Administrative District, and Central Command Complex.

Neither mode changes the project’s selected rules system.

## License and source

The adapter notes its TownGeneratorOS derivation and retains the GPL v3 license. The exact size constants and weighted ward sequence used for review are retained as a narrow source excerpt under `third_party/TownGeneratorOS_relevant_source/`; unrelated geometry and renderer source are excluded.
