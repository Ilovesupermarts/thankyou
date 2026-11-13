// THE FAST-CHECK HARNESS (what makes a check take 30-60 s instead of 10 minutes): ONE Chromium stays open on the test bed with a PERSISTENT profile (D/profile, so the kept pictures in IndexedDB survive: a reload lays them back instead of baking), and obeys commands written as JSON to D/cmd.json. Start it in the background (run_in_background) with the repo served on :8765:
//   node live.js [SCALE=1] [DIR]        (DIR defaults to $LIVE_DIR or /tmp/newwinter-live; use the scratchpad)
// It writes D/progress while it bakes the first time (about 10 min at 1x; later starts about a minute) and D/ready when done. Then send a command and wait for D/done-<out>:
//   echo '{"js":"/repo/wintermist.js","V":{"vmScale":1},"eval":"1+1","out":"a","n":2,"gap":4000,"clip":{"x":0,"y":330,"width":1480,"height":380}}' > D/cmd.json
//   keys: js = a file re-evaluated in the running page (a changed drawing file swapped in WITHOUT a reload; only for files drawn live, like wintermist.js), V = values set on winterLab.V, eval = JS run in the page (result printed to the log), reload = reload the page (the kept pictures are laid back, about a minute), out = file prefix, n = how many pictures (D/out-0.png ...), gap = ms between them, clip = a screenshot clip. quit:true ends it.
// The scene is the user's values with the flat torii / lanterns moved off screen and the pines off (ytShow false) for speed.
const { chromium } = require('playwright'); const fs = require('fs');
const path = require('path');
const D = (process.argv[3] || process.env.LIVE_DIR || '/tmp/newwinter-live') + '/'; fs.mkdirSync(D, { recursive: true });
(async () => {
  const U = JSON.parse(fs.readFileSync(path.join(__dirname, 'user-values.json'), 'utf8')); U.ver = 7;
  Object.assign(U.V, { ytShow: false, gatesX: 3, lanternsX: 3, blockLabels: false });
  const b = await chromium.launchPersistentContext(D + 'profile', { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'], viewport: { width: 1480, height: 924 }, deviceScaleFactor: +(process.argv[2] || 1) });
  const p = b.pages()[0] || await b.newPage();
  const T0 = Date.now();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/newwinter.html');
  await p.evaluate((U) => { localStorage.clear(); localStorage.setItem('newWinter-1', JSON.stringify(U)); }, U);
  await p.reload();
  await p.evaluate(() => winterLab.stepBudget && winterLab.stepBudget(4000));
  for (let i = 0; i < 4000; i++) { await p.waitForTimeout(1000); if (await p.evaluate(() => !winterLab.busy())) break;
    if (i % 15 === 0) fs.writeFileSync(D + 'progress', Math.round((Date.now() - T0) / 1000) + 's ' + await p.evaluate(() => (winterLab.report().split('\n').slice(-1)[0] || ''))); }
  fs.writeFileSync(D + 'progress', 'ready after ' + Math.round((Date.now() - T0) / 1000) + 's');
  await p.addStyleTag({ content: '#sp{display:none !important}.page, #navDemo, #dots, .msg, [class^=msg], #greet, .greet{visibility:hidden !important}' });
  fs.writeFileSync(D + 'ready', 'ok');
  for (;;) {
    await p.waitForTimeout(700);
    if (!fs.existsSync(D + 'cmd.json')) continue;
    const c = JSON.parse(fs.readFileSync(D + 'cmd.json', 'utf8')); fs.unlinkSync(D + 'cmd.json');
    if (c.quit) break;
    if (c.reload) { await p.reload(); await p.evaluate(() => winterLab.stepBudget && winterLab.stepBudget(4000)); for (let i = 0; i < 4000; i++) { await p.waitForTimeout(500); if (await p.evaluate(() => !winterLab.busy())) break; } await p.addStyleTag({ content: '#sp{display:none !important}.page, #navDemo, #dots, .msg, [class^=msg]{visibility:hidden !important}' }); }
    try {
      if (c.js) { const src = fs.readFileSync(c.js, 'utf8'); await p.addScriptTag({ content: src }); await p.evaluate(() => WinterMist.init()); }
      if (c.V) await p.evaluate((v) => Object.assign(winterLab.V, v), c.V);
      if (c.eval) console.log(await p.evaluate(c.eval));
      await p.waitForTimeout(800);
      for (let k = 0; k < (c.n || 1); k++) {
        if (k) await p.waitForTimeout(c.gap || 4000);
        await p.screenshot({ timeout: 300000, path: D + c.out + '-' + k + '.png', clip: c.clip });
      }
    } catch (e) { console.log('ERR ' + e.message); }
    console.log('done ' + c.out + ' ' + (errs.splice(0).join(' | ') || 'no errors'));
    fs.writeFileSync(D + 'done-' + c.out, 'ok');
  }
  await b.close();
})();
