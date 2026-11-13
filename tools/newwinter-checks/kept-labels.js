// node kept-labels.js  — prints, for each kept picture (hill, field, hall), the functions its code reaches (scDeps) and the values it reads, and the drawing files loaded with their sizes. A few seconds.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1480, height: 924 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/newwinter.html');
  await p.waitForTimeout(3000);
  const r = await p.evaluate(() => ['hill', 'field', 'hall'].map(st => { const L = winterLab.keptLabel(st); return st + ': funcs ' + L.deps.n + ', keys ' + (L.deps.keys ? L.deps.keys.length + ' ' + L.deps.keys.join(' ') : 'ALL') + ' | MT ' + L.deps.mt.join(' ') + ' | SUN ' + L.deps.sun.join(' ') + ' | label ' + L.want.length + ' chars'; }));
  console.log(r.join('\n\n')); console.log('errors', errs);
  const files = await p.evaluate(() => JSON.parse(winterLab.keptLabel('hill').want).files); console.log(files);
  await b.close();
})();
