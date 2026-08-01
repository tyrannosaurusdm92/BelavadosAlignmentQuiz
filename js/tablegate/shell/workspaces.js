import { creatorForgeSrcdoc, toolDocumentSrcdoc } from './workspace-templates.js';

const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[char]);
const json = value => JSON.stringify(value).replace(/</g, '\\u003c');

export const WORKSPACE_CATALOG = Object.freeze([
  {id:'forge', label:'Creator Forge & Life Simulator', domain:'admin', roles:['OWNER','ADMIN'], description:'Universal settlements, people, transit, maps, simulations, imports, exports, and V9 DOCX baselines.'},
  {id:'effectsStudio', label:'Effects Studio', domain:'admin', roles:['OWNER','ADMIN'], description:'Layered visual effects, maps, lighting, text, assets, presets, and project export.'},
  {id:'campaignHub', label:'Campaign Hub', domain:'admin', roles:['OWNER','ADMIN'], description:'Campaign reference, maps, rules, organizations, sessions, objectives, handouts, and notes.'},
  {id:'vtt', label:'VTT Worldbuilder', domain:'admin', roles:['OWNER','ADMIN'], description:'Canvas scenes, walls, doors, lights, sounds, fog, tokens, import, and export.'},
  {id:'map', label:'Map Foundry', domain:'admin', roles:['OWNER','ADMIN'], description:'Nested semantic maps from world scale to rooms with SVG, GeoJSON, and JSON export.'},
  {id:'npc', label:'NPC Lives', domain:'admin', roles:['OWNER','ADMIN'], description:'Schedules, memories, relationships, events, identities, and settlement simulation.'},
  {id:'encounter', label:'Encounter Lab', domain:'admin', roles:['OWNER','ADMIN'], description:'System-neutral encounters and editable weighted roll tables.'},
  {id:'characters', label:'Character Sheets', domain:'player', roles:['OWNER','ADMIN','MODERATOR','PLAYER'], description:'All recovered character-sheet systems with local state, import, and portable exports.'},
  {id:'sessionDice', label:'Live Session & Dice', domain:'session', roles:['OWNER','ADMIN','MODERATOR','PLAYER'], description:'The intact live rolling board, character layer, dice bot, and session controls.'}
]);

const GENERIC_MODULES = Object.freeze({
  vtt:{script:'js/admins/vtt/vtt-worldbuilder.js', globalName:'TableGateVTTWorldbuilder', css:['css/admins/vtt/vtt-worldbuilder.css']},
  map:{script:'js/admins/maps/map-foundry.js', globalName:'TableGateMapFoundry', css:[]},
  npc:{script:'js/admins/npcs/npc-life.js', globalName:'TableGateNpcLives', css:[]},
  encounter:{script:'js/admins/encounters/encounter-lab.js', globalName:'TableGateEncounterLab', css:[]}
});

function roleAllowed(tool, role) { return tool.roles.includes(role); }

export function renderWorkspaceHub(state, role) {
  const active = state.workspaceTool || '';
  const selected = WORKSPACE_CATALOG.find(tool => tool.id === active);
  if (selected && roleAllowed(selected, role)) {
    return `<div class="workspace-tool-view"><header class="workspace-tool-header"><button class="btn" data-action="close-workspace-tool">← All tools</button><div><span class="workspace-domain">${esc(selected.domain)}</span><h1>${esc(selected.label)}</h1><p>${esc(selected.description)}</p></div></header><iframe id="workspaceToolFrame" class="workspace-tool-frame" title="${esc(selected.label)}" sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-downloads allow-popups allow-pointer-lock" allow="fullscreen; microphone; camera; autoplay; clipboard-read; clipboard-write"></iframe></div>`;
  }
  return `<div class="page"><header class="page-header"><div><h1>Studio & Play</h1><p>Restored admin, player, and live-session domains run in isolated workspaces inside the rebuilt shell.</p></div></header><div class="workspace-role-line"><span class="role-badge ${esc(role.toLowerCase())}">${esc(role)}</span><span>Tools are unlocked from the active TableGate role. Visitors remain observe-only.</span></div><div class="workspace-card-grid">${WORKSPACE_CATALOG.map(tool => {
    const allowed = roleAllowed(tool, role);
    return `<article class="workspace-card" data-domain="${esc(tool.domain)}" data-locked="${allowed?'false':'true'}"><span class="workspace-domain">${esc(tool.domain)}</span><h2>${esc(tool.label)}</h2><p>${esc(tool.description)}</p><div class="workspace-card-actions">${allowed?`<button class="btn primary" data-action="open-workspace-tool" data-tool="${esc(tool.id)}">Open workspace</button>`:`<span class="workspace-lock">${tool.domain==='admin'?'Owner or Admin required':'Player approval required'}</span>`}</div></article>`;
  }).join('')}</div></div>`;
}

