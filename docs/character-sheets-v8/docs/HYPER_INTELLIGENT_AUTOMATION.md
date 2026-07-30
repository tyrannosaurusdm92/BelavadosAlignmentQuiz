# Hyper-Intelligent Automation Pass

## Shared artwork editor on all nine sheets

Both saved artwork slots now use a circular crop frame. Players can:

- upload or drag-and-drop art as before;
- drag directly on the circle to reposition the image;
- adjust zoom, horizontal crop, and vertical crop;
- change border thickness;
- choose border color with a color wheel or enter a hex code;
- upload any image as the border surface, including metal, wood, fabric, engraved frames, or gradient artwork;
- remove the texture, reset the crop, or copy one border configuration to both frames.

The crop and border settings are stored inside the character state, local autosave, JSON export, and standalone interactive HTML export. The sample `assets/editable_circle_border_reference.svg` is an uploadable transparent-center gradient ring and a reference for the editable border area. The delivered source archive did not contain a separate standalone SVG attachment, so this implementation includes its own editable reference asset while keeping all sheet behavior self-contained.

## Automatic progression and resource tracking

| System | Progression automation | Currency/resource automation |
|---|---|---|
| Fate Core | Minor, significant, and major milestone history; system-specific milestone checklist and prompts. | Resources skill remains authoritative; optional exact campaign funds with named unit and ledger. |
| GURPS 4e | Earned character points, calculated spent points, budget balance, overspend audit, and improvement checklist. | Setting-defined currency wallet, add/spend validation, and transaction ledger. |
| Call of Cthulhu 7e | Checked-skill development phase; external d100/d10 inputs; automatic success test, increase, cap, check removal, and history. | Cash, assets, spending level, Credit Rating band, and finance ledger. |
| Daggerheart | Narrative-session counter, milestone popup, level/tier calculation, thresholds, tier proficiency, +2 Experience, and reset. | Coin/handful/bag/chest conversions, normalization, carried-chest audit, and ledger. |
| Pathfinder 2e Remastered | 1,000-XP levels, carryover, level cap, level popup, level update, and full sheet recalculation. | cp/sp/gp/pp conversion, normalization, insufficient-funds protection, and ledger. |
| PbtA adapter | Exact-game XP maximum, full-track popup, carryover, and advancement record without inventing a universal level system. | User-named exact-game currency with ledger and validation. |
| SWADE | Advance records, automatic Novice/Seasoned/Veteran/Heroic/Legendary rank, and legal-advance checklist. | Setting-defined currency with ledger and validation. |
| Blades in the Dark | Playbook, Insight, Prowess, Resolve, and crew XP thresholds; carryover and advancement conversion. | Character coin, stash, crew coin, carried-coin audit, and deposit/withdrawal guidance. |
| D&D 5e / 5.5e | Standard cumulative XP thresholds, automatic level-ready popup, and handoff to the existing complete multiclass level-up wizard. | Existing cp/sp/ep/gp/pp wallet plus equivalent value, normalization, insufficient-funds protection, and ledger. |

## Continuous math audit

Each sheet now runs a system-specific audit beside progression. Examples include point-budget overspend, invalid Fate skill structure, CoC improvement checks and SAN threshold prompts, Daggerheart Hope/HP/Stress limits, Pathfinder dying thresholds, PbtA full tracks, SWADE rank mismatch, Blades stress/coin/XP limits, and D&D XP/proficiency/currency totals.

## Dice boundary

No new general-purpose dice roller was added. The sheets preserve their existing guided resolution features and expose the future portal contract. In portal mode, the parent dice roller supplies random results and the sheet resolves system math and outcomes.
