# TableGate Dossier Social Shell Merge Report

## Merge approach

The modular Integrated build was used as the runtime base. The richer Profile Merged build supplied the full personal profile, social posts, media, comments, reactions, game history, visibility modes, and profile design controls. The uploaded knowledge pack replaced the older embedded pack.

## Included product scope

- Account and profile shell
- Friends, posts, comments, reactions, direct messages, and notifications
- Public TableGate discovery and free group creation
- Visitor, Player, Moderator, Administrator, and protected Owner separation
- Group Finder, Right Now, compatibility, public anchors, venues, and events
- Applications, Interests, and pre-game contact controls
- Organizer and scheduling
- Read-only system reference library
- Blocking, anonymous reporting, authenticated reports, private incident journals, and central safety escalation

## Removed product scope

- Homebrew-system builder and backend system registration interface
- Campaign, world, encounter, map, NPC, rules, item, spell, class, race, module, and handout authoring suites
- Effects Studio, AI generation, image generation, simulation, and knowledge-ingestion tools
- Embedded backend source

## Backend handling

The supplied V8 backend was not changed. Its bytes matched the backend reference found in the Integrated source. The frontend preserves the supplied Apps Script web-app URL and library version 8.

## Validation

- JavaScript syntax checks
- JSON parsing
- Static dossier-scope test
- Browser smoke test for profile, group roles, channels, direct messages, Group Finder, safety reports, group creation, and responsive navigation
