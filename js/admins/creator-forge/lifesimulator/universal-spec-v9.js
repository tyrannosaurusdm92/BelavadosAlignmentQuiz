(function (global) {
  "use strict";

  const LS = global.LifeSimulator = global.LifeSimulator || {};
  const SPEC_URL = "json/admins/lifesimulator/universal-spec-v9.json";
  const DB_NAME = "TableGateLifeSimulatorV9";
  const STORE_NAME = "projects";
  const DB_VERSION = 1;
  const REQUIRED_NEEDS = ["shelter", "air", "water", "food", "sanitation", "health", "emergency"];
  const SCALE_ALIASES = Object.freeze({
    "isolated site":"village", homestead:"village", camp:"village", encampment:"village", outpost:"village",
    waystation:"village", hamlet:"village", village:"village", "small colony":"village", "micro-habitat":"village",
    "tiny town":"town", "small town":"town", town:"town", "large town":"town", township:"town", borough:"town",
    "trade post":"town", "large colony":"town", "space station":"town",
    "small city":"city", city:"city", "large city":"city", metropolis:"city", arcology:"city", "major habitat":"city",
    "fleet-city":"city", spaceship:"city",
    capital:"capital", "regional capital":"capital", "national capital":"capital", "world capital":"capital",
    "system capital":"capital", "megacity capital":"capital", "command capital":"capital"
  });
  const FORMS = [
    "Terrestrial fixed", "Floating / water surface", "Underwater", "Subterranean", "Mobile land",
    "Airborne / atmospheric", "Spaceship", "Space station / orbital habitat", "Extraordinary / nonphysical", "Custom"
  ];
  const SCALE_LABELS = [
    "Hamlet", "Village", "Tiny Town", "Small Town", "Town", "Large Town", "Township", "City",
    "Metropolis", "Capital", "Spaceship", "Space Station", "Custom"
  ];
  const ERA_LABELS = [
    "Stone Age", "Early Metallurgy", "Iron / Classical", "Medieval", "Renaissance / Early Modern",
    "Industrial / Steam", "Electrified / Modern", "Digital / Atomic", "Planetary / Orbital",
    "Interplanetary", "Spacefaring / Interstellar", "Custom"
  ];

  let specPromise = null;
  let activeSpec = null;

  const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));
  const now = () => new Date().toISOString();
  const uid = prefix => LS.util?.uid?.(prefix) || `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  const escapeHtml = value => String(value == null ? "" : value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[char]);
  const round = value => Math.round((Number(value) + Number.EPSILON) * 1000) / 1000;
  const slug = value => String(value || "record").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "record";

  async function loadSpec() {
    if (activeSpec) return activeSpec;
    if (!specPromise) specPromise = fetch(SPEC_URL, {cache:"no-store"}).then(response => {
      if (!response.ok) throw new Error(`Universal specification could not be loaded (HTTP ${response.status}).`);
      return response.json();
    }).then(spec => {
      if (spec.schema !== "tablegate.life-simulator.universal-spec.v9") throw new Error("Unexpected Life Simulator specification schema.");
      activeSpec = Object.freeze(spec);
      return activeSpec;
    });
    return specPromise;
  }

  function scaleFamily(label, requested = "") {
    const explicit = String(requested || "").toLowerCase();
    if (["capital", "city", "town", "village"].includes(explicit)) return explicit;
    return SCALE_ALIASES[String(label || "").trim().toLowerCase()] || "town";
  }

  function validateHybrid(selections, spec = activeSpec) {
    const errors = [];
    const normalized = (Array.isArray(selections) ? selections : []).map(item => ({
      biomePath: String(item.biomePath || item.path || "").trim(),
      sourceProfileId: String(item.sourceProfileId || "").trim().toUpperCase(),
      weightPercent: Number(item.weightPercent)
    })).filter(item => item.biomePath || item.sourceProfileId || item.weightPercent);
    if (normalized.length < 1 || normalized.length > 3) errors.push("Choose one to three biome layers.");
    const total = normalized.reduce((sum, item) => sum + item.weightPercent, 0);
    if (normalized.some(item => !Number.isFinite(item.weightPercent) || item.weightPercent <= 0)) errors.push("Every selected biome must have a weight greater than zero.");
    if (Math.abs(total - 100) > 0.0001) errors.push(`Biome weights must total exactly 100%; current total is ${round(total)}%.`);
    const map = new Map((spec?.biomeMap || []).map(item => [item.path, item]));
    for (const item of normalized) {
      const mapped = map.get(item.biomePath);
      if (!item.sourceProfileId && mapped) item.sourceProfileId = mapped.sourceProfileId;
      if (!spec?.protectedBaselines?.[item.sourceProfileId]) errors.push(`${item.sourceProfileId || item.biomePath || "Biome"} has no protected B01–B22 baseline.`);
    }
    return {valid: errors.length === 0, errors, selections: normalized, total: round(total)};
  }

  function blendProtectedBaselines(selections, scale = "town", spec = activeSpec) {
    const check = validateHybrid(selections, spec);
    if (!check.valid) throw new Error(check.errors.join(" "));
    const family = scaleFamily("", scale);
    const categories = spec.functionalCategories || [];
    const result = {};
    for (const category of categories) {
      const contributions = check.selections.map(item => {
        const baseline = spec.protectedBaselines[item.sourceProfileId];
        const baselinePercent = Number(baseline?.categories?.[category]?.[family] || 0);
        return {
          sourceProfileId: item.sourceProfileId,
          biomePath: item.biomePath,
          weightPercent: item.weightPercent,
          baselinePercent,
          weightedPercent: round(baselinePercent * item.weightPercent / 100)
        };
      });
      result[category] = {
        category,
        sourceProfileId: contributions.map(item => item.sourceProfileId),
        baselinePercent: contributions.map(item => ({sourceProfileId:item.sourceProfileId, value:item.baselinePercent})),
        generatedPercent: round(contributions.reduce((sum, item) => sum + item.weightedPercent, 0)),
        adjustmentReason: "Weighted biome blend only; protected source percentages remain immutable.",
        contributions
      };
    }
    return result;
  }

  function allocateCounts(distribution, total) {
    const entries = Object.values(distribution).map(item => {
      const exact = Number(item.generatedPercent || 0) * total / 100;
      return {...item, exact, count:Math.floor(exact), remainder:exact - Math.floor(exact)};
    });
    let remaining = Math.max(0, total - entries.reduce((sum, item) => sum + item.count, 0));
    entries.sort((a, b) => b.remainder - a.remainder);
    for (let index = 0; remaining > 0 && entries.length; index = (index + 1) % entries.length, remaining -= 1) entries[index].count += 1;
    return entries.sort((a, b) => a.category.localeCompare(b.category));
  }

  function baselineLocationCount(family) {
    return ({capital:335, city:244, town:143, village:65})[family] || 143;
  }

  function ensureUniversalState(state) {
    state.schema = "tablegate.project.v9";
    state.schemaVersion = "9.0.0";
    state.settingProfiles = Array.isArray(state.settingProfiles) ? state.settingProfiles : [];
    state.systemProfiles = Array.isArray(state.systemProfiles) ? state.systemProfiles : [];
    state.eraProfiles = Array.isArray(state.eraProfiles) ? state.eraProfiles : [];
    state.settlements = Array.isArray(state.settlements) ? state.settlements : [];
    state.organizations = Array.isArray(state.organizations) ? state.organizations : (Array.isArray(state.factions) ? state.factions : []);
    state.scenarios = Array.isArray(state.scenarios) ? state.scenarios : (Array.isArray(state.quests) ? state.quests : []);
    state.branches = Array.isArray(state.branches) ? state.branches : [{branchId:"main", name:"Main", parentBranchId:null, createdAt:now()}];
    state.adjustmentLog = Array.isArray(state.adjustmentLog) ? state.adjustmentLog : [];
    state.universalV9 = {...(state.universalV9 || {}), migratedAt:state.universalV9?.migratedAt || now(), protectedBaselineVersion:"9.0.0"};
    return state;
  }

  function validateSettlement(options, spec = activeSpec) {
    const errors = [];
    const warnings = [];
    if (!String(options.name || "").trim()) errors.push("Settlement name is required.");
    if (!String(options.scaleLabel || "").trim()) errors.push("Settlement scale label is required.");
    if (!String(options.form || "").trim()) errors.push("Settlement form is required.");
    const hybrid = validateHybrid(options.biomeSelections, spec);
    errors.push(...hybrid.errors);
    const needs = new Set(options.infrastructure || REQUIRED_NEEDS);
    for (const need of REQUIRED_NEEDS) if (!needs.has(need)) warnings.push(`No ${need} infrastructure assumption is recorded.`);
    if (/underwater/i.test(options.form || "") && !needs.has("air")) errors.push("Underwater settlements require a breathing-medium or life-support assumption.");
    if (/spaceship|space station|orbital/i.test(options.form || "") && !needs.has("air")) errors.push("Space habitats require life-support assumptions.");
    if (/mobile/i.test(options.form || "") && !needs.has("emergency")) errors.push("Mobile settlements require emergency and route fallback assumptions.");
    return {valid:errors.length === 0, errors, warnings, hybrid};
  }

  function makeLocationRecord(settlement, category, index) {
    return {
      locationId: uid("location"),
      name: `${settlement.name} · ${category.category} ${index + 1}`,
      type: "Functional location",
      category: category.category,
      parentLocationId: settlement.locationId,
      settlementId: settlement.settlementId,
      biomeSelections: clone(settlement.biomeSelections),
      services: [category.category],
      visibility: "public",
      public: {description:`A generated ${category.category.toLowerCase()} record in ${settlement.name}.`, approved:true},
      private: {notes:""},
      baselinePercent: clone(category.baselinePercent),
      generatedPercent: category.generatedPercent,
      adjustmentReason: category.adjustmentReason,
      sourceProfileId: clone(category.sourceProfileId),
      provenance: {schema:"tablegate.life-simulator.universal-spec.v9", generatedAt:now(), protected:true}
    };
  }

  async function createSettlement(options = {}) {
    const spec = await loadSpec();
    const validation = validateSettlement(options, spec);
    if (!validation.valid) throw new Error(validation.errors.join(" "));
    const family = scaleFamily(options.scaleLabel, options.baselineFamily);
    const distribution = blendProtectedBaselines(validation.hybrid.selections, family, spec);
    const pinColor = spec.pinColors[family];
    const generatedAt = now();
    let created;
    const mutate = state => {
      ensureUniversalState(state);
      const systemId = options.systemId === "none" ? null : (options.systemId || null);
      const settlement = {
        settlementId: uid("settlement"),
        locationId: uid("location"),
        name: String(options.name).trim(),
        scaleLabel: options.scaleLabel,
        baselineFamily: family,
        form: options.form,
        pinColor,
        eraProfile: {eraProfileId:uid("era"), label:options.eraLabel || "Custom", customLabel:options.customEra || "", capabilityFlags:clone(options.capabilityFlags || {})},
        rulesProfile: {systemId, editionId:options.editionId || "", mode:systemId ? "adapter" : "no-system"},
        biomeSelections: validation.hybrid.selections,
        functionalDistribution: distribution,
        infrastructure: Array.from(new Set(options.infrastructure || REQUIRED_NEEDS)),
        pressureLevel: Number(options.pressureLevel || 1),
        visibility: options.visibility || "private",
        public: {description:options.description || "", approved:false},
        private: {notes:options.privateNotes || ""},
        provenance: {schema:spec.schema, version:spec.version, generatedAt, protectedBaselineIds:validation.hybrid.selections.map(item => item.sourceProfileId)},
        validation: {warnings:validation.warnings, checkedAt:generatedAt}
      };
      state.settlements.push(settlement);
      state.locations.push({...clone(settlement), locationId:settlement.locationId, type:options.scaleLabel, category:"settlement", parentLocationId:options.parentLocationId || null});
      if (options.generateLocations !== false) {
        const target = Math.max(1, Math.min(500, Number(options.locationCount) || baselineLocationCount(family)));
        const allocations = allocateCounts(distribution, target);
        for (const allocation of allocations) {
          for (let index = 0; index < allocation.count; index += 1) state.locations.push(makeLocationRecord(settlement, allocation, index));
        }
        settlement.generatedLocationCount = allocations.reduce((sum, item) => sum + item.count, 0);
      }
      state.adjustmentLog.push({adjustmentId:uid("adjustment"), settlementId:settlement.settlementId, kind:"protected-baseline-blend", reason:"One-to-three biome weighted blend", at:generatedAt, sourceProfileIds:settlement.provenance.protectedBaselineIds});
      state.project.systemProfile = systemId ? {systemId, editionId:options.editionId || ""} : {systemId:"system-agnostic", editionId:""};
      created = clone(settlement);
      return state;
    };
    if (LS.store?.update) LS.store.update(mutate);
    else throw new Error("Life Simulator storage is not ready.");
    try { await saveProjectToIndexedDb(LS.store.exportState()); }
    catch (error) { console.warn("IndexedDB save deferred; localStorage project remains available.", error); }
    return created;
  }

  function createOrganization(input = {}) {
    let created;
    LS.store.update(state => {
      ensureUniversalState(state);
      created = {organizationId:uid("organization"), publicName:input.publicName || "New Organization", publicDescription:input.publicDescription || "", privateTruth:input.privateTruth || "", aliases:input.aliases || [], goals:input.goals || [], methods:input.methods || [], ethics:input.ethics || [], resources:input.resources || [], vulnerabilities:input.vulnerabilities || [], memberIds:input.memberIds || [], locationIds:input.locationIds || [], relationships:input.relationships || [], visibility:input.visibility || "private", provenance:{createdAt:now(), schema:"tablegate.organization.v9"}};
      state.organizations.push(created);
      state.factions = state.organizations;
      return state;
    });
    return clone(created);
  }

  function createScenario(input = {}) {
    let created;
    LS.store.update(state => {
      ensureUniversalState(state);
      created = {scenarioId:uid("scenario"), title:input.title || "New Scenario", summary:input.summary || "", status:input.status || "draft", visibility:input.visibility || "private", currentStage:input.currentStage || "opening", organizationIds:input.organizationIds || [], npcIds:input.npcIds || [], publicObjectives:input.publicObjectives || [], hiddenObjectives:input.hiddenObjectives || [], optionalObjectives:input.optionalObjectives || [], failureConditions:input.failureConditions || [], ethicalConstraints:input.ethicalConstraints || [], stages:input.stages || [], triggers:input.triggers || [], rewards:input.rewards || [], consequences:input.consequences || [], provenance:{createdAt:now(), schema:"tablegate.scenario.v9"}};
      state.scenarios.push(created);
      state.quests = state.scenarios;
      return state;
    });
    return clone(created);
  }

  function openDb() {
    return new Promise((resolve, reject) => {
      if (!global.indexedDB) return reject(new Error("IndexedDB is unavailable."));
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, {keyPath:"projectId"});
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("IndexedDB could not open."));
    });
  }

  async function saveProjectToIndexedDb(state) {
    const db = await openDb();
    const payload = {projectId:state.project?.projectId || "local", savedAt:now(), state:clone(state)};
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(payload);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error || new Error("Project save failed."));
    });
    db.close();
    return payload;
  }

  async function loadProjectFromIndexedDb(projectId) {
    const db = await openDb();
    const payload = await new Promise((resolve, reject) => {
      const request = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(projectId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error || new Error("Project load failed."));
    });
    db.close();
    return payload?.state || null;
  }

  function publicExport(state) {
    const cleanState = clone(state);
    cleanState.npcs = (cleanState.npcs || []).map(npc => ({...npc, private:undefined, secrets:undefined}));
    cleanState.locations = (cleanState.locations || []).filter(item => item.visibility !== "secret").map(item => ({...item, private:undefined}));
    cleanState.settlements = (cleanState.settlements || []).filter(item => item.visibility !== "secret").map(item => ({...item, private:undefined}));
    cleanState.organizations = (cleanState.organizations || []).filter(item => item.visibility !== "secret").map(item => ({...item, privateTruth:undefined}));
    cleanState.scenarios = (cleanState.scenarios || []).filter(item => item.visibility !== "secret").map(item => ({...item, hiddenObjectives:undefined}));
    return cleanState;
  }

  function downloadExport(publicOnly = false) {
    const state = LS.store.exportState();
    const payload = publicOnly ? publicExport(state) : state;
    payload.export = {schema:"tablegate.life-simulator.export.v9", publicOnly, exportedAt:now()};
    LS.util.download(`${LS.util.safeFileName(state.project?.name || "tablegate")}.${publicOnly ? "public." : ""}lifesim-v9.json`, JSON.stringify(payload, null, 2));
  }

  function biomeOptions(spec) {
    return spec.biomeMap.map(item => `<option value="${escapeHtml(item.path)}" data-profile="${escapeHtml(item.sourceProfileId)}">${escapeHtml(item.category)} · ${escapeHtml(item.name)} (${escapeHtml(item.sourceProfileId)})</option>`).join("");
  }

  function systemOptions() {
    const entries = LS.systems?.entries || LS.systems?.catalog || [];
    const values = Array.isArray(entries) ? entries : Object.values(entries || {});
    return `<option value="none">No rules system</option>${values.map(item => `<option value="${escapeHtml(item.id || item.systemId || item.key)}">${escapeHtml(item.name || item.displayName || item.label || item.id)}</option>`).join("")}`;
  }

  function rowHtml(index, spec, weight) {
    return `<div class="universal-biome-row"><label>Biome ${index + 1}<select data-universal-biome="${index}"><option value="">Not selected</option>${biomeOptions(spec)}</select></label><label>Weight %<input data-universal-weight="${index}" type="number" min="0" max="100" step="0.1" value="${weight}"></label></div>`;
  }

  function formHtml(spec) {
    return `<section class="view" data-view-panel="universal" id="universalV9Panel">
      <div class="page-heading"><div><p class="kicker">DOCX specification implemented</p><h2>Universal Settlement Builder V9</h2><p>Scale, habitat form, era, and rules are independent. Blend one to three protected biome baselines without mutating B01–B22.</p></div></div>
      <section class="panel"><div class="panel-head"><div><p class="panel-label">Protected creation flow</p><h3>Settlement or Habitat</h3></div><span class="status-chip cyan">V9 · ${escapeHtml(spec.version)}</span></div>
      <div class="form-grid four"><label>Name<input id="universalName" value="New Settlement"></label><label>Scale label<select id="universalScale">${SCALE_LABELS.map(item => `<option>${escapeHtml(item)}</option>`).join("")}</select></label><label>Protected baseline family<select id="universalFamily"><option value="village">Village</option><option value="town" selected>Town</option><option value="city">City</option><option value="capital">Capital City</option></select></label><label>Settlement form<select id="universalForm">${FORMS.map(item => `<option>${escapeHtml(item)}</option>`).join("")}</select></label><label>Era / capability preset<select id="universalEra">${ERA_LABELS.map(item => `<option>${escapeHtml(item)}</option>`).join("")}</select></label><label>Rules adapter<select id="universalSystem">${systemOptions()}</select></label><label>Generated locations<input id="universalLocationCount" type="number" min="1" max="500" value="143"></label><label>Pressure level<select id="universalPressure">${[0,1,2,3,4,5].map(item => `<option value="${item}" ${item===1?"selected":""}>${item}</option>`).join("")}</select></label></div>
      <div class="universal-biome-grid">${rowHtml(0,spec,100)}${rowHtml(1,spec,0)}${rowHtml(2,spec,0)}</div>
      <label>Description<textarea id="universalDescription" rows="3" placeholder="Public description"></textarea></label>
      <div class="check-grid">${REQUIRED_NEEDS.map(item => `<label class="check-row"><input type="checkbox" data-universal-need="${item}" checked> ${escapeHtml(item[0].toUpperCase()+item.slice(1))}</label>`).join("")}<label class="check-row"><input type="checkbox" id="universalGenerateLocations" checked> Generate functional location records</label></div>
      <div class="button-row"><button id="universalValidate" type="button">Validate</button><button id="universalCreate" type="button">Create Settlement</button><button class="ghost" id="universalSaveDb" type="button">Save Project to IndexedDB</button><button class="ghost" id="universalExportFull" type="button">Full JSON</button><button class="ghost" id="universalExportPublic" type="button">Public JSON</button></div><div id="universalStatus" class="generation-summary">Choose a biome. All protected source percentages remain immutable.</div></section>
      <section class="panel"><div class="panel-head"><h3>Protected Baseline Preview</h3><span>${Object.keys(spec.protectedBaselines).length} profiles · ${spec.biomeMap.length} mapped biomes</span></div><div id="universalPreview" class="universal-preview"></div></section>
    </section>`;
  }

  function readForm(spec) {
    const rows = [0,1,2].map(index => {
      const select = document.querySelector(`[data-universal-biome="${index}"]`);
      const path = select?.value || "";
      const mapped = spec.biomeMap.find(item => item.path === path);
      return {biomePath:path, sourceProfileId:mapped?.sourceProfileId || "", weightPercent:Number(document.querySelector(`[data-universal-weight="${index}"]`)?.value || 0)};
    }).filter(item => item.biomePath || item.weightPercent);
    return {
      name:document.getElementById("universalName")?.value,
      scaleLabel:document.getElementById("universalScale")?.value,
      baselineFamily:document.getElementById("universalFamily")?.value,
      form:document.getElementById("universalForm")?.value,
      eraLabel:document.getElementById("universalEra")?.value,
      systemId:document.getElementById("universalSystem")?.value || "none",
      pressureLevel:document.getElementById("universalPressure")?.value,
      locationCount:Number(document.getElementById("universalLocationCount")?.value || 0),
      description:document.getElementById("universalDescription")?.value || "",
      biomeSelections:rows,
      infrastructure:[...document.querySelectorAll("[data-universal-need]:checked")].map(input => input.dataset.universalNeed),
      generateLocations:Boolean(document.getElementById("universalGenerateLocations")?.checked)
    };
  }

  function showStatus(message, type = "") {
    const target = document.getElementById("universalStatus");
    if (!target) return;
    target.textContent = message;
    target.dataset.status = type;
  }

  function updatePreview(spec) {
    try {
      const options = readForm(spec);
      const check = validateSettlement(options, spec);
      if (!check.valid) {
        document.getElementById("universalPreview").innerHTML = `<div class="universal-errors">${check.errors.map(item => `<p>${escapeHtml(item)}</p>`).join("")}</div>`;
        showStatus(check.errors.join(" "), "error");
        return check;
      }
      const family = scaleFamily(options.scaleLabel, options.baselineFamily);
      const distribution = blendProtectedBaselines(check.hybrid.selections, family, spec);
      document.getElementById("universalPreview").innerHTML = `<table><thead><tr><th>Functional category</th><th>Generated %</th><th>Source baselines</th></tr></thead><tbody>${Object.values(distribution).map(item => `<tr><td>${escapeHtml(item.category)}</td><td>${item.generatedPercent}%</td><td>${item.contributions.map(c => `${escapeHtml(c.sourceProfileId)} ${c.baselinePercent}% × ${c.weightPercent}%`).join(" + ")}</td></tr>`).join("")}</tbody></table>`;
      showStatus(`Valid ${options.scaleLabel} · ${family} baseline · pin ${spec.pinColors[family]} · ${check.hybrid.selections.length} biome layer(s).`, "success");
      return check;
    } catch (error) {
      showStatus(error.message, "error");
      return {valid:false, errors:[error.message], warnings:[]};
    }
  }

  async function installUi() {
    const spec = await loadSpec();
    ensureUniversalState(LS.store.get());
    LS.store.save();
    if (!document.querySelector('[data-view="universal"]')) {
      const nav = document.querySelector(".sidebar nav");
      const button = document.createElement("button");
      button.className = "nav-item";
      button.dataset.view = "universal";
      button.innerHTML = "<span>11</span>Universal Builder";
      nav?.append(button);
    }
    if (!document.getElementById("universalV9Panel")) document.querySelector(".main-stage")?.insertAdjacentHTML("beforeend", formHtml(spec));
    const first = document.querySelector('[data-universal-biome="0"]');
    if (first && !first.value && first.options.length > 1) first.selectedIndex = 1;
    document.getElementById("universalValidate")?.addEventListener("click", () => updatePreview(spec));
    document.getElementById("universalCreate")?.addEventListener("click", async () => {
      try {
        const result = await createSettlement(readForm(spec));
        showStatus(`${result.name} created with ${result.generatedLocationCount || 0} functional locations. Protected pin color: ${result.pinColor}.`, "success");
        updatePreview(spec);
      } catch (error) { showStatus(error.message, "error"); }
    });
    document.getElementById("universalSaveDb")?.addEventListener("click", async () => {
      try { await saveProjectToIndexedDb(LS.store.exportState()); showStatus("Full project saved to IndexedDB.", "success"); }
      catch (error) { showStatus(error.message, "error"); }
    });
    document.getElementById("universalExportFull")?.addEventListener("click", () => downloadExport(false));
    document.getElementById("universalExportPublic")?.addEventListener("click", () => downloadExport(true));
    document.getElementById("universalScale")?.addEventListener("change", event => {
      const family = scaleFamily(event.target.value);
      document.getElementById("universalFamily").value = family;
      document.getElementById("universalLocationCount").value = baselineLocationCount(family);
      updatePreview(spec);
    });
    document.getElementById("universalV9Panel")?.addEventListener("input", () => updatePreview(spec));
    updatePreview(spec);
  }

  global.LifeSimulatorUniversalV9 = Object.freeze({
    loadSpec, validateHybrid, validateSettlement, blendProtectedBaselines, allocateCounts, scaleFamily,
    ensureUniversalState, createSettlement, createOrganization, createScenario,
    saveProjectToIndexedDb, loadProjectFromIndexedDb, publicExport, installUi,
    constants:Object.freeze({SCALE_LABELS, FORMS, ERA_LABELS, REQUIRED_NEEDS})
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => installUi().catch(error => console.error("Life Simulator V9 could not start.", error)), {once:true});
  else installUi().catch(error => console.error("Life Simulator V9 could not start.", error));
})(window);
