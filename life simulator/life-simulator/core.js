
(function(){
  'use strict';
  const LS = window.LifeSim = window.LifeSim || {};
  LS.version = '1.0.0-offline-static';
  LS.storageKey = 'belavados.lifeSimulator.state.v1';
  LS.$ = (id) => document.getElementById(id);
  LS.$$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  LS.escape = (value='') => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  LS.slug = (value='record') => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’']/g,'').replace(/[^a-zA-Z0-9]+/g,'_').replace(/^_+|_+$/g,'').toLowerCase() || 'record';
  LS.uid = (prefix='id') => `${prefix}_${Math.random().toString(36).slice(2,8)}_${Date.now().toString(36).slice(-5)}`;
  LS.nowIso = () => new Date().toISOString();
  LS.state = {
    config:{}, imports:[], raceCache:[], locations:[], npcs:[], relationships:[], households:[], schedules:[], factions:[], services:[], intrigue:[], validations:[], onyxMemory:[], logs:[]
  };
  LS.data = {
    races: window.BELAVADOS_RACE_DROPDOWN,
    locations: window.BELAVADOS_DATA,
    alignment: window.BELAVADOS_ALIGNMENT_MODEL,
    time: window.BELAVADOS_TIME_MODEL,
    rules: window.BELAVADOS_LIVING_WORLD_RULES,
    assignments: window.BELAVADOS_SETTLEMENT_ASSIGNMENTS,
    content: window.BELAVADOS_CONTENT,
    factions: window.BELAVADOS_FACTION_RULES,
    manifest: window.BELAVADOS_MANIFEST
  };
  LS.setStatus = (message, kind='') => {
    const el = LS.$('controlStatus');
    if(!el) return;
    el.textContent = message;
    el.className = `micro notice ${kind}`.trim();
  };
  LS.log = (message, type='info') => {
    LS.state.logs.unshift({time:LS.nowIso(), type, message});
    LS.state.logs = LS.state.logs.slice(0,80);
  };
  LS.random = function(seedText=''){
    let seed = 2166136261;
    const input = `${seedText}|${Date.now()}|${Math.random()}`;
    for(let i=0;i<input.length;i++){ seed ^= input.charCodeAt(i); seed = Math.imul(seed, 16777619); }
    return function(){
      seed += 0x6D2B79F5;
      let t = seed;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  };
  LS.rng = LS.random('initial');
  LS.choose = (arr, fallback=null) => Array.isArray(arr) && arr.length ? arr[Math.floor(LS.rng()*arr.length)] : fallback;
  LS.shuffle = (arr) => { const copy=[...arr]; for(let i=copy.length-1;i>0;i--){ const j=Math.floor(LS.rng()*(i+1)); [copy[i],copy[j]]=[copy[j],copy[i]]; } return copy; };
  LS.weightedPick = (items, weightField='weight') => {
    if(!items || !items.length) return null;
    const total = items.reduce((a,x)=>a+(Number(x[weightField])||1),0);
    let roll = LS.rng()*total;
    for(const item of items){ roll -= Number(item[weightField])||1; if(roll <= 0) return item; }
    return items[items.length-1];
  };
  LS.clamp = (n,min,max) => Math.max(min, Math.min(max, n));
  LS.axisDescriptor = (score) => score < 1000 ? 'low' : score < 2000 ? 'neutral' : 'high';
  LS.snap250 = (value) => Math.round(value/250)*250;
  LS.download = (filename, mime, content) => {
    const blob = content instanceof Blob ? content : new Blob([content], {type:mime});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click();
    setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 400);
  };
  LS.getBiomeStack = () => {
    const rows = LS.$$('.biome-row');
    return rows.map(row => ({category: row.querySelector('.biome-category')?.value || '', option: row.querySelector('.biome-option')?.value || ''})).filter(b=>b.category && b.option);
  };
  LS.getConfig = () => {
    const tags = (LS.$('tags')?.value || '').split(',').map(x=>x.trim()).filter(Boolean);
    const deities = (LS.$('primaryDeities')?.value || '').split(',').map(x=>x.trim()).filter(Boolean);
    return {
      scope: LS.$('scope')?.value || 'Single Settlement',
      province: LS.$('provinceName')?.value || 'Aelvanyr',
      settlementName: LS.$('settlementName')?.value || 'Unnamed Settlement',
      settlementSize: LS.$('settlementSize')?.value || 'Town',
      population: Number(LS.$('population')?.value || 100),
      government: LS.$('government')?.value || 'Local council',
      economy: LS.$('economy')?.value || 'Mixed guild economy',
      dangerLevel: LS.$('dangerLevel')?.value || 'Moderate',
      timeZone: LS.$('timeZone')?.value || 'UTC',
      primaryDeities: deities,
      tags,
      biomeStack: LS.getBiomeStack(),
      habitatFilter: LS.$('habitatFilter')?.value || 'Any / broadly available',
      raceCategory: LS.$('raceCategory')?.value || '',
      racePick: LS.$('racePick')?.value || '',
      raceCache: LS.state.raceCache || [],
      locationCount: LS.clamp(Number(LS.$('locationCount')?.value || 30),1,2000),
      npcCount: LS.clamp(Number(LS.$('npcCount')?.value || 80),1,6000),
      socialDensity: LS.$('socialDensity')?.value || 'standard',
      householdStyle: LS.$('householdStyle')?.value || 'mixed',
      includePoly: !!LS.$('includePoly')?.checked,
      includeLayered: !!LS.$('includeLayered')?.checked,
      seedWord: LS.$('seedWord')?.value || '',
      generatedAt: LS.nowIso()
    };
  };
  LS.saveLocal = () => {
    try{ localStorage.setItem(LS.storageKey, JSON.stringify(LS.state)); LS.setStatus('Saved to this browser.', 'ok'); LS.log('Saved local browser state.'); }
    catch(err){ LS.setStatus('Local save failed: ' + err.message, 'danger'); }
  };
  LS.loadLocal = () => {
    try{
      const raw = localStorage.getItem(LS.storageKey);
      if(!raw) return false;
      const parsed = JSON.parse(raw);
      LS.state = Object.assign(LS.state, parsed);
      return true;
    }catch(err){ console.warn(err); return false; }
  };
  LS.clearState = () => {
    LS.state = {config:{}, imports:[], raceCache:[], locations:[], npcs:[], relationships:[], households:[], schedules:[], factions:[], services:[], intrigue:[], validations:[], onyxMemory:[], logs:[]};
    try{ localStorage.removeItem(LS.storageKey); }catch(e){}
    LS.setStatus('Cleared generated data.');
    LS.render?.();
  };
  LS.populateControls = () => {
    const provinceSelect = LS.$('provinceName');
    const assignments = LS.data.assignments || [];
    if(provinceSelect){
      provinceSelect.innerHTML = assignments.map(p=>`<option value="${LS.escape(p.province)}">${LS.escape(p.province)}</option>`).join('');
      provinceSelect.value = assignments.find(p=>p.province==='Aelvanyr') ? 'Aelvanyr' : assignments[0]?.province || '';
      provinceSelect.addEventListener('change', () => {
        const prov = assignments.find(p=>p.province === provinceSelect.value);
        const first = prov?.capital_cities?.[0] || prov?.cities?.[0] || prov?.towns?.[0] || prov?.villages?.[0];
        if(first && LS.$('settlementName')) LS.$('settlementName').value = first;
      });
    }
    const biomeRows = LS.$('biomeRows');
    if(biomeRows){
      biomeRows.innerHTML = [0,1,2].map(i=>`<div class="form-grid biome-row"><div><label>Biome ${i+1} Category</label><select class="biome-category"></select></div><div><label>Biome ${i+1} Type</label><select class="biome-option"></select></div></div>`).join('');
      const categories = Object.keys(LS.data.rules.biomeTree || {});
      LS.$$('.biome-row').forEach((row,i)=>{
        const cat = row.querySelector('.biome-category');
        const opt = row.querySelector('.biome-option');
        cat.innerHTML = categories.map(c=>`<option>${LS.escape(c)}</option>`).join('');
        cat.value = i===0 ? 'Ocean' : i===1 ? 'Forest' : 'Hybrid';
        const fill = () => { opt.innerHTML = (LS.data.rules.biomeTree[cat.value]||[]).map(o=>`<option>${LS.escape(o)}</option>`).join(''); };
        cat.addEventListener('change', fill); fill();
        if(i===0) opt.value='Ocean Surface floating settlement';
        if(i===1) opt.value='Deep forest';
        if(i===2) opt.value='Beach and reefs with water';
      });
    }
    const habitat = LS.$('habitatFilter');
    if(habitat){ habitat.innerHTML = (LS.data.races.habitats||[]).map(h=>`<option>${LS.escape(h)}</option>`).join(''); }
    const raceCat = LS.$('raceCategory');
    if(raceCat){
      raceCat.innerHTML = (LS.data.races.raceCategories||[]).map(c=>`<option value="${LS.escape(c.category)}">${LS.escape(c.category)} — ${LS.escape(c.god)}</option>`).join('');
      raceCat.addEventListener('change', LS.populateRacePick);
    }
    habitat?.addEventListener('change', LS.populateRacePick);
    LS.$('racePick')?.addEventListener('change', LS.renderRacePreview);
    LS.populateRacePick();
    const targets = LS.data.rules.settlementSizeTargets || {};
    LS.$('settlementSize')?.addEventListener('change', () => {
      const t = targets[LS.$('settlementSize').value];
      if(t){ LS.$('locationCount').value = t.locationsDefault; LS.$('npcCount').value = t.npcsDefault; }
    });
  };
  LS.populateRacePick = () => {
    const raceCat = LS.$('raceCategory')?.value;
    const habitat = LS.$('habitatFilter')?.value || 'Any / broadly available';
    const cat = (LS.data.races.raceCategories||[]).find(c=>c.category === raceCat) || (LS.data.races.raceCategories||[])[0];
    const opts = (cat?.options || []).filter(o => habitat === 'Any / broadly available' || (o.habitats||[]).includes(habitat) || (o.habitats||[]).includes('Any / broadly available'));
    const finalOpts = opts.length ? opts : (cat?.options || []);
    const select = LS.$('racePick');
    if(select){ select.innerHTML = finalOpts.map(o=>`<option value="${LS.escape(o.name)}">${LS.escape(o.name)}${o.parent?` (${LS.escape(o.parent)})`:''}</option>`).join(''); }
    LS.renderRacePreview();
  };
  LS.findRaceOption = (name) => {
    for(const c of (LS.data.races.raceCategories||[])){
      const o = (c.options||[]).find(x=>x.name===name);
      if(o) return Object.assign({category:c.category}, o);
    }
    return null;
  };
  LS.renderRacePreview = () => {
    const pick = LS.$('racePick')?.value;
    const opt = LS.findRaceOption(pick);
    const el = LS.$('racePreview');
    if(!el || !opt) return;
    el.innerHTML = `<strong>${LS.escape(opt.name)}</strong><br>${LS.escape(opt.type)}${opt.parent?` of ${LS.escape(opt.parent)}`:''}. Creator: ${LS.escape(opt.creator)}.<br><span class="muted">Habitats: ${(opt.habitats||[]).map(LS.escape).join(', ')}</span>`;
  };
  LS.addRaceCache = () => {
    const race = LS.$('racePick')?.value;
    if(!race) return;
    const existing = LS.state.raceCache.find(r=>r.name===race);
    if(existing){ existing.weight = Number(LS.$('raceWeight')?.value || existing.weight || 10); }
    else{
      const opt = LS.findRaceOption(race) || {name:race, category:LS.$('raceCategory')?.value, creator:'Unknown', habitats:[]};
      LS.state.raceCache.push({name:opt.name, category:opt.category, parent:opt.parent||'', creator:opt.creator, habitats:opt.habitats||[], weight:Number(LS.$('raceWeight')?.value || 10)});
    }
    LS.renderRaceCache();
  };
  LS.renderRaceCache = () => {
    const el = LS.$('raceCache');
    if(!el) return;
    if(!LS.state.raceCache.length){ el.innerHTML = '<div class="micro notice">Race cache empty. Add races or the generator will use the full Belavadös weighted mix.</div>'; return; }
    el.innerHTML = LS.state.raceCache.map((r,i)=>`<div class="cache-row"><span>${LS.escape(r.name)} <small class="muted">${LS.escape(r.creator||'')}</small></span><input data-race-weight="${i}" type="number" min="1" value="${Number(r.weight)||1}" /><button data-remove-race="${i}" class="tiny danger" type="button">Remove</button></div>`).join('');
    LS.$$('[data-race-weight]', el).forEach(input=>input.addEventListener('change', e=>{ LS.state.raceCache[Number(e.target.dataset.raceWeight)].weight = Number(e.target.value)||1; }));
    LS.$$('[data-remove-race]', el).forEach(btn=>btn.addEventListener('click', e=>{ LS.state.raceCache.splice(Number(e.target.dataset.removeRace),1); LS.renderRaceCache(); }));
  };
  LS.bindCoreEvents = () => {
    LS.$('addRace')?.addEventListener('click', LS.addRaceCache);
    LS.$('saveLocal')?.addEventListener('click', LS.saveLocal);
    LS.$('clearState')?.addEventListener('click', LS.clearState);
    LS.$('generateFull')?.addEventListener('click', () => LS.generateFull?.());
    LS.$('generateLocations')?.addEventListener('click', () => LS.generateLocationsOnly?.());
    LS.$('generateNPCs')?.addEventListener('click', () => LS.generateNPCsOnly?.());
    LS.$('rerollOne')?.addEventListener('click', () => LS.rerollMissing?.());
    LS.$('globalFilter')?.addEventListener('input', () => LS.render?.());
    LS.$$('.tab').forEach(btn=>btn.addEventListener('click', () => {
      LS.$$('.tab').forEach(x=>x.classList.remove('active')); btn.classList.add('active');
      LS.$$('.tabpane').forEach(p=>p.classList.add('hidden'));
      LS.$(btn.dataset.tab)?.classList.remove('hidden');
      LS.render?.();
    }));
  };
  LS.init = () => {
    LS.populateControls();
    LS.loadLocal();
    LS.renderRaceCache();
    LS.bindCoreEvents();
    LS.initImporter?.();
    LS.initOnyx?.();
    LS.render?.();
    LS.log('App initialized.');
  };
  document.addEventListener('DOMContentLoaded', LS.init);
})();
