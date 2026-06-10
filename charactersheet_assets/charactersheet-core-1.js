
const stats=['Strength','Dexterity','Constitution','Intelligence','Wisdom','Charisma'];
const skills=['Acrobatics (Dex)','Animal Handling (Wis)','Arcana (Int)','Athletics (Str)','Deception (Cha)','History (Int)','Insight (Wis)','Intimidation (Cha)','Investigation (Int)','Medicine (Wis)','Nature (Int)','Perception (Wis)','Performance (Cha)','Persuasion (Cha)','Religion (Int)','Sleight of Hand (Dex)','Stealth (Dex)','Survival (Wis)'];
const axisDefs={
  altruism:['selfish-neutral-altruistic',['extremely selfish','very selfish','moderately selfish','slightly selfish','moderately neutral','extremely neutral','very neutral','slightly neutral','slightly altruistic','moderately altruistic','very altruistic','extremely altruistic'],'Altruism Axis',['Selfish','Neutral','Altruistic']],
  lawfulness:['chaotic-neutral-lawful',['extremely chaotic','very chaotic','moderately chaotic','slightly chaotic','moderately neutral','extremely neutral','very neutral','slightly neutral','slightly lawful','moderately lawful','very lawful','extremely lawful'],'Lawfulness Axis',['Chaotic','Neutral','Lawful']],
  cooperation:['combative-neutral-cooperative',['extremely combative','very combative','moderately combative','slightly combative','moderately neutral','extremely neutral','very neutral','slightly neutral','slightly cooperative','moderately cooperative','very cooperative','extremely cooperative'],'Cooperation Axis',['Combative','Neutral','Cooperative']],
  honor:['pragmatic-neutral-honorable',['extremely pragmatic','very pragmatic','moderately pragmatic','slightly pragmatic','moderately neutral','extremely neutral','very neutral','slightly neutral','slightly honorable','moderately honorable','very honorable','extremely honorable'],'Honor Axis',['Pragmatic','Neutral','Honorable']]
};
const axisPhaseColors={
  altruism:{low:['#3A0B0B','#6E1515','#A91F1F','#FF4D4D'],neutral:['#2E3133','#55595C','#8A8D91','#D5D7DA'],high:['#08363B','#126C74','#26C6DA','#00FFFF']},
  lawfulness:{low:['#1F083F','#4614A3','#7B2EFF','#C084FF'],neutral:['#2E3133','#55595C','#8A8D91','#D5D7DA'],high:['#0B1540','#1B2C8A','#304FFE','#7FA2FF']},
  cooperation:{low:['#3B1400','#7A2A00','#C74400','#FF8A33'],neutral:['#2E3133','#55595C','#8A8D91','#D5D7DA'],high:['#3D3300','#8A7400','#D6B600','#FFF27A']},
  honor:{low:['#232A14','#475528','#6B7A3D','#AFC77A'],neutral:['#2E3133','#55595C','#8A8D91','#D5D7DA'],high:['#2B3442','#55657D','#90A4C1','#D9E7FF']}
};
function phaseColorForAxis(id,idx){
  const palette=axisPhaseColors[id]||axisPhaseColors.altruism;
  if(idx<4) return palette.low[idx];
  if(idx<8) return palette.neutral[idx-4];
  return palette.high[idx-8];
}
function phaseTextColor(hex){
  const c=String(hex||'').replace('#','');
  const r=parseInt(c.slice(0,2),16), g=parseInt(c.slice(2,4),16), b=parseInt(c.slice(4,6),16);
  return (r*299+g*587+b*114)/1000 > 176 ? '#1f120b' : '#ffffff';
}
function phaseCellStyle(id,idx){
  const color=phaseColorForAxis(id,idx);
  const textColor=phaseTextColor(color);
  const shadow=textColor==='#1f120b'?'none':'0 1px 3px #000,0 0 4px #000';
  return `background:${color};color:${textColor};text-shadow:${shadow};`;
}
function cleanKey(s){return String(s||'').toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,' ').trim()}
function register(){window.fields=[...document.querySelectorAll('[data-key]')].map(el=>({key:cleanKey(el.dataset.key),raw:el.dataset.key,el}));}
function makeInput(key,ph=''){return `<input data-key="${key}" placeholder="${ph}">`}
function init(){document.getElementById('stats').innerHTML=stats.map(s=>`<div class="stat-card"><label>${s}</label><input class="score" data-key="${s} score"><input class="mod" data-key="${s} modifier" placeholder="mod"></div>`).join('');
 document.getElementById('saves').innerHTML=stats.map(s=>`<label class="checkrow"><input type="checkbox" data-key="${s} saving throw proficient"><span>${s}</span>${makeInput(s+' saving throw','bonus')}</label>`).join('');
 document.getElementById('skills').innerHTML=skills.map(s=>`<label class="checkrow"><input type="checkbox" data-key="${s} proficient"><span>${s}</span>${makeInput(s,'bonus')}</label>`).join('');
 document.getElementById('weapons').innerHTML=Array.from({length:6},(_,i)=>`<div class="weapon-row">${makeInput('weapon '+(i+1)+' name')}${makeInput('weapon '+(i+1)+' attack bonus')}${makeInput('weapon '+(i+1)+' damage type')}${makeInput('weapon '+(i+1)+' notes')}</div>`).join('');
 document.getElementById('languages').innerHTML=Array.from({length:7},(_,i)=>`<div class="language-row"><input data-key="language ${i+1}" placeholder="Language ${i+1}"><div class="lang-gradient-wrap"><input type="range" min="0" max="4" step="1" value="0" data-key="language ${i+1} fluency" id="langFluency${i}" oninput="updateLanguageFluency(${i})"><div class="lang-phasebar" id="langPhase${i}" data-phase="understand"></div><div class="lang-labels"><span>understand</span><span>speak</span><span>read</span><span>write</span><span>fully fluent</span></div></div><input data-key="language ${i+1} notes" placeholder="notes"></div>`).join('');
 document.getElementById('relationships').innerHTML=Array.from({length:20},(_,i)=>`<div class="relationship-entry"><div class="rel-top"><div class="rel-field"><label>Type</label><select data-key="relationship ${i+1} type"><option></option><option>Person</option><option>Ally</option><option>Organization</option><option>Faction</option><option>Enemy</option><option>Other</option></select></div><div class="rel-field"><label>Name</label>${makeInput('relationship '+(i+1)+' name')}</div><div class="rel-field"><label>Pronouns</label>${makeInput('relationship '+(i+1)+' pronouns')}</div><div class="rel-field"><label>Relationship / Role</label>${makeInput('relationship '+(i+1)+' relationship role')}</div></div><div class="rel-bottom"><div class="rel-field"><label>Location</label>${makeInput('relationship '+(i+1)+' location')}</div><div class="rel-field"><label>Status</label><select data-key="relationship ${i+1} status"><option></option><option>Living</option><option>Deceased</option><option>Active</option><option>Inactive</option><option>Unknown</option></select></div><div class="rel-field"><label>Notes</label>${makeInput('relationship '+(i+1)+' notes')}</div></div></div>`).join('');
 document.getElementById('inventory').innerHTML=Array.from({length:35},(_,i)=>`<div class="inventory-row">${makeInput('inventory '+(i+1)+' item')}${makeInput('inventory '+(i+1)+' location')}${makeInput('inventory '+(i+1)+' cost')}${makeInput('inventory '+(i+1)+' weight')}${makeInput('inventory '+(i+1)+' notes')}</div>`).join('');
 document.getElementById('slots').innerHTML=Array.from({length:9},(_,i)=>`<div class="slotbox"><b>${i+1}</b><input data-key="level ${i+1} slots total" placeholder="total"><input data-key="level ${i+1} slots expended" placeholder="used"></div>`).join('');
 const axes=document.getElementById('alignmentAxes'); axes.innerHTML=Object.entries(axisDefs).map(([id,[label,phases,title,poles]])=>`<div class="alignment-axis" data-axis="${id}"><div class="axis-heading"><strong>${title}</strong><span>${label}</span><output id="axisOut-${id}">extremely neutral</output></div><div class="axis-track-wrap"><div class="phasebar alignment-phasebar" id="phase-${id}" data-phase="extremely neutral">${phases.map((phase,idx)=>`<button type="button" class="phase-cell" data-axis="${id}" data-index="${idx}" data-zone="${idx<4?'low':idx<8?'neutral':'high'}" title="${phase}" style="${phaseCellStyle(id,idx)}">${phase}</button>`).join('')}</div><input class="axis-range" type="range" min="0" max="2750" step="250" value="1250" data-key="${id} points" id="axis-${id}" aria-label="${title}"></div><div class="axis-pole-labels"><span>${poles[0]}</span><span>${poles[1]}</span><span>${poles[2]}</span></div></div>`).join(''); Object.keys(axisDefs).forEach(id=>{document.getElementById('axis-'+id).addEventListener('input',()=>updateAxis(id)); document.querySelectorAll(`.phase-cell[data-axis="${id}"]`).forEach(cell=>cell.addEventListener('click',()=>{document.getElementById('axis-'+id).value=Number(cell.dataset.index)*250; updateAxis(id);}));});
 const spellLevels=['Cantrips','1st Level Spells','2nd Level Spells','3rd Level Spells','4th Level Spells','5th Level Spells','6th Level Spells','7th Level Spells','8th Level Spells','9th Level Spells'];
 document.getElementById('spellPages').innerHTML=spellLevels.map((name,pi)=>`<section class="page spell-page"><div class="page-title"><h2>${name}</h2><span class="subtle">10 spell entries with description and dice-roll instructions</span></div><div class="panel spell-level-panel"><h3>${name}</h3><div class="spell-card tinylabel"><span>Name</span><span>Description</span><span>How to Roll / Dice</span></div>${Array.from({length:10},(_,i)=>`<div class="spell-card"><input class="spell-name" data-key="${name} ${i+1} name" placeholder="Spell ${i+1} name"><textarea data-key="${name} ${i+1} description" placeholder="Range, components, duration, effect, scaling, notes..."></textarea><textarea data-key="${name} ${i+1} how to roll" placeholder="Attack roll, save DC, damage dice, healing dice, conditions..."></textarea></div>`).join('')}</div></section>`).join('');
 register(); populateDestinationDropdowns(); Object.keys(axisDefs).forEach(updateAxis); for(let i=0;i<7;i++) updateLanguageFluency(i); bindUploads();}
