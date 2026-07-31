'use strict';
window.__tablegateInstallPrompt=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();window.__tablegateInstallPrompt=e;document.documentElement.classList.add('installable')});
window.addEventListener('appinstalled',()=>{window.__tablegateInstallPrompt=null;document.documentElement.classList.remove('installable');try{toast('TableGate installed.','success')}catch{}});
window.installTableGate=async()=>{const prompt=window.__tablegateInstallPrompt;if(!prompt){toast('Use your browser menu and choose “Install app” or “Add to Home Screen.”');return}await prompt.prompt();await prompt.userChoice;window.__tablegateInstallPrompt=null};
window.installTablegate=window.installTableGate;
if('serviceWorker' in navigator&&location.protocol!=='file:')window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').catch(err=>console.warn('Service worker registration failed',err)));
