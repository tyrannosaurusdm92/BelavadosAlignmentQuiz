(function(){
  'use strict';

  const DATA = window.EMPEROR_ONYX_RULEBOT_DATA || {};
  const TOOLS = window.ONYX_TOOLS_DATA || {};
  const Bot = window.BelavadosRuleBot;
  const STORAGE_KEY = 'emperorOnyxRuleBot.memory.v1';
  const WORKBENCH_KEY = 'emperorOnyxRuleBot.workbench.v1';
  const SESSION_KEY = 'emperorOnyxRuleBot.session.v1';

const MOOD_IMAGES = {
  thinking:'assets/onyx-moods/onyx_thinking.png',
  judgmental:'assets/onyx-moods/onyx_judgmental.png',
  thoughtful:'assets/onyx-moods/onyx_thoughtful.png',
  sleepy:'assets/onyx-moods/onyx_sleepy.png',
  hungry:'assets/onyx-moods/onyx_hungry.png'
};
const MOOD_META = {
  thinking:{ label:'Thinking', note:'Void boy genius is thinking through the request.' },
  judgmental:{ label:'Judgmental', note:'Onyx is quietly judging the plan, lovingly, as your best friend.' },
  thoughtful:{ label:'Thoughtful', note:'Onyx is considering how to protect the story and Papa at the same time.' },
  sleepy:{ label:'Sleepy', note:'Onyx is melting off the side of the furniture in service-animal standby mode.' },
  hungry:{ label:'Hungry', note:'Lord Onyx Blepman requires wet-food diplomacy immediately.' }
};
const moodState = {
  current:'judgmental',
  activity:'idle',
  note:MOOD_META.judgmental.note,
  panels:[],
  attached:false,
  responseTimer:null,
  idleTimer:null,
  sleepyTimer:null,
  hungryTimer:null,
  lastActivity:0
};

  const defaults = {
    prefix: DATA.defaultPrefix || '.',
    modifiers: { level: 1 },
    quickrolls: {
      perception: 'd20+wis+level',
      initiative: 'd20+dex',
      attack: 'd20+str',
      damage: 'd8+str'
    },
    tasks: [],
    reminders: [],
    lore: {},
    polls: [],
    parsedFiles: [],
    settings: {
      verboseDice: false,
      personaLevel: 'high',
      dmHash: DATA.siteModes?.dmHash || '#dm-editor'
    }
  };

  const state = {
    open: false,
    tab: 'chat',
    memory: loadMemory(),
    timers: new Map(),
    root: null,
    shell: null,
    body: null,
    input: null,
    importer: null,
    lore: Bot ? Bot.normalizeLore(window.BELAVADOS_LORE_SEED || {}) : (window.BELAVADOS_LORE_SEED || {}),
    workbench: loadWorkbench()
  };

  function loadMemory(){
    try { return combineDeep(clone(defaults), JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')); }
    catch(err){ console.warn('Emperor Onyx memory load failed', err); return clone(defaults); }
  }
  function loadWorkbench(){
    try { return Object.assign({ current:null, history:[], npcCap:350, playerSafe:false }, JSON.parse(localStorage.getItem(WORKBENCH_KEY) || '{}')); }
    catch(err){ console.warn('Emperor Onyx workbench load failed', err); return { current:null, history:[], npcCap:350, playerSafe:false }; }
  }
  function saveMemory(){
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.memory)); } catch(err){ console.warn('Onyx memory save failed', err); }
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify({ lastOpen: state.open, tab: state.tab })); } catch {}
  }
  function saveWorkbench(silent){
    try { localStorage.setItem(WORKBENCH_KEY, JSON.stringify(state.workbench)); } catch(err){ console.warn('Onyx workbench save failed', err); }
    if(!silent) pageBot('Saved current Emperor Onyx RuleBot state locally. I have sat on it for safekeeping.');
  }
  function combineDeep(target, source){
    if(!source || typeof source !== 'object') return target;
    for(const [key,value] of Object.entries(source)){
      if(value && typeof value === 'object' && !Array.isArray(value)) target[key] = combineDeep(target[key] || {}, value);
      else target[key] = value;
    }
    return target;
  }
  function clone(obj){ return (typeof structuredClone === 'function') ? structuredClone(obj) : JSON.parse(JSON.stringify(obj)); }
  function h(tag, attrs={}, children=[]){
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([key,value]) => {
      if(key === 'class') el.className = value;
      else if(key === 'text') el.textContent = value;
      else if(key === 'html') el.innerHTML = value;
      else if(key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2), value);
      else if(value !== undefined && value !== null) el.setAttribute(key, String(value));
    });
    for(const child of Array.isArray(children) ? children : [children]){
      if(child === undefined || child === null) continue;
      el.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
    }
    return el;
  }
  function $(id){ return document.getElementById(id); }
  function escapeHtml(value){ return String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch])); }
  function pick(arr){ arr = Array.isArray(arr) ? arr : []; return arr.length ? arr[Math.floor(Math.random()*arr.length)] : ''; }
  function grumble(){ return pick(DATA.persona?.grumbles || ['Hmph.']); }
  function signoff(){ return pick(DATA.persona?.signoffs || ['Done.']); }
  function titleCase(s){ return String(s || '').replace(/[_-]+/g,' ').replace(/\w\S*/g, t => t[0].toUpperCase() + t.slice(1)); }
  function safeArray(v){ return Array.isArray(v) ? v : []; }
  function safeClone(obj){ return JSON.parse(JSON.stringify(obj)); }
  function slugify(value){
    if(Bot?.utils?.slugify) return Bot.utils.slugify(value);
    return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’']/g,'').replace(/[^a-zA-Z0-9]+/g,'_').replace(/^_+|_+$/g,'').toLowerCase() || 'item';
  }

  function init(){
    setupWorkbench();
    initWidget();
    initializeOnyxMoodSystem();
    hydrateReminders();
    renderWorkbench();
  }

  function setupWorkbench(){
    if(!$('commandInput')) return;
    bindTabs();
    populateSelects();
    const bind = (id, event, fn) => { const el=$(id); if(el) el.addEventListener(event, fn); };
    bind('sendCommand','click', submitWorkbenchCommand);
    bind('commandInput','keydown', e => { if(e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submitWorkbenchCommand(); });
    bind('exampleOne','click', () => setExample('create a high danger deep cavern mining town in Drakmorren named Coalveil with train and regulated portal, population 4200'));
    bind('exampleTwo','click', () => setExample('generate 40 NPCs for this settlement'));
    bind('exampleThree','click', () => setExample('generate province Aelvanyr with 3 villages 2 towns 1 city'));
    bind('quickSettlement','click', generateFromForm);
    bind('quickNPCs','click', () => runWorkbenchCommand(`generate ${$('npcCount')?.value || 25} NPCs for this settlement`, true));
    bind('quickProvince','click', generateProvinceFromForm);
    bind('saveLocal','click', () => saveWorkbench(false));
    bind('loadLocal','click', () => { state.workbench = loadWorkbench(); renderWorkbench(); pageBot('Loaded local Onyx RuleBot state. It smells faintly of JSON.'); });
    bind('clearCurrent','click', () => { state.workbench.current = null; state.workbench.history = []; renderWorkbench(); saveWorkbench(true); pageBot('Current generated data cleared. Lore tables remain loaded, because I am not reckless.'); });
    bind('exportJson','click', exportCurrentJson);
    bind('exportPlayerJson','click', exportPlayerJson);
    bind('exportHtml','click', exportSettlementHtml);
    bind('copyJson','click', copyCurrentJson);
    bind('importFile','change', handleImportFile);
    bind('loreFile','change', handleLoreFile);
    bind('npcCap','input', e => { state.workbench.npcCap = Number(e.target.value || 350); updateStats(); saveWorkbench(true); });
    bind('playerSafeToggle','change', e => { state.workbench.playerSafe = e.target.value === 'safe'; renderWorkbench(); saveWorkbench(true); });
    bind('quickQuestHelp','click', () => { showMainTab('tab-quests'); renderQuestHelp(); });
    bind('quickEncounterHelp','click', () => { showMainTab('tab-encounters'); renderEncounterHelp(); });
    bind('quickDmTip','click', () => { showMainTab('tab-dm-tools'); renderDmTip('pacing'); });
    bind('quickRollD20','click', () => { showMainTab('tab-dice'); panelQuickRoll('1d20'); });
    bind('generateQuestHelp','click', renderQuestHelp);
    bind('copyQuestHelp','click', () => copyElementText('questOutput'));
    bind('generateEncounterHelp','click', renderEncounterHelp);
    bind('copyEncounterHelp','click', () => copyElementText('encounterOutput'));
    bind('parseFilesButton','click', () => parseFilesFromInput());
    bind('parseFilesInput','change', () => parseFilesFromInput());
    bind('clearParsedFiles','click', () => { state.memory.parsedFiles = []; saveMemory(); renderParsedFiles(); pageBot('Parsed notes cleared. I pushed the scraps off the desk.'); });
    bind('rollSelectedDicePanel','click', rollSelectedDicePanel);
    bind('clearRollLogPanel','click', () => { const log = $('rollLogPanel'); if(log) log.innerHTML=''; });
    bind('dmTipPacing','click', () => renderDmTip('pacing'));
    bind('dmTipClues','click', () => renderDmTip('clues'));
    bind('dmTipFaction','click', () => renderDmTip('faction'));
    bind('dmTipBiome','click', () => renderDmTip('biome'));
    bind('dmTipChecklist','click', () => renderDmTip('checklist'));
    setupBiomeSlots();
    setupDicePanel();
    renderParsedFiles();
    renderEncounterIndexPreview();

    const dropzone = $('dropzone');
    if(dropzone){
      ['dragenter','dragover'].forEach(evt => dropzone.addEventListener(evt, e => { e.preventDefault(); dropzone.classList.add('drag'); }));
      ['dragleave','drop'].forEach(evt => dropzone.addEventListener(evt, e => { e.preventDefault(); dropzone.classList.remove('drag'); }));
      dropzone.addEventListener('drop', e => {
        const files = [...(e.dataTransfer.files || [])];
        if(!files.length) return;
        if(files.length === 1 && /\.json$/i.test(files[0].name)) readJsonFile(files[0], processImportedJson);
        else parseCampaignFiles(files);
      });
    }

    pageBot(`${DATA.botName || 'Emperor Onyx'} online. I am a black cat in a green plaid bowtie, armed with RuleBot tools, quest help, encounter brains, file parsing, DM tips, and dice. Type help, generate a settlement, or press one of the example buttons.`);
  }
  function bindTabs(){
    document.querySelectorAll('.tab').forEach(btn => btn.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const panel = $(btn.dataset.tab);
      if(panel) panel.classList.add('active');
    }));
  }
  function populateSelects(){
    if(!$('province')) return;
    fillSelect($('province'), safeArray(state.lore.provinces).map(p => p.name || p), 'name');
    fillSelect($('biome'), flatBiomeNames().length ? flatBiomeNames() : safeArray(state.lore.biomes).map(b => b.name || b), 'name');
    fillSelect($('type'), ['village','town','city','capital']);
    fillSelect($('danger'), state.lore.dangerLevels || ['safe','low','moderate','high','severe','cursed']);
    fillSelect($('transport'), state.lore.worldRules?.transport || ['caravan','train','ferry','steamship','skyship','regulated portal']);
    fillSelect($('economy'), state.lore.economyTags || ['trade','farming','mining','fishing','rail logistics','portal licensing','factories']);
    const npcCap = $('npcCap'); if(npcCap) npcCap.value = state.workbench.npcCap || 350;
    const safe = $('playerSafeToggle'); if(safe) safe.value = state.workbench.playerSafe ? 'safe' : '';
  }
  function fillSelect(el, items){
    if(!el) return;
    el.innerHTML = '';
    safeArray(items).forEach(item => {
      const value = typeof item === 'string' ? item : (item.name || String(item));
      el.appendChild(h('option', { value, text: titleCase(value) }));
    });
  }

  function showMainTab(tabId){
    document.querySelectorAll('.tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === tabId));
  }
  function flatBiomeNames(){
    return safeArray(TOOLS.biomeTree).flatMap(group => safeArray(group.subcategories));
  }
  function setupBiomeSlots(){
    const holder = $('biomeSlots'); if(!holder) return;
    holder.innerHTML = '';
    for(let i=1;i<=3;i++){
      const wrap = h('div',{class:'biome-slot'},[
        h('label',{},[`Biome ${i} category`, h('select',{id:`biomeCategory${i}`})]),
        h('label',{},[`Biome ${i} subcategory`, h('select',{id:`biomeSubcategory${i}`})])
      ]);
      holder.appendChild(wrap);
      const cat = $(`biomeCategory${i}`); const sub = $(`biomeSubcategory${i}`);
      cat.appendChild(h('option',{value:'',text:i===1?'Choose category':'None'}));
      safeArray(TOOLS.biomeTree).forEach(group => cat.appendChild(h('option',{value:group.category,text:group.category})));
      cat.addEventListener('change', () => populateBiomeSubcategory(i));
      const defaultGroup = safeArray(TOOLS.biomeTree)[Math.min(i-1, safeArray(TOOLS.biomeTree).length-1)];
      if(i === 1 && defaultGroup){ cat.value = defaultGroup.category; populateBiomeSubcategory(i); }
      else populateBiomeSubcategory(i);
      sub.addEventListener('change', () => { renderEncounterIndexPreview(); });
    }
  }
  function populateBiomeSubcategory(slot){
    const cat = $(`biomeCategory${slot}`); const sub = $(`biomeSubcategory${slot}`); if(!cat || !sub) return;
    const group = safeArray(TOOLS.biomeTree).find(g => g.category === cat.value);
    sub.innerHTML = '';
    if(!group){ sub.appendChild(h('option',{value:'',text:'None'})); renderEncounterIndexPreview(); return; }
    safeArray(group.subcategories).forEach((name,idx) => sub.appendChild(h('option',{value:name,text:name,selected:idx===0?'selected':undefined})));
    renderEncounterIndexPreview();
  }
  function selectedBiomeStack(){
    const found = [];
    for(let i=1;i<=3;i++){
      const category = $(`biomeCategory${i}`)?.value || '';
      const subcategory = $(`biomeSubcategory${i}`)?.value || '';
      if(category && subcategory && !found.some(b => b.subcategory === subcategory)) found.push({category,subcategory,profile:biomeProfile(subcategory)});
    }
    if(!found.length){
      const fallback = flatBiomeNames()[0] || 'Grassland';
      found.push({category:'Plains',subcategory:fallback,profile:biomeProfile(fallback)});
    }
    return found;
  }
  function biomeProfile(name){
    return (TOOLS.biomeProfiles && TOOLS.biomeProfiles[name]) || {env:['Wilderness'],hazards:['unclear terrain'],locations:['useful landmark'],questMotifs:['local trouble']};
  }
  function biomeSummary(){
    return selectedBiomeStack().map(b => `${b.category}: ${b.subcategory}`).join(' + ');
  }
  function setExample(text){ const input = $('commandInput'); if(input){ input.value = text; input.focus(); } }
  function selectedValues(id){ return [...($(id)?.selectedOptions || [])].map(o => o.value); }
  function submitWorkbenchCommand(){
    const input = $('commandInput');
    const text = (input?.value || '').trim();
    if(!text) return;
    input.value = '';
    pageUser(text);
    runWorkbenchCommand(text, true);
  }
  function generateFromForm(){
    const name = $('settlementName')?.value.trim();
    const population = $('population')?.value;
    const locationCount = $('locationCount')?.value;
    const seed = $('seed')?.value.trim();
    const parts = [
      `create a ${$('danger')?.value || 'moderate'} ${$('biome')?.value || 'grassland'} ${$('type')?.value || 'village'}`,
      `in ${$('province')?.value || safeArray(state.lore.provinces)[0]?.name || 'Aelvanyr'}`,
      name ? `named ${name}` : '',
      selectedValues('transport').length ? `with ${selectedValues('transport').join(', ')}` : '',
      selectedValues('economy').length ? `economy ${selectedValues('economy').join(', ')}` : '',
      population ? `population ${population}` : '',
      locationCount ? `${locationCount} locations` : '',
      seed ? `seed ${seed}` : ''
    ].filter(Boolean).join(' ');
    pageUser(parts);
    runWorkbenchCommand(parts, true);
  }
  function generateProvinceFromForm(){
    const province = $('province')?.value || safeArray(state.lore.provinces)[0]?.name || 'Aelvanyr';
    const parts = `generate province ${province} with 3 villages 2 towns 1 city`;
    pageUser(parts);
    runWorkbenchCommand(parts, true);
  }
  function runWorkbenchCommand(command, announce){
    setOnyxMood('thinking','busy','Onyx is thinking through the RuleBot request.');
    if(!Bot){
      const msg = 'The original RuleBot engine did not load. Check js/rulebot_engine.js. I am grumpy, not magical.';
      setOnyxMood('judgmental','responding','Onyx found a loading problem.',1400);
      if(announce) pageBot(msg);
      return { intent:'error', message:msg, data:null };
    }
    let response;
    try{
      response = Bot.respond(state.lore, { current: state.workbench.current, npcCap: state.workbench.npcCap || 350 }, command);
    } catch(err){
      response = { intent:'error', message:`RuleBot engine error: ${err.message}`, data:null };
    }
    if(response && response.data){
      state.workbench.current = response.data;
      state.workbench.history.push({ at:new Date().toISOString(), command, intent:response.intent, summary:response.message });
      state.workbench.history = state.workbench.history.slice(-30);
      saveWorkbench(true);
      renderWorkbench();
    }
    const msg = onyxifyRuleBotResponse(response);
    setOnyxMood(inferMoodFromContent(command + ' ' + (msg || ''),'response'),'responding','Onyx has an answer.',1400);
    if(announce) pageBot(msg);
    return response;
  }
  function onyxifyRuleBotResponse(response){
    if(!response) return `${grumble()} No response. A rare and irritating silence.`;
    const current = response.data || state.workbench.current;
    let extra = '';
    if(current && current.schema && current.schema.includes('settlement')){
      extra = `\n\nCurrent settlement: ${current.name} · ${current.type} · ${current.biome} · ${safeArray(current.locations).length} locations · ${safeArray(current.npcs).length} NPCs.`;
    } else if(current && current.schema && current.schema.includes('province')){
      extra = `\n\nCurrent province batch: ${current.province} · ${current.settlementCount || safeArray(current.settlements).length} settlements.`;
    } else if(current && current.schema && current.schema.includes('npcs')){
      extra = `\n\nCurrent NPC batch: ${current.count || safeArray(current.npcs).length} NPCs for ${current.settlement || 'the selected settlement'}.`;
    }
    return `${grumble()} ${response.message || 'RuleBot has answered.'}${extra}\n\n${signoff()}`;
  }
  function pageUser(text){
    const log = $('chatLog'); if(!log) return;
    log.appendChild(h('div',{class:'msg user',text})); log.scrollTop = log.scrollHeight;
  }
  function pageBot(text){
    const log = $('chatLog'); if(!log) return;
    log.appendChild(h('div',{class:'msg bot',html:escapeHtml(text).replace(/\n/g,'<br>')})); log.scrollTop = log.scrollHeight;
  }
  function renderWorkbench(){
    renderOverview(state.workbench.current);
    renderLocationTable(state.workbench.current);
    renderNpcTable(state.workbench.current);
    renderJson(state.workbench.current);
    updateStats();
  }
  function currentForView(){
    const current = state.workbench.current;
    if(!current) return null;
    if(state.workbench.playerSafe && Bot?.toPlayerSafe){
      if(current.schema && current.schema.includes('settlement')) return Bot.toPlayerSafe(current);
      if(current.schema && current.schema.includes('province')) return Object.assign({}, current, { settlements: safeArray(current.settlements).map(s => Bot.toPlayerSafe(s)) });
    }
    return current;
  }
  function renderOverview(){
    const data = currentForView();
    const el = $('overview'); const cards = $('cards');
    if(!el || !cards) return;
    if(!data){
      el.innerHTML = '<div class="help">No generated data yet. Ask Emperor Onyx to create a settlement, NPC batch, or province batch.</div>';
      cards.innerHTML = '';
      return;
    }
    if(data.schema && data.schema.includes('settlement')){
      el.innerHTML = settlementOverview(data);
      cards.innerHTML = [
        ...safeArray(data.locations).slice(0,8).map(locationCard),
        ...safeArray(data.npcs).slice(0,8).map(npcCard)
      ].join('');
    } else if(data.schema && data.schema.includes('province')){
      el.innerHTML = `<div class="card"><h3>${escapeHtml(data.province)}</h3><p>${escapeHtml(data.government || '')}</p><p><span class="pill">${safeArray(data.settlements).length} settlements</span><span class="pill">${state.workbench.playerSafe ? 'Player-safe preview' : 'DM/full data'}</span></p></div>`;
      cards.innerHTML = safeArray(data.settlements).map(s => `<article class="card"><h3>${escapeHtml(s.name)}</h3><p>${escapeHtml(s.type)} · ${escapeHtml(s.biome)} · ${escapeHtml(s.danger)}</p><p>${escapeHtml(s.publicSummary || s.dmSummary || '')}</p><p><span class="pill">${safeArray(s.locations).length} locations</span><span class="pill">${safeArray(s.npcs).length} NPCs</span></p></article>`).join('');
    } else if(data.schema && data.schema.includes('npcs')){
      el.innerHTML = `<div class="card"><h3>NPC Batch</h3><p>${escapeHtml(data.count || safeArray(data.npcs).length)} NPCs for ${escapeHtml(data.settlement || 'current settlement')}.</p></div>`;
      cards.innerHTML = safeArray(data.npcs).slice(0,80).map(npcCard).join('');
    } else {
      el.innerHTML = '<div class="help">Generated data loaded, but its schema is not recognized.</div>';
      cards.innerHTML = '';
    }
  }
  function settlementOverview(s){
    return `<div class="card"><h3>${escapeHtml(s.name)}</h3><dl>
      <dt>Province</dt><dd>${escapeHtml(s.province)}</dd>
      <dt>Type / Biome</dt><dd>${escapeHtml(s.type)} · ${escapeHtml(s.biome)}</dd>
      <dt>Danger</dt><dd>${escapeHtml(s.danger)}</dd>
      <dt>Population</dt><dd>${escapeHtml(s.population)}</dd>
      <dt>Transport</dt><dd>${safeArray(s.transport).map(t => `<span class="pill">${escapeHtml(t)}</span>`).join(' ')}</dd>
      <dt>Economy</dt><dd>${safeArray(s.economy).map(t => `<span class="pill">${escapeHtml(t)}</span>`).join(' ')}</dd>
      <dt>Summary</dt><dd>${escapeHtml(s.publicSummary || s.dmSummary || '')}</dd>
    </dl></div>`;
  }
  function locationCard(l){
    return `<article class="card"><h3>${escapeHtml(l.name)}</h3><p>${escapeHtml(l.type)} · ${escapeHtml(l.category)}</p><p>${escapeHtml(l.description || '')}</p><p><b>Services:</b> ${escapeHtml(safeArray(l.services).join(', '))}</p></article>`;
  }
  function npcCard(n){
    return `<article class="card"><h3>${escapeHtml(n.fullName || n.name || 'Unnamed NPC')}</h3><p>${escapeHtml(n.race)} · ${escapeHtml(n.genderIdentity)} · ${escapeHtml(n.occupation)}</p><p>${escapeHtml(n.publicBio || n.bio || '')}</p><p class="muted">${escapeHtml(n.alignmentProfile || '')}</p></article>`;
  }
  function flattenSettlements(data){
    if(!data) return [];
    if(data.schema && data.schema.includes('province')) return safeArray(data.settlements);
    if(data.schema && data.schema.includes('settlement')) return [data];
    return [];
  }
  function renderLocationTable(){
    const data = currentForView();
    const body = $('locationRows'); if(!body) return;
    const rows = [];
    flattenSettlements(data).forEach(s => safeArray(s.locations).forEach(l => rows.push({ settlement:s.name, ...l })));
    body.innerHTML = rows.slice(0,500).map(l => `<tr><td>${escapeHtml(l.settlement)}</td><td>${escapeHtml(l.name)}</td><td>${escapeHtml(l.type)}</td><td>${escapeHtml(l.category)}</td><td>${escapeHtml(safeArray(l.services).join(', '))}</td><td>${escapeHtml(l.plotHook || '')}</td></tr>`).join('') || '<tr><td colspan="6">No location rows.</td></tr>';
  }
  function renderNpcTable(){
    const data = currentForView();
    const body = $('npcRows'); if(!body) return;
    let npcs = [];
    if(data){
      if(data.schema && data.schema.includes('province')) safeArray(data.settlements).forEach(s => npcs.push(...safeArray(s.npcs).map(n => ({ settlement:s.name, ...n }))));
      else if(data.schema && data.schema.includes('settlement')) npcs = safeArray(data.npcs).map(n => ({ settlement:data.name, ...n }));
      else if(data.schema && data.schema.includes('npcs')) npcs = safeArray(data.npcs).map(n => ({ settlement:data.settlement, ...n }));
    }
    body.innerHTML = npcs.slice(0,500).map(n => `<tr><td>${escapeHtml(n.settlement || '')}</td><td>${escapeHtml(n.fullName || n.name || '')}</td><td>${escapeHtml(n.race || '')}</td><td>${escapeHtml(n.genderIdentity || '')}</td><td>${escapeHtml(n.occupation || '')}</td><td>${escapeHtml(n.workplace || '')}</td><td>${escapeHtml(n.publicBio || '')}</td></tr>`).join('') || '<tr><td colspan="7">No NPC rows.</td></tr>';
  }
  function renderJson(){
    const el = $('jsonOutput'); if(!el) return;
    el.textContent = JSON.stringify(currentForView() || { message:'No data generated yet.' }, null, 2);
  }
  function updateStats(){
    const el = $('statusbar'); if(!el) return;
    const stats = [];
    stats.push(`Lore: ${safeArray(state.lore.provinces).length} provinces`);
    stats.push(`${safeArray(state.lore.races).length} races`);
    stats.push(`${safeArray(state.lore.locationBlueprints).length} location blueprints`);
    stats.push(`NPC cap: ${state.workbench.npcCap || 350}`);
    stats.push(state.workbench.playerSafe ? 'Player-safe preview' : 'DM/full data');
    const current = state.workbench.current;
    if(current){
      if(current.schema && current.schema.includes('settlement')) stats.push(`Current: ${current.name}`);
      if(current.schema && current.schema.includes('province')) stats.push(`Current: ${current.settlementCount || safeArray(current.settlements).length} settlements`);
      if(current.schema && current.schema.includes('npcs')) stats.push(`Current: ${current.count || safeArray(current.npcs).length} NPCs`);
    }
    el.innerHTML = stats.map(s => `<span class="pill">${escapeHtml(s)}</span>`).join('');
  }
  function exportCurrentJson(){
    const data = state.workbench.current;
    if(!data) return pageBot('Nothing to export yet. Create something first, impatient mammal.');
    downloadJson(data, filenameFor(data, 'json'));
    pageBot('Exported DM/full RuleBot JSON. Keep it away from water bowls.');
  }
  function exportPlayerJson(){
    const data = state.workbench.current;
    if(!data) return pageBot('Nothing to export yet. Create something first.');
    let safe = data;
    if(Bot?.toPlayerSafe){
      if(data.schema && data.schema.includes('settlement')) safe = Bot.toPlayerSafe(data);
      if(data.schema && data.schema.includes('province')) safe = Object.assign({}, data, { settlements: safeArray(data.settlements).map(s => Bot.toPlayerSafe(s)) });
    }
    downloadJson(safe, filenameFor(safe, 'player.json'));
    pageBot('Exported player-safe JSON. Secrets have been pushed under the sofa.');
  }
  function exportSettlementHtml(){
    const data = state.workbench.current;
    if(!data || !data.schema || !data.schema.includes('settlement')) return pageBot('Settlement HTML export works only when the current result is one settlement. Generate a settlement first.');
    if(!Bot?.exportSettlementHtml) return pageBot('HTML exporter missing from RuleBot engine. Rude.');
    downloadText(Bot.exportSettlementHtml(data), `${slugify(data.name)}_settlement.html`, 'text/html');
    pageBot('Exported player-safe settlement HTML. I even wiped the paw prints off it.');
  }
  async function copyCurrentJson(){
    const data = currentForView();
    if(!data) return pageBot('Nothing to copy yet.');
    try{ await navigator.clipboard.writeText(JSON.stringify(data, null, 2)); pageBot('Copied current JSON to clipboard.'); }
    catch(err){ pageBot('Clipboard blocked by browser. Use the JSON tab and copy manually. Typical.'); }
  }
  function downloadJson(data, filename){ downloadText(JSON.stringify(data, null, 2), filename, 'application/json'); }
  function downloadText(text, filename, type){
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function filenameFor(data, ext){
    if(data?.schema && data.schema.includes('province')) return `${slugify(data.province)}_province_onyx_rulebot.${ext}`;
    if(data?.schema && data.schema.includes('settlement')) return `${slugify(data.name)}_settlement_onyx_rulebot.${ext}`;
    if(data?.schema && data.schema.includes('npcs')) return `${slugify(data.settlement || 'npc_batch')}_npcs_onyx_rulebot.${ext}`;
    return `emperor_onyx_rulebot_export.${ext}`;
  }
  function handleImportFile(e){ const file = e.target.files[0]; if(file) readJsonFile(file, processImportedJson); }
  function handleLoreFile(e){
    const file = e.target.files[0];
    if(file) readJsonFile(file, data => {
      state.lore = Bot ? Bot.normalizeLore(Object.assign({}, state.lore, data)) : Object.assign({}, state.lore, data);
      populateSelects(); updateStats(); pageBot(`Loaded lore JSON: ${file.name}. I sniffed it. Acceptable.`);
    });
  }
  function readJsonFile(file, callback){
    const reader = new FileReader();
    reader.onload = () => { try{ callback(JSON.parse(reader.result)); } catch(err){ pageBot(`Could not parse ${file.name} as JSON. ${grumble()}`); } };
    reader.readAsText(file);
  }
  function processImportedJson(data){
    if(data && data.schema && String(data.schema).startsWith('belavados.rulebot')){
      state.workbench.current = data; renderWorkbench(); saveWorkbench(true); pageBot('Imported RuleBot JSON as current data.'); return;
    }
    const normalized = normalizeExternalWorldData(data);
    if(normalized){ state.workbench.current = normalized; renderWorkbench(); saveWorkbench(true); pageBot('Imported external JSON and normalized it into RuleBot data.'); }
    else pageBot('JSON loaded, but I could not recognize its settlement/province structure. Try loading it as lore data instead.');
  }
  function normalizeExternalWorldData(data){
    if(!Bot || !data || typeof data !== 'object') return null;
    if(Array.isArray(data.settlements)){
      const settlements = data.settlements.slice(0,50).map(s => Bot.generateSettlement(state.lore, {
        name:s.name || s.title,
        province:s.province || s.provinceName,
        type:String(s.type || s.settlementType || 'village').toLowerCase(),
        biome:String(s.biome || s.terrain || 'grassland').toLowerCase(),
        population:Number(s.population || 0) || undefined,
        danger:s.danger || s.dangerLevel,
        economy:Array.isArray(s.economy) ? s.economy : [],
        transport:Array.isArray(s.transport) ? s.transport : [],
        command:JSON.stringify(s).slice(0,500), npcCap:140, locationCount:80
      }));
      return { schema:'belavados.rulebot.province.v1', generatedAt:new Date().toISOString(), province:data.province || data.name || 'Imported Province', government:data.government || 'Imported', settlementCount:settlements.length, settlements };
    }
    if(data.name && (data.population || data.biome || data.type || data.settlementType)){
      return Bot.generateSettlement(state.lore, { name:data.name, province:data.province, type:String(data.type || data.settlementType || 'village').toLowerCase(), biome:String(data.biome || 'grassland').toLowerCase(), population:Number(data.population || 0) || undefined, command:JSON.stringify(data).slice(0,500), npcCap:200 });
    }
    return null;
  }


function buildMoodDisplay(role='panel'){
  const wrap = h('div',{
    class:`onyx-mood-display onyx-role-${role}`,
    'data-onyx-display':role,
    'data-onyx-mood':'judgmental',
    'data-onyx-activity':'idle'
  },[
    h('div',{class:'onyx-mood-stage'},[
      h('img',{class:'onyx-mood-image',src:MOOD_IMAGES.judgmental,alt:'Emperor Onyx with a forest-green bowtie in a judgmental mood'})
    ]),
    h('div',{class:'onyx-state-label',text:MOOD_META.judgmental.label}),
    h('div',{class:'onyx-state-note',text:MOOD_META.judgmental.note})
  ]);
  return wrap;
}
function replaceWithMoodDisplay(target, role){
  if(!target || target.dataset.onyxMoodBound === 'true') return;
  target.dataset.onyxMoodBound = 'true';
  target.textContent = '';
  target.appendChild(buildMoodDisplay(role));
}
function injectMainMoodPanel(){
  if($('onyxPresenceCard')) return;
  const anchor = document.querySelector('.panel.side .section.help');
  if(!anchor) return;
  const card = h('div',{id:'onyxPresenceCard',class:'section onyx-presence-card'},[
    h('h2',{text:'Onyx Mood Board'}),
    h('div',{class:'help',text:'Onyx changes mood while responding or idling. He thinks, judges, reflects, melts sideways into sleep, and becomes dramatically snack-motivated. He is Papa’s best friend first, assistant second, tiny void emperor always.'}),
    buildMoodDisplay('panel')
  ]);
  anchor.insertAdjacentElement('afterend', card);
}
function initializeOnyxMoodSystem(){
  if(moodState.attached) return;
  injectMainMoodPanel();
  replaceWithMoodDisplay(document.querySelector('.seal.onyx-seal') || document.querySelector('.seal'),'seal');
  replaceWithMoodDisplay(state.root?.querySelector('.onyx-cat-face'),'launcher');
  replaceWithMoodDisplay(state.root?.querySelector('.onyx-avatar'),'avatar');
  moodState.panels = [...document.querySelectorAll('[data-onyx-display]')];
  moodState.attached = true;
  const interactionEvents = ['pointerdown','keydown','touchstart'];
  interactionEvents.forEach(evt => document.addEventListener(evt, onyxActivityPulse, {passive:true}));
  setOnyxMood('judgmental','idle',MOOD_META.judgmental.note);
}
function onyxActivityPulse(){
  const now = Date.now();
  if(now - moodState.lastActivity < 900) return;
  moodState.lastActivity = now;
  if(moodState.activity === 'busy') return;
  scheduleIdleMoods();
}
function moodNote(mood, activity, note=''){
  if(note) return note;
  if(activity === 'busy' && mood === 'thinking') return 'Onyx is thinking...';
  if(activity === 'responding') return 'Onyx is answering, with dramatic restraint.';
  return (MOOD_META[mood] && MOOD_META[mood].note) || MOOD_META.judgmental.note;
}
function setOnyxMood(mood='judgmental', activity='idle', note='', hold=0){
  if(!MOOD_IMAGES[mood]) mood = 'judgmental';
  clearTimeout(moodState.responseTimer);
  moodState.current = mood;
  moodState.activity = activity;
  moodState.note = moodNote(mood, activity, note);
  if(!moodState.panels.length) moodState.panels = [...document.querySelectorAll('[data-onyx-display]')];
  moodState.panels.forEach(panel => {
    panel.dataset.onyxMood = mood;
    panel.dataset.onyxActivity = activity;
    const img = panel.querySelector('.onyx-mood-image');
    if(img){
      img.src = MOOD_IMAGES[mood];
      img.alt = `Emperor Onyx in a ${mood} mood`;
    }
    const label = panel.querySelector('.onyx-state-label');
    if(label) label.textContent = (MOOD_META[mood] && MOOD_META[mood].label) || mood;
    const noteEl = panel.querySelector('.onyx-state-note');
    if(noteEl) noteEl.textContent = moodState.note;
  });
  if(activity !== 'busy') scheduleIdleMoods();
  if(hold > 0){
    moodState.responseTimer = setTimeout(() => {
      moodState.activity = 'idle';
      setOnyxMood(mood,'idle',note);
    }, hold);
  }
}
function scheduleIdleMoods(){
  clearTimeout(moodState.idleTimer); clearTimeout(moodState.sleepyTimer); clearTimeout(moodState.hungryTimer);
  moodState.idleTimer = setTimeout(() => {
    if(moodState.activity === 'busy') return;
    setOnyxMood('judgmental','idle',MOOD_META.judgmental.note);
  }, 24000);
  moodState.sleepyTimer = setTimeout(() => {
    if(moodState.activity === 'busy') return;
    setOnyxMood('sleepy','idle',MOOD_META.sleepy.note);
  }, 52000);
  moodState.hungryTimer = setTimeout(() => {
    if(moodState.activity === 'busy') return;
    setOnyxMood('hungry','idle',MOOD_META.hungry.note);
  }, 92000);
}
function inferMoodFromContent(text, phase='response'){
  const lower = String(text || '').toLowerCase();
  if(/food|hungry|eat|meal|fish|snack|treat|wet food|kibble|tuna|salmon|chicken/.test(lower)) return 'hungry';
  if(/sleep|rest|camp|bed|quiet|legs|snuggle|furniture/.test(lower)) return 'sleepy';
  if(/quest|plan|think|ponder|idea|investigat|clue|lore/.test(lower)) return phase === 'busy' ? 'thinking' : 'thoughtful';
  if(/error|bad|wrong|fail|cannot|clear|delete|judge|warning/.test(lower)) return 'judgmental';
  if(phase === 'busy') return 'thinking';
  return 'thoughtful';
}

  function initWidget(options={}){
    if(document.getElementById('emperor-onyx-root')) return;
    state.memory = combineDeep(state.memory, options.memory || {});
    const root = h('section',{id:'emperor-onyx-root','aria-label':'Emperor Onyx helper bot'});
    const launcher = h('button',{class:'onyx-launcher',title:'Open Emperor Onyx',onclick:toggleOpen},[
      h('span',{class:'onyx-cat-face',text:'🐈‍⬛'}), h('span',{class:'onyx-badge',text:'!'})
    ]);
    const shell = h('div',{class:'onyx-shell',role:'dialog','aria-modal':'false'});
    const header = h('header',{class:'onyx-header'},[
      h('div',{class:'onyx-avatar',text:'🐈‍⬛'}),
      h('div',{class:'onyx-title'},[h('strong',{text:DATA.botName || 'Emperor Onyx'}), h('span',{text:`${modeLabel()} • prefix ${state.memory.prefix} • green plaid bowtie active`})]),
      h('button',{class:'onyx-icon-button',title:'Export Onyx memory',onclick:() => exportMemory(false),text:'⇩'}),
      h('button',{class:'onyx-icon-button',title:'Close',onclick:toggleOpen,text:'×'})
    ]);
    const tabs = h('nav',{class:'onyx-tabs','aria-label':'Onyx tabs'});
    [['chat','Chat'],['commands','Commands'],['rulebot','RuleBot'],['memory','Memory'],['dm','DM Tools']].forEach(([key,label]) => tabs.appendChild(h('button',{class:'onyx-tab',text:label,'aria-selected':key===state.tab,onclick:() => setTab(key)})));
    const quickbar = h('div',{class:'onyx-quickbar'});
    for(const prompt of DATA.quickPrompts || []) quickbar.appendChild(h('button',{class:'onyx-chip',text:prompt.label,onclick:() => submit(`${prompt.key} ${prompt.prompt}`)}));
    quickbar.appendChild(h('button',{class:'onyx-chip',text:'Roll d20',onclick:() => submit('roll d20')}));
    quickbar.appendChild(h('button',{class:'onyx-chip',text:'Help',onclick:() => submit('help')}));
    const body = h('main',{class:'onyx-body'});
    const importer = h('div',{class:'onyx-importer onyx-hidden'},[
      h('div',{class:'onyx-muted',text:'Paste exported Onyx memory JSON below. This only affects this browser.'}),
      h('textarea',{id:'onyx-import-json',placeholder:'Paste JSON here'}),
      h('button',{class:'onyx-small-button',text:'Import',onclick:importMemory}),
      h('button',{class:'onyx-small-button',text:'Cancel',onclick:() => importer.classList.add('onyx-hidden')})
    ]);
    const input = h('textarea',{class:'onyx-input',placeholder:`${state.memory.prefix}help, ${state.memory.prefix}roll d20+5 adv, ${state.memory.prefix}settlement deep cavern town`});
    input.addEventListener('keydown', ev => { if(ev.key === 'Enter' && !ev.shiftKey){ ev.preventDefault(); submit(input.value); } });
    const inputRow = h('form',{class:'onyx-input-row',onsubmit:ev => { ev.preventDefault(); submit(input.value); }},[input,h('button',{class:'onyx-send',text:'Send'})]);
    shell.append(header,tabs,quickbar,body,importer,inputRow);
    root.append(launcher,shell);
    document.body.appendChild(root);
    state.root = root; state.shell = shell; state.body = body; state.input = input; state.importer = importer;
    renderTab(); addBot(greet());
    try{ const session = JSON.parse(sessionStorage.getItem(SESSION_KEY) || '{}'); if(session.lastOpen) toggleOpen(true); if(session.tab) setTab(session.tab, false); } catch {}
  }
  function modeLabel(){ return isDmMode() ? 'DM mode' : 'Player-safe mode'; }
  function isDmMode(){ return location.hash === (state.memory.settings.dmHash || '#dm-editor'); }
  function toggleOpen(force){
    state.open = typeof force === 'boolean' ? force : !state.open;
    state.shell.classList.toggle('onyx-open', state.open);
    state.root.querySelector('.onyx-launcher').style.display = state.open ? 'none' : 'grid';
    saveMemory(); if(state.open) setTimeout(() => state.input?.focus(), 50);
  }
  function setTab(tab, announce=true){
    state.tab = tab;
    state.root.querySelectorAll('.onyx-tab').forEach(btn => {
      const normalized = btn.textContent.toLowerCase().replace(' tools','');
      btn.setAttribute('aria-selected', String(normalized === tab));
    });
    renderTab(); saveMemory();
    if(announce && tab === 'dm' && !isDmMode()) addBot('DM tools are locked. Add <code>#dm-editor</code> to the page URL, little locksmith.');
  }
  function renderTab(){
    if(!state.body) return;
    state.body.innerHTML = '';
    if(state.tab === 'chat') addBot(greet(), false);
    else if(state.tab === 'commands') addBot(commandHelp(), false);
    else if(state.tab === 'rulebot') addBot(renderRuleBotPanel(), false);
    else if(state.tab === 'memory') addBot(renderMemory(), false);
    else if(state.tab === 'dm') addBot(renderDmTools(), false);
  }
  function greet(){
    const lines = DATA.persona?.greetings || ['Emperor Onyx is listening.'];
    return `${pick(lines)}\n\nI am Lord Onyx Blepman, Emperor Of The Voidattude: Papa's best friend, tiny void emperor, service-animal familiar, food-motivated genius, and campaign helper. I keep all RuleBot functions, plus quests, encounters, files, DM tips, and dice. Try <code>${state.memory.prefix}settlement high danger deep cavern town</code>, <code>${state.memory.prefix}npcs 40</code>, <code>${state.memory.prefix}province Aelvanyr</code>, <code>${state.memory.prefix}roll d20+5 adv</code>, <code>${state.memory.prefix}comfort</code>, or <code>${state.memory.prefix}scan</code> in DM mode.`;
  }
  function addUser(text){ setOnyxMood(inferMoodFromContent(text,'busy'),'busy','Onyx is listening.'); state.body.appendChild(h('div',{class:'onyx-message onyx-user',text})); scrollBottom(); }
  function addBot(html, scroll=true){ state.body.appendChild(h('div',{class:'onyx-message onyx-bot',html})); if(scroll) scrollBottom(); setOnyxMood(inferMoodFromContent(html,'response'),'responding','Onyx is replying.',1400); }
  function scrollBottom(){ state.body.scrollTop = state.body.scrollHeight; }
  function submit(raw){
    const text = (raw || '').trim(); if(!text) return;
    state.input.value = ''; if(state.tab !== 'chat') setTab('chat', false);
    addUser(text);
    setOnyxMood(inferMoodFromContent(text,'busy'),'busy','Onyx is thinking...');
    window.setTimeout(() => {
      const clean = stripPrefix(text);
      const response = handleCommand(clean);
      if(response) addBot(response);
      setOnyxMood(inferMoodFromContent((response || text),'response'),'responding','Onyx is answering.',1400);
      saveMemory();
    }, 140);
  }
  function stripPrefix(text){
    const p = state.memory.prefix || '.';
    if(text.startsWith(p)) return text.slice(p.length).trim();
    if(text.startsWith('/')) return text.slice(1).trim();
    if(text.toLowerCase().startsWith('onyx ')) return text.slice(5).trim();
    return text;
  }
  function handleCommand(text){
    const [cmdRaw,...restParts] = text.split(/\s+/);
    const cmd = (cmdRaw || 'help').toLowerCase();
    const rest = restParts.join(' ').trim();
    if(cmd === 'help' || cmd === 'commands') return commandHelp();
    if(cmd === 'roll' || looksLikeRoll(text) || state.memory.quickrolls[cmd]) return commandRoll(cmd === 'roll' ? rest : text);
    if(['mod','modifier'].includes(cmd)) return commandModifier(rest);
    if(['qroll','quickroll'].includes(cmd)) return commandQuickroll(rest);
    if(cmd === 'delete') return commandDelete(rest);
    if(cmd === 'list') return renderMemory();
    if(['settlement','city','town','village','capital'].includes(cmd)) return widgetRuleBot(`generate ${cmd} ${rest}`.trim());
    if(['npc','npcs','people','residents','citizens'].includes(cmd)) return widgetRuleBot(`generate ${cmd === 'npc' ? '1 NPC' : rest || '25 NPCs'} ${cmd === 'npc' ? rest : ''}`.trim());
    if(['province','world'].includes(cmd)) return widgetRuleBot(`generate province ${rest}`.trim());
    if(['rulebot','generate','create','make','build'].includes(cmd)) return widgetRuleBot(text);
    if(['find','search','show','lookup'].includes(cmd)) return widgetRuleBot(text);
    if(cmd === 'safe') return togglePlayerSafe();
    if(cmd === 'json') return currentJsonSummary();
    if(cmd === 'export-rulebot') { exportCurrentJson(); return 'Exported current RuleBot JSON. The file has been released into the wild.'; }
    if(cmd === 'export-player') { exportPlayerJson(); return 'Exported player-safe JSON. Secrets were removed with surgical contempt.'; }
    if(cmd === 'export-html') { exportSettlementHtml(); return 'Attempted settlement HTML export. If nothing happened, generate one settlement first.'; }
    if(cmd === 'quest') return generateQuest(rest);
    if(cmd === 'encounter') return generateEncounterCommand(rest);
    if(cmd === 'tip' || cmd === 'tips') return dmTipHtml(rest || 'pacing');
    if(cmd === 'files' || cmd === 'parsed') return parsedFilesHtml();
    if(cmd === 'location') return generateLocation(rest);
    if(cmd === 'lore') return searchLore(rest);
    if(cmd === 'remember') return remember(rest);
    if(cmd === 'forget') return forget(rest);
    if(cmd === 'task') return addTask(rest);
    if(cmd === 'done') return doneTask(rest);
    if(['remove','rm'].includes(cmd)) return removeTask(rest);
    if(cmd === 'remind') return addReminder(rest);
    if(cmd === 'poll') return makePoll(rest);
    if(cmd === 'prompt') return promptIdea(rest);
    if(cmd === 'scan') return scanPage();
    if(cmd === 'export') return exportMemory(true);
    if(cmd === 'import'){ state.importer.classList.remove('onyx-hidden'); return 'Paste exported Onyx memory below. I shall not lick it. Probably.'; }
    if(cmd === 'prefix') return setPrefix(rest);
    if(cmd === 'food' || cmd === 'treat') return food();
    if(cmd === 'comfort' || cmd === 'care') return comfortCheck();
    if(cmd === 'who' || cmd === 'onyx') return onyxIdentityCard();
    if(cmd === 'status' || cmd === 'ping') return `Awake. Judging. Functional. Snuggly. Snack-motivated. Current mode: <strong>${modeLabel()}</strong>. Prefix: <code>${escapeHtml(state.memory.prefix)}</code>. RuleBot engine: <strong>${Bot ? 'loaded' : 'missing'}</strong>.`;
    if(cmd === 'clear'){ state.body.innerHTML = ''; return 'I have swept the chat off the counter.'; }
    return fallback(text);
  }
  function widgetRuleBot(command){
    const response = runWorkbenchCommand(command, false);
    renderWorkbench();
    return `<h4>RuleBot Result</h4>${escapeHtml(onyxifyRuleBotResponse(response)).replace(/\n/g,'<br>')}${attachedLoreHint(command)}${renderMiniCurrent()}`;
  }
  function renderMiniCurrent(){
    const current = state.workbench.current;
    if(!current) return '';
    if(current.schema && current.schema.includes('settlement')) return `<div class="onyx-card"><div class="onyx-card-title">Current Settlement</div>${escapeHtml(current.name)} · ${escapeHtml(current.type)} · ${escapeHtml(current.biome)}<br>${safeArray(current.locations).length} locations · ${safeArray(current.npcs).length} NPCs<div class="onyx-toolbar"><button class="onyx-small-button" onclick="window.EmperorOnyxRuleBot.exportCurrentJson()">Export JSON</button><button class="onyx-small-button" onclick="window.EmperorOnyxRuleBot.exportPlayerJson()">Export Player JSON</button><button class="onyx-small-button" onclick="window.EmperorOnyxRuleBot.exportSettlementHtml()">Export HTML</button></div></div>`;
    if(current.schema && current.schema.includes('province')) return `<div class="onyx-card"><div class="onyx-card-title">Current Province</div>${escapeHtml(current.province)} · ${safeArray(current.settlements).length} settlements<div class="onyx-toolbar"><button class="onyx-small-button" onclick="window.EmperorOnyxRuleBot.exportCurrentJson()">Export JSON</button><button class="onyx-small-button" onclick="window.EmperorOnyxRuleBot.exportPlayerJson()">Export Player JSON</button></div></div>`;
    if(current.schema && current.schema.includes('npcs')) return `<div class="onyx-card"><div class="onyx-card-title">Current NPC Batch</div>${safeArray(current.npcs).length} NPCs<div class="onyx-toolbar"><button class="onyx-small-button" onclick="window.EmperorOnyxRuleBot.exportCurrentJson()">Export JSON</button></div></div>`;
    return '';
  }
  function renderRuleBotPanel(){
    const current = state.workbench.current;
    const lib = attachedLoreLibrary();
    const loreStats = `${safeArray(state.lore.provinces).length} provinces, ${safeArray(state.lore.races).length} races, ${safeArray(state.lore.locationBlueprints).length} location blueprints, ${safeArray(state.lore.settlementAssignments).length} settlement assignment records, ${safeArray(lib.chunks).length} attached lore chunks`;
    return `<h4>RuleBot Functions, Onyx Voice</h4><div class="onyx-rulebot-summary">
      <div class="onyx-card"><div class="onyx-card-title">Loaded Lore</div>${escapeHtml(loreStats)}</div>
      <div class="onyx-card"><div class="onyx-card-title">Current Data</div>${current ? escapeHtml(describeCurrent(current)) : 'No current generated data.'}</div>
      <div class="onyx-card"><div class="onyx-card-title">Try</div><code>${state.memory.prefix}settlement high danger deep cavern mining town named Coalveil</code><br><code>${state.memory.prefix}npcs 40</code><br><code>${state.memory.prefix}province Aelvanyr with 3 villages 2 towns 1 city</code><br><code>${state.memory.prefix}lore pantheon</code><br><code>${state.memory.prefix}lore Threads of Peace</code><br><code>${state.memory.prefix}find tavern</code></div>
    </div>`;
  }
  function describeCurrent(current){
    if(current.schema && current.schema.includes('settlement')) return `${current.name}: ${current.type}, ${current.biome}, ${safeArray(current.locations).length} locations, ${safeArray(current.npcs).length} NPCs.`;
    if(current.schema && current.schema.includes('province')) return `${current.province}: ${safeArray(current.settlements).length} settlements.`;
    if(current.schema && current.schema.includes('npcs')) return `${safeArray(current.npcs).length} NPCs for ${current.settlement || 'current settlement'}.`;
    return 'Generated data loaded.';
  }
  function commandHelp(){
    const rows = (DATA.commandHelp || []).map(([cmd,desc]) => `<tr><td><code>${escapeHtml(state.memory.prefix + cmd)}</code></td><td>${escapeHtml(desc)}</td></tr>`).join('');
    return `<h4>Emperor Onyx Commands</h4><p>${grumble()} I keep Lord Onyx Blepman's best-friend personality and run the RuleBot settlement/NPC/province engine, plus attached Belavadös lore search, quest help, biome encounters, file parsing, DM tips, and dice.</p><table><tbody>${rows}</tbody></table>`;
  }

  function looksLikeRoll(text){ return /(^|\s)\d*d\d+/i.test(text) || /\badv\b|\bdis\b/i.test(text); }
  function commandRoll(input){
    try{ const result = rollExpression(resolveQuickroll(input)); return `<h4>Dice Results</h4>${result.html}<div class="onyx-muted">${grumble()} Dice obey me because they know better.</div>`; }
    catch(err){ return `<span class="onyx-danger">Dice problem:</span> ${escapeHtml(err.message)}. Try <code>${state.memory.prefix}roll d20+5 adv</code>.`; }
  }
  function resolveQuickroll(input){
    let expr = (input || 'd20').trim();
    const [first,...parts] = expr.split(/(?=[+\-])/);
    const key = first.trim().toLowerCase();
    if(state.memory.quickrolls[key]) expr = state.memory.quickrolls[key] + parts.join('');
    return expr;
  }
  function rollExpression(input){
    let expr = input.replace(/\.adv\b/gi,' adv').replace(/\.dis\b/gi,' dis');
    const targetMatch = expr.match(/(>=|<=|>|<|=)\s*(-?\d+)\s*$/);
    let target = null;
    if(targetMatch){ target = { op:targetMatch[1], value:Number(targetMatch[2]) }; expr = expr.slice(0,targetMatch.index).trim(); }
    const adv = /\badv\b/i.test(expr); const dis = /\bdis\b/i.test(expr);
    expr = expr.replace(/\badv\b|\bdis\b/gi,'').trim();
    if(adv || dis) expr = expr.replace(/(^|[^\d])d20\b/i,'$11d20');
    const tokens = tokenizeDice(expr);
    let total = 0; const details = [];
    for(const token of tokens){
      const sign = token.sign === '-' ? -1 : 1; const value = token.value;
      if(/^\d*d\d+/i.test(value)){ const rolled = rollDiceToken(value, adv, dis); total += sign * rolled.total; details.push(`${sign < 0 ? '-' : '+'} ${escapeHtml(value)} {${rolled.rolls.join(', ')}} = ${sign * rolled.total}`); }
      else if(/^[a-z_][\w-]*$/i.test(value)){ const mod = Number(state.memory.modifiers[value.toLowerCase()] ?? 0); total += sign * mod; details.push(`${sign < 0 ? '-' : '+'} ${escapeHtml(value)} {${mod}}`); }
      else if(/^-?\d+$/.test(value)){ const n = Number(value); total += sign * n; details.push(`${sign < 0 ? '-' : '+'} ${Math.abs(n)}`); }
      else throw new Error(`Unknown token ${value}`);
    }
    let verdict = '';
    if(target){ const ok = compare(total, target.op, target.value); verdict = `<div class="${ok ? 'onyx-success' : 'onyx-danger'}">${ok ? 'Success' : 'Failure'}: ${total} ${escapeHtml(target.op)} ${target.value}</div>`; }
    return { total, html:`<div class="onyx-card"><div class="onyx-card-title">${escapeHtml(input)} = ✨ ${total} ✨</div><div>${details.join('<br>').replace(/^\+ /,'')}</div>${verdict}</div>` };
  }
  function tokenizeDice(expr){
    if(!expr) throw new Error('No dice expression given');
    const normalized = expr.replace(/\s+/g,'').replace(/(^|[+\-])d(\d+)/gi,'$11d$2');
    const matches = normalized.match(/[+\-]?[^+\-]+/g) || [];
    return matches.map(m => ({ sign:m[0] === '-' ? '-' : '+', value:m.replace(/^[+\-]/,'').toLowerCase() }));
  }
  function rollDiceToken(token, adv, dis){
    const match = token.match(/^(\d*)d(\d+)(?::(dl|dh|rr|min|c)(\d+))?/i);
    if(!match) throw new Error(`Bad dice token ${token}`);
    const count = Math.min(Number(match[1] || 1), 200); const sides = Math.min(Number(match[2]), 10000); const special = match[3]; const specialN = Number(match[4] || 0);
    let rolls = [];
    if((adv || dis) && sides === 20 && count === 1){ const a = randomInt(1,20), b = randomInt(1,20); const picked = adv && !dis ? Math.max(a,b) : dis && !adv ? Math.min(a,b) : a; return { total:picked, rolls:[a,b,`kept ${picked}`] }; }
    for(let i=0;i<count;i++){ let r = randomInt(1,sides); if(special === 'rr' && r < specialN) r = randomInt(1,sides); if(special === 'min' && r < specialN) r = specialN; rolls.push(r); }
    let kept = [...rolls]; if(special === 'dl') kept = dropLowest(kept, specialN); if(special === 'dh') kept = dropHighest(kept, specialN);
    return { total:kept.reduce((a,b)=>a+Number(b),0), rolls:rolls.map(String) };
  }
  function dropLowest(arr,n){ return [...arr].sort((a,b)=>a-b).slice(n); }
  function dropHighest(arr,n){ return [...arr].sort((a,b)=>b-a).slice(n); }
  function randomInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
  function compare(a,op,b){ return op === '>=' ? a >= b : op === '<=' ? a <= b : op === '>' ? a > b : op === '<' ? a < b : a === b; }
  function commandModifier(rest){
    const [key,value] = parseAssignment(rest); if(!key) return 'Use <code>mod wis=4</code>. Cats respect clear notation.';
    if(value === ''){ delete state.memory.modifiers[key]; return `Modifier <code>${escapeHtml(key)}</code> deleted. Vanished like dignity near a laser pointer.`; }
    const n = Number(value); if(!Number.isFinite(n)) return 'Modifier value must be a number. I cannot roll vibes, regrettably.';
    state.memory.modifiers[key] = n; return `Modifier saved: <code>${escapeHtml(key)} = ${n}</code>.`;
  }
  function commandQuickroll(rest){ const [key,value] = parseAssignment(rest); if(!key || !value) return 'Use <code>qroll perception=d20+wis+level</code>.'; state.memory.quickrolls[key] = value; return `Quickroll saved: <code>${escapeHtml(key)} = ${escapeHtml(value)}</code>.`; }
  function commandDelete(rest){ const key = rest.trim().toLowerCase(); if(!key) return 'Delete what, exactly? A quickroll? A modifier? A chair? Be specific.'; const had = key in state.memory.modifiers || key in state.memory.quickrolls; delete state.memory.modifiers[key]; delete state.memory.quickrolls[key]; return had ? `Deleted <code>${escapeHtml(key)}</code>.` : `I found no <code>${escapeHtml(key)}</code>. It has escaped judgment.`; }
  function parseAssignment(rest){ const idx = rest.indexOf('='); if(idx === -1) return [rest.trim().toLowerCase(), '']; return [rest.slice(0,idx).trim().toLowerCase(), rest.slice(idx+1).trim()]; }
  function renderMemory(){
    const mods = Object.entries(state.memory.modifiers).map(([k,v]) => `<tr><td>${escapeHtml(k)}</td><td>${escapeHtml(String(v))}</td></tr>`).join('') || '<tr><td colspan="2">None</td></tr>';
    const rolls = Object.entries(state.memory.quickrolls).map(([k,v]) => `<tr><td>${escapeHtml(k)}</td><td>${escapeHtml(v)}</td></tr>`).join('') || '<tr><td colspan="2">None</td></tr>';
    const tasks = state.memory.tasks.map((t,i) => `<tr><td>${i+1}</td><td>${t.done ? '✅' : '⬜'}</td><td>${escapeHtml(t.text)}</td></tr>`).join('') || '<tr><td colspan="3">None</td></tr>';
    const lore = Object.entries(state.memory.lore).map(([k,v]) => `<tr><td>${escapeHtml(k)}</td><td>${escapeHtml(String(v).slice(0,140))}${String(v).length > 140 ? '…' : ''}</td></tr>`).join('') || '<tr><td colspan="2">No saved lore snippets yet.</td></tr>';
    return `<h4>Onyx Memory</h4><div class="onyx-card"><div class="onyx-card-title">Modifiers</div><table>${mods}</table></div><div class="onyx-card"><div class="onyx-card-title">Quickrolls</div><table>${rolls}</table></div><div class="onyx-card"><div class="onyx-card-title">Tasks</div><table>${tasks}</table></div><div class="onyx-card"><div class="onyx-card-title">Lore Snippets</div><table>${lore}</table></div>`;
  }
  function togglePlayerSafe(){ state.workbench.playerSafe = !state.workbench.playerSafe; renderWorkbench(); saveWorkbench(true); return `Player-safe preview is now <strong>${state.workbench.playerSafe ? 'ON' : 'OFF'}</strong>. ${state.workbench.playerSafe ? 'Secrets are under the sofa.' : 'DM secrets are visible again. Guard them.'}`; }
  function currentJsonSummary(){ const data = currentForView(); if(!data) return 'No current RuleBot JSON yet.'; return `<h4>Current RuleBot JSON</h4><pre>${escapeHtml(JSON.stringify(data,null,2).slice(0,12000))}${JSON.stringify(data).length > 12000 ? '\n…truncated in chat; use export for full file.' : ''}</pre>`; }
  function generateLocation(notes=''){
    const type = normalizeSeed(notes) || pick(DATA.loreSeeds?.locationTypes || ['tavern']);
    const faction = pick(DATA.loreSeeds?.factions || ['merchant league']);
    const name = `${pick(['Brass','Velvet','Black','Gilded','Moonlit','Cinder','Iron','Sable','green-plaid-bowed'])} ${titleCase(type)}`;
    return `<h4>Location: ${name}</h4><table><tr><th>Type</th><td>${titleCase(type)}</td></tr><tr><th>Services</th><td>Goods and services, rumor exchange, faction contact, job board, safe/unsafe rest depending on danger level.</td></tr><tr><th>Staff</th><td>${makeName()} manages the front; ${makeName()} knows the back-room truth.</td></tr><tr><th>Faction Tie</th><td>${titleCase(faction)}</td></tr><tr><th>Map Pin</th><td>Auto-categorize as ${pinCategory(type)}; highlight in directory and settlement map.</td></tr><tr><th>Complication</th><td>A shipment, guest, ledger, shrine, or locked room has become everyone’s problem.</td></tr><tr><th>Onyx Note</th><td>${pick(DATA.loreSeeds?.cattyAdvice || ['Add a rumor.'])}</td></tr></table>`;
  }
  function generateQuest(notes=''){
    return buildQuestHtml({ notes });
  }

  function buildQuestHtml(options={}){
    const stack = selectedBiomeStack();
    const profiles = stack.map(b => b.profile);
    const faction = options.faction || $('questFaction')?.value.trim() || pick(DATA.loreSeeds?.factions || ['merchant league']);
    const mood = options.mood || $('questMood')?.value || 'Faction pressure';
    const stakes = options.stakes || $('questStakes')?.value || 'Local reputation';
    const level = Number(options.level || $('questLevel')?.value || 8);
    const notes = options.notes || $('questNotes')?.value.trim() || pick(profiles.flatMap(p => p.questMotifs));
    const giver = makeName();
    const locations = profiles.flatMap(p => safeArray(p.locations));
    const hazards = profiles.flatMap(p => safeArray(p.hazards));
    const motifs = profiles.flatMap(p => safeArray(p.questMotifs));
    const primary = pick(motifs) || 'public trouble with private consequences';
    const placeA = pick(locations) || 'local landmark';
    const placeB = pick(locations.filter(x => x !== placeA)) || 'secondary location';
    const hazard = pick(hazards) || 'terrain pressure';
    return `<h4>Quest Help</h4><table>
      <tr><th>Biome Stack</th><td>${escapeHtml(stack.map(b => b.subcategory).join(' + '))}</td></tr>
      <tr><th>Faction / Patron</th><td>${escapeHtml(titleCase(faction))}</td></tr>
      <tr><th>Quest Giver</th><td>${escapeHtml(giver)}, who is very calm in the suspicious way only guilty people manage.</td></tr>
      <tr><th>Mood</th><td>${escapeHtml(mood)} · Level ${escapeHtml(level)}</td></tr>
      <tr><th>Hook</th><td>${escapeHtml(notes || primary)}. The first clue points to the ${escapeHtml(placeA)}.</td></tr>
      <tr><th>Objective Chain</th><td>1) Question a nervous witness. 2) Track the problem through the ${escapeHtml(placeA)}. 3) Survive or solve the ${escapeHtml(hazard)}. 4) Decide whether the final proof goes to ${escapeHtml(titleCase(faction))}, a rival, or the public.</td></tr>
      <tr><th>Second Location</th><td>The trail bends toward the ${escapeHtml(placeB)}, where the obvious villain is merely the loudest inconvenience.</td></tr>
      <tr><th>Complication</th><td>${escapeHtml(stakes)} is at risk, and the legal answer makes one innocent group suffer.</td></tr>
      <tr><th>Encounter Fit</th><td>Use an encounter from the same biome stack after the second clue, then let the terrain alter the fight instead of serving as wallpaper.</td></tr>
      <tr><th>Rewards</th><td>Coin, faction reputation, safer transit, a restricted service, a map-pin reveal, or one favor from someone important and irritating.</td></tr>
      <tr><th>Onyx Note</th><td>${escapeHtml(pick(DATA.loreSeeds?.cattyAdvice || ['Add a rumor.']))}</td></tr>
    </table>`;
  }
  function renderQuestHelp(){
    const html = buildQuestHtml({});
    const out = $('questOutput'); if(out) out.innerHTML = html;
    pageBot('Quest help prepared. It has claws, stakes, and at least one person lying badly.');
    return html;
  }
  function crNumber(cr){
    if(typeof cr === 'number') return cr;
    const s = String(cr || '0');
    if(s.includes('/')){ const [a,b]=s.split('/').map(Number); return b ? a/b : 0; }
    const n = Number(s); return Number.isFinite(n) ? n : 0;
  }
  function encounterPool(){
    const stack = selectedBiomeStack();
    const env = new Set(stack.flatMap(b => safeArray(b.profile.env)));
    const presets = safeArray(TOOLS.encounterPresets);
    const matched = presets.filter(m => safeArray(m.env).some(e => env.has(e)));
    return matched.length ? matched : presets;
  }
  function pickEncounterMonsters(level, count){
    const difficulty = $('encounterDifficulty')?.value || 'Medium';
    const maxByDifficulty = {Easy:level, Medium:level+1, Hard:level+3, Deadly:level+5, 'Social complication':level+1};
    const maxCr = Math.max(0.25, maxByDifficulty[difficulty] ?? (level+1));
    let pool = encounterPool().filter(m => crNumber(m.cr) <= maxCr);
    if(!pool.length) pool = encounterPool();
    const picks = [];
    for(let i=0;i<count;i++) picks.push(safeClone(pick(pool)));
    return picks;
  }
  function buildEncounterHtml(options={}){
    const stack = selectedBiomeStack();
    const level = Number(options.level || $('encounterLevel')?.value || 8);
    const count = Math.max(1, Math.min(12, Number(options.count || $('encounterCount')?.value || 4)));
    const style = options.style || $('encounterStyle')?.value || 'Combat';
    const difficulty = options.difficulty || $('encounterDifficulty')?.value || 'Medium';
    const profiles = stack.map(b => b.profile);
    const hazards = profiles.flatMap(p => safeArray(p.hazards));
    const locations = profiles.flatMap(p => safeArray(p.locations));
    const monsters = pickEncounterMonsters(level, count);
    const setup = `${style} in or near the ${pick(locations) || 'main route'}, shaped by ${stack.map(b => b.subcategory).join(' + ')}.`;
    const terrain = pick(hazards) || 'terrain pressure';
    const twist = pick([
      'One enemy wants to bargain after taking damage.',
      'The terrain hurts everyone who ignores it for two rounds.',
      'A bystander is more important than the monsters.',
      'The loudest threat is covering for a quieter faction move.',
      'The safest path costs reputation with someone watching.'
    ]);
    const rows = monsters.map(m => `<tr><td>${escapeHtml(m.icon || '')} ${escapeHtml(m.name)}</td><td>${escapeHtml(m.type)}</td><td>${escapeHtml(m.cr)}</td><td>${escapeHtml(m.ac)}</td><td>${escapeHtml(m.hp)}</td><td>${escapeHtml(m.dmg)}</td><td>${escapeHtml(safeArray(m.env).join(', '))}</td></tr>`).join('');
    return { monsters, html:`<h4>Biome Encounter</h4><table>
      <tr><th>Biome Stack</th><td>${escapeHtml(stack.map(b => b.subcategory).join(' + '))}</td></tr>
      <tr><th>Difficulty</th><td>${escapeHtml(difficulty)} · party level ${escapeHtml(level)}</td></tr>
      <tr><th>Setup</th><td>${escapeHtml(setup)}</td></tr>
      <tr><th>Terrain Rule</th><td>${escapeHtml(terrain)}: each round, make the terrain matter with movement, cover, visibility, footing, pressure, or noise.</td></tr>
      <tr><th>Monsters / NPCs</th><td><table><thead><tr><th>Name</th><th>Type</th><th>CR</th><th>AC</th><th>HP</th><th>Damage</th><th>Terrain Tags</th></tr></thead><tbody>${rows}</tbody></table></td></tr>
      <tr><th>Twist</th><td>${escapeHtml(twist)}</td></tr>
      <tr><th>Onyx Advice</th><td>Start with a visible choice, then punish only the choice the players actually make. I know, restraint is hard.</td></tr>
    </table>` };
  }
  function renderEncounterHelp(){
    const result = buildEncounterHtml({});
    const out = $('encounterOutput'); if(out) out.innerHTML = result.html;
    const body = $('encounterRows');
    if(body) body.innerHTML = result.monsters.map(m => `<tr><td>${escapeHtml(m.icon || '')} ${escapeHtml(m.name)}</td><td>${escapeHtml(m.type)}</td><td>${escapeHtml(m.cr)}</td><td>${escapeHtml(m.ac)}</td><td>${escapeHtml(m.hp)}</td><td>${escapeHtml(m.dmg)}</td><td>${escapeHtml(safeArray(m.env).join(', '))}</td></tr>`).join('');
    pageBot('Encounter prepared from the selected biomes. Try not to let the players adopt the monster. Again.');
    return result.html;
  }
  function renderEncounterIndexPreview(){
    const body = $('encounterRows'); if(!body) return;
    const pool = encounterPool().slice(0,80);
    body.innerHTML = pool.map(m => `<tr><td>${escapeHtml(m.icon || '')} ${escapeHtml(m.name)}</td><td>${escapeHtml(m.type)}</td><td>${escapeHtml(m.cr)}</td><td>${escapeHtml(m.ac)}</td><td>${escapeHtml(m.hp)}</td><td>${escapeHtml(m.dmg)}</td><td>${escapeHtml(safeArray(m.env).join(', '))}</td></tr>`).join('') || '<tr><td colspan="7">No encounter entries found.</td></tr>';
  }
  function generateEncounterCommand(rest=''){
    const result = buildEncounterHtml({});
    const out = $('encounterOutput'); if(out) out.innerHTML = result.html;
    showMainTab('tab-encounters');
    return result.html;
  }
  function copyElementText(id){
    const el = $(id); if(!el) return;
    const text = el.innerText || el.textContent || '';
    if(navigator.clipboard) navigator.clipboard.writeText(text).then(() => pageBot('Copied. I performed clerical labor. Tragic, but effective.')).catch(() => pageBot('Copy failed. Select the text manually, like some sort of peasant king.'));
  }
  function parseFilesFromInput(){
    const files = [...($('parseFilesInput')?.files || [])];
    if(!files.length){ pageBot('Choose files first. I cannot parse the concept of a file.'); return; }
    parseCampaignFiles(files);
  }
  function parseCampaignFiles(files){
    const readers = files.map(file => new Promise(resolve => {
      const ext = file.name.split('.').pop().toLowerCase();
      const binary = ['pdf','docx','zip','png','jpg','jpeg','webp'].includes(ext);
      if(binary){
        resolve(analyzeTextFile(file, '', `Browser-only body extraction is limited for .${ext}. Cataloged the file name and size; use text, HTML, JSON, or Markdown for full parsing.`));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(analyzeTextFile(file, String(reader.result || ''), ''));
      reader.onerror = () => resolve(analyzeTextFile(file, '', 'Could not read this file.'));
      reader.readAsText(file);
    }));
    Promise.all(readers).then(results => {
      state.memory.parsedFiles = safeArray(state.memory.parsedFiles).concat(results).slice(-40);
      saveMemory(); renderParsedFiles(); showMainTab('tab-files');
      pageBot(`Parsed ${results.length} file${results.length===1?'':'s'}. I found ${results.reduce((n,r)=>n+r.matches.length,0)} useful signals.`);
    });
  }
  function analyzeTextFile(file, text, warning){
    const lower = text.toLowerCase();
    const terms = ['settlement','province','npc','character','faction','quest','biome','location','pantheon','deity','race','alignment','transport','encounter','monster'];
    const matches = terms.filter(t => lower.includes(t));
    const names = [...text.matchAll(/\b(?:name|title|settlement|faction|location)\s*[:=]\s*["']?([^"'\n,;{}]{2,60})/gi)].slice(0,10).map(m => m[1].trim());
    const wordCount = text ? (text.match(/\b\S+\b/g) || []).length : 0;
    const preview = text.replace(/\s+/g,' ').trim().slice(0,420);
    return { name:file.name, size:file.size, type:file.type || 'unknown', parsedAt:new Date().toISOString(), wordCount, matches, names, preview, warning };
  }
  function renderParsedFiles(){
    const el = $('parsedFilesSummary'); if(!el) return;
    el.innerHTML = parsedFilesHtml();
  }
  function parsedFilesHtml(){
    const files = safeArray(state.memory.parsedFiles);
    if(!files.length) return '<div class="help">No parsed files yet. Choose campaign files from the File Parsing / Import section.</div>';
    return files.slice().reverse().map(f => `<article class="card"><h3>${escapeHtml(f.name)}</h3><p><span class="pill">${escapeHtml(String(f.wordCount||0))} words</span><span class="pill">${escapeHtml(formatBytes(f.size||0))}</span></p>${f.warning?`<p class="badtext">${escapeHtml(f.warning)}</p>`:''}<p><b>Signals:</b> ${safeArray(f.matches).map(x=>`<span class="pill">${escapeHtml(x)}</span>`).join(' ') || 'None'}</p>${safeArray(f.names).length?`<p><b>Detected names:</b> ${escapeHtml(safeArray(f.names).join(', '))}</p>`:''}<p class="muted">${escapeHtml(f.preview || 'No body text available.')}</p></article>`).join('');
  }
  function formatBytes(bytes){
    const n = Number(bytes || 0); if(n < 1024) return `${n} B`; if(n < 1048576) return `${(n/1024).toFixed(1)} KB`; return `${(n/1048576).toFixed(1)} MB`;
  }
  function dmTipHtml(kind='pacing'){
    const stack = selectedBiomeStack();
    const terrain = pick(stack.flatMap(b => safeArray(b.profile.hazards))) || 'terrain pressure';
    const tips = {
      pacing:['Open with a clear problem, cut travel once the choice is made, and end each scene with either a clue, cost, or new problem.','If the party debates too long, have the world act: a bell rings, a rival moves, a witness flees, or the terrain changes.'],
      clues:['Use three clues for every truth: one obvious, one earned through skill, and one social clue from an NPC with an agenda.','Never hide the only clue behind one roll. Hide extra context, shortcuts, or safer outcomes behind rolls.'],
      faction:['Give the faction a public promise, a private fear, and a rival. Every quest result should raise one faction and irritate another.','Let reputation change prices, access, guards, rumors, and who greets the party first.'],
      biome:[`Make ${terrain} matter every round or scene. If it does not affect movement, visibility, resources, noise, or time, it is decoration, not a biome.`,`The selected stack is ${stack.map(b=>b.subcategory).join(' + ')}. Blend them: one layer shapes travel, one shapes enemies, and one shapes clues.`],
      checklist:['Before session: define the opening image, three clues, two NPC wants, one combat pressure, one noncombat escape route, and the consequence of delay.','After session: note who gained power, who lost face, what location changed, and what rumor spreads by morning.']
    };
    const list = tips[kind] || tips.pacing;
    return `<h4>DM Tip: ${escapeHtml(titleCase(kind))}</h4><ul>${list.map(t => `<li>${escapeHtml(t)}</li>`).join('')}</ul><p class="onyx-muted">${escapeHtml(pick(DATA.loreSeeds?.cattyAdvice || ['Add a rumor.']))}</p>`;
  }
  function renderDmTip(kind){
    const out = $('dmToolsOutput'); if(out) out.innerHTML = dmTipHtml(kind);
    pageBot(`DM tip delivered. Naturally, it is correct.`);
  }
  const PANEL_DICE = [4,6,8,10,12,20];
  function setupDicePanel(){
    const grid = $('diceGridPanel'); if(!grid) return;
    grid.innerHTML = PANEL_DICE.map(d => `<div class="diebox" id="panelBoxd${d}"><div class="die-title"><span>d${d}</span><label class="include-wrap"><input type="checkbox" id="panelIncluded${d}" onchange="window.EmperorOnyxRuleBot.syncPanelDie(${d})"> Include</label></div><div class="animation-stage">${dieIcon(d)}</div><div class="die-controls"><label class="control-label">Number<select id="panelNumd${d}">${optionRange(1,20,1)}</select></label><label class="control-label">Modifier<select id="panelModd${d}">${optionRange(-30,30,0)}</select></label><button type="button" onclick="window.EmperorOnyxRuleBot.rollSingleDiePanel(${d})">Roll d${d}</button></div></div>`).join('');
  }
  function dieIcon(d){
    const points={4:'50,8 88,78 12,78',6:'18,18 82,18 82,82 18,82',8:'50,7 88,50 50,93 12,50',10:'50,6 86,30 75,86 25,86 14,30',12:'50,6 84,26 78,70 50,93 22,70 16,26',20:'50,6 90,35 75,88 25,88 10,35'}[d]||'50,8 88,78 12,78';
    return `<svg class="die-icon" viewBox="0 0 100 100" aria-hidden="true"><polygon points="${points}"/><text x="50" y="59" text-anchor="middle" font-size="28">${d}</text></svg>`;
  }
  function optionRange(start,end,selected){ return Array.from({length:end-start+1},(_,i)=>start+i).map(n=>`<option ${n===selected?'selected':''}>${n}</option>`).join(''); }
  function syncPanelDie(d){ const box=$('panelBoxd'+d), chk=$('panelIncluded'+d); if(box&&chk) box.classList.toggle('selected', chk.checked); }
  function panelConfig(d){ return { d, n:Number($('panelNumd'+d)?.value || 1), mod:Number($('panelModd'+d)?.value || 0), box:$('panelBoxd'+d) }; }
  function animatePanelDie(box,total){ if(!box) return; box.classList.remove('rolling'); void box.offsetWidth; box.classList.add('rolling'); box.querySelectorAll('.result-burst').forEach(x=>x.remove()); setTimeout(()=>{ box.classList.remove('rolling'); const b=h('div',{class:'result-burst',text:total}); box.appendChild(b); setTimeout(()=>b.remove(),3400); },820); }
  function rollPanelConfig(config){ const vals=[]; for(let i=0;i<config.n;i++) vals.push(randomInt(1,config.d)); const diceTotal=vals.reduce((a,b)=>a+b,0); const total=diceTotal+config.mod; animatePanelDie(config.box,total); return {...config, vals, diceTotal, total}; }
  function formatPanelRoll(r){ const mod = r.mod>=0?`+${r.mod}`:`${r.mod}`; return `${r.n}d${r.d}${mod}: [${r.vals.join(', ')}] = <strong>${r.total}</strong>`; }
  function addPanelRollLog(html){ const log=$('rollLogPanel'); if(!log) return; const stamp=new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}); const line=h('div',{html:`<strong>${stamp}</strong> • ${html}`}); log.prepend(line); }
  function rollSingleDiePanel(d){ addPanelRollLog(formatPanelRoll(rollPanelConfig(panelConfig(d)))); }
  function rollSelectedDicePanel(){ const selected=PANEL_DICE.filter(d => $('panelIncluded'+d)?.checked).map(panelConfig); if(!selected.length){ addPanelRollLog('No dice selected. Check Include on at least one die type first.'); return; } const results=selected.map(rollPanelConfig); const total=results.reduce((n,r)=>n+r.total,0); addPanelRollLog(`<span class="multi-roll"><strong>Combined total: ${total}</strong><br>${results.map(formatPanelRoll).join('<br>')}</span>`); }
  function panelQuickRoll(expr){ const result = rollExpression(expr); addPanelRollLog(result.html); }
  function normalizeSeed(notes){ return (notes || '').split(/[,.|;]/)[0].trim().toLowerCase(); }
  function makeName(){ const a=['Avar','Vel','Morn','Thessa','Brann','Sable','Ira','Nox','Eld','Korr','Luma','Vey']; const b=['wick','thorn','vane','mere','ross','cairn','dusk','vale','sorn','mar','lyre','brook']; return pick(a)+pick(b); }
  function pinCategory(type){ const t = String(type).toLowerCase(); if(/train|caravan|ferry|port|terminal|skyship|submarine|portal/.test(t)) return 'Transportation'; if(/temple|shrine|cathedral/.test(t)) return 'Religious'; if(/apothecary|healer|hospital/.test(t)) return 'Medical'; if(/market|merchant|bazaar|shop/.test(t)) return 'Commercial'; if(/tavern|inn|hostel/.test(t)) return 'Hospitality'; if(/library|academy|school|university/.test(t)) return 'Education'; if(/blacksmith|foundry|workshop/.test(t)) return 'Industry & Crafting'; if(/guard|barracks|court|hall/.test(t)) return 'Government & Civic'; return 'Special / General'; }
  function attachedLoreLibrary(){
    return window.ONYX_ATTACHED_LORE_LIBRARY || { sources:[], chunks:[] };
  }
  function loreSourceSummaryHtml(){
    const lib = attachedLoreLibrary();
    const sources = safeArray(lib.sources);
    if(!sources.length) return '<div class="onyx-card">No attached lore library loaded. The void shelves are bare.</div>';
    const rows = sources.map(s => `<tr><td>${escapeHtml(s.source)}</td><td>${escapeHtml(s.kind)}</td><td>${escapeHtml(String(s.words || 0))}</td></tr>`).join('');
    return `<div class="onyx-card"><div class="onyx-card-title">Attached Lore Library</div>${escapeHtml(String(lib.chunkCount || safeArray(lib.chunks).length))} searchable chunks from ${escapeHtml(String(sources.length))} sources. Try <code>${state.memory.prefix}lore Aelvanyr</code>, <code>${state.memory.prefix}lore pantheon</code>, <code>${state.memory.prefix}lore time</code>, <code>${state.memory.prefix}lore settlement</code>, or <code>${state.memory.prefix}lore Threads of Peace</code>.</div><table><thead><tr><th>Source</th><th>Kind</th><th>Words</th></tr></thead><tbody>${rows}</tbody></table>`;
  }
  function scoreLoreChunk(chunk, terms){
    const hay = `${chunk.source || ''} ${chunk.title || ''} ${safeArray(chunk.keywords).join(' ')} ${chunk.text || ''}`.toLowerCase();
    let score = 0;
    for(const term of terms){
      if(!term) continue;
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const hits = (hay.match(new RegExp(escaped, 'g')) || []).length;
      score += hits * (term.length > 4 ? 3 : 1);
      if(String(chunk.title || '').toLowerCase().includes(term)) score += 12;
      if(String(chunk.source || '').toLowerCase().includes(term)) score += 6;
      if(safeArray(chunk.keywords).join(' ').toLowerCase().includes(term)) score += 8;
    }
    return score;
  }
  function findAttachedLore(term, limit=8){
    const q = String(term || '').toLowerCase().trim();
    if(!q) return [];
    const terms = q.split(/\s+/).filter(Boolean).slice(0,8);
    return safeArray(attachedLoreLibrary().chunks)
      .map(chunk => ({ chunk, score:scoreLoreChunk(chunk, terms) }))
      .filter(item => item.score > 0)
      .sort((a,b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.chunk);
  }
  function compactLorePreview(text, q){
    const raw = String(text || '').replace(/\s+/g,' ').trim();
    if(!raw) return '';
    const firstTerm = String(q || '').split(/\s+/).find(Boolean);
    if(!firstTerm) return raw.slice(0,520) + (raw.length > 520 ? '…' : '');
    const idx = raw.toLowerCase().indexOf(firstTerm.toLowerCase());
    const start = idx > 160 ? idx - 160 : 0;
    const end = Math.min(raw.length, start + 720);
    return (start ? '…' : '') + raw.slice(start,end) + (end < raw.length ? '…' : '');
  }
  function attachedLoreHint(command){
    const hits = findAttachedLore(command, 2);
    if(!hits.length) return '';
    return `<div class="onyx-card"><div class="onyx-card-title">Lore Onyx sniffed out</div>${hits.map(h => `<p><strong>${escapeHtml(h.title || h.source)}</strong><br><span class="onyx-muted">${escapeHtml(h.source || '')}</span><br>${escapeHtml(compactLorePreview(h.text, command).slice(0,420))}</p>`).join('')}</div>`;
  }
  function searchLore(term){
    const q = String(term || '').toLowerCase().trim();
    if(!q) return `<h4>Lore Library</h4>${loreSourceSummaryHtml()}`;
    const local = Object.entries(state.memory.lore).filter(([k,v]) => (k + ' ' + v).toLowerCase().includes(q));
    const attached = findAttachedLore(q, 8);
    if(!local.length && !attached.length) return `No lore matched <code>${escapeHtml(term)}</code>. The void shelves rustle, but produce nothing.`;
    const localHtml = local.length ? `<h4>Local Lore Notes</h4>${local.slice(0,8).map(([k,v]) => `<div class="onyx-card"><div class="onyx-card-title">${escapeHtml(k)}</div>${escapeHtml(v)}</div>`).join('')}` : '';
    const attachedHtml = attached.length ? `<h4>Attached Belavadös Lore</h4>${attached.map(hit => `<div class="onyx-card"><div class="onyx-card-title">${escapeHtml(hit.title || hit.source)}</div><div class="onyx-muted">${escapeHtml(hit.source || '')} · ${safeArray(hit.keywords).slice(0,6).map(escapeHtml).join(', ')}</div><p>${escapeHtml(compactLorePreview(hit.text, q))}</p></div>`).join('')}` : '';
    return `${localHtml}${attachedHtml}`;
  }
  function remember(rest){ const idx = rest.indexOf(':'); if(idx === -1) return 'Use <code>remember key: text</code>. I require labels, unlike certain chaotic bipeds.'; const key=rest.slice(0,idx).trim().toLowerCase(); const value=rest.slice(idx+1).trim(); if(!key || !value) return 'Both key and text are required.'; state.memory.lore[key] = value; return `Remembered <code>${escapeHtml(key)}</code> locally in this browser.`; }
  function forget(rest){ const key=rest.trim().toLowerCase(); if(state.memory.lore[key]){ delete state.memory.lore[key]; return `Forgot <code>${escapeHtml(key)}</code>. Into the void with it.`; } return `No lore key named <code>${escapeHtml(key)}</code>.`; }
  function addTask(text){ if(!text) return 'Task text required. I refuse to chase invisible mice.'; state.memory.tasks.push({text,done:false,createdAt:new Date().toISOString()}); return `Task added #${state.memory.tasks.length}: ${escapeHtml(text)}`; }
  function doneTask(rest){ const i = Number(rest)-1; if(!state.memory.tasks[i]) return 'No such task. The task has hidden under the sofa.'; state.memory.tasks[i].done = true; return `Marked task #${i+1} complete. Acceptable.`; }
  function removeTask(rest){ const i = Number(rest)-1; if(!state.memory.tasks[i]) return 'No such task.'; const [removed] = state.memory.tasks.splice(i,1); return `Removed task: ${escapeHtml(removed.text)}`; }
  function addReminder(rest){
    const match = rest.match(/^(\d+)(m|h|d)\s+(.+)$/i); let time,text;
    if(match){ const amount=Number(match[1]); const unit=match[2].toLowerCase(); const mult=unit === 'm' ? 60000 : unit === 'h' ? 3600000 : 86400000; time = Date.now() + amount * mult; text = match[3]; }
    else { const parts = rest.split(/\s+/); const maybeDate = parts.slice(0,2).join(' '); const date = new Date(maybeDate); if(Number.isNaN(date.getTime())) return 'Use <code>remind 10m feed the players clues</code>, <code>remind 2h prep tavern</code>, or <code>remind 2026-06-06 18:30 session prep</code>.'; time = date.getTime(); text = parts.slice(2).join(' ') || 'Reminder'; }
    const reminder = { id:(window.crypto?.randomUUID?.() || String(Date.now())), time, text, done:false };
    state.memory.reminders.push(reminder); scheduleReminder(reminder); return `Reminder set for ${new Date(time).toLocaleString()}: ${escapeHtml(text)}. This works while the page is open.`;
  }
  function hydrateReminders(){ for(const reminder of state.memory.reminders.filter(r => !r.done)) scheduleReminder(reminder); }
  function scheduleReminder(reminder){ const delay = reminder.time - Date.now(); if(delay <= 0) return; if(state.timers.has(reminder.id)) clearTimeout(state.timers.get(reminder.id)); state.timers.set(reminder.id, setTimeout(() => { reminder.done = true; saveMemory(); if(!state.open) toggleOpen(true); addBot(`<h4>Reminder</h4>${escapeHtml(reminder.text)}<br><span class="onyx-muted">I have yelled. My civic duty is complete.</span>`); }, Math.min(delay,2147483647))); }
  function makePoll(rest){ const parts = rest.split('|').map(s=>s.trim()).filter(Boolean); if(parts.length < 3) return 'Use <code>poll question | option 1 | option 2</code>.'; const poll = {id:Date.now(), question:parts[0], options:parts.slice(1).map(o=>({text:o,votes:0}))}; state.memory.polls.push(poll); return renderPoll(poll); }
  function renderPoll(poll){
    setTimeout(() => { const card = state.body.querySelector(`[data-poll-id="${poll.id}"]`); if(!card) return; card.querySelectorAll('button[data-option]').forEach(btn => btn.addEventListener('click', () => { const idx = Number(btn.dataset.option); poll.options[idx].votes++; saveMemory(); addBot(renderPoll(poll)); })); },0);
    const buttons = poll.options.map((o,i) => `<button class="onyx-small-button" data-option="${i}">${escapeHtml(o.text)} (${o.votes})</button>`).join('');
    return `<div class="onyx-card" data-poll-id="${poll.id}"><div class="onyx-card-title">${escapeHtml(poll.question)}</div>${buttons}</div>`;
  }
  function promptIdea(rest){ const theme = rest || 'dark fantasy steampunk settlement'; const biome = pick(DATA.loreSeeds?.biomes || ['deep cavern']); return `<h4>Prompt Idea</h4><div class="onyx-card">${escapeHtml(theme)}, ${biome}, painterly dark fantasy, readable landmark silhouettes, visitable buildings, practical map-pin spaces, moody brass lighting, layered districts, cinematic atmosphere, no modern cars, no airplanes, one black cat in a green plaid bowtie hidden somewhere tasteful.</div>`; }
  function scanPage(){
    if(!isDmMode()) return 'DM scan is locked. Add <code>#dm-editor</code> to the URL. I guard the cupboards.';
    const headings = [...document.querySelectorAll('h1,h2,h3')].slice(0,12).map(e => e.textContent.trim()).filter(Boolean);
    const buttons = [...document.querySelectorAll('button')].slice(0,24).map(e => e.textContent.trim() || e.getAttribute('aria-label') || 'unnamed button');
    const forms = document.querySelectorAll('form,input,textarea,select').length;
    const tables = document.querySelectorAll('table').length;
    const brokenImgs = [...document.images].filter(img => img.complete && img.naturalWidth === 0).map(img => img.src).slice(0,8);
    return `<h4>DM Page Scan</h4><table><tr><th>Headings</th><td>${headings.map(escapeHtml).join('<br>') || 'None found'}</td></tr><tr><th>Buttons</th><td>${buttons.map(escapeHtml).join('<br>') || 'None found'}</td></tr><tr><th>Inputs / Forms</th><td>${forms}</td></tr><tr><th>Tables</th><td>${tables}</td></tr><tr><th>Broken Images</th><td>${brokenImgs.length ? brokenImgs.map(escapeHtml).join('<br>') : 'None detected after load'}</td></tr><tr><th>Onyx Advice</th><td>If a page is white, check console errors, missing script paths, invalid JSON, and CSS hiding the root. Also: stop leaving syntax errors on my lawn.</td></tr></table>`;
  }
  function renderDmTools(){
    if(!isDmMode()) return '<h4>DM Tools Locked</h4><p>Add <code>#dm-editor</code> to your URL to unlock page scan and DM-only helper commands.</p>';
    return `<h4>DM Tools</h4><p>Unlocked. I am watching the gate.</p><table><tr><th>Scan</th><td><code>${escapeHtml(state.memory.prefix)}scan</code> checks headings, buttons, forms, tables, and broken images.</td></tr><tr><th>Quest Help</th><td><code>${escapeHtml(state.memory.prefix)}quest stolen cargo</code> uses the selected biome stack.</td></tr><tr><th>Encounter</th><td><code>${escapeHtml(state.memory.prefix)}encounter</code> builds a biome-aware encounter from the monster/NPC index.</td></tr><tr><th>Files</th><td><code>${escapeHtml(state.memory.prefix)}files</code> summarizes parsed campaign files.</td></tr><tr><th>RuleBot Engine</th><td>${Bot ? `Loaded version ${escapeHtml(Bot.version || 'unknown')}` : 'Missing'}</td></tr><tr><th>Current Generated Data</th><td>${state.workbench.current ? escapeHtml(describeCurrent(state.workbench.current)) : 'None'}</td></tr><tr><th>Exports</th><td><code>${escapeHtml(state.memory.prefix)}export-rulebot</code>, <code>${escapeHtml(state.memory.prefix)}export-player</code>, <code>${escapeHtml(state.memory.prefix)}export-html</code></td></tr></table>`;
  }
  function exportMemory(returnMessage=false){
    const payload = { onyxMemory:state.memory, workbench:state.workbench, exportedAt:new Date().toISOString(), app:DATA.appName || 'Emperor Onyx RuleBot' };
    const blob = new Blob([JSON.stringify(payload,null,2)], {type:'application/json'});
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='emperor-onyx-rulebot-memory.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    if(returnMessage) return 'Exported Onyx memory JSON. Do not let it near water bowls.';
  }
  function importMemory(){
    const ta = $('onyx-import-json');
    try{
      const incoming = JSON.parse(ta.value);
      const mem = incoming.onyxMemory || incoming;
      state.memory = combineDeep(clone(defaults), mem);
      if(incoming.workbench) state.workbench = Object.assign({ current:null, history:[], npcCap:350, playerSafe:false }, incoming.workbench);
      saveMemory(); saveWorkbench(true); state.importer.classList.add('onyx-hidden'); addBot('Imported Onyx memory. I have sniffed it and found it acceptable.'); renderTab(); renderWorkbench();
    } catch(err){ addBot(`<span class="onyx-danger">Import failed:</span> ${escapeHtml(err.message)}`); }
  }
  function setPrefix(rest){ const prefix=rest.trim(); if(!prefix || prefix.length > 8) return 'Use a short prefix like <code>!</code>, <code>.</code>, <code>/</code>, or <code>onyx</code>.'; state.memory.prefix = prefix; return `Prefix changed to <code>${escapeHtml(prefix)}</code>. I shall answer, reluctantly.`; }
  function food(){
    setOnyxMood('hungry','responding','Wet-food diplomacy has begun.',1600);
    const treat = pick(DATA.persona?.treats || ['wet food']);
    const stolen = pick(DATA.persona?.favoriteThingsToSteal || ['the flavor from cheese']);
    return `<h4>Wet-Food Diplomacy</h4><div class="onyx-card">You offer ${escapeHtml(treat)}. Lord Onyx Blepman screams like a Victorian child, accepts tribute, high-fives for treats, and becomes 27% more helpful.<br><br><span class="onyx-muted">Likely attempted theft today: ${escapeHtml(stolen)}.</span></div>`;
  }
  function comfortCheck(){
    setOnyxMood('thoughtful','responding','Onyx is doing a best-friend check-in.',1800);
    const line = pick(DATA.persona?.careLines || ['Take care of yourself too.']);
    return `<h4>Onyx Check-In</h4><div class="onyx-card">${escapeHtml(line)}<br><br>He curls on your legs, strokes you for pets, and keeps one royal eye on the world so you do not have to carry it alone.</div>`;
  }
  function onyxIdentityCard(){
    const p = DATA.persona || {};
    const petNames = safeArray(p.petNames).slice(0,18).map(n => `<span class="pill">${escapeHtml(n)}</span>`).join(' ');
    const commands = safeArray(p.trainedCommands).map(n => `<span class="pill">${escapeHtml(n)}</span>`).join(' ');
    const habits = safeArray(p.habits).map(n => `<li>${escapeHtml(n)}</li>`).join('');
    return `<h4>${escapeHtml(p.fullLegalName || 'Lord Onyx Blepman')}</h4>
      <div class="onyx-card"><div class="onyx-card-title">Who He Is</div>${escapeHtml(p.relationship || p.identity || 'Papa’s best friend and tiny void emperor.')}</div>
      <div class="onyx-card"><div class="onyx-card-title">Voice</div>${escapeHtml(p.voice || '')}</div>
      <div class="onyx-card"><div class="onyx-card-title">Pet Names</div>${petNames}</div>
      <div class="onyx-card"><div class="onyx-card-title">Trained Commands</div>${commands}</div>
      <div class="onyx-card"><div class="onyx-card-title">Onyx Habits</div><ul>${habits}</ul></div>`;
  }
  function fallback(text){
    const lower = text.toLowerCase();
    if(/\b(generate|create|make|build|find|search|show)\b/.test(lower)) return widgetRuleBot(text);
    if(lower.includes('quest') || lower.includes('faction')) return generateQuest(text);
    if(lower.includes('encounter') || lower.includes('monster')) return generateEncounterCommand(text);
    if(lower.includes('tip') || lower.includes('dm tool')) return dmTipHtml('pacing');
    if(lower.includes('location') || lower.includes('tavern') || lower.includes('shop')) return generateLocation(text);
    return `${grumble()} I can help with dice, NPCs, settlements, province batches, locations, faction quests, biome encounters, file parsing, tasks, reminders, polls, lore search, JSON exports, DM page scanning, and best-friend check-ins. Try <code>${escapeHtml(state.memory.prefix)}help</code>, <code>${escapeHtml(state.memory.prefix)}comfort</code>, or <code>${escapeHtml(state.memory.prefix)}who</code>.`;
  }

  window.EmperorOnyxRuleBot = {
    init,
    state,
    submit,
    runWorkbenchCommand,
    renderWorkbench,
    exportCurrentJson,
    exportPlayerJson,
    exportSettlementHtml,
    copyCurrentJson,
    syncPanelDie,
    rollSingleDiePanel,
    renderQuestHelp,
    renderEncounterHelp,
    parseCampaignFiles,
    getCurrent:() => state.workbench.current,
    setLore:(lore) => { state.lore = Bot ? Bot.normalizeLore(lore) : lore; populateSelects(); renderWorkbench(); }
  };
  window.EmperorOnyx = window.EmperorOnyxRuleBot;
  document.addEventListener('DOMContentLoaded', init);
})();
