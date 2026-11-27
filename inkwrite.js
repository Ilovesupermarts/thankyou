/* ============================================================
   inkwrite.js — characters written stroke by stroke with a brush, as the
   name is on the name screen (app.js "THE NAME, WRITTEN STROKE BY
   STROKE": nameStrokes, nameGlyph, nameBrushTo, nameCompose,
   nameDrawFrame; app.js itself is not changed). Used by koiscreen.html
   for the pond's name and poem.

   Each character is a canvas. What appears is the brush font's own
   character: a round brush that follows each stroke's centre line, in
   the proper stroke order (NAME_STROKE_DATA in strokes.js, from KanjiVG,
   CC BY-SA 3.0), uncovers it; it presses a little at the start of a
   stroke and lifts at the end, the pen lifting between strokes. Fresh
   ink is wet (soft, bleeding a little into the paper) and dries sharp
   over about half a second; a small wet bead rides the brush tip. When a
   character's last stroke is done, any edge the brush missed fills in
   softly. Dark ink on light paper here (the name screen's is white on
   the scenery), so the wet bloom is the ink's own colour, not light.

   InkWrite.ready()            true once strokes.js has loaded
   InkWrite.has(ch)            stroke data for ch?
   InkWrite.item(canvas, ch, o) o: { em (CSS px), dpr, font, weight, vertical,
                               colour, glow (CSS text-shadow-like list
                               [{ c, blur, x, y }]) } → an item, its
                               character drawn, nothing uncovered yet
   InkWrite.plan(item, t)      lays out its strokes from time t (s);
                               returns the time its last stroke ends
   InkWrite.scale(items, t0, f) speeds a whole plan up about t0 by f
   InkWrite.play(items, onDone) starts the brush (one animation frame
                               loop for all of them)
   InkWrite.finish(items)      shows them written, at once
   InkWrite.stop()
   ============================================================ */
