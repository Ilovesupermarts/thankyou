/* ============================================================
   WINTERSCENE — the parts of the new winter scene (the user's reference
   picture: a shrine in the snow by a steaming pond, Fuji on the right)
   that are not buildings or creatures (those are in winterpieces.js).
   Everything is drawn in code.

     hill(c, o)         the hill of snowy firs on the left, fading into the mist
     mistBand(c, ...)   a soft band of mist
     ropes(c, o, front) the straw ropes of 雪吊り round a fir (behind or in front)
     path(c, o)         the trodden path and its stepping stones
     banks(c, o)        the banks of the pond: earth under a lip of snow

   o (CSS px; c set up for CSS px) may hold the light: sunDir [x, y, z],
   sunColour, skyColour ([r, g, b] 0 … 1.5), ambient, haze (0 … 1),
   hazeColour [r, g, b], seed
   ============================================================ */
var WinterScene = (function () {
'use strict';

var PI = Math.PI, TAU = PI * 2;
function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
function d(o, k, v) { return o[k] === undefined ? v : o[k]; }
function rng(seed) {
  var a = (seed | 0) >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    var t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function rgb(c, a) {
  return 'rgba(' + Math.round(clamp(c[0], 0, 255)) + ',' + Math.round(clamp(c[1], 0, 255)) + ',' +
         Math.round(clamp(c[2], 0, 255)) + ',' + (a === undefined ? 1 : clamp(a, 0, 1).toFixed(3)) + ')';
}
function mix(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }
function scale(a, k) { return [a[0] * k, a[1] * k, a[2] * k]; }

/* The light: a colour lit from the direction n (x right, y up, z toward you), faded into the haze. */
function shader(o) {
  var L = d(o, 'sunDir', [-0.8, 0.4, 0.3]), sun = d(o, 'sunColour', [1, 0.97, 0.92]), sky = d(o, 'skyColour', [0.7, 0.78, 0.92]);
  var amb = d(o, 'ambient', 0.9), haze = d(o, 'haze', 0), hc = d(o, 'hazeColour', [246, 238, 232]);
  var f = function (base, nx, ny, nz, occ, extraHaze) {
    var l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    var k = occ === undefined ? 1 : occ;
    var dl = Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]) * k;
    var sk = (0.6 + 0.4 * ny) * amb * lerp(0.7, 1, k);
    var col = [base[0] * (sun[0] * dl + sky[0] * sk), base[1] * (sun[1] * dl + sky[1] * sk), base[2] * (sun[2] * dl + sky[2] * sk)];
    return mix(col, hc, clamp(haze + (extraHaze || 0), 0, 1));
  };
  f.side = L[0] < 0 ? -1 : 1;           // the side the light comes from
  var w0 = f([200, 200, 200], 0, 1, 0.5);
  f.bright = clamp((w0[0] + w0[1] + w0[2]) / 600, 0.25, 1);   // how bright the light is (dim at night)
  f.haze = function (col, extra) { return mix(col, hc, clamp(haze + (extra || 0), 0, 1)); };
  return f;
}
function snowCols(S, o) {
  var sn = (o.colours && o.colours.snow) || [250, 250, 252];
  return { snowBase: sn, side0: S.side, top: S(sn, S.side * 0.35, 1, 0.45), side: S(sn, S.side * 0.6, 0.3, 0.8), shade: S(sn, -S.side * 0.5, 0.2, 0.8, 0.1) };
}

/* ---------------------------------------------------------------
   A fir of the hill forest, as the picture paints them: a narrow, dark
   blue-green spire, its branches drooping in ragged tiers, the side to
   the sun a little lighter, and the snow lying on it in short white
   dabs along the tops of the branches (more near the trunk), each with
   a little blue shade under it.
   --------------------------------------------------------------- */
function smallFir(c, x, yb, h, S, r, needle, sc, extraHaze) {
  var w = h * lerp(0.24, 0.3, r()), tiers = 10 + Math.floor(r() * 3), i, j, sd = S.side;
  var dark = S(needle, -sd * 0.6, 0, 0.9, 0.3, extraHaze), mid = S(needle, 0, 0.2, 1, 0.65, extraHaze),
      lite = S(scale(needle, 1.15), sd * 0.9, 0.3, 0.5, 1, extraHaze);
  var sTop = S.haze(sc.top, extraHaze), sSh = S.haze(sc.shade, extraHaze);
  c.fillStyle = rgb(S([66, 52, 46], 0, 0, 1, 0.5, extraHaze));
  c.fillRect(x - h * 0.016, yb - h * 0.08, h * 0.032, h * 0.08);
  // the silhouette: each tier's branches drooping to ragged tips
  var L = [], R = [], T = [];
  for (i = 0; i < tiers; i++) {
    var k = (i + 1) / tiers, ty = yb - h + h * 0.94 * Math.pow(k, 0.95);
    var tw = w * Math.pow(k, 0.85) * lerp(0.85, 1.15, r());
    T.push({ y: ty, w: tw });
  }
  c.beginPath();
  c.moveTo(x, yb - h);
  for (i = 0; i < tiers; i++) {                                  // down the right side
    var A = T[i], up = i ? T[i - 1].y : yb - h, tip = A.y + (A.y - up) * 0.15;
    c.quadraticCurveTo(x + A.w * 0.55, lerp(up, A.y, 0.55), x + A.w, tip);
    c.lineTo(x + A.w * 0.82, A.y - (A.y - up) * 0.12);
    c.lineTo(x + A.w * 0.9, A.y + (A.y - up) * 0.05);
    if (i < tiers - 1) c.lineTo(x + A.w * lerp(0.45, 0.6, r()), A.y - (A.y - up) * 0.05);
  }
  c.lineTo(x, yb - h * 0.03);
  for (i = tiers - 1; i >= 0; i--) {                             // and up the left
    var B = T[i], up2 = i ? T[i - 1].y : yb - h, tip2 = B.y + (B.y - up2) * 0.15;
    if (i < tiers - 1) c.lineTo(x - B.w * lerp(0.45, 0.6, r()), B.y - (B.y - up2) * 0.05);
    c.lineTo(x - B.w * 0.9, B.y + (B.y - up2) * 0.05);
    c.lineTo(x - B.w * 0.82, B.y - (B.y - up2) * 0.12);
    c.lineTo(x - B.w, tip2);
    c.quadraticCurveTo(x - B.w * 0.55, lerp(up2, B.y, 0.55), x, up2 + (i ? 0 : 0));
  }
  c.closePath();
  var g = c.createLinearGradient(x - w * sd, 0, x + w * sd, 0);
  g.addColorStop(0, rgb(dark)); g.addColorStop(0.5, rgb(mid)); g.addColorStop(1, rgb(lite));
  c.fillStyle = g; c.fill();
  // darker under each tier (the branches above shade the ones below)
  c.save(); c.clip();
  c.fillStyle = rgb(scale(dark, 0.8), 0.45);
  for (i = 0; i < tiers - 1; i++) {
    var D = T[i];
    c.beginPath(); c.ellipse(x, D.y + (T[i + 1].y - D.y) * 0.25, D.w * 0.75, (T[i + 1].y - D.y) * 0.22, 0, 0, TAU); c.fill();
  }
  c.restore();
  // the snow: short dabs along the tops of the branches
  var th0 = h / tiers;
  for (i = 0; i < tiers; i++) {
    var E = T[i], upE = i ? T[i - 1].y : yb - h, n = 3 + Math.floor(E.w / (th0 * 0.55));
    for (j = 0; j < n; j++) {
      var side = j % 2 ? 1 : -1, u = lerp(0.1, 0.85, r());
      if (r() < 0.12) continue;
      var dx = side * u * E.w, dy = lerp(upE, E.y, 0.35 + u * 0.55) - th0 * 0.05;
      var len = th0 * lerp(0.35, 0.8, r()) * (1 - u * 0.4), thk = th0 * lerp(0.14, 0.22, r());
      var tilt = side * lerp(0.15, 0.4, u);
      c.fillStyle = rgb(sSh, 0.7);
      c.beginPath(); c.ellipse(x + dx, dy + thk * 0.6, len * 0.5, thk * 0.6, tilt, 0, TAU); c.fill();
      c.fillStyle = rgb(side === sd ? sTop : mix(sTop, sSh, 0.45));
      c.beginPath(); c.ellipse(x + dx, dy, len * 0.5, thk * 0.55, tilt, 0, TAU); c.fill();
    }
  }
  // a cap of snow on the top
  c.fillStyle = rgb(sTop);
  c.beginPath(); c.ellipse(x, yb - h + th0 * 0.35, w * 0.08, th0 * 0.2, 0, 0, TAU); c.fill();
}

/* ---------------------------------------------------------------
   THE HILL — o: x0, x1 (its span), base (the foot, y), peakX, peakY,
   spanL, spanR (how wide it falls away either side), part ('back' |
   'front' | 'all'), split (0 … 1: the depth between them), trees,
   treeSize (px, the nearest), mist, colours { needle, snow }, rows: a
   list of extra rows [x0, x1, y, size, count, haze] (the firs at the
   foot; they count as 'front')
   --------------------------------------------------------------- */
function hillTop(o, x) {
  var dx = x - o.peakX, sg = dx < 0 ? o.spanL : o.spanR;
  var b = Math.exp(-dx * dx / (sg * sg));
  return o.base - (o.base - o.peakY) * b;
}
function hill(c, o) {
  var S = shader(o), sc = snowCols(S, o), r = rng(d(o, 'seed', 5)), part = d(o, 'part', 'all');
  var needle = (o.colours && o.colours.needle) || [50, 70, 62], i, mist = d(o, 'mist', 1);
  if (part !== 'front') {
    // the hillside: snow, faded into the mist, a little bluer away from the sun
    c.beginPath();
    c.moveTo(o.x0, o.base + 10);
    for (var x = o.x0; x <= o.x1; x += 4) c.lineTo(x, hillTop(o, x));
    c.lineTo(o.x1, o.base + 10); c.closePath();
    var g = c.createLinearGradient(o.peakX - o.spanL, 0, o.peakX + o.spanR, 0);
    g.addColorStop(0, rgb(S.haze(sc.shade, 0.5))); g.addColorStop(0.45, rgb(S.haze(sc.top, 0.45)));
    g.addColorStop(1, rgb(S.haze(sc.side, 0.55)));
    c.fillStyle = g; c.fill();
  }
  // the trees on the hill: placed once (same seed), each with its depth 0 (far, high) … 1 (near, low)
  var N = d(o, 'trees', 160), list = [];
  for (i = 0; i < N; i++) {
    var tx = lerp(o.x0 - 20, o.x1, r()), top = hillTop(o, tx), dep = Math.pow(r(), 1.1);
    var ty = lerp(top + 4, o.base, dep);
    // a bare snowy slope down the middle of the hill, as in the picture
    var slope = Math.exp(-Math.pow((tx - o.peakX - (ty - o.peakY) * 0.7) / (o.spanR * 0.2), 2));
    if (dep < 0.6 && r() < slope * 0.6) continue;
    var endK = clamp((o.x1 - tx) / ((o.x1 - o.x0) * 0.3), 0, 1);
    if (r() > endK) continue;
    list.push({ x: tx, y: ty, dep: (ty - o.peakY) / (o.base - o.peakY), s: r(), seed: Math.floor(r() * 1e9) });
  }
  (o.rows || []).forEach(function (R) {
    for (var q = 0; q < R[4]; q++) {
      var rx = lerp(R[0], R[1], (q + r() * 0.8) / R[4]);
      list.push({ x: rx, y: R[2] + (r() - 0.5) * R[3] * 0.25, dep: 1, row: R[3], s: r(), seed: Math.floor(r() * 1e9), haze: R[5] || 0 });
    }
  });
  list.sort(function (a, b) { return a.y - b.y; });
  var split = d(o, 'split', 0.62);
  for (i = 0; i < list.length; i++) {
    var T = list[i];
    if (part === 'back' && T.dep > split) continue;
    if (part === 'front' && T.dep <= split) continue;
    var h = T.row ? T.row * lerp(0.75, 1.15, T.s) : o.treeSize * lerp(0.35, 1, Math.pow(T.dep, 1.2)) * lerp(0.75, 1.2, T.s);
    var hz = T.row ? T.haze : clamp((0.3 + (1 - T.dep) * 0.4) * mist, 0, 0.92);
    smallFir(c, T.x, T.y, h, S, rng(T.seed), needle, sc, hz);
  }
}

/* A soft band of mist: an ellipse spanning x0 … x1, y0 … y1, densest along its middle. */
function mistBand(c, x0, x1, y0, y1, col, a) {
  c.save();
  c.translate((x0 + x1) / 2, (y0 + y1) / 2); c.scale((x1 - x0) / 2, (y1 - y0) / 2);
  var g = c.createRadialGradient(0, 0, 0, 0, 0, 1);
  g.addColorStop(0, rgb(col, a)); g.addColorStop(0.5, rgb(col, a * 0.75)); g.addColorStop(1, rgb(col, 0));
  c.fillStyle = g; c.fillRect(-1, -1, 2, 2);
  c.restore();
}

/* ---------------------------------------------------------------
   THE ROPES of 雪吊り (yukitsuri), as in the picture: a pole up through
   the tree, a topknot of straw, golden ropes fanned out from its top to
   the ends of the lowest branches. o: x, top (the pole's top), y (the
   foot), spread (half the width at the bottom), drop (how far down the
   ropes reach, from the top), n (ropes); front: true for the ropes in
   front of the tree, false for the pole and the ropes behind it.
   --------------------------------------------------------------- */
function ropes(c, o, front) {
  var S = shader(o), n = d(o, 'n', 16), straw = [222, 178, 92], i;
  var lw = Math.max(0.7, (o.y - o.top) * 0.005);
  c.lineCap = 'round';
  if (!front) {                                                   // the pole and its topknot
    var pg = c.createLinearGradient(o.x - lw * 2, 0, o.x + lw * 2, 0);
    pg.addColorStop(0, rgb(S([170, 140, 90], -1, 0, 0.6, 0.7))); pg.addColorStop(1, rgb(S([200, 170, 110], 1, 0, 0.6)));
    c.fillStyle = pg; c.fillRect(o.x - lw * 1.3, o.top, lw * 2.6, o.y - o.top);
    c.fillStyle = rgb(S(straw, S.side * 0.5, 0.6, 0.6));
    c.beginPath(); c.ellipse(o.x, o.top - lw * 2.5, lw * 2.2, lw * 4, 0, 0, TAU); c.fill();
    c.strokeStyle = rgb(S(scale(straw, 0.7), 0, 0, 1)); c.lineWidth = lw * 0.6;
    c.beginPath(); c.moveTo(o.x - lw * 2.2, o.top - lw * 1.5); c.lineTo(o.x + lw * 2.2, o.top - lw * 1.5); c.stroke();
  }
  for (i = 0; i < n; i++) {
    var a = (i + 0.5) / n * TAU, sx = Math.cos(a), sz = Math.sin(a);   // sz > 0: in front
    if ((sz > 0) !== front) continue;
    var ex = o.x + sx * o.spread, ey = o.top + o.drop * (1 + sz * 0.06);
    var col = S(straw, sx * S.side * 0.8 + 0.2, 0.3, 0.6 + sz * 0.4, front ? 1 : 0.55);
    c.strokeStyle = rgb(col, front ? 1 : 0.75);
    c.lineWidth = lw * (front ? 1 : 0.75);
    c.beginPath(); c.moveTo(o.x, o.top);
    c.quadraticCurveTo(lerp(o.x, ex, 0.5), lerp(o.top, ey, 0.5) + o.drop * 0.015, ex, ey);
    c.stroke();
    if (front) {                                                   // a glint along the lit side of each rope
      c.strokeStyle = rgb(mix(col, [255, 240, 200], 0.5), 0.5); c.lineWidth = lw * 0.35;
      c.stroke();
    }
  }
}

/* ---------------------------------------------------------------
   THE PATH, in true perspective: the stones and the trodden snow lie
   flat on the ground, so they are laid out on the ground and then seen
   from the eye. A point at depth Z (1 at the bottom of the screen, more
   further away) and across X shows at y = horizon + (bottom - horizon)
   / Z and x = cx + X (bottom - horizon) / Z: far stones are smaller and
   flatter, near ones larger and deeper, and they follow the path's bend.
   o: hy (the horizon, px), yb (the bottom of the screen), cx (the middle
   of the screen), pts [[x, y], ...] the middle of the path on the
   screen from the nearest to the farthest, size (a stone's width, in
   ground units: 1 = the screen's depth below the horizon at the
   bottom), depth (a stone's depth), gap (between stones), band (half the
   trodden path's width), all in ground units
   --------------------------------------------------------------- */
function path(c, o) {
  var S = shader(o), sc = snowCols(S, o), r = rng(d(o, 'seed', 51)), i, k;
  var hy = o.hy, D = o.yb - hy, cx = o.cx;
  function toGround(p) { var q = (p[1] - hy) / D; return [(p[0] - cx) / (q * D), 1 / q]; }
  function toScreen(X, Z) { return [cx + X * D / Z, hy + D / Z]; }
  // the path on the ground, then walked along in even steps
  var G = o.pts.map(toGround), seg = [0];
  for (i = 1; i < G.length; i++) seg.push(seg[i - 1] + Math.hypot(G[i][0] - G[i - 1][0], G[i][1] - G[i - 1][1]));
  var total = seg[seg.length - 1];
  function at(t) {                                              // the point and the direction along the path at length t
    for (var j = 1; j < seg.length - 1 && seg[j] < t; j++);
    var f = clamp((t - seg[j - 1]) / (seg[j] - seg[j - 1] || 1), 0, 1);
    var a = G[j - 1], b = G[j], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1;
    return { X: lerp(a[0], b[0], f), Z: lerp(a[1], b[1], f), ux: dx / l, uz: dz / l };
  }
  // the trodden band and the ridges either side
  var band = o.band, L = [], R = [];
  for (var t = 0; t <= total; t += total / 80) {
    var P = at(t), nx = -P.uz, nz = P.ux;
    L.push(toScreen(P.X + nx * band, P.Z + nz * band)); R.push(toScreen(P.X - nx * band, P.Z - nz * band));
  }
  c.save();
  c.filter = 'blur(' + Math.max(1, D * 0.008).toFixed(1) + 'px)';
  c.beginPath(); c.moveTo(L[0][0], L[0][1]);
  for (i = 1; i < L.length; i++) c.lineTo(L[i][0], L[i][1]);
  for (i = R.length - 1; i >= 0; i--) c.lineTo(R[i][0], R[i][1]);
  c.closePath();
  c.fillStyle = rgb(sc.shade, 0.12); c.fill();
  c.lineCap = 'round'; c.lineJoin = 'round';
  [[L, -1], [R, 1]].forEach(function (E) {
    var A = E[0], lit = (E[1] > 0) === (S.side > 0);
    for (i = 1; i < A.length; i++) {
      var q = (A[i][1] - hy) / D;
      c.strokeStyle = rgb(lit ? sc.top : sc.shade, lit ? 0.7 : 0.3); c.lineWidth = Math.max(0.6, D * 0.014 * q);
      c.beginPath(); c.moveTo(A[i - 1][0], A[i - 1][1]); c.lineTo(A[i][0], A[i][1]); c.stroke();
    }
  });
  c.restore();
  // (the layout is kept: the snowfield is baked in slices, each drawing the path)
  var lkey = JSON.stringify([o.hy, o.yb, o.cx, o.size, o.depth, o.gap, o.halfWidth, o.pts, o.fixed, d(o, 'seed', 51)]);
  var keep = layoutCache[lkey];
  if (!keep) {
  var tStart = Date.now();                                        // (a time limit: the finishing steps are skipped past it)
  // THE STONES, laid as in the reference: rows of flat slabs filling a band of even width that follows the
  // path's smooth line (both its edges smooth), one row behind another with the same gap between every two.
  // Each row spans the band: one slab, or now and then two pieces with the same gap between them, their
  // ends set in a little at random so the band's edges are not ruled. Where the path runs away from you a
  // row lies level (square to you); where it runs across, the row turns square to the path. The measured
  // slabs at the front (o.fixed) stand as they are: a piece that would come closer to one than the gap is
  // trimmed on that side or shortened, or left out if too little of it would be left.
  var B = d(o, 'halfWidth', o.size * 0.5), gapZ = o.gap * 1.0, rows = [], guard = 0;
  // the path's points on the ground, finely
  var GP = [];
  for (t = 0; t <= total + 1e-9; t += total / 600) { var A0 = at(Math.min(t, total)); GP.push([A0.X, A0.Z]); }
  var zMax = Math.max.apply(null, GP.map(function (q) { return q[1]; })), Zr = Math.min.apply(null, GP.map(function (q) { return q[1]; })) - B * 0.5;
  // the band across, at depth Z: where a level line at that depth enters and leaves it
  function chordAt(Z) {
    var lo = 1e9, hi = -1e9;
    GP.forEach(function (q) { var dz = q[1] - Z; if (Math.abs(dz) < B) { var h = Math.sqrt(B * B - dz * dz); lo = Math.min(lo, q[0] - h); hi = Math.max(hi, q[0] + h); } });
    return hi > lo ? [lo, hi] : null;
  }
  // the row at depth Z: centred on the path, as wide as the band (a little wider where the path runs across,
  // so the rows still meet as they step along it)
  function rowAt(Z) {
    for (var j = 1; j < GP.length; j++) if ((GP[j - 1][1] - Z) * (GP[j][1] - Z) <= 0) {
      var f = (Z - GP[j - 1][1]) / ((GP[j][1] - GP[j - 1][1]) || 1e-9), xc = lerp(GP[j - 1][0], GP[j][0], f);
      var j0 = Math.max(0, j - 6), j1 = Math.min(GP.length - 1, j + 6);
      var sl = Math.abs((GP[j1][0] - GP[j0][0]) / ((GP[j1][1] - GP[j0][1]) || 1e-9));
      var half = B * lerp(1, 1.45, clamp(sl / 3, 0, 1));
      return [xc - half, xc + half];
    }
    return null;
  }
  var nStones = 0;
  while (Zr < zMax - o.depth * 0.3 && guard++ < 400 && nStones < 160) {
    if (o.depth * D / (Zr * Zr) < 0.3) break;                        // rows far too small to see: none farther
    var dpR = o.depth * lerp(0.85, 1.15, r()), zc = Zr + dpR / 2, ch = rowAt(zc);
    Zr += dpR + gapZ;
    if (!ch) continue;
    var L = ch[1] - ch[0], gX = gapZ / Math.max(0.5, zc);
    var inL = L * lerp(0, 0.06, r()), inR = L * lerp(0, 0.06, r()), x0r = ch[0] + inL, Lr = L - inL - inR;
    var np = Math.max(1, Math.min(3, Math.round(Lr / (o.size * 0.85))));
    if (np === 1 && Lr > o.size * 0.85 && r() < 0.25) np = 2;
    // split points, each piece a different length
    var cuts = [0];
    for (var pi = 1; pi < np; pi++) cuts.push(pi / np + (r() - 0.5) * 0.24 / np);
    cuts.push(1);
    var row = [];
    for (pi = 0; pi < np; pi++) {
      var a0 = x0r + Lr * cuts[pi] + (pi ? gX / 2 : 0), a1 = x0r + Lr * cuts[pi + 1] - (pi < np - 1 ? gX / 2 : 0);
      row.push({ X: (a0 + a1) / 2, Z: zc + (r() - 0.5) * dpR * 0.08, w: a1 - a0, dp: dpR * lerp(0.92, 1.06, r()), ax: 1, az: 0, bx: 0, bz: 1 });
    }
    rows.push(row); nStones += row.length;
  }
  // each piece's outline: four corners on the ground, each moved a little at random, then each corner
  // rounded by its own amount on the screen
  function shapeOf(St) {
    var C = [];
    [[-1, -1], [-1, 1], [1, 1], [1, -1]].forEach(function (q, j) {
      var u = q[0] * St.w / 2 + St.jit[j][0] * St.w, v = q[1] * St.dp / 2 + St.jit[j][1] * St.dp;
      C.push(toScreen(St.X + St.ax * u + St.bx * v, St.Z + St.az * u + St.bz * v));
    });
    return roundQuad(C, St.rad);
  }
  var placed = (o.fixed || []).map(function (F) { return slabOutline(F).P; }), keep = [];
  rows.forEach(function (row) { row.forEach(fitStone); });
  function fitStone(St) {
    {
      St.jit = [0, 1, 2, 3].map(function () { return [(r() - 0.5) * 0.1, (r() - 0.5) * 0.16]; });
      St.rad = [0, 1, 2, 3].map(function () { return lerp(0.08, 0.5, r()); });
      St.seed = Math.floor(r() * 1e6);
      var gpx = Math.max(1.5, gapZ * D / (St.Z * St.Z) * 0.8), w0 = St.w, dp0 = St.dp, ok = false;
      for (var it = 0; it < 90; it++) {
        St.pts = shapeOf(St);
        var fin = finalOutline(St.pts, St.seed), bb = bounds(fin);
        if (bb[2] > o.yb + 2) break;                                    // wholly below the screen
        var near = 1e9, nj = -1;
        for (var j = 0; j < placed.length; j++) { var dd = polyDist(fin, placed[j], gpx + 1); if (dd < near) { near = dd; nj = j; } }
        if (near >= gpx) { ok = true; break; }
        var pb = bounds(placed[nj]), ox = Math.min(bb[1], pb[1]) - Math.max(bb[0], pb[0]);
        var pcx = (pb[0] + pb[1]) / 2, atEnd = pcx < lerp(bb[0], bb[1], 0.25) || pcx > lerp(bb[0], bb[1], 0.75);
        if (!atEnd && (ox > (bb[1] - bb[0]) * 0.35 || ox > (pb[1] - pb[0]) * 0.6)) {
          // the other lies above or below its middle: shorten it from that side
          var up = (pb[2] + pb[3]) / 2 < (bb[2] + bb[3]) / 2, cd = dp0 * 0.05;
          St.dp -= cd; St.X += St.bx * (up ? -1 : 1) * cd / 2; St.Z += St.bz * (up ? -1 : 1) * cd / 2;
          if (St.dp < dp0 * 0.5) break;
        } else {
          // beside it: trim that end
          var side = (pb[0] + pb[1]) / 2 < (bb[0] + bb[1]) / 2 ? -1 : 1, cut = w0 * 0.03;
          St.w -= cut; St.X -= St.ax * side * cut / 2; St.Z -= St.az * side * cut / 2;
          if (St.w < Math.min(w0 * 0.4, o.size * 0.3)) break;
        }
      }
      if (!ok) return false;                                            // never one left touching or under another
      St.pi = placed.length; St.gpx = gpx;
      placed.push(finalOutline(St.pts, St.seed)); keep.push(St);
      return true;
    }
  }
  // any opening left inside the band wider than the gap (where rows met the fixed slabs): a stone is fitted
  // into it, the widest first, with the same gap all round
  var ptPoly = function (p, P) { var m = 1e9; for (var j = 0; j < P.length; j++) m = Math.min(m, segDist(p, P[j], P[(j + 1) % P.length])); return inPoly(p, P) ? -m : m; };
  // (only near the measured slabs: elsewhere the rows leave no holes)
  var gb = [1e9, -1e9, 1e9, -1e9];
  (o.fixed || []).forEach(function (F) { var fb = bounds(slabOutline(F).P); gb = [Math.min(gb[0], fb[0] - 80), Math.max(gb[1], fb[1] + 80), Math.min(gb[2], fb[2] - 60), Math.max(gb[3], fb[3])]; });
  if (!(o.fixed || []).length) gb = [0, -1, 0, -1];
  for (var pass = 0; pass < 6 && Date.now() - tStart < 500; pass++) {
    var best = null;
    for (var gy = Math.max(hy + D / zMax, gb[2]); gy < Math.min(o.yb, gb[3]); gy += 6) {
      var Zg = D / (gy - hy), gpxH = Math.max(1.5, gapZ * D / (Zg * Zg) * 0.8);
      for (var gx = gb[0]; gx < gb[1]; gx += 6) {
        var gq = [(gx - cx) * Zg / D, Zg], inB = false;
        for (var j = 0; j < GP.length && !inB; j += 3) { var ex = GP[j][0] - gq[0], ez = GP[j][1] - gq[1]; if (ex * ex + ez * ez < B * B * 0.64) inB = true; }
        if (!inB) continue;
        var cl = 60;
        for (j = 0; j < placed.length && cl > gpxH * 2.6; j++) {
          var pb2 = bounds(placed[j]);
          if (gx < pb2[0] - cl || gx > pb2[1] + cl || gy < pb2[2] - cl || gy > pb2[3] + cl) continue;
          cl = Math.min(cl, ptPoly([gx, gy], placed[j]));
        }
        if (!(cl > gpxH * 2.6 && cl < 60 && (!best || cl / gpxH > best.k))) continue;
        // only a hole with stones on both sides of it (not an opening at the band's edge)
        var lft = false, rgt = false;
        for (j = 0; j < placed.length && !(lft && rgt); j++) placed[j].forEach(function (q) {
          if (Math.abs(q[1] - gy) > cl * 0.7) return;
          var dxq = q[0] - gx;
          if (dxq < 0 && dxq > -cl * 4) lft = true;
          if (dxq > 0 && dxq < cl * 4) rgt = true;
        });
        if (lft && rgt) best = { k: cl / gpxH, x: gx, y: gy, Z: Zg, c: cl };
      }
    }
    if (!best) break;
    var Sh = { X: (best.x - cx) * best.Z / D, Z: best.Z, w: Math.min(o.size * 1.2, best.c * 2.8 * best.Z / D), dp: Math.min(o.depth, best.c * 2.2 * best.Z * best.Z / D), ax: 1, az: 0, bx: 0, bz: 1 };
    if (!fitStone(Sh)) placed.push([[best.x - 2, best.y - 2], [best.x + 2, best.y - 2], [best.x + 2, best.y + 2], [best.x - 2, best.y + 2]]);
  }
  // close up: each stone grows toward a neighbour that stands a little farther off than the gap (beside it,
  // behind or in front), until the gap there is the same as everywhere else
  function dirGap(fin, me, dir) {
    var b = bounds(fin), best2 = 1e9, horiz = dir === 0 || dir === 1;
    var a0 = horiz ? lerp(b[2], b[3], 0.25) : lerp(b[0], b[1], 0.25), a1 = horiz ? lerp(b[2], b[3], 0.75) : lerp(b[0], b[1], 0.75);
    var edge = [b[0], b[1], b[2], b[3]][dir], sg = dir === 0 || dir === 2 ? -1 : 1;
    for (var j = 0; j < placed.length; j++) {
      if (j === me) continue;
      var pb = bounds(placed[j]);
      if (pb[0] > b[1] + 45 || pb[1] < b[0] - 45 || pb[2] > b[3] + 45 || pb[3] < b[2] - 45) continue;
      placed[j].forEach(function (q) {
        var across = horiz ? q[1] : q[0];
        if (across < a0 || across > a1) return;
        var dd = ((horiz ? q[0] : q[1]) - edge) * sg;
        if (dd > -1 && dd < best2) best2 = dd;
      });
    }
    return best2;
  }
  keep.forEach(function (St) {
    if (Date.now() - tStart > 800) return;
    var w1 = St.w * 1.3, d1 = St.dp * 1.25;                          // never more than a little larger
    for (var dir = 0; dir < 4; dir++) {
      var g0 = dirGap(placed[St.pi], St.pi, dir);
      if (g0 < St.gpx * 1.25 || g0 > 40) continue;
      for (var gi = 0; gi < 40; gi++) {
        if (St.w > w1 || St.dp > d1) break;
        var sv = [St.X, St.Z, St.w, St.dp], stp;
        if (dir < 2) { stp = St.w * 0.015; St.w += stp; St.X += (dir ? 1 : -1) * stp / 2; }
        else { stp = St.dp * 0.03; St.dp += stp; St.Z += (dir === 2 ? 1 : -1) * stp / 2; }   // up the screen: farther
        var P2 = shapeOf(St), f2 = finalOutline(P2, St.seed), n2 = 1e9;
        for (var j = 0; j < placed.length; j++) if (j !== St.pi) n2 = Math.min(n2, polyDist(f2, placed[j], St.gpx + 1));
        if (n2 < St.gpx || dirGap(f2, St.pi, dir) < St.gpx) { St.X = sv[0]; St.Z = sv[1]; St.w = sv[2]; St.dp = sv[3]; break; }
        St.pts = P2; placed[St.pi] = f2;
      }
    }
  });
  layoutCache = {}; layoutCache[lkey] = keep;
  }
  // each stone is painted once into a small picture of its own (with its shadow, side and edge) and that
  // picture is laid down: the snowfield is baked in slices, each drawing every stone, and the blurs in the
  // painting are costly on a big canvas (on the tablet's graphics chip they stalled the whole browser)
  var tr = c.getTransform ? c.getTransform() : { a: 1 }, kk = Math.max(1, Math.abs(tr.a) || 1);
  var lightKey = [Math.round(sc.top[0]), Math.round(sc.top[1]), Math.round(sc.top[2]), Math.round(sc.shade[0]), Math.round(sc.shade[2]), Math.round(S.bright * 100), sc.side0, kk].join(',');
  if (spriteKey !== lightKey + lkey) { spriteCache = []; spriteKey = lightKey + lkey; }
  keep.slice().reverse().forEach(function (St3, si) {               // the farthest first
    if (o.collect) o.collect.push(finalOutline(St3.pts, St3.seed));
    var spr = spriteCache[si];
    if (!spr) {
      var b3 = bounds(finalOutline(St3.pts, St3.seed)), pad = Math.max(6, (b3[3] - b3[2]) * 0.6);
      var bx = Math.floor(b3[0] - pad), by = Math.floor(b3[2] - pad), bw = Math.ceil(b3[1] - b3[0] + pad * 2), bh = Math.ceil(b3[3] - b3[2] + pad * 2);
      var cv = document.createElement('canvas'); cv.width = Math.max(1, Math.round(bw * kk)); cv.height = Math.max(1, Math.round(bh * kk));
      var g = cv.getContext('2d'); g.setTransform(kk, 0, 0, kk, -bx * kk, -by * kk);
      // drawn as the nearest slabs are (WinterScene.slabs): the same slate, edge, rim and shadow
      slabPoly(g, St3.pts, S, sc, St3.seed);
      spr = spriteCache[si] = { cv: cv, x: bx, y: by, w: bw, h: bh };
    }
    c.drawImage(spr.cv, spr.x, spr.y, spr.w, spr.h);
  });
}
var spriteCache = [], spriteKey = '';
var layoutCache = {};
function bounds(P) {
  if (P.bb) return P.bb;                                          // (kept on the outline: it never changes once made)
  var x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (var i = 0; i < P.length; i++) { var p = P[i]; if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; }
  P.bb = [x0, x1, y0, y1];
  return P.bb;
}
/* The outline a stone is finally drawn with (its given outline made rough and worn, as slabPoly does). */
function finalOutline(P0, seed) {
  var b = bounds(P0);
  return roughen(P0, (b[0] + b[1]) / 2, (b[2] + b[3]) / 2, b[1] - b[0], b[3] - b[2], rng(seed + 3));
}
function inPoly(p, P) {
  var c0 = false;
  for (var i = 0, j = P.length - 1; i < P.length; j = i++) {
    if ((P[i][1] > p[1]) !== (P[j][1] > p[1]) && p[0] < (P[j][0] - P[i][0]) * (p[1] - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0]) c0 = !c0;
  }
  return c0;
}
function segDist(p, a, b) {
  var dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy, t = l ? clamp(((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l, 0, 1) : 0;
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
}
/* The smallest distance between two outlines (negative when they overlap); 1e9 when they are farther apart
   than lim (default 40) — then nothing more is worked out. */
function polyDist(A, B, lim) {
  var bA = bounds(A), bB = bounds(B), L = lim === undefined ? 40 : lim;
  if (bA[0] > bB[1] + L || bB[0] > bA[1] + L || bA[2] > bB[3] + L || bB[2] > bA[3] + L) return 1e9;
  var m = 1e9, i, j, stop = lim === undefined ? -1e9 : lim - 1;   // (with a limit, closer than it is all that matters)
  for (i = 0; i < A.length; i++) {
    var a = A[i];
    if (a[0] < bB[0] - L || a[0] > bB[1] + L || a[1] < bB[2] - L || a[1] > bB[3] + L) continue;
    if (a[0] >= bB[0] && a[0] <= bB[1] && a[1] >= bB[2] && a[1] <= bB[3] && inPoly(a, B)) return -1;
    for (j = 0; j < B.length; j++) { var dd = segDist(a, B[j], B[(j + 1) % B.length]); if (dd < m) { m = dd; if (m < stop) return m; } }
  }
  for (i = 0; i < B.length; i++) {
    var b = B[i];
    if (b[0] < bA[0] - L || b[0] > bA[1] + L || b[1] < bA[2] - L || b[1] > bA[3] + L) continue;
    if (b[0] >= bA[0] && b[0] <= bA[1] && b[1] >= bA[2] && b[1] <= bA[3] && inPoly(b, A)) return -1;
    for (j = 0; j < A.length; j++) { var dd2 = segDist(b, A[j], A[(j + 1) % A.length]); if (dd2 < m) { m = dd2; if (m < stop) return m; } }
  }
  return m;
}

/* The nearest slabs (o.fixed: each its four corners on the screen, [left, top, right, bottom], as
   measured on the reference), drawn crisp on a layer of their own: dark slate with a thin, darker
   inked edge along the sides toward you (its thickness), the corners rounded, the top face mottled
   lighter and darker as in the painting, a soft light rim along the far edge, a soft blue shadow on
   the snow round it. */
function slabs(c, o) {
  var S = shader(o), sc = snowCols(S, o);
  (o.fixed || []).forEach(function (F) { slab(c, F, S, sc); });
}
/* The same look for a stone given as an outline of many points on the screen (the stones along the path). */
/* Rough, chipped edges: each point of the outline pushed in or out a little (a slow wobble and small
   chips), so no stone is a smooth, perfect shape. */
function roughen(P, cx, cy, len, wid, r) {
  var n = P.length, ph = r() * TAU, ph2 = r() * TAU, out = [];
  // a few worn dips: soft, wide (spread over several points), never a sharp notch
  var dips = [];
  for (var dd = 0; dd < 2 + Math.floor(r() * 2); dd++) dips.push([r(), lerp(0.03, 0.07, r()), lerp(0.015, 0.03, r())]);
  for (var i = 0; i < n; i++) {
    var p = P[i], dx = (p[0] - cx) / len, dy = (p[1] - cy) / wid, l = Math.hypot(dx, dy) || 1;
    var u = i / n, w = 0.6 * Math.sin(u * TAU * 3 + ph) + 0.4 * Math.sin(u * TAU * 7 + ph2);
    var k = w * 0.014 + (r() - 0.5) * 0.004;
    dips.forEach(function (D) { var du = Math.min(Math.abs(u - D[0]), 1 - Math.abs(u - D[0])); k -= D[2] * Math.exp(-du * du / (D[1] * D[1])); });
    out.push([p[0] + dx / l * k * len, p[1] + dy / l * k * wid * 1.3]);
  }
  return out;
}
/* ---------------------------------------------------------------
   THE STONE'S TOP, rendered pixel by pixel as a real surface: a height
   map (the slate's rounded, slightly uneven top, and the snow lying on
   it, deep in places, thinning out at its edges), lit by the scene's own
   light from its slope at every pixel, with the shadows the snow throws
   on the stone. The slate has a natural texture (cloudy tones, a faint
   warm tinge, fine grain), is darker and wet just inside its edge and
   frosted in grainy patches; the snow is kept inside the edge, so the
   dark stone shows all round it.
   --------------------------------------------------------------- */
function hash2(i, j, s) {
  var h = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(s, 982451653)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function vnoise(x, y, s) {
  var i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j;
  fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
  var a = hash2(i, j, s), b = hash2(i + 1, j, s), c0 = hash2(i, j + 1, s), d0 = hash2(i + 1, j + 1, s);
  return lerp(lerp(a, b, fx), lerp(c0, d0, fx), fy);
}
function fbm(x, y, s, oct) {
  var v = 0, a = 0.5, t = 0;
  for (var o = 0; o < oct; o++) { v += vnoise(x, y, s + o * 17) * a; t += a; x *= 2.03; y *= 2.03; a *= 0.5; }
  return v / t;
}
function smooth(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
/* Each stone's render is kept (the snowfield is baked in slices, each drawing every stone), keyed by the
   stone, its size on the screen and the light; made again only when one of them changes. */
var rasterCache = {}, rasterCount = 0;
function stoneRaster(c, P, x0, y0, x1, y1, S, sc, slate, seed) {
  // (worked out at one pixel per screen point: the top is soft, its crisp edge is drawn over it afterwards)
  var k = 1;
  var bx = Math.floor(x0) - 1, by = Math.floor(y0) - 1, bw = Math.ceil(x1 - bx) + 2, bh = Math.ceil(y1 - by) + 2;
  var w = Math.max(2, Math.round(bw * k)), h = Math.max(2, Math.round(bh * k));
  if (w * h > 600000) return false;
  var key = [seed, bx, by, w, h, Math.round(sc.top[0]), Math.round(sc.top[1]), Math.round(sc.top[2]),
             Math.round(sc.shade[0]), Math.round(sc.shade[2]), Math.round(S.bright * 100), Math.round(slate[0]), sc.side0].join(',');
  var hit = rasterCache[key];
  if (hit) { c.drawImage(hit, bx, by, bw, bh); return true; }
  if (rasterCount > 400) { rasterCache = {}; rasterCount = 0; }
  var cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  var g = cv.getContext('2d', { willReadFrequently: true });     // kept on the main processor: reading its mask back is cheap
  g.setTransform(k, 0, 0, k, -bx * k, -by * k);
  g.beginPath(); P.forEach(function (p, j) { j ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); }); g.closePath();
  g.fillStyle = '#fff'; g.fill();
  var img = g.getImageData(0, 0, w, h), D = img.data, N = w * h, i, x, y;
  // distance inside the edge (pixels), two passes
  var dist = new Float32Array(N), BIG = 1e6;
  for (i = 0; i < N; i++) { var a0 = D[i * 4 + 3]; dist[i] = a0 === 0 ? 0 : a0 === 255 ? BIG : a0 / 255; }
  for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
    i = y * w + x; if (dist[i] < BIG) continue;
    var m = dist[i];
    if (x > 0) m = Math.min(m, dist[i - 1] + 1); else m = Math.min(m, 1);
    if (y > 0) { m = Math.min(m, dist[i - w] + 1); if (x > 0) m = Math.min(m, dist[i - w - 1] + 1.414); if (x < w - 1) m = Math.min(m, dist[i - w + 1] + 1.414); } else m = Math.min(m, 1);
    dist[i] = m;
  }
  for (y = h - 1; y >= 0; y--) for (x = w - 1; x >= 0; x--) {
    i = y * w + x; if (!dist[i] || dist[i] < 1) continue;
    var m2 = dist[i];
    if (x < w - 1) m2 = Math.min(m2, dist[i + 1] + 1); else m2 = Math.min(m2, 1);
    if (y < h - 1) { m2 = Math.min(m2, dist[i + w] + 1); if (x < w - 1) m2 = Math.min(m2, dist[i + w + 1] + 1.414); if (x > 0) m2 = Math.min(m2, dist[i + w - 1] + 1.414); } else m2 = Math.min(m2, 1);
    dist[i] = m2;
  }
  var len = (x1 - x0) * k, wid = (y1 - y0) * k;
  var F = 2.4;                                  // how much the top is foreshortened (ground depth per screen height)
  var U = Math.max(4, len / 3);                 // the texture's scale: about three cells along the stone
  var bev = Math.max(1.5, wid * 0.13);           // the rounded edge's width
  var r = rng(seed), sOff = Math.floor(r() * 1e5);
  var snowDepth = Math.max(1, wid * 0.055);
  // the snow: a thin, uneven layer left on the stone, worn away where feet go (its middle), lying longest
  // toward its back and its ends; its edge broken and feathered as melting snow is, kept inside the stone
  var hsA = new Float32Array(N), Ht = new Float32Array(N), snow = new Float32Array(N), tone = new Float32Array(N), warm = new Float32Array(N), frost = new Float32Array(N);
  // (the stone is clean slate, as in the reference: no snow or frost on it)
  // (these change slowly across the stone: worked out on a 4-pixel grid and blended between)
  var gs4 = 4, gw = Math.ceil(w / gs4) + 2, gh = Math.ceil(h / gs4) + 2, gB = new Float32Array(gw * gh), gT = new Float32Array(gw * gh), gW = new Float32Array(gw * gh);
  for (y = 0; y < gh; y++) for (x = 0; x < gw; x++) {
    var nx0 = x * gs4 / U, ny0 = y * gs4 * F / U, q = y * gw + x;
    gB[q] = fbm(nx0 * 3, ny0 * 3, sOff + 5, 2); gT[q] = fbm(nx0 * 1.3, ny0 * 1.3, sOff + 9, 3); gW[q] = fbm(nx0 * 0.8, ny0 * 0.8, sOff + 31, 2);
  }
  function gl4(A, x, y) {
    var fx = x / gs4, fy = y / gs4, ix = Math.floor(fx), iy = Math.floor(fy), ax = fx - ix, ay = fy - iy, q = iy * gw + ix;
    return lerp(lerp(A[q], A[q + 1], ax), lerp(A[q + gw], A[q + gw + 1], ax), ay);
  }
  for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
    i = y * w + x; var d = dist[i]; if (!d) continue;
    var e = Math.min(1, d / bev);
    Ht[i] = Math.sqrt(e) * bev * 0.35 + (gl4(gB, x, y) - 0.5) * bev * 0.12;
    tone[i] = gl4(gT, x, y);
    warm[i] = smooth(0.55, 0.8, gl4(gW, x, y));
  }
  // light: lit from the scene's sun; the snow's shadow marched toward it
  var Lx = (sc.side0 || -1), Lz = 0.35, Ly = 0.55, Lg = Math.hypot(Lx, Lz);
  var stepX = Lx / Lg, stepY = -Lz / Lg / F, rise = Ly / Lg;
  var snowC = (sc.snowBase) || [250, 250, 252];
  var lsx = 0.35 * (sc.side0 || -1), lsy = 0.8, lsz = -0.45, lsl = Math.hypot(lsx, lsy, lsz); lsx /= lsl; lsy /= lsl; lsz /= lsl;
  var snowBlue = mix(sc.shade, [140, 152, 190], 0.4);
  var out = g.createImageData(w, h), O = out.data;
  for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
    i = y * w + x; var a = D[i * 4 + 3]; if (!a) continue;
    var xm = Math.max(0, x - 1), xp = Math.min(w - 1, x + 1), ym = Math.max(0, y - 1), yp = Math.min(h - 1, y + 1);
    var hx = (Ht[y * w + xp] - Ht[y * w + xm]) / (xp - xm), hy = (Ht[yp * w + x] - Ht[ym * w + x]) / (yp - ym);
    var nX = -hx, nY = 1, nZ = -hy / F + 0.3;
    var occ = 1;
    var s = snow[i], d2 = dist[i], col;
    // the slate: cloudy tones, a warm tinge, wet and darker just inside its edge, the grain, the frost
    var gr = vnoise(x / U * 14, y * F / U * 14, sOff + 61);
    var stk = vnoise(x / U * 0.7, y * F / U * 7, sOff + 63);              // faint brush streaks along its length
    var tk = lerp(0.86, 1.12, tone[i]) * (0.95 + 0.1 * stk) * (0.98 + 0.04 * gr);
    var base = scale(mix(slate, [140, 134, 126], warm[i] * 0.2), tk);
    var fr = frost[i] * (1 - s);
    base = mix(base, snowC, fr * 0.6);
    var stoneCol = S(base, nX * 0.7, nY, nZ, occ);
    col = stoneCol;
    O[i * 4] = clamp(col[0], 0, 255); O[i * 4 + 1] = clamp(col[1], 0, 255); O[i * 4 + 2] = clamp(col[2], 0, 255); O[i * 4 + 3] = a;
  }
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.putImageData(out, 0, 0);
  rasterCache[key] = cv; rasterCount++;
  c.drawImage(cv, bx, by, bw, bh);
  return true;
}
function slabPoly(c, P0, S, sc, seed) {
  var P = finalOutline(P0, seed);
  var xs = P.map(function (p) { return p[0]; }), ys = P.map(function (p) { return p[1]; });
  var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
  var len = x1 - x0, wid = y1 - y0, th = Math.max(1.2, Math.min(len * 0.03, wid * 0.22)), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  var slate = [138, 142, 160], br = S.bright;
  function col(base, k) { return mix(scale(base, br * k), S(scale(base, k), 0, 1, 0.5, 0.6), 0.35); }
  function path(dy, k) { c.beginPath(); P.forEach(function (p, i) { var x = cx + (p[0] - cx) * k, y = cy + (p[1] - cy) * k + dy; i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.closePath(); }
  var rr = rng(seed + 11);
  // its shadow on the snow: the stone stands only a little above the snow, so a short shadow on the side
  // away from the sun (and a little away from you), sharp at the stone, softening as it goes; and a thin
  // dark crease all round where the stone meets the snow
  var ox = -S.side * th * 1.1, oy = -th * 0.35, shc = mix(sc.shade, [88, 98, 140], 0.35);
  function outlineAt(dx, dy) { c.beginPath(); P.forEach(function (p, i) { i ? c.lineTo(p[0] + dx, p[1] + dy) : c.moveTo(p[0] + dx, p[1] + dy); }); c.closePath(); }
  c.save();
  c.filter = 'blur(' + Math.max(0.5, th * 0.7).toFixed(1) + 'px)';
  outlineAt(ox, oy); c.fillStyle = rgb(shc, 0.28 * S.bright + 0.1); c.fill();
  c.filter = 'blur(' + Math.max(0.3, th * 0.25).toFixed(1) + 'px)';
  outlineAt(ox * 0.45, oy * 0.45); c.fillStyle = rgb(shc, 0.3); c.fill();
  c.filter = 'blur(' + Math.max(0.3, th * 0.15).toFixed(1) + 'px)';
  c.lineJoin = 'round'; c.lineWidth = Math.max(0.8, th * 0.7); c.strokeStyle = rgb(mix(shc, [70, 76, 100], 0.3), 0.5);
  outlineAt(0, 0); c.stroke();
  c.restore();
  // its side face: only along its front edge, hanging below it, tapering to nothing at both ends (so it can
  // never poke out beyond the stone), the stone's own slate a little darker, not black
  var sideH = Math.max(1, th * lerp(0.5, 1.4, rr())), FR = frontRun(P, cy, wid);
  if (FR.length > 2) {
    var hAt = function (j) { return sideH * Math.pow(Math.sin(j / (FR.length - 1) * PI), 0.7); };
    c.beginPath(); c.moveTo(FR[0][0], FR[0][1]);
    for (var fj = 1; fj < FR.length; fj++) c.lineTo(FR[fj][0], FR[fj][1]);
    for (fj = FR.length - 1; fj >= 0; fj--) c.lineTo(FR[fj][0], FR[fj][1] + hAt(fj));
    c.closePath();
    var sg = c.createLinearGradient(0, cy, 0, y1 + sideH);
    sg.addColorStop(0, rgb(col(slate, 0.8))); sg.addColorStop(1, rgb(col(slate, 0.62)));
    c.fillStyle = sg; c.fill();
  }

  var r = rng(seed);
  if (!stoneRaster(c, P, x0, y0, x1, y1, S, sc, scale(mix(slate, [128, 128, 132], 0.35), 0.95), seed + 29)) {
    path(0, 1); c.fillStyle = rgb(col(slate, 1)); c.fill();
  }
  // a thin dark edge round the top face (crisp, as painted, but not a heavy ink line)
  // its edge as painted: a crisp dark line along its front and ends, softer and lighter along its back,
  // where a thin lip of snow lies on it
  path(0, 1); c.strokeStyle = rgb(col(slate, 0.45), 0.35); c.lineWidth = Math.max(0.5, th * 0.2); c.stroke();
  if (FR.length > 1) {
    c.beginPath(); c.moveTo(FR[0][0], FR[0][1]);
    for (var fk = 1; fk < FR.length; fk++) c.lineTo(FR[fk][0], FR[fk][1]);
    c.lineJoin = 'round'; c.lineCap = 'round';
    c.strokeStyle = rgb(scale(col(slate, 0.3), 0.8), 0.85); c.lineWidth = Math.max(0.7, th * 0.32); c.stroke();
  }
  c.save(); path(0, 1); c.clip();
  c.filter = 'blur(' + Math.max(0.3, th * 0.2).toFixed(1) + 'px)';
  var BR = backRun(P, cy, wid);
  c.beginPath(); BR.forEach(function (p, j) { j ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); });
  c.strokeStyle = rgb(sc.top, 0.5); c.lineWidth = Math.max(0.8, th * 0.55); c.stroke();
  c.restore();
  bank(c, P, cx, cy, len, wid, th, sideH, sc, rng(seed + 19));
}
/* Snow drifted against a stone: soft, uneven white along its sides and its front edge, lapping over the
   edge here and there, so the stone sits in the snow (the reference never shows a clean, hard side). */
/* Where the stone meets the snow, as in the real world: trodden, muddy grey-brown slush round its
   sides and front, uneven, broken; drawn on the snow before the stone. */
function grime(c, P, cx, cy, len, wid, r) {
  c.save();
  // a thin muddy band hugging its sides and front
  c.filter = 'blur(' + Math.max(0.4, wid * 0.025).toFixed(1) + 'px)';
  for (var i = 0; i < P.length; i++) {
    var p = P[i];
    if (p[1] < cy - wid * 0.15 || r() < 0.25) continue;
    var rr = wid * lerp(0.05, 0.11, r());
    c.fillStyle = rgb(r() < 0.6 ? [150, 152, 164] : [128, 130, 144], lerp(0.05, 0.12, r()));
    c.beginPath(); c.ellipse(p[0] + (p[0] - cx) * 0.03, p[1] + rr * 0.8, rr * lerp(1.5, 3, r()), rr * 0.55, 0, 0, TAU); c.fill();
  }
  // grit: small dark specks scattered in the trodden snow just round it
  c.filter = 'none';
  for (i = 0; i < Math.round(len / 20); i++) {
    var q = P[Math.floor(r() * P.length)], d = Math.max(0.5, wid * lerp(0.01, 0.025, r()));
    var out = lerp(0.02, 0.15, r());
    c.fillStyle = rgb(r() < 0.5 ? [130, 132, 144] : [112, 114, 128], lerp(0.08, 0.2, r()));
    c.fillRect(q[0] + (q[0] - cx) * out * 0.3, q[1] + (q[1] - cy) * out + (q[1] > cy ? wid * 0.05 : 0), d, d);
  }
  c.restore();
}
/* Broken clumps of snow lying over the stone's edges here and there (crisp, white on top, blue under),
   and the faint dusting on the back of its top. */
/* Weathering, as real stones on a snowy path look: a darker wet band just inside the edge where the
   snow melts against it, a fine crack or two, moss in the edge here and there, patches of packed snow
   lying over its corners and edges (crisp, so the outline is broken and uneven), and round it on the
   snow: small pebbles, now and then a dry fallen leaf. P: its outline on the screen. */
function snowRim(c, P, cx, cy, len, wid, sc, r) {
  if (len < 8) return;
  var S0side = sc.side0 || -1;
  var n = P.length, i, k;
  function outline() { c.beginPath(); P.forEach(function (p, j) { j ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); }); c.closePath(); }
  c.save();
  outline(); c.clip();
  // moss in the edge, a few dull green-grey tufts
  for (k = 0; k < Math.round(len / 40); k++) {
    if (r() < 0.6) continue;
    var m = P[Math.floor(r() * n)], mr = Math.max(0.8, wid * lerp(0.04, 0.09, r()));
    c.save(); c.filter = 'blur(' + Math.max(0.4, mr * 0.4).toFixed(1) + 'px)';
    for (var t = 0; t < 4; t++) {
      c.fillStyle = rgb(r() < 0.5 ? [98, 106, 84] : [84, 92, 74], lerp(0.25, 0.45, r()));
      c.beginPath(); c.ellipse(m[0] + (r() - 0.5) * mr * 2.5, m[1] + (r() - 0.5) * mr, mr * lerp(0.6, 1.1, r()), mr * lerp(0.35, 0.6, r()), 0, 0, TAU); c.fill();
    }
    c.restore();
  }
  c.restore();
  // on the snow round it: small pebbles, and now and then a dry fallen leaf
  for (k = 0; k < Math.round(len / 70); k++) {
    if (r() < 0.4) continue;
    var e = P[Math.floor(r() * n)], out = lerp(1.04, 1.2, r());
    var px = cx + (e[0] - cx) * out, py = cy + (e[1] - cy) * out + wid * 0.05, pr = Math.max(0.5, wid * lerp(0.018, 0.04, r()));
    c.fillStyle = rgb(r() < 0.5 ? [118, 120, 132] : [138, 140, 150], 0.8);
    c.beginPath(); c.ellipse(px, py, pr * 1.3, pr, r() * PI, 0, TAU); c.fill();
    c.fillStyle = rgb([200, 202, 212], 0.3);
    c.beginPath(); c.ellipse(px - pr * 0.3, py - pr * 0.35, pr * 0.4, pr * 0.25, 0, 0, TAU); c.fill();
  }
  if (r() < 0.35) {
    var lf = P[Math.floor(r() * n)], lx = cx + (lf[0] - cx) * 1.15, ly = cy + (lf[1] - cy) * 1.2 + wid * 0.1;
    var ls = Math.max(1.5, wid * lerp(0.12, 0.2, r())), la = r() * TAU;
    c.save(); c.translate(lx, ly); c.rotate(la); c.scale(1, 0.55);
    c.fillStyle = rgb(r() < 0.5 ? [140, 88, 52] : [118, 78, 50], 0.9);
    c.beginPath(); c.moveTo(-ls, 0); c.quadraticCurveTo(0, -ls * 0.6, ls, 0); c.quadraticCurveTo(0, ls * 0.6, -ls, 0); c.fill();
    c.strokeStyle = rgb([84, 54, 34], 0.8); c.lineWidth = Math.max(0.4, ls * 0.08);
    c.beginPath(); c.moveTo(-ls, 0); c.lineTo(ls * 1.2, 0); c.stroke();
    c.restore();
  }
}
/* Snow banked against a stone's sides: the snow round it rises against the stone and covers the
   bottom of its side face unevenly (so it sits sunk in the snow), the snow the same colour as the
   ground, a blue crease where it meets the stone, grey slush stains in it near the stone. */
/* The front edge of an outline, in outline order (one unbroken run of points on its near half), left to right. */
function backRun(P, cy, wid) {
  var n = P.length, back = P.map(function (p) { return p[1] < cy - wid * 0.15; }), st = -1, B = [], j;
  for (j = 0; j < n; j++) if (back[j] && !back[(j + n - 1) % n]) { st = j; break; }
  if (st < 0) return B;
  for (j = 0; j < n && back[(st + j) % n]; j++) B.push(P[(st + j) % n]);
  return B;
}
function frontRun(P, cy, wid) {
  var n = P.length, near = P.map(function (p) { return p[1] > cy + wid * 0.05; }), st = -1, F = [], j;
  for (j = 0; j < n; j++) if (near[j] && !near[(j + n - 1) % n]) { st = j; break; }
  if (st < 0) return F;
  for (j = 0; j < n && near[(st + j) % n]; j++) F.push(P[(st + j) % n]);
  if (F.length > 1 && F[0][0] > F[F.length - 1][0]) F.reverse();
  return F;
}
function bank(c, P, cx, cy, len, wid, th, sideH, sc, r) {
  // the points along its front and its two ends (the sides you can see), left to right
  // the front edge in outline order (one unbroken run of points on the near half), left to right
  var F = frontRun(P, cy, wid);
  if (F.length < 3) return;
  var ground = mix(sc.top, sc.shade, 0.28), ph = r() * TAU, ph2 = r() * TAU, top = [], i;
  for (i = 0; i < F.length; i++) {
    var u = i / (F.length - 1);
    // how high the snow comes up the side here: up to the top edge in places, low in others
    var sb = sideH * Math.pow(Math.sin(u * PI), 0.7);                          // the side face's depth here
    var cover = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(u * 6 + ph)) * (0.55 + 0.45 * Math.sin(u * 17 + ph2));
    top.push([F[i][0], F[i][1] + sb * (1 - cover)]);
  }
  var drop = sideH * 1.05;
  c.save();
  c.filter = 'blur(' + Math.max(0.3, th * 0.12).toFixed(1) + 'px)';
  // the bank of snow
  c.beginPath(); c.moveTo(top[0][0], top[0][1]);
  for (i = 1; i < top.length; i++) c.lineTo(top[i][0], top[i][1]);
  for (i = F.length - 1; i >= 0; i--) c.lineTo(F[i][0], F[i][1] + (sideH * 1.15 + 1) * Math.pow(Math.sin(i / (F.length - 1) * PI), 0.7));
  c.closePath();
  var g = c.createLinearGradient(0, cy, 0, cy + wid * 0.5 + drop);
  g.addColorStop(0, rgb(mix(ground, sc.top, 0.15))); g.addColorStop(1, rgb(ground));
  c.fillStyle = g; c.fill();
  // grey slush stains in it near the stone
  c.save(); c.clip();
  for (i = 0; i < Math.round(len / 10); i++) {
    var q = top[Math.floor(r() * top.length)];
    c.fillStyle = rgb(r() < 0.5 ? [140, 138, 140] : [126, 128, 140], lerp(0.12, 0.3, r()));
    c.beginPath(); c.ellipse(q[0], q[1] + sideH * lerp(0.15, 0.5, r()), len * lerp(0.015, 0.04, r()), sideH * lerp(0.12, 0.25, r()), 0, 0, TAU); c.fill();
  }
  c.restore();
  // the blue crease where the snow meets the stone
  c.strokeStyle = rgb(sc.shade, 0.75); c.lineWidth = Math.max(0.6, th * 0.3); c.lineJoin = 'round';
  c.beginPath(); top.forEach(function (q, j) { j ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); }); c.stroke();
  c.restore();
}
function slab(c, F, S, sc) {
  var O = slabOutline(F);
  slabPoly(c, O.P0, S, sc, O.seed);
}
/* Four corners on the screen, each rounded by its own share (rad) of the shorter edge beside it, sampled densely. */
function roundQuad(F, rad) {
  var P = [], i, t;
  for (i = 0; i < 4; i++) {
    var a = F[(i + 3) % 4], b = F[i], c2 = F[(i + 1) % 4];
    var la = Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, lc = Math.hypot(c2[0] - b[0], c2[1] - b[1]) || 1;
    var k = Math.min(la, lc) * rad[i] * 0.5;
    var p0 = [b[0] + (a[0] - b[0]) * k / la, b[1] + (a[1] - b[1]) * k / la], p1 = [b[0] + (c2[0] - b[0]) * k / lc, b[1] + (c2[1] - b[1]) * k / lc];
    for (t = 0; t <= 1.001; t += 0.2) { var u = 1 - t; P.push([u * u * p0[0] + 2 * u * t * b[0] + t * t * p1[0], u * u * p0[1] + 2 * u * t * b[1] + t * t * p1[1]]); }
    var nx = F[(i + 1) % 4], k2 = Math.min(lc, Math.hypot(nx[0] - F[(i + 2) % 4][0], nx[1] - F[(i + 2) % 4][1])) * rad[(i + 1) % 4] * 0.5;
    var q1 = [nx[0] + (b[0] - nx[0]) * k2 / lc, nx[1] + (b[1] - nx[1]) * k2 / lc];
    for (t = 0.1; t < 0.95; t += 0.1) P.push([lerp(p1[0], q1[0], t), lerp(p1[1], q1[1], t)]);
  }
  return P;
}
/* A fixed stone's outline from its four corners: each corner rounded, sampled densely; P0 before it is made
   rough, P as finally drawn. */
