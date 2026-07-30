# Validation checklist

The packaged build was checked for:

- Exactly one HTML file: `tablegate.html`
- Only the requested top-level folders: `js`, `css`, `json`, `docs`, `backend`, `data`, and `assets`
- No `.bat`, `.cmd`, or `.ps1` files
- JavaScript syntax for every browser script and service worker
- Apps Script syntax after copying the `.gs` source to a JavaScript syntax-check target
- Valid parseable HTML with the organizer workspace inside the authenticated app grid
- Backend route coverage for every organizer, calendar, system-library, and rules-assistant action used by the frontend
- Dedicated TTRPG upload permission working independently from ordinary chat-attachment permission
- PWA manifest, icons, service worker, install prompt handling, and responsive mobile layout
- Accepted system upload extensions limited to JSON, PDF, DOCX, and TXT
- Every newly submitted calendar item defaulting to `PENDING`, including submissions made by administrators
- Pending and private calendar visibility restrictions
- Upload controls hidden or disabled without the dedicated system-upload permission
- Mocked authenticated browser integration across messenger, organizer dashboard, tasks, calendar, approvals, TTRPG system library, grounded rules answers, and mobile navigation
- Source archive preservation and third-party notice inclusion

Live microphone/camera, Google Drive persistence, PDF conversion, and multi-user WebRTC testing require HTTPS plus the included Apps Script backend deployed as a new version. A TURN service may still be required for peers behind strict NAT or firewalls.

## Locked portable deployment revision — 2026-07-28

- Active frontend web-app URL locked to `https://script.google.com/macros/s/AKfycbylmceRVx5UcgMvMDkwym_9h0wv8gM5B9Msuui7-7Z6lqoYlqZBR6Y47hmsauQgoGXY/exec`.
- Apps Script library locked to version `3`.
- Fixed Admins Place canonical/public URL removed from HTML, JavaScript, JSON, and documentation.
- Hosting mode changed to portable current-folder operation.
- Invite links continue to derive from the currently opened `tablegate.html` address.
- Service-worker cache version changed so installed copies refresh the locked endpoint.
- Older endpoint references inside the preserved previous-build source archive were replaced to prevent accidental reuse.
- JavaScript syntax, JSON parsing, folder constraints, one-active-HTML constraint, backend route presence, and archive integrity revalidated.


## Organizer warning correction

- Persistent `Organizer backend extension is not active yet` banner removed from the active client.
- Temporary `NETWORK_ERROR`, `INTERNAL_ERROR`, configuration, and permission failures no longer switch the entire organizer into local-preview mode.
- Browser mirror fallback is limited to `UNKNOWN_ACTION`, which indicates a genuinely older backend route table.
- Asset URLs are versioned as `20260728.4`.
- Service-worker cache is `tablegate-v2-2026-07-28-organizer-detection-fix-v4`.
