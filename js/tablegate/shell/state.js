import { CONFIG } from './config.js';

function storageGet(key, fallback = '') { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } }
function modeGet(fallback='backend') { try { return sessionStorage.getItem(CONFIG.STORAGE_KEYS.MODE) ?? 'backend'; } catch { return fallback; } }
function modeSet(value) { try { if (value === 'demo') sessionStorage.setItem(CONFIG.STORAGE_KEYS.MODE, value); else sessionStorage.removeItem(CONFIG.STORAGE_KEYS.MODE); } catch {} }
function storageSet(key, value) { try { localStorage.setItem(key, value); } catch {} }
function storageRemove(key) { try { localStorage.removeItem(key); } catch {} }

export const state = {
  mode: modeGet('backend'),
  token: storageGet(CONFIG.STORAGE_KEYS.TOKEN, ''),
  theme: storageGet(CONFIG.STORAGE_KEYS.THEME, 'dark'),
  authenticated: false,
  loading: false,
  connection: 'checking',
  me: null,
  view: storageGet(CONFIG.STORAGE_KEYS.LAST_VIEW, 'profile'),
  tablegates: [],
  discover: {items:[],total:0,query:'',loading:false},
  finder: {
    items:[], total:0, view:'COMPATIBLE', query:'', playMode:'', systemIds:[], roles:[], loading:false,
    events:[], venues:[], interests:[]
  },
  activeTablegateId: storageGet(CONFIG.STORAGE_KEYS.LAST_TABLEGATE, ''),
  activeTablegate: null,
  activeChannelId: '',
  activeDmId: '',
  messages: [],
  messageSearchResults: null,
  messageHasMore: false,
  messageCursor: '',
  dms: [],
  friends: [],
  notifications: [],
  safetyRelations: [],
  safetyReports: [],
  safetyJournals: [],
  activeIncidentJournal: null,
  profileTemplateState: null,
  profileSyncRevision: 0,
  profileSyncLoaded: false,
  publicProfile: null,
  publicProfileFollowers: [],
  publicProfileFollowing: [],
  publicLocations: [],
  typing: [],
  replyTo: null,
  editingMessage: null,
  membersOpen: false,
  navOpen: false,
  detailOpen: false,
  eventCursor: new Date(Date.now() - 60_000).toISOString(),
  unreadCounts: {},
  authTab: 'login',
  authMessage: '',
  pendingAuthEmail: '',
  pendingAuthToken: '',
  commandOpen: false,
  commandResults: []
};

const listeners = new Set();
export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
export function emit(reason = '') { listeners.forEach(fn => fn(state, reason)); }
export function patch(next, reason = '') { Object.assign(state, next); emit(reason); }
export function setMode(mode) { state.mode = mode === 'demo' ? 'demo' : 'backend'; modeSet(state.mode); emit('mode'); }
export function setToken(token) { state.token = token || ''; if (token) storageSet(CONFIG.STORAGE_KEYS.TOKEN, token); else storageRemove(CONFIG.STORAGE_KEYS.TOKEN); emit('token'); }
export function setTheme(theme) { state.theme = theme; storageSet(CONFIG.STORAGE_KEYS.THEME, theme); emit('theme'); }
export function setView(view) { state.view = view; storageSet(CONFIG.STORAGE_KEYS.LAST_VIEW, view); state.navOpen = false; emit('view'); }
export function setActiveTablegate(id) { state.activeTablegateId = id || ''; if (id) storageSet(CONFIG.STORAGE_KEYS.LAST_TABLEGATE, id); else storageRemove(CONFIG.STORAGE_KEYS.LAST_TABLEGATE); emit('active-tablegate'); }
