(function (global) {
  "use strict";
  const LS = global.LifeSimulator;
  const registry = global.LS_BIOME_REGISTRY;
  const byId = new Map(registry.biomes.map(item => [item.id, item]));
  function resolve(value) {
    const text = String(value || "").trim().toLowerCase();
    return byId.get(text) || registry.biomes.find(item => item.label.toLowerCase() === text || item.path.toLowerCase() === text) || null;
  }
  function groupedOptions(selected = "", includeAuto = true) {
    const groups = registry.categories.map(category => `<optgroup label="${LS.util.escape(category.label)}">${category.biomes.map(item => `<option value="${item.id}"${item.id === selected ? " selected" : ""}>${LS.util.escape(item.label)}</option>`).join("")}</optgroup>`).join("");
    return `${includeAuto ? `<option value="auto"${selected === "auto" ? " selected" : ""}>Automatic from location</option>` : ""}${groups}`;
  }
  LS.biomes = Object.freeze({ registry, all: registry.biomes, categories: registry.categories, resolve, groupedOptions });
})(window);
