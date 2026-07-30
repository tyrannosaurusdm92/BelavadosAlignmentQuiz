# Revision Audit

- Replaced the prior backend endpoint and Apps Script library with the requested endpoint and library version 6.
- Replaced the single-system D&D runtime with a nine-system switchable engine sourced from the uploaded reference package.
- Added dedicated native resolvers for D&D, Pathfinder 2e Remastered, Call of Cthulhu 7e, GURPS 4e Revised, Savage Worlds SWADE, Fate Core, Daggerheart, Blades in the Dark, and Powered by the Apocalypse.
- Added a universal notation parser covering arbitrary dice sizes, percentile/Fate dice, arithmetic, keep/drop, rerolls, explosions, success/failure counting, d66/d666, and repeated expressions.
- Added campaign fields, local persistence, backend synchronization, selected-system metadata, selected variant, bot mode, reference snippets, and last-roll context to connected assistant requests.
- Added local system-specific rules search and campaign-aware Rules, Roller, Campaign, Character, Facilitator, and Connected Dice Bot modes.
- Retained the World and TTRPG Server page bodies as placeholders.
- Preserved the 3D dice renderer, left appearance/audio controls, right pull-out Dice Bot, iframe site layer, and dice-over-board behavior.
- Removed the obsolete duplicate single-system D&D database copy; live source data is now under `json/systems/` and in the generated browser bundle.

## Runtime hashes

- `json/ttrpg_system_bundle.js`: `186ac8e180c1627f76ac5039eb056b5ca343aed35beb90de0ad5e13fb1d19e44`
- `js/multi-system-engine.js`: `774917f51507670cac4f5c0b9e799d7ba8f04a93650e1a85f1b77211266e86e0`
