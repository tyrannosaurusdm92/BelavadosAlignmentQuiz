
(function(){
  'use strict';
  const LS = window.LifeSim;
  const familial = ['parent','child','sibling','grandparent','grandchild','cousin',"parent’s sibling","sibling’s child",'half-sibling','step-parent','step-child','step-sibling','adoptive parent','adoptive child','foster parent','foster child','guardian','ward','extended family member'];
  const personal = ['friend','rival','trusted regular','neighbor','old traveling companion','secret keeper','debtor','benefactor','drinking companion','study partner'];
  const professional = ['coworker','mentor','apprentice','business partner','guild sponsor','client','supplier','supervisor','competitor','faction contact'];
  const romantic = ['poly dating','mono dating','poly engaged','mono engaged','poly married','mono married','separated','divorced','widowed','ex partner','ex spouse'];
  const densityMap = {light:2, standard:4, dense:6, veryDense:9};
  LS.addRelation = (from, to, category, type, history, config) => {
    if(!from || !to || from.id === to.id) return null;
    const rel = {id:LS.uid('rel'), fromId:from.id, fromName:from.name, toId:to.id, toName:to.name, category, type, history};
    from.relationships = from.relationships || [];
    from.relationships.push({id:rel.id, npcId:to.id, npcName:to.name, category, type, history});
    return rel;
  };
  LS.generateRelationships = (npcs, config) => {
    const rels = [];
    const per = densityMap[config.socialDensity] || 4;
    for(const npc of npcs){
      const possible = LS.shuffle(npcs.filter(n=>n.id!==npc.id));
      const count = Math.min(possible.length, Math.floor(per/2 + LS.rng()*per));
      for(let i=0;i<count;i++){
        const other = possible[i];
        let category = LS.choose(['personal','professional','familial','personal','professional']);
        if(config.includePoly && LS.rng()<.14) category = 'romantic';
        let type = category === 'familial' ? LS.choose(familial) : category === 'professional' ? LS.choose(professional) : category === 'romantic' ? LS.choose(romantic) : LS.choose(personal);
        if(config.includeLayered && LS.rng()<.16){ type += ' + ' + LS.choose(category === 'familial' ? professional : personal); }
        const history = LS.choose([
          'They trust each other because of a past crisis.', 'Their connection is useful but tense.', 'A secret favor binds them together.', 'They disagree about faction loyalty.', 'A family obligation keeps them in contact.', 'They share a route, workplace, or household pressure.', 'They are warmer in private than in public.'
        ]);
        const rel = LS.addRelation(npc, other, category, type, history, config);
        if(rel) rels.push(rel);
        if(category === 'familial' || category === 'romantic'){
          const mirrorType = category === 'familial' ? LS.choose(familial) : type;
          const mirror = LS.addRelation(other, npc, category, mirrorType, 'Mirror tie: ' + history, config);
          if(mirror) rels.push(mirror);
        }
      }
    }
    return rels;
  };
})();
