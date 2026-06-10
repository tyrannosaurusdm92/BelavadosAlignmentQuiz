
(function(){
  const page=(location.pathname.split('/').pop()||'').toLowerCase();
  if(page==='belavados_map_player.html'){
    document.addEventListener('contextmenu', e => { if(e.target && e.target.closest && e.target.closest('canvas')) { e.preventDefault(); e.stopImmediatePropagation(); } }, true);
    window.__BELAVADOS_PLAYER_VIEW_ONLY__ = true;
  }
})();
