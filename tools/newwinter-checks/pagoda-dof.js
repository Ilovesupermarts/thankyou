// node pagoda-dof.js PREFIX — the pagoda clipped at 2x with its depth of field off / at focus 600 m / 200 m / 60 m (strength 4, max 10 px).
// node pdof.js PREFIX — pagoda clip with depth of field off / on at the tablet's settings / on at focus 200
const { chromium } = require('playwright');
(async () => {
  const pre = process.argv[2];
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1480, height: 924 }, deviceScaleFactor: 2 });
  await p.goto('http://localhost:8765/newwinter.html');
  await p.evaluate(() => localStorage.clear()); await p.reload();
  async function shot(name, set) {
    await p.evaluate((set) => { Object.assign(winterLab.V, { ytShow: false, hallShow: false }, set); winterLab.changed('hill'); }, set);
    for (let i = 0; i < 600; i++) { await p.waitForTimeout(500); if (await p.evaluate(() => !winterLab.busy())) break; }
    await p.waitForTimeout(800);
    await p.screenshot({ path: pre + '-' + name + '.png', clip: { x: 220, y: 150, width: 150, height: 320 }, timeout: 120000 });
    console.log(name, await p.evaluate(() => winterLab.report().split('\n').filter(l => /pagoda/.test(l)).slice(-2).join(' | ')));
  }
  await p.addStyleTag({ content: '#sp{display:none !important}' });
  await shot('off', { pagodaDof: false });
  await shot('tablet', { pagodaDof: true, pagodaFocus: 600, pagodaDofStrength: 4, pagodaDofMax: 10 });
  await shot('f200', { pagodaDof: true, pagodaFocus: 200, pagodaDofStrength: 4, pagodaDofMax: 10 });
  await shot('f60', { pagodaDof: true, pagodaFocus: 60, pagodaDofStrength: 4, pagodaDofMax: 10 });
  await b.close();
})();
