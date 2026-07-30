(function (global) {
  "use strict";
  const LS = global.LifeSimulator;
  const C = LS.dialogueContext;

  function normalizeNpc(input) {
    const value = { ...input };
    value.npcId = value.npcId || value.characterId || LS.util.uid("npc");
    value.name = value.name || value.displayName || "Imported NPC";
    value.raceName = value.raceName || value.species || value.ancestry || "User-defined ancestry";
    value.lineageName = value.lineageName || value.lineage || value.bloodline || null;
    value.genderIdentity = LS.CONFIG.genderIdentities.includes(value.genderIdentity) ? value.genderIdentity : (value.genderIdentity || "Non-Binary");
    value.pronouns = value.pronouns || { subject: "they", object: "them", possessive: "their", reflexive: "themself", label: "they/them" };
    value.simulation = value.simulation || { currentLocationId: value.state?.locationId || null, currentReaction: null, reactionHistory: [], state: "active" };
    value.conversationEnabled = value.conversationEnabled !== false;
    value.schemaVersion = LS.CONFIG.schemaVersion;
    value.createdAt = value.createdAt || LS.util.now(); value.modifiedAt = value.modifiedAt || LS.util.now();
    C.normalizeNpc(value);
    if (!value.token?.borderId || (!value.token?.relativePath && !value.token?.dataUrl && !value.token?.src)) LS.tokens.bindNpc(value, value.token?.borderId);
    return value;
  }
  function normalizeLocation(location) {
    return {
      locationId: location.locationId || LS.util.uid("location"), name: location.name || "Imported Location", type: location.type || "location",
      biomeId: location.biomeId || "auto", services: [], goods: [], prices: {}, accessibility: {}, owners: [], employees: [], residents: [], visitors: [],
      rumors: [], secrets: [], plotHooks: [], consequences: [], public: { description: "", approved: true }, private: { notes: "" },
      source: "imported", schemaVersion: LS.CONFIG.schemaVersion, createdAt: LS.util.now(), modifiedAt: LS.util.now(), ...location
    };
  }

  function discoverRecords(payload) {
    const found = { npcs: [], locations: [], factions: [], quests: [], races: [] }; const seen = new Set();
    const keyMap = {
      npcs: "npcs", npc: "npcs", characters: "npcs", people: "npcs", cast: "npcs",
      locations: "locations", places: "locations", businesses: "locations",
      factions: "factions", organizations: "factions", guilds: "factions",
      quests: "quests", missions: "quests", storyhooks: "quests", plotHooks: "quests",
      customraces: "races", races: "races", species: "races"
    };
    function add(type, value) {
      for (const item of Array.isArray(value) ? value : [value]) {
        if (!item || typeof item !== "object") continue;
        const signature = `${type}:${item.npcId || item.locationId || item.factionId || item.questId || item.raceId || item.name || item.title || JSON.stringify(item).slice(0, 120)}`;
        if (seen.has(signature)) continue; seen.add(signature); found[type].push(item);
      }
    }
    function walk(value, key = "") {
      if (!value || typeof value !== "object") return;
      const normalizedKey = String(key).replace(/[^a-z]/gi, "").toLowerCase();
      const mapped = keyMap[normalizedKey]; if (mapped && Array.isArray(value)) add(mapped, value);
      if (!Array.isArray(value)) {
        if (value.npcId || (value.profession && value.name)) add("npcs", value);
        else if (value.locationId || (value.services && value.name)) add("locations", value);
        else if (value.factionId || (value.goals && value.methods && value.name)) add("factions", value);
        else if (value.questId || (value.objectives && (value.title || value.name))) add("quests", value);
      }
      if (Array.isArray(value)) value.forEach(item => walk(item, key)); else Object.entries(value).forEach(([childKey, child]) => walk(child, childKey));
    }
    walk(payload);
    return found;
  }

  function mergeUnique(existing, incoming, key) {
    const map = new Map(existing.map(item => [item[key], item]));
    for (const item of incoming) map.set(item[key], item);
    return [...map.values()];
  }

  function applyPayload(payload, sourceName = "Imported JSON") {
    const records = discoverRecords(payload);
    const report = { sourceName, npcs: 0, locations: 0, races: 0, factions: 0, quests: 0, project: false, ignoredPhysicalWorldFields: [] };
    LS.store.update(state => {
      const isProject = payload?.schema === "lifesimulator.project.v5" || payload?.project?.projectId || payload?.schema?.startsWith?.("lifesimulator.project");
      if (isProject) {
        const incoming = LS.store.migrate(payload);
        Object.assign(state, incoming);
        report.project = true; report.npcs = state.npcs.length; report.locations = state.locations.length; report.races = state.customRaces.length; report.factions = state.factions.length; report.quests = state.quests.length;
      } else {
        const npcs = records.npcs.map(normalizeNpc); const locations = records.locations.map(normalizeLocation);
        const factions = records.factions.map(C.normalizeFaction); const quests = records.quests.map(C.normalizeQuest);
        const races = records.races.filter(race => race.source === "user" || race.custom || !race.categoryId);
        state.npcs = mergeUnique(state.npcs, npcs, "npcId"); state.locations = mergeUnique(state.locations, locations, "locationId");
        state.factions = mergeUnique(state.factions, factions, "factionId"); state.quests = mergeUnique(state.quests, quests, "questId");
        state.customRaces = mergeUnique(state.customRaces, races, "raceId");
        report.npcs = npcs.length; report.locations = locations.length; report.races = races.length; report.factions = factions.length; report.quests = quests.length;
      }
      ["pins", "pinSlots", "geometry", "viewerState", "terrain", "planet", "continents", "coordinates", "latitude", "longitude"].forEach(key => { if (Object.prototype.hasOwnProperty.call(payload, key)) report.ignoredPhysicalWorldFields.push(key); });
      state.sources.push({ sourceId: LS.util.uid("source"), name: sourceName, kind: "imported", priority: LS.CONFIG.precedence.scoped, protected: false, importedAt: LS.util.now(), report });
      state.importHistory.unshift({ importId: LS.util.uid("import"), at: LS.util.now(), ...report });
      return state;
    });
    return report;
  }

  function recordsFromDocxText(rawText, sourceName) {
    const text = String(rawText || "").replace(/\r/g, "");
    const sections = text.split(/\n(?=(?:NPC|Character|Faction|Organization|Quest|Mission|Location|Place)\s*[:\-])/i).map(item => item.trim()).filter(Boolean);
    const payload = { npcs: [], factions: [], quests: [], locations: [] };
    function fields(block) {
      const result = {};
      for (const line of block.split(/\n+/)) {
        const match = line.match(/^\s*([^:]{2,50}):\s*(.+)$/); if (match) result[match[1].trim().toLowerCase().replace(/\s+/g, "_")] = match[2].trim();
      }
      return result;
    }
    for (const block of sections) {
      const first = block.split(/\n/)[0]; const data = fields(block); const name = (first.split(/[:\-]/).slice(1).join("-").trim() || data.name || data.title || "Imported record");
      if (/^(npc|character)\b/i.test(first)) payload.npcs.push({ name, profession: data.profession || data.occupation || "community member", raceName: data.race || data.species || data.ancestry, lineageName: data.lineage || data.bloodline, genderIdentity: data.gender_identity || data.gender || "Non-Binary", public: { description: data.description || data.public_description || "", knownFacts: data.known_facts ? data.known_facts.split(/\s*[;|]\s*/) : [] }, private: { secrets: data.secrets ? data.secrets.split(/\s*[;|]\s*/) : [], notes: data.notes || "" }, dialogue: { tone: data.tone || "natural", speechStyle: data.speech_style || data.voice || "conversational", mannerisms: data.mannerisms ? data.mannerisms.split(/\s*[;|]\s*/) : [], vocabulary: data.vocabulary ? data.vocabulary.split(/\s*[;|]\s*/) : [] } });
      else if (/^(faction|organization)\b/i.test(first)) payload.factions.push({ name, public: { description: data.description || "", reputation: data.reputation || "unknown" }, goals: data.goals ? data.goals.split(/\s*[;|]\s*/) : [], methods: data.methods ? data.methods.split(/\s*[;|]\s*/) : [] });
      else if (/^(quest|mission)\b/i.test(first)) payload.quests.push({ title: name, summary: data.summary || data.description || "", status: data.status || "available", objectives: data.objectives ? data.objectives.split(/\s*[;|]\s*/).map((item, index) => ({ objectiveId: `objective-${index + 1}`, text: item, status: "active" })) : [] });
      else if (/^(location|place)\b/i.test(first)) payload.locations.push({ name, type: data.type || "location", public: { description: data.description || "", approved: true }, services: data.services ? data.services.split(/\s*[;|]\s*/) : [] });
    }
    if (!payload.npcs.length && !payload.factions.length && !payload.quests.length && !payload.locations.length) {
      payload.npcs.push({ name: sourceName.replace(/\.docx$/i, ""), profession: "imported character", public: { description: text.slice(0, 1000), knownFacts: [] }, private: { notes: text.slice(1000, 5000) } });
    }
    return payload;
  }

  async function readDocxBuffer(buffer, sourceName) {
    if (!global.mammoth) throw new Error("DOCX import support is unavailable.");
    const result = await global.mammoth.extractRawText({ arrayBuffer: buffer });
    return applyPayload(recordsFromDocxText(result.value, sourceName), sourceName);
  }

  async function readFile(file) {
    const extension = file.name.split(".").pop().toLowerCase();
    if (extension === "json" || extension === "lifesim") return applyPayload(JSON.parse(await file.text()), file.name);
    if (extension === "docx") return readDocxBuffer(await file.arrayBuffer(), file.name);
    if (extension === "zip") {
      if (!global.JSZip) throw new Error("ZIP support is unavailable.");
      const zip = await global.JSZip.loadAsync(file); const reports = [];
      const entries = Object.values(zip.files).filter(entry => !entry.dir && /\.(json|lifesim|docx)$/i.test(entry.name));
      if (entries.length > 2500) throw new Error("ZIP contains too many compatible files.");
      for (const entry of entries) {
        try {
          if (/\.docx$/i.test(entry.name)) reports.push(await readDocxBuffer((await entry.async("uint8array")).buffer, `${file.name} → ${entry.name}`));
          else reports.push(applyPayload(JSON.parse(await entry.async("text")), `${file.name} → ${entry.name}`));
        } catch (error) { console.warn(`Skipped incompatible entry ${entry.name}`, error); }
      }
      if (!reports.length) throw new Error("No compatible LifeSimulator JSON, LIFESIM, or DOCX was found in this ZIP.");
      return { sourceName: file.name, archiveEntries: reports.length, reports };
    }
    if (["png", "jpg", "jpeg", "webp", "svg"].includes(extension)) return { sourceName: file.name, artOnly: true, note: "Use the integrated race creator art uploader to bind this file to a gender identity." };
    throw new Error(`.${extension} is not a supported direct project import.`);
  }
  async function handleFiles(files) {
    const results = [];
    for (const file of files) {
      try { results.push({ ok: true, file: file.name, report: await readFile(file) }); }
      catch (error) { results.push({ ok: false, file: file.name, error: error.message }); }
    }
    return results;
  }
  LS.importers = Object.freeze({ applyPayload, readFile, handleFiles, normalizeNpc, normalizeLocation, discoverRecords, recordsFromDocxText, readDocxBuffer });
})(window);
