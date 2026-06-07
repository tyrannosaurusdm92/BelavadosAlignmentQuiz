
(function(){
  'use strict';
  const LS = window.LifeSim;
  const districtPrefixes = ['North','South','East','West','Old','New','High','Low','Moonlit','Iron','Root','Harbor','Lantern','Market','Shrine','Canal','Under','Sky','Tide','Fungal'];
  const descriptors = ['licensed','rumored','crowded','well-guarded','half-forgotten','politically sensitive','steam-lit','moon-blessed','quietly watched','guild-stamped','overdue for inspection','popular with travelers'];
  const badByBiome = [
    {rx:/stable|horse|farrier|open-air farm|wagon street/i, biome:/underwater/i, reason:'ordinary horse stables and surface livestock do not fit underwater districts'},
    {rx:/open-air farm|greenhouse when surface|skyship roofport/i, biome:/deep cavern/i, reason:'open-sky services do not fit deep cavern districts unless magically enclosed'},
    {rx:/heavy wagon|freight rail yard/i, biome:/treetops/i, reason:'heavy wagon streets do not fit treetop-only areas'}
  ];
  LS.locationAllowed = (name, config) => {
    const biomeText = (config.biomeStack||[]).map(b=>b.option).join(' ');
    for(const rule of badByBiome){ if(rule.biome.test(biomeText) && rule.rx.test(name)) return {ok:false, reason:rule.reason}; }
    return {ok:true};
  };
  LS.locationDescription = (name, category, config) => {
    const biome = LS.choose((config.biomeStack||[]).map(b=>b.option), 'mixed settlement');
    const deity = LS.choose(config.primaryDeities || [], 'the local pantheon');
    const tag = LS.choose(config.tags || [], 'local custom');
    return `${name} is a ${LS.choose(descriptors)} ${category.toLowerCase()} site shaped by ${biome}. Locals connect it to ${deity}, ${tag}, and the settlement’s ${config.economy || 'guild economy'}.`;
  };
  LS.generateLocationName = (base, used, config) => {
    const seed = config.seedWord ? `${config.seedWord} ` : '';
    let name = `${LS.choose(districtPrefixes)} ${base}`.replace(/\s+/g,' ').trim();
    if(seed && LS.rng() < .25) name = `${seed}${base}`;
    let n = name, i=2;
    while(used.has(n.toLowerCase())){ n = `${name} ${i++}`; }
    used.add(n.toLowerCase());
    return n;
  };
  LS.pickLocationPool = (config) => {
    const all = LS.data.locations.settlementTypes || [];
    const size = config.settlementSize;
    const biomeOptions = (config.biomeStack || []).map(b => b.option.toLowerCase());
    let pools = all.filter(p => p.size === size && biomeOptions.some(b => `${p.variant} ${p.terrain}`.toLowerCase().includes(b.split(' ')[0]) || b.includes(String(p.variant||'').toLowerCase())));
    if(!pools.length) pools = all.filter(p => p.size === size);
    if(!pools.length) pools = all;
    return pools.flatMap(p => (p.locations || []).map(name => ({base:name, source:p})));
  };
  LS.generateLocations = (config) => {
    const pool = LS.pickLocationPool(config);
    const used = new Set();
    const out = [];
    let guard=0;
    while(out.length < config.locationCount && guard < config.locationCount*20){
      guard++;
      const pick = LS.choose(pool);
      if(!pick) break;
      const allowed = LS.locationAllowed(pick.base, config);
      if(!allowed.ok && LS.rng() < .85) continue;
      const name = LS.generateLocationName(pick.base, used, config);
      const category = LS.categorizeLocation(pick.base);
      const loc = {
        id: LS.uid('loc'), name, type: pick.base, category,
        biome: LS.choose(config.biomeStack || [], {category:'Hybrid', option:'mixed settlement'}),
        district: LS.choose(districtPrefixes) + ' District',
        ownership: LS.choose(['family-owned','guild-chartered','temple-advised','civic-run','cooperative','private patron','quietly faction-backed']),
        hours: LS.choose(['dawn to dusk','sunset to second bell','always staffed','market days only','by appointment','late night and early morning']),
        reputation: LS.choose(['trusted','expensive','rowdy','secretive','overcrowded','haunted by rumors','politically protected','beloved by locals']),
        description: LS.locationDescription(name, category, config),
        rumor: LS.choose(['A ledger page went missing last night.','Someone paid in old imperial coin.','A regular visitor has two names.','The owner knows a forbidden route.','An heirloom in the back room hums under moonlight.']),
        secret: LS.choose(['A hidden faction meets after closing.','The cellar connects to an older district.','The proprietor is shielding a rival agent.','A service item is mislabeled to avoid taxes.','The founding deed names a dead god.']),
        plotHook: LS.choose(['Recover a stolen passbook.','Protect a witness during festival crowds.','Investigate a counterfeit supply chain.','Mediate a labor dispute before violence starts.','Find the source of a moon-omen illness.']),
        validationNote: allowed.ok ? '' : allowed.reason,
        residents: [], employees: [], visitors: [], services: []
      };
      loc.services = LS.generateServiceItems(loc, config, Math.floor(3 + LS.rng()*5));
      out.push(loc);
    }
    // Guarantee core support types.
    const required = ['housing','medical','food','transportation'];
    const has = (rx) => out.some(l=>rx.test(`${l.name} ${l.type} ${l.category}`));
    const addRequired = (base) => {
      const category = LS.categorizeLocation(base);
      const name = LS.generateLocationName(base, used, config);
      const loc = {id:LS.uid('loc'), name, type:base, category, biome:LS.choose(config.biomeStack||[],{}), district:'Civic Core', ownership:'civic-chartered', hours:'always staffed', reputation:'essential', description:LS.locationDescription(name,category,config), rumor:'Everyone knows someone who works here.', secret:'The records are incomplete.', plotHook:'A missing record changes a family or faction claim.', validationNote:'', residents:[], employees:[], visitors:[], services:[]};
      loc.services = LS.generateServiceItems(loc, config, 4); out.push(loc);
    };
    if(!has(/house|apartment|residence|boarding|tenement|rowhouse|loft/i)) addRequired('Apartment row');
    if(!has(/hospital|healer|clinic|apothecary|medicine/i)) addRequired('Healer clinic');
    if(!has(/tavern|inn|restaurant|market|bakery|food/i)) addRequired('Tavern');
    const underwater = (config.biomeStack||[]).some(b=>/underwater/i.test(b.option));
    if(underwater && !has(/submarine/i)) addRequired('Submarine terminal');
    else if(!has(/rail|caravan|ferry|station|dock|terminal/i)) addRequired('Caravan station');
    return out.slice(0, Math.max(config.locationCount, required.length));
  };
})();
