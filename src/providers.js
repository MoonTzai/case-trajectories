/* Public provider defaults checked 2026-10-19; see docs/provider-defaults.md. */
(function (global) {
  'use strict';
  const presets = Object.freeze([
    { id: 'deepseek', name: 'DeepSeek', endpoint: 'https://api.deepseek.com', model: 'deepseek-flash', models: ['deepseek-flash', 'deepseek-v4-pro'], modelsEndpoint: 'https://api.deepseek.com/models', docsUrl: 'https://api-docs.deepseek.com/', hint: '使用 DeepSeek API Key。思考开关映射为 thinking；模型与地址可手动修改。' },
    { id: 'glm', name: '智谱 GLM', endpoint: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-5.3-flash', models: ['glm-5.3-flash', 'glm-5.3-flashx', 'glm-5.3'], modelsEndpoint: null, docsUrl: 'https://docs.bigmodel.cn/cn/guide/models/vlm/glm-5.3-flash', hint: '使用模型标准 API Key；Coding Plan 凭据不等于普通 API 权限。GLM-5.3 始终思考，“关闭”对应最低强度。官方模型查询接口未核实，可手填型号。' },
    { id: 'kimi', name: 'Kimi / Moonshot 中国站', endpoint: 'https://api.moonshot.cn/v1', model: 'kimi-k3', models: ['kimi-k3', 'kimi-k2.6'], modelsEndpoint: 'https://api.moonshot.cn/v1/models', docsUrl: 'https://platform.kimi.com/docs/api/models-overview', hint: '使用中国站 API Key，不能与国际站混用。K3 始终思考，“关闭”对应最低强度；K2.6 支持关闭。' },
    { id: 'openai', name: 'OpenAI', endpoint: 'https://api.openai.com/v1', model: 'gpt-5.4-mini', models: ['gpt-5.4-mini', 'gpt-5.4-mini-2026-03-17'], modelsEndpoint: 'https://api.openai.com/v1/models', docsUrl: 'https://developers.openai.com/api/docs/models/gpt-5.4-mini', hint: '预填已核实支持 Chat Completions 的 GPT-5.4 mini。ChatGPT / Codex 中可用不代表当前 API Key 有权限；查询结果仍须符合本工具的文本接口。' },
    { id: 'custom', name: '自定义 OpenAI 兼容接口', endpoint: '', model: '', models: [], modelsEndpoint: null, docsUrl: '', hint: '填写服务提供方的 Base URL（通常含 /v1）或完整 /chat/completions 地址。查询尝试当前地址的 /models；不支持查询时仍可手填型号。' }
  ].map(p => Object.freeze({ ...p, models: Object.freeze(p.models), thinking: 'default', maxTokens: p.id === 'custom' ? '' : p.id === 'deepseek' ? 393216 : 8192 })));
  function error(message, code = 'configuration') { const e = new Error(message); e.name = 'ProviderError'; e.code = code; return e; }
  function text(value, label, max = 2000) { if (typeof value !== 'string' || value.length > max || /[\u0000-\u001f\u007f]/.test(value)) throw error(label + '格式无效'); return value.trim(); }
  function getPreset(id) { const result = presets.find(p => p.id === id); if (!result) throw error('未知供应商'); return result; }
  function normalizeKey(value = '') {
    let key = text(value, 'API Key', 2000);
    for (let i = 0; i < 3; i++) {
      const quote = { '"': '"', "'": "'", '“': '”', '‘': '’', '`': '`' };
      if (key.length > 1 && quote[key[0]] === key.at(-1)) key = key.slice(1, -1).trim();
      key = key.replace(/^Bearer\s+/i, '').trim();
    }
    if (/[^\x21-\x7e]/.test(key)) throw error('API Key 含内部空白或非英文字符，请重新复制');
    return key;
  }
  function normalizeEndpoint(value) {
    let url;
    try { url = new URL(text(value, 'API 地址')); } catch (_) { throw error('请填写有效的 API 地址'); }
    if (url.username || url.password || url.search || url.hash) throw error('API 地址不能包含凭据、查询参数或片段');
    if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname.toLowerCase()))) throw error('API 地址需使用 HTTPS；本机 localhost 可使用 HTTP');
    url.pathname = url.pathname.replace(/\/+$/, '').replace(/\/(chat\/completions|models)$/i, '').replace(/\/+$/, '');
    return url.href.replace(/\/+$/, '');
  }
  function resolveModelsUrl(endpoint) { return normalizeEndpoint(endpoint) + '/models'; }
  function canQueryModels(config) {
    const preset = getPreset(config.provider || 'custom');
    return !!config.endpoint && !(preset.id === 'glm' && normalizeEndpoint(config.endpoint) === preset.endpoint);
  }
  function sanitizeExtra(value = {}) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw error('额外参数必须是 JSON 对象');
    const output = {};
    for (const [name, val] of Object.entries(value)) {
      if (['max_tokens', 'max_completion_tokens'].includes(name)) {
        if (!Number.isSafeInteger(val) || val < 1 || val > 1048576) throw error('输出上限须为 1–1048576 的整数');
        output[name] = val;
      } else if (['temperature', 'top_p', 'presence_penalty', 'frequency_penalty'].includes(name)) {
        const min = name.endsWith('penalty') ? -2 : 0, max = name === 'top_p' ? 1 : 2;
        if (typeof val !== 'number' || !Number.isFinite(val) || val < min || val > max) throw error(name + '超出有效范围');
        output[name] = val;
      } else if (name === 'seed') {
        if (!Number.isSafeInteger(val)) throw error('seed 必须为整数'); output[name] = val;
      } else if (name === 'reasoning_effort') {
        if (!['none', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'].includes(val)) throw error('reasoning_effort 无效'); output[name] = val;
      } else if (name === 'enable_thinking') {
        if (typeof val !== 'boolean') throw error('enable_thinking 必须为布尔值'); output[name] = val;
      } else if (name === 'thinking') {
        if (!val || typeof val !== 'object' || Array.isArray(val) || !['enabled', 'disabled', 'adaptive'].includes(val.type) || Object.keys(val).some(k => !['type', 'budget_tokens'].includes(k))) throw error('thinking 仅允许 type 和可选 budget_tokens');
        output[name] = { type: val.type };
        if (val.budget_tokens !== undefined) {
          if (!Number.isSafeInteger(val.budget_tokens) || val.budget_tokens < 1 || val.budget_tokens > 1000000) throw error('thinking.budget_tokens 无效');
          output[name].budget_tokens = val.budget_tokens;
        }
      } else throw error('不支持额外参数：' + name.slice(0, 60));
    }
    if (output.max_tokens !== undefined && output.max_completion_tokens !== undefined) throw error('两种输出上限不可同时填写');
    return output;
  }
  function makeExtra(provider, settings = {}) {
    const preset = getPreset(typeof provider === 'object' ? provider.id : provider);
    const model = text(settings.model == null ? preset.model : settings.model, '模型名称', 200);
    const mode = settings.thinking || 'default';
    if (!['default', 'on', 'off'].includes(mode)) throw error('思考模式无效');
    const result = {}, isKnown = preset.models.includes(model);
    if (mode !== 'default') {
      if (!isKnown || preset.id === 'custom') throw error('此型号的思考参数未预设，请选择“模型默认”并按服务文档填写额外参数');
      if (preset.id === 'deepseek') result.thinking = { type: mode === 'off' ? 'disabled' : 'enabled' };
      else if (preset.id === 'openai') result.reasoning_effort = mode === 'off' ? 'none' : 'medium';
      else if (preset.id === 'kimi' && model === 'kimi-k2.6') result.thinking = { type: mode === 'off' ? 'disabled' : 'enabled' };
      else if (preset.id === 'kimi' || preset.id === 'glm') result.reasoning_effort = mode === 'off' ? 'low' : 'high';
    }
    if (settings.maxTokens != null && String(settings.maxTokens).trim() !== '') {
      const budget = Number(settings.maxTokens);
      if (!Number.isSafeInteger(budget) || budget < 1 || budget > 1048576) throw error('输出上限须为 1–1048576 的整数');
      const knownMax = preset.id === 'openai' ? 128000 : preset.id === 'glm' ? 131072 : preset.id === 'deepseek' ? 393216 : 1048576;
      if (isKnown && budget > knownMax) throw error('输出上限超过该型号已核实的最大值 ' + knownMax);
      const field = preset.id === 'openai' || preset.id === 'kimi' && model === 'kimi-k3' ? 'max_completion_tokens' : 'max_tokens';
      result[field] = budget;
    }
    return result;
  }
  function mergeExtra(provider, settings) {
    const generated = makeExtra(provider, settings), manual = sanitizeExtra(settings.extra || {});
    for (const key of Object.keys(generated)) if (Object.prototype.hasOwnProperty.call(manual, key)) throw error('额外参数 ' + key + ' 与上方控件重复；请清空其中一处');
    if (settings.maxTokens !== '' && settings.maxTokens != null && (manual.max_tokens !== undefined || manual.max_completion_tokens !== undefined)) throw error('输出上限在控件与额外参数中重复，请只填一处');
    if (settings.thinking && settings.thinking !== 'default' && ['thinking', 'reasoning_effort', 'enable_thinking'].some(k => Object.prototype.hasOwnProperty.call(manual, k))) throw error('思考模式与额外思考参数重复；请选择模型默认后再手填');
    return { ...generated, ...manual };
  }
  function sanitizeProfile(value = {}) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw error('模型配置必须为对象');
    const preset = getPreset(value.provider || 'custom');
    const endpoint = value.endpoint == null ? preset.endpoint : text(value.endpoint, 'API 地址');
    const model = value.model == null ? preset.model : text(value.model, '模型名称', 200);
    const thinking = value.thinking || 'default';
    if (!['default', 'on', 'off'].includes(thinking)) throw error('思考模式无效');
    let maxTokens = value.maxTokens == null ? '' : value.maxTokens;
    if (String(maxTokens).trim() !== '') { maxTokens = Number(maxTokens); if (!Number.isSafeInteger(maxTokens) || maxTokens < 1 || maxTokens > 1048576) throw error('输出上限无效'); } else maxTokens = '';
    return { provider: preset.id, endpoint: endpoint ? normalizeEndpoint(endpoint) : '', model, thinking, maxTokens, jsonMode: value.jsonMode === true, stream: value.stream !== false, extra: sanitizeExtra(value.extra || {}) };
  }
  function abortError() { const e = new Error('已停止模型查询'); e.name = 'AbortError'; return e; }
  async function queryModels(config, options = {}) {
    if (options.signal?.aborted) throw abortError();
    if (!canQueryModels(config)) throw error('此官方端点的模型列表接口尚未核实，请手动填写型号或查看官方目录', 'unsupported_query');
    const url = resolveModelsUrl(config.endpoint), key = normalizeKey(config.apiKey || '');
    const timeoutMs = options.timeoutMs == null ? 20000 : Number(options.timeoutMs);
    if (!Number.isFinite(timeoutMs) || timeoutMs < 1 || timeoutMs > 60000) throw error('查询超时须为 1–60000 毫秒');
    const controller = new AbortController();
    let timeout, rejectStop, stopped = false, timedOut = false, reader;
    const interrupted = new Promise((_, reject) => { rejectStop = reject; });
    // Keep the rejection handled even if a preflight check ends the operation.
    interrupted.catch(() => {});
    const stop = () => { if (!stopped) { stopped = true; controller.abort(); rejectStop(timedOut ? error('模型查询超时，可稍后手动重试', 'timeout') : abortError()); } };
    const wait = promise => Promise.race([promise, interrupted]);
    options.signal?.addEventListener('abort', stop, { once: true });
    timeout = setTimeout(() => { timedOut = true; stop(); }, timeoutMs);
    try {
      const fetchImpl = options.fetchImpl || global.fetch;
      if (typeof fetchImpl !== 'function') throw error('当前浏览器不支持 fetch');
      const response = await wait(fetchImpl(url, { method: 'GET', headers: key ? { Authorization: 'Bearer ' + key, Accept: 'application/json' } : { Accept: 'application/json' }, signal: controller.signal, credentials: 'omit', redirect: 'error', cache: 'no-store', referrerPolicy: 'no-referrer' }));
      if (stopped) throw abortError();
      if (!response.ok) throw error('模型查询失败（HTTP ' + response.status + '），可检查凭据、地址或手动填写型号', 'http');
      if (response.redirected) throw error('模型查询地址发生重定向，请直接填写最终接口地址', 'redirect');
      const maxBytes = 2097152;
      const length = Number(response.headers?.get('content-length') || 0);
      if (length > maxBytes) throw error('模型列表响应过大', 'response_limit');
      let raw = '';
      if (response.body?.getReader) {
        reader = response.body.getReader(); const decoder = new TextDecoder(); let count = 0;
        while (true) {
          const chunk = await wait(reader.read());
          if (chunk.done) { raw += decoder.decode(); break; }
          count += chunk.value.byteLength;
          if (count > maxBytes) throw error('模型列表响应过大', 'response_limit');
          raw += decoder.decode(chunk.value, { stream: true });
        }
      } else { raw = await wait(response.text()); if (raw.length > maxBytes) throw error('模型列表响应过大', 'response_limit'); }
      let payload;
      try { payload = JSON.parse(raw); } catch (_) { throw error('模型查询未返回有效 JSON', 'invalid_response'); }
      if (payload?.error || !Array.isArray(payload?.data) || payload.data.length > 10000) throw error('模型列表响应格式无法识别', 'invalid_response');
      const found = new Map();
      for (const item of payload.data) {
        if (typeof item?.id !== 'string' || !item.id.trim() || item.id.length > 200 || /[\u0000-\u0020\u007f]/.test(item.id)) continue;
        const id = item.id.trim(); if (found.has(id)) continue;
        const model = { id };
        if (typeof item.owned_by === 'string' && item.owned_by.length <= 200 && !/[\u0000-\u001f\u007f]/.test(item.owned_by)) model.ownedBy = item.owned_by;
        found.set(id, model);
      }
      return [...found.values()].sort((a, b) => a.id.localeCompare(b.id));
    } catch (failure) {
      if (timedOut) throw error('模型查询超时，可稍后手动重试', 'timeout');
      if (options.signal?.aborted || failure.name === 'AbortError') throw abortError();
      // Untrusted fetch/server messages are not echoed; they can include a Key.
      if (failure.name === 'ProviderError') throw failure;
      throw error('模型查询连接失败；检查网络及接口是否允许浏览器跨域访问，也可手填型号', 'network');
    } finally {
      clearTimeout(timeout); options.signal?.removeEventListener('abort', stop);
      if (reader) { try { Promise.resolve(reader.cancel()).catch(() => {}); } catch (_) {} try { reader.releaseLock(); } catch (_) {} }
    }
  }
  const api = Object.freeze({ presets, getPreset, normalizeKey, normalizeEndpoint, resolveModelsUrl, canQueryModels, sanitizeExtra, makeExtra, mergeExtra, sanitizeProfile, queryModels });
  global.DUG_PROVIDERS = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
