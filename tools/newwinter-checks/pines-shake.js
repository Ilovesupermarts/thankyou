// node pines-shake.js  — waits until every tree is baked (about 4-8 minutes in headless Chromium), shakes every clump, steps the falling snow 70 frames, prints per-tree states (rest / wait / slip / gone, falling bits, puffs) and saves fall.png (a clip of the right bank) in the current folder. Serve the repo on 8765 first. Hides the panel and the text.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1480, height: 924 }, deviceScaleFactor: 1 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/newwinter.html');
  await p.evaluate(() => localStorage.clear()); await p.reload();
  for (let i = 0; i < 1500; i++) { await p.waitForTimeout(500); if (await p.evaluate(() => !winterLab.busy() && winterLab.pines().list.length)) break; }
  await p.addStyleTag({ content: '#sp{display:none !important}.page, #navDemo, #dots{visibility:hidden !important}' });
  await p.evaluate(() => { winterLab.ytShakeAll(); winterLab.pines().list.forEach(E => { for (var i = 0; i < 70; i++) Yukitsuri.update(E.A, 1/60, 1.5, 0); }); });
  for (let k = 0; k < 2; k++) {
    await p.waitForTimeout(50);
    console.log(await p.evaluate(() => winterLab.pines().list.map(E => { var s = {}; E.A.rest.forEach(r => s[r.state] = (s[r.state]||0)+1); return JSON.stringify(s) + ' bits ' + E.A.bits.length + ' puffs ' + E.A.puffs.length; }).join(' | ')));
    if (k === 0) await p.screenshot({ path: 'fall.png', clip: { x: 1060, y: 360, width: 420, height: 440 } });
  }
  console.log('errors:', errs.join('\n')); await b.close();
})();
