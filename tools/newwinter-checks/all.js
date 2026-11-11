// node all.js OUTDIR   : the preview page's four views (B, B at dusk, A, C), 1480x924 at 2x, clip x0 y150 640x480, with load times -> OUTDIR/vB.png vBd.png vA.png vC.png. Compare two versions with PIL ImageChops.difference to prove nothing else moved.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const [q, h, f] of [['?bare', 'B', 'vB'], ['?bare&dusk', 'B', 'vBd'], ['?bare', 'A', 'vA'], ['?bare', 'C', 'vC']]) {
    const p = await b.newPage({ viewport: { width: 1480, height: 924 }, deviceScaleFactor: 2 });
    p.on('pageerror', e => console.log(f, 'ERR', e.message)); p.on('console', m => { if (m.type() === 'error') console.log(f, 'console', m.text()); });
    const t0 = Date.now(); await p.goto('http://localhost:8765/hill-options.html' + q + '#' + h, { timeout: 120000 }); console.log(f, Date.now() - t0, 'ms');
    await p.screenshot({ path: process.argv[2] + '/' + f + '.png', clip: { x: 0, y: 150, width: 640, height: 480 } }); await p.close();
  }
  await b.close();
})();
