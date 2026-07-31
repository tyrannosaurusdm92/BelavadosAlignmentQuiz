(function () {
  "use strict";

  const LS = (window.LifeSimulator = window.LifeSimulator || {});

  const PROFILES = [
    {
      id: "stone_age", label: "Stone Age", order: 0,
      materials: ["stone", "bone", "wood", "hide", "fiber", "clay"],
      energy: ["muscle", "fire", "wind", "flowing water"],
      communications: ["speech", "gesture", "drums", "signals", "oral messengers"],
      medicine: ["first aid", "herbal care", "ritual care", "community caregiving"],
      places: ["camp", "shelter", "gathering ground", "food store", "crafting place", "healing place", "landing"],
      work: ["forager", "hunter", "fisher", "tool maker", "builder", "healer", "story keeper", "guide", "caretaker", "food preparer"]
    },
    {
      id: "early_metallurgy", label: "Early Metallurgy", order: 1,
      materials: ["copper", "bronze", "stone", "timber", "brick", "woven fiber"],
      energy: ["muscle", "fire", "wind", "water"],
      communications: ["messengers", "inscribed marks", "signals", "early writing"],
      medicine: ["herbal care", "bone setting", "midwifery", "sanitation practice"],
      places: ["village home", "forge", "granary", "market", "shrine", "dock", "meeting hall"],
      work: ["metalworker", "farmer", "herder", "potter", "sailor", "scribe", "healer", "trader", "builder", "guard"]
    },
    {
      id: "iron_classical", label: "Iron / Classical", order: 2,
      materials: ["iron", "stone", "timber", "brick", "glass", "concrete"],
      energy: ["muscle", "fire", "wind", "water", "animal power"],
      communications: ["couriers", "written records", "signal towers", "public notices"],
      medicine: ["clinical observation", "surgery", "pharmacy", "public sanitation"],
      places: ["townhouse", "forum", "workshop", "archive", "clinic", "road station", "harbor"],
      work: ["artisan", "physician", "engineer", "teacher", "merchant", "administrator", "sailor", "courier", "builder", "guard"]
    },
    {
      id: "medieval", label: "Medieval", order: 3,
      materials: ["stone", "timber frame", "iron", "tile", "thatch", "glass"],
      energy: ["muscle", "fire", "windmill", "watermill", "animal power"],
      communications: ["couriers", "letters", "bells", "beacons", "guild records"],
      medicine: ["physic", "surgery", "herbal pharmacy", "hospice care"],
      places: ["residence", "guildhall", "market", "mill", "clinic", "inn", "fortification", "dock"],
      work: ["craftsperson", "healer", "miller", "merchant", "clerk", "builder", "navigator", "performer", "farmer", "watch member"]
    },
    {
      id: "early_modern", label: "Renaissance / Early Modern", order: 4,
      materials: ["brick", "cut stone", "timber", "iron", "glass", "ceramic"],
      energy: ["muscle", "combustion", "wind", "water", "clockwork"],
      communications: ["printing", "postal routes", "semaphore", "public gazettes"],
      medicine: ["anatomical medicine", "surgery", "pharmacy", "quarantine"],
      places: ["row house", "academy", "print shop", "exchange", "clinic", "observatory", "port"],
      work: ["printer", "surgeon", "cartographer", "instrument maker", "merchant", "researcher", "navigator", "diplomat", "architect", "clerk"]
    },
    {
      id: "industrial_steam", label: "Industrial / Steam", order: 5,
      materials: ["brick", "steel", "cast iron", "glass", "timber", "concrete"],
      energy: ["steam", "coal", "gas", "water power", "mechanical storage"],
      communications: ["telegraph", "postal service", "mass print", "signal networks"],
      medicine: ["hospital medicine", "anesthesia", "sanitation", "pharmacy"],
      places: ["tenement", "factory", "rail station", "hospital", "office", "warehouse", "steam port"],
      work: ["machinist", "rail worker", "engineer", "nurse", "factory worker", "clerk", "journalist", "merchant", "teacher", "inspector"]
    },
    {
      id: "electrified_modern", label: "Electrified / Modern", order: 6,
      materials: ["steel", "reinforced concrete", "glass", "aluminum", "plastic", "composites"],
      energy: ["electric grid", "combustion fuel", "hydroelectric", "battery"],
      communications: ["telephone", "radio", "broadcast", "postal service"],
      medicine: ["modern hospital care", "vaccination", "antibiotics", "emergency medicine"],
      places: ["apartment", "office", "school", "hospital", "station", "airport", "factory", "shopping district"],
      work: ["technician", "driver", "nurse", "engineer", "teacher", "journalist", "administrator", "mechanic", "scientist", "social worker"]
    },
    {
      id: "digital_atomic", label: "Digital / Atomic", order: 7,
      materials: ["advanced alloy", "reinforced concrete", "smart glass", "semiconductor", "polymer", "composite"],
      energy: ["electric grid", "nuclear", "renewables", "high-density battery"],
      communications: ["digital networks", "satellite links", "mobile devices", "encrypted data"],
      medicine: ["imaging", "precision surgery", "genomics", "advanced emergency care"],
      places: ["smart residence", "data center", "research campus", "medical center", "transit hub", "spaceport", "fabrication center"],
      work: ["software specialist", "systems engineer", "paramedic", "researcher", "pilot", "analyst", "designer", "robotics technician", "mediator", "ecologist"]
    },
    {
      id: "planetary_orbital", label: "Planetary / Orbital", order: 8,
      materials: ["aerospace alloy", "carbon composite", "regolith composite", "smart glass", "self-healing polymer"],
      energy: ["fusion", "orbital solar", "advanced fission", "grid storage"],
      communications: ["planetary mesh", "orbital relay", "quantum-secure channels", "immersive telepresence"],
      medicine: ["regenerative care", "robotic surgery", "adaptive prosthetics", "closed-habitat public health"],
      places: ["arcology residence", "orbital habitat", "launch terminal", "biolab", "fabrication bay", "life-support center", "planetary exchange"],
      work: ["habitat technician", "orbital pilot", "life-support ecologist", "fabricator", "systems medic", "robotics specialist", "diplomat", "resource planner", "researcher", "traffic coordinator"]
    },
    {
      id: "interplanetary", label: "Interplanetary", order: 9,
      materials: ["metamaterial", "ceramic composite", "aerogel", "smart alloy", "biofabricated material"],
      energy: ["fusion", "beamed power", "large-scale solar", "antimatter-catalyzed systems"],
      communications: ["delay-aware planetary nets", "laser relay", "autonomous courier probes", "immersive records"],
      medicine: ["regeneration", "radiation adaptation", "synthetic organs", "remote robotic care"],
      places: ["sealed habitat", "transfer station", "shipyard", "xenobiology lab", "resource refinery", "diplomatic enclave", "transit ring"],
      work: ["interplanetary navigator", "habitat engineer", "xenobiologist", "radiation medic", "shipwright", "logistics coordinator", "envoy", "terraforming specialist", "synthetic-life mediator", "prospector"]
    },
    {
      id: "spacefaring_interstellar", label: "Spacefaring / Interstellar", order: 10,
      materials: ["programmable matter", "metamaterial", "diamond lattice", "biofabricated structure", "exotic composite"],
      energy: ["fusion", "antimatter", "stellar collection", "setting-defined exotic power"],
      communications: ["interstellar courier net", "entanglement-assisted signaling", "autonomous archives", "distributed cognition"],
      medicine: ["whole-body regeneration", "adaptive biology", "synthetic embodiment", "mind-state medicine"],
      places: ["generation habitat", "stellar station", "worldship district", "matter foundry", "contact embassy", "biosphere vault", "jump terminal"],
      work: ["stellar navigator", "worldship ecologist", "matter programmer", "contact specialist", "embodiment medic", "sentience advocate", "systems architect", "planetary curator", "relativistic logistics planner", "anomaly researcher"]
    }
  ];

  const GENRE_MODIFIERS = {
    fantasy: {
      work: ["ritual specialist", "lore keeper", "beast handler", "ward maker", "herbalist"],
      places: ["sanctuary", "ritual ground", "lore house"],
      caveat: "Magic is controlled by independent sliders and is not implied by the era."
    },
    "science-fiction": {
      work: ["systems specialist", "field scientist", "habitat worker", "sensor operator", "contact liaison"],
      places: ["systems bay", "research module", "habitat commons"],
      caveat: "Scientific capability follows the explicit development axes, not a genre stereotype."
    },
    hybrid: {
      work: ["cross-system engineer", "anomaly mediator", "ritual technologist", "portal navigator", "biosystems artisan"],
      places: ["mixed-systems workshop", "anomaly clinic", "portal terminal"],
      caveat: "Technological and extraordinary capabilities are independently configurable."
    },
    "user-defined": { work: [], places: [], caveat: "Project vocabulary and imported canon are authoritative." }
  };

  function clampEra(value) { return Math.max(0, Math.min(10, Math.round(Number(value) || 0))); }
  function getProfile(value) { return PROFILES[clampEra(value)]; }
  function recordEra(record, state) {
    const local = record && (record.eraOverride ?? record.classification?.era ?? record.profession?.era);
    return clampEra(local == null ? state.project.era : local);
  }
  function reactionTechnologyProfile(value) {
    const profiles = window.LS_REACTIONS?.technology || [];
    return profiles.find(profile => Number(profile.order) === clampEra(value)) || profiles[clampEra(value)] || null;
  }
  function unique(values) { return [...new Set(values.filter(Boolean))]; }
  function occupationPool(genre, era, customTerms) {
    const profile = getProfile(era);
    const modifier = GENRE_MODIFIERS[genre] || GENRE_MODIFIERS["user-defined"];
    return unique([...(customTerms || []), ...profile.work, ...modifier.work]);
  }
  function locationPool(genre, era, customTerms) {
    const profile = getProfile(era);
    const modifier = GENRE_MODIFIERS[genre] || GENRE_MODIFIERS["user-defined"];
    return unique([...(customTerms || []), ...profile.places, ...modifier.places]);
  }
  function vocabulary(state, era) {
    const profile = getProfile(era);
    const reaction = reactionTechnologyProfile(era);
    return {
      era: profile.label,
      materials: profile.materials,
      energy: profile.energy,
      communications: profile.communications,
      medicine: profile.medicine,
      transportation: unique((reaction?.modes || []).map(mode => mode.label)),
      projectTerms: state.project.vocabulary || {},
      caveat: (GENRE_MODIFIERS[state.project.genre] || GENRE_MODIFIERS["user-defined"]).caveat
    };
  }
  function compatibility(record, state) {
    const era = recordEra(record, state);
    const profile = getProfile(era);
    const warnings = [];
    const text = JSON.stringify(record || {}).toLowerCase();
    if (era < 5 && /factory|rail|steam engine/.test(text) && Number(state.project.development?.Transportation || era) < 5) warnings.push("Industrial term appears below the configured transportation capability.");
    if (era < 7 && /computer|digital|satellite|robot/.test(text) && Number(state.project.development?.["Computing & automation"] || era) < 7) warnings.push("Digital term appears below the configured computing capability.");
    if (era < 8 && /orbital|spaceport|spacecraft/.test(text) && Number(state.project.development?.["Orbital capacity"] || era) < 8) warnings.push("Orbital term appears below the configured orbital capability.");
    return { era, profileId: profile.id, label: profile.label, compatible: warnings.length === 0, warnings };
  }

  LS.era = Object.freeze({ profiles: PROFILES, clampEra, getProfile, recordEra, reactionTechnologyProfile, occupationPool, locationPool, vocabulary, compatibility });
})();
