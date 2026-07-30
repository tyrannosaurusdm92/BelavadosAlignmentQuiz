/**
 * TTRPG Messenger Backend — Google Apps Script (single-file deployment)
 * File name: ttrpgmessenger.gs
 * Configured web app: https://script.google.com/macros/s/AKfycbylmceRVx5UcgMvMDkwym_9h0wv8gM5B9Msuui7-7Z6lqoYlqZBR6Y47hmsauQgoGXY/exec
 * Apps Script library: 18ET55A9uVNx3IUzoAM_eRj8v7jqagPgjVdxil3P1SoUqrFnnAJp6CjVr (version 5)
 *
 * MERGED FEATURE SET
 * - Invite-only campaign servers with creator, moderator, and player roles
 * - Text, announcement, handout, voice, and video channels grouped by category
 * - Server/channel/member/role/invite management and audit logging
 * - Channel chat, DMs, group DMs, replies, edits, soft-delete, purge, pins,
 *   reactions, attachments, mentions, search, typing, unread/read markers
 * - Friends, blocks, ignores, profiles, presence, notifications
 * - Voice state, DM calls, WebRTC offer/answer/ICE signaling, screen-share state,
 *   push-to-talk state, and whisper signaling
 * - TTRPG character personas and auditable server-side dice rolls
 * - Shared TableGate character/profile snapshots for the nine embedded systems
 * - Shared 3D session rolling policy with creator/admin-only private DM rolls
 * - Polling event gateway as an Apps Script-compatible Socket.io fallback
 *
 * IMPORTANT VOICE NOTE
 * Apps Script cannot host WebSockets or relay live audio/video media. The browser
 * frontend must use RTCPeerConnection. This backend authorizes rooms, lists peers,
 * and exchanges WebRTC signals through sendRtcSignal/pollRtcSignals or pollEvents.
 * For reliable connections across strict NAT/firewalls, set RTC_ICE_SERVERS_JSON
 * to include a TURN server. The default contains public STUN only.
 *
 * FIRST-TIME SETUP
 * 1. Create a standalone Apps Script project.
 * 2. Paste this entire file into ttrpgmessenger.gs.
 * 3. Run setupTtrpgMessenger() once from the editor and authorize it.
 * 4. Deploy > New deployment > Web app.
 * 5. Execute as: Me. Who has access: Anyone.
 * 6. The frontend should POST JSON as text/plain;charset=utf-8 to avoid a browser
 *    CORS preflight that Apps Script web apps cannot customize.
 *
 * REQUEST EXAMPLE
 * fetch(WEB_APP_URL, {
 *   method: 'POST',
 *   headers: {'Content-Type': 'text/plain;charset=utf-8'},
 *   body: JSON.stringify({action:'login', email:'...', password:'...'})
 * }).then(r => r.json())
 *
 * Authenticated requests include the returned session token in the JSON body:
 * {action:'listServers', token:'...'}
 *
 * All responses use HTTP 200 with {ok:true,data:...} or
 * {ok:false,error:{code,message,details}} because ContentService cannot reliably
 * set custom HTTP status codes.
 */

var TTRPG = Object.freeze({
  API_VERSION: '2.2.0',
  SCHEMA_VERSION: '2026-07-28.6',
  DB_PROPERTY: 'TTRPG_DB_ID',
  UPLOAD_FOLDER_PROPERTY: 'TTRPG_UPLOAD_FOLDER_ID',
  PEPPER_PROPERTY: 'TTRPG_PASSWORD_PEPPER',
  REGISTRATION_MODE_PROPERTY: 'TTRPG_REGISTRATION_MODE',
  SESSION_DAYS_PROPERTY: 'TTRPG_SESSION_DAYS',
  MAX_UPLOAD_PROPERTY: 'TTRPG_MAX_UPLOAD_BYTES',
  RTC_ICE_PROPERTY: 'RTC_ICE_SERVERS_JSON',
  DEFAULT_SESSION_DAYS: 30,
  DEFAULT_MAX_UPLOAD_BYTES: 5 * 1024 * 1024,
  PASSWORD_ROUNDS: 6000,
  EVENT_TTL_HOURS: 72,
  SIGNAL_TTL_MINUTES: 10,
  TYPING_TTL_SECONDS: 12,
  MAX_MESSAGE_LENGTH: 8000,
  MAX_TOPIC_LENGTH: 1024,
  MAX_RESULTS: 100,
  DEFAULT_PAGE_SIZE: 50,
  REGISTRATION_MODES: ['OPEN', 'INVITE_ONLY', 'INVITE_OR_FIRST_USER', 'CLOSED'],
  CHANNEL_TYPES: ['TEXT', 'ANNOUNCEMENT', 'HANDOUTS', 'VOICE', 'VIDEO'],
  MESSAGE_TYPES: ['CHAT', 'IN_CHARACTER', 'OUT_OF_CHARACTER', 'SYSTEM', 'ROLL', 'HANDOUT'],
  PRESENCE_STATUSES: ['ONLINE', 'IDLE', 'DND', 'OFFLINE'],
  RTC_ROOM_TYPES: ['VOICE', 'DM_CALL', 'WHISPER'],
  RTC_SIGNAL_TYPES: [
    'OFFER', 'ANSWER', 'ICE', 'RENEGOTIATE', 'HANGUP',
    'MEDIA_STATE', 'SCREEN_SHARE_START', 'SCREEN_SHARE_STOP',
    'WHISPER_OFFER', 'WHISPER_ANSWER', 'WHISPER_ICE'
  ]
});

var PERMISSIONS = Object.freeze({
  ADMIN: 1,
  MANAGE_SERVER: 2,
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
  MANAGE_ORGANIZER: 1048576,
  APPROVE_CALENDAR: 2097152,
  UPLOAD_SYSTEM_FILES: 4194304,
  MANAGE_SYSTEM_LIBRARY: 8388608,
  VIEW_PRIVATE_AVAILABILITY: 16777216,
  USE_RULES_ASSISTANT: 33554432,
  ALL: 67108863
});

var PLAYER_PERMISSIONS =
  PERMISSIONS.SEND_MESSAGES |
  PERMISSIONS.READ_MESSAGES |
  PERMISSIONS.CONNECT_VOICE |
  PERMISSIONS.SPEAK |
  PERMISSIONS.ATTACH_FILES |
  PERMISSIONS.STREAM |
  PERMISSIONS.USE_PERSONAS |
  PERMISSIONS.ROLL_DICE |
  PERMISSIONS.USE_RULES_ASSISTANT;

var MODERATOR_PERMISSIONS =
  PLAYER_PERMISSIONS |
  PERMISSIONS.MANAGE_CHANNELS |
  PERMISSIONS.MANAGE_MESSAGES |
  PERMISSIONS.KICK_MEMBERS |
  PERMISSIONS.BAN_MEMBERS |
  PERMISSIONS.CREATE_INVITE |
  PERMISSIONS.MANAGE_NICKNAMES |
  PERMISSIONS.VIEW_AUDIT_LOG |
  PERMISSIONS.MANAGE_HANDOUTS |
  PERMISSIONS.MANAGE_ORGANIZER |
  PERMISSIONS.APPROVE_CALENDAR |
  PERMISSIONS.UPLOAD_SYSTEM_FILES |
  PERMISSIONS.MANAGE_SYSTEM_LIBRARY |
  PERMISSIONS.VIEW_PRIVATE_AVAILABILITY |
  PERMISSIONS.USE_RULES_ASSISTANT;

var TABLES = Object.freeze({
  Users: ['id','email','username','discriminator','passwordSalt','passwordHash','avatarAttachmentId','bannerAttachmentId','bio','status','customStatus','createdAt','updatedAt','lastSeenAt','disabled','discoverable'],
  Sessions: ['id','userId','tokenHash','createdAt','expiresAt','lastSeenAt','revokedAt','userAgent'],
  Servers: ['id','name','description','iconAttachmentId','ownerId','isPublic','inviteOnly','createdAt','updatedAt','deletedAt'],
  Members: ['id','serverId','userId','nickname','joinedAt','updatedAt','leftAt','timedOutUntil'],
  Bans: ['id','serverId','userId','actorId','reason','createdAt','revokedAt','revokedBy'],
  Roles: ['id','serverId','name','color','permissions','position','isManaged','managedKey','createdAt','updatedAt'],
  MemberRoles: ['id','serverId','userId','roleId','createdAt'],
  Categories: ['id','serverId','name','position','createdBy','createdAt','updatedAt','deletedAt'],
  Channels: ['id','serverId','categoryId','name','topic','type','position','userLimit','slowmodeSeconds','isPrivate','allowedRoleIds','isSystem','createdBy','createdAt','updatedAt','deletedAt'],
  Invites: ['id','serverId','code','createdBy','maxUses','uses','expiresAt','revokedAt','createdAt'],
  Messages: ['id','scopeType','scopeId','serverId','authorId','personaId','messageType','content','attachmentIds','replyToId','mentionUserIds','mentionRoleIds','mentionsEveryone','isPinned','pinnedBy','pinnedAt','createdAt','editedAt','deletedAt','deletedBy'],
  Reactions: ['id','messageId','userId','emoji','createdAt'],
  ChannelReads: ['id','channelId','userId','lastMessageId','lastReadAt'],
  DmChannels: ['id','type','pairKey','name','iconAttachmentId','ownerId','createdAt','updatedAt','closedAt'],
  DmParticipants: ['id','dmId','userId','role','joinedAt','leftAt'],
  Friendships: ['id','pairKey','requesterId','addresseeId','status','createdAt','updatedAt'],
  SafetyRelations: ['id','userId','targetUserId','type','createdAt','revokedAt'],
  Presence: ['id','userId','status','customStatus','lastSeenAt','updatedAt'],
  Typing: ['id','scopeType','scopeId','userId','expiresAt','updatedAt'],
  VoiceStates: ['id','serverId','channelId','userId','sessionId','muted','deafened','videoEnabled','screenSharing','pushToTalk','whispering','joinedAt','updatedAt'],
  Calls: ['id','dmId','initiatorId','status','createdAt','startedAt','endedAt','updatedAt'],
  CallParticipants: ['id','callId','userId','status','joinedAt','leftAt','updatedAt'],
  RtcSignals: ['id','roomType','roomId','fromUserId','toUserId','signalType','signalJson','createdAt','expiresAt','consumedAt'],
  Attachments: ['id','ownerId','serverId','dmId','scopeType','scopeId','messageId','fileId','originalName','storedName','mimeType','sizeBytes','sha256','createdAt','deletedAt'],
  Personas: ['id','serverId','userId','name','avatarAttachmentId','color','description','isDefault','createdAt','updatedAt','deletedAt'],
  DiceRolls: ['id','serverId','channelId','userId','personaId','expression','label','total','detailJson','messageId','createdAt'],
  OrganizerTasks: ['id','serverId','title','description','status','priority','assigneeUserId','createdBy','dueDate','dueTime','recurrenceJson','tagsJson','createdAt','updatedAt','completedAt','deletedAt'],
  CalendarItems: ['id','serverId','title','description','itemType','startAt','endAt','allDay','recurrenceJson','visibility','submittedBy','approvalStatus','approvedBy','approvedAt','rejectionReason','createdAt','updatedAt','deletedAt'],
  SystemDocuments: ['id','serverId','systemName','title','attachmentId','fileType','mimeType','tagsJson','versionLabel','sourceNote','uploadedBy','status','extractedText','extractionStatus','textLength','createdAt','updatedAt','deletedAt'],
  RuleNotes: ['id','serverId','documentId','title','systemName','pageRef','text','tagsJson','createdBy','createdAt','updatedAt','deletedAt'],
  TableGateProfiles: ['id','userId','externalProfileId','email','displayName','dataFileId','createdAt','updatedAt'],
  TableGateCharacters: ['id','userId','externalProfileId','externalCharacterId','systemId','name','dataFileId','createdAt','updatedAt','deletedAt'],
  TableGateSnapshots: ['id','userId','externalProfileId','dataFileId','createdAt','updatedAt'],
  Notifications: ['id','userId','type','actorId','scopeType','scopeId','messageId','payloadJson','readAt','createdAt'],
  Events: ['id','audienceType','audienceId','eventType','entityType','entityId','payloadJson','createdAt','expiresAt'],
  AuditLog: ['id','serverId','actorId','action','targetType','targetId','detailsJson','createdAt']
});

var RUNTIME_ = { spreadsheet: null, sheets: {}, headers: {}, rows: {} };

function ApiError_(code, message, details) {
  this.name = 'ApiError';
  this.code = code || 'ERROR';
  this.message = message || 'Request failed.';
  this.details = details || null;
}
ApiError_.prototype = Object.create(Error.prototype);
ApiError_.prototype.constructor = ApiError_;

function setupTtrpgMessenger() {
  var props = PropertiesService.getScriptProperties();
  var dbId = props.getProperty(TTRPG.DB_PROPERTY);
  var ss;
  if (dbId) {
    ss = SpreadsheetApp.openById(dbId);
  } else {
    ss = SpreadsheetApp.create('TTRPG Messenger Database');
    props.setProperty(TTRPG.DB_PROPERTY, ss.getId());
  }

  Object.keys(TABLES).forEach(function(name) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);
    var headers = TABLES[name];
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    } else {
      var existing = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), headers.length)).getValues()[0];
      headers.forEach(function(header, i) {
        if (!existing[i]) sheet.getRange(1, i + 1).setValue(header);
      });
    }
  });

  var uploadFolderId = props.getProperty(TTRPG.UPLOAD_FOLDER_PROPERTY);
  if (!uploadFolderId) {
    var folder = DriveApp.createFolder('TTRPG Messenger Private Uploads');
    props.setProperty(TTRPG.UPLOAD_FOLDER_PROPERTY, folder.getId());
    uploadFolderId = folder.getId();
  }

  if (!props.getProperty(TTRPG.PEPPER_PROPERTY)) {
    props.setProperty(TTRPG.PEPPER_PROPERTY, randomToken_(4));
  }
  if (!props.getProperty(TTRPG.REGISTRATION_MODE_PROPERTY)) {
    props.setProperty(TTRPG.REGISTRATION_MODE_PROPERTY, 'INVITE_OR_FIRST_USER');
  }
  if (!props.getProperty(TTRPG.SESSION_DAYS_PROPERTY)) {
    props.setProperty(TTRPG.SESSION_DAYS_PROPERTY, String(TTRPG.DEFAULT_SESSION_DAYS));
  }
  if (!props.getProperty(TTRPG.MAX_UPLOAD_PROPERTY)) {
    props.setProperty(TTRPG.MAX_UPLOAD_PROPERTY, String(TTRPG.DEFAULT_MAX_UPLOAD_BYTES));
  }
  if (!props.getProperty(TTRPG.RTC_ICE_PROPERTY)) {
    props.setProperty(TTRPG.RTC_ICE_PROPERTY, JSON.stringify([
      {urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302']}
    ]));
  }
  props.setProperty('TTRPG_SCHEMA_VERSION', TTRPG.SCHEMA_VERSION);

  var result = {
    ok: true,
    apiVersion: TTRPG.API_VERSION,
    schemaVersion: TTRPG.SCHEMA_VERSION,
    spreadsheetId: ss.getId(),
    spreadsheetUrl: ss.getUrl(),
    uploadFolderId: uploadFolderId,
    registrationMode: props.getProperty(TTRPG.REGISTRATION_MODE_PROPERTY),
    nextStep: 'Deploy this script as a web app executing as you, with access set to Anyone.'
  };
  console.log(JSON.stringify(result, null, 2));
  return result;
}

function doGet(e) {
  return handleRequest_(e, 'GET');
}

function doPost(e) {
  return handleRequest_(e, 'POST');
}

function handleRequest_(e, method) {
  resetRuntime_();
  try {
    ensureConfigured_();
    var params = parseRequest_(e, method);
    var action = String(params.action || (method === 'GET' ? 'health' : '')).trim();
    if (!action) throw new ApiError_('ACTION_REQUIRED', 'An action is required.');
    var route = ROUTES_[action];
    if (!route) throw new ApiError_('UNKNOWN_ACTION', 'Unknown action: ' + action);

    var ctx = { params: params, method: method, action: action, user: null, session: null };
    if (route.auth !== false) {
      var auth = authenticate_(params.token);
      ctx.user = auth.user;
      ctx.session = auth.session;
    }

    var data;
    if (route.write) {
      var lock = LockService.getScriptLock();
      if (!lock.tryLock(25000)) throw new ApiError_('BUSY', 'The messenger is busy. Please retry.');
      try {
        data = route.fn(ctx);
      } finally {
        lock.releaseLock();
      }
    } else {
      data = route.fn(ctx);
    }
    return jsonOutput_({ok: true, data: data, serverTime: nowIso_(), apiVersion: TTRPG.API_VERSION});
  } catch (err) {
    console.error(err && err.stack ? err.stack : err);
    var error = err instanceof ApiError_ ? err : new ApiError_('INTERNAL_ERROR', 'Internal server error.', String(err && err.message ? err.message : err));
    return jsonOutput_({
      ok: false,
      error: {code: error.code, message: error.message, details: error.details},
      serverTime: nowIso_(),
      apiVersion: TTRPG.API_VERSION
    });
  }
}

function parseRequest_(e, method) {
  var out = {};
  var p = (e && e.parameter) || {};
  Object.keys(p).forEach(function(k) { out[k] = p[k]; });
  if (method === 'POST' && e && e.postData && e.postData.contents) {
    var raw = e.postData.contents;
    try {
      var body = JSON.parse(raw);
      if (body && typeof body === 'object') {
        Object.keys(body).forEach(function(k) { out[k] = body[k]; });
      }
    } catch (jsonErr) {
      raw.split('&').forEach(function(part) {
        var bits = part.split('=');
        var key = decodeURIComponent(bits.shift() || '');
        var val = decodeURIComponent(bits.join('=') || '');
        if (key) out[key] = val;
      });
    }
  }
  return out;
}

function jsonOutput_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function resetRuntime_() {
  RUNTIME_ = { spreadsheet: null, sheets: {}, headers: {}, rows: {} };
}

function ensureConfigured_() {
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty(TTRPG.DB_PROPERTY)) {
    throw new ApiError_('NOT_CONFIGURED', 'Run setupTtrpgMessenger() once from the Apps Script editor before deploying.');
  }
}

/* =============================
 * DATA ACCESS
 * ============================= */

function db_() {
  if (!RUNTIME_.spreadsheet) {
    var id = PropertiesService.getScriptProperties().getProperty(TTRPG.DB_PROPERTY);
    RUNTIME_.spreadsheet = SpreadsheetApp.openById(id);
  }
  return RUNTIME_.spreadsheet;
}

function sheet_(name) {
  if (!TABLES[name]) throw new ApiError_('BAD_TABLE', 'Unknown table: ' + name);
  if (!RUNTIME_.sheets[name]) {
    var sh = db_().getSheetByName(name);
    if (!sh) throw new ApiError_('MISSING_TABLE', 'Missing database sheet: ' + name + '. Run setupTtrpgMessenger().');
    RUNTIME_.sheets[name] = sh;
  }
  return RUNTIME_.sheets[name];
}

function headers_(name) {
  if (!RUNTIME_.headers[name]) RUNTIME_.headers[name] = TABLES[name].slice();
  return RUNTIME_.headers[name];
}

function rows_(name, force) {
  if (!force && RUNTIME_.rows[name]) return RUNTIME_.rows[name];
  var sh = sheet_(name);
  var lastRow = sh.getLastRow();
  var headers = headers_(name);
  if (lastRow < 2) {
    RUNTIME_.rows[name] = [];
    return RUNTIME_.rows[name];
  }
  var values = sh.getRange(2, 1, lastRow - 1, headers.length).getValues();
  var out = values.map(function(row, idx) {
    var obj = {_row: idx + 2};
    headers.forEach(function(h, i) { obj[h] = normalizeCell_(row[i]); });
    return obj;
  });
  RUNTIME_.rows[name] = out;
  return out;
}

function normalizeCell_(v) {
  if (v instanceof Date) return v.toISOString();
  return v;
}

function invalidate_(name) {
  delete RUNTIME_.rows[name];
}

function insert_(name, obj) {
  var headers = headers_(name);
  var row = headers.map(function(h) {
    var v = obj[h];
    if (v === undefined || v === null) return '';
    if (typeof v === 'object') return JSON.stringify(v);
    return v;
  });
  sheet_(name).appendRow(row);
  invalidate_(name);
  var created = clone_(obj);
  created._row = sheet_(name).getLastRow();
  return created;
}

function updateRow_(name, rowNumber, patch) {
  var sh = sheet_(name);
  var headers = headers_(name);
  var current = sh.getRange(rowNumber, 1, 1, headers.length).getValues()[0];
  headers.forEach(function(h, i) {
    if (Object.prototype.hasOwnProperty.call(patch, h)) {
      var v = patch[h];
      current[i] = (v === undefined || v === null) ? '' : (typeof v === 'object' ? JSON.stringify(v) : v);
    }
  });
  sh.getRange(rowNumber, 1, 1, headers.length).setValues([current]);
  invalidate_(name);
}

function deleteRow_(name, rowNumber) {
  sheet_(name).deleteRow(rowNumber);
  invalidate_(name);
}

function findOne_(name, predicate) {
  var list = rows_(name);
  for (var i = 0; i < list.length; i++) if (predicate(list[i])) return list[i];
  return null;
}

function filter_(name, predicate) {
  return rows_(name).filter(predicate);
}

function byId_(name, id, includeDeleted) {
  if (!id) return null;
  return findOne_(name, function(r) {
    if (String(r.id) !== String(id)) return false;
    if (!includeDeleted && Object.prototype.hasOwnProperty.call(r, 'deletedAt') && r.deletedAt) return false;
    return true;
  });
}

function clone_(obj) {
  return obj == null ? obj : JSON.parse(JSON.stringify(obj));
}

function stripInternal_(obj) {
  if (obj == null) return obj;
  if (Array.isArray(obj)) return obj.map(stripInternal_);
  if (typeof obj !== 'object') return obj;
  var out = {};
  Object.keys(obj).forEach(function(k) {
    if (k !== '_row' && k !== 'passwordHash' && k !== 'passwordSalt' && k !== 'tokenHash' && k !== 'fileId') {
      out[k] = stripInternal_(obj[k]);
    }
  });
  return out;
}

function parseJsonCell_(value, fallback) {
  if (value === '' || value === null || value === undefined) return fallback;
  if (typeof value === 'object') return value;
  try { return JSON.parse(String(value)); } catch (e) { return fallback; }
}

function bool_(v) {
  return v === true || v === 1 || v === '1' || String(v).toLowerCase() === 'true';
}

function int_(v, fallback, min, max) {
  var n = parseInt(v, 10);
  if (!isFinite(n)) n = fallback;
  if (min !== undefined) n = Math.max(min, n);
  if (max !== undefined) n = Math.min(max, n);
  return n;
}

function num_(v, fallback) {
  var n = Number(v);
  return isFinite(n) ? n : fallback;
}

function text_(v, maxLen, allowEmpty) {
  var s = String(v === undefined || v === null ? '' : v).trim();
  if (!allowEmpty && !s) throw new ApiError_('VALIDATION_ERROR', 'A required text value is empty.');
  if (maxLen && s.length > maxLen) throw new ApiError_('VALIDATION_ERROR', 'Text exceeds maximum length of ' + maxLen + '.');
  return s;
}

function nullableText_(v, maxLen) {
  if (v === undefined || v === null || String(v).trim() === '') return '';
  return text_(v, maxLen, true);
}

function array_(v) {
  if (Array.isArray(v)) return v;
  if (v === undefined || v === null || v === '') return [];
  if (typeof v === 'string') {
    try {
      var parsed = JSON.parse(v);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {}
    return v.split(',').map(function(x) { return x.trim(); }).filter(Boolean);
  }
  return [];
}

function unique_(arr) {
  var seen = {};
  return arr.filter(function(v) {
    var k = String(v);
    if (seen[k]) return false;
    seen[k] = true;
    return true;
  });
}

function nowIso_() { return new Date().toISOString(); }
function addMsIso_(ms) { return new Date(Date.now() + ms).toISOString(); }
function isFuture_(iso) { return !!iso && new Date(iso).getTime() > Date.now(); }
function isPast_(iso) { return !!iso && new Date(iso).getTime() <= Date.now(); }

function id_(prefix) {
  return String(prefix || 'id') + '_' + Utilities.getUuid().replace(/-/g, '');
}

function randomToken_(parts) {
  var a = [];
  for (var i = 0; i < (parts || 3); i++) a.push(Utilities.getUuid().replace(/-/g, ''));
  return a.join('') + Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, a.join('|') + '|' + Date.now())).replace(/=+$/g, '');
}

