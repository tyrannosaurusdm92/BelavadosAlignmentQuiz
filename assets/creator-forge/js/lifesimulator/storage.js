(function (global) {
  "use strict";
  const LS = global.LifeSimulator;
  const { uid, now, clone } = LS.util;
  const listeners = new Set();
  let state;

  function defaultCalendar() {
    return {
      name: "Project Calendar", dayLengthHours: 24, currentAbsoluteMinute: 480,
      weekdays: ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"],
      months: Array.from({ length: 12 }, (_, index) => ({ name: `Month ${index + 1}`, days: 30 })),
      timeZones: [{ id: "local", name: "Local", offsetMinutes: 0 }], holidays: []
    };
  }

  function defaultDialogueSettings() {
    return {
      backendEnabled: true,
      backendEndpoint: LS.CONFIG.backend || "",
      backendLibraryUrl: LS.CONFIG.backendLibrary || "",
      backendTimeoutMs: LS.CONFIG.dialogueLimits.timeoutMs,
      fallbackEnabled: true,
      responseMode: "adaptive",
      responseWindowMs: 0,
      memoryTurns: 18,
      reviewStateChanges: true,
      language: "English",
      transcriptVisibility: "all",
      speechBubbleDurationMs: 15000
    };
  }

  function initialState() {
    const createdAt = now();
    return {
      schema: "tablegate.project.v8", schemaVersion: LS.CONFIG.schemaVersion,
      project: {
        projectId: uid("project"), name: "Untitled TableGate Project", genre: "user-defined",
        systemProfile: { systemId: "dnd", editionId: "5.5e" },
        description: "", era: 5, defaultBiomeId: "auto", development: Object.fromEntries(LS.CONFIG.developmentAxes.map(axis => [axis, 5])),
        extraordinary: { magic: 0, psionics: 0, divineIntervention: 0, planarTravel: 0, supernaturalEcology: 0 },
        calendar: defaultCalendar(), createdAt, modifiedAt: createdAt
      },
      sources: [{ sourceId: uid("source"), name: "Built-in authoritative registries", kind: "protected", priority: 100, protected: true, importedAt: createdAt }],
      customRaces: [], locations: [], npcs: [], relationships: [], households: [], conversations: {}, events: [], savePoints: [],
      factions: [], quests: [], species: [], identityProfiles: LS.identities ? LS.identities.defaults.map(item => clone(item)) : [],
      tablegate: { mapManifest: null, mapViewerState: {}, mapSlots: [], mapNodes: [], mapPlacements: [], mapLinks: [] }, bridge: { provenance: [] },
      transit: {
        types: [], stops: [], routes: [], services: [], vehicles: [], tripPlans: [],
        settings: { distanceUnit: "km", mapWidthDistance: 100, mapHeightDistance: 100, defaultTransferMinutes: 5, defaultVisitMinutes: 30, maximumTransfers: 6 }
      },
      assets: [],
      assistant: { conversations: [], activeConversationId: null, imageJobs: [], settings: { repository: "", projectToken: "", userId: "local-user", autoFallback: true } },
      dialogueSettings: defaultDialogueSettings(),
      dialoguePlayers: [{ playerId: uid("player"), name: "Player 1" }],
      pendingByNpc: {}, dialogueReview: [], dialogueDiagnostics: [],
      simulation: { status: "paused", speed: 60, branch: "main", lastTickAt: null },
      ui: { activeView: "dashboard", selectedNpcId: null, selectedLocationId: null, selectedRaceId: null, dialogueTab: "stage" },
      importHistory: [], validation: { lastRunAt: null, errors: [], warnings: [] }
    };
  }

  function normalizeConversationMap(value) {
    if (!value) return {};
    if (!Array.isArray(value) && typeof value === "object") return value;
    const result = {};
    for (const message of Array.isArray(value) ? value : []) {
      const npcId = message.npcId;
      if (!npcId) continue;
      result[npcId] = result[npcId] || [];
      result[npcId].push({
        messageId: message.messageId || uid("message"),
        role: message.role === "player" ? "user" : message.role,
        playerId: message.playerId || null,
        playerName: message.playerName || null,
        text: message.text || "",
        targetPlayerIds: message.targetPlayerIds || [],
        emotion: message.emotion || "neutral",
        reaction: message.reaction || "neutral",
        engine: message.engine || "imported",
        requestId: message.requestId || null,
        decisionFactors: message.decisionFactors || [],
        warnings: message.warnings || [],
        at: message.at || message.timestamp || now()
      });
    }
    return result;
  }

  function migrate(input) {
    const base = initialState();
    if (!input || typeof input !== "object") return base;
    const next = { ...base, ...input };
    next.project = { ...base.project, ...(input.project || {}) };
    next.project.development = { ...base.project.development, ...(input.project?.development || {}) };
    next.project.calendar = { ...base.project.calendar, ...(input.project?.calendar || {}) };
    next.project.systemProfile = { ...base.project.systemProfile, ...(input.project?.systemProfile || {}) };
    next.simulation = { ...base.simulation, ...(input.simulation || {}) };
    next.ui = { ...base.ui, ...(input.ui || {}) };
    next.dialogueSettings = { ...base.dialogueSettings, ...(input.dialogueSettings || input.settings || {}) };
    next.tablegate = { ...base.tablegate, ...(input.tablegate || {}) };
    next.transit = { ...base.transit, ...(input.transit || {}) };
    next.transit.settings = { ...base.transit.settings, ...(input.transit?.settings || {}) };
    ["types", "stops", "routes", "services", "vehicles", "tripPlans"].forEach(key => { if (!Array.isArray(next.transit[key])) next.transit[key] = []; });
    next.assets = Array.isArray(input.assets) ? input.assets : clone(base.assets);
    next.assistant = { ...base.assistant, ...(input.assistant || {}) };
    next.assistant.settings = { ...base.assistant.settings, ...(input.assistant?.settings || {}) };
    next.assistant.conversations = Array.isArray(next.assistant.conversations) ? next.assistant.conversations : [];
    next.assistant.imageJobs = Array.isArray(next.assistant.imageJobs) ? next.assistant.imageJobs : [];
    next.tablegate.mapNodes = Array.isArray(next.tablegate.mapNodes) ? next.tablegate.mapNodes : [];
    next.tablegate.mapPlacements = Array.isArray(next.tablegate.mapPlacements) ? next.tablegate.mapPlacements : [];
    next.tablegate.mapLinks = Array.isArray(next.tablegate.mapLinks) ? next.tablegate.mapLinks : [];
    next.bridge = { ...base.bridge, ...(input.bridge || {}) };
    ["customRaces", "locations", "npcs", "relationships", "households", "events", "savePoints", "sources", "importHistory", "factions", "quests", "species", "identityProfiles", "dialoguePlayers", "dialogueReview", "dialogueDiagnostics"].forEach(key => {
      if (!Array.isArray(next[key])) next[key] = clone(base[key]);
    });
    if (LS.identities) LS.identities.ensureState(next);
    next.conversations = normalizeConversationMap(input.conversations);
    if (!next.pendingByNpc || typeof next.pendingByNpc !== "object" || Array.isArray(next.pendingByNpc)) next.pendingByNpc = {};
    if (!next.dialoguePlayers.length) next.dialoguePlayers = clone(base.dialoguePlayers);
    next.npcs = next.npcs.map(npc => {
      const value = { ...npc };
      value.factionIds = Array.isArray(value.factionIds) ? value.factionIds : [];
      value.genderIdentityId = value.genderIdentityId || LS.identities?.resolve(value.genderIdentity, next)?.identityId || LS.util.slug(value.genderIdentity || "non-binary");
      value.genderIdentity = LS.identities?.resolve(value.genderIdentityId, next)?.name || value.genderIdentity || "Non-Binary";
      value.pronouns = LS.identities?.normalizePronouns(value.pronouns, LS.identities?.resolve(value.genderIdentityId, next)?.pronouns?.label || "they/them") || value.pronouns;
      value.questIds = Array.isArray(value.questIds) ? value.questIds : [];
      value.dialogue = {
        tone: "natural", verbosity: "balanced", speechStyle: "conversational", formality: "contextual",
        mannerisms: [], vocabulary: [], forbiddenTopics: [], languages: [next.dialogueSettings.language || "English"],
        liePolicy: "profile-driven", responseMode: "adaptive", multiPlayerStrategy: "synthesize",
        disclosureRules: [], ...(value.dialogue || {})
      };
      value.private = { notes: "", secrets: [], rumors: [], memories: [], boundaries: [], relationships: [], ...(value.private || {}) };
      if (!Array.isArray(value.private.memories)) value.private.memories = [];
      value.dialogueState = { mood: "neutral", stress: 0, trustByPlayer: {}, flags: {}, lastUpdated: now(), ...(value.dialogueState || value.state || {}) };
      return value;
    });
    next.schema = base.schema;
    next.schemaVersion = LS.CONFIG.schemaVersion;
    return next;
  }

  function load() {
    try {
      const current = localStorage.getItem(LS.CONFIG.stateKey);
      const legacy = current || localStorage.getItem("tablegate.lifesimulator.v7") || localStorage.getItem("tablegate.lifesimulator.v6");
      state = migrate(legacy ? JSON.parse(legacy) : null);
    }
    catch (error) { console.warn("Stored project could not be loaded.", error); state = initialState(); }
    return state;
  }
  function save() {
    state.project.modifiedAt = now();
    try { localStorage.setItem(LS.CONFIG.stateKey, JSON.stringify(state)); }
    catch (error) { console.warn("Project state could not be persisted in this browser context.", error); }
    listeners.forEach(listener => listener(state));
    return state;
  }
  function get() { return state || load(); }
  function update(mutator, options = {}) {
    const current = get();
    const result = mutator(current) || current;
    state = result;
    if (options.save !== false) save();
    else listeners.forEach(listener => listener(state));
    return state;
  }
  function replace(nextState) { state = migrate(clone(nextState)); return save(); }
  function reset() { state = initialState(); return save(); }
  function subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); }
  function exportState() { return clone(get()); }
  function mutate(_label, mutator) { return update(mutator); }

  LS.store = Object.freeze({ get, load, save, update, mutate, replace, reset, subscribe, exportState, initialState, migrate, defaultDialogueSettings });
})(window);
