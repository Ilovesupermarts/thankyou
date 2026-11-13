/* ============================================================
   WINTERHILL — the snowy hill of firs and the five-storey pagoda (五重塔)
   for the new winter scene (newwinter.html, step 3). Written new for the
   revamp; the app's autumn pagoda (lakeside.js) was the reference for the
   look and feel only. Everything is drawn in code.

   The pagoda is built in 3D and seen through the scene's own camera: the
   eye on the horizon line, the lens of the mountains (22°), so it stands as
   far away and as high above the eye as its place on the screen says. Seen
   from a little below, each roof still shows its snow (a roof slopes far
   more steeply than the line of sight rises) and a sliver of the underside
   of its eaves.

   Every fir is its own tree: its height, width, number of tiers, how they
   droop and are spaced, its lean, its top, how much snow it holds and the
   colour of its needles all come from its own seed.

     WinterHill.camera(W, H, horizon, lensDeg)   → cam { F, cx, hy } (CSS px)
     WinterHill.pagoda(c, cam, o)    the pagoda: o.x, o.top, o.foot (CSS px on the screen: its middle, the tip
                                     of its spire, its foot), yaw (radians, turned from facing you), style
                                     ('timber' | 'vermilion'), lit (0 … 1.5: its windows), snow (0 … 1.5),
                                     light (see below)
     WinterHill.fir(c, x, y, h, seed, look)    one fir: its foot (x, y), its height h (CSS px)
     WinterHill.hill(c, o)           the hill and its firs, back to front, with o.before(c, u) called at each
                                     row (u 0 the crest … 1 the foot), so the pagoda can stand between rows
   light: { sun: [x, y, z] toward the sun (x right, y up, z toward you), sunCol, skyCol ([r, g, b] 0 … 1.5),
            amb, haze: [r, g, b] the mist's colour }
   ============================================================ */