function genericModuleSrcdoc(kind, context, rootUrl) {
  const module = GENERIC_MODULES[kind];
  const css = [
    'css/tablegate/themes/cyan-theme.css', 'css/tablegate/helpers/v6-helpers.css',
    'css/tablegate/integrations/v5-integrations.css', 'css/tablegate/workspaces/creator-player.css',
    ...module.css
  ].map(path => `<link rel="stylesheet" href="${path}">`).join('');
  const boot = `
    const root=document.getElementById('toolRoot');
    window.State=${json({user:context.user,server:context.server,members:context.members||[],channel:null})};
    window.$=(s,r=document)=>r.querySelector(s); window.$$=(s,r=document)=>[...r.querySelectorAll(s)];
    window.esc=value=>String(value==null?'':value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
    window.uid=()=>globalThis.crypto?.randomUUID?.()||('tg_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,10));
    window.Store={get:(k,d=null)=>{try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(_){return d}},set:(k,v)=>{localStorage.setItem(k,JSON.stringify(v));return v},remove:k=>localStorage.removeItem(k)};
    window.CampaignIsolation={serverId:()=>State.server.id,canCreate:()=>true};
    window.API={call:async()=>({ok:true,localOnly:true})};
    window.toast=(m,t='info')=>{const n=document.createElement('div');n.className='tool-toast '+t;n.textContent=m;document.body.append(n);setTimeout(()=>n.remove(),2800)};
    window.Workspace={current:${json(kind)},open:()=>{},render:()=>{const api=window[${json(module.globalName)}];if(!api)return;root.innerHTML=api.render();api.bind?.(root)}};
    addEventListener('DOMContentLoaded',()=>{try{Workspace.render()}catch(error){root.innerHTML='<section class="tool-error"><h1>Workspace could not start</h1><pre></pre></section>';root.querySelector('pre').textContent=error.stack||error.message}});
  `;
  return `<!doctype html><html lang="en"><head><base href="${esc(rootUrl)}"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${css}<style>html,body{min-height:100%;margin:0;background:#06161c;color:#eaffff;font-family:Inter,system-ui,sans-serif}#toolRoot{min-height:100vh;padding:18px}.tool-toast{position:fixed;right:20px;bottom:20px;z-index:99;padding:12px 16px;background:#07343c;border:1px solid #00ffff;border-radius:10px}.tool-error{max-width:800px;margin:60px auto;padding:24px;border:1px solid #ff6d7a;border-radius:16px}button,input,select,textarea{font:inherit}</style></head><body><main id="toolRoot"><p>Loading workspace…</p></main><script>${boot}<\/script><script src="${esc(module.script)}"><\/script></body></html>`;
}

function characterSheetsSrcdoc(context, rootUrl) {
  const inline = `
    const select=document.getElementById('sheetSelect'), frame=document.getElementById('sheetFrame'), status=document.getElementById('status');
    const context=${json(context)};
    const sheets=()=>window.TABLEGATE_CHARACTER_SHEETS||[];
    const safeJson=value=>JSON.stringify(value).replace(/<\\//g,'<\\\\/');
    function srcdoc(sheet){return String(sheet.html||'').replaceAll('__TABLEGATE_CAMPAIGN_ID_JSON__',safeJson(context.server.id)).replaceAll('__TABLEGATE_SHEET_ID_JSON__',safeJson(sheet.id)).replaceAll('__TABLEGATE_CHARACTER_ID_JSON__',safeJson('local-preview')).replaceAll('__TABLEGATE_USER_ID_JSON__',safeJson(context.user.id)).replaceAll('__TABLEGATE_CHARACTER_RECORD_JSON__','null').replaceAll('__TABLEGATE_SESSION_MODE_JSON__','false')}
    function openSheet(){const sheet=sheets().find(item=>item.id===select.value)||sheets()[0];if(!sheet)return;frame.srcdoc=srcdoc(sheet);status.textContent=sheet.name+' · '+sheet.id;localStorage.setItem('tablegate.workspace.sheet',sheet.id)}
    addEventListener('DOMContentLoaded',()=>{const all=sheets();select.innerHTML=all.map(item=>'<option value="'+item.id+'">'+item.name+'</option>').join('');select.value=localStorage.getItem('tablegate.workspace.sheet')||all[0]?.id||'';select.onchange=openSheet;openSheet()});
  `;
  return `<!doctype html><html lang="en"><head><base href="${esc(rootUrl)}"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{height:100%;margin:0;background:#031318;color:#eaffff;font-family:Inter,system-ui,sans-serif}body{display:grid;grid-template-rows:auto 1fr}.toolbar{display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid #15515b;background:#061e25}.toolbar label{display:flex;align-items:center;gap:8px;font-weight:800}.toolbar select{min-width:280px;padding:9px;border:1px solid #2c7780;border-radius:8px;background:#082b33;color:#fff}.toolbar span{color:#a8d9df;font-size:13px}iframe{width:100%;height:100%;border:0;background:#fff}</style></head><body><header class="toolbar"><label>Character sheet <select id="sheetSelect"></select></label><span id="status">Loading recovered sheet library…</span></header><iframe id="sheetFrame" title="Interactive character sheet" sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-downloads allow-popups"></iframe><script src="js/players/character-sheets/character-sheet-library.js"><\/script><script>${inline}<\/script></body></html>`;
}