var InkWrite = (function () {
  'use strict';
  var STROKE_BASE = 0.14, STROKE_PER_LEN = 0.24, PEN_LIFT = 0.07,
      BRUSH = 0.1, WET = 0.55, SETTLE = 0.4;
  var index = null, raf = 0, tmpInk = null, tmpWet = null;

  function ready() { return typeof NAME_STROKE_DATA === 'string'; }
  function strokes(ch) {
    if (!ready()) return null;
    if (!index) {
      index = {};
      var list = NAME_STROKE_DATA.split(',');
      for (var i = 0; i < list.length; i++) {
        var key = String.fromCodePoint(list[i].codePointAt(0));
        index[key] = list[i].slice(key.length);
      }
    }
    var raw = index[ch];
    if (!raw) return null;
    var parts = raw.split(' '), out = [];
    for (var s = 0; s < parts.length; s++) {
      var str = parts[s], v = [];
      for (var k = 0; k < str.length; k++) {
        var c = str.charCodeAt(k);
        v.push(-6 + (c - 0x21 - (c > 0x22) - (c > 0x2c) - (c > 0x5c)) * (121 / 90));
      }
      var pts = [v[0], v[1]], lens = [0], total = 0;
      for (var j = 2; j + 5 < v.length; j += 6) {
        var x0 = pts[pts.length - 2], y0 = pts[pts.length - 1];
        for (var n = 1; n <= 12; n++) {
          var t = n / 12, u = 1 - t;
          var x = u * u * u * x0 + 3 * u * u * t * v[j] + 3 * u * t * t * v[j + 2] + t * t * t * v[j + 4];
          var y = u * u * u * y0 + 3 * u * u * t * v[j + 1] + 3 * u * t * t * v[j + 3] + t * t * t * v[j + 5];
          total += Math.hypot(x - pts[pts.length - 2], y - pts[pts.length - 1]);
          pts.push(x, y); lens.push(total);
        }
      }
      out.push({ pts: pts, lens: lens, total: total, drawn: -1, seg: 0 });
    }
    return out;
  }
  function has(ch) { var s = strokes(ch); return !!(s && s.length); }
  function cnv(w) { var c = document.createElement('canvas'); c.width = c.height = w; return c; }

  // the character in the brush font on item.glyph, centred in its canvas
  // (the canvas is 1.6 em, the character's 1 em cell in its middle), and the
  // stroke centre lines fitted to its ink (KanjiVG's square is one em, nudged
  // and stretched within limits per axis), as the name screen does
  function glyph(it) {
    var g = it.glyph.getContext('2d'), em = it.em * it.dpr, off = 0.3 * em;
    g.clearRect(0, 0, it.glyph.width, it.glyph.height);
    g.font = it.weight + ' ' + em + 'px ' + it.font;
    g.fillStyle = it.colour;
    g.textAlign = 'center';
    g.textBaseline = 'alphabetic';
    var m = g.measureText(it.ch);
    var asc = m.fontBoundingBoxAscent, desc = m.fontBoundingBoxDescent;
    if (!(asc + desc > 0)) { asc = em * 0.88; desc = em * 0.12; }
    var base = off + (em - asc - desc) / 2 + asc;
    // in vertical writing the comma and full stop sit at the cell's upper
    // right, not at its lower left as in a line across
    if (it.vertical && /[、。，．]/.test(it.ch)) { base -= 0.62 * em; }
    var cx = off + em / 2 + (it.vertical && /[、。，．]/.test(it.ch) ? 0.62 * em : 0);
    g.fillText(it.ch, cx, base);
    var k = em / 109, minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
    for (var s = 0; s < it.strokes.length; s++) {
      var p = it.strokes[s].pts;
      for (var i = 0; i < p.length; i += 2) {
        if (p[i] < minX) minX = p[i]; if (p[i] > maxX) maxX = p[i];
        if (p[i + 1] < minY) minY = p[i + 1]; if (p[i + 1] > maxY) maxY = p[i + 1];
      }
    }
    function fit(sMin, sMax, iMin, iMax) {
      var a = k;
      if (!(iMax > iMin)) return [a, off];
      var sw = (sMax - sMin) * k, iw = (iMax - iMin) - 0.09 * em;
      if (sw > em * 0.25 && iw > 0) a = k * Math.max(0.8, Math.min(1.25, iw / sw));
      return [a, (iMin + iMax) / 2 - a * (sMin + sMax) / 2];
    }
    var fx = fit(minX, maxX, cx - m.actualBoundingBoxLeft, cx + m.actualBoundingBoxRight);
    var fy = fit(minY, maxY, base - m.actualBoundingBoxAscent, base + m.actualBoundingBoxDescent);
    it.ax = fx[0]; it.bx = fx[1]; it.ay = fy[0]; it.by = fy[1];
  }

  function item(el, ch, o) {
    var st = strokes(ch);
    if (!st || !st.length) return null;
    var W = Math.round(1.6 * o.em * o.dpr);
    el.width = el.height = W;
    var it = { el: el, ch: ch, strokes: st, em: o.em, dpr: o.dpr, font: o.font, weight: o.weight || 400,
               colour: o.colour, glow: o.glow || [], vertical: !!o.vertical, glyph: cnv(W), mask: cnv(W), wet: cnv(W),
               plan: [], start: 0, end: 0, tip: 0, tipX: 0, tipY: 0, settle: 0, done: false };
    glyph(it);
    return it;
  }

  function plan(it, t) {
    it.start = t; it.plan = [];
    for (var s = 0; s < it.strokes.length; s++) {
      var dur = STROKE_BASE + STROKE_PER_LEN * it.strokes[s].total / 109;
      it.plan.push({ start: t, end: t + dur });
      t += dur + PEN_LIFT;
    }
    it.end = it.plan[it.plan.length - 1].end;
    return it.end;
  }
  function scale(items, t0, f) {
    items.forEach(function (it) {
      it.start = t0 + (it.start - t0) * f;
      it.plan.forEach(function (p) { p.start = t0 + (p.start - t0) * f; p.end = t0 + (p.end - t0) * f; });
      it.end = t0 + (it.end - t0) * f;
    });
  }

  // the brush moved along stroke st to distance d, stamping round dabs on the
  // mask (what is uncovered) and on the wet layer
  function brushTo(it, st, d) {
    var from = Math.max(0, st.drawn), mk = it.mask.getContext('2d'), wt = it.wet.getContext('2d');
    var r0 = BRUSH * it.em * it.dpr;
    mk.fillStyle = wt.fillStyle = '#fff';
    for (var at = from; ; at = Math.min(d, at + 0.8)) {
      while (st.seg < st.lens.length - 2 && st.lens[st.seg + 1] < at) st.seg++;
      var i = st.seg, l0 = st.lens[i], l1 = st.lens[i + 1] !== undefined ? st.lens[i + 1] : l0;
      var f = l1 > l0 ? Math.min(1, Math.max(0, (at - l0) / (l1 - l0))) : 0;
      var p = st.pts, j = i * 2;
      var X = p[j] + ((p[j + 2] !== undefined ? p[j + 2] : p[j]) - p[j]) * f;
      var Y = p[j + 1] + ((p[j + 3] !== undefined ? p[j + 3] : p[j + 1]) - p[j + 1]) * f;
      var u = st.total > 0 ? at / st.total : 1;
      var press = Math.max(0, 1 - u / 0.2), lift = Math.max(0, (u - 0.8) / 0.2);
      var r = r0 * (1 + 0.15 * press * press - 0.12 * lift * lift);
      var px = it.ax * X + it.bx, py = it.ay * Y + it.by;
      mk.beginPath(); mk.arc(px, py, r, 0, Math.PI * 2); mk.fill();
      wt.beginPath(); wt.arc(px, py, r, 0, Math.PI * 2); wt.fill();
      it.tipX = px; it.tipY = py;
      if (at >= d) break;
    }
    st.drawn = d;
  }

  function withGlow(v, it, draw) {
    // the page's soft pale glow round the dry ink (as its text-shadow)
    for (var i = 0; i < it.glow.length; i++) {
      var g = it.glow[i];
      v.save(); v.shadowColor = g.c; v.shadowBlur = g.blur * it.dpr; v.shadowOffsetX = (g.x || 0) * it.dpr; v.shadowOffsetY = (g.y || 0) * it.dpr;
      draw(); v.restore();
    }
    draw();
  }

  // one frame of one character: the dry ink so far (with the glow), the wet
  // ink over it, bleeding softly into the paper, and the bead at the tip
  function compose(it, dt) {
    var W = it.el.width;
    if (!tmpInk || tmpInk.width !== W) { tmpInk = cnv(W); tmpWet = cnv(W); }
    var ic = tmpInk.getContext('2d'), wc = tmpWet.getContext('2d'), wt = it.wet.getContext('2d');
    var v = it.el.getContext('2d'), dpr = it.dpr;
    ic.globalCompositeOperation = 'copy'; ic.drawImage(it.mask, 0, 0);
    ic.globalCompositeOperation = 'source-in'; ic.drawImage(it.glyph, 0, 0);
    ic.globalCompositeOperation = 'source-over';
    if (it.settle > 0) { ic.globalAlpha = it.settle; ic.drawImage(it.glyph, 0, 0); ic.globalAlpha = 1; }
    wt.globalCompositeOperation = 'destination-out';
    wt.fillStyle = 'rgba(0, 0, 0, ' + (1 - Math.exp(-dt / WET)) + ')';
    wt.fillRect(0, 0, W, W);
    wt.globalCompositeOperation = 'source-over';
    v.clearRect(0, 0, W, W);
    withGlow(v, it, function () { v.drawImage(tmpInk, 0, 0); });
    if (!it.done) {
      wc.globalCompositeOperation = 'copy'; wc.drawImage(it.wet, 0, 0);
      wc.globalCompositeOperation = 'source-in'; wc.drawImage(it.glyph, 0, 0);
      wc.globalCompositeOperation = 'source-over';
      v.save();
      v.filter = 'blur(' + (1.6 * dpr) + 'px)';
      v.globalAlpha = 0.85;
      v.shadowColor = it.colour; v.shadowBlur = 7 * dpr;
      v.drawImage(tmpWet, 0, 0);
      v.restore();
      if (it.tip > 0.01) {
        var R = 0.11 * it.em * dpr;
        var gr = v.createRadialGradient(it.tipX, it.tipY, 0, it.tipX, it.tipY, R);
        gr.addColorStop(0, hexA(it.colour, 0.35 * it.tip));
        gr.addColorStop(1, hexA(it.colour, 0));
        v.fillStyle = gr;
        v.fillRect(it.tipX - R, it.tipY - R, R * 2, R * 2);
      }
    }
  }
  function hexA(hex, a) {
    var h = String(hex).replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a.toFixed(3) + ')';
  }

  function play(items, onDone) {
    stop();
    var t0 = performance.now(), last = t0;
    function frame(now) {
      raf = 0;
      var T = (now - t0) / 1000, dt = Math.min(0.1, (now - last) / 1000), busy = false;
      last = now;
      for (var n = 0; n < items.length; n++) {
        var it = items[n];
        if (it.done || !it.el.isConnected) continue;
        busy = true;
        if (T < it.start) continue;
        var drawing = false;
        for (var s = 0; s < it.strokes.length; s++) {
          var st = it.strokes[s], pl = it.plan[s];
          if (T < pl.start || st.drawn >= st.total) continue;
          var q = Math.min(1, (T - pl.start) / (pl.end - pl.start));
          var e = 0.35 * q + 0.65 * (0.5 - 0.5 * Math.cos(Math.PI * q));
          brushTo(it, st, q >= 1 ? st.total : st.total * e);
          if (q < 1) drawing = true;
        }
        it.tip = drawing ? 1 : it.tip * Math.exp(-dt / 0.12);
        it.settle = Math.max(0, Math.min(1, (T - it.end) / SETTLE));
        if (T > it.end + SETTLE + WET * 4) it.done = true;
        compose(it, dt);
      }
      if (busy) raf = requestAnimationFrame(frame);
      else if (onDone) onDone();
    }
    raf = requestAnimationFrame(frame);
  }
  function finish(items) {
    items.forEach(function (it) {
      it.done = true; it.settle = 1;
      it.strokes.forEach(function (st) { st.drawn = st.total; });
      it.wet.getContext('2d').clearRect(0, 0, it.wet.width, it.wet.height);
      compose(it, 1);
    });
  }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; }

  return { ready: ready, has: has, item: item, plan: plan, scale: scale, play: play, finish: finish, stop: stop,
           // seconds after a character's last stroke until its ink has fully dried
           dryAfter: SETTLE + WET * 4,
           redrawGlyph: glyph };
})();
