import { CONFIG, MODERATOR_PERMISSIONS, PERMISSIONS } from './config.js';
import { PROFILE_TEMPLATE_HTML } from './profile-template.js';
import { ApiError, DemoApi, TableGateApi } from './api.js';
import {
  state, subscribe, emit, patch, setMode, setToken, setTheme, setView, setActiveTablegate
} from './state.js';
import {
  renderAuth, renderAppRail, renderContextRail, renderTopbar, renderMain,
  renderDetailRail, renderComposer, renderMobileNav, forms, modalTemplate,
  getRoleClass
} from './views.js';
import {
  $, $$, array, avatar, debounce, downloadJson, escapeAttr, escapeHtml, hasPermission,
  icon, parseJsonInput, parseTags, readForm, setDocumentTheme, throttle
} from './utils.js';
import { mountOrganizer, mountSystemLibrary, mountWorkspace } from './workspaces.js';

const roots = {
  auth: $('#authRoot'),
  app: $('#appRoot'),
  rail: $('#appRail'),
  context: $('#contextRail'),
  topbar: $('#topbar'),
  main: $('#mainContent'),
  composer: $('#composerRoot'),
  detail: $('#detailRail'),
  mobile: $('#mobileNav'),
  backdrop: $('#drawerBackdrop'),
  modal: $('#modalRoot'),
  toast: $('#toastRoot'),
  live: $('#liveRegion')
};

let api = createApi();
let pollTimer = null;
let modalMode = '';
let attachmentIds = [];
let lastRenderedView = '';
let rendering = false;
let bootstrapComplete = false;
const saveProfileToBackend = debounce(async profileState => {
  if (!state.authenticated || !profileState) return;
  try {
    const data = { key:'social-profile-v3', value:profileState, meta:{source:'tablegate-profile-shell'} };
    if (state.profileSyncRevision) data.expectedRevision = state.profileSyncRevision;
    const result = await api.request('tablegate.sync.state.save', { data });
    state.profileSyncRevision = Number(result?.revision || state.profileSyncRevision || 0);
    state.profileTemplateState = profileState;
    state.profileSyncLoaded = true;
  } catch (error) {
    console.warn('Profile sync deferred:', error);
    toast('Profile saved on this device; backend sync will retry after the connection is available.', 'warning');
  }
}, 900);

function createApi() {
  return state.mode === 'demo'
    ? new DemoApi()
    : new TableGateApi({ token: state.token, url: CONFIG.BACKEND_URL });
}

function normalizeList(value, key = '') {
  if (Array.isArray(value)) return value;
  if (key && Array.isArray(value?.[key])) return value[key];
  for (const candidate of ['items', 'results', 'tablegates', 'posts', 'messages', 'friends', 'notifications', 'members', 'roles', 'channels', 'categories', 'reports', 'locations', 'applications', 'events', 'venues', 'journals', 'interests']) {
    if (Array.isArray(value?.[candidate])) return value[candidate];
  }
  return [];
}

function unwrap(value, ...keys) {
  for (const key of keys) if (value?.[key] !== undefined) return value[key];
  return value;
}

function actionScope() {
  if (state.view === 'tablegate' && state.activeChannelId) {
    return { scopeType: 'CHANNEL', scopeId: state.activeChannelId, channelId: state.activeChannelId };
  }
  if (state.view === 'dms' && state.activeDmId) {
    return { scopeType: 'DM', scopeId: state.activeDmId, dmId: state.activeDmId };
  }
  return {};
}

function setApiToken(token) {
  setToken(token);
  if (api instanceof TableGateApi) api.setToken(token);
}

function toast(message, type = 'info', duration = 4300) {
  const item = document.createElement('div');
  item.className = `toast ${type}`;
  item.innerHTML = `<span>${escapeHtml(message)}</span><button class="icon-button" type="button" aria-label="Dismiss">${icon('x')}</button>`;
  item.querySelector('button').addEventListener('click', () => item.remove());
  roots.toast.append(item);
  setTimeout(() => item.remove(), duration);
}

function announce(message) {
  roots.live.textContent = '';
  requestAnimationFrame(() => { roots.live.textContent = message; });
}

function render(reason = '') {
  if (rendering) return;
  rendering = true;
  try {
    setDocumentTheme(state.theme);
    if (!state.authenticated) {
      roots.auth.hidden = false;
      roots.app.hidden = true;
      roots.auth.innerHTML = renderAuth(state);
      roots.modal.hidden = true;
      roots.backdrop.hidden = true;
      return;
    }

    roots.auth.hidden = true;
    roots.app.hidden = false;
    roots.app.dataset.view = state.view;
    roots.rail.innerHTML = renderAppRail(state);
    roots.context.innerHTML = renderContextRail(state);
    roots.topbar.innerHTML = renderTopbar(state);
    const existingProfileFrame = state.view === 'profile' && roots.main.querySelector('#tablegateProfileFrame');
    if (!existingProfileFrame) roots.main.innerHTML = renderMain(state);
    if (state.view === 'studio') mountWorkspace(roots.main, state, getRoleClass(state));
    if (state.view === 'systems') mountSystemLibrary(roots.main).catch(error => console.warn('System library could not mount:', error));
    if (state.view === 'organizer') mountOrganizer(roots.main, state.activeTablegateId || state.me?.id || 'local');
    const profileFrame = state.view === 'profile' ? roots.main.querySelector('#tablegateProfileFrame') : null;
    if (profileFrame && state.me) {
      const profileUserId = String(state.me?.id || state.me?.email || state.me?.username || 'local');
      const profileName = String(state.me?.displayName || state.me?.username || state.me?.displayTag || 'TableGate User');
      const profileHandle = '@' + String(state.me?.username || 'tablegate-user').replace(/^@/, '');
      const storageKey = `tablegate.personal-profile.v3.${profileUserId}`;
      const context = {
        type:'tablegate-profile-context',
        state:state.profileTemplateState,
        account:{name:profileName,handle:profileHandle,userId:profileUserId,bio:state.me?.bio||'',status:state.me?.customStatus||''},
        friends:state.friends.map(item=>item.otherUser||item.user||item).filter(Boolean)
      };
      const sendContext=()=>profileFrame.contentWindow?.postMessage(context,'*');
      if (profileFrame.dataset.profileUserId !== profileUserId) {
        profileFrame.dataset.profileUserId = profileUserId;
        delete profileFrame.dataset.loaded;
      }
      if (!profileFrame.dataset.loaded) {
        profileFrame.dataset.loaded = 'true';
        profileFrame.addEventListener('load', sendContext, {once:true});
        profileFrame.srcdoc = PROFILE_TEMPLATE_HTML.replace('__TABLEGATE_PROFILE_STORAGE_KEY__', JSON.stringify(storageKey).replace(/</g,'\\u003c'));
      } else {
        sendContext();
      }
    }
    roots.detail.innerHTML = renderDetailRail(state);
    roots.mobile.innerHTML = renderMobileNav(state);

    const composer = renderComposer(state);
    roots.composer.hidden = composer.hidden;
    roots.composer.innerHTML = composer.html;

    roots.context.classList.toggle('open', Boolean(state.navOpen));
    roots.detail.classList.toggle('open', Boolean(state.detailOpen));
    roots.backdrop.hidden = !(state.navOpen || state.detailOpen);

    if (state.view !== lastRenderedView) {
      roots.main.scrollTop = 0;
      lastRenderedView = state.view;
    } else if (reason === 'messages' || reason === 'sent-message') {
      requestAnimationFrame(() => { roots.main.scrollTop = roots.main.scrollHeight; });
    }
  } finally {
    rendering = false;
  }
}

subscribe((_, reason) => render(reason));

function openModal(html, mode = '') {
  modalMode = mode;
  roots.modal.innerHTML = html;
  roots.modal.hidden = false;
  document.body.classList.add('modal-open');
  requestAnimationFrame(() => roots.modal.querySelector('input:not([type="hidden"]), textarea, select, button')?.focus());
}

function closeModal() {
  roots.modal.hidden = true;
  roots.modal.innerHTML = '';
  document.body.classList.remove('modal-open');
  modalMode = '';
}

async function run(label, fn, { quiet = false, success = '', rerender = true } = {}) {
  try {
    const result = await fn();
    state.connection = 'online';
    if (success) toast(success, 'success');
    if (rerender) emit(label);
    return result;
  } catch (error) {
    const message = error instanceof ApiError ? error.message : (error?.message || 'Something went wrong.');
    state.connection = navigator.onLine ? 'error' : 'offline';
    if (!quiet) toast(message, 'danger', 6500);
    console.error(`[TableGate:${label}]`, error);
    emit(`${label}-error`);
    return null;
  }
}

async function testConnection({ quiet = false } = {}) {
  const result = await run('connection', () => api.health(), { quiet, rerender: false });
  if (result) {
    state.connection = 'online';
    if (!quiet) toast(`Connected to TableGate ${result.apiVersion || CONFIG.API_VERSION}.`, 'success');
  }
  emit('connection');
  return result;
}

