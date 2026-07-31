# Third-Party Notices

TableGate Unified Campaign Workspace v9 is an integration project assembled by William Saville AKA The Transgender T-Rex. This notice distinguishes material incorporated into the distributed application from material reviewed only as an upstream reference.

## Incorporated or adapted

- **TownGeneratorOS** — portions of TableGate's hierarchical naming, seeded settlement/world structure, and generator organization were independently rewritten and adapted with the supplied TownGeneratorOS project as a source. TownGeneratorOS is distributed under **GPL-3.0**. TableGate's corresponding Map Foundry source is identified as GPL-3.0-or-later, and a reconstructable source snapshot plus the complete license are included under `docs/source-code/TownGeneratorOS/` and `docs/licenses/TownGeneratorOS_GPL-3.0.txt`.
- **JSZip 3.10.1** — used under the MIT license option for browser-side package import/export.
- **three.js / cannon.js / Teal dice lineage** — included through the supplied multi-system portal's 3D dice implementation. Their retained notices are collected in `docs/github/licenses/licenses-multi-system-portal-licenses.md`; the app's Data & Sources tab identifies the local files that use them.
- **Supplied TableGate projects, Effects Studio, Campaign Hub, Session Dice, icon family, and character-sheet collection** — merged and modified as project inputs supplied by the project owner. The Data & Sources and Docs views identify their local contribution paths, audits, notices, and current release hashes.

## Algorithm and design references; no upstream code copied

- **Azgaar's Fantasy Map Generator** — reviewed as a reference for hierarchical fantasy-map workflows. MIT license retained in `docs/github/licenses/licenses-azgaar-fmg-mit.txt`.
- **Red Blob Games mapgen2** — reviewed as a reference for procedural terrain concepts. Apache-2.0 license retained in `docs/github/licenses/licenses-redblob-mapgen2-apache-2-0.txt`.
- **Neighborly** — reviewed as a reference for life-simulation relationship and scheduling concepts. MIT license retained in `docs/github/licenses/licenses-neighborly-mit.txt`. No source from this archived project is bundled into the runtime.
- **Fantasia Archive** — reviewed for worldbuilding archive organization. GPL-3.0 license retained; no Fantasia code was copied.
- **Obsidian TTRPG Share, WWN Markdown, SWN Markdown, plugin watcher, MythKeeper, and Template Share** — reviewed for templates, interoperability, or organization. Their license/readme status is recorded in the source audit. Restricted game text and unlicensed code are not redistributed.

## Attribution and responsibility

The in-app **Data & Sources** view is the human-readable provenance index backed by `json/tablegate/provenance/source-provenance.json`. The **Docs** view exposes current merge evidence, release hashes, package assignments, licenses, notices, source READMEs, source-code notices, and historical audits. Superseded executable archives are not shipped inside the active project.

Upstream names and trademarks remain the property of their respective owners. Inclusion of a source reference does not imply endorsement. Before public or commercial redistribution, review every retained license and confirm rights for supplied artwork, tokens, audio, fonts, and campaign assets.

## TableGate v6 helper references

TableGate v6 adds original encounter, roll-table, relationship, name, and fictional tavern-game modules. Tetra-cube, the attached donjon conversion, Auto Roll Tables, Family Echo, Fantasy Name Generators, GamblingNews, Garbata Random Table Generator, SimpliJessi RandomEncounterGenerator, Chartopia, and donjon are classified individually in `json/tablegate/provenance/source-provenance.json`. Unless explicitly marked integrated there, their code and authored content are not redistributed.

## TableGate v7 document import

TableGate v7 reuses the Mammoth browser file already present in the supplied Creator Forge / LifeSimulator source to extract text from DOCX uploads. The copy at `js/tablegate/vendor/mammoth-browser-min.js` is byte-identical to the supplied dependency. Retain the Mammoth upstream license and notices when redistributing it. PDF parsing and all canonical character conversion code in `js/players/character-import/universal-character-import.js` are TableGate integration code written for this release; no third-party PDF parser is bundled.
