# Universal Character Import and Cross-System Conversion

Version 3.0.0 adds a shared importer and conversion engine to all nine character sheets.

## Accepted inputs

- Native and arbitrary JSON
- Plain-text character records
- DOCX paragraphs, tables, headers, footers, comments, footnotes, and endnotes
- Text-bearing PDFs and common fillable PDF AcroForm fields

Image-only scanned PDFs require OCR before import. The importer reports that limitation rather than inventing values.

## Canonical import model

Every non-native document is normalized into a system-neutral character model containing identity, player/campaign data, ancestry/species, heritage, classes/playbooks/archetypes, background, level/rank/tier, attributes, skills/actions, feats/features/edges/advantages, spells/powers/moves, attacks/weapons, equipment, resources, languages, proficiencies, and narrative notes. Unmapped source information is retained for review.

## Conversion policy

1. Native structured fields are authoritative. Narrative notes are supplementary and cannot override race, ancestry, class, level, or statistics.
2. Same-system imports preserve the native state whenever possible.
3. Cross-system imports pass through the canonical intermediate model.
4. Target-system choices are checked against the catalog embedded in that sheet.
5. Nonmatching concepts are replaced only when a defensible legal target option exists; each replacement is recorded.
6. Material without a safe one-to-one replacement is preserved and flagged, not silently discarded.
7. Prerequisites, optional books, and campaign permissions remain subject to DM, GM, or MOL approval.
8. PbtA is treated as a family of designs, not a single universal rules catalog, so the adapter preserves concepts and marks game-specific move review.

## D&D race persistence repair

The D&D sheet now clears stale write-in and subrace values when race changes, verifies that the selected option actually exists after rebuilding the edition dropdown, converts missing imported options to an explicit write-in instead of allowing a browser-selected fallback, and uses only `character.profile.race` as the authoritative imported race. Descriptive guidance can no longer replace Harengon with Lorwyn Changeling.

## D&D custom class resilience

Unknown or DM-approved classes no longer crash the sheet. A safe generic class model is used, with a dedicated Artificer/Armorer compatibility profile for the supplied reference character.

## User workflow

1. Open the hamburger menu and choose **Import / Convert Character**.
2. Select a JSON, TXT, DOCX, or PDF file.
3. Review detected source data, replacements, and warnings.
4. Apply the conversion.
5. Let the target sheet recalculate.
6. Download the replacement/review report for the table record.
