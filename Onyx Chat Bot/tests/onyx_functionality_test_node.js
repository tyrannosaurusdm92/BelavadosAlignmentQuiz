const fs = require('fs');
const vm = require('vm');
const path = require('path');

const root = path.resolve(__dirname, '..');
function read(rel){ return fs.readFileSync(path.join(root, rel), 'utf8'); }
function loadJson(rel){ return JSON.parse(read(rel)); }

const html = read('emperor_onyx_rulebot.html');
const css = read('css/emperor-onyx-rulebot.css');
const js = read('js/emperor-onyx-rulebot.js');

// Static asset/path checks for the JSON directory pull list.
const pullMap = JSON.parse(read('json/onyx_json_pulls.json'));
const pullEntries = Object.entries(pullMap);
const missing = pullEntries.filter(([, rel]) => !fs.existsSync(path.join(root, rel)));
if(missing.length) throw new Error('Missing JSON pull files: ' + JSON.stringify(missing));

for (const rel of pullEntries.map(([, rel]) => rel)) JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));

if(!css.includes('patches/overflow-hardening.css')) throw new Error('Split CSS imports missing overflow hardening module');
if(!read('css/patches/overflow-hardening.css').includes('Onyx overflow/buffer hardening patch')) throw new Error('Overflow/buffer CSS patch missing');
if(!read('css/patches/overflow-hardening.css').includes('overflow-wrap:anywhere')) throw new Error('Text overflow wrapping missing');
if(!js.includes('launchDiceMainTable')) throw new Error('dice-main table launch integration missing');
if(!js.includes('BELAVADOS_DICE_MAIN_ROLL')) throw new Error('dice-main postMessage roll bridge missing');
if(!html.includes('onyxDiceMainFrame')) throw new Error('Onyx dice-main iframe missing from dice tab');
if(!fs.existsSync(path.join(root, 'dice-main/onyx-dice-table.html'))) throw new Error('Onyx dice-main HTML wrapper missing');
if(!fs.existsSync(path.join(root, 'dice-main/assets/nc93322.mp3'))) throw new Error('Onyx dice-main audio asset missing');
if(!js.includes('numericRolls:rolled.numericRolls')) throw new Error('Command dice numeric rolls missing from diceGroups');
if(!js.includes('findStructuredLore')) throw new Error('Structured JSON lore search missing');

const fakeClassList = { add(){}, remove(){}, toggle(){} };
const fakeElement = () => ({
  innerHTML:'', textContent:'', value:'', checked:false, dataset:{}, style:{ setProperty(){}, getPropertyValue(){ return '1.8s'; } },
  classList: fakeClassList, appendChild(){}, append(){}, prepend(){}, remove(){},
  addEventListener(){}, querySelector(){ return null; }, querySelectorAll(){ return []; },
  setAttribute(){}, getBoundingClientRect(){ return {left:0,top:0}; },
  scrollTop:0, scrollHeight:0, offsetWidth:100, offsetHeight:100
});
const context = {
  window: {}, console, setTimeout, clearTimeout,
  localStorage: { getItem(){return null;}, setItem(){}, removeItem(){} },
  sessionStorage: { getItem(){return null;}, setItem(){}, removeItem(){} },
  document: {
    addEventListener(){}, body: fakeElement(),
    getElementById(){ return null; },
    querySelectorAll(){ return []; },
    createElement(){ return fakeElement(); },
    createTextNode(text){ return { textContent:String(text) }; },
    createElementNS(){ return fakeElement(); }
  },
  CustomEvent: function CustomEvent(type, init){ return { type, detail:init && init.detail }; },
  addEventListener(){}, removeEventListener(){}
};
context.window = Object.assign(context.window, context);
context.window.window = context.window;
vm.createContext(context);
['js/lore_seed.js','js/onyx-attached-lore.js','js/rulebot_engine.js','js/emperor-onyx-rulebot-data.js','js/onyx-tools-data.js','js/modules/onyx-enhanced-abilities.js','js/emperor-onyx-rulebot.js'].forEach(rel => vm.runInContext(read(rel), context, { filename: rel }));

const api = context.window.EmperorOnyxRuleBot;
if(!api || !api.__test) throw new Error('Onyx public test API missing');
const T = api.__test;

