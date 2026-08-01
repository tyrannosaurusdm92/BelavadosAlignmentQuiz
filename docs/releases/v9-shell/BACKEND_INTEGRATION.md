# Backend Integration

## Source of truth

The shell was mapped directly against `tablegate_backend_v8(2)(1).gs`. The existing backend remains unchanged and is not duplicated in this package.

The frontend connection lives in `js/config.js` and `js/api.js`.

```js
BACKEND_URL: 'https://script.google.com/macros/s/AKfycbyTmuPyMg0ueiWAJSEpcrvXlkykD5g4Qo1cb0ybM1WDoTLAW43QG-6mvElxsWFVjx-vpg/exec'
BACKEND_LIBRARY_ID: '18ET55A9uVNx3IUzoAM_eRj8v7jqagPgjVdxil3P1SoUqrFnnAJp6CjVr'
BACKEND_LIBRARY_VERSION: '8'
API_VERSION: '8.0.0-final'
```

## Request contract

`TableGateApi.request()` sends:

```http
POST <Apps Script web-app URL>
Content-Type: text/plain;charset=utf-8
```

```json
{
  "action": "listMessages",
  "token": "session-token",
  "scopeType": "CHANNEL",
  "scopeId": "channel-id",
  "limit": 50
}
```

The backend returns HTTP-success JSON envelopes:

```json
{
  "ok": true,
  "data": {}
}
```

or:

```json
{
  "ok": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": null
  }
}
```

The API client converts backend errors, invalid JSON, timeouts, and network failures into consistent `ApiError` objects.

## Shell route coverage

The interface uses the supplied route names rather than inventing parallel frontend-only endpoints.

### Account and session

- `health`
- `register`
- `login`
- `forgotPassword`
- `logout`
- `me`
- `updateProfile`
- `setPresence`
- `pollEvents`

### TableGate discovery, creation, and joining

- `listTablegates`
- `discoverTablegates`
- `browsePublicTablegates`
- `createTablegate`
- `getTablegate`
- `updateTablegate`
- `joinPublicTablegate`
- `requestTablegateJoin`
- `listTablegateJoinRequests`
- `respondTablegateJoinRequest`
- `previewInvite`
- `createInvite`
- `joinInvite`
- `leaveTablegate`

### Role and membership separation

- `listMembers`
- `listRoles`
- `updateMember`
- `requestPlayerApproval`
- `listPlayerApplications`
- `respondPlayerApplication`
- `approvePlayer`
- `revokePlayer`
- `kickMember`
- `banMember`

### Categories and channels

- `listCategories`
- `createCategory`
- `listChannels`
- `createChannel`
- `updateChannel`
- `deleteChannel`

### Messaging

- `listMessages`
- `sendMessage`
- `editMessage`
- `deleteMessage`
- `searchMessages`
- `addReaction`
- `removeReaction`
- `startTyping`
- `listTyping`
- `markRead`
- `unreadCounts`
- `uploadAttachment`
- `downloadAttachment`

### Direct messages and social graph

- `listDms`
- `getDm`
- `createDm`
- `createGroupDm`
- `searchUsers`
- `listFriends`
- `sendFriendRequest`
- `acceptFriend`
- `declineFriend`
- `blockUser`
- `unblockUser`
- `listSafety`
- `listNotifications`
- `markNotificationRead`

### Group Finder and local-public discovery

- `createGroupFinderPost`
- `searchGroupFinderPosts`
- `getGroupFinderRecommendations`
- `expressGroupFinderInterest`
- `listGroupFinderInterests`
- `respondGroupFinderInterest`
- `hideDiscoveryItem`
- `createPublicLocation`
- `listPublicLocations`

### Safety

- `getSafetyReportingInfo`
- `reportUserSafety`
- `reportSafetyObject`
- `listMySafetyReports`

The complete extracted social/safety route inventory is in `json/backend_social_api_manifest.json`.

## Event polling

The shell calls `pollEvents` every 4.5 seconds while authenticated, visible, and online. It supplies the active TableGate, channel, and DM IDs and refreshes messages or sidebar data only when relevant events arrive. This avoids pretending that the Apps Script backend provides a permanent WebSocket connection.

## Production validation boundary

The included automated browser test uses `DemoApi` so it cannot write to live user or group data. The supplied backend source was used to verify route names, payload fields, permissions, and response shapes. A final deployment test should sign in with a non-production test account and exercise read/write routes against the actual Apps Script deployment.
