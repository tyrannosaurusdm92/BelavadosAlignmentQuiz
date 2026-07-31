# TableGate Campaign Studio v6 — Source and License Audit

Date: 2026-07-29

## Classification policy

Every reviewed source is classified as one of:

- **Integrated** — identifiable code, assets, or project material is distributed with TableGate. The relevant notices and source locations are named.
- **Reference** — the source informed workflow or interface design, but its code and authored tables/content were not copied.
- **Excluded** — reviewed but not used in runtime.

The in-program **Data & Sources** workspace displays the same distinctions from `json/tablegate/provenance/source-provenance.json`.

## Upgraded character sheets

The embedded sheet library was rebuilt from the user-supplied **TTRPG Character Sheet Collection — Complete Options + Homebrew Engine** archive. It replaces the prior sheet set for all nine supported systems. The build preserves:

- complete-option and homebrew-entry helpers provided by the upgraded sheets;
- campaign/user/character storage namespaces;
- the session roll bridge for attacks, initiative, skills, saves, checks, moves, damage, and healing;
- sheet-local stat generation and randomization;
- the repaired responsive hamburger menu and jump navigation.

Files: `js/players/character-sheets/character-sheet-library.js`, `json/tablegate/systems/references/**`, `docs/character-sheets-v6/**`.

## Attached helper repositories

### Tetra-cube

Classification: **Reference only**.

The attached archive contains several D&D browser utilities. No clear top-level blanket redistribution license was found. TableGate does not copy its code or data. It is listed as a helper users can inspect independently.

### Attached donjon conversion

Classification: **Reference only**.

The attached README describes a C++ conversion of donjon's Random Dungeon Generator and identifies Creative Commons Attribution-NonCommercial 3.0. TableGate does not copy that conversion. The original donjon site remains linked as an external helper.

### Auto Roll Tables

Classification: **Reference only**.

The attached README credits dangeratio and community-authored content from Reddit communities. Because the repository does not establish one clear blanket license for every table, TableGate does not redistribute its table text. The new Encounter Lab includes independently authored system-neutral starter tables.

## Websites supplied by the user

### Family Echo

Classification: **Reference/link only**.

TableGate uses an independently written campaign relationship web with explicit person records, directed relationships, public/private notes, and JSON import/export. No Family Echo code, graphics, or data is included.

### Fantasy Name Generators

Classification: **External link only**.

TableGate's Name Lab uses user-editable local syllable lists. No Fantasy Name Generators code, lists, or site content is bundled.

### GamblingNews D&D gambling-games article

Classification: **Reference/link only**.

TableGate includes original simplified fictional tavern dice helpers. It does not reproduce article text and does not provide real-money wagering.

## Additional random encounter and roll-table research

- Garbata Random Table Generator — MIT; workflow reference for lightweight weighted tables.
- SimpliJessi RandomEncounterGenerator — reference for party/environment/danger inputs; no standard license verified, so no code/data copied.
- Chartopia — external roll-table platform, linked only.
- donjon — external generator collection, linked only.

## Original v6 implementations

- `js/admins/encounters/encounter-lab.js` — campaign-scoped weighted tables, encounter prompts, history, JSON import/export, and Creator Area publication records.
- `js/admins/campaign/campaign-helpers.js` — campaign relationship graph, local name generator, fictional tavern dice helpers, JSON import/export, and publication records.
- `js/tablegate/integrations/v6-integrations.js` — workspace routing, campaign permission gates, creator inventory integration, and public-snapshot filtering.
- `css/tablegate/helpers/v6-helpers.css` — responsive presentation for the v6 helper workspaces.

## Backend

Active runtime configuration uses only:

- Web app: `https://script.google.com/macros/s/AKfycbylmceRVx5UcgMvMDkwym_9h0wv8gM5B9Msuui7-7Z6lqoYlqZBR6Y47hmsauQgoGXY/exec`
- Library ID: `18ET55A9uVNx3IUzoAM_eRj8v7jqagPgjVdxil3P1SoUqrFnnAJp6CjVr`
- Library version: `5`

New v6 helpers are local-first. Optional backend synchronization requires matching server actions in the deployed Apps Script project.
