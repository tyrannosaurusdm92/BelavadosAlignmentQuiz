# Backend–Frontend Parity Audit v10

## Supplied backend preserved

`backend/tablegate_backend_v3.gs` is byte-identical to the uploaded backend. No route, storage table, permission, or handler was added to it.

## Route coverage

The backend route table contains 223 actions. `json/backend-route-catalog.json` records every action, handler, inferred parameters, authentication/write/destructive flags, source line, and a sample request. `js/backend-route-catalog.js` provides the same catalog to the frontend. The Backend Center renders and invokes all 223 actions through the normal `API.call` path.

## Legacy compatibility

The existing frontend used older server-oriented action names. `js/messenger-core.js` translates these without changing the backend:

- `listServers` → `listTablegates`
- `createServer` → `createTablegate`
- `getServer` → `getTablegate`
- `updateServer` → `updateTablegate`
- `deleteServer` → `deleteTablegate`
- `leaveServer` → `leaveTablegate`
- `requestPasswordReset` → `forgotPassword`
- `listOwnedCharacters` → `listCharacters`

Payload keys `serverId`, `targetServerId`, and `serverIds` are converted to `tablegateId`, `targetTablegateId`, and `tablegateIds`. Legacy UI response names are normalized only after the supplied backend responds.

## Existing-backend composition

Frontend concepts that do not have a dedicated v3 route are synchronized by composing routes already present in the supplied backend:

- Studio, Map Foundry, NPC Lives, Character Vault, organizer tasks, calendar items, rule notes, Campaign Hub state, and published-item state use `Projects` and chunked `ProjectItems`.
- Campaign Hub assets use `uploadAttachment`, `organizeAttachment`, `listAssets`, and `deleteAttachment`.
- Session dice broadcasting uses the existing `rollDice` route.
- Rules lookup uses `searchKnowledge`.
- System document compatibility resolves `listTablegateSystems`, then calls `createSystemDocument`/`listSystemDocuments` with the backend-required `systemId`.

Chunk sizes are kept below the backend JSON-cell and knowledge-content limits.

## Permission model

The frontend permission constants now mirror Backend V3’s bit assignments. The Backend Center intentionally lists routes a user may not be allowed to run; the backend’s permission checks remain authoritative and return errors normally.

## Verification limits

The live Apps Script deployment could not be reached from the isolated build environment. Contract tests therefore intercepted browser requests and returned response shapes derived from the supplied backend source. This verifies frontend behavior and request translation, but deployment-specific Apps Script/Drive permissions must still be smoke-tested after publishing.
