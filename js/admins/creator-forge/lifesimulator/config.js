(function (global) {
  "use strict";
  const LS = (global.LifeSimulator = global.LifeSimulator || {});
  const lock = global.LIFESIMULATOR_BACKEND_LOCK || {};
  const genders = Object.freeze([
    "Agender", "Bi-Gender", "Cis-Female", "Cis-Male", "Demi-Female", "Demi-Male",
    "Gender-Flexible", "Gender-Fluid", "Gender-Less", "Neutrois", "Non-Binary",
    "Poly-Gender", "Trans-Female", "Trans-Male"
  ]);
  LS.CONFIG = Object.freeze({
    appName: "TableGate",
    schemaVersion: "8.0.0",
    stateKey: `tablegate.unified.v8.${global.TABLEGATE_CAMPAIGN_ID || "local"}`,
    dialogueStorageVersion: 2,
    backend: lock.deployment || "https://script.google.com/macros/s/AKfycbyTmuPyMg0ueiWAJSEpcrvXlkykD5g4Qo1cb0ybM1WDoTLAW43QG-6mvElxsWFVjx-vpg/exec",
    backendLibrary: lock.library || "https://script.google.com/macros/library/d/18ET55A9uVNx3IUzoAM_eRj8v7jqagPgjVdxil3P1SoUqrFnnAJp6CjVr/8",
    backendLibraryId: "18ET55A9uVNx3IUzoAM_eRj8v7jqagPgjVdxil3P1SoUqrFnnAJp6CjVr",
    backendLibraryVersion: 8,
    dialogueLimits: Object.freeze({ maxMessageChars: 8000, maxContextChars: 120000, maxTurnsPerNpc: 500, maxPlayers: 24, timeoutMs: 30000 }),
    acceptedExtensions: Object.freeze(["json", "csv", "tsv", "txt", "md", "html", "docx", "svg", "png", "jpg", "jpeg", "webp", "zip", "lifesim"]),
    precedence: Object.freeze({ generated: 10, project: 30, scoped: 50, manual: 70, locked: 100 }),
    genderIdentities: genders,
    eraLabels: Object.freeze([
      "Stone Age", "Early Metallurgy", "Iron / Classical", "Medieval",
      "Renaissance / Early Modern", "Industrial / Steam", "Electrified / Modern",
      "Digital / Atomic", "Planetary / Orbital", "Interplanetary", "Spacefaring / Interstellar"
    ]),
    developmentAxes: Object.freeze([
      "Materials & fabrication", "Energy", "Transportation", "Communications", "Medicine",
      "Computing & automation", "Robotics & synthetic life", "Biotechnology & genetic engineering",
      "Orbital capacity", "Interplanetary capacity", "Interstellar capacity", "Magic availability",
      "Magical industrialization", "Divine intervention", "Psionics", "Planar travel",
      "Supernatural ecology", "Political centralization", "Settlement density", "Education",
      "Inequality", "Ecological stewardship", "Public access"
    ]),
    tokenAssetRoot: "external-token://token-assets",
    reactionRoot: "assets/svg/admins/creator-forge/reactions/core",
    borderRoot: "assets/svg/admins/creator-forge/token-borders"
  });

  LS.util = Object.freeze({
    uid(prefix) {
      const value = global.crypto && global.crypto.randomUUID
        ? global.crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
      return `${prefix}-${value}`;
    },
    now() { return new Date().toISOString(); },
    clone(value) { return value == null ? value : JSON.parse(JSON.stringify(value)); },
    slug(value) {
      return String(value || "record").normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
        .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "record";
    },
    escape(value) {
      return String(value == null ? "" : value).replace(/[&<>'"]/g, character => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
      })[character]);
    },
    hash(value) {
      let hash = 2166136261;
      const text = String(value || "");
      for (let index = 0; index < text.length; index += 1) {
        hash ^= text.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
      }
      return hash >>> 0;
    },
    seeded(seed) {
      let state = LS.util.hash(seed) || 1;
      return function random() {
        state += 0x6D2B79F5;
        let value = state;
        value = Math.imul(value ^ (value >>> 15), value | 1);
        value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
        return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
      };
    },
    pick(values, random = Math.random) {
      return values && values.length ? values[Math.floor(random() * values.length)] : null;
    },
    sample(values, count, random = Math.random) {
      const pool = [...(values || [])];
      const result = [];
      while (pool.length && result.length < count) result.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
      return result;
    },
    safeFileName(value) { return String(value || "export").replace(/[<>:"/\\|?*\x00-\x1F]/g, "_").trim() || "export"; },
    download(name, content, type = "application/json") {
      const blob = content instanceof Blob ? content : new Blob([content], { type });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = LS.util.safeFileName(name);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    },
    formatBytes(bytes) {
      if (!bytes) return "0 B";
      const units = ["B", "KB", "MB", "GB"];
      const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
      return `${(bytes / (1024 ** index)).toFixed(index ? 1 : 0)} ${units[index]}`;
    },
    debounce(callback, delay = 180) {
      let timer;
      return (...args) => { clearTimeout(timer); timer = setTimeout(() => callback(...args), delay); };
    }
  });
})(window);