export function mountWorkspace(root, state, role) {
  const frame = root.querySelector('#workspaceToolFrame');
  if (!frame || frame.dataset.mounted === state.workspaceTool) return;
  const tool = WORKSPACE_CATALOG.find(item => item.id === state.workspaceTool);
  if (!tool || !roleAllowed(tool, role)) return;
  frame.dataset.mounted = tool.id;
  const rootUrl = new URL('./', document.baseURI).href;
  const context = {
    user:{id:state.me?.id||'local', username:state.me?.username||'TableGate User'},
    server:{id:state.activeTablegateId||'local', name:state.activeTablegate?.tablegate?.name||'TableGate'},
    members:(state.activeTablegate?.members||[]).map(member => ({userId:member.userId,nickname:member.nickname||member.user?.username||'Member'})),
    token:state.token||''
  };
  if (tool.id === 'forge') frame.srcdoc = creatorForgeSrcdoc({rootUrl,campaignId:context.server.id,serverName:context.server.name,token:context.token});
  else if (['effectsStudio','campaignHub','sessionDice'].includes(tool.id)) frame.srcdoc = toolDocumentSrcdoc(tool.id,{rootUrl});
  else if (tool.id === 'characters') frame.srcdoc = characterSheetsSrcdoc(context,rootUrl);
  else if (GENERIC_MODULES[tool.id]) frame.srcdoc = genericModuleSrcdoc(tool.id,context,rootUrl);
}

export function renderSystemLibrary() {
  return `<div class="page"><header class="page-header"><div><h1>System Reference</h1><p>Nine-system local knowledge pack with original compatibility summaries and source-scope notices.</p></div></header><section class="system-browser"><aside><label class="field"><span>Search systems or files</span><input id="systemBrowserSearch" type="search" placeholder="rules, character creation, encounters…"></label><div id="systemBrowserList"><p>Loading catalog…</p></div></aside><main><header><h2 id="systemBrowserTitle">Choose a system</h2><p id="systemBrowserMeta"></p></header><div id="systemBrowserFiles"></div><pre id="systemBrowserPreview">Choose a reference file to preview it.</pre></main></section></div>`;
}

