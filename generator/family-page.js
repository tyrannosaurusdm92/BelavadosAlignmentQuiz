
(function(){
const B=window.BELAVADOS;
function init(){B.load(); bind(); render();}
function bind(){B.$('importFile')?.addEventListener('change',async e=>{if(e.target.files[0]){await B.importJSONFile(e.target.files[0]);render()}}); B.$('exportBtn')?.addEventListener('click',()=>B.exportJSON()); B.$('familySearch')?.addEventListener('input',render);}
function render(){const q=(B.$('familySearch')?.value||'').toLowerCase(); const by=Object.fromEntries((B.state.npcs||[]).map(n=>[n.id,n])); const list=(B.state.households||[]).filter(h=>{const names=(h.members||[]).map(id=>by[id]?.name).join(' '); return !q||[h.name,h.kind,h.homeLocationName,names].join(' ').toLowerCase().includes(q)}); const out=B.$('familyList'); if(out)out.innerHTML=list.map(h=>B.householdTree(h)).join('')||'<div class="notice">No households match.</div>'; const summary=B.$('summaryBox'); if(summary)summary.innerHTML=`<div class="stat"><b>${list.length}</b><span>shown</span></div><div class="stat"><b>${B.state.households.length}</b><span>total households</span></div>`;}
window.addEventListener('DOMContentLoaded',init);
})();
