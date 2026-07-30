(function (global) {
  "use strict";
  const LS = global.LifeSimulator;
  if (!LS) return;
  const runtime = { pendingStopId: null, observer: null, scheduled: false };
  const esc = value => LS.util.escape(value);
  const byId = id => document.getElementById(id);

  function currentNodeId() { return LS.mapViewer?.runtime?.current?.id || null; }
  function placement(stop, nodeId) { return (stop?.mapPlacements || []).find(item => item.mapNodeId === nodeId) || null; }
  function bezier(a, b, lift = 18) {
    const dx = b.x - a.x, dy = b.y - a.y, length = Math.hypot(dx, dy) || 1;
    const nx = -dy / length, ny = dx / length;
    const curve = Math.min(28, Math.max(7, length * 0.24)) * (lift < 0 ? -1 : 1);
    const cx = (a.x + b.x) / 2 + nx * curve, cy = (a.y + b.y) / 2 + ny * curve;
    return `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`;
  }
  function pointOnQuadratic(a, b, t, lift = 18) {
    const dx = b.x - a.x, dy = b.y - a.y, length = Math.hypot(dx, dy) || 1;
    const nx = -dy / length, ny = dx / length;
    const curve = Math.min(28, Math.max(7, length * 0.24)) * (lift < 0 ? -1 : 1);
    const c = { x: (a.x+b.x)/2 + nx*curve, y: (a.y+b.y)/2 + ny*curve };
    const u = 1-t;
    return { x: u*u*a.x + 2*u*t*c.x + t*t*b.x, y: u*u*a.y + 2*u*t*c.y + t*t*b.y };
  }
  function buildOverlay() {
    const nodeId = currentNodeId(), target = byId("mapViewerContent");
    if (!nodeId || !target) return;
    target.querySelector(".tablegate-transit-overlay")?.remove();
    const state = LS.store.get(), t = LS.transit.ensure(state);
    const routes = t.routes.filter(route => route.active !== false);
    const stopPoints = new Map();
    for (const stop of t.stops) { const p = placement(stop, nodeId); if (p) stopPoints.set(stop.stopId, { x:Number(p.x), y:Number(p.y), stop }); }
    if (!stopPoints.size && !routes.length) return;
    const paths = [], labels = [], vehicles = [];
    routes.forEach((route, routeIndex) => {
      const type = LS.transit.typeById(state, route.transitTypeId), color = route.color || type?.color || "#00FFFF";
      const pairs = [];
      for (let i=0;i<(route.stopIds||[]).length-1;i++) pairs.push([route.stopIds[i],route.stopIds[i+1],i]);
      if (route.loop && route.stopIds.length>2) pairs.push([route.stopIds[route.stopIds.length-1],route.stopIds[0],route.stopIds.length-1]);
      pairs.forEach(([fromId,toId,idx]) => {
        const a=stopPoints.get(fromId), b=stopPoints.get(toId); if(!a||!b) return;
        const id=`transit-path-${LS.util.slug(route.routeId)}-${idx}`;
        paths.push(`<path id="${id}" class="transit-arc-halo" d="${bezier(a,b,routeIndex%2? -18:18)}" stroke="${esc(color)}"></path><path class="transit-arc-core" d="${bezier(a,b,routeIndex%2? -18:18)}" stroke="${esc(color)}"></path>`);
      });
      const visible = (route.stopIds||[]).map(id=>stopPoints.get(id)).filter(Boolean);
      if (visible.length) { const mid=visible[Math.floor(visible.length/2)]; labels.push(`<button class="transit-route-label" data-open-transit-route="${esc(route.routeId)}" style="left:${mid.x}%;top:${mid.y}%" title="Open ${esc(route.name)}"><i style="background:${esc(color)}"></i>${esc(route.name)}</button>`); }
    });
    for (const {x,y,stop} of stopPoints.values()) labels.push(`<button class="transit-stop-pin" data-open-transit-stop="${esc(stop.stopId)}" style="left:${x}%;top:${y}%" title="${esc(stop.name)}"><span></span><b>${esc(stop.name)}</b></button>`);
    t.vehicles.forEach(vehicle => {
      const route=LS.transit.routeById(state,vehicle.routeId); if(!route) return;
      const a=stopPoints.get(vehicle.currentStopId), b=stopPoints.get(vehicle.nextStopId); if(!a||!b) return;
      const type=LS.transit.typeById(state,route.transitTypeId), color=route.color||type?.color||"#00FFFF";
      const point=pointOnQuadratic(a,b,Number(vehicle.progress)||0,0);
      vehicles.push(`<button class="transit-vehicle-marker" data-open-transit-vehicle="${esc(vehicle.vehicleId)}" style="left:${point.x}%;top:${point.y}%;--route-color:${esc(color)}" title="${esc(vehicle.name)}"><span>◆</span></button>`);
    });
    const overlay=document.createElement("div"); overlay.className="tablegate-transit-overlay";
    overlay.innerHTML=`<svg class="transit-route-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Transit routes"><defs><filter id="tablegateTransitGlow"><feGaussianBlur stdDeviation="0.75" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>${paths.join("")}</svg><div class="transit-map-labels">${labels.join("")}${vehicles.join("")}</div>`;
    target.appendChild(overlay);
  }
  function scheduleRender() { if(runtime.scheduled) return; runtime.scheduled=true; requestAnimationFrame(()=>{runtime.scheduled=false;buildOverlay();}); }
  function beginPlacement(stopId) {
    runtime.pendingStopId=stopId;
    const stop=LS.transit.stopById(LS.store.get(),stopId);
    const status=byId("transitMapPlacementStatus"); if(status) status.textContent=`Click the current map to place ${stop?.name||"the stop"}.`;
    LS.app?.toast?.("Click the current map to place this transit stop.");
  }
  function cancelPlacement() { runtime.pendingStopId=null; const status=byId("transitMapPlacementStatus"); if(status) status.textContent="Select a stop, then place it on the current map."; }
  function handleMapClick(event) {
    if(!runtime.pendingStopId || event.target.closest("button,.map-record-pin")) return;
    const nodeId=currentNodeId(), content=byId("mapViewerContent"); if(!nodeId||!content) return;
    const rect=content.getBoundingClientRect();
    const x=Math.max(0,Math.min(100,((event.clientX-rect.left)/Math.max(1,rect.width))*100));
    const y=Math.max(0,Math.min(100,((event.clientY-rect.top)/Math.max(1,rect.height))*100));
    LS.transit.placeStop(runtime.pendingStopId,nodeId,x,y);
    const stop=LS.transit.stopById(LS.store.get(),runtime.pendingStopId);
    runtime.pendingStopId=null; LS.app?.toast?.(`${stop?.name||"Stop"} placed on the current map.`); scheduleRender();
    byId("transitMapPlacementStatus") && (byId("transitMapPlacementStatus").textContent="Stop placed. Select another stop to continue.");
  }
  function bind() {
    byId("mapViewerViewport")?.addEventListener("click",handleMapClick);
    const target=byId("mapViewerContent");
    if(target){ runtime.observer=new MutationObserver(scheduleRender); runtime.observer.observe(target,{childList:true,subtree:false}); }
    document.addEventListener("click",event=>{
      const routeButton=event.target.closest("[data-open-transit-route]");
      if(routeButton){ LS.app?.switchView?.("transit"); global.setTimeout(()=>LS.transitUI?.focusRoute?.(routeButton.dataset.openTransitRoute),50); }
      const stopButton=event.target.closest("[data-open-transit-stop]");
      if(stopButton){ LS.app?.switchView?.("transit"); global.setTimeout(()=>LS.transitUI?.focusStop?.(stopButton.dataset.openTransitStop),50); }
    });
    LS.store.subscribe(scheduleRender); scheduleRender();
  }
  LS.transitMap=Object.freeze({runtime,buildOverlay,scheduleRender,beginPlacement,cancelPlacement});
  document.addEventListener("DOMContentLoaded",bind);
})(window);
