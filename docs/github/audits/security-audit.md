# Security Audit

## Backend preservation and configuration

- Supplied backend source preserved byte-for-byte: **yes**.
- SHA-256: `8a439d64e740e7f5e8eaf3cdcaa018b2966e7a999cd232742986c3be91accc67`.
- Configured deployment: `https://script.google.com/macros/s/AKfycbylmceRVx5UcgMvMDkwym_9h0wv8gM5B9Msuui7-7Z6lqoYlqZBR6Y47hmsauQgoGXY/exec`.
- Configured library: `https://script.google.com/macros/library/d/18ET55A9uVNx3IUzoAM_eRj8v7jqagPgjVdxil3P1SoUqrFnnAJp6CjVr/6`.
- Private-key PEM markers found in active project files: **0**.
- Files above the 24,000 KB application-file limit: **0**.

The frontend contains a small number of intentional deployment fallbacks inside independently bootable embedded workspaces. The canonical deployment lock is `json/tablegate/config/deployment-lock.json`; `json/tablegate/config/app-config.json` documents the same locked deployment. No credentials, private keys, OAuth client secrets, or service-account key files were added.

## Permission boundaries

Active frontend logic gates campaign-runner workspaces through campaign/server roles and capability checks rather than relying only on hidden buttons. Character-copy consent, player ownership, private runner dice, published campaign material, and player-safe snapshots remain separate workflows. The supplied backend remains the authority for protected remote actions; frontend checks are defense-in-depth and interface safety, not a replacement for server authorization.

## Storage and offline behavior

`service-worker.js` uses a versioned cache, deletes obsolete caches during activation, ignores non-GET and cross-origin requests, and excludes paths matching API, authentication, messages, private data, tokens, credentials, passwords, session data, saved records, and notes. Navigation falls back only to the application shell. Sensitive responses are not intentionally precached.

## Remote verification limitation

The deployment URL responded with a redirect to the deployed `script.googleusercontent.com` service when checked through the web fetch environment, indicating that the Apps Script deployment URL resolves. That environment declined to follow the generated redirect target, and the library inspection page redirected to Google sign-in. Authenticated API actions and library internals therefore were not remotely inspected here.

## Recommendations before public deployment

Use HTTPS, restrict Apps Script deployment access to the intended audience, confirm every protected route rechecks user/server permissions, set a strict Content Security Policy appropriate to the embedded tools, review third-party libraries and licenses, and test account recovery/email delivery using dedicated non-production accounts.