function slabOutline(F) {
  var len = 0, e, i;
  for (e = 0; e < 4; e++) len = Math.max(len, Math.hypot(F[(e + 1) % 4][0] - F[e][0], F[(e + 1) % 4][1] - F[e][1]));
  var rad = len * 0.12, P = [];
  for (i = 0; i < 4; i++) {                                     // each corner rounded, sampled densely
    var a = F[(i + 3) % 4], b = F[i], c2 = F[(i + 1) % 4];
    var la = Math.hypot(a[0] - b[0], a[1] - b[1]), lc = Math.hypot(c2[0] - b[0], c2[1] - b[1]), k = Math.min(rad, la * 0.4, lc * 0.4);
    var p0 = [b[0] + (a[0] - b[0]) * k / la, b[1] + (a[1] - b[1]) * k / la], p1 = [b[0] + (c2[0] - b[0]) * k / lc, b[1] + (c2[1] - b[1]) * k / lc];
    for (var t = 0; t <= 1; t += 0.2) {
      var u = 1 - t; P.push([u * u * p0[0] + 2 * u * t * b[0] + t * t * p1[0], u * u * p0[1] + 2 * u * t * b[1] + t * t * p1[1]]);
    }
    var nx = F[(i + 1) % 4], q0 = p1, q1 = [nx[0] + (b[0] - nx[0]) * k / lc, nx[1] + (b[1] - nx[1]) * k / lc];
    for (t = 0.12; t < 1; t += 0.12) P.push([lerp(q0[0], q1[0], t), lerp(q0[1], q1[1], t)]);
  }
  var seed = Math.round(F[0][0] * 7 + F[0][1] * 13);
  return { P0: P, seed: seed, P: finalOutline(P, seed) };
}

