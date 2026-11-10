/* ============================================================
   WINTERSCENE — the painted pieces of the new winter scene (the
   reference picture: a shrine in the snow by a steaming pond, Fuji on
   the right). Drawn once (baked) by the scene, except the wind chime,
   which is drawn every frame so it can swing.

     hill(c, o)        a hill of snowy firs fading into the mist (left)
     pagoda(c, o)      a five-storey pagoda, its windows and eaves lit
     hall(c, o)        a shrine hall with a heavy snow roof, lit windows
     lantern(c, o)     a stone lantern (kasuga dōrō), lit, snow on top
     matsu(c, o)       a black pine with snow on its pads, roped (雪吊り)
     ropes(c, o, front) the straw ropes of 雪吊り round a tree (behind or in front)
     crane(c, o)       a red-crowned crane (丹頂) standing
     camellia(c, o)    a camellia bush (椿) with snow
     nandina(c, o)     a nandina bush (南天) with red berries and snow
     stones(c, o)      the stepping stones of a path in the snow
     rims(c, o)        the dark earth along the banks of the pond
     furin(c, o)       the glass wind chime (風鈴) hanging from above

   o (CSS px; c set up for CSS px) always may hold the light:
     sunDir [x, y, z], sunColour, skyColour ([r, g, b] 0 … 1.5), ambient,
     haze (0 … 1), hazeColour [r, g, b], lit (0 … 1.5: how bright the
     lights are), seed
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
  f.haze = function (col, extra) { return mix(col, hc, clamp(haze + (extra || 0), 0, 1)); };
  return f;
}
var SNOW = [250, 250, 252];
function snowCols(S, o) {
  var sn = (o.colours && o.colours.snow) || SNOW;
  return { top: S(sn, S.side * 0.35, 1, 0.45), side: S(sn, S.side * 0.6, 0.3, 0.8), shade: S(sn, -S.side * 0.5, 0.2, 0.8, 0.1),
           under: S(sn, 0, -0.3, 1, 0) };
}
/* A soft warm glow (added light). */
function glowAt(c, x, y, r, col, a) {
  if (a <= 0.003 || r <= 0) return;
  var g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgb(col, a)); g.addColorStop(0.35, rgb(col, a * 0.45)); g.addColorStop(1, rgb(col, 0));
  c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
}
/* A lumpy cap of snow along the points pts (left to right, the top edge), thickness th. */
function snowCap(c, pts, th, cols, r) {
  var i, n = pts.length;
  c.beginPath();
  c.moveTo(pts[0][0], pts[0][1] + th * 0.25);
  for (i = 0; i < n; i++) {
    var bump = th * (0.75 + 0.5 * r());
    c.lineTo(pts[i][0], pts[i][1] - bump);
  }
  c.lineTo(pts[n - 1][0], pts[n - 1][1] + th * 0.25);
  for (i = n - 1; i >= 0; i--) c.lineTo(pts[i][0], pts[i][1] + th * (0.2 + 0.45 * r()));
  c.closePath();
  var g = c.createLinearGradient(0, pts[0][1] - th, 0, pts[0][1] + th * 0.6);
  g.addColorStop(0, rgb(cols.top)); g.addColorStop(1, rgb(cols.side));
  c.fillStyle = g; c.fill();
}

/* ---------------------------------------------------------------
   A small fir of the hill forest: tiers of drooping needles, each with
   snow lying along its top. Simple, so a hundred of them are cheap.
   --------------------------------------------------------------- */
function smallFir(c, x, yb, h, S, r, needle, sc, extraHaze) {
  var w = h * lerp(0.28, 0.36, r()), tiers = 6 + Math.floor(r() * 3), i;
  var dark = S(needle, -S.side * 0.4, 0.2, 0.9, 0.4, extraHaze), lite = S(needle, S.side * 0.7, 0.3, 0.7, 1, extraHaze);
  var sTop = S.haze(sc.top, extraHaze), sSh = S.haze(sc.shade, extraHaze);
  c.fillStyle = rgb(S([60, 46, 40], 0, 0, 1, 0.5, extraHaze));
  c.fillRect(x - h * 0.02, yb - h * 0.12, h * 0.04, h * 0.12);
  for (i = 0; i < tiers; i++) {
    var k = i / (tiers - 1), ty = yb - h + h * 0.86 * Math.pow(k, 0.9) - h * 0.04, th = h * lerp(0.18, 0.26, k);
    var tw = w * lerp(0.22, 1, Math.pow(k, 0.85)) * lerp(0.9, 1.1, r()), by = ty + th;
    var apex = ty - th * 0.35;
    // the needles
    c.beginPath();
    c.moveTo(x, apex);
    c.quadraticCurveTo(x + tw * 0.55, ty + th * 0.35, x + tw, by + th * 0.05);
    var nb = 5;
    for (var j = nb; j >= -nb; j--) {
      var u = j / nb, jy = by - Math.abs(u) * th * 0.12 + (j % 2 ? th * 0.16 : -th * 0.04) * (0.6 + 0.6 * r());
      c.lineTo(x + tw * u, jy);
    }
    c.quadraticCurveTo(x - tw * 0.55, ty + th * 0.35, x, apex);
    c.closePath();
    var g = c.createLinearGradient(x - tw * S.side, 0, x + tw * S.side, 0);
    g.addColorStop(0, rgb(dark)); g.addColorStop(1, rgb(lite));
    c.fillStyle = g; c.fill();
    // the snow along the top of the tier
    var st = th * lerp(0.3, 0.45, r());
    c.beginPath();
    c.moveTo(x, apex - st * 0.3);
    c.quadraticCurveTo(x + tw * 0.5, ty + th * 0.2, x + tw * 0.95, by - th * 0.05);
    c.quadraticCurveTo(x + tw * 0.5, ty + th * 0.2 + st, x, apex + st);
    c.quadraticCurveTo(x - tw * 0.5, ty + th * 0.2 + st, x - tw * 0.95, by - th * 0.05);
    c.quadraticCurveTo(x - tw * 0.5, ty + th * 0.2, x, apex - st * 0.3);
    c.closePath();
    var g2 = c.createLinearGradient(x - tw * S.side, 0, x + tw * S.side, 0);
    g2.addColorStop(0, rgb(sSh)); g2.addColorStop(1, rgb(sTop));
    c.fillStyle = g2; c.fill();
  }
}

/* ---------------------------------------------------------------
   THE HILL — a hill of firs on the left, the far rows small and lost in
   the mist, the near ones larger and clearer. o: x0, x1 (its span),
   base (the foot, y), peakX, peakY, part ('back' | 'front' | 'all'),
   trees (how many), treeSize (px, the nearest), colours { needle, snow }
   --------------------------------------------------------------- */
