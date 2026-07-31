export class ReactionRegistry {
  constructor() {
    this.core = new Map();
    this.expansions = new Map();
    this.enabledExpansions = new Set();
  }

  registerCore(reactions) {
    for (const reaction of reactions) {
      if (this.core.has(reaction.id)) throw new Error(`Duplicate core reaction: ${reaction.id}`);
      this.core.set(reaction.id, Object.freeze({...reaction, namespace: 'core'}));
    }
  }

  registerExpansion(manifest, reactions) {
    const namespace = manifest.namespace;
    if (!namespace || namespace === 'core') throw new Error('Expansion requires a non-core namespace.');
    if (this.expansions.has(namespace)) throw new Error(`Expansion already registered: ${namespace}`);
    const map = new Map();
    for (const reaction of reactions) {
      if (!reaction.id.startsWith(`${namespace}.`)) throw new Error(`Reaction ${reaction.id} is outside namespace ${namespace}.`);
      map.set(reaction.id, Object.freeze({...reaction, namespace}));
    }
    this.expansions.set(namespace, {manifest: Object.freeze({...manifest}), reactions: map});
  }

  enableExpansion(namespace) {
    if (!this.expansions.has(namespace)) throw new Error(`Unknown expansion: ${namespace}`);
    this.enabledExpansions.add(namespace);
  }

  disableExpansion(namespace) { this.enabledExpansions.delete(namespace); }

  get(id) {
    if (this.core.has(id)) return this.core.get(id);
    const namespace = id.split('.')[0];
    if (!this.enabledExpansions.has(namespace)) return null;
    return this.expansions.get(namespace)?.reactions.get(id) ?? null;
  }

  list({category, includeDisabled = false} = {}) {
    const out = [...this.core.values()];
    for (const [namespace, expansion] of this.expansions) {
      if (includeDisabled || this.enabledExpansions.has(namespace)) out.push(...expansion.reactions.values());
    }
    return category ? out.filter(r => r.category === category) : out;
  }
}
