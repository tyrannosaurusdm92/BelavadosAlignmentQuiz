# Frontend and Backend Parity v9

Created By William Saville AKA The Transgender T-Rex #TheTransgenderTrex developer of Belavadös Galaxy TTRPG System

This map records the frontend surfaces connected to backend action groups. Exact action availability remains authoritative to the deployed Apps Script service.

| Backend group | Frontend support |
| --- | --- |
| Health and configuration | boot health check, feature flags, upload limits, registration policy |
| Account lifecycle | register, sign in, sign out, session restore, show password, forgot/reset password |
| Campaigns | list, create, select, update, invite, join, leave, members, roles, permissions |
| Channels | text, announcement, voice and dice-log channels; creation, editing, deletion and selection |
| Messaging | channel and direct messages, edits, deletion, reactions, replies, attachments, pagination, search |
| Social and safety | friendship workflow, direct-message policy, blocks, reports, moderation review |
| Notifications | unread counts, notification center, mark read, clear, rail badge |
| Presence and voice | presence, voice rooms, signaling, microphone, camera, screen controls |
| Dice | chat dice, audited results, history, replacement 3D Session Dice, nine-system resolution, completed-sheet transfer, user roll colors, shared participant/admin popups, and private runner rolls |
| Organizer | tasks, assignments, statuses, calendar, availability, approvals and campaign schedule |
| Rules and files | upload/download, system documents, rule notes, search and grounded reference view |
| Characters | campaign policy, ownership, consent, create/import/export, copy/transfer, active session character |
| Creator publishing | private inventory, player-safe snapshot, publish/unpublish, locked campaign destination |
| World and VTT | world articles, maps, tokens, handouts, initiative, encounters and campaign-scoped state |
| NPC Lives | people, locations, relationships, routines, travel and living-world records |
| Campaign Hub | hierarchy state, shared maps, upload, download and removal |
| Effects Studio | project synchronization, artwork/map exports and local project continuity |
| Data portability | campaign-scoped mirrors, JSON exports, imports, ZIP creation and restore paths |

## Permission behavior

Campaign-runner titles are equivalent presentation choices over one permission gate. Player views never expose runner-only records. Chat dice, private dice, map publication, creator publishing, moderation, role management, and tutorial administration validate the active user and campaign.

Public Session Dice calls `rollDice`, creates one structured `sendMessage` audit event, and optionally requests `broadcastDiceRoll`. Clients recover the same result during normal message polling, so bot narration and 3D display do not produce a second roll. `updateProfile` receives the selected dice color when that optional profile field is supported.

## Local fallback boundary

Optional extension actions may use a labeled campaign-scoped browser mirror after an unsupported-action or network failure. Core identity, campaign membership, permissions, messages, reports, moderation, and server-authenticated records do not silently become local-only substitutes.
