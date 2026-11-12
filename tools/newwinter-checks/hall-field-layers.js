// node hall-field-layers.js PREFIX — run from this folder: the hall's own picture and the snow field's picture, a clip of each over dark grey (to see which painter draws what)
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const pre = process.argv[2];
  const U = JSON.parse(fs.readFileSync('user-values.json', 'utf8')); U.ver = 6; U.V.ytShow = false;
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1480, height: 924 }, deviceScaleFactor: 1 });
  await p.goto('http://localhost:8765/newwinter.html');
  await p.evaluate((U) => { localStorage.clear(); localStorage.setItem('newWinter-1', JSON.stringify(U)); }, U);
  await p.reload();
  for (let i = 0; i < 1500; i++) { await p.waitForTimeout(500); if (await p.evaluate(() => !winterLab.busy())) break; }
  const out = await p.evaluate(() => {
    function dump(cnv, x, y) { var c = document.createElement('canvas'); c.width = 200; c.height = 70; var g = c.getContext('2d'); g.fillStyle = '#303038'; g.fillRect(0, 0, 200, 70); g.drawImage(cnv, -x, -y); return c.toDataURL(); }
    var Hh = winterLab.hall(), L = winterLab.layers();
    return { hall: dump(Hh.cnv, 280 - Hh.x, 590 - Hh.y), field: dump(L.field, 280, 590) };
  });
  for (const k in out) fs.writeFileSync(pre + '-' + k + '.png', Buffer.from(out[k].split(',')[1], 'base64'));
  await b.close();
})();
