import { readFile } from 'node:fs/promises';
const files=[
  'onyx_map_request_packager.html',
  'css/onyx-map-request-packager.css',
  'js/onyx-map-request-packager.js',
  'json/onyx_pin_types.json',
  'json/onyx_settlement_distribution.json',
  'json/belavados_locations_pins_template.json',
  'assets/pins/map-marker.svg'
];
for (const file of files){
  const text=await readFile(new URL('../'+file, import.meta.url),'utf8');
  if(!text || text.length<20) throw new Error(file+' looks empty');
}
const template=JSON.parse(await readFile(new URL('../json/belavados_locations_pins_template.json', import.meta.url),'utf8'));
if(!template.immersiveLocations?.profiles?.length) throw new Error('locations template missing profiles');
if(!template.pinsAndGeojson?.pinTypes) throw new Error('pins template missing pin types');
console.log('Onyx Map Request Packager locations/pins smoke test passed.');
