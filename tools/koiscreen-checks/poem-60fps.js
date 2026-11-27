// node poem-60fps.js OUT MODE DUR  (MODE 1 = ink wash, 0 = brush; DUR = pvLineDur s). The repo served on :8765.
// Pictures of the poem's first column under an even 60-frames-a-second clock (the sandbox is too slow to show the ink otherwise).
// virtual 60 fps clock: every frame advances exactly 1/60 s, whatever the machine's speed
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const p=await b.newPage({viewport:{width:1480,height:924}});
const mode=process.argv[3]||'1', dur=+(process.argv[4]||2.2);
await p.addInitScript(([m,d])=>{try{const k='koiScreen-1';const v=JSON.parse(localStorage.getItem(k)||'{}');v.pvLineMode=+m;v.pvLineDur=d;v.inkPlay=0;v.pvAt=0.2;localStorage.setItem(k,JSON.stringify(v));}catch(e){}
  let vt=0, q=[]; window.__vt=()=>vt; window.__stop=1e9;
  performance.now=()=>vt;
  window.requestAnimationFrame=cb=>{q.push(cb);return q.length};
  window.cancelAnimationFrame=()=>{};
  (function pump(){ if(vt<window.__stop){ vt+=1000/60; const c=q; q=[]; c.forEach(f=>{try{f(vt)}catch(e){console.error(e.message)}}); } setTimeout(pump,0); })();
},[mode,dur]);
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8765/koiscreen.html');
await p.evaluate(()=>window.__stop=0);
await p.waitForTimeout(3000);
const r=await p.evaluate(()=>{const c=document.querySelector('.pv-col').getBoundingClientRect();return {x:c.left-20,y:c.top-20,w:c.width+40,h:c.height+40}});
// writing starts pvAt (0.2 s, a real-time timer) after load: find the virtual time when it starts
await p.evaluate(()=>window.__stop=1e9);
await p.waitForFunction(()=>document.querySelector('#pv.writing'),null,{timeout:60000});
const vs=await p.evaluate(()=>window.__vt());
const times=[0.2,0.5,0.8,1.1,1.4,1.7,2.0,2.4,2.8,3.4];
for(const [i,tt] of times.entries()){
  await p.evaluate(s=>window.__stop=s,vs+tt*1000);
  await p.waitForFunction(s=>window.__vt()>=s,vs+tt*1000,{timeout:120000,polling:50});
  await p.screenshot({path:`${process.argv[2]}-${i}.png`,clip:{x:r.x,y:r.y,width:r.w,height:r.h}});
}
console.log('errors',errs);await b.close();})();
