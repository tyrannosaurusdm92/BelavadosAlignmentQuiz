/*
 * Belavadös OpenTS2 Life Simulation Adapter
 * ------------------------------------------------------------
 * This browser module adapts compatible life-simulation patterns from
 * OpenTS2-master (Unity/C#, MPL 2.0) into the Belavadös static NPC generator.
 *
 * OpenTS2 concepts adapted here:
 * - Simulator-style recurring ticks
 * - VM/entity/object-data style state containers
 * - primitive-like random/sleep/autonomous action handling
 * - neighborhood/neighbor relationship tables
 * - motive/personality data source ideas
 *
 * This is not a drop-in copy of Unity code; it is a browser-safe JavaScript
 * implementation shaped to this generator's data model.
 */
(function(){
  const B = window.BELAVADOS = window.BELAVADOS || {};
  const clamp = (v,min=0,max=100)=>Math.max(min,Math.min(max,Number.isFinite(v)?v:min));
  const dayKey = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const minutesBetween = (a,b)=>Math.max(0,(b-a)/60000);
  const text = v => String(v ?? '');
  const contains = (hay,rx)=>rx.test(text(hay).toLowerCase());
  const qualityBand = v => v < 18 ? 'critical' : v < 35 ? 'low' : v < 65 ? 'steady' : v < 85 ? 'good' : 'high';

  const NEEDS = [
    {key:'hunger', label:'Hunger', icon:'🍲', decay:.095},
    {key:'energy', label:'Energy', icon:'🌙', decay:.075},
    {key:'social', label:'Social', icon:'💬', decay:.055},
    {key:'fun', label:'Fun', icon:'🎲', decay:.06},
    {key:'comfort', label:'Comfort', icon:'🛋️', decay:.035},
    {key:'hygiene', label:'Hygiene', icon:'🫧', decay:.045},
    {key:'bladder', label:'Bladder', icon:'🚻', decay:.08},
    {key:'ambition', label:'Ambition', icon:'⭐', decay:.025}
  ];

  const PERSON_KEYS = ['neat','outgoing','active','playful','nice','serious','independent','romantic','curious','familyMinded'];

  const SCENARIO_EFFECTS = {
    sleep:{energy:+.85,hunger:-.02,social:-.04,fun:-.02,comfort:+.06,hygiene:-.025,bladder:-.045,ambition:-.01},
    home:{energy:+.04,hunger:-.065,social:+.035,fun:+.035,comfort:+.08,hygiene:+.02,bladder:-.055,ambition:-.015},
    meal:{hunger:+.95,social:+.06,fun:+.03,comfort:+.02,bladder:-.035},
    work:{energy:-.11,hunger:-.09,social:-.035,fun:-.065,comfort:-.035,hygiene:-.035,bladder:-.07,ambition:+.055},
    transit:{energy:-.055,hunger:-.055,social:-.01,fun:-.02,comfort:-.04,hygiene:-.02,bladder:-.06},
    library:{energy:-.045,hunger:-.055,social:-.015,fun:+.075,comfort:+.02,hygiene:-.02,bladder:-.045,ambition:+.04},
    date:{energy:-.055,hunger:-.045,social:+.18,fun:+.12,comfort:+.03,hygiene:-.015,bladder:-.04,ambition:+.015},
    temple:{energy:-.03,hunger:-.05,social:+.08,fun:+.015,comfort:+.035,hygiene:-.015,bladder:-.035,ambition:+.025},
    market:{energy:-.06,hunger:-.045,social:+.06,fun:+.08,comfort:-.025,hygiene:-.02,bladder:-.035,ambition:+.015},
    family:{energy:-.025,hunger:-.04,social:+.16,fun:+.055,comfort:+.06,hygiene:-.015,bladder:-.035,ambition:+.01},
    personal:{energy:-.035,hunger:-.045,social:-.015,fun:+.14,comfort:+.04,hygiene:-.015,bladder:-.035,ambition:+.02},
    social:{energy:-.055,hunger:-.05,social:+.17,fun:+.12,comfort:+.02,hygiene:-.02,bladder:-.045,ambition:+.02},
    travel_work:{energy:-.08,hunger:-.08,social:-.015,fun:-.025,comfort:-.05,hygiene:-.03,bladder:-.06,ambition:+.04},
    vacation:{energy:+.02,hunger:-.04,social:+.08,fun:+.18,comfort:+.045,hygiene:-.01,bladder:-.035,ambition:-.01},
    autonomy_meal:{hunger:+1.15,social:+.035,fun:+.02,comfort:+.015,bladder:-.035},
    autonomy_rest:{energy:+.9,comfort:+.08,hunger:-.03,social:-.02,fun:+.015,bladder:-.04},
    autonomy_social:{social:+.85,fun:+.22,energy:-.03,hunger:-.035,comfort:+.025,bladder:-.03},
    autonomy_fun:{fun:+.85,energy:-.035,hunger:-.035,social:+.03,comfort:+.02,bladder:-.03},
    autonomy_hygiene:{hygiene:+1.05,comfort:+.03,energy:-.02,hunger:-.02,bladder:-.02},
    autonomy_bladder:{bladder:+1.35,comfort:+.05,energy:-.015,hunger:-.02},
    autonomy_comfort:{comfort:+.9,energy:+.14,fun:+.045,hunger:-.025,social:-.01,bladder:-.025},
    autonomy_ambition:{ambition:+.75,fun:+.035,energy:-.045,hunger:-.035,social:+.015,bladder:-.025}
  };

  const LOCATION_PATTERNS = {
    food:/tavern|inn|restaurant|bakery|food|cookshop|tea|market|hospitality|cafe|dining|kitchen/,
    rest:/home|house|inn|hotel|hostel|residence|common|leisure|garden|park|bath|spa|sanctuary/,
    social:/tavern|inn|theater|market|plaza|square|forum|hall|guild|festival|garden|park|tea|restaurant/,
    fun:/theater|arena|library|game|tavern|market|festival|music|gallery|park|garden|archive|museum/,
    hygiene:/bath|spa|healer|clinic|apothecary|home|inn|hotel|hostel|well|water|temple/,
    bladder:/bath|restroom|washroom|privy|home|inn|tavern|hotel|hostel|clinic|temple/,
    comfort:/home|inn|hotel|hostel|garden|park|tea|temple|library|common|healer|spa/,
    ambition:/guild|library|archive|school|academy|university|workshop|forge|office|hall|court|market|temple/
  };

  const INTERACTIONS = [
    {id:'eat_meal', motive:'hunger', threshold:31, duration:[28,55], scenario:'autonomy_meal', icon:'🍲', loc:'food',
      label:n=>`getting food because ${poss(n)} hunger is low`, want:'Eat a satisfying meal'},
    {id:'power_nap', motive:'energy', threshold:23, duration:[35,90], scenario:'autonomy_rest', icon:'😴', loc:'rest',
      label:n=>`taking a restorative break before ${subj(n)} burns out`, want:'Recover energy'},
    {id:'check_in', motive:'social', threshold:28, duration:[25,70], scenario:'autonomy_social', icon:'💬', loc:'social',
      label:n=>`checking in with someone important`, want:'Talk to a trusted person'},
    {id:'do_hobby', motive:'fun', threshold:30, duration:[30,85], scenario:'autonomy_fun', icon:'🎲', loc:'fun',
      label:n=>`doing a hobby to feel like a person again`, want:'Do something enjoyable'},
    {id:'freshen_up', motive:'hygiene', threshold:26, duration:[18,45], scenario:'autonomy_hygiene', icon:'🫧', loc:'hygiene',
      label:n=>`freshening up and resetting presentation`, want:'Freshen up'},
    {id:'privacy_break', motive:'bladder', threshold:25, duration:[8,18], scenario:'autonomy_bladder', icon:'🚻', loc:'bladder',
      label:n=>`finding a private place`, want:'Find a private place'},
    {id:'find_comfort', motive:'comfort', threshold:26, duration:[30,75], scenario:'autonomy_comfort', icon:'🛋️', loc:'comfort',
      label:n=>`seeking a comfortable place to settle nerves`, want:'Get comfortable'},
    {id:'advance_goal', motive:'ambition', threshold:32, duration:[35,95], scenario:'autonomy_ambition', icon:'⭐', loc:'ambition',
      label:n=>`working toward a personal goal`, want:'Make progress on a personal goal'}
  ];

  function subj(npc){
    const p=text(npc?.pronouns).toLowerCase();
    if(p.includes('she')) return 'she';
    if(p.includes('he')) return 'he';
    return 'they';
  }
  function objp(npc){
    const p=text(npc?.pronouns).toLowerCase();
    if(p.includes('she')) return 'her';
    if(p.includes('he')) return 'him';
    return 'them';
  }
  function poss(npc){
    const p=text(npc?.pronouns).toLowerCase();
    if(p.includes('she')) return 'her';
    if(p.includes('he')) return 'his';
    return 'their';
  }

  function seeded(npc, salt){
    return B.rng(`${B.state?.seed||'Belavados'}|opents2|${npc?.id||npc?.name||'npc'}|${salt||''}`);
  }

  function intFrom(npc, salt, min, max){
    const r = seeded(npc, salt);
    return Math.floor(r()*(max-min+1))+min;
  }

  function pickFrom(npc, salt, arr){
    const r = seeded(npc, salt);
    return B.pick(arr, r);
  }

  function motiveObj(npc){
    npc.motives = npc.motives || {};
    NEEDS.forEach((n,i)=>{
      if(typeof npc.motives[n.key] !== 'number'){
        const base = Number(npc.needs?.[n.key]);
        npc.motives[n.key] = Number.isFinite(base) ? clamp(base) : intFrom(npc, 'motive-'+n.key, 42, 88);
      }
    });
    return npc.motives;
  }

  function traitsText(npc){
    return [npc.personality, ...(npc.traits||[]), ...(npc.hobbies||[]), npc.job, npc.roleInHousehold, npc.lifeStage].join(' ').toLowerCase();
  }

  function scorePersonality(npc){
    const r = seeded(npc,'personality');
    const t = traitsText(npc);
    const align = npc.alignment?.axes || {};
    const score = key => Math.floor(r()*3);
    const out = {
      neat: 4+score('neat')+(contains(t,/precise|careful|order|craft|clean|healer|priest|clerk/)?3:0),
      outgoing: 4+score('out')+(contains(t,/public|debating|gossip|perform|tavern|market|charm/)?3:0)+((align.cooperation||1500)>1900?1:0),
      active: 4+score('active')+(contains(t,/guard|farmer|driver|runner|skyship|caravan|athletic/)?3:0),
      playful: 4+score('play')+(contains(t,/playful|joke|food|music|story|festival|game|poetry/)?3:0),
      nice: 4+score('nice')+(contains(t,/kind|gentle|honor|family|care|healer|teacher/)?3:0)+((align.altruism||1500)>1850?2:0),
      serious: 4+score('serious')+(contains(t,/scholar|archive|law|guard|craft|always needs proof/)?3:0),
      independent: 4+score('ind')+(contains(t,/solitary|wander|secret|scout|traveler/)?3:0)+((align.cooperation||1500)<1100?2:0),
      romantic: 4+score('romance')+(contains(t,/date|beauty|poetry|tea|glamour|charm/)?3:0),
      curious: 4+score('curious')+(contains(t,/library|map|history|archive|study|knowledge|proof/)?3:0),
      familyMinded: 4+score('family')+(contains(t,/family|parent|grandparent|child|chosen|elder/)?3:0)
    };
    PERSON_KEYS.forEach(k=>out[k]=clamp(out[k],0,10));
    return out;
  }

  function aspirationFor(npc){
    const t = traitsText(npc);
    const options = [
      ['Knowledge',/library|archive|study|knowledge|teacher|scholar|map|proof|arcane/],
      ['Family',/family|parent|child|elder|home|genealogy|chosen/],
      ['Fortune',/merchant|market|trade|craft|ambition|renown|security|works through exhaustion/],
      ['Popularity',/public|debating|gossip|perform|tavern|social|festival|community/],
      ['Romance',/date|romantic|beauty|poetry|charm|glamour/],
      ['Pleasure',/food|music|game|festival|comfort|street food|hobby/],
      ['Power',/guard|law|court|government|oath|command|ambition/],
      ['Nature',/reef|forest|farm|garden|animal|wilderness|river|marsh/]
    ];
    for(const [name,rx] of options){ if(rx.test(t)) return name; }
    return pickFrom(npc,'aspiration', options.map(x=>x[0]));
  }

  function buildWants(npc){
    const asp = npc.aspiration || aspirationFor(npc);
    const hobby = (npc.hobbies||[])[0] || 'a favorite hobby';
    const byAsp = {
      Knowledge:['Learn a local secret','Read at a library','Master a difficult skill'],
      Family:['Share a meal with family','Strengthen a household bond','Preserve a family memory'],
      Fortune:['Earn extra coin','Upgrade work tools','Make a useful professional contact'],
      Popularity:['Make a new friend','Host a good conversation','Be seen at a public place'],
      Romance:['Go on a date','Write a sweet message','Spend time with a partner'],
      Pleasure:[`Enjoy ${hobby}`,'Try a new meal','Take a beautiful walk'],
      Power:['Win respect at work','Handle a civic problem','Be trusted with responsibility'],
      Nature:['Visit a green place','Tend plants or animals','Notice a change in the weather']
    };
    return (byAsp[asp]||byAsp.Knowledge).map((w,i)=>({text:w,progress:i===0?intFrom(npc,'wantp'+i,0,45):0,target:100}));
  }

  function buildFears(npc){
    const flaw = text(npc.flaw || (npc.personality||'').split('but often ')[1] || 'being misunderstood');
    const asp = npc.aspiration || aspirationFor(npc);
    const common = [`Let ${poss(npc)} needs collapse`, 'Damage an important relationship'];
    const map = {
      Knowledge:'Be proven wrong in public',
      Family:'Miss an important family moment',
      Fortune:'Lose hard-earned savings',
      Popularity:'Be ignored by the community',
      Romance:'Disappoint a partner',
      Pleasure:'Get trapped in joyless routine',
      Power:'Lose authority in a crisis',
      Nature:'See a beloved place neglected'
    };
    return [{text:map[asp]||'Fail a personal goal',level:intFrom(npc,'fear1',15,60)}, {text:flaw,level:intFrom(npc,'fear2',20,75)}, ...common.map((x,i)=>({text:x,level:25+i*10}))];
  }

  function buildSkills(npc){
    const t = traitsText(npc);
    const skills = {
      cooking: contains(t,/food|tavern|tea|cook|inn|hospitality/) ? 4 : 1,
      mechanical: contains(t,/clockwork|repair|forge|rail|ship|craft|driver/) ? 5 : 1,
      charisma: contains(t,/public|debating|gossip|perform|market|charm|tavern/) ? 5 : 2,
      body: contains(t,/guard|driver|farmer|caravan|active|wilderness/) ? 4 : 1,
      logic: contains(t,/library|archive|study|proof|map|arcane|teacher/) ? 5 : 2,
      creativity: contains(t,/poetry|music|art|beauty|story|festival/) ? 5 : 2,
      cleaning: contains(t,/neat|careful|healer|home/) ? 4 : 1
    };
    Object.keys(skills).forEach(k=>skills[k]=clamp(skills[k]+intFrom(npc,'skill-'+k,0,3),0,10));
    return skills;
  }

  function buildInterests(npc){
    const pool = [
      'family history','local politics','food','craft guilds','transit routes','religious rites','fashion',
      'weather signs','arcane theory','gardens','public festivals','rumors','medicine','maps','trade prices'
    ];
    const picks = B.sample(pool, 6, seeded(npc,'interests'));
    return picks.map((name,i)=>({name,score:intFrom(npc,'interest-'+i,20,100)}));
  }

  function addMemory(npc, textValue, emotion='neutral', date=new Date()){
    npc.memories = npc.memories || [];
    const key = `${dayKey(date)}|${textValue}`;
    if(npc.memories.some(m=>m.key===key)) return;
    npc.memories.unshift({key, at:date.toISOString(), text:textValue, emotion});
    npc.memories = npc.memories.slice(0,18);
  }

  function initMemories(npc){
    if((npc.memories||[]).length) return;
    addMemory(npc, `Became known as ${npc.job} at ${npc.workLocationName}.`, 'ambition');
    addMemory(npc, `Settled at ${npc.homeLocationName} with ${npc.householdName || 'their household'}.`, 'home');
    (npc.relationships||[]).slice(0,2).forEach(r=>addMemory(npc, `Built a ${r.type.toLowerCase()} bond with ${r.npcName}.`, 'relationship'));
  }

  function initRelationshipScores(npc){
    (npc.relationships||[]).forEach((rel,i)=>{
      if(typeof rel.shortTerm !== 'number') rel.shortTerm = intFrom(npc, `relst-${rel.npcId||rel.npcName||i}`, 15, 85);
      if(typeof rel.longTerm !== 'number') rel.longTerm = clamp((rel.strength||50) + intFrom(npc, `rellt-${rel.npcId||rel.npcName||i}`, -15, 20), -100, 100);
      if(typeof rel.chemistry !== 'number') rel.chemistry = intFrom(npc, `relchem-${rel.npcId||rel.npcName||i}`, -2, 3);
      rel.daily = rel.shortTerm > 65 ? 'warm' : rel.shortTerm < 30 ? 'strained' : 'steady';
    });
  }

  function enrichNpc(npc, index=0){
    if(!npc || typeof npc !== 'object') return npc;
    npc.openTS2 = npc.openTS2 || {
      adapterVersion: 1,
      entityId: (B.hash(npc.id || npc.name || index) & 0x7fffffff),
      threadState: 'idle',
      stack: [],
      queue: [],
      lastTickISO: null,
      lastSaveHintISO: null
    };
    npc.simObjectData = npc.simObjectData || {
      objectId: npc.openTS2.entityId,
      room: -1,
      personData: {},
      motiveData: {}
    };
    motiveObj(npc);
    npc.needs = Object.assign({}, npc.motives);
    npc.simology = npc.simology || {};
    npc.simology.personality = npc.simology.personality || scorePersonality(npc);
    npc.simology.skills = npc.simology.skills || buildSkills(npc);
    npc.simology.interests = npc.simology.interests || buildInterests(npc);
    npc.aspiration = npc.aspiration || aspirationFor(npc);
    npc.aspirationScore = typeof npc.aspirationScore === 'number' ? npc.aspirationScore : intFrom(npc,'aspirationScore', -20, 60);
    npc.wants = (npc.wants && npc.wants.length) ? npc.wants : buildWants(npc);
    npc.fears = (npc.fears && npc.fears.length) ? npc.fears : buildFears(npc);
    npc.autonomy = npc.autonomy || {enabled:true,current:null,history:[],lastDecisionKey:null};
    npc.mood = npc.mood || {score:50,label:'steady',thought:'settling into the day'};
    initRelationshipScores(npc);
    initMemories(npc);
    updateObjectData(npc);
    return npc;
  }

  function inferAffordances(loc){
    const hay = `${loc.name} ${loc.type} ${loc.category} ${loc.use} ${(loc.inventory||[]).join(' ')} ${(loc.services||[]).join(' ')}`.toLowerCase();
    const out = [];
    Object.entries(LOCATION_PATTERNS).forEach(([key,rx])=>{ if(rx.test(hay)) out.push(key); });
    if(/work|craft|industry|law|government|retail|education|health|transit|wilderness/.test(hay)) out.push('work');
    if(/resident|home|inn|hostel|hotel|house/.test(hay)) out.push('sleep');
    return [...new Set(out)];
  }

  function enrichLocation(loc, i=0){
    if(!loc) return loc;
    loc.affordances = (loc.affordances && loc.affordances.length) ? loc.affordances : inferAffordances(loc);
    loc.simObjectData = loc.simObjectData || {
      objectId: B.hash(loc.id || loc.name || i) & 0x7fffffff,
      room: i+1,
      advertisedInteractions: loc.affordances.slice()
    };
    return loc;
  }

  function updateObjectData(npc){
    const motives = motiveObj(npc);
    npc.simObjectData = npc.simObjectData || {objectId:B.hash(npc.id||npc.name)&0x7fffffff, room:-1, personData:{}, motiveData:{}};
    npc.simObjectData.motiveData = Object.assign({}, motives);
    npc.simObjectData.personData = {
      aspiration:npc.aspiration,
      moodScore:npc.mood?.score ?? 50,
      currentLocationId:npc.current?.locationId || npc.current?.locationName || npc.homeLocationId || '',
      threadState:npc.openTS2?.threadState || 'idle'
    };
  }

  function effectForScenario(scenario){
    return SCENARIO_EFFECTS[scenario] || SCENARIO_EFFECTS.home;
  }

  function tickNpc(npc, date, baseBlock){
    enrichNpc(npc);
    const now = date || new Date();
    const last = npc.openTS2.lastTickISO ? new Date(npc.openTS2.lastTickISO) : now;
    let delta = minutesBetween(last, now);
    if(delta <= 0) return;
    delta = Math.min(delta, 180);
    const scenario = (npc.autonomy?.current && new Date(npc.autonomy.current.endISO) > now) ? npc.autonomy.current.scenario : (baseBlock?.scenario || 'home');
    const effect = effectForScenario(scenario);
    const motives = motiveObj(npc);
    NEEDS.forEach(n=>{
      const genericDecay = -n.decay;
      const scenarioEffect = effect[n.key] || 0;
      const personalityMod = motivePersonalityModifier(npc, n.key);
      motives[n.key] = clamp(motives[n.key] + (genericDecay + scenarioEffect + personalityMod) * delta);
    });
    npc.openTS2.lastTickISO = now.toISOString();
    const score = motiveScore(motives);
    npc.mood = {
      score,
      label: score < 22 ? 'desperate' : score < 40 ? 'strained' : score < 62 ? 'steady' : score < 80 ? 'content' : 'thriving',
      thought: thoughtFor(npc, motives)
    };
    npc.needs = Object.assign({}, motives);
    updateWantsFromScenario(npc, scenario, delta);
    updateObjectData(npc);
    B.OpenTS2._dirty = true;
  }

  function motivePersonalityModifier(npc, key){
    const p = npc.simology?.personality || {};
    if(key === 'social') return ((p.outgoing||5)-5)*-.004 + ((p.familyMinded||5)-5)*-.002;
    if(key === 'fun') return ((p.playful||5)-5)*-.004;
    if(key === 'hygiene') return ((p.neat||5)-5)*+.003;
    if(key === 'energy') return ((p.active||5)-5)*-.003;
    if(key === 'ambition') return ((p.serious||5)-5)*+.003 + ((p.curious||5)-5)*+.002;
    return 0;
  }

  function motiveScore(motives){
    const vals = NEEDS.map(n=>motives[n.key] ?? 50);
    return clamp(vals.reduce((a,b)=>a+b,0)/vals.length);
  }

  function lowestMotive(motives){
    return NEEDS.map(n=>({key:n.key,label:n.label,icon:n.icon,value:motives[n.key]??50})).sort((a,b)=>a.value-b.value)[0];
  }

  function thoughtFor(npc, motives){
    const low = lowestMotive(motives);
    if(low.value < 20) return `${low.icon} ${low.label} is urgent.`;
    if(npc.wants?.[0]) return `💭 Wants: ${npc.wants[0].text}.`;
    return `💭 Thinking about ${poss(npc)} day.`;
  }

  function updateWantsFromScenario(npc, scenario, delta){
    if(!npc.wants) return;
    const map = {
      autonomy_meal:/meal|eat|food/i,
      meal:/meal|eat|food/i,
      autonomy_social:/talk|friend|conversation|trusted|new friend/i,
      social:/friend|conversation|public|new friend/i,
      date:/date|partner|sweet/i,
      library:/learn|read|master|secret/i,
      autonomy_ambition:/progress|goal|responsibility|skill|contact|coin/i,
      work:/work|coin|professional|respect|responsibility/i,
      family:/family|household|memory|meal/i,
      personal:/hobby|enjoy|walk|routine/i,
      autonomy_fun:/hobby|enjoy|meal|walk|routine/i
    };
    const rx = map[scenario];
    if(!rx) return;
    npc.wants.forEach(w=>{
      if(rx.test(w.text)){
        w.progress = clamp((w.progress||0) + delta*.8, 0, w.target||100);
        if(w.progress >= (w.target||100) && !w.completedAt){
          w.completedAt = new Date().toISOString();
          npc.aspirationScore = clamp((npc.aspirationScore||0)+8,-100,100);
          addMemory(npc, `Fulfilled a want: ${w.text}.`, 'want');
        }
      }
    });
  }

  function shouldRespectSchedule(baseBlock, interaction){
    if(!baseBlock) return false;
    if(baseBlock.away) return true;
    if(baseBlock.scenario === 'sleep' && !['hunger','bladder'].includes(interaction.motive)) return true;
    if(baseBlock.scenario === 'work' && ['fun','comfort'].includes(interaction.motive)) return true;
    if(baseBlock.scenario === 'transit' && !['bladder','hunger'].includes(interaction.motive)) return true;
    return false;
  }

  function currentActionStillActive(npc, date){
    const a = npc.autonomy?.current;
    if(!a) return null;
    const end = new Date(a.endISO);
    if(end > date) return a;
    npc.autonomy.history = npc.autonomy.history || [];
    npc.autonomy.history.unshift(Object.assign({}, a, {endedAt:date.toISOString()}));
    npc.autonomy.history = npc.autonomy.history.slice(0,14);
    npc.autonomy.current = null;
    return null;
  }

  function chooseInteraction(npc, date, baseBlock){
    if(npc.autonomy?.enabled === false) return null;
    const active = currentActionStillActive(npc, date);
    if(active) return active;
    const motives = motiveObj(npc);
    const candidates = INTERACTIONS
      .map(def=>({def, value:motives[def.motive] ?? 50, urgency:def.threshold - (motives[def.motive] ?? 50)}))
      .filter(x=>x.urgency > 0 && !shouldRespectSchedule(baseBlock, x.def))
      .sort((a,b)=>b.urgency-a.urgency);
    const decisionKey = `${dayKey(date)}|${date.getHours()}|${Math.floor(date.getMinutes()/15)}|${baseBlock?.scenario||'none'}`;
    if(candidates.length){
      return startInteraction(npc, candidates[0].def, date, baseBlock, candidates[0].urgency);
    }
    const p = npc.simology?.personality || {};
    const r = seeded(npc, decisionKey);
    const lowPressure = (baseBlock?.scenario === 'home' || baseBlock?.scenario === 'personal' || baseBlock?.scenario === 'market' || baseBlock?.scenario === 'social');
    const chance = lowPressure ? .12 + ((p.playful||5)-5)*.01 + ((p.outgoing||5)-5)*.008 : .025;
    if(npc.autonomy?.lastDecisionKey !== decisionKey && r() < chance){
      const possible = INTERACTIONS.filter(x=>!shouldRespectSchedule(baseBlock, x));
      const def = B.pick(possible, r);
      npc.autonomy.lastDecisionKey = decisionKey;
      return startInteraction(npc, def, date, baseBlock, 3);
    }
    npc.autonomy.lastDecisionKey = decisionKey;
    return null;
  }

  function startInteraction(npc, def, date, baseBlock, urgency=0){
    const r = seeded(npc, `${def.id}|${date.toISOString().slice(0,13)}`);
    const dur = Math.floor(def.duration[0] + r()*(def.duration[1]-def.duration[0]+1));
    const loc = findLocationFor(npc, def.loc, baseBlock) || findLocationFor(npc, 'comfort', baseBlock) || {id:npc.homeLocationId,name:npc.homeLocationName,x:50,y:50};
    const fromId = baseBlock?.locationId || npc.current?.locationId || npc.workLocationId || npc.homeLocationId;
    const startISO = date.toISOString();
    const endISO = new Date(date.getTime()+dur*60000).toISOString();
    const partner = def.id === 'check_in' ? bestRelationshipName(npc) : '';
    const baseLabel = typeof def.label === 'function' ? def.label(npc) : def.label;
    const action = {
      id:def.id,
      primitive:'generic_sim_call',
      motive:def.motive,
      priority:Math.round(urgency),
      scenario:def.scenario,
      icon:def.icon,
      startISO,
      endISO,
      start:hhmm(date),
      end:hhmm(new Date(endISO)),
      label: partner ? `${baseLabel} (${partner})` : baseLabel,
      locationId:loc.id,
      locationName:loc.name,
      fromId,
      toId:loc.id,
      progress:0,
      autonomous:true,
      source:'OpenTS2-inspired motive primitive'
    };
    npc.autonomy = npc.autonomy || {enabled:true,history:[]};
    npc.autonomy.current = action;
    npc.openTS2.queue = npc.openTS2.queue || [];
    npc.openTS2.queue.unshift({primitive:def.id,queuedAt:startISO,locationId:loc.id,reason:`${def.motive} ${Math.round(motiveObj(npc)[def.motive])}`});
    npc.openTS2.queue = npc.openTS2.queue.slice(0,8);
    npc.openTS2.threadState = 'running';
    npc.wants = npc.wants || buildWants(npc);
    if(!npc.wants.some(w=>w.text === def.want)){
      npc.wants.unshift({text:def.want,progress:15,target:100});
      npc.wants = npc.wants.slice(0,4);
    }
    addMemory(npc, `Autonomously chose to ${def.want.toLowerCase()} at ${loc.name}.`, def.motive, date);
    B.OpenTS2._dirty = true;
    return action;
  }

  function hhmm(d){
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  }

  function bestRelationshipName(npc){
    const rel = (npc.relationships||[]).slice().sort((a,b)=>(b.shortTerm||b.strength||0)-(a.shortTerm||a.strength||0))[0];
    return rel ? rel.npcName : '';
  }

  function findLocationFor(npc, locKey, baseBlock){
    const locs = B.state?.locations || [];
    const rx = LOCATION_PATTERNS[locKey] || /./;
    const scored = locs.map(l=>{
      const hay = `${l.name} ${l.type} ${l.category} ${l.use} ${(l.inventory||[]).join(' ')} ${(l.services||[]).join(' ')} ${(l.affordances||[]).join(' ')}`.toLowerCase();
      let score = rx.test(hay) ? 20 : 0;
      if((l.affordances||[]).includes(locKey)) score += 12;
      if(l.id === npc.homeLocationId) score += locKey === 'rest' || locKey === 'comfort' || locKey === 'hygiene' || locKey === 'bladder' ? 10 : 0;
      if(l.id === npc.workLocationId) score += locKey === 'ambition' ? 8 : 0;
      if(baseBlock?.locationId === l.id) score += 3;
      const dx = Number(l.x||50) - Number((B.state.locations.find(x=>x.id===baseBlock?.locationId)||{}).x||50);
      const dy = Number(l.y||50) - Number((B.state.locations.find(x=>x.id===baseBlock?.locationId)||{}).y||50);
      score -= Math.sqrt(dx*dx+dy*dy)/40;
      return {l,score};
    }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
    return scored[0]?.l || null;
  }

  function actionToBlock(action, date){
    const st = new Date(action.startISO), en = new Date(action.endISO);
    const p = Math.max(0,Math.min(1,(date-st)/(en-st||1)));
    return Object.assign({}, action, {progress:p, days:[date.getDay()]});
  }

  function resolveAction(npc, date, baseBlock){
    tickNpc(npc, date, baseBlock);
    const action = chooseInteraction(npc, date, baseBlock);
    if(action) return actionToBlock(action, date);
    if(npc.openTS2) npc.openTS2.threadState = baseBlock?.scenario === 'sleep' ? 'sleeping' : 'idle';
    return baseBlock;
  }

  function positionFor(npc, date, basePositionFn){
    const bl = B.activeBlock(npc, date);
    const locs = Object.fromEntries((B.state?.locations||[]).map(l=>[l.id,l]));
    if(bl.away) return Object.assign({}, bl, {x:bl.x, y:bl.y});
    if(bl.fromId && bl.toId && bl.fromId !== bl.toId && (bl.scenario === 'transit' || bl.autonomous)){
      const a = locs[bl.fromId] || locs[npc.homeLocationId] || {x:50,y:50};
      const b = locs[bl.toId] || locs[bl.locationId] || {x:50,y:50};
      const p = Math.max(0,Math.min(1, bl.progress || 0));
      const ease = p<.5 ? 2*p*p : 1-Math.pow(-2*p+2,2)/2;
      return Object.assign({}, bl, {x:Number(a.x)+(Number(b.x)-Number(a.x))*ease, y:Number(a.y)+(Number(b.y)-Number(a.y))*ease});
    }
    const loc = locs[bl.locationId] || locs[npc.homeLocationId] || {x:50,y:50};
    const t = date.getTime()/1000;
    const h = B.hash(npc.id||npc.name||'npc');
    const radius = bl.scenario === 'work' ? 1.3 : (bl.scenario === 'social' || bl.scenario === 'market' ? 1.8 : .85);
    const x = clamp(Number(loc.x) + Math.sin(t/37 + (h%360))*radius, 1, 99);
    const y = clamp(Number(loc.y) + Math.cos(t/43 + (h%271))*radius, 1, 99);
    return Object.assign({}, bl, {x,y});
  }

  function enrichSettlement(opts={}){
    B.normalizeState && B.normalizeState();
    (B.state?.locations||[]).forEach(enrichLocation);
    (B.state?.npcs||[]).forEach(enrichNpc);
    B.state.openTS2Adapter = B.state.openTS2Adapter || {
      enabled:true,
      adapterVersion:1,
      source:'OpenTS2-master browser adaptation',
      features:['motives','autonomy','wants-fears','memories','relationship scores','VM-style queues','object data','moving tokens']
    };
    return B.state;
  }

  function motiveHTML(npc){
    if(!npc) return '';
    enrichNpc(npc);
    const motives = motiveObj(npc);
    const rows = NEEDS.map(n=>{
      const v = Math.round(motives[n.key] ?? 50);
      return `<div class="motive-row ${qualityBand(v)}"><span>${B.escape(n.icon)} ${B.escape(n.label)}</span><div class="motive-track"><div class="motive-fill" style="width:${v}%"></div></div><b>${v}</b></div>`;
    }).join('');
    return `<section class="life-panel"><h4>OpenTS2-style motives</h4><div class="motive-grid">${rows}</div><div class="small">Mood: <b>${B.escape(npc.mood?.label||'steady')}</b> (${Math.round(npc.mood?.score??50)}) · ${B.escape(npc.mood?.thought||'')}</div></section>`;
  }

  function wantsHTML(npc){
    if(!npc) return '';
    enrichNpc(npc);
    const wants = (npc.wants||[]).slice(0,4).map(w=>`<li><b>${B.escape(w.text)}</b><div class="mini-progress"><span style="width:${Math.round(clamp(w.progress||0))}%"></span></div></li>`).join('');
    const fears = (npc.fears||[]).slice(0,3).map(f=>`<span class="tag rose">${B.escape(f.text)}</span>`).join('');
    const mems = (npc.memories||[]).slice(0,5).map(m=>`<li>${B.escape(new Date(m.at).toLocaleDateString())}: ${B.escape(m.text)}</li>`).join('');
    const action = npc.autonomy?.current;
    return `<section class="life-panel"><h4>Wants, fears, memories, autonomy</h4><div class="split-life"><div><b>Wants</b><ul class="want-list">${wants}</ul></div><div><b>Fears</b><div class="tags">${fears}</div></div></div>${action?`<div class="notice"><b>Autonomous queue:</b> ${B.escape(action.icon||'')} ${B.escape(action.label)} until ${B.escape(action.end)}.</div>`:''}<b>Recent memories</b><ul class="memory-list">${mems}</ul></section>`;
  }

  function simologyHTML(npc){
    if(!npc) return '';
    enrichNpc(npc);
    const p = npc.simology?.personality || {};
    const skills = npc.simology?.skills || {};
    const traits = PERSON_KEYS.map(k=>`<span class="tag">${B.escape(k)} ${Math.round(p[k]??0)}/10</span>`).join('');
    const skillTags = Object.entries(skills).map(([k,v])=>`<span class="tag green">${B.escape(k)} ${Math.round(v)}/10</span>`).join('');
    return `<section class="life-panel compact"><h4>Simology</h4><div class="small">Aspiration: <b>${B.escape(npc.aspiration)}</b> · score ${Math.round(npc.aspirationScore||0)} · entity ${B.escape(npc.openTS2?.entityId||'')}</div><div class="tags">${traits}</div><div class="tags">${skillTags}</div></section>`;
  }

  function relationshipHTML(npc){
    const rels = (npc?.relationships||[]).slice(0,8);
    if(!rels.length) return '';
    const rows = rels.map(r=>`<tr><td>${B.escape(r.npcName)}</td><td>${B.escape(r.type)}</td><td>${Math.round(r.shortTerm??r.strength??0)}</td><td>${Math.round(r.longTerm??r.strength??0)}</td><td>${B.escape(r.daily||'steady')}</td></tr>`).join('');
    return `<section class="life-panel compact"><h4>Relationship table</h4><div class="table-wrap"><table><thead><tr><th>Person</th><th>Bond</th><th>Short</th><th>Long</th><th>Daily</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
  }

  function lifeSimHTML(npc, opts={}){
    if(!npc) return '';
    return motiveHTML(npc) + wantsHTML(npc) + (opts.full ? simologyHTML(npc) + relationshipHTML(npc) : '');
  }

  function locationLifeHTML(loc){
    if(!loc) return '';
    enrichLocation(loc);
    const tags = (loc.affordances||[]).map(x=>`<span class="tag green">${B.escape(x)}</span>`).join('');
    const obj = loc.simObjectData || {};
    return `<h4>OpenTS2-style advertised interactions</h4><div class="tags">${tags || '<span class="tag">none inferred</span>'}</div><div class="small">Object ${B.escape(obj.objectId||'')} · room ${B.escape(obj.room||'')}</div>`;
  }

  function afterTick(){
    const now = Date.now();
    if(!B.OpenTS2._dirty) return;
    if(!B.OpenTS2._lastAutoSave || now - B.OpenTS2._lastAutoSave > 45000){
      B.OpenTS2._lastAutoSave = now;
      try{
        if(B.state) localStorage.setItem(B.key, JSON.stringify(B.state));
        B.OpenTS2._dirty = false;
      }catch(e){ console.warn('OpenTS2 adapter autosave failed', e); }
    }
  }

  B.OpenTS2 = Object.assign(B.OpenTS2 || {}, {
    NEEDS,
    INTERACTIONS,
    enrichNpc,
    enrichLocation,
    enrichSettlement,
    resolveAction,
    lifeSimHTML,
    locationLifeHTML,
    _dirty:false,
    _lastAutoSave:0
  });

  const baseNormalize = B.normalizeState;
  if(baseNormalize && !B._openTS2NormalizeWrapped){
    B.normalizeState = function(){
      const result = baseNormalize.apply(B, arguments);
      if(B.state){
        B.state.locations = B.state.locations || [];
        B.state.npcs = B.state.npcs || [];
        B.state.openTS2Adapter = B.state.openTS2Adapter || {enabled:true, adapterVersion:1};
      }
      return result;
    };
    B._openTS2NormalizeWrapped = true;
  }

  const baseLoad = B.load;
  if(baseLoad && !B._openTS2LoadWrapped){
    B.load = function(){
      const result = baseLoad.apply(B, arguments);
      if(result?.npcs?.length || result?.locations?.length) enrichSettlement({onlyMissing:true});
      return result;
    };
    B._openTS2LoadWrapped = true;
  }

  const baseImport = B.importJSONFile;
  if(baseImport && !B._openTS2ImportWrapped){
    B.importJSONFile = function(file){
      return baseImport.call(B, file).then(state=>{
        enrichSettlement({onlyMissing:true});
        B.save();
        return state;
      });
    };
    B._openTS2ImportWrapped = true;
  }

  const baseGenerateLocations = B.generateLocations;
  if(baseGenerateLocations && !B._openTS2GenerateLocationsWrapped){
    B.generateLocations = function(){
      const result = baseGenerateLocations.apply(B, arguments);
      (B.state?.locations||[]).forEach(enrichLocation);
      B.log && B.log('Applied OpenTS2-style advertised interactions to locations.');
      B.save && B.save();
      return result;
    };
    B._openTS2GenerateLocationsWrapped = true;
  }

  const baseGenerateNpcs = B.generateNpcs;
  if(baseGenerateNpcs && !B._openTS2GenerateNpcsWrapped){
    B.generateNpcs = function(count){
      const result = baseGenerateNpcs.call(B, count);
      enrichSettlement();
      B.log && B.log('Applied OpenTS2-style motives, wants, fears, memories, autonomy, queues, and relationship scores.');
      B.save && B.save();
      return result;
    };
    B._openTS2GenerateNpcsWrapped = true;
  }

  const baseActiveBlock = B.activeBlock;
  if(baseActiveBlock && !B._openTS2ActiveWrapped){
    B.activeBlock = function(npc, date=B.currentDate()){
      if(!npc) return {scenario:'unknown',label:'no NPC selected',locationName:'',locationId:'',icon:'',x:50,y:50};
      const base = baseActiveBlock.call(B, npc, date);
      return resolveAction(npc, date, base);
    };
    B._openTS2ActiveWrapped = true;
  }

  const baseNpcPosition = B.npcPosition;
  if(baseNpcPosition && !B._openTS2PositionWrapped){
    B.npcPosition = function(npc, date=B.currentDate()){
      if(!npc) return {scenario:'unknown',label:'no NPC selected',locationName:'',locationId:'',icon:'',x:50,y:50};
      return positionFor(npc, date, baseNpcPosition);
    };
    B._openTS2PositionWrapped = true;
  }

  const baseUpdateCurrents = B.updateNpcCurrents;
  if(baseUpdateCurrents && !B._openTS2UpdateWrapped){
    B.updateNpcCurrents = function(){
      const result = baseUpdateCurrents.apply(B, arguments);
      afterTick();
      return result;
    };
    B._openTS2UpdateWrapped = true;
  }

})();
