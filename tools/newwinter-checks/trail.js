// node trail.js PREFIX SCALE '{"V":{...}}' — the test bed (pines off unless set; BASE=http://host:port to use another server), waits for every bake, saves PREFIX-full.png, prints the Report lines about the field, hall and path. For the path: add "gatesX":3,"lanternsX":3,"frostX":3,"blockLabels":false to move the flat block-in torii, lanterns and frosted trees off screen (check pictures only).
// node trail.js PREFIX SCALE '{"V":{...}}' — the path region, pines off (fast); full picture + clip, report lines
const { chromium } = require('playwright');
(async () => {
  const pre = process.argv[2], scale = +(process.argv[3] || 1), set = JSON.parse(process.argv[4] || '{}');
  set.V = Object.assign({ ytShow: false }, set.V || {});
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1480, height: 924 }, deviceScaleFactor: scale });
  const errs = []; p.on('pageerror', e => errs.push('pageerror ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto((process.env.BASE || 'http://localhost:8765') + '/newwinter.html');
  await p.evaluate((set) => { localStorage.clear(); localStorage.setItem('shotSet', JSON.stringify(set)); }, set);
  await p.reload();
  await p.evaluate(() => { var s = JSON.parse(localStorage.getItem('shotSet')); for (var g in s) for (var k in s[g]) { if (k === 'colours') Object.assign(winterLab[g].colours, s[g][k]); else winterLab[g][k] = s[g][k]; } if (s.V && 'hour' in s.V) winterLab.setHour(); winterLab.changed('all'); });
  await p.waitForTimeout(1500);
  for (let i = 0; i < 1200; i++) { await p.waitForTimeout(500); if (await p.evaluate(() => !winterLab.busy())) break; }
  await p.waitForTimeout(1500);
  await p.addStyleTag({ content: '#sp{display:none !important}.page, #navDemo, #dots, .msg, [class^=msg]{visibility:hidden !important}' });
  await p.waitForTimeout(300);
  await p.screenshot({ path: pre + '-full.png', timeout: 180000 });
  console.log(await p.evaluate(() => winterLab.report().split('\n').filter(l => /field|hall|path|ERROR/.test(l)).join('\n')));
  console.log(errs.join('\n'));
  await b.close();
})();