function snapAxisValue(value){
  const n=Number(value);
  if(!Number.isFinite(n)) return 1250;
  return Math.max(0,Math.min(2750,Math.round(n/250)*250));
}
function axisIndexFromPoints(points){return Math.max(0,Math.min(11,Math.round(snapAxisValue(points)/250)));}
function phaseFromPoints(id,points){
  const phases=axisDefs[id][1];
  return phases[axisIndexFromPoints(points)]||phases[5];
}
function updateAxis(id){
  const r=document.getElementById('axis-'+id), p=document.getElementById('phase-'+id), out=document.getElementById('axisOut-'+id);
  if(!r||!p) return;
  const snapped=snapAxisValue(r.value);
  if(String(r.value)!==String(snapped)) r.value=snapped;
  const idx=axisIndexFromPoints(snapped);
  const phase=phaseFromPoints(id,snapped);
  p.dataset.phase=phase;
  p.querySelectorAll('.phase-cell').forEach((cell,i)=>{
    const active=i===idx;
    cell.classList.toggle('active',active);
    cell.setAttribute('aria-pressed',active?'true':'false');
  });
  if(out) out.textContent=phase;
}

function updateLanguageFluency(i){const phases=['understand','speak','read','write','fully fluent']; const r=document.getElementById('langFluency'+i), p=document.getElementById('langPhase'+i); if(r&&p)p.dataset.phase=phases[Number(r.value)||0];}
function toggleDeathSave(btn){const type=btn.dataset.save; const group=[...document.querySelectorAll(`.death-btn[data-save="${type}"]`)]; const current=group.filter(b=>b.classList.contains('active')).length; let count=Number(btn.dataset.index); if(btn.classList.contains('active')&&current===count)count=count-1; group.forEach(b=>b.classList.toggle('active',Number(b.dataset.index)<=count)); document.getElementById(type==='success'?'deathSaveSuccessValue':'deathSaveFailureValue').value=count;}
function populateDestinationDropdowns(){const select=document.getElementById('selectedTextDestination'); if(!select)return; select.innerHTML='<option value="">Choose destination field for selected text</option>'+fields.map((f,i)=>`<option value="${i}">${f.raw}</option>`).join('');}
function moveSelectedEtcText(){const sel=window.getSelection(); const text=sel?sel.toString():''; const etc=document.getElementById('page-etc'); if(!text.trim()){alert('Highlight the exact text you want to move first.'); return;} if(sel.rangeCount && !etc.contains(sel.anchorNode)){alert('Please highlight text from the Extra Information page.'); return;} const idx=document.getElementById('selectedTextDestination').value; if(idx===''){alert('Choose a destination field first.'); return;} assign(fields[idx].el,text.trim()); sel.deleteFromDocument(); sel.removeAllRanges();}
function resetSheet(){if(!confirm('Clear every field, uploaded art preview, death save, and manual placement queue?'))return; document.querySelectorAll('input, textarea, select').forEach(el=>{if(el.type==='checkbox'||el.type==='radio')el.checked=false; else if(el.type==='range')el.value=el.id&&el.id.startsWith('axis-')?1250:0; else if(el.type==='file')el.value=''; else el.value='';}); document.querySelectorAll('.death-btn').forEach(b=>b.classList.remove('active')); document.getElementById('deathSaveSuccessValue').value=0; document.getElementById('deathSaveFailureValue').value=0; document.getElementById('etcQueue').innerHTML=''; document.getElementById('artSlot1').textContent='Art 1'; document.getElementById('artSlot1').classList.remove('has-art'); document.getElementById('artSlot2').textContent='Art 2'; document.getElementById('artSlot2').classList.remove('has-art'); Object.keys(axisDefs).forEach(updateAxis); for(let i=0;i<7;i++) updateLanguageFluency(i);}

