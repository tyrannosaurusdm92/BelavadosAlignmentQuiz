
(function(){
  'use strict';
  const PLAYER_KEY='BelavadosMapPlayerCommittedData_v1';
  const PLAYER_EMBED_ID='belavados-player-committed-data';
  const $=id=>document.getElementById(id);
  const txt=(el)=>el?el.textContent.trim():'';
  const isDm=()=>String(location.hash||'').toLowerCase()==='#dm-editor';
  function closestSectionWithHeading(headingText){
    const wanted=String(headingText||'').toLowerCase();
    const heads=[...document.querySelectorAll('h2,h3,h4')];
    const h=heads.find(n=>txt(n).toLowerCase()===wanted);
    return h ? (h.closest('.sidebar-section') || h.closest('section.card') || h.closest('div')) : null;
  }
  function markDmOnly(el){ if(el) el.classList.add('dm-only'); }
  function markPlayerOnly(el){ if(el) el.classList.add('player-only'); }
  function markUi(){
    markDmOnly(document.querySelector('.command-note'));
    markDmOnly(document.querySelector('.mapping-system'));
    markDmOnly(closestSectionWithHeading('Border controls'));
    markDmOnly(closestSectionWithHeading('Settlement Metadata Editor'));
    markDmOnly(closestSectionWithHeading('Persistence and file controls'));
    markDmOnly(document.querySelector('.province-pin-system'));
    markDmOnly($('exportProvinceZip'));
    markDmOnly($('scanTerrain'));
    markDmOnly($('scanSettlements'));
    markDmOnly($('scanStep')?.closest('label'));
    markDmOnly($('scanMode')?.closest('label'));
    markDmOnly($('newSettlementType')?.closest('.control-grid'));
    markDmOnly($('dataBox')?.closest('section.card'));
    const terrainCard=[...document.querySelectorAll('section.card')].find(s=>txt(s.querySelector('h2')).toLowerCase()==='province terrain scanner');
    markDmOnly(terrainCard);
    [...document.querySelectorAll('.map-card .toolbar .pill')].forEach(p=>{ if(/drag|edit live geometry/i.test(p.textContent)) markDmOnly(p); });
    [...document.querySelectorAll('header button')].forEach(btn=>{ if(/edit/i.test(btn.textContent) || /#dm-editor/i.test(btn.getAttribute('onclick')||'')) markDmOnly(btn); });
    const sidebar=document.querySelector('aside.side section.card');
    if(sidebar && !$('playerReadonlyBanner')){
      const banner=document.createElement('div');
      banner.id='playerReadonlyBanner';
      banner.className='readonly-banner player-only';
      banner.innerHTML='<strong>Player/read-only map.</strong> Click a province to open its province map. Settlement pins can be selected and viewed, but map geometry, pins, imports, scans, and exports are locked unless the URL ends in <code>#dm-editor</code>.';
      const first=sidebar.querySelector('.sidebar-section') || sidebar.firstElementChild;
      sidebar.insertBefore(banner, first ? first.nextSibling : null);
    }
    const persistence=closestSectionWithHeading('Persistence and file controls');
    const grid=persistence?.querySelector('.control-grid');
    if(grid && !$('commitPlayerMap')){
      const btn=document.createElement('button');
      btn.id='commitPlayerMap';
      btn.type='button';
      btn.className='primary wide';
      btn.textContent='Commit to Player Map';
      grid.insertBefore(btn, grid.firstChild);
      const status=document.createElement('span');
      status.id='commitPlayerStatus';
      status.className='commit-status';
      persistence.appendChild(status);
    }
    const playerBtn=$('exportPlayerHtml');
    if(playerBtn) playerBtn.textContent='Export committed player HTML';
  }
  function modeLabels(){
    const dm=isDm();
    document.body.classList.toggle('dm-mode',dm);
    document.body.classList.toggle('player-mode',!dm);
    const title=document.querySelector('title');
    const h1=document.querySelector('header h1');
    const sub=document.querySelector('header .sub');
    if(dm){
      if(title) title.textContent='Belavadös DM Interactive Map Command Center';
      if(h1) h1.textContent='Belavadös DM Interactive Map Command Center';
      if(sub) sub.innerHTML='DM editor unlocked through <code>#dm-editor</code>. Edit the map, then use <strong>Commit to Player Map</strong> to publish the current live state to the read-only player view.';
    }else{
      if(title) title.textContent='Belavadös Player Interactive Map';
      if(h1) h1.textContent='Belavadös Player Interactive Map';
      if(sub) sub.innerHTML='Read-only world and province map viewer. Open this file with <code>#dm-editor</code> at the end of the URL to reveal the DM editing tools.';
    }
    const view=(typeof currentMapView!=='undefined')?currentMapView:(window.currentMapView||'main');
    const titleBtn=$('exportProvinceZip');
    if(titleBtn) titleBtn.classList.toggle('visible', dm && String(view)==='province');
    const pill=$('viewModePill');
    if(pill && !dm) pill.textContent=(String(view)==='province')?'Province map — read only':'Main world map — read only';
  }
  function jsonForScript(data){
    return JSON.stringify(data,null,2).replace(/</g,'\\u003C').replace(/-->/g,'--\\u003E');
  }
  function currentData(){
    try{ if(typeof saveSettlementEditor==='function' && isDm()) saveSettlementEditor(); }catch(e){ console.warn('Settlement save skipped during commit:',e); }
    try{ if(typeof serialize==='function') return serialize(); }catch(e){ console.warn('Serialize failed:',e); }
    return null;
  }
  function upsertEmbeddedData(data){
    if(!data)return;
    let node=$(PLAYER_EMBED_ID);
    if(!node){
      node=document.createElement('script');
      node.type='application/json';
      node.id=PLAYER_EMBED_ID;
      document.body.appendChild(node);
    }
    node.textContent=jsonForScript(data);
  }
  function applyData(data){
    if(!data || isDm()) return false;
    try{
      if(typeof applyBordersData==='function'){
        applyBordersData(data);
      }else if(typeof convertInitial==='function' && typeof refreshSelect==='function'){
        state=convertInitial(data);
        refreshSelect();
      }else{
        return false;
      }
      try{ if(typeof fitMap==='function') fitMap(); }catch(e){}
      try{ if(typeof updateStats==='function') updateStats(); }catch(e){}
      try{ if(typeof drawMap==='function') drawMap(); }catch(e){}
      return true;
    }catch(e){ console.warn('Committed player data could not be applied:',e); return false; }
  }
  function committedData(){
    let embedded=null, stored=null;
    try{ const node=$(PLAYER_EMBED_ID); if(node && node.textContent.trim()) embedded=JSON.parse(node.textContent); }catch(e){ console.warn('Embedded player data unreadable:',e); }
    try{ const raw=localStorage.getItem(PLAYER_KEY); if(raw) stored=JSON.parse(raw); }catch(e){ console.warn('Local committed player data unreadable:',e); }
    return stored || embedded;
  }
  function loadCommittedPlayerData(){
    if(isDm()) return;
    const data=committedData();
    if(data) applyData(data);
  }
  function commitPlayerMap(){
    const data=currentData();
    if(!data){ alert('Nothing could be committed yet.'); return; }
    data.playerMapCommit={committedAt:new Date().toISOString(),mode:'read-only player map',dmBackdoor:'#dm-editor'};
    try{ localStorage.setItem(PLAYER_KEY, JSON.stringify(data)); }catch(e){ console.warn('Local player commit failed:',e); }
    upsertEmbeddedData(data);
    const box=$('dataBox'); if(box) box.value=JSON.stringify(data,null,2);
    const status=$('commitPlayerStatus');
    if(status) status.textContent='Committed to this browser’s read-only player map at '+new Date().toLocaleString()+'. Use “Export committed player HTML” to save/share a self-contained player file.';
    alert('Committed to player map. Normal opening is now read-only; use #dm-editor to edit again.');
  }
  function stripPriorEmbed(html){
    const re=new RegExp('\\n?<script[^>]*id=["\\\']'+PLAYER_EMBED_ID+'["\\\'][\\s\\S]*?<\\/script>','gi');
    return html.replace(re,'');
  }
  function playerHtmlSnapshot(){
    const data=currentData() || committedData();
    if(data) data.playerMapCommit={committedAt:new Date().toISOString(),mode:'exported read-only player map',dmBackdoor:'#dm-editor'};
    let html=document.documentElement.outerHTML;
    html=stripPriorEmbed(html);
    html=html.replace(/<body[^>]*>/i,'<body class="player-mode">');
    html=html.replace(/<title>[\s\S]*?<\/title>/i,'<title>Belavadös Player Interactive Map<\/title>');
    html=html.replace('Belavadös DM Interactive Map Command Center','Belavadös Player Interactive Map');
    const embed=data?'\n<script type="application/json" id="'+PLAYER_EMBED_ID+'">\n'+jsonForScript(data)+'\n<\/script>\n':'';
    if(/<\/body>/i.test(html)) html=html.replace(/<\/body>/i,embed+'</body>');
    else html+=embed;
    return html;
  }
  function installButtons(){
    const commit=$('commitPlayerMap');
    if(commit) commit.onclick=commitPlayerMap;
    ['returnMainMap','jumpProvince','fit'].forEach(id=>{ const b=$(id); if(b) b.addEventListener('click',()=>setTimeout(modeLabels,40)); });
    const playerBtn=$('exportPlayerHtml');
    if(playerBtn){
      playerBtn.onclick=function(){
        const html=playerHtmlSnapshot();
        if(typeof download==='function') download('belavados_map_PLAYER.html', html, 'text/html');
      };
    }
  }
  function playerCanvasClick(ev){
    if(isDm() || ev.target!==$('mapCanvas')) return;
    if(typeof screenToMap!=='function') return;
    ev.preventDefault();
    ev.stopPropagation();
    ev.stopImmediatePropagation?.();
    const q=screenToMap(ev);
    try{
      if(String(currentMapView||'main')==='province'){
        const p=(typeof current==='function')?current():null;
        if(!p) return;
        let nearest=-1,dist=Infinity;
        (p.settlements||[]).forEach((s,i)=>{const d=Math.hypot(s.x-q.x,s.y-q.y); if(d<dist){dist=d;nearest=i;}});
        const scale=(typeof activeScale==='function'?activeScale():1) || 1;
        if(nearest>=0 && dist<(16/Math.max(.001,scale))){
          selectedSettlementIndex=nearest;
          if(typeof renderSettlementSelect==='function') renderSettlementSelect();
          if(typeof drawMap==='function') drawMap();
          if(typeof updateStats==='function') updateStats();
          modeLabels();
        }
      }else{
        if(typeof provinceAt==='function' && typeof openProvinceMap==='function'){
          const idx=provinceAt(q.x,q.y);
          if(idx>=0){ openProvinceMap(idx); modeLabels(); }
        }
      }
    }catch(e){ console.warn('Read-only canvas click failed:',e); }
  }
  function blockPlayerEditEvents(ev){
    if(isDm()) return;
    const canvas=$('mapCanvas');
    if(ev.target===canvas && (ev.type==='pointerdown' || ev.type==='contextmenu')){
      ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation?.();
      return;
    }
    const editControl=ev.target.closest?.('.dm-only, #saveProvince, #resetSelectedBorder, #applyUniversalBorderWidth, #saveSettlementMeta, #addSettlementCenter, #importJson, #uploadWorldMap, #exportHtml, #exportJson, #exportProvinceZip, #scanTerrain, #scanSettlements');
    if(editControl){ ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation?.(); }
  }
  function initialize(){
    markUi();
    modeLabels();
    installButtons();
    setTimeout(loadCommittedPlayerData, 120);
    setTimeout(modeLabels, 180);
  }
  document.addEventListener('pointerdown', blockPlayerEditEvents, true);
  document.addEventListener('contextmenu', blockPlayerEditEvents, true);
  document.addEventListener('click', playerCanvasClick, true);
  document.addEventListener('click', blockPlayerEditEvents, true);
  window.addEventListener('hashchange', ()=>{ modeLabels(); setTimeout(loadCommittedPlayerData,50); });
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', initialize);
  else initialize();
  window.BelavadosPlayerMapCommit={commit:commitPlayerMap,load:loadCommittedPlayerData,key:PLAYER_KEY,embedId:PLAYER_EMBED_ID};
})();


/* Player-side NPC/location/search studio merged from the smaller player viewer. */
(function(){
  'use strict';
  const ids={root:'bvPlayerStudio',province:'bvpsProvince',settlement:'bvpsSettlement',kind:'bvpsKind',search:'bvpsSearch',results:'bvpsResults',note:'bvpsNote',reload:'bvpsReload',clear:'bvpsClear'};
  let selectedItemId=null;
  function $(id){return document.getElementById(id);}
  function text(v){return String(v==null?'':v);}
  function slug(v){return text(v).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[’']/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}
  function seed(){return window.BELAVADOS_PLAYER_SEED || (window.BELAVADOS_DM_MAP_BOOTSTRAP&&window.BELAVADOS_DM_MAP_BOOTSTRAP.playerSeedData) || {provinces:[],items:[]};}
  function serialized(){try{return (typeof window.serialize==='function'?window.serialize():(typeof serialize==='function'?serialize():null));}catch(e){return null;}}
  function provinces(){
    const ser=serialized();
    if(ser && Array.isArray(ser.provinces) && ser.provinces.length){
      return ser.provinces.map((p,i)=>({id:slug(p.province||p.name||('province-'+i)),name:p.province||p.name||('Province '+(i+1)),settlements:(p.settlements||[]).map((s,j)=>({id:s.id||slug(s.name||('settlement-'+j)),name:s.name||('Settlement '+(j+1)),type:s.pinType||s.type||'',raw:s}))}));
    }
    const sd=seed();
    return (sd.provinces||[]).map(p=>({id:p.id||slug(p.name),name:p.name,settlements:p.settlements||[]}));
  }
  function items(){
    const sd=seed();
    const base=(sd.items||[]).map(it=>({...it,province:it.province||slug(it.provinceName||''),settlement:it.settlement||slug(it.settlementName||'')}));
    const ser=serialized();
    if(ser && Array.isArray(ser.provinces)){
      ser.provinces.forEach(p=>{
        const pid=slug(p.province||p.name);
        (p.settlements||[]).forEach((s,j)=>{
          base.push({id:'settlement-'+pid+'-'+(s.id||j),name:s.name||'Unnamed settlement',type:'location',province:pid,settlement:s.id||slug(s.name||('settlement-'+j)),description:(s.notes||s.description||'Player-visible settlement pin from the committed DM map.'),goods:s.goods||[],services:s.transportation||s.services||[],x:s.x,y:s.y,source:'dm-settlement'});
        });
      });
    }
    return base;
  }
  function ensureUi(){
    if($(ids.root)) return;
    const aside=document.querySelector('aside.side section.card') || document.querySelector('aside.side') || document.body;
    const root=document.createElement('div');
    root.id=ids.root;
    root.className='player-only';
    root.innerHTML='<h2>Player Viewer Studio</h2><div class="bvps-body"><div class="bvps-note" id="'+ids.note+'">Search NPCs, major locations, transport spots, quest hooks, goods, and services from the committed player map.</div><div class="bvps-grid"><label>Province<select id="'+ids.province+'"></select></label><label>Settlement<select id="'+ids.settlement+'"></select></label><label>Icon layer<select id="'+ids.kind+'"><option value="all">All player icons</option><option value="npc">NPC icons</option><option value="location">Major locations</option><option value="transport">Major public transportation spots</option><option value="quest">Quest hot spots</option></select></label><label>Search goods, services, NPCs<input id="'+ids.search+'" placeholder="maps, rations, ferry, rumors..." /></label></div><div class="bvps-actions"><button type="button" id="'+ids.reload+'">Reload dm_map.json</button><button type="button" id="'+ids.clear+'">Clear Player Highlight</button></div><div class="bvps-results" id="'+ids.results+'"></div></div>';
    const banner=document.getElementById('playerReadonlyBanner');
    if(banner && banner.parentNode) banner.parentNode.insertBefore(root,banner.nextSibling);
    else aside.insertBefore(root, aside.firstChild ? aside.firstChild.nextSibling : null);
    $(ids.province).addEventListener('change',()=>{populateSettlements(); render();});
    $(ids.settlement).addEventListener('change',render);
    $(ids.kind).addEventListener('change',render);
    $(ids.search).addEventListener('input',render);
    $(ids.reload).addEventListener('click',async()=>{ if(window.BelavadosImportBridge) await window.BelavadosImportBridge.loadBootstrap(); populate(); render(); });
    $(ids.clear).addEventListener('click',()=>{selectedItemId=null; document.querySelectorAll('.bvps-selected').forEach(e=>e.classList.remove('bvps-selected')); try{ if(typeof drawMap==='function') drawMap(); }catch(e){} });
  }
  function populate(){
    ensureUi();
    const sel=$(ids.province); if(!sel) return;
    const ps=provinces();
    const old=sel.value;
    sel.innerHTML='<option value="">Whole world</option>'+ps.map(p=>'<option value="'+p.id+'">'+escapeHtml(p.name)+'</option>').join('');
    if([...sel.options].some(o=>o.value===old)) sel.value=old;
    populateSettlements();
  }
  function populateSettlements(){
    const prov=$(ids.province)?.value||'';
    const st=$(ids.settlement); if(!st) return;
    const ps=provinces();
    const p=ps.find(x=>x.id===prov);
    const old=st.value;
    st.disabled=!prov;
    st.innerHTML=prov?'<option value="">All settlements in province</option>':'<option value="">Whole world / select province first</option>';
    if(p) st.innerHTML += (p.settlements||[]).map(s=>'<option value="'+(s.id||slug(s.name))+'">'+escapeHtml(s.name||s.id)+'</option>').join('');
    if([...st.options].some(o=>o.value===old)) st.value=old;
  }
  function escapeHtml(s){return text(s).replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));}
  function itemText(it){return [it.name,it.type,it.description,(it.goods||[]).join(' '),(it.services||[]).join(' '),it.province,it.settlement].join(' ').toLowerCase();}
  function filtered(){
    const prov=$(ids.province)?.value||'';
    const sett=$(ids.settlement)?.value||'';
    const kind=$(ids.kind)?.value||'all';
    const q=($(ids.search)?.value||'').toLowerCase().trim();
    return items().filter(it=>{
      const ip=it.province||slug(it.provinceName||'');
      const is=it.settlement||slug(it.settlementName||'');
      if(prov && ip!==prov) return false;
      if(sett && is!==sett) return false;
      if(kind!=='all' && it.type!==kind) return false;
      if(q && !itemText(it).includes(q)) return false;
      return true;
    }).slice(0,150);
  }
  function render(){
    ensureUi();
    const box=$(ids.results); if(!box) return;
    const list=filtered();
    const note=$(ids.note);
    if(note) note.textContent=list.length+' matching player-visible entr'+(list.length===1?'y':'ies')+'. Use Show on map to jump/highlight when map coordinates are available.';
    if(!list.length){ box.innerHTML='<div class="bvps-entry"><strong>No player-visible entries found.</strong><small>Try Whole world, All player icons, or a broader search term.</small></div>'; return; }
    box.innerHTML=list.map(it=>'<div class="bvps-entry '+(it.id===selectedItemId?'bvps-selected':'')+'" data-bvps-id="'+escapeHtml(it.id)+'"><strong>'+escapeHtml(it.name||'Unnamed')+'</strong><small>'+escapeHtml((it.type||'entry')+' • '+(it.province||'world')+(it.settlement?' / '+it.settlement:''))+'</small><div>'+escapeHtml(it.description||'')+'</div><div class="bvps-tags">'+(it.goods||[]).map(g=>'<span class="bvps-tag">goods: '+escapeHtml(g)+'</span>').join('')+(it.services||[]).map(s=>'<span class="bvps-tag">'+escapeHtml(s)+'</span>').join('')+'</div><div class="bvps-actions"><button type="button" data-bvps-show="'+escapeHtml(it.id)+'">Show on map</button></div></div>').join('');
    box.querySelectorAll('[data-bvps-show]').forEach(btn=>btn.addEventListener('click',()=>showOnMap(btn.getAttribute('data-bvps-show'))));
  }
  function showOnMap(id){
    selectedItemId=id;
    const it=items().find(x=>String(x.id)===String(id));
    document.querySelectorAll('.bvps-selected').forEach(e=>e.classList.remove('bvps-selected'));
    const row=document.querySelector('[data-bvps-id="'+CSS.escape(id)+'"]'); if(row) row.classList.add('bvps-selected');
    try{
      const ps=provinces();
      const pIndex=ps.findIndex(p=>p.id===(it&&it.province));
      if(pIndex>=0 && typeof openProvinceMap==='function' && String(window.currentMapView||currentMapView||'main')!=='province') openProvinceMap(pIndex);
      if(typeof drawMap==='function') drawMap();
    }catch(e){ console.warn('Show on map could not open province:',e); }
    const note=$(ids.note); if(note && it) note.textContent='Highlighted '+(it.name||'selected entry')+'. If coordinates are present, the active province map will be opened or refreshed.';
  }
  // Draw a subtle player-side highlight after the map renderer runs, without editing DM geometry.
  const oldDraw=window.drawMap || (typeof drawMap==='function'?drawMap:null);
  if(oldDraw && !window.__bvpsDrawWrapped){
    window.__bvpsDrawWrapped=true;
    window.drawMap = function(){
      const result=oldDraw.apply(this,arguments);
      try{
        if(!selectedItemId) return result;
        const it=items().find(x=>String(x.id)===String(selectedItemId));
        const canvas=document.getElementById('mapCanvas');
        if(!it || !canvas || it.x==null || it.y==null) return result;
        const ctx=canvas.getContext('2d');
        ctx.save(); ctx.beginPath(); ctx.arc(Number(it.x),Number(it.y),18,0,Math.PI*2); ctx.lineWidth=5; ctx.strokeStyle='rgba(255,235,90,.92)'; ctx.stroke(); ctx.beginPath(); ctx.arc(Number(it.x),Number(it.y),6,0,Math.PI*2); ctx.fillStyle='rgba(255,235,90,.95)'; ctx.fill(); ctx.restore();
      }catch(e){}
      return result;
    };
  }
  function boot(){populate(); render();}
  document.addEventListener('belavados:dm-map-loaded',()=>{populate(); render();});
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,120)); else setTimeout(boot,120);
  setTimeout(boot,800);
})();