function hillTop(o, x) {
  var dx = x - o.peakX, sg = dx < 0 ? o.spanL : o.spanR;
  var b = Math.exp(-dx * dx / (sg * sg));
  return o.base - (o.base - o.peakY) * b;
}
function hill(c, o) {
  var S = shader(o), sc = snowCols(S, o), r = rng(d(o, 'seed', 5)), part = d(o, 'part', 'all');
  var needle = (o.colours && o.colours.needle) || [50, 70, 62], i;
  if (part !== 'front') {
    // the hillside: snow, faded into the mist
    c.beginPath();
    c.moveTo(o.x0, o.base + 10);
    for (var x = o.x0; x <= o.x1; x += 6) c.lineTo(x, hillTop(o, x));
    c.lineTo(o.x1, o.base + 10); c.closePath();
    var g = c.createLinearGradient(0, o.peakY, 0, o.base);
    g.addColorStop(0, rgb(S.haze(sc.top, 0.55))); g.addColorStop(1, rgb(S.haze(sc.shade, 0.5)));
    c.fillStyle = g; c.fill();
  }
  // the trees: placed once (same seed), each with its depth 0 (far, high) … 1 (near, low)
  var N = d(o, 'trees', 160), list = [];
  for (i = 0; i < N; i++) {
    var tx = lerp(o.x0 - 20, o.x1, r()), top = hillTop(o, tx), dep = Math.pow(r(), 0.8);
    var ty = lerp(top + 6, o.base, dep);
    if (ty < top + 4) continue;
    // a bare snowy slope down the middle of the hill, as in the picture
    var slope = Math.exp(-Math.pow((tx - o.peakX - (ty - o.peakY) * 0.9) / (o.spanR * 0.18), 2));
    if (dep < 0.55 && r() < slope * 0.85) continue;
    var endK = clamp((o.x1 - tx) / ((o.x1 - o.x0) * 0.25), 0, 1);           // fewer and smaller toward the right end
    if (r() > endK) continue;
    list.push({ x: tx, y: ty, dep: (ty - o.peakY) / (o.base - o.peakY), s: r() * lerp(0.6, 1, endK), seed: Math.floor(r() * 1e9) });
  }
  list.sort(function (a, b) { return a.y - b.y; });
  var split = d(o, 'split', 0.62);
  for (i = 0; i < list.length; i++) {
    var T = list[i];
    if (part === 'back' && T.dep > split) continue;
    if (part === 'front' && T.dep <= split) continue;
    var h = o.treeSize * lerp(0.28, 1, Math.pow(T.dep, 1.3)) * lerp(0.8, 1.2, T.s);
    smallFir(c, T.x, T.y, h, S, rng(T.seed), needle, sc, clamp((0.28 + (1 - T.dep) * 0.5) * d(o, 'mist', 1), 0, 0.92));
  }
}

/* A band of mist (soft at top and bottom), y0 … y1, x0 … x1 (soft at the ends). */
function mistBand(c, x0, x1, y0, y1, col, a) {
  c.save();
  c.translate((x0 + x1) / 2, (y0 + y1) / 2); c.scale((x1 - x0) / 2, (y1 - y0) / 2);
  var g = c.createRadialGradient(0, 0, 0, 0, 0, 1);
  g.addColorStop(0, rgb(col, a)); g.addColorStop(0.55, rgb(col, a * 0.8)); g.addColorStop(1, rgb(col, 0));
  c.fillStyle = g; c.fillRect(-1, -1, 2, 2);
  c.restore();
}

/* ---------------------------------------------------------------
   THE PAGODA — five storeys; seen a little from below, so the
   undersides of the eaves show, each lit by a row of lamps; lit windows
   in each storey; the gilt finial (sōrin) on top. o: x, top (the tip of
   the finial), base, w (the width of the lowest roof)
   --------------------------------------------------------------- */
function pagoda(c, o) {
  var S = shader(o), sc = snowCols(S, o), r = rng(d(o, 'seed', 3)), lit = d(o, 'lit', 1);
  var x = o.x, Hh = o.base - o.top, w = o.w, i;
  var roofC = [70, 56, 50], fasc = [120, 96, 80], wall = [86, 58, 44], gold = [214, 160, 70];
  var warm = [255, 176, 84], warm2 = [255, 214, 140];
  var eaves = [], n = 5;
  for (i = 0; i < n; i++) eaves.push(o.top + Hh * lerp(0.42, 0.86, i / (n - 1)));
  // the finial: the base block, nine rings, the jewel
  var fBot = eaves[0] - Hh * 0.05, fTop = o.top;
  glowAt(c, x, fBot, w * 0.18, warm, 0.5 * lit);
  c.fillStyle = rgb(S(gold, S.side * 0.6, 0.2, 0.8));
  c.fillRect(x - w * 0.012, fTop + Hh * 0.03, w * 0.024, fBot - fTop - Hh * 0.03);
  for (i = 0; i < 9; i++) {
    var ry = lerp(fBot - Hh * 0.03, fTop + Hh * 0.09, i / 8), rw = w * lerp(0.075, 0.05, i / 8);
    c.fillStyle = rgb(S(gold, 0, 1, 0.6));
    c.beginPath(); c.ellipse(x, ry, rw, rw * 0.22, 0, 0, TAU); c.fill();
    c.fillStyle = rgb(S(scale(gold, 0.6), -S.side * 0.3, -0.5, 1, 0.5));
    c.beginPath(); c.ellipse(x, ry + rw * 0.12, rw, rw * 0.14, 0, 0, PI); c.fill();
  }
  c.fillStyle = rgb(S(gold, S.side * 0.5, 0.6, 0.7));
  c.beginPath(); c.ellipse(x, fTop + Hh * 0.025, w * 0.022, Hh * 0.03, 0, 0, TAU); c.fill();
  c.fillStyle = rgb(mix(S(gold, 0, 0.3, 1), warm2, 0.5 * clamp(lit, 0, 1)));
  c.fillRect(x - w * 0.07, fBot - Hh * 0.01, w * 0.14, Hh * 0.035);
  // the storeys, from the top down: roof, the lit eave underside, the wall with its windows
  for (i = 0; i < n; i++) {
    var e = eaves[i], hw = w * 0.5 * lerp(0.66, 1, i / (n - 1)), rt = Hh * 0.04, bt = Hh * 0.022;
    var nextTop = i < n - 1 ? eaves[i + 1] - Hh * 0.04 : o.base;
    var ww = hw * 0.6;
    // the wall
    var wy0 = e + bt, wy1 = nextTop + (i < n - 1 ? Hh * 0.01 : 0);
    var wg = c.createLinearGradient(x - ww, 0, x + ww, 0);
    wg.addColorStop(0, rgb(S(wall, -1, 0, 0.6, 0.6))); wg.addColorStop(0.5, rgb(S(wall, 0, 0, 1)));
    wg.addColorStop(1, rgb(S(wall, 1, 0, 0.6, 0.6)));
    c.fillStyle = wg; c.fillRect(x - ww, wy0, ww * 2, wy1 - wy0);
    // the windows (lit)
    var nw = 3, wh = (wy1 - wy0) * 0.5, wy = wy0 + (wy1 - wy0) * 0.22;
    for (var k = 0; k < nw; k++) {
      var wx = x + (k - 1) * ww * 0.62, wwid = ww * 0.32;
      glowAt(c, wx, wy + wh / 2, wwid * 2.2, warm, 0.45 * lit);
      c.fillStyle = rgb(mix([120, 80, 50], warm2, clamp(lit, 0, 1)));
      c.fillRect(wx - wwid / 2, wy, wwid, wh);
      c.strokeStyle = rgb([70, 40, 28], 0.6); c.lineWidth = Math.max(0.5, wwid * 0.08);
      c.beginPath();
      for (var q = 1; q < 3; q++) { c.moveTo(wx - wwid / 2 + wwid * q / 3, wy); c.lineTo(wx - wwid / 2 + wwid * q / 3, wy + wh); }
      c.moveTo(wx - wwid / 2, wy + wh / 2); c.lineTo(wx + wwid / 2, wy + wh / 2);
      c.stroke();
    }
    // posts between the bays
    c.fillStyle = rgb(S([60, 40, 32], 0, 0, 1));
    for (k = 0; k <= 3; k++) c.fillRect(x - ww + ww * 2 * k / 3 - ww * 0.03, wy0, ww * 0.06, wy1 - wy0);
    // the underside of the eave: dark rafters with a row of warm lamps
    c.fillStyle = rgb(S([50, 36, 30], 0, -1, 0.5, 0.3));
    c.beginPath();
    c.moveTo(x - hw * 0.94, e); c.lineTo(x + hw * 0.94, e); c.lineTo(x + ww * 1.05, e + bt); c.lineTo(x - ww * 1.05, e + bt); c.closePath(); c.fill();
    c.save();
    c.shadowColor = rgb(warm, 0.9 * clamp(lit, 0, 1)); c.shadowBlur = bt * 2.5;
    c.fillStyle = rgb(mix([150, 110, 70], warm2, clamp(lit, 0, 1)));
    var dots = Math.round(hw / Math.max(2, bt * 0.6));
    for (k = 0; k < dots; k++) {
      var dx = lerp(-hw * 0.85, hw * 0.85, (k + 0.5) / dots);
      c.fillRect(x + dx - bt * 0.18, e + bt * 0.15, bt * 0.36, bt * 0.5);
    }
    c.restore();
    // the roof: a dark slab, its corners turned up, a lighter fascia along the eave
    c.beginPath();
    c.moveTo(x - hw * 0.7, e - rt);
    c.lineTo(x + hw * 0.7, e - rt);
    c.quadraticCurveTo(x + hw * 0.9, e - rt * 0.75, x + hw * 1.03, e - rt * 0.65);
    c.lineTo(x + hw * 0.98, e);
    c.quadraticCurveTo(x, e + rt * 0.25, x - hw * 0.98, e);
    c.lineTo(x - hw * 1.03, e - rt * 0.65);
    c.quadraticCurveTo(x - hw * 0.9, e - rt * 0.75, x - hw * 0.7, e - rt);
    c.closePath();
    var rg = c.createLinearGradient(0, e - rt, 0, e);
    rg.addColorStop(0, rgb(S(roofC, 0, 0.6, 0.8))); rg.addColorStop(0.55, rgb(S(roofC, 0, 0.2, 1)));
    rg.addColorStop(0.56, rgb(S(fasc, 0, 0, 1))); rg.addColorStop(1, rgb(S(scale(fasc, 0.8), 0, -0.3, 1)));
    c.fillStyle = rg; c.fill();
    // snow along the top of the roof and on the turned-up corners
    var pts = [];
    for (k = 0; k <= 8; k++) pts.push([x + lerp(-hw * 0.72, hw * 0.72, k / 8), e - rt]);
    snowCap(c, pts, rt * 0.28, sc, r);
    c.strokeStyle = rgb(sc.top, 0.9); c.lineWidth = rt * 0.18; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x - hw * 0.72, e - rt * 0.98); c.quadraticCurveTo(x - hw * 0.9, e - rt * 0.8, x - hw * 1.02, e - rt * 0.7);
    c.moveTo(x + hw * 0.72, e - rt * 0.98); c.quadraticCurveTo(x + hw * 0.9, e - rt * 0.8, x + hw * 1.02, e - rt * 0.7); c.stroke();
  }
}

