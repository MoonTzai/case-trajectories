(function () {
  'use strict';
  const I=window.DUG_I18N, T=value=>I.t(value), W=window.DUG_WORKFLOW;
  const E = window.DUG, DEMOS = {city:window.DUG_DEMO,'course-social':window.DUG_COURSE_DEMO};
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clone = value => JSON.parse(JSON.stringify(value));
  const now = () => new Date().toISOString();
  const diagnostics = window.DUG_DIAGNOSTICS.create();
  function captureRuntimeError(kind, detail){if(!project)return;const id=E.uid('runtime');diagnostics.begin({id,projectId:project.id,kind,step:currentStep,view},config.apiKey);diagnostics.finish(id,{status:'failed',error:detail});}
  window.addEventListener('error',e=>{if(e.error)captureRuntimeError('browser-error',e.error);});
  window.addEventListener('unhandledrejection',e=>captureRuntimeError('unhandled-rejection',e.reason));
  const STORE = 'dug.workbench.v1', CONFIG = 'dug.workbench.connection.v1';
  let project, config = {endpoint:'',model:'',apiKey:'',extra:{},jsonMode:false}, busy = null, view = 'board', currentStep='argument', responseRoot='', atlasSource=null, atlasFilename='', atlasRead=0;
  let sessionStore, sessionUI, settingsUI, starView, currentStorageWritable=true, lastMetrics=null;
  let projectAtlasSource=null,projectAtlasFilename='',projectAtlasRead=0,projectAtlasReading=false,projectAtlasError='';
  const theoryFailures=new Map(), theoryPending=new Set();
  const demoOf = () => DEMOS[project?.demoId||'city']||DEMOS.city;
  let page = {argument:4,root:4,direction:4}, focus = null, onlySelectedRoots = false, editTarget = null, splitTarget = null, editingContext = false, toastTimer;
  const directionPages = new Map();
  const names = {argument:'论点',root:'论点共性',direction:'转换方向',framing:'视角切入'};
  const collections = {argument:'arguments',root:'roots',direction:'directions',framing:'framings'};
  const active = kind => (project[collections[kind]]||[]).filter(x => !x.archived);
  const find = (kind,id) => (project[collections[kind]]||[]).find(x => x.id === id);
  const samples = () => project.batches.flatMap(b => b.samples);
  const syntheticSamples = () => project.mode==='demo'||project.origin?.isDemo;
  function sourceSamplingHTML(){const s=project.origin?.sampling;if(!s)return '';return `<p class="source-sampling"><span>${s.status==='partial'?'原始采样尚未完整':'原始采样已完成'}</span> · <span>计划</span> ${s.requested} · <span>有效</span> ${s.valid} · <span>其中空样本</span> ${s.empty} · <span>失败</span> ${s.failed} · <span>缺失</span> ${s.missing}</p>${s.issues.length?`<details class="source-issues"><summary>来源提示（保留原文）</summary><ul>${s.issues.map(x=>'<li data-user-content>'+esc(x)+'</li>').join('')}</ul></details>`:''}`;}
  function sourceSamplingText(){const s=project.origin?.sampling;return s?`原始采样${s.status==='partial'?'尚未完整':'已完成'}：计划 ${s.requested}，有效 ${s.valid}（其中空样本 ${s.empty}），失败 ${s.failed}，缺失 ${s.missing}。`+(s.issues.length?'\n来源提示：\n'+s.issues.map(x=>'- '+x).join('\n'):''):'';}

  const selectedArgs = () => active('argument').filter(x => x.selected);
  const selectedRoots = () => active('root').filter(x => x.selected && !x.stale);
  function toast(text) { $('toast').textContent=text; $('toast').hidden=false; clearTimeout(toastTimer); toastTimer=setTimeout(()=>$('toast').hidden=true,4300); }
  function error(text) { $('error-message').textContent=String(text); $('error-banner').hidden=false; }
  function clearError() { $('error-banner').hidden=true; }
  function record(action,kind='',entity=null) { project.history.push({id:E.uid('h'),at:now(),action,kind,entityId:entity?.id||'',before:entity?clone(entity):{}}); }
  function persist() {
    project.updatedAt=now();
    try { if(currentStorageWritable)localStorage.setItem(STORE,E.serialize(project)); sessionStore.save(project); $('save-status').textContent='已保存 '+new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'}); $('footer-status').textContent='已保存到本地历史会话'; }
    catch (ex) { $('save-status').textContent='未保存'; $('footer-status').textContent='保存失败，请导出项目备份'; error('本地保存失败：'+ex.message); }
  }
  function commit() { persist(); render(); }
  function stash() {
    if(!project)return true;
    try { sessionStore.save(project);return true; }
    catch (ex) { error('当前会话未能写入历史，已保留在页面中。请先导出备份：'+ex.message);return false; }
  }
  function demoProject(id='course-social') {
    const DEMO=DEMOS[id]||DEMOS.city;
    const p=E.makeProject(DEMO.context); p.mode='demo';p.demoId=id;
    const ss=DEMO.samples.map((items,i)=>{const id='demo-s'+(i+1);return{id,status:'complete',items:E.normalizeSample({arguments:items},id),raw:JSON.stringify({arguments:items})};});
    p.batches=[{id:'demo-batch',createdAt:now(),condition:{model:'人工预置演示',endpoint:'demo',sampleCount:ss.length,concurrency:1},samples:ss,label:'内置演示 · 非实际模型采样'}];
    p.arguments=E.aggregate(ss,{clusters:DEMO.groups.map(g=>({...g,memberIds:g.members.map(([s,i])=>ss[s].items[i].id)}))});
    p.roots=E.normalizeRoots({roots:DEMO.roots.map(r=>({...r,links:r.argumentIndexes.map((index,j)=>({argumentId:p.arguments[index].id,reason:r.linkReasons[j]||r.explanation}))}))},p.arguments.map(a=>a.id));
    p.roots.forEach((r,i)=>r.selected=i===0);
    p.directions=E.normalizeDirections({directions:DEMO.directions.map(d=>({...d,rootIds:d.rootIndexes.map(i=>p.roots[i].id)}))},p.roots.map(r=>r.id));
    for(const [kind,nodes] of [['opponent',p.roots],['own',p.directions]])for(const anchor of nodes)p.analyses.push({id:E.uid('analysis'),kind,anchorId:anchor.id,anchorVersion:anchor.version,version:1,createdAt:now(),items:E.normalizeAnalysis(DEMO.analysis(kind,anchor)),stale:false});
    if(window.DUG_FRAMING_DEMO)for(const [i,d] of p.directions.entries())p.framings.push(...E.normalizeFramings(window.DUG_FRAMING_DEMO(p.context,d,i,id),p.directions));
    return p;
  }
  function indexLabel(kind,id) {const index=project[collections[kind]].findIndex(x=>x.id===id);return ({argument:'A',root:'G',direction:'T',framing:'F'}[kind])+String(index+1).padStart(2,'0');}
  function related(kind,id) {
    if(!focus||focus.kind==='framing')return false;
    const f=find(focus.kind,focus.id); if(!f)return false;
    let aids=[],rids=[],dids=[];
    if(focus.kind==='argument'){aids=[f.id];rids=project.roots.filter(r=>r.argumentIds.includes(f.id)).map(r=>r.id);dids=project.directions.filter(d=>d.rootIds.some(x=>rids.includes(x))).map(d=>d.id);}
    if(focus.kind==='root'){rids=[f.id];aids=f.argumentIds;dids=project.directions.filter(d=>d.rootIds.includes(f.id)).map(d=>d.id);}
    if(focus.kind==='direction'){dids=[f.id];rids=f.rootIds;aids=project.roots.filter(r=>rids.includes(r.id)).flatMap(r=>r.argumentIds);}
    return (kind==='argument'?aids:kind==='root'?rids:dids).includes(id);
  }
  function empty(icon,title,message) {return `<div class="empty-state"><div class="empty-icon">${icon}</div><h4>${esc(title)}</h4><p>${esc(message)}</p></div>`;}
  const stageBatches=kind=>project[kind==='root'?'rootBatches':'directionBatches']||[];
  function referenceAuditHTML(audit){if(!audit)return '';return `<details class="source-item"><summary>引用编号与复核记录</summary><p class="field-note">短编号只用于模型请求，项目与历史仍保留原始编号。修正记录不会覆盖模型原文。</p>${audit.review?`<pre>${esc(JSON.stringify(audit.review,null,2))}</pre>`:''}${audit.aggregation?`<pre>${esc(JSON.stringify(audit.aggregation,null,2))}</pre>`:''}${audit.normalization||audit.ignoredFields?`<pre>${esc(JSON.stringify({normalization:audit.normalization,ignoredFields:audit.ignoredFields},null,2))}</pre>`:''}<pre>${esc(JSON.stringify(audit.map,null,2))}</pre></details>`;}
  function stageFrequency(kind,n){if(!n.batchId||!Number.isInteger(n.total))return '';const ix=stageBatches(kind).findIndex(b=>b.id===n.batchId),batch=stageBatches(kind)[ix];return `<button class="frequency text-btn" data-action="stage-samples" data-kind="${kind}" data-id="${esc(n.batchId)}"><span>${kind==='root'?'共性采样提及':'处理采样提及'}</span> <b>${n.count}</b> / ${n.total} · <span>轮次</span> ${ix+1}${batch?.status!=='complete'?' · <span>待聚合</span>':''}</button>`;}
  function renderStageControls(){for(const kind of ['root','direction']){const stage=kind==='root'?'roots':'directions',setting=project.stageSettings?.[stage]||{sampleCount:1,concurrency:1},batch=stageBatches(kind).at(-1);for(const [field,id] of [['sampleCount','sample-count'],['concurrency','parallel-count']]){$(kind+'-'+id).value=setting[field];$(kind+'-'+id).disabled=!!busy;}
      const ss=batch?.samples||[],done=ss.filter(s=>s.status==='complete').length,failed=ss.filter(s=>s.status==='failed'||s.status==='cancelled').length;
      $(kind+'-sampling-summary').innerHTML=batch?`<span>本阶段最新一轮</span> · <span>有效</span> ${done} / ${ss.length} · <span>失败或停止</span> ${failed} <button class="text-btn" data-action="stage-samples" data-kind="${kind}" data-id="${esc(batch.id)}">查看本轮记录 ↗</button>${batch.error?'<span class="form-error" data-user-content>'+esc(batch.error)+'</span>':''}`:'<span>默认采样1份、并发1个；可独立调整。</span>';
      $(kind+'-retry').hidden=!failed;$(kind+'-retry').disabled=!!busy;$(kind+'-reaggregate').hidden=!done||batch?.status==='complete';$(kind+'-reaggregate').disabled=!!busy;
    }}
  function showStageSamples(kind,id){const batch=stageBatches(kind).find(b=>b.id===id)||stageBatches(kind).at(-1);if(!batch)return;focus=null;$('inspector').hidden=false;$('drawer-backdrop').hidden=false;$('inspector-title').textContent='独立阶段的采样记录';
    $('inspector-body').innerHTML=`<h2 class="detail-heading">${names[kind]}</h2><p class="field-note">频次仅属于这一轮。有效空样本计入分母，失败与停止不计入；不与其他阶段或轮次累加。</p><p data-user-content>${esc(batch.createdAt)} · ${esc(batch.condition.model)}</p><details class="source-item"><summary>本轮固定输入</summary><pre>${esc(JSON.stringify(batch.inputSnapshot,null,2))}</pre></details>${batch.samples.map((s,i)=>`<details class="source-item"><summary><span>样本</span> ${i+1} · <span>${({complete:'完成',failed:'失败',cancelled:'已停止',pending:'待执行',running:'执行中'})[s.status]||s.status}</span> · ${s.items.length}</summary>${s.error?'<p class="form-error" data-user-content>'+esc(s.error)+'</p>':''}${referenceAuditHTML(s.referenceAudit)}<pre>${esc(s.raw||'')}</pre></details>`).join('')}<details class="source-item"><summary>本批次聚合映射</summary>${referenceAuditHTML(batch.aggregateReferenceAudit)}<pre>${esc(batch.raw||'')}</pre></details>`;render();
  }
  const framingFields=[['motionReading','① 从哪里切入辩题'],['focalQuestion','② 今天真正需要判断什么'],['entryRoute','③ 怎样一步步引入这个视角'],['opening','④ 可以怎样开场'],['handoff','⑤ 怎样接回消化／反转'],['qualification','适用条件与仍须承认的内容']];
  function framingCard(n){return `<article class="node-card framing-card" data-kind="framing" data-id="${esc(n.id)}"><div class="node-main"><div class="card-top"><span class="card-id">${indexLabel('framing',n.id)}</span>${n.stale?'<span class="tag stale">待复核</span>':''}${project.mode==='demo'?'<span class="tag">人工改编示例</span>':''}</div><h4 class="node-title" data-user-content>${esc(n.title)}</h4><dl class="framing-flow">${framingFields.map(([field,label])=>`<div><dt>${label}</dt><dd data-user-content>${esc(n[field])}</dd></div>`).join('')}</dl><div class="card-footer"><button class="text-btn" data-action="inspect" data-kind="framing" data-id="${esc(n.id)}">查看完整内容 ↗</button></div></div></article>`;}
  function renderFramings(){const dirs=active('direction');$('framing-input-hint').textContent='对应 '+dirs.length+' 个处理候选';$('run-framings').disabled=!!busy||!dirs.length;
    $('framing-list').innerHTML=dirs.length?dirs.map(d=>{const fs=active('framing').filter(f=>f.directionId===d.id),last=(project.framingRuns||[]).filter(r=>r.directionId===d.id).at(-1);return `<section class="framing-group" data-framing-direction="${esc(d.id)}"><header class="direction-group-heading"><span class="card-id">${indexLabel('direction',d.id)}</span><h3 data-user-content>${esc(d.title)}</h3><p><span>围绕这一处理视角倒推切入</span></p><button class="btn outline small" data-action="run-framing" data-id="${esc(d.id)}" ${busy?'disabled':''}>${fs.length?'为此候选补充切入':'分析这项的切入'}</button></header>${last?.status==='failed'?'<p class="form-error" data-user-content>'+esc(last.error)+'</p>':''}${fs.length?fs.map(framingCard).join(''):empty('↳','从辩题通往这个处理视角','先引导如何理解今天的问题，再让观众看到为什么应当采用这一视角。')}</section>`;}).join(''):empty('↳','先形成处理候选','完成第3步后，为每个处理结果寻找合情合理的切入路径。');
  }
  function inspectFraming(n){focus={kind:'framing',id:n.id};$('inspector').hidden=false;$('drawer-backdrop').hidden=false;$('inspector-title').textContent='视角切入';const d=find('direction',n.directionId);$('inspector-body').innerHTML=`<h2 class="detail-heading" data-user-content>${esc(n.title)}</h2><button class="text-btn" data-action="inspect" data-kind="direction" data-id="${esc(n.directionId)}"><span>对应处理</span> · <span data-user-content>${esc(d?.title)}</span></button>${framingFields.map(([field,label])=>detailSection(label,n[field])).join('')}<div class="detail-toolbar"><button class="btn outline small" data-action="edit" data-kind="framing" data-id="${esc(n.id)}">编辑内容</button></div>`;render();}
  function savedFor(id) {return project.saved.some(s=>s.directionIds.includes(id));}
  function card(kind,n,tree=false) {
    const stale=n.stale?'<span class="tag stale">待复核</span>':'';
    const checkbox=kind==='argument'?`<label class="argument-select"><input type="checkbox" data-action="select" data-kind="argument" data-id="${esc(n.id)}" aria-label="选择${esc(n.title)}" ${n.selected?'checked':''} ${busy?'disabled':''}><span>带入下一步</span></label>`:'';
    const synthetic=syntheticSamples();
    const frequency=kind==='argument'?(n.manual?'<span class="frequency">手工补充</span>':`<span class="frequency"><span>${synthetic?'演示样本提及':'样本提及'}</span> <b>${n.count}</b> / ${n.total}</span>`):stageFrequency(kind,n);
    const tag=kind==='argument'?'':kind==='root'?`<span class="tag root" data-user-content>${esc(n.type||'共同基础')}</span>`:`<span class="tag ${n.kind==='反转'?'reverse':'digest'}">${esc(n.kind)}候选</span>`;
    const links=kind==='argument'?'':kind==='direction'?`<div class="direction-target"><span>从这项论点共性出发${n.rootIds.length>1?' · 联合处理':''}</span>${n.rootIds.map(id=>`<button data-action="inspect" data-kind="root" data-id="${esc(id)}"><b>${indexLabel('root',id)}</b><span data-user-content>${esc(find('root',id)?.title||'旧论点共性')}</span></button>`).join('')}</div>`:`<div class="root-source-list"><h5>它承接的对方论点</h5>${n.links.map(l=>`<button data-action="inspect" data-kind="argument" data-id="${esc(l.argumentId)}"><b>${indexLabel('argument',l.argumentId)}</b><span data-user-content>${esc(find('argument',l.argumentId)?.title||'旧论点')}</span><small data-user-content>${esc(l.reason)}</small></button>`).join('')}</div>`;
    const save=kind==='direction'?`<button class="btn small ${savedFor(n.id)?'primary':'outline'}" data-action="save" data-id="${esc(n.id)}">${savedFor(n.id)?'已保留 · 取消':'保留这条路径'}</button>`:'';
    const content=kind==='direction'?`${links}<dl class="direction-flow"><div><dt>① 承认对方什么</dt><dd data-field="accepted">${esc(n.accepted)}</dd></div><div><dt>② 怎样${esc(n.kind)}</dt><dd data-field="bridge">${esc(n.bridge)}</dd></div><div><dt>③ 导向我方什么判断</dt><dd data-field="conclusion">${esc(n.conclusion)}</dd></div></dl>${n.qualification?`<p class="candidate-condition"><span>成立条件</span><span data-user-content>${esc(n.qualification)}</span></p>`:''}`:`<p class="node-description">${esc(kind==='argument'?n.reason:n.explanation)}</p>${n.qualification?`<p class="candidate-condition"><span>适用限定</span><span data-user-content>${esc(n.qualification)}</span></p>`:''}${links}`;
    const next=kind==='direction'?`<button class="text-btn" data-action="focus-framing" data-id="${esc(n.id)}">设计视角切入 →</button>`:kind==='root'?`<button class="text-btn" data-action="focus-responses" data-id="${esc(n.id)}">查看它的处理结果 →</button>`:'';
    return `<article class="node-card ${kind==='direction'?'direction-card':''} ${kind==='argument'&&n.selected?'is-selected':''} ${related(kind,n.id)?'is-related':''} ${n.stale?'stale':''}" data-kind="${kind}" data-id="${esc(n.id)}"><div class="node-main"><div class="card-top"><span class="card-top-left"><span class="card-id">${indexLabel(kind,n.id)}</span>${tag}${stale}</span>${frequency}${checkbox}</div><h4 class="node-title" role="button" tabindex="0" data-action="inspect" data-kind="${kind}" data-id="${esc(n.id)}">${esc(n.title)}</h4>${content}<div class="card-footer">${save}${next}<button class="text-btn" data-action="inspect" data-kind="${kind}" data-id="${esc(n.id)}">查看完整内容 ↗</button></div></div>${kind==='argument'?'':`<aside class="node-theory">${theoryPreview(kind,n)}</aside>`}</article>`;
  }
  function renderDirections() {
    const roots=active('root').filter(r=>!responseRoot||r.id===responseRoot),dirs=active('direction');
    $('more-directions').hidden=true;
    const selector=$('response-filter');selector.innerHTML='<option value="">'+T('全部论点共性')+'</option>'+active('root').map(r=>`<option value="${esc(r.id)}" data-user-content>${indexLabel('root',r.id)} · ${esc(r.title)}</option>`).join('');selector.value=responseRoot;
    $('direction-list').innerHTML=roots.length?roots.map(r=>{
      const matches=dirs.filter(d=>d.rootIds.includes(r.id)),limit=directionPages.get(r.id)||2;
      return `<section class="direction-group" data-root-id="${esc(r.id)}"><header class="direction-group-heading"><div><span class="card-id">${indexLabel('root',r.id)}</span><span>对这项共性的处理</span><span class="group-size">${matches.length} 个候选</span></div><h4><button data-action="inspect" data-kind="root" data-id="${esc(r.id)}"><span data-user-content>${esc(r.title)}</span></button></h4></header><div class="direction-group-cards">${matches.length?matches.slice(0,limit).map(d=>card('direction',d)).join(''):'<p class="group-empty">尚无处理结果。点击本页上方“处理分析”，会处理全部论点共性。</p>'}</div>${matches.length>limit?`<button class="load-more" data-action="more-root-directions" data-id="${esc(r.id)}">再显示 ${Math.min(2,matches.length-limit)} 条 · 仅此论点共性</button>`:''}</section>`;
    }).join(''):empty('↗','先找到论点共性','先在第2步分析共性，再到这里寻找我方的处理方式。');
  }
  function renderList(kind,list) {
    const id=kind==='argument'?'argument-list':kind==='root'?'root-list':'direction-list';
    const placeholders={argument:['◎','先听见对方的理由','填写辩题并配置模型，独立采样后聚合主要论点。'],root:['⌁','寻找共同的承接点','先在第1步勾选论点，再分析它们可能共享的事实、前提或价值。'],direction:['↗','打开不同的转换方向','选择论点共性，探索可以消化或反转的候选路径。']};
    $(id).innerHTML=list.length?list.slice(0,page[kind]).map(n=>card(kind,n)).join(''):empty(...placeholders[kind]);
    const more=$('more-'+({argument:'arguments',root:'roots',direction:'directions'}[kind])); more.hidden=list.length<=page[kind];more.textContent=`再显示 ${Math.min(4,list.length-page[kind])} 项 · 余 ${list.length-page[kind]} 项`;
  }
  function renderTree() {
    const roots=active('root');
    const argumentOverview=`<section class="tree-arguments"><h3>穷举的对方论点</h3><p class="field-note">先检视全部论点，再沿下方连线查看每种共性及其处理。</p><div>${active('argument').map(a=>`<button data-action="inspect" data-kind="argument" data-id="${esc(a.id)}"><b>${indexLabel('argument',a.id)}</b><span data-user-content>${esc(a.title)}</span><small>${a.manual?'手工补充':(syntheticSamples()?'演示样本提及 ':'样本提及 ')+a.count+' / '+a.total}</small></button>`).join('')||'<p class="field-note">尚未穷举论点</p>'}</div></section>`;
    $('tree-view').innerHTML=argumentOverview+`<div class="tree-legend"><span>主线：对方论点 → 论点共性 → 消化／反转</span><span class="theory-legend">紫色支线：理解背后的观念</span></div>`+(roots.length?roots.map(r=>{
      const ds=active('direction').filter(d=>d.rootIds.includes(r.id));
      return `<article class="tree-branch"><div class="tree-sources"><span class="section-label">这些对方论点</span>${r.argumentIds.map(id=>`<button data-action="inspect" data-kind="argument" data-id="${esc(id)}"><b>${indexLabel('argument',id)}</b><span data-user-content>${esc(find('argument',id)?.title)}</span></button>`).join('')}</div><div class="tree-link"><span>共享</span>→</div><div class="tree-root"><span class="section-label">论点共性</span><b class="card-id">${indexLabel('root',r.id)}</b>${stageFrequency('root',r)}<h3 data-user-content role="button" tabindex="0" data-action="inspect" data-kind="root" data-id="${esc(r.id)}">${esc(r.title)}</h3><p class="node-description">${esc(r.explanation)}</p>${theoryPreview('root',r)}</div><div class="tree-link"><span>可处理为</span>→</div><div class="tree-leaves">${ds.length?ds.map(d=>`<div class="tree-leaf">${card('direction',d,true)}<section class="tree-framings"><h5>↳ 本处理的配套切入</h5>${active('framing').filter(f=>f.directionId===d.id).map(f=>`<button class="text-btn" data-action="inspect" data-kind="framing" data-id="${esc(f.id)}"><span class="card-id">${indexLabel('framing',f.id)}</span><span data-user-content>${esc(f.title)}</span>${f.stale?'<span class="tag stale">待复核</span>':''}</button>`).join('')||'<button class="text-btn" data-action="focus-framing" data-id="'+esc(d.id)+'">设计视角切入 →</button>'}</section>${d.rootIds.length>1?'<p class="preview-note">同一结果也处理其他共性；相同编号表示同一个候选。</p>':''}</div>`).join(''):empty('↗','尚未展开','到第3步以全部共性为输入寻找处理候选；部分共性可能暂时无合适结果。')}</div></article>`;
    }).join(''):empty('⑂','方案树会在这里生长','先穷举对方论点并分析共性，再从各项论点共性展开转换方向。'));
  }
  function setStep(step){currentStep=step;view='board';closeInspector();render();}
  function renderNarrative(){
    const dirs=active('direction');
    $('narrative-view').innerHTML=`<header class="narrative-intro"><span class="section-label">叙事流程</span><h2>先选一套处理，再比较它的配套切入</h2><p>每个处理方案独立成组。组内每条切入各自形成完整叙事，只使用该处理对应的共性和论点；切换这里不会生成新内容。</p></header>`+(dirs.length?dirs.map(d=>{
      const roots=d.rootIds.map(id=>find('root',id)).filter(Boolean),aids=[...new Set(roots.flatMap(r=>r.argumentIds))],fs=active('framing').filter(f=>f.directionId===d.id);
      const acceptance=`<p class="narrative-accepted" data-user-content>${esc(d.accepted)}</p><div class="narrative-commonalities"><h5>${roots.length>1?'此处理联合承接这些共性':'此处理承接的共性'}</h5>${roots.map(r=>`<article data-root-id="${esc(r.id)}"><button class="text-btn" data-action="inspect" data-kind="root" data-id="${esc(r.id)}"><b>${indexLabel('root',r.id)}</b><span data-user-content>${esc(r.title)}</span></button><p data-user-content>${esc(r.explanation)}</p><h6>具体来自哪些对方论点</h6>${r.argumentIds.map(id=>{const a=find('argument',id);return `<button class="narrative-argument" data-action="inspect" data-kind="argument" data-id="${esc(id)}"><b>${indexLabel('argument',id)}</b><span data-user-content>${esc(a?.title)}</span></button>`;}).join('')}</article>`).join('')}</div>`;
      return `<section class="narrative-plan" data-direction-id="${esc(d.id)}"><header class="narrative-plan-heading"><span class="card-id">${indexLabel('direction',d.id)}</span><span>处理方案</span><h3 data-user-content>${esc(d.title)}</h3><p><span>该方案的配套切入</span> · ${fs.length}</p><button class="text-btn" data-action="focus-framing" data-id="${esc(d.id)}">查看或补充配套切入 →</button></header>${fs.length?fs.map((f,i)=>`<details class="narrative-path" data-direction-id="${esc(d.id)}" data-framing-id="${esc(f.id)}" ${i===0?'open':''}><summary><span class="card-id">${indexLabel('framing',f.id)}</span><span data-user-content>${esc(f.title)}</span>${f.stale||d.stale?'<span class="tag stale">待复核</span>':''}</summary><div class="narrative-sequence"><section data-narrative-stage="framing"><h4><b>1</b> 视角切入</h4><p data-user-content>${esc(f.motionReading)}</p><h5>今天需要判断的问题</h5><p data-user-content>${esc(f.focalQuestion)}</p><h5>进入这一处理视角的引导</h5><p data-user-content>${esc(f.entryRoute)}</p><details><summary>开场示范</summary><blockquote data-user-content>${esc(f.opening)}</blockquote></details></section><section data-narrative-stage="acceptance"><h4><b>2</b> 承接对方理由与共性</h4>${acceptance}</section><section data-narrative-stage="transformation"><h4><b>3</b> 消化／反转</h4><span class="tag">${esc(d.kind)}候选</span><p data-user-content>${esc(d.bridge)}</p><h5>这条切入怎样接回处理</h5><p data-user-content>${esc(f.handoff)}</p><details class="narrative-correspondence"><summary>对应到哪些论点 · 关联清单</summary><p class="field-note">这是已有对应关系的检视，关联不等于逐项转换已成立。</p>${aids.map(id=>`<button class="narrative-argument" data-action="inspect" data-kind="argument" data-id="${esc(id)}"><b>${indexLabel('argument',id)}</b><span data-user-content>${esc(find('argument',id)?.title)}</span></button>`).join('')}</details></section><section data-narrative-stage="conclusion"><h4><b>4</b> 我方判断</h4><p data-user-content>${esc(d.conclusion)}</p><h5>仍需承认与补足</h5><p data-user-content>${esc(d.qualification)}</p><p data-user-content>${esc(f.qualification)}</p><button class="btn outline small" data-action="save" data-id="${esc(d.id)}">${savedFor(d.id)?'已保留此处理方案 · 取消':'保留此处理方案'}</button></section></div></details>`).join(''):empty('↳','这套处理还没有配套切入','到第4步为这项处理设计入口，之后在这里比较它的不同叙事。')}</section>`;
    }).join(''):empty('↳','先形成一套处理方案','先完成处理分析，再为它设计视角切入。'));
  }
  function renderWorkflow(){
    const a=active('argument').length,r=active('root').length,d=active('direction').length,f=active('framing').length;
    const descriptions={argument:['第1步 · 准备对方的理由','对方会提出哪些论点？','先获得并检视对方论点，勾选你要带入共性分析的内容。'],root:['第2步 · 寻找共同承接点','哪些内容贯穿了多个对方论点？','以勾选的论点为输入，保留多种共性候选。每张卡片都列出它承接的论点。'],direction:['第3步 · 形成我方处理','如何承认这些共性，并导向我方判断？','处理全部共性，分别看清“承认什么 → 如何转换 → 我方判断”，保留值得继续发展的路径。'],framing:['第4步 · 从辩题引入视角','怎样让观众顺着辩题走到这个视角？','从既定处理倒推切入，再按观众的理解顺序讲述：辩题情境 → 判断问题 → 采用这个视角 → 衔接消化／反转。']};
    const texts=descriptions[currentStep];$('step-kicker').textContent=texts[0];$('step-question').textContent=texts[1];$('step-description').textContent=texts[2];
    $('step-context').innerHTML=currentStep==='argument'?`<strong>${a} <span>个对方论点</span></strong><span>${project.mode==='demo'?'演示已备好结果，可依次查看4个步骤。':project.origin?'已接入认知星图，可直接分析共性。':config.model?'模型：':'先在模型设置中连接模型，或导入已有结果。'}${project.mode!=='demo'&&!project.origin&&config.model?'<span data-user-content>'+esc(config.model)+'</span>':''}</span>`:currentStep==='root'?`<span>输入</span><strong>${selectedArgs().length} <span>个已选论点</span></strong><span>→</span><strong>${r} <span>个共性候选</span></strong>`:currentStep==='direction'?`<span>输入</span><strong>${r} <span>项全部共性</span></strong><span>→</span><strong>${d} <span>个处理候选</span></strong>`:`<strong>${d} <span>个处理候选</span></strong><span>→</span><strong>${f} <span>个切入方案</span></strong>`;
    for(const [kind,count] of [['argument',a],['root',r],['direction',d],['framing',f]]){
      const button=document.querySelector('[data-step="'+kind+'"]');button.classList.toggle('selected',currentStep===kind);button.setAttribute('aria-current',currentStep===kind?'step':'false');$('step-count-'+kind).textContent=String(count);
      document.querySelector('.'+({argument:'arguments',root:'roots',direction:'directions',framing:'framings'}[kind])+'-column').hidden=currentStep!==kind;
    }
    const onBoard=view==='board';$('workflow-nav').hidden=!onBoard;$('step-orientation').hidden=!onBoard;$('step-next').hidden=!onBoard;
    $('step-next').innerHTML=currentStep==='argument'?`<p>选好对方论点后，进入下一步寻找它们共享的内容。</p><button class="btn primary" data-go-step="root" ${!selectedArgs().length?'disabled':''}>进入第2步：分析共性 →</button>`:currentStep==='root'?`<button class="btn quiet" data-go-step="argument">← 回到对方论点</button><button class="btn primary" data-go-step="direction" ${!r?'disabled':''}>进入第3步：处理分析 →</button>`:currentStep==='direction'?`<button class="btn quiet" data-go-step="root">← 回到论点共性</button><button class="btn primary" data-go-step="framing" ${!d?'disabled':''}>进入第4步：视角切入 →</button>`:`<button class="btn quiet" data-go-step="direction">← 回到处理分析</button><button class="btn primary" data-action="view-narrative">查看配套的叙事流程 →</button>`;
    const origin=project.origin;$('origin-summary').hidden=!origin;if(origin)$('origin-summary').innerHTML=`<strong>已接入认知星图</strong><span data-user-content>${esc(origin.filename)} · ${esc(origin.poolKey)}</span><p>${origin.isDemo?'来源是演示样本，频次仅用于演示。':'频次沿用所选论点池的有效样本，未重新采样。'}</p>${sourceSamplingHTML()}`;
  }
  function render() {
    const c=project.context, isDemo=project.mode==='demo',DEMO=demoOf();
    $('motion-title').textContent=c.motion||'还没有辩题';$('side-pill').textContent='我方 · '+(c.side==='pro'?'正方':'反方');$('opponent-label').innerHTML='<span>对方：</span><span data-user-content>'+esc(c.side==='pro'?c.con:c.pro)+'</span>';
    $('mode-badge').textContent=isDemo?'内置演示':'模型模式';$('mode-badge').classList.toggle('live',!isDemo);$('mode-note').textContent=isDemo?DEMO.label:'点击操作时才会请求模型';$('demo-disclosure').hidden=!isDemo;$('demo-disclaimer').textContent=DEMO.disclaimer+(DEMO.sourceNote?' '+DEMO.sourceNote:'');
    const args=active('argument'),roots=active('root'),dirs=active('direction');
    $('argument-count').textContent=String(args.length).padStart(2,'0');$('root-count').textContent=String(roots.length).padStart(2,'0');$('direction-count').textContent=String(dirs.length).padStart(2,'0');
    $('root-input-hint').textContent='已选 '+selectedArgs().length+' 个论点';$('direction-input-hint').textContent='处理全部 '+roots.length+' 项论点共性';
    $('select-all-arguments').checked=!!args.length&&args.every(a=>a.selected);$('select-all-arguments').indeterminate=args.some(a=>a.selected)&&!args.every(a=>a.selected);
    $('merge-arguments').disabled=!!busy||selectedArgs().length<2;$('run-roots').disabled=!!busy||!selectedArgs().length;$('run-directions').disabled=!!busy||!roots.length;
    $('run-samples').disabled=!!busy;$('run-samples').textContent=project.origin?'另建项目重新穷举':'穷举论点';
    for(const id of ['sample-count','parallel-count','btn-project','btn-demo','demo-kind','edit-project','btn-import','btn-settings','add-argument','select-all-arguments','clear-root-selection','btn-atlas'])$(id).disabled=!!busy;
    $('saved-count').textContent=project.saved.length;
    const ss=samples(),done=ss.filter(s=>s.status==='complete').length,failed=ss.filter(s=>s.status==='failed'||s.status==='cancelled').length;
    $('sampling-summary').innerHTML=ss.length?`${syntheticSamples()?'演示样本':'已完成采样'} ${done} 份${failed?' · 未完成 '+failed+' 份':''}${ss.some(s=>s.status==='pending')?' · 待执行':''} <button class="text-btn" data-action="samples">查看采样记录 ↗</button>${project.batches.at(-1)?.error?'<p class="form-error">'+esc(project.batches.at(-1).error)+'</p>':''}`:'';
    $('reaggregate').hidden=!done||isDemo||!(project.batches.at(-1)?.status==='failed'||ss.some(s=>s.status==='complete'&&s.items.some(i=>!args.some(a=>a.memberIds.includes(i.id)))));$('reaggregate').disabled=!!busy;
    $('retry-samples').hidden=!failed||isDemo;$('retry-samples').disabled=!!busy;
    $('filter-directions').textContent=onlySelectedRoots?'查看全部论点共性':'仅看勾选论点共性';
    renderList('argument',args);renderList('root',roots);renderDirections();renderFramings();renderStageControls();
    $('board').hidden=view!=='board';$('tree-view').hidden=view!=='tree';$('narrative-view').hidden=view!=='narrative';$('star-view').hidden=view!=='star';$('view-star').classList.toggle('selected',view==='star');if(view==='star')starView.update(project,{lang:I.language,busy:!!busy});$('view-narrative').classList.toggle('selected',view==='narrative');if(view==='narrative')renderNarrative();$('view-board').classList.toggle('selected',view==='board');$('view-tree').classList.toggle('selected',view==='tree');$('rail-board').classList.toggle('active',view==='board');$('rail-tree').classList.toggle('active',view==='tree');if(view==='tree')renderTree();renderWorkflow();I.apply();
  }
  function setView(next){view=next;render();}
  function detailSection(title,value,userContent=true){return value?`<section class="detail-section"><h4>${esc(title)}</h4><p ${userContent?'data-user-content':''}>${esc(value)}</p></section>`:'';}
  function latestAnalysis(kind,id){return project.analyses.filter(a=>a.kind===kind&&a.anchorId===id).at(-1);}
  function theoryPreview(kind,n){
    const key=kind==='root'?'opponent':'own',a=latestAnalysis(key,n.id),pending=theoryPending.has(n.id),failed=theoryFailures.has(n.id);
    return `<section class="theory-preview"><span class="theory-branch-label">↳ 理解背后的观念</span><div><strong>${kind==='root'?'对方底层观念':'我方底层观念'}</strong><span class="tag root" title="可能涉及学理、价值观、世界观、认识论或意识形态；不必强贴学派标签。">辅助解释</span><button class="text-btn" data-action="theory" data-kind="${kind}" data-id="${esc(n.id)}">查看底层观念 ↗</button></div>${pending?'<p>正在自动分析…</p>':failed?'<p class="form-error">本项分析未完成，可单独重试。</p>':a?.items.length?`<h5 data-user-content>${esc(a.items[0].title)}</h5><p data-user-content>${esc(a.items[0].explanation)}</p>${a.stale?'<small>内容变化后需更新</small>':''}`:a?'<p>本次没有找到合适解释。</p>':'<p>这条旧记录尚无底层观念分析，可打开后补齐。</p>'}</section>`;
  }
  function theoryHTML(kind,n) {
    const key=kind==='root'?'opponent':'own',a=latestAnalysis(key,n.id),pending=theoryPending.has(n.id),failure=theoryFailures.get(n.id);
    return `<section class="theory-panel"><h4>${kind==='root'?'对方底层观念':'我方底层观念'} <span class="tag root">支线终点</span></h4><p class="explain">随对应结果自动分析；只解释当前候选，不进入后续主线。</p>${pending?'<p class="status-line">正在自动分析…</p>':''}${failure?`<p class="form-error">${esc(failure)}</p>`:''}${a?.stale?'<p class="status-line">锚点已变化，这份解释需要更新。</p>':''}${a?(a.items.length?a.items.map(i=>`<div class="theory-item"><h5><span data-user-content>${esc(i.title)}</span> <span class="tag root" data-user-content>${esc(i.category)}</span></h5><p data-user-content>${esc(i.explanation)}</p>${i.evidence?`<p><span>关联依据：</span><span data-user-content>${esc(i.evidence)}</span></p>`:''}<div class="theory-note">${esc(i.basis)}${project.mode==='demo'?' · 人工预置演示':''}</div>${i.source?`<p><span>待核实来源：</span><span data-user-content>${esc(i.source)}</span></p>`:''}</div>`).join(''):'<p class="preview-note">本次没有找到合适解释。</p>'):'<p class="preview-note">可能涉及学理、价值观、世界观、认识论或意识形态；不必强贴学派标签。</p>'}<button class="btn outline small full" data-action="analyze-theory" data-kind="${kind}" data-id="${esc(n.id)}" ${busy?'disabled':''}>${a?'重新分析这条支线':'补齐本项底层观念'}</button></section>`;
  }
  function inspect(kind,id,showTheory=false) {
    const n=find(kind,id);if(!n)return;if(kind==='framing'){inspectFraming(n);return;}focus={kind,id,theory:showTheory};$('inspector').hidden=false;$('drawer-backdrop').hidden=false;$('inspector-title').textContent=names[kind]+'详情 · '+indexLabel(kind,id);
    let body=`<div class="detail-badge-row"><span ${kind==='root'?'data-user-content':''} class="tag ${kind==='root'?'root':n.kind==='反转'?'reverse':'digest'}">${esc(kind==='argument'?'对方论点':kind==='root'?n.type:n.kind+'候选')}</span>${n.stale?'<span class="tag stale">待复核</span>':''}${n.archived?'<span class="tag">旧版本</span>':''}</div><h2 class="detail-heading" data-user-content>${esc(n.title)}</h2>`;
    if(kind==='argument') {
      if(project.origin)body+=detailSection('来源',project.origin.filename+' · '+project.origin.poolKey+(n.sourceId?' · '+n.sourceId:''));
      body+=detailSection(n.manual?'来源':'样本提及情况',n.manual?'手工补充，不计采样频率':`${n.count} / ${n.total} 份有效${syntheticSamples()?'演示':''}采样提及；这不是正确率。`,false)+detailSection('论点理由',n.reason)+detailSection('适用限定',n.qualification);
      if(project.origin)body+=sourceSamplingHTML();
      const entries=samples().flatMap(s=>s.items.map(i=>({...i,sample:s}))).filter(i=>n.memberIds.includes(i.id));
      body+=`<section class="detail-section"><h4>原始条目与采样来源</h4>${entries.length?entries.map(i=>`<details class="source-item"><summary data-user-content>${esc(i.claim)}</summary><p data-user-content>${esc(i.reason)}</p><p data-user-content>${esc(i.qualification)}</p><small>样本 ${esc(i.sample.id)}</small><details><summary>查看完整原始回复</summary><pre>${esc(i.sample.raw||'')}</pre></details></details>`).join(''):'<p>本条没有模型采样来源。</p>'}</section>`;
    } else if(kind==='root') {
      body+=detailSection('共同承接点',n.explanation)+detailSection('适用限定',n.qualification)+`<section class="detail-section"><h4>与论点的关联</h4>${n.links.map(l=>`<div class="source-item"><button class="text-btn" data-action="inspect" data-kind="argument" data-id="${esc(l.argumentId)}">${indexLabel('argument',l.argumentId)} · <span data-user-content>${esc(find('argument',l.argumentId)?.title||'旧论点')}</span></button><p data-user-content>${esc(l.reason)}</p></div>`).join('')}</section>`;
    } else {
      body+=detailSection('承认对方什么',n.accepted)+detailSection('转换理由',n.bridge)+detailSection('可能导向的我方判断',n.conclusion)+detailSection('成立条件／仍需补足',n.qualification);
      body+=`<section class="detail-section"><h4>关联论点共性</h4>${n.rootIds.map(r=>`<button class="link-chip" data-action="inspect" data-kind="root" data-id="${esc(r)}">${indexLabel('root',r)} · <span data-user-content>${esc(find('root',r)?.title)}</span></button>`).join(' ')}</section>`;
      if(n.tags.length)body+=`<details class="detail-section"><summary class="text-btn">方向提示</summary><p class="preview-note">启发式标签，不代表转换已经成立。</p><div class="root-links">${n.tags.map(t=>`<span class="tag" data-user-content>${esc(t)}</span>`).join('')}</div></details>`;
    }
    body+=`<div class="detail-toolbar"><button class="btn outline small" data-action="edit" data-kind="${kind}" data-id="${esc(id)}" ${busy?'disabled':''}>编辑内容</button>${kind==='argument'&&n.memberIds.length>1?`<button class="btn quiet small" data-action="split" data-id="${esc(id)}" ${busy?'disabled':''}>拆分论点簇</button>`:''}${kind==='direction'?`<button class="btn primary small" data-action="save" data-id="${esc(id)}">${savedFor(id)?'取消保留':'保留这条路径'}</button>`:''}${kind==='root'?`<button class="btn primary small" data-action="focus-responses" data-id="${esc(id)}">查看它的处理结果 →</button>`:''}${n.stale?`<button class="btn quiet small" data-action="confirm" data-kind="${kind}" data-id="${esc(id)}" ${busy?'disabled':''}>已人工复核</button>`:''}</div>`;

    if(kind!=='argument'&&n.batchId)body+=`<section class="detail-section"><h4>本轮采样来源</h4>${stageFrequency(kind,n)}<button class="text-btn" data-action="stage-samples" data-kind="${kind}" data-id="${esc(n.batchId)}">查看本轮记录 ↗</button></section>`;
    const old=project.history.filter(h=>h.entityId===id&&h.before?.title);
    if(old.length)body+=`<details class="detail-section"><summary class="text-btn">修改记录 · ${old.length}</summary>${old.slice(-5).reverse().map(h=>`<div class="source-item"><small>${esc(h.at)} · ${esc(h.action)}</small><p data-user-content>${esc(h.before.title)}</p><p data-user-content>${esc(h.before.reason||h.before.explanation||h.before.bridge||'')}</p></div>`).join('')}</details>`;
    if(showTheory&&kind!=='argument'){$('inspector-title').textContent=(kind==='root'?'对方底层观念':'我方底层观念')+' · '+indexLabel(kind,id);body=`<h2 class="detail-heading" data-user-content>${esc(n.title)}</h2>`+theoryHTML(kind,n);}
    const tabs=kind==='argument'?'':`<div class="inspector-tabs"><button class="${showTheory?'':'selected'}" data-action="inspect" data-kind="${kind}" data-id="${esc(id)}">节点详情</button><button class="${showTheory?'selected':''}" data-action="theory" data-kind="${kind}" data-id="${esc(id)}">${kind==='root'?'对方底层观念':'我方底层观念'}</button></div>`;
    $('inspector-body').innerHTML=tabs+body;render();
  }
  function closeInspector(){focus=null;$('inspector').hidden=true;$('drawer-backdrop').hidden=true;render();}
  function refreshInspector(){if(focus&&!$('inspector').hidden)inspect(focus.kind,focus.id,focus.theory);}
  function toggleSaved(id){const d=find('direction',id);if(!d)return;const old=project.saved.findIndex(s=>s.directionIds.includes(id));if(old>=0){project.saved.splice(old,1);toast('已取消保留');}else{const args=[...new Set(project.roots.filter(r=>d.rootIds.includes(r.id)).flatMap(r=>r.argumentIds))];project.saved.push({id:E.uid('save'),title:d.title,directionIds:[id],rootIds:[...d.rootIds],argumentIds:args,note:'',createdAt:now()});toast('已保留这条路径');}commit();refreshInspector();}
  function showSaved(){focus=null;$('inspector').hidden=false;$('drawer-backdrop').hidden=false;$('inspector-title').textContent='保留的路径';
    $('inspector-body').innerHTML=`<h2 class="detail-heading">保留不同的可能</h2><p class="field-note">收藏的路径属于当前会话，切换后可从历史会话找回。</p>${project.saved.length?project.saved.map(s=>`<div class="saved-item"><h4 data-user-content>${esc(s.title)}</h4><p data-user-content>${s.rootIds.map(id=>esc(find('root',id)?.title)).join(' ／ ')}</p><button class="text-btn" data-action="inspect" data-kind="direction" data-id="${esc(s.directionIds[0])}">查看路径 ↗</button><button class="text-btn" data-action="save" data-id="${esc(s.directionIds[0])}">取消保留</button></div>`).join(''):empty('◇','还没有保留路径','点击转换卡片上的菱形，收藏想继续考虑的方向。')}<div class="detail-toolbar"><button class="btn outline small" data-action="export-md">导出阅读版</button><button class="btn quiet small" data-action="history">查看旧节点</button><button class="btn quiet small" data-action="open-sessions">历史会话</button></div>`;render();}
  function archivedView(){ $('inspector-title').textContent='旧节点与待复核记录';$('inspector-body').innerHTML=['argument','root','direction','framing'].map(k=>`<section class="detail-section"><h4>${names[k]}</h4>${project[collections[k]].filter(n=>n.archived||n.stale).map(n=>`<div class="source-item"><button class="text-btn" data-action="inspect" data-kind="${k}" data-id="${esc(n.id)}"><span data-user-content>${esc(n.title)}</span> ↗</button><p>${n.archived?'旧版本':'待复核'}</p></div>`).join('')||'<p>没有旧节点。</p>'}</section>`).join(''); }
  function showSamples(){focus=null;$('inspector').hidden=false;$('drawer-backdrop').hidden=false;$('inspector-title').textContent='采样与聚合记录';const labels={complete:'完成',failed:'失败',cancelled:'已停止',pending:'待执行',running:'执行中'};$('inspector-body').innerHTML=`<h2 class="detail-heading">保留每一份原始回复</h2><p class="field-note">有效空样本计入分母；失败或停止的样本不计入。重试沿用原样本编号。</p>${project.batches.map((b,bi)=>`<section class="detail-section"><h4><span>批次</span> ${bi+1} · <span ${project.mode==='demo'?'':'data-user-content'}>${esc(b.condition.model)}</span></h4>${b.samples.map((s,si)=>`<details class="source-item"><summary>样本 ${si+1} · ${labels[s.status]||esc(s.status)} · ${s.items.length} 个条目</summary><small>${esc(s.id)}</small>${s.error?`<p class="form-error">${esc(s.error)}</p>`:''}${referenceAuditHTML(s.referenceAudit)}<pre>${esc(s.raw||'尚未收到完整回复。')}</pre></details>`).join('')}${b.raw?`<details class="source-item"><summary>本批次聚合映射</summary>${referenceAuditHTML(b.aggregateReferenceAudit)}<pre>${esc(b.raw)}</pre></details>`:''}</section>`).join('')}`;render();}
  function needConfig(){if(!config.endpoint||!config.model){openSettings();toast('先填写模型接口和模型名称。');return false;}return true;}
  function confirmAnalysis(kind){
    if(busy)return false;
    const counts=E.analysisCounts(project);
    if(counts[kind]>0&&!window.confirm(T('本环节已经进行过一次分析，再次点击将进行追加分析，可能导致包括但不限于环节内容衔接错乱等未知Bug，你确定要再次分析吗？如果要进行下一个环节，请进入下一环节后再点击对应分析按钮')))return false;
    counts[kind]=(counts[kind]||0)+1;project.analysisCounts=counts;persist();return true;
  }
  function fingerprint(){return JSON.stringify({endpoint:config.endpoint.replace(/\/$/,''),model:config.model,extra:config.extra,jsonMode:config.jsonMode});}
  function assertSameSamplingConfig(){const previous=project.batches.find(b=>b.condition?.profileKey);if(previous&&previous.condition.profileKey!==fingerprint())throw Error('这个项目已有另一套模型配置的采样。请恢复原设置，或新建项目，避免混算频率。');}
  function renderMetrics(){
    const m=busy?.metrics||lastMetrics;if(!m)return;const s=m.snapshot(),en=I.language==='en',sec=(s.elapsedMs/1000).toFixed(1),num=n=>n.toLocaleString(en?'en-US':'zh-CN');
    $('run-metrics').innerHTML=`<span>${en?'Elapsed':'耗时'} <b id="elapsed-value">${sec}s</b></span><span>${en?'Input':'输入'} Token <b id="input-token-value">${s.inputActual?'':'≈ '}${num(s.input)}</b></span><span>${en?'Output':'输出'} Token <b id="output-token-value">${s.outputActual?'':'≈ '}${num(s.output)}</b></span><span>${en?'Active requests':'进行中请求'} <b>${s.active}</b> / ${s.requests}</span><small>${en?'≈ character-based estimate; output includes streamed reasoning. Final API usage takes precedence.':'≈ 为按字符估算；输出包含已收到的思考内容。接口实际用量返回后优先显示。'}${s.active&&s.idleMs>3000?' · '+(en?'No new response for ':'距最近响应 ')+Math.floor(s.idleMs/1000)+'s':''}</small>`;
  }
  async function withJob(title,fn){if(busy)return;clearError();const job={id:E.uid('job'),controller:new AbortController(),projectId:project.id,metrics:window.DUG_METRICS.create(),warnings:0};diagnostics.begin({id:job.id,projectId:project.id,kind:'job',title},config.apiKey);busy=job;lastMetrics=job.metrics;$('run-status').hidden=false;$('run-title').textContent=title;$('run-detail').textContent='准备中…';$('stop-run').hidden=false;$('stop-run').disabled=false;$('run-spinner').hidden=false;render();renderMetrics();const ticker=setInterval(renderMetrics,250);let outcome='已完成';
    try{await fn(job.controller.signal);if(job.controller.signal.aborted)outcome='已停止';else if(job.warnings)outcome='已完成，部分结果待补齐';}
    catch(ex){diagnostics.event(job.id,{type:'failure',error:ex});if(ex.name==='AbortError'||job.controller.signal.aborted){outcome='已停止';toast('已停止，完成的内容已保留。');}else{outcome='本次操作未完成';error(ex.message||outcome);}}
    finally{clearInterval(ticker);job.metrics.finish();diagnostics.finish(job.id,{status:outcome,metrics:job.metrics.snapshot(),warnings:job.warnings});diagnostics.prune();busy=null;$('run-title').textContent=outcome;$('run-detail').textContent='';$('stop-run').hidden=true;$('run-spinner').hidden=true;renderMetrics();commit();refreshInspector();}
  }
  async function requestOnce(stage,payload,signal,scope={},metadata={}){
    const job=busy,id=E.uid('request');$('run-detail').textContent='等待首个响应…';
    diagnostics.begin({id,kind:'request',projectId:project.id,jobId:job?.id,stage,scope,config,...metadata},config.apiKey);
    if(stage==='reference-repair')$('run-title').textContent='引用关系复核（最多一次）';
    if(stage==='aggregation-repair')$('run-title').textContent='聚合归属复核（最多一次）';
    try{const prompt=(stage==='reference-repair'?window.DUG_REFERENCES.repairPrompt():stage==='aggregation-repair'?window.DUG_REFERENCES.aggregationPrompt():W.prompt(stage))+window.DUG_REFERENCES.referencePrompt();const result=await E.request(config,prompt,payload,{signal,stream:config.stream!==false,includeUsage:['openai','deepseek'].includes(config.provider),onDiagnostic:e=>diagnostics.event(id,e),onActivity:e=>{job?.metrics.update(id,e);if(e.phase==='receiving')$('run-detail').textContent=e.reasoningCharacters&&!e.characters?'正在接收思考内容…':'正在接收回复…';renderMetrics();}});diagnostics.finish(id,{status:'complete'});return {...result,requestId:id};}
    catch(ex){job?.metrics.update(id,{phase:signal?.aborted?'cancelled':'failed'});diagnostics.finish(id,{status:signal?.aborted?'cancelled':'failed',error:ex});ex.requestId=id;throw ex;}
  }
  async function call(stage,payload,signal,scope={},validateAggregate){
    return window.DUG_REFERENCES.execute(stage,payload,(requestStage,input,metadata)=>requestOnce(requestStage,input,signal,scope,metadata),{
      validate:json=>{if(validateAggregate)validateAggregate(json);else if(stage==='roots')E.normalizeRoots(json,payload.arguments.map(a=>a.id));else if(stage==='directions')E.normalizeDirections(json,payload.roots.map(r=>r.id));else if(stage==='framing')E.normalizeFramings(json,payload.directions);else if(stage==='opponent'||stage==='own')E.normalizeAnalysis(json);else if(stage==='sample')E.normalizeSample(json,'validation');},
      onValidation:(event,id)=>{if(id){diagnostics.event(id,{type:'validation',...event});if(event.status==='failed'||event.status==='cancelled')diagnostics.finish(id,{status:'validation_'+event.status});}if(event.status==='repaired')toast('已复核并修正 '+event.changes.length+' 处引用，分析文字保持原样。');}
    });
  }
  function archiveArgumentChange(newArgs){
    const old=active('argument').filter(a=>!a.manual);if(old.length)E.invalidate(project,'argument',old.map(a=>a.id));
    const used=new Set();
    for(const n of newArgs){const match=old.find(o=>!used.has(o.id)&&o.memberIds.length===n.memberIds.length&&o.memberIds.every(id=>n.memberIds.includes(id)));
      if(match){record('重新聚合','argument',match);used.add(match.id);Object.assign(match,n,{id:match.id,version:match.version+1,selected:match.selected,archived:false,stale:false});}else project.arguments.push(n);
    }
    for(const o of old)if(!used.has(o.id)){record('归档旧聚合','argument',o);o.archived=true;o.selected=false;}
  }
  async function aggregateNow(signal){const ss=samples().filter(s=>s.status==='complete');const items=ss.flatMap(s=>s.items);if(!ss.length)throw Error('还没有可聚合的有效采样。');const batch=project.batches.at(-1);batch.status='aggregating';batch.error='';persist();$('run-title').textContent='语义聚合';
    try{
      let response={text:'{"clusters":[]}',json:{clusters:[]}};if(items.length)response=await call('aggregate',{context:project.context,items},signal,{batchId:batch.id},json=>E.aggregate(ss,json));
      batch.raw=response.text;batch.aggregateReferenceAudit=response.referenceAudit;const args=E.aggregate(ss,response.json);archiveArgumentChange(args);batch.status='complete';record('聚合论点');page.argument=Math.max(4,Math.min(8,args.length));persist();render();toast('已聚合为 '+args.length+' 个论点。');
    }catch(ex){
      batch.status=signal.aborted?'cancelled':'failed';
      const hint=I.language==='en'?'Samples are saved. Aggregation failed; use “Reaggregate completed samples” without sampling again. ':'采样已保留，聚合未完成；请点击“重新聚合已完成的采样”，无需重新穷举。';
      batch.error=(signal.aborted?ex.message:hint+ex.message).slice(0,1000);
      if(ex.raw)batch.raw=ex.raw;if(ex.referenceAudit)batch.aggregateReferenceAudit=ex.referenceAudit;
      if(!signal.aborted)ex.message=batch.error;throw ex;
    }
  }
  async function runSamples(retry=false){if(busy)return;if(project.origin){openProject(true);return;}if(project.mode==='demo'){toast('演示使用固定的'+demoOf().samples.length+'份预置样本。点击「开始新辩题」接入模型探索。');return;}if(!needConfig())return;
    try{assertSameSamplingConfig();}catch(ex){error(ex.message);return;}if(!retry&&!confirmAnalysis('argument'))return;
    await withJob(retry?'重试未完成采样':'并发探索对方论点',async signal=>{
      assertSameSamplingConfig();let tasks;
      if(retry)tasks=samples().filter(s=>s.status==='failed'||s.status==='cancelled');else{const count=Number($('sample-count').value),batch={id:E.uid('batch'),createdAt:now(),condition:{model:config.model,endpoint:config.endpoint,sampleCount:count,concurrency:Number($('parallel-count').value),extra:clone(config.extra),profileKey:fingerprint()},samples:Array.from({length:count},()=>({id:E.uid('sample'),status:'pending',items:[],raw:'',error:''})),status:'sampling'};project.batches.push(batch);tasks=batch.samples;}
      if(!tasks.length)return;
      for(const s of tasks){s.status='pending';s.items=[];s.error='';}persist();
      const payload=E.input(project,'sample');for(const b of project.batches)if(b.samples.some(s=>tasks.includes(s))&&!b.inputSnapshot)b.inputSnapshot=clone(payload);
      const results=await E.runPool(tasks,Number($('parallel-count').value),async(s,index,childSignal)=>{s.status='running';try{const r=await call('sample',payload,childSignal,{batchId:project.batches.find(b=>b.samples.includes(s))?.id,sampleId:s.id});s.raw=r.text;s.referenceAudit=r.referenceAudit;s.items=E.normalizeSample(r.json,s.id);s.status='complete';return s;}catch(ex){s.raw=ex.raw||s.raw||'';if(ex.referenceAudit)s.referenceAudit=ex.referenceAudit;s.status=ex.name==='AbortError'?'cancelled':'failed';s.error=ex.message;throw ex;}},{signal,onProgress:e=>{$('run-title').textContent='独立采样';$('run-detail').textContent=`完成 ${e.completed} / ${e.total} 份`;persist();render();}});
      results.forEach((r,i)=>{if(tasks[i].status==='pending'||tasks[i].status==='running'){tasks[i].status=signal.aborted?'cancelled':'failed';tasks[i].error=r.reason?.message||'未完成';}});
      persist();render();if(signal.aborted)return;
      const successful=samples().filter(s=>s.status==='complete').length;if(!successful)throw Error('没有有效采样。请检查接口设置，或重试失败采样。'+(tasks.find(s=>s.error)?.error?' '+tasks.find(s=>s.error).error:''));
      await aggregateNow(signal);
    });
  }
  function appendUnique(kind,items){const list=project[collections[kind]],current=list.filter(n=>!n.archived&&!n.stale);let count=0;
    for(const n of items){const old=current.find(o=>W.identity(kind,o)===W.identity(kind,n));if(old){if(n.batchId)for(const key of ['batchId','memberIds','sampleIds','count','total'])old[key]=clone(n[key]);continue;}list.push(n);current.push(n);count++;}return count;
  }
  async function generateTheory(kind,anchor,signal){
    const stage=kind==='root'?'opponent':'own';theoryPending.add(anchor.id);theoryFailures.delete(anchor.id);render();refreshInspector();
    try{let items;if(project.mode==='demo')items=E.normalizeAnalysis(demoOf().analysis(stage,anchor));else{const r=await call(stage,E.input(project,stage,[anchor.id]),signal,{anchorId:anchor.id,anchorVersion:anchor.version});items=E.normalizeAnalysis(r.json);}
      project.analyses.push({id:E.uid('analysis'),kind:stage,anchorId:anchor.id,anchorVersion:anchor.version,version:1,createdAt:now(),items,stale:!!anchor.stale});record('更新底层观念支线',stage,anchor);persist();
    }catch(ex){theoryFailures.set(anchor.id,ex.name==='AbortError'?T('已停止，可单独重试。'):ex.message);throw ex;}
    finally{theoryPending.delete(anchor.id);render();refreshInspector();}
  }
  async function completeTheories(kind,nodes,signal){
    const stage=kind==='root'?'opponent':'own',pending=nodes.filter(n=>{const a=latestAnalysis(stage,n.id);return !a||a.stale||a.anchorVersion!==n.version;});
    for(let i=0;i<pending.length;i++){if(signal.aborted)break;$('run-title').textContent=(kind==='root'?'自动分析对方底层观念':'自动分析我方底层观念')+' '+(i+1)+' / '+pending.length;
      try{await generateTheory(kind,pending[i],signal);}catch(ex){if(signal.aborted||ex.name==='AbortError')throw ex;busy.warnings++;record('底层观念分析失败：'+ex.message,stage,pending[i]);persist();}}
  }
  async function runStageSampling(kind,signal,mode='new'){
    const stage=kind==='root'?'roots':'directions',batches=stageBatches(kind);let batch=batches.at(-1);
    if(mode==='new'){
      const input=E.input(project,stage,(kind==='root'?selectedArgs():active('root')).map(n=>n.id));delete input.existing;
      const settings=project.stageSettings[stage];batch={id:E.uid(stage+'-batch'),stage,createdAt:now(),condition:{model:config.model,endpoint:config.endpoint,extra:clone(config.extra),profileKey:fingerprint(),sampleCount:settings.sampleCount,concurrency:settings.concurrency},inputIds:input[kind==='root'?'arguments':'roots'].map(n=>n.id),inputSnapshot:clone(input),samples:Array.from({length:settings.sampleCount},()=>({id:E.uid(stage+'-sample'),status:'pending',items:[],raw:'',error:''})),raw:'',status:'sampling',error:''};batches.push(batch);
    }else if(!batch)return;
    if(!batch.inputSnapshot)throw Error('本轮缺少固定输入，请开始新一轮分析。');
    if(mode==='retry'&&batch.condition.profileKey!==fingerprint())throw Error('请恢复本轮模型配置后再重试，或开始新一轮采样。');
    batch.error='';
    const refreshFrequency=()=>{const ss=batch.samples.filter(s=>s.status==='complete'),all=new Map(ss.flatMap(s=>s.items.map(i=>[i.id,s.id])));for(const n of project[collections[kind]].filter(n=>n.batchId===batch.id)){n.total=ss.length;n.sampleIds=[...new Set(n.memberIds.map(id=>all.get(id)).filter(Boolean))];n.count=n.sampleIds.length;}};
    if(mode!=='aggregate'){
      batch.status='sampling';const tasks=batch.samples.filter(s=>mode==='new'||s.status==='failed'||s.status==='cancelled');for(const s of tasks){s.status='pending';s.items=[];s.error='';}persist();
      const results=await E.runPool(tasks,batch.condition.concurrency,async(s,index,childSignal)=>{s.status='running';try{const r=await call(stage,batch.inputSnapshot,childSignal,{batchId:batch.id,sampleId:s.id});s.raw=r.text;s.referenceAudit=r.referenceAudit;s.items=E.normalizeStageSample(stage,r.json,s.id,batch.inputIds);s.status='complete';return s;}catch(ex){s.raw=ex.raw||s.raw||'';if(ex.referenceAudit)s.referenceAudit=ex.referenceAudit;s.status=ex.name==='AbortError'?'cancelled':'failed';s.error=ex.message;throw ex;}},{signal,onProgress:e=>{$('run-title').textContent=kind==='root'?'共性独立采样':'处理独立采样';$('run-detail').textContent=`完成 ${e.completed} / ${e.total} 份`;refreshFrequency();persist();render();}});
      results.forEach((r,i)=>{if(tasks[i].status==='pending'||tasks[i].status==='running'){tasks[i].status=signal.aborted?'cancelled':'failed';tasks[i].error=r.reason?.message||'未完成';}});
      if(signal.aborted){batch.status='cancelled';persist();return;}
    }
    const complete=batch.samples.filter(s=>s.status==='complete'),items=complete.flatMap(s=>s.items);if(!complete.length){batch.status='failed';const causes=[...new Set(batch.samples.map(s=>s.error).filter(Boolean))];batch.error=('本轮没有有效采样。'+causes.slice(0,3).join('；')).slice(0,950);persist();throw Error(batch.error);}
    batch.status='aggregating';persist();
    try{
      const exact=new Map();for(const item of items){const key=W.identity(kind,item);if(!exact.has(key))exact.set(key,[]);exact.get(key).push(item.id);}let result={clusters:[...exact.values()].map(memberIds=>({memberIds}))};
      if(complete.length>1&&items.length){$('run-title').textContent=kind==='root'?'共性语义聚合':'处理语义聚合';const r=await call(stage+'-aggregate',{context:batch.inputSnapshot.context,items},signal,{batchId:batch.id},json=>E.aggregateStage(stage,batch.samples,json,batch.inputIds,batch.id));batch.raw=r.text;batch.aggregateReferenceAudit=r.referenceAudit;result=r.json;}else batch.raw=JSON.stringify(result);
      const nodes=E.aggregateStage(stage,batch.samples,result,batch.inputIds,batch.id);
      const fresh=E.input(project,stage,batch.inputIds);delete fresh.existing;const upstream=kind==='root'?project.arguments:project.roots;
      if(JSON.stringify(fresh)!==JSON.stringify(batch.inputSnapshot)||upstream.some(n=>batch.inputIds.includes(n.id)&&(n.archived||n.stale)))nodes.forEach(n=>{n.stale=true;});
      if(kind==='direction')nodes.forEach(d=>{if(active('root').some(r=>r.stale&&d.rootIds.includes(r.id)))d.stale=true;});
      const keys=new Set(nodes.map(n=>W.identity(kind,n)));for(const old of active(kind).filter(n=>n.batchId===batch.id&&!keys.has(W.identity(kind,n)))){record('本轮重新聚合前版本',kind,old);E.invalidate(project,kind,[old.id]);old.archived=true;old.selected=false;}
      appendUnique(kind,nodes);batch.status='complete';record(kind==='root'?'独立采样并聚合共性':'独立采样并聚合处理');
      if(kind==='root')page.root=Math.max(page.root,Math.min(active('root').length,8));else{responseRoot='';active('root').forEach(r=>directionPages.set(r.id,Math.max(directionPages.get(r.id)||2,active('direction').filter(d=>d.rootIds.includes(r.id)).length)));}
      commit();await completeTheories(kind,active(kind),signal);
    }catch(ex){if(batch.status!=='complete'){batch.status=signal.aborted?'cancelled':'failed';batch.error=ex.message;if(ex.raw)batch.raw=ex.raw;if(ex.referenceAudit)batch.aggregateReferenceAudit=ex.referenceAudit;}throw ex;}
  }
  async function runFramings(id){if(busy)return;const dirs=active('direction').filter(d=>!id||d.id===id);if(!dirs.length)return;if(project.mode!=='demo'&&!needConfig())return;
    if(!confirmAnalysis('framing'))return;
    await withJob('视角切入',async signal=>{for(const [i,d] of dirs.entries()){
      if(signal.aborted)break;if(!id&&active('framing').some(f=>f.directionId===d.id&&!f.stale&&f.directionVersion===d.version))continue;
      const run={id:E.uid('framing-run'),createdAt:now(),directionId:d.id,directionVersion:d.version,status:'running',raw:'',error:''};project.framingRuns.push(run);$('run-title').textContent='视角切入 '+(i+1)+' / '+dirs.length;persist();
      try{let response;if(project.mode==='demo'){const json=window.DUG_FRAMING_DEMO(project.context,d,project.directions.findIndex(n=>n.id===d.id),project.demoId);response={json,text:JSON.stringify(json)};}else response=await call('framing',E.input(project,'framing',[d.id]),signal,{runId:run.id,directionId:d.id,directionVersion:d.version});run.raw=response.text;run.referenceAudit=response.referenceAudit;const nodes=E.normalizeFramings(response.json,[d]);nodes.forEach(n=>{n.stale=!!d.stale;});appendUnique('framing',nodes);run.status='complete';if(!nodes.length)toast(project.mode==='demo'?'这组演示尚未预置切入示例。':'这次没有找到合适的切入方案。');record('分析视角切入','direction',d);}
      catch(ex){run.raw=ex.raw||run.raw;if(ex.referenceAudit)run.referenceAudit=ex.referenceAudit;run.error=ex.message;run.status=signal.aborted?'cancelled':'failed';if(signal.aborted)throw ex;busy.warnings++;}
      persist();render();
    }});
  }
  async function runRoots(){if(!selectedArgs().length||busy)return;
    if(project.mode==='demo'){await withJob('补齐演示底层观念',signal=>completeTheories('root',active('root'),signal));return;}if(!needConfig())return;
    if(!confirmAnalysis('root'))return;
    await withJob('分析共性',signal=>runStageSampling('root',signal));
  }
  async function runDirections(){const chosen=active('root');if(!chosen.length){toast('请先分析论点共性。');return;}if(busy)return;
    if(chosen.length>10&&!window.confirm(T('当前方向较多，可能消耗较多Token，确认继续吗？')))return;
    if(project.mode!=='demo'&&!needConfig())return;
    if(project.mode!=='demo'&&!confirmAnalysis('direction'))return;
    await withJob('处理分析',async signal=>{if(project.mode!=='demo')await runStageSampling('direction',signal);else await completeTheories('direction',active('direction'),signal);});
  }
  async function analyzeTheory(kind,id){if(busy)return;const anchor=find(kind,id);if(!anchor)return;if(project.mode!=='demo'&&!needConfig())return;
    if(!confirmAnalysis((kind==='root'?'opponent':'own')+':'+id))return;
    await withJob(kind==='root'?'解释对方底层观念':'解释我方底层观念',signal=>generateTheory(kind,anchor,signal));inspect(kind,id,true);
  }
  function openEdit(kind,id){if(busy)return;editTarget={kind,id};const n=id?find(kind,id):null;$('edit-title').textContent=n?'编辑'+names[kind]:'手工补充论点';const fields=kind==='framing'?[['title','切入标题'],...framingFields]:kind==='argument'?[['title','论点'],['reason','理由'],['qualification','限定']]:kind==='root'?[['title','论点共性标题'],['type','类型'],['explanation','说明'],['qualification','限定']]:[['title','方向标题'],['accepted','承认内容'],['bridge','转换理由'],['conclusion','我方判断'],['qualification','限定']];
    $('edit-fields').innerHTML=fields.map(([name,label])=>`<label class="field">${label}${name==='title'||name==='type'?`<input name="${name}" value="${esc(n?.[name]||'')}" ${name==='title'?'required':''}>`:`<textarea name="${name}" rows="3" ${['reason','explanation','accepted','bridge','conclusion'].includes(name)?'required':''}>${esc(n?.[name]||'')}</textarea>`}</label>`).join('');$('edit-dialog').showModal();
  }
  function mergeArguments(){if(busy)return;const xs=selectedArgs();if(xs.length<2)return;const title=window.prompt(T('合并后的论点标题（只合并语义确实相同的内容）'),xs[0].title);if(!title?.trim())return;
    const manual=xs.some(a=>a.manual);if(manual&&xs.some(a=>!a.manual)){toast('手工论点与采样论点分开保留，避免混算频率。');return;}
    const memberIds=[...new Set(xs.flatMap(a=>a.memberIds))],sampleIds=[...new Set(xs.flatMap(a=>a.sampleIds))];
    E.invalidate(project,'argument',xs.map(a=>a.id));xs.forEach(a=>{record('合并前版本','argument',a);a.archived=true;a.selected=false;});
    project.arguments.push({id:E.uid('arg'),title:title.trim(),reason:xs.map(a=>a.reason).filter(Boolean).join('\n'),qualification:xs.map(a=>a.qualification).filter(Boolean).join('\n'),memberIds,sampleIds,count:manual?0:sampleIds.length,total:manual?0:samples().filter(s=>s.status==='complete').length,manual,selected:true,version:1,stale:false});commit();toast('已合并，相关后续候选标为待复核。');
  }
  function openSplit(id){if(busy)return;const a=find('argument',id);if(!a||a.memberIds.length<2)return;splitTarget=id;const all=samples().flatMap(s=>s.items);$('split-items').innerHTML=a.memberIds.map(id=>{const i=all.find(x=>x.id===id);return `<label class="split-row"><input type="checkbox" name="members" value="${esc(id)}"><span data-user-content>${esc(i.claim)}<br><small>${esc(i.sampleId)}</small></span></label>`;}).join('');$('split-error').textContent='';$('split-dialog').showModal();}
  function openSettings(){if(!busy)settingsUI.open();}
  function activateProject(next){if(busy||!next||!stash())return false;project=next;currentStep=next.framings?.length?'framing':next.directions.length?'direction':next.roots.length?'root':'argument';responseRoot='';theoryFailures.clear();page={argument:4,root:4,direction:4};directionPages.clear();onlySelectedRoots=false;closeInspector();clearError();commit();toast('已打开历史会话，可以继续。');return true;}
  function resetProjectAtlas(){projectAtlasRead++;projectAtlasSource=null;projectAtlasFilename='';projectAtlasReading=false;projectAtlasError='';$('project-atlas-file').value='';for(const id of ['motion','pro-position','con-position'])$(id).readOnly=false;renderProjectAtlas();}
  function renderProjectAtlas(){
    const source=projectAtlasSource,side=$('own-side').value,select=$('project-atlas-pool'),old=select.value,pools=source?window.DUG_ATLAS.choices(source,side):[];
    $('project-atlas-preview').hidden=!source&&!projectAtlasReading&&!projectAtlasError;
    $('project-atlas-preview').querySelector('strong').textContent=projectAtlasReading?'正在读取《认知星图》结果…':source?'已读取《认知星图》结果，尚未创建项目':'尚未载入《认知星图》数据';
    $('project-atlas-name').textContent=projectAtlasFilename;select.parentElement.hidden=!source;
    select.innerHTML=(pools.length===1?'':'<option value="">'+T('请选择对方论点数据')+'</option>')+pools.map(p=>`<option value="${esc(p.pool_key)}">${esc(T(p.actor))} · ${esc(T(p.stance==='中立'?'中立观察采样':'持方立场采样'))}</option>`).join('');
    if(pools.some(p=>p.pool_key===old))select.value=old;
    const pool=pools.find(p=>p.pool_key===select.value);let message=projectAtlasError;
    if(source&&!projectAtlasReading){if(!side)message='请自行选择我方持方，再创建工作区。';else if(!pools.length)message='报告没有当前持方所需的对方论点数据。请选择另一持方，或导入包含对方论点的报告。';else if(!pool)message='请选择要使用的对方论点数据。';else if(pool.status!=='complete'||!pool.total||!pool.items.length)message='所选对方数据没有可用论点，或尚未完成有效聚合。请更换数据后再创建工作区。';}
    $('project-error').textContent=message;
    $('project-atlas-summary').innerHTML=pool?`<p><span>将接入</span> ${pool.items.length} <span>个对方论点</span> · ${pool.total} <span>份有效样本</span></p>${pool.sampling_status==='partial'?'<p class="status-line">部分样本未成功，频次仅使用成功样本。</p>':''}${source?.isDemo?'<p class="status-line">来源是演示样本，频次仅用于演示。</p>':''}`:'';
    $('project-create').disabled=!!busy||projectAtlasReading||!!projectAtlasError||!!(source&&message);
    $('project-create').textContent=source?'创建工作区':editingContext?'另建修订项目':'创建工作区';I.apply();
  }
  async function readProjectAtlasFile(e){const file=e.target.files[0];if(!file)return;const ticket=++projectAtlasRead;projectAtlasReading=true;projectAtlasError='';projectAtlasFilename=file.name;renderProjectAtlas();
    try{if(file.size>40000000)throw Error('认知星图文件过大或不是文本。');const raw=await file.text();if(ticket!==projectAtlasRead||!$('project-dialog').open||busy)return;const source=window.DUG_ATLAS.read(raw);projectAtlasSource=source;const c=source.context;$('motion').value=c.motion;$('pro-position').value=c.side_positions['正方'];$('con-position').value=c.side_positions['反方'];$('audience').value=[c.audience_context,c.format].filter(Boolean).join('\n');$('own-side').value='';for(const id of ['motion','pro-position','con-position'])$(id).readOnly=true;
    }catch(ex){if(ticket!==projectAtlasRead||!$('project-dialog').open)return;projectAtlasSource=null;projectAtlasError=ex.message;for(const id of ['motion','pro-position','con-position'])$(id).readOnly=false;}
    finally{if(ticket===projectAtlasRead){projectAtlasReading=false;renderProjectAtlas();}}
  }
  function openProject(edit=false){if(busy)return;editingContext=edit;resetProjectAtlas();const c=edit?project.context:{motion:'',pro:'',con:'',side:'',audience:''};$('project-dialog-title').textContent=edit?'编辑当前辩题':'开始新辩题';$('motion').value=c.motion;$('pro-position').value=c.pro;$('con-position').value=c.con;$('own-side').value=c.side;$('audience').value=c.audience;renderProjectAtlas();$('project-dialog').showModal();}
  async function download(content,name,type){return window.StartrackExportIO.deliver({content,name,type,title:T('辩论筑基·立论星轨'),savedMessage:I.language==='en'?'Saved in app documents: ':'文件已保存到应用文档目录：'});}
  function safeName(){return (project.context.motion||'出论项目').replace(/[\\/:*?"<>|]/g,'-').slice(0,55);}
  async function exportJSON(){try{await download(E.serialize(project),safeName()+'.json','application/json');toast('已导出项目，包含候选、来源与底层观念支线。');}catch(ex){error('导出失败：'+ex.message);}}
  async function exportDebug(){try{const snapshot=clone(project),bundle=await diagnostics.bundle({project:snapshot,config,ui:{step:currentStep,view,language:I.language,theme:document.documentElement.dataset.theme,error:$('error-banner').hidden?'':$('error-message').textContent,busy:!!busy,theoryFailures:Object.fromEntries(theoryFailures)},metrics:lastMetrics?.snapshot()||null,build:window.DUG_BUILD});await download(JSON.stringify(bundle,null,2),(snapshot.context.motion||'立论星轨').replace(/[\\/:*?"<>|]/g,'-').slice(0,55)+'-Debug-'+Date.now()+'.json','application/json');toast('已导出 Debug，包含本会话各轮记录、请求诊断与辩题内容，已脱敏密钥。');}catch(ex){error('Debug 导出失败：'+ex.message);}}
  function markdownText(){const c=project.context,lines=['# '+c.motion,'','我方：'+(c.side==='pro'?c.pro:c.con),project.mode==='demo'?'\n'+demoOf().disclaimer+'\n'+(demoOf().sourceNote||''):'','## 对方论点',''];if(project.origin)lines.push('来源：认知星图 · '+project.origin.filename+' · '+project.origin.poolKey,project.origin.isDemo?'来源为演示样本。':'频率沿用所选论点池的有效样本。',sourceSamplingText(),'');for(const a of active('argument'))lines.push('### '+a.title,a.manual?'手工补充':`${syntheticSamples()?'演示样本':'样本'}提及：${a.count}/${a.total}`,a.reason,a.qualification,'');for(const r of active('root')){lines.push('## 论点共性：'+r.title,r.explanation,'关联：'+r.argumentIds.map(id=>find('argument',id)?.title||id).join('；'),r.qualification,r.batchId?'共性采样提及：'+r.count+'/'+r.total+'（仅对应轮次）':'','');const ra=latestAnalysis('opponent',r.id);if(ra)lines.push('### 对方底层观念（独立支线）',...ra.items.flatMap(i=>['- '+i.title+'：'+i.explanation,'  依据：'+i.evidence+'；'+i.basis]),'');for(const d of active('direction').filter(x=>x.rootIds.includes(r.id))){lines.push('### '+d.kind+'候选：'+d.title,'承认：'+d.accepted,'转换：'+d.bridge,'判断：'+d.conclusion,'限定：'+d.qualification,d.batchId?'处理采样提及：'+d.count+'/'+d.total+'（仅对应轮次）':'',savedFor(d.id)?'已保留此路径。':'','');const da=latestAnalysis('own',d.id);if(da)lines.push('#### 我方底层观念（独立支线）',...da.items.flatMap(i=>['- '+i.title+'：'+i.explanation,'  依据：'+i.evidence+'；'+i.basis]),'');for(const f of active('framing').filter(f=>f.directionId===d.id))lines.push('#### 视角切入：'+f.title,...framingFields.map(([field,label])=>label+'：'+f[field]),f.stale?'待复核':'','');}}return lines.join('\n\n');}
  async function exportMarkdown(){try{await download(markdownText(),safeName()+'.md','text/markdown;charset=utf-8');}catch(ex){error('导出失败：'+ex.message);}}
  async function exportHTML(){try{renderTree();renderNarrative();I.apply();const html=window.DUG_REPORT.create({project:E.serialize(project),tree:$('tree-view'),narrative:$('narrative-view'),markdown:markdownText(),lang:I.language,theme:document.documentElement.dataset.theme,starState:starView.getState(),defaultView:view==='star'?'star':'tree'});await download(html,safeName()+'.html','text/html;charset=utf-8');toast('已导出报告，可离线阅读。');}catch(ex){error('导出失败：'+ex.message);}}
  function renderAtlasPreview(){
    if(!atlasSource)return;
    const side=$('atlas-side').value,pools=window.DUG_ATLAS.choices(atlasSource,side),old=$('atlas-pool').value;
    $('atlas-pool').innerHTML=pools.map(p=>`<option value="${esc(p.pool_key)}">${esc(T(p.actor))} · ${esc(T(p.stance==='中立'?'中立观察采样':'持方立场采样'))}</option>`).join('');
    if(pools.some(p=>p.pool_key===old))$('atlas-pool').value=old;
    const pool=pools.find(p=>p.pool_key===$('atlas-pool').value);
    $('atlas-confirm').disabled=!!busy||!pool||pool.status!=='complete'||!pool.items.length;
    $('atlas-pool-summary').innerHTML=!side?'<p>先确认我方持方，再选择对方论点池。</p>':!pool?'<p>报告没有这一方的独立论点池。请检查持方，或在认知星图中补充该方采样。</p>':`<p><strong>${pool.items.length} <span>个对方论点</span></strong> · ${pool.total} <span>份有效样本</span></p>${pool.sampling_status==='partial'?'<p class="status-line">部分样本未成功，频次仅使用成功样本。</p>':''}${pool.status!=='complete'?'<p class="form-error">所选论点池尚未完成有效聚合，不能直接导入频次。</p>':''}${atlasSource.isDemo?'<p class="status-line">来源是演示样本，频次仅用于演示。</p>':''}<div class="atlas-arguments-list">${pool.items.map(i=>`<div><span data-user-content>${esc(i.title)}</span><b>${i.count} / ${i.total}</b></div>`).join('')}</div>`;
    I.apply();
  }
  function openAtlas(){if(busy)return;atlasRead++;atlasSource=null;atlasFilename='';$('atlas-file').value='';$('atlas-preview').hidden=true;$('atlas-error').textContent='';$('atlas-confirm').disabled=true;$('atlas-dialog').showModal();}
  async function readAtlasFile(){
    const file=$('atlas-file').files[0],ticket=++atlasRead;atlasSource=null;$('atlas-preview').hidden=true;$('atlas-confirm').disabled=true;$('atlas-error').textContent='';if(!file)return;
    try{if(file.size>40000000)throw Error('认知星图文件过大或不是文本。');const raw=await file.text();if(ticket!==atlasRead||!$('atlas-dialog').open)return;if(busy)throw Error('当前正在生成，请等待完成或停止后再导入。原会话未切换。');atlasSource=window.DUG_ATLAS.read(raw);atlasFilename=file.name;
      $('atlas-motion').textContent=atlasSource.context.motion;
      $('atlas-side').innerHTML='<option value="">'+T('请选择我方持方')+'</option>'+[['pro','正方'],['con','反方']].map(([value,label])=>`<option value="${value}" data-user-content>${label} · ${esc(atlasSource.context.side_positions[label])}</option>`).join('');
      $('atlas-preview').hidden=false;renderAtlasPreview();
    }catch(ex){$('atlas-error').textContent=ex.message;}I.apply();
  }
  function setupEvents(){
    $('btn-language').onclick=()=>{I.setLanguage(I.language==='zh'?'en':'zh');render();refreshInspector();renderMetrics();};
    $('view-board').onclick=$('rail-board').onclick=()=>setView('board');$('view-narrative').onclick=()=>setView('narrative');$('view-tree').onclick=$('rail-tree').onclick=()=>setView('tree');$('view-star').onclick=()=>setView('star');
    $('project-atlas-open').onclick=()=>$('project-atlas-file').click();$('project-atlas-file').onchange=readProjectAtlasFile;$('own-side').onchange=renderProjectAtlas;$('project-atlas-pool').onchange=renderProjectAtlas;$('project-atlas-clear').onclick=resetProjectAtlas;$('project-dialog').addEventListener('close',()=>{projectAtlasRead++;projectAtlasReading=false;});
    $('btn-settings').onclick=openSettings;$('btn-project').onclick=()=>openProject();$('edit-project').onclick=()=>openProject(true);
    $('btn-demo').onclick=()=>{if(busy||!stash())return;project=demoProject($('demo-kind').value);currentStep='argument';responseRoot='';page={argument:4,root:4,direction:4};directionPages.clear();onlySelectedRoots=false;closeInspector();clearError();commit();toast('已载入演示；原会话保留在历史中。');};
    $('btn-atlas').onclick=openAtlas;$('atlas-file').onchange=readAtlasFile;$('atlas-side').onchange=renderAtlasPreview;$('atlas-pool').onchange=renderAtlasPreview;
    $('atlas-form').onsubmit=e=>{e.preventDefault();if(busy||!atlasSource)return;try{const next=window.DUG_ATLAS.createProject(atlasSource,{side:$('atlas-side').value,poolKey:$('atlas-pool').value,filename:atlasFilename});if(!activateProject(next))return;currentStep='argument';view='board';$('atlas-dialog').close();render();toast('已接入认知星图。检视论点后，可直接进入分析共性。');}catch(ex){$('atlas-error').textContent=ex.message;I.apply();}};
    $('btn-history').onclick=()=>sessionUI.open();
    $('btn-debug').onclick=exportDebug;$('error-debug').onclick=exportDebug;$('error-settings').onclick=openSettings;$('btn-export').onclick=()=>$('export-dialog').showModal();$('export-json').onclick=()=>{$('export-dialog').close();void exportJSON();};$('export-markdown').onclick=()=>{$('export-dialog').close();void exportMarkdown();};$('export-html').onclick=()=>{$('export-dialog').close();void exportHTML();};$('export-md').onclick=exportMarkdown;$('btn-import').onclick=()=>$('import-file').click();
    $('btn-saved').onclick=$('show-saved').onclick=showSaved;$('close-inspector').onclick=$('drawer-backdrop').onclick=closeInspector;
    $('dismiss-error').onclick=clearError;$('run-samples').onclick=()=>runSamples();$('retry-samples').onclick=()=>runSamples(true);$('reaggregate').onclick=()=>{if(needConfig())withJob('重新聚合',aggregateNow);};$('run-roots').onclick=runRoots;$('run-directions').onclick=()=>runDirections();$('run-framings').onclick=()=>runFramings();
    for(const kind of ['root','direction']){const stage=kind==='root'?'roots':'directions';for(const [field,id] of [['sampleCount','sample-count'],['concurrency','parallel-count']])$(kind+'-'+id).onchange=e=>{project.stageSettings[stage][field]=Number(e.target.value);commit();};$(kind+'-retry').onclick=()=>{if(needConfig())withJob('重试本轮失败采样',signal=>runStageSampling(kind,signal,'retry'));};$(kind+'-reaggregate').onclick=()=>{if(needConfig())withJob('重新聚合本轮样本',signal=>runStageSampling(kind,signal,'aggregate'));};}
    $('stop-run').onclick=()=>{if(busy){busy.controller.abort();$('stop-run').disabled=true;$('run-detail').textContent='正在停止…';}};
    $('select-all-arguments').onchange=e=>{active('argument').forEach(a=>a.selected=e.target.checked);commit();};
    $('clear-root-selection').onclick=()=>{active('root').forEach(r=>r.selected=false);commit();};$('filter-directions').onclick=()=>{responseRoot='';render();};$('response-filter').onchange=e=>{responseRoot=e.target.value;render();};
    for(const [kind,id] of [['argument','more-arguments'],['root','more-roots'],['direction','more-directions']])$(id).onclick=()=>{page[kind]+=4;render();};
    $('add-argument').onclick=()=>openEdit('argument');$('merge-arguments').onclick=mergeArguments;
    $('project-form').onsubmit=e=>{e.preventDefault();if(busy||projectAtlasReading)return;renderProjectAtlas();if($('project-create').disabled)return;
      const context={motion:$('motion').value.trim(),pro:$('pro-position').value.trim(),con:$('con-position').value.trim(),side:$('own-side').value,audience:$('audience').value.trim()};if(!context.motion||!context.pro||!context.con||!['pro','con'].includes(context.side))return;
      try{const imported=!!projectAtlasSource;const next=imported?window.DUG_ATLAS.createProject(projectAtlasSource,{side:context.side,poolKey:$('project-atlas-pool').value,filename:projectAtlasFilename}):E.makeProject(context);next.mode='live';if(imported)next.context.audience=context.audience;
        if(!activateProject(next))return;currentStep='argument';view='board';$('project-dialog').close();resetProjectAtlas();render();toast(imported?'工作区已创建，并载入所选对方论点。':editingContext?'已创建修订项目，旧项目可从本地历史恢复。':'工作区已创建，配置模型后即可穷举论点。');
      }catch(ex){$('project-error').textContent=ex.message;I.apply();}
    };
    $('edit-form').onsubmit=e=>{e.preventDefault();if(!editTarget||busy)return;const {kind,id}=editTarget;let n=id?find(kind,id):null;const data=Object.fromEntries(new FormData($('edit-form')));if(!n){n={id:E.uid('manual'),title:'',reason:'',qualification:'',memberIds:[],sampleIds:[],count:0,total:0,manual:true,selected:true,version:1,stale:false};project.arguments.push(n);}else{record('编辑内容',kind,n);E.invalidate(project,kind,[id]);}if(kind==='root'||kind==='direction')for(const field of ['batchId','memberIds','sampleIds','count','total'])delete n[field];for(const [k,v] of Object.entries(data))n[k]=String(v).trim();n.stale=false;$('edit-dialog').close();commit();inspect(kind,n.id);toast('修改已保存。');};
    $('split-form').onsubmit=e=>{e.preventDefault();const a=find('argument',splitTarget),picked=[...new FormData($('split-form')).getAll('members')];if(!a||!picked.length||picked.length===a.memberIds.length){$('split-error').textContent='请选择部分条目，确保两组都非空。';return;}record('拆分前版本','argument',a);E.invalidate(project,'argument',[a.id]);a.archived=true;a.selected=false;const items=samples().flatMap(s=>s.items);for(const [ix,members] of [picked,a.memberIds.filter(id=>!picked.includes(id))].entries()){const sampleIds=[...new Set(members.map(id=>items.find(i=>i.id===id).sampleId))];project.arguments.push({...clone(a),id:E.uid('arg'),title:a.title+' · '+(ix+1),memberIds:members,sampleIds,count:sampleIds.length,version:1,stale:false,archived:false,selected:true});}$('split-dialog').close();closeInspector();commit();toast('已拆为两组，可分别编辑表述。');};
    $('import-file').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>40000000)throw Error('项目文件大于40MB。');const raw=await file.text();if(busy)throw Error('当前正在生成，请等待完成或停止后再导入。原会话未切换。');const next=E.deserialize(raw);const duplicate=next.id===project.id||sessionStore.list().some(item=>item.id===next.id);if(!stash())return;if(duplicate){next.id=E.uid('project');next.createdAt=now();next.updatedAt=now();}project=next;currentStep=next.framings?.length?'framing':next.directions.length?'direction':next.roots.length?'root':'argument';responseRoot='';theoryFailures.clear();page={argument:4,root:4,direction:4};directionPages.clear();onlySelectedRoots=false;closeInspector();clearError();commit();toast(duplicate?'已导入为新会话副本；原会话及后续修改仍在历史中。':'项目已导入。API密钥需在本页另行填写。');}catch(ex){error('导入失败：'+ex.message);}finally{e.target.value='';}};
    document.addEventListener('click',e=>{const close=e.target.closest('[data-close]');if(close){$(close.dataset.close).close();return;}const step=e.target.closest('[data-step],[data-go-step]');if(step){setStep(step.dataset.step||step.dataset.goStep);return;}const b=e.target.closest('[data-action]');if(!b)return;const {action,kind,id}=b.dataset;
      if(action==='inspect')inspect(kind,id);
      if(action==='select'){if(!busy){const n=find(kind,id);n.selected=b.checked;commit();}}
      if(action==='theory')inspect(kind,id,true);
      if(action==='analyze-theory')analyzeTheory(kind,id);
      if(action==='save'){toggleSaved(id);if(!focus&&!$('inspector').hidden)showSaved();}
      if(action==='edit')openEdit(kind,id);
      if(action==='split')openSplit(id);
      if(action==='expand-root')runDirections();
      if(action==='focus-responses'){responseRoot=id;setStep('direction');}
      if(action==='focus-framing'){setStep('framing');document.querySelector('[data-framing-direction="'+CSS.escape(id)+'"]')?.scrollIntoView({block:'start',behavior:'smooth'});}
      if(action==='run-framing')runFramings(id);
      if(action==='view-tree')setView('tree');
      if(action==='view-narrative')setView('narrative');
      if(action==='more-root-directions'){directionPages.set(id,(directionPages.get(id)||2)+2);render();}
      if(action==='export-md')exportMarkdown();
      if(action==='history')archivedView();
      if(action==='samples')showSamples();
      if(action==='stage-samples')showStageSamples(kind,id);
      if(action==='confirm'&&!busy){const n=find(kind,id);record('人工复核',kind,n);n.stale=false;commit();inspect(kind,id);}
      if(action==='open-sessions'){closeInspector();sessionUI.open();}
    });
    document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[role=button][data-action]')){e.preventDefault();e.target.click();}if(e.key==='Escape'&&!$('inspector').hidden)closeInspector();});
    window.addEventListener('beforeunload',e=>{if(busy){e.preventDefault();e.returnValue='';}});
  }
  async function prepareLeave(){
    if(busy){
      if(!confirm(T('模型仍在运行。停止运行并返回主页？已完成的内容会保留。')))return false;
      busy.controller.abort();
      const deadline=Date.now()+5000;
      while(busy&&Date.now()<deadline)await new Promise(resolve=>setTimeout(resolve,40));
      if(busy){error('正在停止模型请求，请稍后再返回。');return false;}
    }
    return stash();
  }
  function init(){
    let migrationWarning='';
    sessionStore=window.DUG_HISTORY.createStore({storage:localStorage,serialize:E.serialize,deserialize:E.deserialize});
    try{const result=sessionStore.migrateLegacy();if(result.errors.length)migrationWarning='部分旧会话无法迁移，原始记录已保留。可先导出仍能打开的项目。';}catch(ex){migrationWarning='历史迁移未完成，原始记录已保留：'+ex.message;}
    settingsUI=window.DUG_SETTINGS.create({storage:localStorage,key:CONFIG,onSave:next=>{config=next;if(project)render();toast('模型设置已保存；密钥仅保留在本页。');}});config=settingsUI.getConfig();
    let currentRaw=null;
    try{currentRaw=localStorage.getItem(STORE);project=currentRaw?E.deserialize(currentRaw):demoProject();}catch(ex){
      project=demoProject();migrationWarning+=' 原项目无法读取，已展示演示：'+ex.message;
      // Keep the exact unreadable input before the demo can become the new current project.
      try{if(currentRaw!==null)localStorage.setItem(STORE+'.unreadable.'+Date.now(),currentRaw);else currentStorageWritable=false;}catch(_){currentStorageWritable=false;}
    }
    sessionUI=window.DUG_HISTORY_UI.create({store:sessionStore,getCurrent:()=>project,activate:activateProject,isBusy:()=>!!busy,onError:error,download});
    starView=window.DUG_STARVIEW.create($('star-view'),{inspect:(kind,id)=>inspect(kind,id),step:setStep});
    setupEvents();commit();if(migrationWarning)error(migrationWarning);window.DUGApp=Object.freeze({prepareLeave,getState:()=>clone(project),isBusy:()=>!!busy,getView:()=>view,getStep:()=>currentStep,getMetrics:()=>lastMetrics?.snapshot()||null});
  }
  init();
})();