async function hydrateSession() {
  state.loading = true;
  emit('hydrate-start');
  const meData = await run('session', () => api.request('me'), { rerender: false });
  if (!meData) {
    state.loading = false;
    if (state.mode !== 'demo') {
      setApiToken('');
      setMode('backend');
      api = createApi();
      state.authenticated = false;
      state.authMessage = 'Error: Your session could not be restored. Please sign in again.';
    }
    emit('hydrate-failed');
    return;
  }
  state.me = meData.user || meData.me || meData;
  state.tablegates = normalizeList(meData.tablegates || await api.request('listTablegates'), 'tablegates');
  state.authenticated = true;
  state.loading = false;
  state.connection = 'online';
  const [dms, friends, notifications, finder, discover, safety, locations, reports, journals, profileSync] = await Promise.allSettled([
    api.request('listDms'), api.request('listFriends'), api.request('listNotifications', { limit: 50 }),
    api.request('getGroupFinderRecommendations', { limit: 30 }), api.request('discoverTablegates', { limit: 40, offset: 0 }),
    api.request('listSafety'), api.request('listPublicLocations'), api.request('listMySafetyReports'),
    api.request('listIncidentJournals'), api.request('tablegate.sync.state.load', { data:{key:'social-profile-v3',fallback:null} })
  ]);
  state.dms = dms.status === 'fulfilled' ? normalizeList(dms.value, 'dms') : [];
  state.friends = friends.status === 'fulfilled' ? normalizeList(friends.value, 'friends') : [];
  state.notifications = notifications.status === 'fulfilled' ? normalizeList(notifications.value, 'notifications') : [];
  state.finder.items = finder.status === 'fulfilled' ? normalizeList(finder.value, 'posts') : [];
  state.finder.total = state.finder.items.length;
  state.discover.items = discover.status === 'fulfilled' ? normalizeList(discover.value, 'tablegates') : [];
  state.discover.total = Number(discover.value?.total ?? state.discover.items.length);
  state.safetyRelations = safety.status === 'fulfilled' ? normalizeList(safety.value, 'relations') : [];
  state.publicLocations = locations.status === 'fulfilled' ? normalizeList(locations.value, 'locations') : [];
  state.safetyReports = reports.status === 'fulfilled' ? normalizeList(reports.value, 'reports') : [];
  state.safetyJournals = journals.status === 'fulfilled' ? normalizeList(journals.value, 'journals') : [];
  if (profileSync.status === 'fulfilled') {
    const syncValue = profileSync.value?.value ?? profileSync.value?.state?.value ?? null;
    if (syncValue) state.profileTemplateState = syncValue;
    state.profileSyncRevision = Number(profileSync.value?.revision || 0);
    state.profileSyncLoaded = true;
  }
  if (state.activeTablegateId && state.tablegates.some(t => t.id === state.activeTablegateId)) {
    await loadTablegate(state.activeTablegateId, { navigate: state.view === 'tablegate', quiet: true });
  }
  emit('hydrated');
  startPolling();
  await run('presence', () => api.request('setPresence', { status: 'ONLINE', lastSeenAt: new Date().toISOString() }), { quiet: true, rerender: false });
}

async function loadTablegate(tablegateId, { navigate = true, quiet = false } = {}) {
  if (!tablegateId) return;
  state.loading = true;
  setActiveTablegate(tablegateId);
  if (navigate) state.view = 'tablegate';
  emit('tablegate-loading');
  const data = await run('tablegate', () => api.request('getTablegate', { tablegateId }), { quiet, rerender: false });
  state.loading = false;
  if (!data) return emit('tablegate-failed');

  const tablegate = data.tablegate || data;
  const active = {
    ...data,
    tablegate,
    categories: normalizeList(data.categories, 'categories'),
    channels: normalizeList(data.channels, 'channels'),
    members: normalizeList(data.members, 'members'),
    roles: normalizeList(data.roles, 'roles')
  };
  state.activeTablegate = active;

  const priorChannel = active.channels.find(channel => channel.id === state.activeChannelId);
  const firstChannel = active.channels.find(channel => !['VOICE', 'VIDEO'].includes(channel.type)) || active.channels[0];
  state.activeChannelId = priorChannel?.id || firstChannel?.id || '';
  state.activeDmId = '';
  state.replyTo = null;
  state.editingMessage = null;
  state.messageSearchResults = null;
  state.messages = [];
  if (state.activeChannelId) await loadMessages({ quiet: true });
  emit('tablegate-loaded');
}

async function loadMessages({ before = '', append = false, quiet = false } = {}) {
  const scope = actionScope();
  if (!scope.scopeId) return;
  const result = await run('messages', () => api.request('listMessages', {
    ...scope,
    before: before || undefined,
    limit: CONFIG.MESSAGE_PAGE_SIZE
  }), { quiet, rerender: false });
  if (!result) return;
  const messages = normalizeList(result, 'messages');
  state.messages = append ? [...messages, ...state.messages] : messages;
  state.messageHasMore = Boolean(result.hasMore ?? messages.length >= CONFIG.MESSAGE_PAGE_SIZE);
  state.messageCursor = result.nextCursor || messages[0]?.createdAt || '';
  state.messageSearchResults = null;
  state.typing = [];
  emit('messages');
}

async function loadDm(dmId) {
  state.activeDmId = dmId;
  state.activeChannelId = '';
  state.activeTablegateId = '';
  state.activeTablegate = null;
  state.view = 'dms';
  state.replyTo = null;
  state.editingMessage = null;
  state.messages = [];
  emit('dm-loading');
  const result = await run('dm', () => api.request('getDm', { dmId }), { rerender: false });
  if (result?.dm) {
    const index = state.dms.findIndex(dm => dm.id === dmId);
    if (index >= 0) state.dms[index] = { ...state.dms[index], ...result.dm };
    else state.dms.unshift(result.dm);
  }
  if (Array.isArray(result?.messages)) {
    state.messages = result.messages;
    emit('messages');
  } else {
    await loadMessages({ quiet: true });
  }
}

async function loadDiscover(filters = {}) {
  state.discover.loading = true;
  state.discover.query = filters.query ?? state.discover.query;
  emit('discover-loading');
  const result = await run('discover', () => api.request('discoverTablegates', {
    q: state.discover.query,
    query: state.discover.query,
    systemId: filters.systemId || undefined,
    tags: parseTags(filters.tags),
    joinPolicy: filters.joinPolicy || undefined,
    limit: 60,
    offset: 0
  }), { rerender: false });
  state.discover.loading = false;
  if (result) {
    state.discover.items = normalizeList(result, 'tablegates');
    state.discover.total = Number(result.total ?? state.discover.items.length);
  }
  emit('discover');
}

async function loadFinder(filters = {}) {
  state.finder.loading = true;
  state.finder.query = filters.query ?? state.finder.query;
  state.finder.playMode = filters.playMode ?? state.finder.playMode;
  emit('finder-loading');
  const common = { q:state.finder.query, query:state.finder.query, playMode:state.finder.playMode||undefined,
    systemIds:filters.systemId?[filters.systemId]:undefined, roles:filters.role?[filters.role]:undefined, limit:60 };
  try {
    if (state.finder.view === 'LOCAL_EVENTS') {
      const [events,venues] = await Promise.allSettled([api.request('listPublicEvents',common),api.request('listPublicVenues',common)]);
      state.finder.events = events.status==='fulfilled' ? normalizeList(events.value,'events') : [];
      state.finder.venues = venues.status==='fulfilled' ? normalizeList(venues.value,'venues') : [];
      state.finder.items=[]; state.finder.interests=[];
    } else if (state.finder.view === 'MY_ACTIVITY') {
      const [posts,interests] = await Promise.allSettled([
        api.request('searchGroupFinderPosts',{...common,ownerId:state.me?.id,view:'MY_ACTIVITY'}),
        api.request('listMyGroupFinderInterests',{limit:100})
      ]);
      state.finder.items=posts.status==='fulfilled'?normalizeList(posts.value,'posts'):[];
      state.finder.interests=interests.status==='fulfilled'?normalizeList(interests.value,'interests'):[];
      state.finder.events=[];state.finder.venues=[];
    } else {
      const action=state.finder.view==='COMPATIBLE'?'getGroupFinderRecommendations':'searchGroupFinderPosts';
      const result=await run('finder',()=>api.request(action,{...common,view:state.finder.view,isRightNow:state.finder.view==='RIGHT_NOW'?true:undefined}),{rerender:false});
      state.finder.items=result?normalizeList(result,'posts'):[];
      state.finder.events=[];state.finder.venues=[];state.finder.interests=[];
    }
    state.finder.total=state.finder.items.length+state.finder.events.length+state.finder.venues.length+state.finder.interests.length;
  } finally { state.finder.loading=false; emit('finder'); }
}
async function refreshSideData({ quiet = true } = {}) {
  if (!state.authenticated) return;
  const results = await Promise.allSettled([
    api.request('listDms'),
    api.request('listFriends'),
    api.request('listNotifications', { limit: 50 }),
    api.request('unreadCounts', {
      tablegateId: state.activeTablegateId || undefined,
      channelId: state.activeChannelId || undefined,
      dmId: state.activeDmId || undefined
    })
  ]);
  if (results[0].status === 'fulfilled') state.dms = normalizeList(results[0].value, 'dms');
  if (results[1].status === 'fulfilled') state.friends = normalizeList(results[1].value, 'friends');
  if (results[2].status === 'fulfilled') state.notifications = normalizeList(results[2].value, 'notifications');
  if (results[3].status === 'fulfilled') state.unreadCounts = results[3].value?.counts || results[3].value || {};
  if (!quiet) toast('TableGate data refreshed.', 'success');
  emit('side-data');
}

function startPolling() {
  stopPolling();
  pollTimer = setInterval(pollEvents, CONFIG.EVENT_POLL_MS);
}

function stopPolling() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = null;
}

