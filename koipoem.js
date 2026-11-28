/* ============================================================
   koipoem.js — the pond's name and its hidden-name poem (折句) on the
   app's koi pond page, made from the name she typed on the name screen
   (pondverse.js). It is koiscreen.html's section 3f, copied as it is
   (the test bed is where it is tuned); only where it draws and where
   the name comes from differ. Values: the pv… keys of KOI_SCREEN in
   app.js (the test bed's panel group "The pond's name and poem").

   Laid out upper left, vertical, right to left: the poem's four columns
   (each painted in by the wet ink wash, inkreveal.js + inkfluid.js, the
   app's RV_LOOK with the poem's own PV_INK), a thin line, the pond's name
   written stroke by stroke (inkwrite.js, with strokes.js), her seal under
   it, stamped last. When the copy in koiscreen.html changes, copy it again.

   Use (koipage.js):
     KoiPoem.init(stage, values, { look, name })   once
     KoiPoem.write(wait)    written in, starting wait s from now
     KoiPoem.hide()         gone at once
   ============================================================ */
(function () {
'use strict';
var V = {}, INK_LOOK = {}, NAMEFN = null;
function NAME() { try { return String((NAMEFN && NAMEFN()) || ''); } catch (e) { return ''; } }
function ready() { return typeof PondVerse !== 'undefined' && typeof InkWrite !== 'undefined'; }

  /* ============================================================
     3f. THE POND'S NAME AND POEM
     Made from the therapist's name (in the app: the one typed on the
     name screen; here the panel's name box) by pondverse.js: a pond name
     and a two-line hidden-name poem (折句), her syllables in vermilion,
     her seal (the first character of her name, as typed). Laid out as the
     user's picture: upper left, vertical, read right to left; the poem's
     lines split at their commas into four columns, a thin line, the pond's
     name with the seal under it. Written in when the ink transition is
     done (pvAt s later): the poem's four columns each come in as one (the
     rocks' ink wash, all its times set by pvWashSpeed), then the pond's name is
     written stroke by stroke as the name screen's name is, the seal stamped
     last, then the thin line. Sizes follow the screen's height.
     ============================================================ */
  var pvEl = null, PV = { timer: 0, verse: null };
  // the poem's ink wash at speed 1 (pvWashSpeed divides every one of these):
  // each column's time, the gap to the next, the stain drying away, how long
  // a letter takes to soak in where the ink has reached it
  var PV_COL = 2.2, PV_COL_GAP = 1.1, PV_WASH_DRY = 1.6, PV_EMERGE = 0.35;
  // characters with no stroke data (strokes.js not loaded): the CSS brush-in
  var PV_PLAIN_STAGGER = 0.11, PV_PLAIN_BRUSH = 1.2, PV_PLAIN_DRY = 1.7;
  // the divider starts when the pond's name is this far written
  var PV_RULE_AT = 0.8;
  function pvWs() { return Math.max(0.1, V.pvWashSpeed); }
  function pvGlow() {
    var g = Math.max(0, V.pvGlow);
    return '0 0 ' + (8 * g).toFixed(1) + 'px rgba(255, 248, 240, ' + Math.min(1, 0.92 * g).toFixed(2) + '), 0 0 ' +
           (18 * g).toFixed(1) + 'px rgba(250, 228, 210, ' + Math.min(1, 0.7 * g).toFixed(2) + ')';
  }
  function pvLayout() {
    var H = innerHeight, f = Math.max(8, V.pvSize * H);
    pvEl.style.left = (V.pvX * innerWidth).toFixed(1) + 'px';
    pvEl.style.top = (V.pvY * H).toFixed(1) + 'px';
    pvEl.style.fontSize = f.toFixed(1) + 'px';
    pvEl.style.setProperty('--pv-ink', V.pvInk);
    pvEl.style.setProperty('--pv-red', V.pvRed);
    pvEl.style.setProperty('--pv-glow', pvGlow());
    pvEl.style.setProperty('--pv-brush', PV_PLAIN_BRUSH + 's');
    pvEl.style.setProperty('--pv-dry', PV_PLAIN_DRY + 's');
    pvEl.style.setProperty('--pv-line', (PV_COL / pvWs()).toFixed(2) + 's');
    pvEl.querySelectorAll('.pv-col').forEach(function (c) { c.style.lineHeight = V.pvPitch; });
    var rule = pvEl.querySelector('.pv-rule');
    if (rule) rule.style.margin = '0 ' + (V.pvGap * 0.5).toFixed(2) + 'em';
    var nm = pvEl.querySelector('.pv-name');
    if (nm) {
      nm.style.fontSize = V.pvTitle + 'em';
      nm.style.lineHeight = 1.5;
      nm.style.paddingTop = (V.pvTitleDrop / V.pvTitle).toFixed(3) + 'em';
    }
    var seal = pvEl.querySelector('.pv-seal');
    if (seal) {
      // the box is pvSeal × the poem's character size (in the name's em)
      seal.style.width = seal.style.height = (V.pvSeal / V.pvTitle).toFixed(3) + 'em';
      seal.style.marginTop = (0.36 / V.pvTitle).toFixed(3) + 'em';
    }
    pvEl.classList.toggle('off', !V.pvShow);
  }
  function pvRgb(h) {
    var m = /^#?([0-9a-f]{6})$/i.exec(String(h || '').trim());
    if (!m) return [63, 42, 34];
    var n = parseInt(m[1], 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  // build the characters (each its own span, so each can be brushed in)
  function pvBuild() {
    var vs = PondVerse.make(NAME());
    PV.verse = vs;
    InkWrite.stop();
    pvEl.innerHTML = '';
    var f = Math.max(8, V.pvSize * innerHeight), dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    var g = Math.max(0, V.pvGlow);
    var glow = g > 0 ? [{ c: 'rgba(255, 248, 240, ' + Math.min(1, 0.92 * g).toFixed(2) + ')', blur: 8 * g },
                        { c: 'rgba(250, 228, 210, ' + Math.min(1, 0.7 * g).toFixed(2) + ')', blur: 18 * g }] : [];
    var items = [], plain = [], t = 0.15, GAP = 0.2;
    var still = [];
    var useInk = typeof InkReveal !== 'undefined';   // (else, or if the ink fails, a brush sweep down each column)
    // write: each character written stroke by stroke (the pond's name);
    // else shown whole inside its column, which comes in as one (the poem)
    function chars(box, list, em, write) {
      list.forEach(function (c) {
        var it = null, el = null;
        if (InkWrite.ready() && InkWrite.has(c.ch)) {
          el = document.createElement('canvas');
          el.className = 'pv-c' + (c.red ? ' red' : '');
          el.textContent = c.ch;
          it = InkWrite.item(el, c.ch, { em: em, dpr: dpr, font: PV_FONT, weight: 400, vertical: true,
                                         colour: c.red ? V.pvRed : V.pvInk, glow: glow });
        }
        if (it && !write) {
          // (painted in by the ink wash: a soft shadow of its own ink round each
          // letter, kept for good, the same one the wash draws while it is wet)
          if (useInk && V.pvShadow > 0) {
            var sc = pvRgb(c.red ? V.pvRed : V.pvInk), sa = Math.min(1, 0.55 * V.pvShadow);
            it.glow = glow.concat([{ c: 'rgba(' + sc.join(',') + ',' + sa.toFixed(2) + ')', blur: 4.8 }]);
          }
          box.appendChild(el); el._pvIt = it; still.push(it); return;
        }
        if (it) { box.appendChild(el); t = InkWrite.plan(it, t) + GAP; items.push(it); return; }
        // no stroke data (strokes.js not loaded): brushed in as text, the old way
        var sp = document.createElement('span');
        sp.className = 'pv-c' + (c.red ? ' red' : '') + (write ? '' : ' pv-in');
        sp.textContent = c.ch;
        box.appendChild(sp);
        if (!write) return;
        plain.push({ el: sp, start: t });
        t += PV_PLAIN_STAGGER + GAP;
      });
    }
    var poem = document.createElement('div'); poem.className = 'pv-poem';
    poem.style.display = 'block';
    pvEl.appendChild(poem);
    // the poem: each of its four columns comes in as one, right to left, by the
    // rocks' ink wash (a brush sweep down it only if the ink cannot run), all
    // its times set by the one ink-wash speed
    var dur = PV_COL / pvWs(), cols = [];
    vs.cols.forEach(function (col) {
      if (!col.length) return;
      var d = document.createElement('div');
      poem.appendChild(d);
      var n0 = still.length;
      chars(d, col, f, false);
      // painted on #pvFx (its characters' pictures cut to the ink or the brush);
      // a column with a character that has no stroke picture: the CSS sweep
      var wash = !d.querySelector('span.pv-c');
      d.className = 'pv-col ' + (wash ? 'wash' : 'sweep');
      if (!wash) d.style.animationDelay = t.toFixed(2) + 's, ' + t.toFixed(2) + 's';
      cols.push({ el: d, start: t, dur: dur, wash: wash, kind: useInk ? 'ink' : 'brush' });
      t += PV_COL_GAP / pvWs();
    });
    if (cols.length) t = cols[cols.length - 1].start + dur;
    InkWrite.finish(still);
    var rule = document.createElement('div'); rule.className = 'pv-rule'; pvEl.appendChild(rule);
    var nm = document.createElement('div'); nm.className = 'pv-name';
    pvEl.appendChild(nm);
    t += Math.max(0, V.pvColPause);
    var nItems = items.length, nPlain = plain.length, tName = t;
    // the pond's name: written stroke by stroke, as the name screen writes the name
    chars(nm, vs.title, f * V.pvTitle, true);
    // its speed: 1 = the name screen's own pace, 2 = twice as fast
    var k = 1 / Math.max(0.1, V.pvNameSpeed);
    if (k !== 1) { InkWrite.scale(items, tName, k); plain.forEach(function (p) { p.start = tName + (p.start - tName) * k; }); t = tName + (t - tName) * k; }
    plain.forEach(function (p) { p.el.style.animationDelay = p.start.toFixed(2) + 's, ' + p.start.toFixed(2) + 's'; });
    // the divider: drawn as soon as the pond's name is PV_RULE_AT (80 %) written
    // (from its first stroke's start to its last stroke's end)
    var n0 = Infinity, n1 = -Infinity;
    items.slice(nItems).forEach(function (it) { n0 = Math.min(n0, it.start); n1 = Math.max(n1, it.end); });
    plain.slice(nPlain).forEach(function (p) { n0 = Math.min(n0, p.start); n1 = Math.max(n1, p.start + PV_PLAIN_BRUSH); });
    var nameIn = n1 > n0 ? n0 + PV_RULE_AT * (n1 - n0) : t;
    rule.style.animationDelay = nameIn.toFixed(2) + 's';
    var seal = document.createElement('span'); seal.className = 'pv-seal';
    seal.setAttribute('data-seal', vs.seal);
    seal.innerHTML = pvSealSvg();
    pvSealFit(seal, vs.seal);
    seal.style.animationDelay = (t + 0.5).toFixed(2) + 's';
    nm.appendChild(seal);
    PV.items = items;
    PV.cols = cols;
    PV.total = Math.max(t + 1.5, nameIn + 0.9);
    pvLayout();
  }
  // her seal, as the receipt's: the same two ink filters (index.html, #receiptStamp)
  var PV_SEAL_FONT = '"Yuji Syuku", "Zen Antique", "Shippori Mincho", serif';
  var PV_SEAL_IN = 8.5;     // where the border's inner edge is (the box is 0 … 100)
  function pvSealSvg() {
    return '<svg viewBox="0 0 100 100" focusable="false">' +
      '<defs>' +
        '<filter id="pvInkRough" x="-5%" y="-5%" width="110%" height="110%">' +
          '<feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="4" result="blot"/>' +
          '<feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="3" seed="9" result="grain"/>' +
          '<feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="21" result="wob"/>' +
          '<feDisplacementMap in="SourceGraphic" in2="wob" scale="2.4" xChannelSelector="R" yChannelSelector="G" result="rough"/>' +
          '<feColorMatrix in="blot" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.0 1.4" result="blotA"/>' +
          '<feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.2 1.75" result="grainA"/>' +
          '<feComposite in="blotA" in2="grainA" operator="in" result="mask"/>' +
          '<feComposite in="rough" in2="mask" operator="in"/>' +
        '</filter>' +
        '<filter id="pvInkLight" x="-5%" y="-5%" width="110%" height="110%">' +
          '<feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="2" seed="13" result="g"/>' +
          '<feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.5 1.72" result="ga"/>' +
          '<feComposite in="SourceGraphic" in2="ga" operator="in"/>' +
        '</filter>' +
      '</defs>' +
      '<rect x="4.5" y="4.5" width="91" height="91" rx="3" fill="none" stroke="currentColor" stroke-width="8" filter="url(#pvInkRough)"/>' +
      '<text x="0" y="0" font-size="100" fill="currentColor" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" filter="url(#pvInkLight)"></text>' +
    '</svg>';
  }
  // the character scaled (a little more one way than the other if it must, as
  // seal carvers do, at most 1.35 times) so its ink fills the square up to the
  // border on every side, and centred on its ink, not on its letter box
  function pvSealFit(seal, ch) {
    var tx = seal.querySelector('text'); if (!tx) return;
    tx.textContent = ch;
    function fit() {
      var c = document.createElement('canvas').getContext('2d');
      c.font = '100px ' + PV_SEAL_FONT;
      var m = c.measureText(ch);
      var L = m.actualBoundingBoxLeft, R = m.actualBoundingBoxRight, A = m.actualBoundingBoxAscent, D = m.actualBoundingBoxDescent;
      var w = L + R, h = A + D;
      if (!(w > 1 && h > 1)) return;
      var T = 100 - 2 * PV_SEAL_IN + 1.6;          // (the ink's stroke reaches 0.8 past its outline each side)
      var s = Math.min(T / w, T / h);
      var sx = Math.min(T / w, s * 1.35), sy = Math.min(T / h, s * 1.35);
      var cx = (R - L) / 2, cy = (D - A) / 2;
      tx.setAttribute('font-family', PV_SEAL_FONT);
      tx.setAttribute('transform', 'translate(50 50) scale(' + sx.toFixed(4) + ' ' + sy.toFixed(4) + ') translate(' + (-cx).toFixed(2) + ' ' + (-cy).toFixed(2) + ')');
      tx.setAttribute('stroke-width', (1.6 / Math.min(sx, sy)).toFixed(2));
    }
    fit();
    if (document.fonts && document.fonts.load) document.fonts.load('100px "Yuji Syuku"', ch).then(fit, function () {});
  }
  var PV_FONT = '"Yuji Syuku", "Shippori Mincho", serif';
  /* the poem's columns painted in by the rocks' ink wash: the
     same wet ink (inkreveal.js + inkfluid.js, INK_LOOK) as the rocks, after
     theirs is over. Each column a part of its own: drops laid down it from
     top to bottom; its finished characters are drawn on a layer where it
     stands, cut to its wet ink on #pvFx; when its wash is done the column
     itself is shown and #pvFx cleared there. */
  var pvFx = null, PW = { raf: 0, on: false, layer: null, last: 0 };
  // keep: the wash has finished and its last picture stays on #pvFx (the
  // finished columns are this picture, not the page's own: no hand-over)
  function pvWashStop(keep) {
    if (PW.raf) { cancelAnimationFrame(PW.raf); PW.raf = 0; }
    if (PW.on) {
      PW.on = false;
      (PW.cols || []).forEach(function (C) { C.mask = C.wet = C.blur = C.pic = C.picG = C.picD = C.picGlow = C.acc = null; });
      if (PW.ink && typeof InkReveal !== 'undefined') InkReveal.stop();
      PW.ink = false;
      if (typeof InkFluid !== 'undefined' && InkFluid.release) InkFluid.release();
    }
    if (PW.layer) PW.layer.width = PW.layer.height = 1;
    if (PW.glowLayer) PW.glowLayer.width = PW.glowLayer.height = 1;
    if (PW.maskLayer) PW.maskLayer.width = PW.maskLayer.height = 1;
    if (!keep) pvFx.width = pvFx.height = 1;
  }
  function pvColPicture(C, pr) {
    var r = C.el.getBoundingClientRect(), pad = r.width * 0.4;
    C.R = { x: Math.max(0, Math.floor((r.left - pad) * pr)), y: Math.max(0, Math.floor((r.top - pad) * pr)) };
    C.R.w = Math.min(pvFx.width, Math.ceil((r.right + pad) * pr)) - C.R.x;
    C.R.h = Math.min(pvFx.height, Math.ceil((r.bottom + pad) * pr)) - C.R.y;
    var pic = document.createElement('canvas'); pic.width = Math.max(1, C.R.w); pic.height = Math.max(1, C.R.h);
    var g = pic.getContext('2d');
    // (and for the ink wash: the letters alone, without their pale glow, so the
    // wet ink lies only on the strokes, not on the glow's square round them)
    var picG = document.createElement('canvas'); picG.width = pic.width; picG.height = pic.height;
    var gg = picG.getContext('2d');
    C.el.querySelectorAll('canvas.pv-c').forEach(function (cv) {
      var b = cv.getBoundingClientRect();
      g.drawImage(cv, b.left * pr - C.R.x, b.top * pr - C.R.y, b.width * pr, b.height * pr);
      gg.drawImage(cv._pvIt ? cv._pvIt.glyph : cv, b.left * pr - C.R.x, b.top * pr - C.R.y, b.width * pr, b.height * pr);
    });
    C.pic = pic; C.picG = picG;
    if (C.kind === 'ink') {
      // the letters with their soft shadow of ink (as the column has it for
      // good), without the pale glow: what the wash paints
      // drawn exactly as InkWrite draws the dry character on the page (each glow
      // pass also lays the letter, then the letter once more), split in two: the
      // pale glow alone (C.picGlow, faded in as the ink dries, never inked) and
      // the letters with their soft ink shadow (C.picD, what the wash paints),
      // so that when the column itself takes over nothing changes
      var pd = C.picD = document.createElement('canvas'); pd.width = pic.width; pd.height = pic.height;
      var pg = C.picGlow = document.createElement('canvas'); pg.width = pic.width; pg.height = pic.height;
      var dg = pd.getContext('2d'), gl = pg.getContext('2d'), OFF = 10000;
      C.el.querySelectorAll('canvas.pv-c').forEach(function (cv) {
        var b = cv.getBoundingClientRect(), it = cv._pvIt, x = b.left * pr - C.R.x, y = b.top * pr - C.R.y, w = b.width * pr, h = b.height * pr;
        if (!it) return;
        var k = w / Math.max(1, cv.width);              // (the shadows' blur in this picture's pixels)
        it.glow.forEach(function (g, i) {
          var dark = V.pvShadow > 0 && i === it.glow.length - 1;
          if (dark) { dg.save(); dg.shadowColor = g.c; dg.shadowBlur = g.blur * it.dpr * k; dg.drawImage(it.glyph, x, y, w, h); dg.restore(); }
          else {
            gl.save(); gl.shadowColor = g.c; gl.shadowBlur = g.blur * it.dpr * k; gl.shadowOffsetX = OFF;
            gl.drawImage(it.glyph, x - OFF, y, w, h); gl.restore();
            dg.drawImage(it.glyph, x, y, w, h);
          }
        });
        dg.drawImage(it.glyph, x, y, w, h);
      });
    }
    C.box = r;
  }
  // the ink for the poem: the rocks' look, with the drops sized to a column of
  // text (the rocks' drops, with their water 3.7 × wider, wetted a whole column
  // at once and the text showed plainly before the ink reached it), the water
  // only a little ahead of the ink, and the wet ink darker
  // (the water barely stirred, so the ink stays on its column: the rocks' stirring
  // carried it off to one side; and less ink, so a letter is not shown whole the
  // moment the first thin ink touches it)
  var PV_INK = { random: 0.2, wetSize: 1.35, prewet: 0.12, drop: 1, ink: 0.55, rim: 0.9, show: 0.6, load: 4, creep: 0.18, edge: 0.45,
                 swirl: 8, stir: 6, push: 0.3 };
  function pvWashStart() {
    var cols = (PV.cols || []).filter(function (C) { return C.wash; });
    if (!cols.length) return;
    var pr = Math.min(window.devicePixelRatio || 1, 2.5), sp = INK_LOOK.speed;
    pvFx.width = Math.round(innerWidth * pr); pvFx.height = Math.round(innerHeight * pr);
    if (!PW.layer) PW.layer = document.createElement('canvas');
    PW.layer.width = pvFx.width; PW.layer.height = pvFx.height;
    if (!PW.glowLayer) PW.glowLayer = document.createElement('canvas');
    PW.glowLayer.width = pvFx.width; PW.glowLayer.height = pvFx.height;
    if (!PW.maskLayer) PW.maskLayer = document.createElement('canvas');
    PW.maskLayer.width = pvFx.width; PW.maskLayer.height = pvFx.height;
    cols.forEach(function (C, i) { pvColPicture(C, pr); C.id = 'pvcol' + i; C.shown = false; C.seed = i * 7.31 + 1; });
    var inks = cols.filter(function (C) { return C.kind === 'ink'; });
    if (inks.length) {
      try {
        for (var k in INK_LOOK) InkReveal.look[k] = INK_LOOK[k];
        for (k in PV_INK) InkReveal.look[k] = PV_INK[k];
        InkReveal.look.finish = PV_WASH_DRY / pvWs() * sp;   // (the stain drying away, in the ink's own clock)
        InkReveal.setup(innerWidth, innerHeight);
        InkReveal.plan(inks.map(function (C) {
          // small drops (0.38 × the column's width, so the wet edge visibly crosses each
          // letter) one after another, strictly top to bottom over the column's time
          var r = C.box, w = Math.max(8, r.width), seeds = [], n = Math.max(6, Math.ceil(r.height / (w * 0.2)));
          for (var j = 0; j <= n; j++) {
            var u = j / n;
            seeds.push({ x: r.left + r.width / 2 + Math.sin(j * 1.7 + C.seed) * 0.12 * w, y: r.top + u * r.height,
                         r: w * 0.38, at: u * C.dur * 0.8 * sp });
          }
          return { id: C.id, kind: 'wash', at: C.start * sp, dur: C.dur * sp, washes: [{ seeds: seeds, fall: 0.1 }] };
        }));
        InkReveal.play(performance.now() / 1000);
        PW.ink = true;
      } catch (e) {
        console.warn('poem ink wash:', e);
        inks.forEach(function (C) { C.kind = 'brush'; });
      }
    }
    PW.on = true; PW.cols = cols; PW.last = 0; PW.pr = pr; PW.t0 = performance.now() / 1000;
    PW.raf = requestAnimationFrame(pvWashFrame);
  }
  /* the brush (only if the ink cannot run): a loaded brush drawn down the column. Its
     bristles are lanes across the column, each a little ahead of or behind
     the others (a ragged front); near the front the stroke is still dry-
     brushed (streaks with gaps) and fills in as the brush passes; the part
     just painted is wet (the ink bled a little, darker), drying sharp. */
  function pvBrushFrame(C, c, el) {
    var R = C.R, W = R.w, H = R.h, u = (el - C.start) / C.dur;
    if (u <= 0) return false;
    if (u >= 1.25) return true;
    if (!C.mask) {
      C.mask = document.createElement('canvas'); C.mask.width = W; C.mask.height = H;
      C.wet = document.createElement('canvas'); C.wet.width = W; C.wet.height = H;
      var b = C.blur = document.createElement('canvas'); b.width = W; b.height = H;
      var bg = b.getContext('2d'); bg.filter = 'blur(' + (2.2 * PW.pr).toFixed(1) + 'px)'; bg.drawImage(C.pic, 0, 0); bg.filter = 'none';
      var rnd = (function (s) { return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; })(Math.floor(C.seed * 1e5) + 7);
      C.lanes = [];
      for (var i = 0, n = 16; i < n; i++) C.lanes.push({ lag: (rnd() - 0.5) * 0.16 + Math.abs(i - (n - 1) / 2) / n * 0.12, gaps: [rnd(), rnd(), rnd()], a: 0.65 + rnd() * 0.35 });
    }
    var p = Math.min(1, u), e = 0.5 - 0.5 * Math.cos(Math.PI * p), m = C.mask.getContext('2d'), n = C.lanes.length, lw = W / n;
    m.setTransform(1, 0, 0, 1, 0, 0); m.clearRect(0, 0, W, H);
    var tail = H * 0.07;
    C.lanes.forEach(function (L, i) {
      var front = (e * (1 + 0.3) - 0.15 - L.lag) * H;
      if (front <= 0) return;
      var x = i * lw - lw * 0.25, w = lw * 1.5;
      // behind the dry zone: solid; in it: streaky, filling in as it ages
      var dry = H * 0.22, solidTo = Math.max(0, front - dry);
      m.globalAlpha = 1; m.fillStyle = '#000';
      m.fillRect(x, 0, w, solidTo);
      for (var y = solidTo; y < front; y += 3) {
        var k = (front - y) / dry, gap = Math.sin(y * 0.09 + L.gaps[0] * 9) + Math.sin(y * 0.023 + L.gaps[1] * 7);
        m.globalAlpha = Math.max(0, Math.min(1, L.a * (0.35 + k) + (gap > 0.9 - k * 1.6 ? 0 : -0.55)));
        m.fillRect(x, y, w, 3);
      }
      var g = m.createLinearGradient(0, front, 0, front + tail);
      g.addColorStop(0, 'rgba(0,0,0,' + (L.a * 0.5).toFixed(2) + ')'); g.addColorStop(1, 'rgba(0,0,0,0)');
      m.globalAlpha = 1; m.fillStyle = g; m.fillRect(x, front, w, tail);
    });
    // fully dry once the brush is past and the column's time is up
    if (u > 1) { m.globalAlpha = Math.min(1, (u - 1) * 4); m.fillStyle = '#000'; m.fillRect(0, 0, W, H); m.globalAlpha = 1; }
    // the sharp ink where the brush has been
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
    var l = PW.layer.getContext('2d');
    l.setTransform(1, 0, 0, 1, 0, 0); l.globalCompositeOperation = 'source-over'; l.clearRect(0, 0, W, H);
    l.drawImage(C.pic, 0, 0); l.globalCompositeOperation = 'destination-in'; l.drawImage(C.mask, 0, 0);
    l.globalCompositeOperation = 'source-over';
    c.drawImage(PW.layer, 0, 0, W, H, R.x, R.y, W, H);
    // the wet band just behind the front: the ink bled a little, darker
    var wt = C.wet.getContext('2d'), wf = e * 1.3 * H - 0.15 * H, wb = H * 0.3, wet = Math.max(0, 1 - Math.max(0, u - 1) * 4);
    if (wet > 0) {
      wt.setTransform(1, 0, 0, 1, 0, 0); wt.globalCompositeOperation = 'source-over'; wt.clearRect(0, 0, W, H);
      wt.drawImage(C.blur, 0, 0);
      wt.globalCompositeOperation = 'destination-in'; wt.drawImage(C.mask, 0, 0);
      var gb = wt.createLinearGradient(0, wf - wb, 0, wf);
      gb.addColorStop(0, 'rgba(0,0,0,0)'); gb.addColorStop(1, 'rgba(0,0,0,1)');
      wt.fillStyle = gb; wt.fillRect(0, 0, W, H);
      wt.globalCompositeOperation = 'source-over';
      c.globalAlpha = 0.85 * wet; c.drawImage(C.wet, 0, 0, W, H, R.x, R.y, W, H); c.globalAlpha = 1;
    }
    c.restore();
    return false;
  }
  function pvWashFrame(now) {
    PW.raf = 0;
    if (!PW.on) return;
    var t = now / 1000, dt = Math.min(0.05, PW.last ? t - PW.last : 0); PW.last = t;
    if (PW.ink) InkReveal.update(t, dt);
    var c = pvFx.getContext('2d'), l = PW.layer.getContext('2d'), left = 0, el = t - PW.t0;
    // (the ink's stain spreads past each column's box: the whole overlay is
    // cleared once a frame and every column still coming in drawn again)
    if (PW.ink) { c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, pvFx.width, pvFx.height); }
    PW.cols.forEach(function (C) {
      if (C.shown) return;
      var R = C.R;
      if (!PW.ink) { c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(R.x, R.y, R.w, R.h); }
      if (C.kind === 'brush') {
        if (pvBrushFrame(C, c, el)) { C.el.classList.add('in'); C.shown = true; c.clearRect(R.x, R.y, R.w, R.h); return; }
        left++; return;
      }
      var st = InkReveal.state(C.id);
      if (st === 0) { left++; return; }
      if (C.dry) {
        // the wash is done and every letter has come in: the finished letters,
        // with their glow and shadow, stay drawn here (handing over to the
        // page's own column showed as a jump: the browser scales its letters a
        // little differently)
        c.drawImage(C.picGlow, R.x, R.y); c.drawImage(C.picD, R.x, R.y);
        return;
      }
      left++;
      // how much of each stroke shows follows the ink itself, pixel by pixel:
      // each frame the wet ink lying there (thin at the spreading edge, thick
      // where it pools, with the paper's grain) is soaked a little more into
      // what has come in so far, so a letter fills in unevenly as the stain
      // spreads across it; toward the end of the wash (as it starts to dry)
      // the wash's own mask fills in whatever is left
      if (!C.acc) { C.acc = document.createElement('canvas'); C.acc.width = R.w; C.acc.height = R.h; C.accT = 0; }
      var ac = C.acc.getContext('2d'), tau = PV_EMERGE / pvWs(), ddt = Math.max(dt, 1 / 120);
      var mg = PW.maskLayer.getContext('2d');
      mg.setTransform(1, 0, 0, 1, 0, 0); mg.globalCompositeOperation = 'source-over'; mg.clearRect(R.x, R.y, R.w, R.h);
      if (st === 1) {
        InkReveal.inkOnto(mg, C.id, PW.pr, R, 1);
        // (the ink's darkest is about 0.75: soaked in fully in about PV_EMERGE / pvWashSpeed s)
        ac.globalAlpha = Math.min(1, ddt / (tau * 0.75)); ac.drawImage(PW.maskLayer, R.x, R.y, R.w, R.h, 0, 0, R.w, R.h);
        mg.clearRect(R.x, R.y, R.w, R.h);
      }
      var late = st === 2 ? 1 : 1 - InkReveal.soft(C.id);
      if (late > 0.003) {
        mg.fillStyle = '#000'; mg.fillRect(R.x, R.y, R.w, R.h);
        if (st === 1) InkReveal.maskInPlace(mg, C.id, PW.pr, 0);
        ac.globalAlpha = late * (1 - Math.exp(-ddt / tau)); ac.drawImage(PW.maskLayer, R.x, R.y, R.w, R.h, 0, 0, R.w, R.h);
      }
      ac.globalAlpha = 1;
      if (st === 2) {
        // (the wash's last fill has shown everything: the letters finish coming in)
        C.accT += dt;
        if (C.accT > 6 * tau) { C.dry = true; c.drawImage(C.picGlow, R.x, R.y); c.drawImage(C.picD, R.x, R.y); return; }
      }
      // the ink's own stain on the paper, spreading down the column with its
      // ragged wet edges, darker where it pools, drying away as it finishes
      if (st === 1 && V.pvStain > 0) InkReveal.inkOnto(c, C.id, PW.pr, null, Math.min(1, V.pvStain));
      // (the pale glow comes in as the ink dries, where the letters have come in,
      // and is never inked: inked, it showed as a box round each letter)
      var dry = st === 2 ? 1 : 1 - InkReveal.soft(C.id);
      if (dry > 0.003) {
        var lg = PW.glowLayer.getContext('2d');
        lg.setTransform(1, 0, 0, 1, 0, 0); lg.globalCompositeOperation = 'source-over'; lg.clearRect(R.x, R.y, R.w, R.h);
        lg.drawImage(C.picGlow, R.x, R.y);
        lg.globalCompositeOperation = 'destination-in'; lg.drawImage(C.acc, R.x, R.y); lg.globalCompositeOperation = 'source-over';
        c.globalAlpha = dry; c.drawImage(PW.glowLayer, R.x, R.y, R.w, R.h, R.x, R.y, R.w, R.h); c.globalAlpha = 1;
      }
      // the letters (with their soft shadow), as far as they have come in, inked while wet
      l.setTransform(1, 0, 0, 1, 0, 0); l.globalCompositeOperation = 'source-over'; l.clearRect(R.x, R.y, R.w, R.h);
      l.drawImage(C.picD, R.x, R.y);
      l.globalCompositeOperation = 'destination-in'; l.drawImage(C.acc, R.x, R.y); l.globalCompositeOperation = 'source-over';
      if (st === 1) InkReveal.inkOnto(l, C.id, PW.pr, R, 1, 'source-atop');
      c.drawImage(PW.layer, R.x, R.y, R.w, R.h, R.x, R.y, R.w, R.h);
    });
    if (!left || (PW.ink && !InkReveal.running() && !PW.cols.some(function (C) { return (!C.shown && C.kind === 'brush') || (C.kind === 'ink' && !C.dry); }))) {
      var keep = PW.ink;
      PW.cols.forEach(function (C) { C.el.classList.add(C.kind === 'ink' && keep ? 'kept' : 'in'); });
      pvWashStop(keep); return;
    }
    PW.raf = requestAnimationFrame(pvWashFrame);
  }
  function pvHide() {
    if (!pvEl) return;
    clearTimeout(PV.timer); PV.timer = 0;
    if (typeof InkWrite !== 'undefined') InkWrite.stop();
    pvWashStop();
    pvEl.classList.remove('writing', 'done');
    PV.state = 'off';
  }
  // write it in (after `wait` s); now = true: show it written, at once.
  // The brush font is loaded first (its characters are what the brush uncovers).
  function pvWrite(wait, now) {
    if (!pvEl) return;
    pvHide();
    var job = PV.job = {};
    var fontOk = document.fonts && document.fonts.load
      ? document.fonts.load('40px "Yuji Syuku"', PondVerse.make(NAME()).lines.join('') + PondVerse.make(NAME()).title.map(function (c) { return c.ch; }).join('')).catch(function () {})
      : Promise.resolve();
    fontOk.then(function () {
      if (PV.job !== job) return;
      pvBuild();
      if (now) { InkWrite.finish(PV.items); pvEl.classList.add('done'); PV.state = 'done'; return; }
      PV.state = 'waiting';
      PV.timer = setTimeout(function () {
        PV.timer = 0;
        if (PV.job !== job) return;
        void pvEl.offsetWidth;            // (so the CSS parts start again from the top)
        pvEl.classList.add('writing');
        PV.state = 'writing';
        pvWashStart();
        InkWrite.play(PV.items, function () { if (PV.job === job) PV.state = 'done'; });
      }, Math.max(0, wait) * 1000);
    });
  }
  // a look or size setting changed: written again at once in the new look
  // (or from the start, if it was being written)
  function pvRefresh() {
    if (PV.state === 'writing' || PV.state === 'waiting') pvWrite(0); else pvWrite(0, true);
  }
  addEventListener('resize', function () { if (PV.state && PV.state !== 'off') pvRefresh(); });


function init(stage, values, opt) {
  opt = opt || {};
  V = values || {}; INK_LOOK = opt.look || {}; NAMEFN = opt.name || null;
  pvEl = document.createElement('div'); pvEl.className = 'pv off'; pvEl.setAttribute('aria-hidden', 'true');
  pvFx = document.createElement('canvas'); pvFx.className = 'pv-fx'; pvFx.setAttribute('aria-hidden', 'true');
  stage.appendChild(pvEl); stage.appendChild(pvFx);
}
function write(wait) { if (pvEl && ready() && V.pvShow) pvWrite(wait || 0); }
function hide() { if (pvEl && ready()) pvHide(); }
function info() { return { state: PV.state || 'off', verse: PV.verse ? PV.verse.lines : null, name: NAME() }; }

window.KoiPoem = { init: init, write: write, hide: hide, info: info };
})();
