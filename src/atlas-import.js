/* Import only the selected argument pool. Never evaluate an imported HTML file. */
(function(global){
  'use strict';
  const E=global.DUG||(typeof require==='function'?require('./engine.js'):null);
  const Ideas=global.AtlasIdeas||(typeof require==='function'?require('./atlas-ideas.js'):null);
  const fail=message=>{throw new Error(message);};
  function read(raw){
    if(typeof raw!=='string'||raw.length>40000000)fail('认知星图文件过大或不是文本。');
    let text=raw.trim();
    if(text.startsWith('<')){
      // Read the inert JSON data block only; no scripts, markup or resources are mounted.
      const blocks=[...text.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)];
      const block=blocks.find(m=>/\bid\s*=\s*(["'])atlas-report-data\1/i.test(m[1])&&/\btype\s*=\s*(["'])application\/json\1/i.test(m[1]));
      if(!block)fail('没有找到认知星图报告数据，请使用“导出报告 .html”或历史会话 JSON。');
      text=block[2];
    }
    let value;try{value=JSON.parse(text);}catch(_){fail('文件不是可读取的认知星图 HTML 报告或 JSON。');}
    const p=value?.session?.payload||value;
    const report=p?.report;
    if(report?.schema_version!==4)fail('当前支持认知星图第 4 版结构化报告，需包含原始采样。旧版报告和 Markdown 暂不支持直接接入。');
    if(!['typed-ideas-v1','typed-ideas-v2'].includes(report.protocol_version))fail('这份认知星图使用了尚未支持的采样协议。');
    const samples=p.samples||p.branches;
    if(!Array.isArray(samples))fail('报告缺少原始采样，无法核对论点来源和频次。');
    const projected=Ideas.project(report,samples);
    if(!projected.context)fail('报告的辩题或双方持方信息不完整。');
    const pools=projected.pools.filter(pool=>pool.kind==='arguments');
    if(!pools.length)fail('报告中没有独立的论点采样池。');
    return{report,samples,context:projected.context,pools,isDemo:!!(p.isDemo||p.is_demo||p.data?.isDemo||p.data?.is_demo),warnings:projected.warnings};
  }
  function choices(source,ownSide){
    if(!['pro','con'].includes(ownSide))return[];
    const opponent=ownSide==='pro'?'反方':'正方';
    return source.pools.filter(p=>p.actor===opponent);
  }
  function createProject(source,{side,poolKey,filename=''}){
    const pool=choices(source,side).find(p=>p.pool_key===poolKey);
    if(!pool)fail('请选择属于对方的论点池，不能把我方论点或攻击池当作对方论点。');
    if(pool.status!=='complete'||!pool.total)fail('所选论点池尚未完成有效聚合，不能直接导入频次。');
    if(!pool.items.length)fail('所选论点池没有论点，无法继续分析共性。');
    const c=source.context;
    const project=E.makeProject({motion:c.motion,pro:c.side_positions['正方'],con:c.side_positions['反方'],side,audience:[c.audience_context,c.format].filter(Boolean).join('\n')});
    project.mode='live';
    project.origin={type:'cognitive-atlas',filename:String(filename).slice(0,500),poolKey:pool.pool_key,actor:pool.actor,stance:pool.stance,protocol:source.report.protocol_version,isDemo:source.isDemo,importedAt:project.createdAt};
    project.origin.sampling={requested:pool.requested,valid:pool.total,failed:pool.failed,missing:pool.missing,empty:pool.empty_samples,status:pool.sampling_status,issues:[...new Set([...pool.issues,...(source.warnings||[])])]};
    const sampleId=id=>'atlas-CH'+String(id).padStart(2,'0');
    const itemId=id=>'atlas-'+id;
    const ss=pool.sample_ids.map(id=>({id:sampleId(id),status:'complete',raw:source.samples.find(s=>s.id===id).text,error:'',items:pool.records.filter(r=>r.sample_id===id).map(r=>({id:itemId(r.id),sampleId:sampleId(id),claim:r.claim,reason:[r.reason,r.example?'例子／引文：'+r.example:''].filter(Boolean).join('\n'),qualification:r.qualification}))}));
    const batch={id:E.uid('atlas-batch'),createdAt:project.createdAt,condition:{model:'认知星图导入',endpoint:'import:cognitive-atlas',sampleCount:ss.length,concurrency:1},samples:ss,label:'认知星图 · '+pool.pool_key,status:'complete'};
    const clusters=pool.items.map(item=>({title:item.title,reason:item.summary,qualification:[...new Set(pool.records.filter(r=>item.member_ids.includes(r.id)).map(r=>r.qualification).filter(Boolean))].join('\n'),memberIds:item.member_ids.map(itemId)}));
    batch.raw=JSON.stringify({source:'cognitive-atlas',pool_key:pool.pool_key,clusters:pool.items.map(i=>({id:i.id,title:i.title,member_ids:i.member_ids,source_ids:i.source_ids}))});
    project.batches=[batch];project.arguments=E.aggregate(ss,{clusters});
    project.arguments.forEach((a,i)=>{a.batchId=batch.id;a.sourceId=pool.items[i].id;});
    project.history.push({id:E.uid('history'),at:project.createdAt,action:'导入认知星图论点池：'+pool.pool_key,kind:'import',entityId:'',before:{}});
    return E.deserialize(E.serialize(project));
  }
  const api={read,choices,createProject};global.DUG_ATLAS=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
