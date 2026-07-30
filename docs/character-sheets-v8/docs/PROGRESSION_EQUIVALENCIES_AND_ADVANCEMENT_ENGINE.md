# Progression Equivalencies and Automated Advancement Engine

Build date: 2026-07-29T23:05:04.407998+00:00

## Design rule

The collection does not force every RPG into D&D-style XP. Each sheet uses its actual advancement currency or event and provides a dropdown calculator, automatic readiness detection, carryover where applicable, an advancement-choice wizard, history, undo for the last award, and JSON export. Optional-book and homebrew choices are recorded as pending DM/GM/MOL review rather than silently certified.

## Implemented systems

- **D&D 5e / 2024 (5.5e):** cumulative XP thresholds 0 through 355,000; hostile, party-divided hostile, quest, milestone, and other awards; automatic supported-level calculation; native class/multiclass level-up handoff; feat, skill, spell, attack, subclass, HP, and class-feature prompts.
- **Pathfinder 2e Remastered:** standard 1,000-XP level track with 800/1,200 campaign variants and custom threshold; official accomplishment, adversary, simple-hazard, and complex-hazard awards; carryover; feat schedule, skill increases, ability boosts, archetypes, spell, and class-table prompts.
- **Fate Core:** minor, significant, and major milestones with the correct change/power options rather than numeric XP.
- **GURPS Fourth Edition:** GM-awarded character points, unspent/spent accounting, 0–5 session award helper, and point-cost validation for attributes, skills, techniques, advantages, perks, spells, and disadvantage buyoff.
- **Call of Cthulhu Seventh Edition:** checked-skill development; d100-over-current test; d10 increase on success; check cleared either way; Cthulhu Mythos excluded from ordinary checks.
- **Daggerheart:** narrative milestone reminder (editable, default three sessions), levels 1–10, two advancement slots, domain-card prompt, subclass/tier prompts, and level-5+ multiclass prompt.
- **Powered by the Apocalypse adapter:** configurable playbook XP threshold; marks from misses/triggers/end-session; exact-playbook improvement wizard; no fabricated universal PbtA level system.
- **Savage Worlds Adventure Edition:** direct Advances rather than fabricated XP; automatic Rank from total Advances; Edge, skill, Attribute, Hindrance, Power, and prerequisite prompts.
- **Blades in the Dark:** desperate-action, end-session, downtime training, and crew-trigger XP; playbook/attribute/crew tracks; automatic advance prompts and carryover.

## Research basis

- D&D Beyond Basic Rules, “Level Advancement” and multiclassing: https://www.dndbeyond.com/sources/dnd/br-2024/creating-a-character
- User-provided D&D XP calculator JSON: dnd_5e_5_5e_xp_progression_calculator.json
- Archives of Nethys, GM Core XP Awards: https://2e.aonprd.com/Rules.aspx?ID=2649
- Fate Core SRD, Advancement & Change: https://fate-srd.com/fate-core/advancement-change
- Chaosium Call of Cthulhu RPG Wiki, Rewards of Success: https://cthulhuwiki.chaosium.com/rules/rewards-of-success.html
- Daggerheart official SRD: https://www.daggerheart.com/srd/
- Blades in the Dark official SRD, Advancement: https://bladesinthedark.com/advancement
- Lumpley Games, Apocalypse World custom advancement: https://lumpley.games/2022/05/28/apocalypse-world-custom-advancement/
- Steve Jackson Games official GURPS materials and campaign guidance: https://www.sjgames.com/gurps/
- Pinnacle Entertainment official Savage Worlds Adventure Edition materials: https://peginc.com/savage-settings/savage-worlds/

## Safety and legality behavior

The wizard applies only mechanical changes that are system-wide and unambiguous. Class-specific, playbook-specific, source-specific, optional, and homebrew features are recorded with source context and a pending DM/GM/MOL review status. This prevents the sheet from claiming that a character option is legal when prerequisites or campaign sources are unavailable.
