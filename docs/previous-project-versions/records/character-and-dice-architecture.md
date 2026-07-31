# Character ownership and dice-on-sheet architecture

## Campaign boundary

Character data is keyed by the active campaign server ID. Every record carries `serverId`, `ownerId`, `sheetId`, state, appearance, and timestamps. Changing servers loads a different vault and clears transient session selection.

## Ownership and campaign-runner discretion

Players see and operate only character records they own in the active campaign. DM, GM, MOL, Master of Lore, Storyteller, Keeper, Referee, and equivalent creator roles use the same permission gate and can inspect or manage the whole campaign vault.

The policy model supports:

- `defaultLimit: 0` for unlimited characters, or any positive campaign-wide cap.
- Per-player overrides.
- Independent switches for player creation and import.
- Runner-created or reassigned records.

Local storage is the offline mirror. The application also attempts `saveCampaignCharacterVault` and `listOwnedCharacters` backend routes; a backend that does not expose these routes leaves the local campaign mirror functional.

## Session composition

The live session is one visual play surface:

1. The selected character sheet fills the table.
2. A transparent 3D dice renderer is layered above it.
3. The player can switch among all characters they own in this campaign through the session dropdown.
4. Sheet controls for attacks, initiative, skills, saves, checks, moves, and other play rolls emit `TABLEGATE_SHEET_ROLL_REQUEST`.
5. Stat/ability generation and randomization controls are explicitly excluded and continue running inside the sheet.
6. The parent resolves the expression, requests a backend auditable roll when a public text channel is active, and supplies exact results to the 3D renderer.
7. Sheet state changes emit `TABLEGATE_SHEET_STATE` and are saved back to the selected owned record.

## Public and private dice

Public session rolls use the shared sheet area for players and campaign runners. When a text channel is active the app attempts the existing `rollDice` backend route with `postMessage: true`; otherwise a cryptographically seeded local fallback is logged.

Private runner rolls use the separate Private Dice Bot workspace. They remain in a campaign-scoped private browser log unless the runner deliberately chooses an admin channel.

## Physical files

No extra HTML file is distributed. Both sheet and dice documents are constructed with `iframe.srcdoc`; `tablegate.html` remains the sole physical HTML entry point.
