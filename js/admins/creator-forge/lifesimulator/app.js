(function (global) {
  "use strict";
  const LS = global.LifeSimulator;
  let editorTarget = null;
  let borderTargetNpcId = null;
  let toastTimer = null;

  function root() { return document.getElementById("life-native") || document; }
  function byId(id) { return root().querySelector("#" + CSS.escape(id)); }
  function toast(message, type = "info") {
    const element = byId("life-toast");
    element.textContent = message; element.dataset.type = type; element.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => element.classList.remove("show"), 3300);
  }
  function switchView(view) {
    root().querySelectorAll("[data-view-panel]").forEach(panel => panel.classList.toggle("active", panel.dataset.viewPanel === view));
    root().querySelectorAll("[data-view]").forEach(button => button.classList.toggle("active", button.dataset.view === view));
    LS.store.update(state => { state.ui.activeView = view; return state; }, { save: false });
    if (view === "conversations") LS.conversations.render();
    if (view === "mapviewer") LS.mapViewer?.syncSemanticNodes?.({ openRoot: !LS.mapViewer.runtime.current });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function metric(value, label, note = "") { return `<article class="metric"><b>${LS.util.escape(value)}</b><span>${LS.util.escape(label)}</span>${note ? `<em>${LS.util.escape(note)}</em>` : ""}</article>`; }
  function empty(message) { return `<div class="empty-card">${LS.util.escape(message)}</div>`; }
  function optionsEra(includeDefault = true) {
    return `${includeDefault ? `<option value="">Project default</option>` : ""}${LS.CONFIG.eraLabels.map((label, value) => `<option value="${value}">${value} · ${LS.util.escape(label)}</option>`).join("")}`;
  }

  function renderDashboard() {
    const state = LS.store.get();
    byId("projectChip").textContent = state.project.name;
    byId("eraChip").textContent = LS.CONFIG.eraLabels[state.project.era] || "User-defined era";
    byId("projectName").value = state.project.name;
    byId("projectGenre").value = state.project.genre;
    byId("projectDescription").value = state.project.description || "";
    byId("eraSlider").value = state.project.era;
    byId("eraOutput").textContent = `${state.project.era} · ${LS.CONFIG.eraLabels[state.project.era]}`;
    byId("defaultBiome").innerHTML = LS.biomes.groupedOptions(state.project.defaultBiomeId, true);
    byId("projectMetrics").innerHTML = [
      metric(state.npcs.length, "NPCs", "live tokens assigned"), metric(state.locations.length, "Locations", "semantic place records"),
      metric(LS.species.allRaces(state).length, "Body forms", "protected registry + custom"), metric(Object.keys(LS.systems?.catalog || {}).length, "Rules systems", "attached TableGate references")
    ].join("");
    byId("developmentSliders").innerHTML = LS.CONFIG.developmentAxes.map(axis => `<div class="slider-row"><label>${LS.util.escape(axis)}<output>${Number(state.project.development[axis] ?? 5)}</output></label><input type="range" min="0" max="10" step="1" value="${Number(state.project.development[axis] ?? 5)}" data-development-axis="${LS.util.escape(axis)}"></div>`).join("");
    byId("biomeCatalog").innerHTML = LS.biomes.categories.map(category => `<section class="biome-group"><b>${LS.util.escape(category.label)}</b>${category.biomes.map(item => `<span><code>${LS.util.escape(item.path)}</code></span>`).join("")}</section>`).join("");
    byId("npcSidebarCount").textContent = state.npcs.length;
    byId("locationSidebarCount").textContent = state.locations.length;
  }

  function selectedHeritageId() {
    const raw = byId("npcHeritageSearch").value;
    const match = raw.match(/^\[([^\]]+)\]/);
    return match ? match[1] : null;
  }
  function updateNpcRaceSelectors() {
    const state = LS.store.get();
    const categoryId = byId("npcCategory").value;
    const previousRace = byId("npcRace").value;
    const raceChoices = categoryId ? LS.species.racesForCategory(categoryId, state) : LS.species.allRaces(state);
    byId("npcRace").innerHTML = `<option value="">Any body form${categoryId ? " in this category" : " across the complete TableGate registry"}</option>${raceChoices.map(race => `<option value="${race.raceId}"${race.raceId === previousRace ? " selected" : ""}>${LS.util.escape(race.name)}${categoryId ? "" : ` · ${LS.util.escape(race.category)}`}</option>`).join("")}`;
    const raceId = byId("npcRace").value;
    byId("npcLineage").innerHTML = raceId ? LS.species.lineageOptions(raceId, byId("npcLineage").value, state, true) : `<option value="">Any valid bloodline / lineage</option>`;
  }
  function updateLocationSelector() {
    const state = LS.store.get();
    const options = state.locations.map(location => `<option value="${location.locationId}">${LS.util.escape(location.name)} · ${LS.util.escape(location.mapLevel || location.type || "location")}</option>`).join("");
    [["npcLocation", "Any or none"], ["townParentLocation", "Top-level / project root"]].forEach(([id, blank]) => {
      const select = byId(id); if (!select) return; const current = select.value;
      select.innerHTML = `<option value="">${blank}</option>${options}`;
      if ([...select.options].some(option => option.value === current)) select.value = current;
    });
  }
  function readNpcPronounOverride() {
    const ids = ["npcPronounsLabel", "npcPronounSubject", "npcPronounObject", "npcPronounPossAdj", "npcPronounPoss", "npcPronounReflexive"];
    if (!ids.some(id => byId(id)?.value.trim())) return null;
    return { label: byId("npcPronounsLabel").value.trim(), subject: byId("npcPronounSubject").value.trim(), object: byId("npcPronounObject").value.trim(), possessiveAdjective: byId("npcPronounPossAdj").value.trim(), possessivePronoun: byId("npcPronounPoss").value.trim(), reflexive: byId("npcPronounReflexive").value.trim(), agreement: byId("npcPronounAgreement").value };
  }
  function loadNpcIdentityPronouns() {
    const profile = LS.identities.resolve(byId("npcGender").value);
    const pronouns = profile?.pronouns || {};
    byId("npcPronounsLabel").value = pronouns.label || ""; byId("npcPronounSubject").value = pronouns.subject || ""; byId("npcPronounObject").value = pronouns.object || ""; byId("npcPronounPossAdj").value = pronouns.possessiveAdjective || ""; byId("npcPronounPoss").value = pronouns.possessivePronoun || ""; byId("npcPronounReflexive").value = pronouns.reflexive || ""; byId("npcPronounAgreement").value = pronouns.agreement || "plural";
  }
  function renderPeople() {
    const state = LS.store.get();
    updateLocationSelector();
    const query = byId("npcSearch").value.trim().toLowerCase();
    const records = state.npcs.filter(npc => !query || `${npc.name} ${npc.raceName} ${npc.lineageName || ""} ${npc.systemProfile?.ancestry || ""} ${npc.systemProfile?.role || ""} ${npc.profession} ${npc.genderIdentity} ${npc.simulation?.currentReaction?.label || ""}`.toLowerCase().includes(query));
    byId("npcResultCount").textContent = `${records.length} of ${state.npcs.length} NPCs`;
    byId("npcGrid").innerHTML = records.length ? records.map(npc => {
      const location = state.locations.find(item => item.locationId === npc.simulation?.currentLocationId);
      return `<article class="record-card npc-card">
        <header><div class="token-cell">${LS.tokens.tokenMarkup(npc, { state })}</div><div class="record-title"><h4>${LS.util.escape(npc.name)}</h4><p class="sub">${LS.util.escape(npc.systemProfile?.systemName || "System Agnostic")} · ${LS.util.escape(npc.systemProfile?.ancestry || npc.raceName)}${npc.systemProfile?.heritage ? ` · ${LS.util.escape(npc.systemProfile.heritage)}` : ""} · ${LS.util.escape(npc.genderIdentity)}</p></div><span class="badge">${LS.util.escape(npc.simulation?.currentReaction?.label || "Available")}</span></header>
        <dl><dt>${LS.util.escape(npc.systemProfile?.roleLabel || "Role / Class")}</dt><dd>${LS.util.escape(npc.systemProfile?.role || npc.profession)}</dd><dt>Specialization</dt><dd>${LS.util.escape(npc.systemProfile?.specialization || "None")}</dd><dt>Profession</dt><dd>${LS.util.escape(npc.profession)}</dd><dt>Current place</dt><dd>${LS.util.escape(location?.name || "Unassigned")}</dd><dt>Age / life stage</dt><dd>${LS.util.escape(npc.age != null ? `${npc.age} · ${npc.lifeStage || "adult"}` : npc.lifeStage || "User-defined")}</dd><dt>Aspiration</dt><dd>${LS.util.escape(npc.aspiration || npc.goals?.[0] || "User-defined")}</dd><dt>Pronouns</dt><dd>${LS.util.escape(npc.pronouns?.label || "they/them")}</dd><dt>Relationships</dt><dd>${Number(npc.relationships?.length || 0)}</dd>${npc.classicDndOverlay ? `<dt>Classic overlay</dt><dd>${LS.util.escape([npc.classicDndOverlay.className, npc.classicDndOverlay.background].filter(Boolean).join(" · "))}</dd>` : ""}</dl>
        <div class="card-actions"><button class="small" data-talk-npc="${npc.npcId}">Talk</button><button class="small ghost" data-edit-record="npcs" data-record-id="${npc.npcId}">Edit</button><button class="small ghost" data-assign-border="${npc.npcId}">Border</button><button class="small danger" data-delete-record="npcs" data-record-id="${npc.npcId}">Delete</button></div>
      </article>`;
    }).join("") : empty("No NPCs match this search. Generate a batch with any rules system and any TableGate body form.");
  }

  function renderLocations() {
    const state = LS.store.get();
    const query = byId("locationSearch").value.trim().toLowerCase();
    const records = state.locations.filter(location => !query || `${location.name} ${location.type} ${(location.services || []).join(" ")} ${location.biomePath || ""}`.toLowerCase().includes(query));
    byId("locationResultCount").textContent = `${records.length} of ${state.locations.length} locations`;
    byId("locationGrid").innerHTML = records.length ? records.map(location => {
      const present = state.npcs.filter(npc => npc.simulation?.currentLocationId === location.locationId);
      return `<article class="record-card location-card"><header><div><h4>${LS.util.escape(location.name)}</h4><p class="sub">${LS.util.escape(location.type)} · ${LS.util.escape(location.biomePath || "No biome assigned")}</p></div><span class="badge">${present.length} PRESENT</span></header>
        <dl><dt>Hierarchy level</dt><dd>${LS.util.escape(location.mapLevel || location.map?.nodeType || "location")}</dd><dt>Parent</dt><dd>${LS.util.escape(state.locations.find(item => item.locationId === location.parentLocationId)?.name || "Project root")}</dd><dt>Services</dt><dd>${LS.util.escape((location.services || []).join(", ") || "None yet")}</dd><dt>Hours</dt><dd>${LS.util.escape(location.hours ? `${location.hours.open}–${location.hours.close}` : "User-defined")}</dd><dt>Access</dt><dd>${LS.util.escape(location.accessibility?.notes || (location.accessibility?.stepFree ? "Step-free route recorded" : "Needs review"))}</dd><dt>Hook</dt><dd>${LS.util.escape(location.plotHooks?.[0] || "None yet")}</dd></dl>
        <div class="location-token-strip">${present.slice(0, 8).map(npc => LS.tokens.tokenMarkup(npc, { state })).join("")}${present.length > 8 ? `<span class="badge">+${present.length - 8}</span>` : ""}</div>
        <div class="card-actions"><button class="small map-open-button" data-open-location-map="${location.locationId}">Open in Map Viewer</button><button class="small ghost" data-edit-record="locations" data-record-id="${location.locationId}">Edit</button><button class="small danger" data-delete-record="locations" data-record-id="${location.locationId}">Delete</button></div></article>`;
    }).join("") : empty("No locations match this search. Create locations at any scale under any environmental path.");
  }

  function renderRaceCatalog() {
    const state = LS.store.get();
    const categoryId = byId("raceCatalogCategory").value;
    const query = byId("raceCatalogSearch").value.trim().toLowerCase();
    const races = LS.species.builtInRaces.filter(race => (!categoryId || race.categoryId === categoryId) && (!query || `${race.name} ${race.category} ${LS.species.lineagesForRace(race.raceId, state).map(item => item.name).join(" ")} ${race.canonicalProfile || ""}`.toLowerCase().includes(query)));
    byId("raceCatalog").innerHTML = races.length ? races.map(race => {
      const lineages = LS.species.lineagesForRace(race.raceId, state);
      return `<details class="race-entry"><summary><span><b>${LS.util.escape(race.name)}</b><small>${LS.util.escape(race.category)}</small></span><em>${race.tokenCount} tokens</em></summary>${race.canonicalProfile ? `<p>${LS.util.escape(race.canonicalProfile)}</p>` : ""}${lineages.length ? `<div class="lineage-tags">${lineages.map(item => `<span>${LS.util.escape(item.name)}</span>`).join("")}</div>` : `<p class="fineprint">No built-in bloodline selector.</p>`}</details>`;
    }).join("") : `<p class="empty-state">No canonical races match.</p>`;
  }
  function renderRaces() {
    const state = LS.store.get();
    const manifest = LS.tokens.verifyManifest();
    byId("raceMetrics").innerHTML = [metric(Object.keys(LS.systems?.catalog || {}).length, "Rules systems", "attached references"), metric(LS.species.categories.length, "Form categories", "setting-neutral visual registry"), metric(global.LS_BOOTSTRAP.mixed.records.length, "Ordered mixed forms", "protected registry"), metric(manifest.expectedTokens, "Expected portrait files", "all paths embedded")].join("");
    renderRaceCatalog();
    byId("customRaceGrid").innerHTML = state.customRaces.length ? state.customRaces.map(race => `<article class="record-card"><header><div><h4>${LS.util.escape(race.name)}</h4><p class="sub">${LS.util.escape(race.category)} · ${(race.lineages || []).length} bloodline/lineage entries</p></div><span class="badge">HOMEBREW</span></header><p>${LS.util.escape(race.canonicalProfile || "No profile entered.")}</p><div class="identity-art-row">${LS.CONFIG.genderIdentities.map(identity => `<span class="identity-dot${race.tokenArt?.[identity] ? " complete" : ""}" title="${LS.util.escape(identity)}">${LS.util.escape(identity.slice(0, 2))}</span>`).join("")}</div><div class="card-actions"><button class="small ghost" data-edit-record="customRaces" data-record-id="${race.raceId}">Edit</button><button class="small danger" data-delete-record="customRaces" data-record-id="${race.raceId}">Delete</button></div></article>`).join("") : empty("No homebrew races yet. Use the integrated creator above.");
  }

  function renderSimulation() {
    const state = LS.store.get();
    const absolute = state.simulation.absoluteMinute ?? state.project.calendar.currentAbsoluteMinute ?? 0;
    byId("simStatus").textContent = String(state.simulation.status || "paused").toUpperCase();
    byId("simTime").textContent = LS.simulation.formatTime(absolute);
    byId("simBranch").textContent = state.simulation.branch || "main";
    byId("simSpeed").value = state.simulation.speed || 60; byId("simSpeedOut").textContent = state.simulation.speed || 60;
    byId("liveTokenGrid").innerHTML = state.npcs.length ? state.npcs.slice(0, 120).map(npc => `<article class="live-token-item">${LS.tokens.tokenMarkup(npc, { state })}<b>${LS.util.escape(npc.name)}</b><span>${LS.util.escape(npc.simulation?.currentReaction?.label || "Available")}</span></article>`).join("") : `<p class="empty-state">Generate NPCs to see live reactions.</p>`;
    byId("eventLog").innerHTML = state.events.length ? state.events.slice(0, 50).map(event => `<article class="list-row"><header><h4>${LS.util.escape(event.label)}</h4><span class="change-count">${LS.simulation.formatTime(event.absoluteMinute || 0)}</span></header><p>${LS.util.escape(event.type)} · ${new Date(event.at).toLocaleString()}</p></article>`).join("") : `<p class="empty-state">No events yet.</p>`;
    byId("savePointList").innerHTML = state.savePoints.length ? state.savePoints.map(point => `<article class="list-row"><header><h4>${LS.util.escape(point.label)}</h4><span class="change-count">${LS.simulation.formatTime(point.absoluteMinute)}</span></header><p>${new Date(point.createdAt).toLocaleString()}</p><div class="row-actions"><button class="small ghost" data-rewind="${point.savePointId}">Rewind</button></div></article>`).join("") : `<p class="empty-state">No save points yet.</p>`;
  }

  function validate() {
    const state = LS.store.get();
    const errors = [], warnings = [];
    const manifests = LS.tokens.verifyManifest();
    if (!LS.species.categories.length) errors.push("The TableGate body-form category registry is empty.");
    if (!LS.species.builtInRaces.length) errors.push("The TableGate protected body-form registry is empty.");
    if (!global.LS_BOOTSTRAP?.mixed?.records?.length) errors.push("The ordered mixed-heritage registry is empty.");
    if (!manifests.expectedTokens) warnings.push("No external token filename index is mounted; generated labels and retained art remain available.");
    if (!manifests.borders || !manifests.allBordersAssignable) errors.push("Token borders are missing or not fully assignable.");
    if (!LS.biomes.all.length || !LS.biomes.categories.length) errors.push("The environmental biome hierarchy is empty.");
    const systemEntries = Object.values(LS.systems?.catalog || {});
    if (!systemEntries.length) errors.push("No TableGate rules-system references are loaded.");
    systemEntries.forEach(system => {
      if (!system.editions || !Object.keys(system.editions).length) errors.push(`${system.name || "A rules system"}: no edition data is available.`);
    });
    state.npcs.forEach(npc => {
      if (!npc.npcId || !npc.name) errors.push("An NPC is missing a stable ID or name.");
      if (!LS.identities.resolve(npc.genderIdentityId || npc.genderIdentity, state)) warnings.push(`${npc.name}: identity profile is not present in the current identity registry.`);
      if (!npc.pronouns?.subject || !npc.pronouns?.object) warnings.push(`${npc.name}: pronoun forms are incomplete.`);
      if (!npc.token?.borderId) errors.push(`${npc.name}: no token border assignment.`);
      if (!npc.token?.relativePath) warnings.push(`${npc.name}: external portrait file is not mounted; labeled placeholder will be used.`);
      if (!npc.simulation?.currentReaction) warnings.push(`${npc.name}: no current activity reaction.`);
      if (!npc.dialogue || typeof npc.dialogue !== "object") errors.push(`${npc.name}: no integrated speech profile.`);
      if (!npc.dialogueState || typeof npc.dialogueState !== "object") errors.push(`${npc.name}: no dialogue state.`);
    });
    state.factions.forEach(faction => { if (!faction.factionId || !faction.name) errors.push("A faction is missing a stable ID or name."); });
    state.quests.forEach(quest => { if (!quest.questId || !quest.title) errors.push("A quest is missing a stable ID or title."); if (!Array.isArray(quest.stages)) errors.push(`${quest.title || "Quest"}: stages must be an array.`); });
    state.locations.forEach(location => { if (!location.locationId || !location.name) errors.push("A location is missing a stable ID or name."); if (location.biomeId && location.biomeId !== "auto" && !LS.biomes.resolve(location.biomeId)) warnings.push(`${location.name}: biome ID is not in the protected hierarchy.`); });
    const result = { lastRunAt: LS.util.now(), ready: errors.length === 0, errors: [...new Set(errors)], warnings: [...new Set(warnings)], counts: { categories: LS.species.categories.length, protectedBodyForms: LS.species.builtInRaces.length, mixedHeritage: global.LS_BOOTSTRAP.mixed.records.length, expectedTokens: manifests.expectedTokens, borders: manifests.borders, rulesSystems: systemEntries.length, reactions: LS.reactions.coreCount, biomes: LS.biomes.all.length, npcs: state.npcs.length, locations: state.locations.length, factions: state.factions.length, quests: state.quests.length, dialogueThreads: Object.keys(state.conversations || {}).length, pendingDialogueReview: state.dialogueReview.length } };
    LS.store.update(next => { next.validation = result; return next; }); return result;
  }
  function renderTransfer() {
    const state = LS.store.get();
    byId("importHistory").innerHTML = state.importHistory.length ? state.importHistory.map(item => `<article class="list-row"><header><h4>${LS.util.escape(item.sourceName)}</h4><span class="change-count">${new Date(item.at).toLocaleDateString()}</span></header><p>${item.npcs || 0} NPCs · ${item.locations || 0} locations · ${item.factions || 0} factions · ${item.quests || 0} quests · ${item.races || 0} races${item.ignoredPhysicalWorldFields?.length ? ` · ignored: ${LS.util.escape(item.ignoredPhysicalWorldFields.join(", "))}` : ""}</p></article>`).join("") : `<p class="empty-state">No external data imported.</p>`;
    const result = state.validation;
    byId("validationMetrics").innerHTML = [metric(result.errors?.length || 0, "Errors"), metric(result.warnings?.length || 0, "Warnings"), metric(LS.reactions.coreCount, "Core reactions"), metric(LS.tokens.borders.length, "Usable borders")].join("");
    const issues = [...(result.errors || []).map(message => ({ type: "error", message })), ...(result.warnings || []).map(message => ({ type: "warning", message }))];
    byId("validationIssues").innerHTML = result.lastRunAt ? (issues.length ? issues.map(issue => `<article class="list-row issue ${issue.type}"><h4>${issue.type === "error" ? "Blocking" : "Review"}</h4><p>${LS.util.escape(issue.message)}</p></article>`).join("") : `<div class="notice success"><strong>Ready:</strong> TableGate registries, rules-system references, and current records passed validation.</div>`) : `<p class="empty-state">Run validation to check registry completeness and current records.</p>`;
  }

  function renderAll() {
    renderDashboard(); LS.systems.populateProject(); LS.systems.populateNpcSelectors(); renderPeople(); renderLocations(); renderRaces(); LS.systems.renderCatalog(); renderSimulation(); renderTransfer(); LS.conversations.render(); LS.identities.renderManager(); LS.mapViewer?.renderRecordPanel?.();
  }

  function openEditor(kind, id) {
    const state = LS.store.get();
    const idField = { npcs: "npcId", locations: "locationId", customRaces: "raceId" }[kind];
    const record = state[kind].find(item => item[idField] === id); if (!record) return;
    editorTarget = { kind, id, idField }; byId("recordEditorTitle").textContent = `Edit ${record.name || kind}`; byId("recordEditorJson").value = JSON.stringify(record, null, 2); byId("recordEditorDialog").showModal();
  }
  function saveEditor() {
    if (!editorTarget) return;
    try {
      const value = JSON.parse(byId("recordEditorJson").value);
      value[editorTarget.idField] = editorTarget.id; value.modifiedAt = LS.util.now();
      LS.store.update(state => { const index = state[editorTarget.kind].findIndex(item => item[editorTarget.idField] === editorTarget.id); if (index >= 0) state[editorTarget.kind][index] = value; return state; });
      byId("recordEditorDialog").close(); toast("Record changes applied."); renderAll();
    } catch (error) { toast(`Invalid JSON: ${error.message}`, "error"); }
  }
  function deleteRecord(kind, id) {
    const idField = { npcs: "npcId", locations: "locationId", customRaces: "raceId" }[kind];
    if (!confirm("Delete this record? This can be reversed only from a save point or imported copy.")) return;
    LS.store.update(state => {
      state[kind] = state[kind].filter(item => item[idField] !== id);
      if (kind === "npcs") { delete state.conversations[id]; delete state.pendingByNpc[id]; state.relationships = state.relationships.filter(item => item.fromId !== id && item.toId !== id); state.factions.forEach(item => { item.memberNpcIds = (item.memberNpcIds || []).filter(value => value !== id); item.leaderNpcIds = (item.leaderNpcIds || []).filter(value => value !== id); }); state.quests.forEach(item => { item.giverNpcIds = (item.giverNpcIds || []).filter(value => value !== id); }); state.dialogueReview = state.dialogueReview.filter(item => item.recordId !== id); }
      if (kind === "locations") state.npcs.forEach(npc => { if (npc.workplaceLocationId === id) npc.workplaceLocationId = null; if (npc.residenceLocationId === id) npc.residenceLocationId = null; if (npc.simulation?.currentLocationId === id) npc.simulation.currentLocationId = null; });
      return state;
    }); renderAll(); toast("Record deleted.");
  }
  function renderNpcBorderPicker(query = "") {
    const state = LS.store.get(); const npc = state.npcs.find(item => item.npcId === borderTargetNpcId); if (!npc) return;
    byId("npcBorderPicker").innerHTML = LS.tokens.searchBorders(query).map(border => `<button type="button" class="border-option${npc.token?.borderId === border.borderId ? " selected" : ""}" data-npc-border-id="${border.borderId}"><img src="${LS.util.escape(border.relativePath)}" alt=""><span>${LS.util.escape(border.name)}</span></button>`).join("");
  }
  function openBorderDialog(npcId) { borderTargetNpcId = npcId; byId("npcBorderSearch").value = ""; renderNpcBorderPicker(); byId("borderAssignmentDialog").showModal(); }

  function bindProject() {
    const saveField = () => LS.store.update(state => { state.project.name = byId("projectName").value.trim() || "Untitled TableGate Project"; state.project.genre = byId("projectGenre").value; state.project.description = byId("projectDescription").value; state.project.era = Number(byId("eraSlider").value); state.project.defaultBiomeId = byId("defaultBiome").value; return state; });
    ["projectName", "projectGenre", "projectDescription", "defaultBiome"].forEach(id => byId(id).addEventListener("change", () => { saveField(); renderDashboard(); }));
    byId("eraSlider").addEventListener("input", event => { byId("eraOutput").textContent = `${event.target.value} · ${LS.CONFIG.eraLabels[event.target.value]}`; });
    byId("eraSlider").addEventListener("change", () => { saveField(); renderAll(); });
    byId("developmentSliders").addEventListener("input", event => { if (!event.target.matches("[data-development-axis]")) return; event.target.closest(".slider-row").querySelector("output").textContent = event.target.value; LS.store.update(state => { state.project.development[event.target.dataset.developmentAxis] = Number(event.target.value); return state; }); });
    byId("saveBtn").addEventListener("click", () => { LS.store.save(); toast("Project saved in this browser."); });
    byId("newProjectBtn").addEventListener("click", () => { if (confirm("Start a new TableGate LifeSimulator project? Export first if you need this project later.")) { LS.simulation.pause(); LS.store.reset(); setupSelectors(); renderAll(); toast("New project created."); } });
  }

  function bindGeneration() {
    byId("npcCategory").addEventListener("change", updateNpcRaceSelectors);
    byId("npcRace").addEventListener("change", updateNpcRaceSelectors);
    byId("npcHeritageSearch").addEventListener("input", LS.util.debounce(event => {
      const query = event.target.value.replace(/^\[[^\]]+\]\s*/, "").trim().toLowerCase(); if (query.length < 2) { byId("heritageSuggestions").innerHTML = ""; return; }
      byId("heritageSuggestions").innerHTML = global.LS_BOOTSTRAP.mixed.records.filter(item => `${item.dominantAncestry} ${item.secondaryAncestry}`.toLowerCase().includes(query)).slice(0, 80).map(item => `<option value="[${item.mixedHeritageId}] ${LS.util.escape(item.dominantAncestry)} + ${LS.util.escape(item.secondaryAncestry)} · ${LS.util.escape(item.compatibilityLabel)}"></option>`).join("");
    }, 120));
    byId("generateNpcsBtn").addEventListener("click", () => {
      const systemProfile = LS.systems.readNpcProfile();
      const created = LS.simulation.generateNPCs({ count: byId("npcCount").value, seed: byId("npcSeed").value, categoryId: byId("npcCategory").value, raceId: byId("npcRace").value, lineageId: byId("npcLineage").value, genderIdentity: byId("npcGender").value, pronouns: readNpcPronounOverride(), mixedHeritageId: selectedHeritageId(), era: byId("npcEra").value, locationId: byId("npcLocation").value, profession: byId("npcProfession").value.trim(), systemRole: systemProfile.role, systemProfile, personality: byId("npcPersonality").value, conversationEnabled: byId("npcConversationEnabled").checked });
      renderAll(); toast(`Generated ${created.length} NPC${created.length === 1 ? "" : "s"} with token, border, and activity bindings.`);
    });
    byId("generateLocationsBtn").addEventListener("click", () => {
      const services = byId("locationServices").value.split(",").map(value => value.trim()).filter(Boolean);
      const created = LS.simulation.generateLocations({ count: byId("locationCount").value, seed: byId("locationSeed").value, name: byId("locationName").value.trim(), type: byId("locationType").value.trim(), biomeId: byId("locationBiome").value, services: services.length ? services : undefined, era: byId("locationEra").value });
      renderAll(); toast(`Generated ${created.length} semantic location${created.length === 1 ? "" : "s"}.`);
    });
    byId("npcGender").addEventListener("change", loadNpcIdentityPronouns);
    byId("townGenerateBtn").addEventListener("click", () => {
      const result = LS.townAdapter.generateSettlement({ name: byId("townName").value.trim(), size: byId("townSize").value, seed: byId("townSeed").value, presentation: byId("townPresentation").value, parentLocationId: byId("townParentLocation").value, biomeId: byId("townBiome").value, structuresPerWard: byId("townStructuresPerWard").value, npcCount: byId("townNpcCount").value, includeCastle: byId("townIncludeCastle").checked, includeGate: byId("townIncludeGate").checked, includeWalls: byId("townIncludeWalls").checked, includeFarm: byId("townIncludeFarm").checked, includeMarket: byId("townIncludeMarket").checked, identityId: byId("townIdentity").value, systemProfile: LS.systems.readNpcProfile?.() });
      byId("townGenerationSummary").textContent = `${result.settlement?.name || "Settlement"}: ${result.wards.length} districts, ${result.locations.length} structures/landmarks, and ${result.npcs.length} NPCs added to TableGate and synchronized with Map Viewer.`;
      renderAll(); LS.mapViewer?.syncSemanticNodes?.({ openRoot: false }); toast(`Generated ${result.settlement?.name || "settlement"} for LifeSimulator and Map Viewer.`);
    });
    byId("npcSearch").addEventListener("input", renderPeople); byId("locationSearch").addEventListener("input", renderLocations);
  }

  function bindSimulation() {
    byId("playBtn").addEventListener("click", () => { LS.simulation.start(); renderSimulation(); });
    byId("pauseBtn").addEventListener("click", () => { LS.simulation.pause(); renderSimulation(); });
    byId("stepBtn").addEventListener("click", () => { LS.simulation.advance(60); renderAll(); });
    byId("simSpeed").addEventListener("input", event => { byId("simSpeedOut").textContent = event.target.value; LS.simulation.setSpeed(event.target.value); });
    byId("savePointBtn").addEventListener("click", () => { LS.simulation.savePoint(); renderSimulation(); toast("Save point created."); });
    byId("branchBtn").addEventListener("click", () => { LS.simulation.branch(); renderSimulation(); toast("Simulation branch created."); });
  }

  function bindTransfer() {
    const dropZone = byId("dropZone"), fileInput = byId("fileInput");
    byId("chooseFilesBtn").addEventListener("click", event => { event.stopPropagation(); fileInput.click(); });
    dropZone.addEventListener("click", event => { if (!event.target.closest("button")) fileInput.click(); });
    ["dragenter", "dragover"].forEach(type => dropZone.addEventListener(type, event => { event.preventDefault(); dropZone.classList.add("dragover"); }));
    ["dragleave", "drop"].forEach(type => dropZone.addEventListener(type, event => { event.preventDefault(); dropZone.classList.remove("dragover"); }));
    const process = async files => { const results = await LS.importers.handleFiles(files); const failures = results.filter(item => !item.ok); renderAll(); toast(failures.length ? `${results.length - failures.length} imported; ${failures.length} failed.` : `${results.length} file${results.length === 1 ? "" : "s"} imported.`, failures.length ? "error" : "info"); };
    dropZone.addEventListener("drop", event => process([...event.dataTransfer.files])); fileInput.addEventListener("change", event => process([...event.target.files]));
    byId("runValidationBtn").addEventListener("click", () => { const result = validate(); renderTransfer(); toast(result.ready ? "Validation passed." : `${result.errors.length} blocking issue(s) found.`, result.ready ? "info" : "error"); });
    byId("exportProjectBtn").addEventListener("click", LS.exporters.downloadProject); byId("exportZipBtn").addEventListener("click", LS.exporters.downloadZip);
    byId("exportPublicBtn").addEventListener("click", () => LS.exporters.downloadNpcs(true)); byId("exportValidationBtn").addEventListener("click", LS.exporters.downloadValidation);
    byId("exportPeopleBtn").addEventListener("click", () => LS.exporters.downloadNpcs(false)); byId("exportLocationsBtn").addEventListener("click", () => LS.exporters.downloadLocations(false)); byId("exportRacesBtn").addEventListener("click", LS.exporters.downloadCustomRaces); byId("exportMapManifestBtn").addEventListener("click", LS.mapViewer.exportManifest);
  }

  function setupSelectors() {
    byId("npcCategory").innerHTML = `<option value="">All categories</option>${LS.species.categoryOptions()}`;
    byId("npcCategory").value = ""; updateNpcRaceSelectors();
    byId("npcGender").innerHTML = LS.identities.options("", LS.store.get(), true); byId("townIdentity").innerHTML = LS.identities.options("", LS.store.get(), true);
    byId("npcEra").innerHTML = optionsEra(true); byId("locationEra").innerHTML = optionsEra(true);
    byId("locationBiome").innerHTML = LS.biomes.groupedOptions("auto", true); byId("townBiome").innerHTML = LS.biomes.groupedOptions("auto", true); updateLocationSelector(); loadNpcIdentityPronouns();
    byId("raceCatalogCategory").innerHTML = `<option value="">All 23 categories</option>${LS.species.categoryOptions()}`;
    byId("raceCatalogCategory").addEventListener("change", renderRaceCatalog); byId("raceCatalogSearch").addEventListener("input", renderRaceCatalog);
  }

  function bindGlobal() {
    root().querySelectorAll("[data-view]").forEach(button => button.addEventListener("click", () => switchView(button.dataset.view)));
    root().querySelectorAll("[data-view-jump]").forEach(button => button.addEventListener("click", () => switchView(button.dataset.viewJump)));
    document.addEventListener("click", event => {
      const talk = event.target.closest("[data-talk-npc]"); if (talk) { event.preventDefault(); event.stopPropagation(); LS.conversations.open(talk.dataset.talkNpc); return; }
      const edit = event.target.closest("[data-edit-record]"); if (edit) { openEditor(edit.dataset.editRecord, edit.dataset.recordId); return; }
      const del = event.target.closest("[data-delete-record]"); if (del) { deleteRecord(del.dataset.deleteRecord, del.dataset.recordId); return; }
      const border = event.target.closest("[data-assign-border]"); if (border) { openBorderDialog(border.dataset.assignBorder); return; }
      const openMap = event.target.closest("[data-open-location-map]"); if (openMap) { switchView("mapviewer"); LS.mapViewer?.openNode?.(`location:${openMap.dataset.openLocationMap}`); return; }
      const rewind = event.target.closest("[data-rewind]"); if (rewind && confirm("Rewind to this save point?")) { LS.simulation.rewind(rewind.dataset.rewind); renderAll(); toast("Simulation rewound."); }
    });
    byId("saveRecordEditorBtn").addEventListener("click", saveEditor);
    byId("npcBorderSearch").addEventListener("input", event => renderNpcBorderPicker(event.target.value));
    byId("npcBorderPicker").addEventListener("click", event => {
      const button = event.target.closest("[data-npc-border-id]"); if (!button) return;
      LS.store.update(state => { const npc = state.npcs.find(item => item.npcId === borderTargetNpcId); if (npc) npc.token.borderId = button.dataset.npcBorderId; return state; }); renderNpcBorderPicker(byId("npcBorderSearch").value); renderAll(); toast("Token border assigned.");
    });
  }

  function init() {
    LS.store.load();
    if (LS.store.get().simulation.absoluteMinute == null) LS.store.update(state => { state.simulation.absoluteMinute = state.project.calendar.currentAbsoluteMinute || 0; return state; });
    setupSelectors(); LS.systems.bind(); bindProject(); bindGeneration(); bindSimulation(); bindTransfer(); bindGlobal(); LS.identities.bindManager(); LS.raceCreator.bind(); LS.conversations.bind();
    const active = LS.store.get().ui.activeView || "dashboard"; renderAll(); switchView(active);
    setInterval(() => { if (LS.store.get().simulation.status === "running") renderAll(); }, 1100);
  }

  LS.app = Object.freeze({ init, toast, switchView, renderAll, renderPeople, renderLocations, renderRaces, renderSimulation, validate });
  document.addEventListener("DOMContentLoaded", init);
})(window);