var WinterHill = (function () {
'use strict';

// The right bank's firs as drawn on the hill (look.painter) go on a graphics-chip canvas by default. With look.cpu
// (the test bed's firCpu) the row is a main-processor canvas (willReadFrequently) at twice the size (SS), shrunk when
// laid down: faster where the graphics chip is emulated in software, slower on the tablet's real chip (its Report).
// At these small sizes the main processor draws the finest strokes harder, so twice the size keeps the true look.
var CPU = { willReadFrequently: true }, SS = 2;

var PI = Math.PI, TAU = PI * 2;
function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
function mix(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }
function hex(h) { var n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function css(c, a) {
  return 'rgba(' + Math.round(clamp(c[0], 0, 255)) + ',' + Math.round(clamp(c[1], 0, 255)) + ',' + Math.round(clamp(c[2], 0, 255)) + ',' +
         (a === undefined ? 1 : clamp(a, 0, 1).toFixed(3)) + ')';
}
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
function norm(v) { var l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }

/* ---------- the camera: the eye on the horizon line, looking straight ahead (+z) ---------- */
function camera(W, H, horizon, lensDeg) {
  return { F: (H / 2) / Math.tan((lensDeg || 22) / 2 * PI / 180), cx: W / 2, hy: horizon };
}
function proj(cam, p) { return [cam.cx + cam.F * p[0] / p[2], cam.hy - cam.F * p[1] / p[2]]; }

/* ---------- light on a surface: the sun on the side turned to it, the sky from above ---------- */
function shade(base, n, L, k) {
  var d = Math.max(0, dot(n, norm(L.sun))) * (k === undefined ? 1 : k), s = (0.55 + 0.45 * n[1]) * L.amb;
  return [base[0] * (L.sunCol[0] * d + L.skyCol[0] * s), base[1] * (L.sunCol[1] * d + L.skyCol[1] * s), base[2] * (L.sunCol[2] * d + L.skyCol[2] * s)];
}

/* =====================================================================
   THE PAGODA
   ===================================================================== */
var PAL = {
  timber:    { wall: '#4A2C20', post: '#2C1A14', beam: '#5A3426', rail: '#6B3A26', soffit: '#5E3A28', bracket: '#7A4A30' },
  vermilion: { wall: '#EDE3D2', post: '#C24A2E', beam: '#B4432A', rail: '#B4432A', soffit: '#8A5236', bracket: '#C9893E' }
};
var STEP = hex('#CFC7BA'), TILE = hex('#3B3A43'), FASCIA = hex('#2C2A30'), SNOW = hex('#F6F6FA'), GOLD = hex('#D2A24A');
var GLOW = hex('#FFB65C'), PANE_DAY = hex('#2C2422');

function pagoda(c, cam, o) {
  var hgt = o.foot - o.top;                       // its height on the screen (px)
  // where it stands: from its place and size on the screen, through the camera
  var S = 60;                                      // its height in the world (m): a tall five-storey pagoda
  var Z = cam.F * S / hgt;                         // so this far away
  var X = (o.x - cam.cx) * Z / cam.F, Y0 = (cam.hy - o.foot) * Z / cam.F;
  var yaw = o.yaw || 0, cs = Math.cos(yaw), sn = Math.sin(yaw);
  var P = PAL[o.style] || PAL.timber, lit = o.lit || 0, snowK = o.snow === undefined ? 1 : o.snow;
  // the vermilion style's colours from the panel (o.colours.wall, o.colours.red: the posts, with the beams and rails
  // kept in the same shade relation to them); unchanged colours leave the palette exactly as it was
  if (o.style === 'vermilion' && o.colours) {
    var Pc = {}, kk;
    for (kk in P) Pc[kk] = P[kk];
    if (o.colours.wall && o.colours.wall.toLowerCase() !== P.wall.toLowerCase()) Pc.wall = o.colours.wall;
    if (o.colours.red && o.colours.red.toLowerCase() !== P.post.toLowerCase()) {
      var red = hex(o.colours.red), p0 = hex(P.post);
      Pc.post = o.colours.red;
      ['beam', 'rail'].forEach(function (m) {
        var b0 = hex(P[m]), c3 = [0, 1, 2].map(function (i) { return Math.round(clamp(red[i] * b0[i] / Math.max(1, p0[i]), 0, 255)); });
        Pc[m] = '#' + c3.map(function (v) { return ('0' + v.toString(16)).slice(-2); }).join('');
      });
    }
    P = Pc;
  }
  // the light, turned into the camera's space (there, toward you is -z)
  var L = { sun: [o.light.sun[0], o.light.sun[1], -o.light.sun[2]], sunCol: o.light.sunCol, skyCol: o.light.skyCol, amb: o.light.amb, haze: o.light.haze };
  var Lsun = norm(L.sun), litLeft = o.light.sun[0] < 0;
  var hz = o.haze || 0;
  function Wp(x, y, z) { return [X + x * cs + z * sn, Y0 + y, Z - x * sn + z * cs]; }       // local → world (z local: toward the back)
  function Pw(p) { return proj(cam, Wp(p[0], p[1], p[2])); }                                // local → screen
  var eye = [0, 0, 0];
  function fin(col) { return mix(col, L.haze, hz); }
  // everything is drawn on a layer just the size of the pagoda and its snow (the soft blurs then cost little), then laid down
  var main = c, T0 = c.getTransform(), bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
  [-0.6, 0.6].forEach(function (ax) { [-0.1, 1.05].forEach(function (ay) { [-0.6, 0.6].forEach(function (az) {
    var p = Pw([ax * S, ay * S, az * S]); bx0 = Math.min(bx0, p[0]); by0 = Math.min(by0, p[1]); bx1 = Math.max(bx1, p[0]); by1 = Math.max(by1, p[1]);
  }); }); });
  bx0 -= 8; by0 -= 8; bx1 += 8; by1 += 8;
  var layer = document.createElement('canvas');
  layer.width = Math.max(1, Math.ceil((bx1 - bx0) * T0.a)); layer.height = Math.max(1, Math.ceil((by1 - by0) * T0.d));
  c = layer.getContext('2d'); c.setTransform(T0.a, 0, 0, T0.d, -bx0 * T0.a, -by0 * T0.d);

  /* ---------- what is drawn, in order: groups of faces, each followed by what is painted over them ---------- */
  var items = [], cur = null;
  function group(post) { cur = { faces: [], post: post || null }; items.push(cur); }
  function face(pts, mat, mid, det) { cur.faces.push({ p: pts.map(function (q) { return Wp(q[0], q[1], q[2]); }), mat: mat, mid: Wp(mid[0], mid[1], mid[2]), det: det }); }
  function box(cx, cy, cz, hx, hy, hz2, mat, det, sides, map) {
    var v = [];
    for (var i = 0; i < 8; i++) {
      var pt = [cx + (i & 1 ? hx : -hx), cy + (i & 2 ? hy : -hy), cz + (i & 4 ? hz2 : -hz2)];
      v.push(map ? map(pt) : pt);
    }
    var Q = [[0, 1, 3, 2], [5, 4, 6, 7], [4, 0, 2, 6], [1, 5, 7, 3], [2, 3, 7, 6], [4, 5, 1, 0]];   // front, back, left, right, top, bottom
    for (var f = 0; f < 6; f++) {
      if (f === 5 && sides && sides.bottom === 'none') continue;          // (resting on the ground: no underside)
      if (f === 4 && sides && sides.top === 'none') continue;
      var m = (f === 4 && sides && sides.top) || (f === 5 && sides && sides.bottom) || mat;
      face(Q[f].map(function (k) { return v[k]; }), m, map ? map([cx, cy, cz]) : [cx, cy, cz], f < 4 ? det : null);
    }
  }

  /* ---------- the build ---------- */
  var b0 = 0.105 * S;
  var stH = [0.088, 0.076, 0.072, 0.068, 0.064];
  var storeyY = [], st, y;
  // the floor stands a little above the hill; the snow is banked up to it all round, right against the walls
  var hp = 0.055 * S, bp = b0;
  y = hp;
  for (st = 0; st < 5; st++) { storeyY.push(y); y += stH[st] * S + 0.045 * S; }
  var spireBase = y;
  var SIDES = [[0, 0, -1], [1, 0, 0], [0, 0, 1], [-1, 0, 0]];
  function sideMap(k) { var d = SIDES[k]; return function (a, out, yy) { return [a * -d[2] + out * d[0], yy, a * d[0] + out * d[2]]; }; }

  // the spire (相輪): the base, nine rings, the water flame and the jewel, gilt
  group();
  var sp = 0.3 * S;
  box(0, spireBase + sp * 0.5, 0, 0.006 * S, sp * 0.5, 0.006 * S, 'gold');
  box(0, spireBase + 0.012 * S, 0, 0.03 * S, 0.012 * S, 0.03 * S, 'gold');
  for (var k = 0; k < 9; k++) {
    var rr = 0.021 * S * (1 - 0.035 * k), ry = spireBase + 0.045 * S + k * 0.017 * S;
    box(0, ry, 0, rr, 0.004 * S, rr, 'gold');
  }
  box(0, spireBase + 0.215 * S, 0, 0.016 * S, 0.014 * S, 0.016 * S, 'gold');
  box(0, spireBase + 0.245 * S, 0, 0.01 * S, 0.012 * S, 0.01 * S, 'gold');
  box(0, spireBase + sp * 0.97, 0, 0.006 * S, 0.01 * S, 0.006 * S, 'goldLit');

  // the storeys, from the top down: a lower roof hides the storey above it from below
  var R0 = null;                                    // (the bottom roof, kept to tell the hill where its eave is)
  for (st = 4; st >= 0; st--) {
    var b = b0 * (1 - 0.075 * st), h = stH[st] * S, yb = storeyY[st];
    var R = { ey: yb + h + 0.024 * S, e: b * (st === 0 ? 2.2 : 2.05), rise: st === 4 ? 0.06 * S : 0.032 * S,
              inner: st === 4 ? 0.03 * S : b0 * (1 - 0.075 * (st + 1)) * 1.02, lift: 0.022 * S, th: 0.011 * S, top: st === 4, seed: 101 + st * 17 };
    group(roofSnow(R));
    box(0, yb + h / 2, 0, b, h / 2, b, 'wall', 'wall');                               // posts, rail, windows
    box(0, yb + h + 0.006 * S, 0, b * 1.12, 0.006 * S, b * 1.12, 'bracket', 'bracket', { bottom: 'soffit' });
    box(0, yb + h + 0.017 * S, 0, b * 1.3, 0.006 * S, b * 1.3, 'bracket', 'bracket', { bottom: 'soffit' });
    roof(R);
    if (st === 0) R0 = R;
  }

  // the hill's snow round the pagoda: banked against the walls up to the floor, sloping away down the hill
  var run = 0.3 * S, drop = 0.07 * S;
  function groundAt(d) { return hp - (hp + drop) * d / run; }        // the snow's height, d out from the wall
  group(paintBank);

  // the steps, down the side turned most toward the eye, from the floor at the wall to the snow
  var best = 0, bestV = -2;
  SIDES.forEach(function (d, kk) {
    var wn = [d[0] * cs + d[2] * sn, 0, -d[0] * sn + d[2] * cs], cen = Wp(d[0] * bp, 0, d[2] * bp), toEye = norm(sub(eye, cen));
    var v = wn[0] * toEye[0] + wn[2] * toEye[2];
    if (v > bestV) { bestV = v; best = kk; }
  });
  var SD = SIDES[best];
  function stairMap(p) { return [p[0] * -SD[2] + (-p[2]) * SD[0], p[1], p[0] * SD[0] + (-p[2]) * SD[2]]; }
  var nSt = 7, dz = 0.024 * S, Ls = nSt * dz, yEnd = groundAt(Ls), rs = (hp - yEnd) / nSt, ws = b0 * 0.55, lipH = rs * 0.55;
  // the snow drifted against each side of the flight: the far one behind the steps, the near one in front of them
  var drifts = [-1, 1].map(function (sd) {
    var p0 = Wp.apply(null, stairMap([sd * ws, (hp + yEnd) / 2, -bp - Ls / 2])), p1 = Wp.apply(null, stairMap([0, (hp + yEnd) / 2, -bp - Ls / 2]));
    var n = norm(sub(p0, p1));                                         // the steps' end on this side faces this way
    return { sd: sd, seen: dot(n, sub(eye, p0)) > 0 };
  }).sort(function (A, B) { return (A.seen ? 1 : 0) - (B.seen ? 1 : 0); });
  group(function () { paintDrift(drifts[0].sd); });
  for (var q = 1; q <= nSt; q++) {
    // each step stands on the snow: its stone front only down to the snow's level (nothing of it below the snow shows)
    var yk = hp - (q - 1) * rs - rs, ybot = groundAt(q * dz), zf = -bp - q * dz, zc = -bp - (q - 0.5) * dz;
    group(stepLip(yk, zf));
    if (yk - ybot > 0.002 * S) box(0, (yk + ybot) / 2, zc, ws, (yk - ybot) / 2, dz / 2, 'step', 'riser', { top: 'none', bottom: 'none' }, stairMap);
  }
  group(function () { paintDrift(drifts[1].sd); });

  /* ---------- the roofs ---------- */
  function eave(R, u, side, up) {                  // a point on one side's eave, u -1 … 1, lifted toward the corners
    var kk = Math.pow(Math.abs(u), 2.4) * R.lift + (up || 0);
    var a = u * R.e, Y = R.ey + kk;
    return side === 0 ? [a, Y, -R.e] : side === 1 ? [R.e, Y, a] : side === 2 ? [-a, Y, R.e] : [-R.e, Y, -a];
  }
  function ring(u, side, r, Y) {
    var a = u * r;
    return side === 0 ? [a, Y, -r] : side === 1 ? [r, Y, a] : side === 2 ? [-a, Y, r] : [-r, Y, -a];
  }
  function roof(R) {
    var seg = 8, midUp = [0, R.ey + R.rise * 0.2, 0], midDown = [0, R.ey + R.rise + R.th * 4, 0], axis = [0, R.ey, 0];
    for (var side = 0; side < 4; side++) {
      var sideSoffit = [eave(R, -1, side, -R.th), eave(R, 1, side, -R.th), ring(1, side, R.e * 0.6, R.ey - R.th * 1.4), ring(-1, side, R.e * 0.6, R.ey - R.th * 1.4)]
        .map(function (q) { return Wp(q[0], q[1], q[2]); });
      for (var s = 0; s < seg; s++) {
        var u0 = -1 + 2 * s / seg, u1 = -1 + 2 * (s + 1) / seg;
        var a = eave(R, u0, side), bb = eave(R, u1, side), A = ring(u0, side, R.inner, R.ey + R.rise), B = ring(u1, side, R.inner, R.ey + R.rise);
        var a2 = eave(R, u0, side, -R.th), b2 = eave(R, u1, side, -R.th);
        face([a2, b2, ring(u1, side, R.e * 0.6, R.ey - R.th * 1.4), ring(u0, side, R.e * 0.6, R.ey - R.th * 1.4)], 'soffit', midDown, 'rafters');
        cur.faces[cur.faces.length - 1].grp = sideSoffit;               // shaded as one piece with the rest of its side
        face([a2, b2, bb, a], 'fascia', axis);
        face([a, bb, B, A], 'tile', midUp, 'tiles');
      }
    }
  }
  // which sides of a square (sides 0 … 3) are turned to the eye, as one run going round, so their outlines join up
  function visibleRun(isVis) {
    var v = [0, 1, 2, 3].map(isVis), run = [];
    if (v.every(Boolean)) return [0, 1, 2, 3];
    var start = -1;
    for (var i = 0; i < 4; i++) if (v[i] && !v[(i + 3) % 4]) { start = i; break; }
    if (start < 0) return run;
    for (var j = 0; j < 4 && v[(start + j) % 4]; j++) run.push((start + j) % 4);
    return run;
  }
  function wob(r) {                                 // a gentle random waviness along a line (a sum of a few waves)
    var ph = [r() * TAU, r() * TAU, r() * TAU], fr = [lerp(5, 8, r()), lerp(11, 17, r()), lerp(23, 31, r())];
    return function (t) { return (Math.sin(t * fr[0] + ph[0]) * 0.55 + Math.sin(t * fr[1] + ph[1]) * 0.3 + Math.sin(t * fr[2] + ph[2]) * 0.15); };
  }

  /* ---------- painted snow: soft bands from a bright crest to a blue underside, lumpy, with no straight edges ---------- */
  function snowColour(n) {                          // snow lit from a direction n (world), blue in its own shade
    var col = shade(SNOW, n, L, 1), sh = Math.max(0, dot(n, Lsun));
    return fin(mix(mix(col, [168, 178, 214], (1 - sh) * 0.35), [255, 250, 242], sh * 0.15));
  }
  function poly(pts) { c.beginPath(); pts.forEach(function (p, i) { if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }); c.closePath(); }
  function lerpChain(A, B, t) { return A.map(function (p, i) { return [lerp(p[0], B[i][0], t), lerp(p[1], B[i][1], t)]; }); }
  function xGradient(chain, cols, alpha) {          // colours along a chain (one per point), as a gradient across the screen
    var x0 = chain[0][0], x1 = chain[chain.length - 1][0];
    if (Math.abs(x1 - x0) < 1) x1 = x0 + 1;
    var g = c.createLinearGradient(x0, 0, x1, 0), step = Math.max(1, Math.floor(chain.length / 12));
    for (var i = 0; i < chain.length; i += step) g.addColorStop(clamp((chain[i][0] - x0) / (x1 - x0), 0, 1), css(cols[i], alpha === undefined ? 1 : alpha));
    g.addColorStop(clamp((chain[chain.length - 1][0] - x0) / (x1 - x0), 0, 1), css(cols[cols.length - 1], alpha === undefined ? 1 : alpha));
    return g;
  }
  // a band of snow between two chains, in fine steps of colour from one edge to the other. The steps are drawn sharp and
  // solid (blurring thin steps would turn the snow see-through); the soft outline comes from one blurred copy of the
  // whole shape laid underneath them
  function softBands(A, B, colsA, colsB, n, alphaA, alphaB) {
    var aA = alphaA === undefined ? 1 : alphaA, aB = alphaB === undefined ? 1 : alphaB;
    n = Math.max(n, 6);
    c.save();
    c.filter = 'blur(' + (0.9 * c.getTransform().a).toFixed(2) + 'px)';
    poly(A.concat(B.slice().reverse()));
    c.fillStyle = xGradient(lerpChain(A, B, 0.5), colsA.map(function (ca, j) { return mix(ca, colsB[j], 0.5); }), Math.min(aA, aB) * 0.9);
    c.fill();
    c.filter = 'none';
    for (var i = 0; i < n; i++) {
      var t0 = i / n, t1 = Math.min(1, (i + 1) / n + (i < n - 1 ? 0.5 / n : 0)), C0 = lerpChain(A, B, t0), C1 = lerpChain(A, B, t1);
      var tm = (i + 0.5) / n, cols = colsA.map(function (ca, j) { return mix(ca, colsB[j], tm); });
      poly(C0.concat(C1.slice().reverse()));
      c.fillStyle = xGradient(C0, cols, lerp(aA, aB, tm));
      c.fill();
    }
    c.restore();
  }
  function roofSnow(R) {
    return function () {
      if (snowK <= 0) return;
      var sT = 0.022 * S * snowK, N = 20, r = rng(R.seed), w1 = wob(r), w2 = wob(r);
      var axisW = Wp(0, R.ey, 0);
      var run = visibleRun(function (side) {
        var pa = Wp.apply(null, eave(R, 0, side)), pb = Wp.apply(null, ring(0, side, R.inner, R.ey + R.rise));
        var pl = Wp.apply(null, eave(R, -0.5, side)), pr = Wp.apply(null, eave(R, 0.5, side));
        var n = norm(cross(sub(pr, pl), sub(pb, pa))), cen = [(pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2, (pa[2] + pb[2]) / 2];
        if (dot(n, sub(cen, axisW)) < 0) n = [-n[0], -n[1], -n[2]];
        return dot(n, sub(eye, cen)) > 0;
      });
      if (!run.length) return;
      var Bot = [], Top = [], Back = [], cTop = [], cLip = [], cUnder = [], tAll = 0, total = run.length * N;
      run.forEach(function (side, si) {
        var pa = Wp.apply(null, eave(R, 0, side)), pb = Wp.apply(null, ring(0, side, R.inner, R.ey + R.rise));
        var pl = Wp.apply(null, eave(R, -0.5, side)), pr = Wp.apply(null, eave(R, 0.5, side));
        var nTop = norm(cross(sub(pr, pl), sub(pb, pa)));
        if (nTop[1] < 0) nTop = [-nTop[0], -nTop[1], -nTop[2]];
        var nOut = norm([pa[0] - axisW[0], 0, pa[2] - axisW[2]]);           // the lip faces straight out
        var ctop = snowColour(nTop), clip = snowColour(norm([nOut[0], 0.35, nOut[2]])), cund = mix(snowColour(nOut), [150, 160, 200], 0.35);
        for (var i = (si ? 1 : 0); i <= N; i++) {
          var u = -1 + 2 * i / N, tt = (si * N + i) / total;
          var kk = 1 - 0.75 * smooth01((Math.abs(u) - 0.7) / 0.3);          // thinner toward the very corners (no further back), ending in a soft point
          var ev = eave(R, u, side), rg = ring(u, side, R.inner, R.ey + R.rise);
          var bl = mix(ev, rg, 0.1);                                      // the lip stands where it always did: 10 % in from the edge
          var lumpB = w1(tt * 3) * 0.16, lumpT = w2(tt * 3) * 0.2;
          Bot.push(Pw([bl[0], bl[1] - sT * lumpB * kk, bl[2]]));
          Top.push(Pw([bl[0], bl[1] + sT * kk * (1 + lumpT), bl[2]]));
          Back.push(Pw([rg[0], rg[1] + sT * (R.top ? 1.2 : 0.95), rg[2]]));
          cTop.push(ctop); cLip.push(clip); cUnder.push(cund);
        }
      });
      // the shade the snow casts on the roof's edge just under it
      c.save(); c.filter = 'blur(1px)';
      var Sh = Bot.map(function (p, i) { var d = Math.hypot(Top[i][0] - p[0], Top[i][1] - p[1]); return [p[0], p[1] + d * 0.6]; });
      poly(Bot.concat(Sh.slice().reverse())); c.fillStyle = 'rgba(30,26,48,0.28)'; c.fill();
      c.restore();
      // the top of the snow, back from the crest (seen a little from below: a narrow band)
      softBands(Top, Back, cTop.map(function (cc) { return mix(cc, [255, 252, 246], 0.25); }), cTop.map(function (cc) { return mix(cc, [176, 184, 218], 0.2); }), 5);
      // the rounded front of the snow: bright at its crest, blue underneath; rounded ends
      softBands(Top, Bot, cTop.map(function (cc) { return mix(cc, [255, 252, 246], 0.3); }), cUnder, 7);
    };
  }
  function smooth01(x) { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); }
  function roundEnd(t, b, t2, b2, col) {           // the rounded end of a band of snow, bulging out past its last point
    var mx = (t[0] + b[0]) / 2, my = (t[1] + b[1]) / 2, d = Math.hypot(t[0] - b[0], t[1] - b[1]);
    if (d < 1) return;
    var dx = t[0] - t2[0], dy = t[1] - t2[1], l = Math.hypot(dx, dy) || 1;
    c.save(); c.filter = 'blur(0.6px)'; c.fillStyle = css(col);
    c.beginPath(); c.ellipse(mx + dx / l * d * 0.15, my, d * 0.55, d * 0.5, 0, 0, TAU); c.fill();
    c.restore();
  }

  /* ---------- the snow banked round the pagoda, and drifted beside the steps ---------- */
  function paintBank() {
    var N = 16, r = rng(77), w1 = wob(r), w2 = wob(r);
    var run = visibleRun(function (side) {
      var M = sideMap(side), p0 = Wp.apply(null, M(0, bp, hp)), p1 = Wp.apply(null, M(0, bp + run0(), groundAt(run0())));
      var n = norm(cross(sub(Wp.apply(null, M(1, bp, hp)), Wp.apply(null, M(-1, bp, hp))), sub(p1, p0)));
      if (n[1] < 0) n = [-n[0], -n[1], -n[2]];
      return dot(n, sub(eye, p0)) > 0;
    });
    if (!run.length) return;
    var In = [], Out = [], Mid = [], cIn = [], cOut = [], tAll = run.length * N;
    run.forEach(function (side, si) {
      var M = sideMap(side), d = SIDES[side];
      var nTop = norm([d[0] * 0.35, 1, d[2] * 0.35]);
      var wn = [nTop[0] * cs + nTop[2] * sn, nTop[1], -nTop[0] * sn + nTop[2] * cs];
      var cc = snowColour(wn);
      for (var i = (si ? 1 : 0); i <= N; i++) {
        var u = -1 + 2 * i / N, tt = (si * N + i) / tAll, a = u * bp;
        // the corners round off: the bank is a soft mound, not a square
        var ro = run0() * (1 - 0.25 * Math.pow(Math.abs(u), 4));
        In.push(Pw(M(a, bp - 0.01 * S, hp + 0.008 * S * (1 + 0.5 * w1(tt * 2)))));
        Out.push(Pw(M(u * (bp + ro * 0.8), bp + ro, groundAt(ro) + 0.01 * S * w2(tt * 5))));
        cIn.push(cc); cOut.push(mix(cc, L.haze, 0.3));
        if (side === best) bankCol = mix(cc, L.haze, 0.15);
      }
    });
    // painted solid on a layer of its own, then faded out toward the hill in one smooth sweep (no stepped bands)
    var main = c, T0 = c.getTransform(), bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
    In.concat(Out).forEach(function (p) { bx0 = Math.min(bx0, p[0]); by0 = Math.min(by0, p[1]); bx1 = Math.max(bx1, p[0]); by1 = Math.max(by1, p[1]); });
    bx0 -= 6; by0 -= 6; bx1 += 6; by1 += 6;
    // a layer just the size of the bank (in device pixels), with the same drawing transform, moved to its corner
    var lay = document.createElement('canvas');
    lay.width = Math.max(1, Math.ceil((bx1 - bx0) * T0.a)); lay.height = Math.max(1, Math.ceil((by1 - by0) * T0.d));
    c = lay.getContext('2d'); c.setTransform(T0.a, 0, 0, T0.d, -bx0 * T0.a, -by0 * T0.d);
    softBands(In, Out, cIn, cOut, 8);
    // the shade where the snow meets the walls
    c.save(); c.filter = 'blur(1.2px)';
    var In2 = In.map(function (p, i) { return [lerp(p[0], Out[i][0], 0.06), lerp(p[1], Out[i][1], 0.06)]; });
    poly(In.concat(In2.slice().reverse())); c.fillStyle = 'rgba(120,128,170,0.3)'; c.fill();
    c.restore();
    var ctr = Pw([0, hp, 0]), rx = 1, ry = 1;
    Out.forEach(function (p) { rx = Math.max(rx, Math.abs(p[0] - ctr[0])); ry = Math.max(ry, Math.abs(p[1] - ctr[1])); });
    c.save(); c.globalCompositeOperation = 'destination-out';
    c.translate(ctr[0], ctr[1]); c.scale(1, ry / rx);
    var fade = c.createRadialGradient(0, 0, 0, 0, 0, rx);
    fade.addColorStop(0, 'rgba(0,0,0,0)'); fade.addColorStop(0.45, 'rgba(0,0,0,0)'); fade.addColorStop(1, 'rgba(0,0,0,1)');
    c.fillStyle = fade; c.fillRect(-rx, -rx, rx * 2, rx * 2);
    c.restore();
    c = main;
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(lay, bx0 * T0.a + T0.e, by0 * T0.d + T0.f); c.restore();
  }
  function run0() { return run; }
  function paintDrift(sd) {
    // the snow lying against the ends of the steps: it follows the flight step by step (rounded over each step's edge,
    // settling on each tread), covers the ends of the steps up to the snow on the treads, and runs out sideways into
    // the hill's snow. Lumpy and shaded by the light, so it reads as drifted snow, not a rail
    var N = nSt * 8, r = rng(sd > 0 ? 31 : 37), w1 = wob(r), w2 = wob(r), w3 = wob(r);
    if (!bankCol) bankCol = snowColour([0, 1, 0]);
    var Crest = [], Low = [], Foot = [], cc = [], cs2 = [], cf = [];
    function world(nS) { var m0 = stairMap(nS); return norm([m0[0] * cs + m0[2] * sn, m0[1], -m0[0] * sn + m0[2] * cs]); }
    var colTop = snowColour(world([sd * 0.25, 1, 0])), colOut = snowColour(world([sd * 0.7, 0.7, 0])), colFace = snowColour(world([sd, 0.25, -0.2]));
    var colDip = snowColour(world([0, 0.5, 1]));                       // the snow rounding down over a step's edge, turned down the flight
    for (var i = 0; i <= N; i++) {
      var t = i / N, dd = t * Ls, f = Math.min(dd / dz, nSt - 1e-6), q0 = Math.floor(f), fr = f - q0;
      var fall = smooth01(fr / 0.4), slope = fr < 0.4 ? Math.sin(Math.PI * fr / 0.4) : 0;
      var tread = hp - rs * (q0 + fall);                                // the treads' level, rounded over each edge
      var lift = lipH * (0.75 + 0.3 * w1(t * 2.5)) * (1 - smooth01((t - 0.9) / 0.1));
      var top = Math.max(groundAt(dd) + 0.002 * S, tread + lift);
      var out = 1.05 + 0.04 * w3(t * 3);
      Crest.push(Pw(stairMap([sd * ws * out, top, -bp - dd])));
      Low.push(Pw(stairMap([sd * ws * 1.1, groundAt(dd), -bp - dd])));
      var spread = lerp(1.6 + 0.25 * (w2(t * 2) + 1) * 0.5, 1.12, smooth01((t - 0.55) / 0.45));   // narrowing to nothing at the foot
      Foot.push(Pw(stairMap([sd * ws * spread, groundAt(dd + 0.02 * S), -bp - dd])));
      var ct = mix(colTop, colDip, slope * 0.55);
      cc.push(ct); cs2.push(mix(mix(colFace, [150, 160, 204], 0.5), colDip, slope * 0.3)); cf.push(mix(colOut, bankCol, 0.6));
    }
    // its outer slope, painted solid on a layer of its own and faded out into the hill in one smooth sweep, so it has
    // no outer edge
    var main = c, T0 = c.getTransform(), bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
    Crest.concat(Foot, Low).forEach(function (p) { bx0 = Math.min(bx0, p[0]); by0 = Math.min(by0, p[1]); bx1 = Math.max(bx1, p[0]); by1 = Math.max(by1, p[1]); });
    bx0 -= 6; by0 -= 6; bx1 += 6; by1 += 6;
    var lay = document.createElement('canvas');
    lay.width = Math.max(1, Math.ceil((bx1 - bx0) * T0.a)); lay.height = Math.max(1, Math.ceil((by1 - by0) * T0.d));
    c = lay.getContext('2d'); c.setTransform(T0.a, 0, 0, T0.d, -bx0 * T0.a, -by0 * T0.d);
    softBands(Crest, Foot, cc, cf, 10);
    var cm = Crest[Math.round(N / 2)], fm = Foot[Math.round(N / 2)];
    c.save(); c.globalCompositeOperation = 'destination-out';
    var fade = c.createLinearGradient(cm[0], cm[1], fm[0], fm[1]);
    fade.addColorStop(0, 'rgba(0,0,0,0)'); fade.addColorStop(0.3, 'rgba(0,0,0,0)'); fade.addColorStop(1, 'rgba(0,0,0,1)');
    c.fillStyle = fade; c.fillRect(bx0, by0, bx1 - bx0, by1 - by0);
    c.restore();
    // the face over the steps' ends, on the same layer
    softBands(Crest, Low, cc.map(function (x, k) { return mix(x, cs2[k], 0.2); }), cs2, 8);
    c = main;
    // laid down a little blurred, so its edges are soft
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.filter = 'blur(' + (1.3 * T0.a).toFixed(2) + 'px)';
    c.drawImage(lay, bx0 * T0.a + T0.e, by0 * T0.d + T0.f); c.restore();
  }
  var bankCol = null;
  function paintFootDrift() {
    // the snow drifted over the foot of the flight: a soft mound, fading out on every side, the lowest steps sinking into it
    if (!bankCol) bankCol = snowColour([0, 1, 0]);
    var ctr = Pw(stairMap([0, yEnd - rs * 0.2, -bp - Ls + dz * 0.4])), a = Pw(stairMap([-ws * 1.4, yEnd, -bp - Ls])), b = Pw(stairMap([ws * 1.4, yEnd, -bp - Ls]));
    var rx = Math.max(4, Math.hypot(b[0] - a[0], b[1] - a[1]) / 2), ry = Math.max(2, rs * 2.2 * cam.F / Z), ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    c.save(); c.translate(ctr[0], ctr[1]); c.rotate(ang); c.scale(1, ry / rx);
    var g = c.createRadialGradient(0, -rx * 0.15, 0, 0, 0, rx), top = mix(bankCol, [255, 252, 246], 0.25);
    g.addColorStop(0, css(top, 1)); g.addColorStop(0.45, css(mix(top, bankCol, 0.5), 0.95)); g.addColorStop(0.75, css(bankCol, 0.6)); g.addColorStop(1, css(bankCol, 0));
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, rx, 0, TAU); c.fill();
    c.restore();
  }
  function stepLip(yk, zf) {
    // the snow lying on a step: seen from below, the rounded front of it along the step's edge
    return function () {
      var N = 10, r = rng(Math.round(zf * 100)), w1 = wob(r), Bot = [], Top = [], cT = [], cU = [];
      var nOut = stairMap([0, 0.35, -1]), wn = norm([nOut[0] * cs + nOut[2] * sn, nOut[1], -nOut[0] * sn + nOut[2] * cs]);
      var col = snowColour(wn);
      for (var i = 0; i <= N; i++) {
        var x = lerp(-ws * 1.02, ws * 1.02, i / N);
        Bot.push(Pw(stairMap([x, yk - lipH * 0.15, zf])));
        Top.push(Pw(stairMap([x, yk + lipH * (1 + 0.25 * w1(i / N * 2)), zf + dz * 0.15])));
        cT.push(mix(col, [255, 252, 246], 0.3)); cU.push(mix(col, [150, 160, 200], 0.35));
      }
      c.save(); c.filter = 'blur(0.8px)';
      var Sh = Bot.map(function (p, i) { var d = Math.hypot(Top[i][0] - p[0], Top[i][1] - p[1]); return [p[0], p[1] + d * 0.8]; });
      poly(Bot.concat(Sh.slice().reverse())); c.fillStyle = 'rgba(40,36,60,0.3)'; c.fill();
      c.restore();
      softBands(Top, Bot, cT, cU, 3);
    };
  }

  // how each material's colour runs across its face, from its lower (or outer) edge to its upper (or inner) one
  var RAMP = { wall: [1.04, 0.86], soffit: [1.0, 0.5], tile: [1.15, 0.8], fascia: [0.85, 1.12], bracket: [1.12, 0.78],
               step: [0.82, 1.06], gold: [1.0, 1.0], goldLit: [1.0, 1.0] };
  function paintFace(f, n0, gn) {
    var pts = f.p.map(function (q) { return proj(cam, q); }), n = gn || n0;
    var gp = f.grp ? f.grp.map(function (q) { return proj(cam, q); }) : pts;   // the shape the shading runs across
    var m = f.mat, col;
    if (m === 'gold' || m === 'goldLit') {
      col = shade(GOLD, n, L, 1);
      col = mix(col, [255, 226, 150], m === 'goldLit' ? 0.5 : Math.max(0, dot(n, Lsun)) * 0.35);
    } else if (m === 'tile') col = shade(TILE, n, L, 1);
    else if (m === 'fascia') col = shade(FASCIA, n, L, 1);
    else if (m === 'step') col = shade(STEP, n, L, 1);
    else col = shade(hex(P[m] || P.wall), n, L, 1);
    // the lamps inside light the undersides of the eaves and the brackets warm
    if (lit > 0 && (m === 'soffit' || m === 'bracket')) col = mix(col, [255, 170, 90], clamp(0.35 * lit, 0, 0.6));
    var ramp = RAMP[m] || [1, 1];
    if (pts.length === 4) {
      var e0 = [(gp[0][0] + gp[1][0]) / 2, (gp[0][1] + gp[1][1]) / 2], e1 = [(gp[2][0] + gp[3][0]) / 2, (gp[2][1] + gp[3][1]) / 2];
      var g = c.createLinearGradient(e0[0], e0[1], e1[0] + 0.01, e1[1] + 0.01);
      g.addColorStop(0, css(fin([col[0] * ramp[0], col[1] * ramp[0], col[2] * ramp[0]])));
      g.addColorStop(1, css(fin([col[0] * ramp[1], col[1] * ramp[1], col[2] * ramp[1]])));
      c.fillStyle = g;
    } else c.fillStyle = css(fin(col));
    poly(pts); c.fill();
    if (m !== 'wall') { c.strokeStyle = c.fillStyle; c.lineWidth = 0.7; c.lineJoin = 'round'; c.stroke(); c.lineJoin = 'miter'; }   // (round joins: a mitred join on a sharp corner shoots out as a spike)    // no hairline gaps between pieces
    // the light falls off across the face, away from the sun's side
    if (pts.length === 4 && m !== 'gold' && m !== 'goldLit') {
      var xs = gp.map(function (p) { return p[0]; }), x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs);
      if (x1 - x0 > 2) {
        var gx = c.createLinearGradient(x0, 0, x1, 0);
        gx.addColorStop(litLeft ? 0 : 1, 'rgba(255,238,215,0.07)'); gx.addColorStop(litLeft ? 1 : 0, 'rgba(25,18,40,0.12)');
        c.fillStyle = gx; poly(pts); c.fill();
      }
    }
    if (m === 'gold' && pts.length === 4) {          // the rings of the spire read round: lit on one side, dark on the other
      var gx2 = c.createLinearGradient(Math.min(pts[0][0], pts[3][0]), 0, Math.max(pts[1][0], pts[2][0]), 0);
      gx2.addColorStop(0, litLeft ? 'rgba(255,240,190,0.3)' : 'rgba(40,24,8,0.35)'); gx2.addColorStop(1, litLeft ? 'rgba(40,24,8,0.35)' : 'rgba(255,240,190,0.3)');
      c.fillStyle = gx2; poly(pts); c.fill();
    }
    if (f.det === 'wall') wallDetail(f, pts, n);
    else if (f.det === 'bracket') bracketDetail(pts, col);
    else if (f.det === 'riser') riserDetail(pts);
    else if (f.det === 'rafters') rafterDetail(pts, col);
    else if (f.det === 'tiles') tileDetail(pts, col);
  }
  function P2(pts, s, t) {                          // a point in a quad (0 bottom-left, 1 bottom-right, 2 top-right, 3 top-left)
    var bl = pts[0], br = pts[1], tr = pts[2], tl = pts[3];
    var bx = lerp(bl[0], br[0], s), by = lerp(bl[1], br[1], s), tx = lerp(tl[0], tr[0], s), ty = lerp(tl[1], tr[1], s);
    return [lerp(bx, tx, t), lerp(by, ty, t)];
  }
  function quad(pts, s0, s1, t0, t1, fill) {
    var a = P2(pts, s0, t0), b = P2(pts, s1, t0), d = P2(pts, s1, t1), e = P2(pts, s0, t1);
    c.fillStyle = fill; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(d[0], d[1]); c.lineTo(e[0], e[1]); c.closePath(); c.fill();
  }
  function screenQuad(pts0) {                       // the corners as bottom-left, bottom-right, top-right, top-left on the screen
    var pts = pts0.slice().sort(function (A, B) { return B[1] - A[1]; });
    var bot = pts.slice(0, 2).sort(function (A, B) { return A[0] - B[0]; }), tp = pts.slice(2).sort(function (A, B) { return A[0] - B[0]; });
    return [bot[0], bot[1], tp[1], tp[0]];
  }
  function wallDetail(f, pts0, n) {
    var Q = screenQuad(pts0), w = Math.abs(Q[1][0] - Q[0][0]);
    if (w < 3) return;
    var post = css(fin(shade(hex(P.post), n, L, 1))), beam = css(fin(shade(hex(P.beam), n, L, 1)));
    var bays = 3;
    quad(Q, 0, 1, 0, 0.12, css(fin(shade(hex(P.rail), n, L, 1))));          // the balcony rail along the foot
    quad(Q, 0, 1, 0.84, 1, beam);                                           // the tie beam
    for (var j = 0; j < bays; j++) {
      var s0 = j / bays + 0.06, s1 = (j + 1) / bays - 0.06;
      var paneCol = lit > 0 ? mix(PANE_DAY, GLOW, clamp(lit, 0, 1)) : mix(PANE_DAY, shade([150, 140, 150], n, L, 1), 0.25);
      quad(Q, s0, s1, 0.22, 0.76, css(fin(paneCol)));
      if (w > 14) {
        c.strokeStyle = css(fin(lit > 0 ? mix(GLOW, [120, 60, 30], 0.6) : [40, 28, 24]), 0.9); c.lineWidth = Math.max(0.4, w * 0.006);
        c.beginPath();
        for (var v = 1; v < 4; v++) { var sv = lerp(s0, s1, v / 4), a = P2(Q, sv, 0.22), b = P2(Q, sv, 0.76); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
        var a2 = P2(Q, s0, 0.49), b2 = P2(Q, s1, 0.49); c.moveTo(a2[0], a2[1]); c.lineTo(b2[0], b2[1]);
        c.stroke();
      }
    }
    for (var i = 0; i <= bays; i++) { var s = i / bays; quad(Q, Math.max(0, s - 0.035), Math.min(1, s + 0.035), 0, 1, post); }
    // the shade of the eave above, and the light falling off across the wall
    var A = P2(Q, 0.5, 1), B = P2(Q, 0.5, 0.35), g = c.createLinearGradient(A[0], A[1], B[0], B[1]);
    g.addColorStop(0, 'rgba(15,8,6,' + (0.5 * (1 - 0.6 * clamp(lit, 0, 1))) + ')'); g.addColorStop(1, 'rgba(15,8,6,0)');
    quad(Q, 0, 1, 0.35, 1, g);
    var gx = c.createLinearGradient(Q[0][0], 0, Q[1][0], 0);
    gx.addColorStop(litLeft ? 0 : 1, 'rgba(255,236,210,0.08)'); gx.addColorStop(litLeft ? 1 : 0, 'rgba(25,15,30,0.16)');
    quad(Q, 0, 1, 0, 1, gx);
  }
  function bracketDetail(pts, col) {
    var Q = pts, w = Math.hypot(Q[1][0] - Q[0][0], Q[1][1] - Q[0][1]);
    if (w < 6) return;
    var n = clamp(Math.round(w / 4), 4, 30), dk = css(fin(mix(col, [0, 0, 0], 0.45)));
    for (var i = 0; i < n; i++) { var s0 = (i + 0.3) / n, s1 = (i + 0.7) / n; quad(Q, s0, s1, 0.15, 0.85, dk); }
  }
  function tileDetail(pts, col) {                   // the courses of round tiles running down the roof, faint
    var w = Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]);
    if (w < 4) return;
    var n = clamp(Math.round(w / 2.5), 2, 10); c.strokeStyle = css(fin(mix(col, [0, 0, 0], 0.4)), 0.6); c.lineWidth = 0.5;
    c.beginPath();
    for (var i = 1; i < n; i++) { var a = P2(pts, i / n, 0), b = P2(pts, i / n, 1); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
    c.stroke();
  }
  function riserDetail(pts0) {
    var Q = screenQuad(pts0);
    if (Math.abs(Q[2][1] - Q[1][1]) < 1) return;
    // darker toward its foot (the step below and the snow on it close the light out)
    var A = P2(Q, 0.5, 0), B = P2(Q, 0.5, 1), g = c.createLinearGradient(A[0], A[1], B[0], B[1]);
    g.addColorStop(0, 'rgba(40,34,44,0.4)'); g.addColorStop(0.5, 'rgba(40,34,44,0.06)'); g.addColorStop(1, 'rgba(40,34,44,0)');
    quad(Q, 0, 1, 0, 1, g);
  }
  function rafterDetail(pts, col) {
    var w = Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]);
    if (w < 5) return;
    var n = clamp(Math.round(w / 3), 2, 12); c.strokeStyle = css(fin(mix(col, [0, 0, 0], 0.25)), 0.4); c.lineWidth = 0.5;   // faint
    c.beginPath();
    for (var i = 1; i < n; i++) { var a = P2(pts, i / n, 0), b = P2(pts, i / n, 1); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
    c.stroke();
  }
  /* ---------- draw ---------- */
  items.forEach(function (it) {
    var vis = [];
    it.faces.forEach(function (f) {
      var p = f.p, n = [0, 0, 0];
      for (var qi = 0; qi < p.length; qi++) {                 // Newell's normal: from every edge, not just one corner
        var A0 = p[qi], B0 = p[(qi + 1) % p.length];
        n[0] += (A0[1] - B0[1]) * (A0[2] + B0[2]); n[1] += (A0[2] - B0[2]) * (A0[0] + B0[0]); n[2] += (A0[0] - B0[0]) * (A0[1] + B0[1]);
      }
      n = norm(n);
      var cen = [0, 0, 0]; p.forEach(function (qq) { cen[0] += qq[0] / p.length; cen[1] += qq[1] / p.length; cen[2] += qq[2] / p.length; });
      if (dot(n, sub(cen, f.mid)) < 0) n = [-n[0], -n[1], -n[2]];          // pointing out of its solid
      if (dot(n, sub(eye, cen)) <= 0) return;                              // turned away
      var gn = n;
      if (f.grp) {                                     // one light for a whole side of the eave's underside
        var g0 = f.grp; gn = [0, 0, 0];
        for (var gi = 0; gi < 4; gi++) {
          var GA = g0[gi], GB = g0[(gi + 1) % 4];
          gn[0] += (GA[1] - GB[1]) * (GA[2] + GB[2]); gn[1] += (GA[2] - GB[2]) * (GA[0] + GB[0]); gn[2] += (GA[0] - GB[0]) * (GA[1] + GB[1]);
        }
        gn = norm(gn); if (dot(gn, n) < 0) gn = [-gn[0], -gn[1], -gn[2]];
      }
      vis.push({ f: f, n: n, gn: gn, d: Math.hypot(cen[0], cen[1], cen[2]) });
    });
    vis.sort(function (A, B) { return B.d - A.d; });
    vis.forEach(function (v) { paintFace(v.f, v.n, v.gn); });
    if (it.post) it.post();
  });

  // lay the pagoda down (blurred by the depth of field when it is on: a lens focused at o.dof.focus m, as the pines')
  c = main;
  var dofPx = 0;
  if (o.dof && o.dof.on) {
    var fo = Math.max(5, o.dof.focus || 200);
    dofPx = Math.min(o.dof.max === undefined ? 3 : o.dof.max, Math.abs(1 / Z - 1 / fo) * fo * 3 * (o.dof.strength === undefined ? 1 : o.dof.strength)) * T0.a;
  }
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
  if (dofPx > 0.05) c.filter = 'blur(' + dofPx.toFixed(2) + 'px)';
  c.drawImage(layer, bx0 * T0.a + T0.e, by0 * T0.d + T0.f); c.restore();
  // after dusk: a soft warm glow round the lit storeys
  if (lit > 0) {
    c.save(); c.globalCompositeOperation = 'lighter';
    for (st = 0; st < 5; st++) {
      var yy = storeyY[st] + stH[st] * S * 0.5, pc = proj(cam, Wp(0, yy, -b0)), r0 = b0 * 2.4 * cam.F / Z;
      var gl = c.createRadialGradient(pc[0], pc[1], 0, pc[0], pc[1], r0);
      gl.addColorStop(0, css(GLOW, 0.22 * lit)); gl.addColorStop(1, css(GLOW, 0));
      c.fillStyle = gl; c.fillRect(pc[0] - r0, pc[1] - r0, r0 * 2, r0 * 2);
    }
    c.restore();
  }
  var stairEnd = proj(cam, Wp.apply(null, stairMap([0, yEnd, -bp - Ls])));
  // where the bottom roof's eave is on the screen: its ends across, and its lowest point (no tree in front may rise past it)
  var ex0 = 1e9, ex1 = -1e9, eyLow = -1e9;
  for (var es = 0; es < 4; es++) for (var eu = -1; eu <= 1.001; eu += 0.25) {
    var ep = proj(cam, Wp.apply(null, eave(R0, eu, es, -R0.th)));
    ex0 = Math.min(ex0, ep[0]); ex1 = Math.max(ex1, ep[0]); eyLow = Math.max(eyLow, ep[1]);
  }
  return { Z: Z, dof: dofPx, footY: o.foot, stairs: { x: stairEnd[0], y: stairEnd[1], w: ws * 1.4 * cam.F / Z }, eave: { x0: ex0, x1: ex1, y: eyLow } };
}

