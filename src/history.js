/* Independent local history snapshots. No network access and no automatic retention limit. */
(function (global) {
  'use strict';
  const INDEX = 'dug.workbench.history.v1.index';
  const PREFIX = 'dug.workbench.history.v1.project:';
  const LEGACY_CURRENT = 'dug.workbench.v1';
  const LEGACY_ARCHIVES = 'dug.workbench.archives.v1';
  const clone = value => JSON.parse(JSON.stringify(value));
  const iso = () => new Date().toISOString();
  const revision = () => global.crypto?.randomUUID?.() || Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
  function text(value, name, max = 100000) {
    if (typeof value !== 'string' || value.length > max) throw new Error(name + '格式无效');
    return value;
  }
  function idText(value) {
    const result = text(value, '会话 ID', 200).trim();
    if (!result) throw new Error('会话 ID 不能为空');
    return result;
  }
  function titleText(value) {
    const result = text(value, '会话标题', 500).trim();
    if (!result) throw new Error('会话标题不能为空');
    return result;
  }
  function storageError(action, cause) {
    const error = new Error('历史会话' + action + '失败；未自动删除或淘汰其他会话。请导出当前项目，并检查浏览器本地存储空间。');
    error.code = 'HISTORY_STORAGE_FAILED';
    error.cause = cause;
    return error;
  }
  function createStore(options) {
    const { storage, serialize, deserialize } = options || {};
    if (!storage || !['getItem', 'setItem', 'removeItem'].every(method => typeof storage[method] === 'function')) throw new Error('需要可用的本地存储');
    if (typeof serialize !== 'function' || typeof deserialize !== 'function') throw new Error('需要项目规范序列化与反序列化函数');
    function read(key) {
      try { return storage.getItem(key); } catch (error) { throw storageError('读取', error); }
    }
    function write(key, value) {
      try { storage.setItem(key, value); } catch (error) { throw storageError('保存', error); }
    }
    function emptyIndex() { return { version: 1, entries: [], legacyImported: [] }; }
    function readIndex() {
      const raw = read(INDEX);
      if (raw === null) return emptyIndex();
      let value;
      try { value = JSON.parse(raw); } catch (_) { throw new Error('历史索引无法读取；已有记录未被覆盖。'); }
      if (!value || value.version !== 1 || !Array.isArray(value.entries) || !Array.isArray(value.legacyImported)) throw new Error('历史索引版本或结构无效；已有记录未被覆盖。');
      const seen = new Set();
      const entries = value.entries.map(meta => {
        if (!meta || typeof meta !== 'object' || Array.isArray(meta)) throw new Error('历史记录索引无效');
        const id = idText(meta.id);
        if (seen.has(id)) throw new Error('历史索引中存在重复会话 ID');
        seen.add(id);
        const snapshotKey = text(meta.snapshotKey, '快照索引', 1000);
        if (!snapshotKey.startsWith(PREFIX + encodeURIComponent(id) + ':')) throw new Error('历史快照索引与会话 ID 不匹配');
        const counts = {};
        for (const key of ['arguments', 'roots', 'directions', 'analyses', 'saved', 'samples', 'completeSamples']) {
          const count = meta.counts?.[key];
          if (!Number.isInteger(count) || count < 0) throw new Error('历史摘要计数无效');
          counts[key] = count;
        }
        return { id, title: titleText(meta.title), motion: text(meta.motion, '辩题'), pro: text(meta.pro, '正方'), con: text(meta.con, '反方'), side: meta.side === 'con' ? 'con' : 'pro', mode: meta.mode === 'live' ? 'live' : 'demo', createdAt: text(meta.createdAt, '创建时间', 100), updatedAt: text(meta.updatedAt, '更新时间', 100), counts, snapshotKey };
      });
      return { version: 1, entries, legacyImported: [...new Set(value.legacyImported.map(idText))] };
    }
    function metadata(project, previous, options, snapshotKey) {
      const samples = project.batches.flatMap(batch => batch.samples);
      const count = key => project[key].filter(node => !node.archived).length;
      return {
        id: idText(project.id),
        title: options.title === undefined ? previous?.title || project.context.motion.trim().slice(0, 160) || '未命名辩题' : titleText(options.title),
        motion: project.context.motion, pro: project.context.pro, con: project.context.con, side: project.context.side,
        mode: project.mode, createdAt: project.createdAt, updatedAt: options.updatedAt || project.updatedAt || iso(),
        counts: { arguments: count('arguments'), roots: count('roots'), directions: count('directions'), analyses: project.analyses.length, saved: project.saved.length, samples: samples.length, completeSamples: samples.filter(sample => sample.status === 'complete').length },
        snapshotKey
      };
    }
    function storeProject(project, options = {}, legacyId = null) {
      // Always traverse the provided project whitelist before deriving metadata or writing any byte.
      const raw = serialize(project);
      if (typeof raw !== 'string') throw new Error('项目序列化结果必须是文本');
      const clean = deserialize(raw);
      const index = readIndex();
      const previous = index.entries.find(meta => meta.id === clean.id);
      const snapshotKey = PREFIX + encodeURIComponent(idText(clean.id)) + ':' + revision();
      const meta = metadata(clean, previous, options, snapshotKey);
      index.entries = index.entries.filter(item => item.id !== meta.id).concat(meta);
      if (legacyId && !index.legacyImported.includes(legacyId)) index.legacyImported.push(legacyId);
      write(snapshotKey, raw);
      try { write(INDEX, JSON.stringify(index)); }
      catch (error) {
        // The old index still points to the old snapshot. Only remove this uncommitted write.
        try { storage.removeItem(snapshotKey); } catch (_) { error.uncommittedSnapshotKey = snapshotKey; }
        throw error;
      }
      // Commit is complete. Cleanup failure leaves an orphan, never an unreadable old session.
      if (previous && previous.snapshotKey !== snapshotKey) {
        try { storage.removeItem(previous.snapshotKey); } catch (_) { /* Safe to leave the superseded snapshot. */ }
      }
      return clone(meta);
    }
    function list({ query = '' } = {}) {
      const needle = text(query, '搜索词', 1000).trim().normalize('NFKC').toLocaleLowerCase();
      return readIndex().entries.filter(meta => !needle || [meta.title, meta.motion, meta.pro, meta.con].some(value => value.normalize('NFKC').toLocaleLowerCase().includes(needle)))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id)).map(clone);
    }
    function load(id) {
      const meta = readIndex().entries.find(item => item.id === idText(id));
      if (!meta) return null;
      const raw = read(meta.snapshotKey);
      if (raw === null) throw new Error('历史会话快照缺失；索引仍保留，请检查导出的备份。');
      const project = deserialize(raw);
      if (project.id !== meta.id) throw new Error('历史快照内容与会话 ID 不匹配');
      return project;
    }
    function rename(id, title) {
      const index = readIndex();
      const meta = index.entries.find(item => item.id === idText(id));
      if (!meta) return null;
      meta.title = titleText(title);
      meta.updatedAt = iso();
      write(INDEX, JSON.stringify(index));
      return clone(meta);
    }
    function remove(id) {
      const index = readIndex();
      const meta = index.entries.find(item => item.id === idText(id));
      if (!meta) return false;
      const previous = JSON.stringify(index);
      index.entries = index.entries.filter(item => item.id !== meta.id);
      // Preserve migration tombstones; a deleted legacy session must not reappear next launch.
      write(INDEX, JSON.stringify(index));
      try { storage.removeItem(meta.snapshotKey); }
      catch (cause) {
        const error = storageError('删除', cause);
        try { write(INDEX, previous); } catch (rollbackError) { error.rollbackError = rollbackError; }
        throw error;
      }
      return true;
    }
    function migrateLegacy(currentRaw, archivesRaw) {
      const result = { imported: 0, skipped: 0, errors: [] };
      const candidates = new Map();
      const push = (raw, source, title, at, current = false) => {
        let project;
        try {
          if (typeof raw !== 'string') throw new Error('旧快照缺少完整项目文本');
          project = deserialize(raw);
          // Validation of all metadata precedes any migration write.
          if (title !== undefined) title = titleText(title);
          const previous = candidates.get(project.id);
          const updatedAt = project.updatedAt || at || project.createdAt;
          if (!previous || current || !previous.current && updatedAt > previous.updatedAt) candidates.set(project.id, { project, source, title, updatedAt, current });
          else result.skipped++;
        } catch (error) { result.errors.push({ source, id: project?.id || '', message: error.message }); }
      };
      const archiveText = archivesRaw === undefined ? read(LEGACY_ARCHIVES) : archivesRaw;
      if (archiveText) {
        try {
          const archives = JSON.parse(archiveText);
          if (!Array.isArray(archives)) throw new Error('旧历史列表必须是数组');
          archives.forEach((entry, i) => push(entry?.data, 'archive:' + i, entry?.title || undefined, entry?.at));
        } catch (error) { result.errors.push({ source: 'archives', id: '', message: error.message }); }
      }
      const currentText = currentRaw === undefined ? read(LEGACY_CURRENT) : currentRaw;
      if (currentText) push(currentText, 'current', undefined, undefined, true);
      for (const candidate of [...candidates.values()].sort((a, b) => Number(b.current) - Number(a.current) || b.updatedAt.localeCompare(a.updatedAt))) {
        try {
          const index = readIndex();
          const id = candidate.project.id;
          if (index.legacyImported.includes(id)) { result.skipped++; continue; }
          if (index.entries.some(meta => meta.id === id)) {
            // Existing new-format state wins over a possibly stale legacy copy.
            index.legacyImported.push(id);
            write(INDEX, JSON.stringify(index));
            result.skipped++;
            continue;
          }
          storeProject(candidate.project, { title: candidate.title, updatedAt: candidate.updatedAt }, id);
          result.imported++;
        } catch (error) {
          error.migration = clone(result);
          throw error;
        }
      }
      return result;
    }
    return Object.freeze({ list, save: storeProject, load, rename, remove, migrateLegacy, export(id) { const project = load(id); return project ? serialize(project) : null; } });
  }
  const api = Object.freeze({ createStore, keys: Object.freeze({ index: INDEX, projectPrefix: PREFIX, legacyCurrent: LEGACY_CURRENT, legacyArchives: LEGACY_ARCHIVES }) });
  global.DUG_HISTORY = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
