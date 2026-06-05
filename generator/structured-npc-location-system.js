
/* Belavadös Structured NPC + Location System
 * Adds compendium-backed race/pantheon profiles, alignment phases, richer household/family metadata,
 * Earth-first / Belavadös-second time, and location role structure on top of the OpenTS2 adapter.
 */
(function(){
  const B = window.BELAVADOS = window.BELAVADOS || {};
  if(!B.data) return;
  const content = B.data.content || {};
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,Number(v)||0));
  const text=v=>String(v??'');
  const norm=v=>text(v).toLowerCase().replace(/[’']/g,"'").replace(/[—–-]/g,' ').replace(/\s+/g,' ').trim();
  const profileList = content.structured_race_profiles || [];
  const profileIndex = content.race_profile_index || {};
  const timeModel = content.belavados_time_model || {};
  const weekdays = timeModel.weekdays || [];
  const monthNames = (timeModel.months||[]).map(m=>m.name);

  function keyForRace(race){
    const exact = profileIndex[norm(race)] || profileIndex[text(race).toLowerCase()];
    if(exact) return exact;
    const clean = norm(race).replace(/\s+lineage$/,'');
    return profileList.find(p=>norm(p.label)===clean || norm(p.sourceLabel)===clean || clean.includes(norm(p.sourceLabel||'')) && norm(p.sourceLabel||'').length>2) || null;
  }

  function phaseFor(score){
    score = Number(score);
    if(score < 1000) return 'Extreme negative';
    if(score < 1500) return 'Skewed negative';
    if(score === 1500) return 'Neutral or balanced';
    if(score < 2000) return 'Skewed positive';
    return 'Extreme positive';
  }
  function axisSummary(alignment){
    const axes = alignment?.axes || {};
    const keys = ['altruism','lawfulness','cooperation','honor'];
    return keys.map(k=>({key:k,label:k[0].toUpperCase()+k.slice(1),score:Number(axes[k]??1500),phase:phaseFor(Number(axes[k]??1500))}));
  }

  function isLeap(y){return (y%4===0 && y%100!==0) || y%400===0;}
  function belavadosTime(date=new Date()){
    const y=date.getFullYear();
    const daysInEarthYear=isLeap(y)?366:365;
    const start=new Date(y,0,1,0,0,0,0);
    const earthProgress=((date-start)/86400000)/daysInEarthYear;
    const belSolarDayProgress=earthProgress*330.15;
    const belCivilDateProgress=earthProgress*330;
    const monthIndex=Math.max(0,Math.min(10,Math.floor(belCivilDateProgress/30)));
    const dayOfMonth=Math.floor(belCivilDateProgress%30)+1;
    const clockTotal=((belSolarDayProgress%1)+1)%1*24*60;
    const hh=Math.floor(clockTotal/60), mm=Math.floor(clockTotal%60);
    const wd=(weekdays.find(w=>w.earth===date.toLocaleDateString('en-US',{weekday:'long'}))||{}).belavados || date.toLocaleDateString('en-US',{weekday:'long'});
    return {
      earthISO:date.toISOString(), earthLabel:date.toLocaleString(),
      belSolarDayProgress, belCivilDateProgress,
      monthIndex, month:monthNames[monthIndex] || `Month ${monthIndex+1}`, dayOfMonth,
      weekday:wd, clock:`${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`,
      label:`${monthNames[monthIndex] || `Month ${monthIndex+1}`} ${dayOfMonth}, ${wd}, ${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`
    };
  }
  B.belavadosTime = belavadosTime;
  B.belavadosTimeLabel = date => belavadosTime(date).label;
  B.alignmentPhase = phaseFor;
  B.alignmentAxisSummary = axisSummary;
  B.getRaceProfile = keyForRace;

  function locationRole(loc){
    const t=norm([loc.name,loc.type,loc.category,loc.use].join(' '));
    if(/rail|ferry|dock|skyship|portal|harbor|caravan|transit/.test(t)) return 'Transit node';
    if(/town hall|court|guard|jail|customs|tax|permit|ministry|government|civic/.test(t)) return 'Civic authority';
    if(/temple|shrine|monastery|library|archive|university|ichor|wizard|magic/.test(t)) return 'Lore, magic, or divine institution';
    if(/hospital|clinic|healer|apothecary|alchemy|sanitarium|pressure/.test(t)) return 'Health and recovery';
    if(/tavern|inn|hotel|restaurant|tea|bakery|food|cook|hospitality/.test(t)) return 'Hospitality and social life';
    if(/blacksmith|armory|foundry|workshop|carpenter|shipyard|tailor|repair|craft/.test(t)) return 'Production and craft';
    if(/farm|orchard|greenhouse|stable|kennel|ranger|hunting|fishing|wilderness/.test(t)) return 'Agriculture, animals, or wilderness support';
    if(/market|store|shop|provisioner|retail|goods/.test(t)) return 'Retail and household economy';
    return 'Neighborhood support';
  }
  function staffingFor(role, loc){
    const base={
      'Transit node':['stationmaster/operator','fare clerk','handler/porter','mechanic or rune technician','security watch'],
      'Civic authority':['clerk','magistrate/reeve','records officer','peacekeeper','public works liaison'],
      'Lore, magic, or divine institution':['licensed keeper','scribe','ritual assistant','apprentice','security custodian'],
      'Health and recovery':['healer','apothecary','nurse/orderly','records clerk','night attendant'],
      'Hospitality and social life':['keeper','cook','server','room attendant','musician/gossip source'],
      'Production and craft':['master craftsperson','journeyperson','apprentice','supplier','repair clerk'],
      'Agriculture, animals, or wilderness support':['steward','handler','forager/ranger','supplier','weather watcher'],
      'Retail and household economy':['merchant','cashier/barter clerk','stock handler','buyer','runner'],
      'Neighborhood support':['caretaker','resident contact','messenger','maintenance worker','watchful neighbor']
    };
    return base[role] || base['Neighborhood support'];
  }
  function enrichLocationStructure(loc, i=0){
    if(!loc) return loc;
    const role=locationRole(loc);
    const settlement=B.state?.settlement || {};
    const provinceTZ=(content.province_time_zones||[]).find(z=>z.province===settlement.province) || {};
    loc.structured = Object.assign({
      role,
      settlementLayer:settlement.type || 'Settlement',
      biomeContext:settlement.biome || 'mixed biome',
      province:settlement.province || '',
      provinceUTC:provinceTZ.displayUTCs || provinceTZ.primaryUTC || '',
      requiredStaffRoles:staffingFor(role, loc),
      publicTimetable:loc.hours || 'locally posted hours',
      visitPurposes:visitPurposes(role),
      civicHooks:hooksForLocation(role, loc),
      generationSource:'Belavadös structured location role system',
      index:i
    }, loc.structured||{});
    return loc;
  }
  function visitPurposes(role){
    return ({
      'Transit node':['commute','inter-province work travel','vacation departure','freight pickup','public route delay'],
      'Civic authority':['permits','court dates','taxes','public records','political meetings'],
      'Lore, magic, or divine institution':['library study','ritual appointment','licensed worship','archive research','omen review'],
      'Health and recovery':['urgent care','alchemy pickup','recovery rest','pressure or injury treatment'],
      'Hospitality and social life':['breakfast','supper','dates','gossip','lodging'],
      'Production and craft':['repairs','tool orders','apprenticeship','guild contract','supply pickup'],
      'Agriculture, animals, or wilderness support':['feed purchase','animal care','ranger report','foraging contract','seasonal work'],
      'Retail and household economy':['shopping','errands','trade','household goods','market rumors'],
      'Neighborhood support':['home life','community help','messages','chores','personal downtime']
    })[role] || ['visit','work','errand'];
  }
  function hooksForLocation(role, loc){
    const common=['schedule conflict','missing paperwork','relationship rumor'];
    const map={
      'Transit node':['delayed route','misdirected passenger','lost freight'],
      'Civic authority':['ledger mismatch','permit dispute','inheritance record problem'],
      'Lore, magic, or divine institution':['forbidden shelf request','divine prison rumor','misfiled ritual license'],
      'Health and recovery':['ichor dosage shortage','unrecorded patient','night-shift emergency'],
      'Hospitality and social life':['date overheard','traveler with false name','kitchen supply failure'],
      'Production and craft':['broken engine part','guild rivalry','unsafe prototype'],
      'Agriculture, animals, or wilderness support':['animal panic','weather omen','spoiled supply chain'],
      'Retail and household economy':['counterfeit goods','barter debt','missing delivery'],
      'Neighborhood support':['family dispute','chosen-family celebration','stranger asking questions']
    };
    return [...(map[role]||[]), ...common].slice(0,6);
  }

  function relationBuckets(npc){
    const buckets={familial:[],romantic:[],professional:[],community:[],friendship:[],conflict:[]};
    (npc.relationships||[]).forEach(r=>{
      const t=norm(r.type+' '+r.category);
      if(/parent|child|sibling|grand|family|familial|ward|guardian/.test(t)) buckets.familial.push(r);
      else if(/partner|date|romantic|ex/.test(t)) buckets.romantic.push(r);
      else if(/work|coworker|mentor|apprentice|professional|rival/.test(t)) buckets.professional.push(r);
      else if(/neighbor|community|politic|temple|guild/.test(t)) buckets.community.push(r);
      else if(/rival|conflict|enemy/.test(t)) buckets.conflict.push(r);
      else buckets.friendship.push(r);
    });
    return buckets;
  }
  function enrichNpcStructure(npc){
    if(!npc) return npc;
    const profile=keyForRace(npc.race) || {};
    npc.raceProfile = Object.assign({
      race:npc.race,
      category:profile.category || npc.raceCategory || 'Uncategorized',
      creatorGod:profile.creatorGod || '',
      creatorDominion:profile.creatorDominion || '',
      pantheonInfluence:profile.pantheonInfluence || '',
      typicalPlayTendency:profile.typicalPlayTendency || '',
      axisReading:profile.axisReading || '',
      tableAbilities:profile.tableAbilities || '',
      habitats:profile.habitatLabels || profile.habitats || [],
      dmHook:profile.dmHook || ''
    }, npc.raceProfile||{});
    npc.alignment = npc.alignment || {axes:{altruism:1500,lawfulness:1500,cooperation:1500,honor:1500}};
    npc.alignment.phaseBreakdown = axisSummary(npc.alignment);
    npc.relationshipNetwork = relationBuckets(npc);
    npc.lifeStructure = Object.assign({
      visibleFamilyTree:true,
      householdId:npc.householdId || '',
      scenarioCoverage:['sleep','home','work','meal','library','date','temple','market','family','personal','social','transit','work trip','vacation'],
      travelLogic:{workTrip:npc.workTripPlan||null, vacation:npc.vacationPlan||null},
      scheduleCodeFormat:'days[] + start/end + scenario + label + locationId/locationName + icon',
      mapMovement:'activeBlock + npcPosition interpolate between fromId/toId and jitter around active locations',
      identityLine:`${npc.race} · ${npc.genderIdentity} · ${npc.pronouns}`
    }, npc.lifeStructure||{});
    return npc;
  }
  B.enrichLocationStructure=enrichLocationStructure;
  B.enrichNpcStructure=enrichNpcStructure;
  B.enrichLivingStructure=function(){
    (B.state?.locations||[]).forEach(enrichLocationStructure);
    (B.state?.npcs||[]).forEach(enrichNpcStructure);
    if(B.state){
      B.state.structuredBelavados = Object.assign({
        version:3,
        features:['race/pantheon profiles','alignment phases','relationship buckets','visible family metadata','location roles','province UTC','Belavadös time conversion','travel scenario metadata']
      }, B.state.structuredBelavados||{});
    }
    return B.state;
  };

  const baseDefault=B.defaultState;
  if(baseDefault && !B._structuredDefaultWrapped){
    B.defaultState=function(){
      const s=baseDefault.apply(B, arguments);
      s.structuredBelavados={version:3,enabled:true,source:'attached Belavadös compendiums'};
      return s;
    };
    B._structuredDefaultWrapped=true;
  }
  const baseLoad=B.load;
  if(baseLoad && !B._structuredLoadWrapped){
    B.load=function(){ const s=baseLoad.apply(B, arguments); B.enrichLivingStructure(); return s; };
    B._structuredLoadWrapped=true;
  }
  const baseImport=B.importJSONFile;
  if(baseImport && !B._structuredImportWrapped){
    B.importJSONFile=function(file){ return baseImport.call(B,file).then(state=>{B.enrichLivingStructure(); B.save&&B.save(); return state;}); };
    B._structuredImportWrapped=true;
  }
  const baseGL=B.generateLocations;
  if(baseGL && !B._structuredLocationsWrapped){
    B.generateLocations=function(){ const result=baseGL.apply(B, arguments); (B.state?.locations||[]).forEach(enrichLocationStructure); B.log&&B.log('Applied Belavadös location roles, staffing, visit purposes, UTC, and civic hooks.'); B.save&&B.save(); return result; };
    B._structuredLocationsWrapped=true;
  }
  const baseGN=B.generateNpcs;
  if(baseGN && !B._structuredNpcsWrapped){
    B.generateNpcs=function(count){ const result=baseGN.call(B, count); (B.state?.npcs||[]).forEach(enrichNpcStructure); B.log&&B.log('Applied race profiles, pantheon influence, alignment phases, relationship buckets, and life-structure metadata.'); B.save&&B.save(); return result; };
    B._structuredNpcsWrapped=true;
  }

  function structuredNpcHTML(npc){
    if(!npc) return '';
    enrichNpcStructure(npc);
    const rp=npc.raceProfile||{};
    const buckets=npc.relationshipNetwork||{};
    const bucketTags=Object.entries(buckets).map(([k,v])=>`<span class="tag">${B.escape(k)} ${v.length}</span>`).join('');
    const phases=(npc.alignment?.phaseBreakdown||[]).map(a=>`<span class="tag green">${B.escape(a.label)}: ${B.escape(a.phase)}</span>`).join('');
    const travel=[];
    if(npc.workTripPlan) travel.push(`Work trip: ${npc.workTripPlan.settlement}, ${npc.workTripPlan.province} for ${npc.workTripPlan.purpose}`);
    if(npc.vacationPlan) travel.push(`Vacation: ${npc.vacationPlan.settlement}, ${npc.vacationPlan.province} for ${npc.vacationPlan.purpose}`);
    return `<section class="life-panel structured-panel"><h4>Belavadös structure</h4>
      <div class="small"><b>Race profile:</b> ${B.escape(rp.category||'')} ${rp.creatorGod?`· Creator: ${B.escape(rp.creatorGod)}`:''}</div>
      ${rp.pantheonInfluence?`<p class="small">${B.escape(rp.pantheonInfluence)}</p>`:''}
      <div class="tags">${phases}</div>
      <div class="tags">${bucketTags}</div>
      <div class="small"><b>Visible family tree:</b> yes · <b>Schedule code:</b> days/start/end/scenario/location/icon · <b>Movement:</b> map token follows active scenario.</div>
      ${travel.length?`<div class="notice"><b>Travel hooks:</b> ${B.escape(travel.join(' · '))}</div>`:''}
    </section>`;
  }
  function structuredLocationHTML(loc){
    if(!loc) return '';
    enrichLocationStructure(loc);
    const st=loc.structured||{};
    return `<section class="life-panel structured-panel"><h4>Belavadös location structure</h4>
      <div class="small"><b>Role:</b> ${B.escape(st.role)} · <b>Biome:</b> ${B.escape(st.biomeContext)} · <b>UTC:</b> ${B.escape(st.provinceUTC||'settlement-specific')}</div>
      <div class="tags">${(st.requiredStaffRoles||[]).map(x=>`<span class="tag">${B.escape(x)}</span>`).join('')}</div>
      <div class="tags">${(st.visitPurposes||[]).map(x=>`<span class="tag green">${B.escape(x)}</span>`).join('')}</div>
      <div class="small"><b>Civic hooks:</b> ${(st.civicHooks||[]).map(B.escape).join(' · ')}</div>
    </section>`;
  }

  if(B.OpenTS2 && !B._structuredOpenTS2HtmlWrapped){
    const baseLife=B.OpenTS2.lifeSimHTML;
    B.OpenTS2.lifeSimHTML=function(npc, opts){ return (baseLife?baseLife.call(B.OpenTS2,npc,opts):'') + structuredNpcHTML(npc); };
    const baseLoc=B.OpenTS2.locationLifeHTML;
    B.OpenTS2.locationLifeHTML=function(loc){ return (baseLoc?baseLoc.call(B.OpenTS2,loc):'') + structuredLocationHTML(loc); };
    B._structuredOpenTS2HtmlWrapped=true;
  }
})();
