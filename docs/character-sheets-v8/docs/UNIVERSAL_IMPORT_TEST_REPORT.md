# Universal Import and Cross-System Conversion — Validation Report

## Result

All **9 character sheets** passed the supplied D&D character conversion/render workflow without page-level runtime errors. JSON, TXT, DOCX, and text-bearing/fillable PDF upload paths were exercised through the visible importer interface. Mobile layout was checked at 390 × 844 CSS pixels.

## Reference-character regression

The reference export is treated as structured D&D data first. Its authoritative ancestry is **Harengon**, and its authoritative classes are **Armorer Artificer 5 / College of Glamour Bard 3**. Embedded guidance, history, alternate profiles, prose, and source notes cannot override those fields.

The D&D species control regression was reproduced and repaired. Changing the species to Elf now:

- updates the stored species to Elf;
- clears obsolete race write-in, subrace, and race-option values;
- rebuilds traits from the selected species;
- removes all Lorwyn Changeling residue from the visible summary and exported state.

## Format coverage

| Input | Result |
|---|---|
| Native JSON | Preserves native system state, then normalizes and recalculates |
| Arbitrary/nested JSON | Recursively extracts identity, ancestry, class, level, attributes, skills, features, spells, attacks, equipment, resources, languages, and notes |
| TXT | Parses common `Label: Value`, headings, lists, and narrative blocks |
| DOCX | Reads document text, tables, headers, footers, comments, footnotes, and endnotes from the OOXML package |
| Text-bearing PDF | Extracts common page-text streams and encoded strings |
| Fillable PDF | Extracts common AcroForm field names and values |
| Scanned/image-only PDF | Stops with a clear OCR-required message; it does not fabricate values |

## Cross-system policy

1. Import into a canonical, system-neutral character model.
2. Keep structured source fields authoritative over narrative mentions.
3. Match target choices against the target sheet's embedded legal catalog.
4. Convert incompatible concepts to the closest available target-system option when a defensible mapping exists.
5. Preserve unmatched material in notes and the conversion ledger instead of silently deleting it.
6. Mark choices that require prerequisites, owned-book verification, or DM/GM/MOL approval.
7. Provide a downloadable replacement/review report before or after applying the conversion.

## D&D → Pathfinder reference result

- Harengon → **Awakened Animal**
- Artificer → **Inventor**
- Custom magical-weapons-engineer background → **Artisan**
- Bard multiclass → **Bard Dedication**
- Level → **8**
- Spell names are retained, but flagged for Pathfinder class, tradition, rank, and owned-source verification.

The converter does not claim that two different systems have one-to-one mathematical equivalence. It produces a legal starting build, preserves source intent, recalculates with the destination sheet, and exposes every replacement or review item.

## Automated results

- Cross-system reference render: **9/9 passed**
- Browser runtime errors: **0**
- D&D race-change regression: **passed**
- D&D TXT/JSON/DOCX/PDF upload: **passed**
- Pathfinder TXT/JSON/DOCX/PDF upload: **passed**
- Arbitrary nested JSON extraction: **passed**
- Scanned PDF rejection: **passed**
- Mobile importer containment: **passed**
- JavaScript syntax across all nine sheets: **9/9 passed**
- Rendered duplicate DOM IDs: **0**
- Exactly one importer button and panel per sheet: **passed**

Machine-readable details are in `UNIVERSAL_IMPORT_VALIDATION.json`.

## Research references

- [D&D 5.2.1 SRD](https://www.dndbeyond.com/srd)
- [Pathfinder 2e Remastered character creation](https://2e.aonprd.com/Rules.aspx?ID=2027)
- [Daggerheart SRD](https://www.daggerheart.com/srd/)
- [Blades in the Dark character creation](https://bladesinthedark.com/character-creation)
- [Fate Core character creation SRD](https://fate-srd.com/fate-core/character-creation)
- [Call of Cthulhu Investigator Handbook wiki](https://cthulhuwiki.chaosium.com/investigators/)
- [Powered by the Apocalypse design guidance](https://lumpley.games/2019/12/30/powered-by-the-apocalypse-part-1/)
- [GURPS Basic Set: Characters index](https://www.sjgames.com/gurps/books/basic/characters.pdf)
- [Savage Worlds Adventure Edition system reference](https://peginc.com/swade-system-version-5-1/)

## Important scope boundary

A converter can determine that an option name exists in its bundled target catalog and can recalculate the destination sheet. It cannot automatically prove campaign legality for every proprietary supplement, optional subsystem, table ruling, third-party product, or homebrew rule. Those items remain visible and are labeled for DM/GM/MOL review rather than being hidden or falsely certified.
