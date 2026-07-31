'use strict';
/* TableGate v5 workspace integration: campaign character vault, dice-on-sheet play,
   hierarchical maps, NPC life simulation, private runner dice, and source provenance. */
(()=>{
Object.assign(WORKSPACE_VIEWS,{
  session:'Live Dice & Sheet',characters:'Character Sheets',maps:'Map Foundry',npcLives:'NPC Lives',
  data:'Data & Sources',privateDice:'Private Dice Bot'
});

/* The standalone sheet preview also receives complete identity placeholders so the
   patched character sheets never execute with unresolved bridge tokens. */
if(typeof EmbeddedWorkspaces!=='undefined'){
  EmbeddedWorkspaces.sheetSrcdoc=function(id){
    const sheet=(window.TABLEGATE_CHARACTER_SHEETS||[]).find(x=>x.id===id);
    const record={id:`preview_${id}`,serverId:CampaignIsolation.serverId(),ownerId:State.user?.id||'preview',name:'Standalone Preview',sheetId:id,state:{},sheetState:{},appearance:{}};
    return String(sheet?.html||'')
      .replaceAll('__TABLEGATE_CAMPAIGN_ID_JSON__',JSON.stringify(CampaignIsolation.serverId()))
      .replaceAll('__TABLEGATE_SHEET_ID_JSON__',JSON.stringify(id))
      .replaceAll('__TABLEGATE_CHARACTER_ID_JSON__',JSON.stringify(record.id))
      .replaceAll('__TABLEGATE_USER_ID_JSON__',JSON.stringify(record.ownerId))
      .replaceAll('__TABLEGATE_CHARACTER_RECORD_JSON__',JSON.stringify(record).replace(/<\//g,'<\\/'))
      .replaceAll('__TABLEGATE_SESSION_MODE_JSON__','false');
  };
}

const priorOpen=Workspace.open.bind(Workspace);
Workspace.open=async function(view){
  if(['maps','npcLives','privateDice'].includes(view)&&!CampaignIsolation.canCreate()){
    toast('That workspace is private to the campaign DM, GM, MOL, or equivalent creator role.','error');return;
  }
  if(view==='sheets')view='characters';
  return priorOpen(view);
};
const oldView=Workspace.renderView.bind(Workspace);
Workspace.renderView=function(view){
  if(view==='characters')return TableGateCharacterVault.render();
  if(view==='session')return TableGateSessionPlay.render();
  if(view==='maps')return TableGateMapFoundry.render();
  if(view==='npcLives')return TableGateNpcLives.render();
  if(view==='data')return TableGateDataSources.render();
  if(view==='privateDice')return TableGatePrivateDice.render();
  return oldView(view);
};
Workspace.render=function(){
  const shell=$('#workspace-shell');if(!shell||!State.server)return;
  const view=this.current==='messenger'?'dashboard':this.current,creator=CampaignIsolation.canCreate();
  const playerViews=['dashboard','player','session','characters','table','tasks','calendar','availability','library','data','blog'];
  const creatorViews=['creator','forge','maps','npcLives','world','privateDice','admin'];
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
  if(view==='data')TableGateDataSources.bind(shell);
  if(view==='privateDice')TableGatePrivateDice.bind(shell);
  EmbeddedWorkspaces.bind(shell,view);
};

/* Rebuild the rail rather than stacking multiple inherited module separators. */
renderRail=function(){
  const rail=$('#server-rail');if(!rail)return;
  const creator=!!State.server&&CampaignIsolation.canCreate();
  const serverButtons=(State.servers||[]).map(s=>`<button class="rail-btn server-initial ${State.server?.id===s.id?'active':''}" data-server="${esc(s.id)}" title="${esc(s.name)}"><span>${esc(initials(s.name))}</span></button>`).join('');
  const mods=State.server?[
    ['messenger','💬','Messenger'],['dashboard','⌂','Organizer'],['player','👥','Player Area'],
    ['session','🎲','Live Dice & Sheet'],['characters','🧙','Character Sheets'],['table','♟','Virtual Tabletop'],
    ...(creator?[['creator','🔒','Creator Area'],['forge','⚒','Creator Forge'],['maps','🗺','Map Foundry'],['npcLives','🏘','NPC Lives'],['world','🌐','World Studio'],['privateDice','◈','Private Dice Bot']]:[]),
    ['calendar','▦','Calendar'],['library','📚','TTRPG System'],['data','⌘','Data & Sources'],['blog','🦖','Developer Blog']
  ]:[];
  rail.innerHTML=`<button class="rail-btn ${!State.server?'active':''}" data-home title="Direct messages">✦</button><div class="rail-sep"></div>${serverButtons}<button class="rail-btn add" data-add-server title="Create campaign">+</button>${mods.length?'<div class="rail-sep"></div>':''}${mods.map(([v,i,l])=>`<button class="rail-btn module-rail-btn ${Workspace.current===v||(v==='messenger'&&Workspace.current==='messenger')?'active':''}" data-module="${v}" title="${esc(l)}">${i}</button>`).join('')}`;
  rail.onclick=event=>{const b=event.target.closest('button');if(!b)return;if(b.dataset.home!==undefined)selectHome();else if(b.dataset.server)selectServer(b.dataset.server);else if(b.dataset.addServer!==undefined)openCreateServer();else if(b.dataset.module){const v=b.dataset.module;v==='messenger'?Workspace.close():Workspace.open(v)}};
};

const oldSelectServer=selectServer;
selectServer=async function(id){
  const before=State.server?.id||'';
  const result=await oldSelectServer(id);
  if(before!==id){CampaignIsolation.reset();TableGateSessionPlay.pending=[];}
  renderRail();
  return result;
};

window.addEventListener('tablegate:character-saved',()=>{if(['characters','session'].includes(Workspace.current))Workspace.render()});
})();
