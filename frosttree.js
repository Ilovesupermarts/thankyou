/* ============================================================
   FROSTTREE — the frosted trees (樹氷 / 霧氷) of the new winter scene
   (newwinter.html), after the user's reference picture: bare deciduous
   trees standing right of the shrine hall, every twig thick with white
   rime. Written new for the revamp (winter2.html's frosted tree in
   conifers.js is left as it is: the app and winter2.html still use it).
   Everything is drawn in code.

   What is physical about it:
   - The tree is built in 3D, in metres (x right, y up, z toward you,
     its foot at 0), and seen through the scene's own camera (eye on the
     horizon line, the mountains' lens), as the right bank's pines: its
     size on the screen follows from where its foot stands.
   - Its shape is a vase, as a keyaki (zelkova) grown in the open: one to
     three trunks from one foot, each dividing low into steep scaffold
     limbs that fan out and up, dividing again and again (each child
     thinner by the pipe rule) down to fine twigs, with fans of twiglets
     at the tips. Every tree is its own from its seed.
   - Hoarfrost grows INTO the wind: the rime is thickest on the windward
     side of every twig (the wind from the left), feathery at its edge;
     the finest twigs are all rime, so the dense outer crown reads as a
     pale lace. Snow lies only on the tops of near-level limbs. The thick
     trunks are plastered with snow on their windward side.
   - It is lit by the scene's sun and sky: the side of each twig turned to
     the sun warm white, the side away from it the sky's blue, the twigs
     deep inside the crown (on its far side from the sun) in the crown's
     own shade. It fades into the mist with distance.
   - The trunks and main limbs are round, drawn by trunks.js (the autumn
     maples' bark, on the graphics chip) in a grey-brown bark; the twigs
     too thin for it are painted. Twigs behind the trunks are drawn
     before them, those in front after them.
   - Where each trunk goes into the snow: the snow's own uneven line, as
     the pines' (yukitsuri.js's snowJoin / paintJoin: one painter).
   - Its shadow on the snow is cast along the sun's direction (the page
     draws it with yukitsuri.js's shadow, on the land only).

   Use:
     var T = FrostTree.build(spec)        the tree, once per seed
     var job = FrostTree.bakeJob(T, o)    draws it a little at a time: job.step(ms) → true when done;
                                          job.result: { body (canvas, device px), box { bx, by, w, h } (CSS px),
                                          wood: 'trunks.js' | 'painted', segs (count) }
     FrostTree.shadowTree(T)              { segs, fol: [], poles: [], props: [] } for Yukitsuri.shadow
   spec: { seed, height (m), trunks (1 … 3: how many), spread (× the crown's width), twigs (0 … 1: how finely it divides) }
   o:    { cam { F, cx, hy } (CSS px), eye (m), footX, footY (CSS px), PR, W, H,
           light { sun [x, y up, z toward you], sunCol, skyCol (0 … 1.5), amb, vis },
           shade (rgb: snow in the sky's shade), snow, rime (rgb), bark { bark, dark, light, lichen, moss } (rgb),
           rimeK (0 … 2: how thick the rime), snowK (0 … 2: snow on the limbs), feather (0 … 2: the rime's feathery edge),
           haze (0 … 1), hazeCol (rgb), soft (device px), trunks (true: use trunks.js) }
   ============================================================ */
