# TableGate Frontend/Backend Repair

This patch repairs the authentication shell and updates the TableGate backend contract.

## Critical fixes
- Demo mode is session-scoped instead of permanently stored in localStorage.
- Signing out from demo mode explicitly returns the shell to backend mode and reconstructs the live API client.
- Main frontend backend URL is the requested deployment.
- TableGate Apps Script library target is version 10.
- Service-worker cache version is bumped so stale frontend code is invalidated.
- Registration no longer requires email verification.
- Email verification is required server-side before creating/joining TableGates, Group Finder posting/interest, and messaging.
- Optional email/phone 2FA challenge flow added; phone delivery requires the configured SMS webhook.
- Followers/following graph, counts, public profile URLs, notifications, and LIKE/LOVE/FAVORITE follow notification preference added.
- Existing friend graph remains intact.
- Shared Google Drive library access is exposed for authenticated TableGate users using the configured folder ID.

## Validation
- 85 non-vendor JavaScript files syntax-checked successfully.
- Root HTML local references checked: 8, missing: 0.
- Unified v9 audit: PASS.
- Frontend repair audit: PASS.
- Backend Apps Script source was syntax-checked by Node after copying to a temporary `.js` file.
