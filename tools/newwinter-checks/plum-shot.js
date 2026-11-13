// node plum-shot.js OUTPREFIX SCALE '{"V":{...}}' 'x,y,w,h;x,y,w,h' [hide] — the test bed with values set, one picture per clip (OUTPREFIX0.png, OUTPREFIX1.png …). Env: PORT (default 8765; a second server on another port serves a git worktree of an older commit for before/after), BUDGET (ms of the hill's and hall's drawing work a frame, default 8; 3000–5000 makes the headless browser finish them), FREEZE=1 (no sway, flakes, petals or shedding, so two pictures can be compared pixel for pixel). "hide" hides the greeting text.
// node plum.js OUTPREFIX SCALE '{"V":{...}}' 'x,y,w,h;x,y,w,h' [hide]
const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2], scale = +(process.argv[3] || 1), set = JSON.parse(process.argv[4] || '{}');
  const clips = process.argv[5] ? process.argv[5].split(';').map(s => s.split(',').map(Number)) : [null];
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1480, height: 924 }, deviceScaleFactor: scale });
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('http://localhost:' + (process.env.PORT || 8765) + '/newwinter.html');
  await p.evaluate((set) => { localStorage.clear(); localStorage.setItem('shotSet', JSON.stringify(set)); }, set);
  await p.reload();
  await p.evaluate((B) => { var s = JSON.parse(localStorage.getItem('shotSet') || '{}'); for (var g in s) for (var k in s[g]) winterLab[g][k] = s[g][k]; if (s.V && 'hour' in s.V) winterLab.setHour(); winterLab.stepBudget(B); winterLab.changed('all'); }, +(process.env.BUDGET || 8));
  await p.waitForTimeout(1500);
  for (let i = 0; i < 900; i++) { await p.waitForTimeout(500); if (await p.evaluate(() => !winterLab.busy())) break; }
  await p.waitForTimeout(2000);
  await p.addStyleTag({ content: '#sp{display:none !important}' + (process.argv[6] === 'hide' ? '.page, #navDemo, #dots, .msg, [class^=msg]{visibility:hidden !important}' : '') });
  if (process.env.FREEZE) await p.evaluate(() => { winterLab.V.sway = 0; winterLab.V.swayRandom = 0; winterLab.V.shedEvery = 999; winterLab.V.shedAmount = 0; winterLab.V.petals = 0; winterLab.V.flakes = 0; winterLab.V.bokeh = 0; });
  await p.waitForTimeout(800);
  console.log(await p.evaluate(() => 'snow material: ' + (typeof Snowfield !== 'undefined' && Snowfield.supported())));
  let i = 0;
  for (const c of clips) await p.screenshot({ timeout: 120000, path: out + (i++) + '.png', clip: c ? { x: c[0], y: c[1], width: c[2], height: c[3] } : undefined });
  console.log(await p.evaluate(() => winterLab.report().split('\n').slice(-4).join('\n')));
  console.log(errs.join('\n'));
  await b.close();
})();
