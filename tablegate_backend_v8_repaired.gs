/**
 * TableGate Backend V8 FINAL — Google Apps Script (single-file deployment)
 * File name: tablegate_backend_v8.gs
 *
 * MERGED FEATURE SET
 * - Open community registration plus public, request-to-join, and invite-only tablegates
 * - Public all-ages joins begin as Visitors; admin approval is required for Player abilities
 * - Text, announcement, handout, voice, and video channels grouped by category
 * - Anyone can create TTRPG tablegates, share optional links, and join discoverable open games
 * - Tablegate/channel/member/role/invite management and audit logging
 * - Protected Owner hierarchy and first-active-admin succession when an owner deletes their account
 * - Channel chat, DMs, group DMs, replies, edits, soft-delete, purge, pins,
 *   reactions, attachments, mentions, search, typing, unread/read markers
 * - Friends, blocks, ignores, profiles, presence, notifications, and safeguarded account closure
 * - Group Finder feeds, hard dealbreakers, explainable matching, Right Now posts, public venues/events, applications, and pre-game lobbies
 * - Central zero-tolerance safety cases, private incident journals, immutable message revisions, evidence access logs, appeals, and anti-retaliation controls
 * - Minor-safe discovery and communication defaults without requiring general ID verification
 * - Voice state, DM calls, WebRTC offer/answer/ICE signaling, screen-share state,
 *   push-to-talk state, and whisper signaling
 * - Tablegate character personas and auditable tablegate-side dice rolls
 * - Polling event gateway as an Apps Script-compatible Socket.io fallback
 * - Authenticated AI chat/request proxy to the configured AI Apps Script backend
 * - Durable AI conversations, scoped memory, knowledge retrieval, citations, personalities
 * - Email verification, expiring password reset codes, projects, assets, maps, NPC/transit simulation
 * - Installable PWA manifest/config support for desktop, mobile, and tablet
 * - External web/image search, image generation, reference generation, and parsing provider orchestration
 * - Drive-backed large-library storage shared across desktop, mobile, and tablet
 * - Synced documents, folders, categories, tags, scans, OCR handoff, and transcripts
 * - Read-aloud preparation, synchronized reading progress, and accessibility preferences
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
  API_VERSION: '8.0.0-final',
  SCHEMA_VERSION: '2026-07-31.11',
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
  PUBLIC_LIBRARY_DRIVE_FOLDER_PROPERTY: 'TABLEGATE_PUBLIC_LIBRARY_DRIVE_FOLDER_ID',
  SMS_WEBHOOK_URL_PROPERTY: 'TABLEGATE_SMS_WEBHOOK_URL',
  SMS_WEBHOOK_TOKEN_PROPERTY: 'TABLEGATE_SMS_WEBHOOK_TOKEN',
  EMAIL_CODE_MINUTES_PROPERTY: 'TABLEGATE_EMAIL_CODE_MINUTES',
  RESET_CODE_MINUTES_PROPERTY: 'TABLEGATE_RESET_CODE_MINUTES',
  MAX_INLINE_AI_FILE_BYTES_PROPERTY: 'TABLEGATE_MAX_INLINE_AI_FILE_BYTES',
  INTEGRATIONS_PROPERTY: 'TABLEGATE_INTEGRATIONS_JSON',
  PWA_THEME_COLOR_PROPERTY: 'TABLEGATE_PWA_THEME_COLOR',
  PWA_BACKGROUND_COLOR_PROPERTY: 'TABLEGATE_PWA_BACKGROUND_COLOR',
  PWA_ICON_192_PROPERTY: 'TABLEGATE_PWA_ICON_192_URL',
  PWA_ICON_512_PROPERTY: 'TABLEGATE_PWA_ICON_512_URL',
  PWA_MASKABLE_ICON_PROPERTY: 'TABLEGATE_PWA_MASKABLE_ICON_URL',
  AGE_ASSURANCE_PROVIDERS_PROPERTY: 'TABLEGATE_AGE_ASSURANCE_PROVIDERS_JSON',
  AGE_ASSURANCE_CALLBACK_SECRET_PROPERTY: 'TABLEGATE_AGE_ASSURANCE_CALLBACK_SECRET',
  AGE_ASSURANCE_CALLBACK_URL_PROPERTY: 'TABLEGATE_AGE_ASSURANCE_CALLBACK_URL',
  AGE_ASSURANCE_VALID_DAYS_PROPERTY: 'TABLEGATE_AGE_ASSURANCE_VALID_DAYS',
  SAFETY_REVIEWER_EMAILS_PROPERTY: 'TABLEGATE_SAFETY_REVIEWER_EMAILS_JSON',
  LAW_ENFORCEMENT_CONTACT_PROPERTY: 'TABLEGATE_LAW_ENFORCEMENT_CONTACT',
  AI_LIBRARY_ID: '1YSRVPzfI1eq2WvlxR3q3ptoBlBJyWJNkgv1UEr3BLv9NgDs0MNxYEn76',
  AI_LIBRARY_VERSION: '1',
  DEFAULT_AI_BACKEND_URL: 'https://script.google.com/macros/s/AKfycbzko-wf92rlr5M6MOSVZQRH0xTL_K8Jhk-qvGSX85IWFcWCFGzcWby9CJriCdlHBRM/exec',
  DEFAULT_AI_TIMEOUT_MS: 30000,
  DEFAULT_MAX_INLINE_AI_FILE_BYTES: 4 * 1024 * 1024,
  DEFAULT_GROUP_FINDER_POST_DAYS: 30,
  MAX_GROUP_FINDER_ACTIVE_POSTS: 20,
  MAX_GROUP_FINDER_TAGS: 24,
  MIN_GROUP_FINDER_RADIUS_MILES: 5,
  MAX_GROUP_FINDER_RADIUS_MILES: 50,
  AUTH_CHALLENGE_MAX_ATTEMPTS: 5,
  AI_CONVERSATION_CONTEXT: 80,
  MAX_KNOWLEDGE_TEXT_CHARS: 40000,
  MAX_MAP_FEATURES_PER_REQUEST: 500,
  SIM_TICK_LIMIT: 500,
  DEFAULT_SESSION_DAYS: 30,
  DEFAULT_MAX_UPLOAD_BYTES: 8 * 1024 * 1024,
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
  DEFAULT_AGE_ASSURANCE_VALID_DAYS: 365,
  SAFETY_EVIDENCE_HOLD_DAYS: 365,
  ACCOUNT_IDENTITY_RETENTION_DAYS: 365,
  ADULT_REASON_MIN_LENGTH: 20,
  SYSTEM_TYPES: ['BUILT_IN', 'CUSTOM', 'HOMEBREW', 'GENERIC', 'HYBRID'],
  SYSTEM_VISIBILITIES: ['PUBLIC', 'UNLISTED', 'TABLEGATE', 'PRIVATE'],
  SYSTEM_MODES: ['SINGLE', 'MULTI', 'HYBRID', 'SYSTEM_AGNOSTIC'],
  CONTENT_VISIBILITIES: ['PUBLIC', 'TABLEGATE', 'PRIVATE'],
  CONTENT_STATUSES: ['DRAFT', 'ACTIVE', 'ARCHIVED'],
  MECHANIC_ENGINES: ['DICE_EXPRESSION', 'DICE_POOL', 'FUDGE', 'PERCENTILE', 'DUAL_DICE', 'CUSTOM_FACES', 'CARD_DRAW', 'TABLE_LOOKUP', 'MANUAL', 'CUSTOM'],
  REGISTRATION_MODES: ['OPEN', 'INVITE_ONLY', 'INVITE_OR_FIRST_USER', 'CLOSED'],
  TABLEGATE_JOIN_POLICIES: ['OPEN', 'REQUEST', 'INVITE_ONLY'],
  VISITOR_CHANNEL_MODES: ['NONE', 'READ', 'CHAT', 'OBSERVE'],
  ADMIN_TITLES: ['ADMIN', 'DM', 'GM', 'KEEPER', 'STORYTELLER', 'REFEREE', 'MASTER_OF_LORE', 'MOL', 'FACILITATOR', 'HOST', 'OTHER'],
  ADULT_CONTENT_CATEGORIES: ['SEXUAL_CONTENT', 'GRAPHIC_VIOLENCE', 'HORROR', 'SUBSTANCE_USE', 'MATURE_SOCIAL_THEMES', 'OTHER'],
  AGE_ASSURANCE_STATUSES: ['PENDING', 'VERIFIED', 'DENIED', 'FAILED', 'EXPIRED', 'REVOKED'],
  PLAYER_APPLICATION_STATUSES: ['PENDING', 'APPROVED', 'DECLINED', 'WITHDRAWN', 'REVOKED'],
  SAFETY_REPORT_CATEGORIES: ['CHILD_SAFETY_OR_GROOMING', 'SUSPECTED_CHILD_SEXUAL_EXPLOITATION_MATERIAL', 'SEXUAL_SOLICITATION', 'SEXTORTION_OR_INTIMATE_IMAGE_ABUSE', 'STALKING_OR_BLOCK_EVASION', 'THREAT_OF_VIOLENCE', 'DOXXING_OR_LOCATION_EXPOSURE', 'SEXUAL_HARASSMENT', 'COERCION_OR_ABUSE_OF_AUTHORITY', 'PERSISTENT_UNWANTED_CONTACT', 'UNSAFE_IN_PERSON_CONDUCT', 'DISCRIMINATION_OR_TARGETED_HARASSMENT', 'SCAM_OR_FINANCIAL_EXPLOITATION', 'RETALIATION', 'MODERATOR_ADMIN_OWNER_OR_HOST_MISCONDUCT', 'EVIDENCE_DELETION_OR_COVER_UP', 'BAN_EVASION', 'MADE_ME_UNCOMFORTABLE', 'PREDATORY_BEHAVIOR', 'GROOMING', 'MINOR_SAFETY', 'SEXUAL_MISCONDUCT', 'THREATS', 'HARASSMENT', 'DOXXING', 'IMPERSONATION', 'OTHER'],
  SAFETY_REPORT_STATUSES: ['DRAFT', 'SUBMITTED', 'OPEN', 'TRIAGED', 'PROTECTIVE_ACTION', 'UNDER_REVIEW', 'ACTIONED', 'REFERRED_TO_LAW_ENFORCEMENT', 'APPEALED', 'CLOSED'],
  FINDER_PLAY_MODES: ['IN_PERSON_ONLY', 'ONLINE_OK', 'ONLINE_ONLY'],
  FINDER_POST_TYPES: ['LOOKING_FOR_GROUP', 'LOOKING_FOR_PLAYERS', 'LOOKING_FOR_HOST', 'GROUP_LOOKING_FOR_HOST', 'OFFERING_TO_HOST', 'HOST_OFFERING_TO_RUN', 'COHOST_OR_SAFETY_FACILITATOR', 'OPEN_TABLE', 'ONE_SHOT', 'RIGHT_NOW', 'PUBLIC_EVENT', 'PUBLIC_VENUE', 'TABLEGATE_COMMUNITY'],
  FINDER_POST_STATUSES: ['ACTIVE', 'RECRUITING', 'WAITLISTED', 'FULL', 'PAUSED', 'FILLED', 'COMPLETED', 'ARCHIVED'],
  FINDER_INTEREST_STATUSES: ['SENT', 'ACCEPTED', 'DECLINED', 'WITHDRAWN'],
  FINDER_ROLES: ['PLAYER', 'DM', 'GM', 'MOL', 'MASTER_OF_LORE', 'STORYTELLER', 'KEEPER', 'REFEREE', 'FACILITATOR', 'HOST', 'OTHER'],
  PUBLIC_PLACE_TYPES: ['LIBRARY', 'COMMUNITY_CENTER', 'GAME_STORE', 'CAFE', 'TRANSIT_HUB', 'PARK', 'MUSEUM', 'UNIVERSITY', 'PUBLIC_BUILDING', 'OTHER_PUBLIC_PLACE'],
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

var TABLEGATE_V8_FINAL = Object.freeze({
  PRODUCT_MODEL: 'COMPLETELY_FREE',
  CORE_FEATURES_ALWAYS_FREE: true,
  PAID_RANKING_ALLOWED: false,
  PAID_CONTACT_ALLOWED: false,
  PAID_SAFETY_ALLOWED: false,
  RIGHT_NOW_DEFAULT_MINUTES: 60,
  RIGHT_NOW_MAX_MINUTES: 240,
  STALE_LOCAL_DAYS: 30,
  ACCOUNT_AGE_BANDS: ['UNSPECIFIED', 'MINOR', 'ADULT'],
  GUARDIAN_STATUSES: ['NOT_REQUIRED', 'PENDING', 'CONFIRMED'],
  FINDER_CONTACT_POLICIES: ['INTEREST_THEN_LOBBY', 'APPLICATION_THEN_LOBBY', 'OPEN_APPLICATION', 'INTEREST_THEN_DM'],
  FINDER_VIEWS: ['NEWEST', 'COMPATIBLE', 'RIGHT_NOW', 'LOCAL_EVENTS', 'MY_ACTIVITY'],
  DISTANCE_BANDS: ['WITHIN_5_MILES', '6_TO_10_MILES', '11_TO_25_MILES', '26_TO_50_MILES', 'ONLINE'],
  REPORTABLE_OBJECTS: ['USER', 'PROFILE', 'DISCOVERY_CARD', 'GROUP_FINDER_POST', 'RIGHT_NOW_POST', 'GROUP_FINDER_INTEREST', 'MESSAGE', 'VOICE_SESSION', 'VIDEO_SESSION', 'ATTACHMENT', 'IMAGE', 'PUBLIC_EVENT', 'PUBLIC_VENUE', 'TABLEGATE', 'ROLE_ASSIGNMENT', 'MODERATOR_ACTION', 'OWNERSHIP_TRANSFER', 'OFF_PLATFORM_CONDUCT'],
  REPORTER_ROLES: ['AFFECTED_PERSON', 'WITNESS', 'GUARDIAN_OR_TRUSTED_ADULT', 'REPORTING_FOR_SOMEONE_ELSE', 'ANONYMOUS_OR_NO_ACCOUNT'],
  SAFETY_URGENCY: ['IMMEDIATE_DANGER', 'CHILD_IMMEDIATE_RISK', 'CREDIBLE_THREAT_OR_STALKING', 'SEXUAL_EXPLOITATION_OR_GROOMING', 'SERIOUS_NOT_IMMEDIATE', 'PATTERN_DOCUMENTATION', 'GENERAL_POLICY_VIOLATION'],
  SAFETY_SEVERITIES: ['CRITICAL', 'HIGH', 'STANDARD'],
  SAFETY_FINDINGS: ['NO_VIOLATION_FOUND', 'INSUFFICIENT_EVIDENCE_PROTECTIONS_REMAIN', 'BOUNDARY_OR_CONDUCT_VIOLATION', 'SEVERE_SAFETY_VIOLATION', 'PERMANENT_PREDATORY_CONDUCT_BAN', 'EXTERNAL_REFERRAL_MADE', 'MALICIOUS_REPORT_VIOLATION', 'SYSTEM_OR_MODERATOR_FAILURE'],
  PROTECTIVE_ACTIONS: ['NO_CONTACT_ORDER', 'DM_RESTRICTION', 'DISCOVERY_REMOVAL', 'RIGHT_NOW_SUSPENSION', 'YOUTH_SPACE_SUSPENSION', 'ROLE_SUSPENSION', 'GROUP_ADMIN_FREEZE', 'TEMPORARY_ACCOUNT_SUSPENSION', 'PERMANENT_ACCOUNT_BAN', 'LINKED_ACCOUNT_REVIEW', 'PUBLIC_EVENT_RESTRICTION', 'EVIDENCE_LEGAL_HOLD'],
  CENTRAL_ACTION_STATUSES: ['ACTIVE', 'EXPIRED', 'REVOKED'],
  CASE_UPDATE_TYPES: ['REPORT_SUBMITTED', 'REPORTER_NOTE', 'EVIDENCE_ADDED', 'STATUS_CHANGED', 'PROTECTIVE_ACTION', 'RETALIATION_REPORTED', 'POTENTIAL_RETALIATION', 'EXTERNAL_REFERRAL', 'APPEAL_SUBMITTED', 'APPEAL_DECIDED', 'SAFE_CONTACT_UPDATED'],
  APPEAL_STATUSES: ['SUBMITTED', 'UNDER_REVIEW', 'UPHELD', 'MODIFIED', 'OVERTURNED', 'CLOSED'],
  SAFETY_RESPONSE_WINDOWS_HOURS: {CRITICAL:1, HIGH:24, STANDARD:72},
  SAFETY_NUDGES: [
    'Do not share a home address in public posts.',
    'Meet at a public place and tell a trusted person.',
    'Urgency is not a reason to skip screening.',
    'A host role does not grant authority over personal boundaries.',
    'You may leave a game at any time.',
    'In-character conduct still requires real-world consent.',
    'Never send intimate images to prove identity or trust.',
    'Adults must not move minors into private or disappearing communication.'
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

var VISITOR_PERMISSIONS =
  PERMISSIONS.READ_MESSAGES |
  PERMISSIONS.CONNECT_VOICE;

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
  Users: ['id','email','username','discriminator','passwordSalt','passwordHash','avatarAttachmentId','bannerAttachmentId','bio','status','customStatus','createdAt','updatedAt','lastSeenAt','disabled','discoverable','emailVerified','emailVerifiedAt','failedLoginCount','lockedUntil','deletedAt','deletionReason','ageBand','guardianStatus','minorPrivacyLocked','safetyOrientationAt','lastReconfirmedAt','profileSlug','phone','phoneVerified','phoneVerifiedAt','twoFactorEnabled','twoFactorMethod','followNotificationPreference'],
  Sessions: ['id','userId','tokenHash','createdAt','expiresAt','lastSeenAt','revokedAt','userAgent'],
  Tablegates: ['id','name','description','iconAttachmentId','ownerId','isPublic','inviteOnly','createdAt','updatedAt','deletedAt','primarySystemId','systemMode','systemConfigJson','houseRulesJson','safetyToolsJson','joinPolicy','tagsJson','language','adultOnly','maxMembers','adultReason','adultContentCategoriesJson','defaultAdminTitle','customAdminTitle'],
  Members: ['id','tablegateId','userId','nickname','joinedAt','updatedAt','leftAt','timedOutUntil','adminTitle','customAdminTitle'],
  Bans: ['id','tablegateId','userId','actorId','reason','createdAt','revokedAt','revokedBy'],
  Roles: ['id','tablegateId','name','color','permissions','position','isManaged','managedKey','createdAt','updatedAt'],
  MemberRoles: ['id','tablegateId','userId','roleId','createdAt'],
  Categories: ['id','tablegateId','name','position','createdBy','createdAt','updatedAt','deletedAt'],
  Channels: ['id','tablegateId','categoryId','name','topic','type','position','userLimit','slowmodeSeconds','isPrivate','allowedRoleIds','isSystem','createdBy','createdAt','updatedAt','deletedAt','visitorMode'],
  Invites: ['id','tablegateId','code','createdBy','maxUses','uses','expiresAt','revokedAt','createdAt'],
  Messages: ['id','scopeType','scopeId','tablegateId','authorId','personaId','messageType','content','attachmentIds','replyToId','mentionUserIds','mentionRoleIds','mentionsEveryone','isPinned','pinnedBy','pinnedAt','createdAt','editedAt','deletedAt','deletedBy','safetyLockedAt'],
  Reactions: ['id','messageId','userId','emoji','createdAt'],
  ChannelReads: ['id','channelId','userId','lastMessageId','lastReadAt'],
  DmChannels: ['id','type','pairKey','name','iconAttachmentId','ownerId','createdAt','updatedAt','closedAt'],
  DmParticipants: ['id','dmId','userId','role','joinedAt','leftAt'],
  Friendships: ['id','pairKey','requesterId','addresseeId','status','createdAt','updatedAt'],
  Follows: ['id','pairKey','followerId','followedId','status','notificationPreference','createdAt','updatedAt'],
  SafetyRelations: ['id','userId','targetUserId','type','createdAt','revokedAt'],
  Presence: ['id','userId','status','customStatus','lastSeenAt','updatedAt'],
  Typing: ['id','scopeType','scopeId','userId','expiresAt','updatedAt'],
  VoiceStates: ['id','tablegateId','channelId','userId','sessionId','muted','deafened','videoEnabled','screenSharing','pushToTalk','whispering','joinedAt','updatedAt','listenOnly'],
  Calls: ['id','dmId','initiatorId','status','createdAt','startedAt','endedAt','updatedAt'],
  CallParticipants: ['id','callId','userId','status','joinedAt','leftAt','updatedAt'],
  RtcSignals: ['id','roomType','roomId','fromUserId','toUserId','signalType','signalJson','createdAt','expiresAt','consumedAt'],
  Attachments: ['id','ownerId','tablegateId','dmId','scopeType','scopeId','messageId','fileId','originalName','storedName','mimeType','sizeBytes','sha256','createdAt','deletedAt','safetyHoldUntil'],
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
  TwoFactorSettings: ['id','userId','enabled','method','phone','phoneVerified','createdAt','updatedAt'],
  TwoFactorChallenges: ['id','userId','method','codeHash','createdAt','expiresAt','usedAt','attempts','metadataJson'],
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
  DiscoveryProfiles: ['id','userId','headline','about','desiredRolesJson','offeredRolesJson','systemIdsJson','customSystemsJson','tagsJson','playModesJson','timezone','languagesJson','availabilityJson','accessibilityJson','safetyPreferencesJson','answersJson','createdAt','updatedAt','deletedAt','requirementsJson','preferencesJson','contentBoundariesJson','exploreOptOut','lastReconfirmedAt'],
  PublicLocations: ['id','ownerId','label','placeType','city','region','country','lat','lng','isDefault','visibility','createdAt','updatedAt','deletedAt','lastReconfirmedAt','verificationStatus','venueListingId'],
  GroupFinderPosts: ['id','ownerId','tablegateId','postType','title','body','desiredRolesJson','offeredRolesJson','systemIdsJson','customSystemsJson','tagsJson','playMode','publicLocationId','radiusMiles','scheduleJson','timezone','languagesJson','experienceLevel','accessibilityJson','safetyToolsJson','answersJson','agePolicy','seatsAvailable','status','visibility','contactPolicy','expiresAt','createdAt','updatedAt','deletedAt','requirementsJson','preferencesJson','contentBoundariesJson','isRightNow','rightNowUntil','lastReconfirmedAt','freshnessState','preGameLobbyId','eventId','venueId','reviewStatus','safetyCompletenessJson'],
  GroupFinderInterests: ['id','postId','userId','message','offeredRolesJson','status','dmId','createdAt','updatedAt','respondedAt','answersJson','followUpJson','preGameLobbyId'],
  GroupFinderReports: ['id','postId','reporterId','reason','details','status','createdAt','reviewedAt','reviewedBy'],
  TablegateJoinRequests: ['id','tablegateId','userId','message','status','createdAt','updatedAt','respondedAt','respondedBy','requestType','ageAssuranceId','inviteId'],
  PlayerApplications: ['id','tablegateId','userId','message','status','createdAt','updatedAt','respondedAt','respondedBy'],
  AgeAssuranceRequests: ['id','userId','provider','stateHash','status','over18','providerReference','requestedFor','tablegateId','createdAt','updatedAt','verifiedAt','expiresAt','metadataJson'],
  AccountDeletionRecords: ['id','userId','originalEmail','originalUsername','originalDiscriminator','deletedAt','retentionUntil','ownershipTransfersJson','metadataJson'],
  SafetyReports: ['id','reporterId','reportedUserId','tablegateId','scopeType','scopeId','category','summary','details','messageIdsJson','attachmentIdsJson','evidenceJson','immediateDanger','status','policeReportNumber','lawEnforcementAgency','preservationUntil','createdAt','updatedAt','reviewedAt','reviewedBy','reporterRole','urgency','safeContactJson','supportPersonJson','anonymousContactHash','linkedReportId','centralOnly','severity','findingOutcome','protectiveActionsJson','holdActive','lastStatusAt'],
  SafetyEvidence: ['id','reportId','evidenceType','sourceId','snapshotJson','createdAt','integrityHash','quarantined','originalCapturedAt','retentionUntil'],
  MessageRevisions: ['id','messageId','revisionNumber','editorId','revisionType','content','attachmentIdsJson','snapshotJson','integrityHash','createdAt'],
  PreGameLobbies: ['id','postId','interestId','dmId','ownerId','applicantId','tablegateId','safetyObserverId','status','createdAt','updatedAt','closedAt'],
  PublicVenueListings: ['id','ownerId','publicLocationId','name','description','venueType','websiteUrl','accessibilityJson','safetyNotesJson','lastReconfirmedAt','status','createdAt','updatedAt','deletedAt'],
  PublicEvents: ['id','ownerId','tablegateId','venueId','publicLocationId','title','description','startAt','endAt','timezone','playMode','systemIdsJson','tagsJson','agePolicy','capacity','status','lastReconfirmedAt','createdAt','updatedAt','deletedAt'],
  HiddenDiscoveryItems: ['id','userId','objectType','objectId','createdAt','revokedAt'],
  IncidentJournals: ['id','userId','title','status','safeContactJson','createdAt','updatedAt','deletedAt'],
  IncidentEntries: ['id','journalId','userId','occurredAt','peopleJson','rolesJson','tablegateId','locationText','narrative','linkedObjectsJson','attachmentIdsJson','witnessesJson','boundaryText','responseText','impactText','requestedOutcome','createdAt','updatedAt','deletedAt'],
  SafetyCaseUpdates: ['id','reportId','actorId','actorType','updateType','message','metadataJson','visibleToReporter','createdAt'],
  SafetyEvidenceAccess: ['id','reportId','evidenceId','actorId','action','reason','exportReference','createdAt'],
  SafetyAppeals: ['id','reportId','appellantId','actionId','reason','evidenceJson','status','reviewedBy','decision','createdAt','updatedAt','reviewedAt'],
  GlobalSafetyActions: ['id','reportId','subjectUserId','targetType','targetId','actionType','reason','status','startsAt','expiresAt','createdBy','createdAt','updatedAt','revokedAt','revokedBy','metadataJson'],
  ParticipationHistory: ['id','tablegateId','userId','eventType','sessionId','recordedBy','occurredAt','metadataJson'],
  GuardianLinks: ['id','minorUserId','guardianUserId','status','createdAt','updatedAt','confirmedAt','revokedAt'],
  TrustedContacts: ['id','userId','contactUserId','label','status','createdAt','updatedAt','confirmedAt','revokedAt'],
  SafetyCheckIns: ['id','userId','publicEventId','tablegateId','publicLocationId','trustedContactIdsJson','startAt','expectedEndAt','status','note','createdAt','updatedAt','checkedInAt','completedAt','cancelledAt','attentionAt'],
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
  // Version 8 remains intentionally open to everyone. Invite links remain optional.
  props.setProperty(TABLEGATE.REGISTRATION_MODE_PROPERTY, 'OPEN');
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
  props.setProperty(TABLEGATE.EMAIL_VERIFICATION_REQUIRED_PROPERTY, 'false');
  if (!props.getProperty(TABLEGATE.PUBLIC_LIBRARY_DRIVE_FOLDER_PROPERTY)) props.setProperty(TABLEGATE.PUBLIC_LIBRARY_DRIVE_FOLDER_PROPERTY, '13Oealaxh3SYpn45Lw0RdKYvwwrupAseY');
  if (!props.getProperty(TABLEGATE.SMS_WEBHOOK_URL_PROPERTY)) props.setProperty(TABLEGATE.SMS_WEBHOOK_URL_PROPERTY, '');
  if (!props.getProperty(TABLEGATE.SMS_WEBHOOK_TOKEN_PROPERTY)) props.setProperty(TABLEGATE.SMS_WEBHOOK_TOKEN_PROPERTY, '');
  if (!props.getProperty(TABLEGATE.EMAIL_CODE_MINUTES_PROPERTY)) props.setProperty(TABLEGATE.EMAIL_CODE_MINUTES_PROPERTY, '30');
  if (!props.getProperty(TABLEGATE.RESET_CODE_MINUTES_PROPERTY)) props.setProperty(TABLEGATE.RESET_CODE_MINUTES_PROPERTY, '15');
  if (!props.getProperty(TABLEGATE.MAX_INLINE_AI_FILE_BYTES_PROPERTY)) props.setProperty(TABLEGATE.MAX_INLINE_AI_FILE_BYTES_PROPERTY, String(TABLEGATE.DEFAULT_MAX_INLINE_AI_FILE_BYTES));
  if (!props.getProperty(TABLEGATE.INTEGRATIONS_PROPERTY)) props.setProperty(TABLEGATE.INTEGRATIONS_PROPERTY, '{}');
  if (!props.getProperty(TABLEGATE.PWA_THEME_COLOR_PROPERTY)) props.setProperty(TABLEGATE.PWA_THEME_COLOR_PROPERTY, '#00ffff');
  if (!props.getProperty(TABLEGATE.PWA_BACKGROUND_COLOR_PROPERTY)) props.setProperty(TABLEGATE.PWA_BACKGROUND_COLOR_PROPERTY, '#07181c');
  if (!props.getProperty(TABLEGATE.PWA_ICON_192_PROPERTY)) props.setProperty(TABLEGATE.PWA_ICON_192_PROPERTY, '');
  if (!props.getProperty(TABLEGATE.PWA_ICON_512_PROPERTY)) props.setProperty(TABLEGATE.PWA_ICON_512_PROPERTY, '');
  if (!props.getProperty(TABLEGATE.PWA_MASKABLE_ICON_PROPERTY)) props.setProperty(TABLEGATE.PWA_MASKABLE_ICON_PROPERTY, '');
  if (!props.getProperty(TABLEGATE.AGE_ASSURANCE_PROVIDERS_PROPERTY)) props.setProperty(TABLEGATE.AGE_ASSURANCE_PROVIDERS_PROPERTY, '[]');
  if (!props.getProperty(TABLEGATE.AGE_ASSURANCE_CALLBACK_SECRET_PROPERTY)) props.setProperty(TABLEGATE.AGE_ASSURANCE_CALLBACK_SECRET_PROPERTY, randomToken_(4));
  if (!props.getProperty(TABLEGATE.AGE_ASSURANCE_CALLBACK_URL_PROPERTY)) props.setProperty(TABLEGATE.AGE_ASSURANCE_CALLBACK_URL_PROPERTY, '');
  if (!props.getProperty(TABLEGATE.AGE_ASSURANCE_VALID_DAYS_PROPERTY)) props.setProperty(TABLEGATE.AGE_ASSURANCE_VALID_DAYS_PROPERTY, String(TABLEGATE.DEFAULT_AGE_ASSURANCE_VALID_DAYS));
  if (!props.getProperty(TABLEGATE.SAFETY_REVIEWER_EMAILS_PROPERTY)) props.setProperty(TABLEGATE.SAFETY_REVIEWER_EMAILS_PROPERTY, '[]');
  if (!props.getProperty(TABLEGATE.LAW_ENFORCEMENT_CONTACT_PROPERTY)) props.setProperty(TABLEGATE.LAW_ENFORCEMENT_CONTACT_PROPERTY, '');
  if (!props.getProperty('TABLEGATE_OCR_WEBHOOK_URL')) props.setProperty('TABLEGATE_OCR_WEBHOOK_URL', '');
  if (!props.getProperty('TABLEGATE_OCR_API_KEY')) props.setProperty('TABLEGATE_OCR_API_KEY', '');
  if (!props.getProperty('TABLEGATE_SPEECH_TO_TEXT_WEBHOOK_URL')) props.setProperty('TABLEGATE_SPEECH_TO_TEXT_WEBHOOK_URL', '');
  if (!props.getProperty('TABLEGATE_SPEECH_TO_TEXT_API_KEY')) props.setProperty('TABLEGATE_SPEECH_TO_TEXT_API_KEY', '');
  props.setProperty('TABLEGATE_SCHEMA_VERSION', TABLEGATE.SCHEMA_VERSION);
  resetRuntime_();
  var seededSystems = seedBuiltInSystems_();
  var migratedV7 = migrateTablegateV7_();
  var version8Storage = TableGateBorrowed.setup();
  var version8FinalMigration = migrateTablegateV8Final_();

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
    version7Migration: migratedV7,
    version8StorageAndAccessibility: version8Storage,
    version8FinalMigration: version8FinalMigration,
    capabilities: TABLEGATE_CAPABILITIES_,
    emailVerificationRequired: emailVerificationRequired_(),
    ageAssuranceConfigured: getAgeAssuranceProviders_().length > 0,
    ageAssurancePolicy: 'Only creating or joining an 18+ tablegate requires third-party age assurance. Tablegate never stores ID scans.',
    freeAccessPolicy: 'Every core TableGate feature, including matching, messaging after consent, safety, accessibility, and Right Now, is free. Paid ranking and paid safety bypasses do not exist.',
    finalSafetyAndDiscovery: {hardDealbreakers:true,rightNow:true,preGameLobbies:true,minorSafeContact:true,incidentJournals:true,messageRevisions:true,evidenceAccessLogs:true,centralSafetyActions:true,appeals:true},
    ownershipPolicy: 'The owner is protected from peer-admin removal or demotion. Account deletion transfers each owned tablegate to the earliest-added active admin.',
    mailQuotaRemaining: MailApp.getRemainingDailyQuota(),
    nextStep: 'Deploy this script as a versioned web app executing as you, with access set to Anyone (including anonymous visitors, shown by Apps Script APIs as ANYONE_ANONYMOUS) so registration and public discovery can be reached before sign-in.'
  };
  console.log(JSON.stringify(result, null, 2));
  return result;
}


function migrateTablegateV8Final_(){var now=nowIso_(),users=0,profiles=0,posts=0;rows_('Users').forEach(function(u){var patch={};if(!u.ageBand)patch.ageBand='UNSPECIFIED';if(!u.guardianStatus)patch.guardianStatus='NOT_REQUIRED';if(u.minorPrivacyLocked==='')patch.minorPrivacyLocked=false;if(!u.lastReconfirmedAt)patch.lastReconfirmedAt=u.updatedAt||u.createdAt||now;if(Object.keys(patch).length){updateRow_('Users',u._row,patch);users++;}});rows_('DiscoveryProfiles').forEach(function(p){var patch={};if(!p.requirementsJson)patch.requirementsJson='{}';if(!p.preferencesJson)patch.preferencesJson='{}';if(!p.contentBoundariesJson)patch.contentBoundariesJson='{}';if(p.exploreOptOut==='')patch.exploreOptOut=false;if(!p.lastReconfirmedAt)patch.lastReconfirmedAt=p.updatedAt||p.createdAt||now;if(Object.keys(patch).length){updateRow_('DiscoveryProfiles',p._row,patch);profiles++;}});rows_('GroupFinderPosts').forEach(function(p){var patch={};if(!p.requirementsJson)patch.requirementsJson='{}';if(!p.preferencesJson)patch.preferencesJson='{}';if(!p.contentBoundariesJson)patch.contentBoundariesJson='{}';if(p.isRightNow==='')patch.isRightNow=p.postType==='RIGHT_NOW';if(!p.lastReconfirmedAt)patch.lastReconfirmedAt=p.updatedAt||p.createdAt||now;if(!p.freshnessState)patch.freshnessState=finderFreshnessState_(p);if(!p.contactPolicy||p.contactPolicy==='INTEREST_THEN_DM')patch.contactPolicy='INTEREST_THEN_LOBBY';if(!p.reviewStatus)patch.reviewStatus='CLEAR';if(!p.safetyCompletenessJson)patch.safetyCompletenessJson='{}';if(Object.keys(patch).length){updateRow_('GroupFinderPosts',p._row,patch);posts++;}});return {usersUpdated:users,profilesUpdated:profiles,postsUpdated:posts,coreFeaturesFree:true};}

function doGet(e) {
  var action = String(e && e.parameter && e.parameter.action || '').trim();
  if (action === 'manifest' || action === 'pwa-manifest') {
    resetRuntime_();
    ensureConfigured_();
    return ContentService.createTextOutput(JSON.stringify(buildPwaManifest_(), null, 2)).setMimeType(ContentService.MimeType.JSON);
  }
  return handleRequest_(e, 'GET');
}

function doPost(e) {
  return handleRequest_(e, 'POST');
}

function tablegateBorrowedRouteMeta_(action) {
  var publicActions = {
    'tablegate.storage.health':true,
    'tablegate.storage.actions':true
  };
  var readOnlyActions = {
    'tablegate.storage.health':true,
    'tablegate.storage.actions':true,
    'tablegate.storage.summary':true,
    'tablegate.device.list':true,
    'tablegate.sync.state.load':true,
    'tablegate.sync.changes.list':true,
    'tablegate.storage.folder.list':true,
    'tablegate.storage.category.list':true,
    'tablegate.storage.file.get':true,
    'tablegate.storage.file.list':true,
    'tablegate.document.get':true,
    'tablegate.document.list':true,
    'tablegate.document.search':true,
    'tablegate.document.export':true,
    'tablegate.transcript.list':true,
    'tablegate.accessibility.preferences.get':true,
    'tablegate.document.read.prepare':true,
    'tablegate.document.read.progress.get':true,
    'tablegate.storage.export':true
  };
  return {auth:!publicActions[action], write:!readOnlyActions[action]};
}

function tablegateBorrowedActor_(params, user) {
  params = params || {};
  var nested = params.data && typeof params.data === 'object' ? params.data :
    (params.payload && typeof params.payload === 'object' ? params.payload : {});
  var explicitTablegateId = String(
    nested.tablegateId || params.tablegateId || nested.serverId || params.serverId ||
    nested.groupId || params.groupId || ''
  ).trim();
  var serverId = explicitTablegateId || 'global';
  var roles = [];

  if (user && explicitTablegateId) {
    var tablegate = byId_('Tablegates', explicitTablegateId, true);
    if (tablegate && !tablegate.deletedAt) {
      var member = requireMember_(explicitTablegateId, user.id);
      roles = roleIds_(member);
    }
  }

  return {
    ownerKey:user ? user.id : 'public-system',
    tenantKey:'tablegate',
    serverId:serverId,
    userId:user ? user.id : 'public-system',
    roles:roles
  };
}

/**
 * Authentication adapter consumed by the integrated TableGateBorrowed module.
 * Direct editor calls may provide a normal TableGate session token. Routed web
 * requests use the already-authenticated context injected by handleRequest_.
 */
function TABLEGATE_RESOLVE_ACTOR(payload) {
  payload = payload || {};
  if (payload.__tablegateActor && typeof payload.__tablegateActor === 'object') {
    return payload.__tablegateActor;
  }
  var token = String(payload.token || (payload.data && payload.data.token) || '').trim();
  if (!token) throw new ApiError_('UNAUTHENTICATED', 'A TableGate session token is required.');
  var auth = authenticate_(token);
  return tablegateBorrowedActor_(payload, auth.user);
}

function routeTablegateBorrowed_(ctx) {
  ctx.params.__tablegateActor = tablegateBorrowedActor_(ctx.params, ctx.user);
  var result = TableGateBorrowed.route(ctx.action, ctx.params);
  if (result && result.ok === false && !result.conflict && result.supported !== false) {
    throw new ApiError_('STORAGE_ERROR', result.error || result.message || 'TableGate storage request failed.', result);
  }
  return result;
}

function handleRequest_(e, method) {
  resetRuntime_();
  try {
    ensureConfigured_();
    var params = parseRequest_(e, method);
    var action = String(params.action || (method === 'GET' ? 'health' : '')).trim();
    if (!action) throw new ApiError_('ACTION_REQUIRED', 'An action is required.');
    var borrowedAction = typeof TableGateBorrowed !== 'undefined' && TableGateBorrowed.handles(action);
    var route = borrowedAction ? tablegateBorrowedRouteMeta_(action) : ROUTES_[action];
    if (!route) throw new ApiError_('UNKNOWN_ACTION', 'Unknown action: ' + action);

    var ctx = { params: params, method: method, action: action, user: null, session: null };
    if (route.auth !== false) {
      var auth = authenticate_(params.token);
      ctx.user = auth.user;
      ctx.session = auth.session;
      enforceCentralSafetyAccess_(ctx);
    }

    var data;
    if (route.write) {
      var lock = LockService.getScriptLock();
      if (!lock.tryLock(25000)) throw new ApiError_('BUSY', 'The tablegate is busy. Please retry.');
      try {
        data = borrowedAction ? routeTablegateBorrowed_(ctx) : route.fn(ctx);
      } finally {
        lock.releaseLock();
      }
    } else {
      data = borrowedAction ? routeTablegateBorrowed_(ctx) : route.fn(ctx);
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

function hmacSha256Hex_(value, secret) {
  var bytes = Utilities.computeHmacSha256Signature(String(value), String(secret), Utilities.Charset.UTF_8);
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

function uniqueProfileSlug_(username, currentId) {
  var base=String(username||'tablegater').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,48)||'tablegater';
  var slug=base, n=2;
  while(findOne_('Users',function(u){return u.id!==currentId&&!bool_(u.disabled)&&String(u.profileSlug||'').toLowerCase()===slug.toLowerCase();})) slug=base+'-'+(n++);
  return slug;
}
function profileUrlFor_(slug) {
  var base=String(PropertiesService.getScriptProperties().getProperty(TABLEGATE.PUBLIC_APP_URL_PROPERTY)||'').replace(/\/$/,'');
  return base ? base+'/'+encodeURIComponent(slug) : '/'+encodeURIComponent(slug);
}
function publicUser_(user) {
  if (!user) return null;
  var followers=filter_('Follows',function(f){return f.followedId===user.id&&f.status==='ACTIVE';}).length;
  var following=filter_('Follows',function(f){return f.followerId===user.id&&f.status==='ACTIVE';}).length;
  var friends=filter_('Friendships',function(f){return (f.requesterId===user.id||f.addresseeId===user.id)&&f.status==='ACCEPTED';}).length;
  return {
    id:user.id, username:user.username, discriminator:user.discriminator, profileSlug:user.profileSlug||uniqueProfileSlug_(user.username,user.id), profileUrl:profileUrlFor_(user.profileSlug||uniqueProfileSlug_(user.username,user.id)),
    displayTag:user.username + '#' + user.discriminator,
    avatarAttachmentId:user.avatarAttachmentId || '', bannerAttachmentId:user.bannerAttachmentId || '',
    bio:user.bio || '', status:user.status || 'OFFLINE', customStatus:user.customStatus || '',
    lastSeenAt:user.lastSeenAt || '', createdAt:user.createdAt,
    followerCount:followers, followingCount:following, friendCount:friends,
    trustSignals:publicTrustSignals_(user)
  };
}

function privateUser_(user) {
  var out = publicUser_(user);
  out.email = user.email;
  out.phone = user.phone || '';
  out.phoneVerified = bool_(user.phoneVerified);
  out.twoFactorEnabled = bool_(user.twoFactorEnabled);
  out.twoFactorMethod = user.twoFactorMethod || '';
  out.followNotificationPreference = user.followNotificationPreference || 'LOVE';
  out.discoverable = bool_(user.discoverable);
  out.emailVerified = emailVerified_(user);
  out.emailVerifiedAt = user.emailVerifiedAt || '';
  out.ageBand = normalizeAgeBand_(user.ageBand);
  out.guardianStatus = user.guardianStatus || (out.ageBand === 'MINOR' ? 'PENDING' : 'NOT_REQUIRED');
  out.minorPrivacyLocked = bool_(user.minorPrivacyLocked) || out.ageBand === 'MINOR';
  out.safetyOrientationAt = user.safetyOrientationAt || '';
  out.lastReconfirmedAt = user.lastReconfirmedAt || user.updatedAt || user.createdAt;
  out.centralSafetyRestrictions = activeCentralActionsForUser_(user.id).map(publicCentralSafetyAction_);
  return out;
}

function routeHealth_() {
  var props = PropertiesService.getScriptProperties();
  return {
    service:'TableGate Backend V8 FINAL', status:'ok', apiVersion:TABLEGATE.API_VERSION,
    schemaVersion:props.getProperty('TABLEGATE_SCHEMA_VERSION') || TABLEGATE.SCHEMA_VERSION,
    registrationMode:props.getProperty(TABLEGATE.REGISTRATION_MODE_PROPERTY) || 'OPEN',
    emailVerificationRequired:emailVerificationRequired_(), capabilities:TABLEGATE_CAPABILITIES_,
    features:['open all-ages community registration','public Visitor access','admin-approved Player promotion','Visitor observation and non-player chat','system-appropriate admin titles','third-party age assurance only for creating or joining 18+ tablegates','mature-content reason requirements','safety reporting without age verification','evidence preservation and police-reference export','protected owner hierarchy and automatic ownership succession','group finder and compatibility matching','roles and permissions','multi-system TTRPG data','chat and DMs','attachments and organized assets','listen-only WebRTC observation','personas and characters','secure dice and statistics','AI conversations','memory and learning feedback','knowledge and citations','projects and worldbuilding','interactive maps','NPC life simulation','transit tracking','email verification','password recovery','configured integrations','cross-device Drive-backed storage','document folders and categories','document scanning and OCR handoff','transcripts','read-aloud preparation','synced accessibility preferences','synced reading progress'],
    communityPolicy:{ttrpgForEveryone:true,matureThemesAgeGated:true,ageAssurance:publicAgeAssurancePolicy_(),visitorMembership:true,playerApprovalRequired:true,adminTitles:TABLEGATE.ADMIN_TITLES,safetyReportsDoNotRequireAgeVerification:true,ownerProtectedFromPeerAdmins:true,accountDeletionSuccession:'FIRST_ACTIVE_ADMIN_BY_ADMIN_GRANT_TIME'},
    ai:{configured:!!props.getProperty(TABLEGATE.AI_BACKEND_URL_PROPERTY),libraryId:TABLEGATE.AI_LIBRARY_ID,libraryVersion:TABLEGATE.AI_LIBRARY_VERSION},
    storageAndAccessibility:TableGateBorrowed.health(),
    platformNotes:{realtimeMedia:'Media is peer-to-peer WebRTC in the browser; Apps Script provides authorization and signaling only.',externalProviders:'Generation, model inference, web/image search, difficult binary parsing, and age assurance require configured independent providers.',lawEnforcement:'Tablegate can preserve records and provide an export, but cannot determine jurisdiction, make an emergency call, or file a police report for the user.'}
  };
}

function routeRegister_(ctx) {
  var p = ctx.params;
  var email = validateEmail_(p.email);
  var username = validateUsername_(p.username);
  var password = validatePassword_(p.password);
  var inviteCode = String(p.inviteCode || '').trim();
  var mode = PropertiesService.getScriptProperties().getProperty(TABLEGATE.REGISTRATION_MODE_PROPERTY) || 'OPEN';
  var activeUsers = filter_('Users', function(u) { return !bool_(u.disabled); });
  var invite = inviteCode ? validateInviteCode_(inviteCode, null, false) : null;

  if (mode === 'CLOSED') throw new ApiError_('REGISTRATION_CLOSED', 'Registration is closed.');
  if (mode === 'INVITE_ONLY' && !invite) throw new ApiError_('INVITE_REQUIRED', 'A valid tablegate invite is required.');
  if (mode === 'INVITE_OR_FIRST_USER' && activeUsers.length > 0 && !invite) throw new ApiError_('INVITE_REQUIRED', 'A valid tablegate invite is required.');
  if (findOne_('Users', function(u) { return lower_(u.email) === email; })) throw new ApiError_('EMAIL_IN_USE', 'That email is already registered.');

  var verificationRequired = false;
  var discriminator = generateDiscriminator_(username);
  var salt = randomCode_(24);
  var now = nowIso_();
  var user = insert_('Users', {
    id:id_('usr'), email:email, username:username, discriminator:discriminator,
    passwordSalt:salt, passwordHash:hashPassword_(password, salt), avatarAttachmentId:'', bannerAttachmentId:'',
    profileSlug:uniqueProfileSlug_(username, ''),
    bio:'', status:'ONLINE', customStatus:'', phone:'', phoneVerified:false, phoneVerifiedAt:'', twoFactorEnabled:false, twoFactorMethod:'', followNotificationPreference:'LOVE', createdAt:now, updatedAt:now, lastSeenAt:now,
    disabled:false, discoverable:normalizeAgeBand_(p.ageBand)!=='MINOR', emailVerified:false, emailVerifiedAt:'',
    failedLoginCount:0, lockedUntil:'', deletedAt:'', deletionReason:'',
    ageBand:normalizeAgeBand_(p.ageBand), guardianStatus:normalizeAgeBand_(p.ageBand)==='MINOR'?'PENDING':'NOT_REQUIRED',
    minorPrivacyLocked:normalizeAgeBand_(p.ageBand)==='MINOR', safetyOrientationAt:'', lastReconfirmedAt:now
  });

  // Registration is intentionally available without email verification. Community actions are gated server-side.
  // Registration never joins a TableGate before email verification.
  var inviteOutcome=null;
  upsertPresence_(user.id, 'ONLINE', '');
  var session = createSession_(user.id, p.userAgent);
  return {user:privateUser_(user), token:session.token, session:session.session, verificationRequired:false, joinedTablegateId:inviteOutcome&&inviteOutcome.joined?invite.tablegateId:'',inviteOutcome:inviteOutcome};
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
  var now = nowIso_();
  updateRow_('Users', user._row, {status:'ONLINE', lastSeenAt:now, updatedAt:now, failedLoginCount:0, lockedUntil:''});
  upsertPresence_(user.id, 'ONLINE', user.customStatus || '');
  if(bool_(user.twoFactorEnabled)){var method=normalizeTwoFactorMethod_(user.twoFactorMethod||'EMAIL');var challenge=createTwoFactorChallenge_(user,method);return {user:privateUser_(user),twoFactorRequired:true,twoFactorMethod:method,twoFactorChallengeId:challenge.id,expiresAt:challenge.expiresAt};}
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
  var p=ctx.params, patch={updatedAt:nowIso_()};
  if(p.username!==undefined){var username=validateUsername_(p.username);var conflict=findOne_('Users',function(u){return u.id!==ctx.user.id&&lower_(u.username)===lower_(username)&&String(u.discriminator)===String(ctx.user.discriminator);});if(conflict)patch.discriminator=generateDiscriminator_(username);patch.username=username;}
  if(p.bio!==undefined)patch.bio=nullableText_(p.bio,1000);
  if(p.profileSlug!==undefined){var slug=String(p.profileSlug||'').trim().toLowerCase();if(!/^[a-z0-9][a-z0-9-]{1,47}$/.test(slug))throw new ApiError_('INVALID_PROFILE_URL','Profile URL must be 2–48 characters using lowercase letters, numbers, and hyphens.');if(findOne_('Users',function(u){return u.id!==ctx.user.id&&!bool_(u.disabled)&&String(u.profileSlug||'').toLowerCase()===slug;}))throw new ApiError_('PROFILE_URL_IN_USE','That profile URL is already in use.');patch.profileSlug=slug;}
  if(p.followNotificationPreference!==undefined){var pref=String(p.followNotificationPreference||'LOVE').toUpperCase();if(['LIKE','LOVE','FAVORITE'].indexOf(pref)===-1)throw new ApiError_('INVALID_FOLLOW_NOTIFICATION_PREFERENCE','Choose LIKE, LOVE, or FAVORITE.');patch.followNotificationPreference=pref;}
  if(p.phone!==undefined)patch.phone=String(p.phone||'').trim();
  if(p.customStatus!==undefined)patch.customStatus=nullableText_(p.customStatus,128);
  var nextAge=p.ageBand!==undefined?normalizeAgeBand_(p.ageBand):normalizeAgeBand_(ctx.user.ageBand);
  if(p.ageBand!==undefined){patch.ageBand=nextAge;patch.guardianStatus=nextAge==='MINOR'?(ctx.user.guardianStatus||'PENDING'):'NOT_REQUIRED';patch.minorPrivacyLocked=nextAge==='MINOR';if(nextAge==='MINOR')patch.discoverable=false;}
  if(p.discoverable!==undefined){if(nextAge==='MINOR'&&bool_(p.discoverable))throw new ApiError_('MINOR_DISCOVERY_RESTRICTED','Minor accounts cannot enable broad public profile discovery.');patch.discoverable=bool_(p.discoverable);}
  if(p.reconfirmProfile!==undefined&&bool_(p.reconfirmProfile))patch.lastReconfirmedAt=nowIso_();
  if(p.avatarAttachmentId!==undefined){if(p.avatarAttachmentId)requireOwnedAttachment_(p.avatarAttachmentId,ctx.user.id);patch.avatarAttachmentId=String(p.avatarAttachmentId||'');}
  if(p.bannerAttachmentId!==undefined){if(p.bannerAttachmentId)requireOwnedAttachment_(p.bannerAttachmentId,ctx.user.id);patch.bannerAttachmentId=String(p.bannerAttachmentId||'');}
  updateRow_('Users',ctx.user._row,patch);var updated=byId_('Users',ctx.user.id,true);emitUserEvent_(ctx.user.id,'PROFILE_UPDATED','USER',ctx.user.id,{user:publicUser_(updated)});return privateUser_(updated);
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

function accountDeletionPlan_(userId) {
  var owned = filter_('Tablegates', function(t) { return t.ownerId === userId && !t.deletedAt; });
  var transfers = [], blockers = [];
  owned.forEach(function(tablegate) {
    var successor = firstActiveAdminSuccessor_(tablegate);
    if (!successor) {
      blockers.push({
        tablegateId:tablegate.id,
        tablegateName:tablegate.name,
        reason:'NO_ACTIVE_ADMIN_SUCCESSOR',
        requiredAction:'Add or restore at least one admin before deleting the owner account.'
      });
      return;
    }
    var user = byId_('Users', successor.userId, true);
    transfers.push({
      tablegateId:tablegate.id,
      tablegateName:tablegate.name,
      successorUserId:successor.userId,
      successor:publicUser_(user),
      firstCurrentAdminGrantAt:successor.grantedAt,
      qualifyingRoleId:successor.roleId,
      qualifyingRoleName:successor.roleName
    });
  });
  return {
    userId:userId,
    ownedTablegateCount:owned.length,
    transfers:transfers,
    blockers:blockers,
    canDelete:blockers.length===0,
    successionPolicy:'Each owned tablegate passes to the earliest-added person who is still an active admin. If no eligible admin exists, account deletion is blocked.'
  };
}

function routePreviewAccountDeletion_(ctx) {
  var plan = accountDeletionPlan_(ctx.user.id);
  plan.identityRetentionDays = TABLEGATE.ACCOUNT_IDENTITY_RETENTION_DAYS;
  plan.identityRetentionNotice = 'A restricted account-closure record is retained temporarily for abuse reports, evidence preservation, fraud prevention, and valid legal requests. It is not exposed through public user routes.';
  return plan;
}

function routeDeleteAccount_(ctx) {
  var confirmation = String(ctx.params.confirmation || ctx.params.confirm || '').trim().toUpperCase();
  if (confirmation !== 'DELETE MY ACCOUNT') throw new ApiError_('ACCOUNT_DELETION_CONFIRMATION_REQUIRED', 'Type DELETE MY ACCOUNT to confirm permanent account closure.');
  var password = String(ctx.params.password || '');
  if (!constantTimeEqual_(hashPassword_(password, ctx.user.passwordSalt), ctx.user.passwordHash)) throw new ApiError_('INVALID_PASSWORD', 'Current password is incorrect.');

  var plan = accountDeletionPlan_(ctx.user.id);
  if (!plan.canDelete) throw new ApiError_('ACCOUNT_DELETION_BLOCKED', 'Account deletion is blocked because one or more owned tablegates has no active admin successor.', plan);

  var now = nowIso_(), completedTransfers = [];
  plan.transfers.forEach(function(item) {
    var tablegate = requireTablegate_(item.tablegateId);
    var transfer = transferOwnershipCore_(tablegate, ctx.user.id, item.successorUserId, ctx.user.id, 'ACCOUNT_DELETION_SUCCESSION');
    completedTransfers.push({tablegateId:tablegate.id, tablegateName:tablegate.name, previousOwnerId:ctx.user.id, ownerId:item.successorUserId, transferredAt:now});
    createNotification_(item.successorUserId, 'TABLEGATE_OWNERSHIP_INHERITED', ctx.user.id, 'TABLEGATE', tablegate.id, '', {tablegateId:tablegate.id, tablegateName:tablegate.name, source:'ACCOUNT_DELETION_SUCCESSION'});
  });

  filter_('Members', function(m) { return m.userId === ctx.user.id && !m.leftAt; }).forEach(function(m) {
    updateRow_('Members', m._row, {leftAt:now, updatedAt:now, timedOutUntil:''});
  });
  filter_('VoiceStates', function(v) { return v.userId === ctx.user.id; }).sort(function(a,b){return b._row-a._row;}).forEach(function(v) { deleteRow_('VoiceStates', v._row); });
  filter_('PlayerApplications', function(a) { return a.userId === ctx.user.id && a.status === 'PENDING'; }).forEach(function(a) { updateRow_('PlayerApplications', a._row, {status:'WITHDRAWN', updatedAt:now, respondedAt:now, respondedBy:ctx.user.id}); });
  filter_('TablegateJoinRequests', function(r) { return r.userId === ctx.user.id && r.status === 'PENDING'; }).forEach(function(r) { updateRow_('TablegateJoinRequests', r._row, {status:'WITHDRAWN', updatedAt:now, respondedAt:now, respondedBy:ctx.user.id}); });
  filter_('GroupFinderPosts', function(p) { return p.ownerId === ctx.user.id && !p.deletedAt && p.status !== 'ARCHIVED'; }).forEach(function(p) { updateRow_('GroupFinderPosts', p._row, {status:'ARCHIVED', updatedAt:now}); });
  filter_('AgeAssuranceRequests', function(r) { return r.userId === ctx.user.id && ['EXPIRED','REVOKED'].indexOf(r.status) === -1; }).forEach(function(r) { updateRow_('AgeAssuranceRequests', r._row, {status:'REVOKED', updatedAt:now}); });
  filter_('Sessions', function(s) { return s.userId === ctx.user.id && !s.revokedAt; }).forEach(function(s) { updateRow_('Sessions', s._row, {revokedAt:now}); });
  var presence = findOne_('Presence', function(p) { return p.userId === ctx.user.id; });
  if (presence) updateRow_('Presence', presence._row, {status:'OFFLINE', customStatus:'', lastSeenAt:now, updatedAt:now});

  var retentionUntil = addMsIso_(TABLEGATE.ACCOUNT_IDENTITY_RETENTION_DAYS * 86400000);
  insert_('AccountDeletionRecords', {
    id:id_('adr'), userId:ctx.user.id, originalEmail:ctx.user.email, originalUsername:ctx.user.username,
    originalDiscriminator:ctx.user.discriminator, deletedAt:now, retentionUntil:retentionUntil,
    ownershipTransfersJson:jsonCell_(completedTransfers, [], 'ownership transfers'),
    metadataJson:jsonCell_({reason:'USER_REQUEST', evidencePolicy:'Temporary restricted retention for safety, fraud prevention, and valid legal requests.'}, {}, 'account deletion metadata')
  });

  var deletedEmail = 'deleted+' + String(ctx.user.id).replace(/[^A-Za-z0-9]/g,'').slice(-40) + '@tablegate.invalid';
  var salt = randomCode_(24);
  updateRow_('Users', ctx.user._row, {
    email:deletedEmail, username:'Deleted User', passwordSalt:salt, passwordHash:hashPassword_(randomToken_(4), salt),
    avatarAttachmentId:'', bannerAttachmentId:'', bio:'', status:'OFFLINE', customStatus:'', updatedAt:now, lastSeenAt:now,
    disabled:true, discoverable:false, emailVerified:false, emailVerifiedAt:'', failedLoginCount:0, lockedUntil:'',
    deletedAt:now, deletionReason:'USER_REQUEST'
  });

  return {
    deleted:true,
    userId:ctx.user.id,
    deletedAt:now,
    ownershipTransfers:completedTransfers,
    identityRetentionUntil:retentionUntil,
    notice:'The account is disabled and publicly anonymized. Shared messages, audit records, safety evidence, and other records that must remain coherent are preserved under their existing immutable user ID.'
  };
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
 * OPEN COMMUNITY AND DISCOVERY HELPERS
 * ============================= */

function tablegateJoinPolicy_(tablegate) {
  var value = String(tablegate && tablegate.joinPolicy || '').toUpperCase();
  if (TABLEGATE.TABLEGATE_JOIN_POLICIES.indexOf(value) !== -1) return value;
  if (tablegate && bool_(tablegate.isPublic) && !bool_(tablegate.inviteOnly)) return 'OPEN';
  return 'INVITE_ONLY';
}

function normalizeFinderTags_(value) {
  var seen = {}, out = [];
  array_(value).forEach(function(tag) {
    var clean = String(tag || '').trim().replace(/^#+/, '').replace(/\s+/g, ' ').slice(0, 40);
    var key = lower_(clean);
    if (clean && !seen[key] && out.length < TABLEGATE.MAX_GROUP_FINDER_TAGS) { seen[key] = true; out.push(clean); }
  });
  return out;
}

function normalizeFinderRoles_(value) {
  var aliases = {
    DUNGEON_MASTER:'DM', GAME_MASTER:'GM', M_O_L:'MOL', MASTER_OF_LORE:'MASTER_OF_LORE',
    STORY_TELLER:'STORYTELLER', GAME_KEEPER:'KEEPER', MODERATOR:'FACILITATOR'
  };
  return unique_(array_(value).map(function(role) {
    var normalized = String(role || '').trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    return aliases[normalized] || normalized;
  }).filter(function(role) { return TABLEGATE.FINDER_ROLES.indexOf(role) !== -1; })).slice(0, 12);
}

function normalizeFinderSystems_(value) {
  return unique_(array_(value).map(function(id) { return String(id || '').trim(); }).filter(Boolean)).slice(0, 30);
}

function activeMemberCount_(tablegateId) {
  return filter_('Members', function(m) { return m.tablegateId === tablegateId && !m.leftAt; }).length;
}

function appUrlWithParams_(params) {
  var appUrl = PropertiesService.getScriptProperties().getProperty(TABLEGATE.PUBLIC_APP_URL_PROPERTY) || '';
  if (!appUrl) return '';
  var hashIndex = appUrl.indexOf('#'), hash = hashIndex >= 0 ? appUrl.slice(hashIndex) : '', base = hashIndex >= 0 ? appUrl.slice(0, hashIndex) : appUrl;
  var pairs = [];
  Object.keys(params || {}).forEach(function(key) {
    var value = params[key];
    if (value !== undefined && value !== null && String(value) !== '') pairs.push(encodeURIComponent(key) + '=' + encodeURIComponent(String(value)));
  });
  if (!pairs.length) return appUrl;
  return base + (base.indexOf('?') === -1 ? '?' : '&') + pairs.join('&') + hash;
}

function tablegateShareUrl_(tablegateId) {
  return appUrlWithParams_({view:'tablegate', tablegateId:tablegateId});
}

function inviteView_(invite) {
  var out = stripInternal_(invite);
  out.shareUrl = appUrlWithParams_({invite:invite.code});
  return out;
}

function tablegateWithShareUrl_(tablegate) {
  var out = stripInternal_(tablegate);
  out.shareUrl = tablegateShareUrl_(tablegate.id);
  return out;
}

function getAgeAssuranceProviders_() {
  var raw = PropertiesService.getScriptProperties().getProperty(TABLEGATE.AGE_ASSURANCE_PROVIDERS_PROPERTY) || '[]';
  var providers;
  try { providers = JSON.parse(raw); } catch (e) { providers = []; }
  if (!Array.isArray(providers)) providers = [];
  return providers.filter(function(p) {
    return p && p.enabled !== false && /^[A-Za-z0-9_.-]{1,80}$/.test(String(p.id || '')) && /^https:\/\//i.test(String(p.startUrl || ''));
  }).map(function(p) {
    return {id:String(p.id), name:String(p.name || p.id).slice(0,120), startUrl:String(p.startUrl), privacyUrl:/^https:\/\//i.test(String(p.privacyUrl || '')) ? String(p.privacyUrl) : '', description:String(p.description || '').slice(0,500)};
  });
}

function publicAgeAssurancePolicy_() {
  return {
    requiredOnlyFor:['CREATE_18_PLUS_TABLEGATE','JOIN_18_PLUS_TABLEGATE'],
    notRequiredFor:['REGISTER','LOGIN','JOIN_ALL_AGES_TABLEGATE','VISITOR_ACCESS','PLAYER_APPROVAL','REPORT_SAFETY_CONCERN'],
    providerIndependent:true,
    providerOwnedByTablegate:false,
    storesIdScan:false,
    explanation:'Tablegate receives only an over-18 result and a provider transaction reference. The third-party provider handles any ID scan.'
  };
}

function ageAssurancePublic_(record) {
  if (!record) return {status:'NOT_VERIFIED', over18:false, valid:false};
  return {id:record.id, provider:record.provider, status:record.status, over18:bool_(record.over18), valid:record.status==='VERIFIED'&&bool_(record.over18)&&(!record.expiresAt||isFuture_(record.expiresAt)), verifiedAt:record.verifiedAt||'', expiresAt:record.expiresAt||'', requestedFor:record.requestedFor||'', tablegateId:record.tablegateId||''};
}

function validAgeAssuranceForUser_(userId) {
  return filter_('AgeAssuranceRequests', function(r) {
    return r.userId===userId && r.status==='VERIFIED' && bool_(r.over18) && (!r.expiresAt || isFuture_(r.expiresAt));
  }).sort(function(a,b){return new Date(b.verifiedAt||b.updatedAt||b.createdAt)-new Date(a.verifiedAt||a.updatedAt||a.createdAt);})[0] || null;
}

function requireAgeAssurance_(userId, requestedFor, tablegateId) {
  var record = validAgeAssuranceForUser_(userId);
  if (!record) throw new ApiError_('AGE_ASSURANCE_REQUIRED', 'Third-party proof that you are at least 18 is required only to create or join an 18+ tablegate.', {requestedFor:requestedFor, tablegateId:tablegateId||'', action:'startAgeAssurance', providers:getAgeAssuranceProviders_(), policy:publicAgeAssurancePolicy_()});
  return record;
}

function normalizeAdminTitle_(value, customValue) {
  var title = String(value || 'ADMIN').trim().toUpperCase().replace(/[^A-Z0-9]+/g,'_').replace(/^_+|_+$/g,'');
  var aliases={DUNGEON_MASTER:'DM',GAME_MASTER:'GM',MASTER_OF_LORE:'MASTER_OF_LORE',STORY_TELLER:'STORYTELLER'};
  title=aliases[title]||title;
  if(TABLEGATE.ADMIN_TITLES.indexOf(title)===-1) title='OTHER';
  var custom=title==='OTHER'?nullableText_(customValue,80):'';
  if(title==='OTHER'&&!custom)throw new ApiError_('ADMIN_TITLE_REQUIRED','Provide a custom admin title when choosing OTHER.');
  return {title:title,customTitle:custom};
}

function adultPolicyFields_(params, currentTablegate) {
  var adultOnly=params.adultOnly===undefined?bool_(currentTablegate&&currentTablegate.adultOnly):bool_(params.adultOnly);
  if(!adultOnly)return {adultOnly:false,adultReason:'',adultContentCategoriesJson:'[]'};
  var reason=params.adultReason!==undefined?nullableText_(params.adultReason,1000):nullableText_(currentTablegate&&currentTablegate.adultReason,1000);
  var categories=params.adultContentCategories!==undefined?unique_(array_(params.adultContentCategories).map(function(x){return String(x||'').trim().toUpperCase().replace(/[^A-Z0-9]+/g,'_');}).filter(function(x){return TABLEGATE.ADULT_CONTENT_CATEGORIES.indexOf(x)!==-1;})):parseJsonCell_(currentTablegate&&currentTablegate.adultContentCategoriesJson,[]);
  if(!reason||reason.length<TABLEGATE.ADULT_REASON_MIN_LENGTH)throw new ApiError_('ADULT_REASON_REQUIRED','An 18+ tablegate needs a specific mature-content reason of at least '+TABLEGATE.ADULT_REASON_MIN_LENGTH+' characters.');
  if(!categories.length)throw new ApiError_('ADULT_CATEGORY_REQUIRED','Choose at least one mature-content category for an 18+ tablegate.');
  return {adultOnly:true,adultReason:reason,adultContentCategoriesJson:jsonCell_(categories,[],'adult content categories')};
}

function managedRoleFor_(tablegateId, key) {
  return findOne_('Roles', function(r){return r.tablegateId===tablegateId&&r.managedKey===key;});
}

function memberHasManagedRole_(tablegateId,userId,key) {
  var role=managedRoleFor_(tablegateId,key);if(!role)return false;
  return !!findOne_('MemberRoles',function(mr){return mr.tablegateId===tablegateId&&mr.userId===userId&&mr.roleId===role.id;});
}

function isTablegateAdmin_(tablegateId,userId) {
  var tablegate=requireTablegate_(tablegateId);if(tablegate.ownerId===userId)return true;
  try{return hasPermission_(tablegateId,userId,PERMISSIONS.ADMIN)||hasPermission_(tablegateId,userId,PERMISSIONS.MANAGE_TABLEGATE)||hasPermission_(tablegateId,userId,PERMISSIONS.MANAGE_ROLES);}catch(e){return false;}
}

function assertProtectedOwnerAction_(tablegate,actorId,targetId,action) {
  if (tablegate.ownerId === targetId && actorId !== targetId) {
    throw new ApiError_('OWNER_PROTECTED', 'The tablegate owner cannot be removed, banned, timed out, demoted, or have roles taken away by an admin with peer-level access.', {tablegateId:tablegate.id, ownerId:targetId, attemptedAction:action||'OWNER_MODIFICATION'});
  }
}

function roleIsAdminLevel_(role) {
  var permissions=int_(role&&role.permissions,0);
  return role && (role.managedKey==='ADMIN' || (permissions & PERMISSIONS.ADMIN)===PERMISSIONS.ADMIN || (permissions & PERMISSIONS.MANAGE_TABLEGATE)===PERMISSIONS.MANAGE_TABLEGATE || (permissions & PERMISSIONS.MANAGE_ROLES)===PERMISSIONS.MANAGE_ROLES);
}

function firstActiveAdminSuccessor_(tablegate) {
  var users={},roles={};
  rows_('Users').forEach(function(u){users[u.id]=u;});
  filter_('Roles',function(r){return r.tablegateId===tablegate.id;}).forEach(function(r){roles[r.id]=r;});
  var activeMembers={};
  filter_('Members',function(m){return m.tablegateId===tablegate.id&&!m.leftAt&&m.userId!==tablegate.ownerId;}).forEach(function(m){
    var user=users[m.userId];
    if(user&&!bool_(user.disabled)&&!user.deletedAt&&(!m.timedOutUntil||!isFuture_(m.timedOutUntil)))activeMembers[m.userId]=m;
  });
  var candidates={};
  filter_('MemberRoles',function(mr){return mr.tablegateId===tablegate.id&&!!activeMembers[mr.userId]&&!!roles[mr.roleId]&&roleIsAdminLevel_(roles[mr.roleId]);}).forEach(function(mr){
    var current=candidates[mr.userId],role=roles[mr.roleId],grantedAt=mr.createdAt||activeMembers[mr.userId].joinedAt||tablegate.createdAt;
    if(!current||new Date(grantedAt).getTime()<new Date(current.grantedAt).getTime())candidates[mr.userId]={userId:mr.userId,memberId:activeMembers[mr.userId].id,grantedAt:grantedAt,roleId:role.id,roleName:role.name};
  });
  return Object.keys(candidates).map(function(id){return candidates[id];}).sort(function(a,b){
    var byGrant=new Date(a.grantedAt).getTime()-new Date(b.grantedAt).getTime();
    if(byGrant)return byGrant;
    var am=activeMembers[a.userId],bm=activeMembers[b.userId],byJoin=new Date(am.joinedAt).getTime()-new Date(bm.joinedAt).getTime();
    return byJoin||String(a.userId).localeCompare(String(b.userId));
  })[0]||null;
}

function transferOwnershipCore_(tablegate,previousOwnerId,targetId,actorId,source) {
  requireMember_(tablegate.id,targetId);
  if(targetId===previousOwnerId)return {transferred:false,ownerId:targetId};
  ensureManagedRoleAssignment_(tablegate.id,targetId,'ADMIN');
  removeManagedRoleAssignment_(tablegate.id,targetId,'VISITOR');
  var creatorRole=managedRoleFor_(tablegate.id,'CREATOR');
  if(!creatorRole)creatorRole=insert_('Roles',{id:id_('rol'),tablegateId:tablegate.id,name:'Owner',color:'#D6A84B',permissions:PERMISSIONS.ALL,position:110,isManaged:true,managedKey:'CREATOR',createdAt:nowIso_(),updatedAt:nowIso_()});
  filter_('MemberRoles',function(mr){return mr.tablegateId===tablegate.id&&mr.roleId===creatorRole.id&&mr.userId!==targetId;}).sort(function(a,b){return b._row-a._row;}).forEach(function(mr){deleteRow_('MemberRoles',mr._row);});
  if(!findOne_('MemberRoles',function(mr){return mr.tablegateId===tablegate.id&&mr.userId===targetId&&mr.roleId===creatorRole.id;}))insert_('MemberRoles',{id:id_('mrl'),tablegateId:tablegate.id,userId:targetId,roleId:creatorRole.id,createdAt:nowIso_()});
  updateRow_('Tablegates',tablegate._row,{ownerId:targetId,updatedAt:nowIso_()});
  try{ensureVisitorRole_(tablegate.id,previousOwnerId);}catch(e){}
  audit_(tablegate.id,actorId,'OWNERSHIP_TRANSFERRED','USER',targetId,{previousOwnerId:previousOwnerId,source:source||'MANUAL_TRANSFER',successorRetainedAdmin:true});
  emitTablegateEvent_(tablegate.id,'OWNERSHIP_TRANSFERRED','USER',targetId,{ownerId:targetId,previousOwnerId:previousOwnerId,source:source||'MANUAL_TRANSFER',successorRetainedAdmin:true});
  return {transferred:true,ownerId:targetId,previousOwnerId:previousOwnerId,successorRetainedAdmin:true,source:source||'MANUAL_TRANSFER'};
}

function membershipType_(tablegateId,userId) {
  requireMember_(tablegateId,userId);
  if(isTablegateAdmin_(tablegateId,userId))return 'ADMIN';
  if(memberHasManagedRole_(tablegateId,userId,'PLAYER'))return 'PLAYER';
  return 'VISITOR';
}

function requirePlayer_(tablegateId,userId,message) {
  requireMember_(tablegateId,userId);
  if(isTablegateAdmin_(tablegateId,userId)||memberHasManagedRole_(tablegateId,userId,'PLAYER'))return true;
  throw new ApiError_('PLAYER_APPROVAL_REQUIRED',message||'A tablegate admin must approve you as a Player before you can create sheets, personas, rolls, mechanics, or gameplay content.');
}

function ensureManagedRoleAssignment_(tablegateId,userId,key) {
  var role=managedRoleFor_(tablegateId,key);if(!role)throw new ApiError_('MANAGED_ROLE_MISSING','The '+key+' managed role is missing. Run migrateTablegateV7_().');
  var existing=findOne_('MemberRoles',function(mr){return mr.tablegateId===tablegateId&&mr.userId===userId&&mr.roleId===role.id;});
  if(!existing)insert_('MemberRoles',{id:id_('mrl'),tablegateId:tablegateId,userId:userId,roleId:role.id,createdAt:nowIso_()});
  return role;
}

function removeManagedRoleAssignment_(tablegateId,userId,key) {
  var role=managedRoleFor_(tablegateId,key);if(!role)return false;
  var existing=findOne_('MemberRoles',function(mr){return mr.tablegateId===tablegateId&&mr.userId===userId&&mr.roleId===role.id;});
  if(existing){deleteRow_('MemberRoles',existing._row);return true;}return false;
}

function ensureVisitorRole_(tablegateId,userId) {
  if(isTablegateAdmin_(tablegateId,userId)||memberHasManagedRole_(tablegateId,userId,'PLAYER'))return null;
  return ensureManagedRoleAssignment_(tablegateId,userId,'VISITOR');
}

function promoteToPlayer_(tablegateId,userId,actorId,source) {
  requireMember_(tablegateId,userId);
  var role=ensureManagedRoleAssignment_(tablegateId,userId,'PLAYER');
  removeManagedRoleAssignment_(tablegateId,userId,'VISITOR');
  audit_(tablegateId,actorId,'PLAYER_APPROVED','USER',userId,{source:source||'ADMIN_APPROVAL',roleId:role.id});
  emitTablegateEvent_(tablegateId,'MEMBER_BECAME_PLAYER','USER',userId,{userId:userId,approvedBy:actorId});
  createNotification_(userId,'PLAYER_APPROVED',actorId,'TABLEGATE',tablegateId,'',{tablegateId:tablegateId});
  return {userId:userId,membershipType:'PLAYER'};
}

function demoteToVisitor_(tablegateId,userId,actorId,reason) {
  var tablegate=requireTablegate_(tablegateId);if(tablegate.ownerId===userId)throw new ApiError_('OWNER_CANNOT_BE_VISITOR','Transfer ownership before removing Player status from the owner.');
  requireMember_(tablegateId,userId);removeManagedRoleAssignment_(tablegateId,userId,'PLAYER');ensureManagedRoleAssignment_(tablegateId,userId,'VISITOR');
  audit_(tablegateId,actorId,'PLAYER_STATUS_REVOKED','USER',userId,{reason:nullableText_(reason,1000)});
  emitTablegateEvent_(tablegateId,'MEMBER_BECAME_VISITOR','USER',userId,{userId:userId,revokedBy:actorId});
  createNotification_(userId,'PLAYER_STATUS_REVOKED',actorId,'TABLEGATE',tablegateId,'',{tablegateId:tablegateId,reason:nullableText_(reason,1000)});
  return {userId:userId,membershipType:'VISITOR'};
}

function visitorModeForChannel_(channel) {
  var mode=String(channel.visitorMode||'').toUpperCase();
  if(TABLEGATE.VISITOR_CHANNEL_MODES.indexOf(mode)!==-1)return mode;
  if(bool_(channel.isPrivate))return 'NONE';
  if(bool_(channel.isSystem)&&channel.name==='general')return 'CHAT';
  if(channel.type==='VOICE'||channel.type==='VIDEO')return 'OBSERVE';
  return 'READ';
}

function isVisitor_(tablegateId,userId) {
  try{return membershipType_(tablegateId,userId)==='VISITOR';}catch(e){return false;}
}

function publicTablegateCard_(tablegate, viewerId) {
  var owner = byId_('Users', tablegate.ownerId, true);
  var joined = viewerId ? !!findOne_('Members', function(m) { return m.tablegateId === tablegate.id && m.userId === viewerId && !m.leftAt; }) : false;
  var defaultTitle=normalizeAdminTitle_(tablegate.defaultAdminTitle||'ADMIN',tablegate.customAdminTitle||'');
  return {
    id: tablegate.id,
    shareUrl: tablegateShareUrl_(tablegate.id),
    name: tablegate.name,
    description: tablegate.description || '',
    iconAttachmentId: tablegate.iconAttachmentId || '',
    owner: publicUser_(owner),
    isPublic: bool_(tablegate.isPublic),
    joinPolicy: bool_(tablegate.adultOnly) ? 'REQUEST' : (bool_(tablegate.isPublic) ? 'OPEN' : 'INVITE_ONLY'),
    visitorAccess: bool_(tablegate.isPublic) && !bool_(tablegate.adultOnly) ? 'OPEN' : (bool_(tablegate.adultOnly) ? 'AGE_ASSURANCE_AND_ADMIN_APPROVAL' : 'INVITE_ONLY'),
    playerApprovalRequired: true,
    ownerProtectedFromPeerAdmins: true,
    ownershipSuccession: 'FIRST_ACTIVE_ADMIN_BY_ADMIN_GRANT_TIME',
    tags: parseJsonCell_(tablegate.tagsJson, []),
    language: tablegate.language || '',
    adultOnly: bool_(tablegate.adultOnly),
    adultReason: bool_(tablegate.adultOnly) ? (tablegate.adultReason||'') : '',
    adultContentCategories: bool_(tablegate.adultOnly) ? parseJsonCell_(tablegate.adultContentCategoriesJson,[]) : [],
    ageAssuranceRequired: bool_(tablegate.adultOnly),
    defaultAdminTitle: defaultTitle.title,
    customAdminTitle: defaultTitle.customTitle,
    maxMembers: int_(tablegate.maxMembers, 0, 0, 10000),
    memberCount: activeMemberCount_(tablegate.id),
    primarySystemId: tablegate.primarySystemId || 'sys_tablegate_generic',
    systemMode: tablegate.systemMode || 'SYSTEM_AGNOSTIC',
    joined: joined,
    membershipType: joined&&viewerId?membershipType_(tablegate.id,viewerId):'',
    createdAt: tablegate.createdAt,
    updatedAt: tablegate.updatedAt
  };
}

function ensureTablegateCapacity_(tablegate) {
  var maxMembers = int_(tablegate.maxMembers, 0, 0, 10000);
  if (maxMembers > 0 && activeMemberCount_(tablegate.id) >= maxMembers) throw new ApiError_('TABLEGATE_FULL', 'This tablegate has reached its member limit.');
}

function tablegateAdminUserIds_(tablegateId) {
  var out={};var tablegate=requireTablegate_(tablegateId);out[tablegate.ownerId]=true;
  filter_('Members',function(m){return m.tablegateId===tablegateId&&!m.leftAt;}).forEach(function(m){if(isTablegateAdmin_(tablegateId,m.userId))out[m.userId]=true;});
  return Object.keys(out);
}

function notifyTablegateAdmins_(tablegateId,type,actorId,payload) {
  tablegateAdminUserIds_(tablegateId).forEach(function(userId){if(userId!==actorId)createNotification_(userId,type,actorId,'TABLEGATE',tablegateId,'',payload||{});});
}

function joinTablegateForUser_(tablegate, userId, source) {
  var ban = findOne_('Bans', function(b) { return b.tablegateId === tablegate.id && b.userId === userId && !b.revokedAt; });
  if (ban) throw new ApiError_('BANNED', 'You are banned from this tablegate.');
  var existing = findOne_('Members', function(m) { return m.tablegateId === tablegate.id && m.userId === userId; });
  var now = nowIso_();
  if (existing && !existing.leftAt) return {joined:false, alreadyMember:true, tablegateId:tablegate.id, membershipType:membershipType_(tablegate.id,userId)};
  ensureTablegateCapacity_(tablegate);
  if (existing) updateRow_('Members', existing._row, {leftAt:'', joinedAt:now, updatedAt:now, timedOutUntil:''});
  else insert_('Members', {id:id_('mem'), tablegateId:tablegate.id, userId:userId, nickname:'', joinedAt:now, updatedAt:now, leftAt:'', timedOutUntil:'',adminTitle:'',customAdminTitle:''});
  ensureVisitorRole_(tablegate.id,userId);
  var type=membershipType_(tablegate.id,userId);
  emitTablegateEvent_(tablegate.id, 'MEMBER_JOINED', 'USER', userId, {userId:userId, source:source || 'OPEN', membershipType:type});
  notifyTablegateAdmins_(tablegate.id,'TABLEGATE_VISITOR_JOINED',userId,{tablegateId:tablegate.id, tablegateName:tablegate.name, source:source||'OPEN', membershipType:type});
  return {joined:true, tablegateId:tablegate.id, membershipType:type, playerApprovalRequired:type==='VISITOR'};
}

function createTablegateJoinRequest_(tablegate,userId,message,requestType,ageAssurance,inviteId) {
  var existingMember=findOne_('Members',function(m){return m.tablegateId===tablegate.id&&m.userId===userId&&!m.leftAt;});
  if(existingMember)return {requested:false,alreadyMember:true,tablegateId:tablegate.id,membershipType:membershipType_(tablegate.id,userId)};
  var existing=findOne_('TablegateJoinRequests',function(r){return r.tablegateId===tablegate.id&&r.userId===userId&&r.status==='PENDING';});
  if(existing)return stripInternal_(existing);
  var now=nowIso_(),request=insert_('TablegateJoinRequests',{id:id_('tjr'),tablegateId:tablegate.id,userId:userId,message:nullableText_(message,1000),status:'PENDING',createdAt:now,updatedAt:now,respondedAt:'',respondedBy:'',requestType:requestType||'TABLEGATE_JOIN',ageAssuranceId:ageAssurance?ageAssurance.id:'',inviteId:String(inviteId||'')});
  notifyTablegateAdmins_(tablegate.id,'TABLEGATE_JOIN_REQUEST',userId,{requestId:request.id,tablegateId:tablegate.id,message:request.message,requestType:request.requestType,ageAssuranceVerified:!!ageAssurance});
  var out=stripInternal_(request);out.requiresAdminApproval=true;out.ageAssuranceVerified=!!ageAssurance;return out;
}

function routeBrowsePublicTablegates_(ctx) {
  var q = lower_(ctx.params.query || ctx.params.q || '');
  var systemId = String(ctx.params.systemId || '');
  var tags = normalizeFinderTags_(ctx.params.tags).map(lower_);
  var limit = int_(ctx.params.limit, 50, 1, 100);
  var offset = int_(ctx.params.offset, 0, 0, 100000);
  var list = filter_('Tablegates', function(t) {
    if (t.deletedAt || !bool_(t.isPublic)) return false;
    if (q && lower_(t.name + ' ' + (t.description || '') + ' ' + (t.tagsJson || '')).indexOf(q) === -1) return false;
    if (systemId && t.primarySystemId !== systemId && !findOne_('TablegateSystems', function(ts) { return ts.tablegateId === t.id && ts.systemId === systemId && bool_(ts.enabled) && !ts.deletedAt; })) return false;
    if (tags.length) {
      var ownTags = parseJsonCell_(t.tagsJson, []).map(lower_);
      if (!tags.some(function(tag) { return ownTags.indexOf(tag) !== -1; })) return false;
    }
    return true;
  }).sort(function(a,b) { return new Date(b.updatedAt) - new Date(a.updatedAt); });
  return {total:list.length, items:list.slice(offset, offset + limit).map(function(t) { return publicTablegateCard_(t, ''); }), offset:offset, limit:limit};
}

function routeDiscoverTablegates_(ctx) {
  var result = routeBrowsePublicTablegates_(ctx);
  result.items = result.items.map(function(card) {
    var tablegate = requireTablegate_(card.id);
    return publicTablegateCard_(tablegate, ctx.user.id);
  });
  return result;
}

function requireEmailVerifiedForCommunity_(ctx, action) {
  if (!emailVerified_(ctx.user)) throw new ApiError_('EMAIL_NOT_VERIFIED','Verify your email before you '+(action||'use this community feature')+'.',{email:ctx.user.email,required:true});
}
function requireMessengerVerified_(ctx){requireEmailVerifiedForCommunity_(ctx,'use TableGate messaging');}

function routeJoinPublicTablegate_(ctx) {
  requireEmailVerifiedForCommunity_(ctx,'join a TableGate');

  var tablegate = requireTablegate_(ctx.params.tablegateId);
  if (!bool_(tablegate.isPublic)) throw new ApiError_('NOT_PUBLIC', 'This tablegate is not publicly discoverable. Use an invite link.');
  if(bool_(tablegate.adultOnly)){
    if(isMinorUser_(ctx.user))throw new ApiError_('MINOR_ADULT_SPACE_RESTRICTED','Minor accounts cannot join 18+ Tablegates.');
    var assurance=requireAgeAssurance_(ctx.user.id,'JOIN_18_PLUS_TABLEGATE',tablegate.id);
    return createTablegateJoinRequest_(tablegate,ctx.user.id,ctx.params.message,'ADULT_TABLEGATE_JOIN',assurance,'');
  }
  return joinTablegateForUser_(tablegate, ctx.user.id, 'PUBLIC_VISITOR_ACCESS');
}

function routeRequestTablegateJoin_(ctx) {
  requireEmailVerifiedForCommunity_(ctx,'request to join a TableGate');

  var tablegate = requireTablegate_(ctx.params.tablegateId);
  if(bool_(tablegate.adultOnly)){
    var assurance=requireAgeAssurance_(ctx.user.id,'JOIN_18_PLUS_TABLEGATE',tablegate.id);
    return createTablegateJoinRequest_(tablegate,ctx.user.id,ctx.params.message,'ADULT_TABLEGATE_JOIN',assurance,ctx.params.inviteId||'');
  }
  if(bool_(tablegate.isPublic))return joinTablegateForUser_(tablegate,ctx.user.id,'PUBLIC_VISITOR_ACCESS');
  if(tablegateJoinPolicy_(tablegate)!=='REQUEST')throw new ApiError_('JOIN_REQUEST_UNAVAILABLE','This private tablegate requires an invite link.');
  return createTablegateJoinRequest_(tablegate,ctx.user.id,ctx.params.message,'PRIVATE_TABLEGATE_JOIN',null,'');
}

function routeListTablegateJoinRequests_(ctx) {
  var tablegate = requireTablegate_(ctx.params.tablegateId);
  requirePermission_(tablegate.id, ctx.user.id, PERMISSIONS.MANAGE_TABLEGATE);
  var status = String(ctx.params.status || 'PENDING').toUpperCase();
  var users = {}; rows_('Users').forEach(function(u) { users[u.id] = u; });
  return filter_('TablegateJoinRequests', function(r) { return r.tablegateId === tablegate.id && (!status || r.status === status); }).sort(function(a,b) { return new Date(b.createdAt) - new Date(a.createdAt); }).map(function(r) {
    var out = stripInternal_(r); out.user = publicUser_(users[r.userId]); return out;
  });
}

function routeRespondTablegateJoinRequest_(ctx) {
  var request = byId_('TablegateJoinRequests', ctx.params.requestId, true);
  if (!request) throw new ApiError_('JOIN_REQUEST_NOT_FOUND', 'Join request not found.');
  var tablegate = requireTablegate_(request.tablegateId);
  requirePermission_(tablegate.id, ctx.user.id, PERMISSIONS.MANAGE_TABLEGATE);
  if (request.status !== 'PENDING') throw new ApiError_('JOIN_REQUEST_RESOLVED', 'This join request has already been resolved.');
  var accept = bool_(ctx.params.accept) || String(ctx.params.status || '').toUpperCase() === 'ACCEPTED';
  var now = nowIso_();
  var status = accept ? 'ACCEPTED' : 'DECLINED';
  updateRow_('TablegateJoinRequests', request._row, {status:status, updatedAt:now, respondedAt:now, respondedBy:ctx.user.id});
  var join = null;
  if (accept) {
    if(bool_(tablegate.adultOnly))requireAgeAssurance_(request.userId,'JOIN_18_PLUS_TABLEGATE',tablegate.id);
    join = joinTablegateForUser_(tablegate, request.userId, 'ADMIN_APPROVED_VISITOR');
    if(request.inviteId){var invite=byId_('Invites',request.inviteId,true);if(invite&&invite.tablegateId===tablegate.id)updateRow_('Invites',invite._row,{uses:int_(invite.uses,0)+1});}
  }
  createNotification_(request.userId, 'TABLEGATE_JOIN_REQUEST_' + status, ctx.user.id, 'TABLEGATE', tablegate.id, '', {requestId:request.id, tablegateId:tablegate.id, tablegateName:tablegate.name, membershipType:join&&join.membershipType||''});
  return {requestId:request.id, status:status, join:join};
}

/* =============================
 * THIRD-PARTY AGE ASSURANCE — 18+ TABLEGATES ONLY
 * ============================= */

function appendUrlParams_(url,params){var pairs=[];Object.keys(params||{}).forEach(function(k){var v=params[k];if(v!==undefined&&v!==null&&String(v)!=='')pairs.push(encodeURIComponent(k)+'='+encodeURIComponent(String(v)));});return String(url)+(String(url).indexOf('?')===-1?'?':'&')+pairs.join('&');}

function ageAssuranceCanonical_(requestId,provider,status,over18,providerReference,expiresAt,state){return [requestId,provider,status,String(!!over18),providerReference||'',expiresAt||'',state||''].join('|');}

function routeGetAgeAssuranceOptions_(){return {providers:getAgeAssuranceProviders_(),policy:publicAgeAssurancePolicy_(),configured:getAgeAssuranceProviders_().length>0};}

function routeStartAgeAssurance_(ctx){
  var existing=validAgeAssuranceForUser_(ctx.user.id);if(existing)return {alreadyVerified:true,assurance:ageAssurancePublic_(existing),policy:publicAgeAssurancePolicy_()};
  var providers=getAgeAssuranceProviders_();if(!providers.length)throw new ApiError_('AGE_ASSURANCE_NOT_CONFIGURED','No third-party age-assurance provider is configured. Configure ID.me or another independent provider before enabling 18+ tablegates.');
  var providerId=String(ctx.params.provider||providers[0].id),provider=providers.filter(function(p){return p.id===providerId;})[0];if(!provider)throw new ApiError_('AGE_ASSURANCE_PROVIDER_NOT_FOUND','Configured age-assurance provider not found.');
  var requestedFor=String(ctx.params.requestedFor||'JOIN_18_PLUS_TABLEGATE').toUpperCase();if(['CREATE_18_PLUS_TABLEGATE','JOIN_18_PLUS_TABLEGATE'].indexOf(requestedFor)===-1)throw new ApiError_('INVALID_AGE_ASSURANCE_PURPOSE','Age assurance may be requested only for creating or joining an 18+ tablegate.');
  var tablegateId=String(ctx.params.tablegateId||'');if(requestedFor==='JOIN_18_PLUS_TABLEGATE'){var tablegate=requireTablegate_(tablegateId);if(!bool_(tablegate.adultOnly))throw new ApiError_('AGE_ASSURANCE_NOT_REQUIRED','This tablegate is not 18+. Age assurance is not required.');}
  var state=randomToken_(3),now=nowIso_(),record=insert_('AgeAssuranceRequests',{id:id_('age'),userId:ctx.user.id,provider:provider.id,stateHash:sha256Hex_(state),status:'PENDING',over18:false,providerReference:'',requestedFor:requestedFor,tablegateId:tablegateId,createdAt:now,updatedAt:now,verifiedAt:'',expiresAt:'',metadataJson:'{}'});
  var callbackUrl=PropertiesService.getScriptProperties().getProperty(TABLEGATE.AGE_ASSURANCE_CALLBACK_URL_PROPERTY)||'';
  var verificationUrl=appendUrlParams_(provider.startUrl,{state:state,request_id:record.id,callback_url:callbackUrl});
  return {requestId:record.id,provider:{id:provider.id,name:provider.name,privacyUrl:provider.privacyUrl,description:provider.description},verificationUrl:verificationUrl,state:state,callbackUrl:callbackUrl,policy:publicAgeAssurancePolicy_(),warning:'The provider, not Tablegate, handles any ID scan. Do not upload an ID image to Tablegate.'};
}

function routeAgeAssuranceCallback_(ctx){
  var p=ctx.params,request=byId_('AgeAssuranceRequests',p.requestId,true);if(!request)throw new ApiError_('AGE_ASSURANCE_REQUEST_NOT_FOUND','Age-assurance request not found.');
  var state=String(p.state||''),provider=String(p.provider||request.provider),status=String(p.status||'FAILED').toUpperCase(),over18=bool_(p.over18),providerReference=nullableText_(p.providerReference,300),expiresAt=p.expiresAt?new Date(p.expiresAt).toISOString():'',signature=String(p.signature||'').toLowerCase();
  if(!state||!constantTimeEqual_(sha256Hex_(state),request.stateHash))throw new ApiError_('INVALID_AGE_ASSURANCE_STATE','Age-assurance state is invalid.');if(provider!==request.provider)throw new ApiError_('INVALID_AGE_ASSURANCE_PROVIDER','Provider does not match the request.');if(TABLEGATE.AGE_ASSURANCE_STATUSES.indexOf(status)===-1)throw new ApiError_('INVALID_AGE_ASSURANCE_STATUS','Invalid age-assurance status.');
  var secret=PropertiesService.getScriptProperties().getProperty(TABLEGATE.AGE_ASSURANCE_CALLBACK_SECRET_PROPERTY)||'';if(!secret)throw new ApiError_('AGE_ASSURANCE_NOT_CONFIGURED','Age-assurance callback secret is missing.');var expected=hmacSha256Hex_(ageAssuranceCanonical_(request.id,provider,status,over18,providerReference,expiresAt,state),secret);if(!constantTimeEqual_(signature,expected))throw new ApiError_('INVALID_AGE_ASSURANCE_SIGNATURE','Age-assurance callback signature is invalid.');
  if(status==='VERIFIED'&&!over18)status='DENIED';if(status==='VERIFIED'&&!expiresAt){var days=int_(PropertiesService.getScriptProperties().getProperty(TABLEGATE.AGE_ASSURANCE_VALID_DAYS_PROPERTY),TABLEGATE.DEFAULT_AGE_ASSURANCE_VALID_DAYS,1,3650);expiresAt=addMsIso_(days*86400000);}
  var now=nowIso_(),metadata={assuranceLevel:nullableText_(p.assuranceLevel,80),method:nullableText_(p.method,80),providerEventId:nullableText_(p.providerEventId,200)};updateRow_('AgeAssuranceRequests',request._row,{status:status,over18:status==='VERIFIED'&&over18,providerReference:providerReference,updatedAt:now,verifiedAt:status==='VERIFIED'?now:'',expiresAt:expiresAt,metadataJson:jsonCell_(metadata,{},'age assurance metadata')});
  return {accepted:true,assurance:ageAssurancePublic_(byId_('AgeAssuranceRequests',request.id,true)),policy:publicAgeAssurancePolicy_()};
}

function routeGetMyAgeAssurance_(ctx){var records=filter_('AgeAssuranceRequests',function(r){return r.userId===ctx.user.id;}).sort(function(a,b){return new Date(b.createdAt)-new Date(a.createdAt);});return {current:ageAssurancePublic_(validAgeAssuranceForUser_(ctx.user.id)),history:records.slice(0,20).map(ageAssurancePublic_),policy:publicAgeAssurancePolicy_()};}

function routeListAdultEligibility_(ctx){var tablegateId=String(ctx.params.tablegateId||'');requirePermission_(tablegateId,ctx.user.id,PERMISSIONS.MANAGE_TABLEGATE);var users={};rows_('Users').forEach(function(u){users[u.id]=u;});return filter_('Members',function(m){return m.tablegateId===tablegateId&&!m.leftAt;}).map(function(m){var assurance=validAgeAssuranceForUser_(m.userId);return {user:publicUser_(users[m.userId]),membershipType:membershipType_(tablegateId,m.userId),eligibleFor18Plus:!!assurance,assurance:assurance?{provider:assurance.provider,verifiedAt:assurance.verifiedAt||'',expiresAt:assurance.expiresAt||''}:null};});}

/* =============================
 * TABLEGATE, MEMBERSHIP, PERMISSIONS
 * ============================= */

function requireTablegate_(tablegateId, includeDeleted) {
  var tablegate = byId_('Tablegates', String(tablegateId || ''), !!includeDeleted);
  if (!tablegate || (!includeDeleted && tablegate.deletedAt)) throw new ApiError_('TABLEGATE_NOT_FOUND', 'Tablegate not found.');
  return tablegate;
}

function requireMember_(tablegateId, userId) {
  var tablegate = requireTablegate_(tablegateId),isOwner=tablegate.ownerId===userId;
  var ban = findOne_('Bans', function(b) { return b.tablegateId === tablegate.id && b.userId === userId && !b.revokedAt; });
  if (ban && !isOwner) throw new ApiError_('BANNED', 'You are banned from this tablegate.');
  var member = findOne_('Members', function(m) { return m.tablegateId === tablegate.id && m.userId === userId && (!m.leftAt || isOwner); });
  if (!member) throw new ApiError_('NOT_A_MEMBER', 'You are not a member of this tablegate.');
  if (!isOwner && member.timedOutUntil && isFuture_(member.timedOutUntil)) throw new ApiError_('MEMBER_TIMED_OUT', 'Your tablegate access is temporarily restricted until ' + member.timedOutUntil + '.');
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
  return filter_('Tablegates', function(t) { return !t.deletedAt && !!memberTablegateIds[t.id]; }).map(function(t) {
    var card=publicTablegateCard_(t,userId),member=memberTablegateIds[t.id];
    card.ownerId=t.ownerId;card.inviteOnly=bool_(t.inviteOnly);card.nickname=member.nickname||'';card.permissions=permissionsFor_(t.id,userId);card.adminTitle=member.adminTitle||'';card.customMemberAdminTitle=member.customAdminTitle||'';
    return card;
  });
}

function routeListTablegates_(ctx) { return listTablegatesForUser_(ctx.user.id); }

function routeCreateTablegate_(ctx) {
  requireEmailVerifiedForCommunity_(ctx,'create a TableGate');

  var p = ctx.params, now = nowIso_();
  var adult=adultPolicyFields_(p,null);
  if(adult.adultOnly&&isMinorUser_(ctx.user))throw new ApiError_('MINOR_ADULT_SPACE_RESTRICTED','Minor accounts cannot create 18+ Tablegates.');
  var assurance=adult.adultOnly?requireAgeAssurance_(ctx.user.id,'CREATE_18_PLUS_TABLEGATE',''):null;
  var adminTitle=normalizeAdminTitle_(p.defaultAdminTitle||p.adminTitle||p.hostTitle||'ADMIN',p.customAdminTitle||p.customHostTitle||'');
  var isPublic = p.isPublic === undefined ? true : bool_(p.isPublic);
  var joinPolicy = adult.adultOnly ? 'REQUEST' : (isPublic ? 'OPEN' : 'INVITE_ONLY');
  var tablegate = insert_('Tablegates', {
    id: id_('tbl'), name: text_(p.name || 'New Tablegate', 80), description: nullableText_(p.description, 1000),
    iconAttachmentId: '', ownerId: ctx.user.id, isPublic: isPublic, inviteOnly: joinPolicy === 'INVITE_ONLY',
    createdAt: now, updatedAt: now, deletedAt: '', primarySystemId: '', systemMode: enumValue_(p.systemMode || 'SYSTEM_AGNOSTIC', TABLEGATE.SYSTEM_MODES, 'SYSTEM_AGNOSTIC', 'systemMode'),
    systemConfigJson: jsonCell_(p.systemConfig, {}, 'systemConfig'), houseRulesJson: jsonCell_(p.houseRules, {}, 'houseRules'), safetyToolsJson: jsonCell_(p.safetyTools, {}, 'safetyTools'),
    joinPolicy: joinPolicy, tagsJson: jsonCell_(normalizeFinderTags_(p.tags), [], 'tags'), language: nullableText_(p.language, 40), adultOnly:adult.adultOnly, maxMembers: int_(p.maxMembers, 0, 0, 10000),
    adultReason:adult.adultReason,adultContentCategoriesJson:adult.adultContentCategoriesJson,defaultAdminTitle:adminTitle.title,customAdminTitle:adminTitle.customTitle
  });
  insert_('Members', {id: id_('mem'), tablegateId: tablegate.id, userId: ctx.user.id, nickname: '', joinedAt: now, updatedAt: now, leftAt: '', timedOutUntil: '',adminTitle:adminTitle.title,customAdminTitle:adminTitle.customTitle});

  var creatorRole = insert_('Roles', {id: id_('rol'), tablegateId: tablegate.id, name: 'Owner', color: '#D6A84B', permissions: PERMISSIONS.ALL, position: 110, isManaged: true, managedKey: 'CREATOR', createdAt: now, updatedAt: now});
  insert_('Roles', {id:id_('rol'),tablegateId:tablegate.id,name:'Admin',color:'#00B7C7',permissions:PERMISSIONS.ALL,position:100,isManaged:true,managedKey:'ADMIN',createdAt:now,updatedAt:now});
  insert_('Roles', {id: id_('rol'), tablegateId: tablegate.id, name: 'Moderator', color: '#5D8AA8', permissions: MODERATOR_PERMISSIONS, position: 50, isManaged: true, managedKey: 'MODERATOR', createdAt: now, updatedAt: now});
  var playerRole = insert_('Roles', {id: id_('rol'), tablegateId: tablegate.id, name: 'Player', color: '#7BA05B', permissions: PLAYER_PERMISSIONS, position: 20, isManaged: true, managedKey: 'PLAYER', createdAt: now, updatedAt: now});
  var visitorRole = insert_('Roles', {id:id_('rol'),tablegateId:tablegate.id,name:'Visitor',color:'#9AA0A6',permissions:VISITOR_PERMISSIONS,position:10,isManaged:true,managedKey:'VISITOR',createdAt:now,updatedAt:now});
  insert_('MemberRoles', {id: id_('mrl'), tablegateId: tablegate.id, userId: ctx.user.id, roleId: creatorRole.id, createdAt: now});

  var campaignCat = insert_('Categories', {id: id_('cat'), tablegateId: tablegate.id, name: 'Campaign', position: 10, createdBy: ctx.user.id, createdAt: now, updatedAt: now, deletedAt: ''});
  var tableCat = insert_('Categories', {id: id_('cat'), tablegateId: tablegate.id, name: 'Table Talk', position: 20, createdBy: ctx.user.id, createdAt: now, updatedAt: now, deletedAt: ''});
  var voiceCat = insert_('Categories', {id: id_('cat'), tablegateId: tablegate.id, name: 'Voice & Video', position: 30, createdBy: ctx.user.id, createdAt: now, updatedAt: now, deletedAt: ''});
  var defaults = [
    {name:'general', topic:'General conversation for Visitors, Players, and admins. Visitors may chat here before Player approval.', type:'TEXT', categoryId:tableCat.id, position:10, isSystem:true,visitorMode:'CHAT'},
    {name:'worldbuilding', topic:'Campaign setting, lore, maps, and worldbuilding. Visitors may observe; Players and admins may contribute.', type:'TEXT', categoryId:campaignCat.id, position:5, isSystem:false,visitorMode:'READ'},
    {name:'in-character', topic:'In-character roleplay and scene dialogue. Visitors may observe.', type:'TEXT', categoryId:campaignCat.id, position:10, isSystem:false,visitorMode:'READ'},
    {name:'dice-rolls', topic:'Auditable dice rolls and rules checks. Visitors may observe but cannot roll.', type:'TEXT', categoryId:campaignCat.id, position:20, isSystem:false,visitorMode:'READ'},
    {name:'handouts', topic:'Maps, clues, approved character sheets, and campaign handouts. Visitors may observe.', type:'HANDOUTS', categoryId:campaignCat.id, position:30, isSystem:false,visitorMode:'READ'},
    {name:'table-voice', topic:'Main voice channel for game sessions. Visitors are listen-only observers until Player approval.', type:'VOICE', categoryId:voiceCat.id, position:10, isSystem:false,visitorMode:'OBSERVE'},
    {name:'session-video', topic:'Optional camera and screen-sharing room. Visitors are listen-only observers until Player approval.', type:'VIDEO', categoryId:voiceCat.id, position:20, isSystem:false,visitorMode:'OBSERVE'}
  ];
  var channels = defaults.map(function(c) {
    return insert_('Channels', {
      id: id_('chn'), tablegateId: tablegate.id, categoryId: c.categoryId, name: c.name, topic: c.topic, type: c.type,
      position: c.position, userLimit: 0, slowmodeSeconds: 0, isPrivate: false, allowedRoleIds: JSON.stringify([playerRole.id,visitorRole.id]),
      isSystem: c.isSystem, createdBy: ctx.user.id, createdAt: now, updatedAt: now, deletedAt: '',visitorMode:c.visitorMode
    });
  });
  var requestedSystemIds = unique_(array_(p.systemIds));
  if (p.systemId) requestedSystemIds.unshift(String(p.systemId));
  if (!requestedSystemIds.length) requestedSystemIds = ['sys_tablegate_generic'];
  var attachedSystems = [];
  requestedSystemIds.forEach(function(systemId, index) {attachedSystems.push(attachSystemRecord_(tablegate.id, systemId, ctx.user.id, {isPrimary:index === 0, label:'', config:{}, houseRules:{}}));});
  tablegate = requireTablegate_(tablegate.id);
  var invite = createInviteRecord_(tablegate.id, ctx.user.id, int_(p.maxUses, 0, 0, 1000), int_(p.expiresInHours, 168, 1, 8760));
  audit_(tablegate.id, ctx.user.id, 'TABLEGATE_CREATED', 'TABLEGATE', tablegate.id, {name: tablegate.name, systemIds:requestedSystemIds,adultOnly:adult.adultOnly,ageAssuranceId:assurance?assurance.id:'',defaultAdminTitle:adminTitle.title});
  emitTablegateEvent_(tablegate.id, 'TABLEGATE_CREATED', 'TABLEGATE', tablegate.id, {tablegate: publicTablegateCard_(tablegate,ctx.user.id)});
  return {tablegate: publicTablegateCard_(tablegate,ctx.user.id), systems:attachedSystems, channels: channels.map(publicChannel_), invite: inviteView_(invite),ageAssurance:ageAssurancePublic_(assurance),visitorPolicy:{publicVisitorsJoinOpenly:isPublic&&!adult.adultOnly,playerApprovalRequired:true}};
}

function routeGetTablegate_(ctx) {
  var tablegateId = String(ctx.params.tablegateId || '');
  var sm = requireMember_(tablegateId, ctx.user.id);
  var categories = filter_('Categories', function(c) { return c.tablegateId === tablegateId && !c.deletedAt; }).sort(function(a,b){return num_(a.position,0)-num_(b.position,0);});
  var channels = filter_('Channels', function(c) { return c.tablegateId === tablegateId && !c.deletedAt && canViewChannel_(c, ctx.user.id); }).sort(function(a,b){return num_(a.position,0)-num_(b.position,0);}).map(publicChannel_);
  return {
    tablegate: publicTablegateCard_(sm.tablegate,ctx.user.id),
    member: stripInternal_(sm.member),
    membershipType:membershipType_(tablegateId,ctx.user.id),
    playerApprovalRequired:membershipType_(tablegateId,ctx.user.id)==='VISITOR',
    permissions: permissionsFor_(tablegateId, ctx.user.id),
    categories: stripInternal_(categories),channels:channels,roles:routeListRoles_(ctx),members:routeListMembers_(ctx),systems:routeListTablegateSystems_(ctx),
    systemConfig: parseJsonCell_(sm.tablegate.systemConfigJson, {}),houseRules:parseJsonCell_(sm.tablegate.houseRulesJson, {}),safetyTools:parseJsonCell_(sm.tablegate.safetyToolsJson, {}),ageAssurancePolicy:publicAgeAssurancePolicy_(),ownershipPolicy:{ownerProtectedFromPeerAdmins:true,manualTransferByOwnerOnly:true,accountDeletionSuccessor:'FIRST_ACTIVE_ADMIN_BY_ADMIN_GRANT_TIME'}
  };
}

function routeUpdateTablegate_(ctx) {
  var tablegateId = String(ctx.params.tablegateId || '');
  requirePermission_(tablegateId, ctx.user.id, PERMISSIONS.MANAGE_TABLEGATE);
  var tablegate = requireTablegate_(tablegateId),p=ctx.params,patch={updatedAt:nowIso_()};
  if(p.name!==undefined)patch.name=text_(p.name,80);if(p.description!==undefined)patch.description=nullableText_(p.description,1000);
  var adult=adultPolicyFields_(p,tablegate);
  if(adult.adultOnly){
    requireAgeAssurance_(ctx.user.id,'CREATE_18_PLUS_TABLEGATE',tablegateId);
    if(!bool_(tablegate.adultOnly)){
      var unverified=filter_('Members',function(m){return m.tablegateId===tablegateId&&!m.leftAt&&!validAgeAssuranceForUser_(m.userId);});
      if(unverified.length)throw new ApiError_('ADULT_CONVERSION_BLOCKED','Every current member must complete third-party age assurance before an all-ages tablegate can become 18+.',{unverifiedMemberCount:unverified.length});
    }
  }
  patch.adultOnly=adult.adultOnly;patch.adultReason=adult.adultReason;patch.adultContentCategoriesJson=adult.adultContentCategoriesJson;
  var isPublic=p.isPublic===undefined?bool_(tablegate.isPublic):bool_(p.isPublic);patch.isPublic=isPublic;
  patch.joinPolicy=adult.adultOnly?'REQUEST':(isPublic?'OPEN':'INVITE_ONLY');patch.inviteOnly=patch.joinPolicy==='INVITE_ONLY';
  if(p.tags!==undefined)patch.tagsJson=jsonCell_(normalizeFinderTags_(p.tags),[],'tags');if(p.language!==undefined)patch.language=nullableText_(p.language,40);if(p.maxMembers!==undefined)patch.maxMembers=int_(p.maxMembers,0,0,10000);
  if(p.defaultAdminTitle!==undefined||p.adminTitle!==undefined||p.hostTitle!==undefined||p.customAdminTitle!==undefined||p.customHostTitle!==undefined){var title=normalizeAdminTitle_(p.defaultAdminTitle||p.adminTitle||p.hostTitle||tablegate.defaultAdminTitle||'ADMIN',p.customAdminTitle||p.customHostTitle||tablegate.customAdminTitle||'');patch.defaultAdminTitle=title.title;patch.customAdminTitle=title.customTitle;}
  if(p.systemMode!==undefined)patch.systemMode=enumValue_(p.systemMode,TABLEGATE.SYSTEM_MODES,'SYSTEM_AGNOSTIC','systemMode');if(p.systemConfig!==undefined)patch.systemConfigJson=jsonCell_(p.systemConfig,{},'systemConfig');if(p.houseRules!==undefined)patch.houseRulesJson=jsonCell_(p.houseRules,{},'houseRules');if(p.safetyTools!==undefined)patch.safetyToolsJson=jsonCell_(p.safetyTools,{},'safetyTools');
  if(p.iconAttachmentId!==undefined){if(p.iconAttachmentId)requireAttachmentAccess_(p.iconAttachmentId,ctx.user.id,tablegateId,'');patch.iconAttachmentId=String(p.iconAttachmentId||'');}
  updateRow_('Tablegates',tablegate._row,patch);var updated=requireTablegate_(tablegateId);audit_(tablegateId,ctx.user.id,'TABLEGATE_UPDATED','TABLEGATE',tablegateId,patch);emitTablegateEvent_(tablegateId,'TABLEGATE_UPDATED','TABLEGATE',tablegateId,{tablegate:publicTablegateCard_(updated,ctx.user.id)});return publicTablegateCard_(updated,ctx.user.id);
}

function routeDeleteTablegate_(ctx) {
  var tablegate = requireTablegate_(ctx.params.tablegateId);
  if (tablegate.ownerId !== ctx.user.id) throw new ApiError_('OWNER_REQUIRED', 'Only the tablegate creator can delete the tablegate.');
  assertNoTablegateSafetyFreeze_(tablegate.id,'TABLEGATE_DELETE');
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
  if (tablegate.ownerId !== ctx.user.id) throw new ApiError_('OWNER_REQUIRED', 'Only the current tablegate owner can transfer ownership. Peer admins cannot remove or replace the owner.');
  assertNoTablegateSafetyFreeze_(tablegate.id,'OWNERSHIP_TRANSFER');
  var targetId = String(ctx.params.userId || '');
  return transferOwnershipCore_(tablegate,ctx.user.id,targetId,ctx.user.id,'MANUAL_TRANSFER');
}

function routeListMembers_(ctx) {
  var tablegateId = String(ctx.params.tablegateId || ''),tablegate=requireTablegate_(tablegateId);
  requireMember_(tablegateId, ctx.user.id);
  var users = {};rows_('Users').forEach(function(u){users[u.id]=u;});
  var roles = {};filter_('Roles', function(r){return r.tablegateId===tablegateId;}).forEach(function(r){roles[r.id]=r;});
  var assignments = filter_('MemberRoles', function(mr){return mr.tablegateId===tablegateId;}),byUser={};
  assignments.forEach(function(mr){if(!byUser[mr.userId])byUser[mr.userId]=[];if(roles[mr.roleId])byUser[mr.userId].push(stripInternal_(roles[mr.roleId]));});
  return filter_('Members', function(m){return m.tablegateId===tablegateId&&!m.leftAt;}).map(function(m){
    var title=normalizeAdminTitle_(m.adminTitle||tablegate.defaultAdminTitle||'ADMIN',m.customAdminTitle||tablegate.customAdminTitle||'');
    return {id:m.id,tablegateId:m.tablegateId,userId:m.userId,nickname:m.nickname||'',joinedAt:m.joinedAt,timedOutUntil:m.timedOutUntil||'',user:publicUser_(users[m.userId]),roles:byUser[m.userId]||[],membershipType:membershipType_(tablegateId,m.userId),isOwner:m.userId===tablegate.ownerId,ownerProtected:m.userId===tablegate.ownerId,adminTitle:isTablegateAdmin_(tablegateId,m.userId)?title.title:'',customAdminTitle:isTablegateAdmin_(tablegateId,m.userId)?title.customTitle:''};
  });
}

function routeUpdateMember_(ctx) {
  var tablegateId = String(ctx.params.tablegateId || ''),tablegate=requireTablegate_(tablegateId);
  var targetId = String(ctx.params.userId || ctx.user.id),target=requireMember_(tablegateId,targetId).member;
  if (targetId !== ctx.user.id) {requirePermission_(tablegateId, ctx.user.id, PERMISSIONS.MANAGE_NICKNAMES);assertProtectedOwnerAction_(tablegate,ctx.user.id,targetId,'UPDATE_MEMBER');}
  var patch = {updatedAt: nowIso_()};
  if(targetId!==ctx.user.id)recordPotentialRetaliation_(tablegateId,ctx.user.id,targetId,'MEMBER_UPDATE');
  if (ctx.params.nickname !== undefined) patch.nickname = nullableText_(ctx.params.nickname, 64);
  if (ctx.params.timedOutUntil !== undefined) {requirePermission_(tablegateId, ctx.user.id, PERMISSIONS.MANAGE_MESSAGES);patch.timedOutUntil = ctx.params.timedOutUntil ? new Date(ctx.params.timedOutUntil).toISOString() : '';}
  if(ctx.params.adminTitle!==undefined||ctx.params.hostTitle!==undefined||ctx.params.customAdminTitle!==undefined||ctx.params.customHostTitle!==undefined){
    if(!isTablegateAdmin_(tablegateId,targetId))throw new ApiError_('ADMIN_TITLE_FOR_ADMINS_ONLY','Host titles are available only to tablegate admins.');
    if(targetId!==ctx.user.id)requirePermission_(tablegateId,ctx.user.id,PERMISSIONS.MANAGE_ROLES);
    var title=normalizeAdminTitle_(ctx.params.adminTitle||ctx.params.hostTitle||target.adminTitle||tablegate.defaultAdminTitle||'ADMIN',ctx.params.customAdminTitle||ctx.params.customHostTitle||target.customAdminTitle||tablegate.customAdminTitle||'');patch.adminTitle=title.title;patch.customAdminTitle=title.customTitle;
  }
  updateRow_('Members', target._row, patch);audit_(tablegateId, ctx.user.id, 'MEMBER_UPDATED', 'USER', targetId, patch);emitTablegateEvent_(tablegateId, 'MEMBER_UPDATED', 'USER', targetId, {userId:targetId,patch:patch});
  var updated=requireMember_(tablegateId,targetId).member;return {member:stripInternal_(updated),membershipType:membershipType_(tablegateId,targetId)};
}

function routeRequestPlayerApproval_(ctx){
  var tablegateId=String(ctx.params.tablegateId||'');requireMember_(tablegateId,ctx.user.id);
  var type=membershipType_(tablegateId,ctx.user.id);if(type!=='VISITOR')return {requested:false,alreadyApproved:true,membershipType:type};
  var existing=findOne_('PlayerApplications',function(a){return a.tablegateId===tablegateId&&a.userId===ctx.user.id&&a.status==='PENDING';});if(existing)return stripInternal_(existing);
  var now=nowIso_(),app=insert_('PlayerApplications',{id:id_('pla'),tablegateId:tablegateId,userId:ctx.user.id,message:nullableText_(ctx.params.message,2000),status:'PENDING',createdAt:now,updatedAt:now,respondedAt:'',respondedBy:''});
  notifyTablegateAdmins_(tablegateId,'PLAYER_APPROVAL_REQUEST',ctx.user.id,{applicationId:app.id,tablegateId:tablegateId,message:app.message});return stripInternal_(app);
}

function routeWithdrawPlayerApplication_(ctx){
  var app=byId_('PlayerApplications',ctx.params.applicationId,true);if(!app||app.userId!==ctx.user.id||app.status!=='PENDING')throw new ApiError_('PLAYER_APPLICATION_NOT_FOUND','Pending Player application not found.');
  updateRow_('PlayerApplications',app._row,{status:'WITHDRAWN',updatedAt:nowIso_(),respondedAt:nowIso_(),respondedBy:ctx.user.id});return {withdrawn:true,applicationId:app.id};
}

function routeListPlayerApplications_(ctx){
  var tablegateId=String(ctx.params.tablegateId||'');requirePermission_(tablegateId,ctx.user.id,PERMISSIONS.MANAGE_ROLES);var status=String(ctx.params.status||'PENDING').toUpperCase(),users={};rows_('Users').forEach(function(u){users[u.id]=u;});
  return filter_('PlayerApplications',function(a){return a.tablegateId===tablegateId&&(!status||a.status===status);}).sort(function(a,b){return new Date(b.createdAt)-new Date(a.createdAt);}).map(function(a){var out=stripInternal_(a);out.user=publicUser_(users[a.userId]);out.currentMembershipType=membershipType_(tablegateId,a.userId);return out;});
}

function closePendingPlayerApplications_(tablegateId,userId,status,actorId){
  filter_('PlayerApplications',function(a){return a.tablegateId===tablegateId&&a.userId===userId&&a.status==='PENDING';}).forEach(function(a){updateRow_('PlayerApplications',a._row,{status:status,updatedAt:nowIso_(),respondedAt:nowIso_(),respondedBy:actorId});});
}

function routeRespondPlayerApplication_(ctx){
  var app=byId_('PlayerApplications',ctx.params.applicationId,true);if(!app)throw new ApiError_('PLAYER_APPLICATION_NOT_FOUND','Player application not found.');requirePermission_(app.tablegateId,ctx.user.id,PERMISSIONS.MANAGE_ROLES);if(app.status!=='PENDING')throw new ApiError_('PLAYER_APPLICATION_RESOLVED','This Player application is already resolved.');
  var accept=bool_(ctx.params.accept)||String(ctx.params.status||'').toUpperCase()==='APPROVED',status=accept?'APPROVED':'DECLINED';updateRow_('PlayerApplications',app._row,{status:status,updatedAt:nowIso_(),respondedAt:nowIso_(),respondedBy:ctx.user.id});
  var result=accept?promoteToPlayer_(app.tablegateId,app.userId,ctx.user.id,'PLAYER_APPLICATION'):null;if(!accept)createNotification_(app.userId,'PLAYER_APPLICATION_DECLINED',ctx.user.id,'TABLEGATE',app.tablegateId,'',{tablegateId:app.tablegateId});return {applicationId:app.id,status:status,result:result};
}

function routeApprovePlayer_(ctx){
  var tablegateId=String(ctx.params.tablegateId||''),userId=String(ctx.params.userId||'');requirePermission_(tablegateId,ctx.user.id,PERMISSIONS.MANAGE_ROLES);requireMember_(tablegateId,userId);var result=promoteToPlayer_(tablegateId,userId,ctx.user.id,'DIRECT_ADMIN_APPROVAL');closePendingPlayerApplications_(tablegateId,userId,'APPROVED',ctx.user.id);return result;
}

function routeRevokePlayer_(ctx){
  var tablegateId=String(ctx.params.tablegateId||''),userId=String(ctx.params.userId||'');requirePermission_(tablegateId,ctx.user.id,PERMISSIONS.MANAGE_ROLES);var result=demoteToVisitor_(tablegateId,userId,ctx.user.id,ctx.params.reason);closePendingPlayerApplications_(tablegateId,userId,'REVOKED',ctx.user.id);return result;
}

function routeKickMember_(ctx) {
  var tablegate = requireTablegate_(ctx.params.tablegateId);
  requirePermission_(tablegate.id, ctx.user.id, PERMISSIONS.KICK_MEMBERS);
  var targetId = String(ctx.params.userId || '');
  assertProtectedOwnerAction_(tablegate,ctx.user.id,targetId,'KICK_OWNER');
  var target = requireMember_(tablegate.id, targetId).member;
  recordPotentialRetaliation_(tablegate.id,ctx.user.id,targetId,'MEMBER_KICK');
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
  assertProtectedOwnerAction_(tablegate,ctx.user.id,targetId,'BAN_OWNER');
  recordPotentialRetaliation_(tablegate.id,ctx.user.id,targetId,'MEMBER_BAN');
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
  requirePermission_(tablegateId,ctx.user.id,PERMISSIONS.MANAGE_ROLES);requireMember_(tablegateId,userId);recordPotentialRetaliation_(tablegateId,ctx.user.id,userId,'ROLE_ASSIGN');
  var role=byId_('Roles',roleId,true);if(!role||role.tablegateId!==tablegateId)throw new ApiError_('ROLE_NOT_FOUND','Role not found.');if(role.managedKey==='CREATOR')throw new ApiError_('MANAGED_ROLE','Use transferOwnership for the Owner role.');validateRolePermissions_(tablegateId,ctx.user.id,role.permissions);
  if(role.managedKey==='PLAYER'){var result=promoteToPlayer_(tablegateId,userId,ctx.user.id,'ROLE_ASSIGNMENT');closePendingPlayerApplications_(tablegateId,userId,'APPROVED',ctx.user.id);return {assigned:true,result:result};}
  if(role.managedKey==='VISITOR')return {assigned:true,result:demoteToVisitor_(tablegateId,userId,ctx.user.id,'Visitor role assigned by admin.')};
  var existing=findOne_('MemberRoles',function(mr){return mr.tablegateId===tablegateId&&mr.userId===userId&&mr.roleId===roleId;});if(!existing)insert_('MemberRoles',{id:id_('mrl'),tablegateId:tablegateId,userId:userId,roleId:roleId,createdAt:nowIso_()});
  if(role.managedKey==='ADMIN')removeManagedRoleAssignment_(tablegateId,userId,'VISITOR');audit_(tablegateId,ctx.user.id,'ROLE_ASSIGNED','USER',userId,{roleId:roleId});emitTablegateEvent_(tablegateId,'MEMBER_ROLES_UPDATED','USER',userId,{userId:userId,membershipType:membershipType_(tablegateId,userId)});return {assigned:true,membershipType:membershipType_(tablegateId,userId)};
}

function routeRemoveRole_(ctx){
  var tablegateId=String(ctx.params.tablegateId||''),userId=String(ctx.params.userId||''),roleId=String(ctx.params.roleId||'');requirePermission_(tablegateId,ctx.user.id,PERMISSIONS.MANAGE_ROLES);recordPotentialRetaliation_(tablegateId,ctx.user.id,userId,'ROLE_REMOVE');
  assertProtectedOwnerAction_(requireTablegate_(tablegateId),ctx.user.id,userId,'REMOVE_OWNER_ROLE');
  var role=byId_('Roles',roleId,true);if(!role||role.tablegateId!==tablegateId)throw new ApiError_('ROLE_NOT_FOUND','Role not found.');if(role.managedKey==='CREATOR')throw new ApiError_('MANAGED_ROLE','Use transferOwnership for the Owner role.');
  if(role.managedKey==='PLAYER')return {removed:true,result:demoteToVisitor_(tablegateId,userId,ctx.user.id,ctx.params.reason||'Player role removed.')};
  if(role.managedKey==='VISITOR'&&!isTablegateAdmin_(tablegateId,userId)&&!memberHasManagedRole_(tablegateId,userId,'PLAYER'))throw new ApiError_('VISITOR_ROLE_REQUIRED','A member must remain a Visitor until approved as a Player or Admin.');
  var existing=findOne_('MemberRoles',function(mr){return mr.tablegateId===tablegateId&&mr.userId===userId&&mr.roleId===roleId;});if(existing)deleteRow_('MemberRoles',existing._row);
  if(role.managedKey==='ADMIN')ensureVisitorRole_(tablegateId,userId);audit_(tablegateId,ctx.user.id,'ROLE_REMOVED','USER',userId,{roleId:roleId});emitTablegateEvent_(tablegateId,'MEMBER_ROLES_UPDATED','USER',userId,{userId:userId,membershipType:membershipType_(tablegateId,userId)});return {removed:true,membershipType:membershipType_(tablegateId,userId)};
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

function registrationInviteOutcome_(invite,userId){
  var tablegate=requireTablegate_(invite.tablegateId);
  if(bool_(tablegate.adultOnly))return {joined:false,tablegateId:tablegate.id,ageAssuranceRequired:true,adminApprovalRequired:true,nextAction:'After signing in, run startAgeAssurance and then joinInvite again.',policy:publicAgeAssurancePolicy_()};
  return joinInviteForUser_(invite,userId,'REGISTRATION_INVITE');
}

function joinInviteForUser_(invite,userId,source,message){
  var tablegate=requireTablegate_(invite.tablegateId);
  if(bool_(tablegate.adultOnly)){
    var assurance=requireAgeAssurance_(userId,'JOIN_18_PLUS_TABLEGATE',tablegate.id);
    return createTablegateJoinRequest_(tablegate,userId,message,'ADULT_TABLEGATE_JOIN',assurance,invite.id);
  }
  var result=joinTablegateForUser_(tablegate,userId,source||'INVITE_LINK');if(result.joined)updateRow_('Invites',invite._row,{uses:int_(invite.uses,0)+1});return result;
}

function routePreviewInvite_(ctx){
  var invite=validateInviteCode_(ctx.params.code||ctx.params.inviteCode,null,false),tablegate=requireTablegate_(invite.tablegateId);
  return {code:invite.code,shareUrl:appUrlWithParams_({invite:invite.code}),tablegate:publicTablegateCard_(tablegate,''),expiresAt:invite.expiresAt||'',remainingUses:int_(invite.maxUses,0)>0?Math.max(0,int_(invite.maxUses,0)-int_(invite.uses,0)):null,ageAssurancePolicy:publicAgeAssurancePolicy_()};
}

function routeCreateInvite_(ctx){
  var tablegateId=String(ctx.params.tablegateId||'');requirePermission_(tablegateId,ctx.user.id,PERMISSIONS.CREATE_INVITE);
  var invite=createInviteRecord_(tablegateId,ctx.user.id,int_(ctx.params.maxUses,0,0,10000),int_(ctx.params.expiresInHours,168,1,8760));
  audit_(tablegateId,ctx.user.id,'INVITE_CREATED','INVITE',invite.id,{maxUses:invite.maxUses,expiresAt:invite.expiresAt});
  return inviteView_(invite);
}

function routeListInvites_(ctx){
  var tablegateId=String(ctx.params.tablegateId||'');requirePermission_(tablegateId,ctx.user.id,PERMISSIONS.CREATE_INVITE);
  return filter_('Invites',function(i){return i.tablegateId===tablegateId&&!i.revokedAt;}).map(inviteView_);
}

function routeRevokeInvite_(ctx){
  var invite=byId_('Invites',ctx.params.inviteId,true);if(!invite)throw new ApiError_('INVITE_NOT_FOUND','Invite not found.');
  requirePermission_(invite.tablegateId,ctx.user.id,PERMISSIONS.CREATE_INVITE);updateRow_('Invites',invite._row,{revokedAt:nowIso_()});
  audit_(invite.tablegateId,ctx.user.id,'INVITE_REVOKED','INVITE',invite.id,{});return {revoked:true};
}

function routeJoinInvite_(ctx){
  requireEmailVerifiedForCommunity_(ctx,'join a TableGate');
  var invite=validateInviteCode_(ctx.params.code||ctx.params.inviteCode,ctx.user.id,true);
  return joinInviteForUser_(invite,ctx.user.id,'INVITE_LINK',ctx.params.message);
}

/* =============================
 * CATEGORIES AND CHANNELS
 * ============================= */

function canViewChannel_(channel,userId){
  requireMember_(channel.tablegateId,userId);
  if(isTablegateAdmin_(channel.tablegateId,userId))return true;
  if(isVisitor_(channel.tablegateId,userId))return visitorModeForChannel_(channel)!=='NONE';
  if(!bool_(channel.isPrivate))return true;
  var allowed=array_(channel.allowedRoleIds),member=findOne_('Members',function(m){return m.tablegateId===channel.tablegateId&&m.userId===userId&&!m.leftAt;});var ids=roleIds_(member);return allowed.some(function(id){return ids.indexOf(id)!==-1;});
}

function requireChannel_(channelId,userId){var channel=byId_('Channels',channelId);if(!channel)throw new ApiError_('CHANNEL_NOT_FOUND','Channel not found.');if(!canViewChannel_(channel,userId))throw new ApiError_('FORBIDDEN','You cannot access this channel.');return channel;}

function publicChannel_(c){return {id:c.id,tablegateId:c.tablegateId,categoryId:c.categoryId||'',name:c.name,topic:c.topic||'',type:c.type,position:num_(c.position,0),userLimit:int_(c.userLimit,0),slowmodeSeconds:int_(c.slowmodeSeconds,0),isPrivate:bool_(c.isPrivate),allowedRoleIds:array_(c.allowedRoleIds),visitorMode:visitorModeForChannel_(c),isSystem:bool_(c.isSystem),createdBy:c.createdBy,createdAt:c.createdAt,updatedAt:c.updatedAt};}

function routeListCategories_(ctx){var tablegateId=String(ctx.params.tablegateId||'');requireMember_(tablegateId,ctx.user.id);return filter_('Categories',function(c){return c.tablegateId===tablegateId&&!c.deletedAt;}).sort(function(a,b){return num_(a.position,0)-num_(b.position,0);}).map(stripInternal_);}
function routeCreateCategory_(ctx){var tablegateId=String(ctx.params.tablegateId||'');requirePermission_(tablegateId,ctx.user.id,PERMISSIONS.MANAGE_CHANNELS);var now=nowIso_(),c=insert_('Categories',{id:id_('cat'),tablegateId:tablegateId,name:text_(ctx.params.name,64),position:int_(ctx.params.position,100,-1000,1000),createdBy:ctx.user.id,createdAt:now,updatedAt:now,deletedAt:''});audit_(tablegateId,ctx.user.id,'CATEGORY_CREATED','CATEGORY',c.id,{name:c.name});emitTablegateEvent_(tablegateId,'CATEGORY_CREATED','CATEGORY',c.id,{category:stripInternal_(c)});return stripInternal_(c);}
function routeUpdateCategory_(ctx){var c=byId_('Categories',ctx.params.categoryId);if(!c)throw new ApiError_('CATEGORY_NOT_FOUND','Category not found.');requirePermission_(c.tablegateId,ctx.user.id,PERMISSIONS.MANAGE_CHANNELS);var patch={updatedAt:nowIso_()};if(ctx.params.name!==undefined)patch.name=text_(ctx.params.name,64);if(ctx.params.position!==undefined)patch.position=int_(ctx.params.position,c.position,-1000,1000);updateRow_('Categories',c._row,patch);var u=byId_('Categories',c.id);emitTablegateEvent_(c.tablegateId,'CATEGORY_UPDATED','CATEGORY',c.id,{category:stripInternal_(u)});return stripInternal_(u);}
function routeDeleteCategory_(ctx){var c=byId_('Categories',ctx.params.categoryId);if(!c)throw new ApiError_('CATEGORY_NOT_FOUND','Category not found.');requirePermission_(c.tablegateId,ctx.user.id,PERMISSIONS.MANAGE_CHANNELS);var now=nowIso_();updateRow_('Categories',c._row,{deletedAt:now,updatedAt:now});filter_('Channels',function(ch){return ch.categoryId===c.id&&!ch.deletedAt;}).forEach(function(ch){updateRow_('Channels',ch._row,{categoryId:'',updatedAt:now});});emitTablegateEvent_(c.tablegateId,'CATEGORY_DELETED','CATEGORY',c.id,{categoryId:c.id});return {deleted:true};}

function routeListChannels_(ctx){var tablegateId=String(ctx.params.tablegateId||'');requireMember_(tablegateId,ctx.user.id);return filter_('Channels',function(c){return c.tablegateId===tablegateId&&!c.deletedAt&&canViewChannel_(c,ctx.user.id);}).sort(function(a,b){return num_(a.position,0)-num_(b.position,0);}).map(publicChannel_);}

function routeCreateChannel_(ctx){
  var tablegateId=String(ctx.params.tablegateId||'');requirePermission_(tablegateId,ctx.user.id,PERMISSIONS.MANAGE_CHANNELS);
  var type=String(ctx.params.type||ctx.params.channelType||'TEXT').toUpperCase();if(TABLEGATE.CHANNEL_TYPES.indexOf(type)===-1)throw new ApiError_('INVALID_CHANNEL_TYPE','Unsupported channel type.');
  var categoryId=String(ctx.params.categoryId||'');if(categoryId){var cat=byId_('Categories',categoryId);if(!cat||cat.tablegateId!==tablegateId)throw new ApiError_('CATEGORY_NOT_FOUND','Category not found.');}
  var visitorMode=enumValue_(ctx.params.visitorMode||'NONE',TABLEGATE.VISITOR_CHANNEL_MODES,'NONE','visitorMode');if((type==='VOICE'||type==='VIDEO')&&visitorMode==='CHAT')visitorMode='OBSERVE';
  var now=nowIso_(),c=insert_('Channels',{id:id_('chn'),tablegateId:tablegateId,categoryId:categoryId,name:text_(ctx.params.name,64).toLowerCase().replace(/\s+/g,'-'),topic:nullableText_(ctx.params.topic,TABLEGATE.MAX_TOPIC_LENGTH),type:type,position:int_(ctx.params.position,100,-1000,1000),userLimit:int_(ctx.params.userLimit,0,0,99),slowmodeSeconds:int_(ctx.params.slowmodeSeconds,0,0,21600),isPrivate:bool_(ctx.params.isPrivate),allowedRoleIds:JSON.stringify(unique_(array_(ctx.params.allowedRoleIds))),isSystem:false,createdBy:ctx.user.id,createdAt:now,updatedAt:now,deletedAt:'',visitorMode:visitorMode});
  audit_(tablegateId,ctx.user.id,'CHANNEL_CREATED','CHANNEL',c.id,{name:c.name,type:c.type,visitorMode:visitorMode});emitTablegateEvent_(tablegateId,'CHANNEL_CREATED','CHANNEL',c.id,{channel:publicChannel_(c)});return publicChannel_(c);
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
  if(ctx.params.visitorMode!==undefined){patch.visitorMode=enumValue_(ctx.params.visitorMode,TABLEGATE.VISITOR_CHANNEL_MODES,visitorModeForChannel_(c),'visitorMode');if((c.type==='VOICE'||c.type==='VIDEO')&&patch.visitorMode==='CHAT')patch.visitorMode='OBSERVE';if(bool_(c.isSystem)&&c.name==='general'&&patch.visitorMode!=='CHAT')throw new ApiError_('SYSTEM_CHANNEL','The general channel must remain available for Visitor chat.');}
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

function routeListMessages_(ctx){requireMessengerVerified_(ctx);
  var scope=requireScope_(ctx.params.scopeType||'CHANNEL',ctx.params.scopeId||ctx.params.channelId||ctx.params.dmId,ctx.user.id,ctx.params.scopeType==='DM'?null:PERMISSIONS.READ_MESSAGES);
  var limit=int_(ctx.params.limit,TABLEGATE.DEFAULT_PAGE_SIZE,1,TABLEGATE.MAX_RESULTS),before=String(ctx.params.before||'');
  var list=filter_('Messages',function(m){return m.scopeType===scope.scopeType&&m.scopeId===scope.scopeId;});
  list.sort(function(a,b){var d=new Date(b.createdAt)-new Date(a.createdAt);return d||String(b.id).localeCompare(String(a.id));});
  if(before){var beforeMsg=byId_('Messages',before,true),ts=beforeMsg?new Date(beforeMsg.createdAt).getTime():new Date(before).getTime();if(isFinite(ts))list=list.filter(function(m){return new Date(m.createdAt).getTime()<ts;});}
  var page=list.slice(0,limit),next=page.length===limit?page[page.length-1].id:'';
  return {messages:hydrateMessages_(page.reverse()),nextCursor:next,hasMore:list.length>limit};
}

function routeSendMessage_(ctx){requireMessengerVerified_(ctx);
  var p=ctx.params,scope=requireScope_(p.scopeType||'CHANNEL',p.scopeId||p.channelId||p.dmId,ctx.user.id);
  if(scope.scopeType==='DM')enforceMinorSafeDm_(scope.dm,ctx.user.id);
  if(scope.scopeType==='CHANNEL'){
    var canSend=hasPermission_(scope.tablegateId,ctx.user.id,PERMISSIONS.SEND_MESSAGES),visitorChat=isVisitor_(scope.tablegateId,ctx.user.id)&&visitorModeForChannel_(scope.channel)==='CHAT';
    if(!canSend&&!visitorChat)throw new ApiError_('VISITOR_READ_ONLY','Visitors may observe this channel but can chat only in channels marked for Visitor chat.');
    if(visitorChat){var requestedType=String(p.messageType||'CHAT').toUpperCase();if(['CHAT','OUT_OF_CHARACTER'].indexOf(requestedType)===-1)throw new ApiError_('VISITOR_CHAT_ONLY','Visitors may send only general chat or out-of-character messages.');if(p.personaId)throw new ApiError_('PLAYER_APPROVAL_REQUIRED','Visitors cannot use character personas until approved as Players.');if(array_(p.attachmentIds).length)throw new ApiError_('PLAYER_APPROVAL_REQUIRED','Visitors cannot attach gameplay files until approved as Players.');if(bool_(p.mentionsEveryone)||array_(p.mentionRoleIds).length)throw new ApiError_('FORBIDDEN','Visitors cannot mention roles or everyone.');}
    enforceSlowmode_(scope.channel,ctx.user.id);
    if(scope.channel.type==='HANDOUTS'&&!hasPermission_(scope.tablegateId,ctx.user.id,PERMISSIONS.MANAGE_HANDOUTS)&&String(p.messageType||'CHAT').toUpperCase()==='HANDOUT')throw new ApiError_('FORBIDDEN','You cannot publish handouts.');
  }
  var content=nullableText_(p.content,TABLEGATE.MAX_MESSAGE_LENGTH),attachmentIds=unique_(array_(p.attachmentIds));
  if(scope.tablegateId&&attachmentIds.length&&!hasPermission_(scope.tablegateId,ctx.user.id,PERMISSIONS.ATTACH_FILES))throw new ApiError_('FORBIDDEN','You cannot attach files in this tablegate.');
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

function routeEditMessage_(ctx){var m=byId_('Messages',ctx.params.messageId,true);if(!m||m.deletedAt)throw new ApiError_('MESSAGE_NOT_FOUND','Message not found.');requireScope_(m.scopeType,m.scopeId,ctx.user.id);if(m.authorId!==ctx.user.id)throw new ApiError_('FORBIDDEN','Only the author can edit a message.');captureMessageRevision_(m,ctx.user.id,'EDIT_BEFORE');var content=nullableText_(ctx.params.content,TABLEGATE.MAX_MESSAGE_LENGTH);if(!content&&array_(m.attachmentIds).length===0)throw new ApiError_('EMPTY_MESSAGE','Message needs text or an attachment.');updateRow_('Messages',m._row,{content:content,editedAt:nowIso_()});var u=byId_('Messages',m.id,true),scope=requireScope_(u.scopeType,u.scopeId,ctx.user.id);captureMessageRevision_(u,ctx.user.id,'EDIT_AFTER');emitScopeEvent_(scope,'MESSAGE_UPDATED','MESSAGE',u.id,{message:hydrateMessages_([u])[0]});return hydrateMessages_([u])[0];}

function routeDeleteMessage_(ctx){var m=byId_('Messages',ctx.params.messageId,true);if(!m||m.deletedAt)throw new ApiError_('MESSAGE_NOT_FOUND','Message not found.');var scope=requireScope_(m.scopeType,m.scopeId,ctx.user.id),can=m.authorId===ctx.user.id||(scope.tablegateId&&hasPermission_(scope.tablegateId,ctx.user.id,PERMISSIONS.MANAGE_MESSAGES));if(!can)throw new ApiError_('FORBIDDEN','You cannot delete this message.');captureMessageRevision_(m,ctx.user.id,'DELETE_BEFORE');var now=nowIso_();updateRow_('Messages',m._row,{content:'This message has been deleted.',attachmentIds:'[]',deletedAt:now,deletedBy:ctx.user.id,editedAt:now,isPinned:false,pinnedBy:'',pinnedAt:''});captureMessageRevision_(byId_('Messages',m.id,true),ctx.user.id,'DELETE_TOMBSTONE');emitScopeEvent_(scope,'MESSAGE_DELETED','MESSAGE',m.id,{messageId:m.id,deletedBy:ctx.user.id});return {deleted:true,messageId:m.id,evidencePreserved:true};}

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
  if(scope.tablegateId&&isVisitor_(scope.tablegateId,ctx.user.id)&&visitorModeForChannel_(scope.channel)!=='CHAT')throw new ApiError_('VISITOR_READ_ONLY','Visitors may react only in general non-player chat channels.');
  var existing=findOne_('Reactions',function(r){return r.messageId===m.id&&r.userId===ctx.user.id&&r.emoji===emoji;});if(!existing)existing=insert_('Reactions',{id:id_('rea'),messageId:m.id,userId:ctx.user.id,emoji:emoji,createdAt:nowIso_()});
  emitScopeEvent_(scope,'REACTION_ADDED','MESSAGE',m.id,{messageId:m.id,reaction:stripInternal_(existing)});return stripInternal_(existing);
}

function routeRemoveReaction_(ctx){
  var m=byId_('Messages',ctx.params.messageId,true);if(!m)throw new ApiError_('MESSAGE_NOT_FOUND','Message not found.');var scope=requireScope_(m.scopeType,m.scopeId,ctx.user.id),emoji=text_(ctx.params.emoji,32);
  var r=findOne_('Reactions',function(x){return x.messageId===m.id&&x.userId===ctx.user.id&&x.emoji===emoji;});if(r)deleteRow_('Reactions',r._row);
  emitScopeEvent_(scope,'REACTION_REMOVED','MESSAGE',m.id,{messageId:m.id,userId:ctx.user.id,emoji:emoji});return {removed:true};
}

function routeSearchMessages_(ctx){requireMessengerVerified_(ctx);
  var scope=requireScope_(ctx.params.scopeType||'CHANNEL',ctx.params.scopeId||ctx.params.channelId||ctx.params.dmId,ctx.user.id),q=lower_(text_(ctx.params.query||ctx.params.q,200)),limit=int_(ctx.params.limit,50,1,100);
  var list=filter_('Messages',function(m){return m.scopeType===scope.scopeType&&m.scopeId===scope.scopeId&&!m.deletedAt&&lower_(m.content).indexOf(q)!==-1;}).sort(function(a,b){return new Date(b.createdAt)-new Date(a.createdAt);}).slice(0,limit);
  return hydrateMessages_(list);
}

function routeStartTyping_(ctx){requireMessengerVerified_(ctx);
  var scope=requireScope_(ctx.params.scopeType||'CHANNEL',ctx.params.scopeId||ctx.params.channelId||ctx.params.dmId,ctx.user.id),now=nowIso_(),expires=addMsIso_(TABLEGATE.TYPING_TTL_SECONDS*1000);
  if(scope.tablegateId&&isVisitor_(scope.tablegateId,ctx.user.id)&&visitorModeForChannel_(scope.channel)!=='CHAT')throw new ApiError_('VISITOR_READ_ONLY','Visitors cannot type in observation-only channels.');
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

function routeCreateDm_(ctx){requireMessengerVerified_(ctx);var recipientId=String(ctx.params.recipientId||ctx.params.userId||'');if(recipientId===ctx.user.id)throw new ApiError_('INVALID_RECIPIENT','You cannot create a DM with yourself.');var recipient=byId_('Users',recipientId,true);if(!recipient||bool_(recipient.disabled))throw new ApiError_('USER_NOT_FOUND','User not found.');assertNotBlocked_(ctx.user.id,recipientId);enforceMinorDirectContact_(ctx.user.id,recipientId);var key=pairKey_(ctx.user.id,recipientId),dm=findOne_('DmChannels',function(d){return d.type==='DIRECT'&&d.pairKey===key;}),now=nowIso_();if(dm){if(dm.closedAt)updateRow_('DmChannels',dm._row,{closedAt:'',updatedAt:now});[ctx.user.id,recipientId].forEach(function(uid){var dp=findOne_('DmParticipants',function(x){return x.dmId===dm.id&&x.userId===uid;});if(dp&&dp.leftAt)updateRow_('DmParticipants',dp._row,{leftAt:'',joinedAt:now});else if(!dp)insert_('DmParticipants',{id:id_('dmp'),dmId:dm.id,userId:uid,role:'MEMBER',joinedAt:now,leftAt:''});});dm=byId_('DmChannels',dm.id,true);}else{dm=insert_('DmChannels',{id:id_('dm'),type:'DIRECT',pairKey:key,name:'',iconAttachmentId:'',ownerId:'',createdAt:now,updatedAt:now,closedAt:''});insert_('DmParticipants',{id:id_('dmp'),dmId:dm.id,userId:ctx.user.id,role:'MEMBER',joinedAt:now,leftAt:''});insert_('DmParticipants',{id:id_('dmp'),dmId:dm.id,userId:recipientId,role:'MEMBER',joinedAt:now,leftAt:''});}emitUserEvent_(recipientId,'DM_CREATED','DM',dm.id,{dmId:dm.id,actorId:ctx.user.id});return publicDm_(dm,ctx.user.id);}

function routeCreateGroupDm_(ctx){requireMessengerVerified_(ctx);var ids=unique_(array_(ctx.params.recipientIds)).filter(function(id){return id!==ctx.user.id;});if(ids.length<1||ids.length>19)throw new ApiError_('INVALID_RECIPIENTS','Group DM requires 1–19 other participants.');var allIds=[ctx.user.id].concat(ids);ids.forEach(function(uid){var u=byId_('Users',uid,true);if(!u||bool_(u.disabled))throw new ApiError_('USER_NOT_FOUND','A recipient was not found.');assertNotBlocked_(ctx.user.id,uid);});enforceMinorSafeGroupParticipants_(allIds);var now=nowIso_(),dm=insert_('DmChannels',{id:id_('dm'),type:'GROUP',pairKey:'',name:nullableText_(ctx.params.name,80)||'Adventuring Party',iconAttachmentId:'',ownerId:ctx.user.id,createdAt:now,updatedAt:now,closedAt:''});insert_('DmParticipants',{id:id_('dmp'),dmId:dm.id,userId:ctx.user.id,role:'OWNER',joinedAt:now,leftAt:''});ids.forEach(function(uid){insert_('DmParticipants',{id:id_('dmp'),dmId:dm.id,userId:uid,role:'MEMBER',joinedAt:now,leftAt:''});emitUserEvent_(uid,'GROUP_DM_CREATED','DM',dm.id,{dmId:dm.id,actorId:ctx.user.id});});return publicDm_(dm,ctx.user.id);}

function routeListDms_(ctx){requireMessengerVerified_(ctx);
  var ids={};filter_('DmParticipants',function(dp){return dp.userId===ctx.user.id&&!dp.leftAt;}).forEach(function(dp){ids[dp.dmId]=true;});
  return filter_('DmChannels',function(dm){return ids[dm.id]&&!dm.closedAt;}).sort(function(a,b){return new Date(b.updatedAt)-new Date(a.updatedAt);}).map(function(dm){var out=publicDm_(dm,ctx.user.id),last=filter_('Messages',function(m){return m.scopeType==='DM'&&m.scopeId===dm.id;}).sort(function(a,b){return new Date(b.createdAt)-new Date(a.createdAt);})[0];out.lastMessage=last?hydrateMessages_([last])[0]:null;return out;});
}

function routeGetDm_(ctx){requireMessengerVerified_(ctx);var dm=requireDm_(ctx.params.dmId,ctx.user.id);return publicDm_(dm,ctx.user.id);}

function routeUpdateGroupDm_(ctx){
  var dm=requireDm_(ctx.params.dmId,ctx.user.id);if(dm.type!=='GROUP'||dm.ownerId!==ctx.user.id)throw new ApiError_('FORBIDDEN','Only the group owner can update this conversation.');var patch={updatedAt:nowIso_()};
  if(ctx.params.name!==undefined)patch.name=nullableText_(ctx.params.name,80)||'Adventuring Party';if(ctx.params.iconAttachmentId!==undefined){if(ctx.params.iconAttachmentId)requireOwnedAttachment_(ctx.params.iconAttachmentId,ctx.user.id);patch.iconAttachmentId=String(ctx.params.iconAttachmentId||'');}
  updateRow_('DmChannels',dm._row,patch);var u=byId_('DmChannels',dm.id,true);emitDmEvent_(dm.id,'DM_UPDATED','DM',dm.id,{dm:publicDm_(u,ctx.user.id)});return publicDm_(u,ctx.user.id);
}

function routeAddDmParticipant_(ctx){var dm=requireDm_(ctx.params.dmId,ctx.user.id);if(dm.type!=='GROUP'||dm.ownerId!==ctx.user.id)throw new ApiError_('FORBIDDEN','Only the group owner can add participants.');var uid=String(ctx.params.userId||''),u=byId_('Users',uid,true);if(!u||bool_(u.disabled))throw new ApiError_('USER_NOT_FOUND','User not found.');assertNotBlocked_(ctx.user.id,uid);var current=dmParticipants_(dm.id);if(current.length>=20)throw new ApiError_('GROUP_FULL','Group DMs support up to 20 participants.');enforceMinorSafeGroupParticipants_(current.map(function(x){return x.userId;}).concat([uid]));var dp=findOne_('DmParticipants',function(x){return x.dmId===dm.id&&x.userId===uid;}),now=nowIso_();if(dp)updateRow_('DmParticipants',dp._row,{leftAt:'',joinedAt:now,role:'MEMBER'});else insert_('DmParticipants',{id:id_('dmp'),dmId:dm.id,userId:uid,role:'MEMBER',joinedAt:now,leftAt:''});emitDmEvent_(dm.id,'DM_PARTICIPANT_ADDED','USER',uid,{userId:uid});emitUserEvent_(uid,'GROUP_DM_CREATED','DM',dm.id,{dmId:dm.id,actorId:ctx.user.id});return {added:true};}

function routeRemoveDmParticipant_(ctx){
  var dm=requireDm_(ctx.params.dmId,ctx.user.id),uid=String(ctx.params.userId||ctx.user.id);if(dm.type!=='GROUP')throw new ApiError_('INVALID_DM','Participants can only be removed from group DMs.');if(uid!==ctx.user.id&&dm.ownerId!==ctx.user.id)throw new ApiError_('FORBIDDEN','Only the group owner can remove another participant.');if(uid===dm.ownerId)throw new ApiError_('OWNER_CANNOT_LEAVE','Transfer group ownership before leaving.');
  var dp=findOne_('DmParticipants',function(x){return x.dmId===dm.id&&x.userId===uid&&!x.leftAt;});if(dp)updateRow_('DmParticipants',dp._row,{leftAt:nowIso_()});emitDmEvent_(dm.id,'DM_PARTICIPANT_REMOVED','USER',uid,{userId:uid});return {removed:true};
}

function routeTransferDmOwnership_(ctx){var dm=requireDm_(ctx.params.dmId,ctx.user.id);if(dm.type!=='GROUP'||dm.ownerId!==ctx.user.id)throw new ApiError_('FORBIDDEN','Only the group owner can transfer ownership.');var uid=String(ctx.params.userId||'');var target=findOne_('DmParticipants',function(x){return x.dmId===dm.id&&x.userId===uid&&!x.leftAt;});if(!target)throw new ApiError_('NOT_A_PARTICIPANT','Target is not in this DM.');var old=findOne_('DmParticipants',function(x){return x.dmId===dm.id&&x.userId===ctx.user.id&&!x.leftAt;});updateRow_('DmChannels',dm._row,{ownerId:uid,updatedAt:nowIso_()});updateRow_('DmParticipants',target._row,{role:'OWNER'});if(old)updateRow_('DmParticipants',old._row,{role:'MEMBER'});emitDmEvent_(dm.id,'DM_OWNERSHIP_TRANSFERRED','USER',uid,{ownerId:uid});return {transferred:true,ownerId:uid};}

function routeCloseDm_(ctx){var dm=requireDm_(ctx.params.dmId,ctx.user.id),dp=findOne_('DmParticipants',function(x){return x.dmId===dm.id&&x.userId===ctx.user.id&&!x.leftAt;});if(dm.type==='GROUP'&&dm.ownerId===ctx.user.id)throw new ApiError_('OWNER_CANNOT_LEAVE','Transfer group ownership before leaving.');if(dp)updateRow_('DmParticipants',dp._row,{leftAt:nowIso_()});var remain=filter_('DmParticipants',function(x){return x.dmId===dm.id&&!x.leftAt;});if(remain.length===0)updateRow_('DmChannels',dm._row,{closedAt:nowIso_(),updatedAt:nowIso_()});return {closed:true};}

/* =============================
 * FOLLOWERS, PUBLIC PROFILES, AND FRIEND-STYLE SOCIAL GRAPH
 * ============================= */
function followView_(f, viewerId){
  var u=byId_('Users',f.followedId===viewerId?f.followerId:f.followedId,true);
  return {id:f.id,status:f.status,direction:f.followerId===viewerId?'OUTGOING':'INCOMING',user:publicUser_(u),notificationPreference:f.notificationPreference||'LOVE',createdAt:f.createdAt,updatedAt:f.updatedAt};
}
function routeGetUserProfile_(ctx){
  var key=String(ctx.params.slug||ctx.params.profileSlug||ctx.params.userId||'').trim();
  var user=findOne_('Users',function(u){return !bool_(u.disabled)&&(u.id===key||String(u.profileSlug||'').toLowerCase()===key.toLowerCase()||String(u.username||'').toLowerCase()===key.toLowerCase());});
  if(!user)throw new ApiError_('USER_NOT_FOUND','Profile not found.');
  assertNotBlocked_(ctx.user.id,user.id);
  var following=!!findOne_('Follows',function(f){return f.followerId===ctx.user.id&&f.followedId===user.id&&f.status==='ACTIVE';});
  var followingMe=!!findOne_('Follows',function(f){return f.followerId===user.id&&f.followedId===ctx.user.id&&f.status==='ACTIVE';});
  return {user:publicUser_(user),relationship:{following:following,followingMe:followingMe,friend:!!findOne_('Friendships',function(f){return f.status==='ACCEPTED'&&((f.requesterId===ctx.user.id&&f.addresseeId===user.id)||(f.requesterId===user.id&&f.addresseeId===ctx.user.id));})},profileUrl:profileUrlFor_(user.profileSlug||uniqueProfileSlug_(user.username,user.id))};
}
function routeListFollowers_(ctx){var userId=String(ctx.params.userId||ctx.params.profileUserId||'');if(!userId)userId=ctx.user.id;var user=byId_('Users',userId,true);if(!user||bool_(user.disabled))throw new ApiError_('USER_NOT_FOUND','User not found.');assertNotBlocked_(ctx.user.id,userId);return filter_('Follows',function(f){return f.followedId===userId&&f.status==='ACTIVE';}).sort(function(a,b){return new Date(b.createdAt)-new Date(a.createdAt);}).map(function(f){return {id:f.id,user:publicUser_(byId_('Users',f.followerId,true)),createdAt:f.createdAt};});}
function routeListFollowing_(ctx){var userId=String(ctx.params.userId||ctx.params.profileUserId||'');if(!userId)userId=ctx.user.id;var user=byId_('Users',userId,true);if(!user||bool_(user.disabled))throw new ApiError_('USER_NOT_FOUND','User not found.');assertNotBlocked_(ctx.user.id,userId);return filter_('Follows',function(f){return f.followerId===userId&&f.status==='ACTIVE';}).sort(function(a,b){return new Date(b.createdAt)-new Date(a.createdAt);}).map(function(f){return {id:f.id,user:publicUser_(byId_('Users',f.followedId,true)),createdAt:f.createdAt,notificationPreference:f.notificationPreference||'LOVE'};});}
function routeFollowUser_(ctx){var target=resolveUserTarget_(ctx.params);if(!target||bool_(target.disabled))throw new ApiError_('USER_NOT_FOUND','User not found.');if(target.id===ctx.user.id)throw new ApiError_('INVALID_TARGET','You cannot follow yourself.');assertNotBlocked_(ctx.user.id,target.id);var pair=pairKey_(ctx.user.id,target.id),f=findOne_('Follows',function(x){return x.pairKey===pair;});var now=nowIso_();if(f)updateRow_('Follows',f._row,{status:'ACTIVE',notificationPreference:f.notificationPreference||'LOVE',updatedAt:now});else f=insert_('Follows',{id:id_('fol'),pairKey:pair,followerId:ctx.user.id,followedId:target.id,status:'ACTIVE',notificationPreference:'LOVE',createdAt:now,updatedAt:now});createNotification_(target.id,'FOLLOWED_USER',ctx.user.id,'USER',ctx.user.id,'',{followId:f.id,actor:publicUser_(ctx.user)});emitUserEvent_(target.id,'FOLLOWED','USER',ctx.user.id,{followId:f.id,actor:publicUser_(ctx.user)});return followView_(f,ctx.user.id);}
function routeUnfollowUser_(ctx){var target=resolveUserTarget_(ctx.params);if(!target)throw new ApiError_('USER_NOT_FOUND','User not found.');var f=findOne_('Follows',function(x){return x.followerId===ctx.user.id&&x.followedId===target.id&&x.status==='ACTIVE';});if(f)updateRow_('Follows',f._row,{status:'REMOVED',updatedAt:nowIso_()});return {unfollowed:true,userId:target.id};}
function routeSetFollowNotificationPreference_(ctx){var target=resolveUserTarget_(ctx.params);if(!target)throw new ApiError_('USER_NOT_FOUND','User not found.');var pref=String(ctx.params.preference||'LOVE').toUpperCase();if(['LIKE','LOVE','FAVORITE'].indexOf(pref)===-1)throw new ApiError_('INVALID_FOLLOW_NOTIFICATION_PREFERENCE','Choose LIKE, LOVE, or FAVORITE.');var f=findOne_('Follows',function(x){return x.followerId===ctx.user.id&&x.followedId===target.id&&x.status==='ACTIVE';});if(!f)throw new ApiError_('NOT_FOLLOWING','Follow the user before changing notification preference.');updateRow_('Follows',f._row,{notificationPreference:pref,updatedAt:nowIso_()});return {userId:target.id,notificationPreference:pref};}

/* =============================
 * FRIENDS, BLOCKS, IGNORES
 * ============================= */

function routeListFriends_(ctx){
  var users={};rows_('Users').forEach(function(u){users[u.id]=u;});
  return filter_('Friendships',function(f){return (f.requesterId===ctx.user.id||f.addresseeId===ctx.user.id)&&f.status!=='REMOVED';}).map(function(f){var other=f.requesterId===ctx.user.id?f.addresseeId:f.requesterId;return {id:f.id,status:f.status,direction:f.requesterId===ctx.user.id?'OUTGOING':'INCOMING',otherUser:publicUser_(users[other]),createdAt:f.createdAt,updatedAt:f.updatedAt};});
}

function resolveUserTarget_(p){
  if(p.userId){var by=byId_('Users',String(p.userId),true);if(by)return by;}
  if(p.profileSlug||p.slug){var slug=String(p.profileSlug||p.slug).trim().toLowerCase();var bySlug=findOne_('Users',function(u){return String(u.profileSlug||'').toLowerCase()===slug&&!bool_(u.disabled);});if(bySlug)return bySlug;}
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
function setSafetyRelation_(userId,targetId,type,active){if(userId===targetId)throw new ApiError_('INVALID_TARGET','You cannot target yourself.');var target=byId_('Users',targetId,true);if(!target)throw new ApiError_('USER_NOT_FOUND','User not found.');var r=findOne_('SafetyRelations',function(x){return x.userId===userId&&x.targetUserId===targetId&&x.type===type&&!x.revokedAt;});if(active&&!r)r=insert_('SafetyRelations',{id:id_('saf'),userId:userId,targetUserId:targetId,type:type,createdAt:nowIso_(),revokedAt:''});if(!active&&r)updateRow_('SafetyRelations',r._row,{revokedAt:nowIso_()});if(type==='BLOCK'&&active){var f=findOne_('Friendships',function(x){return x.pairKey===pairKey_(userId,targetId)&&x.status!=='REMOVED';});if(f)updateRow_('Friendships',f._row,{status:'REMOVED',updatedAt:nowIso_()});severBlockedContact_(userId,targetId);}return {active:active,type:type,targetUserId:targetId,evidencePreserved:true};}
function routeBlockUser_(ctx){return setSafetyRelation_(ctx.user.id,String(ctx.params.userId||''),'BLOCK',true);}
function routeUnblockUser_(ctx){return setSafetyRelation_(ctx.user.id,String(ctx.params.userId||''),'BLOCK',false);}
function routeIgnoreUser_(ctx){return setSafetyRelation_(ctx.user.id,String(ctx.params.userId||''),'IGNORE',true);}
function routeUnignoreUser_(ctx){return setSafetyRelation_(ctx.user.id,String(ctx.params.userId||''),'IGNORE',false);}
function routeListSafety_(ctx){var users={};rows_('Users').forEach(function(u){users[u.id]=u;});return filter_('SafetyRelations',function(r){return r.userId===ctx.user.id&&!r.revokedAt;}).map(function(r){return {id:r.id,type:r.type,targetUser:publicUser_(users[r.targetUserId]),createdAt:r.createdAt};});}

function configuredSafetyReviewerEmails_(){
  var raw=PropertiesService.getScriptProperties().getProperty(TABLEGATE.SAFETY_REVIEWER_EMAILS_PROPERTY)||'[]',items=[];try{items=JSON.parse(raw);}catch(e){items=String(raw).split(',');}if(!Array.isArray(items))items=[];return unique_(items.map(function(x){return lower_(String(x||'').trim());}).filter(function(x){return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(x);}));
}
function isSafetyReviewer_(user){return !!user&&configuredSafetyReviewerEmails_().indexOf(lower_(user.email||''))!==-1;}
function requireSafetyReviewer_(user){if(!isSafetyReviewer_(user))throw new ApiError_('FORBIDDEN','This action is limited to configured Tablegate safety reviewers.');return true;}
function safetyReportingGuidance_(immediateDanger){return {ageVerificationRequired:false,canReportWithoutIdVerification:true,emergency:immediateDanger?'Contact emergency services now if anyone is in immediate danger. Tablegate cannot place the emergency call for you.':'If danger becomes immediate, contact emergency services.',police:'You may contact the appropriate local law-enforcement agency and provide the Tablegate safety case reference. Add any agency name or police report number to the case afterward.',preservation:'Tablegate preserves the submitted evidence snapshot and linked attachments for the configured evidence-hold period. Authorized staff may respond to valid legal process.',privacy:'Do not post identity documents, home addresses, or police paperwork in public chats. Provide sensitive information directly to the relevant agency.'};}
function routeGetSafetyReportingInfo_(){return {categories:TABLEGATE.SAFETY_REPORT_CATEGORIES,statuses:TABLEGATE.SAFETY_REPORT_STATUSES,reportableObjects:TABLEGATE_V8_FINAL.REPORTABLE_OBJECTS,reporterRoles:TABLEGATE_V8_FINAL.REPORTER_ROLES,urgencyChoices:TABLEGATE_V8_FINAL.SAFETY_URGENCY,severityLevels:TABLEGATE_V8_FINAL.SAFETY_SEVERITIES,protectiveActions:TABLEGATE_V8_FINAL.PROTECTIVE_ACTIONS,responseWindowsHours:TABLEGATE_V8_FINAL.SAFETY_RESPONSE_WINDOWS_HOURS,evidenceHoldDays:TABLEGATE.SAFETY_EVIDENCE_HOLD_DAYS,ageVerificationRequired:false,anonymousReportsAllowed:true,privateIncidentJournal:true,ageAssurancePolicy:publicAgeAssurancePolicy_(),lawEnforcementContact:PropertiesService.getScriptProperties().getProperty(TABLEGATE.LAW_ENFORCEMENT_CONTACT_PROPERTY)||'',guidance:safetyReportingGuidance_(false),nudges:TABLEGATE_V8_FINAL.SAFETY_NUDGES};}
function safetyEvidenceForMessages_(messageIds,reporterId,reportedUserId){var evidence=[],attachmentIds=[];unique_(messageIds).slice(0,100).forEach(function(messageId){var m=byId_('Messages',messageId,true);if(!m||!canAccessMessageForSafety_(m,reporterId))throw new ApiError_('EVIDENCE_MESSAGE_UNAVAILABLE','A selected message is missing or inaccessible.',{messageId:messageId});var author=byId_('Users',m.authorId,true),ids=array_(m.attachmentIds),revisions=filter_('MessageRevisions',function(r){return r.messageId===m.id;}).sort(function(a,b){return a.revisionNumber-b.revisionNumber;}).map(function(r){return {revisionNumber:int_(r.revisionNumber,0),revisionType:r.revisionType,content:r.content||'',attachmentIds:parseJsonCell_(r.attachmentIdsJson,[]),integrityHash:r.integrityHash,createdAt:r.createdAt};});attachmentIds=attachmentIds.concat(ids);evidence.push({messageId:m.id,scopeType:m.scopeType,scopeId:m.scopeId,tablegateId:m.tablegateId||'',authorId:m.authorId,authorTag:author?author.username+'#'+author.discriminator:'Unknown user',reportedUserMessage:m.authorId===reportedUserId,messageType:m.messageType,content:m.content||'',attachmentIds:ids,revisions:revisions,createdAt:m.createdAt,editedAt:m.editedAt||'',deletedAt:m.deletedAt||''});});return {messages:evidence,attachmentIds:unique_(attachmentIds)};}
function holdSafetyAttachments_(attachmentIds,reporterId,preservationUntil){
  var held=[];unique_(attachmentIds).slice(0,100).forEach(function(attachmentId){var a=byId_('Attachments',attachmentId,true);if(!a||a.deletedAt)throw new ApiError_('EVIDENCE_ATTACHMENT_UNAVAILABLE','A selected attachment is missing.',{attachmentId:attachmentId});requireAttachmentAccess_(a.id,reporterId,a.tablegateId||'',a.dmId||'');var existing=a.safetyHoldUntil&&isFuture_(a.safetyHoldUntil)?new Date(a.safetyHoldUntil).getTime():0,target=new Date(preservationUntil).getTime();if(target>existing)updateRow_('Attachments',a._row,{safetyHoldUntil:preservationUntil});held.push({attachmentId:a.id,ownerId:a.ownerId,tablegateId:a.tablegateId||'',dmId:a.dmId||'',messageId:a.messageId||'',originalName:a.originalName,mimeType:a.mimeType,sizeBytes:num_(a.sizeBytes,0),sha256:a.sha256||'',createdAt:a.createdAt,holdUntil:target>existing?preservationUntil:a.safetyHoldUntil});});return held;
}
function storeSafetyEvidence_(reportId,evidenceType,items){var now=nowIso_(),report=byId_('SafetyReports',reportId,true),retention=report&&report.preservationUntil?report.preservationUntil:addMsIso_(TABLEGATE.SAFETY_EVIDENCE_HOLD_DAYS*86400000);items.forEach(function(item){var snap=jsonCell_(item,{},'safety evidence item'),hash=sha256Hex_(snap);insert_('SafetyEvidence',{id:id_('sev'),reportId:reportId,evidenceType:evidenceType,sourceId:String(item.messageId||item.attachmentId||item.id||''),snapshotJson:snap,createdAt:now,integrityHash:hash,quarantined:evidenceType==='SUSPECTED_CSAM',originalCapturedAt:now,retentionUntil:retention});});}
function listSafetyEvidence_(reportId){return filter_('SafetyEvidence',function(e){return e.reportId===reportId;}).sort(function(a,b){return a._row-b._row;}).map(function(e){return {id:e.id,evidenceType:e.evidenceType,sourceId:e.sourceId,snapshot:parseJsonCell_(e.snapshotJson,{}),integrityHash:e.integrityHash||sha256Hex_(e.snapshotJson||''),quarantined:bool_(e.quarantined),createdAt:e.createdAt,retentionUntil:e.retentionUntil||''};});}
function publicSafetyReport_(r,includeEvidence,viewerId){var out={id:r.id,caseReference:r.id,reporterId:r.reporterId||'',reportedUserId:r.reportedUserId||'',tablegateId:r.tablegateId||'',scopeType:r.scopeType||'',scopeId:r.scopeId||'',category:r.category,summary:r.summary,details:r.details||'',messageIds:parseJsonCell_(r.messageIdsJson,[]),attachmentIds:parseJsonCell_(r.attachmentIdsJson,[]),immediateDanger:bool_(r.immediateDanger),reporterRole:r.reporterRole||'AFFECTED_PERSON',urgency:r.urgency||'GENERAL_POLICY_VIOLATION',severity:r.severity||severityForSafety_(r.category,r.urgency,bool_(r.immediateDanger)),status:r.status,centralOnly:bool_(r.centralOnly),findingOutcome:r.findingOutcome||'',protectiveActions:parseJsonCell_(r.protectiveActionsJson,[]),safeContact:r.reporterId===viewerId||isSafetyReviewerId_(viewerId)?parseJsonCell_(r.safeContactJson,{}):{},supportPerson:r.reporterId===viewerId||isSafetyReviewerId_(viewerId)?parseJsonCell_(r.supportPersonJson,{}):{},linkedReportId:r.linkedReportId||'',holdActive:bool_(r.holdActive),policeReportNumber:r.reporterId===viewerId||isSafetyReviewerId_(viewerId)?(r.policeReportNumber||''):'',lawEnforcementAgency:r.reporterId===viewerId||isSafetyReviewerId_(viewerId)?(r.lawEnforcementAgency||''):'',preservationUntil:r.preservationUntil,createdAt:r.createdAt,updatedAt:r.updatedAt,lastStatusAt:r.lastStatusAt||r.updatedAt,reviewedAt:r.reviewedAt||'',reviewedBy:isSafetyReviewerId_(viewerId)?(r.reviewedBy||''):''};if(includeEvidence){out.evidence={summary:parseJsonCell_(r.evidenceJson,{}),items:listSafetyEvidenceForViewer_(r.id,viewerId||'',includeEvidence?'VIEW':'LIST')};out.updates=listSafetyCaseUpdates_(r.id,viewerId||'');}return out;}
function notifySafetyReviewers_(report){configuredSafetyReviewerEmails_().forEach(function(email){try{MailApp.sendEmail({to:email,subject:'Tablegate safety report '+report.id,body:'A new Tablegate safety report was submitted.\n\nCase: '+report.id+'\nCategory: '+report.category+'\nImmediate danger: '+String(bool_(report.immediateDanger))+'\nCreated: '+report.createdAt+'\n\nReview it through the configured Tablegate safety-review interface. Do not reply with sensitive evidence by email.'});}catch(e){}});}
function routeReportUserSafety_(ctx){return createSafetyReportCore_(ctx.user,ctx.params,false);}
function routeListMySafetyReports_(ctx){return filter_('SafetyReports',function(r){return r.reporterId===ctx.user.id;}).sort(function(a,b){return new Date(b.createdAt)-new Date(a.createdAt);}).slice(0,int_(ctx.params.limit,100,1,200)).map(function(r){return publicSafetyReport_(r,false,ctx.user.id);});}
function requireVisibleSafetyReport_(reportId,user){var r=byId_('SafetyReports',reportId,true);if(!r||(r.reporterId!==user.id&&!isSafetyReviewer_(user)))throw new ApiError_('SAFETY_REPORT_NOT_FOUND','Safety report not found.');return r;}
function routeGetSafetyReport_(ctx){var r=requireVisibleSafetyReport_(ctx.params.reportId,ctx.user);return {report:publicSafetyReport_(r,true,ctx.user.id),guidance:safetyReportingGuidance_(bool_(r.immediateDanger))};}
function routeUpdateSafetyReportPoliceInfo_(ctx){var r=requireVisibleSafetyReport_(ctx.params.reportId,ctx.user);if(r.reporterId!==ctx.user.id&&!isSafetyReviewer_(ctx.user))throw new ApiError_('FORBIDDEN','You cannot update this report.');var patch={updatedAt:nowIso_()};if(ctx.params.policeReportNumber!==undefined)patch.policeReportNumber=nullableText_(ctx.params.policeReportNumber,200);if(ctx.params.lawEnforcementAgency!==undefined)patch.lawEnforcementAgency=nullableText_(ctx.params.lawEnforcementAgency,300);updateRow_('SafetyReports',r._row,patch);return publicSafetyReport_(byId_('SafetyReports',r.id,true),false);}
function routeExportSafetyReport_(ctx){var r=requireVisibleSafetyReport_(ctx.params.reportId,ctx.user),evidence=listSafetyEvidenceForViewer_(r.id,ctx.user.id,'EXPORT');return {exportedAt:nowIso_(),case:publicSafetyReport_(r,false,ctx.user.id),updates:listSafetyCaseUpdates_(r.id,ctx.user.id),evidence:{summary:parseJsonCell_(r.evidenceJson,{}),items:evidence.map(redactEvidenceForExport_)},guidance:safetyReportingGuidance_(bool_(r.immediateDanger)),notice:'This redacted export is an application record, not a police report or legal conclusion. Suspected illegal imagery is never included.'};}
function routeListSafetyReportsForReview_(ctx){requireSafetyReviewer_(ctx.user);var status=String(ctx.params.status||'').toUpperCase(),severity=String(ctx.params.severity||'').toUpperCase();return filter_('SafetyReports',function(r){return(!status||r.status===status)&&(!severity||(r.severity||severityForSafety_(r.category,r.urgency,bool_(r.immediateDanger)))===severity);}).sort(function(a,b){return safetyPriority_(b)-safetyPriority_(a)||new Date(b.createdAt)-new Date(a.createdAt);}).slice(0,int_(ctx.params.limit,100,1,200)).map(function(r){return publicSafetyReport_(r,false,ctx.user.id);});}
function routeReviewSafetyReport_(ctx){requireSafetyReviewer_(ctx.user);var r=byId_('SafetyReports',ctx.params.reportId,true);if(!r)throw new ApiError_('SAFETY_REPORT_NOT_FOUND','Safety report not found.');var status=enumValue_(ctx.params.status,TABLEGATE.SAFETY_REPORT_STATUSES,r.status,'safety report status'),now=nowIso_(),patch={status:status,updatedAt:now,lastStatusAt:now,reviewedAt:now,reviewedBy:ctx.user.id};if(ctx.params.severity!==undefined)patch.severity=enumValue_(ctx.params.severity,TABLEGATE_V8_FINAL.SAFETY_SEVERITIES,r.severity||'STANDARD','severity');if(ctx.params.findingOutcome!==undefined)patch.findingOutcome=enumValue_(ctx.params.findingOutcome,TABLEGATE_V8_FINAL.SAFETY_FINDINGS,r.findingOutcome||'NO_VIOLATION_FOUND','findingOutcome');if(ctx.params.protectiveActions!==undefined)patch.protectiveActionsJson=jsonCell_(unique_(array_(ctx.params.protectiveActions).map(function(x){return enumValue_(x,TABLEGATE_V8_FINAL.PROTECTIVE_ACTIONS,'NO_CONTACT_ORDER','protectiveAction');})),[],'protectiveActions');if(ctx.params.policeReportNumber!==undefined)patch.policeReportNumber=nullableText_(ctx.params.policeReportNumber,200);if(ctx.params.lawEnforcementAgency!==undefined)patch.lawEnforcementAgency=nullableText_(ctx.params.lawEnforcementAgency,300);updateRow_('SafetyReports',r._row,patch);addSafetyCaseUpdate_(r.id,ctx.user.id,'REVIEWER','STATUS_CHANGED','Case status updated.',{status:status,severity:patch.severity||r.severity,findingOutcome:patch.findingOutcome||r.findingOutcome},true);createNotification_(r.reporterId,'SAFETY_REPORT_UPDATED',ctx.user.id,'SAFETY_REPORT',r.id,'',{status:status});return publicSafetyReport_(byId_('SafetyReports',r.id,true),false,ctx.user.id);}


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
  var tablegateId=String(p.tablegateId||''),dmId=String(p.dmId||'');if(tablegateId){requirePlayer_(tablegateId,ctx.user.id,'A tablegate admin must approve you as a Player before you can upload tablegate files.');requirePermission_(tablegateId,ctx.user.id,PERMISSIONS.ATTACH_FILES);}if(dmId)requireDm_(dmId,ctx.user.id);
  var aid=id_('att'),stored=aid+'_'+name,blob=Utilities.newBlob(bytes,mime,stored),file=uploadFolder_().createFile(blob);var now=nowIso_();
  var a=insert_('Attachments',{id:aid,ownerId:ctx.user.id,tablegateId:tablegateId,dmId:dmId,scopeType:'',scopeId:'',messageId:'',fileId:file.getId(),originalName:name,storedName:stored,mimeType:mime,sizeBytes:bytes.length,sha256:sha256Hex_(Utilities.base64Encode(bytes)),createdAt:now,deletedAt:'',safetyHoldUntil:''});return publicAttachment_(a);
}

function routeDownloadAttachment_(ctx){
  var a=byId_('Attachments',ctx.params.attachmentId,true);if(!a)throw new ApiError_('ATTACHMENT_NOT_FOUND','Attachment not found.');requireAttachmentAccess_(a.id,ctx.user.id,a.tablegateId||'',a.dmId||'');
  var file;try{file=DriveApp.getFileById(a.fileId);}catch(e){throw new ApiError_('FILE_MISSING','Stored file is missing.');}var blob=file.getBlob();return {attachment:publicAttachment_(a),base64:Utilities.base64Encode(blob.getBytes())};
}

function routeDeleteAttachment_(ctx){
  var a=requireOwnedAttachment_(ctx.params.attachmentId,ctx.user.id);if(a.safetyHoldUntil&&isFuture_(a.safetyHoldUntil))throw new ApiError_('SAFETY_EVIDENCE_HOLD','This attachment is preserved for an active safety report and cannot be deleted yet.',{holdUntil:a.safetyHoldUntil});if(attachmentInUse_(a.id))throw new ApiError_('ATTACHMENT_IN_USE','Remove this attachment from its Tablegate content before deleting it.');
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

function publicVoiceState_(v){var u=byId_('Users',v.userId,true);return {id:v.id,tablegateId:v.tablegateId,channelId:v.channelId,userId:v.userId,user:publicUser_(u),sessionId:v.sessionId,muted:bool_(v.muted),deafened:bool_(v.deafened),videoEnabled:bool_(v.videoEnabled),screenSharing:bool_(v.screenSharing),pushToTalk:bool_(v.pushToTalk),whispering:bool_(v.whispering),listenOnly:bool_(v.listenOnly),joinedAt:v.joinedAt,updatedAt:v.updatedAt};}

function routeJoinVoice_(ctx){
  var channel=requireChannel_(ctx.params.channelId,ctx.user.id);if(['VOICE','VIDEO'].indexOf(channel.type)===-1)throw new ApiError_('NOT_VOICE_CHANNEL','Channel is not a voice or video room.');requirePermission_(channel.tablegateId,ctx.user.id,PERMISSIONS.CONNECT_VOICE);
  var visitor=isVisitor_(channel.tablegateId,ctx.user.id),listenOnly=visitor||!hasPermission_(channel.tablegateId,ctx.user.id,PERMISSIONS.SPEAK);if(visitor&&visitorModeForChannel_(channel)!=='OBSERVE')throw new ApiError_('VISITOR_VOICE_RESTRICTED','Visitors may join only voice or video rooms explicitly configured for listen-only observation.');
  var current=filter_('VoiceStates',function(v){return v.userId===ctx.user.id;}).sort(function(a,b){return b._row-a._row;});current.forEach(function(v){deleteRow_('VoiceStates',v._row);emitChannelEvent_(v.channelId,'VOICE_USER_LEFT','USER',ctx.user.id,{userId:ctx.user.id});});
  var count=filter_('VoiceStates',function(v){return v.channelId===channel.id;}).length;if(int_(channel.userLimit,0)>0&&count>=int_(channel.userLimit,0))throw new ApiError_('VOICE_FULL','Voice channel is full.');
  var now=nowIso_(),v=insert_('VoiceStates',{id:id_('voi'),tablegateId:channel.tablegateId,channelId:channel.id,userId:ctx.user.id,sessionId:ctx.session.id,muted:listenOnly?true:bool_(ctx.params.muted),deafened:bool_(ctx.params.deafened),videoEnabled:listenOnly?false:(channel.type==='VIDEO'&&bool_(ctx.params.videoEnabled)),screenSharing:false,pushToTalk:listenOnly?false:bool_(ctx.params.pushToTalk),whispering:false,joinedAt:now,updatedAt:now,listenOnly:listenOnly});
  emitChannelEvent_(channel.id,'VOICE_USER_JOINED','USER',ctx.user.id,{voiceState:publicVoiceState_(v)});emitTablegateEvent_(channel.tablegateId,'VOICE_STATE_UPDATED','USER',ctx.user.id,{voiceState:publicVoiceState_(v)});
  return {voiceState:publicVoiceState_(v),peers:filter_('VoiceStates',function(x){return x.channelId===channel.id&&x.userId!==ctx.user.id;}).map(publicVoiceState_),iceServers:getIceServers_()};
}

function routeUpdateVoice_(ctx){
  var v=findOne_('VoiceStates',function(x){return x.userId===ctx.user.id&&(!ctx.params.channelId||x.channelId===String(ctx.params.channelId));});if(!v)throw new ApiError_('NOT_IN_VOICE','You are not in a voice channel.');var patch={updatedAt:nowIso_()},listenOnly=bool_(v.listenOnly)||isVisitor_(v.tablegateId,ctx.user.id)||!hasPermission_(v.tablegateId,ctx.user.id,PERMISSIONS.SPEAK);
  if(listenOnly){patch.listenOnly=true;patch.muted=true;patch.videoEnabled=false;patch.screenSharing=false;patch.pushToTalk=false;patch.whispering=false;if(ctx.params.deafened!==undefined)patch.deafened=bool_(ctx.params.deafened);if(ctx.params.muted!==undefined&&!bool_(ctx.params.muted))throw new ApiError_('LISTEN_ONLY','Visitors and members without Speak permission cannot unmute.');if(bool_(ctx.params.videoEnabled)||bool_(ctx.params.screenSharing)||bool_(ctx.params.pushToTalk)||bool_(ctx.params.whispering))throw new ApiError_('LISTEN_ONLY','Listen-only observers cannot transmit audio, video, screen sharing, push-to-talk, or whispers.');}
  else{['muted','deafened','videoEnabled','screenSharing','pushToTalk','whispering'].forEach(function(k){if(ctx.params[k]!==undefined)patch[k]=bool_(ctx.params[k]);});if(patch.videoEnabled&&!hasPermission_(v.tablegateId,ctx.user.id,PERMISSIONS.STREAM))throw new ApiError_('FORBIDDEN','You cannot enable video.');if(patch.screenSharing&&!hasPermission_(v.tablegateId,ctx.user.id,PERMISSIONS.STREAM))throw new ApiError_('FORBIDDEN','You cannot share your screen.');}
  updateRow_('VoiceStates',v._row,patch);var u=byId_('VoiceStates',v.id,true);emitChannelEvent_(v.channelId,'VOICE_STATE_UPDATED','USER',ctx.user.id,{voiceState:publicVoiceState_(u)});return publicVoiceState_(u);
}

function routeLeaveVoice_(ctx){var states=filter_('VoiceStates',function(v){return v.userId===ctx.user.id&&(!ctx.params.channelId||v.channelId===String(ctx.params.channelId));}).sort(function(a,b){return b._row-a._row;}),left=[];states.forEach(function(v){left.push(v.channelId);deleteRow_('VoiceStates',v._row);emitChannelEvent_(v.channelId,'VOICE_USER_LEFT','USER',ctx.user.id,{userId:ctx.user.id});emitTablegateEvent_(v.tablegateId,'VOICE_STATE_UPDATED','USER',ctx.user.id,{userId:ctx.user.id,channelId:''});});return {left:true,channelIds:left};}
function routeListVoiceStates_(ctx){var tablegateId=String(ctx.params.tablegateId||'');requireMember_(tablegateId,ctx.user.id);return filter_('VoiceStates',function(v){return v.tablegateId===tablegateId;}).map(publicVoiceState_);}

function requireCall_(dmId,userId){var dm=requireDm_(dmId,userId),call=filter_('Calls',function(c){return c.dmId===dm.id&&['RINGING','ACTIVE'].indexOf(c.status)!==-1;}).sort(function(a,b){return new Date(b.createdAt)-new Date(a.createdAt);})[0];return {dm:dm,call:call||null};}
function publicCall_(call){if(!call)return null;var users={};rows_('Users').forEach(function(u){users[u.id]=u;});var parts=filter_('CallParticipants',function(cp){return cp.callId===call.id;}).map(function(cp){return {id:cp.id,userId:cp.userId,user:publicUser_(users[cp.userId]),status:cp.status,joinedAt:cp.joinedAt||'',leftAt:cp.leftAt||''};});return {id:call.id,dmId:call.dmId,initiatorId:call.initiatorId,status:call.status,createdAt:call.createdAt,startedAt:call.startedAt||'',endedAt:call.endedAt||'',participants:parts};}
function routeGetActiveCall_(ctx){return publicCall_(requireCall_(ctx.params.dmId,ctx.user.id).call);}

function routeStartCall_(ctx){requireMessengerVerified_(ctx);var rc=requireCall_(ctx.params.dmId,ctx.user.id);enforceMinorSafeDm_(rc.dm,ctx.user.id);if(rc.call)return publicCall_(rc.call);var now=nowIso_(),call=insert_('Calls',{id:id_('cal'),dmId:rc.dm.id,initiatorId:ctx.user.id,status:'RINGING',createdAt:now,startedAt:'',endedAt:'',updatedAt:now});insert_('CallParticipants',{id:id_('cap'),callId:call.id,userId:ctx.user.id,status:'JOINED',joinedAt:now,leftAt:'',updatedAt:now});filter_('DmParticipants',function(dp){return dp.dmId===rc.dm.id&&!dp.leftAt&&dp.userId!==ctx.user.id;}).forEach(function(dp){insert_('CallParticipants',{id:id_('cap'),callId:call.id,userId:dp.userId,status:'RINGING',joinedAt:'',leftAt:'',updatedAt:now});emitUserEvent_(dp.userId,'INCOMING_CALL','CALL',call.id,{call:publicCall_(call)});});emitDmEvent_(rc.dm.id,'CALL_STARTED','CALL',call.id,{call:publicCall_(call)});return publicCall_(call);}

function updateCallParticipant_(callId,userId,status){var cp=findOne_('CallParticipants',function(x){return x.callId===callId&&x.userId===userId;});var now=nowIso_();if(!cp)cp=insert_('CallParticipants',{id:id_('cap'),callId:callId,userId:userId,status:status,joinedAt:status==='JOINED'?now:'',leftAt:'',updatedAt:now});else updateRow_('CallParticipants',cp._row,{status:status,joinedAt:status==='JOINED'?(cp.joinedAt||now):cp.joinedAt,leftAt:['LEFT','DECLINED'].indexOf(status)!==-1?now:'',updatedAt:now});return byId_('CallParticipants',cp.id,true);}

function routeAcceptCall_(ctx){requireMessengerVerified_(ctx);var rc=requireCall_(ctx.params.dmId,ctx.user.id);if(!rc.call)throw new ApiError_('CALL_NOT_FOUND','No active call.');updateCallParticipant_(rc.call.id,ctx.user.id,'JOINED');if(rc.call.status==='RINGING')updateRow_('Calls',rc.call._row,{status:'ACTIVE',startedAt:nowIso_(),updatedAt:nowIso_()});var call=byId_('Calls',rc.call.id,true);emitDmEvent_(rc.dm.id,'CALL_UPDATED','CALL',call.id,{call:publicCall_(call)});return {call:publicCall_(call),iceServers:getIceServers_()};}
function routeJoinCall_(ctx){requireMessengerVerified_(ctx);return routeAcceptCall_(ctx);}
function routeDeclineCall_(ctx){var rc=requireCall_(ctx.params.dmId,ctx.user.id);if(!rc.call)throw new ApiError_('CALL_NOT_FOUND','No active call.');updateCallParticipant_(rc.call.id,ctx.user.id,'DECLINED');var active=filter_('CallParticipants',function(cp){return cp.callId===rc.call.id&&['JOINED','RINGING'].indexOf(cp.status)!==-1;});if(active.length<=1&&active[0]&&active[0].userId===rc.call.initiatorId){updateRow_('Calls',rc.call._row,{status:'MISSED',endedAt:nowIso_(),updatedAt:nowIso_()});}emitDmEvent_(rc.dm.id,'CALL_UPDATED','CALL',rc.call.id,{call:publicCall_(byId_('Calls',rc.call.id,true))});return {declined:true};}
function routeLeaveCall_(ctx){var rc=requireCall_(ctx.params.dmId,ctx.user.id);if(!rc.call)throw new ApiError_('CALL_NOT_FOUND','No active call.');updateCallParticipant_(rc.call.id,ctx.user.id,'LEFT');var joined=filter_('CallParticipants',function(cp){return cp.callId===rc.call.id&&cp.status==='JOINED';});if(joined.length===0)updateRow_('Calls',rc.call._row,{status:'ENDED',endedAt:nowIso_(),updatedAt:nowIso_()});var call=byId_('Calls',rc.call.id,true);emitDmEvent_(rc.dm.id,'CALL_UPDATED','CALL',call.id,{call:publicCall_(call)});return {left:true,call:publicCall_(call)};}

function getIceServers_(){var raw=PropertiesService.getScriptProperties().getProperty(TABLEGATE.RTC_ICE_PROPERTY)||'[]';var parsed=parseJsonCell_(raw,[]);return Array.isArray(parsed)?parsed:[];}
function authorizeRtcRoom_(roomType,roomId,userId){
  roomType=String(roomType||'').toUpperCase();if(TABLEGATE.RTC_ROOM_TYPES.indexOf(roomType)===-1)throw new ApiError_('INVALID_RTC_ROOM','Invalid RTC room type.');
  if(roomType==='VOICE'){var channel=requireChannel_(roomId,userId),state=findOne_('VoiceStates',function(v){return v.channelId===channel.id&&v.userId===userId;});if(!state)throw new ApiError_('NOT_IN_VOICE','Join the voice channel first.');return {roomType:roomType,roomId:channel.id,listenOnly:bool_(state.listenOnly)};}
  if(roomType==='DM_CALL'){var rc=requireCall_(roomId,userId);if(!rc.call)throw new ApiError_('CALL_NOT_FOUND','No active call.');var cp=findOne_('CallParticipants',function(x){return x.callId===rc.call.id&&x.userId===userId&&x.status==='JOINED';});if(!cp)throw new ApiError_('NOT_IN_CALL','Join the call first.');return {roomType:roomType,roomId:rc.call.id,dmId:roomId};}
  if(roomType==='WHISPER'){var ch=requireChannel_(roomId,userId),vs=findOne_('VoiceStates',function(v){return v.channelId===ch.id&&v.userId===userId;});if(!vs)throw new ApiError_('NOT_IN_VOICE','Join the voice channel before whispering.');if(bool_(vs.listenOnly)||!hasPermission_(ch.tablegateId,userId,PERMISSIONS.SPEAK))throw new ApiError_('LISTEN_ONLY','Listen-only observers cannot whisper.');return {roomType:roomType,roomId:ch.id};}
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
function routeCreatePersona_(ctx){var tablegateId=String(ctx.params.tablegateId||'');requirePlayer_(tablegateId,ctx.user.id);requirePermission_(tablegateId,ctx.user.id,PERMISSIONS.USE_PERSONAS);var aid=String(ctx.params.avatarAttachmentId||'');if(aid)requireAttachmentAccess_(aid,ctx.user.id,tablegateId,'');if(bool_(ctx.params.isDefault))filter_('Personas',function(p){return p.tablegateId===tablegateId&&p.userId===ctx.user.id&&!p.deletedAt&&bool_(p.isDefault);}).forEach(function(p){updateRow_('Personas',p._row,{isDefault:false,updatedAt:nowIso_()});});var now=nowIso_(),p=insert_('Personas',{id:id_('per'),tablegateId:tablegateId,userId:ctx.user.id,name:text_(ctx.params.name,80),avatarAttachmentId:aid,color:nullableText_(ctx.params.color,16)||'#808080',description:nullableText_(ctx.params.description,1000),isDefault:bool_(ctx.params.isDefault),createdAt:now,updatedAt:now,deletedAt:''});emitTablegateEvent_(tablegateId,'PERSONA_CREATED','PERSONA',p.id,{persona:publicPersona_(p)});return publicPersona_(p);}
function routeUpdatePersona_(ctx){var p=requirePersona_(ctx.params.personaId,ctx.user.id);requirePlayer_(p.tablegateId,ctx.user.id);var patch={updatedAt:nowIso_()};if(ctx.params.name!==undefined)patch.name=text_(ctx.params.name,80);if(ctx.params.avatarAttachmentId!==undefined){if(ctx.params.avatarAttachmentId)requireAttachmentAccess_(ctx.params.avatarAttachmentId,ctx.user.id,p.tablegateId,'');patch.avatarAttachmentId=String(ctx.params.avatarAttachmentId||'');}if(ctx.params.color!==undefined)patch.color=nullableText_(ctx.params.color,16)||'#808080';if(ctx.params.description!==undefined)patch.description=nullableText_(ctx.params.description,1000);if(ctx.params.isDefault!==undefined&&bool_(ctx.params.isDefault)){filter_('Personas',function(x){return x.tablegateId===p.tablegateId&&x.userId===ctx.user.id&&x.id!==p.id&&!x.deletedAt&&bool_(x.isDefault);}).forEach(function(x){updateRow_('Personas',x._row,{isDefault:false,updatedAt:nowIso_()});});patch.isDefault=true;}updateRow_('Personas',p._row,patch);var u=byId_('Personas',p.id);emitTablegateEvent_(p.tablegateId,'PERSONA_UPDATED','PERSONA',p.id,{persona:publicPersona_(u)});return publicPersona_(u);}
function routeDeletePersona_(ctx){var p=requirePersona_(ctx.params.personaId,ctx.user.id);requirePlayer_(p.tablegateId,ctx.user.id);updateRow_('Personas',p._row,{deletedAt:nowIso_(),updatedAt:nowIso_(),isDefault:false});emitTablegateEvent_(p.tablegateId,'PERSONA_DELETED','PERSONA',p.id,{personaId:p.id});return {deleted:true};}

function parseDiceExpression_(expr){
  expr=String(expr||'').replace(/\s+/g,'').toLowerCase();if(!expr||expr.length>120)throw new ApiError_('INVALID_DICE','Dice expression is empty or too long.');
  if(!/^[+\-]?\d*d\d+([+\-]\d*d?\d+)*$/.test(expr)&&!/^[+\-]?\d+([+\-]\d*d?\d+)*$/.test(expr))throw new ApiError_('INVALID_DICE','Use expressions like 1d20+5, 2d6+1d4-2, or 10.');
  var normalized=expr.replace(/-/g,'+-').split('+').filter(Boolean),terms=[];normalized.forEach(function(raw){var sign=1;if(raw.charAt(0)==='-'){sign=-1;raw=raw.slice(1);}if(raw.indexOf('d')!==-1){var bits=raw.split('d'),count=bits[0]?int_(bits[0],1,1,100):1,sides=int_(bits[1],0,2,1000);if(!sides)throw new ApiError_('INVALID_DICE','Dice must have at least 2 sides.');terms.push({type:'dice',sign:sign,count:count,sides:sides});}else terms.push({type:'flat',sign:sign,value:int_(raw,0,-100000,100000)});});return {expression:expr,terms:terms};
}
function rollDice_(parsed){var total=0,detail=[];parsed.terms.forEach(function(t){if(t.type==='flat'){total+=t.sign*t.value;detail.push({type:'flat',sign:t.sign,value:t.value,subtotal:t.sign*t.value});}else{var rolls=[];for(var i=0;i<t.count;i++)rolls.push(secureRandomInt_(t.sides)+1);var subtotal=rolls.reduce(function(a,b){return a+b;},0)*t.sign;total+=subtotal;detail.push({type:'dice',sign:t.sign,count:t.count,sides:t.sides,rolls:rolls,subtotal:subtotal});}});return {total:total,detail:detail};}
function routeRollDice_(ctx){
  var channel=requireChannel_(ctx.params.channelId,ctx.user.id);requirePlayer_(channel.tablegateId,ctx.user.id,'A tablegate admin must approve you as a Player before you can roll dice.');requirePermission_(channel.tablegateId,ctx.user.id,PERMISSIONS.ROLL_DICE);var parsed=parseDiceExpression_(ctx.params.expression||ctx.params.dice),rolled=rollDice_(parsed),personaId=String(ctx.params.personaId||'');if(personaId){var p=requirePersona_(personaId,ctx.user.id);if(p.tablegateId!==channel.tablegateId)throw new ApiError_('INVALID_PERSONA','Persona belongs to another tablegate.');}
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
  var p=ctx.params,tablegateId=String(p.tablegateId||'');if(tablegateId)requirePlayer_(tablegateId,ctx.user.id,'Visitors may read system references but cannot add tablegate documents until approved as Players.');var system=requireGameSystem_(p.systemId,ctx.user.id,tablegateId);var attachment=requireOwnedAttachment_(p.attachmentId,ctx.user.id);
  if(tablegateId&&attachment.tablegateId&&attachment.tablegateId!==tablegateId)throw new ApiError_('INVALID_ATTACHMENT_SCOPE','Attachment belongs to another Tablegate.');
  var now=nowIso_(),doc=insert_('SystemDocuments',{id:id_('sdoc'),tablegateId:tablegateId,systemId:system.id,ownerId:ctx.user.id,title:text_(p.title||attachment.originalName,200),documentType:nullableText_(p.documentType,80)||'RULES_REFERENCE',version:nullableText_(p.version,80),attachmentId:attachment.id,contentHash:attachment.sha256||'',metadataJson:jsonCell_(p.metadata,{},'document metadata'),visibility:enumValue_(p.visibility||(tablegateId?'TABLEGATE':'PRIVATE'),TABLEGATE.CONTENT_VISIBILITIES,'PRIVATE','visibility'),createdAt:now,updatedAt:now,deletedAt:''});
  return publicSystemDocument_(doc);
}
function routeListSystemDocuments_(ctx){var tablegateId=String(ctx.params.tablegateId||'');if(tablegateId)requireMember_(tablegateId,ctx.user.id);requireGameSystem_(ctx.params.systemId,ctx.user.id,tablegateId);return listSystemDocuments_(String(ctx.params.systemId),tablegateId,ctx.user.id);}
function routeDeleteSystemDocument_(ctx){var doc=byId_('SystemDocuments',ctx.params.documentId,true);if(!doc||doc.deletedAt||doc.ownerId!==ctx.user.id)throw new ApiError_('DOCUMENT_NOT_FOUND','System document not found.');if(doc.tablegateId&&!isTablegateAdmin_(doc.tablegateId,ctx.user.id))requirePlayer_(doc.tablegateId,ctx.user.id);updateRow_('SystemDocuments',doc._row,{deletedAt:nowIso_(),updatedAt:nowIso_()});return {deleted:true,documentId:doc.id};}

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
function routeCreateHomebrew_(ctx){var p=ctx.params,tablegateId=String(p.tablegateId||'');requirePlayer_(tablegateId,ctx.user.id);var systemId=String(p.systemId||requireTablegate_(tablegateId).primarySystemId||'sys_tablegate_generic');requireGameSystem_(systemId,ctx.user.id,tablegateId);var now=nowIso_(),item=insert_('HomebrewContent',{id:id_('hb'),tablegateId:tablegateId,systemId:systemId,ownerId:ctx.user.id,contentType:text_(p.contentType||'CUSTOM',80).toUpperCase(),name:text_(p.name,160),version:nullableText_(p.version,80),status:enumValue_(p.status||'DRAFT',TABLEGATE.CONTENT_STATUSES,'DRAFT','status'),visibility:enumValue_(p.visibility||'TABLEGATE',TABLEGATE.CONTENT_VISIBILITIES,'TABLEGATE','visibility'),tagsJson:jsonCell_(p.tags,[],'tags'),dataJson:jsonCell_(p.data,{},'homebrew data'),schemaJson:jsonCell_(p.schema,{},'homebrew schema'),sourceAttribution:nullableText_(p.sourceAttribution,4000),createdAt:now,updatedAt:now,deletedAt:''});emitTablegateEvent_(tablegateId,'HOMEBREW_CREATED','HOMEBREW',item.id,{item:publicHomebrew_(item)});return publicHomebrew_(item);}
function routeListHomebrew_(ctx){var tablegateId=String(ctx.params.tablegateId||'');if(tablegateId)requireMember_(tablegateId,ctx.user.id);var systemId=String(ctx.params.systemId||''),type=String(ctx.params.contentType||'').toUpperCase();return filter_('HomebrewContent',function(item){return(!tablegateId||item.tablegateId===tablegateId)&&(!systemId||item.systemId===systemId)&&(!type||item.contentType===type)&&canReadHomebrew_(item,ctx.user.id);}).slice(0,int_(ctx.params.limit,100,1,200)).map(publicHomebrew_);}
function routeGetHomebrew_(ctx){var item=byId_('HomebrewContent',ctx.params.homebrewId,true);if(!item||!canReadHomebrew_(item,ctx.user.id))throw new ApiError_('HOMEBREW_NOT_FOUND','Homebrew item not found.');return publicHomebrew_(item);}
function routeUpdateHomebrew_(ctx){var item=byId_('HomebrewContent',ctx.params.homebrewId,true);if(!item||item.deletedAt||!canManageOwnedOrTablegate_(item,ctx.user.id,PERMISSIONS.MANAGE_SYSTEMS))throw new ApiError_('HOMEBREW_NOT_FOUND','Homebrew item not found or not editable.');if(item.ownerId===ctx.user.id&&!isTablegateAdmin_(item.tablegateId,ctx.user.id))requirePlayer_(item.tablegateId,ctx.user.id);var p=ctx.params,patch={updatedAt:nowIso_()};if(p.name!==undefined)patch.name=text_(p.name,160);if(p.contentType!==undefined)patch.contentType=text_(p.contentType,80).toUpperCase();if(p.version!==undefined)patch.version=nullableText_(p.version,80);if(p.status!==undefined)patch.status=enumValue_(p.status,TABLEGATE.CONTENT_STATUSES,'DRAFT','status');if(p.visibility!==undefined)patch.visibility=enumValue_(p.visibility,TABLEGATE.CONTENT_VISIBILITIES,'TABLEGATE','visibility');if(p.tags!==undefined)patch.tagsJson=jsonCell_(p.tags,[],'tags');if(p.data!==undefined)patch.dataJson=jsonCell_(p.data,{},'homebrew data');if(p.schema!==undefined)patch.schemaJson=jsonCell_(p.schema,{},'homebrew schema');if(p.sourceAttribution!==undefined)patch.sourceAttribution=nullableText_(p.sourceAttribution,4000);updateRow_('HomebrewContent',item._row,patch);return publicHomebrew_(byId_('HomebrewContent',item.id,true));}
function routeDeleteHomebrew_(ctx){var item=byId_('HomebrewContent',ctx.params.homebrewId,true);if(!item||item.deletedAt||!canManageOwnedOrTablegate_(item,ctx.user.id,PERMISSIONS.MANAGE_SYSTEMS))throw new ApiError_('HOMEBREW_NOT_FOUND','Homebrew item not found or not editable.');if(item.ownerId===ctx.user.id&&!isTablegateAdmin_(item.tablegateId,ctx.user.id))requirePlayer_(item.tablegateId,ctx.user.id);updateRow_('HomebrewContent',item._row,{deletedAt:nowIso_(),updatedAt:nowIso_()});return {deleted:true,homebrewId:item.id};}

function canReadCharacter_(sheet,userId){if(!sheet||sheet.deletedAt)return false;if(sheet.ownerId===userId||sheet.userId===userId)return true;if(sheet.visibility==='TABLEGATE'){try{requireMember_(sheet.tablegateId,userId);return true;}catch(e){}}try{return hasPermission_(sheet.tablegateId,userId,PERMISSIONS.MANAGE_CHARACTERS);}catch(e){}return false;}
function publicCharacter_(sheet,userId){var out={id:sheet.id,tablegateId:sheet.tablegateId,systemId:sheet.systemId,userId:sheet.userId,ownerId:sheet.ownerId,name:sheet.name,pronouns:sheet.pronouns||'',concept:sheet.concept||'',avatarAttachmentId:sheet.avatarAttachmentId||'',schemaVersion:sheet.schemaVersion||'',data:parseJsonCell_(sheet.dataJson,{}),visibility:sheet.visibility,isArchived:bool_(sheet.isArchived),createdAt:sheet.createdAt,updatedAt:sheet.updatedAt},canSeePrivate=sheet.ownerId===userId;try{canSeePrivate=canSeePrivate||hasPermission_(sheet.tablegateId,userId,PERMISSIONS.MANAGE_CHARACTERS);}catch(e){}if(canSeePrivate)out.privateNotes=parseJsonCell_(sheet.privateNotesJson,{});return out;}
function requireCharacter_(id,userId){var sheet=byId_('CharacterSheets',id,true);if(!sheet||!canReadCharacter_(sheet,userId))throw new ApiError_('CHARACTER_NOT_FOUND','Character sheet not found.');return sheet;}
function routeCreateCharacter_(ctx){var p=ctx.params,tablegateId=String(p.tablegateId||'');requirePlayer_(tablegateId,ctx.user.id,'A tablegate admin must approve you as a Player before you can create a character sheet.');var representedUserId=String(p.userId||ctx.user.id);if(representedUserId!==ctx.user.id){requirePermission_(tablegateId,ctx.user.id,PERMISSIONS.MANAGE_CHARACTERS);requireMember_(tablegateId,representedUserId);}var systemId=String(p.systemId||requireTablegate_(tablegateId).primarySystemId||'sys_tablegate_generic');requireGameSystem_(systemId,ctx.user.id,tablegateId);var aid=String(p.avatarAttachmentId||'');if(aid)requireAttachmentAccess_(aid,ctx.user.id,tablegateId,'');var now=nowIso_(),sheet=insert_('CharacterSheets',{id:id_('chr'),tablegateId:tablegateId,systemId:systemId,userId:representedUserId,ownerId:ctx.user.id,name:text_(p.name,160),pronouns:nullableText_(p.pronouns,120),concept:nullableText_(p.concept,1000),avatarAttachmentId:aid,schemaVersion:nullableText_(p.schemaVersion,80),dataJson:jsonCell_(p.data,{},'character data'),privateNotesJson:jsonCell_(p.privateNotes,{},'private notes'),visibility:enumValue_(p.visibility||'TABLEGATE',['TABLEGATE','PRIVATE'],'TABLEGATE','visibility'),isArchived:false,createdAt:now,updatedAt:now,deletedAt:''});emitTablegateEvent_(tablegateId,'CHARACTER_CREATED','CHARACTER',sheet.id,{character:publicCharacter_(sheet,ctx.user.id)});return publicCharacter_(sheet,ctx.user.id);}
function routeListCharacters_(ctx){var tablegateId=String(ctx.params.tablegateId||'');requireMember_(tablegateId,ctx.user.id);var systemId=String(ctx.params.systemId||'');return filter_('CharacterSheets',function(sheet){return sheet.tablegateId===tablegateId&&!sheet.deletedAt&&(!systemId||sheet.systemId===systemId)&&canReadCharacter_(sheet,ctx.user.id);}).map(function(sheet){return publicCharacter_(sheet,ctx.user.id);});}
function routeGetCharacter_(ctx){return publicCharacter_(requireCharacter_(ctx.params.characterId,ctx.user.id),ctx.user.id);}
function routeUpdateCharacter_(ctx){var sheet=requireCharacter_(ctx.params.characterId,ctx.user.id);if(!canManageOwnedOrTablegate_(sheet,ctx.user.id,PERMISSIONS.MANAGE_CHARACTERS))throw new ApiError_('FORBIDDEN','You cannot edit this character.');if(sheet.ownerId===ctx.user.id&&!isTablegateAdmin_(sheet.tablegateId,ctx.user.id))requirePlayer_(sheet.tablegateId,ctx.user.id);var p=ctx.params,patch={updatedAt:nowIso_()};if(p.name!==undefined)patch.name=text_(p.name,160);if(p.pronouns!==undefined)patch.pronouns=nullableText_(p.pronouns,120);if(p.concept!==undefined)patch.concept=nullableText_(p.concept,1000);if(p.systemId!==undefined){requireGameSystem_(p.systemId,ctx.user.id,sheet.tablegateId);patch.systemId=String(p.systemId);}if(p.avatarAttachmentId!==undefined){if(p.avatarAttachmentId)requireAttachmentAccess_(p.avatarAttachmentId,ctx.user.id,sheet.tablegateId,'');patch.avatarAttachmentId=String(p.avatarAttachmentId||'');}if(p.schemaVersion!==undefined)patch.schemaVersion=nullableText_(p.schemaVersion,80);if(p.data!==undefined)patch.dataJson=jsonCell_(p.data,{},'character data');if(p.privateNotes!==undefined)patch.privateNotesJson=jsonCell_(p.privateNotes,{},'private notes');if(p.visibility!==undefined)patch.visibility=enumValue_(p.visibility,['TABLEGATE','PRIVATE'],'TABLEGATE','visibility');if(p.isArchived!==undefined)patch.isArchived=bool_(p.isArchived);updateRow_('CharacterSheets',sheet._row,patch);return publicCharacter_(byId_('CharacterSheets',sheet.id,true),ctx.user.id);}
function routeDeleteCharacter_(ctx){var sheet=requireCharacter_(ctx.params.characterId,ctx.user.id);if(!canManageOwnedOrTablegate_(sheet,ctx.user.id,PERMISSIONS.MANAGE_CHARACTERS))throw new ApiError_('FORBIDDEN','You cannot delete this character.');if(sheet.ownerId===ctx.user.id&&!isTablegateAdmin_(sheet.tablegateId,ctx.user.id))requirePlayer_(sheet.tablegateId,ctx.user.id);updateRow_('CharacterSheets',sheet._row,{deletedAt:nowIso_(),updatedAt:nowIso_()});return {deleted:true,characterId:sheet.id};}

function canReadMacro_(macro,userId){if(!macro||macro.deletedAt)return false;if(macro.ownerId===userId||macro.visibility==='PUBLIC')return true;if(macro.visibility==='TABLEGATE'){try{requireMember_(macro.tablegateId,userId);return true;}catch(e){}}return false;}
function publicMacro_(macro){return {id:macro.id,tablegateId:macro.tablegateId,systemId:macro.systemId||'',ownerId:macro.ownerId,name:macro.name,description:macro.description||'',mechanic:parseJsonCell_(macro.mechanicJson,{}),visibility:macro.visibility,createdAt:macro.createdAt,updatedAt:macro.updatedAt};}
function routeCreateRollMacro_(ctx){var p=ctx.params,tablegateId=String(p.tablegateId||'');requirePlayer_(tablegateId,ctx.user.id);var systemId=String(p.systemId||requireTablegate_(tablegateId).primarySystemId||'sys_tablegate_generic');requireGameSystem_(systemId,ctx.user.id,tablegateId);var now=nowIso_(),macro=insert_('RollMacros',{id:id_('mac'),tablegateId:tablegateId,systemId:systemId,ownerId:ctx.user.id,name:text_(p.name,120),description:nullableText_(p.description,1000),mechanicJson:jsonCell_(p.mechanic,{engine:'MANUAL'},'mechanic'),visibility:enumValue_(p.visibility||'TABLEGATE',TABLEGATE.CONTENT_VISIBILITIES,'TABLEGATE','visibility'),createdAt:now,updatedAt:now,deletedAt:''});return publicMacro_(macro);}
function routeListRollMacros_(ctx){var tablegateId=String(ctx.params.tablegateId||'');requireMember_(tablegateId,ctx.user.id);return filter_('RollMacros',function(m){return m.tablegateId===tablegateId&&canReadMacro_(m,ctx.user.id);}).map(publicMacro_);}
function routeUpdateRollMacro_(ctx){var macro=byId_('RollMacros',ctx.params.macroId,true);if(!macro||!canReadMacro_(macro,ctx.user.id)||!canManageOwnedOrTablegate_(macro,ctx.user.id,PERMISSIONS.MANAGE_SYSTEMS))throw new ApiError_('MACRO_NOT_FOUND','Roll macro not found or not editable.');if(macro.ownerId===ctx.user.id&&!isTablegateAdmin_(macro.tablegateId,ctx.user.id))requirePlayer_(macro.tablegateId,ctx.user.id);var p=ctx.params,patch={updatedAt:nowIso_()};if(p.name!==undefined)patch.name=text_(p.name,120);if(p.description!==undefined)patch.description=nullableText_(p.description,1000);if(p.mechanic!==undefined)patch.mechanicJson=jsonCell_(p.mechanic,{},'mechanic');if(p.visibility!==undefined)patch.visibility=enumValue_(p.visibility,TABLEGATE.CONTENT_VISIBILITIES,'TABLEGATE','visibility');updateRow_('RollMacros',macro._row,patch);return publicMacro_(byId_('RollMacros',macro.id,true));}
function routeDeleteRollMacro_(ctx){var macro=byId_('RollMacros',ctx.params.macroId,true);if(!macro||!canManageOwnedOrTablegate_(macro,ctx.user.id,PERMISSIONS.MANAGE_SYSTEMS))throw new ApiError_('MACRO_NOT_FOUND','Roll macro not found or not editable.');if(macro.ownerId===ctx.user.id&&!isTablegateAdmin_(macro.tablegateId,ctx.user.id))requirePlayer_(macro.tablegateId,ctx.user.id);updateRow_('RollMacros',macro._row,{deletedAt:nowIso_(),updatedAt:nowIso_()});return {deleted:true,macroId:macro.id};}

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
function routeResolveMechanic_(ctx){var p=ctx.params,channel=p.channelId?requireChannel_(p.channelId,ctx.user.id):null,tablegateId=channel?channel.tablegateId:String(p.tablegateId||'');requirePlayer_(tablegateId,ctx.user.id,'A tablegate admin must approve you as a Player before you can use game mechanics.');requirePermission_(tablegateId,ctx.user.id,PERMISSIONS.USE_MECHANICS);var macro=null,mechanic=p.mechanic;if(p.macroId){macro=byId_('RollMacros',p.macroId,true);if(!macro||!canReadMacro_(macro,ctx.user.id))throw new ApiError_('MACRO_NOT_FOUND','Roll macro not found.');mechanic=parseJsonCell_(macro.mechanicJson,{});}if(mechanic===undefined)throw new ApiError_('MECHANIC_REQUIRED','Provide mechanic JSON or macroId.');var systemId=String(p.systemId||(macro&&macro.systemId)||requireTablegate_(tablegateId).primarySystemId||'sys_tablegate_generic');requireGameSystem_(systemId,ctx.user.id,tablegateId);var personaId=String(p.personaId||''),characterId=String(p.characterId||'');if(personaId){var persona=requirePersona_(personaId,ctx.user.id);if(persona.tablegateId!==tablegateId)throw new ApiError_('INVALID_PERSONA','Persona belongs to another Tablegate.');}if(characterId){var character=requireCharacter_(characterId,ctx.user.id);if(character.tablegateId!==tablegateId)throw new ApiError_('INVALID_CHARACTER','Character belongs to another Tablegate.');}var request=jsonValue_(mechanic,{},'mechanic'),result=resolveMechanicDefinition_(request),now=nowIso_(),label=nullableText_(p.label,200),record=insert_('MechanicRolls',{id:id_('mrl'),tablegateId:tablegateId,channelId:channel?channel.id:'',userId:ctx.user.id,personaId:personaId,characterId:characterId,systemId:systemId,macroId:macro?macro.id:'',engine:result.engine,label:label,requestJson:jsonCell_(request,{},'mechanic request'),resultJson:jsonCell_(result,{},'mechanic result'),messageId:'',createdAt:now}),message=null;if(channel&&(p.postMessage===undefined||bool_(p.postMessage))){message=routeSendMessage_({params:{scopeType:'CHANNEL',scopeId:channel.id,content:formatMechanicResult_(label,result),messageType:'ROLL',personaId:personaId,attachmentIds:[]},user:ctx.user,session:ctx.session});updateRow_('MechanicRolls',record._row,{messageId:message.id});}audit_(tablegateId,ctx.user.id,'MECHANIC_RESOLVED','MECHANIC_ROLL',record.id,{engine:result.engine,systemId:systemId});return {id:record.id,tablegateId:tablegateId,channelId:record.channelId,userId:ctx.user.id,personaId:personaId,characterId:characterId,systemId:systemId,macroId:record.macroId,engine:result.engine,label:label,request:request,result:result,message:message,createdAt:now};}
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
 * GROUP FINDER, PUBLIC-PLACE MATCHING, AND PWA SUPPORT
 * ============================= */

var GROUP_FINDER_QUESTIONS_ = Object.freeze([
  {id:'tone', prompt:'What overall game tone feels best?', options:['LIGHTHEARTED','BALANCED','SERIOUS','DARK_WITH_CONSENT']},
  {id:'roleplay_combat', prompt:'What play balance do you prefer?', options:['MOSTLY_ROLEPLAY','BALANCED','MOSTLY_COMBAT','VARIES_BY_SESSION']},
  {id:'rules_style', prompt:'How closely should rules be followed?', options:['RULES_AS_WRITTEN','RULES_WITH_JUDGMENT','RULE_OF_COOL','SYSTEM_DEPENDENT']},
  {id:'session_format', prompt:'Which session format works best?', options:['VOICE','VIDEO_OPTIONAL','VIDEO_EXPECTED','TEXT_PLAY_BY_POST','MIXED']},
  {id:'session_length', prompt:'Preferred session length?', options:['UNDER_2_HOURS','2_TO_3_HOURS','3_TO_4_HOURS','4_PLUS_HOURS','FLEXIBLE']},
  {id:'safety_tools', prompt:'How should safety tools be handled?', options:['REQUIRED_AND_EXPLICIT','WELCOME','AS_NEEDED','DISCUSS_AS_GROUP']},
  {id:'accessibility', prompt:'How should accessibility needs be handled?', options:['PLAN_IN_ADVANCE','ADAPT_AS_NEEDED','ASK_EACH_SESSION','DISCUSS_PRIVATELY']}
]);

function serviceUrl_() {
  try { return ScriptApp.getService().getUrl() || ''; } catch (e) { return ''; }
}

function validatedHttpsUrl_(value, fieldName) {
  var url = String(value || '').trim();
  if (url && !/^https:\/\//i.test(url)) throw new ApiError_('VALIDATION_ERROR', (fieldName || 'URL') + ' must use HTTPS.');
  return url;
}

function pwaScopeFromStartUrl_(startUrl) {
  var raw = String(startUrl || '/');
  var clean = raw.split('#')[0].split('?')[0];
  if (!clean) return '/';
  var slash = clean.lastIndexOf('/');
  return slash >= 0 ? clean.slice(0, slash + 1) : '/';
}

function buildPwaManifest_() {
  var props = PropertiesService.getScriptProperties();
  var name = props.getProperty(TABLEGATE.APP_NAME_PROPERTY) || 'Tablegate';
  var startUrl = props.getProperty(TABLEGATE.PUBLIC_APP_URL_PROPERTY) || '/';
  var theme = props.getProperty(TABLEGATE.PWA_THEME_COLOR_PROPERTY) || '#00ffff';
  var background = props.getProperty(TABLEGATE.PWA_BACKGROUND_COLOR_PROPERTY) || '#07181c';
  var icons = [];
  var icon192 = props.getProperty(TABLEGATE.PWA_ICON_192_PROPERTY) || '';
  var icon512 = props.getProperty(TABLEGATE.PWA_ICON_512_PROPERTY) || '';
  var maskable = props.getProperty(TABLEGATE.PWA_MASKABLE_ICON_PROPERTY) || '';
  if (icon192) icons.push({src:icon192, sizes:'192x192', type:'image/png', purpose:'any'});
  if (icon512) icons.push({src:icon512, sizes:'512x512', type:'image/png', purpose:'any'});
  if (maskable) icons.push({src:maskable, sizes:'512x512', type:'image/png', purpose:'maskable'});
  var joiner = startUrl.indexOf('?') === -1 ? '?' : '&';
  return {
    id:startUrl,
    name:name,
    short_name:name.slice(0, 24),
    description:'A welcoming, creative tabletop roleplaying community for creating games, finding groups, and playing together.',
    start_url:startUrl,
    scope:pwaScopeFromStartUrl_(startUrl),
    display:'standalone',
    display_override:['window-controls-overlay','standalone','minimal-ui'],
    orientation:'any',
    theme_color:theme,
    background_color:background,
    categories:['games','social','entertainment'],
    icons:icons,
    shortcuts:[
      {name:'Find a Group', short_name:'Find Group', url:startUrl + joiner + 'view=group-finder'},
      {name:'Create a Game', short_name:'Create Game', url:startUrl + joiner + 'view=create-tablegate'},
      {name:'My Tablegates', short_name:'My Games', url:startUrl + joiner + 'view=my-tablegates'}
    ]
  };
}

function routeGetPwaManifest_(ctx) { return buildPwaManifest_(); }
function routeGetInstallConfig_(ctx) {
  var appUrl = PropertiesService.getScriptProperties().getProperty(TABLEGATE.PUBLIC_APP_URL_PROPERTY) || '';
  var backendUrl = serviceUrl_();
  return {
    manifest:buildPwaManifest_(),
    manifestUrl:backendUrl ? backendUrl + '?action=manifest' : '',
    publicAppUrl:appUrl,
    frontendRequirements:{
      https:true,
      manifestLink:'<link rel="manifest" href="/manifest.webmanifest">',
      manifestSourceUrl:backendUrl ? backendUrl + '?action=manifest' : '',
      sameOriginManifestRecommended:true,
      serviceWorkerRecommended:true,
      offlineSupportRequiresServiceWorker:true,
      serviceWorkerScope:'A service worker used for offline support must be hosted on the same origin as the frontend app.',
      installPrompt:'Expose a user-clicked Install Tablegate button using beforeinstallprompt where supported.',
      appleSupport:'Include apple-touch-icon and mobile-web-app-capable metadata in the frontend.'
    },
    platformDependentActions:['install-to-desktop','add-to-home-screen','pin-to-taskbar-or-dock','add-to-start-menu','bookmark','bookmark-bar','organize-installed-icon']
  };
}

function requireOwnedPublicLocation_(locationId, userId) {
  var location = byId_('PublicLocations', String(locationId || ''));
  if (!location || location.ownerId !== userId) throw new ApiError_('PUBLIC_LOCATION_NOT_FOUND', 'Public meeting location not found.');
  return location;
}

function validatePublicPlaceType_(value) {
  var type = String(value || 'OTHER_PUBLIC_PLACE').trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  if (TABLEGATE.PUBLIC_PLACE_TYPES.indexOf(type) === -1) throw new ApiError_('PUBLIC_PLACE_REQUIRED', 'Choose a recognized public meeting point type such as a library, community center, game store, cafe, park, university, public building, or transit hub.');
  return type;
}

function publicLocationView_(location, includeCoordinates) {
  var out={id:location.id,label:location.label,placeType:location.placeType,city:location.city||'',region:location.region||'',country:location.country||'',isDefault:bool_(location.isDefault),visibility:location.visibility||'LABEL_ONLY',lastReconfirmedAt:location.lastReconfirmedAt||location.updatedAt||location.createdAt,verificationStatus:location.verificationStatus||'USER_CONFIRMED_PUBLIC',createdAt:location.createdAt,updatedAt:location.updatedAt};if(includeCoordinates){out.lat=num_(location.lat,0);out.lng=num_(location.lng,0);}return out;
}

function routeCreatePublicLocation_(ctx) {
  if(isMinorUser_(ctx.user))throw new ApiError_('MINOR_LOCATION_RESTRICTED','Minor accounts cannot publish local-radius anchors.');
  if(!bool_(ctx.params.confirmPublicPlace))throw new ApiError_('PUBLIC_PLACE_CONFIRMATION_REQUIRED','Confirm that this is a public place and not a home address, school, workplace, or private residence.');
  var lat=num_(ctx.params.lat,NaN),lng=num_(ctx.params.lng,NaN);if(!isFinite(lat)||lat<-90||lat>90||!isFinite(lng)||lng<-180||lng>180)throw new ApiError_('INVALID_COORDINATES','Valid latitude and longitude are required.');
  var now=nowIso_(),isDefault=bool_(ctx.params.isDefault);if(isDefault)filter_('PublicLocations',function(l){return l.ownerId===ctx.user.id&&!l.deletedAt&&bool_(l.isDefault);}).forEach(function(l){updateRow_('PublicLocations',l._row,{isDefault:false,updatedAt:now});});
  var location=insert_('PublicLocations',{id:id_('loc'),ownerId:ctx.user.id,label:text_(ctx.params.label,100),placeType:validatePublicPlaceType_(ctx.params.placeType),city:nullableText_(ctx.params.city,80),region:nullableText_(ctx.params.region,80),country:nullableText_(ctx.params.country,80),lat:lat,lng:lng,isDefault:isDefault,visibility:'LABEL_ONLY',createdAt:now,updatedAt:now,deletedAt:'',lastReconfirmedAt:now,verificationStatus:'USER_CONFIRMED_PUBLIC',venueListingId:''});return publicLocationView_(location,true);
}

function routeListPublicLocations_(ctx) {
  return filter_('PublicLocations', function(l) { return l.ownerId === ctx.user.id && !l.deletedAt; }).sort(function(a,b) { return bool_(b.isDefault) - bool_(a.isDefault) || new Date(b.updatedAt) - new Date(a.updatedAt); }).map(function(l) { return publicLocationView_(l, true); });
}

function routeUpdatePublicLocation_(ctx) {
  var location = requireOwnedPublicLocation_(ctx.params.locationId, ctx.user.id), patch = {updatedAt:nowIso_()};
  if ((ctx.params.placeType !== undefined || ctx.params.lat !== undefined || ctx.params.lng !== undefined) && !bool_(ctx.params.confirmPublicPlace)) throw new ApiError_('PUBLIC_PLACE_CONFIRMATION_REQUIRED', 'Confirm that the updated location is still a public place and not a home address.');
  if (ctx.params.label !== undefined) patch.label = text_(ctx.params.label, 100);
  if (ctx.params.placeType !== undefined) patch.placeType = validatePublicPlaceType_(ctx.params.placeType);
  if (ctx.params.city !== undefined) patch.city = nullableText_(ctx.params.city, 80);
  if (ctx.params.region !== undefined) patch.region = nullableText_(ctx.params.region, 80);
  if (ctx.params.country !== undefined) patch.country = nullableText_(ctx.params.country, 80);
  if (ctx.params.lat !== undefined) { var lat = num_(ctx.params.lat, NaN); if (!isFinite(lat) || lat < -90 || lat > 90) throw new ApiError_('INVALID_COORDINATES', 'Latitude is invalid.'); patch.lat = lat; }
  if (ctx.params.lng !== undefined) { var lng = num_(ctx.params.lng, NaN); if (!isFinite(lng) || lng < -180 || lng > 180) throw new ApiError_('INVALID_COORDINATES', 'Longitude is invalid.'); patch.lng = lng; }
  if (ctx.params.isDefault !== undefined && bool_(ctx.params.isDefault)) {
    filter_('PublicLocations', function(l) { return l.ownerId === ctx.user.id && l.id !== location.id && !l.deletedAt && bool_(l.isDefault); }).forEach(function(l) { updateRow_('PublicLocations', l._row, {isDefault:false, updatedAt:nowIso_()}); });
    patch.isDefault = true;
  }
  updateRow_('PublicLocations', location._row, patch);
  return publicLocationView_(byId_('PublicLocations', location.id), true);
}

function routeDeletePublicLocation_(ctx) {
  var location = requireOwnedPublicLocation_(ctx.params.locationId, ctx.user.id);
  var activeUse = findOne_('GroupFinderPosts', function(p) { return p.publicLocationId === location.id && !p.deletedAt && p.status === 'ACTIVE' && !isPast_(p.expiresAt); });
  if (activeUse) throw new ApiError_('PUBLIC_LOCATION_IN_USE', 'Archive or update active group-finder posts using this location first.');
  updateRow_('PublicLocations', location._row, {deletedAt:nowIso_(), updatedAt:nowIso_(), isDefault:false});
  return {deleted:true, locationId:location.id};
}

function publicDiscoveryProfile_(profile, includePrivate) {
  if(!profile)return null;
  var out={id:profile.id,userId:profile.userId,headline:profile.headline||'',about:profile.about||'',desiredRoles:parseJsonCell_(profile.desiredRolesJson,[]),offeredRoles:parseJsonCell_(profile.offeredRolesJson,[]),systemIds:parseJsonCell_(profile.systemIdsJson,[]),customSystems:parseJsonCell_(profile.customSystemsJson,[]),tags:parseJsonCell_(profile.tagsJson,[]),playModes:parseJsonCell_(profile.playModesJson,[]),timezone:profile.timezone||'',languages:parseJsonCell_(profile.languagesJson,[]),availability:parseJsonCell_(profile.availabilityJson,{}),accessibility:parseJsonCell_(profile.accessibilityJson,{}),contentBoundaries:parseJsonCell_(profile.contentBoundariesJson,{}),exploreOptOut:bool_(profile.exploreOptOut),lastReconfirmedAt:profile.lastReconfirmedAt||profile.updatedAt||profile.createdAt,createdAt:profile.createdAt,updatedAt:profile.updatedAt};
  if(includePrivate){out.safetyPreferences=parseJsonCell_(profile.safetyPreferencesJson,{});out.answers=parseJsonCell_(profile.answersJson,{});out.requirements=parseJsonCell_(profile.requirementsJson,{});out.preferences=parseJsonCell_(profile.preferencesJson,{});}
  return out;
}

function routeUpsertDiscoveryProfile_(ctx) {
  if(isMinorUser_(ctx.user))throw new ApiError_('MINOR_DISCOVERY_RESTRICTED','Minor accounts use protected all-ages Tablegate membership rather than broad public discovery profiles.');
  var existing=findOne_('DiscoveryProfiles',function(p){return p.userId===ctx.user.id&&!p.deletedAt;}),now=nowIso_(),data={updatedAt:now};
  function setIfPresent_(key,column,mapper){if(ctx.params[key]!==undefined)data[column]=mapper(ctx.params[key]);}
  setIfPresent_('headline','headline',function(v){return nullableText_(v,120);});setIfPresent_('about','about',function(v){return nullableText_(v,2000);});
  setIfPresent_('desiredRoles','desiredRolesJson',function(v){return jsonCell_(normalizeFinderRoles_(v),[],'desiredRoles');});setIfPresent_('offeredRoles','offeredRolesJson',function(v){return jsonCell_(normalizeFinderRoles_(v),[],'offeredRoles');});
  setIfPresent_('systemIds','systemIdsJson',function(v){return jsonCell_(normalizeFinderSystems_(v),[],'systemIds');});setIfPresent_('customSystems','customSystemsJson',function(v){return jsonCell_(normalizeFinderTags_(v),[],'customSystems');});setIfPresent_('tags','tagsJson',function(v){return jsonCell_(normalizeFinderTags_(v),[],'tags');});
  setIfPresent_('playModes','playModesJson',function(v){return jsonCell_(unique_(array_(v).map(function(mode){return enumValue_(mode,TABLEGATE.FINDER_PLAY_MODES,'ONLINE_OK','playMode');})),[],'playModes');});
  setIfPresent_('timezone','timezone',function(v){return nullableText_(v,80);});setIfPresent_('languages','languagesJson',function(v){return jsonCell_(normalizeFinderTags_(v),[],'languages');});setIfPresent_('availability','availabilityJson',function(v){return jsonCell_(v,{},'availability');});setIfPresent_('accessibility','accessibilityJson',function(v){return jsonCell_(v,{},'accessibility');});setIfPresent_('safetyPreferences','safetyPreferencesJson',function(v){return jsonCell_(v,{},'safetyPreferences');});setIfPresent_('answers','answersJson',function(v){return jsonCell_(v,{},'answers');});setIfPresent_('requirements','requirementsJson',function(v){return jsonCell_(normalizeFinderRequirements_(v),{},'requirements');});setIfPresent_('preferences','preferencesJson',function(v){return jsonCell_(normalizeFinderPreferences_(v),{},'preferences');});setIfPresent_('contentBoundaries','contentBoundariesJson',function(v){return jsonCell_(v,{},'contentBoundaries');});if(ctx.params.exploreOptOut!==undefined)data.exploreOptOut=bool_(ctx.params.exploreOptOut);if(bool_(ctx.params.reconfirm))data.lastReconfirmedAt=now;
  if(existing)updateRow_('DiscoveryProfiles',existing._row,data);else{var defaults={id:id_('dpr'),userId:ctx.user.id,headline:'',about:'',desiredRolesJson:'[]',offeredRolesJson:'[]',systemIdsJson:'[]',customSystemsJson:'[]',tagsJson:'[]',playModesJson:'[]',timezone:'',languagesJson:'[]',availabilityJson:'{}',accessibilityJson:'{}',safetyPreferencesJson:'{}',answersJson:'{}',createdAt:now,updatedAt:now,deletedAt:'',requirementsJson:'{}',preferencesJson:'{}',contentBoundariesJson:'{}',exploreOptOut:false,lastReconfirmedAt:now};Object.keys(data).forEach(function(k){defaults[k]=data[k];});insert_('DiscoveryProfiles',defaults);}
  return publicDiscoveryProfile_(findOne_('DiscoveryProfiles',function(p){return p.userId===ctx.user.id&&!p.deletedAt;}),true);
}

function routeGetDiscoveryProfile_(ctx) {
  var userId = String(ctx.params.userId || ctx.user.id);
  var ownProfile = userId === ctx.user.id;
  var user = byId_('Users', userId, true);
  if (!user || bool_(user.disabled)) throw new ApiError_('USER_NOT_FOUND', 'User not found.');
  if (!ownProfile) {
    assertNotBlocked_(ctx.user.id, userId);
    if (!bool_(user.discoverable)) throw new ApiError_('PROFILE_NOT_DISCOVERABLE', 'This user is not discoverable.');
  }
  var profile = findOne_('DiscoveryProfiles', function(p) { return p.userId === userId && !p.deletedAt; });
  return {user:publicUser_(user), profile:publicDiscoveryProfile_(profile, ownProfile)};
}

function routeGetGroupFinderQuestions_(ctx) { return GROUP_FINDER_QUESTIONS_; }

function requireFinderPost_(postId, includeDeleted) {
  var post = byId_('GroupFinderPosts', String(postId || ''), !!includeDeleted);
  if (!post || (!includeDeleted && post.deletedAt)) throw new ApiError_('GROUP_FINDER_POST_NOT_FOUND', 'Group Finder post not found.');
  return post;
}

function finderPostIsActive_(post) {
  if(!post||post.deletedAt||['ARCHIVED','COMPLETED','FILLED','FULL'].indexOf(String(post.status||'').toUpperCase())!==-1)return false;
  if(post.expiresAt&&isPast_(post.expiresAt))return false;
  if(bool_(post.isRightNow)&&post.rightNowUntil&&isPast_(post.rightNowUntil))return false;
  return ['ACTIVE','RECRUITING','WAITLISTED','PAUSED'].indexOf(String(post.status||'ACTIVE').toUpperCase())!==-1&&String(post.status||'').toUpperCase()!=='PAUSED';
}

function validateFinderLocation_(userId, playMode, locationId, radius) {
  if (playMode !== 'IN_PERSON_ONLY') return {location:null, radiusMiles:0};
  var location = requireOwnedPublicLocation_(locationId, userId);
  return {location:location, radiusMiles:int_(radius, 25, TABLEGATE.MIN_GROUP_FINDER_RADIUS_MILES, TABLEGATE.MAX_GROUP_FINDER_RADIUS_MILES)};
}

function publicFinderLocation_(post) {
  if (!post.publicLocationId) return null;
  var location = byId_('PublicLocations', post.publicLocationId);
  return location ? publicLocationView_(location, false) : null;
}

function publicGroupFinderPost_(post,viewerId,match){
  var owner=byId_('Users',post.ownerId,true),tablegate=post.tablegateId?byId_('Tablegates',post.tablegateId):null,ownInterest=viewerId?findOne_('GroupFinderInterests',function(i){return i.postId===post.id&&i.userId===viewerId&&i.status!=='WITHDRAWN';}):null;
  var out={id:post.id,owner:publicUser_(owner),tablegate:tablegate?publicTablegateCard_(tablegate,viewerId):null,postType:post.postType,title:post.title,body:post.body||'',desiredRoles:parseJsonCell_(post.desiredRolesJson,[]),offeredRoles:parseJsonCell_(post.offeredRolesJson,[]),systemIds:parseJsonCell_(post.systemIdsJson,[]),customSystems:parseJsonCell_(post.customSystemsJson,[]),tags:parseJsonCell_(post.tagsJson,[]),playMode:post.playMode,publicLocation:publicFinderLocation_(post),radiusBand:post.playMode==='IN_PERSON_ONLY'?radiusBandFromMiles_(int_(post.radiusMiles,25)):'ONLINE',schedule:parseJsonCell_(post.scheduleJson,{}),timezone:post.timezone||'',languages:parseJsonCell_(post.languagesJson,[]),experienceLevel:post.experienceLevel||'',accessibility:parseJsonCell_(post.accessibilityJson,{}),safetyTools:parseJsonCell_(post.safetyToolsJson,{}),contentBoundaries:parseJsonCell_(post.contentBoundariesJson,{}),agePolicy:post.agePolicy||'ALL_AGES_WITH_GUARDIAN_RULES',seatsAvailable:int_(post.seatsAvailable,0),status:post.status,visibility:post.visibility||'PUBLIC',contactPolicy:post.contactPolicy||'INTEREST_THEN_LOBBY',isRightNow:bool_(post.isRightNow)||post.postType==='RIGHT_NOW',rightNowUntil:post.rightNowUntil||'',lastReconfirmedAt:post.lastReconfirmedAt||post.updatedAt||post.createdAt,freshnessState:finderFreshnessState_(post),safetyCompleteness:parseJsonCell_(post.safetyCompletenessJson,{}),preGameLobbyId:viewerId===post.ownerId?(post.preGameLobbyId||''):'',eventId:post.eventId||'',venueId:post.venueId||'',expiresAt:post.expiresAt||'',createdAt:post.createdAt,updatedAt:post.updatedAt,ownedByViewer:viewerId===post.ownerId,interest:ownInterest?{id:ownInterest.id,status:ownInterest.status,preGameLobbyId:ownInterest.preGameLobbyId||'',createdAt:ownInterest.createdAt}:null};
  if(match){out.eligible=match.eligible;out.matchScore=match.score;out.matchReasons=match.reasons;out.confidence=match.confidence;out.sharedAnswerCount=match.sharedAnswerCount;out.flexibleMismatches=match.flexibleMismatches;out.distanceBand=match.distanceBand;out.safetyNotice='Compatibility is not a safety clearance.';}
  return out;
}

function routeCreateGroupFinderPost_(ctx){requireEmailVerifiedForCommunity_(ctx,'post in Group Finder');
  var activeCount=filter_('GroupFinderPosts',function(p){return p.ownerId===ctx.user.id&&finderPostIsActive_(p);}).length;if(activeCount>=TABLEGATE.MAX_GROUP_FINDER_ACTIVE_POSTS)throw new ApiError_('TOO_MANY_ACTIVE_POSTS','Archive an existing Group Finder post before creating another.');
  var postType=enumValue_(ctx.params.postType||'LOOKING_FOR_GROUP',TABLEGATE.FINDER_POST_TYPES,'LOOKING_FOR_GROUP','postType'),isRightNow=bool_(ctx.params.isRightNow)||postType==='RIGHT_NOW';if(isMinorUser_(ctx.user)&&isRightNow)throw new ApiError_('MINOR_RIGHT_NOW_RESTRICTED','Minor accounts cannot create or appear in Right Now discovery.');
  var playMode=enumValue_(ctx.params.playMode||'ONLINE_OK',TABLEGATE.FINDER_PLAY_MODES,'ONLINE_OK','playMode');if(isMinorUser_(ctx.user)&&playMode==='IN_PERSON_ONLY')throw new ApiError_('MINOR_LOCATION_RESTRICTED','Minor accounts cannot publish local-radius cards.');var loc=validateFinderLocation_(ctx.user.id,playMode,ctx.params.publicLocationId,ctx.params.radiusMiles),tablegateId=String(ctx.params.tablegateId||'');
  if(tablegateId){var tablegate=requireTablegate_(tablegateId);if(tablegate.ownerId!==ctx.user.id&&!hasPermission_(tablegateId,ctx.user.id,PERMISSIONS.MANAGE_TABLEGATE))throw new ApiError_('FORBIDDEN','Only a tablegate manager may advertise that tablegate.');}
  var requestedAgePolicy=String(ctx.params.agePolicy||'').toUpperCase(),advertises18Plus=requestedAgePolicy.indexOf('18')!==-1;if(advertises18Plus){if(isMinorUser_(ctx.user))throw new ApiError_('MINOR_ADULT_SPACE_RESTRICTED','Minor accounts cannot create 18+ discovery posts.');if(!tablegateId)throw new ApiError_('ADULT_TABLEGATE_REQUIRED','An 18+ Group Finder post must be linked to a valid 18+ tablegate with a mature-content reason.');var adultFinderTablegate=requireTablegate_(tablegateId);if(!bool_(adultFinderTablegate.adultOnly)||!adultFinderTablegate.adultReason)throw new ApiError_('ADULT_TABLEGATE_REQUIRED','An 18+ Group Finder post must be linked to an approved 18+ tablegate.');requireAgeAssurance_(ctx.user.id,'CREATE_18_PLUS_TABLEGATE',tablegateId);}
  var now=nowIso_(),expiresInDays=int_(ctx.params.expiresInDays,TABLEGATE.DEFAULT_GROUP_FINDER_POST_DAYS,1,180),rightNowMinutes=isRightNow?int_(ctx.params.rightNowMinutes,TABLEGATE_V8_FINAL.RIGHT_NOW_DEFAULT_MINUTES,15,TABLEGATE_V8_FINAL.RIGHT_NOW_MAX_MINUTES):0,requirements=normalizeFinderRequirements_(ctx.params.requirements),preferences=normalizeFinderPreferences_(ctx.params.preferences),safetyCompleteness=calculateSafetyCompleteness_(ctx.params);
  var post=insert_('GroupFinderPosts',{id:id_('gfp'),ownerId:ctx.user.id,tablegateId:tablegateId,postType:postType,title:text_(ctx.params.title,140),body:nullableText_(ctx.params.body,5000),desiredRolesJson:jsonCell_(normalizeFinderRoles_(ctx.params.desiredRoles),[],'desiredRoles'),offeredRolesJson:jsonCell_(normalizeFinderRoles_(ctx.params.offeredRoles),[],'offeredRoles'),systemIdsJson:jsonCell_(normalizeFinderSystems_(ctx.params.systemIds),[],'systemIds'),customSystemsJson:jsonCell_(normalizeFinderTags_(ctx.params.customSystems),[],'customSystems'),tagsJson:jsonCell_(normalizeFinderTags_(ctx.params.tags),[],'tags'),playMode:playMode,publicLocationId:loc.location?loc.location.id:'',radiusMiles:loc.radiusMiles,scheduleJson:jsonCell_(ctx.params.schedule,{},'schedule'),timezone:nullableText_(ctx.params.timezone,80),languagesJson:jsonCell_(normalizeFinderTags_(ctx.params.languages),[],'languages'),experienceLevel:nullableText_(ctx.params.experienceLevel,80),accessibilityJson:jsonCell_(ctx.params.accessibility,{},'accessibility'),safetyToolsJson:jsonCell_(ctx.params.safetyTools,{},'safetyTools'),answersJson:jsonCell_(ctx.params.answers,{},'answers'),agePolicy:nullableText_(ctx.params.agePolicy,80)||'ALL_AGES_WITH_GUARDIAN_RULES',seatsAvailable:int_(ctx.params.seatsAvailable,0,0,1000),status:'ACTIVE',visibility:isMinorUser_(ctx.user)?'YOUTH_RESTRICTED':'PUBLIC',contactPolicy:enumValue_(ctx.params.contactPolicy||'INTEREST_THEN_LOBBY',TABLEGATE_V8_FINAL.FINDER_CONTACT_POLICIES,'INTEREST_THEN_LOBBY','contactPolicy'),expiresAt:isRightNow?addMsIso_(rightNowMinutes*60000):addMsIso_(expiresInDays*86400000),createdAt:now,updatedAt:now,deletedAt:'',requirementsJson:jsonCell_(requirements,{},'requirements'),preferencesJson:jsonCell_(preferences,{},'preferences'),contentBoundariesJson:jsonCell_(ctx.params.contentBoundaries,{},'contentBoundaries'),isRightNow:isRightNow,rightNowUntil:isRightNow?addMsIso_(rightNowMinutes*60000):'',lastReconfirmedAt:now,freshnessState:'FRESH',preGameLobbyId:'',eventId:String(ctx.params.eventId||''),venueId:String(ctx.params.venueId||''),reviewStatus:'CLEAR',safetyCompletenessJson:jsonCell_(safetyCompleteness,{},'safetyCompleteness')});emitUserEvent_(ctx.user.id,'GROUP_FINDER_POST_CREATED','GROUP_FINDER_POST',post.id,{postId:post.id,isRightNow:isRightNow});return publicGroupFinderPost_(post,ctx.user.id,null);
}

function routeUpdateGroupFinderPost_(ctx){
  var post=requireFinderPost_(ctx.params.postId),patch={updatedAt:nowIso_()};if(post.ownerId!==ctx.user.id)throw new ApiError_('FORBIDDEN','Only the post owner can update it.');
  var requestedAgePolicy=String(ctx.params.agePolicy!==undefined?ctx.params.agePolicy:post.agePolicy||'').toUpperCase(),advertises18Plus=requestedAgePolicy.indexOf('18')!==-1;if(advertises18Plus){if(isMinorUser_(ctx.user))throw new ApiError_('MINOR_ADULT_SPACE_RESTRICTED','Minor accounts cannot advertise 18+ spaces.');if(!post.tablegateId)throw new ApiError_('ADULT_TABLEGATE_REQUIRED','An 18+ post must link to an 18+ Tablegate.');var adultFinderTablegate=requireTablegate_(post.tablegateId);if(!bool_(adultFinderTablegate.adultOnly)||!adultFinderTablegate.adultReason)throw new ApiError_('ADULT_TABLEGATE_REQUIRED','An 18+ post must link to an approved 18+ Tablegate.');}
  if(ctx.params.title!==undefined)patch.title=text_(ctx.params.title,140);if(ctx.params.body!==undefined)patch.body=nullableText_(ctx.params.body,5000);if(ctx.params.postType!==undefined)patch.postType=enumValue_(ctx.params.postType,TABLEGATE.FINDER_POST_TYPES,post.postType,'postType');if(ctx.params.desiredRoles!==undefined)patch.desiredRolesJson=jsonCell_(normalizeFinderRoles_(ctx.params.desiredRoles),[],'desiredRoles');if(ctx.params.offeredRoles!==undefined)patch.offeredRolesJson=jsonCell_(normalizeFinderRoles_(ctx.params.offeredRoles),[],'offeredRoles');if(ctx.params.systemIds!==undefined)patch.systemIdsJson=jsonCell_(normalizeFinderSystems_(ctx.params.systemIds),[],'systemIds');if(ctx.params.customSystems!==undefined)patch.customSystemsJson=jsonCell_(normalizeFinderTags_(ctx.params.customSystems),[],'customSystems');if(ctx.params.tags!==undefined)patch.tagsJson=jsonCell_(normalizeFinderTags_(ctx.params.tags),[],'tags');
  var playMode=ctx.params.playMode!==undefined?enumValue_(ctx.params.playMode,TABLEGATE.FINDER_PLAY_MODES,post.playMode,'playMode'):post.playMode;if(isMinorUser_(ctx.user)&&playMode==='IN_PERSON_ONLY')throw new ApiError_('MINOR_LOCATION_RESTRICTED','Minor accounts cannot publish local-radius cards.');if(ctx.params.playMode!==undefined||ctx.params.publicLocationId!==undefined||ctx.params.radiusMiles!==undefined){var locationId=ctx.params.publicLocationId!==undefined?ctx.params.publicLocationId:post.publicLocationId,radius=ctx.params.radiusMiles!==undefined?ctx.params.radiusMiles:post.radiusMiles,loc=validateFinderLocation_(ctx.user.id,playMode,locationId,radius);patch.playMode=playMode;patch.publicLocationId=loc.location?loc.location.id:'';patch.radiusMiles=loc.radiusMiles;}
  if(ctx.params.schedule!==undefined)patch.scheduleJson=jsonCell_(ctx.params.schedule,{},'schedule');if(ctx.params.timezone!==undefined)patch.timezone=nullableText_(ctx.params.timezone,80);if(ctx.params.languages!==undefined)patch.languagesJson=jsonCell_(normalizeFinderTags_(ctx.params.languages),[],'languages');if(ctx.params.experienceLevel!==undefined)patch.experienceLevel=nullableText_(ctx.params.experienceLevel,80);if(ctx.params.accessibility!==undefined)patch.accessibilityJson=jsonCell_(ctx.params.accessibility,{},'accessibility');if(ctx.params.safetyTools!==undefined)patch.safetyToolsJson=jsonCell_(ctx.params.safetyTools,{},'safetyTools');if(ctx.params.answers!==undefined)patch.answersJson=jsonCell_(ctx.params.answers,{},'answers');if(ctx.params.requirements!==undefined)patch.requirementsJson=jsonCell_(normalizeFinderRequirements_(ctx.params.requirements),{},'requirements');if(ctx.params.preferences!==undefined)patch.preferencesJson=jsonCell_(normalizeFinderPreferences_(ctx.params.preferences),{},'preferences');if(ctx.params.contentBoundaries!==undefined)patch.contentBoundariesJson=jsonCell_(ctx.params.contentBoundaries,{},'contentBoundaries');if(ctx.params.agePolicy!==undefined)patch.agePolicy=nullableText_(ctx.params.agePolicy,80);if(ctx.params.seatsAvailable!==undefined)patch.seatsAvailable=int_(ctx.params.seatsAvailable,0,0,1000);if(ctx.params.status!==undefined)patch.status=enumValue_(ctx.params.status,TABLEGATE.FINDER_POST_STATUSES,post.status,'status');if(ctx.params.contactPolicy!==undefined)patch.contactPolicy=enumValue_(ctx.params.contactPolicy,TABLEGATE_V8_FINAL.FINDER_CONTACT_POLICIES,post.contactPolicy||'INTEREST_THEN_LOBBY','contactPolicy');if(ctx.params.expiresInDays!==undefined)patch.expiresAt=addMsIso_(int_(ctx.params.expiresInDays,30,1,180)*86400000);if(ctx.params.rightNowMinutes!==undefined){if(isMinorUser_(ctx.user))throw new ApiError_('MINOR_RIGHT_NOW_RESTRICTED','Minor accounts cannot create Right Now posts.');var mins=int_(ctx.params.rightNowMinutes,60,15,TABLEGATE_V8_FINAL.RIGHT_NOW_MAX_MINUTES);patch.isRightNow=true;patch.postType='RIGHT_NOW';patch.rightNowUntil=addMsIso_(mins*60000);patch.expiresAt=patch.rightNowUntil;}if(bool_(ctx.params.reconfirm)){patch.lastReconfirmedAt=nowIso_();patch.freshnessState='FRESH';}
  patch.safetyCompletenessJson=jsonCell_(calculateSafetyCompleteness_(Object.assign({},publicGroupFinderPost_(post,ctx.user.id,null),ctx.params)),{},'safetyCompleteness');updateRow_('GroupFinderPosts',post._row,patch);return publicGroupFinderPost_(requireFinderPost_(post.id),ctx.user.id,null);
}

function routeDeleteGroupFinderPost_(ctx) {
  var post = requireFinderPost_(ctx.params.postId);
  if (post.ownerId !== ctx.user.id) throw new ApiError_('FORBIDDEN', 'Only the post owner can delete it.');
  updateRow_('GroupFinderPosts', post._row, {deletedAt:nowIso_(), status:'ARCHIVED', updatedAt:nowIso_()});
  return {deleted:true, postId:post.id};
}

function haversineMiles_(lat1, lng1, lat2, lng2) {
  var toRad = Math.PI / 180, dLat = (lat2 - lat1) * toRad, dLng = (lng2 - lng1) * toRad;
  var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1*toRad) * Math.cos(lat2*toRad) * Math.sin(dLng/2) * Math.sin(dLng/2);
  return 3958.7613 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function intersection_(a, b) {
  var set = {}; b.forEach(function(v) { set[lower_(v)] = true; });
  return unique_(a.filter(function(v) { return set[lower_(v)]; }));
}

function finderAnswerCompatibility_(profileAnswers, postAnswers) {
  profileAnswers = profileAnswers || {}; postAnswers = postAnswers || {};
  var total = 0, earned = 0, matched = [];
  Object.keys(postAnswers).forEach(function(key) {
    if (!Object.prototype.hasOwnProperty.call(profileAnswers, key)) return;
    var desired = postAnswers[key], actual = profileAnswers[key];
    var importance = Math.max(1, Math.min(5, int_(desired && desired.importance, 2, 1, 5)));
    var acceptable = array_(desired && desired.acceptable !== undefined ? desired.acceptable : desired);
    var answer = actual && typeof actual === 'object' ? actual.answer : actual;
    total += importance;
    if (!acceptable.length || acceptable.map(String).indexOf(String(answer)) !== -1) { earned += importance; matched.push(key); }
  });
  return {ratio:total ? earned / total : 0.5, matched:matched};
}

function finderMatch_(post,profile,viewerLocation,viewerUser){
  var eligibility=evaluateFinderEligibility_(post,profile,viewerLocation,viewerUser);if(!eligibility.eligible)return {eligible:false,score:0,reasons:eligibility.reasons,confidence:'NONE',sharedAnswerCount:0,flexibleMismatches:[],distanceBand:eligibility.distanceBand};
  var reasons=[],mismatches=[],score=40,postTags=parseJsonCell_(post.tagsJson,[]),postSystems=parseJsonCell_(post.systemIdsJson,[]),postDesired=parseJsonCell_(post.desiredRolesJson,[]),postOffered=parseJsonCell_(post.offeredRolesJson,[]),profileTags=profile?parseJsonCell_(profile.tagsJson,[]):[],profileSystems=profile?parseJsonCell_(profile.systemIdsJson,[]):[],profileDesired=profile?parseJsonCell_(profile.desiredRolesJson,[]):[],profileOffered=profile?parseJsonCell_(profile.offeredRolesJson,[]):[];
  var tagMatches=intersection_(postTags,profileTags);if(tagMatches.length){score+=Math.min(12,tagMatches.length*3);reasons.push('Shared tags: '+tagMatches.slice(0,4).join(', '));}
  var systemMatches=intersection_(postSystems,profileSystems);if(systemMatches.length){score+=Math.min(18,systemMatches.length*6);reasons.push('Shared game systems');}
  var roleMatches=unique_(intersection_(postDesired,profileOffered).concat(intersection_(postOffered,profileDesired)));if(roleMatches.length){score+=Math.min(18,roleMatches.length*8);reasons.push('Complementary roles: '+roleMatches.join(', '));}
  var shared=0;if(profile){var preferredModes=parseJsonCell_(profile.playModesJson,[]);if(!preferredModes.length||preferredModes.indexOf(post.playMode)!==-1||(post.playMode==='ONLINE_OK'&&preferredModes.indexOf('ONLINE_ONLY')!==-1)){score+=5;reasons.push('Compatible play format');}else mismatches.push('Play format is flexible rather than exact.');var answerScore=finderAnswerCompatibility_(parseJsonCell_(profile.answersJson,{}),parseJsonCell_(post.answersJson,{}));shared=answerScore.matched.length;score+=Math.round(answerScore.ratio*10);if(shared)reasons.push('Shared table-preference answers');var prefScore=weightedPreferenceScore_(parseJsonCell_(post.preferencesJson,{}),parseJsonCell_(profile.preferencesJson,{}),post,profile);score+=prefScore.points;reasons=reasons.concat(prefScore.reasons);mismatches=mismatches.concat(prefScore.mismatches);}
  if(eligibility.distanceBand&&eligibility.distanceBand!=='ONLINE'){score+=eligibility.distancePoints;reasons.push('Within the selected public-place radius');}
  score=Math.max(0,Math.min(100,score));var confidence=shared>=10?'HIGH':shared>=4?'MEDIUM':(profile?'LOW':'LIMITED');return {eligible:true,score:score,reasons:unique_(reasons).slice(0,8),confidence:confidence,sharedAnswerCount:shared,flexibleMismatches:unique_(mismatches).slice(0,6),distanceBand:eligibility.distanceBand};
}

function interactionUnavailable_(a, b) {
  return !!findOne_('SafetyRelations', function(r) { return !r.revokedAt && r.type === 'BLOCK' && ((r.userId === a && r.targetUserId === b) || (r.userId === b && r.targetUserId === a)); });
}

function searchFinderPosts_(ctx,publicOnlyOnline){
  var q=lower_(ctx.params.query||ctx.params.q||''),playMode=String(ctx.params.playMode||'').toUpperCase(),view=String(ctx.params.view||'COMPATIBLE').toUpperCase(),systems=normalizeFinderSystems_(ctx.params.systemIds),tags=normalizeFinderTags_(ctx.params.tags),roles=normalizeFinderRoles_(ctx.params.roles),viewerLocation=null;
  if(!publicOnlyOnline&&ctx.params.publicLocationId)viewerLocation=requireOwnedPublicLocation_(ctx.params.publicLocationId,ctx.user.id);if(!publicOnlyOnline&&!viewerLocation)viewerLocation=findOne_('PublicLocations',function(l){return l.ownerId===ctx.user.id&&!l.deletedAt&&bool_(l.isDefault);});
  var profile=!publicOnlyOnline?findOne_('DiscoveryProfiles',function(p){return p.userId===ctx.user.id&&!p.deletedAt;}):null,viewerUser=publicOnlyOnline?null:ctx.user,limit=int_(ctx.params.limit,40,1,100),offset=int_(ctx.params.offset,0,0,100000),hidden=!publicOnlyOnline?hiddenDiscoverySet_(ctx.user.id):{},matches=[];
  filter_('GroupFinderPosts',function(p){return finderPostIsActive_(p)&&(p.visibility==='PUBLIC'||(!publicOnlyOnline&&p.visibility==='YOUTH_RESTRICTED'&&isMinorUser_(ctx.user)));}).forEach(function(post){
    if(hidden['GROUP_FINDER_POST:'+post.id])return;if(publicOnlyOnline&&(post.playMode==='IN_PERSON_ONLY'||post.visibility!=='PUBLIC'))return;if(!publicOnlyOnline&&post.ownerId!==ctx.user.id&&interactionUnavailable_(ctx.user.id,post.ownerId))return;if(!publicOnlyOnline&&isMinorUserId_(post.ownerId)!==isMinorUser_(ctx.user)&&post.visibility==='YOUTH_RESTRICTED')return;if(q&&lower_(post.title+' '+post.body+' '+post.tagsJson+' '+post.customSystemsJson).indexOf(q)===-1)return;if(playMode&&post.playMode!==playMode)return;if(view==='RIGHT_NOW'&&!bool_(post.isRightNow)&&post.postType!=='RIGHT_NOW')return;
    if(systems.length&&!intersection_(systems,parseJsonCell_(post.systemIdsJson,[])).length)return;if(tags.length&&!intersection_(tags,parseJsonCell_(post.tagsJson,[])).length)return;if(roles.length&&!intersection_(roles,parseJsonCell_(post.desiredRolesJson,[]).concat(parseJsonCell_(post.offeredRolesJson,[]))).length)return;
    var match=finderMatch_(post,profile,viewerLocation,viewerUser);if(!match.eligible)return;matches.push({post:post,match:match});
  });
  if(view==='NEWEST'||publicOnlyOnline)matches.sort(function(a,b){return new Date(b.post.updatedAt)-new Date(a.post.updatedAt);});else if(view==='RIGHT_NOW')matches.sort(function(a,b){return new Date(a.post.rightNowUntil||a.post.expiresAt)-new Date(b.post.rightNowUntil||b.post.expiresAt);});else matches.sort(function(a,b){return b.match.score-a.match.score||new Date(b.post.updatedAt)-new Date(a.post.updatedAt);});
  return {total:matches.length,offset:offset,limit:limit,view:view,hardDealbreakersApplied:true,compatibilityIsNotSafety:true,locationUsed:viewerLocation?publicLocationView_(viewerLocation,false):null,items:matches.slice(offset,offset+limit).map(function(x){return publicGroupFinderPost_(x.post,publicOnlyOnline?'':ctx.user.id,x.match);})};
}

function routeBrowseGroupFinderPosts_(ctx) { return searchFinderPosts_(ctx, true); }
function routeSearchGroupFinderPosts_(ctx) { return searchFinderPosts_(ctx, false); }
function routeGetGroupFinderRecommendations_(ctx) { return searchFinderPosts_(ctx, false); }

function routeGetGroupFinderPost_(ctx) {
  var post = requireFinderPost_(ctx.params.postId);
  if (!finderPostIsActive_(post) && post.ownerId !== ctx.user.id) throw new ApiError_('GROUP_FINDER_POST_UNAVAILABLE', 'This post is no longer active.');
  if (post.ownerId !== ctx.user.id) assertNotBlocked_(ctx.user.id, post.ownerId);
  var viewerLocation = ctx.params.publicLocationId ? requireOwnedPublicLocation_(ctx.params.publicLocationId, ctx.user.id) : findOne_('PublicLocations', function(l) { return l.ownerId === ctx.user.id && !l.deletedAt && bool_(l.isDefault); });
  if (post.playMode === 'IN_PERSON_ONLY' && post.ownerId !== ctx.user.id) {
    if (!viewerLocation) throw new ApiError_('PUBLIC_LOCATION_REQUIRED', 'Choose a public meeting point to confirm that this local post is within range.');
    var anchor = byId_('PublicLocations', post.publicLocationId);
    if (!anchor || haversineMiles_(num_(anchor.lat,0),num_(anchor.lng,0),num_(viewerLocation.lat,0),num_(viewerLocation.lng,0)) > int_(post.radiusMiles,25)) throw new ApiError_('OUTSIDE_POST_RADIUS', 'This in-person post is outside your selected public-location radius.');
  }
  var profile = findOne_('DiscoveryProfiles', function(p) { return p.userId === ctx.user.id && !p.deletedAt; });
  return publicGroupFinderPost_(post, ctx.user.id, finderMatch_(post, profile, viewerLocation));
}

function finderInterestView_(interest,viewerId){var post=requireFinderPost_(interest.postId,true),user=byId_('Users',interest.userId,true);if(viewerId!==post.ownerId&&viewerId!==interest.userId)throw new ApiError_('FORBIDDEN','You cannot view this interest.');return {id:interest.id,postId:interest.postId,postTitle:post.title,user:publicUser_(user),message:interest.message||'',offeredRoles:parseJsonCell_(interest.offeredRolesJson,[]),answers:parseJsonCell_(interest.answersJson,{}),followUp:parseJsonCell_(interest.followUpJson,{}),status:interest.status,dmId:interest.dmId||'',preGameLobbyId:interest.preGameLobbyId||'',createdAt:interest.createdAt,updatedAt:interest.updatedAt,respondedAt:interest.respondedAt||''};}

function ensureDirectDmBetween_(userA,userB){assertNotBlocked_(userA,userB);enforceMinorDirectContact_(userA,userB);var key=pairKey_(userA,userB),dm=findOne_('DmChannels',function(d){return d.type==='DIRECT'&&d.pairKey===key;}),now=nowIso_();if(!dm){dm=insert_('DmChannels',{id:id_('dm'),type:'DIRECT',pairKey:key,name:'',iconAttachmentId:'',ownerId:'',createdAt:now,updatedAt:now,closedAt:''});insert_('DmParticipants',{id:id_('dmp'),dmId:dm.id,userId:userA,role:'MEMBER',joinedAt:now,leftAt:''});insert_('DmParticipants',{id:id_('dmp'),dmId:dm.id,userId:userB,role:'MEMBER',joinedAt:now,leftAt:''});}else{if(dm.closedAt)updateRow_('DmChannels',dm._row,{closedAt:'',updatedAt:now});[userA,userB].forEach(function(uid){var dp=findOne_('DmParticipants',function(x){return x.dmId===dm.id&&x.userId===uid;});if(dp)updateRow_('DmParticipants',dp._row,{leftAt:'',joinedAt:now});else insert_('DmParticipants',{id:id_('dmp'),dmId:dm.id,userId:uid,role:'MEMBER',joinedAt:now,leftAt:''});});}emitUserEvent_(userB,'DM_CREATED','DM',dm.id,{dmId:dm.id,actorId:userA});return byId_('DmChannels',dm.id,true);}

function routeExpressGroupFinderInterest_(ctx){requireEmailVerifiedForCommunity_(ctx,'send a Group Finder Interest');
  var post=requireFinderPost_(ctx.params.postId);if(!finderPostIsActive_(post))throw new ApiError_('POST_NOT_ACTIVE','This post is no longer accepting responses.');if(post.ownerId===ctx.user.id)throw new ApiError_('INVALID_INTEREST','You cannot respond to your own post.');assertNotBlocked_(ctx.user.id,post.ownerId);if(isMinorUser_(ctx.user)&&String(post.agePolicy||'').toUpperCase().indexOf('18')!==-1)throw new ApiError_('MINOR_ADULT_SPACE_RESTRICTED','Minor accounts cannot respond to 18+ discovery.');
  var ownerProfile=findOne_('DiscoveryProfiles',function(p){return p.userId===post.ownerId&&!p.deletedAt;}),viewerProfile=findOne_('DiscoveryProfiles',function(p){return p.userId===ctx.user.id&&!p.deletedAt;}),match=finderMatch_(post,viewerProfile,null,ctx.user);if(!match.eligible)throw new ApiError_('HARD_REQUIREMENT_NOT_MET','This post has a hard requirement that your current discovery profile does not meet.',{reasons:match.reasons});
  var existing=findOne_('GroupFinderInterests',function(i){return i.postId===post.id&&i.userId===ctx.user.id;}),now=nowIso_(),data={message:nullableText_(ctx.params.message,2000),offeredRolesJson:jsonCell_(normalizeFinderRoles_(ctx.params.offeredRoles),[],'offeredRoles'),status:'SENT',dmId:'',updatedAt:now,respondedAt:'',answersJson:jsonCell_(ctx.params.answers,{},'interest answers'),followUpJson:'{}',preGameLobbyId:''};if(existing)updateRow_('GroupFinderInterests',existing._row,data);else{data.id=id_('gfi');data.postId=post.id;data.userId=ctx.user.id;data.createdAt=now;existing=insert_('GroupFinderInterests',data);}createNotification_(post.ownerId,'GROUP_FINDER_INTEREST',ctx.user.id,'GROUP_FINDER_POST',post.id,'',{interestId:existing.id,postId:post.id,postTitle:post.title,matchScore:match.score});return finderInterestView_(findOne_('GroupFinderInterests',function(i){return i.postId===post.id&&i.userId===ctx.user.id;}),ctx.user.id);
}

function routeListGroupFinderInterests_(ctx) {
  var post = requireFinderPost_(ctx.params.postId, true);
  if (post.ownerId !== ctx.user.id) throw new ApiError_('FORBIDDEN', 'Only the post owner can view responses.');
  return filter_('GroupFinderInterests', function(i) { return i.postId === post.id && i.status !== 'WITHDRAWN'; }).sort(function(a,b) { return new Date(b.createdAt) - new Date(a.createdAt); }).map(function(i) { return finderInterestView_(i, ctx.user.id); });
}

function routeListMyGroupFinderInterests_(ctx) {
  return filter_('GroupFinderInterests', function(i) { return i.userId === ctx.user.id; }).sort(function(a,b) { return new Date(b.updatedAt) - new Date(a.updatedAt); }).map(function(i) { return finderInterestView_(i, ctx.user.id); });
}

function routeRespondGroupFinderInterest_(ctx){var interest=byId_('GroupFinderInterests',ctx.params.interestId,true);if(!interest)throw new ApiError_('GROUP_FINDER_INTEREST_NOT_FOUND','Response not found.');var post=requireFinderPost_(interest.postId,true);if(post.ownerId!==ctx.user.id)throw new ApiError_('FORBIDDEN','Only the post owner can respond.');if(interest.status!=='SENT')throw new ApiError_('INTEREST_RESOLVED','This response has already been resolved.');var accept=bool_(ctx.params.accept)||String(ctx.params.status||'').toUpperCase()==='ACCEPTED',now=nowIso_(),status=accept?'ACCEPTED':'DECLINED',lobby=null;if(accept)lobby=createPreGameLobby_(post,interest,ctx.user.id);updateRow_('GroupFinderInterests',interest._row,{status:status,dmId:lobby?lobby.dmId:'',preGameLobbyId:lobby?lobby.id:'',updatedAt:now,respondedAt:now});if(lobby&&!post.preGameLobbyId)updateRow_('GroupFinderPosts',post._row,{preGameLobbyId:lobby.id,updatedAt:now});createNotification_(interest.userId,'GROUP_FINDER_INTEREST_'+status,ctx.user.id,'GROUP_FINDER_POST',post.id,'',{interestId:interest.id,postId:post.id,postTitle:post.title,dmId:lobby?lobby.dmId:'',preGameLobbyId:lobby?lobby.id:''});return finderInterestView_(byId_('GroupFinderInterests',interest.id,true),ctx.user.id);}

function routeWithdrawGroupFinderInterest_(ctx) {
  var interest = byId_('GroupFinderInterests', ctx.params.interestId, true);
  if (!interest || interest.userId !== ctx.user.id) throw new ApiError_('GROUP_FINDER_INTEREST_NOT_FOUND', 'Response not found.');
  if (interest.status === 'ACCEPTED') throw new ApiError_('INTEREST_ALREADY_ACCEPTED', 'An accepted connection cannot be withdrawn here; use block or leave the conversation if needed.');
  updateRow_('GroupFinderInterests', interest._row, {status:'WITHDRAWN', updatedAt:nowIso_()});
  return {withdrawn:true, interestId:interest.id};
}

function routeReportGroupFinderPost_(ctx) {
  var post = requireFinderPost_(ctx.params.postId, true);
  if (post.ownerId === ctx.user.id) throw new ApiError_('INVALID_REPORT', 'You cannot report your own post.');
  var reason = String(ctx.params.reason || 'OTHER').trim().toUpperCase().replace(/[\s-]+/g, '_').slice(0, 60);
  var existing = findOne_('GroupFinderReports', function(r) { return r.postId === post.id && r.reporterId === ctx.user.id && r.status === 'OPEN'; });
  if (existing) return stripInternal_(existing);
  var report = insert_('GroupFinderReports', {id:id_('gfr'), postId:post.id, reporterId:ctx.user.id, reason:reason, details:nullableText_(ctx.params.details, 2000), status:'OPEN', createdAt:nowIso_(), reviewedAt:'', reviewedBy:''});
  return stripInternal_(report);
}

/* =============================
 * TABLEGATE V8 CAPABILITY LAYER
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
  'open-registration','public-tablegate-discovery','public-visitor-membership','admin-approved-player-promotion','visitor-observation-and-general-chat','system-appropriate-admin-titles','protected-owner-hierarchy','automatic-owner-succession','safeguarded-account-deletion','adult-group-third-party-age-assurance','adult-group-mature-reason-requirement','safety-reporting-without-age-verification','safety-evidence-preservation','join-without-invite','optional-join-requests',
  'group-finder-posts','hard-dealbreakers-before-scoring','explainable-match-confidence','chronological-discovery-feed','free-expiring-right-now','coarse-distance-bands','public-place-radius-privacy','public-venues-and-events','finder-interests-and-auditable-pre-game-lobbies','finder-reporting','minor-safe-discovery-and-contact',
  'private-incident-journals','object-level-safety-reporting','anonymous-safety-reporting','immutable-message-revisions','tamper-evident-evidence-hashes','evidence-access-logs','central-protective-actions','anti-retaliation-logging','safety-appeals','aggregate-transparency','guardian-links','trusted-contacts','public-event-safety-check-ins',
  'pwa-manifest','desktop-mobile-tablet-install-config','email-verification','password-reset-codes','expiring-auth-challenges',
  'statistics','secure-randomization','dice','configured-integrations','webrtc-signaling',
  'cross-device-state-sync','revision-conflict-detection','drive-backed-file-library',
  'document-folders','document-categories','document-tags','document-search','document-attachments',
  'document-scans','ocr-provider-handoff','media-transcripts','speech-to-text-provider-handoff',
  'read-aloud-preparation','synced-reading-progress','synced-accessibility-preferences','soft-delete-and-restore'
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

function normalizeTwoFactorMethod_(method){method=String(method||'EMAIL').toUpperCase();if(['EMAIL','PHONE'].indexOf(method)===-1)throw new ApiError_('INVALID_2FA_METHOD','Two-factor method must be EMAIL or PHONE.');return method;}
function sendTwoFactorCode_(user,method,code){method=normalizeTwoFactorMethod_(method);var minutes=10,appName=PropertiesService.getScriptProperties().getProperty(TABLEGATE.APP_NAME_PROPERTY)||'Tablegate';if(method==='EMAIL'){ensureEmailQuota_();MailApp.sendEmail({to:user.email,subject:appName+' sign-in verification code',body:'Your '+appName+' sign-in verification code is '+code+'. It expires in '+minutes+' minutes.',htmlBody:'<p>Your '+appName+' sign-in verification code is:</p><p style="font-size:26px;font-weight:bold;letter-spacing:4px">'+code+'</p><p>It expires in '+minutes+' minutes.</p>',name:appName});return;}var url=PropertiesService.getScriptProperties().getProperty(TABLEGATE.SMS_WEBHOOK_URL_PROPERTY)||'';if(!url)throw new ApiError_('SMS_NOT_CONFIGURED','Phone verification requires the TableGate SMS webhook to be configured. Email two-factor authentication is available immediately.');var token=PropertiesService.getScriptProperties().getProperty(TABLEGATE.SMS_WEBHOOK_TOKEN_PROPERTY)||'';var response=UrlFetchApp.fetch(url,{method:'post',contentType:'application/json',muteHttpExceptions:true,headers:token?{'Authorization':'Bearer '+token}: {},payload:JSON.stringify({to:user.phone,code:code,expiresInMinutes:minutes,purpose:'TABLEGATE_2FA'})});if(response.getResponseCode()<200||response.getResponseCode()>=300)throw new ApiError_('SMS_SEND_FAILED','The configured SMS provider could not send the verification code.');}
function createTwoFactorChallenge_(user,method){var active=filter_('TwoFactorChallenges',function(c){return c.userId===user.id&&!c.usedAt&&isFuture_(c.expiresAt);});active.forEach(function(c){updateRow_('TwoFactorChallenges',c._row,{usedAt:nowIso_()});});var code=randomNumericCode_(6),now=nowIso_(),row=insert_('TwoFactorChallenges',{id:id_('2fa'),userId:user.id,method:method,codeHash:sha256Hex_(code),createdAt:now,expiresAt:addMsIso_(10*60000),usedAt:'',attempts:0,metadataJson:'{}'});sendTwoFactorCode_(user,method,code);return row;}
function validateTwoFactorChallenge_(userId,code){var rows=filter_('TwoFactorChallenges',function(c){return c.userId===userId&&!c.usedAt&&!isPast_(c.expiresAt);}).sort(function(a,b){return new Date(b.createdAt)-new Date(a.createdAt);});if(!rows.length)throw new ApiError_('TWO_FACTOR_CODE_EXPIRED','The two-factor code expired. Request a new code.');var c=rows[0],attempts=int_(c.attempts,0,0,100);if(attempts>=TABLEGATE.AUTH_CHALLENGE_MAX_ATTEMPTS){updateRow_('TwoFactorChallenges',c._row,{usedAt:nowIso_()});throw new ApiError_('TOO_MANY_ATTEMPTS','Too many attempts. Request a new code.');}if(!constantTimeEqual_(sha256Hex_(String(code||'').trim()),c.codeHash)){updateRow_('TwoFactorChallenges',c._row,{attempts:attempts+1});throw new ApiError_('INVALID_TWO_FACTOR_CODE','The two-factor code is invalid.');}updateRow_('TwoFactorChallenges',c._row,{usedAt:nowIso_(),attempts:attempts+1});return c;}
function routeGetTwoFactor_(ctx){var setting=findOne_('TwoFactorSettings',function(s){return s.userId===ctx.user.id;});return {enabled:bool_(ctx.user.twoFactorEnabled),method:ctx.user.twoFactorMethod||'EMAIL',phone:ctx.user.phone||'',phoneVerified:bool_(ctx.user.phoneVerified),settings:setting?stripInternal_(setting):null};}
function routeSetTwoFactor_(ctx){var enabled=bool_(ctx.params.enabled),method=normalizeTwoFactorMethod_(ctx.params.method||ctx.user.twoFactorMethod||'EMAIL'),phone=String(ctx.params.phone||ctx.user.phone||'').trim();if(enabled&&method==='EMAIL'&&!emailVerified_(ctx.user))throw new ApiError_('EMAIL_NOT_VERIFIED','Verify your email before enabling email two-factor authentication.');if(enabled&&method==='PHONE'&&!bool_(ctx.user.phoneVerified))throw new ApiError_('PHONE_NOT_VERIFIED','Verify your phone number before enabling phone two-factor authentication.');var now=nowIso_(),existing=findOne_('TwoFactorSettings',function(s){return s.userId===ctx.user.id;});if(existing)updateRow_('TwoFactorSettings',existing._row,{enabled:enabled,method:method,phone:phone,phoneVerified:bool_(ctx.user.phoneVerified),updatedAt:now});else insert_('TwoFactorSettings',{id:id_('2fs'),userId:ctx.user.id,enabled:enabled,method:method,phone:phone,phoneVerified:bool_(ctx.user.phoneVerified),createdAt:now,updatedAt:now});updateRow_('Users',ctx.user._row,{twoFactorEnabled:enabled,twoFactorMethod:enabled?method:'',phone:phone,updatedAt:now});return privateUser_(byId_('Users',ctx.user.id,true));}
function routeRequestPhoneVerification_(ctx){var phone=String(ctx.params.phone||'').trim();if(!/^\\+?[1-9][0-9 ()-]{7,20}$/.test(phone))throw new ApiError_('INVALID_PHONE','Enter a valid phone number in international format.');var user=ctx.user;var challenge=createAuthChallenge_(Object.assign({},user,{email:phone}),'VERIFY_PHONE',10,{phone:phone});var url=PropertiesService.getScriptProperties().getProperty(TABLEGATE.SMS_WEBHOOK_URL_PROPERTY)||'';if(!url)throw new ApiError_('SMS_NOT_CONFIGURED','Phone verification requires the TableGate SMS webhook to be configured.');sendTwoFactorCode_(Object.assign({},user,{phone:phone}), 'PHONE', challenge.code);updateRow_('Users',user._row,{phone:phone});return {requested:true,expiresAt:challenge.row.expiresAt};}
function routeVerifyPhone_(ctx){var phone=String(ctx.params.phone||ctx.user.phone||'').trim();var user=ctx.user;validateAuthChallenge_(phone,'VERIFY_PHONE',ctx.params.code||ctx.params.token,'');updateRow_('Users',user._row,{phone:phone,phoneVerified:true,phoneVerifiedAt:nowIso_(),updatedAt:nowIso_()});return privateUser_(byId_('Users',user.id,true));}
function routeVerifyTwoFactor_(ctx){var challengeId=String(ctx.params.challengeId||''),row=byId_('TwoFactorChallenges',challengeId,true);if(!row||row.usedAt||isPast_(row.expiresAt))throw new ApiError_('TWO_FACTOR_CODE_EXPIRED','The two-factor code expired. Request a new code.');var user=byId_('Users',row.userId,true);if(!user||bool_(user.disabled))throw new ApiError_('INVALID_TWO_FACTOR','The sign-in challenge is no longer valid.');validateTwoFactorChallenge_(user.id,ctx.params.code);var session=createSession_(user.id,ctx.params.userAgent||'');return {verified:true,user:privateUser_(byId_('Users',user.id,true)),token:session.token,session:session.session};}
function routeResendTwoFactor_(ctx){var email=validateEmail_(ctx.params.email||'');var user=findOne_('Users',function(u){return lower_(u.email)===email&&!bool_(u.disabled);});if(!user||!bool_(user.twoFactorEnabled))throw new ApiError_('TWO_FACTOR_NOT_AVAILABLE','Two-factor authentication is not enabled for that account.');var method=normalizeTwoFactorMethod_(user.twoFactorMethod||'EMAIL');var row=createTwoFactorChallenge_(user,method);return {requested:true,expiresAt:row.expiresAt,method:method,challengeId:row.id};}

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

function routeListSharedLibrary_(ctx){
  var id=PropertiesService.getScriptProperties().getProperty(TABLEGATE.PUBLIC_LIBRARY_DRIVE_FOLDER_PROPERTY)||'13Oealaxh3SYpn45Lw0RdKYvwwrupAseY';
  var folder;try{folder=DriveApp.getFolderById(id);}catch(e){throw new ApiError_('SHARED_LIBRARY_UNAVAILABLE','The shared TableGate Drive library is not available to the backend.',String(e&&e.message||e));}
  var q=lower_(String(ctx.params.query||ctx.params.q||'')),limit=int_(ctx.params.limit,100,1,500),items=[];
  function walk_(dir,path,depth){if(depth>8||items.length>=limit)return;var files=dir.getFiles();while(files.hasNext()&&items.length<limit){var f=files.next();if(f.isTrashed())continue;var name=f.getName();if(q&&lower_(name+' '+path).indexOf(q)===-1)continue;try{f.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW);}catch(_sharing){}items.push({id:f.getId(),name:name,path:path+'/'+name,mimeType:f.getMimeType(),sizeBytes:f.getSize(),updatedAt:f.getLastUpdated().toISOString(),url:f.getUrl(),downloadUrl:'https://drive.google.com/uc?export=download&id='+encodeURIComponent(f.getId())});}var folders=dir.getFolders();while(folders.hasNext()&&items.length<limit){var child=folders.next();if(child.isTrashed())continue;walk_(child,path+'/'+child.getName(),depth+1);}}
  walk_(folder,'',0);
  return {folderId:id,items:items,sharedWithAllAuthenticatedUsers:true};
}
function routeGetSharedLibraryFile_(ctx){
  var id=PropertiesService.getScriptProperties().getProperty(TABLEGATE.PUBLIC_LIBRARY_DRIVE_FOLDER_PROPERTY)||'13Oealaxh3SYpn45Lw0RdKYvwwrupAseY',fileId=String(ctx.params.fileId||'');if(!fileId)throw new ApiError_('FILE_ID_REQUIRED','A shared library file ID is required.');
  var folder=DriveApp.getFolderById(id),files=folder.getFiles(),found=null;while(files.hasNext()){var f=files.next();if(f.getId()===fileId){found=f;break;}}
  if(!found)throw new ApiError_('FILE_NOT_FOUND','That file is not in the TableGate shared library.');return {id:found.getId(),name:found.getName(),mimeType:found.getMimeType(),sizeBytes:found.getSize(),url:found.getUrl(),downloadUrl:'https://drive.google.com/uc?export=download&id='+encodeURIComponent(found.getId())};
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
function routeCreateProject_(ctx){var p=ctx.params,tablegateId=String(p.tablegateId||'');if(tablegateId)requirePlayer_(tablegateId,ctx.user.id,'Visitors may observe tablegate worldbuilding but cannot create projects until approved as Players.');var name=text_(p.name,160),folder=uploadFolder_().createFolder(safeFileName_('Project - '+name)),now=nowIso_(),row=insert_('Projects',{id:id_('prj'),ownerId:ctx.user.id,tablegateId:tablegateId,name:name,projectType:text_(p.projectType||'GENERAL',80).toUpperCase(),description:nullableText_(p.description,4000),status:enumValue_(p.status||'ACTIVE',['DRAFT','ACTIVE','PAUSED','COMPLETED','ARCHIVED'],'ACTIVE','project status'),driveFolderId:folder.getId(),settingsJson:jsonCell_(p.settings,{},'project settings'),createdAt:now,updatedAt:now,deletedAt:''});return publicProject_(row);}
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
function routeCreateMap_(ctx){var p=ctx.params,project=p.projectId?requireProject_(p.projectId,ctx.user.id,true):null,tablegateId=String(p.tablegateId||(project&&project.tablegateId)||'');if(tablegateId)requirePlayer_(tablegateId,ctx.user.id,'Visitors may observe maps but cannot create tablegate maps until approved as Players.');var bg=String(p.backgroundAttachmentId||'');if(bg){var a=byId_('Attachments',bg,true);if(!a)throw new ApiError_('ATTACHMENT_NOT_FOUND','Map background not found.');requireAttachmentAccess_(a.id,ctx.user.id,a.tablegateId||'',a.dmId||'');}var now=nowIso_(),m=insert_('MapProjects',{id:id_('map'),projectId:project?project.id:'',tablegateId:tablegateId,ownerId:ctx.user.id,name:text_(p.name,180),backgroundAttachmentId:bg,width:int_(p.width,4096,1,20000),height:int_(p.height,4096,1,20000),projection:nullableText_(p.projection,80)||'PIXEL',settingsJson:jsonCell_(p.settings,{},'map settings'),createdAt:now,updatedAt:now,deletedAt:''});var layer=insert_('MapLayers',{id:id_('mly'),mapId:m.id,name:'Interactive Locations',layerType:'SEMANTIC',orderIndex:10,visible:true,styleJson:'{}',createdAt:now,updatedAt:now,deletedAt:''});return {map:publicMap_(m),defaultLayer:stripInternal_(layer)};}
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
function routeCreateSimulationWorld_(ctx){var p=ctx.params,project=p.projectId?requireProject_(p.projectId,ctx.user.id,true):null,tablegateId=String(p.tablegateId||(project&&project.tablegateId)||'');if(tablegateId)requirePlayer_(tablegateId,ctx.user.id,'Visitors may observe worldbuilding but cannot create simulation worlds until approved as Players.');var now=nowIso_(),w=insert_('SimulationWorlds',{id:id_('sim'),projectId:project?project.id:'',tablegateId:tablegateId,ownerId:ctx.user.id,name:text_(p.name,160),currentTime:p.currentTime?new Date(p.currentTime).toISOString():now,timeScale:clamp_(p.timeScale===undefined?1:p.timeScale,0,10000),paused:bool_(p.paused),settingsJson:jsonCell_(p.settings,{},'world settings'),lastTickAt:now,createdAt:now,updatedAt:now,deletedAt:''});return publicWorld_(w);}
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

function routeGetClientConfig_(ctx){var props=PropertiesService.getScriptProperties();return {apiVersion:TABLEGATE.API_VERSION,schemaVersion:props.getProperty('TABLEGATE_SCHEMA_VERSION')||TABLEGATE.SCHEMA_VERSION,appName:props.getProperty(TABLEGATE.APP_NAME_PROPERTY)||'Tablegate',publicAppUrl:props.getProperty(TABLEGATE.PUBLIC_APP_URL_PROPERTY)||'',maxUploadBytes:int_(props.getProperty(TABLEGATE.MAX_UPLOAD_PROPERTY),TABLEGATE.DEFAULT_MAX_UPLOAD_BYTES),maxInlineAiFileBytes:int_(props.getProperty(TABLEGATE.MAX_INLINE_AI_FILE_BYTES_PROPERTY),TABLEGATE.DEFAULT_MAX_INLINE_AI_FILE_BYTES),sessionDays:int_(props.getProperty(TABLEGATE.SESSION_DAYS_PROPERTY),TABLEGATE.DEFAULT_SESSION_DAYS),registrationMode:props.getProperty(TABLEGATE.REGISTRATION_MODE_PROPERTY)||'OPEN',emailVerificationRequired:false,communityVerificationGates:['CREATE_TABLEGATE','JOIN_TABLEGATE','GROUP_FINDER_POST','GROUP_FINDER_INTEREST','MESSENGER'],twoFactor:{optional:true,methods:['EMAIL','PHONE'],phoneProviderConfigured:!!props.getProperty(TABLEGATE.SMS_WEBHOOK_URL_PROPERTY)},iceServers:getIceServers_(),capabilities:TABLEGATE_CAPABILITIES_,community:{openRegistration:(props.getProperty(TABLEGATE.REGISTRATION_MODE_PROPERTY)||'OPEN')==='OPEN',ttrpgForEveryone:true,visitorMembership:true,playerApprovalRequired:true,visitorChannelModes:TABLEGATE.VISITOR_CHANNEL_MODES,adminTitles:TABLEGATE.ADMIN_TITLES,defaultTablegateJoinPolicy:'OPEN',joinPolicies:TABLEGATE.TABLEGATE_JOIN_POLICIES,ownership:{ownerProtectedFromPeerAdmins:true,manualTransferByOwnerOnly:true,accountDeletionSuccessor:'FIRST_ACTIVE_ADMIN_BY_ADMIN_GRANT_TIME',previewAction:'previewAccountDeletion',deleteAction:'deleteAccount',identityRetentionDays:TABLEGATE.ACCOUNT_IDENTITY_RETENTION_DAYS},ageAssurance:{providers:getAgeAssuranceProviders_(),policy:publicAgeAssurancePolicy_()},adultGroups:{requireMatureReason:true,categories:TABLEGATE.ADULT_CONTENT_CATEGORIES},safetyReporting:{ageVerificationRequired:false,categories:TABLEGATE.SAFETY_REPORT_CATEGORIES,reportableObjects:TABLEGATE_V8_FINAL.REPORTABLE_OBJECTS,urgency:TABLEGATE_V8_FINAL.SAFETY_URGENCY,anonymousReports:true,privateIncidentJournal:true,appeals:true,evidenceHoldDays:TABLEGATE.SAFETY_EVIDENCE_HOLD_DAYS,lawEnforcementContact:props.getProperty(TABLEGATE.LAW_ENFORCEMENT_CONTACT_PROPERTY)||''},groupFinder:{playModes:TABLEGATE.FINDER_PLAY_MODES,postTypes:TABLEGATE.FINDER_POST_TYPES,roles:TABLEGATE.FINDER_ROLES,views:TABLEGATE_V8_FINAL.FINDER_VIEWS,contactPolicies:TABLEGATE_V8_FINAL.FINDER_CONTACT_POLICIES,publicPlaceTypes:TABLEGATE.PUBLIC_PLACE_TYPES,minRadiusMiles:TABLEGATE.MIN_GROUP_FINDER_RADIUS_MILES,maxRadiusMiles:TABLEGATE.MAX_GROUP_FINDER_RADIUS_MILES,distanceBands:TABLEGATE_V8_FINAL.DISTANCE_BANDS,exactDistancePublic:false,hardDealbreakersBeforeScoring:true,rightNowDefaultMinutes:TABLEGATE_V8_FINAL.RIGHT_NOW_DEFAULT_MINUTES},minorSafety:{selfDeclaredAgeBand:true,generalIdVerificationRequired:false,guardianLinks:true,adultMinorPrivateDmRestricted:true,adultFacingRightNow:false},personalSafety:{trustedContacts:true,publicEventCheckIns:true,liveLocationShared:false}},pwa:{manifestUrl:serviceUrl_()?serviceUrl_()+'?action=manifest':'',manifest:buildPwaManifest_()},ai:{enabled:!!props.getProperty(TABLEGATE.AI_BACKEND_URL_PROPERTY),actions:['aiChat','aiRequest','aiHealth','smartAsk','webSearch','imageSearch','generateImage','generateFromReferences','parseFile','generatePainterlyMap'],rulesContext:true,libraryId:TABLEGATE.AI_LIBRARY_ID,libraryVersion:TABLEGATE.AI_LIBRARY_VERSION},integrations:routeListIntegrations_(ctx),polling:{eventsMs:1500,presenceHeartbeatMs:45000,typingRefreshMs:6000,rtcSignalsMs:800}};}

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
  if(options.pwaThemeColor!==undefined)props.setProperty(TABLEGATE.PWA_THEME_COLOR_PROPERTY,String(options.pwaThemeColor||'#00ffff').slice(0,20));
  if(options.pwaBackgroundColor!==undefined)props.setProperty(TABLEGATE.PWA_BACKGROUND_COLOR_PROPERTY,String(options.pwaBackgroundColor||'#07181c').slice(0,20));
  if(options.pwaIcon192Url!==undefined)props.setProperty(TABLEGATE.PWA_ICON_192_PROPERTY,validatedHttpsUrl_(options.pwaIcon192Url,'pwaIcon192Url'));
  if(options.pwaIcon512Url!==undefined)props.setProperty(TABLEGATE.PWA_ICON_512_PROPERTY,validatedHttpsUrl_(options.pwaIcon512Url,'pwaIcon512Url'));
  if(options.pwaMaskableIconUrl!==undefined)props.setProperty(TABLEGATE.PWA_MASKABLE_ICON_PROPERTY,validatedHttpsUrl_(options.pwaMaskableIconUrl,'pwaMaskableIconUrl'));
  if(options.emailVerificationRequired!==undefined)props.setProperty(TABLEGATE.EMAIL_VERIFICATION_REQUIRED_PROPERTY,String(!!options.emailVerificationRequired));
  if(options.emailCodeMinutes!==undefined)props.setProperty(TABLEGATE.EMAIL_CODE_MINUTES_PROPERTY,String(int_(options.emailCodeMinutes,30,5,1440)));
  if(options.resetCodeMinutes!==undefined)props.setProperty(TABLEGATE.RESET_CODE_MINUTES_PROPERTY,String(int_(options.resetCodeMinutes,15,5,1440)));
  if(options.maxInlineAiFileBytes!==undefined)props.setProperty(TABLEGATE.MAX_INLINE_AI_FILE_BYTES_PROPERTY,String(int_(options.maxInlineAiFileBytes,TABLEGATE.DEFAULT_MAX_INLINE_AI_FILE_BYTES,1024,10*1024*1024)));
  if(options.integrations!==undefined)configureTablegateIntegrations(options.integrations);
  var result={appName:props.getProperty(TABLEGATE.APP_NAME_PROPERTY),publicAppUrl:props.getProperty(TABLEGATE.PUBLIC_APP_URL_PROPERTY)||'',pwaManifest:buildPwaManifest_(),registrationMode:props.getProperty(TABLEGATE.REGISTRATION_MODE_PROPERTY),emailVerificationRequired:emailVerificationRequired_(),emailCodeMinutes:props.getProperty(TABLEGATE.EMAIL_CODE_MINUTES_PROPERTY),resetCodeMinutes:props.getProperty(TABLEGATE.RESET_CODE_MINUTES_PROPERTY),sessionDays:props.getProperty(TABLEGATE.SESSION_DAYS_PROPERTY),maxUploadBytes:props.getProperty(TABLEGATE.MAX_UPLOAD_PROPERTY),maxInlineAiFileBytes:props.getProperty(TABLEGATE.MAX_INLINE_AI_FILE_BYTES_PROPERTY),iceServers:getIceServers_(),aiBackendUrl:props.getProperty(TABLEGATE.AI_BACKEND_URL_PROPERTY),aiTimeoutMs:props.getProperty(TABLEGATE.AI_TIMEOUT_MS_PROPERTY),integrations:Object.keys(getIntegrationConfigs_()),aiLibraryId:TABLEGATE.AI_LIBRARY_ID,aiLibraryVersion:TABLEGATE.AI_LIBRARY_VERSION};console.log(JSON.stringify(result,null,2));return result;
}


function configureTablegateIntegrations(configs){
  if(!configs||typeof configs!=='object'||Array.isArray(configs))throw new Error('integrations must be an object keyed by provider name.');
  var clean={};Object.keys(configs).forEach(function(name){var c=configs[name]||{};if(!/^[A-Za-z0-9_.-]{1,80}$/.test(name))throw new Error('Invalid integration provider name: '+name);if(c.endpoint&&!/^https:\/\//i.test(c.endpoint))throw new Error('Integration endpoints must use HTTPS.');clean[name]={endpoint:String(c.endpoint||''),method:String(c.method||'post').toLowerCase(),enabled:c.enabled!==false,description:String(c.description||'').slice(0,500),capabilities:Array.isArray(c.capabilities)?c.capabilities.map(String).slice(0,100):[],headers:c.headers&&typeof c.headers==='object'?c.headers:{},secretProperty:String(c.secretProperty||''),headerName:String(c.headerName||'Authorization'),secretPrefix:c.secretPrefix===undefined?'Bearer ':String(c.secretPrefix)};});PropertiesService.getScriptProperties().setProperty(TABLEGATE.INTEGRATIONS_PROPERTY,JSON.stringify(clean));return Object.keys(clean);
}
function setTablegateSecret(propertyName,value){propertyName=String(propertyName||'').trim();if(!/^TABLEGATE_SECRET_[A-Z0-9_]{1,80}$/.test(propertyName))throw new Error('Secret property names must begin TABLEGATE_SECRET_ and use uppercase letters, digits, or underscores.');PropertiesService.getScriptProperties().setProperty(propertyName,String(value||''));return {stored:true,propertyName:propertyName};}


function configureTablegateAgeAssurance(options){
  options=options||{};var providers=Array.isArray(options.providers)?options.providers:[],clean=providers.map(function(p){if(!p||!p.id)throw new Error('Each age-assurance provider needs an id.');var id=String(p.id).trim();if(!/^[A-Za-z0-9_.-]{1,80}$/.test(id))throw new Error('Invalid age-assurance provider id: '+id);var startUrl=String(p.startUrl||'').trim();if(!/^https:\/\//i.test(startUrl))throw new Error('Age-assurance provider startUrl must use HTTPS.');var privacyUrl=String(p.privacyUrl||'').trim();if(privacyUrl&&!/^https:\/\//i.test(privacyUrl))throw new Error('Age-assurance provider privacyUrl must use HTTPS.');return {id:id,name:String(p.name||id).slice(0,120),startUrl:startUrl,privacyUrl:privacyUrl,description:String(p.description||'').slice(0,500),enabled:p.enabled!==false};});var props=PropertiesService.getScriptProperties();props.setProperty(TABLEGATE.AGE_ASSURANCE_PROVIDERS_PROPERTY,JSON.stringify(clean));if(options.callbackUrl!==undefined){var callbackUrl=String(options.callbackUrl||'').trim();if(callbackUrl&&!/^https:\/\//i.test(callbackUrl))throw new Error('Age-assurance callbackUrl must use HTTPS.');props.setProperty(TABLEGATE.AGE_ASSURANCE_CALLBACK_URL_PROPERTY,callbackUrl);}if(options.validDays!==undefined)props.setProperty(TABLEGATE.AGE_ASSURANCE_VALID_DAYS_PROPERTY,String(int_(options.validDays,TABLEGATE.DEFAULT_AGE_ASSURANCE_VALID_DAYS,1,3650)));if(options.callbackSecret!==undefined)props.setProperty(TABLEGATE.AGE_ASSURANCE_CALLBACK_SECRET_PROPERTY,String(options.callbackSecret||''));else if(bool_(options.rotateCallbackSecret)||!props.getProperty(TABLEGATE.AGE_ASSURANCE_CALLBACK_SECRET_PROPERTY))props.setProperty(TABLEGATE.AGE_ASSURANCE_CALLBACK_SECRET_PROPERTY,randomToken_(6));return {configuredProviders:clean.map(function(p){return p.id;}),callbackUrl:props.getProperty(TABLEGATE.AGE_ASSURANCE_CALLBACK_URL_PROPERTY)||'',validDays:int_(props.getProperty(TABLEGATE.AGE_ASSURANCE_VALID_DAYS_PROPERTY),TABLEGATE.DEFAULT_AGE_ASSURANCE_VALID_DAYS),policy:publicAgeAssurancePolicy_()};
}
function configureTablegateSafetyReviewers(emails,lawEnforcementContact){var clean=unique_(array_(emails).map(function(x){return lower_(String(x||'').trim());}).filter(function(x){return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(x);}));var props=PropertiesService.getScriptProperties();props.setProperty(TABLEGATE.SAFETY_REVIEWER_EMAILS_PROPERTY,JSON.stringify(clean));if(lawEnforcementContact!==undefined)props.setProperty(TABLEGATE.LAW_ENFORCEMENT_CONTACT_PROPERTY,String(lawEnforcementContact||'').slice(0,1000));return {reviewerEmails:clean,lawEnforcementContact:props.getProperty(TABLEGATE.LAW_ENFORCEMENT_CONTACT_PROPERTY)||''};}

function migrateTablegateV7_(){
  var counts={tablegates:0,rolesCreated:0,visitorAssignments:0,channelPolicies:0,members:0,users:0,ownerProtectionsRepaired:0,voiceStates:0,attachments:0,legacyAdultGroupsReturnedToAllAges:0,registrationOpened:false};
  var props=PropertiesService.getScriptProperties();
  if(props.getProperty(TABLEGATE.REGISTRATION_MODE_PROPERTY)!=='OPEN'){props.setProperty(TABLEGATE.REGISTRATION_MODE_PROPERTY,'OPEN');counts.registrationOpened=true;}
  filter_('Users',function(u){return u.deletedAt===undefined||u.deletionReason===undefined;}).forEach(function(u){var patch={};if(u.deletedAt===undefined)patch.deletedAt='';if(u.deletionReason===undefined)patch.deletionReason='';if(Object.keys(patch).length){updateRow_('Users',u._row,patch);counts.users++;}});
  filter_('Tablegates',function(t){return !t.deletedAt;}).forEach(function(t){
    var patch={},now=nowIso_(),adult=bool_(t.adultOnly);
    if(!t.joinPolicy)patch.joinPolicy=adult?'REQUEST':(bool_(t.isPublic)?'OPEN':'INVITE_ONLY');
    if(t.tagsJson==='')patch.tagsJson='[]';if(t.language===undefined)patch.language='';if(t.maxMembers===undefined)patch.maxMembers=0;
    if(!t.defaultAdminTitle)patch.defaultAdminTitle='ADMIN';if(t.customAdminTitle===undefined)patch.customAdminTitle='';
    if(adult&&(!t.adultReason||String(t.adultReason).trim().length<TABLEGATE.ADULT_REASON_MIN_LENGTH||!parseJsonCell_(t.adultContentCategoriesJson,[]).length)){patch.adultOnly=false;patch.adultReason='';patch.adultContentCategoriesJson='[]';patch.joinPolicy=bool_(t.isPublic)?'OPEN':'INVITE_ONLY';patch.inviteOnly=!bool_(t.isPublic);counts.legacyAdultGroupsReturnedToAllAges++;}
    if(!adult&&t.adultReason===undefined)patch.adultReason='';if(t.adultContentCategoriesJson===undefined)patch.adultContentCategoriesJson='[]';
    if(Object.keys(patch).length){patch.updatedAt=t.updatedAt||now;updateRow_('Tablegates',t._row,patch);counts.tablegates++;}
    var owner=managedRoleFor_(t.id,'CREATOR');if(!owner){owner=insert_('Roles',{id:id_('rol'),tablegateId:t.id,name:'Owner',color:'#D6A84B',permissions:PERMISSIONS.ALL,position:110,isManaged:true,managedKey:'CREATOR',createdAt:now,updatedAt:now});counts.rolesCreated++;}else updateRow_('Roles',owner._row,{name:'Owner',permissions:PERMISSIONS.ALL,position:110,updatedAt:now});
    var ownerMember=findOne_('Members',function(m){return m.tablegateId===t.id&&m.userId===t.ownerId;});if(ownerMember){if(ownerMember.leftAt||ownerMember.timedOutUntil){updateRow_('Members',ownerMember._row,{leftAt:'',timedOutUntil:'',updatedAt:now});counts.ownerProtectionsRepaired++;}}else{insert_('Members',{id:id_('mem'),tablegateId:t.id,userId:t.ownerId,nickname:'',joinedAt:t.createdAt||now,updatedAt:now,leftAt:'',timedOutUntil:'',adminTitle:t.defaultAdminTitle||'ADMIN',customAdminTitle:t.customAdminTitle||''});counts.ownerProtectionsRepaired++;}
    filter_('Bans',function(b){return b.tablegateId===t.id&&b.userId===t.ownerId&&!b.revokedAt;}).forEach(function(b){updateRow_('Bans',b._row,{revokedAt:now,revokedBy:'SYSTEM_MIGRATION'});counts.ownerProtectionsRepaired++;});
    filter_('MemberRoles',function(mr){return mr.tablegateId===t.id&&mr.roleId===owner.id&&mr.userId!==t.ownerId;}).sort(function(a,b){return b._row-a._row;}).forEach(function(mr){deleteRow_('MemberRoles',mr._row);counts.ownerProtectionsRepaired++;});
    if(!findOne_('MemberRoles',function(mr){return mr.tablegateId===t.id&&mr.roleId===owner.id&&mr.userId===t.ownerId;})){insert_('MemberRoles',{id:id_('mrl'),tablegateId:t.id,userId:t.ownerId,roleId:owner.id,createdAt:t.createdAt||now});counts.ownerProtectionsRepaired++;}
    if(!managedRoleFor_(t.id,'ADMIN')){insert_('Roles',{id:id_('rol'),tablegateId:t.id,name:'Admin',color:'#00FFFF',permissions:PERMISSIONS.ALL,position:100,isManaged:true,managedKey:'ADMIN',createdAt:now,updatedAt:now});counts.rolesCreated++;}
    if(!managedRoleFor_(t.id,'PLAYER')){insert_('Roles',{id:id_('rol'),tablegateId:t.id,name:'Player',color:'#43B581',permissions:PLAYER_PERMISSIONS,position:10,isManaged:true,managedKey:'PLAYER',createdAt:now,updatedAt:now});counts.rolesCreated++;}
    if(!managedRoleFor_(t.id,'VISITOR')){insert_('Roles',{id:id_('rol'),tablegateId:t.id,name:'Visitor',color:'#99AAB5',permissions:VISITOR_PERMISSIONS,position:0,isManaged:true,managedKey:'VISITOR',createdAt:now,updatedAt:now});counts.rolesCreated++;}
    filter_('Members',function(m){return m.tablegateId===t.id&&!m.leftAt;}).forEach(function(m){var mp={};if(m.adminTitle===undefined)mp.adminTitle='';if(m.customAdminTitle===undefined)mp.customAdminTitle='';if(Object.keys(mp).length){mp.updatedAt=m.updatedAt||now;updateRow_('Members',m._row,mp);counts.members++;}if(!isTablegateAdmin_(t.id,m.userId)&&!memberHasManagedRole_(t.id,m.userId,'PLAYER')){ensureVisitorRole_(t.id,m.userId);counts.visitorAssignments++;}});
    filter_('Channels',function(c){return c.tablegateId===t.id&&!c.deletedAt;}).forEach(function(c){var mode=String(c.visitorMode||'').toUpperCase();if(TABLEGATE.VISITOR_CHANNEL_MODES.indexOf(mode)===-1){if(bool_(c.isPrivate))mode='NONE';else if(lower_(c.name)==='general')mode='CHAT';else if(c.type==='VOICE'||c.type==='VIDEO')mode='OBSERVE';else mode='READ';updateRow_('Channels',c._row,{visitorMode:mode,updatedAt:c.updatedAt||now});counts.channelPolicies++;}});
  });
  filter_('VoiceStates',function(v){return v.listenOnly===undefined;}).forEach(function(v){var listen=false;try{listen=isVisitor_(v.tablegateId,v.userId)||!hasPermission_(v.tablegateId,v.userId,PERMISSIONS.SPEAK);}catch(e){}updateRow_('VoiceStates',v._row,{listenOnly:listen,muted:listen?true:v.muted,videoEnabled:listen?false:v.videoEnabled,screenSharing:listen?false:v.screenSharing,pushToTalk:listen?false:v.pushToTalk,whispering:listen?false:v.whispering,updatedAt:v.updatedAt||nowIso_()});counts.voiceStates++;});
  filter_('Attachments',function(a){return a.safetyHoldUntil===undefined;}).forEach(function(a){updateRow_('Attachments',a._row,{safetyHoldUntil:''});counts.attachments++;});
  props.setProperty('TABLEGATE_SCHEMA_VERSION',TABLEGATE.SCHEMA_VERSION);return counts;
}

function enableOpenCommunityV7(options){
  options=options||{};resetRuntime_();ensureConfigured_();var props=PropertiesService.getScriptProperties();props.setProperty(TABLEGATE.REGISTRATION_MODE_PROPERTY,'OPEN');var changed=0;
  if(bool_(options.openExistingPublicTablegates))filter_('Tablegates',function(t){return !t.deletedAt&&bool_(t.isPublic);}).forEach(function(t){updateRow_('Tablegates',t._row,{joinPolicy:'OPEN',inviteOnly:false,updatedAt:nowIso_()});changed++;});
  return {registrationMode:'OPEN',existingPublicTablegatesOpened:changed};
}

function runTablegateMaintenance(){
  resetRuntime_();ensureConfigured_();var lock=LockService.getScriptLock();lock.waitLock(30000);try{var now=Date.now(),counts={sessions:0,events:0,signals:0,typing:0,uploads:0,authChallenges:0,expiredMemory:0,expiredFinderPosts:0,expiredAccountIdentityRecords:0};
    filter_('Sessions',function(s){return s.revokedAt||new Date(s.expiresAt).getTime()<now-7*86400000;}).sort(function(a,b){return b._row-a._row;}).forEach(function(r){deleteRow_('Sessions',r._row);counts.sessions++;});
    filter_('Events',function(r){return new Date(r.expiresAt).getTime()<now;}).sort(function(a,b){return b._row-a._row;}).forEach(function(r){deleteRow_('Events',r._row);counts.events++;});
    filter_('RtcSignals',function(r){return r.consumedAt||new Date(r.expiresAt).getTime()<now;}).sort(function(a,b){return b._row-a._row;}).forEach(function(r){deleteRow_('RtcSignals',r._row);counts.signals++;});
    filter_('Typing',function(r){return new Date(r.expiresAt).getTime()<now;}).sort(function(a,b){return b._row-a._row;}).forEach(function(r){deleteRow_('Typing',r._row);counts.typing++;});
    filter_('AuthChallenges',function(r){return r.usedAt||new Date(r.expiresAt).getTime()<now-86400000;}).sort(function(a,b){return b._row-a._row;}).forEach(function(r){deleteRow_('AuthChallenges',r._row);counts.authChallenges++;});
    filter_('MemoryItems',function(r){return !r.deletedAt&&r.expiresAt&&new Date(r.expiresAt).getTime()<now;}).forEach(function(r){updateRow_('MemoryItems',r._row,{deletedAt:nowIso_(),updatedAt:nowIso_()});counts.expiredMemory++;});
    filter_('GroupFinderPosts',function(p){return !p.deletedAt&&p.status==='ACTIVE'&&p.expiresAt&&new Date(p.expiresAt).getTime()<now;}).forEach(function(p){updateRow_('GroupFinderPosts',p._row,{status:'ARCHIVED',updatedAt:nowIso_()});counts.expiredFinderPosts++;});
    filter_('AccountDeletionRecords',function(r){if(!r.retentionUntil||new Date(r.retentionUntil).getTime()>=now)return false;return !findOne_('SafetyReports',function(s){return (s.reporterId===r.userId||s.reportedUserId===r.userId)&&s.preservationUntil&&new Date(s.preservationUntil).getTime()>=now;});}).sort(function(a,b){return b._row-a._row;}).forEach(function(r){deleteRow_('AccountDeletionRecords',r._row);counts.expiredAccountIdentityRecords++;});
    filter_('Attachments',function(a){return !a.deletedAt&&(!a.safetyHoldUntil||!isFuture_(a.safetyHoldUntil))&&!attachmentInUse_(a.id)&&new Date(a.createdAt).getTime()<now-24*3600000;}).sort(function(a,b){return b._row-a._row;}).forEach(function(a){try{DriveApp.getFileById(a.fileId).setTrashed(true);}catch(e){}updateRow_('Attachments',a._row,{deletedAt:nowIso_()});counts.uploads++;});
    console.log(JSON.stringify(counts));return counts;
  }finally{lock.releaseLock();}}

function createTablegateMaintenanceTrigger(){ScriptApp.getProjectTriggers().filter(function(t){return t.getHandlerFunction()==='runTablegateMaintenance';}).forEach(function(t){ScriptApp.deleteTrigger(t);});return ScriptApp.newTrigger('runTablegateMaintenance').timeBased().everyHours(1).create().getUniqueId();}

/* =============================
 * ROUTE TABLE
 * ============================= */


/* =============================
 * TABLEGATE V8 FINAL DISCOVERY + SAFETY LAYER
 * ============================= */
function normalizeAgeBand_(value){var v=String(value||'UNSPECIFIED').trim().toUpperCase().replace(/[\s-]+/g,'_');if(['UNDER_18','TEEN','YOUTH'].indexOf(v)!==-1)v='MINOR';if(['18_PLUS','18+','ADULT_18_PLUS'].indexOf(v)!==-1)v='ADULT';return TABLEGATE_V8_FINAL.ACCOUNT_AGE_BANDS.indexOf(v)!==-1?v:'UNSPECIFIED';}
function isMinorUser_(user){if(!user)return false;if(typeof user==='string')user=byId_('Users',user,true);return !!user&&normalizeAgeBand_(user.ageBand)==='MINOR';}
function isMinorUserId_(userId){return isMinorUser_(byId_('Users',userId,true));}
function isAdultUser_(user){if(typeof user==='string')user=byId_('Users',user,true);return !!user&&normalizeAgeBand_(user.ageBand)==='ADULT';}
function routeSetMyAgeBand_(ctx){var band=normalizeAgeBand_(ctx.params.ageBand);if(band==='UNSPECIFIED'&&String(ctx.params.ageBand||'').trim())throw new ApiError_('INVALID_AGE_BAND','Age band must be UNSPECIFIED, MINOR, or ADULT. This is a privacy-preserving account setting, not ID verification.');var patch={ageBand:band,guardianStatus:band==='MINOR'?(ctx.user.guardianStatus||'PENDING'):'NOT_REQUIRED',minorPrivacyLocked:band==='MINOR',updatedAt:nowIso_()};if(band==='MINOR')patch.discoverable=false;updateRow_('Users',ctx.user._row,patch);return privateUser_(byId_('Users',ctx.user.id,true));}
function routeCompleteSafetyOrientation_(ctx){updateRow_('Users',ctx.user._row,{safetyOrientationAt:nowIso_(),updatedAt:nowIso_()});return {completed:true,completedAt:nowIso_(),principles:['Compatibility is not safety clearance.','Block and report remain available after leaving.','Urgency never bypasses screening, age rules, or public-place safeguards.']};}
function publicTrustSignals_(user){var participation=filter_('ParticipationHistory',function(p){return p.userId===user.id&&p.eventType==='PARTICIPATED';}).length,venue=filter_('PublicEvents',function(e){return e.ownerId===user.id&&!e.deletedAt&&e.status==='COMPLETED';}).length;return {accountCreatedAt:user.createdAt,lastActiveAt:user.lastSeenAt||'',lastReconfirmedAt:user.lastReconfirmedAt||user.updatedAt||user.createdAt,safetyOrientationCompleted:!!user.safetyOrientationAt,verifiedParticipationCount:participation,publicVenueEventHistoryCount:venue,notice:'These are activity signals, not proof that a person is safe.'};}
function routeRecordParticipation_(ctx){var tablegateId=String(ctx.params.tablegateId||''),userId=String(ctx.params.userId||ctx.user.id);requirePermission_(tablegateId,ctx.user.id,PERMISSIONS.MANAGE_TABLEGATE);requireMember_(tablegateId,userId);var row=insert_('ParticipationHistory',{id:id_('par'),tablegateId:tablegateId,userId:userId,eventType:String(ctx.params.eventType||'PARTICIPATED').toUpperCase(),sessionId:String(ctx.params.sessionId||''),recordedBy:ctx.user.id,occurredAt:ctx.params.occurredAt?new Date(ctx.params.occurredAt).toISOString():nowIso_(),metadataJson:jsonCell_(ctx.params.metadata,{},'participation metadata')});return stripInternal_(row);}

function confirmedGuardianPair_(minorUserId,guardianUserId){return !!findOne_('GuardianLinks',function(g){return g.minorUserId===minorUserId&&g.guardianUserId===guardianUserId&&g.status==='CONFIRMED'&&!g.revokedAt;});}
function enforceMinorDirectContact_(userA,userB){var a=isMinorUserId_(userA),b=isMinorUserId_(userB);if(a===b)return true;var minorId=a?userA:userB,adultId=a?userB:userA;if(confirmedGuardianPair_(minorId,adultId))return true;throw new ApiError_('ADULT_MINOR_DIRECT_DM_RESTRICTED','Unrelated adults and minors cannot open a private one-to-one DM. Use an auditable group lobby with another approved adult, confirmed guardian, or safety observer present.');}
function hasConfirmedGuardianInParticipants_(minorIds,userIds){return minorIds.some(function(minorId){return userIds.some(function(uid){return uid!==minorId&&confirmedGuardianPair_(minorId,uid);});});}
function enforceMinorSafeGroupParticipants_(userIds){userIds=unique_(userIds.map(String));var minors=userIds.filter(isMinorUserId_),knownAdults=userIds.filter(function(id){return isAdultUser_(id);}),mixed=minors.length&&userIds.length>minors.length;if(mixed&&knownAdults.length<2&&!hasConfirmedGuardianInParticipants_(minors,userIds))throw new ApiError_('ADULT_MINOR_GROUP_SAFETY_REQUIRED','A mixed adult/minor group conversation requires two known-adult participants or a confirmed guardian. Unspecified age-band accounts do not count as adult safety observers.');return true;}
function enforceMinorSafeDm_(dm,userId){var ids=filter_('DmParticipants',function(p){return p.dmId===dm.id&&!p.leftAt;}).map(function(p){return p.userId;});if(dm.type==='DIRECT'&&ids.length===2)enforceMinorDirectContact_(ids[0],ids[1]);else enforceMinorSafeGroupParticipants_(ids);return true;}
function approvedSafetyObserverFor_(tablegateId,excludeIds){excludeIds=excludeIds||[];var minorIds=excludeIds.filter(isMinorUserId_);for(var g=0;g<minorIds.length;g++){var link=findOne_('GuardianLinks',function(x){return x.minorUserId===minorIds[g]&&x.status==='CONFIRMED'&&!x.revokedAt&&excludeIds.indexOf(x.guardianUserId)===-1&&isAdultUser_(x.guardianUserId);});if(link)return link.guardianUserId;}if(!tablegateId)return '';var members=filter_('Members',function(m){return m.tablegateId===tablegateId&&!m.leftAt&&excludeIds.indexOf(m.userId)===-1&&isAdultUser_(m.userId);}).sort(function(a,b){return new Date(a.joinedAt)-new Date(b.joinedAt);});for(var i=0;i<members.length;i++)if(isTablegateAdmin_(tablegateId,members[i].userId))return members[i].userId;return '';}


function publicGuardianLink_(g,viewerId){var otherId=viewerId===g.minorUserId?g.guardianUserId:g.minorUserId;return {id:g.id,direction:viewerId===g.minorUserId?'GUARDIAN':'MINOR',minorUserId:g.minorUserId,guardianUserId:g.guardianUserId,otherUser:publicUser_(byId_('Users',otherId,true)),status:g.status,createdAt:g.createdAt,updatedAt:g.updatedAt,confirmedAt:g.confirmedAt||''};}
function routeRequestGuardianLink_(ctx){if(!isMinorUser_(ctx.user))throw new ApiError_('MINOR_ACCOUNT_REQUIRED','Only an account marked MINOR can request a guardian link.');var guardianId=String(ctx.params.guardianUserId||ctx.params.userId||''),guardian=byId_('Users',guardianId,true);if(!guardian||bool_(guardian.disabled))throw new ApiError_('USER_NOT_FOUND','Guardian account not found.');if(!isAdultUser_(guardian))throw new ApiError_('ADULT_ACCOUNT_REQUIRED','A guardian account must be marked ADULT. This account-age setting is not 18+ ID verification.');assertNotBlocked_(ctx.user.id,guardianId);var existing=findOne_('GuardianLinks',function(g){return g.minorUserId===ctx.user.id&&g.guardianUserId===guardianId&&!g.revokedAt;}),now=nowIso_();if(existing)updateRow_('GuardianLinks',existing._row,{status:'PENDING',updatedAt:now,confirmedAt:'',revokedAt:''});else existing=insert_('GuardianLinks',{id:id_('gdn'),minorUserId:ctx.user.id,guardianUserId:guardianId,status:'PENDING',createdAt:now,updatedAt:now,confirmedAt:'',revokedAt:''});createNotification_(guardianId,'GUARDIAN_LINK_REQUEST',ctx.user.id,'USER',ctx.user.id,'',{guardianLinkId:existing.id});return publicGuardianLink_(byId_('GuardianLinks',existing.id,true),ctx.user.id);}
function routeRespondGuardianLink_(ctx){var g=byId_('GuardianLinks',ctx.params.guardianLinkId,true);if(!g||g.guardianUserId!==ctx.user.id||g.revokedAt)throw new ApiError_('GUARDIAN_LINK_NOT_FOUND','Guardian-link request not found.');if(!isAdultUser_(ctx.user))throw new ApiError_('ADULT_ACCOUNT_REQUIRED','Only an account marked ADULT may confirm a guardian link.');var status=enumValue_(ctx.params.status||ctx.params.decision,['CONFIRMED','DECLINED'],'DECLINED','guardian decision'),now=nowIso_();updateRow_('GuardianLinks',g._row,{status:status,updatedAt:now,confirmedAt:status==='CONFIRMED'?now:'',revokedAt:status==='DECLINED'?now:''});if(status==='CONFIRMED'){var minor=byId_('Users',g.minorUserId,true);if(minor)updateRow_('Users',minor._row,{guardianStatus:'CONFIRMED',updatedAt:now});}createNotification_(g.minorUserId,'GUARDIAN_LINK_'+status,ctx.user.id,'USER',ctx.user.id,'',{guardianLinkId:g.id});return publicGuardianLink_(byId_('GuardianLinks',g.id,true),ctx.user.id);}
function routeListGuardianLinks_(ctx){return filter_('GuardianLinks',function(g){return !g.revokedAt&&(g.minorUserId===ctx.user.id||g.guardianUserId===ctx.user.id);}).sort(function(a,b){return new Date(b.updatedAt)-new Date(a.updatedAt);}).map(function(g){return publicGuardianLink_(g,ctx.user.id);});}
function routeRevokeGuardianLink_(ctx){var g=byId_('GuardianLinks',ctx.params.guardianLinkId,true);if(!g||(g.minorUserId!==ctx.user.id&&g.guardianUserId!==ctx.user.id))throw new ApiError_('GUARDIAN_LINK_NOT_FOUND','Guardian link not found.');var now=nowIso_();updateRow_('GuardianLinks',g._row,{status:'REVOKED',updatedAt:now,revokedAt:now});var remaining=findOne_('GuardianLinks',function(x){return x.minorUserId===g.minorUserId&&x.id!==g.id&&x.status==='CONFIRMED'&&!x.revokedAt;});if(!remaining){var minor=byId_('Users',g.minorUserId,true);if(minor)updateRow_('Users',minor._row,{guardianStatus:'PENDING',updatedAt:now});}var other=ctx.user.id===g.minorUserId?g.guardianUserId:g.minorUserId;createNotification_(other,'GUARDIAN_LINK_REVOKED',ctx.user.id,'USER',ctx.user.id,'',{guardianLinkId:g.id});return {revoked:true,guardianLinkId:g.id};}

function publicTrustedContact_(r,viewerId){var otherId=viewerId===r.userId?r.contactUserId:r.userId;return {id:r.id,direction:viewerId===r.userId?'OUTGOING':'INCOMING',userId:r.userId,contactUserId:r.contactUserId,otherUser:publicUser_(byId_('Users',otherId,true)),label:r.label||'',status:r.status,createdAt:r.createdAt,updatedAt:r.updatedAt,confirmedAt:r.confirmedAt||''};}
function routeRequestTrustedContact_(ctx){var contactId=String(ctx.params.contactUserId||ctx.params.userId||''),contact=byId_('Users',contactId,true);if(!contact||bool_(contact.disabled))throw new ApiError_('USER_NOT_FOUND','Trusted-contact account not found.');if(contactId===ctx.user.id)throw new ApiError_('INVALID_CONTACT','You cannot designate yourself as a trusted contact.');assertNotBlocked_(ctx.user.id,contactId);var existing=findOne_('TrustedContacts',function(r){return r.userId===ctx.user.id&&r.contactUserId===contactId&&!r.revokedAt;}),now=nowIso_(),label=nullableText_(ctx.params.label,80);if(existing)updateRow_('TrustedContacts',existing._row,{label:label,status:'PENDING',updatedAt:now,confirmedAt:'',revokedAt:''});else existing=insert_('TrustedContacts',{id:id_('trc'),userId:ctx.user.id,contactUserId:contactId,label:label,status:'PENDING',createdAt:now,updatedAt:now,confirmedAt:'',revokedAt:''});createNotification_(contactId,'TRUSTED_CONTACT_REQUEST',ctx.user.id,'USER',ctx.user.id,'',{trustedContactId:existing.id});return publicTrustedContact_(byId_('TrustedContacts',existing.id,true),ctx.user.id);}
function routeRespondTrustedContact_(ctx){var r=byId_('TrustedContacts',ctx.params.trustedContactId,true);if(!r||r.contactUserId!==ctx.user.id||r.revokedAt)throw new ApiError_('TRUSTED_CONTACT_NOT_FOUND','Trusted-contact request not found.');var status=enumValue_(ctx.params.status||ctx.params.decision,['ACCEPTED','DECLINED'],'DECLINED','trusted-contact decision'),now=nowIso_();updateRow_('TrustedContacts',r._row,{status:status,updatedAt:now,confirmedAt:status==='ACCEPTED'?now:'',revokedAt:status==='DECLINED'?now:''});createNotification_(r.userId,'TRUSTED_CONTACT_'+status,ctx.user.id,'USER',ctx.user.id,'',{trustedContactId:r.id});return publicTrustedContact_(byId_('TrustedContacts',r.id,true),ctx.user.id);}
function routeListTrustedContacts_(ctx){return filter_('TrustedContacts',function(r){return !r.revokedAt&&(r.userId===ctx.user.id||r.contactUserId===ctx.user.id);}).sort(function(a,b){return new Date(b.updatedAt)-new Date(a.updatedAt);}).map(function(r){return publicTrustedContact_(r,ctx.user.id);});}
function routeRevokeTrustedContact_(ctx){var r=byId_('TrustedContacts',ctx.params.trustedContactId,true);if(!r||(r.userId!==ctx.user.id&&r.contactUserId!==ctx.user.id))throw new ApiError_('TRUSTED_CONTACT_NOT_FOUND','Trusted contact not found.');var now=nowIso_();updateRow_('TrustedContacts',r._row,{status:'REVOKED',updatedAt:now,revokedAt:now});var other=ctx.user.id===r.userId?r.contactUserId:r.userId;createNotification_(other,'TRUSTED_CONTACT_REVOKED',ctx.user.id,'USER',ctx.user.id,'',{trustedContactId:r.id});return {revoked:true,trustedContactId:r.id};}
function acceptedTrustedContactIds_(userId,ids){ids=unique_(array_(ids).map(String));return ids.filter(function(id){return !!findOne_('TrustedContacts',function(r){return r.userId===userId&&r.contactUserId===id&&r.status==='ACCEPTED'&&!r.revokedAt;});});}
function canViewSafetyCheckIn_(row,userId){if(row.userId===userId)return true;return parseJsonCell_(row.trustedContactIdsJson,[]).indexOf(userId)!==-1;}
function effectiveCheckInStatus_(row){if(['COMPLETED','CANCELLED','NEEDS_ATTENTION'].indexOf(row.status)!==-1)return row.status;if(row.expectedEndAt&&isPast_(row.expectedEndAt))return 'OVERDUE';return row.status;}
function publicSafetyCheckIn_(row,viewerId){if(!canViewSafetyCheckIn_(row,viewerId))throw new ApiError_('CHECK_IN_NOT_FOUND','Safety check-in not found.');var event=row.publicEventId?byId_('PublicEvents',row.publicEventId):null,loc=row.publicLocationId?byId_('PublicLocations',row.publicLocationId):null;return {id:row.id,user:publicUser_(byId_('Users',row.userId,true)),publicEvent:event?publicEventView_(event):null,tablegateId:row.tablegateId||'',publicLocation:loc?publicLocationView_(loc,false):null,trustedContactIds:parseJsonCell_(row.trustedContactIdsJson,[]),startAt:row.startAt,expectedEndAt:row.expectedEndAt,status:row.status,effectiveStatus:effectiveCheckInStatus_(row),note:row.note||'',createdAt:row.createdAt,updatedAt:row.updatedAt,checkedInAt:row.checkedInAt||'',completedAt:row.completedAt||'',cancelledAt:row.cancelledAt||'',attentionAt:row.attentionAt||'',notice:'This shares only the selected public event or public-place anchor, never live coordinates or a home address.'};}
function routeCreateSafetyCheckIn_(ctx){var contacts=acceptedTrustedContactIds_(ctx.user.id,ctx.params.trustedContactIds);if(!contacts.length)throw new ApiError_('TRUSTED_CONTACT_REQUIRED','Choose at least one accepted trusted contact.');var eventId=String(ctx.params.publicEventId||''),event=eventId?byId_('PublicEvents',eventId):null;if(eventId&&!event)throw new ApiError_('EVENT_NOT_FOUND','Public event not found.');var tablegateId=String(ctx.params.tablegateId||(event&&event.tablegateId)||''),locationId=String(ctx.params.publicLocationId||(event&&event.publicLocationId)||'');if(tablegateId&&!event)requireMember_(tablegateId,ctx.user.id);var loc=locationId?byId_('PublicLocations',locationId):null;if(locationId&&!loc)throw new ApiError_('PUBLIC_LOCATION_NOT_FOUND','Public meeting location not found.');if(!event&&!loc&&!tablegateId)throw new ApiError_('CHECK_IN_DESTINATION_REQUIRED','Choose a public event, public-place anchor, or Tablegate.');var start=ctx.params.startAt?new Date(ctx.params.startAt):new Date(),end=new Date(ctx.params.expectedEndAt);if(!isFinite(start.getTime())||!isFinite(end.getTime())||end.getTime()<=start.getTime())throw new ApiError_('INVALID_CHECK_IN_WINDOW','The expected end must be after the start time.');if(end.getTime()-start.getTime()>48*3600000)throw new ApiError_('CHECK_IN_WINDOW_TOO_LONG','A safety check-in window cannot exceed 48 hours.');var now=nowIso_(),row=insert_('SafetyCheckIns',{id:id_('chk'),userId:ctx.user.id,publicEventId:eventId,tablegateId:tablegateId,publicLocationId:locationId,trustedContactIdsJson:jsonCell_(contacts,[],'trusted contacts'),startAt:start.toISOString(),expectedEndAt:end.toISOString(),status:'PLANNED',note:nullableText_(ctx.params.note,1000),createdAt:now,updatedAt:now,checkedInAt:'',completedAt:'',cancelledAt:'',attentionAt:''});contacts.forEach(function(uid){createNotification_(uid,'SAFETY_CHECK_IN_CREATED',ctx.user.id,'SAFETY_CHECK_IN',row.id,'',{checkInId:row.id,expectedEndAt:row.expectedEndAt});});return publicSafetyCheckIn_(row,ctx.user.id);}
function routeListSafetyCheckIns_(ctx){var mineOnly=bool_(ctx.params.mineOnly);return filter_('SafetyCheckIns',function(r){return r.userId===ctx.user.id||(!mineOnly&&parseJsonCell_(r.trustedContactIdsJson,[]).indexOf(ctx.user.id)!==-1);}).sort(function(a,b){return new Date(b.createdAt)-new Date(a.createdAt);}).slice(0,int_(ctx.params.limit,100,1,300)).map(function(r){return publicSafetyCheckIn_(r,ctx.user.id);});}
function routeUpdateSafetyCheckIn_(ctx){var r=byId_('SafetyCheckIns',ctx.params.checkInId,true);if(!r||r.userId!==ctx.user.id)throw new ApiError_('CHECK_IN_NOT_FOUND','Safety check-in not found.');var status=enumValue_(ctx.params.status,['PLANNED','CHECKED_IN','COMPLETED','CANCELLED'],r.status,'check-in status'),now=nowIso_(),patch={status:status,updatedAt:now};if(ctx.params.note!==undefined)patch.note=nullableText_(ctx.params.note,1000);if(status==='CHECKED_IN')patch.checkedInAt=now;if(status==='COMPLETED')patch.completedAt=now;if(status==='CANCELLED')patch.cancelledAt=now;updateRow_('SafetyCheckIns',r._row,patch);var updated=byId_('SafetyCheckIns',r.id,true);parseJsonCell_(updated.trustedContactIdsJson,[]).forEach(function(uid){createNotification_(uid,'SAFETY_CHECK_IN_'+status,ctx.user.id,'SAFETY_CHECK_IN',r.id,'',{checkInId:r.id,status:status});});return publicSafetyCheckIn_(updated,ctx.user.id);}
function routeFlagSafetyCheckIn_(ctx){var r=byId_('SafetyCheckIns',ctx.params.checkInId,true);if(!r||parseJsonCell_(r.trustedContactIdsJson,[]).indexOf(ctx.user.id)===-1)throw new ApiError_('CHECK_IN_NOT_FOUND','Safety check-in not found.');if(['COMPLETED','CANCELLED'].indexOf(r.status)!==-1)return publicSafetyCheckIn_(r,ctx.user.id);var now=nowIso_();updateRow_('SafetyCheckIns',r._row,{status:'NEEDS_ATTENTION',attentionAt:now,updatedAt:now});createNotification_(r.userId,'SAFETY_CHECK_IN_NEEDS_ATTENTION',ctx.user.id,'SAFETY_CHECK_IN',r.id,'',{checkInId:r.id,message:nullableText_(ctx.params.message,500)});return publicSafetyCheckIn_(byId_('SafetyCheckIns',r.id,true),ctx.user.id);}
function normalizeFinderRequirements_(v){v=v&&typeof v==='object'&&!Array.isArray(v)?v:{};return {requiredSystemIds:normalizeFinderSystems_(v.requiredSystemIds||v.systemIds),requiredOfferedRoles:normalizeFinderRoles_(v.requiredOfferedRoles||v.roles),requiredPlayModes:unique_(array_(v.requiredPlayModes||v.playModes).map(function(x){return String(x).toUpperCase();})),requiredLanguages:normalizeFinderTags_(v.requiredLanguages||v.languages),requiredTags:normalizeFinderTags_(v.requiredTags),excludedTags:normalizeFinderTags_(v.excludedTags),requiredSafetyTools:normalizeFinderTags_(v.requiredSafetyTools),requiredAccessibility:normalizeFinderTags_(v.requiredAccessibility),excludedContent:normalizeFinderTags_(v.excludedContent),scheduleDays:normalizeFinderTags_(v.scheduleDays),minimumSeats:int_(v.minimumSeats,0,0,1000)};}
function normalizeFinderPreferences_(v){v=v&&typeof v==='object'&&!Array.isArray(v)?v:{};var out={};Object.keys(v).slice(0,100).forEach(function(k){var item=v[k];if(item&&typeof item==='object'&&!Array.isArray(item))out[k]={value:item.value,weight:int_(item.weight,1,0,5),flexible:item.flexible!==false};else out[k]={value:item,weight:1,flexible:true};});return out;}
function arrayContainsAll_(hay,need){hay=array_(hay).map(lower_);need=array_(need).map(lower_);return need.every(function(x){return hay.indexOf(x)!==-1;});}
function objectTrueKeys_(obj){obj=obj&&typeof obj==='object'?obj:{};return Object.keys(obj).filter(function(k){return bool_(obj[k]);}).map(function(k){return lower_(k);});}
function scheduleDays_(obj){obj=obj&&typeof obj==='object'?obj:{};return normalizeFinderTags_(obj.days||obj.availableDays||obj.weekdays||[]);}
function radiusBandFromMiles_(miles){miles=num_(miles,0);if(miles<=5)return 'WITHIN_5_MILES';if(miles<=10)return '6_TO_10_MILES';if(miles<=25)return '11_TO_25_MILES';return '26_TO_50_MILES';}
function distanceBandFor_(miles){return miles===null||miles===undefined?'ONLINE':radiusBandFromMiles_(miles);}
function finderFreshnessState_(post){var date=post.lastReconfirmedAt||post.updatedAt||post.createdAt,days=(Date.now()-new Date(date).getTime())/86400000;if(bool_(post.isRightNow)&&post.rightNowUntil&&isPast_(post.rightNowUntil))return 'EXPIRED';if(days>TABLEGATE_V8_FINAL.STALE_LOCAL_DAYS)return 'STALE';if(days>14)return 'AGING';return 'FRESH';}
function calculateSafetyCompleteness_(p){p=p||{};var fields={safetyTools:!!Object.keys(p.safetyTools||{}).length,contentBoundaries:!!Object.keys(p.contentBoundaries||{}).length,schedule:!!Object.keys(p.schedule||{}).length,agePolicy:!!p.agePolicy,publicPlace:p.playMode!=='IN_PERSON_ONLY'||!!p.publicLocationId,accessibility:p.accessibility!==undefined};var total=Object.keys(fields).length,done=Object.keys(fields).filter(function(k){return fields[k];}).length;return {completed:fields,score:Math.round(done/total*100),notice:'Completeness is not a safety clearance.'};}
function evaluateFinderEligibility_(post,profile,viewerLocation,viewerUser){var reasons=[],distanceBand=post.playMode==='IN_PERSON_ONLY'?'': 'ONLINE',distancePoints=0;if(viewerUser&&isMinorUser_(viewerUser)&&String(post.agePolicy||'').toUpperCase().indexOf('18')!==-1)return {eligible:false,reasons:['18+ discovery is unavailable to minor accounts.'],distanceBand:'',distancePoints:0};if(post.playMode==='IN_PERSON_ONLY'){if(!viewerLocation&&viewerUser&&post.ownerId!==viewerUser.id)return {eligible:false,reasons:['A user-chosen public location is required for local results.'],distanceBand:'',distancePoints:0};if(viewerLocation&&post.ownerId!==(viewerUser&&viewerUser.id)){var anchor=byId_('PublicLocations',post.publicLocationId);if(!anchor)return {eligible:false,reasons:['Public meeting anchor is unavailable.'],distanceBand:'',distancePoints:0};var miles=haversineMiles_(num_(anchor.lat,0),num_(anchor.lng,0),num_(viewerLocation.lat,0),num_(viewerLocation.lng,0));if(miles>int_(post.radiusMiles,25))return {eligible:false,reasons:['Outside the selected public-place radius.'],distanceBand:distanceBandFor_(miles),distancePoints:0};distanceBand=distanceBandFor_(miles);distancePoints=Math.max(0,Math.round(10*(1-miles/Math.max(1,int_(post.radiusMiles,25)))));}}
  if(!profile)return {eligible:true,reasons:[],distanceBand:distanceBand,distancePoints:distancePoints};var req=normalizeFinderRequirements_(parseJsonCell_(post.requirementsJson,{})),profileReq=normalizeFinderRequirements_(parseJsonCell_(profile.requirementsJson,{})),postSystems=parseJsonCell_(post.systemIdsJson,[]),profileSystems=parseJsonCell_(profile.systemIdsJson,[]),postDesired=parseJsonCell_(post.desiredRolesJson,[]),postOffered=parseJsonCell_(post.offeredRolesJson,[]),profileOffered=parseJsonCell_(profile.offeredRolesJson,[]),profileDesired=parseJsonCell_(profile.desiredRolesJson,[]),postTags=parseJsonCell_(post.tagsJson,[]),profileTags=parseJsonCell_(profile.tagsJson,[]),postLang=parseJsonCell_(post.languagesJson,[]),profileLang=parseJsonCell_(profile.languagesJson,[]),postSafety=objectTrueKeys_(parseJsonCell_(post.safetyToolsJson,{})),profileSafety=objectTrueKeys_(parseJsonCell_(profile.safetyPreferencesJson,{})),postAccess=objectTrueKeys_(parseJsonCell_(post.accessibilityJson,{})),profileAccess=objectTrueKeys_(parseJsonCell_(profile.accessibilityJson,{})),postBound=objectTrueKeys_(parseJsonCell_(post.contentBoundariesJson,{})),profileBound=objectTrueKeys_(parseJsonCell_(profile.contentBoundariesJson,{}));
  if(req.requiredSystemIds.length&&!intersection_(req.requiredSystemIds,profileSystems).length)reasons.push('Required game system is not selected.');if(req.requiredOfferedRoles.length&&!intersection_(req.requiredOfferedRoles,profileOffered).length)reasons.push('Required participant role is not offered.');if(req.requiredPlayModes.length&&!intersection_(req.requiredPlayModes,parseJsonCell_(profile.playModesJson,[])).length)reasons.push('Required play mode is not met.');if(req.requiredLanguages.length&&!intersection_(req.requiredLanguages,profileLang).length)reasons.push('Required language is not shared.');if(req.requiredTags.length&&!arrayContainsAll_(profileTags,req.requiredTags))reasons.push('Required tags are not all present.');if(intersection_(req.excludedTags,profileTags).length)reasons.push('An excluded tag is present.');if(req.requiredSafetyTools.length&&!arrayContainsAll_(profileSafety,req.requiredSafetyTools))reasons.push('Required safety-tool preference is not met.');if(req.requiredAccessibility.length&&!arrayContainsAll_(profileAccess,req.requiredAccessibility))reasons.push('Required accessibility support is not met.');if(intersection_(req.excludedContent,profileBound).length)reasons.push('A hard content boundary conflicts.');if(req.scheduleDays.length&&!intersection_(req.scheduleDays,scheduleDays_(parseJsonCell_(profile.availabilityJson,{}))).length)reasons.push('No required schedule-day overlap.');
  if(profileReq.requiredSystemIds.length&&!intersection_(profileReq.requiredSystemIds,postSystems).length)reasons.push('The post fails your required system.');if(profileReq.requiredOfferedRoles.length&&!intersection_(profileReq.requiredOfferedRoles,postOffered.concat(postDesired)).length)reasons.push('The post fails your required role.');if(profileReq.requiredPlayModes.length&&profileReq.requiredPlayModes.indexOf(post.playMode)===-1)reasons.push('The post fails your required play mode.');if(profileReq.requiredLanguages.length&&!intersection_(profileReq.requiredLanguages,postLang).length)reasons.push('The post fails your required language.');if(profileReq.requiredTags.length&&!arrayContainsAll_(postTags,profileReq.requiredTags))reasons.push('The post fails your required tags.');if(intersection_(profileReq.excludedTags,postTags).length)reasons.push('The post contains an excluded tag.');if(profileReq.requiredSafetyTools.length&&!arrayContainsAll_(postSafety,profileReq.requiredSafetyTools))reasons.push('The post fails your required safety tools.');if(profileReq.requiredAccessibility.length&&!arrayContainsAll_(postAccess,profileReq.requiredAccessibility))reasons.push('The post fails your required accessibility support.');if(intersection_(profileReq.excludedContent,postBound).length)reasons.push('The post conflicts with a hard content boundary.');if(profileReq.scheduleDays.length&&!intersection_(profileReq.scheduleDays,scheduleDays_(parseJsonCell_(post.scheduleJson,{}))).length)reasons.push('The post fails your required schedule days.');
  return {eligible:reasons.length===0,reasons:reasons,distanceBand:distanceBand,distancePoints:distancePoints};}
function weightedPreferenceScore_(postPrefs,profilePrefs,post,profile){postPrefs=normalizeFinderPreferences_(postPrefs);profilePrefs=normalizeFinderPreferences_(profilePrefs);var points=0,reasons=[],mismatches=[];Object.keys(postPrefs).forEach(function(k){if(!profilePrefs[k])return;var a=postPrefs[k],b=profilePrefs[k],same=JSON.stringify(a.value)===JSON.stringify(b.value),weight=Math.min(5,Math.max(a.weight,b.weight));if(same){points+=weight;reasons.push('Shared preference: '+k);}else if(a.flexible&&b.flexible)mismatches.push('Flexible difference: '+k);});return {points:Math.min(10,points),reasons:reasons.slice(0,3),mismatches:mismatches.slice(0,4)};}
function hiddenDiscoverySet_(userId){var set={};filter_('HiddenDiscoveryItems',function(h){return h.userId===userId&&!h.revokedAt;}).forEach(function(h){set[h.objectType+':'+h.objectId]=true;});return set;}
function routeHideDiscoveryItem_(ctx){var type=String(ctx.params.objectType||'GROUP_FINDER_POST').toUpperCase(),id=String(ctx.params.objectId||ctx.params.postId||'');if(!id)throw new ApiError_('OBJECT_REQUIRED','Choose an item to hide.');var existing=findOne_('HiddenDiscoveryItems',function(h){return h.userId===ctx.user.id&&h.objectType===type&&h.objectId===id&&!h.revokedAt;});if(!existing)insert_('HiddenDiscoveryItems',{id:id_('hid'),userId:ctx.user.id,objectType:type,objectId:id,createdAt:nowIso_(),revokedAt:''});return {hidden:true,objectType:type,objectId:id};}
function routeUnhideDiscoveryItem_(ctx){var type=String(ctx.params.objectType||'GROUP_FINDER_POST').toUpperCase(),id=String(ctx.params.objectId||ctx.params.postId||''),existing=findOne_('HiddenDiscoveryItems',function(h){return h.userId===ctx.user.id&&h.objectType===type&&h.objectId===id&&!h.revokedAt;});if(existing)updateRow_('HiddenDiscoveryItems',existing._row,{revokedAt:nowIso_()});return {hidden:false,objectType:type,objectId:id};}
function routeCreateRightNowPost_(ctx){requireEmailVerifiedForCommunity_(ctx,'post in Group Finder');ctx.params.postType='RIGHT_NOW';ctx.params.isRightNow=true;return routeCreateGroupFinderPost_(ctx);}
function routeReconfirmGroupFinderPost_(ctx){var p=requireFinderPost_(ctx.params.postId);if(p.ownerId!==ctx.user.id)throw new ApiError_('FORBIDDEN','Only the owner may reconfirm this post.');var now=nowIso_(),patch={lastReconfirmedAt:now,freshnessState:'FRESH',updatedAt:now};if(bool_(p.isRightNow)){var mins=int_(ctx.params.rightNowMinutes,TABLEGATE_V8_FINAL.RIGHT_NOW_DEFAULT_MINUTES,15,TABLEGATE_V8_FINAL.RIGHT_NOW_MAX_MINUTES);patch.rightNowUntil=addMsIso_(mins*60000);patch.expiresAt=patch.rightNowUntil;}updateRow_('GroupFinderPosts',p._row,patch);return publicGroupFinderPost_(requireFinderPost_(p.id),ctx.user.id,null);}

function createPreGameLobby_(post,interest,actorId){var ids=[post.ownerId,interest.userId],mixed=isMinorUserId_(post.ownerId)!==isMinorUserId_(interest.userId),observer='';if(mixed){observer=approvedSafetyObserverFor_(post.tablegateId,ids);if(!observer)throw new ApiError_('SAFETY_OBSERVER_REQUIRED','A mixed adult/minor pre-game lobby requires another approved adult or guardian.');ids.push(observer);}enforceMinorSafeGroupParticipants_(ids);var now=nowIso_(),dm=insert_('DmChannels',{id:id_('dm'),type:'GROUP',pairKey:'',name:'Pre-game lobby: '+String(post.title||'TableGate').slice(0,60),iconAttachmentId:'',ownerId:post.ownerId,createdAt:now,updatedAt:now,closedAt:''});ids.forEach(function(uid,index){insert_('DmParticipants',{id:id_('dmp'),dmId:dm.id,userId:uid,role:index===0?'OWNER':(uid===observer?'SAFETY_OBSERVER':'MEMBER'),joinedAt:now,leftAt:''});});var lobby=insert_('PreGameLobbies',{id:id_('pgl'),postId:post.id,interestId:interest.id,dmId:dm.id,ownerId:post.ownerId,applicantId:interest.userId,tablegateId:post.tablegateId||'',safetyObserverId:observer,status:'OPEN',createdAt:now,updatedAt:now,closedAt:''});ids.forEach(function(uid){emitUserEvent_(uid,'PRE_GAME_LOBBY_OPENED','PRE_GAME_LOBBY',lobby.id,{lobbyId:lobby.id,dmId:dm.id,postId:post.id});});return lobby;}
function routeGetPreGameLobby_(ctx){var lobby=byId_('PreGameLobbies',ctx.params.lobbyId,true);if(!lobby)throw new ApiError_('LOBBY_NOT_FOUND','Pre-game lobby not found.');requireDm_(lobby.dmId,ctx.user.id);return {lobby:stripInternal_(lobby),dm:publicDm_(byId_('DmChannels',lobby.dmId,true),ctx.user.id),notice:'This lobby is auditable. Acceptance does not reveal external contact information or certify anyone as safe.'};}
function routeClosePreGameLobby_(ctx){var lobby=byId_('PreGameLobbies',ctx.params.lobbyId,true);if(!lobby)throw new ApiError_('LOBBY_NOT_FOUND','Pre-game lobby not found.');if([lobby.ownerId,lobby.applicantId,lobby.safetyObserverId].indexOf(ctx.user.id)===-1)throw new ApiError_('FORBIDDEN','You cannot close this lobby.');var now=nowIso_();updateRow_('PreGameLobbies',lobby._row,{status:'CLOSED',updatedAt:now,closedAt:now});var dm=byId_('DmChannels',lobby.dmId,true);if(dm)updateRow_('DmChannels',dm._row,{closedAt:now,updatedAt:now});return {closed:true,lobbyId:lobby.id};}

function requireOwnedVenue_(id,userId){var v=byId_('PublicVenueListings',id);if(!v||v.ownerId!==userId)throw new ApiError_('VENUE_NOT_FOUND','Public venue listing not found.');return v;}
function publicVenueView_(v){var loc=byId_('PublicLocations',v.publicLocationId);return {id:v.id,name:v.name,description:v.description||'',venueType:v.venueType,publicLocation:loc?publicLocationView_(loc,false):null,websiteUrl:v.websiteUrl||'',accessibility:parseJsonCell_(v.accessibilityJson,{}),safetyNotes:parseJsonCell_(v.safetyNotesJson,{}),lastReconfirmedAt:v.lastReconfirmedAt||v.updatedAt||v.createdAt,status:v.status,createdAt:v.createdAt,updatedAt:v.updatedAt};}
function routeCreatePublicVenue_(ctx){if(isMinorUser_(ctx.user))throw new ApiError_('MINOR_LOCATION_RESTRICTED','Minor accounts cannot create public venue listings.');var loc=requireOwnedPublicLocation_(ctx.params.publicLocationId,ctx.user.id),now=nowIso_(),v=insert_('PublicVenueListings',{id:id_('ven'),ownerId:ctx.user.id,publicLocationId:loc.id,name:text_(ctx.params.name||loc.label,120),description:nullableText_(ctx.params.description,2000),venueType:nullableText_(ctx.params.venueType,80)||loc.placeType,websiteUrl:ctx.params.websiteUrl?validatedHttpsUrl_(ctx.params.websiteUrl,'websiteUrl'):'',accessibilityJson:jsonCell_(ctx.params.accessibility,{},'accessibility'),safetyNotesJson:jsonCell_(ctx.params.safetyNotes,{},'safetyNotes'),lastReconfirmedAt:now,status:'ACTIVE',createdAt:now,updatedAt:now,deletedAt:''});updateRow_('PublicLocations',loc._row,{venueListingId:v.id,lastReconfirmedAt:now,updatedAt:now});return publicVenueView_(v);}
function routeListPublicVenues_(ctx){var q=lower_(ctx.params.query||''),limit=int_(ctx.params.limit,50,1,100);return filter_('PublicVenueListings',function(v){return !v.deletedAt&&v.status==='ACTIVE'&&(!q||lower_(v.name+' '+v.description+' '+v.venueType).indexOf(q)!==-1);}).sort(function(a,b){return new Date(b.lastReconfirmedAt||b.updatedAt)-new Date(a.lastReconfirmedAt||a.updatedAt);}).slice(0,limit).map(publicVenueView_);}
function routeReconfirmPublicVenue_(ctx){var v=requireOwnedVenue_(ctx.params.venueId,ctx.user.id),now=nowIso_();updateRow_('PublicVenueListings',v._row,{lastReconfirmedAt:now,updatedAt:now,status:'ACTIVE'});return publicVenueView_(byId_('PublicVenueListings',v.id));}
function publicEventView_(e){var venue=e.venueId?byId_('PublicVenueListings',e.venueId):null,loc=e.publicLocationId?byId_('PublicLocations',e.publicLocationId):null;return {id:e.id,title:e.title,description:e.description||'',tablegateId:e.tablegateId||'',venue:venue?publicVenueView_(venue):null,publicLocation:!venue&&loc?publicLocationView_(loc,false):null,startAt:e.startAt,endAt:e.endAt||'',timezone:e.timezone||'',playMode:e.playMode,systemIds:parseJsonCell_(e.systemIdsJson,[]),tags:parseJsonCell_(e.tagsJson,[]),agePolicy:e.agePolicy||'ALL_AGES_WITH_GUARDIAN_RULES',capacity:int_(e.capacity,0),status:e.status,lastReconfirmedAt:e.lastReconfirmedAt||e.updatedAt||e.createdAt,createdAt:e.createdAt,updatedAt:e.updatedAt};}
function routeCreatePublicEvent_(ctx){if(isMinorUser_(ctx.user))throw new ApiError_('MINOR_PUBLIC_EVENT_RESTRICTED','Minor accounts cannot publish public event listings.');var playMode=enumValue_(ctx.params.playMode||'IN_PERSON_ONLY',TABLEGATE.FINDER_PLAY_MODES,'IN_PERSON_ONLY','playMode'),venueId=String(ctx.params.venueId||''),locationId=String(ctx.params.publicLocationId||'');if(playMode==='IN_PERSON_ONLY'){if(venueId)requireOwnedVenue_(venueId,ctx.user.id);else requireOwnedPublicLocation_(locationId,ctx.user.id);}var tablegateId=String(ctx.params.tablegateId||'');if(tablegateId&&!hasPermission_(tablegateId,ctx.user.id,PERMISSIONS.MANAGE_TABLEGATE))throw new ApiError_('FORBIDDEN','Only a Tablegate manager may link this event.');var agePolicy=nullableText_(ctx.params.agePolicy,80)||'ALL_AGES_WITH_GUARDIAN_RULES';if(agePolicy.toUpperCase().indexOf('18')!==-1){if(!tablegateId||!bool_(requireTablegate_(tablegateId).adultOnly))throw new ApiError_('ADULT_TABLEGATE_REQUIRED','18+ events must link to an approved 18+ Tablegate.');requireAgeAssurance_(ctx.user.id,'CREATE_18_PLUS_TABLEGATE',tablegateId);}var now=nowIso_(),start=new Date(ctx.params.startAt);if(!isFinite(start.getTime()))throw new ApiError_('INVALID_START','A valid event start time is required.');var end=ctx.params.endAt?new Date(ctx.params.endAt):null;if(end&&!isFinite(end.getTime()))throw new ApiError_('INVALID_END','Event end time is invalid.');var e=insert_('PublicEvents',{id:id_('evt'),ownerId:ctx.user.id,tablegateId:tablegateId,venueId:venueId,publicLocationId:locationId,title:text_(ctx.params.title,140),description:nullableText_(ctx.params.description,3000),startAt:start.toISOString(),endAt:end?end.toISOString():'',timezone:nullableText_(ctx.params.timezone,80),playMode:playMode,systemIdsJson:jsonCell_(normalizeFinderSystems_(ctx.params.systemIds),[],'systems'),tagsJson:jsonCell_(normalizeFinderTags_(ctx.params.tags),[],'tags'),agePolicy:agePolicy,capacity:int_(ctx.params.capacity,0,0,10000),status:'SCHEDULED',lastReconfirmedAt:now,createdAt:now,updatedAt:now,deletedAt:''});return publicEventView_(e);}
function routeListPublicEvents_(ctx){var q=lower_(ctx.params.query||''),limit=int_(ctx.params.limit,50,1,100),now=Date.now();return filter_('PublicEvents',function(e){return !e.deletedAt&&['CANCELLED','COMPLETED'].indexOf(e.status)===-1&&new Date(e.startAt).getTime()>=now-86400000&&(!q||lower_(e.title+' '+e.description+' '+e.tagsJson).indexOf(q)!==-1);}).sort(function(a,b){return new Date(a.startAt)-new Date(b.startAt);}).slice(0,limit).map(publicEventView_);}

function captureMessageRevision_(message,editorId,type){var prior=filter_('MessageRevisions',function(r){return r.messageId===message.id;}).length,snapshot={messageId:message.id,scopeType:message.scopeType,scopeId:message.scopeId,tablegateId:message.tablegateId||'',authorId:message.authorId,content:message.content||'',attachmentIds:array_(message.attachmentIds),createdAt:message.createdAt,editedAt:message.editedAt||'',deletedAt:message.deletedAt||''},snap=jsonCell_(snapshot,{},'message revision');return insert_('MessageRevisions',{id:id_('mrv'),messageId:message.id,revisionNumber:prior+1,editorId:editorId||'',revisionType:type||'SNAPSHOT',content:message.content||'',attachmentIdsJson:jsonCell_(array_(message.attachmentIds),[],'revision attachments'),snapshotJson:snap,integrityHash:sha256Hex_(snap),createdAt:nowIso_()});}
function canAccessMessageForSafety_(message,userId){if(message.authorId===userId)return true;if(message.scopeType==='DM')return !!findOne_('DmParticipants',function(p){return p.dmId===message.scopeId&&p.userId===userId;});if(message.scopeType==='CHANNEL'){var ch=byId_('Channels',message.scopeId,true);if(!ch)return false;return !!findOne_('Members',function(m){return m.tablegateId===ch.tablegateId&&m.userId===userId;});}return false;}
function severBlockedContact_(a,b){var dm=findOne_('DmChannels',function(d){return d.type==='DIRECT'&&d.pairKey===pairKey_(a,b);});if(dm){filter_('DmParticipants',function(p){return p.dmId===dm.id&&!p.leftAt;}).forEach(function(p){updateRow_('DmParticipants',p._row,{leftAt:nowIso_()});});updateRow_('DmChannels',dm._row,{closedAt:nowIso_(),updatedAt:nowIso_()});}filter_('GroupFinderInterests',function(i){var p=byId_('GroupFinderPosts',i.postId,true);return p&&((i.userId===a&&p.ownerId===b)||(i.userId===b&&p.ownerId===a))&&['SENT','ACCEPTED'].indexOf(i.status)!==-1;}).forEach(function(i){updateRow_('GroupFinderInterests',i._row,{status:'WITHDRAWN',updatedAt:nowIso_()});});return true;}

function severityForSafety_(category,urgency,immediate){category=String(category||'').toUpperCase();urgency=String(urgency||'').toUpperCase();if(immediate||['IMMEDIATE_DANGER','CHILD_IMMEDIATE_RISK','SEXUAL_EXPLOITATION_OR_GROOMING'].indexOf(urgency)!==-1||['SUSPECTED_CHILD_SEXUAL_EXPLOITATION_MATERIAL','CHILD_SAFETY_OR_GROOMING','SEXTORTION_OR_INTIMATE_IMAGE_ABUSE','THREAT_OF_VIOLENCE'].indexOf(category)!==-1)return 'CRITICAL';if(['CREDIBLE_THREAT_OR_STALKING','SERIOUS_NOT_IMMEDIATE'].indexOf(urgency)!==-1||['SEXUAL_HARASSMENT','COERCION_OR_ABUSE_OF_AUTHORITY','STALKING_OR_BLOCK_EVASION','DOXXING_OR_LOCATION_EXPOSURE','RETALIATION','EVIDENCE_DELETION_OR_COVER_UP','MODERATOR_ADMIN_OWNER_OR_HOST_MISCONDUCT'].indexOf(category)!==-1)return 'HIGH';return 'STANDARD';}
function safetyPriority_(r){var sev=r.severity||severityForSafety_(r.category,r.urgency,bool_(r.immediateDanger));return sev==='CRITICAL'?300:sev==='HIGH'?200:100;}
function isSafetyReviewerId_(userId){if(!userId)return false;var u=byId_('Users',userId,true);return !!u&&isSafetyReviewer_(u);}
function addSafetyCaseUpdate_(reportId,actorId,actorType,type,message,metadata,visible){return insert_('SafetyCaseUpdates',{id:id_('scu'),reportId:reportId,actorId:actorId||'',actorType:actorType||'SYSTEM',updateType:enumValue_(type,TABLEGATE_V8_FINAL.CASE_UPDATE_TYPES,'REPORTER_NOTE','case update type'),message:nullableText_(message,4000),metadataJson:jsonCell_(metadata,{},'case update metadata'),visibleToReporter:visible!==false,createdAt:nowIso_()});}
function listSafetyCaseUpdates_(reportId,viewerId){var report=byId_('SafetyReports',reportId,true),reviewer=isSafetyReviewerId_(viewerId);return filter_('SafetyCaseUpdates',function(u){return u.reportId===reportId&&(reviewer||bool_(u.visibleToReporter));}).map(function(u){return {id:u.id,updateType:u.updateType,message:u.message||'',metadata:parseJsonCell_(u.metadataJson,{}),createdAt:u.createdAt};});}
function evidenceAccessLog_(reportId,evidenceId,actorId,action,reason,exportRef){insert_('SafetyEvidenceAccess',{id:id_('sea'),reportId:reportId,evidenceId:evidenceId||'',actorId:actorId||'',action:action||'VIEW',reason:nullableText_(reason,500),exportReference:exportRef||'',createdAt:nowIso_()});}
function listSafetyEvidenceForViewer_(reportId,viewerId,action){var report=byId_('SafetyReports',reportId,true);if(!report)throw new ApiError_('SAFETY_REPORT_NOT_FOUND','Safety report not found.');if(report.reporterId!==viewerId&&!isSafetyReviewerId_(viewerId))throw new ApiError_('FORBIDDEN','You cannot access this evidence.');var items=listSafetyEvidence_(reportId);items.forEach(function(e){evidenceAccessLog_(reportId,e.id,viewerId,action||'VIEW','Authorized case access','');});return items;}
function redactEvidenceForExport_(e){var out=clone_(e);if(out.quarantined){out.snapshot={notice:'Quarantined suspected illegal material is excluded from user-facing exports.',sourceId:out.sourceId,integrityHash:out.integrityHash};}else if(out.snapshot&&out.snapshot.originalName){out.snapshot={attachmentId:out.snapshot.attachmentId,originalName:out.snapshot.originalName,mimeType:out.snapshot.mimeType,sizeBytes:out.snapshot.sizeBytes,sha256:out.snapshot.sha256,createdAt:out.snapshot.createdAt,holdUntil:out.snapshot.holdUntil};}return out;}
function snapshotReportableObject_(type,id,reporterId){type=String(type||'').toUpperCase();id=String(id||'');if(!type||!id)return null;var obj=null;if(type==='USER')obj=byId_('Users',id,true)?publicUser_(byId_('Users',id,true)):null;else if(type==='PROFILE'){var p=findOne_('DiscoveryProfiles',function(x){return x.id===id||x.userId===id;});obj=p?publicDiscoveryProfile_(p,false):null;}else if(['DISCOVERY_CARD','GROUP_FINDER_POST','RIGHT_NOW_POST'].indexOf(type)!==-1){var post=byId_('GroupFinderPosts',id,true);obj=post?publicGroupFinderPost_(post,reporterId,null):null;}else if(type==='GROUP_FINDER_INTEREST'){var interest=byId_('GroupFinderInterests',id,true);obj=interest?{id:interest.id,postId:interest.postId,userId:interest.userId,message:interest.message,status:interest.status,createdAt:interest.createdAt}:null;}else if(type==='ATTACHMENT'||type==='IMAGE'){var a=byId_('Attachments',id,true);obj=a?{id:a.id,ownerId:a.ownerId,tablegateId:a.tablegateId||'',dmId:a.dmId||'',messageId:a.messageId||'',originalName:a.originalName,mimeType:a.mimeType,sizeBytes:a.sizeBytes,sha256:a.sha256,createdAt:a.createdAt}:null;}else if(type==='PUBLIC_EVENT'){var e=byId_('PublicEvents',id,true);obj=e?publicEventView_(e):null;}else if(type==='PUBLIC_VENUE'){var v=byId_('PublicVenueListings',id,true);obj=v?publicVenueView_(v):null;}else if(type==='TABLEGATE'){var t=byId_('Tablegates',id,true);obj=t?publicTablegateCard_(t,reporterId):null;}else if(type==='MODERATOR_ACTION'||type==='ROLE_ASSIGNMENT'||type==='OWNERSHIP_TRANSFER'){var aud=byId_('AuditLog',id,true);obj=aud?stripInternal_(aud):null;}else if(type==='VOICE_SESSION'||type==='VIDEO_SESSION'){var voice=byId_('VoiceStates',id,true);obj=voice?stripInternal_(voice):null;}return obj;}
function reportedUserIsLocalLeader_(tablegateId,userId){if(!tablegateId||!userId)return false;var t=byId_('Tablegates',tablegateId,true);return !!t&&(t.ownerId===userId||isTablegateAdmin_(tablegateId,userId));}
function createSafetyReportCore_(reporter,p,anonymous){p=p||{};var reporterId=reporter?reporter.id:'',reportedUserId=String(p.reportedUserId||p.userId||''),reportedUser=reportedUserId?byId_('Users',reportedUserId,true):null;if(reportedUserId&&!reportedUser)throw new ApiError_('USER_NOT_FOUND','Reported user not found.');if(reporterId&&reportedUserId===reporterId)throw new ApiError_('INVALID_SAFETY_REPORT','You cannot report your own account.');var tablegateId=String(p.tablegateId||''),scopeType=String(p.scopeType||p.objectType||'').toUpperCase(),scopeId=String(p.scopeId||p.objectId||'');if(scopeType&&TABLEGATE_V8_FINAL.REPORTABLE_OBJECTS.indexOf(scopeType)===-1)throw new ApiError_('INVALID_REPORT_OBJECT','Unsupported report object type.');var category=enumValue_(p.category||'OTHER',TABLEGATE.SAFETY_REPORT_CATEGORIES,'OTHER','safety report category'),summary=text_(p.summary,300),details=nullableText_(p.details,8000),messageIds=unique_(array_(p.messageIds).map(String)).slice(0,100),snapshot=reporterId?safetyEvidenceForMessages_(messageIds,reporterId,reportedUserId):{messages:[],attachmentIds:[]},attachmentIds=unique_(array_(p.attachmentIds).map(String).concat(snapshot.attachmentIds)).slice(0,100),now=nowIso_(),preservationUntil=addMsIso_(TABLEGATE.SAFETY_EVIDENCE_HOLD_DAYS*86400000),held=reporterId?holdSafetyAttachments_(attachmentIds,reporterId,preservationUntil):[],objectSnapshot=snapshotReportableObject_(scopeType,scopeId,reporterId),urgency=enumValue_(p.urgency||(bool_(p.immediateDanger)?'IMMEDIATE_DANGER':'GENERAL_POLICY_VIOLATION'),TABLEGATE_V8_FINAL.SAFETY_URGENCY,'GENERAL_POLICY_VIOLATION','urgency'),severity=severityForSafety_(category,urgency,bool_(p.immediateDanger)),centralOnly=reportedUserIsLocalLeader_(tablegateId,reportedUserId)||['CHILD_SAFETY_OR_GROOMING','SUSPECTED_CHILD_SEXUAL_EXPLOITATION_MATERIAL','MODERATOR_ADMIN_OWNER_OR_HOST_MISCONDUCT'].indexOf(category)!==-1,evidence={capturedAt:now,reporter:reporter?{id:reporter.id,displayTag:reporter.username+'#'+reporter.discriminator}:{anonymous:true},reportedUser:reportedUser?{id:reportedUser.id,displayTag:reportedUser.username+'#'+reportedUser.discriminator}:null,messageCount:snapshot.messages.length,attachmentCount:held.length,objectSnapshot:objectSnapshot,notes:'Evidence items are stored separately. Age assurance is not required for reporting.'};var report=insert_('SafetyReports',{id:id_('safe'),reporterId:reporterId,reportedUserId:reportedUserId,tablegateId:tablegateId,scopeType:scopeType,scopeId:scopeId,category:category,summary:summary,details:details,messageIdsJson:JSON.stringify(messageIds),attachmentIdsJson:JSON.stringify(attachmentIds),evidenceJson:jsonCell_(evidence,{},'safety evidence'),immediateDanger:bool_(p.immediateDanger),status:'SUBMITTED',policeReportNumber:'',lawEnforcementAgency:'',preservationUntil:preservationUntil,createdAt:now,updatedAt:now,reviewedAt:'',reviewedBy:'',reporterRole:enumValue_(p.reporterRole||(anonymous?'ANONYMOUS_OR_NO_ACCOUNT':'AFFECTED_PERSON'),TABLEGATE_V8_FINAL.REPORTER_ROLES,anonymous?'ANONYMOUS_OR_NO_ACCOUNT':'AFFECTED_PERSON','reporter role'),urgency:urgency,safeContactJson:jsonCell_(p.safeContact,{},'safe contact'),supportPersonJson:jsonCell_(p.supportPerson,{},'support person'),anonymousContactHash:anonymous&&p.contact?sha256Hex_(lower_(p.contact)):'',linkedReportId:String(p.linkedReportId||''),centralOnly:centralOnly,severity:severity,findingOutcome:'',protectiveActionsJson:'[]',holdActive:true,lastStatusAt:now});storeSafetyEvidence_(report.id,'MESSAGE',snapshot.messages);storeSafetyEvidence_(report.id,'ATTACHMENT',held);if(objectSnapshot)storeSafetyEvidence_(report.id,'OBJECT',[{id:scopeId,type:scopeType,snapshot:objectSnapshot}]);if(category==='SUSPECTED_CHILD_SEXUAL_EXPLOITATION_MATERIAL')storeSafetyEvidence_(report.id,'SUSPECTED_CSAM',[{id:scopeId,type:scopeType,notice:'Referenced platform object quarantined for authorized review; users are not asked to copy or re-upload material.'}]);addSafetyCaseUpdate_(report.id,reporterId,anonymous?'ANONYMOUS':'REPORTER','REPORT_SUBMITTED','Safety report submitted.',{severity:severity,centralOnly:centralOnly},true);notifySafetyReviewers_(report);if(tablegateId)try{audit_(tablegateId,reporterId||'anonymous','SAFETY_REPORT_SUBMITTED','SAFETY_REPORT',report.id,{category:category,reportedUserId:reportedUserId,immediateDanger:bool_(p.immediateDanger),centralOnly:centralOnly});}catch(e){}return {report:publicSafetyReport_(report,false,reporterId),guidance:safetyReportingGuidance_(bool_(p.immediateDanger)),caseReference:report.id};}
function routeReportSafetyObject_(ctx){return createSafetyReportCore_(ctx.user,ctx.params,false);}
function routeReportSafetyAnonymous_(ctx){return createSafetyReportCore_(null,ctx.params,true);}
function routeAddSafetyCaseUpdate_(ctx){var r=requireVisibleSafetyReport_(ctx.params.reportId,ctx.user),type=String(ctx.params.updateType||'REPORTER_NOTE').toUpperCase();if(type==='RETALIATION_REPORTED'){type='RETALIATION_REPORTED';if(!ctx.params.linkedReportId)ctx.params.linkedReportId=r.id;}var u=addSafetyCaseUpdate_(r.id,ctx.user.id,r.reporterId===ctx.user.id?'REPORTER':'REVIEWER',type,ctx.params.message,{linkedObjects:array_(ctx.params.linkedObjects),linkedReportId:String(ctx.params.linkedReportId||'')},true);if(type==='RETALIATION_REPORTED')notifySafetyReviewers_(r);return stripInternal_(u);}
function routeUpdateSafetySafeContact_(ctx){var r=requireVisibleSafetyReport_(ctx.params.reportId,ctx.user);if(r.reporterId!==ctx.user.id)throw new ApiError_('FORBIDDEN','Only the reporter can change safe-contact settings.');updateRow_('SafetyReports',r._row,{safeContactJson:jsonCell_(ctx.params.safeContact,{},'safe contact'),supportPersonJson:jsonCell_(ctx.params.supportPerson,{},'support person'),updatedAt:nowIso_()});addSafetyCaseUpdate_(r.id,ctx.user.id,'REPORTER','SAFE_CONTACT_UPDATED','Safe-contact preferences updated.',{},true);return publicSafetyReport_(byId_('SafetyReports',r.id,true),false,ctx.user.id);}
function routeCreateIncidentJournal_(ctx){var now=nowIso_(),j=insert_('IncidentJournals',{id:id_('inj'),userId:ctx.user.id,title:nullableText_(ctx.params.title,140)||'Private incident timeline',status:'PRIVATE',safeContactJson:jsonCell_(ctx.params.safeContact,{},'safe contact'),createdAt:now,updatedAt:now,deletedAt:''});return stripInternal_(j);}
function requireIncidentJournal_(id,userId){var j=byId_('IncidentJournals',id);if(!j||j.userId!==userId)throw new ApiError_('INCIDENT_JOURNAL_NOT_FOUND','Private incident timeline not found.');return j;}
function routeAddIncidentEntry_(ctx){var j=requireIncidentJournal_(ctx.params.journalId,ctx.user.id),now=nowIso_(),entry=insert_('IncidentEntries',{id:id_('ine'),journalId:j.id,userId:ctx.user.id,occurredAt:ctx.params.occurredAt?new Date(ctx.params.occurredAt).toISOString():now,peopleJson:jsonCell_(ctx.params.people,[],'people'),rolesJson:jsonCell_(ctx.params.roles,[],'roles'),tablegateId:String(ctx.params.tablegateId||''),locationText:nullableText_(ctx.params.locationText,300),narrative:text_(ctx.params.narrative,8000),linkedObjectsJson:jsonCell_(ctx.params.linkedObjects,[],'linked objects'),attachmentIdsJson:jsonCell_(ctx.params.attachmentIds,[],'attachments'),witnessesJson:jsonCell_(ctx.params.witnesses,[],'witnesses'),boundaryText:nullableText_(ctx.params.boundaryText,2000),responseText:nullableText_(ctx.params.responseText,2000),impactText:nullableText_(ctx.params.impactText,2000),requestedOutcome:nullableText_(ctx.params.requestedOutcome,2000),createdAt:now,updatedAt:now,deletedAt:''});updateRow_('IncidentJournals',j._row,{updatedAt:now});return stripInternal_(entry);}
function routeListIncidentJournals_(ctx){return filter_('IncidentJournals',function(j){return j.userId===ctx.user.id&&!j.deletedAt;}).map(function(j){var count=filter_('IncidentEntries',function(e){return e.journalId===j.id&&!e.deletedAt;}).length;return {id:j.id,title:j.title,status:j.status,entryCount:count,createdAt:j.createdAt,updatedAt:j.updatedAt};});}
function routeGetIncidentJournal_(ctx){var j=requireIncidentJournal_(ctx.params.journalId,ctx.user.id),entries=filter_('IncidentEntries',function(e){return e.journalId===j.id&&!e.deletedAt;}).sort(function(a,b){return new Date(a.occurredAt)-new Date(b.occurredAt);}).map(stripInternal_);return {journal:stripInternal_(j),entries:entries,privacy:'Visible only to you unless you submit selected entries as a safety report.'};}
function routeConvertIncidentJournalToReport_(ctx){var j=requireIncidentJournal_(ctx.params.journalId,ctx.user.id),ids=unique_(array_(ctx.params.entryIds).map(String)),entries=filter_('IncidentEntries',function(e){return e.journalId===j.id&&!e.deletedAt&&(!ids.length||ids.indexOf(e.id)!==-1);});if(!entries.length)throw new ApiError_('NO_INCIDENT_ENTRIES','Select at least one incident entry.');var details=entries.map(function(e){return '['+e.occurredAt+'] '+e.narrative;}).join('\n\n').slice(0,8000),linked=[];entries.forEach(function(e){linked=linked.concat(parseJsonCell_(e.linkedObjectsJson,[]));});var params=clone_(ctx.params);params.details=params.details||details;params.summary=params.summary||j.title;params.messageIds=unique_(array_(params.messageIds).concat(linked.filter(function(x){return x.type==='MESSAGE';}).map(function(x){return x.id;})));var result=createSafetyReportCore_(ctx.user,params,false);updateRow_('IncidentJournals',j._row,{status:'SUBMITTED',updatedAt:nowIso_()});return result;}
function routeExportIncidentJournal_(ctx){var data=routeGetIncidentJournal_(ctx);return {exportedAt:nowIso_(),title:data.journal.title,entries:data.entries.map(function(e){return {occurredAt:e.occurredAt,people:parseJsonCell_(e.peopleJson,[]),roles:parseJsonCell_(e.rolesJson,[]),tablegateId:e.tablegateId||'',locationText:e.locationText||'',narrative:e.narrative,boundaryText:e.boundaryText||'',responseText:e.responseText||'',impactText:e.impactText||'',requestedOutcome:e.requestedOutcome||''};}),notice:'Redacted private timeline. Attachments and illegal imagery are not embedded.'};}
function routeSubmitSafetyAppeal_(ctx){var report=byId_('SafetyReports',ctx.params.reportId,true);if(!report)throw new ApiError_('SAFETY_REPORT_NOT_FOUND','Safety report not found.');var actionId=String(ctx.params.actionId||''),action=actionId?byId_('GlobalSafetyActions',actionId,true):null;if(report.reportedUserId!==ctx.user.id&&(!action||action.subjectUserId!==ctx.user.id))throw new ApiError_('FORBIDDEN','Only the affected account may appeal this action.');var existing=findOne_('SafetyAppeals',function(a){return a.reportId===report.id&&a.appellantId===ctx.user.id&&['SUBMITTED','UNDER_REVIEW'].indexOf(a.status)!==-1;});if(existing)return stripInternal_(existing);var now=nowIso_(),appeal=insert_('SafetyAppeals',{id:id_('apl'),reportId:report.id,appellantId:ctx.user.id,actionId:actionId,reason:text_(ctx.params.reason,5000),evidenceJson:jsonCell_(ctx.params.evidence,{},'appeal evidence'),status:'SUBMITTED',reviewedBy:'',decision:'',createdAt:now,updatedAt:now,reviewedAt:''});updateRow_('SafetyReports',report._row,{status:'APPEALED',updatedAt:now,lastStatusAt:now});addSafetyCaseUpdate_(report.id,ctx.user.id,'APPELLANT','APPEAL_SUBMITTED','An appeal was submitted.',{appealId:appeal.id},false);notifySafetyReviewers_(report);return stripInternal_(appeal);}
function routeListMySafetyAppeals_(ctx){return filter_('SafetyAppeals',function(a){return a.appellantId===ctx.user.id;}).sort(function(a,b){return new Date(b.createdAt)-new Date(a.createdAt);}).map(stripInternal_);}
function routeReviewSafetyAppeal_(ctx){requireSafetyReviewer_(ctx.user);var a=byId_('SafetyAppeals',ctx.params.appealId,true);if(!a)throw new ApiError_('APPEAL_NOT_FOUND','Appeal not found.');var status=enumValue_(ctx.params.status,TABLEGATE_V8_FINAL.APPEAL_STATUSES,a.status,'appeal status'),now=nowIso_();updateRow_('SafetyAppeals',a._row,{status:status,reviewedBy:ctx.user.id,decision:nullableText_(ctx.params.decision,5000),updatedAt:now,reviewedAt:now});addSafetyCaseUpdate_(a.reportId,ctx.user.id,'APPEAL_REVIEWER','APPEAL_DECIDED','Appeal decision recorded.',{appealId:a.id,status:status},false);return stripInternal_(byId_('SafetyAppeals',a.id,true));}
function activeCentralActionsForUser_(userId){var now=Date.now();return filter_('GlobalSafetyActions',function(a){return a.subjectUserId===userId&&a.status==='ACTIVE'&&!a.revokedAt&&(!a.startsAt||new Date(a.startsAt).getTime()<=now)&&(!a.expiresAt||new Date(a.expiresAt).getTime()>now);});}
function publicCentralSafetyAction_(a){return {id:a.id,reportId:a.reportId||'',targetType:a.targetType,targetId:a.targetId,actionType:a.actionType,reason:a.reason||'',status:a.status,startsAt:a.startsAt||'',expiresAt:a.expiresAt||'',createdAt:a.createdAt};}
function enforceCentralSafetyAccess_(ctx){var actions=activeCentralActionsForUser_(ctx.user.id);if(!actions.length)return;var allowed={logout:true,logoutAll:true,me:true,getSafetyReportingInfo:true,listMySafetyReports:true,getSafetyReport:true,addSafetyCaseUpdate:true,updateSafetySafeContact:true,submitSafetyAppeal:true,listMySafetyAppeals:true,blockUser:true,listSafety:true};var blocking=actions.filter(function(a){return ['TEMPORARY_ACCOUNT_SUSPENSION','PERMANENT_ACCOUNT_BAN'].indexOf(a.actionType)!==-1;});if(blocking.length&&!allowed[ctx.action])throw new ApiError_('CENTRAL_SAFETY_RESTRICTION','This account is restricted by central Trust and Safety.',{actions:blocking.map(publicCentralSafetyAction_),appealAction:'submitSafetyAppeal'});if(actions.some(function(a){return a.actionType==='DM_RESTRICTION';})&&['createDm','createGroupDm','sendMessage','startCall'].indexOf(ctx.action)!==-1)throw new ApiError_('DM_RESTRICTED','Direct communication is restricted by central Trust and Safety.');if(actions.some(function(a){return a.actionType==='DISCOVERY_REMOVAL'||a.actionType==='RIGHT_NOW_SUSPENSION';})&&['upsertDiscoveryProfile','createGroupFinderPost','createRightNowPost','expressGroupFinderInterest'].indexOf(ctx.action)!==-1)throw new ApiError_('DISCOVERY_RESTRICTED','Discovery access is restricted by central Trust and Safety.');}
function routeApplyCentralSafetyAction_(ctx){requireSafetyReviewer_(ctx.user);var report=byId_('SafetyReports',ctx.params.reportId,true);if(!report)throw new ApiError_('SAFETY_REPORT_NOT_FOUND','Safety report not found.');var actionType=enumValue_(ctx.params.actionType,TABLEGATE_V8_FINAL.PROTECTIVE_ACTIONS,'NO_CONTACT_ORDER','protective action'),subject=String(ctx.params.subjectUserId||report.reportedUserId||''),targetType=String(ctx.params.targetType||'USER').toUpperCase(),targetId=String(ctx.params.targetId||subject),now=nowIso_(),expires=ctx.params.expiresAt?new Date(ctx.params.expiresAt).toISOString():'';var action=insert_('GlobalSafetyActions',{id:id_('gsa'),reportId:report.id,subjectUserId:subject,targetType:targetType,targetId:targetId,actionType:actionType,reason:nullableText_(ctx.params.reason,2000),status:'ACTIVE',startsAt:now,expiresAt:expires,createdBy:ctx.user.id,createdAt:now,updatedAt:now,revokedAt:'',revokedBy:'',metadataJson:jsonCell_(ctx.params.metadata,{},'safety action metadata')});var current=unique_(parseJsonCell_(report.protectiveActionsJson,[]).concat([actionType]));updateRow_('SafetyReports',report._row,{status:'PROTECTIVE_ACTION',protectiveActionsJson:jsonCell_(current,[],'protective actions'),updatedAt:now,lastStatusAt:now});addSafetyCaseUpdate_(report.id,ctx.user.id,'REVIEWER','PROTECTIVE_ACTION','Protective action applied.',{actionId:action.id,actionType:actionType,targetType:targetType,targetId:targetId},true);if(actionType==='NO_CONTACT_ORDER'&&subject&&report.reporterId)setSafetyRelation_(report.reporterId,subject,'BLOCK',true);createNotification_(report.reporterId,'SAFETY_PROTECTIVE_ACTION',ctx.user.id,'SAFETY_REPORT',report.id,'',{actionType:actionType});return publicCentralSafetyAction_(action);}
function routeRevokeCentralSafetyAction_(ctx){requireSafetyReviewer_(ctx.user);var a=byId_('GlobalSafetyActions',ctx.params.actionId,true);if(!a)throw new ApiError_('SAFETY_ACTION_NOT_FOUND','Safety action not found.');var now=nowIso_();updateRow_('GlobalSafetyActions',a._row,{status:'REVOKED',revokedAt:now,revokedBy:ctx.user.id,updatedAt:now});addSafetyCaseUpdate_(a.reportId,ctx.user.id,'REVIEWER','PROTECTIVE_ACTION','Protective action revoked.',{actionId:a.id,actionType:a.actionType},true);return {revoked:true,actionId:a.id};}
function routeListCentralSafetyActions_(ctx){requireSafetyReviewer_(ctx.user);var userId=String(ctx.params.userId||''),reportId=String(ctx.params.reportId||'');return filter_('GlobalSafetyActions',function(a){return(!userId||a.subjectUserId===userId)&&(!reportId||a.reportId===reportId);}).sort(function(a,b){return new Date(b.createdAt)-new Date(a.createdAt);}).map(publicCentralSafetyAction_);}
function assertNoTablegateSafetyFreeze_(tablegateId,operation){var freeze=findOne_('GlobalSafetyActions',function(a){return a.status==='ACTIVE'&&!a.revokedAt&&a.actionType==='GROUP_ADMIN_FREEZE'&&a.targetType==='TABLEGATE'&&a.targetId===tablegateId&&(!a.expiresAt||isFuture_(a.expiresAt));});if(freeze)throw new ApiError_('SAFETY_ADMIN_FREEZE','This action is temporarily frozen for a central safety review.',{operation:operation,actionId:freeze.id});}
function recordPotentialRetaliation_(tablegateId,actorId,targetId,action){var reports=filter_('SafetyReports',function(r){return r.tablegateId===tablegateId&&r.reporterId===targetId&&['CLOSED'].indexOf(r.status)===-1;});reports.forEach(function(r){if(actorId===r.reportedUserId||reportedUserIsLocalLeader_(tablegateId,actorId)){addSafetyCaseUpdate_(r.id,actorId,'SYSTEM','POTENTIAL_RETALIATION','A role or membership action affecting the reporter was logged for central review.',{action:action,targetUserId:targetId,actorId:actorId},false);notifySafetyReviewers_(r);}});}
function routeGetSafetyTransparency_(ctx){var reports=rows_('SafetyReports'),appeals=rows_('SafetyAppeals'),actions=rows_('GlobalSafetyActions'),bySeverity={},byStatus={};reports.forEach(function(r){var s=r.severity||severityForSafety_(r.category,r.urgency,bool_(r.immediateDanger));bySeverity[s]=(bySeverity[s]||0)+1;byStatus[r.status]=(byStatus[r.status]||0)+1;});return {generatedAt:nowIso_(),aggregateOnly:true,totalReports:reports.length,reportsBySeverity:bySeverity,reportsByStatus:byStatus,totalProtectiveActions:actions.length,totalAppeals:appeals.length,appealsResolved:appeals.filter(function(a){return ['UPHELD','MODIFIED','OVERTURNED','CLOSED'].indexOf(a.status)!==-1;}).length,notice:'No victim, reporter, accused person, or case-identifying detail is included.'};}
function routeGetTablegatePlatformPolicy_(ctx){return {product:'TableGate',access:{completelyFree:true,noSubscriptions:true,noPremiumMatching:true,noPaidMessages:true,noPaidBoosts:true,noPaidSafetyControls:true,noFeesToCreateJoinOwnOrAdminister:true},discovery:{hardDealbreakersBeforeScoring:true,explainableCompatibility:true,chronologicalFeed:true,rightNowFree:true,exactDistancePublic:false,homeAddressesPublic:false},safety:{zeroTolerance:true,roleNeutrality:true,centralSafetyOverridesLocalOwnership:true,reportWithoutAgeVerification:true,anonymousReports:true,privateIncidentJournal:true,evidenceRevisionHistory:true,antiRetaliation:true,appeals:true},ageAssurance:{onlyForCreatingOrJoining18Plus:true,rawIdStored:false},minorSafety:{broadPublicDiscoveryDefault:false,adultMinorDirectDm:false,adultFacingRightNow:false,localRadiusCards:false,confirmedGuardianLinks:true},personalSafety:{trustedContacts:true,publicEventCheckIns:true,liveLocationShared:false},nudges:TABLEGATE_V8_FINAL.SAFETY_NUDGES};}

var ROUTES_ = Object.freeze({
  health:{fn:routeHealth_,auth:false,write:false},
  getTablegatePlatformPolicy:{fn:routeGetTablegatePlatformPolicy_,auth:false,write:false},getSafetyTransparency:{fn:routeGetSafetyTransparency_,auth:false,write:false},reportSafetyAnonymous:{fn:routeReportSafetyAnonymous_,auth:false,write:true},

  capabilities:{fn:routeCapabilities_,auth:false,write:false},getPwaManifest:{fn:routeGetPwaManifest_,auth:false,write:false},getInstallConfig:{fn:routeGetInstallConfig_,auth:false,write:false},
  browsePublicTablegates:{fn:routeBrowsePublicTablegates_,auth:false,write:false},browseGroupFinderPosts:{fn:routeBrowseGroupFinderPosts_,auth:false,write:false},
  getAgeAssuranceOptions:{fn:routeGetAgeAssuranceOptions_,auth:false,write:false},ageAssuranceCallback:{fn:routeAgeAssuranceCallback_,auth:false,write:true},getSafetyReportingInfo:{fn:routeGetSafetyReportingInfo_,auth:false,write:false},
  requestEmailVerification:{fn:routeRequestEmailVerification_,auth:false,write:true},verifyEmail:{fn:routeVerifyEmail_,auth:false,write:true},forgotPassword:{fn:routeForgotPassword_,auth:false,write:true},resetPassword:{fn:routeResetPassword_,auth:false,write:true},verifyTwoFactor:{fn:routeVerifyTwoFactor_,auth:false,write:true},requestPhoneVerification:{fn:routeRequestPhoneVerification_,write:true},verifyPhone:{fn:routeVerifyPhone_,write:true},getTwoFactor:{fn:routeGetTwoFactor_,write:false},setTwoFactor:{fn:routeSetTwoFactor_,write:true},resendTwoFactor:{fn:routeResendTwoFactor_,auth:false,write:true},
  createAiConversation:{fn:routeCreateAiConversation_,write:true},listAiConversations:{fn:routeListAiConversations_,write:false},getAiConversation:{fn:routeGetAiConversation_,write:false},updateAiConversation:{fn:routeUpdateAiConversation_,write:true},deleteAiConversation:{fn:routeDeleteAiConversation_,write:true},sendAiMessage:{fn:routeSendAiMessage_,write:true},smartAsk:{fn:routeSmartAsk_,write:true},
  createMemory:{fn:routeCreateMemory_,write:true},listMemory:{fn:routeListMemory_,write:false},searchMemory:{fn:routeSearchMemory_,write:false},updateMemory:{fn:routeUpdateMemory_,write:true},deleteMemory:{fn:routeDeleteMemory_,write:true},
  createPersonality:{fn:routeCreatePersonality_,write:true},listPersonalities:{fn:routeListPersonalities_,write:false},updatePersonality:{fn:routeUpdatePersonality_,write:true},deletePersonality:{fn:routeDeletePersonality_,write:true},submitLearningFeedback:{fn:routeSubmitLearningFeedback_,write:true},
  ingestKnowledge:{fn:routeIngestKnowledge_,write:true},listKnowledge:{fn:routeListKnowledge_,write:false},searchKnowledge:{fn:routeSearchKnowledge_,write:false},deleteKnowledge:{fn:routeDeleteKnowledge_,write:true},createCitation:{fn:routeCreateCitation_,write:true},listCitations:{fn:routeListCitations_,write:false},
  webSearch:{fn:routeWebSearch_,write:true},imageSearch:{fn:routeImageSearch_,write:true},generateImage:{fn:routeGenerateImage_,write:true},generateFromReferences:{fn:routeGenerateFromReferences_,write:true},parseAttachment:{fn:routeParseAttachment_,write:false},
  listSharedLibrary:{fn:routeListSharedLibrary_,write:false},getSharedLibraryFile:{fn:routeGetSharedLibraryFile_,write:false},createAssetFolder:{fn:routeCreateAssetFolder_,write:true},listAssetFolders:{fn:routeListAssetFolders_,write:false},organizeAttachment:{fn:routeOrganizeAttachment_,write:true},listAssets:{fn:routeListAssets_,write:false},searchAssets:{fn:routeSearchAssets_,write:false},
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
  logout:{fn:routeLogout_,write:true},setMyAgeBand:{fn:routeSetMyAgeBand_,write:true},completeSafetyOrientation:{fn:routeCompleteSafetyOrientation_,write:true},logoutAll:{fn:routeLogoutAll_,write:true},me:{fn:routeMe_,write:false},updateProfile:{fn:routeUpdateProfile_,write:true},changePassword:{fn:routeChangePassword_,write:true},previewAccountDeletion:{fn:routePreviewAccountDeletion_,write:false},deleteAccount:{fn:routeDeleteAccount_,write:true},searchUsers:{fn:routeSearchUsers_,write:false},getClientConfig:{fn:routeGetClientConfig_,write:false},
  listTablegates:{fn:routeListTablegates_,write:false},discoverTablegates:{fn:routeDiscoverTablegates_,write:false},createTablegate:{fn:routeCreateTablegate_,write:true},getTablegate:{fn:routeGetTablegate_,write:false},updateTablegate:{fn:routeUpdateTablegate_,write:true},deleteTablegate:{fn:routeDeleteTablegate_,write:true},leaveTablegate:{fn:routeLeaveTablegate_,write:true},transferOwnership:{fn:routeTransferOwnership_,write:true},joinPublicTablegate:{fn:routeJoinPublicTablegate_,write:true},requestTablegateJoin:{fn:routeRequestTablegateJoin_,write:true},listTablegateJoinRequests:{fn:routeListTablegateJoinRequests_,write:false},respondTablegateJoinRequest:{fn:routeRespondTablegateJoinRequest_,write:true},
  listMembers:{fn:routeListMembers_,write:false},updateMember:{fn:routeUpdateMember_,write:true},kickMember:{fn:routeKickMember_,write:true},banMember:{fn:routeBanMember_,write:true},unbanMember:{fn:routeUnbanMember_,write:true},listBans:{fn:routeListBans_,write:false},
  requestPlayerApproval:{fn:routeRequestPlayerApproval_,write:true},withdrawPlayerApplication:{fn:routeWithdrawPlayerApplication_,write:true},listPlayerApplications:{fn:routeListPlayerApplications_,write:false},respondPlayerApplication:{fn:routeRespondPlayerApplication_,write:true},approvePlayer:{fn:routeApprovePlayer_,write:true},revokePlayer:{fn:routeRevokePlayer_,write:true},startAgeAssurance:{fn:routeStartAgeAssurance_,write:true},getMyAgeAssurance:{fn:routeGetMyAgeAssurance_,write:false},listAdultEligibility:{fn:routeListAdultEligibility_,write:false},
  listRoles:{fn:routeListRoles_,write:false},createRole:{fn:routeCreateRole_,write:true},updateRole:{fn:routeUpdateRole_,write:true},deleteRole:{fn:routeDeleteRole_,write:true},assignRole:{fn:routeAssignRole_,write:true},removeRole:{fn:routeRemoveRole_,write:true},
  createInvite:{fn:routeCreateInvite_,write:true},listInvites:{fn:routeListInvites_,write:false},revokeInvite:{fn:routeRevokeInvite_,write:true},joinInvite:{fn:routeJoinInvite_,write:true},
  listCategories:{fn:routeListCategories_,write:false},createCategory:{fn:routeCreateCategory_,write:true},updateCategory:{fn:routeUpdateCategory_,write:true},deleteCategory:{fn:routeDeleteCategory_,write:true},
  listChannels:{fn:routeListChannels_,write:false},createChannel:{fn:routeCreateChannel_,write:true},updateChannel:{fn:routeUpdateChannel_,write:true},deleteChannel:{fn:routeDeleteChannel_,write:true},
  listMessages:{fn:routeListMessages_,write:false},sendMessage:{fn:routeSendMessage_,write:true},editMessage:{fn:routeEditMessage_,write:true},deleteMessage:{fn:routeDeleteMessage_,write:true},purgeMessages:{fn:routePurgeMessages_,write:true},pinMessage:{fn:routePinMessage_,write:true},listPins:{fn:routeListPins_,write:false},addReaction:{fn:routeAddReaction_,write:true},removeReaction:{fn:routeRemoveReaction_,write:true},searchMessages:{fn:routeSearchMessages_,write:false},startTyping:{fn:routeStartTyping_,write:true},listTyping:{fn:routeListTyping_,write:false},markRead:{fn:routeMarkRead_,write:true},unreadCounts:{fn:routeUnreadCounts_,write:false},
  createDm:{fn:routeCreateDm_,write:true},createGroupDm:{fn:routeCreateGroupDm_,write:true},listDms:{fn:routeListDms_,write:false},getDm:{fn:routeGetDm_,write:false},updateGroupDm:{fn:routeUpdateGroupDm_,write:true},addDmParticipant:{fn:routeAddDmParticipant_,write:true},removeDmParticipant:{fn:routeRemoveDmParticipant_,write:true},transferDmOwnership:{fn:routeTransferDmOwnership_,write:true},closeDm:{fn:routeCloseDm_,write:true},
  upsertDiscoveryProfile:{fn:routeUpsertDiscoveryProfile_,write:true},hideDiscoveryItem:{fn:routeHideDiscoveryItem_,write:true},unhideDiscoveryItem:{fn:routeUnhideDiscoveryItem_,write:true},getDiscoveryProfile:{fn:routeGetDiscoveryProfile_,write:false},getGroupFinderQuestions:{fn:routeGetGroupFinderQuestions_,auth:false,write:false},createPublicLocation:{fn:routeCreatePublicLocation_,write:true},listPublicLocations:{fn:routeListPublicLocations_,write:false},updatePublicLocation:{fn:routeUpdatePublicLocation_,write:true},deletePublicLocation:{fn:routeDeletePublicLocation_,write:true},createGroupFinderPost:{fn:routeCreateGroupFinderPost_,write:true},createRightNowPost:{fn:routeCreateRightNowPost_,write:true},reconfirmGroupFinderPost:{fn:routeReconfirmGroupFinderPost_,write:true},updateGroupFinderPost:{fn:routeUpdateGroupFinderPost_,write:true},deleteGroupFinderPost:{fn:routeDeleteGroupFinderPost_,write:true},searchGroupFinderPosts:{fn:routeSearchGroupFinderPosts_,write:false},getGroupFinderRecommendations:{fn:routeGetGroupFinderRecommendations_,write:false},getGroupFinderPost:{fn:routeGetGroupFinderPost_,write:false},expressGroupFinderInterest:{fn:routeExpressGroupFinderInterest_,write:true},listGroupFinderInterests:{fn:routeListGroupFinderInterests_,write:false},listMyGroupFinderInterests:{fn:routeListMyGroupFinderInterests_,write:false},respondGroupFinderInterest:{fn:routeRespondGroupFinderInterest_,write:true},getPreGameLobby:{fn:routeGetPreGameLobby_,write:false},closePreGameLobby:{fn:routeClosePreGameLobby_,write:true},withdrawGroupFinderInterest:{fn:routeWithdrawGroupFinderInterest_,write:true},reportGroupFinderPost:{fn:routeReportGroupFinderPost_,write:true},createPublicVenue:{fn:routeCreatePublicVenue_,write:true},listPublicVenues:{fn:routeListPublicVenues_,auth:false,write:false},reconfirmPublicVenue:{fn:routeReconfirmPublicVenue_,write:true},createPublicEvent:{fn:routeCreatePublicEvent_,write:true},listPublicEvents:{fn:routeListPublicEvents_,auth:false,write:false},
  getUserProfile:{fn:routeGetUserProfile_,write:false},listFollowers:{fn:routeListFollowers_,write:false},listFollowing:{fn:routeListFollowing_,write:false},followUser:{fn:routeFollowUser_,write:true},unfollowUser:{fn:routeUnfollowUser_,write:true},setFollowNotificationPreference:{fn:routeSetFollowNotificationPreference_,write:true},listFriends:{fn:routeListFriends_,write:false},sendFriendRequest:{fn:routeSendFriendRequest_,write:true},acceptFriend:{fn:routeAcceptFriend_,write:true},declineFriend:{fn:routeDeclineFriend_,write:true},removeFriend:{fn:routeRemoveFriend_,write:true},blockUser:{fn:routeBlockUser_,write:true},unblockUser:{fn:routeUnblockUser_,write:true},ignoreUser:{fn:routeIgnoreUser_,write:true},unignoreUser:{fn:routeUnignoreUser_,write:true},listSafety:{fn:routeListSafety_,write:false},requestGuardianLink:{fn:routeRequestGuardianLink_,write:true},respondGuardianLink:{fn:routeRespondGuardianLink_,write:true},listGuardianLinks:{fn:routeListGuardianLinks_,write:false},revokeGuardianLink:{fn:routeRevokeGuardianLink_,write:true},requestTrustedContact:{fn:routeRequestTrustedContact_,write:true},respondTrustedContact:{fn:routeRespondTrustedContact_,write:true},listTrustedContacts:{fn:routeListTrustedContacts_,write:false},revokeTrustedContact:{fn:routeRevokeTrustedContact_,write:true},createSafetyCheckIn:{fn:routeCreateSafetyCheckIn_,write:true},listSafetyCheckIns:{fn:routeListSafetyCheckIns_,write:false},updateSafetyCheckIn:{fn:routeUpdateSafetyCheckIn_,write:true},flagSafetyCheckIn:{fn:routeFlagSafetyCheckIn_,write:true},
  reportUserSafety:{fn:routeReportUserSafety_,write:true},reportSafetyObject:{fn:routeReportSafetyObject_,write:true},createIncidentJournal:{fn:routeCreateIncidentJournal_,write:true},addIncidentEntry:{fn:routeAddIncidentEntry_,write:true},listIncidentJournals:{fn:routeListIncidentJournals_,write:false},getIncidentJournal:{fn:routeGetIncidentJournal_,write:false},convertIncidentJournalToReport:{fn:routeConvertIncidentJournalToReport_,write:true},exportIncidentJournal:{fn:routeExportIncidentJournal_,write:false},addSafetyCaseUpdate:{fn:routeAddSafetyCaseUpdate_,write:true},updateSafetySafeContact:{fn:routeUpdateSafetySafeContact_,write:true},submitSafetyAppeal:{fn:routeSubmitSafetyAppeal_,write:true},listMySafetyAppeals:{fn:routeListMySafetyAppeals_,write:false},listMySafetyReports:{fn:routeListMySafetyReports_,write:false},getSafetyReport:{fn:routeGetSafetyReport_,write:false},updateSafetyReportPoliceInfo:{fn:routeUpdateSafetyReportPoliceInfo_,write:true},exportSafetyReport:{fn:routeExportSafetyReport_,write:false},listSafetyReportsForReview:{fn:routeListSafetyReportsForReview_,write:false},reviewSafetyReport:{fn:routeReviewSafetyReport_,write:true},reviewSafetyAppeal:{fn:routeReviewSafetyAppeal_,write:true},applyCentralSafetyAction:{fn:routeApplyCentralSafetyAction_,write:true},revokeCentralSafetyAction:{fn:routeRevokeCentralSafetyAction_,write:true},listCentralSafetyActions:{fn:routeListCentralSafetyActions_,write:false},recordParticipation:{fn:routeRecordParticipation_,write:true},
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


/* ==========================================================================
 * TABLEGATE V8 — BORROWED STORAGE, DOCUMENT, SYNC, AND ACCESSIBILITY MODULE
 * ========================================================================== */

/**
 * TableGate Storage, Document, Sync, and Accessibility Module
 * Integrated module inside tablegate_backend_v8.gs
 *
 * Merge-safe design:
 *   - Does not define doGet() or doPost().
 *   - Exposes TableGateBorrowed.handles(action) and TableGateBorrowed.route(action, payload).
 *   - Uses TableGate-prefixed actions, properties, sheets, and Drive folders.
 *
 * Integrated through TableGate V8 handleRequest_(), authentication, locking,
 * and canonical response formatting.
 *
 * Authentication integration:
 *   TableGate V8 supplies TABLEGATE_RESOLVE_ACTOR(payload), which maps the active
 *   TableGate session to { ownerKey, tenantKey, serverId, userId, roles }.
 *
 * Browser responsibilities:
 *   - SpeechSynthesis reads prepared text aloud.
 *   - Camera/document capture happens in the frontend.
 *   - OCR and speech-to-text can run in the browser or through optional webhooks.
 */

var TableGateBorrowed = (function () {
  'use strict';

  var CONFIG = Object.freeze({
    APP_NAME: 'TableGate Storage and Accessibility',
    VERSION: '2026-07-31.tablegate-v8.storage-accessibility.v1',
    DATABASE_PROPERTY_KEYS: [
      'TABLEGATE_DB_ID',
      'TABLEGATE_SPREADSHEET_ID',
      'TABLEGATE_BACKEND_SPREADSHEET_ID',
      'TABLEGATE_BORROWED_SPREADSHEET_ID'
    ],
    ROOT_FOLDER_PROPERTY_KEYS: [
      'TABLEGATE_UPLOAD_FOLDER_ID',
      'TABLEGATE_STORAGE_FOLDER_ID',
      'TABLEGATE_BORROWED_ROOT_FOLDER_ID'
    ],
    OCR_WEBHOOK_PROPERTY: 'TABLEGATE_OCR_WEBHOOK_URL',
    OCR_API_KEY_PROPERTY: 'TABLEGATE_OCR_API_KEY',
    SPEECH_TO_TEXT_WEBHOOK_PROPERTY: 'TABLEGATE_SPEECH_TO_TEXT_WEBHOOK_URL',
    SPEECH_TO_TEXT_API_KEY_PROPERTY: 'TABLEGATE_SPEECH_TO_TEXT_API_KEY',
    MAX_UPLOAD_BYTES: 8 * 1024 * 1024,
    MAX_STATE_BYTES: 5 * 1024 * 1024,
    MAX_DOCUMENT_TEXT: 500000,
    MAX_TRANSCRIPT_TEXT: 250000,
    DEFAULT_LIST_LIMIT: 200,
    MAX_LIST_LIMIT: 1000,
    ROOT_FOLDER_NAME: 'TableGate Private Uploads',
    DATA_FOLDER_NAME: '_TableGate Synced State',
    SHEET_PREFIX: 'TG_Borrowed_',
    PUBLIC_DRIVE_LINKS: false
  });

  var SHEETS = Object.freeze({
    Files: [
      'TenantKey','FileId','OwnerKey','ServerId','FolderPath','Category','Kind',
      'FileName','MimeType','SizeBytes','DriveFileId','DriveUrl','DownloadUrl',
      'Sha256','TagsJson','AltText','Caption','TranscriptId','SourceDeviceId',
      'Status','CreatedAt','UpdatedAt','DeletedAt','MetaJson'
    ],
    Documents: [
      'TenantKey','DocumentId','OwnerKey','ServerId','FolderPath','Category',
      'Title','BodyText','FormatJson','TagsJson','LinksJson','AttachmentIdsJson',
      'SourceFileId','ScanId','OcrText','Language','Pinned','Locked','Status',
      'Revision','SourceDeviceId','CreatedAt','UpdatedAt','DeletedAt','MetaJson'
    ],
    Scans: [
      'TenantKey','ScanId','OwnerKey','ServerId','DocumentId','SourceFileId',
      'SourceType','Language','Text','TextLength','Provider','Status',
      'SourceDeviceId','CreatedAt','UpdatedAt','ProviderJson','MetaJson'
    ],
    Transcripts: [
      'TenantKey','TranscriptId','OwnerKey','ServerId','SourceKind','SourceId',
      'MediaFileId','Language','Transcript','Confidence','Engine','Status',
      'SourceDeviceId','CreatedAt','UpdatedAt','ProviderJson','MetaJson'
    ],
    Folders: [
      'TenantKey','FolderId','OwnerKey','ServerId','ParentFolderId','Path',
      'Name','Category','DriveFolderId','DriveUrl','Status','CreatedAt',
      'UpdatedAt','MetaJson'
    ],
    Categories: [
      'TenantKey','CategoryId','OwnerKey','ServerId','Name','Slug','Description',
      'Icon','SortOrder','Status','CreatedAt','UpdatedAt','MetaJson'
    ],
    SyncState: [
      'TenantKey','StateKey','OwnerKey','ServerId','Revision','DriveFileId',
      'DriveUrl','DataBytes','SourceDeviceId','CreatedAt','UpdatedAt','MetaJson'
    ],
    Devices: [
      'TenantKey','DeviceId','OwnerKey','ServerId','Platform','DeviceType',
      'DisplayMode','AppVersion','UserAgent','CapabilitiesJson','LastSeenAt',
      'CreatedAt','UpdatedAt','MetaJson'
    ],
    Accessibility: [
      'TenantKey','OwnerKey','ServerId','PreferencesJson','SourceDeviceId',
      'CreatedAt','UpdatedAt'
    ],
    ReadProgress: [
      'TenantKey','ProgressId','OwnerKey','ServerId','DocumentId','CharacterIndex',
      'ChunkIndex','Percent','Completed','VoiceName','Language','Rate','Pitch',
      'Volume','SourceDeviceId','CreatedAt','UpdatedAt','MetaJson'
    ],
    Audit: [
      'AuditId','TenantKey','OwnerKey','ServerId','Action','EntityType',
      'EntityId','SourceDeviceId','CreatedAt','DetailJson'
    ]
  });

  var ACTIONS = Object.freeze([
    'tablegate.storage.setup',
    'tablegate.storage.health',
    'tablegate.storage.actions',
    'tablegate.storage.summary',

    'tablegate.device.register',
    'tablegate.device.list',

    'tablegate.sync.state.save',
    'tablegate.sync.state.load',
    'tablegate.sync.changes.list',

    'tablegate.storage.folder.create',
    'tablegate.storage.folder.list',
    'tablegate.storage.category.upsert',
    'tablegate.storage.category.list',

    'tablegate.storage.file.upload',
    'tablegate.storage.file.get',
    'tablegate.storage.file.list',
    'tablegate.storage.file.trash',
    'tablegate.storage.file.restore',

    'tablegate.document.save',
    'tablegate.document.get',
    'tablegate.document.list',
    'tablegate.document.search',
    'tablegate.document.trash',
    'tablegate.document.restore',
    'tablegate.document.export',
    'tablegate.document.import.batch',
    'tablegate.document.attachment.upload',

    'tablegate.document.scan.save',
    'tablegate.document.ocr.request',

    'tablegate.transcript.save',
    'tablegate.transcript.request',
    'tablegate.transcript.list',

    'tablegate.accessibility.preferences.get',
    'tablegate.accessibility.preferences.set',
    'tablegate.document.read.prepare',
    'tablegate.document.read.progress.save',
    'tablegate.document.read.progress.get',

    'tablegate.storage.export'
  ]);

  function handles(action) {
    return ACTIONS.indexOf(String(action || '').trim()) >= 0;
  }

  function route(action, payload) {
    action = String(action || '').trim();
    payload = payload || {};
    ensureDatabase_();

    switch (action) {
      case 'tablegate.storage.setup': return setup_();
      case 'tablegate.storage.health': return health_();
      case 'tablegate.storage.actions': return { ok:true, actions:ACTIONS.slice(), version:CONFIG.VERSION };
      case 'tablegate.storage.summary': return storageSummary_(payload);

      case 'tablegate.device.register': return deviceRegister_(payload);
      case 'tablegate.device.list': return deviceList_(payload);

      case 'tablegate.sync.state.save': return syncStateSave_(payload);
      case 'tablegate.sync.state.load': return syncStateLoad_(payload);
      case 'tablegate.sync.changes.list': return syncChangesList_(payload);

      case 'tablegate.storage.folder.create': return folderCreate_(payload);
      case 'tablegate.storage.folder.list': return folderList_(payload);
      case 'tablegate.storage.category.upsert': return categoryUpsert_(payload);
      case 'tablegate.storage.category.list': return categoryList_(payload);

      case 'tablegate.storage.file.upload': return fileUpload_(payload);
      case 'tablegate.storage.file.get': return fileGet_(payload);
      case 'tablegate.storage.file.list': return fileList_(payload);
      case 'tablegate.storage.file.trash': return fileTrash_(payload);
      case 'tablegate.storage.file.restore': return fileRestore_(payload);

      case 'tablegate.document.save': return documentSave_(payload);
      case 'tablegate.document.get': return documentGet_(payload);
      case 'tablegate.document.list': return documentList_(payload);
      case 'tablegate.document.search': return documentSearch_(payload);
      case 'tablegate.document.trash': return documentTrash_(payload);
      case 'tablegate.document.restore': return documentRestore_(payload);
      case 'tablegate.document.export': return documentExport_(payload);
      case 'tablegate.document.import.batch': return documentImportBatch_(payload);
      case 'tablegate.document.attachment.upload': return documentAttachmentUpload_(payload);

      case 'tablegate.document.scan.save': return scanSave_(payload);
      case 'tablegate.document.ocr.request': return ocrRequest_(payload);

      case 'tablegate.transcript.save': return transcriptSave_(payload);
      case 'tablegate.transcript.request': return transcriptRequest_(payload);
      case 'tablegate.transcript.list': return transcriptList_(payload);

      case 'tablegate.accessibility.preferences.get': return accessibilityGet_(payload);
      case 'tablegate.accessibility.preferences.set': return accessibilitySet_(payload);
      case 'tablegate.document.read.prepare': return readPrepare_(payload);
      case 'tablegate.document.read.progress.save': return readProgressSave_(payload);
      case 'tablegate.document.read.progress.get': return readProgressGet_(payload);

      case 'tablegate.storage.export': return storageExport_(payload);
      default: return { ok:false, error:'Unknown TableGate storage action: ' + action, actions:ACTIONS.slice() };
    }
  }

  function setup_() {
    var ss = ensureDatabase_();
    var folder = ensureRootFolder_();
    Object.keys(SHEETS).forEach(function (name) { ensureSheet_(name); });
    return {
      ok:true,
      app:CONFIG.APP_NAME,
      version:CONFIG.VERSION,
      spreadsheetId:ss.getId(),
      spreadsheetUrl:ss.getUrl(),
      rootFolderId:folder.getId(),
      rootFolderUrl:folder.getUrl(),
      maxUploadBytesPerRequest:Math.max(1024, Math.min(CONFIG.MAX_UPLOAD_BYTES, Number(getProperty_('TABLEGATE_MAX_UPLOAD_BYTES') || CONFIG.MAX_UPLOAD_BYTES))),
      aggregateStorage:'Google Drive quota',
      browserFeatures:{
        readAloud:'SpeechSynthesis',
        cameraCapture:true,
        browserOcr:true,
        browserSpeechRecognition:true
      }
    };
  }

  function health_() {
    var ss = ensureDatabase_();
    var root = ensureRootFolder_();
    return {
      ok:true,
      app:CONFIG.APP_NAME,
      version:CONFIG.VERSION,
      databaseReady:Boolean(ss),
      driveReady:Boolean(root),
      sharedCanonicalDatabase:true,
      sharedCanonicalUploadFolder:true,
      capabilities:{
        multiDeviceStateSync:true,
        revisionConflictDetection:true,
        driveFileStorage:true,
        folderHierarchy:true,
        categoriesAndTags:true,
        richDocuments:true,
        attachments:true,
        scansAndOcrText:true,
        optionalOcrWebhook:Boolean(getProperty_(CONFIG.OCR_WEBHOOK_PROPERTY)),
        transcripts:true,
        optionalSpeechToTextWebhook:Boolean(getProperty_(CONFIG.SPEECH_TO_TEXT_WEBHOOK_PROPERTY)),
        readAloudPreparation:true,
        accessibilityPreferenceSync:true,
        readProgressSync:true,
        softDeleteAndRestore:true,
        metadataExport:true
      },
      limits:{
        maxUploadBytesPerRequest:Math.max(1024, Math.min(CONFIG.MAX_UPLOAD_BYTES, Number(getProperty_('TABLEGATE_MAX_UPLOAD_BYTES') || CONFIG.MAX_UPLOAD_BYTES))),
        maxStateBytes:CONFIG.MAX_STATE_BYTES,
        maxDocumentCharacters:CONFIG.MAX_DOCUMENT_TEXT,
        maxTranscriptCharacters:CONFIG.MAX_TRANSCRIPT_TEXT
      },
      securityNote:'Storage ownership is resolved through the active TableGate session. Tablegate-scoped storage also checks membership when a real tablegateId is supplied.'
    };
  }

  /* ------------------------------------------------------------------------ */
  /* Identity and request normalization                                       */
  /* ------------------------------------------------------------------------ */

  function data_(payload) {
    if (payload && payload.data && typeof payload.data === 'object') return payload.data;
    if (payload && payload.payload && typeof payload.payload === 'object') return payload.payload;
    return payload || {};
  }

  function actor_(payload) {
    var resolved = null;
    if (typeof TABLEGATE_RESOLVE_ACTOR === 'function') {
      resolved = TABLEGATE_RESOLVE_ACTOR(payload || {});
    }
    var d = data_(payload);
    resolved = resolved || {};
    var ownerKey = cleanKey_(
      resolved.ownerKey || resolved.userId ||
      d.ownerKey || d.userId || d.profileKey || d.actorKey ||
      payload.ownerKey || payload.userId || payload.profileKey || payload.actorKey ||
      'shared'
    );
    var tenantKey = cleanKey_(
      resolved.tenantKey || d.tenantKey || d.projectId || payload.tenantKey || payload.projectId || 'tablegate'
    );
    var serverId = cleanKey_(
      resolved.serverId || d.serverId || d.groupId || payload.serverId || payload.groupId || 'global'
    );
    return {
      ownerKey:ownerKey,
      tenantKey:tenantKey,
      serverId:serverId,
      userId:cleanText_(resolved.userId || d.userId || payload.userId || ownerKey, 160),
      roles:Array.isArray(resolved.roles) ? resolved.roles.slice() : []
    };
  }

  function deviceId_(payload) {
    var d = data_(payload);
    return cleanText_(d.deviceId || d.clientId || payload.deviceId || payload.clientId || '', 200);
  }

  /* ------------------------------------------------------------------------ */
  /* Devices and sync                                                         */
  /* ------------------------------------------------------------------------ */

  function deviceRegister_(payload) {
    var d = data_(payload);
    var a = actor_(payload);
    var deviceId = cleanText_(d.deviceId || d.clientId || id_('device'), 200);
    var now = isoNow_();
    var existing = findRow_('Devices', function (r) {
      return r.TenantKey === a.tenantKey && r.OwnerKey === a.ownerKey && r.DeviceId === deviceId;
    });
    var row = {
      TenantKey:a.tenantKey,
      DeviceId:deviceId,
      OwnerKey:a.ownerKey,
      ServerId:a.serverId,
      Platform:cleanText_(d.platform || '', 120),
      DeviceType:cleanText_(d.deviceType || d.formFactor || '', 80),
      DisplayMode:cleanText_(d.displayMode || '', 80),
      AppVersion:cleanText_(d.appVersion || '', 120),
      UserAgent:cleanText_(d.userAgent || payload.userAgent || '', 500),
      CapabilitiesJson:json_(d.capabilities || {}),
      LastSeenAt:now,
      CreatedAt:existing ? existing.CreatedAt : now,
      UpdatedAt:now,
      MetaJson:json_(d.meta || {})
    };
    upsertBy_('Devices', function (r) {
      return r.TenantKey === a.tenantKey && r.OwnerKey === a.ownerKey && r.DeviceId === deviceId;
    }, row);
    audit_(a, 'device.register', 'device', deviceId, deviceId, d);
    return { ok:true, device:publicRow_(row) };
  }

  function deviceList_(payload) {
    var a = actor_(payload);
    var rows = getRows_('Devices').filter(function (r) {
      return r.TenantKey === a.tenantKey && r.OwnerKey === a.ownerKey;
    }).sort(byUpdatedDesc_).map(publicRow_);
    return { ok:true, devices:rows };
  }

  function syncStateSave_(payload) {
    var d = data_(payload);
    var a = actor_(payload);
    var key = cleanStateKey_(d.key || d.stateKey || 'default');
    var value = d.value !== undefined ? d.value : (d.state !== undefined ? d.state : d);
    var existing = findRow_('SyncState', function (r) {
      return r.TenantKey === a.tenantKey && r.OwnerKey === a.ownerKey &&
        r.ServerId === a.serverId && r.StateKey === key;
    });
    var currentRevision = existing ? Number(existing.Revision || 0) : 0;
    var expected = d.expectedRevision;
    if (expected !== undefined && expected !== null && Number(expected) !== currentRevision) {
      return {
        ok:false,
        conflict:true,
        stateKey:key,
        expectedRevision:Number(expected),
        currentRevision:currentRevision,
        current:existing ? readStateFile_(existing, null) : null,
        updatedAt:existing ? existing.UpdatedAt : ''
      };
    }

    var serialized = JSON.stringify(value === undefined ? null : value);
    var bytes = Utilities.newBlob(serialized, 'application/json').getBytes().length;
    if (bytes > CONFIG.MAX_STATE_BYTES) {
      throw new Error('Synced state exceeds ' + CONFIG.MAX_STATE_BYTES + ' bytes. Store large binaries with tablegate.storage.file.upload.');
    }

    var driveFile = writeStateFile_(a, key, serialized, existing && existing.DriveFileId);
    var now = isoNow_();
    var row = {
      TenantKey:a.tenantKey,
      StateKey:key,
      OwnerKey:a.ownerKey,
      ServerId:a.serverId,
      Revision:currentRevision + 1,
      DriveFileId:driveFile.getId(),
      DriveUrl:driveFile.getUrl(),
      DataBytes:bytes,
      SourceDeviceId:deviceId_(payload),
      CreatedAt:existing ? existing.CreatedAt : now,
      UpdatedAt:now,
      MetaJson:json_(d.meta || {})
    };
    upsertBy_('SyncState', function (r) {
      return r.TenantKey === a.tenantKey && r.OwnerKey === a.ownerKey &&
        r.ServerId === a.serverId && r.StateKey === key;
    }, row);
    audit_(a, 'sync.state.save', 'state', key, deviceId_(payload), { revision:row.Revision, bytes:bytes });
    return { ok:true, stateKey:key, revision:row.Revision, value:value, updatedAt:now };
  }

  function syncStateLoad_(payload) {
    var d = data_(payload);
    var a = actor_(payload);
    var key = cleanStateKey_(d.key || d.stateKey || 'default');
    var row = findRow_('SyncState', function (r) {
      return r.TenantKey === a.tenantKey && r.OwnerKey === a.ownerKey &&
        r.ServerId === a.serverId && r.StateKey === key;
    });
    if (!row) return { ok:true, found:false, stateKey:key, revision:0, value:d.fallback !== undefined ? d.fallback : null };
    return {
      ok:true,
      found:true,
      stateKey:key,
      revision:Number(row.Revision || 0),
      value:readStateFile_(row, d.fallback !== undefined ? d.fallback : null),
      sourceDeviceId:row.SourceDeviceId,
      updatedAt:row.UpdatedAt
    };
  }

  function syncChangesList_(payload) {
    var d = data_(payload);
    var a = actor_(payload);
    var since = String(d.since || d.updatedAfter || '');
    var sinceMs = since ? new Date(since).getTime() : 0;
    if (!isFinite(sinceMs)) sinceMs = 0;
    var limit = listLimit_(d.limit);

    function changed(sheetName, type, idField) {
      return getRows_(sheetName).filter(function (r) {
        return r.TenantKey === a.tenantKey &&
          r.OwnerKey === a.ownerKey &&
          (!r.ServerId || r.ServerId === a.serverId) &&
          new Date(r.UpdatedAt || r.CreatedAt || 0).getTime() > sinceMs;
      }).map(function (r) {
        return {
          type:type,
          id:r[idField],
          status:r.Status || 'active',
          revision:Number(r.Revision || 0),
          sourceDeviceId:r.SourceDeviceId || '',
          updatedAt:r.UpdatedAt || r.CreatedAt
        };
      });
    }

    var changes = []
      .concat(changed('Files', 'file', 'FileId'))
      .concat(changed('Documents', 'document', 'DocumentId'))
      .concat(changed('Scans', 'scan', 'ScanId'))
      .concat(changed('Transcripts', 'transcript', 'TranscriptId'))
      .concat(changed('SyncState', 'state', 'StateKey'))
      .concat(changed('Accessibility', 'accessibility', 'OwnerKey'))
      .concat(changed('ReadProgress', 'read-progress', 'ProgressId'));

    changes.sort(function (x, y) { return String(x.updatedAt).localeCompare(String(y.updatedAt)); });
    var sliced = changes.slice(0, limit);
    return {
      ok:true,
      since:since || null,
      serverTime:isoNow_(),
      changes:sliced,
      hasMore:changes.length > sliced.length
    };
  }

  /* ------------------------------------------------------------------------ */
  /* Folders and categories                                                   */
  /* ------------------------------------------------------------------------ */

  function folderCreate_(payload) {
    var d = data_(payload);
    var a = actor_(payload);
    var path = normalizePath_(d.path || d.folderPath || d.name || 'Uploads');
    var driveFolder = ensureTenantFolderPath_(a, path);
    var now = isoNow_();
    var existing = findRow_('Folders', function (r) {
      return r.TenantKey === a.tenantKey && r.OwnerKey === a.ownerKey &&
        r.ServerId === a.serverId && r.Path === path && r.Status !== 'trashed';
    });
    var row = {
      TenantKey:a.tenantKey,
      FolderId:existing ? existing.FolderId : id_('folder'),
      OwnerKey:a.ownerKey,
      ServerId:a.serverId,
      ParentFolderId:cleanText_(d.parentFolderId || '', 200),
      Path:path,
      Name:path.split('/').pop(),
      Category:cleanText_(d.category || '', 160),
      DriveFolderId:driveFolder.getId(),
      DriveUrl:driveFolder.getUrl(),
      Status:'active',
      CreatedAt:existing ? existing.CreatedAt : now,
      UpdatedAt:now,
      MetaJson:json_(d.meta || {})
    };
    upsertBy_('Folders', function (r) {
      return r.TenantKey === a.tenantKey && r.OwnerKey === a.ownerKey &&
        r.ServerId === a.serverId && r.Path === path;
    }, row);
    audit_(a, 'storage.folder.create', 'folder', row.FolderId, deviceId_(payload), { path:path });
    return { ok:true, folder:publicRow_(row) };
  }

  function folderList_(payload) {
    var d = data_(payload);
    var a = actor_(payload);
    var status = String(d.status || 'active');
    var rows = getRows_('Folders').filter(function (r) {
      return r.TenantKey === a.tenantKey && r.OwnerKey === a.ownerKey &&
        r.ServerId === a.serverId && (!status || r.Status === status);
    }).sort(function (x, y) { return String(x.Path).localeCompare(String(y.Path)); }).map(publicRow_);
    return { ok:true, folders:rows };
  }

  function categoryUpsert_(payload) {
    var d = data_(payload);
    var a = actor_(payload);
    var name = cleanText_(d.name || d.category || 'General', 160);
    var slug = cleanKey_(d.slug || name);
    var now = isoNow_();
    var existing = findRow_('Categories', function (r) {
      return r.TenantKey === a.tenantKey && r.OwnerKey === a.ownerKey &&
        r.ServerId === a.serverId && r.Slug === slug;
    });
    var row = {
      TenantKey:a.tenantKey,
      CategoryId:existing ? existing.CategoryId : id_('category'),
      OwnerKey:a.ownerKey,
      ServerId:a.serverId,
      Name:name,
      Slug:slug,
      Description:cleanText_(d.description || '', 1000),
      Icon:cleanText_(d.icon || '', 120),
      SortOrder:Number(d.sortOrder || 0),
      Status:d.status === 'archived' ? 'archived' : 'active',
      CreatedAt:existing ? existing.CreatedAt : now,
      UpdatedAt:now,
      MetaJson:json_(d.meta || {})
    };
    upsertBy_('Categories', function (r) {
      return r.TenantKey === a.tenantKey && r.OwnerKey === a.ownerKey &&
        r.ServerId === a.serverId && r.Slug === slug;
    }, row);
    audit_(a, 'storage.category.upsert', 'category', row.CategoryId, deviceId_(payload), { slug:slug });
    return { ok:true, category:publicRow_(row) };
  }

  function categoryList_(payload) {
    var a = actor_(payload);
    var rows = getRows_('Categories').filter(function (r) {
      return r.TenantKey === a.tenantKey && r.OwnerKey === a.ownerKey &&
        r.ServerId === a.serverId && r.Status !== 'archived';
    }).sort(function (x, y) {
      var n = Number(x.SortOrder || 0) - Number(y.SortOrder || 0);
      return n || String(x.Name).localeCompare(String(y.Name));
    }).map(publicRow_);
    return { ok:true, categories:rows };
  }

  /* ------------------------------------------------------------------------ */
  /* Files                                                                    */
  /* ------------------------------------------------------------------------ */

  function fileUpload_(payload) {
    var d = data_(payload);
    var a = actor_(payload);
    var base64 = String(d.base64 || d.dataUrl || (d.file && (d.file.base64 || d.file.dataUrl)) || '');
    var mimeType = cleanText_(d.mimeType || (d.file && d.file.mimeType) || guessMime_(base64) || 'application/octet-stream', 160);
    var kind = cleanKey_(d.kind || 'file');
    var fileName = safeFileName_(d.fileName || d.name || (d.file && d.file.name) || kind + '-' + Date.now());
    var folderPath = normalizePath_(d.folderPath || d.folder || 'Uploads');
    if (!base64) throw new Error('Missing base64 or dataUrl.');
    if (base64.indexOf(',') !== -1) base64 = base64.split(',').pop();

    var bytes = Utilities.base64Decode(base64);
    var configuredMax = Number(PropertiesService.getScriptProperties().getProperty('TABLEGATE_MAX_UPLOAD_BYTES') || CONFIG.MAX_UPLOAD_BYTES);
    var effectiveMax = Math.max(1024, Math.min(CONFIG.MAX_UPLOAD_BYTES, configuredMax));
    if (bytes.length > effectiveMax) {
      throw new Error('Upload exceeds the configured per-request Apps Script limit of ' + effectiveMax + ' bytes.');
    }

    var folder = ensureTenantFolderPath_(a, folderPath);
    var blob = Utilities.newBlob(bytes, mimeType, fileName);
    var driveFile = folder.createFile(blob);
    var publicLink = CONFIG.PUBLIC_DRIVE_LINKS === true && d.publicLink === true;
    if (publicLink) {
      try { driveFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (_sharingError) {}
    }

    var now = isoNow_();
    var fileId = id_('file');
    var downloadUrl = publicLink
      ? 'https://drive.google.com/uc?export=download&id=' + encodeURIComponent(driveFile.getId())
      : driveFile.getUrl();
    var row = {
      TenantKey:a.tenantKey,
      FileId:fileId,
      OwnerKey:a.ownerKey,
      ServerId:a.serverId,
      FolderPath:folderPath,
      Category:cleanText_(d.category || '', 160),
      Kind:kind,
      FileName:driveFile.getName(),
      MimeType:mimeType,
      SizeBytes:bytes.length,
      DriveFileId:driveFile.getId(),
      DriveUrl:driveFile.getUrl(),
      DownloadUrl:downloadUrl,
      Sha256:sha256_(bytes),
      TagsJson:json_(array_(d.tags)),
      AltText:cleanText_(d.altText || '', 4000),
      Caption:cleanText_(d.caption || '', 4000),
      TranscriptId:'',
      SourceDeviceId:deviceId_(payload),
      Status:'active',
      CreatedAt:now,
      UpdatedAt:now,
      DeletedAt:'',
      MetaJson:json_(d.meta || {})
    };
    appendRow_('Files', row);
    audit_(a, 'storage.file.upload', 'file', fileId, deviceId_(payload), {
      fileName:fileName, mimeType:mimeType, sizeBytes:bytes.length, folderPath:folderPath
    });
    return { ok:true, file:publicFile_(row) };
  }

  function fileGet_(payload) {
    var d = data_(payload);
    var a = actor_(payload);
    var fileId = String(d.fileId || '');
    var row = requireOwnedRow_('Files', 'FileId', fileId, a);
    return { ok:true, file:publicFile_(row) };
  }

  function fileList_(payload) {
    var d = data_(payload);
    var a = actor_(payload);
    var status = String(d.status || 'active');
    var kind = d.kind ? cleanKey_(d.kind) : '';
    var category = String(d.category || '');
    var folderPath = d.folderPath ? normalizePath_(d.folderPath) : '';
    var query = String(d.query || d.q || '').toLowerCase();
    var rows = getRows_('Files').filter(function (r) {
      if (r.TenantKey !== a.tenantKey || r.OwnerKey !== a.ownerKey || r.ServerId !== a.serverId) return false;
      if (status && r.Status !== status) return false;
      if (kind && r.Kind !== kind) return false;
      if (category && r.Category !== category) return false;
      if (folderPath && r.FolderPath !== folderPath) return false;
      if (query) {
        var hay = (r.FileName + ' ' + r.Category + ' ' + r.FolderPath + ' ' + r.TagsJson + ' ' + r.AltText + ' ' + r.Caption).toLowerCase();
        if (hay.indexOf(query) < 0) return false;
      }
      return true;
    }).sort(byUpdatedDesc_);
    return paged_(rows, d, publicFile_, 'files');
  }

  function fileTrash_(payload) {
    return changeFileStatus_(payload, 'trashed');
  }

  function fileRestore_(payload) {
    return changeFileStatus_(payload, 'active');
  }

  function changeFileStatus_(payload, status) {
    var d = data_(payload);
    var a = actor_(payload);
    var fileId = String(d.fileId || '');
    var row = requireOwnedRow_('Files', 'FileId', fileId, a);
    var now = isoNow_();
    updateRows_('Files', function (r) {
      return r.TenantKey === a.tenantKey && r.OwnerKey === a.ownerKey && r.FileId === fileId;
    }, function (r) {
      r.Status = status;
      r.UpdatedAt = now;
      r.DeletedAt = status === 'trashed' ? now : '';
      r.SourceDeviceId = deviceId_(payload);
      return r;
    });
    try {
      var driveFile = DriveApp.getFileById(row.DriveFileId);
      driveFile.setTrashed(status === 'trashed');
    } catch (_driveError) {}
    audit_(a, 'storage.file.' + (status === 'trashed' ? 'trash' : 'restore'), 'file', fileId, deviceId_(payload), {});
    return { ok:true, fileId:fileId, status:status };
  }

  function publicFile_(r) {
    var out = publicRow_(r);
    out.tags = parseJson_(r.TagsJson, []);
    out.meta = parseJson_(r.MetaJson, {});
    delete out.tagsJson;
    delete out.metaJson;
    return out;
  }

  /* ------------------------------------------------------------------------ */
  /* Documents, attachments, scans, and OCR                                   */
  /* ------------------------------------------------------------------------ */

  function documentSave_(payload) {
    var d = data_(payload);
    var a = actor_(payload);
    var documentId = cleanText_(d.documentId || d.id || id_('document'), 200);
    var existing = findRow_('Documents', function (r) {
      return r.TenantKey === a.tenantKey && r.OwnerKey === a.ownerKey &&
        r.ServerId === a.serverId && r.DocumentId === documentId;
    });
    var currentRevision = existing ? Number(existing.Revision || 0) : 0;
    if (d.expectedRevision !== undefined && Number(d.expectedRevision) !== currentRevision) {
      return {
        ok:false,
        conflict:true,
        documentId:documentId,
        expectedRevision:Number(d.expectedRevision),
        currentRevision:currentRevision,
        current:existing ? publicDocument_(existing) : null
      };
    }

    var now = isoNow_();
    var body = String(d.bodyText !== undefined ? d.bodyText : (d.text !== undefined ? d.text : ''));
    body = body.slice(0, CONFIG.MAX_DOCUMENT_TEXT);
    var title = cleanText_(d.title || firstLine_(body) || 'Untitled document', 300);
    var row = {
      TenantKey:a.tenantKey,
      DocumentId:documentId,
      OwnerKey:a.ownerKey,
      ServerId:a.serverId,
      FolderPath:normalizePath_(d.folderPath || d.folder || (existing && existing.FolderPath) || 'Documents'),
      Category:cleanText_(d.category !== undefined ? d.category : ((existing && existing.Category) || ''), 160),
      Title:title,
      BodyText:body,
      FormatJson:json_(d.format !== undefined ? d.format : (d.blocks !== undefined ? d.blocks : parseJson_(existing && existing.FormatJson, {}))),
      TagsJson:json_(d.tags !== undefined ? array_(d.tags) : parseJson_(existing && existing.TagsJson, [])),
      LinksJson:json_(d.links !== undefined ? array_(d.links) : parseJson_(existing && existing.LinksJson, [])),
      AttachmentIdsJson:json_(d.attachmentIds !== undefined ? array_(d.attachmentIds) : parseJson_(existing && existing.AttachmentIdsJson, [])),
      SourceFileId:cleanText_(d.sourceFileId !== undefined ? d.sourceFileId : ((existing && existing.SourceFileId) || ''), 200),
      ScanId:cleanText_(d.scanId !== undefined ? d.scanId : ((existing && existing.ScanId) || ''), 200),
      OcrText:String(d.ocrText !== undefined ? d.ocrText : ((existing && existing.OcrText) || '')).slice(0, CONFIG.MAX_DOCUMENT_TEXT),
      Language:cleanText_(d.language || (existing && existing.Language) || 'en-US', 40),
      Pinned:String(d.pinned === true || (d.pinned === undefined && existing && existing.Pinned === 'true')),
      Locked:String(d.locked === true || (d.locked === undefined && existing && existing.Locked === 'true')),
      Status:cleanText_(d.status || (existing && existing.Status) || 'active', 40),
      Revision:currentRevision + 1,
      SourceDeviceId:deviceId_(payload),
      CreatedAt:existing ? existing.CreatedAt : now,
      UpdatedAt:now,
      DeletedAt:existing ? existing.DeletedAt : '',
      MetaJson:json_(d.meta !== undefined ? d.meta : parseJson_(existing && existing.MetaJson, {}))
    };
    upsertBy_('Documents', function (r) {
      return r.TenantKey === a.tenantKey && r.OwnerKey === a.ownerKey &&
        r.ServerId === a.serverId && r.DocumentId === documentId;
    }, row);
    ensureTenantFolderPath_(a, row.FolderPath);
    audit_(a, 'document.save', 'document', documentId, deviceId_(payload), { revision:row.Revision, title:title });
    return { ok:true, document:publicDocument_(row) };
  }

  function documentGet_(payload) {
    var d = data_(payload);
    var a = actor_(payload);
    var row = requireOwnedRow_('Documents', 'DocumentId', String(d.documentId || d.id || ''), a);
    return { ok:true, document:publicDocument_(row), attachments:attachmentRows_(row, a) };
  }

  function documentList_(payload) {
    var d = data_(payload);
    var a = actor_(payload);
    var folder = d.folderPath || d.folder ? normalizePath_(d.folderPath || d.folder) : '';
    var category = String(d.category || '');
    var status = String(d.status || 'active');
    var rows = getRows_('Documents').filter(function (r) {
      return r.TenantKey === a.tenantKey && r.OwnerKey === a.ownerKey && r.ServerId === a.serverId &&
        (!folder || r.FolderPath === folder) &&
        (!category || r.Category === category) &&
        (!status || r.Status === status);
    }).sort(function (x, y) {
      if (String(x.Pinned) !== String(y.Pinned)) return String(y.Pinned).localeCompare(String(x.Pinned));
      return byUpdatedDesc_(x, y);
    });
    return paged_(rows, d, publicDocument_, 'documents');
  }

  function documentSearch_(payload) {
    var d = data_(payload);
    var a = actor_(payload);
    var q = String(d.query || d.q || '').toLowerCase();
    var includeTrashed = d.includeTrashed === true;
    var rows = getRows_('Documents').filter(function (r) {
      if (r.TenantKey !== a.tenantKey || r.OwnerKey !== a.ownerKey || r.ServerId !== a.serverId) return false;
      if (!includeTrashed && r.Status !== 'active') return false;
      var hay = (r.Title + ' ' + r.BodyText + ' ' + r.OcrText + ' ' + r.TagsJson + ' ' + r.Category + ' ' + r.FolderPath).toLowerCase();
      return !q || hay.indexOf(q) >= 0;
    }).sort(byUpdatedDesc_);
    return paged_(rows, d, publicDocument_, 'documents', { query:q });
  }

  function documentTrash_(payload) {
    return changeDocumentStatus_(payload, 'trashed');
  }

  function documentRestore_(payload) {
    return changeDocumentStatus_(payload, 'active');
  }

  function changeDocumentStatus_(payload, status) {
    var d = data_(payload);
    var a = actor_(payload);
    var documentId = String(d.documentId || d.id || '');
    requireOwnedRow_('Documents', 'DocumentId', documentId, a);
    var now = isoNow_();
    updateRows_('Documents', function (r) {
      return r.TenantKey === a.tenantKey && r.OwnerKey === a.ownerKey &&
        r.ServerId === a.serverId && r.DocumentId === documentId;
    }, function (r) {
      r.Status = status;
      r.DeletedAt = status === 'trashed' ? now : '';
      r.UpdatedAt = now;
      r.Revision = Number(r.Revision || 0) + 1;
      r.SourceDeviceId = deviceId_(payload);
      return r;
    });
    audit_(a, 'document.' + (status === 'trashed' ? 'trash' : 'restore'), 'document', documentId, deviceId_(payload), {});
    return { ok:true, documentId:documentId, status:status, recoverable:true };
  }

  function documentExport_(payload) {
    var d = data_(payload);
    var a = actor_(payload);
    var row = requireOwnedRow_('Documents', 'DocumentId', String(d.documentId || d.id || ''), a);
    var doc = publicDocument_(row);
    var markdown = '# ' + doc.title + '\n\n' + doc.bodyText;
    if (doc.ocrText) markdown += '\n\n## Scanned text\n\n' + doc.ocrText;
    if (doc.tags.length) markdown += '\n\nTags: ' + doc.tags.map(function (t) { return '#' + t; }).join(' ');
    return {
      ok:true,
      documentId:doc.documentId,
      formats:{ json:doc, markdown:markdown, plainText:doc.bodyText || doc.ocrText || '' },
      attachments:attachmentRows_(row, a),
      limitations:[
        'Binary attachments are referenced by file ID rather than embedded.',
        'Locked is an authenticated access flag, not end-to-end encryption.'
      ]
    };
  }

  function documentImportBatch_(payload) {
    var d = data_(payload);
    var items = Array.isArray(d.documents) ? d.documents : (Array.isArray(d.items) ? d.items : []);
    var imported = [];
    var failed = [];
    items.slice(0, 500).forEach(function (item, index) {
      try {
        var nextPayload = merge_(payload, { data:merge_(item || {}, {
          sourceDeviceId:item && item.sourceDeviceId || deviceId_(payload)
        }) });
        imported.push(documentSave_(nextPayload).document);
      } catch (err) {
        failed.push({ index:index, error:errorText_(err) });
      }
    });
    return { ok:failed.length === 0, importedCount:imported.length, failedCount:failed.length, imported:imported, failed:failed };
  }

  function documentAttachmentUpload_(payload) {
    var d = data_(payload);
    var a = actor_(payload);
    var documentId = String(d.documentId || '');
    var row = requireOwnedRow_('Documents', 'DocumentId', documentId, a);
    var uploadPayload = merge_(payload, { data:merge_(d, {
      folderPath:d.folderPath || row.FolderPath + '/Attachments',
      category:d.category || row.Category,
      kind:d.kind || 'document-attachment'
    }) });
    var uploaded = fileUpload_(uploadPayload).file;
    var ids = parseJson_(row.AttachmentIdsJson, []);
    if (ids.indexOf(uploaded.fileId) < 0) ids.push(uploaded.fileId);
    updateRows_('Documents', function (r) {
      return r.TenantKey === a.tenantKey && r.OwnerKey === a.ownerKey &&
        r.ServerId === a.serverId && r.DocumentId === documentId;
    }, function (r) {
      r.AttachmentIdsJson = json_(ids);
      r.UpdatedAt = isoNow_();
      r.Revision = Number(r.Revision || 0) + 1;
      r.SourceDeviceId = deviceId_(payload);
      return r;
    });
    return { ok:true, documentId:documentId, attachment:uploaded, attachmentIds:ids };
  }

  function scanSave_(payload) {
    var d = data_(payload);
    var a = actor_(payload);
    var scanId = cleanText_(d.scanId || id_('scan'), 200);
    var text = String(d.text || d.ocrText || d.content || '').slice(0, CONFIG.MAX_DOCUMENT_TEXT);
    var now = isoNow_();
    var existing = findRow_('Scans', function (r) {
      return r.TenantKey === a.tenantKey && r.OwnerKey === a.ownerKey &&
        r.ServerId === a.serverId && r.ScanId === scanId;
    });
    var row = {
      TenantKey:a.tenantKey,
      ScanId:scanId,
      OwnerKey:a.ownerKey,
      ServerId:a.serverId,
      DocumentId:cleanText_(d.documentId || '', 200),
      SourceFileId:cleanText_(d.sourceFileId || d.fileId || '', 200),
      SourceType:cleanKey_(d.sourceType || d.kind || 'document-scan'),
      Language:cleanText_(d.language || 'en-US', 40),
      Text:text,
      TextLength:text.length,
      Provider:cleanText_(d.provider || 'browser/manual', 100),
      Status:cleanText_(d.status || (text ? 'complete' : 'saved'), 60),
      SourceDeviceId:deviceId_(payload),
      CreatedAt:existing ? existing.CreatedAt : now,
      UpdatedAt:now,
      ProviderJson:json_(d.providerData || d.providerJson || {}),
      MetaJson:json_(d.meta || {})
    };
    upsertBy_('Scans', function (r) {
      return r.TenantKey === a.tenantKey && r.OwnerKey === a.ownerKey &&
        r.ServerId === a.serverId && r.ScanId === scanId;
    }, row);

    if (row.DocumentId) {
      updateRows_('Documents', function (r) {
        return r.TenantKey === a.tenantKey && r.OwnerKey === a.ownerKey &&
          r.ServerId === a.serverId && r.DocumentId === row.DocumentId;
      }, function (r) {
        r.ScanId = scanId;
        r.OcrText = text;
        r.UpdatedAt = now;
        r.Revision = Number(r.Revision || 0) + 1;
        r.SourceDeviceId = deviceId_(payload);
        return r;
      });
    }
    audit_(a, 'document.scan.save', 'scan', scanId, deviceId_(payload), { textLength:text.length });
    return { ok:true, scan:publicScan_(row) };
  }

  function ocrRequest_(payload) {
    var d = data_(payload);
    var a = actor_(payload);
    if (d.text || d.ocrText) return scanSave_(payload);

    var fileId = String(d.fileId || d.sourceFileId || '');
    var fileRow = fileId ? requireOwnedRow_('Files', 'FileId', fileId, a) : null;
    var webhook = getProperty_(CONFIG.OCR_WEBHOOK_PROPERTY);
    if (!webhook) {
      return {
        ok:false,
        supported:false,
        needsFrontendOrExternalOcr:true,
        fileId:fileId,
        message:'Apps Script has no built-in OCR. Use browser OCR, then call tablegate.document.scan.save, or configure TABLEGATE_OCR_WEBHOOK_URL.'
      };
    }

    var requestId = cleanText_(d.scanId || id_('scan'), 200);
    var body = {
      tenantKey:a.tenantKey,
      ownerKey:a.ownerKey,
      serverId:a.serverId,
      scanId:requestId,
      fileId:fileId,
      driveFileId:fileRow ? fileRow.DriveFileId : '',
      fileUrl:fileRow ? fileRow.DriveUrl : '',
      mimeType:fileRow ? fileRow.MimeType : cleanText_(d.mimeType || '', 160),
      language:d.language || 'en-US',
      callbackAction:'tablegate.document.scan.save'
    };
    var response = postWebhook_(webhook, CONFIG.OCR_API_KEY_PROPERTY, body);
    var resultText = String(response.parsed.text || response.parsed.ocrText || '');
    var status = response.ok ? (resultText ? 'complete' : 'sent-to-provider') : 'provider-error';
    return scanSave_(merge_(payload, { data:merge_(d, {
      scanId:requestId,
      sourceFileId:fileId,
      text:resultText,
      provider:'webhook',
      status:status,
      providerData:response
    }) }));
  }

  function publicDocument_(r) {
    var out = publicRow_(r);
    out.format = parseJson_(r.FormatJson, {});
    out.tags = parseJson_(r.TagsJson, []);
    out.links = parseJson_(r.LinksJson, []);
    out.attachmentIds = parseJson_(r.AttachmentIdsJson, []);
    out.meta = parseJson_(r.MetaJson, {});
    out.revision = Number(r.Revision || 0);
    out.pinned = String(r.Pinned) === 'true';
    out.locked = String(r.Locked) === 'true';
    out.securityNote = 'Locked documents require TableGate authentication; this flag is not end-to-end encryption.';
    delete out.formatJson;
    delete out.tagsJson;
    delete out.linksJson;
    delete out.attachmentIdsJson;
    delete out.metaJson;
    return out;
  }

  function publicScan_(r) {
    var out = publicRow_(r);
    out.providerData = parseJson_(r.ProviderJson, {});
    out.meta = parseJson_(r.MetaJson, {});
    delete out.providerJson;
    delete out.metaJson;
    return out;
  }

  function attachmentRows_(documentRow, actor) {
    var ids = parseJson_(documentRow.AttachmentIdsJson, []);
    if (!ids.length) return [];
    return getRows_('Files').filter(function (r) {
      return r.TenantKey === actor.tenantKey && r.OwnerKey === actor.ownerKey &&
        ids.indexOf(r.FileId) >= 0;
    }).map(publicFile_);
  }

  /* ------------------------------------------------------------------------ */
  /* Transcripts                                                              */
  /* ------------------------------------------------------------------------ */

  function transcriptSave_(payload) {
    var d = data_(payload);
    var a = actor_(payload);
    var transcriptId = cleanText_(d.transcriptId || d.id || id_('transcript'), 200);
    var existing = findRow_('Transcripts', function (r) {
      return r.TenantKey === a.tenantKey && r.OwnerKey === a.ownerKey &&
        r.ServerId === a.serverId && r.TranscriptId === transcriptId;
    });
    var now = isoNow_();
    var transcript = String(d.transcript || d.text || '').slice(0, CONFIG.MAX_TRANSCRIPT_TEXT);
    var row = {
      TenantKey:a.tenantKey,
      TranscriptId:transcriptId,
      OwnerKey:a.ownerKey,
      ServerId:a.serverId,
      SourceKind:cleanKey_(d.sourceKind || 'media'),
      SourceId:cleanText_(d.sourceId || d.documentId || '', 200),
      MediaFileId:cleanText_(d.mediaFileId || d.fileId || '', 200),
      Language:cleanText_(d.language || 'en-US', 40),
      Transcript:transcript,
      Confidence:cleanText_(d.confidence || '', 80),
      Engine:cleanText_(d.engine || d.provider || 'browser/manual', 100),
      Status:cleanText_(d.status || (transcript ? 'complete' : 'saved'), 60),
      SourceDeviceId:deviceId_(payload),
      CreatedAt:existing ? existing.CreatedAt : now,
      UpdatedAt:now,
      ProviderJson:json_(d.providerData || d.providerJson || {}),
      MetaJson:json_(d.meta || {})
    };
    upsertBy_('Transcripts', function (r) {
      return r.TenantKey === a.tenantKey && r.OwnerKey === a.ownerKey &&
        r.ServerId === a.serverId && r.TranscriptId === transcriptId;
    }, row);

    if (row.MediaFileId) {
      updateRows_('Files', function (r) {
        return r.TenantKey === a.tenantKey && r.OwnerKey === a.ownerKey && r.FileId === row.MediaFileId;
      }, function (r) {
        r.TranscriptId = transcriptId;
        r.UpdatedAt = now;
        return r;
      });
    }
    audit_(a, 'transcript.save', 'transcript', transcriptId, deviceId_(payload), { textLength:transcript.length });
    return { ok:true, transcript:publicTranscript_(row) };
  }

  function transcriptRequest_(payload) {
    var d = data_(payload);
    var a = actor_(payload);
    if (d.transcript || d.text) return transcriptSave_(payload);

    var fileId = String(d.mediaFileId || d.fileId || '');
    var fileRow = requireOwnedRow_('Files', 'FileId', fileId, a);
    var webhook = getProperty_(CONFIG.SPEECH_TO_TEXT_WEBHOOK_PROPERTY);
    if (!webhook) {
      return {
        ok:false,
        supported:false,
        needsFrontendOrExternalSpeechApi:true,
        fileId:fileId,
        message:'Apps Script has no built-in speech-to-text. Use browser SpeechRecognition, then call tablegate.transcript.save, or configure TABLEGATE_SPEECH_TO_TEXT_WEBHOOK_URL.'
      };
    }

    var transcriptId = cleanText_(d.transcriptId || id_('transcript'), 200);
    var response = postWebhook_(webhook, CONFIG.SPEECH_TO_TEXT_API_KEY_PROPERTY, {
      tenantKey:a.tenantKey,
      ownerKey:a.ownerKey,
      serverId:a.serverId,
      transcriptId:transcriptId,
      fileId:fileId,
      driveFileId:fileRow.DriveFileId,
      mediaUrl:fileRow.DriveUrl,
      mimeType:fileRow.MimeType,
      language:d.language || 'en-US',
      callbackAction:'tablegate.transcript.save'
    });
    var text = String(response.parsed.transcript || response.parsed.text || '');
    return transcriptSave_(merge_(payload, { data:merge_(d, {
      transcriptId:transcriptId,
      mediaFileId:fileId,
      transcript:text,
      provider:'webhook',
      status:response.ok ? (text ? 'complete' : 'sent-to-provider') : 'provider-error',
      providerData:response
    }) }));
  }

  function transcriptList_(payload) {
    var d = data_(payload);
    var a = actor_(payload);
    var sourceKind = d.sourceKind ? cleanKey_(d.sourceKind) : '';
    var sourceId = String(d.sourceId || '');
    var fileId = String(d.mediaFileId || d.fileId || '');
    var rows = getRows_('Transcripts').filter(function (r) {
      return r.TenantKey === a.tenantKey && r.OwnerKey === a.ownerKey && r.ServerId === a.serverId &&
        (!sourceKind || r.SourceKind === sourceKind) &&
        (!sourceId || r.SourceId === sourceId) &&
        (!fileId || r.MediaFileId === fileId);
    }).sort(byUpdatedDesc_);
    return paged_(rows, d, publicTranscript_, 'transcripts');
  }

  function publicTranscript_(r) {
    var out = publicRow_(r);
    out.providerData = parseJson_(r.ProviderJson, {});
    out.meta = parseJson_(r.MetaJson, {});
    delete out.providerJson;
    delete out.metaJson;
    return out;
  }

  /* ------------------------------------------------------------------------ */
  /* Accessibility and reading aloud                                          */
  /* ------------------------------------------------------------------------ */

  function defaultAccessibility_() {
    return {
      schemaVersion:1,
      visual:{
        highContrast:false,
        contrastMode:'system',
        fontScale:1,
        lineSpacing:1.5,
        letterSpacing:0,
        dyslexiaFriendlyFont:false,
        reduceTransparency:false,
        reduceVisualClutter:false
      },
      motion:{
        reducedMotion:false,
        disableParallax:false,
        disableFlashing:true,
        animationSpeed:1
      },
      interaction:{
        keyboardNavigation:true,
        visibleFocus:true,
        largeTouchTargets:true,
        touchTargetMinimumPx:44,
        singleHandMode:false,
        holdToConfirm:false
      },
      audio:{
        captions:true,
        transcripts:true,
        autoplay:false,
        soundEffects:true,
        soundEffectsVolume:1
      },
      speech:{
        enabled:true,
        language:'en-US',
        voiceName:'',
        rate:1,
        pitch:1,
        volume:1,
        chunkCharacters:1200,
        announceHeadings:true,
        announceLinks:true
      },
      screenReader:{
        enhancedLabels:true,
        announceStatusChanges:true,
        conciseMode:false
      },
      scanning:{
        preserveOriginalImage:true,
        autoRotate:true,
        highContrastPreview:false,
        language:'en-US'
      }
    };
  }

  function accessibilityGet_(payload) {
    var a = actor_(payload);
    var row = findRow_('Accessibility', function (r) {
      return r.TenantKey === a.tenantKey && r.OwnerKey === a.ownerKey && r.ServerId === a.serverId;
    });
    var preferences = deepMerge_(defaultAccessibility_(), row ? parseJson_(row.PreferencesJson, {}) : {});
    return { ok:true, preferences:preferences, updatedAt:row ? row.UpdatedAt : null };
  }

  function accessibilitySet_(payload) {
    var d = data_(payload);
    var a = actor_(payload);
    var existing = accessibilityGet_(payload).preferences;
    var incoming = d.preferences || d.value || d;
    var preferences = deepMerge_(existing, incoming);
    var now = isoNow_();
    var old = findRow_('Accessibility', function (r) {
      return r.TenantKey === a.tenantKey && r.OwnerKey === a.ownerKey && r.ServerId === a.serverId;
    });
    var row = {
      TenantKey:a.tenantKey,
      OwnerKey:a.ownerKey,
      ServerId:a.serverId,
      PreferencesJson:json_(preferences),
      SourceDeviceId:deviceId_(payload),
      CreatedAt:old ? old.CreatedAt : now,
      UpdatedAt:now
    };
    upsertBy_('Accessibility', function (r) {
      return r.TenantKey === a.tenantKey && r.OwnerKey === a.ownerKey && r.ServerId === a.serverId;
    }, row);
    audit_(a, 'accessibility.preferences.set', 'accessibility', a.ownerKey, deviceId_(payload), {});
    return { ok:true, preferences:preferences, updatedAt:now };
  }

  function readPrepare_(payload) {
    var d = data_(payload);
    var a = actor_(payload);
    var text = String(d.text || '');
    var documentId = String(d.documentId || '');
    var document = null;
    if (!text && documentId) {
      var row = requireOwnedRow_('Documents', 'DocumentId', documentId, a);
      document = publicDocument_(row);
      text = document.bodyText || document.ocrText || '';
    }
    text = normalizeReadableText_(text);
    var prefs = accessibilityGet_(payload).preferences;
    var speech = deepMerge_(prefs.speech || {}, d.speech || {});
    var chunkSize = Math.max(200, Math.min(4000, Number(d.chunkCharacters || speech.chunkCharacters || 1200)));
    var chunks = splitSpeechChunks_(text, chunkSize);
    return {
      ok:true,
      documentId:documentId || null,
      title:document ? document.title : cleanText_(d.title || '', 300),
      textLength:text.length,
      chunks:chunks.map(function (chunk, index) {
        return { index:index, text:chunk, startCharacter:findChunkStart_(text, chunks, index) };
      }),
      speech:{
        language:cleanText_(d.language || speech.language || 'en-US', 40),
        voiceName:cleanText_(d.voiceName || speech.voiceName || '', 200),
        rate:clamp_(Number(d.rate !== undefined ? d.rate : speech.rate), 0.1, 10, 1),
        pitch:clamp_(Number(d.pitch !== undefined ? d.pitch : speech.pitch), 0, 2, 1),
        volume:clamp_(Number(d.volume !== undefined ? d.volume : speech.volume), 0, 1, 1)
      },
      frontendInstruction:'Read each chunk with window.speechSynthesis and save progress with tablegate.document.read.progress.save.'
    };
  }

  function readProgressSave_(payload) {
    var d = data_(payload);
    var a = actor_(payload);
    var documentId = cleanText_(d.documentId || '', 200);
    if (!documentId) throw new Error('Missing documentId.');
    requireOwnedRow_('Documents', 'DocumentId', documentId, a);
    var progressId = a.ownerKey + ':' + documentId;
    var existing = findRow_('ReadProgress', function (r) {
      return r.TenantKey === a.tenantKey && r.OwnerKey === a.ownerKey &&
        r.ServerId === a.serverId && r.DocumentId === documentId;
    });
    var now = isoNow_();
    var row = {
      TenantKey:a.tenantKey,
      ProgressId:progressId,
      OwnerKey:a.ownerKey,
      ServerId:a.serverId,
      DocumentId:documentId,
      CharacterIndex:Math.max(0, Number(d.characterIndex || 0)),
      ChunkIndex:Math.max(0, Number(d.chunkIndex || 0)),
      Percent:clamp_(Number(d.percent || 0), 0, 100, 0),
      Completed:String(d.completed === true),
      VoiceName:cleanText_(d.voiceName || '', 200),
      Language:cleanText_(d.language || 'en-US', 40),
      Rate:clamp_(Number(d.rate), 0.1, 10, 1),
      Pitch:clamp_(Number(d.pitch), 0, 2, 1),
      Volume:clamp_(Number(d.volume), 0, 1, 1),
      SourceDeviceId:deviceId_(payload),
      CreatedAt:existing ? existing.CreatedAt : now,
      UpdatedAt:now,
      MetaJson:json_(d.meta || {})
    };
    upsertBy_('ReadProgress', function (r) {
      return r.TenantKey === a.tenantKey && r.OwnerKey === a.ownerKey &&
        r.ServerId === a.serverId && r.DocumentId === documentId;
    }, row);
    return { ok:true, progress:publicReadProgress_(row) };
  }

  function readProgressGet_(payload) {
    var d = data_(payload);
    var a = actor_(payload);
    var documentId = String(d.documentId || '');
    var row = findRow_('ReadProgress', function (r) {
      return r.TenantKey === a.tenantKey && r.OwnerKey === a.ownerKey &&
        r.ServerId === a.serverId && r.DocumentId === documentId;
    });
    return { ok:true, found:Boolean(row), progress:row ? publicReadProgress_(row) : null };
  }

  function publicReadProgress_(r) {
    var out = publicRow_(r);
    out.completed = String(r.Completed) === 'true';
    out.meta = parseJson_(r.MetaJson, {});
    delete out.metaJson;
    return out;
  }

  /* ------------------------------------------------------------------------ */
  /* Summary and export                                                       */
  /* ------------------------------------------------------------------------ */

  function storageSummary_(payload) {
    var a = actor_(payload);
    var files = getRows_('Files').filter(function (r) {
      return r.TenantKey === a.tenantKey && r.OwnerKey === a.ownerKey &&
        r.ServerId === a.serverId && r.Status === 'active';
    });
    var docs = getRows_('Documents').filter(function (r) {
      return r.TenantKey === a.tenantKey && r.OwnerKey === a.ownerKey &&
        r.ServerId === a.serverId && r.Status === 'active';
    });
    var byCategory = {};
    files.forEach(function (r) {
      var key = r.Category || 'Uncategorized';
      byCategory[key] = byCategory[key] || { files:0, bytes:0 };
      byCategory[key].files++;
      byCategory[key].bytes += Number(r.SizeBytes || 0);
    });
    return {
      ok:true,
      tenantKey:a.tenantKey,
      ownerKey:a.ownerKey,
      serverId:a.serverId,
      activeFiles:files.length,
      activeDocuments:docs.length,
      totalStoredBytes:files.reduce(function (n, r) { return n + Number(r.SizeBytes || 0); }, 0),
      folders:getRows_('Folders').filter(function (r) {
        return r.TenantKey === a.tenantKey && r.OwnerKey === a.ownerKey && r.ServerId === a.serverId && r.Status === 'active';
      }).length,
      categories:getRows_('Categories').filter(function (r) {
        return r.TenantKey === a.tenantKey && r.OwnerKey === a.ownerKey && r.ServerId === a.serverId && r.Status === 'active';
      }).length,
      byCategory:byCategory
    };
  }

  function storageExport_(payload) {
    var a = actor_(payload);
    function owned(sheet) {
      return getRows_(sheet).filter(function (r) {
        return (!r.TenantKey || r.TenantKey === a.tenantKey) &&
          (!r.OwnerKey || r.OwnerKey === a.ownerKey) &&
          (!r.ServerId || r.ServerId === a.serverId);
      });
    }
    return {
      ok:true,
      schemaVersion:'tablegate-storage-accessibility-v1',
      exportedAt:isoNow_(),
      tenantKey:a.tenantKey,
      ownerKey:a.ownerKey,
      serverId:a.serverId,
      data:{
        files:owned('Files').map(publicFile_),
        documents:owned('Documents').map(publicDocument_),
        scans:owned('Scans').map(publicScan_),
        transcripts:owned('Transcripts').map(publicTranscript_),
        folders:owned('Folders').map(publicRow_),
        categories:owned('Categories').map(publicRow_),
        syncState:owned('SyncState').map(function (r) {
          var o = publicRow_(r);
          o.value = readStateFile_(r, null);
          return o;
        }),
        devices:owned('Devices').map(publicRow_),
        accessibility:owned('Accessibility').map(function (r) {
          var o = publicRow_(r);
          o.preferences = parseJson_(r.PreferencesJson, {});
          delete o.preferencesJson;
          return o;
        }),
        readProgress:owned('ReadProgress').map(publicReadProgress_)
      },
      limitations:['Binary Drive files are referenced by ID and URL rather than embedded in the JSON export.']
    };
  }

  /* ------------------------------------------------------------------------ */
  /* Spreadsheet and Drive storage helpers                                    */
  /* ------------------------------------------------------------------------ */

  function ensureDatabase_() {
    var props = PropertiesService.getScriptProperties();
    var ss = null;
    var foundKey = '';
    CONFIG.DATABASE_PROPERTY_KEYS.some(function (key) {
      var id = props.getProperty(key);
      if (!id) return false;
      try {
        ss = SpreadsheetApp.openById(id);
        foundKey = key;
        return true;
      } catch (_error) {
        return false;
      }
    });
    if (!ss) {
      ss = SpreadsheetApp.create('TableGate Backend Storage Database');
      foundKey = CONFIG.DATABASE_PROPERTY_KEYS[CONFIG.DATABASE_PROPERTY_KEYS.length - 1];
      props.setProperty(foundKey, ss.getId());
    }
    CONFIG.DATABASE_PROPERTY_KEYS.forEach(function (key) {
      if (!props.getProperty(key) && key.indexOf('BORROWED') >= 0) props.setProperty(key, ss.getId());
    });
    Object.keys(SHEETS).forEach(function (name) { ensureSheet_(name, ss); });
    return ss;
  }

  function ensureSheet_(logicalName, suppliedSpreadsheet) {
    var ss = suppliedSpreadsheet || ensureDatabase_();
    var name = CONFIG.SHEET_PREFIX + logicalName;
    var sheet = ss.getSheetByName(name) || ss.insertSheet(name);
    var headers = SHEETS[logicalName];
    if (!headers) throw new Error('Unknown sheet: ' + logicalName);
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.setFrozenRows(1);
      return sheet;
    }
    var currentWidth = Math.max(sheet.getLastColumn(), headers.length);
    var current = sheet.getRange(1, 1, 1, currentWidth).getValues()[0].map(function (v) { return String(v || ''); });
    var changed = false;
    headers.forEach(function (header, index) {
      if (!current[index]) {
        current[index] = header;
        changed = true;
      }
    });
    if (changed) sheet.getRange(1, 1, 1, current.length).setValues([current]);
    return sheet;
  }

  function getRows_(sheetName) {
    var sheet = ensureSheet_(sheetName);
    var values = sheet.getDataRange().getValues();
    if (values.length < 2) return [];
    var headers = values[0].map(String);
    return values.slice(1).filter(function (row) {
      return row.some(function (cell) { return cell !== ''; });
    }).map(function (row, index) {
      var out = { _row:index + 2 };
      headers.forEach(function (header, column) { out[header] = row[column]; });
      return out;
    });
  }

  function appendRow_(sheetName, row) {
    var sheet = ensureSheet_(sheetName);
    var headers = SHEETS[sheetName];
    sheet.appendRow(headers.map(function (header) {
      return row[header] !== undefined ? row[header] : '';
    }));
  }

  function updateRows_(sheetName, predicate, updater) {
    var sheet = ensureSheet_(sheetName);
    var values = sheet.getDataRange().getValues();
    if (values.length < 2) return 0;
    var headers = values[0].map(String);
    var count = 0;
    for (var i = 1; i < values.length; i++) {
      var row = {};
      headers.forEach(function (header, column) { row[header] = values[i][column]; });
      if (!predicate(row)) continue;
      row = updater(row) || row;
      sheet.getRange(i + 1, 1, 1, headers.length).setValues([headers.map(function (header) {
        return row[header] !== undefined ? row[header] : '';
      })]);
      count++;
    }
    return count;
  }

  function upsertBy_(sheetName, predicate, row) {
    var count = updateRows_(sheetName, predicate, function (existing) {
      var merged = merge_(existing, row);
      delete merged._row;
      return merged;
    });
    if (!count) appendRow_(sheetName, row);
    return row;
  }

  function findRow_(sheetName, predicate) {
    var rows = getRows_(sheetName);
    for (var i = 0; i < rows.length; i++) if (predicate(rows[i])) return rows[i];
    return null;
  }

  function requireOwnedRow_(sheetName, idField, value, actor) {
    if (!value) throw new Error('Missing ' + idField + '.');
    var row = findRow_(sheetName, function (r) {
      return r.TenantKey === actor.tenantKey && r.OwnerKey === actor.ownerKey &&
        (!r.ServerId || r.ServerId === actor.serverId) && String(r[idField]) === String(value);
    });
    if (!row) throw new Error(sheetName.replace(/s$/, '') + ' not found.');
    return row;
  }

  function ensureRootFolder_() {
    var props = PropertiesService.getScriptProperties();
    var folder = null;
    CONFIG.ROOT_FOLDER_PROPERTY_KEYS.some(function (key) {
      var id = props.getProperty(key);
      if (!id) return false;
      try {
        folder = DriveApp.getFolderById(id);
        return true;
      } catch (_error) {
        return false;
      }
    });
    if (!folder) {
      var matches = DriveApp.getFoldersByName(CONFIG.ROOT_FOLDER_NAME);
      folder = matches.hasNext() ? matches.next() : DriveApp.createFolder(CONFIG.ROOT_FOLDER_NAME);
      props.setProperty(CONFIG.ROOT_FOLDER_PROPERTY_KEYS[CONFIG.ROOT_FOLDER_PROPERTY_KEYS.length - 1], folder.getId());
    }
    return folder;
  }

  function ensureTenantBaseFolder_(actor) {
    var root = ensureRootFolder_();
    var tenant = findOrCreateFolder_(root, 'Tenant - ' + safeFolderName_(actor.tenantKey));
    var owner = findOrCreateFolder_(tenant, 'Owner - ' + safeFolderName_(actor.ownerKey));
    return findOrCreateFolder_(owner, 'Server - ' + safeFolderName_(actor.serverId));
  }

  function ensureTenantFolderPath_(actor, path) {
    var folder = ensureTenantBaseFolder_(actor);
    normalizePath_(path).split('/').forEach(function (name) {
      if (name) folder = findOrCreateFolder_(folder, safeFolderName_(name));
    });
    return folder;
  }

  function ensureDataFolder_(actor) {
    return findOrCreateFolder_(ensureTenantBaseFolder_(actor), CONFIG.DATA_FOLDER_NAME);
  }

  function findOrCreateFolder_(parent, name) {
    var matches = parent.getFoldersByName(name);
    return matches.hasNext() ? matches.next() : parent.createFolder(name);
  }

  function writeStateFile_(actor, key, serialized, existingDriveFileId) {
    var file = null;
    if (existingDriveFileId) {
      try { file = DriveApp.getFileById(existingDriveFileId); } catch (_error) {}
    }
    var name = stateFileName_(key);
    if (file) {
      file.setContent(serialized);
      try { file.setName(name); } catch (_renameError) {}
      return file;
    }
    var folder = ensureDataFolder_(actor);
    var matches = folder.getFilesByName(name);
    file = matches.hasNext() ? matches.next() : null;
    if (file) file.setContent(serialized);
    else file = folder.createFile(name, serialized, MimeType.PLAIN_TEXT);
    while (matches.hasNext()) {
      try { matches.next().setTrashed(true); } catch (_duplicateError) {}
    }
    return file;
  }

  function readStateFile_(row, fallback) {
    if (!row || !row.DriveFileId) return fallback;
    try {
      return JSON.parse(DriveApp.getFileById(row.DriveFileId).getBlob().getDataAsString('UTF-8'));
    } catch (_error) {
      return fallback;
    }
  }

  function stateFileName_(key) {
    var raw = String(key || 'state');
    var safe = cleanStateKey_(raw).slice(0, 90);
    var digest = Utilities.base64EncodeWebSafe(
      Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw, Utilities.Charset.UTF_8)
    ).replace(/=+$/g, '').slice(0, 16);
    return safe + '-' + digest + '.json';
  }

  /* ------------------------------------------------------------------------ */
  /* General helpers                                                          */
  /* ------------------------------------------------------------------------ */

  function audit_(actor, action, entityType, entityId, sourceDeviceId, detail) {
    try {
      appendRow_('Audit', {
        AuditId:id_('audit'),
        TenantKey:actor.tenantKey,
        OwnerKey:actor.ownerKey,
        ServerId:actor.serverId,
        Action:action,
        EntityType:entityType || '',
        EntityId:entityId || '',
        SourceDeviceId:sourceDeviceId || '',
        CreatedAt:isoNow_(),
        DetailJson:json_(detail || {})
      });
    } catch (_error) {}
  }

  function postWebhook_(url, apiKeyProperty, body) {
    var headers = {};
    var apiKey = getProperty_(apiKeyProperty);
    if (apiKey) headers.Authorization = 'Bearer ' + apiKey;
    try {
      var response = UrlFetchApp.fetch(url, {
        method:'post',
        contentType:'application/json',
        payload:JSON.stringify(body || {}),
        headers:headers,
        muteHttpExceptions:true
      });
      var code = response.getResponseCode();
      var text = response.getContentText().slice(0, 20000);
      return {
        ok:code >= 200 && code < 300,
        responseCode:code,
        responseText:text,
        parsed:parseJson_(text, {})
      };
    } catch (err) {
      return { ok:false, responseCode:0, responseText:'', parsed:{}, error:errorText_(err) };
    }
  }

  function getProperty_(key) {
    return String(PropertiesService.getScriptProperties().getProperty(key) || '').trim();
  }

  function paged_(rows, data, mapper, key, extra) {
    var offset = Math.max(0, Number(data.offset || 0));
    var limit = listLimit_(data.limit);
    var slice = rows.slice(offset, offset + limit).map(mapper || publicRow_);
    var out = {
      ok:true,
      offset:offset,
      limit:limit,
      total:rows.length,
      hasMore:offset + slice.length < rows.length
    };
    out[key] = slice;
    if (out.hasMore) out.nextOffset = offset + slice.length;
    return merge_(out, extra || {});
  }

  function listLimit_(value) {
    var n = Number(value || CONFIG.DEFAULT_LIST_LIMIT);
    if (!isFinite(n)) n = CONFIG.DEFAULT_LIST_LIMIT;
    return Math.max(1, Math.min(CONFIG.MAX_LIST_LIMIT, Math.floor(n)));
  }

  function publicRow_(row) {
    var out = {};
    Object.keys(row || {}).forEach(function (key) {
      if (key === '_row') return;
      out[key.charAt(0).toLowerCase() + key.slice(1)] = row[key];
    });
    return out;
  }

  function byUpdatedDesc_(a, b) {
    return String(b.UpdatedAt || b.CreatedAt || '').localeCompare(String(a.UpdatedAt || a.CreatedAt || ''));
  }

  function normalizePath_(value) {
    var raw = String(value || 'Uploads').replace(/\\/g, '/');
    var parts = raw.split('/').map(function (part) {
      return safeFolderName_(part.trim());
    }).filter(Boolean);
    return (parts.length ? parts : ['Uploads']).slice(0, 20).join('/');
  }

  function safeFolderName_(value) {
    return String(value || 'Folder').replace(/[\\/:*?"<>|]+/g, '_').replace(/\s+/g, ' ').trim().slice(0, 120) || 'Folder';
  }

  function safeFileName_(value) {
    return String(value || 'file').replace(/[\\/:*?"<>|]+/g, '_').trim().slice(0, 180) || 'file';
  }

  function cleanStateKey_(value) {
    return String(value || 'state').toLowerCase().replace(/[^a-z0-9._:-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 160) || 'state';
  }

  function cleanKey_(value) {
    return String(value || '').toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '').slice(0, 100) || 'shared';
  }

  function cleanText_(value, limit) {
    return String(value == null ? '' : value)
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
      .trim()
      .slice(0, limit || 4000);
  }

  function firstLine_(text) {
    return String(text || '').split(/\r?\n/)[0].trim();
  }

  function guessMime_(dataUrl) {
    var match = String(dataUrl || '').match(/^data:([^;]+)/);
    return match ? match[1] : '';
  }

  function sha256_(bytes) {
    var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, bytes);
    return digest.map(function (b) {
      var v = b < 0 ? b + 256 : b;
      return ('0' + v.toString(16)).slice(-2);
    }).join('');
  }

  function splitSpeechChunks_(text, maxChars) {
    text = String(text || '').trim();
    if (!text) return [];
    var paragraphs = text.split(/\n{2,}/);
    var chunks = [];
    var current = '';
    paragraphs.forEach(function (paragraph) {
      var sentences = paragraph.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [paragraph];
      sentences.forEach(function (sentence) {
        sentence = sentence.trim();
        if (!sentence) return;
        if (sentence.length > maxChars) {
          if (current) { chunks.push(current.trim()); current = ''; }
          for (var i = 0; i < sentence.length; i += maxChars) {
            chunks.push(sentence.slice(i, i + maxChars).trim());
          }
        } else if (!current) {
          current = sentence;
        } else if ((current + ' ' + sentence).length <= maxChars) {
          current += ' ' + sentence;
        } else {
          chunks.push(current.trim());
          current = sentence;
        }
      });
      if (current && (current.length > maxChars * 0.65 || paragraph === paragraphs[paragraphs.length - 1])) {
        chunks.push(current.trim());
        current = '';
      }
    });
    if (current) chunks.push(current.trim());
    return chunks.filter(Boolean);
  }

  function findChunkStart_(text, chunks, index) {
    var start = 0;
    for (var i = 0; i < index; i++) {
      var found = text.indexOf(chunks[i], start);
      start = found >= 0 ? found + chunks[i].length : start + chunks[i].length;
    }
    var current = text.indexOf(chunks[index], start);
    return current >= 0 ? current : start;
  }

  function normalizeReadableText_(text) {
    return String(text || '')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/^[#>*+\-\d.)\s]+/gm, '')
      .replace(/\s+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]{2,}/g, ' ')
      .trim();
  }

  function array_(value) {
    if (Array.isArray(value)) return value.slice();
    if (value === undefined || value === null || value === '') return [];
    return String(value).split(',').map(function (v) { return v.trim(); }).filter(Boolean);
  }

  function deepMerge_(base, incoming) {
    if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) return incoming !== undefined ? incoming : base;
    var out = {};
    Object.keys(base || {}).forEach(function (key) {
      var value = base[key];
      out[key] = value && typeof value === 'object' && !Array.isArray(value) ? deepMerge_(value, {}) : value;
    });
    Object.keys(incoming).forEach(function (key) {
      var value = incoming[key];
      if (value && typeof value === 'object' && !Array.isArray(value) &&
          out[key] && typeof out[key] === 'object' && !Array.isArray(out[key])) {
        out[key] = deepMerge_(out[key], value);
      } else {
        out[key] = value;
      }
    });
    return out;
  }

  function merge_(a, b) {
    var out = {};
    Object.keys(a || {}).forEach(function (key) { out[key] = a[key]; });
    Object.keys(b || {}).forEach(function (key) { out[key] = b[key]; });
    return out;
  }

  function parseJson_(value, fallback) {
    try { return JSON.parse(String(value || '')); } catch (_error) { return fallback; }
  }

  function json_(value) {
    return JSON.stringify(value === undefined ? null : value);
  }

  function clamp_(value, min, max, fallback) {
    if (!isFinite(value)) return fallback;
    return Math.max(min, Math.min(max, value));
  }

  function id_(prefix) {
    return String(prefix || 'id') + '_' + Utilities.getUuid().replace(/-/g, '').slice(0, 20);
  }

  function isoNow_() {
    return new Date().toISOString();
  }

  function errorText_(err) {
    return String(err && err.message ? err.message : err);
  }

  return Object.freeze({
    setup:setup_,
    health:health_,
    actions:function () { return ACTIONS.slice(); },
    handles:handles,
    route:route,
    version:function () { return CONFIG.VERSION; }
  });
})();

/** Optional direct setup alias; setupTablegate() already runs this module setup. */
function TABLEGATE_BORROWED_SETUP() {
  return TableGateBorrowed.setup();
}

/** Optional direct bridge for testing from the Apps Script editor. */
function TABLEGATE_BORROWED_ROUTE(action, payload) {
  return TableGateBorrowed.route(action, payload || {});
}

