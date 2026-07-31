# Integration Audit

## Static integration

The final static validator passed with 0 failures. The reorganized reproducible release audit also passed all 18 checks. It checks the allowed root layout, single HTML entry, documentation extensions, file-size and directory-file-count limits, JSON parsing, JavaScript/Google Apps Script syntax, central type boundaries, manifest/service-worker paths, embedded-tool references, and literal local file references.

## Browser interaction evidence

The unified authentication shell was exercised in headless Chromium. Sign-in/register tabs switched correctly; the password field changed from `password` to `text` and back; and the forgot-password modal opened with the expected title. The captured run reported no console or page errors.

- **Campaign Hub:** initialized; title `TableGate Campaign Hub`, body text 8,712 characters, console errors 0.
- **Effects Studio:** initialized; title `Untitled Project — Effects Studio`, body text 1,257 characters, console errors 0.
- **Paint by Number:** initialized; title `Effects Studio — Paint by Number`, body text 652 characters, console errors 0.
- **Session Dice:** initialized; title `roleplaying_board`, body text 6,042 characters, console errors 0.
- **Creator Forge:** initialized; title `TableGate`, body text 3,561 characters, console errors 0.

Campaign Hub exposed nine system options and a visible map viewer. Effects Studio and Paint by Number rendered their retained tool controls. Creator Forge exposed the LifeSimulator global and its full control surface. Session Dice rendered the live board and its controls.

## Nested 3D dice repair

The inner 3D renderer formerly referenced `libs/three.min.js`, `libs/cannon.min.js`, `libs/teal.js`, `dice.js`, and `dice-main-bot.js` as if the old mini-project still existed. These references now target the centralized files under `js/sessions/dice-roller/`. A dedicated nested-document test confirmed that all five files exist and that both `main.init` and `DnDPortalDiceRenderer` initialize. The headless environment did not provide a WebGL context, so the final canvas render/throw could not be exercised.

## Backend integration

The supplied `.gs` source is unchanged. The frontend deployment and library references use the supplied endpoint and library version 6. Authentication, messaging, uploads, sharing, campaign assets, dice, generation, and other remote operations continue through the existing API client/adapters rather than a replacement backend.

## Environment-specific limitations

- Direct local URL navigation was blocked by the managed Chromium environment, so browser tests used equivalent in-memory documents with local scripts/styles inlined.
- `localStorage` throws in opaque-origin in-memory documents; those harness-only errors do not represent normal HTTPS/localhost behavior.
- Creator Forge's raw source contains context placeholders that the real host replaces before assigning `srcdoc`; direct raw-source testing reports that placeholder until the normal host replacement is applied.
- Remote authentication, recovery email, voice/WebRTC, multi-user sync, cloud saves, image generation, and protected route authorization require deployment credentials and multiple test users.
- Audio playback, GPU/WebGL rendering, camera/microphone permissions, install prompts, and real service-worker lifecycle behavior require a normal browser origin and user permission.

Detailed machine-readable evidence is in `docs/github/manifests/test-results.json`.
