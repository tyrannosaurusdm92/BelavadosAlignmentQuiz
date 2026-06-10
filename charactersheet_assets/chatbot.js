
(() => {
  'use strict';

  const DEFAULT_CONFIG = {
    botName: 'Belavadös Assistant',
    diceLimit: 100,
    maxSides: 1000,
    autoScanOnInput: true,
    scanSelector: "input, textarea, select, [contenteditable='true'], [data-character-field], [data-scan-field], [data-5e-field], [data-dnd-field]",
    scanTextSelector: "[data-character-text], [data-scan-text], [data-feature], [data-spell], [data-weapon], [data-attack], [data-action], .character-sheet [class*='spell'], .character-sheet [class*='weapon'], .character-sheet [class*='attack'], .character-sheet [class*='feature'], .dnd-character-sheet [class*='spell'], .dnd-character-sheet [class*='weapon'], .dnd-character-sheet [class*='attack'], .dnd-character-sheet [class*='feature']",
    excludeSelector: "[data-belavados-chatbot], script, style, button, input[type='button'], input[type='submit'], input[type='reset'], input[type='file'], input[type='password']",
    preferSheetBonuses: true,
    includeStaticCharacterText: true
  };

  const ABILITIES = [
    { name: 'strength', short: 'str', aliases: ['strength', 'str'] },
    { name: 'dexterity', short: 'dex', aliases: ['dexterity', 'dex'] },
    { name: 'constitution', short: 'con', aliases: ['constitution', 'con'] },
    { name: 'intelligence', short: 'int', aliases: ['intelligence', 'int'] },
    { name: 'wisdom', short: 'wis', aliases: ['wisdom', 'wis'] },
    { name: 'charisma', short: 'cha', aliases: ['charisma', 'cha'] }
  ];
  const ABILITY_NAMES = ABILITIES.map(a => a.name);

  const SKILL_DATA = [
    { name: 'acrobatics', ability: 'dexterity', aliases: ['acrobatics'] },
    { name: 'animal handling', ability: 'wisdom', aliases: ['animal handling', 'animal'] },
    { name: 'arcana', ability: 'intelligence', aliases: ['arcana'] },
    { name: 'athletics', ability: 'strength', aliases: ['athletics'] },
    { name: 'deception', ability: 'charisma', aliases: ['deception'] },
    { name: 'history', ability: 'intelligence', aliases: ['history'] },
    { name: 'insight', ability: 'wisdom', aliases: ['insight'] },
    { name: 'intimidation', ability: 'charisma', aliases: ['intimidation', 'intimidate'] },
    { name: 'investigation', ability: 'intelligence', aliases: ['investigation', 'investigate'] },
    { name: 'medicine', ability: 'wisdom', aliases: ['medicine', 'stabilize', 'stabilise', 'first aid'] },
    { name: 'nature', ability: 'intelligence', aliases: ['nature'] },
    { name: 'perception', ability: 'wisdom', aliases: ['perception', 'spot', 'listen', 'notice'] },
    { name: 'performance', ability: 'charisma', aliases: ['performance'] },
    { name: 'persuasion', ability: 'charisma', aliases: ['persuasion', 'persuade'] },
    { name: 'religion', ability: 'intelligence', aliases: ['religion'] },
    { name: 'sleight of hand', ability: 'dexterity', aliases: ['sleight of hand', 'sleight', 'pick pocket', 'pickpocket'] },
    { name: 'stealth', ability: 'dexterity', aliases: ['stealth', 'sneak', 'hide'] },
    { name: 'survival', ability: 'wisdom', aliases: ['survival', 'track', 'forage'] }
  ];
  const SKILL_NAMES = SKILL_DATA.map(s => s.name);

  const TOOL_ALIASES = [
    { name: "thieves' tools", aliases: ["thieves tools", "thieve tools", "thieves' tools", 'lockpicks', 'lock picks', 'trap tools'] },
    { name: 'disguise kit', aliases: ['disguise kit'] },
    { name: 'forgery kit', aliases: ['forgery kit'] },
    { name: 'herbalism kit', aliases: ['herbalism kit'] },
    { name: 'poisoner kit', aliases: ["poisoner's kit", 'poisoner kit'] },
    { name: 'navigator tools', aliases: ["navigator's tools", 'navigator tools'] }
  ];

  const ALIGNMENT_AXES = [
    { name: 'altruism', negative: 'Self-serving', positive: 'Altruistic' },
    { name: 'lawfulness', negative: 'Chaotic', positive: 'Lawful' },
    { name: 'cooperation', negative: 'Individualistic', positive: 'Cooperative' },
    { name: 'honor', negative: 'Dishonorable', positive: 'Honorable' }
  ];

  const ALIGNMENT_HINTS = [
    { pattern: /\b(heal|healing|cure wounds|healing word|revive|rescue|protect|defend|stabilize|stabilise|first aid)\b/, text: 'Belavadös note: protecting, healing, rescuing, and risking yourself for others may touch Altruism; mercy or keeping a code may also touch Honor.' },
    { pattern: /\b(help action|help an ally|assist|teamwork|coordinate|support ally|support the party|bless)\b/, text: 'Belavadös note: teamwork, shared resources, and party support may touch Cooperation, with Altruism possible when there is cost or risk.' },
    { pattern: /\b(oath|vow|contract|law|treaty|order|authority|command)\b/, text: 'Belavadös note: obeying structure, treaties, duty, or sworn obligations may touch Lawfulness; keeping the promise may also touch Honor.' },
    { pattern: /\b(lie|deceive|betray|cheat|manipulate|break oath|oathbreak|abandon ally)\b/, text: 'Belavadös note: lying, betrayal, oathbreaking, and abandoning allies can touch Honor and/or Cooperation depending on the scene.' }
  ];

  const DICE_EXPRESSION_PATTERN = /(?:^|[^\w])((?:[+-]?\s*(?:(?:\d*)d(?:%|f|\d+)(?:(?:kh|kl|dh|dl)\d+)?|\d+))(?:\s*[+-]\s*(?:(?:\d*)d(?:%|f|\d+)(?:(?:kh|kl|dh|dl)\d+)?|\d+))*)/gi;

  function mergeConfig(root) {
    const out = Object.assign({}, DEFAULT_CONFIG);
    const node = root.querySelector('.belavados-chatbot-config');
    if (!node) return out;
    try { Object.assign(out, JSON.parse(node.textContent || '{}') || {}); } catch {}
    return out;
  }

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[ch]));
  }

  function normalize(value) {
    return String(value == null ? '' : value)
      .toLowerCase()
      .replace(/[’`]/g, "'")
      .replace(/[^a-z0-9+%'-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function compact(value) { return normalize(value).replace(/[^a-z0-9]+/g, ''); }
  function signed(n) { const num = Number(n) || 0; return num >= 0 ? `+${num}` : `${num}`; }
  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
  function uniq(items) { return Array.from(new Set(items.filter(Boolean))); }

  function hasWord(haystack, needle) {
    const h = ` ${normalize(haystack)} `;
    return h.includes(` ${normalize(needle)} `) || compact(haystack).includes(compact(needle));
  }

  function parseNumber(value) {
    const text = String(value == null ? '' : value).trim();
    const direct = text.match(/^[-+]?\d+$/);
    if (direct) return Number(direct[0]);
    const withSign = text.match(/[-+]\s*\d+/);
    if (withSign) return Number(withSign[0].replace(/\s+/g, ''));
    const any = text.match(/\b\d+\b/);
    if (any) return Number(any[0]);
    return null;
  }

  function parseSignedNumber(value) {
    const m = String(value == null ? '' : value).match(/[-+]\s*\d+/);
    return m ? Number(m[0].replace(/\s+/g, '')) : null;
  }

  function abilityModFromScore(value) {
    const n = parseNumber(value);
    if (n == null) return null;
    if (n >= 1 && n <= 30) return Math.floor((n - 10) / 2);
    return n;
  }

  function safeCssEscape(value) {
    if (window.CSS && CSS.escape) return CSS.escape(value);
    return String(value).replace(/[^a-zA-Z0-9_-]/g, '\\$&');
  }

  function closestText(el, selector) {
    const found = el.closest(selector);
    return found ? found.textContent.trim() : '';
  }

  function textBefore(el) {
    let node = el.previousElementSibling;
    let hops = 0;
    while (node && hops < 4) {
      const text = (node.textContent || '').trim();
      if (text && text.length < 120) return text;
      node = node.previousElementSibling;
      hops += 1;
    }
    return '';
  }

  function labelForElement(el) {
    const direct = el.getAttribute('data-chatbot-label') || el.getAttribute('data-character-label') || el.getAttribute('data-scan-label') || el.getAttribute('data-key') || el.getAttribute('aria-label') || el.getAttribute('data-label') || el.getAttribute('title');
    if (direct) return direct.trim();
    if (el.id) {
      const label = document.querySelector(`label[for="${safeCssEscape(el.id)}"]`);
      if (label && label.textContent.trim()) return label.textContent.trim();
    }
    if (el.closest('label') && closestText(el, 'label')) return closestText(el, 'label');
    const labelledBy = el.getAttribute('aria-labelledby');
    if (labelledBy) {
      const text = labelledBy.split(/\s+/).map(id => document.getElementById(id)?.textContent || '').join(' ').trim();
      if (text) return text;
    }
    const prev = textBefore(el);
    if (prev) return prev;
    return el.getAttribute('placeholder') || el.getAttribute('name') || el.id || el.getAttribute('data-character-field') || el.getAttribute('data-scan-field') || el.tagName.toLowerCase();
  }

  function valueForElement(el) {
    const tag = el.tagName.toLowerCase();
    const type = (el.getAttribute('type') || '').toLowerCase();
    if (type === 'checkbox' || type === 'radio') {
      if (!el.checked) return '';
      return el.value && el.value !== 'on' ? el.value : 'checked';
    }
    if (tag === 'select') return Array.from(el.selectedOptions || []).map(opt => opt.textContent.trim() || opt.value).filter(Boolean).join(', ');
    if ('value' in el) return el.value || '';
    if (el.isContentEditable) return el.textContent || '';
    return el.textContent || '';
  }

  function locatorFor(el) {
    if (!el || el.nodeType !== 1) return '';
    if (el.id) return `#${el.id}`;
    const name = el.getAttribute('name');
    if (name) return `${el.tagName.toLowerCase()}[name="${name}"]`;
    return el.tagName.toLowerCase();
  }

  function looksRelevantStaticText(text) {
    const t = normalize(text);
    if (t.length < 2 || t.length > 2400) return false;
    return /\b(spell|cantrip|weapon|attack|damage|save|saving throw|skill|proficiency|initiative|armor class|hit points|death|feature|trait|action|bonus action|reaction|unarmed|monk|ki|martial arts|thieves|tools|altruism|lawfulness|cooperation|honor)\b/.test(t);
  }

  function splitEntryLines(text) {
    return String(text || '')
      .split(/[\n;]+|(?<=\))\s*,\s*/)
      .map(s => s.trim())
      .filter(Boolean)
      .slice(0, 80);
  }

  function alignmentPhase(score) {
    const n = Number(score);
    if (!Number.isFinite(n)) return '';
    if (n < 0 || n > 3000) return 'outside 0–3000 range';
    if (n === 1500) return 'Neutral center';
    if (n <= 999) return 'Extreme negative';
    if (n <= 1499) return 'Skewed negative';
    if (n <= 1999) return 'Skewed positive';
    return 'Extreme positive';
  }

  function bestOf(records, prop = 'modifier') {
    const clean = records.filter(r => r && Number.isFinite(Number(r[prop])));
    if (!clean.length) return null;
    return clean.slice().sort((a, b) => Number(b[prop]) - Number(a[prop]))[0];
  }


  const DICE_TRAY_SUPPORTED_SIDES = new Set([4, 6, 8, 9, 10, 12, 20]);

  class BelavadosDiceTray {
    constructor(root, config = {}) {
      this.root = root;
      this.config = config;
      this.result = document.getElementById('result');
      this.input = document.getElementById('textInput');
      this.queue = Promise.resolve();
      this.setResult('Chat bridge ready. Rolls will use the 3D dice tray above.');
    }

    setResult(html) {
      const trayResult = document.getElementById('result');
      if (trayResult) trayResult.innerHTML = html;
      const note = this.root.querySelector('.belavados-chatbot-tray-note');
      if (note) note.innerHTML = html;
    }

    ensureReady() {
      if (window.belavadosDice && typeof window.belavadosDice.rollTrayNotation === 'function' &&
          (typeof window.belavadosDice.isReady !== 'function' || window.belavadosDice.isReady())) return true;
      this.setResult('Dice tray is still loading or WebGL is unavailable. Reload after the tray finishes loading, or enable WebGL/hardware acceleration.');
      return false;
    }

    rollExpression(expr) {
      this.queue = this.queue.catch(() => {}).then(() => this.rollNow(expr));
      return this.queue;
    }

    async rollNow(expr) {
      if (!this.ensureReady()) throw new Error('The character sheet dice tray is not ready yet.');
      const plan = this.planRoll(expr);
      if (this.input) this.input.value = plan.originalExpression;
      this.setResult(`Rolling <b>${esc(plan.originalExpression)}</b> in the 3D tray...`);
      const notation = await window.belavadosDice.rollTrayNotation(plan.trayNotation, plan.originalExpression);
      const roll = this.buildRollFromTray(plan, notation);
      this.setResult(`${esc(plan.originalExpression)} → <b>${esc(roll.total)}</b>`);
      return roll;
    }

    planRoll(expr) {
      const originalExpression = String(expr || '').replace(/\s+/g, '').toLowerCase();
      const tokens = originalExpression.match(/[+-]?[^+-]+/g) || [];
      if (!tokens.length) throw new Error('Empty dice expression.');
      const physicalDice = [];
      const parts = [];
      let physicalCount = 0;
      for (const token of tokens) {
        const sign = token.startsWith('-') ? -1 : 1;
        const body = token.replace(/^[+-]/, '');
        if (/^\d+$/.test(body)) {
          const total = Number(body) * sign;
          parts.push({ kind: 'modifier', text: signed(total), total });
          continue;
        }
        const m = body.match(/^(\d*)d(%|\d+)((kh|kl|dh|dl)(\d+))?$/i);
        if (!m) throw new Error(`The animated dice tray does not support “${token}”.`);
        const count = clamp(Number(m[1] || 1), 1, Number(this.config.diceLimit || 100));
        const rawSides = m[2].toLowerCase();
        const sides = rawSides === '%' ? 100 : Number(rawSides);
        const keepDrop = m[4] || '';
        const keepDropCount = m[5] ? clamp(Number(m[5]), 1, count) : null;
        const start = physicalDice.length;
        if (sides === 100) {
          for (let i = 0; i < count; i++) {
            physicalDice.push('d100', 'd9');
            physicalCount += 2;
          }
          parts.push({ kind: 'dice', token, sign, count, sides, keepDrop, keepDropCount, start, physicalCount: count * 2, percentile: true });
        } else {
          if (!DICE_TRAY_SUPPORTED_SIDES.has(sides)) throw new Error(`The attached tray supports d4, d6, d8, d10, d12, d20, and percentile d100. It cannot animate d${sides}.`);
          for (let i = 0; i < count; i++) {
            physicalDice.push(`d${sides}`);
            physicalCount += 1;
          }
          parts.push({ kind: 'dice', token, sign, count, sides, keepDrop, keepDropCount, start, physicalCount: count, percentile: false });
        }
      }
      const trayLimit = Number(this.config.diceTrayLimit || 20);
      if (!physicalDice.length) throw new Error('Add at least one die, such as 1d20.');
      if (physicalCount > trayLimit) throw new Error(`The animated tray is limited to ${trayLimit} physical dice at once.`);
      const trayNotation = physicalDice.map(type => `1${type}`).join('+');
      return { originalExpression, trayNotation, parts };
    }

    buildRollFromTray(plan, notation) {
      const trayResults = (notation?.result || []).map(Number);
      const parts = [];
      let total = 0;
      for (const planned of plan.parts) {
        if (planned.kind === 'modifier') {
          parts.push({ kind: 'modifier', text: planned.text, total: planned.total });
          total += planned.total;
          continue;
        }
        let rolls = [];
        let trayRolls = [];
        if (planned.percentile) {
          let cursor = planned.start;
          for (let i = 0; i < planned.count; i++) {
            const tensRaw = Number(trayResults[cursor++] || 0);
            const ones = Number(trayResults[cursor++] || 0);
            const tens = tensRaw * 10;
            const percentile = (tens + ones) === 0 ? 100 : tens + ones;
            rolls.push(percentile);
            trayRolls.push(`${String(tens).padStart(2, '0')}+${ones}→${percentile}`);
          }
        } else {
          rolls = trayResults.slice(planned.start, planned.start + planned.count);
        }
        const included = rolls.map(() => true);
        if (planned.keepDrop && planned.keepDropCount != null) {
          const ranked = rolls.map((value, index) => ({ value, index })).sort((a, b) => a.value - b.value);
          let selected;
          if (planned.keepDrop === 'kh') selected = ranked.slice(-planned.keepDropCount).map(r => r.index);
          if (planned.keepDrop === 'kl') selected = ranked.slice(0, planned.keepDropCount).map(r => r.index);
          if (planned.keepDrop === 'dh') selected = ranked.slice(planned.keepDropCount).map(r => r.index);
          if (planned.keepDrop === 'dl') selected = ranked.slice(0, planned.count - planned.keepDropCount).map(r => r.index);
          const allowed = new Set(selected || rolls.map((_, i) => i));
          for (let i = 0; i < included.length; i++) included[i] = allowed.has(i);
        }
        const subtotal = rolls.reduce((sum, roll, i) => sum + (included[i] ? roll : 0), 0) * planned.sign;
        total += subtotal;
        parts.push({
          kind: 'dice', token: planned.token, sign: planned.sign, count: planned.count, sides: planned.sides,
          keepDrop: planned.keepDrop, keepDropCount: planned.keepDropCount, rolls, trayRolls, included, total: subtotal
        });
      }
      return { expression: plan.originalExpression, total, parts, trayNotation: plan.trayNotation, trayResultString: notation?.resultString || '' };
    }
  }

  class BelavadosChatbot {
    constructor(root) {
      this.root = root;
      this.config = mergeConfig(root);
      this.log = root.querySelector('[data-chat-log]');
      this.status = root.querySelector('[data-chat-status]');
      this.form = root.querySelector('[data-chat-form]');
      this.input = root.querySelector('[data-chat-input]');
      this.scanButton = root.querySelector('[data-scan-button]');
      this.clearButton = root.querySelector('[data-clear-button]');
      this.diceTray = new BelavadosDiceTray(root, this.config);
      this.records = [];
      this.index = this.emptyIndex();
      this.lastScan = null;
      this.wire();
      this.say(`Ready. Type dice like <span class="belavados-chatbot-pill">1d20+4</span>; every roll uses the 3D dice tray above. Ask for sheet rolls like <span class="belavados-chatbot-pill">roll perception</span>, <span class="belavados-chatbot-pill">spell attack</span>, <span class="belavados-chatbot-pill">disarm trap</span>, or <span class="belavados-chatbot-pill">death save</span>.`, 'bot');
      this.scanCharacterSheet({ silent: true });
    }

    emptyIndex() {
      return {
        abilities: {}, skills: {}, saves: {}, tools: {}, attacks: [], spells: [], features: [],
        common: {}, alignment: {}, death: { successes: null, failures: null }, sourceCounts: {}
      };
    }

    wire() {
      this.form?.addEventListener('submit', event => {
        event.preventDefault();
        const message = (this.input?.value || '').trim();
        if (!message) return;
        this.input.value = '';
        this.handleMessage(message).catch(err => this.say(`Dice tray error: ${esc(err.message || err)}`, 'bot'));
      });
      this.input?.addEventListener('keydown', event => {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          this.form?.requestSubmit();
        }
      });
      this.scanButton?.addEventListener('click', () => this.scanCharacterSheet({ silent: false }));
      this.clearButton?.addEventListener('click', () => {
        if (this.log) this.log.innerHTML = '';
        this.say('Chat cleared. Sheet index kept in memory until the next scan.', 'bot');
      });
      if (this.config.autoScanOnInput) {
        let scanTimer = 0;
        const rescan = (delay) => {
          clearTimeout(scanTimer);
          scanTimer = setTimeout(() => this.scanCharacterSheet({ silent: true }), delay);
        };
        document.addEventListener('input', event => { if (!this.root.contains(event.target)) rescan(180); }, true);
        document.addEventListener('change', event => { if (!this.root.contains(event.target)) rescan(80); }, true);
      }
    }

    setStatus(text) { if (this.status) this.status.textContent = text; }

    say(html, who = 'bot') {
      if (!this.log) return;
      const node = document.createElement('div');
      node.className = `belavados-chatbot-msg ${who}`;
      node.innerHTML = `<span class="meta">${who === 'user' ? 'You' : esc(this.config.botName)}</span>${html}`;
      this.log.appendChild(node);
      this.log.scrollTop = this.log.scrollHeight;
    }

    scanCharacterSheet(options = {}) {
      const silent = Boolean(options.silent);
      const records = [];
      const nodes = Array.from(document.querySelectorAll(this.config.scanSelector || DEFAULT_CONFIG.scanSelector));
      for (const el of nodes) {
        if (!(el instanceof Element)) continue;
        if (this.root.contains(el)) continue;
        if (el.closest(this.config.excludeSelector || DEFAULT_CONFIG.excludeSelector)) continue;
        const value = valueForElement(el);
        if (!String(value || '').trim()) continue;
        const label = labelForElement(el);
        records.push(this.makeRecord(label, value, 'field', el));
      }

      if (this.config.includeStaticCharacterText) {
        const textNodes = Array.from(document.querySelectorAll(this.config.scanTextSelector || DEFAULT_CONFIG.scanTextSelector));
        for (const el of textNodes) {
          if (!(el instanceof Element)) continue;
          if (this.root.contains(el)) continue;
          if (el.closest(this.config.excludeSelector || DEFAULT_CONFIG.excludeSelector)) continue;
          const value = (el.textContent || '').trim();
          if (!looksRelevantStaticText(value)) continue;
          const label = labelForElement(el);
          records.push(this.makeRecord(label, value, 'static-text', el));
        }
      }

      this.records = records.filter((r, i, arr) => arr.findIndex(x => x.label === r.label && x.value === r.value && x.locator === r.locator) === i);
      this.index = this.buildIndex(this.records);
      const numeric = this.records.filter(r => r.number != null).length;
      const attackCount = this.index.attacks.length;
      const spellCount = this.index.spells.length;
      const skillCount = Object.keys(this.index.skills).length;
      const alignmentCount = Object.keys(this.index.alignment).length;
      this.lastScan = { total: this.records.length, numeric, attackCount, spellCount, skillCount, alignmentCount, time: new Date() };
      this.setStatus(`Sheet index: ${this.records.length} filled record(s), ${numeric} numeric, ${skillCount} skill(s), ${attackCount} attack/damage entr${attackCount === 1 ? 'y' : 'ies'}, ${spellCount} spell entr${spellCount === 1 ? 'y' : 'ies'}. Last scan ${this.lastScan.time.toLocaleTimeString()}.`);
      if (!silent) {
        const sample = this.records.slice(0, 10).map(r => `<span class="belavados-chatbot-pill">${esc(r.label)}: ${esc(String(r.value).slice(0, 32))}</span>`).join(' ');
        const extras = alignmentCount ? ` Alignment axes found: ${Object.keys(this.index.alignment).map(a => `<span class="belavados-chatbot-pill">${esc(a)}</span>`).join(' ')}` : '';
        this.say(`Scanned ${this.records.length} filled record(s). ${sample || 'No filled character fields found yet.'}${extras}`, 'bot');
      }
      return this.records;
    }

    makeRecord(label, value, type, el) {
      return {
        label: String(label || '').trim(), value: String(value || '').trim(), type,
        labelNorm: normalize(label), labelCompact: compact(label),
        valueNorm: normalize(value), valueCompact: compact(value),
        textNorm: normalize(`${label} ${value}`), textCompact: compact(`${label} ${value}`),
        number: parseNumber(value), signedNumber: parseSignedNumber(value), locator: locatorFor(el)
      };
    }

    buildIndex(records) {
      const index = this.emptyIndex();
      for (const record of records) {
        index.sourceCounts[record.type] = (index.sourceCounts[record.type] || 0) + 1;
        this.indexCommon(record, index);
        this.indexAbilities(record, index);
        this.indexSkills(record, index);
        this.indexSaves(record, index);
        this.indexTools(record, index);
        this.indexAlignment(record, index);
        this.indexEntries(record, index);
      }
      this.indexStructuredSheetRows(records, index);
      return index;
    }

    indexStructuredSheetRows(records, index) {
      this.indexStructuredWeapons(records, index);
      this.indexStructuredSpells(records, index);
    }

    indexStructuredWeapons(records, index) {
      const rows = new Map();
      for (const record of records) {
        const match = record.labelNorm.match(/^weapon\s+(\d+)\s+(name|attack bonus|damage type|notes)$/);
        if (!match) continue;
        const row = rows.get(match[1]) || {};
        row[match[2]] = record;
        rows.set(match[1], row);
      }
      for (const [num, row] of rows) {
        const name = row.name?.value?.trim() || `Weapon ${num}`;
        const attackBonus = row['attack bonus'] ? (row['attack bonus'].signedNumber ?? row['attack bonus'].number) : null;
        const combined = [row['damage type']?.value, row.notes?.value].filter(Boolean).join(' | ');
        const damage = this.extractDiceExpressions(combined).find(expr => !/^1d20/i.test(expr)) || '';
        if (!row.name && attackBonus == null && !damage) continue;
        const sourceLine = [name, attackBonus != null ? `attack ${signed(attackBonus)}` : '', damage ? `damage ${damage}` : '', combined.replace(damage, '').trim()].filter(Boolean).join(' ');
        if (!index.attacks.some(a => compact(a.name) === compact(name) && a.attackBonus === attackBonus && a.damage === damage)) {
          index.attacks.push({ name, type: 'weapon', attackBonus, damage, label: `weapon ${num}`, sourceValue: sourceLine, sourceLine });
        }
      }
    }

    indexStructuredSpells(records, index) {
      const rows = new Map();
      for (const record of records) {
        const match = record.labelNorm.match(/^(cantrips|\d+(?:st|nd|rd|th) level spells)\s+(\d+)\s+(name|description|how to roll)$/);
        if (!match) continue;
        const key = `${match[1]} ${match[2]}`;
        const row = rows.get(key) || { level: match[1], number: match[2] };
        row[match[3]] = record;
        rows.set(key, row);
      }
      for (const [key, row] of rows) {
        const name = row.name?.value?.trim();
        const rollText = [row['how to roll']?.value, row.description?.value].filter(Boolean).join(' | ');
        if (!name || !rollText) continue;
        const attackMatch = rollText.match(/(?:spell attack|attack|to hit)[^+-]{0,30}([-+]\s*\d+)/i) || rollText.match(/([-+]\s*\d+)\s*(?:spell attack|attack|to hit)/i);
        const dcMatch = rollText.match(/(?:save dc|dc)\s*(\d+)/i);
        const damage = this.extractDiceExpressions(rollText).find(expr => !/^1d20/i.test(expr)) || '';
        const spell = { name, attackBonus: attackMatch ? Number(attackMatch[1].replace(/\s+/g, '')) : null, saveDc: dcMatch ? Number(dcMatch[1]) : null, damage, label: key, sourceValue: rollText };
        if (!index.spells.some(s => compact(s.name) === compact(name))) index.spells.push(spell);
        if ((spell.attackBonus != null || damage) && !index.attacks.some(a => compact(a.name) === compact(name))) {
          index.attacks.push({ name, type: 'spell', attackBonus: spell.attackBonus, damage, label: key, sourceValue: rollText, sourceLine: `${name} ${rollText}` });
        }
      }
    }

    indexCommon(record, index) {
      const label = record.labelNorm;
      const text = record.textNorm;
      const setCommon = (key, modifier, sourceRecord = record) => {
        if (modifier == null) return;
        index.common[key] = { modifier, label: sourceRecord.label, sourceValue: sourceRecord.value };
      };
      if (/\b(proficiency bonus|prof bonus|pb)\b/.test(text)) setCommon('proficiency bonus', record.signedNumber ?? record.number);
      if (/\binitiative\b/.test(label) || /\binitiative\b/.test(text)) setCommon('initiative', record.signedNumber ?? record.number);
      if (/\bspell attack\b|\bspell attack bonus\b/.test(text)) setCommon('spell attack', record.signedNumber ?? record.number);
      if (/\bspell save dc\b|\bsave dc\b/.test(text)) setCommon('spell save dc', record.number);
      if (/\bpassive perception\b/.test(text)) setCommon('passive perception', record.number);
      if (/\b(armor class|\bac\b)\b/.test(label)) setCommon('armor class', record.number);
      if (/\b(hit points|hp|current hp|max hp)\b/.test(label)) setCommon('hit points', record.number);
      if (/\bdeath\b/.test(text) && /\bsuccess/.test(text)) index.death.successes = record.number;
      if (/\bdeath\b/.test(text) && /\bfailure/.test(text)) index.death.failures = record.number;
    }

    indexAbilities(record, index) {
      for (const ability of ABILITIES) {
        const aliases = ability.aliases;
        const labelHas = aliases.some(a => hasWord(record.labelNorm, a));
        if (!labelHas) continue;
        const signed = record.signedNumber;
        const raw = record.number;
        if (raw == null && signed == null) continue;
        const isModField = /\b(mod|modifier|bonus|save|saving throw)\b/.test(record.labelNorm) || signed != null;
        const mod = isModField ? (signed ?? raw) : abilityModFromScore(record.value);
        const score = !isModField && raw >= 1 && raw <= 30 ? raw : null;
        const current = index.abilities[ability.name] || {};
        index.abilities[ability.name] = {
          score: score ?? current.score ?? null,
          modifier: mod ?? current.modifier ?? null,
          label: record.label,
          sourceValue: record.value
        };
      }
    }

    indexSkills(record, index) {
      for (const skill of SKILL_DATA) {
        if (!skill.aliases.some(a => hasWord(record.labelNorm, a) || hasWord(record.textNorm, a))) continue;
        const signed = record.signedNumber;
        const raw = record.number;
        const checked = /\bchecked\b/.test(record.valueNorm);
        const isProf = /\b(proficient|proficiency|prof|trained)\b/.test(record.labelNorm + ' ' + record.valueNorm) || checked;
        const isExpertise = /\b(expertise|expert)\b/.test(record.labelNorm + ' ' + record.valueNorm);
        const current = index.skills[skill.name] || { ability: skill.ability };
        let modifier = current.modifier ?? null;
        if (signed != null) modifier = signed;
        else if (raw != null && !checked && /\b(mod|modifier|bonus|total)\b/.test(record.labelNorm + ' ' + record.valueNorm)) modifier = raw;
        index.skills[skill.name] = {
          ability: skill.ability,
          modifier,
          proficient: current.proficient || isProf || false,
          expertise: current.expertise || isExpertise || false,
          label: record.label,
          sourceValue: record.value
        };
      }
    }

    indexSaves(record, index) {
      if (!/\b(save|saving throw|saving throws)\b/.test(record.labelNorm + ' ' + record.valueNorm)) return;
      for (const ability of ABILITIES) {
        if (!ability.aliases.some(a => hasWord(record.textNorm, a))) continue;
        const mod = record.signedNumber ?? record.number;
        if (mod == null) continue;
        index.saves[ability.name] = { modifier: mod, label: record.label, sourceValue: record.value };
      }
    }

    indexTools(record, index) {
      for (const tool of TOOL_ALIASES) {
        if (!tool.aliases.some(a => hasWord(record.textNorm, a))) continue;
        const mod = record.signedNumber ?? (/\bchecked\b/.test(record.valueNorm) ? null : record.number);
        const current = index.tools[tool.name] || {};
        index.tools[tool.name] = {
          modifier: mod ?? current.modifier ?? null,
          proficient: current.proficient || /\b(checked|proficient|proficiency|trained)\b/.test(record.valueNorm + ' ' + record.labelNorm),
          label: record.label,
          sourceValue: record.value
        };
      }
    }

    indexAlignment(record, index) {
      for (const axis of ALIGNMENT_AXES) {
        if (!hasWord(record.labelNorm, axis.name) && !hasWord(record.textNorm, axis.name)) continue;
        const n = record.number;
        if (n == null) continue;
        index.alignment[axis.name] = { score: clamp(n, 0, 3000), phase: alignmentPhase(n), label: record.label, sourceValue: record.value };
      }
    }

    indexEntries(record, index) {
      const relevant = /\b(spell|cantrip|weapon|attack|damage|dmg|to hit|feature|trait|action|bonus action|reaction|unarmed|monk|martial arts|ki|eldritch blast|fire bolt|ray|bolt|bow|sword|rapier|dagger|axe|mace|staff)\b/.test(record.textNorm);
      if (!relevant) return;
      for (const line of splitEntryLines(record.value)) {
        const entry = this.parseAttackEntry(line, record);
        if (entry) index.attacks.push(entry);
        const spell = this.parseSpellEntry(line, record);
        if (spell) index.spells.push(spell);
      }
      if (/\b(feature|trait|monk|ki|martial arts|flurry|unarmed)\b/.test(record.textNorm)) {
        index.features.push({ name: record.label, text: record.value, label: record.label, sourceValue: record.value });
      }
    }

    parseAttackEntry(line, record) {
      const full = `${record.label} ${line}`;
      const norm = normalize(full);
      if (!/\b(attack|to hit|hit|damage|dmg|weapon|spell|unarmed|strike|martial arts|ray|bolt|blast|bow|sword|rapier|dagger|axe|mace|staff)\b/.test(norm)) return null;
      const bonusMatch = line.match(/(?:attack|to hit|hit)[^+-]{0,30}([-+]\s*\d+)/i) || line.match(/([-+]\s*\d+)\s*(?:to hit|attack|hit)/i) || record.value.match(new RegExp(`${this.escapeRegExp(line.slice(0, 20))}[\\s\\S]{0,80}(?:attack|to hit|hit)[^+-]{0,30}([-+]\\s*\\d+)`, 'i'));
      const bonus = bonusMatch ? Number(bonusMatch[1].replace(/\s+/g, '')) : null;
      const dice = this.extractDiceExpressions(line).filter(expr => !/^1d20/i.test(expr));
      const damage = dice[0] || '';
      let name = line.split(/:|\-|—|,/)[0].trim();
      name = name.replace(/\b(attack|to hit|hit|damage|dmg)\b.*$/i, '').trim();
      if (!name || name.length > 80) name = record.label;
      let type = 'ability';
      if (/\b(spell|cantrip|cast)\b/.test(norm)) type = 'spell';
      else if (/\b(weapon|bow|sword|rapier|dagger|axe|mace|staff|crossbow|spear|javelin|club|hammer)\b/.test(norm)) type = 'weapon';
      if (/\b(unarmed|monk|martial arts|flurry)\b/.test(norm)) type = 'ability';
      if (bonus == null && !damage) return null;
      return { name, type, attackBonus: bonus, damage, label: record.label, sourceValue: record.value, sourceLine: line };
    }

    parseSpellEntry(line, record) {
      const full = `${record.label} ${line}`;
      if (!/\b(spell|cantrip|magic|cast|prepared|known)\b/i.test(full) && !/\b(cure wounds|healing word|detect magic|fire bolt|eldritch blast|ray of frost|sacred flame|guidance|bless)\b/i.test(line)) return null;
      let name = line.split(/:|\-|—|,/)[0].trim();
      if (!name || name.length > 80) name = line.trim().slice(0, 80);
      const attack = line.match(/(?:spell attack|attack|to hit)[^+-]{0,30}([-+]\s*\d+)/i);
      const dc = line.match(/(?:save dc|dc)\s*(\d+)/i);
      const dice = this.extractDiceExpressions(line).filter(expr => !/^1d20/i.test(expr));
      return { name, attackBonus: attack ? Number(attack[1].replace(/\s+/g, '')) : null, saveDc: dc ? Number(dc[1]) : null, damage: dice[0] || '', label: record.label, sourceValue: record.value };
    }

    escapeRegExp(value) { return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

    async handleMessage(message) {
      this.say(esc(message), 'user');
      this.scanCharacterSheet({ silent: true });
      const lower = normalize(message);
      if (/^(scan|rescan|scan sheet|scan character sheet|refresh sheet)$/i.test(message.trim())) {
        this.scanCharacterSheet({ silent: false });
        return;
      }
      if (/^(help|commands|what can you do)$/i.test(message.trim())) {
        this.say(this.helpHtml(), 'bot');
        return;
      }
      if (/\b(alignment scan|show alignment|alignment status|belavados alignment)\b/.test(lower)) {
        this.say(this.alignmentHtml(), 'bot');
        return;
      }
      if (/\b(spell save dc|save dc)\b/.test(lower) && !/\broll\b/.test(lower)) {
        this.say(this.lookupHtml('spell save dc'), 'bot');
        return;
      }
      if (/\b(search|find|lookup|look up|show)\b/.test(lower) && !/\broll\b/.test(lower)) {
        const matches = this.searchRecords(message).slice(0, 10);
        this.say(matches.length ? this.matchesHtml(matches) : 'I did not find matching filled character-sheet fields.', 'bot');
        return;
      }
      const inferred = this.inferActionRoll(message);
      if (inferred) {
        await this.respondWithRoll(inferred, message);
        return;
      }
      const expressions = this.extractDiceExpressions(message);
      if (expressions.length) {
        const rendered = [];
        for (const expr of expressions) rendered.push(this.formatRoll(expr, await this.rollExpression(expr)));
        this.say(rendered.join(''), 'bot');
        return;
      }
      const matches = this.searchRecords(message).slice(0, 8);
      if (matches.length) {
        this.say(this.matchesHtml(matches), 'bot');
        return;
      }
      this.say('I could not find a dice expression or matching sheet value. Try <span class="belavados-chatbot-pill">1d20+4</span>, <span class="belavados-chatbot-pill">roll perception</span>, <span class="belavados-chatbot-pill">spell attack</span>, <span class="belavados-chatbot-pill">disarm trap</span>, or click <span class="belavados-chatbot-pill">Scan sheet</span>.', 'bot');
    }

    helpHtml() {
      return 'Try <span class="belavados-chatbot-pill">1d20+4</span>, <span class="belavados-chatbot-pill">2d6+3</span>, <span class="belavados-chatbot-pill">roll initiative</span>, <span class="belavados-chatbot-pill">roll death save</span>, <span class="belavados-chatbot-pill">roll perception with advantage</span>, <span class="belavados-chatbot-pill">disarm trap</span>, <span class="belavados-chatbot-pill">rapier attack</span>, <span class="belavados-chatbot-pill">rapier damage</span>, <span class="belavados-chatbot-pill">spell attack</span>, <span class="belavados-chatbot-pill">monk unarmed strike</span>, <span class="belavados-chatbot-pill">concentration save</span>, <span class="belavados-chatbot-pill">search detect magic</span>, <span class="belavados-chatbot-pill">alignment scan</span>, or <span class="belavados-chatbot-pill">scan sheet</span>.';
    }

    alignmentHtml() {
      const axes = Object.entries(this.index.alignment);
      if (!axes.length) return 'I did not find Belavadös alignment axis fields yet. Add fields labeled Altruism, Lawfulness, Cooperation, and Honor, then scan again.';
      return `<div>Belavadös alignment axis scan:</div>${axes.map(([axis, data]) => `<div><span class="belavados-chatbot-pill">${esc(axis)} ${esc(data.score)} — ${esc(data.phase)}</span></div>`).join('')}`;
    }

    lookupHtml(key) {
      const found = this.findModifier(key);
      if (!found) return `I could not find ${esc(key)} on the scanned sheet.`;
      return `<span class="belavados-chatbot-pill">${esc(found.label)}: ${esc(found.sourceValue)}</span>`;
    }

    matchesHtml(matches) {
      return `Found matching sheet field(s): ${matches.map(r => `<span class="belavados-chatbot-pill">${esc(r.label)}: ${esc(String(r.value).slice(0, 72))}</span>`).join(' ')}`;
    }

    async respondWithRoll(inferred, message) {
      const roll = await this.rollExpression(inferred.expression);
      const parts = [esc(inferred.reason || '') + this.formatRoll(inferred.expression, roll, inferred.context || {})];
      const notes = [];
      if (inferred.note) notes.push(inferred.note);
      const nat = this.naturalD20Result(roll);
      if (inferred.context?.kind === 'death') notes.push(this.deathSaveInterpretation(roll));
      if (inferred.context?.kind === 'attack' && nat != null) {
        if (nat === 20) notes.push('Attack note: natural 20 normally hits and is a Critical Hit.');
        if (nat === 1) notes.push('Attack note: natural 1 normally misses.');
      }
      const align = this.alignmentHint(message);
      if (align) notes.push(align);
      if (notes.length) parts.push(`<div>${notes.map(esc).join('<br>')}</div>`);
      this.say(parts.join(''), 'bot');
    }

    inferActionRoll(message) {
      const lower = normalize(message);
      const mode = /\b(disadvantage|disadv|dis)\b/.test(lower) ? 'disadvantage' : /\b(advantage|adv)\b/.test(lower) ? 'advantage' : '';
      const d20 = (mod = 0) => this.d20Expression(mod, mode);

      if (/\bdeath\s+sav(e|ing throw|es)|death saving throw\b/.test(lower)) {
        return { expression: d20(0), reason: 'Rolling an unmodified death saving throw. ', context: { kind: 'death' }, note: this.deathStateNote() };
      }

      if (/\binitiative\b/.test(lower)) {
        const found = this.findModifier('initiative') || this.findAbilityModifier('dexterity');
        if (found) return { expression: d20(found.modifier), reason: `Using ${found.label ? `sheet field “${found.label}” (${found.sourceValue})` : 'Dexterity modifier'} for initiative. `, context: { kind: 'check' } };
      }

      if (/\b(concentration|maintain spell|hold concentration)\b/.test(lower)) {
        const found = this.findModifier('constitution save') || this.findAbilityModifier('constitution');
        if (found) return { expression: d20(found.modifier), reason: `Using ${found.label ? `sheet field “${found.label}” (${found.sourceValue})` : 'Constitution modifier'} for concentration. `, context: { kind: 'save' } };
      }

      const task = this.taskLookup(lower);
      if (task) return this.inferTaskRoll(task, lower, mode);

      const saveAbility = ABILITIES.find(a => new RegExp(`\\b(${a.name}|${a.short})\\b`).test(lower) && /\b(save|saving throw)\b/.test(lower));
      if (saveAbility) {
        const found = this.findModifier(`${saveAbility.name} save`) || this.findAbilityModifier(saveAbility.name);
        if (found) return { expression: d20(found.modifier), reason: `Using ${found.label ? `sheet field “${found.label}” (${found.sourceValue})` : `${saveAbility.name} modifier`} for ${saveAbility.name} save. `, context: { kind: 'save' } };
      }

      const abilityCheck = ABILITIES.find(a => new RegExp(`\\b(${a.name}|${a.short})\\b`).test(lower) && /\b(check|roll|test)\b/.test(lower));
      if (abilityCheck) {
        const found = this.findAbilityModifier(abilityCheck.name);
        if (found) return { expression: d20(found.modifier), reason: `Using ${found.label ? `sheet field “${found.label}” (${found.sourceValue})` : `${abilityCheck.name} modifier`} for ${abilityCheck.name} check. `, context: { kind: 'check' } };
      }

      if (/\b(attack|damage|hit|shoot|strike|cast|use)\b/.test(lower)) {
        const item = this.findAttackForMessage(lower);
        if (item) return item;
        if (/\b(spell attack|spell hit|ranged spell|melee spell)\b/.test(lower)) {
          const found = this.findModifier('spell attack') || this.computeSpellAttack();
          if (found) return { expression: d20(found.modifier), reason: `Using ${found.label ? `sheet field “${found.label}” (${found.sourceValue})` : 'computed spell attack bonus'} for spell attack. `, context: { kind: 'attack' } };
        }
        if (/\b(unarmed|monk|martial arts|flurry|ki strike|ability attack)\b/.test(lower)) {
          const found = this.findUnarmedOrMonkAttack();
          if (found) return { expression: d20(found.modifier), reason: found.reason, context: { kind: 'attack' } };
        }
      }

      const skill = this.findSkillMention(lower);
      if (skill && /\b(roll|check|do|make|try|attempt|scan)\b/.test(lower)) {
        const found = this.findSkillModifier(skill.name);
        if (found) return { expression: d20(found.modifier), reason: `Using ${found.label ? `sheet field “${found.label}” (${found.sourceValue})` : `${skill.ability} modifier`} for ${skill.name}. `, context: { kind: 'check' } };
      }

      return null;
    }

    taskLookup(lower) {
      const tasks = [
        { patterns: [/\b(disarm|disable|defuse)\b.*\btrap\b/, /\btrap\b.*\b(disarm|disable|defuse)\b/], keys: ["thieves' tools", 'sleight of hand', 'dexterity'], label: 'disarming a trap', kind: 'check', note: "D&D note: Thieves’ Tools commonly apply to disarming traps or opening locks when proficient." },
        { patterns: [/\b(pick|open)\b.*\block\b/, /\block\b.*\b(pick|open)\b/], keys: ["thieves' tools", 'sleight of hand', 'dexterity'], label: 'opening a lock', kind: 'check', note: "D&D note: Thieves’ Tools commonly apply to opening locks when proficient." },
        { patterns: [/\bstabiliz(e|e a creature|ing|ation)\b/, /\bfirst aid\b/], keys: ['medicine', 'wisdom'], label: 'stabilizing a creature', kind: 'check', note: 'D&D note: stabilizing a creature at 0 HP normally uses a DC 10 Wisdom (Medicine) check.' },
        { patterns: [/\bgrapple\b/, /\bshove\b/], keys: ['athletics', 'strength'], label: 'grapple or shove', kind: 'check' },
        { patterns: [/\bescape\b.*\bgrapple\b/, /\bescape\b.*\brestrain/], keys: ['acrobatics', 'athletics', 'dexterity', 'strength'], label: 'escaping a grapple/restraint', kind: 'check' },
        { patterns: [/\bhide\b/, /\bsneak\b/], keys: ['stealth', 'dexterity'], label: 'hiding or sneaking', kind: 'check' },
        { patterns: [/\bdetect magic\b/, /\bidentify magic\b/], keys: ['arcana', 'intelligence'], label: 'magic knowledge', kind: 'check' },
        { patterns: [/\bperception check\b/, /\blook for\b/, /\bsearch room\b/, /\bspot\b/, /\blisten\b/], keys: ['perception', 'wisdom'], label: 'perception', kind: 'check' }
      ];
      return tasks.find(t => t.patterns.some(p => p.test(lower))) || null;
    }

    inferTaskRoll(task, lower, mode) {
      const candidates = task.keys.map(key => {
        if (SKILL_NAMES.includes(key)) return this.findSkillModifier(key);
        if (ABILITY_NAMES.includes(key)) return this.findAbilityModifier(key);
        return this.findToolModifier(key);
      }).filter(Boolean);
      const found = bestOf(candidates);
      if (!found) return null;
      return { expression: this.d20Expression(found.modifier, mode), reason: `Using ${found.label ? `sheet field “${found.label}” (${found.sourceValue})` : found.name || task.label} for ${task.label}. `, note: task.note || found.note || '', context: { kind: task.kind || 'check' } };
    }

    findSkillMention(lower) {
      return SKILL_DATA.find(skill => skill.aliases.some(alias => hasWord(lower, alias)));
    }

    findSkillModifier(name) {
      const skill = SKILL_DATA.find(s => s.name === name);
      const direct = this.index.skills[name];
      if (direct?.modifier != null) return { modifier: direct.modifier, label: direct.label, sourceValue: direct.sourceValue };
      const ability = this.findAbilityModifier(skill?.ability);
      if (!ability) return null;
      let mod = ability.modifier;
      const pb = this.getProficiencyBonus();
      if (direct?.expertise && pb != null) mod += pb * 2;
      else if (direct?.proficient && pb != null) mod += pb;
      return { modifier: mod, label: direct?.label || ability.label || `${skill?.ability || 'ability'} modifier`, sourceValue: direct?.sourceValue || ability.sourceValue || signed(ability.modifier), note: direct?.proficient && pb == null ? 'Skill proficiency was detected, but no proficiency bonus was found on the sheet.' : '' };
    }

    findAbilityModifier(name) {
      if (!name) return null;
      const ability = this.index.abilities[name];
      if (ability?.modifier != null) return { modifier: ability.modifier, label: ability.label, sourceValue: ability.sourceValue };
      const found = this.findModifier(name);
      return found || null;
    }

    findToolModifier(name) {
      const tool = this.index.tools[name];
      if (tool?.modifier != null) return { modifier: tool.modifier, label: tool.label, sourceValue: tool.sourceValue };
      const dex = this.findAbilityModifier('dexterity');
      const pb = this.getProficiencyBonus();
      if (tool?.proficient && dex && pb != null) return { modifier: dex.modifier + pb, label: tool.label, sourceValue: tool.sourceValue, note: `Computed ${name} from Dexterity plus proficiency.` };
      const found = this.findModifier(name);
      if (found) return found;
      return null;
    }

    getProficiencyBonus() {
      const found = this.index.common['proficiency bonus'];
      return found?.modifier ?? null;
    }

    computeSpellAttack() {
      const pb = this.getProficiencyBonus();
      if (pb == null) return null;
      const candidates = ['charisma', 'wisdom', 'intelligence'].map(a => this.findAbilityModifier(a)).filter(Boolean);
      const best = bestOf(candidates);
      if (!best) return null;
      return { modifier: best.modifier + pb, label: best.label, sourceValue: `${best.sourceValue} + PB ${signed(pb)}` };
    }

    findUnarmedOrMonkAttack() {
      const exact = this.index.attacks.find(a => /\b(unarmed|monk|martial arts|flurry)\b/i.test(`${a.name} ${a.sourceLine} ${a.label}`) && a.attackBonus != null);
      if (exact) return { modifier: exact.attackBonus, reason: `Using attack bonus from “${exact.name}”. ` };
      const pb = this.getProficiencyBonus() ?? 0;
      const dex = this.findAbilityModifier('dexterity');
      const str = this.findAbilityModifier('strength');
      const best = bestOf([dex, str]);
      if (!best) return null;
      return { modifier: best.modifier + pb, reason: `Computed monk/unarmed attack from the better Strength/Dexterity modifier plus proficiency found on the sheet. ` };
    }

    findAttackForMessage(lower) {
      const wantsDamage = /\b(damage|dmg)\b/.test(lower);
      const wantsSpell = /\b(spell|cantrip|cast)\b/.test(lower);
      const wantsWeapon = /\b(weapon|melee|ranged|shoot|bow|sword|rapier|dagger|axe|mace|staff)\b/.test(lower);
      const candidates = this.index.attacks.map(a => ({ item: a, score: this.scoreEntry(a, lower) }))
        .filter(x => x.score > 0 || (wantsSpell && x.item.type === 'spell') || (wantsWeapon && x.item.type === 'weapon'))
        .sort((a, b) => b.score - a.score)
        .map(x => x.item);
      const item = candidates[0];
      if (!item) return null;
      if (wantsDamage && item.damage) return { expression: item.damage, reason: `Using damage dice from “${item.name}”. `, context: { kind: 'damage' } };
      if (!wantsDamage && item.attackBonus != null) return { expression: this.d20Expression(item.attackBonus, /\b(disadvantage|disadv|dis)\b/.test(lower) ? 'disadvantage' : /\b(advantage|adv)\b/.test(lower) ? 'advantage' : ''), reason: `Using attack bonus from “${item.name}”. `, context: { kind: 'attack' } };
      if (item.damage) return { expression: item.damage, reason: `Using dice found in “${item.name}”. `, context: { kind: 'damage' } };
      return null;
    }

    scoreEntry(entry, lower) {
      const terms = lower.split(/\s+/).filter(t => t.length > 2).map(compact);
      const hay = compact(`${entry.name} ${entry.type} ${entry.sourceLine} ${entry.label}`);
      let score = 0;
      if (entry.type === 'spell' && /\bspell|cantrip|cast\b/.test(lower)) score += 2;
      if (entry.type === 'weapon' && /\bweapon|melee|ranged\b/.test(lower)) score += 2;
      for (const term of terms) if (hay.includes(term)) score += term.length > 4 ? 3 : 1;
      return score;
    }

    d20Expression(modifier = 0, mode = '') {
      const base = mode === 'advantage' ? '2d20kh1' : mode === 'disadvantage' ? '2d20kl1' : '1d20';
      return `${base}${Number(modifier) ? signed(modifier) : ''}`;
    }

    findModifier(key) {
      const keyNorm = normalize(key);
      const keyCompact = compact(key);
      const common = this.index.common[keyNorm] || this.index.common[keyCompact];
      if (common?.modifier != null) return { modifier: common.modifier, label: common.label, sourceValue: common.sourceValue };
      if (keyNorm.endsWith(' save')) {
        const ability = ABILITIES.find(a => keyNorm.includes(a.name) || keyNorm.includes(a.short));
        if (ability && this.index.saves[ability.name]) return { modifier: this.index.saves[ability.name].modifier, label: this.index.saves[ability.name].label, sourceValue: this.index.saves[ability.name].sourceValue };
      }
      const candidates = this.records.filter(r => r.labelCompact === keyCompact || r.labelNorm === keyNorm || r.labelCompact.includes(keyCompact) || keyCompact.includes(r.labelCompact) || r.valueCompact.includes(keyCompact));
      for (const record of candidates) {
        const num = record.signedNumber ?? record.number;
        if (num != null) {
          const ability = ABILITY_NAMES.includes(keyNorm) ? abilityModFromScore(record.value) : num;
          return { modifier: ability == null ? num : ability, label: record.label, sourceValue: record.value };
        }
      }
      const abilityAlias = ABILITIES.find(a => a.aliases.includes(keyNorm));
      if (abilityAlias) {
        const byShort = this.records.find(r => r.labelCompact === abilityAlias.short || r.labelNorm === abilityAlias.short);
        if (byShort) {
          const mod = abilityModFromScore(byShort.value);
          if (mod != null) return { modifier: mod, label: byShort.label, sourceValue: byShort.value };
        }
      }
      return null;
    }

    extractDiceExpressions(message) {
      const found = [];
      const text = String(message || '').toLowerCase();
      DICE_EXPRESSION_PATTERN.lastIndex = 0;
      let match;
      while ((match = DICE_EXPRESSION_PATTERN.exec(text)) !== null) {
        const expr = (match[1] || '').replace(/\s+/g, '');
        if (/d(?:%|f|\d+)/i.test(expr) && this.isValidExpression(expr)) found.push(expr);
      }
      return Array.from(new Set(found)).slice(0, 8);
    }

    isValidExpression(expr) {
      const clean = String(expr || '').replace(/\s+/g, '').toLowerCase();
      if (!clean || !/^[+\-\ddf%khld]+$/i.test(clean)) return false;
      return this.tokenize(clean).every(token => this.isValidTerm(token));
    }

    tokenize(expr) { return String(expr || '').replace(/\s+/g, '').toLowerCase().match(/[+-]?[^+-]+/g) || []; }
    isValidTerm(token) { const body = token.replace(/^[+-]/, ''); return /^\d+$/.test(body) || /^(\d*)d(%|f|\d+)((kh|kl|dh|dl)(\d+))?$/.test(body); }

    rollExpression(expr) {
      return this.diceTray.rollExpression(expr);
    }

    formatRoll(expr, roll) {
      const partHtml = roll.parts.map(part => {
        if (part.kind === 'modifier') return `<span class="belavados-chatbot-pill">${esc(part.text)}</span>`;
        const rollValues = part.trayRolls && part.trayRolls.length ? part.trayRolls : part.rolls;
        const rolls = rollValues.map((n, i) => part.included[i] ? esc(n) : `<s>${esc(n)}</s>`).join(', ');
        return `<span class="belavados-chatbot-pill">${esc(part.token)} [${rolls}] = ${esc(part.total)}</span>`;
      }).join(' ');
      return `<div class="belavados-chatbot-roll"><div><b>${esc(expr)}</b> → <b>${esc(roll.total)}</b></div><div>${partHtml}</div></div>`;
    }

    naturalD20Result(roll) {
      const d20 = roll.parts.find(p => p.kind === 'dice' && Number(p.sides) === 20 && p.rolls.length);
      if (!d20) return null;
      const kept = d20.rolls.filter((_, i) => d20.included[i]);
      return kept.length ? kept[0] : d20.rolls[0];
    }

    deathSaveInterpretation(roll) {
      const raw = this.naturalD20Result(roll);
      if (raw == null) return '';
      if (raw === 20) return 'Death save note: natural 20 normally restores 1 HP.';
      if (raw === 1) return 'Death save note: natural 1 normally counts as two failures.';
      return raw >= 10 ? 'Death save note: 10+ is normally a success.' : 'Death save note: below 10 is normally a failure.';
    }

    deathStateNote() {
      const s = this.index.death.successes;
      const f = this.index.death.failures;
      const parts = [];
      if (s != null) parts.push(`${s} death save success${s === 1 ? '' : 'es'} on sheet`);
      if (f != null) parts.push(`${f} death save failure${f === 1 ? '' : 's'} on sheet`);
      return parts.length ? `Current tracker scan: ${parts.join(', ')}.` : '';
    }

    alignmentHint(message) {
      const lower = normalize(message);
      const found = ALIGNMENT_HINTS.find(h => h.pattern.test(lower));
      return found ? found.text : '';
    }

    searchRecords(query) {
      const q = normalize(query).replace(/\b(search|find|look up|lookup|show me|show|cast|use|roll|check|saving throw|save|sheet|for|the|a|an|my|with|advantage|disadvantage)\b/g, ' ').replace(/\s+/g, ' ').trim();
      const qCompact = compact(q);
      if (!qCompact) return [];
      const terms = q.split(/\s+/).map(compact).filter(t => t.length > 1);
      return this.records.map(record => {
        let score = 0;
        const hayLabel = record.labelCompact;
        const hayValue = record.valueCompact;
        const hayText = record.textCompact;
        if (hayLabel.includes(qCompact)) score += 10;
        if (hayValue.includes(qCompact)) score += 8;
        if (hayText.includes(qCompact)) score += 5;
        for (const term of terms) {
          if (hayLabel.includes(term)) score += 4;
          if (hayValue.includes(term)) score += 3;
          if (hayText.includes(term)) score += 2;
        }
        return { record, score };
      }).filter(x => x.score > 0).sort((a, b) => b.score - a.score).map(x => x.record);
    }
  }

  function initBelavadosChatbots() {
    const bots = [];
    document.querySelectorAll('[data-belavados-chatbot]').forEach(root => {
      if (root.__belavadosChatbot) return;
      root.__belavadosChatbot = new BelavadosChatbot(root);
      bots.push(root.__belavadosChatbot);
    });
    window.BelavadosChatbot = window.BelavadosChatbot || {};
    window.BelavadosChatbot.instances = Array.from(document.querySelectorAll('[data-belavados-chatbot]')).map(root => root.__belavadosChatbot).filter(Boolean);
    window.BelavadosChatbot.scanAll = () => window.BelavadosChatbot.instances.map(bot => bot.scanCharacterSheet({ silent: false }));
    window.BelavadosChatbot.roll = expression => (window.BelavadosChatbot.instances[0] || new BelavadosChatbot(document.querySelector('[data-belavados-chatbot]'))).rollExpression(expression);
    window.BelavadosChatbot.ask = message => window.BelavadosChatbot.instances[0]?.handleMessage(String(message || ''));
    return bots;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initBelavadosChatbots);
  else initBelavadosChatbots();
})();

