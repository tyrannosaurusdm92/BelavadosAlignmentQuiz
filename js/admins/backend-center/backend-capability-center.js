'use strict';
/* Complete frontend access to every HTTP route exposed by the supplied TableGate Backend V8 and its integrated storage/accessibility module. */
(()=>{
  const catalog=window.TableGateBackendRouteCatalog||{routes:[]};
  const StateUI={query:'',category:'all',selected:'health',payload:'{}',result:null,busy:false};
  const route=()=>catalog.routes.find(item=>item.action===StateUI.selected)||catalog.routes[0];
  const json=value=>JSON.stringify(value,null,2);
  const routeCategories=()=>[...new Set(catalog.routes.map(item=>item.category))].sort();
  function resolvedSample(item){
    const sample=typeof structuredClone==='function'?structuredClone(item.sample||{}):JSON.parse(JSON.stringify(item.sample||{}));
    const replace=value=>{
      if(value==='$ACTIVE_TABLEGATE')return State.server?.id||'';
      if(value==='$ACTIVE_CHANNEL')return State.channel?.id||'';
      if(value==='$ACTIVE_DM')return State.dm?.id||'';
      if(value==='$CURRENT_USER')return State.user?.id||'';
      if(Array.isArray(value))return value.map(replace);
      if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,replace(v)]));
      return value;
    };
    return replace(sample);
  }
  function visibleRoutes(){
    const q=StateUI.query.trim().toLowerCase();
    return catalog.routes.filter(item=>(StateUI.category==='all'||item.category===StateUI.category)&&(!q||`${item.action} ${item.category} ${item.parameters.join(' ')}`.toLowerCase().includes(q)));
  }
  function routeButton(item){return `<button class="backend-route ${item.action===StateUI.selected?'active':''}" data-backend-route="${esc(item.action)}"><b>${esc(item.action)}</b><small>${esc(item.category)} · ${item.auth?'authenticated':'public'} · ${item.write?'write':'read'}</small></button>`}
  function render(){
    const item=route(),list=visibleRoutes();
    if(!StateUI.payload||StateUI.payload==='{}')StateUI.payload=json(resolvedSample(item));
    return `<div class="workspace-grid backend-center">
      <section class="workspace-card span-12 backend-hero"><div><span class="eyebrow">SUPPLIED BACKEND V8</span><h2>Backend Capability Center</h2><p>Every one of the backend's ${catalog.routeCount||catalog.routes.length} HTTP and integrated storage routes is callable here. Existing friendly TableGate screens remain the normal workflow; this center guarantees complete route coverage for advanced and administrative operations.</p></div><div class="backend-metrics"><strong>${catalog.routeCount||catalog.routes.length}</strong><small>routes exposed</small></div></section>
      <section class="workspace-card span-4 backend-route-panel"><div class="docs-toolbar"><input data-backend-search type="search" value="${esc(StateUI.query)}" placeholder="Search routes or parameters"><select data-backend-category><option value="all">All categories</option>${routeCategories().map(cat=>`<option ${StateUI.category===cat?'selected':''}>${esc(cat)}</option>`).join('')}</select></div><div class="backend-route-list">${list.map(routeButton).join('')||'<div class="empty-workspace">No matching routes.</div>'}</div></section>
      <section class="workspace-card span-8 backend-request-panel">
        <div class="card-head"><div><span class="eyebrow">${esc(item.category)}</span><h2>${esc(item.action)}</h2></div><div class="backend-flags"><span class="status-pill">${item.auth?'AUTH':'PUBLIC'}</span><span class="status-pill ${item.write?'pending':'approved'}">${item.write?'WRITE':'READ'}</span>${item.destructive?'<span class="status-pill danger">DESTRUCTIVE</span>':''}</div></div>
        <p><code>${esc(item.handler)}</code> · attached Backend V8 source line ${item.source.line}</p>
        <div class="backend-context-row"><button data-backend-fill>Reset sample</button><button data-backend-context="tablegateId">Use active campaign</button><button data-backend-context="channelId">Use active channel</button><button data-backend-context="userId">Use my user ID</button></div>
        <div class="field"><label>JSON parameters</label><textarea data-backend-payload class="backend-json-editor" spellcheck="false">${esc(StateUI.payload)}</textarea><small>${item.parameters.length?`Recognized parameters: ${esc(item.parameters.join(', '))}`:'This route takes no explicit parameters.'}</small></div>
        <div class="row between wrap"><button class="primary" data-backend-run ${StateUI.busy?'disabled':''}>${StateUI.busy?'Calling backend…':'Run '+esc(item.action)}</button><button data-backend-copy>Copy request JSON</button></div>
        <div class="backend-result"><h3>Response</h3><pre data-backend-result>${esc(StateUI.result==null?'No request has been run in this view.':json(StateUI.result))}</pre></div>
      </section>
    </div>`;
  }
  function rerender(){if(Workspace.current==='backend')Workspace.render()}
  function setContext(key){
    let payload={};try{payload=JSON.parse(StateUI.payload||'{}')}catch(_){payload={}}
    const values={tablegateId:State.server?.id||'',channelId:State.channel?.id||'',userId:State.user?.id||''};payload[key]=values[key];StateUI.payload=json(payload);rerender();
  }
  function bind(shell){
    const search=shell.querySelector('[data-backend-search]'),category=shell.querySelector('[data-backend-category]'),editor=shell.querySelector('[data-backend-payload]');
    if(search)search.oninput=()=>{StateUI.query=search.value;clearTimeout(search._t);search._t=setTimeout(rerender,160)};
    if(category)category.onchange=()=>{StateUI.category=category.value;rerender()};
    shell.querySelectorAll('[data-backend-route]').forEach(button=>button.onclick=()=>{StateUI.selected=button.dataset.backendRoute;StateUI.payload=json(resolvedSample(route()));StateUI.result=null;rerender()});
    if(editor)editor.oninput=()=>{StateUI.payload=editor.value};
    shell.querySelector('[data-backend-fill]')?.addEventListener('click',()=>{StateUI.payload=json(resolvedSample(route()));rerender()});
    shell.querySelectorAll('[data-backend-context]').forEach(button=>button.onclick=()=>setContext(button.dataset.backendContext));
    shell.querySelector('[data-backend-copy]')?.addEventListener('click',async()=>{await navigator.clipboard.writeText(StateUI.payload);toast('Request JSON copied.','success')});
    shell.querySelector('[data-backend-run]')?.addEventListener('click',async()=>{
      const item=route();let payload;
      try{payload=JSON.parse(StateUI.payload||'{}')}catch(error){return toast('Request parameters must be valid JSON.','error')}
      if(item.destructive&&!confirm(`Run destructive backend action ${item.action}?`))return;
      StateUI.busy=true;rerender();
      try{StateUI.result=await API.call(item.action,payload,!item.auth?false:true);toast(`${item.action} completed.`,'success')}
      catch(error){StateUI.result={ok:false,error:{code:error.code||'ERROR',message:error.message,details:error.details}};showError(error)}
      finally{StateUI.busy=false;rerender()}
    });
  }
  window.TableGateBackendCenter=Object.freeze({render,bind,catalog});
})();
