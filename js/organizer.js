'use strict';

const CAMPAIGN_SYSTEMS=[
  'Pathfinder 2e','Pathfinder 1e','Call of Cthulhu 7e','GURPS 4e','Dungeons & Dragons 5e',
  'Dungeons & Dragons 3.5e','Savage Worlds','Fate Core','Powered by the Apocalypse','Blades in the Dark',
  'Cyberpunk RED','Shadowrun','Vampire: The Masquerade','Traveller','Starfinder','Mork Borg','Old-School Essentials','Other / Custom'
];
const CALENDAR_TYPES={SESSION:'Session',AVAILABILITY:'Availability',DOCTOR:'Doctor appointment',BIRTHDAY:'Birthday',PERSONAL:'Personal event',DEADLINE:'Campaign deadline',OTHER:'Other'};
const WORKSPACE_VIEWS={dashboard:'Organizer',world:'World',table:'Tabletop',tasks:'Tasks',calendar:'Calendar',availability:'Availability',library:'TTRPG System',admin:'Approvals'};
const CampaignData={tasks:[],calendar:[],documents:[],ruleNotes:[],summary:null,month:new Date(new Date().getFullYear(),new Date().getMonth(),1),backendExtended:true,loading:false,lastServerId:'',filterSystem:'all',assistantResult:null};

