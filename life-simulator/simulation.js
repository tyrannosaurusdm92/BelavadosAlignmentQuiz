
(function(){
  'use strict';
  const LS = window.LifeSim;
  LS.applyGenerated = (partial) => {
    LS.state = Object.assign(LS.state, partial);
    LS.flattenServices?.();
    LS.state.validations = LS.validateState();
    LS.saveLocal();
    LS.render?.();
  };
  LS.generateFull = () => {
    const config = LS.getConfig();
    LS.rng = LS.random(`${config.seedWord}|${config.settlementName}|${config.province}|${config.generatedAt}`);
    LS.setStatus('Generating living settlement...', '');
    const locations = LS.generateLocations(config);
    const npcs = LS.generateNPCs(config, locations);
    const relationships = LS.generateRelationships(npcs, config);
    const households = LS.generateHouseholds(npcs, locations, config);
    const schedules = LS.generateSchedules(npcs, locations, config);
    const factions = LS.generateFactions(config, locations, npcs);
    const intrigue = LS.generateIntrigue(config, locations, npcs, factions);
    LS.applyGenerated({config, locations, npcs, relationships, households, schedules, factions, intrigue});
    LS.setStatus(`Generated ${locations.length} locations, ${npcs.length} NPCs, ${relationships.length} relationship records, ${households.length} households, and ${factions.length} factions.`, 'ok');
    LS.log('Generated full living settlement.');
  };
  LS.generateLocationsOnly = () => {
    const config = LS.getConfig(); LS.rng = LS.random(`${config.seedWord}|locations|${config.generatedAt}`);
    const locations = LS.generateLocations(config);
    LS.applyGenerated({config, locations});
    LS.setStatus(`Generated ${locations.length} locations and preserved other data until a full generation refresh.`, 'ok');
  };
  LS.generateNPCsOnly = () => {
    const config = LS.getConfig(); LS.rng = LS.random(`${config.seedWord}|npcs|${config.generatedAt}`);
    const locations = LS.state.locations?.length ? LS.state.locations : LS.generateLocations(config);
    const npcs = LS.generateNPCs(config, locations);
    const relationships = LS.generateRelationships(npcs, config);
    const households = LS.generateHouseholds(npcs, locations, config);
    const schedules = LS.generateSchedules(npcs, locations, config);
    LS.applyGenerated({config, locations, npcs, relationships, households, schedules});
    LS.setStatus(`Generated ${npcs.length} NPCs with relationships, households, and schedules.`, 'ok');
  };
  LS.rerollMissing = () => {
    const config = LS.getConfig();
    if(!LS.state.locations?.length) LS.state.locations = LS.generateLocations(config);
    if(!LS.state.npcs?.length) LS.state.npcs = LS.generateNPCs(config, LS.state.locations);
    if(!LS.state.relationships?.length) LS.state.relationships = LS.generateRelationships(LS.state.npcs, config);
    if(!LS.state.households?.length) LS.state.households = LS.generateHouseholds(LS.state.npcs, LS.state.locations, config);
    if(!LS.state.schedules?.length) LS.state.schedules = LS.generateSchedules(LS.state.npcs, LS.state.locations, config);
    if(!LS.state.factions?.length) LS.state.factions = LS.generateFactions(config, LS.state.locations, LS.state.npcs);
    if(!LS.state.intrigue?.length) LS.state.intrigue = LS.generateIntrigue(config, LS.state.locations, LS.state.npcs, LS.state.factions);
    LS.applyGenerated({config});
    LS.setStatus('Filled missing generated sections without destroying existing sections.', 'ok');
  };
  LS.validateState = () => {
    const warnings = [];
    const config = LS.state.config || LS.getConfig();
    const locs = LS.state.locations || [];
    const npcs = LS.state.npcs || [];
    const biomeText = (config.biomeStack||[]).map(b=>b.option).join(' ');
    const has = rx => locs.some(l=>rx.test(`${l.name} ${l.type} ${l.category}`));
    if(!config.primaryDeities?.length) warnings.push({level:'warning', message:'No primary deity selected.'});
    if(!config.raceCache?.length && !LS.state.raceCache?.length) warnings.push({level:'info', message:'Race cache is empty; generation uses the full weighted Belavadös race mix.'});
    if(/underwater/i.test(biomeText) && !has(/submarine/i)) warnings.push({level:'warning', message:'Underwater settlements require submarine access.'});
    if(/Capital/i.test(config.settlementSize) && !has(/portal/i)) warnings.push({level:'info', message:'Capital cities normally require at least one portal facility unless disabled by the DM.'});
    if(!has(/hospital|healer|clinic|apothecary|medicine/i)) warnings.push({level:'warning', message:'This settlement has no medical location.'});
    if(!has(/tavern|inn|restaurant|market|bakery|food|farm|granary/i)) warnings.push({level:'warning', message:'This settlement has no obvious food source.'});
    if(!has(/house|apartment|boarding|tenement|rowhouse|loft|residence|hostel|inn/i)) warnings.push({level:'warning', message:'This settlement has no housing.'});
    if(npcs.length > 1500) warnings.push({level:'info', message:'NPC count is very large and may slow the browser.'});
    locs.filter(l=>l.validationNote).forEach(l=>warnings.push({level:'warning', message:`${l.name}: ${l.validationNote}`}));
    (LS.state.factions||[]).filter(f=>!f.leader || f.leader==='unassigned leader').forEach(f=>warnings.push({level:'warning', message:`${f.name} has no leader.`}));
    locs.filter(l=>(l.services||[]).some(s=>!s.price)).forEach(l=>warnings.push({level:'warning', message:`${l.name} has services but missing price data.`}));
    return warnings;
  };
})();
