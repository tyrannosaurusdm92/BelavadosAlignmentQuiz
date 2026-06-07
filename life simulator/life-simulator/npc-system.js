
(function(){
  'use strict';
  const LS = window.LifeSim;
  const given = ['Aelwyn','Maelis','Orivar','Thalara','Nym','Veyra','Korun','Sable','Mira','Dorn','Vaelis','Liora','Tessan','Brindle','Eldra','Solune','Rook','Cyran','Myra','Qel','Ashen','Ilyra','Morrow','Fen','Vasha','Oryn','Nyx','Cael','Ysolde','Garrin','Thorne','Elun','Pax','Jora','Merrow','Tide','Vale','Nara','Skarn','Luma'];
  const family = ['Vaelthorne','Mornriver','Ashbarrow','Tideglass','Copperroot','Moonledger','Duskrail','Lanternmere','Stormwright','Silverscale','Grimvalen','Reefbinder','Hearthlock','Starvane','Underbough','Fennelgate','Kettlewick','Dawnmarrow','Blackquill','Sablepass'];
  const identities = ['cis-male','cis-female','demi-male','demi-female','non-binary','trans-male','trans-female','gender-fluid','agender','gender-less','gender-flexible','bi-gender','poly-gender','neutrois'];
  const pronouns = {'cis-male':'he/him','cis-female':'she/her','demi-male':'he/they','demi-female':'she/they','non-binary':'they/them','trans-male':'he/him','trans-female':'she/her','gender-fluid':'they/she/he','agender':'they/them','gender-less':'they/them','gender-flexible':'they/any','bi-gender':'she/he/they','poly-gender':'they/any','neutrois':'they/them'};
  const traits = ['observant','food-motivated','soft-spoken','dramatic','guild-loyal','secretive','reckless','scholarly','protective','flirtatious','haunted','generous','law-minded','stubborn','curious','ritualistic','crafty','storm-calm','romantic','rivalrous','patient','judgmental','practical','moon-touched'];
  const goals = ['earn a guild charter','hide an old family debt','protect a younger relative','buy a safer home','expose a corrupt official','join a transit compact','restore a shrine','solve a disappearance','smuggle medicine for good reasons','marry without faction interference','break a curse','win back public trust'];
  const motivations = ['family safety','status','faith','curiosity','survival','justice','comfort','revenge','love','professional pride','freedom','atonement'];
  const lifeStages = ['young adult','adult','middle-aged','elder','ancient-blooded adult'];
  LS.makeName = () => `${LS.choose(given)} ${LS.choose(family)}`;
  LS.pickRaceForNPC = (config) => {
    const cache = config.raceCache && config.raceCache.length ? config.raceCache : null;
    if(cache) return LS.weightedPick(cache, 'weight');
    const cats = LS.data.races.raceCategories || [];
    const cat = LS.choose(cats);
    const opt = LS.choose(cat?.options || []);
    return {name: opt?.name || 'Human', category: cat?.category || '', creator: opt?.creator || cat?.god || '', habitats: opt?.habitats || []};
  };
  LS.alignmentProfile = (config, race) => {
    const base = 1500;
    const danger = {Low:80, Moderate:160, High:260, Severe:390, Lawless:520}[config.dangerLevel] || 160;
    const lawfulBias = /council|charter|bureaucracy|temple/i.test(config.government) ? 220 : /criminal|lawless/i.test(config.government) ? -360 : 0;
    const coopBias = /cooperative|mixed|hospitality|harbor/i.test(config.economy) ? 160 : 0;
    const honorBias = /guild|temple|clan/i.test(config.government) ? 140 : 0;
    const axes = {
      altruism: LS.snap250(LS.clamp(base + (LS.rng()-.5)*900 - danger/5, 0, 3000)),
      lawfulness: LS.snap250(LS.clamp(base + (LS.rng()-.5)*900 + lawfulBias, 0, 3000)),
      cooperation: LS.snap250(LS.clamp(base + (LS.rng()-.5)*900 + coopBias, 0, 3000)),
      honor: LS.snap250(LS.clamp(base + (LS.rng()-.5)*900 + honorBias, 0, 3000))
    };
    return Object.fromEntries(Object.entries(axes).map(([k,score])=>[k,{score,label:k[0].toUpperCase()+k.slice(1),descriptor:LS.axisDescriptor(score),phase:LS.axisDescriptor(score)}]));
  };
  LS.professionFromLocation = (loc) => {
    const map = [
      [/tavern|inn|hotel|restaurant|food/i,['innkeeper','cook','server','hostler','cellar clerk']],
      [/temple|shrine|cathedral|monastery/i,['priest','shrine keeper','ritual aide','pilgrim host','omen scribe']],
      [/blacksmith|forge|foundry|workshop|clockwork/i,['smith','boilerwright','apprentice maker','toolwright','inspection clerk']],
      [/hospital|healer|clinic|apothecary|alchemy/i,['healer','apothecary','chirurgeon','potion clerk','triage aide']],
      [/rail|ferry|dock|steamship|submarine|caravan|portal|station/i,['route clerk','pilot','porter','ticket warden','engine tender']],
      [/court|guard|peacekeeper|registry|office|hall/i,['clerk','peacekeeper','magistrate aide','records keeper','permit officer']],
      [/market|store|bazaar|tailor|jewel|furniture/i,['merchant','counter clerk','appraiser','buyer','shop steward']],
      [/library|academy|university|archive|wizard|scroll/i,['scribe','librarian','student','lecturer','spell registrar']]
    ];
    const hit = map.find(([rx])=>rx.test(`${loc?.name||''} ${loc?.type||''}`));
    return LS.choose(hit ? hit[1] : ['laborer','guide','messenger','craftsperson','watcher','broker','caretaker']);
  };
  LS.generateNPCs = (config, locations) => {
    const locs = locations && locations.length ? locations : [{id:'none', name:'temporary camp', category:'Civic, Law, and Administration', type:'camp'}];
    const housing = locs.filter(l=>/house|apartment|boarding|tenement|rowhouse|loft|residence|hostel|inn/i.test(`${l.name} ${l.type}`));
    const workLocs = locs.filter(l=>!housing.includes(l));
    const npcs = [];
    const used = new Set();
    for(let i=0;i<config.npcCount;i++){
      let name = LS.makeName(), n=2;
      while(used.has(name)){ name = `${LS.makeName()} ${n++}`; }
      used.add(name);
      const race = LS.pickRaceForNPC(config);
      const genderIdentity = LS.choose(identities);
      const home = LS.choose(housing.length ? housing : locs);
      const work = LS.choose(workLocs.length ? workLocs : locs);
      const visits = LS.shuffle(locs).slice(0, Math.floor(2+LS.rng()*4));
      const npc = {
        id: LS.uid('npc'), name, age: Math.floor(18 + LS.rng()*72), lifeStage: LS.choose(lifeStages),
        race: race.name || race, raceCategory: race.category || '', lineage: race.parent || '', creator: race.creator || '',
        genderIdentity, pronouns: pronouns[genderIdentity] || 'they/them',
        profession: LS.professionFromLocation(work), workplaceRole: LS.choose(['owner','employee','apprentice','manager','contractor','regular specialist','unpaid family helper']),
        residence: home?.name || 'unassigned residence', residenceId: home?.id || '', workplace: work?.name || 'unassigned workplace', workplaceId: work?.id || '',
        visitLocationNames: visits.map(v=>v.name), visitLocationIds: visits.map(v=>v.id),
        traits: LS.shuffle(traits).slice(0,3), goals: [LS.choose(goals)], motivations: LS.shuffle(motivations).slice(0,2),
        biography: `${name} is a ${LS.choose(traits)} ${race.name || race} ${LS.professionFromLocation(work)} whose life connects ${home?.name || 'home'} to ${work?.name || 'work'}.`,
        secret: LS.choose(['owes a favor to a rival faction','keeps a hidden shrine token','knows a route under the old district','uses a false surname in one ledger','protects someone accused of a crime','has an inherited key with no known lock']),
        rumor: LS.choose(['never pays with the same coin twice','was seen near the archive after midnight','argued with a guild officer','saved a stranger during a storm','receives letters sealed in black wax','knows more about the moons than they admit']),
        alignment: {axes: LS.alignmentProfile(config, race)}, relationships: []
      };
      npcs.push(npc);
    }
    const byId = Object.fromEntries(locs.map(l=>[l.id,l]));
    npcs.forEach(n=>{
      byId[n.residenceId]?.residents?.push(n.id);
      byId[n.workplaceId]?.employees?.push(n.id);
      n.visitLocationIds.forEach(id=>byId[id]?.visitors?.push(n.id));
    });
    return npcs;
  };
})();
