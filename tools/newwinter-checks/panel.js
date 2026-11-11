// node panel.js OUTDIR   : the test bed's step-3 panel groups, their slider counts, and hill alone / pagoda alone / neither.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1480, height: 924 } });
  p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('http://localhost:8765/newwinter.html'); await p.evaluate(() => localStorage.clear()); await p.reload();
  await p.waitForFunction(() => window.winterLab && !window.winterLab.busy(), null, { timeout: 120000 });
  console.log(await p.evaluate(() => [...document.querySelectorAll('#sp h4')].map(h => h.textContent).filter(t => /step 3/.test(t)).join(' | ')));
  console.log('sliders', await p.evaluate(() => [...document.querySelectorAll('#sp h4')].filter(h => /step 3/.test(h.textContent)).map(h => h.parentNode.querySelectorAll('input').length).join(',')));
  for (const setup of ["winterLab.V.hillShow=false; winterLab.changed('hill')", "winterLab.V.hillShow=true; winterLab.V.pagodaShow=false; winterLab.changed('hill')", "winterLab.V.hillShow=false; winterLab.V.pagodaShow=false; winterLab.changed('hill')"]) {
    await p.evaluate(setup); await p.waitForTimeout(500); await p.waitForFunction(() => !window.winterLab.busy(), null, { timeout: 60000 });
    await p.screenshot({ path: process.argv[2] + '/t_' + setup.length + '.png', clip: { x: 0, y: 150, width: 700, height: 480 } });
  }
  console.log((await p.evaluate(() => window.winterLab.report())).split('\n').slice(-4).join('\n'));
  await b.close();
})();
