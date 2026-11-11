// node shot.js OUT.png SCALE '{"V":{"blockLabels":false,"hour":16.9}}' [x,y,w,h] [hide]  — the test bed from a clean start with values set (any of V / MT / CLOUD / SUN), waits until baked, hides the panel (#sp), saves a picture (optionally a clip; 'hide' also hides the text), prints the info line, the report's last lines and any errors. Run ONE at a time (at 2x the software GPU takes 30-60 s; two at once time out).
// node shot.js out.png scale '{"V":{...}}' 'x,y,w,h' [hideText]
const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2], scale = +(process.argv[3] || 1), set = JSON.parse(process.argv[4] || '{}');
  const clip = process.argv[5] ? process.argv[5].split(',').map(Number) : null, hideText = process.argv[6] === 'hide';
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1480, height: 924 }, deviceScaleFactor: scale });
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push(m.type() + ' ' + m.text()); });
  await p.goto('http://localhost:8765/newwinter.html');
  await p.evaluate((set) => { localStorage.clear(); localStorage.setItem('shotSet', JSON.stringify(set)); }, set);
  await p.reload();
  await p.evaluate(() => { var s = JSON.parse(localStorage.getItem('shotSet') || '{}'); for (var g in s) for (var k in s[g]) winterLab[g][k] = s[g][k]; if (s.V && 'hour' in s.V) winterLab.setHour(); winterLab.changed('all'); });
  await p.waitForTimeout(1500);
  for (let i = 0; i < 80; i++) { await p.waitForTimeout(500); if (await p.evaluate(() => !winterLab.busy())) break; }
  await p.waitForTimeout(2500);
  await p.addStyleTag({ content: '#sp{display:none !important}' + (hideText ? '.page, #navDemo, #dots, .msg, [class^=msg]{visibility:hidden !important}' : '') });
  await p.waitForTimeout(300);
  await p.screenshot({ timeout: 120000, path: out, clip: clip ? { x: clip[0], y: clip[1], width: clip[2], height: clip[3] } : undefined });
  console.log(await p.evaluate(() => winterLab.info()));
  console.log(await p.evaluate(() => winterLab.report().split('\n').slice(-6).join('\n')));
  console.log(errs.join('\n'));
  await b.close();
})();