/* ---------------------------------------------------------------
   THE HALL — a shrine hall, its hipped roof deep in snow, lit windows
   and doors. o: x (middle), y (the foot), w (the span of the eaves)
   --------------------------------------------------------------- */
function hall(c, o) {
  var S = shader(o), sc = snowCols(S, o), r = rng(d(o, 'seed', 4)), lit = d(o, 'lit', 1), x = o.x, yb = o.y, w = o.w, k;
  var warm = [255, 170, 76], warm2 = [255, 210, 130];
  var ridgeY = yb - w * 0.3, eaveY = yb - w * 0.135, wallTop = eaveY + w * 0.028, baseTop = yb - w * 0.018;
  var ww = w * 0.36;
  // the light spilling onto the snow in front
  c.save(); c.globalCompositeOperation = 'lighter';
  c.save(); c.translate(x, yb + w * 0.03); c.scale(1, 0.18);
  glowAt(c, 0, 0, w * 0.5, warm, 0.35 * lit);
  c.restore(); c.restore();
  // the stone base, snow on it
  c.fillStyle = rgb(S([150, 146, 140], 0, 0.2, 1));
  c.fillRect(x - ww * 1.08, baseTop, ww * 2.16, yb - baseTop);
  c.fillStyle = rgb(sc.top); c.fillRect(x - ww * 1.1, baseTop - w * 0.004, ww * 2.2, w * 0.006);
  // the walls: plaster between dark posts
  var wg = c.createLinearGradient(0, wallTop, 0, baseTop);
  wg.addColorStop(0, rgb(S([150, 120, 96], 0, 0, 1, 0.4))); wg.addColorStop(1, rgb(S([214, 196, 170], 0, 0, 1)));
  c.fillStyle = wg; c.fillRect(x - ww, wallTop, ww * 2, baseTop - wallTop);
  var bays = 9, bw = ww * 2 / bays;
  for (k = 0; k < bays; k++) {
    var bx = x - ww + bw * k, mid = k === 4;
    var wy0 = wallTop + (baseTop - wallTop) * (mid ? 0.12 : 0.3), wy1 = baseTop - (baseTop - wallTop) * (mid ? 0.0 : 0.28);
    var wx0 = bx + bw * (mid ? 0.1 : 0.22), wx1 = bx + bw * (mid ? 0.9 : 0.78);
    glowAt(c, (wx0 + wx1) / 2, (wy0 + wy1) / 2, bw * (mid ? 1.6 : 1.1), warm, 0.5 * lit);
    var fill = c.createLinearGradient(0, wy0, 0, wy1);
    fill.addColorStop(0, rgb(mix([110, 80, 50], warm2, clamp(lit, 0, 1))));
    fill.addColorStop(1, rgb(mix([100, 70, 40], warm, clamp(lit, 0, 1))));
    c.fillStyle = fill; c.fillRect(wx0, wy0, wx1 - wx0, wy1 - wy0);
    c.strokeStyle = rgb([110, 60, 30], 0.55); c.lineWidth = Math.max(0.5, bw * 0.03);
    c.beginPath();
    var cols = mid ? 6 : 3, rows = mid ? 6 : 3, q;
    for (q = 1; q < cols; q++) { c.moveTo(lerp(wx0, wx1, q / cols), wy0); c.lineTo(lerp(wx0, wx1, q / cols), wy1); }
    for (q = 1; q < rows; q++) { c.moveTo(wx0, lerp(wy0, wy1, q / rows)); c.lineTo(wx1, lerp(wy0, wy1, q / rows)); }
    c.stroke();
    c.fillStyle = rgb(S([58, 36, 28], 0, 0, 1));
    c.fillRect(bx - bw * 0.05, wallTop, bw * 0.1, baseTop - wallTop);
  }
  c.fillRect(x + ww - bw * 0.05, wallTop, bw * 0.1, baseTop - wallTop);
  // the beam under the eaves, and the veranda rail
  c.fillStyle = rgb(S([70, 44, 34], 0, -0.5, 1, 0.4));
  c.fillRect(x - ww * 1.02, wallTop - w * 0.006, ww * 2.04, w * 0.012);
  c.fillRect(x - ww * 1.04, baseTop - w * 0.012, ww * 2.08, w * 0.008);
  // the steps in front, white with snow
  for (k = 0; k < 3; k++) {
    c.fillStyle = rgb(k % 2 ? sc.side : sc.top);
    var sw = w * (0.09 + k * 0.012);
    c.fillRect(x - sw, baseTop + (yb - baseTop) * k / 3, sw * 2, (yb - baseTop) / 3 + 0.5);
  }
  // the eave's underside: dark rafters, warmly lit from below
  c.fillStyle = rgb(S([54, 38, 32], 0, -1, 0.6, 0.3));
  c.beginPath();
  c.moveTo(x - w * 0.49, eaveY); c.lineTo(x + w * 0.49, eaveY);
  c.lineTo(x + ww * 1.03, wallTop); c.lineTo(x - ww * 1.03, wallTop); c.closePath(); c.fill();
  c.save();
  c.globalCompositeOperation = 'lighter';
  var ug = c.createLinearGradient(0, eaveY, 0, wallTop);
  ug.addColorStop(0, rgb(warm, 0)); ug.addColorStop(1, rgb(warm, 0.35 * clamp(lit, 0, 1)));
  c.fillStyle = ug; c.fillRect(x - w * 0.48, eaveY, w * 0.96, wallTop - eaveY);
  c.restore();
  // the roof, deep in snow: hipped, the ridge short
  var rl = x - w * 0.31, rr = x + w * 0.31;
  c.beginPath();
  c.moveTo(rl, ridgeY + w * 0.01);
  c.quadraticCurveTo(rl + w * 0.01, ridgeY - w * 0.004, rl + w * 0.04, ridgeY - w * 0.004);
  c.lineTo(rr - w * 0.04, ridgeY - w * 0.004);
  c.quadraticCurveTo(rr - w * 0.01, ridgeY - w * 0.004, rr, ridgeY + w * 0.01);
  c.quadraticCurveTo(x + w * 0.42, eaveY - w * 0.04, x + w * 0.515, eaveY - w * 0.012);
  c.quadraticCurveTo(x + w * 0.52, eaveY + w * 0.006, x + w * 0.495, eaveY + w * 0.006);
  c.quadraticCurveTo(x, eaveY + w * 0.016, x - w * 0.495, eaveY + w * 0.006);
  c.quadraticCurveTo(x - w * 0.52, eaveY + w * 0.006, x - w * 0.515, eaveY - w * 0.012);
  c.quadraticCurveTo(x - w * 0.42, eaveY - w * 0.04, rl, ridgeY + w * 0.01);
  c.closePath();
  var sg = c.createLinearGradient(0, ridgeY, 0, eaveY + w * 0.01);
  sg.addColorStop(0, rgb(sc.top)); sg.addColorStop(0.75, rgb(mix(sc.top, sc.side, 0.5))); sg.addColorStop(1, rgb(sc.shade));
  c.fillStyle = sg; c.fill();
  // the hips: a soft shade down each, the side facing away from the sun bluer
  c.save(); c.clip();
  var hipX = S.side < 0 ? 1 : -1;
  var hg = c.createLinearGradient(x + hipX * w * 0.3, 0, x + hipX * w * 0.52, 0);
  hg.addColorStop(0, rgb(sc.shade, 0)); hg.addColorStop(1, rgb(sc.shade, 0.55));
  c.fillStyle = hg; c.fillRect(x - w * 0.6, ridgeY - 5, w * 1.2, eaveY - ridgeY + w * 0.05);
  // the lumps of snow along the eave
  c.restore();
  c.fillStyle = rgb(mix(sc.top, sc.side, 0.4));
  for (k = 0; k < 26; k++) {
    var ex = lerp(x - w * 0.49, x + w * 0.49, (k + r()) / 26);
    c.beginPath(); c.ellipse(ex, eaveY + w * 0.008, w * lerp(0.008, 0.016, r()), w * lerp(0.004, 0.008, r()), 0, 0, TAU); c.fill();
  }
  // the ridge
  c.fillStyle = rgb(sc.top);
  c.beginPath(); c.ellipse(x, ridgeY, w * 0.3, w * 0.008, 0, PI, TAU); c.fill();
}

