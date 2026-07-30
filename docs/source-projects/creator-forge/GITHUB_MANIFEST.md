# GitHub Repository Manifest

## Required repository root

```text
TableGate/
├── tablegate.html
├── service-worker.js
├── css/
├── js/
├── json/
├── assets/
└── docs/
```

Do not move the files out of this relative structure. The single HTML page uses relative paths and the service worker treats `tablegate.html` as the navigation fallback.

## Recommended repository settings

- Publish the `TableGate` folder as the site root, or preserve it as a subfolder and open `TableGate/tablegate.html`.
- Use a static host that serves JavaScript, JSON, SVG, PNG, WebP, and service-worker files with normal MIME types.
- Keep the three intelligence corpus files under `js/bot/`; they are lazy-loaded and are intentionally split for repository size compatibility.
- Keep generated campaign exports out of source control unless they are intentionally shared examples.
- Do not commit private backend credentials. This build contains only the backend URLs supplied for the project.

## Entry and offline behavior

- Entry point: `tablegate.html`
- Service worker scope: the containing `TableGate` directory
- Core cache: HTML, CSS, JavaScript shell, selected JSON manifests, and icons requested at runtime
- Large assistant corpus: runtime-loaded rather than blocking the initial application shell

## Licenses and source notes

Repository license/source material is under `docs/licenses` and `docs/source-notes`. See `THIRD_PARTY_LICENSES.md` before redistributing upstream-derived code.
