// node pines-variants.js OUT.png SCALE [?v=2]  — the variants check page (tools/newwinter-checks/pines-variants.html) at SCALE (1 or 2), saves a picture, prints each variant's wood painter, clump count and box. Serve the repo on 8765 first. ?v=N draws variant N alone.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1480, height: 924 }, deviceScaleFactor: +(process.argv[3]||1) });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type()==='error') errs.push(m.text()); });
  await p.goto('http://localhost:8765/tools/newwinter-checks/pines-variants.html' + (process.argv[4]||''));
  await p.waitForFunction(() => window.ready, null, { timeout: 120000 });
  console.log(JSON.stringify(await p.evaluate(() => [0,1,2,3,4].map(i => window['info'+i]))));
  await p.screenshot({ path: process.argv[2], timeout: 120000 });
  console.log(errs.join('\n')); await b.close();
})();
