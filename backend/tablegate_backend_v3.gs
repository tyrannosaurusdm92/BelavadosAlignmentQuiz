/**
 * Tablegate Backend V3 — Google Apps Script (single-file deployment)
 * File name: tablegate.gs
 *
 * MERGED FEATURE SET
 * - Invite-only campaign tablegates with creator, moderator, and player roles
 * - Text, announcement, handout, voice, and video channels grouped by category
 * - Tablegate/channel/member/role/invite management and audit logging
 * - Channel chat, DMs, group DMs, replies, edits, soft-delete, purge, pins,
 *   reactions, attachments, mentions, search, typing, unread/read markers
 * - Friends, blocks, ignores, profiles, presence, notifications
 * - Voice state, DM calls, WebRTC offer/answer/ICE signaling, screen-share state,
 *   push-to-talk state, and whisper signaling
 * - Tablegate character personas and auditable tablegate-side dice rolls
 * - Polling event gateway as an Apps Script-compatible Socket.io fallback
 * - Authenticated AI chat/request proxy to the configured AI Apps Script backend
 * - Durable AI conversations, scoped memory, knowledge retrieval, citations, personalities
 * - Email verification, expiring password reset codes, projects, assets, maps, NPC/transit simulation
 * - External web/image search, image generation, reference generation, and parsing provider orchestration
 *
 * IMPORTANT VOICE NOTE
 * Apps Script cannot host WebSockets or relay live audio/video media. The browser
 * frontend must use RTCPeerConnection. This backend authorizes rooms, lists peers,
 * and exchanges WebRTC signals through sendRtcSignal/pollRtcSignals or pollEvents.
 * For reliable connections across strict NAT/firewalls, set RTC_ICE_SERVERS_JSON
 * to include a TURN server. The default contains public STUN only.
 *
 * AI BACKEND
 * Web app: https://script.google.com/macros/s/AKfycbzko-wf92rlr5M6MOSVZQRH0xTL_K8Jhk-qvGSX85IWFcWCFGzcWby9CJriCdlHBRM/exec
 * Library: 1YSRVPzfI1eq2WvlxR3q3ptoBlBJyWJNkgv1UEr3BLv9NgDs0MNxYEn76 (version 1)
 * Add the library manually in Apps Script Project Settings if direct library calls are needed.
 *
 * FIRST-TIME SETUP
 * 1. Create a standalone Apps Script project.
 * 2. Paste this entire file into tablegate.gs.
 * 3. Run setupTablegate() once from the editor and authorize it.
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
 * {action:'listTablegates', token:'...'}
 *
 * All responses use HTTP 200 with {ok:true,data:...} or
 * {ok:false,error:{code,message,details}} because ContentService cannot reliably
 * set custom HTTP status codes.
 */

var TABLEGATE = Object.freeze({
  API_VERSION: '3.0.0',
  SCHEMA_VERSION: '2026-07-29.1',
  DB_PROPERTY: 'TABLEGATE_DB_ID',
  UPLOAD_FOLDER_PROPERTY: 'TABLEGATE_UPLOAD_FOLDER_ID',
  PEPPER_PROPERTY: 'TABLEGATE_PASSWORD_PEPPER',
  REGISTRATION_MODE_PROPERTY: 'TABLEGATE_REGISTRATION_MODE',
  SESSION_DAYS_PROPERTY: 'TABLEGATE_SESSION_DAYS',
  MAX_UPLOAD_PROPERTY: 'TABLEGATE_MAX_UPLOAD_BYTES',
  RTC_ICE_PROPERTY: 'RTC_ICE_SERVERS_JSON',
  AI_BACKEND_URL_PROPERTY: 'TABLEGATE_AI_BACKEND_URL',
  AI_TIMEOUT_MS_PROPERTY: 'TABLEGATE_AI_TIMEOUT_MS',
  APP_NAME_PROPERTY: 'TABLEGATE_APP_NAME',
  PUBLIC_APP_URL_PROPERTY: 'TABLEGATE_PUBLIC_APP_URL',
  EMAIL_VERIFICATION_REQUIRED_PROPERTY: 'TABLEGATE_EMAIL_VERIFICATION_REQUIRED',
  EMAIL_CODE_MINUTES_PROPERTY: 'TABLEGATE_EMAIL_CODE_MINUTES',
  RESET_CODE_MINUTES_PROPERTY: 'TABLEGATE_RESET_CODE_MINUTES',
  MAX_INLINE_AI_FILE_BYTES_PROPERTY: 'TABLEGATE_MAX_INLINE_AI_FILE_BYTES',
  INTEGRATIONS_PROPERTY: 'TABLEGATE_INTEGRATIONS_JSON',
  AI_LIBRARY_ID: '1YSRVPzfI1eq2WvlxR3q3ptoBlBJyWJNkgv1UEr3BLv9NgDs0MNxYEn76',
  AI_LIBRARY_VERSION: '1',
  DEFAULT_AI_BACKEND_URL: 'https://script.google.com/macros/s/AKfycbzko-wf92rlr5M6MOSVZQRH0xTL_K8Jhk-qvGSX85IWFcWCFGzcWby9CJriCdlHBRM/exec',
  DEFAULT_AI_TIMEOUT_MS: 30000,
  DEFAULT_MAX_INLINE_AI_FILE_BYTES: 4 * 1024 * 1024,
  AUTH_CHALLENGE_MAX_ATTEMPTS: 5,
  AI_CONVERSATION_CONTEXT: 80,
  MAX_KNOWLEDGE_TEXT_CHARS: 40000,
  MAX_MAP_FEATURES_PER_REQUEST: 500,
  SIM_TICK_LIMIT: 500,
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
  MAX_JSON_CELL_CHARS: 45000,
  MAX_MECHANIC_DICE: 500,
  SYSTEM_TYPES: ['BUILT_IN', 'CUSTOM', 'HOMEBREW', 'GENERIC', 'HYBRID'],
  SYSTEM_VISIBILITIES: ['PUBLIC', 'UNLISTED', 'TABLEGATE', 'PRIVATE'],
  SYSTEM_MODES: ['SINGLE', 'MULTI', 'HYBRID', 'SYSTEM_AGNOSTIC'],
  CONTENT_VISIBILITIES: ['PUBLIC', 'TABLEGATE', 'PRIVATE'],
  CONTENT_STATUSES: ['DRAFT', 'ACTIVE', 'ARCHIVED'],
  MECHANIC_ENGINES: ['DICE_EXPRESSION', 'DICE_POOL', 'FUDGE', 'PERCENTILE', 'DUAL_DICE', 'CUSTOM_FACES', 'CARD_DRAW', 'TABLE_LOOKUP', 'MANUAL', 'CUSTOM'],
  REGISTRATION_MODES: ['OPEN', 'INVITE_ONLY', 'INVITE_OR_FIRST_USER', 'CLOSED'],
  CHANNEL_TYPES: ['TEXT', 'ANNOUNCEMENT', 'HANDOUTS', 'VOICE', 'VIDEO'],
  MESSAGE_TYPES: ['CHAT', 'IN_CHARACTER', 'OUT_OF_CHARACTER', 'SYSTEM', 'ROLL', 'HANDOUT'],
  PRESENCE_STATUSES: ['ONLINE', 'IDLE', 'DO_NOT_DISTURB', 'OFFLINE'],
  RTC_ROOM_TYPES: ['VOICE', 'DM_CALL', 'WHISPER'],
  RTC_SIGNAL_TYPES: [
    'OFFER', 'ANSWER', 'ICE', 'RENEGOTIATE', 'HANGUP',
    'MEDIA_STATE', 'SCREEN_SHARE_START', 'SCREEN_SHARE_STOP',
    'WHISPER_OFFER', 'WHISPER_ANSWER', 'WHISPER_ICE'
  ]
});


var BUILT_IN_SYSTEMS = Object.freeze([
  {id:'sys_tablegate_generic',slug:'system-agnostic',name:'System-Agnostic / Custom',family:'Universal',edition:'Open',version:'1',systemType:'GENERIC',description:'A neutral profile for original, homebrew, unpublished, hybrid, and otherwise unlisted tabletop roleplaying systems.',bundledFile:'',defaultMechanic:{engine:'MANUAL'}},
  {id:'sys_dnd_5e_55e',slug:'dnd-5e-55e',name:'Dungeons & Dragons 5e / 2024 Rules',family:'d20',edition:'5e and 2024 revision',version:'reference-v3',systemType:'BUILT_IN',description:'Reference profile for the bundled D&D character and rules data.',bundledFile:'dnd_5e_5_5e_complete_character_reference_v3_all_official_races.json',defaultMechanic:{engine:'DICE_EXPRESSION',expression:'1d20'}},
  {id:'sys_fate_core',slug:'fate-core',name:'Fate Core',family:'Fate',edition:'Core',version:'reference-v2',systemType:'BUILT_IN',description:'Reference profile for the bundled Fate Core guide.',bundledFile:'fate_core_complete_how_to_play_reference_v2.json',defaultMechanic:{engine:'FUDGE',count:4}},
  {id:'sys_gurps_4e',slug:'gurps-4e-revised',name:'GURPS Fourth Edition',family:'GURPS',edition:'4e revised',version:'reference-v2',systemType:'BUILT_IN',description:'Reference profile for the bundled GURPS Fourth Edition guide.',bundledFile:'gurps_4e_revised_complete_character_reference_v2.json',defaultMechanic:{engine:'DICE_EXPRESSION',expression:'3d6'}},
  {id:'sys_coc_7e',slug:'call-of-cthulhu-7e',name:'Call of Cthulhu Seventh Edition',family:'Basic Roleplaying',edition:'7e',version:'reference-v2',systemType:'BUILT_IN',description:'Reference profile for the bundled Call of Cthulhu Seventh Edition guide.',bundledFile:'how_to_play_coc_7e_complete_reference_v2.json',defaultMechanic:{engine:'PERCENTILE'}},
  {id:'sys_daggerheart',slug:'daggerheart',name:'Daggerheart',family:'Duality Dice',edition:'Current',version:'reference-v2',systemType:'BUILT_IN',description:'Reference profile for the bundled Daggerheart guide.',bundledFile:'how_to_play_daggerheart_complete_reference_v2.json',defaultMechanic:{engine:'DUAL_DICE',dice:[{label:'Hope',sides:12},{label:'Fear',sides:12}]}},
  {id:'sys_pf2e_remaster',slug:'pathfinder-2e-remastered',name:'Pathfinder Second Edition Remastered',family:'d20',edition:'2e Remastered',version:'reference-v2',systemType:'BUILT_IN',description:'Reference profile for the bundled Pathfinder Second Edition Remastered guide.',bundledFile:'how_to_play_pathfinder_2e_remastered_complete_reference_v2.json',defaultMechanic:{engine:'DICE_EXPRESSION',expression:'1d20'}},
  {id:'sys_pbta',slug:'powered-by-the-apocalypse',name:'Powered by the Apocalypse',family:'PbtA',edition:'Family profile',version:'reference-v2',systemType:'BUILT_IN',description:'Flexible family profile for PbtA games, including non-2d6 variants.',bundledFile:'how_to_play_powered_by_the_apocalypse_complete_reference_v2.json',defaultMechanic:{engine:'DICE_EXPRESSION',expression:'2d6'}},
  {id:'sys_swade',slug:'savage-worlds-swade',name:'Savage Worlds Adventure Edition',family:'Savage Worlds',edition:'SWADE',version:'reference-v2',systemType:'BUILT_IN',description:'Reference profile for the bundled Savage Worlds Adventure Edition guide.',bundledFile:'savage_worlds_swade_complete_reference_v2.json',defaultMechanic:{engine:'DICE_POOL',count:2,sides:6,keep:'HIGHEST',keepCount:1}}
]);

