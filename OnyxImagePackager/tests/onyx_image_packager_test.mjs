import { readFile } from 'node:fs/promises';
const files = [
  'OnyxImagePackager.html',
  'css/onyx-map-image-creator.css',
  'js/onyx-map-image-creator.js',
  'json/onyx_pin_types.json',
  'json/onyx_settlement_distribution.json',
  'map_assets/map_assets_catalog_manifest.json',
  'map_assets/map_assets_catalog_index.json',
  'templates/interactive_map_builder/index.html'
];
for (const file of files) {
  const text = await readFile(new URL('../' + file, import.meta.url), 'utf8');
  if (!text || text.length < 20) throw new Error(file + ' looks empty');
}
console.log('OnyxImagePackager smoke test passed.');
