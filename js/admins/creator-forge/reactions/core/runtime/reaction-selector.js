function hashString(value) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) { h ^= value.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function mulberry32(seed) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function between(rng, [min,max]) { return min + (max-min) * rng(); }

export function makeNpcDayRandom(npcId, settlementId, dayKey) {
  return mulberry32(hashString(`${settlementId}|${npcId}|${dayKey}`));
}

export function personalizeReaction(reaction, profile, {npcId, settlementId, dayKey}) {
  const rng = makeNpcDayRandom(npcId, settlementId, dayKey);
  return {
    reactionId: reaction.id,
    variant: reaction.variants[Math.floor(rng() * reaction.variants.length)],
    startOffsetMinutes: Math.round(between(rng, profile.startJitterMinutes)),
    durationMinutes: Math.max(1, Math.round(between(rng, profile.durationMinutes))),
    movementSpeedFactor: between(rng, profile.movementSpeedFactor),
    pauseChance: between(rng, profile.pauseChance),
    conversationChance: between(rng, profile.conversationChance),
    routeEntropy: between(rng, profile.routeEntropy),
  };
}

export function chooseReaction({reactions, needs = {}, preferences = {}, activeCounts = {}, rng = Math.random}) {
  const scored = reactions.map(reaction => {
    let weight = 1;
    for (const tag of reaction.priorityTags || []) weight *= preferences[tag] ?? 1;
    weight *= needs[reaction.category] ?? 1;
    // Anti-synchronization: popular reactions become temporarily less likely.
    const active = activeCounts[reaction.id] || 0;
    weight /= 1 + active * 0.65;
    // Keep a small floor so rare actions remain possible.
    return {reaction, weight: Math.max(0.001, weight)};
  });
  const total = scored.reduce((sum, item) => sum + item.weight, 0);
  let cursor = rng() * total;
  for (const item of scored) {
    cursor -= item.weight;
    if (cursor <= 0) return item.reaction;
  }
  return scored.at(-1)?.reaction ?? null;
}

export function staggerPopulation(npcs, dayKey, settlementId, baseWindowMinutes = 120) {
  return npcs.map(npc => {
    const rng = makeNpcDayRandom(npc.id, settlementId, dayKey);
    return {...npc, scheduleStaggerMinutes: Math.round((rng() - 0.5) * baseWindowMinutes)};
  });
}
