(function (global) {
  "use strict";
  const LS = global.LifeSimulator;
  const tokenRegistry = global.LS_RACE_TOKEN_INDEX;
  const borderRegistry = global.LS_TOKEN_BORDER_REGISTRY;
  const tokens = tokenRegistry.tokens || [];
  const borders = borderRegistry.borders || [];
  const exact = new Map(tokens.map(token => [`${token.raceId}|${token.lineageId || ""}|${token.genderIdentity}`, token]));
  const byRace = new Map();
  tokens.forEach(token => {
    if (!byRace.has(token.raceId)) byRace.set(token.raceId, []);
    byRace.get(token.raceId).push(token);
  });

  function resolve(raceId, lineageId, genderIdentity, state = LS.store.get()) {
    const builtIn = exact.get(`${raceId}|${lineageId || ""}|${genderIdentity}`)
      || exact.get(`${raceId}||${genderIdentity}`)
      || (byRace.get(raceId) || []).find(token => token.genderIdentity === genderIdentity)
      || (byRace.get(raceId) || [])[0];
    if (builtIn) return { ...builtIn, source: builtIn.available ? "external-library" : "external-library-manifest", available: Boolean(builtIn.available) };
    const race = LS.species.getRace(raceId, state);
    const lineage = lineageId ? LS.species.getLineage(lineageId, state) : null;
    const dataUrl = lineage?.tokenArt?.[genderIdentity] || race?.tokenArt?.[genderIdentity] || race?.tokenArt?.default || null;
    return {
      categoryNumber: race?.categoryNumber || 23, category: race?.category || "Alien-Folk", categoryId: race?.categoryId,
      race: race?.name || "Unknown Race", raceId, lineageOrBloodline: lineage?.name || null, lineageId: lineageId || null,
      genderIdentity, fileName: `${race?.name || "Unknown"}_${lineage?.name ? `${lineage.name}_` : ""}${genderIdentity}.png`,
      relativePath: dataUrl || null, source: dataUrl ? "user-upload" : "placeholder", available: Boolean(dataUrl)
    };
  }

  function assignBorder(npc, preferredId) {
    if (preferredId && borders.some(border => border.borderId === preferredId)) return preferredId;
    if (npc?.token?.borderId && borders.some(border => border.borderId === npc.token.borderId)) return npc.token.borderId;
    return borders[LS.util.hash(`${npc?.npcId || "npc"}|${npc?.profession || ""}|${npc?.raceId || ""}`) % borders.length]?.borderId || null;
  }
  function borderById(borderId) { return borders.find(border => border.borderId === borderId) || borders[0] || null; }
  function reactionForNpc(npc) {
    const current = npc?.simulation?.currentReaction;
    if (current?.icon) return current;
    const reaction = LS.reactions?.get?.("special_states.idle") || LS.reactions?.list?.({ query: "waiting" })?.[0] || LS.reactions?.list?.({})?.[0];
    return reaction ? LS.reactions.personalize(reaction, npc, LS.store.get(), `${npc?.npcId}|idle`) : { label: "Available", icon: "", conversationChance: 1, interruptible: true };
  }
  function initials(name) {
    return String(name || "NPC").split(/\s+/).map(part => part[0]).join("").slice(0, 3).toUpperCase();
  }
  function tokenMarkup(npc, options = {}) {
    const state = options.state || LS.store.get();
    const race = LS.species.getRace(npc.raceId, state);
    const lineage = LS.species.getLineage(npc.lineageId, state);
    const resolved = (npc.token?.relativePath || npc.token?.assetId) ? npc.token : resolve(npc.raceId, npc.lineageId, npc.genderIdentity, state);
    const border = borderById(assignBorder(npc, npc.token?.borderId));
    const reaction = reactionForNpc(npc);
    const canTalk = npc.conversationEnabled !== false && reaction.conversationChance !== 0;
    const label = `${npc.name}, ${race?.name || resolved.race || "Unknown race"}, currently ${reaction.label || "available"}`;
    const portrait = resolved.assetId
      ? `<img class="npc-token-portrait" data-tablegate-asset-id="${LS.util.escape(resolved.assetId)}" alt=""><span class="npc-token-placeholder">${LS.util.escape(initials(npc.name))}</span>`
      : resolved.relativePath
        ? `<img class="npc-token-portrait" src="${LS.util.escape(resolved.relativePath)}" alt="" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span class="npc-token-placeholder" hidden>${LS.util.escape(initials(npc.name))}</span>`
        : `<span class="npc-token-placeholder">${LS.util.escape(initials(npc.name))}</span>`;
    return `<button class="npc-token ${canTalk ? "talkable" : "unavailable"}" type="button" data-talk-npc="${LS.util.escape(npc.npcId)}" aria-label="${LS.util.escape(label)}" title="${LS.util.escape(label)}">
      <span class="npc-token-disc">${portrait}</span>
      ${border ? `<img class="npc-token-border" src="${LS.util.escape(border.relativePath)}" alt="">` : ""}
      ${reaction.icon ? `<span class="npc-token-reaction"><img src="${LS.util.escape(reaction.icon)}" alt="${LS.util.escape(reaction.label || "Current activity")}"></span>` : ""}
      <span class="npc-token-motion" aria-hidden="true"></span>
    </button>`;
  }
  function previewMarkup({ raceId, lineageId, genderIdentity, borderId, dataUrl, name = "Preview" }) {
    const mock = {
      npcId: "preview", name, raceId, lineageId, genderIdentity,
      token: { ...(dataUrl ? { relativePath: dataUrl, source: "user-upload" } : resolve(raceId, lineageId, genderIdentity)), borderId },
      simulation: { currentReaction: { label: "Creating a race", icon: "assets/svg/admins/creator-forge/reactions/core/icons/craft-construction/designing-an-object.svg", conversationChance: 1 } }
    };
    return tokenMarkup(mock);
  }
  function bindNpc(npc, preferredBorderId) {
    const resolved = resolve(npc.raceId, npc.lineageId, npc.genderIdentity);
    npc.token = { ...resolved, borderId: assignBorder(npc, preferredBorderId), assignedAt: LS.util.now() };
    return npc;
  }
  function searchBorders(query = "") {
    const text = query.trim().toLowerCase();
    return borders.filter(border => !text || `${border.name} ${border.fileName}`.toLowerCase().includes(text));
  }
  function verifyManifest() {
    return {
      categories: 23, expectedTokens: tokens.length, borders: borders.length,
      recognizedGenderIdentities: tokenRegistry.recognizedGenderIdentities.length,
      allBordersAssignable: borders.every(border => border.assignable && border.selectable)
    };
  }

  LS.tokens = Object.freeze({ registry: tokenRegistry, borders, resolve, bindNpc, assignBorder, borderById, reactionForNpc, tokenMarkup, previewMarkup, searchBorders, verifyManifest });
})(window);
