import { readFile } from 'node:fs/promises';
const files=['onyx_map_request_packager.html','css/onyx-map-image-creator.css','js/onyx-map-image-creator.js','json/onyx_pin_types.json','json/onyx_settlement_distribution.json'];
for (const file of files){ const text=await readFile(new URL('../'+file, import.meta.url),'utf8'); if(!text || text.length<20) throw new Error(file+' looks empty'); }
console.log('Onyx Map Request Packager smoke test passed.');
