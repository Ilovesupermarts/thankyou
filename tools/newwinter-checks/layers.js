// node layers.js OUTDIR  — saves the lake's baked MIRROR and STILL pictures as mirror.png / still.png (to see what each layer holds on its own); needs winterLab.layers().
const { chromium } = require('playwright'); const fs=require('fs');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1480, height: 924 }, deviceScaleFactor: 2 });
  await p.goto('http://localhost:8765/newwinter.html'); await p.evaluate(()=>localStorage.clear()); await p.reload();
  for (let i = 0; i < 100; i++) { await p.waitForTimeout(500); if (await p.evaluate(() => !winterLab.busy() && winterLab.layers().mirror.width>2)) break; }
  const d = await p.evaluate(() => { var L = winterLab.layers(); return { m: L.mirror.toDataURL(), s: L.still.toDataURL() }; });
  fs.writeFileSync(process.argv[2]+'/mirror.png', Buffer.from(d.m.split(',')[1],'base64'));
  fs.writeFileSync(process.argv[2]+'/still.png', Buffer.from(d.s.split(',')[1],'base64'));
  await b.close();
})();
