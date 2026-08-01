import { CONFIG } from './config.js';
import { freshDemoData } from './demo-data.js';
import { array, parseTags, uid } from './utils.js';

export class ApiError extends Error {
  constructor(code, message, details = null) { super(message); this.name = 'ApiError'; this.code = code || 'REQUEST_FAILED'; this.details = details; }
}

export class TableGateApi {
  constructor({url = CONFIG.BACKEND_URL, token = '', timeout = CONFIG.REQUEST_TIMEOUT_MS} = {}) {
    this.url = url; this.token = token; this.timeout = timeout; this.meta = {tablegateTime:null, apiVersion:null};
  }
  setToken(token = '') { this.token = token; }
  async parseResponse(response) {
    const text = await response.text();
    let json;
    try { json = JSON.parse(text); }
    catch {
      const sample = text.slice(0, 800);
      const looksLikeLogin = /accounts\.google|ServiceLogin|Sign in - Google/i.test(sample);
      const looksLikeHtml = /^\s*</.test(sample);
      const message = looksLikeLogin
        ? 'The Apps Script deployment is not public. Redeploy it as “Execute as me” with access set to “Anyone”.'
        : looksLikeHtml
          ? 'The backend returned an HTML page instead of TableGate JSON. Check the Apps Script deployment URL and access settings.'
          : 'The TableGate backend returned a non-JSON response.';
      throw new ApiError('INVALID_RESPONSE', message, {status:response.status, sample});
    }
    this.meta = {tablegateTime:json.tablegateTime || null, apiVersion:json.apiVersion || null};
    if (!json.ok) throw new ApiError(json.error?.code, json.error?.message || 'The request failed.', json.error?.details);
    return json.data;
  }
  async request(action, payload = {}, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.timeout || this.timeout);
    const body = {action, ...payload};
    if (options.auth !== false && this.token) body.token = this.token;
    try {
      const response = await fetch(this.url, {
        method:'POST', mode:'cors', credentials:'omit',
        headers:{'Content-Type':'text/plain;charset=utf-8','Accept':'application/json'},
        body:JSON.stringify(body), signal:controller.signal, redirect:'follow', cache:'no-store', referrerPolicy:'no-referrer'
      });
      return await this.parseResponse(response);
    } catch (error) {
      if (error.name === 'AbortError') throw new ApiError('TIMEOUT', 'The TableGate backend took too long to respond.');
      if (error instanceof ApiError) throw error;
      throw new ApiError('NETWORK_ERROR', 'Could not reach the TableGate backend. Confirm the web app is deployed for Anyone and that setupTablegate() has been run.', error.message);
    } finally { clearTimeout(timer); }
  }
  async health() {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Math.min(this.timeout, 8000));
    try {
      const join = this.url.includes('?') ? '&' : '?';
      const response = await fetch(`${this.url}${join}action=health&_=${Date.now()}`, {
        method:'GET', mode:'cors', credentials:'omit', signal:controller.signal,
        redirect:'follow', cache:'no-store', referrerPolicy:'no-referrer', headers:{'Accept':'application/json'}
      });
      return await this.parseResponse(response);
    } catch (error) {
      if (error.name === 'AbortError') throw new ApiError('TIMEOUT', 'The TableGate backend took too long to respond.');
      if (error instanceof ApiError) throw error;
      return this.request('health', {}, {auth:false});
    } finally { clearTimeout(timer); }
  }
}

