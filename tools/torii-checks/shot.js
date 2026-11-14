// node shot.js out.png scale '{"V":{}}' [clipJSON]
const { chromium } = require('playwright');
(async () => {
  const [out, sc, js, clip] = process.argv.slice(2);
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1480, height: 924 }, deviceScaleFactor: +sc || 1 });
  p.on('pageerror', e => { console.log('PAGEERR', e.message); process.exit(1); }); p.on('console', m => { if (m.type() === 'error') console.log('CONSOLE', m.text()); });
  await p.goto('http://localhost:8765/torii.html'); await p.evaluate(() => localStorage.clear());
  await p.reload();
  const set = JSON.parse(js || '{}');
  await p.waitForFunction(() => window.toriiLab, null, { timeout: 60000 });
  if (set.V) await p.evaluate(v => { Object.assign(toriiLab.V, v); toriiLab.rebuild('field'); }, set.V);
  const t0 = Date.now();
  await p.waitForFunction(() => !toriiLab.busy(), null, { timeout: 590000, polling: 500 });
  console.log('baked', (Date.now() - t0) / 1000, 's;', await p.evaluate(() => toriiLab.info()));
  await p.addStyleTag({ content: '#sp,#msg{display:none}' });
  await p.waitForTimeout(800);
  await p.screenshot({ path: out, timeout: 120000, clip: clip ? JSON.parse(clip) : undefined });
  await b.close();
})();
