# v7 Character Import and Selection Test Report

## Reference character

The supplied D&D complete-character JSON was used as the structured reference. Its imported state includes a Harengon ancestry, Artificer/Bard multiclass levels, separated ability-score components, skill ranks, attacks, spells, equipment, custom resources, and long-form character notes.

## Format tests

A matching fixture was imported through each supported format:

- JSON
- labeled TXT
- DOCX
- compressed text-based PDF using ASCII85 and Flate filters

Each format recovered the same identity, campaign, ancestry, classes, level, six ability scores, skills, feats, and equipment. Every recovered canonical record converted into all nine target sheet systems.

## Pathfinder legality helper test

The reference D&D character converted to Pathfinder with:

- Harengon → Human ancestry with Beastkin versatile heritage
- Artificer → Inventor
- Bard retained as a multiclass/archetype suggestion
- D&D ability scores converted to Pathfinder attribute modifiers
- unsupported feats preserved as explicit replacement-review entries

The import dialog saved the converted character into the active campaign vault and retained the source record and substitutions in the private import audit.

## Selection regression tests

All nine sheets were loaded in a headless Chromium browser and changed from one identity/class/playbook descriptor to a second value. Each sheet's stored state matched the final value.

The D&D-specific regression began with `race = Changeling` and `raceOption = Lorwyn Changeling`, changed the race control to `Harengon`, and verified:

- stored race: Harengon
- race write-in: empty
- race option: empty
- race-option write-in: empty
- visible race summary: Harengon
- visible race summary did not contain Lorwyn Changeling

## Structural tests

- One HTML file
- No `.bat` or `.cmd` files
- Only `assets`, `css`, `docs`, `js`, and `json` directories at project root
- All runtime JavaScript passed syntax parsing
- All JSON files parsed successfully
- All individual files remained below 24,000,000 bytes
- Runtime backend references resolved only to the requested Apps Script web app and library version 5
