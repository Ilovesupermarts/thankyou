// node path-band.js — run from this folder: saves band.json (winterLab.trailEdit.state(): the path's two edges on the screen, for measuring colour along the walls)
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const U = JSON.parse(fs.readFileSync('user-values.json', 'utf8')); U.ver = 6; U.V.ytShow = false;
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1480, height: 924 } });
  await p.goto('http://localhost:8765/newwinter.html');
  await p.evaluate((U) => { localStorage.clear(); localStorage.setItem('newWinter-1', JSON.stringify(U)); }, U);
  await p.reload(); await p.waitForTimeout(4000);
  fs.writeFileSync('band.json', JSON.stringify(await p.evaluate(() => winterLab.trailEdit.state())));
  await b.close();
})();
