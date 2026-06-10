
(function(){
  const pageJump=document.getElementById('bd-page-jump');
  if(pageJump){pageJump.addEventListener('change',e=>{if(e.target.value) location.href=e.target.value;});}
  const months=['Iskanora','Nebrakhamesh','Sigraveig','Mardrimir','Enkithyr','Anundar','Freyzunet','Nefarokir','Thalunesh','Horundar','Setrimir'];
  const weekdays=['Monday','Tuesday','Wednesday — Rest Day','Thursday','Friday','Saturday','Sunday'];
  const earthEl=document.getElementById('bd-earth-time'), belEl=document.getElementById('bd-belavados-time'), tzSel=document.getElementById('bd-timezone-select');
  function parseOffset(v){ if(v==null) return 0; if(typeof v==='number') return Math.max(-12,Math.min(12,v)); let s=String(v).trim(); let m=s.match(/([+-]?\d{1,2})(?::?\d{2})?/); return m?Math.max(-12,Math.min(12,parseInt(m[1],10))):0; }
  function findTZ(obj){ if(!obj||typeof obj!=='object') return null; const keys=['timeZone','timezone','utcOffset','belavadosTimeZone','belavados_timezone','settlementTimeZone','settlement_timezone']; for(const k of keys){ if(obj[k]!=null) return obj[k]; } for(const v of Object.values(obj)){ if(v&&typeof v==='object'){ const found=findTZ(v); if(found!=null) return found; } } return null; }
  function applyJSONTZ(obj){ const found=findTZ(obj); if(found!=null && tzSel){ tzSel.value=String(parseOffset(found)); localStorage.setItem('belavadosTimeZoneOffset',tzSel.value); tick(); } }
  try{ const saved=localStorage.getItem('belavadosTimeZoneOffset'); if(saved&&tzSel) tzSel.value=saved; }catch(e){}
  if(tzSel){ tzSel.addEventListener('change',()=>{try{localStorage.setItem('belavadosTimeZoneOffset',tzSel.value)}catch(e){} tick();}); }
  const file=document.getElementById('bd-time-json');
  if(file){ file.addEventListener('change', async ev=>{ const f=ev.target.files&&ev.target.files[0]; if(!f) return; try{applyJSONTZ(JSON.parse(await f.text()));}catch(err){alert('That JSON could not be read for a timezone field.');} }); }
  if(window.settlementData) applyJSONTZ(window.settlementData);
  function tick(){
    const now=new Date();
    if(earthEl){ earthEl.textContent=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',weekday:'long',year:'numeric',month:'short',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',timeZoneName:'short'}).format(now); }
    const off=tzSel?parseOffset(tzSel.value):0; const shifted=new Date(now.getTime()+off*3600000);
    const epoch=Date.UTC(2025,0,1); const days=Math.floor((shifted.getTime()-epoch)/86400000); const year=1+Math.floor(Math.max(0,days)/330); const doy=((days%330)+330)%330; const month=months[Math.floor(doy/30)]; const day=1+(doy%30); const weekday=weekdays[((days%7)+7)%7];
    const hh=String(shifted.getUTCHours()).padStart(2,'0'), mm=String(shifted.getUTCMinutes()).padStart(2,'0'), ss=String(shifted.getUTCSeconds()).padStart(2,'0');
    if(belEl){ belEl.textContent=`${weekday}, ${month} ${day}, Year ${year} • ${hh}:${mm}:${ss} (UTC${off>=0?'+':''}${off})`; }
  }
  tick(); setInterval(tick,1000);
})();
