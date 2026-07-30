# Static Hosting Deployment

1. Extract every delivered part so they merge into one `TableGate` folder.
2. Commit the contents of `TableGate` to a repository.
3. Configure the static host to publish that folder as the site root, or keep the folder name and browse to `/TableGate/tablegate.html`.
4. Ensure MIME types for `.js`, `.json`, `.svg`, and `.webp` are served normally.
5. Do not rewrite project AI requests through the service worker. The service worker ignores cross-origin requests.
6. After deployment, open the Assistant settings and use Test Connection.

The service worker caches the single-page shell and learns additional same-origin resources as they are requested. The large assistant corpus is lazy-loaded on first use.
