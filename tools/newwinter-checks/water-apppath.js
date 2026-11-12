// node water-apppath.js — water.js alone: started as the app starts it (no options) and with the test bed's recover option; makes Chrome drop contexts and prints the state and which latch is set.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  async function run(opts, rounds) {
    const p = await b.newPage();
    await p.goto('http://localhost:8765/sw.js');
    await p.evaluate(() => localStorage.clear());
    await p.addScriptTag({ url: 'http://localhost:8765/fftwaves.js' }); await p.addScriptTag({ url: 'http://localhost:8765/water.js' });
    return await p.evaluate(async ({ opts, rounds }) => {
      const out = [], sleep = ms => new Promise(r => setTimeout(r, ms));
      opts ? Water.init('textures/waternormals.jpg', opts) : Water.init('textures/waternormals.jpg');
      const m = document.createElement('canvas'); m.width = m.height = 64; Water.setMirror(m);
      await sleep(1500); out.push('start ' + Water.state());
      const keep = [];
      for (let r = 0; r < rounds; r++) {
        for (let i = 0; i < 16; i++) keep.push(document.createElement('canvas').getContext('webgl2'));
        await sleep(2500);
        out.push('after round ' + (r + 1) + ': ' + Water.state() + ', renewals ' + (Water.renewals ? Water.renewals() : '-') +
                 ', waterLatch1 ' + (localStorage.getItem('waterLatch1') ? 'SET' : '-') + ', own ' + (localStorage.getItem('waterLatchNewWinter') ? 'SET' : '-'));
      }
      return out.join(' | ');
    }, { opts, rounds });
  }
  console.log('APP (no options):', await run(null, 1));
  console.log('TEST BED (recover):', await run({ recover: true, latchKey: 'waterLatchNewWinter' }, 3));
  await b.close();
})();
