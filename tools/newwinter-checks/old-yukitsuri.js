// node old-yukitsuri.js  — loads the page with Yukitsuri.pack removed (as when the browser serves an old yukitsuri.js): the pines must still draw, with the Report saying "not kept", and the pines label must not contain loadBudget. About 3 min.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1480, height: 924 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/newwinter.html');
  await p.evaluate(() => { delete Yukitsuri.pack; winterLab.V.firCpu = true; winterLab.stepBudget(4000); });
  const d = await p.evaluate(() => winterLab.keptLabel('pines').deps);
  console.log('pines deps:', d.keys ? d.keys.length + ' keys, loadBudget in it: ' + d.keys.includes('loadBudget') : 'ALL');
  await p.waitForFunction(() => !winterLab.busy(), null, { timeout: 1500000, polling: 2000 });
  console.log(String(await p.evaluate(() => winterLab.report())).split('\n').filter(l => /roped|ERROR|pines/.test(l)).join('\n'));
  console.log('drawn trees:', await p.evaluate(() => winterLab.layers().pines.length), 'errors', errs); await b.close();
})();
