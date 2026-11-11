// node tb.js OUT.png [SETUP_JS] [DPR]   : open newwinter.html from a clean start, wait until baked, run SETUP_JS in the page (e.g. "winterLab.V.blockIn=false; winterLab.changed('block');"), hide the panel, screenshot, print the last report lines.
const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2], setup = process.argv[3] || '', dpr = +(process.argv[4] || 1);
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1480, height: 924 }, deviceScaleFactor: dpr });
  p.on('pageerror', e => console.log('ERR', e.message)); p.on('console', m => { if (m.type() === 'error') console.log('console', m.text()); });
  await p.goto('http://localhost:8765/newwinter.html');
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await p.waitForFunction(() => window.winterLab && !window.winterLab.busy(), null, { timeout: 120000 });
  if (setup) { await p.evaluate(setup); await p.waitForTimeout(600); await p.waitForFunction(() => !window.winterLab.busy(), null, { timeout: 120000 }); }
  await p.waitForTimeout(800);
  await p.evaluate(() => { const sp = document.getElementById('sp'); if (sp) sp.style.display = 'none'; });
  await p.screenshot({ path: out });
  const rep = await p.evaluate(() => window.winterLab.report());
  console.log(rep.split('\n').slice(-8).join('\n'));
  await b.close();
})();
