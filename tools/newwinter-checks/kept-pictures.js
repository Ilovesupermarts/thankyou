// node kept-pictures.js OUTDIR  — a full bake (pines on, firCpu on for speed), then a reload; saves every layer (hill, field, hall, each tree and loose clump) of both loads as PNGs in OUTDIR and prints the Report lines: compare first-*.png with second-*.png with PIL (they must be identical). About 5 min; run_in_background, timeout 3400.
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 1480, height: 924 } });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/newwinter.html');
  await p.evaluate(() => { winterLab.V.firCpu = true; winterLab.changed('live'); });
  async function load(tag) {
    const t0 = Date.now();
    await p.goto('http://localhost:8765/newwinter.html');
    await p.evaluate(() => winterLab.stepBudget(4000));
    await p.waitForFunction(() => !winterLab.busy(), null, { timeout: 1700000, polling: 2000 });
    const secs = (Date.now() - t0) / 1000;
    await p.waitForTimeout(8000);
    const L = await p.evaluate(() => {
      const l = winterLab.layers(), o = {};
      function url(x) { if (!x) return null; const c = document.createElement('canvas'); c.width = x.width; c.height = x.height; c.getContext('2d').drawImage(x, 0, 0); return c.toDataURL('image/png'); }
      ['hill', 'field', 'hall'].forEach(k => o[k] = url(l[k]));
      l.pines.forEach((x, i) => o['pine' + i] = url(x));
      l.pineLoose.forEach((a, i) => a.forEach((x, j) => o['loose' + i + '_' + j] = url(x)));
      return o; });
    for (const k in L) if (L[k]) fs.writeFileSync(`${out}/${tag}-${k}.png`, Buffer.from(L[k].split(',')[1], 'base64'));
    const rep = await p.evaluate(() => winterLab.report());
    console.log(`--- ${tag}: ready after ${secs.toFixed(1)} s`); console.log(String(rep).split('\n').filter(l => /hill and|snow ground:|hall and|kept|ERROR|roped|pines/.test(l)).join('\n'));
  }
  await load('first'); await load('second');
  console.log('errors', errs); await b.close();
})();
