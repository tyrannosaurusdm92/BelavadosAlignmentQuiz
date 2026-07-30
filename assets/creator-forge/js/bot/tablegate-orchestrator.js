(function(global){
  "use strict";
  const LS=global.LifeSimulator, SB=global.Superbot=global.Superbot||{};
  if(!LS)return;
  const ACTION_CONTRACT={
    allowed:["npc.generate","location.generate","settlement.generate","transit.type.add","transit.stop.add","transit.route.add","transit.service.add","transit.trip.plan","project.note.add"],
    instruction:"Return normal prose, or a JSON object with summary:string and actions:[{type:string,payload:object}]. Actions are always reviewed before application."
  };
  function compactProjectContext(){
    const state=LS.store.get(),t=LS.transit.ensure(state),system=LS.systems?.resolveProfile?.(state.project.systemProfile)||state.project.systemProfile;
    return JSON.stringify({
      project:{name:state.project.name,description:state.project.description,genre:state.project.genre,era:state.project.era,systemProfile:system,simulationMinute:state.simulation.absoluteMinute??state.project.calendar.currentAbsoluteMinute},
      counts:{npcs:state.npcs.length,locations:state.locations.length,relationships:state.relationships.length,transitTypes:t.types.length,transitStops:t.stops.length,transitRoutes:t.routes.length,transitServices:t.services.length,vehicles:t.vehicles.length},
      locations:state.locations.slice(0,120).map(x=>({id:x.locationId,name:x.name,type:x.type,mapLevel:x.mapLevel,parentLocationId:x.parentLocationId,services:x.services})),
      npcs:state.npcs.slice(0,100).map(x=>({id:x.npcId,name:x.name,identity:x.genderIdentity,pronouns:x.pronouns?.label,ancestry:x.systemProfile?.ancestry||x.raceName,role:x.systemProfile?.role||x.profession,profession:x.profession,currentLocationId:x.simulation?.currentLocationId})),
      transit:{types:t.types.map(x=>({id:x.transitTypeId,name:x.name,category:x.category,color:x.color,model:x.travelModel,speed:x.speed,unit:x.speedUnit})),stops:t.stops.map(x=>({id:x.stopId,name:x.name,locationId:x.locationId})),routes:t.routes.map(x=>({id:x.routeId,name:x.name,typeId:x.transitTypeId,stopIds:x.stopIds})),services:t.services.map(x=>({id:x.serviceId,name:x.name,routeId:x.routeId,scheduleType:x.scheduleType,headwayMinutes:x.headwayMinutes}))},
      actionContract:ACTION_CONTRACT
    },null,2);
  }
  function normalizeCloud(result){const value=result&&(result.response||result.output_text||result.reply||result.message||result.answer||result.content);return value?String(value):result?.data?JSON.stringify(result.data,null,2):JSON.stringify(result,null,2);}
  function extractStructured(text){
    const candidates=[];const fenced=[...String(text||"").matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)].map(m=>m[1]);candidates.push(...fenced,String(text||""));
    for(const candidate of candidates){const first=candidate.indexOf("{"),last=candidate.lastIndexOf("}");if(first<0||last<=first)continue;try{const parsed=JSON.parse(candidate.slice(first,last+1));if(parsed&&Array.isArray(parsed.actions))return parsed;}catch{/*continue*/}}
    return null;
  }
  function sanitizeActions(actions){return (actions||[]).filter(action=>ACTION_CONTRACT.allowed.includes(action?.type)&&action.payload&&typeof action.payload==="object").slice(0,30).map(action=>({actionId:LS.util.uid("assistant-action"),type:action.type,payload:action.payload,status:"pending"}));}
  async function send(message,options={}){
    const text=String(message||"").trim();if(!text)throw new Error("Enter a request.");
    SB.store.addMessage("user",text);const pending=SB.store.addMessage("assistant","Working with the current TableGate project…",{status:"pending"});
    const context=[SB.SYSTEM_BASE,"Current TableGate project context:\n"+compactProjectContext(),"Structured action contract:\n"+JSON.stringify(ACTION_CONTRACT)].join("\n\n===\n\n");
    const history=SB.store.activeConversation().messages.filter(m=>m.status!=="pending"&&m.id!==pending.id).slice(-SB.CONFIG.maxHistoryMessages).map(m=>({role:m.role==="assistant"?"assistant":"user",content:m.content}));
    try{
      const result=await SB.client.chat({message:text,history,systemContext:context,references:[]});const answer=normalizeCloud(result),structured=extractStructured(answer),actions=sanitizeActions(structured?.actions);
      const visible=structured?.summary||answer;SB.store.updateMessage(pending.id,{content:visible,status:"complete",source:"backend",actions,meta:{requestId:result.requestId||null}});return SB.store.updateMessage(pending.id,{});
    }catch(error){
      try { await SB.corpusLoader?.load?.(); } catch { /* local corpus remains optional */ }
      const local=SB.retrieval?.offlineAnswer?.(text)||"The project backend is unavailable.";const answer=`${local}\n\nProject-safe fallback: no project changes were applied.\n\nConnection detail: ${error.message||error}`;
      SB.store.updateMessage(pending.id,{content:answer,status:"complete",source:"local-fallback",actions:[]});return SB.store.updateMessage(pending.id,{});
    }
  }
  function applyAction(action){
    const p=action.payload||{};let result=null;
    switch(action.type){
      case "npc.generate":result=LS.simulation.generateNPCs({count:Math.min(100,Math.max(1,Number(p.count)||1)),seed:p.seed||p.name||"assistant",profession:p.profession,personality:p.personality,locationId:p.locationId,genderIdentityId:p.genderIdentityId,systemId:p.systemId,editionId:p.editionId,raceId:p.raceId});break;
      case "location.generate":result=LS.simulation.generateLocations({count:Math.min(50,Math.max(1,Number(p.count)||1)),seed:p.seed||p.name||"assistant",name:p.name,type:p.type,category:p.category,parentLocationId:p.parentLocationId,mapLevel:p.mapLevel,services:p.services,biomeId:p.biomeId});break;
      case "settlement.generate":result=LS.townAdapter.generateSettlement({name:p.name,size:p.size||"town",seed:p.seed||p.name||"assistant",parentLocationId:p.parentLocationId,population:Number(p.population)||undefined,npcCount:Number(p.npcCount)||undefined});break;
      case "transit.type.add":result=LS.transit.addType(p);break;
      case "transit.stop.add":result=LS.transit.addStop(p);break;
      case "transit.route.add":result=LS.transit.addRoute(p);break;
      case "transit.service.add":result=LS.transit.addService(p);break;
      case "transit.trip.plan":result=LS.transit.planTrip({...p,save:true});break;
      case "project.note.add":LS.store.update(state=>{state.project.description=[state.project.description,p.text].filter(Boolean).join("\n\n");return state;});result=true;break;
      default:throw new Error("Unsupported action.");
    }
    action.status="applied";action.appliedAt=LS.util.now();SB.store.save();return result;
  }
  async function generateImage(prompt,options={}){const result=await SB.client.generateImage(prompt,{size:options.size||"1024x1024",quality:options.quality||"high",background:options.background||"auto",name:options.name||"TableGate image"});return LS.assets.saveGenerated(result,{prompt,name:options.name,kind:options.kind||"image",targetType:options.targetType,targetId:options.targetId});}
  SB.tablegate=Object.freeze({ACTION_CONTRACT,compactProjectContext,send,extractStructured,sanitizeActions,applyAction,generateImage});
})(window);
