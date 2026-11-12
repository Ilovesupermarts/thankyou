// node layers-compare.js PREFIX '{"V":{...}}' — saves the baked snow ground (PREFIX-field.png) and the hall layer (PREFIX-hall.png); run it against two servers (BASE=...) and compare with PIL ImageChops.difference(...).getbbox() to prove nothing else moved (whole screenshots always differ: clouds, water, branches move).
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const pre = process.argv[2], set = JSON.parse(process.argv[3] || '{}');
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1480, height: 924 } });
  await p.goto((process.env.BASE || 'http://localhost:8765') + '/newwinter.html');
  await p.evaluate((set) => { localStorage.clear(); localStorage.setItem('shotSet', JSON.stringify(set)); }, set);
  await p.reload();
  await p.evaluate(() => { var s = JSON.parse(localStorage.getItem('shotSet')); for (var g in s) for (var k in s[g]) winterLab[g][k] = s[g][k]; winterLab.changed('all'); });
  await p.waitForTimeout(1500);
  for (let i = 0; i < 1200; i++) { await p.waitForTimeout(500); if (await p.evaluate(() => !winterLab.busy())) break; }
  const d = await p.evaluate(() => ({ f: winterLab.layers().field.toDataURL(), h: winterLab.hall().cnv ? winterLab.hall().cnv.toDataURL() : '' }));
  fs.writeFileSync(pre + '-field.png', Buffer.from(d.f.split(',')[1], 'base64'));
  if (d.h) fs.writeFileSync(pre + '-hall.png', Buffer.from(d.h.split(',')[1], 'base64'));
  await b.close();
})();
