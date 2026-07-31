# Hierarchical Map Foundry and NPC Lives

## Map Foundry

The browser-native generator creates a parent-child hierarchy:

`world → continent → country → kingdom/realm → settlement`

Each map is campaign-scoped and reproducible from a seed. The module exports SVG and GeoJSON. World and regional scopes generate landmasses, terrain/biome regions, borders and labels; settlements generate wards, roads, buildings and civic features.

The Markov-style name-chain and parts of the settlement-topology approach are adapted and rewritten from TownGeneratorOS. The module is marked GPL-3.0-or-later, the upstream GPL license is included, and the supplied TownGeneratorOS source snapshot is retained under `docs/source-code/TownGeneratorOS/Source`.

Azgaar Fantasy Map Generator and Red Blob Games mapgen2 informed workflow and algorithmic research only. No code from those projects is copied into the runtime.

## NPC Lives

NPC Lives is an independent campaign-scoped social simulation. Generated adult residents include:

- Traits, values, goals, fears, rumors, secrets, hobbies, professions and workplaces.
- A 24-hour schedule with current activity/location.
- Professional, friendship, personal, chosen-family/family-like and romantic relationships.
- Trust, tension and relationship history.
- Settlement events and personal memories as time advances.
- Queer orientations, chosen family, consensual non-monogamy, relationship anarchy and polyamory as ordinary possible parts of the social graph rather than special/negative conditions.

The design was informed by general settlement-simulation research including Neighborly. No Neighborly code was copied.
