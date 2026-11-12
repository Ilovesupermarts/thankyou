// node user-scene.js PREFIX SCALE '{"V":{...overrides}}' — run from this folder (it reads user-values.json: the user's own panel values, the defaults since PR #353); the test bed with them, waits for every bake, hides the panel and text, saves PREFIX-full.png. QUICK CHECK: add "ytShow":false,"showMountains":false,"hillShow":false,"pagodaShow":false at SCALE 1 (about 2.5 min; the snow field with the path ≈ 70 s and the hall's snow ≈ 80 s are the slow parts, they cannot be skipped yet)
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const pre = process.argv[2], scale = +(process.argv[3] || 2), ov = JSON.parse(process.argv[4] || '{}');
  const U = JSON.parse(fs.readFileSync('user-values.json', 'utf8')); U.ver = 6;
  for (const g in ov) Object.assign(U[g], ov[g]);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1480, height: 924 }, deviceScaleFactor: scale });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/newwinter.html');
  await p.evaluate((U) => { localStorage.clear(); localStorage.setItem('newWinter-1', JSON.stringify(U)); }, U);
  await p.reload();
  for (let i = 0; i < 1500; i++) { await p.waitForTimeout(500); if (await p.evaluate(() => !winterLab.busy())) break; }
  await p.waitForTimeout(2000);
  await p.addStyleTag({ content: '#sp{display:none !important}.page, #navDemo, #dots, .msg, [class^=msg]{visibility:hidden !important}' });
  await p.waitForTimeout(500);
  await p.screenshot({ timeout: 500000, path: pre + '-full.png' });
  console.log(await p.evaluate(() => winterLab.report().split('\n').filter(l => /hall|snow ground|ERROR/.test(l)).slice(-4).join('\n')));
  console.log(errs.join('\n') || 'no errors');
  await b.close();
})();