function randomCode_(length) {
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  var out = '';
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, randomToken_(2) + '|' + Date.now());
  for (var i = 0; i < length; i++) out += chars.charAt(((bytes[i % bytes.length] + 256) % 256) % chars.length);
  return out;
}

function sha256Hex_(value) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(value), Utilities.Charset.UTF_8);
  return bytes.map(function(b) { var n = (b + 256) % 256; return ('0' + n.toString(16)).slice(-2); }).join('');
}

function hashPassword_(password, salt) {
  var pepper = PropertiesService.getScriptProperties().getProperty(TTRPG.PEPPER_PROPERTY) || '';
  var h = sha256Hex_(pepper + '|' + salt + '|' + password);
  for (var i = 0; i < TTRPG.PASSWORD_ROUNDS; i++) h = sha256Hex_(h + '|' + salt + '|' + pepper + '|' + i);
  return h;
}

function constantTimeEqual_(a, b) {
  a = String(a || ''); b = String(b || '');
  var diff = a.length ^ b.length;
  var len = Math.max(a.length, b.length);
  for (var i = 0; i < len; i++) diff |= (a.charCodeAt(i % Math.max(1, a.length)) || 0) ^ (b.charCodeAt(i % Math.max(1, b.length)) || 0);
  return diff === 0;
}

