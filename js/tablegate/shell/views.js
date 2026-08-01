import { CONFIG, FREE_PROMISE, PERMISSIONS, ROLE_ORDER, HOST_TITLES, FINDER_ROLES, getConfiguredSystems, getSystemName } from './config.js';
import { array, avatar, escapeAttr, escapeHtml, formatDateTime, formatDay, formatTime, hasPermission, icon, initials, relativeTime } from './utils.js';
import { renderOrganizer, renderSystemLibrary, renderWorkspaceHub } from './workspaces.js';

const systemName = id => getSystemName(id);
const systems = () => getConfiguredSystems();
const hostOptions = () => HOST_TITLES.map(([id,label]) => `<option value="${escapeAttr(id)}">${escapeHtml(label)}</option>`).join('');
const userName = user => user?.displayTag || (user ? `${user.username || 'User'}${user.discriminator ? `#${user.discriminator}` : ''}` : 'Unknown user');
const actionButton = (action, label, options = {}) => `<button class="btn ${options.className || ''}" data-action="${escapeAttr(action)}" ${options.attrs || ''}>${options.icon ? icon(options.icon) : ''}${escapeHtml(label)}</button>`;
const iconButton = (action, label, iconName, attrs = '') => `<button class="icon-button" data-action="${escapeAttr(action)}" aria-label="${escapeAttr(label)}" title="${escapeAttr(label)}" ${attrs}>${icon(iconName)}</button>`;

export function getRoleClass(state, member = null) {
  const active = state.activeTablegate;
  member ||= active?.member || null;
  if (!member) return 'VISITOR';
  if (member.isOwner || member.ownerProtected || active?.tablegate?.owner?.id === member.userId) return 'OWNER';
  const roles = member.roles || [];
  if (roles.some(role => role.managedKey === 'ADMIN' || role.managedKey === 'CREATOR')) return 'ADMIN';
  if (member.membershipType === 'ADMIN' || (member.userId === state.me?.id && active?.membershipType === 'ADMIN')) return 'ADMIN';
  if (roles.some(role => role.managedKey === 'MODERATOR' || String(role.name).toLowerCase() === 'moderator')) return 'MODERATOR';
  const permissions = member.userId === state.me?.id ? Number(active?.permissions || 0) : roles.reduce((mask, role) => mask | Number(role.permissions || 0), 0);
  if (!hasPermission(permissions, PERMISSIONS.ADMIN) && (hasPermission(permissions, PERMISSIONS.MANAGE_MESSAGES) || hasPermission(permissions, PERMISSIONS.KICK_MEMBERS) || hasPermission(permissions, PERMISSIONS.BAN_MEMBERS))) return 'MODERATOR';
  if (member.membershipType === 'PLAYER' || roles.some(role => role.managedKey === 'PLAYER')) return 'PLAYER';
  return 'VISITOR';
}

function roleBadge(role) {
  const label = role === 'OWNER' ? 'Owner' : role[0] + role.slice(1).toLowerCase();
  return `<span class="role-badge ${role.toLowerCase()}">${escapeHtml(label)}</span>`;
}
function freeBadge() { return `<span class="free-badge">${icon('check')} Completely free · no paywalls</span>`; }
function pageHeader(title, subtitle = '', actions = '') {
  return `<header class="page-header"><div><h1>${escapeHtml(title)}</h1>${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ''}</div>${actions ? `<div class="page-actions">${actions}</div>` : ''}</header>`;
}
function emptyState(iconText, title, body, action = '') {
  return `<div class="empty-state"><div><div class="icon">${iconText}</div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(body)}</p>${action}</div></div>`;
}
function loadingState(label = 'Loading TableGate…') { return `<div class="loading-state"><div><span class="connection-dot"></span> ${escapeHtml(label)}</div></div>`; }
function cardLogo(tablegate) {
  return `<div class="card-logo">${escapeHtml(initials(tablegate?.name || 'TG'))}</div>`;
}

export function renderAuth(state) {
  const modeText = state.mode === 'demo'
    ? 'Interface preview mode — sample data only'
    : state.connection === 'online' ? 'Backend connected'
      : state.connection === 'error' ? 'Backend connection failed'
        : 'Checking backend connection';
  const tab = state.authTab || 'login';
  const savedEmail = escapeAttr(state.pendingAuthEmail || '');
  const form = tab === 'register' ? `
    <form class="auth-form" data-form="register">
      <label class="field"><span>Username</span><input name="username" autocomplete="username" minlength="2" maxlength="32" required></label>
      <label class="field"><span>Email</span><input name="email" type="email" autocomplete="email" value="${savedEmail}" required></label>
      <label class="field"><span>Account age band</span><select name="ageBand"><option value="ADULT">Adult</option><option value="MINOR">Minor</option><option value="UNSPECIFIED">Prefer not to state</option></select></label>
      <label class="field"><span>Password</span><div class="input-wrap"><input id="registerPassword" name="password" type="password" autocomplete="new-password" minlength="10" required><button class="icon-button" type="button" data-action="toggle-password" data-target="registerPassword" aria-label="Show password">${icon('eye')}</button></div></label>
      <label class="field"><span>Invite code <small>(optional)</small></span><input name="inviteCode" autocomplete="off"></label>
      <label class="checkbox"><input type="checkbox" required><span>I understand that group roles do not override personal boundaries or TableGate safety rules.</span></label>
      <button class="btn primary" type="submit">Create free account</button>
    </form>` : tab === 'forgot' ? `
    <form class="auth-form" data-form="forgot-password">
      <label class="field"><span>Email</span><input name="email" type="email" autocomplete="email" value="${savedEmail}" required></label>
      <button class="btn primary" type="submit">Send reset code</button>
      <button class="btn ghost" type="button" data-action="auth-tab" data-tab="login">Back to sign in</button>
    </form>` : tab === 'reset' ? `
    <form class="auth-form" data-form="reset-password">
      <label class="field"><span>Email</span><input name="email" type="email" autocomplete="email" value="${savedEmail}" required></label>
      <label class="field"><span>Reset code</span><input name="code" inputmode="numeric" autocomplete="one-time-code" maxlength="12" ${state.pendingAuthToken ? '' : 'required'}></label>
      <label class="field"><span>New password</span><div class="input-wrap"><input id="resetPassword" name="newPassword" type="password" autocomplete="new-password" minlength="10" required><button class="icon-button" type="button" data-action="toggle-password" data-target="resetPassword" aria-label="Show password">${icon('eye')}</button></div></label>
      <label class="field"><span>Confirm new password</span><input name="confirmPassword" type="password" autocomplete="new-password" minlength="10" required></label>
      <button class="btn primary" type="submit">Reset password</button>
      <button class="btn ghost" type="button" data-action="auth-tab" data-tab="login">Back to sign in</button>
    </form>` : tab === 'verify' ? `
    <form class="auth-form" data-form="verify-email">
      <label class="field"><span>Email</span><input name="email" type="email" autocomplete="email" value="${savedEmail}" required></label>
      <label class="field"><span>Verification code</span><input name="code" inputmode="numeric" autocomplete="one-time-code" maxlength="12" ${state.pendingAuthToken ? '' : 'required'}></label>
      <button class="btn primary" type="submit">Verify email</button>
      <button class="btn ghost" type="button" data-action="resend-verification">Send a new code</button>
      <button class="btn ghost" type="button" data-action="auth-tab" data-tab="login">Back to sign in</button>
    </form>` : `
    <form class="auth-form" data-form="login">
      <label class="field"><span>Email</span><input name="email" type="email" autocomplete="email" value="${savedEmail}" required></label>
      <label class="field"><span>Password</span><div class="input-wrap"><input id="loginPassword" name="password" type="password" autocomplete="current-password" required><button class="icon-button" type="button" data-action="toggle-password" data-target="loginPassword" aria-label="Show password">${icon('eye')}</button></div></label>
      <button class="btn primary" type="submit">Sign in</button>
      <button class="btn ghost" type="button" data-action="auth-tab" data-tab="forgot">Forgot password</button>
    </form>`;
  const titles = {register:'Create your account',forgot:'Request a reset code',reset:'Choose a new password',verify:'Verify your email',login:'Welcome back'};
  const connectionNotice = state.mode !== 'demo' && state.connection === 'error'
    ? `<div class="notice danger auth-status"><strong>The shell loaded, but the backend did not answer.</strong><br>Confirm that <code>setupTablegate()</code> was run and that the Apps Script web app is deployed as <strong>Execute as me</strong> with access set to <strong>Anyone</strong>.<div class="form-actions" style="justify-content:flex-start;margin-top:10px"><button class="btn" data-action="test-connection">Retry connection</button></div></div>`
    : '';

  return `
    <section class="auth-brand">
      <div class="auth-logo"><img src="assets/images/tablegate/icons/tablegate-icon-192.png" alt="TableGate crest"><div><h1>TableGate</h1><div class="free-badge">Free for everyone</div></div></div>
      <div class="auth-tagline"><h2>Find a table. Build a community. Keep every role accountable.</h2><p>A TableGate-only social and messenger shell for group discovery, applications, public Visitor access, approved Players, Moderators, Admins, direct messages, and safety controls.</p></div>
      <p class="auth-credit">${escapeHtml(CONFIG.CREDIT)}</p>
    </section>
    <section class="auth-panel">
      <div class="auth-card">
        <div class="auth-title"><h2>${escapeHtml(titles[tab] || titles.login)}</h2><p>${escapeHtml(modeText)} · Every core feature is free.</p></div>
        <div class="tabs" role="tablist" aria-label="Account options">
          <button class="tab" data-active="${tab === 'login'}" data-action="auth-tab" data-tab="login">Sign in</button>
          <button class="tab" data-active="${tab === 'register'}" data-action="auth-tab" data-tab="register">Register</button>
        </div>
        ${connectionNotice}
        ${state.authMessage ? `<div class="notice ${state.authMessage.startsWith('Error:') ? 'danger' : 'info'} auth-status">${escapeHtml(state.authMessage)}</div>` : ''}
        ${form}
        ${state.mode === 'demo' ? `<button class="btn primary" type="button" data-action="use-backend">Return to live TableGate sign-in</button>` : ''}
        <button class="btn danger" type="button" data-action="open-anonymous-safety-report">${icon('shield')} Report a safety concern without signing in</button>
        <button class="btn demo-button" data-action="open-demo">Open interface preview</button>
        <p class="helper">Preview mode is temporary and stores sample data only in this browser. Signing out always returns to the live TableGate V8 account system.</p>
      </div>
    </section>`;
}

export function renderAppRail(state) {
  const unread = state.notifications.filter(n => !n.readAt).length;
  const tablegates = state.tablegates || [];
  const button = (view, label, iconName, badge = '') => `<button class="rail-button" data-action="navigate" data-view="${view}" data-active="${state.view === view}" aria-label="${label}" title="${label}">${icon(iconName)}${badge ? `<span class="rail-badge">${badge}</span>` : ''}</button>`;
  return `
    <button class="brand-button" data-action="navigate" data-view="profile" aria-label="My TableGate profile"><img src="assets/images/tablegate/icons/tablegate-icon-96.png" alt=""></button>
    <div class="rail-separator"></div>
    ${button('profile','My Profile','user')}
    ${button('home','TTRPG Hub','home')}
    ${button('discover','Discover TableGates','compass')}
    ${button('finder','Group Finder','users')}
    ${button('systems','System Reference','info')}
    ${button('organizer','Organizer','settings')}
    ${button('studio','Studio & Play','plus')}
    ${button('dms','Direct messages','messages')}
    ${button('notifications','Notifications','bell',unread || '')}
    ${button('safety','Safety Center','shield')}
    <div class="rail-separator"></div>
    ${tablegates.map(t => `<button class="tablegate-button" data-action="open-tablegate" data-tablegate-id="${escapeAttr(t.id)}" data-active="${state.activeTablegateId === t.id && state.view === 'tablegate'}" title="${escapeAttr(t.name)}"><span class="tablegate-letter">${escapeHtml(initials(t.name))}</span></button>`).join('')}
    <button class="rail-button" data-action="open-create-tablegate" aria-label="Create TableGate" title="Create TableGate">${icon('plus')}</button>
    <div class="rail-spacer"></div>
    ${button('settings','Settings','settings')}`;
}

function contextProfile(state) {
  return `<div class="context-head"><h2>Your Profile</h2><p>Personal social page</p></div><div class="context-body">
    <div class="context-section"><div class="context-label">Social</div>
      ${[['profile','My Profile','user'],['friends','Friends & people','userplus'],['notifications','Notifications','bell']].map(([view,label,ic])=>`<button class="list-button" data-action="navigate" data-view="${view}" data-active="${state.view===view}">${icon(ic)}<strong>${label}</strong></button>`).join('')}
    </div>
    <div class="context-section"><div class="context-label">TTRPG Workspace</div>
      ${[['home','TTRPG Hub','home'],['discover','Join or browse groups','compass'],['finder','Group Finder','users'],['systems','System Reference','info'],['organizer','Organizer','settings'],['studio','Studio & Play','plus'],['dms','Messages','messages']].map(([view,label,ic])=>`<button class="list-button" data-action="navigate" data-view="${view}">${icon(ic)}<strong>${label}</strong></button>`).join('')}
      <button class="list-button" data-action="open-create-tablegate">${icon('plus')}<strong>Create a TableGate</strong></button>
    </div>
    <div class="notice info"><strong>Separate spaces:</strong><br>Your profile is the social home. Group creation, joining, session messaging, roles, and organization stay in the TTRPG workspace.</div>
  </div>`;
}
function contextHome(state) {
  return `<div class="context-head"><h2>TTRPG Hub</h2><p>Groups, sessions & organization</p></div><div class="context-body">
    <div class="context-section">
      <div class="context-label">Navigate</div>
      ${[['profile','My Profile','user'],['home','TTRPG Hub','home'],['discover','Discover TableGates','compass'],['finder','Find a group','users'],['systems','System Reference','info'],['organizer','Organizer','settings'],['studio','Studio & Play','plus'],['dms','Messages','messages'],['friends','Friends & people','userplus'],['notifications','Notifications','bell'],['safety','Safety Center','shield']].map(([view,label,ic])=>`<button class="list-button" data-action="navigate" data-view="${view}" data-active="${state.view===view}">${icon(ic)}<strong>${label}</strong></button>`).join('')}
    </div>
    <div class="notice success"><strong>Free by design</strong><br>No subscriptions, boosts, paid contact, or premium safety controls.</div>
  </div>`;
}
function contextDiscover(state) {
  return `<div class="context-head"><h2>Discovery</h2><p>Public TableGates and group posts</p></div><div class="context-body">
    <div class="context-section"><div class="context-label">Views</div>
      <button class="list-button" data-action="navigate" data-view="discover" data-active="${state.view==='discover'}">${icon('compass')}<strong>Public TableGates</strong></button>
      <button class="list-button" data-action="navigate" data-view="finder" data-active="${state.view==='finder'}">${icon('users')}<strong>Group Finder</strong></button>
      <button class="list-button" data-action="navigate" data-view="friends" data-active="${state.view==='friends'}">${icon('userplus')}<strong>People</strong></button>
    </div>
    <div class="visitor-note">Public all-ages TableGates join as <strong>Visitor</strong>. Player abilities require Admin approval.</div>
  </div>`;
}
function channelIcon(channel) { return channel.type === 'VOICE' ? '◖' : channel.type === 'VIDEO' ? '▣' : channel.type === 'HANDOUTS' ? '▤' : '#'; }
function contextTablegate(state) {
  const active = state.activeTablegate;
  if (!active) return `<div class="context-head"><h2>TableGate</h2></div>${loadingState()}`;
  const categories = active.categories || [];
  const channels = active.channels || [];
  const grouped = categories.map(cat => ({cat,channels:channels.filter(ch => ch.categoryId === cat.id)}));
  const uncategorized = channels.filter(ch => !categories.some(cat=>cat.id===ch.categoryId));
  const role = getRoleClass(state);
  return `<div class="context-head"><h2>${escapeHtml(active.tablegate?.name || 'TableGate')}</h2><p>${roleBadge(role)} ${active.tablegate?.memberCount || active.members?.length || 0} members</p></div><div class="context-body">
    ${role === 'VISITOR' ? `<div class="visitor-note"><strong>Visitor access:</strong> chat in channels marked Chat; read or observe the others. Request Player approval when ready.<button class="btn small primary" style="margin-top:10px" data-action="open-request-player">Request Player approval</button></div>` : ''}
    ${grouped.map(({cat,channels:items})=>`<div class="context-section"><div class="context-label"><span>${escapeHtml(cat.name)}</span>${['OWNER','ADMIN'].includes(role)?`<button class="icon-button" data-action="open-create-channel" data-category-id="${escapeAttr(cat.id)}" aria-label="Add channel">${icon('plus')}</button>`:''}</div>${items.map(ch=>`<button class="channel-button" data-action="open-channel" data-channel-id="${escapeAttr(ch.id)}" data-active="${state.activeChannelId===ch.id}"><span class="channel-hash">${channelIcon(ch)}</span><strong>${escapeHtml(ch.name)}</strong>${role==='VISITOR'&&ch.visitorMode!=='CHAT'?`<span class="channel-lock">${ch.visitorMode==='OBSERVE'?'observe':'read'}</span>`:''}</button>`).join('')}</div>`).join('')}
    ${uncategorized.length?`<div class="context-section">${uncategorized.map(ch=>`<button class="channel-button" data-action="open-channel" data-channel-id="${escapeAttr(ch.id)}" data-active="${state.activeChannelId===ch.id}"><span class="channel-hash">${channelIcon(ch)}</span><strong>${escapeHtml(ch.name)}</strong></button>`).join('')}</div>`:''}
    ${['OWNER','ADMIN'].includes(role)?`<div class="context-section"><div class="context-label">Administration</div><button class="list-button" data-action="open-join-requests">${icon('users')}<strong>Membership requests</strong></button><button class="list-button" data-action="open-player-applications">${icon('userplus')}<strong>Player applications</strong></button><button class="list-button" data-action="open-tablegate-settings">${icon('settings')}<strong>TableGate settings</strong></button></div>`:''}
    ${role !== 'OWNER' ? `<div class="context-section"><button class="list-button" data-action="leave-tablegate">${icon('logout')}<strong>Leave TableGate</strong></button></div>` : ''}
  </div>`;
}
function contextDms(state) {
  return `<div class="context-head"><h2>Messages</h2><p>Direct and group conversations</p></div><div class="context-body"><div class="context-section"><div class="context-label"><span>Direct messages</span><button class="icon-button" data-action="open-new-dm" aria-label="New direct message">${icon('plus')}</button></div>${state.dms.map(dm=>`<button class="list-button" data-action="open-dm" data-dm-id="${escapeAttr(dm.id)}" data-active="${state.activeDmId===dm.id&&state.view==='dms'}">${avatar(dm.participants?.find(p=>p.userId!==state.me?.id)?.user || {username:dm.name,status:'OFFLINE'})}<strong>${escapeHtml(dm.name||'Direct message')}</strong></button>`).join('')||`<p class="helper">No direct messages yet.</p>`}</div><button class="list-button" data-action="navigate" data-view="friends" data-active="${state.view==='friends'}">${icon('userplus')}<strong>Friends & people</strong></button></div>`;
}
function contextSafety(state) {
  return `<div class="context-head"><h2>Safety Center</h2><p>Block, report, document, and leave</p></div><div class="context-body"><div class="context-section"><div class="context-label">Controls</div><button class="list-button" data-action="navigate" data-view="safety">${icon('shield')}<strong>Safety overview</strong></button><button class="list-button" data-action="open-safety-report">${icon('info')}<strong>Make a report</strong></button><button class="list-button" data-action="load-safety-reports">${icon('messages')}<strong>My reports</strong></button></div><div class="notice info">Reports against an Owner, Admin, Moderator, or Host bypass implicated local leadership and go to central review.</div></div>`;
}
export function renderContextRail(state) {
  if (state.view === 'profile') return contextProfile(state);
  if (state.view === 'tablegate') return contextTablegate(state);
  if (state.view === 'dms' || state.view === 'friends') return contextDms(state);
  if (state.view === 'safety') return contextSafety(state);
  if (state.view === 'discover' || state.view === 'finder') return contextDiscover(state);
  return contextHome(state);
}

export function renderTopbar(state) {
  let title='TableGate', subtitle='Completely free TTRPG community';
  if (state.view==='profile'){title='My Profile';subtitle='Your personal TableGate social page';}
  else if (state.view==='tablegate' && state.activeTablegate) {
    const channel=state.activeTablegate.channels?.find(c=>c.id===state.activeChannelId);
    title=channel?`${channelIcon(channel)} ${channel.name}`:state.activeTablegate.tablegate.name;
    subtitle=channel?.topic||state.activeTablegate.tablegate.description||'';
  } else if(state.view==='discover'){title='Discover TableGates';subtitle='Search public groups and join as a Visitor';}
  else if(state.view==='finder'){title='Group Finder';subtitle='Hard requirements first, explainable compatibility second';}
  else if(state.view==='systems'){title='System Library';subtitle='Embedded rules knowledge and custom-system setup';}
  else if(state.view==='organizer'){title='Organizer';subtitle='Campaign tasks, schedules, notes, and lists';}
  else if(state.view==='studio'){title='Studio & Play';subtitle='Admin creation, player sheets, and live session tools';}
  else if(state.view==='dms'){title=state.dms.find(d=>d.id===state.activeDmId)?.name||'Direct messages';subtitle='Private messaging with block and report controls';}
  else if(state.view==='friends'){title='Friends & people';subtitle='Search by username or display tag';}
  else if(state.view==='notifications'){title='Notifications';subtitle='Applications, messages, friends, and safety updates';}
  else if(state.view==='safety'){title='Safety Center';subtitle='Point-of-harm reporting and central escalation';}
  else if(state.view==='settings'){title='Settings';subtitle='Account, appearance, and connection';}
  const placeholder = state.view==='tablegate'?'Search messages':state.view==='finder'?'Search Group Finder':state.view==='discover'?'Search public TableGates':state.view==='friends'?'Search people':'Search TableGate';
  const unread=state.notifications.filter(n=>!n.readAt).length;
  return `
    ${iconButton('toggle-nav','Open navigation','menu')}
    <div class="topbar-title"><h2>${escapeHtml(title)}</h2><p>${escapeHtml(subtitle)}</p></div>
    <form class="topbar-search" data-form="global-search"><input name="query" value="${escapeAttr(state.view==='finder'?state.finder.query:state.view==='discover'?state.discover.query:'')}" placeholder="${escapeAttr(placeholder)}" aria-label="${escapeAttr(placeholder)}"><span class="search-key">Enter</span></form>
    <div class="topbar-actions"><span class="connection-dot ${state.connection==='online'?'online':state.connection==='offline'?'offline':''}" title="${escapeAttr(state.connection)}"></span>${iconButton('navigate','Notifications','bell',`data-view="notifications" ${unread?`data-badge="${unread}"`:''}`)}${state.view==='tablegate'?iconButton('toggle-detail','Members','members'):''}${iconButton('toggle-theme','Toggle light or dark theme',state.theme==='light'?'moon':'sun')}</div>`;
}

function renderProfile(state) {
  const name=state.me?.displayTag||state.me?.username||'TableGate User';
  return `<div class="profile-frame-shell"><iframe id="tablegateProfileFrame" class="profile-frame" title="${escapeAttr(name)} profile" data-profile-user-id="${escapeAttr(state.me?.id||state.me?.email||state.me?.username||'local')}" data-profile-name="${escapeAttr(state.me?.username||name)}" data-profile-handle="${escapeAttr('@'+String(state.me?.username||'tablegate-user').replace(/^@/,''))}"></iframe></div>`;
}

function renderHome(state) {
  const joined=state.tablegates.length; const unread=state.notifications.filter(n=>!n.readAt).length; const pending=state.friends.filter(f=>f.status==='PENDING'&&f.direction==='INCOMING').length;
  const recent=state.tablegates.slice(0,3);
  return `<div class="page">
    ${pageHeader(`TTRPG Hub · ${state.me?.username || 'TableGater'}`,'Create, join, message, run sessions, manage roles, and organize TableGates here.',actionButton('open-create-tablegate','Create TableGate',{className:'primary',icon:'plus'}))}
    <div class="stat-grid"><div class="card stat-card"><strong>${joined}</strong><span>joined TableGates</span></div><div class="card stat-card"><strong>${state.dms.length}</strong><span>direct conversations</span></div><div class="card stat-card"><strong>${unread}</strong><span>unread notifications</span></div><div class="card stat-card"><strong>${pending}</strong><span>pending friend requests</span></div></div>
    <div class="dashboard-grid" style="margin-top:16px">
      <section class="card"><div class="card-header"><div><h2>Your TableGates</h2><span class="helper">Owners, Admins, Moderators, Players, and Visitors remain visibly distinct.</span></div><button class="btn small" data-action="navigate" data-view="discover">Discover</button></div><div class="card-body"><div class="grid-2">${recent.map(t=>renderTablegateCard(t,state)).join('')||emptyState('◌','No TableGates yet','Create one or join a public group as a Visitor.')}</div></div></section>
      <aside class="card card-pad"><div class="section-title" style="margin-top:0"><h2>Free access promise</h2>${freeBadge()}</div><ul class="policy-list">${FREE_PROMISE.map(item=>`<li>${escapeHtml(item)}</li>`).join('')}</ul></aside>
    </div>
    <div class="section-title"><h2>Find your next table</h2><button class="btn small" data-action="navigate" data-view="finder">Open Group Finder</button></div>
    <div class="grid-2">${state.finder.items.slice(0,2).map(post=>renderFinderCard(post,state)).join('')||`<div class="card card-pad">Group Finder posts load after sign-in.</div>`}</div>
    <p class="credit-line" style="margin-top:28px">${escapeHtml(CONFIG.CREDIT)}</p>
  </div>`;
}

function renderTablegateCard(t,state) {
  const joined=Boolean(t.joined); const role=t.membershipType||'';
  let action='';
  if(joined) action=`<button class="btn small primary" data-action="open-tablegate" data-tablegate-id="${escapeAttr(t.id)}">Open</button>`;
  else if(t.joinPolicy==='REQUEST'||t.adultOnly) action=`<button class="btn small" data-action="request-tablegate-join" data-tablegate-id="${escapeAttr(t.id)}">Request to join</button>`;
  else action=`<button class="btn small success" data-action="join-tablegate" data-tablegate-id="${escapeAttr(t.id)}">Join as Visitor</button>`;
  return `<article class="card tablegate-card">${cardLogo(t)}<div><h3>${escapeHtml(t.name)}</h3><p>${escapeHtml(t.description||'No description yet.')}</p><div class="chip-row">${role?roleBadge(role):''}<span class="chip">${escapeHtml(systemName(t.primarySystemId))}</span>${t.tags?.slice(0,3).map(tag=>`<span class="chip">#${escapeHtml(tag)}</span>`).join('')||''}</div><div class="card-meta" style="margin-top:9px"><span>${t.memberCount||0} members</span><span>${t.adultOnly?'18+ verified':'All-ages policy'}</span><span>${t.isPublic?'Public':'Private'}</span></div></div><div class="card-menu">${action}</div></article>`;
}
function renderDiscover(state) {
  const items=state.discover.items||[];
  return `<div class="page page-wide">${pageHeader('Discover public TableGates','Public all-ages groups open immediately as Visitor spaces. Player abilities require Admin approval.',`${actionButton('refresh-discover','Refresh',{icon:'compass'})}${actionButton('open-create-tablegate','Create TableGate',{className:'primary',icon:'plus'})}`)}
    <form class="filter-bar" data-form="discover-filter"><input name="query" value="${escapeAttr(state.discover.query)}" placeholder="Search names, descriptions, systems, or tags"><select name="systemId"><option value="">All systems</option>${systems().map(([id,name])=>`<option value="${id}">${escapeHtml(name)}</option>`).join('')}</select><input name="tags" placeholder="Tags, comma-separated"><select name="joinPolicy"><option value="">Any access</option><option value="OPEN">Open Visitor access</option><option value="REQUEST">Request required</option></select><button class="btn primary" type="submit">Search</button></form>
    <div class="notice info" style="margin-bottom:14px"><strong>Visitor-first access:</strong> joining a public all-ages TableGate lets you observe sessions and worldbuilding and chat only where the channel permits it. Character sheets, dice, session participation, and Player channels remain locked until approval.</div>
    ${state.discover.loading?loadingState('Searching public TableGates…'):items.length?`<div class="grid-2">${items.map(t=>renderTablegateCard(t,state)).join('')}</div>`:emptyState('⌕','No public TableGates matched','Change the search or create a new free TableGate.',actionButton('open-create-tablegate','Create TableGate',{className:'primary'}))}
  </div>`;
}
function renderFinderCard(post,state) {
  const owner=post.owner; const score=Number(post.matchScore||0); const own=Boolean(post.ownedByViewer); const interested=post.interest;
  return `<article class="card finder-card"><div class="finder-head"><div class="finder-owner">${avatar(owner)}<div><h3>${escapeHtml(post.title)}</h3><div class="helper">${escapeHtml(userName(owner))} · ${relativeTime(post.updatedAt||post.createdAt)}</div></div></div><div class="chip-row"><span class="status-badge ${post.isRightNow?'right-now':String(post.status||'active').toLowerCase()}">${post.isRightNow?'Right Now':escapeHtml(post.status||'Active')}</span>${post.agePolicy?.includes('ADULT')?`<span class="badge">18+</span>`:''}</div></div>
    <p>${escapeHtml(post.body||'')}</p>
    <div class="chip-row">${[...array(post.systemIds).map(systemName),...array(post.offeredRoles).map(x=>`Offers ${x}`),...array(post.desiredRoles).map(x=>`Needs ${x}`),post.playMode,post.radiusBand].filter(Boolean).slice(0,8).map(tag=>`<span class="chip">${escapeHtml(tag)}</span>`).join('')}</div>
    ${score?`<div class="match-meter"><strong>${score}%</strong><div class="match-bar" aria-label="${score}% compatibility"><span style="width:${Math.max(0,Math.min(100,score))}%"></span></div></div>`:''}
    ${post.matchReasons?.length?`<div class="helper">Why it matched: ${escapeHtml(post.matchReasons.join(' · '))}</div>`:''}
    <div class="safety-note">Compatibility is not a safety clearance. Contact opens through an Interest/Application and an auditable pre-game lobby.</div>
    <div class="finder-actions">${own?`<button class="btn small" data-action="open-finder-interests" data-post-id="${escapeAttr(post.id)}">View applications</button>`:interested?`<button class="btn small" disabled>Interest ${escapeHtml(interested.status)}</button>`:`<button class="btn small primary" data-action="express-interest" data-post-id="${escapeAttr(post.id)}">Send Interest</button>`}<button class="btn small ghost" data-action="hide-finder-post" data-post-id="${escapeAttr(post.id)}">Hide</button><button class="btn small ghost" data-action="open-safety-report" data-object-type="GROUP_FINDER_POST" data-object-id="${escapeAttr(post.id)}" data-user-id="${escapeAttr(owner?.id||'')}">Report</button></div></article>`;
}
function renderFinderEvent(event) {
  return `<article class="card card-pad"><div class="finder-meta"><span class="type-badge">PUBLIC EVENT</span><span>${escapeHtml(formatDateTime(event.startsAt||event.startAt||event.date))}</span></div><h3>${escapeHtml(event.title||event.name||'TTRPG event')}</h3><p>${escapeHtml(event.description||event.body||'')}</p><div class="chips">${array(event.systemIds||event.systems).map(id=>`<span class="chip">${escapeHtml(systemName(id))}</span>`).join('')}${event.distanceBand?`<span class="chip">${escapeHtml(event.distanceBand.replaceAll('_',' '))}</span>`:''}</div><div class="finder-actions"><button class="btn small ghost" data-action="open-safety-report" data-object-type="EVENT" data-object-id="${escapeAttr(event.id||'')}">Report</button></div></article>`;
}
function renderFinderVenue(venue) {
  return `<article class="card card-pad"><div class="finder-meta"><span class="type-badge">PUBLIC VENUE</span><span>${escapeHtml(venue.placeType||'PUBLIC PLACE')}</span></div><h3>${escapeHtml(venue.label||venue.name||'Public venue')}</h3><p>${escapeHtml([venue.city,venue.region,venue.country].filter(Boolean).join(', '))}</p><div class="chips">${venue.accessibilityNotes?`<span class="chip">Accessibility notes available</span>`:''}${venue.distanceBand?`<span class="chip">${escapeHtml(venue.distanceBand.replaceAll('_',' '))}</span>`:''}</div><div class="finder-actions"><button class="btn small ghost" data-action="open-safety-report" data-object-type="PUBLIC_VENUE" data-object-id="${escapeAttr(venue.id||'')}">Report</button></div></article>`;
}
function renderFinderInterest(item) {
  const post=item.post||item.groupFinderPost||{};
  return `<article class="card card-pad"><div class="finder-meta"><span class="type-badge">MY INTEREST</span><span class="status-badge">${escapeHtml(item.status||'SENT')}</span></div><h3>${escapeHtml(post.title||item.postTitle||'Group Finder interest')}</h3><p>${escapeHtml(item.message||'')}</p><div class="helper">${formatDateTime(item.createdAt)}</div></article>`;
}
function renderFinder(state) {
  const viewOptions=[['NEWEST','Newest'],['COMPATIBLE','Compatible'],['RIGHT_NOW','Right Now'],['LOCAL_EVENTS','Local events'],['MY_ACTIVITY','My activity']];
  let content='';
  if (state.finder.loading) content=loadingState('Loading eligible TableGate discovery results…');
  else if (state.finder.view==='LOCAL_EVENTS') {
    const cards=[...state.finder.events.map(renderFinderEvent),...state.finder.venues.map(renderFinderVenue)];
    content=cards.length?`<div class="grid-2">${cards.join('')}</div>`:emptyState('⌖','No public events or venues matched','Local discovery uses public places and coarse distance bands—never live residential location.');
  } else if (state.finder.view==='MY_ACTIVITY') {
    const cards=[...state.finder.items.map(post=>renderFinderCard(post,state)),...state.finder.interests.map(renderFinderInterest)];
    content=cards.length?`<div class="grid-2">${cards.join('')}</div>`:emptyState('◫','No current activity','Your posts, Interests, applications, and invitations will appear here.');
  } else {
    content=state.finder.items.length?`<div class="grid-2">${state.finder.items.map(post=>renderFinderCard(post,state)).join('')}</div>`:emptyState('◫','No eligible posts matched','Hard requirements remove incompatible results rather than merely lowering their score.',actionButton('open-create-finder-post','Create a post',{className:'primary'}));
  }
  return `<div class="page page-wide">${pageHeader('Group Finder','Find, create, and join TTRPG communities through structured intent, consent-first contact, public-place radius, and explainable compatibility.',`${actionButton('open-create-finder-post','Create finder post',{className:'primary',icon:'plus'})}${actionButton('open-create-tablegate','Create TableGate group',{icon:'users'})}${actionButton('open-public-location','Public anchor',{icon:'map'})}`)}
    <div class="notice info"><strong>Compatibility is not a safety clearance.</strong> Hard eligibility rules run first; contact begins through an Interest or Application and an auditable pre-game lobby.</div>
    <div class="tabs" style="margin-bottom:13px">${viewOptions.map(([value,label])=>`<button class="tab" data-action="set-finder-view" data-finder-view="${value}" data-active="${state.finder.view===value}">${label}</button>`).join('')}</div>
    <form class="filter-bar" data-form="finder-filter"><input name="query" value="${escapeAttr(state.finder.query)}" placeholder="Search posts, systems, roles, or tags"><select name="playMode"><option value="">Online or in person</option><option value="ONLINE_ONLY" ${state.finder.playMode==='ONLINE_ONLY'?'selected':''}>Online only</option><option value="ONLINE_OK" ${state.finder.playMode==='ONLINE_OK'?'selected':''}>Online okay</option><option value="IN_PERSON_ONLY" ${state.finder.playMode==='IN_PERSON_ONLY'?'selected':''}>In person only</option></select><select name="systemId"><option value="">All systems</option>${systems().map(([id,name])=>`<option value="${id}">${escapeHtml(name)}</option>`).join('')}</select><select name="role"><option value="">Any role</option>${FINDER_ROLES.map(r=>`<option value="${escapeAttr(r)}">${escapeHtml(r)}</option>`).join('')}</select><button class="btn primary" type="submit">Apply</button></form>
    ${content}
  </div>`;
}

function renderMessages(state) {
  const active=state.activeTablegate; const channel=active?.channels?.find(c=>c.id===state.activeChannelId); const dm=state.dms.find(x=>x.id===state.activeDmId);
  if(state.loading) return loadingState('Loading messages…');
  if(!channel&&!dm) return emptyState('✉','Choose a conversation','Select a channel or direct message from the navigation.');
  if(channel&&['VOICE','VIDEO'].includes(channel.type)) return `<div class="page"><div class="card card-pad">${pageHeader(channel.name,channel.topic,actionButton('open-voice-room',channel.type==='VIDEO'?'Open video room':'Connect to voice',{className:'primary'}))}<div class="notice info">The V8 backend authorizes rooms and exchanges WebRTC signaling. Live audio/video media stays peer-to-peer in the browser; Visitors remain observe-only until Player approval.</div></div></div>`;
  const messages=state.messageSearchResults??state.messages;
  if(!messages.length) return emptyState('#','No messages yet',state.messageSearchResults?'No messages matched this search.':'Start the conversation.');
  let lastDay='';
  return `<div class="message-list">${messages.map(m=>{const day=formatDay(m.createdAt);const divider=day!==lastDay?`<div class="day-divider">${escapeHtml(day)}</div>`:'';lastDay=day;return divider+renderMessage(m,state);}).join('')}</div>`;
}
function renderMessage(message,state) {
  const own=message.authorId===state.me?.id; const author=message.author||state.activeTablegate?.members?.find(m=>m.userId===message.authorId)?.user; const deleted=Boolean(message.deletedAt); const reply=message.replyToId?state.messages.find(m=>m.id===message.replyToId):null;
  const grouped=Object.values((message.reactions||[]).reduce((acc,r)=>{const key=r.emoji;acc[key] ||= {emoji:key,count:0,own:false};acc[key].count++;if(r.userId===state.me?.id)acc[key].own=true;return acc;},{}));
  const canModerate=['OWNER','ADMIN','MODERATOR'].includes(getRoleClass(state));
  return `<article class="message" data-message-id="${escapeAttr(message.id)}" data-own="${own}">${avatar(author)}<div>${reply?`<div class="message-reply">Replying to ${escapeHtml(reply.author?.username||'a message')}: ${escapeHtml(String(reply.content||'').slice(0,90))}</div>`:''}<div class="message-head"><span class="message-author">${escapeHtml(author?.username||'Unknown')}</span><time class="message-time" datetime="${escapeAttr(message.createdAt)}">${formatTime(message.createdAt)}</time>${message.editedAt||message.updatedAt!==message.createdAt?`<span class="message-edited">edited</span>`:''}</div><div class="message-content ${deleted?'message-deleted':''}">${deleted?'Message deleted':escapeHtml(message.content||'')}</div>${message.attachments?.length?`<div class="attachment-list">${message.attachments.map(a=>`<button class="attachment" data-action="download-attachment" data-attachment-id="${escapeAttr(a.id)}">${icon('paperclip')}<span>${escapeHtml(a.originalName||'Attachment')}</span></button>`).join('')}</div>`:''}${grouped.length?`<div class="reactions">${grouped.map(r=>`<button class="reaction" data-action="toggle-reaction" data-message-id="${escapeAttr(message.id)}" data-emoji="${escapeAttr(r.emoji)}" data-own="${r.own}">${escapeHtml(r.emoji)} ${r.count}</button>`).join('')}</div>`:''}${!deleted?`<div class="message-actions">${iconButton('reply-message','Reply','reply',`data-message-id="${escapeAttr(message.id)}"`)}${iconButton('quick-react','React','smile',`data-message-id="${escapeAttr(message.id)}"`)}${own?iconButton('edit-message','Edit','edit',`data-message-id="${escapeAttr(message.id)}"`):''}${own||canModerate?iconButton('delete-message','Delete','trash',`data-message-id="${escapeAttr(message.id)}"`):''}${iconButton('open-safety-report','Report','shield',`data-object-type="MESSAGE" data-object-id="${escapeAttr(message.id)}" data-user-id="${escapeAttr(message.authorId||'')}"`)}</div>`:''}</div></article>`;
}

function renderDms(state) {
  if(!state.activeDmId) return `<div class="page">${pageHeader('Direct messages','Interest-before-DM and user-controlled contact remain the default.',actionButton('open-new-dm','New message',{className:'primary',icon:'plus'}))}<div class="grid-2">${state.dms.map(dm=>`<button class="card dm-card list-button" data-action="open-dm" data-dm-id="${escapeAttr(dm.id)}">${avatar(dm.participants?.find(p=>p.userId!==state.me?.id)?.user||{username:dm.name})}<span><strong>${escapeHtml(dm.name||'Direct message')}</strong><small>${escapeHtml(dm.lastMessage?.content||'No messages yet')}</small></span></button>`).join('')||emptyState('✉','No direct messages','Search people and start a conversation.')}</div></div>`;
  return renderMessages(state);
}
function renderFriends(state) {
  const incoming=state.friends.filter(f=>f.status==='PENDING'&&f.direction==='INCOMING'); const accepted=state.friends.filter(f=>f.status==='ACCEPTED'); const outgoing=state.friends.filter(f=>f.status==='PENDING'&&f.direction==='OUTGOING');
  const friendCard=(f,kind)=>`<article class="card user-card"><div class="finder-owner">${avatar(f.otherUser,'large')}<div><h3>${escapeHtml(userName(f.otherUser))}</h3><div class="helper">${escapeHtml(f.otherUser?.bio||f.otherUser?.customStatus||'')}</div></div></div><div class="finder-actions" style="margin-top:12px">${kind==='incoming'?`<button class="btn small success" data-action="accept-friend" data-friendship-id="${escapeAttr(f.id)}">Accept</button><button class="btn small" data-action="decline-friend" data-friendship-id="${escapeAttr(f.id)}">Decline</button>`:kind==='accepted'?`<button class="btn small primary" data-action="create-dm-user" data-user-id="${escapeAttr(f.otherUser?.id||'')}">Message</button>`:`<button class="btn small" disabled>Request sent</button>`}<button class="btn small ghost" data-action="block-user" data-user-id="${escapeAttr(f.otherUser?.id||'')}">Block</button></div></article>`;
  return `<div class="page">${pageHeader('Friends & people','Find users by username or display tag. Blocking immediately severs direct contact and location visibility.',actionButton('open-new-friend','Add friend',{className:'primary',icon:'userplus'}))}${incoming.length?`<div class="section-title"><h2>Incoming requests</h2></div><div class="grid-2">${incoming.map(f=>friendCard(f,'incoming')).join('')}</div>`:''}<div class="section-title"><h2>Friends</h2></div>${accepted.length?`<div class="grid-2">${accepted.map(f=>friendCard(f,'accepted')).join('')}</div>`:emptyState('☺','No friends yet','Search for someone by username or display tag.')} ${outgoing.length?`<div class="section-title"><h2>Outgoing requests</h2></div><div class="grid-2">${outgoing.map(f=>friendCard(f,'outgoing')).join('')}</div>`:''}</div>`;
}
function renderNotifications(state) {
  return `<div class="page">${pageHeader('Notifications','Applications, friend requests, messages, and safety case updates.',actionButton('mark-notifications-read','Mark all read',{icon:'check'}))}${state.notifications.length?`<div class="card">${state.notifications.map(n=>{const actor=state.activeTablegate?.members?.find(m=>m.userId===n.actorId)?.user;return `<button class="list-button" style="border-radius:0;padding:14px" data-action="open-notification" data-notification-id="${escapeAttr(n.id)}"><span class="avatar">${escapeHtml(initials(actor?.username||n.type))}</span><span><strong>${escapeHtml(String(n.type||'Notification').replaceAll('_',' '))}</strong><small>${escapeHtml(n.payload?.message||relativeTime(n.createdAt))}</small></span>${!n.readAt?`<span class="connection-dot online"></span>`:''}</button>`;}).join('')}</div>`:emptyState('◌','No notifications','You are all caught up.')}</div>`;
}
function renderSafety(state) {
  const journals=state.safetyJournals||[];
  return `<div class="page">${pageHeader('Safety Center','Central, victim-controlled reporting and documentation that local owners, hosts, or moderators cannot override.',`${actionButton('open-safety-report','Make a report',{className:'danger',icon:'shield'})}${actionButton('open-new-incident-journal','New private incident journal',{icon:'plus'})}${actionButton('refresh-safety-center','Refresh',{icon:'clock'})}`)}
    <div class="grid-2"><section class="card card-pad"><h2>Controls available everywhere</h2><ul class="policy-list"><li>Block immediately severs direct contact and location visibility while preserving evidence.</li><li>Report from a user, post, application, message, group, session, event, venue, or moderation action.</li><li>Leave or deactivate without losing an active report.</li><li>Reports involving local leadership bypass that local team.</li><li>Victims and reporters are never required to confront or mediate with the accused.</li></ul></section><section class="card card-pad"><h2>Emergency and child-safety boundary</h2><p class="notice danger">When there is immediate danger, contact local emergency services. For suspected child sexual exploitation material already on TableGate, reference the platform object; do not download, screenshot, forward, duplicate, or re-upload it.</p><p class="helper">TableGate preserves existing platform evidence internally for authorized review.</p></section></div>
    <div class="section-title"><h2>Private incident journals</h2><p>Document a pattern privately before deciding whether to submit. Journals are not visible to group owners or local moderators.</p></div>
    ${journals.length?`<div class="grid-2">${journals.map(j=>`<article class="card card-pad"><div class="finder-meta"><span class="type-badge">PRIVATE JOURNAL</span><span>${escapeHtml(j.status||'DRAFT')}</span></div><h3>${escapeHtml(j.title||'Incident journal')}</h3><p>${escapeHtml(j.summary||j.description||'')}</p><div class="helper">Updated ${formatDateTime(j.updatedAt||j.createdAt)}</div><div class="finder-actions"><button class="btn small" data-action="open-incident-journal" data-journal-id="${escapeAttr(j.id)}">Open</button><button class="btn small" data-action="add-incident-entry" data-journal-id="${escapeAttr(j.id)}">Add entry</button><button class="btn small ghost" data-action="export-incident-journal" data-journal-id="${escapeAttr(j.id)}">Export redacted timeline</button><button class="btn small danger" data-action="convert-incident-journal" data-journal-id="${escapeAttr(j.id)}">Convert to report</button></div></article>`).join('')}</div>`:emptyState('▤','No incident journals','Create a private journal to record dates, people, boundaries, witnesses, linked content, and impact without submitting immediately.',actionButton('open-new-incident-journal','Create private journal',{className:'primary'}))}
    <div class="section-title"><h2>Blocked and restricted users</h2></div>${state.safetyRelations.length?`<div class="grid-2">${state.safetyRelations.map(r=>`<article class="card user-card"><div class="finder-owner">${avatar(r.targetUser)}<div><h3>${escapeHtml(userName(r.targetUser))}</h3><div class="helper">${escapeHtml(r.type)} · ${formatDateTime(r.createdAt)}</div></div></div><button class="btn small" style="margin-top:10px" data-action="unblock-user" data-user-id="${escapeAttr(r.targetUser?.id||'')}">Remove restriction</button></article>`).join('')}</div>`:emptyState('✓','No blocked users','Block and report controls appear on profiles, posts, and messages.')}
    ${state.safetyReports.length?`<div class="section-title"><h2>My reports</h2></div><div class="card">${state.safetyReports.map(r=>`<div class="card-body" style="border-bottom:1px solid var(--line)"><strong>${escapeHtml(r.category||'Safety report')}</strong> <span class="status-badge">${escapeHtml(r.status||'SUBMITTED')}</span><p>${escapeHtml(r.summary||'')}</p><div class="helper">Case ${escapeHtml(r.caseReference||r.id||'')} · ${formatDateTime(r.createdAt)}</div></div>`).join('')}</div>`:''}
  </div>`;
}
function renderSettings(state) {
  return `<div class="page">${pageHeader('Settings','Appearance, profile, presence, and backend connection.')}
    <div class="grid-2"><section class="card card-pad"><h2>Appearance</h2><form class="auth-form" data-form="settings-theme"><label class="field"><span>Theme</span><select name="theme"><option value="dark" ${state.theme==='dark'?'selected':''}>Dark</option><option value="light" ${state.theme==='light'?'selected':''}>Light</option><option value="system" ${state.theme==='system'?'selected':''}>System</option></select></label><button class="btn primary" type="submit">Save appearance</button></form></section>
    <section class="card card-pad"><h2>Profile & presence</h2><form class="auth-form" data-form="settings-profile"><label class="field"><span>Bio</span><textarea name="bio">${escapeHtml(state.me?.bio||'')}</textarea></label><label class="field"><span>Status</span><select name="status">${['ONLINE','IDLE','DO_NOT_DISTURB','OFFLINE'].map(s=>`<option ${state.me?.status===s?'selected':''}>${s}</option>`).join('')}</select></label><label class="field"><span>Custom status</span><input name="customStatus" value="${escapeAttr(state.me?.customStatus||'')}"></label><button class="btn primary" type="submit">Update profile</button></form></section>
    <section class="card card-pad"><h2>Connection</h2><p><strong>Mode:</strong> ${escapeHtml(state.mode)}</p><p><strong>Backend:</strong> <code>${escapeHtml(CONFIG.BACKEND_URL)}</code></p><p><strong>API target:</strong> ${escapeHtml(CONFIG.API_VERSION)}</p><div class="form-actions" style="justify-content:flex-start"><button class="btn" data-action="test-connection">Test connection</button>${state.mode==='demo'?`<button class="btn" data-action="reset-demo">Reset preview data</button>`:''}</div></section>
    <section class="card card-pad"><h2>Account</h2><p>${escapeHtml(userName(state.me))}</p><p class="helper">Signing out clears the local session token. It does not delete your TableGate account.</p><button class="btn danger" data-action="logout">Sign out</button></section></div>
    <p class="credit-line" style="margin-top:24px">${escapeHtml(CONFIG.CREDIT)}</p>
  </div>`;
}
function renderTablegate(state) { return renderMessages(state); }
export function renderMain(state) {
  if (state.loading && !state.me) return loadingState();
  switch(state.view) {
    case 'profile': return renderProfile(state);
    case 'discover': return renderDiscover(state);
    case 'finder': return renderFinder(state);
    case 'systems': return renderSystemLibrary();
    case 'organizer': return renderOrganizer();
    case 'studio': return renderWorkspaceHub(state, getRoleClass(state));
    case 'tablegate': return renderTablegate(state);
    case 'dms': return renderDms(state);
    case 'friends': return renderFriends(state);
    case 'notifications': return renderNotifications(state);
    case 'safety': return renderSafety(state);
    case 'settings': return renderSettings(state);
    default: return renderHome(state);
  }
}

export function renderDetailRail(state) {
  if(['profile','systems','organizer','studio'].includes(state.view)) return '';
  if(state.view!=='tablegate'||!state.activeTablegate) return `<div class="detail-head"><h2>TableGate details</h2></div><div class="detail-body"><p class="helper">Open a TableGate to see members and roles.</p></div>`;
  const groups=Object.fromEntries(ROLE_ORDER.map(role=>[role,[]]));
  (state.activeTablegate.members||[]).forEach(member=>groups[getRoleClass(state,member)].push(member));
  return `<div class="detail-head"><h2>Members · ${state.activeTablegate.members?.length||0}</h2></div><div class="detail-body">${ROLE_ORDER.map(role=>groups[role].length?`<div class="member-group"><div class="member-group-title">${roleBadge(role)} · ${groups[role].length}</div>${groups[role].map(m=>`<button class="member-button" data-action="open-member" data-user-id="${escapeAttr(m.userId)}">${avatar(m.user)}<span class="member-info"><strong>${escapeHtml(m.nickname||m.user?.username||'Member')}</strong><small>${escapeHtml(m.adminTitle||m.user?.customStatus||role)}</small></span></button>`).join('')}</div>`:'').join('')}</div>`;
}

export function renderComposer(state) {
  if(!['tablegate','dms'].includes(state.view)) return {hidden:true,html:''};
  const active=state.activeTablegate; const channel=active?.channels?.find(c=>c.id===state.activeChannelId); const dm=state.dms.find(d=>d.id===state.activeDmId);
  if(!channel&&!dm) return {hidden:true,html:''};
  if(channel&&['VOICE','VIDEO'].includes(channel.type)) return {hidden:true,html:''};
  const role=getRoleClass(state); const visitorCanChat=role!=='VISITOR'||channel?.visitorMode==='CHAT'; const canSend=dm||visitorCanChat;
  const notice=state.editingMessage?`Editing message · Escape to cancel`:state.replyTo?`Replying to ${state.replyTo.author?.username||'message'}: ${String(state.replyTo.content||'').slice(0,90)}`:role==='VISITOR'&&!visitorCanChat?`Visitor read-only channel. Request Player approval to participate here.`:'';
  return {hidden:false,html:`<div class="typing-line">${state.typing.length?`${escapeHtml(state.typing.map(t=>t.user?.username||'Someone').join(', '))} typing…`:''}</div><form class="composer" data-form="message-composer">${notice?`<div class="composer-notice"><span>${escapeHtml(notice)}</span><button class="icon-button" type="button" data-action="cancel-composer-state" aria-label="Cancel">${icon('x')}</button></div>`:''}<div class="composer-row"><div class="composer-tools"><button class="icon-button" type="button" data-action="choose-attachment" aria-label="Attach file" ${canSend?'':'disabled'}>${icon('paperclip')}</button></div><textarea name="content" placeholder="${canSend?`Message ${escapeAttr(channel?`#${channel.name}`:dm.name)}`:'Visitor read-only channel'}" ${canSend?'':'disabled'} required>${state.editingMessage?escapeHtml(state.editingMessage.content||''):''}</textarea><button class="icon-button" type="submit" aria-label="Send message" ${canSend?'':'disabled'}>${icon('send')}</button></div><input type="file" id="attachmentInput" hidden></form>`};
}

export function renderMobileNav(state) {
  const items=[['profile','Profile','user'],['home','TTRPG Hub','home'],['finder','Find','users'],['dms','Messages','messages'],['safety','Safety','shield']];
  return items.map(([view,label,ic])=>`<button data-action="navigate" data-view="${view}" data-active="${state.view===view}">${icon(ic)}<span>${label}</span></button>`).join('');
}

export function modalTemplate(title, subtitle, body, footer = '', wide = false) {
  return `<section class="modal ${wide?'wide':''}" role="dialog" aria-modal="true" aria-labelledby="modalTitle"><header class="modal-head"><div><h2 id="modalTitle">${escapeHtml(title)}</h2>${subtitle?`<p>${escapeHtml(subtitle)}</p>`:''}</div>${iconButton('close-modal','Close','x')}</header><div class="modal-body">${body}</div>${footer?`<footer class="modal-foot">${footer}</footer>`:''}</section>`;
}

export const forms = {
  createTablegate: () => modalTemplate('Create a TableGate','Every TableGate is free. Choose any built-in, embedded, custom, or homebrew system and any host title.',`<form id="createTablegateForm" class="form-grid" data-form="create-tablegate"><label class="field span-2"><span>Name</span><input name="name" maxlength="80" required></label><label class="field span-2"><span>Description</span><textarea name="description" maxlength="1000"></textarea></label><label class="field"><span>Primary system</span><select name="systemId">${systems().map(([id,name])=>`<option value="${escapeAttr(id)}">${escapeHtml(name)}</option>`).join('')}</select><small>Use System Library to add another or homebrew system.</small></label><label class="field"><span>Host title</span><select name="defaultAdminTitle">${hostOptions()}</select></label><label class="field span-2"><span>Custom host title <small>(optional; overrides preset)</small></span><input name="customAdminTitle" maxlength="80" placeholder="Your own campaign-runner title"></label><label class="field"><span>Language</span><input name="language" value="English"></label><label class="field"><span>Member limit</span><input name="maxMembers" type="number" min="0" max="10000" value="0"></label><label class="field span-2"><span>Tags</span><input name="tags" placeholder="beginner friendly, accessible, roleplay"></label><label class="checkbox span-2"><input name="isPublic" type="checkbox" checked><span>Publicly discoverable. All-ages public groups join as Visitors; Players require approval.</span></label></form>`,`<button class="btn" data-action="close-modal">Cancel</button><button class="btn primary" type="submit" form="createTablegateForm">Create free TableGate</button>`,true),
  playerApplication: tablegate => modalTemplate('Request Player approval',`Apply to move from Visitor to Player in ${tablegate?.name||'this TableGate'}.`,`<form id="playerApplicationForm" class="auth-form" data-form="player-application"><input type="hidden" name="tablegateId" value="${escapeAttr(tablegate?.id||'')}"><label class="field"><span>Message to the Admins</span><textarea name="message" maxlength="2000" placeholder="Introduce yourself, your experience, schedule, and what you hope to play." required></textarea></label><div class="notice info">Approval unlocks character sheets, dice, session participation, uploads, and Player chat. It does not remove your block, report, leave, or boundary controls.</div></form>`,`<button class="btn" data-action="close-modal">Cancel</button><button class="btn primary" type="submit" form="playerApplicationForm">Submit application</button>`),
  joinRequest: tablegate => modalTemplate('Request to join',tablegate?.name||'Private TableGate',`<form id="joinRequestForm" class="auth-form" data-form="join-request"><input type="hidden" name="tablegateId" value="${escapeAttr(tablegate?.id||'')}"><label class="field"><span>Message</span><textarea name="message" maxlength="2000" required></textarea></label>${tablegate?.adultOnly?`<div class="notice warning">This 18+ TableGate requires third-party age assurance and Admin approval. TableGate should receive an age-status token, not retain your raw ID.</div>`:''}</form>`,`<button class="btn" data-action="close-modal">Cancel</button><button class="btn primary" type="submit" form="joinRequestForm">Send request</button>`),
  createFinderPost: (tablegates=[],locations=[]) => modalTemplate('Create Group Finder post','Post as a player, existing group, host, co-host, open table, one-shot, or Right Now opening.',`<form id="finderPostForm" class="form-grid" data-form="create-finder-post"><label class="field span-2"><span>Title</span><input name="title" maxlength="140" required></label><label class="field span-2"><span>Description</span><textarea name="body" maxlength="5000" required></textarea></label><label class="field"><span>Post type</span><select name="postType"><option>LOOKING_FOR_GROUP</option><option>LOOKING_FOR_PLAYERS</option><option>GROUP_LOOKING_FOR_HOST</option><option>HOST_OFFERING_TO_RUN</option><option>COHOST_OR_SAFETY_FACILITATOR</option><option>OPEN_TABLE</option><option>ONE_SHOT</option><option>RIGHT_NOW</option></select></label><label class="field"><span>Play mode</span><select name="playMode"><option>ONLINE_OK</option><option>ONLINE_ONLY</option><option>IN_PERSON_ONLY</option></select></label><label class="field"><span>System</span><select name="systemId">${systems().map(([id,name])=>`<option value="${id}">${escapeHtml(name)}</option>`).join('')}</select></label><label class="field"><span>Seats available</span><input name="seatsAvailable" type="number" min="0" max="1000" value="1"></label><label class="field"><span>Roles offered</span><input name="offeredRoles" list="hostRoleList" placeholder="GM, PLAYER, or custom title"><datalist id="hostRoleList">${FINDER_ROLES.map(r=>`<option value="${escapeAttr(r)}"></option>`).join('')}</datalist></label><label class="field"><span>Roles wanted</span><input name="desiredRoles" list="hostRoleList" placeholder="PLAYER, MOL, Storyteller, or custom title"></label><label class="field"><span>Timezone</span><input name="timezone" value="${escapeAttr(Intl.DateTimeFormat().resolvedOptions().timeZone)}"></label><label class="field"><span>Tags</span><input name="tags" placeholder="beginner friendly, accessible"></label><label class="field"><span>Linked TableGate</span><select name="tablegateId"><option value="">None</option>${tablegates.map(t=>`<option value="${escapeAttr(t.id)}">${escapeHtml(t.name)}</option>`).join('')}</select></label><label class="field"><span>Public anchor</span><select name="publicLocationId"><option value="">Online / not needed</option>${locations.map(l=>`<option value="${escapeAttr(l.id)}">${escapeHtml(l.label)}</option>`).join('')}</select></label><label class="field"><span>Radius</span><select name="radiusMiles"><option value="5">5 miles</option><option value="10">10 miles</option><option value="25" selected>25 miles</option><option value="50">50 miles</option></select></label><label class="field"><span>Contact flow</span><select name="contactPolicy"><option>INTEREST_THEN_LOBBY</option><option>APPLICATION_THEN_LOBBY</option><option>OPEN_APPLICATION</option></select></label><label class="checkbox span-2"><input name="isRightNow" type="checkbox"><span>Right Now opening. It expires automatically and never bypasses age, screening, approval, or public-place rules.</span></label></form>`,`<button class="btn" data-action="close-modal">Cancel</button><button class="btn primary" type="submit" form="finderPostForm">Publish free post</button>`,true),
  publicLocation: () => modalTemplate('Add a public discovery anchor','Use a library, game store, community center, café, museum, transit hub, park, university, or other public building—not a home address.',`<form id="publicLocationForm" class="form-grid" data-form="public-location"><label class="field span-2"><span>Public place label</span><input name="label" placeholder="Downtown Public Library" required></label><label class="field"><span>Place type</span><select name="placeType"><option>LIBRARY</option><option>COMMUNITY_CENTER</option><option>GAME_STORE</option><option>CAFE</option><option>TRANSIT_HUB</option><option>PARK</option><option>MUSEUM</option><option>UNIVERSITY</option><option>PUBLIC_BUILDING</option><option>OTHER_PUBLIC_PLACE</option></select></label><label class="field"><span>City</span><input name="city"></label><label class="field"><span>Region/state</span><input name="region"></label><label class="field"><span>Country</span><input name="country"></label><label class="field"><span>Latitude</span><input name="lat" type="number" step="any" required></label><label class="field"><span>Longitude</span><input name="lng" type="number" step="any" required></label><label class="checkbox span-2"><input name="isDefault" type="checkbox"><span>Use as my default public anchor.</span></label><label class="checkbox span-2"><input name="confirmPublicPlace" type="checkbox" required><span>I confirm this is a public place, not a home address, private residence, school, or workplace.</span></label></form>`,`<button class="btn" data-action="close-modal">Cancel</button><button class="btn primary" type="submit" form="publicLocationForm">Save public anchor</button>`),
  interest: post => modalTemplate('Send Interest',post?.title||'Group Finder post',`<form id="interestForm" class="auth-form" data-form="express-interest"><input type="hidden" name="postId" value="${escapeAttr(post?.id||'')}"><label class="field"><span>Roles you offer</span><input name="offeredRoles" value="PLAYER"></label><label class="field"><span>Introduction</span><textarea name="message" maxlength="2000" required></textarea></label><div class="notice info">One structured Interest opens first. Acceptance creates an auditable pre-game lobby rather than exposing private contact details immediately.</div></form>`,`<button class="btn" data-action="close-modal">Cancel</button><button class="btn primary" type="submit" form="interestForm">Send Interest</button>`),
  newDm: users => modalTemplate('New direct message','Search results are shown here. Direct contact remains subject to blocks and account safety rules.',`<form class="input-row" data-form="search-user-modal"><input class="search-input" name="query" placeholder="Username or display tag" required><button class="btn primary" type="submit">Search</button></form><div class="command-results" id="userSearchResults">${(users||[]).map(u=>`<button class="command-result" data-action="create-dm-user" data-user-id="${escapeAttr(u.id)}">${avatar(u)}<span><strong>${escapeHtml(userName(u))}</strong><br><small>${escapeHtml(u.bio||u.customStatus||'')}</small></span></button>`).join('')}</div>`),
  friend: users => modalTemplate('Add friend','Search by username or display tag.',`<form class="input-row" data-form="search-user-modal"><input class="search-input" name="query" placeholder="Username or William#0001" required><button class="btn primary" type="submit">Search</button></form><div class="command-results" id="userSearchResults">${(users||[]).map(u=>`<button class="command-result" data-action="send-friend-user" data-user-id="${escapeAttr(u.id)}">${avatar(u)}<span><strong>${escapeHtml(userName(u))}</strong><br><small>${escapeHtml(u.bio||u.customStatus||'')}</small></span><small>Add</small></button>`).join('')}</div>`),
  member: (user,member,role) => modalTemplate(user?.username||'Member',userName(user),`<div class="finder-owner">${avatar(user,'large')}<div><h3>${escapeHtml(member?.nickname||user?.username||'Member')}</h3>${roleBadge(role)}<p class="helper">${escapeHtml(user?.bio||user?.customStatus||'')}</p></div></div><div class="form-actions" style="justify-content:flex-start"><button class="btn primary" data-action="create-dm-user" data-user-id="${escapeAttr(user?.id||'')}">Message</button><button class="btn" data-action="send-friend-user" data-user-id="${escapeAttr(user?.id||'')}">Add friend</button><button class="btn" data-action="block-user" data-user-id="${escapeAttr(user?.id||'')}">Block</button><button class="btn danger" data-action="open-safety-report" data-object-type="USER" data-object-id="${escapeAttr(user?.id||'')}" data-user-id="${escapeAttr(user?.id||'')}">Report</button></div>`),
  safetyReport: ({objectType='',objectId='',userId=''}={}) => modalTemplate('Make a safety report','Few fields are required. You choose how much detail to provide, and you are never required to confront the accused.',`<form id="safetyReportForm" class="form-grid" data-form="safety-report"><input type="hidden" name="scopeType" value="${escapeAttr(objectType)}"><input type="hidden" name="scopeId" value="${escapeAttr(objectId)}"><label class="field span-2"><span>Reported user ID <small>(optional)</small></span><input name="reportedUserId" value="${escapeAttr(userId)}"></label><label class="field"><span>Category</span><select name="category"><option>MADE_ME_UNCOMFORTABLE</option><option>CHILD_SAFETY_OR_GROOMING</option><option>SEXUAL_HARASSMENT</option><option>COERCION_OR_ABUSE_OF_AUTHORITY</option><option>STALKING_OR_BLOCK_EVASION</option><option>THREAT_OF_VIOLENCE</option><option>DOXXING_OR_LOCATION_EXPOSURE</option><option>PERSISTENT_UNWANTED_CONTACT</option><option>MODERATOR_ADMIN_OWNER_OR_HOST_MISCONDUCT</option><option>EVIDENCE_DELETION_OR_COVER_UP</option><option>BAN_EVASION</option><option>OTHER</option></select></label><label class="field"><span>Urgency</span><select name="urgency"><option>GENERAL_POLICY_VIOLATION</option><option>PATTERN_DOCUMENTATION</option><option>SERIOUS_NOT_IMMEDIATE</option><option>CREDIBLE_THREAT_OR_STALKING</option><option>SEXUAL_EXPLOITATION_OR_GROOMING</option><option>CHILD_IMMEDIATE_RISK</option><option>IMMEDIATE_DANGER</option></select></label><label class="field span-2"><span>Summary</span><input name="summary" maxlength="300" required></label><label class="field span-2"><span>Details <small>(optional)</small></span><textarea name="details" maxlength="8000"></textarea></label><label class="checkbox span-2"><input name="immediateDanger" type="checkbox"><span>Someone may be in immediate danger now.</span></label><div class="notice warning span-2">For suspected child sexual exploitation material already on TableGate, reference the message/file/object. Do not download, screenshot, duplicate, forward, or re-upload it.</div></form>`,`<button class="btn" data-action="close-modal">Cancel</button><button class="btn danger" type="submit" form="safetyReportForm">Submit report</button>`,true),
  anonymousSafetyReport: () => modalTemplate('Report a safety concern without signing in','Few fields are required. Use a safe contact method only if you want a response.',`<form id="anonymousSafetyReportForm" class="form-grid" data-form="anonymous-safety-report"><label class="field"><span>Category</span><select name="category"><option>MADE_ME_UNCOMFORTABLE</option><option>CHILD_SAFETY_OR_GROOMING</option><option>SUSPECTED_CHILD_SEXUAL_EXPLOITATION_MATERIAL</option><option>STALKING_OR_BLOCK_EVASION</option><option>THREAT_OF_VIOLENCE</option><option>SEXUAL_HARASSMENT</option><option>COERCION_OR_ABUSE_OF_AUTHORITY</option><option>OTHER</option></select></label><label class="field"><span>Urgency</span><select name="urgency"><option>GENERAL_POLICY_VIOLATION</option><option>PATTERN_DOCUMENTATION</option><option>SERIOUS_NOT_IMMEDIATE</option><option>CREDIBLE_THREAT_OR_STALKING</option><option>SEXUAL_EXPLOITATION_OR_GROOMING</option><option>CHILD_IMMEDIATE_RISK</option><option>IMMEDIATE_DANGER</option></select></label><label class="field span-2"><span>Summary</span><input name="summary" maxlength="300" required></label><label class="field span-2"><span>Details <small>(optional)</small></span><textarea name="details" maxlength="8000"></textarea></label><label class="field"><span>Safe email <small>(optional)</small></span><input name="safeEmail" type="email"></label><label class="field"><span>Related account, post, message, or group ID <small>(optional)</small></span><input name="scopeId"></label><div class="notice warning span-2">Do not download, screenshot, forward, duplicate, or re-upload suspected child sexual abuse material. Reference where it exists instead.</div></form>`,`<button class="btn" data-action="close-modal">Cancel</button><button class="btn danger" type="submit" form="anonymousSafetyReportForm">Submit protected report</button>`,true),
  incidentJournal: () => modalTemplate('Create a private incident journal','This remains private unless you choose to submit or share it.',`<form id="incidentJournalForm" class="form-grid" data-form="incident-journal"><label class="field span-2"><span>Journal title</span><input name="title" maxlength="160" required></label><label class="field span-2"><span>Private summary <small>(optional)</small></span><textarea name="summary" maxlength="3000"></textarea></label><label class="field"><span>Safe contact preference</span><select name="contactPreference"><option>DO_NOT_CONTACT_UNLESS_ESSENTIAL</option><option>IN_APP_ONLY</option><option>SAFE_EMAIL</option></select></label><label class="field"><span>Safe email <small>(optional)</small></span><input name="safeEmail" type="email"></label></form>`,`<button class="btn" data-action="close-modal">Cancel</button><button class="btn primary" type="submit" form="incidentJournalForm">Create private journal</button>`),
  incidentEntry: journal => modalTemplate('Add incident entry',journal?.title||'Private incident journal',`<form id="incidentEntryForm" class="form-grid" data-form="incident-entry"><input type="hidden" name="journalId" value="${escapeAttr(journal?.id||'')}"><label class="field"><span>Date and time</span><input name="occurredAt" type="datetime-local"></label><label class="field"><span>People or roles involved</span><input name="people" placeholder="Names, usernames, GM, Player…"></label><label class="field span-2"><span>What happened</span><textarea name="narrative" maxlength="8000" required></textarea></label><label class="field span-2"><span>Boundary stated and response <small>(optional)</small></span><textarea name="boundaryResponse"></textarea></label><label class="field"><span>Witnesses <small>(optional)</small></span><input name="witnesses"></label><label class="field"><span>Linked object ID <small>(optional)</small></span><input name="linkedObjectId"></label><label class="field span-2"><span>Impact or requested outcome <small>(optional)</small></span><textarea name="impact"></textarea></label></form>`,`<button class="btn" data-action="close-modal">Cancel</button><button class="btn primary" type="submit" form="incidentEntryForm">Save private entry</button>`),
  applications: apps => modalTemplate('Player applications','Approve or decline Visitor requests for Player abilities.',apps.length?`<div class="command-results">${apps.map(a=>`<article class="card card-pad"><div class="finder-owner">${avatar(a.user)}<div><strong>${escapeHtml(userName(a.user))}</strong><div class="helper">${formatDateTime(a.createdAt)}</div></div></div><p>${escapeHtml(a.message||'No message.')}</p><div class="form-actions"><button class="btn" data-action="respond-player-application" data-application-id="${escapeAttr(a.id)}" data-accept="false">Decline</button><button class="btn success" data-action="respond-player-application" data-application-id="${escapeAttr(a.id)}" data-accept="true">Approve Player</button></div></article>`).join('')}</div>`:emptyState('✓','No pending applications','Visitor applications will appear here.'),'',true),
  messageSearch: results => modalTemplate('Message search',`${results.length} result${results.length===1?'':'s'}`,`<div class="command-results">${results.map(m=>`<button class="command-result" data-action="jump-message" data-message-id="${escapeAttr(m.id)}"><span>${escapeHtml(m.author?.username||'Unknown')}</span><span>${escapeHtml(String(m.content||'').slice(0,160))}</span><small>${formatDateTime(m.createdAt)}</small></button>`).join('')||'<p class="helper">No matching messages.</p>'}</div>`,'',true),
  confirm: (title,body,action,attrs='') => modalTemplate(title,'',`<p>${escapeHtml(body)}</p>`,`<button class="btn" data-action="close-modal">Cancel</button><button class="btn danger" data-action="${escapeAttr(action)}" ${attrs}>Confirm</button>`)
};
