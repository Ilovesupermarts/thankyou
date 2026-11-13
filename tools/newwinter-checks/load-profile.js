// node load-profile.js SCALE [ytShow 0/1] — a full load at the defaults, CPU profile, report lines, self time by file and function
const { chromium } = require('playwright');
(async () => {
  const scale = +(process.argv[2] || 1), yt = process.argv[3] !== '0';
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1480, height: 924 }, deviceScaleFactor: scale });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/newwinter.html');
  await p.evaluate(() => { localStorage.clear(); });
  await p.reload();
  const cdp = await p.context().newCDPSession(p);
  await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 1000 });
  await p.evaluate((yt) => { winterLab.V.ytShow = yt; winterLab.stepBudget(5000); }, yt);
  await cdp.send('Profiler.start');
  const t0 = Date.now();
  await p.evaluate(() => winterLab.changed('all'));
  await p.waitForTimeout(1500);
  for (let i = 0; i < 1200; i++) { await p.waitForTimeout(500); if (await p.evaluate(() => !winterLab.busy())) break; }
  const wall = (Date.now() - t0) / 1000;
  const { profile } = await cdp.send('Profiler.stop');
  console.log('wall ' + wall.toFixed(0) + ' s');
  console.log(await p.evaluate(() => winterLab.report().split('\n').filter(l => / ms|ERROR/.test(l)).slice(-30).join('\n')));
  const byId = {}; profile.nodes.forEach(n => byId[n.id] = n);
  const t = {}; profile.samples.forEach((s, i) => { t[s] = (t[s] || 0) + (profile.timeDeltas[i] || 0); });
  const fn = {}, file = {};
  for (const id in t) { const n = byId[id], f = n.callFrame.url.split('/').pop() || '(native)'; const k = n.callFrame.functionName + ' ' + f + ':' + n.callFrame.lineNumber; fn[k] = (fn[k] || 0) + t[id]; file[f] = (file[f] || 0) + t[id]; }
  console.log('--- by file (s)'); Object.entries(file).sort((a, b) => b[1] - a[1]).slice(0, 14).forEach(([k, v]) => console.log((v / 1e6).toFixed(1).padStart(7) + '  ' + k));
  console.log('--- by function (s)'); Object.entries(fn).sort((a, b) => b[1] - a[1]).slice(0, 40).forEach(([k, v]) => console.log((v / 1e6).toFixed(2).padStart(7) + '  ' + k));
  console.log('errors:', errs.join('|') || 'none');
  await b.close();
})();
