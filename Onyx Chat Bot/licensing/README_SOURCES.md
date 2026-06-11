# Source Notes

This Onyx revision was built from the existing Emperor Onyx RuleBot folder and the user-provided helper projects.

## Included / Adapted

- `dnd_5e_encounter_gen-master`: monster/XP encounter table normalized into `json/belavados_encounter_directory.json` for browser-side quick encounter creation. The uploaded project declares BSD licensing in `setup.py`.
- `dice-witch-master`: dice color palette inspiration for d4, d6, d8, d10, d12, d20, and d100. No React/Three build code is bundled into Onyx.
- `dice-box-main`: table-style full-screen dice rolling behavior inspiration. No Babylon/Ammo build code is bundled into Onyx.
- `dnd-quest-board-main`: quest-board concept reviewed; Onyx uses a simple local Belavadös quest hook JSON instead of the server application.

## Onyx implementation note

The animated dice table in this build is a self-contained HTML/CSS/JavaScript overlay inside Onyx. It avoids external build dependencies so the page still runs from a normal browser folder.
