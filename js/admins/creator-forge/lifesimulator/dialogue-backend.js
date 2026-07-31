(function (global) {
  "use strict";
  const LS = global.LifeSimulator;
  const C = LS.dialogueContext;

  function normalizeResponse(raw, request) {
    let value = raw;
    if (typeof raw === "string") {
      const trimmed = raw.trim();
      try { value = JSON.parse(trimmed); }
      catch (_) {
        const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
        if (fenced) { try { value = JSON.parse(fenced[1]); } catch (_) { value = null; } }
        if (!value || typeof value === "string") value = { mode: "single", responses: [{ text: trimmed, targetPlayerIds: [], emotion: "neutral", reaction: "neutral" }] };
      }
    }
    if (value?.data && typeof value.data === "object") value = value.data;
    if (value?.result && typeof value.result === "object") value = value.result;
    if (value?.response && typeof value.response === "object") value = value.response;
    const source = value?.responses || value?.messages || value?.reply || [];
    const responses = C.array(source).map(item => typeof item === "string"
      ? { text: item.trim(), targetPlayerIds: [], emotion: "neutral", reaction: "neutral" }
      : {
          text: C.text(item?.text || item?.message || item?.reply),
          targetPlayerIds: C.array(item?.targetPlayerIds || item?.targets),
          emotion: C.text(item?.emotion, "neutral"),
          reaction: C.text(item?.reaction || item?.expression || item?.emotion, "neutral")
        }).filter(item => item.text);
    if (!responses.length && C.text(value?.text)) responses.push({ text: C.text(value.text), targetPlayerIds: [], emotion: "neutral", reaction: "neutral" });
    if (!responses.length) throw new Error("The dialogue backend returned no usable NPC response.");
    return {
      requestId: request.requestId,
      mode: ["single", "varied"].includes(value?.mode) ? value.mode : responses.length > 1 ? "varied" : "single",
      responses,
      memoryWrites: C.array(value?.memoryWrites),
      statePatch: value?.statePatch && typeof value.statePatch === "object" ? value.statePatch : {},
      decisionFactors: C.array(value?.decisionFactors).slice(0, 8),
      warnings: C.array(value?.warnings),
      engine: "backend"
    };
  }

  async function post(request, settings = LS.store.get().dialogueSettings) {
    const endpoint = C.text(settings.backendEndpoint || LS.CONFIG.backend);
    if (!endpoint) throw new Error("No dialogue backend endpoint is configured.");
    const timeout = Math.max(3000, Math.min(120000, Number(settings.backendTimeoutMs || LS.CONFIG.dialogueLimits.timeoutMs)));
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), timeout);
    const envelope = {
      action: "npc_dialogue", version: LS.CONFIG.schemaVersion, requestId: request.requestId,
      library: { id: LS.CONFIG.backendLibraryId, version: LS.CONFIG.backendLibraryVersion, url: settings.backendLibraryUrl || LS.CONFIG.backendLibrary },
      systemInstruction: request.systemInstruction, payload: request.payload
    };
    try {
      const response = await fetch(endpoint, {
        method: "POST", redirect: "follow", mode: "cors", credentials: "omit",
        headers: { "Content-Type": "text/plain;charset=UTF-8", Accept: "application/json,text/plain,*/*" },
        body: JSON.stringify(envelope), signal: controller.signal
      });
      const body = await response.text();
      if (!response.ok) throw new Error(`Dialogue backend HTTP ${response.status}: ${body.slice(0, 240)}`);
      return normalizeResponse(body, request);
    } catch (error) {
      if (error.name === "AbortError") throw new Error(`Dialogue backend timed out after ${timeout} ms.`);
      throw error;
    } finally { clearTimeout(timer); }
  }

  async function test(settings = LS.store.get().dialogueSettings) {
    const endpoint = C.text(settings.backendEndpoint || LS.CONFIG.backend);
    if (!endpoint) return { ok: false, status: 0, text: "No endpoint configured." };
    const controller = new AbortController(); const timeout = Math.min(Number(settings.backendTimeoutMs || 15000), 15000); const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(endpoint, {
        method: "POST", mode: "cors", redirect: "follow", credentials: "omit",
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
        body: JSON.stringify({ action: "health", requestId: LS.util.uid("health"), library: { id: LS.CONFIG.backendLibraryId, version: LS.CONFIG.backendLibraryVersion } }),
        signal: controller.signal
      });
      const body = await response.text();
      return { ok: response.ok, status: response.status, text: body.slice(0, 500) };
    } catch (error) { return { ok: false, status: 0, text: error.message }; }
    finally { clearTimeout(timer); }
  }

  LS.dialogueBackend = Object.freeze({ post, test, normalizeResponse });
})(window);