export async function mountSystemLibrary(root) {
  const list = root.querySelector('#systemBrowserList');
  if (!list || list.dataset.mounted) return;
  list.dataset.mounted = 'true';
  try {
    const catalog = await fetch('json/tablegate/knowledge-pack/catalog.json').then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    });
    const systems = catalog.systems || [];
    const globalFiles = catalog.files || [];
    const title = root.querySelector('#systemBrowserTitle'), meta = root.querySelector('#systemBrowserMeta'), files = root.querySelector('#systemBrowserFiles'), preview = root.querySelector('#systemBrowserPreview');
    const show = system => {
      title.textContent = system.name;
      meta.textContent = `${system.contentPolicy || ''} ${system.fileCount ? `· ${system.fileCount} files` : ''}`;
      const systemFiles = system.files || globalFiles.filter(file => String(file.path||'').startsWith(`${system.folder}/`));
      files.innerHTML = systemFiles.map(file => `<button class="system-file" data-path="${esc(file.path||`${system.folder}/${file.name}`)}"><span>${esc(file.name||file.path)}</span><small>${esc(file.category||'reference')}</small></button>`).join('') || `<div class="chips">${(system.coverageCategories||[]).map(item => `<span class="chip">${esc(item)}</span>`).join('')}</div><button class="system-file" data-path="${esc(`${system.folder}/00-manifest.json`)}"><span>Open system manifest</span></button>`;
      files.querySelectorAll('[data-path]').forEach(button => button.onclick = async () => {
        preview.textContent = 'Loading…';
        try { const response=await fetch(`json/tablegate/knowledge-pack/${button.dataset.path}`);const text=await response.text();preview.textContent=response.ok?(JSON.stringify(JSON.parse(text),null,2).slice(0,120000)):`HTTP ${response.status}`; }
        catch(error){ preview.textContent=error.message; }
      });
    };
    const renderList = query => {
      const q=String(query||'').toLowerCase();
      const filtered=systems.filter(item=>!q||`${item.name} ${(item.coverageCategories||[]).join(' ')}`.toLowerCase().includes(q));
      list.innerHTML=filtered.map(item=>`<button class="system-choice" data-folder="${esc(item.folder)}"><strong>${esc(item.name)}</strong><small>${(item.coverageCategories||[]).length} coverage areas</small></button>`).join('')||'<p>No systems matched.</p>';
      list.querySelectorAll('[data-folder]').forEach(button=>button.onclick=()=>show(systems.find(item=>item.folder===button.dataset.folder)));
      if (filtered[0]) show(filtered[0]);
    };
    renderList('');
    root.querySelector('#systemBrowserSearch').oninput = event => renderList(event.target.value);
  } catch (error) { list.innerHTML = `<p class="notice danger">Catalog could not load: ${esc(error.message)}</p>`; }
}

export function renderOrganizer() {
  return `<div class="page"><header class="page-header"><div><h1>Organizer</h1><p>Campaign tasks, session dates, shared notes, and portable local JSON.</p></div></header><section class="organizer-shell"><form id="organizerForm" class="card card-pad form-grid"><label class="field"><span>Title</span><input name="title" required></label><label class="field"><span>Type</span><select name="type"><option>Task</option><option>Session</option><option>Note</option><option>Milestone</option></select></label><label class="field"><span>Due</span><input name="due" type="datetime-local"></label><label class="field span-2"><span>Details</span><textarea name="details"></textarea></label><button class="btn primary" type="submit">Add item</button></form><section class="card card-pad"><div class="card-header"><h2>Campaign organizer</h2><div><button class="btn small" id="organizerExport">Export JSON</button><label class="btn small">Import JSON<input id="organizerImport" type="file" accept=".json" hidden></label></div></div><div id="organizerItems"></div></section></section></div>`;
}

export function mountOrganizer(root, scopeId='local') {
  const form=root.querySelector('#organizerForm');
  if(!form||form.dataset.mounted)return;
  form.dataset.mounted='true';
  const key=`tablegate.organizer.v9.${scopeId}`;
  const load=()=>{try{return JSON.parse(localStorage.getItem(key)||'[]')}catch{return[]}};
  const save=items=>localStorage.setItem(key,JSON.stringify(items));
  const render=()=>{const items=load();root.querySelector('#organizerItems').innerHTML=items.map((item,index)=>`<article class="organizer-item"><div><span class="workspace-domain">${esc(item.type)}</span><h3>${esc(item.title)}</h3><p>${esc(item.details||'')}</p><small>${item.due?new Date(item.due).toLocaleString():'No due date'}</small></div><button class="btn small danger" data-delete="${index}">Delete</button></article>`).join('')||'<p class="helper">No organizer items yet.</p>';root.querySelectorAll('[data-delete]').forEach(button=>button.onclick=()=>{const next=load();next.splice(Number(button.dataset.delete),1);save(next);render()})};
  form.onsubmit=event=>{event.preventDefault();const data=Object.fromEntries(new FormData(form));const items=load();items.push({...data,id:crypto.randomUUID?.()||Date.now(),createdAt:new Date().toISOString()});save(items);form.reset();render()};
  root.querySelector('#organizerExport').onclick=()=>{const blob=new Blob([JSON.stringify({schema:'tablegate.organizer.v9',items:load()},null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='tablegate-organizer.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
  root.querySelector('#organizerImport').onchange=async event=>{try{const payload=JSON.parse(await event.target.files[0].text());save(Array.isArray(payload)?payload:(payload.items||[]));render()}catch(error){alert(`Organizer import failed: ${error.message}`)}};
  render();
}
