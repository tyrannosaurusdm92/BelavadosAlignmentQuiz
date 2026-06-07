
(function(){
  'use strict';
  const LS = window.LifeSim;
  LS.generateFactions = (config, locations, npcs) => {
    const factionRules = LS.data.factions;
    const deity = LS.choose(config.primaryDeities || [], 'Nebyrr');
    const biome = LS.choose(config.biomeStack || [], {category:'Hybrid', option:'mixed settlement'});
    const local = [
      `${config.settlementName} Wardens Compact`,
      `${config.settlementName} Guild Ledger`,
      `${config.settlementName} ${deity} Shrine-Circle`,
      `${config.province} Transit Compact`,
      `${config.province} Black Ledger Cell`
    ];
    if(/Capital|City/i.test(config.settlementSize)) local.push(`${config.settlementName} Underledger`);
    if(/Ocean|underwater|reef|beach/i.test(`${biome.category} ${biome.option}`)) local.push(`${config.settlementName} Tidewatch`);
    if(/Forest|tree|marsh|swamp/i.test(`${biome.category} ${biome.option}`)) local.push(`${config.settlementName} Greenwarden Court`);
    if(/Mountain|cavern|valley/i.test(`${biome.category} ${biome.option}`)) local.push(`${config.settlementName} Deepworks Accord`);
    const leaders = LS.shuffle(npcs).slice(0, local.length);
    const factions = local.map((name,i)=>{
      const rival = LS.choose(local.filter(x=>x!==name)) || 'Black Ichor Ledger';
      return {id:LS.uid('fac'), name, scope:'local / province', leader:leaders[i]?.name || 'unassigned leader', standing:LS.choose(factionRules.standingTrack).label, patron: name.includes('Shrine') ? deity : LS.choose(['Nebyrr','Raeshkul','Marduthor','Bastveig','Sigrananna','Nefarokir']), rival, base:LS.choose(locations)?.name || config.settlementName, alignmentTest:LS.choose(['Altruism','Lawfulness','Cooperation','Honor']), function:LS.choose(['permits and records','route control','food supply','shrine rites','faction diplomacy','criminal pressure','labor mediation','omen response']), questHook:LS.questSeed(config, name, rival)};
    });
    (factionRules.crossSettlementFactions || []).slice(0,8).forEach(f=>{
      factions.push({id:LS.uid('fac'), name:f.name, scope:'cross-settlement', leader:LS.choose(npcs)?.name || 'regional officer', standing:'Known', patron:f.patron, rival:f.rival, base:config.province, alignmentTest:LS.choose(['Altruism','Lawfulness','Cooperation','Honor']), function:f.function, questHook:LS.questSeed(config, f.name, f.rival)});
    });
    return factions;
  };
  LS.questSeed = (config, faction, rival) => {
    const template = LS.choose(LS.data.factions.questSeedTemplates || []);
    const object = LS.choose(['portal passbook','sealed-ruin map','marriage contract','ferry ledger','funeral registry','moon-omen clock','medicine chest','charter stamp']);
    const location = LS.choose(['customs vault','under-rail station','noble court','reef sanctuary','archive annex','storm shelter','steamship lane','fungal market']);
    const conflict = LS.choose(['temple festival schism','fey boundary violation','route permit crackdown','labor strike','burial register dispute','reef salvage claim']);
    const route = LS.choose(['steamship lane','caravan road','submarine route','under-rail line','skyship mooring','portal customs hall']);
    const record = LS.choose(['death ledger','noble marriage contract','faction standing record','route tax book','birth archive']);
    const scheme = LS.choose(['ichor smuggling route','forged permit market','illegal shrine tithe','counterfeit medicine chain']);
    return template.replace('{object}', object).replace('{location}', location).replace('{conflict}', conflict).replace('{faction}', faction).replace('{rival}', rival).replace('{route}', route).replace('{record}', record).replace('{scheme}', scheme) + ` Deadline: Earth-first using ${config.timeZone}; add Belavadös date and moon omen.`;
  };
  LS.generateIntrigue = (config, locations, npcs, factions) => {
    return LS.shuffle(factions).slice(0,8).map(f=>({id:LS.uid('plot'), faction:f.name, title:LS.choose(['The Missing Seal','The Wrong Name in the Ledger','The Tide That Arrived Early','The Permit with Two Owners','The Shrine Bell That Rang Underwater']), hook:f.questHook, involvedNPC:LS.choose(npcs)?.name || 'unassigned', location:LS.choose(locations)?.name || config.settlementName, playerSafe:`A public dispute involving ${f.name} needs outside help.`, dmSecret:LS.choose(['The rival is technically right.','A household secret is the real cause.','The deadline is tied to a moon phase.','The quest giver omitted a death record.'])}));
  };
})();
