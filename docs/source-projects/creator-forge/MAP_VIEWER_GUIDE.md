# TableGate Map Viewer Guide

## Generated records

LifeSimulator locations automatically appear as semantic map nodes. Their hierarchy is determined by `parentLocationId`; their scale is inferred from `mapLevel`, `map.nodeType`, category, and type.

Use **Open in Map Viewer** on any location card or use the viewer’s generated-record panel.

NPCs appear in the record panel and inside semantic locations based on current, residence, and workplace location IDs.

## Placing records

1. Open a semantic or physical map.
2. Choose **Place** beside a generated NPC or location.
3. Click the map.
4. Drag the pin to adjust it.

Placements are stored in `state.tablegate.mapPlacements`.

## Linking physical maps

Load map files or a manifest, open a physical map, choose a generated location, and select **Link Current Map**. Opening the semantic location then provides access to the linked physical map. Links are stored in `state.tablegate.mapLinks`.

Supported files include SVG, PNG, JPG, WEBP, GIF, HTML, PDF, and GeoJSON. Nested map folders and manifests can represent world → continent → nation → region → settlement → district → structure → interior → room hierarchies.

## Export

**Export Map Manifest** includes semantic locations, NPC indexes, placements, and physical-map links. The same manifest is included inside a full project ZIP.
