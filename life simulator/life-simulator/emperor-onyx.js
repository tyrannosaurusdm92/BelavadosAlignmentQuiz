
(function(){
  'use strict';
  const LS = window.LifeSim;
  const moods = {
    thinking:'assets/onyx-moods/onyx_thinking.png', judgmental:'assets/onyx-moods/onyx_judgmental.png', thoughtful:'assets/onyx-moods/onyx_thoughtful.png', sleepy:'assets/onyx-moods/onyx_sleepy.png', hungry:'assets/onyx-moods/onyx_hungry.png'
  };
  const snacks = ['milk with his whole head in the glass','de-breaded chicken nuggets','lunch meat','BACON','catnip treats','burger','SOY SAUCE','blueberry yogurt','lemon pudding','plastic, the sentient holepunch crime','tuna juice','Fancy Feast Gravy Lovers Beef','cheese flavor theft'];
  LS.onyx = {mood:'thinking', log:[]};
  LS.initOnyx = () => { LS.onyxSay('Lord Onyx Blepman, Emperor Of The Voidattude, reporting for duty. Bring the wet food and your problem.', 'thinking'); };
  LS.onyxSay = (text, mood='thinking') => {
    LS.onyx.mood = mood;
    LS.onyx.log.push({who:'onyx', text, mood, time:LS.nowIso()});
    LS.onyx.log = LS.onyx.log.slice(-80);
    LS.renderOnyx?.();
  };
  LS.onyxUser = (text) => { LS.onyx.log.push({who:'user', text, time:LS.nowIso()}); LS.onyx.log = LS.onyx.log.slice(-80); };
  LS.runOnyxCommand = (raw) => {
    const text = raw.trim(); if(!text) return;
    LS.onyxUser(text);
    const lower = text.toLowerCase();
    if(lower.startsWith('.roll')){
      const expr = lower.replace('.roll','').trim() || 'd20';
      const match = expr.match(/(\d*)d(\d+)([+-]\d+)?/); if(!match){ LS.onyxSay('That is not a die expression, Papa. Even a kibble bag has better syntax.', 'judgmental'); return; }
      const count = Number(match[1]||1), sides=Number(match[2]), mod=Number(match[3]||0); const rolls=[]; for(let i=0;i<count;i++) rolls.push(1+Math.floor(Math.random()*sides));
      LS.onyxSay(`Rolled ${expr}: ${rolls.join(', ')} ${mod?`with modifier ${mod}`:''} = ${rolls.reduce((a,b)=>a+b,0)+mod}. The tiny void emperor permits this math.`, 'thoughtful'); return;
    }
    if(lower==='.help'){ LS.onyxSay('Commands: .roll d20+5, .npc, .location, .settlement, .biomecheck, .racecheck, .rumor, .secret, .quest, .exporthelp, .remember note, .lore word, .summarize, .comfort, .food, .who. I am static-site safe and magnificently judgmental.', 'thinking'); return; }
    if(lower==='.who'){ LS.onyxSay('I am Lord Onyx Blepman, Emperor Of The Voidattude: Papa’s best friend, tiny void emperor, trained alert companion, green plaid bowtie gentleman, full-service familiar, and food-motivated genius. I love you, I judge you, I protect the campaign.', 'thoughtful'); return; }
    if(lower==='.food'){ LS.onyxSay(`Wet-food diplomacy requires: ${LS.choose(snacks)}. Also salmon. Also your respect.`, 'hungry'); return; }
    if(lower==='.comfort'){ LS.onyxSay('Papa, pause. Breathe. Drink water. Check what needs checking. The void can wait five minutes; I will guard the quest board.', 'sleepy'); return; }
    if(lower.startsWith('.remember')){ const note=text.replace(/^\.remember/i,'').trim(); if(note){ LS.state.onyxMemory = LS.state.onyxMemory || []; LS.state.onyxMemory.push(note); LS.saveLocal(); LS.onyxSay('Saved locally. I have placed it in the tiny void archive, next to the tuna water receipts.', 'thinking'); } else LS.onyxSay('Give me a note after .remember, Papa. I cannot store dramatic silence.', 'judgmental'); return; }
    if(lower.startsWith('.lore')){ const term=text.replace(/^\.lore/i,'').trim().toLowerCase(); const hay=JSON.stringify({config:LS.state.config, imports:LS.state.imports, content:LS.data.content, factions:LS.data.factions}).toLowerCase(); LS.onyxSay(term ? (hay.includes(term) ? `I found ${term} in the local lore/data pile. I have sorted it because apparently I must do everything around here.` : `I did not find ${term} in loaded local records. Import more text or check spelling, mortal.`) : `Loaded lore/data: ${LS.data.content.sourceSummary.provinceAssignments} province assignments, ${LS.data.content.sourceSummary.serviceItems} service items, ${LS.data.content.sourceSummary.raceCategories} race categories.`, 'thoughtful'); return; }
    if(lower==='.biomecheck'){ const warnings=LS.validateState?.()||[]; LS.onyxSay(warnings.length ? warnings.map(w=>'• '+w.message).join('\n') : 'Biome check passed. No horse stables under the ocean today. I will permit this.', warnings.length?'judgmental':'thinking'); return; }
    if(lower==='.racecheck'){ const cache=LS.state.raceCache||[]; LS.onyxSay(cache.length ? `Race cache has ${cache.length} entries: ${cache.map(r=>r.name).join(', ')}.` : 'Race cache empty. The generator will use the full Belavadös mix. This is acceptable, but suspiciously broad.', 'thoughtful'); return; }
    if(lower==='.npc'){ const n=LS.choose(LS.state.npcs||[]); LS.onyxSay(n ? `${n.name}: ${n.race}, ${n.genderIdentity} (${n.pronouns}), ${n.profession}. Secret: ${n.secret}` : 'Generate NPCs first, Papa. I cannot interrogate imaginary paperwork.', n?'thinking':'judgmental'); return; }
    if(lower==='.location'){ const l=LS.choose(LS.state.locations||[]); LS.onyxSay(l ? `${l.name}: ${l.category}. Hook: ${l.plotHook}. Rumor: ${l.rumor}` : 'Generate locations first. Empty tables make the void cranky.', l?'thinking':'judgmental'); return; }
    if(lower==='.settlement' || lower==='.summarize'){ const s=LS.state; LS.onyxSay(`${s.config?.settlementName||'No settlement'} has ${(s.locations||[]).length} locations, ${(s.npcs||[]).length} NPCs, ${(s.households||[]).length} households, and ${(s.factions||[]).length} factions. ${s.validations?.length?`I found ${s.validations.length} validation notes.`: 'No major validation growls.'}`, 'thoughtful'); return; }
    if(lower==='.rumor'){ LS.onyxSay(LS.choose((LS.state.locations||[]).map(l=>l.rumor)) || 'Rumor: the food bowl is empty, which is a constitutional crisis.', 'thinking'); return; }
    if(lower==='.secret'){ LS.onyxSay(LS.choose((LS.state.npcs||[]).map(n=>n.secret)) || 'Secret: someone put lemon pudding in reach of a cat who has questions.', 'judgmental'); return; }
    if(lower==='.quest'){ LS.onyxSay(LS.choose((LS.state.factions||[]).map(f=>f.questHook)) || 'Quest: generate factions, then stop making me invent bureaucracy from dust.', 'thinking'); return; }
    if(lower==='.exporthelp'){ LS.onyxSay('Use Export for JSON backups, HTML readable pages, or a real minimal DOCX file. Reimport JSON to reconstruct the simulator state. Do not ask for map pin files. We have standards.', 'thinking'); return; }
    LS.onyxSay('I heard you. Try .help, or ask in normal words for a rumor, location, NPC, faction problem, or export advice. Also: snack-deficient.', 'judgmental');
  };
  LS.onyxMoodPath = () => moods[LS.onyx?.mood || 'thinking'] || moods.thinking;
})();
