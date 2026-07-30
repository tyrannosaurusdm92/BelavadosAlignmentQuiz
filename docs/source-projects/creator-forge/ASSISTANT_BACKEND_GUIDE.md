# Integrated TableGate Assistant

## Configured project AI backend

Deployment endpoint:

`https://script.google.com/macros/s/AKfycbylmceRVx5UcgMvMDkwym_9h0wv8gM5B9Msuui7-7Z6lqoYlqZBR6Y47hmsauQgoGXY/exec`

Apps Script library:

`https://script.google.com/macros/library/d/18ET55A9uVNx3IUzoAM_eRj8v7jqagPgjVdxil3P1SoUqrFnnAJp6CjVr/6`

The browser client posts JSON using a text/plain request to remain compatible with Apps Script web deployments. Optional repository and project-token fields are supported but are not required merely to attempt a backend request.

## Project context

The assistant receives a compact project snapshot rather than the entire project file. It includes project/system identity, counts, selected NPC and location fields, transit type/stop/route/service summaries, and the reviewed action contract. Long registries and generated binary assets are not inserted into every chat request.

## Review-first actions

The backend may return normal prose or a JSON envelope containing `summary` and `actions`. Only a small allowlist is accepted:

- Generate NPC records.
- Generate location records.
- Generate a settlement through the isolated NPC/location adapter.
- Add transit types, stops, routes, and services.
- Plan a saved trip.
- Append a project note.

Every accepted action is displayed with its payload and an Apply button. Unsupported action names are discarded. No action is silently applied.

## Image generation

Image Studio calls the backend action `image.generate`. The response adapter accepts a remote URL, data URL, or common base64 image fields. Generated binary images are stored in browser IndexedDB, while their metadata remains in the TableGate project state. They can be assigned as NPC token art, location art, or generated physical map nodes.

Project ZIP export includes generated image blobs that are available in the current browser profile.

## Offline fallback

The three-part local intelligence corpus loads only when Assistant is opened or a backend fallback needs it. This prevents the large corpus from delaying the rest of TableGate. Offline retrieval can surface relevant project-building patterns, but it does not pretend to be a cloud generative model.
