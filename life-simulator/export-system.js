
(function(){
  'use strict';
  const LS = window.LifeSim;
  LS.exportState = () => {
    const data = Object.assign({}, LS.state, {exportedAt:LS.nowIso(), appVersion:LS.version});
    LS.download(`${LS.slug(LS.state.config?.settlementName || 'belavados_life_simulator')}.json`, 'application/json', JSON.stringify(data,null,2));
  };
  LS.exportHTML = () => {
    const s = LS.state; const e = LS.escape;
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${e(s.config?.settlementName||'Belavadös Export')}</title><style>body{font-family:Georgia,serif;background:#101418;color:#f4fbff;padding:24px}section{border:1px solid #4bd4e0;border-radius:14px;padding:14px;margin:14px 0;background:#172129}h1,h2{color:#70f7ff}.tag{display:inline-block;border:1px solid #e7c46b;color:#e7c46b;border-radius:999px;padding:3px 7px;margin:2px}table{width:100%;border-collapse:collapse}td,th{border-bottom:1px solid #39484d;padding:6px;text-align:left}</style></head><body>
    <h1>${e(s.config?.settlementName||'Belavadös Settlement')}</h1><p>${e(s.config?.settlementSize||'')} in ${e(s.config?.province||'')}. Population ${e(s.config?.population||'')}. Government: ${e(s.config?.government||'')}. Economy: ${e(s.config?.economy||'')}.</p>
    <section><h2>Biomes</h2>${(s.config?.biomeStack||[]).map(b=>`<span class="tag">${e(b.category)} / ${e(b.option)}</span>`).join('')}</section>
    <section><h2>Race Demographics</h2>${(s.config?.raceCache||s.raceCache||[]).map(r=>`<span class="tag">${e(r.name)} weight ${e(r.weight)}</span>`).join('')||'Full weighted Belavadös mix.'}</section>
    <section><h2>Locations</h2><table><tr><th>Name</th><th>Category</th><th>Services</th><th>Hook</th></tr>${(s.locations||[]).map(l=>`<tr><td>${e(l.name)}</td><td>${e(l.category)}</td><td>${(l.services||[]).slice(0,3).map(x=>e(x.item)).join(', ')}</td><td>${e(l.plotHook)}</td></tr>`).join('')}</table></section>
    <section><h2>NPCs</h2><table><tr><th>Name</th><th>Race</th><th>Identity</th><th>Work</th><th>Secret</th></tr>${(s.npcs||[]).map(n=>`<tr><td>${e(n.name)}</td><td>${e(n.race)}</td><td>${e(n.genderIdentity)} (${e(n.pronouns)})</td><td>${e(n.profession)} at ${e(n.workplace)}</td><td>${e(n.secret)}</td></tr>`).join('')}</table></section>
    <section><h2>Households</h2>${(s.households||[]).map(h=>`<h3>${e(h.name)}</h3><p>${e(h.residenceName)} — ${e(h.dynamic)}</p>`).join('')}</section>
    <section><h2>Factions and Intrigue</h2>${(s.factions||[]).map(f=>`<h3>${e(f.name)}</h3><p>Leader: ${e(f.leader)}. Rival: ${e(f.rival)}. Hook: ${e(f.questHook)}</p>`).join('')}</section>
    <section><h2>Schedules</h2>${(s.schedules||[]).slice(0,40).map(sc=>`<h3>${e(sc.npcName)}</h3><p>${e(sc.weekly?.[0]?.morning||'')} / ${e(sc.weekly?.[0]?.midday||'')} / ${e(sc.weekly?.[0]?.evening||'')}</p>`).join('')}</section>
    <section><h2>External Helper Notes</h2>${(s.onyxMemory||[]).map(m=>`<p>${e(m)}</p>`).join('')||'<p>No Onyx notes saved.</p>'}</section>
    </body></html>`;
    LS.download(`${LS.slug(s.config?.settlementName || 'belavados_settlement')}.html`, 'text/html', html);
  };
  const crcTable = (() => { let c, table=[]; for(let n=0;n<256;n++){ c=n; for(let k=0;k<8;k++) c=((c&1)?(0xedb88320^(c>>>1)):(c>>>1)); table[n]=c>>>0; } return table; })();
  const crc32 = (str) => { let crc=0 ^ -1; for(let i=0;i<str.length;i++){ crc=(crc>>>8)^crcTable[(crc^str.charCodeAt(i))&0xff]; } return (crc ^ -1) >>> 0; };
  const enc = (s) => new TextEncoder().encode(s);
  const u16 = (n) => [n&255,(n>>>8)&255]; const u32 = (n) => [n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255];
  LS.zipStored = (files) => {
    const chunks=[]; const central=[]; let offset=0;
    files.forEach(file=>{
      const nameBytes = enc(file.name); const dataBytes = enc(file.content); const crc = crc32(file.content); const local = new Uint8Array([...u32(0x04034b50),...u16(20),...u16(0),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(dataBytes.length),...u32(dataBytes.length),...u16(nameBytes.length),...u16(0)]);
      chunks.push(local,nameBytes,dataBytes);
      const cent = new Uint8Array([...u32(0x02014b50),...u16(20),...u16(20),...u16(0),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(dataBytes.length),...u32(dataBytes.length),...u16(nameBytes.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(offset)]);
      central.push(cent,nameBytes); offset += local.length + nameBytes.length + dataBytes.length;
    });
    const centralSize = central.reduce((a,c)=>a+c.length,0); const end = new Uint8Array([...u32(0x06054b50),...u16(0),...u16(0),...u16(files.length),...u16(files.length),...u32(centralSize),...u32(offset),...u16(0)]);
    return new Blob([...chunks,...central,end], {type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
  };
  LS.exportDOCX = () => {
    const s = LS.state; const xmlEsc = (v='') => String(v).replace(/[&<>]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]));
    const paras = [];
    const p = text => paras.push(`<w:p><w:r><w:t>${xmlEsc(text)}</w:t></w:r></w:p>`);
    p(`Belavadös Life Simulator Export: ${s.config?.settlementName || 'Settlement'}`); p(`${s.config?.settlementSize || ''} in ${s.config?.province || ''}. Population ${s.config?.population || ''}.`); p(`Government: ${s.config?.government || ''}. Economy: ${s.config?.economy || ''}. Danger: ${s.config?.dangerLevel || ''}.`);
    p('Biomes: ' + (s.config?.biomeStack||[]).map(b=>`${b.category}/${b.option}`).join('; ')); p('Primary deities: ' + (s.config?.primaryDeities||[]).join(', '));
    p('Locations:'); (s.locations||[]).slice(0,250).forEach(l=>p(`- ${l.name}: ${l.category}. ${l.description}`));
    p('NPCs:'); (s.npcs||[]).slice(0,500).forEach(n=>p(`- ${n.name}: ${n.age} ${n.race}, ${n.genderIdentity} (${n.pronouns}), ${n.profession} at ${n.workplace}. Secret: ${n.secret}`));
    p('Household and family trees:'); (s.households||[]).slice(0,120).forEach(h=>p(`- ${h.name}: ${(h.familyTypes||[]).join(', ')} at ${h.residenceName}. Members: ${(h.members||[]).map(m=>m.name+' as '+m.role).join('; ')}`));
    p('Transit schedules:'); (s.schedules||[]).slice(0,120).forEach(sc=>p(`- ${sc.npcName}: ${sc.transit?.mode||'local travel'}, ${sc.transit?.fareType||'standard'}, route ${sc.transit?.route||''}.`));
    p('Factions:'); (s.factions||[]).forEach(f=>p(`- ${f.name}: leader ${f.leader}, rival ${f.rival}. ${f.questHook}`));
    p('Player-safe summaries and DM-only notes are included in generated intrigue records in JSON export.');
    const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${paras.join('')}<w:sectPr/></w:body></w:document>`;
    const files = [
      {name:'[Content_Types].xml', content:'<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'},
      {name:'_rels/.rels', content:'<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'},
      {name:'word/document.xml', content:documentXml}
    ];
    LS.download(`${LS.slug(s.config?.settlementName || 'belavados_campaign_export')}.docx`, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', LS.zipStored(files));
  };
})();
