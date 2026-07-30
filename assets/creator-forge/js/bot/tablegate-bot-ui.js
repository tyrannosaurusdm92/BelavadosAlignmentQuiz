(function(global){
  "use strict";
  const LS=global.LifeSimulator,SB=global.Superbot;
  if(!LS||!SB)return;
  const byId=id=>document.getElementById(id),esc=value=>LS.util.escape(value);
  let busy=false;
  function renderText(text){return String(text||"").split(/\n{2,}/).map(block=>`<p>${esc(block).replace(/\n/g,"<br>").replace(/\*\*([^*]+)\*\*/g,"<b>$1</b>").replace(/`([^`]+)`/g,"<code>$1</code>")}</p>`).join("");}
  function renderChat(){
    const conversation=SB.store.activeConversation(),target=byId("assistantChatLog");if(!target)return;
    target.innerHTML=conversation.messages.length?conversation.messages.map(message=>`<article class="assistant-message ${message.role} ${message.status||""}"><header><b>${message.role==="assistant"?"TableGate Assistant":"You"}</b><span>${esc(message.source||"")}</span></header><div>${renderText(message.content)}</div>${(message.actions||[]).length?`<section class="assistant-actions"><b>Reviewed project actions</b>${message.actions.map(action=>`<article><code>${esc(action.type)}</code><pre>${esc(JSON.stringify(action.payload,null,2))}</pre><button class="small" data-apply-assistant-action="${esc(action.actionId)}" data-message-id="${esc(message.id)}"${action.status==="applied"?" disabled":""}>${action.status==="applied"?"Applied":"Apply"}</button></article>`).join("")}</section>`:""}</article>`).join(""):`<div class="empty-card">Ask for help with any TableGate project task: people, locations, identities, systems, maps, schedules, transit, trip planning, dialogue, simulation, data design, audits, or image prompts.</div>`;
    target.scrollTop=target.scrollHeight;
  }
  async function send(text){if(busy)return;busy=true;byId("assistantSendBtn").disabled=true;try{await SB.tablegate.send(text);renderChat();}catch(error){LS.app.toast(error.message||String(error),"error");}finally{busy=false;byId("assistantSendBtn").disabled=false;}}
  function currentTargetOptions(){
    const state=LS.store.get(),kind=byId("imageTargetType")?.value||"none";let items=[];
    if(kind==="npc")items=state.npcs.map(x=>({id:x.npcId,label:`${x.name} · ${x.systemProfile?.ancestry||x.raceName||"entity"}`}));
    if(kind==="location")items=state.locations.map(x=>({id:x.locationId,label:`${x.name} · ${x.type}`}));
    if(kind==="map")items=(LS.mapViewer?.runtime?.nodes||[]).map(x=>({id:x.id,label:`${x.name||x.id} · ${x.semantic?"generated hierarchy":"map"}`}));
    byId("imageTargetId").innerHTML=`<option value="">No automatic assignment</option>${items.map(x=>`<option value="${esc(x.id)}">${esc(x.label)}</option>`).join("")}`;
  }
  async function renderAssets(){
    const state=LS.store.get(),target=byId("assistantAssetGallery");if(!target)return;
    target.innerHTML=(state.assets||[]).length?(state.assets||[]).map(asset=>`<article class="asset-card"><div class="asset-preview" data-tablegate-asset-id="${esc(asset.assetId)}"></div><div><h4>${esc(asset.name)}</h4><p>${esc(asset.kind)} · ${esc(asset.mimeType)}</p><small>${esc(asset.prompt||"")}</small></div><div class="card-actions"><button class="small" data-download-asset="${asset.assetId}">Download</button><button class="small ghost" data-assign-asset="${asset.assetId}">Assign</button><button class="small danger" data-delete-asset="${asset.assetId}">Delete</button></div></article>`).join(""):`<div class="empty-card">No generated images have been stored in this project yet.</div>`;
    await LS.assets.hydrate(target);
  }
  function renderSettings(){const s=SB.store.settings;byId("assistantRepository").value=s.repository||"";byId("assistantProjectToken").value=s.projectToken||"";byId("assistantUserId").value=s.userId||"local-user";byId("assistantFallback").checked=s.autoFallback!==false;byId("assistantCorpusCount").textContent=(SB.retrieval?.size?.()||0).toLocaleString();}
  async function loadCorpus(){try{await SB.corpusLoader?.load?.();if(byId("assistantCorpusCount"))byId("assistantCorpusCount").textContent=(SB.retrieval?.size?.()||0).toLocaleString();}catch(error){console.warn("Local assistant corpus could not load.",error);}}
  async function generateImage(){
    const prompt=byId("imagePrompt").value.trim();if(!prompt)return LS.app.toast("Describe the image to generate.","error");
    const button=byId("generateImageBtn");button.disabled=true;button.textContent="Generating…";
    try{const kind=byId("imageKind").value,targetType=byId("imageTargetType").value,targetId=byId("imageTargetId").value;const asset=await SB.tablegate.generateImage(prompt,{name:byId("imageName").value||`TableGate ${kind}`,kind,targetType:targetType==="none"?null:targetType,targetId:targetId||null,size:byId("imageSize").value,background:byId("imageBackground").value});if(targetType!=="none"&&targetId)await LS.assets.assign(asset.assetId,targetType,targetId);await renderAssets();LS.app.toast("Image generated and stored in the project.");}
    catch(error){LS.app.toast(error.message||String(error),"error");}finally{button.disabled=false;button.textContent="Generate Image";}
  }
  function findAction(messageId,actionId){const message=SB.store.activeConversation().messages.find(m=>m.id===messageId);return message?.actions?.find(a=>a.actionId===actionId);}
  function quickPrompt(kind){
    const prompts={
      npc:"Design a setting-appropriate NPC using the selected rules system and current project context. Include identity and editable pronouns, ancestry or equivalent, class or role equivalent, profession, personality, relationships, schedule, and a reviewed npc.generate action.",
      location:"Design a detailed setting-appropriate location that can be generated into the Map Viewer hierarchy. Include services, inhabitants, accessibility, hooks, and a reviewed location.generate action.",
      settlement:"Design a settlement with districts, locations, professions, households, and NPC population appropriate to the project era. Return a reviewed settlement.generate action.",
      transit:"Review the current locations and design a coherent transit network. Propose user-editable transit types, colored routes, stops, frequencies, transfer points, and scheduled services using reviewed transit actions.",
      trip:"Review the current transit network and help plan a practical trip, including transfers, waiting time, and any requested visit durations. Ask for missing origin or destination information rather than inventing IDs.",
      map:"Review the current location hierarchy and suggest how to structure nested maps from the largest scale down to interiors. Explain where transit stops and routes should be placed without inventing coordinates.",
      audit:"Audit the current TableGate project for missing links, contradictory records, inaccessible transit, orphaned NPCs or locations, unserved stops, broken route chains, and weak system neutrality. Do not apply changes automatically."
    };return prompts[kind]||"Help with the current TableGate project.";
  }
  function bind(){
    SB.store.load();renderSettings();renderChat();renderAssets();currentTargetOptions();
    byId("assistantSendBtn")?.addEventListener("click",()=>{const input=byId("assistantInput"),text=input.value.trim();if(text){input.value="";send(text);}});
    byId("assistantInput")?.addEventListener("keydown",event=>{if(event.key==="Enter"&&(event.ctrlKey||event.metaKey)){event.preventDefault();byId("assistantSendBtn").click();}});
    byId("assistantNewChat")?.addEventListener("click",()=>{SB.store.newConversation();renderChat();});
    byId("assistantClearChat")?.addEventListener("click",()=>{if(confirm("Clear this assistant conversation?")){SB.store.clearMessages();renderChat();}});
    document.querySelectorAll("[data-assistant-quick]").forEach(button=>button.addEventListener("click",async()=>{await loadCorpus();send(quickPrompt(button.dataset.assistantQuick));}));
    document.querySelectorAll('[data-view="assistant"]').forEach(button=>button.addEventListener("click",loadCorpus,{once:true}));
    byId("assistantSettingsForm")?.addEventListener("submit",event=>{event.preventDefault();SB.store.setSettings({repository:byId("assistantRepository").value.trim(),projectToken:byId("assistantProjectToken").value.trim(),userId:byId("assistantUserId").value.trim()||"local-user",autoFallback:byId("assistantFallback").checked});LS.app.toast("Assistant connection settings saved.");});
    byId("assistantHealthBtn")?.addEventListener("click",async()=>{const status=byId("assistantHealthStatus");status.textContent="Checking…";const result=await SB.client.health();status.textContent=result.ok===false?`Unavailable: ${result.error||"request failed"}`:"Project AI backend available";});
    byId("imageTargetType")?.addEventListener("change",currentTargetOptions);byId("generateImageBtn")?.addEventListener("click",generateImage);
    document.addEventListener("click",async event=>{
      let button=event.target.closest("[data-apply-assistant-action]");if(button){const action=findAction(button.dataset.messageId,button.dataset.applyAssistantAction);if(action){try{SB.tablegate.applyAction(action);renderChat();LS.app.renderAll();LS.transitUI?.renderAll();LS.app.toast("Reviewed action applied.");}catch(error){LS.app.toast(error.message||String(error),"error");}}}
      button=event.target.closest("[data-download-asset]");if(button)await LS.assets.download(button.dataset.downloadAsset);
      button=event.target.closest("[data-delete-asset]");if(button&&confirm("Delete this generated image from the project?")){await LS.assets.remove(button.dataset.deleteAsset);renderAssets();}
      button=event.target.closest("[data-assign-asset]");if(button){const type=prompt("Assign to: npc, location, or map?","npc");if(!["npc","location","map"].includes(type))return;const id=prompt(`Enter the ${type} record ID:`);if(id){await LS.assets.assign(button.dataset.assignAsset,type,id);renderAssets();LS.app.toast("Image assigned.");}}
    });
    LS.store.subscribe(()=>{if(document.querySelector('[data-view-panel="assistant"]')?.classList.contains("active")){currentTargetOptions();renderAssets();}});
  }
  SB.ui=Object.freeze({renderChat,renderAssets,send});document.addEventListener("DOMContentLoaded",bind);
})(window);
