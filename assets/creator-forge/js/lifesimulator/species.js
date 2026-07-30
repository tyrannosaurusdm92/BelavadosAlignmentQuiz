(function (global) {
  "use strict";
  const LS = global.LifeSimulator;
  const registry = global.LS_BOOTSTRAP.fantasy;
  const categories = registry.categories;
  const builtInRaces = registry.races;
  const builtInLineages = registry.lineages;
  const raceMap = new Map(builtInRaces.map(race => [race.raceId, race]));
  const lineageMap = new Map(builtInLineages.map(lineage => [lineage.lineageId, lineage]));

  function allRaces(state = LS.store?.get?.()) {
    return [...builtInRaces, ...((state?.customRaces || []).map(race => ({ ...race, custom: true })) || [])];
  }
  function getRace(raceId, state) { const builtIn = raceMap.get(raceId); if (builtIn) return builtIn; const custom = (state || LS.store.get()).customRaces.find(race => race.raceId === raceId); return custom ? { ...custom, custom: true } : null; }
  function getLineage(lineageId, state) {
    return lineageMap.get(lineageId) || allRaces(state).flatMap(race => race.lineages || []).find(lineage => lineage.lineageId === lineageId) || null;
  }
  function racesForCategory(categoryId, state) { return allRaces(state).filter(race => race.categoryId === categoryId); }
  function lineagesForRace(raceId, state) {
    const race = getRace(raceId, state);
    if (!race) return [];
    if (race.custom) return race.lineages || [];
    return builtInLineages.filter(lineage => lineage.parentRaceId === raceId);
  }
  function categoryOptions(selected = "") {
    return categories.map(category => `<option value="${category.categoryId}"${category.categoryId === selected ? " selected" : ""}>${category.order}. ${LS.util.escape(category.name)}</option>`).join("");
  }
  function raceOptions(categoryId, selected = "", state) {
    return racesForCategory(categoryId, state).map(race => `<option value="${race.raceId}"${race.raceId === selected ? " selected" : ""}>${LS.util.escape(race.name)}</option>`).join("");
  }
  function lineageOptions(raceId, selected = "", state, allowNone = true) {
    const options = lineagesForRace(raceId, state).map(lineage => `<option value="${lineage.lineageId}"${lineage.lineageId === selected ? " selected" : ""}>${LS.util.escape(lineage.name)}</option>`).join("");
    return `${allowNone ? `<option value="">None</option>` : ""}${options}`;
  }
  function addCustomRace(record) {
    const createdAt = LS.util.now();
    const category = categories.find(item => item.categoryId === record.categoryId) || categories[22];
    const race = {
      raceId: record.raceId || LS.util.uid("race"), name: record.name.trim(), plural: record.plural?.trim() || `${record.name.trim()}s`,
      selectionLabel: record.name.trim(), categoryId: category.categoryId, familyId: category.categoryId,
      category: category.name, family: category.name, categoryNumber: category.order, isAlienFolk: category.order === 23,
      selectorType: record.lineages?.length ? "user_defined_lineage_or_bloodline" : null,
      lineageIds: [], lineages: [], canonicalProfile: record.profile || "", generation: { enabled: true, weight: 1 },
      traits: record.traits || {}, physiology: record.physiology || {}, cultureNotes: record.cultureNotes || "",
      habitat: record.habitat || [], communication: record.communication || [], capabilities: record.capabilities || [], limitations: record.limitations || [],
      eraRange: record.eraRange || { min: 0, max: 10 }, tokenArt: record.tokenArt || {}, createdAt, modifiedAt: createdAt,
      source: "user", protected: false, schemaVersion: LS.CONFIG.schemaVersion
    };
    race.lineages = (record.lineages || []).filter(item => item.name?.trim()).map(item => ({
      lineageId: item.lineageId || LS.util.uid("lineage"), parentRaceId: race.raceId, parentRaceName: race.name,
      categoryId: category.categoryId, category: category.name, name: item.name.trim(), selectorType: "user_defined_lineage_or_bloodline",
      description: item.description || "", tokenArt: item.tokenArt || {}, schemaVersion: LS.CONFIG.schemaVersion, protected: false
    }));
    race.lineageIds = race.lineages.map(lineage => lineage.lineageId);
    LS.store.update(state => { state.customRaces.push(race); state.ui.selectedRaceId = race.raceId; return state; });
    return race;
  }
  function updateCustomRace(raceId, changes) {
    let updated = null;
    LS.store.update(state => {
      const index = state.customRaces.findIndex(race => race.raceId === raceId);
      if (index < 0) return state;
      updated = { ...state.customRaces[index], ...changes, modifiedAt: LS.util.now() };
      state.customRaces[index] = updated;
      return state;
    });
    return updated;
  }
  function removeCustomRace(raceId) {
    LS.store.update(state => {
      state.customRaces = state.customRaces.filter(race => race.raceId !== raceId);
      state.npcs.forEach(npc => { if (npc.raceId === raceId) npc.validationWarnings = [...(npc.validationWarnings || []), "Referenced custom race was removed."]; });
      return state;
    });
  }

  LS.species = Object.freeze({ registry, categories, builtInRaces, builtInLineages, allRaces, getRace, getLineage, racesForCategory, lineagesForRace, categoryOptions, raceOptions, lineageOptions, addCustomRace, updateCustomRace, removeCustomRace });
})(window);
