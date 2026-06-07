
import json, re
from pathlib import Path
root = Path(__file__).resolve().parents[1]
required = [
 'life_simulator.html','life-simulator/site.css','life-simulator/core.js','life-simulator/data-bundle.js','life-simulator/render.js','life-simulator/simulation.js','life-simulator/npc-system.js','life-simulator/location-system.js','life-simulator/relationship-system.js','life-simulator/family-system.js','life-simulator/faction-system.js','life-simulator/schedule-system.js','life-simulator/services-system.js','life-simulator/import-system.js','life-simulator/export-system.js','life-simulator/emperor-onyx.js',
 'data/belavados_alignment_model.json','data/belavados_content.json','data/belavados_time_model.json','data/belavados_race_categories.json','data/living_world_rules.json','data/settlement_assignments.json','data/visitable_locations.json','data/faction_rules.json','data/manifest.json'
]
missing=[p for p in required if not (root/p).exists()]
assert not missing, f'Missing files: {missing}'
for path in (root/'data').glob('*.json'):
    json.loads(path.read_text(encoding='utf-8'))
race=json.loads((root/'data/belavados_race_categories.json').read_text(encoding='utf-8'))
assert race['schema']=='belavados.raceDropdown.v2'
assert race['counts']['raceCategories']==22
assert race['counts']['selectableRaceBloodlineSubgroupOptions']==182
manifest=json.loads((root/'data/manifest.json').read_text(encoding='utf-8'))
assert manifest['mapPinWorkflowIncluded'] is False
html=(root/'life_simulator.html').read_text(encoding='utf-8')
for src in re.findall(r'src="([^"]+)"', html):
    assert (root/src).exists(), f'Missing script/asset {src}'
print('PASS: all required files exist, JSON is valid, race counts match, and referenced scripts exist.')
