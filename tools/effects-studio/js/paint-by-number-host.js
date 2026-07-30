(() => {
  'use strict';
  const SOURCE = 'effects-studio-shell';
  const CHILD_SOURCE = 'effects-studio-paint-by-number';
  const app = document.getElementById('app');
  const home = document.getElementById('projectHome');
  const frame = document.getElementById('paintByNumberFrame');
  const feature = document.getElementById('paintByNumberWorkspace');
  const studioWorkspace = document.getElementById('workspace');
  const toolDrawer = document.getElementById('toolDrawer');
  const studioButton = document.getElementById('studioWorkspaceBtn');
  const pbnButton = document.getElementById('paintByNumberWorkspaceBtn');
  const homePbnButton = document.getElementById('homePaintByNumberBtn');
  const title = document.getElementById('currentProjectName');
  const statusNode = document.getElementById('paintByNumberHostStatus');
  const saveButton = document.getElementById('saveBrowserBtn');
  const openButton = document.getElementById('loadBrowserBtn');
  const copyButton = document.getElementById('clearBrowserBtn');
  const syncButton = document.getElementById('backendSaveBtn');
  let mode = 'studio';
  let previousTitle = title?.textContent || 'Untitled Project';
  let requestCounter = 0;
  const pending = new Map();

  const send = (command, detail = {}) => {
    if (!frame?.contentWindow) return false;
    frame.contentWindow.postMessage({ source: SOURCE, type: 'command', command, ...detail }, '*');
    return true;
  };
  const setHostStatus = (message) => { if (statusNode) statusNode.textContent = message; };
  const ensureFrame = () => {
    if (!frame || frame.srcdoc || frame.src) return;
    const embeddedDocument = window.parent?.TableGateIntegratedTools?.document?.('paintByNumber');
    if (embeddedDocument) frame.srcdoc = embeddedDocument;
    else frame.src = frame.dataset.src;
  };
  function exposeShell() {
    if (home) { home.hidden = true; home.setAttribute('aria-hidden', 'true'); }
    if (app) { app.classList.add('editor-active'); app.setAttribute('aria-hidden', 'false'); }
  }
  function updateActionLabels() {
    if (!saveButton || !openButton || !copyButton || !syncButton) return;
    if (mode === 'paint-by-number') {
      saveButton.textContent = 'Save';
      openButton.textContent = 'Open';
      copyButton.textContent = 'Export';
      syncButton.textContent = 'Sync';
      saveButton.title = 'Save the current numbered project in this browser';
      openButton.title = 'Open the browser-saved numbered project';
      copyButton.title = 'Export the current numbered project as JSON';
    } else {
      saveButton.textContent = 'Save';
      openButton.textContent = 'Open';
      copyButton.textContent = 'Save Copy';
      syncButton.textContent = 'Sync';
      saveButton.removeAttribute('title'); openButton.removeAttribute('title'); copyButton.removeAttribute('title');
    }
  }
  function setMode(nextMode, openShell = true) {
    mode = nextMode === 'paint-by-number' ? 'paint-by-number' : 'studio';
    if (openShell) exposeShell();
    app?.classList.toggle('paint-by-number-active', mode === 'paint-by-number');
    app?.setAttribute('data-workspace-mode', mode);
    if (feature) feature.hidden = mode !== 'paint-by-number';
    if (studioWorkspace) studioWorkspace.hidden = mode === 'paint-by-number';
    if (toolDrawer) toolDrawer.setAttribute('aria-hidden', String(mode === 'paint-by-number'));
    studioButton?.classList.toggle('active', mode === 'studio');
    pbnButton?.classList.toggle('active', mode === 'paint-by-number');
    studioButton?.setAttribute('aria-selected', String(mode === 'studio'));
    pbnButton?.setAttribute('aria-selected', String(mode === 'paint-by-number'));
    if (title) {
      if (mode === 'paint-by-number') { previousTitle = title.textContent || previousTitle; title.textContent = 'Paint by Number'; }
      else if (title.textContent === 'Paint by Number') title.textContent = previousTitle;
    }
    if (mode === 'paint-by-number') { ensureFrame(); setHostStatus('Paint by Number workspace loading…'); }
    updateActionLabels();
  }
  function intercept(button, command) {
    button?.addEventListener('click', (event) => {
      if (mode !== 'paint-by-number') return;
      event.preventDefault(); event.stopImmediatePropagation();
      send(command);
    }, true);
  }
  function requestProject() {
    ensureFrame();
    const requestId = `pbn_${Date.now()}_${++requestCounter}`;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { pending.delete(requestId); reject(new Error('Paint by Number did not return project data.')); }, 12000);
      pending.set(requestId, { resolve, reject, timer });
      send('request-project', { requestId });
    });
  }
  async function syncPaintByNumber() {
    setHostStatus('Syncing Paint by Number to the Effects Studio backend…');
    try {
      const project = await requestProject();
      if (!project) throw new Error('Load or create a numbered project first.');
      const config = window.EffectsStudioBackendConfig || {};
      const endpoint = config.serviceBackend?.exec;
      if (!endpoint) throw new Error('Effects Studio backend is not configured.');
      const payload = {
        action: 'savePaintByNumberProject', source: 'Effects Studio', feature: 'paint-by-number',
        backendLibrary: config.serviceBackend?.library || '', preferredHosts: config.preferredHosts || [], project
      };
      const response = await fetch(endpoint, {
        method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload), redirect: 'follow'
      });
      const responseText = await response.text().catch(() => '');
      if (!response.ok) throw new Error(responseText || `HTTP ${response.status}`);
      setHostStatus('Paint by Number sync request completed.');
    } catch (error) {
      console.warn(error);
      setHostStatus(`${error.message} The numbered project remains available for local save or JSON export.`);
      send('save');
    }
  }

  studioButton?.addEventListener('click', () => setMode('studio'));
  pbnButton?.addEventListener('click', () => setMode('paint-by-number'));
  homePbnButton?.addEventListener('click', () => setMode('paint-by-number'));
  home?.addEventListener('click', (event) => {
    if (event.target.closest('#homePaintByNumberBtn')) return;
    if (event.target.closest('button, .file-action, .project-card')) setMode('studio', false);
  }, true);
  intercept(saveButton, 'save');
  intercept(openButton, 'open');
  intercept(copyButton, 'export-json');
  syncButton?.addEventListener('click', (event) => {
    if (mode !== 'paint-by-number') return;
    event.preventDefault(); event.stopImmediatePropagation(); syncPaintByNumber();
  }, true);
  window.addEventListener('message', (event) => {
    if (event.source !== frame?.contentWindow) return;
    const data = event.data || {};
    if (data.source !== CHILD_SOURCE) return;
    if (data.type === 'ready') setHostStatus('Paint by Number is ready.');
    else if (data.type === 'status' && data.message) setHostStatus(data.message);
    else if (data.type === 'error') {
      setHostStatus(data.message || 'Paint by Number reported an error.');
      const entry = pending.get(data.requestId); if (entry) { clearTimeout(entry.timer); pending.delete(data.requestId); entry.reject(new Error(data.message)); }
    } else if (data.type === 'project') {
      const entry = pending.get(data.requestId); if (!entry) return;
      clearTimeout(entry.timer); pending.delete(data.requestId); entry.resolve(data.project || null);
    }
  });
  setMode('studio', false);
})();