async function pollEvents() {
  if (!state.authenticated || document.hidden || state.connection === 'offline') return;
  const payload = {
    after: state.eventCursor,
    cursor: state.eventCursor,
    tablegateIds: state.activeTablegateId ? [state.activeTablegateId] : [],
    channelIds: state.activeChannelId ? [state.activeChannelId] : [],
    dmIds: state.activeDmId ? [state.activeDmId] : [],
    limit: 100
  };
  try {
    const result = await api.request('pollEvents', payload);
    state.connection = 'online';
    state.eventCursor = result.cursor || result.nextCursor || new Date().toISOString();
    const events = normalizeList(result, 'events');
    if (!events.length) return;
    const hasMessages = events.some(event => /MESSAGE|REACTION|TYPING/i.test(event.type || event.eventType || ''));
    const hasSideData = events.some(event => /NOTIFICATION|FRIEND|APPLICATION|MEMBER|TABLEGATE|SAFETY/i.test(event.type || event.eventType || ''));
    if (hasMessages && (state.activeChannelId || state.activeDmId)) await loadMessages({ quiet: true });
    if (hasSideData) await refreshSideData();
  } catch (error) {
    state.connection = navigator.onLine ? 'error' : 'offline';
    emit('poll-error');
  }
}

function currentMember() {
  return state.activeTablegate?.member || state.activeTablegate?.members?.find(member => member.userId === state.me?.id) || null;
}

function can(permission) {
  const role = getRoleClass(state);
  if (role === 'OWNER' || role === 'ADMIN') return true;
  const permissions = Number(state.activeTablegate?.permissions || 0);
  return hasPermission(permissions, permission);
}

function customCreateChannelModal(categoryId = '') {
  const categoryOptions = (state.activeTablegate?.categories || []).map(category =>
    `<option value="${escapeAttr(category.id)}" ${category.id === categoryId ? 'selected' : ''}>${escapeHtml(category.name)}</option>`
  ).join('');
  return modalTemplate(
    'Create channel',
    'Channel permissions and Visitor mode are enforced by the supplied V8 backend.',
    `<form id="createChannelForm" class="form-grid" data-form="create-channel">
      <label class="field span-2"><span>Name</span><input name="name" maxlength="80" required></label>
      <label class="field"><span>Type</span><select name="type"><option>TEXT</option><option>VOICE</option><option>VIDEO</option><option>FORUM</option><option>ANNOUNCEMENT</option></select></label>
      <label class="field"><span>Category</span><select name="categoryId"><option value="">Uncategorized</option>${categoryOptions}</select></label>
      <label class="field span-2"><span>Topic</span><input name="topic" maxlength="1024"></label>
      <label class="field"><span>Visitor access</span><select name="visitorMode"><option value="CHAT">Can chat</option><option value="READ">Read only</option><option value="OBSERVE">Observe only</option><option value="NONE">Hidden / no access</option></select></label>
      <label class="field"><span>Slowmode seconds</span><input name="slowmodeSeconds" type="number" min="0" max="21600" value="0"></label>
      <label class="checkbox span-2"><input name="isPrivate" type="checkbox"><span>Private channel; access is controlled by role IDs.</span></label>
      <label class="field span-2"><span>Allowed role IDs <small>(comma separated, optional)</small></span><input name="allowedRoleIds"></label>
    </form>`,
    '<button class="btn" data-action="close-modal">Cancel</button><button class="btn primary" type="submit" form="createChannelForm">Create channel</button>'
  );
}

function customTablegateSettingsModal() {
  const t = state.activeTablegate?.tablegate || {};
  return modalTemplate(
    'TableGate settings',
    'Owner/Admin controls. Ownership protection and central safety actions cannot be overridden here.',
    `<form id="tablegateSettingsForm" class="form-grid" data-form="tablegate-settings">
      <label class="field span-2"><span>Name</span><input name="name" value="${escapeAttr(t.name || '')}" required></label>
      <label class="field span-2"><span>Description</span><textarea name="description">${escapeHtml(t.description || '')}</textarea></label>
      <label class="field"><span>Access</span><select name="isPublic"><option value="true" ${t.isPublic ? 'selected' : ''}>Public</option><option value="false" ${!t.isPublic ? 'selected' : ''}>Private</option></select></label>
      <label class="field"><span>Language</span><input name="language" value="${escapeAttr(t.language || 'en')}"></label>
      <label class="field"><span>Host title</span><input name="hostTitle" value="${escapeAttr(t.hostTitle || '')}" placeholder="DM, GM, MOL, Keeper…"></label>
      <label class="field"><span>Default Admin title</span><input name="defaultAdminTitle" value="${escapeAttr(t.defaultAdminTitle || '')}"></label>
      <label class="field span-2"><span>Tags</span><input name="tags" value="${escapeAttr(array(t.tags).join(', '))}"></label>
      <label class="field span-2"><span>House rules</span><textarea name="houseRules">${escapeHtml(typeof t.houseRules === 'string' ? t.houseRules : JSON.stringify(t.houseRules || {}, null, 2))}</textarea></label>
      <label class="field span-2"><span>Safety tools</span><input name="safetyTools" value="${escapeAttr(array(t.safetyTools).join(', '))}"></label>
    </form>
    <hr class="rule">
    <div class="section-title"><h3>Invite link</h3><button class="btn small" data-action="create-tablegate-invite">Create invite</button></div>
    <div id="inviteResult" class="helper">Invite codes are optional; public TableGates can also be found and joined without a link.</div>`,
    '<button class="btn" data-action="close-modal">Close</button><button class="btn primary" type="submit" form="tablegateSettingsForm">Save changes</button>',
    true
  );
}

function customMemberModal(member) {
  const role = getRoleClass(state, member);
  const user = member?.user || {};
  const viewerRole = getRoleClass(state);
  const moderator = ['OWNER', 'ADMIN', 'MODERATOR'].includes(viewerRole);
  const protectedTarget = role === 'OWNER' || (role === 'ADMIN' && viewerRole !== 'OWNER');
  const management = moderator && !protectedTarget && user.id !== state.me?.id ? `
    <hr class="rule"><div class="section-title"><h3>Group moderation</h3></div>
    <div class="form-actions" style="justify-content:flex-start">
      ${role === 'VISITOR' && ['OWNER','ADMIN'].includes(viewerRole) ? `<button class="btn success" data-action="approve-player-direct" data-user-id="${escapeAttr(user.id)}">Approve Player</button>` : ''}
      ${role === 'PLAYER' && ['OWNER','ADMIN'].includes(viewerRole) ? `<button class="btn" data-action="revoke-player-direct" data-user-id="${escapeAttr(user.id)}">Return to Visitor</button>` : ''}
      <button class="btn" data-action="kick-member" data-user-id="${escapeAttr(user.id)}">Remove from TableGate</button>
      <button class="btn danger" data-action="ban-member" data-user-id="${escapeAttr(user.id)}">Ban from TableGate</button>
    </div>` : '';
  return modalTemplate(
    user.username || 'Member',
    user.displayTag || `${user.username || 'User'}${user.discriminator ? `#${user.discriminator}` : ''}`,
    `<div class="finder-owner">${avatar(user, 'large')}<div><h3>${escapeHtml(member.nickname || user.username || 'Member')}</h3><span class="role-badge ${role.toLowerCase()}">${escapeHtml(role === 'OWNER' ? 'Owner' : role[0] + role.slice(1).toLowerCase())}</span><p class="helper">${escapeHtml(user.bio || user.customStatus || '')}</p></div></div>
    <div class="form-actions" style="justify-content:flex-start;margin-top:15px"><button class="btn primary" data-action="create-dm-user" data-user-id="${escapeAttr(user.id || '')}">Message</button><button class="btn" data-action="send-friend-user" data-user-id="${escapeAttr(user.id || '')}">Add friend</button><button class="btn" data-action="block-user" data-user-id="${escapeAttr(user.id || '')}">Block</button><button class="btn danger" data-action="open-safety-report" data-object-type="USER" data-object-id="${escapeAttr(user.id || '')}" data-user-id="${escapeAttr(user.id || '')}">Report</button></div>${management}`,
    '',
    true
  );
}

function customJoinRequestsModal(requests = []) {
  const body = requests.length ? `<div class="command-results">${requests.map(request => {
    const user = request.user || request.requester || {};
    return `<article class="card card-pad"><div class="finder-owner">${avatar(user)}<div><strong>${escapeHtml(user.displayTag || user.username || request.userId || 'Applicant')}</strong><div class="helper">Requested membership · ${escapeHtml(request.status || 'PENDING')}</div></div></div><p>${escapeHtml(request.message || 'No message provided.')}</p><div class="form-actions"><button class="btn" data-action="respond-join-request" data-request-id="${escapeAttr(request.id)}" data-accept="false">Decline</button><button class="btn success" data-action="respond-join-request" data-request-id="${escapeAttr(request.id)}" data-accept="true">Approve as Visitor</button></div></article>`;
  }).join('')}</div>` : '<div class="empty-state"><div><div class="icon">✓</div><h2>No pending membership requests</h2><p>Request-only and private TableGate applications will appear here.</p></div></div>';
  return modalTemplate('Membership requests', 'Membership approval grants Visitor access. Player abilities still require a separate Player approval.', body, '', true);
}

