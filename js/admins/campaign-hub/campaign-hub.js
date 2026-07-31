(() => {
  "use strict";

  const STORAGE_PREFIX = "tablegate.settingAgnosticHub.v1.";
  const SYSTEM_DATA = window.TTRPG_SYSTEM_DATA || {};
  const SYSTEM_DATA_ERRORS = {};
  async function loadSystemData(systemId) {
    if (SYSTEM_DATA[systemId]) return SYSTEM_DATA[systemId];
    const profile = SYSTEM_PROFILES[systemId] || SYSTEM_PROFILES["dnd-5e-5.5e"];
    const response = await fetch(profile.file, {cache: "force-cache"});
    if (!response.ok) throw new Error(`Unable to load ${profile.shortName} reference (${response.status}).`);
    const data = await response.json();
    SYSTEM_DATA[systemId] = data;
    delete SYSTEM_DATA_ERRORS[systemId];
    return data;
  }

  const SYSTEM_PROFILES = {
    "dnd-5e-5.5e": {
      name: "Dungeons & Dragons 5e / 2024 Rules",
      shortName: "D&D 5e / 5.5e",
      file: "json/tablegate/systems/references/dnd-5e-5-5e-complete-character-reference-v3-all-official-races.json",
      facilitator: "Dungeon Master",
      playerEntity: "Character",
      coreResolution: "d20 test plus modifiers against a target number",
      structure: "Class-and-level adventure roleplaying",
      scopeNote: "Includes both 2014-era 5e and 2024 revised rules references. Choose which ruleset is active for the campaign and record compatibility decisions in the clarification box."
    },
    "pathfinder-2e-remastered": {
      name: "Pathfinder Second Edition Remastered",
      shortName: "Pathfinder 2e Remastered",
      file: "json/tablegate/systems/references/how-to-play-pathfinder-2e-remastered-complete-reference-v2.json",
      facilitator: "Game Master",
      playerEntity: "Character",
      coreResolution: "d20 check plus modifiers with four degrees of success",
      structure: "Class-and-level tactical adventure roleplaying",
      scopeNote: "Uses the remastered Pathfinder Second Edition rules framework. Campaign setting information remains separate from the system reference."
    },
    "gurps-4e": {
      name: "GURPS Fourth Edition Revised",
      shortName: "GURPS 4e Revised",
      file: "json/tablegate/systems/references/gurps-4e-revised-complete-character-reference-v2.json",
      facilitator: "Game Master",
      playerEntity: "Character",
      coreResolution: "3d6 roll-under against an effective skill or attribute",
      structure: "Point-built universal roleplaying toolkit",
      scopeNote: "GURPS is designed for broad genre and setting coverage. Select campaign assumptions, technology level, traits, and optional subsystems explicitly."
    },
    "call-of-cthulhu-7e": {
      name: "Call of Cthulhu Seventh Edition",
      shortName: "Call of Cthulhu 7e",
      file: "json/tablegate/systems/references/how-to-play-coc-7e-complete-reference-v2.json",
      facilitator: "Keeper",
      playerEntity: "Investigator",
      coreResolution: "percentile roll-under with regular, hard, and extreme success levels",
      structure: "Investigation-focused percentile roleplaying",
      scopeNote: "The rules reference includes horror-investigation procedures. The campaign site itself does not assume a historical period, location, mythos, or tone."
    },
    "savage-worlds-adventure-edition": {
      name: "Savage Worlds Adventure Edition",
      shortName: "Savage Worlds SWADE",
      file: "json/tablegate/systems/references/savage-worlds-swade-complete-reference-v2.json",
      facilitator: "Game Master",
      playerEntity: "Character or Wild Card",
      coreResolution: "trait die and Wild Die against a target number, with raises",
      structure: "Fast universal action-adventure roleplaying",
      scopeNote: "SWADE supports many genres. Setting rules, arcane backgrounds, gear lists, and campaign frameworks should be selected per project."
    },
    "fate-core": {
      name: "Fate Core",
      shortName: "Fate Core",
      file: "json/tablegate/systems/references/fate-core-complete-how-to-play-reference-v2.json",
      facilitator: "Game Master",
      playerEntity: "Character",
      coreResolution: "four Fate dice plus a skill, compared to opposition",
      structure: "Aspect-driven narrative roleplaying",
      scopeNote: "Fate Core is setting-flexible. Define the skill list, extras, scale, stress, consequences, and campaign-specific aspect conventions as needed."
    },
    "daggerheart": {
      name: "Daggerheart",
      shortName: "Daggerheart",
      file: "json/tablegate/systems/references/how-to-play-daggerheart-complete-reference-v2.json",
      facilitator: "Game Master",
      playerEntity: "Hero",
      coreResolution: "two d12 Duality Dice plus modifiers, resolving with Hope or Fear",
      structure: "Heroic fantasy-focused narrative adventure roleplaying",
      scopeNote: "Daggerheart has built-in genre assumptions, but this campaign shell keeps those rules separate from the site’s setting sections and map hierarchy."
    },
    "blades-in-the-dark": {
      name: "Blades in the Dark",
      shortName: "Blades in the Dark",
      file: "json/tablegate/systems/references/how-to-play-blades-in-the-dark-complete-reference-v2.json",
      facilitator: "Game Master",
      playerEntity: "Scoundrel",
      coreResolution: "d6 action-rating dice pool with position and effect",
      structure: "Crew-focused score, consequence, and downtime play",
      scopeNote: "The attached reference contains core rules and setting material. Switching to this system does not automatically overwrite the campaign’s separate setting content."
    },
    "powered-by-the-apocalypse": {
      name: "Powered by the Apocalypse",
      shortName: "Powered by the Apocalypse",
      file: "json/tablegate/systems/references/how-to-play-powered-by-the-apocalypse-complete-reference-v2.json",
      facilitator: "Master of Ceremonies or game-specific facilitator",
      playerEntity: "Character using a playbook",
      coreResolution: "usually 2d6 plus a stat, interpreted through move-specific outcomes",
      structure: "A family of fiction-first, move-driven games",
      scopeNote: "Powered by the Apocalypse is not one universal ruleset. Use the attached reference as a framework, then follow the exact moves, playbooks, principles, and procedures of the chosen PbtA game."
    }
  };

  const THEMES = {
    "neutral-night": {
      "--page-bg": "#02070a", "--page-bg-2": "#0a1117", "--surface": "#e9f6f5", "--surface-2": "#c9dcda", "--surface-dark": "#08151b", "--surface-dark-2": "#10262d", "--text": "#10252b", "--text-light": "#f7ffff", "--accent": "#34d9d2", "--accent-2": "#d98b35", "--accent-3": "#ffe08a", "--border": "#46e8e0"
    },
    "archive": {
      "--page-bg": "#0b0906", "--page-bg-2": "#1b1710", "--surface": "#f5ecd8", "--surface-2": "#d8c8a8", "--surface-dark": "#1e1a12", "--surface-dark-2": "#352d1e", "--text": "#292014", "--text-light": "#fff8e9", "--accent": "#d8b96e", "--accent-2": "#8c5b2f", "--accent-3": "#fff0ac", "--border": "#e6cb82"
    },
    "cool-interface": {
      "--page-bg": "#020812", "--page-bg-2": "#071a2a", "--surface": "#e9f7ff", "--surface-2": "#bcd7e8", "--surface-dark": "#061522", "--surface-dark-2": "#0c2a3c", "--text": "#0a2634", "--text-light": "#f3fbff", "--accent": "#4ac7ff", "--accent-2": "#47a2a8", "--accent-3": "#d9f5ff", "--border": "#72d7ff"
    },
    "warm-interface": {
      "--page-bg": "#100704", "--page-bg-2": "#26110a", "--surface": "#fff0df", "--surface-2": "#e2b995", "--surface-dark": "#221009", "--surface-dark-2": "#4a2314", "--text": "#35170b", "--text-light": "#fff7ef", "--accent": "#ef9d52", "--accent-2": "#b94e2e", "--accent-3": "#ffe0a0", "--border": "#ffb86f"
    },
    "high-contrast": {
      "--page-bg": "#000000", "--page-bg-2": "#080808", "--surface": "#ffffff", "--surface-2": "#d7d7d7", "--surface-dark": "#000000", "--surface-dark-2": "#171717", "--text": "#000000", "--text-light": "#ffffff", "--accent": "#00ffff", "--accent-2": "#ff9d00", "--accent-3": "#ffff00", "--border": "#ffffff"
    }
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const escapeHtml = value => String(value ?? "").replace(/[&<>'"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[char]);
  const normalizeText = value => String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
  const humanize = value => String(value ?? "").replace(/[_-]+/g, " ").replace(/\b\w/g, char => char.toUpperCase());
  const safeJson = value => {
    try { return JSON.stringify(value, null, 2); }
    catch { return String(value); }
  };

  const memoryStorage = new Map();
  const storage = {
    get(key) {
      try { return window.localStorage.getItem(key); }
      catch { return memoryStorage.has(key) ? memoryStorage.get(key) : null; }
    },
    set(key, value) {
      memoryStorage.set(key, String(value));
      try { window.localStorage.setItem(key, String(value)); } catch {}
    },
    remove(key) {
      memoryStorage.delete(key);
      try { window.localStorage.removeItem(key); } catch {}
    },
    keys() {
      try { return Object.keys(window.localStorage); }
      catch { return Array.from(memoryStorage.keys()); }
    }
  };

  function setStatus(message, detail = "") {
    const status = $("#mapStatus");
    if (!status) return;
    status.innerHTML = `<span>${escapeHtml(message)}</span><span>${detail || `Scale: <code id="mapScaleReadout">${Math.round(mapView.scale * 100)}%</code>`}</span>`;
  }

  /* ---------------------------------------------------------
     Generic page controls, editing, and theme persistence
  --------------------------------------------------------- */
  function applyTheme(themeKey) {
    const theme = THEMES[themeKey] || THEMES["neutral-night"];
    Object.entries(theme).forEach(([key, value]) => document.documentElement.style.setProperty(key, value));
    storage.set(STORAGE_PREFIX + "theme", themeKey);
  }

  function initTheme() {
    const select = $("#themeSelect");
    const saved = storage.get(STORAGE_PREFIX + "theme");
    if (saved && THEMES[saved]) select.value = saved;
    applyTheme(select.value);
    select.addEventListener("change", () => applyTheme(select.value));
  }

  function initModuleToggles() {
    $$(".module-toggle").forEach(button => {
      button.addEventListener("click", () => {
        const module = button.closest(".module");
        const collapsed = module.classList.toggle("collapsed");
        button.textContent = collapsed ? "+" : "−";
        button.setAttribute("aria-expanded", String(!collapsed));
      });
    });
  }

  function initFloatingNavigation() {
    const floatingNav = $("#floatingNav");
    const toggle = $("#floatingNavToggle");
    const select = $("#floatingNavSelect");
    const go = $("#floatingNavGo");
    let dragging = false;
    let moved = false;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;

    const jump = () => {
      const target = $(select.value);
      if (target) target.scrollIntoView({behavior: "smooth", block: "start"});
    };
    go.addEventListener("click", jump);
    select.addEventListener("change", jump);

    toggle.addEventListener("pointerdown", event => {
      dragging = true;
      moved = false;
      startX = event.clientX;
      startY = event.clientY;
      const rect = floatingNav.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;
      toggle.setPointerCapture(event.pointerId);
    });
    toggle.addEventListener("pointermove", event => {
      if (!dragging) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (Math.abs(dx) + Math.abs(dy) > 5) moved = true;
      floatingNav.style.left = `${Math.max(4, Math.min(window.innerWidth - 80, startLeft + dx))}px`;
      floatingNav.style.top = `${Math.max(4, Math.min(window.innerHeight - 80, startTop + dy))}px`;
    });
    toggle.addEventListener("pointerup", event => {
      dragging = false;
      try { toggle.releasePointerCapture(event.pointerId); } catch {}
      if (!moved) {
        const collapsed = floatingNav.classList.toggle("collapsed");
        toggle.setAttribute("aria-expanded", String(!collapsed));
      }
    });
  }

  function initEditablePersistence() {
    $$('[data-edit-key][contenteditable="true"]').forEach(element => {
      const key = STORAGE_PREFIX + "edit." + element.dataset.editKey;
      const saved = storage.get(key);
      if (saved !== null) element.innerHTML = saved;
      element.addEventListener("input", () => storage.set(key, element.innerHTML));
    });
  }

  function exportCampaignData() {
    const edits = {};
    $$('[data-edit-key][contenteditable="true"]').forEach(element => { edits[element.dataset.editKey] = element.innerHTML; });
    const payload = {
      schema: "tablegate.setting-agnostic-campaign-page.v1",
      exportedAt: new Date().toISOString(),
      selectedSystem: $("#systemSelect").value,
      selectedTheme: $("#themeSelect").value,
      edits
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {type: "application/json"});
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "tablegate_campaign_page_data.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  async function importCampaignData(file) {
    const data = JSON.parse(await file.text());
    if (!data || data.schema !== "tablegate.setting-agnostic-campaign-page.v1") throw new Error("This is not a compatible TableGate campaign-page export.");
    if (data.selectedTheme && THEMES[data.selectedTheme]) {
      $("#themeSelect").value = data.selectedTheme;
      applyTheme(data.selectedTheme);
    }
    if (data.selectedSystem && SYSTEM_PROFILES[data.selectedSystem]) {
      $("#systemSelect").value = data.selectedSystem;
      applySystem(data.selectedSystem);
    }
    Object.entries(data.edits || {}).forEach(([editKey, html]) => {
      const element = document.querySelector(`[data-edit-key="${CSS.escape(editKey)}"]`);
      if (!element) return;
      element.innerHTML = html;
      storage.set(STORAGE_PREFIX + "edit." + editKey, html);
    });
  }

  function initImportExport() {
    $("#exportCampaignButton").addEventListener("click", exportCampaignData);
    $("#importCampaignButton").addEventListener("click", () => $("#campaignImportInput").click());
    $("#campaignImportInput").addEventListener("change", async event => {
      const file = event.target.files?.[0];
      if (!file) return;
      try { await importCampaignData(file); alert("Campaign page data imported."); }
      catch (error) { alert(error.message || "The campaign page data could not be imported."); }
      event.target.value = "";
    });
    $("#resetCampaignButton").addEventListener("click", () => {
      if (!confirm("Reset all editable campaign-page text stored by this browser?")) return;
      storage.keys().filter(key => key.startsWith(STORAGE_PREFIX + "edit.")).forEach(key => storage.remove(key));
      location.reload();
    });
  }

  /* ---------------------------------------------------------
     System switching and full attached-reference browser
  --------------------------------------------------------- */
  let activeSystemId = "dnd-5e-5.5e";
  let activeSystemData = {};

  function firstString(...values) {
    for (const value of values) {
      if (typeof value === "string" && value.trim()) return value.trim();
    }
    return "";
  }

  function editionSummary(data) {
    const meta = data?.metadata || {};
    const identity = data?.edition_identity || data?.rules_reference?.edition_identity || {};
    if (typeof identity === "string") return identity;
    return firstString(
      identity.current_core_release,
      identity.current_edition,
      identity.active_ruleset,
      meta.active_ruleset,
      Array.isArray(meta.active_rulesets) ? meta.active_rulesets.join(" / ") : "",
      meta.edition_status
    ) || "See the attached reference metadata";
  }

  function settingScopeSummary(data) {
    return firstString(
      data?.metadata?.setting_scope,
      data?.setting_reference?.setting_scope,
      data?.legal_and_scope?.scope,
      data?.metadata?.scope
    ) || "System reference kept separate from campaign setting content";
  }

  function renderFactRows(container, rows) {
    container.replaceChildren();
    rows.forEach(([label, value]) => {
      const row = document.createElement("div");
      row.className = "system-fact";
      row.innerHTML = `<b>${escapeHtml(label)}</b><span>${escapeHtml(value || "Not specified")}</span>`;
      container.appendChild(row);
    });
  }

  function summarizeSection(value) {
    if (Array.isArray(value)) return `${value.length} item${value.length === 1 ? "" : "s"}`;
    if (value && typeof value === "object") return `${Object.keys(value).length} subsection${Object.keys(value).length === 1 ? "" : "s"}`;
    if (typeof value === "string") return value.length > 260 ? value.slice(0, 257) + "…" : value;
    return String(value ?? "Empty");
  }

  function renderSystemSectionSummary() {
    const select = $("#systemSectionSelect");
    const container = $("#systemSectionSummary");
    const section = activeSystemData?.[select.value];
    container.replaceChildren();
    $("#systemSearchResults").classList.add("hidden");
    if (section === undefined) return;

    if (section && typeof section === "object" && !Array.isArray(section)) {
      Object.entries(section).slice(0, 80).forEach(([key, value]) => {
        const row = document.createElement("div");
        row.className = "summary-row";
        row.innerHTML = `<strong>${escapeHtml(humanize(key))}</strong><code>${escapeHtml(summarizeSection(value))}</code>`;
        container.appendChild(row);
      });
    } else if (Array.isArray(section)) {
      section.slice(0, 80).forEach((value, index) => {
        const row = document.createElement("div");
        row.className = "summary-row";
        row.innerHTML = `<strong>Item ${index + 1}</strong><code>${escapeHtml(summarizeSection(value))}</code>`;
        container.appendChild(row);
      });
    } else {
      container.innerHTML = `<div class="summary-row"><strong>Value</strong><code>${escapeHtml(String(section))}</code></div>`;
    }
  }

  function searchSystemData(query, maximum = 75) {
    const tokens = normalizeText(query).split(" ").filter(Boolean);
    if (!tokens.length) return [];
    const results = [];
    const seen = new WeakSet();
    const walk = (value, path) => {
      if (results.length >= maximum) return;
      if (value && typeof value === "object") {
        if (seen.has(value)) return;
        seen.add(value);
        if (Array.isArray(value)) {
          for (let index = 0; index < value.length && results.length < maximum; index++) walk(value[index], `${path}[${index}]`);
        } else {
          for (const [key, child] of Object.entries(value)) {
            const nextPath = path ? `${path}.${key}` : key;
            const keyHaystack = normalizeText(nextPath);
            if (tokens.every(token => keyHaystack.includes(token)) && (typeof child !== "object" || child === null)) {
              results.push({path: nextPath, value: child});
            }
            walk(child, nextPath);
            if (results.length >= maximum) break;
          }
        }
        return;
      }
      const haystack = normalizeText(`${path} ${String(value ?? "")}`);
      if (tokens.every(token => haystack.includes(token))) results.push({path, value});
    };
    walk(activeSystemData, "");
    return results;
  }

  function renderSystemSearch() {
    const query = $("#systemSearchInput").value.trim();
    const resultsContainer = $("#systemSearchResults");
    const summaryContainer = $("#systemSectionSummary");
    if (!query) {
      resultsContainer.classList.add("hidden");
      summaryContainer.classList.remove("hidden");
      renderSystemSectionSummary();
      return;
    }
    const matches = searchSystemData(query);
    resultsContainer.replaceChildren();
    summaryContainer.classList.add("hidden");
    resultsContainer.classList.remove("hidden");
    if (!matches.length) {
      resultsContainer.innerHTML = `<div class="system-search-result"><strong>No matches</strong><p>No attached reference entry matched all search terms.</p></div>`;
      return;
    }
    matches.forEach(match => {
      const card = document.createElement("div");
      card.className = "system-search-result";
      const rendered = typeof match.value === "string" ? match.value : safeJson(match.value);
      card.innerHTML = `<strong>${escapeHtml(match.path)}</strong><small>${escapeHtml(SYSTEM_PROFILES[activeSystemId].shortName)}</small><pre>${escapeHtml(rendered.length > 1800 ? rendered.slice(0, 1797) + "…" : rendered)}</pre>`;
      resultsContainer.appendChild(card);
    });
  }

  async function applySystem(systemId) {
    const profile = SYSTEM_PROFILES[systemId] || SYSTEM_PROFILES["dnd-5e-5.5e"];
    let data = {};
    try { data = await loadSystemData(systemId); }
    catch (error) { SYSTEM_DATA_ERRORS[systemId] = String(error?.message || error); console.error(error); }
    activeSystemId = systemId;
    activeSystemData = data;
    document.body.dataset.system = systemId;
    storage.set(STORAGE_PREFIX + "system", systemId);

    $("#systemNameHeading").textContent = profile.name;
    $("#systemRawJsonLink").href = profile.file;
    $("#systemScopeNotice").innerHTML = `<strong>System and setting remain separate:</strong> ${escapeHtml(profile.scopeNote)}`;

    renderFactRows($("#systemFacts"), [
      ["System", profile.name],
      ["Edition / Ruleset", editionSummary(data)],
      ["Reference Title", firstString(data?.metadata?.title, data?.title) || profile.name],
      ["Setting Scope", settingScopeSummary(data)],
      ["Top-Level Data", `${Object.keys(data).length} reference sections`]
    ]);
    renderFactRows($("#systemLanguageFacts"), [
      ["Facilitator", profile.facilitator],
      ["Player Entity", profile.playerEntity],
      ["Core Resolution", profile.coreResolution],
      ["Play Structure", profile.structure]
    ]);

    const sectionSelect = $("#systemSectionSelect");
    sectionSelect.replaceChildren();
    Object.keys(data).forEach(key => {
      const option = document.createElement("option");
      option.value = key;
      option.textContent = humanize(key);
      sectionSelect.appendChild(option);
    });
    $("#systemSearchInput").value = "";
    $("#systemSectionSummary").classList.remove("hidden");
    renderSystemSectionSummary();
  }

  function initSystemSwitcher() {
    const select = $("#systemSelect");
    Object.entries(SYSTEM_PROFILES).forEach(([id, profile]) => {
      const option = document.createElement("option");
      option.value = id;
      option.textContent = profile.shortName;
      select.appendChild(option);
    });
    const saved = storage.get(STORAGE_PREFIX + "system");
    if (saved && SYSTEM_PROFILES[saved]) select.value = saved;
    applySystem(select.value || "dnd-5e-5.5e");
    select.addEventListener("change", () => applySystem(select.value));
    $("#systemSectionSelect").addEventListener("change", renderSystemSectionSummary);
    $("#systemSearchButton").addEventListener("click", renderSystemSearch);
    $("#systemSearchInput").addEventListener("keydown", event => {
      if (event.key === "Enter") { event.preventDefault(); renderSystemSearch(); }
      if (event.key === "Escape") { event.currentTarget.value = ""; renderSystemSectionSummary(); }
    });
  }

  /* ---------------------------------------------------------
     Hierarchical Map Viewer
  --------------------------------------------------------- */
  const DISPLAYABLE_EXTENSIONS = new Set(["svg", "png", "jpg", "jpeg", "webp", "gif", "html", "htm", "pdf", "geojson"]);
  const MANIFEST_NAMES = new Set(["map-manifest.json", "map_manifest.json", "tablegate-map-manifest.json", "tablegate_map_manifest.json"]);
  const PREFERRED_MAP_STEMS = ["map", "index", "overview", "world", "globe", "continent", "country", "nation", "kingdom", "region", "province", "state", "settlement", "city", "town", "village", "district", "building", "floor", "room", "interior"];

  let mapRoots = [];
  let mapNodes = new Map();
  let mapLookup = new Map();
  let selectedMapPath = [];
  let loadedFiles = new Map();
  let basenameFiles = new Map();
  let currentObjectUrl = "";
  let nodeCounter = 0;
  const mapView = {scale: 1, x: 0, y: 0};

  const mapStage = $("#mapStage");
  const mapWindow = $("#mapWindow");
  const mapEmptyState = $("#mapEmptyState");

  function normalizePath(path) {
    return String(path || "").replace(/\\/g, "/").replace(/^\.\//, "").replace(/\/{2,}/g, "/").replace(/^\//, "").replace(/\/$/, "");
  }

  function fileExtension(name) {
    const match = String(name || "").toLowerCase().match(/\.([a-z0-9]+)$/);
    return match ? match[1] : "";
  }

  function fileStem(name) {
    return String(name || "").replace(/\.[^.]+$/, "");
  }

  function cleanLabel(value) {
    return humanize(fileStem(String(value || "").replace(/^\d+[._ -]*/, ""))).replace(/\bMap\b$/i, "").trim() || "Map";
  }

  function slug(value) {
    return normalizeText(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "map";
  }

  function inferType(label) {
    const text = normalizeText(label);
    const typeRules = [
      ["universe", "universe"], ["multiverse", "multiverse"], ["galaxy", "galaxy"], ["system", "star system"], ["world", "world"], ["globe", "world"], ["planet", "planet"],
      ["continent", "continent"], ["country", "country"], ["nation", "country"], ["kingdom", "kingdom"], ["empire", "country"], ["province", "province"], ["state", "state"], ["region", "region"], ["territory", "region"],
      ["settlement", "settlement"], ["city", "city"], ["town", "town"], ["village", "village"], ["station", "station"], ["colony", "settlement"], ["district", "district"], ["neighborhood", "district"],
      ["building", "building"], ["structure", "building"], ["tavern", "building"], ["inn", "building"], ["ship", "vehicle"], ["vehicle", "vehicle"], ["floor", "floor"], ["level", "level"], ["room", "room"], ["interior", "interior"]
    ];
    const match = typeRules.find(([needle]) => text.includes(needle));
    return match ? match[1] : "map level";
  }

  function uniqueNodeId(seed) {
    const base = slug(seed);
    let id = base;
    while (mapNodes.has(id)) id = `${base}-${++nodeCounter}`;
    return id;
  }

  function registerNode(node, parent = null) {
    node.id = node.id && !mapNodes.has(node.id) ? node.id : uniqueNodeId(node.id || node.label || "map");
    node.parentId = parent?.id || null;
    node.children = Array.isArray(node.children) ? node.children : [];
    node.type = node.type || inferType(node.label);
    node.pathLabel = parent ? `${parent.pathLabel} / ${node.label}` : node.label;
    mapNodes.set(node.id, node);
    [node.id, node.label, node.pathLabel, node.fileRef, node.filePath].filter(Boolean).forEach(key => mapLookup.set(normalizeText(key), node.id));
    node.children.forEach(child => registerNode(child, node));
    return node;
  }

  function rebuildNodeIndexes() {
    mapNodes = new Map();
    mapLookup = new Map();
    nodeCounter = 0;
    mapRoots.forEach(root => registerNode(root, null));
  }

  function registerFiles(fileList) {
    Array.from(fileList || []).forEach(file => {
      const path = normalizePath(file.webkitRelativePath || file.relativePath || file.name);
      loadedFiles.set(normalizeText(path), file);
      const basename = normalizeText(file.name);
      const entries = basenameFiles.get(basename) || [];
      if (!entries.includes(file)) entries.push(file);
      basenameFiles.set(basename, entries);
    });
  }

  function resolveLoadedFile(fileRef) {
    if (!fileRef) return null;
    const normalized = normalizeText(normalizePath(fileRef));
    if (loadedFiles.has(normalized)) return loadedFiles.get(normalized);
    for (const [path, file] of loadedFiles.entries()) {
      if (path.endsWith("/" + normalized) || normalized.endsWith("/" + path)) return file;
    }
    const basename = normalizeText(normalizePath(fileRef).split("/").pop());
    const candidates = basenameFiles.get(basename) || [];
    return candidates.length === 1 ? candidates[0] : null;
  }

  function bindLoadedFilesToNodes() {
    mapNodes.forEach(node => {
      if (!node.file && node.fileRef) node.file = resolveLoadedFile(node.fileRef);
      if (node.file && !node.filePath) node.filePath = normalizePath(node.file.webkitRelativePath || node.file.name);
    });
    rebuildNodeIndexes();
  }

  function manifestNodeToNode(raw, parentPath = "") {
    const label = raw.name || raw.label || raw.title || raw.id || "Map Level";
    const fileRef = normalizePath(raw.file || raw.map || raw.src || raw.path || "");
    return {
      id: raw.id || uniqueNodeId(`${parentPath}-${label}`),
      label,
      type: raw.type || raw.scale || inferType(label),
      description: raw.description || raw.notes || "",
      tags: Array.isArray(raw.tags) ? raw.tags : [],
      fileRef,
      file: resolveLoadedFile(fileRef),
      children: (raw.children || raw.levels || raw.maps || []).map(child => manifestNodeToNode(child, `${parentPath}/${label}`))
    };
  }

  async function loadManifestFile(file) {
    const manifest = JSON.parse(await file.text());
    const rootsRaw = manifest.roots || manifest.worlds || manifest.maps || manifest.children || (manifest.root ? [manifest.root] : []);
    if (!Array.isArray(rootsRaw) || !rootsRaw.length) throw new Error("The manifest does not contain roots, maps, worlds, children, or a root node.");
    mapRoots = rootsRaw.map(raw => manifestNodeToNode(raw));
    rebuildNodeIndexes();
    bindLoadedFilesToNodes();
    const firstRoot = mapRoots[0];
    selectMapNode(firstRoot.id);
    setStatus(`Loaded map hierarchy manifest: ${file.name}.`, `Nodes: <code>${mapNodes.size}</code>`);
  }

  function inferHierarchyFromFiles(fileList) {
    const files = Array.from(fileList || []).filter(file => DISPLAYABLE_EXTENSIONS.has(fileExtension(file.name)));
    if (!files.length) throw new Error("No supported map files were found. Supported formats are SVG, PNG, JPG, WEBP, GIF, HTML, PDF, and GeoJSON.");

    const rawEntries = files.map(file => ({file, fullPath: normalizePath(file.webkitRelativePath || file.name)}));
    const firstSegments = [...new Set(rawEntries.map(entry => entry.fullPath.split("/")[0]))];
    const commonTop = firstSegments.length === 1 ? firstSegments[0] : "";
    const commonTopHasDirectMap = commonTop && rawEntries.some(entry => {
      const parts = entry.fullPath.split("/");
      return parts.length === 2 && DISPLAYABLE_EXTENSIONS.has(fileExtension(entry.file.name));
    });
    const entriesForHierarchy = rawEntries.map(entry => {
      if (!commonTop || commonTopHasDirectMap) return entry;
      const parts = entry.fullPath.split("/");
      return {...entry, fullPath: parts.slice(1).join("/") || entry.file.name};
    });

    const directoryFiles = new Map();
    entriesForHierarchy.forEach(({file, fullPath}) => {
      const parts = fullPath.split("/");
      const directory = parts.length > 1 ? parts.slice(0, -1).join("/") : "";
      const group = directoryFiles.get(directory) || [];
      group.push({file, fullPath});
      directoryFiles.set(directory, group);
    });

    const folderNodes = new Map();
    const ensureFolder = directory => {
      const normalized = normalizePath(directory);
      if (folderNodes.has(normalized)) return folderNodes.get(normalized);
      if (!normalized) return null;
      const parts = normalized.split("/");
      const parentPath = parts.slice(0, -1).join("/");
      const parent = ensureFolder(parentPath);
      const node = {id: `folder-${slug(normalized)}`, label: cleanLabel(parts.at(-1)), type: inferType(parts.at(-1)), children: [], file: null, filePath: "", tags: []};
      folderNodes.set(normalized, node);
      if (parent) parent.children.push(node);
      return node;
    };
    Array.from(directoryFiles.keys()).filter(Boolean).sort((a, b) => a.split("/").length - b.split("/").length).forEach(ensureFolder);

    const rootFiles = [];
    directoryFiles.forEach((entries, directory) => {
      const parent = directory ? ensureFolder(directory) : null;
      const preferred = entries.find(entry => PREFERRED_MAP_STEMS.includes(normalizeText(fileStem(entry.file.name))));
      const assigned = preferred || (entries.length === 1 ? entries[0] : null);
      if (assigned && parent) {
        parent.file = assigned.file;
        parent.filePath = assigned.fullPath;
      }
      entries.forEach(entry => {
        if (assigned === entry && parent) return;
        const node = {id: `file-${slug(entry.fullPath)}`, label: cleanLabel(entry.file.name), type: inferType(entry.file.name), children: [], file: entry.file, filePath: entry.fullPath, tags: []};
        if (parent) parent.children.push(node); else rootFiles.push(node);
      });
    });

    const wrapperLabels = new Set([
      "maps", "worlds", "continents", "countries", "nations", "kingdoms", "empires", "regions", "territories",
      "provinces", "states", "settlements", "cities", "towns", "villages", "districts", "neighborhoods",
      "buildings", "structures", "floors", "levels", "rooms", "interiors", "vehicles", "ships", "locations"
    ]);
    const flattenCategoryWrappers = node => {
      node.children = (node.children || []).flatMap(child => {
        flattenCategoryWrappers(child);
        return !child.file && wrapperLabels.has(normalizeText(child.label)) ? child.children : [child];
      });
      return node;
    };

    const topFolders = Array.from(folderNodes.entries()).filter(([path]) => !path.includes("/")).map(([, node]) => flattenCategoryWrappers(node));
    mapRoots = [...topFolders, ...rootFiles];
    if (!mapRoots.length) throw new Error("The map hierarchy could not be inferred from the selected files.");
    rebuildNodeIndexes();
    selectMapNode(mapRoots[0].id);
    setStatus(`Built a map hierarchy from ${files.length} map file${files.length === 1 ? "" : "s"}.`, `Nodes: <code>${mapNodes.size}</code>`);
  }

  function pathToNode(nodeId) {
    const path = [];
    let node = mapNodes.get(nodeId);
    while (node) {
      path.unshift(node.id);
      node = node.parentId ? mapNodes.get(node.parentId) : null;
    }
    return path;
  }

  function currentMapNode() {
    return mapNodes.get(selectedMapPath.at(-1)) || null;
  }

  function nextLevelLabel(children) {
    const types = [...new Set(children.map(child => child.type).filter(Boolean))];
    return types.length === 1 ? humanize(types[0]) : "Next Map Level";
  }

  function renderMapHierarchyControls() {
    const container = $("#mapHierarchyControls");
    container.replaceChildren();
    if (!mapRoots.length) return;

    const createSelect = (label, options, selectedId, onChange, placeholder = "") => {
      const wrapper = document.createElement("div");
      wrapper.className = "map-level-control";
      const labelElement = document.createElement("label");
      labelElement.textContent = label;
      const select = document.createElement("select");
      if (placeholder) {
        const option = document.createElement("option");
        option.value = "";
        option.textContent = placeholder;
        select.appendChild(option);
      }
      options.forEach(node => {
        const option = document.createElement("option");
        option.value = node.id;
        option.textContent = `${node.label}${node.file || node.fileRef ? "" : " (no map assigned)"}`;
        select.appendChild(option);
      });
      select.value = selectedId || "";
      select.addEventListener("change", () => onChange(select.value));
      wrapper.append(labelElement, select);
      container.appendChild(wrapper);
    };

    createSelect("Top Level / World", mapRoots, selectedMapPath[0], value => { if (value) selectMapNode(value); });
    selectedMapPath.forEach((nodeId, index) => {
      const node = mapNodes.get(nodeId);
      if (!node?.children?.length) return;
      const nextSelected = selectedMapPath[index + 1] || "";
      createSelect(nextLevelLabel(node.children), node.children, nextSelected, value => {
        if (value) selectMapNode(value);
        else {
          selectedMapPath = selectedMapPath.slice(0, index + 1);
          displayCurrentMapNode();
          renderMapHierarchyControls();
          renderMapBreadcrumbs();
        }
      }, `Choose ${nextLevelLabel(node.children)}`);
    });
  }

  function renderMapBreadcrumbs() {
    const container = $("#mapBreadcrumbs");
    container.replaceChildren();
    if (!selectedMapPath.length) {
      container.textContent = "No map hierarchy loaded.";
      return;
    }
    selectedMapPath.forEach((nodeId, index) => {
      const node = mapNodes.get(nodeId);
      if (!node) return;
      if (index) {
        const separator = document.createElement("span");
        separator.className = "map-crumb-sep";
        separator.textContent = "›";
        container.appendChild(separator);
      }
      const button = document.createElement("button");
      button.type = "button";
      button.className = "map-crumb dark";
      button.textContent = node.label;
      button.addEventListener("click", () => selectMapNode(node.id));
      container.appendChild(button);
    });
  }

  function refreshMapNodeSearch() {
    const datalist = $("#mapNodeDatalist");
    datalist.replaceChildren();
    mapNodes.forEach(node => {
      const option = document.createElement("option");
      option.value = node.pathLabel;
      option.label = `${humanize(node.type)}${node.file || node.fileRef ? "" : " — no map assigned"}`;
      datalist.appendChild(option);
    });
    const disabled = mapNodes.size === 0;
    $("#mapNodeSearch").disabled = disabled;
    $("#mapNodeSearchButton").disabled = disabled;
  }

  function findMapNode(target) {
    const cleaned = normalizeText(String(target || "").replace(/^map:\/\//i, ""));
    if (!cleaned) return null;
    if (mapNodes.has(target)) return mapNodes.get(target);
    const directId = mapLookup.get(cleaned);
    if (directId) return mapNodes.get(directId);
    const exact = Array.from(mapNodes.values()).find(node => normalizeText(node.pathLabel) === cleaned || normalizeText(node.label) === cleaned);
    if (exact) return exact;
    return Array.from(mapNodes.values()).find(node => normalizeText(node.pathLabel).includes(cleaned) || normalizeText(node.label).includes(cleaned)) || null;
  }

  function openMapSearchValue() {
    const value = $("#mapNodeSearch").value;
    const node = findMapNode(value);
    if (!node) {
      setStatus(`No loaded map level matched “${value}”.`);
      return;
    }
    selectMapNode(node.id);
  }

  function selectMapNode(nodeId) {
    const node = mapNodes.get(nodeId);
    if (!node) return;
    selectedMapPath = pathToNode(node.id);
    renderMapHierarchyControls();
    renderMapBreadcrumbs();
    refreshMapButtons();
    displayCurrentMapNode();
  }

  function refreshMapButtons() {
    const node = currentMapNode();
    const hasNode = Boolean(node);
    $("#mapHomeButton").disabled = !hasNode || selectedMapPath.length <= 1;
    $("#mapParentButton").disabled = !hasNode || !node.parentId;
    $("#mapZoomOutButton").disabled = !hasNode;
    $("#mapZoomInButton").disabled = !hasNode;
    $("#mapResetViewButton").disabled = !hasNode;
    $("#mapFitToggle").disabled = !hasNode;
  }

  function clearCurrentObjectUrl() {
    if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = "";
  }

  function resetMapTransform() {
    mapView.scale = 1;
    mapView.x = 0;
    mapView.y = 0;
    applyMapTransform();
    mapWindow.classList.remove("is-fill");
    $("#mapFitToggle").setAttribute("aria-pressed", "false");
  }

  function applyMapTransform() {
    mapStage.style.transform = `translate(${mapView.x}px, ${mapView.y}px) scale(${mapView.scale})`;
    const readout = $("#mapScaleReadout");
    if (readout) readout.textContent = `${Math.round(mapView.scale * 100)}%`;
  }

  function changeMapZoom(multiplier) {
    mapView.scale = Math.max(0.25, Math.min(6, mapView.scale * multiplier));
    applyMapTransform();
    setStatus(`Viewing ${currentMapNode()?.label || "map"}.`);
  }

  function bridgeScript() {
    return `<script>(function(){
      function send(target){ if(!target) return; parent.postMessage({type:'tablegate.map.navigate',target:String(target)},'*'); }
      document.addEventListener('click',function(event){
        var element=event.target.closest && event.target.closest('[data-map-target],[data-map-id],a[href^="map://"]');
        if(!element) return;
        var target=element.getAttribute('data-map-target')||element.getAttribute('data-map-id')||element.getAttribute('href');
        if(target && target.indexOf('map://')===0) target=target.slice(6);
        event.preventDefault(); send(target);
      });
      window.TableGateMapNavigate=send;
    })();<\/script>`;
  }

  function htmlWithBridge(text, isSvg = false) {
    const bridge = bridgeScript();
    if (isSvg) {
      const cleaned = text.replace(/^\s*<\?xml[^>]*>\s*/i, "").replace(/<!DOCTYPE[^>]*>/i, "");
      return `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#02070a}svg{width:100%;height:100%;display:block}</style></head><body>${cleaned}${bridge}</body></html>`;
    }
    if (/<\/body>/i.test(text)) return text.replace(/<\/body>/i, `${bridge}</body>`);
    return `${text}${bridge}`;
  }

  function collectGeoCoordinates(value, output = []) {
    if (!Array.isArray(value)) return output;
    if (value.length >= 2 && typeof value[0] === "number" && typeof value[1] === "number") output.push([value[0], value[1]]);
    else value.forEach(child => collectGeoCoordinates(child, output));
    return output;
  }

  function geoPathFromLine(line) {
    return line.map((coordinate, index) => `${index ? "L" : "M"}${coordinate[0]},${-coordinate[1]}`).join(" ");
  }

  function renderGeoGeometry(geometry, elements) {
    if (!geometry) return;
    const type = geometry.type;
    const coordinates = geometry.coordinates;
    if (type === "Point") elements.push(`<circle cx="${coordinates[0]}" cy="${-coordinates[1]}" r="0.3"/>`);
    if (type === "MultiPoint") coordinates.forEach(point => elements.push(`<circle cx="${point[0]}" cy="${-point[1]}" r="0.3"/>`));
    if (type === "LineString") elements.push(`<path d="${geoPathFromLine(coordinates)}" fill="none"/>`);
    if (type === "MultiLineString") coordinates.forEach(line => elements.push(`<path d="${geoPathFromLine(line)}" fill="none"/>`));
    if (type === "Polygon") elements.push(`<path d="${coordinates.map(ring => geoPathFromLine(ring) + " Z").join(" ")}" fill-rule="evenodd"/>`);
    if (type === "MultiPolygon") coordinates.forEach(polygon => elements.push(`<path d="${polygon.map(ring => geoPathFromLine(ring) + " Z").join(" ")}" fill-rule="evenodd"/>`));
    if (type === "GeometryCollection") (geometry.geometries || []).forEach(item => renderGeoGeometry(item, elements));
  }

  function renderGeoJson(data) {
    const features = data.type === "FeatureCollection" ? data.features : data.type === "Feature" ? [data] : [{geometry: data}];
    const allCoordinates = [];
    features.forEach(feature => collectGeoCoordinates(feature.geometry?.coordinates, allCoordinates));
    if (!allCoordinates.length) throw new Error("The GeoJSON file does not contain renderable coordinates.");
    const xs = allCoordinates.map(point => point[0]);
    const ys = allCoordinates.map(point => point[1]);
    let minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const width = Math.max(maxX - minX, 1);
    const height = Math.max(maxY - minY, 1);
    const padding = Math.max(width, height) * 0.04;
    const elements = [];
    features.forEach(feature => renderGeoGeometry(feature.geometry, elements));
    const stage = document.createElement("div");
    stage.className = "geojson-stage";
    stage.innerHTML = `<svg viewBox="${minX - padding} ${-(maxY + padding)} ${width + padding * 2} ${height + padding * 2}" preserveAspectRatio="xMidYMid meet" aria-label="Rendered GeoJSON map">${elements.join("")}</svg>`;
    mapStage.appendChild(stage);
  }

  async function displayMapFile(file, node) {
    clearCurrentObjectUrl();
    mapStage.replaceChildren();
    mapEmptyState.classList.add("hidden");
    resetMapTransform();
    const extension = fileExtension(file.name);

    if (["png", "jpg", "jpeg", "webp", "gif"].includes(extension)) {
      currentObjectUrl = URL.createObjectURL(file);
      const image = document.createElement("img");
      image.src = currentObjectUrl;
      image.alt = `${node.label} map`;
      image.draggable = false;
      mapStage.appendChild(image);
    } else if (extension === "svg") {
      const frame = document.createElement("iframe");
      frame.title = `${node.label} interactive SVG map`;
      frame.sandbox = "allow-scripts allow-same-origin allow-forms allow-popups";
      frame.srcdoc = htmlWithBridge(await file.text(), true);
      mapStage.appendChild(frame);
    } else if (["html", "htm"].includes(extension)) {
      const frame = document.createElement("iframe");
      frame.title = `${node.label} interactive HTML map`;
      frame.sandbox = "allow-scripts allow-same-origin allow-forms allow-popups allow-modals";
      frame.srcdoc = htmlWithBridge(await file.text(), false);
      mapStage.appendChild(frame);
    } else if (extension === "pdf") {
      currentObjectUrl = URL.createObjectURL(file);
      const frame = document.createElement("iframe");
      frame.title = `${node.label} PDF map`;
      frame.src = currentObjectUrl;
      mapStage.appendChild(frame);
    } else if (extension === "geojson" || extension === "json") {
      const data = JSON.parse(await file.text());
      if (data.type === "FeatureCollection" || data.type === "Feature" || data.coordinates || data.geometries) renderGeoJson(data);
      else {
        const pre = document.createElement("pre");
        pre.className = "json-stage";
        pre.textContent = safeJson(data);
        mapStage.appendChild(pre);
      }
    } else {
      throw new Error(`Unsupported map format: .${extension}`);
    }
    setStatus(`Loaded ${node.label}.`, `File: <code>${escapeHtml(node.filePath || file.name)}</code> • Scale: <code id="mapScaleReadout">100%</code>`);
  }

  async function displayCurrentMapNode() {
    const node = currentMapNode();
    if (!node) return;
    $("#mapCurrentTitle").textContent = node.label;
    $("#mapCurrentType").textContent = humanize(node.type || "map level");
    const tags = $("#mapCurrentTags");
    tags.replaceChildren();
    [node.type, node.children?.length ? `${node.children.length} child level${node.children.length === 1 ? "" : "s"}` : "leaf level"].filter(Boolean).forEach(value => {
      const tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = humanize(value);
      tags.appendChild(tag);
    });

    if (!node.file && node.fileRef) node.file = resolveLoadedFile(node.fileRef);
    if (!node.file) {
      clearCurrentObjectUrl();
      mapStage.replaceChildren();
      resetMapTransform();
      mapEmptyState.classList.remove("hidden");
      mapEmptyState.innerHTML = `<div class="map-empty-card"><strong>${escapeHtml(node.label)}</strong>${node.fileRef ? `The hierarchy references <code>${escapeHtml(node.fileRef)}</code>, but that file has not been loaded. Load the matching map folder or map file.` : "This hierarchy level has no map assigned. Choose a child level or add a file reference in the manifest."}</div>`;
      setStatus(`${node.label} is selected, but no map file is currently available.`, node.fileRef ? `Expected: <code>${escapeHtml(node.fileRef)}</code>` : `Children: <code>${node.children?.length || 0}</code>`);
      return;
    }
    try { await displayMapFile(node.file, node); }
    catch (error) {
      clearCurrentObjectUrl();
      mapStage.replaceChildren();
      mapEmptyState.classList.remove("hidden");
      mapEmptyState.innerHTML = `<div class="map-empty-card"><strong>Map Could Not Be Displayed</strong>${escapeHtml(error.message || String(error))}</div>`;
      setStatus(`Could not display ${node.label}.`);
    }
  }

  function clearMapData() {
    clearCurrentObjectUrl();
    mapRoots = [];
    mapNodes = new Map();
    mapLookup = new Map();
    selectedMapPath = [];
    loadedFiles = new Map();
    basenameFiles = new Map();
    mapStage.replaceChildren();
    mapEmptyState.classList.remove("hidden");
    mapEmptyState.innerHTML = `<div class="map-empty-card"><strong>Map Viewer Empty</strong>Load a self-contained map file, select a folder containing nested map files, or load a <code>tablegate.map-hierarchy.v1</code> manifest.</div>`;
    $("#mapCurrentTitle").textContent = "No Map Loaded";
    $("#mapCurrentType").textContent = "The viewer is intentionally empty.";
    $("#mapCurrentTags").replaceChildren();
    $("#mapHierarchyControls").replaceChildren();
    $("#mapBreadcrumbs").textContent = "No map hierarchy loaded.";
    $("#mapNodeSearch").value = "";
    refreshMapNodeSearch();
    refreshMapButtons();
    resetMapTransform();
    setStatus("Ready for a map folder, map files, or manifest.");
  }

  async function handleMapFolder(files) {
    registerFiles(files);
    const manifest = Array.from(files).find(file => MANIFEST_NAMES.has(normalizeText(file.name)));
    if (manifest) await loadManifestFile(manifest);
    else inferHierarchyFromFiles(files);
    refreshMapNodeSearch();
    refreshMapButtons();
  }

  async function handleAdditionalMapFiles(files) {
    registerFiles(files);
    if (!mapRoots.length) {
      inferHierarchyFromFiles(files);
    } else {
      bindLoadedFilesToNodes();
      await displayCurrentMapNode();
      setStatus(`Added ${files.length} map file${files.length === 1 ? "" : "s"} and refreshed manifest bindings.`, `Nodes: <code>${mapNodes.size}</code>`);
    }
    refreshMapNodeSearch();
    refreshMapButtons();
  }

  function initMapViewer() {
    $("#loadMapFolderButton").addEventListener("click", () => $("#mapFolderInput").click());
    $("#loadMapFilesButton").addEventListener("click", () => $("#mapFilesInput").click());
    $("#loadMapManifestButton").addEventListener("click", () => $("#mapManifestInput").click());
    $("#clearMapsButton").addEventListener("click", clearMapData);

    $("#mapFolderInput").addEventListener("change", async event => {
      try { await handleMapFolder(event.target.files); }
      catch (error) { alert(error.message || "The map folder could not be loaded."); }
      event.target.value = "";
    });
    $("#mapFilesInput").addEventListener("change", async event => {
      try { await handleAdditionalMapFiles(Array.from(event.target.files || [])); }
      catch (error) { alert(error.message || "The map files could not be loaded."); }
      event.target.value = "";
    });
    $("#mapManifestInput").addEventListener("change", async event => {
      const file = event.target.files?.[0];
      if (!file) return;
      try { await loadManifestFile(file); refreshMapNodeSearch(); refreshMapButtons(); }
      catch (error) { alert(error.message || "The map manifest could not be loaded."); }
      event.target.value = "";
    });

    $("#mapHomeButton").addEventListener("click", () => {
      const rootId = selectedMapPath[0];
      if (rootId) selectMapNode(rootId);
    });
    $("#mapParentButton").addEventListener("click", () => {
      const node = currentMapNode();
      if (node?.parentId) selectMapNode(node.parentId);
    });
    $("#mapZoomOutButton").addEventListener("click", () => changeMapZoom(0.8));
    $("#mapZoomInButton").addEventListener("click", () => changeMapZoom(1.25));
    $("#mapResetViewButton").addEventListener("click", () => { resetMapTransform(); setStatus(`Reset the view for ${currentMapNode()?.label || "the map"}.`); });
    $("#mapFitToggle").addEventListener("click", event => {
      const fill = mapWindow.classList.toggle("is-fill");
      event.currentTarget.setAttribute("aria-pressed", String(fill));
      setStatus(`${fill ? "Fill" : "Fit"} mode selected for ${currentMapNode()?.label || "the map"}.`);
    });
    $("#mapGridToggle").addEventListener("click", event => {
      const hidden = $("#mapGridOverlay").classList.toggle("hidden");
      event.currentTarget.setAttribute("aria-pressed", String(!hidden));
    });
    $("#mapFullscreenButton").addEventListener("click", async () => {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else await $("#mapShell").requestFullscreen();
      } catch { setStatus("Fullscreen could not be opened in this browser."); }
    });
    document.addEventListener("fullscreenchange", () => { $("#mapFullscreenButton").textContent = document.fullscreenElement === $("#mapShell") ? "Exit Fullscreen" : "Fullscreen"; });

    $("#mapNodeSearchButton").addEventListener("click", openMapSearchValue);
    $("#mapNodeSearch").addEventListener("keydown", event => { if (event.key === "Enter") { event.preventDefault(); openMapSearchValue(); } });

    window.addEventListener("message", event => {
      const data = event.data;
      if (!data || typeof data !== "object") return;
      const messageTypes = new Set(["tablegate.map.navigate", "tablegate.map.open", "map:navigate"]);
      const target = data.target || data.mapTarget || data.nodeId || data.path;
      if (messageTypes.has(data.type) || target) {
        const node = findMapNode(target);
        if (node) selectMapNode(node.id);
      }
    });

    mapWindow.addEventListener("wheel", event => {
      if (!event.ctrlKey || !currentMapNode()) return;
      event.preventDefault();
      changeMapZoom(event.deltaY < 0 ? 1.12 : 0.89);
    }, {passive: false});

    let panning = false;
    let startX = 0;
    let startY = 0;
    let originalX = 0;
    let originalY = 0;
    mapWindow.addEventListener("pointerdown", event => {
      if (!currentMapNode() || event.button !== 0 || event.target.closest("iframe")) return;
      panning = true;
      startX = event.clientX;
      startY = event.clientY;
      originalX = mapView.x;
      originalY = mapView.y;
      mapWindow.setPointerCapture(event.pointerId);
    });
    mapWindow.addEventListener("pointermove", event => {
      if (!panning) return;
      mapView.x = originalX + event.clientX - startX;
      mapView.y = originalY + event.clientY - startY;
      applyMapTransform();
    });
    mapWindow.addEventListener("pointerup", event => {
      panning = false;
      try { mapWindow.releasePointerCapture(event.pointerId); } catch {}
    });

    clearMapData();
  }


window.TableGateCampaignHub = Object.freeze({
  async loadFiles(files){ await handleAdditionalMapFiles(Array.from(files || [])); },
  async loadManifest(file){ await loadManifestFile(file); refreshMapNodeSearch(); refreshMapButtons(); },
  clearMaps: clearMapData,
  applyState(data){
    if (!data) return;
    if (data.selectedTheme && THEMES[data.selectedTheme]) { $("#themeSelect").value=data.selectedTheme; applyTheme(data.selectedTheme); }
    if (data.selectedSystem && SYSTEM_PROFILES[data.selectedSystem]) { $("#systemSelect").value=data.selectedSystem; applySystem(data.selectedSystem); }
    Object.entries(data.edits || {}).forEach(([editKey,html])=>{const element=document.querySelector(`[data-edit-key="${CSS.escape(editKey)}"]`);if(element)element.innerHTML=html;});
  },
  getState(){const edits={};$$('[data-edit-key]').forEach(element=>{edits[element.dataset.editKey]=element.innerHTML;});return {schema:'tablegate.setting-agnostic-campaign-page.v1',selectedSystem:$("#systemSelect").value,selectedTheme:$("#themeSelect").value,edits,updatedAt:new Date().toISOString()};},
  setEditable(enabled){$$('[data-edit-key]').forEach(element=>element.setAttribute('contenteditable',enabled?'true':'false'));}
});

  /* ---------------------------------------------------------
     Start
  --------------------------------------------------------- */
  initTheme();
  initModuleToggles();
  initFloatingNavigation();
  initEditablePersistence();
  initSystemSwitcher();
  initImportExport();
  initMapViewer();
})();
