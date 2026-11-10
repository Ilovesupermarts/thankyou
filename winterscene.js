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
  return { side0: S.side, top: S(sn, S.side * 0.35, 1, 0.45), side: S(sn, S.side * 0.6, 0.3, 0.8), shade: S(sn, -S.side * 0.5, 0.2, 0.8, 0.1) };
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
    (o.fitTo || o.fixed).forEach(function (F) { F.forEach(function (p) { if (p[0] < lx) { lx = p[0]; ly = p[1]; } }); });
    gapPx = D * o.gap * 0.5; fit = true;
    for (var ts = 0; ts < total; ts += total / 400) {
      var P0 = at(ts), C1 = toScreen(P0.X, P0.Z), hw0 = o.size * 0.55 * D / P0.Z;
      if (C1[0] + hw0 < lx - gapPx && C1[1] < ly + D * 0.1) { t0 = ts; break; }
    }
  }
  for (var tt = t0; tt < total; tt += step) {
    var Q = at(tt), before = stones.length;
    var ax = 1, az = 0;                                        // their long side level, square on to you
    var kind = r(), dp = o.depth * lerp(0.75, 1.25, r()), wob = (r() - 0.5) * o.size * 0.22, rot0 = (r() - 0.5) * 0.1;
    var cx0 = Q.X + ax * wob, cz0 = Q.Z + az * wob;
    var away = Math.abs(Q.uz) > 0.75;                          // groups of pieces only where the path runs away from you
    if (!away && kind >= 0.5) kind = kind < 0.62 ? 0.6 : kind < 0.8 ? 0.2 : 0.9;     // in the sweep: mostly single slabs, now and then a pair
    if (kind < 0.5) {                                          // one long slab
      var w = o.size * lerp(0.7, 1.25, r());
      lay(cx0, cz0, w, dp, Math.atan2(az, ax) + rot0);
    } else if (kind < 0.8) {                                   // two pieces side by side, different sizes
      var wa = o.size * lerp(0.42, 0.62, r()), wb = o.size * lerp(0.38, 0.6, r()), gp = o.size * lerp(0.04, 0.1, r());
      lay(cx0 - ax * (wb + gp) / 2, cz0 - az * (wb + gp) / 2 + dp * (r() - 0.5) * 0.3, wa, dp * lerp(0.8, 1.1, r()), Math.atan2(az, ax) + (r() - 0.5) * 0.14);
      lay(cx0 + ax * (wa + gp) / 2, cz0 + az * (wa + gp) / 2 + dp * (r() - 0.5) * 0.3, wb, dp * lerp(0.8, 1.1, r()), Math.atan2(az, ax) + (r() - 0.5) * 0.14);
    } else if (kind < 0.88) {                                  // three small pieces
      var w3 = o.size * lerp(0.3, 0.4, r());
      for (var m = -1; m <= 1; m++) lay(cx0 + ax * m * w3 * 1.12, cz0 + az * m * w3 * 1.12 + dp * (r() - 0.5) * 0.35, w3 * lerp(0.85, 1.1, r()), dp * lerp(0.75, 1, r()), Math.atan2(az, ax) + (r() - 0.5) * 0.16);
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
    // drawn as the nearest slabs are (WinterScene.slabs): the same slate, edge, mottle, rim and shadow
    slabPoly(c, pts, S, sc, Math.round(St.X * 997 + St.Z * 131));
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
/* The same look for a stone given as an outline of many points on the screen (the stones along the path). */
function slabPoly(c, P, S, sc, seed) {
  var xs = P.map(function (p) { return p[0]; }), ys = P.map(function (p) { return p[1]; });
  var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
  var len = x1 - x0, wid = y1 - y0, th = Math.max(1, Math.min(len * 0.028, wid * 0.18)), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  var slate = [138, 142, 160], br = S.bright;
  function col(base, k) { return mix(scale(base, br * k), S(scale(base, k), 0, 1, 0.5, 0.6), 0.35); }
  function path(dy, k) { c.beginPath(); P.forEach(function (p, i) { var x = cx + (p[0] - cx) * k, y = cy + (p[1] - cy) * k + dy; i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.closePath(); }
  // a light blue shadow on the snow round it, close to the stone (it sits in the snow, it does not float)
  c.save(); c.filter = 'blur(' + Math.max(0.6, th * 1.5).toFixed(1) + 'px)';
  path(th * 0.5, 1.04); c.fillStyle = rgb(sc.shade, 0.45); c.fill(); c.restore();
  grime(c, P, cx, cy, len, wid, rng(seed + 7));
  // its edge toward you: a thin band of darker slate (not black)
  path(th * 0.35, 1); c.fillStyle = rgb(col(slate, 0.62)); c.fill();
  c.save();
  path(-th * 0.4, 1);
  var g = c.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, rgb(col(slate, 1.1))); g.addColorStop(0.6, rgb(col(slate, 0.98))); g.addColorStop(1, rgb(col(slate, 0.86)));
  c.fillStyle = g; c.fill();
  c.clip();
  var r = rng(seed);
  var k;
  frost(c, P, x0, y0, x1, y1, wid, sc, r);
  // the soft light rim along the far (upper) edge
  c.strokeStyle = rgb(col(slate, 1.4), 0.45); c.lineWidth = Math.max(0.7, th * 0.9);
  c.beginPath(); var st = false;
  P.forEach(function (p) { if (p[1] < cy) { st ? c.lineTo(p[0], p[1] - th * 0.4) : c.moveTo(p[0], p[1] - th * 0.4); st = true; } });
  c.stroke();
  c.restore();
  // a crisp dark inked line round the top face, as painted
  path(-th * 0.4, 1); c.strokeStyle = rgb(col(slate, 0.32), 0.8); c.lineWidth = Math.max(0.7, th * 0.35); c.stroke();
  snowRim(c, P, cx, cy, len, wid, sc, r);
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
    c.fillStyle = rgb(r() < 0.6 ? [150, 152, 164] : [128, 130, 144], lerp(0.12, 0.28, r()));
    c.beginPath(); c.ellipse(p[0] + (p[0] - cx) * 0.03, p[1] + rr * 0.8, rr * lerp(1.5, 3, r()), rr * 0.55, 0, 0, TAU); c.fill();
  }
  // trodden: a grey boot print or two pressed into the snow beside it
  for (i = 0; i < 2; i++) {
    if (r() < 0.45) continue;
    var bp = P[Math.floor(r() * P.length)], bx = cx + (bp[0] - cx) * 1.3, by = cy + (bp[1] - cy) * 1.4 + wid * 0.1;
    var bw = Math.max(2, wid * 0.22), bh = bw * 0.38;
    c.fillStyle = rgb([150, 156, 172], 0.35);
    c.beginPath(); c.ellipse(bx, by, bw, bh, (r() - 0.5) * 0.4, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(bx + bw * 1.5, by + bh * 0.2, bw * 0.55, bh * 0.85, 0, 0, TAU); c.fill();
  }
  // grit: small dark specks scattered in the trodden snow just round it
  c.filter = 'none';
  for (i = 0; i < Math.round(len / 8); i++) {
    var q = P[Math.floor(r() * P.length)], d = Math.max(0.6, wid * lerp(0.015, 0.04, r()));
    var out = lerp(0.02, 0.18, r());
    c.fillStyle = rgb(r() < 0.5 ? [120, 120, 132] : [100, 102, 116], lerp(0.15, 0.35, r()));
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
  // the wet band just inside the edge, uneven
  c.filter = 'blur(' + Math.max(0.5, wid * 0.05).toFixed(1) + 'px)';
  c.lineJoin = 'round';
  c.strokeStyle = rgb([46, 48, 60], 0.35); c.lineWidth = Math.max(1.5, wid * 0.22);
  outline(); c.stroke();
  c.filter = 'none';
  // a fine crack or two
  c.strokeStyle = rgb([40, 42, 52], 0.55); c.lineWidth = Math.max(0.5, wid * 0.018);
  for (k = 0; k < (len > 40 ? 2 : 1); k++) {
    if (r() < 0.35) continue;
    var a0 = P[Math.floor(r() * n)], x = a0[0], y = a0[1];
    c.beginPath(); c.moveTo(x, y);
    var steps = 4 + Math.floor(r() * 4), dx = (cx - x) / steps * lerp(0.4, 0.9, r()), dy = (cy - y) / steps * lerp(0.4, 0.9, r());
    for (var st = 0; st < steps; st++) { x += dx + (r() - 0.5) * len * 0.05; y += dy + (r() - 0.5) * wid * 0.12; c.lineTo(x, y); }
    c.stroke();
  }
  // moss in the edge, a few dull green-grey tufts
  for (k = 0; k < Math.round(len / 25); k++) {
    if (r() < 0.5) continue;
    var m = P[Math.floor(r() * n)], mr = Math.max(0.8, wid * lerp(0.04, 0.09, r()));
    for (var t = 0; t < 6; t++) {
      c.fillStyle = rgb(r() < 0.5 ? [92, 104, 72] : [74, 86, 62], lerp(0.4, 0.75, r()));
      c.fillRect(m[0] + (r() - 0.5) * mr * 3, m[1] + (r() - 0.5) * mr * 1.5, mr * 0.7, mr * 0.7);
    }
  }
  // patches of packed snow lying on its top, kept inside the stone (its dark edge shows all round them):
  // each lit like a soft mound of snow, bright on its sunny top, cooling to blue on its lower side, its
  // edge thinning out into the stone (no hard cut), a fine glittering grain
  c.restore();
  c.save();
  c.beginPath();                                               // the stone's top shrunk a little: the patches stay inside it
  P.forEach(function (p, j) { var x = cx + (p[0] - cx) * 0.9, y = cy + (p[1] - cy) * 0.8; j ? c.lineTo(x, y) : c.moveTo(x, y); });
  c.closePath(); c.clip();
  var patches = 1 + Math.floor(r() * 2) + (len > 60 ? 1 : 0);
  for (k = 0; k < patches; k++) {
    var corner = r() < 0.6, idx;
    if (corner) {                                               // toward a corner in some direction
      var dir = r() * TAU, best = -1e9;
      for (i = 0; i < n; i++) { var v = (P[i][0] - cx) * Math.cos(dir) / len + (P[i][1] - cy) * Math.sin(dir) / wid; if (v > best) { best = v; idx = i; } }
    } else idx = Math.floor(r() * n);
    var A = P[idx];
    var mx = lerp(A[0], cx, 0.42), my = lerp(A[1], cy, 0.45);
    var rx = len * lerp(0.06, 0.13, r()), ry = wid * lerp(0.12, 0.22, r()), pts = [], q = 13;
    for (i = 0; i < q; i++) {
      var ang = i / q * TAU, rr = lerp(0.72, 1.12, r());
      pts.push([mx + Math.cos(ang) * rx * rr, my + Math.sin(ang) * ry * rr]);
    }
    function blob(dx, dy, k2) {
      c.beginPath();
      var f = function (p) { return [mx + (p[0] - mx) * k2 + dx, my + (p[1] - my) * k2 + dy]; };
      var p0 = f(pts[q - 1]), p1 = f(pts[0]);
      c.moveTo((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2);
      for (var j = 0; j < q; j++) { var a1 = f(pts[j]), b1 = f(pts[(j + 1) % q]); c.quadraticCurveTo(a1[0], a1[1], (a1[0] + b1[0]) / 2, (a1[1] + b1[1]) / 2); }
      c.closePath();
    }
    // its soft blue shadow on the stone, just below it
    c.save(); c.filter = 'blur(' + Math.max(0.5, ry * 0.25).toFixed(1) + 'px)';
    blob(0, ry * 0.15, 1.0); c.fillStyle = rgb(mix([60, 66, 92], sc.shade, 0.5), 0.2); c.fill();
    c.restore();
    // the mound: a feathered edge (blurred a little), lit from above and toward the light
    c.save(); c.filter = 'blur(' + Math.max(0.35, ry * 0.08).toFixed(1) + 'px)';
    blob(0, 0, 1);
    var gx = mx + rx * 0.3 * S0side, gy = my - ry * 0.45;
    var gr = c.createRadialGradient(gx, gy, 0, mx, my, Math.max(rx, ry) * 1.15);
    gr.addColorStop(0, rgb(mix(sc.top, [255, 255, 255], 0.4))); gr.addColorStop(0.45, rgb(sc.top)); gr.addColorStop(0.8, rgb(mix(sc.top, sc.shade, 0.5)));
    gr.addColorStop(1, rgb(sc.shade, 0.6));
    c.fillStyle = gr; c.fill();
    c.restore();
    // fine grain and a few glints
    c.save(); blob(0, 0, 0.95); c.clip();
    for (i = 0; i < Math.round(rx * ry * 0.25); i++) {
      var sx = mx + (r() - 0.5) * rx * 2, sy = my + (r() - 0.5) * ry * 2, d2 = Math.max(0.4, ry * 0.05);
      c.fillStyle = r() < 0.5 ? rgb(sc.shade, 0.18) : rgb([255, 255, 255], 0.5);
      c.fillRect(sx, sy, d2, d2);
    }
    c.restore();
  }
  c.restore();
  // on the snow round it: small pebbles, and now and then a dry fallen leaf
  for (k = 0; k < 1 + Math.round(len / 50); k++) {
    var e = P[Math.floor(r() * n)], out = lerp(1.04, 1.25, r());
    var px = cx + (e[0] - cx) * out, py = cy + (e[1] - cy) * out + wid * 0.05, pr = Math.max(0.6, wid * lerp(0.025, 0.06, r()));
    c.fillStyle = rgb(r() < 0.5 ? [104, 106, 116] : [128, 128, 136]);
    c.beginPath(); c.ellipse(px, py, pr * 1.3, pr, r() * PI, 0, TAU); c.fill();
    c.fillStyle = rgb([235, 236, 242], 0.7);
    c.beginPath(); c.ellipse(px - pr * 0.3, py - pr * 0.35, pr * 0.5, pr * 0.3, 0, 0, TAU); c.fill();
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
/* Frost on the stone's top, as painted: grainy white dry-brush patches, denser toward its back and
   its ends, the slate showing through. Drawn inside the stone's clip. */
function frost(c, P, x0, y0, x1, y1, wid, sc, r) {
  var len = x1 - x0, area = len * wid;
  var patches = 2 + Math.floor(len / 45);
  for (var q = 0; q < patches; q++) {
    var px = lerp(x0, x1, r()), py = lerp(y0, y1, Math.pow(r(), 1.6)), rx = len * lerp(0.12, 0.3, r()), ry = wid * lerp(0.25, 0.5, r());
    var n = Math.round(Math.min(400, rx * ry * 0.5));
    for (var i = 0; i < n; i++) {
      var a = r() * TAU, d = Math.sqrt(r());
      var gx = px + Math.cos(a) * rx * d, gy = py + Math.sin(a) * ry * d, s0 = Math.max(0.5, wid * lerp(0.012, 0.035, r()));
      c.fillStyle = rgb(sc.top, lerp(0.08, 0.35, r()) * (1 - d * 0.7));
      c.fillRect(gx, gy, s0 * lerp(1, 3.5, r()), s0);
    }
  }
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
  var rad = len * 0.12, slate = [138, 142, 160], br = S.bright;
  function col(base, k) { return mix(scale(base, br * k), S(scale(base, k), 0, 1, 0.5, 0.6), 0.35); }
  var top = shift(F, -th * 0.4), Lc = top[0], Tc = top[1], Rc = top[2], Bc = top[3];
  // the soft blue shadow on the snow round it
  c.save();
  c.filter = 'blur(' + (th * 1.5).toFixed(1) + 'px)';
  rounded([[Lc[0] - th * 0.8, Lc[1] + th * 0.6], [Tc[0], Tc[1] + th * 0.3], [Rc[0] + th * 0.8, Rc[1] + th * 0.7], [Bc[0], Bc[1] + th * 1.1]], rad);
  c.fillStyle = rgb(sc.shade, 0.45); c.fill();
  c.restore();
  var gp = [], gm;
  for (gm = 0; gm < 4; gm++) for (var gu = 0; gu < 1; gu += 0.08) gp.push([lerp(F[gm][0], F[(gm + 1) % 4][0], gu), lerp(F[gm][1], F[(gm + 1) % 4][1], gu)]);
  var gxs = gp.map(function (q) { return q[0]; }), gys = gp.map(function (q) { return q[1]; });
  var gx0 = Math.min.apply(null, gxs), gx1 = Math.max.apply(null, gxs), gy0 = Math.min.apply(null, gys), gy1 = Math.max.apply(null, gys);
  grime(c, gp, (gx0 + gx1) / 2, (gy0 + gy1) / 2, gx1 - gx0, gy1 - gy0, rng(Math.round(gx0 * 3 + gy0 * 5)));
  // its edge toward you: a thin band of darker slate (not black)
  rounded(shift(F, th * 0.35), rad);
  c.fillStyle = rgb(col(slate, 0.62)); c.fill();
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
  var Fx = top.map(function (q) { return q[0]; }), Fy = top.map(function (q) { return q[1]; });
  frost(c, top, Math.min.apply(null, Fx), Math.min.apply(null, Fy), Math.max.apply(null, Fx), Math.max.apply(null, Fy), wid, sc, r);
  // a soft light rim along the far edges, where the sky catches it
  c.lineCap = 'round'; c.lineJoin = 'round';
  c.strokeStyle = rgb(col(slate, 1.4), 0.45); c.lineWidth = Math.max(1, th * 0.9);
  c.beginPath(); c.moveTo(Lc[0], Lc[1]); c.lineTo(Tc[0], Tc[1]); c.lineTo(Rc[0], Rc[1]); c.stroke();
  c.restore();
  // a fine dark inked line round the top face
  rounded(top, rad);
  c.strokeStyle = rgb(col(slate, 0.32), 0.8); c.lineWidth = Math.max(0.8, th * 0.35); c.stroke();
  // snow drifted against its sides and front
  var pts = [], m;
  for (m = 0; m < 4; m++) for (var u = 0; u < 1; u += 0.1) pts.push([lerp(F[m][0], F[(m + 1) % 4][0], u), lerp(F[m][1], F[(m + 1) % 4][1], u)]);
  var xs2 = pts.map(function (p) { return p[0]; }), ys2 = pts.map(function (p) { return p[1]; });
  var bx0 = Math.min.apply(null, xs2), bx1 = Math.max.apply(null, xs2), by0 = Math.min.apply(null, ys2), by1 = Math.max.apply(null, ys2);
  snowRim(c, pts, (bx0 + bx1) / 2, (by0 + by1) / 2, bx1 - bx0, by1 - by0, sc, r);
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
