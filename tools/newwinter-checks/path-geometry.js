// node path-geometry.js — prints the hall's rise (drop, Z, riseM), the field path's hand-over (cutS) and the path's centre line every 10 m (x, z in metres).
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1480, height: 924 } });
  await p.goto('http://localhost:8765/newwinter.html');
  await p.evaluate(() => localStorage.clear()); await p.reload();
  await p.evaluate(() => { winterLab.V.ytShow = false; winterLab.changed('all'); });
  for (let i=0;i<300;i++){ await p.waitForTimeout(500); if (await p.evaluate(() => !!winterLab.trail().T)) break; }
  console.log(await p.evaluate(() => {
    const TR = winterLab.trail(), T = TR.T, h = TR.hall, out = ['hall drop ' + h.drop.toFixed(2) + ' m, Z ' + h.Z.toFixed(0) + ', riseM ' + h.riseM.toFixed(1) + ', cutS ' + TR.cutS.toFixed(1) + ', length ' + T.length.toFixed(1)];
    for (let s = 0; s <= T.length; s += 10) { const q = T.at(s); out.push('s ' + s + ': x ' + q[0].toFixed(1) + ' z ' + q[1].toFixed(1)); }
    return out.join('\n');
  }));
  await b.close();
})();
