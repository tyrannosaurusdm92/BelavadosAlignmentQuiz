"use strict";

/**
 * Multi-System TTRPG Portal 3D dice bridge.
 * The parent multi-system engine owns rules interpretation, secure random results, system-specific
 * resolution, modifiers, keep/drop logic, campaign context, and edition-sensitive guidance.
 * This iframe only renders the exact dice and results supplied by the parent.
 */
window.onkeydown = function(e) {
  if (e.code === "Enter" || e.code === "Escape") e.preventDefault();
};

var main = (function() {
  var that = {}, elem = {}, box = null, queue = [], rolling = false;
  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function(ch){return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'})[ch];}); }
  function setResult(html) { if (elem.result) elem.result.innerHTML = html; }
  function setInputValue(value) { if (!elem.textInput) return; elem.textInput.value=String(value||'1d20'); elem.textInput.size=Math.max(1,elem.textInput.value.length); }
  function notify(payload) { try { window.parent && window.parent.postMessage(payload,'*'); } catch (_) {} }
  function normalizePayload(input) {
    if (typeof input === 'string') return {expression:input,displayExpression:input};
    return input && typeof input === 'object' ? input : {expression:'1d20'};
  }
  function runNextQueued() { if (!rolling && queue.length) that.rollInput(queue.shift()); }
  function diceApi() { return window.DICE || (typeof DICE !== 'undefined' ? DICE : null); }
  function applyVisualConfig(payload) {
    payload=payload||{}; var api=diceApi();
    if (api && typeof api.set_theme_pool==='function' && Array.isArray(payload.stylePool)) api.set_theme_pool(payload.stylePool);
    if (api && typeof api.set_sound_pool==='function' && Array.isArray(payload.soundPool)) api.set_sound_pool(payload.soundPool);
  }
  that.init=function(){
    elem.container=$t.id('diceRoller'); elem.result=$t.id('result'); elem.textInput=$t.id('textInput'); elem.numPad=$t.id('numPad'); elem.instructions=$t.id('instructions'); elem.center_div=$t.id('center_div'); elem.diceLimit=$t.id('diceLimit');
    box=new DICE.dice_box(elem.container); setInputValue('1d20'); box.setDice('1d20');
    setResult('<b>Multi-system 3D dice table ready.</b><br><small>The parent multi-system engine supplies exact authoritative results.</small>');
    notify({type:'DICEBOT_DICE_MAIN_READY',engine:'multi-system-ttrpg-portal'}); while(queue.length)that.rollInput(queue.shift());
  };
  that.rollInput=function(rawPayload){
    var payload=normalizePayload(rawPayload); if(!box){queue.push(payload);return;} if(rolling){queue.push(payload);return;}
    var expression=String(payload.expression||'1d20').replace(/\s+/g,'');
    var requested=Array.isArray(payload.requestedResults)?payload.requestedResults.map(Number).filter(Number.isFinite):null;
    var displayExpression=payload.displayExpression||expression;
    var displayTotal=Number.isFinite(Number(payload.displayTotal))?Number(payload.displayTotal):null;
    setInputValue(expression); var parsed=DICE.parse_notation(expression);
    if(!parsed||!parsed.set||!parsed.set.length){setResult('<b>Unsupported 3D notation.</b><br><small>'+esc(displayExpression)+'</small>');notify({type:'DICEBOT_DICE_MAIN_ERROR',expression:displayExpression,message:'Unsupported 3D notation; text result remains valid.'});runNextQueued();return;}
    if(parsed.set.length>20){if(elem.diceLimit)elem.diceLimit.style.display='block';notify({type:'DICEBOT_DICE_MAIN_ERROR',expression:displayExpression,message:'The 3D renderer supports up to 20 dice.'});runNextQueued();return;}
    if(elem.diceLimit)elem.diceLimit.style.display='none'; applyVisualConfig(payload); box.setDice(expression); rolling=true;
    setResult('<b>Rendering '+esc(displayExpression)+'…</b>');
    box.start_throw(function(){return requested&&requested.length?requested:null;},function(notation){
      rolling=false; var tableLine=notation&&notation.resultString?notation.resultString:'';
      setResult((displayTotal===null?esc(tableLine):'<b>Authoritative total: '+esc(displayTotal)+'</b>')+'<br><small>3D table: '+esc(tableLine)+'</small>');
      notify({type:'DICEBOT_DICE_MAIN_RESULT',expression:displayExpression,renderedExpression:expression,displayTotal:displayTotal,notation:notation||null}); setTimeout(runNextQueued,80);
    });
  };
  window.addEventListener('message',function(event){var data=event.data||{};if(data.type==='DICEBOT_DICE_MAIN_CONFIG'){applyVisualConfig(data.payload||data);return;}if(data.type==='DICEBOT_DICE_MAIN_ROLL')that.rollInput(data.payload||data);});
  window.TTRPGPortalDiceRenderer={roll:function(payload){that.rollInput(payload);}}; window.DnDPortalDiceRenderer=window.TTRPGPortalDiceRenderer;
  return that;
}());
