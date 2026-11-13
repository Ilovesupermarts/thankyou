// load-profile-plain.js: a plain load (nothing changed), all at the defaults (pines on), CPU profile; prints the report and where the time goes
const { chromium } = require('playwright');
(async () => {
  const scale = +(process.argv[2] || 1);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 1480, height: 924 }, deviceScaleFactor: scale });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const cdp = await ctx.newCDPSession(p);
  await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 1000 }); await cdp.send('Profiler.start');
  const t0 = Date.now();
  await p.goto('http://localhost:8765/newwinter.html');
  await p.evaluate(() => winterLab.stepBudget(5000));
  for (let i = 0; i < 3000; i++) { await p.waitForTimeout(500); if (await p.evaluate(() => !winterLab.busy())) break; }
  const { profile } = await cdp.send('Profiler.stop');
  console.log('wall ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s');
  console.log(await p.evaluate(() => winterLab.report().split('\n').filter(l => / ms|ERROR/.test(l)).join('\n')));
  const byId = {}; profile.nodes.forEach(n => byId[n.id] = n);
  const t = {}; profile.samples.forEach((s, i) => { t[s] = (t[s] || 0) + (profile.timeDeltas[i] || 0); });
  const fn = {};
  for (const id in t) { const n = byId[id], f = n.callFrame.url.split('/').pop() || '(native)'; const k = n.callFrame.functionName + ' ' + f + ':' + n.callFrame.lineNumber; fn[k] = (fn[k] || 0) + t[id]; }
  Object.entries(fn).sort((a, b) => b[1] - a[1]).slice(0, 25).forEach(([k, v]) => console.log((v / 1e6).toFixed(2).padStart(7) + '  ' + k));
  console.log('errors:', errs.join('|') || 'none');
  await b.close();
})();
