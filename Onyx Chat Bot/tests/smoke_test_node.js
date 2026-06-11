const fs = require('fs');
const vm = require('vm');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'emperor_onyx_rulebot.html'), 'utf8');
const js = fs.readFileSync(path.join(root, 'js/emperor-onyx-rulebot.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css/emperor-onyx-rulebot.css'), 'utf8');
const cssNav = fs.readFileSync(path.join(root, 'css/components/global-navigation.css'), 'utf8');
const cssResp = fs.readFileSync(path.join(root, 'css/responsive/responsive-layout.css'), 'utf8');
const cssDice = fs.readFileSync(path.join(root, 'css/components/dice-overlay-runway.css'), 'utf8');

for (const forbidden of ['Quick Generator', 'Generate Settlement', 'Generate NPCs', 'Example Settlement', 'Example NPCs']) {
  if (html.includes(forbidden)) throw new Error(`Removed generator UI text still present: ${forbidden}`);
}
if (!html.includes('bd-global-dropdown-nav')) throw new Error('Global draggable navigation HTML missing');
if (!cssNav.includes('GLOBAL HIDABLE / MOVABLE SITE NAVIGATION')) throw new Error('Global navigation CSS missing');
if (!cssResp.includes('Onyx responsive layout upgrades')) throw new Error('Responsive CSS patch missing');
if (!cssDice.includes('Full-screen Foundry-style Onyx dice table overlay')) throw new Error('Full-screen 3D dice overlay CSS missing');
if (!js.includes('isNaturalDiceRequest')) throw new Error('Natural dice request parser missing');
if (!js.includes('launchDiceTable')) throw new Error('Dice table animation launcher missing');
if (!js.includes('disabledGeneratorMessage')) throw new Error('Disabled generator guard missing');
if (!js.includes('wireBelavadosJsonLibrary')) throw new Error('JSON library merge hook missing');
if (!html.includes('js/modules/onyx-enhanced-abilities.js')) throw new Error('Enhanced ability module script missing');

const context = { window: {}, console };
context.window.window = context.window;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'js/lore_seed.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(root, 'js/rulebot_engine.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(root, 'js/onyx-tools-data.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(root, 'js/emperor-onyx-rulebot-data.js'), 'utf8'), context);

const Bot = context.window.BelavadosRuleBot;
if (!Bot) throw new Error('BelavadosRuleBot did not load');
const Tools = context.window.ONYX_TOOLS_DATA;
const encounterDir = JSON.parse(fs.readFileSync(path.join(root, 'json/belavados_encounter_directory.json'), 'utf8'));
if (!Array.isArray(encounterDir.monsters) || encounterDir.monsters.length < 300) throw new Error('JSON encounter directory missing or too small');
if (!Array.isArray(context.window.BELAVADOS_LORE_SEED.provinces) || context.window.BELAVADOS_LORE_SEED.provinces.length !== 28) throw new Error('Expected 28 provinces in lore seed');
if (!context.window.BELAVADOS_LORE_SEED.provinces.some(p => p.name === 'Valerune')) throw new Error('Valerune province missing');
if (!Tools || !Array.isArray(Tools.biomeTree) || Tools.biomeTree.length !== 5) throw new Error('Biome tree missing');
if (!Array.isArray(Tools.encounterPresets) || Tools.encounterPresets.length < 100) throw new Error('Encounter index missing');
if (!Tools.biomeProfiles['Deep cavern'] || !Tools.biomeProfiles['Underwater with reefs']) throw new Error('Biome profiles missing');

console.log(JSON.stringify({
  ok: true,
  generatorUiRemoved: true,
  naturalDiceChatPresent: true,
  draggableGlobalNavPresent: true,
  responsiveCssPresent: true,
  rulebotEngineStillLoads: true,
  encounterPresets: Tools.encounterPresets.length,
  jsonEncounterDirectory: encounterDir.monsters.length,
  provinces: context.window.BELAVADOS_LORE_SEED.provinces.length,
  diceOverlayPresent: true,
  diceMainFramePresent: html.includes('onyxDiceMainFrame')
}, null, 2));
