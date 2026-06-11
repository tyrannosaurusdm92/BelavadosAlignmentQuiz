# Emperor Onyx RuleBot — Fully Split + Enhanced Build

Main file: `emperor_onyx_rulebot.html`

What changed:
- HTML is now structural: the inline Belavadös JSON loader was moved to `js/config/belavados-json-loader.js`.
- CSS was split by responsibility under `css/base`, `css/components`, `css/responsive`, `css/themes`, and `css/patches`; `css/emperor-onyx-rulebot.css` is now the import entrypoint.
- JSON pull paths were moved to `json/onyx_json_pulls.json`; project structure notes are in `json/onyx_project_manifest.json`.
- Attached bot abilities were merged into `js/modules/onyx-enhanced-abilities.js` without copying its visible demo character sheet.
- Onyx keeps his existing personality, lore tools, quest tools, encounter tools, file parsing, memory, DM scan, and 3D dice.

New Onyx commands from the attached bot:
- `scan sheet` / `rescan sheet`
- `roll initiative`
- `roll death save`
- `roll perception with advantage` and other skill/ability/save/tool checks
- `rapier attack`, `spell attack`, `disarm trap`, `pick lock`, `stabilize`
- `alignment scan`
- advanced dice: `4x 1d20+5`, `4d6dl1`, `2d20kh1`, `1d20!`, `8d6cs5`, rerolls like `4d6r1`

Character sheet UI note:
The attached secondary bot's visible demo character sheet was not copied into Onyx. Its useful scanner behavior was converted into hidden scanner logic. A cleaned copy of the secondary project is in `secondary_project_cleaned/` with the demo sheet removed.

Testing:
Run `node tests/onyx_functionality_test_node.js` from this folder.


## Dice table/audio restoration patch
- The real attached `dice-main/` animated 3D dice table is now included at the Onyx root.
- Onyx chat rolls, quick rolls, and panel rolls post into `dice-main/onyx-dice-table.html`.
- The original dice audio file is included at `dice-main/assets/nc93322.mp3` and is used by `dice-main/dice.js`.
- The visible secondary character-sheet demo stayed removed; only scanner/roll logic remains.
