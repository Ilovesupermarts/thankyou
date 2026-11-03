/* ============================================================
   inkreveal.js — the scene revealed by wet ink washes, one part after
   another (Fuji, the ridges, the lake, the headland, the torii...).

   Each part of the scene gets its own sheet of "wet paper": drops of
   water are laid on it (where that part stands, in the order a painter
   would put them down), the water spreads out over the paper and dries.
   Wherever the paper has been wet, that part of the picture shows. While
   it is still wet it is darkened by the ink (a darker rim where the wet
   edge is), and the colour comes through as it dries. When a part's time
   is up, whatever its washes did not reach fills in softly and the part
   is drawn normally again (no mask, no extra cost).

   The ideas come from Inkwash by Jonathan Whitaker
   (https://github.com/johnowhitaker/inkwash, MIT licence, copyright 2026
   Jonathan Whitaker): water that is carried and spreads only over wet
   paper and evaporates; ink that can move only where the paper is wet;
   the darker edge of a wet blot; paper grain. Inkwash runs a full fluid
   simulation on the graphics chip; here it is a much smaller version on
   the main processor (a grid of cells a few pixels across), so it needs
   no graphics context of its own. The water spreads from wetter cells to
   drier ones, but a dry cell only takes water once its wetter neighbour
   is wetter than that cell's paper fibre allows ("pinning"), which is
   what gives the fronts their ragged, crisp watercolour edges.

   Use:
     InkReveal.setup(W, H)            CSS size of the screen (again on resize)
     InkReveal.plan(parts)            the parts, in order (see below)
     InkReveal.play(t)                start (t in seconds)
     InkReveal.update(t, dt)          once a frame
     InkReveal.state(ids)             0 not started, 1 appearing, 2 done (for one id or a list)
     InkReveal.alpha(id)              0..1 for a part that fades instead of washing
     InkReveal.composite(dst, layer, ids, pr)
                                      cut a layer (full-size canvas, pr device px a CSS px)
                                      to the parts' wet paper, ink it, draw it onto dst
     InkReveal.maskInPlace(c, ids, pr, oy)
                                      the same on a canvas of its own (oy: its top, CSS px)
     InkReveal.look                   the settings (see LOOK)
     InkReveal.stats()                a line for the panel
   A part: { id, kind: 'wash' | 'fade', at, dur, washes: [{ seeds, region, fall }] }
     seeds: [{ x, y, r, at }] in CSS px and seconds after the part starts
     region: optional function (x, y) → 0..1: where its water may go
   ============================================================ */
