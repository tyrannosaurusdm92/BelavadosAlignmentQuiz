(function (global) {
  "use strict";
  const LS = global.LifeSimulator;
  const C = LS.dialogueContext;
  const timers = new Map();
  const inflight = new Map();

  function thread(npcId, state = LS.store.get()) { return state.conversations[npcId] || []; }
  function addMessage(npcId, role, text, details = {}) {
    const entry = {
      messageId: details.messageId || LS.util.uid("message"), role, text: C.text(text),
      playerId: details.playerId || null, playerName: details.playerName || null,
      targetPlayerIds: C.array(details.targetPlayerIds), emotion: details.emotion || "neutral", reaction: details.reaction || "neutral",
      engine: details.engine || (role === "npc" ? "local-fallback" : "player"), requestId: details.requestId || null,
      decisionFactors: C.array(details.decisionFactors), warnings: C.array(details.warnings), at: details.at || LS.util.now()
    };
    LS.store.update(state => {
      state.conversations[npcId] = state.conversations[npcId] || [];
      state.conversations[npcId].push(entry);
      state.conversations[npcId] = state.conversations[npcId].slice(-LS.CONFIG.dialogueLimits.maxTurnsPerNpc);
      return state;
    });
    return entry;
  }

  function disposition(npc) {
    C.normalizeNpc(npc);
    const warmth = Number(npc.personality?.warmth ?? 50); const stress = Number(npc.dialogueState?.stress ?? 0);
    if (stress > 75) return "strained";
    return warmth > 70 ? "warm" : warmth < 30 ? "guarded" : "neutral";
  }
  function recentConversation(state, npcId, turns) {
    return thread(npcId, state).slice(-turns).map(item => ({ role: item.role, playerId: item.playerId, playerName: item.playerName, text: item.text, targetPlayerIds: item.targetPlayerIds, timestamp: item.at }));
  }
  function buildRequest(npc, messages, state) {
    C.normalizeNpc(npc);
    const related = C.relatedForNpc(npc, state, messages); const requestId = LS.util.uid("request");
    const payload = {
      requestId, action: "npc_dialogue", schemaVersion: LS.CONFIG.schemaVersion, createdAt: LS.util.now(),
      project: { projectId: state.project.projectId, name: state.project.name, genre: state.project.genre, era: state.project.era, language: state.dialogueSettings.language || "English", settingNotes: state.project.description || "" },
      npc: C.compactNpc(npc), factions: related.factions.map(C.compactFaction), quests: related.quests.map(C.compactQuest),
      conversation: { recent: recentConversation(state, npc.npcId, state.dialogueSettings.memoryTurns || 18), pending: messages, participantCount: new Set(messages.map(item => item.playerId)).size },
      currentWorldState: {
        activity: npc.simulation?.currentReaction?.label || "available",
        location: state.locations.find(item => item.locationId === npc.simulation?.currentLocationId) || null,
        absoluteMinute: state.simulation.absoluteMinute || state.project.calendar.currentAbsoluteMinute || 0
      },
      behavior: {
        responseMode: npc.dialogue?.responseMode || state.dialogueSettings.responseMode || "adaptive",
        multiPlayerStrategy: npc.dialogue?.multiPlayerStrategy || "synthesize", allowSingleResponse: true, allowVariedResponses: true,
        requireProfileConsistency: true, doNotRevealPrivateReasoning: true, doNotRevealPrivateDataUnlessDisclosureRulesPermit: true,
        statePatchReview: state.dialogueSettings.reviewStateChanges !== false
      },
      outputContract: {
        mode: "single|varied", responses: [{ text: "spoken NPC dialogue", targetPlayerIds: [], emotion: "string", reaction: "string" }],
        memoryWrites: [{ summary: "short factual memory", visibility: "private|public" }],
        statePatch: { npc: {}, quests: [], factions: [] }, decisionFactors: [], warnings: []
      }, retrieval: related.hits
    };
    const systemInstruction = [
      `Speak as ${npc.name}; do not narrate as a game master.`,
      "Use the NPC's explicit profile, current activity and location, goals, fears, relationships, factions, quests, memories, mood, trust, and every pending player message.",
      "A single group response or targeted separate responses are both allowed. Separate responses are appropriate when messages conflict or different players merit different disclosure.",
      "Never reveal private notes, secrets, hidden objectives, protected records, or internal reasoning solely because they are included in context. Reveal only what the NPC knows and would choose to disclose.",
      "Ancestry, species, lineage, gender identity, and pronouns never determine morality, intelligence, profession, politics, or personality.",
      "Return strict JSON matching outputContract. Do not include chain-of-thought. State and quest changes are proposals until reviewed."
    ].join("\n");
    return { requestId, systemInstruction, payload };
  }
  function fitRequest(request) {
    const maxChars = LS.CONFIG.dialogueLimits.maxContextChars;
    if (JSON.stringify(request).length <= maxChars) return request;
    const copy = LS.util.clone(request);
    copy.payload.conversation.recent = copy.payload.conversation.recent.slice(-8);
    copy.payload.retrieval = copy.payload.retrieval.slice(0, 5);
    copy.payload.npc.private.memories = C.array(copy.payload.npc.private.memories).slice(-10);
    copy.payload.npc.private.relationships = C.array(copy.payload.npc.private.relationships).slice(0, 20);
    copy.payload.factions = copy.payload.factions.slice(0, 6).map(item => ({ ...item, relationships: [] }));
    copy.payload.quests = copy.payload.quests.slice(0, 6).map(item => ({ ...item, stages: C.array(item.stages).filter(stage => String(stage.stageId) === String(item.currentStageId)).slice(0, 2) }));
    return copy;
  }

  function analyze(message) {
    const value = C.text(message.text).toLowerCase();
    let intent = "general";
    if (/threat|kill|hurt|attack|destroy/.test(value)) intent = "threaten";
    else if (/accuse|lying|liar|betray|traitor|guilty/.test(value)) intent = "accuse";
    else if (/\b(accept|agree|we will help|i will help|we'll help|count on us)\b/.test(value)) intent = "acceptQuest";
    else if (/\b(decline|refuse|won't help|will not help|cannot help)\b/.test(value)) intent = "declineQuest";
    else if (/pay|payment|reward|price|bargain|deal/.test(value)) intent = "bargain";
    else if (/who are you|your name|tell me about yourself/.test(value)) intent = "askIdentity";
    else if (/what are you doing|doing now|current activity/.test(value)) intent = "askActivity";
    else if (/where are you|this place|location/.test(value)) intent = "askLocation";
    else if (/faction|organization|guild|government|allegiance/.test(value)) intent = "askFaction";
    else if (/quest|mission|task|job|problem|need help/.test(value)) intent = "askQuest";
    else if (/goal|want|hope|dream/.test(value)) intent = "askGoal";
    else if (/fear|afraid|worry/.test(value)) intent = "askFear";
    else if (/sorry|apolog/.test(value)) intent = "apologize";
    else if (/thank/.test(value)) intent = "thank";
    else if (/what do you know|tell me|explain|information|rumor/.test(value) || value.endsWith("?")) intent = "askInfo";
    else if (/\b(goodbye|farewell|bye|see you)\b/.test(value)) intent = "goodbye";
    else if (/\b(hello|hi|greetings|good morning|good evening|hey)\b/.test(value)) intent = "greet";
    const positive = (value.match(/\b(thank|please|help|friend|trust|good|kind|sorry|agree)\b/g) || []).length;
    const negative = (value.match(/\b(hate|stupid|liar|threat|kill|wrong|coward|useless)\b/g) || []).length;
    return { ...message, intent, sentiment: Math.sign(positive - negative) };
  }
  function trustFor(npc, playerId) { return Number(npc.dialogueState?.trustByPlayer?.[playerId] || 0); }
  function pickPublicFact(npc, query) {
    const facts = [...C.array(npc.public?.knownFacts), ...C.array(npc.public?.rumors)];
    if (!facts.length) return "I do not have a reliable public fact to add without guessing.";
    const terms = String(query || "").toLowerCase().split(/\W+/).filter(Boolean);
    return facts.sort((a, b) => terms.filter(term => String(b).toLowerCase().includes(term)).length - terms.filter(term => String(a).toLowerCase().includes(term)).length)[0];
  }
  function style(npc, sentence) {
    let value = C.text(sentence); const dialogue = npc.dialogue || {}; const tone = String(dialogue.tone || npc.personality?.style || "natural").toLowerCase();
    if (tone.includes("formal") || dialogue.formality === "formal") value = value.replace(/^Hello\.?/i, "Greetings.");
    if (tone.includes("terse") || dialogue.verbosity === "brief") value = value.split(/(?<=[.!?])\s+/).slice(0, 2).join(" ");
    if (dialogue.verbosity === "expansive" && value.length < 140 && npc.public?.knownFacts?.[0]) value += ` ${npc.public.knownFacts[0]}`;
    const mannerism = C.array(dialogue.mannerisms)[0]; if (mannerism && value.length < 400) value += ` ${String(mannerism).replace(/^[a-z]/, char => char.toUpperCase())}.`;
    return /[.!?…]$/.test(value) ? value : `${value}.`;
  }
  function activeQuest(npc, state) {
    return state.quests.find(item => C.array(npc.questIds).includes(item.questId) && !["completed", "failed", "retired"].includes(item.status)) || state.quests.find(item => C.array(item.giverNpcIds).includes(npc.npcId) && !["completed", "failed", "retired"].includes(item.status));
  }
  function activeFaction(npc, state) { return state.factions.find(item => C.array(npc.factionIds).includes(item.factionId) || C.array(item.memberNpcIds).includes(npc.npcId) || C.array(item.leaderNpcIds).includes(npc.npcId)); }
  function shouldVary(npc, analyses, requested) {
    const mode = npc.dialogue?.responseMode || requested;
    if (mode === "varied" || npc.dialogue?.multiPlayerStrategy === "individual") return true;
    if (mode === "single") return false;
    const intents = new Set(analyses.map(item => item.intent)); const sentiments = new Set(analyses.map(item => item.sentiment));
    return analyses.length > 1 && (intents.size > 1 || sentiments.size > 1);
  }
  function composeOne(npc, analyses, state, targets = []) {
    const intents = new Set(analyses.map(item => item.intent)); const names = analyses.map(item => item.playerName || "traveler");
    const group = names.length === 1 ? names[0] : names.length === 2 ? `${names[0]} and ${names[1]}` : "all of you";
    const combined = analyses.map(item => item.text).join(" "); const quest = activeQuest(npc, state); const faction = activeFaction(npc, state);
    const avgSentiment = analyses.reduce((sum, item) => sum + item.sentiment, 0) / Math.max(1, analyses.length);
    let text; let emotion = disposition(npc); let reaction = "attentive";
    const statePatch = { npc: {}, quests: [], factions: [] }; const memoryWrites = [];
    const normalizedCombined = combined.toLowerCase();
    const forbiddenTopic = C.array(npc.dialogue?.forbiddenTopics)
      .map(topic => C.text(topic))
      .find(topic => topic && normalizedCombined.includes(topic.toLowerCase()));
    const explicitBoundary = C.array(npc.private?.boundaries)
      .map(boundary => C.text(boundary?.summary || boundary?.text || boundary))
      .find(boundary => boundary && normalizedCombined.includes(boundary.toLowerCase()));
    if (forbiddenTopic || explicitBoundary) {
      const boundary = forbiddenTopic || explicitBoundary;
      text = `I will not discuss ${boundary}, ${group}. Ask me about something else`;
      emotion = "guarded"; reaction = "reserved";
      statePatch.npc.stress = Math.min(100, Number(npc.dialogueState?.stress || 0) + 4);
    } else if (intents.has("threaten")) {
      text = `Threats do not make your request clearer, ${group}. Step back and state what you actually want`;
      emotion = "wary"; reaction = "guarded"; statePatch.npc.stress = Math.min(100, Number(npc.dialogueState?.stress || 0) + 18);
      for (const item of analyses) statePatch.npc.trustByPlayer = { ...(statePatch.npc.trustByPlayer || {}), [item.playerId]: Math.max(-100, trustFor(npc, item.playerId) - 15) };
    } else if (intents.has("accuse")) {
      text = `That is a serious accusation, ${group}. Bring evidence or a contradiction I can examine`;
      emotion = "wary"; reaction = "skeptical"; statePatch.npc.stress = Math.min(100, Number(npc.dialogueState?.stress || 0) + 9);
    } else if (intents.has("acceptQuest") && quest) {
      const objective = C.array(quest.objectives).find(item => item.status !== "completed");
      text = `Then we have an understanding. ${C.text(objective?.text || objective || quest.summary || `Begin with what is known about ${quest.title}`)}`;
      emotion = "relieved"; reaction = "hopeful";
      const currentIndex = C.array(quest.stages).findIndex(stage => String(stage.stageId) === String(quest.currentStageId)); const next = quest.stages[currentIndex + 1] || quest.stages[currentIndex];
      statePatch.quests.push({ questId: quest.questId, operation: "propose-stage-advance", fromStageId: quest.currentStageId, toStageId: next?.stageId ?? quest.currentStageId, reason: "Players accepted the task" });
      memoryWrites.push({ summary: `${group} agreed to help with ${quest.title}.`, visibility: "private" });
    } else if (intents.has("declineQuest") && quest) {
      text = `I understand. The matter of ${quest.title} remains unresolved, and I will look elsewhere`;
      emotion = "disappointed"; reaction = "reserved"; memoryWrites.push({ summary: `${group} declined involvement in ${quest.title}.`, visibility: "private" });
    } else if (intents.has("bargain")) {
      text = quest ? `Payment depends on the risk, the proof, and what you recover. For ${quest.title}, we can discuss terms after agreeing on the first objective` : "State what you are offering and what you expect in return";
      emotion = "considering"; reaction = "calculating";
    } else if (intents.has("askIdentity")) {
      text = `I am ${npc.name}${npc.profession ? `, ${npc.profession}` : ""}${npc.raceName ? `. I am ${npc.raceName}${npc.lineageName ? ` of the ${npc.lineageName} lineage` : ""}` : ""}`;
    } else if (intents.has("askActivity")) {
      text = `Right now, I am ${String(npc.simulation?.currentReaction?.label || "available").toLowerCase()}`;
    } else if (intents.has("askLocation")) {
      const location = state.locations.find(item => item.locationId === npc.simulation?.currentLocationId);
      text = location ? `I am at ${location.name}` : "I am between my regular locations at the moment";
    } else if (intents.has("askFaction")) {
      text = faction ? `${faction.public?.description || `${faction.name} is my affiliation`}${faction.public?.reputation ? ` Its public reputation is ${faction.public.reputation}` : ""}` : "I do not claim a public faction affiliation";
    } else if (intents.has("askQuest")) {
      const objective = C.array(quest?.objectives).find(item => item.status !== "completed");
      text = quest ? `${quest.summary || quest.title}${objective ? ` ${C.text(objective.text || objective)}` : ""}` : "I have no task I am prepared to place in your hands at present";
    } else if (intents.has("askGoal")) text = `I am trying to ${npc.goals?.[0] || "make something better where I can"}`;
    else if (intents.has("askFear")) text = `I worry about ${npc.fears?.[0] || "what may happen next"}`;
    else if (intents.has("askInfo")) { text = pickPublicFact(npc, combined); emotion = "thoughtful"; reaction = "thinking"; }
    else if (intents.has("greet")) { text = `Greetings, ${group}. What brings you to me`; emotion = avgSentiment >= 0 ? "welcoming" : "neutral"; reaction = "friendly"; }
    else if (intents.has("goodbye")) { text = `Until next time, ${group}. I will remember where we left matters`; reaction = "farewell"; }
    else if (intents.has("apologize")) { text = trustFor(npc, analyses[0].playerId) < -25 ? "An apology is a beginning. What follows will matter more" : "I accept that. Let us decide what happens next"; emotion = "measured"; reaction = "considering"; }
    else if (intents.has("thank")) { text = `You are welcome, ${group}. I am glad the help mattered`; emotion = "warm"; reaction = "friendly"; }
    else {
      text = avgSentiment < 0 ? `I hear your concern, ${group}, but I need a specific request before I can act` : `I hear you, ${group}. Tell me the outcome you are asking for and what you are prepared to do`;
      emotion = avgSentiment < 0 ? "concerned" : "attentive"; reaction = avgSentiment < 0 ? "wary" : "attentive";
    }
    for (const item of analyses) {
      const delta = item.sentiment > 0 ? 2 : item.sentiment < 0 ? -2 : 0;
      if (delta) statePatch.npc.trustByPlayer = { ...(statePatch.npc.trustByPlayer || {}), [item.playerId]: Math.max(-100, Math.min(100, trustFor(npc, item.playerId) + delta)) };
    }
    statePatch.npc.mood = emotion; statePatch.npc.lastUpdated = LS.util.now();
    return { text: style(npc, text), targetPlayerIds: targets, emotion, reaction, statePatch, memoryWrites };
  }
  async function fallback(request, state) {
    const npc = state.npcs.find(item => item.npcId === request.payload.npc.npcId) || request.payload.npc;
    const analyses = request.payload.conversation.pending.map(analyze);
    const varied = shouldVary(npc, analyses, request.payload.behavior.responseMode);
    const responses = []; const memoryWrites = []; const statePatch = { npc: {}, quests: [], factions: [] };
    const mergePatch = result => {
      responses.push({ text: result.text, targetPlayerIds: result.targetPlayerIds, emotion: result.emotion, reaction: result.reaction });
      memoryWrites.push(...result.memoryWrites); statePatch.npc = C.deepMerge(statePatch.npc, result.statePatch.npc || {});
      statePatch.quests.push(...result.statePatch.quests); statePatch.factions.push(...result.statePatch.factions);
    };
    if (varied) analyses.forEach(item => mergePatch(composeOne(npc, [item], state, [item.playerId]))); else mergePatch(composeOne(npc, analyses, state, []));
    return { requestId: request.requestId, mode: varied ? "varied" : "single", responses, memoryWrites, statePatch, decisionFactors: ["Explicit NPC speech profile", "Current activity and location", "Player intent and tone", "Quest and faction context", "Existing trust and stress"], warnings: ["Local profile-consistent fallback was used."], engine: "local-fallback" };
  }

  function queueMessage(npcId, player, value) {
    const text = C.text(value); if (!text) throw new Error("Message is empty.");
    if (text.length > LS.CONFIG.dialogueLimits.maxMessageChars) throw new Error(`Message exceeds ${LS.CONFIG.dialogueLimits.maxMessageChars} characters.`);
    const message = { messageId: LS.util.uid("message"), npcId, playerId: player.playerId, playerName: player.name, text, timestamp: LS.util.now() };
    LS.store.update(state => { state.pendingByNpc[npcId] = [...(state.pendingByNpc[npcId] || []), message]; return state; });
    addMessage(npcId, "user", text, { messageId: message.messageId, playerId: player.playerId, playerName: player.name, at: message.timestamp });
    schedule(npcId); return message;
  }
  function pending(npcId, state = LS.store.get()) { return state.pendingByNpc[npcId] || []; }
  function schedule(npcId) {
    const ms = Number(LS.store.get().dialogueSettings.responseWindowMs || 0); if (timers.has(npcId)) clearTimeout(timers.get(npcId));
    if (ms > 0) timers.set(npcId, setTimeout(() => respond(npcId).catch(error => LS.app.toast(error.message, "error")), ms));
  }
  function clearPending(npcId) {
    if (timers.has(npcId)) clearTimeout(timers.get(npcId)); timers.delete(npcId);
    LS.store.update(state => { state.pendingByNpc[npcId] = []; return state; });
  }
  async function respond(npcId, options = {}) {
    if (inflight.has(npcId)) return inflight.get(npcId);
    const state = LS.store.get(); const messages = pending(npcId, state);
    if (!messages.length) { if (options.force) LS.app.toast("No pending player messages for this NPC.", "error"); return null; }
    const npc = state.npcs.find(item => item.npcId === npcId); if (!npc) throw new Error("The selected NPC no longer exists.");
    C.normalizeNpc(npc); if (timers.has(npcId)) clearTimeout(timers.get(npcId)); timers.delete(npcId);
    LS.store.update(next => { next.ui.dialogueThinkingNpcId = npcId; return next; }, { save: false });
    const task = (async () => {
      const current = LS.store.get(); const request = fitRequest(buildRequest(current.npcs.find(item => item.npcId === npcId), messages, current));
      let response; let backendError = null;
      try {
        if (current.dialogueSettings.backendEnabled) response = await LS.dialogueBackend.post(request, current.dialogueSettings);
        else throw new Error("Dialogue backend is disabled.");
      } catch (error) {
        backendError = error;
        if (!current.dialogueSettings.fallbackEnabled) throw error;
        response = await fallback(request, current);
        response.warnings = [...C.array(response.warnings), `Backend unavailable: ${error.message}`];
      }
      for (const item of response.responses) {
        addMessage(npcId, "npc", item.text, { targetPlayerIds: item.targetPlayerIds, emotion: item.emotion, reaction: item.reaction, engine: response.engine || "backend", requestId: request.requestId, decisionFactors: response.decisionFactors, warnings: response.warnings });
      }
      const latest = LS.store.get(); const target = latest.npcs.find(item => item.npcId === npcId); const review = C.createReview(target, response, request.requestId); C.addReview(review);
      if (!LS.store.get().dialogueSettings.reviewStateChanges) review.forEach(item => C.applyReview(item.reviewId));
      const reactionResult = response.responses.at(-1);
      if (reactionResult) LS.store.update(next => {
        const record = next.npcs.find(item => item.npcId === npcId); if (!record) return next;
        const reaction = LS.reactions.select({ npc: record, state: next, text: messages.map(item => item.text).join(" "), result: { mood: reactionResult.emotion, actions: response.statePatch?.quests?.length ? [{ type: "quest" }] : [] }, seed: `${npcId}|dialogue|${request.requestId}` });
        const personalized = LS.reactions.personalize(reaction, record, next, `${npcId}|dialogue-reaction|${request.requestId}`);
        if (personalized) {
          record.simulation.currentReaction = { ...personalized, source: "conversation", dialogueLabel: reactionResult.reaction, at: LS.util.now(), absoluteMinute: next.simulation.absoluteMinute || 0 };
          record.simulation.reactionHistory = [record.simulation.currentReaction, ...(record.simulation.reactionHistory || [])].slice(0, 120);
        }
        next.dialogueDiagnostics.unshift({ requestId: request.requestId, npcId, at: LS.util.now(), engine: response.engine || "backend", backendError: backendError?.message || null, warnings: response.warnings || [] });
        next.dialogueDiagnostics = next.dialogueDiagnostics.slice(0, 200);
        return next;
      });
      clearPending(npcId); return { request, response, review };
    })().finally(() => {
      inflight.delete(npcId); LS.store.update(next => { next.ui.dialogueThinkingNpcId = null; return next; }, { save: false });
      if (LS.conversations) LS.conversations.render();
    });
    inflight.set(npcId, task); return task;
  }

  function reply(npc, text, state) {
    const player = state.dialoguePlayers?.[0] || { playerId: "player", name: "Player" };
    const request = buildRequest(npc, [{ messageId: LS.util.uid("message"), playerId: player.playerId, playerName: player.name, text, timestamp: LS.util.now() }], state);
    return fallback(request, state).then(result => ({ text: result.responses[0].text, reaction: null, mood: result.responses[0].emotion, actions: result.statePatch.quests || [] }));
  }

  LS.dialogue = Object.freeze({ thread, addMessage, disposition, buildRequest, fitRequest, analyze, fallback, reply, queueMessage, pending, schedule, clearPending, respond, timers, inflight });
})(window);
