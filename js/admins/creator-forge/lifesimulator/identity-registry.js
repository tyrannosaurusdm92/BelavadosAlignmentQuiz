(function (global) {
  "use strict";
  const LS = global.LifeSimulator = global.LifeSimulator || {};

  const BUILT_INS = Object.freeze([
    ["agender", "Agender", "they/them"],
    ["bi-gender", "Bi-Gender", "he/she/they"],
    ["cis-female", "Cis-Female", "she/her"],
    ["cis-male", "Cis-Male", "he/him"],
    ["demi-female", "Demi-Female", "she/they"],
    ["demi-male", "Demi-Male", "he/they"],
    ["gender-flexible", "Gender-Flexible", "any respectful pronouns"],
    ["gender-fluid", "Gender-Fluid", "they/she/he"],
    ["gender-less", "Gender-Less", "they/them"],
    ["neutrois", "Neutrois", "they/them"],
    ["non-binary", "Non-Binary", "they/them"],
    ["poly-gender", "Poly-Gender", "they/them"],
    ["trans-female", "Trans-Female", "she/her"],
    ["trans-male", "Trans-Male", "he/him"]
  ]);

  function formsFor(label) {
    const value = String(label || "they/them").trim();
    const lower = value.toLowerCase();
    if (lower === "he/him") return { label: value, subject: "he", object: "him", possessiveAdjective: "his", possessivePronoun: "his", reflexive: "himself", agreement: "singular" };
    if (lower === "she/her") return { label: value, subject: "she", object: "her", possessiveAdjective: "her", possessivePronoun: "hers", reflexive: "herself", agreement: "singular" };
    if (lower === "xe/xem") return { label: value, subject: "xe", object: "xem", possessiveAdjective: "xyr", possessivePronoun: "xyrs", reflexive: "xemself", agreement: "singular" };
    if (lower === "ze/hir") return { label: value, subject: "ze", object: "hir", possessiveAdjective: "hir", possessivePronoun: "hirs", reflexive: "hirself", agreement: "singular" };
    return { label: value, subject: "they", object: "them", possessiveAdjective: "their", possessivePronoun: "theirs", reflexive: "themself", agreement: "plural" };
  }

  function makeBuiltIn(tuple) {
    const [identityId, name, label] = tuple;
    return {
      identityId,
      name,
      aliases: [],
      protected: true,
      preApproved: true,
      pronouns: formsFor(label),
      notes: "Pre-approved TableGate identity. The identity name is retained; its pronoun forms remain editable per person or project.",
      createdAt: null,
      modifiedAt: null
    };
  }

  const defaults = Object.freeze(BUILT_INS.map(makeBuiltIn));
  const clone = value => JSON.parse(JSON.stringify(value));

  function normalizePronouns(input, fallbackLabel) {
    if (typeof input === "string") return formsFor(input);
    const base = formsFor(input?.label || fallbackLabel || "they/them");
    return {
      label: String(input?.label || base.label),
      subject: String(input?.subject || base.subject),
      object: String(input?.object || base.object),
      possessiveAdjective: String(input?.possessiveAdjective || input?.possessive || base.possessiveAdjective),
      possessivePronoun: String(input?.possessivePronoun || base.possessivePronoun),
      reflexive: String(input?.reflexive || base.reflexive),
      agreement: input?.agreement === "singular" ? "singular" : "plural"
    };
  }

  function ensureState(state) {
    if (!state) return defaults.map(clone);
    const existing = Array.isArray(state.identityProfiles) ? state.identityProfiles : [];
    const byId = new Map(existing.map(item => [String(item.identityId || "").toLowerCase(), item]));
    const merged = defaults.map(item => {
      const saved = byId.get(item.identityId);
      return saved ? {
        ...clone(item),
        ...saved,
        identityId: item.identityId,
        name: item.name,
        protected: true,
        preApproved: true,
        pronouns: normalizePronouns(saved.pronouns, item.pronouns.label)
      } : clone(item);
    });
    existing.filter(item => !defaults.some(base => base.identityId === String(item.identityId || "").toLowerCase())).forEach(item => {
      const identityId = String(item.identityId || LS.util?.slug?.(item.name) || `custom-${Date.now()}`).toLowerCase();
      merged.push({
        identityId,
        name: String(item.name || "Custom Identity"),
        aliases: Array.isArray(item.aliases) ? item.aliases : [],
        protected: false,
        preApproved: false,
        pronouns: normalizePronouns(item.pronouns, "they/them"),
        notes: String(item.notes || ""),
        createdAt: item.createdAt || LS.util?.now?.() || new Date().toISOString(),
        modifiedAt: item.modifiedAt || LS.util?.now?.() || new Date().toISOString()
      });
    });
    state.identityProfiles = merged;
    return merged;
  }

  function all(state = LS.store?.get?.()) { return ensureState(state); }
  function resolve(value, state = LS.store?.get?.()) {
    const key = String(value || "").trim().toLowerCase();
    return all(state).find(item => item.identityId === key || item.name.toLowerCase() === key || item.aliases.some(alias => String(alias).toLowerCase() === key)) || null;
  }
  function pronounsFor(identity, state = LS.store?.get?.(), override) {
    if (override && (typeof override === "string" || Object.keys(override).some(key => override[key]))) return normalizePronouns(override, resolve(identity, state)?.pronouns?.label);
    return clone(resolve(identity, state)?.pronouns || formsFor("they/them"));
  }
  function options(selected = "", state = LS.store?.get?.(), includeAny = true) {
    const records = all(state);
    return `${includeAny ? '<option value="">Any identity</option>' : ""}${records.map(item => `<option value="${LS.util.escape(item.identityId)}"${item.identityId === selected || item.name === selected ? " selected" : ""}>${LS.util.escape(item.name)} · ${LS.util.escape(item.pronouns.label)}</option>`).join("")}`;
  }

  function upsert(record) {
    let saved = null;
    LS.store.update(state => {
      ensureState(state);
      const requestedId = String(record.identityId || "").toLowerCase();
      const existing = state.identityProfiles.find(item => item.identityId === requestedId);
      if (existing?.protected) {
        existing.pronouns = normalizePronouns(record.pronouns, existing.pronouns.label);
        existing.aliases = Array.isArray(record.aliases) ? record.aliases : existing.aliases;
        existing.notes = String(record.notes || existing.notes || "");
        existing.modifiedAt = LS.util.now();
        saved = existing;
      } else {
        const identityId = requestedId || `custom-${LS.util.slug(record.name)}-${Math.random().toString(36).slice(2, 7)}`;
        const value = {
          identityId,
          name: String(record.name || "Custom Identity").trim() || "Custom Identity",
          aliases: Array.isArray(record.aliases) ? record.aliases.filter(Boolean) : [],
          protected: false,
          preApproved: false,
          pronouns: normalizePronouns(record.pronouns, "they/them"),
          notes: String(record.notes || ""),
          createdAt: existing?.createdAt || LS.util.now(),
          modifiedAt: LS.util.now()
        };
        const index = state.identityProfiles.findIndex(item => item.identityId === identityId);
        if (index >= 0) state.identityProfiles[index] = value; else state.identityProfiles.push(value);
        saved = value;
      }
      return state;
    });
    return saved;
  }

  function remove(identityId) {
    let removed = false;
    LS.store.update(state => {
      ensureState(state);
      const record = state.identityProfiles.find(item => item.identityId === identityId);
      if (!record || record.protected) return state;
      state.identityProfiles = state.identityProfiles.filter(item => item.identityId !== identityId);
      removed = true;
      return state;
    });
    return removed;
  }

  function resetBuiltIn(identityId) {
    const base = defaults.find(item => item.identityId === identityId);
    if (!base) return null;
    return upsert({ identityId, pronouns: base.pronouns, aliases: [], notes: base.notes });
  }

  function managerElements() {
    const ids = ["identityRegistrySelect", "identityName", "identityAliases", "identityPronounLabel", "identityPronounSubject", "identityPronounObject", "identityPronounPossAdj", "identityPronounPoss", "identityPronounReflexive", "identityPronounAgreement", "identityNotes", "identitySaveBtn", "identityNewBtn", "identityDeleteBtn", "identityResetBtn", "identityRegistryBadges"];
    return Object.fromEntries(ids.map(id => [id, document.getElementById(id)]));
  }

  function renderManager(selectedId) {
    const el = managerElements();
    if (!el.identityRegistrySelect) return;
    const state = LS.store.get();
    const records = all(state);
    const currentId = selectedId || el.identityRegistrySelect.value || records[0]?.identityId;
    el.identityRegistrySelect.innerHTML = records.map(item => `<option value="${LS.util.escape(item.identityId)}"${item.identityId === currentId ? " selected" : ""}>${LS.util.escape(item.name)}${item.protected ? " · pre-approved" : " · custom"}</option>`).join("");
    const record = records.find(item => item.identityId === el.identityRegistrySelect.value) || records[0];
    if (!record) return;
    el.identityName.value = record.name;
    el.identityName.disabled = record.protected;
    el.identityAliases.value = record.aliases.join(", ");
    el.identityPronounLabel.value = record.pronouns.label;
    el.identityPronounSubject.value = record.pronouns.subject;
    el.identityPronounObject.value = record.pronouns.object;
    el.identityPronounPossAdj.value = record.pronouns.possessiveAdjective;
    el.identityPronounPoss.value = record.pronouns.possessivePronoun;
    el.identityPronounReflexive.value = record.pronouns.reflexive;
    el.identityPronounAgreement.value = record.pronouns.agreement;
    el.identityNotes.value = record.notes || "";
    el.identityDeleteBtn.disabled = record.protected;
    el.identityResetBtn.disabled = !record.protected;
    if (el.identityRegistryBadges) el.identityRegistryBadges.innerHTML = records.map(item => `<button type="button" data-identity-jump="${LS.util.escape(item.identityId)}" class="identity-badge${item.identityId === record.identityId ? " active" : ""}"><b>${LS.util.escape(item.name)}</b><span>${LS.util.escape(item.pronouns.label)}</span></button>`).join("");
    const npcGender = document.getElementById("npcGender");
    if (npcGender) {
      const current = npcGender.value;
      npcGender.innerHTML = options(current, state, true);
      if ([...npcGender.options].some(option => option.value === current)) npcGender.value = current;
    }
    const townIdentity = document.getElementById("townIdentity");
    if (townIdentity) {
      const current = townIdentity.value;
      townIdentity.innerHTML = options(current, state, true);
      if ([...townIdentity.options].some(option => option.value === current)) townIdentity.value = current;
    }
    const tokenIdentity = document.getElementById("raceGenderIdentity");
    if (tokenIdentity) {
      const current = tokenIdentity.value;
      tokenIdentity.innerHTML = records.map(item => `<option value="${LS.util.escape(item.name)}">${LS.util.escape(item.name)} · ${LS.util.escape(item.pronouns.label)}</option>`).join("");
      if ([...tokenIdentity.options].some(option => option.value === current)) tokenIdentity.value = current;
    }
  }

  function readManagerForm() {
    const el = managerElements();
    return {
      identityId: el.identityRegistrySelect.value.startsWith("__new") ? "" : el.identityRegistrySelect.value,
      name: el.identityName.value,
      aliases: el.identityAliases.value.split(",").map(value => value.trim()).filter(Boolean),
      pronouns: {
        label: el.identityPronounLabel.value,
        subject: el.identityPronounSubject.value,
        object: el.identityPronounObject.value,
        possessiveAdjective: el.identityPronounPossAdj.value,
        possessivePronoun: el.identityPronounPoss.value,
        reflexive: el.identityPronounReflexive.value,
        agreement: el.identityPronounAgreement.value
      },
      notes: el.identityNotes.value
    };
  }

  function bindManager() {
    const el = managerElements();
    if (!el.identityRegistrySelect || el.identityRegistrySelect.dataset.bound) return;
    el.identityRegistrySelect.dataset.bound = "true";
    el.identityRegistrySelect.addEventListener("change", () => renderManager(el.identityRegistrySelect.value));
    el.identityRegistryBadges?.addEventListener("click", event => {
      const button = event.target.closest("[data-identity-jump]");
      if (button) renderManager(button.dataset.identityJump);
    });
    el.identityNewBtn.addEventListener("click", () => {
      el.identityRegistrySelect.innerHTML += '<option value="__new" selected>New custom identity</option>';
      el.identityName.disabled = false;
      el.identityName.value = ""; el.identityAliases.value = ""; el.identityPronounLabel.value = "they/them";
      Object.assign(el.identityPronounSubject, { value: "they" }); Object.assign(el.identityPronounObject, { value: "them" });
      el.identityPronounPossAdj.value = "their"; el.identityPronounPoss.value = "theirs"; el.identityPronounReflexive.value = "themself"; el.identityPronounAgreement.value = "plural"; el.identityNotes.value = "";
      el.identityDeleteBtn.disabled = true; el.identityResetBtn.disabled = true;
    });
    el.identityPronounLabel.addEventListener("change", () => {
      const parsed = formsFor(el.identityPronounLabel.value);
      el.identityPronounSubject.value = parsed.subject; el.identityPronounObject.value = parsed.object; el.identityPronounPossAdj.value = parsed.possessiveAdjective; el.identityPronounPoss.value = parsed.possessivePronoun; el.identityPronounReflexive.value = parsed.reflexive; el.identityPronounAgreement.value = parsed.agreement;
    });
    el.identitySaveBtn.addEventListener("click", () => {
      const saved = upsert(readManagerForm());
      renderManager(saved?.identityId);
      LS.app?.toast?.(`Identity profile saved: ${saved?.name || "custom identity"}.`);
    });
    el.identityDeleteBtn.addEventListener("click", () => {
      if (remove(el.identityRegistrySelect.value)) { renderManager(); LS.app?.toast?.("Custom identity removed."); }
    });
    el.identityResetBtn.addEventListener("click", () => {
      const reset = resetBuiltIn(el.identityRegistrySelect.value);
      renderManager(reset?.identityId); LS.app?.toast?.("Pre-approved identity pronouns restored to the default preset.");
    });
    renderManager();
  }

  LS.identities = Object.freeze({ defaults, formsFor, normalizePronouns, ensureState, all, resolve, pronounsFor, options, upsert, remove, resetBuiltIn, renderManager, bindManager });
})(window);
