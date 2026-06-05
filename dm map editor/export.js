
/* Belavadös DM export + settlement scanner revision: full border/metadata export, no manual settlement percentage controls. */
(function(){
  if(window.__belavadosDmFullExportSettlementScannerRevision) return;
  window.__belavadosDmFullExportSettlementScannerRevision = true;

  const MI_TO_KM2 = 2.589988110336;
  const $ = id => document.getElementById(id);
  function num(v){ const n = Number(String(v ?? '').replace(/[^0-9.\-]/g,'')); return Number.isFinite(n) ? n : 0; }
  function arr(v){ return Array.isArray(v) ? v.filter(Boolean) : (typeof v === 'string' && v.trim() ? v.split(/[,;|]/).map(x=>x.trim()).filter(Boolean) : []); }
  function uniq(a){ return Array.from(new Set((a||[]).filter(Boolean))); }
  function low(v){ return String(v||'').toLowerCase(); }
  function includesAny(list, words){ const text=arr(list).map(low).join('|'); return words.some(w=>text.includes(w)); }
  function typeOfSettlement(s){ return String(s?.pinType || s?.type || 'Village'); }
  function provinceArea(p){ return num(p?.squareMiles) || (typeof computeArea === 'function' ? num(computeArea(p)) : 0); }
  function provincePopulation(p){ return num(p?.population) || num(p?.metadata?.population) || num(p?.overallPopulation) || 0; }
  function provinceCenter(p){ const pin=p?.pin||{x:0,y:0}; const ll=(typeof xyToLatLon==='function') ? xyToLatLon(pin.x,pin.y) : {lat:null,lon:null}; return {x:pin.x,y:pin.y,lat:ll.lat,lon:ll.lon}; }
  function settlementCenter(s){ const ll=(typeof xyToLatLon==='function') ? xyToLatLon(s.x,s.y) : {lat:s.lat??null,lon:s.lon??null}; return {x:s.x,y:s.y,lat:ll.lat,lon:ll.lon}; }
  function governmentFor(p){ return p?.government || p?.governmentType || p?.metadata?.government || (typeof CANONICAL_PROVINCE_METADATA !== 'undefined' ? CANONICAL_PROVINCE_METADATA[p.name]?.government : '') || ''; }
  function makeHtmlFileName(p,s){ if(s?.htmlFileName) return s.htmlFileName; if(typeof settlementHtmlFileName === 'function') return settlementHtmlFileName(p,s); const clean=String((s?.name||'settlement')+'_'+(p?.name||'province')).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[’'`´]/g,'').replace(/[^a-z0-9]+/gi,'_').replace(/^_+|_+$/g,''); return clean+'.html'; }

  function ensureNoPercentageControls(){
    ['settlementAreaPercent','settlementPopulationPercent'].forEach(id=>{
      const el=$(id); if(!el) return;
      const label=el.closest('label'); if(label) label.remove(); else el.remove();
    });
  }

  function settlementCompleteness(s){
    const missing=[];
    if(!String(s?.name||'').trim()) missing.push('name');
    if(!String(s?.pinType||s?.type||'').trim()) missing.push('type');
    if(!s?.savedAt) missing.push('Save Settlement');
    if(!arr(s?.settlementTags||s?.tags).length) missing.push('tags');
    if(!arr(s?.raceCategories).length && !arr(s?.races).length) missing.push('races');
    return {complete:missing.length===0, missing};
  }
  function requireAllSettlementsSaved(p){
    const settlements=p?.settlements||[];
    if(!p || !settlements.length) return {ok:false,message:'Open a province map with at least one settlement pin before running the settlement scanner.'};
    const bad=settlements.map((s,i)=>({s,i,c:settlementCompleteness(s)})).filter(x=>!x.c.complete);
    if(bad.length){
      const list=bad.slice(0,12).map(x=>(x.s.name||('Settlement '+(x.i+1)))+' missing '+x.c.missing.join(', ')).join('\n');
      return {ok:false,message:'The settlement scanner only runs after every settlement in this province has been saved.\n\n'+list+(bad.length>12?'\n…':'')};
    }
    return {ok:true,message:''};
  }

  function terrainAtSettlement(p,s){
    const scan=p?.terrainScan;
    if(!scan || !Array.isArray(scan.records) || !scan.records.length) return null;
    const cx=num(s.x), cy=num(s.y);
    let best=null, bestD=Infinity;
    for(const r of scan.records){
      const c=r.centroid || {}; const dx=num(c.x)-cx, dy=num(c.y)-cy; const d=dx*dx+dy*dy;
      if(d<bestD){ bestD=d; best=r; }
    }
    return best;
  }

  function settlementScore(p,s){
    const type=low(typeOfSettlement(s));
    let popBase=1, areaBase=1;
    if(type.includes('capital')){ popBase=9.5; areaBase=4.2; }
    else if(type.includes('city')){ popBase=6.5; areaBase=3.0; }
    else if(type.includes('town')){ popBase=2.8; areaBase=1.9; }
    else { popBase=1.0; areaBase=1.0; }

    const tags=arr(s.settlementTags||s.tags);
    const transports=arr(s.transportation||s.publicTransportation);
    const gods=arr(s.godsWorshipped||s.gods);
    const races=uniq([...(arr(s.races)), ...arr(s.raceCategories)]);
    const terrain=terrainAtSettlement(p,s);
    const terrainType=low(terrain?.type || terrain?.feature || '');
    const landmarkCount=tags.length + transports.length + Math.min(4,gods.length) + (s.externalLoreLink||s.loreLink?1:0) + (s.htmlFileName?1:0);
    const raceDiversity=Math.max(0,races.length-1);

    let pop=popBase * (1 + Math.min(.45, raceDiversity*.035)) * (1 + Math.min(.55, landmarkCount*.045));
    let area=areaBase * (1 + Math.min(.50, landmarkCount*.040));

    if(includesAny(tags,['farming','grassland'])){ area*= type.includes('village') ? 5.2 : 2.1; pop*= type.includes('village') ? .62 : .86; }
    if(includesAny(tags,['factories','industrial','slums'])){ pop*= includesAny(tags,['slums']) ? 2.25 : 1.85; area*= includesAny(tags,['slums']) ? .72 : .95; }
    if(includesAny(tags,['trade','dock','coastal','fishing'])){ pop*=1.20; area*=1.18; }
    if(includesAny(tags,['mining','deep mountain'])){ pop*=1.16; area*=1.34; }
    if(includesAny(tags,['military','fortified'])){ pop*=1.18; area*=1.16; }
    if(includesAny(tags,['academic','arcane','religious','noble district'])){ pop*=1.14; area*=1.08; }
    if(includesAny(tags,['ruins','haunted','deep sea','floating','reef'])){ pop*=.82; area*=1.12; }
    if(transports.length){ pop*=1+Math.min(.38, transports.length*.08); area*=1+Math.min(.22, transports.length*.045); }
    if(terrainType.includes('water') || terrainType.includes('reef') || terrainType.includes('river')){ area*=1.08; if(includesAny(tags,['dock','coastal','fishing','floating'])) pop*=1.10; }
    if(terrainType.includes('mountain') || terrainType.includes('canyon')){ area*=1.22; pop*=.92; }
    if(terrainType.includes('forest') || terrainType.includes('jungle')){ area*=1.16; }
    if(terrainType.includes('desert') || terrainType.includes('tundra') || terrainType.includes('snow')){ pop*=.78; area*=1.10; }
    const danger=low(s.danger); if(danger.includes('very dangerous')) pop*=.72; else if(danger.includes('dangerous')) pop*=.84; else if(danger.includes('safe')) pop*=1.08;

    return {populationScore:Math.max(.05,pop), areaScore:Math.max(.05,area), terrain:terrain?{feature:terrain.feature,type:terrain.type,location:terrain.location,percentOfProvince:terrain.percentOfProvince}:null, basis:{settlementType:typeOfSettlement(s), tags, transports, godsCount:gods.length, raceCount:races.length, landmarkCount, raceDiversity, danger:s.danger||'Neutral'}};
  }

  function fallbackPopulationFromType(s){
    const t=low(typeOfSettlement(s));
    if(t.includes('capital')) return 30000;
    if(t.includes('city')) return 12000;
    if(t.includes('town')) return 4000;
    return 500;
  }

  function scanProvinceSettlements(p, options={}){
    if(!p) return null;
    if(typeof scanProvinceTerrain === 'function' && !p.terrainScan) { try{ scanProvinceTerrain(p,{step:num($('scanStep')?.value)||4, mode:$('scanMode')?.value||'hybrid'}); }catch(e){} }
    const settlements=p.settlements||[];
    const totalArea=provinceArea(p);
    const totalPop=provincePopulation(p) || settlements.reduce((sum,s)=>sum+fallbackPopulationFromType(s),0);
    const scored=settlements.map(s=>({s,score:settlementScore(p,s)}));
    const popScoreTotal=scored.reduce((sum,x)=>sum+x.score.populationScore,0)||1;
    const areaScoreTotal=scored.reduce((sum,x)=>sum+x.score.areaScore,0)||1;
    let assignedArea=0, assignedPop=0;
    scored.forEach((x,i)=>{
      const isLast=i===scored.length-1;
      const sqMi=isLast ? Math.max(0,totalArea-assignedArea) : +(totalArea*x.score.areaScore/areaScoreTotal).toFixed(4);
      const pop=isLast ? Math.max(0,Math.round(totalPop-assignedPop)) : Math.max(1,Math.round(totalPop*x.score.populationScore/popScoreTotal));
      assignedArea+=sqMi; assignedPop+=pop;
      const density=sqMi>0 ? +(pop/sqMi).toFixed(2) : null;
      x.s.squareMiles=+sqMi.toFixed(4);
      x.s.squareKilometers=+(sqMi*MI_TO_KM2).toFixed(4);
      x.s.population=pop;
      x.s.generatedPopulation=pop;
      x.s.generatedSettlementArea=x.s.squareMiles;
      x.s.generatedSettlementPopulation=pop;
      x.s.populationDensityPerSqMi=density;
      x.s.areaAllocationPercent=totalArea?+(sqMi/totalArea*100).toFixed(4):null;
      x.s.populationAllocationPercent=totalPop?+(pop/totalPop*100).toFixed(4):null;
      x.s.settlementScan={scannedAt:new Date().toISOString(),method:'Belavadös weighted DM settlement scanner v2',population:pop,squareMiles:x.s.squareMiles,squareKilometers:x.s.squareKilometers,populationDensityPerSqMi:density,areaAllocationPercent:x.s.areaAllocationPercent,populationAllocationPercent:x.s.populationAllocationPercent,score:x.score};
    });
    p.settlementScan={scannedAt:new Date().toISOString(),method:'Belavadös weighted DM settlement scanner v2',requiresEverySettlementSaved:true,totalProvinceSquareMiles:totalArea,totalProvinceSquareKilometers:+(totalArea*MI_TO_KM2).toFixed(2),totalProvincePopulation:totalPop||null,settlementCount:settlements.length,settlementNames:settlements.map(s=>s.name||''),inputsUsed:['settlement type','settlement tags','race categories/race count','deities worshipped','public transportation','danger rating','lore/html landmarks','terrain scan centroid proximity'],notes:'Farming villages receive large land footprints with lower density; factories, industrial tags, and slums increase population density. Assigned settlement square miles sum to province square miles; assigned settlement population sums to province population when available.'};
    try{ localStorage.setItem('BelavadosMapDM_Autosave', JSON.stringify(window.serialize ? window.serialize() : serialize())); }catch(e){}
    if(!options.silent){
      if($('settlementScanStatus')) $('settlementScanStatus').textContent='Complete';
      if($('settlementScanCount')) $('settlementScanCount').textContent=String(settlements.length);
      if(typeof updateStats==='function') updateStats();
      if(typeof renderSettlementSelect==='function') renderSettlementSelect();
      if(typeof updateSettlementGeneratedReadout==='function') updateSettlementGeneratedReadout();
      if(typeof drawMap==='function') drawMap();
      if($('dataBox') && (window.serialize || typeof serialize==='function')) $('dataBox').value=JSON.stringify((window.serialize||serialize)(),null,2);
      alert('Settlement scan complete for '+settlements.length+' settlements in '+p.name+'.');
    }
    return p.settlementScan;
  }

  window.scanCurrentProvinceSettlements = function(options={}){
    const p=(typeof current==='function') ? current() : null;
    const check=requireAllSettlementsSaved(p);
    if(!check.ok){ if(!options.silent) alert(check.message); return null; }
    return scanProvinceSettlements(p,options);
  };

  function settlementGeneratedValuesNew(p,s){
    const sqMi=num(s?.squareMiles)||num(s?.generatedSettlementArea)||0;
    const pop=num(s?.population)||num(s?.generatedPopulation)||num(s?.generatedSettlementPopulation)||0;
    return {squareMiles:+sqMi.toFixed(4), squareKilometers:+(sqMi*MI_TO_KM2).toFixed(4), population:pop||''};
  }
  window.settlementGeneratedValues = settlementGeneratedValues = settlementGeneratedValuesNew;
  window.updateSettlementGeneratedReadout = updateSettlementGeneratedReadout = function(){
    const p=(typeof current==='function') ? current() : null;
    const idx=(typeof selectedSettlementIndex !== 'undefined') ? selectedSettlementIndex : -1;
    const s=p && p.settlements ? p.settlements[idx] : null;
    const g=settlementGeneratedValuesNew(p,s);
    const a=$('settlementGeneratedSqMi'), pop=$('settlementGeneratedPopulation');
    if(a) a.textContent=g.squareMiles?g.squareMiles.toLocaleString():'—';
    if(pop) pop.textContent=g.population?Number(g.population).toLocaleString():'—';
  };

  const previousSaveSettlement = window.saveSettlementEditor || (typeof saveSettlementEditor === 'function' ? saveSettlementEditor : null);
  window.saveSettlementEditor = saveSettlementEditor = function(){
    if(previousSaveSettlement) previousSaveSettlement.apply(this,arguments);
    const p=(typeof current==='function') ? current() : null;
    const idx=(typeof selectedSettlementIndex !== 'undefined') ? selectedSettlementIndex : -1;
    const s=p && p.settlements ? p.settlements[idx] : null;
    if(!s) return;
    delete s.areaPercent; delete s.populationPercent; delete s.percentProvinceSquareMiles; delete s.percentProvincePopulation;
    s.htmlFileName=s.htmlFileName || makeHtmlFileName(p,s);
    s.savedAt=s.savedAt || new Date().toISOString();
    try{ localStorage.setItem('BelavadosMapDM_Autosave', JSON.stringify((window.serialize||serialize)())); }catch(e){}
    updateSettlementGeneratedReadout();
  };

  function fullSettlementExport(p,s){
    const c=settlementCenter(s);
    const tags=arr(s.settlementTags||s.tags).slice(0,4);
    const races=uniq([...(arr(s.races)), ...arr(s.raceCategories)]);
    return {
      province:p.name, provinceKey:(typeof provinceImportKey==='function'?provinceImportKey(p.name):p.name),
      settlement:s.name||'', name:s.name||'', settlementName:s.name||'', pinType:typeOfSettlement(s), type:typeOfSettlement(s),
      x:c.x,y:c.y,lat:c.lat,lon:c.lon,latitude:c.lat,longitude:c.lon,coordinates:c,
      population:num(s.population)||num(s.generatedPopulation)||null, overallPopulation:num(s.population)||num(s.generatedPopulation)||null,
      squareMiles:num(s.squareMiles)||null, squareKilometers:num(s.squareKilometers)||null, populationDensityPerSqMi:s.populationDensityPerSqMi??null,
      races, raceCategories:arr(s.raceCategories), deitiesWorshipped:arr(s.godsWorshipped||s.gods), godsWorshipped:arr(s.godsWorshipped||s.gods),
      settlementTags:tags, tags, axisPreferences:s.alignmentAxes||{}, alignmentAxes:s.alignmentAxes||{}, danger:s.danger||'Neutral', dangerRating:s.danger||'Neutral',
      loreLink:s.externalLoreLink||s.loreLink||s.link||'', externalLoreLink:s.externalLoreLink||s.loreLink||s.link||'', htmlFileName:makeHtmlFileName(p,s),
      publicTransportation:arr(s.transportation||s.publicTransportation), transportation:arr(s.transportation||s.publicTransportation), notes:s.notes||'', savedAt:s.savedAt||null,
      terrainInfluence:s.settlementScan?.score?.terrain || terrainAtSettlement(p,s), settlementScan:s.settlementScan||null,
      raw:{...s}
    };
  }

  function fullProvinceExport(p){
    if(!p) return null;
    if(typeof assignDynamicAnchorDirections==='function') assignDynamicAnchorDirections(p);
    const center=provinceCenter(p), area=provinceArea(p), pop=provincePopulation(p);
    const points=(p.anchors||[]).map((a,i)=>{ const ll=(typeof xyToLatLon==='function') ? xyToLatLon(a.x,a.y) : {lat:a.lat??null,lon:a.lon??null}; return {index:i,dir:a.dir || (typeof dynamicAnchorDir==='function'?dynamicAnchorDir(a,p.pin||center):String(i+1)),x:a.x,y:a.y,lat:ll.lat,lon:ll.lon,latitude:ll.lat,longitude:ll.lon,sourceMiles:a.sourceMiles??null,extraAnchor:!!a.extraAnchor,color:p.color,borderOpacity:p.opacity,borderWidth:p.width}; });
    return {
      province:p.name,name:p.name,provinceName:p.name,provinceKey:(typeof provinceImportKey==='function'?provinceImportKey(p.name):p.name),
      provinceInfo:{governmentType:governmentFor(p),overallPopulation:pop||null,squareMiles:area,squareKilometers:+(area*MI_TO_KM2).toFixed(2),centerPointCoordinates:center,landScanResults:p.terrainScan||null},
      governmentType:governmentFor(p),government:governmentFor(p),overallPopulation:pop||null,population:pop||null,
      squareMiles:area,squareKilometers:+(area*MI_TO_KM2).toFixed(2),centerLat:center.lat,centerLon:center.lon,centerPointCoordinates:center,
      color:p.color,borderColor:p.color,borderOpacity:p.opacity,borderWidth:p.width,borderVisible:p.visible!==false,
      borderData:{color:p.color,opacity:p.opacity,width:p.width,visible:p.visible!==false,exactLocations:points,points,anchors:points,centerPointCoordinates:center},
      points,anchors:points,provinceCenterPin:{...center,color:'white'},
      landScanResults:p.terrainScan||null,terrainScan:p.terrainScan||null,settlementScan:p.settlementScan||null,
      settlements:(p.settlements||[]).map(s=>fullSettlementExport(p,s)),
      metadata:{...(typeof CANONICAL_PROVINCE_METADATA!=='undefined' ? (CANONICAL_PROVINCE_METADATA[p.name]||{}) : {}),...(p.metadata||{}),government:governmentFor(p),governmentType:governmentFor(p),population:pop||null,overallPopulation:pop||null},
      loreLinks:p.loreLinks||[], externalLink:p.externalLink||'', raw:{...p, anchors:undefined, settlements:undefined}
    };
  }

  const previousSerialize = window.serialize || (typeof serialize === 'function' ? serialize : null);
  window.serialize = serialize = function(){
    const base=previousSerialize ? previousSerialize() : {kind:'BelavadosUnifiedPortableMapData',version:4,provinces:[]};
    const fullProvinces=((typeof state!=='undefined' && state.provinces) ? state.provinces : []).map(fullProvinceExport);
    return {...base, version:5, exportGuarantees:{exportsAllBorderData:true,exportsBorderColors:true,exportsExactBorderLocations:true,exportsProvinceInfo:true,exportsGovernmentType:true,exportsOverallSquareMilesKilometers:true,exportsLandScanResults:true,exportsOverallPopulation:true,exportsCenterPointCoordinates:true,exportsSettlementInfo:true,settlementPercentageSelectorsRemoved:true,settlementScannerRequiresEverySettlementSaved:true}, provinces:fullProvinces, borderData:fullProvinces.map(p=>p.borderData), provinceInfo:fullProvinces.map(p=>p.provinceInfo)};
  };

  const previousSerializeBorders = window.serializeBorders || (typeof serializeBorders === 'function' ? serializeBorders : null);
  window.serializeBorders = serializeBorders = function(){
    const full=((typeof state!=='undefined' && state.provinces) ? state.provinces : []).map(fullProvinceExport);
    return {kind:'BelavadosProvinceBorders',version:2,earthRadiusMiles:(typeof EARTH_RADIUS_MI!=='undefined'?EARTH_RADIUS_MI:null),exportedAt:new Date().toISOString(),provinceCount:full.length,provinces:full.map(p=>({province:p.province,name:p.name,provinceKey:p.provinceKey,borderColor:p.borderColor,color:p.color,borderOpacity:p.borderOpacity,borderWidth:p.borderWidth,borderVisible:p.borderVisible,centerLat:p.centerLat,centerLon:p.centerLon,centerPointCoordinates:p.centerPointCoordinates,points:p.points,anchors:p.anchors,borderData:p.borderData,terrainScan:p.terrainScan,landScanResults:p.landScanResults}))};
  };

  function safeScanAllTerrain(){ try{ if(typeof scanAllProvinceTerrain==='function') scanAllProvinceTerrain({silent:true}); }catch(e){ console.warn('Terrain scan skipped during export',e); } }
  function safeScanSavedSettlementsForExport(){
    const provinces=(typeof state!=='undefined'&&state.provinces)||[];
    provinces.forEach(p=>{ const check=requireAllSettlementsSaved(p); if(check.ok) scanProvinceSettlements(p,{silent:true}); });
  }
  const exportBtn=$('exportJson');
  if(exportBtn){ exportBtn.onclick=function(){ safeScanAllTerrain(); safeScanSavedSettlementsForExport(); const data=JSON.stringify((window.serialize||serialize)(),null,2); if($('dataBox')) $('dataBox').value=data; if(typeof download==='function') download('dm_map.json',data); }; }
  const scanBtn=$('scanSettlements');
  if(scanBtn){ scanBtn.onclick=function(){ window.scanCurrentProvinceSettlements({silent:false}); }; }
  ensureNoPercentageControls();
  if($('saveSettlementMeta')) $('saveSettlementMeta').onclick=saveSettlementEditor;
  if($('dataBox') && (window.serialize || typeof serialize==='function')) { try{$('dataBox').value=JSON.stringify((window.serialize||serialize)(),null,2);}catch(e){} }
})();


/* Final export/import safety patch: never bake pins into exported/imported map images. */
(function(){
  if(window.__belavadosNoStationaryPinExportPatch) return;
  window.__belavadosNoStationaryPinExportPatch = true;

  function isPlainObject(v){ return v && typeof v === 'object' && !Array.isArray(v); }
  function copyArray(v){ return Array.isArray(v) ? v.slice() : []; }
  function livePinType(s){
    const t = String(s?.pinType || s?.type || s?.settlementType || 'Village');
    if(/capital/i.test(t)) return 'Capital City';
    if(/city/i.test(t)) return 'City';
    if(/town/i.test(t)) return 'Town';
    return 'Village';
  }
  function livePinColor(type){
    try{ if(typeof pinColor === 'function') return pinColor(type); }catch(e){}
    return type === 'Capital City' ? '#DC143C' : type === 'City' ? '#32FF32' : type === 'Town' ? '#FFA500' : '#000080';
  }
  const STATIC_PIN_FIELD_RE = /(stationary|static|baked|fixed|flattened|rendered).*(pin|marker|settlement)|(?:pin|marker|settlement).*(image|img|png|jpg|jpeg|webp|dataurl|data_url|canvas|snapshot|screenshot|layer)|(?:image|img|png|jpg|jpeg|webp|dataurl|data_url|canvas|snapshot|screenshot|layer).*(pin|marker|settlement)/i;
  const STATIC_PIN_EXACT = new Set([
    'raw','icon','iconUrl','iconDataUrl','markerIcon','markerImage','markerImageUrl','pinIcon','pinImage','pinImageUrl',
    'pinDataUrl','markerDataUrl','settlementPinImage','settlementPinDataUrl','pinLayerImage','markerLayerImage',
    'staticPin','stationaryPin','bakedPin','fixedPin','bakedPins','stationaryPins','staticPins','renderedPins',
    'mapImageWithPins','provinceImageWithPins','canvasWithPins','screenshotWithPins','snapshotWithPins'
  ]);
  function removeStaticPinFields(obj){
    if(!isPlainObject(obj)) return obj;
    const clean = {};
    Object.keys(obj).forEach(k=>{
      if(STATIC_PIN_EXACT.has(k) || STATIC_PIN_FIELD_RE.test(k)) return;
      const v = obj[k];
      if(Array.isArray(v)) clean[k] = v.map(item=>isPlainObject(item)?removeStaticPinFields(item):item);
      else if(isPlainObject(v)) clean[k] = removeStaticPinFields(v);
      else clean[k] = v;
    });
    return clean;
  }
  function sanitizeSettlementForLivePins(s, provinceName){
    const c = removeStaticPinFields(s || {});
    const type = livePinType(c);
    const x = Number.isFinite(+c.x) ? +c.x : (Number.isFinite(+c.coordinates?.x) ? +c.coordinates.x : 0);
    const y = Number.isFinite(+c.y) ? +c.y : (Number.isFinite(+c.coordinates?.y) ? +c.coordinates.y : 0);
    let lat = c.lat ?? c.latitude ?? c.coordinates?.lat;
    let lon = c.lon ?? c.longitude ?? c.coordinates?.lon;
    try{
      if((lat == null || lon == null) && typeof xyToLatLon === 'function'){
        const ll = xyToLatLon(x,y); lat = ll.lat; lon = ll.lon;
      }
    }catch(e){}
    c.x = x; c.y = y;
    c.lat = lat; c.lon = lon; c.latitude = lat; c.longitude = lon;
    c.province = c.province || provinceName || '';
    c.type = type; c.pinType = type; c.settlementType = c.settlementType || type;
    c.pinColor = livePinColor(type); c.color = livePinColor(type);
    c.viewScope = 'province-map-only';
    c.pinRenderMode = 'live-js-css-draggable';
    c.pinStorageMode = 'coordinate-record-only';
    c.draggable = true;
    c.bakedIntoImage = false;
    c.stationaryImagePin = false;
    c.staticImageLayer = false;
    c.cssClass = 'settlement-pin live-js-css-pin draggable-settlement-pin';
    return c;
  }
  function sanitizeProvinceForLivePins(p){
    if(!isPlainObject(p)) return p;
    const clean = removeStaticPinFields(p);
    clean.settlements = copyArray(clean.settlements).map(s=>sanitizeSettlementForLivePins(s, clean.province || clean.name));
    clean.provinceMap = {
      ...(isPlainObject(clean.provinceMap) ? clean.provinceMap : {}),
      generatedFromMainWorldMap:true,
      settlementPinsEditableOnlyInProvinceView:true,
      pinRenderMode:'live-js-css-draggable',
      pinStorageMode:'coordinate-record-only',
      noStaticPins:true,
      noBakedPins:true,
      mapImageContainsPins:false
    };
    clean.pinRendering = {
      settlementPins:'live-js-css-draggable',
      storedAs:'x/y plus latitude/longitude coordinate records',
      neverExportAsImage:true,
      neverBakeIntoMapImage:true
    };
    return clean;
  }
  function sanitizePackageForLivePins(pkg){
    if(!isPlainObject(pkg)) return pkg;
    const clean = removeStaticPinFields(pkg);
    clean.provinces = copyArray(clean.provinces).map(sanitizeProvinceForLivePins);
    clean.exportGuarantees = {
      ...(isPlainObject(clean.exportGuarantees) ? clean.exportGuarantees : {}),
      noStationaryPins:true,
      noBakedPinsInMapImages:true,
      settlementPinsExportAsCoordinateRecordsOnly:true,
      settlementPinsImportAsLiveDraggableJsCssPins:true
    };
    clean.pinRenderingSystem = {
      version:1,
      settlementPins:'live-js-css-draggable',
      provinceCenterPins:'live-js-draggable-coordinate-handles',
      borderAnchors:'live-js-draggable-coordinate-handles',
      imageLayerPolicy:'base map images only; pins are never rendered into exported image data',
      importPolicy:'ignore static/baked/stationary pin image fields and rebuild pins from coordinates'
    };
    if(isPlainObject(clean.worldMapReference)){
      clean.worldMapReference = {
        ...clean.worldMapReference,
        imageLayerPolicy:'base-map-only-no-pins',
        mapImageContainsPins:false,
        pinLayerExported:false
      };
    }
    return clean;
  }

  const previousSerializeNoStationaryPins = window.serialize || (typeof serialize === 'function' ? serialize : null);
  if(previousSerializeNoStationaryPins){
    window.serialize = serialize = function(){
      const pkg = previousSerializeNoStationaryPins.apply(this, arguments);
      return sanitizePackageForLivePins(pkg);
    };
  }

  const previousSettlementExportData = window.settlementExportData || (typeof settlementExportData === 'function' ? settlementExportData : null);
  if(previousSettlementExportData){
    window.settlementExportData = settlementExportData = function(p,s){
      return sanitizeSettlementForLivePins(previousSettlementExportData.apply(this, arguments), p?.name || p?.province || '');
    };
  }

  const previousApplyBordersDataNoStationaryPins = window.applyBordersData || (typeof applyBordersData === 'function' ? applyBordersData : null);
  if(previousApplyBordersDataNoStationaryPins){
    window.applyBordersData = applyBordersData = function(data){
      return previousApplyBordersDataNoStationaryPins.call(this, sanitizePackageForLivePins(data));
    };
  }

  const exportBtn = document.getElementById('exportJson');
  if(exportBtn){
    exportBtn.onclick = function(){
      try{ if(typeof scanAllProvinceTerrain === 'function') scanAllProvinceTerrain({silent:true}); }catch(e){ console.warn('Terrain scan skipped during export', e); }
      try{
        const provinces = (typeof state !== 'undefined' && state.provinces) || [];
        provinces.forEach(p=>{ try{ if(typeof requireAllSettlementsSaved === 'function' && typeof scanProvinceSettlements === 'function' && requireAllSettlementsSaved(p).ok) scanProvinceSettlements(p,{silent:true}); }catch(e){} });
      }catch(e){}
      const data = JSON.stringify((window.serialize || serialize)(), null, 2);
      const box = document.getElementById('dataBox'); if(box) box.value = data;
      if(typeof download === 'function') download('dm_map.json', data, 'application/json');
    };
  }

  const htmlBtn = document.getElementById('exportHtml');
  if(htmlBtn){
    htmlBtn.onclick = function(){
      const html = document.documentElement.outerHTML;
      if(typeof download === 'function') download('dm_map.html', html, 'text/html');
    };
  }

  const playerBtn = document.getElementById('exportPlayerHtml');
  if(playerBtn){
    playerBtn.onclick = function(){
      let html=document.documentElement.outerHTML
        .replace('Belavadös DM Interactive Map Command Center','Belavadös Player Interactive Map')
        .replace(/contenteditable="true"/g,'');
      const marker='<div class="sidebar-section approved-controls"><h3>Persistence and file controls</h3>';
      const a=html.indexOf(marker);
      if(a>=0){const b=html.indexOf('</section>',a);if(b>=0)html=html.slice(0,a)+html.slice(b+'</section>'.length);} 
      if(typeof download === 'function') download('belavados_map_PLAYER.html', html, 'text/html');
    };
  }

  try{
    if(document.getElementById('dataBox') && (window.serialize || typeof serialize === 'function')){
      document.getElementById('dataBox').value = JSON.stringify((window.serialize || serialize)(), null, 2);
    }
  }catch(e){}
})();


/* Full self-contained DM HTML export patch: embeds live session JSON into exported dm_map.html. */
(function(){
  if(window.__belavadosFullDmHtmlExportPatch) return;
  window.__belavadosFullDmHtmlExportPatch = true;

  const EMBED_ID = 'BELAVADOS_DM_EXPORTED_SESSION_JSON';
  const LOADER_ID = 'BELAVADOS_DM_EXPORTED_SESSION_LOADER';

  function q(id){ return document.getElementById(id); }
  function runSilentExportScans(){
    try{
      if(typeof saveSettlementEditor === 'function' && typeof selectedSettlementIndex !== 'undefined' && selectedSettlementIndex >= 0){
        saveSettlementEditor();
      }
    }catch(e){ console.warn('Current settlement editor save skipped during HTML export:', e); }
    try{
      if(typeof scanAllProvinceTerrain === 'function') scanAllProvinceTerrain({silent:true});
    }catch(e){ console.warn('Terrain scan skipped during HTML export:', e); }
    try{
      const provinces = (typeof state !== 'undefined' && state.provinces) || [];
      provinces.forEach(p=>{
        try{
          if(typeof requireAllSettlementsSaved === 'function' && typeof scanProvinceSettlements === 'function'){
            const check = requireAllSettlementsSaved(p);
            if(check && check.ok) scanProvinceSettlements(p,{silent:true});
          }
        }catch(inner){ console.warn('Settlement scan skipped for '+(p && p.name ? p.name : 'province')+':', inner); }
      });
    }catch(e){ console.warn('Settlement export scan pass skipped:', e); }
  }
  function completeSessionData(){
    runSilentExportScans();
    const serializer = window.serialize || (typeof serialize === 'function' ? serialize : null);
    const data = serializer ? serializer() : {};
    data.exportedHtmlSession = {
      savedAt:new Date().toISOString(),
      purpose:'Self-contained DM HTML session restore. This exported dm_map.html embeds all JSON/site data available through the live serializer at export time.',
      currentMapView: (typeof currentMapView !== 'undefined' ? currentMapView : 'main'),
      selectedProvinceIndex: (typeof selected !== 'undefined' ? selected : 0),
      selectedProvinceName: (typeof current === 'function' && current() ? current().name : ''),
      selectedSettlementIndex: (typeof selectedSettlementIndex !== 'undefined' ? selectedSettlementIndex : -1),
      borderOverlayVisible: q('borderOverlayToggle') ? q('borderOverlayToggle').checked : true,
      provinceBorderOverlayVisible: q('provinceBorderOverlayToggle') ? q('provinceBorderOverlayToggle').checked : true,
      scanStep: q('scanStep') ? q('scanStep').value : '',
      scanMode: q('scanMode') ? q('scanMode').value : '',
      customWorldMapDataUrlPresent: !!(data.worldMapReference && data.worldMapReference.customWorldMapDataUrl),
      includesProvinceBorders:true,
      includesProvinceCenterPins:true,
      includesSettlementPinsAndMetadata:true,
      includesTerrainScans:true,
      includesSettlementPopulationAndLandScans:true,
      includesCustomWorldMapImage: !!(data.worldMapReference && data.worldMapReference.customWorldMapDataUrl)
    };
    data.htmlExportGuarantees = {
      selfContained:true,
      restoreOnOpen:true,
      savesAllSerializedJsonInformation:true,
      savesAllProvinceBorderAnchorLocations:true,
      savesAllProvinceCenterPinLocations:true,
      savesAllSettlementPinLocationsAndMetadata:true,
      savesAllTerrainScanInformation:true,
      savesAllSettlementScanInformation:true,
      pinsRemainLiveDraggableJsCssPins:true,
      noStationaryPinsBakedIntoImages:true
    };
    return data;
  }
  function jsonForScript(data){
    return JSON.stringify(data, null, 2)
      .replace(/</g,'\\u003C')
      .replace(/>/g,'\\u003E')
      .replace(/&/g,'\\u0026')
      .replace(/\u2028/g,'\\u2028')
      .replace(/\u2029/g,'\\u2029');
  }
  function removeOldEmbeddedSession(html){
    html = html.replace(new RegExp('\\n?<script[^>]*id=["\\\']'+EMBED_ID+'["\\\'][\\s\\S]*?<\\/script>','g'),'');
    html = html.replace(new RegExp('\\n?<script[^>]*id=["\\\']'+LOADER_ID+'["\\\'][\\s\\S]*?<\\/script>','g'),'');
    return html;
  }
  function restoreLoaderScript(){
    return `<script id="${LOADER_ID}">
(function(){
  if(window.__belavadosExportedDmSessionRestore) return;
  window.__belavadosExportedDmSessionRestore = true;
  const EMBED_ID='${EMBED_ID}';
  function byId(id){ return document.getElementById(id); }
  function readEmbedded(){
    const el=byId(EMBED_ID);
    if(!el || !el.textContent.trim()) return null;
    try{ return JSON.parse(el.textContent); }catch(e){ console.error('Could not parse embedded Belavadös DM session JSON:', e); return null; }
  }
  function restoreControls(data){
    try{ if(byId('borderOverlayToggle') && data.exportedHtmlSession) byId('borderOverlayToggle').checked = data.exportedHtmlSession.borderOverlayVisible !== false; }catch(e){}
    try{ if(byId('provinceBorderOverlayToggle') && data.exportedHtmlSession) byId('provinceBorderOverlayToggle').checked = data.exportedHtmlSession.provinceBorderOverlayVisible !== false; }catch(e){}
    try{ if(byId('scanStep') && data.exportedHtmlSession && data.exportedHtmlSession.scanStep) byId('scanStep').value = data.exportedHtmlSession.scanStep; }catch(e){}
    try{ if(byId('scanMode') && data.exportedHtmlSession && data.exportedHtmlSession.scanMode) byId('scanMode').value = data.exportedHtmlSession.scanMode; }catch(e){}
  }
  function restoreView(data){
    try{
      const session=data.exportedHtmlSession||{};
      let wantedName=session.selectedProvinceName||'';
      let idx=-1;
      if(typeof state !== 'undefined' && state.provinces){
        if(wantedName) idx=state.provinces.findIndex(p=>p && p.name===wantedName);
        if(idx<0 && Number.isFinite(+session.selectedProvinceIndex)) idx=+session.selectedProvinceIndex;
        if(idx>=0 && idx<state.provinces.length){
          selected=idx;
          if(byId('provinceSelect')) byId('provinceSelect').value=idx;
        }
      }
      if(typeof selectedSettlementIndex !== 'undefined') selectedSettlementIndex = Number.isFinite(+session.selectedSettlementIndex) ? +session.selectedSettlementIndex : -1;
      if(session.currentMapView==='province' && typeof openProvinceMap==='function' && selected>=0) openProvinceMap(selected);
      else if(typeof returnToMainMap==='function') returnToMainMap();
      if(typeof refreshSelect==='function') refreshSelect();
      if(typeof renderSettlementSelect==='function') renderSettlementSelect();
      if(typeof updateStats==='function') updateStats();
      if(typeof updateTerrainPanel==='function') updateTerrainPanel();
      if(typeof drawMap==='function') drawMap();
      const box=byId('dataBox');
      if(box) box.value = JSON.stringify((window.serialize||serialize)(), null, 2);
    }catch(e){ console.warn('Embedded DM session view restore skipped:', e); }
  }
  function applyEmbedded(attempt){
    const data=readEmbedded();
    if(!data) return;
    if(typeof applyBordersData !== 'function' || typeof state === 'undefined' || !state.provinces){
      if(attempt < 80) return setTimeout(()=>applyEmbedded(attempt+1), 100);
      console.error('Belavadös embedded DM session could not restore because map functions were unavailable.');
      return;
    }
    try{
      applyBordersData(data);
      restoreControls(data);
      restoreView(data);
      try{ localStorage.setItem('BelavadosMapDM_Autosave', JSON.stringify((window.serialize||serialize)())); }catch(e){}
      console.info('Belavadös exported DM HTML session restored from embedded JSON.');
    }catch(e){
      console.error('Belavadös embedded DM session restore failed:', e);
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>applyEmbedded(0), 0));
  else setTimeout(()=>applyEmbedded(0), 0);
})();
<\/script>`;
  }
  function buildSelfContainedDmHtml(){
    const data = completeSessionData();
    const box=q('dataBox');
    if(box) box.value = JSON.stringify(data, null, 2);
    let html = removeOldEmbeddedSession(document.documentElement.outerHTML);
    const embed = '\n<script type="application/json" id="'+EMBED_ID+'">\n'+jsonForScript(data)+'\n<\/script>\n' + restoreLoaderScript() + '\n';
    if(html.includes('</body>')) html = html.replace('</body>', embed+'</body>');
    else html += embed;
    return html;
  }
  window.buildSelfContainedDmHtml = buildSelfContainedDmHtml;

  const htmlBtn=q('exportHtml');
  if(htmlBtn){
    htmlBtn.onclick=function(){
      const html = buildSelfContainedDmHtml();
      if(typeof download === 'function') download('dm_map.html', html, 'text/html');
    };
  }
})();

/* Belavadös settlement map image suggestion extension.
   During Province Information ZIP export, each settlement receives a suggested map image path
   based on the province terrain scan, settlement type, tags, transport/water context, and races. */
(function(){
  const IMAGE_SUGGESTION_VERSION = '2026-06-02-province-scan-map-suggestions-v1';
  const MAP_IMAGE_CATALOG = [
    ['Coastal River','Beach and grass with water','Capital City','maps/Coastal River/Beach and grass with water/Coastal_River_Beach_and_grass_with_water_Capital_City.png'],
    ['Coastal River','Beach and grass with water','City','maps/Coastal River/Beach and grass with water/Coastal_River_Beach_and_grass_with_water_City.png'],
    ['Coastal River','Beach and grass with water','Town','maps/Coastal River/Beach and grass with water/Coastal_River_Beach_and_grass_with_water_Town.png'],
    ['Coastal River','Beach and grass with water','Village','maps/Coastal River/Beach and grass with water/Coastal_River_Beach_and_grass_with_water_Village.png'],
    ['Coastal River','Beach and reefs with water','Capital City','maps/Coastal River/Beach and reefs with water/Coastal_River_Beach_and_reefs_with_water_Capital_City.png'],
    ['Coastal River','Beach and reefs with water','City','maps/Coastal River/Beach and reefs with water/Coastal_River_Beach_and_reefs_with_water_City.png'],
    ['Coastal River','Beach and reefs with water','Town','maps/Coastal River/Beach and reefs with water/Coastal_River_Beach_and_reefs_with_water_Town.png'],
    ['Coastal River','Beach and reefs with water','Village','maps/Coastal River/Beach and reefs with water/Coastal_River_Beach_and_reefs_with_water_Village.png'],
    ['Lush Forest','Deep forest','City','maps/Lush Forest/Deep forest/Lush_Forest_1_Deep_Forest_City.png'],
    ['Lush Forest','Deep forest','Town','maps/Lush Forest/Deep forest/Lush_Forest_1_Deep_Forest_Town.png'],
    ['Lush Forest','Deep forest','Village','maps/Lush Forest/Deep forest/Lush_Forest_1_Deep_Forest_Village.png'],
    ['Lush Forest','Hybrid tree and forest floor','City','maps/Lush Forest/Hybrid tree and forest floor/Lush Forest 2 - Hybrid tree and forest floor - City.png'],
    ['Lush Forest','Hybrid tree and forest floor','Town','maps/Lush Forest/Hybrid tree and forest floor/Lush Forest 2 - Hybrid tree and forest floor - Town.png'],
    ['Lush Forest','Hybrid tree and forest floor','Village','maps/Lush Forest/Hybrid tree and forest floor/Lush Forest 2 - Hybrid tree and forest floor - Village.png'],
    ['Lush Forest','Marshes and swamps','City','maps/Lush Forest/Marshes and swamps/Lush Forest 2 - Marshes and swamps - City.png'],
    ['Lush Forest','Marshes and swamps','Town','maps/Lush Forest/Marshes and swamps/Lush Forest 2 - Marshes and swamps - Town.png'],
    ['Lush Forest','Marshes and swamps','Village','maps/Lush Forest/Marshes and swamps/Lush Forest 2 - Marshes and swamps - Village.png'],
    ['Lush Forest','Partial forest','City','maps/Lush Forest/Partial forest/Lush_Forest_1_Partial_Forest_City.png'],
    ['Lush Forest','Partial forest','Town','maps/Lush Forest/Partial forest/Lush_Forest_1_Partial_Forest_Town.png'],
    ['Lush Forest','Partial forest','Village','maps/Lush Forest/Partial forest/Lush_Forest_1_Partial_Forest_Village.png'],
    ['Lush Forest','Treetops - treehouses','City','maps/Lush Forest/Treetops - treehouses/Lush Forest 2 - Treetops - treehouses - City.png'],
    ['Lush Forest','Treetops - treehouses','Town','maps/Lush Forest/Treetops - treehouses/Lush Forest 2 - Treetops - treehouses - Town.png'],
    ['Lush Forest','Treetops - treehouses','Village','maps/Lush Forest/Treetops - treehouses/Lush Forest 2 - Treetops - treehouses - Village.png'],
    ['Mountainous','Deep cavern','Capital City','maps/Mountainous/Deep cavern/Deep_Cavern_Capital_City.png'],
    ['Mountainous','Deep cavern','City','maps/Mountainous/Deep cavern/Deep_Cavern_City.png'],
    ['Mountainous','Deep cavern','Town','maps/Mountainous/Deep cavern/Deep_Cavern_Town.png'],
    ['Mountainous','Mountain range','Capital City','maps/Mountainous/Mountain range/Mountain_Range_Capital_City.png'],
    ['Mountainous','Mountain range','City','maps/Mountainous/Mountain range/Mountain_Range_City.png'],
    ['Mountainous','Mountain range','Town','maps/Mountainous/Mountain range/Mountain_Range_Town.png'],
    ['Mountainous','Valley','Capital City','maps/Mountainous/Valley/Valley_Capital_City.png'],
    ['Mountainous','Valley','City','maps/Mountainous/Valley/Valley_City.png'],
    ['Mountainous','Valley','Town','maps/Mountainous/Valley/Valley_Town.png'],
    ['Ocean','Ocean Surface floating settlement','Capital City','maps/Ocean/Ocean Surface floating settlement/Ocean_Surface_floating_settlement_capital_city.png'],
    ['Ocean','Ocean Surface floating settlement','City','maps/Ocean/Ocean Surface floating settlement/Ocean_Surface_floating_settlement_city.png'],
    ['Ocean','Underwater with reefs','Capital City','maps/Ocean/Underwater with reefs/Ocean_Underwater_with_reefs_merfolk_capital_city.png'],
    ['Ocean','Underwater with reefs','City','maps/Ocean/Underwater with reefs/Ocean_Underwater_with_reefs_merfolk_city.png'],
    ['Ocean','Underwater with reefs','Town','maps/Ocean/Underwater with reefs/Ocean_Underwater_with_reefs_merfolk_town.png'],
    ['Ocean','Underwater with reefs','Village','maps/Ocean/Underwater with reefs/Ocean_Underwater_with_reefs_merfolk_village.png'],
    ['Ocean','Underwater without reefs','Capital City','maps/Ocean/Underwater without reefs/Ocean_Underwater_without_reefs_merfolk_capital_city.png'],
    ['Ocean','Underwater without reefs','City','maps/Ocean/Underwater without reefs/Ocean_Underwater_without_reefs_merfolk_city.png'],
    ['Ocean','Underwater without reefs','Town','maps/Ocean/Underwater without reefs/Ocean_Underwater_without_reefs_merfolk_town.png'],
    ['Ocean','Underwater without reefs','Village','maps/Ocean/Underwater without reefs/Ocean_Underwater_without_reefs_merfolk_village.png'],
    ['Plains','Farming','Capital City','maps/Plains/Farming/plains_farming_capital_city.png'],
    ['Plains','Farming','City','maps/Plains/Farming/plains_farming_city.png'],
    ['Plains','Farming','Town','maps/Plains/Farming/plains_farming_town.png'],
    ['Plains','Grassland','Capital City','maps/Plains/Grassland/Grassland_capital_city.png'],
    ['Plains','Grassland','City','maps/Plains/Grassland/Grassland_city.png'],
    ['Plains','Grassland','Town','maps/Plains/Grassland/Grassland_town.png'],
    ['Plains','Grassland','Village','maps/Plains/Grassland/Grassland_village.png'],
    ['Plains','Hybrid farming forest grassland','Capital City','maps/Plains/Hybrid farming forest grassland/plains_hybrid_farming_forest_grassland_capital_city.png'],
    ['Plains','Hybrid farming forest grassland','City','maps/Plains/Hybrid farming forest grassland/plains_hybrid_farming_forest_grassland_city.png'],
    ['Plains','Hybrid farming forest grassland','Town','maps/Plains/Hybrid farming forest grassland/plains_hybrid_farming_forest_grassland_town.png'],
    ['Plains','Prairie','Capital City','maps/Plains/Prairie/Prairie_capital_city.png'],
    ['Plains','Prairie','City','maps/Plains/Prairie/Prairie_city.png'],
    ['Plains','Prairie','Town','maps/Plains/Prairie/Prairie_town.png'],
    ['Plains','Prairie','Village','maps/Plains/Prairie/Prairie_village.png'],
    ['Rainforest','Deep forest','Capital City','maps/Rainforest/Deep forest/Rainforest 1 - Deep forest - Capital city.png'],
    ['Rainforest','Deep forest','City','maps/Rainforest/Deep forest/Rainforest 1 - Deep forest - City.png'],
    ['Rainforest','Deep forest','Town','maps/Rainforest/Deep forest/Rainforest 1 - Deep forest - Town.png'],
    ['Rainforest','Deep forest','Village','maps/Rainforest/Deep forest/Rainforest 1 - Deep forest - Village.png'],
    ['Rainforest','Hybrid tree and forest floor','City','maps/Rainforest/Hybrid tree and forest floor/rainforest_2_hybrid_tree_and_forest_floor_city.png'],
    ['Rainforest','Hybrid tree and forest floor','Town','maps/Rainforest/Hybrid tree and forest floor/rainforest_2_hybrid_tree_and_forest_floor_town.png'],
    ['Rainforest','Hybrid tree and forest floor','Village','maps/Rainforest/Hybrid tree and forest floor/rainforest_2_hybrid_tree_and_forest_floor_village.png'],
    ['Rainforest','Marshes and swamps','City','maps/Rainforest/Marshes and swamps/rainforest_2_marshes_and_swamps_city.png'],
    ['Rainforest','Marshes and swamps','Town','maps/Rainforest/Marshes and swamps/rainforest_2_marshes_and_swamps_town.png'],
    ['Rainforest','Marshes and swamps','Village','maps/Rainforest/Marshes and swamps/rainforest_2_marshes_and_swamps_village.png'],
    ['Rainforest','Partial forest','Capital City','maps/Rainforest/Partial forest/Rainforest 1 - Partial forest - Capital city.png'],
    ['Rainforest','Partial forest','City','maps/Rainforest/Partial forest/Rainforest 1 - Partial forest - City.png'],
    ['Rainforest','Partial forest','Town','maps/Rainforest/Partial forest/Rainforest 1 - Partial forest - Town.png'],
    ['Rainforest','Partial forest','Village','maps/Rainforest/Partial forest/Rainforest 1 - Partial forest - Village.png'],
    ['Rainforest','Treetops','City','maps/Rainforest/Treetops/rainforest_2_treetops_treehouses_city.png'],
    ['Rainforest','Treetops','Town','maps/Rainforest/Treetops/rainforest_2_treetops_treehouses_town.png'],
    ['Rainforest','Treetops','Village','maps/Rainforest/Treetops/rainforest_2_treetops_treehouses_village.png']
  ].map(([biome,variant,size,path])=>({biome,variant,size,path,search:(biome+' '+variant+' '+size+' '+path).toLowerCase()}));

  function normSize(size){
    const v=String(size||'Village').toLowerCase();
    if(v.includes('capital')) return 'Capital City';
    if(v.includes('city')) return 'City';
    if(v.includes('town')) return 'Town';
    return 'Village';
  }
  function lowerArray(v){ return (Array.isArray(v)?v:(v?[v]:[])).map(x=>String(x||'').toLowerCase()); }
  function settlementHintText(s){
    return [s?.name,s?.pinType,s?.type,s?.danger,s?.notes,...lowerArray(s?.settlementTags),...lowerArray(s?.tags),...lowerArray(s?.transportation),...lowerArray(s?.publicTransportation),...lowerArray(s?.raceCategories),...lowerArray(s?.races),...lowerArray(s?.godsWorshipped)].join(' ').toLowerCase();
  }
  function scanSummary(scan){
    const records=(scan&&Array.isArray(scan.records)?scan.records:[]).slice(0,8);
    const types=records.map(r=>String(r.type||r.feature||'').toLowerCase());
    return {records,types,text:[scan?.dominantTerrain,...(scan?.detectedFeatureTypes||[]),...records.map(r=>r.feature+' '+r.type)].join(' ').toLowerCase(),waterPercent:(scan&&scan.totalScannedAreaSqMi?((scan.waterAreaSqMi||0)/Math.max(1,scan.totalScannedAreaSqMi))*100:0)};
  }
  function hasAny(text, words){ return words.some(w=>text.includes(w)); }
  function scoreCatalogCandidate(candidate, desiredSize, hint, scanInfo){
    let score=0;
    if(candidate.size===desiredSize) score+=500;
    else if(desiredSize==='Village' && !candidate.path.toLowerCase().includes('village')) score-=160;
    else score-=90;
    const c=candidate.search;
    const scanText=scanInfo.text;
    if(hasAny(hint,['merfolk','underwater','aquatic','submerged'])) score += c.includes('underwater') ? 360 : (c.includes('ocean') ? 80 : -80);
    if(hasAny(hint,['floating','float','ship','harbor','dock','port','ferry'])) score += c.includes('ocean surface') || c.includes('coastal') ? 180 : 0;
    if(hasAny(hint,['reef','coral','shallows']) || scanText.includes('reef')) score += c.includes('reef') ? 260 : 0;
    if(hasAny(hint,['farm','farming','agriculture','crop','ranch'])) score += c.includes('farming') ? 260 : (c.includes('grassland')||c.includes('prairie') ? 70 : 0);
    if(hasAny(hint,['treehouse','treetop','canopy'])) score += c.includes('treetop') ? 260 : 0;
    if(hasAny(hint,['cavern','cave','underdark','deep cavern'])) score += c.includes('deep cavern') ? 300 : 0;
    if(hasAny(hint,['mountain','mine','mining','cliff','peak'])) score += c.includes('mountain') || c.includes('cavern') || c.includes('valley') ? 180 : 0;
    if(hasAny(hint,['marsh','swamp','bog','wetland'])) score += c.includes('marsh') || c.includes('swamp') ? 260 : 0;
    if(hasAny(hint,['forest','wood','grove','sylvan'])) score += c.includes('forest') || c.includes('tree') ? 160 : 0;
    if(scanInfo.waterPercent>45) score += c.includes('ocean') ? 190 : (c.includes('coastal') ? 120 : -80);
    if(scanInfo.waterPercent>15 && scanInfo.waterPercent<=45) score += c.includes('coastal') ? 150 : 0;
    for(const r of scanInfo.records){
      const t=String(r.type||'').toLowerCase(), pct=+(r.percentOfProvince||0);
      if(t==='forest') score += (c.includes('forest')||c.includes('tree')) ? pct*5 : 0;
      if(t==='grassland' || t==='plateau') score += (c.includes('grassland')||c.includes('plains')||c.includes('prairie')) ? pct*5 : 0;
      if(t==='mountain' || t==='hill') score += (c.includes('mountain')||c.includes('cavern')||c.includes('valley')) ? pct*5 : 0;
      if(t==='valley') score += c.includes('valley') ? pct*7 : 0;
      if(t==='marsh' || t==='delta') score += (c.includes('marsh')||c.includes('swamp')) ? pct*7 : 0;
      if(t==='coast' || t==='river' || t==='lake') score += c.includes('coastal') || c.includes('water') ? pct*4 : 0;
      if(t==='reef') score += c.includes('reef') ? pct*8 : 0;
      if(t==='water') score += c.includes('ocean') ? pct*4 : 0;
    }
    if(scanText.includes('forest') && c.includes('rainforest')) score += 15;
    return score;
  }
  function findNearestAvailableSize(desired, scored){
    const ordered = desired==='Capital City' ? ['Capital City','City','Town','Village'] : desired==='City' ? ['City','Capital City','Town','Village'] : desired==='Town' ? ['Town','City','Village','Capital City'] : ['Village','Town','City','Capital City'];
    for(const size of ordered){ const hit=scored.find(x=>x.candidate.size===size); if(hit) return hit; }
    return scored[0] || null;
  }
  function suggestSettlementMapImage(p,s){
    try{
      if(p && !p.terrainScan && typeof scanProvinceTerrain==='function'){
        try{ scanProvinceTerrain(p,{step:parseInt((document.getElementById('scanStep')||{}).value,10)||4, mode:(document.getElementById('scanMode')||{}).value||'hybrid'}); }catch(e){}
      }
      const desiredSize=normSize(s?.pinType||s?.type||s?.size);
      const hint=settlementHintText(s);
      const scanInfo=scanSummary(p?.terrainScan);
      const scored=MAP_IMAGE_CATALOG.map(candidate=>({candidate,score:scoreCatalogCandidate(candidate,desiredSize,hint,scanInfo)})).sort((a,b)=>b.score-a.score);
      const best=findNearestAvailableSize(desiredSize,scored) || {candidate:MAP_IMAGE_CATALOG[0],score:0};
      const alternatives=scored.filter(x=>x.candidate.path!==best.candidate.path).slice(0,4).map(x=>({biome:x.candidate.biome,variant:x.candidate.variant,settlementType:x.candidate.size,path:x.candidate.path,score:+x.score.toFixed(2)}));
      const reason=[];
      reason.push('Requested settlement type: '+desiredSize+'.');
      if(p?.terrainScan){ reason.push('Province scan dominant terrain: '+(p.terrainScan.dominantTerrain||'Unknown')+'.'); }
      if(scanInfo.waterPercent>0) reason.push('Province scan water coverage: '+scanInfo.waterPercent.toFixed(2)+'%.');
      const topTerrains=scanInfo.records.slice(0,4).map(r=>(r.feature||r.type)+' '+(r.percentOfProvince||0)+'%').join(', ');
      if(topTerrains) reason.push('Top terrain records: '+topTerrains+'.');
      if(hint) reason.push('Settlement metadata/tags were included in scoring.');
      return {version:IMAGE_SUGGESTION_VERSION,biome:best.candidate.biome,variant:best.candidate.variant,settlementType:best.candidate.size,path:best.candidate.path,fileName:best.candidate.path.split('/').pop(),score:+best.score.toFixed(2),reason:reason.join(' '),alternatives};
    }catch(err){
      return {version:IMAGE_SUGGESTION_VERSION,biome:'Plains',variant:'Grassland',settlementType:normSize(s?.pinType||s?.type),path:'maps/Plains/Grassland/Grassland_village.png',fileName:'Grassland_village.png',score:0,reason:'Fallback suggestion because image matching failed: '+(err&&err.message?err.message:err),alternatives:[]};
    }
  }
  window.BELAVADOS_SETTLEMENT_MAP_IMAGE_CATALOG = MAP_IMAGE_CATALOG;
  window.suggestSettlementMapImage = suggestSettlementMapImage;

  const previousSettlementExportData = window.settlementExportData || (typeof settlementExportData==='function' ? settlementExportData : null);
  if(previousSettlementExportData){
    window.settlementExportData = settlementExportData = function(p,s){
      const data = previousSettlementExportData(p,s);
      const suggestion = suggestSettlementMapImage(p,s);
      data.suggestedMapImage = suggestion;
      data.suggestedMapImagePath = suggestion.path;
      data.suggestedMapImageFileName = suggestion.fileName;
      data.suggestedMapImageReason = suggestion.reason;
      return data;
    };
  }

  const previousMakeSettlementHtml = window.makeSettlementHtml || (typeof makeSettlementHtml==='function' ? makeSettlementHtml : null);
  if(previousMakeSettlementHtml){
    window.makeSettlementHtml = makeSettlementHtml = function(p,s){
      let html = previousMakeSettlementHtml(p,s);
      const data = (window.settlementExportData||settlementExportData)(p,s);
      const img = data.suggestedMapImage || suggestSettlementMapImage(p,s);
      const block = '<section class="builder-card"><h2>Suggested Settlement Map Image</h2>'+
        '<p>This recommendation is generated during province ZIP export from the province terrain scan plus this settlement\'s type, tags, races, transportation, danger, and notes.</p>'+
        '<dl class="builder-dl">'+
        '<dt>Suggested path</dt><dd><code>'+escapeHtml(img.path)+'</code></dd>'+
        '<dt>Biome</dt><dd>'+escapeHtml(img.biome)+'</dd>'+
        '<dt>Variant</dt><dd>'+escapeHtml(img.variant)+'</dd>'+
        '<dt>Matched settlement type</dt><dd>'+escapeHtml(img.settlementType)+'</dd>'+
        '<dt>Reason</dt><dd>'+escapeHtml(img.reason)+'</dd>'+
        '</dl></section>';
      if(html.includes('<h2>Embedded Settlement Data JSON</h2>')) return html.replace('<h2>Embedded Settlement Data JSON</h2>', block+'<h2>Embedded Settlement Data JSON</h2>');
      return html.replace('</main>', block+'</main>');
    };
  }

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
      const manifest={exportedAt:new Date().toISOString(),rootFolder:root,province:p.name,provinceFolder:pdir,imageSuggestionVersion:IMAGE_SUGGESTION_VERSION,mapImageCatalogRoot:'maps/',settlements:[]};
      files.push({name:pdir+'/province_overview.docx',content:makeProvinceDocx(p),binary:true});
      files.push({name:pdir+'/province.json',content:JSON.stringify({province:p.name,metadata:metaForProvince(p),data:provinceData,mapImageCatalogRoot:'maps/',imageSuggestionVersion:IMAGE_SUGGESTION_VERSION},null,2)});
      files.push({name:pdir+'/README.txt',content:'Province-only information export for '+p.name+'. This ZIP is generated only from the currently opened province map. Each settlement has its own subfolder containing a DOCX description, an HTML file, a JSON data file, and a suggested_map_image.txt file. The suggested map image is a path inside your maps/ directory chosen from the province terrain scan and settlement metadata; the PNG itself is not copied into the ZIP unless it already exists in a generated settlement/template workflow.'});
      const used=new Set();
      (p.settlements||[]).forEach((s,idx)=>{
        const fname=settlementHtmlFileName(p,s,used);
        s.htmlFileName=s.htmlFileName||fname;
        const stem=fname.replace(/\.html$/i,'');
        const sdir=pdir+'/settlements/'+safeHtmlName((s.name||('Settlement_'+(idx+1)))+'_'+stem);
        const data=(window.settlementExportData||settlementExportData)(p,s);
        const img=data.suggestedMapImage || suggestSettlementMapImage(p,s);
        files.push({name:sdir+'/'+fname,content:makeSettlementHtml(p,s)});
        files.push({name:sdir+'/'+stem+'_description.docx',content:makeSettlementDocx(p,s),binary:true});
        files.push({name:sdir+'/'+stem+'.json',content:JSON.stringify(data,null,2)});
        files.push({name:sdir+'/suggested_map_image.txt',content:'Suggested map image for '+(s.name||'Unnamed Settlement')+'\n\nPath: '+img.path+'\nFile: '+img.fileName+'\nBiome: '+img.biome+'\nVariant: '+img.variant+'\nMatched settlement type: '+img.settlementType+'\nScore: '+img.score+'\n\nReason: '+img.reason+'\n'});
        manifest.settlements.push({settlement:s.name||'Unnamed Settlement',folder:sdir,sourceId:s.id||null,htmlFileName:fname,docxFileName:stem+'_description.docx',jsonFileName:stem+'.json',suggestedMapImagePath:img.path,suggestedMapImageFileName:img.fileName,suggestedMapImage:img,latitude:data.latitude,longitude:data.longitude});
      });
      files.unshift({name:root+'/manifest.json',content:JSON.stringify(manifest,null,2)});
      download(safeHtmlName(p.name)+'_Province_Information.zip', makeZip(files), 'application/zip');
    }catch(err){
      console.error(err);
      alert('Province ZIP export failed: '+(err && err.message ? err.message : err));
    }
  };
  const zipBtn=document.getElementById('exportProvinceZip');
  if(zipBtn) zipBtn.onclick=exportProvinceZip;
})();



