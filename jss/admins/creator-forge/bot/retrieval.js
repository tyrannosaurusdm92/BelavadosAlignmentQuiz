(function (global) {
  'use strict';

  const SB = global.Superbot = global.Superbot || {};
  const U = SB.util;
  const indexCache = new WeakMap();

  function corpus() {
    return Array.isArray(global.SUPERBOT_INTELLIGENCE_CORPUS) ? global.SUPERBOT_INTELLIGENCE_CORPUS : [];
  }

  function entryText(entry) {
    return `${entry.title || ''} ${entry.group || ''} ${entry.mode || ''} ${(entry.tags || []).join(' ')} ${entry.prompt || ''}`.toLowerCase();
  }

  function indexFor(entry) {
    if (indexCache.has(entry)) return indexCache.get(entry);
    const words = new Set(U.words(`${entry.title || ''} ${(entry.tags || []).join(' ')} ${entry.group || ''}`));
    const title = String(entry.title || '').toLowerCase();
    const value = { words, title, text: null };
    indexCache.set(entry, value);
    return value;
  }

  function scoreEntry(entry, query, words) {
    const idx = indexFor(entry);
    let score = 0;
    const lowerQuery = query.toLowerCase();
    if (idx.title === lowerQuery) score += 18;
    else if (idx.title.includes(lowerQuery)) score += 9;
    for (const word of words) {
      if (idx.words.has(word)) score += 4;
      if (idx.title.includes(word)) score += 3;
    }
    if (score < 4) {
      idx.text = idx.text || entryText(entry);
      for (const word of words) if (idx.text.includes(word)) score += 0.75;
    }
    if (entry.mode === 'builder') score += 0.2;
    if (entry.mode === 'verifier' && /test|verify|audit|debug|check/.test(lowerQuery)) score += 2;
    if (entry.mode === 'planner' && /plan|roadmap|steps|workflow/.test(lowerQuery)) score += 2;
    if (entry.mode === 'teacher' && /explain|learn|teach|understand/.test(lowerQuery)) score += 2;
    if (entry.mode === 'reviewer' && /review|critique|improve/.test(lowerQuery)) score += 2;
    return score;
  }

  SB.retrieval = {
    size() { return corpus().length; },

    search(query, options = {}) {
      const clean = U.normalizeWhitespace(query);
      if (!clean) return [];
      const limit = U.clamp(Number(options.limit || SB.CONFIG.maxCorpusResults), 1, 30);
      const words = U.keywords(clean, 18);
      if (!words.length) return [];
      const results = [];
      for (const entry of corpus()) {
        const score = scoreEntry(entry, clean, words);
        if (score <= 0) continue;
        if (results.length < limit) {
          results.push({ entry, score });
          results.sort((a, b) => b.score - a.score);
        } else if (score > results[results.length - 1].score) {
          results[results.length - 1] = { entry, score };
          results.sort((a, b) => b.score - a.score);
        }
      }
      return results.map(result => ({ ...result.entry, score: Number(result.score.toFixed(2)) }));
    },

    context(query, options = {}) {
      const matches = this.search(query, options);
      if (!matches.length) return '';
      const maxChars = Number(options.maxChars || 18000);
      const blocks = [];
      let used = 0;
      for (const match of matches) {
        const block = [
          `Skill: ${match.title}`,
          `Mode: ${match.mode || 'general'}`,
          `Tags: ${(match.tags || []).join(', ')}`,
          U.truncate(match.prompt || '', 5500)
        ].join('\n');
        if (used + block.length > maxChars && blocks.length) break;
        blocks.push(block);
        used += block.length;
      }
      return `Relevant local skill-corpus excerpts:\n\n${blocks.join('\n\n---\n\n')}`;
    },

    offlineAnswer(query) {
      const matches = this.search(query, { limit: 5 });
      if (!matches.length) {
        return [
          'The cloud model is unavailable, and the local corpus did not contain a close match.',
          '',
          'The offline layer can still run `/calc`, `/json`, `/text`, `/hash`, `/search`, `/memory`, `/time`, `/help`, and project export commands. Configure a registered repository and project token in Settings to use the backend LLM.'
        ].join('\n');
      }
      return [
        'The cloud model is unavailable, so Superbot used its local retrieval corpus. This is a retrieval result, not a substitute for a generative model.',
        '',
        ...matches.map((match, index) => [
          `## ${index + 1}. ${match.title} — ${match.mode || 'general'}`,
          U.truncate(match.prompt, 2200)
        ].join('\n\n')),
        '',
        'Restore the backend connection for synthesized reasoning, tool calls, current web research, and multimodal generation.'
      ].join('\n\n');
    }
  };
})(window);
