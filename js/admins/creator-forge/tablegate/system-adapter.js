(function (global) {
  "use strict";
  const LS = (global.LifeSimulator = global.LifeSimulator || {});
  const catalog = global.TABLEGATE_SYSTEM_CATALOG || {};
  const esc = value => LS.util ? LS.util.escape(value) : String(value ?? "").replace(/[&<>\"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const byId = id => document.getElementById(id);
  const list = value => Array.isArray(value) ? value : [];
  function system(id) { return catalog[id] || catalog[Object.keys(catalog)[0]] || null; }
  function edition(systemId, editionId) {
    const item = system(systemId); if (!item) return null;
    return item.editions[editionId] || item.editions[item.defaultEdition] || Object.values(item.editions)[0] || null;
  }
  function systemOptions(selected) {
    return Object.entries(catalog).map(([id,item]) => `<option value="${esc(id)}"${id===selected?" selected":""}>${esc(item.name)}</option>`).join("");
  }
  function editionOptions(systemId, selected) {
    const item=system(systemId); if(!item) return "";
    return Object.entries(item.editions).map(([id,e])=>`<option value="${esc(id)}"${id===selected?" selected":""}>${esc(e.label||id)}</option>`).join("");
  }
  function optionMarkup(values, blankLabel, selected) {
    return `<option value="">${esc(blankLabel)}</option>${list(values).map(value=>`<option${value===selected?" selected":""}>${esc(value)}</option>`).join("")}`;
  }
  function currentProjectProfile(state=LS.store.get()) {
    const saved=state.project.systemProfile || {};
    const systemId=saved.systemId || "dnd";
    const item=system(systemId);
    const editionId=saved.editionId || item?.defaultEdition || "";
    return {systemId,editionId,item,edition:edition(systemId,editionId)};
  }
  function populateProject(state=LS.store.get()) {
    const p=currentProjectProfile(state);
    const s=byId("projectSystem"); const e=byId("projectEdition");
    if(!s||!e)return;
    s.innerHTML=systemOptions(p.systemId); s.value=p.systemId;
    e.innerHTML=editionOptions(p.systemId,p.editionId); e.value=p.editionId;
    const summary=byId("systemSummary");
    if(summary && p.item && p.edition){
      summary.innerHTML=`<strong>${esc(p.item.name)} · ${esc(p.edition.label)}</strong><span>${p.edition.ancestries.length} ${esc(p.edition.identityLabel.toLowerCase())} options · ${p.edition.roles.length} ${esc(p.edition.roleLabel.toLowerCase())} options · ${p.edition.specializations.length} specialties · ${p.edition.abilities.length} abilities/skills</span><small>Full source: json/tablegate/systems/references/${esc(p.item.source)}</small>`;
    }
  }
  function populateNpcSelectors(state=LS.store.get()) {
    const p=currentProjectProfile(state);
    const sid=byId("npcSystem")?.value || p.systemId;
    const item=system(sid); if(!item)return;
    const requestedEdition=byId("npcEdition")?.value || (sid===p.systemId?p.editionId:item.defaultEdition);
    const eid=Object.prototype.hasOwnProperty.call(item.editions,requestedEdition)?requestedEdition:item.defaultEdition;
    const ed=edition(sid,eid); if(!ed)return;
    const sys=byId("npcSystem"), edi=byId("npcEdition");
    if(sys){sys.innerHTML=systemOptions(sid);sys.value=sid;}
    if(edi){edi.innerHTML=editionOptions(sid,eid);edi.value=eid;}
    const labels={npcSystemAncestry:ed.identityLabel,npcSystemHeritage:ed.heritageLabel,npcSystemRole:ed.roleLabel,npcSystemSpecialization:"Specialization / Subclass / Edge",npcSystemBackground:"Background / Community / Lens",npcSystemAbilities:"Skills / Domains / Abilities"};
    Object.entries(labels).forEach(([id,label])=>{const el=byId(id+"Label");if(el)el.textContent=label;});
    const set=(id,values,label)=>{const el=byId(id);if(!el)return;const old=el.value;el.innerHTML=optionMarkup(values,`Any ${label.toLowerCase()}`,old);if([...el.options].some(o=>o.value===old))el.value=old;};
    set("npcSystemAncestry",ed.ancestries,ed.identityLabel);
    set("npcSystemHeritage",ed.heritages,ed.heritageLabel);
    set("npcSystemRole",ed.roles,ed.roleLabel);
    set("npcSystemSpecialization",ed.specializations,"specialization");
    set("npcSystemBackground",ed.backgrounds,"background");
    set("npcSystemAbilities",ed.abilities,"skill or ability");
    const note=byId("npcSystemNote"); if(note) note.textContent=`Rules profile: ${item.name} · ${ed.label}. TableGate body form and token art remain independent so any setting can represent humans, aliens, constructs, creatures, or custom beings.`;
  }
  function readNpcProfile() {
    const systemId=byId("npcSystem")?.value || currentProjectProfile().systemId;
    const item=system(systemId);
    const requestedEdition=byId("npcEdition")?.value || item?.defaultEdition || "";
    const editionId=item && Object.prototype.hasOwnProperty.call(item.editions,requestedEdition)?requestedEdition:(item?.defaultEdition||"");
    const ed=edition(systemId,editionId);
    return {
      systemId, systemName:item?.name||systemId, editionId, editionLabel:ed?.label||editionId,
      identityLabel:ed?.identityLabel||"Ancestry / Species", ancestry:byId("npcSystemAncestry")?.value||"",
      heritageLabel:ed?.heritageLabel||"Heritage", heritage:byId("npcSystemHeritage")?.value||"",
      roleLabel:ed?.roleLabel||"Role / Class", role:byId("npcSystemRole")?.value||"",
      specialization:byId("npcSystemSpecialization")?.value||"", background:byId("npcSystemBackground")?.value||"",
      abilities:list([byId("npcSystemAbilities")?.value].filter(Boolean))
    };
  }
  function renderCatalog() {
    const host=byId("systemCatalog"); if(!host)return;
    const q=(byId("systemCatalogSearch")?.value||"").toLowerCase().trim();
    const cards=[];
    Object.entries(catalog).forEach(([sid,s])=>Object.entries(s.editions).forEach(([eid,e])=>{
      const text=[s.name,e.label,...e.ancestries,...e.roles,...e.specializations,...e.abilities].join(" ").toLowerCase();
      if(q&&!text.includes(q))return;
      cards.push(`<article class="system-card"><header><div><h4>${esc(s.name)}</h4><p>${esc(e.label)}</p></div><span class="badge">${e.ancestries.length+e.roles.length+e.specializations.length+e.abilities.length} OPTIONS</span></header><dl><dt>${esc(e.identityLabel)}</dt><dd>${esc(e.ancestries.slice(0,12).join(", ")||"Setting-defined")}${e.ancestries.length>12?` … +${e.ancestries.length-12}`:""}</dd><dt>${esc(e.roleLabel)}</dt><dd>${esc(e.roles.slice(0,12).join(", ")||"Freeform / setting-defined")}${e.roles.length>12?` … +${e.roles.length-12}`:""}</dd><dt>Specialties</dt><dd>${esc(e.specializations.slice(0,10).join(", ")||"System- or campaign-defined")}${e.specializations.length>10?` … +${e.specializations.length-10}`:""}</dd><dt>Reference file</dt><dd><code>json/tablegate/systems/references/${esc(s.source)}</code></dd></dl></article>`);
    }));
    host.innerHTML=cards.join("")||`<p class="empty-state">No system options match this search.</p>`;
  }
  function bind() {
    populateProject(); populateNpcSelectors(); renderCatalog();
    byId("projectSystem")?.addEventListener("change",event=>{
      const systemId=event.target.value,item=system(systemId),editionId=item.defaultEdition;
      LS.store.update(state=>{state.project.systemProfile={...(state.project.systemProfile||{}),systemId,editionId};return state;});
      populateProject(); populateNpcSelectors(); renderCatalog();
    });
    byId("projectEdition")?.addEventListener("change",event=>{
      LS.store.update(state=>{state.project.systemProfile={...(state.project.systemProfile||{}),systemId:byId("projectSystem").value,editionId:event.target.value};return state;});
      populateProject(); populateNpcSelectors();
    });
    byId("npcSystem")?.addEventListener("change",populateNpcSelectors);
    byId("npcEdition")?.addEventListener("change",populateNpcSelectors);
    byId("systemCatalogSearch")?.addEventListener("input",renderCatalog);
  }
  LS.systems=Object.freeze({catalog,system,edition,systemOptions,editionOptions,currentProjectProfile,populateProject,populateNpcSelectors,readNpcProfile,renderCatalog,bind});
})(window);
