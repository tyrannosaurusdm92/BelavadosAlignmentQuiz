# Tablegate TTRPG Messenger & Organizer

Open **tablegate.html** from any normal HTTPS web host. It is the only HTML file in this package.

Tablegate combines an invite-only campaign messenger with a shared organizer:

- Discord-style campaign servers, categories, text channels, handout channels, DMs, roles, invitations, member moderation, reactions, pins, search, attachments, character personas, and auditable dice rolls.
- Browser WebRTC voice/video rooms, direct calls, mute, deafen, push-to-talk, camera, and screen sharing.
- Shared campaign task board.
- Calendar with player submissions and administrator approval.
- Availability records for sessions, appointments, birthdays, unavailable blocks, and preferred play windows.
- Permissioned TTRPG system library accepting JSON, PDF, DOCX, and TXT.
- Grounded rules assistant that searches indexed campaign material and can suggest a likely roll expression while citing stored source excerpts.
- Progressive Web App installation on supported mobile and desktop browsers.

## Locked backend

The frontend is hard-coded to this backend deployment and library release:

- Web app: `https://script.google.com/macros/s/AKfycbylmceRVx5UcgMvMDkwym_9h0wv8gM5B9Msuui7-7Z6lqoYlqZBR6Y47hmsauQgoGXY/exec`
- Library: `https://script.google.com/macros/library/d/18ET55A9uVNx3IUzoAM_eRj8v7jqagPgjVdxil3P1SoUqrFnnAJp6CjVr/6`

There is no alternate runtime endpoint, Admins Place fallback, or fixed public campaign URL in the client configuration.

## Portable campaign copies

The Admins Place copy is only a testing/storage copy. It is not canonical and is not required by this package.

Copy the complete package into any campaign folder while preserving the relative folder structure. The manifest, service worker, CSS, JavaScript, icons, and generated invite links are relative to the folder containing that copy of `tablegate.html`. An invite copied from one campaign installation therefore points back to that campaign installation, not to Admins Place.

No Windows batch file, PowerShell launcher, Node server, or secondary HTML page is included or required.


## Organizer detection correction (build 2026-07-28.4)

The persistent local-preview warning was removed. The client no longer labels the shared organizer inactive because of a temporary network or internal request error. Only an actual `UNKNOWN_ACTION` response from an older backend may use the browser mirror. Installed copies force a service-worker update and load versioned JavaScript assets.
