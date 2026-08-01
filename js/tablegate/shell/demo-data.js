const ago = ms => new Date(Date.now() - ms).toISOString();
const later = ms => new Date(Date.now() + ms).toISOString();

export const DEMO_SEED = {
  user: {
    id:'usr_demo_william', email:'demo@tablegate.local', username:'William', discriminator:'0001',
    displayTag:'William#0001', bio:'Building free, accessible tools for every kind of tabletop group.',
    status:'ONLINE', customStatus:'Working on TableGate', ageBand:'ADULT', emailVerified:true,
    lastSeenAt:ago(30_000), createdAt:ago(38_000_000), trustSignals:{accountAgeDays:440,safetyOrientationCompleted:true}
  },
  tablegates: [
    {id:'tbl_songheart',name:'Songheart Chronicles',description:'A character-forward fantasy campaign with strong safety tools, collaborative worldbuilding, and room for new players.',isPublic:true,joinPolicy:'OPEN',visitorAccess:'OPEN',playerApprovalRequired:true,ownerProtectedFromPeerAdmins:true,tags:['D&D 5e','roleplay','accessible','LGBTQ+ friendly'],language:'English',adultOnly:false,maxMembers:18,memberCount:8,primarySystemId:'sys_dnd_5e_55e',systemMode:'SINGLE',joined:true,membershipType:'ADMIN',createdAt:ago(9_000_000),updatedAt:ago(10_000),owner:null},
    {id:'tbl_belavados',name:'Belavadös Galaxy Playtest',description:'Multi-party science-fantasy playtest space for the Belavadös Galaxy TTRPG System.',isPublic:true,joinPolicy:'OPEN',visitorAccess:'OPEN',playerApprovalRequired:true,tags:['Belavadös','playtest','science fantasy','multi-party'],language:'English',adultOnly:false,maxMembers:50,memberCount:23,primarySystemId:'sys_tablegate_generic',systemMode:'MULTI',joined:true,membershipType:'PLAYER',createdAt:ago(20_000_000),updatedAt:ago(55_000),owner:null},
    {id:'tbl_mistvale',name:'Mistvale Investigators',description:'Call of Cthulhu mysteries with content notes and structured session-zero expectations.',isPublic:true,joinPolicy:'OPEN',visitorAccess:'OPEN',playerApprovalRequired:true,tags:['Call of Cthulhu','mystery','weekends'],language:'English',adultOnly:false,maxMembers:12,memberCount:6,primarySystemId:'sys_coc_7e',systemMode:'SINGLE',joined:false,membershipType:'',createdAt:ago(14_000_000),updatedAt:ago(280_000),owner:null},
    {id:'tbl_wayfarers',name:'Sunday Wayfarers',description:'Beginner-friendly Pathfinder 2e group meeting online every other Sunday.',isPublic:true,joinPolicy:'OPEN',visitorAccess:'OPEN',playerApprovalRequired:true,tags:['Pathfinder 2e','beginner friendly','online'],language:'English',adultOnly:false,maxMembers:10,memberCount:7,primarySystemId:'sys_pf2e_remaster',systemMode:'SINGLE',joined:false,membershipType:'',createdAt:ago(4_000_000),updatedAt:ago(120_000),owner:null}
  ],
  categories: [
    {id:'cat_campaign',tablegateId:'tbl_songheart',name:'Campaign',position:10},
    {id:'cat_table',tablegateId:'tbl_songheart',name:'Table Talk',position:20},
    {id:'cat_voice',tablegateId:'tbl_songheart',name:'Voice & Video',position:30}
  ],
  channels: [
    {id:'chn_world',tablegateId:'tbl_songheart',categoryId:'cat_campaign',name:'worldbuilding',topic:'Campaign setting, lore, maps, and worldbuilding.',type:'TEXT',position:5,visitorMode:'READ'},
    {id:'chn_ic',tablegateId:'tbl_songheart',categoryId:'cat_campaign',name:'in-character',topic:'In-character scenes and downtime roleplay.',type:'TEXT',position:10,visitorMode:'READ'},
    {id:'chn_dice',tablegateId:'tbl_songheart',categoryId:'cat_campaign',name:'dice-rolls',topic:'Auditable dice rolls and rules checks.',type:'TEXT',position:20,visitorMode:'READ'},
    {id:'chn_handouts',tablegateId:'tbl_songheart',categoryId:'cat_campaign',name:'handouts',topic:'Maps, clues, and campaign handouts.',type:'HANDOUTS',position:30,visitorMode:'READ'},
    {id:'chn_general',tablegateId:'tbl_songheart',categoryId:'cat_table',name:'general',topic:'General conversation for Visitors, Players, Moderators, and Admins.',type:'TEXT',position:10,visitorMode:'CHAT',isSystem:true},
    {id:'chn_voice',tablegateId:'tbl_songheart',categoryId:'cat_voice',name:'table-voice',topic:'Main voice channel. Visitors are listen-only.',type:'VOICE',position:10,visitorMode:'OBSERVE'},
    {id:'chn_video',tablegateId:'tbl_songheart',categoryId:'cat_voice',name:'session-video',topic:'Optional camera and screen-sharing room.',type:'VIDEO',position:20,visitorMode:'OBSERVE'}
  ],
  roles: [
    {id:'rol_owner',tablegateId:'tbl_songheart',name:'Owner',color:'#D6A84B',permissions:8388607,position:110,isManaged:true,managedKey:'CREATOR'},
    {id:'rol_admin',tablegateId:'tbl_songheart',name:'Admin',color:'#00FFFF',permissions:8388607,position:100,isManaged:true,managedKey:'ADMIN'},
    {id:'rol_mod',tablegateId:'tbl_songheart',name:'Moderator',color:'#56ACFF',permissions:8378364,position:50,isManaged:true,managedKey:'MODERATOR'},
    {id:'rol_player',tablegateId:'tbl_songheart',name:'Player',color:'#65DA65',permissions:4658112,position:20,isManaged:true,managedKey:'PLAYER'},
    {id:'rol_visitor',tablegateId:'tbl_songheart',name:'Visitor',color:'#AAB9B9',permissions:384,position:10,isManaged:true,managedKey:'VISITOR'}
  ],
  members: [
    {id:'mem_william',tablegateId:'tbl_songheart',userId:'usr_demo_william',nickname:'William',joinedAt:ago(9_000_000),membershipType:'ADMIN',isOwner:true,ownerProtected:true,adminTitle:'MASTER_OF_LORE',roles:[]},
    {id:'mem_admin',tablegateId:'tbl_songheart',userId:'usr_admin',nickname:'Morgan',joinedAt:ago(8_900_000),membershipType:'ADMIN',isOwner:false,adminTitle:'GAME_MASTER',roles:[]},
    {id:'mem_jasper',tablegateId:'tbl_songheart',userId:'usr_jasper',nickname:'Jasper',joinedAt:ago(8_800_000),membershipType:'PLAYER',isOwner:false,roles:[]},
    {id:'mem_stephy',tablegateId:'tbl_songheart',userId:'usr_stephy',nickname:'Stephy',joinedAt:ago(7_100_000),membershipType:'PLAYER',isOwner:false,roles:[]},
    {id:'mem_jenn',tablegateId:'tbl_songheart',userId:'usr_jenn',nickname:'Jenn',joinedAt:ago(6_900_000),membershipType:'PLAYER',isOwner:false,roles:[]},
    {id:'mem_mod',tablegateId:'tbl_songheart',userId:'usr_mod',nickname:'Avery',joinedAt:ago(8_000_000),membershipType:'PLAYER',isOwner:false,roles:[]},
    {id:'mem_visitor',tablegateId:'tbl_songheart',userId:'usr_visitor',nickname:'Newcomer',joinedAt:ago(300_000),membershipType:'VISITOR',isOwner:false,roles:[]}
  ],
  users: [
    {id:'usr_demo_william',username:'William',discriminator:'0001',displayTag:'William#0001',status:'ONLINE',customStatus:'Working on TableGate',bio:'Building TableGate.'},
    {id:'usr_admin',username:'Morgan',discriminator:'0042',displayTag:'Morgan#0042',status:'ONLINE',customStatus:'Game Master on duty',bio:'Admin and campaign host.'},
    {id:'usr_jasper',username:'Jasper',discriminator:'1180',displayTag:'Jasper#1180',status:'ONLINE',customStatus:'V.A.T.S. engaged',bio:'Armorer artificer and Glamour bard.'},
    {id:'usr_stephy',username:'Stephy',discriminator:'2020',displayTag:'Stephy#2020',status:'IDLE',customStatus:'Coffee first',bio:'Wild magic and ancient oaths.'},
    {id:'usr_jenn',username:'Jenn',discriminator:'0707',displayTag:'Jenn#0707',status:'OFFLINE',customStatus:'',bio:'Heavy armor, big sword.'},
    {id:'usr_mod',username:'Avery',discriminator:'4482',displayTag:'Avery#4482',status:'ONLINE',customStatus:'Keeping the table welcoming',bio:'Moderator and safety facilitator.'},
    {id:'usr_visitor',username:'Newcomer',discriminator:'5521',displayTag:'Newcomer#5521',status:'ONLINE',customStatus:'Reading the lore',bio:'New to the group.'},
    {id:'usr_luna',username:'Luna',discriminator:'9921',displayTag:'Luna#9921',status:'ONLINE',customStatus:'Looking for Fate Core',bio:'Narrative-first player.'},
    {id:'usr_orion',username:'Orion',discriminator:'3133',displayTag:'Orion#3133',status:'IDLE',customStatus:'Sunday GM',bio:'Runs welcoming beginner games.'}
  ],
  messages: {
    chn_general: [
      {id:'msg_1',scopeType:'CHANNEL',scopeId:'chn_general',authorId:'usr_mod',content:'Welcome! Visitors can chat here while they look around. Player abilities open after an admin approves the application.',messageType:'CHAT',replyToId:'',attachmentIds:[],mentionUserIds:[],mentionRoleIds:[],mentionsEveryone:false,isPinned:true,createdAt:ago(420_000),updatedAt:ago(420_000),deletedAt:'',reactions:[{id:'rea_1',userId:'usr_jasper',emoji:'👋',createdAt:ago(400_000)}]},
      {id:'msg_2',scopeType:'CHANNEL',scopeId:'chn_general',authorId:'usr_jasper',content:'The new crest handout looks great. I added my character notes to the campaign area.',messageType:'CHAT',replyToId:'',attachmentIds:[],mentionUserIds:[],mentionRoleIds:[],mentionsEveryone:false,isPinned:false,createdAt:ago(270_000),updatedAt:ago(270_000),deletedAt:'',reactions:[{id:'rea_2',userId:'usr_demo_william',emoji:'✨',createdAt:ago(250_000)}]},
      {id:'msg_3',scopeType:'CHANNEL',scopeId:'chn_general',authorId:'usr_demo_william',content:'Perfect. Session starts at 7:00 PM Eastern. Text-only participation and no-camera play are both supported.',messageType:'CHAT',replyToId:'msg_2',attachmentIds:[],mentionUserIds:[],mentionRoleIds:[],mentionsEveryone:false,isPinned:false,createdAt:ago(180_000),updatedAt:ago(180_000),deletedAt:'',reactions:[]}
    ],
    chn_world: [
      {id:'msg_w1',scopeType:'CHANNEL',scopeId:'chn_world',authorId:'usr_demo_william',content:'The western road reaches the Aurelian observatory before the old wolf bridge. Add public notes here; private GM notes remain in the admin workspace.',messageType:'CHAT',replyToId:'',attachmentIds:[],mentionUserIds:[],mentionRoleIds:[],mentionsEveryone:false,isPinned:true,createdAt:ago(5_400_000),updatedAt:ago(5_400_000),deletedAt:'',reactions:[]}
    ]
  },
  dms: [
    {id:'dm_jasper',type:'DIRECT',name:'Jasper',ownerId:'',participants:[],createdAt:ago(4_000_000),updatedAt:ago(50_000)},
    {id:'dm_group',type:'GROUP',name:'Session Planning',ownerId:'usr_demo_william',participants:[],createdAt:ago(2_000_000),updatedAt:ago(220_000)}
  ],
  dmMessages: {
    dm_jasper:[
      {id:'dmsg_1',scopeType:'DM',scopeId:'dm_jasper',authorId:'usr_jasper',content:'Can you check whether the new player guide explains reactions clearly?',messageType:'CHAT',createdAt:ago(520_000),updatedAt:ago(520_000),deletedAt:'',reactions:[],attachmentIds:[]},
      {id:'dmsg_2',scopeType:'DM',scopeId:'dm_jasper',authorId:'usr_demo_william',content:'Yes. I will also add a one-page quick reference before the next session.',messageType:'CHAT',createdAt:ago(480_000),updatedAt:ago(480_000),deletedAt:'',reactions:[],attachmentIds:[]}
    ],
    dm_group:[
      {id:'dmsg_g1',scopeType:'DM',scopeId:'dm_group',authorId:'usr_stephy',content:'I can make Sunday. Coffee potion prepared.',messageType:'CHAT',createdAt:ago(280_000),updatedAt:ago(280_000),deletedAt:'',reactions:[],attachmentIds:[]}
    ]
  },
  friends: [
    {id:'fri_1',status:'ACCEPTED',direction:'OUTGOING',otherUser:null,createdAt:ago(8_000_000),updatedAt:ago(8_000_000)},
    {id:'fri_2',status:'PENDING',direction:'INCOMING',otherUser:null,createdAt:ago(200_000),updatedAt:ago(200_000)}
  ],
  notifications: [
    {id:'not_1',userId:'usr_demo_william',type:'PLAYER_APPLICATION',actorId:'usr_visitor',scopeType:'TABLEGATE',scopeId:'tbl_songheart',payload:{message:'I would like to join as a Player.'},readAt:'',createdAt:ago(95_000)},
    {id:'not_2',userId:'usr_demo_william',type:'FRIEND_REQUEST',actorId:'usr_luna',scopeType:'USER',scopeId:'usr_luna',payload:{},readAt:'',createdAt:ago(190_000)},
    {id:'not_3',userId:'usr_demo_william',type:'GROUP_FINDER_INTEREST',actorId:'usr_orion',scopeType:'GROUP_FINDER_POST',scopeId:'gfp_1',payload:{},readAt:ago(60_000),createdAt:ago(900_000)}
  ],
  finderPosts: [
    {id:'gfp_1',owner:null,tablegate:null,postType:'LOOKING_FOR_PLAYERS',title:'Two players wanted for a narrative fantasy campaign',body:'Biweekly online campaign with strong character hooks, flexible attendance, and clear content boundaries.',desiredRoles:['PLAYER'],offeredRoles:['MASTER_OF_LORE'],systemIds:['sys_dnd_5e_55e'],customSystems:[],tags:['roleplay','beginner friendly','text supported'],playMode:'ONLINE_OK',publicLocation:null,radiusBand:'ONLINE',schedule:{days:['Saturday'],time:'7:00 PM'},timezone:'America/New_York',languages:['English'],experienceLevel:'ALL',accessibility:{textOnly:true,noCamera:true,breaks:true},safetyTools:{linesAndVeils:true,xCard:true,openDoor:true},contentBoundaries:{},agePolicy:'ALL_AGES_WITH_GUARDIAN_RULES',seatsAvailable:2,status:'RECRUITING',visibility:'PUBLIC',contactPolicy:'INTEREST_THEN_LOBBY',isRightNow:false,lastReconfirmedAt:ago(250_000),freshnessState:'FRESH',createdAt:ago(2_000_000),updatedAt:ago(250_000),ownedByViewer:true,interest:null,eligible:true,matchScore:94,matchReasons:['Schedule match','Role match','Accessibility preferences align'],confidence:'HIGH',sharedAnswerCount:12,flexibleMismatches:[],distanceBand:'ONLINE',safetyNotice:'Compatibility is not a safety clearance.'},
    {id:'gfp_2',owner:null,tablegate:null,postType:'RIGHT_NOW',title:'Right Now: one-shot needs one more player',body:'Daggerheart one-shot starting in about 40 minutes. Application still required; urgency does not bypass screening.',desiredRoles:['PLAYER'],offeredRoles:['GM'],systemIds:['sys_daggerheart'],customSystems:[],tags:['one-shot','right now','online'],playMode:'ONLINE_ONLY',publicLocation:null,radiusBand:'ONLINE',schedule:{startsAt:later(2_400_000)},timezone:'America/Chicago',languages:['English'],experienceLevel:'BEGINNER_OK',accessibility:{noCamera:true},safetyTools:{xCard:true,openDoor:true},contentBoundaries:{},agePolicy:'ADULT_ONLY',seatsAvailable:1,status:'RECRUITING',visibility:'PUBLIC',contactPolicy:'APPLICATION_THEN_LOBBY',isRightNow:true,rightNowUntil:later(3_000_000),lastReconfirmedAt:ago(20_000),freshnessState:'RIGHT_NOW',createdAt:ago(40_000),updatedAt:ago(20_000),ownedByViewer:false,interest:null,eligible:true,matchScore:82,matchReasons:['Role match','Online mode'],confidence:'MEDIUM',sharedAnswerCount:7,flexibleMismatches:['Short notice'],distanceBand:'ONLINE',safetyNotice:'Compatibility is not a safety clearance.'},
    {id:'gfp_3',owner:null,tablegate:null,postType:'LOOKING_FOR_GROUP',title:'Player seeking accessible Pathfinder 2e group',body:'Looking for a patient group that supports text chat alongside voice and scheduled breaks.',desiredRoles:['GM','PLAYER'],offeredRoles:['PLAYER'],systemIds:['sys_pf2e_remaster'],customSystems:[],tags:['accessible','Pathfinder 2e','weekends'],playMode:'ONLINE_OK',publicLocation:null,radiusBand:'ONLINE',schedule:{days:['Sunday']},timezone:'America/New_York',languages:['English'],experienceLevel:'NEW',accessibility:{textOnly:true,scheduledBreaks:true},safetyTools:{},contentBoundaries:{},agePolicy:'ALL_AGES_WITH_GUARDIAN_RULES',seatsAvailable:0,status:'ACTIVE',visibility:'PUBLIC',contactPolicy:'INTEREST_THEN_LOBBY',isRightNow:false,lastReconfirmedAt:ago(600_000),freshnessState:'FRESH',createdAt:ago(3_000_000),updatedAt:ago(600_000),ownedByViewer:false,interest:null,eligible:true,matchScore:88,matchReasons:['System match','Accessibility match'],confidence:'HIGH',sharedAnswerCount:10,flexibleMismatches:[],distanceBand:'ONLINE',safetyNotice:'Compatibility is not a safety clearance.'}
  ],
  joinRequests: [
    {id:'join_luna',tablegateId:'tbl_songheart',userId:'usr_luna',status:'PENDING',message:'I am interested in observing first and learning the group rules before applying as a Player.',createdAt:ago(175_000),updatedAt:ago(175_000)}
  ],
  applications: [
    {id:'app_visitor',tablegateId:'tbl_songheart',userId:'usr_visitor',status:'PENDING',message:'I would like to join as a Player. I have played once before and I read the group rules.',createdAt:ago(130_000),updatedAt:ago(130_000)}
  ],
  safetyRelations: [],
  safetyReports: [],
  safetyJournals: [],
  publicEvents: [{id:'event_demo_1',title:'Library Beginner TTRPG Night',description:'Public all-ages teaching tables with visible safety tools.',startsAt:later(172800000),systemIds:['sys_tablegate_generic'],distanceBand:'WITHIN_10_MILES'}],
  publicVenues: [{id:'venue_demo_1',label:'Downtown Public Library',placeType:'LIBRARY',city:'Example City',region:'NY',country:'US',distanceBand:'WITHIN_10_MILES',accessibilityNotes:'Step-free entrance and accessible restrooms.'}],
  profileSync: {revision:0,value:null}
};

