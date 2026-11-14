const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1480, height: 924 }, deviceScaleFactor: 2 });
  p.on('pageerror', e => console.log('PAGEERR', e.message));
  await p.goto('http://localhost:8765/torii.html', { timeout: 0 });
  await p.waitForFunction(() => window.toriiLab, null, { timeout: 0 }); await p.evaluate(v => { var cl = v.colours; delete v.colours; Object.assign(toriiLab.V, v); if (cl) Object.assign(toriiLab.V.colours, cl); LCACHE = {}; toriiLab.changed(); }, JSON.parse(require('fs').readFileSync('day.json','utf8')).V);
  console.log(await p.evaluate(() => lantInfo));
  await b.close();
})();
