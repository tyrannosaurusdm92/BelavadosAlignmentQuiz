(() => {
  "use strict";

  const STORE_KEY = "belavados.lifeSimulator.state.v1";
  const ONYX_HANDOFF_KEY = "belavados.lifeSimulator.onyxHandoff";
  const DATA_PATHS = {
    raceData: "data/belavados_race_categories.json",
    classData: "data/class_subclass_options.json",
    provinceData: "data/provinces_settlements.json",
    factionRules: "data/faction_rules.json",
    livingRules: "data/living_world_rules.json",
    transitRules: "data/transit_rules.json",
    visitableLocations: "data/visitable_locations.json"
  };

  const AXES = ["Altruism", "Lawfulness", "Cooperation", "Honor"];
  const AXIS_LABELS = {
    Altruism: ["Exploitative", "Protective"],
    Lawfulness: ["Rebellious", "Lawful"],
    Cooperation: ["Combative", "Cooperative"],
    Honor: ["Pragmatic", "Honorable"]
  };
  const BEL_WEEKDAYS = ["Nebday", "Sigranday", "Ishtaday", "Marduday", "Enkirday", "Anubaday", "Valkhaday"];

  const state = {
    data: null,
    scope: "settlement",
    provinceId: "",
    settlementId: "",
    danger: "Guarded",
    seed: "Belavadös",
    npcCount: 24,
    raceCache: [],
    biomeCache: [],
    alignmentPreference: { Altruism: 1500, Lawfulness: 1500, Cooperation: 1500, Honor: 1500 },
    npcs: [],
    generatedAt: null,
    warnings: []
  };

  const $ = (id) => document.getElementById(id);

  async function loadJSONWithFallback(key) {
    try {
      const response = await fetch(DATA_PATHS[key], { cache: "no-store" });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return await response.json();
    } catch (err) {
      return window.BELAVADOS_DEFAULT_DATA[key];
    }
  }

  function hashString(str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function makeRng(seed) {
    let a = hashString(String(seed || "Belavadös"));
    return function rng() {
      a += 0x6D2B79F5;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function pick(arr, rng) { return arr && arr.length ? arr[Math.floor(rng() * arr.length)] : null; }
  function sample(arr, n, rng) {
    const copy = [...(arr || [])];
    const out = [];
    while (copy.length && out.length < n) out.push(copy.splice(Math.floor(rng() * copy.length), 1)[0]);
    return out;
  }
  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
  function snap250(n) { return clamp(Math.round(n / 250) * 250, 0, 3000); }
  function slug(s) { return String(s || "item").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[’'‘`´]/g, "").replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "").toLowerCase() || "item"; }
  function escapeHTML(s) { return String(s ?? "").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c])); }

  function flattenProvinces() { return state.data.provinceData.provinces || []; }
  function flattenSettlements() { return flattenProvinces().flatMap(p => (p.settlements || []).map(s => ({ ...s, provinceId: p.id, provinceName: p.name, province: p.name }))); }
  function currentProvince() { return flattenProvinces().find(p => p.id === state.provinceId) || flattenProvinces()[0]; }
  function currentSettlement() { return flattenSettlements().find(s => s.id === state.settlementId) || (currentProvince()?.settlements || [])[0]; }
  function biomeLimit() { return state.scope === "world" ? 15 : 3; }

  function allRaceDetails() {
    return state.data.raceData.categories.flatMap(c => c.racesDetailed.map(r => ({...r, categoryId: c.categoryId, category: c.category, creatorGod: r.creatorGod || c.god})));
  }
  function allBiomeOptions() {
    return (state.data.provinceData.biomeCategories || []).flatMap(c => (c.biomes || []).map(b => ({...b, category: c.category})));
  }

  async function init() {
    state.data = {
      raceData: await loadJSONWithFallback("raceData"),
      classData: await loadJSONWithFallback("classData"),
      provinceData: await loadJSONWithFallback("provinceData"),
      factionRules: await loadJSONWithFallback("factionRules"),
      livingRules: await loadJSONWithFallback("livingRules"),
      transitRules: await loadJSONWithFallback("transitRules"),
      visitableLocations: await loadJSONWithFallback("visitableLocations")
    };
    hydrateControls();
    bindEvents();
    applyScopeRules();
    renderAll();
  }

  function hydrateControls() {
    const scopeSelect = $("scopeSelect");
    scopeSelect.value = state.scope;
    const dangerSelect = $("dangerSelect");
    dangerSelect.innerHTML = state.data.livingRules.dangerLevels.map(d => `<option value="${escapeHTML(d)}">${escapeHTML(d)}</option>`).join("");
    dangerSelect.value = state.danger;

    const psel = $("provinceSelect");
    psel.innerHTML = flattenProvinces().map(p => `<option value="${escapeHTML(p.id)}">${escapeHTML(p.name)}</option>`).join("");
    state.provinceId = state.provinceId || (flattenProvinces()[0]?.id || "");
    psel.value = state.provinceId;
    hydrateSettlements();

    const raceCat = $("raceCategorySelect");
    raceCat.innerHTML = state.data.raceData.categories.map(c => `<option value="${escapeHTML(c.categoryId)}">${escapeHTML(c.category)}</option>`).join("");
    hydrateRaceSelect();

    const biomeCat = $("biomeCategorySelect");
    biomeCat.innerHTML = (state.data.provinceData.biomeCategories || []).map(c => `<option value="${escapeHTML(c.category)}">${escapeHTML(c.category)}</option>`).join("");
    hydrateBiomeSelect();
    hydrateAlignmentControls();
  }

  function hydrateSettlements() {
    const p = currentProvince();
    const ssel = $("settlementSelect");
    ssel.innerHTML = (p?.settlements || []).map(s => `<option value="${escapeHTML(s.id)}">${escapeHTML(s.name)} — ${escapeHTML(s.type)}</option>`).join("");
    if (!state.settlementId || !(p?.settlements || []).some(s => s.id === state.settlementId)) state.settlementId = p?.settlements?.[0]?.id || "";
    ssel.value = state.settlementId;
  }

  function hydrateRaceSelect() {
    const catId = $("raceCategorySelect").value || state.data.raceData.categories[0]?.categoryId;
    const cat = state.data.raceData.categories.find(c => c.categoryId === catId) || state.data.raceData.categories[0];
    $("raceSelect").innerHTML = (cat?.racesDetailed || []).map(r => `<option value="${escapeHTML(r.id)}">${escapeHTML(r.name)}</option>`).join("");
  }

  function hydrateBiomeSelect() {
    const catName = $("biomeCategorySelect").value || state.data.provinceData.biomeCategories?.[0]?.category;
    const cat = (state.data.provinceData.biomeCategories || []).find(c => c.category === catName);
    $("biomeSelect").innerHTML = (cat?.biomes || []).map(b => `<option value="${escapeHTML(b.id)}">${escapeHTML(b.name)}</option>`).join("");
  }

  function hydrateAlignmentControls() {
    const wrap = $("alignmentControls");
    wrap.innerHTML = AXES.map(axis => {
      const [low, high] = AXIS_LABELS[axis];
      const value = state.alignmentPreference[axis];
      return `<div class="alignment-row" data-axis="${axis}">
        <header><b>${axis}</b><span id="${axis}Value">${value} — ${describeAxis(axis, value)}</span></header>
        <input type="range" min="0" max="3000" step="250" value="${value}" data-align-range="${axis}" />
        <div class="axis-extremes"><span>${low}</span><span>Neutral</span><span>${high}</span></div>
      </div>`;
    }).join("");
  }

  function bindEvents() {
    $("scopeSelect").addEventListener("change", () => { state.scope = $("scopeSelect").value; applyScopeRules(); renderAll(); });
    $("provinceSelect").addEventListener("change", () => { state.provinceId = $("provinceSelect").value; hydrateSettlements(); state.settlementId = $("settlementSelect").value; renderAll(); });
    $("settlementSelect").addEventListener("change", () => { state.settlementId = $("settlementSelect").value; renderAll(); });
    $("dangerSelect").addEventListener("change", () => { state.danger = $("dangerSelect").value; renderAll(); });
    $("seedInput").addEventListener("input", () => { state.seed = $("seedInput").value; });
    $("npcCount").addEventListener("input", () => { state.npcCount = parseInt($("npcCount").value, 10) || 1; });
    $("raceCategorySelect").addEventListener("change", hydrateRaceSelect);
    $("biomeCategorySelect").addEventListener("change", hydrateBiomeSelect);
    $("addRaceBtn").addEventListener("click", addRaceToCache);
    $("addBiomeBtn").addEventListener("click", addBiomeToCache);
    $("generateNpcsBtn").addEventListener("click", generateNPCs);
    $("clearNpcsBtn").addEventListener("click", () => { state.npcs = []; state.generatedAt = null; renderAll(); });
    $("saveStateBtn").addEventListener("click", saveProgress);
    $("loadStateBtn").addEventListener("click", loadProgress);
    $("resetStateBtn").addEventListener("click", resetState);
    $("openOnyxButton").addEventListener("click", openOnyx);
    $("exportAllBtn").addEventListener("click", () => exportNPCs("all"));
    $("exportWorldBtn").addEventListener("click", () => exportNPCs("world"));
    $("exportProvinceBtn").addEventListener("click", () => exportNPCs("province"));
    $("exportSettlementBtn").addEventListener("click", () => exportNPCs("settlement"));
    $("exportProvinceDataBtn").addEventListener("click", exportProvinceData);
    $("importProvinceFile").addEventListener("change", importProvinceFile);
    $("importSaveFile").addEventListener("change", importSaveFile);
    $("npcSearch").addEventListener("input", renderNPCs);
    document.addEventListener("input", (e) => {
      if (e.target.matches("[data-align-range]")) {
        const axis = e.target.dataset.alignRange;
        state.alignmentPreference[axis] = parseInt(e.target.value, 10);
        const label = $(`${axis}Value`);
        if (label) label.textContent = `${state.alignmentPreference[axis]} — ${describeAxis(axis, state.alignmentPreference[axis])}`;
        renderWarnings();
      }
    });
  }

  function applyScopeRules() {
    $("scopeSelect").value = state.scope;
    const rules = state.data?.livingRules?.scopeRules?.[state.scope];
    const p = $("provinceSelect");
    const s = $("settlementSelect");
    p.disabled = !rules?.provinceEnabled;
    s.disabled = !rules?.settlementEnabled;
    if (state.biomeCache.length > biomeLimit()) state.biomeCache = state.biomeCache.slice(0, biomeLimit());
    $("scopeHint").textContent = state.scope === "world"
      ? "Whole World selected: province and settlement selection are locked, biome cache expands to 15, and NPC travel can cross the world."
      : state.scope === "province"
      ? "Whole Province selected: settlement selection is locked, and NPC travel stays inside the selected province."
      : "Single Settlement selected: NPCs stay mostly inside their selected settlement with occasional local errands.";
    $("biomeLimitHint").textContent = `Biome cache limit: ${biomeLimit()} selected biome${biomeLimit() === 1 ? "" : "s"}.`;
  }

  function addRaceToCache() {
    const raceId = $("raceSelect").value;
    const race = allRaceDetails().find(r => r.id === raceId);
    if (!race) return;
    if (!state.raceCache.some(r => r.id === race.id)) state.raceCache.push(race);
    renderCaches();
    renderWarnings();
  }

  function addBiomeToCache() {
    const biomeId = $("biomeSelect").value;
    const biome = allBiomeOptions().find(b => b.id === biomeId);
    if (!biome) return;
    if (state.biomeCache.some(b => b.id === biome.id)) return;
    if (state.biomeCache.length >= biomeLimit()) {
      warnOnce(`Biome cache is already at its current limit of ${biomeLimit()}.`);
      return;
    }
    state.biomeCache.push(biome);
    renderCaches();
    renderWarnings();
  }

  function warnOnce(message) {
    if (!state.warnings.includes(message)) state.warnings.push(message);
    renderWarnings();
  }

  function renderCaches() {
    $("raceCache").innerHTML = state.raceCache.length ? state.raceCache.map(r => `<span class="chip">${escapeHTML(r.name)} <button data-remove-race="${escapeHTML(r.id)}" title="Remove">×</button></span>`).join("") : `<span class="hint">No race cache yet. Add at least one race or generation will use all races.</span>`;
    $("biomeCache").innerHTML = state.biomeCache.length ? state.biomeCache.map(b => `<span class="chip">${escapeHTML(b.category)}: ${escapeHTML(b.name)} <button data-remove-biome="${escapeHTML(b.id)}" title="Remove">×</button></span>`).join("") : `<span class="hint">No biome cache yet. Add biomes to guide location and travel assignment.</span>`;
    document.querySelectorAll("[data-remove-race]").forEach(btn => btn.addEventListener("click", () => { state.raceCache = state.raceCache.filter(r => r.id !== btn.dataset.removeRace); renderCaches(); renderWarnings(); }));
    document.querySelectorAll("[data-remove-biome]").forEach(btn => btn.addEventListener("click", () => { state.biomeCache = state.biomeCache.filter(b => b.id !== btn.dataset.removeBiome); renderCaches(); renderWarnings(); }));
  }

  function renderAll() {
    $("seedInput").value = state.seed;
    $("npcCount").value = state.npcCount;
    $("dangerSelect").value = state.danger;
    applyScopeRules();
    renderCaches();
    renderSummary();
    renderWarnings();
    renderNPCs();
    writeOnyxHandoff();
  }

  function renderSummary() {
    const province = currentProvince();
    const settlement = currentSettlement();
    const scopeName = state.data.livingRules.scopeRules[state.scope].label;
    $("summaryLine").textContent = `${scopeName}. ${province ? province.name : "No province"}${state.scope === "settlement" && settlement ? ` → ${settlement.name}` : ""}. ${state.npcs.length} NPCs in memory.`;
    const factionCount = new Set(state.npcs.map(n => n.faction?.name).filter(Boolean)).size;
    const settlementCount = new Set(state.npcs.map(n => n.assignment?.settlementId).filter(Boolean)).size;
    const provinceCount = new Set(state.npcs.map(n => n.assignment?.provinceId).filter(Boolean)).size;
    $("statsGrid").innerHTML = [
      [state.npcs.length, "Generated NPCs"], [state.raceCache.length || "All", "Race Cache"], [state.biomeCache.length, `Biome Cache / ${biomeLimit()}`], [provinceCount, "Used Provinces"], [settlementCount, "Used Settlements"], [factionCount, "Active Factions"]
    ].map(([num,label]) => `<div class="stat"><strong>${escapeHTML(num)}</strong><span>${escapeHTML(label)}</span></div>`).join("");
  }

  function validate() {
    const warnings = [];
    if (!state.raceCache.length) warnings.push("Race cache is empty; generation will draw from the full race list.");
    if (!state.biomeCache.length) warnings.push("Biome cache is empty; NPCs may use any settlement biome.");
    if (state.scope === "settlement" && !state.settlementId) warnings.push("No settlement is selected.");
    if (state.scope === "province" && !state.provinceId) warnings.push("No province is selected.");
    if (state.scope !== "world" && state.biomeCache.length > 3) warnings.push("Non-world scopes should use no more than 3 biomes.");
    for (const axis of AXES) {
      const v = state.alignmentPreference[axis];
      if (v <= 500 || v >= 2500) warnings.push(`${axis} preference is at an extreme; generated NPCs will show sharper civic pressure on that axis.`);
    }
    state.warnings = [...new Set([...warnings, ...state.warnings.filter(w => w.startsWith("Imported") || w.includes("already"))])].slice(0, 12);
  }

  function renderWarnings() {
    validate();
    $("warnings").innerHTML = state.warnings.length ? state.warnings.map(w => `<div class="warning">${escapeHTML(w)}</div>`).join("") : `<div class="hint">No validation warnings.</div>`;
  }

  function describeAxis(axis, value) {
    const negative = { Altruism:"self-serving", Lawfulness:"rebellious", Cooperation:"combative", Honor:"pragmatic" }[axis];
    const positive = { Altruism:"altruistic", Lawfulness:"lawful", Cooperation:"cooperative", Honor:"honorable" }[axis];
    const d = value - 1500;
    if (Math.abs(d) < 125) return `true neutral / balanced ${axis.toLowerCase()}`;
    const word = d < 0 ? negative : positive;
    const ad = Math.abs(d);
    const degree = ad >= 1000 ? "extremely" : ad >= 750 ? "very" : ad >= 500 ? "moderately" : "slightly";
    return `${degree} ${word}`;
  }

  function generateNPCs() {
    state.seed = $("seedInput").value || "Belavadös";
    state.npcCount = clamp(parseInt($("npcCount").value, 10) || 1, 1, 500);
    const rng = makeRng(`${state.seed}|${state.scope}|${Date.now()}`);
    const selectedSettlements = settlementsForScope();
    const races = state.raceCache.length ? state.raceCache : allRaceDetails();
    if (!selectedSettlements.length) {
      warnOnce("No settlements matched the current province/biome filters. Add a broader biome or import a fuller province file.");
      return;
    }
    const npcs = [];
    for (let i = 0; i < state.npcCount; i++) {
      const settlement = pick(selectedSettlements, rng);
      const province = flattenProvinces().find(p => p.id === settlement.provinceId || p.name === settlement.provinceName || p.name === settlement.province);
      const race = pick(races, rng);
      const npc = makeNPC(i, race, province, settlement, rng);
      npcs.push(npc);
    }
    createRelationships(npcs, rng);
    state.npcs = npcs;
    state.generatedAt = new Date().toISOString();
    state.warnings = state.warnings.filter(w => !w.includes("already at"));
    renderAll();
  }

  function settlementsForScope() {
    let settlements = [];
    if (state.scope === "world") settlements = flattenSettlements();
    else if (state.scope === "province") settlements = (currentProvince()?.settlements || []).map(s => ({...s, provinceId: currentProvince().id, provinceName: currentProvince().name, province: currentProvince().name}));
    else settlements = currentSettlement() ? [{...currentSettlement()}] : [];
    if (state.biomeCache.length) {
      const ids = new Set(state.biomeCache.map(b => b.id));
      const filtered = settlements.filter(s => (s.biomes || []).some(b => ids.has(b.id)));
      if (filtered.length) settlements = filtered;
    }
    return settlements;
  }

  function makeNPC(index, race, province, settlement, rng) {
    const gender = pick(state.data.livingRules.genderIdentities, rng);
    const age = Math.floor(16 + rng() * 62);
    const name = makeName(race, gender, rng);
    const job = pick(weightJobsForSettlement(settlement), rng);
    const locations = assignLocations(job, province, settlement, rng);
    const faction = chooseFaction(job, locations.work?.name || "", rng);
    const classInfo = chooseClass(job, faction, rng);
    const alignment = makeAlignment(race, rng);
    const traits = sample(state.data.livingRules.traits, 3, rng);
    const hobbies = sample(state.data.livingRules.hobbies, 2 + Math.floor(rng()*2), rng);
    const want = pick(state.data.livingRules.wants, rng);
    const fear = pick(state.data.livingRules.fears, rng);
    const aspiration = pick(state.data.livingRules.aspirations, rng);
    const personalitySeed = pick(state.data.livingRules.personalitySeeds, rng);
    const route = makeTravelRoute(province, settlement, locations, rng);
    const npc = {
      id: `npc_${Date.now().toString(36)}_${index}_${slug(name)}`,
      name, age, genderIdentity: gender.identity, pronouns: gender.pronouns,
      race: { id: race.id, name: race.name, category: race.category, creatorGod: race.creatorGod, habitatTags: race.habitatTags || [] },
      alignment,
      alignmentSummary: AXES.map(axis => describeAxis(axis, alignment.scores[axis])).join(", "),
      job: { title: job.title, category: job.category },
      class: classInfo,
      faction,
      traits,
      personality: `${name} is ${traits.join(", ")}, and ${personalitySeed}.`,
      wants: [want], fears: [fear], aspirations: [aspiration], hobbies,
      assignment: {
        scope: state.scope,
        provinceId: province?.id || settlement.provinceId,
        provinceName: province?.name || settlement.provinceName || settlement.province,
        settlementId: settlement.id,
        settlementName: settlement.name,
        settlementType: settlement.type,
        governmentType: settlement.governmentType,
        timeZone: settlement.timeZone,
        biomes: settlement.biomes || []
      },
      assignedLocations: locations,
      travelRange: state.scope === "world" ? "world-wide" : state.scope === "province" ? "province-wide" : "settlement-wide",
      transitRoute: route,
      schedules: makeSchedule(job, locations, route, rng),
      relationships: { familial: [], romantic: [], personal: [], professional: [] },
      familyTree: { householdId: null, role: "independent", guardians: [], dependents: [], siblings: [], partners: [] },
      rumors: makeRumors(name, job, faction, locations, rng),
      secrets: makeSecret(name, job, faction, rng),
      createdAt: new Date().toISOString()
    };
    return npc;
  }

  function makeName(race, gender, rng) {
    const starts = ["Ael","Vael","Syr","Thal","Myr","Elar","Nym","Cor","Ish","Vey","Drav","Sol","Khar","Lun","Ryn","Ost","Fael","Zor","Cind","Tav","Mara","Nef","Kael","Yva","Oryn","Qel"];
    const mids = ["an","or","ith","av","un","ess","ir","al","eth","om","yr","esh","ara","iel","oth","en","is","ai"];
    const ends = ["wyn","thir","vane","rith","mora","keth","sara","dros","lune","var","neth","voss","rielle","dun","myr","zeth","rune","thara"];
    const surnames = ["Vaelriven","Duskmere","Clockroot","Emberledger","Thornwake","Glasswater","Ashdrift","Moonquill","Railborne","Vexford","Hearthglen","Mistwarden","Brassvale","Sablebrook","Stormmere","Gravecrown"];
    const raceHint = race?.name ? race.name.split(/\s|-/)[0].replace(/[^A-Za-z]/g, "") : "Bel";
    const given = `${pick(starts,rng)}${pick(mids,rng)}${pick(ends,rng)}`.replace(/\b\w/g, ch => ch.toUpperCase());
    const family = rng() < .28 ? `${raceHint}${pick(ends,rng)}` : pick(surnames, rng);
    return `${given} ${family}`;
  }

  function weightJobsForSettlement(settlement) {
    const jobs = [...state.data.livingRules.jobs];
    const biomeText = JSON.stringify(settlement.biomes || []).toLowerCase();
    const extras = [];
    if (biomeText.includes("ocean") || biomeText.includes("river") || biomeText.includes("underwater")) extras.push("Steamship Pilot", "Fisher / Tidewatcher", "Submarine Navigator");
    if (biomeText.includes("mountain") || biomeText.includes("cavern")) extras.push("Foundry Worker", "Artificer Mechanic");
    if (biomeText.includes("forest") || biomeText.includes("rainforest")) extras.push("Herbalist", "Refuge Shelter Coordinator");
    if (settlement.type === "Capital City") extras.push("Death-Ledger Clerk", "Ichor Licensing Inspector", "Temple Record-Keeper", "Cult Investigator");
    return jobs.concat(extras.map(t => jobs.find(j => j.title === t)).filter(Boolean));
  }

  function makeAlignment(race, rng) {
    const raceScores = race?.alignment || {Altruism:1500,Lawfulness:1500,Cooperation:1500,Honor:1500};
    const scores = {};
    const descriptors = {};
    for (const axis of AXES) {
      const local = state.alignmentPreference[axis] ?? 1500;
      const dangerPush = {Low: 75, Guarded: 25, Tense: -25, High: -100, Severe: -175, Catastrophic: -250}[state.danger] || 0;
      const randomLife = (rng() - .5) * 1000;
      let score = raceScores[axis] * .52 + local * .28 + (1500 + randomLife + (axis === "Honor" || axis === "Cooperation" ? dangerPush : 0)) * .20;
      scores[axis] = snap250(score);
      descriptors[axis] = describeAxis(axis, scores[axis]);
    }
    return { scale:[0,3000], scores, descriptors };
  }

  function getLocationPool(settlement) {
    const pools = state.data.visitableLocations.settlementTypes || [];
    const size = settlement.type === "Capital City" ? "Capital City" : settlement.type;
    const biomeIds = new Set((settlement.biomes || []).map(b => b.id));
    let rows = pools.filter(p => p.size === size && biomeIds.has(slug(`${p.terrain}_${p.variant}`)));
    if (!rows.length) rows = pools.filter(p => p.size === size);
    if (!rows.length) rows = pools;
    const names = [...new Set(rows.flatMap(r => r.locations || []))];
    return names.length ? names : ["House cluster", "Market hall", "Temple", "Rail station", "Public park", "Town hall"];
  }

  function findLocation(pool, keywords, fallback, rng) {
    const found = pool.filter(name => keywords.some(k => name.toLowerCase().includes(k.toLowerCase())));
    return pick(found.length ? found : pool.filter(n => fallback.some(k => n.toLowerCase().includes(k.toLowerCase()))), rng) || pick(pool, rng) || "Unassigned Location";
  }

  function makeLocationObject(name, category, settlement) {
    return { id: `loc_${slug(settlement.id)}_${slug(name)}`, name, category, settlementId: settlement.id, settlementName: settlement.name, province: settlement.provinceName || settlement.province, timeZone: settlement.timeZone };
  }

  function assignLocations(job, province, settlement, rng) {
    const pool = getLocationPool(settlement);
    const homeName = findLocation(pool, ["apartment","residence","house","boarding","tenement","rowhouse","loft"], ["house", "rental", "inn"], rng);
    const workName = findLocation(pool, job.locationKeywords || [], ["market","hall","station","office","guild","shop","temple"], rng);
    const personalName = findLocation(pool, ["park","garden","tavern","tea","library","shrine","festival","bathhouse","theater"], ["market","square"], rng);
    const professionalName = findLocation(pool, ["transit","rail","caravan","ferry","steamship","skyship","submarine","portal","customs","guild","archive","permit"], ["office", "hall", "station"], rng);
    return {
      home: makeLocationObject(homeName, "home", settlement),
      work: makeLocationObject(workName, "work", settlement),
      personal: makeLocationObject(personalName, "personal", settlement),
      professionalTravel: makeLocationObject(professionalName, "professional travel", settlement)
    };
  }

  function chooseFaction(job, workName, rng) {
    const text = `${job.title} ${job.category} ${workName}`.toLowerCase();
    const matches = state.data.factionRules.factions.filter(f => (f.jobKeywords || []).some(k => text.includes(k.toLowerCase())));
    const faction = matches.length ? pick(matches, rng) : (rng() < .18 ? pick(state.data.factionRules.factions, rng) : null);
    if (!faction) return null;
    const tierRoll = rng();
    const tier = tierRoll > .94 ? 3 : tierRoll > .72 ? 2 : tierRoll > .35 ? 1 : 0;
    const badge = ["No Badge", "Bronze Badge", "Silver Badge", "Gold Badge"][tier];
    const passEligible = tier === 3 && rng() > .45;
    return { id:faction.id, name:faction.name, role:faction.role, tier, badge, reputation: Math.floor([5,45,120,190][tier] + rng()*45), portalPass: passEligible ? pick(state.data.factionRules.portalPassTypes, rng) : null };
  }

  function parseClassHint(hint) {
    if (!hint) return null;
    const [className, subclass] = hint.split(":");
    return { className, subclass: subclass || "—" };
  }
  function chooseClass(job, faction, rng) {
    const hints = [...(job.classHints || []), ...(faction ? (state.data.factionRules.factions.find(f => f.id === faction.id)?.classOptions || []) : [])];
    if (!hints.length && rng() > .28) return { primaryClass:"Commoner", primarySubclass:"—", multiClass:false, secondaryClass:null, secondarySubclass:null, reason:"No adventuring class needed for ordinary work." };
    const first = parseClassHint(pick(hints.length ? hints : ["Fighter:Champion", "Rogue:Inquisitive", "Bard:Lore", "Cleric:Knowledge", "Artificer:Alchemist"], rng));
    const multi = rng() < .16;
    const second = multi ? parseClassHint(pick(hints.filter(h => h !== `${first.className}:${first.subclass}`).length ? hints : ["Rogue:Scout", "Bard:Eloquence", "Wizard:Divination", "Ranger:Hunter"], rng)) : null;
    return { primaryClass:first.className, primarySubclass:first.subclass, multiClass:multi, secondaryClass:second?.className || null, secondarySubclass:second?.subclass || null, reason: job.title };
  }

  function makeTravelRoute(province, settlement, locations, rng) {
    const available = Object.entries(settlement.transitProfile || {}).filter(([k,v]) => v && k !== "land").map(([k]) => k);
    const modeId = pick(available.length ? available : ["caravan"], rng);
    const mode = state.data.transitRules.modes.find(m => m.id === modeId) || {name:"Caravan"};
    let destination = settlement.name;
    if (state.scope === "province") {
      const choices = (currentProvince()?.settlements || []).filter(s => s.id !== settlement.id);
      destination = pick(choices, rng)?.name || settlement.name;
    } else if (state.scope === "world") {
      const choices = flattenSettlements().filter(s => s.id !== settlement.id);
      const d = pick(choices, rng);
      destination = d ? `${d.name}, ${d.provinceName || d.province}` : settlement.name;
    }
    return { id:`route_${slug(settlement.id)}_${modeId}_${slug(destination)}`, mode: mode.name, modeId, origin: settlement.name, destination, purpose: pick(["work transfer","supply errand","family visit","faction check-in","market day","medical escort","record delivery"], rng), access: modeId === "portal" ? "requires legal pass or official sponsorship" : "public or chartered fare" };
  }

  function makeSchedule(job, locations, route, rng) {
    const schedule = [];
    for (let i = 0; i < BEL_WEEKDAYS.length; i++) {
      const day = BEL_WEEKDAYS[i];
      const rest = day === "Ishtaday";
      schedule.push({ weekday:day, startTime:"06:00", endTime:"07:00", locationId:locations.home.id, locationName:locations.home.name, reason:"home routine", secrecy:"public", repeats:true });
      if (!rest) {
        schedule.push({ weekday:day, startTime:"08:00", endTime:"12:00", locationId:locations.work.id, locationName:locations.work.name, reason:`${job.title} duties`, secrecy:"public", repeats:true });
        schedule.push({ weekday:day, startTime:"13:00", endTime:"17:00", locationId:locations.work.id, locationName:locations.work.name, reason:"afternoon work block", secrecy:"public", repeats:true });
        if (i === 1 || i === 4) schedule.push({ weekday:day, startTime:"17:30", endTime:"19:00", locationId:locations.professionalTravel.id, locationName:locations.professionalTravel.name, transitRouteId:route.id, reason:`professional travel: ${route.purpose} by ${route.mode}`, secrecy: route.modeId === "portal" ? "logged" : "public", repeats:true });
      } else {
        schedule.push({ weekday:day, startTime:"10:00", endTime:"13:00", locationId:locations.personal.id, locationName:locations.personal.name, reason:"rest day social or worship time", secrecy:"public", repeats:true });
      }
      schedule.push({ weekday:day, startTime:"19:30", endTime:"21:00", locationId:locations.personal.id, locationName:locations.personal.name, reason:"personal time", secrecy:rng() < .16 ? "private" : "public", repeats:true });
      schedule.push({ weekday:day, startTime:"22:00", endTime:"06:00", locationId:locations.home.id, locationName:locations.home.name, reason:"sleep", secrecy:"private", repeats:true });
    }
    return schedule;
  }

  function makeRumors(name, job, faction, locations, rng) {
    const rumors = [
      `${name} changed their route after a conversation near ${locations.professionalTravel.name}.`,
      `${name} knows which ledger entry connected ${locations.work.name} to a quiet audit.`,
      `${name} is said to keep a favor owed by someone at ${locations.personal.name}.`
    ];
    if (faction) rumors.push(`${name}'s ${faction.name} badge opens doors, but also leaves a paper trail.`);
    return sample(rumors, 2 + Math.floor(rng()*2), rng);
  }
  function makeSecret(name, job, faction, rng) {
    const base = [
      `${name} once signed a witness line they did not fully understand.`,
      `${name} hides a family record that contradicts an official archive.`,
      `${name} is saving money for a journey they cannot legally explain.`,
      `${name} has seen diluted ichor used in a way that was not listed on the license.`
    ];
    if (faction) base.push(`${name} suspects someone inside ${faction.name} is using their title for private leverage.`);
    return pick(base, rng);
  }

  function createRelationships(npcs, rng) {
    // Households and family trees.
    let householdIndex = 0;
    const pool = [...npcs].sort((a,b) => b.age - a.age);
    while (pool.length) {
      const size = Math.min(pool.length, 1 + Math.floor(rng()*4));
      const members = pool.splice(0, size);
      const hid = `household_${++householdIndex}_${slug(members[0].assignedLocations.home.name)}`;
      const adults = members.filter(n => n.age >= 20);
      const youths = members.filter(n => n.age < 20);
      members.forEach(m => { m.familyTree.householdId = hid; });
      if (members.length === 1) members[0].familyTree.role = "single-person household";
      if (adults.length >= 2) {
        adults[0].relationships.familial.push(rel(adults[1], "familial", "co-guardian or close household kin"));
        adults[1].relationships.familial.push(rel(adults[0], "familial", "co-guardian or close household kin"));
      }
      youths.forEach(y => {
        y.familyTree.role = "ward or younger household member";
        adults.slice(0,2).forEach(a => {
          y.familyTree.guardians.push({id:a.id, name:a.name});
          a.familyTree.dependents.push({id:y.id, name:y.name});
          y.relationships.familial.push(rel(a, "familial", "guardian"));
          a.relationships.familial.push(rel(y, "familial", "ward"));
        });
      });
      for (let i = 0; i < members.length; i++) for (let j = i+1; j < members.length; j++) {
        if (Math.abs(members[i].age - members[j].age) < 12) {
          members[i].familyTree.siblings.push({id:members[j].id, name:members[j].name});
          members[j].familyTree.siblings.push({id:members[i].id, name:members[i].name});
        }
      }
    }
    // Romantic, personal, and professional links.
    const adults = npcs.filter(n => n.age >= 18);
    sample(adults, Math.floor(adults.length * .45), rng).forEach((a, idx, arr) => {
      if (idx % 2 === 0 && arr[idx+1]) {
        const b = arr[idx+1];
        const status = pick(state.data.livingRules.relationshipTypes.romantic.filter(x => x !== "single"), rng);
        a.relationships.romantic.push(rel(b, "romantic", status));
        b.relationships.romantic.push(rel(a, "romantic", status));
        a.familyTree.partners.push({id:b.id, name:b.name, status});
        b.familyTree.partners.push({id:a.id, name:a.name, status});
      }
    });
    npcs.forEach(a => {
      const candidates = npcs.filter(b => b.id !== a.id);
      const friend = pick(candidates, rng);
      if (friend) a.relationships.personal.push(rel(friend, "personal", pick(state.data.livingRules.relationshipTypes.personal, rng)));
      const coworker = pick(candidates.filter(b => b.job.category === a.job.category || b.faction?.id === a.faction?.id), rng);
      if (coworker) a.relationships.professional.push(rel(coworker, "professional", pick(state.data.livingRules.relationshipTypes.professional, rng)));
    });
  }
  function rel(other, category, label) { return { npcId: other.id, name: other.name, category, label }; }

  function renderNPCs() {
    const q = ($("npcSearch")?.value || "").toLowerCase().trim();
    let list = state.npcs;
    if (q) list = list.filter(n => JSON.stringify(n).toLowerCase().includes(q));
    const tpl = $("npcCardTemplate");
    const dir = $("npcDirectory");
    if (!state.npcs.length) {
      dir.innerHTML = `<p class="hint">No NPCs generated yet. Choose a scope, add cache entries as desired, then generate NPCs.</p>`;
      renderSummary();
      return;
    }
    dir.innerHTML = "";
    for (const n of list) {
      const node = tpl.content.cloneNode(true);
      node.querySelector(".npc-name").textContent = n.name;
      node.querySelector(".npc-meta").textContent = `${n.age} • ${n.genderIdentity} (${n.pronouns}) • ${n.race.name} • ${n.job.title}`;
      node.querySelector(".scope-badge").textContent = n.travelRange;
      node.querySelector(".npc-personality").textContent = n.personality;
      node.querySelector(".npc-quick").innerHTML = quickFields(n);
      node.querySelector(".alignment-bars").innerHTML = AXES.map(axis => axisBar(axis, n.alignment.scores[axis], n.alignment.descriptors[axis])).join("");
      node.querySelector(".details-body").innerHTML = detailsHTML(n);
      dir.appendChild(node);
    }
    renderSummary();
  }

  function quickFields(n) {
    const cls = n.class.multiClass ? `${n.class.primaryClass} (${n.class.primarySubclass}) / ${n.class.secondaryClass} (${n.class.secondarySubclass})` : `${n.class.primaryClass}${n.class.primarySubclass && n.class.primarySubclass !== "—" ? ` (${n.class.primarySubclass})` : ""}`;
    return [
      ["Home", `${n.assignedLocations.home.name}`],
      ["Work", `${n.assignedLocations.work.name}`],
      ["Faction", n.faction ? `${n.faction.name}, Tier ${n.faction.tier}, ${n.faction.badge}` : "None assigned"],
      ["Class", cls],
      ["Wants / Fears", `${n.wants[0]} / ${n.fears[0]}`],
      ["Aspirations", n.aspirations[0]]
    ].map(([k,v]) => `<div class="mini"><b>${escapeHTML(k)}</b>${escapeHTML(v)}</div>`).join("");
  }

  function axisBar(axis, value, descriptor) {
    const pct = (value / 3000) * 100;
    return `<div class="bar-row"><header><span>${escapeHTML(axis)}</span><span>${value}</span></header><div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div><div class="bar-caption">${escapeHTML(descriptor)}</div></div>`;
  }

  function detailsHTML(n) {
    const rels = Object.entries(n.relationships).map(([cat, arr]) => `<div><b>${cat}</b><div class="pill-list">${arr.length ? arr.map(r => `<span class="pill">${escapeHTML(r.label)}: ${escapeHTML(r.name)}</span>`).join("") : `<span class="pill">None assigned</span>`}</div></div>`).join("");
    const scheduleRows = n.schedules.slice(0, 12).map(s => `<tr><td>${escapeHTML(s.weekday)}</td><td>${escapeHTML(s.startTime)}–${escapeHTML(s.endTime)}</td><td>${escapeHTML(s.locationName)}</td><td>${escapeHTML(s.reason)}</td></tr>`).join("");
    return `<div><b>Assignment</b><p class="muted">${escapeHTML(n.assignment.settlementName)}, ${escapeHTML(n.assignment.provinceName)} • ${escapeHTML(n.assignment.timeZone)} • ${escapeHTML(n.assignment.governmentType)}</p></div>
      <div><b>Transit</b><p class="muted">${escapeHTML(n.transitRoute.mode)} from ${escapeHTML(n.transitRoute.origin)} to ${escapeHTML(n.transitRoute.destination)} for ${escapeHTML(n.transitRoute.purpose)}. Access: ${escapeHTML(n.transitRoute.access)}.</p></div>
      <div><b>Traits & Hobbies</b><div class="pill-list">${[...n.traits, ...n.hobbies].map(x => `<span class="pill">${escapeHTML(x)}</span>`).join("")}</div></div>
      <div><b>Relationships</b>${rels}</div>
      <div><b>Rumors</b><ul>${n.rumors.map(r => `<li>${escapeHTML(r)}</li>`).join("")}</ul></div>
      <div><b>Family Tree</b><p class="muted">Household: ${escapeHTML(n.familyTree.householdId || "none")} • Role: ${escapeHTML(n.familyTree.role)} • Guardians: ${n.familyTree.guardians.map(g => escapeHTML(g.name)).join(", ") || "none"} • Dependents: ${n.familyTree.dependents.map(g => escapeHTML(g.name)).join(", ") || "none"}</p></div>
      <div><b>Schedule Preview</b><table class="schedule-table"><thead><tr><th>Day</th><th>Time</th><th>Location</th><th>Reason</th></tr></thead><tbody>${scheduleRows}</tbody></table></div>`;
  }

  function exportPacket(scopeFilter) {
    let npcs = state.npcs;
    const curP = currentProvince();
    const curS = currentSettlement();
    if (scopeFilter === "world") npcs = state.npcs.filter(n => n.travelRange === "world-wide" || state.scope === "world");
    if (scopeFilter === "province") npcs = state.npcs.filter(n => n.assignment.provinceId === curP?.id || n.assignment.provinceName === curP?.name || n.travelRange === "province-wide");
    if (scopeFilter === "settlement") npcs = state.npcs.filter(n => n.assignment.settlementId === curS?.id || n.travelRange === "settlement-wide");
    return {
      schema: "belavados.lifeSimulator.npcExport.v1",
      exportedAt: new Date().toISOString(),
      scopeFilter,
      currentScope: state.scope,
      selectedProvince: curP ? {id:curP.id, name:curP.name} : null,
      selectedSettlement: curS ? {id:curS.id, name:curS.name} : null,
      raceCache: state.raceCache.map(r => ({id:r.id, name:r.name, category:r.category, creatorGod:r.creatorGod})),
      biomeCache: state.biomeCache,
      alignmentPreference: state.alignmentPreference,
      npcs
    };
  }

  function downloadJSON(filename, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], {type:"application/json"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(a.href);
    a.remove();
  }
  function exportNPCs(scopeFilter) { downloadJSON(`belavados_${scopeFilter}_npcs.json`, exportPacket(scopeFilter)); }
  function exportProvinceData() { downloadJSON("provinces_settlements.json", state.data.provinceData); }

  function saveProgress() {
    localStorage.setItem(STORE_KEY, JSON.stringify(serializeState()));
    writeOnyxHandoff();
    warnOnce("Imported or saved state is now stored in this browser.");
  }
  function loadProgress() {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) { warnOnce("No saved browser state was found."); return; }
    try { applySave(JSON.parse(raw)); warnOnce("Imported browser save successfully."); } catch (err) { warnOnce(`Could not load saved state: ${err.message}`); }
  }
  function resetState() {
    if (!confirm("Reset generated NPCs and local cache selections?")) return;
    state.raceCache = []; state.biomeCache = []; state.npcs = []; state.generatedAt = null; state.warnings = [];
    state.alignmentPreference = { Altruism:1500, Lawfulness:1500, Cooperation:1500, Honor:1500 };
    hydrateAlignmentControls(); renderAll();
  }
  function serializeState() {
    return { scope:state.scope, provinceId:state.provinceId, settlementId:state.settlementId, danger:state.danger, seed:state.seed, npcCount:state.npcCount, raceCache:state.raceCache, biomeCache:state.biomeCache, alignmentPreference:state.alignmentPreference, npcs:state.npcs, generatedAt:state.generatedAt, provinceData:state.data.provinceData };
  }
  function applySave(save) {
    Object.assign(state, { scope:save.scope || "settlement", provinceId:save.provinceId || state.provinceId, settlementId:save.settlementId || state.settlementId, danger:save.danger || state.danger, seed:save.seed || state.seed, npcCount:save.npcCount || state.npcCount, raceCache:save.raceCache || [], biomeCache:save.biomeCache || [], alignmentPreference:save.alignmentPreference || state.alignmentPreference, npcs:save.npcs || [], generatedAt:save.generatedAt || null });
    if (save.provinceData?.provinces) state.data.provinceData = save.provinceData;
    hydrateControls(); renderAll();
  }

  function openOnyx() {
    writeOnyxHandoff();
    window.open("emperor_onyx_rulebot.html", "_blank", "noopener");
  }
  function writeOnyxHandoff() {
    const packet = { timestamp:new Date().toISOString(), currentSettlementSummary: currentSettlement() || null, warnings:state.warnings, selectedBiomes:state.biomeCache, raceCacheSummary:state.raceCache.map(r => ({name:r.name, category:r.category})), factionSummary:summarizeFactions(), exportStatus:{npcCount:state.npcs.length, generatedAt:state.generatedAt}, readOnly:true };
    try { localStorage.setItem(ONYX_HANDOFF_KEY, JSON.stringify(packet)); } catch (e) {}
  }
  function summarizeFactions() {
    const map = new Map();
    state.npcs.forEach(n => { if (n.faction) map.set(n.faction.name, (map.get(n.faction.name) || 0) + 1); });
    return [...map.entries()].map(([name,count]) => ({name,count}));
  }

  async function readFileJSON(file) {
    return JSON.parse(await file.text());
  }
  async function importProvinceFile(e) {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const data = await readFileJSON(file);
      if (!Array.isArray(data.provinces)) throw new Error("Expected top-level provinces array.");
      state.data.provinceData = data;
      state.provinceId = data.provinces[0]?.id || "";
      state.settlementId = data.provinces[0]?.settlements?.[0]?.id || "";
      hydrateControls(); warnOnce("Imported replacement province/settlement data successfully."); renderAll();
    } catch (err) { warnOnce(`Province import failed: ${err.message}`); }
    e.target.value = "";
  }
  async function importSaveFile(e) {
    const file = e.target.files?.[0]; if (!file) return;
    try { applySave(await readFileJSON(file)); warnOnce("Imported simulator save successfully."); } catch (err) { warnOnce(`Save import failed: ${err.message}`); }
    e.target.value = "";
  }

  init().catch(err => {
    console.error(err);
    document.body.innerHTML = `<main class="card" style="margin:2rem;padding:1rem"><h1>Life Simulator could not start</h1><p>${escapeHTML(err.message)}</p></main>`;
  });
})();
