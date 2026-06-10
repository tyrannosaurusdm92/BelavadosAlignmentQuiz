
(function(){
  const allowedPortalTexts = new Set(['upload files','refresh','reload','viewer','profile','manage sheets','sheet viewer','open','view','home','back','show','sign in / sign up','sign out','find email','find username','send reset email']);
  const blockedPortalTexts = /^(editor|sheet editor|edit|delete|save|source|show source)$/i;
  function label(el){ return ((el.textContent||el.value||el.getAttribute('aria-label')||el.title||el.id||'')+'').trim().toLowerCase().replace(/\s+/g,' '); }
  function shouldBlockDynamic(el){
    const page=(location.pathname.split('/').pop()||'').toLowerCase();
    const txt=label(el);
    if(page==='portal.html' && (el.matches('button,a') || el.getAttribute('role')==='button')){
      if(blockedPortalTexts.test(txt)) return true;
      if(/source|delete|sheet editor|\beditor\b/.test(txt) && !allowedPortalTexts.has(txt)) return true;
    }
    if(el.matches && el.matches('input[type="file"]') && !(['alignmentUpload','characterGeneratorUpload'].includes(el.id)) && !(page==='portal.html' && el.id==='sheetFiles')) return true;
    return false;
  }
  function apply(){
    document.querySelectorAll('[data-viewonly-blocked="true"]').forEach(el=>{
      el.hidden=true; el.setAttribute('aria-hidden','true');
      if('disabled' in el) el.disabled=true;
      el.querySelectorAll('input,button,select,textarea,a').forEach(c=>{ if('disabled' in c) c.disabled=true; c.setAttribute('aria-disabled','true'); });
    });
    document.querySelectorAll('[data-viewonly-readonly="true"]').forEach(el=>{
      if(el.matches('input,textarea')){ el.readOnly=true; el.setAttribute('readonly','readonly'); }
      else if(el.matches('select')){ el.disabled=true; el.setAttribute('aria-disabled','true'); }
    });
    document.querySelectorAll('button,a,input,select,textarea').forEach(el=>{
      if(shouldBlockDynamic(el)){
        el.dataset.viewonlyBlocked='true'; el.hidden=true; el.setAttribute('aria-hidden','true'); if('disabled' in el) el.disabled=true;
      }
    });
  }
  function blockedTarget(e){ return e.target && e.target.closest && e.target.closest('[data-viewonly-blocked="true"]'); }
  ['click','change','input','submit','drop','dragover'].forEach(type=>{
    document.addEventListener(type,function(e){ const b=blockedTarget(e); if(b){ e.preventDefault(); e.stopImmediatePropagation(); return false; } }, true);
  });
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',apply); else apply();
  new MutationObserver(apply).observe(document.documentElement,{childList:true,subtree:true});
})();
