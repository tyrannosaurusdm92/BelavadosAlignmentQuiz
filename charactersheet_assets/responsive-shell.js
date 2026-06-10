
(function(){
  function setShellHeight(){
    var shell=document.getElementById('belavados-site-shell');
    var h=shell ? Math.ceil(shell.getBoundingClientRect().height) : 0;
    document.documentElement.style.setProperty('--bd-shell-height', h + 'px');
  }
  function collapseDrawersOnLoad(){
    document.querySelectorAll('#belavados-site-shell details.bd-drawer').forEach(function(d){ d.removeAttribute('open'); });
  }
  function wireLongTextScroll(){
    var selectors='textarea,[contenteditable="true"],.card,.doc-card,.mini-panel,.panel,.box,.module,.tool-panel,.output,.result,.description,.notes,.log,.text-box';
    document.querySelectorAll(selectors).forEach(function(el){
      el.style.maxWidth='100%';
      if(!el.style.overflowWrap) el.style.overflowWrap='anywhere';
    });
  }
  function init(){
    collapseDrawersOnLoad();
    setShellHeight();
    wireLongTextScroll();
    window.addEventListener('resize', setShellHeight, {passive:true});
    document.querySelectorAll('#belavados-site-shell details').forEach(function(d){ d.addEventListener('toggle', setShellHeight); });
    setTimeout(setShellHeight, 50);
    setTimeout(setShellHeight, 300);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
