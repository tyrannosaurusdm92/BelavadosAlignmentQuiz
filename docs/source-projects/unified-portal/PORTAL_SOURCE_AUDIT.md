# Source Audit

- Base shell: `TableGate_Portal_Roll_Separation_FIXED(1).zip`
- Central multi-system roller: `Multi_System_TTRPG_Portal(2).zip`
- Character switcher and system references were inspected as compatibility references.
- Session character loading is restricted to signed-in profile records; no blank-session option exists.
- No `.bat`, `.cmd`, or PowerShell files are included.
- Top-level directories are only `css`, `js`, `json`, `assets`, and `docs`, plus `tablegate.html` and `service-worker.js`.
- Token-border visual reference: user-supplied `border.png`, packaged as `assets/token-borders/reference-gold-ring.png`.
- The token editor uses browser-native Canvas, FileReader, IndexedDB, and image APIs; no image service or additional framework was introduced.
