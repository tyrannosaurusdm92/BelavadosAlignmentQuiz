(function (global) {
  "use strict";
  const LS = global.LifeSimulator;

  function array(value) { return Array.isArray(value) ? value : value == null || value === "" ? [] : [value]; }
  function text(value, fallback = "") { return typeof value === "string" ? value.trim() : value == null ? fallback : String(value).trim(); }
  function deepMerge(base, patch) {
    const out = LS.util.clone(base) || {};
    for (const [key, value] of Object.entries(patch || {})) {
      if (Array.isArray(value)) out[key] = LS.util.clone(value);
      else if (value && typeof value === "object") out[key] = deepMerge(out[key] && typeof out[key] === "object" ? out[key] : {}, value);
      else if (value !== undefined) out[key] = value;
    }
    return out;
  }
  function flatten(value, prefix = "", result = {}) {
    for (const [key, item] of Object.entries(value || {})) {
      const path = prefix ? `${prefix}.${key}` : key;
      if (item && typeof item === "object" && !Array.isArray(item)) flatten(item, path, result);
      else result[path] = item;
    }
    return result;
  }
  function diff(before, after) {
    const left = flatten(before), right = flatten(after), changes = [];
    for (const path of new Set([...Object.keys(left), ...Object.keys(right)])) {
      if (JSON.stringify(left[path]) !== JSON.stringify(right[path])) changes.push({ path, before: left[path], after: right[path] });
    }
    return changes;
  }

  function normalizeNpc(npc) {
    npc.factionIds = array(npc.factionIds);
    npc.questIds = array(npc.questIds);
    npc.public = { description: "", knownFacts: [], rumors: [], approved: true, ...(npc.public || {}) };
    npc.public.knownFacts = array(npc.public.knownFacts);
    npc.public.rumors = array(npc.public.rumors);
    npc.private = { notes: "", secrets: [], rumors: [], memories: [], boundaries: [], relationships: [], ...(npc.private || {}) };
    ["secrets", "rumors", "memories", "boundaries", "relationships"].forEach(key => { npc.private[key] = array(npc.private[key]); });
    npc.dialogue = {
      tone: npc.personality?.style || "natural", verbosity: "balanced", speechStyle: "conversational", formality: "contextual",
      mannerisms: [], vocabulary: [], forbiddenTopics: [], languages: ["English"], liePolicy: "profile-driven",
      responseMode: "adaptive", multiPlayerStrategy: "synthesize", disclosureRules: [], ...(npc.dialogue || {})
    };
    ["mannerisms", "vocabulary", "forbiddenTopics", "languages", "disclosureRules"].forEach(key => { npc.dialogue[key] = array(npc.dialogue[key]); });
    npc.dialogueState = {
      mood: "neutral", stress: 0, trustByPlayer: {}, flags: {}, lastUpdated: LS.util.now(),
      ...(npc.dialogueState || npc.state || {})
    };
    npc.dialogueState.trustByPlayer = npc.dialogueState.trustByPlayer && typeof npc.dialogueState.trustByPlayer === "object" ? npc.dialogueState.trustByPlayer : {};
    return npc;
  }

  function defaultFaction() {
    const now = LS.util.now();
    return {
      factionId: LS.util.uid("faction"), name: "New Faction", aliases: [],
      public: { description: "", reputation: "unknown", knownLeaders: [] },
      private: { hiddenAgenda: "", secrets: [], internalConflicts: [] },
      goals: [], methods: [], resources: [], leaderNpcIds: [], memberNpcIds: [], territory: [], relationships: [], exceptions: [],
      visibility: "public", protected: false, source: "user", schemaVersion: LS.CONFIG.schemaVersion, createdAt: now, modifiedAt: now
    };
  }
  function normalizeFaction(input = {}) {
    const value = { ...defaultFaction(), ...input };
    value.factionId = value.factionId || LS.util.uid("faction");
    value.name = text(value.name, "Imported Faction");
    value.public = { description: "", reputation: "unknown", knownLeaders: [], ...(value.public || {}) };
    value.private = { hiddenAgenda: "", secrets: [], internalConflicts: [], ...(value.private || {}) };
    ["aliases", "goals", "methods", "resources", "leaderNpcIds", "memberNpcIds", "territory", "relationships", "exceptions"].forEach(key => { value[key] = array(value[key]); });
    value.schemaVersion = LS.CONFIG.schemaVersion; value.modifiedAt = value.modifiedAt || LS.util.now();
    return value;
  }
  function defaultQuest() {
    const now = LS.util.now();
    return {
      questId: LS.util.uid("quest"), title: "New Quest", summary: "", status: "available", giverNpcIds: [], factionIds: [],
      objectives: [], hiddenObjectives: [], stages: [{ stageId: "0", title: "Available", description: "", public: true, triggers: [], outcomes: [] }],
      currentStageId: "0", triggers: [], rewards: [], consequences: [], knowledgeRules: [], visibility: "public", protected: false,
      source: "user", schemaVersion: LS.CONFIG.schemaVersion, createdAt: now, modifiedAt: now
    };
  }
  function normalizeQuest(input = {}) {
    const value = { ...defaultQuest(), ...input };
    value.questId = value.questId || LS.util.uid("quest"); value.title = text(value.title, "Imported Quest");
    ["giverNpcIds", "factionIds", "objectives", "hiddenObjectives", "stages", "triggers", "rewards", "consequences", "knowledgeRules"].forEach(key => { value[key] = array(value[key]); });
    if (!value.stages.length) value.stages = defaultQuest().stages;
    value.currentStageId = String(value.currentStageId ?? value.stages[0]?.stageId ?? "0");
    value.schemaVersion = LS.CONFIG.schemaVersion; value.modifiedAt = value.modifiedAt || LS.util.now();
    return value;
  }

  function upsert(kind, record) {
    const key = kind === "faction" ? "factionId" : "questId";
    const prop = kind === "faction" ? "factions" : "quests";
    const normalized = kind === "faction" ? normalizeFaction(record) : normalizeQuest(record);
    LS.store.update(state => {
      const index = state[prop].findIndex(item => item[key] === normalized[key]);
      if (index >= 0) state[prop][index] = normalized; else state[prop].push(normalized);
      return state;
    });
    return normalized;
  }
  function remove(kind, id) {
    const key = kind === "faction" ? "factionId" : "questId";
    const prop = kind === "faction" ? "factions" : "quests";
    LS.store.update(state => {
      state[prop] = state[prop].filter(item => item[key] !== id);
      state.npcs.forEach(npc => {
        if (kind === "faction") npc.factionIds = array(npc.factionIds).filter(value => value !== id);
        else npc.questIds = array(npc.questIds).filter(value => value !== id);
      });
      return state;
    });
  }

  function serialize(kind, record) {
    if (kind === "faction") return [record.name, record.aliases, record.public?.description, record.public?.reputation, record.private?.hiddenAgenda, record.private?.secrets, record.goals, record.methods, record.resources].flat(Infinity).filter(Boolean).join(" ");
    if (kind === "quest") return [record.title, record.summary, record.status, record.objectives?.map(item => item.text || item), record.hiddenObjectives, record.stages?.map(item => `${item.title || ""} ${item.description || ""}`), record.rewards, record.consequences].flat(Infinity).filter(Boolean).join(" ");
    return [record.name, record.aliases, record.raceName, record.lineageName, record.profession, record.public?.description, record.public?.knownFacts, record.private?.goals, record.private?.needs, record.private?.fears, record.private?.secrets, record.dialogue?.mannerisms, record.dialogue?.vocabulary].flat(Infinity).filter(Boolean).join(" ");
  }
  function relevance(query, haystack) {
    const terms = String(query || "").toLowerCase().split(/[^a-z0-9]+/).filter(term => term.length > 1);
    const body = String(haystack || "").toLowerCase();
    return terms.reduce((score, term) => score + (body.includes(term) ? 1 : 0), 0);
  }
  function relatedForNpc(npc, state, messages = []) {
    const factionIds = new Set(array(npc.factionIds)); const questIds = new Set(array(npc.questIds));
    const factions = state.factions.filter(item => factionIds.has(item.factionId) || array(item.memberNpcIds).includes(npc.npcId) || array(item.leaderNpcIds).includes(npc.npcId));
    const quests = state.quests.filter(item => questIds.has(item.questId) || array(item.giverNpcIds).includes(npc.npcId));
    const query = messages.map(item => item.text).join(" ");
    const hits = [
      ...state.factions.map(item => ({ type: "faction", recordId: item.factionId, name: item.name, score: relevance(query, serialize("faction", item)) })),
      ...state.quests.map(item => ({ type: "quest", recordId: item.questId, name: item.title, score: relevance(query, serialize("quest", item)) }))
    ].filter(item => item.score > 0).sort((a, b) => b.score - a.score).slice(0, 10);
    for (const hit of hits) {
      if (hit.type === "faction" && !factions.some(item => item.factionId === hit.recordId)) {
        const item = state.factions.find(record => record.factionId === hit.recordId); if (item) factions.push(item);
      }
      if (hit.type === "quest" && !quests.some(item => item.questId === hit.recordId)) {
        const item = state.quests.find(record => record.questId === hit.recordId); if (item) quests.push(item);
      }
    }
    return { factions, quests, hits };
  }

  function compactNpc(npc) {
    normalizeNpc(npc);
    return {
      npcId: npc.npcId, name: npc.name, aliases: npc.aliases || [], pronouns: npc.pronouns, genderIdentity: npc.genderIdentity,
      species: npc.raceName, lineage: npc.lineageName, category: npc.category, cultureId: npc.cultureId, profession: npc.profession,
      public: npc.public, private: npc.private, factionIds: npc.factionIds, questIds: npc.questIds, abilities: npc.abilities,
      goals: npc.goals, needs: npc.needs, fears: npc.fears, personality: npc.personality, dialogue: npc.dialogue,
      dialogueState: npc.dialogueState, currentActivity: npc.simulation?.currentReaction?.label, currentLocationId: npc.simulation?.currentLocationId,
      protected: npc.protected === true
    };
  }
  function compactFaction(record) { return normalizeFaction(record); }
  function compactQuest(record) { return normalizeQuest(record); }

  function addReview(items) {
    if (!items.length) return;
    LS.store.update(state => { state.dialogueReview.push(...items); return state; });
  }
  function createReview(npc, response, requestId) {
    const state = LS.store.get(); const items = []; const settings = state.dialogueSettings;
    const patch = response.statePatch || {};
    if (patch.npc && Object.keys(patch.npc).length) {
      const updated = LS.util.clone(npc); updated.dialogueState = deepMerge(updated.dialogueState || {}, patch.npc);
      items.push({ reviewId: LS.util.uid("review"), recordType: "npc", recordId: npc.npcId, summary: "NPC mood, stress, trust, or dialogue-state update", before: LS.util.clone(npc), after: updated, diff: diff(npc, updated), safe: true, selected: !settings.reviewStateChanges, requestId, createdAt: LS.util.now() });
    }
    if (array(response.memoryWrites).length) {
      const existing = items.find(item => item.recordType === "npc"); const updated = existing ? existing.after : LS.util.clone(npc);
      normalizeNpc(updated);
      updated.private.memories.push(...array(response.memoryWrites).map(memory => ({ memoryId: LS.util.uid("memory"), summary: text(memory.summary || memory.text), visibility: memory.visibility || "private", sourceRequestId: requestId, createdAt: LS.util.now() })).filter(memory => memory.summary));
      if (existing) { existing.after = updated; existing.diff = diff(npc, updated); existing.summary += " and memory write"; }
      else items.push({ reviewId: LS.util.uid("review"), recordType: "npc", recordId: npc.npcId, summary: "Conversation memory write", before: LS.util.clone(npc), after: updated, diff: diff(npc, updated), safe: true, selected: !settings.reviewStateChanges, requestId, createdAt: LS.util.now() });
    }
    for (const questPatch of array(patch.quests)) {
      const record = state.quests.find(item => item.questId === questPatch.questId); if (!record) continue;
      let updated = LS.util.clone(record);
      if (questPatch.operation === "propose-stage-advance" && questPatch.toStageId != null) { updated.currentStageId = String(questPatch.toStageId); updated.status = "active"; }
      else updated = deepMerge(updated, questPatch.patch || questPatch);
      items.push({ reviewId: LS.util.uid("review"), recordType: "quest", recordId: record.questId, summary: questPatch.reason || "Quest state proposal", before: record, after: updated, diff: diff(record, updated), safe: false, selected: false, requestId, createdAt: LS.util.now() });
    }
    for (const factionPatch of array(patch.factions)) {
      const record = state.factions.find(item => item.factionId === factionPatch.factionId); if (!record) continue;
      const updated = deepMerge(record, factionPatch.patch || factionPatch);
      items.push({ reviewId: LS.util.uid("review"), recordType: "faction", recordId: record.factionId, summary: factionPatch.reason || "Faction state proposal", before: record, after: updated, diff: diff(record, updated), safe: false, selected: false, requestId, createdAt: LS.util.now() });
    }
    return items;
  }
  function applyReview(reviewId) {
    LS.store.update(state => {
      const item = state.dialogueReview.find(entry => entry.reviewId === reviewId); if (!item) return state;
      if (item.recordType === "npc") { const index = state.npcs.findIndex(record => record.npcId === item.recordId); if (index >= 0) state.npcs[index] = normalizeNpc(item.after); }
      if (item.recordType === "faction") { const index = state.factions.findIndex(record => record.factionId === item.recordId); if (index >= 0) state.factions[index] = normalizeFaction(item.after); }
      if (item.recordType === "quest") { const index = state.quests.findIndex(record => record.questId === item.recordId); if (index >= 0) state.quests[index] = normalizeQuest(item.after); }
      state.dialogueReview = state.dialogueReview.filter(entry => entry.reviewId !== reviewId);
      return state;
    });
  }
  function rejectReview(reviewId) { LS.store.update(state => { state.dialogueReview = state.dialogueReview.filter(item => item.reviewId !== reviewId); return state; }); }

  LS.dialogueContext = Object.freeze({ array, text, deepMerge, diff, normalizeNpc, defaultFaction, normalizeFaction, defaultQuest, normalizeQuest, upsert, remove, relatedForNpc, compactNpc, compactFaction, compactQuest, createReview, addReview, applyReview, rejectReview });
})(window);