function validateEmail_(email) {
  email = String(email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw new ApiError_('INVALID_EMAIL', 'Enter a valid email address.');
  return email;
}

function validateUsername_(username) {
  username = String(username || '').trim();
  if (!/^[A-Za-z0-9_. -]{2,32}$/.test(username)) throw new ApiError_('INVALID_USERNAME', 'Username must be 2–32 characters using letters, numbers, spaces, dots, underscores, or hyphens.');
  return username;
}

function validatePassword_(password) {
  password = String(password || '');
  if (password.length < 10 || password.length > 128) throw new ApiError_('WEAK_PASSWORD', 'Password must be 10–128 characters.');
  return password;
}

function safeFileName_(name) {
  var s = String(name || 'attachment').replace(/[\\/:*?"<>|\u0000-\u001F]/g, '_').replace(/\s+/g, ' ').trim();
  if (!s) s = 'attachment';
  return s.slice(0, 180);
}

function lower_(v) { return String(v || '').toLowerCase(); }
function pairKey_(a, b) { return [String(a), String(b)].sort().join(':'); }
function roleIds_(member) { return filter_('MemberRoles', function(mr) { return mr.serverId === member.serverId && mr.userId === member.userId; }).map(function(mr) { return mr.roleId; }); }

/* =============================
 * AUTHENTICATION
 * ============================= */

function authenticate_(token) {
  token = String(token || '').trim();
  if (!token) throw new ApiError_('UNAUTHENTICATED', 'A session token is required.');
  var hash = sha256Hex_(token);
  var session = findOne_('Sessions', function(s) { return s.tokenHash === hash && !s.revokedAt; });
  if (!session || isPast_(session.expiresAt)) throw new ApiError_('SESSION_EXPIRED', 'Session is invalid or expired.');
  var user = byId_('Users', session.userId, true);
  if (!user || bool_(user.disabled)) throw new ApiError_('ACCOUNT_DISABLED', 'This account is unavailable.');
  if (!session.lastSeenAt || Date.now() - new Date(session.lastSeenAt).getTime() > 5 * 60 * 1000) {
    updateRow_('Sessions', session._row, {lastSeenAt: nowIso_()});
    updateRow_('Users', user._row, {lastSeenAt: nowIso_()});
  }
  return {user: user, session: session};
}

function createSession_(userId, userAgent) {
  var token = randomToken_(4);
  var days = int_(PropertiesService.getScriptProperties().getProperty(TTRPG.SESSION_DAYS_PROPERTY), TTRPG.DEFAULT_SESSION_DAYS, 1, 365);
  var now = nowIso_();
  var session = insert_('Sessions', {
    id: id_('ses'), userId: userId, tokenHash: sha256Hex_(token), createdAt: now,
    expiresAt: addMsIso_(days * 86400000), lastSeenAt: now, revokedAt: '', userAgent: nullableText_(userAgent, 500)
  });
  return {token: token, session: stripInternal_(session)};
}

function publicUser_(user) {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    discriminator: user.discriminator,
    displayTag: user.username + '#' + user.discriminator,
    avatarAttachmentId: user.avatarAttachmentId || '',
    bannerAttachmentId: user.bannerAttachmentId || '',
    bio: user.bio || '',
    status: user.status || 'OFFLINE',
    customStatus: user.customStatus || '',
    lastSeenAt: user.lastSeenAt || '',
    createdAt: user.createdAt
  };
}

function privateUser_(user) {
  var out = publicUser_(user);
  out.email = user.email;
  out.discoverable = bool_(user.discoverable);
  return out;
}

function routeHealth_() {
  var props = PropertiesService.getScriptProperties();
  return {
    service: 'TTRPG Messenger Backend',
    status: 'ok',
    apiVersion: TTRPG.API_VERSION,
    schemaVersion: props.getProperty('TTRPG_SCHEMA_VERSION') || TTRPG.SCHEMA_VERSION,
    registrationMode: props.getProperty(TTRPG.REGISTRATION_MODE_PROPERTY) || 'INVITE_OR_FIRST_USER',
    features: [
      'invite-only servers','roles and permissions','text chat','direct messages','group DMs',
      'attachments','reactions','pins','presence','voice state','WebRTC signaling','screen sharing',
      'push-to-talk','whispers','friends and blocks','personas','dice rolls','audit log','polling events',
      'shared organizer','campaign tasks','calendar approvals','availability planning','TTRPG system library','rules assistant'
    ],
    organizerExtension: {active: true, version: '1.1.0', shared: true}
  };
}

function routeRegister_(ctx) {
  var p = ctx.params;
  var email = validateEmail_(p.email);
  var username = validateUsername_(p.username);
  var password = validatePassword_(p.password);
  var inviteCode = String(p.inviteCode || '').trim();
  var mode = PropertiesService.getScriptProperties().getProperty(TTRPG.REGISTRATION_MODE_PROPERTY) || 'INVITE_OR_FIRST_USER';
  var activeUsers = filter_('Users', function(u) { return !bool_(u.disabled); });
  var invite = inviteCode ? validateInviteCode_(inviteCode, null, false) : null;

  if (mode === 'CLOSED') throw new ApiError_('REGISTRATION_CLOSED', 'Registration is closed.');
  if (mode === 'INVITE_ONLY' && !invite) throw new ApiError_('INVITE_REQUIRED', 'A valid server invite is required.');
  if (mode === 'INVITE_OR_FIRST_USER' && activeUsers.length > 0 && !invite) throw new ApiError_('INVITE_REQUIRED', 'A valid server invite is required.');

  if (findOne_('Users', function(u) { return lower_(u.email) === email; })) throw new ApiError_('EMAIL_IN_USE', 'That email is already registered.');

  var discriminator = generateDiscriminator_(username);
  var salt = randomCode_(24);
  var now = nowIso_();
  var user = insert_('Users', {
    id: id_('usr'), email: email, username: username, discriminator: discriminator,
    passwordSalt: salt, passwordHash: hashPassword_(password, salt), avatarAttachmentId: '', bannerAttachmentId: '',
    bio: '', status: 'ONLINE', customStatus: '', createdAt: now, updatedAt: now, lastSeenAt: now,
    disabled: false, discoverable: true
  });
  upsertPresence_(user.id, 'ONLINE', '');
  if (invite) joinInviteForUser_(invite, user.id);
  var session = createSession_(user.id, p.userAgent);
  return {user: privateUser_(user), token: session.token, session: session.session, joinedServerId: invite ? invite.serverId : ''};
}

function generateDiscriminator_(username) {
  for (var tries = 0; tries < 100; tries++) {
    var d = ('0000' + Math.floor(Math.random() * 10000)).slice(-4);
    var exists = findOne_('Users', function(u) { return lower_(u.username) === lower_(username) && String(u.discriminator) === d; });
    if (!exists) return d;
  }
  return randomCode_(6).toUpperCase();
}

function routeLogin_(ctx) {
  var email = validateEmail_(ctx.params.email);
  var password = String(ctx.params.password || '');
  var user = findOne_('Users', function(u) { return lower_(u.email) === email; });
  if (!user || bool_(user.disabled) || !constantTimeEqual_(hashPassword_(password, user.passwordSalt), user.passwordHash)) {
    throw new ApiError_('INVALID_LOGIN', 'Email or password is incorrect.');
  }
  var now = nowIso_();
  updateRow_('Users', user._row, {status: 'ONLINE', lastSeenAt: now, updatedAt: now});
  upsertPresence_(user.id, 'ONLINE', user.customStatus || '');
  var session = createSession_(user.id, ctx.params.userAgent);
  return {user: privateUser_(user), token: session.token, session: session.session};
}

function routeLogout_(ctx) {
  updateRow_('Sessions', ctx.session._row, {revokedAt: nowIso_()});
  return {loggedOut: true};
}

function routeLogoutAll_(ctx) {
  var now = nowIso_();
  filter_('Sessions', function(s) { return s.userId === ctx.user.id && !s.revokedAt; }).forEach(function(s) { updateRow_('Sessions', s._row, {revokedAt: now}); });
  return {loggedOutEverywhere: true};
}

function routeMe_(ctx) {
  return {user: privateUser_(ctx.user), servers: listServersForUser_(ctx.user.id)};
}

function routeUpdateProfile_(ctx) {
  var p = ctx.params;
  var patch = {updatedAt: nowIso_()};
  if (p.username !== undefined) {
    var username = validateUsername_(p.username);
    var conflict = findOne_('Users', function(u) { return u.id !== ctx.user.id && lower_(u.username) === lower_(username) && String(u.discriminator) === String(ctx.user.discriminator); });
    if (conflict) patch.discriminator = generateDiscriminator_(username);
    patch.username = username;
  }
  if (p.bio !== undefined) patch.bio = nullableText_(p.bio, 1000);
  if (p.customStatus !== undefined) patch.customStatus = nullableText_(p.customStatus, 128);
  if (p.discoverable !== undefined) patch.discoverable = bool_(p.discoverable);
  if (p.avatarAttachmentId !== undefined) {
    if (p.avatarAttachmentId) requireOwnedAttachment_(p.avatarAttachmentId, ctx.user.id);
    patch.avatarAttachmentId = String(p.avatarAttachmentId || '');
  }
  if (p.bannerAttachmentId !== undefined) {
    if (p.bannerAttachmentId) requireOwnedAttachment_(p.bannerAttachmentId, ctx.user.id);
    patch.bannerAttachmentId = String(p.bannerAttachmentId || '');
  }
  updateRow_('Users', ctx.user._row, patch);
  var updated = byId_('Users', ctx.user.id, true);
  emitUserEvent_(ctx.user.id, 'PROFILE_UPDATED', 'USER', ctx.user.id, {user: publicUser_(updated)});
  return privateUser_(updated);
}

function routeChangePassword_(ctx) {
  var current = String(ctx.params.currentPassword || '');
  var next = validatePassword_(ctx.params.newPassword);
  if (!constantTimeEqual_(hashPassword_(current, ctx.user.passwordSalt), ctx.user.passwordHash)) throw new ApiError_('INVALID_PASSWORD', 'Current password is incorrect.');
  var salt = randomCode_(24);
  updateRow_('Users', ctx.user._row, {passwordSalt: salt, passwordHash: hashPassword_(next, salt), updatedAt: nowIso_()});
  filter_('Sessions', function(s) { return s.userId === ctx.user.id && s.id !== ctx.session.id && !s.revokedAt; }).forEach(function(s) { updateRow_('Sessions', s._row, {revokedAt: nowIso_()}); });
  return {changed: true};
}

function routeSearchUsers_(ctx) {
  var q = lower_(text_(ctx.params.query || ctx.params.q, 64));
  var limit = int_(ctx.params.limit, 20, 1, 50);
  var blocked = safetySet_(ctx.user.id, 'BLOCK');
  return filter_('Users', function(u) {
    if (u.id === ctx.user.id || bool_(u.disabled) || !bool_(u.discoverable) || blocked[u.id]) return false;
    return lower_(u.username + '#' + u.discriminator).indexOf(q) !== -1;
  }).slice(0, limit).map(publicUser_);
}

/* =============================
 * SERVER, MEMBERSHIP, PERMISSIONS
 * ============================= */

function requireServer_(serverId, includeDeleted) {
  var server = byId_('Servers', String(serverId || ''), !!includeDeleted);
  if (!server || (!includeDeleted && server.deletedAt)) throw new ApiError_('SERVER_NOT_FOUND', 'Server not found.');
  return server;
}

function requireMember_(serverId, userId) {
  var server = requireServer_(serverId);
  var ban = findOne_('Bans', function(b) { return b.serverId === server.id && b.userId === userId && !b.revokedAt; });
  if (ban) throw new ApiError_('BANNED', 'You are banned from this server.');
  var member = findOne_('Members', function(m) { return m.serverId === server.id && m.userId === userId && !m.leftAt; });
  if (!member) throw new ApiError_('NOT_A_MEMBER', 'You are not a member of this server.');
  if (member.timedOutUntil && isFuture_(member.timedOutUntil)) throw new ApiError_('MEMBER_TIMED_OUT', 'Your server access is temporarily restricted until ' + member.timedOutUntil + '.');
  return {server: server, member: member};
}

function permissionsFor_(serverId, userId) {
  var sm = requireMember_(serverId, userId);
  if (sm.server.ownerId === userId) return PERMISSIONS.ALL;
  var roleIds = roleIds_(sm.member);
  var roles = filter_('Roles', function(r) { return r.serverId === serverId && roleIds.indexOf(r.id) !== -1; });
  var permissions = 0;
  roles.forEach(function(r) { permissions |= int_(r.permissions, 0); });
  return permissions;
}

function hasPermission_(serverId, userId, permission) {
  var p = permissionsFor_(serverId, userId);
  return (p & PERMISSIONS.ADMIN) === PERMISSIONS.ADMIN || (p & permission) === permission;
}

function requirePermission_(serverId, userId, permission, message) {
  if (!hasPermission_(serverId, userId, permission)) throw new ApiError_('FORBIDDEN', message || 'You do not have permission to do that.');
}

function listServersForUser_(userId) {
  var memberships = filter_('Members', function(m) { return m.userId === userId && !m.leftAt; });
  var memberServerIds = {};
  memberships.forEach(function(m) { memberServerIds[m.serverId] = m; });
  return filter_('Servers', function(s) { return !s.deletedAt && !!memberServerIds[s.id]; }).map(function(s) {
    var member = memberServerIds[s.id];
    return {
      id: s.id, name: s.name, description: s.description || '', iconAttachmentId: s.iconAttachmentId || '',
      ownerId: s.ownerId, isPublic: bool_(s.isPublic), inviteOnly: bool_(s.inviteOnly),
      nickname: member.nickname || '', permissions: permissionsFor_(s.id, userId),
      createdAt: s.createdAt, updatedAt: s.updatedAt
    };
  });
}

function routeListServers_(ctx) { return listServersForUser_(ctx.user.id); }

function routeCreateServer_(ctx) {
  var p = ctx.params;
  var now = nowIso_();
  var server = insert_('Servers', {
    id: id_('srv'), name: text_(p.name || 'New TTRPG Campaign', 80), description: nullableText_(p.description, 1000),
    iconAttachmentId: '', ownerId: ctx.user.id, isPublic: bool_(p.isPublic), inviteOnly: p.inviteOnly === undefined ? true : bool_(p.inviteOnly),
    createdAt: now, updatedAt: now, deletedAt: ''
  });
  insert_('Members', {id: id_('mem'), serverId: server.id, userId: ctx.user.id, nickname: '', joinedAt: now, updatedAt: now, leftAt: '', timedOutUntil: ''});

  var creatorRole = insert_('Roles', {id: id_('rol'), serverId: server.id, name: 'Creator', color: '#D6A84B', permissions: PERMISSIONS.ALL, position: 100, isManaged: true, managedKey: 'CREATOR', createdAt: now, updatedAt: now});
  insert_('Roles', {id: id_('rol'), serverId: server.id, name: 'Moderator', color: '#5D8AA8', permissions: MODERATOR_PERMISSIONS, position: 50, isManaged: true, managedKey: 'MODERATOR', createdAt: now, updatedAt: now});
  var playerRole = insert_('Roles', {id: id_('rol'), serverId: server.id, name: 'Player', color: '#7BA05B', permissions: PLAYER_PERMISSIONS, position: 10, isManaged: true, managedKey: 'PLAYER', createdAt: now, updatedAt: now});
  insert_('MemberRoles', {id: id_('mrl'), serverId: server.id, userId: ctx.user.id, roleId: creatorRole.id, createdAt: now});

  var campaignCat = insert_('Categories', {id: id_('cat'), serverId: server.id, name: 'Campaign', position: 10, createdBy: ctx.user.id, createdAt: now, updatedAt: now, deletedAt: ''});
  var tableCat = insert_('Categories', {id: id_('cat'), serverId: server.id, name: 'Table Talk', position: 20, createdBy: ctx.user.id, createdAt: now, updatedAt: now, deletedAt: ''});
  var voiceCat = insert_('Categories', {id: id_('cat'), serverId: server.id, name: 'Voice & Video', position: 30, createdBy: ctx.user.id, createdAt: now, updatedAt: now, deletedAt: ''});
  var defaults = [
    {name:'general', topic:'General campaign conversation.', type:'TEXT', categoryId:tableCat.id, position:10, isSystem:true},
    {name:'in-character', topic:'In-character roleplay and scene dialogue.', type:'TEXT', categoryId:campaignCat.id, position:10, isSystem:false},
    {name:'dice-rolls', topic:'Auditable dice rolls and rules checks.', type:'TEXT', categoryId:campaignCat.id, position:20, isSystem:false},
    {name:'handouts', topic:'Maps, clues, character sheets, and campaign handouts.', type:'HANDOUTS', categoryId:campaignCat.id, position:30, isSystem:false},
    {name:'table-voice', topic:'Main voice channel for game sessions.', type:'VOICE', categoryId:voiceCat.id, position:10, isSystem:false},
    {name:'session-video', topic:'Optional camera and screen-sharing room.', type:'VIDEO', categoryId:voiceCat.id, position:20, isSystem:false}
  ];
  var channels = defaults.map(function(c) {
    return insert_('Channels', {
      id: id_('chn'), serverId: server.id, categoryId: c.categoryId, name: c.name, topic: c.topic, type: c.type,
      position: c.position, userLimit: 0, slowmodeSeconds: 0, isPrivate: false, allowedRoleIds: JSON.stringify([playerRole.id]),
      isSystem: c.isSystem, createdBy: ctx.user.id, createdAt: now, updatedAt: now, deletedAt: ''
    });
  });
  var invite = createInviteRecord_(server.id, ctx.user.id, int_(p.maxUses, 0, 0, 1000), int_(p.expiresInHours, 168, 1, 8760));
  audit_(server.id, ctx.user.id, 'SERVER_CREATED', 'SERVER', server.id, {name: server.name});
  emitServerEvent_(server.id, 'SERVER_CREATED', 'SERVER', server.id, {server: stripInternal_(server)});
  return {server: stripInternal_(server), channels: stripInternal_(channels), invite: stripInternal_(invite)};
}

function routeGetServer_(ctx) {
  var serverId = String(ctx.params.serverId || '');
  var sm = requireMember_(serverId, ctx.user.id);
  var categories = filter_('Categories', function(c) { return c.serverId === serverId && !c.deletedAt; }).sort(function(a,b){return num_(a.position,0)-num_(b.position,0);});
  var channels = filter_('Channels', function(c) { return c.serverId === serverId && !c.deletedAt && canViewChannel_(c, ctx.user.id); }).sort(function(a,b){return num_(a.position,0)-num_(b.position,0);}).map(publicChannel_);
  return {
    server: stripInternal_(sm.server),
    member: stripInternal_(sm.member),
    permissions: permissionsFor_(serverId, ctx.user.id),
    categories: stripInternal_(categories),
    channels: channels,
    roles: routeListRoles_(ctx),
    members: routeListMembers_(ctx)
  };
}

function routeUpdateServer_(ctx) {
  var serverId = String(ctx.params.serverId || '');
  requirePermission_(serverId, ctx.user.id, PERMISSIONS.MANAGE_SERVER);
  var server = requireServer_(serverId);
  var patch = {updatedAt: nowIso_()};
  if (ctx.params.name !== undefined) patch.name = text_(ctx.params.name, 80);
  if (ctx.params.description !== undefined) patch.description = nullableText_(ctx.params.description, 1000);
  if (ctx.params.isPublic !== undefined) patch.isPublic = bool_(ctx.params.isPublic);
  if (ctx.params.inviteOnly !== undefined) patch.inviteOnly = bool_(ctx.params.inviteOnly);
  if (ctx.params.iconAttachmentId !== undefined) {
    if (ctx.params.iconAttachmentId) requireAttachmentAccess_(ctx.params.iconAttachmentId, ctx.user.id, serverId, '');
    patch.iconAttachmentId = String(ctx.params.iconAttachmentId || '');
  }
  updateRow_('Servers', server._row, patch);
  var updated = requireServer_(serverId);
  audit_(serverId, ctx.user.id, 'SERVER_UPDATED', 'SERVER', serverId, patch);
  emitServerEvent_(serverId, 'SERVER_UPDATED', 'SERVER', serverId, {server: stripInternal_(updated)});
  return stripInternal_(updated);
}

function routeDeleteServer_(ctx) {
  var server = requireServer_(ctx.params.serverId);
  if (server.ownerId !== ctx.user.id) throw new ApiError_('OWNER_REQUIRED', 'Only the server creator can delete the server.');
  var now = nowIso_();
  updateRow_('Servers', server._row, {deletedAt: now, updatedAt: now});
  audit_(server.id, ctx.user.id, 'SERVER_DELETED', 'SERVER', server.id, {});
  emitServerEvent_(server.id, 'SERVER_DELETED', 'SERVER', server.id, {serverId: server.id});
  return {deleted: true, serverId: server.id};
}

function routeLeaveServer_(ctx) {
  var server = requireServer_(ctx.params.serverId);
  if (server.ownerId === ctx.user.id) throw new ApiError_('OWNER_CANNOT_LEAVE', 'Transfer ownership or delete the server before leaving.');
  var member = requireMember_(server.id, ctx.user.id).member;
  var now = nowIso_();
  updateRow_('Members', member._row, {leftAt: now, updatedAt: now});
  filter_('VoiceStates', function(v) { return v.serverId === server.id && v.userId === ctx.user.id; }).sort(function(a,b){return b._row-a._row;}).forEach(function(v){ deleteRow_('VoiceStates', v._row); });
  emitServerEvent_(server.id, 'MEMBER_LEFT', 'USER', ctx.user.id, {userId: ctx.user.id});
  return {left: true};
}

function routeTransferOwnership_(ctx) {
  var server = requireServer_(ctx.params.serverId);
  if (server.ownerId !== ctx.user.id) throw new ApiError_('OWNER_REQUIRED', 'Only the server creator can transfer ownership.');
  var targetId = String(ctx.params.userId || '');
  requireMember_(server.id, targetId);
  if (targetId === ctx.user.id) return {transferred: false, ownerId: ctx.user.id};
  var creatorRole = findOne_('Roles', function(r) { return r.serverId === server.id && r.managedKey === 'CREATOR'; });
  if (creatorRole) {
    var oldAssign = findOne_('MemberRoles', function(mr){return mr.serverId===server.id&&mr.userId===ctx.user.id&&mr.roleId===creatorRole.id;});
    if (oldAssign) deleteRow_('MemberRoles', oldAssign._row);
    if (!findOne_('MemberRoles', function(mr){return mr.serverId===server.id&&mr.userId===targetId&&mr.roleId===creatorRole.id;})) {
      insert_('MemberRoles', {id:id_('mrl'),serverId:server.id,userId:targetId,roleId:creatorRole.id,createdAt:nowIso_()});
    }
  }
  updateRow_('Servers', server._row, {ownerId: targetId, updatedAt: nowIso_()});
  audit_(server.id, ctx.user.id, 'OWNERSHIP_TRANSFERRED', 'USER', targetId, {previousOwnerId: ctx.user.id});
  emitServerEvent_(server.id, 'OWNERSHIP_TRANSFERRED', 'USER', targetId, {ownerId: targetId, previousOwnerId: ctx.user.id});
  return {transferred: true, ownerId: targetId};
}

function routeListMembers_(ctx) {
  var serverId = String(ctx.params.serverId || '');
  requireMember_(serverId, ctx.user.id);
  var users = {};
  rows_('Users').forEach(function(u){users[u.id]=u;});
  var roles = {};
  filter_('Roles', function(r){return r.serverId===serverId;}).forEach(function(r){roles[r.id]=r;});
  var assignments = filter_('MemberRoles', function(mr){return mr.serverId===serverId;});
  var byUser = {};
  assignments.forEach(function(mr){if(!byUser[mr.userId])byUser[mr.userId]=[];if(roles[mr.roleId])byUser[mr.userId].push(stripInternal_(roles[mr.roleId]));});
  return filter_('Members', function(m){return m.serverId===serverId&&!m.leftAt;}).map(function(m){
    return {id:m.id,serverId:m.serverId,userId:m.userId,nickname:m.nickname||'',joinedAt:m.joinedAt,timedOutUntil:m.timedOutUntil||'',user:publicUser_(users[m.userId]),roles:byUser[m.userId]||[]};
  });
}

function routeUpdateMember_(ctx) {
  var serverId = String(ctx.params.serverId || '');
  var targetId = String(ctx.params.userId || ctx.user.id);
  var target = requireMember_(serverId, targetId).member;
  if (targetId !== ctx.user.id) requirePermission_(serverId, ctx.user.id, PERMISSIONS.MANAGE_NICKNAMES);
  var patch = {updatedAt: nowIso_()};
  if (ctx.params.nickname !== undefined) patch.nickname = nullableText_(ctx.params.nickname, 64);
  if (ctx.params.timedOutUntil !== undefined) {
    requirePermission_(serverId, ctx.user.id, PERMISSIONS.MANAGE_MESSAGES);
    patch.timedOutUntil = ctx.params.timedOutUntil ? new Date(ctx.params.timedOutUntil).toISOString() : '';
  }
  updateRow_('Members', target._row, patch);
  audit_(serverId, ctx.user.id, 'MEMBER_UPDATED', 'USER', targetId, patch);
  emitServerEvent_(serverId, 'MEMBER_UPDATED', 'USER', targetId, {userId:targetId,patch:patch});
  return stripInternal_(requireMember_(serverId, targetId).member);
}

function routeKickMember_(ctx) {
  var server = requireServer_(ctx.params.serverId);
  requirePermission_(server.id, ctx.user.id, PERMISSIONS.KICK_MEMBERS);
  var targetId = String(ctx.params.userId || '');
  if (targetId === server.ownerId) throw new ApiError_('CANNOT_KICK_OWNER', 'The server creator cannot be kicked.');
  var target = requireMember_(server.id, targetId).member;
  var now = nowIso_();
  updateRow_('Members', target._row, {leftAt: now, updatedAt: now});
  filter_('VoiceStates', function(v){return v.serverId===server.id&&v.userId===targetId;}).sort(function(a,b){return b._row-a._row;}).forEach(function(v){deleteRow_('VoiceStates',v._row);});
  audit_(server.id,ctx.user.id,'MEMBER_KICKED','USER',targetId,{reason:nullableText_(ctx.params.reason,500)});
  emitServerEvent_(server.id,'MEMBER_KICKED','USER',targetId,{userId:targetId,reason:nullableText_(ctx.params.reason,500)});
  emitUserEvent_(targetId,'KICKED_FROM_SERVER','SERVER',server.id,{serverId:server.id,serverName:server.name});
  return {kicked:true,userId:targetId};
}

function routeBanMember_(ctx) {
  var server = requireServer_(ctx.params.serverId);
  requirePermission_(server.id, ctx.user.id, PERMISSIONS.BAN_MEMBERS);
  var targetId = String(ctx.params.userId || '');
  if (targetId === server.ownerId) throw new ApiError_('CANNOT_BAN_OWNER', 'The server creator cannot be banned.');
  var existing = findOne_('Bans', function(b){return b.serverId===server.id&&b.userId===targetId&&!b.revokedAt;});
  if (existing) return stripInternal_(existing);
  var now = nowIso_();
  var member = findOne_('Members', function(m){return m.serverId===server.id&&m.userId===targetId&&!m.leftAt;});
  if (member) updateRow_('Members', member._row, {leftAt:now,updatedAt:now});
  var ban = insert_('Bans',{id:id_('ban'),serverId:server.id,userId:targetId,actorId:ctx.user.id,reason:nullableText_(ctx.params.reason,500),createdAt:now,revokedAt:'',revokedBy:''});
  audit_(server.id,ctx.user.id,'MEMBER_BANNED','USER',targetId,{reason:ban.reason});
  emitServerEvent_(server.id,'MEMBER_BANNED','USER',targetId,{userId:targetId,reason:ban.reason});
  emitUserEvent_(targetId,'BANNED_FROM_SERVER','SERVER',server.id,{serverId:server.id,serverName:server.name});
  return stripInternal_(ban);
}

function routeUnbanMember_(ctx) {
  var serverId = String(ctx.params.serverId || '');
  requirePermission_(serverId, ctx.user.id, PERMISSIONS.BAN_MEMBERS);
  var targetId = String(ctx.params.userId || '');
  var ban = findOne_('Bans', function(b){return b.serverId===serverId&&b.userId===targetId&&!b.revokedAt;});
  if (!ban) throw new ApiError_('BAN_NOT_FOUND','Active ban not found.');
  updateRow_('Bans',ban._row,{revokedAt:nowIso_(),revokedBy:ctx.user.id});
  audit_(serverId,ctx.user.id,'MEMBER_UNBANNED','USER',targetId,{});
  emitServerEvent_(serverId,'MEMBER_UNBANNED','USER',targetId,{userId:targetId});
  return {unbanned:true,userId:targetId};
}

function routeListBans_(ctx) {
  var serverId=String(ctx.params.serverId||'');
  requirePermission_(serverId,ctx.user.id,PERMISSIONS.BAN_MEMBERS);
  var users={};rows_('Users').forEach(function(u){users[u.id]=u;});
  return filter_('Bans',function(b){return b.serverId===serverId&&!b.revokedAt;}).map(function(b){var o=stripInternal_(b);o.user=publicUser_(users[b.userId]);return o;});
}

/* =============================
 * ROLES AND INVITES
 * ============================= */

function routeListRoles_(ctx) {
  var serverId=String(ctx.params.serverId||'');
  requireMember_(serverId,ctx.user.id);
  return filter_('Roles',function(r){return r.serverId===serverId;}).sort(function(a,b){return num_(b.position,0)-num_(a.position,0);}).map(stripInternal_);
}

function validateRolePermissions_(serverId,actorId,permissions) {
  permissions=int_(permissions,0,0,PERMISSIONS.ALL);
  var server=requireServer_(serverId);
  if(server.ownerId===actorId)return permissions;
  var actorPerms=permissionsFor_(serverId,actorId);
  if((permissions & PERMISSIONS.ADMIN)===PERMISSIONS.ADMIN)throw new ApiError_('FORBIDDEN','Only the server creator can grant Administrator.');
  if((permissions & ~actorPerms)!==0)throw new ApiError_('FORBIDDEN','You cannot grant permissions you do not have.');
  return permissions;
}

function routeCreateRole_(ctx){
  var serverId=String(ctx.params.serverId||'');
  requirePermission_(serverId,ctx.user.id,PERMISSIONS.MANAGE_ROLES);
  var role=insert_('Roles',{id:id_('rol'),serverId:serverId,name:text_(ctx.params.name,64),color:nullableText_(ctx.params.color,16)||'#808080',permissions:validateRolePermissions_(serverId,ctx.user.id,ctx.params.permissions),position:int_(ctx.params.position,20,-1000,1000),isManaged:false,managedKey:'',createdAt:nowIso_(),updatedAt:nowIso_()});
  audit_(serverId,ctx.user.id,'ROLE_CREATED','ROLE',role.id,{name:role.name,permissions:role.permissions});
  emitServerEvent_(serverId,'ROLE_CREATED','ROLE',role.id,{role:stripInternal_(role)});
  return stripInternal_(role);
}

function routeUpdateRole_(ctx){
  var role=byId_('Roles',ctx.params.roleId,true);if(!role)throw new ApiError_('ROLE_NOT_FOUND','Role not found.');
  requirePermission_(role.serverId,ctx.user.id,PERMISSIONS.MANAGE_ROLES);
  if(bool_(role.isManaged)&&role.managedKey==='CREATOR'&&requireServer_(role.serverId).ownerId!==ctx.user.id)throw new ApiError_('FORBIDDEN','Only the server creator can change the Creator role.');
  var patch={updatedAt:nowIso_()};
  if(ctx.params.name!==undefined&&!bool_(role.isManaged))patch.name=text_(ctx.params.name,64);
  if(ctx.params.color!==undefined)patch.color=nullableText_(ctx.params.color,16)||'#808080';
  if(ctx.params.position!==undefined&&!bool_(role.isManaged))patch.position=int_(ctx.params.position,role.position,-1000,1000);
  if(ctx.params.permissions!==undefined)patch.permissions=validateRolePermissions_(role.serverId,ctx.user.id,ctx.params.permissions);
  updateRow_('Roles',role._row,patch);
  var updated=byId_('Roles',role.id,true);
  audit_(role.serverId,ctx.user.id,'ROLE_UPDATED','ROLE',role.id,patch);
  emitServerEvent_(role.serverId,'ROLE_UPDATED','ROLE',role.id,{role:stripInternal_(updated)});
  return stripInternal_(updated);
}

function routeDeleteRole_(ctx){
  var role=byId_('Roles',ctx.params.roleId,true);if(!role)throw new ApiError_('ROLE_NOT_FOUND','Role not found.');
  requirePermission_(role.serverId,ctx.user.id,PERMISSIONS.MANAGE_ROLES);
  if(bool_(role.isManaged))throw new ApiError_('MANAGED_ROLE','Managed roles cannot be deleted.');
  filter_('MemberRoles',function(mr){return mr.roleId===role.id;}).sort(function(a,b){return b._row-a._row;}).forEach(function(mr){deleteRow_('MemberRoles',mr._row);});
  deleteRow_('Roles',role._row);
  audit_(role.serverId,ctx.user.id,'ROLE_DELETED','ROLE',role.id,{name:role.name});
  emitServerEvent_(role.serverId,'ROLE_DELETED','ROLE',role.id,{roleId:role.id});
  return {deleted:true,roleId:role.id};
}

function routeAssignRole_(ctx){
  var serverId=String(ctx.params.serverId||''),userId=String(ctx.params.userId||''),roleId=String(ctx.params.roleId||'');
  requirePermission_(serverId,ctx.user.id,PERMISSIONS.MANAGE_ROLES);requireMember_(serverId,userId);
  var role=byId_('Roles',roleId,true);if(!role||role.serverId!==serverId)throw new ApiError_('ROLE_NOT_FOUND','Role not found.');
  if(role.managedKey==='CREATOR')throw new ApiError_('MANAGED_ROLE','Use transferOwnership for the Creator role.');
  validateRolePermissions_(serverId,ctx.user.id,role.permissions);
  var existing=findOne_('MemberRoles',function(mr){return mr.serverId===serverId&&mr.userId===userId&&mr.roleId===roleId;});
  if(!existing)insert_('MemberRoles',{id:id_('mrl'),serverId:serverId,userId:userId,roleId:roleId,createdAt:nowIso_()});
  audit_(serverId,ctx.user.id,'ROLE_ASSIGNED','USER',userId,{roleId:roleId});
  emitServerEvent_(serverId,'MEMBER_ROLES_UPDATED','USER',userId,{userId:userId});
  return {assigned:true};
}

function routeRemoveRole_(ctx){
  var serverId=String(ctx.params.serverId||''),userId=String(ctx.params.userId||''),roleId=String(ctx.params.roleId||'');
  requirePermission_(serverId,ctx.user.id,PERMISSIONS.MANAGE_ROLES);
  var role=byId_('Roles',roleId,true);if(!role||role.serverId!==serverId)throw new ApiError_('ROLE_NOT_FOUND','Role not found.');
  if(role.managedKey==='CREATOR')throw new ApiError_('MANAGED_ROLE','Use transferOwnership for the Creator role.');
  var existing=findOne_('MemberRoles',function(mr){return mr.serverId===serverId&&mr.userId===userId&&mr.roleId===roleId;});
  if(existing)deleteRow_('MemberRoles',existing._row);
  audit_(serverId,ctx.user.id,'ROLE_REMOVED','USER',userId,{roleId:roleId});
  emitServerEvent_(serverId,'MEMBER_ROLES_UPDATED','USER',userId,{userId:userId});
  return {removed:true};
}

function createInviteRecord_(serverId,createdBy,maxUses,expiresInHours){
  var code;
  do{code=randomCode_(12);}while(findOne_('Invites',function(i){return i.code===code;}));
  return insert_('Invites',{id:id_('inv'),serverId:serverId,code:code,createdBy:createdBy,maxUses:maxUses||0,uses:0,expiresAt:expiresInHours?addMsIso_(expiresInHours*3600000):'',revokedAt:'',createdAt:nowIso_()});
}

function validateInviteCode_(code,userId,consumeCheck){
  var invite=findOne_('Invites',function(i){return String(i.code)===String(code);});
  if(!invite||invite.revokedAt||isPast_(invite.expiresAt))throw new ApiError_('INVALID_INVITE','Invite is invalid or expired.');
  if(int_(invite.maxUses,0)>0&&int_(invite.uses,0)>=int_(invite.maxUses,0))throw new ApiError_('INVITE_EXHAUSTED','Invite has reached its maximum uses.');
  var server=requireServer_(invite.serverId);
  if(userId){
    var ban=findOne_('Bans',function(b){return b.serverId===server.id&&b.userId===userId&&!b.revokedAt;});
    if(ban)throw new ApiError_('BANNED','You are banned from this server.');
  }
  return invite;
}

function joinInviteForUser_(invite,userId){
  var existing=findOne_('Members',function(m){return m.serverId===invite.serverId&&m.userId===userId;});
  var now=nowIso_();
  if(existing){
    if(existing.leftAt)updateRow_('Members',existing._row,{leftAt:'',joinedAt:now,updatedAt:now,timedOutUntil:''});
    else return {joined:false,alreadyMember:true,serverId:invite.serverId};
  }else{
    insert_('Members',{id:id_('mem'),serverId:invite.serverId,userId:userId,nickname:'',joinedAt:now,updatedAt:now,leftAt:'',timedOutUntil:''});
  }
  var playerRole=findOne_('Roles',function(r){return r.serverId===invite.serverId&&r.managedKey==='PLAYER';});
  if(playerRole&&!findOne_('MemberRoles',function(mr){return mr.serverId===invite.serverId&&mr.userId===userId&&mr.roleId===playerRole.id;}))insert_('MemberRoles',{id:id_('mrl'),serverId:invite.serverId,userId:userId,roleId:playerRole.id,createdAt:now});
  updateRow_('Invites',invite._row,{uses:int_(invite.uses,0)+1});
  emitServerEvent_(invite.serverId,'MEMBER_JOINED','USER',userId,{userId:userId});
  return {joined:true,serverId:invite.serverId};
}

function routePreviewInvite_(ctx){
  var invite=validateInviteCode_(ctx.params.code||ctx.params.inviteCode,null,false),server=requireServer_(invite.serverId);
  return {code:invite.code,server:{id:server.id,name:server.name,description:server.description||'',iconAttachmentId:server.iconAttachmentId||''},expiresAt:invite.expiresAt||'',remainingUses:int_(invite.maxUses,0)>0?Math.max(0,int_(invite.maxUses,0)-int_(invite.uses,0)):null};
}

function routeCreateInvite_(ctx){
  var serverId=String(ctx.params.serverId||'');requirePermission_(serverId,ctx.user.id,PERMISSIONS.CREATE_INVITE);
  var invite=createInviteRecord_(serverId,ctx.user.id,int_(ctx.params.maxUses,0,0,10000),int_(ctx.params.expiresInHours,168,1,8760));
  audit_(serverId,ctx.user.id,'INVITE_CREATED','INVITE',invite.id,{maxUses:invite.maxUses,expiresAt:invite.expiresAt});
  return stripInternal_(invite);
}

function routeListInvites_(ctx){
  var serverId=String(ctx.params.serverId||'');requirePermission_(serverId,ctx.user.id,PERMISSIONS.CREATE_INVITE);
  return filter_('Invites',function(i){return i.serverId===serverId&&!i.revokedAt;}).map(stripInternal_);
}

function routeRevokeInvite_(ctx){
  var invite=byId_('Invites',ctx.params.inviteId,true);if(!invite)throw new ApiError_('INVITE_NOT_FOUND','Invite not found.');
  requirePermission_(invite.serverId,ctx.user.id,PERMISSIONS.CREATE_INVITE);updateRow_('Invites',invite._row,{revokedAt:nowIso_()});
  audit_(invite.serverId,ctx.user.id,'INVITE_REVOKED','INVITE',invite.id,{});return {revoked:true};
}

function routeJoinInvite_(ctx){
  var invite=validateInviteCode_(ctx.params.code||ctx.params.inviteCode,ctx.user.id,true);
  return joinInviteForUser_(invite,ctx.user.id);
}

/* =============================
 * CATEGORIES AND CHANNELS
 * ============================= */

function canViewChannel_(channel,userId){
  requireMember_(channel.serverId,userId);
  if(!bool_(channel.isPrivate))return true;
  if(requireServer_(channel.serverId).ownerId===userId)return true;
  var allowed=array_(channel.allowedRoleIds),member=findOne_('Members',function(m){return m.serverId===channel.serverId&&m.userId===userId&&!m.leftAt;});
  var ids=roleIds_(member);return allowed.some(function(id){return ids.indexOf(id)!==-1;});
}

function requireChannel_(channelId,userId){
  var channel=byId_('Channels',channelId);if(!channel)throw new ApiError_('CHANNEL_NOT_FOUND','Channel not found.');
  if(!canViewChannel_(channel,userId))throw new ApiError_('FORBIDDEN','You cannot access this channel.');
  return channel;
}

function publicChannel_(c){
  return {id:c.id,serverId:c.serverId,categoryId:c.categoryId||'',name:c.name,topic:c.topic||'',type:c.type,position:num_(c.position,0),userLimit:int_(c.userLimit,0),slowmodeSeconds:int_(c.slowmodeSeconds,0),isPrivate:bool_(c.isPrivate),allowedRoleIds:array_(c.allowedRoleIds),isSystem:bool_(c.isSystem),createdBy:c.createdBy,createdAt:c.createdAt,updatedAt:c.updatedAt};
}

function routeListCategories_(ctx){var serverId=String(ctx.params.serverId||'');requireMember_(serverId,ctx.user.id);return filter_('Categories',function(c){return c.serverId===serverId&&!c.deletedAt;}).sort(function(a,b){return num_(a.position,0)-num_(b.position,0);}).map(stripInternal_);}
function routeCreateCategory_(ctx){var serverId=String(ctx.params.serverId||'');requirePermission_(serverId,ctx.user.id,PERMISSIONS.MANAGE_CHANNELS);var now=nowIso_(),c=insert_('Categories',{id:id_('cat'),serverId:serverId,name:text_(ctx.params.name,64),position:int_(ctx.params.position,100,-1000,1000),createdBy:ctx.user.id,createdAt:now,updatedAt:now,deletedAt:''});audit_(serverId,ctx.user.id,'CATEGORY_CREATED','CATEGORY',c.id,{name:c.name});emitServerEvent_(serverId,'CATEGORY_CREATED','CATEGORY',c.id,{category:stripInternal_(c)});return stripInternal_(c);}
function routeUpdateCategory_(ctx){var c=byId_('Categories',ctx.params.categoryId);if(!c)throw new ApiError_('CATEGORY_NOT_FOUND','Category not found.');requirePermission_(c.serverId,ctx.user.id,PERMISSIONS.MANAGE_CHANNELS);var patch={updatedAt:nowIso_()};if(ctx.params.name!==undefined)patch.name=text_(ctx.params.name,64);if(ctx.params.position!==undefined)patch.position=int_(ctx.params.position,c.position,-1000,1000);updateRow_('Categories',c._row,patch);var u=byId_('Categories',c.id);emitServerEvent_(c.serverId,'CATEGORY_UPDATED','CATEGORY',c.id,{category:stripInternal_(u)});return stripInternal_(u);}
function routeDeleteCategory_(ctx){var c=byId_('Categories',ctx.params.categoryId);if(!c)throw new ApiError_('CATEGORY_NOT_FOUND','Category not found.');requirePermission_(c.serverId,ctx.user.id,PERMISSIONS.MANAGE_CHANNELS);var now=nowIso_();updateRow_('Categories',c._row,{deletedAt:now,updatedAt:now});filter_('Channels',function(ch){return ch.categoryId===c.id&&!ch.deletedAt;}).forEach(function(ch){updateRow_('Channels',ch._row,{categoryId:'',updatedAt:now});});emitServerEvent_(c.serverId,'CATEGORY_DELETED','CATEGORY',c.id,{categoryId:c.id});return {deleted:true};}

function routeListChannels_(ctx){var serverId=String(ctx.params.serverId||'');requireMember_(serverId,ctx.user.id);return filter_('Channels',function(c){return c.serverId===serverId&&!c.deletedAt&&canViewChannel_(c,ctx.user.id);}).sort(function(a,b){return num_(a.position,0)-num_(b.position,0);}).map(publicChannel_);}

function routeCreateChannel_(ctx){
  var serverId=String(ctx.params.serverId||'');requirePermission_(serverId,ctx.user.id,PERMISSIONS.MANAGE_CHANNELS);
  var type=String(ctx.params.type||ctx.params.channelType||'TEXT').toUpperCase();if(TTRPG.CHANNEL_TYPES.indexOf(type)===-1)throw new ApiError_('INVALID_CHANNEL_TYPE','Unsupported channel type.');
  var categoryId=String(ctx.params.categoryId||'');if(categoryId){var cat=byId_('Categories',categoryId);if(!cat||cat.serverId!==serverId)throw new ApiError_('CATEGORY_NOT_FOUND','Category not found.');}
  var now=nowIso_(),c=insert_('Channels',{id:id_('chn'),serverId:serverId,categoryId:categoryId,name:text_(ctx.params.name,64).toLowerCase().replace(/\s+/g,'-'),topic:nullableText_(ctx.params.topic,TTRPG.MAX_TOPIC_LENGTH),type:type,position:int_(ctx.params.position,100,-1000,1000),userLimit:int_(ctx.params.userLimit,0,0,99),slowmodeSeconds:int_(ctx.params.slowmodeSeconds,0,0,21600),isPrivate:bool_(ctx.params.isPrivate),allowedRoleIds:JSON.stringify(unique_(array_(ctx.params.allowedRoleIds))),isSystem:false,createdBy:ctx.user.id,createdAt:now,updatedAt:now,deletedAt:''});
  audit_(serverId,ctx.user.id,'CHANNEL_CREATED','CHANNEL',c.id,{name:c.name,type:c.type});emitServerEvent_(serverId,'CHANNEL_CREATED','CHANNEL',c.id,{channel:publicChannel_(c)});return publicChannel_(c);
}

function routeUpdateChannel_(ctx){
  var c=byId_('Channels',ctx.params.channelId);if(!c)throw new ApiError_('CHANNEL_NOT_FOUND','Channel not found.');requirePermission_(c.serverId,ctx.user.id,PERMISSIONS.MANAGE_CHANNELS);
  var patch={updatedAt:nowIso_()};if(ctx.params.name!==undefined){var n=text_(ctx.params.name,64).toLowerCase().replace(/\s+/g,'-');if(bool_(c.isSystem)&&n!=='general')throw new ApiError_('SYSTEM_CHANNEL','The general channel name is protected.');patch.name=n;}
  if(ctx.params.topic!==undefined)patch.topic=nullableText_(ctx.params.topic,TTRPG.MAX_TOPIC_LENGTH);
  if(ctx.params.type!==undefined){var type=String(ctx.params.type).toUpperCase();if(TTRPG.CHANNEL_TYPES.indexOf(type)===-1)throw new ApiError_('INVALID_CHANNEL_TYPE','Unsupported channel type.');patch.type=type;}
  if(ctx.params.position!==undefined)patch.position=int_(ctx.params.position,c.position,-1000,1000);
  if(ctx.params.userLimit!==undefined)patch.userLimit=int_(ctx.params.userLimit,0,0,99);
  if(ctx.params.slowmodeSeconds!==undefined)patch.slowmodeSeconds=int_(ctx.params.slowmodeSeconds,0,0,21600);
  if(ctx.params.isPrivate!==undefined)patch.isPrivate=bool_(ctx.params.isPrivate);
  if(ctx.params.allowedRoleIds!==undefined)patch.allowedRoleIds=JSON.stringify(unique_(array_(ctx.params.allowedRoleIds)));
  if(ctx.params.categoryId!==undefined){var cid=String(ctx.params.categoryId||'');if(cid){var cat=byId_('Categories',cid);if(!cat||cat.serverId!==c.serverId)throw new ApiError_('CATEGORY_NOT_FOUND','Category not found.');}patch.categoryId=cid;}
  updateRow_('Channels',c._row,patch);var u=byId_('Channels',c.id);audit_(c.serverId,ctx.user.id,'CHANNEL_UPDATED','CHANNEL',c.id,patch);emitServerEvent_(c.serverId,'CHANNEL_UPDATED','CHANNEL',c.id,{channel:publicChannel_(u)});return publicChannel_(u);
}

function routeDeleteChannel_(ctx){var c=byId_('Channels',ctx.params.channelId);if(!c)throw new ApiError_('CHANNEL_NOT_FOUND','Channel not found.');requirePermission_(c.serverId,ctx.user.id,PERMISSIONS.MANAGE_CHANNELS);if(bool_(c.isSystem))throw new ApiError_('SYSTEM_CHANNEL','The general channel cannot be deleted.');var now=nowIso_();updateRow_('Channels',c._row,{deletedAt:now,updatedAt:now});filter_('VoiceStates',function(v){return v.channelId===c.id;}).sort(function(a,b){return b._row-a._row;}).forEach(function(v){deleteRow_('VoiceStates',v._row);});audit_(c.serverId,ctx.user.id,'CHANNEL_DELETED','CHANNEL',c.id,{name:c.name});emitServerEvent_(c.serverId,'CHANNEL_DELETED','CHANNEL',c.id,{channelId:c.id});return {deleted:true};}

/* =============================
 * MESSAGE SCOPES, CHAT, REACTIONS
 * ============================= */

function requireScope_(scopeType,scopeId,userId,permission){
  scopeType=String(scopeType||'').toUpperCase();scopeId=String(scopeId||'');
  if(scopeType==='CHANNEL'){
    var channel=requireChannel_(scopeId,userId);
    if(permission)requirePermission_(channel.serverId,userId,permission);
    return {scopeType:'CHANNEL',scopeId:channel.id,serverId:channel.serverId,channel:channel};
  }
  if(scopeType==='DM'){
    var dm=requireDm_(scopeId,userId);
    return {scopeType:'DM',scopeId:dm.id,serverId:'',dm:dm};
  }
  throw new ApiError_('INVALID_SCOPE','Scope type must be CHANNEL or DM.');
}

function canAccessMessage_(message,userId){
  try{return !!requireScope_(message.scopeType,message.scopeId,userId);}catch(e){return false;}
}

function enforceSlowmode_(channel,userId){
  var seconds=int_(channel.slowmodeSeconds,0);if(seconds<=0||hasPermission_(channel.serverId,userId,PERMISSIONS.MANAGE_MESSAGES))return;
  var latest=filter_('Messages',function(m){return m.scopeType==='CHANNEL'&&m.scopeId===channel.id&&m.authorId===userId&&!m.deletedAt;}).sort(function(a,b){return new Date(b.createdAt)-new Date(a.createdAt);})[0];
  if(latest){var wait=seconds*1000-(Date.now()-new Date(latest.createdAt).getTime());if(wait>0)throw new ApiError_('SLOWMODE','Wait '+Math.ceil(wait/1000)+' seconds before sending another message.');}
}

function hydrateMessages_(messages){
  var users={},personas={},reactionsBy={},attachments={};
  rows_('Users').forEach(function(u){users[u.id]=u;});
  rows_('Personas').forEach(function(p){personas[p.id]=p;});
  var ids={};messages.forEach(function(m){ids[m.id]=true;array_(m.attachmentIds).forEach(function(a){attachments[a]=null;});});
  filter_('Reactions',function(r){return ids[r.messageId];}).forEach(function(r){if(!reactionsBy[r.messageId])reactionsBy[r.messageId]=[];reactionsBy[r.messageId].push({id:r.id,userId:r.userId,emoji:r.emoji,createdAt:r.createdAt});});
  rows_('Attachments').forEach(function(a){if(Object.prototype.hasOwnProperty.call(attachments,a.id))attachments[a.id]=publicAttachment_(a);});
  return messages.map(function(m){
    var out=stripInternal_(m);out.author=publicUser_(users[m.authorId]);out.persona=m.personaId&&personas[m.personaId]?publicPersona_(personas[m.personaId]):null;
    out.attachmentIds=array_(m.attachmentIds);out.attachments=out.attachmentIds.map(function(id){return attachments[id];}).filter(Boolean);
    out.mentionUserIds=array_(m.mentionUserIds);out.mentionRoleIds=array_(m.mentionRoleIds);out.mentionsEveryone=bool_(m.mentionsEveryone);out.isPinned=bool_(m.isPinned);out.reactions=reactionsBy[m.id]||[];
    return out;
  });
}

function routeListMessages_(ctx){
  var scope=requireScope_(ctx.params.scopeType||'CHANNEL',ctx.params.scopeId||ctx.params.channelId||ctx.params.dmId,ctx.user.id,ctx.params.scopeType==='DM'?null:PERMISSIONS.READ_MESSAGES);
  var limit=int_(ctx.params.limit,TTRPG.DEFAULT_PAGE_SIZE,1,TTRPG.MAX_RESULTS),before=String(ctx.params.before||'');
  var list=filter_('Messages',function(m){return m.scopeType===scope.scopeType&&m.scopeId===scope.scopeId;});
  list.sort(function(a,b){var d=new Date(b.createdAt)-new Date(a.createdAt);return d||String(b.id).localeCompare(String(a.id));});
  if(before){var beforeMsg=byId_('Messages',before,true),ts=beforeMsg?new Date(beforeMsg.createdAt).getTime():new Date(before).getTime();if(isFinite(ts))list=list.filter(function(m){return new Date(m.createdAt).getTime()<ts;});}
  var page=list.slice(0,limit),next=page.length===limit?page[page.length-1].id:'';
  return {messages:hydrateMessages_(page.reverse()),nextCursor:next,hasMore:list.length>limit};
}

function routeSendMessage_(ctx){
  var p=ctx.params,scope=requireScope_(p.scopeType||'CHANNEL',p.scopeId||p.channelId||p.dmId,ctx.user.id);
  if(scope.scopeType==='CHANNEL'){
    requirePermission_(scope.serverId,ctx.user.id,PERMISSIONS.SEND_MESSAGES);
    enforceSlowmode_(scope.channel,ctx.user.id);
    if(scope.channel.type==='HANDOUTS'&&!hasPermission_(scope.serverId,ctx.user.id,PERMISSIONS.MANAGE_HANDOUTS)&&String(p.messageType||'CHAT').toUpperCase()==='HANDOUT')throw new ApiError_('FORBIDDEN','You cannot publish handouts.');
  }
  var content=nullableText_(p.content,TTRPG.MAX_MESSAGE_LENGTH),attachmentIds=unique_(array_(p.attachmentIds));
  if(!content&&attachmentIds.length===0)throw new ApiError_('EMPTY_MESSAGE','Message needs text or an attachment.');
  if(attachmentIds.length>10)throw new ApiError_('TOO_MANY_ATTACHMENTS','A message can contain up to 10 attachments.');
  var messageType=String(p.messageType||'CHAT').toUpperCase();if(TTRPG.MESSAGE_TYPES.indexOf(messageType)===-1)throw new ApiError_('INVALID_MESSAGE_TYPE','Unsupported message type.');
  var personaId=String(p.personaId||'');if(personaId){var persona=requirePersona_(personaId,ctx.user.id);if(scope.serverId&&persona.serverId!==scope.serverId)throw new ApiError_('INVALID_PERSONA','Persona belongs to a different server.');}
  var replyToId=String(p.replyToId||'');if(replyToId){var reply=byId_('Messages',replyToId,true);if(!reply||reply.scopeType!==scope.scopeType||reply.scopeId!==scope.scopeId)throw new ApiError_('INVALID_REPLY','Reply target is not in this conversation.');}
  var mentionUsers=unique_(array_(p.mentionUserIds)),mentionRoles=unique_(array_(p.mentionRoleIds)),everyone=bool_(p.mentionsEveryone);
  if(everyone&&scope.serverId&&!hasPermission_(scope.serverId,ctx.user.id,PERMISSIONS.MENTION_EVERYONE))throw new ApiError_('FORBIDDEN','You cannot mention everyone.');
  attachmentIds.forEach(function(aid){requireAttachmentAccess_(aid,ctx.user.id,scope.serverId,scope.scopeType==='DM'?scope.scopeId:'');});
  var now=nowIso_(),m=insert_('Messages',{id:id_('msg'),scopeType:scope.scopeType,scopeId:scope.scopeId,serverId:scope.serverId,authorId:ctx.user.id,personaId:personaId,messageType:messageType,content:content,attachmentIds:JSON.stringify(attachmentIds),replyToId:replyToId,mentionUserIds:JSON.stringify(mentionUsers),mentionRoleIds:JSON.stringify(mentionRoles),mentionsEveryone:everyone,isPinned:false,pinnedBy:'',pinnedAt:'',createdAt:now,editedAt:'',deletedAt:'',deletedBy:''});
  attachmentIds.forEach(function(aid){var a=byId_('Attachments',aid,true);updateRow_('Attachments',a._row,{scopeType:scope.scopeType,scopeId:scope.scopeId,serverId:scope.serverId,dmId:scope.scopeType==='DM'?scope.scopeId:'',messageId:m.id});});
  var full=hydrateMessages_([m])[0];emitScopeEvent_(scope,'MESSAGE_CREATED','MESSAGE',m.id,{message:full});
  createMessageNotifications_(scope,m,mentionUsers,mentionRoles,everyone);
  return full;
}

function createMessageNotifications_(scope,message,mentionUsers,mentionRoles,everyone){
  var targets={};mentionUsers.forEach(function(id){targets[id]=true;});
  if(scope.scopeType==='DM')filter_('DmParticipants',function(dp){return dp.dmId===scope.scopeId&&!dp.leftAt&&dp.userId!==message.authorId;}).forEach(function(dp){targets[dp.userId]=true;});
  if(scope.serverId&&(everyone||mentionRoles.length)){
    filter_('Members',function(m){return m.serverId===scope.serverId&&!m.leftAt&&m.userId!==message.authorId;}).forEach(function(m){if(everyone)targets[m.userId]=true;else{var ids=roleIds_(m);if(mentionRoles.some(function(r){return ids.indexOf(r)!==-1;}))targets[m.userId]=true;}});
  }
  Object.keys(targets).forEach(function(userId){if(userId!==message.authorId)createNotification_(userId,scope.scopeType==='DM'?'DIRECT_MESSAGE':'MENTION',message.authorId,scope.scopeType,scope.scopeId,message.id,{preview:String(message.content||'').slice(0,200)});});
}

function routeEditMessage_(ctx){
  var m=byId_('Messages',ctx.params.messageId,true);if(!m||m.deletedAt)throw new ApiError_('MESSAGE_NOT_FOUND','Message not found.');requireScope_(m.scopeType,m.scopeId,ctx.user.id);
  if(m.authorId!==ctx.user.id)throw new ApiError_('FORBIDDEN','Only the author can edit a message.');
  var content=nullableText_(ctx.params.content,TTRPG.MAX_MESSAGE_LENGTH);if(!content&&array_(m.attachmentIds).length===0)throw new ApiError_('EMPTY_MESSAGE','Message needs text or an attachment.');
  updateRow_('Messages',m._row,{content:content,editedAt:nowIso_()});var u=byId_('Messages',m.id,true),scope=requireScope_(u.scopeType,u.scopeId,ctx.user.id);emitScopeEvent_(scope,'MESSAGE_UPDATED','MESSAGE',u.id,{message:hydrateMessages_([u])[0]});return hydrateMessages_([u])[0];
}

function routeDeleteMessage_(ctx){
  var m=byId_('Messages',ctx.params.messageId,true);if(!m||m.deletedAt)throw new ApiError_('MESSAGE_NOT_FOUND','Message not found.');var scope=requireScope_(m.scopeType,m.scopeId,ctx.user.id);
  var can=m.authorId===ctx.user.id||(scope.serverId&&hasPermission_(scope.serverId,ctx.user.id,PERMISSIONS.MANAGE_MESSAGES));if(!can)throw new ApiError_('FORBIDDEN','You cannot delete this message.');
  var now=nowIso_();updateRow_('Messages',m._row,{content:'This message has been deleted.',attachmentIds:'[]',deletedAt:now,deletedBy:ctx.user.id,editedAt:now,isPinned:false,pinnedBy:'',pinnedAt:''});
  emitScopeEvent_(scope,'MESSAGE_DELETED','MESSAGE',m.id,{messageId:m.id,deletedBy:ctx.user.id});return {deleted:true,messageId:m.id};
}

function routePurgeMessages_(ctx){
  var scope=requireScope_(ctx.params.scopeType||'CHANNEL',ctx.params.scopeId||ctx.params.channelId||ctx.params.dmId,ctx.user.id);
  if(scope.serverId)requirePermission_(scope.serverId,ctx.user.id,PERMISSIONS.MANAGE_MESSAGES);else{var dm=requireDm_(scope.scopeId,ctx.user.id);if(dm.ownerId&&dm.ownerId!==ctx.user.id&&dm.type==='GROUP')throw new ApiError_('FORBIDDEN','Only the group owner can purge this DM.');}
  var now=nowIso_(),count=0;filter_('Messages',function(m){return m.scopeType===scope.scopeType&&m.scopeId===scope.scopeId&&!m.deletedAt;}).forEach(function(m){updateRow_('Messages',m._row,{content:'This message has been deleted.',attachmentIds:'[]',deletedAt:now,deletedBy:ctx.user.id,editedAt:now,isPinned:false});count++;});
  emitScopeEvent_(scope,'MESSAGES_PURGED',scope.scopeType,scope.scopeId,{count:count,actorId:ctx.user.id});return {purged:count};
}

function routePinMessage_(ctx){
  var m=byId_('Messages',ctx.params.messageId,true);if(!m||m.deletedAt)throw new ApiError_('MESSAGE_NOT_FOUND','Message not found.');var scope=requireScope_(m.scopeType,m.scopeId,ctx.user.id);
  if(scope.serverId)requirePermission_(scope.serverId,ctx.user.id,PERMISSIONS.MANAGE_MESSAGES);
  var pinned=ctx.params.pinned===undefined?true:bool_(ctx.params.pinned),now=nowIso_();updateRow_('Messages',m._row,{isPinned:pinned,pinnedBy:pinned?ctx.user.id:'',pinnedAt:pinned?now:''});
  emitScopeEvent_(scope,pinned?'MESSAGE_PINNED':'MESSAGE_UNPINNED','MESSAGE',m.id,{messageId:m.id,actorId:ctx.user.id});return {messageId:m.id,pinned:pinned};
}

function routeListPins_(ctx){var scope=requireScope_(ctx.params.scopeType||'CHANNEL',ctx.params.scopeId||ctx.params.channelId||ctx.params.dmId,ctx.user.id);return hydrateMessages_(filter_('Messages',function(m){return m.scopeType===scope.scopeType&&m.scopeId===scope.scopeId&&bool_(m.isPinned)&&!m.deletedAt;}).sort(function(a,b){return new Date(b.pinnedAt)-new Date(a.pinnedAt);}));}

function routeAddReaction_(ctx){
  var m=byId_('Messages',ctx.params.messageId,true);if(!m||m.deletedAt)throw new ApiError_('MESSAGE_NOT_FOUND','Message not found.');var scope=requireScope_(m.scopeType,m.scopeId,ctx.user.id),emoji=text_(ctx.params.emoji,32);
  var existing=findOne_('Reactions',function(r){return r.messageId===m.id&&r.userId===ctx.user.id&&r.emoji===emoji;});if(!existing)existing=insert_('Reactions',{id:id_('rea'),messageId:m.id,userId:ctx.user.id,emoji:emoji,createdAt:nowIso_()});
  emitScopeEvent_(scope,'REACTION_ADDED','MESSAGE',m.id,{messageId:m.id,reaction:stripInternal_(existing)});return stripInternal_(existing);
}

function routeRemoveReaction_(ctx){
  var m=byId_('Messages',ctx.params.messageId,true);if(!m)throw new ApiError_('MESSAGE_NOT_FOUND','Message not found.');var scope=requireScope_(m.scopeType,m.scopeId,ctx.user.id),emoji=text_(ctx.params.emoji,32);
  var r=findOne_('Reactions',function(x){return x.messageId===m.id&&x.userId===ctx.user.id&&x.emoji===emoji;});if(r)deleteRow_('Reactions',r._row);
  emitScopeEvent_(scope,'REACTION_REMOVED','MESSAGE',m.id,{messageId:m.id,userId:ctx.user.id,emoji:emoji});return {removed:true};
}

function routeSearchMessages_(ctx){
  var scope=requireScope_(ctx.params.scopeType||'CHANNEL',ctx.params.scopeId||ctx.params.channelId||ctx.params.dmId,ctx.user.id),q=lower_(text_(ctx.params.query||ctx.params.q,200)),limit=int_(ctx.params.limit,50,1,100);
  var list=filter_('Messages',function(m){return m.scopeType===scope.scopeType&&m.scopeId===scope.scopeId&&!m.deletedAt&&lower_(m.content).indexOf(q)!==-1;}).sort(function(a,b){return new Date(b.createdAt)-new Date(a.createdAt);}).slice(0,limit);
  return hydrateMessages_(list);
}

function routeStartTyping_(ctx){
  var scope=requireScope_(ctx.params.scopeType||'CHANNEL',ctx.params.scopeId||ctx.params.channelId||ctx.params.dmId,ctx.user.id),now=nowIso_(),expires=addMsIso_(TTRPG.TYPING_TTL_SECONDS*1000);
  var t=findOne_('Typing',function(x){return x.scopeType===scope.scopeType&&x.scopeId===scope.scopeId&&x.userId===ctx.user.id;});if(t)updateRow_('Typing',t._row,{expiresAt:expires,updatedAt:now});else t=insert_('Typing',{id:id_('typ'),scopeType:scope.scopeType,scopeId:scope.scopeId,userId:ctx.user.id,expiresAt:expires,updatedAt:now});
  emitScopeEvent_(scope,'TYPING_STARTED','USER',ctx.user.id,{userId:ctx.user.id,expiresAt:expires});return {typing:true,expiresAt:expires};
}

function routeListTyping_(ctx){var scope=requireScope_(ctx.params.scopeType||'CHANNEL',ctx.params.scopeId||ctx.params.channelId||ctx.params.dmId,ctx.user.id),users={};rows_('Users').forEach(function(u){users[u.id]=u;});return filter_('Typing',function(t){return t.scopeType===scope.scopeType&&t.scopeId===scope.scopeId&&isFuture_(t.expiresAt)&&t.userId!==ctx.user.id;}).map(function(t){return {userId:t.userId,user:publicUser_(users[t.userId]),expiresAt:t.expiresAt};});}

function routeMarkRead_(ctx){
  var channel=requireChannel_(ctx.params.channelId,ctx.user.id),messageId=String(ctx.params.messageId||'');if(messageId){var m=byId_('Messages',messageId,true);if(!m||m.scopeType!=='CHANNEL'||m.scopeId!==channel.id)throw new ApiError_('INVALID_MESSAGE','Message is not in this channel.');}
  var row=findOne_('ChannelReads',function(r){return r.channelId===channel.id&&r.userId===ctx.user.id;}),now=nowIso_();if(row)updateRow_('ChannelReads',row._row,{lastMessageId:messageId,lastReadAt:now});else insert_('ChannelReads',{id:id_('red'),channelId:channel.id,userId:ctx.user.id,lastMessageId:messageId,lastReadAt:now});return {read:true,lastReadAt:now};
}

function routeUnreadCounts_(ctx){
  var serverId=String(ctx.params.serverId||'');requireMember_(serverId,ctx.user.id);var reads={};filter_('ChannelReads',function(r){return r.userId===ctx.user.id;}).forEach(function(r){reads[r.channelId]=r;});
  var out={};filter_('Channels',function(c){return c.serverId===serverId&&!c.deletedAt&&canViewChannel_(c,ctx.user.id);}).forEach(function(c){var since=reads[c.id]?new Date(reads[c.id].lastReadAt).getTime():0;out[c.id]=filter_('Messages',function(m){return m.scopeType==='CHANNEL'&&m.scopeId===c.id&&!m.deletedAt&&m.authorId!==ctx.user.id&&new Date(m.createdAt).getTime()>since;}).length;});return out;
}

/* =============================
 * DIRECT MESSAGES AND GROUP DMS
 * ============================= */

function requireDm_(dmId,userId){
  var dm=byId_('DmChannels',String(dmId||''),true);if(!dm||dm.closedAt)throw new ApiError_('DM_NOT_FOUND','Conversation not found.');
  var participant=findOne_('DmParticipants',function(dp){return dp.dmId===dm.id&&dp.userId===userId&&!dp.leftAt;});if(!participant)throw new ApiError_('FORBIDDEN','You are not a participant in this conversation.');
  return dm;
}

function dmParticipants_(dmId){
  var users={};rows_('Users').forEach(function(u){users[u.id]=u;});
  return filter_('DmParticipants',function(dp){return dp.dmId===dmId&&!dp.leftAt;}).map(function(dp){return {id:dp.id,userId:dp.userId,role:dp.role,joinedAt:dp.joinedAt,user:publicUser_(users[dp.userId])};});
}

function publicDm_(dm,userId){
  var participants=dmParticipants_(dm.id),others=participants.filter(function(p){return p.userId!==userId;});
  var name=dm.name||'';if(!name&&dm.type==='DIRECT'&&others[0])name=others[0].user.username;
  return {id:dm.id,type:dm.type,name:name,iconAttachmentId:dm.iconAttachmentId||'',ownerId:dm.ownerId||'',participants:participants,createdAt:dm.createdAt,updatedAt:dm.updatedAt};
}

function assertNotBlocked_(a,b){
  var blocked=findOne_('SafetyRelations',function(r){return !r.revokedAt&&r.type==='BLOCK'&&((r.userId===a&&r.targetUserId===b)||(r.userId===b&&r.targetUserId===a));});
  if(blocked)throw new ApiError_('BLOCKED','This interaction is unavailable.');
}

function routeCreateDm_(ctx){
  var recipientId=String(ctx.params.recipientId||ctx.params.userId||'');if(recipientId===ctx.user.id)throw new ApiError_('INVALID_RECIPIENT','You cannot create a DM with yourself.');
  var recipient=byId_('Users',recipientId,true);if(!recipient||bool_(recipient.disabled))throw new ApiError_('USER_NOT_FOUND','User not found.');assertNotBlocked_(ctx.user.id,recipientId);
  var key=pairKey_(ctx.user.id,recipientId),dm=findOne_('DmChannels',function(d){return d.type==='DIRECT'&&d.pairKey===key;});var now=nowIso_();
  if(dm){if(dm.closedAt)updateRow_('DmChannels',dm._row,{closedAt:'',updatedAt:now});[ctx.user.id,recipientId].forEach(function(uid){var dp=findOne_('DmParticipants',function(x){return x.dmId===dm.id&&x.userId===uid;});if(dp&&dp.leftAt)updateRow_('DmParticipants',dp._row,{leftAt:'',joinedAt:now});else if(!dp)insert_('DmParticipants',{id:id_('dmp'),dmId:dm.id,userId:uid,role:'MEMBER',joinedAt:now,leftAt:''});});dm=byId_('DmChannels',dm.id,true);}
  else{dm=insert_('DmChannels',{id:id_('dm'),type:'DIRECT',pairKey:key,name:'',iconAttachmentId:'',ownerId:'',createdAt:now,updatedAt:now,closedAt:''});insert_('DmParticipants',{id:id_('dmp'),dmId:dm.id,userId:ctx.user.id,role:'MEMBER',joinedAt:now,leftAt:''});insert_('DmParticipants',{id:id_('dmp'),dmId:dm.id,userId:recipientId,role:'MEMBER',joinedAt:now,leftAt:''});}
  emitUserEvent_(recipientId,'DM_CREATED','DM',dm.id,{dmId:dm.id,actorId:ctx.user.id});return publicDm_(dm,ctx.user.id);
}

function routeCreateGroupDm_(ctx){
  var ids=unique_(array_(ctx.params.recipientIds)).filter(function(id){return id!==ctx.user.id;});if(ids.length<1||ids.length>19)throw new ApiError_('INVALID_RECIPIENTS','Group DM requires 1–19 other participants.');
  ids.forEach(function(uid){var u=byId_('Users',uid,true);if(!u||bool_(u.disabled))throw new ApiError_('USER_NOT_FOUND','A recipient was not found.');assertNotBlocked_(ctx.user.id,uid);});
  var now=nowIso_(),dm=insert_('DmChannels',{id:id_('dm'),type:'GROUP',pairKey:'',name:nullableText_(ctx.params.name,80)||'Adventuring Party',iconAttachmentId:'',ownerId:ctx.user.id,createdAt:now,updatedAt:now,closedAt:''});
  insert_('DmParticipants',{id:id_('dmp'),dmId:dm.id,userId:ctx.user.id,role:'OWNER',joinedAt:now,leftAt:''});ids.forEach(function(uid){insert_('DmParticipants',{id:id_('dmp'),dmId:dm.id,userId:uid,role:'MEMBER',joinedAt:now,leftAt:''});emitUserEvent_(uid,'GROUP_DM_CREATED','DM',dm.id,{dmId:dm.id,actorId:ctx.user.id});});
  return publicDm_(dm,ctx.user.id);
}

function routeListDms_(ctx){
  var ids={};filter_('DmParticipants',function(dp){return dp.userId===ctx.user.id&&!dp.leftAt;}).forEach(function(dp){ids[dp.dmId]=true;});
  return filter_('DmChannels',function(dm){return ids[dm.id]&&!dm.closedAt;}).sort(function(a,b){return new Date(b.updatedAt)-new Date(a.updatedAt);}).map(function(dm){var out=publicDm_(dm,ctx.user.id),last=filter_('Messages',function(m){return m.scopeType==='DM'&&m.scopeId===dm.id;}).sort(function(a,b){return new Date(b.createdAt)-new Date(a.createdAt);})[0];out.lastMessage=last?hydrateMessages_([last])[0]:null;return out;});
}

function routeGetDm_(ctx){var dm=requireDm_(ctx.params.dmId,ctx.user.id);return publicDm_(dm,ctx.user.id);}

function routeUpdateGroupDm_(ctx){
  var dm=requireDm_(ctx.params.dmId,ctx.user.id);if(dm.type!=='GROUP'||dm.ownerId!==ctx.user.id)throw new ApiError_('FORBIDDEN','Only the group owner can update this conversation.');var patch={updatedAt:nowIso_()};
  if(ctx.params.name!==undefined)patch.name=nullableText_(ctx.params.name,80)||'Adventuring Party';if(ctx.params.iconAttachmentId!==undefined){if(ctx.params.iconAttachmentId)requireOwnedAttachment_(ctx.params.iconAttachmentId,ctx.user.id);patch.iconAttachmentId=String(ctx.params.iconAttachmentId||'');}
  updateRow_('DmChannels',dm._row,patch);var u=byId_('DmChannels',dm.id,true);emitDmEvent_(dm.id,'DM_UPDATED','DM',dm.id,{dm:publicDm_(u,ctx.user.id)});return publicDm_(u,ctx.user.id);
}

function routeAddDmParticipant_(ctx){
  var dm=requireDm_(ctx.params.dmId,ctx.user.id);if(dm.type!=='GROUP'||dm.ownerId!==ctx.user.id)throw new ApiError_('FORBIDDEN','Only the group owner can add participants.');var uid=String(ctx.params.userId||'');var u=byId_('Users',uid,true);if(!u||bool_(u.disabled))throw new ApiError_('USER_NOT_FOUND','User not found.');assertNotBlocked_(ctx.user.id,uid);
  var current=dmParticipants_(dm.id);if(current.length>=20)throw new ApiError_('GROUP_FULL','Group DMs support up to 20 participants.');var dp=findOne_('DmParticipants',function(x){return x.dmId===dm.id&&x.userId===uid;});var now=nowIso_();if(dp)updateRow_('DmParticipants',dp._row,{leftAt:'',joinedAt:now,role:'MEMBER'});else insert_('DmParticipants',{id:id_('dmp'),dmId:dm.id,userId:uid,role:'MEMBER',joinedAt:now,leftAt:''});emitDmEvent_(dm.id,'DM_PARTICIPANT_ADDED','USER',uid,{userId:uid});emitUserEvent_(uid,'GROUP_DM_CREATED','DM',dm.id,{dmId:dm.id,actorId:ctx.user.id});return {added:true};
}

function routeRemoveDmParticipant_(ctx){
  var dm=requireDm_(ctx.params.dmId,ctx.user.id),uid=String(ctx.params.userId||ctx.user.id);if(dm.type!=='GROUP')throw new ApiError_('INVALID_DM','Participants can only be removed from group DMs.');if(uid!==ctx.user.id&&dm.ownerId!==ctx.user.id)throw new ApiError_('FORBIDDEN','Only the group owner can remove another participant.');if(uid===dm.ownerId)throw new ApiError_('OWNER_CANNOT_LEAVE','Transfer group ownership before leaving.');
  var dp=findOne_('DmParticipants',function(x){return x.dmId===dm.id&&x.userId===uid&&!x.leftAt;});if(dp)updateRow_('DmParticipants',dp._row,{leftAt:nowIso_()});emitDmEvent_(dm.id,'DM_PARTICIPANT_REMOVED','USER',uid,{userId:uid});return {removed:true};
}

function routeTransferDmOwnership_(ctx){var dm=requireDm_(ctx.params.dmId,ctx.user.id);if(dm.type!=='GROUP'||dm.ownerId!==ctx.user.id)throw new ApiError_('FORBIDDEN','Only the group owner can transfer ownership.');var uid=String(ctx.params.userId||'');var target=findOne_('DmParticipants',function(x){return x.dmId===dm.id&&x.userId===uid&&!x.leftAt;});if(!target)throw new ApiError_('NOT_A_PARTICIPANT','Target is not in this DM.');var old=findOne_('DmParticipants',function(x){return x.dmId===dm.id&&x.userId===ctx.user.id&&!x.leftAt;});updateRow_('DmChannels',dm._row,{ownerId:uid,updatedAt:nowIso_()});updateRow_('DmParticipants',target._row,{role:'OWNER'});if(old)updateRow_('DmParticipants',old._row,{role:'MEMBER'});emitDmEvent_(dm.id,'DM_OWNERSHIP_TRANSFERRED','USER',uid,{ownerId:uid});return {transferred:true,ownerId:uid};}

function routeCloseDm_(ctx){var dm=requireDm_(ctx.params.dmId,ctx.user.id),dp=findOne_('DmParticipants',function(x){return x.dmId===dm.id&&x.userId===ctx.user.id&&!x.leftAt;});if(dm.type==='GROUP'&&dm.ownerId===ctx.user.id)throw new ApiError_('OWNER_CANNOT_LEAVE','Transfer group ownership before leaving.');if(dp)updateRow_('DmParticipants',dp._row,{leftAt:nowIso_()});var remain=filter_('DmParticipants',function(x){return x.dmId===dm.id&&!x.leftAt;});if(remain.length===0)updateRow_('DmChannels',dm._row,{closedAt:nowIso_(),updatedAt:nowIso_()});return {closed:true};}

/* =============================
 * FRIENDS, BLOCKS, IGNORES
 * ============================= */

function routeListFriends_(ctx){
  var users={};rows_('Users').forEach(function(u){users[u.id]=u;});
  return filter_('Friendships',function(f){return (f.requesterId===ctx.user.id||f.addresseeId===ctx.user.id)&&f.status!=='REMOVED';}).map(function(f){var other=f.requesterId===ctx.user.id?f.addresseeId:f.requesterId;return {id:f.id,status:f.status,direction:f.requesterId===ctx.user.id?'OUTGOING':'INCOMING',otherUser:publicUser_(users[other]),createdAt:f.createdAt,updatedAt:f.updatedAt};});
}

function resolveUserTarget_(p){
  if(p.userId){var by=byId_('Users',String(p.userId),true);if(by)return by;}
  var tag=String(p.username||p.tag||'').trim(),disc=String(p.discriminator||'').trim();if(tag.indexOf('#')!==-1){var parts=tag.split('#');tag=parts.slice(0,-1).join('#');disc=parts[parts.length-1];}
  return findOne_('Users',function(u){return lower_(u.username)===lower_(tag)&&(!disc||String(u.discriminator)===disc);});
}

function routeSendFriendRequest_(ctx){
  var target=resolveUserTarget_(ctx.params);if(!target||bool_(target.disabled))throw new ApiError_('USER_NOT_FOUND','User not found.');if(target.id===ctx.user.id)throw new ApiError_('INVALID_TARGET','You cannot friend yourself.');assertNotBlocked_(ctx.user.id,target.id);
  var key=pairKey_(ctx.user.id,target.id),f=findOne_('Friendships',function(x){return x.pairKey===key;});var now=nowIso_();if(f&&f.status==='ACCEPTED')return {id:f.id,status:f.status};if(f)updateRow_('Friendships',f._row,{requesterId:ctx.user.id,addresseeId:target.id,status:'PENDING',updatedAt:now});else f=insert_('Friendships',{id:id_('fri'),pairKey:key,requesterId:ctx.user.id,addresseeId:target.id,status:'PENDING',createdAt:now,updatedAt:now});
  createNotification_(target.id,'FRIEND_REQUEST',ctx.user.id,'USER',ctx.user.id,'',{friendshipId:f.id});emitUserEvent_(target.id,'FRIEND_REQUESTED','FRIENDSHIP',f.id,{friendshipId:f.id,actor:publicUser_(ctx.user)});return {id:f.id,status:'PENDING'};
}

function requireFriendship_(id,userId){var f=byId_('Friendships',id,true);if(!f||(f.requesterId!==userId&&f.addresseeId!==userId))throw new ApiError_('FRIENDSHIP_NOT_FOUND','Friendship not found.');return f;}
function routeAcceptFriend_(ctx){var f=requireFriendship_(ctx.params.friendshipId,ctx.user.id);if(f.addresseeId!==ctx.user.id||f.status!=='PENDING')throw new ApiError_('INVALID_FRIEND_REQUEST','This request cannot be accepted.');updateRow_('Friendships',f._row,{status:'ACCEPTED',updatedAt:nowIso_()});emitUserEvent_(f.requesterId,'FRIEND_ACCEPTED','FRIENDSHIP',f.id,{friendshipId:f.id,actor:publicUser_(ctx.user)});return {id:f.id,status:'ACCEPTED'};}
function routeDeclineFriend_(ctx){var f=requireFriendship_(ctx.params.friendshipId,ctx.user.id);if(f.addresseeId!==ctx.user.id||f.status!=='PENDING')throw new ApiError_('INVALID_FRIEND_REQUEST','This request cannot be declined.');updateRow_('Friendships',f._row,{status:'DECLINED',updatedAt:nowIso_()});emitUserEvent_(f.requesterId,'FRIEND_DECLINED','FRIENDSHIP',f.id,{friendshipId:f.id});return {id:f.id,status:'DECLINED'};}
function routeRemoveFriend_(ctx){var f=requireFriendship_(ctx.params.friendshipId,ctx.user.id);updateRow_('Friendships',f._row,{status:'REMOVED',updatedAt:nowIso_()});var other=f.requesterId===ctx.user.id?f.addresseeId:f.requesterId;emitUserEvent_(other,'FRIEND_REMOVED','FRIENDSHIP',f.id,{friendshipId:f.id});return {removed:true};}

function safetySet_(userId,type){var set={};filter_('SafetyRelations',function(r){return r.userId===userId&&r.type===type&&!r.revokedAt;}).forEach(function(r){set[r.targetUserId]=true;});return set;}
function setSafetyRelation_(userId,targetId,type,active){
  if(userId===targetId)throw new ApiError_('INVALID_TARGET','You cannot target yourself.');var target=byId_('Users',targetId,true);if(!target)throw new ApiError_('USER_NOT_FOUND','User not found.');
  var r=findOne_('SafetyRelations',function(x){return x.userId===userId&&x.targetUserId===targetId&&x.type===type&&!x.revokedAt;});if(active&&!r)r=insert_('SafetyRelations',{id:id_('saf'),userId:userId,targetUserId:targetId,type:type,createdAt:nowIso_(),revokedAt:''});if(!active&&r)updateRow_('SafetyRelations',r._row,{revokedAt:nowIso_()});
  if(type==='BLOCK'&&active){var f=findOne_('Friendships',function(x){return x.pairKey===pairKey_(userId,targetId)&&x.status!=='REMOVED';});if(f)updateRow_('Friendships',f._row,{status:'REMOVED',updatedAt:nowIso_()});}
  return {active:active,type:type,targetUserId:targetId};
}
function routeBlockUser_(ctx){return setSafetyRelation_(ctx.user.id,String(ctx.params.userId||''),'BLOCK',true);}
function routeUnblockUser_(ctx){return setSafetyRelation_(ctx.user.id,String(ctx.params.userId||''),'BLOCK',false);}
function routeIgnoreUser_(ctx){return setSafetyRelation_(ctx.user.id,String(ctx.params.userId||''),'IGNORE',true);}
function routeUnignoreUser_(ctx){return setSafetyRelation_(ctx.user.id,String(ctx.params.userId||''),'IGNORE',false);}
function routeListSafety_(ctx){var users={};rows_('Users').forEach(function(u){users[u.id]=u;});return filter_('SafetyRelations',function(r){return r.userId===ctx.user.id&&!r.revokedAt;}).map(function(r){return {id:r.id,type:r.type,targetUser:publicUser_(users[r.targetUserId]),createdAt:r.createdAt};});}

/* =============================
 * PRIVATE ATTACHMENTS
 * ============================= */

function uploadFolder_(){var id=PropertiesService.getScriptProperties().getProperty(TTRPG.UPLOAD_FOLDER_PROPERTY);if(!id)throw new ApiError_('NOT_CONFIGURED','Upload folder is missing. Run setupTtrpgMessenger().');return DriveApp.getFolderById(id);}
function requireOwnedAttachment_(attachmentId,userId){var a=byId_('Attachments',attachmentId,true);if(!a||a.deletedAt||a.ownerId!==userId)throw new ApiError_('ATTACHMENT_NOT_FOUND','Attachment not found.');return a;}
function requireAttachmentAccess_(attachmentId,userId,serverId,dmId){
  var a=byId_('Attachments',attachmentId,true);if(!a||a.deletedAt)throw new ApiError_('ATTACHMENT_NOT_FOUND','Attachment not found.');if(a.ownerId===userId)return a;
  if(a.serverId&&serverId&&a.serverId===serverId){requireMember_(serverId,userId);return a;}
  if(a.dmId&&dmId&&a.dmId===dmId){requireDm_(dmId,userId);return a;}
  if(a.messageId){var m=byId_('Messages',a.messageId,true);if(m&&canAccessMessage_(m,userId))return a;}
  throw new ApiError_('FORBIDDEN','You cannot access this attachment.');
}
function publicAttachment_(a){return {id:a.id,ownerId:a.ownerId,originalName:a.originalName,mimeType:a.mimeType,sizeBytes:num_(a.sizeBytes,0),sha256:a.sha256,createdAt:a.createdAt,messageId:a.messageId||''};}

function routeUploadAttachment_(ctx){
  var p=ctx.params,name=safeFileName_(p.fileName||p.name),mime=nullableText_(p.mimeType,150)||'application/octet-stream',b64=String(p.base64||p.data||'').replace(/^data:[^;]+;base64,/,'');if(!b64)throw new ApiError_('FILE_REQUIRED','Base64 file data is required.');
  var bytes;try{bytes=Utilities.base64Decode(b64);}catch(e){throw new ApiError_('INVALID_FILE','Attachment data is not valid base64.');}
  var max=int_(PropertiesService.getScriptProperties().getProperty(TTRPG.MAX_UPLOAD_PROPERTY),TTRPG.DEFAULT_MAX_UPLOAD_BYTES,1024,20*1024*1024);if(bytes.length>max)throw new ApiError_('FILE_TOO_LARGE','Maximum attachment size is '+max+' bytes.');
  var serverId=String(p.serverId||''),dmId=String(p.dmId||'');if(serverId){requireMember_(serverId,ctx.user.id);if(bool_(p.systemUpload))requirePermission_(serverId,ctx.user.id,PERMISSIONS.UPLOAD_SYSTEM_FILES,'Your role does not allow TTRPG system uploads.');else requirePermission_(serverId,ctx.user.id,PERMISSIONS.ATTACH_FILES);}if(dmId)requireDm_(dmId,ctx.user.id);
  var aid=id_('att'),stored=aid+'_'+name,blob=Utilities.newBlob(bytes,mime,stored),file=uploadFolder_().createFile(blob);var now=nowIso_();
  var a=insert_('Attachments',{id:aid,ownerId:ctx.user.id,serverId:serverId,dmId:dmId,scopeType:'',scopeId:'',messageId:'',fileId:file.getId(),originalName:name,storedName:stored,mimeType:mime,sizeBytes:bytes.length,sha256:sha256Hex_(Utilities.base64Encode(bytes)),createdAt:now,deletedAt:''});return publicAttachment_(a);
}

function routeDownloadAttachment_(ctx){
  var a=byId_('Attachments',ctx.params.attachmentId,true);if(!a)throw new ApiError_('ATTACHMENT_NOT_FOUND','Attachment not found.');requireAttachmentAccess_(a.id,ctx.user.id,a.serverId||'',a.dmId||'');
  var file;try{file=DriveApp.getFileById(a.fileId);}catch(e){throw new ApiError_('FILE_MISSING','Stored file is missing.');}var blob=file.getBlob();return {attachment:publicAttachment_(a),base64:Utilities.base64Encode(blob.getBytes())};
}

function routeDeleteAttachment_(ctx){
  var a=requireOwnedAttachment_(ctx.params.attachmentId,ctx.user.id);if(a.messageId)throw new ApiError_('ATTACHMENT_IN_USE','Delete the message containing this attachment instead.');
  try{DriveApp.getFileById(a.fileId).setTrashed(true);}catch(e){}updateRow_('Attachments',a._row,{deletedAt:nowIso_()});return {deleted:true};
}

/* =============================
 * PRESENCE, NOTIFICATIONS, EVENTS
 * ============================= */

function upsertPresence_(userId,status,customStatus){
  status=String(status||'ONLINE').toUpperCase();if(TTRPG.PRESENCE_STATUSES.indexOf(status)===-1)status='ONLINE';var now=nowIso_(),p=findOne_('Presence',function(x){return x.userId===userId;});
  if(p)updateRow_('Presence',p._row,{status:status,customStatus:customStatus||'',lastSeenAt:now,updatedAt:now});else insert_('Presence',{id:id_('pre'),userId:userId,status:status,customStatus:customStatus||'',lastSeenAt:now,updatedAt:now});
  var u=byId_('Users',userId,true);if(u)updateRow_('Users',u._row,{status:status,customStatus:customStatus||u.customStatus||'',lastSeenAt:now,updatedAt:now});
  return {userId:userId,status:status,customStatus:customStatus||'',lastSeenAt:now};
}

function routeHeartbeat_(ctx){
  var status=String(ctx.params.status||ctx.user.status||'ONLINE').toUpperCase(),custom=ctx.params.customStatus!==undefined?nullableText_(ctx.params.customStatus,128):(ctx.user.customStatus||'');var presence=upsertPresence_(ctx.user.id,status,custom);
  array_(ctx.params.serverIds).forEach(function(sid){try{requireMember_(sid,ctx.user.id);emitServerEvent_(sid,'PRESENCE_UPDATED','USER',ctx.user.id,{presence:presence});}catch(e){}});return presence;
}

function routeSetPresence_(ctx){return routeHeartbeat_(ctx);}
function routeListPresence_(ctx){var serverId=String(ctx.params.serverId||'');requireMember_(serverId,ctx.user.id);var memberIds={};filter_('Members',function(m){return m.serverId===serverId&&!m.leftAt;}).forEach(function(m){memberIds[m.userId]=true;});var users={};rows_('Users').forEach(function(u){users[u.id]=u;});return filter_('Presence',function(p){return memberIds[p.userId];}).map(function(p){var stale=Date.now()-new Date(p.lastSeenAt).getTime()>180000;return {userId:p.userId,user:publicUser_(users[p.userId]),status:stale?'OFFLINE':p.status,customStatus:p.customStatus||'',lastSeenAt:p.lastSeenAt};});}

function createNotification_(userId,type,actorId,scopeType,scopeId,messageId,payload){
  var n=insert_('Notifications',{id:id_('not'),userId:userId,type:type,actorId:actorId||'',scopeType:scopeType||'',scopeId:scopeId||'',messageId:messageId||'',payloadJson:JSON.stringify(payload||{}),readAt:'',createdAt:nowIso_()});emitUserEvent_(userId,'NOTIFICATION_CREATED','NOTIFICATION',n.id,{notification:publicNotification_(n)});return n;
}
function publicNotification_(n){return {id:n.id,userId:n.userId,type:n.type,actorId:n.actorId||'',scopeType:n.scopeType||'',scopeId:n.scopeId||'',messageId:n.messageId||'',payload:parseJsonCell_(n.payloadJson,{}),readAt:n.readAt||'',createdAt:n.createdAt};}
function routeListNotifications_(ctx){var unreadOnly=bool_(ctx.params.unreadOnly),limit=int_(ctx.params.limit,50,1,100);return filter_('Notifications',function(n){return n.userId===ctx.user.id&&(!unreadOnly||!n.readAt);}).sort(function(a,b){return new Date(b.createdAt)-new Date(a.createdAt);}).slice(0,limit).map(publicNotification_);}
function routeMarkNotificationRead_(ctx){var ids=array_(ctx.params.notificationIds);if(ctx.params.notificationId)ids.push(String(ctx.params.notificationId));var now=nowIso_(),count=0;filter_('Notifications',function(n){return n.userId===ctx.user.id&&!n.readAt&&(ids.length===0||ids.indexOf(n.id)!==-1);}).forEach(function(n){updateRow_('Notifications',n._row,{readAt:now});count++;});return {markedRead:count};}

function emitEvent_(audienceType,audienceId,eventType,entityType,entityId,payload){
  return insert_('Events',{id:id_('evt'),audienceType:audienceType,audienceId:String(audienceId||''),eventType:eventType,entityType:entityType||'',entityId:String(entityId||''),payloadJson:JSON.stringify(payload||{}),createdAt:nowIso_(),expiresAt:addMsIso_(TTRPG.EVENT_TTL_HOURS*3600000)});
}
function emitServerEvent_(serverId,eventType,entityType,entityId,payload){emitEvent_('SERVER',serverId,eventType,entityType,entityId,payload);}
function emitUserEvent_(userId,eventType,entityType,entityId,payload){emitEvent_('USER',userId,eventType,entityType,entityId,payload);}
function emitChannelEvent_(channelId,eventType,entityType,entityId,payload){emitEvent_('CHANNEL',channelId,eventType,entityType,entityId,payload);}
function emitDmEvent_(dmId,eventType,entityType,entityId,payload){emitEvent_('DM',dmId,eventType,entityType,entityId,payload);}
function emitScopeEvent_(scope,eventType,entityType,entityId,payload){if(scope.scopeType==='CHANNEL')emitChannelEvent_(scope.scopeId,eventType,entityType,entityId,payload);else emitDmEvent_(scope.scopeId,eventType,entityType,entityId,payload);if(scope.serverId)emitServerEvent_(scope.serverId,eventType,entityType,entityId,{scopeType:scope.scopeType,scopeId:scope.scopeId});}

function routePollEvents_(ctx){
  var after=String(ctx.params.after||ctx.params.cursor||new Date(Date.now()-60000).toISOString()),afterMs=new Date(after).getTime();if(!isFinite(afterMs))afterMs=Date.now()-60000;
  var serverIds=unique_(array_(ctx.params.serverIds)),channelIds=unique_(array_(ctx.params.channelIds)),dmIds=unique_(array_(ctx.params.dmIds)),limit=int_(ctx.params.limit,100,1,200);
  serverIds=serverIds.filter(function(id){try{requireMember_(id,ctx.user.id);return true;}catch(e){return false;}});
  channelIds=channelIds.filter(function(id){try{requireChannel_(id,ctx.user.id);return true;}catch(e){return false;}});
  dmIds=dmIds.filter(function(id){try{requireDm_(id,ctx.user.id);return true;}catch(e){return false;}});
  var events=filter_('Events',function(ev){if(isPast_(ev.expiresAt)||new Date(ev.createdAt).getTime()<=afterMs)return false;if(ev.audienceType==='USER')return ev.audienceId===ctx.user.id;if(ev.audienceType==='SERVER')return serverIds.indexOf(ev.audienceId)!==-1;if(ev.audienceType==='CHANNEL')return channelIds.indexOf(ev.audienceId)!==-1;if(ev.audienceType==='DM')return dmIds.indexOf(ev.audienceId)!==-1;return false;}).sort(function(a,b){return new Date(a.createdAt)-new Date(b.createdAt);}).slice(0,limit).map(function(ev){return {id:ev.id,audienceType:ev.audienceType,audienceId:ev.audienceId,eventType:ev.eventType,entityType:ev.entityType,entityId:ev.entityId,payload:parseJsonCell_(ev.payloadJson,{}),createdAt:ev.createdAt};});
  return {events:events,cursor:nowIso_(),pollAfterMs:1500};
}

/* =============================
 * VOICE, CALLS, AND WEBRTC SIGNALING
 * ============================= */

function publicVoiceState_(v){var u=byId_('Users',v.userId,true);return {id:v.id,serverId:v.serverId,channelId:v.channelId,userId:v.userId,user:publicUser_(u),sessionId:v.sessionId,muted:bool_(v.muted),deafened:bool_(v.deafened),videoEnabled:bool_(v.videoEnabled),screenSharing:bool_(v.screenSharing),pushToTalk:bool_(v.pushToTalk),whispering:bool_(v.whispering),joinedAt:v.joinedAt,updatedAt:v.updatedAt};}

function routeJoinVoice_(ctx){
  var channel=requireChannel_(ctx.params.channelId,ctx.user.id);if(['VOICE','VIDEO'].indexOf(channel.type)===-1)throw new ApiError_('NOT_VOICE_CHANNEL','Channel is not a voice or video room.');requirePermission_(channel.serverId,ctx.user.id,PERMISSIONS.CONNECT_VOICE);
  var current=filter_('VoiceStates',function(v){return v.userId===ctx.user.id;}).sort(function(a,b){return b._row-a._row;});current.forEach(function(v){deleteRow_('VoiceStates',v._row);emitChannelEvent_(v.channelId,'VOICE_USER_LEFT','USER',ctx.user.id,{userId:ctx.user.id});});
  var count=filter_('VoiceStates',function(v){return v.channelId===channel.id;}).length;if(int_(channel.userLimit,0)>0&&count>=int_(channel.userLimit,0))throw new ApiError_('VOICE_FULL','Voice channel is full.');
  var now=nowIso_(),v=insert_('VoiceStates',{id:id_('voi'),serverId:channel.serverId,channelId:channel.id,userId:ctx.user.id,sessionId:ctx.session.id,muted:bool_(ctx.params.muted),deafened:bool_(ctx.params.deafened),videoEnabled:channel.type==='VIDEO'&&bool_(ctx.params.videoEnabled),screenSharing:false,pushToTalk:bool_(ctx.params.pushToTalk),whispering:false,joinedAt:now,updatedAt:now});
  emitChannelEvent_(channel.id,'VOICE_USER_JOINED','USER',ctx.user.id,{voiceState:publicVoiceState_(v)});emitServerEvent_(channel.serverId,'VOICE_STATE_UPDATED','USER',ctx.user.id,{voiceState:publicVoiceState_(v)});
  return {voiceState:publicVoiceState_(v),peers:filter_('VoiceStates',function(x){return x.channelId===channel.id&&x.userId!==ctx.user.id;}).map(publicVoiceState_),iceServers:getIceServers_()};
}

function routeUpdateVoice_(ctx){
  var v=findOne_('VoiceStates',function(x){return x.userId===ctx.user.id&&(!ctx.params.channelId||x.channelId===String(ctx.params.channelId));});if(!v)throw new ApiError_('NOT_IN_VOICE','You are not in a voice channel.');var patch={updatedAt:nowIso_()};
  ['muted','deafened','videoEnabled','screenSharing','pushToTalk','whispering'].forEach(function(k){if(ctx.params[k]!==undefined)patch[k]=bool_(ctx.params[k]);});if(patch.videoEnabled&&!hasPermission_(v.serverId,ctx.user.id,PERMISSIONS.STREAM))throw new ApiError_('FORBIDDEN','You cannot enable video.');if(patch.screenSharing&&!hasPermission_(v.serverId,ctx.user.id,PERMISSIONS.STREAM))throw new ApiError_('FORBIDDEN','You cannot share your screen.');
  updateRow_('VoiceStates',v._row,patch);var u=byId_('VoiceStates',v.id,true);emitChannelEvent_(v.channelId,'VOICE_STATE_UPDATED','USER',ctx.user.id,{voiceState:publicVoiceState_(u)});return publicVoiceState_(u);
}

function routeLeaveVoice_(ctx){var states=filter_('VoiceStates',function(v){return v.userId===ctx.user.id&&(!ctx.params.channelId||v.channelId===String(ctx.params.channelId));}).sort(function(a,b){return b._row-a._row;}),left=[];states.forEach(function(v){left.push(v.channelId);deleteRow_('VoiceStates',v._row);emitChannelEvent_(v.channelId,'VOICE_USER_LEFT','USER',ctx.user.id,{userId:ctx.user.id});emitServerEvent_(v.serverId,'VOICE_STATE_UPDATED','USER',ctx.user.id,{userId:ctx.user.id,channelId:''});});return {left:true,channelIds:left};}
function routeListVoiceStates_(ctx){var serverId=String(ctx.params.serverId||'');requireMember_(serverId,ctx.user.id);return filter_('VoiceStates',function(v){return v.serverId===serverId;}).map(publicVoiceState_);}

function requireCall_(dmId,userId){var dm=requireDm_(dmId,userId),call=filter_('Calls',function(c){return c.dmId===dm.id&&['RINGING','ACTIVE'].indexOf(c.status)!==-1;}).sort(function(a,b){return new Date(b.createdAt)-new Date(a.createdAt);})[0];return {dm:dm,call:call||null};}
function publicCall_(call){if(!call)return null;var users={};rows_('Users').forEach(function(u){users[u.id]=u;});var parts=filter_('CallParticipants',function(cp){return cp.callId===call.id;}).map(function(cp){return {id:cp.id,userId:cp.userId,user:publicUser_(users[cp.userId]),status:cp.status,joinedAt:cp.joinedAt||'',leftAt:cp.leftAt||''};});return {id:call.id,dmId:call.dmId,initiatorId:call.initiatorId,status:call.status,createdAt:call.createdAt,startedAt:call.startedAt||'',endedAt:call.endedAt||'',participants:parts};}
function routeGetActiveCall_(ctx){return publicCall_(requireCall_(ctx.params.dmId,ctx.user.id).call);}

function routeStartCall_(ctx){
  var rc=requireCall_(ctx.params.dmId,ctx.user.id);if(rc.call)return publicCall_(rc.call);var now=nowIso_(),call=insert_('Calls',{id:id_('cal'),dmId:rc.dm.id,initiatorId:ctx.user.id,status:'RINGING',createdAt:now,startedAt:'',endedAt:'',updatedAt:now});insert_('CallParticipants',{id:id_('cap'),callId:call.id,userId:ctx.user.id,status:'JOINED',joinedAt:now,leftAt:'',updatedAt:now});
  filter_('DmParticipants',function(dp){return dp.dmId===rc.dm.id&&!dp.leftAt&&dp.userId!==ctx.user.id;}).forEach(function(dp){insert_('CallParticipants',{id:id_('cap'),callId:call.id,userId:dp.userId,status:'RINGING',joinedAt:'',leftAt:'',updatedAt:now});emitUserEvent_(dp.userId,'INCOMING_CALL','CALL',call.id,{call:publicCall_(call)});});emitDmEvent_(rc.dm.id,'CALL_STARTED','CALL',call.id,{call:publicCall_(call)});return publicCall_(call);
}

function updateCallParticipant_(callId,userId,status){var cp=findOne_('CallParticipants',function(x){return x.callId===callId&&x.userId===userId;});var now=nowIso_();if(!cp)cp=insert_('CallParticipants',{id:id_('cap'),callId:callId,userId:userId,status:status,joinedAt:status==='JOINED'?now:'',leftAt:'',updatedAt:now});else updateRow_('CallParticipants',cp._row,{status:status,joinedAt:status==='JOINED'?(cp.joinedAt||now):cp.joinedAt,leftAt:['LEFT','DECLINED'].indexOf(status)!==-1?now:'',updatedAt:now});return byId_('CallParticipants',cp.id,true);}

function routeAcceptCall_(ctx){var rc=requireCall_(ctx.params.dmId,ctx.user.id);if(!rc.call)throw new ApiError_('CALL_NOT_FOUND','No active call.');updateCallParticipant_(rc.call.id,ctx.user.id,'JOINED');if(rc.call.status==='RINGING')updateRow_('Calls',rc.call._row,{status:'ACTIVE',startedAt:nowIso_(),updatedAt:nowIso_()});var call=byId_('Calls',rc.call.id,true);emitDmEvent_(rc.dm.id,'CALL_UPDATED','CALL',call.id,{call:publicCall_(call)});return {call:publicCall_(call),iceServers:getIceServers_()};}
function routeJoinCall_(ctx){return routeAcceptCall_(ctx);}
function routeDeclineCall_(ctx){var rc=requireCall_(ctx.params.dmId,ctx.user.id);if(!rc.call)throw new ApiError_('CALL_NOT_FOUND','No active call.');updateCallParticipant_(rc.call.id,ctx.user.id,'DECLINED');var active=filter_('CallParticipants',function(cp){return cp.callId===rc.call.id&&['JOINED','RINGING'].indexOf(cp.status)!==-1;});if(active.length<=1&&active[0]&&active[0].userId===rc.call.initiatorId){updateRow_('Calls',rc.call._row,{status:'MISSED',endedAt:nowIso_(),updatedAt:nowIso_()});}emitDmEvent_(rc.dm.id,'CALL_UPDATED','CALL',rc.call.id,{call:publicCall_(byId_('Calls',rc.call.id,true))});return {declined:true};}
function routeLeaveCall_(ctx){var rc=requireCall_(ctx.params.dmId,ctx.user.id);if(!rc.call)throw new ApiError_('CALL_NOT_FOUND','No active call.');updateCallParticipant_(rc.call.id,ctx.user.id,'LEFT');var joined=filter_('CallParticipants',function(cp){return cp.callId===rc.call.id&&cp.status==='JOINED';});if(joined.length===0)updateRow_('Calls',rc.call._row,{status:'ENDED',endedAt:nowIso_(),updatedAt:nowIso_()});var call=byId_('Calls',rc.call.id,true);emitDmEvent_(rc.dm.id,'CALL_UPDATED','CALL',call.id,{call:publicCall_(call)});return {left:true,call:publicCall_(call)};}

function getIceServers_(){var raw=PropertiesService.getScriptProperties().getProperty(TTRPG.RTC_ICE_PROPERTY)||'[]';var parsed=parseJsonCell_(raw,[]);return Array.isArray(parsed)?parsed:[];}
function authorizeRtcRoom_(roomType,roomId,userId){
  roomType=String(roomType||'').toUpperCase();if(TTRPG.RTC_ROOM_TYPES.indexOf(roomType)===-1)throw new ApiError_('INVALID_RTC_ROOM','Invalid RTC room type.');
  if(roomType==='VOICE'){var channel=requireChannel_(roomId,userId),state=findOne_('VoiceStates',function(v){return v.channelId===channel.id&&v.userId===userId;});if(!state)throw new ApiError_('NOT_IN_VOICE','Join the voice channel first.');return {roomType:roomType,roomId:channel.id};}
  if(roomType==='DM_CALL'){var rc=requireCall_(roomId,userId);if(!rc.call)throw new ApiError_('CALL_NOT_FOUND','No active call.');var cp=findOne_('CallParticipants',function(x){return x.callId===rc.call.id&&x.userId===userId&&x.status==='JOINED';});if(!cp)throw new ApiError_('NOT_IN_CALL','Join the call first.');return {roomType:roomType,roomId:rc.call.id,dmId:roomId};}
  if(roomType==='WHISPER'){var ch=requireChannel_(roomId,userId),vs=findOne_('VoiceStates',function(v){return v.channelId===ch.id&&v.userId===userId;});if(!vs)throw new ApiError_('NOT_IN_VOICE','Join the voice channel before whispering.');return {roomType:roomType,roomId:ch.id};}
}

function rtcPeerAuthorized_(roomType,roomId,userId){try{if(roomType==='VOICE'||roomType==='WHISPER')return !!findOne_('VoiceStates',function(v){return v.channelId===roomId&&v.userId===userId;});if(roomType==='DM_CALL')return !!findOne_('CallParticipants',function(cp){return cp.callId===roomId&&cp.userId===userId&&cp.status==='JOINED';});}catch(e){}return false;}

function routeSendRtcSignal_(ctx){
  var room=authorizeRtcRoom_(ctx.params.roomType,ctx.params.roomId,ctx.user.id),to=String(ctx.params.toUserId||''),type=String(ctx.params.signalType||'').toUpperCase();if(TTRPG.RTC_SIGNAL_TYPES.indexOf(type)===-1)throw new ApiError_('INVALID_SIGNAL','Unsupported RTC signal type.');if(!to)throw new ApiError_('RTC_TARGET_REQUIRED','WebRTC signals must target one peer; send one signal per peer in group rooms.');if(!rtcPeerAuthorized_(room.roomType,room.roomId,to))throw new ApiError_('PEER_NOT_IN_ROOM','Target peer is not in this RTC room.');
  var signal=ctx.params.signal;if(signal===undefined)signal=ctx.params.payload||{};var s=insert_('RtcSignals',{id:id_('rtc'),roomType:room.roomType,roomId:room.roomId,fromUserId:ctx.user.id,toUserId:to,signalType:type,signalJson:JSON.stringify(signal),createdAt:nowIso_(),expiresAt:addMsIso_(TTRPG.SIGNAL_TTL_MINUTES*60000),consumedAt:''});if(to)emitUserEvent_(to,'RTC_SIGNAL','RTC_SIGNAL',s.id,{signalId:s.id,roomType:s.roomType,roomId:s.roomId,fromUserId:s.fromUserId,signalType:s.signalType});return {sent:true,signalId:s.id};
}

function routePollRtcSignals_(ctx){
  var room=authorizeRtcRoom_(ctx.params.roomType,ctx.params.roomId,ctx.user.id),after=String(ctx.params.after||new Date(Date.now()-60000).toISOString()),afterMs=new Date(after).getTime();if(!isFinite(afterMs))afterMs=Date.now()-60000;
  var signals=filter_('RtcSignals',function(s){return s.roomType===room.roomType&&s.roomId===room.roomId&&!s.consumedAt&&!isPast_(s.expiresAt)&&s.fromUserId!==ctx.user.id&&(!s.toUserId||s.toUserId===ctx.user.id)&&new Date(s.createdAt).getTime()>afterMs;}).sort(function(a,b){return new Date(a.createdAt)-new Date(b.createdAt);}).slice(0,100).map(function(s){return {id:s.id,roomType:s.roomType,roomId:s.roomId,fromUserId:s.fromUserId,toUserId:s.toUserId||'',signalType:s.signalType,signal:parseJsonCell_(s.signalJson,{}),createdAt:s.createdAt};});return {signals:signals,cursor:nowIso_(),iceServers:getIceServers_()};
}

function routeAckRtcSignals_(ctx){var ids=array_(ctx.params.signalIds),count=0,now=nowIso_();filter_('RtcSignals',function(s){return ids.indexOf(s.id)!==-1&&!s.consumedAt&&(s.toUserId===ctx.user.id||(!s.toUserId&&rtcPeerAuthorized_(s.roomType,s.roomId,ctx.user.id)));}).forEach(function(s){updateRow_('RtcSignals',s._row,{consumedAt:now});count++;});return {acknowledged:count};}

/* =============================
 * TTRPG PERSONAS AND DICE
 * ============================= */

function publicPersona_(p){return {id:p.id,serverId:p.serverId,userId:p.userId,name:p.name,avatarAttachmentId:p.avatarAttachmentId||'',color:p.color||'#808080',description:p.description||'',isDefault:bool_(p.isDefault),createdAt:p.createdAt,updatedAt:p.updatedAt};}
function requirePersona_(personaId,userId){var p=byId_('Personas',personaId);if(!p||p.userId!==userId)throw new ApiError_('PERSONA_NOT_FOUND','Persona not found.');requireMember_(p.serverId,userId);return p;}
function routeListPersonas_(ctx){var serverId=String(ctx.params.serverId||'');requireMember_(serverId,ctx.user.id);var ownOnly=ctx.params.ownOnly===undefined?true:bool_(ctx.params.ownOnly);return filter_('Personas',function(p){return p.serverId===serverId&&!p.deletedAt&&(!ownOnly||p.userId===ctx.user.id);}).map(publicPersona_);}
function routeCreatePersona_(ctx){var serverId=String(ctx.params.serverId||'');requirePermission_(serverId,ctx.user.id,PERMISSIONS.USE_PERSONAS);var aid=String(ctx.params.avatarAttachmentId||'');if(aid)requireAttachmentAccess_(aid,ctx.user.id,serverId,'');if(bool_(ctx.params.isDefault))filter_('Personas',function(p){return p.serverId===serverId&&p.userId===ctx.user.id&&!p.deletedAt&&bool_(p.isDefault);}).forEach(function(p){updateRow_('Personas',p._row,{isDefault:false,updatedAt:nowIso_()});});var now=nowIso_(),p=insert_('Personas',{id:id_('per'),serverId:serverId,userId:ctx.user.id,name:text_(ctx.params.name,80),avatarAttachmentId:aid,color:nullableText_(ctx.params.color,16)||'#808080',description:nullableText_(ctx.params.description,1000),isDefault:bool_(ctx.params.isDefault),createdAt:now,updatedAt:now,deletedAt:''});emitServerEvent_(serverId,'PERSONA_CREATED','PERSONA',p.id,{persona:publicPersona_(p)});return publicPersona_(p);}
function routeUpdatePersona_(ctx){var p=requirePersona_(ctx.params.personaId,ctx.user.id),patch={updatedAt:nowIso_()};if(ctx.params.name!==undefined)patch.name=text_(ctx.params.name,80);if(ctx.params.avatarAttachmentId!==undefined){if(ctx.params.avatarAttachmentId)requireAttachmentAccess_(ctx.params.avatarAttachmentId,ctx.user.id,p.serverId,'');patch.avatarAttachmentId=String(ctx.params.avatarAttachmentId||'');}if(ctx.params.color!==undefined)patch.color=nullableText_(ctx.params.color,16)||'#808080';if(ctx.params.description!==undefined)patch.description=nullableText_(ctx.params.description,1000);if(ctx.params.isDefault!==undefined&&bool_(ctx.params.isDefault)){filter_('Personas',function(x){return x.serverId===p.serverId&&x.userId===ctx.user.id&&x.id!==p.id&&!x.deletedAt&&bool_(x.isDefault);}).forEach(function(x){updateRow_('Personas',x._row,{isDefault:false,updatedAt:nowIso_()});});patch.isDefault=true;}updateRow_('Personas',p._row,patch);var u=byId_('Personas',p.id);emitServerEvent_(p.serverId,'PERSONA_UPDATED','PERSONA',p.id,{persona:publicPersona_(u)});return publicPersona_(u);}
function routeDeletePersona_(ctx){var p=requirePersona_(ctx.params.personaId,ctx.user.id);updateRow_('Personas',p._row,{deletedAt:nowIso_(),updatedAt:nowIso_(),isDefault:false});emitServerEvent_(p.serverId,'PERSONA_DELETED','PERSONA',p.id,{personaId:p.id});return {deleted:true};}

function parseDiceExpression_(expr){
  expr=String(expr||'').replace(/\s+/g,'').toLowerCase();if(!expr||expr.length>120)throw new ApiError_('INVALID_DICE','Dice expression is empty or too long.');
  if(!/^[+\-]?\d*d\d+([+\-]\d*d?\d+)*$/.test(expr)&&!/^[+\-]?\d+([+\-]\d*d?\d+)*$/.test(expr))throw new ApiError_('INVALID_DICE','Use expressions like 1d20+5, 2d6+1d4-2, or 10.');
  var normalized=expr.replace(/-/g,'+-').split('+').filter(Boolean),terms=[];normalized.forEach(function(raw){var sign=1;if(raw.charAt(0)==='-'){sign=-1;raw=raw.slice(1);}if(raw.indexOf('d')!==-1){var bits=raw.split('d'),count=bits[0]?int_(bits[0],1,1,100):1,sides=int_(bits[1],0,2,1000);if(!sides)throw new ApiError_('INVALID_DICE','Dice must have at least 2 sides.');terms.push({type:'dice',sign:sign,count:count,sides:sides});}else terms.push({type:'flat',sign:sign,value:int_(raw,0,-100000,100000)});});return {expression:expr,terms:terms};
}
function rollDice_(parsed){var total=0,detail=[];parsed.terms.forEach(function(t){if(t.type==='flat'){total+=t.sign*t.value;detail.push({type:'flat',sign:t.sign,value:t.value,subtotal:t.sign*t.value});}else{var rolls=[];for(var i=0;i<t.count;i++)rolls.push(Math.floor(Math.random()*t.sides)+1);var subtotal=rolls.reduce(function(a,b){return a+b;},0)*t.sign;total+=subtotal;detail.push({type:'dice',sign:t.sign,count:t.count,sides:t.sides,rolls:rolls,subtotal:subtotal});}});return {total:total,detail:detail};}
function routeRollDice_(ctx){
  throw new ApiError_('USE_TABLEGATE_3D','Campaign and session rolls must be completed in the shared TableGate 3D dice area. Campaign creators and authorized administrators may use rollPrivateDice inside an admin-only direct message.');
}
function routeRecord3dDiceRoll_(ctx){
  var channel=requireChannel_(ctx.params.channelId,ctx.user.id);requirePermission_(channel.serverId,ctx.user.id,PERMISSIONS.ROLL_DICE);
  var label=nullableText_(ctx.params.label,200)||'3D session roll',characterName=nullableText_(ctx.params.characterName,200),systemId=nullableText_(ctx.params.systemId,100),expression=nullableText_(ctx.params.expression,200)||'TABLEGATE_3D';
  var result=ctx.params.result&&typeof ctx.params.result==='object'?ctx.params.result:{summary:String(ctx.params.summary||'')};
  var total=Number(ctx.params.total);if(!isFinite(total)){total=Number(result.total);if(!isFinite(total))total=0;}
  var summary=nullableText_(ctx.params.summary,1000),now=nowIso_(),personaId=String(ctx.params.personaId||'');
  if(personaId){var p=requirePersona_(personaId,ctx.user.id);if(p.serverId!==channel.serverId)throw new ApiError_('INVALID_PERSONA','Persona belongs to another server.');}
  var roll=insert_('DiceRolls',{id:id_('roll3d'),serverId:channel.serverId,channelId:channel.id,userId:ctx.user.id,personaId:personaId,expression:expression,label:label,total:total,detailJson:JSON.stringify({source:'TABLEGATE_3D',systemId:systemId,characterName:characterName,summary:summary,result:result}),messageId:'',createdAt:now});
  var text='🎲 **'+label+'**'+(characterName?' — '+characterName:'')+(summary?'\n'+summary:'')+'\n*Rolled on the shared TableGate 3D dice table.*';
  var message=routeSendMessage_({params:{scopeType:'CHANNEL',scopeId:channel.id,content:text,messageType:'ROLL',personaId:personaId,attachmentIds:[]},user:ctx.user,session:ctx.session});
  updateRow_('DiceRolls',roll._row,{messageId:message.id});audit_(channel.serverId,ctx.user.id,'TABLEGATE_3D_DICE_ROLLED','DICE_ROLL',roll.id,{systemId:systemId,expression:expression,total:total});
  return {id:roll.id,serverId:roll.serverId,channelId:roll.channelId,total:total,message:message,createdAt:now};
}
function routeListDiceRolls_(ctx){var channel=requireChannel_(ctx.params.channelId,ctx.user.id),limit=int_(ctx.params.limit,50,1,100);return filter_('DiceRolls',function(r){return r.channelId===channel.id;}).sort(function(a,b){return new Date(b.createdAt)-new Date(a.createdAt);}).slice(0,limit).map(function(r){return {id:r.id,serverId:r.serverId,channelId:r.channelId,userId:r.userId,personaId:r.personaId||'',expression:r.expression,label:r.label||'',total:num_(r.total,0),detail:parseJsonCell_(r.detailJson,[]),messageId:r.messageId||'',createdAt:r.createdAt};});}


function adminParticipant_(serverId,userId){
  try{
    var server=requireServer_(serverId);
    return server.ownerId===userId||hasPermission_(serverId,userId,PERMISSIONS.ADMIN)||hasPermission_(serverId,userId,PERMISSIONS.MANAGE_SERVER);
  }catch(e){return false;}
}
function routeRollPrivateDice_(ctx){
  var serverId=String(ctx.params.serverId||''),dm=requireDm_(ctx.params.dmId,ctx.user.id);
  if(!adminParticipant_(serverId,ctx.user.id))throw new ApiError_('FORBIDDEN','Only the campaign creator or an authorized administrator can make private admin rolls.');
  var participants=dmParticipants_(dm.id);
  if(!participants.length||participants.some(function(p){return !adminParticipant_(serverId,p.userId);}))throw new ApiError_('FORBIDDEN','Private admin rolls require an admin-only direct message for the selected campaign.');
  var parsed=parseDiceExpression_(ctx.params.expression||ctx.params.dice),rolled=rollDice_(parsed),label=nullableText_(ctx.params.label,200),message=null;
  if(ctx.params.postMessage===undefined||bool_(ctx.params.postMessage)){
    var text=(label?label+': ':'')+'`'+parsed.expression+'` = **'+rolled.total+'**\n\n*Private admin roll for '+requireServer_(serverId).name+'.*';
    message=routeSendMessage_({params:{scopeType:'DM',scopeId:dm.id,content:text,messageType:'ROLL',attachmentIds:[]},user:ctx.user,session:ctx.session});
  }
  audit_(serverId,ctx.user.id,'PRIVATE_ADMIN_DICE_ROLLED','DM',dm.id,{expression:parsed.expression,total:rolled.total,posted:!!message});
  return {serverId:serverId,dmId:dm.id,userId:ctx.user.id,expression:parsed.expression,label:label,total:rolled.total,detail:rolled.detail,message:message,createdAt:nowIso_()};
}
function tableGatePayload_(ctx){return ctx.params.payload&&typeof ctx.params.payload==='object'?ctx.params.payload:ctx.params;}
function tableGateWriteJson_(prefix,obj,existingFileId){
  var folder=uploadFolder_(),blob=Utilities.newBlob(JSON.stringify(obj||{}),'application/json',prefix+'.json');
  if(existingFileId){
    try{var old=DriveApp.getFileById(existingFileId);old.setContent(blob.getDataAsString());return old.getId();}catch(e){}
  }
  return folder.createFile(blob).getId();
}
function routeTableGatePing_(ctx){return {active:true,app:'TableGate',apiVersion:TTRPG.API_VERSION,schemaVersion:TTRPG.SCHEMA_VERSION,libraryId:'18ET55A9uVNx3IUzoAM_eRj8v7jqagPgjVdxil3P1SoUqrFnnAJp6CjVr',libraryVersion:5,features:{messenger:true,organizer:true,characters:true,tokens:true,session3d:true,privateAdminRolls:true}};}
function routeTableGateProfileUpsert_(ctx){
  var p=tableGatePayload_(ctx),profile=p.profile||{},externalId=String(profile.id||'');
  if(!externalId)throw new ApiError_('PROFILE_REQUIRED','A TableGate profile id is required.');
  var row=findOne_('TableGateProfiles',function(x){return x.userId===ctx.user.id&&x.externalProfileId===externalId;}),now=nowIso_();
  var fileId=tableGateWriteJson_('tablegate-profile-'+externalId,profile,row&&row.dataFileId);
  if(row)updateRow_('TableGateProfiles',row._row,{email:profile.email||'',displayName:profile.displayName||'',dataFileId:fileId,updatedAt:now});
  else row=insert_('TableGateProfiles',{id:id_('tgp'),userId:ctx.user.id,externalProfileId:externalId,email:profile.email||'',displayName:profile.displayName||'',dataFileId:fileId,createdAt:now,updatedAt:now});
  return {saved:true,externalProfileId:externalId,updatedAt:now};
}
function routeTableGateCharacterUpsert_(ctx){
  var p=tableGatePayload_(ctx),character=p.character||{},profileId=String(p.profileId||''),characterId=String(character.id||'');
  if(!profileId||!characterId)throw new ApiError_('CHARACTER_REQUIRED','Profile and character ids are required.');
  var row=findOne_('TableGateCharacters',function(x){return x.userId===ctx.user.id&&x.externalCharacterId===characterId&&!x.deletedAt;}),now=nowIso_();
  var fileId=tableGateWriteJson_('tablegate-character-'+characterId,character,row&&row.dataFileId);
  var patch={externalProfileId:profileId,systemId:character.systemId||'',name:character.name||'',dataFileId:fileId,updatedAt:now,deletedAt:''};
  if(row)updateRow_('TableGateCharacters',row._row,patch);
  else row=insert_('TableGateCharacters',{id:id_('tgc'),userId:ctx.user.id,externalProfileId:profileId,externalCharacterId:characterId,systemId:character.systemId||'',name:character.name||'',dataFileId:fileId,createdAt:now,updatedAt:now,deletedAt:''});
  return {saved:true,externalCharacterId:characterId,updatedAt:now};
}
function routeTableGateCharacterDelete_(ctx){
  var p=tableGatePayload_(ctx),id=String(p.characterId||''),row=findOne_('TableGateCharacters',function(x){return x.userId===ctx.user.id&&x.externalCharacterId===id&&!x.deletedAt;});
  if(row)updateRow_('TableGateCharacters',row._row,{deletedAt:nowIso_(),updatedAt:nowIso_()});
  return {deleted:!!row,externalCharacterId:id};
}
function routeTableGateSnapshotUpsert_(ctx){
  var p=tableGatePayload_(ctx),profile=p.profile||{},profileId=String(profile.id||p.profileId||''),now=nowIso_();
  if(!profileId)throw new ApiError_('PROFILE_REQUIRED','A profile id is required.');
  var row=findOne_('TableGateSnapshots',function(x){return x.userId===ctx.user.id&&x.externalProfileId===profileId;}),fileId=tableGateWriteJson_('tablegate-snapshot-'+profileId,p,row&&row.dataFileId);
  if(row)updateRow_('TableGateSnapshots',row._row,{dataFileId:fileId,updatedAt:now});
  else insert_('TableGateSnapshots',{id:id_('tgs'),userId:ctx.user.id,externalProfileId:profileId,dataFileId:fileId,createdAt:now,updatedAt:now});
  return {saved:true,externalProfileId:profileId,updatedAt:now};
}

/* =============================
 * AUDIT, CONFIGURATION, MAINTENANCE
 * ============================= */

function audit_(serverId,actorId,action,targetType,targetId,details){return insert_('AuditLog',{id:id_('aud'),serverId:serverId,actorId:actorId,action:action,targetType:targetType,targetId:targetId,detailsJson:JSON.stringify(details||{}),createdAt:nowIso_()});}
function routeListAuditLog_(ctx){var serverId=String(ctx.params.serverId||'');requirePermission_(serverId,ctx.user.id,PERMISSIONS.VIEW_AUDIT_LOG);var limit=int_(ctx.params.limit,100,1,200),before=String(ctx.params.before||'');var list=filter_('AuditLog',function(a){return a.serverId===serverId;}).sort(function(a,b){return new Date(b.createdAt)-new Date(a.createdAt);});if(before){var t=new Date(before).getTime();if(isFinite(t))list=list.filter(function(a){return new Date(a.createdAt).getTime()<t;});}return list.slice(0,limit).map(function(a){return {id:a.id,serverId:a.serverId,actorId:a.actorId,action:a.action,targetType:a.targetType,targetId:a.targetId,details:parseJsonCell_(a.detailsJson,{}),createdAt:a.createdAt};});}

function routeGetClientConfig_(ctx){var props=PropertiesService.getScriptProperties();return {apiVersion:TTRPG.API_VERSION,schemaVersion:props.getProperty('TTRPG_SCHEMA_VERSION')||TTRPG.SCHEMA_VERSION,maxUploadBytes:int_(props.getProperty(TTRPG.MAX_UPLOAD_PROPERTY),TTRPG.DEFAULT_MAX_UPLOAD_BYTES),sessionDays:int_(props.getProperty(TTRPG.SESSION_DAYS_PROPERTY),TTRPG.DEFAULT_SESSION_DAYS),registrationMode:props.getProperty(TTRPG.REGISTRATION_MODE_PROPERTY)||'INVITE_OR_FIRST_USER',features:{organizerExtension:true,organizerVersion:'1.1.0',sharedOrganizer:true},iceServers:getIceServers_(),polling:{eventsMs:1500,presenceHeartbeatMs:45000,typingRefreshMs:6000,rtcSignalsMs:800}};}

function configureTtrpgMessenger(options){
  options=options||{};var props=PropertiesService.getScriptProperties();
  if(options.registrationMode!==undefined){var mode=String(options.registrationMode).toUpperCase();if(TTRPG.REGISTRATION_MODES.indexOf(mode)===-1)throw new Error('Invalid registrationMode.');props.setProperty(TTRPG.REGISTRATION_MODE_PROPERTY,mode);}
  if(options.sessionDays!==undefined)props.setProperty(TTRPG.SESSION_DAYS_PROPERTY,String(int_(options.sessionDays,30,1,365)));
  if(options.maxUploadBytes!==undefined)props.setProperty(TTRPG.MAX_UPLOAD_PROPERTY,String(int_(options.maxUploadBytes,TTRPG.DEFAULT_MAX_UPLOAD_BYTES,1024,20*1024*1024)));
  if(options.iceServers!==undefined){if(!Array.isArray(options.iceServers))throw new Error('iceServers must be an array.');props.setProperty(TTRPG.RTC_ICE_PROPERTY,JSON.stringify(options.iceServers));}
  var result={registrationMode:props.getProperty(TTRPG.REGISTRATION_MODE_PROPERTY),sessionDays:props.getProperty(TTRPG.SESSION_DAYS_PROPERTY),maxUploadBytes:props.getProperty(TTRPG.MAX_UPLOAD_PROPERTY),iceServers:getIceServers_()};console.log(JSON.stringify(result,null,2));return result;
}

function runTtrpgMaintenance(){
  resetRuntime_();ensureConfigured_();var lock=LockService.getScriptLock();lock.waitLock(30000);try{var now=Date.now(),counts={sessions:0,events:0,signals:0,typing:0,uploads:0};
    filter_('Sessions',function(s){return s.revokedAt||new Date(s.expiresAt).getTime()<now-7*86400000;}).sort(function(a,b){return b._row-a._row;}).forEach(function(r){deleteRow_('Sessions',r._row);counts.sessions++;});
    filter_('Events',function(r){return new Date(r.expiresAt).getTime()<now;}).sort(function(a,b){return b._row-a._row;}).forEach(function(r){deleteRow_('Events',r._row);counts.events++;});
    filter_('RtcSignals',function(r){return r.consumedAt||new Date(r.expiresAt).getTime()<now;}).sort(function(a,b){return b._row-a._row;}).forEach(function(r){deleteRow_('RtcSignals',r._row);counts.signals++;});
    filter_('Typing',function(r){return new Date(r.expiresAt).getTime()<now;}).sort(function(a,b){return b._row-a._row;}).forEach(function(r){deleteRow_('Typing',r._row);counts.typing++;});
    filter_('Attachments',function(a){return !a.deletedAt&&!a.messageId&&new Date(a.createdAt).getTime()<now-24*3600000;}).sort(function(a,b){return b._row-a._row;}).forEach(function(a){try{DriveApp.getFileById(a.fileId).setTrashed(true);}catch(e){}updateRow_('Attachments',a._row,{deletedAt:nowIso_()});counts.uploads++;});
    console.log(JSON.stringify(counts));return counts;
  }finally{lock.releaseLock();}}

function createHourlyMaintenanceTrigger(){ScriptApp.getProjectTriggers().filter(function(t){return t.getHandlerFunction()==='runTtrpgMaintenance';}).forEach(function(t){ScriptApp.deleteTrigger(t);});return ScriptApp.newTrigger('runTtrpgMaintenance').timeBased().everyHours(1).create().getUniqueId();}

/* =============================
 * ROUTE TABLE
 * ============================= */

/* =============================
 * CAMPAIGN ORGANIZER, CALENDAR, AVAILABILITY, AND RULES LIBRARY
 * ============================= */

function publicOrganizerTask_(t){return {id:t.id,serverId:t.serverId,title:t.title,description:t.description||'',status:t.status||'TODO',priority:t.priority||'MEDIUM',assigneeUserId:t.assigneeUserId||'',createdBy:t.createdBy,dueDate:t.dueDate||'',dueTime:t.dueTime||'',recurrence:parseJsonCell_(t.recurrenceJson,{}),tags:parseJsonCell_(t.tagsJson,[]),createdAt:t.createdAt,updatedAt:t.updatedAt,completedAt:t.completedAt||''};}
function requireOrganizerTask_(id,userId){var t=byId_('OrganizerTasks',String(id||''));if(!t)throw new ApiError_('TASK_NOT_FOUND','Campaign task not found.');requireMember_(t.serverId,userId);return t;}
function routeListOrganizerTasks_(ctx){var serverId=String(ctx.params.serverId||'');requireMember_(serverId,ctx.user.id);return filter_('OrganizerTasks',function(t){return t.serverId===serverId&&!t.deletedAt;}).sort(function(a,b){return String(a.dueDate||'9999').localeCompare(String(b.dueDate||'9999'))||new Date(b.createdAt)-new Date(a.createdAt);}).map(publicOrganizerTask_);}
function routeCreateOrganizerTask_(ctx){var serverId=String(ctx.params.serverId||'');requireMember_(serverId,ctx.user.id);var assignee=String(ctx.params.assigneeUserId||'');if(assignee)requireMember_(serverId,assignee);var now=nowIso_(),status=String(ctx.params.status||'TODO').toUpperCase(),priority=String(ctx.params.priority||'MEDIUM').toUpperCase();if(['TODO','IN_PROGRESS','DONE','CANCELLED'].indexOf(status)===-1)status='TODO';if(['LOW','MEDIUM','HIGH'].indexOf(priority)===-1)priority='MEDIUM';var t=insert_('OrganizerTasks',{id:id_('tsk'),serverId:serverId,title:text_(ctx.params.title,160),description:nullableText_(ctx.params.description,4000),status:status,priority:priority,assigneeUserId:assignee,createdBy:ctx.user.id,dueDate:nullableText_(ctx.params.dueDate,20),dueTime:nullableText_(ctx.params.dueTime,20),recurrenceJson:JSON.stringify(ctx.params.recurrence||{}),tagsJson:JSON.stringify(array_(ctx.params.tags).slice(0,20)),createdAt:now,updatedAt:now,completedAt:status==='DONE'?now:'',deletedAt:''});audit_(serverId,ctx.user.id,'ORGANIZER_TASK_CREATED','ORGANIZER_TASK',t.id,{title:t.title});emitServerEvent_(serverId,'ORGANIZER_TASK_CREATED','ORGANIZER_TASK',t.id,{task:publicOrganizerTask_(t)});return publicOrganizerTask_(t);}
function routeUpdateOrganizerTask_(ctx){var t=requireOrganizerTask_(ctx.params.taskId,ctx.user.id);if(t.createdBy!==ctx.user.id&&!hasPermission_(t.serverId,ctx.user.id,PERMISSIONS.MANAGE_ORGANIZER))throw new ApiError_('FORBIDDEN','You can edit only tasks you created unless you have manage organizer permission.');var p=ctx.params,patch={updatedAt:nowIso_()};if(p.title!==undefined)patch.title=text_(p.title,160);if(p.description!==undefined)patch.description=nullableText_(p.description,4000);if(p.status!==undefined){var status=String(p.status).toUpperCase();if(['TODO','IN_PROGRESS','DONE','CANCELLED'].indexOf(status)===-1)throw new ApiError_('INVALID_STATUS','Invalid task status.');patch.status=status;patch.completedAt=status==='DONE'?(t.completedAt||nowIso_()):'';}if(p.priority!==undefined){var priority=String(p.priority).toUpperCase();if(['LOW','MEDIUM','HIGH'].indexOf(priority)===-1)throw new ApiError_('INVALID_PRIORITY','Invalid task priority.');patch.priority=priority;}if(p.assigneeUserId!==undefined){var assignee=String(p.assigneeUserId||'');if(assignee)requireMember_(t.serverId,assignee);patch.assigneeUserId=assignee;}if(p.dueDate!==undefined)patch.dueDate=nullableText_(p.dueDate,20);if(p.dueTime!==undefined)patch.dueTime=nullableText_(p.dueTime,20);if(p.recurrence!==undefined)patch.recurrenceJson=JSON.stringify(p.recurrence||{});if(p.tags!==undefined)patch.tagsJson=JSON.stringify(array_(p.tags).slice(0,20));updateRow_('OrganizerTasks',t._row,patch);var out=byId_('OrganizerTasks',t.id);audit_(t.serverId,ctx.user.id,'ORGANIZER_TASK_UPDATED','ORGANIZER_TASK',t.id,patch);emitServerEvent_(t.serverId,'ORGANIZER_TASK_UPDATED','ORGANIZER_TASK',t.id,{task:publicOrganizerTask_(out)});return publicOrganizerTask_(out);}
function routeCompleteOrganizerTask_(ctx){var t=requireOrganizerTask_(ctx.params.taskId,ctx.user.id),done=ctx.params.completed===undefined?true:bool_(ctx.params.completed),now=nowIso_();updateRow_('OrganizerTasks',t._row,{status:done?'DONE':'TODO',completedAt:done?now:'',updatedAt:now});var out=byId_('OrganizerTasks',t.id);emitServerEvent_(t.serverId,'ORGANIZER_TASK_UPDATED','ORGANIZER_TASK',t.id,{task:publicOrganizerTask_(out)});return publicOrganizerTask_(out);}
function routeDeleteOrganizerTask_(ctx){var t=requireOrganizerTask_(ctx.params.taskId,ctx.user.id);if(t.createdBy!==ctx.user.id&&!hasPermission_(t.serverId,ctx.user.id,PERMISSIONS.MANAGE_ORGANIZER))throw new ApiError_('FORBIDDEN','You cannot delete this campaign task.');updateRow_('OrganizerTasks',t._row,{deletedAt:nowIso_(),updatedAt:nowIso_()});audit_(t.serverId,ctx.user.id,'ORGANIZER_TASK_DELETED','ORGANIZER_TASK',t.id,{});return {deleted:true};}

function publicCalendarItem_(i,viewerId,canViewPrivate){var hide=i.visibility==='RUNNER_ONLY'&&!canViewPrivate&&i.submittedBy!==viewerId;return {id:i.id,serverId:i.serverId,title:hide?'Unavailable':i.title,description:hide?'':(i.description||''),itemType:i.itemType||'OTHER',startAt:i.startAt,endAt:i.endAt||'',allDay:bool_(i.allDay),recurrence:parseJsonCell_(i.recurrenceJson,{}),visibility:i.visibility||'SERVER',submittedBy:i.submittedBy,approvalStatus:i.approvalStatus||'PENDING',approvedBy:i.approvedBy||'',approvedAt:i.approvedAt||'',rejectionReason:i.submittedBy===viewerId||canViewPrivate?(i.rejectionReason||''):'',createdAt:i.createdAt,updatedAt:i.updatedAt};}
function requireCalendarItem_(id,userId){var i=byId_('CalendarItems',String(id||''));if(!i)throw new ApiError_('CALENDAR_ITEM_NOT_FOUND','Calendar item not found.');requireMember_(i.serverId,userId);return i;}
function canApproveCalendar_(serverId,userId){return hasPermission_(serverId,userId,PERMISSIONS.APPROVE_CALENDAR)||hasPermission_(serverId,userId,PERMISSIONS.ADMIN);}
function canViewPrivateAvailability_(serverId,userId){return canApproveCalendar_(serverId,userId)||hasPermission_(serverId,userId,PERMISSIONS.VIEW_PRIVATE_AVAILABILITY)||hasPermission_(serverId,userId,PERMISSIONS.MANAGE_SERVER);}
function routeListCalendarItems_(ctx){var serverId=String(ctx.params.serverId||'');requireMember_(serverId,ctx.user.id);var privateView=canViewPrivateAvailability_(serverId,ctx.user.id),includePending=bool_(ctx.params.includePending);return filter_('CalendarItems',function(i){if(i.serverId!==serverId||i.deletedAt)return false;if(i.submittedBy===ctx.user.id||privateView)return includePending||i.approvalStatus==='APPROVED';if(i.approvalStatus!=='APPROVED')return false;if(i.visibility==='PRIVATE'||i.visibility==='RUNNER_ONLY')return false;return true;}).sort(function(a,b){return new Date(a.startAt)-new Date(b.startAt);}).map(function(i){return publicCalendarItem_(i,ctx.user.id,privateView);});}
function routeSubmitCalendarItem_(ctx){var serverId=String(ctx.params.serverId||'');requireMember_(serverId,ctx.user.id);var type=String(ctx.params.itemType||'OTHER').toUpperCase(),visibility=String(ctx.params.visibility||'SERVER').toUpperCase();if(['SESSION','AVAILABILITY','DOCTOR','BIRTHDAY','PERSONAL','DEADLINE','OTHER'].indexOf(type)===-1)type='OTHER';if(['SERVER','RUNNER_ONLY','PRIVATE'].indexOf(visibility)===-1)visibility='SERVER';var startAt=String(ctx.params.startAt||'');if(!startAt||!isFinite(new Date(startAt).getTime()))throw new ApiError_('INVALID_START','A valid calendar start date is required.');var endAt=String(ctx.params.endAt||'');if(endAt&&!isFinite(new Date(endAt).getTime()))throw new ApiError_('INVALID_END','Calendar end date is invalid.');var now=nowIso_(),i=insert_('CalendarItems',{id:id_('cai'),serverId:serverId,title:text_(ctx.params.title,180),description:nullableText_(ctx.params.description,4000),itemType:type,startAt:new Date(startAt).toISOString(),endAt:endAt?new Date(endAt).toISOString():'',allDay:bool_(ctx.params.allDay),recurrenceJson:JSON.stringify(ctx.params.recurrence||{}),visibility:visibility,submittedBy:ctx.user.id,approvalStatus:'PENDING',approvedBy:'',approvedAt:'',rejectionReason:'',createdAt:now,updatedAt:now,deletedAt:''});audit_(serverId,ctx.user.id,'CALENDAR_ITEM_SUBMITTED','CALENDAR_ITEM',i.id,{itemType:type,approvalStatus:i.approvalStatus});emitServerEvent_(serverId,'CALENDAR_ITEM_SUBMITTED','CALENDAR_ITEM',i.id,{item:publicCalendarItem_(i,ctx.user.id,true)});return publicCalendarItem_(i,ctx.user.id,true);}
function routeApproveCalendarItem_(ctx){var i=requireCalendarItem_(ctx.params.calendarItemId,ctx.user.id);requirePermission_(i.serverId,ctx.user.id,PERMISSIONS.APPROVE_CALENDAR);var now=nowIso_();updateRow_('CalendarItems',i._row,{approvalStatus:'APPROVED',approvedBy:ctx.user.id,approvedAt:now,rejectionReason:'',updatedAt:now});var out=byId_('CalendarItems',i.id);audit_(i.serverId,ctx.user.id,'CALENDAR_ITEM_APPROVED','CALENDAR_ITEM',i.id,{});emitServerEvent_(i.serverId,'CALENDAR_ITEM_APPROVED','CALENDAR_ITEM',i.id,{item:publicCalendarItem_(out,ctx.user.id,true)});return publicCalendarItem_(out,ctx.user.id,true);}
function routeRejectCalendarItem_(ctx){var i=requireCalendarItem_(ctx.params.calendarItemId,ctx.user.id);requirePermission_(i.serverId,ctx.user.id,PERMISSIONS.APPROVE_CALENDAR);var now=nowIso_();updateRow_('CalendarItems',i._row,{approvalStatus:'REJECTED',approvedBy:ctx.user.id,approvedAt:now,rejectionReason:nullableText_(ctx.params.reason,1000),updatedAt:now});var out=byId_('CalendarItems',i.id);audit_(i.serverId,ctx.user.id,'CALENDAR_ITEM_REJECTED','CALENDAR_ITEM',i.id,{reason:out.rejectionReason});emitUserEvent_(i.submittedBy,'CALENDAR_ITEM_REJECTED','CALENDAR_ITEM',i.id,{item:publicCalendarItem_(out,i.submittedBy,true)});return publicCalendarItem_(out,ctx.user.id,true);}
function routeUpdateCalendarItem_(ctx){var i=requireCalendarItem_(ctx.params.calendarItemId,ctx.user.id),manager=canApproveCalendar_(i.serverId,ctx.user.id);if(i.submittedBy!==ctx.user.id&&!manager)throw new ApiError_('FORBIDDEN','You cannot edit this calendar item.');var p=ctx.params,patch={updatedAt:nowIso_()};if(p.title!==undefined)patch.title=text_(p.title,180);if(p.description!==undefined)patch.description=nullableText_(p.description,4000);if(p.itemType!==undefined){var type=String(p.itemType).toUpperCase();if(['SESSION','AVAILABILITY','DOCTOR','BIRTHDAY','PERSONAL','DEADLINE','OTHER'].indexOf(type)===-1)throw new ApiError_('INVALID_TYPE','Invalid calendar item type.');patch.itemType=type;}if(p.startAt!==undefined){if(!isFinite(new Date(p.startAt).getTime()))throw new ApiError_('INVALID_START','Invalid start date.');patch.startAt=new Date(p.startAt).toISOString();}if(p.endAt!==undefined)patch.endAt=p.endAt?new Date(p.endAt).toISOString():'';if(p.allDay!==undefined)patch.allDay=bool_(p.allDay);if(p.visibility!==undefined){var visibility=String(p.visibility).toUpperCase();if(['SERVER','RUNNER_ONLY','PRIVATE'].indexOf(visibility)===-1)throw new ApiError_('INVALID_VISIBILITY','Invalid visibility.');patch.visibility=visibility;}if(p.recurrence!==undefined)patch.recurrenceJson=JSON.stringify(p.recurrence||{});if(!manager){patch.approvalStatus='PENDING';patch.approvedBy='';patch.approvedAt='';patch.rejectionReason='';}updateRow_('CalendarItems',i._row,patch);var out=byId_('CalendarItems',i.id);audit_(i.serverId,ctx.user.id,'CALENDAR_ITEM_UPDATED','CALENDAR_ITEM',i.id,patch);return publicCalendarItem_(out,ctx.user.id,true);}
function routeDeleteCalendarItem_(ctx){var i=requireCalendarItem_(ctx.params.calendarItemId,ctx.user.id);if(i.submittedBy!==ctx.user.id&&!canApproveCalendar_(i.serverId,ctx.user.id))throw new ApiError_('FORBIDDEN','You cannot delete this calendar item.');updateRow_('CalendarItems',i._row,{deletedAt:nowIso_(),updatedAt:nowIso_()});audit_(i.serverId,ctx.user.id,'CALENDAR_ITEM_DELETED','CALENDAR_ITEM',i.id,{});return {deleted:true};}

function publicSystemDocument_(d){return {id:d.id,serverId:d.serverId,systemName:d.systemName,title:d.title,attachmentId:d.attachmentId,fileType:d.fileType,mimeType:d.mimeType,tags:parseJsonCell_(d.tagsJson,[]),versionLabel:d.versionLabel||'',sourceNote:d.sourceNote||'',uploadedBy:d.uploadedBy,status:d.status||'ACTIVE',extractionStatus:d.extractionStatus||'STORED_ONLY',textLength:int_(d.textLength,0),createdAt:d.createdAt,updatedAt:d.updatedAt};}
function requireSystemDocument_(id,userId){var d=byId_('SystemDocuments',String(id||''));if(!d)throw new ApiError_('SYSTEM_DOCUMENT_NOT_FOUND','System document not found.');requireMember_(d.serverId,userId);return d;}
function extractDocxText_(blob){var entries=Utilities.unzip(blob),xml='';for(var i=0;i<entries.length;i++){if(entries[i].getName()==='word/document.xml'){xml=entries[i].getDataAsString('UTF-8');break;}}if(!xml)return '';return xml.replace(/<w:tab\/?\s*>/g,'\t').replace(/<w:br\/?\s*>/g,'\n').replace(/<\/w:p>/g,'\n').replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/[ \t]+/g,' ').replace(/\n\s+/g,'\n').trim();}
function extractPdfText_(blob,title){if(typeof Drive==='undefined'||!Drive.Files||!Drive.Files.insert)return '';var converted=null;try{converted=Drive.Files.insert({title:'Tablegate index '+String(title||'PDF'),mimeType:'application/vnd.google-apps.document'},blob,{convert:true});var text=DocumentApp.openById(converted.id).getBody().getText();return text||'';}finally{if(converted&&converted.id)try{DriveApp.getFileById(converted.id).setTrashed(true);}catch(ignore){}}}
function extractSystemText_(attachment,fileType){var file=DriveApp.getFileById(attachment.fileId),blob=file.getBlob(),type=String(fileType||attachment.mimeType||'').toLowerCase(),text='';if(type.indexOf('json')!==-1||/\.json$/i.test(attachment.originalName)){text=blob.getDataAsString('UTF-8');try{text=JSON.stringify(JSON.parse(text),null,2);}catch(ignore){}}else if(type.indexOf('text')!==-1||/\.txt$/i.test(attachment.originalName))text=blob.getDataAsString('UTF-8');else if(type.indexOf('docx')!==-1||/\.docx$/i.test(attachment.originalName))text=extractDocxText_(blob);else if(type.indexOf('pdf')!==-1||/\.pdf$/i.test(attachment.originalName))text=extractPdfText_(blob,attachment.originalName);text=String(text||'').replace(/\u0000/g,'').trim();return text.slice(0,250000);}
function routeListSystemDocuments_(ctx){var serverId=String(ctx.params.serverId||'');requireMember_(serverId,ctx.user.id);return filter_('SystemDocuments',function(d){return d.serverId===serverId&&!d.deletedAt&&d.status!=='DELETED';}).sort(function(a,b){return String(a.systemName).localeCompare(String(b.systemName))||new Date(b.createdAt)-new Date(a.createdAt);}).map(publicSystemDocument_);}
function routeCreateSystemDocument_(ctx){var serverId=String(ctx.params.serverId||'');requirePermission_(serverId,ctx.user.id,PERMISSIONS.UPLOAD_SYSTEM_FILES,'Your role does not allow TTRPG system uploads.');var attachment=requireAttachmentAccess_(String(ctx.params.attachmentId||''),ctx.user.id,serverId,'');var now=nowIso_(),text='',status='STORED_ONLY';try{text=extractSystemText_(attachment,ctx.params.fileType||ctx.params.mimeType);status=text?'INDEXED':'STORED_ONLY';}catch(err){status='FAILED';console.warn('System document extraction failed: '+err);}var d=insert_('SystemDocuments',{id:id_('sysdoc'),serverId:serverId,systemName:text_(ctx.params.systemName,120),title:text_(ctx.params.title||attachment.originalName,200),attachmentId:attachment.id,fileType:nullableText_(ctx.params.fileType,40),mimeType:nullableText_(ctx.params.mimeType,150)||attachment.mimeType,tagsJson:JSON.stringify(array_(ctx.params.tags).slice(0,30)),versionLabel:nullableText_(ctx.params.versionLabel,100),sourceNote:nullableText_(ctx.params.sourceNote,1000),uploadedBy:ctx.user.id,status:'ACTIVE',extractedText:text,extractionStatus:status,textLength:text.length,createdAt:now,updatedAt:now,deletedAt:''});audit_(serverId,ctx.user.id,'SYSTEM_DOCUMENT_CREATED','SYSTEM_DOCUMENT',d.id,{systemName:d.systemName,title:d.title,extractionStatus:status});emitServerEvent_(serverId,'SYSTEM_DOCUMENT_CREATED','SYSTEM_DOCUMENT',d.id,{document:publicSystemDocument_(d)});return publicSystemDocument_(d);}
function routeReindexSystemDocument_(ctx){var d=requireSystemDocument_(ctx.params.documentId,ctx.user.id);requirePermission_(d.serverId,ctx.user.id,PERMISSIONS.MANAGE_SYSTEM_LIBRARY);var attachment=requireAttachmentAccess_(d.attachmentId,ctx.user.id,d.serverId,''),text='',status='STORED_ONLY';try{text=extractSystemText_(attachment,d.fileType||d.mimeType);status=text?'INDEXED':'STORED_ONLY';}catch(err){status='FAILED';console.warn(err);}updateRow_('SystemDocuments',d._row,{extractedText:text,extractionStatus:status,textLength:text.length,updatedAt:nowIso_()});var out=byId_('SystemDocuments',d.id);audit_(d.serverId,ctx.user.id,'SYSTEM_DOCUMENT_REINDEXED','SYSTEM_DOCUMENT',d.id,{extractionStatus:status,textLength:text.length});return publicSystemDocument_(out);}
function routeDeleteSystemDocument_(ctx){var d=requireSystemDocument_(ctx.params.documentId,ctx.user.id);requirePermission_(d.serverId,ctx.user.id,PERMISSIONS.MANAGE_SYSTEM_LIBRARY);updateRow_('SystemDocuments',d._row,{status:'DELETED',deletedAt:nowIso_(),updatedAt:nowIso_()});audit_(d.serverId,ctx.user.id,'SYSTEM_DOCUMENT_DELETED','SYSTEM_DOCUMENT',d.id,{});return {deleted:true};}

function publicRuleNote_(n){return {id:n.id,serverId:n.serverId,documentId:n.documentId||'',title:n.title,systemName:n.systemName||'',pageRef:n.pageRef||'',text:n.text,tags:parseJsonCell_(n.tagsJson,[]),createdBy:n.createdBy,createdAt:n.createdAt,updatedAt:n.updatedAt};}
function routeListRuleNotes_(ctx){var serverId=String(ctx.params.serverId||'');requireMember_(serverId,ctx.user.id);return filter_('RuleNotes',function(n){return n.serverId===serverId&&!n.deletedAt;}).map(publicRuleNote_);}
function routeCreateRuleNote_(ctx){var serverId=String(ctx.params.serverId||'');requireMember_(serverId,ctx.user.id);var documentId=String(ctx.params.documentId||'');if(documentId){var d=requireSystemDocument_(documentId,ctx.user.id);if(d.serverId!==serverId)throw new ApiError_('INVALID_DOCUMENT','Rule note document belongs to another server.');}var now=nowIso_(),n=insert_('RuleNotes',{id:id_('rnote'),serverId:serverId,documentId:documentId,title:text_(ctx.params.title,180),systemName:nullableText_(ctx.params.systemName,120),pageRef:nullableText_(ctx.params.pageRef,120),text:text_(ctx.params.text,12000),tagsJson:JSON.stringify(array_(ctx.params.tags).slice(0,30)),createdBy:ctx.user.id,createdAt:now,updatedAt:now,deletedAt:''});audit_(serverId,ctx.user.id,'RULE_NOTE_CREATED','RULE_NOTE',n.id,{documentId:documentId});return publicRuleNote_(n);}
function routeDeleteRuleNote_(ctx){var n=byId_('RuleNotes',String(ctx.params.ruleNoteId||''));if(!n)throw new ApiError_('RULE_NOTE_NOT_FOUND','Rule note not found.');requireMember_(n.serverId,ctx.user.id);if(n.createdBy!==ctx.user.id&&!hasPermission_(n.serverId,ctx.user.id,PERMISSIONS.MANAGE_SYSTEM_LIBRARY))throw new ApiError_('FORBIDDEN','You cannot delete this rule note.');updateRow_('RuleNotes',n._row,{deletedAt:nowIso_(),updatedAt:nowIso_()});return {deleted:true};}

function ruleTokens_(query){var stop={the:1,and:1,for:1,with:1,that:1,this:1,from:1,what:1,when:1,where:1,which:1,does:1,into:1,roll:1,rules:1};var found={},out=[];String(query||'').toLowerCase().split(/[^a-z0-9]+/).forEach(function(t){if(t.length>2&&!stop[t]&&!found[t]){found[t]=true;out.push(t);}});return out.slice(0,30);}
function excerptAround_(text,tokens){var lower=text.toLowerCase(),pos=-1;for(var i=0;i<tokens.length;i++){var p=lower.indexOf(tokens[i]);if(p!==-1&&(pos===-1||p<pos))pos=p;}if(pos<0)pos=0;var start=Math.max(0,pos-220),end=Math.min(text.length,start+900);return (start>0?'…':'')+text.slice(start,end).replace(/\s+/g,' ').trim()+(end<text.length?'…':'');}
function suggestedRollFor_(query,system){var direct=String(query||'').match(/\b\d*d\d+(?:\s*[+\-]\s*\d+)?\b/i);if(direct)return direct[0].replace(/\s+/g,'');system=String(system||'').toLowerCase();if(system.indexOf('gurps')!==-1)return '3d6';if(system.indexOf('cthulhu')!==-1)return '1d100';if(system.indexOf('pathfinder')!==-1||system.indexOf('dungeons')!==-1||system.indexOf('starfinder')!==-1)return '1d20';return '';}
function routeAskRulesAssistant_(ctx){var serverId=String(ctx.params.serverId||'');requirePermission_(serverId,ctx.user.id,PERMISSIONS.USE_RULES_ASSISTANT);var query=text_(ctx.params.query,2000),tokens=ruleTokens_(query),limit=int_(ctx.params.limit,6,1,12),matches=[];filter_('SystemDocuments',function(d){return d.serverId===serverId&&!d.deletedAt&&d.status==='ACTIVE'&&d.extractedText;}).forEach(function(d){var text=String(d.extractedText||''),lower=text.toLowerCase(),score=0;tokens.forEach(function(t){var pos=0,count=0;while((pos=lower.indexOf(t,pos))!==-1&&count<50){count++;pos+=t.length;}score+=count;} );tokens.forEach(function(t){if(lower_(d.title).indexOf(t)!==-1)score+=5;if(lower_(d.systemName).indexOf(t)!==-1)score+=4;});if(score>0)matches.push({score:score,title:d.title,systemName:d.systemName,pageRef:'',excerpt:excerptAround_(text,tokens),documentId:d.id});});filter_('RuleNotes',function(n){return n.serverId===serverId&&!n.deletedAt;}).forEach(function(n){var text=String(n.text||''),lower=text.toLowerCase(),score=0;tokens.forEach(function(t){if(lower.indexOf(t)!==-1)score+=3;});if(score>0)matches.push({score:score,title:n.title,systemName:n.systemName,pageRef:n.pageRef,excerpt:excerptAround_(text,tokens),ruleNoteId:n.id});});matches.sort(function(a,b){return b.score-a.score;});matches=matches.slice(0,limit);var system=matches.length?matches[0].systemName:'',roll=suggestedRollFor_(query,system),answer=matches.length?'Found '+matches.length+' grounded match'+(matches.length===1?'':'es')+' in the campaign rules library. Verify the cited passage before applying a ruling.':'No indexed passage matched. Upload an indexable text, JSON, or DOCX file, enable the Advanced Drive service for PDF conversion, or add a manual rule note.';audit_(serverId,ctx.user.id,'RULES_ASSISTANT_QUERIED','SERVER',serverId,{query:query,matchCount:matches.length});return {answer:answer,suggestedRoll:roll,sources:matches};}

function routeGetOrganizerSummary_(ctx){var serverId=String(ctx.params.serverId||'');requireMember_(serverId,ctx.user.id);var now=Date.now(),tasks=filter_('OrganizerTasks',function(t){return t.serverId===serverId&&!t.deletedAt&&t.status!=='DONE'&&t.status!=='CANCELLED';}),pending=filter_('CalendarItems',function(i){return i.serverId===serverId&&!i.deletedAt&&i.approvalStatus==='PENDING';}),next=filter_('CalendarItems',function(i){return i.serverId===serverId&&!i.deletedAt&&i.approvalStatus==='APPROVED'&&i.itemType==='SESSION'&&new Date(i.startAt).getTime()>=now;}).sort(function(a,b){return new Date(a.startAt)-new Date(b.startAt);})[0]||null;return {openTasks:tasks.length,pendingCalendar:pending.length,systemDocuments:filter_('SystemDocuments',function(d){return d.serverId===serverId&&!d.deletedAt&&d.status==='ACTIVE';}).length,nextSession:next?publicCalendarItem_(next,ctx.user.id,canViewPrivateAvailability_(serverId,ctx.user.id)):null};}

function routeOrganizerHealth_(ctx){var serverId=String(ctx.params.serverId||'');requireMember_(serverId,ctx.user.id);return {active:true,shared:true,version:'1.1.0',apiVersion:TTRPG.API_VERSION,schemaVersion:PropertiesService.getScriptProperties().getProperty('TTRPG_SCHEMA_VERSION')||TTRPG.SCHEMA_VERSION,tables:{tasks:true,calendar:true,systemDocuments:true,ruleNotes:true}};}


var ROUTES_ = Object.freeze({
  health:{fn:routeHealth_,auth:false,write:false},tablegate_ping:{fn:routeTableGatePing_,auth:false,write:false},
  previewInvite:{fn:routePreviewInvite_,auth:false,write:false},
  register:{fn:routeRegister_,auth:false,write:true},
  login:{fn:routeLogin_,auth:false,write:true},
  logout:{fn:routeLogout_,write:true},logoutAll:{fn:routeLogoutAll_,write:true},me:{fn:routeMe_,write:false},updateProfile:{fn:routeUpdateProfile_,write:true},changePassword:{fn:routeChangePassword_,write:true},searchUsers:{fn:routeSearchUsers_,write:false},getClientConfig:{fn:routeGetClientConfig_,write:false},
  listServers:{fn:routeListServers_,write:false},createServer:{fn:routeCreateServer_,write:true},getServer:{fn:routeGetServer_,write:false},updateServer:{fn:routeUpdateServer_,write:true},deleteServer:{fn:routeDeleteServer_,write:true},leaveServer:{fn:routeLeaveServer_,write:true},transferOwnership:{fn:routeTransferOwnership_,write:true},
  listMembers:{fn:routeListMembers_,write:false},updateMember:{fn:routeUpdateMember_,write:true},kickMember:{fn:routeKickMember_,write:true},banMember:{fn:routeBanMember_,write:true},unbanMember:{fn:routeUnbanMember_,write:true},listBans:{fn:routeListBans_,write:false},
  listRoles:{fn:routeListRoles_,write:false},createRole:{fn:routeCreateRole_,write:true},updateRole:{fn:routeUpdateRole_,write:true},deleteRole:{fn:routeDeleteRole_,write:true},assignRole:{fn:routeAssignRole_,write:true},removeRole:{fn:routeRemoveRole_,write:true},
  createInvite:{fn:routeCreateInvite_,write:true},listInvites:{fn:routeListInvites_,write:false},revokeInvite:{fn:routeRevokeInvite_,write:true},joinInvite:{fn:routeJoinInvite_,write:true},
  listCategories:{fn:routeListCategories_,write:false},createCategory:{fn:routeCreateCategory_,write:true},updateCategory:{fn:routeUpdateCategory_,write:true},deleteCategory:{fn:routeDeleteCategory_,write:true},
  listChannels:{fn:routeListChannels_,write:false},createChannel:{fn:routeCreateChannel_,write:true},updateChannel:{fn:routeUpdateChannel_,write:true},deleteChannel:{fn:routeDeleteChannel_,write:true},
  listMessages:{fn:routeListMessages_,write:false},sendMessage:{fn:routeSendMessage_,write:true},editMessage:{fn:routeEditMessage_,write:true},deleteMessage:{fn:routeDeleteMessage_,write:true},purgeMessages:{fn:routePurgeMessages_,write:true},pinMessage:{fn:routePinMessage_,write:true},listPins:{fn:routeListPins_,write:false},addReaction:{fn:routeAddReaction_,write:true},removeReaction:{fn:routeRemoveReaction_,write:true},searchMessages:{fn:routeSearchMessages_,write:false},startTyping:{fn:routeStartTyping_,write:true},listTyping:{fn:routeListTyping_,write:false},markRead:{fn:routeMarkRead_,write:true},unreadCounts:{fn:routeUnreadCounts_,write:false},
  createDm:{fn:routeCreateDm_,write:true},createGroupDm:{fn:routeCreateGroupDm_,write:true},listDms:{fn:routeListDms_,write:false},getDm:{fn:routeGetDm_,write:false},updateGroupDm:{fn:routeUpdateGroupDm_,write:true},addDmParticipant:{fn:routeAddDmParticipant_,write:true},removeDmParticipant:{fn:routeRemoveDmParticipant_,write:true},transferDmOwnership:{fn:routeTransferDmOwnership_,write:true},closeDm:{fn:routeCloseDm_,write:true},
  listFriends:{fn:routeListFriends_,write:false},sendFriendRequest:{fn:routeSendFriendRequest_,write:true},acceptFriend:{fn:routeAcceptFriend_,write:true},declineFriend:{fn:routeDeclineFriend_,write:true},removeFriend:{fn:routeRemoveFriend_,write:true},blockUser:{fn:routeBlockUser_,write:true},unblockUser:{fn:routeUnblockUser_,write:true},ignoreUser:{fn:routeIgnoreUser_,write:true},unignoreUser:{fn:routeUnignoreUser_,write:true},listSafety:{fn:routeListSafety_,write:false},
  uploadAttachment:{fn:routeUploadAttachment_,write:true},downloadAttachment:{fn:routeDownloadAttachment_,write:false},deleteAttachment:{fn:routeDeleteAttachment_,write:true},
  heartbeat:{fn:routeHeartbeat_,write:true},setPresence:{fn:routeSetPresence_,write:true},listPresence:{fn:routeListPresence_,write:false},listNotifications:{fn:routeListNotifications_,write:false},markNotificationRead:{fn:routeMarkNotificationRead_,write:true},pollEvents:{fn:routePollEvents_,write:false},
  joinVoice:{fn:routeJoinVoice_,write:true},updateVoice:{fn:routeUpdateVoice_,write:true},leaveVoice:{fn:routeLeaveVoice_,write:true},listVoiceStates:{fn:routeListVoiceStates_,write:false},
  getActiveCall:{fn:routeGetActiveCall_,write:false},startCall:{fn:routeStartCall_,write:true},acceptCall:{fn:routeAcceptCall_,write:true},joinCall:{fn:routeJoinCall_,write:true},declineCall:{fn:routeDeclineCall_,write:true},leaveCall:{fn:routeLeaveCall_,write:true},
  sendRtcSignal:{fn:routeSendRtcSignal_,write:true},pollRtcSignals:{fn:routePollRtcSignals_,write:false},ackRtcSignals:{fn:routeAckRtcSignals_,write:true},
  listPersonas:{fn:routeListPersonas_,write:false},createPersona:{fn:routeCreatePersona_,write:true},updatePersona:{fn:routeUpdatePersona_,write:true},deletePersona:{fn:routeDeletePersona_,write:true},rollDice:{fn:routeRollDice_,write:true},record3dDiceRoll:{fn:routeRecord3dDiceRoll_,write:true},rollPrivateDice:{fn:routeRollPrivateDice_,write:true},listDiceRolls:{fn:routeListDiceRolls_,write:false},
  listOrganizerTasks:{fn:routeListOrganizerTasks_,write:false},createOrganizerTask:{fn:routeCreateOrganizerTask_,write:true},updateOrganizerTask:{fn:routeUpdateOrganizerTask_,write:true},completeOrganizerTask:{fn:routeCompleteOrganizerTask_,write:true},deleteOrganizerTask:{fn:routeDeleteOrganizerTask_,write:true},
  listCalendarItems:{fn:routeListCalendarItems_,write:false},submitCalendarItem:{fn:routeSubmitCalendarItem_,write:true},approveCalendarItem:{fn:routeApproveCalendarItem_,write:true},rejectCalendarItem:{fn:routeRejectCalendarItem_,write:true},updateCalendarItem:{fn:routeUpdateCalendarItem_,write:true},deleteCalendarItem:{fn:routeDeleteCalendarItem_,write:true},
  listSystemDocuments:{fn:routeListSystemDocuments_,write:false},createSystemDocument:{fn:routeCreateSystemDocument_,write:true},reindexSystemDocument:{fn:routeReindexSystemDocument_,write:true},deleteSystemDocument:{fn:routeDeleteSystemDocument_,write:true},
  listRuleNotes:{fn:routeListRuleNotes_,write:false},createRuleNote:{fn:routeCreateRuleNote_,write:true},deleteRuleNote:{fn:routeDeleteRuleNote_,write:true},askRulesAssistant:{fn:routeAskRulesAssistant_,write:false},getOrganizerSummary:{fn:routeGetOrganizerSummary_,write:false},organizerHealth:{fn:routeOrganizerHealth_,write:false},
  tablegate_profile_upsert:{fn:routeTableGateProfileUpsert_,write:true},tablegate_character_upsert:{fn:routeTableGateCharacterUpsert_,write:true},tablegate_character_delete:{fn:routeTableGateCharacterDelete_,write:true},tablegate_snapshot_upsert:{fn:routeTableGateSnapshotUpsert_,write:true},listAuditLog:{fn:routeListAuditLog_,write:false}
});
