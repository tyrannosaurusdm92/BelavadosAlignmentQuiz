# Validation Report

## Package structure

- Sole HTML entry point: `tablegate.html`
- Root service worker: `service-worker.js`
- Allowed top-level directories only: `css`, `js`, `json`, `assets`, `docs`
- No `.bat`, `.cmd`, or PowerShell launch scripts
- No obsolete backend endpoint or library identifiers

## Session-character behavior

- The Dice Roller session iframe loads characters already saved in the Portal profile.
- It does not create or open a blank session character sheet.
- Entering Dice Roller without choosing a saved character shows the saved-character chooser.
- Selecting a system with no saved character clears the iframe and asks the player to create/save one in Character Studio.
- Character Studio remains the separate place for creating and editing characters.

## Dice-routing behavior

- All configured gameplay roll controls route to the central multi-system roller and 3D dice transport.
- Returned dice replay through each sheet's native resolution/state function so resources and consequences remain synchronized.
- Ability/stat generation and permitted stat rerolls remain local and are not intercepted.
- Verified coverage: 27 gameplay controls across nine systems.

## Automated checks

- All external JavaScript files passed syntax parsing.
- All inline application JavaScript passed syntax parsing.
- All embedded Character Studio and playable-session sheet scripts passed syntax parsing.
- Nine rules-reference JSON files parsed and matched the supplied source files byte-for-byte.
- Session roller resource paths resolved.
- Browser integration test confirmed saved-character selection, D&D central routing, local stat rerolls, Fate switching, and no-blank-sheet behavior for a system without a saved character.
- Production WebGL runtime files were syntax/resource checked; the browser integration test used an inlined renderer transport to exercise the nested message bridge deterministically.

## Character-token validation

- A saved character with artwork embedded in its character state opened directly in the token editor.
- Circular crop preview, zoom controls, color border mode, and custom uploaded texture mode were exercised in Chromium.
- A finished transparent token persisted to the character profile and re-rendered as the character-card portrait.
- The IndexedDB editable-media path and finished-token profile fallback were syntax- and integration-checked; the finished token persists even when IndexedDB is unavailable.
- Existing saved-character session selection remained intact after token creation.
- The packaged gold reference ring retains transparency outside and inside the border.
