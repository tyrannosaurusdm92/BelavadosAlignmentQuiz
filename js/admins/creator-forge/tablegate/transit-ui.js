(function (global) {
  "use strict";
  const LS = global.LifeSimulator;
  if (!LS) return;
  const ui = { editTypeId:null, editStopId:null, editRouteId:null, editServiceId:null, visits:[], lastPlan:null };
  const byId=id=>document.getElementById(id);
  const esc=value=>LS.util.escape(value);
  const val=id=>byId(id)?.value ?? "";
  const checked=id=>Boolean(byId(id)?.checked);
  const n=id=>Number(val(id)||0);
  function toast(message,type){ LS.app?.toast?.(message,type); }
  function fmtTime(value){ return LS.transit.formatMinute(value); }
  function option(items,valueKey,labeler,current,blank){ return `${blank!=null?`<option value="">${esc(blank)}</option>`:""}${items.map(item=>`<option value="${esc(item[valueKey])}"${item[valueKey]===current?" selected":""}>${esc(labeler(item))}</option>`).join("")}`; }
  function activeState(){ return LS.store.get(); }
  function routeColor(route,state){ return route.color||LS.transit.typeById(state,route.transitTypeId)?.color||"#00FFFF"; }

  function renderMetrics(){
    const state=activeState(),t=LS.transit.ensure(state);
    byId("transitMetrics").innerHTML=[
      [t.types.length,"Transit types"],[t.stops.length,"Stops / gates"],[t.routes.length,"Routes"],[t.services.length,"Services"],[t.vehicles.length,"Tracked vehicles"],[t.tripPlans.length,"Saved trips"]
    ].map(([v,l])=>`<article class="metric"><b>${v}</b><span>${l}</span></article>`).join("");
    const chip=byId("transitSidebarCount"); if(chip) chip.textContent=t.routes.length;
  }
  function renderTypeForm(){
    const state=activeState(), type=ui.editTypeId?LS.transit.typeById(state,ui.editTypeId):null;
    byId("transitTypeFormTitle").textContent=type?`Edit ${type.name}`:"Add Transit Type";
    byId("transitTypeName").value=type?.name||""; byId("transitTypeCategory").value=type?.category||"ground";
    byId("transitTypeColor").value=type?.color||"#00FFFF"; byId("transitTypeModel").value=type?.travelModel||"constant";
    byId("transitTypeSpeed").value=type?.speed??10; byId("transitTypeSpeedUnit").value=type?.speedUnit||"km/h";
    byId("transitTypeFixedMinutes").value=type?.fixedDurationMinutes??0; byId("transitTypeActivation").value=type?.activationMinutes??0;
    byId("transitTypeAcceleration").value=type?.accelerationMinutes??0; byId("transitTypeDeceleration").value=type?.decelerationMinutes??0;
    byId("transitTypeDwell").value=type?.defaultDwellMinutes??5; byId("transitTypeHeadway").value=type?.defaultHeadwayMinutes??60;
    byId("transitTypeCapacity").value=type?.capacity??0; byId("transitTypeNotes").value=type?.notes||"";
    byId("cancelTransitTypeEdit").hidden=!type;
  }
  function renderTypes(){
    const state=activeState(),t=LS.transit.ensure(state);
    byId("transitTypeList").innerHTML=t.types.length?t.types.map(type=>`<article class="transit-card" style="--line-color:${esc(type.color)}"><header><i class="route-swatch" style="background:${esc(type.color)}"></i><div><h4>${esc(type.name)}</h4><p>${esc(type.category)} · ${esc(type.travelModel)}</p></div></header><dl><dt>Speed</dt><dd>${type.travelModel==="portal"?`${LS.transit.formatDuration((type.activationMinutes||0)+(type.fixedDurationMinutes||0))} fixed`:`${esc(type.speed)} ${esc(type.speedUnit)}`}</dd><dt>Frequency default</dt><dd>Every ${LS.transit.formatDuration(type.defaultHeadwayMinutes)}</dd><dt>Dwell default</dt><dd>${LS.transit.formatDuration(type.defaultDwellMinutes)}</dd><dt>Capacity</dt><dd>${type.capacity||"User-defined"}</dd></dl><p>${esc(type.notes||"User-defined transit mode.")}</p><div class="card-actions"><button class="small" data-edit-transit-type="${type.transitTypeId}">Edit / Rename</button><button class="small ghost" data-duplicate-transit-type="${type.transitTypeId}">Duplicate</button><button class="small danger" data-delete-transit-type="${type.transitTypeId}">Delete</button></div></article>`).join(""):`<div class="empty-card">No transit types yet. Add one or restore the setting-neutral starter set.</div>`;
  }

  function renderStopForm(){
    const state=activeState(), stop=ui.editStopId?LS.transit.stopById(state,ui.editStopId):null;
    byId("transitStopFormTitle").textContent=stop?`Edit ${stop.name}`:"Add Stop / Gate";
    byId("transitStopName").value=stop?.name||"";
    byId("transitStopLocation").innerHTML=option(state.locations,"locationId",item=>`${item.name} · ${item.mapLevel||item.type}`,stop?.locationId,"No linked generated location");
    byId("transitStopTransfer").value=stop?.transferMinutes??LS.transit.ensure(state).settings.defaultTransferMinutes;
    byId("transitStopVisit").value=stop?.defaultVisitMinutes??LS.transit.ensure(state).settings.defaultVisitMinutes;
    byId("transitStopServices").value=(stop?.services||[]).join(", "); byId("transitStopTags").value=(stop?.tags||[]).join(", "); byId("transitStopNotes").value=stop?.notes||"";
    byId("transitStopStepFree").checked=stop?.accessibility?.stepFree!==false; byId("transitStopAssistance").checked=stop?.accessibility?.assistanceAvailable!==false;
    byId("cancelTransitStopEdit").hidden=!stop;
  }
  function renderStops(){
    const state=activeState(),t=LS.transit.ensure(state),nodeId=LS.mapViewer?.runtime?.current?.id;
    byId("transitStopList").innerHTML=t.stops.length?t.stops.map(stop=>{ const location=state.locations.find(item=>item.locationId===stop.locationId); const p=(stop.mapPlacements||[]).find(item=>item.mapNodeId===nodeId); return `<article class="transit-card"><header><div><h4>${esc(stop.name)}</h4><p>${esc(location?.name||"Independent stop")} · transfer ${LS.transit.formatDuration(stop.transferMinutes)}</p></div><span class="badge">${(stop.mapPlacements||[]).length} map${(stop.mapPlacements||[]).length===1?"":"s"}</span></header><p>${esc((stop.services||[]).join(", ")||"No service notes")}</p><div class="tag-row">${(stop.tags||[]).map(tag=>`<span class="tag">${esc(tag)}</span>`).join("")}</div><div class="card-actions"><button class="small" data-edit-transit-stop="${stop.stopId}">Edit</button><button class="small ghost" data-place-transit-stop="${stop.stopId}">${p?"Reposition on Current Map":"Place on Current Map"}</button><button class="small danger" data-delete-transit-stop="${stop.stopId}">Delete</button></div></article>`; }).join(""):`<div class="empty-card">No stops, docks, stations, gates, ports, platforms, or landing fields have been added.</div>`;
    const placeSelect=byId("transitMapStopSelect"); if(placeSelect) placeSelect.innerHTML=option(t.stops,"stopId",item=>item.name,placeSelect.value,"Choose a stop");
  }

  function selectedRouteStops(){ return [...byId("transitRouteStops").selectedOptions].map(option=>option.value); }
  function renderRouteForm(){
    const state=activeState(),t=LS.transit.ensure(state),route=ui.editRouteId?LS.transit.routeById(state,ui.editRouteId):null;
    byId("transitRouteFormTitle").textContent=route?`Edit ${route.name}`:"Add Route";
    byId("transitRouteName").value=route?.name||"";
    byId("transitRouteType").innerHTML=option(t.types,"transitTypeId",item=>`${item.name} · ${item.category}`,route?.transitTypeId,"Choose a transit type");
    byId("transitRouteColor").value=route?.color||""; byId("transitRouteDistance").value=route?.defaultSegmentDistance??10; byId("transitRouteDistanceUnit").value=route?.distanceUnit||t.settings.distanceUnit||"km";
    const orderedStops = route ? [...route.stopIds.map(id=>t.stops.find(stop=>stop.stopId===id)).filter(Boolean), ...t.stops.filter(stop=>!route.stopIds.includes(stop.stopId))] : t.stops;
    byId("transitRouteStops").innerHTML=orderedStops.map(stop=>`<option value="${stop.stopId}"${route?.stopIds?.includes(stop.stopId)?" selected":""}>${esc(stop.name)}</option>`).join("");
    byId("transitRouteBidirectional").checked=route?.bidirectional!==false; byId("transitRouteLoop").checked=Boolean(route?.loop); byId("transitRouteOperator").value=route?.operator||""; byId("transitRouteNotes").value=route?.notes||"";
    byId("cancelTransitRouteEdit").hidden=!route;
  }
  function renderRoutes(){
    const state=activeState(),t=LS.transit.ensure(state);
    byId("transitRouteList").innerHTML=t.routes.length?t.routes.map(route=>{ const summary=LS.transit.routeSummary(route,state); return `<article class="transit-route-card" style="--line-color:${esc(summary.color)}"><header><i class="route-swatch" style="background:${esc(summary.color)}"></i><div><h4>${esc(route.name)}</h4><p>${esc(summary.type?.name||"Unassigned mode")} · ${summary.stops.length} stops</p></div><span class="badge">${LS.transit.formatDuration(summary.travelMinutes)}</span></header><div class="route-stop-chain">${summary.stops.map((stop,index)=>`<span>${index?"→ ":""}${esc(stop.name)}</span>`).join("")}</div><dl><dt>Estimated distance</dt><dd>${summary.distanceKm.toLocaleString(undefined,{maximumFractionDigits:2})} km equivalent</dd><dt>Direction</dt><dd>${route.loop?"Loop":route.bidirectional?"Two-way":"One-way"}</dd><dt>Services</dt><dd>${t.services.filter(item=>item.routeId===route.routeId).length}</dd></dl><div class="card-actions"><button class="small" data-edit-transit-route="${route.routeId}">Edit</button><button class="small ghost" data-add-service-for-route="${route.routeId}">Add Service</button><button class="small ghost" data-add-vehicle-for-route="${route.routeId}">Track Vehicle</button><button class="small danger" data-delete-transit-route="${route.routeId}">Delete</button></div></article>`; }).join(""):`<div class="empty-card">No routes yet. Routes connect ordered stops and receive their visible neon color from the selected transit type.</div>`;
  }

  function renderServiceForm(){
    const state=activeState(),t=LS.transit.ensure(state),service=ui.editServiceId?LS.transit.serviceById(state,ui.editServiceId):null;
    byId("transitServiceFormTitle").textContent=service?`Edit ${service.name}`:"Add Scheduled Service";
    byId("transitServiceRoute").innerHTML=option(t.routes,"routeId",item=>item.name,service?.routeId,"Choose a route");
    byId("transitServiceName").value=service?.name||""; byId("transitServiceScheduleType").value=service?.scheduleType||"frequency";
    byId("transitServiceStart").value=service?.startMinute??360; byId("transitServiceEnd").value=service?.endMinute??1320; byId("transitServiceHeadway").value=service?.headwayMinutes??60;
    byId("transitServiceDepartures").value=(service?.departures||[]).map(value=>`${String(Math.floor(value/60)).padStart(2,"0")}:${String(value%60).padStart(2,"0")}`).join(", ");
    byId("transitServiceSpeed").value=service?.speed??""; byId("transitServiceSpeedUnit").value=service?.speedUnit||""; byId("transitServiceDwell").value=service?.dwellMinutes??"";
    byId("transitServiceCapacity").value=service?.capacity??""; byId("transitServiceFare").value=service?.fare||""; byId("transitServiceNotes").value=service?.notes||"";
    byId("cancelTransitServiceEdit").hidden=!service;
  }
  function renderServices(){
    const state=activeState(),t=LS.transit.ensure(state);
    byId("transitServiceList").innerHTML=t.services.length?t.services.map(service=>{const route=LS.transit.routeById(state,service.routeId);return `<article class="transit-card"><header><div><h4>${esc(service.name)}</h4><p>${esc(route?.name||"Missing route")} · ${esc(service.scheduleType)}</p></div><span class="badge">${service.scheduleType==="frequency"?`every ${LS.transit.formatDuration(service.headwayMinutes)}`:service.scheduleType}</span></header><dl><dt>Operating window</dt><dd>${Math.floor(service.startMinute/60).toString().padStart(2,"0")}:${String(service.startMinute%60).padStart(2,"0")}–${Math.floor(service.endMinute/60).toString().padStart(2,"0")}:${String(service.endMinute%60).padStart(2,"0")}</dd><dt>Speed override</dt><dd>${service.speed==null?"Use transit type":`${service.speed} ${service.speedUnit||""}`}</dd><dt>Fare / cost</dt><dd>${esc(service.fare||"User-defined")}</dd></dl><div class="card-actions"><button class="small" data-edit-transit-service="${service.serviceId}">Edit</button><button class="small danger" data-delete-transit-service="${service.serviceId}">Delete</button></div></article>`}).join(""):`<div class="empty-card">No scheduled services. A route can have multiple services with different operating windows, frequencies, speeds, fares, or seasonal patterns.</div>`;
  }

  function renderPlannerSelectors(){
    const state=activeState(),t=LS.transit.ensure(state);
    const currentOrigin=val("tripOrigin"),currentDestination=val("tripDestination"),currentVisit=val("tripVisitStop");
    const opts=(current,blank)=>option(t.stops,"stopId",item=>item.name,current,blank);
    byId("tripOrigin").innerHTML=opts(currentOrigin,"Choose origin"); byId("tripDestination").innerHTML=opts(currentDestination,"Choose destination"); byId("tripVisitStop").innerHTML=opts(currentVisit,"Choose visit stop");
    byId("tripVisitNpc").innerHTML=option(state.npcs,"npcId",item=>`${item.name} · ${item.profession||item.systemProfile?.role||"NPC"}`,val("tripVisitNpc"),"No specific NPC");
    byId("tripVisitList").innerHTML=ui.visits.length?ui.visits.map((visit,index)=>{const stop=LS.transit.stopById(state,visit.stopId),npc=state.npcs.find(item=>item.npcId===visit.npcId);return `<article class="visit-chip"><b>${index+1}. ${esc(stop?.name||"Missing stop")}</b><span>${LS.transit.formatDuration(visit.durationMinutes)} · ${esc(visit.purpose||"Visit")}${npc?` · ${esc(npc.name)}`:""}</span><button class="small danger" data-remove-trip-visit="${index}">Remove</button></article>`}).join(""):`<div class="fineprint">Optional visits appear here in order. Each visit adds its own dwell period before the trip continues.</div>`;
  }
  function renderPlan(planResult=ui.lastPlan){
    const target=byId("tripPlanResult"); if(!target) return;
    if(!planResult){ target.innerHTML=`<div class="empty-card">Choose stops and plan a trip to compare routes, transfers, waiting, riding, and visit time.</div>`; return; }
    if(!planResult.ok){ target.innerHTML=`<div class="callout danger"><b>Trip unavailable</b><p>${esc(planResult.reason||"No connection found.")}</p></div>`; return; }
    const state=activeState(),plan=planResult.plan;
    const items=plan.timeline.map(item=>{
      if(item.kind==="visit"){const stop=LS.transit.stopById(state,item.stopId),npc=state.npcs.find(n=>n.npcId===item.npcId);return `<li class="trip-step visit"><span class="trip-time">${esc(fmtTime(item.startMinute))}</span><div><b>Stop at ${esc(stop?.name||"location")}</b><p>${esc(item.purpose||"Visit")} · ${LS.transit.formatDuration(item.durationMinutes)}${npc?` · meet ${esc(npc.name)}`:""}${item.goods?` · goods: ${esc(item.goods)}`:""}${item.services?` · services: ${esc(item.services)}`:""}</p></div></li>`;}
      const route=LS.transit.routeById(state,item.edge.routeId),service=LS.transit.serviceById(state,item.edge.serviceId),type=route&&LS.transit.typeById(state,route.transitTypeId),from=LS.transit.stopById(state,item.fromStopId),to=LS.transit.stopById(state,item.toStopId),color=routeColor(route||{},state);
      return `<li class="trip-step ride" style="--line-color:${esc(color)}"><span class="trip-time">${esc(fmtTime(item.departureMinute))}</span><div><b>${esc(route?.name||"Route")} · ${esc(type?.name||"Transit")}</b><p>${esc(from?.name||"Origin")} → ${esc(to?.name||"Destination")} · ride ${LS.transit.formatDuration(item.edge.travelMinutes)}${item.waitMinutes?` · wait ${LS.transit.formatDuration(item.waitMinutes)}`:""}${item.transferMinutes?` · transfer ${LS.transit.formatDuration(item.transferMinutes)}`:""}${service?` · ${esc(service.name)}`:""}</p></div></li>`;
    }).join("");
    target.innerHTML=`<div class="trip-summary"><article><b>${esc(fmtTime(plan.departMinute))}</b><span>Depart</span></article><article><b>${esc(fmtTime(plan.arrivalMinute))}</b><span>Arrive</span></article><article><b>${LS.transit.formatDuration(plan.totalMinutes)}</b><span>Total journey</span></article><article><b>${plan.transfers}</b><span>Transfers</span></article></div><ol class="trip-timeline">${items}</ol>`;
  }
  function renderVehicles(){
    const state=activeState(),t=LS.transit.ensure(state);
    byId("transitVehicleList").innerHTML=t.vehicles.length?t.vehicles.map(vehicle=>{const route=LS.transit.routeById(state,vehicle.routeId),from=LS.transit.stopById(state,vehicle.currentStopId),to=LS.transit.stopById(state,vehicle.nextStopId);return `<article class="vehicle-card"><header><div><h4>${esc(vehicle.name)}</h4><p>${esc(route?.name||"Missing route")} · ${esc(vehicle.status)}</p></div><span class="badge">${Math.round((vehicle.progress||0)*100)}%</span></header><div class="vehicle-progress"><i style="width:${Math.round((vehicle.progress||0)*100)}%;background:${esc(routeColor(route||{},state))}"></i></div><p>${esc(from?.name||"Unknown")} → ${esc(to?.name||"Unknown")}</p><div class="card-actions"><button class="small ghost" data-reset-transit-vehicle="${vehicle.vehicleId}">Restart Cycle</button><button class="small danger" data-delete-transit-vehicle="${vehicle.vehicleId}">Remove</button></div></article>`}).join(""):`<div class="empty-card">No vehicles are currently tracked. Add one from any route to animate its progress on the map as simulation time advances.</div>`;
  }
  function renderAll(){ renderMetrics();renderTypeForm();renderTypes();renderStopForm();renderStops();renderRouteForm();renderRoutes();renderServiceForm();renderServices();renderPlannerSelectors();renderPlan();renderVehicles(); LS.transitMap?.scheduleRender?.(); }

  function parseList(value){return String(value||"").split(/[,;\n]+/).map(item=>item.trim()).filter(Boolean);}
  function saveType(event){event.preventDefault();const data={name:val("transitTypeName"),category:val("transitTypeCategory"),color:val("transitTypeColor"),travelModel:val("transitTypeModel"),speed:n("transitTypeSpeed"),speedUnit:val("transitTypeSpeedUnit"),fixedDurationMinutes:n("transitTypeFixedMinutes"),activationMinutes:n("transitTypeActivation"),accelerationMinutes:n("transitTypeAcceleration"),decelerationMinutes:n("transitTypeDeceleration"),defaultDwellMinutes:n("transitTypeDwell"),defaultHeadwayMinutes:n("transitTypeHeadway"),capacity:n("transitTypeCapacity"),notes:val("transitTypeNotes")};if(!data.name)return toast("Name the transit type.","error"); if(ui.editTypeId)LS.transit.updateType(ui.editTypeId,data);else LS.transit.addType(data);ui.editTypeId=null;renderAll();toast("Transit type saved.");}
  function saveStop(event){event.preventDefault();const data={name:val("transitStopName"),locationId:val("transitStopLocation")||null,transferMinutes:n("transitStopTransfer"),defaultVisitMinutes:n("transitStopVisit"),services:parseList(val("transitStopServices")),tags:parseList(val("transitStopTags")),accessibility:{stepFree:checked("transitStopStepFree"),assistanceAvailable:checked("transitStopAssistance")},notes:val("transitStopNotes")};if(!data.name)return toast("Name the stop or gate.","error");if(ui.editStopId)LS.transit.updateStop(ui.editStopId,data);else LS.transit.addStop(data);ui.editStopId=null;renderAll();toast("Transit stop saved.");}
  function saveRoute(event){event.preventDefault();const stopIds=selectedRouteStops(),data={name:val("transitRouteName"),transitTypeId:val("transitRouteType"),color:val("transitRouteColor")||null,stopIds,bidirectional:checked("transitRouteBidirectional"),loop:checked("transitRouteLoop"),defaultSegmentDistance:n("transitRouteDistance"),distanceUnit:val("transitRouteDistanceUnit"),operator:val("transitRouteOperator"),notes:val("transitRouteNotes")};data.segments=stopIds.slice(0,-1).map((id,index)=>({fromStopId:id,toStopId:stopIds[index+1],distance:data.defaultSegmentDistance,distanceUnit:data.distanceUnit}));if(!data.name||!data.transitTypeId||stopIds.length<2)return toast("A route needs a name, transit type, and at least two selected stops.","error");if(ui.editRouteId)LS.transit.updateRoute(ui.editRouteId,data);else LS.transit.addRoute(data);ui.editRouteId=null;renderAll();toast("Route saved and added to the Map Viewer overlay.");}
  function saveService(event){event.preventDefault();const data={routeId:val("transitServiceRoute"),name:val("transitServiceName"),scheduleType:val("transitServiceScheduleType"),startMinute:n("transitServiceStart"),endMinute:n("transitServiceEnd"),headwayMinutes:n("transitServiceHeadway"),departures:val("transitServiceDepartures"),speed:val("transitServiceSpeed")===""?null:n("transitServiceSpeed"),speedUnit:val("transitServiceSpeedUnit")||null,dwellMinutes:val("transitServiceDwell")===""?null:n("transitServiceDwell"),capacity:val("transitServiceCapacity")===""?null:n("transitServiceCapacity"),fare:val("transitServiceFare"),notes:val("transitServiceNotes")};if(!data.routeId)return toast("Choose a route for the service.","error");if(ui.editServiceId)LS.transit.updateService(ui.editServiceId,data);else LS.transit.addService(data);ui.editServiceId=null;renderAll();toast("Scheduled service saved.");}
  function addVisit(){const stopId=val("tripVisitStop");if(!stopId)return toast("Choose a stop for the visit.","error");ui.visits.push({stopId,durationMinutes:Math.max(0,n("tripVisitDuration")||LS.transit.ensure(activeState()).settings.defaultVisitMinutes),purpose:val("tripVisitPurpose"),npcId:val("tripVisitNpc")||null,goods:val("tripVisitGoods"),services:val("tripVisitServices"),notes:val("tripVisitNotes")});renderPlannerSelectors();}
  function planTrip(){const depart=n("tripDepartMinute");ui.lastPlan=LS.transit.planTrip({name:val("tripPlanName")||"Planned Trip",originStopId:val("tripOrigin"),destinationStopId:val("tripDestination"),departMinute:depart,optimization:val("tripOptimization"),visits:ui.visits,save:true});renderAll();if(ui.lastPlan.ok)toast("Trip planned and saved.");else toast(ui.lastPlan.reason||"Trip unavailable.","error");}
  function addVehicleForRoute(routeId){const state=activeState(),service=LS.transit.ensure(state).services.find(item=>item.routeId===routeId);const route=LS.transit.routeById(state,routeId);LS.transit.addVehicle({routeId,serviceId:service?.serviceId||null,name:`${route?.name||"Route"} Tracker`,cycleStartMinute:state.simulation.absoluteMinute??state.project.calendar.currentAbsoluteMinute});renderAll();toast("Vehicle tracker added.");}

  function bind(){
    LS.store.update(state=>{LS.transit.seedDefaults(state);return state;});
    byId("transitTypeForm")?.addEventListener("submit",saveType);byId("transitStopForm")?.addEventListener("submit",saveStop);byId("transitRouteForm")?.addEventListener("submit",saveRoute);byId("transitServiceForm")?.addEventListener("submit",saveService);
    byId("restoreTransitDefaults")?.addEventListener("click",()=>{LS.store.update(state=>{const existing=new Set(LS.transit.ensure(state).types.map(item=>item.name.toLowerCase()));LS.transit.DEFAULT_TYPES.forEach(item=>{if(!existing.has(item.name.toLowerCase()))state.transit.types.push(LS.transit.createType(item));});return state;});renderAll();toast("Missing starter transit types restored.");});
    byId("cancelTransitTypeEdit")?.addEventListener("click",()=>{ui.editTypeId=null;renderTypeForm();}); byId("cancelTransitStopEdit")?.addEventListener("click",()=>{ui.editStopId=null;renderStopForm();}); byId("cancelTransitRouteEdit")?.addEventListener("click",()=>{ui.editRouteId=null;renderRouteForm();}); byId("cancelTransitServiceEdit")?.addEventListener("click",()=>{ui.editServiceId=null;renderServiceForm();});
    byId("addTripVisit")?.addEventListener("click",addVisit);byId("planTripBtn")?.addEventListener("click",planTrip);byId("clearTripVisits")?.addEventListener("click",()=>{ui.visits=[];renderPlannerSelectors();});
    byId("tripDepartNow")?.addEventListener("click",()=>{byId("tripDepartMinute").value=activeState().simulation.absoluteMinute??activeState().project.calendar.currentAbsoluteMinute??0;});
    const moveSelectedRouteStops = direction => { const select=byId("transitRouteStops"), options=[...select.options]; if(direction<0){for(let i=1;i<options.length;i++)if(options[i].selected&&!options[i-1].selected)select.insertBefore(options[i],options[i-1]);}else{for(let i=options.length-2;i>=0;i--)if(options[i].selected&&!options[i+1].selected)select.insertBefore(options[i+1],options[i]);} };
    byId("moveTransitRouteStopUp")?.addEventListener("click",()=>moveSelectedRouteStops(-1));
    byId("moveTransitRouteStopDown")?.addEventListener("click",()=>moveSelectedRouteStops(1));
    byId("clearTransitRouteStops")?.addEventListener("click",()=>{[...byId("transitRouteStops").options].forEach(option=>option.selected=false);});
    byId("placeSelectedTransitStop")?.addEventListener("click",()=>{const id=val("transitMapStopSelect");if(id)LS.transitMap.beginPlacement(id);else toast("Choose a transit stop first.","error");});
    byId("cancelTransitMapPlacement")?.addEventListener("click",LS.transitMap.cancelPlacement);
    document.addEventListener("click",event=>{
      let button=event.target.closest("[data-edit-transit-type]");if(button){ui.editTypeId=button.dataset.editTransitType;renderTypeForm();byId("transitTypeForm")?.scrollIntoView({behavior:"smooth"});}
      button=event.target.closest("[data-duplicate-transit-type]");if(button){const item=LS.transit.typeById(activeState(),button.dataset.duplicateTransitType);if(item)LS.transit.addType({...LS.util.clone(item),transitTypeId:null,name:`${item.name} Copy`,renamedFrom:item.name});renderAll();}
      button=event.target.closest("[data-delete-transit-type]");if(button&&confirm("Delete this transit type and its routes?")){LS.transit.deleteType(button.dataset.deleteTransitType);renderAll();}
      button=event.target.closest("[data-edit-transit-stop]");if(button){ui.editStopId=button.dataset.editTransitStop;renderStopForm();byId("transitStopForm")?.scrollIntoView({behavior:"smooth"});}
      button=event.target.closest("[data-place-transit-stop]");if(button){LS.app.switchView("mapviewer");setTimeout(()=>LS.transitMap.beginPlacement(button.dataset.placeTransitStop),50);}
      button=event.target.closest("[data-delete-transit-stop]");if(button&&confirm("Delete this stop from all routes?")){LS.transit.deleteStop(button.dataset.deleteTransitStop);renderAll();}
      button=event.target.closest("[data-edit-transit-route]");if(button){ui.editRouteId=button.dataset.editTransitRoute;renderRouteForm();byId("transitRouteForm")?.scrollIntoView({behavior:"smooth"});}
      button=event.target.closest("[data-delete-transit-route]");if(button&&confirm("Delete this route, its services, and tracked vehicles?")){LS.transit.deleteRoute(button.dataset.deleteTransitRoute);renderAll();}
      button=event.target.closest("[data-add-service-for-route]");if(button){ui.editServiceId=null;renderServiceForm();byId("transitServiceRoute").value=button.dataset.addServiceForRoute;byId("transitServiceForm")?.scrollIntoView({behavior:"smooth"});}
      button=event.target.closest("[data-add-vehicle-for-route]");if(button)addVehicleForRoute(button.dataset.addVehicleForRoute);
      button=event.target.closest("[data-edit-transit-service]");if(button){ui.editServiceId=button.dataset.editTransitService;renderServiceForm();byId("transitServiceForm")?.scrollIntoView({behavior:"smooth"});}
      button=event.target.closest("[data-delete-transit-service]");if(button&&confirm("Delete this scheduled service?")){LS.transit.deleteService(button.dataset.deleteTransitService);renderAll();}
      button=event.target.closest("[data-remove-trip-visit]");if(button){ui.visits.splice(Number(button.dataset.removeTripVisit),1);renderPlannerSelectors();}
      button=event.target.closest("[data-reset-transit-vehicle]");if(button){LS.store.update(state=>{const v=LS.transit.ensure(state).vehicles.find(item=>item.vehicleId===button.dataset.resetTransitVehicle);if(v){v.cycleStartMinute=state.simulation.absoluteMinute??0;v.progress=0;}return state;});renderAll();}
      button=event.target.closest("[data-delete-transit-vehicle]");if(button){LS.store.update(state=>{state.transit.vehicles=state.transit.vehicles.filter(item=>item.vehicleId!==button.dataset.deleteTransitVehicle);return state;});renderAll();}
    });
    LS.store.subscribe(()=>{if(document.querySelector('[data-view-panel="transit"]')?.classList.contains("active")){renderMetrics();renderTypes();renderStops();renderRoutes();renderServices();renderPlannerSelectors();renderPlan();renderVehicles();LS.transitMap?.scheduleRender?.();}else renderMetrics();});
    renderAll();
  }
  function focusRoute(id){ui.editRouteId=id;renderRouteForm();byId("transitRouteForm")?.scrollIntoView({behavior:"smooth"});}
  function focusStop(id){ui.editStopId=id;renderStopForm();byId("transitStopForm")?.scrollIntoView({behavior:"smooth"});}
  LS.transitUI=Object.freeze({ui,renderAll,focusRoute,focusStop});
  document.addEventListener("DOMContentLoaded",bind);
})(window);
