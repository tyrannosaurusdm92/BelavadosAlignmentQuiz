# Universal Character Import and Cross-System Porting — v7

TableGate v7 accepts character uploads from the Character Vault and from every embedded character sheet. Supported inputs are JSON, TXT, DOCX, and PDF.

## Import pipeline

1. Read the source file locally in the browser.
2. Detect a native TableGate sheet schema when possible.
3. Convert the source into `tablegate.canonical-character.v2`.
4. Display detected identity, ancestry, classes, level, skills, features, and items.
5. Convert the canonical record into the selected target system.
6. Display all required substitutions before saving.
7. Save the target sheet state and a private import audit inside the active campaign's character record.

Same-system JSON imports preserve the complete original native sheet state. Cross-system imports preserve the original source structure under `importAudit.unmapped` so information that has no direct mechanical equivalent is not silently discarded.

## Document support

- **JSON:** Native TableGate exports, the supplied D&D complete-character schema, and generic JSON with common character-field names.
- **TXT:** Labeled records such as `Character Name:`, `Race:`, `Class:`, `Strength:`, `Skills:`, and `Equipment:`.
- **DOCX:** Local text extraction using the Mammoth browser dependency already present in the supplied project.
- **PDF:** Local extraction of AcroForm values and text operators, including common Flate and ASCII85-compressed streams.

Scanned, image-only, encrypted, or unusually encoded PDFs are still accepted, but they are flagged for manual review when no usable text is available. The importer does not invent data that it cannot read.

## D&D to Pathfinder helper policy

The Pathfinder adapter validates ancestry, versatile heritage, class, skill, and feat helpers against the Pathfinder reference catalogs bundled with TableGate. Example translations include Harengon to Human with Beastkin heritage and Artificer to Inventor. Multiclass components become archetype suggestions. Unsupported feats remain visible as replacement-review entries rather than being silently dropped.

These are editable helpers, not binding rulings. Campaign runners remain responsible for source access, prerequisites, rarity, variant rules, and campaign-specific legality.
