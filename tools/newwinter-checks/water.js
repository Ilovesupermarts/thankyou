// node water.js PREFIX '{"V":{...}}' — the lake region at 1x, two frames 1 s apart, + numbers
const { chromium } = require('playwright');
(async () => {
  const pre = process.argv[2], set = JSON.parse(process.argv[3] || '{}');
  set.V = Object.assign({ ytShow: false, hallShow: false, blockIn: false }, set.V || {});
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1480, height: 924 }, deviceScaleFactor: +(process.argv[4] || 1) });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/newwinter.html');
  await p.evaluate((set) => { localStorage.clear(); localStorage.setItem('shotSet', JSON.stringify(set)); }, set);
  await p.reload();
  await p.evaluate(() => { var s = JSON.parse(localStorage.getItem('shotSet')); for (var g in s) for (var k in s[g]) { if (k === 'colours') Object.assign(winterLab[g].colours, s[g][k]); else winterLab[g][k] = s[g][k]; } winterLab.changed('all'); });
  for (let i = 0; i < 300; i++) { await p.waitForTimeout(500); if (await p.evaluate(() => !winterLab.busy())) break; }
  await p.waitForTimeout(2000);
  await p.addStyleTag({ content: '#sp{display:none !important}.page, #navDemo, #dots, .msg, [class^=msg]{visibility:hidden !important}' });
  const clip = { x: 560, y: 640, width: 920, height: 284 };
  await p.screenshot({ path: pre + '-a.png', clip });
  await p.waitForTimeout(1000);
  await p.screenshot({ path: pre + '-b.png', clip });
  console.log(await p.evaluate(() => winterLab.info()), errs.join(' '));
  await b.close();
})();
