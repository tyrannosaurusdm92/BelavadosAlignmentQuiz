Belavadös merged DM map editor

Files:
- dm_map.html: merged editor program.
- dm_map.json: external site-wide map/province/settlement data shell.

Replacement workflow:
1. Keep dm_map.html and dm_map.json in the same folder.
2. Open the site from a local server or GitHub Pages so the browser can fetch dm_map.json. Direct file-open mode may block fetch; use Upload JSON Information as a fallback.
3. Edit the map, settlements, race caches, biome caches, province JSON, or settlement JSON.
4. Click Export dm_map.json (Full Site JSON).
5. Replace this folder's dm_map.json with the exported dm_map.json.

Patch notes:
- Race category button selection, god selection, and settlement-type tag selection are hidden/disabled in favor of cache-driven automation.
- Race and biome caches remain the editable source of truth for settlement demographics and environment.
- Gods now auto-fill from the selected race cache using the Belavadös creator-god/race category relationships.
- Settlement tags now auto-fill from selected races, biome cache, settlement type, danger level, preferred alignment axis phases, transportation/capital rules, and the province terrain scanner for the settlement land area.
- Province ZIP exports place province_crop.png directly in the province main folder when the canvas can be captured.
- Province ZIP exports no longer include suggested map image files, suggested image metadata, or image recommendation text.
- The malformed embedded-script placement from the prior merged file was repaired and the JavaScript was syntax-checked.
- The external dm_map.json workflow is preserved as the intended site-wide replacement system.

Preserved behavior:
- External dm_map.json loader.
- Browser save progress.
- Whole-map/province terrain scanning.
- Globe-safe export.
- Province and settlement JSON uploads.
- Manual settlement placement queue.
- Race cache and biome cache tools.
- Capital portal-route rule.
- Time-zone updates on placed/moved settlements.
- Existing editor controls outside the requested selector/image-suggestion changes.