/* =====================================================================
   ONE FIR — tiers of drooping needle skirts, each with a pillow of snow
   ===================================================================== */
var NEEDLES = ['#2F4A3B', '#2B4440', '#35473A', '#283C37', '#3A4C3C', '#2E3F3E', '#3E5040'].map(hex);
function fir(c, x, y, h, seed, look) {
  // another painter can draw the tree in this one's place (the page's: the right bank's firs, yukitsuri.js); the hill's
  // own random numbers and places are untouched by it
  if (look.painter) return look.painter(c, x, y, h, seed, look);   // (it may hand back a job to be stepped: { step(ms) })
  var r = rng(seed * 7919 + 13), L = look.light, hz = look.haze || 0;
  // this tree's own build: every tree is different (crown shape, fullness, lopsidedness, snow, colour)
  var wr = lerp(0.3, 0.62, r()) * (look.width || 1);            // width / height
  var shapeP = lerp(0.7, 1.3, r());                               // < 1: a column with a short point; > 1: a slim cone
  var n = Math.max(4, Math.round(lerp(6, 12, r()) * (look.tiers || 1)));
  var sparse = r() < (look.sparse === undefined ? 0.35 : look.sparse) ? lerp(0.25, 0.5, r()) : 0;           // a sparse tree: gaps between its tiers show the trunk
  var leanK = (look.lean === undefined ? 1 : look.lean), lean = (r() - 0.5) * 0.08 * h * leanK, bend = (r() - 0.5) * 0.05 * h * leanK;
  var droop = clamp(lerp(0.15, 0.6, r()) * (look.droop === undefined ? 1 : look.droop), 0, 0.9), asym = (r() - 0.5) * 0.35;  // one side longer than the other
  var snow = clamp(look.snow * lerp(0.55, 1.25, r()), 0, 1.6);     // (the same range as before)
  var needle = mix(NEEDLES[Math.floor(r() * NEEDLES.length)], [r() * 40, 40 + r() * 30, 30 + r() * 30], 0.15);
  needle = mix(needle, [0, 0, 0], (r() - 0.5) * 0.2);
  if (look.needleTint > 0 && look.needleCol) needle = mix(needle, look.needleCol, clamp(look.needleTint, 0, 1));   // toward the chosen needle colour
  var topKind = r(), trunkShow = r() < 0.5 ? lerp(0.03, 0.09, r()) : 0, broken = r() < 0.15;
  var w = h * wr, base = y - h * trunkShow;
  var fin = function (col) { return mix(col, L.haze, hz); };
  var lx = L.sun[0] < 0 ? -1 : 1;                              // which side the light is on
  var dark = fin(mix(needle, [0, 0, 0], 0.28)), mid = fin(shade(needle, [lx * 0.5, 0.4, 0.75], L, 1.2)), sh = fin(mix(needle, [20, 30, 50], 0.35));
  var hi = fin(mix(shade(needle, [lx * 0.8, 0.5, 0.4], L, 1.3), [200, 210, 190], 0.12));
  var snowLit = fin(shade(SNOW, norm([lx * 0.7, 0.8, 0.4]), L, 1)), snowSh = fin(mix(shade(SNOW, [0, 1, 0], L, 0), [178, 186, 216], 0.45));
  var snowUnder = fin(mix(snowSh, [120, 128, 170], 0.3));
  var bw = Math.max(0.45, h * 0.0075);                            // a brush stroke's width (px)

  // drawn on a layer of its own, then laid down a little soft (softer with distance), so no edge is ruler-sharp
  // (the hill draws a whole row of firs on one layer and softens it once: look.direct)
  var main = c, T0 = c.getTransform(), sc = T0.a, lay = null;
  var bx0 = x - w * 0.85 - Math.abs(lean) - 4, bx1 = x + w * 0.85 + Math.abs(lean) + 4, by0 = y - h * 1.1 - 4, by1 = y + 4;
  if (!look.direct) {
    lay = document.createElement('canvas');
    lay.width = Math.max(1, Math.ceil((bx1 - bx0) * sc)); lay.height = Math.max(1, Math.ceil((by1 - by0) * sc));
    c = lay.getContext('2d'); c.setTransform(sc, 0, 0, sc, -bx0 * sc, -by0 * sc);
  }
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';

  // the trunk, seen in the gaps
  var tx = x + lean, ty = y - h;
  function trunkX(f) { var t = f; return lerp(x, tx, t) + bend * Math.sin(t * PI); }
  c.strokeStyle = css(fin([54, 42, 40])); c.lineWidth = Math.max(0.7, h * 0.018);
  c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + bend * 0.9 + lean * 0.4, y - h * 0.42, trunkX(0.85), y - h * 0.85); c.stroke();   // (it ends inside the crown)
  
  // the tiers, from the bottom up; each a pair of drooping boughs with tufted edges and hanging needle clumps
  var tiers = [], hgt = h * (1 - trunkShow);
  for (var i = 0; i < n; i++) {
    var f = i / n;
    var hem = base - hgt * Math.pow(f, 0.95) * lerp(0.95, 1.05, r());
    var tierH = hgt / n * lerp(1.4, 2.0, r()) * (1 - sparse * 0.55);
    var half = w / 2 * Math.pow(1 - f, shapeP) * lerp(0.8, 1.15, r());
    if (broken && i === Math.floor(n * lerp(0.4, 0.7, r()))) half *= 0.5;      // a gap where a branch broke
    var fy = (base - hem + tierH) / h;                                       // where this tier joins the trunk
    // (each tier's top stays below the tree's top: the spike is the very top)
    tiers.push({ hem: hem, top: Math.max(hem - tierH, y - h * 0.965), half: Math.max(half, h * 0.025), cx: trunkX(clamp(fy, 0, 1)),
                 lL: 1 - asym + (r() - 0.5) * 0.3, lR: 1 + asym + (r() - 0.5) * 0.3, dr: clamp(droop + (r() - 0.5) * 0.25, 0.05, 0.8),
                 sn: snow * lerp(0.5, 1.25, r()), seed: r() * 1e6 });
  }
  // a slim spike of needles growing out of the top tier (its foot hidden in that tier), not a bare stick; sometimes a
  // second, smaller one branching off it
  // no tier floats: the gap between a tier and the one above it is never more than a small, even one on a sparse tree
  // (and none on the others), however the random sizes fall
  for (var gi2 = 0; gi2 < n - 1; gi2++) {
    var allow = (sparse ? 0.12 : -0.1) * hgt / n;
    var T2 = tiers[gi2], H2b = T2.hem - T2.top;
    // (a tier's needles begin a quarter of its height below its top, at the trunk: count that too)
    if (T2.top + 0.25 * H2b > tiers[gi2 + 1].hem + allow) T2.top = (tiers[gi2 + 1].hem + allow - 0.25 * T2.hem) / 0.75;
  }
  tiers[n - 1].isTop = true;
  var topT = tiers[n - 1], bend1 = (r() - 0.5) * h * 0.02, tipJ = (r() - 0.5) * h * 0.015;
  var sbx = topT.cx, sby = topT.top + (topT.hem - topT.top) * 0.5, stx = tx + tipJ, sty = ty;     // its tip is the tree's top
  var wb = Math.max(0.8, topT.half * 0.55);
  function spike(bx, by, tx2, ty2, wb2, bendX) {
    var gS = c.createLinearGradient(bx - wb2, 0, bx + wb2, 0);
    gS.addColorStop(0, css(lx < 0 ? mid : sh)); gS.addColorStop(0.5, css(dark)); gS.addColorStop(1, css(lx < 0 ? sh : mid));
    c.fillStyle = gS;
    c.beginPath(); c.moveTo(bx - wb2, by);
    c.quadraticCurveTo((bx + tx2) / 2 + bendX - wb2 * 0.25, (by + ty2) / 2, tx2, ty2);
    c.quadraticCurveTo((bx + tx2) / 2 + bendX + wb2 * 0.25, (by + ty2) / 2, bx + wb2, by);
    c.closePath(); c.fill();
  }
  spike(sbx, sby, stx, sty, wb, bend1);
  if (topKind < 0.15) {
    var jt = 0.35, jx = lerp(sbx, stx, jt), jy = lerp(sby, sty, jt), sgL = r() < 0.5 ? -1 : 1;
    spike(jx, jy + wb * 0.8, jx + sgL * h * 0.018, jy - h * 0.035, wb * 0.6, 0);
  }
  for (var j = 0; j < n; j++) tier(tiers[j]);

  function tier(T) {
    var rr = rng(T.seed | 0), cx = T.cx, H2 = T.hem - T.top;
    // each side's upper edge: out from the trunk and down, bumpy with tufts (not a straight line)
    function side(sg, len) {
      var pts = [], k = Math.max(5, Math.round(T.half * len / Math.max(1.2, h * 0.02)));
      for (var s = 0; s <= k; s++) {
        var u = s / k, dx = sg * T.half * len * u;
        var dy = T.top + H2 * (0.25 + 0.75 * Math.pow(u, 1 - T.dr * 0.6));          // (the old bough line, so the snow on it shows)
        var tuft = (s > 0 && s < k) ? -Math.abs(rr() - 0.4) * H2 * 0.14 : 0;
        pts.push([cx + dx, dy + tuft]);
      }
      var e = pts[pts.length - 1];
      pts.push([e[0] + sg * H2 * 0.08, e[1] + H2 * lerp(0.08, 0.2, rr())]);   // the needle tip, drooping
      return pts;
    }
    var Ls = side(-1, T.lL), Rs = side(1, T.lR);
    var xl = Ls[Ls.length - 1][0], xr = Rs[Rs.length - 1][0];
    // the hem: rounded clumps of needles hanging at uneven depths (soft scallops, no saw teeth)
    var hemPts = [], m = Math.max(3, Math.round((xr - xl) / Math.max(2, h * 0.04)));
    for (var q = 0; q <= m; q++) {
      var u2 = q / m, hx = lerp(xr, xl, u2), sag = Math.sin(u2 * PI) * H2 * 0.1;
      hemPts.push([hx, T.hem + sag + H2 * lerp(-0.04, 0.12, rr())]);
    }
    // the hem starts and ends exactly at the boughs' tips, so the outline has no spur there
    hemPts[0] = Rs[Rs.length - 1].slice(); hemPts[m] = Ls[Ls.length - 1].slice();
    function outline() {
      c.beginPath(); c.moveTo(cx, T.top - H2 * 0.04);
      Rs.forEach(function (p) { c.lineTo(p[0], p[1]); });
      for (var q2 = 1; q2 < hemPts.length; q2++) {
        var a = hemPts[q2 - 1], b = hemPts[q2], mx = (a[0] + b[0]) / 2, my = Math.max(a[1], b[1]) + H2 * lerp(0.04, 0.14, rr());
        c.quadraticCurveTo(mx, my, b[0], b[1]);
      }
      Ls.slice().reverse().forEach(function (p) { c.lineTo(p[0], p[1]); });
      c.closePath();
    }
    outline();
    var g = c.createLinearGradient(xl, 0, xr, 0);
    if (lx < 0) { g.addColorStop(0, css(mid)); g.addColorStop(0.55, css(dark)); g.addColorStop(1, css(sh)); }
    else { g.addColorStop(0, css(sh)); g.addColorStop(0.45, css(dark)); g.addColorStop(1, css(mid)); }
    c.fillStyle = g; c.fill();
    // brush texture: short strokes of needles along the boughs, out and down from the trunk, in several tones
    c.save(); outline(); c.clip();
    var area = (xr - xl) * H2 * 0.6, ns = Math.min(90, Math.max(4, Math.round(area / (bw * bw * 5))));
    var ys = c.createLinearGradient(0, T.top, 0, T.hem + H2 * 0.3);      // the underside of each tier lies in shade
    ys.addColorStop(0, 'rgba(0,0,0,0)'); ys.addColorStop(0.6, 'rgba(0,0,0,0)'); ys.addColorStop(1, css(mix(sh, [10, 14, 30], 0.4), 0.3));
    c.fillStyle = ys; c.fillRect(xl - 2, T.top - 2, xr - xl + 4, H2 * 1.6);
    c.lineWidth = bw;
    var brushK = (look.brush === undefined ? 1 : look.brush), nDraw = Math.round(ns * brushK), extra = nDraw > ns ? rng((T.seed | 0) + 77) : null;
    for (var t2 = 0; t2 < Math.max(ns, nDraw); t2++) {
      var R2 = t2 < ns ? rr : extra;                                  // (strokes past the usual number: their own random numbers)
      var sx = lerp(xl, xr, R2()), sy = lerp(T.top, T.hem + H2 * 0.15, R2()), sg2 = sx < cx ? -1 : 1;
      var ln = H2 * lerp(0.1, 0.28, R2()), ang = lerp(0.3, 0.9, R2());
      var lit = (sg2 === lx ? 0.6 : 0.15) + R2() * 0.3, tone = R2();
      var col = tone < 0.45 ? dark : tone < 0.8 ? (lit > 0.6 && R2() < 0.5 ? hi : mid) : sh;
      var ex = sx + sg2 * ln * Math.cos(ang), ey = sy + ln * Math.sin(ang);
      var alphaS = lerp(0.18, 0.42, R2());
      if (t2 >= nDraw) continue;
      c.strokeStyle = css(col, alphaS);
      c.beginPath(); c.moveTo(sx, sy); c.quadraticCurveTo((sx + ex) / 2 + sg2 * ln * 0.15, (sy + ey) / 2 - ln * 0.1, ex, ey); c.stroke();
    }
    c.restore();
    // the snow on the boughs: a lumpy pillow along each upper edge, thick near the trunk, thinning out, its end
    // broken off at its own place on each side
    if (T.sn > 0.05) {
      var th = H2 * 0.28 * T.sn;
      [[Ls, -1], [Rs, 1]].forEach(function (pair) {
        var pts = pair[0], sg3 = pair[1], last = pts.length - 2;
        var reach = Math.max(1, Math.round(last * lerp(0.6, 0.98, Math.min(1, T.sn)) * lerp(0.85, 1.05, rr())));
        var Top = [], Bot = [];
        for (var s2 = T.isTop ? 1 : 0; s2 <= Math.min(reach, last); s2++) {   // (the top tier's snow starts a little out from the spike)
          var p = pts[s2], u3 = s2 / reach, tk = th * (1 - u3 * 0.5);
          var lump = (0.75 + 0.5 * rr());
          var down = sg3 === lx ? 0 : tk * 0.4;                         // on the shaded side it lies partly on the needles
          Top.push([p[0], p[1] - tk * lump + down]);
          Bot.push([p[0], p[1] + tk * 0.45 * (0.6 + 0.6 * rr()) + down]);
        }
        if (Top.length < 2) return;
        var endP = pts[Math.min(reach, last)];
        // (on the shaded side: snow in shade, pale and only faintly blue, so it reads as snow, not as a shadow)
        var litSide = sg3 === lx, cA = litSide ? snowLit : mix(snowLit, snowSh, 0.45), cB = litSide ? mix(snowLit, snowSh, 0.4) : mix(snowLit, snowSh, 0.75);
        // the pillow: rounded joins and a rounded end, no straight edge. Its blue underside first, then its lit top
        // (from the top down to just below the bough's edge), shaded along the bough: brighter near the trunk
        function pillow(Lo) {
          c.beginPath(); c.moveTo(Top[0][0], Top[0][1]);
          for (var a2 = 1; a2 < Top.length; a2++) { var A = Top[a2 - 1], B = Top[a2]; c.quadraticCurveTo(A[0], A[1], (A[0] + B[0]) / 2, (A[1] + B[1]) / 2); }
          var tl = Top[Top.length - 1], bl = Lo[Lo.length - 1];
          c.quadraticCurveTo(endP[0] + sg3 * th * 0.2, (tl[1] + bl[1]) / 2, bl[0], bl[1]);
          for (var b2 = Lo.length - 2; b2 >= 0; b2--) c.lineTo(Lo[b2][0], Lo[b2][1]);
          c.closePath();
        }
        pillow(Bot); c.fillStyle = css(snowUnder); c.fill();
        pillow(Top.map(function (p, k2) { return [lerp(p[0], Bot[k2][0], 0.85), lerp(p[1], Bot[k2][1], 0.85)]; }));
        var g3 = c.createLinearGradient(Top[0][0], 0, Top[Top.length - 1][0] + sg3 * 0.01, 0);
        g3.addColorStop(0, css(cA)); g3.addColorStop(1, css(cB));
        c.fillStyle = g3; c.fill();
      });
    }
  }
  c.restore();
  if (!lay) return;
  c = main;
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.filter = 'blur(' + (firSoft(hz, sc) * (look.soft === undefined ? 1 : look.soft)).toFixed(2) + 'px)';
  c.drawImage(lay, bx0 * T0.a + T0.e, by0 * T0.d + T0.f); c.restore();
}
function firSoft(hz, sc) { return (0.3 + hz * 0.3) * sc; }     // how soft a fir is laid down (device px), softer with distance

