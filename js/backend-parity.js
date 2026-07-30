'use strict';

/*
 * TableGate backend parity layer
 * --------------------------------
 * Connects backend capabilities that were previously present only as API
 * routes to user-facing controls without replacing the existing messenger or
 * organizer experience.
 */
(function(){
  const Parity={
    notificationCount:0,
    notificationCheckedAt:0,
    notificationRequest:null,
    unreadByServer:new Map(),
    control:null
  };

  const userName=user=>user?.displayTag||user?.username||'Unknown player';
  const currentResetBaseUrl=()=>{
    const url=new URL(location.href);
    url.search='';
    url.hash='';
    return url.href;
  };
  const setBusy=(button,busy,label='Working…')=>{
    if(!button)return;
    if(busy){
      button.dataset.originalLabel=button.textContent;
      button.textContent=label;
      button.disabled=true;
    }else{
      button.textContent=button.dataset.originalLabel||button.textContent;
      button.disabled=false;
    }
  };

  function bindPasswordVisibility(){
    document.addEventListener('change',event=>{
      const checkbox=event.target.closest('[data-see-password]');
      if(!checkbox)return;
      String(checkbox.dataset.seePassword||'').split(',').forEach(id=>{
        const input=document.getElementById(id.trim());
        if(input)input.type=checkbox.checked?'text':'password';
      });
    });
    document.addEventListener('click',event=>{
      if(event.target.closest('[data-forgot-password]')){
        event.preventDefault();
        openForgotPassword();
      }
    });
  }

  function resetFormBody({email='',token=''}={}){
    return `<p style="color:var(--muted)">Enter the email and one-time reset code sent by the TableGate backend. Codes expire according to the backend configuration and can be used once.</p>
      <div class="field"><label>Email</label><input id="reset-email" type="email" autocomplete="email" value="${esc(email)}" required></div>
      <div class="field"><label>Reset code</label><input id="reset-code" autocomplete="one-time-code" value="${esc(token)}" required></div>
      <div class="field"><label>New password</label><input id="reset-new-password" type="password" minlength="10" maxlength="128" autocomplete="new-password" required><small>10–128 characters.</small></div>
      <div class="field"><label>Confirm new password</label><input id="reset-confirm-password" type="password" minlength="10" maxlength="128" autocomplete="new-password" required></div>
      <label class="list-row" style="padding:0;border:0"><input type="checkbox" data-see-password="reset-new-password,reset-confirm-password"> See password</label>
      <div id="reset-status" class="modal-status" aria-live="polite"></div>`;
  }

  function bindResetSubmit(root,token=''){
    const button=root.querySelector('[data-reset-password]');
    button.onclick=async()=>{
      const email=$('#reset-email').value.trim(),code=$('#reset-code').value.trim();
      const next=$('#reset-new-password').value,confirmPassword=$('#reset-confirm-password').value;
      if(!email||(!code&&!token))return toast('Enter your email and reset code.','error');
      if(next.length<10)return toast('Password must be at least 10 characters.','error');
      if(next!==confirmPassword)return toast('The two passwords do not match.','error');
      setBusy(button,true,'Resetting…');
      try{
        await API.call('resetPassword',{email,code,token:token||undefined,newPassword:next},false);
        history.replaceState({},'',location.pathname);
        closeModal();showAuthTab('login');
        const loginEmail=$('#login-email');if(loginEmail)loginEmail.value=email;
        toast('Password reset. Sign in with your new password.','success',7000);
      }catch(err){$('#reset-status').textContent=err.message;setBusy(button,false)}
    };
  }

  function openForgotPassword(){
    modal(
      'Reset your password',
      `<p style="color:var(--muted)">Enter the email used for TableGate. The backend sends a one-time reset code without revealing whether an account exists.</p>
       <div class="field"><label>Email</label><input id="forgot-email" type="email" autocomplete="email" value="${esc($('#login-email')?.value||'')}" required></div>
       <div id="forgot-status" class="modal-status" aria-live="polite"></div>`,
      `<button class="secondary" data-close-modal>Cancel</button><button class="primary" data-send-reset>Send reset code</button>`
    );
    const root=$('#modal-root');
    root.querySelector('[data-send-reset]').onclick=async event=>{
      const button=event.currentTarget,email=$('#forgot-email').value.trim();
      if(!email)return toast('Enter your email address.','error');
      setBusy(button,true,'Sending…');
      try{
        const result=await API.call('requestPasswordReset',{email},false);
        root.querySelector('.modal-body').innerHTML=resetFormBody({email});
        root.querySelector('.modal-foot').innerHTML='<button class="secondary" data-close-modal>Cancel</button><button class="primary" data-reset-password>Reset password</button>';
        $('#reset-status').textContent=result?.message||'If that email belongs to an account, a reset code was sent.';
        bindResetSubmit(root);
      }catch(err){$('#forgot-status').textContent=err.message;setBusy(button,false)}
    };
  }

  async function openResetPassword(resetToken){
    const params=new URL(location.href).searchParams;
    modal('Choose a new password',resetFormBody({email:params.get('email')||'',token:params.get('code')||''}),`<button class="secondary" data-close-modal>Cancel</button><button class="primary" data-reset-password>Reset password</button>`);
    bindResetSubmit($('#modal-root'),resetToken||'');
  }
  window.openResetPassword=openResetPassword;

  async function openChangePassword(){
    modal(
      'Change password',
      `<div class="field"><label>Current password</label><input id="change-current-password" type="password" autocomplete="current-password"></div>
       <div class="field"><label>New password</label><input id="change-new-password" type="password" minlength="10" maxlength="128" autocomplete="new-password"></div>
       <div class="field"><label>Confirm new password</label><input id="change-confirm-password" type="password" minlength="10" maxlength="128" autocomplete="new-password"></div>
       <label class="list-row" style="padding:0;border:0"><input type="checkbox" data-see-password="change-current-password,change-new-password,change-confirm-password"> See password</label>
       <p style="color:var(--muted)">Changing your password signs out every other device while keeping this one connected.</p>`,
      `<button class="secondary" data-close-modal>Cancel</button><button class="primary" data-change-password>Change password</button>`
    );
    $('#modal-root').querySelector('[data-change-password]').onclick=async event=>{
      const button=event.currentTarget;
      const currentPassword=$('#change-current-password').value;
      const newPassword=$('#change-new-password').value;
      if(newPassword!==$('#change-confirm-password').value)return toast('The two new passwords do not match.','error');
      setBusy(button,true,'Changing…');
      try{
        await API.call('changePassword',{currentPassword,newPassword});
        closeModal();
        toast('Password changed. Other devices were signed out.','success');
      }catch(err){
        showError(err);
        setBusy(button,false);
      }
    };
  }

  async function signOutEverywhere(){
    if(!confirm('Sign this TableGate account out on every device, including this one?'))return;
    try{
      await API.call('logoutAll');
    }catch(err){
      showError(err);
      return;
    }
    Store.del('token');
    location.reload();
  }

  async function refreshNotificationBadge(force=false){
    if(!State.token)return;
    if(!force&&Date.now()-Parity.notificationCheckedAt<15000)return;
    if(Parity.notificationRequest)return Parity.notificationRequest;
    Parity.notificationRequest=API.call('listNotifications',{unreadOnly:true,limit:100})
      .then(list=>{
        Parity.notificationCount=(list||[]).length;
        Parity.notificationCheckedAt=Date.now();
        applyNotificationBadge();
      })
      .catch(()=>{})
      .finally(()=>{Parity.notificationRequest=null});
    return Parity.notificationRequest;
  }

  function applyNotificationBadge(){
    const button=document.querySelector('[data-notifications-hub]');
    if(!button)return;
    const old=button.querySelector('.rail-badge');
    if(old)old.remove();
    if(Parity.notificationCount){
      button.insertAdjacentHTML('beforeend',`<span class="rail-badge">${Parity.notificationCount>99?'99+':Parity.notificationCount}</span>`);
      button.setAttribute('aria-label',`Notifications, ${Parity.notificationCount} unread`);
    }else button.setAttribute('aria-label','Notifications');
  }

  async function openNotifications(){
    modal('Notifications','<div class="empty-workspace">Loading notifications…</div>','<button class="secondary" data-close-modal>Close</button><button class="primary" data-read-all>Mark all read</button>',true);
    const root=$('#modal-root');
    try{
      const list=await API.call('listNotifications',{limit:100});
      const body=root.querySelector('.modal-body');
      body.innerHTML=`<div class="parity-section">${list.length?list.map(notificationHtml).join(''):'<div class="empty-workspace">You have no notifications.</div>'}</div>`;
      body.onclick=async event=>{
        const button=event.target.closest('[data-read-notification]');
        if(!button)return;
        try{
          await API.call('markNotificationRead',{notificationId:button.dataset.readNotification});
          button.closest('.notification-row')?.classList.remove('unread');
          button.remove();
          await refreshNotificationBadge(true);
        }catch(err){showError(err)}
      };
      root.querySelector('[data-read-all]').onclick=async()=>{
        try{
          await API.call('markNotificationRead',{});
          body.querySelectorAll('.notification-row').forEach(row=>row.classList.remove('unread'));
          body.querySelectorAll('[data-read-notification]').forEach(button=>button.remove());
          await refreshNotificationBadge(true);
          toast('Notifications marked read.','success');
        }catch(err){showError(err)}
      };
    }catch(err){
      root.querySelector('.modal-body').innerHTML=`<div class="error-box">${esc(err.message)}</div>`;
    }
  }

  function notificationHtml(notification){
    const labels={
      FRIEND_REQUEST:'Friend request',
      DIRECT_MESSAGE:'Direct message',
      MENTION:'You were mentioned'
    };
    const preview=notification.payload?.preview||notification.payload?.message||'Open TableGate to review this update.';
    return `<article class="card notification-row ${notification.readAt?'':'unread'}">
      <div class="row between"><b>${esc(labels[notification.type]||String(notification.type||'Update').replaceAll('_',' ').toLowerCase())}</b><time>${esc(fmtDate(notification.createdAt)+' '+fmtTime(notification.createdAt))}</time></div>
      <p>${esc(preview)}</p>
      ${notification.readAt?'':`<button class="secondary" data-read-notification="${esc(notification.id)}">Mark read</button>`}
    </article>`;
  }

  async function refreshUnreadCounts(force=false){
    if(!State.server)return;
    const serverId=State.server.id;
    const cached=Parity.unreadByServer.get(serverId);
    if(cached)applyUnreadCounts(cached.counts);
    if(!force&&cached&&Date.now()-cached.checkedAt<12000)return;
    try{
      const counts=await API.call('unreadCounts',{serverId});
      Parity.unreadByServer.set(serverId,{counts,checkedAt:Date.now()});
      if(State.server?.id===serverId)applyUnreadCounts(counts);
    }catch{}
  }

  function applyUnreadCounts(counts={}){
    document.querySelectorAll('[data-channel]').forEach(button=>{
      button.querySelector('.unread-badge')?.remove();
      const count=Number(counts[button.dataset.channel]||0);
      if(count)button.insertAdjacentHTML('beforeend',`<span class="unread-badge">${count>99?'99+':count}</span>`);
    });
  }

  async function openDiceHistory(){
    if(!State.channel)return;
    modal('Dice roll history','<div class="empty-workspace">Loading auditable rolls…</div>','<button class="secondary" data-close-modal>Close</button>',true);
    try{
      const rolls=await API.call('listDiceRolls',{channelId:State.channel.id,limit:100});
      $('#modal-root .modal-body').innerHTML=rolls.length?rolls.map(roll=>`<article class="card"><div class="row between"><b>${esc(roll.label||roll.expression)}</b><span class="pill">${esc(String(roll.total))}</span></div><p><code>${esc(roll.expression)}</code> · ${esc(fmtDate(roll.createdAt)+' '+fmtTime(roll.createdAt))}</p><small style="color:var(--muted)">${esc((roll.detail||[]).map(term=>term.type==='dice'?`${term.count}d${term.sides} [${(term.rolls||[]).join(', ')}]`:String(term.subtotal)).join(' · '))}</small></article>`).join(''):'<div class="empty-workspace">No rolls have been recorded in this channel.</div>';
    }catch(err){showError(err)}
  }

  async function purgeCurrentMessages(){
    const scopeId=State.channel?.id||State.dm?.id;
    if(!scopeId)return;
    const label=State.channel?`#${State.channel.name}`:(State.dm?.name||'this conversation');
    if(!confirm(`Delete every message in ${label}? This cannot be undone.`))return;
    try{
      const result=await API.call('purgeMessages',{scopeType:State.scopeType,scopeId});
      await loadMessages();
      renderAll();
      toast(`${result.purged||0} messages deleted.`,'success');
    }catch(err){showError(err)}
  }

  function installRailControls(){
    const originalRenderRail=renderRail;
    renderRail=function(){
      originalRenderRail();
      const rail=$('#server-rail');
      const add=rail?.querySelector('[data-add-server]');
      if(!rail||!add)return;
      const separator=document.createElement('div');
      separator.className='rail-sep';
      const social=document.createElement('button');
      social.className='rail-btn';
      social.dataset.socialHub='1';
      social.title='Friends and safety';
      social.setAttribute('aria-label','Friends and safety');
      social.textContent='🫂';
      const notifications=document.createElement('button');
      notifications.className='rail-btn';
      notifications.dataset.notificationsHub='1';
      notifications.title='Notifications';
      notifications.setAttribute('aria-label','Notifications');
      notifications.textContent='🔔';
      social.onclick=event=>{event.stopPropagation();openSocialHub()};
      notifications.onclick=event=>{event.stopPropagation();openNotifications()};
      rail.insertBefore(separator,add);
      rail.insertBefore(social,add);
      rail.insertBefore(notifications,add);
      applyNotificationBadge();
      refreshNotificationBadge();
    };
  }

  function installSidebarUnread(){
    const originalRenderSidebar=renderSidebar;
    renderSidebar=function(){
      originalRenderSidebar();
      refreshUnreadCounts();
    };
    const originalSelectChannel=selectChannel;
    selectChannel=async function(id){
      const result=await originalSelectChannel(id);
      const cached=State.server&&Parity.unreadByServer.get(State.server.id);
      if(cached){
        cached.counts[id]=0;
        applyUnreadCounts(cached.counts);
      }
      refreshUnreadCounts(true);
      $('#sidebar')?.classList.remove('open');
      return result;
    };
    const originalSelectDm=selectDm;
    selectDm=async function(id){
      const result=await originalSelectDm(id);
      $('#sidebar')?.classList.remove('open');
      return result;
    };
  }

  function installTopbarControls(){
    const originalRenderTopbar=renderTopbar;
    renderTopbar=function(){
      originalRenderTopbar();
      const top=$('#topbar');
      if(!top)return;
      if(State.channel){
        top.insertAdjacentHTML('beforeend','<button class="icon-btn" data-dice-history title="Dice roll history" aria-label="Dice roll history">≣</button>');
        if(hasPerm(PERM.MANAGE_MESSAGES))top.insertAdjacentHTML('beforeend','<button class="icon-btn" data-purge-current title="Purge channel messages" aria-label="Purge channel messages">🧹</button>');
      }
      if(State.dm){
        if(State.dm.type==='GROUP')top.insertAdjacentHTML('beforeend','<button class="icon-btn" data-manage-group-dm title="Manage group conversation" aria-label="Manage group conversation">⚙</button>');
        top.insertAdjacentHTML('beforeend','<button class="icon-btn" data-close-current-dm title="Close conversation" aria-label="Close conversation">×</button>');
        if(State.dm.type!=='GROUP'||State.dm.ownerId===State.user.id)top.insertAdjacentHTML('beforeend','<button class="icon-btn" data-purge-current title="Purge conversation messages" aria-label="Purge conversation messages">🧹</button>');
      }
      if(!top.dataset.parityBound){
        top.dataset.parityBound='1';
        top.addEventListener('click',event=>{
          if(event.target.closest('[data-dice-history]'))openDiceHistory();
          else if(event.target.closest('[data-purge-current]'))purgeCurrentMessages();
          else if(event.target.closest('[data-manage-group-dm]'))openGroupDmManager();
          else if(event.target.closest('[data-close-current-dm]'))closeCurrentDm();
        });
      }
    };
  }

  async function closeCurrentDm(){
    if(!State.dm)return;
    const message=State.dm.type==='GROUP'&&State.dm.ownerId===State.user.id
      ?'Transfer group ownership before leaving this conversation.'
      :'Close this conversation? You can start it again later.';
    if(State.dm.type==='GROUP'&&State.dm.ownerId===State.user.id)return toast(message,'error');
    if(!confirm(message))return;
    try{
      await API.call('closeDm',{dmId:State.dm.id});
      State.dm=null;
      await refreshDms();
      selectHome();
      toast('Conversation closed.','success');
    }catch(err){showError(err)}
  }

  function installUserSettings(){
    const originalOpenUserSettings=openUserSettings;
    openUserSettings=function(){
      originalOpenUserSettings();
      const body=$('#modal-root .modal-body');
      if(!body)return;
      body.insertAdjacentHTML('beforeend',`
        <div class="card">
          <h3>Presence</h3>
          <div class="field"><label>Show me as</label><select id="presence-setting">
            <option value="ONLINE" ${State.user.status==='ONLINE'?'selected':''}>Online</option>
            <option value="IDLE" ${State.user.status==='IDLE'?'selected':''}>Idle</option>
            <option value="DND" ${State.user.status==='DND'?'selected':''}>Do not disturb</option>
            <option value="OFFLINE" ${State.user.status==='OFFLINE'?'selected':''}>Invisible</option>
          </select></div>
        </div>
        <div class="card">
          <h3>Account and privacy</h3>
          <p>Manage your password, trusted sessions, friends, blocks, ignores, and notifications.</p>
          <div class="row wrap" style="margin-top:10px">
            <button class="secondary" data-change-account-password>Change password</button>
            <button class="secondary" data-open-social>Friends & safety</button>
            <button class="secondary" data-open-notifications>Notifications</button>
            <button class="danger" data-logout-all>Sign out every device</button>
          </div>
        </div>`);
      const root=$('#modal-root');
      root.querySelector('#presence-setting').onchange=async event=>{
        try{
          const presence=await API.call('setPresence',{status:event.target.value,customStatus:State.user.customStatus||'',serverIds:State.servers.map(server=>server.id)});
          State.user.status=presence.status;
          toast(`Presence set to ${event.target.options[event.target.selectedIndex].text}.`,'success');
        }catch(err){showError(err)}
      };
      root.querySelector('[data-change-account-password]').onclick=openChangePassword;
      root.querySelector('[data-open-social]').onclick=openSocialHub;
      root.querySelector('[data-open-notifications]').onclick=openNotifications;
      root.querySelector('[data-logout-all]').onclick=signOutEverywhere;
    };
  }

  function installMemberControls(){
    const originalOpenMemberCard=openMemberCard;
    openMemberCard=function(member){
      originalOpenMemberCard(member);
      if(!member||!State.server)return;
      const body=$('#modal-root .modal-body');
      const canNickname=member.userId===State.user.id||hasPerm(PERM.MANAGE_NICKNAMES);
      const canTimeout=member.userId!==State.user.id&&hasPerm(PERM.MANAGE_MESSAGES);
      body.insertAdjacentHTML('beforeend',`
        <div class="card">
          <h3>Member controls</h3>
          ${canNickname?`<div class="field"><label>Campaign nickname</label><input id="member-nickname" maxlength="64" value="${esc(member.nickname||'')}"></div>`:''}
          ${canTimeout?`<div class="field"><label>Timeout until</label><input id="member-timeout" type="datetime-local" value="${member.timedOutUntil?esc(new Date(member.timedOutUntil).toISOString().slice(0,16)):''}"><small>Leave blank to remove a timeout.</small></div>`:''}
          <div class="row wrap">
            ${canNickname||canTimeout?'<button class="secondary" data-save-member>Save member settings</button>':''}
            ${member.userId!==State.user.id?'<button class="secondary" data-friend-member>Send friend request</button><button class="secondary" data-ignore-member>Ignore</button><button class="danger" data-block-member>Block</button>':''}
          </div>
        </div>`);
      const root=$('#modal-root');
      root.querySelector('[data-save-member]')?.addEventListener('click',async()=>{
        try{
          const payload={serverId:State.server.id,userId:member.userId};
          if(canNickname)payload.nickname=$('#member-nickname').value;
          if(canTimeout)payload.timedOutUntil=$('#member-timeout').value?new Date($('#member-timeout').value).toISOString():'';
          await API.call('updateMember',payload);
          await selectServer(State.server.id);
          closeModal();
          toast('Member settings saved.','success');
        }catch(err){showError(err)}
      });
      root.querySelector('[data-friend-member]')?.addEventListener('click',()=>socialAction('sendFriendRequest',{userId:member.userId},'Friend request sent.'));
      root.querySelector('[data-ignore-member]')?.addEventListener('click',()=>socialAction('ignoreUser',{userId:member.userId},'Player ignored.'));
      root.querySelector('[data-block-member]')?.addEventListener('click',()=>{if(confirm(`Block ${userName(member.user)}?`))socialAction('blockUser',{userId:member.userId},'Player blocked.')});
    };
  }

  async function socialAction(action,payload,message,refresh){
    try{
      await API.call(action,payload);
      toast(message,'success');
      if(refresh)refresh();
    }catch(err){showError(err)}
  }

  async function openSocialHub(tab='friends'){
    modal('Friends and safety','<div class="empty-workspace">Loading your connections…</div>','<button class="secondary" data-close-modal>Close</button>',true);
    const root=$('#modal-root');
    try{
      const [friends,safety]=await Promise.all([API.call('listFriends'),API.call('listSafety')]);
      renderSocialHub(root,friends||[],safety||[],tab);
    }catch(err){root.querySelector('.modal-body').innerHTML=`<div class="error-box">${esc(err.message)}</div>`}
  }

  function renderSocialHub(root,friends,safety,tab){
    const body=root.querySelector('.modal-body');
    body.innerHTML=`<div class="parity-tabs"><button class="${tab==='friends'?'active':''}" data-social-tab="friends">Friends</button><button class="${tab==='find'?'active':''}" data-social-tab="find">Find players</button><button class="${tab==='safety'?'active':''}" data-social-tab="safety">Blocks & ignores</button></div><div id="social-content"></div>`;
    const content=body.querySelector('#social-content');
    if(tab==='friends'){
      content.innerHTML=friends.length?friends.map(friend=>`<article class="parity-user">${avatarHtml(friend.otherUser,'dm-avatar')}<div class="details"><b>${esc(userName(friend.otherUser))}</b><small>${esc(friend.status==='PENDING'?(friend.direction==='INCOMING'?'Incoming request':'Request sent'):'Friend')}</small></div><div class="parity-actions">${friend.status==='PENDING'&&friend.direction==='INCOMING'?`<button class="primary" data-friend-action="acceptFriend" data-friendship="${esc(friend.id)}">Accept</button><button class="danger" data-friend-action="declineFriend" data-friendship="${esc(friend.id)}">Decline</button>`:friend.status==='ACCEPTED'?`<button class="secondary" data-message-friend="${esc(friend.otherUser.id)}">Message</button><button class="danger" data-friend-action="removeFriend" data-friendship="${esc(friend.id)}">Remove</button>`:`<button class="danger" data-friend-action="removeFriend" data-friendship="${esc(friend.id)}">Cancel</button>`}</div></article>`).join(''):'<div class="empty-workspace">No friend connections yet.</div>';
    }else if(tab==='find'){
      content.innerHTML=`<div class="field"><label>Username or display tag</label><input id="social-search" autocomplete="off"></div><button class="primary" data-social-search>Search</button><div id="social-results" class="parity-section" style="margin-top:12px"></div>`;
    }else{
      content.innerHTML=safety.length?safety.map(relation=>`<article class="parity-user">${avatarHtml(relation.targetUser,'dm-avatar')}<div class="details"><b>${esc(userName(relation.targetUser))}</b><small>${esc(relation.type==='BLOCK'?'Blocked':'Ignored')}</small></div><div class="parity-actions"><button class="secondary" data-safety-remove="${esc(relation.type)}" data-user-id="${esc(relation.targetUser.id)}">${relation.type==='BLOCK'?'Unblock':'Stop ignoring'}</button></div></article>`).join(''):'<div class="empty-workspace">You have not blocked or ignored anyone.</div>';
    }
    body.onclick=async event=>{
      const tabButton=event.target.closest('[data-social-tab]');
      if(tabButton)return openSocialHub(tabButton.dataset.socialTab);
      const friendButton=event.target.closest('[data-friend-action]');
      if(friendButton)return socialAction(friendButton.dataset.friendAction,{friendshipId:friendButton.dataset.friendship},'Friend list updated.',()=>openSocialHub('friends'));
      const messageButton=event.target.closest('[data-message-friend]');
      if(messageButton)return createDm(messageButton.dataset.messageFriend);
      const safetyButton=event.target.closest('[data-safety-remove]');
      if(safetyButton){
        const action=safetyButton.dataset.safetyRemove==='BLOCK'?'unblockUser':'unignoreUser';
        return socialAction(action,{userId:safetyButton.dataset.userId},'Safety setting updated.',()=>openSocialHub('safety'));
      }
      if(event.target.closest('[data-social-search]')){
        const query=$('#social-search').value.trim();
        if(!query)return;
        try{
          const results=await API.call('searchUsers',{query,limit:50});
          $('#social-results').innerHTML=results.length?results.map(user=>`<article class="parity-user">${avatarHtml(user,'dm-avatar')}<div class="details"><b>${esc(userName(user))}</b><small>${esc(user.bio||'Registered TableGate player')}</small></div><div class="parity-actions"><button class="secondary" data-find-action="sendFriendRequest" data-user-id="${esc(user.id)}">Friend</button><button class="secondary" data-find-action="ignoreUser" data-user-id="${esc(user.id)}">Ignore</button><button class="danger" data-find-action="blockUser" data-user-id="${esc(user.id)}">Block</button></div></article>`).join(''):'<div class="empty-workspace">No discoverable players matched.</div>';
        }catch(err){showError(err)}
        return;
      }
      const findAction=event.target.closest('[data-find-action]');
      if(findAction){
        const messages={sendFriendRequest:'Friend request sent.',ignoreUser:'Player ignored.',blockUser:'Player blocked.'};
        return socialAction(findAction.dataset.findAction,{userId:findAction.dataset.userId},messages[findAction.dataset.findAction]);
      }
    };
  }

  function installNewDmControls(){
    const originalOpenNewDm=openNewDm;
    openNewDm=async function(){
      await originalOpenNewDm();
      const body=$('#modal-root .modal-body');
      body?.insertAdjacentHTML('afterbegin','<div class="card"><div class="row between wrap"><div><b>Adventuring party conversation</b><p>Create a private group with up to 19 other players.</p></div><button class="secondary" data-new-group-dm>Create group</button></div></div>');
      $('#modal-root').querySelector('[data-new-group-dm]')?.addEventListener('click',openGroupDmCreator);
    };
  }

  function openGroupDmCreator(){
    const selected=new Map();
    modal(
      'Create group conversation',
      `<div class="field"><label>Group name</label><input id="group-dm-name" maxlength="80" value="Adventuring Party"></div>
       <div class="field"><label>Find players</label><input id="group-user-search" autocomplete="off"></div>
       <button class="secondary" data-search-group-users>Search</button>
       <div id="group-selected" class="row wrap" style="margin:12px 0"></div>
       <div id="group-user-results" class="parity-section"></div>`,
      `<button class="secondary" data-close-modal>Cancel</button><button class="primary" data-create-group disabled>Create group</button>`,
      true
    );
    const root=$('#modal-root');
    const renderSelected=()=>{
      $('#group-selected').innerHTML=[...selected.values()].map(user=>`<button class="pill" data-remove-group-user="${esc(user.id)}">${esc(userName(user))} ×</button>`).join('')||'<small style="color:var(--muted)">Choose at least one player.</small>';
      root.querySelector('[data-create-group]').disabled=selected.size<1;
    };
    root.querySelector('[data-search-group-users]').onclick=async()=>{
      try{
        const list=await API.call('searchUsers',{query:$('#group-user-search').value,limit:50});
        $('#group-user-results').innerHTML=list.map(user=>`<article class="parity-user">${avatarHtml(user,'dm-avatar')}<div class="details"><b>${esc(userName(user))}</b><small>${esc(user.bio||'Registered player')}</small></div><button class="secondary" data-add-group-user="${esc(user.id)}">Add</button></article>`).join('')||'<div class="empty-workspace">No players found.</div>';
        $('#group-user-results').onclick=event=>{
          const button=event.target.closest('[data-add-group-user]');
          if(!button)return;
          const user=list.find(item=>item.id===button.dataset.addGroupUser);
          if(user)selected.set(user.id,user);
          renderSelected();
        };
      }catch(err){showError(err)}
    };
    $('#group-selected').onclick=event=>{
      const button=event.target.closest('[data-remove-group-user]');
      if(button){selected.delete(button.dataset.removeGroupUser);renderSelected()}
    };
    root.querySelector('[data-create-group]').onclick=async event=>{
      const button=event.currentTarget;
      setBusy(button,true,'Creating…');
      try{
        const dm=await API.call('createGroupDm',{name:$('#group-dm-name').value,recipientIds:[...selected.keys()]});
        closeModal();
        await refreshDms();
        await selectDm(dm.id);
        toast('Group conversation created.','success');
      }catch(err){showError(err);setBusy(button,false)}
    };
    renderSelected();
  }

  async function openGroupDmManager(){
    if(!State.dm)return;
    modal('Manage group conversation','<div class="empty-workspace">Loading group members…</div>','<button class="secondary" data-close-modal>Close</button>',true);
    const root=$('#modal-root');
    try{
      const dm=await API.call('getDm',{dmId:State.dm.id});
      const owner=dm.ownerId===State.user.id;
      root.querySelector('.modal-body').innerHTML=`
        ${owner?`<div class="card"><div class="field"><label>Group name</label><input id="manage-group-name" maxlength="80" value="${esc(dm.name||'Adventuring Party')}"></div><button class="primary" data-save-group-name>Save name</button></div>`:''}
        <div class="card"><h3>Participants</h3><div class="parity-section" style="margin-top:10px">${dm.participants.map(participant=>`<article class="parity-user">${avatarHtml(participant.user,'dm-avatar')}<div class="details"><b>${esc(userName(participant.user))}</b><small>${esc(participant.role)}</small></div><div class="parity-actions">${owner&&participant.userId!==State.user.id?`<button class="secondary" data-transfer-group="${esc(participant.userId)}">Make owner</button><button class="danger" data-remove-group="${esc(participant.userId)}">Remove</button>`:''}</div></article>`).join('')}</div></div>
        ${owner?`<div class="card"><h3>Add a player</h3><div class="copy-box"><input id="manage-group-search" placeholder="Username or display tag"><button class="secondary" data-manage-group-search>Search</button></div><div id="manage-group-results" class="parity-section" style="margin-top:10px"></div></div>`:''}
        ${owner?'<div class="info-box">Transfer ownership before leaving the group.</div>':'<button class="danger" data-leave-group>Leave group</button>'}`;
      const body=root.querySelector('.modal-body');
      body.onclick=async event=>{
        if(event.target.closest('[data-save-group-name]')){
          try{
            await API.call('updateGroupDm',{dmId:dm.id,name:$('#manage-group-name').value});
            await refreshDms();await selectDm(dm.id);openGroupDmManager();
          }catch(err){showError(err)}
        }
        const remove=event.target.closest('[data-remove-group]');
        if(remove&&confirm('Remove this player from the group?')){
          try{await API.call('removeDmParticipant',{dmId:dm.id,userId:remove.dataset.removeGroup});openGroupDmManager()}catch(err){showError(err)}
        }
        const transfer=event.target.closest('[data-transfer-group]');
        if(transfer&&confirm('Transfer group ownership to this player?')){
          try{await API.call('transferDmOwnership',{dmId:dm.id,userId:transfer.dataset.transferGroup});await refreshDms();await selectDm(dm.id);openGroupDmManager()}catch(err){showError(err)}
        }
        if(event.target.closest('[data-manage-group-search]')){
          try{
            const list=await API.call('searchUsers',{query:$('#manage-group-search').value,limit:50});
            $('#manage-group-results').innerHTML=list.filter(user=>!dm.participants.some(participant=>participant.userId===user.id)).map(user=>`<article class="parity-user">${avatarHtml(user,'dm-avatar')}<div class="details"><b>${esc(userName(user))}</b></div><button class="secondary" data-add-to-group="${esc(user.id)}">Add</button></article>`).join('')||'<div class="empty-workspace">No eligible players found.</div>';
          }catch(err){showError(err)}
        }
        const add=event.target.closest('[data-add-to-group]');
        if(add){
          try{await API.call('addDmParticipant',{dmId:dm.id,userId:add.dataset.addToGroup});openGroupDmManager()}catch(err){showError(err)}
        }
        if(event.target.closest('[data-leave-group]'))closeCurrentDm();
      };
    }catch(err){root.querySelector('.modal-body').innerHTML=`<div class="error-box">${esc(err.message)}</div>`}
  }

  function installServerControlCenter(){
    const originalOpenServerMenu=openServerMenu;
    openServerMenu=function(x,y){
      originalOpenServerMenu(x,y);
      if(!(hasPerm(PERM.MANAGE_SERVER)||hasPerm(PERM.MANAGE_CHANNELS)||hasPerm(PERM.BAN_MEMBERS)||State.server?.ownerId===State.user.id))return;
      const menu=$('#context-root .context-menu');
      if(!menu)return;
      const button=document.createElement('button');
      button.textContent='Campaign control center';
      button.onclick=event=>{event.stopPropagation();$('#context-root').innerHTML='';openCampaignControlCenter()};
      menu.insertBefore(button,menu.firstChild);
    };
  }

  async function loadControlData(){
    const serverId=State.server.id;
    const [members,categories,channels,roles,bans]=await Promise.all([
      API.call('listMembers',{serverId}),
      API.call('listCategories',{serverId}),
      API.call('listChannels',{serverId}),
      API.call('listRoles',{serverId}),
      hasPerm(PERM.BAN_MEMBERS)?API.call('listBans',{serverId}):Promise.resolve([])
    ]);
    Parity.control={members,categories,channels,roles,bans,server:State.serverDetail.server};
  }

  async function openCampaignControlCenter(tab='overview'){
    modal('Campaign control center','<div class="empty-workspace">Loading campaign controls…</div>','<button class="secondary" data-close-modal>Close</button>',true);
    const root=$('#modal-root');
    try{
      await loadControlData();
      renderCampaignControl(root,tab);
    }catch(err){root.querySelector('.modal-body').innerHTML=`<div class="error-box">${esc(err.message)}</div>`}
  }

  function renderCampaignControl(root,tab){
    const data=Parity.control;
    const body=root.querySelector('.modal-body');
    body.innerHTML=`<div class="parity-tabs"><button class="${tab==='overview'?'active':''}" data-control-tab="overview">Overview</button><button class="${tab==='members'?'active':''}" data-control-tab="members">Members</button><button class="${tab==='structure'?'active':''}" data-control-tab="structure">Categories & channels</button>${hasPerm(PERM.BAN_MEMBERS)?`<button class="${tab==='moderation'?'active':''}" data-control-tab="moderation">Bans</button>`:''}</div><div id="control-content"></div>`;
    const content=body.querySelector('#control-content');
    if(tab==='overview'){
      content.innerHTML=`<div class="parity-grid"><div class="card"><h3>${esc(data.server.name)}</h3><p>${esc(data.server.description||'No description.')}</p></div><div class="card"><h3>Backend connection</h3><p>API ${esc(State.clientConfig?.apiVersion||'connected')} · ${data.members.length} members · ${data.channels.length} channels</p></div></div><div class="row wrap"><button class="secondary" data-open-roles>Roles & permissions</button><button class="secondary" data-open-invites>Invites</button>${hasPerm(PERM.VIEW_AUDIT_LOG)?'<button class="secondary" data-open-audit>Audit log</button>':''}${data.server.ownerId===State.user.id?'<button class="danger" data-transfer-server>Transfer ownership</button>':''}</div>`;
    }else if(tab==='members'){
      content.innerHTML=`<div class="parity-section">${data.members.map(member=>`<article class="parity-user">${avatarHtml(member.user,'dm-avatar')}<div class="details"><b>${esc(member.nickname||userName(member.user))}</b><small>${esc(userName(member.user))} · ${(member.roles||[]).map(role=>esc(role.name)).join(', ')||'No role'}</small></div><div class="parity-actions"><button class="secondary" data-control-member="${esc(member.userId)}">Open</button></div></article>`).join('')}</div>`;
    }else if(tab==='structure'){
      content.innerHTML=`<div class="parity-grid"><section class="card"><div class="row between"><h3>Categories</h3>${hasPerm(PERM.MANAGE_CHANNELS)?'<button class="primary" data-new-category>New</button>':''}</div><div class="parity-section">${data.categories.map(category=>`<article class="list-row"><div class="grow"><b>${esc(category.name)}</b><small style="display:block;color:var(--muted)">Position ${esc(category.position)}</small></div>${hasPerm(PERM.MANAGE_CHANNELS)?`<button class="secondary" data-edit-category="${esc(category.id)}">Edit</button><button class="danger" data-delete-category="${esc(category.id)}">Delete</button>`:''}</article>`).join('')||'<p>No categories.</p>'}</div></section><section class="card"><div class="row between"><h3>Channels</h3>${hasPerm(PERM.MANAGE_CHANNELS)?'<button class="primary" data-new-control-channel>New</button>':''}</div><div class="parity-section">${data.channels.map(channel=>`<article class="list-row"><div class="grow"><b>${esc(channel.name)}</b><small style="display:block;color:var(--muted)">${esc(channel.type)}</small></div>${hasPerm(PERM.MANAGE_CHANNELS)?`<button class="secondary" data-edit-control-channel="${esc(channel.id)}">Edit</button>`:''}</article>`).join('')||'<p>No channels.</p>'}</div></section></div>`;
    }else{
      content.innerHTML=`<div class="parity-section">${data.bans.length?data.bans.map(ban=>`<article class="parity-user">${avatarHtml(ban.user,'dm-avatar')}<div class="details"><b>${esc(userName(ban.user))}</b><small>${esc(ban.reason||'No reason provided')}</small></div><button class="secondary" data-unban-user="${esc(ban.userId)}">Unban</button></article>`).join(''):'<div class="empty-workspace">No active bans.</div>'}</div>`;
    }
    body.onclick=event=>handleControlClick(event,tab);
  }

  async function handleControlClick(event,tab){
    const root=$('#modal-root');
    const tabButton=event.target.closest('[data-control-tab]');
    if(tabButton)return renderCampaignControl(root,tabButton.dataset.controlTab);
    if(event.target.closest('[data-open-roles]'))return openRoles();
    if(event.target.closest('[data-open-invites]'))return openInvites();
    if(event.target.closest('[data-open-audit]'))return openAudit();
    if(event.target.closest('[data-transfer-server]'))return openServerTransfer();
    const member=event.target.closest('[data-control-member]');
    if(member)return openMemberCard(Parity.control.members.find(item=>item.userId===member.dataset.controlMember));
    if(event.target.closest('[data-new-category]'))return openCategoryEditor();
    const editCategory=event.target.closest('[data-edit-category]');
    if(editCategory)return openCategoryEditor(Parity.control.categories.find(item=>item.id===editCategory.dataset.editCategory));
    const deleteCategoryButton=event.target.closest('[data-delete-category]');
    if(deleteCategoryButton&&confirm('Delete this category? Its channels will move to the uncategorized area.')){
      try{
        await API.call('deleteCategory',{categoryId:deleteCategoryButton.dataset.deleteCategory});
        await selectServer(State.server.id);
        openCampaignControlCenter('structure');
      }catch(err){showError(err)}
      return;
    }
    if(event.target.closest('[data-new-control-channel]'))return openChannelModal('');
    const editChannel=event.target.closest('[data-edit-control-channel]');
    if(editChannel){
      const channel=State.serverDetail.channels.find(item=>item.id===editChannel.dataset.editControlChannel);
      return openChannelModal(channel?.categoryId||'',channel);
    }
    const unban=event.target.closest('[data-unban-user]');
    if(unban){
      try{
        await API.call('unbanMember',{serverId:State.server.id,userId:unban.dataset.unbanUser});
        toast('Player unbanned.','success');
        openCampaignControlCenter('moderation');
      }catch(err){showError(err)}
    }
  }

  function openCategoryEditor(category=null){
    modal(category?'Edit category':'Create category',`<div class="field"><label>Name</label><input id="category-name" maxlength="64" value="${esc(category?.name||'New category')}"></div><div class="field"><label>Position</label><input id="category-position" type="number" min="-1000" max="1000" value="${esc(category?.position??100)}"></div>`,`<button class="secondary" data-close-modal>Cancel</button><button class="primary" data-save-category>Save</button>`);
    $('#modal-root').querySelector('[data-save-category]').onclick=async()=>{
      try{
        const payload={name:$('#category-name').value,position:+$('#category-position').value};
        if(category)await API.call('updateCategory',{categoryId:category.id,...payload});
        else await API.call('createCategory',{serverId:State.server.id,...payload});
        await selectServer(State.server.id);
        openCampaignControlCenter('structure');
      }catch(err){showError(err)}
    };
  }

  function openServerTransfer(){
    const candidates=Parity.control.members.filter(member=>member.userId!==State.user.id);
    modal('Transfer campaign ownership',`<div class="error-box">Ownership transfer changes who can delete the campaign and grant administrator access.</div><div class="field"><label>New owner</label><select id="new-server-owner">${candidates.map(member=>`<option value="${esc(member.userId)}">${esc(member.nickname||userName(member.user))}</option>`).join('')}</select></div>`,`<button class="secondary" data-close-modal>Cancel</button><button class="danger" data-confirm-server-transfer>Transfer ownership</button>`);
    $('#modal-root').querySelector('[data-confirm-server-transfer]').onclick=async()=>{
      const userId=$('#new-server-owner').value;
      if(!userId||!confirm('Transfer campaign ownership now?'))return;
      try{
        await API.call('transferOwnership',{serverId:State.server.id,userId});
        closeModal();
        await selectServer(State.server.id);
        toast('Campaign ownership transferred.','success');
      }catch(err){showError(err)}
    };
  }

  function installDrawerDismissal(){
    document.addEventListener('pointerdown',event=>{
      const sidebar=$('#sidebar');
      if(sidebar?.classList.contains('open')&&!sidebar.contains(event.target)&&!event.target.closest('[data-mobile-menu]'))sidebar.classList.remove('open');
      const members=$('#members');
      if(members?.classList.contains('open')&&!members.contains(event.target)&&!event.target.closest('[data-members]'))members.classList.remove('open');
    });
  }

  function installPresencePersistence(){
    const originalStartPolling=startPolling;
    startPolling=function(){
      originalStartPolling();
      clearInterval(State.heartbeatTimer);
      State.heartbeatTimer=setInterval(()=>API.call('heartbeat',{
        status:State.user?.status||'ONLINE',
        customStatus:State.user?.customStatus||'',
        serverIds:State.servers.map(server=>server.id)
      }).catch(()=>{}),State.clientConfig?.polling?.presenceHeartbeatMs||45000);
    };
  }

  bindPasswordVisibility();
  installRailControls();
  installSidebarUnread();
  installTopbarControls();
  installUserSettings();
  installMemberControls();
  installNewDmControls();
  installServerControlCenter();
  installDrawerDismissal();
  installPresencePersistence();
})();