/* ---------------------------------------------------------------
   THE BANKS of the pond beyond the water: the face of the bank, earth
   and stones darkened by the wet, under a rounded lip of snow that
   throws a soft shadow. o.lines = [{ pts: [[x, y], ...] (the edge of
   the snow, left to right), th (px: how far the earth shows below it) }]
   --------------------------------------------------------------- */
/* A line through the points, made smooth (Catmull-Rom), k points a span, a little uneven (jit px). */
function smoothLine(P, k, r, jit) {
  var out = [], i, j;
  for (i = 0; i < P.length - 1; i++) {
    var p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
    for (j = 0; j < k; j++) {
      var t = j / k, t2 = t * t, t3 = t2 * t;
      var x = 0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3);
      var y = 0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3);
      out.push([x, y + (i || j ? (r() - 0.5) * jit : 0)]);
    }
  }
  out.push(P[P.length - 1].slice());
  return out;
}
function banks(c, o) {
  var S = shader(o), sc = snowCols(S, o), r = rng(d(o, 'seed', 61)), earth = [150, 120, 96], wet = [84, 70, 64];
  o.lines.forEach(function (L) {
    var P = smoothLine(L.pts, 8, r, L.th * 0.12), n = P.length, i, th = L.th, bot = [];
    // the face: thickest in the middle of each run, uneven along it
    var wob = r() * 10;
    for (i = 0; i < n; i++) {
      var t = i / (n - 1), k = 0.35 + 0.65 * Math.sin(t * PI);
      bot.push([P[i][0], P[i][1] + th * k * (0.85 + 0.2 * Math.sin(i * 0.7 + wob) + 0.1 * Math.sin(i * 2.3))]);
    }
    function edge(Q) {
      for (var m = 1; m < Q.length; m++) c.quadraticCurveTo(Q[m - 1][0], Q[m - 1][1], (Q[m - 1][0] + Q[m][0]) / 2, (Q[m - 1][1] + Q[m][1]) / 2);
      c.lineTo(Q[Q.length - 1][0], Q[Q.length - 1][1]);
    }
    c.beginPath();
    c.moveTo(P[0][0], P[0][1]); edge(P);
    var rb = bot.slice().reverse();
    c.lineTo(rb[0][0], rb[0][1]); edge(rb);
    c.closePath();
    var ymin = Math.min.apply(null, P.map(function (p) { return p[1]; })), ymax = Math.max.apply(null, bot.map(function (p) { return p[1]; }));
    var g = c.createLinearGradient(0, ymin, 0, ymax);
    // earth keeps most of its own colour (the sky only cools it a little)
    function E(base, k) { return mix(scale(base, S.bright), S(base, S.side * 0.3, 0.2, 1, k), 0.35); }
    g.addColorStop(0, rgb(E(scale(earth, 0.6), 0.2))); g.addColorStop(0.3, rgb(E(earth, 0.6)));
    g.addColorStop(0.8, rgb(E(scale(earth, 0.85), 0.5))); g.addColorStop(1, rgb(E(wet, 0.4)));
    c.fillStyle = g; c.fill();
    // texture on the face: a few streaks and stones, and the shadow of the snow lip
    c.save(); c.clip();
    for (i = 0; i < n * 6; i++) {
      var q = r() * (n - 1), qi = Math.floor(q), f = q - qi;
      var qx = lerp(P[qi][0], P[qi + 1][0], f), qy = lerp(P[qi][1], P[qi + 1][1], f) + r() * th;
      c.fillStyle = rgb(scale(earth, (r() < 0.5 ? 1.15 : 0.6) * S.bright), 0.45);
      c.beginPath(); c.ellipse(qx, qy, th * lerp(0.2, 0.6, r()), th * lerp(0.08, 0.18, r()), 0, 0, TAU); c.fill();
    }
    c.strokeStyle = rgb([40, 36, 40], 0.35); c.lineWidth = th * 0.5; c.filter = 'blur(' + (th * 0.2).toFixed(1) + 'px)';
    c.beginPath(); c.moveTo(P[0][0], P[0][1] + th * 0.2);
    for (i = 1; i < n; i++) c.lineTo(P[i][0], P[i][1] + th * 0.2);
    c.stroke();
    c.restore();
    // the lip of snow, rounded over the edge
    c.lineJoin = 'round'; c.lineCap = 'round';
    c.strokeStyle = rgb(sc.side); c.lineWidth = Math.max(1.2, th * 0.38);
    c.beginPath(); c.moveTo(P[0][0], P[0][1]); edge(P);
    c.stroke();
    c.save(); c.translate(0, -th * 0.08);
    c.strokeStyle = rgb(sc.top); c.lineWidth = Math.max(0.8, th * 0.2);
    c.beginPath(); c.moveTo(P[0][0], P[0][1]); edge(P); c.stroke();
    c.restore();
  });
}

function lingrad(c, x0, y0, x1, y1, stops) {
  var g = c.createLinearGradient(x0, y0, x1, y1);
  stops.forEach(function (st) { g.addColorStop(st[0], rgb(st[1], st[2])); });
  return g;
}
/* ---------------------------------------------------------------
   A pool of warm lamplight on the snow: o: x, y (its middle), rx, ry,
   strength, colour
   --------------------------------------------------------------- */
function pool(c, o) {
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.translate(o.x, o.y); c.scale(o.rx, o.ry);
  var g = c.createRadialGradient(0, 0, 0, 0, 0, 1), col = o.colour || [255, 170, 80];
  g.addColorStop(0, rgb(col, 0.5 * o.strength)); g.addColorStop(0.4, rgb(col, 0.22 * o.strength)); g.addColorStop(1, rgb(col, 0));
  c.fillStyle = g; c.fillRect(-1, -1, 2, 2);
  c.restore();
}

return { outlines: function (L) { return L.map(function (F) { return slabOutline(F).P; }); }, polyDist: function (A, B) { return polyDist(A, B); },
         slabs: slabs, pool: pool, hill: hill, hillTop: hillTop, mistBand: mistBand, ropes: ropes, path: path, banks: banks };
})();
