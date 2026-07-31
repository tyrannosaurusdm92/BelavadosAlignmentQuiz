# Architecture

1. `tablegate.html` is the sole physical HTML file and Portal shell.
2. `js/system-bundles.js` contains roll-separated Character Studio sources.
3. `js/session-system-bundles.js` contains playable saved-character views.
4. A session bridge intercepts every configured gameplay roll control before the character sheet can use local randomness.
5. `js/session-roller-bundle.js` embeds the central multi-system board and the character iframe beneath its 3D dice layer.
6. The central result is replayed through the sheet's existing consequence/resource function using the returned dice, so native state remains accurate.
7. Character stat generation/reroll controls are deliberately not intercepted.

## Character token pipeline

8. Each saved profile character exposes a Portal token editor; blank drafts do not receive profile tokens until saved.
9. Canvas rendering applies a circular character-art clip below a separate circular border layer.
10. Border modes are the supplied reference ring, a user-selected solid color, or a user-uploaded image texture with fill/tile layout.
11. The compact finished token is stored with the character record and follows profile backup/backend payloads. Editable artwork, custom border texture, and crop settings are stored in browser IndexedDB when available.
12. A 1024 × 1024 transparent PNG can be generated locally without sending artwork to a third-party service.