function customVoiceModal(channel) {
  return modalTemplate(
    `${channel?.type === 'VIDEO' ? 'Video' : 'Voice'} room`,
    channel?.name || 'TableGate room',
    `<div class="notice info"><strong>Backend-ready room shell:</strong> TableGate V8 authorizes voice/video sessions and signaling. This social shell deliberately does not bundle a third-party media server or pretend that media is connected when it is not.</div><p>Role access remains enforced: Owners/Admins/Moderators manage the room; Players participate where allowed; Visitors observe only unless explicitly approved and permitted.</p>`,
    '<button class="btn" data-action="close-modal">Close</button>'
  );
}

function invitationText(code) {
  const base = new URL(location.href);
  base.searchParams.set('invite', code);
  return base.toString();
}

async function handleAuthForm(form, name) {
  const data = readForm(form);
  state.authMessage = '';
  if (data.email) state.pendingAuthEmail = String(data.email).trim();
  emit('auth-working');
  try {
    if (name === 'login') {
      const result = await api.request('login', { email: data.email, password: data.password, userAgent: navigator.userAgent });
      state.connection = 'online';
      if (result.twoFactorRequired && !result.token) {
        state.authenticated = false;
        state.authTab = 'twofactor';
        state.pendingAuthEmail = data.email;
        state.pendingAuthToken = result.twoFactorChallengeId || '';
        state.authMessage = `A ${result.twoFactorMethod === 'PHONE' ? 'phone' : 'email'} verification code was sent. Enter it to finish signing in.`;
        emit('two-factor-required');
        return;
      }
      setApiToken(result.token || result.sessionToken || '');
      state.authenticated = true;
      state.me = result.user;
      setView('profile');
      await hydrateSession();
      return;
    }
    if (name === 'register') {
      const result = await api.request('register', {
        username: data.username,
        email: data.email,
        password: data.password,
        ageBand: data.ageBand,
        inviteCode: data.inviteCode || undefined,
        userAgent: navigator.userAgent
      });
      state.connection = 'online';
      if (result.verificationRequired && !result.token && !result.sessionToken) {
        state.authenticated = false;
        state.authTab = 'verify';
        state.pendingAuthEmail = data.email;
        state.authMessage = 'Check your email for the verification code, then enter it below.';
        emit('verification-required');
        return;
      }
      setApiToken(result.token || result.sessionToken || '');
      state.authenticated = true;
      state.me = result.user;
      await hydrateSession();
      return;
    }
    if (name === 'verify-email') {
      const result = await api.request('verifyEmail', {
        email: data.email,
        code: data.code || undefined,
        token: state.pendingAuthToken || undefined,
        userAgent: navigator.userAgent
      }, {auth:false});
      state.connection = 'online';
      state.pendingAuthToken = '';
      setApiToken(result.token || result.sessionToken || '');
      state.authenticated = true;
      state.me = result.user;
      state.authMessage = '';
      setView('profile');
      await hydrateSession();
      return;
    }
    if (name === 'verify-two-factor') {
      const result = await api.request('verifyTwoFactor', { email: data.email || state.pendingAuthEmail, challengeId: state.pendingAuthToken, code: data.code, userAgent: navigator.userAgent }, {auth:false});
      state.connection = 'online';
      state.pendingAuthToken = '';
      setApiToken(result.token || result.sessionToken || '');
      state.authenticated = true;
      state.me = result.user;
      state.authMessage = '';
      setView('profile');
      await hydrateSession();
      return;
    }
    if (name === 'resend-two-factor') {
      const result = await api.request('resendTwoFactor', { email: data.email || state.pendingAuthEmail }, {auth:false});
      if (result?.challengeId) state.pendingAuthToken = result.challengeId;
      state.authMessage = 'A new two-factor code was sent. Older codes may expire or be invalidated for security.';
      emit('two-factor-resend');
      return;
    }
    if (name === 'forgot-password') {
      await api.request('forgotPassword', { email: data.email }, {auth:false});
      state.connection = 'online';
      state.authTab = 'reset';
      state.pendingAuthEmail = data.email;
      state.authMessage = 'A reset code was requested. Enter the code from your email and choose a new password.';
      emit('forgot-password');
      return;
    }
    if (name === 'reset-password') {
      if (data.newPassword !== data.confirmPassword) throw new ApiError('PASSWORD_MISMATCH', 'The two new-password fields do not match.');
      await api.request('resetPassword', {
        email: data.email,
        code: data.code || undefined,
        token: state.pendingAuthToken || undefined,
        newPassword: data.newPassword
      }, {auth:false});
      state.connection = 'online';
      state.pendingAuthToken = '';
      state.authTab = 'login';
      state.pendingAuthEmail = data.email;
      state.authMessage = 'Your password was reset. Sign in with the new password.';
      emit('password-reset');
    }
  } catch (error) {
    const message = error instanceof ApiError ? error.message : (error?.message || 'The account request failed.');
    state.connection = navigator.onLine ? 'error' : 'offline';
    if (error?.code === 'EMAIL_NOT_VERIFIED') {
      state.authTab = 'verify';
      state.pendingAuthEmail = data.email || state.pendingAuthEmail;
      state.authMessage = 'Error: Verify your email before signing in. Enter the code that was sent to you.';
    } else {
      state.authMessage = `Error: ${message}`;
    }
    console.error(`[TableGate:${name}]`, error);
    emit(`${name}-error`);
  }
}

