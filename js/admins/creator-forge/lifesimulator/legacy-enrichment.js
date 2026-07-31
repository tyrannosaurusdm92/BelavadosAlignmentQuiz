(function (global) {
  "use strict";
  const LS = global.LifeSimulator;

  const ASPIRATIONS = [
    "Knowledge", "Fortune", "Family", "Community", "Mastery", "Adventure", "Justice",
    "Influence", "Creativity", "Spiritual understanding", "Security", "Legacy"
  ];
  const WANTS = [
    "a safer home", "recognition for their work", "a dependable ally", "a difficult question answered",
    "a stable source of income", "reconciliation with someone important", "access to rare training",
    "a chance to travel", "protection for their community", "freedom from an old obligation"
  ];
  const HOBBIES = [
    "reading", "storytelling", "gardening", "games", "music", "cooking", "walking", "crafting",
    "collecting", "fishing", "painting", "local history", "animal care", "exercise", "stargazing"
  ];
  const TRAITS = [
    "loyal", "practical", "idealistic", "wary", "generous", "competitive", "patient", "impulsive",
    "observant", "private", "outgoing", "stubborn", "gentle", "ambitious", "inventive", "protective"
  ];
  const DND_ALIGNMENTS = [
    "Lawful Good", "Neutral Good", "Chaotic Good", "Lawful Neutral", "True Neutral",
    "Chaotic Neutral", "Lawful Evil", "Neutral Evil", "Chaotic Evil"
  ];
  const LIFE_STAGES = [
    { max: 12, label: "child" }, { max: 19, label: "teen" }, { max: 35, label: "young adult" },
    { max: 59, label: "adult" }, { max: 79, label: "older adult" }, { max: Infinity, label: "elder" }
  ];

  function lifeStage(age) { return LIFE_STAGES.find(stage => age <= stage.max)?.label || "adult"; }
  function ageFor(race, random) {
    const profile = `${race?.canonicalProfile || ""} ${race?.physiology?.notes || ""}`.toLowerCase();
    const longLived = /long-lived|centuries|immortal|ageless|elf|construct|undead/.test(profile);
    const base = 18 + Math.floor(random() * (longLived ? 180 : 65));
    return Math.max(1, base);
  }
  function classicOverlay(npc, state, random) {
    const systemId = String(npc.systemProfile?.systemId || state.project.systemProfile?.systemId || "").toLowerCase();
    if (systemId !== "dnd") return null;
    return {
      alignment: LS.util.pick(DND_ALIGNMENTS, random),
      heroicTier: 1,
      homebrewTags: [],
      note: "Optional classic D&D presentation overlay. TableGate's primary record remains system-neutral and system-profile driven."
    };
  }

  function enrichNpc(npc, random, state, race) {
    if (!npc) return npc;
    npc.age = Number(npc.age) || ageFor(race, random);
    npc.lifeStage = npc.lifeStage || lifeStage(npc.age);
    npc.aspiration = npc.aspiration || LS.util.pick(ASPIRATIONS, random);
    npc.wants = Array.isArray(npc.wants) && npc.wants.length ? npc.wants : LS.util.sample(WANTS, 2, random);
    npc.hobbies = Array.isArray(npc.hobbies) && npc.hobbies.length ? npc.hobbies : LS.util.sample(HOBBIES, 2, random);
    npc.traits = Array.isArray(npc.traits) && npc.traits.length ? npc.traits : LS.util.sample(TRAITS, 3, random);
    npc.familyTree = npc.familyTree || { parents: [], guardians: [], siblings: [], partners: [], exPartners: [], children: [], wards: [], grandparents: [], grandchildren: [], chosenFamily: [] };
    npc.relationshipNotes = npc.relationshipNotes || [];
    npc.classicDndOverlay = npc.classicDndOverlay || classicOverlay(npc, state, random);
    npc.public = npc.public || {};
    npc.public.knownFacts = Array.from(new Set([...(npc.public.knownFacts || []), `${npc.lifeStage.replace(/^\w/, c => c.toUpperCase())}; aspires toward ${npc.aspiration.toLowerCase()}.`]));
    return npc;
  }

  function addRelationship(state, a, b, category, type, strength, reciprocalType = type) {
    if (!a || !b || a.npcId === b.npcId) return;
    const exists = state.relationships.some(item => item.fromId === a.npcId && item.toId === b.npcId && item.type === type);
    if (!exists) state.relationships.push({ relationshipId: LS.util.uid("relationship"), fromId: a.npcId, toId: b.npcId, category, type, strength, createdAt: LS.util.now(), source: "legacy-life-enrichment" });
    const reverse = state.relationships.some(item => item.fromId === b.npcId && item.toId === a.npcId && item.type === reciprocalType);
    if (!reverse) state.relationships.push({ relationshipId: LS.util.uid("relationship"), fromId: b.npcId, toId: a.npcId, category, type: reciprocalType, strength, createdAt: LS.util.now(), source: "legacy-life-enrichment" });
  }

  function linkBatch(created, state, seed = "relationships") {
    const people = (created || []).filter(Boolean);
    if (people.length < 2) return;
    const random = LS.util.seeded(`${seed}|${state.project.projectId}|${people.length}`);
    for (let index = 0; index < people.length - 1; index += 1) {
      const a = people[index];
      const b = people[index + 1];
      const roll = random();
      if (roll < .22) {
        addRelationship(state, a, b, "familial", "sibling", 55 + Math.round(random() * 40));
        a.familyTree.siblings.push(b.npcId); b.familyTree.siblings.push(a.npcId);
      } else if (roll < .38) {
        addRelationship(state, a, b, "romantic", "partner", 50 + Math.round(random() * 45));
        a.familyTree.partners.push(b.npcId); b.familyTree.partners.push(a.npcId);
      } else if (roll < .75) {
        addRelationship(state, a, b, "personal", "friend", 35 + Math.round(random() * 55));
      } else {
        addRelationship(state, a, b, "professional", "colleague", 25 + Math.round(random() * 55));
      }
    }
    state.relationships = state.relationships.slice(-5000);
  }

  LS.legacy = Object.freeze({ enrichNpc, linkBatch, lifeStage, addRelationship });
})(window);
