# TableGate Character Sheet Bridge — Version 1

Every character sheet exposes the same self-contained integration surface through `window.TableGateCharacterSheet`. This is intentionally a **sheet intelligence bridge, not a second dice roller**. The future multisystem portal supplies physical/random dice results; the loaded sheet supplies character data, exact modifiers, tracked resources, system rules, totals, outcome interpretation, and updated state.

## Browser API

- `version` — bridge version.
- `system` — system identifier and display name.
- `getSnapshot(full = true)` — returns the complete `tablegate.character-sheet.v1` snapshot.
- `getRollRequest()` — returns the current system-specific roll contract without rolling dice.
- `applyRollResult(payload)` — accepts portal dice results and returns the resolved total/outcome.
- `setPortalMode(enabled)` — visually marks the sheet as portal-driven and de-emphasizes its pre-existing roll controls.
- `subscribe(callback)` — receives state-change snapshots; returns an unsubscribe function.
- `recalculate()` — forces derived values, audits, progression prompts, currency totals, and bridge data to refresh.

## Window messages

The parent portal and sheet iframe can exchange these messages:

| Direction | Message | Purpose |
|---|---|---|
| Sheet → parent | `TABLEGATE_SHEET_READY` | Announces that the sheet and bridge are ready. |
| Sheet → parent | `TABLEGATE_SHEET_STATE_CHANGED` | Sends a lightweight state snapshot after edits. |
| Parent → sheet | `TABLEGATE_GET_SHEET_STATE` | Requests the complete saved character snapshot. |
| Sheet → parent | `TABLEGATE_SHEET_STATE` | Returns the complete snapshot and matching `requestId`. |
| Parent → sheet | `TABLEGATE_GET_ROLL_REQUEST` | Requests the current action/roll contract. |
| Sheet → parent | `TABLEGATE_ROLL_REQUEST` | Returns dice notation, modifiers, targets, and system context. |
| Parent → sheet | `TABLEGATE_APPLY_ROLL_RESULT` | Supplies the portal’s actual dice results. |
| Sheet → parent | `TABLEGATE_ROLL_RESOLVED` | Returns totals, margins/shifts/degrees/raises/outcome as appropriate. |
| Parent → sheet | `TABLEGATE_SET_PORTAL_MODE` | Enables or disables portal-driven presentation. |
| Parent → sheet | `TABLEGATE_IMPORT_CHARACTER` | Imports a compatible full character state. |
| Sheet → parent | `TABLEGATE_ERROR` | Reports an import or bridge error. |

## Snapshot contract

The snapshot includes:

- schema and system identity;
- character name/profile and both artwork data URLs;
- system-derived outputs and tracked resources;
- complete automatic progression state and history;
- currency wallet, normalized total, and transaction history;
- current roll contract;
- complete editable sheet state when `full` is true;
- capability flags including `generates_dice: false`, `accepts_external_roll_results: true`, `automatic_math: true`, `progression_popups: true`, `currency_math: true`, `circle_crop_art: true`, and `border_textures: true`.

## System result interpretation

- Fate: totals, shifts, and four-outcome ladder.
- GURPS: roll-under success/failure and margin.
- Call of Cthulhu: Regular/Hard/Extreme/Critical/Fumble against chosen difficulty.
- Daggerheart: Hope/Fear total, critical pair, duality, and difficulty result.
- Pathfinder: total and four degrees of success with natural 20/1 step changes.
- PbtA: exact adapter bands and named outcomes.
- SWADE: Trait/Wild Die best result, target number, success, and raises.
- Blades: highest die, zero-die handling, critical, and action outcome.
- D&D: d20 total, optional DC comparison, level, and proficiency context.

The included `tablegate_character_sheet_bridge_v1.schema.json` provides a machine-readable starting point for portal integration.
