(function (global) {
  "use strict";
  const LS = global.LifeSimulator;
  function json(value) { return JSON.stringify(value, null, 2); }
  function projectName(state) { return LS.util.safeFileName(state.project.name || "LifeSimulator_Project"); }
  function publicNpc(npc) {
    return {
      npcId: npc.npcId, name: npc.name, aliases: npc.aliases, genderIdentityId: npc.genderIdentityId || null, genderIdentity: npc.genderIdentity, pronouns: npc.pronouns,
      raceId: npc.raceId, raceName: npc.raceName, lineageId: npc.lineageId, lineageName: npc.lineageName,
      profession: npc.profession, public: npc.public, workplaceLocationId: npc.workplaceLocationId,
      currentLocationId: npc.simulation?.currentLocationId, currentActivity: npc.simulation?.currentReaction?.label,
      token: npc.token, reputation: npc.reputation, factionIds: npc.factionIds || [], questIds: npc.questIds || [],
      dialogue: {
        tone: npc.dialogue?.tone, verbosity: npc.dialogue?.verbosity, speechStyle: npc.dialogue?.speechStyle,
        formality: npc.dialogue?.formality, mannerisms: npc.dialogue?.mannerisms || [], languages: npc.dialogue?.languages || []
      }
    };
  }
  function publicLocation(location) {
    return {
      locationId: location.locationId, name: location.name, type: location.type, category: location.category, parentLocationId: location.parentLocationId || null, mapLevel: location.mapLevel || location.map?.nodeType || null, map: location.map || null, biomeId: location.biomeId, biomePath: location.biomePath,
      services: location.services, goods: location.goods, prices: location.prices, accessibility: location.accessibility, hours: location.hours,
      public: location.public, rumors: location.rumors
    };
  }
  function publicFaction(faction) {
    return { factionId: faction.factionId, name: faction.name, aliases: faction.aliases || [], public: faction.public, goals: faction.goals || [], methods: faction.methods || [], leaderNpcIds: faction.leaderNpcIds || [], memberNpcIds: faction.memberNpcIds || [], visibility: faction.visibility };
  }
  function publicQuest(quest) {
    return { questId: quest.questId, title: quest.title, summary: quest.summary, status: quest.status, giverNpcIds: quest.giverNpcIds || [], factionIds: quest.factionIds || [], objectives: (quest.objectives || []).filter(item => !item.hidden), stages: (quest.stages || []).filter(item => item.public !== false), currentStageId: quest.currentStageId, rewards: quest.rewards || [], consequences: quest.consequences || [], visibility: quest.visibility };
  }
  function publicConversations(state) {
    const result = {};
    for (const [npcId, messages] of Object.entries(state.conversations || {})) {
      result[npcId] = messages.map(message => ({ messageId: message.messageId, role: message.role, playerId: message.playerId, playerName: message.playerName, text: message.text, targetPlayerIds: message.targetPlayerIds || [], emotion: message.emotion, reaction: message.reaction, at: message.at }));
    }
    return result;
  }
  function downloadProject() {
    const state = LS.store.exportState(); LS.util.download(`${projectName(state)}.lifesim.json`, json(state));
  }
  function downloadNpcs(publicOnly = false) {
    const state = LS.store.get(); const records = publicOnly ? state.npcs.map(publicNpc) : state.npcs;
    LS.util.download(`${projectName(state)}_${publicOnly ? "public_" : ""}NPCs.json`, json({ schema: "lifesimulator.npcs.v5.1", records }));
  }
  function downloadLocations(publicOnly = false) {
    const state = LS.store.get(); const records = publicOnly ? state.locations.map(publicLocation) : state.locations;
    LS.util.download(`${projectName(state)}_${publicOnly ? "public_" : ""}Locations.json`, json({ schema: "lifesimulator.locations.v5.1", records }));
  }
  function downloadCustomRaces() {
    const state = LS.store.get(); LS.util.download(`${projectName(state)}_Homebrew_Races.json`, json({ schema: "lifesimulator.homebrew-races.v5.1", records: state.customRaces }));
  }
  function downloadValidation() {
    const state = LS.store.get(); LS.util.download(`${projectName(state)}_Validation.json`, json(state.validation));
  }
  async function downloadZip() {
    if (!global.JSZip) { LS.app.toast("ZIP support is unavailable.", "error"); return; }
    const state = LS.store.exportState(); const zip = new global.JSZip(); const root = zip.folder(projectName(state));
    root.file("project.lifesim.json", json(state));
    root.file("npcs.json", json({ schema: "lifesimulator.npcs.v5.1", records: state.npcs }));
    root.file("locations.json", json({ schema: "lifesimulator.locations.v5.1", records: state.locations }));
    root.file("factions.json", json({ schema: "lifesimulator.factions.v1", records: state.factions }));
    root.file("quests.json", json({ schema: "lifesimulator.quests.v1", records: state.quests }));
    root.file("dialogue/conversations.json", json({ schema: "lifesimulator.dialogue.v1", conversations: state.conversations, players: state.dialoguePlayers, settings: state.dialogueSettings, pendingReview: state.dialogueReview }));
    root.file("dialogue/diagnostics.json", json(state.dialogueDiagnostics));
    root.file("homebrew_races.json", json({ schema: "lifesimulator.homebrew-races.v5.1", records: state.customRaces }));
    root.file("public/npcs.json", json({ schema: "lifesimulator.public-npcs.v5.1", records: state.npcs.map(publicNpc) }));
    root.file("public/locations.json", json({ schema: "lifesimulator.public-locations.v5.1", records: state.locations.map(publicLocation) }));
    root.file("public/factions.json", json({ schema: "lifesimulator.public-factions.v1", records: state.factions.filter(item => item.visibility !== "secret").map(publicFaction) }));
    root.file("public/quests.json", json({ schema: "lifesimulator.public-quests.v1", records: state.quests.filter(item => item.visibility !== "secret").map(publicQuest) }));
    root.file("public/conversations.json", json({ schema: "lifesimulator.public-dialogue.v1", conversations: publicConversations(state) }));
    root.file("registries/biomes.json", json(global.LS_BIOME_REGISTRY));
    root.file("registries/identity_profiles.json", json({ schema: "tablegate.identity-registry.v1", records: state.identityProfiles || [] }));
    root.file("transit/transit_network.json", json({ schema: "tablegate.transit-network.v1", ...(state.transit || {}) }));
    root.file("maps/tablegate_semantic_map_manifest.json", json(LS.mapViewer?.semanticManifest?.() || { schema: "tablegate.semantic-map-manifest.v1", nodes: [] }));
    const assetFolder = root.folder("assets/generated");
    if (LS.assets?.exportIntoZip) await LS.assets.exportIntoZip(assetFolder, state);
    root.file("registries/token_asset_index.json", json({ schema: global.LS_RACE_TOKEN_INDEX.schema, tokenAssetRoot: global.LS_RACE_TOKEN_INDEX.tokenAssetRoot, tokenNamingRule: global.LS_RACE_TOKEN_INDEX.tokenNamingRule, expectedTokens: global.LS_RACE_TOKEN_INDEX.tokens.length }));
    root.file("registries/token_borders.json", json(global.LS_TOKEN_BORDER_REGISTRY));
    root.file("README.md", `# ${state.project.name}\n\nTableGate LifeSimulator project package. It contains system-aware NPCs, semantic hierarchical locations, identity/pronoun profiles, body forms, speech profiles, factions, quests, conversations, memories, schedules, map placements, map links, and simulation state. Generated people and places are included in the TableGate semantic map manifest.\n`);
    const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
    LS.util.download(`${projectName(state)}.zip`, blob, "application/zip");
  }
  LS.exporters = Object.freeze({ downloadProject, downloadNpcs, downloadLocations, downloadCustomRaces, downloadValidation, downloadZip, publicNpc, publicLocation, publicFaction, publicQuest, publicConversations });
})(window);
