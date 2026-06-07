# Belavadös Life Simulator

Open `life_simulator.html` in a browser. No server is required.

This is a modular static HTML/CSS/JavaScript/JSON site built from the uploaded Belavadös Life Simulator instructions, existing living-settlement generator, faction conversion document, lore archive, and Emperor Onyx package.

## Included structure

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
  emperor-onyx.js
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
/assets/onyx-moods/
/saves/
/templates/
/exports/
/tests/
```

## Features

- Single Settlement, Province, and Whole World scope settings.
- Three-biome selection stack.
- Race category, habitat filter, race/bloodline/subgroup dropdown, race cache, and demographic weights.
- Location, NPC, relationship, household, schedule, service, faction, intrigue, validation, editor, import, and export panels.
- Static-site-safe Emperor Onyx helper bot with command parsing.
- Local browser storage.
- JSON, HTML, and real minimal DOCX export.
- Browser-safe import scanner with graceful handling for binary files.
- No map-pin editor workflow.

## Notes

DOCX/PDF/ZIP body parsing in the browser is intentionally limited without adding a large parsing library. The importer catalogs those files and scans text-based files directly. JSON exports from this app can be reimported to reconstruct state.

Race dropdown data ships with schema `belavados.raceDropdown.v2`, 156 base race entries, 22 categories, and 182 selectable race/bloodline/subgroup options.
