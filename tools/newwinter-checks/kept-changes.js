// node kept-changes.js  — loads, then changes one plum value, then one hill value, and prints which pictures came from storage each time (the labels: only the pictures that use a value may bake again). About 4 min; run_in_background.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 1480, height: 924 } });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/newwinter.html');
  async function load(tag, set) {
    if (set) await p.evaluate(s => { const o = JSON.parse(localStorage.getItem('newWinter-1') || '{}'); o.V = Object.assign(o.V || {}, s); localStorage.setItem('newWinter-1', JSON.stringify(o)); }, set);
    await p.goto('http://localhost:8765/newwinter.html');
    await p.evaluate(() => winterLab.stepBudget(4000));
    await p.waitForFunction(() => !winterLab.busy(), null, { timeout: 1500000, polling: 1000 });
    await p.waitForTimeout(6000);
    const rep = await p.evaluate(() => winterLab.report());
    console.log('--- ' + tag); console.log(String(rep).split('\n').filter(l => /hill and|snow ground:|hall and|kept/.test(l)).join('\n'));
  }
  await p.evaluate(() => { winterLab.V.ytShow = false; winterLab.V.firCpu = true; winterLab.changed('live'); });
  await load('first');
  await load('plum lumps changed', { plumSnowLumps: 0.5 });
  await load('hill snow changed', { hillFirSnow: 0.5 });
  console.log('errors', errs); await b.close();
})();
