(() => {
  'use strict';
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const presets = [
  {
    "id": "dirt0",
    "name": "dirt0",
    "group": "Dirt",
    "renderer": "dirt",
    "seed": 11,
    "sourceName": "dirt0.png"
  },
  {
    "id": "dirt1",
    "name": "dirt1",
    "group": "Dirt",
    "renderer": "dirt",
    "seed": 12,
    "sourceName": "dirt1.png"
  },
  {
    "id": "dirt2",
    "name": "dirt2",
    "group": "Dirt",
    "renderer": "dirt",
    "seed": 13,
    "sourceName": "dirt2.png"
  },
  {
    "id": "dirt-e",
    "name": "dirt e",
    "group": "Dirt Edges",
    "renderer": "dirt-edge",
    "seed": 14,
    "sourceName": "dirt_e.png"
  },
  {
    "id": "dirt-full",
    "name": "dirt full",
    "group": "Dirt Edges",
    "renderer": "dirt-edge",
    "seed": 15,
    "sourceName": "dirt_full.png"
  },
  {
    "id": "dirt-n",
    "name": "dirt n",
    "group": "Dirt Edges",
    "renderer": "dirt-edge",
    "seed": 16,
    "sourceName": "dirt_n.png"
  },
  {
    "id": "dirt-ne",
    "name": "dirt ne",
    "group": "Dirt Edges",
    "renderer": "dirt-edge",
    "seed": 17,
    "sourceName": "dirt_ne.png"
  },
  {
    "id": "dirt-nw",
    "name": "dirt nw",
    "group": "Dirt Edges",
    "renderer": "dirt-edge",
    "seed": 18,
    "sourceName": "dirt_nw.png"
  },
  {
    "id": "dirt-s",
    "name": "dirt s",
    "group": "Dirt Edges",
    "renderer": "dirt-edge",
    "seed": 19,
    "sourceName": "dirt_s.png"
  },
  {
    "id": "dirt-se",
    "name": "dirt se",
    "group": "Dirt Edges",
    "renderer": "dirt-edge",
    "seed": 20,
    "sourceName": "dirt_se.png"
  },
  {
    "id": "dirt-sw",
    "name": "dirt sw",
    "group": "Dirt Edges",
    "renderer": "dirt-edge",
    "seed": 21,
    "sourceName": "dirt_sw.png"
  },
  {
    "id": "dirt-w",
    "name": "dirt w",
    "group": "Dirt Edges",
    "renderer": "dirt-edge",
    "seed": 22,
    "sourceName": "dirt_w.png"
  },
  {
    "id": "grass0-dirt-mix1",
    "name": "grass0-dirt-mix1",
    "group": "Grass + Dirt",
    "renderer": "grass",
    "seed": 23,
    "sourceName": "grass0-dirt-mix1.png"
  },
  {
    "id": "grass0-dirt-mix2",
    "name": "grass0-dirt-mix2",
    "group": "Grass + Dirt",
    "renderer": "grass",
    "seed": 24,
    "sourceName": "grass0-dirt-mix2.png"
  },
  {
    "id": "grass0-dirt-mix3",
    "name": "grass0-dirt-mix3",
    "group": "Grass + Dirt",
    "renderer": "grass",
    "seed": 25,
    "sourceName": "grass0-dirt-mix3.png"
  },
  {
    "id": "grey-dirt0",
    "name": "grey dirt0",
    "group": "Grey Dirt",
    "renderer": "grey-dirt",
    "seed": 26,
    "sourceName": "grey_dirt0.png"
  },
  {
    "id": "grey-dirt1",
    "name": "grey dirt1",
    "group": "Grey Dirt",
    "renderer": "grey-dirt",
    "seed": 27,
    "sourceName": "grey_dirt1.png"
  },
  {
    "id": "grey-dirt2",
    "name": "grey dirt2",
    "group": "Grey Dirt",
    "renderer": "grey-dirt",
    "seed": 28,
    "sourceName": "grey_dirt2.png"
  },
  {
    "id": "grey-dirt3",
    "name": "grey dirt3",
    "group": "Grey Dirt",
    "renderer": "grey-dirt",
    "seed": 29,
    "sourceName": "grey_dirt3.png"
  },
  {
    "id": "grey-dirt4",
    "name": "grey dirt4",
    "group": "Grey Dirt",
    "renderer": "grey-dirt",
    "seed": 30,
    "sourceName": "grey_dirt4.png"
  },
  {
    "id": "grey-dirt5",
    "name": "grey dirt5",
    "group": "Grey Dirt",
    "renderer": "grey-dirt",
    "seed": 31,
    "sourceName": "grey_dirt5.png"
  },
  {
    "id": "grey-dirt6",
    "name": "grey dirt6",
    "group": "Grey Dirt",
    "renderer": "grey-dirt",
    "seed": 32,
    "sourceName": "grey_dirt6.png"
  },
  {
    "id": "grey-dirt7",
    "name": "grey dirt7",
    "group": "Grey Dirt",
    "renderer": "grey-dirt",
    "seed": 33,
    "sourceName": "grey_dirt7.png"
  },
  {
    "id": "floor-sand-stone0",
    "name": "floor sand stone0",
    "group": "Sandstone Floors",
    "renderer": "sandstone",
    "seed": 34,
    "sourceName": "floor_sand_stone0.png"
  },
  {
    "id": "floor-sand-stone1",
    "name": "floor sand stone1",
    "group": "Sandstone Floors",
    "renderer": "sandstone",
    "seed": 35,
    "sourceName": "floor_sand_stone1.png"
  },
  {
    "id": "floor-sand-stone2",
    "name": "floor sand stone2",
    "group": "Sandstone Floors",
    "renderer": "sandstone",
    "seed": 36,
    "sourceName": "floor_sand_stone2.png"
  },
  {
    "id": "floor-sand-stone3",
    "name": "floor sand stone3",
    "group": "Sandstone Floors",
    "renderer": "sandstone",
    "seed": 37,
    "sourceName": "floor_sand_stone3.png"
  },
  {
    "id": "floor-sand-stone4",
    "name": "floor sand stone4",
    "group": "Sandstone Floors",
    "renderer": "sandstone",
    "seed": 38,
    "sourceName": "floor_sand_stone4.png"
  },
  {
    "id": "floor-sand-stone5",
    "name": "floor sand stone5",
    "group": "Sandstone Floors",
    "renderer": "sandstone",
    "seed": 39,
    "sourceName": "floor_sand_stone5.png"
  },
  {
    "id": "stone-brick1",
    "name": "stone brick1",
    "group": "Stone Brick",
    "renderer": "brick",
    "seed": 40,
    "sourceName": "stone_brick1.png"
  },
  {
    "id": "stone-brick10",
    "name": "stone brick10",
    "group": "Stone Brick",
    "renderer": "brick",
    "seed": 41,
    "sourceName": "stone_brick10.png"
  },
  {
    "id": "stone-brick11",
    "name": "stone brick11",
    "group": "Stone Brick",
    "renderer": "brick",
    "seed": 42,
    "sourceName": "stone_brick11.png"
  },
  {
    "id": "stone-brick12",
    "name": "stone brick12",
    "group": "Stone Brick",
    "renderer": "brick",
    "seed": 43,
    "sourceName": "stone_brick12.png"
  },
  {
    "id": "stone-brick2",
    "name": "stone brick2",
    "group": "Stone Brick",
    "renderer": "brick",
    "seed": 44,
    "sourceName": "stone_brick2.png"
  },
  {
    "id": "stone-brick3",
    "name": "stone brick3",
    "group": "Stone Brick",
    "renderer": "brick",
    "seed": 45,
    "sourceName": "stone_brick3.png"
  },
  {
    "id": "stone-brick4",
    "name": "stone brick4",
    "group": "Stone Brick",
    "renderer": "brick",
    "seed": 46,
    "sourceName": "stone_brick4.png"
  },
  {
    "id": "stone-brick5",
    "name": "stone brick5",
    "group": "Stone Brick",
    "renderer": "brick",
    "seed": 47,
    "sourceName": "stone_brick5.png"
  },
  {
    "id": "stone-brick6",
    "name": "stone brick6",
    "group": "Stone Brick",
    "renderer": "brick",
    "seed": 48,
    "sourceName": "stone_brick6.png"
  },
  {
    "id": "stone-brick7",
    "name": "stone brick7",
    "group": "Stone Brick",
    "renderer": "brick",
    "seed": 49,
    "sourceName": "stone_brick7.png"
  },
  {
    "id": "stone-brick8",
    "name": "stone brick8",
    "group": "Stone Brick",
    "renderer": "brick",
    "seed": 50,
    "sourceName": "stone_brick8.png"
  },
  {
    "id": "stone-brick9",
    "name": "stone brick9",
    "group": "Stone Brick",
    "renderer": "brick",
    "seed": 51,
    "sourceName": "stone_brick9.png"
  },
  {
    "id": "stone-dark0",
    "name": "stone dark0",
    "group": "Dark Stone",
    "renderer": "dark-stone",
    "seed": 52,
    "sourceName": "stone_dark0.png"
  },
  {
    "id": "stone-dark2",
    "name": "stone dark2",
    "group": "Dark Stone",
    "renderer": "dark-stone",
    "seed": 53,
    "sourceName": "stone_dark2.png"
  },
  {
    "id": "stone-dark3",
    "name": "stone dark3",
    "group": "Dark Stone",
    "renderer": "dark-stone",
    "seed": 54,
    "sourceName": "stone_dark3.png"
  },
  {
    "id": "stone-gray0",
    "name": "stone gray0",
    "group": "Gray Stone",
    "renderer": "gray-stone",
    "seed": 55,
    "sourceName": "stone_gray0.png"
  },
  {
    "id": "stone-gray1",
    "name": "stone gray1",
    "group": "Gray Stone",
    "renderer": "gray-stone",
    "seed": 56,
    "sourceName": "stone_gray1.png"
  },
  {
    "id": "stone-gray2",
    "name": "stone gray2",
    "group": "Gray Stone",
    "renderer": "gray-stone",
    "seed": 57,
    "sourceName": "stone_gray2.png"
  },
  {
    "id": "feywild-grass-a",
    "name": "Feywild Grass A",
    "group": "Feywild",
    "renderer": "feywild",
    "seed": 58,
    "sourceName": "Feywild Grass A.jpg"
  },
  {
    "id": "feywild-grass-b",
    "name": "Feywild Grass B",
    "group": "Feywild",
    "renderer": "feywild",
    "seed": 59,
    "sourceName": "Feywild Grass B.jpg"
  },
  {
    "id": "feywild-grass-c",
    "name": "Feywild Grass C",
    "group": "Feywild",
    "renderer": "feywild",
    "seed": 60,
    "sourceName": "Feywild Grass C.jpg"
  },
  {
    "id": "feywild-grass-d",
    "name": "Feywild Grass D",
    "group": "Feywild",
    "renderer": "feywild",
    "seed": 61,
    "sourceName": "Feywild Grass D.jpg"
  },
  {
    "id": "water-texture-1-17x22",
    "name": "Water Texture 1 (17x22)",
    "group": "Water",
    "renderer": "water",
    "seed": 62,
    "sourceName": "Water Texture 1 (17x22).jpg"
  },
  {
    "id": "water-texture-1-8-5x11",
    "name": "Water Texture 1 (8.5x11)",
    "group": "Water",
    "renderer": "water",
    "seed": 63,
    "sourceName": "Water Texture 1 (8.5x11).jpg"
  },
  {
    "id": "water-texture-2-17x22",
    "name": "Water Texture 2 (17x22)",
    "group": "Water",
    "renderer": "water",
    "seed": 64,
    "sourceName": "Water Texture 2 (17x22).jpg"
  },
  {
    "id": "water-texture-2-8-5x11",
    "name": "Water Texture 2 (8.5x11)",
    "group": "Water",
    "renderer": "water",
    "seed": 65,
    "sourceName": "Water Texture 2 (8.5x11).jpg"
  },
  {
    "id": "water-texture-a",
    "name": "Water Texture A",
    "group": "Water",
    "renderer": "water",
    "seed": 66,
    "sourceName": "Water Texture A.jpg"
  },
  {
    "id": "water-texture-b",
    "name": "Water Texture B",
    "group": "Water",
    "renderer": "water",
    "seed": 67,
    "sourceName": "Water Texture B.jpg"
  },
  {
    "id": "water-texture",
    "name": "Water Texture",
    "group": "Water",
    "renderer": "water",
    "seed": 68,
    "sourceName": "Water Texture.png"
  },
  {
    "id": "dirt-road-brush",
    "name": "Dirt Road Brush",
    "group": "Roads",
    "renderer": "road",
    "seed": 971,
    "sourceName": "Dirt Road Brush.abr"
  }
];
  const presetMap = new Map(presets.map((p) => [p.id, p]));

  function hashString(value) {
    let h = 2166136261 >>> 0;
    for (const ch of String(value)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    let s = (seed >>> 0) || 1;
    return () => { s += 0x6D2B79F5; let t=s; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; };
  }
  function makeCanvas(w, h=w) { const c=document.createElement('canvas'); c.width=Math.max(1,Math.round(w)); c.height=Math.max(1,Math.round(h)); return c; }
  function hexToRgb(hex) { let v=String(hex||'#000000').replace('#',''); if(v.length===3)v=v.split('').map(c=>c+c).join(''); const n=parseInt(v.slice(0,6),16)||0; return [(n>>16)&255,(n>>8)&255,n&255]; }
  function rgba(hex, a=1) { const [r,g,b]=hexToRgb(hex); return `rgba(${r},${g},${b},${clamp(a,0,1)})`; }
  function mixHex(a,b,t=.5) { const A=hexToRgb(a),B=hexToRgb(b); return '#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join(''); }
  function noiseDots(ctx, random, count, colors, min=1, max=5, alpha=.35) {
    for(let i=0;i<count;i++){ const r=min+random()*(max-min); ctx.fillStyle=rgba(colors[Math.floor(random()*colors.length)],alpha*(.35+random()*.65)); ctx.beginPath(); ctx.arc(random()*ctx.canvas.width,random()*ctx.canvas.height,r,0,Math.PI*2); ctx.fill(); }
  }
  function fibers(ctx, random, count, colors, length=12, alpha=.24) {
    ctx.lineCap='round';
    for(let i=0;i<count;i++){ const x=random()*ctx.canvas.width,y=random()*ctx.canvas.height,a=random()*Math.PI*2,l=length*(.3+random()); ctx.strokeStyle=rgba(colors[Math.floor(random()*colors.length)],alpha*(.4+random()*.6)); ctx.lineWidth=.5+random()*1.5; ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);ctx.stroke(); }
  }
  function cloudy(ctx, random, colors, count=140) {
    ctx.fillStyle=colors[0];ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);
    ctx.save();ctx.globalCompositeOperation='soft-light';
    for(let i=0;i<count;i++){ const x=random()*ctx.canvas.width,y=random()*ctx.canvas.height,r=10+random()*45,g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,rgba(colors[1+Math.floor(random()*(colors.length-1))],.32));g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2); }
    ctx.restore();
  }
  function drawDirt(ctx, random, variant, gray=false) {
    const palettes=gray ? [['#252525','#454545','#777777','#111111'],['#515151','#797979','#9b9b9b','#303030'],['#34313a','#5b5660','#807b86','#1e1c22']] : [['#6f4314','#9a681d','#c28a2f','#42270f'],['#8c5a17','#c28622','#daa541','#54320c'],['#58441f','#81642d','#b3934a','#352812']];
    const p=palettes[variant%palettes.length]; cloudy(ctx,random,p,120); noiseDots(ctx,random,650,p,.3,2.5,.42); fibers(ctx,random,180,p,8,.18);
  }
  function drawGrass(ctx, random, variant) {
    drawDirt(ctx,random,variant,false);
    const greens=[['#235f15','#3e8f1b','#77b82a','#123b0c'],['#557b11','#83a918','#b6d142','#2f510b'],['#347510','#5ca51e','#9ccc36','#1d4b0c']][variant%3];
    ctx.save();ctx.globalCompositeOperation='source-over';
    for(let i=0;i<900;i++){ const x=random()*ctx.canvas.width,y=random()*ctx.canvas.height,l=2+random()*8;ctx.strokeStyle=rgba(greens[Math.floor(random()*greens.length)],.45+random()*.45);ctx.lineWidth=.45+random()*1.2;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+(random()-.5)*3,y-l*.55,x+(random()-.5)*5,y-l);ctx.stroke(); }
    // irregular bare dirt patches
    ctx.globalCompositeOperation='multiply';
    for(let i=0;i<7;i++){const x=random()*ctx.canvas.width,y=random()*ctx.canvas.height,r=12+random()*34,g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba(120,65,14,.58)');g.addColorStop(1,'rgba(120,65,14,0)');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}
    ctx.restore();
  }
  function drawSandstone(ctx, random, variant) {
    const palettes=[['#b7b89a','#dddcc0','#83856c','#6e6b52'],['#c4c7a9','#eeeccb','#97977a','#77745d'],['#aaa98b','#d4d3b1','#77745e','#67634f']]; const p=palettes[variant%3];
    cloudy(ctx,random,p,90);noiseDots(ctx,random,520,p,.25,2.2,.34);
    ctx.strokeStyle=rgba(p[3],.22);ctx.lineWidth=1;
    for(let i=0;i<8;i++){let x=random()*ctx.canvas.width,y=random()*ctx.canvas.height;ctx.beginPath();ctx.moveTo(x,y);for(let j=0;j<5;j++){x+=(random()-.5)*18;y+=(random()-.5)*18;ctx.lineTo(x,y);}ctx.stroke();}
  }
  function drawStone(ctx, random, variant, dark=false) {
    const p=dark?['#090a0b','#1c1d1f','#2f3033','#000000']:['#55585b','#828589','#b0b2b4','#343638'];
    ctx.fillStyle=p[variant%3===0?1:0];ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);
    const cell=34+(variant%3)*8;
    for(let y=-cell;y<ctx.canvas.height+cell;y+=cell){ for(let x=-cell;x<ctx.canvas.width+cell;x+=cell){ const jitter=(random()-.5)*8; const xx=x+jitter,yy=y+(random()-.5)*8;ctx.fillStyle=rgba(p[1+Math.floor(random()*2)],.38);ctx.beginPath();ctx.moveTo(xx+4,yy);ctx.lineTo(xx+cell-5,yy+3);ctx.lineTo(xx+cell-1,yy+cell-7);ctx.lineTo(xx+5,yy+cell-2);ctx.closePath();ctx.fill();ctx.strokeStyle=rgba(p[3],.45);ctx.stroke(); } }
    noiseDots(ctx,random,380,p,.2,1.8,.28);
  }
  function drawBrick(ctx, random, variant) {
    const dark=variant>=9; const base=dark?'#3f4142':'#9b9d9b', mortar=dark?'#161719':'#363839';ctx.fillStyle=mortar;ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);
    const bw=42+(variant%4)*6,bh=24+(variant%3)*3;
    for(let row=0,y=1;y<ctx.canvas.height+bh;row++,y+=bh){const offset=(row%2)*bw/2;for(let x=-offset;x<ctx.canvas.width+bw;x+=bw){const shade=.72+random()*.35;const c=mixHex(base,random()>.5?'#ffffff':'#000000',Math.abs(1-shade)*.35);ctx.fillStyle=c;ctx.fillRect(x+2,y+2,bw-4,bh-4);const g=ctx.createLinearGradient(x,y,x,y+bh);g.addColorStop(0,'rgba(255,255,255,.18)');g.addColorStop(1,'rgba(0,0,0,.22)');ctx.fillStyle=g;ctx.fillRect(x+2,y+2,bw-4,bh-4);}}
    noiseDots(ctx,random,240,['#ffffff','#000000'],.2,1.2,.18);
  }
  function drawWater(ctx, random, variant) {
    const palettes=[['#1b5b6b','#2e7f8e','#75b9bd','#0a3340'],['#3d7e86','#65a8ad','#b2d5d4','#24535b'],['#14516a','#1f7892','#4fb2bd','#082e43']]; const p=palettes[variant%3];cloudy(ctx,random,p,160);
    ctx.save();ctx.globalCompositeOperation='screen';ctx.lineCap='round';
    for(let i=0;i<120;i++){const y=random()*ctx.canvas.height,a=1+random()*3,phase=random()*Math.PI*2;ctx.strokeStyle=rgba(i%3===0?'#d4ffff':p[2],.08+random()*.22);ctx.lineWidth=.4+random()*1.6;ctx.beginPath();for(let x=-4;x<=ctx.canvas.width+4;x+=5){const yy=y+Math.sin(x*.08+phase)*a+(random()-.5)*.7;x<0?ctx.moveTo(x,yy):ctx.lineTo(x,yy);}ctx.stroke();}
    ctx.restore();
  }
  function drawFeywild(ctx, random, variant) {
    const palettes=[['#4f7158','#779b76','#b4c59c','#354b40'],['#695c6e','#99899b','#c8b6c6','#443848'],['#3e6d70','#75a3a0','#b5d0c4','#294e54'],['#8c6b28','#b89649','#d8bd6f','#5a4318']];const p=palettes[variant%4];cloudy(ctx,random,p,210);noiseDots(ctx,random,450,p,.3,2.7,.22);
    ctx.save();ctx.globalCompositeOperation='screen';for(let i=0;i<55;i++){const x=random()*ctx.canvas.width,y=random()*ctx.canvas.height,r=1+random()*4,g=ctx.createRadialGradient(x,y,0,x,y,r*4);g.addColorStop(0,'rgba(225,255,225,.55)');g.addColorStop(1,'rgba(225,255,225,0)');ctx.fillStyle=g;ctx.fillRect(x-r*4,y-r*4,r*8,r*8);}ctx.restore();
  }
  function drawEdge(ctx, random, id) {
    drawGrass(ctx,random,0); const edge=id.replace('dirt-','').replace('dirt_','');
    const dirs={n:[0,0,1,.42],s:[0,.58,1,.42],e:[.58,0,.42,1],w:[0,0,.42,1],ne:[.45,0,.55,.55],nw:[0,0,.55,.55],se:[.45,.45,.55,.55],sw:[0,.45,.55,.55],full:[0,0,1,1]}; const r=dirs[edge]||dirs.full;
    ctx.save();ctx.beginPath();ctx.rect(r[0]*ctx.canvas.width,r[1]*ctx.canvas.height,r[2]*ctx.canvas.width,r[3]*ctx.canvas.height);ctx.clip();drawDirt(ctx,random,1,false);ctx.restore();
  }
  function drawRoad(ctx, random) {
    drawGrass(ctx,random,0);ctx.save();const w=ctx.canvas.width;const g=ctx.createLinearGradient(0,0,w,0);g.addColorStop(0,'rgba(80,49,18,0)');g.addColorStop(.18,'rgba(103,62,19,.75)');g.addColorStop(.5,'rgba(155,105,41,.92)');g.addColorStop(.82,'rgba(103,62,19,.75)');g.addColorStop(1,'rgba(80,49,18,0)');ctx.fillStyle=g;ctx.fillRect(0,0,w,ctx.canvas.height);fibers(ctx,random,240,['#3b230d','#d1a45a'],9,.25);ctx.restore();
  }
  function drawTexture(ctx, preset, options={}) {
    const random=rng((preset.seed||1)+Math.floor((options.seed||0)*997)); const variant=(preset.seed||0)%13;
    if(preset.renderer==='grass')drawGrass(ctx,random,variant);
    else if(preset.renderer==='grey-dirt')drawDirt(ctx,random,variant,true);
    else if(preset.renderer==='sandstone')drawSandstone(ctx,random,variant);
    else if(preset.renderer==='brick')drawBrick(ctx,random,variant);
    else if(preset.renderer==='dark-stone')drawStone(ctx,random,variant,true);
    else if(preset.renderer==='gray-stone')drawStone(ctx,random,variant,false);
    else if(preset.renderer==='water')drawWater(ctx,random,variant);
    else if(preset.renderer==='feywild')drawFeywild(ctx,random,variant);
    else if(preset.renderer==='dirt-edge')drawEdge(ctx,random,preset.id);
    else if(preset.renderer==='road')drawRoad(ctx,random);
    else drawDirt(ctx,random,variant,false);
  }
  function createTextureTile(id, options={}) {
    const preset=presetMap.get(id)||presets[0]; const scale=clamp(Number(options.scale)||1,.15,6); const size=clamp(Math.round((Number(options.tileSize)||192)*scale),48,768); const c=makeCanvas(size); drawTexture(c.getContext('2d'),preset,options); return c;
  }
  function createPattern(ctx,id,options={}) {
    const tile=createTextureTile(id,options);const pattern=ctx.createPattern(tile,'repeat');
    if(pattern?.setTransform){const angle=(Number(options.angle)||0)*Math.PI/180;const m=new DOMMatrix();m.rotateSelf(angle*180/Math.PI);pattern.setTransform(m);}
    return pattern;
  }
  function fillTexture(ctx,width,height,id,options={}) {
    ctx.save();ctx.globalAlpha=clamp(Number(options.opacity??1),0,1);ctx.globalCompositeOperation=options.blend||'source-over';ctx.fillStyle=createPattern(ctx,id,options);ctx.fillRect(0,0,width,height);ctx.restore();
  }
  function paintTextureStroke(ctx,from,to,id,options={}) {
    const size=clamp(Number(options.size)||120,2,1800);ctx.save();ctx.globalAlpha=clamp(Number(options.opacity??1),0,1);ctx.globalCompositeOperation=options.blend||'source-over';ctx.strokeStyle=createPattern(ctx,id,options);ctx.lineWidth=size;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(from.x,from.y);ctx.lineTo(to.x,to.y);ctx.stroke();ctx.restore();
  }
  const gridPresets=[
    {id:'letter-portrait',name:'Grid 8.5 × 11',sourceName:'Grid (8.5x11).png',cell:64,majorEvery:5},
    {id:'tabloid-portrait',name:'Grid 17 × 22',sourceName:'Grid (17x22).png',cell:52,majorEvery:5},
    {id:'tabloid-landscape',name:'Grid 22 × 17',sourceName:'Grid (22x17).png',cell:52,majorEvery:5},
    {id:'seamless-1',name:'Seamless Grid 1 × 1',sourceName:'Seamless Grid Pattern (1x1).png',cell:48,majorEvery:1},
    {id:'seamless-2',name:'Seamless Grid 2 × 2',sourceName:'Seamless Grid Pattern (2x2).png',cell:48,majorEvery:2},
    {id:'seamless-3',name:'Seamless Grid 3 × 3',sourceName:'Seamless Grid Pattern (3x3).png',cell:48,majorEvery:3},
  ];
  function drawGrid(ctx,width,height,options={}) {
    ctx.clearRect(0,0,width,height);if(options.enabled===false)return;const preset=gridPresets.find(p=>p.id===options.preset)||gridPresets[3];const cell=clamp(Number(options.cellSize)||preset.cell,8,400);const major=Math.max(1,Number(options.majorEvery)||preset.majorEvery);const color=options.color||'#00FFFF';const opacity=clamp(Number(options.opacity??.38),0,1);const style=options.style||'square';
    ctx.save();ctx.globalAlpha=opacity;ctx.lineWidth=Math.max(.5,Number(options.lineWidth)||1);
    if(style==='hex'){const r=cell/2,h=Math.sqrt(3)*r;ctx.strokeStyle=color;for(let row=-1,y=0;y<height+h;row++,y+=h){for(let x=(row%2)*1.5*r-r;x<width+r;x+=3*r){ctx.beginPath();for(let i=0;i<6;i++){const a=Math.PI/3*i;const px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();ctx.stroke();}}}
    else if(style==='iso'){ctx.strokeStyle=color;const step=cell;for(let x=-height;x<width+height;x+=step){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+height,height);ctx.stroke();ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x-height,height);ctx.stroke();}}
    else {for(let x=0,i=0;x<=width;x+=cell,i++){ctx.strokeStyle=i%major===0?color:rgba(color,.62);ctx.lineWidth=i%major===0?1.7:1;ctx.beginPath();ctx.moveTo(x+.5,0);ctx.lineTo(x+.5,height);ctx.stroke();}for(let y=0,i=0;y<=height;y+=cell,i++){ctx.strokeStyle=i%major===0?color:rgba(color,.62);ctx.lineWidth=i%major===0?1.7:1;ctx.beginPath();ctx.moveTo(0,y+.5);ctx.lineTo(width,y+.5);ctx.stroke();}}
    ctx.restore();
  }
  function lightFactor(light,time){let f=1;if(light.pulse)f*=.88+Math.sin(time/360+hashString(light.id)%11)*.12;if(light.flicker)f*=.82+(Math.sin(time*.021+hashString(light.id))*.5+Math.sin(time*.047)*.25+.75)*.15;return clamp(f,.5,1.3);}
  function radial(ctx,light,radius,alpha,erase){const x=Number(light.x)||0,y=Number(light.y)||0,soft=clamp(Number(light.softness??.65),.05,1);ctx.save();if(light.type==='cone'){const a=(Number(light.rotation)||0)*Math.PI/180,half=(Number(light.angle)||70)*Math.PI/360;ctx.beginPath();ctx.moveTo(x,y);ctx.arc(x,y,radius,a-half,a+half);ctx.closePath();ctx.clip();}else if(light.type==='area'){ctx.beginPath();ctx.rect(x-(light.width||radius*1.4)/2,y-(light.height||radius)/2,light.width||radius*1.4,light.height||radius);ctx.clip();}const g=ctx.createRadialGradient(x,y,radius*(1-soft)*.2,x,y,radius);g.addColorStop(0,erase?`rgba(0,0,0,${alpha})`:rgba(light.color||'#FFD27A',alpha));g.addColorStop(Math.max(.15,1-soft),erase?`rgba(0,0,0,${alpha*.72})`:rgba(light.color||'#FFD27A',alpha*.38));g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(x-radius,y-radius,radius*2,radius*2);ctx.restore();}
  function drawLighting(ctx,width,height,lighting={},time=performance.now()){ctx.clearRect(0,0,width,height);if(lighting.enabled===false)return;const darkness=clamp(Number(lighting.darkness??.35),0,1),lights=(lighting.lights||[]).filter(l=>l.enabled!==false);const mask=makeCanvas(width,height),m=mask.getContext('2d');m.fillStyle=rgba(lighting.ambientColor||'#071019',darkness);m.fillRect(0,0,width,height);m.globalCompositeOperation='destination-out';for(const l of lights){const r=Math.max(4,(Number(l.radius)||280)*lightFactor(l,time));radial(m,l,r,clamp(Number(l.intensity??.8),0,1),true);}ctx.drawImage(mask,0,0);ctx.save();ctx.globalCompositeOperation='screen';for(const l of lights){const r=Math.max(4,(Number(l.radius)||280)*lightFactor(l,time));radial(ctx,l,r,clamp(Number(l.intensity??.8),0,1.5)*.48,false);}ctx.restore();}
  function renderTexturePreview(canvas,id,options={}){if(!canvas)return;const c=canvas.getContext('2d');c.clearRect(0,0,canvas.width,canvas.height);fillTexture(c,canvas.width,canvas.height,id,{...options,tileSize:128});}
  window.EffectsStudioMapEngine=Object.freeze({presets:Object.freeze(presets.map(p=>Object.freeze({...p}))),gridPresets:Object.freeze(gridPresets.map(p=>Object.freeze({...p}))),getPreset:(id)=>presetMap.get(id)||presets[0],createTextureTile,fillTexture,paintTextureStroke,drawGrid,drawLighting,renderTexturePreview});
})();
