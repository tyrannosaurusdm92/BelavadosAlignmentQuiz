(function () {
  "use strict";

  const LS = (window.LifeSimulator = window.LifeSimulator || {});
  const bundle = window.LS_REACTIONS || { core: [], technology: [], expansions: {} };
  const core = new Map((bundle.core || []).map(item => [item.id, Object.freeze({ ...item, namespace: "core" })]));
  const expansions = new Map();

  Object.entries(bundle.expansions || {}).forEach(([namespace, items]) => {
    expansions.set(namespace, new Map((items || []).map(item => [item.id, Object.freeze({ ...item, namespace })])));
  });

  function enabledNamespaces(state) {
    return new Set(state?.project?.enabledExpansions || []);
  }

  function get(id, state, includeDisabled) {
    if (core.has(id)) return core.get(id);
    const namespace = String(id || "").split(".")[0];
    if (!includeDisabled && !enabledNamespaces(state).has(namespace)) return null;
    return expansions.get(namespace)?.get(id) || null;
  }

  function list(options) {
    const state = options?.state || LS.store?.get?.();
    let result = [...core.values()];
    for (const [namespace, values] of expansions) {
      if (options?.includeDisabled || enabledNamespaces(state).has(namespace)) result.push(...values.values());
    }
    if (options?.category) result = result.filter(item => item.category === options.category);
    if (options?.query) {
      const query = String(options.query).toLowerCase();
      result = result.filter(item => `${item.id} ${item.label} ${item.description || ""} ${(item.priorityTags || []).join(" ")}`.toLowerCase().includes(query));
    }
    return result;
  }

  function iconPath(reaction) {
    if (!reaction) return "";
    if (reaction.namespace && reaction.namespace !== "core") {
      return `assets/reactions/expansions/${encodeURIComponent(reaction.namespace)}/${reaction.icon.split("/").map(encodeURIComponent).join("/")}`;
    }
    return `assets/reactions/core/${reaction.icon.split("/").map(encodeURIComponent).join("/")}`;
  }

  function legacyTarget(oldPath) {
    const aliases = bundle.aliases?.aliases || bundle.aliases || {};
    const value = aliases[oldPath];
    return typeof value === "string" ? value : value?.target || value?.path || null;
  }

  function technologyContext(era) {
    const profile = LS.era?.reactionTechnologyProfile(era) || bundle.technology?.[Math.max(0, Math.min(10, Number(era) || 0))];
    return {
      profile,
      capabilities: new Set(profile?.capabilities || []),
      infrastructure: new Set(profile?.infrastructure || [])
    };
  }

  function available(reaction, era) {
    if (!reaction || reaction.namespace !== "core") return Boolean(reaction);
    const context = technologyContext(era);
    const requirements = reaction.availability || {};
    if ((requirements.capabilities || []).some(value => !context.capabilities.has(value))) return false;
    if ((requirements.allInfrastructure || []).some(value => !context.infrastructure.has(value))) return false;
    if ((requirements.anyInfrastructure || []).length && !(requirements.anyInfrastructure || []).some(value => context.infrastructure.has(value))) return false;
    return true;
  }

  function categoryHints(text, result) {
    const value = String(text || "").toLowerCase();
    const hints = [];
    const add = (category, weight) => hints.push({ category, weight });
    if (/hello|greet|talk|friend|thank|sorry|trust|love|relationship|family/.test(value)) add("social_relationships", 4);
    if (/quest|mission|job|help|problem|task|reward|promise/.test(value)) add("work_professional", 3.5);
    if (/buy|sell|price|trade|shop|goods|service/.test(value)) add("commerce_services", 4);
    if (/\b(travel|go|route|train|ship|vehicle|ride|station|port)\b/.test(value)) add("transportation", 4);
    if (/danger|attack|fight|fire|flood|rescue|evacuate|warning/.test(value)) add("emergency_safety", 5);
    if (/secret|steal|smuggl|crime|spy|illegal|hidden/.test(value)) add("crime_secret", 3);
    if (/learn|teach|study|research|school|knowledge/.test(value)) add("education_learning", 3);
    if (/heal|hurt|medicine|health|sick|injury/.test(value)) add("health_wellness", 4);
    if (/food|drink|eat|meal|hungry/.test(value)) add("food_dining", 3);
    if (/work|build|repair|craft|make/.test(value)) add("craft_construction", 2.5);
    if (/vote|law|council|government|faction|policy/.test(value)) add("civic_governance", 3);
    if (/pray|ritual|spirit|divine|ceremony/.test(value)) add("spiritual_ceremonial", 3);
    if (/magic|psionic|portal|anomaly|supernatural/.test(value)) add("extraordinary_practices", 3);
    if (/space|orbit|habitat|airlock|zero gravity/.test(value)) add("space_habitat", 3);
    if (result?.mood === "afraid" || result?.mood === "alarmed") add("emergency_safety", 4);
    if (result?.mood === "warm" || result?.mood === "grateful") add("social_relationships", 4);
    if (result?.actions?.some(action => String(action.type).includes("quest"))) add("work_professional", 8);
    if (!hints.length) add("social_relationships", 2);
    return hints;
  }

  function scoreReaction(reaction, hints, npc, activeCounts, rng) {
    let score = 0.4 + rng() * 0.35;
    for (const hint of hints) if (reaction.category === hint.category) score += hint.weight;
    const traits = npc?.personality || npc?.dialogue?.personality || {};
    if (reaction.social?.canBeGroup && Number(traits.extraversion || 50) > 65) score += 0.8;
    if (reaction.interruptible === false && Number(traits.patience || 50) < 35) score -= 0.4;
    if ((reaction.priorityTags || []).some(tag => (npc?.traits?.goals || []).join(" ").toLowerCase().includes(String(tag).replace(/_/g, " ")))) score += 0.8;
    score /= 1 + Number(activeCounts?.[reaction.id] || 0) * 0.65;
    return score;
  }

  function select({ npc, state, text, result, seed, activeCounts }) {
    state = state || LS.store.get();
    const era = LS.era.recordEra(npc, state);
    const hints = categoryHints(text, result);
    const candidates = list({ state }).filter(item => available(item, era));
    const filtered = candidates.filter(item => hints.some(hint => item.category === hint.category));
    const pool = filtered.length ? filtered : candidates;
    if (!pool.length) return null;
    const rng = LS.util.seeded(seed || `${npc?.npcId}|${state.simulation?.absoluteMinute}|${text}`);
    return pool.map(reaction => ({ reaction, score: scoreReaction(reaction, hints, npc, activeCounts, rng) }))
      .sort((a, b) => b.score - a.score)[0].reaction;
  }

  function personalize(reaction, npc, state, seed) {
    if (!reaction) return null;
    const rng = LS.util.seeded(seed || `${npc?.npcId}|${reaction.id}|${state?.simulation?.absoluteMinute || 0}`);
    const variants = reaction.variants || ["naturally"];
    const randomProfiles = bundle.randomization?.profiles || {};
    const profile = Array.isArray(randomProfiles) ? (randomProfiles.find(item => item.id === reaction.randomizationProfile) || {}) : (randomProfiles[reaction.randomizationProfile] || {});
    const between = range => {
      const pair = Array.isArray(range) ? range : [0, 0];
      return Number(pair[0] || 0) + (Number(pair[1] || 0) - Number(pair[0] || 0)) * rng();
    };
    return {
      reactionId: reaction.id,
      label: reaction.label,
      category: reaction.category,
      icon: iconPath(reaction),
      variant: variants[Math.floor(rng() * variants.length)] || variants[0],
      durationMinutes: Math.max(1, Math.round(between(profile.durationMinutes || [2, 12]))),
      conversationChance: between(profile.conversationChance || [0.2, 0.8]),
      interruptible: reaction.interruptible !== false,
      namespace: reaction.namespace
    };
  }

  function record(npcId, personalized, source) {
    if (!personalized || !LS.store) return;
    LS.store.mutate("npc-reaction", state => {
      const npc = state.npcs.find(item => item.npcId === npcId);
      if (!npc) return;
      npc.simulation = npc.simulation || {};
      npc.simulation.currentReaction = { ...personalized, source: source || "dialogue", at: LS.util.now(), absoluteMinute: state.simulation.absoluteMinute };
      npc.simulation.reactionHistory = npc.simulation.reactionHistory || [];
      npc.simulation.reactionHistory.unshift(npc.simulation.currentReaction);
      npc.simulation.reactionHistory = npc.simulation.reactionHistory.slice(0, 120);
    });
  }

  function categories() {
    const counts = {};
    for (const reaction of core.values()) counts[reaction.category] = (counts[reaction.category] || 0) + 1;
    return Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0])).map(([id, count]) => ({ id, count, label: id.replace(/_/g, " ").replace(/\b\w/g, char => char.toUpperCase()) }));
  }

  LS.reactions = Object.freeze({ get, list, categories, iconPath, legacyTarget, available, select, personalize, record, technologyContext, coreCount: core.size, expansionCounts: Object.fromEntries([...expansions].map(([id, map]) => [id, map.size])) });
})();
