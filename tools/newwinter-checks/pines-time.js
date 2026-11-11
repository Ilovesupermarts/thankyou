// node pines-time.js  — how long one big fir (variant 1, 8.5 m, the right-edge one) takes to bake in one go (ms), and how many foliage pieces it has. Serve the repo on 8765 first.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage(); const errs=[]; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/tools/newwinter-checks/pines-time.html', { timeout: 300000 });
  console.log(await p.evaluate(() => JSON.stringify({ total: Math.round(window.total), fol: window.fol })), errs.join('|'));
  await b.close();
})();
