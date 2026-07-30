# Effects Studio

Effects Studio is a self-contained 2D creative workspace and interactive map builder. Open `index.html` directly or host the folder on GitHub Pages.

## Included

- Multiple named browser projects with thumbnails, search, duplicate, rename, delete, import, export, and autosave.
- Raster drawing, text, editable shapes, image overlays, transparency tools, filters, layers, and frame animation.
- **Procedural map terrain:** all 58 supplied texture images and the supplied dirt-road brush are represented by 59 JavaScript presets. The original texture files are not copied into this package.
- **Code-generated grids:** all six supplied grid references are recreated by JavaScript as square, hexagonal, or isometric overlays with adjustable cell size, opacity, color, snapping, and export inclusion.
- **Reusable uploaded map assets:** upload PNG, JPG, WEBP, GIF, or SVG pieces, retain them in the project, place multiple editable copies, drag, resize, rotate, flip, reorder, or rasterize them.
- **Lighting effects:** point, cone, and area lights with ambient darkness, tint, color, intensity, radius, softness, rotation, pulse, flicker, and draggable map handles.
- **Sound effects:** upload multiple audio files, create draggable spatial zones, adjust radius, volume, looping and trigger behavior, preview sounds, and embed them in project JSON and interactive HTML exports.
- PNG, SVG, interactive HTML, and editable JSON export. PNG/SVG exports can include the map grid and lighting; HTML exports also retain positioned sound controls.

## Procedural asset conversion

The supplied texture and grid archives were used as visual references only. `js/procedural-map-engine.js` creates the terrain, road, water, stone, brick, grass, dirt, Feywild, and grid visuals at runtime using Canvas JavaScript. `css/procedural-map.css` supplies the editor presentation and interactive map-effect controls. See `docs/procedural-map-conversion.md` for the exact source-name mapping.

Existing artwork, icons, stickers, and previously bundled studio assets remain available; only the newly supplied texture/grid packs were converted instead of being copied as physical map assets.

## Paint by Number workspace

Paint by Number remains integrated under the Effects Studio shell and is launched from the workspace switcher or project home. It runs in an isolated same-package frame so its canvas engine and duplicate control IDs do not interfere with Effects Studio layers, brushes, projects, or shortcuts.

## Backend routing

`data/backend-config.json` remains the authoritative routing manifest. The static package configures the supplied deployments but does not publish or redeploy Google Apps Script code.
