(function (global) {
  'use strict';
  const T=value=>global.DUG_I18N.t(value);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function create({store,getCurrent,activate,isBusy,onError,download}) {
    const dialog=document.createElement('dialog');dialog.id='history-dialog';dialog.className='session-dialog';
    dialog.innerHTML=`<header class="dialog-heading"><div><span class="eyebrow">LOCAL SESSIONS</span><h2>历史会话</h2><p class="field-note">继续此前的论点树、选择和解释。保存在本浏览器，可导出 JSON 备份。</p></div><button class="icon-button" id="history-close" aria-label="关闭历史会话">×</button></header><label class="field history-search-field">查找会话<input id="history-search" type="search" placeholder="搜索名称、辩题或持方" autocomplete="off"></label><div class="session-layout"><div id="history-list" role="list" aria-label="已保存会话"></div><section id="history-preview" aria-live="polite"></section></div><div id="history-error" class="form-error" role="alert"></div>`;
    document.body.append(dialog);
    const $=id=>dialog.querySelector('#'+id);
    let selectedId=null;
    const date=value=>{const d=new Date(value);return Number.isNaN(d.getTime())?'时间未知':d.toLocaleString('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});};
    function fail(ex){$('history-error').textContent=ex.message||String(ex);if(onError)onError('历史会话：'+(ex.message||String(ex)));}
    function preview(meta) {
      if(!meta){$('history-preview').innerHTML='<div class="session-empty">没有匹配的会话。</div>';return;}
      const p=store.load(meta.id);if(!p)throw Error('会话记录不存在。');
      const counts=meta.counts,current=getCurrent()?.id===meta.id;
      const roots=p.roots.filter(r=>!r.archived).slice(0,4);
      $('history-preview').innerHTML=`<div class="detail-badge-row"><span class="tag ${p.mode==='demo'?'root':'digest'}">${p.mode==='demo'?'人工演示':'模型项目'}</span>${current?'<span class="tag digest">当前会话</span>':''}</div><h3 data-user-content>${esc(meta.title)}</h3><p class="session-motion">${esc(p.context.motion)}</p><p class="field-note"><span>我方：</span><span data-user-content>${esc(p.context.side==='pro'?p.context.pro:p.context.con)}</span></p><div class="session-counts"><span><b>${counts.arguments}</b> 对方论点</span><span><b>${counts.roots}</b> 论点共性</span><span><b>${counts.directions}</b> 转换方向</span><span><b>${counts.saved}</b> 保留路径</span></div><p class="field-note">${counts.completeSamples} 份完成采样 · ${counts.analyses} 条底层观念支线<br>最近保存：${date(meta.updatedAt)}</p><div class="session-actions"><button id="history-open" class="btn primary small" ${isBusy()?'disabled':''}>${current?'回到当前会话':'打开并继续'}</button><button id="history-export" class="btn outline small">导出 JSON</button><button id="history-rename" class="btn quiet small">重命名</button><button id="history-delete" class="btn quiet small" ${current||isBusy()?'disabled':''}>删除</button></div><section class="session-root-preview"><h4>论点共性预览</h4>${roots.length?roots.map(r=>`<div><strong>${esc(r.title)}</strong><p>${esc(r.explanation)}</p></div>`).join(''):'<p class="field-note">尚未分析论点共性，可继续之前的步骤。</p>'}</section>`;
      $('history-open').onclick=()=>{if(isBusy())return;try{if(current||activate(store.load(meta.id))!==false)dialog.close();}catch(ex){fail(ex);}};
      $('history-export').onclick=()=>{try{const data=store.export(meta.id);if(data)download(data,meta.title.replace(/[\\/:*?"<>|]/g,'-').slice(0,55)+'.json','application/json');}catch(ex){fail(ex);}};
      $('history-rename').onclick=()=>{const next=window.prompt(T('会话名称（不改变辩题或论点）'),meta.title);if(next?.trim()){try{store.rename(meta.id,next.trim());render();}catch(ex){fail(ex);}}};
      $('history-delete').onclick=()=>{if(current||isBusy())return;if(window.confirm(T('删除这条本地历史会话？\n'+meta.title+'\n已导出的文件不受影响。'))){try{store.remove(meta.id);selectedId=null;render();}catch(ex){fail(ex);}}};
    }
    function render(){
      $('history-error').textContent='';
      try{const rows=store.list({query:$('history-search').value});if(!rows.some(r=>r.id===selectedId))selectedId=rows[0]?.id||null;
        $('history-list').innerHTML=rows.map(r=>`<button class="session-row ${r.id===selectedId?'selected':''}" data-session-id="${esc(r.id)}" role="listitem"><strong>${esc(r.title)}</strong><span>${date(r.updatedAt)}${r.id===getCurrent()?.id?' · 当前':''}</span><small>${r.counts.arguments} 论点 · ${r.counts.roots} 论点共性 · ${r.counts.directions} 方向</small></button>`).join('')||'<p class="session-empty">没有匹配的本地会话</p>';
        preview(rows.find(r=>r.id===selectedId));
      }catch(ex){fail(ex);}
    }
    $('history-list').onclick=e=>{const b=e.target.closest('[data-session-id]');if(b){selectedId=b.dataset.sessionId;render();}};
    $('history-search').oninput=render;$('history-close').onclick=()=>dialog.close();
    return {open(){selectedId=getCurrent()?.id||null;$('history-search').value='';render();dialog.showModal();},refresh:render,close(){dialog.close();}};
  }
  global.DUG_HISTORY_UI={create};
})(window);