function bindUploads(){
  ['art1','art2'].forEach((id,idx)=>{
    const input=document.getElementById(id);
    const slot=document.getElementById('artSlot'+(idx+1));
    if(input){
      input.setAttribute('accept','image/jpeg,image/jpg,image/png,image/gif,.jpg,.jpeg,.png,.gif');
      input.addEventListener('change',e=>loadArt(e.target.files[0],idx+1));
    }
    if(slot && input){
      slot.setAttribute('role','button');
      slot.setAttribute('tabindex','0');
      slot.setAttribute('aria-label','Upload character art '+(idx+1)+' as JPG, PNG, or GIF');
      slot.title='Click to upload JPG, PNG, or GIF';
      slot.addEventListener('click',()=>input.click());
      slot.addEventListener('keydown',e=>{
        if(e.key==='Enter'||e.key===' '){
          e.preventDefault();
          input.click();
        }
      });
    }
  });
  const alignmentInput=document.getElementById('alignmentUpload');
  if(alignmentInput) alignmentInput.addEventListener('change',e=>readJSON(e.target.files[0],(json,file)=>{applyAlignment(json); showImportStatus('Imported alignment JSON'+(file?.name?' from '+file.name:'' )+'.');}));
  const characterImport=document.getElementById('characterGeneratorUpload');
  if(characterImport) characterImport.addEventListener('change',e=>readJSON(e.target.files[0],applyImportedCharacterJSON));
}
function loadArt(file,n){
  if(!file)return;
  const allowed=['image/jpeg','image/jpg','image/png','image/gif'];
  const nameOk=/\.(jpe?g|png|gif)$/i.test(file.name||'');
  if(!allowed.includes(file.type) && !nameOk){
    addEtc('Unsupported character art file',`"${file.name||'Selected file'}" was not loaded. Please choose a JPG, JPEG, PNG, or GIF image.`);
    return;
  }
  const r=new FileReader();
  r.onload=()=>{
    const slot=document.getElementById('artSlot'+n);
    if(slot){
      slot.innerHTML=`<img alt="Character art ${n}" src="${r.result}">`;
      slot.classList.add('has-art');
    }
  };
  r.readAsDataURL(file);
}
function showImportStatus(msg,isError=false){
  const el=document.getElementById('jsonImportStatus');
  if(el){el.textContent=msg||''; el.style.color=isError?'#ffb3a6':'#ffe7a6';}
}
function readJSON(file,cb){
  if(!file)return;
  const r=new FileReader();
  r.onload=()=>{
    try{cb(JSON.parse(r.result),file)}
    catch(e){showImportStatus('JSON import error: '+String(e.message),true); addEtc('JSON import error',String(e.message));}
  };
  r.readAsText(file);
}
function firstValue(){
  for(const v of arguments){
    if(v!==undefined && v!==null && String(v).trim()!=='') return v;
  }
  return '';
}
function asArray(v){
  if(Array.isArray(v)) return v.filter(x=>x!==undefined&&x!==null&&String(x).trim()!=='');
  if(v===undefined||v===null||String(v).trim()==='') return [];
  return [v];
}
function prettifyKey(s){return String(s||'').replace(/[_-]+/g,' ').replace(/\s+/g,' ').trim().replace(/\b\w/g,m=>m.toUpperCase());}
function fieldSet(label,value){
  if(value===undefined || value===null || String(value).trim()==='') return false;
  const ok=setValue(label,value);
  if(!ok) addEtc('Imported field: '+label, value);
  return ok;
}
function fieldAppend(label,value){
  if(value===undefined || value===null || String(value).trim()==='') return false;
  const f=bestField(label);
  if(f&&f.score>=.9){
    const cur=f.el.value||'';
    assign(f.el, cur ? cur+'\n'+String(value) : value);
    return true;
  }
  addEtc('Imported field: '+label,value);
  return false;
}
function classLine(c){
  if(!c) return '';
  const name=firstValue(c.class,c.name,c.primaryClass);
  const sub=firstValue(c.subclass,c.subClass,c.primarySubclass);
  const lvl=firstValue(c.level,c.classLevel,c.primaryClassLevel);
  return [name,sub?`(${sub})`:'',lvl?`Level ${lvl}`:''].filter(Boolean).join(' ');
}
function axisValueFromImport(axes,id){
  if(!axes) return undefined;
  const title=axisDefs[id][2];
  const compact=id.toLowerCase();
  const keys=[id,compact,compact+'Points',id+'Points',title,axisDefs[id][0]];
  for(const key of keys){
    let v=axes[key];
    if(v!==undefined){
      if(typeof v==='object') v=firstValue(v.points,v.rawScore,v.score,v.value,v.bandIndex!==undefined?Number(v.bandIndex)*250:undefined);
      return v;
    }
  }
  return undefined;
}
function applyAlignment(j){
  if(!j || typeof j!=='object') return;
  const alignmentObj=j.alignment||{};
  const importedName=firstValue(j.alignmentName,alignmentObj.name,(j.character&&j.character.alignmentName));
  const importedDesc=firstValue(j.alignmentDescription,alignmentObj.description,j.description);
  if(importedName) fieldSet('alignment name',importedName);
  if(importedDesc) fieldSet('alignment description',importedDesc);
  const axes=j.axes||j.axis||j.axisResults||j.scoreTotals||j;
  Object.keys(axisDefs).forEach(id=>{
    let v=axisValueFromImport(axes,id);
    if(v===undefined && Array.isArray(j.axisPhaseData)){
      const row=j.axisPhaseData.find(a=>cleanKey(a.axis)===cleanKey(id)||cleanKey(a.axis)===cleanKey(axisDefs[id][2]));
      if(row) v=firstValue(row.points,row.rawScore,row.score,row.value,row.scoreBandIndex!==undefined?Number(row.scoreBandIndex)*250:undefined);
    }
    if(v!==undefined){
      const r=document.getElementById('axis-'+id);
      if(r){r.value=snapAxisValue(v); updateAxis(id);}
    }
  });
}
function skillFieldName(name){
  const k=cleanKey(name).replace(/ dex| str| con| int| wis| cha/g,'').trim();
  return skills.find(s=>cleanKey(s).startsWith(k)) || prettifyKey(name);
}
function applyScoreObject(obj,labelSuffix){
  if(!obj || typeof obj!=='object') return;
  const aliases={str:'Strength',strength:'Strength',dex:'Dexterity',dexterity:'Dexterity',con:'Constitution',constitution:'Constitution',int:'Intelligence',intelligence:'Intelligence',wis:'Wisdom',wisdom:'Wisdom',cha:'Charisma',charisma:'Charisma'};
  Object.entries(obj).forEach(([k,v])=>{
    const stat=aliases[cleanKey(k)] || prettifyKey(k);
    if(typeof v==='object') v=firstValue(v.value,v.score,v.modifier,v.bonus,v.total);
    fieldSet(stat+' '+labelSuffix,v);
  });
}
function applySkillLikeObject(obj,type){
  if(!obj || typeof obj!=='object') return;
  Object.entries(obj).forEach(([k,v])=>{
    const name= type==='skill' ? skillFieldName(k) : prettifyKey(k)+' saving throw';
    if(typeof v==='object'){
      fieldSet(name,firstValue(v.bonus,v.total,v.value,v.score,v.modifier));
      if(v.proficient!==undefined) fieldSet(name+(type==='skill'?' proficient':' proficient'),!!v.proficient);
    }else fieldSet(name,v);
  });
}
function applyFactionRows(factions){
  asArray(factions).slice(0,20).forEach((f,i)=>{
    const n=i+1;
    if(typeof f==='string'){
      fieldSet('relationship '+n+' type','Faction');
      fieldSet('relationship '+n+' name',f);
    }else if(f && typeof f==='object'){
      fieldSet('relationship '+n+' type','Faction');
      fieldSet('relationship '+n+' name',firstValue(f.name,f.faction));
      fieldSet('relationship '+n+' relationship role',firstValue(f.tierName,f.role,f.source));
      fieldSet('relationship '+n+' status','Active');
      const notes=[f.source, f.tier!==undefined?'Tier '+f.tier:''].filter(Boolean).join(' | ');
      fieldSet('relationship '+n+' notes',notes);
    }
  });
}
function applyAttacks(attacks){
  asArray(attacks).slice(0,6).forEach((a,i)=>{
    const n=i+1;
    if(typeof a==='string') fieldSet('weapon '+n+' name',a);
    else if(a && typeof a==='object'){
      fieldSet('weapon '+n+' name',firstValue(a.name,a.weapon,a.attack));
      fieldSet('weapon '+n+' attack bonus',firstValue(a.attackBonus,a.bonus,a.toHit));
      const damageDice=firstValue(a.damage,a.damageDice,a.dice);
      const damageType=firstValue(a.damageType,a.type);
      fieldSet('weapon '+n+' damage type',[damageDice,damageType].filter(Boolean).join(' '));
      fieldSet('weapon '+n+' notes',[a.range,a.notes,a.description,damageDice?('Damage '+damageDice):'',damageType?('Type '+damageType):''].filter(Boolean).join(' | '));
    }
  });
}
function applyCharacterGeneratorJSON(j,file){
  if(!j || typeof j!=='object') return;
  const ch=j.character||j.characterData||j.pc||{};
  const sheet=j.sheet||{};
  const cache=j.characterCache||ch.raceCache||{};
  const classes=asArray(ch.classes||j.classes||sheet.classes);
  const primary=classes[0] || {class:ch.primaryClass,subclass:ch.primarySubclass,level:ch.primaryClassLevel};
  const secondary=classes[1] || {class:ch.secondaryClass,subclass:ch.secondarySubclass,level:ch.secondaryClassLevel};
  const races=asArray(firstValue(ch.raceCombination,cache.combinedRaces,cache.raceCache,ch.raceCache));
  const raceLabel=races.length ? races.join(' / ') : firstValue(ch.race,ch.primaryRace,cache.primaryRace,j.race);

  fieldSet('character name',firstValue(ch.name,j.characterName));
  fieldSet('character pronouns',firstValue(ch.pronouns,j.characterPronouns));
  fieldSet('player name',firstValue(ch.playerName,j.playerName));
  fieldSet('player pronouns',firstValue(ch.playerPronouns,j.playerPronouns));
  fieldSet('race',raceLabel);
  fieldSet('background',firstValue(ch.background,j.background));
  fieldSet('primary class level',classLine(primary));
  fieldSet('secondary class level',classLine(secondary));
  fieldSet('proficiency bonus',firstValue(sheet.proficiencyBonus,ch.proficiencyBonus));
  fieldSet('armor class',firstValue(sheet.armorClass,ch.armorClass));
  fieldSet('initiative',firstValue(sheet.initiative,ch.initiative));
  fieldSet('passive wisdom perception',firstValue(sheet.passivePerception,sheet.passiveWisdomPerception,ch.passivePerception));
  if(primary){ fieldSet('spellcasting class 1',firstValue(primary.class,primary.name)); }
  if(secondary){ fieldSet('spellcasting class 2',firstValue(secondary.class,secondary.name)); }
  if(cleanKey(firstValue(primary.class,primary.name))==='monk'){
    fieldSet('monk subclass',firstValue(primary.subclass,primary.subClass));
    fieldSet('monk level',firstValue(primary.level));
  }
  if(cleanKey(firstValue(secondary.class,secondary.name))==='monk'){
    fieldSet('monk subclass',firstValue(secondary.subclass,secondary.subClass));
    fieldSet('monk level',firstValue(secondary.level));
  }
  applyAlignment(j);
  applyScoreObject(sheet.abilityScores||sheet.scores||ch.abilityScores,'score');
  applyScoreObject(sheet.modifiers||sheet.mods||ch.modifiers,'modifier');
  applySkillLikeObject(sheet.skills,'skill');
  applySkillLikeObject(sheet.savingThrows,'save');
  const hp=sheet.hitPoints||ch.hitPoints;
  if(typeof hp==='object' && hp){
    fieldSet('hit point maximum',firstValue(hp.maximum,hp.max,hp.total,hp.value));
    fieldSet('current hit points',firstValue(hp.current,hp.currentHP));
    fieldSet('temporary hit points',firstValue(hp.temporary,hp.temp));
    fieldSet('hit dice',firstValue(hp.hitDice,hp.dice));
  }else fieldSet('hit point maximum',hp);
  applyAttacks(sheet.attacks||ch.attacks);
  fieldAppend('features traits',firstValue(sheet.features,ch.features));
  fieldAppend('features traits',firstValue(sheet.raceTraits,ch.raceTraits));
  fieldAppend('spell notes',firstValue(sheet.magic,ch.magic));
  fieldAppend('attacks spellcasting',firstValue(sheet.magic,ch.magic));
  const personality=sheet.personality||ch.personality;
  if(personality && typeof personality==='object'){
    fieldSet('personality traits',firstValue(personality.traits,personality.personalityTraits));
    fieldSet('ideals',personality.ideals);
    fieldSet('bonds',personality.bonds);
    fieldSet('flaws',personality.flaws);
  }else fieldSet('personality traits',personality);
  applyFactionRows(ch.factionAssociations||j.factionAssociations||j.sourceSelections?.factions);
  const cacheSummary=[];
  if(races.length) cacheSummary.push('Race cache: '+races.join(' / '));
  const gods=asArray(firstValue(ch.creatorGodCache,cache.creatorGodCache));
  if(gods.length) cacheSummary.push('Creator god cache: '+gods.join(', '));
  const biomes=asArray(firstValue(ch.originBiomeCache,cache.biomeCache));
  if(biomes.length) cacheSummary.push('Origin biome cache: '+biomes.join(', '));
  if(cacheSummary.length) fieldAppend('extra information',cacheSummary.join('\n'));
  if(j.rules5eGuidance) fieldAppend('extra information','Rules engine guidance:\n'+JSON.stringify(j.rules5eGuidance,null,2));
  showImportStatus('Imported character generator JSON'+(file?.name?' from '+file.name:'' )+'.');
}
function applyGenericSheetJSON(j,file){
  let imported=0;
  Object.entries(j||{}).forEach(([k,v])=>{
    if(v && typeof v==='object') return;
    if(fieldSet(k,v)) imported++;
  });
  applyAlignment(j);
  showImportStatus('Imported JSON'+(file?.name?' from '+file.name:'' )+'. '+imported+' direct fields matched.');
}
function applyImportedCharacterJSON(j,file){
  const schema=String(j?.schema||'');
  if(j?.character || j?.sheet || schema.includes('character-sheet-generator') || j?.characterCache){
    applyCharacterGeneratorJSON(j,file);
  }else{
    applyAlignment(j);
    applyGenericSheetJSON(j,file);
  }
}

