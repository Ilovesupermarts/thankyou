// node onefir.js OUT.png   : six firs drawn large (360 px, seeds 11000+7i) on a plain ground, with headroom above them.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1200, height: 480 }, deviceScaleFactor: 1 });
  p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('http://localhost:8765/hill-options.html?bare#B');
  await p.evaluate(() => {
    document.body.innerHTML = ''; const cv = document.createElement('canvas'); cv.width = 1200; cv.height = 480; document.body.appendChild(cv);
    const c = cv.getContext('2d'); c.fillStyle = '#ececf4'; c.fillRect(0, 0, 1200, 480);
    const L = { sun: [-0.78, 0.38, 0.5], sunCol: [1.12, 0.98, 0.84], skyCol: [0.6, 0.62, 0.74], amb: 0.95, haze: [246, 232, 220], lit: 0 };
    for (let i = 0; i < 6; i++) WinterHill.fir(c, 100 + i * 200, 460, 360, 11000 + i * 7, { light: L, haze: 0.1, snow: 0.7, width: 0.78 });
  });
  await p.screenshot({ path: process.argv[2] }); await b.close();
})();
