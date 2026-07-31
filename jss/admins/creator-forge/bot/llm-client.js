(function (global) {
  'use strict';

  const SB = global.Superbot = global.Superbot || {};
  const U = SB.util;

  class BackendError extends Error {
    constructor(message, details = {}) {
      super(message);
      this.name = 'BackendError';
      this.details = details;
      this.status = details.status || 0;
      this.requestId = details.requestId || '';
    }
  }

  class LLMClient {
    constructor() {
      this.controller = null;
      this.lastHealth = null;
    }

    settings() { return SB.store.settings; }

    sessionId() {
      let id = null;
      try { id = sessionStorage.getItem(SB.CONFIG.sessionKey); } catch { id = this._sessionId || null; }
      if (!id) {
        id = U.uid('session');
        try { sessionStorage.setItem(SB.CONFIG.sessionKey, id); } catch { this._sessionId = id; }
      }
      return id;
    }

    configured() {
      const settings = this.settings();
      return Boolean(settings.backendUrl);
    }

    cancel() {
      if (this.controller) this.controller.abort();
      this.controller = null;
    }

    basePayload(action) {
      const settings = this.settings();
      return {
        action,
        repository: settings.repository || '',
        project: { repository: settings.repository || '', ref: 'main' },
        projectToken: settings.projectToken || '',
        projectId: settings.projectId || SB.CONFIG.defaultProjectId,
        userId: settings.userId || SB.CONFIG.defaultUserId,
        sessionId: this.sessionId(),
        timestamp: U.epochSeconds(),
        nonce: U.uid('nonce'),
        requestId: U.uid('request')
      };
    }

    async call(action, payload = {}, options = {}) {
      const settings = this.settings();
      const url = String(settings.backendUrl || '').trim();
      if (!url) throw new BackendError('Backend URL is not configured.');
      const health = action === 'health';
      const body = health ? { action: 'health' } : { ...this.basePayload(action), ...payload, action };
      const timeout = Number(options.timeout || (health ? SB.CONFIG.healthTimeoutMs : SB.CONFIG.requestTimeoutMs));
      this.controller = new AbortController();
      const timer = setTimeout(() => this.controller && this.controller.abort(), timeout);
      let response;
      let text = '';
      try {
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(body),
          signal: this.controller.signal,
          redirect: 'follow',
          cache: 'no-store'
        });
        text = await response.text();
      } catch (error) {
        if (error.name === 'AbortError') throw new BackendError('Backend request timed out or was cancelled.', { cause: error });
        throw new BackendError(`Backend network request failed: ${U.errorMessage(error)}`, { cause: error });
      } finally {
        clearTimeout(timer);
        this.controller = null;
      }
      const data = U.safeJsonParse(text, null);
      if (!data) throw new BackendError('Backend returned non-JSON output.', { status: response.status, raw: U.truncate(text, 2000) });
      if (!response.ok || data.ok === false) {
        throw new BackendError(data.error || data.message || `Backend request failed with HTTP ${response.status}.`, {
          status: response.status,
          requestId: data.requestId,
          response: data
        });
      }
      return data;
    }

    async health() {
      try {
        this.lastHealth = await this.call('health', {}, { timeout: SB.CONFIG.healthTimeoutMs });
      } catch (error) {
        this.lastHealth = { ok: false, error: U.errorMessage(error) };
      }
      return this.lastHealth;
    }

    async chat({ message, history = [], systemContext = '', references = [] }) {
      return this.call('chat', { message, history, systemContext, references });
    }

    memoryRemember(memory) { return this.call('memory.remember', { memory }); }
    memorySearch(query, limit = 12) { return this.call('memory.search', { query, limit }); }
    memoryList(limit = 100) { return this.call('memory.list', { limit }); }
    memoryForget(memoryId) { return this.call('memory.forget', { memoryId }); }
    skillSave(skill) { return this.call('skill.save', { skill }); }
    skillList() { return this.call('skill.list'); }
    projectGet(projectId) { return this.call('project.get', { projectId: projectId || this.settings().projectId }); }
    projectSave(project) { return this.call('project.save', { project }); }
    projectPatch(projectId, operations) { return this.call('project.patch', { projectId, operations }); }
    sortItems(items, sort) { return this.call('sort.items', { items, sort }); }

    generate(kind, prompt, context = '') {
      const allowed = new Set(['record', 'document', 'workflow', 'component', 'schema', 'checklist']);
      if (!allowed.has(kind)) throw new Error(`Unsupported generator: ${kind}`);
      return this.call(`generate.${kind}`, { prompt, context });
    }

    generateImage(prompt, options = {}) {
      return this.call('image.generate', {
        prompt,
        size: options.size || '1024x1024',
        quality: options.quality || 'high',
        background: options.background || 'auto',
        name: options.name || `superbot-image-${Date.now()}`
      }, { timeout: 180000 });
    }

    generate3D(prompt, options = {}) {
      return this.call('3d.generate', {
        prompt,
        referenceUrls: options.referenceUrls || [],
        realism: options.realism == null ? 0.8 : options.realism,
        outputFormats: options.outputFormats || ['glb', 'gltf'],
        name: options.name || `superbot-3d-${Date.now()}`
      }, { timeout: 180000 });
    }

    plan3D(prompt, options = {}) {
      return this.call('3d.plan', { prompt, ...options }, { timeout: 120000 });
    }

    jobStatus(jobId) { return this.call('job.status', { jobId }); }

    uploadAsset({ name, mimeType, base64, folder, metadata }) {
      return this.call('asset.upload', { name, mimeType, base64, folder, metadata }, { timeout: 180000 });
    }
  }

  SB.BackendError = BackendError;
  SB.client = new LLMClient();
})(window);