(function () {
'use strict';

var LOOK = {
  speed: 1,          // the whole reveal faster or slower
  drop: 1,           // the drops' size
  water: 1,          // how much water each drop carries
  spread: 4,         // how fast the water spreads (× 60 spreading steps a second)
  ragged: 1,         // how ragged the wet edges are
  fall: 0.06,        // how much the water runs downward
  dry: 1.4,          // drying time (s)
  ink: 0.55,         // how dark the ink is while the paper is wet
  rim: 0.6,          // the darker rim at the wet edge
  grain: 0.5,        // paper grain in the ink
  finish: 0.9,       // the last soft fill of a part (s)
  cell: 8,           // the wet paper's cells (CSS px): smaller = finer edges, more work
  inkColour: '#2A2420'
};
var LAY = 0.35;      // a drop is laid over this long (s)

var W = 0, H = 0, gw = 0, gh = 0, cs = 6, fib = null, parts = [], byId = {}, t0 = -1, tNow = 0, on = false;
var simMs = 0, compMs = 0, scratch = null;

function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function smooth(e0, e1, x) { var t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); }
function hex(h) { var n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function canvas(w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, w); c.height = Math.max(1, h); return { cnv: c, c: c.getContext('2d') }; }

/* The paper's fibres: value noise in two octaves, one value a cell (0..1). */
function makeFibres() {
  var r = rng(7351), n = gw * gh, f = new Float32Array(n);
  function lattice(step) {
    var lw = Math.ceil(gw / step) + 2, lh = Math.ceil(gh / step) + 2, L = new Float32Array(lw * lh);
    for (var i = 0; i < L.length; i++) L[i] = r();
    return function (x, y) {
      var fx = x / step, fy = y / step, ix = Math.floor(fx), iy = Math.floor(fy), u = fx - ix, v = fy - iy;
      u = u * u * (3 - 2 * u); v = v * v * (3 - 2 * v);
      var a = L[iy * lw + ix], b = L[iy * lw + ix + 1], c = L[(iy + 1) * lw + ix], d = L[(iy + 1) * lw + ix + 1];
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    };
  }
  var big = lattice(5), mid = lattice(2.2);
  for (var y = 0; y < gh; y++) for (var x = 0; x < gw; x++) f[y * gw + x] = clamp(big(x, y) * 0.6 + mid(x, y) * 0.3 + r() * 0.1, 0, 1);
  return f;
}

function setup(w, h) {
  W = w; H = h; cs = Math.max(2, LOOK.cell);
  gw = Math.ceil(W / cs) + 2; gh = Math.ceil(H / cs) + 2;
  fib = makeFibres();
  scratch = canvas(gw, gh);
  if (parts.length) plan(parts.map(function (P) { return P.def; }));
}

/* A wash's own sheet of wet paper. */
function makeWash(def) {
  var n = gw * gh, Wsh = { seeds: (def.seeds || []).slice(), fall: def.fall, w: new Float32Array(n), nw: new Float32Array(n),
                          r: new Float32Array(n), reg: null, box: null, ever: null };
  if (def.region) {
    Wsh.reg = new Float32Array(n);
    for (var y = 0; y < gh; y++) for (var x = 0; x < gw; x++) Wsh.reg[y * gw + x] = clamp(def.region((x + 0.5) * cs, (y + 0.5) * cs), 0, 1);
  }
  return Wsh;
}
function plan(list) {
  parts = []; byId = {};
  list.forEach(function (d) {
    var P = { def: d, id: d.id, kind: d.kind || 'wash', at: d.at || 0, dur: d.dur || 1, off: !!d.off,
              washes: [], mask: null, tint: null, img: null, timg: null, live: false, Rc: null, Wc: null };
    if (P.kind === 'wash' && gw) {
      P.washes = (d.washes || []).map(makeWash);
      P.mask = canvas(gw, gh); P.tint = canvas(gw, gh);
      P.img = P.mask.c.createImageData(gw, gh); P.timg = P.tint.c.createImageData(gw, gh);
      P.Rc = new Float32Array(gw * gh); P.Wc = new Float32Array(gw * gh);
    }
    parts.push(P); byId[P.id] = P;
  });
}
function play(t) {
  t0 = t; tNow = t; on = true;
  parts.forEach(function (P) {
    P.washes.forEach(function (Wsh) { Wsh.w.fill(0); Wsh.r.fill(0); Wsh.box = null; Wsh.ever = null; });
    if (P.img) { P.img.data.fill(0); P.timg.data.fill(0); P.Rc.fill(0); P.Wc.fill(0); P.mask.c.clearRect(0, 0, gw, gh); P.tint.c.clearRect(0, 0, gw, gh); }
    P.live = false;
  });
}
function stop() { on = false; }
/* Seconds since the start, on the reveal's own clock. */
function clock() { return on ? (tNow - t0) * LOOK.speed : 1e9; }
function partState(P) {
  if (!P || P.off) return 2;
  var tl = clock() - P.at;
  if (tl < 0) return 0;
  if (tl < P.dur + (P.kind === 'wash' ? LOOK.finish : 0)) return 1;
  return 2;
}
function state(ids) {
  if (typeof ids === 'string') return partState(byId[ids]);
  var any = false, all = true;
  for (var i = 0; i < ids.length; i++) { var s = partState(byId[ids[i]]); if (s > 0) any = true; if (s < 2) all = false; }
  return all ? 2 : any ? 1 : 0;
}
function alpha(id) {
  var P = byId[id];
  if (!P || P.off || !on) return 1;
  return smooth(0, 1, (clock() - P.at) / Math.max(0.05, P.dur));
}
function running() { return on && parts.some(function (P) { return partState(P) < 2; }); }

/* ---------- the water ---------- */
function deposit(Wsh, S, dt, rate) {
  var R = S.r * LOOK.drop, x0 = Math.max(1, Math.floor((S.x - R * 1.3) / cs)), x1 = Math.min(gw - 2, Math.ceil((S.x + R * 1.3) / cs));
  var y0 = Math.max(1, Math.floor((S.y - R * 1.3) / cs)), y1 = Math.min(gh - 2, Math.ceil((S.y + R * 1.3) / cs));
  if (x1 < x0 || y1 < y0) return;
  var w = Wsh.w, amt = LOOK.water * rate * dt / LAY;
  for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++) {
    var i = y * gw + x, dx = (x + 0.5) * cs - S.x, dy = (y + 0.5) * cs - S.y;
    var re = R * (0.7 + 0.6 * fib[i]), q = 1 - (dx * dx + dy * dy) / (re * re);   // a ragged round blot
    if (q <= 0) continue;
    if (Wsh.reg && Wsh.reg[i] < 0.5) continue;
    w[i] += amt * q;
  }
  grow(Wsh, x0, y0, x1, y1);
}
function grow(Wsh, x0, y0, x1, y1) {
  var b = Wsh.box;
  if (!b) Wsh.box = { x0: x0, y0: y0, x1: x1, y1: y1 };
  else { b.x0 = Math.min(b.x0, x0); b.y0 = Math.min(b.y0, y0); b.x1 = Math.max(b.x1, x1); b.y1 = Math.max(b.y1, y1); }
}
/* One spreading step over the wet part of the sheet (and a cell round it). */
function spreadStep(Wsh) {
  var b = Wsh.box; if (!b) return;
  var x0 = Math.max(1, b.x0 - 1), x1 = Math.min(gw - 2, b.x1 + 1), y0 = Math.max(1, b.y0 - 1), y1 = Math.min(gh - 2, b.y1 + 1);
  var w = Wsh.w, nw = Wsh.nw, reg = Wsh.reg, D = 0.22, eps = 0.004, pinK = LOOK.ragged;
  var fall = (Wsh.fall === undefined ? 1 : Wsh.fall) * LOOK.fall * 0.5;
  var nx0 = 1e9, ny0 = 1e9, nx1 = -1, ny1 = -1;
  // a dry cell takes water only once its wetter neighbour is wetter than the cell's fibre allows
  function flow(i, j, wi) {
    var wj = w[j];
    if (wi < eps) { if (wj < eps) return 0; var fj = fib[i]; if (wj < pinK * (0.02 + 0.2 * fj * fj)) return 0; }
    else if (wj < eps) { var fk = fib[j]; if (wi < pinK * (0.02 + 0.2 * fk * fk)) return 0; }
    var g = D * (0.55 + 0.9 * fib[i] * fib[j]);
    if (reg) g *= reg[i] < reg[j] ? reg[i] : reg[j];
    return g * (wj - wi);
  }
  for (var y = y0; y <= y1; y++) {
    var row = y * gw;
    for (var x = x0; x <= x1; x++) {
      var i = row + x, wi = w[i];
      var acc = flow(i, i - 1, wi) + flow(i, i + 1, wi) + flow(i, i - gw, wi) + flow(i, i + gw, wi);
      // running down the paper a little
      if (fall > 0) {
        var up = w[i - gw], dn = w[i + gw];
        if (up > eps && up > wi) acc += fall * (up - wi) * (reg ? Math.min(reg[i], reg[i - gw]) : 1);
        if (wi > eps && wi > dn) acc -= fall * (wi - dn) * (reg ? Math.min(reg[i], reg[i + gw]) : 1);
      }
      var v = wi + acc;
      v = v > 0 ? v : 0;
      nw[i] = v;
      if (v > eps) { if (x < nx0) nx0 = x; if (x > nx1) nx1 = x; if (y < ny0) ny0 = y; if (y > ny1) ny1 = y; }
    }
  }
  for (y = y0; y <= y1; y++) { var r0 = y * gw; for (x = x0; x <= x1; x++) w[r0 + x] = nw[r0 + x]; }
  Wsh.box = nx1 < 0 ? null : { x0: nx0, y0: ny0, x1: nx1, y1: ny1 };
}

