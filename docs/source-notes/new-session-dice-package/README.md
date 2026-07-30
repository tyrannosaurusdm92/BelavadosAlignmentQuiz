# Multi-System TTRPG Portal

Open `roleplaying_board.html` directly. The project remains a single-HTML internal-page application with local supporting assets and embedded system databases.

## Internal pages

1. **Portal** — campaign setup, system/edition selection, and shared context.
2. **Dice Roller** — universal notation, system-native resolution, 3D dice, local rules lookup, and connected campaign-aware Dice Bots.
3. **World** — preserved placeholder page.
4. **TTRPG Server** — preserved placeholder page.

## Supported systems

- **D&D 5e / 5.5e** — d20 tests, advantage/disadvantage, attacks, saves, death saves. Source: `json/systems/dnd_5e_5_5e_complete_character_reference_v3_all_official_races.json`.
- **Pathfinder 2e Remastered** — d20 checks with four degrees of success and natural 20/1 degree shifts. Source: `json/systems/how_to_play_pathfinder_2e_remastered_complete_reference_v2.json`.
- **Call of Cthulhu 7e** — d100 roll-under with Regular, Hard, Extreme, Critical, Fumble, bonus and penalty dice. Source: `json/systems/how_to_play_coc_7e_complete_reference_v2.json`.
- **GURPS 4e Revised** — 3d6 roll-under with success/failure margin and critical results. Source: `json/systems/gurps_4e_revised_complete_character_reference_v2.json`.
- **Savage Worlds SWADE** — Trait Die plus Wild Die, Acing, target numbers, raises, and damage. Source: `json/systems/savage_worlds_swade_complete_reference_v2.json`.
- **Fate Core** — 4dF plus skill, opposition, shifts, and outcome ladder. Source: `json/systems/fate_core_complete_how_to_play_reference_v2.json`.
- **Daggerheart** — Hope/Fear Duality Dice, critical matching, difficulty, advantage/disadvantage, adversary rolls. Source: `json/systems/how_to_play_daggerheart_complete_reference_v2.json`.
- **Blades in the Dark** — d6 action pools, zero-die rolls, criticals, resistance and stress. Source: `json/systems/how_to_play_blades_in_the_dark_complete_reference_v2.json`.
- **Powered by the Apocalypse** — classic 2d6 move bands plus implementation-specific exact notation. Source: `json/systems/how_to_play_powered_by_the_apocalypse_complete_reference_v2.json`.

The selector changes the active resolver, shortcuts, terminology, search database, edition/variant choices, Dice Bot context, and backend request payload. The engine does not treat these systems as cosmetic labels or silently combine conflicting procedures.

## Universal dice language

The roller accepts standard polyhedral notation across arbitrary die sizes, percentile dice, Fate dice, arithmetic and parentheses, keep/drop modifiers, rerolls, exploding dice, success/failure counting, d66/d666, and repeated expressions. System shortcuts then interpret results through the active game's actual resolution procedure.

Examples: `1d20+7`, `4d6kh3`, `8d10!cs>=8`, `4dF+3`, `d100`, `d66`, `repeat 6: 4d6kh3`.

## Campaign-aware Dice Bots

Campaign name, premise, party, tone, table rules, notes, selected system, selected edition/variant, bot mode, and last roll are included in connected backend requests. Local answers remain available from the supplied databases if network access or Apps Script is unavailable.

## Backend

- Endpoint: `https://script.google.com/macros/s/AKfycbylmceRVx5UcgMvMDkwym_9h0wv8gM5B9Msuui7-7Z6lqoYlqZBR6Y47hmsauQgoGXY/exec`
- Library ID: `18ET55A9uVNx3IUzoAM_eRj8v7jqagPgjVdxil3P1SoUqrFnnAJp6CjVr`
- Library version: `5`
- Assistant action: `ttrpg_portal_assistant`
- Campaign save action: `ttrpg_portal_campaign_save`

## Data integrity

The nine source JSON files are retained unchanged under `json/systems/`. `json/ttrpg_system_bundle.js` packages those sources for direct local-browser use without requiring a server. See `docs/merged_manifest.json` for file hashes and sizes.
