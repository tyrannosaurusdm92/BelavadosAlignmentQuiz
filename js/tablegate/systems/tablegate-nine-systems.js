'use strict';
/* TableGate's shared rules-aware dice model for all nine supported character systems. */
(()=>{
  const SYSTEMS=Object.freeze({
    fate:Object.freeze({
      id:'fate',sheet:'01_fate_core_campaign_storyboard',name:'Fate Core',
      defaultExpression:'4d6',quick:['Overcome','Create an Advantage','Attack','Defend'],
      help:'Roll four Fate dice, add the selected approach or skill, and compare the result with the opposition.'
    }),
    gurps:Object.freeze({
      id:'gurps',sheet:'02_gurps_tactical_dossier',name:'GURPS Fourth Edition',
      defaultExpression:'3d6',quick:['Skill Check','Attack','Defense','Reaction'],
      help:'Roll 3d6 at or below the effective skill or attribute. Margin and critical results are calculated automatically.'
    }),
    cthulhu:Object.freeze({
      id:'cthulhu',sheet:'03_call_of_cthulhu_evidence_board',name:'Call of Cthulhu Seventh Edition',
      defaultExpression:'1d100',quick:['Skill Check','Sanity Check','Luck Check','Opposed Check'],
      help:'Roll percentile dice at or below the skill. Regular, Hard, Extreme, critical, and fumble results are identified.'
    }),
    daggerheart:Object.freeze({
      id:'daggerheart',sheet:'04_daggerheart_domain_card_atelier',name:'Daggerheart',
      defaultExpression:'2d12',quick:['Action Roll','Attack Roll','Reaction Roll','Spellcast Roll'],
      help:'Roll the Hope and Fear d12s, add the modifier, and compare with the difficulty. Doubles are a critical success.'
    }),
    pathfinder2e:Object.freeze({
      id:'pathfinder2e',sheet:'05_pathfinder_remastered_hero_workshop',name:'Pathfinder Second Edition Remastered',
      defaultExpression:'1d20',quick:['Check','Strike','Saving Throw','Initiative'],
      help:'Roll d20 plus the relevant modifier. TableGate applies the four degrees of success and natural-step adjustment.'
    }),
    pbta:Object.freeze({
      id:'pbta',sheet:'06_pbta_move_workshop',name:'Powered by the Apocalypse',
      defaultExpression:'2d6',quick:['Trigger Move','Act Under Pressure','Help or Interfere','Read a Situation'],
      help:'Roll 2d6 plus the move stat. A 10+ is a strong hit, 7–9 a weak hit, and 6 or less a miss with advancement.'
    }),
    swade:Object.freeze({
      id:'swade',sheet:'07_swade_wild_card_command_deck',name:'Savage Worlds Adventure Edition',
      defaultExpression:'1d6+1d6',quick:['Trait Test','Attack','Damage','Soak'],
      help:'Roll the selected trait die and Wild Die, ace each die when it reaches its maximum, and keep the higher total.'
    }),
    blades:Object.freeze({
      id:'blades',sheet:'08_blades_in_the_dark_score_command_board',name:'Blades in the Dark',
      defaultExpression:'1d6',quick:['Action Roll','Resistance Roll','Fortune Roll','Engagement Roll'],
      help:'Roll the action pool and keep the highest die. A 6 succeeds, 4–5 succeeds with a consequence, and 1–3 goes badly.'
    }),
    dnd5e:Object.freeze({
      id:'dnd5e',sheet:'09_dnd_5e_5_5e_complete_character_sheet_original',name:'D&D 5e / 5.5e',
      defaultExpression:'1d20',quick:['Ability Check','Attack Roll','Saving Throw','Initiative'],
      help:'Roll d20 plus the relevant modifier, with advantage or disadvantage when requested, and compare with the DC or AC.'
    })
  });
  const ORDER=Object.freeze(['fate','gurps','cthulhu','daggerheart','pathfinder2e','pbta','swade','blades','dnd5e']);
  const ALIASES=Object.freeze({
    fate:'fate',fatecore:'fate','01_fate_core_campaign_storyboard':'fate',
    gurps:'gurps','gurps4e':'gurps','02_gurps_tactical_dossier':'gurps',
    cthulhu:'cthulhu',coc:'cthulhu',coc7e:'cthulhu','callofcthulhu':'cthulhu','03_call_of_cthulhu_evidence_board':'cthulhu',
    daggerheart:'daggerheart','04_daggerheart_domain_card_atelier':'daggerheart',
    pathfinder:'pathfinder2e',pf2e:'pathfinder2e',pathfinder2e:'pathfinder2e','05_pathfinder_remastered_hero_workshop':'pathfinder2e',
    pbta:'pbta','poweredbytheapocalypse':'pbta','06_pbta_move_workshop':'pbta',
    swade:'swade','savageworlds':'swade','07_swade_wild_card_command_deck':'swade',
    blades:'blades','bitd':'blades','bladesinthedark':'blades','08_blades_in_the_dark_score_command_board':'blades',
    dnd:'dnd5e','d&d':'dnd5e','dnd5e':'dnd5e','dnd5.5e':'dnd5e','09_dnd_5e_5_5e_complete_character_sheet_original':'dnd5e'
  });
  const clean=value=>String(value??'').toLowerCase().replace(/[^a-z0-9_&.]+/g,'');
  const number=value=>{
    if(typeof value==='number'&&Number.isFinite(value))return value;
    const match=String(value??'').match(/[+-]?\d+(?:\.\d+)?/);
    return match?Number(match[0]):null;
  };
  function normalizeSystem(value){
    const raw=String(value??'').toLowerCase();
    return ALIASES[raw]||ALIASES[clean(raw)]||ORDER.find(id=>raw.includes(id))||'dnd5e';
  }
  function definition(value){return SYSTEMS[normalizeSystem(value)]}
  function flatten(value,path='',out=[]){
    if(out.length>=1200||value==null)return out;
    if(Array.isArray(value)){
      value.slice(0,200).forEach((entry,index)=>flatten(entry,`${path} ${index}`,out));
    }else if(typeof value==='object'){
      Object.entries(value).slice(0,400).forEach(([key,entry])=>flatten(entry,`${path} ${key}`,out));
    }else if(['string','number','boolean'].includes(typeof value)){
      out.push({label:path.trim(),value});
    }
    return out;
  }
  function characterFields(character){
    return flatten(character?.sheetState||character?.state||character||{});
  }
  function findField(character,terms=[]){
    const fields=characterFields(character);
    const wanted=terms.map(term=>String(term).toLowerCase()).filter(Boolean);
    let best=null;
    for(const field of fields){
      const label=field.label.toLowerCase();
      let score=0;
      wanted.forEach(term=>{if(label===term)score+=20;else if(label.includes(term))score+=8});
      const numeric=number(field.value);
      if(score&&numeric!=null&&(!best||score>best.score))best={...field,numeric,score};
    }
    return best;
  }
  function modifierFrom(message,character,terms=[]){
    const explicit=String(message||'').match(/\b(?:mod(?:ifier)?|bonus)\s*([+-]?\d+)\b/i);
    if(explicit)return Number(explicit[1]);
    return findField(character,terms)?.numeric??0;
  }
  function targetFrom(message,character,terms=[],fallback=null){
    const explicit=String(message||'').match(/\b(?:dc|ac|tn|target|skill|rating|difficulty)\s*[:=]?\s*(\d+)\b/i);
    if(explicit)return Number(explicit[1]);
    return findField(character,terms)?.numeric??fallback;
  }
  function signed(value){return value>0?`+${value}`:value<0?String(value):''}
  function dieFrom(character,message=''){
    const explicit=String(message).match(/\bd(4|6|8|10|12)\b/i);
    if(explicit)return Number(explicit[1]);
    const field=characterFields(character).find(item=>/\b(strength|agility|smarts|spirit|vigor|trait)\b/i.test(item.label)&&/\bd(4|6|8|10|12)\b/i.test(String(item.value)));
    return Number(String(field?.value||'').match(/\bd(4|6|8|10|12)\b/i)?.[1]||6);
  }
  function poolFrom(message,character){
    const explicit=String(message).match(/\b(?:pool|dice|rating)\s*[:=]?\s*(\d+)\b/i);
    if(explicit)return Math.max(0,Math.min(10,Number(explicit[1])));
    return Math.max(0,Math.min(10,targetFrom('',character,['action rating','action','pool'],1)??1));
  }
  function expressionFromText(message){
    return String(message||'').match(/\b\d*d(?:4|6|8|10|12|20|100|%|f)(?:kh1|kl1|!|r(?:<=|>=|<|>|=)?\d+)?(?:\s*[+-]\s*(?:\d*d(?:4|6|8|10|12|20|100|%|f)(?:kh1|kl1|!)?|\d+))*\b/i)?.[0]?.replace(/\s+/g,'')||'';
  }
  function infer(systemValue,message='',character=null){
    const systemId=normalizeSystem(systemValue),text=String(message||''),lower=text.toLowerCase();
    const explicit=expressionFromText(text);
    const common={systemId,label:text.trim()||definition(systemId).quick[0],target:null,mode:'normal',characterId:character?.id||''};
    if(systemId==='fate'){
      const modifier=modifierFrom(text,character,['skill','approach','rating']);
      return {...common,expression:explicit||`4d6${signed(modifier)}`,modifier,target:targetFrom(text,character,['opposition','difficulty'],null)};
    }
    if(systemId==='gurps'){
      return {...common,expression:explicit||'3d6',target:targetFrom(text,character,['effective skill','skill level','attribute'],10)};
    }
    if(systemId==='cthulhu'){
      const target=targetFrom(text,character,['skill','sanity','luck'],50);
      const mode=/\bpenalty\b/.test(lower)?'penalty':/\bbonus\b/.test(lower)?'bonus':'normal';
      return {...common,expression:explicit||(mode==='normal'?'1d100':'3d10'),target,mode,percentileDice:mode!=='normal'};
    }
    if(systemId==='daggerheart'){
      const modifier=modifierFrom(text,character,['experience','trait','modifier']);
      return {...common,expression:explicit||`2d12${signed(modifier)}`,modifier,target:targetFrom(text,character,['difficulty'],null)};
    }
    if(systemId==='pathfinder2e'){
      const modifier=modifierFrom(text,character,['modifier','attack','save','perception','skill']);
      return {...common,expression:explicit||`1d20${signed(modifier)}`,modifier,target:targetFrom(text,character,['dc','armor class'],null)};
    }
    if(systemId==='pbta'){
      const modifier=modifierFrom(text,character,['stat','modifier']);
      return {...common,expression:explicit||`2d6${signed(modifier)}`,modifier};
    }
    if(systemId==='swade'){
      const traitSides=dieFrom(character,text);
      return {...common,expression:explicit||`1d${traitSides}!+1d6!`,traitSides,target:targetFrom(text,character,['target number','tn'],4)};
    }
    if(systemId==='blades'){
      const pool=poolFrom(text,character);
      return {...common,expression:explicit||(pool===0?'2d6':`${pool}d6`),pool,mode:pool===0?'zero-pool':'normal'};
    }
    const modifier=modifierFrom(text,character,['modifier','attack','save','initiative','skill']);
    const mode=/\bdisadvantage\b|\bdisadv\b/.test(lower)?'disadvantage':/\badvantage\b|\badv\b/.test(lower)?'advantage':'normal';
    return {...common,expression:explicit||`${mode==='normal'?'1':'2'}d20${signed(modifier)}`,modifier,mode,target:targetFrom(text,character,['dc','armor class','ac'],null)};
  }
  function detailRolls(result){
    if(Array.isArray(result?.rolls))return result.rolls.map(Number).filter(Number.isFinite);
    const detail=Array.isArray(result?.detail)?result.detail:[];
    return detail.filter(term=>term?.type==='dice'||Array.isArray(term?.rolls)).flatMap(term=>term.rolls||[]).map(Number).filter(Number.isFinite);
  }
  function modifierTotal(result){
    return (Array.isArray(result?.detail)?result.detail:[]).filter(term=>term?.type==='modifier').reduce((sum,term)=>sum+Number(term.subtotal||term.total||0),0);
  }
  function baseTotal(result,rolls=detailRolls(result)){return Number.isFinite(Number(result?.total))?Number(result.total):rolls.reduce((a,b)=>a+b,0)+modifierTotal(result)}
  function degree(total,target){
    if(target==null)return total>=20?'Critical success':total>=10?'Success':'Check the result against the DC';
    if(total>=target+10)return'Critical success';
    if(total>=target)return'Success';
    if(total<=target-10)return'Critical failure';
    return'Failure';
  }
  function stepDegree(current,steps){
    const order=['Critical failure','Failure','Success','Critical success'];
    const index=Math.max(0,order.indexOf(current));
    return order[Math.max(0,Math.min(3,index+steps))];
  }
  function resolve(systemValue,result={},context={}){
    const systemId=normalizeSystem(systemValue),rolls=detailRolls(result),modifier=Number(context.modifier??modifierTotal(result)??0),rawTotal=baseTotal(result,rolls);
    let total=rawTotal,outcome='Rolled',detail='',natural=rolls[0]??null;
    if(systemId==='fate'){
      const faces=rolls.slice(0,4).map(value=>value<=2?-1:value<=4?0:1);
      total=faces.reduce((a,b)=>a+b,0)+modifier;
      const ladder=['Terrible','Poor','Mediocre','Average','Fair','Good','Great','Superb','Fantastic','Epic','Legendary'];
      outcome=ladder[Math.max(0,Math.min(ladder.length-1,total+2))];
      detail=`Fate dice ${faces.map(face=>face>0?'+':face<0?'−':'0').join(' ')}${context.target!=null?`; ${total>=context.target?'succeeds':'does not overcome'} opposition ${context.target}`:''}`;
    }else if(systemId==='gurps'){
      total=rolls.slice(0,3).reduce((a,b)=>a+b,0);
      const target=Number(context.target??10),margin=target-total;
      const criticalSuccess=total<=4||(total===5&&target>=15)||(total===6&&target>=16);
      const criticalFailure=total===18||(total===17&&target<=15)||(total-target>=10);
      outcome=criticalSuccess?'Critical success':criticalFailure?'Critical failure':margin>=0?'Success':'Failure';
      detail=`Effective skill ${target}; ${margin>=0?'margin of success':'margin of failure'} ${Math.abs(margin)}`;
    }else if(systemId==='cthulhu'){
      const target=Math.max(1,Number(context.target??50));
      const candidates=context.percentileDice
        ?rolls.slice(1).map(tens=>{const value=(tens%10)*10+(rolls[0]%10);return value===0?100:value})
        :[rolls[0]===0?100:(rolls[0]??rawTotal)];
      total=context.mode==='bonus'?Math.min(...candidates):context.mode==='penalty'?Math.max(...candidates):candidates[0];
      if(total===1)outcome='Critical success';
      else if(total<=Math.floor(target/5))outcome='Extreme success';
      else if(total<=Math.floor(target/2))outcome='Hard success';
      else if(total<=target)outcome='Regular success';
      else if(total>=96&&target<50||total===100)outcome='Fumble';
      else outcome='Failure';
      detail=`Skill ${target}; ${context.mode||'normal'} percentile roll`;
    }else if(systemId==='daggerheart'){
      const hope=rolls[0]??0,fear=rolls[1]??0;
      total=hope+fear+modifier;
      outcome=hope===fear?'Critical success':hope>fear?'Roll with Hope':'Roll with Fear';
      if(context.target!=null)outcome+=total>=context.target?' — success':' — failure';
      detail=`Hope ${hope}; Fear ${fear}${modifier?signed(modifier):''}`;
    }else if(systemId==='pathfinder2e'){
      total=rawTotal;
      outcome=degree(total,context.target);
      if(natural===20)outcome=stepDegree(outcome,1);
      if(natural===1)outcome=stepDegree(outcome,-1);
      detail=context.target==null?'Choose a DC to finalize the degree':`DC ${context.target}; natural ${natural}`;
    }else if(systemId==='pbta'){
      total=rawTotal;
      outcome=total>=10?'Strong hit':total>=7?'Weak hit':'Miss — mark experience';
      detail=total>=10?'The move succeeds cleanly.':total>=7?'The move succeeds with a cost, choice, or complication.':'The campaign runner makes a move.';
    }else if(systemId==='swade'){
      const traitSides=Number(context.traitSides||6),terms=(result.detail||[]).filter(term=>term?.type==='dice');
      const traitValues=(terms[0]?.rolls||[rolls[0]??0]).map(Number),wildValues=(terms[1]?.rolls||[rolls[1]??0]).map(Number);
      const trait=traitValues.reduce((a,b)=>a+b,0),wild=wildValues.reduce((a,b)=>a+b,0);
      total=Math.max(trait,wild);
      const target=Number(context.target??4),raises=total>=target?Math.floor((total-target)/4):0;
      outcome=total<target?'Failure':raises?`Success with ${raises} raise${raises===1?'':'s'}`:'Success';
      detail=`Trait d${traitSides}: ${traitValues.join('+')} = ${trait}; Wild d6: ${wildValues.join('+')} = ${wild}. Maximum results ace and continue.`;
    }else if(systemId==='blades'){
      const dice=rolls.length?rolls:[rawTotal],chosen=context.mode==='zero-pool'?Math.min(...dice):Math.max(...dice);
      total=chosen;
      const sixes=dice.filter(value=>value===6).length;
      outcome=sixes>=2&&context.mode!=='zero-pool'?'Critical success':chosen===6?'Full success':chosen>=4?'Partial success':'Bad outcome';
      detail=context.mode==='zero-pool'?'Zero-die pool: rolled two and kept the lower.':`Action pool ${context.pool??dice.length}: kept the highest.`;
    }else{
      const d20s=rolls.filter((_,index)=>index<(context.mode==='normal'?1:2));
      natural=context.mode==='advantage'?Math.max(...d20s):context.mode==='disadvantage'?Math.min(...d20s):(d20s[0]??natural);
      total=natural+modifier;
      outcome=natural===20?'Natural 20':natural===1?'Natural 1':context.target==null?'Check result':total>=context.target?'Success':'Failure';
      detail=`Natural ${natural}${modifier?signed(modifier):''}${context.target!=null?`; target ${context.target}`:''}`;
    }
    return {systemId,systemName:definition(systemId).name,total,rawTotal,natural,rolls,outcome,detail,context:{...context,systemId}};
  }
  function botResponse(systemValue,resolution,label='Roll'){
    const def=definition(systemValue);
    return `${def.name} — ${label}: ${resolution.total}. ${resolution.outcome}. ${resolution.detail}`;
  }
  function serializeRoll(result,context={},extra={}){
    const systemId=normalizeSystem(context.systemId||extra.systemId);
    const resolution=resolve(systemId,result,context);
    return {
      id:extra.id||`roll_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,9)}`,
      systemId,systemName:definition(systemId).name,expression:extra.expression||context.expression||definition(systemId).defaultExpression,
      label:extra.label||context.label||'Roll',rollerId:extra.rollerId||'',rollerName:extra.rollerName||'Player',
      characterId:extra.characterId||context.characterId||'',characterName:extra.characterName||'',
      color:extra.color||'#00ffff',channelId:extra.channelId||'',campaignId:extra.campaignId||'',
      detail:Array.isArray(result?.detail)?result.detail:[],requestedResults:detailRolls(result),
      backendTotal:Number(result?.total??resolution.rawTotal),total:resolution.total,outcome:resolution.outcome,
      explanation:resolution.detail,resolution,createdAt:extra.createdAt||new Date().toISOString(),public:extra.public!==false
    };
  }
  function validate(){
    const errors=[];
    if(ORDER.length!==9)errors.push(`Expected 9 systems; found ${ORDER.length}.`);
    ORDER.forEach(id=>{
      const def=SYSTEMS[id];
      if(!def||!def.sheet||!def.defaultExpression||!def.help||def.quick.length<4)errors.push(`Incomplete system definition: ${id}`);
      const inferred=infer(id,'test roll',null),fake={detail:[{type:'dice',rolls:id==='cthulhu'?[42]:id==='daggerheart'?[8,5]:id==='fate'?[1,3,5,6]:id==='gurps'?[3,3,4]:id==='pbta'?[4,4]:id==='swade'?[5,3]:id==='blades'?[5]:[14]}],total:14};
      if(!inferred.expression||!resolve(id,fake,inferred).outcome)errors.push(`System execution failed: ${id}`);
    });
    return {ok:!errors.length,count:ORDER.length,errors};
  }
  window.TableGateNineSystems=Object.freeze({SYSTEMS,ORDER,normalizeSystem,definition,characterFields,findField,infer,resolve,botResponse,serializeRoll,validate});
})();
