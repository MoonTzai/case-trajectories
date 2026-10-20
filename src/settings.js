(function (global) {
  'use strict';
  const P = global.DUG_PROVIDERS || (typeof require === 'function' ? require('./providers.js') : null);
  const clone = value => JSON.parse(JSON.stringify(value));
  const DEFAULT_KEY = 'dug.workbench.connection.v1';
  function fail(message) { const e = new Error(message); e.name = 'SettingsError'; return e; }
  function inferProvider(endpoint) {
    try { const base = P.normalizeEndpoint(endpoint); return P.presets.find(p => p.endpoint === base)?.id || 'custom'; }
    catch (_) { return 'custom'; }
  }
  function createAdapter({ storage, key = DEFAULT_KEY, onSave } = {}) {
    const keys = new Map();
    let activeProvider = 'custom';
    let profiles = Object.fromEntries(P.presets.map(p => [p.id, P.sanitizeProfile({ provider: p.id, maxTokens: p.maxTokens })]));
    let recovery = '';
    const payload = (nextProfiles = profiles, nextActive = activeProvider) => ({ version: 2, budgetRevision: 1, activeProvider: nextActive, profiles: clone(nextProfiles) });
    const scope = (provider, endpoint) => {
      P.getPreset(provider);
      try { return provider + '|' + P.normalizeEndpoint(endpoint); } catch (_) { return null; }
    };
    const getKey = (provider, endpoint) => keys.get(scope(provider, endpoint)) || '';
    function setKey(provider, endpoint, value) {
      const normalized = P.normalizeKey(value), id = scope(provider, endpoint);
      if (!id && normalized) throw fail('请先填写有效的 API 地址，再输入密钥');
      if (id) { if (normalized) keys.set(id, normalized); else keys.delete(id); }
      return normalized;
    }
    function configOf(profile) {
      return { provider: profile.provider, endpoint: profile.endpoint, model: profile.model, apiKey: getKey(profile.provider, profile.endpoint), extra: P.mergeExtra(profile.provider, profile), jsonMode: profile.jsonMode, stream: profile.stream !== false };
    }
    let raw;
    try { raw = storage?.getItem(key); } catch (_) { recovery = '无法读取本机设置；仍可在当前页面填写。'; }
    if (raw) {
      try {
        if (raw.length > 100000) throw fail('设置文件过大');
        const parsed = JSON.parse(raw);
        if (parsed?.version === 2 && parsed.profiles && typeof parsed.profiles === 'object') {
          for (const preset of P.presets) {
            const candidate = parsed.profiles[preset.id];
            if (!candidate) continue;
            try { const safe = P.sanitizeProfile({ ...candidate, provider: preset.id }); P.mergeExtra(preset.id, safe); profiles[preset.id] = safe; }
            catch (_) { recovery = '部分旧设置无效，已恢复该供应商默认值。'; }
          }
          if (P.presets.some(p => p.id === parsed.activeProvider)) activeProvider = parsed.activeProvider;
        } else if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          activeProvider = inferProvider(parsed.endpoint);
          const safe = P.sanitizeProfile({ ...parsed, provider: activeProvider });
          P.mergeExtra(activeProvider, safe); profiles[activeProvider] = safe;
        } else throw fail('设置格式无效');
        const ds = profiles.deepseek;
        if (!parsed.budgetRevision && ds.maxTokens === 8192 && ds.endpoint === P.getPreset('deepseek').endpoint && /^(deepseek-flash|deepseek-v4-flash|deepseek-v4-flash-vision-exp|deepseek-v4-pro)$/.test(ds.model) && !('max_tokens' in ds.extra) && !('max_completion_tokens' in ds.extra)) {
          ds.maxTokens = 393216;
          recovery = '已将 DeepSeek 旧版预填的 8192 输出上限更新为 393216（384K）；1M 是上下文容量。上限不代表实际消耗，可在模型设置中调低。';
        }
      } catch (_) { recovery = '旧模型设置无法读取，已恢复默认值。'; }
      // Rewrite the whitelist even on recovery, removing legacy secret fields.
      try { storage?.setItem(key, JSON.stringify(payload())); }
      catch (_) { recovery = '无法更新本机设置；请在保存时重试。'; }
    }
    function save(profile, apiKey = '', otherProfiles = []) {
      const safe = P.sanitizeProfile(profile);
      if (!safe.endpoint || !safe.model) throw fail('请填写 API 地址和模型名称');
      P.mergeExtra(safe.provider, safe);
      const normalizedKey = P.normalizeKey(apiKey);
      const next = clone(profiles);
      for (const candidate of otherProfiles) {
        const item = P.sanitizeProfile(candidate); P.mergeExtra(item.provider, item); next[item.provider] = item;
      }
      next[safe.provider] = safe;
      try { storage?.setItem(key, JSON.stringify(payload(next, safe.provider))); }
      catch (_) { throw fail('本机设置保存失败；配置尚未更改，请检查浏览器存储空间'); }
      profiles = next; activeProvider = safe.provider; setKey(safe.provider, safe.endpoint, normalizedKey);
      const config = configOf(safe);
      if (typeof onSave === 'function') onSave(clone(config));
      return config;
    }
    return Object.freeze({
      getConfig: () => configOf(profiles[activeProvider]),
      getProfile: provider => clone(profiles[provider || activeProvider] || P.getPreset(provider)),
      getState: () => payload(), getRecovery: () => recovery,
      getKey, setKey, save
    });
  }
  function create(options = {}) {
    if (!P) throw fail('供应商模块尚未加载');
    const doc = global.document, dialog = doc.getElementById('settings-dialog');
    if (!dialog) throw fail('找不到模型设置窗口');
    const adapter = createAdapter({ ...options, storage: options.storage || global.localStorage });
    dialog.innerHTML = `<style>
      #settings-dialog{width:680px}#settings-dialog .provider-note{margin:-5px 0 18px;line-height:1.8;font-size:11px;color:var(--muted)}
      #settings-dialog .provider-note a{margin-left:7px;color:var(--teal)}#settings-dialog .model-query-row{display:flex;gap:8px;align-items:center;margin-bottom:10px}
      #settings-dialog .model-query-row .btn{flex:none}#settings-dialog #model-search{padding:9px 11px;min-width:0;flex:1;width:100%;font-size:12px}
      #settings-dialog #model-picker{padding:7px;width:100%;font-size:12px;line-height:1.7;min-height:82px;max-height:145px}
      #settings-dialog #model-picker option{padding:5px;white-space:normal;overflow-wrap:anywhere}#settings-dialog #model-query-status{min-height:22px;margin:7px 0 16px}
      #settings-dialog .model-reference{font-size:10px;color:var(--muted);margin-top:5px}#settings-dialog #thinking-note{margin:-8px 0 15px}
      #settings-dialog .settings-query-error{color:var(--danger)}@media(max-width:520px){#settings-dialog .model-query-row{flex-wrap:wrap}}
    </style><form id="settings-form">
      <div class="dialog-heading"><div><span class="eyebrow">MODEL CONNECTION</span><h2>模型设置</h2></div><button type="button" data-settings-close class="icon-button" aria-label="关闭">×</button></div>
      <p class="dialog-intro">选择供应商，再确认地址与型号。只有点击查询或生成时才会联网；密钥只保留在当前页面。</p>
      <label class="field">供应商<select id="api-provider"></select></label>
      <p class="provider-note"><span id="provider-hint"></span><a id="provider-docs" target="_blank" rel="noopener noreferrer">官方说明 ↗</a></p>
      <label class="field">API 地址<input id="endpoint" type="url" placeholder="https://your-provider.example/v1" autocomplete="off" required></label>
      <div class="form-grid"><label class="field">模型名称<input id="api-model" placeholder="可手动填写模型 ID" autocomplete="off" required></label><label class="field">API Key<input id="api-key" type="password" placeholder="当前供应商与端点，仅本页保留" autocomplete="off"></label></div>
      <div class="model-query-row"><button type="button" class="btn outline" id="query-models">查询可用模型</button><input id="model-search" type="search" aria-label="筛选模型" placeholder="筛选模型名称或提供方" autocomplete="off"></div>
      <select id="model-picker" size="4" aria-label="模型列表"></select><p class="model-reference" id="model-list-source"></p>
      <p id="model-query-status" class="field-note" role="status" aria-live="polite"></p>
      <div class="form-grid"><label class="field">输出上限（可选）<input id="output-budget" type="number" min="1" max="1048576" step="1" placeholder="留空使用服务默认"></label><label class="field">思考模式<select id="thinking-mode"><option value="default">模型默认</option><option value="on">开启思考</option><option value="off">关闭思考</option></select></label></div>
      <p class="field-note" id="output-budget-note">输出上限不是上下文容量，也不是每次必用的 Token 数。DeepSeek 预填 393216（384K），适配 1M 上下文；思考可能占用输出预算。持续接收数据时不会因总耗时超过 120 秒而停止。</p>
      <p class="field-note" id="thinking-note"></p>
      <details class="advanced-settings"><summary>高级请求参数</summary><label class="check-line"><input id="stream-mode" type="checkbox" checked> 流式接收（显示实时输出统计）</label><label class="check-line"><input id="json-mode" type="checkbox"> 请求 JSON 输出模式（接口需支持）</label><label class="field">额外参数 JSON<textarea id="extra-json" rows="4" spellcheck="false" placeholder='例如 {"temperature": 0.7}'>{}</textarea></label><p class="field-note">手填参数不能与上方输出上限或思考控件重复。清空输出上限则使用服务默认值。仅保存地址、型号和允许的请求参数；密钥不会写入本机存储。</p></details>
      <div id="settings-error" class="form-error" role="alert"></div><div class="dialog-footer"><button type="button" data-settings-close class="btn quiet">取消</button><button class="btn primary" type="submit">保存设置</button></div>
    </form>`;
    const $ = id => doc.getElementById(id), drafts = new Map();
    let provider = adapter.getConfig().provider, keyEndpoint = '', queryController = null, queryEpoch = 0, models = [], queried = false;
    for (const preset of P.presets) { const item = doc.createElement('option'); item.value = preset.id; item.textContent = preset.name; $('api-provider').append(item); }
    const showError = message => { $('settings-error').textContent = message || ''; };
    function queryStatus(message, isError = false) { $('model-query-status').textContent = message; $('model-query-status').classList.toggle('settings-query-error', isError); }
    function abortQuery(message = '') {
      queryEpoch++; if (queryController) queryController.abort(); queryController = null;
      $('query-models').textContent = '查询可用模型';
      if (message) queryStatus(message);
    }
    function rawProfile() {
      return { provider, endpoint: $('endpoint').value.trim(), model: $('api-model').value.trim(), thinking: $('thinking-mode').value, maxTokens: $('output-budget').value, jsonMode: $('json-mode').checked, stream: $('stream-mode').checked, extraText: $('extra-json').value };
    }
    function parseProfile(raw) {
      let extra;
      try { extra = JSON.parse(raw.extraText || '{}'); } catch (_) { throw fail(P.getPreset(raw.provider).name + ' 的额外参数不是有效 JSON'); }
      return P.sanitizeProfile({ ...raw, extra });
    }
    function remember() { drafts.set(provider, rawProfile()); }
    function renderModels() {
      const search = $('model-search').value.trim().toLowerCase();
      $('model-picker').replaceChildren();
      const filtered = models.filter(m => (m.id + ' ' + (m.ownedBy || '')).toLowerCase().includes(search));
      for (const model of filtered) { const item = doc.createElement('option'); item.value = model.id; item.textContent = model.id + (model.ownedBy ? ' · ' + model.ownedBy : ''); item.selected = model.id === $('api-model').value; $('model-picker').append(item); }
      $('model-picker').disabled = !filtered.length;
      $('model-list-source').textContent = queried ? `接口返回 ${models.length} 个型号；当前显示 ${filtered.length} 个。列表可能含非文本型号，需自行确认 Chat Completions 支持。` : `预置参考型号 ${models.length} 个，未验证当前账户权限。也可直接手填型号。`;
    }
    function updateThinking() {
      const preset = P.getPreset(provider), model = $('api-model').value.trim(), known = preset.models.includes(model);
      const always = provider === 'glm' && known || provider === 'kimi' && model === 'kimi-k3';
      $('thinking-mode').options[1].textContent = always ? '较高强度' : '开启思考';
      $('thinking-mode').options[2].textContent = always ? '最低强度（不能关闭）' : '关闭思考';
      $('thinking-note').textContent = !known ? '此型号未预设思考参数。请选择“模型默认”，需要时按官方文档在高级参数中手填。' : always ? '该型号始终思考；本工具将两档映射为 high / low。模型默认不发送此参数。' : '模型默认不额外发送思考参数；开启与关闭按当前预置型号的官方接口映射。';
    }
    function refreshQueryButton() {
      let canQuery = false;
      try { canQuery = P.canQueryModels({ provider, endpoint: $('endpoint').value.trim() }); } catch (_) {}
      $('query-models').disabled = !canQuery;
      $('query-models').title = canQuery ? '向当前 API 地址发送一次 GET /models' : '请填写有效地址；GLM 官方列表接口未核实，可手填型号';
    }
    function loadProvider(next) {
      provider = next; const preset = P.getPreset(provider), saved = drafts.get(provider) || adapter.getProfile(provider);
      $('api-provider').value = provider; $('endpoint').value = saved.endpoint; $('api-model').value = saved.model;
      $('output-budget').value = saved.maxTokens; $('thinking-mode').value = saved.thinking; $('json-mode').checked = saved.jsonMode; $('stream-mode').checked = saved.stream !== false;
      $('extra-json').value = saved.extraText == null ? JSON.stringify(saved.extra, null, 2) : saved.extraText;
      keyEndpoint = saved.endpoint; $('api-key').value = adapter.getKey(provider, keyEndpoint);
      $('provider-hint').textContent = preset.hint; $('provider-docs').hidden = !preset.docsUrl;
      if (preset.docsUrl) $('provider-docs').href = preset.docsUrl; else $('provider-docs').removeAttribute('href');
      models = preset.models.map(id => ({ id })); queried = false; $('model-search').value = '';
      renderModels(); updateThinking(); refreshQueryButton(); queryStatus(''); showError('');
    }
    $('api-provider').addEventListener('change', () => { remember(); abortQuery(); loadProvider($('api-provider').value); });
    $('endpoint').addEventListener('input', () => {
      abortQuery('地址已更改；查询将使用当前地址。');
      const nextEndpoint = $('endpoint').value.trim();
      if (nextEndpoint !== keyEndpoint) { keyEndpoint = nextEndpoint; $('api-key').value = adapter.getKey(provider, keyEndpoint); }
      models = P.getPreset(provider).models.map(id => ({ id })); queried = false; renderModels(); refreshQueryButton();
    });
    $('api-key').addEventListener('input', () => {
      abortQuery('密钥已更改，需重新点击查询。');
      try { adapter.setKey(provider, keyEndpoint, $('api-key').value); showError(''); } catch (e) { showError(e.message); }
    });
    $('api-model').addEventListener('input', updateThinking);
    $('model-search').addEventListener('input', renderModels);
    $('model-picker').addEventListener('change', () => { if ($('model-picker').value) { $('api-model').value = $('model-picker').value; updateThinking(); } });
    $('query-models').addEventListener('click', async () => {
      if (queryController) { abortQuery('已停止查询，可手填型号。'); return; }
      let config;
      try { config = { provider, endpoint: P.normalizeEndpoint($('endpoint').value.trim()), apiKey: P.normalizeKey($('api-key').value) }; }
      catch (e) { queryStatus(e.message, true); return; }
      const epoch = ++queryEpoch, controller = new AbortController(); queryController = controller;
      $('query-models').textContent = '停止查询'; queryStatus('正在查询当前接口的模型列表…');
      try {
        const result = await P.queryModels(config, { signal: controller.signal });
        if (epoch !== queryEpoch || !dialog.open) return;
        models = result; queried = true; renderModels(); queryStatus(result.length ? '查询完成。选择型号会填入上方模型名称。' : '接口未返回可识别型号，仍可手动填写。');
      } catch (e) {
        if (epoch !== queryEpoch || !dialog.open) return;
        queryStatus(e.name === 'AbortError' ? '已停止查询，可手填型号。' : e.message, e.name !== 'AbortError');
      } finally { if (epoch === queryEpoch) { queryController = null; $('query-models').textContent = '查询可用模型'; refreshQueryButton(); } }
    });
    function close() { remember(); abortQuery(); if (dialog.open) dialog.close(); }
    for (const button of dialog.querySelectorAll('[data-settings-close]')) button.addEventListener('click', close);
    dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
    dialog.addEventListener('close', () => abortQuery());
    $('settings-form').addEventListener('submit', event => {
      event.preventDefault(); remember();
      try {
        const selected = parseProfile(drafts.get(provider));
        const others = [...drafts.values()].filter(p => p.provider !== provider).map(parseProfile);
        adapter.save(selected, $('api-key').value, others); showError(''); close();
      } catch (e) { showError(e.message); }
    });
    return Object.freeze({
      open() { abortQuery(); loadProvider(adapter.getConfig().provider); if (!dialog.open) dialog.showModal(); if (adapter.getRecovery()) showError(adapter.getRecovery()); },
      getConfig: () => adapter.getConfig(), close
    });
  }
  const api = Object.freeze({ create, createAdapter, inferProvider }); global.DUG_SETTINGS = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
