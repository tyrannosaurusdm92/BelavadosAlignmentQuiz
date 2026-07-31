/*
 * TableGate semantic settlement adapter
 * Derived in part from TownGeneratorOS ward-size and ward-distribution concepts.
 * TownGeneratorOS is licensed under GNU GPL v3; see licenses/TownGeneratorOS_GPL-3.0.txt.
 * This module intentionally excludes geometry, rendering, roads, walls, and map-generation code.
 * It uses only settlement-size and ward-type logic to create semantic TableGate locations and NPC assignments.
 */
(function (global) {
  "use strict";
  const LS = global.LifeSimulator;

  const SIZE_PROFILES = Object.freeze({
    "small-town": { label: "Small Town", patches: 6, population: [35, 90], structuresPerWard: [2, 4] },
    "large-town": { label: "Large Town", patches: 10, population: [70, 180], structuresPerWard: [3, 5] },
    "small-city": { label: "Small City", patches: 15, population: [140, 360], structuresPerWard: [3, 6] },
    "large-city": { label: "Large City", patches: 24, population: [260, 700], structuresPerWard: [4, 8] },
    "metropolis": { label: "Metropolis", patches: 40, population: [550, 1600], structuresPerWard: [5, 10] }
  });

  /* Weighted sequence mirrors the semantic ward mix in TownGeneratorOS Model.WARDS. */
  const WEIGHTED_WARDS = Object.freeze([
    "craftsmen", "craftsmen", "merchant", "craftsmen", "craftsmen", "temple",
    "craftsmen", "craftsmen", "craftsmen", "craftsmen", "craftsmen",
    "craftsmen", "craftsmen", "craftsmen", "administration", "craftsmen",
    "slum", "craftsmen", "slum", "patriciate", "market",
    "slum", "craftsmen", "craftsmen", "craftsmen", "slum",
    "craftsmen", "craftsmen", "craftsmen", "military", "slum",
    "craftsmen", "park", "patriciate", "market", "merchant"
  ]);

  const WARD_PROFILES = Object.freeze({
    craftsmen: {
      label: "Craftsmen Ward", neutralLabel: "Craft and Production District",
      locations: ["Smithy", "Carpenter Workshop", "Textile Workshop", "Repair Yard", "Potter's Studio", "Makers' Hall", "Warehouse", "Tool Exchange"],
      professions: ["artisan", "smith", "carpenter", "weaver", "repairer", "engineer", "apprentice", "warehouse keeper"],
      services: ["repairs", "fabrication", "tools", "commissions"]
    },
    merchant: {
      label: "Merchant Ward", neutralLabel: "Trade and Exchange District",
      locations: ["Counting House", "Merchant Hall", "Specialty Shop", "Caravan Office", "Auction Room", "Brokerage", "Import Warehouse", "Luxury Store"],
      professions: ["merchant", "broker", "factor", "caravan organizer", "clerk", "appraiser", "porter", "translator"],
      services: ["trade", "finance", "shipping", "appraisal"]
    },
    temple: {
      label: "Temple Ward", neutralLabel: "Sacred and Cultural District",
      locations: ["Temple", "Shrine", "Monastery", "Memorial Hall", "Pilgrim Hostel", "Healing House", "Scriptorium", "Ceremonial Plaza"],
      professions: ["priest", "healer", "caretaker", "scribe", "musician", "pilgrim guide", "counselor", "groundskeeper"],
      services: ["worship", "healing", "records", "shelter"]
    },
    administration: {
      label: "Administration Ward", neutralLabel: "Civic and Administrative District",
      locations: ["Town Hall", "Court", "Registry Office", "Archive", "Guard Office", "Permit Bureau", "Public Works Office", "Council Chamber"],
      professions: ["clerk", "magistrate", "advocate", "guard", "messenger", "archivist", "surveyor", "administrator"],
      services: ["records", "law", "permits", "public administration"]
    },
    slum: {
      label: "Slum", neutralLabel: "Dense Low-Income District",
      locations: ["Tenement", "Common Kitchen", "Pawn Counter", "Hidden Workshop", "Street Market", "Mutual-Aid Hall", "Cheap Lodging", "Back-Alley Clinic"],
      professions: ["laborer", "street vendor", "runner", "repairer", "cook", "caretaker", "scavenger", "organizer"],
      services: ["cheap lodging", "food", "informal trade", "mutual aid"]
    },
    patriciate: {
      label: "Patriciate Ward", neutralLabel: "Prestige and Estate District",
      locations: ["Estate", "Grand Residence", "Private Garden", "Salon", "Embassy", "Academy", "Luxury Bathhouse", "Private Club"],
      professions: ["steward", "diplomat", "tutor", "gardener", "guard", "artist", "advisor", "servant"],
      services: ["hospitality", "education", "diplomacy", "private events"]
    },
    market: {
      label: "Market", neutralLabel: "Market District",
      locations: ["Market Hall", "Open Bazaar", "Food Court", "General Store", "Tavern", "Inn", "Apothecary", "Public Square"],
      professions: ["vendor", "innkeeper", "cook", "porter", "herbalist", "performer", "watch officer", "buyer"],
      services: ["food", "lodging", "general trade", "rumors"]
    },
    military: {
      label: "Military Ward", neutralLabel: "Defense and Security District",
      locations: ["Barracks", "Armory", "Training Yard", "Watchtower", "Command Office", "Stable", "Supply Depot", "Infirmary"],
      professions: ["soldier", "guard", "quartermaster", "trainer", "medic", "scout", "armorer", "officer"],
      services: ["security", "training", "equipment", "emergency response"]
    },
    park: {
      label: "Park", neutralLabel: "Green and Recreation District",
      locations: ["Public Park", "Garden", "Festival Grounds", "Bathing Pool", "Play Field", "Arboretum", "Animal Sanctuary", "Outdoor Stage"],
      professions: ["gardener", "groundskeeper", "performer", "ranger", "vendor", "animal keeper", "guide", "athletics trainer"],
      services: ["recreation", "nature", "events", "rest"]
    },
    farm: {
      label: "Farm", neutralLabel: "Agricultural District",
      locations: ["Farmstead", "Granary", "Mill", "Orchard", "Greenhouse", "Livestock Yard", "Irrigation Office", "Produce Market"],
      professions: ["farmer", "miller", "herder", "gardener", "beekeeper", "veterinarian", "driver", "produce seller"],
      services: ["food supply", "animals", "storage", "agriculture"]
    },
    gate: {
      label: "Gate Ward", neutralLabel: "Transit and Entry District",
      locations: ["Gatehouse", "Customs Office", "Coach Yard", "Caravan Stop", "Stable", "Traveler's Inn", "Freight Depot", "Checkpoint"],
      professions: ["gate guard", "customs officer", "driver", "stable keeper", "porter", "innkeeper", "courier", "inspector"],
      services: ["transport", "customs", "lodging", "freight"]
    },
    castle: {
      label: "Castle", neutralLabel: "Central Stronghold or Command Complex",
      locations: ["Great Hall", "Command Chamber", "Residential Wing", "Archive", "Kitchen", "Armory", "Courtyard", "Audience Room"],
      professions: ["commander", "steward", "guard", "cook", "scribe", "advisor", "messenger", "caretaker"],
      services: ["government", "security", "records", "ceremonies"]
    }
  });

  const PREFIXES = ["Alder", "Ash", "Bright", "Cinder", "Copper", "Dawn", "Deep", "East", "Ember", "Glass", "Green", "High", "Iron", "Juniper", "Lantern", "Moon", "North", "Old", "River", "Rose", "Silver", "South", "Stone", "Sun", "West", "Willow"];
  const SUFFIXES = ["Gate", "Cross", "Reach", "Haven", "Ward", "Row", "Quarter", "Commons", "Heights", "Market", "Yard", "Fields", "Landing", "Court", "Square", "Terrace"];

  function chooseWardList(profile, random, options) {
    const count = Math.max(1, Number(options.wardCount) || profile.patches);
    const result = [];
    if (options.includeCastle) result.push("castle");
    if (options.includeGate) result.push("gate");
    if (options.includeFarm && count >= 6) result.push("farm");
    if (options.includeMarket !== false) result.push("market");
    while (result.length < count) result.push(LS.util.pick(WEIGHTED_WARDS, random));
    return result.slice(0, count);
  }

  function districtName(wardKey, index, fantasyLabels, random) {
    const profile = WARD_PROFILES[wardKey];
    const generic = fantasyLabels ? profile.label : profile.neutralLabel;
    if (index === 0 && ["castle", "market", "gate"].includes(wardKey)) return generic;
    return `${LS.util.pick(PREFIXES, random)} ${generic.replace(/^(The )?/, "")}`;
  }

  function locationName(type, index, fantasyLabels, random) {
    if (fantasyLabels && /tavern|inn|temple|smithy|castle/i.test(type)) {
      const fantasyPrefixes = ["The Copper", "The Sleeping", "The Laughing", "The Silver", "The Crooked", "The Gilded", "The Wandering", "The Old"];
      const fantasyNouns = ["Dragon", "Griffin", "Lantern", "Stag", "Sword", "Crown", "Kettle", "Raven", "Fox", "Anvil"];
      return `${LS.util.pick(fantasyPrefixes, random)} ${LS.util.pick(fantasyNouns, random)} ${type}`;
    }
    return `${LS.util.pick(PREFIXES, random)} ${type}${index > 0 ? ` ${index + 1}` : ""}`;
  }

  function makeSystemProfile(options, state, profession) {
    const supplied = options.systemProfile && typeof options.systemProfile === "object" ? LS.util.clone(options.systemProfile) : null;
    if (supplied) {
      if (!supplied.role) supplied.role = profession;
      return supplied;
    }
    return {
      systemId: state.project.systemProfile?.systemId || "system-agnostic",
      editionId: state.project.systemProfile?.editionId || "",
      systemName: "Project System",
      editionLabel: "",
      identityLabel: "Ancestry / Species",
      ancestry: "",
      heritageLabel: "Heritage",
      heritage: "",
      roleLabel: "Role / Class",
      role: profession,
      specialization: "",
      background: "",
      abilities: []
    };
  }

  function generateSettlement(options = {}) {
    const size = SIZE_PROFILES[options.size] || SIZE_PROFILES["small-city"];
    const fantasyLabels = options.presentation !== "neutral";
    const random = LS.util.seeded(`${options.seed || "tablegate-settlement"}|${options.name || size.label}|${options.size || "small-city"}`);
    const result = { settlement: null, wards: [], locations: [], npcs: [], relationships: [] };

    LS.store.update(state => {
      const biomeId = options.biomeId || state.project.defaultBiomeId || "auto";
      const settlement = LS.simulation.createLocation({
        name: options.name || `${LS.util.pick(PREFIXES, random)}${LS.util.pick(["haven", "reach", "port", "cross", "stead", "hold"], random)}`.replace(/^\w/, c => c.toUpperCase()),
        type: size.label,
        category: "settlement",
        biomeId,
        parentLocationId: options.parentLocationId || null,
        mapLevel: "settlement",
        seed: `${options.seed || "settlement"}|root`,
        services: ["government", "trade", "housing", "transport", "community services"]
      }, state.locations.length, state);
      settlement.townGeneratorProfile = { source: "TownGeneratorOS semantic adapter", sizeId: options.size || "small-city", patches: size.patches, presentation: fantasyLabels ? "classic-fantasy" : "neutral", includeWalls: Boolean(options.includeWalls), includeCastle: Boolean(options.includeCastle), includeGate: Boolean(options.includeGate), generatedAt: LS.util.now() };
      settlement.public.description = `${settlement.name} is a ${size.label.toLowerCase()} with ${size.patches} semantic districts generated for TableGate. No TownGeneratorOS geometry is included.`;
      state.locations.push(settlement); result.settlement = settlement;

      const wardKeys = chooseWardList(size, random, options);
      const wardOccurrences = {};
      wardKeys.forEach((wardKey, wardIndex) => {
        wardOccurrences[wardKey] = (wardOccurrences[wardKey] || 0) + 1;
        const profile = WARD_PROFILES[wardKey];
        const ward = LS.simulation.createLocation({
          name: districtName(wardKey, wardOccurrences[wardKey] - 1, fantasyLabels, random),
          type: fantasyLabels ? profile.label : profile.neutralLabel,
          category: "district",
          biomeId,
          parentLocationId: settlement.locationId,
          mapLevel: "district",
          seed: `${options.seed || "settlement"}|ward|${wardIndex}`,
          services: profile.services
        }, state.locations.length + wardIndex, state);
        ward.wardProfile = wardKey;
        ward.public.description = `${ward.name} is one of ${settlement.name}'s generated districts. Its semantic profile supports NPC work, residence, travel, and map hierarchy placement.`;
        state.locations.push(ward); result.wards.push(ward);

        const range = size.structuresPerWard;
        const requested = Number(options.structuresPerWard);
        const structureCount = Number.isFinite(requested) && requested > 0 ? Math.max(1, Math.min(20, requested)) : range[0] + Math.floor(random() * (range[1] - range[0] + 1));
        for (let structureIndex = 0; structureIndex < structureCount; structureIndex += 1) {
          const structureType = LS.util.pick(profile.locations, random);
          const structure = LS.simulation.createLocation({
            name: locationName(structureType, structureIndex, fantasyLabels, random),
            type: structureType,
            category: "structure",
            biomeId,
            parentLocationId: ward.locationId,
            mapLevel: /hall|market|plaza|yard|park|garden|grounds|court/i.test(structureType) ? "landmark" : "structure",
            seed: `${options.seed || "settlement"}|ward|${wardIndex}|structure|${structureIndex}`,
            services: profile.services
          }, state.locations.length + structureIndex, state);
          structure.wardProfile = wardKey;
          structure.public.description = `${structure.name} is a ${structureType.toLowerCase()} in ${ward.name}, ${settlement.name}.`;
          structure.plotHooks = [
            `Someone connected to ${structure.name} needs discreet assistance.`,
            `A change in ${ward.name} is affecting the services available here.`
          ];
          state.locations.push(structure); result.locations.push(structure);
        }
      });

      const targetNpcs = Math.max(0, Math.min(1000, Number(options.npcCount) || Math.round((size.population[0] + size.population[1]) / 10)));
      const workplacePool = result.locations.length ? result.locations : result.wards;
      for (let npcIndex = 0; npcIndex < targetNpcs; npcIndex += 1) {
        const workplace = LS.util.pick(workplacePool, random);
        const ward = result.wards.find(item => item.locationId === workplace?.parentLocationId) || LS.util.pick(result.wards, random);
        const profile = WARD_PROFILES[workplace?.wardProfile || ward?.wardProfile || "market"];
        const profession = LS.util.pick(profile.professions, random);
        const identity = options.identityId || "";
        const npc = LS.simulation.createNpc({
          seed: `${options.seed || "settlement"}|npc|${npcIndex}`,
          locationId: workplace?.locationId || settlement.locationId,
          profession,
          systemRole: profession,
          systemProfile: makeSystemProfile(options, state, profession),
          genderIdentity: identity,
          conversationEnabled: options.conversationEnabled !== false
        }, state.npcs.length + npcIndex, state);
        npc.residenceLocationId = ward?.locationId || settlement.locationId;
        npc.workplaceLocationId = workplace?.locationId || settlement.locationId;
        npc.simulation.currentLocationId = npc.workplaceLocationId;
        npc.assignment = { settlementId: settlement.locationId, settlementName: settlement.name, districtId: ward?.locationId || null, districtName: ward?.name || null, workplaceId: workplace?.locationId || null, workplaceName: workplace?.name || null };
        npc.travelRange = targetNpcs > 300 && random() < .15 ? "regional traveler" : random() < .22 ? "cross-district commuter" : "mostly settlement-bound";
        state.npcs.push(npc); result.npcs.push(npc);
        if (workplace) workplace.employees.push(npc.npcId);
        if (ward) ward.residents.push(npc.npcId);
      }
      LS.legacy?.linkBatch(result.npcs, state, `${options.seed || "settlement"}|relationships`);
      result.relationships = state.relationships.filter(rel => result.npcs.some(npc => npc.npcId === rel.fromId || npc.npcId === rel.toId));
      state.events.unshift({ eventId: LS.util.uid("event"), type: "settlement-generation", label: `Generated ${settlement.name}: ${result.wards.length} districts, ${result.locations.length} locations, ${result.npcs.length} NPCs`, at: LS.util.now(), absoluteMinute: state.simulation.absoluteMinute || state.project.calendar.currentAbsoluteMinute || 0 });
      return state;
    });

    return result;
  }

  LS.townAdapter = Object.freeze({ SIZE_PROFILES, WARD_PROFILES, WEIGHTED_WARDS, generateSettlement });
})(window);
