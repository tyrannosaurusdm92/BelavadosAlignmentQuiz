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

## Added import-expansion workflow

This revision adds a drag-and-drop scanner for `.json`, `.html`, `.pdf`, and `.docx` files. JSON imports are parsed structurally. HTML files are scanned for embedded `application/json` blocks and visible text. DOCX files are decompressed in-browser when the browser exposes `DecompressionStream`; otherwise the app falls back to a binary text scan. PDF files use a static text scanner; image-only PDFs still require OCR outside this no-server app.

Uploaded NPC fields are treated as authoritative. The generator fills only missing or empty supporting fields such as schedules, relationships, family tree, assignment, transit route, wants, fears, aspirations, alignment scores, and location links. Quest fields such as `quests`, `questHooks`, `offeredQuests`, `quest`, and `offersQuest` are preserved during expansion and rerolls.

Generated NPCs now append to the existing roster instead of replacing it. Use **Clear NPCs** before generating if a clean roster is desired. New generated or imported NPCs are linked into existing NPCs through personal, professional, familial, and possible romantic relationships.

Imported/custom locations are saved in `customLocations`. When locations are imported or province/settlement data is replaced after NPCs already exist, generated placeholder assignments are reconciled into the newer locations while explicitly imported NPC/location fields stay protected.

## Alignment wording

The UI now displays the Belavadös axis names exactly as living axis-name chains:

- selfish / neutral / altruistic
- chaotic / neutral / lawful
- combative / neutral / cooperative
- pragmatic / neutral / honorable

The exported alignment object includes scale `0–3000`, neutral center `1500`, position step `250`, phase labels, axis terms, and a combined `alignmentName` made from the four current axis terms.

## DM controls added

- **Reroll NPC** button on each NPC card. Imported priority fields and quest hooks are protected.
- **5% Randomizer** button. Randomizes only about 5% of eligible NPC/location fields, such as a small job-title variant, gender identity/pronouns, a name variation, a personal location, one alignment step, or a location-name variation.

## Location Generator / Editor Expansion

This build now includes a second in-page screen inside `life_simulator.html`: **Location Generator & Editors**.

New files added:
- `life-simulator/location-generator.js`
- `life-simulator/location-editor.js`
- `life-simulator/location-tools.css`
- `data/location_generator_rules.json`

What was added:
- Biome-aware full location generation from the DOCX-derived percentage rules.
- Location editor with editable generated/manual locations.
- Locked uploaded-NPC locations: uploaded NPC data can create protected location records whose core fields cannot be changed, but whose descriptions, goods/services, prices, hooks, pins, and generated-NPC assignments can be expanded.
- Generated NPC auto-assignment to generated/editable locations only; imported/uploaded NPCs are not auto-overwritten.
- 5% location-name randomizer that skips locked uploaded-NPC locations.
- Location export preserving NPC connections, pins, services, descriptions, ownership, pricing, and story hooks.


## 2026-06 Alignment randomization patch

This build now loads `life-simulator/belavados_alignment_randomizer.js` before the main simulator core. NPC alignment generation routes through that file's `BelavadosAlignmentRandomizer` engine, using race, class / multiclass data, and the selected settlement danger level. The simulator also routes its main seeded RNG through the same randomizer engine, keeps score precision at 1-point resolution instead of 250-point snapping, strongly reduces neutral-axis results, prevents all-neutral outcomes except at near-impossible odds, and tracks score signatures during a browser session to repair exact duplicate NPC alignments.

## 2026-06-10 Compendium race/bloodline lock

- `data/belavados_race_categories.json` is rebuilt from `Belavados_DnD_Races_Alignment_Pantheon_Compendium_images_replaced.docx`.
- NPC race generation now draws from exactly the compendium race entries, not the previous additive heritage expansion list.
- NPC bloodlines are selected only from explicit `race.bloodlines` arrays parsed from the compendium. If a race has no listed bloodlines, generated NPCs export `race.bloodline: null`.
- NPC schedule exports now include `emoji`, `activityImage`, and `activityVisual` for every schedule row, plus `scheduleActivityAssetManifest` at the export packet level.

- Saved race caches are sanitized against the compendium list when generating or loading saved state; stale additive/invented race cache entries are removed.
