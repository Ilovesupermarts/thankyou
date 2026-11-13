const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1480, height: 924 }, deviceScaleFactor: 1 });
  await p.goto('http://localhost:8765/newwinter.html');
  await p.evaluate(() => { localStorage.clear(); });
  await p.reload();
  await p.evaluate(() => { Object.assign(winterLab.V, { ytShow:false, hillShow:false, pagodaShow:false, hallShow:false, trailShow:false, plumShow:false, showMountains:false }); winterLab.changed('all'); });
  await p.waitForTimeout(5000);
  const urls = await p.evaluate(() => {
    var L = { sun: [-0.8,0.37,-0.46], sunCol:[1,1,1], skyCol:[0.7,0.77,0.89], amb: 0.9, haze: [250,230,200] }, out = [];
    function draw(opt, sc, w, h) {
      var cv = document.createElement('canvas'); cv.width = w; cv.height = h; var c = cv.getContext('2d', opt);
      c.fillStyle = '#8a8f99'; c.fillRect(0, 0, w, h); c.setTransform(sc, 0, 0, sc, 0, 0);
      for (var i = 0; i < 6; i++) { var j = WinterHill.fir(c, 22 + i * 40, 58, 50, 5000 + i, { light: L, haze: 0.2, snow: 0.7, width: 0.78, direct: true, painter: winterLab.ytFirPaint }); if (j && j.step) j.step(1e9); }
      return cv.toDataURL();
    }
    out.push(draw(undefined, 0.75, 195, 48));                       // the hill's own scale, graphics-chip canvas
    out.push(draw({ willReadFrequently: true }, 0.75, 195, 48));    // the same, main-processor canvas
    out.push(draw({ willReadFrequently: true }, 6, 1560, 384));     // 8× larger: the shapes' true look (shrunk afterwards)
    [2, 3].forEach(function (k) {                                    // main processor at k× the size, shrunk by k when laid down
      var big = document.createElement('canvas'); big.width = 195 * k; big.height = 48 * k; var bc = big.getContext('2d', { willReadFrequently: true });
      bc.fillStyle = '#8a8f99'; bc.fillRect(0, 0, big.width, big.height); bc.setTransform(0.75 * k, 0, 0, 0.75 * k, 0, 0);
      for (var i = 0; i < 6; i++) { var j = WinterHill.fir(bc, 22 + i * 40, 58, 50, 5000 + i, { light: L, haze: 0.2, snow: 0.7, width: 0.78, direct: true, painter: winterLab.ytFirPaint }); if (j && j.step) j.step(1e9); }
      var cv = document.createElement('canvas'); cv.width = 195; cv.height = 48; var c = cv.getContext('2d'); c.imageSmoothingQuality = 'high'; c.drawImage(big, 0, 0, 195, 48);
      out.push(cv.toDataURL());
    });
    return out;
  });
  const fs = require('fs');
  urls.forEach((u, i) => fs.writeFileSync(process.argv[2] + i + '.png', Buffer.from(u.split(',')[1], 'base64')));
  await b.close();
})();
