// node field-probe.js '[[x,y],…]' — run from this folder: what the snow field's line of sight through each CSS-px point meets (winterLab.fieldProbe): the path's rise box, hit, height, a (distance from the path's edge)
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const U = JSON.parse(fs.readFileSync('user-values.json', 'utf8')); U.ver = 6; U.V.ytShow = false;
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1480, height: 924 }, deviceScaleFactor: 1 });
  await p.goto('http://localhost:8765/newwinter.html');
  await p.evaluate((U) => { localStorage.clear(); localStorage.setItem('newWinter-1', JSON.stringify(U)); }, U);
  await p.reload();
  for (let i = 0; i < 300; i++) { await p.waitForTimeout(500); if (await p.evaluate(() => !!winterLab.fieldProbe(10, 800))) break; }
  const pts = JSON.parse(process.argv[2]);
  for (const q of pts) console.log(q, JSON.stringify(await p.evaluate((q) => winterLab.fieldProbe(q[0], q[1]), q), (k, v) => typeof v === 'number' ? +v.toFixed(3) : v));
  await b.close();
})();