async function handleForm(form) {
  const name = form.dataset.form;
  if (['login', 'register', 'forgot-password', 'verify-email', 'reset-password', 'verify-two-factor'].includes(name)) return handleAuthForm(form, name);
  const data = readForm(form);

  if (name === 'settings-2fa') {
    const result=await run('settings-2fa',()=>api.request('setTwoFactor',{enabled:data.enabled==='on'||data.enabled==='true',method:data.method||'EMAIL',phone:data.phone||''}),{rerender:false,success:'Two-factor settings saved.'});
    if(result){state.me=result;emit('settings-2fa');}
    return;
  }

  if (name === 'global-search') {
    const query = String(data.query || '').trim();
    if (state.view === 'discover') return loadDiscover({ query });
    if (state.view === 'finder') return loadFinder({ query });
    if (state.view === 'friends') {
      const users = await run('search-users', () => api.request('searchUsers', { q: query, query, limit: 30 }), { rerender: false });
      openModal(forms.friend(normalizeList(users, 'users')), 'friend');
      return;
    }
    if ((state.view === 'tablegate' || state.view === 'dms') && query) {
      const result = await run('message-search', () => api.request('searchMessages', { ...actionScope(), q: query, query, limit: 100 }), { rerender: false });
      const messages = normalizeList(result, 'messages');
      state.messageSearchResults = messages;
      openModal(forms.messageSearch(messages), 'message-search');
      return;
    }
    state.view = 'discover';
    state.discover.query = query;
    emit('global-search');
    return loadDiscover({ query });
  }

  if (name === 'discover-filter') return loadDiscover(data);
  if (name === 'finder-filter') return loadFinder(data);

  if (name === 'create-tablegate') {
    const result = await run('create-tablegate', () => api.request('createTablegate', {
      name: data.name,
      description: data.description,
      isPublic: data.isPublic === 'on' || data.isPublic === 'true',
      systemMode: 'SINGLE_SYSTEM',
      systemIds: [data.systemId || 'sys_tablegate_generic'],
      systemId: data.systemId || 'sys_tablegate_generic',
      tags: parseTags(data.tags),
      language: data.language || 'en',
      maxMembers: Number(data.maxMembers || 0),
      defaultAdminTitle: data.customAdminTitle || data.defaultAdminTitle || undefined,
      customAdminTitle: data.customAdminTitle || undefined,
      hostTitle: data.customAdminTitle || data.defaultAdminTitle || undefined,
      safetyTools: [],
      houseRules: ''
    }), { success: 'TableGate created.' });
    if (!result) return;
    closeModal();
    await refreshTablegates();
    const id = result.tablegate?.id || result.id;
    if (id) await loadTablegate(id);
    return;
  }

  if (name === 'player-application') {
    const result = await run('player-request', () => api.request('requestPlayerApproval', { tablegateId: data.tablegateId || state.activeTablegateId, message: data.message || '' }), { success: 'Player approval request sent.' });
    if (result) closeModal();
    return;
  }

  if (name === 'request-join') {
    const result = await run('join-request', () => api.request('requestTablegateJoin', { tablegateId: data.tablegateId, message: data.message || '' }), { success: 'Join request sent.' });
    if (result) closeModal();
    return;
  }

  if (name === 'create-channel') {
    const result = await run('create-channel', () => api.request('createChannel', {
      tablegateId: state.activeTablegateId,
      categoryId: data.categoryId || undefined,
      name: data.name,
      type: data.type,
      channelType: data.type,
      topic: data.topic || '',
      visitorMode: data.visitorMode,
      slowmodeSeconds: Number(data.slowmodeSeconds || 0),
      isPrivate: data.isPrivate === 'on',
      allowedRoleIds: array(data.allowedRoleIds)
    }), { success: 'Channel created.' });
    if (!result) return;
    closeModal();
    await loadTablegate(state.activeTablegateId, { navigate: true });
    return;
  }

  if (name === 'tablegate-settings') {
    const result = await run('update-tablegate', () => api.request('updateTablegate', {
      tablegateId: state.activeTablegateId,
      name: data.name,
      description: data.description,
      isPublic: data.isPublic === 'true',
      language: data.language,
      hostTitle: data.hostTitle || data.customAdminTitle || data.defaultAdminTitle || undefined,
      defaultAdminTitle: data.customAdminTitle || data.defaultAdminTitle || undefined,
      customAdminTitle: data.customAdminTitle || undefined,
      tags: parseTags(data.tags),
      safetyTools: parseTags(data.safetyTools),
      houseRules: data.houseRules || ''
    }), { success: 'TableGate settings saved.' });
    if (!result) return;
    closeModal();
    await refreshTablegates();
    await loadTablegate(state.activeTablegateId, { navigate: true });
    return;
  }

  if (name === 'create-finder-post') {
    const playMode = data.playMode || 'ONLINE_OK';
    if (playMode === 'IN_PERSON_ONLY' && !data.publicLocationId) {
      toast('In-person posts require a saved public discovery anchor.', 'danger');
      return;
    }
    const result = await run('finder-post', () => api.request('createGroupFinderPost', {
      postType: data.postType,
      title: data.title,
      body: data.body,
      offeredRoles: array(data.offeredRoles),
      desiredRoles: array(data.desiredRoles),
      systemIds: [data.systemId || 'sys_tablegate_generic'],
      playMode,
      agePolicy: 'ALL_AGES_WITH_GUARDIAN_RULES',
      seatsAvailable: Number(data.seatsAvailable || 0),
      schedule: {},
      timezone: data.timezone,
      tags: parseTags(data.tags),
      tablegateId: data.tablegateId || undefined,
      publicLocationId: data.publicLocationId || undefined,
      radiusMiles: Number(data.radiusMiles || 25),
      contactPolicy: data.contactPolicy || 'INTEREST_THEN_LOBBY',
      isRightNow: data.isRightNow === 'on',
      rightNowMinutes: data.isRightNow === 'on' ? 60 : undefined,
      expiresInDays: data.isRightNow === 'on' ? undefined : 30
    }), { success: 'Group Finder post published free of charge.' });
    if (result) {
      closeModal();
      await loadFinder();
    }
    return;
  }

  if (name === 'public-location') {
    const result = await run('public-location', () => api.request('createPublicLocation', {
      label: data.label,
      placeType: data.placeType,
      city: data.city,
      region: data.region,
      country: data.country,
      lat: Number(data.lat),
      lng: Number(data.lng),
      isDefault: data.isDefault === 'on',
      visibility: 'LABEL_ONLY'
    }), { success: 'Public discovery anchor saved.' });
    if (result) {
      state.publicLocations = normalizeList(await api.request('listPublicLocations'), 'locations');
      closeModal();
      emit('public-location');
    }
    return;
  }

  if (name === 'express-interest') {
    const result = await run('finder-interest', () => api.request('expressGroupFinderInterest', {
      postId: data.postId,
      offeredRoles: array(data.offeredRoles),
      message: data.message,
      answers: {}
    }), { success: 'Interest sent. Private contact remains closed until acceptance.' });
    if (result) {
      closeModal();
      await loadFinder();
    }
    return;
  }

  if (name === 'search-user-modal') {
    const result = await run('search-users', () => api.request('searchUsers', { q: data.query, query: data.query, limit: 30 }), { rerender: false });
    const users = normalizeList(result, 'users');
    openModal(modalMode === 'friend' ? forms.friend(users) : forms.newDm(users), modalMode || 'dm');
    return;
  }

  if (name === 'safety-report') {
    const payload = {
      scopeType: data.scopeType || (data.reportedUserId ? 'USER' : 'OTHER'),
      scopeId: data.scopeId || data.reportedUserId || undefined,
      reportedUserId: data.reportedUserId || undefined,
      category: data.category,
      urgency: data.urgency,
      summary: data.summary,
      details: data.details || '',
      immediateDanger: data.immediateDanger === 'on'
    };
    const action = payload.scopeType === 'USER' || (!payload.scopeId && payload.reportedUserId) ? 'reportUserSafety' : 'reportSafetyObject';
    const result = await run('safety-report', () => api.request(action, payload), { success: 'Safety report submitted. You are not required to confront the reported person.' });
    if (result) {
      closeModal();
      state.safetyReports = normalizeList(await api.request('listMySafetyReports'), 'reports');
      state.view = 'safety';
      emit('safety-report');
    }
    return;
  }

  if (name === 'anonymous-safety-report') {
    const result = await run('anonymous-safety-report', () => api.request('reportSafetyAnonymous', {
      category:data.category, urgency:data.urgency, summary:data.summary, details:data.details||'',
      safeEmail:data.safeEmail||undefined, scopeId:data.scopeId||undefined, scopeType:data.scopeId?'OTHER':undefined
    }, {auth:false}), { success:'Protected safety report submitted.' });
    if (result) { closeModal(); state.authMessage=`Safety report submitted. Case ${result.caseReference||result.report?.caseReference||result.report?.id||''}`; emit('anonymous-report'); }
    return;
  }
  if (name === 'incident-journal') {
    const result=await run('incident-journal',()=>api.request('createIncidentJournal',{title:data.title,safeContact:{preference:data.contactPreference,email:data.safeEmail||''}}),{success:'Private incident journal created.'});
    if(result){closeModal();state.safetyJournals=normalizeList(await api.request('listIncidentJournals'),'journals');state.view='safety';emit('incident-journal');}
    return;
  }
  if (name === 'incident-entry') {
    const result=await run('incident-entry',()=>api.request('addIncidentEntry',{journalId:data.journalId,occurredAt:data.occurredAt||new Date().toISOString(),people:parseTags(data.people),narrative:data.narrative,boundaryText:data.boundaryResponse||'',witnesses:parseTags(data.witnesses),linkedObjects:data.linkedObjectId?[{type:'OTHER',id:data.linkedObjectId}]:[],impactText:data.impact||''}),{success:'Private incident entry saved.'});
    if(result){closeModal();state.safetyJournals=normalizeList(await api.request('listIncidentJournals'),'journals');emit('incident-entry');}
    return;
  }

  if (name === 'message-composer') {
    return sendComposerMessage(data.content);
  }

  if (name === 'settings-theme') {
    setTheme(data.theme);
    toast('Appearance saved.', 'success');
    return;
  }

  if (name === 'settings-profile') {
    const result = await run('profile', async () => {
      const profile = await api.request('updateProfile', { bio: data.bio, customStatus: data.customStatus, profileSlug: data.profileSlug });
      await api.request('setPresence', { status: data.status, customStatus: data.customStatus, lastSeenAt: new Date().toISOString() });
      return profile;
    }, { success: 'Profile and presence updated.' });
    if (result) state.me = result.user || { ...state.me, bio: data.bio, customStatus: data.customStatus, profileSlug:data.profileSlug, status: data.status };
  }
}

async function sendComposerMessage(content) {
  content = String(content || '').trim();
  if (!content) return;
  const scope = actionScope();
  if (!scope.scopeId) return;
  if (state.editingMessage) {
    const updated = await run('edit-message', () => api.request('editMessage', { messageId: state.editingMessage.id, content }), { rerender: false, success: 'Message edited.' });
    if (updated) {
      const message = updated.message || updated;
      state.messages = state.messages.map(item => item.id === message.id ? { ...item, ...message } : item);
      state.editingMessage = null;
      state.replyTo = null;
      emit('messages');
    }
    return;
  }
  const result = await run('send-message', () => api.request('sendMessage', {
    ...scope,
    content,
    messageType: 'DEFAULT',
    replyToId: state.replyTo?.id || undefined,
    attachmentIds
  }), { rerender: false });
  if (!result) return;
  const message = result.message || result;
  state.messages = [...state.messages, message];
  state.replyTo = null;
  state.editingMessage = null;
  attachmentIds = [];
  emit('sent-message');
}

async function refreshTablegates() {
  const result = await run('tablegates', () => api.request('listTablegates'), { quiet: true, rerender: false });
  if (result) state.tablegates = normalizeList(result, 'tablegates');
  emit('tablegates');
}

const typingSignal = throttle(async () => {
  const scope = actionScope();
  if (!scope.scopeId) return;
  try { await api.request('startTyping', scope); } catch {}
}, CONFIG.TYPING_THROTTLE_MS);

async function chooseAttachment() {
  $('#attachmentInput')?.click();
}

async function uploadAttachment(file) {
  if (!file) return;
  const maxBytes = 12 * 1024 * 1024;
  if (file.size > maxBytes) {
    toast('This shell limits individual message uploads to 12 MB. The backend may impose a different limit.', 'danger');
    return;
  }
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const scope = actionScope();
  const result = await run('upload-attachment', () => api.request('uploadAttachment', {
    fileName: file.name,
    originalName: file.name,
    mimeType: file.type || 'application/octet-stream',
    base64,
    tablegateId: state.activeTablegateId || undefined,
    channelId: scope.channelId,
    dmId: scope.dmId
  }), { rerender: false, success: `${file.name} attached.` });
  const id = result?.attachment?.id || result?.id;
  if (id) attachmentIds.push(id);
}

