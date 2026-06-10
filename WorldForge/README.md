# Belavadös Life Simulator

Open `life_simulator.html` to use the simulator. For the most reliable replacement-data workflow, host the folder on a static site or run a local static server, then replace files in `/data/` as needed.

## Included files

- `life_simulator.html` — main interface.
- `life-simulator/site.css` — dark steampunk interface styling.
- `life-simulator/core.js` — simulator logic, NPC generation, cache behavior, exports, local save, and Onyx handoff.
- `data/provinces_settlements.json` — replaceable province and settlement data with coordinates, governments, time zones, biomes, tags, and transit profiles.
- `data/belavados_race_categories.json` — race categories, race options, creator gods, habitat tags, and alignment defaults.
- `data/class_subclass_options.json` — class and subclass options including multi-class support.
- `data/faction_rules.json` — active ten factions, tiers, badge ranks, portal pass types, and job/class hooks.
- `data/living_world_rules.json` — gender identities, relationship types, jobs, wants, fears, aspirations, hobbies, traits, and scope rules.
- `data/transit_rules.json` — rail, caravan, ferry, steamship, skyship, submarine, and regulated portal modes.
- `data/visitable_locations.json` — location pools and services from the interactive locations source.
- `data/default_data.js` — no-server fallback data so the simulator can still run when opened directly.

## Onyx launcher

The main simulator does not embed Onyx. The toolbar button opens:

`emperor_onyx_rulebot.html`

Before opening it, the simulator writes a read-only handoff packet to localStorage under:

`belavados.lifeSimulator.onyxHandoff`

## Scope behavior

- Single Settlement: province and settlement dropdowns are enabled; biome cache limit is 3; NPCs stay mostly inside that settlement.
- Whole Province: province is enabled, settlement is disabled; biome cache limit is 3; NPCs travel inside the selected province.
- Whole World: province and settlement are disabled; biome cache limit is 15; NPCs can be assigned across the world and travel world-wide.

## Export buttons

- Export All NPCs JSON
- Export World-Wide NPCs JSON
- Export Province-Wide NPCs JSON
- Export Settlement-Wide NPCs JSON
- Export Current `provinces_settlements.json`

Each NPC export includes home, work, personal, and professional travel locations, full schedule blocks, transit route, relationships, family tree, wants, fears, aspirations, faction records, class/subclass data, race, alignment, and location assignment.
