# TableGate VTT Research and Open-Source Notices

TableGate's new VTT Worldbuilder is original TableGate frontend code built with the browser Canvas API and Web Audio API. No source code, assets, or packages from the projects below are vendored into this update. They were studied as architectural and interaction references.

## Repositories reviewed

| Project | Repository | License / use in this update |
|---|---|---|
| PixiJS | https://github.com/pixijs/pixijs | MIT. Reference for high-performance layered 2D rendering architecture. Not bundled. |
| pixi-viewport | https://github.com/davidfig/pixi-viewport | MIT. Reference for pan, zoom, drag, pinch, and viewport constraints. Not bundled. |
| howler.js | https://github.com/goldfire/howler.js | MIT. Reference for browser audio pooling, volume groups, looping, and spatial-audio patterns. TableGate uses native Web Audio instead. |
| Azgaar's Fantasy Map Generator | https://github.com/Azgaar/Fantasy-Map-Generator | MIT. Reference for layered map data, generated regions, labels, and editable features. Not bundled. |
| gTove | https://github.com/RobRendell/gtove | MIT. Reference for self-hosted VTT scene and token workflows. Not bundled. |
| Open-VTT | https://github.com/Khazlor/Open-VTT | MIT. Reference for system-neutral campaign/maps, grids, tokens, and dynamic lighting. Not bundled. |
| skyloutyr/VTT | https://github.com/skyloutyr/VTT | Repository reviewed for 2D/3D lighting and multi-source shadow concepts. No code was copied or bundled; license must be verified before reuse. |

## Proprietary products

Inkarnate, Arkenforge, and Foundry Virtual Tabletop were treated only as feature and workflow references requested by the project owner. Their application code and bundled assets are not included. Foundry Virtual Tabletop is proprietary software, so this update does not copy or redistribute Foundry code.

## TableGate implementation boundary

The VTT uses its own semantic records for drawings, buildings, walls, doors, lights, sound zones, fog reveals/hides, and NPC tokens. Buildings are exported to the V8 backend as map features with `semanticType: BUILDING`, `linkedEntityType: LOCATION`, and their TableGate location ID in `linkedEntityId`. NPC residence, workplace, and schedule assignments remain explicit TableGate data rather than visual-only map annotations.
