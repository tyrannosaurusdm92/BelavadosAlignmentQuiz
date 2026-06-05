
(function(){
  if(window.__belavadosDualTimeInstalled) return;
  window.__belavadosDualTimeInstalled = true;
  const PAGE_LABEL = "Flat Map View";
  const BELA_DAY_RATIO = 0.9045;
  const BELA_YEAR_DAYS = 330;
  const MONTHS = ["Thoryn-Rahek", "Freysethysra", "Nefarokir", "Thalunesh", "Horundar", "Raeshkul", "Asethrimir", "Sokhivar", "Iskazunet", "Bastve’enlil", "Hathruna"];
  const WEEKDAYS = ['Valkhaday','Nebday','Sigranday','Ishtaday','Marduday','Enkirday','Anubaday'];
  function pad(n){return String(n).padStart(2,'0');}
  function ordinal(n){const s=['th','st','nd','rd'],v=n%100;return n+(s[(v-20)%10]||s[v]||s[0]);}
  function localZoneName(date){try{return new Intl.DateTimeFormat(undefined,{timeZoneName:'short'}).formatToParts(date).find(p=>p.type==='timeZoneName').value||'';}catch(e){return '';}}
  function earthParts(now){
    const y=now.getFullYear();
    const yearStart=new Date(y,0,1,0,0,0,0);
    const todayStart=new Date(y,now.getMonth(),now.getDate(),0,0,0,0);
    const doy=Math.floor((todayStart-yearStart)/86400000)+1;
    const frac=(now-todayStart)/86400000;
    return {year:y,doy,frac};
  }
  function driftStartDoy(year){return Math.floor((new Date(year,9,25)-new Date(year,0,1))/86400000)+1;}
  function belavadosParts(now){
    const ep=earthParts(now);
    const cycleFloat=((ep.doy-1)+ep.frac)/BELA_DAY_RATIO;
    const cycle=((cycleFloat % BELA_YEAR_DAYS)+BELA_YEAR_DAYS)%BELA_YEAR_DAYS;
    const monthIndex=Math.floor(cycle/30);
    const dayOfMonth=Math.floor(cycle%30)+1;
    const belDayOfYear=Math.floor(cycle)+1;
    const tf=cycle%1;
    const totalSeconds=Math.floor(tf*24*60*60);
    const bh=Math.floor(totalSeconds/3600), bm=Math.floor((totalSeconds%3600)/60), bs=totalSeconds%60;
    const driftDoy=driftStartDoy(ep.year);
    const isDrift=ep.doy>=driftDoy;
    const driftDay=ep.doy-driftDoy+1;
    return {month:MONTHS[monthIndex],monthNumber:monthIndex+1,dayOfMonth,belDayOfYear,bh,bm,bs,weekday:WEEKDAYS[now.getDay()],isDrift,driftDay,earthDoy:ep.doy,earthYear:ep.year};
  }
  function earthMonthName(now){return now.toLocaleDateString(undefined,{month:'long'});}
  function makePanel(){
    const div=document.createElement('section');
    div.className='bv-time-panel';
    div.setAttribute('aria-label','Live Earth and Belavadös time tracker');
    div.innerHTML=`<div class="bv-time-head"><div>⏱ <span>Earth / Belavadös Live Time</span></div><div><button class="bv-time-size" type="button" data-size="mini">smaller</button> <button class="bv-time-size" type="button" data-size="wide">larger</button> <button class="bv-time-toggle" type="button">hide</button></div></div><div class="bv-time-body"><div class="bv-time-card"><b>Earth player clock</b><strong data-bv-earth-main></strong><small data-bv-earth-sub></small></div><div class="bv-time-card"><b>Belavadös system clock</b><strong data-bv-bela-main></strong><small data-bv-bela-sub></small></div><div class="bv-time-card"><b>Month tracker</b><strong data-bv-month-main></strong><small data-bv-month-sub></small></div><div class="bv-time-card"><b>Day tracker</b><strong data-bv-day-main></strong><small data-bv-day-sub></small></div></div><div class="bv-time-foot"><em>${PAGE_LABEL}</em> uses Belavadös as the in-system reference. Earth time is shown first only as the player-facing table clock.</div>`;
    const mount=document.getElementById('timeTrackerMount');
    if(mount){mount.innerHTML='<details open><summary>Time Tracker</summary></details>'; mount.querySelector('details').appendChild(div);} else {document.body.appendChild(div);}
    const shell=mount||div;
    div.querySelector('.bv-time-toggle').addEventListener('click',()=>{shell.classList.toggle('collapsed');div.querySelector('.bv-time-toggle').textContent=shell.classList.contains('collapsed')?'show':'hide';});
    div.querySelectorAll('.bv-time-size').forEach(btn=>btn.addEventListener('click',()=>{shell.classList.remove('mini','wide');shell.classList.add(btn.dataset.size); if(shell.tagName!=='DIV'){} }));
    return div;
  }
  const panel=makePanel();
  function update(){
    const now=new Date();
    const b=belavadosParts(now);
    const earthMain=now.toLocaleDateString(undefined,{weekday:'short',year:'numeric',month:'short',day:'numeric'})+', '+now.toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit',second:'2-digit'});
    const earthSub=`Earth month ${earthMonthName(now)} • day ${b.earthDoy} of ${new Date(b.earthYear,1,29).getMonth()===1?366:365} • ${localZoneName(now)}`;
    const belaMain=b.isDrift ? `Drift Buffer Day ${b.driftDay}, ${b.weekday}, ${pad(b.bh)}:${pad(b.bm)}:${pad(b.bs)} Bh` : `${b.month} ${b.dayOfMonth}, ${b.weekday}, ${pad(b.bh)}:${pad(b.bm)}:${pad(b.bs)} Bh`;
    const belaSub=b.isDrift ? `35-Day Ghost / Compression Residue • Belavadös civil clock still ticking` : `Belavadös month ${b.monthNumber} of 11 • civil day ${b.belDayOfYear} of 330`;
    panel.querySelector('[data-bv-earth-main]').textContent=earthMain;
    panel.querySelector('[data-bv-earth-sub]').textContent=earthSub;
    panel.querySelector('[data-bv-bela-main]').textContent=belaMain;
    panel.querySelector('[data-bv-bela-sub]').textContent=belaSub;
    panel.querySelector('[data-bv-month-main]').textContent=`${earthMonthName(now)} / ${b.isDrift?'Drift Buffer':b.month}`;
    panel.querySelector('[data-bv-month-sub]').textContent=b.isDrift?'Earth date is active; Belavadös civic months are in drift handling.':`Earth month shown for players; Belavadös divine month shown for system lore.`;
    panel.querySelector('[data-bv-day-main]').textContent=`Earth ${ordinal(b.earthDoy)} day / Belavadös ${b.isDrift?'Drift '+ordinal(b.driftDay):ordinal(b.belDayOfYear)+' day'}`;
    panel.querySelector('[data-bv-day-sub]').textContent=`Weekday translation: ${now.toLocaleDateString(undefined,{weekday:'long'})} → ${b.weekday}`;
  }
  update(); setInterval(update,1000);

  function injectCometPanel(){
    if(!/Planet|Orbit|Planetary/i.test(document.title)) return;
    const right=document.getElementById('rightPanel');
    if(right && !document.getElementById('bvCometInline')){
      const box=document.createElement('div'); box.id='bvCometInline'; box.className='bv-comet-float';
      box.innerHTML=`<h3>Eiršu'neth Comet — Safe Orbit Shell</h3><div class="bv-comet-grid"><div><b>Family:</b> Vishtecu–Hyperu</div><div><b>Period:</b> 6.48 Belavadös years / 2,139.37 Belavadös days</div><div><b>Path:</b> 2.08–4.87 AU, a≈3.48 AU</div><div><b>Inclination:</b> 18° above the Celestial Road</div><div><b>Nucleus:</b> ~85 mi / 137 km</div><div><b>Mass:</b> ~500 trillion tons</div></div><p class="bv-comet-note">The comet is tracked as a Belavadös-system object, not an Earth object. Its perihelion stays outside Vishtecu–Hyperu, and its plane crossings occur only at perihelion and aphelion.</p>`;
      right.appendChild(box);
    }
    if(!document.getElementById('bvCometMaster')){
      const floater=document.createElement('aside'); floater.id='bvCometMaster'; floater.className='bv-comet-panel';
      floater.innerHTML=`<h2>☄ Eiršu'neth Comet</h2><p>Massive Vishtecu–Hyperu family omen-comet with a safe, visually dramatic, inclined orbit in the Belavadös solar system.</p><details><summary>Open master orbit table</summary><table><tr><td>Nucleus</td><td>~85 miles / 137 km; roughly 10–50× a typical comet core</td></tr><tr><td>Mass</td><td>~500 trillion tons; ~500× typical comet mass</td></tr><tr><td>Orbital period</td><td>6.48 Belavadös years / 2,139.37 Belavadös days</td></tr><tr><td>Orbit</td><td>Semi-major axis ≈3.48 AU; perihelion 2.08 AU; aphelion 4.87 AU; eccentricity ≈0.402</td></tr><tr><td>Inclination</td><td>18° above the Celestial Road; plane-crossing points only at perihelion and aphelion</td></tr><tr><td>Safety</td><td>Safe and non-impacting; perihelion stays just outside Vishtecu–Hyperu at 1.88 AU with about 0.20 AU clearance</td></tr><tr><td>Visibility</td><td>Brightest near perihelion; large icy-gas body with pale blue-white and smoky silver watercolor tail</td></tr><tr><td>Lore role</td><td>Festivals, prophecies, navigation, ring-watching events, and rare omen-comet traditions</td></tr></table></details>`;
      document.body.appendChild(floater);
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',injectCometPanel); else injectCometPanel();
})();
