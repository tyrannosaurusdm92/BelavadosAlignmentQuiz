# Source Notes

The system logic and local assistant retrieval are grounded in the nine user-supplied JSON references stored unchanged under `json/systems/`. Their terminology, edition distinctions, mechanics, legal notes, and scope boundaries are not replaced by a generic universal rules model.

The generated `json/ttrpg_system_bundle.js` is a browser-loadable copy of those same JSON objects. It exists so the portal can open directly from disk without relying on `fetch()` access to local files.

The universal parser handles notation only. It does not redefine each game's success model. After dice are generated, the selected system resolver applies that game's native interpretation where the supplied reference supports it. Powered by the Apocalypse additionally offers an implementation-specific mode because PbtA is a design family rather than one universal rules text.