/* ---------------------------------------------------------------
   A STONE LANTERN (kasuga dōrō): base, post, platform, the firebox with
   its lit window, a wide roof capped with snow, the jewel on top.
   o: x, y (the foot), h
   --------------------------------------------------------------- */
function lantern(c, o) {
  var S = shader(o), sc = snowCols(S, o), r = rng(d(o, 'seed', 9)), lit = d(o, 'lit', 1), x = o.x, y = o.y, h = o.h;
  var stone = (o.colours && o.colours.stone) || [140, 138, 132], warm = [255, 168, 70], warm2 = [255, 214, 140];
  function block(cx, y0, y1, hw0, hw1, ny) {
    var g = c.createLinearGradient(cx - hw0, 0, cx + hw0, 0);
    g.addColorStop(0, rgb(S(stone, -1, ny, 0.5, 1))); g.addColorStop(0.45, rgb(S(stone, -0.2, ny, 1)));
    g.addColorStop(0.55, rgb(S(stone, 0.2, ny, 1))); g.addColorStop(1, rgb(S(stone, 1, ny, 0.5, 1)));
    c.fillStyle = g;
    c.beginPath(); c.moveTo(cx - hw1, y0); c.lineTo(cx + hw1, y0); c.lineTo(cx + hw0, y1); c.lineTo(cx - hw0, y1); c.closePath(); c.fill();
  }
  // the shadow at the foot
  c.fillStyle = rgb(sc.shade, 0.5);
  c.beginPath(); c.ellipse(x, y, h * 0.3, h * 0.04, 0, 0, TAU); c.fill();
  block(x, y - h * 0.07, y, h * 0.2, h * 0.17, 0);                 // base
  block(x, y - h * 0.1, y - h * 0.07, h * 0.15, h * 0.12, 0.5);
  block(x, y - h * 0.44, y - h * 0.1, h * 0.07, h * 0.06, 0);      // post
  block(x, y - h * 0.5, y - h * 0.44, h * 0.17, h * 0.15, -0.3);   // platform
  // the firebox
  var fy0 = y - h * 0.7, fy1 = y - h * 0.5, fw = h * 0.13;
  block(x, fy0, fy1, fw, fw, 0);
  glowAt(c, x, (fy0 + fy1) / 2, h * 0.45, warm, 0.55 * lit);
  var wg = c.createLinearGradient(0, fy0, 0, fy1);
  wg.addColorStop(0, rgb(mix([90, 70, 50], warm2, clamp(lit, 0, 1)))); wg.addColorStop(1, rgb(mix([80, 60, 40], warm, clamp(lit, 0, 1))));
  c.fillStyle = wg; c.fillRect(x - fw * 0.68, fy0 + h * 0.03, fw * 1.36, fy1 - fy0 - h * 0.05);
  c.strokeStyle = rgb(S(stone, 0, 0, 1, 0.5), 0.9); c.lineWidth = Math.max(0.4, h * 0.012);
  c.beginPath(); c.moveTo(x, fy0 + h * 0.03); c.lineTo(x, fy1 - h * 0.02); c.stroke();
  // the roof
  var ry0 = y - h * 0.86, ry1 = y - h * 0.7, rw = h * 0.27;
  c.beginPath();
  c.moveTo(x - h * 0.05, ry0); c.lineTo(x + h * 0.05, ry0);
  c.quadraticCurveTo(x + rw * 0.7, ry1 - h * 0.04, x + rw, ry1 - h * 0.035);
  c.lineTo(x + rw * 0.95, ry1); c.lineTo(x - rw * 0.95, ry1); c.lineTo(x - rw, ry1 - h * 0.035);
  c.quadraticCurveTo(x - rw * 0.7, ry1 - h * 0.04, x - h * 0.05, ry0);
  c.closePath();
  var rg = c.createLinearGradient(x - rw, 0, x + rw, 0);
  rg.addColorStop(0, rgb(S(scale(stone, 0.75), -1, 0.3, 0.5))); rg.addColorStop(1, rgb(S(scale(stone, 0.75), 1, 0.3, 0.5)));
  c.fillStyle = rg; c.fill();
  // snow on the roof
  c.beginPath();
  c.moveTo(x - rw * 1.02, ry1 - h * 0.03);
  c.quadraticCurveTo(x - rw * 0.6, ry0 - h * 0.02, x, ry0 - h * 0.06);
  c.quadraticCurveTo(x + rw * 0.6, ry0 - h * 0.02, x + rw * 1.02, ry1 - h * 0.03);
  c.quadraticCurveTo(x + rw * 0.5, ry1 - h * 0.01, x, ry1 - h * 0.025);
  c.quadraticCurveTo(x - rw * 0.5, ry1 - h * 0.01, x - rw * 1.02, ry1 - h * 0.03);
  c.closePath();
  var sg = c.createLinearGradient(x - rw * S.side, 0, x + rw * S.side, 0);
  sg.addColorStop(0, rgb(sc.shade)); sg.addColorStop(1, rgb(sc.top));
  c.fillStyle = sg; c.fill();
  // the jewel, capped with snow
  c.fillStyle = rgb(S(stone, S.side * 0.5, 0.4, 0.8));
  c.beginPath(); c.ellipse(x, ry0 - h * 0.09, h * 0.045, h * 0.05, 0, 0, TAU); c.fill();
  c.fillStyle = rgb(sc.top);
  c.beginPath(); c.ellipse(x, ry0 - h * 0.125, h * 0.04, h * 0.02, 0, 0, TAU); c.fill();
  // snow on the platform and the base
  c.fillStyle = rgb(sc.top);
  c.beginPath(); c.ellipse(x, y - h * 0.5, h * 0.17, h * 0.018, 0, 0, TAU); c.fill();
  c.beginPath(); c.ellipse(x, y - h * 0.1, h * 0.14, h * 0.016, 0, 0, TAU); c.fill();
  c.fillStyle = rgb(mix(sc.top, sc.side, 0.4));
  c.beginPath(); c.ellipse(x, y - h * 0.005, h * 0.24, h * 0.03, 0, PI, TAU); c.fill();
  return { x: x, y: (fy0 + fy1) / 2, r: h * 0.2, foot: y };
}

