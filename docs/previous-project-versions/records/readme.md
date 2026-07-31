# TableGate Documentation

## Current release: 10.0.0

- [Release Readme](RELEASE_README_v10.md)
- [Backend–Frontend Parity](BACKEND_FRONTEND_PARITY_v10.md)
- [Knowledge Pack Integration](KNOWLEDGE_PACK_INTEGRATION_v10.md)
- [Test Report](TEST_REPORT_v10.md)
- [Source and Copy Audit](SOURCE_AND_COPY_AUDIT_v10.md)
- [Licenses and Provenance](LICENSES_AND_PROVENANCE_v10.md)
- [GitHub Release Guide](GITHUB_RELEASE_GUIDE_v10.md)
- [Multipart Package Instructions](PARTS_README_v10.md)

---

# TableGate Unified Campaign Workspace v9

Created By William Saville AKA The Transgender T-Rex #TheTransgenderTrex developer of Belavadös Galaxy TTRPG System

TableGate is a browser-based, multi-system campaign platform that combines campaign servers, messaging, voice and video controls, scheduling, worldbuilding, living NPCs, linked lore, character ownership, system-aware character sheets, shared 3D dice, maps, tokens, initiative, encounters, artwork tools, handouts, tutorials, publishing controls, and source documentation.

The shared Session Dice board supports Fate Core, GURPS Fourth Edition, Call of Cthulhu Seventh Edition, Daggerheart, Pathfinder Second Edition Remastered, Powered by the Apocalypse, Savage Worlds Adventure Edition, Blades in the Dark, and D&D 5e / 5.5e. A player's completed saved sheet is loaded inside the board during play. Public results are resolved once, posted through the selected campaign channel, and animated for connected session participants with the roller's chosen color.

## Start

1. Reconstruct the `TableGate/` folder by extracting every numbered release ZIP into the same destination.
2. Serve the folder from a static HTTPS host. Localhost may be used for development.
3. Open `TableGate.html`.

`TableGate.html` is the only physical HTML file. Tool documents, character sheets, Creator Forge, Effects Studio, Campaign Hub, Paint by Number, and Session Dice are generated into JavaScript documents and opened inside isolated frames. Their supporting CSS, JavaScript, images, audio, JSON, fonts, and documentation remain normal project assets.

## Campaign-runner access

DM, GM, MOL, Master of Lore, Storyteller, Keeper, Referee, and equivalent campaign-runner titles share the same permission gate. A selected title changes presentation only. No title receives privileged behavior over another.

Campaign-runner creation tools include:

- Campaign Runner Creator Area
- Effects Studio
- Campaign Hub
- Creator Forge
- World Studio
- Map Foundry
- NPC Lives
- Encounter Lab
- Campaign Helpers
- Virtual Tabletop
- Private Dice
- nine-system public Session Dice
- tool-specific tutorials

Effects Studio retains its complete established editor layout and styling inside its campaign-runner workspace.

## Players and publishing

Preparation remains private until a campaign runner selects exact records and confirms the active campaign destination. Player views contain only material published to that campaign. Character ownership, campaign isolation, consent checks, private dice, moderation, and audit records are enforced separately.

## Backend

Web application:

`https://script.google.com/macros/s/AKfycbylmceRVx5UcgMvMDkwym_9h0wv8gM5B9Msuui7-7Z6lqoYlqZBR6Y47hmsauQgoGXY/exec`

Apps Script library:

`https://script.google.com/macros/library/d/18ET55A9uVNx3IUzoAM_eRj8v7jqagPgjVdxil3P1SoUqrFnnAJp6CjVr/6`

The main application, Campaign Hub, Effects Studio, Session Dice, embedded creator tools, manifests, and deployment lock use this deployment and library version.

## Documentation and licensing

Open **Docs** inside TableGate for the current README, backend contract, merge audit, frontend/backend parity map, test report, package manifest, tutorials, licenses, provenance catalog, historical audits, retained source notices, and third-party notices.

The **Data & Sources** view renders the machine-readable provenance catalog from `json/source-provenance.json`. Current release records are in:

- `MERGE_AUDIT_v9.md`
- `FRONTEND_BACKEND_PARITY_v9.md`
- `LICENSE_AND_PROVENANCE_v9.md`
- `TEST_REPORT_v9.md`
- `DICE_SYSTEMS_v9.md`
- `SHARED_DICE_ARCHITECTURE_v9.md`
- `BROWSER_QA_REPORT_v9.md`
- `PACKAGE_MANIFEST_v9.json`
- `THIRD_PARTY_NOTICES.md`
- `licenses/`

Historical records remain documentation only. Superseded executable archives and old release ZIPs are not runtime dependencies and are not shipped inside the unified project.

## Validation and manifests for 10.0.0

- `audits/AUTOMATED_TEST_REPORT_v10.json`
- `audits/BROWSER_CONTRACT_TEST_v10.json`
- `audits/BACKEND_ROUTE_COVERAGE_v10.json`
- `audits/KNOWLEDGE_PACK_AUDIT_v10.json`
- `manifests/FILE_MANIFEST_v10.json`
- `manifests/CODE_USAGE_MANIFEST_v10.json`
- `PACKAGE_MANIFEST_v10.json`
