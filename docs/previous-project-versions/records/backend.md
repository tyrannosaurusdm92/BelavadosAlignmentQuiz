# Backend Configuration and Contract

Created By William Saville AKA The Transgender T-Rex #TheTransgenderTrex developer of Belavadös Galaxy TTRPG System

## Locked deployment

Web application:

`https://script.google.com/macros/s/AKfycbylmceRVx5UcgMvMDkwym_9h0wv8gM5B9Msuui7-7Z6lqoYlqZBR6Y47hmsauQgoGXY/exec`

Apps Script library:

`https://script.google.com/macros/library/d/18ET55A9uVNx3IUzoAM_eRj8v7jqagPgjVdxil3P1SoUqrFnnAJp6CjVr/6`

The endpoint and library version are defined in `js/messenger-core.js`, `json/app-config.json`, `json/deployment-lock.json`, and the embedded tool configurations.

## Transport

Requests use JSON and identify an `action` plus its payload. Authenticated calls include the current session token. Upload routes enforce the client-configured byte limit before encoding or transmission. The frontend treats server IDs, user IDs, channel IDs, message IDs, attachment IDs, notification IDs, and moderation IDs as opaque identifiers.

## Feature groups

- account registration, sign-in, sign-out, sessions, password reset, and client configuration
- campaign servers, invitations, roles, permissions, membership, channels, and moderation
- direct messages, friendships, blocking, reports, notifications, message search, edits, reactions, attachments, and unread state
- organizer tasks, calendars, availability, approvals, system documents, rule notes, and indexed reference search
- voice signaling, presence, and room state
- audited dice rolls, dice history, shared roll events, user roll colors, and private runner results
- campaign characters, ownership, policy, consent, transfers, copies, sheets, imports, and exports
- world/VTT state, creator publishing, encounters, maps, NPC lives, and helper records
- Campaign Hub state and assets
- Effects Studio project synchronization
- portable local mirrors for optional extension actions

See `FRONTEND_BACKEND_PARITY_v9.md` for the action-level frontend coverage.

## Failure behavior

Authentication, identity, messaging, permissions, and moderation errors are displayed to the user. Optional creator-tool state may retain a campaign-scoped browser mirror when an extension action is unavailable, but the interface never presents that local mirror as confirmed server persistence.

## Shared dice transport

The public session path calls `rollDice` without asking the backend to create a second automatic message. TableGate then posts one structured campaign-channel message containing the human-readable outcome and a hidden `TABLEGATE_ROLL` event payload. Other clients recover the same expression, authoritative die values, system interpretation, character, roller, and selected color when their normal message poll updates.

TableGate also requests `broadcastDiceRoll` for backend deployments that expose campaign-wide roll events and uses a same-origin `BroadcastChannel` relay for immediately synchronized tabs. The channel message remains the durable fallback and audit record. Private runner checks do not enter these shared paths unless the runner explicitly selects an admin channel.

Roll payloads include:

- campaign and channel opaque IDs
- roller and character opaque IDs plus display names
- one of the nine supported system IDs
- expression, raw die detail, requested 3D face results, and resolved system total
- rules outcome and short explanation
- the roller's validated six-digit color
- creation time and public/private state
