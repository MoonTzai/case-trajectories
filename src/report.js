/* Offline reading artifact: no model client, settings, autosave or editable project UI. */
(() => {
  'use strict';
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const json=value=>JSON.stringify(value).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
  function readingCopy(source){
    const copy=source.cloneNode(true);copy.hidden=false;copy.removeAttribute('id');
    for(const el of copy.querySelectorAll('input,select,textarea,script,iframe'))el.remove();
    for(const el of copy.querySelectorAll('[data-action="inspect"],[data-action="theory"]')){
      el.dataset.reportInspect=el.dataset.action;el.dataset.reportKind=el.dataset.kind;el.dataset.reportId=el.dataset.id;
    }
    for(const button of copy.querySelectorAll('button')){
      if(button.dataset.reportInspect)continue;
      if(['save','focus-framing','focus-responses','retry-theory'].includes(button.dataset.action)){button.remove();continue;}
      const span=document.createElement('span');span.className=button.className+' report-label';
      span.append(...button.childNodes);button.replaceWith(span);
    }
    for(const el of copy.querySelectorAll('*')){
      for(const attr of [...el.attributes])if(/^on/i.test(attr.name)||attr.name.startsWith('data-action')||attr.name==='tabindex'||attr.name==='role')el.removeAttribute(attr.name);
    }
    return copy.outerHTML;
  }
  function create({project,tree,narrative,markdown,lang,theme,starState=null,defaultView='tree'}){
    const p=JSON.parse(project),en=lang==='en',t=(zh,english)=>en?english:zh;
    const title=t('辩论筑基·立论星轨','Case Trajectories');
    const css=[...document.querySelectorAll('style')].map(s=>s.textContent).join('\n');
    const logo=document.querySelector('.masthead-logo').src;
    const script=function(){
      const data=JSON.parse(document.getElementById('startrack-project').textContent);
      const en=document.documentElement.lang==='en',t=(zh,english)=>en?english:zh;
      const dialog=document.createElement('dialog');dialog.id='report-detail';
      const heading=document.createElement('h2'),close=document.createElement('button'),body=document.createElement('div');
      close.className='btn outline';close.textContent=t('关闭','Close');close.onclick=()=>dialog.close();
      dialog.append(close,heading,body);document.body.append(dialog);
      const fields={reason:['理由','Reason'],qualification:['适用条件','Conditions'],explanation:['解释','Explanation'],accepted:['承认对方什么','What we accept'],bridge:['怎样消化／反转','How we absorb / reverse'],conclusion:['导向我方什么判断','Our conclusion'],motionReading:['从哪里切入辩题','Reading the motion'],focalQuestion:['今天真正需要判断什么','The focal question'],entryRoute:['怎样一步步引入这个视角','Introducing the perspective'],opening:['可以怎样开场','Possible opening'],handoff:['怎样接回消化／反转','Connecting to the response'],category:['类别','Category'],evidence:['依据','Evidence'],basis:['推断性质','Basis'],source:['来源','Source']};
      const add=(title,text)=>{if(!text)return;const section=document.createElement('section'),h=document.createElement('h3'),p=document.createElement('p');h.textContent=title;p.textContent=String(text);section.append(h,p);body.append(section);};
      const details=node=>{for(const [key,labels]of Object.entries(fields))if(node[key])add(t(...labels),node[key]);};
      const inspectNode=(kind,id,showTheory=false)=>{
          const key={argument:'arguments',root:'roots',direction:'directions',framing:'framings'}[kind];
          const node=(data[key]||[]).find(n=>n.id===id);if(!node)return;
          body.replaceChildren();heading.textContent=node.title;
          if(showTheory){
            const analysis=(data.analyses||[]).filter(a=>a.anchorId===id&&a.kind===(kind==='root'?'opponent':'own')).at(-1);
            for(const item of analysis?.items||[]){const h=document.createElement('h3');h.textContent=item.title;body.append(h);details(item);}
            if(!analysis?.items?.length)add(t('底层观念','Underlying ideas'),t('尚无已完成的分析。','No completed analysis.'));
          }else{
            details(node);
            if(Number.isInteger(node.total))add(t('样本提及','Sample mentions'),node.count+' / '+node.total);
            for(const rid of node.rootIds||[]){const r=data.roots.find(n=>n.id===rid);if(r)add(t('对应论点共性','Linked commonality'),r.title);}
            for(const aid of node.argumentIds||[]){const a=data.arguments.find(n=>n.id===aid);if(a)add(t('对应对方论点','Linked opposing argument'),a.title+'\n'+a.reason);}
          }
          if(!dialog.open)dialog.showModal();
      };
      document.querySelectorAll('[data-report-inspect]').forEach(el=>{
        const inspect=()=>inspectNode(el.dataset.reportKind,el.dataset.reportId,el.dataset.reportInspect==='theory');
        el.onclick=inspect;
        if(el.tagName!=='BUTTON'){el.tabIndex=0;el.setAttribute('role','button');el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();inspect();}};}
      });
      const starState=JSON.parse(document.getElementById('startrack-view-state').textContent);
      const star=window.DUG_STARVIEW.create(document.getElementById('report-star'),{initialState:starState,snapshot:true,inspect:inspectNode});
      star.update(data,{lang:en?'en':'zh'});
      document.querySelectorAll('[data-report-tab]').forEach(button=>button.onclick=()=>{
        document.querySelectorAll('[data-report-tab]').forEach(b=>b.classList.toggle('selected',b===button));
        document.querySelectorAll('[data-report-panel]').forEach(panel=>panel.hidden=panel.dataset.reportPanel!==button.dataset.reportTab);
      });
      document.getElementById('report-theme').onclick=()=>{document.documentElement.dataset.theme=document.documentElement.dataset.theme==='dark'?'light':'dark';};
      document.getElementById('report-json').onclick=()=>void StartrackExportIO.deliver({content:JSON.stringify(data,null,2),type:'application/json',name:'Case-Trajectories-'+data.context.motion.slice(0,60)+'.json',title:document.title});
      document.getElementById('report-print').onclick=()=>window.print();
    };
    return `<!doctype html><html lang="${en?'en':'zh-CN'}" data-theme="${theme==='dark'?'dark':'light'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title+' · '+p.context.motion)}</title><style>${css}
      body{padding:0}.report-header{max-width:1480px;margin:auto;padding:28px 24px}.report-header h1{font-size:26px;display:block}.report-header>p{margin-top:16px;line-height:1.8;color:var(--muted)}.report-toolbar{display:flex;gap:8px;flex-wrap:wrap;margin:20px 0}.report-toolbar button{white-space:normal}.report-main{max-width:1480px;padding-top:0}.report-label{cursor:default}.report-main pre{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.9;padding:22px;background:var(--surface);border:1px solid var(--line);border-radius:12px}.report-main .tree-sources .report-label{display:flex;gap:6px;padding:8px}.report-main .tree-arguments .report-label{display:flex;flex-direction:column;gap:6px}.report-main .narrative-argument{display:flex}#report-detail{max-width:min(720px,calc(100vw - 24px))}#report-detail>button{float:right}#report-detail h2{margin:14px 0}#report-detail section{margin:18px 0}#report-detail h3{font-size:14px;color:var(--muted);margin:8px 0}#report-detail p{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.85}
      @media print{body{background:#fff!important;color:#111!important}.report-toolbar{display:none}main [data-report-panel]{display:block!important}.report-header{padding:0}details>*{display:block!important}.tree-branch{display:block}.tree-link{display:none}.report-main{max-width:none;padding:0}.node-card,.narrative-path{break-inside:avoid}*{box-shadow:none!important;color:#111!important}}
      </style></head><body><header class="report-header"><div class="masthead-brand"><img class="masthead-logo" src="${logo}" alt=""><div class="brand-copy"><h1 class="brand-title">${esc(title)}</h1><p class="brand-subtitle">${t('结构性交锋立论·辅助工具','Structural Clash · Case Construction Assistant')}</p></div></div><p><strong>${esc(p.context.motion)}</strong><br>${t('我方：','Our side: ')}${esc(p.context.side==='pro'?p.context.pro:p.context.con)}<br>${t('阅读快照 · 已完成内容；频次不是正确率。','Reading snapshot · Completed content; frequency is not an accuracy score.')} ${p.mode==='demo'?t('演示内容。','Example content.'):''}</p><nav class="report-toolbar view-switch"><button class="${defaultView==='tree'?'selected':''}" data-report-tab="tree">${t('路径树','Path tree')}</button><button data-report-tab="narrative">${t('叙事流程','Narrative flow')}</button><button class="${defaultView==='star'?'selected':''}" data-report-tab="star">${t('星轨视图','Startrack view')}</button><button data-report-tab="text">${t('完整文本','Full text')}</button><button id="report-theme">${t('深色 / 浅色','Dark / Light')}</button><button id="report-json">${t('导出会话 .json','Export session .json')}</button><button id="report-print">${t('打印 / PDF','Print / PDF')}</button></nav></header><main class="report-main"><section data-report-panel="tree" ${defaultView==='tree'?'':'hidden'}>${readingCopy(tree)}</section><section data-report-panel="narrative" hidden>${readingCopy(narrative)}</section><section data-report-panel="star" ${defaultView==='star'?'':'hidden'}><div id="report-star"></div></section><section data-report-panel="text" hidden><pre>${esc(markdown)}</pre></section></main><script type="application/json" id="startrack-project">${json(p)}</script><script type="application/json" id="startrack-view-state">${json(starState)}</script><script>${window.DUG_STARVIEW.standaloneSource()}</script><script>${window.StartrackExportIO.standaloneSource()}</script><script>(${script.toString()})();</script></body></html>`;
  }
  window.DUG_REPORT=Object.freeze({create});
})();