export class DemoApi {
  constructor() { this.token = 'demo_token'; this.data = this.load(); }
  setToken(token = '') { this.token = token; }
  load() {
    try { const saved = localStorage.getItem(CONFIG.STORAGE_KEYS.DEMO_STATE); if (saved) return JSON.parse(saved); } catch {}
    return freshDemoData();
  }
  save() { try { localStorage.setItem(CONFIG.STORAGE_KEYS.DEMO_STATE, JSON.stringify(this.data)); } catch {} }
  reset() { this.data = freshDemoData(); this.save(); }
  user(id) { return this.data.users.find(u => u.id === id) || null; }
  hydrateMessage(message) { const attachments = (message.attachments?.length ? message.attachments : array(message.attachmentIds).map(id => (this.data.attachments || []).find(a => a.id === id)).filter(Boolean)); return {...message, author:message.author || this.user(message.authorId), reactions:message.reactions || [], attachments}; }
  async request(action, p = {}) {
    await new Promise(resolve => setTimeout(resolve, 70));
    const d = this.data;
    switch (action) {
      case 'health': return {app:'TableGate',apiVersion:'8.0.0-final',productModel:'COMPLETELY_FREE',status:'DEMO'};
      case 'getTablegatePlatformPolicy': return {productModel:'COMPLETELY_FREE',coreFeaturesAlwaysFree:true,paidRankingAllowed:false,paidContactAllowed:false,paidSafetyAllowed:false};
      case 'login': return {user:d.user,token:this.token,session:{id:'ses_demo'}};
      case 'register': return {user:d.user,token:this.token,session:{id:'ses_demo'},verificationRequired:false};
      case 'requestEmailVerification': return {requested:true};
      case 'verifyEmail': return {verified:true,user:d.user,token:this.token,session:{id:'ses_demo'}};
      case 'forgotPassword': return {requested:true};
      case 'resetPassword': return {reset:true};
      case 'logout': return {loggedOut:true};
      case 'me': return {user:d.user,tablegates:d.tablegates.filter(t => t.joined)};
      case 'updateProfile': Object.assign(d.user, p); this.save(); return {user:d.user};
      case 'listTablegates': return d.tablegates.filter(t => t.joined);
      case 'browsePublicTablegates':
      case 'discoverTablegates': {
        const q = String(p.q || p.query || '').toLowerCase(); const tags = array(p.tags);
        const items = d.tablegates.filter(t => t.isPublic && (!q || `${t.name} ${t.description} ${t.tags.join(' ')}`.toLowerCase().includes(q)) && (!tags.length || tags.some(tag => t.tags.map(x=>x.toLowerCase()).includes(String(tag).toLowerCase()))));
        return {total:items.length,offset:0,limit:100,items};
      }
      case 'createTablegate': {
        const id = uid('tbl'); const now = new Date().toISOString();
        const tablegate = {id,name:p.name || 'New TableGate',description:p.description || '',isPublic:p.isPublic !== false,joinPolicy:p.isPublic === false ? 'INVITE_ONLY':'OPEN',visitorAccess:p.isPublic === false?'INVITE_ONLY':'OPEN',playerApprovalRequired:true,ownerProtectedFromPeerAdmins:true,tags:parseTags(p.tags),language:p.language || 'English',adultOnly:false,maxMembers:Number(p.maxMembers)||0,memberCount:1,primarySystemId:p.systemId || 'sys_tablegate_generic',systemMode:p.systemMode || 'SYSTEM_AGNOSTIC',joined:true,membershipType:'ADMIN',owner:d.user,hostTitle:p.hostTitle||'',defaultAdminTitle:p.defaultAdminTitle||'ADMIN',createdAt:now,updatedAt:now};
        const ownerRole={id:uid('rol'),tablegateId:id,name:'Owner',color:'#D6A84B',permissions:8388607,position:110,isManaged:true,managedKey:'CREATOR'};
        const adminRole={id:uid('rol'),tablegateId:id,name:'Admin',color:'#00FFFF',permissions:8388607,position:100,isManaged:true,managedKey:'ADMIN'};
        const modRole={id:uid('rol'),tablegateId:id,name:'Moderator',color:'#56ACFF',permissions:8378364,position:50,isManaged:true,managedKey:'MODERATOR'};
        const playerRole={id:uid('rol'),tablegateId:id,name:'Player',color:'#65DA65',permissions:4658112,position:20,isManaged:true,managedKey:'PLAYER'};
        const visitorRole={id:uid('rol'),tablegateId:id,name:'Visitor',color:'#AAB9B9',permissions:384,position:10,isManaged:true,managedKey:'VISITOR'};
        const catCommunity={id:uid('cat'),tablegateId:id,name:'Community',position:10};
        const catCampaign={id:uid('cat'),tablegateId:id,name:'Campaign',position:20};
        const general={id:uid('chn'),tablegateId:id,categoryId:catCommunity.id,name:'general',topic:'General TableGate conversation.',type:'TEXT',position:10,visitorMode:'CHAT',isSystem:true};
        const world={id:uid('chn'),tablegateId:id,categoryId:catCampaign.id,name:'worldbuilding',topic:'Lore, setting, maps, and campaign notes.',type:'TEXT',position:10,visitorMode:'READ'};
        const session={id:uid('chn'),tablegateId:id,categoryId:catCampaign.id,name:'session-chat',topic:'Approved Player session chat.',type:'TEXT',position:20,visitorMode:'OBSERVE'};
        const member={id:uid('mem'),tablegateId:id,userId:d.user.id,nickname:d.user.username,joinedAt:now,membershipType:'ADMIN',isOwner:true,ownerProtected:true,adminTitle:p.defaultAdminTitle||'ADMIN',roles:[ownerRole],user:d.user};
        d.tablegates.unshift(tablegate); d.roles.push(ownerRole,adminRole,modRole,playerRole,visitorRole); d.categories.push(catCommunity,catCampaign); d.channels.push(general,world,session); d.members.push(member); d.messages[general.id]=[]; d.messages[world.id]=[]; d.messages[session.id]=[];
        this.save(); return {tablegate,channels:[general,world,session],invite:{code:'DEMO-INVITE',shareUrl:`?invite=DEMO-INVITE`},visitorPolicy:{publicVisitorsJoinOpenly:tablegate.isPublic,playerApprovalRequired:true}};
      }
      case 'getTablegate': {
        const t = d.tablegates.find(x => x.id === p.tablegateId); if (!t) throw new ApiError('TABLEGATE_NOT_FOUND','TableGate not found.');
        let members=d.members.filter(m=>m.tablegateId===t.id); let member=members.find(m=>m.userId===d.user.id);
        if(!member&&t.joined){member={id:uid('mem'),tablegateId:t.id,userId:d.user.id,membershipType:t.membershipType||'PLAYER',isOwner:false,roles:[],user:d.user};members=[...members,member];}
        const roleType=member?.membershipType||t.membershipType||'VISITOR';
        const permissions=member?.isOwner||roleType==='ADMIN'?8388607:roleType==='PLAYER'?4658112:384;
        return {tablegate:t,member,membershipType:roleType,playerApprovalRequired:roleType==='VISITOR',permissions,categories:d.categories.filter(c=>c.tablegateId===t.id),channels:d.channels.filter(c=>c.tablegateId===t.id),roles:d.roles.filter(r=>r.tablegateId===t.id),members,systems:[],systemConfig:{},houseRules:t.houseRules||{},safetyTools:t.safetyTools||{},ownershipPolicy:{ownerProtectedFromPeerAdmins:true}};
      }
      case 'joinPublicTablegate': {
        const t=d.tablegates.find(x=>x.id===p.tablegateId); t.joined=true; t.membershipType='VISITOR'; t.memberCount++; if(!d.members.some(m=>m.tablegateId===t.id&&m.userId===d.user.id)){const role=d.roles.find(r=>r.tablegateId===t.id&&r.managedKey==='VISITOR');d.members.push({id:uid('mem'),tablegateId:t.id,userId:d.user.id,nickname:d.user.username,joinedAt:new Date().toISOString(),membershipType:'VISITOR',isOwner:false,roles:role?[role]:[],user:d.user});} this.save(); return {joined:true,membershipType:'VISITOR',tablegate:t};
      }
      case 'updateTablegate': { const t=d.tablegates.find(x=>x.id===p.tablegateId); if(!t)throw new ApiError('TABLEGATE_NOT_FOUND','TableGate not found.'); Object.assign(t,{...p,id:t.id,updatedAt:new Date().toISOString()}); delete t.tablegateId; this.save(); return {tablegate:t}; }
      case 'createChannel': { const channel={id:uid('chn'),tablegateId:p.tablegateId,categoryId:p.categoryId||'',name:p.name,topic:p.topic||'',type:p.type||p.channelType||'TEXT',position:Number(p.position)||999,visitorMode:p.visitorMode||'READ',isPrivate:Boolean(p.isPrivate),allowedRoleIds:array(p.allowedRoleIds),slowmodeSeconds:Number(p.slowmodeSeconds)||0}; d.channels.push(channel); d.messages[channel.id]=[]; this.save(); return channel; }
      case 'createInvite': { const invite={id:uid('inv'),tablegateId:p.tablegateId,code:`DEMO-${Math.random().toString(36).slice(2,8).toUpperCase()}`,maxUses:Number(p.maxUses)||0,uses:0,expiresAt:p.expiresInHours?new Date(Date.now()+Number(p.expiresInHours)*3600000).toISOString():'',createdAt:new Date().toISOString()}; d.invites=d.invites||[];d.invites.push(invite);this.save();return invite; }
      case 'previewInvite': { const invite=(d.invites||[]).find(x=>x.code===(p.inviteCode||p.code)); const t=invite?d.tablegates.find(x=>x.id===invite.tablegateId):d.tablegates[0]; return {invite,tablegate:t}; }
      case 'joinInvite': { const invite=(d.invites||[]).find(x=>x.code===(p.inviteCode||p.code)); const t=invite?d.tablegates.find(x=>x.id===invite.tablegateId):d.tablegates[0]; if(!t)throw new ApiError('INVITE_NOT_FOUND','Invite not found.'); t.joined=true;t.membershipType='VISITOR';this.save();return {joined:true,tablegateId:t.id,tablegate:t}; }
      case 'requestTablegateJoin': { const request={id:uid('join'),tablegateId:p.tablegateId,userId:d.user.id,status:'PENDING',message:p.message||'',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};d.joinRequests=d.joinRequests||[];d.joinRequests.push(request);this.save();return request; }
      case 'listTablegateJoinRequests': return (d.joinRequests||[]).filter(r=>r.tablegateId===p.tablegateId&&(!p.status||r.status===p.status)).map(r=>({...r,user:this.user(r.userId)}));
      case 'respondTablegateJoinRequest': { const request=(d.joinRequests||[]).find(r=>r.id===p.requestId);if(request){request.status=(p.accept===true||p.status==='APPROVED')?'APPROVED':'DECLINED';if(request.status==='APPROVED'&&!d.members.some(m=>m.tablegateId===request.tablegateId&&m.userId===request.userId)){const role=d.roles.find(r=>r.tablegateId===request.tablegateId&&r.managedKey==='VISITOR');const user=this.user(request.userId);d.members.push({id:uid('mem'),tablegateId:request.tablegateId,userId:request.userId,nickname:user?.username||'',joinedAt:new Date().toISOString(),membershipType:'VISITOR',isOwner:false,roles:role?[role]:[],user});}}this.save();return {request}; }
      case 'leaveTablegate': { const t=d.tablegates.find(x=>x.id===p.tablegateId);if(t){t.joined=false;t.membershipType='';t.memberCount=Math.max(0,Number(t.memberCount||0)-1);}d.members=d.members.filter(m=>!(m.tablegateId===p.tablegateId&&m.userId===d.user.id));this.save();return {left:true}; }
      case 'requestPlayerApproval': {
        const existing=d.applications.find(a=>a.userId===d.user.id&&a.tablegateId===p.tablegateId&&a.status==='PENDING');
        if (existing) return existing;
        const app={id:uid('app'),tablegateId:p.tablegateId,userId:d.user.id,status:'PENDING',message:p.message||'',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}; d.applications.push(app); this.save(); return app;
      }
      case 'listPlayerApplications': return d.applications.filter(a=>a.tablegateId===p.tablegateId && (!p.status || a.status===p.status)).map(a=>({...a,user:this.user(a.userId)}));
      case 'respondPlayerApplication': {
        const app=d.applications.find(a=>a.id===p.applicationId); if(app){app.status=(p.accept===true||p.status==='APPROVED')?'APPROVED':'DECLINED';if(app.status==='APPROVED'){const member=d.members.find(m=>m.tablegateId===app.tablegateId&&m.userId===app.userId);const role=d.roles.find(r=>r.tablegateId===app.tablegateId&&r.managedKey==='PLAYER');if(member){member.membershipType='PLAYER';member.roles=role?[role]:member.roles;}}} this.save(); return {application:app};
      }
      case 'approvePlayer': { const member=d.members.find(m=>m.tablegateId===p.tablegateId&&m.userId===p.userId);const role=d.roles.find(r=>r.tablegateId===p.tablegateId&&r.managedKey==='PLAYER');if(member){member.membershipType='PLAYER';member.roles=role?[role]:member.roles;}this.save();return {approved:true,member}; }
      case 'revokePlayer': { const member=d.members.find(m=>m.tablegateId===p.tablegateId&&m.userId===p.userId);const role=d.roles.find(r=>r.tablegateId===p.tablegateId&&r.managedKey==='VISITOR');if(member){member.membershipType='VISITOR';member.roles=role?[role]:member.roles;}this.save();return {revoked:true,member}; }
      case 'kickMember': { d.members=d.members.filter(m=>!(m.tablegateId===p.tablegateId&&m.userId===p.userId));this.save();return {kicked:true}; }
      case 'banMember': { d.members=d.members.filter(m=>!(m.tablegateId===p.tablegateId&&m.userId===p.userId));d.bans=d.bans||[];d.bans.push({id:uid('ban'),tablegateId:p.tablegateId,userId:p.userId,reason:p.reason||'',createdAt:new Date().toISOString()});this.save();return {banned:true}; }
      case 'listMembers': return d.members.filter(m=>m.tablegateId===p.tablegateId);
      case 'listRoles': return d.roles.filter(r=>r.tablegateId===p.tablegateId);
      case 'listCategories': return d.categories.filter(c=>c.tablegateId===p.tablegateId);
      case 'listChannels': return d.channels.filter(c=>c.tablegateId===p.tablegateId);
      case 'listMessages': {
        const id=p.scopeId||p.channelId||p.dmId; const source=(p.scopeType==='DM'||p.dmId)?d.dmMessages:d.messages;
        return {messages:(source[id]||[]).map(m=>this.hydrateMessage(m)),nextCursor:'',hasMore:false};
      }
      case 'sendMessage': {
        const scopeType=(p.scopeType||'CHANNEL').toUpperCase(); const id=p.scopeId||p.channelId||p.dmId; const source=scopeType==='DM'?d.dmMessages:d.messages; if(!source[id]) source[id]=[];
        const message={id:uid('msg'),scopeType,scopeId:id,authorId:d.user.id,author:d.user,content:String(p.content||''),messageType:p.messageType||'CHAT',replyToId:p.replyToId||'',attachmentIds:array(p.attachmentIds),attachments:array(p.attachmentIds).map(aid=>(d.attachments||[]).find(a=>a.id===aid)).filter(Boolean),mentionUserIds:array(p.mentionUserIds),mentionRoleIds:array(p.mentionRoleIds),mentionsEveryone:Boolean(p.mentionsEveryone),isPinned:false,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),deletedAt:'',reactions:[]};
        source[id].push(message); this.save(); return message;
      }
      case 'editMessage': {
        const all=[...Object.values(d.messages).flat(),...Object.values(d.dmMessages).flat()]; const m=all.find(x=>x.id===p.messageId); if(m){m.content=p.content;m.updatedAt=new Date().toISOString();m.editedAt=m.updatedAt;} this.save(); return this.hydrateMessage(m);
      }
      case 'deleteMessage': {
        const all=[...Object.values(d.messages).flat(),...Object.values(d.dmMessages).flat()]; const m=all.find(x=>x.id===p.messageId); if(m)m.deletedAt=new Date().toISOString(); this.save(); return {deleted:true};
      }
      case 'addReaction': {
        const all=[...Object.values(d.messages).flat(),...Object.values(d.dmMessages).flat()]; const m=all.find(x=>x.id===p.messageId); if(m&&!m.reactions.some(r=>r.userId===d.user.id&&r.emoji===p.emoji))m.reactions.push({id:uid('rea'),userId:d.user.id,emoji:p.emoji,createdAt:new Date().toISOString()}); this.save(); return {added:true};
      }
      case 'removeReaction': {
        const all=[...Object.values(d.messages).flat(),...Object.values(d.dmMessages).flat()]; const m=all.find(x=>x.id===p.messageId); if(m)m.reactions=m.reactions.filter(r=>!(r.userId===d.user.id&&r.emoji===p.emoji)); this.save(); return {removed:true};
      }
      case 'searchMessages': {
        const id=p.scopeId||p.channelId||p.dmId; const source=(p.scopeType==='DM'||p.dmId)?d.dmMessages:d.messages; const q=String(p.q||p.query||'').toLowerCase(); return {messages:(source[id]||[]).filter(m=>m.content.toLowerCase().includes(q)).map(m=>this.hydrateMessage(m))};
      }
      case 'startTyping': return {typing:true};
      case 'listTyping': return [];
      case 'markRead': return {read:true,lastReadAt:new Date().toISOString()};
      case 'unreadCounts': return {};
      case 'listDms': return d.dms.map(dm=>({...dm,lastMessage:(d.dmMessages[dm.id]||[]).at(-1)||null}));
      case 'getDm': { const dm=d.dms.find(x=>x.id===p.dmId); return {dm,messages:(d.dmMessages[p.dmId]||[]).map(m=>this.hydrateMessage(m))}; }
      case 'createDm': {
        const target=this.user(p.recipientId||p.userId); const dm={id:uid('dm'),type:'DIRECT',name:target?.username||'Direct message',participants:[{userId:d.user.id,user:d.user},{userId:target?.id,user:target}],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}; d.dms.unshift(dm); d.dmMessages[dm.id]=[]; this.save(); return dm;
      }
      case 'createGroupDm': {
        const ids=array(p.recipientIds); const dm={id:uid('dm'),type:'GROUP',name:p.name||'Group DM',ownerId:d.user.id,participants:[d.user.id,...ids].map(id=>({userId:id,user:this.user(id)})).filter(x=>x.user),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}; d.dms.unshift(dm);d.dmMessages[dm.id]=[];this.save();return dm;
      }
      case 'uploadAttachment': { d.attachments=d.attachments||[];const attachment={id:uid('att'),originalName:p.originalName||p.fileName||'attachment',fileName:p.fileName||'attachment',mimeType:p.mimeType||'application/octet-stream',base64:p.base64||'',sizeBytes:Math.round((p.base64||'').length*0.75),createdAt:new Date().toISOString()};d.attachments.push(attachment);this.save();return attachment; }
      case 'downloadAttachment': { const attachment=(d.attachments||[]).find(a=>a.id===p.attachmentId);if(!attachment)throw new ApiError('ATTACHMENT_NOT_FOUND','Attachment not found.');return attachment; }
      case 'searchUsers': { const q=String(p.q||p.query||'').toLowerCase(); return d.users.filter(u=>u.id!==d.user.id&&(!q||`${u.username}#${u.discriminator} ${u.bio}`.toLowerCase().includes(q))).slice(0,Number(p.limit)||30); }
      case 'listFriends': return d.friends;
      case 'sendFriendRequest': { const target=this.user(p.userId)||d.users.find(u=>u.username.toLowerCase()===String(p.username||p.tag||'').split('#')[0].toLowerCase()); if(!target)throw new ApiError('USER_NOT_FOUND','User not found.');const f={id:uid('fri'),status:'PENDING',direction:'OUTGOING',otherUser:target,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};d.friends.push(f);this.save();return f; }
      case 'acceptFriend': { const f=d.friends.find(x=>x.id===p.friendshipId);if(f)f.status='ACCEPTED';this.save();return f; }
      case 'declineFriend': { const f=d.friends.find(x=>x.id===p.friendshipId);if(f)f.status='REMOVED';this.save();return f; }
      case 'blockUser': { d.safetyRelations.push({id:uid('rel'),type:'BLOCK',targetUser:this.user(p.userId),createdAt:new Date().toISOString()});this.save();return {blocked:true}; }
      case 'unblockUser': { d.safetyRelations=d.safetyRelations.filter(r=>r.targetUser?.id!==p.userId||r.type!=='BLOCK');this.save();return {unblocked:true}; }
      case 'listSafety': return d.safetyRelations;
      case 'listNotifications': return d.notifications.filter(n=>!p.unreadOnly||!n.readAt).slice(0,Number(p.limit)||50);
      case 'markNotificationRead': { const ids=array(p.notificationIds); if(p.notificationId)ids.push(p.notificationId);d.notifications.forEach(n=>{if(!ids.length||ids.includes(n.id))n.readAt=new Date().toISOString();});this.save();return {markedRead:ids.length||d.notifications.length}; }
      case 'setPresence': Object.assign(d.user,{status:p.status||d.user.status,customStatus:p.customStatus??d.user.customStatus,lastSeenAt:new Date().toISOString()});this.save();return {userId:d.user.id,status:d.user.status,customStatus:d.user.customStatus,lastSeenAt:d.user.lastSeenAt};
      case 'pollEvents': return {events:[],cursor:new Date().toISOString()};
      case 'browseGroupFinderPosts':
      case 'searchGroupFinderPosts':
      case 'getGroupFinderRecommendations': {
        const q=String(p.q||p.query||'').toLowerCase(); const view=String(p.view||'COMPATIBLE').toUpperCase(); const systems=array(p.systemIds); const roles=array(p.roles); const playMode=String(p.playMode||'').toUpperCase();
        let items=d.finderPosts.filter(post=>(!q||`${post.title} ${post.body} ${post.tags.join(' ')}`.toLowerCase().includes(q))&&(!systems.length||systems.some(x=>post.systemIds.includes(x)))&&(!roles.length||roles.some(x=>[...post.desiredRoles,...post.offeredRoles].includes(x)))&&(!playMode||post.playMode===playMode));
        if(view==='RIGHT_NOW')items=items.filter(x=>x.isRightNow); if(view==='MY_ACTIVITY')items=items.filter(x=>x.ownedByViewer||x.interest); if(view==='NEWEST')items=[...items].sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt));
        return {total:items.length,offset:0,limit:100,view,hardDealbreakersApplied:true,compatibilityIsNotSafety:true,items};
      }
      case 'createGroupFinderPost': {
        const post={id:uid('gfp'),owner:d.user,tablegate:d.tablegates.find(t=>t.id===p.tablegateId)||null,postType:p.postType||'LOOKING_FOR_GROUP',title:p.title,body:p.body||'',desiredRoles:array(p.desiredRoles),offeredRoles:array(p.offeredRoles),systemIds:array(p.systemIds),customSystems:array(p.customSystems),tags:parseTags(p.tags),playMode:p.playMode||'ONLINE_OK',publicLocation:null,radiusBand:p.playMode==='IN_PERSON_ONLY'?'WITHIN_25_MILES':'ONLINE',schedule:p.schedule||{},timezone:p.timezone||Intl.DateTimeFormat().resolvedOptions().timeZone,languages:array(p.languages),experienceLevel:p.experienceLevel||'ALL',accessibility:p.accessibility||{},safetyTools:p.safetyTools||{},contentBoundaries:p.contentBoundaries||{},agePolicy:p.agePolicy||'ALL_AGES_WITH_GUARDIAN_RULES',seatsAvailable:Number(p.seatsAvailable)||0,status:'RECRUITING',visibility:'PUBLIC',contactPolicy:p.contactPolicy||'INTEREST_THEN_LOBBY',isRightNow:Boolean(p.isRightNow)||p.postType==='RIGHT_NOW',rightNowUntil:p.isRightNow?new Date(Date.now()+(Number(p.rightNowMinutes)||60)*60000).toISOString():'',lastReconfirmedAt:new Date().toISOString(),freshnessState:'FRESH',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),ownedByViewer:true,interest:null,eligible:true,matchScore:100,matchReasons:['Your post'],confidence:'HIGH',sharedAnswerCount:0,flexibleMismatches:[],distanceBand:'ONLINE',safetyNotice:'Compatibility is not a safety clearance.'};d.finderPosts.unshift(post);this.save();return post;
      }
      case 'expressGroupFinderInterest': { const post=d.finderPosts.find(x=>x.id===p.postId); if(post)post.interest={id:uid('int'),status:'SENT',createdAt:new Date().toISOString()};this.save();return post?.interest; }
      case 'listGroupFinderInterests': return [];
      case 'listMyGroupFinderInterests': return d.finderPosts.filter(x=>x.interest).map(x=>x.interest);
      case 'respondGroupFinderInterest': return {status:p.accept?'ACCEPTED':'DECLINED'};
      case 'hideDiscoveryItem': return {hidden:true};
      case 'createPublicLocation': { const location={id:uid('loc'),label:p.label,placeType:p.placeType,city:p.city||'',region:p.region||'',country:p.country||'',isDefault:Boolean(p.isDefault),visibility:'LABEL_ONLY',lastReconfirmedAt:new Date().toISOString()};d.publicLocations=d.publicLocations||[];d.publicLocations.push(location);this.save();return location; }
      case 'listPublicLocations': return d.publicLocations||[];
      case 'getSafetyReportingInfo': return {reportCategories:['CHILD_SAFETY_OR_GROOMING','STALKING_OR_BLOCK_EVASION','THREAT_OF_VIOLENCE','SEXUAL_HARASSMENT','COERCION_OR_ABUSE_OF_AUTHORITY','PERSISTENT_UNWANTED_CONTACT','MODERATOR_ADMIN_OWNER_OR_HOST_MISCONDUCT','MADE_ME_UNCOMFORTABLE','OTHER'],urgencyChoices:['IMMEDIATE_DANGER','CHILD_IMMEDIATE_RISK','CREDIBLE_THREAT_OR_STALKING','SEXUAL_EXPLOITATION_OR_GROOMING','SERIOUS_NOT_IMMEDIATE','PATTERN_DOCUMENTATION','GENERAL_POLICY_VIOLATION']};
      case 'reportUserSafety':
      case 'reportSafetyObject': { const report={id:uid('safe'),...p,status:'SUBMITTED',createdAt:new Date().toISOString(),caseReference:''};report.caseReference=report.id;d.safetyReports.push(report);this.save();return {report,caseReference:report.id,guidance:{}}; }
      case 'listPublicEvents': return d.publicEvents||[];
      case 'listPublicVenues': return d.publicVenues||[];
      case 'reportSafetyAnonymous': { const report={id:uid('safe'),...p,status:'SUBMITTED',createdAt:new Date().toISOString()}; d.safetyReports.push(report);this.save();return {report,caseReference:report.id}; }
      case 'listIncidentJournals': return d.safetyJournals||[];
      case 'createIncidentJournal': { const journal={id:uid('journal'),title:p.title,summary:p.summary||'',status:'DRAFT',entries:[],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};d.safetyJournals=d.safetyJournals||[];d.safetyJournals.unshift(journal);this.save();return journal; }
      case 'getIncidentJournal': return {journal:(d.safetyJournals||[]).find(j=>j.id===p.journalId)};
      case 'addIncidentEntry': { const journal=(d.safetyJournals||[]).find(j=>j.id===p.journalId);if(!journal)throw new ApiError('JOURNAL_NOT_FOUND','Incident journal not found.');const entry={id:uid('entry'),...p,createdAt:new Date().toISOString()};journal.entries.push(entry);journal.updatedAt=entry.createdAt;this.save();return entry; }
      case 'exportIncidentJournal': { const journal=(d.safetyJournals||[]).find(j=>j.id===p.journalId);return {journalId:p.journalId,title:journal?.title||'',entries:journal?.entries||[],redacted:true,exportedAt:new Date().toISOString()}; }
      case 'convertIncidentJournalToReport': { const journal=(d.safetyJournals||[]).find(j=>j.id===p.journalId);if(!journal)throw new ApiError('JOURNAL_NOT_FOUND','Incident journal not found.');const report={id:uid('safe'),category:'PATTERN_DOCUMENTATION',summary:journal.title,details:journal.summary,status:'SUBMITTED',createdAt:new Date().toISOString(),journalId:journal.id};d.safetyReports.push(report);journal.status='SUBMITTED';this.save();return {report,caseReference:report.id}; }
      case 'tablegate.sync.state.load': { const data=p.data||p; return {found:Boolean(d.profileSync?.value),revision:Number(d.profileSync?.revision||0),value:d.profileSync?.value??data.fallback??null}; }
      case 'tablegate.sync.state.save': { const data=p.data||p; d.profileSync=d.profileSync||{revision:0,value:null};d.profileSync.revision++;d.profileSync.value=data.value;this.save();return {ok:true,stateKey:data.key,revision:d.profileSync.revision,value:d.profileSync.value,updatedAt:new Date().toISOString()}; }
      case 'listMySafetyReports': return d.safetyReports;
      default: throw new ApiError('DEMO_UNSUPPORTED', `Demo mode does not simulate “${action}” yet.`);
    }
  }
  health() { return this.request('health', {}); }
}