/* ---------------------------------------------------------------
   THE ROPES of 雪吊り (yukitsuri): a pole up through the tree, straw
   ropes from its top fanned out to the branches. o: x, top (the pole's
   top), y (the foot), spread (half the width at the bottom), drop (how
   far down the ropes reach, from the top), n (ropes); front: true for
   the ropes in front of the tree, false for those behind it.
   --------------------------------------------------------------- */
function ropes(c, o, front) {
  var S = shader(o), n = d(o, 'n', 16), straw = [214, 168, 80], i;
  var lw = Math.max(0.7, (o.y - o.top) * 0.006);
  if (!front) {                                                   // the pole
    var pg = c.createLinearGradient(o.x - lw * 2, 0, o.x + lw * 2, 0);
    pg.addColorStop(0, rgb(S(straw, -1, 0, 0.6, 0.7))); pg.addColorStop(1, rgb(S(straw, 1, 0, 0.6)));
    c.fillStyle = pg; c.fillRect(o.x - lw * 1.4, o.top, lw * 2.8, o.y - o.top);
    c.fillStyle = rgb(S(straw, 0, 1, 0.5));
    c.beginPath(); c.ellipse(o.x, o.top - lw * 2, lw * 2, lw * 3.5, 0, 0, TAU); c.fill();
  }
  c.lineCap = 'round';
  for (i = 0; i < n; i++) {
    var a = (i + 0.5) / n * TAU, sx = Math.cos(a), sz = Math.sin(a);   // sz > 0: in front
    if ((sz > 0) !== front) continue;
    var ex = o.x + sx * o.spread, ey = o.top + o.drop + sz * o.spread * 0.12;
    c.strokeStyle = rgb(S(straw, sx * 0.7, 0.2, 0.7 + sz * 0.3, front ? 1 : 0.6), front ? 0.95 : 0.7);
    c.lineWidth = lw * (front ? 1 : 0.8);
    c.beginPath(); c.moveTo(o.x, o.top);
    c.quadraticCurveTo(lerp(o.x, ex, 0.5), lerp(o.top, ey, 0.5) + o.drop * 0.02, ex, ey);
    c.stroke();
  }
}

/* ---------------------------------------------------------------
   A BLACK PINE (kuromatsu): a leaning, twisting trunk, branches out to
   flat pads of needles, each pad heaped with snow. o: x, y (the foot), h
   --------------------------------------------------------------- */
function matsu(c, o) {
  var S = shader(o), sc = snowCols(S, o), r = rng(d(o, 'seed', 21)), x = o.x, y = o.y, h = o.h, i;
  var bark = [74, 56, 46], needle = (o.colours && o.colours.needle) || [44, 76, 60];
  // the trunk: a bending line from the foot to the top
  var pts = [];
  for (i = 0; i <= 12; i++) {
    var t = i / 12;
    pts.push([x + h * (0.06 * Math.sin(t * 3.4 + 0.5) - 0.03 * t), y - h * 0.9 * t]);
  }
  function trunkW(t) { return h * lerp(0.055, 0.012, t); }
  c.beginPath();
  for (i = 0; i <= 12; i++) { var p = pts[i]; i ? c.lineTo(p[0] - trunkW(i / 12), p[1]) : c.moveTo(p[0] - trunkW(0) * 1.4, p[1]); }
  for (i = 12; i >= 0; i--) { var q = pts[i]; c.lineTo(q[0] + trunkW(i / 12) * (i ? 1 : 1.4), q[1]); }
  c.closePath();
  var tg = c.createLinearGradient(x - h * 0.06, 0, x + h * 0.06, 0);
  tg.addColorStop(0, rgb(S(bark, -1, 0, 0.5))); tg.addColorStop(1, rgb(S(bark, 1, 0, 0.5)));
  c.fillStyle = tg; c.fill();
  // the pads, from the top down (wide at the bottom), each on a branch from the trunk
  var pads = [];
  var tiers = [[0.95, 0.12, 0], [0.82, 0.2, -1], [0.78, 0.18, 1], [0.64, 0.26, -1], [0.6, 0.24, 1], [0.47, 0.34, -1],
               [0.44, 0.3, 1], [0.32, 0.36, -0.4], [0.34, 0.3, 0.8]];
  tiers.forEach(function (T) {
    var ti = Math.round(T[0] * 12), base = pts[Math.min(12, ti)], ext = T[1] * h * lerp(0.85, 1.15, r());
    pads.push({ x: base[0] + T[2] * ext * 0.75, y: base[1] - h * 0.02, bx: base[0], by: base[1] + h * 0.03, w: ext, th: h * lerp(0.07, 0.1, r()) });
  });
  c.strokeStyle = rgb(S(bark, 0, 0, 1, 0.6)); c.lineCap = 'round';
  pads.forEach(function (P) {
    c.lineWidth = h * 0.014;
    c.beginPath(); c.moveTo(P.bx, P.by); c.quadraticCurveTo((P.bx + P.x) / 2, P.by - h * 0.01, P.x, P.y + P.th * 0.3); c.stroke();
  });
  pads.sort(function (a, b) { return a.y - b.y; });
  pads.forEach(function (P) {
    var dark = S(needle, -S.side * 0.3, -0.3, 0.9, 0.4), lite = S(needle, S.side * 0.6, 0.2, 0.8);
    // the needles: a flat cloud of tufts
    var tufts = 9;
    for (var k = 0; k < tufts; k++) {
      var u = (k + 0.5) / tufts * 2 - 1, tx = P.x + u * P.w * 0.5, ty = P.y + Math.abs(u) * P.th * 0.25 + P.th * 0.15;
      var g = c.createLinearGradient(0, ty - P.th * 0.5, 0, ty + P.th * 0.6);
      g.addColorStop(0, rgb(lite)); g.addColorStop(1, rgb(dark));
      c.fillStyle = g;
      c.beginPath(); c.ellipse(tx, ty, P.w * 0.16, P.th * 0.55, 0, 0, TAU); c.fill();
      // the needle tips under the pad
      c.strokeStyle = rgb(dark, 0.8); c.lineWidth = Math.max(0.4, h * 0.004);
      c.beginPath();
      for (var m = 0; m < 4; m++) { var mx = tx + (m - 1.5) * P.w * 0.06; c.moveTo(mx, ty + P.th * 0.2); c.lineTo(mx + (r() - 0.5) * P.w * 0.04, ty + P.th * 0.6); }
      c.stroke();
    }
    // the snow lying on it
    var sp = [];
    for (k = 0; k <= 8; k++) { var v = k / 8 * 2 - 1; sp.push([P.x + v * P.w * 0.55, P.y - P.th * 0.1 + Math.pow(Math.abs(v), 2) * P.th * 0.35]); }
    snowCap(c, sp, P.th * 0.32, sc, r);
  });
}

