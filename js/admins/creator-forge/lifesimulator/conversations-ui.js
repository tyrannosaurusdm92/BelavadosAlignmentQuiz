(function (global) {
  "use strict";
  const LS = global.LifeSimulator;
  const C = LS.dialogueContext;
  let contextEditor = null;

  function root() { return document.getElementById("life-native") || document; }
  function byId(id) { return root().querySelector("#" + CSS.escape(id)); }
  function lines(value) { return C.array(value).join("\n"); }
  function parseLines(value) { return String(value || "").split(/\n+/).map(item => item.trim()).filter(Boolean); }
  function selectedNpc(state = LS.store.get()) { return state.npcs.find(item => item.npcId === state.ui.selectedNpcId) || null; }
  function thread(npcId, state = LS.store.get()) { return LS.dialogue.thread(npcId, state); }
  function open(npcId) {
    const state = LS.store.get(); const npc = state.npcs.find(item => item.npcId === npcId); if (!npc) return;
    if (npc.conversationEnabled === false) { LS.app.toast(`${npc.name} cannot be contacted right now.`, "error"); return; }
    LS.store.update(next => { next.ui.selectedNpcId = npcId; next.ui.activeView = "conversations"; next.ui.dialogueTab = "stage"; return next; });
    LS.app.switchView("conversations"); switchTab("stage"); render();
  }
  function switchTab(tab) {
    LS.store.update(state => { state.ui.dialogueTab = tab; return state; }, { save: false });
    root().querySelectorAll("[data-dialogue-tab]").forEach(button => button.classList.toggle("active", button.dataset.dialogueTab === tab));
    root().querySelectorAll("[data-dialogue-tab-panel]").forEach(panel => panel.classList.toggle("active", panel.dataset.dialogueTabPanel === tab));
    render();
  }

  function renderRoster(state) {
    const roster = byId("conversationRoster"); if (!roster) return;
    const query = String(byId("conversationNpcSearch")?.value || "").trim().toLowerCase();
    const records = state.npcs.filter(npc => !query || `${npc.name} ${npc.raceName || ""} ${npc.lineageName || ""} ${npc.profession || ""}`.toLowerCase().includes(query));
    roster.innerHTML = records.length ? records.map(npc => `<button type="button" class="conversation-roster-item${npc.npcId === state.ui.selectedNpcId ? " active" : ""}" data-conversation-npc="${npc.npcId}">${LS.tokens.tokenMarkup(npc, { state })}<span><b>${LS.util.escape(npc.name)}</b><small>${LS.util.escape(npc.simulation?.currentReaction?.label || npc.profession || "Available")}</small></span></button>`).join("") : `<p class="empty-state">No matching NPCs.</p>`;
  }
  function renderPlayers(state, npc) {
    const list = byId("dialoguePlayerList"); if (!list) return;
    list.innerHTML = state.dialoguePlayers.map((player, index) => `<article class="dialogue-player-composer" data-player-id="${player.playerId}"><div class="player-name-row"><input class="dialogue-player-name" value="${LS.util.escape(player.name)}" aria-label="Player name"><button type="button" class="small ghost" data-remove-dialogue-player="${player.playerId}" ${state.dialoguePlayers.length === 1 ? "disabled" : ""}>×</button></div><textarea class="dialogue-player-message" rows="3" placeholder="${npc ? `Speak to ${LS.util.escape(npc.name)}…` : "Choose an NPC first…"}" ${npc ? "" : "disabled"}></textarea><button type="button" class="small full" data-queue-dialogue-player="${player.playerId}" ${npc ? "" : "disabled"}>Queue message</button></article>`).join("");
  }
  function renderPending(state, npc) {
    const list = byId("pendingDialogueList"); if (!list) return;
    const pending = npc ? LS.dialogue.pending(npc.npcId, state) : [];
    list.innerHTML = pending.length ? pending.map(item => `<article class="pending-dialogue-item"><b>${LS.util.escape(item.playerName || "Player")}</b><p>${LS.util.escape(item.text)}</p></article>`).join("") : `<p class="empty-state">No pending messages.</p>`;
  }
  function renderEncounter(state, npc) {
    const empty = byId("conversationEmpty"), workspace = byId("conversationWorkspace"); if (!empty || !workspace) return;
    if (!npc) { empty.hidden = false; workspace.hidden = true; return; }
    C.normalizeNpc(npc); empty.hidden = true; workspace.hidden = false;
    byId("conversationNpcToken").innerHTML = LS.tokens.tokenMarkup(npc, { state });
    byId("conversationNpcName").textContent = npc.name; byId("conversationNpcHeading").textContent = npc.name;
    byId("conversationNpcMeta").textContent = `${npc.systemProfile?.systemName || "System Agnostic"} · ${npc.systemProfile?.ancestry || npc.raceName || "User-defined identity"}${npc.systemProfile?.role ? ` · ${npc.systemProfile.role}` : ` · ${npc.profession || "community member"}`}`;
    byId("conversationStatus").textContent = npc.simulation?.currentReaction?.label || "Available";
    byId("conversationNpcDescription").textContent = npc.public?.description || "No public description has been written.";
    byId("conversationNpcTags").innerHTML = [npc.dialogue?.tone, npc.dialogue?.speechStyle, npc.dialogueState?.mood, ...(npc.factionIds || []).map(id => state.factions.find(item => item.factionId === id)?.name)].filter(Boolean).map(value => `<span>${LS.util.escape(value)}</span>`).join("");
    const messages = thread(npc.npcId, state); const latestNpc = [...messages].reverse().find(item => item.role === "npc");
    byId("npcSpeechText").textContent = latestNpc?.text || "Waiting for the players.";
    byId("dialogueThinking").hidden = state.ui.dialogueThinkingNpcId !== npc.npcId;
    const log = byId("conversationLog");
    log.innerHTML = messages.length ? messages.map(message => `<div class="dialogue-message ${message.role}"><b>${message.role === "npc" ? LS.util.escape(npc.name) : LS.util.escape(message.playerName || "You")}</b>${message.targetPlayerIds?.length ? `<span class="message-target">to ${message.targetPlayerIds.map(id => state.dialoguePlayers.find(player => player.playerId === id)?.name || id).map(LS.util.escape).join(", ")}</span>` : ""}<p>${LS.util.escape(message.text)}</p><small>${new Date(message.at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} · ${LS.util.escape(message.engine || "")}</small></div>`).join("") : `<p class="empty-state">Queue a player message to begin this conversation.</p>`;
    log.scrollTop = log.scrollHeight;
  }

  function renderProfile(state) {
    const select = byId("speechProfileNpc"); if (!select) return;
    const selected = state.ui.selectedNpcId || state.npcs[0]?.npcId || "";
    select.innerHTML = `<option value="">Choose an NPC</option>${state.npcs.map(npc => `<option value="${npc.npcId}">${LS.util.escape(npc.name)}</option>`).join("")}`; select.value = selected;
    const npc = state.npcs.find(item => item.npcId === select.value); const form = byId("speechProfileForm"), empty = byId("speechProfileEmpty");
    if (!npc) { form.hidden = true; empty.hidden = false; return; }
    C.normalizeNpc(npc); form.hidden = false; empty.hidden = true;
    byId("speechTone").value = npc.dialogue.tone || ""; byId("speechStyle").value = npc.dialogue.speechStyle || ""; byId("speechVerbosity").value = npc.dialogue.verbosity || "balanced"; byId("speechFormality").value = npc.dialogue.formality || "contextual";
    byId("speechResponseMode").value = npc.dialogue.responseMode || "adaptive"; byId("speechMultiStrategy").value = npc.dialogue.multiPlayerStrategy || "synthesize";
    byId("speechMannerisms").value = lines(npc.dialogue.mannerisms); byId("speechVocabulary").value = lines(npc.dialogue.vocabulary); byId("speechForbidden").value = lines(npc.dialogue.forbiddenTopics); byId("speechDisclosure").value = lines(npc.dialogue.disclosureRules); byId("speechLanguages").value = lines(npc.dialogue.languages);
    byId("speechMood").value = npc.dialogueState.mood || "neutral"; byId("speechStress").value = Number(npc.dialogueState.stress || 0); byId("speechMemories").value = JSON.stringify(npc.private.memories || [], null, 2);
  }
  function saveProfile(event) {
    event.preventDefault(); const npcId = byId("speechProfileNpc").value; if (!npcId) return;
    let memories; try { memories = JSON.parse(byId("speechMemories").value || "[]"); if (!Array.isArray(memories)) throw new Error("Memories must be a JSON array."); } catch (error) { LS.app.toast(error.message, "error"); return; }
    LS.store.update(state => {
      const npc = state.npcs.find(item => item.npcId === npcId); if (!npc) return state; C.normalizeNpc(npc);
      Object.assign(npc.dialogue, { tone: byId("speechTone").value.trim(), speechStyle: byId("speechStyle").value.trim(), verbosity: byId("speechVerbosity").value, formality: byId("speechFormality").value, responseMode: byId("speechResponseMode").value, multiPlayerStrategy: byId("speechMultiStrategy").value, mannerisms: parseLines(byId("speechMannerisms").value), vocabulary: parseLines(byId("speechVocabulary").value), forbiddenTopics: parseLines(byId("speechForbidden").value), disclosureRules: parseLines(byId("speechDisclosure").value), languages: parseLines(byId("speechLanguages").value) });
      npc.dialogueState.mood = byId("speechMood").value.trim() || "neutral"; npc.dialogueState.stress = Math.max(0, Math.min(100, Number(byId("speechStress").value) || 0)); npc.dialogueState.lastUpdated = LS.util.now(); npc.private.memories = memories; npc.modifiedAt = LS.util.now(); return state;
    });
    LS.app.toast("NPC speech profile saved."); render();
  }

  function contextCard(kind, record) {
    const id = kind === "faction" ? record.factionId : record.questId; const title = kind === "faction" ? record.name : record.title;
    const detail = kind === "faction" ? `${record.public?.reputation || "unknown reputation"} · ${(record.memberNpcIds || []).length} members` : `${record.status || "available"} · ${record.currentStageId || "0"}`;
    const description = kind === "faction" ? record.public?.description : record.summary;
    return `<article class="context-record"><header><div><h4>${LS.util.escape(title)}</h4><span>${LS.util.escape(detail)}</span></div><div class="button-row"><button type="button" class="small ghost" data-edit-dialogue-context="${kind}" data-context-id="${id}">Edit JSON</button><button type="button" class="small ghost" data-delete-dialogue-context="${kind}" data-context-id="${id}">Delete</button></div></header><p>${LS.util.escape(description || "No public description.")}</p></article>`;
  }
  function renderWorld(state) {
    if (!byId("dialogueFactionBoard")) return;
    byId("dialogueFactionBoard").innerHTML = state.factions.length ? state.factions.map(record => contextCard("faction", record)).join("") : `<p class="empty-state">No faction records.</p>`;
    byId("dialogueQuestBoard").innerHTML = state.quests.length ? state.quests.map(record => contextCard("quest", record)).join("") : `<p class="empty-state">No quest records.</p>`;
  }
  function openContext(kind, id = null) {
    const state = LS.store.get(); const record = id ? (kind === "faction" ? state.factions.find(item => item.factionId === id) : state.quests.find(item => item.questId === id)) : (kind === "faction" ? C.defaultFaction() : C.defaultQuest());
    contextEditor = { kind, id: id || (kind === "faction" ? record.factionId : record.questId) }; byId("dialogueContextDialogTitle").textContent = `${id ? "Edit" : "Create"} ${kind}`; byId("dialogueContextJson").value = JSON.stringify(record, null, 2); byId("dialogueContextDialog").showModal();
  }
  function saveContext() {
    if (!contextEditor) return; try {
      const record = JSON.parse(byId("dialogueContextJson").value); const idKey = contextEditor.kind === "faction" ? "factionId" : "questId"; record[idKey] = contextEditor.id; record.modifiedAt = LS.util.now(); C.upsert(contextEditor.kind, record); byId("dialogueContextDialog").close(); LS.app.toast(`${contextEditor.kind} record saved.`); render();
    } catch (error) { LS.app.toast(`Invalid JSON: ${error.message}`, "error"); }
  }

  function renderReview(state) {
    if (!byId("dialogueReviewBoard")) return; byId("dialogueReviewCount").textContent = state.dialogueReview.length;
    byId("dialogueReviewBoard").innerHTML = state.dialogueReview.length ? state.dialogueReview.map(item => `<article class="review-record ${item.safe ? "safe" : "caution"}"><header><div><h4>${LS.util.escape(item.summary)}</h4><span>${LS.util.escape(item.recordType)} · ${item.diff.length} field change${item.diff.length === 1 ? "" : "s"}</span></div><div class="button-row"><button type="button" class="small" data-apply-dialogue-review="${item.reviewId}">Apply</button><button type="button" class="small ghost" data-reject-dialogue-review="${item.reviewId}">Reject</button></div></header><details><summary>Inspect changes</summary><pre>${LS.util.escape(JSON.stringify(item.diff, null, 2))}</pre></details></article>`).join("") : `<p class="empty-state">No conversation state changes are waiting for review.</p>`;
  }
  function renderTranscript(state) {
    const board = byId("dialogueTranscriptBoard"); if (!board) return;
    const entries = state.npcs.flatMap(npc => thread(npc.npcId, state).map(message => ({ npc, message }))).sort((a, b) => new Date(a.message.at) - new Date(b.message.at));
    board.innerHTML = entries.length ? entries.map(({ npc, message }) => `<article class="transcript-entry ${message.role}"><header><b>${message.role === "npc" ? LS.util.escape(npc.name) : LS.util.escape(message.playerName || "Player")}</b><span>${new Date(message.at).toLocaleString()}</span></header><p>${LS.util.escape(message.text)}</p><small>${LS.util.escape(npc.name)} · ${LS.util.escape(message.engine || "")}</small></article>`).join("") : `<p class="empty-state">No conversations have been recorded.</p>`;
    const settings = state.dialogueSettings; byId("dialogueBackendEnabled").checked = settings.backendEnabled; byId("dialogueBackendEndpoint").value = settings.backendEndpoint || ""; byId("dialogueBackendLibrary").value = settings.backendLibraryUrl || ""; byId("dialogueBackendTimeout").value = settings.backendTimeoutMs || 30000; byId("dialogueFallbackEnabled").checked = settings.fallbackEnabled; byId("dialogueDefaultResponseMode").value = settings.responseMode || "adaptive"; byId("dialogueMemoryTurns").value = settings.memoryTurns || 18; byId("dialogueReviewChanges").checked = settings.reviewStateChanges !== false;
    byId("dialogueDiagnosticList").innerHTML = state.dialogueDiagnostics.length ? state.dialogueDiagnostics.slice(0, 20).map(item => `<article class="list-row"><header><h4>${LS.util.escape(item.engine)}</h4><span class="change-count">${new Date(item.at).toLocaleTimeString()}</span></header><p>${item.backendError ? `Backend error: ${LS.util.escape(item.backendError)}` : "Response completed without a backend error."}${item.warnings?.length ? ` · ${LS.util.escape(item.warnings.join(" · "))}` : ""}</p></article>`).join("") : `<p class="empty-state">No dialogue diagnostics yet.</p>`;
  }
  function renderSettingsStatus(state) {
    const status = byId("dialogueBackendStatus"); if (!status) return;
    const latest = state.dialogueDiagnostics[0];
    if (!state.dialogueSettings.backendEnabled) { status.textContent = "Local fallback mode"; status.classList.add("cyan"); }
    else if (latest?.backendError) { status.textContent = "Backend fallback used"; status.classList.remove("cyan"); }
    else if (latest?.engine === "backend") { status.textContent = "Backend connected"; status.classList.add("cyan"); }
    else { status.textContent = "Backend enabled"; status.classList.add("cyan"); }
  }

  function render() {
    const state = LS.store.get(); const npc = selectedNpc(state);
    renderRoster(state); renderPlayers(state, npc); renderPending(state, npc); renderEncounter(state, npc); renderProfile(state); renderWorld(state); renderReview(state); renderTranscript(state); renderSettingsStatus(state);
    const tab = state.ui.dialogueTab || "stage"; root().querySelectorAll("[data-dialogue-tab]").forEach(button => button.classList.toggle("active", button.dataset.dialogueTab === tab)); root().querySelectorAll("[data-dialogue-tab-panel]").forEach(panel => panel.classList.toggle("active", panel.dataset.dialogueTabPanel === tab));
    if (byId("dialogueResponseWindow")) byId("dialogueResponseWindow").value = String(state.dialogueSettings.responseWindowMs || 0);
  }

  async function respondNow() {
    const npc = selectedNpc(); if (!npc) { LS.app.toast("Choose an NPC first.", "error"); return; }
    render(); try { await LS.dialogue.respond(npc.npcId, { force: true }); LS.app.renderPeople(); render(); } catch (error) { LS.app.toast(error.message, "error"); render(); }
  }
  function saveSettings(event) {
    event.preventDefault(); LS.store.update(state => { Object.assign(state.dialogueSettings, { backendEnabled: byId("dialogueBackendEnabled").checked, backendEndpoint: byId("dialogueBackendEndpoint").value.trim(), backendLibraryUrl: byId("dialogueBackendLibrary").value.trim(), backendTimeoutMs: Math.max(3000, Math.min(120000, Number(byId("dialogueBackendTimeout").value) || 30000)), fallbackEnabled: byId("dialogueFallbackEnabled").checked, responseMode: byId("dialogueDefaultResponseMode").value, memoryTurns: Math.max(2, Math.min(100, Number(byId("dialogueMemoryTurns").value) || 18)), reviewStateChanges: byId("dialogueReviewChanges").checked }); return state; }); LS.app.toast("Dialogue settings saved."); render();
  }
  async function testBackend() { const status = byId("dialogueBackendStatus"); status.textContent = "Testing backend…"; const result = await LS.dialogueBackend.test(); status.textContent = result.ok ? "Backend connected" : "Backend unavailable"; LS.app.toast(result.ok ? "Dialogue backend responded." : `Backend test failed: ${result.text}`, result.ok ? "info" : "error"); }
  function exportTranscript() {
    const state = LS.store.get(); const payload = { schema: "lifesimulator.dialogue-transcript.v1", exportedAt: LS.util.now(), project: { projectId: state.project.projectId, name: state.project.name }, conversations: state.conversations, players: state.dialoguePlayers, diagnostics: state.dialogueDiagnostics };
    LS.util.download(`${LS.util.safeFileName(state.project.name)}_Dialogue_Transcript.json`, JSON.stringify(payload, null, 2));
  }

  function bind() {
    root().querySelectorAll("[data-dialogue-tab]").forEach(button => button.addEventListener("click", () => switchTab(button.dataset.dialogueTab)));
    byId("conversationRoster").addEventListener("click", event => { const button = event.target.closest("[data-conversation-npc]"); if (button) open(button.dataset.conversationNpc); });
    byId("conversationNpcSearch").addEventListener("input", render);
    byId("respondNowBtn").addEventListener("click", respondNow); byId("respondNowSideBtn").addEventListener("click", respondNow);
    byId("dialogueResponseWindow").addEventListener("change", event => LS.store.update(state => { state.dialogueSettings.responseWindowMs = Number(event.target.value); return state; }));
    byId("addDialoguePlayerBtn").addEventListener("click", () => { LS.store.update(state => { if (state.dialoguePlayers.length < LS.CONFIG.dialogueLimits.maxPlayers) state.dialoguePlayers.push({ playerId: LS.util.uid("player"), name: `Player ${state.dialoguePlayers.length + 1}` }); return state; }); render(); });
    byId("dialoguePlayerList").addEventListener("change", event => { const card = event.target.closest("[data-player-id]"); if (!card || !event.target.matches(".dialogue-player-name")) return; LS.store.update(state => { const player = state.dialoguePlayers.find(item => item.playerId === card.dataset.playerId); if (player) player.name = event.target.value.trim() || "Player"; return state; }); });
    byId("dialoguePlayerList").addEventListener("click", event => {
      const remove = event.target.closest("[data-remove-dialogue-player]"); if (remove) { LS.store.update(state => { if (state.dialoguePlayers.length > 1) state.dialoguePlayers = state.dialoguePlayers.filter(item => item.playerId !== remove.dataset.removeDialoguePlayer); return state; }); render(); return; }
      const queue = event.target.closest("[data-queue-dialogue-player]"); if (!queue) return; const npc = selectedNpc(); if (!npc) return; const state = LS.store.get(); const player = state.dialoguePlayers.find(item => item.playerId === queue.dataset.queueDialoguePlayer); const card = queue.closest("[data-player-id]"); const input = card.querySelector(".dialogue-player-message"); try { LS.dialogue.queueMessage(npc.npcId, player, input.value); input.value = ""; render(); } catch (error) { LS.app.toast(error.message, "error"); }
    });
    byId("clearPendingDialogueBtn").addEventListener("click", () => { const npc = selectedNpc(); if (npc) LS.dialogue.clearPending(npc.npcId); render(); });
    byId("speechProfileNpc").addEventListener("change", event => { LS.store.update(state => { state.ui.selectedNpcId = event.target.value || null; return state; }, { save: false }); render(); }); byId("speechProfileForm").addEventListener("submit", saveProfile);
    byId("newDialogueFactionBtn").addEventListener("click", () => openContext("faction")); byId("newDialogueQuestBtn").addEventListener("click", () => openContext("quest")); byId("saveDialogueContextBtn").addEventListener("click", saveContext);
    document.addEventListener("click", event => {
      const edit = event.target.closest("[data-edit-dialogue-context]"); if (edit) { openContext(edit.dataset.editDialogueContext, edit.dataset.contextId); return; }
      const del = event.target.closest("[data-delete-dialogue-context]"); if (del && confirm(`Delete this ${del.dataset.deleteDialogueContext} record?`)) { C.remove(del.dataset.deleteDialogueContext, del.dataset.contextId); render(); return; }
      const apply = event.target.closest("[data-apply-dialogue-review]"); if (apply) { C.applyReview(apply.dataset.applyDialogueReview); LS.app.renderPeople(); render(); return; }
      const reject = event.target.closest("[data-reject-dialogue-review]"); if (reject) { C.rejectReview(reject.dataset.rejectDialogueReview); render(); }
    });
    byId("applySafeDialogueReviewsBtn").addEventListener("click", () => { const ids = LS.store.get().dialogueReview.filter(item => item.safe).map(item => item.reviewId); ids.forEach(C.applyReview); LS.app.renderPeople(); render(); });
    byId("dialogueSettingsForm").addEventListener("submit", saveSettings); byId("testDialogueBackendBtn").addEventListener("click", testBackend);
    byId("exportDialogueTranscriptBtn").addEventListener("click", exportTranscript); byId("clearDialogueTranscriptBtn").addEventListener("click", () => { if (!confirm("Clear every NPC conversation transcript?")) return; LS.store.update(state => { state.conversations = {}; state.pendingByNpc = {}; return state; }); render(); });
  }

  LS.conversations = Object.freeze({ thread, open, switchTab, render, bind, respondNow });
})(window);
