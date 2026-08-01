'use strict';
(()=>{
  const action=(name,payload={},auth=true)=>API.call(name,{serverId:payload.serverId||State.server?.id||'',...payload},auth);
  const fileToBase64=file=>new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result||'').split(',').pop()||'');r.onerror=()=>reject(r.error||new Error('File reading failed.'));r.readAsDataURL(file)});
  const client=Object.freeze({
    version:'2026-07-31.tablegate-v8.storage-accessibility.frontend.v1',
    health:()=>action('tablegate.storage.health',{},false),
    actions:()=>action('tablegate.storage.actions',{},false),
    setup:payload=>action('tablegate.storage.setup',payload),
    summary:payload=>action('tablegate.storage.summary',payload),
    exportAll:payload=>action('tablegate.storage.export',payload),
    listFolders:payload=>action('tablegate.storage.folder.list',payload),
    createFolder:payload=>action('tablegate.storage.folder.create',payload),
    listCategories:payload=>action('tablegate.storage.category.list',payload),
    upsertCategory:payload=>action('tablegate.storage.category.upsert',payload),
    listFiles:payload=>action('tablegate.storage.file.list',payload),
    getFile:payload=>action('tablegate.storage.file.get',payload),
    trashFile:payload=>action('tablegate.storage.file.trash',payload),
    restoreFile:payload=>action('tablegate.storage.file.restore',payload),
    async uploadFile(file,payload={}){if(!(file instanceof File))throw new TypeError('uploadFile requires a browser File.');return action('tablegate.storage.file.upload',{...payload,fileName:payload.fileName||file.name,mimeType:payload.mimeType||file.type||'application/octet-stream',base64:await fileToBase64(file)})},
    saveDocument:payload=>action('tablegate.document.save',payload),
    getDocument:payload=>action('tablegate.document.get',payload),
    listDocuments:payload=>action('tablegate.document.list',payload),
    searchDocuments:payload=>action('tablegate.document.search',payload),
    trashDocument:payload=>action('tablegate.document.trash',payload),
    restoreDocument:payload=>action('tablegate.document.restore',payload),
    exportDocument:payload=>action('tablegate.document.export',payload),
    importDocuments:payload=>action('tablegate.document.import.batch',payload),
    saveScan:payload=>action('tablegate.document.scan.save',payload),
    requestOcr:payload=>action('tablegate.document.ocr.request',payload),
    prepareReadAloud:payload=>action('tablegate.document.read.prepare',payload),
    getReadingProgress:payload=>action('tablegate.document.read.progress.get',payload),
    saveReadingProgress:payload=>action('tablegate.document.read.progress.save',payload),
    getAccessibilityPreferences:payload=>action('tablegate.accessibility.preferences.get',payload),
    saveAccessibilityPreferences:payload=>action('tablegate.accessibility.preferences.set',payload),
    saveState:(key,value,payload={})=>action('tablegate.sync.state.save',{...payload,key,value,deviceId:payload.deviceId||navigator.userAgent}),
    loadState:(key,payload={})=>action('tablegate.sync.state.load',{...payload,key}),
    listChanges:payload=>action('tablegate.sync.changes.list',payload),
    listTranscripts:payload=>action('tablegate.transcript.list',payload),
    requestTranscript:payload=>action('tablegate.transcript.request',payload),
    saveTranscript:payload=>action('tablegate.transcript.save',payload)
  });
  window.TableGateV8StorageAccessibility=client;
})();
