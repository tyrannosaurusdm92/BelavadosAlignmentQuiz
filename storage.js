// /js/storage.js
// Belavadös Alignment Quiz Storage System
// Handles persistence, save states, versioning, localStorage safety,
// deep/simple quiz separation, progress tracking, history, and resets.

/* =========================================================
   STORAGE CONFIG
========================================================= */

const STORAGE_KEYS = {
  APP_STATE: "belavados_app_state",
  SHORT_RESULTS: "belavados_short_results",
  DEEP_RESULTS: "belavados_deep_results",
  SETTINGS: "belavados_settings",
  HISTORY: "belavados_history",
  VERSION: "belavados_version"
};

const STORAGE_VERSION = "1.0.0";

/* =========================================================
   SAFE STORAGE HELPERS
========================================================= */

function isStorageAvailable() {
  try {
    const testKey = "__storage_test__";
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (err) {
    console.error("LocalStorage unavailable:", err);
    return false;
  }
}

function safeParse(data, fallback = null) {
  try {
    return JSON.parse(data);
  } catch (err) {
    console.warn("JSON parse failed:", err);
    return fallback;
  }
}

/* =========================================================
   GENERIC STORAGE METHODS
========================================================= */

export function saveToStorage(key, value) {
  if (!isStorageAvailable()) return false;

  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error(`Failed saving key "${key}"`, err);
    return false;
  }
}

export function loadFromStorage(key, fallback = null) {
  if (!isStorageAvailable()) return fallback;

  const data = localStorage.getItem(key);

  if (!data) return fallback;

  return safeParse(data, fallback);
}

export function removeFromStorage(key) {
  if (!isStorageAvailable()) return;

  localStorage.removeItem(key);
}

export function clearAllStorage() {
  if (!isStorageAvailable()) return;

  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });

  console.log("Belavadös storage cleared.");
}

/* =========================================================
   APP STATE STORAGE
========================================================= */

export function saveAppState(state) {
  const payload = {
    ...state,
    updatedAt: Date.now()
  };

  saveToStorage(STORAGE_KEYS.APP_STATE, payload);
}

export function loadAppState() {
  return loadFromStorage(STORAGE_KEYS.APP_STATE, null);
}

export function clearAppState() {
  removeFromStorage(STORAGE_KEYS.APP_STATE);
}

/* =========================================================
   SHORT QUIZ STORAGE
========================================================= */

export function saveShortQuizResult(resultData) {
  const payload = {
    ...resultData,
    mode: "short",
    savedAt: Date.now()
  };

  saveToStorage(STORAGE_KEYS.SHORT_RESULTS, payload);

  addResultToHistory(payload);
}

export function loadShortQuizResult() {
  return loadFromStorage(STORAGE_KEYS.SHORT_RESULTS, null);
}

export function clearShortQuizResult() {
  removeFromStorage(STORAGE_KEYS.SHORT_RESULTS);
}

/* =========================================================
   DEEP QUIZ STORAGE
========================================================= */

export function saveDeepQuizResult(resultData) {
  const payload = {
    ...resultData,
    mode: "deep",
    savedAt: Date.now()
  };

  saveToStorage(STORAGE_KEYS.DEEP_RESULTS, payload);

  addResultToHistory(payload);
}

export function loadDeepQuizResult() {
  return loadFromStorage(STORAGE_KEYS.DEEP_RESULTS, null);
}

export function clearDeepQuizResult() {
  removeFromStorage(STORAGE_KEYS.DEEP_RESULTS);
}

/* =========================================================
   QUIZ PROGRESS STORAGE
========================================================= */

export function saveQuizProgress(progressData) {
  const currentState = loadAppState() || {};

  const updatedState = {
    ...currentState,
    progress: progressData,
    updatedAt: Date.now()
  };

  saveAppState(updatedState);
}

export function loadQuizProgress() {
  const state = loadAppState();

  return state?.progress || null;
}

export function clearQuizProgress() {
  const state = loadAppState();

  if (!state) return;

  delete state.progress;

  saveAppState(state);
}

/* =========================================================
   SETTINGS STORAGE
========================================================= */

const DEFAULT_SETTINGS = {
  animations: true,
  reducedMotion: false,
  darkMode: true,
  autoSave: true,
  soundEnabled: false,
  loreExpanded: true
};

export function saveSettings(settings) {
  const merged = {
    ...DEFAULT_SETTINGS,
    ...settings
  };

  saveToStorage(STORAGE_KEYS.SETTINGS, merged);
}

export function loadSettings() {
  return loadFromStorage(
    STORAGE_KEYS.SETTINGS,
    DEFAULT_SETTINGS
  );
}

export function resetSettings() {
  saveSettings(DEFAULT_SETTINGS);
}

/* =========================================================
   HISTORY SYSTEM
========================================================= */

export function addResultToHistory(result) {
  const history = loadQuizHistory();

  const entry = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    alignment: result.alignment || "Unknown",
    class: result.class || "Unknown",
    mode: result.mode || "unknown",
    scores: result.scores || {},
    title: result.title || null
  };

  history.unshift(entry);

  // Limit history size
  const trimmed = history.slice(0, 50);

  saveToStorage(STORAGE_KEYS.HISTORY, trimmed);
}