function campaignLocalKey(){return `${CONFIG.storagePrefix}.campaign.${State.server?.id||'none'}`}
function localCampaignData(){
  try{return JSON.parse(localStorage.getItem(campaignLocalKey()))||{tasks:[],calendar:[],documents:[],ruleNotes:[]}}
  catch{return {tasks:[],calendar:[],documents:[],ruleNotes:[]}}
}
function saveLocalCampaign(data){localStorage.setItem(campaignLocalKey(),JSON.stringify(data))}
function localId(prefix){return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,9)}`}
function isoDate(v){if(!v)return '';try{return new Date(v).toISOString()}catch{return ''}}
function ymdLocal(d){const p=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`}
function displayDateTime(v,allDay=false){if(!v)return 'No date';const d=new Date(v);return d.toLocaleString(undefined,allDay?{weekday:'short',month:'short',day:'numeric'}:{weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}
function currentMember(){return State.members.find(m=>m.userId===State.user?.id)}
function memberName(id){const m=State.members.find(x=>x.userId===id);return m?.nickname||m?.user?.username||'Unassigned'}
function isRunner(){return hasPerm(PERM.ADMIN)||hasPerm(PERM.MANAGE_SERVER)||hasPerm(PERM.APPROVE_CALENDAR)||hasPerm(PERM.VIEW_PRIVATE_AVAILABILITY)}
function canManageOrganizer(){return hasPerm(PERM.ADMIN)||hasPerm(PERM.MANAGE_ORGANIZER)}
function canManageLibrary(){return hasPerm(PERM.ADMIN)||hasPerm(PERM.MANAGE_SYSTEM_LIBRARY)}
function canUploadSystems(){return hasPerm(PERM.ADMIN)||hasPerm(PERM.UPLOAD_SYSTEM_FILES)}
function canUseRulesAssistant(){return hasPerm(PERM.ADMIN)||hasPerm(PERM.USE_RULES_ASSISTANT)}
function cleanTags(v){return String(v||'').split(',').map(x=>x.trim()).filter(Boolean).slice(0,20)}
function statusClass(v){return String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,'_')}
function safeJson(v,fallback=[]){if(Array.isArray(v)||typeof v==='object'&&v)return v;try{return JSON.parse(v)}catch{return fallback}}

async function campaignCall(action,payload={},localFallback){
  try{return await API.call(action,{serverId:State.server.id,...payload})}
  catch(err){
    if(['UNKNOWN_ACTION','NOT_CONFIGURED','NETWORK_ERROR','INTERNAL_ERROR'].includes(err.code)){
      CampaignData.backendExtended=false;
      if(localFallback)return localFallback();
    }
    throw err;
  }
}
function backendNotice(){return CampaignData.backendExtended?'':`<div class="backend-warning"><b>Some shared organizer actions are not exposed by the configured backend.</b> This browser is preserving a local campaign mirror. Deploy the matching organizer routes to the supplied Apps Script web app to share tasks, calendar approvals, and rules-library changes across players.</div>`}

async function loadCampaignData(force=false){
  if(!State.server)return;
  if(!force&&CampaignData.lastServerId===State.server.id&&CampaignData.tasks.length+CampaignData.calendar.length+CampaignData.documents.length)return;
  CampaignData.loading=true;CampaignData.lastServerId=State.server.id;CampaignData.backendExtended=true;
  const local=localCampaignData();
  const [tasks,calendar,documents,notes]=await Promise.all([
    campaignCall('listOrganizerTasks',{},()=>local.tasks||[]),
    campaignCall('listCalendarItems',{includePending:true},()=>local.calendar||[]),
    campaignCall('listSystemDocuments',{},()=>local.documents||[]),
    campaignCall('listRuleNotes',{},()=>local.ruleNotes||[])
  ]).catch(err=>{showError(err);return [local.tasks||[],local.calendar||[],local.documents||[],local.ruleNotes||[]]});
  CampaignData.tasks=Array.isArray(tasks)?tasks:tasks?.tasks||[];
  CampaignData.calendar=Array.isArray(calendar)?calendar:calendar?.items||[];
  CampaignData.documents=Array.isArray(documents)?documents:documents?.documents||[];
  CampaignData.ruleNotes=Array.isArray(notes)?notes:notes?.notes||[];
  CampaignData.loading=false;
}
function persistLocalMirror(){saveLocalCampaign({tasks:CampaignData.tasks,calendar:CampaignData.calendar,documents:CampaignData.documents,ruleNotes:CampaignData.ruleNotes})}

const Workspace={
  current:'messenger',
  async open(view){
    if(view==='messenger'){this.close();return}
    if(!State.server){toast('Choose a campaign server first.','error');return}
    this.current=view;State.workspace=view;Store.set(`workspace.${State.server.id}`,view);
    $('#app').classList.add('workspace-open');$('#workspace-shell').classList.remove('hidden');
    await loadCampaignData();if(view==='world')await WorldStudio.ensure();if(view==='table')await VTTStudio.ensure();this.render();
  },
  close(){this.current='messenger';State.workspace='messenger';$('#app').classList.remove('workspace-open');$('#workspace-shell').classList.add('hidden');renderAll()},
  render(){
    const shell=$('#workspace-shell');if(!shell||!State.server)return;
    const view=this.current==='messenger'?'dashboard':this.current;
    const visibleViews=['dashboard','world','table','tasks','calendar','availability','library',...(isRunner()||canManageOrganizer()||canManageLibrary()?['admin']:[])];
    shell.innerHTML=`<div class="workspace-page">${backendNotice()}<header class="workspace-head"><button class="icon-btn" data-workspace-back title="Return to messenger">←</button><div class="workspace-title"><h1>${esc(WORKSPACE_VIEWS[view]||'Campaign Organizer')}</h1><p>${esc(State.server.name)} · shared planning and rules workspace</p></div><nav class="workspace-nav">${visibleViews.map(v=>`<button class="${v===view?'active':''}" data-workspace-view="${v}">${esc(WORKSPACE_VIEWS[v])}</button>`).join('')}</nav></header><div id="workspace-content">${this.renderView(view)}</div></div>`;
    this.bind(shell);if(view==='world')WorldStudio.bind(shell);if(view==='table')VTTStudio.bind(shell);
  },
  renderView(view){if(CampaignData.loading)return '<div class="empty-workspace">Loading campaign organizer…</div>';if(view==='world')return WorldStudio.render();if(view==='table')return VTTStudio.render();if(view==='dashboard')return renderDashboard();if(view==='tasks')return renderTaskBoard();if(view==='calendar')return renderCalendar();if(view==='availability')return renderAvailability();if(view==='library')return renderRulesLibrary();if(view==='admin')return renderApprovals();return renderDashboard()},
  bind(shell){
    shell.onclick=e=>{
      const back=e.target.closest('[data-workspace-back]');if(back){this.close();return}
      const nav=e.target.closest('[data-workspace-view]');if(nav){this.open(nav.dataset.workspaceView);return}
      handleWorkspaceClick(e).catch(showError);
    };
    bindDropZone(shell);
  }
};

function renderWorkspaceHeaderStats(){
  const pending=CampaignData.calendar.filter(x=>x.approvalStatus==='PENDING').length;
  const open=CampaignData.tasks.filter(x=>!['DONE','CANCELLED'].includes(x.status)).length;
  const next=CampaignData.calendar.filter(x=>x.approvalStatus==='APPROVED'&&new Date(x.startAt)>=new Date()&&x.itemType==='SESSION').sort((a,b)=>new Date(a.startAt)-new Date(b.startAt))[0];
  return {pending,open,next};
}
function renderDashboard(){
  const s=renderWorkspaceHeaderStats();const mine=CampaignData.tasks.filter(t=>t.assigneeUserId===State.user.id&&!['DONE','CANCELLED'].includes(t.status)).slice(0,5);
  const upcoming=CampaignData.calendar.filter(x=>x.approvalStatus==='APPROVED'&&new Date(x.startAt)>=new Date()).sort((a,b)=>new Date(a.startAt)-new Date(b.startAt)).slice(0,6);
  return `<div class="workspace-grid">
    <section class="workspace-card span-3"><div class="metric"><div class="metric-icon">🎲</div><div><strong>${s.next?esc(displayDateTime(s.next.startAt,s.next.allDay)):'—'}</strong><small>Next approved session</small></div></div></section>
    <section class="workspace-card span-3"><div class="metric"><div class="metric-icon">✓</div><div><strong>${s.open}</strong><small>Open campaign tasks</small></div></div></section>
    <section class="workspace-card span-3"><div class="metric"><div class="metric-icon">◷</div><div><strong>${s.pending}</strong><small>Calendar submissions pending</small></div></div></section>
    <section class="workspace-card span-3"><div class="metric"><div class="metric-icon">📚</div><div><strong>${CampaignData.documents.length}</strong><small>System and rules files</small></div></div></section>
    <section class="workspace-card span-7"><div class="card-head"><h2>Upcoming schedule</h2><div class="workspace-actions"><button data-add-calendar="SESSION" class="primary">Schedule session</button><button data-workspace-view="calendar">Full calendar</button></div></div><div class="agenda-stack">${upcoming.length?upcoming.map(agendaItemHtml).join(''):'<div class="empty-workspace">No approved upcoming events yet.</div>'}</div></section>
    <section class="workspace-card span-5"><div class="card-head"><h2>My assigned tasks</h2><button data-add-task>＋ Task</button></div><div class="task-stack">${mine.length?mine.map(taskCardHtml).join(''):'<div class="empty-workspace">No open tasks assigned to you.</div>'}</div></section>
    <section class="workspace-card span-6"><div class="card-head"><h2>Quick availability</h2><button data-add-calendar="AVAILABILITY">Add availability</button></div><p style="color:var(--muted)">Players can submit appointments, birthdays, unavailable times, and preferred play windows. Pending items remain limited until a runner approves them.</p><div class="workspace-actions"><button data-add-calendar="DOCTOR">Doctor appointment</button><button data-add-calendar="BIRTHDAY">Birthday</button><button data-add-calendar="AVAILABILITY">Unavailable / preferred</button></div></section>
    <section class="workspace-card span-6"><div class="card-head"><h2>TTRPG system library</h2><button data-workspace-view="library">Open library</button></div><p style="color:var(--muted)">Store campaign-approved JSON, PDF, DOCX, and TXT rules references. The grounded rules assistant searches indexed text and identifies likely roll expressions without replacing the source material.</p><div class="workspace-actions"><button data-open-assistant>Ask a rules question</button>${canUploadSystems()?'<button data-upload-system>Upload rules file</button>':''}</div></section>
  </div>`;
}

function taskCardHtml(t){
  const tags=safeJson(t.tags||t.tagsJson,[]);return `<article class="campaign-task priority-${esc(String(t.priority||'MEDIUM').toLowerCase())}" data-task-id="${esc(t.id)}"><h4>${esc(t.title)}</h4>${t.description?`<p>${esc(t.description)}</p>`:''}<div class="task-meta"><span class="status-pill ${statusClass(t.status)}">${esc(String(t.status||'TODO').replaceAll('_',' '))}</span><span class="tag-pill">👤 ${esc(memberName(t.assigneeUserId))}</span>${t.dueDate?`<span class="tag-pill">📅 ${esc(t.dueDate)}</span>`:''}${tags.slice(0,3).map(x=>`<span class="tag-pill">#${esc(x)}</span>`).join('')}</div></article>`
}
function renderTaskBoard(){
  const groups={TODO:[],IN_PROGRESS:[],DONE:[]};for(const t of CampaignData.tasks.filter(x=>x.status!=='CANCELLED'))(groups[t.status]||groups.TODO).push(t);
  return `<div class="workspace-actions" style="margin-bottom:13px"><button class="primary" data-add-task>＋ Add campaign task</button><button data-refresh-campaign>Refresh</button></div><div class="task-board">${[['TODO','To do'],['IN_PROGRESS','In progress'],['DONE','Completed']].map(([key,label])=>`<section class="task-column"><header><h3>${label}</h3><span class="status-pill">${groups[key].length}</span></header><div class="task-stack">${groups[key].length?groups[key].sort((a,b)=>(a.dueDate||'9999').localeCompare(b.dueDate||'9999')).map(taskCardHtml).join(''):'<div class="empty-workspace">Nothing here.</div>'}</div></section>`).join('')}</div>`;
}

function calendarMonthDates(month){const first=new Date(month.getFullYear(),month.getMonth(),1);const start=new Date(first);start.setDate(first.getDate()-first.getDay());return Array.from({length:42},(_,i)=>{const d=new Date(start);d.setDate(start.getDate()+i);return d})}
function visibleCalendarItems(){return CampaignData.calendar.filter(x=>!x.deletedAt)}
function eventsForDay(date){const key=ymdLocal(date);return visibleCalendarItems().filter(x=>String(x.startAt||'').slice(0,10)===key).sort((a,b)=>String(a.startAt).localeCompare(String(b.startAt)))}
function calendarTitleFor(item){if(item.visibility==='RUNNER_ONLY'&&!isRunner()&&item.submittedBy!==State.user.id)return 'Unavailable';return item.title||CALENDAR_TYPES[item.itemType]||'Event'}
function renderCalendar(){
  const month=CampaignData.month,dates=calendarMonthDates(month),today=ymdLocal(new Date());const upcoming=visibleCalendarItems().filter(x=>new Date(x.startAt)>=new Date()).sort((a,b)=>new Date(a.startAt)-new Date(b.startAt)).slice(0,10);
  return `<div class="workspace-actions" style="margin-bottom:13px"><button class="primary" data-add-calendar="SESSION">＋ Propose session</button><button data-add-calendar="OTHER">Add event</button><button data-refresh-campaign>Refresh</button></div><div class="calendar-layout"><section class="workspace-card calendar-panel"><div class="campaign-calendar-toolbar"><button data-month-shift="-1">←</button><h2>${esc(month.toLocaleDateString(undefined,{month:'long',year:'numeric'}))}</h2><button data-month-shift="1">→</button></div><div class="campaign-calendar">${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(x=>`<div class="calendar-weekday">${x}</div>`).join('')}${dates.map(d=>{const items=eventsForDay(d);return `<div class="calendar-day ${d.getMonth()!==month.getMonth()?'other':''} ${ymdLocal(d)===today?'today':''}"><div class="calendar-day-num">${d.getDate()}</div>${items.slice(0,4).map(i=>`<button class="calendar-event ${statusClass(i.itemType)} ${i.approvalStatus==='PENDING'?'pending':''} ${i.visibility==='RUNNER_ONLY'?'runner-only':''}" data-calendar-id="${esc(i.id)}" title="${esc(calendarTitleFor(i))}">${i.approvalStatus==='PENDING'?'◷ ':''}${esc(calendarTitleFor(i))}</button>`).join('')}${items.length>4?`<small style="color:var(--muted)">+${items.length-4} more</small>`:''}</div>`}).join('')}</div></section><aside class="workspace-card"><div class="card-head"><h2>Upcoming</h2></div><div class="agenda-stack">${upcoming.length?upcoming.map(agendaItemHtml).join(''):'<div class="empty-workspace">No calendar items.</div>'}</div></aside></div>`;
}
function agendaItemHtml(i){return `<article class="agenda-item ${statusClass(i.itemType)}" data-calendar-id="${esc(i.id)}"><h4>${esc(calendarTitleFor(i))}</h4><p>${esc(displayDateTime(i.startAt,i.allDay))}${i.approvalStatus==='PENDING'?' · pending approval':''}</p></article>`}

function renderAvailability(){
  const rows=visibleCalendarItems().filter(i=>['AVAILABILITY','DOCTOR','PERSONAL','BIRTHDAY'].includes(i.itemType)).sort((a,b)=>new Date(a.startAt)-new Date(b.startAt));
  return `<div class="workspace-actions" style="margin-bottom:13px"><button class="primary" data-add-calendar="AVAILABILITY">＋ Availability window</button><button data-add-calendar="DOCTOR">Doctor appointment</button><button data-add-calendar="BIRTHDAY">Birthday</button></div><section class="workspace-card"><div class="card-head"><h2>Party availability and life events</h2><span class="status-pill">${rows.length}</span></div><p style="color:var(--muted)">A submission remains pending and limited to the submitter and campaign runners until approved. Runner-only events can hide personal details from the wider party while still blocking the time for scheduling.</p><div class="availability-list">${rows.length?rows.map(i=>`<article class="availability-row" data-calendar-id="${esc(i.id)}"><div class="availability-time">${esc(displayDateTime(i.startAt,i.allDay))}</div><div><b>${esc(calendarTitleFor(i))}</b><div style="color:var(--muted);font-size:12px">${esc(memberName(i.submittedBy))} · ${esc(CALENDAR_TYPES[i.itemType]||i.itemType)} · ${esc(i.visibility||'SERVER')}</div></div><span class="status-pill ${statusClass(i.approvalStatus)}">${esc(i.approvalStatus||'PENDING')}</span></article>`).join(''):'<div class="empty-workspace">No availability submissions yet.</div>'}</div></section>`;
}

function renderRulesLibrary(){
  const systems=[...new Set(CampaignData.documents.map(d=>d.systemName).filter(Boolean))].sort();const docs=CampaignData.documents.filter(d=>CampaignData.filterSystem==='all'||d.systemName===CampaignData.filterSystem);
  return `<div class="workspace-grid"><section class="workspace-card span-12"><div class="card-head"><h2>TTRPG system drag-and-drop library</h2><span class="status-pill ${canUploadSystems()?'approved':'pending'}">${canUploadSystems()?'Upload permitted':'Upload permission required'}</span></div><div class="system-toolbar"><select id="system-select"><option value="">Choose system before dropping files</option>${CAMPAIGN_SYSTEMS.map(x=>`<option>${esc(x)}</option>`).join('')}</select><input id="system-tags" placeholder="Tags, comma separated — combat, spells, sanity, vehicles"><button data-choose-system-files ${canUploadSystems()?'':'disabled'}>Choose files</button></div><div id="system-drop-zone" class="drop-zone" tabindex="0"><input id="system-file-input" type="file" accept=".json,.pdf,.docx,.txt,application/json,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document" multiple><div><div class="drop-icon">📚</div><h3>Drop rules and system files here</h3><p>Accepted: JSON, PDF, DOCX, and TXT. Uploading requires the server role permission “upload system files.” Files are stored privately in the campaign backend and indexed when possible.</p></div></div><div id="system-upload-progress"></div></section>
  <section class="workspace-card span-7"><div class="card-head"><h2>Organized rules files</h2><select id="library-filter"><option value="all">All systems</option>${systems.map(x=>`<option ${CampaignData.filterSystem===x?'selected':''}>${esc(x)}</option>`).join('')}</select></div><div class="document-list">${docs.length?docs.map(documentRowHtml).join(''):'<div class="empty-workspace">No system files have been added.</div>'}</div></section>
  <section class="workspace-card span-5"><div class="card-head"><h2>Grounded rules assistant</h2><span class="status-pill ${canUseRulesAssistant()?'approved':'pending'}">${canUseRulesAssistant()?'Available':'Permission required'}</span></div><div class="assistant-box"><textarea id="assistant-query" rows="5" placeholder="Example: In Call of Cthulhu, what roll is used to resist a spell? Cite the uploaded rules."></textarea><div class="workspace-actions"><button class="primary" data-ask-rules ${canUseRulesAssistant()?'':'disabled'}>Search rules</button><button data-open-dice-from-rules>Open dice roller</button></div><div class="assistant-output" id="assistant-output">${CampaignData.assistantResult?assistantHtml(CampaignData.assistantResult):'Ask a question. Answers are limited to indexed campaign files and manual rule notes.'}</div></div></section></div>`;
}
function documentRowHtml(d){const ext=String(d.fileType||d.mimeType||'file').toUpperCase().replace(/.*\//,'');const tags=safeJson(d.tags||d.tagsJson,[]);return `<article class="document-row" data-document-id="${esc(d.id)}"><div class="document-icon">${ext.includes('PDF')?'PDF':ext.includes('DOC')?'W':ext.includes('JSON')?'{}':'TXT'}</div><div><h4>${esc(d.title||d.originalName||'Rules file')}</h4><p>${esc(d.systemName||'Unsorted')} · ${esc(d.fileType||d.mimeType||'file')} · uploaded by ${esc(memberName(d.uploadedBy))}</p><div>${tags.slice(0,5).map(x=>`<span class="tag-pill">#${esc(x)}</span>`).join(' ')} <span class="status-pill ${statusClass(d.extractionStatus||d.status)}">${esc((d.extractionStatus||d.status||'STORED').replaceAll('_',' '))}</span></div></div><div class="document-actions"><button data-document-notes="${esc(d.id)}" title="Add a manual rule note">✎</button>${d.attachmentId?`<button data-download-document="${esc(d.attachmentId)}" title="Download">↓</button>`:''}${canManageLibrary()?`<button data-reindex-document="${esc(d.id)}" title="Reindex">↻</button><button data-delete-document="${esc(d.id)}" title="Delete">×</button>`:''}</div></article>`}
function assistantHtml(r){const sources=r.sources||[];return `<b>${esc(r.answer||'Search complete.')}</b>${r.suggestedRoll?`<p>Suggested roll expression: <button class="source-code-badge" data-use-roll="${esc(r.suggestedRoll)}">${esc(r.suggestedRoll)}</button></p>`:''}<div class="assistant-sources">${sources.map(s=>`<div class="assistant-source"><b>${esc(s.title||'Source')}</b><small>${esc(s.systemName||'')} ${s.pageRef?`· ${esc(s.pageRef)}`:''}</small><div>${esc(s.excerpt||'')}</div></div>`).join('')||'<div>No indexed passage matched this question.</div>'}</div>`}

function renderApprovals(){
  if(!(isRunner()||canManageOrganizer()||canManageLibrary()))return '<div class="empty-workspace">You do not have organizer administration permissions.</div>';
  const pending=CampaignData.calendar.filter(i=>i.approvalStatus==='PENDING');
  return `<div class="workspace-grid"><section class="workspace-card span-8"><div class="card-head"><h2>Calendar approval queue</h2><span class="status-pill pending">${pending.length} pending</span></div><div class="approval-list">${pending.length?pending.map(i=>`<article class="approval-row"><div><h4>${esc(i.title)}</h4><p>${esc(CALENDAR_TYPES[i.itemType]||i.itemType)} · ${esc(displayDateTime(i.startAt,i.allDay))} · submitted by ${esc(memberName(i.submittedBy))}</p>${i.description?`<p>${esc(i.description)}</p>`:''}</div><div class="approval-actions"><button class="primary" data-approve-calendar="${esc(i.id)}">Approve</button><button class="danger" data-reject-calendar="${esc(i.id)}">Reject</button></div></article>`).join(''):'<div class="empty-workspace">Nothing is awaiting approval.</div>'}</div></section><section class="workspace-card span-4"><h2>Permission model</h2><p style="color:var(--muted)">Use Campaign menu → Roles to grant:</p><div class="document-list"><div class="document-row"><div class="document-icon">✓</div><div><h4>Manage organizer</h4><p>Edit and remove other users’ tasks.</p></div></div><div class="document-row"><div class="document-icon">◷</div><div><h4>Approve calendar</h4><p>Publish or reject availability and event submissions.</p></div></div><div class="document-row"><div class="document-icon">📚</div><div><h4>Upload system files</h4><p>Add JSON, PDF, DOCX, and TXT rules files.</p></div></div><div class="document-row"><div class="document-icon">🛡</div><div><h4>Manage system library</h4><p>Reindex and remove rules files.</p></div></div></div></section></div>`;
}

async function handleWorkspaceClick(e){
  if(Workspace.current==='world'&&await WorldStudio.handleClick(e))return;
  if(Workspace.current==='table'&&await VTTStudio.handleClick(e))return;
  const view=e.target.closest('[data-workspace-view]');if(view){await Workspace.open(view.dataset.workspaceView);return}
  if(e.target.closest('[data-refresh-campaign]')){await loadCampaignData(true);Workspace.render();return}
  if(e.target.closest('[data-add-task]')){openTaskEditor();return}
  const task=e.target.closest('[data-task-id]');if(task){openTaskEditor(CampaignData.tasks.find(x=>x.id===task.dataset.taskId));return}
  const addCal=e.target.closest('[data-add-calendar]');if(addCal){openCalendarEditor(null,addCal.dataset.addCalendar);return}
  const cal=e.target.closest('[data-calendar-id]');if(cal){openCalendarDetail(CampaignData.calendar.find(x=>x.id===cal.dataset.calendarId));return}
  const shift=e.target.closest('[data-month-shift]');if(shift){CampaignData.month=new Date(CampaignData.month.getFullYear(),CampaignData.month.getMonth()+Number(shift.dataset.monthShift),1);Workspace.render();return}
  if(e.target.closest('[data-upload-system]')||e.target.closest('[data-choose-system-files]')){$('#system-file-input')?.click();return}
  if(e.target.closest('[data-open-assistant]')){await Workspace.open('library');setTimeout(()=>$('#assistant-query')?.focus(),60);return}
  if(e.target.closest('[data-ask-rules]')){await askRules();return}
  if(e.target.closest('[data-open-dice-from-rules]')){Workspace.close();openDice();return}
  const useRoll=e.target.closest('[data-use-roll]');if(useRoll){Workspace.close();openDice();setTimeout(()=>{const input=$('#dice-expression');if(input)input.value=useRoll.dataset.useRoll},20);return}
  const approve=e.target.closest('[data-approve-calendar]');if(approve){await approveCalendar(approve.dataset.approveCalendar,true);return}
  const reject=e.target.closest('[data-reject-calendar]');if(reject){await approveCalendar(reject.dataset.rejectCalendar,false);return}
  const download=e.target.closest('[data-download-document]');if(download){await downloadAttachment(download.dataset.downloadDocument);return}
  const reindex=e.target.closest('[data-reindex-document]');if(reindex){await reindexDocument(reindex.dataset.reindexDocument);return}
  const del=e.target.closest('[data-delete-document]');if(del){await deleteSystemDocument(del.dataset.deleteDocument);return}
  const notes=e.target.closest('[data-document-notes]');if(notes){openRuleNoteEditor(notes.dataset.documentNotes);return}
}

function openTaskEditor(task=null){
  const assignees=`<option value="">Unassigned / shared</option>${State.members.map(m=>`<option value="${esc(m.userId)}" ${task?.assigneeUserId===m.userId?'selected':''}>${esc(m.nickname||m.user?.username)}</option>`).join('')}`;
  modal(task?'Edit campaign task':'Add campaign task',`<div class="field"><label>Task</label><input id="campaign-task-title" maxlength="160" value="${esc(task?.title||'')}"></div><div class="field"><label>Description</label><textarea id="campaign-task-description" rows="4" maxlength="4000">${esc(task?.description||'')}</textarea></div><div class="split"><div class="field"><label>Status</label><select id="campaign-task-status">${['TODO','IN_PROGRESS','DONE','CANCELLED'].map(x=>`<option ${task?.status===x?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>Priority</label><select id="campaign-task-priority">${['LOW','MEDIUM','HIGH'].map(x=>`<option ${String(task?.priority||'MEDIUM')===x?'selected':''}>${x}</option>`).join('')}</select></div></div><div class="split"><div class="field"><label>Assign to</label><select id="campaign-task-assignee">${assignees}</select></div><div class="field"><label>Due date</label><input id="campaign-task-due" type="date" value="${esc(task?.dueDate||'')}"></div></div><div class="field"><label>Tags</label><input id="campaign-task-tags" value="${esc(safeJson(task?.tags||task?.tagsJson,[]).join(', '))}" placeholder="session prep, maps, character, shopping"></div>`,`<button class="secondary" data-close-modal>Cancel</button>${task&&(task.createdBy===State.user.id||canManageOrganizer())?'<button class="danger" data-delete-campaign-task>Delete</button>':''}<button class="primary" data-save-campaign-task>Save</button>`);
  const root=$('#modal-root');root.querySelector('[data-save-campaign-task]').onclick=async()=>{const payload={title:$('#campaign-task-title').value,description:$('#campaign-task-description').value,status:$('#campaign-task-status').value,priority:$('#campaign-task-priority').value,assigneeUserId:$('#campaign-task-assignee').value,dueDate:$('#campaign-task-due').value,tags:cleanTags($('#campaign-task-tags').value)};if(!payload.title.trim())return toast('A task title is required.','error');try{let saved;if(task){saved=await campaignCall('updateOrganizerTask',{taskId:task.id,...payload},()=>({...task,...payload,tags:payload.tags,updatedAt:new Date().toISOString()}));CampaignData.tasks=CampaignData.tasks.map(x=>x.id===task.id?saved:x)}else{saved=await campaignCall('createOrganizerTask',payload,()=>({id:localId('task'),serverId:State.server.id,createdBy:State.user.id,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),...payload,tags:payload.tags}));CampaignData.tasks.push(saved)}persistLocalMirror();closeModal();Workspace.render()}catch(err){showError(err)}};
  root.querySelector('[data-delete-campaign-task]')?.addEventListener('click',async()=>{if(!confirm('Delete this campaign task?'))return;try{await campaignCall('deleteOrganizerTask',{taskId:task.id},()=>({deleted:true}));CampaignData.tasks=CampaignData.tasks.filter(x=>x.id!==task.id);persistLocalMirror();closeModal();Workspace.render()}catch(err){showError(err)}})
}

function openCalendarEditor(item=null,type='OTHER'){
  type=item?.itemType||type;const start=item?.startAt?new Date(item.startAt):new Date(Date.now()+86400000);const end=item?.endAt?new Date(item.endAt):new Date(start.getTime()+3*3600000);const localInput=d=>{const p=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`};
  const defaultTitle={SESSION:'Game session',AVAILABILITY:'Available / unavailable',DOCTOR:'Doctor appointment',BIRTHDAY:'Birthday',PERSONAL:'Personal event',DEADLINE:'Campaign deadline',OTHER:''}[type]||'';
  modal(item?'Edit calendar submission':'Submit calendar item',`<div class="field"><label>Title</label><input id="calendar-title" maxlength="180" value="${esc(item?.title||defaultTitle)}"></div><div class="split"><div class="field"><label>Type</label><select id="calendar-type">${Object.entries(CALENDAR_TYPES).map(([k,v])=>`<option value="${k}" ${(item?.itemType||type)===k?'selected':''}>${esc(v)}</option>`).join('')}</select></div><div class="field"><label>Visibility</label><select id="calendar-visibility"><option value="SERVER" ${item?.visibility==='SERVER'?'selected':''}>Party calendar after approval</option><option value="RUNNER_ONLY" ${item?.visibility==='RUNNER_ONLY'?'selected':''}>Runner only / hide personal details</option><option value="PRIVATE" ${item?.visibility==='PRIVATE'?'selected':''}>Only me and approving admins</option></select></div></div><div class="split"><div class="field"><label>Starts</label><input id="calendar-start" type="datetime-local" value="${localInput(start)}"></div><div class="field"><label>Ends</label><input id="calendar-end" type="datetime-local" value="${localInput(end)}"></div></div><label class="list-row"><input id="calendar-all-day" type="checkbox" ${item?.allDay?'checked':''}> All-day event</label><div class="field"><label>Details</label><textarea id="calendar-description" rows="4" maxlength="4000">${esc(item?.description||'')}</textarea></div><div class="info-box">All player submissions begin as pending. They do not appear fully on the shared calendar until a runner or administrator approves them.</div>`,`<button class="secondary" data-close-modal>Cancel</button>${item&&(item.submittedBy===State.user.id||isRunner())?'<button class="danger" data-delete-calendar>Delete</button>':''}<button class="primary" data-save-calendar>${item?'Save changes':'Submit for approval'}</button>`);
  const root=$('#modal-root');root.querySelector('[data-save-calendar]').onclick=async()=>{const payload={title:$('#calendar-title').value,itemType:$('#calendar-type').value,visibility:$('#calendar-visibility').value,startAt:new Date($('#calendar-start').value).toISOString(),endAt:new Date($('#calendar-end').value).toISOString(),allDay:$('#calendar-all-day').checked,description:$('#calendar-description').value};if(!payload.title.trim())return toast('A calendar title is required.','error');try{let saved;if(item){saved=await campaignCall('updateCalendarItem',{calendarItemId:item.id,...payload},()=>({...item,...payload,approvalStatus:'PENDING',updatedAt:new Date().toISOString()}));CampaignData.calendar=CampaignData.calendar.map(x=>x.id===item.id?saved:x)}else{saved=await campaignCall('submitCalendarItem',payload,()=>({id:localId('cal'),serverId:State.server.id,submittedBy:State.user.id,approvalStatus:'PENDING',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),...payload}));CampaignData.calendar.push(saved)}persistLocalMirror();closeModal();Workspace.render();toast(saved.approvalStatus==='APPROVED'?'Calendar item published.':'Submitted for calendar approval.','success')}catch(err){showError(err)}};
  root.querySelector('[data-delete-calendar]')?.addEventListener('click',async()=>{if(!confirm('Delete this calendar item?'))return;try{await campaignCall('deleteCalendarItem',{calendarItemId:item.id},()=>({deleted:true}));CampaignData.calendar=CampaignData.calendar.filter(x=>x.id!==item.id);persistLocalMirror();closeModal();Workspace.render()}catch(err){showError(err)}})
}
function openCalendarDetail(item){if(!item)return;const canEdit=item.submittedBy===State.user.id||isRunner();modal(calendarTitleFor(item),`<div class="card"><p><b>${esc(CALENDAR_TYPES[item.itemType]||item.itemType)}</b> · ${esc(displayDateTime(item.startAt,item.allDay))}</p><p>${esc(item.description||'No additional details.')}</p><p>Submitted by ${esc(memberName(item.submittedBy))}</p><span class="status-pill ${statusClass(item.approvalStatus)}">${esc(item.approvalStatus)}</span> <span class="tag-pill">${esc(item.visibility)}</span></div>`,`<button class="secondary" data-close-modal>Close</button>${canEdit?'<button class="primary" data-edit-calendar>Open editor</button>':''}`);$('#modal-root').querySelector('[data-edit-calendar]')?.addEventListener('click',()=>openCalendarEditor(item))}
async function approveCalendar(id,approved){const item=CampaignData.calendar.find(x=>x.id===id);if(!item)return;let reason='';if(!approved){reason=prompt('Optional reason for rejection:','')??''}const saved=await campaignCall(approved?'approveCalendarItem':'rejectCalendarItem',{calendarItemId:id,reason},()=>({...item,approvalStatus:approved?'APPROVED':'REJECTED',approvedBy:approved?State.user.id:'',rejectionReason:reason,updatedAt:new Date().toISOString()}));CampaignData.calendar=CampaignData.calendar.map(x=>x.id===id?saved:x);persistLocalMirror();Workspace.render();toast(approved?'Calendar item approved.':'Calendar item rejected.','success')}

function bindDropZone(shell){
  const zone=shell.querySelector('#system-drop-zone'),input=shell.querySelector('#system-file-input'),choose=shell.querySelector('[data-choose-system-files]'),filter=shell.querySelector('#library-filter');if(!zone)return;
  const receive=files=>uploadSystemFiles([...files]).catch(showError);
  ['dragenter','dragover'].forEach(n=>zone.addEventListener(n,e=>{e.preventDefault();zone.classList.add('dragover')}));['dragleave','drop'].forEach(n=>zone.addEventListener(n,e=>{e.preventDefault();zone.classList.remove('dragover')}));zone.addEventListener('drop',e=>receive(e.dataTransfer.files));zone.addEventListener('click',()=>{if(canUploadSystems())input.click()});zone.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&canUploadSystems())input.click()});input.onchange=e=>receive(e.target.files);if(filter)filter.onchange=e=>{CampaignData.filterSystem=e.target.value;Workspace.render()}
}
async function uploadSystemFiles(files){
  if(!canUploadSystems())throw new ApiError('FORBIDDEN','Your server role does not include upload system files.');const system=$('#system-select')?.value||'';if(!system)throw new ApiError('SYSTEM_REQUIRED','Choose the TTRPG system before uploading.');const tags=cleanTags($('#system-tags')?.value||'');const allowed=['json','pdf','docx','txt'];const progress=$('#system-upload-progress');let done=0;
  for(const file of files){const ext=file.name.split('.').pop().toLowerCase();if(!allowed.includes(ext)){toast(`${file.name}: unsupported file type.`,'error');continue}if(file.size>(State.clientConfig?.maxUploadBytes||5*1024*1024)){toast(`${file.name}: file is too large for the backend limit.`,'error');continue}if(progress)progress.innerHTML=`<div class="file-progress"><i style="width:${Math.round(done/Math.max(files.length,1)*100)}%"></i></div><small>Uploading ${esc(file.name)}…</small>`;
    const base64=await fileToBase64(file);let doc;
    if(CampaignData.backendExtended){const a=await API.call('uploadAttachment',{fileName:file.name,mimeType:file.type||mimeForExt(ext),base64,serverId:State.server.id,systemUpload:true});doc=await campaignCall('createSystemDocument',{attachmentId:a.id,systemName:system,title:file.name,fileType:ext.toUpperCase(),mimeType:file.type||mimeForExt(ext),tags},null)}
    if(!doc){const extracted=await localExtractFile(file);doc={id:localId('doc'),serverId:State.server.id,systemName:system,title:file.name,fileType:ext.toUpperCase(),mimeType:file.type||mimeForExt(ext),tags,uploadedBy:State.user.id,attachmentId:'',extractedText:extracted.text,extractionStatus:extracted.status,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}}
    CampaignData.documents.push(doc);done++;
  }
  persistLocalMirror();if(progress)progress.innerHTML='';Workspace.render();toast(`${done} system file${done===1?'':'s'} added.`,'success')
}
function mimeForExt(ext){return {json:'application/json',pdf:'application/pdf',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',txt:'text/plain'}[ext]||'application/octet-stream'}
async function localExtractFile(file){const ext=file.name.split('.').pop().toLowerCase();try{if(ext==='txt'||ext==='json'){let text=await file.text();if(ext==='json')try{text=JSON.stringify(JSON.parse(text),null,2)}catch{}return{text:text.slice(0,250000),status:'INDEXED'}}if(ext==='docx'){const zip=await JSZip.loadAsync(file),xml=await zip.file('word/document.xml')?.async('text');if(!xml)return{text:'',status:'STORED_ONLY'};const doc=new DOMParser().parseFromString(xml,'application/xml');const text=[...doc.getElementsByTagNameNS('*','t')].map(n=>n.textContent).join(' ');return{text:text.slice(0,250000),status:'INDEXED'}}return{text:'',status:'STORED_ONLY'}}catch{return{text:'',status:'FAILED'}}}
async function askRules(){const query=$('#assistant-query')?.value.trim();if(!query)return toast('Enter a rules question.','error');let result=await campaignCall('askRulesAssistant',{query,limit:6},()=>localRulesSearch(query));CampaignData.assistantResult=result;const out=$('#assistant-output');if(out)out.innerHTML=assistantHtml(result)}
function localRulesSearch(query){const tokens=query.toLowerCase().split(/[^a-z0-9]+/).filter(x=>x.length>2);const sources=[];for(const d of CampaignData.documents){const text=String(d.extractedText||'');if(!text)continue;const lower=text.toLowerCase();let score=0;tokens.forEach(t=>score+=(lower.match(new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'))||[]).length);if(score){const first=Math.max(0,Math.min(...tokens.map(t=>lower.indexOf(t)).filter(x=>x>=0))-180);sources.push({score,title:d.title,systemName:d.systemName,excerpt:text.slice(first,first+700)})}}for(const n of CampaignData.ruleNotes){const lower=String(n.text||'').toLowerCase();let score=tokens.filter(t=>lower.includes(t)).length*3;if(score)sources.push({score,title:n.title||'Manual rule note',systemName:n.systemName||'',pageRef:n.pageRef||'',excerpt:n.text})}sources.sort((a,b)=>b.score-a.score);const system=(sources[0]?.systemName||'').toLowerCase();let suggestedRoll=(query.match(/\b\d*d\d+(?:\s*[+\-]\s*\d+)?\b/i)||[])[0]||'';if(!suggestedRoll){if(system.includes('gurps'))suggestedRoll='3d6';else if(system.includes('cthulhu'))suggestedRoll='1d100';else if(system.includes('pathfinder')||system.includes('dungeons'))suggestedRoll='1d20'}return{answer:sources.length?`Found ${Math.min(sources.length,6)} grounded match${sources.length===1?'':'es'} in the campaign rules library. Verify the cited passage before applying a ruling.`:'No indexed passage matched. Add a manual rule note or enable PDF text indexing in the Apps Script backend.',suggestedRoll,sources:sources.slice(0,6)}}
async function reindexDocument(id){const doc=CampaignData.documents.find(x=>x.id===id);if(!doc)return;const saved=await campaignCall('reindexSystemDocument',{documentId:id},()=>({...doc,extractionStatus:doc.extractedText?'INDEXED':'STORED_ONLY',updatedAt:new Date().toISOString()}));CampaignData.documents=CampaignData.documents.map(x=>x.id===id?saved:x);persistLocalMirror();Workspace.render();toast('Reindex complete.','success')}
async function deleteSystemDocument(id){if(!confirm('Delete this rules document from the campaign library?'))return;await campaignCall('deleteSystemDocument',{documentId:id},()=>({deleted:true}));CampaignData.documents=CampaignData.documents.filter(x=>x.id!==id);persistLocalMirror();Workspace.render()}
function openRuleNoteEditor(documentId){const doc=CampaignData.documents.find(x=>x.id===documentId);modal('Add manual rule note',`<div class="field"><label>Title</label><input id="rule-note-title" value="${esc(doc?.title||'Rule note')}"></div><div class="split"><div class="field"><label>System</label><input id="rule-note-system" value="${esc(doc?.systemName||'')}"></div><div class="field"><label>Page / section</label><input id="rule-note-page" placeholder="p. 214 or Combat: Grappling"></div></div><div class="field"><label>Rule text or your campaign clarification</label><textarea id="rule-note-text" rows="8"></textarea></div><div class="field"><label>Tags</label><input id="rule-note-tags" placeholder="combat, sanity, magic"></div>`,`<button class="secondary" data-close-modal>Cancel</button><button class="primary" data-save-rule-note>Save note</button>`);$('#modal-root').querySelector('[data-save-rule-note]').onclick=async()=>{const payload={documentId,title:$('#rule-note-title').value,systemName:$('#rule-note-system').value,pageRef:$('#rule-note-page').value,text:$('#rule-note-text').value,tags:cleanTags($('#rule-note-tags').value)};if(!payload.text.trim())return toast('Rule note text is required.','error');const note=await campaignCall('createRuleNote',payload,()=>({id:localId('note'),serverId:State.server.id,createdBy:State.user.id,createdAt:new Date().toISOString(),...payload}));CampaignData.ruleNotes.push(note);persistLocalMirror();closeModal();toast('Rule note saved.','success')}
}

// Merge the organizer navigation into the server rail while retaining the Discord-clone server rail.
const baseRenderRail=renderRail;
renderRail=function(){
  baseRenderRail();const rail=$('#server-rail');if(!rail)return;const add=rail.querySelector('[data-add-server]');const sep=document.createElement('div');sep.className='rail-sep';const modules=[['messenger','💬','Messenger'],['dashboard','⌂','Organizer'],['world','🌐','World'],['table','🎲','Tabletop'],['tasks','✓','Tasks'],['calendar','▦','Calendar'],['availability','◷','Availability'],['library','📚','TTRPG system']];if(State.server&&(isRunner()||canManageOrganizer()||canManageLibrary()))modules.push(['admin','🛡','Approvals']);const frag=document.createDocumentFragment();frag.append(sep);for(const [view,icon,label] of modules){const b=document.createElement('button');b.className=`rail-btn module-rail-btn ${Workspace.current===view||(view==='messenger'&&Workspace.current==='messenger')?'active':''}`;b.dataset.module=view;b.title=label;b.textContent=icon;frag.append(b)}rail.insertBefore(frag,add);if(!rail.dataset.moduleBound){rail.dataset.moduleBound='1';rail.addEventListener('click',e=>{const b=e.target.closest('[data-module]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();Workspace.open(b.dataset.module)},true)}
};
const baseSelectServer=selectServer;
selectServer=async function(id){await baseSelectServer(id);CampaignData.lastServerId='';const saved=Store.get(`workspace.${id}`,'messenger');if(saved&&saved!=='messenger')await Workspace.open(saved)};
const baseSelectChannel=selectChannel;
selectChannel=async function(id){if(Workspace.current!=='messenger'){Workspace.current='messenger';$('#app').classList.remove('workspace-open');$('#workspace-shell').classList.add('hidden')}return baseSelectChannel(id)};
const baseSelectDm=selectDm;
selectDm=async function(id){if(Workspace.current!=='messenger'){Workspace.current='messenger';$('#app').classList.remove('workspace-open');$('#workspace-shell').classList.add('hidden')}return baseSelectDm(id)};
const baseSelectHome=selectHome;
selectHome=function(){Workspace.current='messenger';$('#app').classList.remove('workspace-open');$('#workspace-shell').classList.add('hidden');return baseSelectHome()};

// Reintroduce Discord-clone notification cues from ZeusIX without forcing sound on users.
const baseLoadMessages=loadMessages;
loadMessages=async function(before=''){const oldLast=State.messages[State.messages.length-1]?.id||'';await baseLoadMessages(before);const newest=State.messages[State.messages.length-1];if(!before&&oldLast&&newest?.id!==oldLast&&newest?.authorId!==State.user?.id&&Store.get('soundEnabled',true)){new Audio('assets/sounds/message.mp3').play().catch(()=>{})}};
const baseShowIncomingCall=showIncomingCall;
showIncomingCall=function(call){if(Store.get('soundEnabled',true))new Audio('assets/sounds/ringtone.mp3').play().catch(()=>{});return baseShowIncomingCall(call)};

// Add PWA installation and organizer permissions to the existing settings experience.
const baseOpenUserSettings=openUserSettings;
openUserSettings=function(){baseOpenUserSettings();const body=$('#modal-root .modal-body');if(body)body.insertAdjacentHTML('beforeend',`<div class="card" style="margin-top:14px"><h3>Install Tablegate</h3><p style="color:var(--muted)">Install the same messenger on mobile or desktop from a secure HTTPS host.</p><button class="secondary" data-install-app ${window.__tablegateInstallPrompt?'':'disabled'}>Install app</button></div>`);$('#modal-root').querySelector('[data-install-app]')?.addEventListener('click',()=>window.installTablegate?.())};