async function downloadAttachment(attachmentId) {
  const result = await run('download-attachment', () => api.request('downloadAttachment', { attachmentId }), { rerender: false });
  if (!result) return;
  const data = result.base64 || result.data || result.attachment?.base64;
  const mime = result.mimeType || result.attachment?.mimeType || 'application/octet-stream';
  const name = result.originalName || result.fileName || result.attachment?.originalName || 'attachment';
  if (!data) return toast('The backend did not return attachment bytes.', 'danger');
  const binary = atob(data);
  const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

async function handleAction(button, action) {
  const d = button.dataset;
  switch (action) {
    case 'auth-tab': state.authTab = d.tab || 'login'; state.authMessage = ''; if (!['verify','reset'].includes(state.authTab)) state.pendingAuthToken = ''; return emit('auth-tab');
    case 'toggle-password': {
      const input = document.getElementById(d.target);
      if (input) input.type = input.type === 'password' ? 'text' : 'password';
      return;
    }
    case 'resend-two-factor': {
      const email = state.pendingAuthEmail || button.dataset.email;
      if (!email) return toast('Enter your email address first.', 'danger');
      const result = await run('resend-two-factor', () => api.request('resendTwoFactor', { email }, {auth:false}), { rerender:false });
      if (result?.challengeId) state.pendingAuthToken = result.challengeId;
      state.authMessage = result ? 'A new two-factor code was sent.' : 'Error: A new two-factor code could not be requested.';
      emit('resend-two-factor');
      return;
    }
    case 'resend-verification': {
      const email = state.pendingAuthEmail;
      if (!email) return toast('Enter your email address first.', 'danger');
      const result = await run('resend-verification', () => api.request('requestEmailVerification', { email }, {auth:false}), { rerender:false });
      state.authMessage = result ? 'A new verification code was requested. Check your email.' : 'Error: A new verification code could not be requested.';
      emit('resend-verification');
      return;
    }
    case 'open-demo': {
      stopPolling();
      setMode('demo');
      setApiToken('demo_token');
      api = createApi();
      state.authenticated = true;
      state.authMessage = '';
      setView('profile');
      await hydrateSession();
      toast('Interface preview opened. Sample data stays in this browser.', 'info');
      return;
    }
    case 'follow-public-profile': {
      const result=await run('follow-profile',()=>api.request('followUser',{userId:d.userId}),{rerender:false,success:'Following this profile.'});
      if(result&&state.publicProfile?.user?.id===d.userId){state.publicProfile.relationship={...(state.publicProfile.relationship||{}),following:true};state.publicProfile.user.followerCount=Number(state.publicProfile.user.followerCount||0)+1;emit('follow-profile');}
      return;
    }
    case 'unfollow-public-profile': {
      const result=await run('unfollow-profile',()=>api.request('unfollowUser',{userId:d.userId}),{rerender:false,success:'Unfollowed.'});
      if(result&&state.publicProfile?.user?.id===d.userId){state.publicProfile.relationship={...(state.publicProfile.relationship||{}),following:false};state.publicProfile.user.followerCount=Math.max(0,Number(state.publicProfile.user.followerCount||0)-1);emit('unfollow-profile');}
      return;
    }
    case 'navigate': {
      const view = d.view || 'home';
      setView(view);
      if (view === 'discover' && !state.discover.items.length) await loadDiscover();
      if (view === 'finder' && !state.finder.items.length) await loadFinder();
      if (view === 'notifications') await refreshSideData();
      return;
    }
    case 'open-workspace-tool': state.workspaceTool = d.tool || ''; return emit('workspace-tool');
    case 'close-workspace-tool': state.workspaceTool = ''; return emit('workspace-tool-close');
    case 'toggle-nav': state.navOpen = !state.navOpen; state.detailOpen = false; return emit('toggle-nav');
    case 'toggle-detail': state.detailOpen = !state.detailOpen; state.navOpen = false; return emit('toggle-detail');
    case 'toggle-theme': {
      const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      setTheme(next);
      return;
    }
    case 'open-create-tablegate': return openModal(forms.createTablegate(), 'create-tablegate');
    case 'open-tablegate': return loadTablegate(d.tablegateId);
    case 'open-channel': state.activeChannelId = d.channelId; state.activeDmId = ''; state.messageSearchResults = null; state.replyTo = null; state.editingMessage = null; emit('open-channel'); return loadMessages();
    case 'open-dm': return loadDm(d.dmId);
    case 'join-tablegate': {
      const result = await run('join-tablegate', () => api.request('joinPublicTablegate', { tablegateId: d.tablegateId }), { success: 'Joined as a Visitor. Player abilities remain locked until approval.' });
      if (result) { await refreshTablegates(); await loadTablegate(d.tablegateId); }
      return;
    }
    case 'request-tablegate-join': { const tablegate = state.discover.items.find(item => item.id === d.tablegateId) || state.tablegates.find(item => item.id === d.tablegateId) || { id: d.tablegateId }; return openModal(forms.joinRequest(tablegate), 'join-request'); }
    case 'open-request-player': return openModal(forms.playerApplication(state.activeTablegate?.tablegate), 'player-request');
    case 'refresh-discover': return loadDiscover();
    case 'set-finder-view': state.finder.view = d.finderView || 'COMPATIBLE'; emit('finder-view'); return loadFinder();
    case 'open-create-finder-post': return openModal(forms.createFinderPost(state.tablegates, state.publicLocations), 'finder-post');
    case 'open-public-location': return openModal(forms.publicLocation(), 'public-location');
    case 'express-interest': {
      const post = state.finder.items.find(item => item.id === d.postId);
      return openModal(forms.interest(post), 'interest');
    }
    case 'hide-finder-post': {
      const result = await run('hide-post', () => api.request('hideDiscoveryItem', { postId: d.postId, itemType: 'GROUP_FINDER_POST' }), { success: 'Post hidden.' });
      if (result) { state.finder.items = state.finder.items.filter(item => item.id !== d.postId); emit('finder-hidden'); }
      return;
    }
    case 'open-finder-interests': {
      const result = await run('finder-interests', () => api.request('listGroupFinderInterests', { postId: d.postId }), { rerender: false });
      const items = normalizeList(result, 'interests');
      const body = items.length ? `<div class="command-results">${items.map(item => `<article class="card card-pad"><strong>${escapeHtml(item.user?.username || item.userId || 'Applicant')}</strong><p>${escapeHtml(item.message || '')}</p><div class="form-actions"><button class="btn" data-action="respond-finder-interest" data-interest-id="${escapeAttr(item.id)}" data-accept="false">Decline</button><button class="btn success" data-action="respond-finder-interest" data-interest-id="${escapeAttr(item.id)}" data-accept="true">Accept to lobby</button></div></article>`).join('')}</div>` : '<p class="helper">No Interests yet.</p>';
      return openModal(modalTemplate('Group Finder Interests', 'Acceptance opens a controlled pre-game lobby.', body, '', true), 'finder-interests');
    }
    case 'respond-finder-interest': {
      const result = await run('respond-interest', () => api.request('respondGroupFinderInterest', { interestId: d.interestId, accept: d.accept === 'true', status: d.accept === 'true' ? 'ACCEPTED' : 'DECLINED' }), { success: d.accept === 'true' ? 'Interest accepted to the pre-game lobby.' : 'Interest declined.' });
      if (result) closeModal();
      return;
    }
    case 'open-new-dm': modalMode = 'dm'; return openModal(forms.newDm([]), 'dm');
    case 'open-new-friend': modalMode = 'friend'; return openModal(forms.friend([]), 'friend');
    case 'create-dm-user': {
      const result = await run('create-dm', () => api.request('createDm', { recipientId: d.userId, userId: d.userId }), { success: 'Direct message opened.' });
      if (!result) return;
      closeModal();
      state.dms = normalizeList(await api.request('listDms'), 'dms');
      const dm = result.dm || result;
      if (dm.id) await loadDm(dm.id);
      return;
    }
    case 'send-friend-user': {
      const result = await run('friend-request', () => api.request('sendFriendRequest', { userId: d.userId }), { success: 'Friend request sent.' });
      if (result) { closeModal(); state.friends = normalizeList(await api.request('listFriends'), 'friends'); emit('friends'); }
      return;
    }
    case 'accept-friend': await run('accept-friend', () => api.request('acceptFriend', { friendshipId: d.friendshipId }), { success: 'Friend request accepted.' }); return refreshSideData();
    case 'decline-friend': await run('decline-friend', () => api.request('declineFriend', { friendshipId: d.friendshipId }), { success: 'Friend request declined.' }); return refreshSideData();
    case 'block-user': {
      const result = await run('block-user', () => api.request('blockUser', { userId: d.userId }), { success: 'User blocked. Direct contact and discovery visibility were severed; evidence was preserved.' });
      if (result) { closeModal(); state.safetyRelations = normalizeList(await api.request('listSafety'), 'relations'); emit('blocked'); }
      return;
    }
    case 'unblock-user': {
      const result = await run('unblock-user', () => api.request('unblockUser', { userId: d.userId }), { success: 'Block removed.' });
      if (result) { state.safetyRelations = normalizeList(await api.request('listSafety'), 'relations'); emit('unblocked'); }
      return;
    }
    case 'open-anonymous-safety-report': return openModal(forms.anonymousSafetyReport(), 'anonymous-safety-report');
    case 'open-new-incident-journal': return openModal(forms.incidentJournal(), 'incident-journal');
    case 'refresh-safety-center': {
      const [reports,journals,relations]=await Promise.allSettled([api.request('listMySafetyReports'),api.request('listIncidentJournals'),api.request('listSafety')]);
      state.safetyReports=reports.status==='fulfilled'?normalizeList(reports.value,'reports'):[];
      state.safetyJournals=journals.status==='fulfilled'?normalizeList(journals.value,'journals'):[];
      state.safetyRelations=relations.status==='fulfilled'?normalizeList(relations.value,'relations'):[];
      return emit('safety-refresh');
    }
    case 'open-incident-journal': {
      const result=await run('incident-journal-open',()=>api.request('getIncidentJournal',{journalId:d.journalId}),{rerender:false});
      const journal=result?.journal||result;
      if(journal && Array.isArray(result?.entries)) journal.entries=result.entries;
      if(journal) return openModal(modalTemplate(journal.title||'Private incident journal','Visible only to you and authorized central safety staff after submission.',`<div class="command-results">${array(journal.entries).map(e=>`<article class="card card-pad"><strong>${escapeHtml(formatDateTime(e.occurredAt||e.createdAt))}</strong><p>${escapeHtml(e.narrative||e.details||'')}</p><div class="helper">${escapeHtml(array(e.people).join(', '))}</div></article>`).join('')||'<p class="helper">No entries yet.</p>'}`,`<button class="btn" data-action="add-incident-entry" data-journal-id="${escapeAttr(journal.id)}">Add entry</button>`,true),'incident-journal-view');
      return;
    }
    case 'add-incident-entry': {
      let journal=state.safetyJournals.find(j=>j.id===d.journalId);
      if(!journal){const result=await api.request('getIncidentJournal',{journalId:d.journalId});journal=result?.journal||result;}
      return openModal(forms.incidentEntry(journal),'incident-entry');
    }
    case 'export-incident-journal': {
      const result=await run('incident-export',()=>api.request('exportIncidentJournal',{journalId:d.journalId,redacted:true}),{success:'Redacted incident timeline prepared.',rerender:false});
      if(result) downloadJson(`tablegate-incident-${d.journalId}-redacted.json`,result);
      return;
    }
    case 'convert-incident-journal': {
      const result=await run('incident-convert',()=>api.request('convertIncidentJournalToReport',{journalId:d.journalId}),{success:'Incident journal converted to a central safety report.'});
      if(result){state.safetyReports=normalizeList(await api.request('listMySafetyReports'),'reports');state.safetyJournals=normalizeList(await api.request('listIncidentJournals'),'journals');emit('incident-converted');}
      return;
    }
    case 'open-safety-report': return openModal(forms.safetyReport({ objectType: d.objectType, objectId: d.objectId, userId: d.userId }), 'safety-report');
    case 'load-safety-reports': {
      const result = await run('safety-reports', () => api.request('listMySafetyReports'), { success: 'Safety reports refreshed.' });
      state.safetyReports = normalizeList(result, 'reports');
      state.view = 'safety';
      return emit('safety-reports');
    }
    case 'open-join-requests': {
      const result = await run('join-requests', () => api.request('listTablegateJoinRequests', { tablegateId: state.activeTablegateId, status: 'PENDING' }), { rerender: false });
      return openModal(customJoinRequestsModal(normalizeList(result, 'requests')), 'join-requests');
    }
    case 'respond-join-request': {
      const accepted = d.accept === 'true';
      const result = await run('respond-join-request', () => api.request('respondTablegateJoinRequest', { requestId: d.requestId, accept: accepted, status: accepted ? 'APPROVED' : 'DECLINED' }), { success: accepted ? 'Membership approved as Visitor.' : 'Membership request declined.' });
      if (result) { closeModal(); await loadTablegate(state.activeTablegateId, { navigate: true }); }
      return;
    }
    case 'open-player-applications': {
      const result = await run('player-applications', () => api.request('listPlayerApplications', { tablegateId: state.activeTablegateId, status: 'PENDING' }), { rerender: false });
      return openModal(forms.applications(normalizeList(result, 'applications')), 'applications');
    }
    case 'respond-player-application': {
      const accepted = d.accept === 'true';
      const result = await run('respond-player', () => api.request('respondPlayerApplication', { applicationId: d.applicationId, accept: accepted, status: accepted ? 'APPROVED' : 'DECLINED' }), { success: accepted ? 'Visitor approved as Player.' : 'Player application declined.' });
      if (result) { closeModal(); await loadTablegate(state.activeTablegateId, { navigate: true }); }
      return;
    }
    case 'approve-player-direct': {
      const result = await run('approve-player', () => api.request('approvePlayer', { tablegateId: state.activeTablegateId, userId: d.userId }), { success: 'Visitor approved as Player.' });
      if (result) { closeModal(); await loadTablegate(state.activeTablegateId, { navigate: true }); }
      return;
    }
    case 'revoke-player-direct': {
      const result = await run('revoke-player', () => api.request('revokePlayer', { tablegateId: state.activeTablegateId, userId: d.userId }), { success: 'Player returned to Visitor access.' });
      if (result) { closeModal(); await loadTablegate(state.activeTablegateId, { navigate: true }); }
      return;
    }
    case 'open-tablegate-settings': return openModal(customTablegateSettingsModal(), 'tablegate-settings');
    case 'create-tablegate-invite': {
      const result = await run('create-invite', () => api.request('createInvite', { tablegateId: state.activeTablegateId, expiresInHours: 168, maxUses: 0 }), { rerender: false });
      const code = result?.invite?.code || result?.code;
      if (code) {
        const url = invitationText(code);
        const target = $('#inviteResult', roots.modal);
        if (target) target.innerHTML = `<div class="notice success"><strong>Invite:</strong> <code>${escapeHtml(url)}</code><br><button class="btn small" data-action="copy-value" data-value="${escapeAttr(url)}">Copy link</button></div>`;
      }
      return;
    }
    case 'copy-value': await navigator.clipboard?.writeText(d.value || ''); toast('Copied.', 'success'); return;
    case 'open-create-channel': return openModal(customCreateChannelModal(d.categoryId), 'create-channel');
    case 'open-member': {
      const member = state.activeTablegate?.members?.find(item => item.userId === d.userId);
      if (member) openModal(customMemberModal(member), 'member');
      return;
    }
    case 'kick-member': return openModal(forms.confirm('Remove member', 'Remove this user from the TableGate? Their central safety reports and blocks are unaffected.', 'confirm-kick-member', `data-user-id="${escapeAttr(d.userId)}"`), 'confirm');
    case 'confirm-kick-member': {
      const result = await run('kick-member', () => api.request('kickMember', { tablegateId: state.activeTablegateId, userId: d.userId, reason: 'Removed by authorized group moderator.' }), { success: 'Member removed.' });
      if (result) { closeModal(); await loadTablegate(state.activeTablegateId, { navigate: true }); }
      return;
    }
    case 'ban-member': return openModal(forms.confirm('Ban member', 'Ban this user from this TableGate? Central Trust and Safety remains separate from local bans.', 'confirm-ban-member', `data-user-id="${escapeAttr(d.userId)}"`), 'confirm');
    case 'confirm-ban-member': {
      const result = await run('ban-member', () => api.request('banMember', { tablegateId: state.activeTablegateId, userId: d.userId, reason: 'Banned by authorized group moderator.' }), { success: 'Member banned from this TableGate.' });
      if (result) { closeModal(); await loadTablegate(state.activeTablegateId, { navigate: true }); }
      return;
    }
    case 'reply-message': state.replyTo = state.messages.find(message => message.id === d.messageId) || null; state.editingMessage = null; return emit('reply-message');
    case 'edit-message': state.editingMessage = state.messages.find(message => message.id === d.messageId) || null; state.replyTo = null; return emit('edit-message');
    case 'cancel-composer-state': state.replyTo = null; state.editingMessage = null; attachmentIds = []; return emit('cancel-composer');
    case 'delete-message': return openModal(forms.confirm('Delete message', 'Delete this message? The backend may retain an evidence copy when required by safety or legal policy.', 'confirm-delete-message', `data-message-id="${escapeAttr(d.messageId)}"`), 'confirm');
    case 'confirm-delete-message': {
      const result = await run('delete-message', () => api.request('deleteMessage', { messageId: d.messageId }), { success: 'Message deleted.' });
      if (result) { closeModal(); await loadMessages({ quiet: true }); }
      return;
    }
    case 'quick-react': {
      const emojis = ['👍', '🎲', '✨', '❤️', '😂', '👀'];
      const body = `<div class="reaction-picker">${emojis.map(emoji => `<button class="btn" data-action="add-reaction" data-message-id="${escapeAttr(d.messageId)}" data-emoji="${escapeAttr(emoji)}">${emoji}</button>`).join('')}</div>`;
      return openModal(modalTemplate('React', '', body), 'reaction');
    }
    case 'add-reaction': {
      const result = await run('reaction', () => api.request('addReaction', { messageId: d.messageId, emoji: d.emoji }), { rerender: false });
      if (result) { closeModal(); await loadMessages({ quiet: true }); }
      return;
    }
    case 'toggle-reaction': {
      const actionName = d.own === 'true' ? 'removeReaction' : 'addReaction';
      const result = await run('reaction', () => api.request(actionName, { messageId: d.messageId, emoji: d.emoji }), { rerender: false });
      if (result) await loadMessages({ quiet: true });
      return;
    }
    case 'jump-message': {
      closeModal();
      state.messageSearchResults = null;
      emit('jump-message');
      requestAnimationFrame(() => document.querySelector(`[data-message-id="${CSS.escape(d.messageId)}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
      return;
    }
    case 'choose-attachment': return chooseAttachment();
    case 'download-attachment': return downloadAttachment(d.attachmentId);
    case 'mark-notifications-read': {
      const ids = state.notifications.filter(item => !item.readAt).map(item => item.id);
      if (!ids.length) return;
      const result = await run('notifications-read', () => api.request('markNotificationRead', { notificationIds: ids }), { success: 'Notifications marked read.' });
      if (result) return refreshSideData();
      return;
    }
    case 'open-notification': {
      await run('notification-read', () => api.request('markNotificationRead', { notificationId: d.notificationId }), { quiet: true });
      return refreshSideData();
    }
    case 'open-voice-room': {
      const channel = state.activeTablegate?.channels?.find(item => item.id === state.activeChannelId);
      return openModal(customVoiceModal(channel), 'voice');
    }
    case 'test-connection': return testConnection();
    case 'reset-demo': {
      localStorage.removeItem(CONFIG.STORAGE_KEYS.DEMO_STATE);
      api = new DemoApi();
      toast('Preview data reset.', 'success');
      return hydrateSession();
    }
    case 'export-shell-state': return downloadJson('tablegate-shell-state.json', state);
    case 'close-modal': return closeModal();
    case 'leave-tablegate': return openModal(forms.confirm('Leave TableGate', 'Leave this TableGate? Any active safety report remains available and is not deleted.', 'confirm-leave-tablegate'), 'confirm');
    case 'confirm-leave-tablegate': {
      const tablegateId = state.activeTablegateId;
      const result = await run('leave-tablegate', () => api.request('leaveTablegate', { tablegateId }), { success: 'You left the TableGate.' });
      if (result) {
        closeModal();
        setActiveTablegate('');
        state.activeTablegate = null;
        state.activeChannelId = '';
        state.messages = [];
        state.view = 'home';
        await refreshTablegates();
      }
      return;
    }
    case 'logout': {
      await run('logout', () => api.request('logout'), { quiet: true, rerender: false });
      stopPolling();
      setApiToken('');
      setMode('backend');
      api = createApi();
      state.authenticated = false;
      state.me = null;
      state.activeTablegate = null;
      state.activeTablegateId = '';
      state.activeChannelId = '';
      state.activeDmId = '';
      state.messages = [];
      state.authMessage = '';
      emit('logout');
      return;
    }
    default: console.debug('Unhandled TableGate action:', action, d);
  }
}

document.addEventListener('submit', event => {
  const form = event.target.closest('form[data-form]');
  if (!form) return;
  event.preventDefault();
  handleForm(form);
});

document.addEventListener('click', event => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  event.preventDefault();
  handleAction(button, button.dataset.action);
});

document.addEventListener('input', event => {
  if (event.target.closest('[data-form="message-composer"]') && event.target.name === 'content') typingSignal();
});

document.addEventListener('change', event => {
  if (event.target.id === 'attachmentInput') uploadAttachment(event.target.files?.[0]);
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    if (!roots.modal.hidden) return closeModal();
    if (state.replyTo || state.editingMessage) {
      state.replyTo = null;
      state.editingMessage = null;
      attachmentIds = [];
      emit('escape-composer');
    }
  }
  const composer = event.target.closest('[data-form="message-composer"] textarea');
  if (composer && event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendComposerMessage(composer.value);
  }
});

roots.backdrop.addEventListener('click', () => {
  state.navOpen = false;
  state.detailOpen = false;
  emit('close-drawers');
});

window.addEventListener('online', () => { state.connection = 'checking'; emit('online'); testConnection({ quiet: true }); });
window.addEventListener('offline', () => { state.connection = 'offline'; emit('offline'); });
document.addEventListener('visibilitychange', () => { if (!document.hidden && state.authenticated) pollEvents(); });
window.addEventListener('beforeunload', () => {
  if (state.authenticated) api.request('setPresence', { status: 'OFFLINE', lastSeenAt: new Date().toISOString() }).catch(() => {});
});

window.addEventListener('message', async event => {
  const frame = roots.main.querySelector('#tablegateProfileFrame');
  if (!frame || event.source !== frame.contentWindow) return;
  const message=event.data||{};
  if(message.type==='tablegate-profile-ready'){
    const profileUserId=String(state.me?.id||state.me?.email||state.me?.username||'local');
    frame.contentWindow?.postMessage({type:'tablegate-profile-context',state:state.profileTemplateState,account:{name:state.me?.displayName||state.me?.username||'TableGate User',handle:'@'+String(state.me?.username||'tablegate-user').replace(/^@/,''),userId:profileUserId,bio:state.me?.bio||'',status:state.me?.customStatus||''},friends:state.friends.map(item=>item.otherUser||item.user||item).filter(Boolean)},'*');
    return;
  }
  if(message.type==='tablegate-profile-saved' && message.state){state.profileTemplateState=message.state;saveProfileToBackend(message.state);return;}
  if(message.type==='tablegate:profile:request-friends'){frame.contentWindow?.postMessage({type:'tablegate-profile-friends',friends:state.friends.map(item=>item.otherUser||item.user||item).filter(Boolean)},'*');return;}
  if(message.type!=='tablegate:profile-bridge') return;
  const {view,action}=message;
  if(view){setView(view);if(view==='discover'&&!state.discover.items.length)await loadDiscover();if(view==='finder'&&!state.finder.items.length)await loadFinder();if(view==='notifications')await refreshSideData();return;}
  if(action==='open-create-tablegate') openModal(forms.createTablegate(),'create-tablegate');
});

async function processAuthFromUrl() {
  if (state.mode === 'demo') return false;
  const params = new URLSearchParams(location.search);
  const authAction = params.get('authAction');
  if (!authAction) return false;
  const email = params.get('email') || '';
  const token = params.get('token') || '';
  state.pendingAuthEmail = email;
  state.pendingAuthToken = token;
  try {
    if (authAction === 'verifyEmail' && email && token) {
      const result = await api.request('verifyEmail', { email, token, userAgent:navigator.userAgent }, {auth:false});
      setApiToken(result.token || result.sessionToken || '');
      state.authenticated = true;
      state.me = result.user;
      state.authMessage = '';
      setView('profile');
      await hydrateSession();
    } else if (authAction === 'resetPassword') {
      state.authTab = 'reset';
      state.authMessage = 'Choose a new password to finish the reset.';
      emit('reset-link');
    } else {
      state.authTab = authAction === 'verifyEmail' ? 'verify' : 'login';
    }
  } catch (error) {
    state.authenticated = false;
    state.authTab = authAction === 'resetPassword' ? 'reset' : 'verify';
    state.authMessage = `Error: ${error?.message || 'This email link could not be completed.'}`;
    emit('auth-link-error');
  }
  try {
    const clean = new URL(location.href);
    clean.searchParams.delete('authAction'); clean.searchParams.delete('email'); clean.searchParams.delete('token');
    history.replaceState({}, '', clean.pathname + (clean.search ? clean.search : '') + clean.hash);
  } catch {}
  return true;
}

async function processPublicProfileFromUrl() {
  const params=new URLSearchParams(location.search); let slug=params.get('profile')||'';
  if(!slug){const path=location.pathname.split('/').filter(Boolean);const last=path[path.length-1]||'';if(last&&!/^(tablegate(?:\.html)?|index(?:\.html)?)$/i.test(last)&&!/[.]/.test(last))slug=decodeURIComponent(last);}
  if(!slug) return false;
  if(!state.authenticated){state.authMessage='Sign in to view this TableGate profile.';state.authTab='login';emit('public-profile-login-required');return false;}
  const result=await run('public-profile',()=>api.request('getUserProfile',{slug}),{rerender:false});
  if(!result) return false;
  state.publicProfile=result; state.publicProfileFollowers=normalizeList(await api.request('listFollowers',{userId:result.user.id})); state.publicProfileFollowing=normalizeList(await api.request('listFollowing',{userId:result.user.id})); setView('public-profile');
  return true;
}

async function processInviteFromUrl() {
  const inviteCode = new URLSearchParams(location.search).get('invite');
  if (!inviteCode) return;
  try {
    const preview = await api.request('previewInvite', { inviteCode, code: inviteCode });
    const name = preview?.tablegate?.name || preview?.name || 'this TableGate';
    if (!state.authenticated) {
      state.authMessage = `Invite ready for ${name}. Sign in or register to join.`;
      state.authTab = 'login';
      emit('invite-preview');
      return;
    }
    openModal(modalTemplate('Join by invite', `Invitation to ${name}`, `<p>This invite adds you under the TableGate’s configured join rules. Visitor/Player separation and all safety controls still apply.</p>`, `<button class="btn" data-action="close-modal">Cancel</button><button class="btn primary" data-action="confirm-join-invite" data-invite-code="${escapeAttr(inviteCode)}">Join</button>`), 'invite');
  } catch (error) {
    toast('This invitation could not be previewed.', 'danger');
  }
}

// Late-bound invite action kept separate so shared links remain a small, auditable flow.
const originalHandleAction = handleAction;
handleAction = async function patchedHandleAction(button, action) {
  if (action === 'confirm-join-invite') {
    const result = await run('join-invite', () => api.request('joinInvite', { inviteCode: button.dataset.inviteCode, code: button.dataset.inviteCode }), { success: 'Joined through invite.' });
    if (result) {
      closeModal();
      history.replaceState({}, '', location.pathname + location.hash);
      await refreshTablegates();
      const tablegateId = result.tablegateId || result.tablegate?.id;
      if (tablegateId) await loadTablegate(tablegateId);
    }
    return;
  }
  return originalHandleAction(button, action);
};

async function bootstrap() {
  setDocumentTheme(state.theme);
  render('bootstrap');
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('./service-worker.js').catch(error => console.warn('Service worker registration failed:', error));
  }

  if (state.mode === 'demo') api = new DemoApi();
  else api = new TableGateApi({ token: state.token, url: CONFIG.BACKEND_URL });

  await testConnection({ quiet: true });
  await processAuthFromUrl();
  if (state.token && !state.authenticated) {
    state.authenticated = true;
    await hydrateSession();
  }
  await processPublicProfileFromUrl();
  await processInviteFromUrl();
  bootstrapComplete = true;
  render('bootstrap-complete');
}

bootstrap();