export function loadQuizHistory() {
  return loadFromStorage(STORAGE_KEYS.HISTORY, []);
}

export function clearQuizHistory() {
  removeFromStorage(STORAGE_KEYS.HISTORY);
}

/* =========================================================
   SAVE / LOAD FULL SESSION
========================================================= */

export function exportFullSave() {
  const payload = {
    version: STORAGE_VERSION,
    exportedAt: Date.now(),

    appState: loadAppState(),
    shortResult: loadShortQuizResult(),
    deepResult: loadDeepQuizResult(),
    settings: loadSettings(),
    history: loadQuizHistory()
  };

  return JSON.stringify(payload, null, 2);
}

export function importFullSave(jsonString) {
  try {
    const data = JSON.parse(jsonString);

    if (!data.version) {
      throw new Error("Invalid save file.");
    }

    if (data.appState) {
      saveToStorage(STORAGE_KEYS.APP_STATE, data.appState);
    }

    if (data.shortResult) {
      saveToStorage(STORAGE_KEYS.SHORT_RESULTS, data.shortResult);
    }

    if (data.deepResult) {
      saveToStorage(STORAGE_KEYS.DEEP_RESULTS, data.deepResult);
    }

    if (data.settings) {
      saveToStorage(STORAGE_KEYS.SETTINGS, data.settings);
    }

    if (data.history) {
      saveToStorage(STORAGE_KEYS.HISTORY, data.history);
    }

    console.log("Save imported successfully.");

    return true;
  } catch (err) {
    console.error("Import failed:", err);
    return false;
  }
}

/* =========================================================
   VERSIONING
========================================================= */

export function saveVersion() {
  saveToStorage(STORAGE_KEYS.VERSION, STORAGE_VERSION);
}

export function loadVersion() {
  return loadFromStorage(STORAGE_KEYS.VERSION, null);
}

export function checkVersionMismatch() {
  const savedVersion = loadVersion();

  if (!savedVersion) {
    saveVersion();
    return false;
  }

  return savedVersion !== STORAGE_VERSION;
}

/* =========================================================
   AUTO SAVE
========================================================= */

let autoSaveInterval = null;

export function startAutoSave(getStateCallback, interval = 30000) {
  stopAutoSave();

  autoSaveInterval = setInterval(() => {
    try {
      const state = getStateCallback();

      if (state) {
        saveAppState(state);
      }
    } catch (err) {
      console.error("Auto-save failed:", err);
    }
  }, interval);

  console.log("Auto-save enabled.");
}

export function stopAutoSave() {
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval);
    autoSaveInterval = null;
  }
}

/* =========================================================
   SESSION RECOVERY
========================================================= */

export function hasRecoverableSession() {
  const state = loadAppState();

  if (!state) return false;

  return !!state.progress;
}

export function recoverSession() {
  return loadAppState();
}

/* =========================================================
   DOWNLOAD SAVE FILE
========================================================= */

export function downloadSaveFile(filename = "belavados-save.json") {
  const data = exportFullSave();

  const blob = new Blob([data], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/* =========================================================
   UPLOAD SAVE FILE
========================================================= */

export function uploadSaveFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const success = importFullSave(event.target.result);

        if (success) {
          resolve(true);
        } else {
          reject(new Error("Import failed."));
        }
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = reject;

    reader.readAsText(file);
  });
}

/* =========================================================
   DEBUG HELPERS
========================================================= */

export function printStorageDebug() {
  console.group("Belavadös Storage Debug");

  Object.entries(STORAGE_KEYS).forEach(([label, key]) => {
    console.log(label, loadFromStorage(key));
  });

  console.groupEnd();
}

/* =========================================================
   INITIALIZATION
========================================================= */

export function initializeStorage() {
  if (!isStorageAvailable()) {
    console.warn("Storage unavailable.");
    return;
  }

  if (checkVersionMismatch()) {
    console.warn("Storage version mismatch detected.");
  }

  if (!loadSettings()) {
    saveSettings(DEFAULT_SETTINGS);
  }

  saveVersion();

  console.log("Belavadös storage initialized.");
}

/* =========================================================
   DEFAULT EXPORT
========================================================= */

export default {
  initializeStorage,

  saveToStorage,
  loadFromStorage,
  removeFromStorage,
  clearAllStorage,

  saveAppState,
  loadAppState,
  clearAppState,

  saveShortQuizResult,
  loadShortQuizResult,
  clearShortQuizResult,

  saveDeepQuizResult,
  loadDeepQuizResult,
  clearDeepQuizResult,

  saveQuizProgress,
  loadQuizProgress,
  clearQuizProgress,

  saveSettings,
  loadSettings,
  resetSettings,

  addResultToHistory,
  loadQuizHistory,
  clearQuizHistory,

  exportFullSave,
  importFullSave,

  startAutoSave,
  stopAutoSave,

  hasRecoverableSession,
  recoverSession,

  downloadSaveFile,
  uploadSaveFile,

  printStorageDebug
};
