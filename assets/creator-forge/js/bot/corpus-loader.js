(function(global){
  "use strict";
  const SB=global.Superbot=global.Superbot||{};let promise=null;
  function loadScript(src){return new Promise((resolve,reject)=>{const script=document.createElement("script");script.src=src;script.async=false;script.onload=resolve;script.onerror=()=>reject(new Error(`Could not load ${src}`));document.head.appendChild(script);});}
  function load(){if(Array.isArray(global.SUPERBOT_INTELLIGENCE_CORPUS)&&global.SUPERBOT_INTELLIGENCE_CORPUS.length)return Promise.resolve(global.SUPERBOT_INTELLIGENCE_CORPUS);if(promise)return promise;promise=(async()=>{for(const src of ["js/bot/intelligence-corpus-part-1.js","js/bot/intelligence-corpus-part-2.js","js/bot/intelligence-corpus-part-3.js"])await loadScript(src);return global.SUPERBOT_INTELLIGENCE_CORPUS||[];})();return promise;}
  SB.corpusLoader=Object.freeze({load,get loaded(){return Array.isArray(global.SUPERBOT_INTELLIGENCE_CORPUS)&&global.SUPERBOT_INTELLIGENCE_CORPUS.length>0;}});
})(window);
