'use strict';
/*
 * TableGate Hierarchical Map Foundry
 * Copyright (C) 2026 William Saville / The Transgender T-Rex
 *
 * This module is distributed under GPL-3.0-or-later because its seeded name-chain
 * and settlement topology approach are adapted from the GPL-3.0 TownGeneratorOS
 * source by watabou. See docs/licenses/TownGeneratorOS_GPL-3.0.txt and the in-app
 * Data & Sources tab. The continent and climate pipeline is an original browser-
 * native implementation informed by, but not copied from, Azgaar FMG and Red Blob
 * Games' published map-generation explanations.
 */
(()=>{
const LEVELS=['world','continent','country','kingdom','settlement'];
const LABELS={world:'World',continent:'Continent',country:'Country',kingdom:'Kingdom / Realm',settlement:'Settlement'};
const CHILD={world:'continent',continent:'country',country:'kingdom',kingdom:'settlement',settlement:''};
const BIOMES=[['Ocean','#163a57'],['Deep Ocean','#10293e'],['Plains','#91a65b'],['Forest','#3f714d'],['Desert','#c7a75b'],['Hills','#8d825d'],['Mountains','#777b80'],['Wetlands','#527b70'],['Tundra','#a7b5ad']];
const escAttr=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function hashSeed(value){let h=2166136261>>>0;for(const c of String(value)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
class RNG{constructor(seed){this.s=hashSeed(seed)||0x9e3779b9}next(){let x=this.s;x^=x<<13;x^=x>>>17;x^=x<<5;this.s=x>>>0;return this.s/4294967296}int(a,b){return Math.floor(this.next()*(b-a+1))+a}pick(a){return a[this.int(0,a.length-1)]}chance(p){return this.next()<p}}
/* Algorithmic adaptation of TownGeneratorOS MarkovChain.hx, rewritten in JS. */
class MarkovNames{
 constructor(samples,order=2){this.order=order;this.chain=new Map();samples.forEach(name=>this.feed(name))}
 feed(name){const padded='^'.repeat(this.order)+String(name).toLowerCase()+'$';for(let i=0;i<=padded.length-this.order-1;i++){const key=padded.slice(i,i+this.order),next=padded[i+this.order];if(!this.chain.has(key))this.chain.set(key,[]);this.chain.get(key).push(next)}}
 make(rng,min=4,max=12){for(let attempt=0;attempt<40;attempt++){let key='^'.repeat(this.order),out='';for(let i=0;i<max+4;i++){const options=this.chain.get(key)||['$'];const next=rng.pick(options);if(next==='$')break;out+=next;key=(key+next).slice(-this.order)}if(out.length>=min)return out[0].toUpperCase()+out.slice(1)}return 'Unnamed'}
}
const NAME_SAMPLES=['Aurelian','Belavados','Zembiscrest','Maroubra','Eldermere','Ravensfall','Thornwick','Ashenford','Moonwake','Nannara','Horundar','Silverreach','Greenheart','Stormhorn','Deepbloom','Crownspire','Larkhaven','Sunward','Duskharbor','Wolfrest','Kestrel','Ironvale','Mossgate','Starfall','Vespera','Caelwyn','Orinth','Thalunesh','Freyseth','Eirzunet'];
const Names=new MarkovNames(NAME_SAMPLES,2);
function key(){return `mapFoundry.v5.${CampaignIsolation.serverId()}`}
function fresh(){return{version:5,maps:{},activeId:'',updatedAt:new Date().toISOString()}}
function load(){const data=Store.get(key(),null);return data&&data.maps?data:fresh()}
function save(data){data.updatedAt=new Date().toISOString();Store.set(key(),data);try{API.call('saveMapFoundry',{serverId:CampaignIsolation.serverId(),data}).catch(()=>{})}catch(_){}}
function polar(cx,cy,r,a){return[cx+Math.cos(a)*r,cy+Math.sin(a)*r]}
function blobPoints(rng,cx,cy,rx,ry,count=20,rough=.3){const pts=[];for(let i=0;i<count;i++){const a=Math.PI*2*i/count;const wobble=1+(rng.next()-.5)*rough*2;const p=polar(cx,cy,1,a);pts.push([cx+(p[0]-cx)*rx*wobble,cy+(p[1]-cy)*ry*wobble])}return pts}
function smoothPath(points){if(!points.length)return'';const mids=points.map((p,i)=>[(p[0]+points[(i+1)%points.length][0])/2,(p[1]+points[(i+1)%points.length][1])/2]);let d=`M${mids[mids.length-1][0].toFixed(1)},${mids[mids.length-1][1].toFixed(1)}`;for(let i=0;i<points.length;i++)d+=` Q${points[i][0].toFixed(1)},${points[i][1].toFixed(1)} ${mids[i][0].toFixed(1)},${mids[i][1].toFixed(1)}`;return d+' Z'}
function polygonPath(points){return'M'+points.map(p=>p.map(x=>x.toFixed(1)).join(',')).join(' L')+' Z'}
function colorFor(rng,i){const palette=['#6f9850','#8c8e59','#4f7e64','#aa8a4c','#657f8b','#81705a','#588b83','#93736b','#7a8d55'];return palette[i%palette.length]}
function scopeCounts(scope,detail){const scale=Math.max(1,Math.min(10,Number(detail)||5));return scope==='world'?rngRange(scale,3,8):scope==='continent'?rngRange(scale,4,13):scope==='country'?rngRange(scale,4,12):scope==='kingdom'?rngRange(scale,5,16):rngRange(scale,7,20)}
function rngRange(scale,min,max){return Math.round(min+(max-min)*(scale-1)/9)}
function coastDecor(rng){let out='';for(let i=0;i<18;i++){const x=rng.int(40,960),y=rng.int(35,610),r=rng.int(1,4);out+=`<circle cx="${x}" cy="${y}" r="${r}" fill="#b5e4e8" opacity="${(.08+rng.next()*.12).toFixed(2)}"/>`}return out}
function generateRegional(map,rng){
 const count=scopeCounts(map.scope,map.detail),main=blobPoints(rng,500,325,420,255,34,.22),clipId='land_'+map.id.replace(/[^a-z0-9]/gi,'');
 let regions='',labels='',rivers='',mountains='';
 for(let i=0;i<count;i++){
  const angle=Math.PI*2*i/count+rng.next()*.5,ring=i%3,rad=80+ring*90+rng.next()*60,cx=500+Math.cos(angle)*rad,cy=325+Math.sin(angle)*rad*.7,rx=rng.int(100,190),ry=rng.int(70,140),pts=blobPoints(rng,cx,cy,rx,ry,rng.int(10,18),.34),name=Names.make(rng),fill=colorFor(rng,i);
  regions+=`<path d="${smoothPath(pts)}" fill="${fill}" stroke="#293426" stroke-width="2" opacity=".92"><title>${escAttr(name)}</title></path>`;
  labels+=`<text x="${cx.toFixed(0)}" y="${cy.toFixed(0)}" text-anchor="middle" class="region-label">${escAttr(name)}</text>`;
  if(rng.chance(.65)){const x2=cx+rng.int(-70,70),y2=cy+rng.int(60,130);rivers+=`<path d="M${cx.toFixed(0)},${(cy-70).toFixed(0)} Q${x2.toFixed(0)},${cy.toFixed(0)} ${x2.toFixed(0)},${y2.toFixed(0)}" fill="none" stroke="#5bb8d1" stroke-width="3" opacity=".8"/>`}
  if(rng.chance(.55)){for(let m=0;m<rng.int(2,6);m++){const mx=cx+rng.int(-55,55),my=cy+rng.int(-45,45);mountains+=`<path d="M${mx-9},${my+9} L${mx},${my-12} L${mx+10},${my+9} Z" fill="#666d6b" stroke="#303638"/><path d="M${mx-4},${my-1} L${mx},${my-12} L${mx+5},${my-1}" fill="#dce8e7"/>`}}
 }
 const child=CHILD[map.scope],markers=[];if(child){for(let i=0;i<Math.max(3,Math.floor(count*.7));i++)markers.push({id:uid(),name:Names.make(rng),scope:child,x:rng.int(160,840),y:rng.int(130,530)})}
 const markerSvg=markers.map(m=>`<g class="map-marker" data-child-name="${escAttr(m.name)}" data-child-scope="${m.scope}" transform="translate(${m.x} ${m.y})"><circle r="8" fill="#fff6c4" stroke="#5a3010" stroke-width="3"/><path d="M0,8 L0,22" stroke="#5a3010" stroke-width="3"/><text y="38" text-anchor="middle">${escAttr(m.name)}</text></g>`).join('');
 const d=smoothPath(main);
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 650" role="img" aria-label="${escAttr(map.name)} ${LABELS[map.scope]} map"><defs><linearGradient id="sea_${clipId}" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#1d536c"/><stop offset="1" stop-color="#0e293e"/></linearGradient><filter id="shadow_${clipId}"><feDropShadow dx="0" dy="5" stdDeviation="7" flood-opacity=".45"/></filter><clipPath id="${clipId}"><path d="${d}"/></clipPath></defs><rect width="1000" height="650" fill="url(#sea_${clipId})"/>${coastDecor(rng)}<path d="${d}" fill="#708c58" stroke="#d6c78d" stroke-width="7" filter="url(#shadow_${clipId})"/><g clip-path="url(#${clipId})">${regions}${rivers}${mountains}<g class="map-labels">${labels}</g>${markerSvg}</g><g class="cartouche"><rect x="28" y="24" width="380" height="72" rx="9" fill="#f6ebc9" stroke="#6a451c" stroke-width="3"/><text x="48" y="57" class="map-title">${escAttr(map.name)}</text><text x="48" y="80" class="map-subtitle">${LABELS[map.scope]} · seed ${escAttr(map.seed)}</text></g><style>.region-label,.map-marker text{font:700 13px Georgia,serif;paint-order:stroke;stroke:#f3ecd4;stroke-width:3px;stroke-linejoin:round;fill:#17211a}.map-title{font:900 27px Georgia,serif;fill:#39220e}.map-subtitle{font:700 13px sans-serif;fill:#604321}.map-marker{cursor:pointer}</style></svg>`;
 return {
  svg, markers, regions:count,
  geojson:{type:'FeatureCollection',features:[{
   type:'Feature',properties:{name:map.name,scope:map.scope},
   geometry:{type:'Polygon',coordinates:[[...main,main[0]].map(p=>[+p[0].toFixed(3),+p[1].toFixed(3)])]}
  }]}
 };
}
function generateWorld(map,rng){
 const count=scopeCounts('world',map.detail),continents=[],paths=[],labels=[],markers=[];
 const slots=[[260,220],[600,180],[770,380],[400,430],[150,450],[550,350],[850,180],[300,350]];
 for(let i=0;i<count;i++){const [cx,cy]=slots[i%slots.length],pts=blobPoints(rng,cx+rng.int(-35,35),cy+rng.int(-30,30),rng.int(100,190),rng.int(70,140),rng.int(16,28),.36),name=Names.make(rng);continents.push({name,points:pts});paths.push(`<path d="${smoothPath(pts)}" fill="${colorFor(rng,i)}" stroke="#d5c58a" stroke-width="5"><title>${escAttr(name)}</title></path>`);labels.push(`<text x="${cx}" y="${cy}" text-anchor="middle" class="world-label">${escAttr(name)}</text>`);markers.push({id:uid(),name,scope:'continent',x:cx,y:cy})}
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 650"><defs><radialGradient id="worldSea"><stop stop-color="#28637b"/><stop offset="1" stop-color="#0d2539"/></radialGradient></defs><rect width="1000" height="650" fill="url(#worldSea)"/>${coastDecor(rng)}<g>${paths.join('')}</g>${labels.join('')}<path d="M40,540 Q230,490 430,548 T820,530 T980,555" fill="none" stroke="#7cc3d0" stroke-width="2" stroke-dasharray="8 8" opacity=".5"/><rect x="28" y="24" width="400" height="74" rx="9" fill="#f6ebc9" stroke="#6a451c" stroke-width="3"/><text x="48" y="58" class="map-title">${escAttr(map.name)}</text><text x="48" y="82" class="map-subtitle">World · ${count} continents · seed ${escAttr(map.seed)}</text><style>.world-label{font:900 18px Georgia,serif;paint-order:stroke;stroke:#f3ecd4;stroke-width:4px;fill:#17211a}.map-title{font:900 28px Georgia,serif;fill:#39220e}.map-subtitle{font:700 13px sans-serif;fill:#604321}</style></svg>`;
 return {
  svg, markers, regions:count,
  geojson:{type:'FeatureCollection',features:continents.map(c=>({
   type:'Feature',properties:{name:c.name,scope:'continent'},
   geometry:{type:'Polygon',coordinates:[[...c.points,c.points[0]].map(p=>[+p[0].toFixed(3),+p[1].toFixed(3)])]}
  }))}
 };
}
function generateSettlement(map,rng){
 const walls=blobPoints(rng,500,330,365,250,24,.15),center=[500,330],wardCount=scopeCounts('settlement',map.detail),wards=[],roads=[],buildingSvg=[],buildingRecords=[],labels=[],gates=[];
 const buildingFunctions=[
  ['residence','Residential, Household & Social Care',['home','sleep','family']],['market','Trade, Exchange & Distribution',['market','trade','shop']],
  ['workshop','Production, Craft, Repair & Fabrication',['workplace','craft','repair']],['hospitality','Food, Drink, Lodging & Hospitality',['inn','food','lodging']],
  ['health','Health, Medicine, Recovery & Specialized Treatment',['clinic','healer','medicine']],['knowledge','Education, Research, Records & Knowledge',['library','school','archive']],
  ['governance','Governance, Civic & Command',['council','watch','records']],['community','Belief, Ritual, Philosophy & Community',['temple','community','ritual']],
  ['transport','Transportation, Routes & Logistics',['station','dock','stable']],['environment','Environment, Conservation & Undeveloped Space',['garden','park']]
 ];
 const angles=Array.from({length:wardCount},(_,i)=>Math.PI*2*i/wardCount+(rng.next()-.5)*.12);
 for(let i=0;i<wardCount;i++){
  const a1=angles[i],a2=angles[(i+1)%wardCount]||(Math.PI*2+angles[0]),inner=rng.int(35,85),outer=rng.int(210,330),p1=polar(...center,inner,a1),p2=polar(...center,outer,a1),pm=polar(...center,outer+rng.int(-25,25),(a1+a2)/2),p3=polar(...center,outer,a2),p4=polar(...center,inner,a2),name=Names.make(rng),pts=[p1,p2,pm,p3,p4],ward={id:uid(),name,points:pts};wards.push(ward);labels.push(`<text x="${polar(...center,(inner+outer)*.55,(a1+a2)/2)[0].toFixed(0)}" y="${polar(...center,(inner+outer)*.55,(a1+a2)/2)[1].toFixed(0)}" text-anchor="middle">${escAttr(name)}</text>`);roads.push(`<path d="M500,330 L${p2[0].toFixed(0)},${p2[1].toFixed(0)}"/>`);
  for(let b=0;b<rng.int(8,18);b++){
   const a=a1+rng.next()*(a2-a1),r=inner+20+rng.next()*(outer-inner-45),[x,y]=polar(...center,r,a),w=rng.int(8,18),h=rng.int(6,14),rot=Math.round(a*180/Math.PI+90),type=b===0?buildingFunctions[(i+1)%buildingFunctions.length]:rng.pick(buildingFunctions),bid=uid(),displayName=`${name} ${type[0][0].toUpperCase()+type[0].slice(1)} ${b+1}`;
   const rad=rot*Math.PI/180,cs=Math.cos(rad),sn=Math.sin(rad),corners=[[-w/2,-h/2],[w/2,-h/2],[w/2,h/2],[-w/2,h/2]].map(([dx,dy])=>[x+dx*cs-dy*sn,y+dx*sn+dy*cs]);
   buildingRecords.push({id:bid,name:displayName,wardId:ward.id,wardName:name,type:type[0],functionalCategory:type[1],points:corners.map(([px,py])=>({x:+px.toFixed(3),y:+py.toFixed(3)})),capacity:rng.int(2,24),tags:[...type[2]],services:[],residents:[],workers:[],visitors:[],access:'public',locked:false,provenance:{source:'map-foundry-procedural',seed:map.seed,createdAt:new Date().toISOString()}});
   buildingSvg.push(`<rect data-building-id="${bid}" x="${(x-w/2).toFixed(1)}" y="${(y-h/2).toFixed(1)}" width="${w}" height="${h}" rx="1" transform="rotate(${rot} ${x.toFixed(1)} ${y.toFixed(1)})"><title>${escAttr(displayName)} · ${escAttr(type[1])}</title></rect>`)
  }
  if(i%Math.max(1,Math.floor(wardCount/4))===0){const [gx,gy]=p2;gates.push(`<g transform="translate(${gx.toFixed(0)} ${gy.toFixed(0)})"><circle r="9" fill="#d7a742" stroke="#4a2d10" stroke-width="3"/><title>${escAttr(name)} Gate</title></g>`)}
 }
 const wardSvg=wards.map((w,i)=>`<path d="${polygonPath(w.points)}" fill="${colorFor(rng,i)}" stroke="#5d492f" stroke-width="2"><title>${escAttr(w.name)} Ward</title></path>`).join('');
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 650"><rect width="1000" height="650" fill="#b4a875"/><path d="M0,90 Q240,40 430,100 T1000,85 V0 H0Z" fill="#4f758c" opacity=".85"/><path d="${smoothPath(walls)}" fill="#d8c995" stroke="#4e4433" stroke-width="14"/>${wardSvg}<g class="roads">${roads.join('')}</g><g class="buildings">${buildingSvg.join('')}</g><circle cx="500" cy="330" r="66" fill="#d2b96c" stroke="#5b4024" stroke-width="5"/><rect x="468" y="298" width="64" height="64" fill="#8a6341" stroke="#3e2a1c" stroke-width="4"/><g class="gates">${gates.join('')}</g><g class="labels">${labels.join('')}</g><rect x="24" y="20" width="410" height="75" rx="8" fill="#f6ebc9" stroke="#6a451c" stroke-width="3"/><text x="45" y="55" class="title">${escAttr(map.name)}</text><text x="45" y="79" class="subtitle">Settlement · ${wardCount} wards · ${buildingRecords.length} semantic buildings · seed ${escAttr(map.seed)}</text><style>.roads path{fill:none;stroke:#e8dfbd;stroke-width:8;stroke-linecap:round}.buildings rect{fill:#7b4b34;stroke:#321d15;stroke-width:1}.buildings rect:hover{fill:#9b6b4f;stroke:#00ffff;stroke-width:2}.labels text{font:800 12px Georgia,serif;paint-order:stroke;stroke:#f4efd9;stroke-width:3px;fill:#2d2115}.title{font:900 27px Georgia,serif;fill:#39220e}.subtitle{font:700 13px sans-serif;fill:#604321}</style></svg>`;
 const wardFeatures=wards.map(w=>({type:'Feature',properties:{name:w.name,scope:'ward',semanticType:'DISTRICT',linkedEntityType:'WARD',linkedEntityId:w.id},geometry:{type:'Polygon',coordinates:[[...w.points,w.points[0]].map(p=>[+p[0].toFixed(3),+p[1].toFixed(3)])]}}));
 const buildingFeatures=buildingRecords.map(b=>({type:'Feature',properties:{name:b.name,scope:'building',semanticType:'BUILDING',linkedEntityType:'LOCATION',linkedEntityId:b.id,wardId:b.wardId,wardName:b.wardName,functionalCategory:b.functionalCategory,buildingType:b.type,capacity:b.capacity,tags:b.tags,services:b.services,residents:b.residents,workers:b.workers,visitors:b.visitors,access:b.access,locked:b.locked,provenance:b.provenance},geometry:{type:'Polygon',coordinates:[[...b.points,b.points[0]].map(p=>[p.x,p.y])]}}));
 return {svg,markers:[],regions:wardCount,wards,buildings:buildingRecords,geojson:{type:'FeatureCollection',features:[...wardFeatures,...buildingFeatures]}};
}
function generate(map){const rng=new RNG(map.seed);return map.scope==='world'?generateWorld(map,rng):map.scope==='settlement'?generateSettlement(map,rng):generateRegional(map,rng)}
function current(){const data=load();return{data,map:data.maps[data.activeId]||null}}
function tree(data){const maps=Object.values(data.maps),children=new Map();maps.forEach(m=>{const p=m.parentId||'root';if(!children.has(p))children.set(p,[]);children.get(p).push(m)});const walk=(id,depth=0)=>(children.get(id)||[]).sort((a,b)=>LEVELS.indexOf(a.scope)-LEVELS.indexOf(b.scope)||a.name.localeCompare(b.name)).map(m=>`<button class="${m.id===data.activeId?'active':''}" data-map-open="${m.id}" style="padding-left:${10+depth*16}px"><span>${'↳ '.repeat(depth)}${esc(m.name)}</span><small>${LABELS[m.scope]}</small></button>${walk(m.id,depth+1)}`).join('');return walk('root')||'<p class="muted">No generated maps yet.</p>'}
function render(){const {data,map}=current(),parents=Object.values(data.maps).filter(m=>m.scope!== 'settlement');return `<div class="map-foundry"><section class="v5-hero"><div><span class="eyebrow">HIERARCHICAL CAMPAIGN CARTOGRAPHY</span><h2>Map Foundry</h2><p>Generate a whole world, drill into a continent, country, kingdom, or individual settlement, then save every level inside the active campaign server. Settlement topology and name-chain techniques are credited in Data & Sources.</p></div><div class="v5-actions"><button data-map-new>New map</button><button data-map-child ${map&&CHILD[map.scope]?'':'disabled'}>Generate child level</button></div></section><div class="map-layout"><aside class="v5-card map-controls"><h3>Generator controls</h3><div class="v5-field"><label>Map level</label><select id="map-scope">${LEVELS.map(x=>`<option value="${x}" ${map?.scope===x?'selected':''}>${LABELS[x]}</option>`).join('')}</select></div><div class="v5-field"><label>Name</label><input id="map-name" value="${esc(map?.name||'')}" placeholder="Generate or enter a name"></div><div class="v5-field"><label>Seed</label><input id="map-seed" value="${esc(map?.seed||Math.floor(Math.random()*1e9))}"></div><div class="v5-field"><label>Parent map</label><select id="map-parent"><option value="">No parent / top level</option>${parents.map(p=>`<option value="${p.id}" ${map?.parentId===p.id?'selected':''}>${esc(p.name)} (${LABELS[p.scope]})</option>`).join('')}</select></div><div class="v5-field"><label>Detail</label><input id="map-detail" type="range" min="1" max="10" value="${map?.detail||6}"></div><div class="v5-actions"><button class="primary" data-map-generate>Generate & Save</button><button data-map-random-name>Random name</button></div><hr><h3>Campaign atlas</h3><div class="map-tree">${tree(data)}</div>${map?`<div class="map-export-row"><button data-map-svg>Download SVG</button><button data-map-geojson>GeoJSON</button><button data-map-json>Map JSON</button><button class="danger" data-map-delete>Delete</button></div>`:''}<div class="v5-note">All map records use the current campaign ID. Switching campaign servers loads a separate atlas.</div></aside><section class="map-canvas-wrap">${map?`<div class="map-canvas" id="map-canvas">${map.svg}</div>`:`<div class="empty-state"><h2>No active map</h2><p>Choose a scale and generate the first map in this campaign atlas.</p></div>`}</section></div></div>`}
function makeMap(scope,parentId='',name=''){const seed=$('#map-seed')?.value||Math.floor(Math.random()*1e9),detail=Number($('#map-detail')?.value||6),rng=new RNG(seed),id=uid();const map={id,serverId:CampaignIsolation.serverId(),scope,parentId,name:name||Names.make(rng),seed:String(seed),detail,createdBy:State.user?.id||'local',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};Object.assign(map,generate(map));return map}
function download(name,content,type='application/json'){const blob=new Blob([content],{type}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1200)}
function bind(shell){
 shell.querySelector('[data-map-new]')?.addEventListener('click',()=>{const data=load();data.activeId='';save(data);Workspace.render()});
 shell.querySelector('[data-map-random-name]')?.addEventListener('click',()=>{$('#map-name').value=Names.make(new RNG($('#map-seed').value||Date.now()))});
 shell.querySelector('[data-map-generate]')?.addEventListener('click',()=>{const data=load(),scope=$('#map-scope').value,parentId=$('#map-parent').value,name=$('#map-name').value.trim(),existing=data.maps[data.activeId];const map=makeMap(scope,parentId,name);if(existing){map.id=existing.id;map.createdAt=existing.createdAt;map.createdBy=existing.createdBy}data.maps[map.id]=map;data.activeId=map.id;save(data);Workspace.render();toast(`${LABELS[scope]} map saved to ${State.server.name}.`,'success')});
 shell.querySelector('[data-map-child]')?.addEventListener('click',()=>{const {data,map}=current();if(!map||!CHILD[map.scope])return;const child=makeMap(CHILD[map.scope],map.id,'');data.maps[child.id]=child;data.activeId=child.id;save(data);Workspace.render()});
 shell.querySelectorAll('[data-map-open]').forEach(b=>b.addEventListener('click',()=>{const data=load();data.activeId=b.dataset.mapOpen;save(data);Workspace.render()}));
 shell.querySelector('[data-map-delete]')?.addEventListener('click',()=>{const {data,map}=current();if(!map||!confirm(`Delete ${map.name} and all child maps?`))return;const remove=new Set([map.id]);let changed=true;while(changed){changed=false;Object.values(data.maps).forEach(m=>{if(remove.has(m.parentId)&&!remove.has(m.id)){remove.add(m.id);changed=true}})}remove.forEach(id=>delete data.maps[id]);data.activeId='';save(data);Workspace.render()});
 const {map}=current();if(map){shell.querySelector('[data-map-svg]')?.addEventListener('click',()=>download(`${map.name.replace(/[^a-z0-9]+/gi,'_')}.svg`,map.svg,'image/svg+xml'));shell.querySelector('[data-map-geojson]')?.addEventListener('click',()=>download(`${map.name.replace(/[^a-z0-9]+/gi,'_')}.geojson`,JSON.stringify(map.geojson,null,2)));shell.querySelector('[data-map-json]')?.addEventListener('click',()=>download(`${map.name.replace(/[^a-z0-9]+/gi,'_')}.json`,JSON.stringify(map,null,2)))}
 shell.querySelectorAll('.map-marker').forEach(marker=>marker.addEventListener('click',()=>{const scope=marker.dataset.childScope,name=marker.dataset.childName;if(!scope)return;const {data,map}=current(),child=makeMap(scope,map.id,name);data.maps[child.id]=child;data.activeId=child.id;save(data);Workspace.render()}));
}
window.TableGateMapFoundry={render,bind,load,generate,labels:LABELS};
})();
