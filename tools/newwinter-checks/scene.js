// node scene.js PREFIX SCALE '{"V":{...}}' 'x,y,w,h' — the test bed with the user's values (+ overrides), every bake, full picture + clip
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const pre = process.argv[2], scale = +(process.argv[3] || 1), ov = JSON.parse(process.argv[4] || '{}'), clip = process.argv[5] ? process.argv[5].split(',').map(Number) : null;
  const U = JSON.parse(fs.readFileSync('/home/user/thankyou/tools/newwinter-checks/user-values.json', 'utf8')); U.ver = 6;
  for (const g in ov) Object.assign(U[g], ov[g]);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1480, height: 924 }, deviceScaleFactor: scale });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/newwinter.html');
  await p.evaluate((U) => { localStorage.clear(); localStorage.setItem('newWinter-1', JSON.stringify(U)); indexedDB.deleteDatabase('newWinter-pictures'); }, U);
  await p.reload();
  await p.evaluate(() => winterLab.stepBudget(4000));
  const t0 = Date.now();
  for (let i = 0; i < 1500; i++) { await p.waitForTimeout(500); if (await p.evaluate(() => !winterLab.busy())) break; }
  console.log('baked in', Math.round((Date.now() - t0) / 1000), 's');
  await p.waitForTimeout(1500);
  await p.addStyleTag({ content: '#sp{display:none !important}.page, #navDemo, #dots, .msg, [class^=msg]{visibility:hidden !important}' });
  await p.waitForTimeout(500);
  await p.screenshot({ timeout: 500000, path: pre + '-full.png' });
  if (clip) await p.screenshot({ timeout: 500000, path: pre + '-clip.png', clip: { x: clip[0], y: clip[1], width: clip[2], height: clip[3] } });
  console.log(await p.evaluate(() => winterLab.report().split('\n').filter(l => /frost|hall|snow ground|ERROR/.test(l)).slice(-6).join('\n')));
  console.log(errs.join('\n') || 'no errors');
  await b.close();
})();
