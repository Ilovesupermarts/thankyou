// node time.js DPR   : how long hill-options.html#B takes to load at that device scale (a fast check for slow drawing).
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1480, height: 924 }, deviceScaleFactor: +process.argv[2] });
  const t0 = Date.now(); await p.goto('http://localhost:8765/hill-options.html?bare#B', { timeout: 120000 }); console.log('load ms', Date.now() - t0);
  await b.close();
})();
