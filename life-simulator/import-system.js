
(function(){
  'use strict';
  const LS = window.LifeSim;
  const textExt = /\.(json|txt|csv|md|markdown|html|htm)$/i;
  LS.initImporter = () => {
    // Render creates the importer markup; events are rebound there.
  };
  LS.bindImporterEvents = () => {
    const drop = LS.$('dropzone');
    const input = LS.$('fileInput');
    if(!drop || drop.dataset.bound) return;
    drop.dataset.bound = '1';
    ['dragenter','dragover'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault(); drop.classList.add('drag');}));
    ['dragleave','drop'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault(); drop.classList.remove('drag');}));
    drop.addEventListener('drop', e=>LS.handleFiles(e.dataTransfer.files));
    input?.addEventListener('change', e=>LS.handleFiles(e.target.files));
  };
  LS.handleFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    for(const file of files){ await LS.scanFile(file); }
    LS.saveLocal(); LS.render?.();
  };
  LS.scanFile = async (file) => {
    const duplicate = LS.state.imports.some(f=>f.name===file.name && f.size===file.size && f.lastModified===file.lastModified);
    if(duplicate){ LS.log(`Skipped duplicate import ${file.name}`); return; }
    const record = {id:LS.uid('imp'), name:file.name, size:file.size, type:file.type || 'unknown', lastModified:file.lastModified, status:'cataloged', findings:{}, errors:[]};
    try{
      if(textExt.test(file.name) || file.type.startsWith('text/')){
        const text = await file.text();
        record.status = 'scanned text'; record.textPreview = text.slice(0,1000); record.findings = LS.scanTextForLore(text);
        if(/\.json$/i.test(file.name)){
          try{
            const parsed = JSON.parse(text); record.status = 'valid JSON'; record.jsonKeys = Object.keys(parsed).slice(0,20);
            if(parsed.locations || parsed.npcs || parsed.config){ LS.importStateObject(parsed); record.status = 'imported simulator JSON'; }
          }catch(err){ record.errors.push('JSON parse failed: ' + err.message); }
        }
      } else if(/\.(docx|pdf|zip)$/i.test(file.name)){
        record.status = 'cataloged binary';
        record.errors.push('Browser-safe static mode catalogs this file and scans its filename. Convert or paste text for deeper body extraction. ZIP/DOCX/PDF body parsing can be added later with a larger parser library.');
        record.findings = LS.scanTextForLore(file.name);
      } else if(file.type.startsWith('image/')){
        record.status = 'reference image cataloged'; record.findings = LS.scanTextForLore(file.name);
      } else {
        record.status = 'unknown format cataloged'; record.findings = LS.scanTextForLore(file.name);
      }
    }catch(err){ record.status='error'; record.errors.push(err.message); }
    LS.state.imports.unshift(record);
  };
  LS.importStateObject = (obj) => {
    const safeKeys = ['config','locations','npcs','relationships','households','schedules','factions','services','intrigue','onyxMemory'];
    safeKeys.forEach(k=>{ if(obj[k]) LS.state[k] = obj[k]; });
    LS.state.validations = LS.validateState?.() || [];
  };
  LS.scanTextForLore = (text='') => {
    const lower = text.toLowerCase();
    const provinces = (LS.data.assignments||[]).map(p=>p.province).filter(p=>lower.includes(p.toLowerCase())).slice(0,30);
    const races = [];
    (LS.data.races.raceCategories||[]).forEach(c => (c.options||[]).forEach(o=>{ if(lower.includes(o.name.toLowerCase())) races.push(o.name); }));
    const biomes = [];
    Object.values(LS.data.rules.biomeTree||{}).flat().forEach(b=>{ if(lower.includes(b.toLowerCase())) biomes.push(b); });
    const deities = (LS.data.content.pantheon||[]).map(g=>g.name).filter(g=>lower.includes(g.toLowerCase()));
    const factions = (LS.data.factions.crossSettlementFactions||[]).map(f=>f.name).filter(f=>lower.includes(f.toLowerCase()));
    return {provinces:[...new Set(provinces)], races:[...new Set(races)].slice(0,40), biomes:[...new Set(biomes)], deities:[...new Set(deities)], factions:[...new Set(factions)]};
  };
})();
