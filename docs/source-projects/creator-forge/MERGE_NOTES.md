# Merge Notes

## Priority order

1. TableGate project data and map hierarchy
2. Current setting/system-agnostic LifeSimulator engines
3. Classic LifeSimulator presentation and record depth
4. Narrow TownGeneratorOS NPC/location adapter

The old visual treatment is deliberately confined to LifeSimulator workspaces. Project setup and Map Viewer remain visibly TableGate so a D&D-like skin cannot be mistaken for a system restriction.

## Older LifeSimulator material retained

- Dark cyan, gold, and near-black workspace styling
- D&D/homebrew presentation cues
- Age and life-stage enrichment
- Aspirations, wants, hobbies, traits, and relationship links
- Legacy activity artwork
- Generic location/routine reference data in `data/legacy-dnd/`

A classic D&D overlay is added only when the selected rules profile is D&D. Other systems retain their own labels and mechanics.

## Data flow

Location generation writes directly to `state.locations`. NPC generation writes directly to `state.npcs`. Map Viewer derives semantic nodes from those same records, so there is no duplicate “viewer database” that can drift out of sync.

Physical map links and record placements are stored under:

- `state.tablegate.mapLinks`
- `state.tablegate.mapPlacements`

These fields are included in project exports and the TableGate semantic map manifest.
