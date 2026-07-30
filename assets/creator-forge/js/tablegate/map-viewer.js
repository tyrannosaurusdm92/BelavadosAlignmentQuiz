(function (global) {
  "use strict";
  const LS = global.LifeSimulator;
  const runtime = {
    files: new Map(), physicalNodes: [], semanticNodes: [], nodes: [], current: null,
    scale: 1, x: 0, y: 0, objectUrl: null, manifest: null, pendingPlacement: null,
    draggingPlacement: null, semanticRootId: "tablegate-project-root"
  };
  const byId = id => document.getElementById(id);
  const imageExt = /\.(svg|png|jpe?g|webp|gif)$/i;
  const viewable = /\.(svg|png|jpe?g|webp|gif|html?|pdf|geojson)$/i;
  const TYPE_ORDER = ["world", "continent", "country", "kingdom", "region", "province", "settlement", "district", "landmark", "structure", "interior", "room", "location", "map"];

  function clean(path) { return String(path || "").replace(/\\/g, "/").replace(/^\/+|\/+$/g, ""); }
  function label(name) { return String(name || "").replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").replace(/\b\w/g, character => character.toUpperCase()); }
  function inferType(path) {
    const value = String(path || "").toLowerCase();
    for (const [type, pattern] of [
      ["world", /world|globe|planet/], ["continent", /continent/], ["country", /country|nation/], ["kingdom", /kingdom|realm|state/],
      ["province", /province/], ["region", /region|territory/], ["settlement", /settlement|city|town|village|station|colony/],
      ["district", /district|ward|neighborhood|quarter/], ["structure", /tavern|inn|building|ship|vessel|dungeon|structure|house|temple|shop/],
      ["interior", /interior|floor|level/], ["room", /room|chamber/]
    ]) if (pattern.test(value)) return type;
    return "map";
  }
  function escapeAttr(value) { return LS.util.escape(String(value || "")); }
  function revokeCurrentUrl() { if (runtime.objectUrl) { URL.revokeObjectURL(runtime.objectUrl); runtime.objectUrl = null; } }
  function setStatus(text) { const element = byId("mapViewerStatus"); if (element) element.textContent = text; }
  function state() { return LS.store.get(); }

  function semanticType(location) {
    const value = String(location.mapLevel || location.map?.nodeType || location.category || location.type || "location").toLowerCase();
    if (/world|globe|planet/.test(value)) return "world";
    if (/continent/.test(value)) return "continent";
    if (/country|nation/.test(value)) return "country";
    if (/kingdom|realm|state/.test(value)) return "kingdom";
    if (/province/.test(value)) return "province";
    if (/region|territory/.test(value)) return "region";
    if (/settlement|city|town|village|station|colony/.test(value)) return "settlement";
    if (/district|ward|quarter|neighborhood/.test(value)) return "district";
    if (/landmark|plaza|market|park|garden|grounds/.test(value)) return "landmark";
    if (/room|chamber/.test(value)) return "room";
    if (/interior|floor|level/.test(value)) return "interior";
    if (/structure|building|tavern|inn|shop|house|temple|hall|office|yard|tower|estate|farm|forge|clinic|school|archive|barracks/.test(value)) return "structure";
    return "location";
  }

  function syncSemanticNodes(options = {}) {
    if (!LS.store) return;
    const currentState = state();
    const root = {
      id: runtime.semanticRootId,
      name: currentState.project.name || "TableGate Project",
      type: "world",
      semantic: true,
      virtual: true,
      locationId: null,
      parentId: null,
      children: []
    };
    const nodes = currentState.locations.map(location => ({
      id: `location:${location.locationId}`,
      name: location.name,
      type: semanticType(location),
      semantic: true,
      locationId: location.locationId,
      parentId: location.parentLocationId ? `location:${location.parentLocationId}` : runtime.semanticRootId,
      path: location.map?.assetPath || "",
      file: null,
      externalUrl: null,
      children: []
    }));
    runtime.semanticNodes = [root, ...nodes];
    const persisted = (currentState.tablegate.mapNodes || []).filter(node => node && node.assetId).map(node => ({
      id: node.id, name: node.name || "Generated Map", path: node.path || "", parentId: node.parentId || null,
      depth: Number(node.depth || 0), type: node.type || "map", file: null, externalUrl: null,
      assetId: node.assetId, semantic: false, locationId: node.locationId || null, children: []
    }));
    const imported = runtime.physicalNodes.filter(node => !node.assetId || !persisted.some(saved => saved.id === node.id));
    runtime.physicalNodes = [...imported, ...persisted];
    rebuildNodes();
    renderRecordPanel();
    populateLinkSelector();
    if (options.openRoot && !runtime.current) openNode(root.id);
    if (runtime.current?.semantic) {
      const replacement = runtime.nodes.find(node => node.id === runtime.current.id);
      if (replacement) { runtime.current = replacement; renderCurrent(); }
    }
  }

  function linkHierarchy(nodes) {
    const byNodeId = new Map(nodes.map(node => [node.id, node]));
    nodes.forEach(node => { node.children = []; node.parent = null; });
    nodes.forEach(node => {
      let parent = node.parentId ? byNodeId.get(node.parentId) : null;
      if (!parent && node.path && !node.semantic) {
        parent = nodes.filter(candidate => candidate.id !== node.id && candidate.path && node.path.startsWith(candidate.path.replace(/\.[^.]+$/, "") + "/")).sort((a, b) => (b.depth || 0) - (a.depth || 0))[0] || null;
      }
      node.parent = parent || null;
      if (parent) parent.children.push(node);
    });
  }

  function rebuildNodes() {
    runtime.nodes = [...runtime.semanticNodes, ...runtime.physicalNodes];
    linkHierarchy(runtime.nodes);
    buildSelectors();
  }

  function parseFiles(files) {
    revokeCurrentUrl();
    runtime.files.clear(); runtime.physicalNodes = []; runtime.manifest = null;
    [...files].forEach(file => {
      const path = clean(file.webkitRelativePath || file.name);
      if (!viewable.test(path)) return;
      runtime.files.set(path, file);
      const parts = path.split("/"); const name = parts.pop();
      runtime.physicalNodes.push({
        id: `file:${path}`, name: label(name), path, parentId: null, depth: parts.length,
        type: inferType(path), file, externalUrl: null, semantic: false, locationId: null, children: []
      });
    });
    runtime.physicalNodes.sort((a, b) => a.depth - b.depth || a.name.localeCompare(b.name));
    rebuildNodes();
    const first = runtime.physicalNodes[0];
    if (first) openNode(first.id); else setStatus("No supported map files were found. Generated TableGate records remain available in the semantic viewer.");
  }

  async function parseManifest(file) {
    try {
      const data = JSON.parse(await file.text());
      const raw = Array.isArray(data) ? data : (data.maps || data.nodes || data.locations || []);
      if (!Array.isArray(raw) || !raw.length) throw new Error("Manifest needs a maps, nodes, or locations array.");
      runtime.manifest = data;
      runtime.physicalNodes = raw.map((entry, index) => {
        const path = clean(entry.path || entry.file || entry.src || entry.url || "");
        const rawId = String(entry.id || path || `map-${index + 1}`);
        return {
          id: rawId.startsWith("file:") || rawId.startsWith("manifest:") ? rawId : `manifest:${rawId}`,
          name: String(entry.name || entry.label || label(path) || `Map ${index + 1}`),
          path,
          parentId: entry.parentId || entry.parent ? (String(entry.parentId || entry.parent).startsWith("manifest:") ? String(entry.parentId || entry.parent) : `manifest:${entry.parentId || entry.parent}`) : null,
          depth: Number(entry.depth || 0), type: String(entry.type || entry.level || inferType(path)),
          file: path ? runtime.files.get(path) : null,
          externalUrl: entry.url && /^https?:/i.test(entry.url) ? entry.url : null,
          semantic: false, locationId: entry.locationId || null, children: []
        };
      });
      rebuildNodes();
      const first = runtime.physicalNodes.find(node => !node.parentId) || runtime.physicalNodes[0];
      if (first) openNode(first.id);
      setStatus(`Manifest loaded: ${runtime.physicalNodes.length} physical map nodes plus ${runtime.semanticNodes.length - 1} generated semantic locations.`);
    } catch (error) { setStatus(`Manifest error: ${error.message}`); }
  }

  function buildSelectors() {
    const host = byId("mapHierarchySelectors"); if (!host) return;
    const groups = new Map();
    runtime.nodes.filter(node => node.id !== runtime.semanticRootId).forEach(node => {
      const type = TYPE_ORDER.includes(node.type) ? node.type : "map";
      if (!groups.has(type)) groups.set(type, []);
      groups.get(type).push(node);
    });
    host.innerHTML = TYPE_ORDER.filter(type => groups.has(type)).map(type => {
      const entries = groups.get(type).sort((a, b) => Number(b.semantic) - Number(a.semantic) || a.name.localeCompare(b.name));
      return `<label>${label(type)}<select data-map-type="${type}"><option value="">Choose ${label(type).toLowerCase()}</option>${entries.map(node => `<option value="${escapeAttr(node.id)}">${node.semantic ? "◆ " : "▧ "}${escapeAttr(node.name)}</option>`).join("")}</select></label>`;
    }).join("");
    host.querySelectorAll("select").forEach(select => select.addEventListener("change", () => { if (select.value) openNode(select.value); }));
    if (runtime.current) syncSelectors(runtime.current);
  }

  function renderBreadcrumb(node) {
    const host = byId("mapBreadcrumbs"); if (!host) return;
    const chain = []; let cursor = node; let guard = 0;
    while (cursor && guard++ < 60) { chain.unshift(cursor); cursor = cursor.parent; }
    host.innerHTML = chain.map(item => `<button type="button" data-map-open="${escapeAttr(item.id)}">${item.semantic ? "◆ " : ""}${escapeAttr(item.name)}</button>`).join("<b>›</b>");
    host.querySelectorAll("[data-map-open]").forEach(button => button.addEventListener("click", () => openNode(button.dataset.mapOpen)));
  }

  function resetTransform() { runtime.scale = 1; runtime.x = 0; runtime.y = 0; applyTransform(); }
  function applyTransform() {
    const element = byId("mapViewerContent"); if (element) element.style.transform = `translate(${runtime.x}px,${runtime.y}px) scale(${runtime.scale})`;
    const readout = byId("mapZoomReadout"); if (readout) readout.textContent = `${Math.round(runtime.scale * 100)}%`;
  }

  function nodePlacements(nodeId) { return (state().tablegate.mapPlacements || []).filter(item => item.mapNodeId === nodeId); }
  function recordForPlacement(placement) {
    const currentState = state();
    if (placement.recordType === "npc") return currentState.npcs.find(item => item.npcId === placement.recordId);
    return currentState.locations.find(item => item.locationId === placement.recordId);
  }
  function placementMarkup(nodeId) {
    return nodePlacements(nodeId).map(item => {
      const record = recordForPlacement(item); if (!record) return "";
      const name = record.name || "Record";
      const isNpc = item.recordType === "npc";
      return `<button type="button" class="map-record-pin ${isNpc ? "npc" : "location"}" data-placement-id="${escapeAttr(item.placementId)}" style="left:${Number(item.x) || 50}%;top:${Number(item.y) || 50}%" title="Drag to reposition ${escapeAttr(name)}"><span>${isNpc ? "●" : "◆"}</span><b>${escapeAttr(name)}</b></button>`;
    }).join("");
  }

  function linkedPhysicalForLocation(locationId) {
    const link = (state().tablegate.mapLinks || []).find(item => item.locationId === locationId);
    return link ? runtime.physicalNodes.find(node => node.id === link.mapNodeId) : null;
  }

  function renderSemantic(node, target) {
    const currentState = state();
    const location = node.locationId ? currentState.locations.find(item => item.locationId === node.locationId) : null;
    const children = node.children.filter(item => item.semantic);
    const directNpcs = currentState.npcs.filter(npc => {
      if (!location) return !npc.simulation?.currentLocationId && !npc.residenceLocationId && !npc.workplaceLocationId;
      return [npc.simulation?.currentLocationId, npc.residenceLocationId, npc.workplaceLocationId].includes(location.locationId);
    });
    const linked = location ? linkedPhysicalForLocation(location.locationId) : null;
    const cards = children.map((child, index) => {
      const childLocation = currentState.locations.find(item => item.locationId === child.locationId);
      const assigned = currentState.npcs.filter(npc => [npc.simulation?.currentLocationId, npc.residenceLocationId, npc.workplaceLocationId].includes(child.locationId));
      const x = childLocation?.map?.x ?? (12 + (index % 4) * 24);
      const y = childLocation?.map?.y ?? (18 + Math.floor(index / 4) * 23);
      return `<button class="semantic-location-node" type="button" data-map-open="${escapeAttr(child.id)}" style="left:${x}%;top:${y}%"><small>${escapeAttr(label(child.type))}</small><b>${escapeAttr(child.name)}</b><span>${assigned.length} NPC${assigned.length === 1 ? "" : "s"}</span></button>`;
    }).join("");
    target.innerHTML = `<div class="semantic-map-canvas">
      <div class="semantic-map-grid" aria-hidden="true"></div>
      <header class="semantic-map-heading"><p>${location ? escapeAttr(location.type) : "TableGate project"}</p><h3>${escapeAttr(node.name)}</h3>${location?.public?.description ? `<span>${escapeAttr(location.public.description)}</span>` : ""}${linked ? `<button type="button" data-map-open="${escapeAttr(linked.id)}">Open linked physical map</button>` : ""}</header>
      <div class="semantic-node-layer">${cards || '<div class="semantic-empty">No nested locations yet. Generate or edit locations and set their parentLocationId to build deeper map levels.</div>'}</div>
      <aside class="semantic-npc-dock"><b>People and entities here</b><div>${directNpcs.slice(0, 60).map(npc => `<button type="button" data-map-place-record="npc:${escapeAttr(npc.npcId)}" title="Place this NPC on the current map">${LS.tokens?.tokenMarkup ? LS.tokens.tokenMarkup(npc, { state: currentState }) : ""}<span>${escapeAttr(npc.name)}</span></button>`).join("") || "<span>No directly assigned entities.</span>"}</div></aside>
      <div class="map-placement-layer">${placementMarkup(node.id)}</div>
    </div>`;
    target.querySelectorAll("[data-map-open]").forEach(button => button.addEventListener("click", event => { event.stopPropagation(); openNode(button.dataset.mapOpen); }));
    target.querySelectorAll("[data-map-place-record]").forEach(button => button.addEventListener("click", event => { event.stopPropagation(); setPendingPlacement(button.dataset.mapPlaceRecord); }));
    bindPlacementDrag(target);
  }

  function renderPhysical(node, target) {
    if (node.assetId) {
      target.innerHTML = `<div class="physical-map-stage"><div class="map-generated-asset" data-tablegate-asset-id="${escapeAttr(node.assetId)}" role="img" aria-label="${escapeAttr(node.name)}"></div><div class="map-placement-layer">${placementMarkup(node.id)}</div></div>`;
      LS.assets?.hydrate?.(target); bindPlacementDrag(target); return;
    }
    if (!node.file && !node.externalUrl) {
      target.innerHTML = `<div class="empty-map"><b>${escapeAttr(node.name)}</b><span>This manifest node has no loaded local map file. Load the matching folder or link it to a generated location.</span></div>`;
      return;
    }
    const url = node.externalUrl || URL.createObjectURL(node.file); if (!node.externalUrl) runtime.objectUrl = url;
    let base;
    if (imageExt.test(node.path || url)) base = `<img class="map-base-asset" src="${escapeAttr(url)}" alt="${escapeAttr(node.name)}">`;
    else if (/\.pdf$/i.test(node.path || url)) base = `<iframe class="map-base-asset" src="${escapeAttr(url)}" title="${escapeAttr(node.name)}"></iframe>`;
    else if (/\.geojson$/i.test(node.path || url)) base = `<pre class="map-base-asset geojson-preview">Loading GeoJSON…</pre>`;
    else base = `<iframe class="map-base-asset" src="${escapeAttr(url)}" title="${escapeAttr(node.name)}"></iframe>`;
    target.innerHTML = `<div class="physical-map-stage">${base}<div class="map-placement-layer">${placementMarkup(node.id)}</div></div>`;
    if (/\.geojson$/i.test(node.path || url) && node.file) node.file.text().then(text => {
      const pre = target.querySelector("pre"); if (!pre) return;
      try { pre.textContent = JSON.stringify(JSON.parse(text), null, 2); } catch { pre.textContent = text; }
    });
    bindPlacementDrag(target);
  }

  function renderCurrent() {
    const node = runtime.current; if (!node) return;
    const target = byId("mapViewerContent"); if (!target) return;
    target.innerHTML = ""; revokeCurrentUrl(); resetTransform(); renderBreadcrumb(node);
    if (node.semantic) renderSemantic(node, target); else renderPhysical(node, target);
    byId("mapViewerTitle").textContent = `${node.name} · ${label(node.type)}${node.semantic ? " · Generated Data" : ""}`;
    setStatus(node.semantic ? `${node.name} is a live semantic map node built from LifeSimulator locations and NPC assignments.` : `${node.path || node.externalUrl || node.id} loaded. Generated records can be placed over this map and saved in the TableGate project.`);
    syncSelectors(node); renderRecordPanel(); populateLinkSelector();
  }

  function openNode(id) {
    const node = runtime.nodes.find(item => item.id === id); if (!node) return;
    runtime.current = node; renderCurrent();
  }

  function syncSelectors(node) {
    document.querySelectorAll("[data-map-type]").forEach(select => {
      const ancestors = []; let cursor = node;
      while (cursor) { ancestors.push(cursor); cursor = cursor.parent; }
      const match = ancestors.find(item => item.type === select.dataset.mapType);
      select.value = match?.id || (node.type === select.dataset.mapType ? node.id : "");
    });
  }

  function setPendingPlacement(value) {
    const [recordType, recordId] = String(value || "").split(":");
    if (!recordId || !["npc", "location"].includes(recordType)) return;
    runtime.pendingPlacement = { recordType, recordId };
    const status = byId("mapPlacementModeStatus"); if (status) status.textContent = `Placement mode: click the map to place ${recordType}.`;
    setStatus("Placement mode active. Click anywhere inside the current map to place the selected generated record.");
  }

  function placePending(event) {
    if (!runtime.pendingPlacement || !runtime.current) return;
    if (event.target.closest("button,iframe")) return;
    const content = byId("mapViewerContent"); const rect = content.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100));
    const pending = runtime.pendingPlacement;
    LS.store.update(currentState => {
      currentState.tablegate.mapPlacements = currentState.tablegate.mapPlacements || [];
      const existing = currentState.tablegate.mapPlacements.find(item => item.mapNodeId === runtime.current.id && item.recordType === pending.recordType && item.recordId === pending.recordId);
      if (existing) { existing.x = x; existing.y = y; existing.modifiedAt = LS.util.now(); }
      else currentState.tablegate.mapPlacements.push({ placementId: LS.util.uid("placement"), mapNodeId: runtime.current.id, recordType: pending.recordType, recordId: pending.recordId, x, y, createdAt: LS.util.now(), modifiedAt: LS.util.now() });
      if (pending.recordType === "location") {
        const location = currentState.locations.find(item => item.locationId === pending.recordId);
        if (location) { location.map = { ...(location.map || {}), x, y, manifestNodeId: runtime.current.id }; }
      }
      return currentState;
    });
    runtime.pendingPlacement = null;
    const status = byId("mapPlacementModeStatus"); if (status) status.textContent = "Placement mode off";
    renderCurrent();
  }

  function bindPlacementDrag(target) {
    target.querySelectorAll("[data-placement-id]").forEach(pin => {
      pin.addEventListener("pointerdown", event => {
        event.stopPropagation(); runtime.draggingPlacement = { id: pin.dataset.placementId, pointerId: event.pointerId };
        pin.setPointerCapture?.(event.pointerId);
      });
      pin.addEventListener("pointermove", event => {
        if (!runtime.draggingPlacement || runtime.draggingPlacement.id !== pin.dataset.placementId) return;
        const content = byId("mapViewerContent"); const rect = content.getBoundingClientRect();
        const x = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100));
        const y = Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100));
        pin.style.left = `${x}%`; pin.style.top = `${y}%`; pin.dataset.x = String(x); pin.dataset.y = String(y);
      });
      pin.addEventListener("pointerup", () => {
        if (!runtime.draggingPlacement || runtime.draggingPlacement.id !== pin.dataset.placementId) return;
        LS.store.update(currentState => {
          const placement = currentState.tablegate.mapPlacements.find(item => item.placementId === pin.dataset.placementId);
          if (placement) { placement.x = Number(pin.dataset.x || parseFloat(pin.style.left)); placement.y = Number(pin.dataset.y || parseFloat(pin.style.top)); placement.modifiedAt = LS.util.now(); }
          return currentState;
        });
        runtime.draggingPlacement = null;
      });
    });
  }

  function renderRecordPanel() {
    const host = byId("mapRecordList"); if (!host || !LS.store) return;
    const currentState = state(); const query = String(byId("mapRecordSearch")?.value || "").trim().toLowerCase();
    const locations = currentState.locations.filter(item => !query || `${item.name} ${item.type} ${item.category}`.toLowerCase().includes(query));
    const npcs = currentState.npcs.filter(item => !query || `${item.name} ${item.raceName || ""} ${item.profession || ""} ${item.genderIdentity || ""}`.toLowerCase().includes(query));
    host.innerHTML = `<details open><summary>Locations (${locations.length})</summary><div class="map-record-list">${locations.slice(0, 250).map(location => `<article><div><b>${escapeAttr(location.name)}</b><span>${escapeAttr(location.type)} · ${escapeAttr(semanticType(location))}</span></div><button type="button" data-map-open="location:${escapeAttr(location.locationId)}">Open</button><button type="button" data-place-record="location:${escapeAttr(location.locationId)}">Place</button></article>`).join("") || "<p>No generated locations.</p>"}</div></details>
      <details><summary>NPCs / entities (${npcs.length})</summary><div class="map-record-list">${npcs.slice(0, 300).map(npc => `<article><div><b>${escapeAttr(npc.name)}</b><span>${escapeAttr(npc.genderIdentity)} · ${escapeAttr(npc.pronouns?.label || "")}</span></div><button type="button" data-place-record="npc:${escapeAttr(npc.npcId)}">Place</button></article>`).join("") || "<p>No generated NPCs.</p>"}</div></details>`;
    host.querySelectorAll("[data-map-open]").forEach(button => button.addEventListener("click", () => openNode(button.dataset.mapOpen)));
    host.querySelectorAll("[data-place-record]").forEach(button => button.addEventListener("click", () => setPendingPlacement(button.dataset.placeRecord)));
    const summary = byId("mapRecordSummary"); if (summary) summary.textContent = `${currentState.locations.length} locations · ${currentState.npcs.length} NPCs available to the viewer`;
  }

  function populateLinkSelector() {
    const select = byId("mapLinkLocation"); if (!select || !LS.store) return;
    const currentValue = select.value;
    select.innerHTML = `<option value="">Choose generated location</option>${state().locations.map(location => `<option value="${escapeAttr(location.locationId)}">${escapeAttr(location.name)} · ${escapeAttr(semanticType(location))}</option>`).join("")}`;
    if ([...select.options].some(option => option.value === currentValue)) select.value = currentValue;
    if (runtime.current?.locationId) select.value = runtime.current.locationId;
  }

  function linkCurrentMap() {
    if (!runtime.current || runtime.current.semantic) { setStatus("Open a physical map before linking it to a generated location."); return; }
    const locationId = byId("mapLinkLocation")?.value; if (!locationId) { setStatus("Choose a generated location to link."); return; }
    LS.store.update(currentState => {
      currentState.tablegate.mapLinks = (currentState.tablegate.mapLinks || []).filter(item => item.mapNodeId !== runtime.current.id && item.locationId !== locationId);
      currentState.tablegate.mapLinks.push({ linkId: LS.util.uid("map-link"), mapNodeId: runtime.current.id, locationId, createdAt: LS.util.now() });
      const location = currentState.locations.find(item => item.locationId === locationId);
      if (location) location.map = { ...(location.map || {}), manifestNodeId: runtime.current.id, assetPath: runtime.current.path || runtime.current.externalUrl || null };
      return currentState;
    });
    setStatus("Physical map linked to the generated location. Opening that semantic location now offers the linked map.");
  }

  function clearPlacements() {
    if (!runtime.current) return;
    LS.store.update(currentState => { currentState.tablegate.mapPlacements = (currentState.tablegate.mapPlacements || []).filter(item => item.mapNodeId !== runtime.current.id); return currentState; });
    renderCurrent();
  }

  function semanticManifest() {
    const currentState = state();
    const nodes = currentState.locations.map(location => ({
      id: `location:${location.locationId}`, locationId: location.locationId, name: location.name,
      type: semanticType(location), parentId: location.parentLocationId ? `location:${location.parentLocationId}` : runtime.semanticRootId,
      path: location.map?.assetPath || null, x: location.map?.x ?? null, y: location.map?.y ?? null
    }));
    return {
      schema: "tablegate.semantic-map-manifest.v1",
      projectId: currentState.project.projectId, projectName: currentState.project.name, generatedAt: LS.util.now(),
      rootId: runtime.semanticRootId, nodes, placements: currentState.tablegate.mapPlacements || [], links: currentState.tablegate.mapLinks || [],
      transit: currentState.transit || { types: [], stops: [], routes: [], services: [], vehicles: [], tripPlans: [] },
      npcIndex: currentState.npcs.map(npc => ({ npcId: npc.npcId, name: npc.name, genderIdentityId: npc.genderIdentityId || null, genderIdentity: npc.genderIdentity, pronouns: npc.pronouns, currentLocationId: npc.simulation?.currentLocationId || null, residenceLocationId: npc.residenceLocationId || null, workplaceLocationId: npc.workplaceLocationId || null }))
    };
  }
  function exportManifest() {
    const payload = semanticManifest();
    LS.util.download(`${LS.util.safeFileName(payload.projectName)}_TableGate_Map_Manifest.json`, JSON.stringify(payload, null, 2));
  }

  function bind() {
    byId("mapFolderInput")?.addEventListener("change", event => parseFiles(event.target.files));
    byId("mapFilesInput")?.addEventListener("change", event => parseFiles(event.target.files));
    byId("mapManifestInput")?.addEventListener("change", event => { const file = event.target.files?.[0]; if (file) parseManifest(file); });
    byId("mapZoomIn")?.addEventListener("click", () => { runtime.scale = Math.min(6, runtime.scale * 1.2); applyTransform(); });
    byId("mapZoomOut")?.addEventListener("click", () => { runtime.scale = Math.max(.2, runtime.scale / 1.2); applyTransform(); });
    byId("mapReset")?.addEventListener("click", resetTransform);
    byId("mapFullscreen")?.addEventListener("click", () => byId("mapViewerShell")?.requestFullscreen?.());
    byId("mapSyncRecords")?.addEventListener("click", () => { syncSemanticNodes({ openRoot: true }); setStatus("Generated locations and NPCs synchronized into the viewer."); });
    byId("mapExportManifest")?.addEventListener("click", exportManifest);
    byId("mapLinkCurrent")?.addEventListener("click", linkCurrentMap);
    byId("mapClearPlacements")?.addEventListener("click", clearPlacements);
    byId("mapRecordSearch")?.addEventListener("input", LS.util.debounce(renderRecordPanel, 120));
    const viewport = byId("mapViewerViewport"); let drag = null;
    viewport?.addEventListener("click", placePending);
    viewport?.addEventListener("wheel", event => { event.preventDefault(); runtime.scale = Math.max(.2, Math.min(6, runtime.scale * (event.deltaY < 0 ? 1.1 : .9))); applyTransform(); }, { passive: false });
    viewport?.addEventListener("pointerdown", event => {
      if (runtime.pendingPlacement || event.target.closest("button,.map-record-pin")) return;
      drag = { x: event.clientX, y: event.clientY, ox: runtime.x, oy: runtime.y }; viewport.setPointerCapture?.(event.pointerId);
    });
    viewport?.addEventListener("pointermove", event => { if (!drag) return; runtime.x = drag.ox + event.clientX - drag.x; runtime.y = drag.oy + event.clientY - drag.y; applyTransform(); });
    viewport?.addEventListener("pointerup", () => { drag = null; }); viewport?.addEventListener("pointercancel", () => { drag = null; });
    syncSemanticNodes({ openRoot: false });
    LS.store.subscribe(() => syncSemanticNodes({ openRoot: false }));
    setStatus("Map Viewer ready. Generated locations and NPCs are synchronized as semantic map data; physical maps can be loaded and linked at any level.");
  }

  LS.mapViewer = Object.freeze({ bind, syncSemanticNodes, openNode, renderRecordPanel, semanticManifest, exportManifest, runtime });
  document.addEventListener("DOMContentLoaded", bind);
})(window);
