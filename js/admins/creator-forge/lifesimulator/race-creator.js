(function (global) {
  "use strict";
  const LS = global.LifeSimulator;
  const draft = {
    categoryId: LS.species.categories[22].categoryId,
    traits: [], lineages: [], art: {}, activeIdentity: "Agender", image: null,
    crop: { zoom: 1, x: 0, y: 0, rotation: 0 }, borderId: LS.tokens.borders[0]?.borderId || null
  };

  function traitPool(setName) {
    const profiles = global.ALIEN_TRAIT_SETS?.[setName] || [];
    return profiles.flatMap(profile => profile.traits || []).filter(trait => trait?.value);
  }
  function generateAlienDraft(seed) {
    const random = LS.util.seeded(seed || `${Date.now()}-${Math.random()}`);
    const groups = ["set1", "set2", "set3"].map(set => LS.util.sample(traitPool(set), 3, random));
    const traits = groups.flat().map((trait, index) => ({ ...trait, set: `Alien racial traits set ${Math.floor(index / 3) + 1}` }));
    const name = global.AlienNameGenerator?.generate?.({ seed: seed || Date.now(), family: "mixed", length: "mixed", allowApostrophes: true, allowHyphens: true, allowSpaces: false, allowAccents: true, allowClicks: true }) || "New Alien Race";
    draft.traits = traits;
    const nameInput = document.querySelector("#raceName");
    const pluralInput = document.querySelector("#racePlural");
    const profileInput = document.querySelector("#raceProfile");
    if (nameInput) nameInput.value = name;
    if (pluralInput) pluralInput.value = `${name}s`;
    if (profileInput) profileInput.value = traits.map(trait => trait.value).join(" ");
    renderTraitDraft();
    LS.app?.toast?.("Alien-Folk draft generated from three anonymous trait sets. Upload art to finalize portrait tokens.");
  }

  function renderTraitDraft() {
    const target = document.querySelector("#generatedTraits");
    if (!target) return;
    target.innerHTML = draft.traits.length ? draft.traits.map(trait => `<article class="trait-chip"><small>${LS.util.escape(trait.set || trait.label)}</small><span>${LS.util.escape(trait.value)}</span></article>`).join("") : `<p class="empty-state">No generated trait draft. Manual homebrew fields remain fully editable.</p>`;
  }

  function drawCrop() {
    const canvas = document.querySelector("#tokenCropCanvas");
    if (!canvas) return;
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#0b1219";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.save();
    context.beginPath();
    context.arc(canvas.width / 2, canvas.height / 2, canvas.width * 0.45, 0, Math.PI * 2);
    context.clip();
    if (draft.image) {
      const image = draft.image;
      const base = Math.max(canvas.width / image.width, canvas.height / image.height) * draft.crop.zoom;
      const width = image.width * base;
      const height = image.height * base;
      context.translate(canvas.width / 2 + draft.crop.x, canvas.height / 2 + draft.crop.y);
      context.rotate(draft.crop.rotation * Math.PI / 180);
      context.drawImage(image, -width / 2, -height / 2, width, height);
    } else {
      context.fillStyle = "#142536";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "#87e8ff";
      context.textAlign = "center";
      context.font = "700 24px system-ui";
      context.fillText("UPLOAD ART", canvas.width / 2, canvas.height / 2);
    }
    context.restore();
    context.strokeStyle = "rgba(135,232,255,.85)";
    context.lineWidth = 4;
    context.beginPath();
    context.arc(canvas.width / 2, canvas.height / 2, canvas.width * 0.45, 0, Math.PI * 2);
    context.stroke();
    renderTokenPreview();
  }

  function croppedDataUrl() {
    if (!draft.image) return null;
    const source = document.querySelector("#tokenCropCanvas");
    const output = document.createElement("canvas");
    output.width = output.height = 512;
    const context = output.getContext("2d");
    context.save();
    context.beginPath();
    context.arc(256, 256, 252, 0, Math.PI * 2);
    context.clip();
    context.drawImage(source, 0, 0, 512, 512);
    context.restore();
    return output.toDataURL("image/png");
  }

  function renderTokenPreview() {
    const target = document.querySelector("#raceTokenPreview");
    if (!target) return;
    const categoryId = document.querySelector("#raceCategory")?.value || draft.categoryId;
    const exampleRace = LS.species.racesForCategory(categoryId)[0] || LS.species.builtInRaces[0];
    const dataUrl = croppedDataUrl() || draft.art[draft.activeIdentity] || null;
    target.innerHTML = LS.tokens.previewMarkup({ raceId: exampleRace.raceId, genderIdentity: draft.activeIdentity, borderId: draft.borderId, dataUrl, name: document.querySelector("#raceName")?.value || "Race Preview" });
  }

  function renderBorderPicker(query = "") {
    const target = document.querySelector("#borderPicker");
    if (!target) return;
    const list = LS.tokens.searchBorders(query);
    target.innerHTML = list.map(border => `<button type="button" class="border-option${border.borderId === draft.borderId ? " selected" : ""}" data-border-id="${border.borderId}" title="${LS.util.escape(border.name)}"><img src="${LS.util.escape(border.relativePath)}" alt=""><span>${LS.util.escape(border.name)}</span></button>`).join("");
    document.querySelector("#borderPickerCount").textContent = `${list.length} of ${LS.tokens.borders.length}`;
  }

  function addLineageRow(value = {}) {
    const list = document.querySelector("#lineageDraftList");
    if (!list) return;
    const row = document.createElement("div");
    row.className = "lineage-row";
    row.innerHTML = `<input class="lineage-name" placeholder="Bloodline / lineage name" value="${LS.util.escape(value.name || "")}"><input class="lineage-description" placeholder="Optional description" value="${LS.util.escape(value.description || "")}"><button type="button" class="icon-button remove-lineage" aria-label="Remove">×</button>`;
    list.appendChild(row);
  }

  function readLineages() {
    return [...document.querySelectorAll("#lineageDraftList .lineage-row")].map(row => ({
      name: row.querySelector(".lineage-name").value.trim(), description: row.querySelector(".lineage-description").value.trim()
    })).filter(item => item.name);
  }

  function saveRace() {
    const name = document.querySelector("#raceName").value.trim();
    if (!name) { LS.app.toast("Enter a race name before saving.", "error"); return; }
    const categoryId = document.querySelector("#raceCategory").value;
    const activeArt = croppedDataUrl();
    if (activeArt) draft.art[draft.activeIdentity] = activeArt;
    const record = {
      categoryId, name, plural: document.querySelector("#racePlural").value.trim(), profile: document.querySelector("#raceProfile").value.trim(),
      traits: draft.traits, lineages: readLineages(), cultureNotes: document.querySelector("#raceCulture").value.trim(),
      habitat: document.querySelector("#raceHabitat").value.split(/[,\n]/).map(value => value.trim()).filter(Boolean),
      communication: document.querySelector("#raceCommunication").value.split(/[,\n]/).map(value => value.trim()).filter(Boolean),
      capabilities: document.querySelector("#raceCapabilities").value.split(/[,\n]/).map(value => value.trim()).filter(Boolean),
      limitations: document.querySelector("#raceLimitations").value.split(/[,\n]/).map(value => value.trim()).filter(Boolean),
      physiology: { bodyPlan: document.querySelector("#raceBodyPlan").value.trim(), diet: document.querySelector("#raceDiet").value.trim(), senses: document.querySelector("#raceSenses").value.trim() },
      eraRange: { min: Number(document.querySelector("#raceEraMin").value), max: Number(document.querySelector("#raceEraMax").value) },
      tokenArt: draft.art, defaultBorderId: draft.borderId
    };
    const saved = LS.species.addCustomRace(record);
    draft.image = null; draft.art = {}; draft.traits = [];
    document.querySelector("#raceCreatorForm").reset();
    document.querySelector("#raceCategory").value = LS.species.categories[22].categoryId;
    document.querySelector("#lineageDraftList").innerHTML = "";
    renderTraitDraft(); drawCrop();
    LS.app.toast(`${saved.name} is now part of the integrated LifeSimulator race registry.`);
    LS.app.renderAll();
  }

  function bind() {
    const category = document.querySelector("#raceCategory");
    category.innerHTML = LS.species.categoryOptions(draft.categoryId);
    document.querySelector("#raceGenderIdentity").innerHTML = LS.identities.all().map(identity => `<option value="${LS.util.escape(identity.name)}">${LS.util.escape(identity.name)} · ${LS.util.escape(identity.pronouns.label)}</option>`).join("");
    const eraOptions = LS.CONFIG.eraLabels.map((label, value) => `<option value="${value}">${value} · ${LS.util.escape(label)}</option>`).join("");
    document.querySelector("#raceEraMin").innerHTML = eraOptions;
    document.querySelector("#raceEraMax").innerHTML = eraOptions;
    document.querySelector("#raceEraMax").value = "10";
    document.querySelector("#generateAlienDraftBtn").addEventListener("click", () => generateAlienDraft(document.querySelector("#alienDraftSeed").value.trim()));
    category.addEventListener("change", () => {
      draft.categoryId = category.value;
      const alien = LS.species.categories.find(item => item.categoryId === category.value)?.order === 23;
      document.querySelector("#alienGeneratorPanel").hidden = !alien;
      renderTokenPreview();
    });
    document.querySelector("#addLineageBtn").addEventListener("click", () => addLineageRow());
    document.querySelector("#lineageDraftList").addEventListener("click", event => {
      const button = event.target.closest(".remove-lineage");
      if (button) button.closest(".lineage-row").remove();
    });
    document.querySelector("#raceArtUpload").addEventListener("change", event => {
      const file = event.target.files?.[0];
      if (!file || !file.type.startsWith("image/")) { LS.app.toast("Choose a PNG, JPG, or WEBP image.", "error"); return; }
      const image = new Image();
      image.onload = () => { draft.image = image; draft.crop = { zoom: 1, x: 0, y: 0, rotation: 0 }; drawCrop(); };
      image.src = URL.createObjectURL(file);
    });
    ["tokenZoom", "tokenX", "tokenY", "tokenRotation"].forEach(id => document.querySelector(`#${id}`).addEventListener("input", event => {
      const key = { tokenZoom: "zoom", tokenX: "x", tokenY: "y", tokenRotation: "rotation" }[id];
      draft.crop[key] = Number(event.target.value); drawCrop();
    }));
    document.querySelector("#raceGenderIdentity").addEventListener("change", event => {
      const current = croppedDataUrl();
      if (current) draft.art[draft.activeIdentity] = current;
      draft.activeIdentity = event.target.value; draft.image = null; drawCrop();
    });
    document.querySelector("#saveIdentityTokenBtn").addEventListener("click", () => {
      const data = croppedDataUrl();
      if (!data) { LS.app.toast("Upload art before saving this identity token.", "error"); return; }
      draft.art[draft.activeIdentity] = data;
      LS.app.toast(`${draft.activeIdentity} token art retained in this race draft.`);
    });
    document.querySelector("#borderSearch").addEventListener("input", event => renderBorderPicker(event.target.value));
    document.querySelector("#borderPicker").addEventListener("click", event => {
      const button = event.target.closest("[data-border-id]");
      if (!button) return;
      draft.borderId = button.dataset.borderId; renderBorderPicker(document.querySelector("#borderSearch").value); renderTokenPreview();
    });
    document.querySelector("#saveRaceBtn").addEventListener("click", saveRace);
    document.querySelector("#raceName").addEventListener("input", renderTokenPreview);
    renderBorderPicker(); renderTraitDraft(); drawCrop();
  }

  LS.raceCreator = Object.freeze({ bind, generateAlienDraft, drawCrop, renderBorderPicker });
})(window);
