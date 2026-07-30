# Source Merge Audit

## Inputs

1. TableGate messenger and organizer package
2. TableGate Character Token Studio
3. Multi-system TTRPG reference corpus

## Merge decisions

- The messenger remains the authenticated campaign shell.
- The character portal is a native workspace in the same document, opened from the campaign rail.
- The former TTRPG server placeholder now routes back to the live messenger and organizer.
- The messenger account automatically becomes the local-first TableGate player profile.
- Character sheets remain system-native and are embedded as generated `srcdoc` documents; there are no additional physical HTML files.
- Duplicate reference JSON files from the separate corpus were deduplicated against the Character Token Studio copies.
- Nested source ZIP archives were not retained in the runtime package.
- Dice designs, audio, token borders, bot tokens, campaign banners, and PWA icons were retained under `assets`.
- The previous backend URLs and library versions were removed from active configuration and documentation.

## Integrated systems

- Fate Core
- GURPS Fourth Edition
- Call of Cthulhu Seventh Edition
- Daggerheart
- Pathfinder Second Edition Remastered
- Powered by the Apocalypse
- Savage Worlds Adventure Edition
- Blades in the Dark
- Dungeons & Dragons 5e / 5.5e

## Dice-routing enforcement

- Ordinary campaign, session, character-sheet, and rules-assistant rolls enter the shared central 3D dice area.
- The legacy messenger dice modal and direct `rollDice` client call were removed.
- The backend rejects ordinary `rollDice` requests with `USE_TABLEGATE_3D`.
- Completed 3D rolls are stored and posted through `record3dDiceRoll` for the campaign audit trail.
- A separate `rollPrivateDice` action is limited to the campaign creator or authorized administrators inside a direct message whose participants are all administrators for the selected campaign.
- Character-creation stat generation and explicitly allowed stat rerolls remain within native character creation sheets rather than session play.
