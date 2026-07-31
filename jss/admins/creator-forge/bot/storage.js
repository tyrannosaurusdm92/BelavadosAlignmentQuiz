(function (global) {
  'use strict';

  const SB = global.Superbot = global.Superbot || {};
  const U = SB.util;
  const memoryFallback = new Map();

  function safeStorage() {
    try {
      const storage = global.localStorage;
      const key = '__superbot_probe__';
      storage.setItem(key, '1');
      storage.removeItem(key);
      return storage;
    } catch {
      return {
        getItem: key => memoryFallback.has(key) ? memoryFallback.get(key) : null,
        setItem: (key, value) => memoryFallback.set(String(key), String(value)),
        removeItem: key => memoryFallback.delete(key)
      };
    }
  }

  const local = safeStorage();

  const defaults = () => ({
    version: SB.VERSION,
    createdAt: U.nowIso(),
    updatedAt: U.nowIso(),
    selectedConversationId: null,
    conversations: [],
    localMemories: [],
    savedSkills: [],
    projectContext: '',
    draft: '',
    ui: { panel: 'settings', sidebarOpen: true, inspectorOpen: true }
  });

  const settingsDefaults = () => ({
    backendUrl: SB.CONFIG.backendUrl,
    backendLibrary: SB.CONFIG.backendLibrary,
    repository: SB.CONFIG.defaultRepository,
    projectToken: '',
    projectId: SB.CONFIG.defaultProjectId,
    userId: SB.CONFIG.defaultUserId,
    includeProjectContext: true,
    autoFallback: true,
    autoReadAloud: false,
    compactMessages: false,
    preferredMode: 'chat',
    systemInstructions: '',
    theme: 'dark'
  });

  const store = SB.store = {
    state: defaults(),
    settings: settingsDefaults(),

    load() {
      const rawState = U.safeJsonParse(local.getItem(SB.CONFIG.storageKey), null);
      const rawSettings = U.safeJsonParse(local.getItem(SB.CONFIG.settingsKey), null);
      this.state = Object.assign(defaults(), rawState || {});
      this.state.ui = Object.assign(defaults().ui, this.state.ui || {});
      this.settings = Object.assign(settingsDefaults(), rawSettings || {});
      if (!Array.isArray(this.state.conversations)) this.state.conversations = [];
      if (!Array.isArray(this.state.localMemories)) this.state.localMemories = [];
      if (!Array.isArray(this.state.savedSkills)) this.state.savedSkills = [];
      if (!this.state.conversations.length) this.newConversation();
      if (!this.state.selectedConversationId || !this.state.conversations.some(c => c.id === this.state.selectedConversationId)) {
        this.state.selectedConversationId = this.state.conversations[0].id;
      }
      this.save();
      return this.state;
    },

    save() {
      this.state.updatedAt = U.nowIso();
      local.setItem(SB.CONFIG.storageKey, JSON.stringify(this.state));
      local.setItem(SB.CONFIG.settingsKey, JSON.stringify(this.settings));
    },

    activeConversation() {
      let conversation = this.state.conversations.find(c => c.id === this.state.selectedConversationId);
      if (!conversation) conversation = this.newConversation();
      return conversation;
    },

    newConversation(title = 'New conversation') {
      const conversation = {
        id: U.uid('conversation'),
        title,
        createdAt: U.nowIso(),
        updatedAt: U.nowIso(),
        messages: [],
        pinned: false,
        archived: false
      };
      this.state.conversations.unshift(conversation);
      this.state.selectedConversationId = conversation.id;
      this.save();
      return conversation;
    },

    selectConversation(id) {
      if (this.state.conversations.some(c => c.id === id)) {
        this.state.selectedConversationId = id;
        this.save();
      }
      return this.activeConversation();
    },

    deleteConversation(id) {
      this.state.conversations = this.state.conversations.filter(c => c.id !== id);
      if (!this.state.conversations.length) this.newConversation();
      if (!this.state.conversations.some(c => c.id === this.state.selectedConversationId)) {
        this.state.selectedConversationId = this.state.conversations[0].id;
      }
      this.save();
    },

    renameConversation(id, title) {
      const conversation = this.state.conversations.find(c => c.id === id);
      if (conversation) {
        conversation.title = String(title || '').trim().slice(0, 100) || 'Untitled conversation';
        conversation.updatedAt = U.nowIso();
        this.save();
      }
    },

    addMessage(role, content, meta = {}) {
      const conversation = this.activeConversation();
      const message = {
        id: U.uid('message'),
        role,
        content: String(content == null ? '' : content),
        createdAt: U.nowIso(),
        status: 'complete',
        ...meta
      };
      conversation.messages.push(message);
      conversation.updatedAt = message.createdAt;
      if (role === 'user' && (conversation.title === 'New conversation' || conversation.messages.length <= 2)) {
        conversation.title = message.content.replace(/\s+/g, ' ').slice(0, 58) || conversation.title;
      }
      this.save();
      return message;
    },

    updateMessage(id, patch) {
      for (const conversation of this.state.conversations) {
        const message = conversation.messages.find(m => m.id === id);
        if (message) {
          Object.assign(message, patch || {});
          conversation.updatedAt = U.nowIso();
          this.save();
          return message;
        }
      }
      return null;
    },

    clearMessages() {
      const conversation = this.activeConversation();
      conversation.messages = [];
      conversation.updatedAt = U.nowIso();
      this.save();
    },

    setSettings(patch) {
      Object.assign(this.settings, patch || {});
      this.save();
      return this.settings;
    },

    exportAll() {
      return {
        schema: 'superbot-export/v1',
        exportedAt: U.nowIso(),
        state: U.deepClone(this.state),
        settings: { ...this.settings, projectToken: '' }
      };
    },

    importAll(payload) {
      if (!payload || typeof payload !== 'object') throw new Error('Import must be a JSON object.');
      if (payload.state) this.state = Object.assign(defaults(), payload.state);
      if (payload.settings) this.settings = Object.assign(settingsDefaults(), payload.settings, { projectToken: this.settings.projectToken || '' });
      this.loadFromCurrent();
      this.save();
    },

    loadFromCurrent() {
      if (!Array.isArray(this.state.conversations)) this.state.conversations = [];
      if (!Array.isArray(this.state.localMemories)) this.state.localMemories = [];
      if (!Array.isArray(this.state.savedSkills)) this.state.savedSkills = [];
      if (!this.state.conversations.length) this.newConversation();
      if (!this.state.selectedConversationId) this.state.selectedConversationId = this.state.conversations[0].id;
    },

    reset() {
      this.state = defaults();
      this.settings = settingsDefaults();
      this.newConversation();
      this.save();
    }
  };

  class FileDatabase {
    constructor() {
      this.db = null;
      this.memory = new Map();
    }

    async open() {
      if (!('indexedDB' in global)) return null;
      if (this.db) return this.db;
      this.db = await new Promise((resolve, reject) => {
        const request = indexedDB.open(SB.CONFIG.dbName, SB.CONFIG.dbVersion);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains('files')) db.createObjectStore('files', { keyPath: 'id' });
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }).catch(() => null);
      return this.db;
    }

    async put(record) {
      const db = await this.open();
      if (!db) { this.memory.set(record.id, record); return record; }
      return new Promise((resolve, reject) => {
        const tx = db.transaction('files', 'readwrite');
        tx.objectStore('files').put(record);
        tx.oncomplete = () => resolve(record);
        tx.onerror = () => reject(tx.error);
      });
    }

    async get(id) {
      const db = await this.open();
      if (!db) return this.memory.get(id) || null;
      return new Promise((resolve, reject) => {
        const request = db.transaction('files', 'readonly').objectStore('files').get(id);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    }

    async delete(id) {
      const db = await this.open();
      if (!db) return this.memory.delete(id);
      return new Promise((resolve, reject) => {
        const tx = db.transaction('files', 'readwrite');
        tx.objectStore('files').delete(id);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
      });
    }
  }

  store.files = new FileDatabase();
})(window);
