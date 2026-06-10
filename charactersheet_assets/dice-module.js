
"use strict";

const belavadosDice = (() => {
  const state = {
    numpadShowing: false,
    lastVal: "",
    userTyping: false,
    caretPos: 0,
    selectionEnd: 0,
    diceLimit: 20,
    box: null,
    resizeObserver: null,
    rollQueue: Promise.resolve()
  };

  const el = {};

  function readConfig() {
    const configEl = document.getElementById("belavados-dice-config");

    if (!configEl) {
      return {};
    }

    try {
      return JSON.parse(configEl.textContent);
    } catch {
      return {};
    }
  }

  function applyConfig(config) {
    const module = document.getElementById("belavados-dice-module");

    if (!module) {
      return;
    }

    if (config.width) {
      module.style.setProperty("--dice-width", config.width);
    }

    if (config.height) {
      module.style.setProperty("--dice-height", config.height);
    }

    if (config.minHeight) {
      module.style.setProperty("--dice-min-height", config.minHeight);
    }

    if (config.defaultDice && el.textInput) {
      el.textInput.value = config.defaultDice;
    }

    if (Number.isFinite(config.diceLimit)) {
      state.diceLimit = config.diceLimit;
    }
  }

  function init() {
    const config = readConfig();

    el.module = document.getElementById("belavados-dice-module");
    el.container = document.getElementById("diceRoller");
    el.result = document.getElementById("result");
    el.textInput = document.getElementById("textInput");
    el.numPad = document.getElementById("numPad");
    el.instructions = document.getElementById("instructions");
    el.center = document.getElementById("center_div");
    el.diceLimit = document.getElementById("diceLimit");
    el.clearBtn = document.getElementById("diceClearBtn");
    el.okBtn = document.getElementById("diceOkBtn");

    if (!el.module || !el.container || !el.textInput || !el.center) {
      return;
    }

    applyConfig(config);

    if (!window.DICE || !DICE.dice_box || !DICE.parse_notation) {
      if (el.result) {
        el.result.textContent = "Dice library did not load. Check libs/three.min.js, libs/cannon.min.js, libs/teal.js, and dice.js.";
      }
      return;
    }

    if (!hasWebGL()) {
      if (el.result) {
        el.result.textContent = "3D dice tray needs WebGL. Enable hardware acceleration/WebGL in the browser, then reload.";
      }
      return;
    }

    try {
      state.box = new DICE.dice_box(el.container);
      state.box.bind_swipe(el.center, beforeRoll, afterRoll);
      state.box.setDice(el.textInput.value);
    } catch (err) {
      state.box = null;
      if (el.result) {
        el.result.textContent = "3D dice tray could not initialize: " + (err && err.message ? err.message : String(err));
      }
      return;
    }

    bindEvents();

    showInstructions(true);

    if ("ResizeObserver" in window) {
      state.resizeObserver = new ResizeObserver(() => {
        if (state.box && el.container.clientWidth && el.container.clientHeight) {
          state.box.reinit(el.container);
        }
      });

      state.resizeObserver.observe(el.container);
    } else {
      window.addEventListener("resize", () => {
        if (state.box && el.container.clientWidth && el.container.clientHeight) {
          state.box.reinit(el.container);
        }
      }, { passive: true });
    }
  }

  function bindEvents() {
    el.textInput.addEventListener("change", () => {
      showInstructions(true);
    });

    el.textInput.addEventListener("input", () => {
      state.box.setDice(el.textInput.value);
    });

    el.textInput.addEventListener("focus", () => {
      el.diceLimit.hidden = true;

      if (!state.numpadShowing) {
        showInstructions(false);
        showNumPad(true);
      } else if (state.userTyping) {
        handleNumpadInput();
        state.userTyping = false;
      }
    });

    el.textInput.addEventListener("blur", () => {
      state.caretPos = el.textInput.selectionStart ?? el.textInput.value.length;
      state.selectionEnd = el.textInput.selectionEnd ?? state.caretPos;
    });

    el.textInput.addEventListener("mouseup", event => {
      event.preventDefault();
    });

    el.numPad.addEventListener("click", event => {
      const key = event.target?.dataset?.diceKey;

      if (!key) {
        return;
      }

      input(key);
    });

    el.clearBtn.addEventListener("click", clearInput);
    el.okBtn.addEventListener("click", setInput);

    window.addEventListener("keydown", event => {
      if ((event.code === "Enter" || event.code === "Escape") && state.numpadShowing) {
        setInput();
      }
    });
  }

  function setInput() {
    let inputVal = normalizeD100(el.textInput.value);
    const notation = DICE.parse_notation(inputVal);
    const numDice = notation.set.length;

    if (numDice > state.diceLimit) {
      el.diceLimit.hidden = false;
      return;
    }

    el.diceLimit.hidden = true;
    el.textInput.value = inputVal;
    state.box.setDice(inputVal);

    showNumPad(false);
    showInstructions(true);
  }

  function hasWebGL() {
    try {
      const canvas = document.createElement("canvas");
      return !!(window.WebGLRenderingContext &&
        (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")));
    } catch {
      return false;
    }
  }

  function normalizeD100(inputVal) {
    const tokens = String(inputVal || "").replace(/\s+/g, "").match(/[+-]?[^+-]+/g) || [];
    if (!tokens.length) return "";
    const out = [];
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      out.push(token);
      const body = token.replace(/^[+-]/, "");
      const match = body.match(/^(\d*)d100$/i);
      if (!match) continue;
      const count = Math.max(1, Number(match[1] || 1));
      const sign = token.startsWith("-") ? "-" : "+";
      const next = tokens[i + 1] || "";
      const nextBody = next.replace(/^[+-]/, "");
      const nextSign = next.startsWith("-") ? "-" : "+";
      const nextMatch = nextBody.match(/^(\d*)d9$/i);
      const alreadyHasPercentileOnesDie = nextMatch && nextSign === sign && Number(nextMatch[1] || 1) >= count;
      if (!alreadyHasPercentileOnesDie) {
        for (let j = 0; j < count; j++) out.push(`${sign}d9`);
      }
    }
    return out.join("").replace(/^\+/, "");
  }

  function clearInput() {
    el.textInput.value = "";
    if (state.box) {
      state.box.setDice("");
    }
    if (el.result) {
      el.result.textContent = "";
    }
  }

  function input(value) {
    state.lastVal = value;
    state.userTyping = true;
    handleNumpadInput();
    state.userTyping = false;
    el.textInput.focus();
  }

  function handleNumpadInput() {
    let text = el.textInput.value;
    let selectedText = state.caretPos !== state.selectionEnd;

    if (state.lastVal === "del") {
      if (selectedText) {
        text = deleteSelectedText(text);
      } else {
        text =
          text.substring(0, state.caretPos) +
          text.substring(state.caretPos + 1);
      }
    } else if (state.lastVal === "bksp") {
      if (selectedText) {
        text = deleteSelectedText(text);
      } else if (state.caretPos > 0) {
        text =
          text.substring(0, state.caretPos - 1) +
          text.substring(state.caretPos);

        state.caretPos--;
      }
    } else {
      text = deleteSelectedText(text);
      text =
        text.substring(0, state.caretPos) +
        state.lastVal +
        text.substring(state.caretPos);

      state.caretPos++;
    }

    el.textInput.value = text;
    if (state.box) {
      state.box.setDice(text);
    }

    setTimeout(() => {
      el.textInput.setSelectionRange(state.caretPos, state.caretPos);
    }, 1);
  }

  function deleteSelectedText(text) {
    const updated =
      text.substring(0, state.caretPos) +
      text.substring(state.selectionEnd);

    state.selectionEnd = state.caretPos;

    return updated;
  }

  function showInstructions(show) {
    el.instructions.style.display = show ? "grid" : "none";
  }

  function showNumPad(show) {
    state.numpadShowing = show;
    el.numPad.hidden = !show;

    if (show) {
      el.textInput.focus();
    } else {
      el.textInput.blur();
    }
  }

  function beforeRoll() {
    showInstructions(false);
    el.result.innerHTML = "";
    return null;
  }

  function afterRoll(notation) {
    if (notation.result[0] < 0) {
      el.result.innerHTML =
        "Oops, your dice fell off the table.<br>Refresh and roll again.";
    } else {
      el.result.innerHTML = notation.resultString;
    }
  }


  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, ch => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[ch]));
  }

  function waitForIdle(callback) {
    const check = () => {
      if (!state.box || !state.box.rolling) {
        callback();
      } else {
        window.requestAnimationFrame(check);
      }
    };
    check();
  }

  function rollTrayNotation(trayNotation, displayExpression) {
    const requested = String(trayNotation || "").replace(/\s+/g, "").toLowerCase();
    const label = String(displayExpression || requested || "dice roll");
    state.rollQueue = state.rollQueue.catch(() => {}).then(() => new Promise((resolve, reject) => {
      if (!state.box || !window.DICE || !DICE.parse_notation) {
        reject(new Error("Dice tray is not initialized."));
        return;
      }

      const normalized = normalizeD100(requested);
      const notation = DICE.parse_notation(normalized);
      if (!notation.set.length || notation.error) {
        reject(new Error(`Unsupported dice tray notation: ${requested}`));
        return;
      }
      if (notation.set.length > state.diceLimit) {
        if (el.diceLimit) el.diceLimit.hidden = false;
        reject(new Error(`The dice tray is limited to ${state.diceLimit} physical dice.`));
        return;
      }

      if (el.diceLimit) el.diceLimit.hidden = true;
      if (el.textInput) el.textInput.value = label;
      if (state.box) state.box.setDice(normalized);
      showNumPad(false);
      showInstructions(false);
      if (el.result) el.result.innerHTML = `Rolling <b>${escapeHtml(label)}</b>...`;

      waitForIdle(() => {
        try {
          state.box.start_throw(
            () => null,
            rolledNotation => {
              try {
                if (!rolledNotation || rolledNotation.result?.[0] < 0) {
                  reject(new Error("The dice fell off the table. Roll again."));
                  return;
                }
                if (el.result) {
                  el.result.innerHTML = `${escapeHtml(label)} → ${rolledNotation.resultString}`;
                }
                resolve(rolledNotation);
              } catch (err) {
                reject(err);
              }
            }
          );
        } catch (err) {
          reject(err);
        }
      });
    }));
    return state.rollQueue;
  }

  return {
    init,
    setInput,
    clearInput,
    input,
    rollTrayNotation,
    isReady: () => !!state.box
  };
})();

window.belavadosDice = belavadosDice;
window.addEventListener("DOMContentLoaded", belavadosDice.init);
