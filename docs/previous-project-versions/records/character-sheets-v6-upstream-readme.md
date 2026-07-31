# Complete TTRPG Character Studio Collection

This collection contains nine self-contained character studios. **Every sheet now uses the same complete D&D character-studio layout and interaction model** while preserving the correct rules, vocabulary, calculations, prompts, guided resolution procedures, recovery procedures, and advancement logic for its own game system.

Open `system_atlas.html` to choose a system. Every sheet opens directly in a modern browser with no installation, account, CDN, batch file, build step, or network dependency.

## Shared D&D-studio structure on all nine sheets

- the same 960 px centered studio shell and responsive two-column layout;
- a sticky character sidebar with **two persistent drag-and-drop image uploaders**;
- live character summary values and system-specific derived statistics;
- guided action buttons, immersive rules prompts, quick formulas, and automatic calculations;
- the same draggable **hamburger-style jump-scroll menu** generated from the real sheet sections;
- a named **Sheet Design** dropdown in both the header and hamburger menu;
- named designs derived from the supplied palette reference: Arcane Cyan, Ember Parchment, Verdant Ledger, Royal Archive, Steel & Ink, and Sunset Teal;
- editable colors, background upload/URL/removal, darkening control, and browser-local appearance persistence;
- local character autosave, explicit Save, JSON import/export, print support, rules search, and pre-filled interactive HTML export;
- artwork and appearance retained in character exports and editable interactive HTML copies.

## New circular artwork, progression, currency, and portal intelligence

- two persistent rectangular full-character artwork uploaders preserve complete body compositions without forced circular cropping;
- a third, separate circular token studio provides drag-to-crop editing, zoom/position sliders, adjustable border width, color wheel, hex input, and uploaded border textures/gradients;
- artwork, token crop, and border settings survive autosave, JSON, and editable interactive HTML export;
- every system has automatic progression tracking, system-specific advancement popups, history, math audits, and currency/resource ledgers;
- each standalone sheet exposes `window.TableGateCharacterSheet` and the `tablegate.character-sheet.v1` postMessage contract for later iframe integration;
- the bridge reports exact modifiers and resolves externally supplied dice results, but reports `generates_dice: false`, avoiding a competing portal dice engine.

See `docs/HYPER_INTELLIGENT_AUTOMATION.md` and `docs/PORTAL_BRIDGE_CONTRACT.md`.

## Filename instructions applied

The filenames in the root were treated as instructions:

- `copy hamburger navigation and 2 image uploader and narrow overlay from here.html` supplied the hamburger navigation geometry, two-art-window behavior, and narrow centered overlay.
- `copy color schemes (without copying homebrew names like ichor) from here.html` supplied palette values only. No homebrew world names, deities, factions, settlements, ichor terminology, or setting-specific mechanics were copied.

See `docs/FILENAME_INSTRUCTIONS_APPLIED.md` for the implementation audit.

## Sheet inventory

| # | System | File | Shared layout | Complete embedded source |
|---:|---|---|---|---|
| 1 | Fate Core | `01_fate_core_campaign_storyboard.html` | D&D Character Studio | `fate_core_complete_how_to_play_reference_v2.json` |
| 2 | GURPS Fourth Edition | `02_gurps_tactical_dossier.html` | D&D Character Studio | `gurps_4e_revised_complete_character_reference_v2.json` |
| 3 | Call of Cthulhu Seventh Edition | `03_call_of_cthulhu_evidence_board.html` | D&D Character Studio | `how_to_play_coc_7e_complete_reference_v2.json` |
| 4 | Daggerheart | `04_daggerheart_domain_card_atelier.html` | D&D Character Studio | `how_to_play_daggerheart_complete_reference_v2.json` |
| 5 | Pathfinder Second Edition Remastered | `05_pathfinder_remastered_hero_workshop.html` | D&D Character Studio | `how_to_play_pathfinder_2e_remastered_complete_reference_v2.json` |
| 6 | Powered by the Apocalypse | `06_pbta_move_workshop.html` | D&D Character Studio | `how_to_play_powered_by_the_apocalypse_complete_reference_v2.json` |
| 7 | Savage Worlds Adventure Edition | `07_swade_wild_card_command_deck.html` | D&D Character Studio | `savage_worlds_swade_complete_reference_v2.json` |
| 8 | Blades in the Dark | `08_blades_in_the_dark_score_command_board.html` | D&D Character Studio | `how_to_play_blades_in_the_dark_complete_reference_v2.json` |
| 9 | D&D 5e / 5.5e | `09_dnd_5e_5_5e_complete_character_sheet_original.html` | Original D&D Character Studio | Original embedded database |

## Rules boundary

The shared studio shell is presentation and workflow, not a cross-system rules merger. Fate still uses Fate math; GURPS still uses 3d6 roll-under and point accounting; Call of Cthulhu still uses percentile resolution; Daggerheart still uses Hope/Fear duality; Pathfinder still uses degrees of success and proficiency by level; PbtA remains an exact-game adapter; SWADE still uses Trait/Wild Dice and Acing; Blades still uses action pools, position/effect, stress, and resistance. D&D classes, spell slots, d20 math, and rests are not copied into unrelated games.

## Validation

All nine source sheets and all nine filled interactive HTML exports were opened in Chromium. Validation covered JavaScript syntax/runtime errors, duplicate IDs, desktop/mobile layout, hamburger navigation, named design synchronization, both circular image editors, color/hex/texture borders, system-specific progression application, currency transactions, postMessage/API bridge behavior, external result resolution, interactive export, state/art/border restoration, appearance restoration, and continued editability. The current merged reports are in `docs/MERGED_RUNTIME_AND_OVERFLOW_VALIDATION.json`, `docs/MERGED_PORTAL_ROLL_VALIDATION.json`, and `docs/MERGED_INTERACTION_VALIDATION.json`; earlier source-build reports are retained for traceability.


## Merged Player-Assist Revision

Every sheet now provides two complete rectangular character-art uploaders and a third, separate circular token editor. The token has drag repositioning, zoom, border thickness, color wheel, hexadecimal color entry, uploaded border textures/gradients, and a gold-ring style derived from the supplied SVG reference.

A unified popup assistant now covers portal roll preparation, checks and saves, searchable ability/attack/spell/move descriptions, player and character identity, pronouns, gender identity, relationships, factions, progression, currency, and system-specific level-up checklists. Popups update the same automatic progression and currency state used by the sheet; no duplicate ledgers or competing dice roller are created.

Global overflow and wrapping rules were added for long rules text, filenames, generated cards, toolbar controls, buttons, labels, select fields, modals, and mobile layouts. Every popup rule card explains the applicable roll or resolution procedure, roleplay framing, relevant modifiers/resources, and the state changes the player should record afterward.


## Complete Options & Homebrew Engine

All nine sheets include a source-aware rules catalog and a DM/GM/MOL-approved manual/homebrew engine with formula-driven effects, field linking, autosave, and JSON import/export. See `docs/RULES_CATALOG_AND_HOMEBREW_ENGINE.md`.
