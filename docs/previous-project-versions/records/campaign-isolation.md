# Campaign Isolation and Publishing Contract

1. The active campaign server ID is the only allowed publication destination.
2. The interface never offers a cross-server destination menu.
3. All selected keys are cleared before and after a server switch.
4. Creator Forge storage key: `tablegate.unified.v8.<serverId>`.
5. Unified Portal storage keys: `tablegate.portal.data.v1.<serverId>` and `tablegate.portal.session.v1.<serverId>`.
6. Standalone sheets prefix every local-storage key with campaign and sheet IDs.
7. Published snapshots contain a `serverId`; the Player Area filters strictly by the current server.
8. Backend publish calls send identical `serverId` and `targetServerId` values.
9. Private NPC fields, secrets, conversations, and dialogue memory are omitted from generic published snapshots.
10. Imports from Forge and Portal are private by default and must be sent separately.
