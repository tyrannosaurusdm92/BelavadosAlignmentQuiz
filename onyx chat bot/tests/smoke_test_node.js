const fs = require('fs');
const vm = require('vm');
const path = require('path');

const root = path.resolve(__dirname, '..');
const context = { window: {}, console };
context.window.window = context.window;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'js/lore_seed.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(root, 'js/rulebot_engine.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(root, 'js/onyx-tools-data.js'), 'utf8'), context);

const Bot = context.window.BelavadosRuleBot;
if (!Bot) throw new Error('BelavadosRuleBot did not load');
const lore = Bot.normalizeLore(context.window.BELAVADOS_LORE_SEED);
const settlement = Bot.generateSettlement(lore, {
  command: 'create a high danger deep cavern mining town in Drakmorren named Coalveil with train and regulated portal, population 4200',
  npcCap: 80
});
if (!settlement || !settlement.schema.includes('settlement')) throw new Error('Settlement generation failed');
if (!settlement.locations || settlement.locations.length < 5) throw new Error('Settlement locations missing');
if (!settlement.npcs || settlement.npcs.length < 1) throw new Error('Settlement NPCs missing');

const npcs = Bot.generateNPCBatch(lore, { settlement, count: 12 });
if (!npcs || npcs.npcs.length !== 12) throw new Error('NPC batch generation failed');

const province = Bot.generateProvince(lore, { command: 'generate province Aelvanyr with 2 villages 1 town', fast: true, npcCap: 20 });
if (!province || !province.schema.includes('province') || province.settlements.length < 1) throw new Error('Province generation failed');

const safe = Bot.toPlayerSafe(settlement);
if (safe.npcs.some(n => Object.prototype.hasOwnProperty.call(n, 'dmSecret'))) throw new Error('Player-safe export leaked dmSecret');

const html = Bot.exportSettlementHtml(settlement);
if (!html.includes('<!DOCTYPE html>') || !html.includes(settlement.name)) throw new Error('HTML export failed');

console.log(JSON.stringify({
  ok: true,
  rulebotVersion: Bot.version,
  settlement: settlement.name,
  locations: settlement.locations.length,
  npcs: settlement.npcs.length,
  npcBatch: npcs.npcs.length,
  provinceSettlements: province.settlements.length,
  playerSafeChecked: true,
  htmlExportChecked: true
}, null, 2));


const Tools = context.window.ONYX_TOOLS_DATA;
if (!Tools || !Array.isArray(Tools.biomeTree) || Tools.biomeTree.length !== 5) throw new Error('Biome tree missing');
if (!Array.isArray(Tools.encounterPresets) || Tools.encounterPresets.length < 100) throw new Error('Encounter index missing');
if (!Tools.biomeProfiles['Deep cavern'] || !Tools.biomeProfiles['Underwater with reefs']) throw new Error('Biome profiles missing');
