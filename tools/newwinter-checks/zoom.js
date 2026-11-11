// node zoom.js OUT.png X Y W H DPR [QUERY]   : screenshot a clip of hill-options.html#B (QUERY e.g. '?bare', '?bare&notrees', '?bare&dusk'; default '?notrees'). DBG=1 sets window.DBG.
const { chromium } = require('playwright');
(async () => {
  const [out, x, y, w, h, dpr, q] = process.argv.slice(2);
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1480, height: 924 }, deviceScaleFactor: +dpr });
  p.on('console', m => console.log(m.text())); p.on('pageerror', e => console.log('ERR', e.message));
  if (process.env.DBG) await p.addInitScript(() => { window.DBG = 1; });
  await p.goto('http://localhost:8765/hill-options.html' + (q||'?notrees') + '#B'); await p.waitForTimeout(4000);
  await p.screenshot({ path: out, clip: { x: +x, y: +y, width: +w, height: +h } });
  await b.close();
})();
