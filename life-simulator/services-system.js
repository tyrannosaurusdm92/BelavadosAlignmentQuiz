
(function(){
  'use strict';
  const LS = window.LifeSim;
  const categoryKeywords = [
    ['Food, Drink, and Hospitality', /tavern|inn|hostel|hotel|restaurant|cook|tea|coffee|bakery|food|market|kitchen|ale|beer|wine|cafe/i],
    ['Retail and Household Goods', /store|market|provision|furniture|cloth|tailor|jewel|pawn|home|general|bazaar|arcade/i],
    ['Crafting and Industry', /blacksmith|forge|foundry|workshop|armory|weapon|leather|saddler|glass|clockwork|boiler|engine|cartwright|repair/i],
    ['Magic, Religion, and Lore', /temple|shrine|monastery|cathedral|wizard|scroll|magic|archive|library|academy|university|divine|cult|lore|spell/i],
    ['Health, Alchemy, and Apothecary', /hospital|healer|clinic|apothecary|alchemy|chirurgeon|sanitarium|medicine|potion|dentist/i],
    ['Transit and Logistics', /dock|harbor|ferry|steamship|submarine|rail|caravan|freight|portal|station|transit|warehouse|customs|rookery|skyship/i],
    ['Civic, Law, and Administration', /hall|court|guard|peacekeeper|jail|prison|ministry|permit|registry|government|office|barracks|tax|public works/i],
    ['Agriculture, Animals, and Wilderness', /farm|orchard|ranch|stable|kennel|animal|feed|greenhouse|garden|park|hunting|fishing|herbalist|forest|grove/i],
    ['Entertainment, Vice, and Lawless Areas', /theater|opera|casino|gaming|gambling|red-lantern|black market|smuggler|pirate|vice|lawless/i],
    ['Ruins, Hazards, and Adventure Sites', /ruin|sewer|undercity|hazard|storm shelter|grave|necropolis|vault|prison rumor|divine prison/i]
  ];
  LS.categorizeLocation = (name='') => {
    const hit = categoryKeywords.find(([cat,rx]) => rx.test(name));
    return hit ? hit[0] : 'Retail and Household Goods';
  };
  LS.generateServiceItems = (location, config, count=5) => {
    const servicePool = LS.data.locations.serviceItems || [];
    const category = location.category || LS.categorizeLocation(location.type || location.name);
    const terms = category.toLowerCase().split(/[^a-z]+/).filter(x=>x.length>3);
    let pool = servicePool.filter(item => {
      const hay = `${item.section||''} ${item.place||''} ${item.use||''}`.toLowerCase();
      return terms.some(t => hay.includes(t));
    });
    if(config?.settlementSize){
      const sized = pool.filter(x => x.size === config.settlementSize);
      if(sized.length > 8) pool = sized;
    }
    if(!pool.length) pool = servicePool.slice(0,900);
    const items = LS.shuffle(pool).slice(0, count).map(item => ({
      id: LS.uid('svc'), item: item.item || 'Local service', price: item.price || 'varies', place: item.place || location.name, use: item.use || item.section || 'Campaign utility', section: item.section || category
    }));
    if(!items.length){
      items.push({id:LS.uid('svc'), item:'Local consultation', price:'1 sp to 5 gp', place:location.name, use:'Useful local service', section:category});
    }
    return items;
  };
  LS.flattenServices = () => {
    const out = [];
    (LS.state.locations||[]).forEach(l => (l.services||[]).forEach(s => out.push(Object.assign({locationId:l.id, locationName:l.name, category:l.category}, s))));
    LS.state.services = out;
    return out;
  };
})();