export function freshDemoData() {
  const data = structuredClone(DEMO_SEED);
  const users = Object.fromEntries(data.users.map(u => [u.id, u]));
  data.tablegates.forEach(t => { t.owner = users[t.id === 'tbl_songheart' ? 'usr_demo_william' : 'usr_orion'] || users.usr_demo_william; });
  data.members.forEach(m => {
    m.user = users[m.userId];
    const roleKey = m.isOwner ? 'CREATOR' : m.userId === 'usr_mod' ? 'MODERATOR' : m.membershipType === 'ADMIN' ? 'ADMIN' : m.membershipType === 'PLAYER' ? 'PLAYER' : 'VISITOR';
    m.roles = data.roles.filter(r => r.managedKey === roleKey);
  });
  data.dms[0].participants = [
    {userId:'usr_demo_william',user:users.usr_demo_william}, {userId:'usr_jasper',user:users.usr_jasper}
  ];
  data.dms[1].participants = ['usr_demo_william','usr_jasper','usr_stephy'].map(userId => ({userId,user:users[userId]}));
  data.friends[0].otherUser = users.usr_jasper;
  data.friends[1].otherUser = users.usr_luna;
  data.finderPosts[0].owner = users.usr_demo_william;
  data.finderPosts[1].owner = users.usr_orion;
  data.finderPosts[2].owner = users.usr_luna;
  Object.values(data.messages).flat().forEach(m => { m.author = users[m.authorId]; });
  Object.values(data.dmMessages).flat().forEach(m => { m.author = users[m.authorId]; });
  return data;
}
