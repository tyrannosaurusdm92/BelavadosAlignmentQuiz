
(function(){
  'use strict';
  const LS = window.LifeSim;
  const e = LS.escape;
  const includesQ = (obj,q) => !q || JSON.stringify(obj).toLowerCase().includes(q);
  const chips = (arr, cls='') => (arr||[]).map(x=>`<span class="tag ${cls}">${e(x)}</span>`).join('');
  LS.activeTab = () => document.querySelector('.tab.active')?.dataset.tab || 'dashboard';
  LS.render = () => {
    LS.renderRaceCache?.();
    const q = (LS.$('globalFilter')?.value || '').toLowerCase();
    const s = LS.state;
    LS.$('resultCount').textContent = `${s.locations?.length||0} locations, ${s.npcs?.length||0} NPCs, ${s.relationships?.length||0} relationship records, ${s.factions?.length||0} factions.`;
    LS.renderDashboard(q); LS.renderImports(q); LS.renderLocations(q); LS.renderNPCs(q); LS.renderRelationships(q); LS.renderHouseholds(q); LS.renderFactions(q); LS.renderServices(q); LS.renderSchedules(q); LS.renderEditor(); LS.renderExport(); LS.renderOnyx(); LS.renderTesting();
    const json = LS.$('json'); if(json) json.textContent = JSON.stringify(s,null,2);
  };
  LS.renderDashboard = (q='') => {
    const s = LS.state, c = s.config || {};
    const warnings = s.validations || [];
    const axes = LS.data.alignment.axes || [];
    const raceCounts = {}; (s.npcs||[]).forEach(n=>raceCounts[n.race]=(raceCounts[n.race]||0)+1);
    const topRaces = Object.entries(raceCounts).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([k,v])=>`${k}: ${v}`);
    LS.$('dashboard').innerHTML = `<div class="statline"><div class="stat"><b>${e(c.settlementName||'No settlement')}</b><br>Settlement</div><div class="stat"><b>${s.locations?.length||0}</b><br>Locations</div><div class="stat"><b>${s.npcs?.length||0}</b><br>NPCs</div><div class="stat"><b>${s.households?.length||0}</b><br>Households</div><div class="stat"><b>${s.factions?.length||0}</b><br>Factions</div><div class="stat"><b>${s.services?.length||0}</b><br>Services</div></div>
    <div class="cards"><div class="card"><h3>Current Setup</h3><p class="muted">${e(c.settlementSize||'Choose settings')} in ${e(c.province||'province')}. Government: ${e(c.government||'')}. Economy: ${e(c.economy||'')}. Danger: ${e(c.dangerLevel||'')}.</p><div class="tags">${(c.biomeStack||[]).map(b=>`<span class="tag cyan">${e(b.category)} / ${e(b.option)}</span>`).join('')}</div></div>
    <div class="card"><h3>Top Race Results</h3><div class="tags">${chips(topRaces,'violet') || '<span class="muted">Generate NPCs to see race counts.</span>'}</div></div>
    <div class="card"><h3>Alignment Model</h3>${axes.map(a=>`<div class="box"><strong>${e(a.label)}</strong> ${a.min}–${a.max}, neutral ${a.neutral}, step ${a.step}<div class="axisbar"><i style="left:${(a.neutral/a.max)*100}%"></i></div></div>`).join('')}</div>
    <div class="card"><h3>Validation</h3>${warnings.length ? warnings.slice(0,12).map(w=>`<div class="notice ${w.level==='warning'?'danger':w.level==='info'?'':'ok'}">${e(w.message)}</div>`).join('') : '<div class="notice ok">No validation warnings yet.</div>'}</div></div>`;
  };
  LS.renderImports = () => {
    const rows = (LS.state.imports||[]).map(f=>`<tr><td>${e(f.name)}</td><td>${e(f.status)}</td><td>${Math.round((f.size||0)/1024)} KB</td><td>${Object.entries(f.findings||{}).map(([k,v])=>v?.length?`${e(k)}: ${e(v.slice(0,6).join(', '))}`:'').filter(Boolean).join('<br>')}</td><td>${(f.errors||[]).map(e).join('<br>')}</td></tr>`).join('');
    LS.$('imports').innerHTML = `<div id="dropzone" class="dropzone"><h3>Drag and drop source files here</h3><p>Accepts JSON, HTML, TXT, CSV, Markdown, ZIP, DOCX, PDF, and reference images. Text and JSON are scanned directly. Binary files are cataloged safely and fail gracefully in static mode.</p><input id="fileInput" type="file" multiple /></div><div class="divider"></div><div class="table-wrap"><table><tr><th>File</th><th>Status</th><th>Size</th><th>Findings</th><th>Notes</th></tr>${rows || '<tr><td colspan="5">No imports yet.</td></tr>'}</table></div>`;
    LS.bindImporterEvents?.();
  };
  LS.renderLocations = (q='') => {
    const locs = (LS.state.locations||[]).filter(x=>includesQ(x,q));
    LS.$('locations').innerHTML = `<div class="cards wide">${locs.map(l=>`<article class="card"><h3>${e(l.name)}<small>${e(l.category)} • ${e(l.type)} • ${e(l.district)}</small></h3><div class="tags"><span class="tag cyan">${e(l.biome?.option||'mixed')}</span><span class="tag">${e(l.ownership)}</span><span class="tag ${l.validationNote?'danger':'ok'}">${l.validationNote?'check':'valid'}</span></div><p class="muted">${e(l.description)}</p><div class="box"><strong>Services</strong><ul class="clean">${(l.services||[]).slice(0,5).map(s=>`<li>${e(s.item)} — ${e(s.price)}</li>`).join('')}</ul></div><div class="box"><strong>Hook</strong><br>${e(l.plotHook)}<br><span class="muted">Rumor: ${e(l.rumor)}</span></div></article>`).join('') || '<div class="notice">Generate locations to fill this section.</div>'}</div>`;
  };
  LS.renderNPCs = (q='') => {
    const npcs = (LS.state.npcs||[]).filter(x=>includesQ(x,q));
    LS.$('npcs').innerHTML = `<div class="cards wide">${npcs.map(n=>`<article class="card"><h3>${e(n.name)}<small>${e(n.race)} • ${e(n.genderIdentity)} (${e(n.pronouns)}) • ${e(n.lifeStage)}</small></h3><div class="tags">${(n.traits||[]).map(t=>`<span class="tag">${e(t)}</span>`).join('')}<span class="tag cyan">${e(n.profession)}</span></div><p class="muted">${e(n.biography)}</p><div class="box"><strong>Home / Work</strong><br>${e(n.residence)}<br>${e(n.workplaceRole)} ${e(n.profession)} at ${e(n.workplace)}</div><div class="box"><strong>Alignment</strong>${Object.values(n.alignment?.axes||{}).map(a=>`<div>${e(a.label)} ${a.score} — ${e(a.descriptor)}<div class="axisbar"><i style="left:${(a.score/3000)*100}%"></i></div></div>`).join('')}</div><div class="box"><strong>Secret</strong> ${e(n.secret)}</div></article>`).join('') || '<div class="notice">Generate NPCs to fill this section.</div>'}</div>`;
  };
  LS.renderRelationships = (q='') => {
    const rels = (LS.state.relationships||[]).filter(x=>includesQ(x,q)).slice(0,900);
    LS.$('relationships').innerHTML = `<div class="cards wide">${rels.map(r=>`<article class="card"><h3>${e(r.fromName)} → ${e(r.toName)}<small>${e(r.category)} • ${e(r.type)}</small></h3><p class="muted">${e(r.history)}</p></article>`).join('') || '<div class="notice">Generate relationships to fill this section.</div>'}</div>${(LS.state.relationships||[]).length>900?'<p class="muted">Showing first 900 matching relationship records. Export JSON for the full network.</p>':''}`;
  };
  LS.renderHouseholds = (q='') => {
    const hhs = (LS.state.households||[]).filter(x=>includesQ(x,q));
    LS.$('households').innerHTML = `<div class="cards wide">${hhs.map(h=>`<article class="card"><h3>${e(h.name)}<small>${e(h.residenceName)} • ${e(h.style)}</small></h3><p class="muted">${e(h.dynamic)}</p><div class="tags">${(h.members||[]).map(m=>`<span class="tag cyan">${e(m.name)} — ${e(m.role)}</span>`).join('')}</div><div class="box"><strong>Household Secret</strong> ${e(h.secret)}</div></article>`).join('') || '<div class="notice">Generate households to fill this section.</div>'}</div>`;
  };
  LS.renderFactions = (q='') => {
    const factions = (LS.state.factions||[]).filter(x=>includesQ(x,q));
    LS.$('factions').innerHTML = `<div class="cards wide">${factions.map(f=>`<article class="card"><h3>${e(f.name)}<small>${e(f.scope)} • Patron ${e(f.patron)} • Standing ${e(f.standing)}</small></h3><div class="tags"><span class="tag cyan">Leader: ${e(f.leader)}</span><span class="tag danger">Rival: ${e(f.rival)}</span><span class="tag">${e(f.alignmentTest)}</span></div><p class="muted">${e(f.function)}</p><div class="box"><strong>Quest Hook</strong><br>${e(f.questHook)}</div></article>`).join('') || '<div class="notice">Generate factions to fill this section.</div>'}</div>`;
  };
  LS.renderServices = (q='') => {
    const services = (LS.state.services||[]).filter(x=>includesQ(x,q)).slice(0,1200);
    LS.$('services').innerHTML = `<div class="table-wrap"><table><tr><th>Location</th><th>Category</th><th>Item / Service</th><th>Price</th><th>Use</th></tr>${services.map(s=>`<tr><td>${e(s.locationName)}</td><td>${e(s.category)}</td><td>${e(s.item)}</td><td>${e(s.price)}</td><td>${e(s.use)}</td></tr>`).join('') || '<tr><td colspan="5">Generate locations to fill services.</td></tr>'}</table></div>`;
  };
  LS.renderSchedules = (q='') => {
    const schedules = (LS.state.schedules||[]).filter(x=>includesQ(x,q)).slice(0,200);
    LS.$('schedules').innerHTML = `<div class="cards wide">${schedules.map(sc=>`<article class="card"><h3>${e(sc.npcName)}<small>${e(sc.timezone)}</small></h3><ul class="clean">${(sc.weekly||[]).slice(0,7).map(d=>`<li><strong>${e(d.day)}:</strong> ${e(d.morning)} / ${e(d.midday)} / ${e(d.evening)} / ${e(d.night)}</li>`).join('')}</ul></article>`).join('') || '<div class="notice">Generate schedules to fill this section.</div>'}</div>`;
  };
  LS.renderEditor = () => {
    LS.$('editor').innerHTML = `<div class="notice">Edit the generated JSON directly, then apply it. This preserves your manual changes and feeds exports.</div><textarea id="jsonEditor" class="json-editor">${e(JSON.stringify(LS.state,null,2))}</textarea><div class="module-actions"><button id="applyJsonEdit" class="gold" type="button">Apply JSON Edits</button><button id="refreshEditor" class="secondary" type="button">Refresh Editor</button></div>`;
    LS.$('applyJsonEdit')?.addEventListener('click',()=>{ try{ LS.state=JSON.parse(LS.$('jsonEditor').value); LS.state.validations=LS.validateState?.()||[]; LS.saveLocal(); LS.render(); LS.setStatus('JSON edits applied.', 'ok'); }catch(err){ LS.setStatus('JSON edit failed: '+err.message, 'danger'); }});
    LS.$('refreshEditor')?.addEventListener('click',()=>LS.render());
  };
  LS.renderExport = () => {
    LS.$('export').innerHTML = `<div class="cards"><div class="card"><h3>JSON Export</h3><p class="muted">Preserves settlement, province, biomes, race cache, NPCs, locations, relationships, households, schedules, services, factions, intrigue, time, alignment, imports, and Onyx memory.</p><button id="exportJsonBtn" class="gold">Download JSON</button></div><div class="card"><h3>HTML Export</h3><p class="muted">Creates a readable campaign page with overview, directories, relationships, factions, intrigue, schedules, and Onyx notes.</p><button id="exportHtmlBtn" class="gold">Download HTML</button></div><div class="card"><h3>DOCX Export</h3><p class="muted">Creates a minimal real DOCX campaign document with overview, tables-as-paragraphs, hooks, and DM notes. Complex formatting is intentionally simple for compatibility.</p><button id="exportDocxBtn" class="gold">Download DOCX</button></div></div>`;
    LS.$('exportJsonBtn')?.addEventListener('click', LS.exportState); LS.$('exportHtmlBtn')?.addEventListener('click', LS.exportHTML); LS.$('exportDocxBtn')?.addEventListener('click', LS.exportDOCX);
  };
  LS.renderOnyx = () => {
    const pane = LS.$('onyx'); if(!pane) return;
    pane.innerHTML = `<div class="onyx-shell"><div class="onyx-portrait"><img src="${e(LS.onyxMoodPath?.()||'assets/onyx-moods/onyx_thinking.png')}" alt="Emperor Onyx mood portrait"><div class="tags"><span class="tag cyan">${e(LS.onyx?.mood||'thinking')}</span><span class="tag">green plaid bowtie</span></div></div><div><div id="chatLog" class="chat-log">${(LS.onyx?.log||[]).map(m=>`<div class="msg ${m.who==='user'?'user':'onyx'}"><span>${e(m.text).replace(/\n/g,'<br>')}</span></div>`).join('')}</div><div class="chat-input"><input id="onyxInput" placeholder="Try .help, .roll d20+5, .biomecheck, .npc, .quest, .comfort..." /><button id="onyxSend" class="gold">Ask Onyx</button></div></div></div>`;
    const log = LS.$('chatLog'); if(log) log.scrollTop = log.scrollHeight;
    const send = () => { const input=LS.$('onyxInput'); const v=input?.value||''; if(input) input.value=''; LS.runOnyxCommand?.(v); };
    LS.$('onyxSend')?.addEventListener('click', send); LS.$('onyxInput')?.addEventListener('keydown', e=>{ if(e.key==='Enter') send(); });
  };
  LS.renderTesting = () => {
    LS.$('testing').innerHTML = `<div class="cards"><div class="card"><h3>Validation Tests</h3><p class="muted">Checks dropdown data, generation state, import/export readiness, required living-sim sections, and no map-pin workflow.</p><button id="runTests" class="gold">Run Browser Smoke Tests</button><div id="testResults" class="box"></div></div><div class="card"><h3>Source Data Counts</h3><ul class="clean"><li>Race categories: ${e(LS.data.races.counts.raceCategories)}</li><li>Base race entries: ${e(LS.data.races.counts.baseCompendiumRaceEntries)}</li><li>Selectable race/bloodline/subgroup options: ${e(LS.data.races.counts.selectableRaceBloodlineSubgroupOptions)}</li><li>Location pools: ${e(LS.data.content.sourceSummary.locationPools)}</li><li>Service items: ${e(LS.data.content.sourceSummary.serviceItems)}</li><li>Province assignments: ${e(LS.data.content.sourceSummary.provinceAssignments)}</li></ul></div></div>`;
    LS.$('runTests')?.addEventListener('click',()=>{
      const tests = [
        ['22 race categories loaded', (LS.data.races.raceCategories||[]).length===22],
        ['182 selectable race options loaded', LS.data.races.counts.selectableRaceBloodlineSubgroupOptions===182],
        ['Biome dropdown has five main categories', Object.keys(LS.data.rules.biomeTree||{}).length===5],
        ['No map-pin workflow enabled', LS.data.manifest.mapPinWorkflowIncluded===false],
        ['JSON export function available', typeof LS.exportState==='function'],
        ['HTML export function available', typeof LS.exportHTML==='function'],
        ['DOCX export function available', typeof LS.exportDOCX==='function'],
        ['Emperor Onyx command parser available', typeof LS.runOnyxCommand==='function'],
        ['Generated locations valid', !LS.state.locations?.length || LS.state.locations.every(l=>l.id&&l.name&&l.category)],
        ['Generated NPCs valid', !LS.state.npcs?.length || LS.state.npcs.every(n=>n.id&&n.name&&n.genderIdentity&&n.pronouns&&n.alignment)]
      ];
      const html = tests.map(([name,pass])=>`<div class="notice ${pass?'ok':'danger'}">${pass?'PASS':'FAIL'} — ${e(name)}</div>`).join('');
      LS.$('testResults').innerHTML = html;
    });
  };
})();