/* ---------------------------------------------------------------
   A RED-CROWNED CRANE (丹頂) standing. o: x, y (the feet), h (to the top
   of the head), dir (1 facing right, -1 left), neck (0 … 1: how far the
   head is bent down toward the other)
   --------------------------------------------------------------- */
function crane(c, o) {
  var S = shader(o), x = o.x, y = o.y, h = o.h, f = d(o, 'dir', 1), bend = d(o, 'neck', 0.3);
  var white = scale(S([250, 250, 250], S.side * 0.4, 0.5, 0.8), 1.3), whiteSh = scale(S([236, 238, 244], -S.side * 0.6, -0.2, 0.7, 0.3), 1.35);
  var black = S([28, 28, 32], 0, 0, 1), red = [214, 34, 40], leg = S([70, 74, 78], 0, 0, 1);
  c.save(); c.translate(x, y); c.scale(f, 1);
  // the legs
  c.strokeStyle = rgb(leg); c.lineWidth = h * 0.018; c.lineCap = 'round';
  c.beginPath();
  c.moveTo(-h * 0.04, -h * 0.45); c.lineTo(-h * 0.03, -h * 0.22); c.lineTo(-h * 0.07, 0);
  c.moveTo(h * 0.02, -h * 0.45); c.lineTo(h * 0.04, -h * 0.24); c.lineTo(h * 0.06, -h * 0.01);
  c.stroke();
  // the body
  c.beginPath();
  c.moveTo(h * 0.17, -h * 0.6);
  c.bezierCurveTo(h * 0.13, -h * 0.71, -h * 0.14, -h * 0.69, -h * 0.23, -h * 0.55);
  c.bezierCurveTo(-h * 0.27, -h * 0.45, -h * 0.13, -h * 0.38, 0, -h * 0.4);
  c.bezierCurveTo(h * 0.12, -h * 0.42, h * 0.2, -h * 0.5, h * 0.17, -h * 0.6);
  var bg = c.createLinearGradient(0, -h * 0.68, 0, -h * 0.4);
  bg.addColorStop(0, rgb(white)); bg.addColorStop(1, rgb(whiteSh));
  c.fillStyle = bg; c.fill();
  // the black plumes over the tail
  c.fillStyle = rgb(black);
  c.beginPath();
  c.moveTo(-h * 0.04, -h * 0.62);
  c.bezierCurveTo(-h * 0.22, -h * 0.66, -h * 0.36, -h * 0.52, -h * 0.34, -h * 0.36);
  c.lineTo(-h * 0.3, -h * 0.42); c.lineTo(-h * 0.28, -h * 0.34); c.lineTo(-h * 0.24, -h * 0.41); c.lineTo(-h * 0.19, -h * 0.35);
  c.bezierCurveTo(-h * 0.16, -h * 0.47, -h * 0.08, -h * 0.53, -h * 0.04, -h * 0.62);
  c.fill();
  // the neck: an S, black at the front
  var hx = lerp(h * 0.12, h * 0.2, bend), hy = lerp(-h * 0.98, -h * 0.86, bend);
  c.lineCap = 'round';
  c.strokeStyle = rgb(black); c.lineWidth = h * 0.07;
  c.beginPath(); c.moveTo(h * 0.12, -h * 0.6);
  c.bezierCurveTo(h * 0.16, -h * 0.72, h * 0.04, -h * 0.82, hx - h * 0.02, hy + h * 0.04); c.stroke();
  c.strokeStyle = rgb(white); c.lineWidth = h * 0.028;
  c.beginPath(); c.moveTo(h * 0.09, -h * 0.62);
  c.bezierCurveTo(h * 0.12, -h * 0.72, h * 0.01, -h * 0.8, hx - h * 0.045, hy + h * 0.03); c.stroke();
  // the head, the red crown, the beak
  c.fillStyle = rgb(black);
  c.beginPath(); c.ellipse(hx, hy, h * 0.04, h * 0.032, 0, 0, TAU); c.fill();
  c.fillStyle = rgb(red);
  c.beginPath(); c.ellipse(hx + h * 0.004, hy - h * 0.022, h * 0.022, h * 0.014, 0, 0, TAU); c.fill();
  c.fillStyle = rgb(white);
  c.beginPath(); c.ellipse(hx - h * 0.022, hy + h * 0.004, h * 0.016, h * 0.02, 0, 0, TAU); c.fill();
  c.fillStyle = rgb(S([140, 140, 110], 0, 0, 1));
  c.beginPath(); c.moveTo(hx + h * 0.03, hy - h * 0.008); c.lineTo(hx + h * 0.12, hy + h * 0.02 + bend * h * 0.03); c.lineTo(hx + h * 0.03, hy + h * 0.012); c.closePath(); c.fill();
  c.restore();
}

/* ---------------------------------------------------------------
   A CAMELLIA BUSH: a mound of glossy dark leaves, red flowers with gold
   stamens, snow lying in clumps on top. o: x (middle), y (the foot), w, h
   --------------------------------------------------------------- */
