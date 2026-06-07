# Belavadös Life Simulator

A modular offline static HTML/CSS/JavaScript/JSON site for generating living Belavadös settlements. It supports province setup, UTC/time data, biome logic, official race dropdowns, race cache weighting, NPCs, households, gender-neutral family trees, relationships, transit schedules, services, factions, intrigue, validation, and exports.

Open `life_simulator.html` after unzipping. The site runs locally in your browser and does not upload campaign material.

## Revised module layout

```text
life_simulator.html

/life-simulator/
  site.css
  core.js
  data-bundle.js
  render.js
  simulation.js
  npc-system.js
  location-system.js
  relationship-system.js
  family-system.js
  faction-system.js
  schedule-system.js
  services-system.js
  import-system.js
  export-system.js

/data/
  belavados_alignment_model.json
  belavados_content.json
  belavados_time_model.json
  belavados_race_categories.json
  living_world_rules.json
  settlement_assignments.json
  visitable_locations.json
  faction_rules.json
  manifest.json

/saves/
/templates/
/exports/
/assets/
/tests/
```

## Revision 1.1.0 highlights

- Replaced the race menu data with the attached official Belavadös race dropdown package shape: 22 categories and 182 selectable race/bloodline/subgroup options.
- Added habitat-aware race filtering, race detail previews, race cache weighting, and race data normalization for both browser-ready and JSON-ready package formats.
- Rebuilt province handling around the attached UTC table: each province stores primary UTC, display UTC labels, center longitude/latitude, and settlement-specific time-zone notes.
- Updated Belavadös time conversion to Earth-first / Belavadös-second display with 330.15 solar-day progress, 330 civil dates, 11 months, weekdays, and two moon phase trackers.
- Updated settlement scale targets:
  - Capital City: about 1,312 locations, 3,588 named NPCs, 21% world travelers.
  - City: about 1,000 locations, 2,700 named NPCs, 18% world travelers.
  - Town: about 220 locations, 600 named NPCs, 9% world travelers.
  - Village: about 60 locations, 160 named NPCs, 3% world travelers.
- Expanded NPC generation with gender identity, pronoun sets, identity visibility, honorific/title preferences, home/work/social/religious/transit/secret/emergency locations, public transit habits, work titles, faction titles, and world-travel flags.
- Rebuilt relationship generation across familial, romantic, household, professional, personal, faction, civic, religious, customer/service, criminal/secret, and travel/transit ties.
- Added a built-in family tree maker for generated households. It creates gender-neutral SVG trees plus JSON/CSV exports for each household without bundling any external font files.
- Integrated public transit logic for rail, ferry, steamship, skyship, caravan, submarine, and regulated portal travel.
- Removed the local Onyx chatbot module and local Onyx mood assets. The simulator now includes a button that opens the dedicated Emperor Onyx RuleBot page in a new tab.

## Testing

Run:

```bash
python3 tests/smoke_test.py
```

Additional validation used during packaging:

```bash
node --check life-simulator/core.js
node --check life-simulator/render.js
node --check life-simulator/simulation.js
node --check life-simulator/npc-system.js
node --check life-simulator/location-system.js
node --check life-simulator/relationship-system.js
node --check life-simulator/family-system.js
node --check life-simulator/faction-system.js
node --check life-simulator/schedule-system.js
node --check life-simulator/services-system.js
node --check life-simulator/import-system.js
node --check life-simulator/export-system.js
```

The included smoke test verifies required files, JSON validity, official race counts, province UTC data, time model values, settlement scale targets, external Onyx mode, and script references.
