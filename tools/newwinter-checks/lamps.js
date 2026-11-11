const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 800, height: 500 } });
  await p.goto('http://localhost:8765/newwinter.html');
  await p.waitForTimeout(1500);
  const r = await p.evaluate(() => {
    var out = [], ss = winterLab.lamps().set;
    out.push('sunset ' + Math.floor(ss) + ':' + ('0' + Math.round((ss % 1) * 60)).slice(-2));
    [-60, -45, -38, -30, -18, -10, 0, 6, 15, 60, 150].forEach(function (m) {
      winterLab.V.hour = ss + m / 60; winterLab.setHour();
      var L = winterLab.lamps();
      out.push((m >= 0 ? '+' : '') + m + ' min: dark ' + L.dark.toFixed(3) + ' · lamps ' + L.level.toFixed(2) + ' · scene ' + L.tod);
    });
    return out.join('\n');
  });
  console.log(r); await b.close();
})();
