# Effects Studio Merge Audit

- Base feature set retained from the Slim build.
- Preferred older shell used as the visual and responsive layout reference.
- Added calligraphy and neon raster brushes.
- Added 6 static pattern generators and 12 raster filters.
- Added all unique system-font choices present across the supplied builds.
- Added multi-project IndexedDB management and legacy-save migration.
- Added 15 carefully selected static texture resources.
- Rejected all model loaders, geometry tools, 3D vendor libraries, 3D decoders, live-effect controls, particle sheets, sprite-sheet effects, bulk legacy overlays, bulk legacy backgrounds, and bulk legacy sticker imports.
- Existing Slim asset inventory retained unchanged.
- Visible legacy shell names and placeholder marketing copy removed.
- Responsive rules cover phone/tablet portrait and compact landscape/desktop layouts.


## 2026-07-25 Paint by Number absorption audit

- Effects Studio remains the only top-level launcher and visual shell.
- The complete Paint by Number HTML engine and all bundled JSON/SVG assets were retained under `features/paint-by-number/`.
- The feature runs in an isolated same-package frame to prevent collisions between both applications' canvas, save, undo, export, and panel IDs.
- Global Effects Studio Save, Open, Export, and Sync controls are routed to the active workspace.
- No 3D or live-effects functionality was added by this merge.
- Service backend and preferred host deployments are centralized in `data/backend-config.json` and `js/backend-config.js`.


## 2026-07-30 Map-effects revision audit

- Added a dedicated Map Builder with terrain brush, full-layer fill, texture overlay, map canvas presets, snapping, and exportable square/hex/isometric grids.
- Converted 58 supplied raster texture references and one supplied dirt-road brush reference into 59 deterministic Canvas/JavaScript presets; no source texture files were copied.
- Converted six supplied grid references into code-generated grid presets; no source grid PNGs were copied.
- Added reusable multi-image/SVG project asset uploads and editable placement through the existing object engine.
- Added point, cone, and area lighting with draggable controls and optional pulse/flicker animation.
- Added multi-audio uploads, draggable sound zones, preview controls, project persistence, and interactive HTML export.
- Extended project JSON, undo/redo snapshots, resize/trim behavior, and PNG/SVG/HTML compositing to include map settings.
- Browser validation confirmed 59 terrain choices, six grid references, procedural raster output, grid output, lighting output, image upload/placement, audio upload/zones, project JSON persistence, and interactive HTML audio embedding without uncaught runtime errors.
