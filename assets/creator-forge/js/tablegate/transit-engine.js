(function (global) {
  "use strict";
  const LS = global.LifeSimulator;
  if (!LS) return;

  const DEFAULT_TYPES = Object.freeze([
    { name: "Caravan", category: "ground", color: "#FFB000", travelModel: "constant", speed: 5, speedUnit: "km/h", defaultDwellMinutes: 15, defaultHeadwayMinutes: 240, capacity: 24, notes: "Road, trail, or overland convoy." },
    { name: "Ferry", category: "water", color: "#00D9FF", travelModel: "constant", speed: 24, speedUnit: "km/h", defaultDwellMinutes: 12, defaultHeadwayMinutes: 60, capacity: 180, notes: "Scheduled water crossing or local passenger vessel." },
    { name: "Steamship", category: "water", color: "#58A6FF", travelModel: "constant", speed: 38, speedUnit: "km/h", defaultDwellMinutes: 90, defaultHeadwayMinutes: 720, capacity: 600, notes: "Longer-distance powered passenger vessel." },
    { name: "Submersible", category: "subsurface", color: "#25F5A6", travelModel: "constant", speed: 32, speedUnit: "km/h", defaultDwellMinutes: 30, defaultHeadwayMinutes: 180, capacity: 40, notes: "Underwater or underground passenger craft." },
    { name: "Stable Portal", category: "gateway", color: "#E879F9", travelModel: "portal", speed: 0, speedUnit: "fixed", fixedDurationMinutes: 2, activationMinutes: 3, cooldownMinutes: 5, defaultDwellMinutes: 2, defaultHeadwayMinutes: 10, capacity: 12, notes: "A persistent gateway with activation and throughput limits." },
    { name: "Airship", category: "air", color: "#FFD166", travelModel: "constant", speed: 110, speedUnit: "km/h", defaultDwellMinutes: 30, defaultHeadwayMinutes: 180, capacity: 90, notes: "Buoyant or magically sustained aerial vessel. Rename freely for the setting." },
    { name: "Orbital Shuttle", category: "space", color: "#FF5F8F", travelModel: "accelerated", speed: 28000, speedUnit: "km/h", accelerationMinutes: 12, decelerationMinutes: 12, defaultDwellMinutes: 45, defaultHeadwayMinutes: 240, capacity: 120, notes: "Surface-to-orbit or short orbital transfer vehicle." },
    { name: "Deep-Space Vessel", category: "space", color: "#8B9CFF", travelModel: "constant", speed: 0.08, speedUnit: "c", defaultDwellMinutes: 240, defaultHeadwayMinutes: 1440, capacity: 300, notes: "Interplanetary or interstellar passenger vessel." }
  ]);

  const UNIT_TO_KM = Object.freeze({
    m: 0.001, meter: 0.001, meters: 0.001,
    km: 1, kilometer: 1, kilometers: 1,
    mi: 1.609344, mile: 1.609344, miles: 1.609344,
    league: 4.828032, leagues: 4.828032,
    au: 149597870.7,
    "light-second": 299792.458, "light-seconds": 299792.458,
    "light-minute": 17987547.48, "light-minutes": 17987547.48,
    ly: 9460730472580.8, "light-year": 9460730472580.8, "light-years": 9460730472580.8
  });
  const C_KM_H = 1079252848.8;

  function num(value, fallback = 0) { const result = Number(value); return Number.isFinite(result) ? result : fallback; }
  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function ensure(state) {
    state.transit = state.transit || {};
    for (const key of ["types", "stops", "routes", "services", "vehicles", "tripPlans"]) if (!Array.isArray(state.transit[key])) state.transit[key] = [];
    state.transit.settings = {
      distanceUnit: "km", mapWidthDistance: 100, mapHeightDistance: 100,
      defaultTransferMinutes: 5, defaultVisitMinutes: 30, maximumTransfers: 6,
      ...(state.transit.settings || {})
    };
    return state.transit;
  }
  function seedDefaults(state) {
    const transit = ensure(state);
    if (transit.types.length) return transit.types;
    transit.types = DEFAULT_TYPES.map((item, index) => ({
      transitTypeId: LS.util.uid("transit-type"), slug: LS.util.slug(item.name), enabled: true,
      sortOrder: index, createdAt: LS.util.now(), modifiedAt: LS.util.now(), ...item
    }));
    return transit.types;
  }
  function normalizeHex(value, fallback = "#00FFFF") {
    const raw = String(value || "").trim();
    const short = /^#([0-9a-f]{3})$/i.exec(raw);
    if (short) return "#" + short[1].split("").map(c => c + c).join("").toUpperCase();
    return /^#[0-9a-f]{6}$/i.test(raw) ? raw.toUpperCase() : fallback;
  }
  function typeById(state, id) { return ensure(state).types.find(item => item.transitTypeId === id) || null; }
  function stopById(state, id) { return ensure(state).stops.find(item => item.stopId === id) || null; }
  function routeById(state, id) { return ensure(state).routes.find(item => item.routeId === id) || null; }
  function serviceById(state, id) { return ensure(state).services.find(item => item.serviceId === id) || null; }
  function locationByStop(state, stop) { return stop?.locationId ? state.locations.find(item => item.locationId === stop.locationId) : null; }

  function createType(data = {}) {
    return {
      transitTypeId: data.transitTypeId || LS.util.uid("transit-type"),
      name: String(data.name || "Custom Transit").trim() || "Custom Transit",
      category: data.category || "custom", color: normalizeHex(data.color), enabled: data.enabled !== false,
      travelModel: data.travelModel || "constant", speed: num(data.speed, 10), speedUnit: data.speedUnit || "km/h",
      fixedDurationMinutes: num(data.fixedDurationMinutes, 0), activationMinutes: num(data.activationMinutes, 0), cooldownMinutes: num(data.cooldownMinutes, 0),
      accelerationMinutes: num(data.accelerationMinutes, 0), decelerationMinutes: num(data.decelerationMinutes, 0),
      defaultDwellMinutes: num(data.defaultDwellMinutes, 5), defaultHeadwayMinutes: num(data.defaultHeadwayMinutes, 60),
      capacity: num(data.capacity, 0), fare: data.fare || "", renamedFrom: data.renamedFrom || null,
      notes: data.notes || "", custom: { ...(data.custom || {}) }, createdAt: data.createdAt || LS.util.now(), modifiedAt: LS.util.now()
    };
  }
  function addType(data) { let created; LS.store.update(state => { created = createType(data); ensure(state).types.push(created); return state; }); return created; }
  function updateType(id, patch) { LS.store.update(state => { const item = typeById(state, id); if (item) Object.assign(item, patch, { color: normalizeHex(patch.color || item.color), modifiedAt: LS.util.now() }); return state; }); }
  function deleteType(id) {
    LS.store.update(state => { const t = ensure(state); t.types = t.types.filter(item => item.transitTypeId !== id); t.routes = t.routes.filter(item => item.transitTypeId !== id); return state; });
  }

  function createStop(data = {}) {
    return {
      stopId: data.stopId || LS.util.uid("transit-stop"), name: String(data.name || "New Stop").trim() || "New Stop",
      locationId: data.locationId || null, level: data.level || "stop", aliases: Array.isArray(data.aliases) ? data.aliases : [],
      transferMinutes: num(data.transferMinutes, 5), defaultVisitMinutes: num(data.defaultVisitMinutes, 30),
      accessibility: { stepFree: true, assistanceAvailable: true, notes: "", ...(data.accessibility || {}) },
      services: Array.isArray(data.services) ? data.services : [], tags: Array.isArray(data.tags) ? data.tags : [],
      mapPlacements: Array.isArray(data.mapPlacements) ? data.mapPlacements : [], notes: data.notes || "",
      createdAt: data.createdAt || LS.util.now(), modifiedAt: LS.util.now()
    };
  }
  function addStop(data) { let created; LS.store.update(state => { created = createStop(data); ensure(state).stops.push(created); return state; }); return created; }
  function updateStop(id, patch) { LS.store.update(state => { const item = stopById(state, id); if (item) Object.assign(item, patch, { modifiedAt: LS.util.now() }); return state; }); }
  function deleteStop(id) {
    LS.store.update(state => { const t = ensure(state); t.stops = t.stops.filter(item => item.stopId !== id); t.routes.forEach(route => { route.stopIds = (route.stopIds || []).filter(stopId => stopId !== id); route.segments = (route.segments || []).filter(segment => segment.fromStopId !== id && segment.toStopId !== id); }); return state; });
  }
  function placeStop(stopId, mapNodeId, x, y) {
    LS.store.update(state => {
      const stop = stopById(state, stopId); if (!stop) return state;
      stop.mapPlacements = Array.isArray(stop.mapPlacements) ? stop.mapPlacements : [];
      const existing = stop.mapPlacements.find(item => item.mapNodeId === mapNodeId);
      const placement = { mapNodeId, x: clamp(num(x, 50), 0, 100), y: clamp(num(y, 50), 0, 100), modifiedAt: LS.util.now() };
      if (existing) Object.assign(existing, placement); else stop.mapPlacements.push({ placementId: LS.util.uid("transit-placement"), ...placement, createdAt: LS.util.now() });
      stop.modifiedAt = LS.util.now(); return state;
    });
  }

  function segmentDistance(route, fromId, toId, state) {
    const explicit = (route.segments || []).find(item => item.fromStopId === fromId && item.toStopId === toId) || (route.segments || []).find(item => item.fromStopId === toId && item.toStopId === fromId);
    if (explicit && num(explicit.distance, -1) >= 0) return { distance: num(explicit.distance), unit: explicit.distanceUnit || route.distanceUnit || ensure(state).settings.distanceUnit };
    const from = stopById(state, fromId), to = stopById(state, toId);
    const common = from?.mapPlacements?.find(a => to?.mapPlacements?.some(b => b.mapNodeId === a.mapNodeId));
    const other = common && to.mapPlacements.find(item => item.mapNodeId === common.mapNodeId);
    if (common && other) {
      const settings = ensure(state).settings;
      const dx = (other.x - common.x) / 100 * num(settings.mapWidthDistance, 100);
      const dy = (other.y - common.y) / 100 * num(settings.mapHeightDistance, 100);
      return { distance: Math.hypot(dx, dy), unit: settings.distanceUnit || "km", inferredFromMap: true };
    }
    return { distance: num(route.defaultSegmentDistance, 10), unit: route.distanceUnit || ensure(state).settings.distanceUnit || "km", estimated: true };
  }
  function distanceToKm(distance, unit) {
    const normalized = String(unit || "km").trim().toLowerCase();
    return num(distance) * (UNIT_TO_KM[normalized] || 1);
  }
  function speedToKmH(speed, unit) {
    const normalized = String(unit || "km/h").trim().toLowerCase();
    if (normalized === "km/h" || normalized === "kph") return num(speed);
    if (normalized === "mi/h" || normalized === "mph") return num(speed) * 1.609344;
    if (normalized === "m/s") return num(speed) * 3.6;
    if (normalized === "au/day") return num(speed) * UNIT_TO_KM.au / 24;
    if (normalized === "ly/day") return num(speed) * UNIT_TO_KM.ly / 24;
    if (normalized === "light-seconds/minute") return num(speed) * UNIT_TO_KM["light-second"] * 60;
    if (normalized === "c") return num(speed) * C_KM_H;
    if (normalized === "map-units/h") return num(speed);
    return num(speed);
  }
  function travelMinutes(distance, distanceUnit, type, overrides = {}) {
    const model = overrides.travelModel || type?.travelModel || "constant";
    if (model === "portal" || model === "fixed") {
      return Math.max(0, num(overrides.activationMinutes, type?.activationMinutes) + num(overrides.fixedDurationMinutes, type?.fixedDurationMinutes) + num(overrides.cooldownMinutes, 0));
    }
    const speed = speedToKmH(overrides.speed ?? type?.speed, overrides.speedUnit || type?.speedUnit);
    if (speed <= 0) return Infinity;
    const cruise = distanceToKm(distance, distanceUnit) / speed * 60;
    if (model === "accelerated") return Math.max(0, num(overrides.accelerationMinutes, type?.accelerationMinutes) + cruise + num(overrides.decelerationMinutes, type?.decelerationMinutes));
    return Math.max(0, cruise);
  }

  function createRoute(data = {}) {
    const stopIds = Array.isArray(data.stopIds) ? data.stopIds.filter(Boolean) : [];
    const segments = Array.isArray(data.segments) ? data.segments : stopIds.slice(0, -1).map((id, i) => ({ fromStopId: id, toStopId: stopIds[i + 1], distance: num(data.defaultSegmentDistance, 10), distanceUnit: data.distanceUnit || "km" }));
    return {
      routeId: data.routeId || LS.util.uid("transit-route"), name: String(data.name || "New Route").trim() || "New Route",
      transitTypeId: data.transitTypeId || null, color: data.color ? normalizeHex(data.color) : null,
      stopIds, segments, bidirectional: data.bidirectional !== false, loop: Boolean(data.loop), active: data.active !== false,
      distanceUnit: data.distanceUnit || "km", defaultSegmentDistance: num(data.defaultSegmentDistance, 10),
      operator: data.operator || "", notes: data.notes || "", tags: Array.isArray(data.tags) ? data.tags : [],
      createdAt: data.createdAt || LS.util.now(), modifiedAt: LS.util.now()
    };
  }
  function addRoute(data) { let created; LS.store.update(state => { created = createRoute(data); ensure(state).routes.push(created); return state; }); return created; }
  function updateRoute(id, patch) { LS.store.update(state => { const item = routeById(state, id); if (item) Object.assign(item, patch, { color: patch.color ? normalizeHex(patch.color) : item.color, modifiedAt: LS.util.now() }); return state; }); }
  function deleteRoute(id) { LS.store.update(state => { const t = ensure(state); t.routes = t.routes.filter(item => item.routeId !== id); t.services = t.services.filter(item => item.routeId !== id); t.vehicles = t.vehicles.filter(item => item.routeId !== id); return state; }); }

  function parseDepartureList(value) {
    if (Array.isArray(value)) return value.map(num).filter(Number.isFinite).sort((a,b)=>a-b);
    return String(value || "").split(/[\s,;]+/).map(token => {
      if (/^\d{1,2}:\d{2}$/.test(token)) { const [h,m] = token.split(":").map(Number); return h * 60 + m; }
      return Number(token);
    }).filter(Number.isFinite).sort((a,b)=>a-b);
  }
  function createService(data = {}, state) {
    const route = state ? routeById(state, data.routeId) : null;
    const type = state && route ? typeById(state, route.transitTypeId) : null;
    return {
      serviceId: data.serviceId || LS.util.uid("transit-service"), routeId: data.routeId || null,
      name: String(data.name || `${route?.name || "Route"} Service`).trim(), scheduleType: data.scheduleType || "frequency",
      startMinute: num(data.startMinute, 360), endMinute: num(data.endMinute, 1320), headwayMinutes: Math.max(1, num(data.headwayMinutes, type?.defaultHeadwayMinutes || 60)),
      departures: parseDepartureList(data.departures), days: Array.isArray(data.days) ? data.days : [0,1,2,3,4,5,6],
      speed: data.speed === "" || data.speed == null ? null : num(data.speed), speedUnit: data.speedUnit || null,
      dwellMinutes: data.dwellMinutes === "" || data.dwellMinutes == null ? null : num(data.dwellMinutes),
      transferPenaltyMinutes: num(data.transferPenaltyMinutes, 0), active: data.active !== false,
      capacity: data.capacity == null ? null : num(data.capacity), fare: data.fare || "", reliability: clamp(num(data.reliability, 1), 0, 1),
      notes: data.notes || "", createdAt: data.createdAt || LS.util.now(), modifiedAt: LS.util.now()
    };
  }
  function addService(data) { let created; LS.store.update(state => { created = createService(data, state); ensure(state).services.push(created); return state; }); return created; }
  function updateService(id, patch) { LS.store.update(state => { const item = serviceById(state, id); if (item) Object.assign(item, patch, { departures: patch.departures == null ? item.departures : parseDepartureList(patch.departures), modifiedAt: LS.util.now() }); return state; }); }
  function deleteService(id) { LS.store.update(state => { const t = ensure(state); t.services = t.services.filter(item => item.serviceId !== id); t.vehicles = t.vehicles.filter(item => item.serviceId !== id); return state; }); }

  function nextDeparture(service, absoluteMinute) {
    if (!service?.active) return Infinity;
    const dayStart = Math.floor(absoluteMinute / 1440) * 1440;
    const minuteOfDay = ((absoluteMinute % 1440) + 1440) % 1440;
    for (let dayOffset = 0; dayOffset < 8; dayOffset += 1) {
      const candidateDay = dayStart + dayOffset * 1440;
      const weekday = (Math.floor(candidateDay / 1440) % 7 + 7) % 7;
      if (service.days?.length && !service.days.includes(weekday)) continue;
      const threshold = dayOffset === 0 ? minuteOfDay : -1;
      if (service.scheduleType === "on-demand" || service.scheduleType === "continuous") return absoluteMinute + (dayOffset ? dayOffset * 1440 : 0);
      if (service.scheduleType === "departures" && service.departures?.length) {
        const departure = service.departures.find(value => value >= threshold);
        if (departure != null) return candidateDay + departure;
      } else {
        const start = num(service.startMinute, 0), end = num(service.endMinute, 1440), headway = Math.max(1, num(service.headwayMinutes, 60));
        if (threshold <= end) {
          const base = Math.max(start, threshold);
          const departure = start + Math.ceil(Math.max(0, base - start) / headway) * headway;
          if (departure <= end) return candidateDay + departure;
        }
      }
    }
    return Infinity;
  }

  function routeEdges(state) {
    const t = ensure(state), edges = [];
    for (const route of t.routes.filter(item => item.active !== false)) {
      const type = typeById(state, route.transitTypeId);
      const services = t.services.filter(item => item.routeId === route.routeId && item.active !== false);
      const effectiveServices = services.length ? services : [{ serviceId: `default:${route.routeId}`, routeId: route.routeId, name: `${route.name} Default`, scheduleType: "continuous", startMinute: 0, endMinute: 1439, headwayMinutes: type?.defaultHeadwayMinutes || 60, departures: [], days: [0,1,2,3,4,5,6], active: true, speed: null, speedUnit: null, dwellMinutes: null, transferPenaltyMinutes: 0 }];
      const pairs = [];
      for (let i = 0; i < route.stopIds.length - 1; i += 1) pairs.push([route.stopIds[i], route.stopIds[i + 1], i]);
      if (route.loop && route.stopIds.length > 2) pairs.push([route.stopIds[route.stopIds.length - 1], route.stopIds[0], route.stopIds.length - 1]);
      for (const [fromStopId, toStopId, segmentIndex] of pairs) {
        const distance = segmentDistance(route, fromStopId, toStopId, state);
        for (const service of effectiveServices) {
          const dwell = service.dwellMinutes == null ? num(type?.defaultDwellMinutes, 0) : num(service.dwellMinutes);
          const travel = travelMinutes(distance.distance, distance.unit, type, { speed: service.speed ?? type?.speed, speedUnit: service.speedUnit || type?.speedUnit });
          const base = { routeId: route.routeId, serviceId: service.serviceId, transitTypeId: route.transitTypeId, distance: distance.distance, distanceUnit: distance.unit, travelMinutes: travel, dwellMinutes: dwell, segmentIndex };
          edges.push({ fromStopId, toStopId, ...base });
          if (route.bidirectional) edges.push({ fromStopId: toStopId, toStopId: fromStopId, ...base, reverse: true });
        }
      }
    }
    return edges;
  }

  function planLeg(state, originId, destinationId, departMinute, options = {}) {
    if (originId === destinationId) return { ok: true, originStopId: originId, destinationStopId: destinationId, departMinute, arrivalMinute: departMinute, steps: [], transfers: 0, travelMinutes: 0, waitMinutes: 0 };
    const edges = routeEdges(state), adjacency = new Map();
    edges.forEach(edge => { if (!adjacency.has(edge.fromStopId)) adjacency.set(edge.fromStopId, []); adjacency.get(edge.fromStopId).push(edge); });
    const best = new Map([[originId, { cost: departMinute, arrival: departMinute, transfers: 0, lastServiceId: null }]]);
    const previous = new Map();
    const queue = [{ stopId: originId, cost: departMinute, arrival: departMinute, transfers: 0, lastServiceId: null }];
    const mode = options.optimization || "balanced";
    const maxTransfers = num(options.maximumTransfers, ensure(state).settings.maximumTransfers || 6);
    while (queue.length) {
      queue.sort((a,b)=>a.cost-b.cost); const current = queue.shift();
      const known = best.get(current.stopId); if (!known || current.cost > known.cost + 0.0001) continue;
      if (current.stopId === destinationId) break;
      for (const edge of adjacency.get(current.stopId) || []) {
        const service = serviceById(state, edge.serviceId) || { serviceId: edge.serviceId, routeId: edge.routeId, scheduleType: "continuous", startMinute: 0, endMinute: 1439, headwayMinutes: 1, departures: [], days: [0,1,2,3,4,5,6], active: true };
        const changed = Boolean(current.lastServiceId && current.lastServiceId !== edge.serviceId);
        const transferMinutes = changed ? num(stopById(state, current.stopId)?.transferMinutes, ensure(state).settings.defaultTransferMinutes) : 0;
        const ready = current.arrival + transferMinutes;
        const departure = nextDeparture(service, ready);
        if (!Number.isFinite(departure) || !Number.isFinite(edge.travelMinutes)) continue;
        const arrival = departure + edge.travelMinutes + edge.dwellMinutes;
        const transfers = current.transfers + (changed ? 1 : 0); if (transfers > maxTransfers) continue;
        const transferWeight = mode === "fewest-transfers" ? 180 : mode === "balanced" ? 15 : 0;
        const waitWeight = mode === "least-waiting" ? 1.5 : 1;
        const cost = arrival + transfers * transferWeight + (departure - ready) * (waitWeight - 1);
        const prior = best.get(edge.toStopId);
        if (!prior || cost < prior.cost) {
          best.set(edge.toStopId, { cost, arrival, transfers, lastServiceId: edge.serviceId });
          previous.set(edge.toStopId, { fromStopId: current.stopId, edge, readyMinute: ready, departureMinute: departure, arrivalMinute: arrival, transferMinutes, waitMinutes: departure - ready });
          queue.push({ stopId: edge.toStopId, cost, arrival, transfers, lastServiceId: edge.serviceId });
        }
      }
    }
    const destination = best.get(destinationId);
    if (!destination) return { ok: false, reason: "No usable connection was found between the selected stops." };
    const steps = []; let cursor = destinationId;
    while (cursor !== originId) { const item = previous.get(cursor); if (!item) break; steps.unshift({ fromStopId: item.fromStopId, toStopId: cursor, ...item }); cursor = item.fromStopId; }
    return {
      ok: true, originStopId: originId, destinationStopId: destinationId, departMinute,
      arrivalMinute: destination.arrival, steps, transfers: destination.transfers,
      travelMinutes: steps.reduce((sum, step) => sum + step.edge.travelMinutes, 0),
      waitMinutes: steps.reduce((sum, step) => sum + step.waitMinutes + step.transferMinutes, 0)
    };
  }

  function planTrip(options = {}, state = LS.store.get()) {
    ensure(state);
    const originStopId = options.originStopId, destinationStopId = options.destinationStopId;
    if (!originStopId || !destinationStopId) return { ok: false, reason: "Choose an origin and destination." };
    const visits = Array.isArray(options.visits) ? options.visits.filter(item => item.stopId) : [];
    const checkpoints = [originStopId, ...visits.map(item => item.stopId), destinationStopId];
    let currentMinute = num(options.departMinute, state.simulation?.absoluteMinute ?? state.project.calendar.currentAbsoluteMinute ?? 0);
    const legs = [], timeline = [];
    for (let i = 0; i < checkpoints.length - 1; i += 1) {
      const leg = planLeg(state, checkpoints[i], checkpoints[i + 1], currentMinute, options);
      if (!leg.ok) return { ...leg, failedFromStopId: checkpoints[i], failedToStopId: checkpoints[i + 1] };
      legs.push(leg);
      leg.steps.forEach(step => timeline.push({ kind: "ride", ...step }));
      currentMinute = leg.arrivalMinute;
      const visit = visits[i];
      if (visit) {
        const duration = Math.max(0, num(visit.durationMinutes, stopById(state, visit.stopId)?.defaultVisitMinutes ?? ensure(state).settings.defaultVisitMinutes));
        timeline.push({ kind: "visit", stopId: visit.stopId, startMinute: currentMinute, endMinute: currentMinute + duration, durationMinutes: duration, purpose: visit.purpose || "Visit", npcId: visit.npcId || null, goods: visit.goods || "", services: visit.services || "", notes: visit.notes || "" });
        currentMinute += duration;
      }
    }
    const plan = {
      tripPlanId: options.tripPlanId || LS.util.uid("trip-plan"), name: options.name || "Planned Trip", originStopId, destinationStopId,
      departMinute: num(options.departMinute), arrivalMinute: currentMinute, optimization: options.optimization || "balanced",
      visits, legs, timeline, transfers: legs.reduce((sum, leg) => sum + leg.transfers, 0),
      totalMinutes: currentMinute - num(options.departMinute), createdAt: LS.util.now(), modifiedAt: LS.util.now(), status: "planned"
    };
    if (options.save !== false) LS.store.update(current => { const t = ensure(current); const existing = t.tripPlans.find(item => item.tripPlanId === plan.tripPlanId); if (existing) Object.assign(existing, plan); else t.tripPlans.unshift(plan); return current; });
    return { ok: true, plan };
  }

  function createVehicle(data = {}, state = LS.store.get()) {
    const route = routeById(state, data.routeId); const service = serviceById(state, data.serviceId);
    return {
      vehicleId: data.vehicleId || LS.util.uid("transit-vehicle"), name: data.name || `${route?.name || "Transit"} Vehicle`,
      routeId: data.routeId || null, serviceId: data.serviceId || null, status: data.status || "scheduled",
      cycleStartMinute: num(data.cycleStartMinute, state.simulation?.absoluteMinute || 0), direction: data.direction || 1,
      currentSegmentIndex: 0, progress: 0, currentStopId: route?.stopIds?.[0] || null, nextStopId: route?.stopIds?.[1] || null,
      passengers: Array.isArray(data.passengers) ? data.passengers : [], notes: data.notes || "", createdAt: LS.util.now(), modifiedAt: LS.util.now()
    };
  }
  function addVehicle(data) { let created; LS.store.update(state => { created = createVehicle(data, state); ensure(state).vehicles.push(created); return state; }); return created; }
  function updateVehicles(state, absoluteMinute) {
    const transit = ensure(state);
    for (const vehicle of transit.vehicles) {
      const route = routeById(state, vehicle.routeId); if (!route || route.stopIds.length < 2 || vehicle.status === "inactive") continue;
      const type = typeById(state, route.transitTypeId); const service = serviceById(state, vehicle.serviceId) || createService({ routeId: route.routeId, scheduleType: "continuous" }, state);
      const segmentDurations = [];
      for (let i = 0; i < route.stopIds.length - 1; i += 1) { const d = segmentDistance(route, route.stopIds[i], route.stopIds[i+1], state); segmentDurations.push(Math.max(0.1, travelMinutes(d.distance, d.unit, type, { speed: service.speed ?? type?.speed, speedUnit: service.speedUnit || type?.speedUnit })) + num(service.dwellMinutes, type?.defaultDwellMinutes)); }
      const cycle = segmentDurations.reduce((a,b)=>a+b,0); if (!Number.isFinite(cycle) || cycle <= 0) continue;
      let elapsed = ((absoluteMinute - vehicle.cycleStartMinute) % cycle + cycle) % cycle, index = 0;
      while (index < segmentDurations.length - 1 && elapsed >= segmentDurations[index]) { elapsed -= segmentDurations[index]; index += 1; }
      const duration = segmentDurations[index]; vehicle.currentSegmentIndex = index; vehicle.progress = clamp(elapsed / duration, 0, 1);
      vehicle.currentStopId = route.stopIds[index]; vehicle.nextStopId = route.stopIds[index + 1]; vehicle.status = "in-service"; vehicle.modifiedAt = LS.util.now();
    }
  }

  function routeSummary(route, state = LS.store.get()) {
    const type = typeById(state, route.transitTypeId); const stops = (route.stopIds || []).map(id => stopById(state, id)).filter(Boolean);
    let distanceKm = 0, minutes = 0;
    for (let i = 0; i < route.stopIds.length - 1; i += 1) { const d = segmentDistance(route, route.stopIds[i], route.stopIds[i+1], state); distanceKm += distanceToKm(d.distance, d.unit); minutes += travelMinutes(d.distance, d.unit, type); }
    return { type, stops, distanceKm, travelMinutes: minutes, color: route.color || type?.color || "#00FFFF" };
  }
  function formatDuration(minutes) {
    if (!Number.isFinite(minutes)) return "unavailable";
    const rounded = Math.max(0, Math.round(minutes)); const days = Math.floor(rounded / 1440), hours = Math.floor((rounded % 1440) / 60), mins = rounded % 60;
    return [days ? `${days}d` : "", hours ? `${hours}h` : "", mins || (!days && !hours) ? `${mins}m` : ""].filter(Boolean).join(" ");
  }
  function formatMinute(value) { return LS.simulation?.formatTime ? LS.simulation.formatTime(value) : String(value); }

  LS.transit = Object.freeze({
    DEFAULT_TYPES, ensure, seedDefaults, normalizeHex, typeById, stopById, routeById, serviceById, locationByStop,
    createType, addType, updateType, deleteType, createStop, addStop, updateStop, deleteStop, placeStop,
    createRoute, addRoute, updateRoute, deleteRoute, createService, addService, updateService, deleteService,
    parseDepartureList, segmentDistance, distanceToKm, speedToKmH, travelMinutes, nextDeparture, routeEdges,
    planLeg, planTrip, createVehicle, addVehicle, updateVehicles, routeSummary, formatDuration, formatMinute
  });
})(window);
