// node band.js PREFIX ['{"V":{...}}'] — the test bed with the user's values, pines off: saves the snow ground layer (PREFIX-field.png) and 1x screenshots with the valley mist on (PREFIX-on.png) and off (PREFIX-off.png); prints a few values. About 4-10 min in this sandbox (run_in_background).
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const pre = process.argv[2], ov = JSON.parse(process.argv[3] || '{}');
  const U = JSON.parse(fs.readFileSync('/home/user/thankyou/tools/newwinter-checks/user-values.json', 'utf8')); U.ver = 7;
  U.V.ytShow = false; for (const g in ov) Object.assign(U[g], ov[g]);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1480, height: 924 }, deviceScaleFactor: 1 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/newwinter.html');
  await p.evaluate((U) => { localStorage.clear(); localStorage.setItem('newWinter-1', JSON.stringify(U)); indexedDB.deleteDatabase('newWinter-pictures'); }, U);
  await p.reload();
  await p.evaluate(() => winterLab.stepBudget(4000));
  for (let i = 0; i < 1500; i++) { await p.waitForTimeout(500); if (await p.evaluate(() => !winterLab.busy())) break; }
  await p.waitForTimeout(1500);
  await p.addStyleTag({ content: '#sp{display:none !important}.page, #navDemo, #dots, .msg, [class^=msg]{visibility:hidden !important}' });
  const f = await p.evaluate(() => { const L = winterLab.layers(); return L.field.toDataURL(); });
  fs.writeFileSync(pre + '-field.png', Buffer.from(f.split(',')[1], 'base64'));
  await p.screenshot({ timeout: 500000, path: pre + '-on.png' });
  await p.evaluate(() => { winterLab.V.vmShow = false; winterLab.changed('live'); });
  await p.waitForTimeout(1500);
  await p.screenshot({ timeout: 500000, path: pre + '-off.png' });
  console.log(await p.evaluate(() => JSON.stringify({ hy: winterLab.V.horizonLine, mist: winterLab.V.colours.mist, fh: winterLab.V.fieldHaze, fhd: winterLab.V.fieldHazeDist, fg: winterLab.V.fieldGlow })));
  console.log(errs.join('\n') || 'no errors');
  await b.close();
})();
