(function (global) {
  "use strict";
  const LS = global.LifeSimulator;
  if (!LS) return;
  const memory = new Map(); let dbPromise = null;
  function openDb(){
    if(!("indexedDB" in global))return Promise.resolve(null);
    if(dbPromise)return dbPromise;
    dbPromise=new Promise(resolve=>{const request=indexedDB.open("tablegate.assets.v1",1);request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains("assets"))db.createObjectStore("assets",{keyPath:"assetId"});};request.onsuccess=()=>resolve(request.result);request.onerror=()=>resolve(null);});
    return dbPromise;
  }
  async function putBlob(assetId,blob){const record={assetId,blob,updatedAt:LS.util.now()};const db=await openDb();if(!db){memory.set(assetId,record);return record;}return new Promise((resolve,reject)=>{const tx=db.transaction("assets","readwrite");tx.objectStore("assets").put(record);tx.oncomplete=()=>resolve(record);tx.onerror=()=>reject(tx.error);});}
  async function getBlob(assetId){const db=await openDb();if(!db)return memory.get(assetId)?.blob||null;return new Promise((resolve,reject)=>{const request=db.transaction("assets","readonly").objectStore("assets").get(assetId);request.onsuccess=()=>resolve(request.result?.blob||null);request.onerror=()=>reject(request.error);});}
  async function removeBlob(assetId){const db=await openDb();memory.delete(assetId);if(!db)return;return new Promise(resolve=>{const tx=db.transaction("assets","readwrite");tx.objectStore("assets").delete(assetId);tx.oncomplete=()=>resolve();tx.onerror=()=>resolve();});}
  function dataUrlToBlob(dataUrl){const [meta,data]=String(dataUrl).split(",",2),mime=/data:([^;]+)/.exec(meta)?.[1]||"image/png";const binary=atob(data),bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);return new Blob([bytes],{type:mime});}
  async function urlToBlob(url){const response=await fetch(url);if(!response.ok)throw new Error(`Image download failed with ${response.status}.`);return response.blob();}
  function extractImage(result){
    const candidates=[result?.image,result?.asset,result?.data?.image,result?.data?.asset,result?.data,result];
    for(const item of candidates){if(!item)continue;if(typeof item==="string"){if(item.startsWith("data:image/"))return{dataUrl:item};if(/^https?:/i.test(item))return{url:item};}
      const url=item.url||item.webContentLink||item.downloadUrl||item.imageUrl;const base64=item.b64_json||item.base64||item.base64Data||item.imageBase64;const dataUrl=item.dataUrl||item.data_url;
      if(dataUrl)return{dataUrl,mimeType:item.mimeType||item.type};if(base64)return{dataUrl:`data:${item.mimeType||item.type||"image/png"};base64,${base64}`};if(url)return{url,mimeType:item.mimeType||item.type};
    }
    return null;
  }
  async function saveGenerated(result,meta={}){
    const source=extractImage(result);if(!source)throw new Error("The backend response did not contain a usable image URL or encoded image.");
    const blob=source.dataUrl?dataUrlToBlob(source.dataUrl):await urlToBlob(source.url);
    const assetId=LS.util.uid("asset"),extension=(blob.type.split("/")[1]||"png").replace("jpeg","jpg");
    const record={assetId,name:meta.name||`Generated ${meta.kind||"image"}`,kind:meta.kind||"image",mimeType:blob.type||source.mimeType||"image/png",extension,prompt:meta.prompt||"",targetType:meta.targetType||null,targetId:meta.targetId||null,providerResult:{requestId:result?.requestId||null,responseId:result?.responseId||null},createdAt:LS.util.now(),modifiedAt:LS.util.now()};
    await putBlob(assetId,blob);LS.store.update(state=>{state.assets=Array.isArray(state.assets)?state.assets:[];state.assets.unshift(record);return state;});return record;
  }
  async function objectUrl(assetId){const blob=await getBlob(assetId);return blob?URL.createObjectURL(blob):null;}
  async function hydrate(root=document){const nodes=[...root.querySelectorAll("[data-tablegate-asset-id]")];for(const node of nodes){const id=node.dataset.tablegateAssetId;if(!id||node.dataset.assetHydrated===id)continue;const url=await objectUrl(id);if(!url)continue;if(node.tagName==="IMG")node.src=url;else node.style.backgroundImage=`url("${url}")`;node.dataset.assetHydrated=id;node.dataset.assetObjectUrl=url;}}
  async function assign(assetId,targetType,targetId){LS.store.update(state=>{const asset=(state.assets||[]).find(item=>item.assetId===assetId);if(asset){asset.targetType=targetType;asset.targetId=targetId;asset.modifiedAt=LS.util.now();}
    if(targetType==="npc"){const npc=state.npcs.find(item=>item.npcId===targetId);if(npc){npc.token=npc.token||{};npc.token.assetId=assetId;}}
    if(targetType==="location"){const location=state.locations.find(item=>item.locationId===targetId);if(location){location.imageAssetId=assetId;}}
    if(targetType==="map"){
      state.tablegate = state.tablegate || { mapNodes: [], mapLinks: [] }; state.tablegate.mapNodes = state.tablegate.mapNodes || []; state.tablegate.mapLinks = state.tablegate.mapLinks || [];
      const runtimeNode=LS.mapViewer?.runtime?.nodes?.find(item=>item.id===targetId); let persisted=state.tablegate.mapNodes.find(item=>item.id===targetId);
      if(runtimeNode?.semantic){
        const generatedId=`generated-map:${assetId}`;
        persisted={id:generatedId,name:asset?.name||`${runtimeNode.name} Map`,type:runtimeNode.type||"map",parentId:runtimeNode.id,locationId:runtimeNode.locationId||null,assetId,kind:"generated-image",createdAt:LS.util.now(),modifiedAt:LS.util.now()};
        state.tablegate.mapNodes.push(persisted);
        if(runtimeNode.locationId){state.tablegate.mapLinks=state.tablegate.mapLinks.filter(link=>link.locationId!==runtimeNode.locationId);state.tablegate.mapLinks.push({linkId:LS.util.uid("map-link"),mapNodeId:generatedId,locationId:runtimeNode.locationId,createdAt:LS.util.now()});}
      }else{
        if(!persisted){persisted={id:targetId||`generated-map:${assetId}`,name:runtimeNode?.name||asset?.name||"Generated Map",type:runtimeNode?.type||"map",parentId:runtimeNode?.parentId||null,locationId:runtimeNode?.locationId||null,createdAt:LS.util.now()};state.tablegate.mapNodes.push(persisted);}
        Object.assign(persisted,{assetId,kind:"generated-image",modifiedAt:LS.util.now()});
      }
      asset.targetId=persisted.id;
    }
    return state;});
    if(targetType==="map"){LS.mapViewer?.syncSemanticNodes?.({openRoot:false});const record=LS.store.get().assets.find(item=>item.assetId===assetId);if(record?.targetId)LS.mapViewer?.openNode?.(record.targetId);}await hydrate();}
  async function remove(assetId){await removeBlob(assetId);LS.store.update(state=>{state.assets=(state.assets||[]).filter(item=>item.assetId!==assetId);state.npcs.forEach(n=>{if(n.token?.assetId===assetId)delete n.token.assetId;});state.locations.forEach(l=>{if(l.imageAssetId===assetId)delete l.imageAssetId;});return state;});}
  async function download(assetId){const state=LS.store.get(),record=(state.assets||[]).find(item=>item.assetId===assetId),blob=await getBlob(assetId);if(record&&blob)LS.util.download(`${LS.util.safeFileName(record.name)}.${record.extension||"png"}`,blob,record.mimeType);}
  async function exportIntoZip(folder,state=LS.store.get()){for(const record of state.assets||[]){const blob=await getBlob(record.assetId);if(blob)folder.file(`${LS.util.safeFileName(record.name)}-${record.assetId}.${record.extension||"png"}`,blob);}}
  function bind(){const observer=new MutationObserver(()=>hydrate());observer.observe(document.body,{childList:true,subtree:true});hydrate();}
  LS.assets=Object.freeze({openDb,putBlob,getBlob,removeBlob,extractImage,saveGenerated,objectUrl,hydrate,assign,remove,download,exportIntoZip});
  document.addEventListener("DOMContentLoaded",bind);
})(window);