/* ---------- a part's mask and ink, from its sheets ----------
   The sheets' "has been wet" is softened over the cells round it, so the edge is a soft
   curve rather than steps; the ink is darkest along the wet edge (inkwash's edge darkening). */
function paint(P, fin) {
  var ws = P.washes, n = gw * gh, Rc = P.Rc, Wc = P.Wc, k, i, x, y;
  var finA = smooth(0, 1, fin), keep = 1 - finA, ink = hex(LOOK.inkColour);
  // the cells that can have changed: everything once the last fill starts, else round the wet boxes
  var bx0 = gw, by0 = gh, bx1 = -1, by1 = -1;
  for (k = 0; k < ws.length; k++) { var b = ws[k].ever; if (b) { bx0 = Math.min(bx0, b.x0); by0 = Math.min(by0, b.y0); bx1 = Math.max(bx1, b.x1); by1 = Math.max(by1, b.y1); } }
  if (finA > 0) { bx0 = 0; by0 = 0; bx1 = gw - 1; by1 = gh - 1; }
  if (bx1 < 0) return;
  bx0 = Math.max(0, bx0 - 2); by0 = Math.max(0, by0 - 2); bx1 = Math.min(gw - 1, bx1 + 2); by1 = Math.min(gh - 1, by1 + 2);
  for (y = by0; y <= by1; y++) for (x = bx0; x <= bx1; x++) {
    i = y * gw + x; var r = 0, w = 0;
    for (k = 0; k < ws.length; k++) { var Rk = ws[k].r[i], Wk = ws[k].w[i]; if (Rk > r) r = Rk; if (Wk > w) w = Wk; }
    Rc[i] = r; Wc[i] = w;
  }
  var m = P.img.data, td = P.timg.data;
  for (y = by0; y <= by1; y++) for (x = bx0; x <= bx1; x++) {
    i = y * gw + x;
    var s = Rc[i] * 4, cnt = 4;
    if (x > 0) { s += Rc[i - 1] * 2; cnt += 2; } if (x < gw - 1) { s += Rc[i + 1] * 2; cnt += 2; }
    if (y > 0) { s += Rc[i - gw] * 2; cnt += 2; } if (y < gh - 1) { s += Rc[i + gw] * 2; cnt += 2; }
    if (x > 0 && y > 0) { s += Rc[i - gw - 1]; cnt++; } if (x < gw - 1 && y > 0) { s += Rc[i - gw + 1]; cnt++; }
    if (x > 0 && y < gh - 1) { s += Rc[i + gw - 1]; cnt++; } if (x < gw - 1 && y < gh - 1) { s += Rc[i + gw + 1]; cnt++; }
    var B = s / cnt, a = smooth(0.15, 0.85, B);
    if (finA > a) a = finA;
    var o = i * 4;
    m[o] = m[o + 1] = m[o + 2] = 255; m[o + 3] = a * 255;
    var t = 0, w2 = Wc[i];
    if (keep > 0 && (w2 > 0.002 || B > 0)) {
      var wet = clamp(w2 * 6, 0, 1), g = 1 - LOOK.grain * (0.5 - fib[i]) * 1.4;
      var rim = clamp(Rc[i] * (1 - B) * 3, 0, 1) * clamp(w2 * 20, 0, 1);
      t = (LOOK.ink * wet * g + LOOK.rim * rim) * keep;
    }
    td[o] = ink[0]; td[o + 1] = ink[1]; td[o + 2] = ink[2]; td[o + 3] = clamp(t, 0, 1) * 255;
  }
  P.mask.c.putImageData(P.img, 0, 0, bx0, by0, bx1 - bx0 + 1, by1 - by0 + 1);
  P.tint.c.putImageData(P.timg, 0, 0, bx0, by0, bx1 - bx0 + 1, by1 - by0 + 1);
}

