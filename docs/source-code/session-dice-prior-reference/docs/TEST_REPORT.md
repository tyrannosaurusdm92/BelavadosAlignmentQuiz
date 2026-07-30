# Validation Report

## Systems tested

- D&D 5e / 5.5e
- Pathfinder 2e Remastered
- Call of Cthulhu 7e
- GURPS 4e Revised
- Savage Worlds Adventure Edition
- Fate Core
- Daggerheart
- Blades in the Dark
- Powered by the Apocalypse

## Browser interaction tests

- Loaded all nine databases and populated both synchronized system selectors.
- Switched systems and confirmed system-specific variants, quick rolls, topics, title text, and terminology.
- Executed one native resolution test for every supported system.
- Retrieved a system-specific local rules answer from every supplied reference.
- Saved campaign name, premise, and house-rule context and confirmed it appeared in local campaign responses.
- Stubbed the replacement Apps Script connection and confirmed connected requests contain the active system, variant, bot mode, campaign context, relevant source snippets, and only a last roll belonging to the active system.
- Confirmed the replacement endpoint and Apps Script library version 6.

## Universal notation tests

Tested arbitrary die sizes, keep/drop, exploding dice, compound explosions, rerolls, success/failure counting, Fate dice, percentile dice, d66, d666, arithmetic, parentheses, target comparison, and repeated expressions.

Representative expressions:

- `1d37+4`
- `4d6kh3`
- `8d10!cs>=8`
- `4dF+3`
- `d100`
- `d66`
- `d666`
- `repeat 6: 4d6kh3`
- `2d20r<5kh1+2`
- `2*(1d8+3)`
- `6d6dl2`
- `1d6!!`
- `10d6cs>=5cf=1`

## Integrity checks

- Every supplied system JSON file matches the corresponding uploaded source byte-for-byte.
- All JSON files parse successfully.
- All external and inline JavaScript passes syntax validation.
- All local file references resolve.
- World page content remains unchanged.
- TTRPG Server remains a placeholder; only its shared backend/library identifiers were updated.
