// node water-evict.js PREFIX — the test bed, then 16 more WebGL contexts (as other tabs would): prints the water's state before / after / after a reload, saves the lake twice.
// node evict.js PREFIX — default scene without pines (fast); then other WebGL contexts made as other tabs/pages would; water state + lake twice
const { chromium } = require('playwright');
(async () => {
  const pre = process.argv[2];
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1480, height: 924 } });
  const log = []; p.on('console', m => log.push(m.type() + ': ' + m.text()));
  await p.goto('http://localhost:8765/newwinter.html');
  await p.evaluate(() => { localStorage.clear(); });
  await p.reload();
  await p.evaluate(() => { winterLab.V.ytShow = false; winterLab.V.hallShow = false; winterLab.changed('all'); });
  for (let i = 0; i < 600; i++) { await p.waitForTimeout(500); if (await p.evaluate(() => !winterLab.busy())) break; }
  await p.waitForTimeout(1500);
  const clip = { x: 560, y: 640, width: 920, height: 284 };
  console.log('before:', await p.evaluate(() => Water.state() + ' / ' + winterLab.info().match(/lake: [^·]*/)));
  await p.screenshot({ path: pre + '-before.png', clip, timeout: 120000 });
  // another page of the project opening its own graphics (the browser keeps 16 at most; the oldest is taken away)
  await p.evaluate(() => { window._x = []; for (let i = 0; i < 16; i++) { const c = document.createElement('canvas'); window._x.push(c.getContext('webgl2')); } });
  await p.waitForTimeout(1500);
  await p.waitForTimeout(3000);
  console.log('after 16 more contexts:', await p.evaluate(() => Water.state() + ' / renewals ' + (Water.renewals ? Water.renewals() : '-') + ' / app latch ' + (localStorage.getItem('waterLatch1') ? 'SET' : 'not set') + ' / own latch ' + (localStorage.getItem('waterLatchNewWinter') ? 'SET' : 'not set') + ' / ' + winterLab.info().match(/lake: [^·]*/)));
  await p.screenshot({ path: pre + '-after.png', clip, timeout: 120000 });
  await p.waitForTimeout(1000);
  await p.screenshot({ path: pre + '-after2.png', clip, timeout: 120000 });
  // the page opened again (the latch is remembered for 12 hours)
  await p.reload();
  await p.evaluate(() => { winterLab.V.ytShow = false; winterLab.V.hallShow = false; winterLab.changed('all'); });
  for (let i = 0; i < 600; i++) { await p.waitForTimeout(500); if (await p.evaluate(() => !winterLab.busy())) break; }
  await p.waitForTimeout(1500);
  console.log('page reopened:', await p.evaluate(() => Water.state() + ' / ' + winterLab.info().match(/lake: [^·]*/)));
  console.log(log.filter(l => /WebGL|context|water/i.test(l)).slice(0, 8).join('\n'));
  await b.close();
})();
