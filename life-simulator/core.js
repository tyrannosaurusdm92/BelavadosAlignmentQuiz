
(function(){
  'use strict';
  const LS = window.LifeSim = window.LifeSim || {};
  LS.version = '1.1.0-social-transit-family-tree';
  LS.storageKey = 'belavados.lifeSimulator.state.v2';
  LS.externalOnyxUrl = 'https://tyrannosaurusdm92.github.io/BelavadosAlignmentQuiz/onyx%20chat%20bot/emperor_onyx_rulebot.html';
  LS.$ = (id) => document.getElementById(id);
  LS.$$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  LS.escape = (value='') => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  LS.slug = (value='record') => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’']/g,'').replace(/[^a-zA-Z0-9]+/g,'_').replace(/^_+|_+$/g,'').toLowerCase() || 'record';
  LS.uid = (prefix='id') => `${prefix}_${Math.random().toString(36).slice(2,8)}_${Date.now().toString(36).slice(-5)}`;
  LS.nowIso = () => new Date().toISOString();
  LS.makeBlankState = () => ({config:{}, imports:[], raceCache:[], locations:[], npcs:[], relationships:[], households:[], schedules:[], factions:[], services:[], intrigue:[], validations:[], logs:[], externalLinks:{onyx:LS.externalOnyxUrl}});
  LS.state = LS.makeBlankState();
  LS.normalizeRaceData = (data={}) => {
    const habitatOptions = data.habitatOptions || (data.habitats||[]).map((h,i)=>({value:String(i),label:h}));
    const keyToLabel = Object.fromEntries(habitatOptions.map(h=>[h.value,h.label]));
    const cats = (data.raceCategories||[]).map((cat, idx) => {
      const category = cat.category || cat.label || `Category ${idx+1}`;
      const creator = cat.god || cat.creator || '';
      let options = cat.options || [];
      if(!options.length && Array.isArray(cat.races)){
        options = cat.races.map(r => typeof r === 'string' ? {name:r, type:'race', parent:'', creator, category, habitats:cat.habitats||[], weight:10} : {
          name: r.label || r.name || r.sourceLabel || 'Unknown Race',
          value: r.value || '', type: r.kind || r.type || 'race', parent: (r.sourceLabel && r.sourceLabel !== r.label) ? r.sourceLabel : (r.parent||''), sourceLabel:r.sourceLabel||'',
          creator, category, categoryValue: cat.value || '', description:r.description||'', lore:r.lore||'', pantheonInfluence:r.pantheonInfluence||'', axisReading:r.axisReading||'', typicalPlayTendency:r.typicalPlayTendency||'', canonTraitNames:r.canonTraitNames||'', tableAbilities:r.tableAbilities||'', bestClasses:r.bestClasses||'', dmHook:r.dmHook||'',
          habitatKeys:r.habitats||[], habitats:r.habitatLabels || (r.habitats||[]).map(x=>keyToLabel[x]||x), weight:10
        });
      }
      options = options.map(o => Object.assign({category, creator:o.creator||creator, habitats:[], weight:10}, o));
      const catHabitats = cat.habitats || Array.from(new Set(options.flatMap(o=>o.habitats||[])));
      return Object.assign({}, cat, {id:cat.id||cat.number||idx+1, number:cat.number||cat.id||idx+1, category, label:category, god:creator, creator, options, races:options.map(o=>o.name), habitats:catHabitats});
    });
    const counts = data.counts || {baseCompendiumRaceEntries:data.compendiumBaseRaceEntries||156, raceCategories:cats.length, selectableRaceBloodlineSubgroupOptions:data.selectableRaceBloodlineOptions||cats.reduce((a,c)=>a+c.options.length,0)};
    counts.raceCategories = cats.length;
    counts.selectableRaceBloodlineSubgroupOptions = counts.selectableRaceBloodlineSubgroupOptions || cats.reduce((a,c)=>a+c.options.length,0);
    counts.baseCompendiumRaceEntries = counts.baseCompendiumRaceEntries || data.compendiumBaseRaceEntries || 156;
    return Object.assign({}, data, {habitatOptions, habitats:habitatOptions.map(h=>h.label), raceCategories:cats, counts});
  };
  LS.data = {
    races: LS.normalizeRaceData(window.BELAVADOS_RACE_DROPDOWN || {}),
    locations: window.BELAVADOS_DATA || {}, alignment: window.BELAVADOS_ALIGNMENT_MODEL || {}, time: window.BELAVADOS_TIME_MODEL || {}, rules: window.BELAVADOS_LIVING_WORLD_RULES || {}, assignments: window.BELAVADOS_SETTLEMENT_ASSIGNMENTS || [], content: window.BELAVADOS_CONTENT || {}, factions: window.BELAVADOS_FACTION_RULES || {}, manifest: window.BELAVADOS_MANIFEST || {}
  };
  LS.setStatus = (message, kind='') => { const el=LS.$('controlStatus'); if(el){ el.textContent=message; el.className=`micro notice ${kind}`.trim(); } };
  LS.log = (message, type='info') => { LS.state.logs.unshift({time:LS.nowIso(), type, message}); LS.state.logs=LS.state.logs.slice(0,120); };
  LS.random = function(seedText='') { let seed=2166136261; const input=`${seedText}|${Date.now()}|${Math.random()}`; for(let i=0;i<input.length;i++){ seed^=input.charCodeAt(i); seed=Math.imul(seed,16777619); } return function(){ seed+=0x6D2B79F5; let t=seed; t=Math.imul(t^t>>>15,t|1); t^=t+Math.imul(t^t>>>7,t|61); return ((t^t>>>14)>>>0)/4294967296; }; };
  LS.rng = LS.random('initial');
  LS.choose = (arr, fallback=null) => Array.isArray(arr)&&arr.length ? arr[Math.floor(LS.rng()*arr.length)] : fallback;
  LS.shuffle = (arr=[]) => { const copy=[...arr]; for(let i=copy.length-1;i>0;i--){ const j=Math.floor(LS.rng()*(i+1)); [copy[i],copy[j]]=[copy[j],copy[i]]; } return copy; };
  LS.weightedPick = (items, field='weight') => { if(!items?.length) return null; const total=items.reduce((a,x)=>a+(Number(x[field])||1),0); let roll=LS.rng()*total; for(const item of items){ roll-=Number(item[field])||1; if(roll<=0) return item; } return items[items.length-1]; };
  LS.clamp = (n,min,max) => Math.max(min, Math.min(max, n));
  LS.axisDescriptor = (score) => score < 1000 ? 'extreme low' : score < 1500 ? 'leaning low' : score === 1500 ? 'true neutral' : score < 2000 ? 'leaning high' : 'extreme high';
  LS.snap250 = (value) => Math.round(value/250)*250;
  LS.download = (filename, mime, content) => { const blob=content instanceof Blob?content:new Blob([content],{type:mime}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=filename; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(url); a.remove();},400); };
  LS.targetForSize = (size) => (LS.data.rules.settlementSizeTargets||{})[size] || {locationsDefault:60,npcsDefault:160,worldTravelPercent:3};
  LS.provinceMeta = (province) => (LS.data.time.provinceTimeZones||[]).find(p=>p.province===province) || (LS.data.assignments||[]).find(p=>p.province===province) || null;
  LS.getBiomeStack = () => LS.$$('.biome-row').map(row=>({category:row.querySelector('.biome-category')?.value||'', option:row.querySelector('.biome-option')?.value||''})).filter(b=>b.category&&b.option);
  LS.selectedProvinceAssignment = () => (LS.data.assignments||[]).find(p=>p.province === (LS.$('provinceName')?.value||''));
  LS.updateProvinceTime = () => {
    const prov=LS.$('provinceName')?.value || ''; const meta=LS.provinceMeta(prov); const sel=LS.$('timeZone'); const info=LS.$('provinceTimeInfo');
    const zones = meta?.displayUTCs?.length ? meta.displayUTCs : (meta?.primaryUTC ? [meta.primaryUTC] : ['UTC']);
    if(sel){ sel.innerHTML = zones.map(z=>`<option value="${LS.escape(z)}">${LS.escape(z)}</option>`).join(''); sel.value = meta?.primaryUTC || zones[0] || 'UTC'; }
    if(info){ info.innerHTML = meta ? `<strong>${LS.escape(prov)}</strong>: primary ${LS.escape(meta.primaryUTC||'UTC')}; province display ${LS.escape((meta.displayUTCs||[]).join(', ')||meta.primaryUTC||'UTC')}. ${LS.escape(meta.notes||meta.timeZoneNotes||'Settlement-specific UTC may be refined by longitude.')}` : 'Province UTC data unavailable; using UTC.'; }
  };
  LS.updateSizeTargets = () => {
    const t=LS.targetForSize(LS.$('settlementSize')?.value || 'Village');
    if(LS.$('locationCount')) LS.$('locationCount').value = t.locationsDefault || t.locations || 60;
    if(LS.$('npcCount')) LS.$('npcCount').value = t.npcsDefault || t.npcs || 160;
    const info=LS.$('sizeTargetInfo'); if(info) info.innerHTML = `<strong>Target:</strong> ${(t.locations||t.locationsDefault||0).toLocaleString()} locations, ${(t.npcs||t.npcsDefault||0).toLocaleString()} named NPCs, ${t.worldTravelPercent||0}% world-travel NPCs.`;
  };
  LS.getConfig = () => {
    const tags=(LS.$('tags')?.value||'').split(',').map(x=>x.trim()).filter(Boolean); const deities=(LS.$('primaryDeities')?.value||'').split(',').map(x=>x.trim()).filter(Boolean); const size=LS.$('settlementSize')?.value||'Town'; const target=LS.targetForSize(size); const province=LS.$('provinceName')?.value||'Aelvanyr'; const provMeta=LS.provinceMeta(province);
    return {scope:LS.$('scope')?.value||'Single Settlement', province, provinceTime:provMeta, settlementName:LS.$('settlementName')?.value||'Unnamed Settlement', settlementSize:size, population:Number(LS.$('population')?.value||100), government:LS.$('government')?.value||'Local council', economy:LS.$('economy')?.value||'Mixed guild economy', dangerLevel:LS.$('dangerLevel')?.value||'Moderate', timeZone:LS.$('timeZone')?.value||provMeta?.primaryUTC||'UTC', displayUTCs:provMeta?.displayUTCs||[], primaryDeities:deities, tags, biomeStack:LS.getBiomeStack(), habitatFilter:LS.$('habitatFilter')?.value||'Any / broadly available', raceCategory:LS.$('raceCategory')?.value||'', racePick:LS.$('racePick')?.value||'', raceCache:LS.state.raceCache||[], locationCount:LS.clamp(Number(LS.$('locationCount')?.value||target.locationsDefault||60),1,2500), npcCount:LS.clamp(Number(LS.$('npcCount')?.value||target.npcsDefault||160),1,9000), socialDensity:LS.$('socialDensity')?.value||'standard', householdStyle:LS.$('householdStyle')?.value||'mixed', includePoly:!!LS.$('includePoly')?.checked, includeLayered:!!LS.$('includeLayered')?.checked, seedWord:LS.$('seedWord')?.value||'', targetLocations:target.locations, targetNPCs:target.npcs, worldTravelPercent:target.worldTravelPercent||0, generatedAt:LS.nowIso()};
  };
  LS.saveLocal = () => { try{ localStorage.setItem(LS.storageKey, JSON.stringify(LS.state)); LS.setStatus('Saved to this browser.', 'ok'); LS.log('Saved local browser state.'); } catch(err){ LS.setStatus('Local save failed: '+err.message,'danger'); } };
  LS.loadLocal = () => { try{ const raw=localStorage.getItem(LS.storageKey) || localStorage.getItem('belavados.lifeSimulator.state.v1'); if(!raw) return false; LS.state=Object.assign(LS.makeBlankState(), JSON.parse(raw)); return true; }catch(err){ console.warn(err); return false; } };
  LS.clearState = () => { LS.state=LS.makeBlankState(); try{ localStorage.removeItem(LS.storageKey); }catch(e){} LS.setStatus('Cleared generated data.'); LS.render?.(); };
  LS.populateControls = () => {
    const provinceSelect=LS.$('provinceName'); const assignments=LS.data.assignments||[];
    if(provinceSelect){ provinceSelect.innerHTML=assignments.map(p=>`<option value="${LS.escape(p.province)}">${LS.escape(p.province)} — ${LS.escape(p.primaryUTC||'UTC')}</option>`).join(''); provinceSelect.value=assignments.find(p=>p.province==='Aelvanyr')?'Aelvanyr':assignments[0]?.province||''; provinceSelect.addEventListener('change',()=>{ const prov=LS.selectedProvinceAssignment(); const first=prov?.capital_cities?.[0]||prov?.cities?.[0]||prov?.towns?.[0]||prov?.villages?.[0]; if(first&&LS.$('settlementName')) LS.$('settlementName').value=first; LS.updateProvinceTime(); }); }
    const biomeRows=LS.$('biomeRows'); if(biomeRows){ biomeRows.innerHTML=[0,1,2].map(i=>`<div class="form-grid biome-row"><div><label>Biome ${i+1} Category</label><select class="biome-category"></select></div><div><label>Biome ${i+1} Type</label><select class="biome-option"></select></div></div>`).join(''); const cats=Object.keys(LS.data.rules.biomeTree||{}); LS.$$('.biome-row').forEach((row,i)=>{ const cat=row.querySelector('.biome-category'), opt=row.querySelector('.biome-option'); cat.innerHTML=cats.map(c=>`<option>${LS.escape(c)}</option>`).join(''); cat.value=i===0?'Ocean':i===1?'Forest':'Hybrid'; const fill=()=>{ opt.innerHTML=(LS.data.rules.biomeTree[cat.value]||[]).map(o=>`<option>${LS.escape(o)}</option>`).join(''); }; cat.addEventListener('change',fill); fill(); if(i===0) opt.value='Ocean Surface floating settlement'; if(i===1) opt.value='Deep forest'; if(i===2) opt.value='Beach and reefs with water'; }); }
    const habitat=LS.$('habitatFilter'); if(habitat){ habitat.innerHTML=(LS.data.races.habitats||[]).map(h=>`<option value="${LS.escape(h)}">${LS.escape(h)}</option>`).join(''); }
    const raceCat=LS.$('raceCategory'); if(raceCat){ raceCat.innerHTML=(LS.data.races.raceCategories||[]).map(c=>`<option value="${LS.escape(c.category)}">${LS.escape(c.number||c.id)}. ${LS.escape(c.category)} — ${LS.escape(c.god)}</option>`).join(''); raceCat.addEventListener('change',LS.populateRacePick); }
    habitat?.addEventListener('change',LS.populateRacePick); LS.$('racePick')?.addEventListener('change',LS.renderRacePreview); LS.populateRacePick(); LS.$('settlementSize')?.addEventListener('change',LS.updateSizeTargets); LS.updateProvinceTime(); LS.updateSizeTargets();
  };
  LS.populateRacePick = () => { const raceCat=LS.$('raceCategory')?.value; const habitat=LS.$('habitatFilter')?.value||'Any / broadly available'; const cat=(LS.data.races.raceCategories||[]).find(c=>c.category===raceCat)||(LS.data.races.raceCategories||[])[0]; const opts=(cat?.options||[]).filter(o=>habitat==='Any / broadly available'||(o.habitats||[]).includes(habitat)||(o.habitatKeys||[]).includes(habitat)||(o.habitats||[]).includes('Any / broadly available')); const finalOpts=opts.length?opts:(cat?.options||[]); const select=LS.$('racePick'); if(select){ select.innerHTML=finalOpts.map(o=>`<option value="${LS.escape(o.name)}">${LS.escape(o.name)}${o.parent?` (${LS.escape(o.parent)})`:''}</option>`).join(''); } LS.renderRacePreview(); };
  LS.findRaceOption = (name) => { for(const c of (LS.data.races.raceCategories||[])){ const o=(c.options||[]).find(x=>x.name===name); if(o) return Object.assign({category:c.category, creator:o.creator||c.god}, o); } return null; };
  LS.renderRacePreview = () => { const opt=LS.findRaceOption(LS.$('racePick')?.value); const el=LS.$('racePreview'); if(!el||!opt) return; el.innerHTML=`<strong>${LS.escape(opt.name)}</strong>${opt.parent?` <span class="muted">(${LS.escape(opt.parent)})</span>`:''}<br>Creator: ${LS.escape(opt.creator||'Unknown')} · Type: ${LS.escape(opt.type||'race')}<br>${LS.escape(opt.description||opt.axisReading||'No description available.')}<br><span class="muted">Habitats: ${LS.escape((opt.habitats||[]).join(', ')||'Any')}</span>`; };
  LS.addRaceToCache = () => { const race=LS.$('racePick')?.value; if(!race) return; const existing=LS.state.raceCache.find(r=>r.name===race); if(existing){ existing.weight=Number(LS.$('raceWeight')?.value||existing.weight||10); } else { const opt=LS.findRaceOption(race)||{name:race,category:LS.$('raceCategory')?.value,creator:'Unknown',habitats:[]}; LS.state.raceCache.push({name:opt.name, category:opt.category, parent:opt.parent||'', creator:opt.creator, type:opt.type||'race', description:opt.description||'', axisReading:opt.axisReading||'', habitats:opt.habitats||[], weight:Number(LS.$('raceWeight')?.value||10)}); } LS.renderRaceCache(); LS.setStatus('Race cache updated.', 'ok'); };
  LS.renderRaceCache = () => { const el=LS.$('raceCache'); if(!el) return; if(!LS.state.raceCache.length){ el.innerHTML='<div class="micro notice">Race cache empty. Add unlimited races or the generator will use the full Belavadös weighted mix.</div>'; return; } el.innerHTML=LS.state.raceCache.map((r,i)=>`<div class="cache-row"><span>${LS.escape(r.name)} <small class="muted">${LS.escape(r.creator||'')}</small></span><input data-race-weight="${i}" type="number" min="1" value="${Number(r.weight)||1}" /><button data-remove-race="${i}" class="tiny danger" type="button">Remove</button></div>`).join(''); LS.$$('[data-race-weight]',el).forEach(input=>input.addEventListener('change',e=>{ LS.state.raceCache[Number(e.target.dataset.raceWeight)].weight=Number(e.target.value)||1; })); LS.$$('[data-remove-race]',el).forEach(btn=>btn.addEventListener('click',e=>{ LS.state.raceCache.splice(Number(e.target.dataset.removeRace),1); LS.renderRaceCache(); })); };
  LS.bindCoreEvents = () => { LS.$('addRace')?.addEventListener('click',LS.addRaceToCache); LS.$('generateFull')?.addEventListener('click',LS.generateFull); LS.$('generateLocations')?.addEventListener('click',LS.generateLocationsOnly); LS.$('generateNPCs')?.addEventListener('click',LS.generateNPCsOnly); LS.$('rerollOne')?.addEventListener('click',LS.rerollMissing); LS.$('saveLocal')?.addEventListener('click',LS.saveLocal); LS.$('clearState')?.addEventListener('click',LS.clearState); LS.$('globalFilter')?.addEventListener('input',()=>LS.render?.()); LS.$$('.tab').forEach(btn=>btn.addEventListener('click',()=>{ LS.$$('.tab').forEach(x=>x.classList.remove('active')); btn.classList.add('active'); LS.$$('.tabpane').forEach(p=>p.classList.add('hidden')); LS.$(btn.dataset.tab)?.classList.remove('hidden'); LS.render?.(); })); };
  LS.init = () => { LS.populateControls(); LS.loadLocal(); LS.renderRaceCache(); LS.bindCoreEvents(); LS.initImporter?.(); LS.render?.(); LS.log('App initialized.'); };
  document.addEventListener('DOMContentLoaded', LS.init);
})();
