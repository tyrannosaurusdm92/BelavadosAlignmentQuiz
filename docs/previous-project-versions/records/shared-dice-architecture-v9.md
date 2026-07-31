# Shared Dice and Character-Sheet Architecture

Created By William Saville AKA The Transgender T-Rex #TheTransgenderTrex developer of Belavadös Galaxy TTRPG System

## Session flow

1. The Character Vault returns the selected campaign-owned character with its current filled `state`, `sheetState`, appearance, ownership, campaign, and system.
2. `session-dice-integration.js` generates the completed sheet document and sends it with `TABLEGATE_SESSION_CONTEXT`.
3. The replacement board installs that document into `characterSheetIframe`.
4. Sheet roll buttons or bot text create `TABLEGATE_ROLL_REQUEST`.
5. The parent chooses the nine-system context, requests the backend roll, completes SWADE aces when needed, and resolves the result once.
6. The same roll event supplies exact 3D faces, the bot explanation, the local campaign log, the channel message, and the colored live popup.
7. Connected clients recover the event from campaign polling, an optional backend `broadcastDiceRoll` event, or the same-origin browser relay.

## Iframe boundaries

The board and completed sheet are nested:

- TableGate top-level application
- replacement Session Dice iframe
- completed character-sheet iframe
- transparent Three.js dice-renderer iframe

The Session Dice bridge forwards `TABLEGATE_SHEET_ROLL_REQUEST` and `TABLEGATE_SHEET_STATE` upward. TableGate sends `TABLEGATE_SHEET_STATE_UPDATE`, `TABLEGATE_SESSION_CONTEXT`, and `TABLEGATE_SESSION_ROLL` downward. Messages contain plain serializable records; no frame receives a session token.

## Color handling

The user chooses a six-digit roll color. TableGate:

- stores the choice per user
- offers it to `updateProfile`
- validates it before use
- computes dark or pale number ink from relative luminance
- builds a custom 3D material theme
- colors both the nested result and global participant popup
- embeds the color in the durable shared roll event

## Permission behavior

Player public rolls require a selected campaign channel for durable sharing. Without one, the result remains a local session-log event and the interface says so. Private Dice is restricted to the common campaign-runner permission gate shared by DM, GM, MOL, Master of Lore, Storyteller, Keeper, Referee, and equivalent campaign runners. A private result is broadcast only when the runner deliberately chooses an admin channel.

## Failure handling

- backend roll failure: cryptographic local fallback with an explicit console warning
- channel-message failure: local animation/log remains and an error toast states that sharing failed
- WebGL failure: textual result and popup remain valid
- missing selected character: Session directs the user to Character Sheets
- missing optional `broadcastDiceRoll`: the durable channel marker and normal message poll remain active