function setValue(label,value){const f=bestField(label); if(f&&f.score>=.9){assign(f.el,value); return true;} return false;}
function assign(el,value){if(el.type==='checkbox')el.checked=!!value; else if(el.type==='radio'){const group=[...document.getElementsByName(el.name)]; const match=group.find(r=>cleanKey(r.value)===cleanKey(value)); if(match)match.checked=true;} else if(el.type==='range'&&el.id&&el.id.startsWith('langFluency')){const phases=['understand','speak','read','write','fully fluent']; const idx=phases.findIndex(v=>cleanKey(v)===cleanKey(value)); el.value=idx>=0?idx:(Number(value)||0); updateLanguageFluency(Number(el.id.replace('langFluency','')));} else if(el.type==='range'&&el.id&&el.id.startsWith('axis-')){el.value=snapAxisValue(value); updateAxis(el.id.replace('axis-',''));} else el.value=Array.isArray(value)?value.join(', '):(value??''); if(el.id&&el.id.startsWith('axis-')) updateAxis(el.id.replace('axis-',''));}
function lev(a,b){const m=[]; for(let i=0;i<=b.length;i++)m[i]=[i]; for(let j=0;j<=a.length;j++)m[0][j]=j; for(let i=1;i<=b.length;i++)for(let j=1;j<=a.length;j++)m[i][j]=b.charAt(i-1)==a.charAt(j-1)?m[i-1][j-1]:Math.min(m[i-1][j-1]+1,m[i][j-1]+1,m[i-1][j]+1); return m[b.length][a.length];}
function sim(a,b){a=cleanKey(a);b=cleanKey(b); if(!a||!b)return 0; if(a===b)return 1; if(a.includes(b)||b.includes(a))return Math.min(a.length,b.length)/Math.max(a.length,b.length)+.08; return 1-lev(a,b)/Math.max(a.length,b.length);}
function bestField(label){let best=null; fields.forEach(f=>{const score=sim(label,f.key); if(!best||score>best.score)best={...f,score};}); return best;}
function addEtc(label,value){const box=document.createElement('div'); box.className='etc-item'; box.innerHTML=`<b>${label}</b> <span class="pill">unmatched</span><p contenteditable="true">${String(value).slice(0,1200)}</p>`; document.getElementById('etcQueue').appendChild(box);}
function saveJSON(){const data={}; fields.forEach(f=>{if(f.el.type==='checkbox')data[f.raw]=f.el.checked; else if(f.el.type==='radio'){if(f.el.checked)data[f.raw]=f.el.value;} else data[f.raw]=f.el.value;}); const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=(document.getElementById('characterName').value||'character')+'-sheet-data.json'; a.click(); URL.revokeObjectURL(a.href);}
init();