T.mergeBelavadosJsonLibrary({
  races: loadJson('json/belavados_races.json'),
  alignments: loadJson('json/belavados_alignments.json'),
  provinces: loadJson('json/belavados_provinces.json'),
  factions: loadJson('json/belavados_factions.json'),
  transportation: loadJson('json/belavados_transportation.json'),
  interactiveLocations: loadJson('json/belavados_interactive_locations.json'),
  pantheon: loadJson('json/belavados_pantheon.json'),
  biomes: loadJson('json/belavados_biomes.json'),
  encounterDirectory: loadJson('json/belavados_encounter_directory.json'),
  questHooks: loadJson('json/belavados_quest_hooks.json'),
  timeConversion: loadJson('json/belavados_time_conversion.json'),
  constellations: loadJson('json/belavados_night_sky.json')
});

const state = api.state;
if(state.lore.provinces.length !== 28) throw new Error('Expected 28 provinces after JSON merge');
if(state.lore.deities.length !== 22) throw new Error('Expected 22 gods after JSON merge');
if(state.lore.factions.length < 300) throw new Error('Expected faction directory after JSON merge');
if(context.window.ONYX_TOOLS_DATA.jsonQuestHooks.length < 700) throw new Error('Expected quest hooks after JSON merge');
if(context.window.ONYX_TOOLS_DATA.jsonEncounterDirectory.length < 500) throw new Error('Expected encounter directory after JSON merge');

const diceExprs = T.naturalDiceInputToExpressions('roll 2d20+5, 3d6+2 and 1d8');
if(diceExprs.length !== 3 || !diceExprs.includes('2d20+5') || !diceExprs.includes('3d6+2') || !diceExprs.includes('1d8')) throw new Error('Natural dice parser failed: ' + JSON.stringify(diceExprs));
const roll = T.rollExpression('2d20+5');
if(!roll.diceGroups[0].numericRolls || roll.diceGroups[0].numericRolls.length !== 2) throw new Error('numericRolls not preserved in command dice result');
const payload = T.buildDiceMainPayload([roll], roll.total);
if(!payload || !payload.requestedResults.length || !/^1d20\+1d20/.test(payload.expression)) throw new Error('dice-main payload failed: ' + JSON.stringify(payload));

const gods = T.findStructuredLore('gods pantheon Nebyrr', 5);
if(!gods.some(h => h.kind === 'God' && /Nebyrr/i.test(h.title))) throw new Error('Pantheon lore search failed');
const factions = T.findStructuredLore('factions Mythraelyn', 5);
if(!factions.some(h => h.kind === 'Faction')) throw new Error('Faction lore search failed');
const quests = T.findStructuredLore('quest hooks Astraevos Clockwork Hour', 5);
if(!quests.some(h => h.kind === 'Quest Hook')) throw new Error('Quest hook lore search failed');
const naturalLore = T.handleCommand('tell me about the gods');
if(!/JSON Directory Lore|God:/i.test(naturalLore)) throw new Error('Natural lore question did not route to lore search');
const questHtml = T.handleCommand('quest cursed ferry dock with faction pressure');
if(!/Quest Help/i.test(questHtml) || /undefined/.test(questHtml)) throw new Error('Quest generation failed or emitted undefined');
const enhanced = context.window.OnyxEnhancedAbilities;
if(!enhanced || !enhanced.__test) throw new Error('Enhanced D&D scanner module missing');
const advancedRoll = enhanced.__test.rollExpression('4d6dl1');
if(!advancedRoll.parts[0].keepDrop || advancedRoll.parts[0].rolls.length !== 4) throw new Error('Advanced keep/drop dice failed');
const enhancedHelp = T.handleCommand('scanner help');
if(!/Extra D&D Commands|scan sheet|4d6dl1/i.test(enhancedHelp)) throw new Error('Enhanced command routing failed');

console.log(JSON.stringify({
  ok:true,
  jsonPulls: pullEntries.length,
  provinces: state.lore.provinces.length,
  gods: state.lore.deities.length,
  factions: state.lore.factions.length,
  questHooks: context.window.ONYX_TOOLS_DATA.jsonQuestHooks.length,
  encounterRecords: context.window.ONYX_TOOLS_DATA.jsonEncounterDirectory.length,
  diceExpressions: diceExprs,
  diceMainExpression: payload.expression,
  structuredLoreExamples: {
    gods: gods.slice(0,2).map(h => h.title),
    factions: factions.slice(0,2).map(h => h.title),
    quests: quests.slice(0,2).map(h => h.title)
  },
  overflowPatch:true
}, null, 2));
