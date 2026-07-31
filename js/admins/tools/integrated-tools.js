'use strict';
/* Unified TableGate tools, documentation browser, and campaign-runner tutorials. */
(()=>{
const CREDIT='Created By William Saville AKA The Transgender T-Rex #TheTransgenderTrex developer of Belavadös Galaxy TTRPG System';
const RUNNER_TITLES='DM, GM, MOL, Master of Lore, Storyteller, Keeper, Referee, and equivalent campaign runners';
const ROOT_URL=new URL('./',location.href).href;
const localKey=name=>`${CONFIG.storagePrefix}.integrated.${State.server?.id||'none'}.${name}`;
const canManage=()=>typeof CampaignIsolation!=='undefined'?CampaignIsolation.canCreate():(typeof isRunner==='function'&&isRunner());
const documentFor=kind=>{
  const source=window.TableGateToolDocuments?.[kind];
  if(!source)throw new Error(`The ${kind} tool document is unavailable.`);
  return source.replaceAll('__TABLEGATE_ROOT_URL__',ROOT_URL);
};
window.TableGateIntegratedTools=Object.freeze({document:documentFor,rootUrl:ROOT_URL});

let hubFrame=null;
let hubAssets=[];
const fileToBase64=file=>new Promise((resolve,reject)=>{
  const reader=new FileReader();
  reader.onload=()=>resolve(String(reader.result||'').split(',').pop());
  reader.onerror=()=>reject(reader.error||new Error('File read failed.'));
  reader.readAsDataURL(file);
});
function hubContext(){
  return {
    serverId:State.server?.id||'',serverName:State.server?.name||'',
    userId:State.user?.id||'',userName:State.user?.username||'',
    editable:canManage(),backendUrl:CONFIG.backendUrl,libraryUrl:CONFIG.libraryUrl
  };
}
async function callWithFallback(action,payload,fallback){
  try{return await API.call(action,payload)}
  catch(error){
    if(['UNKNOWN_ACTION','NETWORK_ERROR','NOT_CONFIGURED'].includes(error.code)&&fallback)return fallback(error);
    throw error;
  }
}
async function getHubState(){
  return callWithFallback('getCampaignHubState',{serverId:State.server.id},()=>Store.get(localKey('hubState'),null));
}
async function saveHubState(state){
  if(!canManage())throw new Error('Campaign Hub editing is limited to campaign runners and moderators.');
  Store.set(localKey('hubState'),state);
  return callWithFallback('saveCampaignHubState',{serverId:State.server.id,state},()=>({saved:true,state}));
}
async function listAssets(){
  const result=await callWithFallback('listCampaignAssets',{serverId:State.server.id,kind:'MAP'},()=>Store.get(localKey('mapAssets'),[]));
  hubAssets=Array.isArray(result)?result:(result?.assets||[]);
  return hubAssets;
}
async function uploadMaps(files){
  if(!canManage())throw new Error('Map publication is limited to campaign runners and moderators.');
  const max=State.clientConfig?.maxUploadBytes||24*1024*1024,saved=[];
  for(const file of [...files]){
    if(file.size>max){toast(`${file.name} is larger than ${bytes(max)}.`,'error');continue}
    const base64=await fileToBase64(file);let asset;
    try{
      const attachment=await API.call('uploadAttachment',{fileName:file.name,mimeType:file.type||'application/octet-stream',base64,serverId:State.server.id});
      asset=await API.call('createCampaignAsset',{serverId:State.server.id,attachmentId:attachment.id,title:file.name,kind:'MAP',mimeType:file.type||'application/octet-stream',visibility:'SERVER'});
    }catch(error){
      if(!['UNKNOWN_ACTION','NETWORK_ERROR','NOT_CONFIGURED'].includes(error.code))throw error;
      asset={id:`local_${Date.now()}_${Math.random().toString(36).slice(2)}`,serverId:State.server.id,title:file.name,kind:'MAP',mimeType:file.type||'application/octet-stream',sizeBytes:file.size,base64,createdAt:new Date().toISOString(),local:true};
    }
    saved.push(asset);
  }
  if(saved.some(asset=>asset.local)){
    const current=Store.get(localKey('mapAssets'),[]);
    Store.set(localKey('mapAssets'),[...current,...saved]);
  }
  await refreshHub();
  return saved;
}
async function deleteAsset(id){
  if(!canManage())throw new Error('Map removal is limited to campaign runners and moderators.');
  const local=Store.get(localKey('mapAssets'),[]);
  if(local.some(asset=>asset.id===id)){
    Store.set(localKey('mapAssets'),local.filter(asset=>asset.id!==id));
  }else await API.call('deleteCampaignAsset',{serverId:State.server.id,assetId:id});
  await refreshHub();
}
async function getAssetFile(asset){
  let base64=asset.base64,mime=asset.mimeType||'application/octet-stream',name=asset.title||'campaign-map';
  if(!base64){
    const data=await API.call('downloadAttachment',{attachmentId:asset.attachmentId});
    base64=data.base64;mime=data.attachment?.mimeType||mime;name=data.attachment?.originalName||name;
  }
  const binary=atob(base64),array=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++)array[i]=binary.charCodeAt(i);
  return new File([array],name,{type:mime});
}
async function sendHubContext(){
  if(!hubFrame?.contentWindow)return;
  const [state,assets]=await Promise.all([getHubState(),listAssets()]);
  hubFrame.contentWindow.postMessage({type:'tablegate.hub.context',context:hubContext(),state,assets},'*');
  document.querySelector('[data-map-count]')?.replaceChildren(`${assets.length} shared map${assets.length===1?'':'s'}`);
}
async function refreshHub(){await listAssets();await sendHubContext();return hubAssets}
window.addEventListener('message',async event=>{
  const data=event.data;if(!data||typeof data!=='object')return;
  if(data.type==='tablegate.hub.ready'){hubFrame=event.source?.frameElement||hubFrame;await sendHubContext()}
  if(data.type==='tablegate.hub.save'){
    try{await saveHubState(data.state);event.source?.postMessage({type:'tablegate.hub.saved',savedAt:new Date().toISOString()},'*')}
    catch(error){event.source?.postMessage({type:'tablegate.hub.error',message:error.message},'*')}
  }
  if(data.type==='tablegate.hub.openAsset'){
    try{
      const asset=(await listAssets()).find(item=>item.id===data.assetId);
      if(!asset)throw new Error('Shared map not found.');
      event.source?.postMessage({type:'tablegate.hub.assetFile',requestId:data.requestId,file:await getAssetFile(asset)},'*');
    }catch(error){event.source?.postMessage({type:'tablegate.hub.error',requestId:data.requestId,message:error.message},'*')}
  }
  if(data.type==='tablegate.hub.deleteAsset'){
    try{await deleteAsset(data.assetId)}catch(error){showError(error)}
  }
});

const TUTORIALS=[
  {id:'start',icon:'◎',title:'Campaign Setup',summary:'Create a campaign, invite participants, assign roles, and choose a campaign-runner title.',steps:[
    ['Create the campaign','Use the plus button in the campaign rail, enter the campaign name, and review the generated invite settings.'],
    ['Invite participants','Open campaign administration to copy an invite or create a controlled registration path.'],
    ['Assign permissions',`Give campaign-runner or moderator permissions only to trusted participants. ${RUNNER_TITLES} share the same capability gate.`],
    ['Choose your title','Open the Campaign Runner Creator Area and choose the title your campaign uses. The choice changes wording, not access.']
  ]},
  {id:'hub',icon:'▦',title:'Campaign Hub',summary:'Organize map hierarchies, campaign areas, links, handouts, and shared map assets.',steps:[
    ['Open Campaign Hub','Choose Campaign Hub from the navigation or the Campaign Runner Creation Tools section.'],
    ['Build the hierarchy','Create world, region, settlement, site, and encounter-level records, then connect them using the map hierarchy.'],
    ['Publish maps','Use Publish maps to attach map files to the active campaign. Players receive read-only access to shared campaign material.'],
    ['Verify the destination','Confirm the campaign name shown in the toolbar before editing or publishing.']
  ]},
  {id:'effects',icon:'✎',title:'Effects Studio',summary:'Create layered artwork, maps, terrain, lighting, sound zones, animation, and paint-by-number assets.',steps:[
    ['Start a project','Open Effects Studio and create, import, or continue a named project.'],
    ['Build with layers','Use drawing tools, shapes, assets, procedural terrain, lighting, sound zones, and layers without flattening your editable source.'],
    ['Use Paint by Number','Switch workspaces to prepare traced or generated paint-by-number pages inside the same project environment.'],
    ['Export and sync','Export PNG, SVG, HTML, or project JSON. Use Sync when you want the configured backend to retain the project.']
  ]},
  {id:'world',icon:'◉',title:'World & Life Studio',summary:'Connect lore, people, locations, timelines, relationships, schedules, and living-world updates.',steps:[
    ['Create linked lore','Add articles with explicit links so locations, people, factions, species, and events remain navigable.'],
    ['Model campaign lives','Use NPC Lives to track homes, work, travel, relationships, needs, and routines.'],
    ['Advance the world','Review simulation changes before they become player-facing campaign truth.'],
    ['Publish deliberately','Select private creator records and use Send to Players only when they are ready.']
  ]},
  {id:'table',icon:'♟',title:'Virtual Tabletop',summary:'Prepare maps, tokens, initiative, handouts, scenes, fog, and live encounters.',steps:[
    ['Prepare a scene','Open the Virtual Tabletop, choose or upload a map, and configure the grid.'],
    ['Place participants','Add player characters and NPC tokens from the active campaign.'],
    ['Run the encounter','Use initiative and token controls during play; keep private notes and hidden rolls in runner-only tools.'],
    ['Share outcomes','Publish handouts or selected creator records when players should receive them.']
  ]},
  {id:'dice',icon:'◆',title:'Session Dice',summary:'Use shared 3D dice, all nine rules engines, filled saved sheets, user colors, logs, and bots during live play.',steps:[
    ['Choose a saved character','Open Character Sheets, select Play on a completed character, and confirm the character name and system shown in Session. The saved filled sheet loads inside the rolling board.'],
    ['Choose the system and color','The sheet selects Fate Core, GURPS 4e, Call of Cthulhu 7e, Daggerheart, Pathfinder 2e Remastered, PbtA, SWADE, Blades in the Dark, or D&D 5e / 5.5e. Choose the color other participants should see for your dice and popup.'],
    ['Roll from controls, sheet, or bot','Use a system quick action, enter an expression, click a roll control in the sheet, or ask the dice bot. Explicit modifiers, targets, pools, and dice override inferred sheet fields.'],
    ['Share one authoritative result','A public roll posts once to the selected campaign channel. Players and administrators receive the same exact faces, system outcome, bot explanation, and selected color.'],
    ['Use private checks','Campaign runners can use Private Dice with any of the nine systems. A hidden result remains private unless an admin channel is deliberately selected.']
  ]},
  {id:'characters',icon:'♙',title:'Characters',summary:'Create, import, convert, own, approve, and publish multi-system characters.',steps:[
    ['Set the campaign policy','Choose whether players may create or import sheets and whether per-player limits apply.'],
    ['Create or import','Use the character vault and universal converter; always review system-specific substitutions.'],
    ['Confirm ownership','Each character belongs to one player in one campaign. Campaign runners may inspect the campaign vault.'],
    ['Use consent controls','Review ownership and access before changing or publishing another participant’s character data.']
  ]},
  {id:'communication',icon:'◌',title:'Messages, Voice & Safety',summary:'Configure channels, calls, direct messages, blocking, reports, notifications, and moderation.',steps:[
    ['Organize channels','Create text, announcement, voice, and dice-log channels around the campaign’s actual needs.'],
    ['Communicate safely','Use direct messages, friend controls, blocking, and reporting. Review moderation records in campaign administration.'],
    ['Start live communication','Open a voice channel, then enable microphone or camera only when you intend to share them.'],
    ['Control notifications','Use the bell in the campaign rail to review and clear notifications.']
  ]},
  {id:'organizer',icon:'▣',title:'Organizer & Calendar',summary:'Coordinate sessions, availability, tasks, approvals, campaign files, and rule notes.',steps:[
    ['Schedule a session','Add the date, time, visibility, and approval state in the Calendar.'],
    ['Collect availability','Ask players to enter unavailable and preferred windows before the schedule is finalized.'],
    ['Assign work','Use Tasks for preparation, player follow-ups, and campaign maintenance.'],
    ['Ground campaign answers','Upload permitted rules references and use notes that point back to the actual source.']
  ]},
  {id:'publishing',icon:'⇧',title:'Publishing & Player Access',summary:'Keep preparation private, preview safe snapshots, and publish only to the active campaign.',steps:[
    ['Prepare privately','Create records in runner-only workspaces. They remain private until deliberately selected.'],
    ['Select exact records','Use the Campaign Runner Creator Area to select the items intended for players.'],
    ['Confirm the campaign','The confirmation step displays the locked destination campaign and clears if the active campaign changes.'],
    ['Withdraw when needed','Select previously published items and use Remove from Players without deleting the private source.']
  ]},
  {id:'docs',icon:'§',title:'Documentation & Sources',summary:'Review architecture, licenses, provenance, audits, manifests, source notes, and test evidence.',steps:[
    ['Open Documentation','Choose Docs in the navigation. Every retained project document is indexed there.'],
    ['Filter by category','Use search and category controls to find licenses, provenance, audits, manifests, and source notes.'],
    ['Distinguish runtime from record','The active application contains only one HTML entry file; retained source material is documentation, not executable legacy code.'],
    ['Review before distribution','Check the current merge audit, test report, release manifest, and upstream license notices.']
  ]}
];
const tutorialKey=()=>`${CONFIG.storagePrefix}.tutorials.${State.user?.id||'guest'}`;
function tutorialSettings(){
  return Store.get(tutorialKey(),{enabled:true,offered:false,completed:[],selected:TUTORIALS.map(item=>item.id)});
}
function saveTutorialSettings(value){Store.set(tutorialKey(),value);return value}
function openTutorial(id,index=0){
  const tutorial=TUTORIALS.find(item=>item.id===id);if(!tutorial)return;
  const step=Math.max(0,Math.min(index,tutorial.steps.length-1));
  const [heading,body]=tutorial.steps[step];
  modal(tutorial.title,`<article class="tutorial-modal-step"><span class="eyebrow">STEP ${step+1} OF ${tutorial.steps.length}</span><h3>${esc(heading)}</h3><p>${esc(body)}</p><div class="tutorial-progress">${tutorial.steps.map((_,i)=>`<i class="${i<=step?'done':''}"></i>`).join('')}</div></article>`,`<button data-close-modal>Close</button>${step?`<button data-tutorial-step="${esc(id)}:${step-1}">Previous</button>`:''}${step<tutorial.steps.length-1?`<button class="primary" data-tutorial-step="${esc(id)}:${step+1}">Next</button>`:`<button class="primary" data-tutorial-complete="${esc(id)}">Complete</button>`}`,true);
  const root=$('#modal-root');
  root.querySelectorAll('[data-tutorial-step]').forEach(button=>button.onclick=()=>{const [nextId,nextStep]=button.dataset.tutorialStep.split(':');openTutorial(nextId,Number(nextStep))});
  root.querySelector('[data-tutorial-complete]')?.addEventListener('click',()=>{
    const settings=tutorialSettings();
    settings.completed=[...new Set([...(settings.completed||[]),id])];saveTutorialSettings(settings);closeModal();
    if(Workspace.current==='tutorials')Workspace.render();
    toast(`${tutorial.title} tutorial completed.`,'success');
  });
}
function offerTutorials(){
  if(!canManage())return;
  const settings=tutorialSettings();if(!settings.enabled||settings.offered)return;
  settings.offered=true;saveTutorialSettings(settings);
  modal('Campaign runner tutorials',`<p>TableGate includes optional, tool-specific guides for ${esc(RUNNER_TITLES)}.</p><p>Choose tutorials at any time, track completed guides, or disable all tutorial prompts.</p>`,`<button data-tutorial-disable>Disable tutorials</button><button data-close-modal>Not now</button><button class="primary" data-tutorial-open>Choose tutorials</button>`);
  const root=$('#modal-root');
  root.querySelector('[data-tutorial-disable]')?.addEventListener('click',()=>{const next=tutorialSettings();next.enabled=false;saveTutorialSettings(next);closeModal();toast('Tutorial prompts disabled.','success')});
  root.querySelector('[data-tutorial-open]')?.addEventListener('click',()=>{closeModal();Workspace.open('tutorials')});
}

function frameView(kind,title,description,extra=''){
  return `<section class="workspace-card tool-frame-card"><header class="tool-frame-toolbar"><div><h2>${esc(title)}</h2><p>${esc(description)}</p></div><div class="tool-frame-actions">${extra}</div></header><iframe class="integrated-tool-frame" data-tool-frame="${esc(kind)}" title="${esc(title)}"></iframe></section>`;
}
function renderHub(){
  const actions=canManage()?`<span class="tool-status" data-map-count>Loading shared maps…</span><input hidden type="file" multiple accept="image/*,.svg,.html,.htm" data-publish-map-input><button data-publish-maps>Publish maps</button><button data-refresh-hub>Refresh</button>`:`<span class="tool-status">Player read-only view</span><button data-refresh-hub>Refresh</button>`;
  return frameView('campaignHub','Campaign Hub','Map hierarchy, areas, handouts, world links, and campaign-shared map assets.',actions);
}
function renderEffects(){
  if(!canManage())return '<div class="empty-workspace">Campaign-runner permission is required.</div>';
  return `<div class="runner-role-note"><strong>Campaign Runner Creation Tool</strong><br>Effects Studio is available equally to ${esc(RUNNER_TITLES)}. Its complete established editor appearance is preserved inside this workspace.</div>${frameView('effectsStudio','Effects Studio','Layered artwork, interactive maps, terrain, lighting, sound zones, animation, and Paint by Number.','<button data-open-tutorial="effects">Tutorial</button>')}`;
}
function renderDice(){return frameView('sessionDice','Session Dice','Shared 3D dice, nine-system bots, completed saved sheets, user colors, and live participant roll popups.','<button data-open-tutorial="dice">Tutorial</button>')}
function renderTutorials(){
  if(!canManage())return '<div class="empty-workspace">Campaign-runner permission is required.</div>';
  const settings=tutorialSettings(),completed=new Set(settings.completed||[]),selected=new Set(settings.selected||[]);
  return `<div class="workspace-grid"><section class="workspace-card span-12"><div class="tutorial-settings"><div><span class="eyebrow">OPTIONAL CAMPAIGN-RUNNER GUIDES</span><h2>Tool-specific tutorials</h2><p>Choose only the tools you want help with. You can disable every tutorial at any time.</p></div><label><input type="checkbox" data-tutorial-enabled ${settings.enabled?'checked':''}> Tutorials enabled</label></div><div class="tutorial-actions"><button data-tutorial-select-all>Select all</button><button data-tutorial-select-none>Select none</button><button data-tutorial-reset>Reset progress</button></div></section><section class="workspace-card span-12"><div class="tutorial-grid">${TUTORIALS.map(item=>`<article class="tutorial-card"><div class="tool-icon">${item.icon}</div><h3>${esc(item.title)}</h3><p>${esc(item.summary)}</p><label><input type="checkbox" data-tutorial-select="${esc(item.id)}" ${selected.has(item.id)?'checked':''}> Include this guide</label><div class="tutorial-actions"><button class="primary" data-open-tutorial="${esc(item.id)}">${completed.has(item.id)?'Review':'Start'} tutorial</button>${completed.has(item.id)?'<span class="status-pill approved">Completed</span>':''}</div></article>`).join('')}</div></section></div><p class="site-credit">${esc(CREDIT)}</p>`;
}
let docsQuery='',docsCategory='all';
function docUrl(path){return new URL(`docs/${String(path).split('/').map(encodeURIComponent).join('/')}`,ROOT_URL).href}
function renderDocs(){
  const docs=window.TableGateDocsCatalog||[],categories=[...new Set(docs.map(doc=>doc.category))].sort();
  const query=docsQuery.trim().toLowerCase();
  const filtered=docs.filter(doc=>(docsCategory==='all'||doc.category===docsCategory)&&(!query||doc.path.toLowerCase().includes(query)||(doc.content||'').toLowerCase().includes(query))).slice(0,500);
  return `<div class="workspace-grid"><section class="workspace-card span-12"><span class="eyebrow">PROJECT RECORD</span><h2>Documentation, licenses, sources, and audits</h2><p>Browse the current architecture, merge record, backend coverage, tutorials, test evidence, manifests, retained source notes, and third-party notices. Documentation files are records and are not executable legacy application code.</p><div class="docs-toolbar"><input type="search" data-docs-search value="${esc(docsQuery)}" placeholder="Search ${docs.length} documents"><select data-docs-category><option value="all">All categories</option>${categories.map(category=>`<option value="${esc(category)}" ${docsCategory===category?'selected':''}>${esc(category)}</option>`).join('')}</select></div><p>${filtered.length} matching document${filtered.length===1?'':'s'}</p></section><section class="workspace-card span-12"><div class="docs-list">${filtered.map(doc=>`<article class="doc-row"><div><b>${esc(doc.path)}</b><small>${esc(doc.extension.toUpperCase())} · ${bytes(doc.size)} · ${esc(doc.category)}</small></div><div class="docs-actions"><button data-doc-preview="${esc(doc.path)}">View</button><a href="${esc(docUrl(doc.path))}" target="_blank" rel="noopener">Open file</a></div></article>`).join('')||'<div class="empty-workspace">No documentation matches the current filters.</div>'}</div></section></div><p class="site-credit">${esc(CREDIT)}</p>`;
}
function previewDoc(path){
  const doc=(window.TableGateDocsCatalog||[]).find(item=>item.path===path);
  if(!doc)return;
  const body=doc.content===null?`<p>This ${esc(doc.extension.toUpperCase())} document is available as a file rather than an inline preview.</p><p><a href="${esc(docUrl(doc.path))}" target="_blank" rel="noopener">Open ${esc(doc.path)}</a></p>`:`<pre class="doc-preview">${esc(doc.content)}</pre>`;
  modal(doc.path,body,`<a class="secondary" href="${esc(docUrl(doc.path))}" target="_blank" rel="noopener">Open file</a><button data-close-modal>Close</button>`,true);
}
const RUNNER_TOOLS=[
  ['effects','✎','Effects Studio','Create layered artwork, maps, terrain, lighting, sound zones, animation, and Paint by Number.'],
  ['hub','▦','Campaign Hub','Build map hierarchies, campaign areas, handouts, links, and shared map assets.'],
  ['world','◉','World Studio','Write linked lore, locations, timelines, people, factions, and campaign references.'],
  ['maps','⌖','Map Foundry','Prepare map records, regions, scenes, travel data, and tabletop-ready assets.'],
  ['npcLives','♙','NPC Lives','Track people, homes, work, travel, relationships, routines, and living-world changes.'],
  ['encounters','⚡','Encounter Lab','Create editable encounter tables and generate campaign-ready situations.'],
  ['helpers','⌘','Campaign Helpers','Generate names, lineages, relationships, and connected campaign material.'],
  ['table','♟','Virtual Tabletop','Run maps, tokens, initiative, scenes, grids, handouts, and live encounters.'],
  ['privateDice','◆','Private Dice','Make runner-only checks and publish only the outcomes you choose.'],
  ['tutorials','?','Tutorials','Choose tool-specific guidance, track progress, or disable tutorials at any time.']
];
function runnerToolsMarkup(){
  return `<section class="workspace-card campaign-runner-tools"><div class="card-head"><div><span class="eyebrow">CAMPAIGN RUNNER CREATION</span><h2>Campaign Runner Creation Tools</h2><p>Available equally to ${esc(RUNNER_TITLES)}.</p></div></div><div class="runner-tool-grid">${RUNNER_TOOLS.map(([view,icon,title,summary])=>`<article class="runner-tool-card"><div class="tool-icon">${icon}</div><h3>${esc(title)}</h3><p>${esc(summary)}</p><div class="runner-tool-actions"><button class="primary" data-runner-tool="${esc(view)}">Open</button>${TUTORIALS.some(t=>t.id===view)?`<button data-open-tutorial="${esc(view)}">Tutorial</button>`:''}</div></article>`).join('')}</div></section>`;
}

Object.assign(WORKSPACE_VIEWS,{hub:'Campaign Hub',sessionDice:'Session Dice',effects:'Effects Studio',tutorials:'Tutorials',docs:'Docs',knowledge:'Knowledge Pack',backend:'Backend Center'});
const previousCreatorRender=CreatorArea.render.bind(CreatorArea);
CreatorArea.render=function(){
  const html=previousCreatorRender();
  return html.replace(/<\/div>\s*$/,`${runnerToolsMarkup()}<p class="site-credit">${esc(CREDIT)}</p></div>`);
};
const previousCreatorBind=CreatorArea.bind.bind(CreatorArea);
CreatorArea.bind=function(shell){
  previousCreatorBind(shell);
  shell.querySelectorAll('[data-runner-tool]').forEach(button=>button.onclick=()=>Workspace.open(button.dataset.runnerTool));
  shell.querySelectorAll('[data-open-tutorial]').forEach(button=>button.onclick=()=>openTutorial(button.dataset.openTutorial));
};
const previousOpen=Workspace.open.bind(Workspace);
Workspace.open=async function(view){
  if(['effects','tutorials'].includes(view)&&!canManage()){toast('Campaign-runner permission is required.','error');return}
  const result=await previousOpen(view);
  if(canManage())setTimeout(offerTutorials,250);
  return result;
};
const previousView=Workspace.renderView.bind(Workspace);
Workspace.renderView=function(view){
  if(view==='hub')return renderHub();
  if(view==='sessionDice')return renderDice();
  if(view==='effects')return renderEffects();
  if(view==='tutorials')return renderTutorials();
  if(view==='docs')return renderDocs();
  if(view==='knowledge')return window.TableGateKnowledgeBrowser?.render()||'<div class="empty-workspace">Knowledge catalog is unavailable.</div>';
  if(view==='backend')return window.TableGateBackendCenter?.render()||'<div class="empty-workspace">Backend route catalog is unavailable.</div>';
  return previousView(view);
};
function bindIntegratedView(view,shell){
  const frame=shell.querySelector('[data-tool-frame]');
  if(frame){
    const kind=frame.dataset.toolFrame;
    frame.srcdoc=documentFor(kind);
    if(kind==='campaignHub'){hubFrame=frame;frame.addEventListener('load',sendHubContext)}
    if(kind==='sessionDice')frame.addEventListener('load',()=>window.TableGateSessionRolls?.sendContext(frame));
  }
  if(view==='hub'){
    const input=shell.querySelector('[data-publish-map-input]');
    shell.querySelector('[data-publish-maps]')?.addEventListener('click',()=>input?.click());
    input?.addEventListener('change',async event=>{
      try{const saved=await uploadMaps(event.target.files);toast(`${saved.length} map file${saved.length===1?'':'s'} published.`,'success')}
      catch(error){showError(error)}finally{event.target.value=''}
    });
    shell.querySelector('[data-refresh-hub]')?.addEventListener('click',()=>refreshHub().catch(showError));
  }
  if(view==='tutorials'){
    shell.querySelector('[data-tutorial-enabled]')?.addEventListener('change',event=>{const settings=tutorialSettings();settings.enabled=event.target.checked;saveTutorialSettings(settings);toast(`Tutorials ${settings.enabled?'enabled':'disabled'}.`,'success')});
    shell.querySelectorAll('[data-tutorial-select]').forEach(input=>input.onchange=()=>{const settings=tutorialSettings(),set=new Set(settings.selected||[]);input.checked?set.add(input.dataset.tutorialSelect):set.delete(input.dataset.tutorialSelect);settings.selected=[...set];saveTutorialSettings(settings)});
    shell.querySelector('[data-tutorial-select-all]')?.addEventListener('click',()=>{const settings=tutorialSettings();settings.selected=TUTORIALS.map(item=>item.id);saveTutorialSettings(settings);Workspace.render()});
    shell.querySelector('[data-tutorial-select-none]')?.addEventListener('click',()=>{const settings=tutorialSettings();settings.selected=[];saveTutorialSettings(settings);Workspace.render()});
    shell.querySelector('[data-tutorial-reset]')?.addEventListener('click',()=>{const settings=tutorialSettings();settings.completed=[];settings.offered=false;saveTutorialSettings(settings);Workspace.render();toast('Tutorial progress reset.','success')});
  }
  shell.querySelectorAll('[data-open-tutorial]').forEach(button=>button.onclick=()=>openTutorial(button.dataset.openTutorial));
  if(view==='knowledge')window.TableGateKnowledgeBrowser?.bind(shell);
  if(view==='backend')window.TableGateBackendCenter?.bind(shell);
  if(view==='docs'){
    const search=shell.querySelector('[data-docs-search]'),category=shell.querySelector('[data-docs-category]');
    if(search)search.oninput=()=>{docsQuery=search.value;clearTimeout(search._timer);search._timer=setTimeout(()=>Workspace.render(),180)};
    if(category)category.onchange=()=>{docsCategory=category.value;Workspace.render()};
    shell.querySelectorAll('[data-doc-preview]').forEach(button=>button.onclick=()=>previewDoc(button.dataset.docPreview));
  }
}
Workspace.render=function(){
  const shell=$('#workspace-shell');if(!shell||!State.server)return;
  const view=this.current==='messenger'?'dashboard':this.current,creator=canManage();
  const playerViews=['dashboard','player','session','sessionDice','characters','table','hub','tasks','calendar','availability','library','knowledge','data','docs','backend','blog'];
  const creatorViews=['creator','effects','tutorials','forge','maps','npcLives','encounters','helpers','world','privateDice','admin'];
  const visible=[...playerViews,...(creator?creatorViews:[])];
  if(!visible.includes(view)){this.current='player';return this.render()}
  shell.innerHTML=`<div class="workspace-page">${backendNotice()}<header class="workspace-head"><button class="icon-btn" data-workspace-back title="Return to messenger">←</button><div class="workspace-title"><h1>${esc(WORKSPACE_VIEWS[view]||'Campaign Workspace')}</h1><p>${esc(State.server.name)} · ${creator?esc(CampaignIsolation.roleTitle())+' campaign-runner permissions':'player permissions'} · campaign-isolated</p></div><nav class="workspace-nav">${visible.map(item=>`<button class="${item===view?'active':''}" data-workspace-view="${item}">${esc(WORKSPACE_VIEWS[item])}</button>`).join('')}</nav></header><div id="workspace-content">${this.renderView(view)}</div><footer class="site-credit">${esc(CREDIT)}</footer></div>`;
  this.bind(shell);
  if(view==='world')WorldStudio.bind(shell);
  if(view==='table')VTTStudio.bind(shell);
  if(view==='creator')CreatorArea.bind(shell);
  if(view==='player')PlayerArea.bind(shell);
  if(view==='characters')TableGateCharacterVault.bind(shell);
  if(view==='session')TableGateSessionPlay.bind(shell);
  if(view==='maps')TableGateMapFoundry.bind(shell);
  if(view==='npcLives')TableGateNpcLives.bind(shell);
  if(view==='encounters')TableGateEncounterLab.bind(shell);
  if(view==='helpers')TableGateCampaignHelpers.bind(shell);
  if(view==='data')TableGateDataSources.bind(shell);
  if(view==='privateDice')TableGatePrivateDice.bind(shell);
  EmbeddedWorkspaces.bind(shell,view);
  bindIntegratedView(view,shell);
};
renderRail=function(){
  const rail=$('#server-rail');if(!rail)return;
  const creator=!!State.server&&canManage();
  const serverButtons=(State.servers||[]).map(server=>`<button class="rail-btn server-initial ${State.server?.id===server.id?'active':''}" data-server="${esc(server.id)}" title="${esc(server.name)}"><span>${esc(initials(server.name))}</span></button>`).join('');
  const modules=State.server?[
    ['messenger','💬','Messenger'],['dashboard','⌂','Organizer'],['player','👥','Player Area'],
    ['sessionDice','◆','Session Dice'],['characters','♙','Character Sheets'],['table','♟','Virtual Tabletop'],['hub','▦','Campaign Hub'],
    ...(creator?[['creator','🔒','Campaign Runner Creator Area'],['effects','✎','Effects Studio'],['tutorials','?','Tutorials'],['forge','⚒','Creator Forge'],['maps','⌖','Map Foundry'],['npcLives','♙','NPC Lives'],['encounters','⚡','Encounter Lab'],['helpers','⌘','Campaign Helpers'],['world','◉','World Studio'],['privateDice','◈','Private Dice']]:[]),
    ['calendar','▣','Calendar'],['library','▤','TTRPG System'],['knowledge','📖','Knowledge Pack'],['docs','§','Docs'],['backend','⇄','Backend Center'],['blog','🦖','Developer Blog']
  ]:[];
  rail.innerHTML=`<button class="rail-btn ${!State.server?'active':''}" data-home title="Direct messages"><img src="assets/images/tablegate/icons/tablegate-icon-48.png" width="28" height="28" alt="TableGate"></button><div class="rail-sep"></div>${serverButtons}<button class="rail-btn add" data-add-server title="Create campaign">+</button>${modules.length?'<div class="rail-sep"></div>':''}${modules.map(([view,icon,label])=>`<button class="rail-btn module-rail-btn ${Workspace.current===view||(view==='messenger'&&Workspace.current==='messenger')?'active':''}" data-module="${view}" title="${esc(label)}">${icon}</button>`).join('')}`;
  rail.onclick=event=>{
    const button=event.target.closest('button');if(!button)return;
    if(button.dataset.home!==undefined)selectHome();
    else if(button.dataset.server)selectServer(button.dataset.server);
    else if(button.dataset.addServer!==undefined)openCreateServer();
    else if(button.dataset.module){const view=button.dataset.module;view==='messenger'?Workspace.close():Workspace.open(view)}
  };
};
window.TableGateTools=Object.freeze({refreshHub,uploadMaps,context:hubContext,openTutorial,tutorials:TUTORIALS});
})();
