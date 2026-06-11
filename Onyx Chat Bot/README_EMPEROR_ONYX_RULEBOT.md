# Emperor Onyx RuleBot

Open `emperor_onyx_rulebot.html` in a browser.

Emperor Onyx is a gigantic Maine-Coon black void cat with a green plaid bowtie collar: intelligent, helpful, dramatic, protective, food-motivated, and deeply bonded to Papa.

This revised build is focused on:

- Simple quest generation.
- Natural chat dice rolling without slash commands.
- Full-screen table-style animated dice rolls with per-die colors and visible results.
- Lore parsing and searchable attached Belavadös notes.
- Quick encounter creation from JSON encounter files.
- DM tips for pacing, clues, faction pressure, biome consequences, and session prep.
- Draggable, hidable, responsive Belavadös global navigation.

Settlement, province-batch, and NPC generation are disabled in this Onyx build. The legacy RuleBot engine remains present for shared utilities and lore helpers, but its generation routes now return a disabled message.

## Province count

The local Belavadös fallback seed now contains 28 provinces, including `Valerune`.

## JSON files

The `json/` folder includes local Belavadös data pulls for races, alignments, provinces, factions, transportation, interactive locations, NPC references, time conversion, pantheon, biomes, encounter directory, quest hooks, campaign timeline, constellations, and chat logs.

The encounter directory is loaded from `json/belavados_encounter_directory.json` and normalized into Onyx’s quick encounter builder.

## Dice rolling

Onyx understands natural chat rolls such as:

- `roll a d20`
- `roll d20+5 with advantage`
- `roll 3d6+2 and 1d8`
- `roll d20+7 >= 15`

When he rolls dice, the dice table overlay covers most of the screen, shows the actual number of dice rolled, animates them across the table, and displays the actual rolled values and total.

## Biome categories

Ocean: Ocean Surface floating settlement, Underwater with reefs, Underwater without reefs.

Plains: Grassland, Prairie, Farming.

Mountains: Mountain range, Valley, Deep cavern.

Forest: Deep forest, Partial forest, Treetops - treehouses, Marshes and swamps.

Hybrid: Beach and grass with water, Beach and reefs with water, Hybrid tree and forest floor, Hybrid farming forest grassland.

## Notes

This is a single-folder browser tool. PDF and DOCX body extraction is limited without a larger parsing library, so the parser catalogs those files and reads text-based formats directly.
