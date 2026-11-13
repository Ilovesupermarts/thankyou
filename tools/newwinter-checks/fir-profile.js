const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1480, height: 924 }, deviceScaleFactor: 1 });
  await p.goto('http://localhost:8765/newwinter.html');
  await p.evaluate(() => { localStorage.clear(); });
  await p.reload();
  await p.evaluate(() => { Object.assign(winterLab.V, { ytShow:false, hillShow:false, pagodaShow:false, hallShow:false, trailShow:false, plumShow:false, showMountains:false }); winterLab.changed('all'); });
  await p.waitForTimeout(4000);
  const cdp = await p.context().newCDPSession(p);
  await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 200 }); await cdp.send('Profiler.start');
  await p.evaluate(() => {
    var cv = document.createElement('canvas'); cv.width = 400; cv.height = 400; var c = cv.getContext('2d'); c.setTransform(0.75,0,0,0.75,0,0);
    var L = { sun: [-0.8,0.37,-0.46], sunCol:[1,1,1], skyCol:[0.7,0.77,0.89], amb: 0.9, haze: [250,230,200] };
    for (var i = 0; i < 40; i++) winterLab.ytFirPaint(c, 200, 380, 30, 2000 + i, { light: L, haze: 0.3, snow: 0.7, width: 0.78, direct: true });
  });
  const { profile } = await cdp.send('Profiler.stop');
  const self = {}, byId = {};
  profile.nodes.forEach(n => byId[n.id] = n);
  const dt = profile.timeDeltas; const counts = {};
  profile.samples.forEach((s, i) => { counts[s] = (counts[s] || 0) + (dt[i] || 0); });
  for (const id in counts) { const n = byId[id]; const k = n.callFrame.functionName + ' ' + (n.callFrame.url.split('/').pop()) + ':' + n.callFrame.lineNumber; self[k] = (self[k] || 0) + counts[id]; }
  Object.entries(self).sort((a, b) => b[1] - a[1]).slice(0, 18).forEach(([k, v]) => console.log((v / 1000).toFixed(0).padStart(6) + ' ms  ' + k));
  await b.close();
})();
