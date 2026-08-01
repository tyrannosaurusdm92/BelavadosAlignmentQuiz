export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

export function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
}
export function escapeAttr(value = '') { return escapeHtml(value).replace(/`/g, '&#96;'); }
export function uid(prefix = 'id') { return `${prefix}_${crypto.randomUUID?.() || `${Date.now()}_${Math.random().toString(36).slice(2)}`}`; }
export function clamp(value, min, max) { return Math.min(max, Math.max(min, Number(value) || 0)); }
export function unique(values = []) { return [...new Set(values.filter(Boolean).map(String))]; }
export function array(value) {
  if (Array.isArray(value)) return value;
  if (value == null || value === '') return [];
  if (typeof value === 'string') {
    try { const parsed = JSON.parse(value); if (Array.isArray(parsed)) return parsed; } catch {}
    return value.split(',').map(item => item.trim()).filter(Boolean);
  }
  return [];
}
export function hasPermission(mask, permission) { return (Number(mask || 0) & permission) === permission; }
export function initials(name = '?') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? parts[0][0] + parts.at(-1)[0] : parts[0]?.slice(0,2) || '?').toUpperCase();
}
export function formatDateTime(value) {
  if (!value) return '';
  const date = new Date(value); if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat(undefined, {dateStyle:'medium', timeStyle:'short'}).format(date);
}
export function formatTime(value) {
  if (!value) return '';
  const date = new Date(value); if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(undefined, {hour:'numeric', minute:'2-digit'}).format(date);
}
export function formatDay(value) {
  const date = new Date(value); if (Number.isNaN(date.getTime())) return '';
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return 'Today';
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return new Intl.DateTimeFormat(undefined, {weekday:'long', month:'short', day:'numeric'}).format(date);
}
export function relativeTime(value) {
  if (!value) return '';
  const time = new Date(value).getTime(); if (!Number.isFinite(time)) return '';
  const delta = time - Date.now(); const abs = Math.abs(delta);
  const units = abs < 60_000 ? ['second', 1000] : abs < 3_600_000 ? ['minute', 60_000] : abs < 86_400_000 ? ['hour', 3_600_000] : ['day', 86_400_000];
  return new Intl.RelativeTimeFormat(undefined, {numeric:'auto'}).format(Math.round(delta / units[1]), units[0]);
}
export function debounce(fn, wait = 200) { let timer; return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), wait); }; }
export function throttle(fn, wait = 1000) { let last = 0; let trailing; return (...args) => { const now = Date.now(); const remain = wait - (now-last); if (remain <= 0) { clearTimeout(trailing); last = now; fn(...args); } else { clearTimeout(trailing); trailing = setTimeout(() => { last = Date.now(); fn(...args); }, remain); } }; }
export function parseTags(value) { return unique(String(value || '').split(/[#,]/).map(v => v.trim().replace(/^#/, '')).filter(Boolean)); }
export function parseJsonInput(value, fallback = {}) { if (!String(value || '').trim()) return fallback; try { return JSON.parse(value); } catch { throw new Error('This field must contain valid JSON.'); } }
export function readForm(form) { return Object.fromEntries(new FormData(form).entries()); }
export function safeJson(value, fallback = null) { try { return JSON.parse(value); } catch { return fallback; } }
export function setDocumentTheme(theme) {
  const resolved = theme === 'system' ? (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark') : theme;
  document.documentElement.dataset.theme = resolved;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'light' ? '#F2FFFF' : '#001010');
}
export function downloadJson(name, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob); const a = document.createElement('a');
  a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function icon(name) {
  const paths = {
    home:'<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10.5V20h14v-9.5"/><path d="M9 20v-6h6v6"/>',
    user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    compass:'<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z"/>',
    users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    messages:'<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/>',
    shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
    bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
    settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21H9.6v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3V9.6h.1A1.7 1.7 0 0 0 4.7 8.5a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.1A1.7 1.7 0 0 0 15.5 4.7a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.17.36.38.69.6 1 .28.32.67.51 1.1.52h.1v4h-.1A1.7 1.7 0 0 0 19.4 15Z"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
    members:'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    send:'<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    paperclip:'<path d="m21.4 11.6-8.9 8.9a6 6 0 0 1-8.5-8.5l9.5-9.5a4 4 0 0 1 5.7 5.7l-9.6 9.6a2 2 0 1 1-2.8-2.8l8.9-8.9"/>',
    smile:'<circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>',
    reply:'<path d="m9 17-5-5 5-5"/><path d="M4 12h10a6 6 0 0 1 6 6v1"/>',
    edit:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/>',
    trash:'<path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v6M14 11v6"/>',
    more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    logout:'<path d="M10 17l5-5-5-5M15 12H3"/><path d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5"/>',
    sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.41M17.66 6.34l1.41-1.41"/>',
    moon:'<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"/>',
    x:'<path d="M6 6l12 12M18 6 6 18"/>',
    check:'<path d="m5 12 4 4L19 6"/>',
    userplus:'<path d="M15 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8"/><path d="M19 8v6M16 11h6"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    map:'<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z"/><path d="M9 3v15M15 6v15"/>',
    filter:'<path d="M4 5h16M7 12h10M10 19h4"/>',
    lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    eye:'<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/>',
    eyeoff:'<path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a17.7 17.7 0 0 1-3 3.8M6.6 6.6C3.5 8.4 2 12 2 12s3.5 7 10 7a10.4 10.4 0 0 0 4.2-.9"/>',
    info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    external:'<path d="M15 3h6v6M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>'
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.info}</svg>`;
}
export function avatar(user, size = '') {
  if (!user) return `<span class="avatar ${size}">?</span>`;
  const status = String(user.status || 'OFFLINE').toLowerCase();
  return `<span class="avatar ${size}" title="${escapeAttr(user.displayTag || user.username || '')}">${escapeHtml(initials(user.username || user.displayTag))}<i class="presence ${escapeAttr(status)}"></i></span>`;
}
