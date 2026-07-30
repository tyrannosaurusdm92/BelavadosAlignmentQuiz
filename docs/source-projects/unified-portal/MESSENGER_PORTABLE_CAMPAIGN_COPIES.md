# Portable campaign copies

`tablegate.html` does not point to a specific GitHub Pages campaign folder.

The same package can be copied into multiple campaign directories. Keep these items together:

- `tablegate.html`
- `assets/manifest.webmanifest`
- `service-worker.js`
- `js/`
- `css/`
- `json/`
- `docs/`
- `backend/`
- `data/`
- `assets/`

All frontend assets use relative paths. The Progressive Web App identity and scope are relative to the folder where each copy is hosted. Invite links are produced from the URL of the currently opened copy.

Every campaign copy still talks to the locked shared backend:

`https://script.google.com/macros/s/AKfycbylmceRVx5UcgMvMDkwym_9h0wv8gM5B9Msuui7-7Z6lqoYlqZBR6Y47hmsauQgoGXY/exec`

The code does not use the Admins Place path as a fallback, redirect, canonical URL, or required base.
