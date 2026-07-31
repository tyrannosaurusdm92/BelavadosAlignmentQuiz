# Rules-System Switching

## Project default

Choose a **Rules system** and **Edition / implementation** on the Project page. This becomes the default profile for newly generated entities. Changing it does not delete or rewrite existing entities.

## Per-entity rules profile

The People & Entities generator can override the project default. Its labels and option lists change to match the selected system:

- D&D and Pathfinder expose species/ancestry, heritage options, classes, subclasses, and skills where present in the attached references.
- Daggerheart exposes ancestry, community, class, subclass, and domain vocabulary.
- Blades in the Dark exposes heritage, background, playbook, and crew type.
- Call of Cthulhu exposes investigator identity, occupation, and skills.
- Fate Core exposes nature/identity, high concept or archetype, trouble/aspect space, and skills.
- GURPS exposes species/racial-template space, archetypes/templates, lenses, and skills.
- Powered by the Apocalypse exposes game-defined identity, playbook patterns, and background/community space.
- Savage Worlds exposes ancestry, archetype/build, setting options, Edges, and skills.

Systems that intentionally do not prescribe species or classes use neutral campaign-defined choices instead of inventing mandatory mechanics.

## TableGate body forms

The TableGate body-form registry is a separate visual and simulation layer. It can represent humanoids, creatures, constructs, artificial beings, aliens, mixed heritages, or custom forms regardless of the chosen rules system. A Fate synthetic diplomat, GURPS machine, Daggerheart character, or Call of Cthulhu investigator can therefore use any suitable visual form without changing the source system's rules vocabulary.

## Stored data

Each generated entity stores `systemProfile`, including system and edition IDs, display labels, ancestry/species, heritage, role, specialization, background, and selected abilities. Dialogue, search, descriptions, and simulation cards read this profile while remaining compatible with older LifeSimulator records.
