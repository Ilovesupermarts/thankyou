// node hall.js PREFIX SCALE '{"V":{...}}' — the test bed (pines off unless set), waits; saves PREFIX-full.png, PREFIX-hall.png (clip round the hall), PREFIX-layer.png (the hall's own picture over dark grey)
const { chromium } = require('playwright');
(async () => {
  const pre = process.argv[2], scale = +(process.argv[3] || 1), set = JSON.parse(process.argv[4] || '{}');
  set.V = Object.assign({ ytShow: false }, set.V || {});
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1480, height: 924 }, deviceScaleFactor: scale });
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push(m.type() + ' ' + m.text()); });
  await p.goto('http://localhost:8765/newwinter.html');
  await p.evaluate((set) => { localStorage.clear(); localStorage.setItem('shotSet', JSON.stringify(set)); }, set);
  await p.reload();
  await p.evaluate(() => { var s = JSON.parse(localStorage.getItem('shotSet') || '{}'); for (var g in s) for (var k in s[g]) { if (k === 'colours') Object.assign(winterLab[g].colours, s[g][k]); else winterLab[g][k] = s[g][k]; } if (s.V && 'hour' in s.V) winterLab.setHour(); winterLab.changed('all'); });
  await p.waitForTimeout(1500);
  for (let i = 0; i < 1200; i++) { await p.waitForTimeout(500); if (await p.evaluate(() => !winterLab.busy())) break; }
  await p.waitForTimeout(2500);
  await p.addStyleTag({ content: '#sp{display:none !important}.page, #navDemo, #dots, .msg, [class^=msg]{visibility:hidden !important}' });
  await p.waitForTimeout(300);
  await p.screenshot({ timeout: 180000, path: pre + '-full.png' });
  await p.screenshot({ timeout: 180000, path: pre + '-hall.png', clip: { x: 260, y: 470, width: 480, height: 200 } });
  const url = await p.evaluate(() => { var Hh = winterLab.hall(); if (!Hh.cnv) return null; var c = document.createElement('canvas'); c.width = Hh.cnv.width; c.height = Hh.cnv.height; var x = c.getContext('2d'); x.fillStyle = '#303038'; x.fillRect(0, 0, c.width, c.height); x.drawImage(Hh.cnv, 0, 0); return c.toDataURL(); });
  if (url) require('fs').writeFileSync(pre + '-layer.png', Buffer.from(url.split(',')[1], 'base64'));
  console.log(await p.evaluate(() => winterLab.report().split('\n').filter(l => /hall|ERROR/.test(l)).slice(-3).join('\n')));
  console.log(errs.join('\n'));
  await b.close();
})();
