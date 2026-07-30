'use strict';
/* TableGate v6 integration: upgraded sheet library, editable encounter tables,
   campaign lineages/name/game helpers, and expanded provenance. */
(()=>{
Object.assign(WORKSPACE_VIEWS,{encounters:'Encounter Lab',helpers:'Campaign Helpers'});

const oldAllItems=CampaignIsolation.allItems.bind(CampaignIsolation);
CampaignIsolation.allItems=function(){
  const out=oldAllItems();
  const append=(source,items)=>{for(const x of items||[])out.push(this.wrap(source,x.type,x.key,x.title,x.raw,x.subtitle))};
  append('encounter-lab',window.TableGateEncounterLab?.publishableItems?.());
  append('campaign-helpers',window.TableGateCampaignHelpers?.publishableItems?.());
  return out;
};
const oldSnapshot=CampaignIsolation.publicSnapshot.bind(CampaignIsolation);
CampaignIsolation.publicSnapshot=function(item){
  const x=item.raw||{};
  if(item.type==='encounter-table')return{name:x.name,category:x.category,die:x.die,entries:(x.entries||[]).map(e=>({weight:Number(e.weight)||1,text:e.text}))};
  if(item.type==='encounter-result')return{title:x.title,createdAt:x.createdAt,system:x.system,environment:x.environment,danger:x.danger,partySize:x.partySize,partyLevel:x.partyLevel,summary:x.summary,actor:x.actor?.text,motive:x.motive?.text,location:x.location?.text,complication:x.complication?.text,reward:x.reward?.text,twist:x.twist?.text};
  if(item.type==='lineage-person')return window.TableGateCampaignHelpers?.publicPerson?.(x)||{name:x.name,pronouns:x.pronouns,identity:x.identity,species:x.species,role:x.role,notes:x.publicNotes};
  if(item.type==='lineage-relationship')return{id:x.id,fromId:x.fromId,toId:x.toId,type:x.type,notes:x.notes};
  if(item.type==='generated-name')return{name:x.name};
  return oldSnapshot(item);
};


const priorPlayerOpen=PlayerArea.open.bind(PlayerArea);
PlayerArea.open=function(key){
  const item=this.items().find(x=>x.key===key);if(!item)return;
  const s=item.snapshot||{};let body='';
  if(item.type==='encounter-result')body=`<article class="published-article"><p class="encounter-summary">${esc(s.summary||'')}</p><dl class="result-grid"><div><dt>Actors</dt><dd>${esc(s.actor||'')}</dd></div><div><dt>Motive</dt><dd>${esc(s.motive||'')}</dd></div><div><dt>Location</dt><dd>${esc(s.location||'')}</dd></div><div><dt>Complication</dt><dd>${esc(s.complication||'')}</dd></div><div><dt>Reward</dt><dd>${esc(s.reward||'')}</dd></div><div><dt>Twist</dt><dd>${esc(s.twist||'')}</dd></div></dl></article>`;
  else if(item.type==='encounter-table')body=`<article class="published-article"><p>${esc(s.category||'Custom')} · ${esc(s.die||'weighted')}</p><ol>${(s.entries||[]).map(e=>`<li><b>${esc(e.weight)}×</b> ${esc(e.text)}</li>`).join('')}</ol></article>`;
  else if(item.type==='lineage-person')body=`<article class="published-article"><div class="published-stats">${[['Pronouns',s.pronouns],['Identity',s.identity],['Species',s.species],['Role',s.role]].filter(x=>x[1]).map(([k,v])=>`<span><small>${esc(k)}</small><b>${esc(v)}</b></span>`).join('')}</div><p>${esc(s.notes||'')}</p></article>`;
  else if(item.type==='lineage-relationship')body=`<article class="published-article"><h3>${esc(s.type||'Relationship')}</h3><p>${esc(s.notes||'')}</p></article>`;
  else if(item.type==='generated-name')body=`<article class="published-article"><h2>${esc(s.name||item.title)}</h2><p>Pinned campaign name shared by the campaign creator.</p></article>`;
  else return priorPlayerOpen(key);
  modal(item.title,`<div class="published-detail"><span class="eyebrow">${esc(item.type)} · ${esc(State.server.name)}</span>${body}<small>Sent ${esc(new Date(item.publishedAt).toLocaleString())}</small></div>`,`<button data-close-modal>Close</button>`,true);
};

const priorOpen=Workspace.open.bind(Workspace);
Workspace.open=async function(view){
  if(['encounters','helpers'].includes(view)&&!CampaignIsolation.canCreate()){
    toast('That helper workspace is private to the campaign DM, GM, MOL, or equivalent creator role.','error');return;
  }
  return priorOpen(view);
};
const priorView=Workspace.renderView.bind(Workspace);
Workspace.renderView=function(view){
  if(view==='encounters')return TableGateEncounterLab.render();
  if(view==='helpers')return TableGateCampaignHelpers.render();
  return priorView(view);
};
Workspace.render=function(){
  const shell=$('#workspace-shell');if(!shell||!State.server)return;
  const view=this.current==='messenger'?'dashboard':this.current,creator=CampaignIsolation.canCreate();
  const playerViews=['dashboard','player','session','characters','table','tasks','calendar','availability','library','data','blog'];
  const creatorViews=['creator','forge','maps','npcLives','encounters','helpers','world','privateDice','admin'];
  const visible=[...playerViews,...(creator?creatorViews:[])];
  if(!visible.includes(view)){this.current='player';return this.render()}
  shell.innerHTML=`<div class="workspace-page">${backendNotice()}<header class="workspace-head"><button class="icon-btn" data-workspace-back title="Return to messenger">←</button><div class="workspace-title"><h1>${esc(WORKSPACE_VIEWS[view]||'Campaign Workspace')}</h1><p>${esc(State.server.name)} · ${creator?esc(CampaignIsolation.roleTitle())+' creator permissions':'player permissions'} · campaign-isolated</p></div><nav class="workspace-nav">${visible.map(v=>`<button class="${v===view?'active':''}" data-workspace-view="${v}">${esc(WORKSPACE_VIEWS[v])}</button>`).join('')}</nav></header><div id="workspace-content">${this.renderView(view)}</div></div>`;
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
};

renderRail=function(){
  const rail=$('#server-rail');if(!rail)return;
  const creator=!!State.server&&CampaignIsolation.canCreate();
  const serverButtons=(State.servers||[]).map(s=>`<button class="rail-btn server-initial ${State.server?.id===s.id?'active':''}" data-server="${esc(s.id)}" title="${esc(s.name)}"><span>${esc(initials(s.name))}</span></button>`).join('');
  const mods=State.server?[
    ['messenger','💬','Messenger'],['dashboard','⌂','Organizer'],['player','👥','Player Area'],
    ['session','🎲','Live Dice & Sheet'],['characters','🧙','Character Sheets'],['table','♟','Virtual Tabletop'],
    ...(creator?[['creator','🔒','Creator Area'],['forge','⚒','Creator Forge'],['maps','🗺','Map Foundry'],['npcLives','🏘','NPC Lives'],['encounters','⚡','Encounter Lab'],['helpers','🧬','Campaign Helpers'],['world','🌐','World Studio'],['privateDice','◈','Private Dice Bot']]:[]),
    ['calendar','▦','Calendar'],['library','📚','TTRPG System'],['data','⌘','Data & Sources'],['blog','🦖','Developer Blog']
  ]:[];
  rail.innerHTML=`<button class="rail-btn ${!State.server?'active':''}" data-home title="Direct messages">✦</button><div class="rail-sep"></div>${serverButtons}<button class="rail-btn add" data-add-server title="Create campaign">+</button>${mods.length?'<div class="rail-sep"></div>':''}${mods.map(([v,i,l])=>`<button class="rail-btn module-rail-btn ${Workspace.current===v||(v==='messenger'&&Workspace.current==='messenger')?'active':''}" data-module="${v}" title="${esc(l)}">${i}</button>`).join('')}`;
  rail.onclick=event=>{const b=event.target.closest('button');if(!b)return;if(b.dataset.home!==undefined)selectHome();else if(b.dataset.server)selectServer(b.dataset.server);else if(b.dataset.addServer!==undefined)openCreateServer();else if(b.dataset.module){const v=b.dataset.module;v==='messenger'?Workspace.close():Workspace.open(v)}};
};

window.addEventListener('tablegate:encounter-updated',()=>{if(Workspace.current==='creator')Workspace.render()});
window.addEventListener('tablegate:helpers-updated',()=>{if(Workspace.current==='creator')Workspace.render()});
})();
