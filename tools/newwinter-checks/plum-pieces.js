const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1480, height: 924 }, deviceScaleFactor: 1 });
  p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('http://localhost:8765/newwinter.html');
  await p.evaluate(() => { localStorage.clear(); });
  await p.reload();
  await p.evaluate(() => { var V = winterLab.V; Object.assign(V, {ytShow:false,showMountains:false,hillShow:false,pagodaShow:false,hallShow:false,trailShow:false}); winterLab.changed('all'); });
  for (let i = 0; i < 200; i++) { await p.waitForTimeout(500); if (await p.evaluate(() => !winterLab.busy())) break; }
  await p.waitForTimeout(1500);
  console.log(await p.evaluate(() => {
    var out = [];
    winterLab.plums().forEach(function (T, ti) {
      if (T.left || T.idx !== 0) return;
      T.nodes.forEach(function (n, k) { if (n.g !== 0) return; var s = T.snow[k];
        out.push(ti + ' ' + k + ' sx ' + n.sx.toFixed(0) + ',' + n.sy.toFixed(0) + ' ex ' + n.ex.toFixed(0) + ',' + n.ey.toFixed(0) + ' w ' + n.w.toFixed(1) + ' snow ' + n.snow.toFixed(2) + ' pic ' + (s ? s.w.toFixed(0) + 'x' + s.h.toFixed(0) + ' x0 ' + s.x0.toFixed(1) : '-')); });
    });
    return out.join('\n');
  }));
  await b.close();
})();