function update(t, dt) {
  tNow = t;
  if (!on || !gw) return;
  var s0 = performance.now(), decay = Math.exp(-dt / Math.max(0.1, LOOK.dry));
  var steps = clamp(Math.round(LOOK.spread * 60 * dt), 1, 8);      // spreading steps a second, not a frame (at most 8 a frame)
  for (var p = 0; p < parts.length; p++) {
    var P = parts[p];
    if (P.kind !== 'wash' || P.off) continue;
    var st = partState(P);
    P.live = st === 1;
    if (st !== 1) continue;
    var tl = clock() - P.at, sdt = dt * LOOK.speed;
    for (var q = 0; q < P.washes.length; q++) {
      var Wsh = P.washes[q];
      for (var s = 0; s < Wsh.seeds.length; s++) {
        var S = Wsh.seeds[s];
        if (tl >= S.at && tl - sdt < S.at + LAY) deposit(Wsh, S, Math.min(sdt, LAY), 1);
      }
      for (var k = 0; k < steps; k++) spreadStep(Wsh);
      var b = Wsh.box;
      if (b) {
        var w = Wsh.w, r = Wsh.r;
        for (var y = b.y0; y <= b.y1; y++) for (var x = b.x0; x <= b.x1; x++) {
          var i = y * gw + x;
          if (w[i] > 0.004) { var v = clamp(w[i] / 0.03, 0, 1); if (v > r[i]) r[i] = v; }
          w[i] *= decay;
        }
        var e = Wsh.ever;
        if (!e) Wsh.ever = { x0: b.x0, y0: b.y0, x1: b.x1, y1: b.y1 };
        else { e.x0 = Math.min(e.x0, b.x0); e.y0 = Math.min(e.y0, b.y0); e.x1 = Math.max(e.x1, b.x1); e.y1 = Math.max(e.y1, b.y1); }
      }
    }
    paint(P, (tl - P.dur) / Math.max(0.05, LOOK.finish));
  }
  simMs = simMs ? simMs + (performance.now() - s0 - simMs) * 0.1 : performance.now() - s0;
}

