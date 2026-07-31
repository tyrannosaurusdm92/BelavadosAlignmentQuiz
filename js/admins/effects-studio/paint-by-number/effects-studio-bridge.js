(() => {
  'use strict';
  const SOURCE = 'effects-studio-paint-by-number';
  const embedded = window.parent !== window || new URLSearchParams(location.search).get('embedded') === '1';
  const send = (type, detail = {}) => {
    if (!embedded || window.parent === window) return;
    window.parent.postMessage({ source: SOURCE, type, ...detail }, '*');
  };
  const notify = (message) => send('status', { message });
  function currentProject() {
    try { return typeof serializePuzzle === 'function' ? serializePuzzle() : null; }
    catch (error) { console.warn(error); return null; }
  }
  function exportProjectJson() {
    const project = currentProject();
    if (!project) { if (typeof toast === 'function') toast('Load a puzzle first'); return false; }
    const title = typeof safeName === 'function' ? safeName(project.title || 'paint-by-number') : 'paint-by-number';
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    if (typeof download === 'function') download(`${title}.pbn.json`, blob);
    return true;
  }
  window.addEventListener('message', (event) => {
    if (event.source !== window.parent) return;
    const data = event.data || {};
    if (data.source !== 'effects-studio-shell' || data.type !== 'command') return;
    try {
      if (data.command === 'save') document.getElementById('saveBtn')?.click();
      else if (data.command === 'open') document.getElementById('loadBtn')?.click();
      else if (data.command === 'export-json') exportProjectJson();
      else if (data.command === 'request-project') send('project', { requestId: data.requestId, project: currentProject() });
      else if (data.command === 'activate-tab') document.querySelector(`.tab-btn[data-tab="${CSS.escape(data.tab || 'paint')}"]`)?.click();
      notify(`Paint by Number command completed: ${data.command}.`);
    } catch (error) {
      console.error(error);
      send('error', { requestId: data.requestId, message: error.message || String(error) });
    }
  });
  window.addEventListener('error', (event) => send('error', { message: event.message || 'Paint by Number error' }));
  send('ready', { hasProject: !!currentProject() });
})();
