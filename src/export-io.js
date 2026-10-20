/* Based on Cognitive Landscape frontend/standalone/io.js; shared native/web delivery contract. */
(function startrackExportIO() {
  'use strict';

  const NATIVE_FOLDER = 'Case-Trajectories';

  const safeName = value => {
    const name = String(value || 'case-trajectories-export').replace(/[\\/:*?"<>|\u0000-\u001f]+/g,'-').trim();
    return name || 'case-trajectories-export';
  };
  const isMobileLike = () => {
    try {
      return !!(matchMedia('(pointer: coarse)').matches || matchMedia('(max-width: 600px)').matches);
    } catch {
      return false;
    }
  };
  const isNative = () => {
    try {
      return typeof globalThis.Capacitor !== 'undefined'
        && typeof globalThis.Capacitor?.isNativePlatform === 'function'
        && !!globalThis.Capacitor.isNativePlatform();
    } catch {
      return false;
    }
  };
  const isTextLike = type => {
    const mime = String(type || '').toLowerCase();
    return mime.startsWith('text/')
      || mime.includes('json')
      || mime.includes('html')
      || mime.includes('xml')
      || mime.includes('svg')
      || mime.includes('javascript');
  };
  const asBlob = (content,type) => content instanceof Blob
    ? content
    : new Blob(Array.isArray(content) ? content : [content == null ? '' : content],{type:type || 'application/octet-stream'});
  const publish = receipt => {
    try { globalThis.dispatchEvent(new CustomEvent('startrack-export-result',{detail:receipt})); } catch {}
    return receipt;
  };
  const receipt = (method,name,fallbacks=[]) => publish({
    ok:true,
    method,
    name,
    fallbacks:[...fallbacks]
  });

  function anchorDownload(blob,name,fallbacks=[]) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.style.cssText = 'position:fixed;top:-9999px;left:0;';
    (document.body || document.documentElement).appendChild(link);
    try {
      link.click();
    } finally {
      setTimeout(() => {
        try { link.remove(); } catch {}
        try { URL.revokeObjectURL(url); } catch {}
      },1000);
    }
    return receipt('anchor-download',name,fallbacks);
  }

  async function blobBase64(blob) {
    return await new Promise((resolve,reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error || new Error('blob read failed'));
      reader.onload = () => {
        const source = String(reader.result || '');
        const comma = source.indexOf(',');
        resolve(comma >= 0 ? source.slice(comma + 1) : source);
      };
      reader.readAsDataURL(blob);
    });
  }

  async function nativeWrite(blob,name,meta,fallbacks) {
    const C = globalThis.Capacitor;
    const FS = C?.Plugins?.Filesystem;
    if (!FS || typeof FS.writeFile !== 'function') throw new Error('filesystem unavailable');
    const Dir = C?.Plugins?.Directory || {Documents:'DOCUMENTS'};
    const Enc = C?.Plugins?.Encoding || {UTF8:'utf8'};
    const opts = {
      path:NATIVE_FOLDER + '/' + name,
      directory:Dir.Documents || 'DOCUMENTS',
      recursive:true
    };
    if (isTextLike(blob.type || meta.type)) {
      opts.data = await blob.text();
      opts.encoding = Enc.UTF8 !== undefined ? Enc.UTF8 : 'utf8';
    } else {
      opts.data = await blobBase64(blob);
    }
    const result = await FS.writeFile(opts);
    const uri = result?.uri || result?.path || '';
    const Share = C?.Plugins?.Share;
    if (Share && typeof Share.share === 'function' && uri) {
      try {
        await Share.share({
          title:meta.title || 'Case Trajectories Export',
          text:meta.text || 'Case Trajectories export',
          files:[uri]
        });
        return receipt('native-share',name,fallbacks);
      } catch {
        fallbacks.push('native-share');
      }
    } else {
      fallbacks.push('native-share-unavailable');
    }
    try {
      alert((meta.savedMessage || '文件已保存到应用文档目录：') + NATIVE_FOLDER + '/' + name);
    } catch {}
    return receipt('native-saved',name,fallbacks);
  }

  async function webShare(blob,name,meta,fallbacks) {
    if (!isMobileLike()) return null;
    if (typeof navigator?.share !== 'function' || typeof navigator?.canShare !== 'function' || typeof File === 'undefined') return null;
    try {
      const file = new File([blob],name,{type:blob.type || meta.type || 'application/octet-stream'});
      if (!navigator.canShare({files:[file]})) return null;
      await navigator.share({
        files:[file],
        title:meta.title || 'Case Trajectories Export',
        text:meta.text || ''
      });
      return receipt('web-share',name,fallbacks);
    } catch {
      fallbacks.push('web-share');
      return null;
    }
  }

  async function deliver(options={}) {
    const name = safeName(options.name);
    const blob = asBlob(options.blob !== undefined ? options.blob : options.content,options.type);
    const fallbacks = [];
    if (isNative()) {
      try {
        return await nativeWrite(blob,name,options,fallbacks);
      } catch {
        fallbacks.push('native-write');
        try { console.warn('[StartrackExportIO] Native export failed; using browser fallback.'); } catch {}
      }
    }
    const shared = await webShare(blob,name,options,fallbacks);
    if (shared) return shared;
    return anchorDownload(blob,name,fallbacks);
  }

  async function open(options={}) {
    const name = safeName(options.name || '立论星轨-历史报告.html');
    const blob = asBlob(options.blob !== undefined ? options.blob : options.content,options.type || 'text/html;charset=utf-8');
    if (isNative()) return deliver({...options,blob,name});
    const fallbacks = [];
    try {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener';
      link.style.cssText = 'position:fixed;top:-9999px;left:0;';
      (document.body || document.documentElement).appendChild(link);
      try {
        link.click();
      } finally {
        setTimeout(() => {
          try { link.remove(); } catch {}
          try { URL.revokeObjectURL(url); } catch {}
        },30000);
      }
      return receipt('browser-open',name,fallbacks);
    } catch {
      fallbacks.push('browser-open');
      return deliver({...options,blob,name});
    }
  }

  globalThis.StartrackExportIO = Object.freeze({
    version:'1.0.0',
    nativeFolder:NATIVE_FOLDER,
    isNative,
    isMobileLike,
    deliver,
    open,
    standaloneSource:() => '(' + startrackExportIO.toString() + ')();'
  });
})();
