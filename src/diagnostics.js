/* Local diagnostic sidecar. Never changes prompts, sampling, retries or project data. */
(function (global) {
  'use strict';
  const VERSION = 'startrack-debug/1', DB = 'dug.workbench.diagnostics.v1';
  const LIMIT = 64 * 1024 * 1024, MAX_RECORDS = 400, TEXT_LIMIT = 1000000;
  function create({ indexedDB = global.indexedDB, clock = Date.now } = {}) {
    const secrets = new Set(), memory = new Map(), warnings = new Set();
    let connection, queue = Promise.resolve(), dropped = 0;
    function rememberSecret(value) { if (typeof value === 'string' && value) secrets.add(value); }
    function scrubString(value) {
      for (const secret of secrets) value = value.split(secret).join('<REDACTED>');
      return value.replace(/Bearer\s+[^\s"'<>\\]+/gi, 'Bearer <REDACTED>')
        .replace(/\bsk-[a-z0-9_-]{8,}/gi, '<REDACTED>')
        .replace(/((?:api[_-]?key|authorization|access[_-]?token|password|secret)["'\\\s]*[:=]["'\\\s]*)([^\s,"'\\}]+)/gi, '$1<REDACTED>')
        .replace(/(https?:\/\/)[^\s/@]+:[^\s/@]+@/gi, '$1<REDACTED>@');
    }
    function sanitize(value) {
      if (typeof value === 'string') return scrubString(value);
      if (Array.isArray(value)) return value.map(sanitize);
      if (!value || typeof value !== 'object') return value;
      if (value instanceof Error) return sanitize({ name: value.name, message: value.message, code: value.code, stack: value.stack, raw: value.raw, diagnostic: value.diagnostic });
      const out = {};
      for (const [key, item] of Object.entries(value)) out[key] = /^(api[_-]?key|authorization|proxy-authorization|cookies?|set-cookie|password|secret|access[_-]?token|refresh[_-]?token|credentials)$/i.test(key) ? '<REDACTED>' : sanitize(item);
      return out;
    }
    function open() {
      if (!connection) connection = new Promise((resolve, reject) => {
        if (!indexedDB) { reject(Error('IndexedDB unavailable')); return; }
        const req = indexedDB.open(DB, 1);
        req.onupgradeneeded = () => req.result.createObjectStore('records', { keyPath: 'id' });
        req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error);
        req.onblocked = () => reject(Error('IndexedDB blocked'));
      });
      return connection;
    }
    async function transaction(mode, action) {
      const db = await open();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('records', mode), request = action(tx.objectStore('records'));
        tx.oncomplete = () => resolve(request?.result); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error);
      });
    }
    function enqueue(action) { queue = queue.then(action).catch(() => warnings.add('Diagnostic persistence unavailable; records from this page are still included.')); }
    function limited(value, path = '', cuts = []) {
      if (typeof value === 'string' && value.length > TEXT_LIMIT) { cuts.push({ path, originalCharacters: value.length, retainedCharacters: TEXT_LIMIT }); return value.slice(0, TEXT_LIMIT); }
      if (Array.isArray(value)) return value.map((v, i) => limited(v, path + '[' + i + ']', cuts));
      if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, limited(v, path + '.' + k, cuts)]));
      return value;
    }
    function trim(records) {
      const sorted = records.sort((a, b) => b.at - a.at), keep = [], remove = []; let bytes = 0;
      for (const r of sorted) { if (keep.length < MAX_RECORDS && bytes + r.size <= LIMIT) { keep.push(r); bytes += r.size; } else remove.push(r); }
      return { keep, remove };
    }
    function put(value) {
      const cuts = [], safe = limited(sanitize(value), '', cuts); safe.truncatedFields = [...(value.truncatedFields || []), ...cuts];
      const record = { id: safe.id, projectId: safe.projectId, at: clock(), value: safe, size: JSON.stringify(safe).length * 2 };
      memory.set(record.id, record);
      for (const old of trim([...memory.values()]).remove) { memory.delete(old.id); dropped++; }
      enqueue(() => transaction('readwrite', store => store.put(record)));
    }
    function begin(value, key) { rememberSecret(key); put({ ...value, startedAt: new Date(clock()).toISOString(), status: 'running', events: [] }); return value.id; }
    function update(id, patch) { const old = memory.get(id)?.value; if (old) put({ ...old, ...patch }); }
    function event(id, event) {
      const old = memory.get(id)?.value; if (!old) return;
      const { type, ...details } = event;
      update(id, { [type]: details, events: [...old.events.slice(-39), { type, at: new Date(clock()).toISOString() }] });
    }
    function finish(id, patch) {
      update(id, { ...patch, endedAt: new Date(clock()).toISOString() });
    }
    function prune() {
      enqueue(async () => {
        const records = await transaction('readonly', s => s.getAll());
        const remove = trim(records.filter(r => r.id !== '__retention__')).remove;
        if (!remove.length) return;
        const meta = records.find(r => r.id === '__retention__')?.value || { evicted: 0 };
        await transaction('readwrite', store => { for (const r of remove) store.delete(r.id); return store.put({ id: '__retention__', value: { evicted: meta.evicted + remove.length } }); });
      });
    }
    async function bundle({ project, config, ui, metrics, build }) {
      rememberSecret(config?.apiKey); prune(); await queue;
      let stored = [];
      try { stored = await transaction('readonly', s => s.getAll()); } catch (_) { warnings.add('No persisted diagnostic history could be read.'); }
      const merged = new Map(stored.filter(r => r.projectId === project.id).map(r => [r.id, r.value]));
      for (const r of memory.values()) if (r.projectId === project.id) merged.set(r.id, r.value);
      const records = [...merged.values()].sort((a, b) => a.startedAt.localeCompare(b.startedAt));
      return sanitize({
        format: VERSION, exportedAt: new Date(clock()).toISOString(), build,
        privacy: 'Contains debate text, all current-session rounds and model replies. Known credentials and credential fields are redacted. No cookies or browser storage dump.',
        environment: { userAgent: global.navigator?.userAgent, language: global.navigator?.language, online: global.navigator?.onLine, embedded: global.parent !== global, protocol: global.location?.protocol },
        coverage: { scope: 'current session, all its rounds (not other debate sessions)', roundRecords: 'Complete current project snapshot, including every batch, input snapshot, sample, aggregate, framing run, analysis and edit history. Older builds may not have captured all inputs.', requestHistory: 'Supplementary request metadata is available only after this build; retries have separate request IDs. Running records without an end may indicate interruption.', retention: { maxRecords: MAX_RECORDS, maxBytes: LIMIT, maxTextCharacters: TEXT_LIMIT, persistedEvictions: stored.find(r => r.id === '__retention__')?.value?.evicted || 0, memoryEvictions: dropped }, warnings: [...warnings] },
        config, ui, metrics, project, records
      });
    }
    return Object.freeze({ begin, event, update, finish, prune, bundle, sanitize, rememberSecret });
  }
  const api = Object.freeze({ create });
  if (typeof module === 'object' && module.exports) module.exports = api;
  global.DUG_DIAGNOSTICS = api;
})(typeof window === 'object' ? window : globalThis);
