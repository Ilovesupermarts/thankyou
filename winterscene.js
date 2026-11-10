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
  return { top: S(sn, S.side * 0.35, 1, 0.45), side: S(sn, S.side * 0.6, 0.3, 0.8), shade: S(sn, -S.side * 0.5, 0.2, 0.8, 0.1) };
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
  c.fillStyle = rgb(sc.shade, 0.13); c.fill();
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
  // the stones: one every few steps farther away (the same distance on the ground each time), each
  // lying square to you as stepping stones are set, now and then a pair side by side
  function xAtZ(Z) {
    for (var j = 1; j < G.length - 1 && G[j][1] < Z; j++);
    var f = clamp((Z - G[j - 1][1]) / (G[j][1] - G[j - 1][1] || 1), 0, 1);
    return lerp(G[j - 1][0], G[j][0], f);
  }
  var stones = [], Zend = G[G.length - 1][1];
  for (var Z = G[0][1] + o.depth * 0.5; Z < Zend; Z += (o.depth + o.gap) * lerp(0.92, 1.08, r())) {
    var X = xAtZ(Z), w = o.size * lerp(0.85, 1.1, r()), dp = o.depth * lerp(0.85, 1.1, r());
    if (r() < 0.28) {
      var w2 = w * 0.5;
      stones.push({ X: X - w2 * 0.56, Z: Z + dp * 0.08, ux: 0, uz: 1, w: w2, dp: dp * 0.95 });
      stones.push({ X: X + w2 * 0.56, Z: Z - dp * 0.08, ux: 0, uz: 1, w: w2, dp: dp * 0.95 });
    } else stones.push({ X: X + (r() - 0.5) * o.size * 0.2, Z: Z, ux: 0, uz: 1, w: w, dp: dp });
  }
  stones.sort(function (a, b) { return b.Z - a.Z; });             // the farthest first
  var slate = [150, 155, 170];
  stones.forEach(function (St) {
    // its outline on the ground: a softly squared slab, a little uneven, turned with the path
    var n = 20, pts = [], rot = (r() - 0.5) * 0.18, ca = Math.cos(rot), sa = Math.sin(rot);
    var ax = -St.uz, az = St.ux;                                 // across the path
    for (k = 0; k < n; k++) {
      var a = k / n * TAU, cA = Math.cos(a), sA = Math.sin(a);
      var u = Math.pow(Math.abs(cA), 0.42) * (cA < 0 ? -1 : 1) * St.w / 2 * lerp(0.9, 1.06, r());
      var v = Math.pow(Math.abs(sA), 0.42) * (sA < 0 ? -1 : 1) * St.dp / 2 * lerp(0.88, 1.08, r());
      var uu = u * ca - v * sa, vv = u * sa + v * ca;
      pts.push(toScreen(St.X + ax * uu + St.ux * vv, St.Z + az * uu + St.uz * vv));
    }
    var C = toScreen(St.X, St.Z), q = (C[1] - hy) / D, edge = Math.max(0.6, D * 0.012 * q);
    // sunk in the snow: a soft blue hollow round it
    c.save();
    c.filter = 'blur(' + Math.max(0.5, edge * 1.2).toFixed(1) + 'px)';
    c.fillStyle = rgb(sc.shade, 0.5);
    c.beginPath(); pts.forEach(function (p, m) { var x = C[0] + (p[0] - C[0]) * 1.08, y = C[1] + (p[1] - C[1]) * 1.15 + edge * 0.5; m ? c.lineTo(x, y) : c.moveTo(x, y); }); c.closePath(); c.fill();
    c.restore();
    // the slab: its top lit by the sky, its edge toward you darker
    c.save();
    c.beginPath(); pts.forEach(function (p, m) { m ? c.lineTo(p[0], p[1] + edge) : c.moveTo(p[0], p[1] + edge); }); c.closePath();
    c.fillStyle = rgb(S(scale(slate, 0.5), 0, 0.2, 1, 0.4)); c.fill();
    c.beginPath(); pts.forEach(function (p, m) { m ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); }); c.closePath();
    var top = Math.min.apply(null, pts.map(function (p) { return p[1]; })), bot = Math.max.apply(null, pts.map(function (p) { return p[1]; }));
    c.fillStyle = lingrad(c, 0, top, 0, bot, [[0, mix(scale(slate, S.bright * 0.8), S(slate, 0, 1, 0.4, 0.7), 0.5)], [1, mix(scale(slate, S.bright * 0.62), S(scale(slate, 0.75), 0, 1, 0.4, 0.5), 0.5)]]);
    c.fill();
    c.clip();
    // a light rim along its far edge, a dusting of snow
    c.strokeStyle = rgb(scale(slate, S.bright * 1.15), 0.5); c.lineWidth = edge * 0.8;
    c.beginPath(); c.moveTo(pts[n / 2 + 1][0], pts[n / 2 + 1][1] + edge * 0.4);
    for (k = n / 2 + 2; k < n; k++) c.lineTo(pts[k][0], pts[k][1] + edge * 0.4);
    c.stroke();
    // a thin edge of snow along its far side
    c.strokeStyle = rgb(sc.top, 0.55); c.lineWidth = Math.max(0.5, edge * 0.6);
    c.beginPath(); c.moveTo(pts[n / 2 + 2][0], pts[n / 2 + 2][1]);
    for (k = n / 2 + 3; k < n - 1; k++) c.lineTo(pts[k][0], pts[k][1]);
    c.stroke();
    c.restore();
  });
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

return { pool: pool, hill: hill, hillTop: hillTop, mistBand: mistBand, ropes: ropes, path: path, banks: banks };
})();
