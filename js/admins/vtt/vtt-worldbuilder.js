'use strict';
/*
 * TableGate VTT Worldbuilder
 * Native Canvas/Web Audio implementation. It uses original TableGate code and
 * data contracts; upstream projects are architectural references only and are
 * documented in docs/licenses/vtt-open-source-notices.md.
 */
(()=>{
  const VERSION='8.0.0-vtt-20260731';
  const TOOLS=Object.freeze([
    ['select','↖','Select'],['pan','✥','Pan'],['draw','✎','Freehand'],['line','╱','Line'],
    ['rect','▭','Rectangle'],['polygon','⬠','Polygon'],['building','⌂','Building'],
    ['wall','▥','Wall'],['door','▯','Door'],['light','☀','Light'],['sound','♫','Sound Zone'],
    ['fogReveal','◌','Reveal Fog'],['fogHide','●','Hide Fog'],['erase','⌫','Erase']
  ]);
  const BUILDING_TYPES=Object.freeze([
    ['residence','Residential, Household & Social Care',['home','sleep','family','care']],
    ['workshop','Production, Craft, Repair & Fabrication',['workplace','craft','repair','blacksmith','carpenter','mason','tailor','weaver']],
    ['market','Trade, Exchange & Distribution',['market','trade','shop','vendor','trader']],
    ['hospitality','Food, Drink, Lodging & Hospitality',['inn','cafe','food','drink','lodging','baker','innkeeper']],
    ['health','Health, Medicine, Recovery & Specialized Treatment',['healer','clinic','medicine','apothecary','midwife']],
    ['knowledge','Education, Research, Records & Knowledge',['library','archive','school','teacher','scribe','research','cartographer']],
    ['governance','Governance, Civic & Command',['watch','court','council','guard','officer','diplomat']],
    ['community','Belief, Ritual, Philosophy & Community',['temple','community','caretaker','ritual']],
    ['transport','Transportation, Routes & Logistics',['dock','station','stable','garage','hangar','courier','guide','boatwright']],
    ['environment','Environment, Conservation & Undeveloped Space',['park','garden','ranger','farmer','fisher']],
    ['hidden','Illicit, Vice & Hidden Networks',['hidden','secret','smuggler']],
    ['special','Special, Hazard, Mystery & Scenario Sites',['ruin','hazard','mystery']],
    ['other','Other / Flexible',[]]
  ]);
  const PIN_COLORS=Object.freeze({capital:'#DC143C',city:'#32FF32',town:'#FFA500',village:'#000080'});
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const id=prefix=>`${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,9)}`;
  const now=()=>new Date().toISOString();
  const deep=value=>JSON.parse(JSON.stringify(value));
  const serverId=()=>State.server?.id||CampaignIsolation?.serverId?.()||'none';
  const storageKey=()=>`vttWorldbuilder.${serverId()}`;
  const pointDistance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const escapeHtml=value=>typeof esc==='function'?esc(value):String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function blankScene(name='New Scene'){
    return {
      id:id('scene'),name,width:2400,height:1600,grid:{enabled:true,size:70,type:'square',snap:true,opacity:.24},
      background:{color:'#091619',imageDataUrl:'',fit:'contain'},viewport:{x:0,y:0,zoom:.45},
      scaleFamily:'town',form:'terrestrial-fixed',biomes:[{path:'biomes/Plains/Grassland/',weightPercent:100,sourceProfileId:'B15'}],
      drawings:[],buildings:[],walls:[],doors:[],lights:[],soundZones:[],fog:{enabled:true,opacity:.72,reveals:[],hides:[]},tokens:[],
      backend:{mapId:'',layerId:'',lastSyncAt:'',dirty:true},createdAt:now(),updatedAt:now()
    };
  }
  function blankState(){const scene=blankScene('Campaign Scene');return{version:VERSION,activeSceneId:scene.id,scenes:[scene],tool:'select',brush:{color:'#00ffff',fill:'#12383d',width:5,opacity:.9},selection:null,polygonDraft:[],audio:{master:.7,ambience:.65,effects:.8,muted:false},ui:{leftOpen:true,rightOpen:true,showLightPreview:true,showNpcLabels:true},updatedAt:now()}}
  function normalize(raw){
    const out=raw&&Array.isArray(raw.scenes)?raw:blankState();
    out.version=VERSION;out.brush={color:'#00ffff',fill:'#12383d',width:5,opacity:.9,...out.brush};out.audio={master:.7,ambience:.65,effects:.8,muted:false,...out.audio};out.ui={leftOpen:true,rightOpen:true,showLightPreview:true,showNpcLabels:true,...out.ui};
    out.scenes.forEach(scene=>{
      Object.assign(scene,{width:2400,height:1600,drawings:[],buildings:[],walls:[],doors:[],lights:[],soundZones:[],tokens:[],...scene});
      scene.grid={enabled:true,size:70,type:'square',snap:true,opacity:.24,...scene.grid};scene.background={color:'#091619',imageDataUrl:'',fit:'contain',...scene.background};scene.viewport={x:0,y:0,zoom:.45,...scene.viewport};scene.fog={enabled:true,opacity:.72,reveals:[],hides:[],...scene.fog};scene.backend={mapId:'',layerId:'',lastSyncAt:'',dirty:true,...scene.backend};
      scene.buildings=scene.buildings.map(b=>({id:id('bld'),type:'other',functionalCategory:'Other / Flexible',name:'Building',capacity:10,tags:[],services:[],residents:[],workers:[],visitors:[],schedule:[],locked:false,visible:true,...b}));
    });
    if(!out.scenes.some(s=>s.id===out.activeSceneId))out.activeSceneId=out.scenes[0]?.id||'';
    return out;
  }
  let data=normalize(Store.get(storageKey(),null));
  let runtime={shell:null,canvas:null,ctx:null,dpr:1,pointer:null,drag:null,raf:0,resizeObserver:null,audioContext:null,audioNodes:new Map(),backgroundImages:new Map(),lastAudioUpdate:0,keyBound:false};
  function scene(){return data.scenes.find(s=>s.id===data.activeSceneId)||data.scenes[0]}
  function save(render=false){data.updatedAt=now();const s=scene();if(s){s.updatedAt=now();s.backend.dirty=true}Store.set(storageKey(),data);scheduleDraw();if(render&&Workspace.current==='table')Workspace.render()}
  function setTool(tool){if(!TOOLS.some(([key])=>key===tool))return;data.tool=tool;data.polygonDraft=[];save();refreshToolbar()}
  function markClean(){const s=scene();if(s)s.backend.dirty=false;Store.set(storageKey(),data)}
  function activeSelection(){const sel=data.selection;if(!sel)return null;const s=scene();const list=s?.[sel.collection];return Array.isArray(list)?list.find(x=>x.id===sel.id):null}
  function collectionForTool(tool){return({building:'buildings',wall:'walls',door:'doors',light:'lights',sound:'soundZones'})[tool]||'drawings'}
  function snapPoint(p){const s=scene();if(!s?.grid?.enabled||!s.grid.snap||['draw','pan','select','fogReveal','fogHide','erase'].includes(data.tool))return p;const g=Number(s.grid.size)||70;return{x:Math.round(p.x/g)*g,y:Math.round(p.y/g)*g}}
  function worldFromEvent(event){const canvas=runtime.canvas,s=scene();if(!canvas||!s)return{x:0,y:0};const r=canvas.getBoundingClientRect(),vp=s.viewport;return{x:(event.clientX-r.left-vp.x)/vp.zoom,y:(event.clientY-r.top-vp.y)/vp.zoom}}
  function screenFromWorld(p){const vp=scene().viewport;return{x:p.x*vp.zoom+vp.x,y:p.y*vp.zoom+vp.y}}
  function rectFromPoints(a,b){return{x:Math.min(a.x,b.x),y:Math.min(a.y,b.y),w:Math.abs(b.x-a.x),h:Math.abs(b.y-a.y)}}
  function pointsBounds(points){if(!points?.length)return{x:0,y:0,w:0,h:0};const xs=points.map(p=>p.x),ys=points.map(p=>p.y);return{x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)}}
  function centerOf(item){if(item.x!==undefined&&item.y!==undefined&&item.w!==undefined)return{x:item.x+item.w/2,y:item.y+item.h/2};if(item.x!==undefined&&item.y!==undefined)return{x:item.x,y:item.y};const b=pointsBounds(item.points||[]);return{x:b.x+b.w/2,y:b.y+b.h/2}}
  function pointInPolygon(point,polygon){let inside=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];if(((a.y>point.y)!==(b.y>point.y))&&(point.x<(b.x-a.x)*(point.y-a.y)/(b.y-a.y||1e-9)+a.x))inside=!inside}return inside}
  function hitTest(p){
    const s=scene();if(!s)return null;
    for(const [collection,items] of [['tokens',s.tokens],['lights',s.lights],['soundZones',s.soundZones],['doors',s.doors],['walls',s.walls],['buildings',s.buildings],['drawings',s.drawings]]){
      for(let i=items.length-1;i>=0;i--){const item=items[i];if(item.visible===false)continue;
        if(collection==='lights'||collection==='soundZones'||collection==='tokens'){if(pointDistance(p,centerOf(item))<Math.max(22,(item.radius||item.size||30)*.16))return{collection,id:item.id}}
        else if(item.points?.length>=3&&pointInPolygon(p,item.points))return{collection,id:item.id};
        else if(item.x!==undefined&&p.x>=item.x&&p.y>=item.y&&p.x<=item.x+(item.w||0)&&p.y<=item.y+(item.h||0))return{collection,id:item.id};
        else if(item.a&&item.b){const len=pointDistance(item.a,item.b),d=pointDistance(item.a,p)+pointDistance(p,item.b);if(Math.abs(d-len)<10/(s.viewport.zoom||1))return{collection,id:item.id}}
      }
    }
    return null;
  }
  function segmentIntersectionRay(origin,angle,a,b){
    const dx=Math.cos(angle),dy=Math.sin(angle),sx=b.x-a.x,sy=b.y-a.y,den=dx*sy-dy*sx;if(Math.abs(den)<1e-9)return null;
    const ax=a.x-origin.x,ay=a.y-origin.y,t=(ax*sy-ay*sx)/den,u=(ax*dy-ay*dx)/den;if(t>=0&&u>=0&&u<=1)return{x:origin.x+t*dx,y:origin.y+t*dy,t};return null;
  }
  function lightPolygon(light){
    const s=scene(),segments=[];for(const w of s.walls)if(w.visible!==false)segments.push([w.a,w.b]);for(const d of s.doors)if(!d.open&&d.visible!==false)segments.push([d.a,d.b]);
    const bounds=[[{x:0,y:0},{x:s.width,y:0}],[{x:s.width,y:0},{x:s.width,y:s.height}],[{x:s.width,y:s.height},{x:0,y:s.height}],[{x:0,y:s.height},{x:0,y:0}]];segments.push(...bounds);
    const angles=[];for(const [a,b] of segments)for(const p of [a,b]){const base=Math.atan2(p.y-light.y,p.x-light.x);angles.push(base-0.0001,base,base+0.0001)}
    const cone=Number(light.angle)||360,dir=(Number(light.direction)||0)*Math.PI/180;if(cone<360){const half=cone*Math.PI/360;for(let i=0;i<=120;i++)angles.push(dir-half+(i/120)*half*2)}else for(let i=0;i<180;i++)angles.push(i*Math.PI*2/180);
    const max=Number(light.radius)||500,valid=angles.filter(a=>{if(cone>=360)return true;let diff=Math.atan2(Math.sin(a-dir),Math.cos(a-dir));return Math.abs(diff)<=cone*Math.PI/360+.001}).map(angle=>{
      let best={x:light.x+Math.cos(angle)*max,y:light.y+Math.sin(angle)*max,t:max};for(const [a,b] of segments){const hit=segmentIntersectionRay(light,angle,a,b);if(hit&&hit.t<best.t)best=hit}return{...best,angle};
    }).sort((a,b)=>a.angle-b.angle);return valid;
  }
  function setupCanvas(shell){
    runtime.shell=shell;runtime.canvas=shell.querySelector('[data-vtt-canvas]');runtime.ctx=runtime.canvas?.getContext('2d',{alpha:false});if(!runtime.canvas||!runtime.ctx)return;
    const resize=()=>{const r=runtime.canvas.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1);runtime.dpr=dpr;runtime.canvas.width=Math.max(1,Math.round(r.width*dpr));runtime.canvas.height=Math.max(1,Math.round(r.height*dpr));scheduleDraw()};
    runtime.resizeObserver?.disconnect();runtime.resizeObserver=new ResizeObserver(resize);runtime.resizeObserver.observe(runtime.canvas);resize();
    runtime.canvas.addEventListener('pointerdown',pointerDown);runtime.canvas.addEventListener('pointermove',pointerMove);runtime.canvas.addEventListener('pointerup',pointerUp);runtime.canvas.addEventListener('pointercancel',pointerUp);runtime.canvas.addEventListener('dblclick',doubleClick);runtime.canvas.addEventListener('wheel',wheel,{passive:false});runtime.canvas.addEventListener('contextmenu',e=>e.preventDefault());
    window.__tablegateVttResize=resize;
  }
  function pointerDown(e){
    const s=scene(),raw=worldFromEvent(e),p=snapPoint(raw);runtime.canvas.setPointerCapture(e.pointerId);runtime.pointer={id:e.pointerId,start:p,last:p,screen:{x:e.clientX,y:e.clientY}};
    if(e.button===1||e.button===2||data.tool==='pan'||e.altKey){runtime.drag={type:'pan',startViewport:{...s.viewport},startScreen:{x:e.clientX,y:e.clientY}};return}
    if(data.tool==='select'){
      const hit=hitTest(raw);data.selection=hit;save();refreshInspector();if(hit){const item=activeSelection();runtime.drag={type:'move',item,start:deep(item),startPoint:raw,collection:hit.collection}};return;
    }
    if(data.tool==='polygon'||data.tool==='building'){
      data.polygonDraft.push(p);save();return;
    }
    if(data.tool==='erase'){const hit=hitTest(raw);if(hit){const list=s[hit.collection];s[hit.collection]=list.filter(item=>item.id!==hit.id);if(data.selection?.id===hit.id)data.selection=null;save();refreshInspector()}return}
    if(data.tool==='light'){s.lights.push({id:id('light'),x:p.x,y:p.y,radius:520,color:'#ffd27a',intensity:.85,angle:360,direction:0,castsShadows:true,visible:true,name:`Light ${s.lights.length+1}`});save();return}
    if(data.tool==='sound'){s.soundZones.push({id:id('sound'),x:p.x,y:p.y,radius:420,name:`Ambience ${s.soundZones.length+1}`,src:'',catalogId:'',volume:.65,falloff:'linear',loop:true,autoplay:false,visible:true});save();refreshInspector();return}
    runtime.drag={type:'create',tool:data.tool,start:p,current:p,points:[p]};
  }
  function pointerMove(e){
    const s=scene();if(!runtime.pointer||e.pointerId!==runtime.pointer.id)return;const raw=worldFromEvent(e),p=snapPoint(raw);runtime.pointer.last=p;
    if(runtime.drag?.type==='pan'){s.viewport.x=runtime.drag.startViewport.x+(e.clientX-runtime.drag.startScreen.x);s.viewport.y=runtime.drag.startViewport.y+(e.clientY-runtime.drag.startScreen.y);scheduleDraw();return}
    if(runtime.drag?.type==='move'){
      const d={x:raw.x-runtime.drag.startPoint.x,y:raw.y-runtime.drag.startPoint.y},item=runtime.drag.item,start=runtime.drag.start;
      if(start.x!==undefined){item.x=start.x+d.x;item.y=start.y+d.y}if(start.a){item.a={x:start.a.x+d.x,y:start.a.y+d.y};item.b={x:start.b.x+d.x,y:start.b.y+d.y}}if(start.points)item.points=start.points.map(pt=>({x:pt.x+d.x,y:pt.y+d.y}));scheduleDraw();return;
    }
    if(runtime.drag?.type==='create'){runtime.drag.current=p;if(runtime.drag.tool==='draw'&&pointDistance(runtime.drag.points.at(-1),raw)>3/(s.viewport.zoom||1))runtime.drag.points.push(raw);scheduleDraw()}
    updateCursorReadout(raw);
  }
  function pointerUp(e){
    if(!runtime.pointer||e.pointerId!==runtime.pointer.id)return;const s=scene(),drag=runtime.drag;try{runtime.canvas.releasePointerCapture?.(e.pointerId)}catch{}runtime.pointer=null;runtime.drag=null;
    if(!drag)return;
    if(drag.type==='pan'){save();return}
    if(drag.type==='move'){save();refreshInspector();return}
    if(drag.type!=='create')return;
    const a=drag.start,b=drag.current||a,brush=deep(data.brush),min=4/(s.viewport.zoom||1);
    if(drag.tool==='draw'&&drag.points.length>1)s.drawings.push({id:id('draw'),kind:'path',points:drag.points,stroke:brush.color,width:brush.width,opacity:brush.opacity,visible:true});
    if(drag.tool==='line'&&pointDistance(a,b)>min)s.drawings.push({id:id('draw'),kind:'line',a,b,stroke:brush.color,width:brush.width,opacity:brush.opacity,visible:true});
    if(drag.tool==='rect'){const r=rectFromPoints(a,b);if(r.w>min&&r.h>min)s.drawings.push({id:id('draw'),kind:'rect',...r,stroke:brush.color,fill:brush.fill,width:brush.width,opacity:brush.opacity,visible:true})}
    if(drag.tool==='wall'&&pointDistance(a,b)>min)s.walls.push({id:id('wall'),a,b,width:Math.max(2,brush.width),height:10,blocksLight:true,blocksMovement:true,visible:true,name:`Wall ${s.walls.length+1}`});
    if(drag.tool==='door'&&pointDistance(a,b)>min)s.doors.push({id:id('door'),a,b,width:Math.max(3,brush.width),open:false,locked:false,secret:false,visible:true,name:`Door ${s.doors.length+1}`});
    if(['fogReveal','fogHide'].includes(drag.tool)){const r=rectFromPoints(a,b);if(r.w>min&&r.h>min)s.fog[drag.tool==='fogReveal'?'reveals':'hides'].push({id:id('fog'),shape:'rect',...r})}
    save();refreshLayerList();
  }
  function doubleClick(e){if(!['polygon','building'].includes(data.tool)||data.polygonDraft.length<3)return;const s=scene(),points=deep(data.polygonDraft);if(data.tool==='polygon')s.drawings.push({id:id('draw'),kind:'polygon',points,stroke:data.brush.color,fill:data.brush.fill,width:data.brush.width,opacity:data.brush.opacity,visible:true});else{s.buildings.push(newBuilding(points));data.selection={collection:'buildings',id:s.buildings.at(-1).id}}data.polygonDraft=[];save();refreshInspector();refreshLayerList()}
  function wheel(e){e.preventDefault();const s=scene(),canvas=runtime.canvas,r=canvas.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top,before={x:(mx-s.viewport.x)/s.viewport.zoom,y:(my-s.viewport.y)/s.viewport.zoom},factor=e.deltaY<0?1.12:.89,next=clamp(s.viewport.zoom*factor,.08,4);s.viewport.zoom=next;s.viewport.x=mx-before.x*next;s.viewport.y=my-before.y*next;save();updateZoomReadout()}
  function newBuilding(points){const type='residence',entry=BUILDING_TYPES.find(x=>x[0]===type);return{id:id('bld'),name:`Building ${scene().buildings.length+1}`,type,functionalCategory:entry[1],points,capacity:8,tags:[...entry[2]],services:[],residents:[],workers:[],visitors:[],schedule:[],access:'public',locked:false,visible:true,provenance:{source:'manual-vtt-drawing',createdAt:now()},backendFeatureId:''}}

  function scheduleDraw(){if(runtime.raf)return;runtime.raf=requestAnimationFrame(()=>{runtime.raf=0;draw()})}
  function draw(){
    const c=runtime.canvas,ctx=runtime.ctx,s=scene();if(!c||!ctx||!s)return;const dpr=runtime.dpr||1;ctx.setTransform(dpr,0,0,dpr,0,0);const w=c.width/dpr,h=c.height/dpr;ctx.fillStyle='#040b0d';ctx.fillRect(0,0,w,h);ctx.save();ctx.translate(s.viewport.x,s.viewport.y);ctx.scale(s.viewport.zoom,s.viewport.zoom);
    ctx.fillStyle=s.background.color||'#091619';ctx.fillRect(0,0,s.width,s.height);drawBackground(ctx,s);drawGrid(ctx,s);drawDrawings(ctx,s);drawBuildings(ctx,s);drawWallsDoors(ctx,s);if(data.ui.showLightPreview)drawLights(ctx,s);drawSoundZones(ctx,s);drawTokens(ctx,s);drawFog(ctx,s);drawSelection(ctx,s);drawDraft(ctx,s);ctx.restore();drawScale(ctx,s,w,h);updateAudio(false);
  }
  function drawBackground(ctx,s){if(!s.background.imageDataUrl)return;let image=runtime.backgroundImages.get(s.id);if(!image||image.src!==s.background.imageDataUrl){image=new Image();image.src=s.background.imageDataUrl;image.onload=scheduleDraw;runtime.backgroundImages.set(s.id,image)}if(!image.complete)return;ctx.save();ctx.globalAlpha=.96;if(s.background.fit==='stretch')ctx.drawImage(image,0,0,s.width,s.height);else{const scale=s.background.fit==='cover'?Math.max(s.width/image.naturalWidth,s.height/image.naturalHeight):Math.min(s.width/image.naturalWidth,s.height/image.naturalHeight),iw=image.naturalWidth*scale,ih=image.naturalHeight*scale;ctx.drawImage(image,(s.width-iw)/2,(s.height-ih)/2,iw,ih)}ctx.restore()}
  function drawGrid(ctx,s){if(!s.grid.enabled)return;const g=Number(s.grid.size)||70;ctx.save();ctx.globalAlpha=clamp(s.grid.opacity,.02,.9);ctx.strokeStyle='#93f5f5';ctx.lineWidth=1/s.viewport.zoom;ctx.beginPath();for(let x=0;x<=s.width;x+=g){ctx.moveTo(x,0);ctx.lineTo(x,s.height)}for(let y=0;y<=s.height;y+=g){ctx.moveTo(0,y);ctx.lineTo(s.width,y)}ctx.stroke();ctx.restore()}
  function applyStyle(ctx,item){ctx.globalAlpha=item.opacity??1;ctx.strokeStyle=item.stroke||data.brush.color;ctx.fillStyle=item.fill||'transparent';ctx.lineWidth=(item.width||3)/scene().viewport.zoom;ctx.lineJoin='round';ctx.lineCap='round'}
  function drawDrawings(ctx,s){for(const item of s.drawings){if(item.visible===false)continue;ctx.save();applyStyle(ctx,item);ctx.beginPath();if(item.kind==='path'||item.kind==='polygon'){item.points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));if(item.kind==='polygon')ctx.closePath()}else if(item.kind==='line'){ctx.moveTo(item.a.x,item.a.y);ctx.lineTo(item.b.x,item.b.y)}else if(item.kind==='rect')ctx.rect(item.x,item.y,item.w,item.h);if(item.fill&&item.fill!=='transparent')ctx.fill();ctx.stroke();ctx.restore()}}
  function drawBuildings(ctx,s){for(const b of s.buildings){if(b.visible===false)continue;ctx.save();ctx.beginPath();b.points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=b.locked?'rgba(90,55,40,.88)':'rgba(14,74,78,.86)';ctx.strokeStyle=b.id===data.selection?.id?'#ffffff':'#00ffff';ctx.lineWidth=(b.id===data.selection?.id?5:2.5)/s.viewport.zoom;ctx.fill();ctx.stroke();const c=centerOf(b);ctx.fillStyle='#efffff';ctx.font=`${Math.max(14,18/s.viewport.zoom)}px system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(b.name,c.x,c.y);ctx.font=`${Math.max(10,12/s.viewport.zoom)}px system-ui`;ctx.fillStyle='#aee7e7';ctx.fillText(`${b.residents?.length||0} residents · ${b.workers?.length||0} workers`,c.x,c.y+22/s.viewport.zoom);ctx.restore()}}
  function drawWallsDoors(ctx,s){ctx.save();ctx.lineCap='round';for(const w of s.walls){if(w.visible===false)continue;ctx.strokeStyle='#d7fafa';ctx.lineWidth=(w.width||5)/s.viewport.zoom;ctx.beginPath();ctx.moveTo(w.a.x,w.a.y);ctx.lineTo(w.b.x,w.b.y);ctx.stroke()}for(const d of s.doors){if(d.visible===false)continue;ctx.strokeStyle=d.locked?'#ff8c66':d.open?'#70ff9c':'#ffcc66';ctx.lineWidth=(d.width||5)/s.viewport.zoom;ctx.beginPath();ctx.moveTo(d.a.x,d.a.y);ctx.lineTo(d.b.x,d.b.y);ctx.stroke();const c={x:(d.a.x+d.b.x)/2,y:(d.a.y+d.b.y)/2};ctx.fillStyle=ctx.strokeStyle;ctx.beginPath();ctx.arc(c.x,c.y,7/s.viewport.zoom,0,Math.PI*2);ctx.fill()}ctx.restore()}
  function drawLights(ctx,s){ctx.save();ctx.globalCompositeOperation='screen';for(const l of s.lights){if(l.visible===false)continue;const points=l.castsShadows?lightPolygon(l):null,grad=ctx.createRadialGradient(l.x,l.y,0,l.x,l.y,l.radius);const color=l.color||'#ffd27a';grad.addColorStop(0,hexAlpha(color,clamp(l.intensity,.05,1)));grad.addColorStop(.7,hexAlpha(color,clamp(l.intensity*.28,0,.5)));grad.addColorStop(1,hexAlpha(color,0));ctx.fillStyle=grad;ctx.beginPath();if(points?.length){points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath()}else ctx.arc(l.x,l.y,l.radius,0,Math.PI*2);ctx.fill();ctx.strokeStyle=hexAlpha(color,.9);ctx.lineWidth=2/s.viewport.zoom;ctx.stroke()}ctx.restore()}
  function hexAlpha(hex,a){let h=String(hex||'#ffffff').replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');const n=parseInt(h,16);return`rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${clamp(a,0,1)})`}
  function drawSoundZones(ctx,s){ctx.save();ctx.setLineDash([12/s.viewport.zoom,8/s.viewport.zoom]);for(const z of s.soundZones){if(z.visible===false)continue;ctx.fillStyle='rgba(40,170,255,.08)';ctx.strokeStyle='#55bfff';ctx.lineWidth=2/s.viewport.zoom;ctx.beginPath();ctx.arc(z.x,z.y,z.radius,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#9edcff';ctx.font=`${18/s.viewport.zoom}px system-ui`;ctx.textAlign='center';ctx.fillText('♫',z.x,z.y);ctx.setLineDash([12/s.viewport.zoom,8/s.viewport.zoom])}ctx.restore()}
  function drawTokens(ctx,s){for(const t of s.tokens){if(t.visible===false||t.hidden&&!canManageVtt())continue;ctx.save();const r=Number(t.radius||28);ctx.fillStyle=t.color||'#ffb25f';ctx.strokeStyle='#fff';ctx.lineWidth=3/s.viewport.zoom;ctx.beginPath();ctx.arc(t.x,t.y,r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#001315';ctx.font=`bold ${Math.max(12,r*.68)}px system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText((t.name||'?').split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase(),t.x,t.y);if(data.ui.showNpcLabels){ctx.fillStyle='#fff';ctx.font=`${13/s.viewport.zoom}px system-ui`;ctx.fillText(t.name||'Token',t.x,t.y+r+16/s.viewport.zoom)}ctx.restore()}}
  function drawFog(ctx,s){if(!s.fog.enabled)return;ctx.save();ctx.fillStyle=`rgba(0,0,0,${clamp(s.fog.opacity,0,1)})`;ctx.fillRect(0,0,s.width,s.height);ctx.globalCompositeOperation='destination-out';for(const r of s.fog.reveals){ctx.fillStyle='#000';if(r.shape==='rect')ctx.fillRect(r.x,r.y,r.w,r.h)}for(const l of s.lights){if(l.visible===false)continue;const points=lightPolygon(l);ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fill()}ctx.globalCompositeOperation='source-over';ctx.fillStyle=`rgba(0,0,0,${clamp(s.fog.opacity,0,1)})`;for(const r of s.fog.hides)if(r.shape==='rect')ctx.fillRect(r.x,r.y,r.w,r.h);ctx.restore()}
  function drawSelection(ctx,s){const item=activeSelection();if(!item)return;const b=item.points?pointsBounds(item.points):item.a?pointsBounds([item.a,item.b]):item.w!==undefined?{x:item.x,y:item.y,w:item.w,h:item.h}:{x:item.x-(item.radius||30),y:item.y-(item.radius||30),w:(item.radius||30)*2,h:(item.radius||30)*2};ctx.save();ctx.setLineDash([8/s.viewport.zoom,6/s.viewport.zoom]);ctx.strokeStyle='#fff';ctx.lineWidth=2/s.viewport.zoom;ctx.strokeRect(b.x-8/s.viewport.zoom,b.y-8/s.viewport.zoom,b.w+16/s.viewport.zoom,b.h+16/s.viewport.zoom);ctx.restore()}
  function drawDraft(ctx,s){if(!data.polygonDraft.length&&!runtime.drag?.current)return;ctx.save();ctx.strokeStyle='#fff';ctx.fillStyle='rgba(0,255,255,.12)';ctx.lineWidth=2/s.viewport.zoom;ctx.setLineDash([8/s.viewport.zoom,6/s.viewport.zoom]);ctx.beginPath();if(data.polygonDraft.length){data.polygonDraft.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));if(runtime.pointer)ctx.lineTo(runtime.pointer.last.x,runtime.pointer.last.y)}else if(runtime.drag?.type==='create'){const a=runtime.drag.start,b=runtime.drag.current;if(['wall','door','line'].includes(runtime.drag.tool)){ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y)}else if(['rect','fogReveal','fogHide'].includes(runtime.drag.tool)){const r=rectFromPoints(a,b);ctx.rect(r.x,r.y,r.w,r.h)}else if(runtime.drag.tool==='draw'){runtime.drag.points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y))}}ctx.stroke();ctx.restore()}
  function drawScale(ctx,s,w,h){ctx.save();ctx.fillStyle='rgba(0,12,14,.78)';ctx.fillRect(12,h-42,250,28);ctx.fillStyle='#d9ffff';ctx.font='12px system-ui';ctx.fillText(`${Math.round(s.viewport.zoom*100)}% · ${s.width}×${s.height} · ${s.grid.size}px grid`,22,h-24);ctx.restore()}

  function canManageVtt(){return typeof canManage==='function'?canManage():(typeof CampaignIsolation!=='undefined'?CampaignIsolation.canCreate():true)}
  function render(){
    const s=scene(),sel=activeSelection(),catalog=window.TableGateAdminAudioCatalog?.tracks||[];
    return `<div class="vtt8-shell ${data.ui.leftOpen?'left-open':'left-closed'} ${data.ui.rightOpen?'right-open':'right-closed'}">
      <header class="vtt8-topbar">
        <div class="vtt8-brand"><span class="eyebrow">SEMANTIC VIRTUAL TABLETOP</span><h2>${escapeHtml(s.name)}</h2><small>${escapeHtml(VERSION)} · ${s.backend.mapId?'backend map linked':'local draft'}</small></div>
        <div class="vtt8-scene-controls"><select data-vtt-scene>${data.scenes.map(x=>`<option value="${escapeHtml(x.id)}" ${x.id===s.id?'selected':''}>${escapeHtml(x.name)}</option>`).join('')}</select><button data-vtt-new-scene>New</button><button data-vtt-scene-settings>Scene</button><button data-vtt-fit>Fit</button></div>
        <div class="vtt8-sync"><span class="vtt8-sync-state ${s.backend.dirty?'dirty':'clean'}">${s.backend.dirty?'Unsynced':'Synced'}</span><button data-vtt-sync ${canManageVtt()?'':'disabled'}>Sync Backend V8</button><button data-vtt-export>Export</button><label class="file-button">Import<input hidden type="file" accept="application/json,.json" data-vtt-import></label></div>
      </header>
      <aside class="vtt8-tools"><button class="vtt8-collapse" data-vtt-toggle-left title="Toggle tool panel">${data.ui.leftOpen?'‹':'›'}</button><div class="vtt8-tool-grid">${TOOLS.map(([key,icon,label])=>`<button class="${data.tool===key?'active':''}" data-vtt-tool="${key}" title="${label}"><span>${icon}</span><small>${label}</small></button>`).join('')}</div>
        <section><h3>Brush</h3><label>Line<input type="color" value="${escapeHtml(data.brush.color)}" data-vtt-brush="color"></label><label>Fill<input type="color" value="${escapeHtml(data.brush.fill)}" data-vtt-brush="fill"></label><label>Width<input type="range" min="1" max="36" value="${data.brush.width}" data-vtt-brush="width"></label></section>
        <section><h3>Layers</h3><div class="vtt8-layer-list" data-vtt-layer-list>${layerListMarkup(s)}</div></section>
      </aside>
      <main class="vtt8-stage"><canvas data-vtt-canvas tabindex="0" aria-label="Interactive virtual tabletop map canvas"></canvas><div class="vtt8-stage-hud"><span data-vtt-cursor>0, 0</span><span data-vtt-zoom>${Math.round(s.viewport.zoom*100)}%</span><button data-vtt-undo-fog>Undo fog</button><button data-vtt-clear-fog>Reset fog</button></div></main>
      <aside class="vtt8-inspector"><button class="vtt8-collapse" data-vtt-toggle-right title="Toggle inspector">${data.ui.rightOpen?'›':'‹'}</button><div data-vtt-inspector>${inspectorMarkup(sel,s,catalog)}</div></aside>
      <footer class="vtt8-status"><span>${s.buildings.length} buildings · ${s.walls.length} walls · ${s.lights.length} lights · ${s.soundZones.length} sound zones · ${s.tokens.length} tokens</span><span>Double-click to close polygon/building · mouse wheel zoom · middle/right drag pan</span></footer>
    </div>`;
  }
  function layerListMarkup(s){const rows=[['buildings','Buildings',s.buildings.length],['walls','Walls',s.walls.length],['doors','Doors',s.doors.length],['lights','Lights',s.lights.length],['soundZones','Audio',s.soundZones.length],['tokens','Tokens / NPCs',s.tokens.length],['drawings','Drawings',s.drawings.length]];return rows.map(([key,label,count])=>`<button data-vtt-layer="${key}"><span>${label}</span><b>${count}</b></button>`).join('')}
  function inspectorMarkup(item,s,catalog){
    if(!item)return `<section class="vtt8-inspector-section"><span class="eyebrow">SCENE</span><h3>${escapeHtml(s.name)}</h3><label>Grid size<input data-vtt-scene-field="grid.size" type="number" min="10" max="500" value="${s.grid.size}"></label><label><input data-vtt-scene-field="grid.enabled" type="checkbox" ${s.grid.enabled?'checked':''}> Show grid</label><label><input data-vtt-scene-field="grid.snap" type="checkbox" ${s.grid.snap?'checked':''}> Snap to grid</label><label><input data-vtt-scene-field="fog.enabled" type="checkbox" ${s.fog.enabled?'checked':''}> Enable fog of war</label><label>Fog opacity<input data-vtt-scene-field="fog.opacity" type="range" min="0" max="1" step=".05" value="${s.fog.opacity}"></label><label>Settlement scale<select data-vtt-scene-field="scaleFamily">${Object.keys(PIN_COLORS).map(x=>`<option ${s.scaleFamily===x?'selected':''}>${x}</option>`).join('')}</select></label><div class="vtt8-pin-contract"><i style="background:${PIN_COLORS[s.scaleFamily]}"></i>${escapeHtml(s.scaleFamily)} pin ${PIN_COLORS[s.scaleFamily]}</div><button data-vtt-background>Set background image</button><input hidden type="file" accept="image/*" data-vtt-background-input><button data-vtt-auto-assign>Auto-assign NPCs to buildings</button><button data-vtt-import-npcs>Place assigned NPC tokens</button></section>`;
    const sel=data.selection;
    if(sel.collection==='buildings')return buildingInspector(item);
    if(sel.collection==='lights')return `<section class="vtt8-inspector-section"><span class="eyebrow">LIGHT</span><h3>${escapeHtml(item.name)}</h3>${field('name',item.name)}${numberField('radius',item.radius,20,3000)}${numberField('intensity',item.intensity,0,1,.05)}${numberField('direction',item.direction,-360,360,1)}${numberField('angle',item.angle,1,360,1)}<label>Color<input data-vtt-item-field="color" type="color" value="${escapeHtml(item.color)}"></label><label><input data-vtt-item-field="castsShadows" type="checkbox" ${item.castsShadows?'checked':''}> Dynamic wall shadows</label>${deleteButton()}</section>`;
    if(sel.collection==='soundZones')return soundInspector(item,catalog);
    if(sel.collection==='doors')return `<section class="vtt8-inspector-section"><span class="eyebrow">DOOR</span><h3>${escapeHtml(item.name)}</h3>${field('name',item.name)}<label><input data-vtt-item-field="open" type="checkbox" ${item.open?'checked':''}> Open</label><label><input data-vtt-item-field="locked" type="checkbox" ${item.locked?'checked':''}> Locked</label><label><input data-vtt-item-field="secret" type="checkbox" ${item.secret?'checked':''}> Secret door</label>${deleteButton()}</section>`;
    if(sel.collection==='tokens')return `<section class="vtt8-inspector-section"><span class="eyebrow">TOKEN</span><h3>${escapeHtml(item.name)}</h3>${field('name',item.name)}${numberField('radius',item.radius||28,10,140)}<label>Color<input data-vtt-item-field="color" type="color" value="${escapeHtml(item.color||'#ffb25f')}"></label><label><input data-vtt-item-field="hidden" type="checkbox" ${item.hidden?'checked':''}> Hidden from players</label><p>NPC: ${escapeHtml(item.npcId||'not linked')}</p><p>Building: ${escapeHtml(item.buildingId||'not assigned')}</p>${deleteButton()}</section>`;
    return `<section class="vtt8-inspector-section"><span class="eyebrow">${escapeHtml(sel.collection.toUpperCase())}</span><h3>${escapeHtml(item.name||item.kind||'Selected item')}</h3>${item.name!==undefined?field('name',item.name):''}<label><input data-vtt-item-field="visible" type="checkbox" ${item.visible!==false?'checked':''}> Visible</label>${deleteButton()}</section>`;
  }
  function field(name,value,label=name){return`<label>${escapeHtml(label)}<input data-vtt-item-field="${escapeHtml(name)}" value="${escapeHtml(value??'')}"></label>`}
  function numberField(name,value,min,max,step=1){return`<label>${escapeHtml(name)}<input data-vtt-item-field="${escapeHtml(name)}" type="number" min="${min}" max="${max}" step="${step}" value="${Number(value)||0}"></label>`}
  function deleteButton(){return'<button class="danger" data-vtt-delete-selection>Delete selected item</button>'}
  function buildingInspector(b){return`<section class="vtt8-inspector-section"><span class="eyebrow">SEMANTIC BUILDING</span><h3>${escapeHtml(b.name)}</h3>${field('name',b.name,'Name')}<label>Function<select data-vtt-building-type>${BUILDING_TYPES.map(([key,label])=>`<option value="${key}" ${b.type===key?'selected':''}>${escapeHtml(label)}</option>`).join('')}</select></label>${numberField('capacity',b.capacity,0,100000)}${field('access',b.access||'public','Access')}<label>Tags<textarea data-vtt-item-json="tags" rows="3">${escapeHtml((b.tags||[]).join(', '))}</textarea></label><label>Services<textarea data-vtt-item-json="services" rows="3">${escapeHtml((b.services||[]).join(', '))}</textarea></label><label><input data-vtt-item-field="locked" type="checkbox" ${b.locked?'checked':''}> Lock from regeneration</label><div class="vtt8-assignment-summary"><b>${b.residents?.length||0}</b> residents <b>${b.workers?.length||0}</b> workers <b>${b.visitors?.length||0}</b> visitors</div><button data-vtt-assign-building>Assign best-fit NPCs</button><button data-vtt-clear-building>Clear assignments</button>${deleteButton()}</section>`}
  function soundInspector(z,catalog){return`<section class="vtt8-inspector-section"><span class="eyebrow">SPATIAL AMBIENCE</span><h3>${escapeHtml(z.name)}</h3>${field('name',z.name)}${numberField('radius',z.radius,20,5000)}${numberField('volume',z.volume,0,1,.05)}<label>Audio catalog<select data-vtt-audio-catalog><option value="">Choose a licensed/user track</option>${catalog.map(t=>`<option value="${escapeHtml(t.id)}" ${z.catalogId===t.id?'selected':''}>${escapeHtml(t.englishTitle)} · ${escapeHtml(t.licenseStatus)}</option>`).join('')}</select></label>${field('src',z.src||'','Relative audio path')}<label>Falloff<select data-vtt-item-field="falloff"><option ${z.falloff==='linear'?'selected':''}>linear</option><option ${z.falloff==='inverse'?'selected':''}>inverse</option><option ${z.falloff==='none'?'selected':''}>none</option></select></label><label><input data-vtt-item-field="loop" type="checkbox" ${z.loop?'checked':''}> Loop</label><label><input data-vtt-item-field="autoplay" type="checkbox" ${z.autoplay?'checked':''}> Play while active</label><button data-vtt-audio-preview>${runtime.audioNodes.has(z.id)?'Stop preview':'Preview zone'}</button>${deleteButton()}</section>`}

  function bind(shell){
    setupCanvas(shell);bindControls(shell);scheduleDraw();updateAudio(true);
  }
  function bindControls(shell){
    shell.querySelectorAll('[data-vtt-tool]').forEach(b=>b.onclick=()=>setTool(b.dataset.vttTool));
    shell.querySelector('[data-vtt-scene]')?.addEventListener('change',e=>{data.activeSceneId=e.target.value;data.selection=null;save(true)});
    shell.querySelector('[data-vtt-new-scene]')?.addEventListener('click',newSceneDialog);
    shell.querySelector('[data-vtt-scene-settings]')?.addEventListener('click',sceneDialog);
    shell.querySelector('[data-vtt-fit]')?.addEventListener('click',fitScene);
    shell.querySelector('[data-vtt-sync]')?.addEventListener('click',()=>syncBackend().catch(showError));
    shell.querySelector('[data-vtt-export]')?.addEventListener('click',exportJson);
    shell.querySelector('[data-vtt-import]')?.addEventListener('change',e=>importJson(e.target.files[0]).catch(showError));
    shell.querySelector('[data-vtt-toggle-left]')?.addEventListener('click',()=>{data.ui.leftOpen=!data.ui.leftOpen;save(true)});
    shell.querySelector('[data-vtt-toggle-right]')?.addEventListener('click',()=>{data.ui.rightOpen=!data.ui.rightOpen;save(true)});
    shell.querySelectorAll('[data-vtt-brush]').forEach(input=>input.oninput=()=>{data.brush[input.dataset.vttBrush]=input.type==='range'?Number(input.value):input.value;save()});
    shell.querySelector('[data-vtt-clear-fog]')?.addEventListener('click',()=>{if(confirm('Reset all manual fog reveals and hides?')){scene().fog.reveals=[];scene().fog.hides=[];save()}});
    shell.querySelector('[data-vtt-undo-fog]')?.addEventListener('click',()=>{const s=scene();const a=s.fog.reveals.at(-1),b=s.fog.hides.at(-1);if(!a&&!b)return;if(!b||a&&String(a.id)>String(b.id))s.fog.reveals.pop();else s.fog.hides.pop();save()});
    shell.querySelector('[data-vtt-background]')?.addEventListener('click',()=>shell.querySelector('[data-vtt-background-input]')?.click());
    shell.querySelector('[data-vtt-background-input]')?.addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;scene().background.imageDataUrl=await fileDataUrl(f);save();scheduleDraw()});
    shell.querySelector('[data-vtt-auto-assign]')?.addEventListener('click',()=>{const r=autoAssignAll();toast(`${r.assigned} NPC assignments updated across ${r.buildings} buildings.`,'success');save(true)});
    shell.querySelector('[data-vtt-import-npcs]')?.addEventListener('click',()=>{const count=placeAssignedNpcTokens();toast(`${count} NPC tokens placed.`,'success');save(true)});
    bindInspector(shell);
    shell.querySelectorAll('[data-vtt-layer]').forEach(b=>b.onclick=()=>{const items=scene()[b.dataset.vttLayer];if(items?.[0]){data.selection={collection:b.dataset.vttLayer,id:items[0].id};save();refreshInspector()}});
    if(!runtime.keyBound){document.addEventListener('keydown',keyboard);runtime.keyBound=true}
  }
  function bindInspector(shell){
    shell.querySelectorAll('[data-vtt-scene-field]').forEach(input=>input.oninput=()=>{setPath(scene(),input.dataset.vttSceneField,input.type==='checkbox'?input.checked:input.type==='range'||input.type==='number'?Number(input.value):input.value);save()});
    shell.querySelectorAll('[data-vtt-item-field]').forEach(input=>input.oninput=()=>{const item=activeSelection();if(!item)return;item[input.dataset.vttItemField]=input.type==='checkbox'?input.checked:input.type==='number'?Number(input.value):input.value;save();scheduleDraw()});
    shell.querySelectorAll('[data-vtt-item-json]').forEach(input=>input.onchange=()=>{const item=activeSelection();if(!item)return;item[input.dataset.vttItemJson]=input.value.split(',').map(x=>x.trim()).filter(Boolean);save()});
    shell.querySelector('[data-vtt-building-type]')?.addEventListener('change',e=>{const b=activeSelection(),entry=BUILDING_TYPES.find(x=>x[0]===e.target.value);if(!b||!entry)return;b.type=entry[0];b.functionalCategory=entry[1];b.tags=[...new Set([...(b.tags||[]),...entry[2]])];save();refreshInspector()});
    shell.querySelector('[data-vtt-delete-selection]')?.addEventListener('click',deleteSelection);
    shell.querySelector('[data-vtt-assign-building]')?.addEventListener('click',()=>{const b=activeSelection();if(!b)return;const n=assignBuilding(b);toast(`${n} NPC links assigned to ${b.name}.`,'success');save(true)});
    shell.querySelector('[data-vtt-clear-building]')?.addEventListener('click',()=>{const b=activeSelection();if(!b)return;b.residents=[];b.workers=[];b.visitors=[];save(true)});
    shell.querySelector('[data-vtt-audio-catalog]')?.addEventListener('change',e=>{const z=activeSelection(),track=window.TableGateAdminAudioCatalog?.tracks?.find(t=>t.id===e.target.value);if(!z)return;z.catalogId=track?.id||'';z.src=track?.path||z.src;z.name=track?.englishTitle||z.name;save();refreshInspector()});
    shell.querySelector('[data-vtt-audio-preview]')?.addEventListener('click',()=>{const z=activeSelection();if(z)toggleAudio(z).catch(showError)});
  }
  function keyboard(e){if(Workspace.current!=='table'||e.target.matches('input,textarea,select'))return;if(e.key==='Escape'){data.polygonDraft=[];runtime.drag=null;save()}if((e.key==='Delete'||e.key==='Backspace')&&data.selection)deleteSelection();if(e.key==='f')fitScene();const tool=TOOLS.find((_,i)=>String(i+1)===e.key);if(tool)setTool(tool[0])}
  function setPath(obj,path,value){const keys=path.split('.');let ref=obj;for(const key of keys.slice(0,-1))ref=ref[key]||(ref[key]={});ref[keys.at(-1)]=value}
  function deleteSelection(){const sel=data.selection;if(!sel)return;const s=scene();s[sel.collection]=s[sel.collection].filter(x=>x.id!==sel.id);stopAudio(sel.id);data.selection=null;save(true)}
  function refreshToolbar(){runtime.shell?.querySelectorAll('[data-vtt-tool]').forEach(b=>b.classList.toggle('active',b.dataset.vttTool===data.tool))}
  function refreshInspector(){const node=runtime.shell?.querySelector('[data-vtt-inspector]');if(!node)return;node.innerHTML=inspectorMarkup(activeSelection(),scene(),window.TableGateAdminAudioCatalog?.tracks||[]);bindInspector(runtime.shell)}
  function refreshLayerList(){const node=runtime.shell?.querySelector('[data-vtt-layer-list]');if(node)node.innerHTML=layerListMarkup(scene())}
  function updateCursorReadout(p){const n=runtime.shell?.querySelector('[data-vtt-cursor]');if(n)n.textContent=`${Math.round(p.x)}, ${Math.round(p.y)}`}
  function updateZoomReadout(){const n=runtime.shell?.querySelector('[data-vtt-zoom]');if(n)n.textContent=`${Math.round(scene().viewport.zoom*100)}%`}
  function fitScene(){const c=runtime.canvas,s=scene();if(!c||!s)return;const r=c.getBoundingClientRect(),z=Math.min(r.width/s.width,r.height/s.height)*.94;s.viewport.zoom=clamp(z,.08,4);s.viewport.x=(r.width-s.width*s.viewport.zoom)/2;s.viewport.y=(r.height-s.height*s.viewport.zoom)/2;save();updateZoomReadout()}
  function fileDataUrl(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result));r.onerror=()=>reject(r.error);r.readAsDataURL(file)})}
  function newSceneDialog(){modal('New VTT scene',`<div class="field"><label>Name</label><input id="vtt-new-name" value="New Scene"></div><div class="split"><div class="field"><label>Width</label><input id="vtt-new-width" type="number" value="2400"></div><div class="field"><label>Height</label><input id="vtt-new-height" type="number" value="1600"></div></div>`,`<button data-close-modal>Cancel</button><button class="primary" data-vtt-create-scene>Create scene</button>`);$('#modal-root').querySelector('[data-vtt-create-scene]').onclick=()=>{const s=blankScene($('#vtt-new-name').value.trim()||'New Scene');s.width=clamp(Number($('#vtt-new-width').value)||2400,200,20000);s.height=clamp(Number($('#vtt-new-height').value)||1600,200,20000);data.scenes.push(s);data.activeSceneId=s.id;data.selection=null;closeModal();save(true)}}
  function sceneDialog(){const s=scene();modal('Scene settings',`<div class="field"><label>Name</label><input id="vtt-scene-name" value="${escapeHtml(s.name)}"></div><div class="split"><div class="field"><label>Width</label><input id="vtt-scene-width" type="number" value="${s.width}"></div><div class="field"><label>Height</label><input id="vtt-scene-height" type="number" value="${s.height}"></div></div><div class="field"><label>Settlement form</label><input id="vtt-scene-form" value="${escapeHtml(s.form)}"></div><div class="field"><label>Biome blend JSON (1–3 entries; weights total 100)</label><textarea id="vtt-scene-biomes" rows="7">${escapeHtml(JSON.stringify(s.biomes,null,2))}</textarea></div>`,`<button class="danger" data-vtt-delete-scene ${data.scenes.length===1?'disabled':''}>Delete</button><button data-close-modal>Cancel</button><button class="primary" data-vtt-save-scene>Save</button>`,'wide');const root=$('#modal-root');root.querySelector('[data-vtt-save-scene]').onclick=()=>{let biomes;try{biomes=JSON.parse($('#vtt-scene-biomes').value)}catch{return toast('Biome JSON is invalid.','error')}if(!Array.isArray(biomes)||biomes.length<1||biomes.length>3||Math.abs(biomes.reduce((a,b)=>a+Number(b.weightPercent||0),0)-100)>.001)return toast('Choose 1–3 biomes whose weights total exactly 100%.','error');s.name=$('#vtt-scene-name').value.trim()||'Scene';s.width=clamp(Number($('#vtt-scene-width').value)||s.width,200,20000);s.height=clamp(Number($('#vtt-scene-height').value)||s.height,200,20000);s.form=$('#vtt-scene-form').value.trim()||'custom';s.biomes=biomes;closeModal();save(true)};root.querySelector('[data-vtt-delete-scene]')?.addEventListener('click',()=>{if(data.scenes.length===1||!confirm(`Delete ${s.name}?`))return;data.scenes=data.scenes.filter(x=>x.id!==s.id);data.activeSceneId=data.scenes[0].id;closeModal();save(true)})}

  function npcData(){return window.TableGateNpcLives?.load?.()||{npcs:[]}}
  function normalizedWords(value){return String(value||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').split(/\s+/).filter(Boolean)}
  function buildingScore(npc,b,role){const words=new Set([...normalizedWords(npc.job),...normalizedWords(npc.workplace),...normalizedWords(role),...normalizedWords(npc.schedule?.map(x=>x.location).join(' '))]),tags=new Set([...(b.tags||[]).flatMap(normalizedWords),...normalizedWords(b.name),...normalizedWords(b.functionalCategory)]);let score=0;for(const word of words)if(tags.has(word))score+=8;const type=BUILDING_TYPES.find(x=>x[0]===b.type);for(const kw of type?.[2]||[])if(words.has(kw))score+=12;if(role==='resident'&&b.type==='residence')score+=40;if(role==='worker'&&b.type!=='residence')score+=10;return score+(hashString(`${npc.id}:${b.id}:${role}`)%1000)/1000}
  function hashString(v){let h=2166136261;for(const c of String(v)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
  function pickBuilding(npc,role,buildings){const unlocked=buildings.filter(b=>!b.locked&&(role!=='resident'||(b.residents?.length||0)<Math.max(1,b.capacity||1)));return unlocked.sort((a,b)=>buildingScore(npc,b,role)-buildingScore(npc,a,role))[0]||null}
  function assignBuilding(building){const d=npcData(),npcs=d.npcs||[];let links=0;building.residents=building.residents||[];building.workers=building.workers||[];for(const npc of npcs){const home=pickBuilding(npc,'resident',scene().buildings),work=pickBuilding(npc,'worker',scene().buildings);if(home?.id===building.id&&!building.residents.includes(npc.id)){building.residents.push(npc.id);links++}if(work?.id===building.id&&!building.workers.includes(npc.id)){building.workers.push(npc.id);links++}}persistNpcAssignments(d);return links}
  function autoAssignAll(){const s=scene(),d=npcData(),npcs=d.npcs||[];for(const b of s.buildings)if(!b.locked){b.residents=[];b.workers=[];b.visitors=[]}let assigned=0;for(const npc of npcs){const home=pickBuilding(npc,'resident',s.buildings),work=pickBuilding(npc,'worker',s.buildings);if(home){home.residents.push(npc.id);npc.homeBuildingId=home.id;assigned++}if(work){work.workers.push(npc.id);npc.workBuildingId=work.id;assigned++;for(const block of npc.schedule||[]){if(block.location==='home')block.locationId=home.id;else if(block.location==='workplace'||String(block.activity).toLowerCase().includes('working'))block.locationId=work.id}}}persistNpcAssignments(d);return{assigned,buildings:s.buildings.length}}
  function persistNpcAssignments(d){if(window.TableGateNpcLives?.save)window.TableGateNpcLives.save(d);else Store.set(`npcLives.v5.${serverId()}`,d)}
  function placeAssignedNpcTokens(){const s=scene(),d=npcData();s.tokens=s.tokens.filter(t=>!t.autoNpc);let count=0;for(const b of s.buildings){const c=centerOf(b),ids=[...(b.residents||[]),...(b.workers||[])];ids.forEach((npcId,i)=>{const npc=d.npcs.find(n=>n.id===npcId);if(!npc||s.tokens.some(t=>t.npcId===npcId))return;const a=(i/Math.max(1,ids.length))*Math.PI*2,r=Math.min(45,15+ids.length*2);s.tokens.push({id:id('tok'),npcId,buildingId:b.id,name:npc.name,x:c.x+Math.cos(a)*r,y:c.y+Math.sin(a)*r,radius:24,color:'#ffb25f',hidden:false,visible:true,autoNpc:true});count++})}return count}

  function featureCollection(s){
    const features=[];
    for(const b of s.buildings)features.push({type:'Feature',id:b.backendFeatureId||undefined,geometry:{type:'Polygon',coordinates:[[...b.points.map(p=>[p.x,p.y]),[b.points[0].x,b.points[0].y]]]},properties:{name:b.name,semanticType:'BUILDING',linkedEntityType:'LOCATION',linkedEntityId:b.id,tablegateLocalId:b.id,functionalCategory:b.functionalCategory,buildingType:b.type,capacity:b.capacity,tags:b.tags,services:b.services,residents:b.residents,workers:b.workers,visitors:b.visitors,access:b.access,locked:b.locked,provenance:b.provenance}});
    for(const w of s.walls)features.push({type:'Feature',id:w.backendFeatureId||undefined,geometry:{type:'LineString',coordinates:[[w.a.x,w.a.y],[w.b.x,w.b.y]]},properties:{name:w.name,semanticType:'WALL',linkedEntityType:'VTT_WALL',linkedEntityId:w.id,blocksLight:w.blocksLight,blocksMovement:w.blocksMovement,width:w.width}});
    for(const d of s.doors)features.push({type:'Feature',id:d.backendFeatureId||undefined,geometry:{type:'LineString',coordinates:[[d.a.x,d.a.y],[d.b.x,d.b.y]]},properties:{name:d.name,semanticType:'DOOR',linkedEntityType:'VTT_DOOR',linkedEntityId:d.id,open:d.open,locked:d.locked,secret:d.secret}});
    for(const l of s.lights)features.push({type:'Feature',id:l.backendFeatureId||undefined,geometry:{type:'Point',coordinates:[l.x,l.y]},properties:{name:l.name,semanticType:'LIGHT',linkedEntityType:'VTT_LIGHT',linkedEntityId:l.id,radius:l.radius,color:l.color,intensity:l.intensity,angle:l.angle,direction:l.direction,castsShadows:l.castsShadows}});
    for(const z of s.soundZones)features.push({type:'Feature',id:z.backendFeatureId||undefined,geometry:{type:'Point',coordinates:[z.x,z.y]},properties:{name:z.name,semanticType:'SOUND_ZONE',linkedEntityType:'VTT_SOUND_ZONE',linkedEntityId:z.id,radius:z.radius,src:z.src,catalogId:z.catalogId,volume:z.volume,falloff:z.falloff,loop:z.loop,autoplay:z.autoplay}});
    return{type:'FeatureCollection',features};
  }
  async function syncBackend(){
    if(!State.token)throw new Error('Sign in before syncing this scene.');if(!canManageVtt())throw new Error('Campaign-runner permission is required to sync maps.');const s=scene();let mapId=s.backend.mapId,layerId=s.backend.layerId;
    if(!mapId){const result=await API.call('createMap',{tablegateId:serverId(),name:s.name,width:s.width,height:s.height,projection:'PIXEL',settings:{tablegateVttVersion:VERSION,grid:s.grid,form:s.form,scaleFamily:s.scaleFamily,pinColor:PIN_COLORS[s.scaleFamily],biomes:s.biomes,fog:s.fog,background:s.background.imageDataUrl?{embeddedLocally:true,fit:s.background.fit,color:s.background.color}:{fit:s.background.fit,color:s.background.color}}});mapId=result.map?.id||result.id;layerId=result.defaultLayer?.id||'';s.backend.mapId=mapId;s.backend.layerId=layerId}
    else await API.call('updateMap',{mapId,name:s.name,width:s.width,height:s.height,projection:'PIXEL',settings:{tablegateVttVersion:VERSION,grid:s.grid,form:s.form,scaleFamily:s.scaleFamily,pinColor:PIN_COLORS[s.scaleFamily],biomes:s.biomes,fog:s.fog}});
    const result=await API.call('bulkUpsertMapFeatures',{mapId,layerId,geojson:featureCollection(s)});for(const f of result.features||[]){const localId=f.properties?.tablegateLocalId||f.linkedEntityId;for(const list of [s.buildings,s.walls,s.doors,s.lights,s.soundZones]){const item=list.find(x=>x.id===localId);if(item)item.backendFeatureId=f.id}}
    const d=npcData();for(const npc of d.npcs||[]){const buildingId=npc.workBuildingId||npc.homeBuildingId;if(!buildingId)continue;try{if(npc.backendNpcId)await API.call('updateNpc',{npcId:npc.backendNpcId,locationType:'MAP_BUILDING',locationId:buildingId,state:{...(npc.state||{}),homeBuildingId:npc.homeBuildingId||'',workBuildingId:npc.workBuildingId||'',mapId}})}catch(error){if(error.code!=='NOT_FOUND')console.warn('NPC assignment sync skipped',npc.name,error)}}
    s.backend.lastSyncAt=now();markClean();refreshSyncBadge();toast(`Synced ${result.count||0} semantic map features to Backend V8.`,'success');return result;
  }
  function refreshSyncBadge(){const n=runtime.shell?.querySelector('.vtt8-sync-state');if(n){n.textContent=scene().backend.dirty?'Unsynced':'Synced';n.classList.toggle('dirty',scene().backend.dirty);n.classList.toggle('clean',!scene().backend.dirty)}}
  function exportJson(){const payload={type:'tablegate-vtt-worldbuilder',version:VERSION,exportedAt:now(),tablegateId:serverId(),state:data};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`tablegate-vtt-${scene().name.replace(/[^a-z0-9]+/gi,'-').toLowerCase()||'scene'}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1200)}
  async function importJson(file){if(!file)return;const raw=JSON.parse(await file.text()),incoming=raw.state||raw;if(!incoming.scenes)throw new Error('This file does not contain TableGate VTT scenes.');data=normalize(incoming);Store.set(storageKey(),data);toast(`${data.scenes.length} VTT scenes imported.`,'success');Workspace.render()}

  async function ensureAudioContext(){if(!runtime.audioContext)runtime.audioContext=new (window.AudioContext||window.webkitAudioContext)();if(runtime.audioContext.state==='suspended')await runtime.audioContext.resume();return runtime.audioContext}
  async function toggleAudio(zone){if(runtime.audioNodes.has(zone.id)){stopAudio(zone.id);refreshInspector();return}if(!zone.src)throw new Error('Choose a catalog track or enter a relative audio path first.');const ctx=await ensureAudioContext(),audio=new Audio(zone.src);audio.loop=zone.loop!==false;audio.crossOrigin='anonymous';const source=ctx.createMediaElementSource(audio),gain=ctx.createGain();source.connect(gain).connect(ctx.destination);runtime.audioNodes.set(zone.id,{audio,source,gain});await audio.play();updateAudio(true);refreshInspector()}
  function stopAudio(id){const node=runtime.audioNodes.get(id);if(!node)return;node.audio.pause();node.audio.src='';try{node.source.disconnect();node.gain.disconnect()}catch{}runtime.audioNodes.delete(id)}
  function updateAudio(force){if(!force&&Date.now()-runtime.lastAudioUpdate<100)return;runtime.lastAudioUpdate=Date.now();const s=scene(),listener=screenListenerWorld();for(const [id,node] of runtime.audioNodes){const z=s.soundZones.find(x=>x.id===id);if(!z){stopAudio(id);continue}const dist=pointDistance(listener,z),ratio=clamp(dist/Math.max(1,z.radius),0,1),fall=z.falloff==='none'?1:z.falloff==='inverse'?1/(1+ratio*5):1-ratio;node.gain.gain.value=(data.audio.muted?0:data.audio.master*data.audio.ambience*(z.volume??.65)*fall)}}
  function screenListenerWorld(){const c=runtime.canvas,s=scene();if(!c)return{x:s.width/2,y:s.height/2};const r=c.getBoundingClientRect();return{x:(r.width/2-s.viewport.x)/s.viewport.zoom,y:(r.height/2-s.viewport.y)/s.viewport.zoom}}

  window.TableGateVTTWorldbuilder=Object.freeze({render,bind,load:()=>deep(data),scene,autoAssignAll,placeAssignedNpcTokens,syncBackend,featureCollection,version:VERSION});
  try{if(typeof VTTStudio!=='undefined'){VTTStudio.render=render;VTTStudio.bind=bind}}catch(error){console.warn('VTTStudio override unavailable',error)}
})();
