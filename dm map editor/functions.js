
/* Belavadös patch: reliable province saving, valid ZIP export, and stricter tundra/ice terrain rules. */
(function(){
  if(window.__belavadosProvinceSaveZipTerrainRepair) return;
  window.__belavadosProvinceSaveZipTerrainRepair = true;

  function byId(id){ return document.getElementById(id); }
  function asText(v){ return String(v == null ? '' : v); }
  function bytesFrom(value){
    if(value instanceof Uint8Array) return value;
    if(value instanceof ArrayBuffer) return new Uint8Array(value);
    if(Array.isArray(value)) return new Uint8Array(value);
    if(typeof value === 'string') return new TextEncoder().encode(value);
    return new TextEncoder().encode(asText(value));
  }
  function dosTimeDate(d){
    d = d || new Date();
    const time = (d.getHours() << 11) | (d.getMinutes() << 5) | Math.floor(d.getSeconds()/2);
    const date = ((d.getFullYear()-1980) << 9) | ((d.getMonth()+1) << 5) | d.getDate();
    return {time: time & 0xffff, date: date & 0xffff};
  }
  const CRC_TABLE = (()=>{
    const table = new Uint32Array(256);
    for(let n=0;n<256;n++){
      let c=n;
      for(let k=0;k<8;k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      table[n]=c>>>0;
    }
    return table;
  })();
  function crcBytes(bytes){
    let c = 0xffffffff;
    for(let i=0;i<bytes.length;i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }
  function push16(out,n){ out.push(n & 255, (n>>>8)&255); }
  function push32(out,n){ out.push(n & 255, (n>>>8)&255, (n>>>16)&255, (n>>>24)&255); }
  function pushBytes(out,bytes){ for(let i=0;i<bytes.length;i++) out.push(bytes[i]); }

  window.makeZip = makeZip = function(files){
    const local = [], central = [];
    let offset = 0;
    const stamp = dosTimeDate(new Date());
    (files||[]).forEach(file=>{
      const name = asText(file.name || 'untitled.txt').replace(/^\/+/, '');
      const nameBytes = new TextEncoder().encode(name);
      const dataBytes = bytesFrom(file.content);
      const crc = crcBytes(dataBytes);
      const localStart = offset;
      // Local file header
      pushBytes(local, [0x50,0x4b,0x03,0x04]);
      push16(local, 20);          // version needed
      push16(local, 0x0800);      // UTF-8 filenames
      push16(local, 0);           // stored, no compression
      push16(local, stamp.time);  // mod time
      push16(local, stamp.date);  // mod date
      push32(local, crc);
      push32(local, dataBytes.length);
      push32(local, dataBytes.length);
      push16(local, nameBytes.length);
      push16(local, 0);
      pushBytes(local, nameBytes);
      pushBytes(local, dataBytes);
      offset = local.length;
      // Central directory header
      pushBytes(central, [0x50,0x4b,0x01,0x02]);
      push16(central, 20);        // version made by
      push16(central, 20);        // version needed
      push16(central, 0x0800);    // UTF-8 filenames
      push16(central, 0);         // stored
      push16(central, stamp.time);
      push16(central, stamp.date);
      push32(central, crc);
      push32(central, dataBytes.length);
      push32(central, dataBytes.length);
      push16(central, nameBytes.length);
      push16(central, 0);         // extra length
      push16(central, 0);         // comment length
      push16(central, 0);         // disk start
      push16(central, 0);         // internal attrs
      push32(central, 0);         // external attrs
      push32(central, localStart);
      pushBytes(central, nameBytes);
    });
    const out = local.concat(central);
    pushBytes(out, [0x50,0x4b,0x05,0x06]);
    push16(out, 0);
    push16(out, 0);
    push16(out, (files||[]).length);
    push16(out, (files||[]).length);
    push32(out, central.length);
    push32(out, local.length);
    push16(out, 0);
    return new Uint8Array(out);
  };

  window.download = download = function(name, content, type='application/octet-stream'){
    const blobContent = content instanceof Uint8Array || content instanceof ArrayBuffer ? [content] : [asText(content)];
    const a=document.createElement('a');
    a.href=URL.createObjectURL(new Blob(blobContent,{type}));
    a.download=name;
    document.body.append(a);
    a.click();
    setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},500);
  };

  window.saveProvince = saveProvince = function(){
    const p = (typeof current === 'function') ? current() : null;
    if(!p){ alert('No province is selected.'); return; }
    try{
      if(typeof scanProvinceTerrain === 'function' && flatPixels) scanProvinceTerrain(p,{silent:true});
    }catch(e){ console.warn('Province terrain scan could not run during save:', e); }
    const c = (typeof xyToLatLon === 'function') ? xyToLatLon(p.pin.x,p.pin.y) : {lat:p.lat,lon:p.lon};
    p.centerLatitude = +Number(c.lat || 0).toFixed(6);
    p.centerLongitude = +Number(c.lon || 0).toFixed(6);
    p.savedAt = new Date().toISOString();
    if(typeof serialize === 'function'){
      const serialized = serialize();
      const dataBox = byId('dataBox');
      if(dataBox) dataBox.value = JSON.stringify(serialized,null,2);
      try{ localStorage.setItem('BelavadosMapDM_Autosave', JSON.stringify(serialized)); }catch(e){ console.warn('Autosave failed:', e); }
    }
    if(typeof updateStats === 'function') updateStats();
    if(typeof drawMap === 'function') drawMap();
    alert('Province saved to this browser session and autosave data. Use Export JSON of All Site Data or Export Province Information ZIP to download it.');
  };

  function ensureSaveProvinceButton(){
    let btn = byId('saveProvince');
    if(!btn){
      const anchor = byId('resetSelectedBorder');
      if(anchor && anchor.parentElement){
        btn = document.createElement('button');
        btn.id = 'saveProvince';
        btn.className = 'primary wide';
        btn.textContent = 'Save Province';
        anchor.insertAdjacentElement('afterend', btn);
      }
    }
    if(btn) btn.onclick = saveProvince;
  }

  const originalSaveSettlementEditor = window.saveSettlementEditor || (typeof saveSettlementEditor === 'function' ? saveSettlementEditor : null);
  window.saveSettlementEditor = saveSettlementEditor = function(){
    const p = (typeof current === 'function') ? current() : null;
    const s = p && p.settlements ? p.settlements[selectedSettlementIndex] : null;
    if(!s){ alert('Select a settlement pin before saving.'); return; }
    const tags = (typeof selectedChecks === 'function') ? selectedChecks('settlementTagsBox') : [];
    if(tags.length>4) alert('Only the first four settlement type tags were saved.');
    const get = id => byId(id);
    s.name = get('settlementName')?.value.trim() || s.name || 'Unnamed Settlement';
    s.pinType = get('settlementPinType')?.value || s.pinType || s.type || 'Village';
    s.type = s.pinType;
    s.externalLoreLink = get('settlementLoreLink')?.value.trim() || '';
    s.loreLink = s.externalLoreLink;
    s.link = s.externalLoreLink;
    s.htmlFileName = get('settlementHtmlFileName')?.value.trim() || (typeof settlementHtmlFileName === 'function' ? settlementHtmlFileName(p,s) : 'settlement.html');
    s.notes = get('settlementNotes')?.value.trim() || '';
    s.areaPercent = get('settlementAreaPercent')?.value || '';
    s.populationPercent = get('settlementPopulationPercent')?.value || '';
    s.raceCategories = (typeof selectedChecks === 'function') ? selectedChecks('raceCategoriesBox') : (s.raceCategories || []);
    s.races = (typeof unique === 'function' && typeof RACE_CATEGORY_DATA !== 'undefined') ? unique(s.raceCategories.flatMap(cat=>(RACE_CATEGORY_DATA.find(r=>r.label===cat)?.races)||[])) : (s.races || []);
    s.godsWorshipped = (typeof selectedChecks === 'function') ? selectedChecks('godsBox') : (s.godsWorshipped || []);
    s.gods = s.godsWorshipped;
    s.settlementTags = tags.slice(0,4);
    s.alignmentAxes = {
      altruism:get('settlementAltruism')?.value || 'Neutral',
      lawfulness:get('settlementLawfulness')?.value || 'Neutral',
      cooperation:get('settlementCooperation')?.value || 'Neutral',
      honor:get('settlementHonor')?.value || 'Neutral'
    };
    s.danger = get('settlementDanger')?.value || 'Neutral';
    s.transportation = (typeof selectedChecks === 'function') ? selectedChecks('transportationBox') : (s.transportation || []);
    try{
      if(typeof settlementGeneratedValues === 'function'){
        const g=settlementGeneratedValues(p,s);
        s.squareMiles=g.squareMiles;
        s.squareKilometers=g.squareKilometers;
        s.generatedPopulation=g.population;
        s.population=g.population || s.population || '';
      }
    }catch(e){ console.warn('Settlement generated values could not update:', e); }
    if(typeof xyToLatLon === 'function'){
      const ll=xyToLatLon(s.x,s.y); s.lat=ll.lat; s.lon=ll.lon;
    }
    s.savedAt = new Date().toISOString();
    try{ if(typeof serialize === 'function') localStorage.setItem('BelavadosMapDM_Autosave',JSON.stringify(serialize())); }catch(e){}
    if(typeof renderSettlementSelect === 'function') renderSettlementSelect();
    if(typeof updateStats === 'function') updateStats();
    if(typeof updateSettlementGeneratedReadout === 'function') updateSettlementGeneratedReadout();
    if(typeof drawMap === 'function') drawMap();
  };

  function waterishClass(type){ return type==='water' || type==='river' || type==='lake' || type==='reef'; }
  function landSupportClass(type){ return type==='mountain' || type==='hill' || type==='plateau' || type==='canyon'; }
  function deepSeaContext(x,y){
    if(typeof terrainPixel !== 'function' || typeof terrainHeuristic !== 'function') return false;
    let water=0, land=0, reef=0, samples=0;
    const offsets=[[-36,0],[36,0],[0,-36],[0,36],[-24,-24],[24,-24],[-24,24],[24,24],[-52,0],[52,0],[0,-52],[0,52]];
    for(const [dx,dy] of offsets){
      const pix=terrainPixel(x+dx,y+dy); if(!pix) continue;
      const c=terrainHeuristic(pix,x+dx,y+dy); if(!c) continue;
      samples++;
      if(waterishClass(c.type)) water++;
      if(c.type==='reef' || c.type==='coast') reef++;
      if(!waterishClass(c.type)) land++;
    }
    return samples >= 6 && water/samples >= .82 && land <= 1 && reef <= 1;
  }
  function mountaintopContext(x,y){
    if(typeof terrainPixel !== 'function' || typeof terrainHeuristic !== 'function' || typeof terrainLum !== 'function') return false;
    let support=0, samples=0, roughSum=0, lastLum=null;
    const offsets=[[0,0],[-18,0],[18,0],[0,-18],[0,18],[-28,-12],[28,-12],[-28,12],[28,12],[-42,0],[42,0],[0,-42],[0,42]];
    for(const [dx,dy] of offsets){
      const pix=terrainPixel(x+dx,y+dy); if(!pix) continue;
      const c=terrainHeuristic(pix,x+dx,y+dy); if(!c) continue;
      const lum=terrainLum(pix);
      if(lastLum !== null) roughSum += Math.abs(lum-lastLum);
      lastLum = lum;
      samples++;
      if(landSupportClass(c.type)) support++;
    }
    const rough = samples>1 ? roughSum/(samples-1) : 0;
    return samples >= 6 && support >= 3 && rough >= 7;
  }
  const originalTerrainClassify = window.terrainClassify || (typeof terrainClassify === 'function' ? terrainClassify : null);
  if(originalTerrainClassify){
    window.terrainClassify = terrainClassify = function(p,x,y,mode){
      let c = originalTerrainClassify(p,x,y,mode);
      if(c && (c.type === 'tundra' || c.type === 'snow')){
        if(mountaintopContext(x,y) || deepSeaContext(x,y)) return c;
        // Tundra/ice in Belavadös is not a general surface biome. Reclassify pale low-saturation pixels.
        const h = (typeof terrainHeuristic === 'function') ? terrainHeuristic(p,x,y) : null;
        if(h && h.type !== 'tundra' && h.type !== 'snow') return h;
        if(typeof terrainFind === 'function') return terrainFind('unknown');
      }
      return c;
    };
  }



  // Settlement Builder export content: appears only inside settlement HTML files generated by Export Province Information ZIP.
  function settlementBuilderSeedBullets(data){
    const tags = Array.isArray(data.settlementTypeTags) ? data.settlementTypeTags : [];
    const transport = Array.isArray(data.publicTransportation) ? data.publicTransportation : [];
    const races = Array.isArray(data.races) ? data.races : [];
    const gods = Array.isArray(data.godsWorshipped) ? data.godsWorshipped : [];
    const lowerTags = tags.map(t=>String(t).toLowerCase());
    const bullets = [];
    if(lowerTags.includes('farming') || lowerTags.includes('grassland') || lowerTags.includes('trade')) bullets.push('Farming, Grassland, and Trade tags seed markets, granaries, livestock pens, inns, caravan yards, crop disease hooks, landowner disputes, tax conflicts, seasonal labor, and food-supply leverage.');
    if(lowerTags.includes('deep mountain') || lowerTags.includes('mining') || lowerTags.includes('factories')) bullets.push('Deep Mountain, Mining, and Factories tags seed cargo lifts, furnaces, ore guilds, exploited labor, cave monsters, coal smoke, industrial accidents, union pressure, and rail or submarine supply chains when routes support them.');
    if(lowerTags.includes('coastal') || lowerTags.includes('dock') || lowerTags.includes('fishing') || lowerTags.includes('reef') || lowerTags.includes('deep sea')) bullets.push('Coastal, Dock, Fishing, Reef, and Deep Sea tags seed pressure-safe guest structures, tide markets, ferries, harbormasters, salvage claims, smuggling, sea-monster warnings, and goods suitable for wet or underwater travel.');
    if(lowerTags.includes('arcane') || lowerTags.includes('academic') || lowerTags.includes('religious')) bullets.push('Arcane, Academic, and Religious tags seed libraries, shrines, colleges, ritual services, relic disputes, forbidden research, cult pressure, doctrinal conflict, and magical public works.');
    if(lowerTags.includes('military') || lowerTags.includes('fortified') || lowerTags.includes('black market') || lowerTags.includes('slums')) bullets.push('Military, Fortified, Black Market, and Slums tags seed checkpoints, barracks, contraband brokers, protection rackets, curfews, informants, missing-person hooks, and class tension.');
    if(transport.length) bullets.push('Public transportation tags help place stations, docks, portals, skyship berths, rail platforms, caravan loading yards, fare offices, route delays, and transit-related rumors.');
    if(races.length || (data.raceCategories||[]).length) bullets.push('Race categories and inserted races create population texture, neighborhood identity, hiring patterns, political pressure, prejudice, alliances, and local conflict without requiring every resident to be typed manually.');
    if(gods.length) bullets.push('Primary gods worshipped seed temples, holidays, clergy, oath conflicts, faction legitimacy, forbidden rites, rival denominations, and religious-political tension.');
    bullets.push('Danger rating seeds encounter frequency, crime, faction pressure, supernatural corruption, industrial accidents, horror events, and how openly threats appear in public spaces.');
    return bullets;
  }
  function settlementBuilderSectionHtml(data){
    const tags = Array.isArray(data.settlementTypeTags) ? data.settlementTypeTags : [];
    const categories = Array.isArray(data.raceCategories) ? data.raceCategories : [];
    const races = Array.isArray(data.races) ? data.races : [];
    const gods = Array.isArray(data.godsWorshipped) ? data.godsWorshipped : [];
    const transport = Array.isArray(data.publicTransportation) ? data.publicTransportation : [];
    const seedBullets = settlementBuilderSeedBullets(data).map(b=>'<li>'+escapeHtml(b)+'</li>').join('');
    const tagBadges = tags.length ? tags.map(t=>'<span class="badge seed">'+escapeHtml(t)+'</span>').join('') : '<span class="badge seed">No settlement tags saved</span>';
    const categoryText = categories.length ? categories.join(', ') : 'No race categories saved';
    const raceText = races.length ? races.slice(0,60).join(', ')+(races.length>60?' …':'') : 'No inserted races saved';
    const godText = gods.length ? gods.join(', ') : 'No gods saved';
    const transportText = transport.length ? transport.join(', ') : 'No public transportation tags saved';
    return '<section class="builder-card"><h2>Settlement Builder Behavior and Fantasy Town Generator Inspiration</h2>'+
      '<p>The requested settlement builder should behave like a campaign-specific settlement generator layered onto the map. Fantasy Town Generator is a useful reference because it emphasizes interactive settlement maps, customizable generation, detailed buildings, people/NPCs, editable layouts, and living settlement simulation. In the Belavadös site, those ideas are adapted to settlement htmls rather than replacing the world map.</p>'+
      '<p>The settlement metadata should help populate shops, available resources, factions, religious presence, public transportation, threats, and dark fantasy/industrial hooks.</p>'+
      '<h3>Generator Seeds From This Settlement</h3><div class="seed-badges">'+tagBadges+'</div>'+
      '<dl class="builder-dl">'+fieldRows({'Race Categories':categoryText,'Inserted Races':raceText,'Primary Gods Worshipped':godText,'Danger Rating':data.dangerRating||'Neutral','Public Transportation':transportText})+'</dl>'+
      '<h3>How These Seeds Should Influence Play</h3><ul>'+seedBullets+'</ul>'+
      '<p class="reference-note"><strong>Reference consulted:</strong> Fantasy Town Generator describes interactive settlement maps, customizable generation, detailed buildings and people, editable settlements, and time simulation. URL: <a href="https://www.fantasytowngenerator.com/">https://www.fantasytowngenerator.com/</a></p>'+
      '</section>';
  }
  window.makeSettlementHtml = makeSettlementHtml = function(p,s){
    const data=settlementExportData(p,s);
    const lore=data.loreLink?'<a href="'+escapeHtml(data.loreLink)+'">'+escapeHtml(data.loreLink)+'</a>':'Unknown';
    const builderSection = settlementBuilderSectionHtml(data);
    return '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+escapeHtml(data.settlement)+'</title><style>body{font-family:system-ui;background:radial-gradient(circle at top,#153550,#07111d 62%);color:#edf8ff;margin:0;padding:24px}.card{max-width:980px;margin:auto;background:#0b1b2d;border:1px solid #65d8ff55;border-radius:18px;padding:22px;box-shadow:0 18px 40px #0008}h1{margin-top:0}dt{color:#9fc2d6;font-weight:800;margin-top:10px}dd{margin:2px 0 8px}.badge{display:inline-block;border:1px solid #65d8ff55;border-radius:999px;padding:4px 8px;margin:2px;background:#10283e}a{color:#6fffe9}pre{white-space:pre-wrap;background:#07111d;border:1px solid #65d8ff33;border-radius:12px;padding:12px;overflow:auto}.builder-card{margin-top:22px;padding:18px;border:1px solid #16e0c655;border-radius:16px;background:linear-gradient(180deg,#10283eaa,#07111daa)}.builder-card h2{margin:0 0 10px;color:#eaffff}.builder-card h3{margin:16px 0 8px;color:#bffcff}.builder-card p,.builder-card li{line-height:1.5;color:#d7f4ff}.builder-card ul{padding-left:20px}.builder-dl{display:grid;grid-template-columns:minmax(160px,240px) 1fr;gap:4px 12px}.builder-dl dt{margin-top:6px}.builder-dl dd{margin-top:6px}.badge.seed{border-color:#16e0c688;background:#07111d;color:#eaffff}.reference-note{border-top:1px solid #65d8ff33;margin-top:14px;padding-top:12px;color:#cdefff}</style></head><body><main class="card"><h1>'+escapeHtml(data.settlement)+'</h1><p class="badge">'+escapeHtml(data.province)+'</p><p class="badge">'+escapeHtml(data.settlementType)+'</p><p class="badge">Pin '+escapeHtml(data.pinColor)+'</p><dl>'+fieldRows({'Lore Link':lore,'Population':data.population,'Government':data.government,'Square miles':data.squareMiles,'Square kilometers':data.squareKilometers,'Longitude':data.longitude,'Latitude':data.latitude,'Transportation':data.publicTransportation,'Danger Rating':data.dangerRating,'Race Categories':data.raceCategories,'Races':data.races,'Gods Worshipped':data.godsWorshipped,'Alignment Preferences':data.alignmentAxes,'Settlement Tags':data.settlementTypeTags,'Notes':data.notes})+'</dl>'+builderSection+'<h2>Embedded Settlement Data JSON</h2><pre id="settlement-data-json">'+escapeHtml(JSON.stringify(data,null,2))+'</pre><script type="application/json" id="settlementData">'+escapeHtml(JSON.stringify(data))+'</'+'script></main></body></html>';
  };

  const originalExportProvinceZip = window.exportProvinceZip || (typeof exportProvinceZip === 'function' ? exportProvinceZip : null);
  window.exportProvinceZip = exportProvinceZip = function(){
    try{
      if(currentMapView !== 'province' || !current()){
        alert('Open a province map with Jump to Selected Province before exporting a Province Information ZIP.');
        return;
      }
      if(typeof scanAllProvinceTerrain === 'function') scanAllProvinceTerrain({silent:true});
      const p=current();
      const root='Belavados_Province_Information';
      const pdir=root+'/'+safeHtmlName(p.name);
      const full = (typeof serialize === 'function') ? serialize() : {provinces:[]};
      const provinceData=(full.provinces||[]).find(x=>x.province===p.name || x.name===p.name) || null;
      const files=[];
      const manifest={exportedAt:new Date().toISOString(),rootFolder:root,province:p.name,provinceFolder:pdir,settlements:[]};
      files.push({name:pdir+'/province_overview.docx',content:makeProvinceDocx(p),binary:true});
      files.push({name:pdir+'/province.json',content:JSON.stringify({province:p.name,metadata:metaForProvince(p),data:provinceData},null,2)});
      files.push({name:pdir+'/README.txt',content:'Province-only information export for '+p.name+'. This ZIP is generated only from the currently opened province map. Each settlement has its own subfolder containing a DOCX description, an HTML file, and a JSON data file.'});
      const used=new Set();
      (p.settlements||[]).forEach((s,idx)=>{
        const fname=settlementHtmlFileName(p,s,used);
        s.htmlFileName=s.htmlFileName||fname;
        const stem=fname.replace(/\.html$/i,'');
        const sdir=pdir+'/settlements/'+safeHtmlName((s.name||('Settlement_'+(idx+1)))+'_'+stem);
        const data=settlementExportData(p,s);
        files.push({name:sdir+'/'+fname,content:makeSettlementHtml(p,s)});
        files.push({name:sdir+'/'+stem+'_description.docx',content:makeSettlementDocx(p,s),binary:true});
        files.push({name:sdir+'/'+stem+'.json',content:JSON.stringify(data,null,2)});
        manifest.settlements.push({settlement:s.name||'Unnamed Settlement',folder:sdir,sourceId:s.id||null,htmlFileName:fname,docxFileName:stem+'_description.docx',jsonFileName:stem+'.json',latitude:data.latitude,longitude:data.longitude});
      });
      files.unshift({name:root+'/manifest.json',content:JSON.stringify(manifest,null,2)});
      download(safeHtmlName(p.name)+'_Province_Information.zip', makeZip(files), 'application/zip');
    }catch(err){
      console.error(err);
      alert('Province ZIP export failed: '+(err && err.message ? err.message : err));
    }
  };

  ensureSaveProvinceButton();
  const zipBtn = byId('exportProvinceZip'); if(zipBtn) zipBtn.onclick = exportProvinceZip;
  const setBtn = byId('saveSettlementMeta'); if(setBtn) setBtn.onclick = saveSettlementEditor;
  const scanBtn = byId('scanTerrain'); if(scanBtn){
    const oldScan = scanBtn.onclick;
    scanBtn.onclick = function(ev){
      const result = oldScan ? oldScan.call(this,ev) : undefined;
      try{ if(typeof updateStats === 'function') updateStats(); }catch(e){}
      return result;
    };
  }
})();



/* Belavadös terrain scanner correction: water-first lake/river handling and lore-locked tundra/ice. */
(function(){
  if(window.__belavadosWaterFirstTundraIceCorrection) return;
  window.__belavadosWaterFirstTundraIceCorrection = true;

  function findTerrain(type){
    if(typeof terrainFind === 'function') return terrainFind(type);
    return {name:type, type:type, color:'#999999'};
  }
  function hsvOf(p){
    if(typeof terrainRgbToHsv === 'function') return terrainRgbToHsv(p.r,p.g,p.b);
    const r=p.r/255,g=p.g/255,b=p.b/255,max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;
    let h=0,s=max===0?0:d/max;
    if(d){ if(max===r) h=(g-b)/d+(g<b?6:0); else if(max===g) h=(b-r)/d+2; else h=(r-g)/d+4; h*=60; }
    return {h,s,v:max};
  }
  function lumOf(p){ return typeof terrainLum === 'function' ? terrainLum(p) : (.2126*p.r+.7152*p.g+.0722*p.b); }
  function pixAt(x,y){ return typeof terrainPixel === 'function' ? terrainPixel(x,y) : null; }
  function waterishType(type){ return type==='water' || type==='river' || type==='lake' || type==='reef'; }
  function iceType(type){ return type==='snow' || type==='tundra'; }

  function rawWaterKind(p){
    if(!p || p.a < 5) return null;
    const hsv=hsvOf(p), lum=lumOf(p), blueDominant=(p.b >= p.r + 8 && p.b >= p.g - 22), cyanDominant=(p.g >= p.r + 10 && p.b >= p.r + 12);
    const blueHue = hsv.h >= 172 && hsv.h <= 252;
    const watery = blueHue && (hsv.s >= .075 || blueDominant || cyanDominant) && lum >= 54;
    if(!watery) return null;
    if(hsv.h >= 158 && hsv.h < 188 && hsv.s >= .13 && p.g >= p.b - 35) return 'reef';
    if(hsv.h >= 188 && hsv.h <= 215 && hsv.s >= .18 && lum >= 120) return 'river';
    if(p.b >= p.g + 18 && p.b >= p.r + 38 && lum < 150) return 'lake';
    return 'water';
  }

  function contextualWaterKind(x,y){
    const offsets=[[0,0],[-10,0],[10,0],[0,-10],[0,10],[-22,0],[22,0],[0,-22],[0,22],[-18,-18],[18,-18],[-18,18],[18,18],[-36,0],[36,0],[0,-36],[0,36]];
    let samples=0, water=0, river=0, lake=0, reef=0;
    for(const [dx,dy] of offsets){
      const p=pixAt(x+dx,y+dy); if(!p) continue;
      samples++;
      const k=rawWaterKind(p);
      if(k){ water++; if(k==='river') river++; else if(k==='lake') lake++; else if(k==='reef') reef++; }
    }
    if(samples < 5 || water/samples < .42) return null;
    if(reef >= Math.max(2, water*.32)) return 'reef';
    if(river >= Math.max(2, water*.34)) return 'river';
    if(lake >= Math.max(2, water*.30)) return 'lake';
    return 'water';
  }

  function strictDeepSeaContext(x,y){
    const offsets=[[-64,0],[64,0],[0,-64],[0,64],[-48,-48],[48,-48],[-48,48],[48,48],[-96,0],[96,0],[0,-96],[0,96],[-80,-24],[80,-24],[-80,24],[80,24]];
    let samples=0, water=0, reefOrCoast=0, land=0;
    for(const [dx,dy] of offsets){
      const p=pixAt(x+dx,y+dy); if(!p) continue;
      samples++;
      const k=rawWaterKind(p);
      if(k){ water++; if(k==='reef') reefOrCoast++; }
      else {
        const hsv=hsvOf(p), l=lumOf(p);
        if((hsv.h>=48&&hsv.h<=165&&hsv.s>.10) || (hsv.h>=10&&hsv.h<70&&hsv.s>.12) || (hsv.s<.24&&l>55&&l<190)) land++;
        if(hsv.h>=42&&hsv.h<=62&&hsv.s>.12&&l>145) reefOrCoast++;
      }
    }
    return samples >= 8 && water/samples >= .86 && land <= 1 && reefOrCoast <= 1;
  }

  function strictMountaintopContext(x,y){
    const offsets=[[-14,0],[14,0],[0,-14],[0,14],[-28,0],[28,0],[0,-28],[0,28],[-28,-18],[28,-18],[-28,18],[28,18],[-46,0],[46,0],[0,-46],[0,46]];
    let samples=0, support=0, water=0, rough=0, prev=null;
    for(const [dx,dy] of offsets){
      const p=pixAt(x+dx,y+dy); if(!p) continue;
      samples++;
      if(rawWaterKind(p)){ water++; continue; }
      const hsv=hsvOf(p), l=lumOf(p);
      if(prev!==null) rough += Math.abs(l-prev);
      prev=l;
      const rockyHue=(hsv.h<55 || hsv.h>345 || (hsv.h>=25&&hsv.h<=72));
      const rockyLowSat=hsv.s < .30 && l >= 45 && l <= 190;
      const shadowRock=hsv.s < .22 && l < 105;
      if((rockyHue && rockyLowSat) || shadowRock) support++;
    }
    const avgRough=samples>1?rough/(samples-1):0;
    return samples >= 8 && water <= 1 && support/samples >= .38 && avgRough >= 5;
  }

  function fallbackNonIce(p,x,y){
    const k = rawWaterKind(p) || contextualWaterKind(x,y);
    if(k) return findTerrain(k);
    const hsv=hsvOf(p), l=lumOf(p);
    if(hsv.h>=165 && hsv.h<188 && hsv.s>.12) return findTerrain('reef');
    if(hsv.h>=75 && hsv.h<=156 && hsv.s>.14) return findTerrain(l<105?'forest':'grassland');
    if(hsv.h>=50 && hsv.h<75 && hsv.s>.11) return findTerrain(l>166?'coast':(l>135?'plateau':'hill'));
    if(hsv.h>=28 && hsv.h<50 && hsv.s>.13) return findTerrain(l>165?'desert':'plateau');
    if(hsv.s<.24 && l>70 && l<190) return findTerrain('mountain');
    return findTerrain('unknown');
  }

  const previousClassifier = window.terrainClassify || (typeof terrainClassify === 'function' ? terrainClassify : null);
  window.terrainClassify = terrainClassify = function(p,x,y,mode){
    const directWater = rawWaterKind(p);
    if(directWater) return findTerrain(directWater);

    const c = previousClassifier ? previousClassifier(p,x,y,mode) : null;
    if(c && iceType(c.type)){
      const contextWater = contextualWaterKind(x,y);
      if(contextWater) return findTerrain(contextWater);
      if(strictMountaintopContext(x,y) || strictDeepSeaContext(x,y)) return c;
      return fallbackNonIce(p,x,y);
    }
    return c || fallbackNonIce(p,x,y);
  };

  // Keep the heuristic water-first too, so mode='heuristic' and exported JSON scans follow the same rule.
  const previousHeuristic = window.terrainHeuristic || (typeof terrainHeuristic === 'function' ? terrainHeuristic : null);
  if(previousHeuristic){
    window.terrainHeuristic = terrainHeuristic = function(p,x,y){
      const directWater = rawWaterKind(p);
      if(directWater) return findTerrain(directWater);
      const c = previousHeuristic(p,x,y);
      if(c && iceType(c.type) && !(strictMountaintopContext(x,y) || strictDeepSeaContext(x,y))){
        const contextWater = contextualWaterKind(x,y);
        if(contextWater) return findTerrain(contextWater);
        return fallbackNonIce(p,x,y);
      }
      return c;
    };
  }
})();