function leaf(c, x, y, l, a, col, hi) {
  c.save(); c.translate(x, y); c.rotate(a);
  c.fillStyle = rgb(col);
  var wd = leaf.wide || 0.32;
  c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(l * 0.2, -l * wd, l * 0.75, -l * wd, l, 0); c.bezierCurveTo(l * 0.75, l * wd, l * 0.2, l * wd, 0, 0); c.fill();
  if (hi) { c.strokeStyle = rgb(hi, 0.18); c.lineWidth = Math.max(0.4, l * 0.05); c.beginPath(); c.moveTo(l * 0.1, 0); c.lineTo(l * 0.85, 0); c.stroke(); }
  c.restore();
}
function camellia(c, o) {
  var S = shader(o), sc = snowCols(S, o), r = rng(d(o, 'seed', 31)), x = o.x, y = o.y, w = o.w, h = o.h, i;
  var green = [36, 72, 46];
  function inBush(u, v) { return u * u + Math.pow(Math.max(0, v), 1.6) <= 1; }   // u -1 … 1, v 0 (foot) … 1 (top)
  var N = Math.round(d(o, 'leaves', 260)), L = Math.max(4, w * 0.13);
  var items = [];
  for (i = 0; i < N; i++) {
    var u = r() * 2 - 1, v = r();
    if (!inBush(u, v)) continue;
    var px = x + u * w * 0.5, py = y - v * h * Math.sqrt(1 - u * u * 0.6);
    items.push({ x: px, y: py, v: v, u: u, a: r() * TAU, k: r() });
  }
  items.sort(function (a, b) { return a.k - b.k; });
  leaf.wide = 0.3;
  items.forEach(function (I) {
    var light = clamp(0.25 + I.v * 0.55 + I.u * -S.side * 0.25 + I.k * 0.35, 0, 1.2);
    leaf(c, I.x, I.y, L * lerp(0.9, 1.3, I.k), I.a, S(green, S.side * 0.3, light - 0.3, 0.8, light), S([200, 230, 205], 0, 1, 0.5));
  });
  leaf.wide = 0.32;
  // the flowers
  var F = Math.round(d(o, 'flowers', 14));
  for (i = 0; i < F; i++) {
    var fu = r() * 1.8 - 0.9, fv = lerp(0.15, 0.9, r());
    if (!inBush(fu, fv)) continue;
    var fx = x + fu * w * 0.5, fy = y - fv * h * Math.sqrt(1 - fu * fu * 0.6), fr = L * lerp(0.55, 0.8, r());
    flower(c, fx, fy, fr, S, r);
  }
  // the snow in clumps on top
  for (i = 0; i < Math.round(w / L * 1.4); i++) {
    var su = r() * 1.8 - 0.9, sv = lerp(0.55, 1, r());
    if (!inBush(su, sv)) continue;
    var sx = x + su * w * 0.5, sy = y - sv * h * Math.sqrt(1 - su * su * 0.6), sr = L * lerp(0.7, 1.5, r());
    var g = c.createLinearGradient(0, sy - sr * 0.6, 0, sy + sr * 0.5);
    g.addColorStop(0, rgb(sc.top)); g.addColorStop(0.7, rgb(sc.top)); g.addColorStop(1, rgb(mix(sc.top, sc.shade, 0.6)));
    c.fillStyle = g;
    c.beginPath();
    for (var b = 0; b < 4; b++) { var bx = sx + (b - 1.5) * sr * 0.45, by = sy - Math.sin((b + 0.5) / 4 * PI) * sr * 0.25; c.moveTo(bx + sr * 0.4, by); c.ellipse(bx, by, sr * 0.4, sr * 0.32, 0, 0, TAU); }
    c.fill();
  }
}
function flower(c, x, y, rad, S, r) {
  var red = mix(S([226, 34, 40], S.side * 0.3, 0.3, 1), [226, 34, 40], 0.5), deep = S([176, 18, 30], 0, 0.3, 1, 0.7);
  for (var p = 0; p < 5; p++) {
    var a = p / 5 * TAU + r();
    var g = c.createRadialGradient(x, y, rad * 0.1, x, y, rad);
    g.addColorStop(0, rgb(deep)); g.addColorStop(1, rgb(red));
    c.fillStyle = g;
    c.beginPath(); c.ellipse(x + Math.cos(a) * rad * 0.42, y + Math.sin(a) * rad * 0.42, rad * 0.55, rad * 0.45, a, 0, TAU); c.fill();
  }
  c.fillStyle = rgb([244, 206, 96]);
  c.beginPath(); c.arc(x, y, rad * 0.22, 0, TAU); c.fill();
}

/* ---------------------------------------------------------------
   A NANDINA BUSH: thin stems, narrow leaves, clusters of red berries,
   dabs of snow. o: x (middle), y (the foot), w, h
   --------------------------------------------------------------- */
function nandina(c, o) {
  var S = shader(o), sc = snowCols(S, o), r = rng(d(o, 'seed', 41)), x = o.x, y = o.y, w = o.w, h = o.h, i, k;
  var stems = Math.round(d(o, 'stems', 9)), green = [40, 74, 48], stemC = [96, 54, 40];
  for (i = 0; i < stems; i++) {
    var sx = x + (r() - 0.5) * w * 0.4, tx = x + (r() - 0.5) * w, ty = y - h * lerp(0.55, 1, r());
    c.strokeStyle = rgb(S(stemC, 0, 0, 1)); c.lineWidth = Math.max(0.6, h * 0.012);
    c.beginPath(); c.moveTo(sx, y); c.quadraticCurveTo(lerp(sx, tx, 0.3), lerp(y, ty, 0.6), tx, ty); c.stroke();
    // leaves along the stem
    for (k = 0; k < 7; k++) {
      var t = lerp(0.3, 1, k / 6), lx = lerp(sx, tx, t), ly = lerp(y, ty, t), side = k % 2 ? 1 : -1;
      var col = S(mix(green, [120, 40, 30], r() * 0.35), S.side * 0.3, 0.4, 0.8);
      leaf(c, lx, ly, h * lerp(0.1, 0.16, r()), (side > 0 ? -0.5 : PI + 0.5) + (r() - 0.5) * 0.6, col, null);
    }
    // the berries, hanging in a cluster near the top
    var bx = tx + (r() - 0.5) * w * 0.08, by = ty + h * 0.06, nb = 10 + Math.floor(r() * 10), br = h * 0.024;
    for (k = 0; k < nb; k++) {
      var ex = bx + (r() - 0.5) * h * 0.14, ey = by + r() * h * 0.12;
      c.fillStyle = rgb(S([206, 26, 30], S.side * 0.3, 0.4, 1));
      c.beginPath(); c.arc(ex, ey, br, 0, TAU); c.fill();
      c.fillStyle = rgb([255, 200, 190], 0.7);
      c.beginPath(); c.arc(ex + S.side * br * 0.35, ey - br * 0.35, br * 0.3, 0, TAU); c.fill();
    }
    // snow on the top leaves
    c.fillStyle = rgb(sc.top);
    c.beginPath(); c.ellipse(tx, ty - h * 0.01, h * 0.06, h * 0.022, (r() - 0.5) * 0.4, 0, TAU); c.fill();
  }
}

/* ---------------------------------------------------------------
   STEPPING STONES: o.path = [[x, y, w], ...] from the nearest to the
   farthest (w the width of a stone there). Each stone is a flat slab
   of dark slate, the snow round its edge.
   --------------------------------------------------------------- */
function stones(c, o) {
  var S = shader(o), sc = snowCols(S, o), r = rng(d(o, 'seed', 51)), P = o.path, i;
  var slate = [96, 100, 110];
  // the trodden path: a faint blue band
  c.save();
  c.filter = 'blur(' + Math.max(1, P[0][2] * 0.08).toFixed(1) + 'px)';
  c.strokeStyle = rgb(sc.shade, 0.16); c.lineCap = 'round'; c.lineJoin = 'round';
  for (i = 0; i < P.length - 1; i++) {
    c.lineWidth = P[i][2] * 1.5;
    c.beginPath(); c.moveTo(P[i][0], P[i][1]); c.lineTo(P[i + 1][0], P[i + 1][1]); c.stroke();
  }
  c.restore();
  for (i = P.length - 1; i >= 0; i--) {
    var p = P[i], sw = p[2] * lerp(0.75, 1, r()), sh = sw * 0.2, sx = p[0] + (r() - 0.5) * p[2] * 0.25, sy = p[1];
    var two = sw > 30 && r() < 0.35, parts = two ? [[-0.27, 0.48], [0.27, 0.48]] : [[0, 1]];
    for (var q = 0; q < parts.length; q++) {
      var cx = sx + parts[q][0] * sw, ww = sw * parts[q][1] * 0.5, hh = sh * 0.5;
      c.fillStyle = rgb(sc.shade, 0.25);
      c.beginPath(); c.ellipse(cx + ww * 0.05, sy + hh * 0.35, ww * 1.02, hh * 1.05, 0, 0, TAU); c.fill();
      c.beginPath();
      var k, n = 10;
      for (k = 0; k < n; k++) {
        var a = k / n * TAU, rr = lerp(0.9, 1.05, r());
        var sq = Math.pow(Math.abs(Math.cos(a)), 0.5) * (Math.cos(a) < 0 ? -1 : 1), sv = Math.pow(Math.abs(Math.sin(a)), 0.5) * (Math.sin(a) < 0 ? -1 : 1);
        var px = cx + sq * ww * rr, py = sy + sv * hh * rr;
        k ? c.lineTo(px, py) : c.moveTo(px, py);
      }
      c.closePath();
      var g = c.createLinearGradient(0, sy - hh, 0, sy + hh);
      g.addColorStop(0, rgb(S(slate, 0, 1, 0.6, 0.5))); g.addColorStop(1, rgb(S(scale(slate, 0.85), 0, 0.6, 1, 0.3)));
      c.fillStyle = g; c.fill();
      // its lit top edge, a little snow lying on it
      c.strokeStyle = rgb(S(slate, 0, 1, 0.2), 0.8); c.lineWidth = Math.max(0.5, hh * 0.12); c.stroke();
      c.fillStyle = rgb(sc.top, 0.85);
      c.beginPath(); c.ellipse(cx + ww * (r() - 0.5) * 0.8, sy - hh * 0.3, ww * lerp(0.1, 0.25, r()), hh * 0.18, 0, 0, TAU); c.fill();
    }
  }
}

