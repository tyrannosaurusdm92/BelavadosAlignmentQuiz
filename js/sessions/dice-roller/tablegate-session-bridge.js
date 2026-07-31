'use strict';
/* Connects the supplied 3D board to TableGate characters, nine-system rules, and shared roll events. */
(()=>{
  const engine=window.TableGateNineSystems;
  if(!engine)throw new Error('TableGate nine-system rules engine did not load.');
  let context={systemId:'dnd5e',character:null,user:null,color:'#00ffff',campaignId:'',channelId:'',sheetSrcdoc:''};
  let lastRequest=null;
  const safeColor=value=>/^#[0-9a-f]{6}$/i.test(String(value||''))?String(value):'#00ffff';
  const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const bot=()=>window.DiceBotChatbot?.instances?.[0]||null;
  const parentConnected=()=>window.parent&&window.parent!==window;
  function darken(hex,amount=.58){
    const n=parseInt(hex.slice(1),16);
    const channel=shift=>Math.max(0,Math.min(255,Math.round(((n>>shift)&255)*amount))).toString(16).padStart(2,'0');
    return`#${channel(16)}${channel(8)}${channel(0)}`;
  }
  function lighten(hex,amount=.55){
    const n=parseInt(hex.slice(1),16);
    const channel=shift=>Math.max(0,Math.min(255,Math.round(((n>>shift)&255)+(255-((n>>shift)&255))*amount))).toString(16).padStart(2,'0');
    return`#${channel(16)}${channel(8)}${channel(0)}`;
  }
  function contrastInk(hex){
    const n=parseInt(hex.slice(1),16),rgb=[(n>>16)&255,(n>>8)&255,n&255].map(c=>{c/=255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4});
    return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2]>.42?'#001010':'#f2ffff';
  }
  function customTheme(color){
    color=safeColor(color);
    return {slug:'tablegate-player-color',name:'Player-selected roll color',description:'TableGate account roll color',base:darken(color,.36),base2:color,ink:contrastInk(color),edge:darken(color,.64),glow:lighten(color,.62)};
  }
  function installStyles(){
    if(document.getElementById('tablegate-session-bridge-style'))return;
    const style=document.createElement('style');
    style.id='tablegate-session-bridge-style';
    style.textContent=`
      :root{--tg-roll-color:#00ffff;--tg-roll-ink:#001010}
      .tablegate-system-panel{display:grid;gap:10px;padding:13px;border:2px solid var(--tg-roll-color);border-radius:14px;background:linear-gradient(145deg,#001010ee,#003333e8);box-shadow:0 0 24px color-mix(in srgb,var(--tg-roll-color) 32%,transparent)}
      .tablegate-system-panel label{display:grid;gap:5px;font-weight:900;color:#f2ffff}
      .tablegate-system-panel select{width:100%;padding:9px;border:1px solid var(--tg-roll-color);border-radius:8px;background:#f2ffff;color:#001010}
      .tablegate-system-help,.tablegate-character-status{margin:0;color:#bfffff;font-size:12px;line-height:1.45}
      .tablegate-quick-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}
      .tablegate-quick-actions button{min-width:0;border-color:var(--tg-roll-color);background:var(--tg-roll-color);color:var(--tg-roll-ink);font-weight:900}
      .tablegate-roll-card{position:fixed;z-index:100000;left:50%;top:18px;translate:-50% -140%;width:min(620px,calc(100% - 24px));padding:14px 18px;border:3px solid var(--tg-event-color,#00ffff);border-radius:18px;background:#001010f2;color:#f2ffff;box-shadow:0 0 44px color-mix(in srgb,var(--tg-event-color,#00ffff) 58%,transparent);pointer-events:none;opacity:0;transition:translate .22s ease,opacity .22s ease}
      .tablegate-roll-card.show{translate:-50% 0;opacity:1}
      .tablegate-roll-card .total{display:inline-grid;place-items:center;min-width:66px;height:66px;margin-right:12px;border-radius:50%;background:var(--tg-event-color,#00ffff);color:var(--tg-event-ink,#001010);font-size:28px;font-weight:1000;vertical-align:middle}
      .tablegate-roll-card .copy{display:inline-block;max-width:calc(100% - 88px);vertical-align:middle}
      .tablegate-roll-card b,.tablegate-roll-card small{display:block}.tablegate-roll-card small{margin-top:4px;color:#bfffff}
      body.tablegate-has-character .roleplay-board-title .mini{color:#bfffff}
      @media(max-width:640px){.tablegate-quick-actions{grid-template-columns:1fr}.tablegate-roll-card{top:8px;padding:10px}.tablegate-roll-card .total{min-width:52px;height:52px;font-size:22px}}
    `;
    document.head.appendChild(style);
  }
  function updateTheme(){
    const color=safeColor(context.color);
    document.documentElement.style.setProperty('--tg-roll-color',color);
    document.documentElement.style.setProperty('--tg-roll-ink',contrastInk(color));
  }
  function ensurePanel(){
    if(document.getElementById('tablegateSystemPanel'))return;
    const root=document.querySelector('[data-dicebot-chatbot]');
    if(!root)return;
    const panel=document.createElement('section');
    panel.id='tablegateSystemPanel';
    panel.className='tablegate-system-panel';
    panel.setAttribute('aria-label','Game system dice controls');
    panel.innerHTML=`<label>Game system<select id="tablegateSystemSelect">${engine.ORDER.map(id=>`<option value="${id}">${escapeHtml(engine.SYSTEMS[id].name)}</option>`).join('')}</select></label><p class="tablegate-character-status" id="tablegateCharacterStatus">No saved character is active.</p><p class="tablegate-system-help" id="tablegateSystemHelp"></p><div class="tablegate-quick-actions" id="tablegateQuickActions"></div>`;
    root.insertBefore(panel,root.querySelector('[data-quick-rolls]')||root.firstChild);
    panel.querySelector('select').addEventListener('change',event=>{
      context.systemId=engine.normalizeSystem(event.target.value);
      renderPanel();
      notify({type:'TABLEGATE_SYSTEM_CHANGED',systemId:context.systemId});
    });
    renderPanel();
  }
  function renderPanel(){
    const def=engine.definition(context.systemId),select=document.getElementById('tablegateSystemSelect');
    if(select)select.value=def.id;
    const status=document.getElementById('tablegateCharacterStatus');
    if(status)status.textContent=context.character?`${context.character.name||'Saved character'} · completed ${def.name} sheet loaded`:`${def.name} · no saved character selected`;
    const help=document.getElementById('tablegateSystemHelp');
    if(help)help.textContent=def.help;
    const quick=document.getElementById('tablegateQuickActions');
    if(quick){
      quick.innerHTML=def.quick.map(label=>`<button type="button" data-tablegate-action="${escapeHtml(label)}">${escapeHtml(label)}</button>`).join('');
      quick.querySelectorAll('[data-tablegate-action]').forEach(button=>button.addEventListener('click',()=>requestRoll(button.dataset.tablegateAction)));
    }
    const input=document.querySelector('[data-chat-input]');
    if(input)input.placeholder=`Ask the ${def.name} bot to roll, include a modifier or target, or enter ${def.defaultExpression}.`;
  }
  function characterFrame(){
    return document.getElementById('characterSheetIframe')||document.getElementById('sitePlaceholderIframe');
  }
  function installCharacterSheet(){
    const frame=characterFrame();
    if(!frame)return;
    frame.id='characterSheetIframe';
    frame.classList.remove('site-placeholder-frame');
    frame.classList.add('character-sheet-frame');
    frame.title=context.character?`${context.character.name||'Saved character'} character sheet`:'Saved character sheet';
    frame.setAttribute('aria-label',frame.title);
    if(context.sheetSrcdoc){
      frame.srcdoc=context.sheetSrcdoc;
      document.body.classList.add('tablegate-has-character');
    }
    const title=document.querySelector('.roleplay-board-title .mini');
    if(title)title.textContent=context.character?`${context.character.name||'Saved character'} is active. Shared dice animate above the completed sheet.`:'Choose a saved TableGate character to load a completed sheet.';
  }
  function notify(payload){
    if(parentConnected())window.parent.postMessage(payload,'*');
  }
  function requestRoll(message,overrides={}){
    const request={...engine.infer(context.systemId,message,context.character),...overrides};
    request.systemId=engine.normalizeSystem(request.systemId||context.systemId);
    request.color=safeColor(context.color);
    request.characterId=context.character?.id||'';
    request.characterName=context.character?.name||'';
    request.campaignId=context.campaignId||'';
    request.channelId=context.channelId||'';
    lastRequest=request;
    const activeBot=bot();
    activeBot?.say?.(escapeHtml(message||request.label),'user');
    activeBot?.setStatus?.(`Requesting an authoritative ${engine.definition(request.systemId).name} roll…`);
    if(parentConnected()){
      notify({type:'TABLEGATE_ROLL_REQUEST',request});
      return request;
    }
    try{
      const roll=activeBot?.rollExpression?.(request.expression);
      if(!roll)throw new Error('Dice bot is unavailable.');
      const event=engine.serializeRoll({total:roll.total,detail:roll.parts.map(part=>part.kind==='dice'?{type:'dice',count:part.count,sides:part.sides,rolls:part.rolls,subtotal:part.total}:{type:'modifier',subtotal:part.total})},request,{expression:request.expression,label:request.label,color:request.color,rollerName:'Local player'});
      receiveRoll(event);
    }catch(error){
      activeBot?.say?.(escapeHtml(error.message),'bot');
      activeBot?.setStatus?.('Roll could not be completed.');
    }
    return request;
  }
  function rollObject(event){
    const parts=(event.detail||[]).map(term=>{
      if(term.type==='modifier')return{kind:'modifier',text:String(term.subtotal??term.total??0),total:Number(term.subtotal??term.total??0)};
      const rolls=(term.rolls||[]).map(Number),sides=Number(term.sides||6);
      return{kind:'dice',token:`${term.count||rolls.length||1}d${sides}`,count:Number(term.count||rolls.length||1),sides,rolls,included:rolls.map(()=>true),flags:rolls.map(()=>({rerolled:false,exploded:false})),total:Number(term.subtotal??rolls.reduce((a,b)=>a+b,0))};
    });
    return{expression:event.expression||'1d20',total:Number(event.total),parts};
  }
  function animate(event){
    const activeBot=bot(),roll=rollObject(event),theme=customTheme(event.color||context.color);
    if(activeBot){
      activeBot.postDiceMainPayload?.({
        expression:(event.detail||[]).filter(term=>term.type!=='modifier').map(term=>`${Math.max(1,Number(term.rolls?.length||term.count||1))}d${Number(term.sides||6)}`).join('+')||'1d20',
        requestedResults:event.requestedResults||engine.resolve(event.systemId,{detail:event.detail,total:event.backendTotal},event.resolution?.context||lastRequest||{}).rolls,
        displayExpression:event.expression,displayTotal:event.total,stylePool:[theme],
        soundPool:activeBot.getSelectedAudioPool?.()||[]
      });
      activeBot.diceRow&&(activeBot.diceRow.textContent=(event.requestedResults||[]).join(' · '));
      activeBot.diceStageTitle&&(activeBot.diceStageTitle.textContent=`${event.systemName||engine.definition(event.systemId).name}: ${event.label} — ${event.total}`);
    }
  }
  function popup(event){
    document.querySelector('.tablegate-roll-card')?.remove();
    const color=safeColor(event.color||context.color),card=document.createElement('div');
    card.className='tablegate-roll-card';
    card.setAttribute('role','status');
    card.setAttribute('aria-live','assertive');
    card.style.setProperty('--tg-event-color',color);
    card.style.setProperty('--tg-event-ink',contrastInk(color));
    card.innerHTML=`<span class="total">${escapeHtml(event.total)}</span><span class="copy"><b>${escapeHtml(event.rollerName||'Player')} · ${escapeHtml(event.label||event.expression)}</b><span>${escapeHtml(event.outcome||'Rolled')}</span><small>${escapeHtml(event.systemName||engine.definition(event.systemId).name)} · ${escapeHtml(event.explanation||event.expression||'')}</small></span>`;
    document.body.appendChild(card);
    requestAnimationFrame(()=>card.classList.add('show'));
    setTimeout(()=>{card.classList.remove('show');setTimeout(()=>card.remove(),260)},5200);
  }
  function receiveRoll(event){
    if(!event||!event.systemId)return;
    animate(event);
    popup(event);
    const activeBot=bot();
    activeBot?.say?.(escapeHtml(engine.botResponse(event.systemId,event.resolution||{total:event.total,outcome:event.outcome,detail:event.explanation},event.label)),'bot');
    activeBot?.setStatus?.('Shared roll received and displayed.');
  }
  function handleMessage(event){
    const data=event.data||{};
    if(!data||typeof data!=='object')return;
    if(data.type==='TABLEGATE_SESSION_CONTEXT'){
      context={...context,...data.context};
      context.systemId=engine.normalizeSystem(context.systemId||context.character?.sheetId);
      context.color=safeColor(context.color);
      updateTheme();ensurePanel();renderPanel();installCharacterSheet();
      notify({type:'TABLEGATE_DICE_READY',systemId:context.systemId,characterId:context.character?.id||''});
    }else if(data.type==='TABLEGATE_SESSION_ROLL'){
      receiveRoll(data.roll||data.payload);
    }else if(data.type==='TABLEGATE_SHEET_STATE_UPDATE'&&context.character){
      context.character.state=data.state||data.sheetState||context.character.state;
      context.character.sheetState=context.character.state;
    }else if(event.source===characterFrame()?.contentWindow&&String(data.type||'').startsWith('TABLEGATE_')){
      notify(data);
    }
  }
  function interceptDiceBot(){
    document.addEventListener('submit',event=>{
      if(!event.target?.matches?.('[data-chat-form]'))return;
      event.preventDefault();event.stopImmediatePropagation();
      const input=document.querySelector('[data-chat-input]'),message=String(input?.value||'').trim();
      if(!message)return;
      input.value='';
      if(/^(help|commands|what can you do)$/i.test(message)){
        const def=engine.definition(context.systemId);
        bot()?.say?.(`${escapeHtml(def.help)} Quick actions: ${def.quick.map(escapeHtml).join(', ')}.`,'bot');
        return;
      }
      requestRoll(message);
    },true);
    document.addEventListener('click',event=>{
      const button=event.target?.closest?.('[data-quick-roll]');
      if(!button)return;
      event.preventDefault();event.stopImmediatePropagation();
      requestRoll(button.dataset.quickRoll||engine.definition(context.systemId).defaultExpression);
    },true);
  }
  function init(){
    installStyles();updateTheme();ensurePanel();installCharacterSheet();interceptDiceBot();
    window.addEventListener('message',handleMessage);
    window.TableGateSessionDice=Object.freeze({requestRoll,receiveRoll,getContext:()=>({...context}),systems:engine.SYSTEMS});
    notify({type:'TABLEGATE_DICE_READY',systemId:context.systemId,characterId:''});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