var PERMISSIONS = Object.freeze({
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

var PLAYER_PERMISSIONS =
  PERMISSIONS.SEND_MESSAGES |
  PERMISSIONS.READ_MESSAGES |
  PERMISSIONS.CONNECT_VOICE |
  PERMISSIONS.SPEAK |
  PERMISSIONS.ATTACH_FILES |
  PERMISSIONS.STREAM |
  PERMISSIONS.USE_PERSONAS |
  PERMISSIONS.ROLL_DICE |
  PERMISSIONS.USE_MECHANICS;

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
  PERMISSIONS.MANAGE_SYSTEMS |
  PERMISSIONS.MANAGE_CHARACTERS;

var TABLES = Object.freeze({
  Users: ['id','email','username','discriminator','passwordSalt','passwordHash','avatarAttachmentId','bannerAttachmentId','bio','status','customStatus','createdAt','updatedAt','lastSeenAt','disabled','discoverable','emailVerified','emailVerifiedAt','failedLoginCount','lockedUntil'],
  Sessions: ['id','userId','tokenHash','createdAt','expiresAt','lastSeenAt','revokedAt','userAgent'],
  Tablegates: ['id','name','description','iconAttachmentId','ownerId','isPublic','inviteOnly','createdAt','updatedAt','deletedAt','primarySystemId','systemMode','systemConfigJson','houseRulesJson','safetyToolsJson'],
  Members: ['id','tablegateId','userId','nickname','joinedAt','updatedAt','leftAt','timedOutUntil'],
  Bans: ['id','tablegateId','userId','actorId','reason','createdAt','revokedAt','revokedBy'],
  Roles: ['id','tablegateId','name','color','permissions','position','isManaged','managedKey','createdAt','updatedAt'],
  MemberRoles: ['id','tablegateId','userId','roleId','createdAt'],
  Categories: ['id','tablegateId','name','position','createdBy','createdAt','updatedAt','deletedAt'],
  Channels: ['id','tablegateId','categoryId','name','topic','type','position','userLimit','slowmodeSeconds','isPrivate','allowedRoleIds','isSystem','createdBy','createdAt','updatedAt','deletedAt'],
  Invites: ['id','tablegateId','code','createdBy','maxUses','uses','expiresAt','revokedAt','createdAt'],
  Messages: ['id','scopeType','scopeId','tablegateId','authorId','personaId','messageType','content','attachmentIds','replyToId','mentionUserIds','mentionRoleIds','mentionsEveryone','isPinned','pinnedBy','pinnedAt','createdAt','editedAt','deletedAt','deletedBy'],
  Reactions: ['id','messageId','userId','emoji','createdAt'],
  ChannelReads: ['id','channelId','userId','lastMessageId','lastReadAt'],
  DmChannels: ['id','type','pairKey','name','iconAttachmentId','ownerId','createdAt','updatedAt','closedAt'],
  DmParticipants: ['id','dmId','userId','role','joinedAt','leftAt'],
  Friendships: ['id','pairKey','requesterId','addresseeId','status','createdAt','updatedAt'],
  SafetyRelations: ['id','userId','targetUserId','type','createdAt','revokedAt'],
  Presence: ['id','userId','status','customStatus','lastSeenAt','updatedAt'],
  Typing: ['id','scopeType','scopeId','userId','expiresAt','updatedAt'],
  VoiceStates: ['id','tablegateId','channelId','userId','sessionId','muted','deafened','videoEnabled','screenSharing','pushToTalk','whispering','joinedAt','updatedAt'],
  Calls: ['id','dmId','initiatorId','status','createdAt','startedAt','endedAt','updatedAt'],
  CallParticipants: ['id','callId','userId','status','joinedAt','leftAt','updatedAt'],
  RtcSignals: ['id','roomType','roomId','fromUserId','toUserId','signalType','signalJson','createdAt','expiresAt','consumedAt'],
  Attachments: ['id','ownerId','tablegateId','dmId','scopeType','scopeId','messageId','fileId','originalName','storedName','mimeType','sizeBytes','sha256','createdAt','deletedAt'],
  Personas: ['id','tablegateId','userId','name','avatarAttachmentId','color','description','isDefault','createdAt','updatedAt','deletedAt'],
  DiceRolls: ['id','tablegateId','channelId','userId','personaId','expression','label','total','detailJson','messageId','createdAt','systemId','macroId','mechanicType'],
  GameSystems: ['id','ownerId','name','slug','family','edition','version','systemType','visibility','description','publisher','licenseName','sourceUrl','attribution','defaultMechanicJson','characterSchemaJson','metadataJson','createdAt','updatedAt','deletedAt'],
  TablegateSystems: ['id','tablegateId','systemId','label','isPrimary','enabled','configJson','houseRulesJson','createdBy','createdAt','updatedAt','deletedAt'],
  SystemDocuments: ['id','tablegateId','systemId','ownerId','title','documentType','version','attachmentId','contentHash','metadataJson','visibility','createdAt','updatedAt','deletedAt'],
  HomebrewContent: ['id','tablegateId','systemId','ownerId','contentType','name','version','status','visibility','tagsJson','dataJson','schemaJson','sourceAttribution','createdAt','updatedAt','deletedAt'],
  CharacterSheets: ['id','tablegateId','systemId','userId','ownerId','name','pronouns','concept','avatarAttachmentId','schemaVersion','dataJson','privateNotesJson','visibility','isArchived','createdAt','updatedAt','deletedAt'],
  RollMacros: ['id','tablegateId','systemId','ownerId','name','description','mechanicJson','visibility','createdAt','updatedAt','deletedAt'],
  MechanicRolls: ['id','tablegateId','channelId','userId','personaId','characterId','systemId','macroId','engine','label','requestJson','resultJson','messageId','createdAt'],
  AuthChallenges: ['id','userId','email','type','codeHash','tokenHash','createdAt','expiresAt','usedAt','attempts','requestedIp','userAgent','metadataJson'],
  AiConversations: ['id','userId','tablegateId','title','personalityId','systemPrompt','model','settingsJson','createdAt','updatedAt','archivedAt'],
  AiMessages: ['id','conversationId','userId','role','content','attachmentIds','citationIds','metadataJson','createdAt'],
  MemoryItems: ['id','userId','tablegateId','conversationId','scope','memoryType','title','content','tagsJson','importance','sourceMessageId','createdAt','updatedAt','expiresAt','deletedAt'],
  KnowledgeSources: ['id','userId','tablegateId','projectId','title','sourceType','sourceUrl','attachmentId','contentText','contentHash','tagsJson','metadataJson','createdAt','updatedAt','deletedAt'],
  Citations: ['id','userId','tablegateId','conversationId','messageId','sourceType','sourceId','title','url','locator','quoteText','metadataJson','createdAt'],
  Personalities: ['id','ownerId','tablegateId','name','description','systemPrompt','styleJson','visibility','createdAt','updatedAt','deletedAt'],
  LearningFeedback: ['id','userId','conversationId','messageId','rating','category','feedback','acceptedCorrection','metadataJson','createdAt'],
  AssetFolders: ['id','ownerId','tablegateId','parentId','name','driveFolderId','createdAt','updatedAt','deletedAt'],
  AssetIndex: ['id','attachmentId','ownerId','tablegateId','folderId','assetType','title','tagsJson','metadataJson','createdAt','updatedAt','deletedAt'],
  Projects: ['id','ownerId','tablegateId','name','projectType','description','status','driveFolderId','settingsJson','createdAt','updatedAt','deletedAt'],
  ProjectItems: ['id','projectId','parentId','itemType','name','status','attachmentId','dataJson','orderIndex','createdAt','updatedAt','deletedAt'],
  IntegrationJobs: ['id','userId','tablegateId','projectId','provider','operation','status','requestJson','resultJson','errorJson','createdAt','startedAt','completedAt'],
  MapProjects: ['id','projectId','tablegateId','ownerId','name','backgroundAttachmentId','width','height','projection','settingsJson','createdAt','updatedAt','deletedAt'],
  MapLayers: ['id','mapId','name','layerType','orderIndex','visible','styleJson','createdAt','updatedAt','deletedAt'],
  MapFeatures: ['id','mapId','layerId','featureType','name','semanticType','geometryJson','propertiesJson','linkedEntityType','linkedEntityId','createdAt','updatedAt','deletedAt'],
  SimulationWorlds: ['id','projectId','tablegateId','ownerId','name','currentTime','timeScale','paused','settingsJson','lastTickAt','createdAt','updatedAt','deletedAt'],
  Npcs: ['id','worldId','tablegateId','ownerId','name','pronouns','species','occupation','personalityJson','needsJson','traitsJson','locationType','locationId','stateJson','avatarAttachmentId','createdAt','updatedAt','deletedAt'],
  NpcSchedules: ['id','npcId','dayPattern','startTime','endTime','locationType','locationId','activity','priority','conditionsJson','createdAt','updatedAt','deletedAt'],
  NpcRelationships: ['id','worldId','fromNpcId','toNpcId','relationshipType','affinity','trust','tension','notes','metadataJson','createdAt','updatedAt','deletedAt'],
  SimulationEvents: ['id','worldId','eventType','actorId','targetId','locationId','payloadJson','worldTime','createdAt'],
  TransitStops: ['id','worldId','tablegateId','name','stopType','lat','lng','featureId','metadataJson','createdAt','updatedAt','deletedAt'],
  TransitRoutes: ['id','worldId','tablegateId','name','mode','stopIdsJson','scheduleJson','geometryJson','metadataJson','createdAt','updatedAt','deletedAt'],
  TransitVehicles: ['id','worldId','routeId','name','vehicleType','status','currentStopId','nextStopId','progress','lat','lng','capacity','occupancy','metadataJson','lastUpdatedAt','createdAt','updatedAt','deletedAt'],
  TransitEvents: ['id','worldId','routeId','vehicleId','eventType','payloadJson','worldTime','createdAt'],
  Notifications: ['id','userId','type','actorId','scopeType','scopeId','messageId','payloadJson','readAt','createdAt'],
  Events: ['id','audienceType','audienceId','eventType','entityType','entityId','payloadJson','createdAt','expiresAt'],
  AuditLog: ['id','tablegateId','actorId','action','targetType','targetId','detailsJson','createdAt']
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

function setupTablegate() {
  var props = PropertiesService.getScriptProperties();
  var dbId = props.getProperty(TABLEGATE.DB_PROPERTY);
  var ss;
  if (dbId) {
    ss = SpreadsheetApp.openById(dbId);
  } else {
    ss = SpreadsheetApp.create('Tablegate Database');
    props.setProperty(TABLEGATE.DB_PROPERTY, ss.getId());
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

  var uploadFolderId = props.getProperty(TABLEGATE.UPLOAD_FOLDER_PROPERTY);
  if (!uploadFolderId) {
    var folder = DriveApp.createFolder('Tablegate Private Uploads');
    props.setProperty(TABLEGATE.UPLOAD_FOLDER_PROPERTY, folder.getId());
    uploadFolderId = folder.getId();
  }

  if (!props.getProperty(TABLEGATE.PEPPER_PROPERTY)) {
    props.setProperty(TABLEGATE.PEPPER_PROPERTY, randomToken_(4));
  }
  if (!props.getProperty(TABLEGATE.REGISTRATION_MODE_PROPERTY)) {
    props.setProperty(TABLEGATE.REGISTRATION_MODE_PROPERTY, 'INVITE_OR_FIRST_USER');
  }
  if (!props.getProperty(TABLEGATE.SESSION_DAYS_PROPERTY)) {
    props.setProperty(TABLEGATE.SESSION_DAYS_PROPERTY, String(TABLEGATE.DEFAULT_SESSION_DAYS));
  }
  if (!props.getProperty(TABLEGATE.MAX_UPLOAD_PROPERTY)) {
    props.setProperty(TABLEGATE.MAX_UPLOAD_PROPERTY, String(TABLEGATE.DEFAULT_MAX_UPLOAD_BYTES));
  }
  if (!props.getProperty(TABLEGATE.RTC_ICE_PROPERTY)) {
    props.setProperty(TABLEGATE.RTC_ICE_PROPERTY, JSON.stringify([
      {urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302']}
    ]));
  }
  if (!props.getProperty(TABLEGATE.AI_BACKEND_URL_PROPERTY)) {
    props.setProperty(TABLEGATE.AI_BACKEND_URL_PROPERTY, TABLEGATE.DEFAULT_AI_BACKEND_URL);
  }
  if (!props.getProperty(TABLEGATE.AI_TIMEOUT_MS_PROPERTY)) {
    props.setProperty(TABLEGATE.AI_TIMEOUT_MS_PROPERTY, String(TABLEGATE.DEFAULT_AI_TIMEOUT_MS));
  }
  if (!props.getProperty(TABLEGATE.APP_NAME_PROPERTY)) props.setProperty(TABLEGATE.APP_NAME_PROPERTY, 'Tablegate');
  if (!props.getProperty(TABLEGATE.EMAIL_VERIFICATION_REQUIRED_PROPERTY)) props.setProperty(TABLEGATE.EMAIL_VERIFICATION_REQUIRED_PROPERTY, 'true');
  if (!props.getProperty(TABLEGATE.EMAIL_CODE_MINUTES_PROPERTY)) props.setProperty(TABLEGATE.EMAIL_CODE_MINUTES_PROPERTY, '30');
  if (!props.getProperty(TABLEGATE.RESET_CODE_MINUTES_PROPERTY)) props.setProperty(TABLEGATE.RESET_CODE_MINUTES_PROPERTY, '15');
  if (!props.getProperty(TABLEGATE.MAX_INLINE_AI_FILE_BYTES_PROPERTY)) props.setProperty(TABLEGATE.MAX_INLINE_AI_FILE_BYTES_PROPERTY, String(TABLEGATE.DEFAULT_MAX_INLINE_AI_FILE_BYTES));
  if (!props.getProperty(TABLEGATE.INTEGRATIONS_PROPERTY)) props.setProperty(TABLEGATE.INTEGRATIONS_PROPERTY, '{}');
  props.setProperty('TABLEGATE_SCHEMA_VERSION', TABLEGATE.SCHEMA_VERSION);
  resetRuntime_();
  var seededSystems = seedBuiltInSystems_();

  var result = {
    ok: true,
    apiVersion: TABLEGATE.API_VERSION,
    schemaVersion: TABLEGATE.SCHEMA_VERSION,
    spreadsheetId: ss.getId(),
    spreadsheetUrl: ss.getUrl(),
    uploadFolderId: uploadFolderId,
    registrationMode: props.getProperty(TABLEGATE.REGISTRATION_MODE_PROPERTY),
    aiBackendUrl: props.getProperty(TABLEGATE.AI_BACKEND_URL_PROPERTY),
    aiLibraryId: TABLEGATE.AI_LIBRARY_ID,
    aiLibraryVersion: TABLEGATE.AI_LIBRARY_VERSION,
    builtInSystemsSeeded: seededSystems,
    capabilities: TABLEGATE_CAPABILITIES_,
    emailVerificationRequired: emailVerificationRequired_(),
    mailQuotaRemaining: MailApp.getRemainingDailyQuota(),
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
      if (!lock.tryLock(25000)) throw new ApiError_('BUSY', 'The tablegate is busy. Please retry.');
      try {
        data = route.fn(ctx);
      } finally {
        lock.releaseLock();
      }
    } else {
      data = route.fn(ctx);
    }
    return jsonOutput_({ok: true, data: data, tablegateTime: nowIso_(), apiVersion: TABLEGATE.API_VERSION});
  } catch (err) {
    console.error(err && err.stack ? err.stack : err);
    var error = err instanceof ApiError_ ? err : new ApiError_('INTERNAL_ERROR', 'Internal tablegate error.', String(err && err.message ? err.message : err));
    return jsonOutput_({
      ok: false,
      error: {code: error.code, message: error.message, details: error.details},
      tablegateTime: nowIso_(),
      apiVersion: TABLEGATE.API_VERSION
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
  if (!props.getProperty(TABLEGATE.DB_PROPERTY)) {
    throw new ApiError_('NOT_CONFIGURED', 'Run setupTablegate() once from the Apps Script editor before deploying.');
  }
}

/* =============================
 * DATA ACCESS
 * ============================= */

function db_() {
  if (!RUNTIME_.spreadsheet) {
    var id = PropertiesService.getScriptProperties().getProperty(TABLEGATE.DB_PROPERTY);
    RUNTIME_.spreadsheet = SpreadsheetApp.openById(id);
  }
  return RUNTIME_.spreadsheet;
}

function sheet_(name) {
  if (!TABLES[name]) throw new ApiError_('BAD_TABLE', 'Unknown table: ' + name);
  if (!RUNTIME_.sheets[name]) {
    var sh = db_().getSheetByName(name);
    if (!sh) throw new ApiError_('MISSING_TABLE', 'Missing database sheet: ' + name + '. Run setupTablegate().');
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


function enumValue_(value, allowed, fallback, fieldName) {
  var normalized = String(value === undefined || value === null ? (fallback || '') : value).trim().toUpperCase();
  if (allowed.indexOf(normalized) === -1) throw new ApiError_('VALIDATION_ERROR', (fieldName || 'Value') + ' is not supported: ' + normalized);
  return normalized;
}

function jsonValue_(value, fallback, fieldName) {
  if (value === undefined || value === null || value === '') return clone_(fallback);
  if (typeof value === 'string') {
    try { return JSON.parse(value); }
    catch (err) { throw new ApiError_('INVALID_JSON', (fieldName || 'JSON value') + ' is not valid JSON.', String(err && err.message ? err.message : err)); }
  }
  if (typeof value !== 'object') throw new ApiError_('INVALID_JSON', (fieldName || 'JSON value') + ' must be an object, array, or JSON string.');
  return clone_(value);
}

function jsonCell_(value, fallback, fieldName) {
  var parsed = jsonValue_(value, fallback, fieldName);
  var encoded = JSON.stringify(parsed === undefined ? fallback : parsed);
  if (encoded.length > TABLEGATE.MAX_JSON_CELL_CHARS) {
    throw new ApiError_('JSON_TOO_LARGE', (fieldName || 'JSON value') + ' exceeds the per-record limit. Store large references as a JSON attachment and link it as a system document.', {maxChars:TABLEGATE.MAX_JSON_CELL_CHARS,actualChars:encoded.length});
  }
  return encoded;
}

function slug_(value) {
  var slug = String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
  return slug || ('system-' + randomCode_(8).toLowerCase());
}

function canManageTablegate_(tablegateId, userId) {
  return hasPermission_(tablegateId, userId, PERMISSIONS.MANAGE_TABLEGATE) || hasPermission_(tablegateId, userId, PERMISSIONS.MANAGE_SYSTEMS);
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
  var pepper = PropertiesService.getScriptProperties().getProperty(TABLEGATE.PEPPER_PROPERTY) || '';
  var h = sha256Hex_(pepper + '|' + salt + '|' + password);
  for (var i = 0; i < TABLEGATE.PASSWORD_ROUNDS; i++) h = sha256Hex_(h + '|' + salt + '|' + pepper + '|' + i);
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
function roleIds_(member) { return filter_('MemberRoles', function(mr) { return mr.tablegateId === member.tablegateId && mr.userId === member.userId; }).map(function(mr) { return mr.roleId; }); }

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
  var days = int_(PropertiesService.getScriptProperties().getProperty(TABLEGATE.SESSION_DAYS_PROPERTY), TABLEGATE.DEFAULT_SESSION_DAYS, 1, 365);
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
  out.emailVerified = emailVerified_(user);
  out.emailVerifiedAt = user.emailVerifiedAt || '';
  return out;
}

function routeHealth_() {
  var props = PropertiesService.getScriptProperties();
  return {
    service:'Tablegate Backend V3', status:'ok', apiVersion:TABLEGATE.API_VERSION,
    schemaVersion:props.getProperty('TABLEGATE_SCHEMA_VERSION') || TABLEGATE.SCHEMA_VERSION,
    registrationMode:props.getProperty(TABLEGATE.REGISTRATION_MODE_PROPERTY) || 'INVITE_OR_FIRST_USER',
    emailVerificationRequired:emailVerificationRequired_(), capabilities:TABLEGATE_CAPABILITIES_,
    features:['invite-only tablegates','roles and permissions','multi-system TTRPG data','chat and DMs','attachments and organized assets','WebRTC signaling','screen sharing state','personas and characters','secure dice and statistics','AI conversations','memory and learning feedback','knowledge and citations','web and image search proxy','image generation proxy','file parsing','projects and compilation','interactive GeoJSON maps','painterly map generation proxy','NPC life simulation','transit tracking','email verification','password recovery','configured integrations'],
    ai:{configured:!!props.getProperty(TABLEGATE.AI_BACKEND_URL_PROPERTY),libraryId:TABLEGATE.AI_LIBRARY_ID,libraryVersion:TABLEGATE.AI_LIBRARY_VERSION},
    platformNotes:{realtimeMedia:'Media is peer-to-peer WebRTC in the browser; Apps Script provides authorization and signaling only.',externalProviders:'Generation, model inference, web/image search, and difficult binary parsing require configured providers.'}
  };
}

function routeRegister_(ctx) {
  var p = ctx.params;
  var email = validateEmail_(p.email);
  var username = validateUsername_(p.username);
  var password = validatePassword_(p.password);
  var inviteCode = String(p.inviteCode || '').trim();
  var mode = PropertiesService.getScriptProperties().getProperty(TABLEGATE.REGISTRATION_MODE_PROPERTY) || 'INVITE_OR_FIRST_USER';
  var activeUsers = filter_('Users', function(u) { return !bool_(u.disabled); });
  var invite = inviteCode ? validateInviteCode_(inviteCode, null, false) : null;

  if (mode === 'CLOSED') throw new ApiError_('REGISTRATION_CLOSED', 'Registration is closed.');
  if (mode === 'INVITE_ONLY' && !invite) throw new ApiError_('INVITE_REQUIRED', 'A valid tablegate invite is required.');
  if (mode === 'INVITE_OR_FIRST_USER' && activeUsers.length > 0 && !invite) throw new ApiError_('INVITE_REQUIRED', 'A valid tablegate invite is required.');
  if (findOne_('Users', function(u) { return lower_(u.email) === email; })) throw new ApiError_('EMAIL_IN_USE', 'That email is already registered.');

  var verificationRequired = emailVerificationRequired_();
  if (verificationRequired) ensureEmailQuota_();
  var discriminator = generateDiscriminator_(username);
  var salt = randomCode_(24);
  var now = nowIso_();
  var user = insert_('Users', {
    id:id_('usr'), email:email, username:username, discriminator:discriminator,
    passwordSalt:salt, passwordHash:hashPassword_(password, salt), avatarAttachmentId:'', bannerAttachmentId:'',
    bio:'', status:verificationRequired ? 'OFFLINE' : 'ONLINE', customStatus:'', createdAt:now, updatedAt:now, lastSeenAt:now,
    disabled:false, discoverable:true, emailVerified:!verificationRequired, emailVerifiedAt:verificationRequired ? '' : now,
    failedLoginCount:0, lockedUntil:''
  });

  if (verificationRequired) {
    var challenge = null;
    try {
      var minutes = int_(PropertiesService.getScriptProperties().getProperty(TABLEGATE.EMAIL_CODE_MINUTES_PROPERTY), 30, 5, 1440);
      challenge = createAuthChallenge_(user, 'VERIFY_EMAIL', minutes, {registration:true});
      sendAuthChallengeEmail_(user, 'VERIFY_EMAIL', challenge);
    } catch (emailErr) {
      if (challenge && challenge.row) deleteRow_('AuthChallenges', challenge.row._row);
      deleteRow_('Users', user._row);
      throw emailErr;
    }
    if (invite) joinInviteForUser_(invite, user.id);
    return {user:privateUser_(user), verificationRequired:true, codeExpiresAt:challenge.row.expiresAt, joinedTablegateId:invite ? invite.tablegateId : ''};
  }

  if (invite) joinInviteForUser_(invite, user.id);
  upsertPresence_(user.id, 'ONLINE', '');
  var session = createSession_(user.id, p.userAgent);
  return {user:privateUser_(user), token:session.token, session:session.session, verificationRequired:false, joinedTablegateId:invite ? invite.tablegateId : ''};
}

function generateDiscriminator_(username) {
  for (var tries = 0; tries < 100; tries++) {
    var d = ('0000' + secureRandomInt_(10000)).slice(-4);
    var exists = findOne_('Users', function(u) { return lower_(u.username) === lower_(username) && String(u.discriminator) === d; });
    if (!exists) return d;
  }
  return randomCode_(6).toUpperCase();
}

function routeLogin_(ctx) {
  var email = validateEmail_(ctx.params.email);
  var password = String(ctx.params.password || '');
  var user = findOne_('Users', function(u) { return lower_(u.email) === email; });
  if (user && user.lockedUntil && isFuture_(user.lockedUntil)) throw new ApiError_('ACCOUNT_LOCKED', 'Too many failed sign-in attempts. Try again after ' + user.lockedUntil + '.');
  var valid = user && !bool_(user.disabled) && constantTimeEqual_(hashPassword_(password, user.passwordSalt), user.passwordHash);
  if (!valid) {
    if (user) {
      var failed = int_(user.failedLoginCount, 0, 0, 1000) + 1;
      var patch = {failedLoginCount:failed, updatedAt:nowIso_()};
      if (failed >= 10) patch.lockedUntil = addMsIso_(15 * 60000);
      updateRow_('Users', user._row, patch);
    }
    throw new ApiError_('INVALID_LOGIN', 'Email or password is incorrect.');
  }
  if (emailVerificationRequired_() && !emailVerified_(user)) throw new ApiError_('EMAIL_NOT_VERIFIED', 'Verify your email before signing in.', {email:user.email});
  var now = nowIso_();
  updateRow_('Users', user._row, {status:'ONLINE', lastSeenAt:now, updatedAt:now, failedLoginCount:0, lockedUntil:''});
  upsertPresence_(user.id, 'ONLINE', user.customStatus || '');
  var session = createSession_(user.id, ctx.params.userAgent);
  return {user:privateUser_(byId_('Users', user.id, true)), token:session.token, session:session.session};
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
  return {user: privateUser_(ctx.user), tablegates: listTablegatesForUser_(ctx.user.id)};
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
 * TABLEGATE, MEMBERSHIP, PERMISSIONS
 * ============================= */

function requireTablegate_(tablegateId, includeDeleted) {
  var tablegate = byId_('Tablegates', String(tablegateId || ''), !!includeDeleted);
  if (!tablegate || (!includeDeleted && tablegate.deletedAt)) throw new ApiError_('TABLEGATE_NOT_FOUND', 'Tablegate not found.');
  return tablegate;
}

function requireMember_(tablegateId, userId) {
  var tablegate = requireTablegate_(tablegateId);
  var ban = findOne_('Bans', function(b) { return b.tablegateId === tablegate.id && b.userId === userId && !b.revokedAt; });
  if (ban) throw new ApiError_('BANNED', 'You are banned from this tablegate.');
  var member = findOne_('Members', function(m) { return m.tablegateId === tablegate.id && m.userId === userId && !m.leftAt; });
  if (!member) throw new ApiError_('NOT_A_MEMBER', 'You are not a member of this tablegate.');
  if (member.timedOutUntil && isFuture_(member.timedOutUntil)) throw new ApiError_('MEMBER_TIMED_OUT', 'Your tablegate access is temporarily restricted until ' + member.timedOutUntil + '.');
  return {tablegate: tablegate, member: member};
}

function permissionsFor_(tablegateId, userId) {
  var sm = requireMember_(tablegateId, userId);
  if (sm.tablegate.ownerId === userId) return PERMISSIONS.ALL;
  var roleIds = roleIds_(sm.member);
  var roles = filter_('Roles', function(r) { return r.tablegateId === tablegateId && roleIds.indexOf(r.id) !== -1; });
  var permissions = 0;
  roles.forEach(function(r) { permissions |= int_(r.permissions, 0); });
  return permissions;
}

function hasPermission_(tablegateId, userId, permission) {
  var p = permissionsFor_(tablegateId, userId);
  return (p & PERMISSIONS.ADMIN) === PERMISSIONS.ADMIN || (p & permission) === permission;
}

function requirePermission_(tablegateId, userId, permission, message) {
  if (!hasPermission_(tablegateId, userId, permission)) throw new ApiError_('FORBIDDEN', message || 'You do not have permission to do that.');
}

function listTablegatesForUser_(userId) {
  var memberships = filter_('Members', function(m) { return m.userId === userId && !m.leftAt; });
  var memberTablegateIds = {};
  memberships.forEach(function(m) { memberTablegateIds[m.tablegateId] = m; });
  return filter_('Tablegates', function(s) { return !s.deletedAt && !!memberTablegateIds[s.id]; }).map(function(s) {
    var member = memberTablegateIds[s.id];
    return {
      id: s.id, name: s.name, description: s.description || '', iconAttachmentId: s.iconAttachmentId || '',
      ownerId: s.ownerId, isPublic: bool_(s.isPublic), inviteOnly: bool_(s.inviteOnly),
      nickname: member.nickname || '', permissions: permissionsFor_(s.id, userId),
      primarySystemId: s.primarySystemId || 'sys_tablegate_generic', systemMode: s.systemMode || 'SYSTEM_AGNOSTIC',
      createdAt: s.createdAt, updatedAt: s.updatedAt
    };
  });
}

function routeListTablegates_(ctx) { return listTablegatesForUser_(ctx.user.id); }

function routeCreateTablegate_(ctx) {
  var p = ctx.params;
  var now = nowIso_();
  var tablegate = insert_('Tablegates', {
    id: id_('tbl'), name: text_(p.name || 'New Tablegate', 80), description: nullableText_(p.description, 1000),
    iconAttachmentId: '', ownerId: ctx.user.id, isPublic: bool_(p.isPublic), inviteOnly: p.inviteOnly === undefined ? true : bool_(p.inviteOnly),
    createdAt: now, updatedAt: now, deletedAt: '', primarySystemId: '', systemMode: enumValue_(p.systemMode || 'SYSTEM_AGNOSTIC', TABLEGATE.SYSTEM_MODES, 'SYSTEM_AGNOSTIC', 'systemMode'),
    systemConfigJson: jsonCell_(p.systemConfig, {}, 'systemConfig'), houseRulesJson: jsonCell_(p.houseRules, {}, 'houseRules'), safetyToolsJson: jsonCell_(p.safetyTools, {}, 'safetyTools')
  });
  insert_('Members', {id: id_('mem'), tablegateId: tablegate.id, userId: ctx.user.id, nickname: '', joinedAt: now, updatedAt: now, leftAt: '', timedOutUntil: ''});

  var creatorRole = insert_('Roles', {id: id_('rol'), tablegateId: tablegate.id, name: 'Creator', color: '#D6A84B', permissions: PERMISSIONS.ALL, position: 100, isManaged: true, managedKey: 'CREATOR', createdAt: now, updatedAt: now});
  insert_('Roles', {id: id_('rol'), tablegateId: tablegate.id, name: 'Moderator', color: '#5D8AA8', permissions: MODERATOR_PERMISSIONS, position: 50, isManaged: true, managedKey: 'MODERATOR', createdAt: now, updatedAt: now});
  var playerRole = insert_('Roles', {id: id_('rol'), tablegateId: tablegate.id, name: 'Player', color: '#7BA05B', permissions: PLAYER_PERMISSIONS, position: 10, isManaged: true, managedKey: 'PLAYER', createdAt: now, updatedAt: now});
  insert_('MemberRoles', {id: id_('mrl'), tablegateId: tablegate.id, userId: ctx.user.id, roleId: creatorRole.id, createdAt: now});

  var campaignCat = insert_('Categories', {id: id_('cat'), tablegateId: tablegate.id, name: 'Campaign', position: 10, createdBy: ctx.user.id, createdAt: now, updatedAt: now, deletedAt: ''});
  var tableCat = insert_('Categories', {id: id_('cat'), tablegateId: tablegate.id, name: 'Table Talk', position: 20, createdBy: ctx.user.id, createdAt: now, updatedAt: now, deletedAt: ''});
  var voiceCat = insert_('Categories', {id: id_('cat'), tablegateId: tablegate.id, name: 'Voice & Video', position: 30, createdBy: ctx.user.id, createdAt: now, updatedAt: now, deletedAt: ''});
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
      id: id_('chn'), tablegateId: tablegate.id, categoryId: c.categoryId, name: c.name, topic: c.topic, type: c.type,
      position: c.position, userLimit: 0, slowmodeSeconds: 0, isPrivate: false, allowedRoleIds: JSON.stringify([playerRole.id]),
      isSystem: c.isSystem, createdBy: ctx.user.id, createdAt: now, updatedAt: now, deletedAt: ''
    });
  });
  var requestedSystemIds = unique_(array_(p.systemIds));
  if (p.systemId) requestedSystemIds.unshift(String(p.systemId));
  if (!requestedSystemIds.length) requestedSystemIds = ['sys_tablegate_generic'];
  var attachedSystems = [];
  requestedSystemIds.forEach(function(systemId, index) {
    attachedSystems.push(attachSystemRecord_(tablegate.id, systemId, ctx.user.id, {isPrimary:index === 0, label:'', config:{}, houseRules:{}}));
  });
  tablegate = requireTablegate_(tablegate.id);
  var invite = createInviteRecord_(tablegate.id, ctx.user.id, int_(p.maxUses, 0, 0, 1000), int_(p.expiresInHours, 168, 1, 8760));
  audit_(tablegate.id, ctx.user.id, 'TABLEGATE_CREATED', 'TABLEGATE', tablegate.id, {name: tablegate.name, systemIds:requestedSystemIds});
  emitTablegateEvent_(tablegate.id, 'TABLEGATE_CREATED', 'TABLEGATE', tablegate.id, {tablegate: stripInternal_(tablegate)});
  return {tablegate: stripInternal_(tablegate), systems:attachedSystems, channels: stripInternal_(channels), invite: stripInternal_(invite)};
}

function routeGetTablegate_(ctx) {
  var tablegateId = String(ctx.params.tablegateId || '');
  var sm = requireMember_(tablegateId, ctx.user.id);
  var categories = filter_('Categories', function(c) { return c.tablegateId === tablegateId && !c.deletedAt; }).sort(function(a,b){return num_(a.position,0)-num_(b.position,0);});
  var channels = filter_('Channels', function(c) { return c.tablegateId === tablegateId && !c.deletedAt && canViewChannel_(c, ctx.user.id); }).sort(function(a,b){return num_(a.position,0)-num_(b.position,0);}).map(publicChannel_);
  return {
    tablegate: stripInternal_(sm.tablegate),
    member: stripInternal_(sm.member),
    permissions: permissionsFor_(tablegateId, ctx.user.id),
    categories: stripInternal_(categories),
    channels: channels,
    roles: routeListRoles_(ctx),
    members: routeListMembers_(ctx),
    systems: routeListTablegateSystems_(ctx),
    systemConfig: parseJsonCell_(sm.tablegate.systemConfigJson, {}),
    houseRules: parseJsonCell_(sm.tablegate.houseRulesJson, {}),
    safetyTools: parseJsonCell_(sm.tablegate.safetyToolsJson, {})
  };
}

function routeUpdateTablegate_(ctx) {
  var tablegateId = String(ctx.params.tablegateId || '');
  requirePermission_(tablegateId, ctx.user.id, PERMISSIONS.MANAGE_TABLEGATE);
  var tablegate = requireTablegate_(tablegateId);
  var patch = {updatedAt: nowIso_()};
  if (ctx.params.name !== undefined) patch.name = text_(ctx.params.name, 80);
  if (ctx.params.description !== undefined) patch.description = nullableText_(ctx.params.description, 1000);
  if (ctx.params.isPublic !== undefined) patch.isPublic = bool_(ctx.params.isPublic);
  if (ctx.params.inviteOnly !== undefined) patch.inviteOnly = bool_(ctx.params.inviteOnly);
  if (ctx.params.systemMode !== undefined) patch.systemMode = enumValue_(ctx.params.systemMode, TABLEGATE.SYSTEM_MODES, 'SYSTEM_AGNOSTIC', 'systemMode');
  if (ctx.params.systemConfig !== undefined) patch.systemConfigJson = jsonCell_(ctx.params.systemConfig, {}, 'systemConfig');
  if (ctx.params.houseRules !== undefined) patch.houseRulesJson = jsonCell_(ctx.params.houseRules, {}, 'houseRules');
  if (ctx.params.safetyTools !== undefined) patch.safetyToolsJson = jsonCell_(ctx.params.safetyTools, {}, 'safetyTools');
  if (ctx.params.iconAttachmentId !== undefined) {
    if (ctx.params.iconAttachmentId) requireAttachmentAccess_(ctx.params.iconAttachmentId, ctx.user.id, tablegateId, '');
    patch.iconAttachmentId = String(ctx.params.iconAttachmentId || '');
  }
  updateRow_('Tablegates', tablegate._row, patch);
  var updated = requireTablegate_(tablegateId);
  audit_(tablegateId, ctx.user.id, 'TABLEGATE_UPDATED', 'TABLEGATE', tablegateId, patch);
  emitTablegateEvent_(tablegateId, 'TABLEGATE_UPDATED', 'TABLEGATE', tablegateId, {tablegate: stripInternal_(updated)});
  return stripInternal_(updated);
}

function routeDeleteTablegate_(ctx) {
  var tablegate = requireTablegate_(ctx.params.tablegateId);
  if (tablegate.ownerId !== ctx.user.id) throw new ApiError_('OWNER_REQUIRED', 'Only the tablegate creator can delete the tablegate.');
  var now = nowIso_();
  updateRow_('Tablegates', tablegate._row, {deletedAt: now, updatedAt: now});
  audit_(tablegate.id, ctx.user.id, 'TABLEGATE_DELETED', 'TABLEGATE', tablegate.id, {});
  emitTablegateEvent_(tablegate.id, 'TABLEGATE_DELETED', 'TABLEGATE', tablegate.id, {tablegateId: tablegate.id});
  return {deleted: true, tablegateId: tablegate.id};
}

function routeLeaveTablegate_(ctx) {
  var tablegate = requireTablegate_(ctx.params.tablegateId);
  if (tablegate.ownerId === ctx.user.id) throw new ApiError_('OWNER_CANNOT_LEAVE', 'Transfer ownership or delete the tablegate before leaving.');
  var member = requireMember_(tablegate.id, ctx.user.id).member;
  var now = nowIso_();
  updateRow_('Members', member._row, {leftAt: now, updatedAt: now});
  filter_('VoiceStates', function(v) { return v.tablegateId === tablegate.id && v.userId === ctx.user.id; }).sort(function(a,b){return b._row-a._row;}).forEach(function(v){ deleteRow_('VoiceStates', v._row); });
  emitTablegateEvent_(tablegate.id, 'MEMBER_LEFT', 'USER', ctx.user.id, {userId: ctx.user.id});
  return {left: true};
}

function routeTransferOwnership_(ctx) {
  var tablegate = requireTablegate_(ctx.params.tablegateId);
  if (tablegate.ownerId !== ctx.user.id) throw new ApiError_('OWNER_REQUIRED', 'Only the tablegate creator can transfer ownership.');
  var targetId = String(ctx.params.userId || '');
  requireMember_(tablegate.id, targetId);
  if (targetId === ctx.user.id) return {transferred: false, ownerId: ctx.user.id};
  var creatorRole = findOne_('Roles', function(r) { return r.tablegateId === tablegate.id && r.managedKey === 'CREATOR'; });
  if (creatorRole) {
    var oldAssign = findOne_('MemberRoles', function(mr){return mr.tablegateId===tablegate.id&&mr.userId===ctx.user.id&&mr.roleId===creatorRole.id;});
    if (oldAssign) deleteRow_('MemberRoles', oldAssign._row);
    if (!findOne_('MemberRoles', function(mr){return mr.tablegateId===tablegate.id&&mr.userId===targetId&&mr.roleId===creatorRole.id;})) {
      insert_('MemberRoles', {id:id_('mrl'),tablegateId:tablegate.id,userId:targetId,roleId:creatorRole.id,createdAt:nowIso_()});
    }
  }
  updateRow_('Tablegates', tablegate._row, {ownerId: targetId, updatedAt: nowIso_()});
  audit_(tablegate.id, ctx.user.id, 'OWNERSHIP_TRANSFERRED', 'USER', targetId, {previousOwnerId: ctx.user.id});
  emitTablegateEvent_(tablegate.id, 'OWNERSHIP_TRANSFERRED', 'USER', targetId, {ownerId: targetId, previousOwnerId: ctx.user.id});
  return {transferred: true, ownerId: targetId};
}

function routeListMembers_(ctx) {
  var tablegateId = String(ctx.params.tablegateId || '');
  requireMember_(tablegateId, ctx.user.id);
  var users = {};
  rows_('Users').forEach(function(u){users[u.id]=u;});
  var roles = {};
  filter_('Roles', function(r){return r.tablegateId===tablegateId;}).forEach(function(r){roles[r.id]=r;});
  var assignments = filter_('MemberRoles', function(mr){return mr.tablegateId===tablegateId;});
  var byUser = {};
  assignments.forEach(function(mr){if(!byUser[mr.userId])byUser[mr.userId]=[];if(roles[mr.roleId])byUser[mr.userId].push(stripInternal_(roles[mr.roleId]));});
  return filter_('Members', function(m){return m.tablegateId===tablegateId&&!m.leftAt;}).map(function(m){
    return {id:m.id,tablegateId:m.tablegateId,userId:m.userId,nickname:m.nickname||'',joinedAt:m.joinedAt,timedOutUntil:m.timedOutUntil||'',user:publicUser_(users[m.userId]),roles:byUser[m.userId]||[]};
  });
}

function routeUpdateMember_(ctx) {
  var tablegateId = String(ctx.params.tablegateId || '');
  var targetId = String(ctx.params.userId || ctx.user.id);
  var target = requireMember_(tablegateId, targetId).member;
  if (targetId !== ctx.user.id) requirePermission_(tablegateId, ctx.user.id, PERMISSIONS.MANAGE_NICKNAMES);
  var patch = {updatedAt: nowIso_()};
  if (ctx.params.nickname !== undefined) patch.nickname = nullableText_(ctx.params.nickname, 64);
  if (ctx.params.timedOutUntil !== undefined) {
    requirePermission_(tablegateId, ctx.user.id, PERMISSIONS.MANAGE_MESSAGES);
    patch.timedOutUntil = ctx.params.timedOutUntil ? new Date(ctx.params.timedOutUntil).toISOString() : '';
  }
  updateRow_('Members', target._row, patch);
  audit_(tablegateId, ctx.user.id, 'MEMBER_UPDATED', 'USER', targetId, patch);
  emitTablegateEvent_(tablegateId, 'MEMBER_UPDATED', 'USER', targetId, {userId:targetId,patch:patch});
  return stripInternal_(requireMember_(tablegateId, targetId).member);
}

function routeKickMember_(ctx) {
  var tablegate = requireTablegate_(ctx.params.tablegateId);
  requirePermission_(tablegate.id, ctx.user.id, PERMISSIONS.KICK_MEMBERS);
  var targetId = String(ctx.params.userId || '');
  if (targetId === tablegate.ownerId) throw new ApiError_('CANNOT_KICK_OWNER', 'The tablegate creator cannot be kicked.');
  var target = requireMember_(tablegate.id, targetId).member;
  var now = nowIso_();
  updateRow_('Members', target._row, {leftAt: now, updatedAt: now});
  filter_('VoiceStates', function(v){return v.tablegateId===tablegate.id&&v.userId===targetId;}).sort(function(a,b){return b._row-a._row;}).forEach(function(v){deleteRow_('VoiceStates',v._row);});
  audit_(tablegate.id,ctx.user.id,'MEMBER_KICKED','USER',targetId,{reason:nullableText_(ctx.params.reason,500)});
  emitTablegateEvent_(tablegate.id,'MEMBER_KICKED','USER',targetId,{userId:targetId,reason:nullableText_(ctx.params.reason,500)});
  emitUserEvent_(targetId,'KICKED_FROM_TABLEGATE','TABLEGATE',tablegate.id,{tablegateId:tablegate.id,tablegateName:tablegate.name});
  return {kicked:true,userId:targetId};
}

function routeBanMember_(ctx) {
  var tablegate = requireTablegate_(ctx.params.tablegateId);
  requirePermission_(tablegate.id, ctx.user.id, PERMISSIONS.BAN_MEMBERS);
  var targetId = String(ctx.params.userId || '');
  if (targetId === tablegate.ownerId) throw new ApiError_('CANNOT_BAN_OWNER', 'The tablegate creator cannot be banned.');
  var existing = findOne_('Bans', function(b){return b.tablegateId===tablegate.id&&b.userId===targetId&&!b.revokedAt;});
  if (existing) return stripInternal_(existing);
  var now = nowIso_();
  var member = findOne_('Members', function(m){return m.tablegateId===tablegate.id&&m.userId===targetId&&!m.leftAt;});
  if (member) updateRow_('Members', member._row, {leftAt:now,updatedAt:now});
  var ban = insert_('Bans',{id:id_('ban'),tablegateId:tablegate.id,userId:targetId,actorId:ctx.user.id,reason:nullableText_(ctx.params.reason,500),createdAt:now,revokedAt:'',revokedBy:''});
  audit_(tablegate.id,ctx.user.id,'MEMBER_BANNED','USER',targetId,{reason:ban.reason});
  emitTablegateEvent_(tablegate.id,'MEMBER_BANNED','USER',targetId,{userId:targetId,reason:ban.reason});
  emitUserEvent_(targetId,'BANNED_FROM_TABLEGATE','TABLEGATE',tablegate.id,{tablegateId:tablegate.id,tablegateName:tablegate.name});
  return stripInternal_(ban);
}

function routeUnbanMember_(ctx) {
  var tablegateId = String(ctx.params.tablegateId || '');
  requirePermission_(tablegateId, ctx.user.id, PERMISSIONS.BAN_MEMBERS);
  var targetId = String(ctx.params.userId || '');
  var ban = findOne_('Bans', function(b){return b.tablegateId===tablegateId&&b.userId===targetId&&!b.revokedAt;});
  if (!ban) throw new ApiError_('BAN_NOT_FOUND','Active ban not found.');
  updateRow_('Bans',ban._row,{revokedAt:nowIso_(),revokedBy:ctx.user.id});
  audit_(tablegateId,ctx.user.id,'MEMBER_UNBANNED','USER',targetId,{});
  emitTablegateEvent_(tablegateId,'MEMBER_UNBANNED','USER',targetId,{userId:targetId});
  return {unbanned:true,userId:targetId};
}

function routeListBans_(ctx) {
  var tablegateId=String(ctx.params.tablegateId||'');
  requirePermission_(tablegateId,ctx.user.id,PERMISSIONS.BAN_MEMBERS);
  var users={};rows_('Users').forEach(function(u){users[u.id]=u;});
  return filter_('Bans',function(b){return b.tablegateId===tablegateId&&!b.revokedAt;}).map(function(b){var o=stripInternal_(b);o.user=publicUser_(users[b.userId]);return o;});
}

/* =============================
 * ROLES AND INVITES
 * ============================= */

function routeListRoles_(ctx) {
  var tablegateId=String(ctx.params.tablegateId||'');
  requireMember_(tablegateId,ctx.user.id);
  return filter_('Roles',function(r){return r.tablegateId===tablegateId;}).sort(function(a,b){return num_(b.position,0)-num_(a.position,0);}).map(stripInternal_);
}

function validateRolePermissions_(tablegateId,actorId,permissions) {
  permissions=int_(permissions,0,0,PERMISSIONS.ALL);
  var tablegate=requireTablegate_(tablegateId);
  if(tablegate.ownerId===actorId)return permissions;
  var actorPerms=permissionsFor_(tablegateId,actorId);
  if((permissions & PERMISSIONS.ADMIN)===PERMISSIONS.ADMIN)throw new ApiError_('FORBIDDEN','Only the tablegate creator can grant Administrator.');
  if((permissions & ~actorPerms)!==0)throw new ApiError_('FORBIDDEN','You cannot grant permissions you do not have.');
  return permissions;
}

function routeCreateRole_(ctx){
  var tablegateId=String(ctx.params.tablegateId||'');
  requirePermission_(tablegateId,ctx.user.id,PERMISSIONS.MANAGE_ROLES);
  var role=insert_('Roles',{id:id_('rol'),tablegateId:tablegateId,name:text_(ctx.params.name,64),color:nullableText_(ctx.params.color,16)||'#808080',permissions:validateRolePermissions_(tablegateId,ctx.user.id,ctx.params.permissions),position:int_(ctx.params.position,20,-1000,1000),isManaged:false,managedKey:'',createdAt:nowIso_(),updatedAt:nowIso_()});
  audit_(tablegateId,ctx.user.id,'ROLE_CREATED','ROLE',role.id,{name:role.name,permissions:role.permissions});
  emitTablegateEvent_(tablegateId,'ROLE_CREATED','ROLE',role.id,{role:stripInternal_(role)});
  return stripInternal_(role);
}

function routeUpdateRole_(ctx){
  var role=byId_('Roles',ctx.params.roleId,true);if(!role)throw new ApiError_('ROLE_NOT_FOUND','Role not found.');
  requirePermission_(role.tablegateId,ctx.user.id,PERMISSIONS.MANAGE_ROLES);
  if(bool_(role.isManaged)&&role.managedKey==='CREATOR'&&requireTablegate_(role.tablegateId).ownerId!==ctx.user.id)throw new ApiError_('FORBIDDEN','Only the tablegate creator can change the Creator role.');
  var patch={updatedAt:nowIso_()};
  if(ctx.params.name!==undefined&&!bool_(role.isManaged))patch.name=text_(ctx.params.name,64);
  if(ctx.params.color!==undefined)patch.color=nullableText_(ctx.params.color,16)||'#808080';
  if(ctx.params.position!==undefined&&!bool_(role.isManaged))patch.position=int_(ctx.params.position,role.position,-1000,1000);
  if(ctx.params.permissions!==undefined)patch.permissions=validateRolePermissions_(role.tablegateId,ctx.user.id,ctx.params.permissions);
  updateRow_('Roles',role._row,patch);
  var updated=byId_('Roles',role.id,true);
  audit_(role.tablegateId,ctx.user.id,'ROLE_UPDATED','ROLE',role.id,patch);
  emitTablegateEvent_(role.tablegateId,'ROLE_UPDATED','ROLE',role.id,{role:stripInternal_(updated)});
  return stripInternal_(updated);
}

function routeDeleteRole_(ctx){
  var role=byId_('Roles',ctx.params.roleId,true);if(!role)throw new ApiError_('ROLE_NOT_FOUND','Role not found.');
  requirePermission_(role.tablegateId,ctx.user.id,PERMISSIONS.MANAGE_ROLES);
  if(bool_(role.isManaged))throw new ApiError_('MANAGED_ROLE','Managed roles cannot be deleted.');
  filter_('MemberRoles',function(mr){return mr.roleId===role.id;}).sort(function(a,b){return b._row-a._row;}).forEach(function(mr){deleteRow_('MemberRoles',mr._row);});
  deleteRow_('Roles',role._row);
  audit_(role.tablegateId,ctx.user.id,'ROLE_DELETED','ROLE',role.id,{name:role.name});
  emitTablegateEvent_(role.tablegateId,'ROLE_DELETED','ROLE',role.id,{roleId:role.id});
  return {deleted:true,roleId:role.id};
}

function routeAssignRole_(ctx){
  var tablegateId=String(ctx.params.tablegateId||''),userId=String(ctx.params.userId||''),roleId=String(ctx.params.roleId||'');
  requirePermission_(tablegateId,ctx.user.id,PERMISSIONS.MANAGE_ROLES);requireMember_(tablegateId,userId);
  var role=byId_('Roles',roleId,true);if(!role||role.tablegateId!==tablegateId)throw new ApiError_('ROLE_NOT_FOUND','Role not found.');
  if(role.managedKey==='CREATOR')throw new ApiError_('MANAGED_ROLE','Use transferOwnership for the Creator role.');
  validateRolePermissions_(tablegateId,ctx.user.id,role.permissions);
  var existing=findOne_('MemberRoles',function(mr){return mr.tablegateId===tablegateId&&mr.userId===userId&&mr.roleId===roleId;});
  if(!existing)insert_('MemberRoles',{id:id_('mrl'),tablegateId:tablegateId,userId:userId,roleId:roleId,createdAt:nowIso_()});
  audit_(tablegateId,ctx.user.id,'ROLE_ASSIGNED','USER',userId,{roleId:roleId});
  emitTablegateEvent_(tablegateId,'MEMBER_ROLES_UPDATED','USER',userId,{userId:userId});
  return {assigned:true};
}

function routeRemoveRole_(ctx){
  var tablegateId=String(ctx.params.tablegateId||''),userId=String(ctx.params.userId||''),roleId=String(ctx.params.roleId||'');
  requirePermission_(tablegateId,ctx.user.id,PERMISSIONS.MANAGE_ROLES);
  var role=byId_('Roles',roleId,true);if(!role||role.tablegateId!==tablegateId)throw new ApiError_('ROLE_NOT_FOUND','Role not found.');
  if(role.managedKey==='CREATOR')throw new ApiError_('MANAGED_ROLE','Use transferOwnership for the Creator role.');
  var existing=findOne_('MemberRoles',function(mr){return mr.tablegateId===tablegateId&&mr.userId===userId&&mr.roleId===roleId;});
  if(existing)deleteRow_('MemberRoles',existing._row);
  audit_(tablegateId,ctx.user.id,'ROLE_REMOVED','USER',userId,{roleId:roleId});
  emitTablegateEvent_(tablegateId,'MEMBER_ROLES_UPDATED','USER',userId,{userId:userId});
  return {removed:true};
}

function createInviteRecord_(tablegateId,createdBy,maxUses,expiresInHours){
  var code;
  do{code=randomCode_(12);}while(findOne_('Invites',function(i){return i.code===code;}));
  return insert_('Invites',{id:id_('inv'),tablegateId:tablegateId,code:code,createdBy:createdBy,maxUses:maxUses||0,uses:0,expiresAt:expiresInHours?addMsIso_(expiresInHours*3600000):'',revokedAt:'',createdAt:nowIso_()});
}

function validateInviteCode_(code,userId,consumeCheck){
  var invite=findOne_('Invites',function(i){return String(i.code)===String(code);});
  if(!invite||invite.revokedAt||isPast_(invite.expiresAt))throw new ApiError_('INVALID_INVITE','Invite is invalid or expired.');
  if(int_(invite.maxUses,0)>0&&int_(invite.uses,0)>=int_(invite.maxUses,0))throw new ApiError_('INVITE_EXHAUSTED','Invite has reached its maximum uses.');
  var tablegate=requireTablegate_(invite.tablegateId);
  if(userId){
    var ban=findOne_('Bans',function(b){return b.tablegateId===tablegate.id&&b.userId===userId&&!b.revokedAt;});
    if(ban)throw new ApiError_('BANNED','You are banned from this tablegate.');
  }
  return invite;
}

function joinInviteForUser_(invite,userId){
  var existing=findOne_('Members',function(m){return m.tablegateId===invite.tablegateId&&m.userId===userId;});
  var now=nowIso_();
  if(existing){
    if(existing.leftAt)updateRow_('Members',existing._row,{leftAt:'',joinedAt:now,updatedAt:now,timedOutUntil:''});
    else return {joined:false,alreadyMember:true,tablegateId:invite.tablegateId};
  }else{
    insert_('Members',{id:id_('mem'),tablegateId:invite.tablegateId,userId:userId,nickname:'',joinedAt:now,updatedAt:now,leftAt:'',timedOutUntil:''});
  }
  var playerRole=findOne_('Roles',function(r){return r.tablegateId===invite.tablegateId&&r.managedKey==='PLAYER';});
  if(playerRole&&!findOne_('MemberRoles',function(mr){return mr.tablegateId===invite.tablegateId&&mr.userId===userId&&mr.roleId===playerRole.id;}))insert_('MemberRoles',{id:id_('mrl'),tablegateId:invite.tablegateId,userId:userId,roleId:playerRole.id,createdAt:now});
  updateRow_('Invites',invite._row,{uses:int_(invite.uses,0)+1});
  emitTablegateEvent_(invite.tablegateId,'MEMBER_JOINED','USER',userId,{userId:userId});
  return {joined:true,tablegateId:invite.tablegateId};
}

function routePreviewInvite_(ctx){
  var invite=validateInviteCode_(ctx.params.code||ctx.params.inviteCode,null,false),tablegate=requireTablegate_(invite.tablegateId);
  return {code:invite.code,tablegate:{id:tablegate.id,name:tablegate.name,description:tablegate.description||'',iconAttachmentId:tablegate.iconAttachmentId||''},expiresAt:invite.expiresAt||'',remainingUses:int_(invite.maxUses,0)>0?Math.max(0,int_(invite.maxUses,0)-int_(invite.uses,0)):null};
}

function routeCreateInvite_(ctx){
  var tablegateId=String(ctx.params.tablegateId||'');requirePermission_(tablegateId,ctx.user.id,PERMISSIONS.CREATE_INVITE);
  var invite=createInviteRecord_(tablegateId,ctx.user.id,int_(ctx.params.maxUses,0,0,10000),int_(ctx.params.expiresInHours,168,1,8760));
  audit_(tablegateId,ctx.user.id,'INVITE_CREATED','INVITE',invite.id,{maxUses:invite.maxUses,expiresAt:invite.expiresAt});
  return stripInternal_(invite);
}

function routeListInvites_(ctx){
  var tablegateId=String(ctx.params.tablegateId||'');requirePermission_(tablegateId,ctx.user.id,PERMISSIONS.CREATE_INVITE);
  return filter_('Invites',function(i){return i.tablegateId===tablegateId&&!i.revokedAt;}).map(stripInternal_);
}

function routeRevokeInvite_(ctx){
  var invite=byId_('Invites',ctx.params.inviteId,true);if(!invite)throw new ApiError_('INVITE_NOT_FOUND','Invite not found.');
  requirePermission_(invite.tablegateId,ctx.user.id,PERMISSIONS.CREATE_INVITE);updateRow_('Invites',invite._row,{revokedAt:nowIso_()});
  audit_(invite.tablegateId,ctx.user.id,'INVITE_REVOKED','INVITE',invite.id,{});return {revoked:true};
}

function routeJoinInvite_(ctx){
  var invite=validateInviteCode_(ctx.params.code||ctx.params.inviteCode,ctx.user.id,true);
  return joinInviteForUser_(invite,ctx.user.id);
}

/* =============================
 * CATEGORIES AND CHANNELS
 * ============================= */

function canViewChannel_(channel,userId){
  requireMember_(channel.tablegateId,userId);
  if(!bool_(channel.isPrivate))return true;
  if(requireTablegate_(channel.tablegateId).ownerId===userId)return true;
  var allowed=array_(channel.allowedRoleIds),member=findOne_('Members',function(m){return m.tablegateId===channel.tablegateId&&m.userId===userId&&!m.leftAt;});
  var ids=roleIds_(member);return allowed.some(function(id){return ids.indexOf(id)!==-1;});
}

function requireChannel_(channelId,userId){
  var channel=byId_('Channels',channelId);if(!channel)throw new ApiError_('CHANNEL_NOT_FOUND','Channel not found.');
  if(!canViewChannel_(channel,userId))throw new ApiError_('FORBIDDEN','You cannot access this channel.');
  return channel;
}

function publicChannel_(c){
  return {id:c.id,tablegateId:c.tablegateId,categoryId:c.categoryId||'',name:c.name,topic:c.topic||'',type:c.type,position:num_(c.position,0),userLimit:int_(c.userLimit,0),slowmodeSeconds:int_(c.slowmodeSeconds,0),isPrivate:bool_(c.isPrivate),allowedRoleIds:array_(c.allowedRoleIds),isSystem:bool_(c.isSystem),createdBy:c.createdBy,createdAt:c.createdAt,updatedAt:c.updatedAt};
}

function routeListCategories_(ctx){var tablegateId=String(ctx.params.tablegateId||'');requireMember_(tablegateId,ctx.user.id);return filter_('Categories',function(c){return c.tablegateId===tablegateId&&!c.deletedAt;}).sort(function(a,b){return num_(a.position,0)-num_(b.position,0);}).map(stripInternal_);}
function routeCreateCategory_(ctx){var tablegateId=String(ctx.params.tablegateId||'');requirePermission_(tablegateId,ctx.user.id,PERMISSIONS.MANAGE_CHANNELS);var now=nowIso_(),c=insert_('Categories',{id:id_('cat'),tablegateId:tablegateId,name:text_(ctx.params.name,64),position:int_(ctx.params.position,100,-1000,1000),createdBy:ctx.user.id,createdAt:now,updatedAt:now,deletedAt:''});audit_(tablegateId,ctx.user.id,'CATEGORY_CREATED','CATEGORY',c.id,{name:c.name});emitTablegateEvent_(tablegateId,'CATEGORY_CREATED','CATEGORY',c.id,{category:stripInternal_(c)});return stripInternal_(c);}
function routeUpdateCategory_(ctx){var c=byId_('Categories',ctx.params.categoryId);if(!c)throw new ApiError_('CATEGORY_NOT_FOUND','Category not found.');requirePermission_(c.tablegateId,ctx.user.id,PERMISSIONS.MANAGE_CHANNELS);var patch={updatedAt:nowIso_()};if(ctx.params.name!==undefined)patch.name=text_(ctx.params.name,64);if(ctx.params.position!==undefined)patch.position=int_(ctx.params.position,c.position,-1000,1000);updateRow_('Categories',c._row,patch);var u=byId_('Categories',c.id);emitTablegateEvent_(c.tablegateId,'CATEGORY_UPDATED','CATEGORY',c.id,{category:stripInternal_(u)});return stripInternal_(u);}
function routeDeleteCategory_(ctx){var c=byId_('Categories',ctx.params.categoryId);if(!c)throw new ApiError_('CATEGORY_NOT_FOUND','Category not found.');requirePermission_(c.tablegateId,ctx.user.id,PERMISSIONS.MANAGE_CHANNELS);var now=nowIso_();updateRow_('Categories',c._row,{deletedAt:now,updatedAt:now});filter_('Channels',function(ch){return ch.categoryId===c.id&&!ch.deletedAt;}).forEach(function(ch){updateRow_('Channels',ch._row,{categoryId:'',updatedAt:now});});emitTablegateEvent_(c.tablegateId,'CATEGORY_DELETED','CATEGORY',c.id,{categoryId:c.id});return {deleted:true};}

function routeListChannels_(ctx){var tablegateId=String(ctx.params.tablegateId||'');requireMember_(tablegateId,ctx.user.id);return filter_('Channels',function(c){return c.tablegateId===tablegateId&&!c.deletedAt&&canViewChannel_(c,ctx.user.id);}).sort(function(a,b){return num_(a.position,0)-num_(b.position,0);}).map(publicChannel_);}

function routeCreateChannel_(ctx){
  var tablegateId=String(ctx.params.tablegateId||'');requirePermission_(tablegateId,ctx.user.id,PERMISSIONS.MANAGE_CHANNELS);
  var type=String(ctx.params.type||ctx.params.channelType||'TEXT').toUpperCase();if(TABLEGATE.CHANNEL_TYPES.indexOf(type)===-1)throw new ApiError_('INVALID_CHANNEL_TYPE','Unsupported channel type.');
  var categoryId=String(ctx.params.categoryId||'');if(categoryId){var cat=byId_('Categories',categoryId);if(!cat||cat.tablegateId!==tablegateId)throw new ApiError_('CATEGORY_NOT_FOUND','Category not found.');}
  var now=nowIso_(),c=insert_('Channels',{id:id_('chn'),tablegateId:tablegateId,categoryId:categoryId,name:text_(ctx.params.name,64).toLowerCase().replace(/\s+/g,'-'),topic:nullableText_(ctx.params.topic,TABLEGATE.MAX_TOPIC_LENGTH),type:type,position:int_(ctx.params.position,100,-1000,1000),userLimit:int_(ctx.params.userLimit,0,0,99),slowmodeSeconds:int_(ctx.params.slowmodeSeconds,0,0,21600),isPrivate:bool_(ctx.params.isPrivate),allowedRoleIds:JSON.stringify(unique_(array_(ctx.params.allowedRoleIds))),isSystem:false,createdBy:ctx.user.id,createdAt:now,updatedAt:now,deletedAt:''});
  audit_(tablegateId,ctx.user.id,'CHANNEL_CREATED','CHANNEL',c.id,{name:c.name,type:c.type});emitTablegateEvent_(tablegateId,'CHANNEL_CREATED','CHANNEL',c.id,{channel:publicChannel_(c)});return publicChannel_(c);
}

function routeUpdateChannel_(ctx){
  var c=byId_('Channels',ctx.params.channelId);if(!c)throw new ApiError_('CHANNEL_NOT_FOUND','Channel not found.');requirePermission_(c.tablegateId,ctx.user.id,PERMISSIONS.MANAGE_CHANNELS);
  var patch={updatedAt:nowIso_()};if(ctx.params.name!==undefined){var n=text_(ctx.params.name,64).toLowerCase().replace(/\s+/g,'-');if(bool_(c.isSystem)&&n!=='general')throw new ApiError_('SYSTEM_CHANNEL','The general channel name is protected.');patch.name=n;}
  if(ctx.params.topic!==undefined)patch.topic=nullableText_(ctx.params.topic,TABLEGATE.MAX_TOPIC_LENGTH);
  if(ctx.params.type!==undefined){var type=String(ctx.params.type).toUpperCase();if(TABLEGATE.CHANNEL_TYPES.indexOf(type)===-1)throw new ApiError_('INVALID_CHANNEL_TYPE','Unsupported channel type.');patch.type=type;}
  if(ctx.params.position!==undefined)patch.position=int_(ctx.params.position,c.position,-1000,1000);
  if(ctx.params.userLimit!==undefined)patch.userLimit=int_(ctx.params.userLimit,0,0,99);
  if(ctx.params.slowmodeSeconds!==undefined)patch.slowmodeSeconds=int_(ctx.params.slowmodeSeconds,0,0,21600);
  if(ctx.params.isPrivate!==undefined)patch.isPrivate=bool_(ctx.params.isPrivate);
  if(ctx.params.allowedRoleIds!==undefined)patch.allowedRoleIds=JSON.stringify(unique_(array_(ctx.params.allowedRoleIds)));
  if(ctx.params.categoryId!==undefined){var cid=String(ctx.params.categoryId||'');if(cid){var cat=byId_('Categories',cid);if(!cat||cat.tablegateId!==c.tablegateId)throw new ApiError_('CATEGORY_NOT_FOUND','Category not found.');}patch.categoryId=cid;}
  updateRow_('Channels',c._row,patch);var u=byId_('Channels',c.id);audit_(c.tablegateId,ctx.user.id,'CHANNEL_UPDATED','CHANNEL',c.id,patch);emitTablegateEvent_(c.tablegateId,'CHANNEL_UPDATED','CHANNEL',c.id,{channel:publicChannel_(u)});return publicChannel_(u);
}

function routeDeleteChannel_(ctx){var c=byId_('Channels',ctx.params.channelId);if(!c)throw new ApiError_('CHANNEL_NOT_FOUND','Channel not found.');requirePermission_(c.tablegateId,ctx.user.id,PERMISSIONS.MANAGE_CHANNELS);if(bool_(c.isSystem))throw new ApiError_('SYSTEM_CHANNEL','The general channel cannot be deleted.');var now=nowIso_();updateRow_('Channels',c._row,{deletedAt:now,updatedAt:now});filter_('VoiceStates',function(v){return v.channelId===c.id;}).sort(function(a,b){return b._row-a._row;}).forEach(function(v){deleteRow_('VoiceStates',v._row);});audit_(c.tablegateId,ctx.user.id,'CHANNEL_DELETED','CHANNEL',c.id,{name:c.name});emitTablegateEvent_(c.tablegateId,'CHANNEL_DELETED','CHANNEL',c.id,{channelId:c.id});return {deleted:true};}

/* =============================
 * MESSAGE SCOPES, CHAT, REACTIONS
 * ============================= */

function requireScope_(scopeType,scopeId,userId,permission){
  scopeType=String(scopeType||'').toUpperCase();scopeId=String(scopeId||'');
  if(scopeType==='CHANNEL'){
    var channel=requireChannel_(scopeId,userId);
    if(permission)requirePermission_(channel.tablegateId,userId,permission);
    return {scopeType:'CHANNEL',scopeId:channel.id,tablegateId:channel.tablegateId,channel:channel};
  }
  if(scopeType==='DM'){
    var dm=requireDm_(scopeId,userId);
    return {scopeType:'DM',scopeId:dm.id,tablegateId:'',dm:dm};
  }
  throw new ApiError_('INVALID_SCOPE','Scope type must be CHANNEL or DM.');
}

function canAccessMessage_(message,userId){
  try{return !!requireScope_(message.scopeType,message.scopeId,userId);}catch(e){return false;}
}

function enforceSlowmode_(channel,userId){
  var seconds=int_(channel.slowmodeSeconds,0);if(seconds<=0||hasPermission_(channel.tablegateId,userId,PERMISSIONS.MANAGE_MESSAGES))return;
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
  var limit=int_(ctx.params.limit,TABLEGATE.DEFAULT_PAGE_SIZE,1,TABLEGATE.MAX_RESULTS),before=String(ctx.params.before||'');
  var list=filter_('Messages',function(m){return m.scopeType===scope.scopeType&&m.scopeId===scope.scopeId;});
  list.sort(function(a,b){var d=new Date(b.createdAt)-new Date(a.createdAt);return d||String(b.id).localeCompare(String(a.id));});
  if(before){var beforeMsg=byId_('Messages',before,true),ts=beforeMsg?new Date(beforeMsg.createdAt).getTime():new Date(before).getTime();if(isFinite(ts))list=list.filter(function(m){return new Date(m.createdAt).getTime()<ts;});}
  var page=list.slice(0,limit),next=page.length===limit?page[page.length-1].id:'';
  return {messages:hydrateMessages_(page.reverse()),nextCursor:next,hasMore:list.length>limit};
}

function routeSendMessage_(ctx){
  var p=ctx.params,scope=requireScope_(p.scopeType||'CHANNEL',p.scopeId||p.channelId||p.dmId,ctx.user.id);
  if(scope.scopeType==='CHANNEL'){
    requirePermission_(scope.tablegateId,ctx.user.id,PERMISSIONS.SEND_MESSAGES);
    enforceSlowmode_(scope.channel,ctx.user.id);
    if(scope.channel.type==='HANDOUTS'&&!hasPermission_(scope.tablegateId,ctx.user.id,PERMISSIONS.MANAGE_HANDOUTS)&&String(p.messageType||'CHAT').toUpperCase()==='HANDOUT')throw new ApiError_('FORBIDDEN','You cannot publish handouts.');
  }
  var content=nullableText_(p.content,TABLEGATE.MAX_MESSAGE_LENGTH),attachmentIds=unique_(array_(p.attachmentIds));
  if(!content&&attachmentIds.length===0)throw new ApiError_('EMPTY_MESSAGE','Message needs text or an attachment.');
  if(attachmentIds.length>10)throw new ApiError_('TOO_MANY_ATTACHMENTS','A message can contain up to 10 attachments.');
  var messageType=String(p.messageType||'CHAT').toUpperCase();if(TABLEGATE.MESSAGE_TYPES.indexOf(messageType)===-1)throw new ApiError_('INVALID_MESSAGE_TYPE','Unsupported message type.');
  var personaId=String(p.personaId||'');if(personaId){var persona=requirePersona_(personaId,ctx.user.id);if(scope.tablegateId&&persona.tablegateId!==scope.tablegateId)throw new ApiError_('INVALID_PERSONA','Persona belongs to a different tablegate.');}
  var replyToId=String(p.replyToId||'');if(replyToId){var reply=byId_('Messages',replyToId,true);if(!reply||reply.scopeType!==scope.scopeType||reply.scopeId!==scope.scopeId)throw new ApiError_('INVALID_REPLY','Reply target is not in this conversation.');}
  var mentionUsers=unique_(array_(p.mentionUserIds)),mentionRoles=unique_(array_(p.mentionRoleIds)),everyone=bool_(p.mentionsEveryone);
  if(everyone&&scope.tablegateId&&!hasPermission_(scope.tablegateId,ctx.user.id,PERMISSIONS.MENTION_EVERYONE))throw new ApiError_('FORBIDDEN','You cannot mention everyone.');
  attachmentIds.forEach(function(aid){requireAttachmentAccess_(aid,ctx.user.id,scope.tablegateId,scope.scopeType==='DM'?scope.scopeId:'');});
  var now=nowIso_(),m=insert_('Messages',{id:id_('msg'),scopeType:scope.scopeType,scopeId:scope.scopeId,tablegateId:scope.tablegateId,authorId:ctx.user.id,personaId:personaId,messageType:messageType,content:content,attachmentIds:JSON.stringify(attachmentIds),replyToId:replyToId,mentionUserIds:JSON.stringify(mentionUsers),mentionRoleIds:JSON.stringify(mentionRoles),mentionsEveryone:everyone,isPinned:false,pinnedBy:'',pinnedAt:'',createdAt:now,editedAt:'',deletedAt:'',deletedBy:''});
  attachmentIds.forEach(function(aid){var a=byId_('Attachments',aid,true);updateRow_('Attachments',a._row,{scopeType:scope.scopeType,scopeId:scope.scopeId,tablegateId:scope.tablegateId,dmId:scope.scopeType==='DM'?scope.scopeId:'',messageId:m.id});});
  var full=hydrateMessages_([m])[0];emitScopeEvent_(scope,'MESSAGE_CREATED','MESSAGE',m.id,{message:full});
  createMessageNotifications_(scope,m,mentionUsers,mentionRoles,everyone);
  return full;
}

function createMessageNotifications_(scope,message,mentionUsers,mentionRoles,everyone){
  var targets={};mentionUsers.forEach(function(id){targets[id]=true;});
  if(scope.scopeType==='DM')filter_('DmParticipants',function(dp){return dp.dmId===scope.scopeId&&!dp.leftAt&&dp.userId!==message.authorId;}).forEach(function(dp){targets[dp.userId]=true;});
  if(scope.tablegateId&&(everyone||mentionRoles.length)){
    filter_('Members',function(m){return m.tablegateId===scope.tablegateId&&!m.leftAt&&m.userId!==message.authorId;}).forEach(function(m){if(everyone)targets[m.userId]=true;else{var ids=roleIds_(m);if(mentionRoles.some(function(r){return ids.indexOf(r)!==-1;}))targets[m.userId]=true;}});
  }
  Object.keys(targets).forEach(function(userId){if(userId!==message.authorId)createNotification_(userId,scope.scopeType==='DM'?'DIRECT_MESSAGE':'MENTION',message.authorId,scope.scopeType,scope.scopeId,message.id,{preview:String(message.content||'').slice(0,200)});});
}

function routeEditMessage_(ctx){
  var m=byId_('Messages',ctx.params.messageId,true);if(!m||m.deletedAt)throw new ApiError_('MESSAGE_NOT_FOUND','Message not found.');requireScope_(m.scopeType,m.scopeId,ctx.user.id);
  if(m.authorId!==ctx.user.id)throw new ApiError_('FORBIDDEN','Only the author can edit a message.');
  var content=nullableText_(ctx.params.content,TABLEGATE.MAX_MESSAGE_LENGTH);if(!content&&array_(m.attachmentIds).length===0)throw new ApiError_('EMPTY_MESSAGE','Message needs text or an attachment.');
  updateRow_('Messages',m._row,{content:content,editedAt:nowIso_()});var u=byId_('Messages',m.id,true),scope=requireScope_(u.scopeType,u.scopeId,ctx.user.id);emitScopeEvent_(scope,'MESSAGE_UPDATED','MESSAGE',u.id,{message:hydrateMessages_([u])[0]});return hydrateMessages_([u])[0];
}

function routeDeleteMessage_(ctx){
  var m=byId_('Messages',ctx.params.messageId,true);if(!m||m.deletedAt)throw new ApiError_('MESSAGE_NOT_FOUND','Message not found.');var scope=requireScope_(m.scopeType,m.scopeId,ctx.user.id);
  var can=m.authorId===ctx.user.id||(scope.tablegateId&&hasPermission_(scope.tablegateId,ctx.user.id,PERMISSIONS.MANAGE_MESSAGES));if(!can)throw new ApiError_('FORBIDDEN','You cannot delete this message.');
  var now=nowIso_();updateRow_('Messages',m._row,{content:'This message has been deleted.',attachmentIds:'[]',deletedAt:now,deletedBy:ctx.user.id,editedAt:now,isPinned:false,pinnedBy:'',pinnedAt:''});
  emitScopeEvent_(scope,'MESSAGE_DELETED','MESSAGE',m.id,{messageId:m.id,deletedBy:ctx.user.id});return {deleted:true,messageId:m.id};
}

function routePurgeMessages_(ctx){
  var scope=requireScope_(ctx.params.scopeType||'CHANNEL',ctx.params.scopeId||ctx.params.channelId||ctx.params.dmId,ctx.user.id);
  if(scope.tablegateId)requirePermission_(scope.tablegateId,ctx.user.id,PERMISSIONS.MANAGE_MESSAGES);else{var dm=requireDm_(scope.scopeId,ctx.user.id);if(dm.ownerId&&dm.ownerId!==ctx.user.id&&dm.type==='GROUP')throw new ApiError_('FORBIDDEN','Only the group owner can purge this DM.');}
  var now=nowIso_(),count=0;filter_('Messages',function(m){return m.scopeType===scope.scopeType&&m.scopeId===scope.scopeId&&!m.deletedAt;}).forEach(function(m){updateRow_('Messages',m._row,{content:'This message has been deleted.',attachmentIds:'[]',deletedAt:now,deletedBy:ctx.user.id,editedAt:now,isPinned:false});count++;});
  emitScopeEvent_(scope,'MESSAGES_PURGED',scope.scopeType,scope.scopeId,{count:count,actorId:ctx.user.id});return {purged:count};
}

function routePinMessage_(ctx){
  var m=byId_('Messages',ctx.params.messageId,true);if(!m||m.deletedAt)throw new ApiError_('MESSAGE_NOT_FOUND','Message not found.');var scope=requireScope_(m.scopeType,m.scopeId,ctx.user.id);
  if(scope.tablegateId)requirePermission_(scope.tablegateId,ctx.user.id,PERMISSIONS.MANAGE_MESSAGES);
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
  var scope=requireScope_(ctx.params.scopeType||'CHANNEL',ctx.params.scopeId||ctx.params.channelId||ctx.params.dmId,ctx.user.id),now=nowIso_(),expires=addMsIso_(TABLEGATE.TYPING_TTL_SECONDS*1000);
  var t=findOne_('Typing',function(x){return x.scopeType===scope.scopeType&&x.scopeId===scope.scopeId&&x.userId===ctx.user.id;});if(t)updateRow_('Typing',t._row,{expiresAt:expires,updatedAt:now});else t=insert_('Typing',{id:id_('typ'),scopeType:scope.scopeType,scopeId:scope.scopeId,userId:ctx.user.id,expiresAt:expires,updatedAt:now});
  emitScopeEvent_(scope,'TYPING_STARTED','USER',ctx.user.id,{userId:ctx.user.id,expiresAt:expires});return {typing:true,expiresAt:expires};
}

function routeListTyping_(ctx){var scope=requireScope_(ctx.params.scopeType||'CHANNEL',ctx.params.scopeId||ctx.params.channelId||ctx.params.dmId,ctx.user.id),users={};rows_('Users').forEach(function(u){users[u.id]=u;});return filter_('Typing',function(t){return t.scopeType===scope.scopeType&&t.scopeId===scope.scopeId&&isFuture_(t.expiresAt)&&t.userId!==ctx.user.id;}).map(function(t){return {userId:t.userId,user:publicUser_(users[t.userId]),expiresAt:t.expiresAt};});}

function routeMarkRead_(ctx){
  var channel=requireChannel_(ctx.params.channelId,ctx.user.id),messageId=String(ctx.params.messageId||'');if(messageId){var m=byId_('Messages',messageId,true);if(!m||m.scopeType!=='CHANNEL'||m.scopeId!==channel.id)throw new ApiError_('INVALID_MESSAGE','Message is not in this channel.');}
  var row=findOne_('ChannelReads',function(r){return r.channelId===channel.id&&r.userId===ctx.user.id;}),now=nowIso_();if(row)updateRow_('ChannelReads',row._row,{lastMessageId:messageId,lastReadAt:now});else insert_('ChannelReads',{id:id_('red'),channelId:channel.id,userId:ctx.user.id,lastMessageId:messageId,lastReadAt:now});return {read:true,lastReadAt:now};
}

function routeUnreadCounts_(ctx){
  var tablegateId=String(ctx.params.tablegateId||'');requireMember_(tablegateId,ctx.user.id);var reads={};filter_('ChannelReads',function(r){return r.userId===ctx.user.id;}).forEach(function(r){reads[r.channelId]=r;});
  var out={};filter_('Channels',function(c){return c.tablegateId===tablegateId&&!c.deletedAt&&canViewChannel_(c,ctx.user.id);}).forEach(function(c){var since=reads[c.id]?new Date(reads[c.id].lastReadAt).getTime():0;out[c.id]=filter_('Messages',function(m){return m.scopeType==='CHANNEL'&&m.scopeId===c.id&&!m.deletedAt&&m.authorId!==ctx.user.id&&new Date(m.createdAt).getTime()>since;}).length;});return out;
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

function uploadFolder_(){var id=PropertiesService.getScriptProperties().getProperty(TABLEGATE.UPLOAD_FOLDER_PROPERTY);if(!id)throw new ApiError_('NOT_CONFIGURED','Upload folder is missing. Run setupTablegate().');return DriveApp.getFolderById(id);}
function requireOwnedAttachment_(attachmentId,userId){var a=byId_('Attachments',attachmentId,true);if(!a||a.deletedAt||a.ownerId!==userId)throw new ApiError_('ATTACHMENT_NOT_FOUND','Attachment not found.');return a;}
function requireAttachmentAccess_(attachmentId,userId,tablegateId,dmId){
  var a=byId_('Attachments',attachmentId,true);if(!a||a.deletedAt)throw new ApiError_('ATTACHMENT_NOT_FOUND','Attachment not found.');if(a.ownerId===userId)return a;
  if(a.tablegateId&&tablegateId&&a.tablegateId===tablegateId){requireMember_(tablegateId,userId);return a;}
  if(a.dmId&&dmId&&a.dmId===dmId){requireDm_(dmId,userId);return a;}
  if(a.messageId){var m=byId_('Messages',a.messageId,true);if(m&&canAccessMessage_(m,userId))return a;}
  throw new ApiError_('FORBIDDEN','You cannot access this attachment.');
}
function publicAttachment_(a){return {id:a.id,ownerId:a.ownerId,originalName:a.originalName,mimeType:a.mimeType,sizeBytes:num_(a.sizeBytes,0),sha256:a.sha256,createdAt:a.createdAt,messageId:a.messageId||''};}
function attachmentInUse_(attachmentId){
  if(!attachmentId)return false;
  if(findOne_('Attachments',function(a){return a.id===attachmentId&&!!a.messageId;}))return true;
  if(findOne_('Users',function(u){return u.avatarAttachmentId===attachmentId||u.bannerAttachmentId===attachmentId;}))return true;
  if(findOne_('Tablegates',function(t){return t.iconAttachmentId===attachmentId&&!t.deletedAt;}))return true;
  if(findOne_('DmChannels',function(dm){return dm.iconAttachmentId===attachmentId&&!dm.closedAt;}))return true;
  if(findOne_('Personas',function(p){return p.avatarAttachmentId===attachmentId&&!p.deletedAt;}))return true;
  if(findOne_('CharacterSheets',function(c){return c.avatarAttachmentId===attachmentId&&!c.deletedAt;}))return true;
  if(findOne_('SystemDocuments',function(d){return d.attachmentId===attachmentId&&!d.deletedAt;}))return true;
  return false;
}

function routeUploadAttachment_(ctx){
  var p=ctx.params,name=safeFileName_(p.fileName||p.name),mime=nullableText_(p.mimeType,150)||'application/octet-stream',b64=String(p.base64||p.data||'').replace(/^data:[^;]+;base64,/,'');if(!b64)throw new ApiError_('FILE_REQUIRED','Base64 file data is required.');
  var bytes;try{bytes=Utilities.base64Decode(b64);}catch(e){throw new ApiError_('INVALID_FILE','Attachment data is not valid base64.');}
  var max=int_(PropertiesService.getScriptProperties().getProperty(TABLEGATE.MAX_UPLOAD_PROPERTY),TABLEGATE.DEFAULT_MAX_UPLOAD_BYTES,1024,20*1024*1024);if(bytes.length>max)throw new ApiError_('FILE_TOO_LARGE','Maximum attachment size is '+max+' bytes.');
  var tablegateId=String(p.tablegateId||''),dmId=String(p.dmId||'');if(tablegateId){requireMember_(tablegateId,ctx.user.id);requirePermission_(tablegateId,ctx.user.id,PERMISSIONS.ATTACH_FILES);}if(dmId)requireDm_(dmId,ctx.user.id);
  var aid=id_('att'),stored=aid+'_'+name,blob=Utilities.newBlob(bytes,mime,stored),file=uploadFolder_().createFile(blob);var now=nowIso_();
  var a=insert_('Attachments',{id:aid,ownerId:ctx.user.id,tablegateId:tablegateId,dmId:dmId,scopeType:'',scopeId:'',messageId:'',fileId:file.getId(),originalName:name,storedName:stored,mimeType:mime,sizeBytes:bytes.length,sha256:sha256Hex_(Utilities.base64Encode(bytes)),createdAt:now,deletedAt:''});return publicAttachment_(a);
}

function routeDownloadAttachment_(ctx){
  var a=byId_('Attachments',ctx.params.attachmentId,true);if(!a)throw new ApiError_('ATTACHMENT_NOT_FOUND','Attachment not found.');requireAttachmentAccess_(a.id,ctx.user.id,a.tablegateId||'',a.dmId||'');
  var file;try{file=DriveApp.getFileById(a.fileId);}catch(e){throw new ApiError_('FILE_MISSING','Stored file is missing.');}var blob=file.getBlob();return {attachment:publicAttachment_(a),base64:Utilities.base64Encode(blob.getBytes())};
}

function routeDeleteAttachment_(ctx){
  var a=requireOwnedAttachment_(ctx.params.attachmentId,ctx.user.id);if(attachmentInUse_(a.id))throw new ApiError_('ATTACHMENT_IN_USE','Remove this attachment from its Tablegate content before deleting it.');
  try{DriveApp.getFileById(a.fileId).setTrashed(true);}catch(e){}updateRow_('Attachments',a._row,{deletedAt:nowIso_()});return {deleted:true};
}

/* =============================
 * PRESENCE, NOTIFICATIONS, EVENTS
 * ============================= */

function upsertPresence_(userId,status,customStatus){
  status=String(status||'ONLINE').toUpperCase();if(TABLEGATE.PRESENCE_STATUSES.indexOf(status)===-1)status='ONLINE';var now=nowIso_(),p=findOne_('Presence',function(x){return x.userId===userId;});
  if(p)updateRow_('Presence',p._row,{status:status,customStatus:customStatus||'',lastSeenAt:now,updatedAt:now});else insert_('Presence',{id:id_('pre'),userId:userId,status:status,customStatus:customStatus||'',lastSeenAt:now,updatedAt:now});
  var u=byId_('Users',userId,true);if(u)updateRow_('Users',u._row,{status:status,customStatus:customStatus||u.customStatus||'',lastSeenAt:now,updatedAt:now});
  return {userId:userId,status:status,customStatus:customStatus||'',lastSeenAt:now};
}

function routeHeartbeat_(ctx){
  var status=String(ctx.params.status||ctx.user.status||'ONLINE').toUpperCase(),custom=ctx.params.customStatus!==undefined?nullableText_(ctx.params.customStatus,128):(ctx.user.customStatus||'');var presence=upsertPresence_(ctx.user.id,status,custom);
  array_(ctx.params.tablegateIds).forEach(function(sid){try{requireMember_(sid,ctx.user.id);emitTablegateEvent_(sid,'PRESENCE_UPDATED','USER',ctx.user.id,{presence:presence});}catch(e){}});return presence;
}

function routeSetPresence_(ctx){return routeHeartbeat_(ctx);}
function routeListPresence_(ctx){var tablegateId=String(ctx.params.tablegateId||'');requireMember_(tablegateId,ctx.user.id);var memberIds={};filter_('Members',function(m){return m.tablegateId===tablegateId&&!m.leftAt;}).forEach(function(m){memberIds[m.userId]=true;});var users={};rows_('Users').forEach(function(u){users[u.id]=u;});return filter_('Presence',function(p){return memberIds[p.userId];}).map(function(p){var stale=Date.now()-new Date(p.lastSeenAt).getTime()>180000;return {userId:p.userId,user:publicUser_(users[p.userId]),status:stale?'OFFLINE':p.status,customStatus:p.customStatus||'',lastSeenAt:p.lastSeenAt};});}

function createNotification_(userId,type,actorId,scopeType,scopeId,messageId,payload){
  var n=insert_('Notifications',{id:id_('not'),userId:userId,type:type,actorId:actorId||'',scopeType:scopeType||'',scopeId:scopeId||'',messageId:messageId||'',payloadJson:JSON.stringify(payload||{}),readAt:'',createdAt:nowIso_()});emitUserEvent_(userId,'NOTIFICATION_CREATED','NOTIFICATION',n.id,{notification:publicNotification_(n)});return n;
}
function publicNotification_(n){return {id:n.id,userId:n.userId,type:n.type,actorId:n.actorId||'',scopeType:n.scopeType||'',scopeId:n.scopeId||'',messageId:n.messageId||'',payload:parseJsonCell_(n.payloadJson,{}),readAt:n.readAt||'',createdAt:n.createdAt};}
function routeListNotifications_(ctx){var unreadOnly=bool_(ctx.params.unreadOnly),limit=int_(ctx.params.limit,50,1,100);return filter_('Notifications',function(n){return n.userId===ctx.user.id&&(!unreadOnly||!n.readAt);}).sort(function(a,b){return new Date(b.createdAt)-new Date(a.createdAt);}).slice(0,limit).map(publicNotification_);}
function routeMarkNotificationRead_(ctx){var ids=array_(ctx.params.notificationIds);if(ctx.params.notificationId)ids.push(String(ctx.params.notificationId));var now=nowIso_(),count=0;filter_('Notifications',function(n){return n.userId===ctx.user.id&&!n.readAt&&(ids.length===0||ids.indexOf(n.id)!==-1);}).forEach(function(n){updateRow_('Notifications',n._row,{readAt:now});count++;});return {markedRead:count};}

function emitEvent_(audienceType,audienceId,eventType,entityType,entityId,payload){
  return insert_('Events',{id:id_('evt'),audienceType:audienceType,audienceId:String(audienceId||''),eventType:eventType,entityType:entityType||'',entityId:String(entityId||''),payloadJson:JSON.stringify(payload||{}),createdAt:nowIso_(),expiresAt:addMsIso_(TABLEGATE.EVENT_TTL_HOURS*3600000)});
}
function emitTablegateEvent_(tablegateId,eventType,entityType,entityId,payload){emitEvent_('TABLEGATE',tablegateId,eventType,entityType,entityId,payload);}
function emitUserEvent_(userId,eventType,entityType,entityId,payload){emitEvent_('USER',userId,eventType,entityType,entityId,payload);}
function emitChannelEvent_(channelId,eventType,entityType,entityId,payload){emitEvent_('CHANNEL',channelId,eventType,entityType,entityId,payload);}
function emitDmEvent_(dmId,eventType,entityType,entityId,payload){emitEvent_('DM',dmId,eventType,entityType,entityId,payload);}
function emitScopeEvent_(scope,eventType,entityType,entityId,payload){if(scope.scopeType==='CHANNEL')emitChannelEvent_(scope.scopeId,eventType,entityType,entityId,payload);else emitDmEvent_(scope.scopeId,eventType,entityType,entityId,payload);if(scope.tablegateId)emitTablegateEvent_(scope.tablegateId,eventType,entityType,entityId,{scopeType:scope.scopeType,scopeId:scope.scopeId});}

function routePollEvents_(ctx){
  var after=String(ctx.params.after||ctx.params.cursor||new Date(Date.now()-60000).toISOString()),afterMs=new Date(after).getTime();if(!isFinite(afterMs))afterMs=Date.now()-60000;
  var tablegateIds=unique_(array_(ctx.params.tablegateIds)),channelIds=unique_(array_(ctx.params.channelIds)),dmIds=unique_(array_(ctx.params.dmIds)),limit=int_(ctx.params.limit,100,1,200);
  tablegateIds=tablegateIds.filter(function(id){try{requireMember_(id,ctx.user.id);return true;}catch(e){return false;}});
  channelIds=channelIds.filter(function(id){try{requireChannel_(id,ctx.user.id);return true;}catch(e){return false;}});
  dmIds=dmIds.filter(function(id){try{requireDm_(id,ctx.user.id);return true;}catch(e){return false;}});
  var events=filter_('Events',function(ev){if(isPast_(ev.expiresAt)||new Date(ev.createdAt).getTime()<=afterMs)return false;if(ev.audienceType==='USER')return ev.audienceId===ctx.user.id;if(ev.audienceType==='TABLEGATE')return tablegateIds.indexOf(ev.audienceId)!==-1;if(ev.audienceType==='CHANNEL')return channelIds.indexOf(ev.audienceId)!==-1;if(ev.audienceType==='DM')return dmIds.indexOf(ev.audienceId)!==-1;return false;}).sort(function(a,b){return new Date(a.createdAt)-new Date(b.createdAt);}).slice(0,limit).map(function(ev){return {id:ev.id,audienceType:ev.audienceType,audienceId:ev.audienceId,eventType:ev.eventType,entityType:ev.entityType,entityId:ev.entityId,payload:parseJsonCell_(ev.payloadJson,{}),createdAt:ev.createdAt};});
  return {events:events,cursor:nowIso_(),pollAfterMs:1500};
}

/* =============================
 * VOICE, CALLS, AND WEBRTC SIGNALING
 * ============================= */

function publicVoiceState_(v){var u=byId_('Users',v.userId,true);return {id:v.id,tablegateId:v.tablegateId,channelId:v.channelId,userId:v.userId,user:publicUser_(u),sessionId:v.sessionId,muted:bool_(v.muted),deafened:bool_(v.deafened),videoEnabled:bool_(v.videoEnabled),screenSharing:bool_(v.screenSharing),pushToTalk:bool_(v.pushToTalk),whispering:bool_(v.whispering),joinedAt:v.joinedAt,updatedAt:v.updatedAt};}

function routeJoinVoice_(ctx){
  var channel=requireChannel_(ctx.params.channelId,ctx.user.id);if(['VOICE','VIDEO'].indexOf(channel.type)===-1)throw new ApiError_('NOT_VOICE_CHANNEL','Channel is not a voice or video room.');requirePermission_(channel.tablegateId,ctx.user.id,PERMISSIONS.CONNECT_VOICE);
  var current=filter_('VoiceStates',function(v){return v.userId===ctx.user.id;}).sort(function(a,b){return b._row-a._row;});current.forEach(function(v){deleteRow_('VoiceStates',v._row);emitChannelEvent_(v.channelId,'VOICE_USER_LEFT','USER',ctx.user.id,{userId:ctx.user.id});});
  var count=filter_('VoiceStates',function(v){return v.channelId===channel.id;}).length;if(int_(channel.userLimit,0)>0&&count>=int_(channel.userLimit,0))throw new ApiError_('VOICE_FULL','Voice channel is full.');
  var now=nowIso_(),v=insert_('VoiceStates',{id:id_('voi'),tablegateId:channel.tablegateId,channelId:channel.id,userId:ctx.user.id,sessionId:ctx.session.id,muted:bool_(ctx.params.muted),deafened:bool_(ctx.params.deafened),videoEnabled:channel.type==='VIDEO'&&bool_(ctx.params.videoEnabled),screenSharing:false,pushToTalk:bool_(ctx.params.pushToTalk),whispering:false,joinedAt:now,updatedAt:now});
  emitChannelEvent_(channel.id,'VOICE_USER_JOINED','USER',ctx.user.id,{voiceState:publicVoiceState_(v)});emitTablegateEvent_(channel.tablegateId,'VOICE_STATE_UPDATED','USER',ctx.user.id,{voiceState:publicVoiceState_(v)});
  return {voiceState:publicVoiceState_(v),peers:filter_('VoiceStates',function(x){return x.channelId===channel.id&&x.userId!==ctx.user.id;}).map(publicVoiceState_),iceServers:getIceServers_()};
}

function routeUpdateVoice_(ctx){
  var v=findOne_('VoiceStates',function(x){return x.userId===ctx.user.id&&(!ctx.params.channelId||x.channelId===String(ctx.params.channelId));});if(!v)throw new ApiError_('NOT_IN_VOICE','You are not in a voice channel.');var patch={updatedAt:nowIso_()};
  ['muted','deafened','videoEnabled','screenSharing','pushToTalk','whispering'].forEach(function(k){if(ctx.params[k]!==undefined)patch[k]=bool_(ctx.params[k]);});if(patch.videoEnabled&&!hasPermission_(v.tablegateId,ctx.user.id,PERMISSIONS.STREAM))throw new ApiError_('FORBIDDEN','You cannot enable video.');if(patch.screenSharing&&!hasPermission_(v.tablegateId,ctx.user.id,PERMISSIONS.STREAM))throw new ApiError_('FORBIDDEN','You cannot share your screen.');
  updateRow_('VoiceStates',v._row,patch);var u=byId_('VoiceStates',v.id,true);emitChannelEvent_(v.channelId,'VOICE_STATE_UPDATED','USER',ctx.user.id,{voiceState:publicVoiceState_(u)});return publicVoiceState_(u);
}

function routeLeaveVoice_(ctx){var states=filter_('VoiceStates',function(v){return v.userId===ctx.user.id&&(!ctx.params.channelId||v.channelId===String(ctx.params.channelId));}).sort(function(a,b){return b._row-a._row;}),left=[];states.forEach(function(v){left.push(v.channelId);deleteRow_('VoiceStates',v._row);emitChannelEvent_(v.channelId,'VOICE_USER_LEFT','USER',ctx.user.id,{userId:ctx.user.id});emitTablegateEvent_(v.tablegateId,'VOICE_STATE_UPDATED','USER',ctx.user.id,{userId:ctx.user.id,channelId:''});});return {left:true,channelIds:left};}
function routeListVoiceStates_(ctx){var tablegateId=String(ctx.params.tablegateId||'');requireMember_(tablegateId,ctx.user.id);return filter_('VoiceStates',function(v){return v.tablegateId===tablegateId;}).map(publicVoiceState_);}

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

function getIceServers_(){var raw=PropertiesService.getScriptProperties().getProperty(TABLEGATE.RTC_ICE_PROPERTY)||'[]';var parsed=parseJsonCell_(raw,[]);return Array.isArray(parsed)?parsed:[];}
function authorizeRtcRoom_(roomType,roomId,userId){
  roomType=String(roomType||'').toUpperCase();if(TABLEGATE.RTC_ROOM_TYPES.indexOf(roomType)===-1)throw new ApiError_('INVALID_RTC_ROOM','Invalid RTC room type.');
  if(roomType==='VOICE'){var channel=requireChannel_(roomId,userId),state=findOne_('VoiceStates',function(v){return v.channelId===channel.id&&v.userId===userId;});if(!state)throw new ApiError_('NOT_IN_VOICE','Join the voice channel first.');return {roomType:roomType,roomId:channel.id};}
  if(roomType==='DM_CALL'){var rc=requireCall_(roomId,userId);if(!rc.call)throw new ApiError_('CALL_NOT_FOUND','No active call.');var cp=findOne_('CallParticipants',function(x){return x.callId===rc.call.id&&x.userId===userId&&x.status==='JOINED';});if(!cp)throw new ApiError_('NOT_IN_CALL','Join the call first.');return {roomType:roomType,roomId:rc.call.id,dmId:roomId};}
  if(roomType==='WHISPER'){var ch=requireChannel_(roomId,userId),vs=findOne_('VoiceStates',function(v){return v.channelId===ch.id&&v.userId===userId;});if(!vs)throw new ApiError_('NOT_IN_VOICE','Join the voice channel before whispering.');return {roomType:roomType,roomId:ch.id};}
}

function rtcPeerAuthorized_(roomType,roomId,userId){try{if(roomType==='VOICE'||roomType==='WHISPER')return !!findOne_('VoiceStates',function(v){return v.channelId===roomId&&v.userId===userId;});if(roomType==='DM_CALL')return !!findOne_('CallParticipants',function(cp){return cp.callId===roomId&&cp.userId===userId&&cp.status==='JOINED';});}catch(e){}return false;}

function routeSendRtcSignal_(ctx){
  var room=authorizeRtcRoom_(ctx.params.roomType,ctx.params.roomId,ctx.user.id),to=String(ctx.params.toUserId||''),type=String(ctx.params.signalType||'').toUpperCase();if(TABLEGATE.RTC_SIGNAL_TYPES.indexOf(type)===-1)throw new ApiError_('INVALID_SIGNAL','Unsupported RTC signal type.');if(!to)throw new ApiError_('RTC_TARGET_REQUIRED','WebRTC signals must target one peer; send one signal per peer in group rooms.');if(!rtcPeerAuthorized_(room.roomType,room.roomId,to))throw new ApiError_('PEER_NOT_IN_ROOM','Target peer is not in this RTC room.');
  var signal=ctx.params.signal;if(signal===undefined)signal=ctx.params.payload||{};var s=insert_('RtcSignals',{id:id_('rtc'),roomType:room.roomType,roomId:room.roomId,fromUserId:ctx.user.id,toUserId:to,signalType:type,signalJson:JSON.stringify(signal),createdAt:nowIso_(),expiresAt:addMsIso_(TABLEGATE.SIGNAL_TTL_MINUTES*60000),consumedAt:''});if(to)emitUserEvent_(to,'RTC_SIGNAL','RTC_SIGNAL',s.id,{signalId:s.id,roomType:s.roomType,roomId:s.roomId,fromUserId:s.fromUserId,signalType:s.signalType});return {sent:true,signalId:s.id};
}

function routePollRtcSignals_(ctx){
  var room=authorizeRtcRoom_(ctx.params.roomType,ctx.params.roomId,ctx.user.id),after=String(ctx.params.after||new Date(Date.now()-60000).toISOString()),afterMs=new Date(after).getTime();if(!isFinite(afterMs))afterMs=Date.now()-60000;
  var signals=filter_('RtcSignals',function(s){return s.roomType===room.roomType&&s.roomId===room.roomId&&!s.consumedAt&&!isPast_(s.expiresAt)&&s.fromUserId!==ctx.user.id&&(!s.toUserId||s.toUserId===ctx.user.id)&&new Date(s.createdAt).getTime()>afterMs;}).sort(function(a,b){return new Date(a.createdAt)-new Date(b.createdAt);}).slice(0,100).map(function(s){return {id:s.id,roomType:s.roomType,roomId:s.roomId,fromUserId:s.fromUserId,toUserId:s.toUserId||'',signalType:s.signalType,signal:parseJsonCell_(s.signalJson,{}),createdAt:s.createdAt};});return {signals:signals,cursor:nowIso_(),iceServers:getIceServers_()};
}

function routeAckRtcSignals_(ctx){var ids=array_(ctx.params.signalIds),count=0,now=nowIso_();filter_('RtcSignals',function(s){return ids.indexOf(s.id)!==-1&&!s.consumedAt&&(s.toUserId===ctx.user.id||(!s.toUserId&&rtcPeerAuthorized_(s.roomType,s.roomId,ctx.user.id)));}).forEach(function(s){updateRow_('RtcSignals',s._row,{consumedAt:now});count++;});return {acknowledged:count};}

/* =============================
 * TABLEGATE PERSONAS, CHARACTERS, AND MECHANICS
 * ============================= */

function publicPersona_(p){return {id:p.id,tablegateId:p.tablegateId,userId:p.userId,name:p.name,avatarAttachmentId:p.avatarAttachmentId||'',color:p.color||'#808080',description:p.description||'',isDefault:bool_(p.isDefault),createdAt:p.createdAt,updatedAt:p.updatedAt};}
function requirePersona_(personaId,userId){var p=byId_('Personas',personaId);if(!p||p.userId!==userId)throw new ApiError_('PERSONA_NOT_FOUND','Persona not found.');requireMember_(p.tablegateId,userId);return p;}
function routeListPersonas_(ctx){var tablegateId=String(ctx.params.tablegateId||'');requireMember_(tablegateId,ctx.user.id);var ownOnly=ctx.params.ownOnly===undefined?true:bool_(ctx.params.ownOnly);return filter_('Personas',function(p){return p.tablegateId===tablegateId&&!p.deletedAt&&(!ownOnly||p.userId===ctx.user.id);}).map(publicPersona_);}
function routeCreatePersona_(ctx){var tablegateId=String(ctx.params.tablegateId||'');requirePermission_(tablegateId,ctx.user.id,PERMISSIONS.USE_PERSONAS);var aid=String(ctx.params.avatarAttachmentId||'');if(aid)requireAttachmentAccess_(aid,ctx.user.id,tablegateId,'');if(bool_(ctx.params.isDefault))filter_('Personas',function(p){return p.tablegateId===tablegateId&&p.userId===ctx.user.id&&!p.deletedAt&&bool_(p.isDefault);}).forEach(function(p){updateRow_('Personas',p._row,{isDefault:false,updatedAt:nowIso_()});});var now=nowIso_(),p=insert_('Personas',{id:id_('per'),tablegateId:tablegateId,userId:ctx.user.id,name:text_(ctx.params.name,80),avatarAttachmentId:aid,color:nullableText_(ctx.params.color,16)||'#808080',description:nullableText_(ctx.params.description,1000),isDefault:bool_(ctx.params.isDefault),createdAt:now,updatedAt:now,deletedAt:''});emitTablegateEvent_(tablegateId,'PERSONA_CREATED','PERSONA',p.id,{persona:publicPersona_(p)});return publicPersona_(p);}
function routeUpdatePersona_(ctx){var p=requirePersona_(ctx.params.personaId,ctx.user.id),patch={updatedAt:nowIso_()};if(ctx.params.name!==undefined)patch.name=text_(ctx.params.name,80);if(ctx.params.avatarAttachmentId!==undefined){if(ctx.params.avatarAttachmentId)requireAttachmentAccess_(ctx.params.avatarAttachmentId,ctx.user.id,p.tablegateId,'');patch.avatarAttachmentId=String(ctx.params.avatarAttachmentId||'');}if(ctx.params.color!==undefined)patch.color=nullableText_(ctx.params.color,16)||'#808080';if(ctx.params.description!==undefined)patch.description=nullableText_(ctx.params.description,1000);if(ctx.params.isDefault!==undefined&&bool_(ctx.params.isDefault)){filter_('Personas',function(x){return x.tablegateId===p.tablegateId&&x.userId===ctx.user.id&&x.id!==p.id&&!x.deletedAt&&bool_(x.isDefault);}).forEach(function(x){updateRow_('Personas',x._row,{isDefault:false,updatedAt:nowIso_()});});patch.isDefault=true;}updateRow_('Personas',p._row,patch);var u=byId_('Personas',p.id);emitTablegateEvent_(p.tablegateId,'PERSONA_UPDATED','PERSONA',p.id,{persona:publicPersona_(u)});return publicPersona_(u);}
function routeDeletePersona_(ctx){var p=requirePersona_(ctx.params.personaId,ctx.user.id);updateRow_('Personas',p._row,{deletedAt:nowIso_(),updatedAt:nowIso_(),isDefault:false});emitTablegateEvent_(p.tablegateId,'PERSONA_DELETED','PERSONA',p.id,{personaId:p.id});return {deleted:true};}

function parseDiceExpression_(expr){
  expr=String(expr||'').replace(/\s+/g,'').toLowerCase();if(!expr||expr.length>120)throw new ApiError_('INVALID_DICE','Dice expression is empty or too long.');
  if(!/^[+\-]?\d*d\d+([+\-]\d*d?\d+)*$/.test(expr)&&!/^[+\-]?\d+([+\-]\d*d?\d+)*$/.test(expr))throw new ApiError_('INVALID_DICE','Use expressions like 1d20+5, 2d6+1d4-2, or 10.');
  var normalized=expr.replace(/-/g,'+-').split('+').filter(Boolean),terms=[];normalized.forEach(function(raw){var sign=1;if(raw.charAt(0)==='-'){sign=-1;raw=raw.slice(1);}if(raw.indexOf('d')!==-1){var bits=raw.split('d'),count=bits[0]?int_(bits[0],1,1,100):1,sides=int_(bits[1],0,2,1000);if(!sides)throw new ApiError_('INVALID_DICE','Dice must have at least 2 sides.');terms.push({type:'dice',sign:sign,count:count,sides:sides});}else terms.push({type:'flat',sign:sign,value:int_(raw,0,-100000,100000)});});return {expression:expr,terms:terms};
}
function rollDice_(parsed){var total=0,detail=[];parsed.terms.forEach(function(t){if(t.type==='flat'){total+=t.sign*t.value;detail.push({type:'flat',sign:t.sign,value:t.value,subtotal:t.sign*t.value});}else{var rolls=[];for(var i=0;i<t.count;i++)rolls.push(secureRandomInt_(t.sides)+1);var subtotal=rolls.reduce(function(a,b){return a+b;},0)*t.sign;total+=subtotal;detail.push({type:'dice',sign:t.sign,count:t.count,sides:t.sides,rolls:rolls,subtotal:subtotal});}});return {total:total,detail:detail};}
function routeRollDice_(ctx){
  var channel=requireChannel_(ctx.params.channelId,ctx.user.id);requirePermission_(channel.tablegateId,ctx.user.id,PERMISSIONS.ROLL_DICE);var parsed=parseDiceExpression_(ctx.params.expression||ctx.params.dice),rolled=rollDice_(parsed),personaId=String(ctx.params.personaId||'');if(personaId){var p=requirePersona_(personaId,ctx.user.id);if(p.tablegateId!==channel.tablegateId)throw new ApiError_('INVALID_PERSONA','Persona belongs to another tablegate.');}
  var label=nullableText_(ctx.params.label,200),now=nowIso_(),roll=insert_('DiceRolls',{id:id_('rolld'),tablegateId:channel.tablegateId,channelId:channel.id,userId:ctx.user.id,personaId:personaId,expression:parsed.expression,label:label,total:rolled.total,detailJson:JSON.stringify(rolled.detail),messageId:'',createdAt:now});
  var message=null;if(ctx.params.postMessage===undefined||bool_(ctx.params.postMessage)){var text=(label?label+': ':'')+'`'+parsed.expression+'` = **'+rolled.total+'**';message=routeSendMessage_({params:{scopeType:'CHANNEL',scopeId:channel.id,content:text,messageType:'ROLL',personaId:personaId,attachmentIds:[]},user:ctx.user,session:ctx.session});updateRow_('DiceRolls',roll._row,{messageId:message.id});}
  audit_(channel.tablegateId,ctx.user.id,'DICE_ROLLED','DICE_ROLL',roll.id,{expression:parsed.expression,total:rolled.total});return {id:roll.id,tablegateId:roll.tablegateId,channelId:roll.channelId,userId:roll.userId,personaId:personaId,expression:parsed.expression,label:label,total:rolled.total,detail:rolled.detail,message:message,createdAt:now};
}
function routeListDiceRolls_(ctx){var channel=requireChannel_(ctx.params.channelId,ctx.user.id),limit=int_(ctx.params.limit,50,1,100);return filter_('DiceRolls',function(r){return r.channelId===channel.id;}).sort(function(a,b){return new Date(b.createdAt)-new Date(a.createdAt);}).slice(0,limit).map(function(r){return {id:r.id,tablegateId:r.tablegateId,channelId:r.channelId,userId:r.userId,personaId:r.personaId||'',expression:r.expression,label:r.label||'',total:num_(r.total,0),detail:parseJsonCell_(r.detailJson,[]),messageId:r.messageId||'',createdAt:r.createdAt};});}



/* =============================
 * GAME SYSTEMS, HOMEBREW, CHARACTERS, AND GENERIC MECHANICS
 * =============================
 * Rules are data, not hard-coded assumptions. A Tablegate may use one system,
 * several systems, a hybrid profile, or the system-agnostic profile. Large JSON
 * references remain in private Drive files and are linked through SystemDocuments.
 */

function seedBuiltInSystems_() {
  var count = 0;
  BUILT_IN_SYSTEMS.forEach(function(def) {
    var existing = findOne_('GameSystems', function(s) { return s.id === def.id || s.slug === def.slug; });
    if (existing) return;
    var now = nowIso_();
    insert_('GameSystems', {
      id:def.id, ownerId:'', name:def.name, slug:def.slug, family:def.family || '', edition:def.edition || '', version:def.version || '',
      systemType:def.systemType || 'BUILT_IN', visibility:'PUBLIC', description:def.description || '', publisher:'', licenseName:'', sourceUrl:'', attribution:'',
      defaultMechanicJson:jsonCell_(def.defaultMechanic || {engine:'MANUAL'}, {}, 'defaultMechanic'), characterSchemaJson:jsonCell_({}, {}, 'characterSchema'),
      metadataJson:jsonCell_({bundledFile:def.bundledFile || '', seededBy:'Tablegate'}, {}, 'metadata'), createdAt:now, updatedAt:now, deletedAt:''
    });
    count++;
  });
  return count;
}

function publicGameSystem_(system) {
  if (!system) return null;
  return {
    id:system.id, ownerId:system.ownerId || '', name:system.name, slug:system.slug, family:system.family || '', edition:system.edition || '', version:system.version || '',
    systemType:system.systemType, visibility:system.visibility, description:system.description || '', publisher:system.publisher || '', licenseName:system.licenseName || '',
    sourceUrl:system.sourceUrl || '', attribution:system.attribution || '', defaultMechanic:parseJsonCell_(system.defaultMechanicJson, {}),
    characterSchema:parseJsonCell_(system.characterSchemaJson, {}), metadata:parseJsonCell_(system.metadataJson, {}), createdAt:system.createdAt, updatedAt:system.updatedAt
  };
}

function isSystemLinked_(systemId, tablegateId) {
  return !!findOne_('TablegateSystems', function(link) { return link.systemId === systemId && link.tablegateId === tablegateId && !link.deletedAt && bool_(link.enabled); });
}

function canReadGameSystem_(system, userId, tablegateId) {
  if (!system || system.deletedAt) return false;
  if (system.visibility === 'PUBLIC' || system.visibility === 'UNLISTED' || system.systemType === 'BUILT_IN' || system.systemType === 'GENERIC') return true;
  if (system.ownerId && system.ownerId === userId) return true;
  if (tablegateId && isSystemLinked_(system.id, tablegateId)) {
    try { requireMember_(tablegateId, userId); return true; } catch (e) { return false; }
  }
  return false;
}

function requireGameSystem_(systemId, userId, tablegateId) {
  var system = byId_('GameSystems', String(systemId || ''), true);
  if (!system || !canReadGameSystem_(system, userId, tablegateId || '')) throw new ApiError_('SYSTEM_NOT_FOUND', 'Game system not found or unavailable.');
  return system;
}

function requireSystemOwner_(system, userId) {
  if (!system || !system.ownerId || system.ownerId !== userId) throw new ApiError_('SYSTEM_LOCKED', 'Built-in and other users’ system profiles cannot be modified. Clone the profile to customize it.');
}

function routeListGameSystems_(ctx) {
  var tablegateId = String(ctx.params.tablegateId || '');
  if (tablegateId) requireMember_(tablegateId, ctx.user.id);
  var q = lower_(ctx.params.query || ctx.params.q || '');
  var type = String(ctx.params.systemType || '').toUpperCase();
  var systems = filter_('GameSystems', function(system) {
    if (!canReadGameSystem_(system, ctx.user.id, tablegateId)) return false;
    if (type && system.systemType !== type) return false;
    if (q && lower_(system.name + ' ' + system.slug + ' ' + system.family + ' ' + system.edition).indexOf(q) === -1) return false;
    return true;
  }).sort(function(a,b){return String(a.name).localeCompare(String(b.name));});
  return systems.slice(0, int_(ctx.params.limit, 100, 1, 200)).map(publicGameSystem_);
}

function routeGetGameSystem_(ctx) {
  var tablegateId = String(ctx.params.tablegateId || '');
  var system = requireGameSystem_(ctx.params.systemId, ctx.user.id, tablegateId);
  var out = publicGameSystem_(system);
  out.documents = listSystemDocuments_(system.id, tablegateId, ctx.user.id);
  return out;
}

function uniqueSystemSlug_(requested, excludeId) {
  var base = slug_(requested), candidate = base, i = 2;
  while (findOne_('GameSystems', function(s){return s.id !== excludeId && s.slug === candidate && !s.deletedAt;})) candidate = base + '-' + (i++);
  return candidate;
}

function routeCreateGameSystem_(ctx) {
  var p = ctx.params, now = nowIso_();
  var name = text_(p.name, 120);
  var system = insert_('GameSystems', {
    id:id_('sys'), ownerId:ctx.user.id, name:name, slug:uniqueSystemSlug_(p.slug || name, ''), family:nullableText_(p.family, 120), edition:nullableText_(p.edition, 120), version:nullableText_(p.version, 80),
    systemType:enumValue_(p.systemType || 'CUSTOM', TABLEGATE.SYSTEM_TYPES, 'CUSTOM', 'systemType'), visibility:enumValue_(p.visibility || 'PRIVATE', TABLEGATE.SYSTEM_VISIBILITIES, 'PRIVATE', 'visibility'),
    description:nullableText_(p.description, 4000), publisher:nullableText_(p.publisher, 200), licenseName:nullableText_(p.licenseName, 200), sourceUrl:nullableText_(p.sourceUrl, 1000), attribution:nullableText_(p.attribution, 4000),
    defaultMechanicJson:jsonCell_(p.defaultMechanic, {engine:'MANUAL'}, 'defaultMechanic'), characterSchemaJson:jsonCell_(p.characterSchema, {}, 'characterSchema'), metadataJson:jsonCell_(p.metadata, {}, 'metadata'),
    createdAt:now, updatedAt:now, deletedAt:''
  });
  return publicGameSystem_(system);
}

function routeUpdateGameSystem_(ctx) {
  var system = requireGameSystem_(ctx.params.systemId, ctx.user.id, String(ctx.params.tablegateId || ''));
  requireSystemOwner_(system, ctx.user.id);
  var p = ctx.params, patch = {updatedAt:nowIso_()};
  if (p.name !== undefined) patch.name = text_(p.name, 120);
  if (p.slug !== undefined) patch.slug = uniqueSystemSlug_(p.slug, system.id);
  ['family','edition','version','publisher','licenseName','sourceUrl','attribution','description'].forEach(function(k){if(p[k] !== undefined)patch[k]=nullableText_(p[k],k==='description'||k==='attribution'?4000:(k==='sourceUrl'?1000:200));});
  if (p.systemType !== undefined) patch.systemType = enumValue_(p.systemType, TABLEGATE.SYSTEM_TYPES, 'CUSTOM', 'systemType');
  if (p.visibility !== undefined) patch.visibility = enumValue_(p.visibility, TABLEGATE.SYSTEM_VISIBILITIES, 'PRIVATE', 'visibility');
  if (p.defaultMechanic !== undefined) patch.defaultMechanicJson = jsonCell_(p.defaultMechanic, {}, 'defaultMechanic');
  if (p.characterSchema !== undefined) patch.characterSchemaJson = jsonCell_(p.characterSchema, {}, 'characterSchema');
  if (p.metadata !== undefined) patch.metadataJson = jsonCell_(p.metadata, {}, 'metadata');
  updateRow_('GameSystems', system._row, patch);
  return publicGameSystem_(byId_('GameSystems', system.id, true));
}

function routeCloneGameSystem_(ctx) {
  var source = requireGameSystem_(ctx.params.systemId, ctx.user.id, String(ctx.params.tablegateId || ''));
  return routeCreateGameSystem_({user:ctx.user,session:ctx.session,params:{
    name:ctx.params.name || (source.name + ' — Custom'), slug:ctx.params.slug || (source.slug + '-custom'), family:source.family, edition:source.edition, version:source.version,
    systemType:ctx.params.systemType || 'HOMEBREW', visibility:ctx.params.visibility || 'PRIVATE', description:ctx.params.description || source.description,
    publisher:source.publisher, licenseName:source.licenseName, sourceUrl:source.sourceUrl, attribution:source.attribution,
    defaultMechanic:parseJsonCell_(source.defaultMechanicJson, {}), characterSchema:parseJsonCell_(source.characterSchemaJson, {}), metadata:{clonedFromSystemId:source.id}
  }});
}

function routeDeleteGameSystem_(ctx) {
  var system = requireGameSystem_(ctx.params.systemId, ctx.user.id, String(ctx.params.tablegateId || ''));
  requireSystemOwner_(system, ctx.user.id);
  updateRow_('GameSystems', system._row, {deletedAt:nowIso_(),updatedAt:nowIso_()});
  var affected={};filter_('TablegateSystems',function(link){return link.systemId===system.id&&!link.deletedAt;}).forEach(function(link){affected[link.tablegateId]=true;updateRow_('TablegateSystems',link._row,{deletedAt:nowIso_(),enabled:false,isPrimary:false,updatedAt:nowIso_()});});
  Object.keys(affected).forEach(function(tablegateId){var remaining=filter_('TablegateSystems',function(link){return link.tablegateId===tablegateId&&!link.deletedAt&&bool_(link.enabled);}),now=nowIso_();if(!remaining.length){attachSystemRecord_(tablegateId,'sys_tablegate_generic',ctx.user.id,{isPrimary:true});return;}remaining.forEach(function(link,index){updateRow_('TablegateSystems',link._row,{isPrimary:index===0,updatedAt:now});});var tablegate=requireTablegate_(tablegateId);updateRow_('Tablegates',tablegate._row,{primarySystemId:remaining[0].systemId,systemMode:remaining.length>1?'MULTI':'SINGLE',updatedAt:now});});
  return {deleted:true,systemId:system.id};
}

function publicTablegateSystem_(link) {
  return {id:link.id,tablegateId:link.tablegateId,systemId:link.systemId,label:link.label||'',isPrimary:bool_(link.isPrimary),enabled:bool_(link.enabled),config:parseJsonCell_(link.configJson,{}),houseRules:parseJsonCell_(link.houseRulesJson,{}),createdBy:link.createdBy,createdAt:link.createdAt,updatedAt:link.updatedAt};
}

function attachSystemRecord_(tablegateId, systemId, actorId, options) {
  options = options || {};
  requireTablegate_(tablegateId);
  var system = requireGameSystem_(systemId, actorId, tablegateId);
  var existing = findOne_('TablegateSystems',function(link){return link.tablegateId===tablegateId&&link.systemId===system.id&&!link.deletedAt;});
  var makePrimary = bool_(options.isPrimary);
  if (makePrimary) filter_('TablegateSystems',function(link){return link.tablegateId===tablegateId&&!link.deletedAt&&bool_(link.isPrimary);}).forEach(function(link){updateRow_('TablegateSystems',link._row,{isPrimary:false,updatedAt:nowIso_()});});
  var now = nowIso_();
  if (existing) {
    updateRow_('TablegateSystems',existing._row,{label:nullableText_(options.label,120),isPrimary:makePrimary||bool_(existing.isPrimary),enabled:options.enabled===undefined?true:bool_(options.enabled),configJson:jsonCell_(options.config,parseJsonCell_(existing.configJson,{}),'system config'),houseRulesJson:jsonCell_(options.houseRules,parseJsonCell_(existing.houseRulesJson,{}),'system house rules'),updatedAt:now,deletedAt:''});
  } else {
    existing=insert_('TablegateSystems',{id:id_('tgs'),tablegateId:tablegateId,systemId:system.id,label:nullableText_(options.label,120),isPrimary:makePrimary,enabled:options.enabled===undefined?true:bool_(options.enabled),configJson:jsonCell_(options.config,{},'system config'),houseRulesJson:jsonCell_(options.houseRules,{},'system house rules'),createdBy:actorId,createdAt:now,updatedAt:now,deletedAt:''});
  }
  var active=filter_('TablegateSystems',function(link){return link.tablegateId===tablegateId&&!link.deletedAt&&bool_(link.enabled);});
  var primary=active.filter(function(link){return bool_(link.isPrimary);})[0]||active[0]||null;
  if(primary&&!bool_(primary.isPrimary))updateRow_('TablegateSystems',primary._row,{isPrimary:true,updatedAt:now});
  var mode=active.length>1?'MULTI':(system.systemType==='GENERIC'?'SYSTEM_AGNOSTIC':'SINGLE');
  var tablegate=requireTablegate_(tablegateId);updateRow_('Tablegates',tablegate._row,{primarySystemId:primary?primary.systemId:'sys_tablegate_generic',systemMode:mode,updatedAt:now});
  var result=publicTablegateSystem_(byId_('TablegateSystems',existing.id,true));result.system=publicGameSystem_(system);return result;
}

function routeListTablegateSystems_(ctx) {
  var tablegateId=String(ctx.params.tablegateId||'');requireMember_(tablegateId,ctx.user.id);
  return filter_('TablegateSystems',function(link){return link.tablegateId===tablegateId&&!link.deletedAt;}).sort(function(a,b){return (bool_(b.isPrimary)?1:0)-(bool_(a.isPrimary)?1:0);}).map(function(link){var out=publicTablegateSystem_(link);out.system=publicGameSystem_(byId_('GameSystems',link.systemId,true));return out;});
}

function routeAttachSystemToTablegate_(ctx) {
  var tablegateId=String(ctx.params.tablegateId||'');requirePermission_(tablegateId,ctx.user.id,PERMISSIONS.MANAGE_SYSTEMS);
  var result=attachSystemRecord_(tablegateId,String(ctx.params.systemId||''),ctx.user.id,{isPrimary:ctx.params.isPrimary,label:ctx.params.label,enabled:ctx.params.enabled,config:ctx.params.config,houseRules:ctx.params.houseRules});
  audit_(tablegateId,ctx.user.id,'SYSTEM_ATTACHED','GAME_SYSTEM',result.systemId,{isPrimary:result.isPrimary});emitTablegateEvent_(tablegateId,'SYSTEM_ATTACHED','GAME_SYSTEM',result.systemId,{link:result});return result;
}

function routeUpdateTablegateSystem_(ctx) {
  var link=byId_('TablegateSystems',ctx.params.tablegateSystemId,true);if(!link||link.deletedAt)throw new ApiError_('TABLEGATE_SYSTEM_NOT_FOUND','Attached system not found.');requirePermission_(link.tablegateId,ctx.user.id,PERMISSIONS.MANAGE_SYSTEMS);
  return attachSystemRecord_(link.tablegateId,link.systemId,ctx.user.id,{isPrimary:ctx.params.isPrimary===undefined?link.isPrimary:ctx.params.isPrimary,label:ctx.params.label===undefined?link.label:ctx.params.label,enabled:ctx.params.enabled===undefined?link.enabled:ctx.params.enabled,config:ctx.params.config===undefined?parseJsonCell_(link.configJson,{}):ctx.params.config,houseRules:ctx.params.houseRules===undefined?parseJsonCell_(link.houseRulesJson,{}):ctx.params.houseRules});
}

function routeDetachSystemFromTablegate_(ctx) {
  var link=byId_('TablegateSystems',ctx.params.tablegateSystemId,true);if(!link||link.deletedAt)throw new ApiError_('TABLEGATE_SYSTEM_NOT_FOUND','Attached system not found.');requirePermission_(link.tablegateId,ctx.user.id,PERMISSIONS.MANAGE_SYSTEMS);
  updateRow_('TablegateSystems',link._row,{deletedAt:nowIso_(),enabled:false,isPrimary:false,updatedAt:nowIso_()});
  var remaining=filter_('TablegateSystems',function(x){return x.tablegateId===link.tablegateId&&!x.deletedAt&&bool_(x.enabled);});
  if(!remaining.length)attachSystemRecord_(link.tablegateId,'sys_tablegate_generic',ctx.user.id,{isPrimary:true});else if(bool_(link.isPrimary))attachSystemRecord_(link.tablegateId,remaining[0].systemId,ctx.user.id,{isPrimary:true,config:parseJsonCell_(remaining[0].configJson,{}),houseRules:parseJsonCell_(remaining[0].houseRulesJson,{})});
  audit_(link.tablegateId,ctx.user.id,'SYSTEM_DETACHED','GAME_SYSTEM',link.systemId,{});emitTablegateEvent_(link.tablegateId,'SYSTEM_DETACHED','GAME_SYSTEM',link.systemId,{systemId:link.systemId});return {detached:true,systemId:link.systemId};
}

function canReadSystemDocument_(doc,userId,tablegateId) {
  if(!doc||doc.deletedAt)return false;if(doc.visibility==='PUBLIC'||doc.ownerId===userId)return true;
  var tid=tablegateId||doc.tablegateId;if(tid&&doc.tablegateId===tid){try{requireMember_(tid,userId);return true;}catch(e){}}
  return false;
}
function publicSystemDocument_(doc){return {id:doc.id,tablegateId:doc.tablegateId||'',systemId:doc.systemId,ownerId:doc.ownerId||'',title:doc.title,documentType:doc.documentType,version:doc.version||'',attachmentId:doc.attachmentId,contentHash:doc.contentHash||'',metadata:parseJsonCell_(doc.metadataJson,{}),visibility:doc.visibility,createdAt:doc.createdAt,updatedAt:doc.updatedAt};}
function listSystemDocuments_(systemId,tablegateId,userId){return filter_('SystemDocuments',function(doc){return doc.systemId===systemId&&!doc.deletedAt&&canReadSystemDocument_(doc,userId,tablegateId);}).map(publicSystemDocument_);}

function routeCreateSystemDocument_(ctx){
  var p=ctx.params,tablegateId=String(p.tablegateId||'');if(tablegateId)requireMember_(tablegateId,ctx.user.id);var system=requireGameSystem_(p.systemId,ctx.user.id,tablegateId);var attachment=requireOwnedAttachment_(p.attachmentId,ctx.user.id);
  if(tablegateId&&attachment.tablegateId&&attachment.tablegateId!==tablegateId)throw new ApiError_('INVALID_ATTACHMENT_SCOPE','Attachment belongs to another Tablegate.');
  var now=nowIso_(),doc=insert_('SystemDocuments',{id:id_('sdoc'),tablegateId:tablegateId,systemId:system.id,ownerId:ctx.user.id,title:text_(p.title||attachment.originalName,200),documentType:nullableText_(p.documentType,80)||'RULES_REFERENCE',version:nullableText_(p.version,80),attachmentId:attachment.id,contentHash:attachment.sha256||'',metadataJson:jsonCell_(p.metadata,{},'document metadata'),visibility:enumValue_(p.visibility||(tablegateId?'TABLEGATE':'PRIVATE'),TABLEGATE.CONTENT_VISIBILITIES,'PRIVATE','visibility'),createdAt:now,updatedAt:now,deletedAt:''});
  return publicSystemDocument_(doc);
}
function routeListSystemDocuments_(ctx){var tablegateId=String(ctx.params.tablegateId||'');if(tablegateId)requireMember_(tablegateId,ctx.user.id);requireGameSystem_(ctx.params.systemId,ctx.user.id,tablegateId);return listSystemDocuments_(String(ctx.params.systemId),tablegateId,ctx.user.id);}
function routeDeleteSystemDocument_(ctx){var doc=byId_('SystemDocuments',ctx.params.documentId,true);if(!doc||doc.deletedAt||doc.ownerId!==ctx.user.id)throw new ApiError_('DOCUMENT_NOT_FOUND','System document not found.');updateRow_('SystemDocuments',doc._row,{deletedAt:nowIso_(),updatedAt:nowIso_()});return {deleted:true,documentId:doc.id};}

function inferSystemReferenceMetadata_(data,fileName){
  var metadata=(data&&data.metadata)||{},document=(data&&data.document)||{},system=(data&&data.system)||{},editionIdentity=(data&&data.edition_identity)||{};
  var title=metadata.short_title||metadata.title||document.short_title||document.title||system.name||document.game||String(fileName||'Custom System Reference').replace(/\.json$/i,'').replace(/[_-]+/g,' ');
  var edition=metadata.active_ruleset||metadata.ruleset||metadata.rules_baseline||document.edition||system.edition||editionIdentity.current_edition||'';
  var version=metadata.schema_version||metadata.file_version||document.version||data.schema_version||'';
  var family=system.rules_family||metadata.system_identity||'';
  return {name:String(title).slice(0,120),edition:String(edition).slice(0,120),version:String(version).slice(0,80),family:String(family).slice(0,120),metadata:{topLevelKeys:data&&typeof data==='object'?Object.keys(data).slice(0,100):[],sourceFile:fileName||'',importedAt:nowIso_()}};
}

function importSystemReferenceAttachment_(attachment,actorId,options){
  options=options||{};var file;try{file=DriveApp.getFileById(attachment.fileId);}catch(e){throw new ApiError_('FILE_MISSING','Stored JSON reference is missing.');}
  var text=file.getBlob().getDataAsString('UTF-8'),data;try{data=JSON.parse(text);}catch(e){throw new ApiError_('INVALID_JSON','The selected attachment is not valid JSON.',String(e&&e.message?e.message:e));}
  var inferred=inferSystemReferenceMetadata_(data,attachment.originalName),tablegateId=String(options.tablegateId||attachment.tablegateId||''),system;
  if(options.systemId)system=requireGameSystem_(options.systemId,actorId,tablegateId);else{
    var bundledMatch=findOne_('GameSystems',function(candidate){var meta=parseJsonCell_(candidate.metadataJson,{});return meta.bundledFile&&meta.bundledFile===attachment.originalName&&!candidate.deletedAt;});
    if(bundledMatch)system=bundledMatch;
    var desiredSlug=slug_(options.slug||inferred.name),existing=system||findOne_('GameSystems',function(s){return s.slug===desiredSlug&&!s.deletedAt;});
    if(existing&&canReadGameSystem_(existing,actorId,tablegateId))system=existing;else system=insert_('GameSystems',{id:id_('sys'),ownerId:actorId,name:options.name||inferred.name,slug:uniqueSystemSlug_(desiredSlug,''),family:options.family||inferred.family,edition:options.edition||inferred.edition,version:options.version||inferred.version,systemType:enumValue_(options.systemType||'CUSTOM',TABLEGATE.SYSTEM_TYPES,'CUSTOM','systemType'),visibility:enumValue_(options.visibility||'PRIVATE',TABLEGATE.SYSTEM_VISIBILITIES,'PRIVATE','visibility'),description:nullableText_(options.description,4000),publisher:nullableText_(options.publisher,200),licenseName:nullableText_(options.licenseName,200),sourceUrl:nullableText_(options.sourceUrl,1000),attribution:nullableText_(options.attribution,4000),defaultMechanicJson:jsonCell_(options.defaultMechanic,{engine:'MANUAL'},'defaultMechanic'),characterSchemaJson:jsonCell_(options.characterSchema,{},'characterSchema'),metadataJson:jsonCell_(inferred.metadata,{},'metadata'),createdAt:nowIso_(),updatedAt:nowIso_(),deletedAt:''});
  }
  var duplicate=findOne_('SystemDocuments',function(doc){return doc.systemId===system.id&&doc.contentHash===attachment.sha256&&!doc.deletedAt;});
  var doc=duplicate||insert_('SystemDocuments',{id:id_('sdoc'),tablegateId:tablegateId,systemId:system.id,ownerId:actorId,title:options.title||attachment.originalName,documentType:options.documentType||'RULES_REFERENCE_JSON',version:options.version||inferred.version,attachmentId:attachment.id,contentHash:attachment.sha256||'',metadataJson:jsonCell_(inferred.metadata,{},'document metadata'),visibility:enumValue_(options.documentVisibility||(tablegateId?'TABLEGATE':'PRIVATE'),TABLEGATE.CONTENT_VISIBILITIES,'PRIVATE','visibility'),createdAt:nowIso_(),updatedAt:nowIso_(),deletedAt:''});
  return {system:publicGameSystem_(system),document:publicSystemDocument_(doc),inferred:inferred};
}
function routeImportSystemReference_(ctx){var attachment=requireOwnedAttachment_(ctx.params.attachmentId,ctx.user.id);var result=importSystemReferenceAttachment_(attachment,ctx.user.id,ctx.params);if(ctx.params.attachToTablegate&&ctx.params.tablegateId){requirePermission_(ctx.params.tablegateId,ctx.user.id,PERMISSIONS.MANAGE_SYSTEMS);result.tablegateSystem=attachSystemRecord_(String(ctx.params.tablegateId),result.system.id,ctx.user.id,{isPrimary:ctx.params.isPrimary});}return result;}

function importSystemJsonFilesFromDriveFolder(folderId,options){
  options=options||{};resetRuntime_();ensureConfigured_();var folder=DriveApp.getFolderById(folderId),files=folder.getFiles(),results=[];while(files.hasNext()){var file=files.next();if(!/\.json$/i.test(file.getName()))continue;var bytes=file.getBlob().getBytes(),hash=sha256Hex_(Utilities.base64Encode(bytes)),attachment=findOne_('Attachments',function(a){return a.fileId===file.getId()&&!a.deletedAt;});if(!attachment)attachment=insert_('Attachments',{id:id_('att'),ownerId:String(options.ownerId||'TABLEGATE_IMPORT'),tablegateId:String(options.tablegateId||''),dmId:'',scopeType:'SYSTEM_REFERENCE',scopeId:'',messageId:'',fileId:file.getId(),originalName:file.getName(),storedName:file.getName(),mimeType:'application/json',sizeBytes:bytes.length,sha256:hash,createdAt:nowIso_(),deletedAt:''});try{results.push(importSystemReferenceAttachment_(attachment,String(options.ownerId||'TABLEGATE_IMPORT'),options));}catch(err){results.push({file:file.getName(),error:String(err&&err.message?err.message:err)});}}return results;
}

function canManageOwnedOrTablegate_(record,userId,permission){if(record.ownerId===userId)return true;if(record.tablegateId){try{return hasPermission_(record.tablegateId,userId,permission);}catch(e){}}return false;}
function publicHomebrew_(item){return {id:item.id,tablegateId:item.tablegateId,systemId:item.systemId||'',ownerId:item.ownerId,contentType:item.contentType,name:item.name,version:item.version||'',status:item.status,visibility:item.visibility,tags:parseJsonCell_(item.tagsJson,[]),data:parseJsonCell_(item.dataJson,{}),schema:parseJsonCell_(item.schemaJson,{}),sourceAttribution:item.sourceAttribution||'',createdAt:item.createdAt,updatedAt:item.updatedAt};}
function canReadHomebrew_(item,userId){if(item.deletedAt)return false;if(item.ownerId===userId||item.visibility==='PUBLIC')return true;if(item.visibility==='TABLEGATE'){try{requireMember_(item.tablegateId,userId);return true;}catch(e){}}return false;}
function routeCreateHomebrew_(ctx){var p=ctx.params,tablegateId=String(p.tablegateId||'');requireMember_(tablegateId,ctx.user.id);var systemId=String(p.systemId||requireTablegate_(tablegateId).primarySystemId||'sys_tablegate_generic');requireGameSystem_(systemId,ctx.user.id,tablegateId);var now=nowIso_(),item=insert_('HomebrewContent',{id:id_('hb'),tablegateId:tablegateId,systemId:systemId,ownerId:ctx.user.id,contentType:text_(p.contentType||'CUSTOM',80).toUpperCase(),name:text_(p.name,160),version:nullableText_(p.version,80),status:enumValue_(p.status||'DRAFT',TABLEGATE.CONTENT_STATUSES,'DRAFT','status'),visibility:enumValue_(p.visibility||'TABLEGATE',TABLEGATE.CONTENT_VISIBILITIES,'TABLEGATE','visibility'),tagsJson:jsonCell_(p.tags,[],'tags'),dataJson:jsonCell_(p.data,{},'homebrew data'),schemaJson:jsonCell_(p.schema,{},'homebrew schema'),sourceAttribution:nullableText_(p.sourceAttribution,4000),createdAt:now,updatedAt:now,deletedAt:''});emitTablegateEvent_(tablegateId,'HOMEBREW_CREATED','HOMEBREW',item.id,{item:publicHomebrew_(item)});return publicHomebrew_(item);}
function routeListHomebrew_(ctx){var tablegateId=String(ctx.params.tablegateId||'');if(tablegateId)requireMember_(tablegateId,ctx.user.id);var systemId=String(ctx.params.systemId||''),type=String(ctx.params.contentType||'').toUpperCase();return filter_('HomebrewContent',function(item){return(!tablegateId||item.tablegateId===tablegateId)&&(!systemId||item.systemId===systemId)&&(!type||item.contentType===type)&&canReadHomebrew_(item,ctx.user.id);}).slice(0,int_(ctx.params.limit,100,1,200)).map(publicHomebrew_);}
function routeGetHomebrew_(ctx){var item=byId_('HomebrewContent',ctx.params.homebrewId,true);if(!item||!canReadHomebrew_(item,ctx.user.id))throw new ApiError_('HOMEBREW_NOT_FOUND','Homebrew item not found.');return publicHomebrew_(item);}
function routeUpdateHomebrew_(ctx){var item=byId_('HomebrewContent',ctx.params.homebrewId,true);if(!item||item.deletedAt||!canManageOwnedOrTablegate_(item,ctx.user.id,PERMISSIONS.MANAGE_SYSTEMS))throw new ApiError_('HOMEBREW_NOT_FOUND','Homebrew item not found or not editable.');var p=ctx.params,patch={updatedAt:nowIso_()};if(p.name!==undefined)patch.name=text_(p.name,160);if(p.contentType!==undefined)patch.contentType=text_(p.contentType,80).toUpperCase();if(p.version!==undefined)patch.version=nullableText_(p.version,80);if(p.status!==undefined)patch.status=enumValue_(p.status,TABLEGATE.CONTENT_STATUSES,'DRAFT','status');if(p.visibility!==undefined)patch.visibility=enumValue_(p.visibility,TABLEGATE.CONTENT_VISIBILITIES,'TABLEGATE','visibility');if(p.tags!==undefined)patch.tagsJson=jsonCell_(p.tags,[],'tags');if(p.data!==undefined)patch.dataJson=jsonCell_(p.data,{},'homebrew data');if(p.schema!==undefined)patch.schemaJson=jsonCell_(p.schema,{},'homebrew schema');if(p.sourceAttribution!==undefined)patch.sourceAttribution=nullableText_(p.sourceAttribution,4000);updateRow_('HomebrewContent',item._row,patch);return publicHomebrew_(byId_('HomebrewContent',item.id,true));}
function routeDeleteHomebrew_(ctx){var item=byId_('HomebrewContent',ctx.params.homebrewId,true);if(!item||item.deletedAt||!canManageOwnedOrTablegate_(item,ctx.user.id,PERMISSIONS.MANAGE_SYSTEMS))throw new ApiError_('HOMEBREW_NOT_FOUND','Homebrew item not found or not editable.');updateRow_('HomebrewContent',item._row,{deletedAt:nowIso_(),updatedAt:nowIso_()});return {deleted:true,homebrewId:item.id};}

function canReadCharacter_(sheet,userId){if(!sheet||sheet.deletedAt)return false;if(sheet.ownerId===userId||sheet.userId===userId)return true;if(sheet.visibility==='TABLEGATE'){try{requireMember_(sheet.tablegateId,userId);return true;}catch(e){}}try{return hasPermission_(sheet.tablegateId,userId,PERMISSIONS.MANAGE_CHARACTERS);}catch(e){}return false;}
function publicCharacter_(sheet,userId){var out={id:sheet.id,tablegateId:sheet.tablegateId,systemId:sheet.systemId,userId:sheet.userId,ownerId:sheet.ownerId,name:sheet.name,pronouns:sheet.pronouns||'',concept:sheet.concept||'',avatarAttachmentId:sheet.avatarAttachmentId||'',schemaVersion:sheet.schemaVersion||'',data:parseJsonCell_(sheet.dataJson,{}),visibility:sheet.visibility,isArchived:bool_(sheet.isArchived),createdAt:sheet.createdAt,updatedAt:sheet.updatedAt},canSeePrivate=sheet.ownerId===userId;try{canSeePrivate=canSeePrivate||hasPermission_(sheet.tablegateId,userId,PERMISSIONS.MANAGE_CHARACTERS);}catch(e){}if(canSeePrivate)out.privateNotes=parseJsonCell_(sheet.privateNotesJson,{});return out;}
function requireCharacter_(id,userId){var sheet=byId_('CharacterSheets',id,true);if(!sheet||!canReadCharacter_(sheet,userId))throw new ApiError_('CHARACTER_NOT_FOUND','Character sheet not found.');return sheet;}
function routeCreateCharacter_(ctx){var p=ctx.params,tablegateId=String(p.tablegateId||'');requireMember_(tablegateId,ctx.user.id);var representedUserId=String(p.userId||ctx.user.id);if(representedUserId!==ctx.user.id){requirePermission_(tablegateId,ctx.user.id,PERMISSIONS.MANAGE_CHARACTERS);requireMember_(tablegateId,representedUserId);}var systemId=String(p.systemId||requireTablegate_(tablegateId).primarySystemId||'sys_tablegate_generic');requireGameSystem_(systemId,ctx.user.id,tablegateId);var aid=String(p.avatarAttachmentId||'');if(aid)requireAttachmentAccess_(aid,ctx.user.id,tablegateId,'');var now=nowIso_(),sheet=insert_('CharacterSheets',{id:id_('chr'),tablegateId:tablegateId,systemId:systemId,userId:representedUserId,ownerId:ctx.user.id,name:text_(p.name,160),pronouns:nullableText_(p.pronouns,120),concept:nullableText_(p.concept,1000),avatarAttachmentId:aid,schemaVersion:nullableText_(p.schemaVersion,80),dataJson:jsonCell_(p.data,{},'character data'),privateNotesJson:jsonCell_(p.privateNotes,{},'private notes'),visibility:enumValue_(p.visibility||'TABLEGATE',['TABLEGATE','PRIVATE'],'TABLEGATE','visibility'),isArchived:false,createdAt:now,updatedAt:now,deletedAt:''});emitTablegateEvent_(tablegateId,'CHARACTER_CREATED','CHARACTER',sheet.id,{character:publicCharacter_(sheet,ctx.user.id)});return publicCharacter_(sheet,ctx.user.id);}
function routeListCharacters_(ctx){var tablegateId=String(ctx.params.tablegateId||'');requireMember_(tablegateId,ctx.user.id);var systemId=String(ctx.params.systemId||'');return filter_('CharacterSheets',function(sheet){return sheet.tablegateId===tablegateId&&!sheet.deletedAt&&(!systemId||sheet.systemId===systemId)&&canReadCharacter_(sheet,ctx.user.id);}).map(function(sheet){return publicCharacter_(sheet,ctx.user.id);});}
function routeGetCharacter_(ctx){return publicCharacter_(requireCharacter_(ctx.params.characterId,ctx.user.id),ctx.user.id);}
function routeUpdateCharacter_(ctx){var sheet=requireCharacter_(ctx.params.characterId,ctx.user.id);if(!canManageOwnedOrTablegate_(sheet,ctx.user.id,PERMISSIONS.MANAGE_CHARACTERS))throw new ApiError_('FORBIDDEN','You cannot edit this character.');var p=ctx.params,patch={updatedAt:nowIso_()};if(p.name!==undefined)patch.name=text_(p.name,160);if(p.pronouns!==undefined)patch.pronouns=nullableText_(p.pronouns,120);if(p.concept!==undefined)patch.concept=nullableText_(p.concept,1000);if(p.systemId!==undefined){requireGameSystem_(p.systemId,ctx.user.id,sheet.tablegateId);patch.systemId=String(p.systemId);}if(p.avatarAttachmentId!==undefined){if(p.avatarAttachmentId)requireAttachmentAccess_(p.avatarAttachmentId,ctx.user.id,sheet.tablegateId,'');patch.avatarAttachmentId=String(p.avatarAttachmentId||'');}if(p.schemaVersion!==undefined)patch.schemaVersion=nullableText_(p.schemaVersion,80);if(p.data!==undefined)patch.dataJson=jsonCell_(p.data,{},'character data');if(p.privateNotes!==undefined)patch.privateNotesJson=jsonCell_(p.privateNotes,{},'private notes');if(p.visibility!==undefined)patch.visibility=enumValue_(p.visibility,['TABLEGATE','PRIVATE'],'TABLEGATE','visibility');if(p.isArchived!==undefined)patch.isArchived=bool_(p.isArchived);updateRow_('CharacterSheets',sheet._row,patch);return publicCharacter_(byId_('CharacterSheets',sheet.id,true),ctx.user.id);}
function routeDeleteCharacter_(ctx){var sheet=requireCharacter_(ctx.params.characterId,ctx.user.id);if(!canManageOwnedOrTablegate_(sheet,ctx.user.id,PERMISSIONS.MANAGE_CHARACTERS))throw new ApiError_('FORBIDDEN','You cannot delete this character.');updateRow_('CharacterSheets',sheet._row,{deletedAt:nowIso_(),updatedAt:nowIso_()});return {deleted:true,characterId:sheet.id};}

function canReadMacro_(macro,userId){if(!macro||macro.deletedAt)return false;if(macro.ownerId===userId||macro.visibility==='PUBLIC')return true;if(macro.visibility==='TABLEGATE'){try{requireMember_(macro.tablegateId,userId);return true;}catch(e){}}return false;}
function publicMacro_(macro){return {id:macro.id,tablegateId:macro.tablegateId,systemId:macro.systemId||'',ownerId:macro.ownerId,name:macro.name,description:macro.description||'',mechanic:parseJsonCell_(macro.mechanicJson,{}),visibility:macro.visibility,createdAt:macro.createdAt,updatedAt:macro.updatedAt};}
function routeCreateRollMacro_(ctx){var p=ctx.params,tablegateId=String(p.tablegateId||'');requireMember_(tablegateId,ctx.user.id);var systemId=String(p.systemId||requireTablegate_(tablegateId).primarySystemId||'sys_tablegate_generic');requireGameSystem_(systemId,ctx.user.id,tablegateId);var now=nowIso_(),macro=insert_('RollMacros',{id:id_('mac'),tablegateId:tablegateId,systemId:systemId,ownerId:ctx.user.id,name:text_(p.name,120),description:nullableText_(p.description,1000),mechanicJson:jsonCell_(p.mechanic,{engine:'MANUAL'},'mechanic'),visibility:enumValue_(p.visibility||'TABLEGATE',TABLEGATE.CONTENT_VISIBILITIES,'TABLEGATE','visibility'),createdAt:now,updatedAt:now,deletedAt:''});return publicMacro_(macro);}
function routeListRollMacros_(ctx){var tablegateId=String(ctx.params.tablegateId||'');requireMember_(tablegateId,ctx.user.id);return filter_('RollMacros',function(m){return m.tablegateId===tablegateId&&canReadMacro_(m,ctx.user.id);}).map(publicMacro_);}
function routeUpdateRollMacro_(ctx){var macro=byId_('RollMacros',ctx.params.macroId,true);if(!macro||!canReadMacro_(macro,ctx.user.id)||!canManageOwnedOrTablegate_(macro,ctx.user.id,PERMISSIONS.MANAGE_SYSTEMS))throw new ApiError_('MACRO_NOT_FOUND','Roll macro not found or not editable.');var p=ctx.params,patch={updatedAt:nowIso_()};if(p.name!==undefined)patch.name=text_(p.name,120);if(p.description!==undefined)patch.description=nullableText_(p.description,1000);if(p.mechanic!==undefined)patch.mechanicJson=jsonCell_(p.mechanic,{},'mechanic');if(p.visibility!==undefined)patch.visibility=enumValue_(p.visibility,TABLEGATE.CONTENT_VISIBILITIES,'TABLEGATE','visibility');updateRow_('RollMacros',macro._row,patch);return publicMacro_(byId_('RollMacros',macro.id,true));}
function routeDeleteRollMacro_(ctx){var macro=byId_('RollMacros',ctx.params.macroId,true);if(!macro||!canManageOwnedOrTablegate_(macro,ctx.user.id,PERMISSIONS.MANAGE_SYSTEMS))throw new ApiError_('MACRO_NOT_FOUND','Roll macro not found or not editable.');updateRow_('RollMacros',macro._row,{deletedAt:nowIso_(),updatedAt:nowIso_()});return {deleted:true,macroId:macro.id};}

function randomDie_(sides){return secureRandomInt_(sides)+1;}
function resolveDicePool_(m){var count=int_(m.count,1,1,TABLEGATE.MAX_MECHANIC_DICE),sides=int_(m.sides,6,2,1000),target=m.target===undefined?null:num_(m.target,0),mode=String(m.successMode||'GTE').toUpperCase(),explodeAt=int_(m.explodeAt,0,0,sides),explodeLimit=int_(m.explodeLimit,20,0,100),reroll=array_(m.rerollValues).map(Number),rolls=[];for(var i=0;i<count;i++){var r=randomDie_(sides),chain=[r],guard=0;while(reroll.indexOf(r)!==-1&&guard++<20){r=randomDie_(sides);chain.push(r);}while(explodeAt&&r>=explodeAt&&guard++<explodeLimit){r=randomDie_(sides);chain.push(r);}rolls.push({values:chain,total:chain.reduce(function(a,b){return a+b;},0),face:chain[chain.length-1]});}var keep=String(m.keep||'ALL').toUpperCase(),keepCount=int_(m.keepCount,count,1,count),sorted=rolls.slice().sort(function(a,b){return a.total-b.total;});var kept=keep==='HIGHEST'?sorted.slice(-keepCount):(keep==='LOWEST'?sorted.slice(0,keepCount):rolls);var successes=null;if(target!==null)successes=kept.reduce(function(total,r){var ok=mode==='LTE'?r.face<=target:(mode==='EQ'?r.face===target:r.face>=target);return total+(ok?1:0);},0);return {engine:'DICE_POOL',count:count,sides:sides,rolls:rolls,kept:kept,total:kept.reduce(function(a,r){return a+r.total;},0),successes:successes,target:target,successMode:mode};}
function resolveFudge_(m){var count=int_(m.count,4,1,100),faces=[-1,0,1],rolls=[];for(var i=0;i<count;i++)rolls.push(faces[secureRandomInt_(3)]);return {engine:'FUDGE',rolls:rolls,total:rolls.reduce(function(a,b){return a+b;},0)};}
function resolvePercentile_(m){var roll=randomDie_(100),bonusPenalty=int_(m.bonusPenaltyDice,0,-5,5),ones=roll%10,tens=Math.floor((roll===100?0:roll)/10),tensRolls=[tens];for(var i=0;i<Math.abs(bonusPenalty);i++)tensRolls.push(secureRandomInt_(10));var chosen=bonusPenalty>0?Math.min.apply(null,tensRolls):(bonusPenalty<0?Math.max.apply(null,tensRolls):tens);var final=chosen*10+ones;if(final===0)final=100;return {engine:'PERCENTILE',initial:roll,bonusPenaltyDice:bonusPenalty,tensRolls:tensRolls,ones:ones,total:final};}
function resolveDualDice_(m){var dice=Array.isArray(m.dice)&&m.dice.length?m.dice:[{label:'Die A',sides:12},{label:'Die B',sides:12}],rolls=dice.slice(0,10).map(function(d){return {label:nullableText_(d.label,40)||'Die',sides:int_(d.sides,12,2,1000),value:0};});rolls.forEach(function(r){r.value=randomDie_(r.sides);});var modifier=num_(m.modifier,0),total=rolls.reduce(function(a,r){return a+r.value;},0)+modifier,dominant=rolls.slice().sort(function(a,b){return b.value-a.value;})[0];return {engine:'DUAL_DICE',rolls:rolls,modifier:modifier,total:total,dominant:dominant,tie:rolls.length>1&&rolls.every(function(r){return r.value===rolls[0].value;})};}
function resolveCustomFaces_(m){var faces=array_(m.faces);if(!faces.length)throw new ApiError_('INVALID_MECHANIC','CUSTOM_FACES requires a non-empty faces array.');if(faces.length>1000)throw new ApiError_('INVALID_MECHANIC','Custom die has too many faces.');var count=int_(m.count,1,1,200),rolls=[];for(var i=0;i<count;i++)rolls.push(clone_(faces[secureRandomInt_(faces.length)]));var numeric=rolls.every(function(x){return typeof x==='number'&&isFinite(x);});return {engine:'CUSTOM_FACES',faces:faces.length,rolls:rolls,total:numeric?rolls.reduce(function(a,b){return a+b;},0):null};}
function resolveCardDraw_(m){var deck=array_(m.deck);if(!deck.length)throw new ApiError_('INVALID_MECHANIC','CARD_DRAW requires a deck array.');var count=int_(m.count,1,1,Math.min(100,deck.length||1)),withReplacement=bool_(m.withReplacement),pool=deck.slice(),draws=[];for(var i=0;i<count;i++){if(!pool.length)break;var index=secureRandomInt_(pool.length);draws.push(clone_(pool[index]));if(!withReplacement)pool.splice(index,1);}return {engine:'CARD_DRAW',draws:draws,remaining:withReplacement?deck.length:pool.length,withReplacement:withReplacement};}
function resolveTableLookup_(m){var parsed=parseDiceExpression_(m.expression||'1d100'),rolled=rollDice_(parsed),ranges=Array.isArray(m.ranges)?m.ranges:[],match=null;for(var i=0;i<ranges.length;i++){var r=ranges[i],min=num_(r.min,-Infinity),max=num_(r.max,Infinity);if(rolled.total>=min&&rolled.total<=max){match=clone_(r.result!==undefined?r.result:r);break;}}return {engine:'TABLE_LOOKUP',expression:parsed.expression,roll:rolled,total:rolled.total,result:match};}
function resolveMechanicDefinition_(mechanic){var m=jsonValue_(mechanic,{},'mechanic'),engine=enumValue_(m.engine||m.type||'MANUAL',TABLEGATE.MECHANIC_ENGINES,'MANUAL','mechanic engine');if(engine==='DICE_EXPRESSION'){var parsed=parseDiceExpression_(m.expression||m.dice||'1d20'),rolled=rollDice_(parsed);return {engine:engine,expression:parsed.expression,total:rolled.total,detail:rolled.detail};}if(engine==='DICE_POOL')return resolveDicePool_(m);if(engine==='FUDGE')return resolveFudge_(m);if(engine==='PERCENTILE')return resolvePercentile_(m);if(engine==='DUAL_DICE')return resolveDualDice_(m);if(engine==='CUSTOM_FACES')return resolveCustomFaces_(m);if(engine==='CARD_DRAW')return resolveCardDraw_(m);if(engine==='TABLE_LOOKUP')return resolveTableLookup_(m);if(engine==='MANUAL'||engine==='CUSTOM')return {engine:engine,total:m.total===undefined?null:m.total,value:m.value===undefined?null:clone_(m.value),detail:clone_(m.detail||{}),requiresExternalResolution:engine==='CUSTOM'&&m.total===undefined&&m.value===undefined};throw new ApiError_('INVALID_MECHANIC','Unsupported mechanic engine.');}
function formatMechanicResult_(label,result){var prefix=label?label+': ':'';if(result.total!==null&&result.total!==undefined)return prefix+'**'+result.total+'** ('+result.engine+')';if(result.value!==null&&result.value!==undefined)return prefix+'**'+String(result.value)+'** ('+result.engine+')';if(result.draws)return prefix+result.draws.map(function(x){return typeof x==='string'?x:JSON.stringify(x);}).join(', ')+' ('+result.engine+')';return prefix+'Mechanic resolved ('+result.engine+')';}
function routeResolveMechanic_(ctx){var p=ctx.params,channel=p.channelId?requireChannel_(p.channelId,ctx.user.id):null,tablegateId=channel?channel.tablegateId:String(p.tablegateId||'');requireMember_(tablegateId,ctx.user.id);requirePermission_(tablegateId,ctx.user.id,PERMISSIONS.USE_MECHANICS);var macro=null,mechanic=p.mechanic;if(p.macroId){macro=byId_('RollMacros',p.macroId,true);if(!macro||!canReadMacro_(macro,ctx.user.id))throw new ApiError_('MACRO_NOT_FOUND','Roll macro not found.');mechanic=parseJsonCell_(macro.mechanicJson,{});}if(mechanic===undefined)throw new ApiError_('MECHANIC_REQUIRED','Provide mechanic JSON or macroId.');var systemId=String(p.systemId||(macro&&macro.systemId)||requireTablegate_(tablegateId).primarySystemId||'sys_tablegate_generic');requireGameSystem_(systemId,ctx.user.id,tablegateId);var personaId=String(p.personaId||''),characterId=String(p.characterId||'');if(personaId){var persona=requirePersona_(personaId,ctx.user.id);if(persona.tablegateId!==tablegateId)throw new ApiError_('INVALID_PERSONA','Persona belongs to another Tablegate.');}if(characterId){var character=requireCharacter_(characterId,ctx.user.id);if(character.tablegateId!==tablegateId)throw new ApiError_('INVALID_CHARACTER','Character belongs to another Tablegate.');}var request=jsonValue_(mechanic,{},'mechanic'),result=resolveMechanicDefinition_(request),now=nowIso_(),label=nullableText_(p.label,200),record=insert_('MechanicRolls',{id:id_('mrl'),tablegateId:tablegateId,channelId:channel?channel.id:'',userId:ctx.user.id,personaId:personaId,characterId:characterId,systemId:systemId,macroId:macro?macro.id:'',engine:result.engine,label:label,requestJson:jsonCell_(request,{},'mechanic request'),resultJson:jsonCell_(result,{},'mechanic result'),messageId:'',createdAt:now}),message=null;if(channel&&(p.postMessage===undefined||bool_(p.postMessage))){message=routeSendMessage_({params:{scopeType:'CHANNEL',scopeId:channel.id,content:formatMechanicResult_(label,result),messageType:'ROLL',personaId:personaId,attachmentIds:[]},user:ctx.user,session:ctx.session});updateRow_('MechanicRolls',record._row,{messageId:message.id});}audit_(tablegateId,ctx.user.id,'MECHANIC_RESOLVED','MECHANIC_ROLL',record.id,{engine:result.engine,systemId:systemId});return {id:record.id,tablegateId:tablegateId,channelId:record.channelId,userId:ctx.user.id,personaId:personaId,characterId:characterId,systemId:systemId,macroId:record.macroId,engine:result.engine,label:label,request:request,result:result,message:message,createdAt:now};}
function routeListMechanicRolls_(ctx){var tablegateId=String(ctx.params.tablegateId||''),channelId=String(ctx.params.channelId||'');if(channelId)tablegateId=requireChannel_(channelId,ctx.user.id).tablegateId;else requireMember_(tablegateId,ctx.user.id);return filter_('MechanicRolls',function(r){return r.tablegateId===tablegateId&&(!channelId||r.channelId===channelId);}).sort(function(a,b){return new Date(b.createdAt)-new Date(a.createdAt);}).slice(0,int_(ctx.params.limit,50,1,100)).map(function(r){return {id:r.id,tablegateId:r.tablegateId,channelId:r.channelId||'',userId:r.userId,personaId:r.personaId||'',characterId:r.characterId||'',systemId:r.systemId||'',macroId:r.macroId||'',engine:r.engine,label:r.label||'',request:parseJsonCell_(r.requestJson,{}),result:parseJsonCell_(r.resultJson,{}),messageId:r.messageId||'',createdAt:r.createdAt};});}

function buildTablegateRulesContext_(tablegateId,userId,characterId){
  if(!tablegateId)return null;var tablegate=requireMember_(tablegateId,userId).tablegate,links=filter_('TablegateSystems',function(link){return link.tablegateId===tablegateId&&!link.deletedAt&&bool_(link.enabled);}).map(function(link){var system=byId_('GameSystems',link.systemId,true);return {link:publicTablegateSystem_(link),system:publicGameSystem_(system),documents:listSystemDocuments_(link.systemId,tablegateId,userId)};});var homebrew=filter_('HomebrewContent',function(item){return item.tablegateId===tablegateId&&item.status==='ACTIVE'&&canReadHomebrew_(item,userId);}).slice(0,50).map(function(item){return {id:item.id,systemId:item.systemId,contentType:item.contentType,name:item.name,version:item.version||'',tags:parseJsonCell_(item.tagsJson,[]),data:parseJsonCell_(item.dataJson,{})};});var character=null;if(characterId){try{character=publicCharacter_(requireCharacter_(characterId,userId),userId);}catch(e){character=null;}}return {tablegate:{id:tablegate.id,name:tablegate.name,description:tablegate.description||'',primarySystemId:tablegate.primarySystemId||'',systemMode:tablegate.systemMode||'SYSTEM_AGNOSTIC',systemConfig:parseJsonCell_(tablegate.systemConfigJson,{}),houseRules:parseJsonCell_(tablegate.houseRulesJson,{}),safetyTools:parseJsonCell_(tablegate.safetyToolsJson,{})},systems:links,homebrew:homebrew,character:character};
}

/* =============================
 * AI BACKEND INTEGRATION
 * =============================
 * The deployed web-app endpoint is used at runtime. The Apps Script library
 * metadata is exposed for project setup/documentation; Apps Script libraries
 * themselves must still be added in Project Settings > Libraries.
 */

function getAiBackendUrl_() {
  var url = String(PropertiesService.getScriptProperties().getProperty(TABLEGATE.AI_BACKEND_URL_PROPERTY) || TABLEGATE.DEFAULT_AI_BACKEND_URL).trim();
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec(?:\?.*)?$/.test(url)) {
    throw new ApiError_('AI_NOT_CONFIGURED', 'The AI backend URL is missing or invalid.');
  }
  return url;
}

function sanitizeAiPayload_(params) {
  var blocked = {token:true, password:true, currentPassword:true, newPassword:true, base64:true, data:true};
  var payload = {};
  Object.keys(params || {}).forEach(function(key) {
    if (key === 'action' || blocked[key]) return;
    payload[key] = params[key];
  });
  return payload;
}

function callAiBackend_(ctx, aiAction, payload) {
  var timeout = int_(PropertiesService.getScriptProperties().getProperty(TABLEGATE.AI_TIMEOUT_MS_PROPERTY), TABLEGATE.DEFAULT_AI_TIMEOUT_MS, 1000, 30000);
  var requestBody = {
    action: String(aiAction || 'chat'),
    payload: payload || {},
    tablegateContext: {
      user: publicUser_(ctx.user),
      tablegateId: String(ctx.params.tablegateId || ''),
      channelId: String(ctx.params.channelId || ''),
      dmId: String(ctx.params.dmId || ''),
      personaId: String(ctx.params.personaId || ''),
      characterId: String(ctx.params.characterId || ''),
      requestId: id_('air'),
      requestedAt: nowIso_(),
      source: 'TABLEGATE',
      rules: null
    }
  };

  if (requestBody.tablegateContext.tablegateId) {
    requireMember_(requestBody.tablegateContext.tablegateId, ctx.user.id);
    requestBody.tablegateContext.rules = buildTablegateRulesContext_(requestBody.tablegateContext.tablegateId, ctx.user.id, requestBody.tablegateContext.characterId);
  }
  if (requestBody.tablegateContext.channelId) requireChannel_(requestBody.tablegateContext.channelId, ctx.user.id);
  if (requestBody.tablegateContext.dmId) requireDm_(requestBody.tablegateContext.dmId, ctx.user.id);

  var response;
  try {
    response = UrlFetchApp.fetch(getAiBackendUrl_(), {
      method: 'post',
      contentType: 'text/plain; charset=utf-8',
      payload: JSON.stringify(requestBody),
      muteHttpExceptions: true,
      followRedirects: true
    });
  } catch (err) {
    throw new ApiError_('AI_BACKEND_UNREACHABLE', 'The AI backend could not be reached.', String(err && err.message ? err.message : err));
  }

  var status = response.getResponseCode();
  var text = response.getContentText();
  var parsed;
  try { parsed = JSON.parse(text); } catch (e) { parsed = {ok: status >= 200 && status < 300, text: text}; }
  if (status < 200 || status >= 300 || parsed.ok === false) {
    throw new ApiError_('AI_BACKEND_ERROR', 'The AI backend returned an error.', {status:status,response:parsed,timeoutMs:timeout});
  }
  return {backend: parsed, status: status, requestId: requestBody.tablegateContext.requestId};
}

function routeAiRequest_(ctx) {
  var aiAction = nullableText_(ctx.params.aiAction || ctx.params.operation || 'chat', 80) || 'chat';
  var payload = ctx.params.payload !== undefined ? parseJsonCell_(ctx.params.payload, ctx.params.payload) : sanitizeAiPayload_(ctx.params);
  return callAiBackend_(ctx, aiAction, payload);
}

function routeAiChat_(ctx) {
  var message = text_(ctx.params.message || ctx.params.prompt, TABLEGATE.MAX_MESSAGE_LENGTH);
  var history = ctx.params.history !== undefined ? parseJsonCell_(ctx.params.history, []) : [];
  if (!Array.isArray(history)) throw new ApiError_('VALIDATION_ERROR', 'AI chat history must be an array.');
  return callAiBackend_(ctx, 'chat', {
    message: message,
    history: history.slice(-50),
    systemPrompt: nullableText_(ctx.params.systemPrompt, 12000),
    character: ctx.params.character !== undefined ? parseJsonCell_(ctx.params.character, ctx.params.character) : null,
    metadata: ctx.params.metadata !== undefined ? parseJsonCell_(ctx.params.metadata, ctx.params.metadata) : {}
  });
}

function routeAiHealth_(ctx) {
  return callAiBackend_(ctx, 'health', {});
}

/* =============================
 * TABLEGATE V3 CAPABILITY LAYER
 * =============================
 * This layer adds durable AI conversations, scoped memory, knowledge/file
 * retrieval, citations, email verification and password recovery, organized
 * assets and projects, provider integrations, painterly/interactive map data,
 * NPC and transit simulation, statistics, and auditable randomization.
 *
 * External inference, image generation, image/web search, and difficult binary
 * parsing are delegated to the configured AI backend or an allowlisted provider.
 * Apps Script remains the authorization, persistence, orchestration, validation,
 * email, Drive, GeoJSON, simulation, and audit layer.
 */

var TABLEGATE_CAPABILITIES_ = Object.freeze([
  'ai-conversations','durable-conversation-history','scoped-memory','retrieval-augmented-context',
  'knowledge-sources','file-citations','web-citations','personality-profiles','learning-feedback',
  'web-search-proxy','image-search-proxy','image-generation-proxy','reference-guided-generation',
  'local-text-json-csv-google-file-parsing','external-pdf-office-image-parsing',
  'asset-folders','asset-indexing','project-workspaces','project-compilation',
  'geojson-validation','interactive-map-projects','painterly-map-generation-proxy',
  'npc-schedules','npc-relationships','life-simulation-ticks','transit-routes','transit-tracking',
  'email-verification','password-reset-codes','expiring-auth-challenges',
  'statistics','secure-randomization','dice','configured-integrations','webrtc-signaling'
]);

function propertyBool_(name, fallback) {
  var raw = PropertiesService.getScriptProperties().getProperty(name);
  if (raw === null || raw === undefined || raw === '') return !!fallback;
  return bool_(raw);
}

function emailVerificationRequired_() {
  return propertyBool_(TABLEGATE.EMAIL_VERIFICATION_REQUIRED_PROPERTY, true);
}

function emailVerified_(user) {
  if (!user) return false;
  if (user.emailVerified === '' || user.emailVerified === null || user.emailVerified === undefined) return true; // legacy accounts
  return bool_(user.emailVerified);
}

function secureRandomInt_(maxExclusive) {
  maxExclusive = int_(maxExclusive, 0, 1, 2147483647);
  var range = 4294967296;
  var limit = range - (range % maxExclusive);
  var value;
  do {
    var seed = randomToken_(2) + '|' + Date.now();
    var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, seed, Utilities.Charset.UTF_8);
    value = (((bytes[0] + 256) % 256) * 16777216) +
            (((bytes[1] + 256) % 256) * 65536) +
            (((bytes[2] + 256) % 256) * 256) +
            ((bytes[3] + 256) % 256);
  } while (value >= limit);
  return value % maxExclusive;
}

function randomUnit_() {
  return secureRandomInt_(1000000000) / 1000000000;
}

function randomNumericCode_(digits) {
  digits = int_(digits, 6, 4, 9);
  var max = Math.pow(10, digits);
  return ('000000000' + secureRandomInt_(max)).slice(-digits);
}

function safeJsonStringify_(value, fallback) {
  try { return JSON.stringify(value); } catch (e) { return JSON.stringify(fallback === undefined ? {} : fallback); }
}

function clamp_(value, min, max) {
  value = num_(value, min);
  return Math.max(min, Math.min(max, value));
}

function requireGlobalOwner_(userId) {
  var active = filter_('Users', function(u) { return !bool_(u.disabled); }).sort(function(a,b){return new Date(a.createdAt)-new Date(b.createdAt);});
  if (!active.length || active[0].id !== userId) throw new ApiError_('GLOBAL_OWNER_REQUIRED', 'Only the first active Tablegate account may perform this global operation.');
  return active[0];
}

/* ---------- Email verification and password recovery ---------- */

function activeAuthChallenges_(email, type) {
  email = lower_(email);
  return filter_('AuthChallenges', function(c) {
    return lower_(c.email) === email && c.type === type && !c.usedAt && isFuture_(c.expiresAt);
  }).sort(function(a,b){return new Date(b.createdAt)-new Date(a.createdAt);});
}

function ensureChallengeRateLimit_(email, type) {
  var cutoff = Date.now() - 60 * 60 * 1000;
  var recent = filter_('AuthChallenges', function(c) {
    return lower_(c.email) === lower_(email) && c.type === type && new Date(c.createdAt).getTime() >= cutoff;
  });
  if (recent.length >= 5) throw new ApiError_('TOO_MANY_REQUESTS', 'Too many codes were requested. Try again later.');
}

function ensureEmailQuota_() {
  if (MailApp.getRemainingDailyQuota() < 1) throw new ApiError_('EMAIL_QUOTA_EXHAUSTED', 'The server cannot send another email today. Contact the Tablegate administrator.');
}

function createAuthChallenge_(user, type, minutes, metadata) {
  ensureChallengeRateLimit_(user.email, type);
  activeAuthChallenges_(user.email, type).forEach(function(c){ updateRow_('AuthChallenges', c._row, {usedAt:nowIso_()}); });
  var code = randomNumericCode_(6);
  var token = randomToken_(4);
  var now = nowIso_();
  var row = insert_('AuthChallenges', {
    id:id_('ach'), userId:user.id, email:user.email, type:type,
    codeHash:sha256Hex_(code), tokenHash:sha256Hex_(token),
    createdAt:now, expiresAt:addMsIso_(minutes * 60000), usedAt:'', attempts:0,
    requestedIp:'', userAgent:'', metadataJson:safeJsonStringify_(metadata || {})
  });
  return {row:row, code:code, token:token};
}

function challengeLink_(type, email, token) {
  var base = String(PropertiesService.getScriptProperties().getProperty(TABLEGATE.PUBLIC_APP_URL_PROPERTY) || '').trim();
  if (!base) return '';
  var separator = base.indexOf('?') === -1 ? '?' : '&';
  return base + separator + 'authAction=' + encodeURIComponent(type) + '&email=' + encodeURIComponent(email) + '&token=' + encodeURIComponent(token);
}

function sendAuthChallengeEmail_(user, type, challenge) {
  ensureEmailQuota_();
  var appName = PropertiesService.getScriptProperties().getProperty(TABLEGATE.APP_NAME_PROPERTY) || 'Tablegate';
  var isVerify = type === 'VERIFY_EMAIL';
  var subject = isVerify ? ('Verify your ' + appName + ' email') : ('Reset your ' + appName + ' password');
  var minutes = isVerify ? int_(PropertiesService.getScriptProperties().getProperty(TABLEGATE.EMAIL_CODE_MINUTES_PROPERTY), 30, 5, 1440) : int_(PropertiesService.getScriptProperties().getProperty(TABLEGATE.RESET_CODE_MINUTES_PROPERTY), 15, 5, 1440);
  var link = challengeLink_(isVerify ? 'verifyEmail' : 'resetPassword', user.email, challenge.token);
  var actionText = isVerify ? 'verify your email address' : 'reset your password';
  var body = 'Use this one-time code to ' + actionText + ': ' + challenge.code + '\n\nThe code expires in ' + minutes + ' minutes.' + (link ? ('\n\nOr open: ' + link) : '') + '\n\nIf you did not request this, you can ignore this email.';
  var html = '<p>Use this one-time code to ' + actionText + ':</p><p style="font-size:26px;font-weight:bold;letter-spacing:4px">' + challenge.code + '</p><p>The code expires in ' + minutes + ' minutes.</p>' + (link ? ('<p><a href="' + link.replace(/&/g,'&amp;') + '">Continue securely</a></p>') : '') + '<p>If you did not request this, you can ignore this email.</p>';
  MailApp.sendEmail({to:user.email, subject:subject, body:body, htmlBody:html, name:appName});
}

function validateAuthChallenge_(email, type, code, token) {
  var challenges = activeAuthChallenges_(email, type);
  if (!challenges.length) throw new ApiError_('CODE_EXPIRED', 'The code is invalid or expired. Request a new one.');
  var candidate = challenges[0];
  var attempts = int_(candidate.attempts, 0, 0, 1000);
  if (attempts >= TABLEGATE.AUTH_CHALLENGE_MAX_ATTEMPTS) {
    updateRow_('AuthChallenges', candidate._row, {usedAt:nowIso_()});
    throw new ApiError_('TOO_MANY_ATTEMPTS', 'Too many attempts. Request a new code.');
  }
  var valid = false;
  if (token) valid = constantTimeEqual_(sha256Hex_(String(token)), candidate.tokenHash);
  if (!valid && code) valid = constantTimeEqual_(sha256Hex_(String(code).trim()), candidate.codeHash);
  if (!valid) {
    updateRow_('AuthChallenges', candidate._row, {attempts:attempts + 1});
    throw new ApiError_('INVALID_CODE', 'The code or link is invalid.');
  }
  updateRow_('AuthChallenges', candidate._row, {usedAt:nowIso_(), attempts:attempts + 1});
  return candidate;
}

function routeRequestEmailVerification_(ctx) {
  var email = validateEmail_(ctx.params.email);
  var user = findOne_('Users', function(u){return lower_(u.email) === email && !bool_(u.disabled);});
  if (user && !emailVerified_(user)) {
    var minutes = int_(PropertiesService.getScriptProperties().getProperty(TABLEGATE.EMAIL_CODE_MINUTES_PROPERTY), 30, 5, 1440);
    var challenge = createAuthChallenge_(user, 'VERIFY_EMAIL', minutes, {});
    sendAuthChallengeEmail_(user, 'VERIFY_EMAIL', challenge);
  }
  return {requested:true, message:'If that account needs verification, a new code has been sent.'};
}

function routeVerifyEmail_(ctx) {
  var email = validateEmail_(ctx.params.email);
  var user = findOne_('Users', function(u){return lower_(u.email) === email && !bool_(u.disabled);});
  if (!user) throw new ApiError_('INVALID_CODE', 'The code or link is invalid.');
  if (emailVerified_(user)) return {verified:true, alreadyVerified:true};
  validateAuthChallenge_(email, 'VERIFY_EMAIL', ctx.params.code || ctx.params.verificationCode, ctx.params.token);
  updateRow_('Users', user._row, {emailVerified:true, emailVerifiedAt:nowIso_(), failedLoginCount:0, lockedUntil:'', updatedAt:nowIso_()});
  var refreshed = byId_('Users', user.id, true);
  var session = createSession_(user.id, ctx.params.userAgent);
  return {verified:true, alreadyVerified:false, user:privateUser_(refreshed), token:session.token, session:session.session};
}

function routeForgotPassword_(ctx) {
  var email = validateEmail_(ctx.params.email);
  var user = findOne_('Users', function(u){return lower_(u.email) === email && !bool_(u.disabled);});
  if (user) {
    var minutes = int_(PropertiesService.getScriptProperties().getProperty(TABLEGATE.RESET_CODE_MINUTES_PROPERTY), 15, 5, 1440);
    var challenge = createAuthChallenge_(user, 'RESET_PASSWORD', minutes, {});
    sendAuthChallengeEmail_(user, 'RESET_PASSWORD', challenge);
  }
  return {requested:true, message:'If an account uses that email, a reset code has been sent.'};
}

function routeResetPassword_(ctx) {
  var email = validateEmail_(ctx.params.email);
  var password = validatePassword_(ctx.params.newPassword || ctx.params.password);
  var user = findOne_('Users', function(u){return lower_(u.email) === email && !bool_(u.disabled);});
  if (!user) throw new ApiError_('INVALID_CODE', 'The code or link is invalid.');
  validateAuthChallenge_(email, 'RESET_PASSWORD', ctx.params.code || ctx.params.resetCode, ctx.params.token);
  var salt = randomCode_(24);
  var now = nowIso_();
  updateRow_('Users', user._row, {passwordSalt:salt, passwordHash:hashPassword_(password, salt), failedLoginCount:0, lockedUntil:'', updatedAt:now});
  filter_('Sessions', function(s){return s.userId === user.id && !s.revokedAt;}).forEach(function(s){updateRow_('Sessions', s._row, {revokedAt:now});});
  return {reset:true};
}

/* ---------- Attachment helpers, parsing, and asset organization ---------- */

function getAttachmentBlob_(attachment, userId) {
  requireAttachmentAccess_(attachment.id, userId, attachment.tablegateId || '', attachment.dmId || '');
  try { return DriveApp.getFileById(attachment.fileId).getBlob(); }
  catch (e) { throw new ApiError_('FILE_MISSING', 'Stored file is missing.'); }
}

function createAttachmentFromBlob_(ctx, blob, options) {
  options = options || {};
  var bytes = blob.getBytes();
  var max = int_(PropertiesService.getScriptProperties().getProperty(TABLEGATE.MAX_UPLOAD_PROPERTY), TABLEGATE.DEFAULT_MAX_UPLOAD_BYTES, 1024, 50 * 1024 * 1024);
  if (bytes.length > max) throw new ApiError_('FILE_TOO_LARGE', 'Maximum attachment size is ' + max + ' bytes.');
  var name = safeFileName_(options.fileName || blob.getName() || 'asset');
  var mime = nullableText_(options.mimeType || blob.getContentType(), 150) || 'application/octet-stream';
  var tablegateId = String(options.tablegateId || '');
  var dmId = String(options.dmId || '');
  if (tablegateId) requireMember_(tablegateId, ctx.user.id);
  if (dmId) requireDm_(dmId, ctx.user.id);
  var aid = id_('att');
  var stored = aid + '_' + name;
  blob.setName(stored).setContentType(mime);
  var file = uploadFolder_().createFile(blob);
  var row = insert_('Attachments', {
    id:aid, ownerId:ctx.user.id, tablegateId:tablegateId, dmId:dmId,
    scopeType:String(options.scopeType || ''), scopeId:String(options.scopeId || ''), messageId:'',
    fileId:file.getId(), originalName:name, storedName:stored, mimeType:mime,
    sizeBytes:bytes.length, sha256:sha256Hex_(Utilities.base64Encode(bytes)), createdAt:nowIso_(), deletedAt:''
  });
  return row;
}

function createAttachmentFromBase64_(ctx, asset, options) {
  asset = asset || {};
  var raw = String(asset.base64 || asset.data || '').replace(/^data:[^;]+;base64,/, '');
  if (!raw) throw new ApiError_('INVALID_PROVIDER_ASSET', 'A provider returned an asset without base64 data.');
  var bytes;
  try { bytes = Utilities.base64Decode(raw); } catch (e) { throw new ApiError_('INVALID_PROVIDER_ASSET', 'A provider returned invalid base64 data.'); }
  var blob = Utilities.newBlob(bytes, asset.mimeType || (options && options.mimeType) || 'application/octet-stream', asset.fileName || asset.name || (options && options.fileName) || 'generated-asset');
  return createAttachmentFromBlob_(ctx, blob, options || {});
}

function indexAttachment_(attachment, ctx, options) {
  options = options || {};
  var existing = findOne_('AssetIndex', function(a){return a.attachmentId === attachment.id && !a.deletedAt;});
  var data = {
    ownerId:ctx.user.id, tablegateId:String(options.tablegateId || attachment.tablegateId || ''),
    folderId:String(options.folderId || ''), assetType:String(options.assetType || 'FILE').toUpperCase(),
    title:nullableText_(options.title || attachment.originalName, 180), tagsJson:jsonCell_(options.tags, [], 'asset tags'),
    metadataJson:jsonCell_(options.metadata, {}, 'asset metadata'), updatedAt:nowIso_(), deletedAt:''
  };
  if (existing) { updateRow_('AssetIndex', existing._row, data); return byId_('AssetIndex', existing.id, true); }
  data.id = id_('ast'); data.attachmentId = attachment.id; data.createdAt = nowIso_();
  return insert_('AssetIndex', data);
}

function publicAsset_(row) {
  var attachment = byId_('Attachments', row.attachmentId, true);
  return {id:row.id, attachment:attachment ? publicAttachment_(attachment) : null, ownerId:row.ownerId, tablegateId:row.tablegateId || '', folderId:row.folderId || '', assetType:row.assetType, title:row.title, tags:parseJsonCell_(row.tagsJson, []), metadata:parseJsonCell_(row.metadataJson, {}), createdAt:row.createdAt, updatedAt:row.updatedAt};
}

function requireAssetFolder_(folderId, userId) {
  var folder = byId_('AssetFolders', folderId, true);
  if (!folder || folder.deletedAt) throw new ApiError_('ASSET_FOLDER_NOT_FOUND', 'Asset folder not found.');
  if (folder.ownerId !== userId) {
    if (!folder.tablegateId) throw new ApiError_('FORBIDDEN', 'You cannot access this asset folder.');
    requirePermission_(folder.tablegateId, userId, PERMISSIONS.MANAGE_HANDOUTS);
  }
  return folder;
}

function routeCreateAssetFolder_(ctx) {
  var p = ctx.params;
  var tablegateId = String(p.tablegateId || '');
  if (tablegateId) requireMember_(tablegateId, ctx.user.id);
  var parent = p.parentId ? requireAssetFolder_(String(p.parentId), ctx.user.id) : null;
  var parentDrive = parent ? DriveApp.getFolderById(parent.driveFolderId) : uploadFolder_();
  var driveFolder = parentDrive.createFolder(safeFileName_(p.name));
  var now = nowIso_();
  var folder = insert_('AssetFolders', {id:id_('afl'), ownerId:ctx.user.id, tablegateId:tablegateId, parentId:parent ? parent.id : '', name:text_(p.name, 120), driveFolderId:driveFolder.getId(), createdAt:now, updatedAt:now, deletedAt:''});
  return stripInternal_(folder);
}

function routeListAssetFolders_(ctx) {
  var tablegateId = String(ctx.params.tablegateId || '');
  if (tablegateId) requireMember_(tablegateId, ctx.user.id);
  return filter_('AssetFolders', function(f){return !f.deletedAt && (f.ownerId === ctx.user.id || (tablegateId && f.tablegateId === tablegateId));}).map(stripInternal_);
}

function routeOrganizeAttachment_(ctx) {
  var attachment = requireOwnedAttachment_(ctx.params.attachmentId, ctx.user.id);
  var folder = ctx.params.folderId ? requireAssetFolder_(String(ctx.params.folderId), ctx.user.id) : null;
  if (folder) {
    try { DriveApp.getFileById(attachment.fileId).moveTo(DriveApp.getFolderById(folder.driveFolderId)); }
    catch (e) { throw new ApiError_('DRIVE_MOVE_FAILED', 'The file could not be moved in Drive.', String(e && e.message ? e.message : e)); }
  }
  if (ctx.params.fileName !== undefined) {
    var newName = safeFileName_(ctx.params.fileName);
    DriveApp.getFileById(attachment.fileId).setName(newName);
    updateRow_('Attachments', attachment._row, {originalName:newName, storedName:newName});
    attachment = byId_('Attachments', attachment.id, true);
  }
  var asset = indexAttachment_(attachment, ctx, {folderId:folder ? folder.id : '', tablegateId:attachment.tablegateId, assetType:ctx.params.assetType, title:ctx.params.title, tags:ctx.params.tags, metadata:ctx.params.metadata});
  return publicAsset_(asset);
}

function routeListAssets_(ctx) {
  var tablegateId = String(ctx.params.tablegateId || '');
  if (tablegateId) requireMember_(tablegateId, ctx.user.id);
  var folderId = String(ctx.params.folderId || '');
  var type = String(ctx.params.assetType || '').toUpperCase();
  return filter_('AssetIndex', function(a){return !a.deletedAt && (a.ownerId === ctx.user.id || (tablegateId && a.tablegateId === tablegateId)) && (!folderId || a.folderId === folderId) && (!type || a.assetType === type);}).slice(0, int_(ctx.params.limit, 100, 1, 500)).map(publicAsset_);
}

function routeSearchAssets_(ctx) {
  var q = lower_(text_(ctx.params.query || ctx.params.q, 160));
  var tablegateId = String(ctx.params.tablegateId || '');
  if (tablegateId) requireMember_(tablegateId, ctx.user.id);
  return filter_('AssetIndex', function(a){
    if (a.deletedAt || !(a.ownerId === ctx.user.id || (tablegateId && a.tablegateId === tablegateId))) return false;
    return lower_(a.title + ' ' + a.assetType + ' ' + a.tagsJson + ' ' + a.metadataJson).indexOf(q) !== -1;
  }).slice(0, int_(ctx.params.limit, 50, 1, 200)).map(publicAsset_);
}

function parseAttachmentLocally_(attachment, blob) {
  var mime = lower_(attachment.mimeType || blob.getContentType());
  var name = lower_(attachment.originalName || '');
  var text;
  if (mime.indexOf('text/') === 0 || /\.(txt|md|json|csv|tsv|xml|html|htm|css|js|ts|geojson|yaml|yml)$/i.test(name)) {
    text = blob.getDataAsString('UTF-8');
    if (mime.indexOf('json') !== -1 || /\.(json|geojson)$/i.test(name)) {
      try { return {parser:'LOCAL_JSON', text:text, data:JSON.parse(text), metadata:{characters:text.length}}; }
      catch (e) { return {parser:'LOCAL_TEXT', text:text, warnings:['JSON parsing failed: ' + e.message], metadata:{characters:text.length}}; }
    }
    if (mime.indexOf('csv') !== -1 || /\.csv$/i.test(name)) {
      try { return {parser:'LOCAL_CSV', text:text, data:Utilities.parseCsv(text), metadata:{characters:text.length}}; }
      catch (e2) { return {parser:'LOCAL_TEXT', text:text, warnings:['CSV parsing failed: ' + e2.message], metadata:{characters:text.length}}; }
    }
    return {parser:'LOCAL_TEXT', text:text, metadata:{characters:text.length}};
  }
  if (mime === 'application/vnd.google-apps.document') {
    text = DocumentApp.openById(attachment.fileId).getBody().getText();
    return {parser:'GOOGLE_DOCS', text:text, metadata:{characters:text.length}};
  }
  if (mime === 'application/vnd.google-apps.spreadsheet') {
    var ss = SpreadsheetApp.openById(attachment.fileId), sheets = {};
    ss.getSheets().forEach(function(sh){sheets[sh.getName()] = sh.getDataRange().getDisplayValues();});
    return {parser:'GOOGLE_SHEETS', data:sheets, text:safeJsonStringify_(sheets, {}), metadata:{sheetCount:ss.getSheets().length}};
  }
  if (mime === 'application/vnd.google-apps.presentation' && typeof SlidesApp !== 'undefined') {
    var deck = SlidesApp.openById(attachment.fileId), slides = [];
    deck.getSlides().forEach(function(slide){var parts=[];slide.getPageElements().forEach(function(el){try{if(el.getPageElementType().toString()==='SHAPE')parts.push(el.asShape().getText().asString());}catch(e){}});slides.push(parts.join('\n'));});
    return {parser:'GOOGLE_SLIDES', data:slides, text:slides.join('\n\n'), metadata:{slideCount:slides.length}};
  }
  return null;
}

function routeParseAttachment_(ctx) {
  var attachment = byId_('Attachments', ctx.params.attachmentId, true);
  if (!attachment || attachment.deletedAt) throw new ApiError_('ATTACHMENT_NOT_FOUND', 'Attachment not found.');
  requireAttachmentAccess_(attachment.id, ctx.user.id, attachment.tablegateId || '', attachment.dmId || '');
  var nativeGoogleFile = lower_(attachment.mimeType).indexOf('application/vnd.google-apps.') === 0;
  var blob = nativeGoogleFile ? null : getAttachmentBlob_(attachment, ctx.user.id);
  var local = parseAttachmentLocally_(attachment, blob);
  if (local) return {attachment:publicAttachment_(attachment), result:local, external:false};
  if (!blob) blob = getAttachmentBlob_(attachment, ctx.user.id);
  var maxInline = int_(PropertiesService.getScriptProperties().getProperty(TABLEGATE.MAX_INLINE_AI_FILE_BYTES_PROPERTY), TABLEGATE.DEFAULT_MAX_INLINE_AI_FILE_BYTES, 1024, 10 * 1024 * 1024);
  if (blob.getBytes().length > maxInline) throw new ApiError_('FILE_TOO_LARGE_FOR_PARSER', 'This file must be parsed by a provider using a Drive URL or chunked upload.', {maxInlineBytes:maxInline});
  var wrapped = callAiBackend_(ctx, 'parseFile', {fileName:attachment.originalName, mimeType:attachment.mimeType, base64:Utilities.base64Encode(blob.getBytes()), instructions:nullableText_(ctx.params.instructions, 8000), outputFormat:nullableText_(ctx.params.outputFormat, 80) || 'structured'});
  return {attachment:publicAttachment_(attachment), result:unwrapProviderResult_(wrapped), external:true};
}

/* ---------- Personalities, memory, knowledge, citations, and conversations ---------- */

function publicPersonality_(p) { return {id:p.id, ownerId:p.ownerId, tablegateId:p.tablegateId || '', name:p.name, description:p.description || '', systemPrompt:p.systemPrompt || '', style:parseJsonCell_(p.styleJson, {}), visibility:p.visibility, createdAt:p.createdAt, updatedAt:p.updatedAt}; }

function canReadPersonality_(p, userId) {
  if (!p || p.deletedAt) return false;
  if (p.ownerId === userId || p.visibility === 'PUBLIC') return true;
  if (p.visibility === 'TABLEGATE' && p.tablegateId) { try { requireMember_(p.tablegateId, userId); return true; } catch(e){} }
  return false;
}

function requirePersonality_(id, userId) {
  var p = byId_('Personalities', id, true);
  if (!canReadPersonality_(p, userId)) throw new ApiError_('PERSONALITY_NOT_FOUND', 'Personality not found.');
  return p;
}

function routeCreatePersonality_(ctx) {
  var p = ctx.params, tablegateId = String(p.tablegateId || '');
  if (tablegateId) requireMember_(tablegateId, ctx.user.id);
  var now = nowIso_();
  var row = insert_('Personalities', {id:id_('prs'), ownerId:ctx.user.id, tablegateId:tablegateId, name:text_(p.name, 100), description:nullableText_(p.description, 2000), systemPrompt:text_(p.systemPrompt || p.instructions, 16000), styleJson:jsonCell_(p.style, {}, 'personality style'), visibility:enumValue_(p.visibility || (tablegateId ? 'TABLEGATE' : 'PRIVATE'), TABLEGATE.CONTENT_VISIBILITIES, 'PRIVATE', 'visibility'), createdAt:now, updatedAt:now, deletedAt:''});
  return publicPersonality_(row);
}

function routeListPersonalities_(ctx) { return filter_('Personalities', function(p){return canReadPersonality_(p, ctx.user.id);}).map(publicPersonality_); }

function routeUpdatePersonality_(ctx) {
  var p = requirePersonality_(ctx.params.personalityId, ctx.user.id);
  if (p.ownerId !== ctx.user.id) throw new ApiError_('FORBIDDEN', 'Only the personality owner may edit it.');
  var patch = {updatedAt:nowIso_()};
  if (ctx.params.name !== undefined) patch.name = text_(ctx.params.name, 100);
  if (ctx.params.description !== undefined) patch.description = nullableText_(ctx.params.description, 2000);
  if (ctx.params.systemPrompt !== undefined || ctx.params.instructions !== undefined) patch.systemPrompt = text_(ctx.params.systemPrompt || ctx.params.instructions, 16000);
  if (ctx.params.style !== undefined) patch.styleJson = jsonCell_(ctx.params.style, {}, 'personality style');
  if (ctx.params.visibility !== undefined) patch.visibility = enumValue_(ctx.params.visibility, TABLEGATE.CONTENT_VISIBILITIES, 'PRIVATE', 'visibility');
  updateRow_('Personalities', p._row, patch);
  return publicPersonality_(byId_('Personalities', p.id, true));
}

function routeDeletePersonality_(ctx) { var p=requirePersonality_(ctx.params.personalityId,ctx.user.id);if(p.ownerId!==ctx.user.id)throw new ApiError_('FORBIDDEN','Only the personality owner may delete it.');updateRow_('Personalities',p._row,{deletedAt:nowIso_(),updatedAt:nowIso_()});return {deleted:true}; }

function publicMemory_(m) { return {id:m.id,userId:m.userId,tablegateId:m.tablegateId||'',conversationId:m.conversationId||'',scope:m.scope,memoryType:m.memoryType,title:m.title||'',content:m.content,tags:parseJsonCell_(m.tagsJson,[]),importance:num_(m.importance,0.5),sourceMessageId:m.sourceMessageId||'',createdAt:m.createdAt,updatedAt:m.updatedAt,expiresAt:m.expiresAt||''}; }

function canReadMemory_(m, userId, tablegateId) {
  if (!m || m.deletedAt || (m.expiresAt && isPast_(m.expiresAt))) return false;
  if (m.userId === userId) return true;
  if (m.scope === 'TABLEGATE' && m.tablegateId && tablegateId === m.tablegateId) { try { requireMember_(m.tablegateId,userId); return true; } catch(e){} }
  return false;
}

function routeCreateMemory_(ctx) {
  var p=ctx.params, tablegateId=String(p.tablegateId||'');
  if(tablegateId)requireMember_(tablegateId,ctx.user.id);
  var now=nowIso_(), row=insert_('MemoryItems',{id:id_('memry'),userId:ctx.user.id,tablegateId:tablegateId,conversationId:String(p.conversationId||''),scope:enumValue_(p.scope||(tablegateId?'TABLEGATE':'PRIVATE'),['PRIVATE','TABLEGATE','CONVERSATION'],'PRIVATE','memory scope'),memoryType:text_(p.memoryType||p.type||'FACT',60).toUpperCase(),title:nullableText_(p.title,200),content:text_(p.content,12000),tagsJson:jsonCell_(p.tags,[],'memory tags'),importance:clamp_(p.importance===undefined?0.5:p.importance,0,1),sourceMessageId:String(p.sourceMessageId||''),createdAt:now,updatedAt:now,expiresAt:p.expiresAt?new Date(p.expiresAt).toISOString():'',deletedAt:''});
  return publicMemory_(row);
}

function routeListMemory_(ctx) { var tablegateId=String(ctx.params.tablegateId||'');if(tablegateId)requireMember_(tablegateId,ctx.user.id);return filter_('MemoryItems',function(m){return canReadMemory_(m,ctx.user.id,tablegateId)&&(!ctx.params.conversationId||m.conversationId===String(ctx.params.conversationId));}).sort(function(a,b){return num_(b.importance,0)-num_(a.importance,0)||new Date(b.updatedAt)-new Date(a.updatedAt);}).slice(0,int_(ctx.params.limit,100,1,500)).map(publicMemory_); }

function searchScore_(query, text) {
  query = lower_(query).replace(/[^a-z0-9\s_-]/g,' ').split(/\s+/).filter(Boolean);
  text = lower_(text);
  if (!query.length) return 0;
  var score=0;query.forEach(function(term){var idx=text.indexOf(term);if(idx!==-1)score+=1+(idx===0?0.5:0);});
  return score/query.length;
}

function routeSearchMemory_(ctx) {
  var q=text_(ctx.params.query||ctx.params.q,500),tablegateId=String(ctx.params.tablegateId||'');if(tablegateId)requireMember_(tablegateId,ctx.user.id);
  return filter_('MemoryItems',function(m){return canReadMemory_(m,ctx.user.id,tablegateId);}).map(function(m){return {row:m,score:searchScore_(q,m.title+' '+m.content+' '+m.tagsJson)*0.8+num_(m.importance,0.5)*0.2};}).filter(function(x){return x.score>0;}).sort(function(a,b){return b.score-a.score;}).slice(0,int_(ctx.params.limit,20,1,100)).map(function(x){var out=publicMemory_(x.row);out.score=x.score;return out;});
}

function routeUpdateMemory_(ctx){var m=byId_('MemoryItems',ctx.params.memoryId,true);if(!m||m.deletedAt||m.userId!==ctx.user.id)throw new ApiError_('MEMORY_NOT_FOUND','Memory item not found.');var p=ctx.params,patch={updatedAt:nowIso_()};if(p.title!==undefined)patch.title=nullableText_(p.title,200);if(p.content!==undefined)patch.content=text_(p.content,12000);if(p.tags!==undefined)patch.tagsJson=jsonCell_(p.tags,[],'memory tags');if(p.importance!==undefined)patch.importance=clamp_(p.importance,0,1);if(p.expiresAt!==undefined)patch.expiresAt=p.expiresAt?new Date(p.expiresAt).toISOString():'';updateRow_('MemoryItems',m._row,patch);return publicMemory_(byId_('MemoryItems',m.id,true));}
function routeDeleteMemory_(ctx){var m=byId_('MemoryItems',ctx.params.memoryId,true);if(!m||m.deletedAt||m.userId!==ctx.user.id)throw new ApiError_('MEMORY_NOT_FOUND','Memory item not found.');updateRow_('MemoryItems',m._row,{deletedAt:nowIso_(),updatedAt:nowIso_()});return {deleted:true};}

function publicKnowledge_(k) { return {id:k.id,userId:k.userId,tablegateId:k.tablegateId||'',projectId:k.projectId||'',title:k.title,sourceType:k.sourceType,sourceUrl:k.sourceUrl||'',attachmentId:k.attachmentId||'',contentPreview:String(k.contentText||'').slice(0,1000),contentHash:k.contentHash,tags:parseJsonCell_(k.tagsJson,[]),metadata:parseJsonCell_(k.metadataJson,{}),createdAt:k.createdAt,updatedAt:k.updatedAt}; }

function canReadKnowledge_(k,userId,tablegateId){if(!k||k.deletedAt)return false;if(k.userId===userId)return true;if(k.tablegateId&&tablegateId===k.tablegateId){try{requireMember_(k.tablegateId,userId);return true;}catch(e){}}return false;}

function routeIngestKnowledge_(ctx) {
  var p=ctx.params,tablegateId=String(p.tablegateId||'');if(tablegateId)requireMember_(tablegateId,ctx.user.id);
  var attachmentId=String(p.attachmentId||''),sourceUrl=nullableText_(p.sourceUrl,2000),sourceType=String(p.sourceType||(attachmentId?'FILE':sourceUrl?'WEB':'TEXT')).toUpperCase(),content=String(p.content||''),metadata=jsonValue_(p.metadata,{},'knowledge metadata');
  if(attachmentId){var att=byId_('Attachments',attachmentId,true);if(!att||att.deletedAt)throw new ApiError_('ATTACHMENT_NOT_FOUND','Attachment not found.');var parsed=routeParseAttachment_({params:{attachmentId:attachmentId,instructions:p.instructions},user:ctx.user,session:ctx.session});var result=parsed.result||{};content=String(result.text||result.content||safeJsonStringify_(result.data||result,{}));metadata.parser=result.parser||metadata.parser||'';}
  if(!content&&!sourceUrl)throw new ApiError_('KNOWLEDGE_CONTENT_REQUIRED','Provide text, a source URL, or an attachment.');
  if(sourceUrl&&!content&&bool_(p.fetch)){var wrapped=callAiBackend_(ctx,'webFetch',{url:sourceUrl,extract:true,cite:true});var fetched=unwrapProviderResult_(wrapped);content=String(fetched.text||fetched.content||'');metadata.fetchResult=fetched.metadata||{};}
  var stored=content.slice(0,TABLEGATE.MAX_KNOWLEDGE_TEXT_CHARS),truncated=content.length>stored.length;metadata.truncated=truncated;metadata.originalCharacters=content.length;
  var now=nowIso_(),row=insert_('KnowledgeSources',{id:id_('knw'),userId:ctx.user.id,tablegateId:tablegateId,projectId:String(p.projectId||''),title:text_(p.title||(attachmentId?(byId_('Attachments',attachmentId,true).originalName):sourceUrl||'Knowledge source'),240),sourceType:sourceType,sourceUrl:sourceUrl,attachmentId:attachmentId,contentText:stored,contentHash:sha256Hex_(content),tagsJson:jsonCell_(p.tags,[],'knowledge tags'),metadataJson:jsonCell_(metadata,{},'knowledge metadata'),createdAt:now,updatedAt:now,deletedAt:''});
  return publicKnowledge_(row);
}

function routeListKnowledge_(ctx){var tablegateId=String(ctx.params.tablegateId||'');if(tablegateId)requireMember_(tablegateId,ctx.user.id);return filter_('KnowledgeSources',function(k){return canReadKnowledge_(k,ctx.user.id,tablegateId)&&(!ctx.params.projectId||k.projectId===String(ctx.params.projectId));}).slice(0,int_(ctx.params.limit,100,1,500)).map(publicKnowledge_);}

function routeSearchKnowledge_(ctx){var q=text_(ctx.params.query||ctx.params.q,500),tablegateId=String(ctx.params.tablegateId||'');if(tablegateId)requireMember_(tablegateId,ctx.user.id);return filter_('KnowledgeSources',function(k){return canReadKnowledge_(k,ctx.user.id,tablegateId);}).map(function(k){return {row:k,score:searchScore_(q,k.title+' '+k.contentText+' '+k.tagsJson+' '+k.sourceUrl)};}).filter(function(x){return x.score>0;}).sort(function(a,b){return b.score-a.score;}).slice(0,int_(ctx.params.limit,20,1,100)).map(function(x){var out=publicKnowledge_(x.row);out.score=x.score;out.snippet=String(x.row.contentText||'').slice(0,2000);return out;});}
function routeDeleteKnowledge_(ctx){var k=byId_('KnowledgeSources',ctx.params.knowledgeId,true);if(!k||k.deletedAt||k.userId!==ctx.user.id)throw new ApiError_('KNOWLEDGE_NOT_FOUND','Knowledge source not found.');updateRow_('KnowledgeSources',k._row,{deletedAt:nowIso_(),updatedAt:nowIso_()});return {deleted:true};}

function publicCitation_(c){return {id:c.id,conversationId:c.conversationId||'',messageId:c.messageId||'',sourceType:c.sourceType,sourceId:c.sourceId||'',title:c.title||'',url:c.url||'',locator:c.locator||'',quoteText:c.quoteText||'',metadata:parseJsonCell_(c.metadataJson,{}),createdAt:c.createdAt};}

function persistCitations_(ctx, conversationId, messageId, citations) {
  if (!Array.isArray(citations)) return [];
  return citations.slice(0,100).map(function(c){
    c=c||{};var sourceType=String(c.sourceType||c.type||(c.url?'WEB':'FILE')).toUpperCase(),sourceId=String(c.sourceId||c.attachmentId||'');
    if(sourceType==='FILE'&&sourceId){try{var a=byId_('Attachments',sourceId,true);if(a)requireAttachmentAccess_(a.id,ctx.user.id,a.tablegateId||'',a.dmId||'');}catch(e){sourceId='';}}
    var row=insert_('Citations',{id:id_('cit'),userId:ctx.user.id,tablegateId:String(ctx.params.tablegateId||''),conversationId:String(conversationId||''),messageId:String(messageId||''),sourceType:sourceType,sourceId:sourceId,title:nullableText_(c.title||c.name,500),url:nullableText_(c.url,2000),locator:nullableText_(c.locator||c.location,500),quoteText:nullableText_(c.quoteText||c.quote||c.snippet,4000),metadataJson:jsonCell_(c.metadata||c,{},'citation metadata'),createdAt:nowIso_()});
    return publicCitation_(row);
  });
}

function routeCreateCitation_(ctx){return persistCitations_(ctx,ctx.params.conversationId,ctx.params.messageId,[jsonValue_(ctx.params.citation||ctx.params,{},'citation')])[0];}
function routeListCitations_(ctx){var conversationId=String(ctx.params.conversationId||''),messageId=String(ctx.params.messageId||'');return filter_('Citations',function(c){return c.userId===ctx.user.id&&(!conversationId||c.conversationId===conversationId)&&(!messageId||c.messageId===messageId);}).slice(0,int_(ctx.params.limit,100,1,500)).map(publicCitation_);}

function publicAiConversation_(c){return {id:c.id,userId:c.userId,tablegateId:c.tablegateId||'',title:c.title,personalityId:c.personalityId||'',systemPrompt:c.systemPrompt||'',model:c.model||'',settings:parseJsonCell_(c.settingsJson,{}),createdAt:c.createdAt,updatedAt:c.updatedAt,archivedAt:c.archivedAt||''};}
function requireAiConversation_(id,userId){var c=byId_('AiConversations',id,true);if(!c||c.userId!==userId)throw new ApiError_('CONVERSATION_NOT_FOUND','AI conversation not found.');if(c.tablegateId)requireMember_(c.tablegateId,userId);return c;}
function publicAiMessage_(m){return {id:m.id,conversationId:m.conversationId,userId:m.userId||'',role:m.role,content:m.content,attachmentIds:parseJsonCell_(m.attachmentIds,[]),citationIds:parseJsonCell_(m.citationIds,[]),metadata:parseJsonCell_(m.metadataJson,{}),createdAt:m.createdAt};}

function createAiConversationRecord_(ctx,p){p=p||{};var tablegateId=String(p.tablegateId||'');if(tablegateId)requireMember_(tablegateId,ctx.user.id);var personalityId=String(p.personalityId||'');if(personalityId)requirePersonality_(personalityId,ctx.user.id);var now=nowIso_();return insert_('AiConversations',{id:id_('aic'),userId:ctx.user.id,tablegateId:tablegateId,title:nullableText_(p.title,200)||'New conversation',personalityId:personalityId,systemPrompt:nullableText_(p.systemPrompt,16000),model:nullableText_(p.model,120),settingsJson:jsonCell_(p.settings,{},'conversation settings'),createdAt:now,updatedAt:now,archivedAt:''});}
function routeCreateAiConversation_(ctx){return publicAiConversation_(createAiConversationRecord_(ctx,ctx.params));}
function routeListAiConversations_(ctx){return filter_('AiConversations',function(c){return c.userId===ctx.user.id&&(bool_(ctx.params.includeArchived)||!c.archivedAt);}).sort(function(a,b){return new Date(b.updatedAt)-new Date(a.updatedAt);}).slice(0,int_(ctx.params.limit,100,1,500)).map(publicAiConversation_);}
function routeGetAiConversation_(ctx){var c=requireAiConversation_(ctx.params.conversationId,ctx.user.id);var messages=filter_('AiMessages',function(m){return m.conversationId===c.id;}).sort(function(a,b){return new Date(a.createdAt)-new Date(b.createdAt);}).slice(-int_(ctx.params.limit,200,1,1000)).map(publicAiMessage_);return {conversation:publicAiConversation_(c),messages:messages};}
function routeUpdateAiConversation_(ctx){var c=requireAiConversation_(ctx.params.conversationId,ctx.user.id),p=ctx.params,patch={updatedAt:nowIso_()};if(p.title!==undefined)patch.title=text_(p.title,200);if(p.personalityId!==undefined){if(p.personalityId)requirePersonality_(p.personalityId,ctx.user.id);patch.personalityId=String(p.personalityId||'');}if(p.systemPrompt!==undefined)patch.systemPrompt=nullableText_(p.systemPrompt,16000);if(p.model!==undefined)patch.model=nullableText_(p.model,120);if(p.settings!==undefined)patch.settingsJson=jsonCell_(p.settings,{},'conversation settings');if(p.archived!==undefined)patch.archivedAt=bool_(p.archived)?nowIso_():'';updateRow_('AiConversations',c._row,patch);return publicAiConversation_(byId_('AiConversations',c.id,true));}
function routeDeleteAiConversation_(ctx){var c=requireAiConversation_(ctx.params.conversationId,ctx.user.id);updateRow_('AiConversations',c._row,{archivedAt:nowIso_(),updatedAt:nowIso_()});return {archived:true};}

function appendAiMessage_(conversation, userId, role, content, attachmentIds, citationIds, metadata) {
  var row=insert_('AiMessages',{id:id_('aim'),conversationId:conversation.id,userId:userId||'',role:String(role||'assistant').toLowerCase(),content:String(content||'').slice(0,45000),attachmentIds:safeJsonStringify_(attachmentIds||[]),citationIds:safeJsonStringify_(citationIds||[]),metadataJson:safeJsonStringify_(metadata||{}),createdAt:nowIso_()});
  updateRow_('AiConversations',conversation._row,{updatedAt:nowIso_()});
  return row;
}

function unwrapProviderResult_(wrapped){var b=wrapped&&wrapped.backend!==undefined?wrapped.backend:wrapped;if(b&&b.data!==undefined)return b.data;if(b&&b.result!==undefined)return b.result;if(b&&b.output!==undefined)return b.output;return b||{};}
function providerText_(result){if(result===null||result===undefined)return '';if(typeof result==='string')return result;return String(result.answer||result.message||result.text||result.content||result.response||'');}
function providerCitations_(result){return Array.isArray(result&&result.citations)?result.citations:(Array.isArray(result&&result.sources)?result.sources:[]);}
function providerMemories_(result){return Array.isArray(result&&result.memories)?result.memories:(Array.isArray(result&&result.memorySuggestions)?result.memorySuggestions:[]);}

function persistProviderAssets_(ctx,result,options){options=options||{};var assets=[];if(Array.isArray(result&&result.assets))assets=result.assets;else if(Array.isArray(result&&result.images))assets=result.images;else if(result&&result.image)assets=[result.image];return assets.slice(0,20).map(function(asset,index){if(typeof asset==='string')asset=/^https:\/\//i.test(asset)?{url:asset}:{base64:asset};var fileName=asset.fileName||asset.name||((options.prefix||'generated')+'-'+(index+1)+'.png'),a;if(asset.base64||asset.data){a=createAttachmentFromBase64_(ctx,asset,{fileName:fileName,mimeType:asset.mimeType||'image/png',tablegateId:options.tablegateId||'',scopeType:'AI',scopeId:options.conversationId||''});}else if(asset.url&&/^https:\/\//i.test(asset.url)){var response=UrlFetchApp.fetch(asset.url,{muteHttpExceptions:true,followRedirects:true});if(response.getResponseCode()<200||response.getResponseCode()>=300)throw new ApiError_('PROVIDER_ASSET_DOWNLOAD_FAILED','A generated asset URL could not be downloaded.',{status:response.getResponseCode()});var blob=response.getBlob().setName(fileName);a=createAttachmentFromBlob_(ctx,blob,{fileName:fileName,mimeType:asset.mimeType||blob.getContentType()||'application/octet-stream',tablegateId:options.tablegateId||'',scopeType:'AI',scopeId:options.conversationId||''});}else{throw new ApiError_('INVALID_PROVIDER_ASSET','A provider asset needs base64 data or an HTTPS URL.');}var indexed=indexAttachment_(a,ctx,{tablegateId:options.tablegateId,folderId:options.folderId,assetType:options.assetType||'GENERATED_IMAGE',title:asset.title||a.originalName,tags:options.tags||[],metadata:{provider:options.provider||'AI_BACKEND',generation:asset.metadata||{},sourceUrl:asset.url||''}});return publicAsset_(indexed);});}

function buildAiContext_(ctx,conversation,prompt){
  var history=filter_('AiMessages',function(m){return m.conversationId===conversation.id;}).sort(function(a,b){return new Date(a.createdAt)-new Date(b.createdAt);}).slice(-TABLEGATE.AI_CONVERSATION_CONTEXT).map(function(m){return {role:m.role,content:m.content,attachmentIds:parseJsonCell_(m.attachmentIds,[])};});
  var memories=routeSearchMemory_({params:{query:prompt,tablegateId:conversation.tablegateId,limit:20},user:ctx.user,session:ctx.session});
  var knowledge=routeSearchKnowledge_({params:{query:prompt,tablegateId:conversation.tablegateId,limit:12},user:ctx.user,session:ctx.session});
  var personality=conversation.personalityId?publicPersonality_(requirePersonality_(conversation.personalityId,ctx.user.id)):null;
  return {history:history,memory:memories,knowledge:knowledge,personality:personality};
}

function routeSendAiMessage_(ctx) {
  var p=ctx.params,conversation=p.conversationId?requireAiConversation_(p.conversationId,ctx.user.id):createAiConversationRecord_(ctx,p),prompt=text_(p.message||p.prompt,TABLEGATE.MAX_MESSAGE_LENGTH),attachmentIds=unique_(array_(p.attachmentIds));
  attachmentIds.forEach(function(id){var a=byId_('Attachments',id,true);if(!a)throw new ApiError_('ATTACHMENT_NOT_FOUND','Attachment not found: '+id);requireAttachmentAccess_(id,ctx.user.id,a.tablegateId||'',a.dmId||'');});
  var userMessage=appendAiMessage_(conversation,ctx.user.id,'user',prompt,attachmentIds,[],{}),context=buildAiContext_(ctx,conversation,prompt);
  var payload={message:prompt,history:context.history,memory:context.memory,knowledge:context.knowledge,personality:context.personality,systemPrompt:conversation.systemPrompt||'',model:conversation.model||'',settings:parseJsonCell_(conversation.settingsJson,{}),attachmentIds:attachmentIds,policies:{searchWebWhenUncertain:true,searchWebForCurrentFacts:true,citeSources:true,citeFiles:true,askClarifyingQuestionsWhenNecessary:true,doNotInventSources:true,retainConversation:true}};
  var wrapped=callAiBackend_(ctx,'smartAsk',payload),result=unwrapProviderResult_(wrapped),answer=providerText_(result);if(!answer)answer=safeJsonStringify_(result,{});
  var assistantMessage=appendAiMessage_(conversation,'','assistant',answer,[],[],{providerRequestId:wrapped.requestId,rawMetadata:result.metadata||{}}),citations=persistCitations_(ctx,conversation.id,assistantMessage.id,providerCitations_(result));
  updateRow_('AiMessages',assistantMessage._row,{citationIds:safeJsonStringify_(citations.map(function(c){return c.id;}))});
  if(bool_(p.autoRemember)){providerMemories_(result).slice(0,20).forEach(function(m){routeCreateMemory_({params:{tablegateId:conversation.tablegateId,conversationId:conversation.id,scope:m.scope||'CONVERSATION',memoryType:m.type||'FACT',title:m.title||'',content:m.content||m.text||'',tags:m.tags||[],importance:m.importance===undefined?0.6:m.importance,sourceMessageId:assistantMessage.id},user:ctx.user,session:ctx.session});});}
  var assets=persistProviderAssets_(ctx,result,{tablegateId:conversation.tablegateId,conversationId:conversation.id,prefix:'ai',assetType:'GENERATED_IMAGE'});
  return {conversation:publicAiConversation_(byId_('AiConversations',conversation.id,true)),userMessage:publicAiMessage_(userMessage),assistantMessage:publicAiMessage_(byId_('AiMessages',assistantMessage.id,true)),citations:citations,assets:assets,provider:{requestId:wrapped.requestId,status:wrapped.status}};
}

function routeSmartAsk_(ctx){return routeSendAiMessage_(ctx);}

function routeSubmitLearningFeedback_(ctx){var p=ctx.params,conversationId=String(p.conversationId||'');if(conversationId)requireAiConversation_(conversationId,ctx.user.id);var now=nowIso_(),row=insert_('LearningFeedback',{id:id_('lfb'),userId:ctx.user.id,conversationId:conversationId,messageId:String(p.messageId||''),rating:int_(p.rating,0,-1,5),category:nullableText_(p.category,80),feedback:nullableText_(p.feedback,8000),acceptedCorrection:nullableText_(p.acceptedCorrection,12000),metadataJson:jsonCell_(p.metadata,{},'feedback metadata'),createdAt:now});if(bool_(p.rememberCorrection)&&row.acceptedCorrection)routeCreateMemory_({params:{conversationId:conversationId,scope:'PRIVATE',memoryType:'CORRECTION',title:p.title||'Accepted correction',content:row.acceptedCorrection,tags:['correction'],importance:0.9,sourceMessageId:row.messageId},user:ctx.user,session:ctx.session});return stripInternal_(row);}

/* ---------- Web/image search, generation, and configured integrations ---------- */

function routeWebSearch_(ctx){var query=text_(ctx.params.query||ctx.params.q,1000),wrapped=callAiBackend_(ctx,'webSearch',{query:query,recencyDays:ctx.params.recencyDays===undefined?null:int_(ctx.params.recencyDays,0,0,36500),domains:array_(ctx.params.domains),excludeDomains:array_(ctx.params.excludeDomains),limit:int_(ctx.params.limit,10,1,50),cite:true,fetchPages:ctx.params.fetchPages===undefined?true:bool_(ctx.params.fetchPages)}),result=unwrapProviderResult_(wrapped),citations=persistCitations_(ctx,ctx.params.conversationId,'',providerCitations_(result));return {query:query,result:result,citations:citations,provider:{requestId:wrapped.requestId,status:wrapped.status}};}
function routeImageSearch_(ctx){var query=text_(ctx.params.query||ctx.params.q,1000),wrapped=callAiBackend_(ctx,'imageSearch',{query:query,domains:array_(ctx.params.domains),limit:int_(ctx.params.limit,12,1,50),license:nullableText_(ctx.params.license,80),safeSearch:ctx.params.safeSearch===undefined?true:bool_(ctx.params.safeSearch),cite:true}),result=unwrapProviderResult_(wrapped),citations=persistCitations_(ctx,ctx.params.conversationId,'',providerCitations_(result));return {query:query,result:result,citations:citations,provider:{requestId:wrapped.requestId,status:wrapped.status}};}
function routeGenerateImage_(ctx){var p=ctx.params,wrapped=callAiBackend_(ctx,'generateImage',{prompt:text_(p.prompt,12000),negativePrompt:nullableText_(p.negativePrompt,6000),style:nullableText_(p.style,500),width:int_(p.width,1024,256,4096),height:int_(p.height,1024,256,4096),count:int_(p.count,1,1,4),transparentBackground:bool_(p.transparentBackground),seed:p.seed===undefined?null:int_(p.seed,0,0,2147483647),metadata:jsonValue_(p.metadata,{},'generation metadata')}),result=unwrapProviderResult_(wrapped),assets=persistProviderAssets_(ctx,result,{tablegateId:String(p.tablegateId||''),folderId:String(p.folderId||''),prefix:'generated-image',assetType:'GENERATED_IMAGE',tags:array_(p.tags)});return {result:result,assets:assets,provider:{requestId:wrapped.requestId,status:wrapped.status}};}

function referencePayload_(ctx,ids){var total=0,max=int_(PropertiesService.getScriptProperties().getProperty(TABLEGATE.MAX_INLINE_AI_FILE_BYTES_PROPERTY),TABLEGATE.DEFAULT_MAX_INLINE_AI_FILE_BYTES,1024,10*1024*1024);return unique_(ids).slice(0,8).map(function(id){var a=byId_('Attachments',id,true);if(!a||a.deletedAt)throw new ApiError_('ATTACHMENT_NOT_FOUND','Reference attachment not found: '+id);var blob=getAttachmentBlob_(a,ctx.user.id),bytes=blob.getBytes();total+=bytes.length;if(total>max)throw new ApiError_('REFERENCES_TOO_LARGE','Reference files exceed the inline provider limit.',{maxBytes:max});return {attachmentId:a.id,fileName:a.originalName,mimeType:a.mimeType,base64:Utilities.base64Encode(bytes)};});}
function routeGenerateFromReferences_(ctx){var p=ctx.params;if(!bool_(p.userAffirmsRights))throw new ApiError_('RIGHTS_CONFIRMATION_REQUIRED','Confirm that you have permission to use the supplied references.');var refs=referencePayload_(ctx,array_(p.referenceAttachmentIds||p.attachmentIds)),wrapped=callAiBackend_(ctx,'generateFromReferences',{prompt:text_(p.prompt,12000),references:refs,mode:nullableText_(p.mode,80)||'transform',preserve:array_(p.preserve),change:array_(p.change),width:int_(p.width,1024,256,4096),height:int_(p.height,1024,256,4096),count:int_(p.count,1,1,4),metadata:jsonValue_(p.metadata,{},'generation metadata')}),result=unwrapProviderResult_(wrapped),assets=persistProviderAssets_(ctx,result,{tablegateId:String(p.tablegateId||''),folderId:String(p.folderId||''),prefix:'reference-generation',assetType:'GENERATED_IMAGE',tags:array_(p.tags)});return {result:result,assets:assets,provider:{requestId:wrapped.requestId,status:wrapped.status}};}

function getIntegrationConfigs_(){var raw=PropertiesService.getScriptProperties().getProperty(TABLEGATE.INTEGRATIONS_PROPERTY)||'{}',configs=parseJsonCell_(raw,{});return configs&&typeof configs==='object'?configs:{};}
function routeListIntegrations_(ctx){var configs=getIntegrationConfigs_(),out=[];Object.keys(configs).forEach(function(name){var c=configs[name]||{};out.push({name:name,enabled:c.enabled!==false,capabilities:Array.isArray(c.capabilities)?c.capabilities:[],description:c.description||'',endpointConfigured:!!c.endpoint});});return out;}
function callConfiguredIntegration_(name,operation,payload){var configs=getIntegrationConfigs_(),c=configs[name];if(!c||c.enabled===false||!c.endpoint)throw new ApiError_('INTEGRATION_NOT_CONFIGURED','Integration is not configured: '+name);var caps=Array.isArray(c.capabilities)?c.capabilities:[];if(caps.length&&caps.indexOf(operation)===-1)throw new ApiError_('INTEGRATION_OPERATION_NOT_ALLOWED','This provider does not allow operation: '+operation);if(!/^https:\/\//i.test(c.endpoint))throw new ApiError_('INTEGRATION_INVALID','Integration endpoint must use HTTPS.');var headers=clone_(c.headers||{});if(c.secretProperty){var secret=PropertiesService.getScriptProperties().getProperty(String(c.secretProperty));if(!secret)throw new ApiError_('INTEGRATION_SECRET_MISSING','Integration secret is missing.');headers[c.headerName||'Authorization']=(c.secretPrefix||'Bearer ')+secret;}var response=UrlFetchApp.fetch(c.endpoint,{method:String(c.method||'post').toLowerCase(),contentType:'application/json; charset=utf-8',headers:headers,payload:JSON.stringify({operation:operation,payload:payload||{},requestedAt:nowIso_(),source:'TABLEGATE'}),muteHttpExceptions:true,followRedirects:true});var status=response.getResponseCode(),text=response.getContentText(),parsed;try{parsed=JSON.parse(text);}catch(e){parsed={text:text};}if(status<200||status>=300)throw new ApiError_('INTEGRATION_ERROR','Integration request failed.',{status:status,response:parsed});return {status:status,result:parsed};}
function routeInvokeIntegration_(ctx){var p=ctx.params,tablegateId=String(p.tablegateId||'');if(tablegateId)requireMember_(tablegateId,ctx.user.id);var provider=text_(p.provider,100),operation=text_(p.operation,100),request=jsonValue_(p.payload,{},'integration payload'),job=insert_('IntegrationJobs',{id:id_('job'),userId:ctx.user.id,tablegateId:tablegateId,projectId:String(p.projectId||''),provider:provider,operation:operation,status:'RUNNING',requestJson:jsonCell_(request,{},'integration request'),resultJson:'{}',errorJson:'{}',createdAt:nowIso_(),startedAt:nowIso_(),completedAt:''});try{var result=callConfiguredIntegration_(provider,operation,request);updateRow_('IntegrationJobs',job._row,{status:'COMPLETED',resultJson:jsonCell_(result,{},'integration result'),completedAt:nowIso_()});return {jobId:job.id,status:'COMPLETED',result:result};}catch(e){updateRow_('IntegrationJobs',job._row,{status:'FAILED',errorJson:jsonCell_({code:e.code||'ERROR',message:e.message,details:e.details||null},{},'integration error'),completedAt:nowIso_()});throw e;}}

/* ---------- Project workspaces and compilation ---------- */

function publicProject_(p){return {id:p.id,ownerId:p.ownerId,tablegateId:p.tablegateId||'',name:p.name,projectType:p.projectType,description:p.description||'',status:p.status,driveFolderId:p.driveFolderId||'',settings:parseJsonCell_(p.settingsJson,{}),createdAt:p.createdAt,updatedAt:p.updatedAt};}
function requireProject_(id,userId,manage){var p=byId_('Projects',id,true);if(!p||p.deletedAt)throw new ApiError_('PROJECT_NOT_FOUND','Project not found.');if(p.ownerId!==userId){if(!p.tablegateId)throw new ApiError_('FORBIDDEN','You cannot access this project.');requireMember_(p.tablegateId,userId);if(manage)requirePermission_(p.tablegateId,userId,PERMISSIONS.MANAGE_HANDOUTS);}return p;}
function routeCreateProject_(ctx){var p=ctx.params,tablegateId=String(p.tablegateId||'');if(tablegateId)requireMember_(tablegateId,ctx.user.id);var name=text_(p.name,160),folder=uploadFolder_().createFolder(safeFileName_('Project - '+name)),now=nowIso_(),row=insert_('Projects',{id:id_('prj'),ownerId:ctx.user.id,tablegateId:tablegateId,name:name,projectType:text_(p.projectType||'GENERAL',80).toUpperCase(),description:nullableText_(p.description,4000),status:enumValue_(p.status||'ACTIVE',['DRAFT','ACTIVE','PAUSED','COMPLETED','ARCHIVED'],'ACTIVE','project status'),driveFolderId:folder.getId(),settingsJson:jsonCell_(p.settings,{},'project settings'),createdAt:now,updatedAt:now,deletedAt:''});return publicProject_(row);}
function routeListProjects_(ctx){var tablegateId=String(ctx.params.tablegateId||'');if(tablegateId)requireMember_(tablegateId,ctx.user.id);return filter_('Projects',function(p){return !p.deletedAt&&(p.ownerId===ctx.user.id||(tablegateId&&p.tablegateId===tablegateId));}).sort(function(a,b){return new Date(b.updatedAt)-new Date(a.updatedAt);}).map(publicProject_);}
function routeGetProject_(ctx){var p=requireProject_(ctx.params.projectId,ctx.user.id,false);var items=filter_('ProjectItems',function(i){return i.projectId===p.id&&!i.deletedAt;}).sort(function(a,b){return num_(a.orderIndex,0)-num_(b.orderIndex,0);}).map(publicProjectItem_);return {project:publicProject_(p),items:items};}
function routeUpdateProject_(ctx){var p=requireProject_(ctx.params.projectId,ctx.user.id,true),q=ctx.params,patch={updatedAt:nowIso_()};if(q.name!==undefined)patch.name=text_(q.name,160);if(q.description!==undefined)patch.description=nullableText_(q.description,4000);if(q.projectType!==undefined)patch.projectType=text_(q.projectType,80).toUpperCase();if(q.status!==undefined)patch.status=enumValue_(q.status,['DRAFT','ACTIVE','PAUSED','COMPLETED','ARCHIVED'],'ACTIVE','project status');if(q.settings!==undefined)patch.settingsJson=jsonCell_(q.settings,{},'project settings');updateRow_('Projects',p._row,patch);return publicProject_(byId_('Projects',p.id,true));}
function routeDeleteProject_(ctx){var p=requireProject_(ctx.params.projectId,ctx.user.id,true);updateRow_('Projects',p._row,{deletedAt:nowIso_(),updatedAt:nowIso_()});return {deleted:true};}
function publicProjectItem_(i){return {id:i.id,projectId:i.projectId,parentId:i.parentId||'',itemType:i.itemType,name:i.name,status:i.status,attachmentId:i.attachmentId||'',data:parseJsonCell_(i.dataJson,{}),orderIndex:num_(i.orderIndex,0),createdAt:i.createdAt,updatedAt:i.updatedAt};}
function routeCreateProjectItem_(ctx){var p=requireProject_(ctx.params.projectId,ctx.user.id,true),q=ctx.params,aid=String(q.attachmentId||'');if(aid){var a=byId_('Attachments',aid,true);if(!a)throw new ApiError_('ATTACHMENT_NOT_FOUND','Attachment not found.');requireAttachmentAccess_(aid,ctx.user.id,a.tablegateId||'',a.dmId||'');}var now=nowIso_(),row=insert_('ProjectItems',{id:id_('pit'),projectId:p.id,parentId:String(q.parentId||''),itemType:text_(q.itemType||'ARTIFACT',80).toUpperCase(),name:text_(q.name,200),status:enumValue_(q.status||'DRAFT',['DRAFT','ACTIVE','BLOCKED','DONE','ARCHIVED'],'DRAFT','item status'),attachmentId:aid,dataJson:jsonCell_(q.data,{},'project item data'),orderIndex:int_(q.orderIndex,100, -100000,100000),createdAt:now,updatedAt:now,deletedAt:''});updateRow_('Projects',p._row,{updatedAt:now});return publicProjectItem_(row);}
function routeListProjectItems_(ctx){var p=requireProject_(ctx.params.projectId,ctx.user.id,false);return filter_('ProjectItems',function(i){return i.projectId===p.id&&!i.deletedAt&&(!ctx.params.parentId||i.parentId===String(ctx.params.parentId));}).sort(function(a,b){return num_(a.orderIndex,0)-num_(b.orderIndex,0);}).map(publicProjectItem_);}
function routeUpdateProjectItem_(ctx){var i=byId_('ProjectItems',ctx.params.itemId,true);if(!i||i.deletedAt)throw new ApiError_('PROJECT_ITEM_NOT_FOUND','Project item not found.');requireProject_(i.projectId,ctx.user.id,true);var q=ctx.params,patch={updatedAt:nowIso_()};if(q.name!==undefined)patch.name=text_(q.name,200);if(q.parentId!==undefined)patch.parentId=String(q.parentId||'');if(q.itemType!==undefined)patch.itemType=text_(q.itemType,80).toUpperCase();if(q.status!==undefined)patch.status=enumValue_(q.status,['DRAFT','ACTIVE','BLOCKED','DONE','ARCHIVED'],'DRAFT','item status');if(q.attachmentId!==undefined){var aid=String(q.attachmentId||'');if(aid){var a=byId_('Attachments',aid,true);if(!a||a.deletedAt)throw new ApiError_('ATTACHMENT_NOT_FOUND','Attachment not found.');requireAttachmentAccess_(aid,ctx.user.id,a.tablegateId||'',a.dmId||'');}patch.attachmentId=aid;}if(q.data!==undefined)patch.dataJson=jsonCell_(q.data,{},'project item data');if(q.orderIndex!==undefined)patch.orderIndex=int_(q.orderIndex,0,-100000,100000);updateRow_('ProjectItems',i._row,patch);return publicProjectItem_(byId_('ProjectItems',i.id,true));}
function routeDeleteProjectItem_(ctx){var i=byId_('ProjectItems',ctx.params.itemId,true);if(!i||i.deletedAt)throw new ApiError_('PROJECT_ITEM_NOT_FOUND','Project item not found.');requireProject_(i.projectId,ctx.user.id,true);updateRow_('ProjectItems',i._row,{deletedAt:nowIso_(),updatedAt:nowIso_()});return {deleted:true};}
function routeCompileProject_(ctx){var p=requireProject_(ctx.params.projectId,ctx.user.id,false),items=filter_('ProjectItems',function(i){return i.projectId===p.id&&!i.deletedAt;}).sort(function(a,b){return num_(a.orderIndex,0)-num_(b.orderIndex,0);}),manifest={project:publicProject_(p),items:items.map(publicProjectItem_),compiledAt:nowIso_(),schemaVersion:TABLEGATE.SCHEMA_VERSION},blobs=[Utilities.newBlob(JSON.stringify(manifest,null,2),'application/json','project-manifest.json')],total=blobs[0].getBytes().length,uploadMax=int_(PropertiesService.getScriptProperties().getProperty(TABLEGATE.MAX_UPLOAD_PROPERTY),TABLEGATE.DEFAULT_MAX_UPLOAD_BYTES,1024,50*1024*1024),maxBytes=Math.min(uploadMax,int_(ctx.params.maxBytes,uploadMax,1024,50*1024*1024));items.forEach(function(i){if(!i.attachmentId||blobs.length>=100)return;var a=byId_('Attachments',i.attachmentId,true);if(!a||a.deletedAt)return;try{requireAttachmentAccess_(a.id,ctx.user.id,a.tablegateId||'',a.dmId||'');var b=DriveApp.getFileById(a.fileId).getBlob().setName(safeFileName_(i.name+' - '+a.originalName));if(total+b.getBytes().length<=maxBytes){blobs.push(b);total+=b.getBytes().length;}}catch(e){}});var zip=Utilities.zip(blobs,safeFileName_(p.name)+'.zip'),attachment=createAttachmentFromBlob_(ctx,zip,{fileName:safeFileName_(p.name)+'.zip',mimeType:'application/zip',tablegateId:p.tablegateId,scopeType:'PROJECT',scopeId:p.id}),asset=indexAttachment_(attachment,ctx,{tablegateId:p.tablegateId,assetType:'PROJECT_BUNDLE',title:p.name+' compiled project',metadata:{projectId:p.id,fileCount:blobs.length,totalBytes:total}});return {project:publicProject_(p),bundle:publicAsset_(asset),includedFiles:blobs.length,totalBytes:total};}

/* ---------- Interactive painterly maps and GeoJSON ---------- */

function publicMap_(m){return {id:m.id,projectId:m.projectId||'',tablegateId:m.tablegateId||'',ownerId:m.ownerId,name:m.name,backgroundAttachmentId:m.backgroundAttachmentId||'',width:num_(m.width,0),height:num_(m.height,0),projection:m.projection||'PIXEL',settings:parseJsonCell_(m.settingsJson,{}),createdAt:m.createdAt,updatedAt:m.updatedAt};}
function requireMap_(id,userId,manage){var m=byId_('MapProjects',id,true);if(!m||m.deletedAt)throw new ApiError_('MAP_NOT_FOUND','Map project not found.');if(m.ownerId!==userId){if(!m.tablegateId)throw new ApiError_('FORBIDDEN','You cannot access this map.');requireMember_(m.tablegateId,userId);if(manage)requirePermission_(m.tablegateId,userId,PERMISSIONS.MANAGE_HANDOUTS);}return m;}
function routeCreateMap_(ctx){var p=ctx.params,project=p.projectId?requireProject_(p.projectId,ctx.user.id,true):null,tablegateId=String(p.tablegateId||(project&&project.tablegateId)||'');if(tablegateId)requireMember_(tablegateId,ctx.user.id);var bg=String(p.backgroundAttachmentId||'');if(bg){var a=byId_('Attachments',bg,true);if(!a)throw new ApiError_('ATTACHMENT_NOT_FOUND','Map background not found.');requireAttachmentAccess_(a.id,ctx.user.id,a.tablegateId||'',a.dmId||'');}var now=nowIso_(),m=insert_('MapProjects',{id:id_('map'),projectId:project?project.id:'',tablegateId:tablegateId,ownerId:ctx.user.id,name:text_(p.name,180),backgroundAttachmentId:bg,width:int_(p.width,4096,1,20000),height:int_(p.height,4096,1,20000),projection:nullableText_(p.projection,80)||'PIXEL',settingsJson:jsonCell_(p.settings,{},'map settings'),createdAt:now,updatedAt:now,deletedAt:''});var layer=insert_('MapLayers',{id:id_('mly'),mapId:m.id,name:'Interactive Locations',layerType:'SEMANTIC',orderIndex:10,visible:true,styleJson:'{}',createdAt:now,updatedAt:now,deletedAt:''});return {map:publicMap_(m),defaultLayer:stripInternal_(layer)};}
function routeListMaps_(ctx){var tablegateId=String(ctx.params.tablegateId||'');if(tablegateId)requireMember_(tablegateId,ctx.user.id);return filter_('MapProjects',function(m){return !m.deletedAt&&(m.ownerId===ctx.user.id||(tablegateId&&m.tablegateId===tablegateId))&&(!ctx.params.projectId||m.projectId===String(ctx.params.projectId));}).map(publicMap_);}
function routeGetMap_(ctx){var m=requireMap_(ctx.params.mapId,ctx.user.id,false),layers=filter_('MapLayers',function(l){return l.mapId===m.id&&!l.deletedAt;}).sort(function(a,b){return num_(a.orderIndex,0)-num_(b.orderIndex,0);}).map(function(l){return {id:l.id,mapId:l.mapId,name:l.name,layerType:l.layerType,orderIndex:num_(l.orderIndex,0),visible:bool_(l.visible),style:parseJsonCell_(l.styleJson,{})};}),features=filter_('MapFeatures',function(f){return f.mapId===m.id&&!f.deletedAt;}).map(publicMapFeature_);return {map:publicMap_(m),layers:layers,features:features,featureCollection:{type:'FeatureCollection',features:features.map(function(f){return {type:'Feature',id:f.id,geometry:f.geometry,properties:Object.assign({},f.properties,{name:f.name,semanticType:f.semanticType,linkedEntityType:f.linkedEntityType,linkedEntityId:f.linkedEntityId})};})}};}
function routeUpdateMap_(ctx){var m=requireMap_(ctx.params.mapId,ctx.user.id,true),p=ctx.params,patch={updatedAt:nowIso_()};if(p.name!==undefined)patch.name=text_(p.name,180);if(p.backgroundAttachmentId!==undefined){var bg=String(p.backgroundAttachmentId||'');if(bg){var a=byId_('Attachments',bg,true);if(!a||a.deletedAt)throw new ApiError_('ATTACHMENT_NOT_FOUND','Map background not found.');requireAttachmentAccess_(a.id,ctx.user.id,a.tablegateId||'',a.dmId||'');}patch.backgroundAttachmentId=bg;}if(p.width!==undefined)patch.width=int_(p.width,m.width,1,20000);if(p.height!==undefined)patch.height=int_(p.height,m.height,1,20000);if(p.projection!==undefined)patch.projection=nullableText_(p.projection,80)||'PIXEL';if(p.settings!==undefined)patch.settingsJson=jsonCell_(p.settings,{},'map settings');updateRow_('MapProjects',m._row,patch);return publicMap_(byId_('MapProjects',m.id,true));}
function routeDeleteMap_(ctx){var m=requireMap_(ctx.params.mapId,ctx.user.id,true);updateRow_('MapProjects',m._row,{deletedAt:nowIso_(),updatedAt:nowIso_()});return {deleted:true};}
function routeCreateMapLayer_(ctx){var m=requireMap_(ctx.params.mapId,ctx.user.id,true),now=nowIso_(),l=insert_('MapLayers',{id:id_('mly'),mapId:m.id,name:text_(ctx.params.name,120),layerType:text_(ctx.params.layerType||'SEMANTIC',60).toUpperCase(),orderIndex:int_(ctx.params.orderIndex,100,-10000,10000),visible:ctx.params.visible===undefined?true:bool_(ctx.params.visible),styleJson:jsonCell_(ctx.params.style,{},'layer style'),createdAt:now,updatedAt:now,deletedAt:''});return stripInternal_(l);}
function validateGeometry_(g,path,errors){path=path||'geometry';errors=errors||[];if(!g||typeof g!=='object'){errors.push(path+' must be an object.');return errors;}var allowed=['Point','MultiPoint','LineString','MultiLineString','Polygon','MultiPolygon','GeometryCollection'];if(allowed.indexOf(g.type)===-1)errors.push(path+'.type is unsupported: '+g.type);if(g.type==='GeometryCollection'){if(!Array.isArray(g.geometries))errors.push(path+'.geometries must be an array.');else g.geometries.forEach(function(x,i){validateGeometry_(x,path+'.geometries['+i+']',errors);});return errors;}if(!Array.isArray(g.coordinates)){errors.push(path+'.coordinates must be an array.');return errors;}function walk(c,p){if(!Array.isArray(c)){errors.push(p+' must be an array.');return;}if(c.length&&typeof c[0]==='number'){if(c.length<2||!isFinite(Number(c[0]))||!isFinite(Number(c[1])))errors.push(p+' must contain finite x/y or longitude/latitude values.');return;}c.forEach(function(x,i){walk(x,p+'['+i+']');});}walk(g.coordinates,path+'.coordinates');return errors;}
function normalizeGeoFeature_(input){if(input&&input.type==='Feature')return input;return {type:'Feature',geometry:input&&input.geometry?input.geometry:input,properties:input&&input.properties?input.properties:{}};}
function publicMapFeature_(f){return {id:f.id,mapId:f.mapId,layerId:f.layerId||'',featureType:f.featureType,name:f.name,semanticType:f.semanticType,geometry:parseJsonCell_(f.geometryJson,null),properties:parseJsonCell_(f.propertiesJson,{}),linkedEntityType:f.linkedEntityType||'',linkedEntityId:f.linkedEntityId||'',createdAt:f.createdAt,updatedAt:f.updatedAt};}
function createMapFeatureRecord_(ctx,map,layerId,input){var feature=normalizeGeoFeature_(input),errors=validateGeometry_(feature.geometry,'geometry',[]);if(errors.length)throw new ApiError_('INVALID_GEOJSON','Feature geometry is invalid.',errors);var selectedLayerId=String(layerId||input.layerId||'');if(selectedLayerId){var layer=byId_('MapLayers',selectedLayerId,true);if(!layer||layer.deletedAt||layer.mapId!==map.id)throw new ApiError_('MAP_LAYER_NOT_FOUND','Map layer does not belong to this map.');}var props=feature.properties||{},semantic=text_(props.semanticType||input.semanticType||input.type||'LOCATION',100).toUpperCase(),name=text_(props.name||input.name||semantic,200),now=nowIso_();return insert_('MapFeatures',{id:String(feature.id||input.id||id_('mft')),mapId:map.id,layerId:selectedLayerId,featureType:String(feature.geometry.type||'UNKNOWN'),name:name,semanticType:semantic,geometryJson:jsonCell_(feature.geometry,{},'feature geometry'),propertiesJson:jsonCell_(props,{},'feature properties'),linkedEntityType:String(props.linkedEntityType||input.linkedEntityType||''),linkedEntityId:String(props.linkedEntityId||input.linkedEntityId||''),createdAt:now,updatedAt:now,deletedAt:''});}
function routeCreateMapFeature_(ctx){var m=requireMap_(ctx.params.mapId,ctx.user.id,true),input=ctx.params.feature!==undefined?jsonValue_(ctx.params.feature,{},'feature'):ctx.params,row=createMapFeatureRecord_(ctx,m,ctx.params.layerId,input);return publicMapFeature_(row);}
function routeBulkUpsertMapFeatures_(ctx){var m=requireMap_(ctx.params.mapId,ctx.user.id,true),input=jsonValue_(ctx.params.geojson||ctx.params.features,{},'geojson'),features=input.type==='FeatureCollection'?input.features:(Array.isArray(input)?input:[input]),requestedLayerId=String(ctx.params.layerId||'');if(requestedLayerId){var requestedLayer=byId_('MapLayers',requestedLayerId,true);if(!requestedLayer||requestedLayer.deletedAt||requestedLayer.mapId!==m.id)throw new ApiError_('MAP_LAYER_NOT_FOUND','Map layer does not belong to this map.');}if(features.length>TABLEGATE.MAX_MAP_FEATURES_PER_REQUEST)throw new ApiError_('TOO_MANY_FEATURES','Too many map features in one request.',{max:TABLEGATE.MAX_MAP_FEATURES_PER_REQUEST});var created=[];features.forEach(function(f){if(f.id){var existing=byId_('MapFeatures',String(f.id),true);if(existing&&existing.mapId===m.id){var normalized=normalizeGeoFeature_(f),errors=validateGeometry_(normalized.geometry,'geometry',[]);if(errors.length)throw new ApiError_('INVALID_GEOJSON','Feature geometry is invalid.',errors);var props=normalized.properties||{};updateRow_('MapFeatures',existing._row,{layerId:String(requestedLayerId||existing.layerId||''),featureType:normalized.geometry.type,name:nullableText_(props.name,200)||existing.name,semanticType:String(props.semanticType||existing.semanticType||'LOCATION').toUpperCase(),geometryJson:jsonCell_(normalized.geometry,{},'feature geometry'),propertiesJson:jsonCell_(props,{},'feature properties'),linkedEntityType:String(props.linkedEntityType||existing.linkedEntityType||''),linkedEntityId:String(props.linkedEntityId||existing.linkedEntityId||''),updatedAt:nowIso_(),deletedAt:''});created.push(publicMapFeature_(byId_('MapFeatures',existing.id,true)));return;}}created.push(publicMapFeature_(createMapFeatureRecord_(ctx,m,requestedLayerId,f)));});return {count:created.length,features:created};}
function routeValidateGeoJson_(ctx){var input=jsonValue_(ctx.params.geojson||ctx.params.featureCollection||ctx.params.feature,{},'geojson'),features=input.type==='FeatureCollection'?input.features:(Array.isArray(input)?input:[input]),errors=[],warnings=[];features.forEach(function(f,i){var feature=normalizeGeoFeature_(f);validateGeometry_(feature.geometry,'features['+i+'].geometry',errors);var p=feature.properties||{};if(!p.name)warnings.push('features['+i+'] has no properties.name.');if(!p.semanticType)warnings.push('features['+i+'] has no properties.semanticType; clickable locations should declare what they represent.');if(['BUILDING','HOUSE','SHRINE','PARK','SETTLEMENT','SHOP','TEMPLE'].indexOf(String(p.semanticType||'').toUpperCase())!==-1&&['Point','Polygon','MultiPolygon'].indexOf(feature.geometry&&feature.geometry.type)===-1)warnings.push('features['+i+'] semantic type '+p.semanticType+' is usually best represented by a Point or Polygon.');});return {valid:errors.length===0,featureCount:features.length,errors:errors,warnings:warnings};}
function routeGeneratePainterlyMap_(ctx){var p=ctx.params,map=p.mapId?requireMap_(p.mapId,ctx.user.id,true):null,refs=referencePayload_(ctx,array_(p.referenceAttachmentIds)),wrapped=callAiBackend_(ctx,'generatePainterlyMap',{prompt:text_(p.prompt||p.description,16000),referenceImages:refs,width:int_(p.width,map?map.width:4096,512,8192),height:int_(p.height,map?map.height:4096,512,8192),projection:nullableText_(p.projection,80)||(map?map.projection:'PIXEL'),locations:jsonValue_(p.locations,[],'map locations'),roads:jsonValue_(p.roads,[],'map roads'),terrain:jsonValue_(p.terrain,{},'map terrain'),style:nullableText_(p.style,500)||'painterly tabletop fantasy map',requirements:{returnBackgroundImage:true,returnGeoJson:true,alignEveryClickableFeatureToVisibleArt:true,semanticExamples:{park:'visible park or green area',house:'visible house-shaped building',shrine:'visible shrine or sacred structure'},noInvisibleOrMismatchedHitAreas:true},metadata:jsonValue_(p.metadata,{},'map metadata')}),result=unwrapProviderResult_(wrapped),assets=persistProviderAssets_(ctx,result,{tablegateId:map?map.tablegateId:String(p.tablegateId||''),folderId:String(p.folderId||''),prefix:'painterly-map',assetType:'MAP_BACKGROUND',tags:array_(p.tags)});if(!map){var created=routeCreateMap_({params:{projectId:p.projectId,tablegateId:p.tablegateId,name:p.name||'Generated Map',width:p.width||4096,height:p.height||4096,projection:p.projection||'PIXEL',backgroundAttachmentId:assets.length&&assets[0].attachment?assets[0].attachment.id:'',settings:p.settings||{}},user:ctx.user,session:ctx.session});map=byId_('MapProjects',created.map.id,true);}else if(assets.length&&assets[0].attachment)updateRow_('MapProjects',map._row,{backgroundAttachmentId:assets[0].attachment.id,updatedAt:nowIso_()});var geo=result.geojson||result.featureCollection||result.features,features=null;if(geo){features=routeBulkUpsertMapFeatures_({params:{mapId:map.id,layerId:p.layerId,geojson:geo},user:ctx.user,session:ctx.session});}return {map:publicMap_(byId_('MapProjects',map.id,true)),assets:assets,features:features,resultMetadata:result.metadata||{},provider:{requestId:wrapped.requestId,status:wrapped.status}};}

/* ---------- NPC life simulation and transit tracking ---------- */

function publicWorld_(w){return {id:w.id,projectId:w.projectId||'',tablegateId:w.tablegateId||'',ownerId:w.ownerId,name:w.name,currentTime:w.currentTime,timeScale:num_(w.timeScale,1),paused:bool_(w.paused),settings:parseJsonCell_(w.settingsJson,{}),lastTickAt:w.lastTickAt||'',createdAt:w.createdAt,updatedAt:w.updatedAt};}
function requireWorld_(id,userId,manage){var w=byId_('SimulationWorlds',id,true);if(!w||w.deletedAt)throw new ApiError_('WORLD_NOT_FOUND','Simulation world not found.');if(w.ownerId!==userId){if(!w.tablegateId)throw new ApiError_('FORBIDDEN','You cannot access this world.');requireMember_(w.tablegateId,userId);if(manage)requirePermission_(w.tablegateId,userId,PERMISSIONS.MANAGE_HANDOUTS);}return w;}
function routeCreateSimulationWorld_(ctx){var p=ctx.params,project=p.projectId?requireProject_(p.projectId,ctx.user.id,true):null,tablegateId=String(p.tablegateId||(project&&project.tablegateId)||'');if(tablegateId)requireMember_(tablegateId,ctx.user.id);var now=nowIso_(),w=insert_('SimulationWorlds',{id:id_('sim'),projectId:project?project.id:'',tablegateId:tablegateId,ownerId:ctx.user.id,name:text_(p.name,160),currentTime:p.currentTime?new Date(p.currentTime).toISOString():now,timeScale:clamp_(p.timeScale===undefined?1:p.timeScale,0,10000),paused:bool_(p.paused),settingsJson:jsonCell_(p.settings,{},'world settings'),lastTickAt:now,createdAt:now,updatedAt:now,deletedAt:''});return publicWorld_(w);}
function routeListSimulationWorlds_(ctx){var tablegateId=String(ctx.params.tablegateId||'');if(tablegateId)requireMember_(tablegateId,ctx.user.id);return filter_('SimulationWorlds',function(w){return !w.deletedAt&&(w.ownerId===ctx.user.id||(tablegateId&&w.tablegateId===tablegateId));}).map(publicWorld_);}
function routeGetSimulationWorld_(ctx){var w=requireWorld_(ctx.params.worldId,ctx.user.id,false);return {world:publicWorld_(w),npcs:filter_('Npcs',function(n){return n.worldId===w.id&&!n.deletedAt;}).map(publicNpc_),relationships:filter_('NpcRelationships',function(r){return r.worldId===w.id&&!r.deletedAt;}).map(publicRelationship_),transit:transitSnapshot_(w.id)};}
function routeUpdateSimulationWorld_(ctx){var w=requireWorld_(ctx.params.worldId,ctx.user.id,true),p=ctx.params,patch={updatedAt:nowIso_()};if(p.name!==undefined)patch.name=text_(p.name,160);if(p.currentTime!==undefined)patch.currentTime=new Date(p.currentTime).toISOString();if(p.timeScale!==undefined)patch.timeScale=clamp_(p.timeScale,0,10000);if(p.paused!==undefined)patch.paused=bool_(p.paused);if(p.settings!==undefined)patch.settingsJson=jsonCell_(p.settings,{},'world settings');updateRow_('SimulationWorlds',w._row,patch);return publicWorld_(byId_('SimulationWorlds',w.id,true));}
function publicNpc_(n){return {id:n.id,worldId:n.worldId,tablegateId:n.tablegateId||'',ownerId:n.ownerId,name:n.name,pronouns:n.pronouns||'',species:n.species||'',occupation:n.occupation||'',personality:parseJsonCell_(n.personalityJson,{}),needs:parseJsonCell_(n.needsJson,{}),traits:parseJsonCell_(n.traitsJson,{}),locationType:n.locationType||'',locationId:n.locationId||'',state:parseJsonCell_(n.stateJson,{}),avatarAttachmentId:n.avatarAttachmentId||'',createdAt:n.createdAt,updatedAt:n.updatedAt};}
function requireNpc_(id,userId,manage){var n=byId_('Npcs',id,true);if(!n||n.deletedAt)throw new ApiError_('NPC_NOT_FOUND','NPC not found.');requireWorld_(n.worldId,userId,manage);return n;}
function routeCreateNpc_(ctx){var w=requireWorld_(ctx.params.worldId,ctx.user.id,true),p=ctx.params,avatar=String(p.avatarAttachmentId||'');if(avatar){var a=byId_('Attachments',avatar,true);if(!a||a.deletedAt)throw new ApiError_('ATTACHMENT_NOT_FOUND','NPC avatar not found.');requireAttachmentAccess_(a.id,ctx.user.id,a.tablegateId||'',a.dmId||'');}var now=nowIso_(),n=insert_('Npcs',{id:id_('npc'),worldId:w.id,tablegateId:w.tablegateId,ownerId:ctx.user.id,name:text_(p.name,160),pronouns:nullableText_(p.pronouns,120),species:nullableText_(p.species,120),occupation:nullableText_(p.occupation,160),personalityJson:jsonCell_(p.personality,{},'NPC personality'),needsJson:jsonCell_(p.needs,{energy:75,hunger:25,social:50,safety:80},'NPC needs'),traitsJson:jsonCell_(p.traits,{},'NPC traits'),locationType:nullableText_(p.locationType,80),locationId:String(p.locationId||''),stateJson:jsonCell_(p.state,{activity:'idle',mood:'neutral'},'NPC state'),avatarAttachmentId:avatar,createdAt:now,updatedAt:now,deletedAt:''});return publicNpc_(n);}
function routeListNpcs_(ctx){var w=requireWorld_(ctx.params.worldId,ctx.user.id,false);return filter_('Npcs',function(n){return n.worldId===w.id&&!n.deletedAt;}).map(publicNpc_);}
function routeGetNpc_(ctx){var n=requireNpc_(ctx.params.npcId,ctx.user.id,false);return {npc:publicNpc_(n),schedules:filter_('NpcSchedules',function(s){return s.npcId===n.id&&!s.deletedAt;}).map(publicSchedule_),relationships:filter_('NpcRelationships',function(r){return !r.deletedAt&&(r.fromNpcId===n.id||r.toNpcId===n.id);}).map(publicRelationship_)};}
function routeUpdateNpc_(ctx){var n=requireNpc_(ctx.params.npcId,ctx.user.id,true),p=ctx.params,patch={updatedAt:nowIso_()};['name','pronouns','species','occupation','locationType','locationId'].forEach(function(k){if(p[k]!==undefined)patch[k]=k==='name'?text_(p[k],160):nullableText_(p[k],k==='occupation'?160:120);});if(p.avatarAttachmentId!==undefined){var avatar=String(p.avatarAttachmentId||'');if(avatar){var a=byId_('Attachments',avatar,true);if(!a||a.deletedAt)throw new ApiError_('ATTACHMENT_NOT_FOUND','NPC avatar not found.');requireAttachmentAccess_(a.id,ctx.user.id,a.tablegateId||'',a.dmId||'');}patch.avatarAttachmentId=avatar;}if(p.personality!==undefined)patch.personalityJson=jsonCell_(p.personality,{},'NPC personality');if(p.needs!==undefined)patch.needsJson=jsonCell_(p.needs,{},'NPC needs');if(p.traits!==undefined)patch.traitsJson=jsonCell_(p.traits,{},'NPC traits');if(p.state!==undefined)patch.stateJson=jsonCell_(p.state,{},'NPC state');updateRow_('Npcs',n._row,patch);return publicNpc_(byId_('Npcs',n.id,true));}
function routeDeleteNpc_(ctx){var n=requireNpc_(ctx.params.npcId,ctx.user.id,true);updateRow_('Npcs',n._row,{deletedAt:nowIso_(),updatedAt:nowIso_()});return {deleted:true};}
function publicSchedule_(s){return {id:s.id,npcId:s.npcId,dayPattern:s.dayPattern,startTime:s.startTime,endTime:s.endTime,locationType:s.locationType||'',locationId:s.locationId||'',activity:s.activity,priority:num_(s.priority,0),conditions:parseJsonCell_(s.conditionsJson,{}),createdAt:s.createdAt,updatedAt:s.updatedAt};}
function routeCreateNpcSchedule_(ctx){var n=requireNpc_(ctx.params.npcId,ctx.user.id,true),p=ctx.params,now=nowIso_(),s=insert_('NpcSchedules',{id:id_('sch'),npcId:n.id,dayPattern:nullableText_(p.dayPattern,120)||'*',startTime:text_(p.startTime||'00:00',5),endTime:text_(p.endTime||'23:59',5),locationType:nullableText_(p.locationType,80),locationId:String(p.locationId||''),activity:text_(p.activity||'idle',160),priority:int_(p.priority,0,-1000,1000),conditionsJson:jsonCell_(p.conditions,{},'schedule conditions'),createdAt:now,updatedAt:now,deletedAt:''});return publicSchedule_(s);}
function routeListNpcSchedules_(ctx){var n=requireNpc_(ctx.params.npcId,ctx.user.id,false);return filter_('NpcSchedules',function(s){return s.npcId===n.id&&!s.deletedAt;}).sort(function(a,b){return num_(b.priority,0)-num_(a.priority,0)||String(a.startTime).localeCompare(String(b.startTime));}).map(publicSchedule_);}
function publicRelationship_(r){return {id:r.id,worldId:r.worldId,fromNpcId:r.fromNpcId,toNpcId:r.toNpcId,relationshipType:r.relationshipType,affinity:num_(r.affinity,0),trust:num_(r.trust,0),tension:num_(r.tension,0),notes:r.notes||'',metadata:parseJsonCell_(r.metadataJson,{}),createdAt:r.createdAt,updatedAt:r.updatedAt};}
function routeUpsertNpcRelationship_(ctx){var w=requireWorld_(ctx.params.worldId,ctx.user.id,true),p=ctx.params,from=requireNpc_(p.fromNpcId,ctx.user.id,false),to=requireNpc_(p.toNpcId,ctx.user.id,false);if(from.worldId!==w.id||to.worldId!==w.id||from.id===to.id)throw new ApiError_('INVALID_RELATIONSHIP','Both different NPCs must belong to this world.');var existing=findOne_('NpcRelationships',function(r){return r.worldId===w.id&&r.fromNpcId===from.id&&r.toNpcId===to.id&&!r.deletedAt;}),patch={relationshipType:text_(p.relationshipType||'ACQUAINTANCE',100).toUpperCase(),affinity:clamp_(p.affinity===undefined?(existing?existing.affinity:0):p.affinity,-100,100),trust:clamp_(p.trust===undefined?(existing?existing.trust:0):p.trust,-100,100),tension:clamp_(p.tension===undefined?(existing?existing.tension:0):p.tension,0,100),notes:nullableText_(p.notes,4000),metadataJson:jsonCell_(p.metadata,{},'relationship metadata'),updatedAt:nowIso_(),deletedAt:''};if(existing){updateRow_('NpcRelationships',existing._row,patch);return publicRelationship_(byId_('NpcRelationships',existing.id,true));}patch.id=id_('rel');patch.worldId=w.id;patch.fromNpcId=from.id;patch.toNpcId=to.id;patch.createdAt=nowIso_();return publicRelationship_(insert_('NpcRelationships',patch));}
function routeListNpcRelationships_(ctx){var w=requireWorld_(ctx.params.worldId,ctx.user.id,false);return filter_('NpcRelationships',function(r){return r.worldId===w.id&&!r.deletedAt;}).map(publicRelationship_);}
function timeMinutes_(value){var m=/^(\d{1,2}):(\d{2})$/.exec(String(value||''));if(!m)return 0;return clamp_(parseInt(m[1],10),0,23)*60+clamp_(parseInt(m[2],10),0,59);}
function scheduleDayMatches_(pattern,date){pattern=String(pattern||'*').toUpperCase();if(pattern==='*'||pattern==='DAILY')return true;var names=['SUN','MON','TUE','WED','THU','FRI','SAT'],day=names[date.getUTCDay()];return pattern.split(/[\s,|]+/).indexOf(day)!==-1;}
function activeSchedule_(npc,date){var minute=date.getUTCHours()*60+date.getUTCMinutes(),list=filter_('NpcSchedules',function(s){if(s.npcId!==npc.id||s.deletedAt||!scheduleDayMatches_(s.dayPattern,date))return false;var start=timeMinutes_(s.startTime),end=timeMinutes_(s.endTime);return start<=end?(minute>=start&&minute<=end):(minute>=start||minute<=end);}).sort(function(a,b){return num_(b.priority,0)-num_(a.priority,0);});return list[0]||null;}
function recordSimulationEvent_(worldId,type,actorId,targetId,locationId,payload,worldTime){return insert_('SimulationEvents',{id:id_('sev'),worldId:worldId,eventType:type,actorId:actorId||'',targetId:targetId||'',locationId:locationId||'',payloadJson:safeJsonStringify_(payload||{}),worldTime:worldTime,createdAt:nowIso_()});}
function routeTickSimulation_(ctx){var w=requireWorld_(ctx.params.worldId,ctx.user.id,true);if(bool_(w.paused)&&!bool_(ctx.params.force))return {world:publicWorld_(w),advancedMinutes:0,events:[]};var delta=int_(ctx.params.minutes,0,0,10080);if(!delta){var elapsed=Math.max(0,(Date.now()-new Date(w.lastTickAt||w.updatedAt).getTime())/60000);delta=Math.min(1440,Math.round(elapsed*num_(w.timeScale,1)));}var next=new Date(new Date(w.currentTime).getTime()+delta*60000),events=[],npcs=filter_('Npcs',function(n){return n.worldId===w.id&&!n.deletedAt;}).slice(0,TABLEGATE.SIM_TICK_LIMIT);npcs.forEach(function(n){var schedule=activeSchedule_(n,next),state=parseJsonCell_(n.stateJson,{}),needs=parseJsonCell_(n.needsJson,{}),patch={updatedAt:nowIso_()};needs.energy=clamp_(num_(needs.energy,75)+(schedule&&/sleep|rest/i.test(schedule.activity)?delta*0.08:-delta*0.015),0,100);needs.hunger=clamp_(num_(needs.hunger,25)+(schedule&&/eat|meal/i.test(schedule.activity)?-delta*0.12:delta*0.02),0,100);needs.social=clamp_(num_(needs.social,50)+(schedule&&/social|visit|talk|work|market/i.test(schedule.activity)?delta*0.025:-delta*0.006),0,100);if(schedule){if(n.locationId!==schedule.locationId||state.activity!==schedule.activity){events.push(publicSimulationEvent_(recordSimulationEvent_(w.id,'NPC_ACTIVITY_CHANGED',n.id,'',schedule.locationId,{from:state.activity||'',to:schedule.activity},next.toISOString())));}patch.locationType=schedule.locationType;patch.locationId=schedule.locationId;state.activity=schedule.activity;state.scheduleId=schedule.id;}state.mood=needs.energy<20?'exhausted':needs.hunger>80?'hungry':needs.social<15?'lonely':state.mood||'neutral';patch.stateJson=jsonCell_(state,{},'NPC state');patch.needsJson=jsonCell_(needs,{},'NPC needs');updateRow_('Npcs',n._row,patch);});advanceTransitWorld_(w.id,delta,next.toISOString(),events);updateRow_('SimulationWorlds',w._row,{currentTime:next.toISOString(),lastTickAt:nowIso_(),updatedAt:nowIso_()});return {world:publicWorld_(byId_('SimulationWorlds',w.id,true)),advancedMinutes:delta,npcsProcessed:npcs.length,events:events,transit:transitSnapshot_(w.id)};}
function publicSimulationEvent_(e){return {id:e.id,worldId:e.worldId,eventType:e.eventType,actorId:e.actorId||'',targetId:e.targetId||'',locationId:e.locationId||'',payload:parseJsonCell_(e.payloadJson,{}),worldTime:e.worldTime,createdAt:e.createdAt};}
function routeListSimulationEvents_(ctx){var w=requireWorld_(ctx.params.worldId,ctx.user.id,false);return filter_('SimulationEvents',function(e){return e.worldId===w.id;}).sort(function(a,b){return new Date(b.worldTime)-new Date(a.worldTime);}).slice(0,int_(ctx.params.limit,100,1,500)).map(publicSimulationEvent_);}

function publicStop_(s){return {id:s.id,worldId:s.worldId,tablegateId:s.tablegateId||'',name:s.name,stopType:s.stopType,lat:num_(s.lat,0),lng:num_(s.lng,0),featureId:s.featureId||'',metadata:parseJsonCell_(s.metadataJson,{}),createdAt:s.createdAt,updatedAt:s.updatedAt};}
function routeCreateTransitStop_(ctx){var w=requireWorld_(ctx.params.worldId,ctx.user.id,true),p=ctx.params,now=nowIso_(),s=insert_('TransitStops',{id:id_('tst'),worldId:w.id,tablegateId:w.tablegateId,name:text_(p.name,160),stopType:text_(p.stopType||'STOP',80).toUpperCase(),lat:num_(p.lat,0),lng:num_(p.lng,0),featureId:String(p.featureId||''),metadataJson:jsonCell_(p.metadata,{},'stop metadata'),createdAt:now,updatedAt:now,deletedAt:''});return publicStop_(s);}
function routeListTransitStops_(ctx){var w=requireWorld_(ctx.params.worldId,ctx.user.id,false);return filter_('TransitStops',function(s){return s.worldId===w.id&&!s.deletedAt;}).map(publicStop_);}
function publicRoute_(r){return {id:r.id,worldId:r.worldId,tablegateId:r.tablegateId||'',name:r.name,mode:r.mode,stopIds:parseJsonCell_(r.stopIdsJson,[]),schedule:parseJsonCell_(r.scheduleJson,{}),geometry:parseJsonCell_(r.geometryJson,null),metadata:parseJsonCell_(r.metadataJson,{}),createdAt:r.createdAt,updatedAt:r.updatedAt};}
function routeCreateTransitRoute_(ctx){var w=requireWorld_(ctx.params.worldId,ctx.user.id,true),p=ctx.params,stops=unique_(array_(p.stopIds));stops.forEach(function(id){var s=byId_('TransitStops',id,true);if(!s||s.deletedAt||s.worldId!==w.id)throw new ApiError_('INVALID_STOP','Transit stop does not belong to this world: '+id);});var geometry=p.geometry?jsonValue_(p.geometry,null,'route geometry'):null;if(geometry){var errors=validateGeometry_(geometry,'geometry',[]);if(errors.length)throw new ApiError_('INVALID_GEOJSON','Route geometry is invalid.',errors);}var now=nowIso_(),r=insert_('TransitRoutes',{id:id_('trt'),worldId:w.id,tablegateId:w.tablegateId,name:text_(p.name,160),mode:text_(p.mode||'TRANSIT',80).toUpperCase(),stopIdsJson:jsonCell_(stops,[],'route stops'),scheduleJson:jsonCell_(p.schedule,{},'route schedule'),geometryJson:jsonCell_(geometry,null,'route geometry'),metadataJson:jsonCell_(p.metadata,{},'route metadata'),createdAt:now,updatedAt:now,deletedAt:''});return publicRoute_(r);}
function routeListTransitRoutes_(ctx){var w=requireWorld_(ctx.params.worldId,ctx.user.id,false);return filter_('TransitRoutes',function(r){return r.worldId===w.id&&!r.deletedAt;}).map(publicRoute_);}
function publicVehicle_(v){return {id:v.id,worldId:v.worldId,routeId:v.routeId,name:v.name,vehicleType:v.vehicleType,status:v.status,currentStopId:v.currentStopId||'',nextStopId:v.nextStopId||'',progress:num_(v.progress,0),lat:num_(v.lat,0),lng:num_(v.lng,0),capacity:num_(v.capacity,0),occupancy:num_(v.occupancy,0),metadata:parseJsonCell_(v.metadataJson,{}),lastUpdatedAt:v.lastUpdatedAt,createdAt:v.createdAt,updatedAt:v.updatedAt};}
function routeCreateTransitVehicle_(ctx){var w=requireWorld_(ctx.params.worldId,ctx.user.id,true),r=byId_('TransitRoutes',ctx.params.routeId,true);if(!r||r.deletedAt||r.worldId!==w.id)throw new ApiError_('ROUTE_NOT_FOUND','Transit route not found.');var stops=parseJsonCell_(r.stopIdsJson,[]),p=ctx.params,now=nowIso_(),v=insert_('TransitVehicles',{id:id_('tvc'),worldId:w.id,routeId:r.id,name:text_(p.name,160),vehicleType:text_(p.vehicleType||r.mode,80).toUpperCase(),status:text_(p.status||'IN_SERVICE',80).toUpperCase(),currentStopId:String(p.currentStopId||stops[0]||''),nextStopId:String(p.nextStopId||stops[1]||stops[0]||''),progress:clamp_(p.progress||0,0,1),lat:num_(p.lat,0),lng:num_(p.lng,0),capacity:int_(p.capacity,0,0,100000),occupancy:int_(p.occupancy,0,0,100000),metadataJson:jsonCell_(p.metadata,{},'vehicle metadata'),lastUpdatedAt:now,createdAt:now,updatedAt:now,deletedAt:''});return publicVehicle_(v);}
function routeListTransitVehicles_(ctx){var w=requireWorld_(ctx.params.worldId,ctx.user.id,false);return filter_('TransitVehicles',function(v){return v.worldId===w.id&&!v.deletedAt;}).map(publicVehicle_);}
function interpolate_(a,b,t){return num_(a,0)+(num_(b,0)-num_(a,0))*t;}
function advanceTransitWorld_(worldId,minutes,worldTime,eventOut){eventOut=eventOut||[];var stops={};filter_('TransitStops',function(s){return s.worldId===worldId&&!s.deletedAt;}).forEach(function(s){stops[s.id]=s;});var routes={};filter_('TransitRoutes',function(r){return r.worldId===worldId&&!r.deletedAt;}).forEach(function(r){routes[r.id]=r;});filter_('TransitVehicles',function(v){return v.worldId===worldId&&!v.deletedAt&&v.status==='IN_SERVICE';}).forEach(function(v){var r=routes[v.routeId];if(!r)return;var ids=parseJsonCell_(r.stopIdsJson,[]);if(ids.length<2)return;var meta=parseJsonCell_(r.metadataJson,{}),segmentMinutes=Math.max(1,num_(meta.segmentMinutes,30)),progress=num_(v.progress,0)+minutes/segmentMinutes,current=String(v.currentStopId||ids[0]),next=String(v.nextStopId||ids[1]);while(progress>=1){progress-=1;current=next;var idx=ids.indexOf(current);next=ids[(idx+1)%ids.length];var ev=recordSimulationEvent_(worldId,'TRANSIT_ARRIVAL',v.id,'',current,{routeId:r.id,nextStopId:next},worldTime);eventOut.push(publicSimulationEvent_(ev));insert_('TransitEvents',{id:id_('tev'),worldId:worldId,routeId:r.id,vehicleId:v.id,eventType:'ARRIVAL',payloadJson:safeJsonStringify_({stopId:current,nextStopId:next}),worldTime:worldTime,createdAt:nowIso_()});}var a=stops[current],b=stops[next],patch={currentStopId:current,nextStopId:next,progress:progress,lastUpdatedAt:nowIso_(),updatedAt:nowIso_()};if(a&&b){patch.lat=interpolate_(a.lat,b.lat,progress);patch.lng=interpolate_(a.lng,b.lng,progress);}updateRow_('TransitVehicles',v._row,patch);});}
function transitSnapshot_(worldId){return {stops:filter_('TransitStops',function(s){return s.worldId===worldId&&!s.deletedAt;}).map(publicStop_),routes:filter_('TransitRoutes',function(r){return r.worldId===worldId&&!r.deletedAt;}).map(publicRoute_),vehicles:filter_('TransitVehicles',function(v){return v.worldId===worldId&&!v.deletedAt;}).map(publicVehicle_)};}
function routeTransitSnapshot_(ctx){var w=requireWorld_(ctx.params.worldId,ctx.user.id,false);return transitSnapshot_(w.id);}
function routeAdvanceTransit_(ctx){var w=requireWorld_(ctx.params.worldId,ctx.user.id,true),minutes=int_(ctx.params.minutes,1,1,10080),events=[];advanceTransitWorld_(w.id,minutes,w.currentTime,events);return {minutes:minutes,events:events,transit:transitSnapshot_(w.id)};}

/* ---------- Statistics and secure randomization ---------- */

function numericArray_(value){var arr=array_(value).map(Number).filter(function(n){return isFinite(n);});if(!arr.length)throw new ApiError_('NUMERIC_DATA_REQUIRED','Provide at least one finite number.');return arr;}
function quantile_(sorted,q){if(!sorted.length)return null;var pos=(sorted.length-1)*q,base=Math.floor(pos),rest=pos-base;return sorted[base+1]!==undefined?sorted[base]+rest*(sorted[base+1]-sorted[base]):sorted[base];}
function routeComputeStatistics_(ctx){var values=numericArray_(ctx.params.values),sorted=values.slice().sort(function(a,b){return a-b;}),sum=values.reduce(function(a,b){return a+b;},0),mean=sum/values.length,variance=values.reduce(function(a,b){return a+Math.pow(b-mean,2);},0)/(bool_(ctx.params.sample)&&values.length>1?values.length-1:values.length),freq={},modes=[],maxFreq=0;values.forEach(function(v){var k=String(v);freq[k]=(freq[k]||0)+1;maxFreq=Math.max(maxFreq,freq[k]);});Object.keys(freq).forEach(function(k){if(freq[k]===maxFreq)modes.push(Number(k));});return {count:values.length,sum:sum,mean:mean,median:quantile_(sorted,0.5),mode:maxFreq>1?modes:[],minimum:sorted[0],maximum:sorted[sorted.length-1],range:sorted[sorted.length-1]-sorted[0],variance:variance,standardDeviation:Math.sqrt(variance),quartiles:{q1:quantile_(sorted,0.25),q2:quantile_(sorted,0.5),q3:quantile_(sorted,0.75)},percentiles:{p5:quantile_(sorted,0.05),p10:quantile_(sorted,0.10),p90:quantile_(sorted,0.90),p95:quantile_(sorted,0.95)},frequencies:freq};}
function secureShuffle_(arr){arr=arr.slice();for(var i=arr.length-1;i>0;i--){var j=secureRandomInt_(i+1),tmp=arr[i];arr[i]=arr[j];arr[j]=tmp;}return arr;}
function routeRandomize_(ctx){var op=String(ctx.params.operation||'NUMBER').toUpperCase();if(op==='NUMBER'){var min=int_(ctx.params.min,0,-2147483648,2147483647),max=int_(ctx.params.max,100,min,2147483647);var span=max-min+1,value=span<=2147483647?min+secureRandomInt_(span):Math.floor(min+randomUnit_()*span);return {operation:op,value:value,min:min,max:max};}if(op==='CHOICE'){var choices=array_(ctx.params.choices);if(!choices.length)throw new ApiError_('CHOICES_REQUIRED','Provide choices.');var index=secureRandomInt_(choices.length);return {operation:op,index:index,value:choices[index]};}if(op==='SHUFFLE'){return {operation:op,values:secureShuffle_(array_(ctx.params.values||ctx.params.choices))};}if(op==='WEIGHTED_CHOICE'){var items=jsonValue_(ctx.params.items,[],'weighted items');if(!Array.isArray(items)||!items.length)throw new ApiError_('ITEMS_REQUIRED','Provide weighted items.');var total=items.reduce(function(s,x){return s+Math.max(0,num_(x.weight,0));},0);if(total<=0)throw new ApiError_('INVALID_WEIGHTS','At least one weight must be positive.');var pick=randomUnit_()*total,acc=0,selected=items[items.length-1];for(var i=0;i<items.length;i++){acc+=Math.max(0,num_(items[i].weight,0));if(pick<acc){selected=items[i];break;}}return {operation:op,value:selected.value!==undefined?selected.value:selected,selected:selected};}if(op==='UUID')return {operation:op,value:id_(ctx.params.prefix||'rnd')};if(op==='DICE'){var parsed=parseDiceExpression_(ctx.params.expression||ctx.params.dice||'1d20'),rolled=rollDice_(parsed);return {operation:op,expression:parsed.expression,total:rolled.total,detail:rolled.detail};}throw new ApiError_('INVALID_RANDOM_OPERATION','Unsupported randomization operation.');}
function routeRollDistribution_(ctx){var parsed=parseDiceExpression_(ctx.params.expression||ctx.params.dice||'1d20'),trials=int_(ctx.params.trials,1000,1,100000),freq={},sum=0,min=null,max=null;for(var i=0;i<trials;i++){var total=rollDice_(parsed).total;freq[total]=(freq[total]||0)+1;sum+=total;min=min===null?total:Math.min(min,total);max=max===null?total:Math.max(max,total);}return {expression:parsed.expression,trials:trials,mean:sum/trials,minimum:min,maximum:max,frequencies:freq};}

/* ---------- Capability health ---------- */

function routeCapabilities_(ctx){return {apiVersion:TABLEGATE.API_VERSION,schemaVersion:TABLEGATE.SCHEMA_VERSION,capabilities:TABLEGATE_CAPABILITIES_,limits:{maxUploadBytes:int_(PropertiesService.getScriptProperties().getProperty(TABLEGATE.MAX_UPLOAD_PROPERTY),TABLEGATE.DEFAULT_MAX_UPLOAD_BYTES),maxInlineAiFileBytes:int_(PropertiesService.getScriptProperties().getProperty(TABLEGATE.MAX_INLINE_AI_FILE_BYTES_PROPERTY),TABLEGATE.DEFAULT_MAX_INLINE_AI_FILE_BYTES),maxJsonCellChars:TABLEGATE.MAX_JSON_CELL_CHARS,maxMapFeaturesPerRequest:TABLEGATE.MAX_MAP_FEATURES_PER_REQUEST,simulationTickNpcLimit:TABLEGATE.SIM_TICK_LIMIT},platformNotes:{realtimeMedia:'Browser WebRTC carries audio, video, camera, microphone, and screen-share media; Apps Script only authorizes rooms and exchanges signaling.',externalIntelligence:'Image generation, web/image search, model inference, and difficult binary parsing require configured external providers.',learning:'Learning feedback and durable memory improve future context; this script does not retrain or self-modify a foundation model.',scaling:'Apps Script and Google Sheets have execution, storage, email, and URL Fetch quotas; large production deployments should move hot data and media signaling to managed services.'}};}



/* =============================
 * AUDIT, CONFIGURATION, MAINTENANCE
 * ============================= */

function audit_(tablegateId,actorId,action,targetType,targetId,details){return insert_('AuditLog',{id:id_('aud'),tablegateId:tablegateId,actorId:actorId,action:action,targetType:targetType,targetId:targetId,detailsJson:JSON.stringify(details||{}),createdAt:nowIso_()});}
function routeListAuditLog_(ctx){var tablegateId=String(ctx.params.tablegateId||'');requirePermission_(tablegateId,ctx.user.id,PERMISSIONS.VIEW_AUDIT_LOG);var limit=int_(ctx.params.limit,100,1,200),before=String(ctx.params.before||'');var list=filter_('AuditLog',function(a){return a.tablegateId===tablegateId;}).sort(function(a,b){return new Date(b.createdAt)-new Date(a.createdAt);});if(before){var t=new Date(before).getTime();if(isFinite(t))list=list.filter(function(a){return new Date(a.createdAt).getTime()<t;});}return list.slice(0,limit).map(function(a){return {id:a.id,tablegateId:a.tablegateId,actorId:a.actorId,action:a.action,targetType:a.targetType,targetId:a.targetId,details:parseJsonCell_(a.detailsJson,{}),createdAt:a.createdAt};});}

function routeGetClientConfig_(ctx){var props=PropertiesService.getScriptProperties();return {apiVersion:TABLEGATE.API_VERSION,schemaVersion:props.getProperty('TABLEGATE_SCHEMA_VERSION')||TABLEGATE.SCHEMA_VERSION,appName:props.getProperty(TABLEGATE.APP_NAME_PROPERTY)||'Tablegate',maxUploadBytes:int_(props.getProperty(TABLEGATE.MAX_UPLOAD_PROPERTY),TABLEGATE.DEFAULT_MAX_UPLOAD_BYTES),maxInlineAiFileBytes:int_(props.getProperty(TABLEGATE.MAX_INLINE_AI_FILE_BYTES_PROPERTY),TABLEGATE.DEFAULT_MAX_INLINE_AI_FILE_BYTES),sessionDays:int_(props.getProperty(TABLEGATE.SESSION_DAYS_PROPERTY),TABLEGATE.DEFAULT_SESSION_DAYS),registrationMode:props.getProperty(TABLEGATE.REGISTRATION_MODE_PROPERTY)||'INVITE_OR_FIRST_USER',emailVerificationRequired:emailVerificationRequired_(),iceServers:getIceServers_(),capabilities:TABLEGATE_CAPABILITIES_,ai:{enabled:!!props.getProperty(TABLEGATE.AI_BACKEND_URL_PROPERTY),actions:['aiChat','aiRequest','aiHealth','smartAsk','webSearch','imageSearch','generateImage','generateFromReferences','parseFile','generatePainterlyMap'],rulesContext:true,libraryId:TABLEGATE.AI_LIBRARY_ID,libraryVersion:TABLEGATE.AI_LIBRARY_VERSION},integrations:routeListIntegrations_(ctx),polling:{eventsMs:1500,presenceHeartbeatMs:45000,typingRefreshMs:6000,rtcSignalsMs:800}};}

function configureTablegate(options){
  options=options||{};var props=PropertiesService.getScriptProperties();
  if(options.registrationMode!==undefined){var mode=String(options.registrationMode).toUpperCase();if(TABLEGATE.REGISTRATION_MODES.indexOf(mode)===-1)throw new Error('Invalid registrationMode.');props.setProperty(TABLEGATE.REGISTRATION_MODE_PROPERTY,mode);}
  if(options.sessionDays!==undefined)props.setProperty(TABLEGATE.SESSION_DAYS_PROPERTY,String(int_(options.sessionDays,30,1,365)));
  if(options.maxUploadBytes!==undefined)props.setProperty(TABLEGATE.MAX_UPLOAD_PROPERTY,String(int_(options.maxUploadBytes,TABLEGATE.DEFAULT_MAX_UPLOAD_BYTES,1024,20*1024*1024)));
  if(options.iceServers!==undefined){if(!Array.isArray(options.iceServers))throw new Error('iceServers must be an array.');props.setProperty(TABLEGATE.RTC_ICE_PROPERTY,JSON.stringify(options.iceServers));}
  if(options.aiBackendUrl!==undefined){var aiUrl=String(options.aiBackendUrl||'').trim();if(aiUrl&&!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec(?:\?.*)?$/.test(aiUrl))throw new Error('Invalid aiBackendUrl.');props.setProperty(TABLEGATE.AI_BACKEND_URL_PROPERTY,aiUrl||TABLEGATE.DEFAULT_AI_BACKEND_URL);}
  if(options.aiTimeoutMs!==undefined)props.setProperty(TABLEGATE.AI_TIMEOUT_MS_PROPERTY,String(int_(options.aiTimeoutMs,TABLEGATE.DEFAULT_AI_TIMEOUT_MS,1000,30000)));
  if(options.appName!==undefined)props.setProperty(TABLEGATE.APP_NAME_PROPERTY,String(options.appName||'Tablegate').slice(0,120));
  if(options.publicAppUrl!==undefined){var publicUrl=String(options.publicAppUrl||'').trim();if(publicUrl&&!/^https:\/\//i.test(publicUrl))throw new Error('publicAppUrl must use HTTPS.');props.setProperty(TABLEGATE.PUBLIC_APP_URL_PROPERTY,publicUrl);}
  if(options.emailVerificationRequired!==undefined)props.setProperty(TABLEGATE.EMAIL_VERIFICATION_REQUIRED_PROPERTY,String(!!options.emailVerificationRequired));
  if(options.emailCodeMinutes!==undefined)props.setProperty(TABLEGATE.EMAIL_CODE_MINUTES_PROPERTY,String(int_(options.emailCodeMinutes,30,5,1440)));
  if(options.resetCodeMinutes!==undefined)props.setProperty(TABLEGATE.RESET_CODE_MINUTES_PROPERTY,String(int_(options.resetCodeMinutes,15,5,1440)));
  if(options.maxInlineAiFileBytes!==undefined)props.setProperty(TABLEGATE.MAX_INLINE_AI_FILE_BYTES_PROPERTY,String(int_(options.maxInlineAiFileBytes,TABLEGATE.DEFAULT_MAX_INLINE_AI_FILE_BYTES,1024,10*1024*1024)));
  if(options.integrations!==undefined)configureTablegateIntegrations(options.integrations);
  var result={appName:props.getProperty(TABLEGATE.APP_NAME_PROPERTY),publicAppUrl:props.getProperty(TABLEGATE.PUBLIC_APP_URL_PROPERTY)||'',registrationMode:props.getProperty(TABLEGATE.REGISTRATION_MODE_PROPERTY),emailVerificationRequired:emailVerificationRequired_(),emailCodeMinutes:props.getProperty(TABLEGATE.EMAIL_CODE_MINUTES_PROPERTY),resetCodeMinutes:props.getProperty(TABLEGATE.RESET_CODE_MINUTES_PROPERTY),sessionDays:props.getProperty(TABLEGATE.SESSION_DAYS_PROPERTY),maxUploadBytes:props.getProperty(TABLEGATE.MAX_UPLOAD_PROPERTY),maxInlineAiFileBytes:props.getProperty(TABLEGATE.MAX_INLINE_AI_FILE_BYTES_PROPERTY),iceServers:getIceServers_(),aiBackendUrl:props.getProperty(TABLEGATE.AI_BACKEND_URL_PROPERTY),aiTimeoutMs:props.getProperty(TABLEGATE.AI_TIMEOUT_MS_PROPERTY),integrations:Object.keys(getIntegrationConfigs_()),aiLibraryId:TABLEGATE.AI_LIBRARY_ID,aiLibraryVersion:TABLEGATE.AI_LIBRARY_VERSION};console.log(JSON.stringify(result,null,2));return result;
}


function configureTablegateIntegrations(configs){
  if(!configs||typeof configs!=='object'||Array.isArray(configs))throw new Error('integrations must be an object keyed by provider name.');
  var clean={};Object.keys(configs).forEach(function(name){var c=configs[name]||{};if(!/^[A-Za-z0-9_.-]{1,80}$/.test(name))throw new Error('Invalid integration provider name: '+name);if(c.endpoint&&!/^https:\/\//i.test(c.endpoint))throw new Error('Integration endpoints must use HTTPS.');clean[name]={endpoint:String(c.endpoint||''),method:String(c.method||'post').toLowerCase(),enabled:c.enabled!==false,description:String(c.description||'').slice(0,500),capabilities:Array.isArray(c.capabilities)?c.capabilities.map(String).slice(0,100):[],headers:c.headers&&typeof c.headers==='object'?c.headers:{},secretProperty:String(c.secretProperty||''),headerName:String(c.headerName||'Authorization'),secretPrefix:c.secretPrefix===undefined?'Bearer ':String(c.secretPrefix)};});PropertiesService.getScriptProperties().setProperty(TABLEGATE.INTEGRATIONS_PROPERTY,JSON.stringify(clean));return Object.keys(clean);
}
function setTablegateSecret(propertyName,value){propertyName=String(propertyName||'').trim();if(!/^TABLEGATE_SECRET_[A-Z0-9_]{1,80}$/.test(propertyName))throw new Error('Secret property names must begin TABLEGATE_SECRET_ and use uppercase letters, digits, or underscores.');PropertiesService.getScriptProperties().setProperty(propertyName,String(value||''));return {stored:true,propertyName:propertyName};}

function runTablegateMaintenance(){
  resetRuntime_();ensureConfigured_();var lock=LockService.getScriptLock();lock.waitLock(30000);try{var now=Date.now(),counts={sessions:0,events:0,signals:0,typing:0,uploads:0,authChallenges:0,expiredMemory:0};
    filter_('Sessions',function(s){return s.revokedAt||new Date(s.expiresAt).getTime()<now-7*86400000;}).sort(function(a,b){return b._row-a._row;}).forEach(function(r){deleteRow_('Sessions',r._row);counts.sessions++;});
    filter_('Events',function(r){return new Date(r.expiresAt).getTime()<now;}).sort(function(a,b){return b._row-a._row;}).forEach(function(r){deleteRow_('Events',r._row);counts.events++;});
    filter_('RtcSignals',function(r){return r.consumedAt||new Date(r.expiresAt).getTime()<now;}).sort(function(a,b){return b._row-a._row;}).forEach(function(r){deleteRow_('RtcSignals',r._row);counts.signals++;});
    filter_('Typing',function(r){return new Date(r.expiresAt).getTime()<now;}).sort(function(a,b){return b._row-a._row;}).forEach(function(r){deleteRow_('Typing',r._row);counts.typing++;});
    filter_('AuthChallenges',function(r){return r.usedAt||new Date(r.expiresAt).getTime()<now-86400000;}).sort(function(a,b){return b._row-a._row;}).forEach(function(r){deleteRow_('AuthChallenges',r._row);counts.authChallenges++;});
    filter_('MemoryItems',function(r){return !r.deletedAt&&r.expiresAt&&new Date(r.expiresAt).getTime()<now;}).forEach(function(r){updateRow_('MemoryItems',r._row,{deletedAt:nowIso_(),updatedAt:nowIso_()});counts.expiredMemory++;});
    filter_('Attachments',function(a){return !a.deletedAt&&!attachmentInUse_(a.id)&&new Date(a.createdAt).getTime()<now-24*3600000;}).sort(function(a,b){return b._row-a._row;}).forEach(function(a){try{DriveApp.getFileById(a.fileId).setTrashed(true);}catch(e){}updateRow_('Attachments',a._row,{deletedAt:nowIso_()});counts.uploads++;});
    console.log(JSON.stringify(counts));return counts;
  }finally{lock.releaseLock();}}

function createTablegateMaintenanceTrigger(){ScriptApp.getProjectTriggers().filter(function(t){return t.getHandlerFunction()==='runTablegateMaintenance';}).forEach(function(t){ScriptApp.deleteTrigger(t);});return ScriptApp.newTrigger('runTablegateMaintenance').timeBased().everyHours(1).create().getUniqueId();}

/* =============================
 * ROUTE TABLE
 * ============================= */

var ROUTES_ = Object.freeze({
  health:{fn:routeHealth_,auth:false,write:false},

  capabilities:{fn:routeCapabilities_,auth:false,write:false},
  requestEmailVerification:{fn:routeRequestEmailVerification_,auth:false,write:true},verifyEmail:{fn:routeVerifyEmail_,auth:false,write:true},forgotPassword:{fn:routeForgotPassword_,auth:false,write:true},resetPassword:{fn:routeResetPassword_,auth:false,write:true},
  createAiConversation:{fn:routeCreateAiConversation_,write:true},listAiConversations:{fn:routeListAiConversations_,write:false},getAiConversation:{fn:routeGetAiConversation_,write:false},updateAiConversation:{fn:routeUpdateAiConversation_,write:true},deleteAiConversation:{fn:routeDeleteAiConversation_,write:true},sendAiMessage:{fn:routeSendAiMessage_,write:true},smartAsk:{fn:routeSmartAsk_,write:true},
  createMemory:{fn:routeCreateMemory_,write:true},listMemory:{fn:routeListMemory_,write:false},searchMemory:{fn:routeSearchMemory_,write:false},updateMemory:{fn:routeUpdateMemory_,write:true},deleteMemory:{fn:routeDeleteMemory_,write:true},
  createPersonality:{fn:routeCreatePersonality_,write:true},listPersonalities:{fn:routeListPersonalities_,write:false},updatePersonality:{fn:routeUpdatePersonality_,write:true},deletePersonality:{fn:routeDeletePersonality_,write:true},submitLearningFeedback:{fn:routeSubmitLearningFeedback_,write:true},
  ingestKnowledge:{fn:routeIngestKnowledge_,write:true},listKnowledge:{fn:routeListKnowledge_,write:false},searchKnowledge:{fn:routeSearchKnowledge_,write:false},deleteKnowledge:{fn:routeDeleteKnowledge_,write:true},createCitation:{fn:routeCreateCitation_,write:true},listCitations:{fn:routeListCitations_,write:false},
  webSearch:{fn:routeWebSearch_,write:true},imageSearch:{fn:routeImageSearch_,write:true},generateImage:{fn:routeGenerateImage_,write:true},generateFromReferences:{fn:routeGenerateFromReferences_,write:true},parseAttachment:{fn:routeParseAttachment_,write:false},
  createAssetFolder:{fn:routeCreateAssetFolder_,write:true},listAssetFolders:{fn:routeListAssetFolders_,write:false},organizeAttachment:{fn:routeOrganizeAttachment_,write:true},listAssets:{fn:routeListAssets_,write:false},searchAssets:{fn:routeSearchAssets_,write:false},
  listIntegrations:{fn:routeListIntegrations_,write:false},invokeIntegration:{fn:routeInvokeIntegration_,write:true},
  createProject:{fn:routeCreateProject_,write:true},listProjects:{fn:routeListProjects_,write:false},getProject:{fn:routeGetProject_,write:false},updateProject:{fn:routeUpdateProject_,write:true},deleteProject:{fn:routeDeleteProject_,write:true},createProjectItem:{fn:routeCreateProjectItem_,write:true},listProjectItems:{fn:routeListProjectItems_,write:false},updateProjectItem:{fn:routeUpdateProjectItem_,write:true},deleteProjectItem:{fn:routeDeleteProjectItem_,write:true},compileProject:{fn:routeCompileProject_,write:true},
  createMap:{fn:routeCreateMap_,write:true},listMaps:{fn:routeListMaps_,write:false},getMap:{fn:routeGetMap_,write:false},updateMap:{fn:routeUpdateMap_,write:true},deleteMap:{fn:routeDeleteMap_,write:true},createMapLayer:{fn:routeCreateMapLayer_,write:true},createMapFeature:{fn:routeCreateMapFeature_,write:true},bulkUpsertMapFeatures:{fn:routeBulkUpsertMapFeatures_,write:true},validateGeoJson:{fn:routeValidateGeoJson_,write:false},generatePainterlyMap:{fn:routeGeneratePainterlyMap_,write:true},
  createSimulationWorld:{fn:routeCreateSimulationWorld_,write:true},listSimulationWorlds:{fn:routeListSimulationWorlds_,write:false},getSimulationWorld:{fn:routeGetSimulationWorld_,write:false},updateSimulationWorld:{fn:routeUpdateSimulationWorld_,write:true},createNpc:{fn:routeCreateNpc_,write:true},listNpcs:{fn:routeListNpcs_,write:false},getNpc:{fn:routeGetNpc_,write:false},updateNpc:{fn:routeUpdateNpc_,write:true},deleteNpc:{fn:routeDeleteNpc_,write:true},createNpcSchedule:{fn:routeCreateNpcSchedule_,write:true},listNpcSchedules:{fn:routeListNpcSchedules_,write:false},upsertNpcRelationship:{fn:routeUpsertNpcRelationship_,write:true},listNpcRelationships:{fn:routeListNpcRelationships_,write:false},tickSimulation:{fn:routeTickSimulation_,write:true},listSimulationEvents:{fn:routeListSimulationEvents_,write:false},
  createTransitStop:{fn:routeCreateTransitStop_,write:true},listTransitStops:{fn:routeListTransitStops_,write:false},createTransitRoute:{fn:routeCreateTransitRoute_,write:true},listTransitRoutes:{fn:routeListTransitRoutes_,write:false},createTransitVehicle:{fn:routeCreateTransitVehicle_,write:true},listTransitVehicles:{fn:routeListTransitVehicles_,write:false},transitSnapshot:{fn:routeTransitSnapshot_,write:false},advanceTransit:{fn:routeAdvanceTransit_,write:true},
  computeStatistics:{fn:routeComputeStatistics_,write:false},randomize:{fn:routeRandomize_,write:false},rollDistribution:{fn:routeRollDistribution_,write:false},
  aiHealth:{fn:routeAiHealth_,write:false},aiChat:{fn:routeAiChat_,write:false},aiRequest:{fn:routeAiRequest_,write:false},
  previewInvite:{fn:routePreviewInvite_,auth:false,write:false},
  register:{fn:routeRegister_,auth:false,write:true},
  login:{fn:routeLogin_,auth:false,write:true},
  logout:{fn:routeLogout_,write:true},logoutAll:{fn:routeLogoutAll_,write:true},me:{fn:routeMe_,write:false},updateProfile:{fn:routeUpdateProfile_,write:true},changePassword:{fn:routeChangePassword_,write:true},searchUsers:{fn:routeSearchUsers_,write:false},getClientConfig:{fn:routeGetClientConfig_,write:false},
  listTablegates:{fn:routeListTablegates_,write:false},createTablegate:{fn:routeCreateTablegate_,write:true},getTablegate:{fn:routeGetTablegate_,write:false},updateTablegate:{fn:routeUpdateTablegate_,write:true},deleteTablegate:{fn:routeDeleteTablegate_,write:true},leaveTablegate:{fn:routeLeaveTablegate_,write:true},transferOwnership:{fn:routeTransferOwnership_,write:true},
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

  listGameSystems:{fn:routeListGameSystems_,write:false},getGameSystem:{fn:routeGetGameSystem_,write:false},createGameSystem:{fn:routeCreateGameSystem_,write:true},updateGameSystem:{fn:routeUpdateGameSystem_,write:true},cloneGameSystem:{fn:routeCloneGameSystem_,write:true},deleteGameSystem:{fn:routeDeleteGameSystem_,write:true},
  listTablegateSystems:{fn:routeListTablegateSystems_,write:false},attachSystemToTablegate:{fn:routeAttachSystemToTablegate_,write:true},updateTablegateSystem:{fn:routeUpdateTablegateSystem_,write:true},detachSystemFromTablegate:{fn:routeDetachSystemFromTablegate_,write:true},
  createSystemDocument:{fn:routeCreateSystemDocument_,write:true},listSystemDocuments:{fn:routeListSystemDocuments_,write:false},deleteSystemDocument:{fn:routeDeleteSystemDocument_,write:true},importSystemReference:{fn:routeImportSystemReference_,write:true},
  createHomebrew:{fn:routeCreateHomebrew_,write:true},listHomebrew:{fn:routeListHomebrew_,write:false},getHomebrew:{fn:routeGetHomebrew_,write:false},updateHomebrew:{fn:routeUpdateHomebrew_,write:true},deleteHomebrew:{fn:routeDeleteHomebrew_,write:true},
  createCharacter:{fn:routeCreateCharacter_,write:true},listCharacters:{fn:routeListCharacters_,write:false},getCharacter:{fn:routeGetCharacter_,write:false},updateCharacter:{fn:routeUpdateCharacter_,write:true},deleteCharacter:{fn:routeDeleteCharacter_,write:true},
  createRollMacro:{fn:routeCreateRollMacro_,write:true},listRollMacros:{fn:routeListRollMacros_,write:false},updateRollMacro:{fn:routeUpdateRollMacro_,write:true},deleteRollMacro:{fn:routeDeleteRollMacro_,write:true},resolveMechanic:{fn:routeResolveMechanic_,write:true},listMechanicRolls:{fn:routeListMechanicRolls_,write:false},
  listPersonas:{fn:routeListPersonas_,write:false},createPersona:{fn:routeCreatePersona_,write:true},updatePersona:{fn:routeUpdatePersona_,write:true},deletePersona:{fn:routeDeletePersona_,write:true},rollDice:{fn:routeRollDice_,write:true},listDiceRolls:{fn:routeListDiceRolls_,write:false},listAuditLog:{fn:routeListAuditLog_,write:false}
});