/* Final merged all-site JSON export override: save as dm_map.json. */
(function(){
  'use strict';
  function $(id){return document.getElementById(id);}
  function safeCall(fn){try{ if(typeof fn==='function') fn({silent:true}); }catch(e){ console.warn(e); }}
  function buildAllSiteData(){
    const serialized=(typeof window.serialize==='function') ? window.serialize() : (typeof serialize==='function' ? serialize() : {});
    const bootstrap=window.BELAVADOS_DM_MAP_BOOTSTRAP || null;
    const committed=(window.BelavadosPlayerMapCommit && window.BelavadosPlayerMapCommit.key) ? (function(){try{return JSON.parse(localStorage.getItem(window.BelavadosPlayerMapCommit.key)||'null');}catch(e){return null;}})() : null;
    return {
      kind:'BelavadosUnifiedEditorViewerStudioExport',
      version:5,
      exportedAt:new Date().toISOString(),
      exportFileName:'dm_map.json',
      dmEditorData:serialized,
      playerViewerSeed:bootstrap ? (bootstrap.playerSeedData || {provinces:bootstrap.provinces||[],items:bootstrap.items||[]}) : (window.BELAVADOS_PLAYER_SEED || null),
      committedPlayerMap:committed,
      splitFiles:['belavados_map_PLAYER.html','map.js','functions.js','import.js','export.js','player.css','dm.css','dm_map.json','time-tacking.js','npc-tracking.js']
    };
  }
  function saveDmMapJson(){
    safeCall(window.scanAllProvinceTerrain || (typeof scanAllProvinceTerrain!=='undefined' ? scanAllProvinceTerrain : null));
    safeCall(window.scanSavedSettlementsForExport || (typeof scanSavedSettlementsForExport!=='undefined' ? scanSavedSettlementsForExport : null));
    const data=JSON.stringify(buildAllSiteData(),null,2);
    const box=$('dataBox'); if(box) box.value=data;
    if(typeof window.download==='function') window.download('dm_map.json',data,'application/json');
    else if(typeof download==='function') download('dm_map.json',data,'application/json');
  }
  function install(){
    const btn=$('exportJson');
    if(btn){ btn.textContent='Export JSON of All Site Data'; btn.onclick=saveDmMapJson; }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(install,0)); else setTimeout(install,0);
  setTimeout(install,250);
  setTimeout(install,1000);
  window.BelavadosExportBridge={buildAllSiteData,saveDmMapJson};
})();
