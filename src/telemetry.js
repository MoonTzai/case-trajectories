(function(global){
  'use strict';
  function estimate(text){let latin=0,wide=0;for(const c of String(text||'')){if(c.codePointAt(0)>127)wide++;else latin++;}return Math.ceil(wide+latin/4);}
  function create(clock=()=>Date.now()){
    const started=clock(), requests=new Map();let ended=null;
    function update(id,event){
      const r=requests.get(id)||{inputEstimate:0,outputEstimate:0,characters:0,reasoningCharacters:0,active:true,lastAt:started,usage:null};
      for(const key of ['inputEstimate','outputEstimate','characters','reasoningCharacters'])if(Number.isFinite(event[key])&&event[key]>=0)r[key]=event[key];
      if(event.phase==='receiving'||event.phase==='complete')r.lastAt=clock();
      if(event.usage){const u=event.usage;r.usage=r.usage||{};for(const key of ['prompt_tokens','completion_tokens'])if(Number.isFinite(u[key])&&u[key]>=0)r.usage[key]=u[key];}
      if(['complete','failed','cancelled'].includes(event.phase))r.active=false;
      requests.set(id,r);
    }
    function snapshot(){const xs=[...requests.values()];return{elapsedMs:(ended??clock())-started,requests:xs.length,active:xs.filter(r=>r.active).length,input:xs.reduce((n,r)=>n+(r.usage?.prompt_tokens??r.inputEstimate),0),output:xs.reduce((n,r)=>n+(r.usage?.completion_tokens??r.outputEstimate),0),inputActual:xs.length>0&&xs.every(r=>r.usage?.prompt_tokens!==undefined),outputActual:xs.length>0&&xs.every(r=>r.usage?.completion_tokens!==undefined),characters:xs.reduce((n,r)=>n+r.characters,0),reasoningCharacters:xs.reduce((n,r)=>n+r.reasoningCharacters,0),idleMs:clock()-Math.max(started,...xs.map(r=>r.lastAt)),ended:ended!==null};}
    return {update,snapshot,finish(){ended=clock();return snapshot();}};
  }
  const api={create,estimate};global.DUG_METRICS=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
