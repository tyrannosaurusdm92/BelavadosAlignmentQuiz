'use strict';
/* Browser for the injected nine-system JSON knowledge pack. */
(()=>{
  const catalog=window.TableGateKnowledgeCatalog||{systems:[],files:[]};
  const UI={system:'all',query:'',selected:'',preview:null,busy:false,ingestProgress:''};
  const rootUrl=new URL('./json/knowledge-pack/',location.href);
  const formatBytes=n=>typeof bytes==='function'?bytes(n):`${Math.round(n/1024)} KB`;
  function files(){const q=UI.query.trim().toLowerCase();return catalog.files.filter(file=>(UI.system==='all'||file.path.startsWith(UI.system+'/'))&&(!q||`${file.title} ${file.system} ${file.path} ${file.summary} ${(file.topLevelKeys||[]).join(' ')}`.toLowerCase().includes(q)))}
  function selected(){return catalog.files.find(file=>file.path===UI.selected)||files()[0]||null}
  function renderPreview(){
    const file=selected();if(!file)return '<div class="empty-workspace">Choose a knowledge file.</div>';
    if(UI.busy)return '<div class="empty-workspace">Loading knowledge file…</div>';
    if(UI.preview==null)return `<div class="knowledge-file-summary"><h2>${esc(file.title)}</h2><p>${esc(file.summary||'Structured JSON reference material for '+file.system+'.')}</p><dl><dt>System</dt><dd>${esc(file.system)}</dd><dt>File</dt><dd>${esc(file.path)}</dd><dt>Size</dt><dd>${esc(formatBytes(file.sizeBytes))}</dd><dt>Records</dt><dd>${esc(file.recordCount??'Structured document')}</dd><dt>SHA-256</dt><dd><code>${esc(file.sha256)}</code></dd></dl><div class="row wrap"><button class="primary" data-knowledge-load>Load preview</button><a class="secondary" href="${esc(new URL(file.path,rootUrl).href)}" target="_blank" rel="noopener">Open JSON file</a><button data-knowledge-ingest>Ingest into backend knowledge</button></div>${UI.ingestProgress?`<div class="info-box">${esc(UI.ingestProgress)}</div>`:''}</div>`;
    const value=UI.preview,records=Array.isArray(value)?value:(Array.isArray(value?.records)?value.records:null);
    const shown=records?{...value,records:records.slice(0,100),_tablegatePreview:`Showing 100 of ${records.length} records. Open the JSON file for the complete source.`}:value;
    return `<div class="knowledge-file-summary"><div class="row between wrap"><h2>${esc(file.title)}</h2><div class="row wrap"><button data-knowledge-close>Close preview</button><button data-knowledge-ingest>Ingest into backend knowledge</button></div></div><pre class="knowledge-preview">${esc(JSON.stringify(shown,null,2))}</pre>${UI.ingestProgress?`<div class="info-box">${esc(UI.ingestProgress)}</div>`:''}</div>`;
  }
  function render(){
    const list=files(),file=selected();if(file&&!UI.selected)UI.selected=file.path;
    return `<div class="workspace-grid knowledge-browser"><section class="workspace-card span-12 knowledge-hero"><div><span class="eyebrow">INJECTED JSON DATASET</span><h2>Nine-System TTRPG Knowledge Pack</h2><p>${catalog.fileCount} structured JSON files across ${catalog.systemCount} systems are physically embedded in this release and available to the rules library, backend knowledge ingestion, dice helpers, generators, and campaign preparation tools.</p></div><div class="backend-metrics"><strong>${esc(formatBytes(catalog.totalBytes))}</strong><small>uncompressed JSON</small></div></section>
      <section class="workspace-card span-4 knowledge-index"><div class="docs-toolbar"><input data-knowledge-search type="search" value="${esc(UI.query)}" placeholder="Search files, keys, and summaries"><select data-knowledge-system><option value="all">All nine systems</option>${catalog.systems.map(system=>`<option value="${esc(system.folder)}" ${UI.system===system.folder?'selected':''}>${esc(system.name)}</option>`).join('')}</select></div><p>${list.length} matching file${list.length===1?'':'s'}</p><div class="backend-route-list">${list.map(item=>`<button class="backend-route ${item.path===UI.selected?'active':''}" data-knowledge-file="${esc(item.path)}"><b>${esc(item.title)}</b><small>${esc(item.system)} · ${esc(formatBytes(item.sizeBytes))}${item.recordCount!=null?` · ${esc(item.recordCount)} records`:''}</small></button>`).join('')||'<div class="empty-workspace">No matching knowledge files.</div>'}</div></section>
      <section class="workspace-card span-8 knowledge-detail">${renderPreview()}</section></div>`;
  }
  function rerender(){if(Workspace.current==='knowledge')Workspace.render()}
  async function load(){const file=selected();if(!file)return;UI.busy=true;UI.preview=null;rerender();try{const response=await fetch(new URL(file.path,rootUrl));if(!response.ok)throw new Error(`HTTP ${response.status}`);UI.preview=await response.json()}catch(error){UI.preview={error:'Could not load this JSON file through the current hosting context.',detail:error.message,path:file.path};showError(error)}finally{UI.busy=false;rerender()}}
  async function ingest(){
    const file=selected();if(!file||!State.server)return;
    if(UI.preview==null)await load();if(UI.preview?.error)return;
    const text=JSON.stringify(UI.preview),size=34000,total=Math.max(1,Math.ceil(text.length/size));
    if(!confirm(`Ingest ${file.title} into this campaign's backend knowledge as ${total} chunk${total===1?'':'s'}?`))return;
    UI.busy=true;
    try{
      for(let index=0;index<total;index++){
        UI.ingestProgress=`Ingesting ${index+1} of ${total}: ${file.title}`;rerender();
        await API.call('ingestKnowledge',{tablegateId:State.server.id,title:`${file.system} — ${file.title} (${index+1}/${total})`,sourceType:'TEXT',content:text.slice(index*size,(index+1)*size),tags:['tablegate-knowledge-pack',file.system,file.title],metadata:{path:file.path,sha256:file.sha256,part:index+1,totalParts:total,contentOrigin:file.contentOrigin}});
      }
      UI.ingestProgress=`Ingested ${total} backend knowledge source${total===1?'':'s'} from ${file.title}.`;toast('Knowledge ingestion complete.','success');
    }catch(error){UI.ingestProgress=`Ingestion stopped: ${error.message}`;showError(error)}finally{UI.busy=false;rerender()}
  }
  function bind(shell){
    const search=shell.querySelector('[data-knowledge-search]'),system=shell.querySelector('[data-knowledge-system]');
    if(search)search.oninput=()=>{UI.query=search.value;clearTimeout(search._t);search._t=setTimeout(()=>{UI.selected='';UI.preview=null;rerender()},160)};
    if(system)system.onchange=()=>{UI.system=system.value;UI.selected='';UI.preview=null;rerender()};
    shell.querySelectorAll('[data-knowledge-file]').forEach(button=>button.onclick=()=>{UI.selected=button.dataset.knowledgeFile;UI.preview=null;UI.ingestProgress='';rerender()});
    shell.querySelector('[data-knowledge-load]')?.addEventListener('click',load);
    shell.querySelector('[data-knowledge-close]')?.addEventListener('click',()=>{UI.preview=null;rerender()});
    shell.querySelectorAll('[data-knowledge-ingest]').forEach(button=>button.onclick=ingest);
  }
  window.TableGateKnowledgeBrowser=Object.freeze({render,bind,catalog});
})();
