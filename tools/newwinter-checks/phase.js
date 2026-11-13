const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1480, height: 924 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/newwinter.html');
  await p.evaluate(() => { localStorage.clear(); });
  await p.reload();
  await p.evaluate(() => { Object.assign(winterLab.V, { ytShow:false, showMountains:false, hillShow:false, pagodaShow:false, hallShow:false, trailShow:false }); });
  await p.waitForTimeout(2500);
  const sel = await p.locator('select', { has: p.locator('option[value="golden"]') });
  console.log('select found:', await sel.count());
  for (const ph of ['night','dawn','morning','day','golden','dusk']) {
    await sel.selectOption(ph);
    await p.waitForTimeout(300);
    console.log(ph, '->', JSON.stringify(await p.evaluate(() => ({ hour: winterLab.V.hour, phase: winterLab.phase(), tod: winterLab.V.timeOfDay, slider: [...document.querySelectorAll('.sp-ctl')].find(e => /Time \(hour/.test(e.textContent)).querySelector('span').textContent }))));
  }
  // moving the slider moves the drop-down
  await p.evaluate(() => { const i = [...document.querySelectorAll('.sp-ctl')].find(e => /Time \(hour/.test(e.textContent)).querySelector('input'); i.value = 19.5; i.dispatchEvent(new Event('input')); });
  console.log('slider 19.5 -> select shows', await sel.inputValue());
  console.log('errors:', errs.join('|') || 'none');
  await b.close();
})();
