// node frost-tree.js OUT.png SCALE 'seed=5&D=60&h=11' — frost-tree.html (one frosted tree large, lit as the scene at 15:30), prints its bake time
const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2], scale = +(process.argv[3] || 1), q = process.argv[4] || '';
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 900, height: 700 }, deviceScaleFactor: scale });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('http://localhost:8765/tools/newwinter-checks/frost-tree.html?' + q);
  await p.waitForFunction(() => window.done, null, { timeout: 300000 });
  console.log(JSON.stringify(await p.evaluate(() => window.done)));
  await p.screenshot({ path: out, timeout: 120000 });
  console.log(errs.join('\n') || 'no errors');
  await b.close();
})();