var FrostTree = (function () {
'use strict';

var PI = Math.PI, TAU = PI * 2;
function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
function smooth(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
function mix(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }
function scl(a, k) { return [a[0] * k, a[1] * k, a[2] * k]; }
function norm(v) { var l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
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
function css(c, a) {
  return 'rgba(' + Math.round(clamp(c[0], 0, 255)) + ',' + Math.round(clamp(c[1], 0, 255)) + ',' + Math.round(clamp(c[2], 0, 255)) + ',' +
         (a === undefined ? 1 : clamp(a, 0, 1).toFixed(3)) + ')';
}
/* a direction turned from d by angle a (radians) toward the side given by azimuth az about d */
function turn(d, a, az) {
  var ref = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0], e1 = norm(cross(d, ref)), e2 = cross(d, e1);
  var s = Math.sin(a), c = Math.cos(a);
  return norm([d[0] * c + (e1[0] * Math.cos(az) + e2[0] * Math.sin(az)) * s,
               d[1] * c + (e1[1] * Math.cos(az) + e2[1] * Math.sin(az)) * s,
               d[2] * c + (e1[2] * Math.cos(az) + e2[2] * Math.sin(az)) * s]);
}

/* =====================================================================
   1. THE TREE — in metres. segs: every piece of wood, from the trunks to
   the twiglets: { a, b (ends), ra, rb (radii, m), p (parent piece, -1 for
   a trunk's first), dep (0 trunk … ), tip (true: no piece grows from it) }
   ===================================================================== */
function build(spec) {
  var seed = spec.seed | 0, r = rng(seed * 9973 + 41), Hm = Math.max(1, spec.height || 10);
  var spread = spec.spread === undefined ? 1 : spec.spread, fine = clamp(spec.twigs === undefined ? 0.6 : spec.twigs, 0, 1);
  var maxD = Math.round(lerp(4, 6, fine)), segs = [], trunks = [];
  var nT = clamp(Math.round(spec.trunks || 1), 1, 3), UP = [0, 1, 0];
  // the pieces of one limb: a gently bending run of steps from p along d, tapering r0 → r1; returns the last piece
  function run(p, d, len, r0, r1, parent, dep, steps, tropism, wig) {
    var at = p, dir = d, last = parent, out = [];
    for (var s = 0; s < steps; s++) {
      // bends a little at each step, and turns toward the light (up and out of the crown)
      dir = norm(add(add(dir, scl([r() - 0.5, r() - 0.5, r() - 0.5], wig)), scl(norm([dir[0], 0.0001, dir[2]]), tropism * 0.25)));
      dir = norm(add(dir, scl(UP, tropism)));
      var b = add(at, scl(dir, len / steps));
      var ra = lerp(r0, r1, s / steps), rb = lerp(r0, r1, (s + 1) / steps);
      segs.push({ a: at, b: b, ra: ra, rb: rb, p: last, dep: dep, tip: false, dir: dir });
      last = segs.length - 1; out.push(last);
      at = b;
    }
    return { end: at, dir: dir, last: last, pieces: out };
  }
  // a limb and everything that grows from it
  function limb(p, d, len, rad, parent, dep) {
    var steps = dep <= 1 ? 4 : dep <= 3 ? 3 : 2;
    var rEnd = rad * lerp(0.55, 0.7, r());
    var L = run(p, d, len, rad, rEnd, parent, dep, steps, dep <= 1 ? 0.03 : 0.07, dep <= 1 ? 0.1 : 0.2);
    if (dep >= maxD || len < 0.18) {
      segs[L.last].tip = true;
      twiglets(L.end, L.dir, len, rEnd, L.last, dep + 1);
      return;
    }
    // laterals along the limb (fewer high in the tree), then the fork at its end
    for (var k = 0; k < L.pieces.length - 1; k++) {
      if (r() > (dep <= 1 ? 0.3 : 0.22)) continue;
      var pi = L.pieces[k], S = segs[pi], f = lerp(0.3, 0.9, r());
      var at = [lerp(S.a[0], S.b[0], f), lerp(S.a[1], S.b[1], f), lerp(S.a[2], S.b[2], f)];
      var ang = lerp(0.45, 0.85, r()), dd = turn(S.dir, ang, r() * TAU);
      // (laterals reach up and out, as a tree grown in the open: never down into the crown)
      dd = norm(add(dd, [0, 0.35, 0]));
      if (dd[1] < 0.05) dd = norm([dd[0], 0.05, dd[2]]);
      var rr = lerp(S.ra, S.rb, f) * lerp(0.42, 0.6, r());
      limb(at, dd, len * lerp(0.42, 0.62, r()), rr, pi, dep + 1);
    }
    var n = r() < 0.35 ? 3 : 2, az0 = r() * TAU;
    for (var i = 0; i < n; i++) {
      var a2 = lerp(0.3, 0.62, r()) * spread, dd2 = turn(L.dir, a2, az0 + i * TAU / n + (r() - 0.5) * 0.8);
      // (the pipe rule: the children's areas add up to about the parent's)
      limb(L.end, dd2, len * lerp(0.62, 0.8, r()), rEnd * Math.pow(n, -0.5) * lerp(0.9, 1.1, r()), L.last, dep + 1);
    }
  }
  // the fans of fine twiglets at a tip (where the rime is densest)
  function twiglets(p, d, len, rad, parent, dep) {
    // a few at the very tip, the rest along the last piece: each its own length and turn, bending up a little
    var n = 1 + Math.floor(r() * (1 + fine * 3)), S = segs[parent];
    for (var i = 0; i < n; i++) {
      var f = i === 0 ? 1 : lerp(0.25, 1, r()), at = i === 0 ? p : [lerp(S.a[0], S.b[0], f), lerp(S.a[1], S.b[1], f), lerp(S.a[2], S.b[2], f)];
      var dd = norm(add(turn(d, i === 0 ? lerp(0, 0.25, r()) : lerp(0.35, 0.95, r()), r() * TAU), [0, 0.25, 0]));
      var l2 = Math.min(len * 1.1, lerp(0.08, 0.5, Math.pow(r(), 1.6)) * Hm / 10), mid = add(at, scl(dd, l2 * 0.5));
      var d2 = norm(add(dd, [(r() - 0.5) * 0.5, 0.2, (r() - 0.5) * 0.5])), b = add(mid, scl(d2, l2 * 0.5));
      var rr0 = Math.max(0.002, rad * (i === 0 ? 0.8 : 0.5));
      segs.push({ a: at, b: mid, ra: rr0, rb: rr0 * 0.6, p: parent, dep: dep, tip: false, dir: dd });
      segs.push({ a: mid, b: b, ra: rr0 * 0.6, rb: 0.0018, p: segs.length - 1, dep: dep, tip: true, dir: d2 });
    }
  }
  // the trunks: the first upright (a slight lean), the others leaning out from the same foot, shorter
  var az = r() * TAU;
  for (var t = 0; t < nT; t++) {
    var lean = t === 0 ? lerp(0.02, 0.07, r()) : lerp(0.07, 0.17, r()), taz = t === 0 ? r() * TAU : az + t * TAU / nT + (r() - 0.5) * 0.9;
    var tk = t === 0 ? 1 : lerp(0.68, 0.86, r()), Ht = Hm * tk;
    // (the others a little apart, as the reference's: about one metre)
    var fd = Hm * lerp(0.06, 0.13, r()), foot = t === 0 ? [0, 0, 0] : [Math.cos(taz) * fd, 0, Math.sin(taz) * fd];
    var d0 = norm([Math.cos(taz) * Math.sin(lean), Math.cos(lean), Math.sin(taz) * Math.sin(lean)]);
    var rT = Hm * (t === 0 ? 0.026 : 0.017) * lerp(0.9, 1.1, r()), fh = Ht * lerp(0.4, 0.52, r());
    var T0 = run(foot, d0, fh, rT, rT * 0.78, -1, 0, 4, 0.0, 0.05);
    trunks.push({ first: T0.pieces[0], foot: foot, r: rT });
    // the scaffold limbs: steep, fanned round the trunk (the vase)
    var nS = 3 + Math.floor(r() * 3), saz = r() * TAU, rS = rT * 0.78 * Math.pow(nS, -0.5) * 1.15;
    for (var s = 0; s < nS; s++) {
      var a3 = lerp(0.32, 0.58, r()) * spread, dS = turn(T0.dir, a3, saz + s * TAU / nS + (r() - 0.5) * 0.7);
      limb(T0.end, dS, (Ht - fh) * lerp(0.42, 0.58, r()), rS * lerp(0.85, 1.15, r()), T0.last, 1);
    }
  }
  // the tree as tall as asked: everything scaled about its foot (the growth above only sets its shape)
  var top0 = 0;
  segs.forEach(function (S) { top0 = Math.max(top0, S.b[1]); });
  var kH = Hm / Math.max(0.1, top0);
  segs.forEach(function (S) { S.a = scl(S.a, kH); S.b = scl(S.b, kH); S.ra *= kH; S.rb *= kH; });
  trunks.forEach(function (Tr) { Tr.foot = scl(Tr.foot, kH); Tr.r *= kH; });
  // the crown's middle and size (for the light inside it)
  var cx = 0, cy = 0, cz = 0, n = 0, top = 0, rad = 0;
  segs.forEach(function (S) { if (S.tip) { cx += S.b[0]; cy += S.b[1]; cz += S.b[2]; n++; } top = Math.max(top, S.b[1]); });
  cx /= n || 1; cy /= n || 1; cz /= n || 1;
  segs.forEach(function (S) { if (S.tip) rad = Math.max(rad, Math.hypot(S.b[0] - cx, (S.b[1] - cy) * 0.8, S.b[2] - cz)); });
  return { seed: seed, segs: segs, trunks: trunks, height: Hm, top: top, crown: { c: [cx, cy, cz], R: rad || Hm * 0.4 } };
}

/* the scene's camera for a tree whose foot stands at (footX, footY) (as yukitsuri.js's) */
function project(o) {
  var F = o.cam.F, cx = o.cam.cx, hy = o.cam.hy, eye = o.eye, D = eye * F / Math.max(1, o.footY - hy), X0 = (o.footX - cx) * D / F;
  function P(p) { var z = Math.max(1, D - p[2]); return [cx + F * (X0 + p[0]) / z, hy - F * (p[1] - eye) / z]; }
  P.s = function (z) { return F / Math.max(1, D - z); };
  P.D = D; P.eye = eye; P.X0 = X0; P.F = F; P.cx = cx; P.hy = hy;
  return P;
}

/* light on a surface facing n (x right, y up, z toward you): the sun on the side turned to it, the sky from above */
function shadeC(base, n, L, k) {
  n = norm(n);
  var d = Math.max(0, dot(n, norm(L.sun))) * (k === undefined ? 1 : k), s = (0.55 + 0.45 * n[1]) * L.amb;
  return [base[0] * (L.sunCol[0] * d + L.skyCol[0] * s), base[1] * (L.sunCol[1] * d + L.skyCol[1] * s), base[2] * (L.sunCol[2] * d + L.skyCol[2] * s)];
}

/* =====================================================================
   2. STROKES — gathered by colour and width, drawn a batch at a time
   (thousands of twigs: one path per batch, not one per twig)
   ===================================================================== */
function Batch(c) {
  var B = {};
  return {
    add: function (col, a, lw, x0, y0, x1, y1) {
      if (a <= 0.004) return;
      var q = [Math.round(col[0] / 5) * 5, Math.round(col[1] / 5) * 5, Math.round(col[2] / 5) * 5];
      var w = lw < 1 ? Math.round(lw * 8) / 8 : Math.round(lw * 4) / 4, k = q.join(',') + '|' + Math.round(a * 40) + '|' + w;
      var e = B[k] || (B[k] = { col: q, a: Math.round(a * 40) / 40, w: Math.max(0.125, w), pts: [] });
      e.pts.push(x0, y0, x1, y1);
    },
    flush: function () {
      c.lineCap = 'round';
      Object.keys(B).sort(function (a, b) { return B[b].w - B[a].w; }).forEach(function (k) {
        var e = B[k], p = e.pts;
        c.strokeStyle = css(e.col, e.a); c.lineWidth = e.w;
        c.beginPath();
        for (var i = 0; i < p.length; i += 4) { c.moveTo(p[i], p[i + 1]); c.lineTo(p[i + 2], p[i + 3]); }
        c.stroke();
      });
      B = {};
    }
  };
}

/* =====================================================================
   3. PAINTING
   ===================================================================== */
var WIND = norm([-1, 0.12, -0.25]);               // where the wind came from (the rime grows toward it): the left, a little behind
function palette(o) {
  var L = o.light, hz = o.haze || 0, hc = o.hazeCol || [230, 225, 225];
  function fin(c) { return mix(c, hc, hz); }
  var sn = o.snow || [246, 246, 250], rm = o.rime || [242, 245, 251], sh = o.shade || [190, 196, 220];
  var K = { fin: fin, lx: L.sun[0] < 0 ? -1 : 1, rime: rm, shade: sh, L: L };
  // (for the snow's line at the foot: yukitsuri.js's paintJoin reads these)
  K.snowTop = fin(mix(shadeC(sn, [K.lx * 0.35, 1, 0.25], L, 1), sh, 0.15));
  K.snowLit = fin(shadeC(sn, [K.lx * 0.8, 0.6, 0.1], L, 1.05));
  K.snowUnder = fin(mix(sh, [120, 128, 172], 0.3));
  var bk = o.bark || {};
  K.bark = fin(shadeC(bk.bark || [94, 86, 84], [K.lx * 0.3, 0.3, 0.9], L, 1));
  K.barkDk = fin(scl(bk.dark || [40, 34, 34], 0.9));
  K.barkRaw = bk.bark || [94, 86, 84];
  return K;
}
/* The colour of the rime on a piece of wood at p, seen on its surface facing n; inside: 0 … 1, how deep in the crown on
   the side away from the sun (the crown's own shade). The shade is the sky's blue (as snow in shade). */
function rimeCol(K, n, inside, k) {
  var L = K.L, lit = shadeC(K.rime, n, L, (k === undefined ? 1 : k) * (1 - inside * 0.85));
  // (the sky's light on white, as blue as the scene's snow in shade, where the sun does not reach)
  // (the snow all round throws the light back up: a twig's sides and underside are nearly as bright as its top)
  var sky = mix(K.shade, K.rime, 0.2), nn = norm(n), skyK = clamp(0.88 + 0.12 * nn[1], 0, 1) * (1 - inside * 0.22);
  var sunPart = Math.max(0, dot(nn, norm(L.sun))) * (1 - inside * 0.85) * (k === undefined ? 1 : k);
  var c = [Math.max(lit[0], sky[0] * skyK), Math.max(lit[1], sky[1] * skyK), Math.max(lit[2], sky[2] * skyK)];
  // rime is ice crystals: thin, it lets the sun through and scatters it on toward you, so with the sun behind the tree the
  // twigs glow warm (least deep inside the crown, where the twigs in front of the sun shade them)
  var back = Math.max(0, -norm(L.sun)[2]) * Math.max(0, norm(L.sun)[1] < 0.9 ? 1 : 0) * (1 - inside * 0.8) * (k === undefined ? 1 : k);
  c = [c[0] + K.rime[0] * L.sunCol[0] * 0.42 * back, c[1] + K.rime[1] * L.sunCol[1] * 0.42 * back, c[2] + K.rime[2] * L.sunCol[2] * 0.42 * back];
  // (a soft shoulder: lit rime is bright, never blown out)
  c = c.map(function (v) { return v < 228 ? v : 228 + (1 - Math.exp(-(v - 228) / 24)) * 24; });
  return K.fin(mix(c, sky, sunPart > 0 ? 0 : 0.15));
}
function bounds(T, P) {
  var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  T.segs.forEach(function (S) {
    [S.a, S.b].forEach(function (p) { var q = P(p); x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); });
  });
  var m = 6 + (P.s(0) * 0.25);
  return { bx: Math.floor(x0 - m), by: Math.floor(y0 - m), w: Math.ceil(x1 - x0 + m * 2), h: Math.ceil(y1 - y0 + m * 2 + P.s(0) * 0.5) };
}
function bakeJob(T, o) {
  var P = project(o), K = palette(o), box = bounds(T, P), PR = o.PR, L = o.light, Ls = norm(L.sun);
  var rimeK = o.rimeK === undefined ? 1 : o.rimeK, snowK = o.snowK === undefined ? 1 : o.snowK, feather = o.feather === undefined ? 1 : o.feather;
  function layer() { var cv = document.createElement('canvas'); cv.width = Math.max(1, Math.ceil(box.w * PR)); cv.height = Math.max(1, Math.ceil(box.h * PR)); var c = cv.getContext('2d'); c.setTransform(PR, 0, 0, PR, -box.bx * PR, -box.by * PR); return { cnv: cv, c: c }; }
  var work = layer(), body = layer(), c = work.c, R = { box: box, P: P, K: K, wood: '', segs: T.segs.length, D: P.D };
  var cr = T.crown, wood = {}, woodMinPx = 1.2;
  // which pieces trunks.js draws: those at least woodMinPx wide on the screen (from the trunks up: a piece is drawn only if
  // its parent is)
  T.segs.forEach(function (S, i) {
    var w = (S.ra + S.rb) * P.s((S.a[2] + S.b[2]) / 2);
    if (w >= woodMinPx && (S.p < 0 || wood[S.p])) wood[i] = true;
  });
  // the pieces painted: back to front, in depth bands; those behind the trunks before the wood, those in front after it
  var order = T.segs.map(function (S, i) { return i; }).sort(function (a, b) { return (T.segs[a].a[2] + T.segs[a].b[2]) - (T.segs[b].a[2] + T.segs[b].b[2]); });
  var zSplit = 0.05 * T.height;
  var back = order.filter(function (i) { return (T.segs[i].a[2] + T.segs[i].b[2]) / 2 < -zSplit; });
  var front = order.filter(function (i) { return (T.segs[i].a[2] + T.segs[i].b[2]) / 2 >= -zSplit; });
  function chunks(list, n) { var out = []; for (var i = 0; i < list.length; i += n) out.push(list.slice(i, i + n)); return out; }
  var rr = rng(T.seed * 31 + 5);
  // one piece: its rime (and, where the wood is painted, the wood under it)
  function paintPiece(Bt, i, painted) {
    var S = T.segs[i], A = P(S.a), B = P(S.b), z = (S.a[2] + S.b[2]) / 2, s = P.s(z);
    var dx = B[0] - A[0], dy = B[1] - A[1], l = Math.hypot(dx, dy);
    if (l < 0.05) return;
    var nx = -dy / l, ny = dx / l;                                   // the screen's normal to the piece
    var w = (S.ra + S.rb) * s;                                       // the wood's width (px)
    var u = S.dir, mid = [(S.a[0] + S.b[0]) / 2, (S.a[1] + S.b[1]) / 2, (S.a[2] + S.b[2]) / 2];
    // how deep in the crown, on its side away from the sun (0 … 1)
    var dc = [mid[0] - cr.c[0], (mid[1] - cr.c[1]), mid[2] - cr.c[2]], inside = clamp(-dot(dc, Ls) / cr.R * 0.9 + 0.15, 0, 1) * smooth(cr.R * 1.05, cr.R * 0.3, Math.hypot(dc[0], dc[1], dc[2]));
    // the surface normals that show: toward you (made square to the piece), and its two edges across the screen
    function perp(v) { var k = dot(v, u); return norm([v[0] - u[0] * k, v[1] - u[1] * k, v[2] - u[2] * k]); }
    var nC = perp([0, 0, 1]), nE = perp([nx, -ny, 0]);
    // rime: how thick (m), more on the side facing the wind
    var ww = dot(perp(WIND), nE);                                    // the edge nE faces the wind (+1) or away (-1)
    var thick = rimeK * (0.012 + 0.08 * Math.min(S.ra, 0.06)) * (S.tip ? 1.25 : 1), tpx = thick * s;
    var wc = w + tpx * 2;                                            // the rimed twig's width
    var off = ww * tpx * 0.55;                                       // the rime lies over to the windward side
    var cx0 = A[0] + nx * off, cy0 = A[1] + ny * off, cx1 = B[0] + nx * off, cy1 = B[1] + ny * off;
    var hazeA = 1;
    if (painted && w > 0.25) {
      // the wood (where trunks.js does not draw it): dark, a hint of light on the sun's side
      Bt.add(shadeC(K.barkRaw, nC, L, 1 - inside), Math.min(1, w / 0.6) * hazeA, Math.max(0.3, w), A[0], A[1], B[0], B[1]);
    }
    var cMid = rimeCol(K, nC, inside), cEa = rimeCol(K, nE, inside), cEb = rimeCol(K, [-nE[0], -nE[1], -nE[2]], inside);
    var big = !!wood[i];                                             // (wood drawn in 3D: the bark shows on its lee side)
    if (big) {
      // a thick limb: the rime only on its windward side, a band along that edge (the bark shows on the lee side)
      var sgn = ww >= 0 ? 1 : -1, bw = Math.min(w * 0.42, tpx * 1.6 + w * 0.12) * (0.7 + 0.6 * rr());
      var ex = nx * sgn * (w / 2 - bw / 2 + tpx * 0.3), ey = ny * sgn * (w / 2 - bw / 2 + tpx * 0.3);
      Bt.add(sgn > 0 ? cEa : cEb, 0.9, Math.max(0.4, bw), A[0] + ex, A[1] + ey, B[0] + ex, B[1] + ey);
      return;
    }
    var aw = Math.min(1, wc / 0.45);
    // the feathery edge: hoarfrost crystals grown into the wind, too fine to see one by one: a faint wider halo
    if (feather > 0 && S.dep >= 2) Bt.add(mix(cMid, cEa, 0.3), 0.075 * feather * aw, Math.max(0.5, wc + tpx * 2.4 * feather + 0.6), cx0 + nx * ww * tpx * 0.5, cy0 + ny * ww * tpx * 0.5, cx1 + nx * ww * tpx * 0.5, cy1 + ny * ww * tpx * 0.5);
    // the rimed twig: its face toward you, then its two edges (the sun's side warm, the other the sky's blue)
    Bt.add(cMid, 0.92 * aw, Math.max(0.35, wc), cx0, cy0, cx1, cy1);
    if (wc > 1.1) {
      var e = wc * 0.28;
      Bt.add(cEa, 0.7, wc * 0.42, cx0 + nx * e, cy0 + ny * e, cx1 + nx * e, cy1 + ny * e);
      Bt.add(mix(cEb, cMid, 0.4), 0.6, wc * 0.38, cx0 - nx * e, cy0 - ny * e, cx1 - nx * e, cy1 - ny * e);
    }
  }
  // snow on the top of near-level limbs (thicker ones only: a twig carries rime, not a ridge of snow)
  function paintLimbSnow(Bt, i) {
    var S = T.segs[i];
    if (S.ra < 0.018 || snowK <= 0) return;
    var lvl = 1 - Math.abs(S.dir[1]);
    var h = rng(i * 7 + T.seed)();
    if (lvl < 0.35 || h < 0.22) return;                               // (none on steep wood; gaps where it has fallen)
    var A = P(S.a), B = P(S.b), z = (S.a[2] + S.b[2]) / 2, s = P.s(z), w = (S.ra + S.rb) * s;
    var dpx = snowK * Math.min(0.09, S.ra * 1.3) * lvl * lvl * s * lerp(0.6, 1.2, h);
    if (dpx < 0.35) return;
    var dx = B[0] - A[0], dy = B[1] - A[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
    if (ny > 0) { nx = -nx; ny = -ny; }                               // (the normal pointing up the screen: the limb's top)
    var o1 = w / 2 + dpx * 0.4, wl = Math.min(w * 0.9, dpx * 1.1 + 0.4);
    var top = rimeCol(K, [0, 1, 0.2], 0), under = K.fin(mix(K.shade, [150, 160, 196], 0.25));
    Bt.add(under, 0.55, wl * 0.6, A[0] + nx * (o1 - wl * 0.3), A[1] + ny * (o1 - wl * 0.3), B[0] + nx * (o1 - wl * 0.3), B[1] + ny * (o1 - wl * 0.3));
    Bt.add(top, 0.95, wl, A[0] + nx * o1, A[1] + ny * o1, B[0] + nx * o1, B[1] + ny * o1);
  }
  // the snow plastered on the windward side of each trunk (ragged: in short pieces, each its own width)
  function paintTrunkSnow(Bt) {
    if (rimeK <= 0) return;
    T.segs.forEach(function (S, i) {
      if (S.dep !== 0 || !wood[i]) return;
      var A = P(S.a), B = P(S.b), s = P.s((S.a[2] + S.b[2]) / 2), w = (S.ra + S.rb) * s;
      var dx = B[0] - A[0], dy = B[1] - A[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
      var nE = [nx, -ny, 0], sgn = dot(nE, WIND) >= 0 ? 1 : -1, nW = [nx * sgn, -ny * sgn, 0.35];
      var col = rimeCol(K, nW, 0.1), colSh = rimeCol(K, [nx * sgn, -ny * sgn, -0.3], 0.3);
      var n = Math.max(2, Math.round(l / 1.5));
      for (var k = 0; k < n; k++) {
        var t0 = k / n, t1 = (k + 1) / n, bw = w * rimeK * lerp(0.06, 0.2, rr());
        if (rr() < 0.4) continue;
        var ex = nx * sgn * (w / 2 - bw / 2), ey = ny * sgn * (w / 2 - bw / 2);
        var x0 = lerp(A[0], B[0], t0) + ex, y0 = lerp(A[1], B[1], t0) + ey, x1 = lerp(A[0], B[0], t1) + ex, y1 = lerp(A[1], B[1], t1) + ey;
        Bt.add(colSh, 0.6, bw * 1.25, x0 - nx * sgn * bw * 0.2, y0 - ny * sgn * bw * 0.2, x1 - nx * sgn * bw * 0.2, y1 - ny * sgn * bw * 0.2);
        Bt.add(col, 0.92, bw, x0, y0, x1, y1);
      }
    });
  }
  // the wood: trunks.js (round limbs, bark) for the thick pieces, or painted if it is not available
  var joins = [];
  function paintWood() {
    var nodes = [], map = {}, Y = window.Yukitsuri, done = false;
    T.segs.forEach(function (S, i) {
      if (!wood[i]) return;
      var A = P(S.a), B = P(S.b), s = P.s((S.a[2] + S.b[2]) / 2);
      map[i] = nodes.length;
      nodes.push({ p: S.p >= 0 ? map[S.p] : -1, w: Math.max(0.6, (S.ra + S.rb) * s), len: Math.hypot(B[0] - A[0], B[1] - A[1]) || 0.5,
                   abs: Math.atan2(B[1] - A[1], B[0] - A[0]), sx: A[0], sy: A[1], ex: B[0], ey: B[1] });
    });
    // where each trunk goes into the snow (the snow's own uneven line, banked a little either side)
    T.trunks.forEach(function (Tr, k) {
      var s = P.s(Tr.foot[2]), half = Tr.r * s, fx = P(Tr.foot)[0], q = rng(T.seed * 5 + k);
      var roots = [[fx - half * lerp(1.5, 1.9, q()), half * 0.6, half * lerp(0.4, 0.6, q())], [fx + half * lerp(1.5, 1.9, q()), half * 0.6, half * lerp(0.4, 0.6, q())]];
      if (Y && Y.snowJoin) joins.push(Y.snowJoin(Tr.foot, Math.max(0.6, half), roots, P, T.seed * 7 + 3 + k));
    });
    // the wood is drawn on a layer of its own, cut off below the snow's line at each trunk's foot (each its own line:
    // the trunks stand apart, at their own depths), then laid on the tree
    var wl = layer(), wc = wl.c;
    function cutAndLay() {
      wc.save();
      wc.globalCompositeOperation = 'destination-out'; wc.fillStyle = '#000';
      joins.forEach(function (J) {
        var x0 = J.x - J.half * 3.5, x1 = J.x + J.half * 3.5, bot = box.by + box.h + 10;
        wc.beginPath(); wc.moveTo(x0, bot);
        for (var x = x0; x <= x1; x += 0.5) wc.lineTo(x, J.y - J.h(x));
        wc.lineTo(x1, bot); wc.closePath(); wc.fill();
      });
      wc.restore();
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(wl.cnv, 0, 0); c.restore();
      wl.cnv.width = 1;
    }
    if (o.trunks !== false && typeof Trunks !== 'undefined' && Trunks.state() !== 'none' && nodes.length) {
      try {
        var model = Trunks.build({ nodes: nodes, seed: T.seed % 100000 + 11, X: function (x) { return x; }, clumps: [],
                                   look: { girth: 1, bend: 0.35, depth: 0, rootFlare: 1.25, roots: 0, rootLen: 0.5 } });
        var lt = { dir: [L.sun[0], -L.sun[1], L.sun[2]], sun: L.sunCol, sky: scl(L.skyCol, L.amb),
                   bounce: scl([0.66, 0.7, 0.82], L.amb * 0.9), leaf: scl(L.skyCol, L.amb * 0.7), air: o.hazeCol || [230, 225, 225] };
        var bk = o.bark || {};
        var g = Trunks.draw({ model: model, nodes: nodes, X: function (x) { return x; }, extra: [], width: Math.round(o.W * PR), height: Math.round(o.H * PR),
                              W: o.W, H: o.H, px: PR, time: 0, wind: 0, ground: P([0, 0, 0])[1],
                              look: { girth: 1, relief: 0.6, fissures: 0.55, streaks: 0.5, lichen: 0.3, moss: 0, mossHeight: 0.05, wet: 0.05,
                                      rim: 0.45, canopyShade: 0, komorebi: 0, crotch: 0.7, air: o.haze || 0, twigCut: 0 },
                              colours: { bark: bk.bark || [94, 86, 84], dark: bk.dark || [40, 34, 34], light: bk.light || [168, 162, 158],
                                         lichen: bk.lichen || [168, 172, 160], moss: bk.moss || [78, 90, 48] }, light: lt });
        if (g) {
          // (a graphics-chip canvas on purpose, as yukitsuri.js: only this small copy is read)
          var tmp = document.createElement('canvas'); tmp.width = g.w; tmp.height = g.h;
          tmp.getContext('2d').drawImage(g.cnv, 0, 0, g.w, g.h, 0, 0, g.w, g.h);
          wc.save(); wc.setTransform(1, 0, 0, 1, 0, 0);
          wc.drawImage(tmp, g.x - box.bx * PR, g.y - box.by * PR);
          wc.restore(); cutAndLay(); done = true;
        }
      } catch (e) { done = false; }
    }
    if (done) return 'trunks.js';
    // painted: each piece a stroke, lit on the sun's side
    var Bt = Batch(wc);
    T.segs.forEach(function (S, i) {
      if (!wood[i]) return;
      var A = P(S.a), B = P(S.b), w = (S.ra + S.rb) * P.s(S.a[2]);
      Bt.add(K.barkDk, 1, w, A[0], A[1], B[0], B[1]);
    });
    Bt.flush();
    T.segs.forEach(function (S, i) {
      if (!wood[i]) return;
      var A = P(S.a), B = P(S.b), w = (S.ra + S.rb) * P.s(S.a[2]);
      Bt.add(K.bark, 0.8, w * 0.45, A[0] + K.lx * w * 0.2, A[1], B[0] + K.lx * w * 0.2, B[1]);
    });
    Bt.flush();
    cutAndLay();
    return 'painted';
  }
  var noWood = !(o.trunks !== false && typeof Trunks !== 'undefined' && Trunks.state() !== 'none');
  function painted(i) { return !wood[i] || noWood; }
  var tasks = [];
  chunks(back, 400).forEach(function (ch) { tasks.push(function () { var Bt = Batch(c); ch.forEach(function (i) { paintPiece(Bt, i, painted(i) && !wood[i]); }); Bt.flush(); }); });
  tasks.push(function () { R.wood = paintWood(); });
  tasks.push(function () {
    var Bt = Batch(c);
    paintTrunkSnow(Bt);
    // the rime on the thick limbs behind the twigs in front
    back.concat(front).forEach(function (i) { if (wood[i]) paintPiece(Bt, i, false); });
    T.segs.forEach(function (S, i) { if (wood[i]) paintLimbSnow(Bt, i); });
    Bt.flush();
    // the snow's line at each trunk's foot
    var Y = window.Yukitsuri;
    if (Y && Y.paintJoin) joins.forEach(function (J) { Y.paintJoin(c, J, J.half * 2.2, K); });
  });
  chunks(front.filter(function (i) { return !wood[i]; }), 400).forEach(function (ch) { tasks.push(function () { var Bt = Batch(c); ch.forEach(function (i) { paintPiece(Bt, i, true); }); Bt.flush(); }); });
  tasks.push(function () {
    // laid down a little soft, so no edge is ruler-sharp
    var bc = body.c; bc.save(); bc.setTransform(1, 0, 0, 1, 0, 0);
    var bl = o.soft || 0;
    if (bl > 0.05) bc.filter = 'blur(' + bl.toFixed(2) + 'px)';
    bc.drawImage(work.cnv, 0, 0); bc.restore();
    work.cnv.width = 1;
  });
  R.body = body.cnv;
  var ti = 0;
  return {
    result: R,
    step: function (ms) {
      var t0 = performance.now();
      while (ti < tasks.length) {
        tasks[ti++]();
        if (performance.now() - t0 > ms) break;
      }
      return ti >= tasks.length;
    }
  };
}

/* The tree as yukitsuri.js's shadow() reads it: the wood only (its thinnest twiglets left out: their shadows are finer
   than a pixel and only fill the shadow in). */
function shadowTree(T) {
  return { segs: T.segs.filter(function (S) { return S.ra > 0.004; }), fol: [], poles: [], props: [] };
}

return { build: build, project: project, bakeJob: bakeJob, shadowTree: shadowTree };
})();
