'use strict';
/* TableGate universal session dice: saved-sheet hydration, shared color rolls, and nine-system resolution. */
(()=>{
  const engine=window.TableGateNineSystems,data=window.TableGateCharacterData,play=window.TableGateSessionPlay,privateDice=window.TableGatePrivateDice;
  if(!engine||!data||!play||!privateDice)return;
  const ROOT_URL=new URL('./',location.href).href;
  const MARKER=/\s*\[\[TABLEGATE_ROLL:([A-Za-z0-9_-]+)\]\]/g;
  const seen=new Set();
  const channel=typeof BroadcastChannel==='function'?new BroadcastChannel('tablegate-shared-dice-v9'):null;
  const safeColor=value=>/^#[0-9a-f]{6}$/i.test(String(value||''))?String(value):'#00ffff';
  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const clone=value=>JSON.parse(JSON.stringify(value));
  const currentCharacter=()=>data.selected();
  const systemFor=character=>engine.normalizeSystem(character?.sheetId||'dnd5e');
  const colorKey=()=>`tablegate.diceColor.${State.user?.id||'local'}`;
  const currentColor=()=>safeColor(Store.get(colorKey(),State.user?.diceColor||State.user?.accentColor||'#00ffff'));
  const currentChannelId=()=>State.channel?.id||'';
  function colorInk(hex){
    const n=parseInt(safeColor(hex).slice(1),16),rgb=[(n>>16)&255,(n>>8)&255,n&255].map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});
    return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2]>.42?'#001010':'#f2ffff';
  }
  function encode(value){
    const bytes=new TextEncoder().encode(JSON.stringify(value));
    let raw='';bytes.forEach(byte=>raw+=String.fromCharCode(byte));
    return btoa(raw).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  }
  function decode(value){
    try{
      const raw=atob(String(value).replace(/-/g,'+').replace(/_/g,'/')+'==='.slice((String(value).length+3)%4));
      return JSON.parse(new TextDecoder().decode(Uint8Array.from(raw,char=>char.charCodeAt(0))));
    }catch(_){return null}
  }
  function diceDocument(){
    const source=window.TableGateToolDocuments?.sessionDice;
    if(!source)throw new Error('The universal Session Dice document is unavailable.');
    return source.replaceAll('__TABLEGATE_ROOT_URL__',ROOT_URL);
  }
  function sessionContext(character=currentCharacter(),overrides={}){
    const color=safeColor(overrides.color||currentColor());
    return {
      campaignId:data.sid(),channelId:overrides.channelId??currentChannelId(),systemId:engine.normalizeSystem(overrides.systemId||character?.sheetId),
      character:character?clone(character):null,sheetSrcdoc:character?data.sheetSrcdoc(character,true):'',
      user:{id:State.user?.id||'',name:State.user?.username||'Player',diceColor:color},color,mode:overrides.mode||'public'
    };
  }
  function sendContext(frameOrWindow,overrides={}){
    const target=frameOrWindow?.contentWindow||frameOrWindow;
    if(!target?.postMessage)return;
    target.postMessage({type:'TABLEGATE_SESSION_CONTEXT',context:sessionContext(overrides.character||currentCharacter(),overrides)},'*');
  }
  function randomInt(max){
    if(globalThis.crypto?.getRandomValues){
      const ceiling=Math.floor(0x100000000/max)*max,array=new Uint32Array(1);let value;
      do{crypto.getRandomValues(array);value=array[0]}while(value>=ceiling);
      return value%max+1;
    }
    return Math.floor(Math.random()*max)+1;
  }
  function localRoll(expression){
    const clean=String(expression||'1d20').toLowerCase().replace(/\s+/g,''),tokens=clean.match(/[+-]?(?:\d*d(?:4|6|8|10|12|20|100)(?:!)?|\d+)/g)||[];
    const detail=[];let total=0;
    for(const token of tokens){
      const sign=token.startsWith('-')?-1:1,body=token.replace(/^[+-]/,'');
      if(/^\d+$/.test(body)){const subtotal=sign*Number(body);detail.push({type:'modifier',subtotal});total+=subtotal;continue}
      const match=body.match(/^(\d*)d(4|6|8|10|12|20|100)(!)?$/);
      if(!match)continue;
      const count=Math.max(1,Math.min(100,Number(match[1]||1))),sides=Number(match[2]),rolls=[];
      for(let index=0;index<count;index++){
        let value=randomInt(sides),guard=0;rolls.push(value);
        while(match[3]&&value===sides&&guard++<25){value=randomInt(sides);rolls.push(value)}
      }
      const subtotal=sign*rolls.reduce((a,b)=>a+b,0);detail.push({type:'dice',count,sides,rolls,subtotal});total+=subtotal;
    }
    if(!detail.some(term=>term.type==='dice'))return localRoll('1d20');
    return{total,detail};
  }
  function normalizedResult(raw,expression){
    const result=raw?.roll||raw?.result||raw||{};
    if(!Array.isArray(result.detail)||!result.detail.length)return localRoll(expression);
    const detail=result.detail.map(term=>term.type==='modifier'
      ?{type:'modifier',subtotal:Number(term.subtotal??term.total??0)}
      :{type:'dice',count:Number(term.count||term.rolls?.length||1),sides:Number(term.sides||6),rolls:(term.rolls||[]).map(Number),subtotal:Number(term.subtotal??(term.rolls||[]).reduce((a,b)=>a+Number(b),0))});
    return{...result,total:Number(result.total),detail};
  }
  async function backendDie(sides,channelId){
    try{
      const raw=await API.call('rollDice',{channelId,expression:`1d${sides}`,label:'SWADE ace continuation',systemId:'swade',postMessage:false});
      return normalizedResult(raw,`1d${sides}`).detail.find(term=>term.type==='dice')?.rolls?.[0]||randomInt(sides);
    }catch(_){return randomInt(sides)}
  }
  async function completeSwadeAces(result,request,channelId){
    if(request.systemId!=='swade')return result;
    const terms=result.detail.filter(term=>term.type==='dice').slice(0,2),sides=[Number(request.traitSides||terms[0]?.sides||6),6];
    for(let index=0;index<terms.length;index++){
      let value=terms[index].rolls.at(-1),guard=0;
      while(value===sides[index]&&guard++<25){value=await backendDie(sides[index],channelId);terms[index].rolls.push(value)}
      terms[index].subtotal=terms[index].rolls.reduce((a,b)=>a+b,0);
    }
    result.total=result.detail.reduce((sum,term)=>sum+Number(term.subtotal||0),0);
    return result;
  }
  async function authoritative(request,postPublic,channelId){
    const transport=String(request.expression||engine.definition(request.systemId).defaultExpression).replace(/!/g,'');
    let result;
    if(channelId){
      try{
        result=normalizedResult(await API.call('rollDice',{
          channelId,expression:transport,label:request.label||'Character roll',personaId:Store.get(`persona.${data.sid()}`,''),
          systemId:request.systemId,characterId:request.characterId||'',rollerColor:request.color,context:request,postMessage:false
        }),transport);
      }catch(error){
        console.warn('Backend roll unavailable; using the cryptographic local fallback.',error);
      }
    }
    result=result||localRoll(transport);
    return completeSwadeAces(result,request,channelId);
  }
  function saveRoll(event,isPrivate=false){
    const vault=data.load();
    vault.rollLog.unshift({
      id:event.id,serverId:data.sid(),characterId:event.characterId,characterName:event.characterName,
      rollerId:event.rollerId,rollerName:event.rollerName,expression:event.expression,label:event.label,total:event.total,
      outcome:event.outcome,systemId:event.systemId,color:event.color,detail:event.detail,private:isPrivate,at:event.createdAt
    });
    vault.rollLog=vault.rollLog.slice(0,250);
    data.save(vault,false);
  }
  function messageText(event){
    return `🎲 **${event.rollerName}** rolled **${event.label||event.expression}** for ${event.characterName||event.systemName}: **${event.total} — ${event.outcome}**\n${event.systemName}: ${event.explanation}\n[[TABLEGATE_ROLL:${encode(event)}]]`;
  }
  async function publish(event){
    if(!event.channelId)return;
    const payload={
      scopeType:'CHANNEL',scopeId:event.channelId,content:messageText(event),attachmentIds:[],replyToId:'',messageType:'CHAT',
      personaId:Store.get(`persona.${data.sid()}`,''),mentionUserIds:[],mentionRoleIds:[],mentionsEveryone:false,
      metadata:{tablegateRoll:event},rollData:event
    };
    await API.call('sendMessage',payload);
    API.call('broadcastDiceRoll',{serverId:event.campaignId,channelId:event.channelId,roll:event}).catch(()=>{});
    if(State.channel?.id===event.channelId&&typeof loadMessages==='function'){
      await loadMessages();renderMessages();
    }
  }
  function eventFrames(){
    return [...document.querySelectorAll('#session-universal-dice-frame,#private-universal-dice-frame,[data-tool-frame="sessionDice"]')];
  }
  function globalPopup(event){
    document.querySelector('.tablegate-shared-roll-popup')?.remove();
    const element=document.createElement('div'),color=safeColor(event.color);
    element.className='tablegate-shared-roll-popup';
    element.setAttribute('role','status');element.setAttribute('aria-live','assertive');
    element.style.setProperty('--roll-color',color);element.style.setProperty('--roll-ink',colorInk(color));
    element.innerHTML=`<span class="roll-total">${esc(event.total)}</span><span><b>${esc(event.rollerName)} · ${esc(event.label||event.expression)}</b><strong>${esc(event.outcome)}</strong><small>${esc(event.systemName)} · ${esc(event.characterName||'Campaign roll')}</small></span>`;
    document.body.appendChild(element);requestAnimationFrame(()=>element.classList.add('show'));
    setTimeout(()=>{element.classList.remove('show');setTimeout(()=>element.remove(),260)},5600);
  }
  function dispatch(event,{relay=true}={}){
    if(!event?.id||seen.has(event.id))return false;
    seen.add(event.id);
    eventFrames().forEach(frame=>frame.contentWindow?.postMessage({type:'TABLEGATE_SESSION_ROLL',roll:event},'*'));
    globalPopup(event);
    if(relay)channel?.postMessage(event);
    const result=document.getElementById('session-result');
    if(result)result.textContent=`${event.rollerName}: ${event.label||event.expression} = ${event.total} — ${event.outcome}`;
    return true;
  }
  function parseMessage(message){
    MARKER.lastIndex=0;
    const match=MARKER.exec(String(message?.content||''));
    return match?decode(match[1]):message?.metadata?.tablegateRoll||message?.rollData||null;
  }
  function scanMessages(){
    for(const message of State.messages||[]){
      const event=parseMessage(message);
      if(!event?.id||seen.has(event.id))continue;
      const age=Math.abs(Date.now()-new Date(event.createdAt||message.createdAt||0).getTime());
      if(age<90000)dispatch(event);else seen.add(event.id);
    }
  }
  if(typeof API!=='undefined'&&typeof API.call==='function'&&!API.__tablegateDiceEvents){
    const originalApiCall=API.call.bind(API);
    API.call=async function(action,payload,...rest){
      const response=await originalApiCall(action,payload,...rest);
      if(action==='pollEvents'){
        for(const backendEvent of response?.events||[]){
          if(/DICE.*ROLL|ROLL.*DICE/i.test(String(backendEvent.eventType||''))){
            const rollEvent=backendEvent.payload?.roll||backendEvent.payload?.tablegateRoll||backendEvent.roll;
            if(rollEvent?.id)dispatch(rollEvent);
          }
        }
      }
      return response;
    };
    try{Object.defineProperty(API,'__tablegateDiceEvents',{value:true})}catch(_){}
  }
  if(typeof window.markdown==='function'){
    const originalMarkdown=window.markdown;
    window.markdown=text=>originalMarkdown(String(text||'').replace(MARKER,''));
  }
  if(typeof window.renderMessages==='function'){
    const originalRenderMessages=window.renderMessages;
    window.renderMessages=function(){const value=originalRenderMessages.apply(this,arguments);scanMessages();return value};
  }
  channel?.addEventListener('message',event=>dispatch(event.data,{relay:false}));
  async function roll(request={},options={}){
    const character=options.character||currentCharacter();
    const inferred={...engine.infer(request.systemId||character?.sheetId,request.label||request.expression||'',character),...request};
    inferred.systemId=engine.normalizeSystem(inferred.systemId||character?.sheetId);
    inferred.expression=String(request.expression||inferred.expression||engine.definition(inferred.systemId).defaultExpression);
    inferred.color=safeColor(request.color||currentColor());
    inferred.characterId=character?.id||request.characterId||'';
    inferred.characterName=character?.name||request.characterName||'';
    const postPublic=options.public!==false,channelId=options.channelId??(postPublic?currentChannelId():'');
    const result=await authoritative(inferred,postPublic,channelId);
    const event=engine.serializeRoll(result,inferred,{
      expression:inferred.expression,label:inferred.label||request.label||'Character roll',rollerId:State.user?.id||'local',
      rollerName:State.user?.username||data.memberName(State.user?.id)||'Player',characterId:inferred.characterId,characterName:inferred.characterName,
      color:inferred.color,campaignId:data.sid(),channelId,public:postPublic
    });
    saveRoll(event,!postPublic);
    dispatch(event);
    if(postPublic&&channelId)try{await publish(event)}catch(error){toast(`The roll was completed locally, but could not be shared: ${error.message}`,'error')}
    return event;
  }
  function sessionLogRows(){
    const rows=data.load().rollLog.slice(0,60);
    return rows.map(row=>`<div class="dice-log-row ${row.private?'private':''}" style="--entry-color:${safeColor(row.color||'#00ffff')}"><span class="total">${esc(row.total)}</span><div><b>${esc(row.label||row.expression)}</b><small>${esc(row.characterName||row.rollerName)} · ${esc(engine.definition(row.systemId||'dnd5e').name)} · ${esc(row.outcome||row.expression)} · ${new Date(row.at).toLocaleString()}</small></div><span>${row.private?'Private':'Shared'}</span></div>`).join('')||'<p>No rolls in this campaign yet.</p>';
  }
  play.render=function(){
    const vault=data.load(),characters=data.visible(vault),character=currentCharacter();
    if(!character)return`<div class="session-shell"><section class="v5-hero"><div><h2>Live Dice & Character Sheet</h2><p>Create or import a campaign character first.</p></div><button class="primary" data-go-vault>Open Character Sheets</button></section></div>`;
    const system=engine.definition(character.sheetId),color=currentColor();
    return`<div class="session-shell"><section class="v5-hero"><div><span class="eyebrow">SHARED SESSION ROLLS</span><h2>Universal Dice on Completed Character Sheets</h2><p>${esc(system.name)} rules, the filled saved sheet, the selected roll color, and the same authoritative result are synchronized across the session.</p></div><div class="v5-actions"><button data-go-vault>Manage characters</button>${CampaignIsolation.canCreate()?'<button data-private-dice>Private runner dice</button>':''}</div></section><div class="session-toolbar v5-card"><div class="v5-field"><label>Active saved character in ${esc(State.server?.name||'this campaign')}</label><select id="session-character">${characters.map(item=>`<option value="${esc(item.id)}" ${item.id===character.id?'selected':''}>${esc(item.name)} — ${esc(data.sheetById(item.sheetId)?.name||item.sheetId)}${CampaignIsolation.canCreate()?` — ${esc(data.memberName(item.ownerId))}`:''}</option>`).join('')}</select></div><div class="v5-field"><label>Roll color</label><input id="session-roll-color" type="color" value="${color}"><small>Dice, bot result, and every shared popup use this color.</small></div><div class="v5-note">Shared rolls post to ${State.channel?`#${esc(State.channel.name)}`:'the local log until a text channel is selected'}.</div></div><div class="session-dice-controls"><div class="v5-field"><label>System</label><select id="session-system">${engine.ORDER.map(id=>`<option value="${id}" ${id===system.id?'selected':''}>${esc(engine.SYSTEMS[id].name)}</option>`).join('')}</select></div><div class="v5-field"><label>Roll expression</label><input id="session-expression" value="${esc(system.defaultExpression)}" placeholder="${esc(system.defaultExpression)}"></div><div class="v5-field"><label>Action, skill, or purpose</label><input id="session-label" placeholder="${esc(system.quick[0])}"></div><label><input id="session-public" type="checkbox" checked> Share with session</label><button class="primary" data-session-roll>Roll for everyone</button></div><div class="session-table universal-session-table"><iframe class="session-universal-dice-frame" id="session-universal-dice-frame" title="Universal dice and ${esc(character.name)} character sheet"></iframe><div class="session-result" id="session-result"></div></div><section class="v5-card"><div class="card-head"><h3>Campaign dice log</h3><span>${vault.rollLog.length}</span></div><div class="dice-log" id="session-dice-log">${sessionLogRows()}</div></section></div>`;
  };
  play.bind=function(shell){
    shell.querySelectorAll('[data-go-vault]').forEach(button=>button.onclick=()=>Workspace.open('characters'));
    shell.querySelector('[data-private-dice]')?.addEventListener('click',()=>Workspace.open('privateDice'));
    const character=currentCharacter(),frame=shell.querySelector('#session-universal-dice-frame'),select=shell.querySelector('#session-character');
    if(select)select.onchange=()=>{data.setSelected(select.value);Workspace.render()};
    if(!character||!frame)return;
    frame.srcdoc=diceDocument();
    frame.addEventListener('load',()=>sendContext(frame,{character,color:currentColor()}));
    shell.querySelector('#session-roll-color')?.addEventListener('change',event=>{
      const color=safeColor(event.target.value);Store.set(colorKey(),color);State.user.diceColor=color;
      API.call('updateProfile',{diceColor:color}).catch(()=>{});
      sendContext(frame,{character,color});
    });
    shell.querySelector('#session-system')?.addEventListener('change',event=>{
      const def=engine.definition(event.target.value),input=shell.querySelector('#session-expression');
      if(input)input.value=def.defaultExpression;
      sendContext(frame,{character,systemId:def.id,color:currentColor()});
    });
    shell.querySelector('[data-session-roll]')?.addEventListener('click',()=>roll({
      systemId:shell.querySelector('#session-system')?.value||systemFor(character),
      expression:shell.querySelector('#session-expression')?.value,
      label:shell.querySelector('#session-label')?.value||engine.definition(character.sheetId).quick[0],
      color:shell.querySelector('#session-roll-color')?.value
    },{character,public:shell.querySelector('#session-public')?.checked!==false}));
  };
  play.roll=(expression,label,post,character=currentCharacter())=>roll({systemId:character?.sheetId,expression,label,color:currentColor()},{character,public:post!==false});
  privateDice.render=function(){
    if(!CampaignIsolation.canCreate())return'<div class="empty-workspace">Campaign-runner permission required.</div>';
    const color=currentColor();
    return`<div class="private-dice-shell"><section class="v5-hero"><div><span class="eyebrow">RUNNER-ONLY DICE</span><h2>Private Nine-System Dice Bot</h2><p>DM, GM, MOL, Master of Lore, Storyteller, Keeper, Referee, and equivalent campaign runners may use every supported rules engine without revealing a check.</p></div></section><div class="private-bot-grid"><section class="v5-card"><iframe id="private-universal-dice-frame" class="private-universal-dice-frame" title="Private universal dice"></iframe><div class="v5-form-grid"><div class="v5-field"><label>System</label><select id="private-system">${engine.ORDER.map(id=>`<option value="${id}">${esc(engine.SYSTEMS[id].name)}</option>`).join('')}</select></div><div class="v5-field"><label>Expression</label><input id="private-expression" value="4d6"></div><div class="v5-field"><label>Purpose</label><input id="private-label" placeholder="Secret check"></div><div class="v5-field"><label>Roll color</label><input id="private-color" type="color" value="${color}"></div><div class="v5-field"><label>Optional admin channel</label><select id="private-channel"><option value="">Keep private</option>${(State.serverDetail?.channels||[]).filter(item=>['TEXT','ANNOUNCEMENT'].includes(item.type)).map(item=>`<option value="${esc(item.id)}">#${esc(item.name)}</option>`).join('')}</select></div></div><button class="primary" data-private-roll>Roll with the selected system</button></section><aside class="v5-card"><h3>Private campaign log</h3><div class="dice-log">${data.load().rollLog.filter(item=>item.private).slice(0,80).map(item=>`<div class="dice-log-row private"><span class="total">${esc(item.total)}</span><div><b>${esc(item.label||item.expression)}</b><small>${esc(engine.definition(item.systemId||'dnd5e').name)} · ${new Date(item.at).toLocaleString()}</small></div><span>Private</span></div>`).join('')||'<p>No private checks yet.</p>'}</div></aside></div></div>`;
  };
  privateDice.bind=function(shell){
    const frame=shell.querySelector('#private-universal-dice-frame'),character=currentCharacter();
    if(frame){frame.srcdoc=diceDocument();frame.addEventListener('load',()=>sendContext(frame,{character,systemId:'fate',mode:'private',channelId:'',color:currentColor()}))}
    shell.querySelector('#private-system')?.addEventListener('change',event=>{
      const def=engine.definition(event.target.value);shell.querySelector('#private-expression').value=def.defaultExpression;
      sendContext(frame,{character,systemId:def.id,mode:'private',channelId:'',color:shell.querySelector('#private-color').value});
    });
    shell.querySelector('#private-color')?.addEventListener('change',event=>sendContext(frame,{character,systemId:shell.querySelector('#private-system').value,mode:'private',channelId:'',color:event.target.value}));
    shell.querySelector('[data-private-roll]')?.addEventListener('click',async()=>{
      const channelId=shell.querySelector('#private-channel').value;
      await roll({systemId:shell.querySelector('#private-system').value,expression:shell.querySelector('#private-expression').value,label:shell.querySelector('#private-label').value||'Private check',color:shell.querySelector('#private-color').value},{character,public:Boolean(channelId),channelId});
      if(!channelId)setTimeout(()=>Workspace.render(),1200);
    });
  };
  function sourceFrame(source){return eventFrames().find(frame=>frame.contentWindow===source)||null}
  play.handleMessage=function(event){
    const message=event.data||{},frame=sourceFrame(event.source);
    if(message.type==='TABLEGATE_DICE_READY'){sendContext(event.source,{mode:frame?.id==='private-universal-dice-frame'?'private':'public'});return}
    if(message.type==='TABLEGATE_ROLL_REQUEST'){
      const isPrivate=frame?.id==='private-universal-dice-frame',character=currentCharacter();
      roll(message.request||{},{character,public:!isPrivate}).catch(error=>toast(error.message,'error'));return;
    }
    if(message.type==='TABLEGATE_SYSTEM_CHANGED'&&frame?.id==='session-universal-dice-frame'){
      const select=document.getElementById('session-system');if(select)select.value=engine.normalizeSystem(message.systemId);
    }
    if(message.type==='TABLEGATE_SHEET_ROLL_REQUEST'){
      const character=currentCharacter(),label=message.label||message.action||'Character roll';
      roll({systemId:character?.sheetId,expression:message.expression||message.roll,label,color:currentColor()},{character,public:true}).catch(error=>toast(error.message,'error'));return;
    }
    if(message.type==='TABLEGATE_SHEET_STATE'){
      const vault=data.load(),characterId=message.characterId||message.context?.characterId,character=vault.characters.find(item=>item.id===characterId);
      if(character&&character.serverId===data.sid()&&(character.ownerId===data.ownerId()||CampaignIsolation.canCreate())){
        character.state=message.sheetState||message.state||message.payload||character.state;
        character.sheetState=character.state;character.appearance=message.appearance||character.appearance;character.updatedAt=new Date().toISOString();
        data.save(vault);event.source?.postMessage({type:'TABLEGATE_SHEET_STATE_UPDATE',state:character.state},'*');
      }
    }
  };
  window.TableGateSessionRolls=Object.freeze({
    roll,dispatch,sendContext,sessionContext,diceDocument,scanMessages,parseMessage,currentColor,
    test:Object.freeze({localRoll,encode,decode,completeSwadeAces,authoritative})
  });
})();
