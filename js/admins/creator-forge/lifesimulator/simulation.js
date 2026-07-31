(function (global) {
  "use strict";
  const LS = global.LifeSimulator;
  let timer = null;
  const firstNames = ["Ari", "Bryn", "Caro", "Davi", "Eli", "Fara", "Galen", "Hira", "Ilya", "Jori", "Kavi", "Luma", "Maro", "Neri", "Orin", "Pela", "Quin", "Ravi", "Sela", "Tavi", "Uma", "Veya", "Wren", "Xara", "Yori", "Zev"];
  const familyNames = ["Alder", "Basin", "Cinder", "Dawn", "Ember", "Field", "Glass", "Harbor", "Ivory", "Juniper", "Kestrel", "Lumen", "Morrow", "North", "Oriel", "Pike", "Quarry", "Reed", "Stone", "Thorn", "Umber", "Vale", "Weaver", "Yarrow"];
  const goals = ["protect their community", "master a difficult craft", "find a missing relative", "build a secure home", "earn public trust", "understand an old mystery", "improve local accessibility", "explore beyond familiar territory", "repair a strained relationship", "teach the next generation"];
  const fears = ["being forgotten", "failing someone who depends on them", "losing their home", "public humiliation", "dangerous shortages", "uncontrolled technology", "unpredictable magic", "isolation", "betrayal", "a returning hazard"];
  const needs = ["rest", "belonging", "safety", "food", "purpose", "privacy", "medical care", "creative expression", "stable work", "reconciliation"];
  const abilities = ["careful observation", "negotiation", "navigation", "repair", "storytelling", "first aid", "research", "leadership", "crafting", "pattern recognition", "translation", "animal handling"];
  const personalities = ["warm", "reserved", "curious", "diplomatic", "stern", "playful", "methodical", "protective", "restless", "patient"];


  function bodyPlanFor(race) {
    const profile = `${race?.canonicalProfile || ""} ${race?.physiology?.bodyPlan || ""}`.toLowerCase();
    if (/centipede|dozens|arthropod/.test(profile)) return "multi-limbed arthropodal";
    if (/quadruped|centaur/.test(profile)) return "quadrupedal or multi-form";
    if (/ooze|amorph/.test(profile)) return "amorphous";
    if (/avian|winged|bird/.test(profile)) return "winged humanoid";
    if (/aquatic|merfolk|tail/.test(profile)) return "aquatic or amphibious";
    return race?.physiology?.bodyPlan || "setting-defined sapient body plan";
  }

  function chooseReaction(npc, state, text, seed) {
    const base = LS.reactions.select({ npc, state, text, seed });
    return LS.reactions.personalize(base, npc, state, seed) || { reactionId: "available", label: "Available", icon: "", conversationChance: 1, interruptible: true };
  }

  function makeSchedule(profession, locationId, random) {
    const start = 420 + Math.floor(random() * 180);
    const workEnd = start + 420 + Math.floor(random() * 180);
    return [
      { startMinute: 0, endMinute: start, activity: "sleeping", locationId: null },
      { startMinute: start, endMinute: start + 60, activity: "personal care and breakfast", locationId: null },
      { startMinute: start + 60, endMinute: workEnd, activity: `working as ${profession}`, locationId },
      { startMinute: workEnd, endMinute: Math.min(1380, workEnd + 180), activity: "socializing or completing personal tasks", locationId },
      { startMinute: Math.min(1380, workEnd + 180), endMinute: 1440, activity: "resting at home", locationId: null }
    ];
  }

  function pickRace(options, state, random) {
    let candidates = LS.species.allRaces(state).filter(race => race.generation?.enabled !== false);
    if (options.categoryId) candidates = candidates.filter(race => race.categoryId === options.categoryId);
    if (options.raceId) candidates = candidates.filter(race => race.raceId === options.raceId);
    return LS.util.pick(candidates, random) || LS.util.pick(LS.species.builtInRaces, random);
  }

  function createNpc(options = {}, index = 0, state = LS.store.get()) {
    const random = LS.util.seeded(`${options.seed || "population"}|${index}|${state.project.projectId}`);
    const race = pickRace(options, state, random);
    const lineages = LS.species.lineagesForRace(race.raceId, state);
    const lineage = options.lineageId ? lineages.find(item => item.lineageId === options.lineageId) : LS.util.pick(lineages, random);
    const identityPool = LS.identities?.all(state) || LS.CONFIG.genderIdentities.map(name => ({ identityId: LS.util.slug(name), name, pronouns: { label: "they/them" } }));
    const identityRecord = options.genderIdentity ? (LS.identities?.resolve(options.genderIdentity, state) || identityPool.find(item => item.name === options.genderIdentity || item.identityId === options.genderIdentity)) : LS.util.pick(identityPool, random);
    const genderIdentityId = identityRecord?.identityId || "non-binary";
    const genderIdentity = identityRecord?.name || "Non-Binary";
    const pronouns = LS.identities?.pronounsFor(genderIdentityId, state, options.pronouns) || { subject: "they", object: "them", possessiveAdjective: "their", possessivePronoun: "theirs", reflexive: "themself", agreement: "plural", label: "they/them" };
    const era = options.era == null || options.era === "" ? Number(state.project.era) : Number(options.era);
    const professionPool = LS.era.occupationPool(state.project.genre, era, options.profession ? [options.profession] : []);
    const profession = options.profession || options.systemRole || LS.util.pick(professionPool, random) || "community member";
    const location = options.locationId ? state.locations.find(item => item.locationId === options.locationId) : LS.util.pick(state.locations, random);
    const now = LS.util.now();
    const npc = {
      npcId: LS.util.uid("npc"), name: `${LS.util.pick(firstNames, random)} ${LS.util.pick(familyNames, random)}`,
      aliases: [], genderIdentityId, genderIdentity, pronouns, bodyPlan: bodyPlanFor(race),
      raceId: race.raceId, raceName: race.name, lineageId: lineage?.lineageId || null, lineageName: lineage?.name || null,
      categoryId: race.categoryId, category: race.category, mixedHeritageId: options.mixedHeritageId || null,
      systemProfile: options.systemProfile || { systemId: state.project.systemProfile?.systemId || "system-agnostic", editionId: state.project.systemProfile?.editionId || "", systemName: "System Agnostic", editionLabel: "", identityLabel: "Ancestry / Species", ancestry: "", heritageLabel: "Heritage", heritage: "", roleLabel: "Role / Class", role: profession, specialization: "", background: "", abilities: [] },
      cultureId: null, factionIds: [], profession, abilities: [...new Set([...(options.systemProfile?.abilities || []), ...LS.util.sample(abilities, 3, random)])],
      needs: LS.util.sample(needs, 3, random), goals: LS.util.sample(goals, 2, random), fears: LS.util.sample(fears, 2, random),
      relationships: [], residenceLocationId: null, workplaceLocationId: location?.locationId || null,
      schedule: makeSchedule(profession, location?.locationId || null, random), reputation: { public: 0 },
      personality: { style: options.personality || LS.util.pick(personalities, random), warmth: Math.round(random() * 100), patience: Math.round(random() * 100), curiosity: Math.round(random() * 100), extraversion: Math.round(random() * 100) },
      public: { description: `${options.systemProfile?.ancestry || race.name}${options.systemProfile?.role ? ` · ${options.systemProfile.role}` : ""}${lineage ? ` · ${lineage.name}` : ""}.`, knownFacts: [`Works as ${profession}.`], rumors: [], approved: true },
      private: { notes: "", secrets: ["A personal concern has not yet been shared."], rumors: [], memories: [], boundaries: [], relationships: [] },
      questIds: [],
      dialogue: { tone: options.personality || "natural", verbosity: "balanced", speechStyle: "conversational", formality: "contextual", mannerisms: [], vocabulary: [], forbiddenTopics: [], languages: ["English"], liePolicy: "profile-driven", responseMode: "adaptive", multiPlayerStrategy: "synthesize", disclosureRules: [] },
      dialogueState: { mood: "neutral", stress: 0, trustByPlayer: {}, flags: {}, lastUpdated: now },
      protected: false, source: "generated", eraOverride: era, conversationEnabled: options.conversationEnabled !== false,
      simulation: { currentLocationId: location?.locationId || null, currentReaction: null, reactionHistory: [], state: "active" },
      validationWarnings: [], schemaVersion: LS.CONFIG.schemaVersion, createdAt: now, modifiedAt: now
    };
    LS.legacy?.enrichNpc(npc, random, state, race);
    npc.simulation.currentReaction = chooseReaction(npc, state, `working ${profession}`, `${npc.npcId}|initial`);
    LS.tokens.bindNpc(npc, options.borderId);
    return npc;
  }

  function generateNPCs(options = {}) {
    const count = Math.max(1, Math.min(500, Number(options.count) || 1));
    const created = [];
    LS.store.update(state => {
      const offset = state.npcs.length;
      for (let index = 0; index < count; index += 1) {
        const npc = createNpc(options, offset + index, state);
        created.push(npc); state.npcs.push(npc);
      }
      LS.legacy?.linkBatch(created, state, options.seed || "population");
      state.events.unshift({ eventId: LS.util.uid("event"), type: "generation", label: `Generated ${count} NPC${count === 1 ? "" : "s"}`, at: LS.util.now(), absoluteMinute: state.simulation.absoluteMinute || state.project.calendar.currentAbsoluteMinute });
      return state;
    });
    return created;
  }

  function createLocation(options = {}, index = 0, state = LS.store.get()) {
    const random = LS.util.seeded(`${options.seed || "locations"}|${index}|${state.project.projectId}`);
    const era = options.era == null || options.era === "" ? Number(state.project.era) : Number(options.era);
    const type = options.type || LS.util.pick(LS.era.locationPool(state.project.genre, era, []), random) || "community location";
    const biome = LS.biomes.resolve(options.biomeId === "auto" ? state.project.defaultBiomeId : options.biomeId) || LS.util.pick(LS.biomes.all, random);
    const name = options.name || `${LS.util.pick(["Alder", "Bright", "Cinder", "Dawn", "Echo", "Glass", "Harbor", "Juniper", "Lumen", "Morrow", "North", "Quiet", "River", "Stone", "Vale"], random)} ${type.replace(/^\w/, value => value.toUpperCase())}`;
    const now = LS.util.now();
    return {
      locationId: LS.util.uid("location"), name, type, category: options.category || "general", biomeId: biome?.id || null, biomePath: biome?.path || null,
      parentLocationId: options.parentLocationId || null, mapLevel: options.mapLevel || options.level || "location", map: { nodeType: options.mapLevel || options.level || "location", x: options.x ?? null, y: options.y ?? null, assetPath: options.assetPath || null, manifestNodeId: options.manifestNodeId || null },
      eraOverride: era, owners: [], employees: [], residents: [], visitors: [],
      services: options.services || LS.util.sample(["food", "lodging", "repairs", "education", "medical care", "transport coordination", "research", "trade", "community meetings", "recreation"], 3, random),
      goods: [], prices: {}, accessibility: { stepFree: random() > 0.25, wideEntries: random() > 0.3, assistanceAvailable: true, notes: "User-editable accessibility profile." },
      hours: { open: "08:00", close: "18:00" }, rumors: [], secrets: [], plotHooks: ["A local need could benefit from outside help."], consequences: [],
      cultureIds: [], factionIds: [], government: null, economy: null, danger: Math.round(random() * 4),
      public: { description: `${name} is a ${type} in ${biome?.label || "a user-defined habitat"}.`, approved: true }, private: { notes: "" },
      source: "generated", protected: false, schemaVersion: LS.CONFIG.schemaVersion, createdAt: now, modifiedAt: now
    };
  }

  function generateLocations(options = {}) {
    const count = Math.max(1, Math.min(200, Number(options.count) || 1));
    const created = [];
    LS.store.update(state => {
      const offset = state.locations.length;
      for (let index = 0; index < count; index += 1) { const location = createLocation(options, offset + index, state); created.push(location); state.locations.push(location); }
      state.events.unshift({ eventId: LS.util.uid("event"), type: "generation", label: `Generated ${count} location${count === 1 ? "" : "s"}`, at: LS.util.now(), absoluteMinute: state.simulation.absoluteMinute || state.project.calendar.currentAbsoluteMinute });
      return state;
    });
    return created;
  }

  function scheduleEntry(npc, minuteOfDay) {
    return npc.schedule?.find(entry => minuteOfDay >= entry.startMinute && minuteOfDay < entry.endMinute) || npc.schedule?.[0] || null;
  }
  function refreshNpc(npc, state) {
    const absolute = state.simulation.absoluteMinute || state.project.calendar.currentAbsoluteMinute || 0;
    const minuteOfDay = ((absolute % 1440) + 1440) % 1440;
    const entry = scheduleEntry(npc, minuteOfDay);
    if (!entry) return;
    const prior = npc.simulation?.currentReaction?.label;
    npc.simulation = npc.simulation || {};
    npc.simulation.currentLocationId = entry.locationId || npc.residenceLocationId || null;
    const reaction = chooseReaction(npc, state, entry.activity, `${npc.npcId}|${Math.floor(absolute / 30)}|${entry.activity}`);
    npc.simulation.currentReaction = { ...reaction, source: "schedule", at: LS.util.now(), absoluteMinute: absolute };
    if (reaction.label !== prior) {
      npc.simulation.reactionHistory = [npc.simulation.currentReaction, ...(npc.simulation.reactionHistory || [])].slice(0, 120);
      state.events.unshift({ eventId: LS.util.uid("event"), type: "npc-activity", npcId: npc.npcId, label: `${npc.name}: ${reaction.label}`, at: LS.util.now(), absoluteMinute: absolute });
    }
  }

  function advance(minutes) {
    LS.store.update(state => {
      const amount = Math.max(1, Number(minutes) || 1);
      state.simulation.absoluteMinute = (state.simulation.absoluteMinute ?? state.project.calendar.currentAbsoluteMinute ?? 0) + amount;
      state.project.calendar.currentAbsoluteMinute = state.simulation.absoluteMinute;
      state.simulation.lastTickAt = LS.util.now();
      state.npcs.forEach(npc => refreshNpc(npc, state));
      if (LS.transit?.updateVehicles) LS.transit.updateVehicles(state, state.simulation.absoluteMinute);
      state.events = state.events.slice(0, 500);
      return state;
    });
  }
  function start() {
    if (timer) return;
    LS.store.update(state => { state.simulation.status = "running"; return state; });
    timer = setInterval(() => advance(Math.max(1, Number(LS.store.get().simulation.speed) || 60)), 1000);
  }
  function pause() {
    if (timer) clearInterval(timer); timer = null;
    LS.store.update(state => { state.simulation.status = "paused"; return state; });
  }
  function setSpeed(value) { LS.store.update(state => { state.simulation.speed = Math.max(1, Number(value) || 1); return state; }); }
  function savePoint(label) {
    LS.store.update(state => {
      const snapshot = LS.util.clone({ project: state.project, customRaces: state.customRaces, locations: state.locations, npcs: state.npcs, relationships: state.relationships, conversations: state.conversations, factions: state.factions, quests: state.quests, dialogueSettings: state.dialogueSettings, dialoguePlayers: state.dialoguePlayers, pendingByNpc: state.pendingByNpc, dialogueReview: state.dialogueReview, dialogueDiagnostics: state.dialogueDiagnostics, transit: state.transit, assets: state.assets, events: state.events, simulation: state.simulation });
      state.savePoints.unshift({ savePointId: LS.util.uid("save"), label: label || `Save point ${state.savePoints.length + 1}`, createdAt: LS.util.now(), absoluteMinute: state.simulation.absoluteMinute || 0, snapshot });
      state.savePoints = state.savePoints.slice(0, 20); return state;
    });
  }
  function rewind(savePointId) {
    pause();
    LS.store.update(state => {
      const point = state.savePoints.find(item => item.savePointId === savePointId);
      if (!point) return state;
      Object.assign(state, LS.util.clone(point.snapshot)); state.savePoints = [point, ...state.savePoints.filter(item => item.savePointId !== savePointId)]; return state;
    });
  }
  function branch() {
    LS.store.update(state => { state.simulation.branch = `branch-${Date.now().toString(36)}`; state.events.unshift({ eventId: LS.util.uid("event"), type: "branch", label: `Created ${state.simulation.branch}`, at: LS.util.now(), absoluteMinute: state.simulation.absoluteMinute || 0 }); return state; });
  }
  function formatTime(absoluteMinute) {
    const value = Math.max(0, Number(absoluteMinute) || 0);
    const day = Math.floor(value / 1440) + 1;
    const minute = value % 1440;
    const hour = String(Math.floor(minute / 60)).padStart(2, "0");
    const remainder = String(minute % 60).padStart(2, "0");
    return `Day ${day} · ${hour}:${remainder}`;
  }

  LS.simulation = Object.freeze({ createNpc, generateNPCs, createLocation, generateLocations, advance, start, pause, setSpeed, savePoint, rewind, branch, formatTime, refreshNpc });
})(window);