/* =====================================================================
   THE HILL — its snowy body, then rows of firs from the crest down to its
   foot, each row nearer and so larger; the far rows fade into the air
   ===================================================================== */
/* The hill drawn a little at a time: job.step(ms) draws for about that long (the hill's snow, then each row's
   trees one by one, each row laid down softened when its last tree is drawn, the pagoda where o.before puts it)
   and returns true when it has finished. The trees, their places and their random numbers are exactly those of
   drawing it all at once (hill). */
function hillJob(c, o) {
  var r = rng(o.seed || 11), L = o.light;
  var prof = o.profile;                                         // the crest: [[x, y] …] in CSS px, left to right
  function crestY(x) {
    for (var i = 1; i < prof.length; i++) if (x <= prof[i][0]) { var t = (x - prof[i - 1][0]) / (prof[i][0] - prof[i - 1][0]); return lerp(prof[i - 1][1], prof[i][1], t); }
    return prof[prof.length - 1][1];
  }
  var x0 = prof[0][0], x1 = prof[prof.length - 1][0], foot = o.foot;
  var rows = o.rows, k = 0, row = -1, R = null, done = false;
  // timing only (the Report): the JS time spent on the hill's snow, and on each row (placing + the pagoda, the trees, the softening)
  var ST = { body: 0, rows: [], steps: 0, work: 0 };
  var look0 = o.look || {};
  function body() {
    // the hill's snow, lit from the side of the sun, blue in the hollows
    var snowLit = mix(shade(SNOW, norm([L.sun[0] < 0 ? -0.5 : 0.5, 0.8, 0.3]), L, 1), L.haze, o.hazeFar * 0.6);
    var snowSh = mix(mix(shade(SNOW, [0, 1, 0], L, 0), [176, 184, 214], 0.4), L.haze, o.hazeFar * 0.6);
    c.beginPath(); c.moveTo(x0, foot + 2);
    for (var x = x0; x <= x1; x += 4) c.lineTo(x, Math.min(foot, crestY(x)));     // (never below its own foot)
    c.lineTo(x1, Math.min(foot, crestY(x1)));
    c.lineTo(x1, foot); c.closePath();
    var g = c.createLinearGradient(x0, 0, x1, 0);
    g.addColorStop(0, css(L.sun[0] < 0 ? snowLit : snowSh)); g.addColorStop(1, css(L.sun[0] < 0 ? snowSh : snowLit));
    c.fillStyle = g; c.fill();
  }
  // a row: o.before first (the pagoda may stand here), then where each of its trees stands (the same random
  // numbers, in the same order, as drawing them one after another)
  function startRow() {
    var u = rows > 1 ? row / (rows - 1) : 1, tp = performance.now();
    if (o.before) o.before(c, u);
    var beforeMs = performance.now() - tp;
    var hgt = lerp(o.treeFar, o.treeNear, Math.pow(u, 1.25));        // nearer rows: larger (perspective)
    var haze = lerp(o.hazeFar, o.hazeNear, u);
    var gap = hgt * lerp(0.28, 0.42, o.density === undefined ? 0.5 : 1 - o.density);
    var trees = [];
    for (var xx = x0 - hgt * 0.3 + r() * gap; xx < x1 + hgt * 0.2; xx += gap * lerp(0.6, 1.5, r())) {
      var cy = crestY(xx);
      if (cy >= foot - 2) continue;
      // the foot of this row: from just under the crest down to the hill's foot
      var yy = Math.min(foot - 1, lerp(cy + hgt * 0.35, foot, Math.pow(u, 0.9)) + (r() - 0.5) * hgt * 0.25);   // never below the hill's foot
      if (yy < cy + hgt * 0.2) continue;
      if (o.clearing && o.clearing(xx, yy, u)) continue;          // left open (a glade, round the pagoda)
      if (r() > (o.fill === undefined ? 1 : o.fill)) continue;     // a sparse slope leaves gaps
      if (o.noTrees) continue;                                      // (the pagoda alone)
      var hh = hgt * lerp(0.7, 1.3, r()) * (r() < 0.08 ? 1.5 : 1);
      if (o.tooTall && o.tooTall(xx, yy, hh, u)) continue;           // would rise in front of something that must show
      trees.push([xx, yy, hh, (o.seed || 11) * 1000 + (k++)]);
    }
    // the whole row on one layer, softened once as it is laid down
    var T0 = c.getTransform(), sc = T0.a, ry0 = foot, rx0 = x0 - hgt, rx1 = x1 + hgt;
    prof.forEach(function (p) { ry0 = Math.min(ry0, p[1]); });
    ry0 -= hgt * 2.2; var ry1 = foot + 4;
    // (the new firs, look0.painter: on the main processor at twice the size, shrunk when the row is laid down; the older
    // firs as before)
    var ss = look0.painter && look0.cpu ? SS : 1, lay = document.createElement('canvas');
    lay.width = Math.max(1, Math.ceil((rx1 - rx0) * sc * ss)); lay.height = Math.max(1, Math.ceil((ry1 - ry0) * sc * ss));
    var lc = lay.getContext('2d', ss > 1 ? CPU : undefined); lc.setTransform(sc * ss, 0, 0, sc * ss, -rx0 * sc * ss, -ry0 * sc * ss);
    var look = { light: L, haze: haze, snow: o.snow, width: o.treeWidth, direct: true };
    for (var lk in look0) look[lk] = look0[lk];
    return { trees: trees, i: 0, lay: lay, lc: lc, look: look, haze: haze, T0: T0, sc: sc, rx0: rx0, ry0: ry0, ss: ss,
             st: { u: u, n: trees.length, h: hgt, before: beforeMs, place: performance.now() - tp - beforeMs, trees: 0, soften: 0, w0: tp } };
  }
  function endRow() {
    var te = performance.now();
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
    c.filter = 'blur(' + (firSoft(R.haze, R.sc) * (o.soft === undefined ? 1 : o.soft)).toFixed(2) + 'px)';
    c.imageSmoothingQuality = 'high';
    c.drawImage(R.lay, R.rx0 * R.T0.a + R.T0.e, R.ry0 * R.T0.d + R.T0.f, R.lay.width / R.ss, R.lay.height / R.ss); c.restore();
    R.st.soften = performance.now() - te; R.st.wall = performance.now() - R.st.w0; ST.rows.push(R.st);
    R = null;
  }
  var started = false;
  function step(ms) {
    if (done) return true;
    var t0 = performance.now(), lim = ms === undefined ? Infinity : ms;
    ST.steps++;
    if (!started) { started = true; var tb = performance.now(); body(); ST.body = performance.now() - tb; if (performance.now() - t0 >= lim) { ST.work += performance.now() - t0; return false; } }
    while (true) {
      if (!R) {
        row++;
        if (row >= rows) { if (o.before) o.before(c, 2); done = true; ST.work += performance.now() - t0; return true; }
        R = startRow();
      }
      while (R.pend || R.i < R.trees.length) {
        var tt = performance.now();                                        // (timing only)
        if (!R.pend) {
          var tr = R.trees[R.i++];
          R.pend = fir(R.lc, tr[0], tr[1], tr[2], tr[3], R.look) || null;   // (a painter's job, finished a bough at a time)
        }
        if (R.pend) {
          if (!R.pend.step(Math.max(0.5, lim - (performance.now() - t0)))) { R.st.trees += performance.now() - tt; ST.work += performance.now() - t0; return false; }
          R.pend = null;
        }
        R.st.trees += performance.now() - tt;
        if (performance.now() - t0 >= lim) { ST.work += performance.now() - t0; return false; }
      }
      endRow();
      if (performance.now() - t0 >= lim) { ST.work += performance.now() - t0; return false; }
    }
  }
  return { step: step, stats: ST, cancel: function () { done = true; } };
}
function hill(c, o) { hillJob(c, o).step(); }

return { camera: camera, pagoda: pagoda, fir: fir, hill: hill, hillJob: hillJob };
})();
