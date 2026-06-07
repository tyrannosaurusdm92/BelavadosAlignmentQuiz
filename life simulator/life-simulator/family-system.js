
(function(){
  'use strict';
  const LS = window.LifeSim;
  LS.generateHouseholds = (npcs, locations, config) => {
    const groups = new Map();
    npcs.forEach(n=>{
      const key = n.residenceId || 'unassigned';
      if(!groups.has(key)) groups.set(key, []);
      groups.get(key).push(n);
    });
    const households = [];
    groups.forEach((members, locId)=>{
      if(!members.length) return;
      const location = locations.find(l=>l.id===locId) || {name:'Unassigned Housing'};
      const name = `${LS.choose(['Household','Kinship','Ledger','Hearth','Rooming Circle','Chosen Family'])} of ${members[0].name.split(' ').slice(-1)[0]}`;
      members.forEach(m=>{ m.householdId = LS.uid('hhmark'); m.householdName = name; });
      households.push({
        id: LS.uid('hh'), name, residenceId: locId, residenceName: location.name, style: config.householdStyle,
        members: members.map(m=>({id:m.id, name:m.name, role:LS.choose(['household anchor','dependent','roommate','relative','guest','caretaker','partner','apprentice lodger'])})),
        dynamic: LS.choose(['warm but crowded','politely tense','deeply loyal','publicly respectable, privately complicated','chosen-family supportive','economically fragile','kept together by secrets']),
        secret: LS.choose(['one member is missing from official records','the household shelters a fugitive','a marriage contract is contested','a hidden inheritance affects them','a faction watches their mail'])
      });
    });
    return households;
  };
})();