/* ---------------------------------------------------------------
   THE BANKS: the dark earth under the snow along the banks beyond the
   water. o.lines = [[[x, y], ...], ...] (the edge of the snow, left to
   right), o.depth (px, how far the earth shows below it)
   --------------------------------------------------------------- */
function rims(c, o) {
  var S = shader(o), sc = snowCols(S, o), earth = [124, 102, 86];
  o.lines.forEach(function (L) {
    var th = (L.th || o.depth) * 1.5;
    c.beginPath();
    c.moveTo(L.pts[0][0], L.pts[0][1]);
    var i;
    for (i = 1; i < L.pts.length; i++) c.lineTo(L.pts[i][0], L.pts[i][1]);
    for (i = L.pts.length - 1; i >= 0; i--) {
      var t = i / (L.pts.length - 1), k = Math.sin(t * PI) * 0.6 + 0.4;
      c.lineTo(L.pts[i][0], L.pts[i][1] + th * k * (0.8 + 0.3 * Math.sin(i * 1.7)));
    }
    c.closePath();
    var y0 = L.pts[0][1];
    var g = c.createLinearGradient(0, y0, 0, y0 + th);
    g.addColorStop(0, rgb(S(earth, 0, 0, 1, 0.4))); g.addColorStop(1, rgb(S(scale(earth, 0.7), 0, -0.5, 1, 0.2)));
    c.fillStyle = g; c.fill();
    // the snow edge over it
    c.strokeStyle = rgb(sc.top); c.lineWidth = Math.max(1, th * 0.22); c.lineJoin = 'round'; c.lineCap = 'round';
    c.beginPath(); c.moveTo(L.pts[0][0], L.pts[0][1]);
    for (i = 1; i < L.pts.length; i++) c.lineTo(L.pts[i][0], L.pts[i][1]);
    c.stroke();
  });
}

/* ---------------------------------------------------------------
   THE WIND CHIME (風鈴): a string from above, a clear glass bell painted
   with plum blossoms, its clapper, and the paper strip (tanzaku) that
   catches the wind. o: x, y (the bell's top), s (the bell's width),
   swing (radians, the bell), flutter (radians, the strip, extra)
   --------------------------------------------------------------- */
function furin(c, o) {
  var x = o.x, y = o.y, s = o.s, a = d(o, 'swing', 0), b = d(o, 'flutter', 0);
  var ink = 'rgba(30,30,36,0.85)';
  c.save();
  // the string from the top of the screen
  c.strokeStyle = ink; c.lineWidth = Math.max(0.8, s * 0.02);
  c.beginPath(); c.moveTo(x - Math.sin(a) * y, 0); c.lineTo(x, y); c.stroke();
  c.translate(x, y); c.rotate(a);
  var R = s * 0.5, bh = s * 0.62;
  // the glass bell
  var g = c.createRadialGradient(-R * 0.3, bh * 0.3, R * 0.1, 0, bh * 0.45, R * 1.1);
  g.addColorStop(0, 'rgba(255,255,255,0.55)'); g.addColorStop(0.6, 'rgba(230,236,246,0.25)'); g.addColorStop(1, 'rgba(200,210,226,0.35)');
  c.fillStyle = g;
  c.beginPath(); c.moveTo(-R, bh); c.bezierCurveTo(-R, -bh * 0.12, R, -bh * 0.12, R, bh); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(40,40,50,0.8)'; c.lineWidth = Math.max(0.8, s * 0.018); c.stroke();
  c.beginPath(); c.ellipse(0, bh, R, R * 0.14, 0, 0, TAU); c.stroke();
  // plum blossoms painted on the glass
  var r = rng(77);
  for (var k = 0; k < 7; k++) {
    var px = lerp(-R * 0.6, R * 0.5, r()), py = lerp(bh * 0.2, bh * 0.6, r()), pr = s * lerp(0.035, 0.055, r());
    c.fillStyle = 'rgba(214,60,80,0.85)';
    for (var p = 0; p < 5; p++) { var pa = p / 5 * TAU; c.beginPath(); c.arc(px + Math.cos(pa) * pr * 0.6, py + Math.sin(pa) * pr * 0.6, pr * 0.5, 0, TAU); c.fill(); }
  }
  c.fillStyle = 'rgba(255,255,255,0.7)';
  c.beginPath(); c.ellipse(-R * 0.45, bh * 0.4, R * 0.08, bh * 0.25, 0.3, 0, TAU); c.fill();
  // the clapper's string, the strip
  c.strokeStyle = ink; c.lineWidth = Math.max(0.6, s * 0.014);
  c.beginPath(); c.moveTo(0, bh * 0.2); c.lineTo(0, bh * 2.1); c.stroke();
  c.translate(0, bh * 2.1); c.rotate(b);
  var sw = s * 0.62, sl = s * 2.6;
  c.save(); c.transform(1, 0, -0.08, 1, 0, 0);
  var tg = c.createLinearGradient(0, 0, 0, sl);
  tg.addColorStop(0, '#DDEEF8'); tg.addColorStop(0.5, '#A9D2EC'); tg.addColorStop(1, '#C9E6F4');
  c.fillStyle = tg; c.fillRect(-sw / 2, 0, sw, sl);
  c.strokeStyle = 'rgba(30,40,50,0.8)'; c.lineWidth = Math.max(0.7, s * 0.016); c.strokeRect(-sw / 2, 0, sw, sl);
  // bamboo leaves painted on it, faintly
  c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = Math.max(0.5, s * 0.012);
  c.beginPath(); c.moveTo(-sw * 0.1, sl * 0.95); c.quadraticCurveTo(sw * 0.05, sl * 0.6, -sw * 0.05, sl * 0.35); c.stroke();
  c.fillStyle = 'rgba(255,255,255,0.6)';
  for (k = 0; k < 6; k++) {
    var ly = lerp(sl * 0.45, sl * 0.9, k / 5), dir = k % 2 ? 1 : -1;
    c.save(); c.translate(0, ly); c.rotate(dir * 0.7);
    c.beginPath(); c.ellipse(dir * sw * 0.15, 0, sw * 0.18, sw * 0.04, 0, 0, TAU); c.fill();
    c.restore();
  }
  c.beginPath(); c.arc(0, sl * 0.05, s * 0.025, 0, TAU); c.fillStyle = 'rgba(30,30,36,0.8)'; c.fill();
  c.restore();
  c.restore();
}

return { hill: hill, hillTop: hillTop, mistBand: mistBand, pagoda: pagoda, hall: hall, lantern: lantern, ropes: ropes,
         matsu: matsu, crane: crane, camellia: camellia, nandina: nandina, stones: stones, rims: rims, furin: furin,
         glowAt: glowAt };
})();
