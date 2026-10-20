/* Coach back contract, standalone home, and intentional left-edge mobile return. */
(() => {
  'use strict';
  let leaving=false,start=null;
  function closeOverlay(){
    const modal=[...document.querySelectorAll('dialog[open]')].pop();
    if(modal){modal.close();return true;}
    if(!document.getElementById('inspector').hidden){document.getElementById('close-inspector').click();return true;}
    const pathMenu=document.querySelector('.sv-floating.is-open:not([hidden]) [data-sv-dock-toggle]');
    if(pathMenu){pathMenu.click();return true;}
    return false;
  }
  async function home(){
    if(leaving)return;
    leaving=true;
    try{
      if(!await window.DUGApp.prepareLeave())return;
      if(typeof window.goHome==='function'){window.goHome();return;}
      closeOverlay();document.querySelector('[data-step="argument"]').click();window.scrollTo({top:0,behavior:'smooth'});
    }finally{leaving=false;}
  }
  // Parent hardware-back navigation calls this before removing the iframe.
  window.DCHandleBack=()=>{if(closeOverlay())return true;void home();return true;};
  document.getElementById('btn-home').onclick=()=>void home();
  const excluded=target=>target.closest('input,textarea,select,button,a,[contenteditable],dialog,#inspector,.sv-floating');
  document.addEventListener('touchstart',event=>{
    start=null;if(event.touches.length!==1||excluded(event.target))return;
    const t=event.touches[0];if(t.clientX>24)return;
    // Let horizontally scrollable diagrams and controls own their gestures.
    for(let el=event.target;el&&el!==document.body;el=el.parentElement){if(el.scrollWidth>el.clientWidth+2&&/auto|scroll/.test(getComputedStyle(el).overflowX))return;}
    start={x:t.clientX,y:t.clientY,time:Date.now()};
  },{passive:true});
  document.addEventListener('touchend',event=>{
    const s=start;start=null;if(!s||event.changedTouches.length!==1)return;
    const t=event.changedTouches[0],dx=t.clientX-s.x,dy=Math.abs(t.clientY-s.y);
    if(dx>=90&&dy<60&&dx>dy*2.5&&Date.now()-s.time<900)window.DCHandleBack();
  },{passive:true});
  document.addEventListener('touchcancel',()=>{start=null;},{passive:true});
})();
