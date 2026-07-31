'use strict';
const CACHE_VERSION='tablegate-v10.0.0-public-access-20260731';
const CORE=[
  "./",
  "./tablegate.html",
  "./assets/images/tablegate/icons/favicon.ico",
  "./assets/images/tablegate/icons/tablegate-icon-152.png",
  "./assets/images/tablegate/icons/tablegate-icon-180.png",
  "./assets/images/tablegate/icons/tablegate-icon-192.png",
  "./assets/images/tablegate/icons/tablegate-icon-48.png",
  "./assets/images/tablegate/icons/tablegate-icon-512.png",
  "./assets/images/tablegate/icons/tablegate-icon-96.png",
  "./css/admins/backend-center/backend-center.css",
  "./css/admins/studio/studio.css",
  "./css/players/character-consent/character-consent.css",
  "./css/players/character-import/character-import.css",
  "./css/sessions/dice-roller/styles.css",
  "./css/tablegate/helpers/v6-helpers.css",
  "./css/tablegate/integrations/v5-integrations.css",
  "./css/tablegate/layout/responsive.css",
  "./css/tablegate/messaging/messenger.css",
  "./css/tablegate/organizer/organizer.css",
  "./css/tablegate/themes/cyan-theme.css",
  "./css/tablegate/workspaces/creator-player.css",
  "./js/admins/backend-center/backend-capability-center.js",
  "./js/admins/campaign/campaign-helpers.js",
  "./js/admins/encounters/encounter-lab.js",
  "./js/admins/maps/map-foundry.js",
  "./js/admins/npcs/npc-life.js",
  "./js/admins/studio/studio.js",
  "./js/admins/tools/integrated-tools.js",
  "./js/players/character-consent/character-consent.js",
  "./js/players/character-import/character-import-defaults.js",
  "./js/players/character-import/universal-character-import.js",
  "./js/players/character-sheets/character-sheet-library.js",
  "./js/sessions/dice-roller/dice-main-bot.js",
  "./js/sessions/dice-roller/dice.js",
  "./js/sessions/dice-roller/vendor/cannon-min.js",
  "./js/sessions/dice-roller/vendor/teal.js",
  "./js/sessions/dice-roller/vendor/three-min.js",
  "./js/sessions/dice/session-dice-integration.js",
  "./js/sessions/live/session-play.js",
  "./js/tablegate/backend/backend-parity.js",
  "./js/tablegate/backend/backend-route-catalog.js",
  "./js/tablegate/bootstrap/bootstrap.js",
  "./js/tablegate/components/embedded-apps.js",
  "./js/tablegate/components/tool-documents.js",
  "./js/tablegate/docs/docs-catalog.js",
  "./js/tablegate/integrations/v5-integrations.js",
  "./js/tablegate/integrations/v6-integrations.js",
  "./js/tablegate/knowledge/knowledge-pack-browser.js",
  "./js/tablegate/knowledge/knowledge-pack-catalog.js",
  "./js/tablegate/messaging/messenger-core.js",
  "./js/tablegate/organizer/organizer.js",
  "./js/tablegate/provenance/provenance.js",
  "./js/tablegate/pwa/pwa.js",
  "./js/tablegate/systems/tablegate-nine-systems.js",
  "./js/tablegate/vendor/jszip-min.js",
  "./js/tablegate/vendor/mammoth-browser-min.js",
  "./js/tablegate/workspaces/creator-player.js",
  "./json/tablegate/config/app-config.json",
  "./json/tablegate/config/deployment-lock.json",
  "./json/tablegate/knowledge-pack/catalog.json",
  "./json/tablegate/pwa/tablegate.webmanifest",
  "./json/tablegate/security/permissions.json",
  "./json/tablegate/systems/supported-systems.json"
];
const SENSITIVE=/(?:\/api\/|\/auth(?:entication)?\/|messages?|private|token|credential|password|session-data|saved\/|notes\/)/i;
self.addEventListener('install',event=>event.waitUntil(
  caches.open(CACHE_VERSION).then(async cache=>{
    for(const url of CORE){try{await cache.add(url)}catch(error){console.warn('Optional core cache miss',url,error)}}
  }).then(()=>self.skipWaiting())
));
self.addEventListener('activate',event=>event.waitUntil(
  caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE_VERSION).map(key=>caches.delete(key)))).then(()=>self.clients.claim())
));
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin||SENSITIVE.test(url.pathname))return;
  if(request.mode==='navigate'){
    event.respondWith(fetch(request).catch(()=>caches.match('./tablegate.html')));
    return;
  }
  const staticAsset=/\.(?:css|js|json|webmanifest|png|jpe?g|webp|gif|svg|ico|mp3|wav|ogg)$/i.test(url.pathname);
  if(staticAsset){
    event.respondWith(caches.match(request).then(cached=>{
      const refresh=fetch(request).then(response=>{if(response.ok)caches.open(CACHE_VERSION).then(cache=>cache.put(request,response.clone()));return response});
      return cached||refresh;
    }));
  }
});
