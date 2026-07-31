# TableGate v9 Merge Audit

Created By William Saville AKA The Transgender T-Rex #TheTransgenderTrex developer of Belavadös Galaxy TTRPG System

## Supplied inputs

The release was merged from:

- four `TableGate_Campaign_Studio_v8` archive parts
- three `TableGate_Integrated_Campaign_Workspace` archive parts
- the supplied TableGate icon package
- the supplied `roleplaying_board_site_iframe` replacement dice board

Every input ZIP passed path-traversal, symlink, and CRC checks before extraction.

## Merge baseline

Campaign Studio v8 supplied the broadest current application: campaign isolation, owned characters, Creator Forge, World Studio, virtual tabletop, Map Foundry, NPC Lives, encounter tools, helpers, provenance, consent, importing, and the large multi-system reference collection.

Integrated Campaign Workspace supplied the newer backend-parity layer, Campaign Hub, Effects Studio, Paint by Number, updated messenger behavior, current cyan-centered theme work, and the supplied icon family. The later supplied roleplaying-board package replaced the earlier Session Dice runtime.

The result is one solidified project. Newer implementations replaced older equivalents where behavior overlapped; distinct tools were integrated as first-class views.

## Single-entry architecture

`TableGate.html` is the only physical HTML file.

The following complete tool documents were converted into generated JavaScript strings with absolute-base injection and isolated iframe execution:

- Campaign Hub
- Effects Studio
- Paint by Number
- Session Dice

Creator Forge and character sheets were already document-bundled and remain embedded. Supporting assets stay in their project directories.

The replacement Session Dice document is embedded under the `sessionDice` key. Its Three.js/Cannon.js roller, sounds, 60 visual sets, and fourteen supplied bot tokens remain under `tools/session-dice/`. TableGate adds one shared nine-system rules engine and one iframe bridge instead of editing each bot separately.

## Effects Studio preservation

Effects Studio runs from its original document, CSS files, textures, assets, controls, canvas code, project system, procedural mapping, lighting, sound, animation, export, and Paint by Number bridge. The main TableGate theme does not cascade into the Effects Studio iframe. Only its containing TableGate toolbar uses the unified cyan-centered theme.

Effects Studio is placed in **Campaign Runner Creation Tools** and is available equally to DM, GM, MOL, Master of Lore, Storyteller, Keeper, Referee, and equivalent campaign runners.

## Backend merge

All active application configurations were migrated to:

`https://script.google.com/macros/s/AKfycbylmceRVx5UcgMvMDkwym_9h0wv8gM5B9Msuui7-7Z6lqoYlqZBR6Y47hmsauQgoGXY/exec`

Library version:

`https://script.google.com/macros/library/d/18ET55A9uVNx3IUzoAM_eRj8v7jqagPgjVdxil3P1SoUqrFnnAJp6CjVr/6`

The newer messenger core and backend-parity extension supply account recovery, notification, social, moderation, messaging, attachment, campaign, character, voice, and dice behaviors while retaining the v8 local-storage prefix for user continuity.

## Visual merge

The main application uses the supplied cyan-centered green–blue palette:

- cyan identity and primary action: `#00FFFF`
- success and confirm: `#32CD32`
- navigation and secondary action: `#1E90FF`
- dark background: `#001010`
- pale text: `#F2FFFF`
- dark text on bright controls: `#001010`

The supplied icon files are used by the main page, manifest, install metadata, rail home control, browser icon, and Apple/mobile metadata.

## Removed duplication

- old multipart source archives were removed from the active project
- duplicate tool HTML entry files were absorbed into generated documents
- the superseded integrated portal document was removed from the runtime bundle after its character and dice functions were represented by the current character vault and Session Dice; its non-executing reference tree is retained under `docs/source-code/unified-portal-runtime-reference/` for audit and licensing review
- the prior Session Dice portal and renderer are non-executing reference material under `docs/source-code/session-dice-prior-reference/` and `docs/source-code/legacy-dice-renderer-reference/`
- the supplied replacement board's pre-embedding source is retained as `docs/source-code/new-session-dice-source-reference/roleplaying_board.source.txt`; the executable copy is generated into `js/tool-documents.js`
- old exact backend and library-version references were replaced in active code
- UI copy that described implementation plumbing or styling labels instead of user-facing functions was removed

## Replacement dice integration

- every saved character record is serialized with its existing filled sheet state and installed into the board's character-sheet iframe
- nested sheet messages are forwarded through the board iframe to TableGate, and saved state updates return through the same bridge
- all nine system definitions drive expression inference, deterministic resolution, bot help, quick actions, and final explanations
- one public result is reused for the 3D requested faces, bot response, campaign log, channel record, and every participant popup
- user-selected colors persist locally, are offered to the profile backend, and tint the 3D dice theme plus shared popups

## Documentation retained

Licenses, provenance data, third-party notices, source READMEs, source-code notices, audits, historical validation records, current release reports, and manifests remain under `docs/` and are searchable from the in-app **Docs** view.
