
import json, re, subprocess
from pathlib import Path
root = Path(__file__).resolve().parents[1]
required = [
 'life_simulator.html','life-simulator/site.css','life-simulator/core.js','life-simulator/data-bundle.js','life-simulator/render.js','life-simulator/simulation.js','life-simulator/npc-system.js','life-simulator/location-system.js','life-simulator/relationship-system.js','life-simulator/family-system.js','life-simulator/faction-system.js','life-simulator/schedule-system.js','life-simulator/services-system.js','life-simulator/import-system.js','life-simulator/export-system.js',
 'data/belavados_alignment_model.json','data/belavados_content.json','data/belavados_time_model.json','data/belavados_race_categories.json','data/living_world_rules.json','data/settlement_assignments.json','data/visitable_locations.json','data/faction_rules.json','data/manifest.json'
]
missing=[p for p in required if not (root/p).exists()]
assert not missing, f'Missing files: {missing}'
assert not (root/'life-simulator/emperor-onyx.js').exists(), 'local Onyx bot should be removed'
for path in (root/'data').glob('*.json'):
    json.loads(path.read_text(encoding='utf-8'))
race=json.loads((root/'data/belavados_race_categories.json').read_text(encoding='utf-8'))
assert race['schema']=='belavados.raceDropdown.v2'
assert race['counts']['raceCategories']==22
assert race['counts']['selectableRaceBloodlineSubgroupOptions']==182
assert sum(len(c.get('options',[])) for c in race['raceCategories'])==182
time=json.loads((root/'data/belavados_time_model.json').read_text(encoding='utf-8'))
assert len(time['provinceTimeZones'])>=28
assert time['solarDaysPerBelavadosYear']==330.15
rules=json.loads((root/'data/living_world_rules.json').read_text(encoding='utf-8'))
assert rules['settlementSizeTargets']['Capital City']['locations']==1312
assert rules['settlementSizeTargets']['Capital City']['npcs']==3588
assert rules['settlementSizeTargets']['Village']['worldTravelPercent']==3
manifest=json.loads((root/'data/manifest.json').read_text(encoding='utf-8'))
assert manifest['mapPinWorkflowIncluded'] is False
assert manifest['onyxMode']=='externalRuleBotButtonOnly'
html=(root/'life_simulator.html').read_text(encoding='utf-8')
for src in re.findall(r'src="([^"]+)"', html):
    assert (root/src).exists(), f'Missing script/asset {src}'
assert 'emperor-onyx.js' not in html
print('PASS: revised site files exist, JSON is valid, race/time/settlement targets match, local Onyx bot is removed, and referenced scripts exist.')
