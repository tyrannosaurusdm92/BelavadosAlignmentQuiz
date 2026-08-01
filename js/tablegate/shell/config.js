export const CONFIG = Object.freeze({
  APP_NAME: 'TableGate',
  VERSION: '9.0.0-unified-rebuild',
  API_VERSION: '8.0.0-final',
  BACKEND_URL: 'https://script.google.com/macros/s/AKfycbyqw2pg_-I8i8jP-nIVq4ATC_bw0fRNFi_yhM044TnbRtbuiEt98Btg1Q0ZnQRsIpItag/exec',
  BACKEND_LIBRARY_ID: '18ET55A9uVNx3IUzoAM_eRj8v7jqagPgjVdxil3P1SoUqrFnnAJp6CjVr',
  BACKEND_LIBRARY_VERSION: '10',
  CREDIT: 'Created By William Saville AKA The Transgender T-Rex #TheTransgenderTrex · developer of Belavadös Galaxy TTRPG System',
  REQUEST_TIMEOUT_MS: 30000,
  EVENT_POLL_MS: 4500,
  TYPING_THROTTLE_MS: 4500,
  MESSAGE_PAGE_SIZE: 50,
  STORAGE_KEYS: {
    TOKEN: 'tablegate.session.token',
    MODE: 'tablegate.shell.mode',
    THEME: 'tablegate.shell.theme',
    LAST_VIEW: 'tablegate.shell.lastView',
    LAST_TABLEGATE: 'tablegate.shell.lastTablegate',
    DEMO_STATE: 'tablegate.shell.demoState',
    CUSTOM_SYSTEMS: 'tablegate.customSystems'
  }
});

export const PERMISSIONS = Object.freeze({
  ADMIN: 1,
  MANAGE_TABLEGATE: 2,
  MANAGE_CHANNELS: 4,
  MANAGE_MESSAGES: 8,
  KICK_MEMBERS: 16,
  BAN_MEMBERS: 32,
  SEND_MESSAGES: 64,
  READ_MESSAGES: 128,
  CONNECT_VOICE: 256,
  SPEAK: 512,
  CREATE_INVITE: 1024,
  MANAGE_ROLES: 2048,
  ATTACH_FILES: 4096,
  MENTION_EVERYONE: 8192,
  MANAGE_NICKNAMES: 16384,
  VIEW_AUDIT_LOG: 32768,
  STREAM: 65536,
  USE_PERSONAS: 131072,
  ROLL_DICE: 262144,
  MANAGE_HANDOUTS: 524288,
  MANAGE_SYSTEMS: 1048576,
  MANAGE_CHARACTERS: 2097152,
  USE_MECHANICS: 4194304,
  ALL: 8388607
});

export const VISITOR_PERMISSIONS =
  PERMISSIONS.READ_MESSAGES |
  PERMISSIONS.CONNECT_VOICE;

export const PLAYER_PERMISSIONS =
  PERMISSIONS.SEND_MESSAGES |
  PERMISSIONS.READ_MESSAGES |
  PERMISSIONS.CONNECT_VOICE |
  PERMISSIONS.SPEAK |
  PERMISSIONS.ATTACH_FILES |
  PERMISSIONS.STREAM |
  PERMISSIONS.USE_PERSONAS |
  PERMISSIONS.ROLL_DICE |
  PERMISSIONS.USE_MECHANICS;

export const MODERATOR_PERMISSIONS =
  PLAYER_PERMISSIONS |
  PERMISSIONS.MANAGE_CHANNELS |
  PERMISSIONS.MANAGE_MESSAGES |
  PERMISSIONS.KICK_MEMBERS |
  PERMISSIONS.BAN_MEMBERS |
  PERMISSIONS.CREATE_INVITE |
  PERMISSIONS.MANAGE_NICKNAMES |
  PERMISSIONS.VIEW_AUDIT_LOG |
  PERMISSIONS.MANAGE_HANDOUTS |
  PERMISSIONS.MANAGE_SYSTEMS |
  PERMISSIONS.MANAGE_CHARACTERS;

export const ROLE_ORDER = Object.freeze(['OWNER', 'ADMIN', 'MODERATOR', 'PLAYER', 'VISITOR']);
export const FINDER_VIEWS = Object.freeze(['NEWEST', 'COMPATIBLE', 'RIGHT_NOW', 'LOCAL_EVENTS', 'MY_ACTIVITY']);
export const HOST_TITLES = Object.freeze([
  ['DM','DM / Dungeon Master'],['DUNGEON_MASTER','Dungeon Master'],['GM','GM / Game Master'],['GAME_MASTER','Game Master'],['MOL','MOL'],['MASTER_OF_LORE','Master Of Lore'],
  ['KEEPER','Keeper'],['STORYTELLER','Storyteller'],['REFEREE','Referee'],['FACILITATOR','Facilitator'],
  ['HOST','Host'],['NARRATOR','Narrator'],['DIRECTOR','Director'],['JUDGE','Judge'],['MARSHAL','Marshal'],
  ['LOREKEEPER','Lorekeeper'],['CHRONICLER','Chronicler'],['GAME_MODERATOR','Game Moderator'],['OTHER','Custom write-in']
]);
export const FINDER_ROLES = Object.freeze(['PLAYER', ...HOST_TITLES.map(([id]) => id)]);
export const SYSTEMS = Object.freeze([
  ['sys_tablegate_generic','System-Agnostic / Custom'],
  ['sys_dnd_5e_55e','Dungeons & Dragons 5e / 2024'],
  ['sys_pf2e_remaster','Pathfinder 2e Remastered'],
  ['sys_fate_core','Fate Core'],
  ['sys_gurps_4e','GURPS 4e'],
  ['sys_coc_7e','Call of Cthulhu 7e'],
  ['sys_daggerheart','Daggerheart'],
  ['sys_pbta','Powered by the Apocalypse'],
  ['sys_swade','Savage Worlds Adventure Edition'],
  ['sys_fitd_blades','Blades in the Dark / Forged in the Dark']
]);
export function getConfiguredSystems() {
  let custom = [];
  try { custom = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.CUSTOM_SYSTEMS) || '[]'); } catch {}
  const normalized = (Array.isArray(custom) ? custom : []).map(item => Array.isArray(item) ? item : [item.id || item.systemId, item.name || item.label]).filter(item => item[0] && item[1]);
  const merged = new Map(SYSTEMS.map(item => [item[0], item]));
  normalized.forEach(item => merged.set(item[0], item));
  return [...merged.values()];
}
export function getSystemName(id) { return getConfiguredSystems().find(([key]) => key === id)?.[1] || id || 'System-Agnostic'; }


export const FREE_PROMISE = Object.freeze([
  'No subscriptions, premium tiers, paid boosts, or paid ranking.',
  'No charge to create, join, own, moderate, search, message, block, or report.',
  'Safety, accessibility, privacy, matching filters, and age controls are never paywalled.',
  'TableGate does not sell precise location, safety-report, minor, disability, identity, or behavioral data.'
]);
