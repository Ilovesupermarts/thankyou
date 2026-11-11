// node bake-time.js  — waits until baked, asks for the lake to be baked again and prints the report's last lines (the time of each bake step).
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1480, height: 924 } });
  await p.goto('http://localhost:8765/newwinter.html'); await p.evaluate(()=>localStorage.clear()); await p.reload();
  for (let i = 0; i < 120; i++) { await p.waitForTimeout(500); if (await p.evaluate(() => !winterLab.busy())) break; }
  await p.evaluate(() => winterLab.changed('lake'));
  for (let i = 0; i < 60; i++) { await p.waitForTimeout(500); if (await p.evaluate(() => !winterLab.busy())) break; }
  console.log(await p.evaluate(() => winterLab.report().split('\n').slice(-4).join('\n')));
  await b.close();
})();
