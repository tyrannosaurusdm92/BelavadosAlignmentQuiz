(function(){
  const U=window.BelavadosUtils;
  const core=new window.BelavadosLifeGeneratorCore();
  let state = core.defaultState();
  function getState(){return state;} function setState(s){state=s; normalizeState(); saveLocal(false); renderRaceCache();} window.BelavadosRenderers.setStateRefs(core,getState,setState);
  document.addEventListener('DOMContentLoaded', init);
  function init(){
    populateSelectors(); loadLocal(); bind(); updateCountsFromType(); syncScopeControls(); renderRaceCache(); window.BelavadosRenderers.renderAll();
    U.status('Life generator loaded.');
  }
  function populateSelectors(){
    fill(U.$('provinceSelect'), core.assignments.map(p=>({value:p.province,label:p.province}))); updateSettlementOptions();
    fill(U.$('biomeSelect'), core.biomes.map(b=>({value:b,label:b}))); U.$('biomeSelect').value='Coastal River';
    const align=['Any','Altruistic / Protective','Self-serving / Exploitative','Lawful / Orderly','Chaotic / Rebellious','Cooperative / Loyal','Individualistic / Competitive','Honorable / Principled','Dishonorable / Ruthless']; fill(U.$('alignmentPreference'), align.map(a=>({value:a,label:a})));
    fill(U.$('raceCategory'), core.raceCategories.map(c=>({value:c.value,label:`${c.number}. ${c.label} — ${c.creator}`}))); updateRaceOptions();
    const tz=core.getProvinceTime(U.$('provinceSelect').value); if(tz.primaryUtc) U.$('timezoneInput').value=tz.primaryUtc;
  }
  function fill(sel, rows){ sel.innerHTML=rows.map(r=>`<option value="${U.escapeHTML(r.value)}">${U.escapeHTML(r.label)}</option>`).join(''); }
  function updateSettlementOptions(){ const province=U.$('provinceSelect').value || core.assignments[0]?.province; const rows=core.settlementsForProvince(province); fill(U.$('settlementSelect'), rows.map(s=>({value:s.name,label:`${s.name} (${s.type})`}))); if(rows[0]){ U.$('settlementType').value=rows[0].type; } }
  function updateRaceOptions(){ const cat=core.raceCategories.find(c=>c.value===U.$('raceCategory').value) || core.raceCategories[0]; fill(U.$('racePick'), (cat?.races||[]).map(r=>({value:r.value,label:r.label}))); }
  function updateCountsFromType(){ const type=U.$('settlementType').value; const sc=core.rules.settlementScaling[type]; if(sc){ U.$('locationCount').value=sc.locations; U.$('npcCount').value=sc.npcs; if(!U.$('populationInput').value || Number(U.$('populationInput').value)<sc.npcs) U.$('populationInput').value=Math.round(sc.npcs*10); } }
  function bind(){
    U.$('scopeMode').addEventListener('change',()=>{syncScopeControls();});
    U.$('provinceSelect').addEventListener('change',()=>{updateSettlementOptions(); const tz=core.getProvinceTime(U.$('provinceSelect').value); if(tz.primaryUtc) U.$('timezoneInput').value=tz.primaryUtc; syncScopeControls();});
    U.$('settlementSelect').addEventListener('change',()=>{U.$('settlementType').value=core.inferSettlementType(U.$('provinceSelect').value,U.$('settlementSelect').value); updateCountsFromType();});
    U.$('settlementType').addEventListener('change', updateCountsFromType); U.$('raceCategory').addEventListener('change', updateRaceOptions);
    U.$('generateBtn').addEventListener('click', generate); U.$('saveBtn').addEventListener('click',()=>saveLocal(true)); U.$('clearStateBtn').addEventListener('click', clearLocal);
    U.$('filterInput').addEventListener('input',()=>window.BelavadosRenderers.renderAll()); document.body.addEventListener('click', window.BelavadosRenderers.handleClick);
    U.qsa('.tab').forEach(tab=>tab.addEventListener('click',()=>activateTab(tab.dataset.tab)));
    U.$('editorClose').addEventListener('click',()=>U.$('editorBackdrop').classList.remove('open')); U.$('editorSave').addEventListener('click',window.BelavadosRenderers.saveEditor); U.$('editorReroll').addEventListener('click',()=>{ const ed=window.BelavadosRenderers.editor; if(ed) window.BelavadosRenderers.reroll(ed.type,ed.id,'entire'); U.$('editorBackdrop').classList.remove('open'); });
    U.$('exportJsonBtn').addEventListener('click',()=>window.BelavadosExporters.exportJSON(state)); U.$('exportGeoJsonBtn').addEventListener('click',()=>window.BelavadosExporters.exportGeoJSON(state)); U.$('exportHtmlBtn').addEventListener('click',()=>window.BelavadosExporters.exportHTML(state)); U.$('exportDocxBtn').addEventListener('click',()=>window.BelavadosExporters.exportDOCX(state)); U.$('exportZipBtn').addEventListener('click',()=>window.BelavadosExporters.exportZIP(state));
    U.$('btnAllCategory').addEventListener('click',()=>{U.$('raceMode').value='allInCategory'; generate();}); U.$('btnSelectedRace').addEventListener('click',()=>{U.$('raceMode').value='race'; generate();}); U.$('btnMixedPopulation').addEventListener('click',()=>{U.$('raceMode').value='weighted'; generate();});
    U.$('btnAddRaceCache').addEventListener('click', addSelectedRaceToCache);
    U.$('btnAddCategoryCache').addEventListener('click', addCategoryToCache);
    U.$('btnClearRaceCache').addEventListener('click', clearRaceCache);
    U.$('raceCacheList').addEventListener('click', e=>{ const btn=e.target.closest('[data-cache-remove]'); if(btn) removeRaceFromCache(btn.dataset.cacheRemove); });
    const dz=U.$('dropzone'), fi=U.$('fileInput'); fi.addEventListener('change',e=>handleFiles(e.target.files)); ['dragenter','dragover'].forEach(evt=>dz.addEventListener(evt,e=>{e.preventDefault(); dz.classList.add('drag');})); ['dragleave','drop'].forEach(evt=>dz.addEventListener(evt,e=>{e.preventDefault(); dz.classList.remove('drag');})); dz.addEventListener('drop',e=>handleFiles(e.dataTransfer.files));
  }
  function activateTab(id){ U.qsa('.tab').forEach(t=>t.classList.toggle('active',t.dataset.tab===id)); U.qsa('.tabpane').forEach(p=>p.classList.toggle('hidden',p.id!==id)); }
  function syncScopeControls(){
    const isWorld=U.$('scopeMode').value==='world';
    const provinceWrap=U.$('provinceSelectWrap'), settlementWrap=U.$('settlementSelectWrap');
    [provinceWrap, settlementWrap].forEach(w=>{ if(w) w.classList.toggle('scope-blocked', isWorld); });
    U.$('provinceSelect').disabled=isWorld;
    U.$('settlementSelect').disabled=isWorld;
    U.$('provinceSelect').title=isWorld?'Whole world scope ignores province selection and generates across every province.':'';
    U.$('settlementSelect').title=isWorld?'Whole world scope ignores settlement selection and generates across every settlement.':'';
    if(isWorld){
      if(Number(U.$('locationCount').value)<5000) U.$('locationCount').value=5000;
      if(Number(U.$('npcCount').value)<15000) U.$('npcCount').value=15000;
      U.$('controlMeta').textContent='Whole world scope active: province and settlement menus are blocked out. Generation is budgeted across all provinces to prevent browser crashes; cached races receive world-travel access.';
      if((state.raceCache||[]).length) U.$('raceMode').value='cache';
    } else if(U.$('scopeMode').value==='province'){
      if(Number(U.$('locationCount').value)<1200) U.$('locationCount').value=1200;
      if(Number(U.$('npcCount').value)<3500) U.$('npcCount').value=3500;
      U.$('controlMeta').textContent='Whole province scope active: generation is distributed across that province’s settlements with safe browser limits.';
    } else {
      U.$('controlMeta').textContent='Ready. Generate a settlement, province, or world, or import existing files to restore data.';
    }
  }
  function normalizeState(){ if(!state || typeof state!=='object') state=core.defaultState(); if(!Array.isArray(state.raceCache)) state.raceCache=[]; }
  function selectedRaceRecord(){ return core.allRaces.find(r=>r.value===U.$('racePick').value || r.label===U.$('racePick').value); }
  function raceCacheRecord(race){ return race ? {value:race.value, label:race.label, category:race.category, categoryValue:race.categoryValue, creator:race.creator} : null; }
  function addRacesToCache(races, showStatus=true){
    normalizeState();
    const before=state.raceCache.length;
    const byKey=new Map(state.raceCache.map(r=>[r.value||r.label, r]));
    (races||[]).forEach(r=>{ const rec=raceCacheRecord(r); if(rec) byKey.set(rec.value||rec.label, rec); });
    state.raceCache=Array.from(byKey.values()).sort((a,b)=>String(a.label).localeCompare(String(b.label)));
    U.$('raceMode').value='cache';
    renderRaceCache(); saveLocal(false);
    if(showStatus) U.status(`Race cache now has ${state.raceCache.length} race${state.raceCache.length===1?'':'s'} (${state.raceCache.length-before} added).`);
  }
  function addSelectedRaceToCache(){ const race=selectedRaceRecord(); if(!race){ U.status('Choose a race first.'); return; } addRacesToCache([race]); }
  function addCategoryToCache(){ const cat=core.raceCategories.find(c=>c.value===U.$('raceCategory').value) || core.raceCategories[0]; const races=(cat?.races||[]).map(r=>({...r, creator:cat.creator, category:cat.label, categoryValue:cat.value})); addRacesToCache(races); }
  function removeRaceFromCache(value){ normalizeState(); state.raceCache=state.raceCache.filter(r=>(r.value||r.label)!==value); renderRaceCache(); saveLocal(false); U.status('Race removed from cache.'); }
  function clearRaceCache(){ normalizeState(); state.raceCache=[]; renderRaceCache(); saveLocal(false); U.status('Race cache cleared.'); }
  function renderRaceCache(){
    normalizeState();
    const el=U.$('raceCacheList'); if(!el) return;
    if(!state.raceCache.length){ el.innerHTML='No race cache yet. Add races here to build a reusable world-generation pool.'; return; }
    el.innerHTML=`<div class="mini"><b>${state.raceCache.length}</b> cached race${state.raceCache.length===1?'':'s'} available for generation. In Whole world scope, this cache is used automatically and NPCs are tagged for world travel, commuting, visiting, vacationing, and route simulation.</div><div class="cache-chips">${state.raceCache.map(r=>`<span class="cache-chip"><span>${U.escapeHTML(r.label)} <small>${U.escapeHTML(r.category||'')}</small></span><button class="secondary small" type="button" data-cache-remove="${U.escapeHTML(r.value||r.label)}">×</button></span>`).join('')}</div>`;
  }
  function collectConfig(){
    normalizeState();
    const scopeMode=U.$('scopeMode').value;
    const selectedProvince=U.$('provinceSelect').value;
    const selectedSettlement=U.$('settlementSelect').value;
    const ptime=core.getProvinceTime(selectedProvince);
    const isWorld=scopeMode==='world';
    const raceCache=U.clone(state.raceCache||[]);
    const useRaceCache=U.$('raceMode').value==='cache' || (isWorld && raceCache.length>0);
    return core.configFromInputs({scopeMode, generationMode:U.$('generationMode').value, province:isWorld?'Entire World':selectedProvince, settlementName:isWorld?'':selectedSettlement, settlementType:U.$('settlementType').value, biome:U.$('biomeSelect').value, governmentType:U.$('governmentType').value||'Local Civic Council', locationCount:Number(U.$('locationCount').value), npcCount:Number(U.$('npcCount').value), population:Number(U.$('populationInput').value)||0, area:U.$('areaInput').value, timezone:isWorld?'All province time zones':(U.$('timezoneInput').value||ptime.primaryUtc||''), dangerLevel:U.$('dangerLevel').value, alignmentPreference:U.$('alignmentPreference').value, deities:U.$('primaryDeities').value.split(/[,;]+/).map(s=>s.trim()).filter(Boolean), tags:U.$('settlementTags').value.split(/[,;\n]+/).map(s=>s.trim()).filter(Boolean), raceMode:U.$('raceMode').value, raceCategory:U.$('raceCategory').value, racePick:U.$('racePick').value, raceCache, useRaceCache, worldTravelAccess:isWorld?'entireWorld':'scopeLimited', cacheTravelAccess:useRaceCache?'entireWorld':'scopeLimited', includeFivePercent:U.$('includeFivePercent').checked, includeTravelers:U.$('includeTravelers').checked, includeGeojsonPins:U.$('includeGeojsonPins').checked, preserveExisting:U.$('preserveExisting').checked});
  }
  function generate(){ const cfg=collectConfig(); U.$('controlMeta').textContent=`Generating ${cfg.scopeMode} data for ${cfg.scopeMode==='world'?'Belavadös':(cfg.settlementName || cfg.province)}. This may create thousands of persistent records.`; setTimeout(()=>{ state=core.generate(cfg, state); normalizeState(); state.raceCache=cfg.raceCache||state.raceCache||[]; saveLocal(false); renderRaceCache(); syncScopeControls(); window.BelavadosRenderers.renderAll(); U.$('controlMeta').textContent=`Generated ${state.locations.length} locations, ${state.npcs.length} NPCs, ${state.relationships.length} relationships, and ${state.travel.length} travel records.`; U.status('Generation complete.'); }, 20); }
  async function handleFiles(files){ const list=Array.from(files||[]); const fileList=U.$('fileList'); for(const file of list){ const imported=await window.BelavadosImporters.readFile(file); const helpers={provinces:core.assignments.map(p=>p.province), biomes:core.biomes, raceNames:core.allRaces.map(r=>r.label), deities:core.deities}; const scan=window.BelavadosImporters.scanToFields(imported, helpers); applyScan(scan); if(imported.kind==='image'){ state.mapImage={name:imported.name, dataUrl:imported.dataUrl}; } if(imported.data){ mergeData(imported.data, imported.kind); } normalizeState(); state.imports.push({name:imported.name, kind:imported.kind, summary:`Detected ${scan.races.length} races, ${scan.deities.length} deities, ${scan.tags.length} useful tags.`, detectedTags:scan.tags, warnings:imported.warnings||[]}); const pill=document.createElement('div'); pill.className='file-pill'; pill.textContent=`${imported.name} — ${imported.kind}`; fileList.prepend(pill); } saveLocal(false); renderRaceCache(); syncScopeControls(); window.BelavadosRenderers.renderAll(); U.status('Import scan complete.'); }
  function applyScan(scan){ const a=scan.applied||{}; if(a.province){ U.$('provinceSelect').value=a.province; updateSettlementOptions(); } if(a.biome) U.$('biomeSelect').value=a.biome; if(a.settlementType){ U.$('settlementType').value=a.settlementType; updateCountsFromType(); } if(a.dangerLevel) U.$('dangerLevel').value=a.dangerLevel; if(a.population) U.$('populationInput').value=a.population; if(a.area) U.$('areaInput').value=a.area; if(a.timezone) U.$('timezoneInput').value=a.timezone; if(scan.deities?.length) U.$('primaryDeities').value=Array.from(new Set([...U.$('primaryDeities').value.split(/[,;]+/).map(s=>s.trim()).filter(Boolean),...scan.deities])).join(', '); if(scan.tags?.length) U.$('settlementTags').value=Array.from(new Set([...U.$('settlementTags').value.split(/[,;\n]+/).map(s=>s.trim()).filter(Boolean),...scan.tags])).join(', '); if(scan.races?.length){ const scanned=scan.races.map(name=>core.allRaces.find(r=>r.label===name)).filter(Boolean); if(scanned.length) addRacesToCache(scanned, false); const race=scanned[0]; if(race){ U.$('raceCategory').value=race.categoryValue; updateRaceOptions(); U.$('racePick').value=race.value; } } }
  function mergeData(data, kind){
    if(data.schema==='belavados.lifeGeneratorState.v1' || (data.locations && data.npcs && data.relationships)){ state={...core.defaultState(), ...data}; normalizeState(); return; }
    if(kind==='geojson' || data.type==='FeatureCollection'){ state.geojson=data; return; }
    if(Array.isArray(data)){ return; }
    if(data.locations) state.locations=data.locations; if(data.npcs) state.npcs=data.npcs; if(data.relationships) state.relationships=data.relationships; if(data.schedules) state.schedules=data.schedules; if(data.travel) state.travel=data.travel; if(data.raceCache) state.raceCache=data.raceCache; if(data.settings) state.settings={...state.settings,...data.settings};
  }
  function saveLocal(show=true){ try{ normalizeState(); const shallow={...state, mapImage: state.mapImage && state.mapImage.dataUrl?.length>1500000 ? {name:state.mapImage.name, skippedLargeData:true} : state.mapImage}; localStorage.setItem('belavadosLifeGeneratorStateV1', JSON.stringify(shallow)); if(show) U.status('Saved to browser storage.'); }catch(err){ if(show) U.status('Browser storage skipped: '+err.message); } }
  function loadLocal(){ try{ const saved=localStorage.getItem('belavadosLifeGeneratorStateV1'); if(saved){ state={...core.defaultState(), ...JSON.parse(saved)}; normalizeState(); applySettingsToInputs(state.settings||{}); } }catch{} }
  function applySettingsToInputs(s){ if(s.scopeMode) U.$('scopeMode').value=s.scopeMode; if(s.province && s.province!=='Entire World'){ U.$('provinceSelect').value=s.province; updateSettlementOptions(); } if(s.settlementName) U.$('settlementSelect').value=s.settlementName; ['generationMode','settlementType','biome','governmentType','dangerLevel','alignmentPreference','raceMode','raceCategory'].forEach(k=>{ const id={biome:'biomeSelect',governmentType:'governmentType'}[k]||k; const el=U.$(id); if(el && s[k]!=null) el.value=s[k]; }); if(s.raceCategory) updateRaceOptions(); if(s.racePick) U.$('racePick').value=s.racePick; U.$('locationCount').value=s.locationCount||U.$('locationCount').value; U.$('npcCount').value=s.npcCount||U.$('npcCount').value; U.$('populationInput').value=s.population||''; U.$('areaInput').value=s.area||''; U.$('timezoneInput').value=s.timezone && s.timezone!=='All province time zones' ? s.timezone : U.$('timezoneInput').value; U.$('primaryDeities').value=(s.deities||[]).join(', '); U.$('settlementTags').value=(s.tags||[]).join(', '); }
  function clearLocal(){ if(confirm('Clear generated data, race cache, and browser-saved state?')){ localStorage.removeItem('belavadosLifeGeneratorStateV1'); state=core.defaultState(); syncScopeControls(); renderRaceCache(); window.BelavadosRenderers.renderAll(); U.status('Cleared state.'); } }
})();
