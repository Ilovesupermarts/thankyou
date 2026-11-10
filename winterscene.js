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
  // the stones, as a mason sets a path: one after another along it with uneven gaps, each piece its
  // own size and shape; here one long slab across the path, there two or three smaller pieces side by
  // side, sometimes a short one set off to one side; each turned a little, and the line of them
  // wandering a little either side of the middle. Their long side is turned partly across the path
  // and partly square to you, as in the picture.
  var stones = [], step;
  function lay(X, Z, w, dp, rot) { stones.push({ X: X, Z: Z, w: w, dp: dp, rot: rot }); }
  // with the nearest slabs set where the reference has them (o.fixed), the stones along the path start just
  // beyond them: at the first point past the leftmost of them, the first stone's right end a small gap from it
  var t0 = o.depth * 0.5, fit = false, lx = 0, gapPx = 0;
  if (o.fixed && o.fixed.length) {
    var ly = 0; lx = 1e9;
    o.fixed.forEach(function (F) { F.forEach(function (p) { if (p[0] < lx) { lx = p[0]; ly = p[1]; } }); });
    gapPx = D * o.gap * 0.5; fit = true;
    for (var ts = 0; ts < total; ts += total / 400) {
      var P0 = at(ts), C1 = toScreen(P0.X, P0.Z), hw0 = o.size * 0.55 * D / P0.Z;
      if (C1[0] + hw0 < lx - gapPx && C1[1] < ly + D * 0.1) { t0 = ts; break; }
    }
  }
  for (var tt = t0; tt < total; tt += step) {
    var Q = at(tt), before = stones.length;
    var ax = 1, az = 0;                                        // their long side level, square on to you
    var kind = r(), dp = o.depth * lerp(0.75, 1.25, r()), wob = (r() - 0.5) * o.size * 0.22, rot0 = (r() - 0.5) * 0.22;
    var cx0 = Q.X + ax * wob, cz0 = Q.Z + az * wob;
    var away = Math.abs(Q.uz) > 0.75;                          // groups of pieces only where the path runs away from you
    if (!away && kind >= 0.5) kind = kind < 0.62 ? 0.6 : kind < 0.8 ? 0.2 : 0.9;     // in the sweep: mostly single slabs, now and then a pair
    if (kind < 0.5) {                                          // one long slab
      var w = o.size * lerp(0.7, 1.25, r());
      lay(cx0, cz0, w, dp, Math.atan2(az, ax) + rot0);
    } else if (kind < 0.8) {                                   // two pieces side by side, different sizes
      var wa = o.size * lerp(0.42, 0.62, r()), wb = o.size * lerp(0.38, 0.6, r()), gp = o.size * lerp(0.04, 0.1, r());
      lay(cx0 - ax * (wb + gp) / 2, cz0 - az * (wb + gp) / 2 + dp * (r() - 0.5) * 0.3, wa, dp * lerp(0.8, 1.1, r()), Math.atan2(az, ax) + (r() - 0.5) * 0.4);
      lay(cx0 + ax * (wa + gp) / 2, cz0 + az * (wa + gp) / 2 + dp * (r() - 0.5) * 0.3, wb, dp * lerp(0.8, 1.1, r()), Math.atan2(az, ax) + (r() - 0.5) * 0.4);
    } else if (kind < 0.88) {                                  // three small pieces
      var w3 = o.size * lerp(0.3, 0.4, r());
      for (var m = -1; m <= 1; m++) lay(cx0 + ax * m * w3 * 1.12, cz0 + az * m * w3 * 1.12 + dp * (r() - 0.5) * 0.35, w3 * lerp(0.85, 1.1, r()), dp * lerp(0.75, 1, r()), Math.atan2(az, ax) + (r() - 0.5) * 0.5);
    } else {                                                   // a short piece, set off to one side
      var sd = r() < 0.5 ? -1 : 1, w4 = o.size * lerp(0.5, 0.7, r());
      lay(cx0 + ax * sd * o.size * 0.18, cz0 + az * sd * o.size * 0.18, w4, dp * lerp(0.8, 1.05, r()), Math.atan2(az, ax) + rot0);
    }
    // the first one past the fixed slabs: moved across so its right end is a small gap from the leftmost of
    // them (by its real width), so no gap opens there
    if (fit) {
      fit = false;
      var maxR = -1e9;
      for (var q0 = before; q0 < stones.length; q0++) {
        var Sq = stones[q0], Cq = toScreen(Sq.X, Sq.Z); maxR = Math.max(maxR, Cq[0] + Sq.w / 2 * D / Sq.Z);
      }
      for (q0 = before; q0 < stones.length; q0++) stones[q0].X += (lx - gapPx - maxR) * stones[q0].Z / D;
    }
    // the next one goes only as far on as it needs to clear this one, with a small gap: a step back
    // (its depth) or a step to the side (its width), whichever is shorter along the path's way here. Where
    // the path sweeps across, the stones stack up it, each behind the last and overlapping it sideways,
    // as in the reference; where it runs away from you, one behind another. It changes smoothly.
    var gp = o.gap * lerp(0.5, 1.7, r());
    step = Math.min((dp * 0.85 + gp) / Math.max(0.05, Math.abs(Q.uz)), (o.size * 1.05 + gp) / Math.max(0.05, Math.abs(Q.ux)));
  }
  // the nearest slabs are set where the reference has them (o.fixed): the stones laid along the path keep clear of them
  var fixed = o.fixed || [];
  if (fixed.length) {
    var boxes = fixed.map(function (F) {
      var xs = F.map(function (p) { return p[0]; }), ys = F.map(function (p) { return p[1]; });
      var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
      return [x0, x1, y0, y1];
    });
    stones = stones.filter(function (St) {
      // (each kept stone is first moved up to a hair's gap from a fixed slab it would touch, so no gap opens)
      var C0 = toScreen(St.X, St.Z), hw = St.w / 2 * D / St.Z * 0.9, hd = St.dp / 2 * D / (St.Z * St.Z) * 0.9;
      for (var j = 0; j < boxes.length; j++) {
        var B = boxes[j];
        if (C0[0] + hw > B[0] && C0[0] - hw < B[1] && C0[1] + hd > B[2] && C0[1] - hd < B[3]) return false;
      }
      return C0[1] - hd < o.yb;                                   // and none wholly below the screen
    });
  }
  stones.sort(function (a, b) { return b.Z - a.Z; });             // the farthest first
  var slate = [196, 202, 216];
  stones.forEach(function (St) {
    // its outline on the ground: a slab with rounded, uneven corners and slightly bowed sides, each
    // corner its own roundness, turned as it was laid
    var n = 24, pts = [], ca = Math.cos(St.rot), sa = Math.sin(St.rot), cr = [lerp(0.15, 0.45, r()), lerp(0.15, 0.45, r()), lerp(0.15, 0.45, r()), lerp(0.15, 0.45, r())];
    var bow = [(r() - 0.4) * 0.12, (r() - 0.4) * 0.12, (r() - 0.4) * 0.12, (r() - 0.4) * 0.12];
    for (k = 0; k < n; k++) {
      var a = k / n * TAU, cA = Math.cos(a), sA = Math.sin(a), qd = (cA >= 0 ? (sA >= 0 ? 0 : 3) : (sA >= 0 ? 1 : 2));
      var pw = lerp(0.22, 0.6, cr[qd] / 0.45);                 // the corner: squarer (low) … rounder (high)
      var u = Math.pow(Math.abs(cA), pw) * (cA < 0 ? -1 : 1) * St.w / 2;
      var v = Math.pow(Math.abs(sA), pw) * (sA < 0 ? -1 : 1) * St.dp / 2;
      u *= 1 + bow[(qd + (Math.abs(sA) > Math.abs(cA) ? 1 : 0)) % 4] * Math.abs(sA);
      v *= 1 + bow[(qd + 2) % 4] * Math.abs(cA) + (r() - 0.5) * 0.05;
      var uu = u * ca - v * sa, vv = u * sa + v * ca;          // (u across, v along the ground's depth)
      pts.push(toScreen(St.X + uu, St.Z + vv));
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
    // brushed texture: a few faint lighter and darker streaks across it
    var hh = bot - top, wl = Math.max.apply(null, pts.map(function (p) { return p[0]; })) - Math.min.apply(null, pts.map(function (p) { return p[0]; }));
    for (k = 0; k < 4; k++) {
      c.strokeStyle = rgb(k % 2 ? scale(slate, S.bright * 1.08) : scale(slate, S.bright * 0.62), 0.09);
      c.lineWidth = Math.max(0.4, Math.min(hh * lerp(0.04, 0.09, r()), 2.5));
      var sy = lerp(top, bot, lerp(0.2, 0.8, r())), sx = C[0] + (r() - 0.5) * wl * 0.3;
      c.beginPath(); c.moveTo(sx - wl * lerp(0.2, 0.4, r()), sy); c.lineTo(sx + wl * lerp(0.2, 0.4, r()), sy + (r() - 0.5) * hh * 0.2); c.stroke();
    }
    // its far edge (the side away from you, the upper one on the screen): a light rim, a thin line of snow
    var far = [];
    for (k = 0; k < n; k++) far.push(pts[k][1] < C[1] - hh * 0.12);
    var st0 = 0;
    for (k = 0; k < n; k++) if (far[k] && !far[(k + n - 1) % n]) { st0 = k; break; }
    var run = [];
    for (k = 0; k < n && far[(st0 + k) % n]; k++) run.push(pts[(st0 + k) % n]);
    if (run.length > 1) {
      c.strokeStyle = rgb(scale(slate, S.bright * 1.2), 0.55); c.lineWidth = Math.max(0.6, edge * 0.9);
      c.beginPath(); c.moveTo(run[0][0], run[0][1] + edge * 0.5);
      for (k = 1; k < run.length; k++) c.lineTo(run[k][0], run[k][1] + edge * 0.5);
      c.stroke();
      c.strokeStyle = rgb(sc.top, 0.6); c.lineWidth = Math.max(0.5, edge * 0.55);
      c.beginPath(); c.moveTo(run[0][0], run[0][1]);
      for (k = 1; k < run.length; k++) c.lineTo(run[k][0], run[k][1]);
      c.stroke();
    }
    c.restore();
  });
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
function slab(c, F, S, sc) {
  var len = 0;                                                 // its longest side
  for (var e = 0; e < 4; e++) len = Math.max(len, Math.hypot(F[(e + 1) % 4][0] - F[e][0], F[(e + 1) % 4][1] - F[e][1]));
  var th = Math.max(1.5, len * 0.028);
  function rounded(P, rad) {
    c.beginPath();
    for (var i = 0; i < P.length; i++) {
      var a = P[(i + P.length - 1) % P.length], b = P[i], e = P[(i + 1) % P.length];
      var la = Math.hypot(a[0] - b[0], a[1] - b[1]), le = Math.hypot(e[0] - b[0], e[1] - b[1]), k = Math.min(rad, la * 0.4, le * 0.4);
      var p0 = [b[0] + (a[0] - b[0]) * k / la, b[1] + (a[1] - b[1]) * k / la], p1 = [b[0] + (e[0] - b[0]) * k / le, b[1] + (e[1] - b[1]) * k / le];
      if (i === 0) c.moveTo(p0[0], p0[1]); else c.lineTo(p0[0], p0[1]);
      c.quadraticCurveTo(b[0], b[1], p1[0], p1[1]);
    }
    c.closePath();
  }
  function shift(P, dy) { return P.map(function (p) { return [p[0], p[1] + dy]; }); }
  var rad = len * 0.08, slate = [138, 142, 160], br = S.bright;
  function col(base, k) { return mix(scale(base, br * k), S(scale(base, k), 0, 1, 0.5, 0.6), 0.35); }
  var top = shift(F, -th * 0.4), Lc = top[0], Tc = top[1], Rc = top[2], Bc = top[3];
  // the soft blue shadow on the snow round it
  c.save();
  c.filter = 'blur(' + (th * 2).toFixed(1) + 'px)';
  rounded([[Lc[0] - th * 1.5, Lc[1] + th], [Tc[0], Tc[1] + th * 0.5], [Rc[0] + th * 1.5, Rc[1] + th * 1.2], [Bc[0], Bc[1] + th * 2.2]], rad);
  c.fillStyle = rgb(sc.shade, 0.7); c.fill();
  c.restore();
  // the thin dark edge toward you: the outline a little lower, nearly black-blue
  rounded(shift(F, th * 0.6), rad);
  c.fillStyle = rgb(col([52, 54, 66], 1)); c.fill();
  // the top face
  c.save();
  rounded(top, rad);
  var g = c.createLinearGradient(Tc[0], Tc[1], Bc[0], Bc[1]);
  g.addColorStop(0, rgb(col(slate, 1.1))); g.addColorStop(0.6, rgb(col(slate, 0.98))); g.addColorStop(1, rgb(col(slate, 0.86)));
  c.fillStyle = g; c.fill();
  c.clip();
  // mottled, as painted: soft lighter and darker patches, longer along the stone
  var r = rng(Math.round(Tc[0] * 7 + Tc[1] * 13)), ux = (Rc[0] - Bc[0]) / len, uy = (Rc[1] - Bc[1]) / len, ang = Math.atan2(uy, ux);
  var wid = Math.hypot(Lc[0] - Bc[0], Lc[1] - Bc[1]);
  c.filter = 'blur(' + Math.max(0.6, wid * 0.06).toFixed(1) + 'px)';
  for (var k = 0; k < 22; k++) {
    var t = r(), v = r();
    var px = lerp(lerp(Lc[0], Bc[0], v), lerp(Tc[0], Rc[0], v), t), py = lerp(lerp(Lc[1], Bc[1], v), lerp(Tc[1], Rc[1], v), t);
    c.fillStyle = rgb(col(slate, r() < 0.55 ? 1.32 : 0.72), lerp(0.2, 0.42, r()));
    c.beginPath(); c.ellipse(px, py, len * lerp(0.04, 0.12, r()), wid * lerp(0.08, 0.2, r()), ang, 0, TAU); c.fill();
  }
  c.filter = 'none';
  // a soft light rim along the far edges, where the sky catches it
  c.lineCap = 'round'; c.lineJoin = 'round';
  c.strokeStyle = rgb(col(slate, 1.4), 0.45); c.lineWidth = Math.max(1, th * 0.9);
  c.beginPath(); c.moveTo(Lc[0], Lc[1]); c.lineTo(Tc[0], Tc[1]); c.lineTo(Rc[0], Rc[1]); c.stroke();
  c.restore();
  // a fine dark inked line round the top face
  rounded(top, rad);
  c.strokeStyle = rgb(col([52, 54, 66], 1), 0.55); c.lineWidth = Math.max(0.6, th * 0.3); c.stroke();
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

return { slabs: slabs, pool: pool, hill: hill, hillTop: hillTop, mistBand: mistBand, ropes: ropes, path: path, banks: banks };
})();