/* Cut a canvas to its parts' wet paper and ink it: a part that is done shows whole, one
   not started not at all, one appearing where its paper has been wet. */
function cut(c, ids, pr, oy) {
  var sts = ids.map(function (id) { var P = byId[id]; return P && P.kind === 'wash' ? partState(P) : 2; });
  if (sts.every(function (s) { return s === 2; })) return;
  var sw = gw * cs * pr, sh = gh * cs * pr, dy = -(oy || 0) * pr, M, live = [];
  ids.forEach(function (id, k) { if (sts[k] === 1) live.push(byId[id]); });
  if (ids.length === 1) M = live.length ? live[0].mask.cnv : null;
  else {
    var s = scratch.c;
    s.setTransform(1, 0, 0, 1, 0, 0);
    s.globalCompositeOperation = 'source-over'; s.clearRect(0, 0, gw, gh);
    s.globalCompositeOperation = 'lighter';
    ids.forEach(function (id, k) {
      if (sts[k] === 2) { s.fillStyle = '#fff'; s.fillRect(0, 0, gw, gh); }
      else if (sts[k] === 1) s.drawImage(byId[id].mask.cnv, 0, 0);
    });
    s.globalCompositeOperation = 'source-over';
    M = scratch.cnv;
  }
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalAlpha = 1;
  c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
  c.globalCompositeOperation = 'destination-in';
  if (M) c.drawImage(M, 0, 0, gw, gh, 0, dy, sw, sh);
  else c.clearRect(0, 0, c.canvas.width, c.canvas.height);
  c.globalCompositeOperation = 'source-atop';
  live.forEach(function (P) { c.drawImage(P.tint.cnv, 0, 0, gw, gh, 0, dy, sw, sh); });
  c.restore();
}
/* A layer (the size of dst) cut to its parts' wet paper and inked, then drawn onto dst.
   (The caller leaves out the drawing of parts not started.) A fading part is drawn faded. */
function composite(dst, layer, ids, pr) {
  var c0 = performance.now();
  if (typeof ids === 'string') ids = [ids];
  var fade = ids.length === 1 && byId[ids[0]] && byId[ids[0]].kind === 'fade';
  if (!fade) cut(layer.getContext('2d'), ids, pr, 0);
  dst.save();
  dst.setTransform(1, 0, 0, 1, 0, 0);
  dst.globalCompositeOperation = 'source-over';
  dst.globalAlpha = fade ? alpha(ids[0]) : 1;
  dst.drawImage(layer, 0, 0);
  dst.restore();
  compMs = compMs ? compMs + (performance.now() - c0 - compMs) * 0.1 : performance.now() - c0;
}
function maskInPlace(c, ids, pr, oy) { cut(c, typeof ids === 'string' ? [ids] : ids, pr, oy); }
function stats() {
  var live = parts.filter(function (P) { return partState(P) === 1; }).map(function (P) { return P.id; });
  return 'Wet paper ' + gw + '×' + gh + ' cells · water ' + simMs.toFixed(1) + ' ms, masks ' + compMs.toFixed(1) + ' ms a frame' +
         (live.length ? ' · appearing: ' + live.join(', ') : on ? ' · all shown' : '');
}

window.InkReveal = { look: LOOK, setup: setup, plan: plan, play: play, stop: stop, update: update, state: state, alpha: alpha,
                     composite: composite, maskInPlace: maskInPlace, running: running, clock: clock, stats: stats };
})();
