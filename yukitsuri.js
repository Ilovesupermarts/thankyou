/* ============================================================
   YUKITSURI — the roped pines (雪吊りの松) and snowy firs on the right
   bank of the new winter scene (newwinter.html, step 7). Written new for
   the revamp, after the user's sheet "「雪吊りの松」の変型" (five variants)
   and their scene picture. Everything is drawn in code.

   The five variants (the sheet's):
     1  高大の松   tall and slender: a straight trunk, drooping tiers of
                   boughs (fir-like), the pole rising out of the crown top
     2  老木・大振り  old and sprawling: an S-curved trunk, long near-level
                   limbs ending in flat pads of needles, bamboo props under
                   the longest limbs
     3  傾き・曲がり  leaning and bent: the trunk leans far out and turns
                   back up; two props under the lean
     4  円形・小振り  compact and dense: a short trunk, a dome of pads
     5  二股     twin trunk: two trunks from one foot, each with its own
                   pole and ropes, braced together

   What is physical about it:
   - Every tree is built in 3D, in metres (x right, y up, z toward you,
     its foot at 0), and seen through the scene's own camera: the eye on
     the horizon line, eye height and lens as the snow ground (step 6), so
     a tree standing farther back is smaller, and the pads and boughs are
     seen nearly edge-on from a little below (those above the eye show a
     sliver of their underside, those below it a sliver of their top).
   - Snow lies only where something faces up: on the tops of the pads and
     boughs (less where a bough slopes steeply: snow slides off), on the
     upper side of near-level limbs (less under the pads that shelter
     them), on the pole's cap; it is lit by the sun on its top and lies in
     the sky's blue light on its front (the sun is behind the trees).
   - The pole stands upright from the ground; the straw ropes are taut
     straight lines from its top to the tips of the branches they hold up,
     on a cone round the tree: those on its far side pass behind the
     foliage, those on the near side in front of it. Props stand on the
     ground under the limbs they hold.
   - The trunk and limbs are round, drawn by trunks.js (the autumn maples'
     bark, on the graphics chip) in the pines' own dark bark colours.
   - The shadow on the snow: the sky's shade under each crown, and the
     sun's shadow cast along the sun's direction (long, as the sun is low),
     on the land only.
   - Snow falls off the branches: a clump slides out over the edge of its
     pad, tips and falls under gravity, breaks up as it falls or where it
     strikes a pad below (it may knock that pad's snow off too), and lands
     in a puff of powder that drifts with the wind.

   Use:
     var T = Yukitsuri.build(spec)        the tree, once per seed and variant
     var job = Yukitsuri.bakeJob(T, o)   draws it a little at a time: job.step(ms) → true when done; job.result:
                                         { body, front: canvases (device px) at bx, by (CSS px), w, h; loose: the snow
                                         clumps that can fall; pads (for the falling snow) }
     Yukitsuri.shadow(c, T, o)           its shadow on the ground, into c (CSS px transform set)
     Yukitsuri.anim(R, o)                a state for the falling snow of a baked tree; then
     Yukitsuri.shed(A, i, delay)         clump i starts to slide off
     Yukitsuri.update(A, dt, wind)       moves the falling snow (wind: m/s across)
     Yukitsuri.drawRest(c, A)            the clumps still lying on the tree
     Yukitsuri.drawFalling(c, A)         the falling snow and its powder
   spec: { variant 1 … 5, seed, height (m: the pole's top, or the tree's top when not roped), roped, cover (0 … 1.5: how much
           of the branches the snow covers), crown (variant 1:
           where the crown begins, share of the height), width, snow (0 … 2), ropes (× the number of ropes), props }
   o:    { cam { F, cx, hy } (CSS px), eye (m), footX, footY (CSS px), PR, dof (device px: the depth of field's blur), light { sun [x, y up, z toward you], sunCol,
           skyCol (0 … 1.5), amb, vis }, shade (rgb: snow in the sky's shade), snow, needle, rope, bamboo (rgb), bark
           { bark, dark, light, lichen, moss } (rgb), haze (0 … 1), hazeCol (rgb), soft (device px), loose (0 … 1: share
           of the snow that can fall), trunks (true: use trunks.js) }
   ============================================================ */
var Yukitsuri = (function () {
'use strict';

// o.lod's firs (the hill's and the shrine's: small, far, thousands of strokes) are drawn on graphics-chip canvases by
// default, as before. With o.cpu they are drawn on canvases the main processor draws (willReadFrequently), at twice the
// size (SS), and shrunk: faster where the graphics chip is emulated in software (this sandbox: 50-85x), but on the
// tablet's real graphics chip that path was the SLOWER one (its Report: hill and pagoda 32 s). At that size the main
// processor draws the finest strokes harder than the chip, so twice the size keeps their true look (measured).
var CPU = { willReadFrequently: true }, SS = 2;

var PI = Math.PI, TAU = PI * 2;
function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
function mix(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }
function scl(a, k) { return [a[0] * k, a[1] * k, a[2] * k]; }
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
function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function lerp3(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }
function angDiff(a, b) { return Math.atan2(Math.sin(a - b), Math.cos(a - b)); }

/* light on a surface facing n (x right, y up, z toward you): the sun on the side turned to it, the sky from above */
function shade(base, n, L, k) {
  n = norm(n);
  var d = Math.max(0, dot(n, norm(L.sun))) * (k === undefined ? 1 : k), s = (0.55 + 0.45 * n[1]) * L.amb;
  return [base[0] * (L.sunCol[0] * d + L.skyCol[0] * s), base[1] * (L.sunCol[1] * d + L.skyCol[1] * s), base[2] * (L.sunCol[2] * d + L.skyCol[2] * s)];
}

/* A smooth line through points (Catmull-Rom), n pieces between each two. */
function curve(P, n) {
  var out = [], m = P.length;
  for (var i = 0; i < m - 1; i++) {
    var p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(m - 1, i + 2)];
    for (var k = 0; k < n; k++) {
      var t = k / n, t2 = t * t, t3 = t2 * t, q = [];
      for (var c = 0; c < 3; c++) {
        q.push(0.5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3));
      }
      out.push(q);
    }
  }
  out.push(P[m - 1].slice());
  return out;
}

/* =====================================================================
   1. THE TREE — in metres. segs: the wood (round limbs, drawn by
   trunks.js); fol: the foliage ('pad': a flat cushion of pine needles,
   'bough': a drooping tier branch of the tall pine); poles, props, ropes.
   ===================================================================== */
function build(spec) {
  var v = clamp(Math.round(spec.variant || 1), 1, 5), r = rng((spec.seed | 0) * 7919 + v * 131 + 29);
  var Ht = spec.height || 7, roped = spec.roped !== false, snowK = spec.snow === undefined ? 1 : spec.snow, cover = spec.cover === undefined ? 1 : spec.cover;
  var Th = roped ? Ht * 0.87 : Ht;
  var T = { variant: v, Ht: Ht, Th: Th, roped: roped, segs: [], fol: [], poles: [], props: [], ropes: [], seed: spec.seed | 0, snowK: snowK, cover: cover, limbs: [] };
  var sg = r() < 0.5 ? -1 : 1;                     // which way the tree leans or sprawls

  function addLimb(parent, pts, r0, r1) {           // a run of segments along pts, thinning from r0 to r1; returns their indices
    var ids = [], n = pts.length - 1;
    for (var i = 0; i < n; i++) {
      var id = T.segs.length;
      T.segs.push({ a: pts[i], b: pts[i + 1], ra: lerp(r0, r1, i / n), rb: lerp(r0, r1, (i + 1) / n), p: i === 0 ? parent : id - 1, snow: 0 });
      ids.push(id);
    }
    return ids;
  }
  function onLimb(ids, f) {                         // the point a share f along a limb, and the segment it is on
    var k = clamp(f, 0, 0.9999) * ids.length, i = Math.floor(k), S = T.segs[ids[i]];
    return { p: lerp3(S.a, S.b, k - i), seg: ids[i], r: lerp(S.ra, S.rb, k - i) };
  }
  function atHeight(ids, y) {                       // where a limb that rises crosses height y
    for (var i = 0; i < ids.length; i++) {
      var S = T.segs[ids[i]];
      if ((S.a[1] - y) * (S.b[1] - y) <= 0) { var t = (y - S.a[1]) / ((S.b[1] - S.a[1]) || 1e-6); return { p: lerp3(S.a, S.b, t), seg: ids[i], r: lerp(S.ra, S.rb, t) }; }
    }
    var L = T.segs[ids[ids.length - 1]];
    return { p: L.b.slice(), seg: ids[ids.length - 1], r: L.rb };
  }

  if (v === 1) buildTall(); else buildPine();

  /* ---------- variant 1: the tall, slender one ---------- */
  function buildTall() {
    var leanK = spec.lean === undefined ? 1 : spec.lean, lean = (r() - 0.5) * 0.05 * Th * leanK;
    var cb = clamp(spec.crown === undefined ? 0.38 : spec.crown, 0.02, 0.8), wr = lerp(0.27, 0.32, r()) * (spec.width || 1);
    var shapeP = lerp(0.85, 1.15, r()), droopK = lerp(0.8, 1.2, r());
    var tp = [[0, 0, 0], [lean * 0.15 + (r() - 0.5) * 0.04 * Th, 0.3 * Th, 0], [lean * 0.5, 0.6 * Th, 0], [lean * 0.82, 0.85 * Th, 0], [lean, Th, 0]];
    var trunk = addLimb(-1, curve(tp, 3), Th * 0.022, Th * 0.004);
    T.trunk = trunk;
    var y0 = cb * Th, gap = Th * 0.038, y = y0, idx = 0;
    while (y < Th * 0.955) {
      var f = (y - y0) / (Th - y0), Rw = (wr * Th * Math.pow(1 - f, shapeP) + 0.12) * lerp(0.85, 1.12, r());
      var nb = f > 0.8 ? 4 + Math.floor(r() * 2) : 6 + Math.floor(r() * 3), az0 = r() * TAU, at = atHeight(trunk, y);
      for (var k = 0; k < nb; k++) {
        var th = az0 + k * TAU / nb + (r() - 0.5) * 0.6, L = Rw * lerp(0.82, 1.12, r());
        if (r() < 0.04 && f < 0.85) continue;                                  // (now and then a gap where a bough is missing)
        var d = [Math.sin(th), 0, Math.cos(th)], dr = lerp(0.14, 0.32, r()) * droopK * (0.6 + 0.6 * (1 - f));
        var p0 = at.p, p2 = add(p0, [d[0] * L, -dr * L, d[2] * L]), p1 = add(p0, [d[0] * L * 0.55, -dr * L * 0.18, d[2] * L * 0.55]);   // (it leaves the trunk nearly level, arches out, droops toward its end)
        p2[1] += L * 0.05;                                                         // the tip turns up a little
        // the lowest boughs may not droop down over the trunk: below the crown the trunk stays clear (as on the
        // reference's firs, and as a garden pine is kept)
        var floorY = y0 * 0.7 + 0.25;
        if (p2[1] < floorY) { p2[1] = floorY; p1[1] = Math.max(p1[1], (p0[1] + floorY) / 2); }
        T.fol.push({ kind: 'bough', p0: p0, p1: p1, p2: p2, L: L, hang: L * lerp(0.26, 0.4, r()) * (0.75 + 0.35 * (1 - f)), floor: floorY,
                     c: p1, rx: L * 0.5, rz: L * 0.5, seed: (r() * 1e9) | 0, f: f, id: idx++,
                     snowD: snowK * lerp(0.17, 0.28, r()), reach: lerp(0.75, 0.97, r()) });
        if (L > 0.7 && f < 0.6) addLimb(at.seg, [p0, lerp3(p0, p1, 0.6)], Math.max(0.025, at.r * 0.35), 0.02);
      }
      y += gap * lerp(0.8, 1.25, r());
    }
    // dead stubs on the bare trunk below the crown
    var ns = cb > 0.15 ? 2 + Math.floor(r() * 3) : 0;
    for (var q = 0; q < ns; q++) {
      var yy = y0 * lerp(0.45, 0.95, r()), a2 = atHeight(trunk, yy), th2 = r() * TAU, l2 = lerp(0.25, 0.6, r());
      addLimb(a2.seg, [a2.p, add(a2.p, [Math.sin(th2) * l2, -l2 * 0.25, Math.cos(th2) * l2])], 0.03, 0.012);
    }
    T.crownTop = [lean, Th, 0];
    // the crown's inside: the inner branches and needles, deep in their own shade, so it is full (no sky through it)
    T.core = { y0: y0, y1: Th * 0.97, floor: y0 * 0.75 + 0.3, R: function (yy) { var f2 = clamp((yy - y0) / (Th - y0), 0, 1); return (wr * Th * Math.pow(1 - f2, shapeP) + 0.12) * 0.72; },
               at: function (yy) { return atHeight(trunk, yy).p; }, seed: (r() * 1e9) | 0 };
    if (roped) {
      // the pole: lashed to the trunk (just behind it), its top above the crown
      var pole = { a: [-0.04 * sg, 0, -0.12], b: [lean, Ht, -0.12], r: 0.045, cap: true };
      T.poles.push(pole);
      ropesTo(pole, T.fol.filter(function (E) { return E.f < 0.7; }), 'tip');
    }
  }

  /* ---------- variants 2 … 5: pines with pads of needles ---------- */
  function buildPine() {
    var trunks = [];
    var base = [];
    if (v === 2) base = [[[0, 0, 0], [sg * 0.05, 0.14, 0], [sg * 0.13, 0.3, 0.05], [sg * 0.02, 0.47, 0], [-sg * 0.08, 0.64, -0.04], [-sg * 0.02, 0.8, 0], [sg * 0.03, 0.92, 0]]];
    else if (v === 3) base = [[[0, 0, 0], [sg * 0.1, 0.16, 0], [sg * 0.28, 0.33, 0.04], [sg * 0.4, 0.5, 0], [sg * 0.38, 0.66, -0.03], [sg * 0.26, 0.8, 0], [sg * 0.2, 0.9, 0]]];
    else if (v === 4) base = [[[0, 0, 0], [sg * 0.04, 0.16, 0], [-sg * 0.03, 0.32, 0.02], [sg * 0.01, 0.5, 0], [0, 0.68, 0]]];
    else base = [[[0, 0, 0], [-0.03, 0.06, 0], [-0.1, 0.3, 0.02], [-0.13, 0.58, 0], [-0.1, 0.8, 0], [-0.11, 0.9, 0]],
                 [[0.03, 0.04, 0], [0.08, 0.12, -0.02], [0.16, 0.38, -0.04], [0.19, 0.66, -0.02], [0.18, 0.88, 0], [0.19, 0.98, 0]]];
    var girth = v === 4 ? 0.06 : v === 5 ? 0.038 : 0.05;
    base.forEach(function (B, bi) {
      var pts = curve(B.map(function (p) { return [p[0] * Th + (r() - 0.5) * 0.02 * Th, p[1] * Th, p[2] * Th]; }), 3);
      trunks.push(addLimb(bi ? T.trunk[0] : -1, pts, Th * girth * (bi ? 0.85 : 1), Th * 0.012));
      if (!bi) T.trunk = trunks[0];
    });
    var cbs = { 2: 0.22, 3: 0.26, 4: 0.2, 5: 0.28 }, groups = [];
    trunks.forEach(function (ids, ti) {
      var top = T.segs[ids[ids.length - 1]].b, cb = cbs[v] * Th, lev = v === 4 ? 10 : v === 5 ? 9 : 12, grp = [];
      groups.push(grp);
      for (var k = 0; k < lev; k++) {
        var y = lerp(cb, top[1] - Th * 0.06, (k + lerp(0.25, 0.75, r())) / lev), f = (y - cb) / (top[1] - cb), at = atHeight(ids, y);
        var Rm = envelope(f, ti) * (spec.width || 1), nb = v === 4 ? 3 + Math.floor(r() * 2) : 2 + (r() < 0.6 ? 1 : 0);
        var az0 = r() * TAU;
        if (v === 3 && f < 0.6) az0 = sg > 0 ? PI / 2 : -PI / 2;                // the low limbs reach out over the lean
        if (v === 5) az0 = (ti ? PI / 2 : -PI / 2) + (r() - 0.5) * 1.2;          // each trunk's limbs reach away from the other
        for (var b = 0; b < nb; b++) {
          var th = az0 + b * TAU / nb + (r() - 0.5) * 1.0;
          if (v === 5) th = az0 + (b ? PI * 0.7 : 0) * (r() < 0.5 ? 1 : -1) + (r() - 0.5) * 0.5;
          var Lb = Rm * lerp(0.75, 1.1, r());
          if (v === 2 && k === 0 && b === 0) { Lb *= 1.35; th = sg > 0 ? PI / 2 + 0.2 : -PI / 2 - 0.2; }   // the long sprawling limb
          branch(at, th, Lb, f, grp);
        }
      }
      // the crown's top pad, over the trunk's top
      var trp = Th * (v === 4 ? 0.16 : 0.12) * lerp(0.85, 1.1, r());
      pad(add(top, [0, trp * 0.28, 0]), trp, trp * lerp(0.75, 0.95, r()), trp * lerp(0.5, 0.62, r()), 1, grp);
    });
    T.crownTop = T.segs[T.trunk[T.trunk.length - 1]].b;
    // the props: under the longest, most nearly level limbs
    var nProps = spec.props === false ? 0 : v === 2 ? 2 : v === 3 ? 2 : v === 5 ? 1 : 0;
    var cand = T.limbs.slice().sort(function (a, b) { return b.L * b.level - a.L * a.level; });
    for (var pi = 0; pi < Math.min(nProps, cand.length); pi++) {
      var Lm = cand[pi], S = onLimb(Lm.ids, lerp(0.55, 0.72, r())), out = [Math.sin(Lm.th), 0, Math.cos(Lm.th)];
      var foot = [S.p[0] + out[0] * S.p[1] * 0.22, 0, S.p[2] + out[2] * S.p[1] * 0.22];
      if (v === 3 && pi === 1) foot = [S.p[0] - out[0] * S.p[1] * 0.18, 0, S.p[2] - out[2] * S.p[1] * 0.18 + 0.4];   // the second crosses the first
      T.props.push({ a: foot, b: [S.p[0], S.p[1] - S.r, S.p[2]], r: 0.045, prop: true });
    }
    if (v === 5 && trunks.length > 1) {                                           // the brace between the twin trunks
      var A = atHeight(trunks[0], Th * 0.42), B2 = atHeight(trunks[1], Th * 0.5), A2 = atHeight(trunks[0], Th * 0.52), B3 = atHeight(trunks[1], Th * 0.4);
      T.props.push({ a: A.p, b: B2.p, r: 0.03, brace: true }, { a: B3.p, b: A2.p, r: 0.03, brace: true });
    }
    if (roped) {
      groups.forEach(function (grp, gi) {
        var cx = 0, cz = 0, wsum = 0;
        grp.forEach(function (E) { var w = E.rx * E.rx; cx += E.c[0] * w; cz += E.c[2] * w; wsum += w; });
        cx /= wsum || 1; cz /= wsum || 1;
        var tb = T.segs[T.trunk[0]].a, foot = gi ? T.segs[trunks[gi][0]].a : tb;
        var hgt = gi ? Ht * 1.04 : Ht;
        var pole = { a: [foot[0] + (gi ? 0.12 : -0.1) * (v === 5 ? 1 : sg), 0, foot[2] - 0.18], b: [cx, hgt, cz - 0.1], r: 0.05, cap: true };
        T.poles.push(pole);
        ropesTo(pole, grp, 'pad');
      });
    }
    function envelope(f, ti) {
      if (v === 2) return Th * 0.5 * (f < 0.3 ? lerp(0.9, 1, f / 0.3) : lerp(1, 0.28, (f - 0.3) / 0.7));
      if (v === 3) return Th * 0.4 * (1 - 0.65 * f);
      if (v === 4) { var q = (f - 0.3) / 0.8; return Th * 0.5 * Math.sqrt(Math.max(0.06, 1 - q * q)); }
      return Th * 0.33 * (1 - 0.5 * f);
    }
  }
  function branch(at, th, Lb, f, grp) {
    var d = [Math.sin(th), 0, Math.cos(th)], side = [Math.cos(th), 0, -Math.sin(th)], P0 = at.p;
    var g1 = (r() - 0.5) * 0.12 * Lb, g2 = (r() - 0.5) * 0.12 * Lb, rise = lerp(-0.02, 0.1, r()) * Lb;
    var pts = [P0,
      add(P0, [d[0] * Lb * 0.3 + side[0] * g1, rise + Lb * 0.04, d[2] * Lb * 0.3 + side[2] * g1]),
      add(P0, [d[0] * Lb * 0.65 + side[0] * g2, rise - Lb * lerp(0.02, 0.1, r()), d[2] * Lb * 0.65 + side[2] * g2]),
      add(P0, [d[0] * Lb, rise + Lb * lerp(0.0, 0.08, r()), d[2] * Lb])];
    var ids = addLimb(at.seg, curve(pts, 2), Math.max(0.06, at.r * lerp(0.55, 0.7, r())), 0.035);
    var level = 1 - Math.abs(pts[3][1] - P0[1]) / Lb;
    T.limbs.push({ ids: ids, L: Lb, th: th, level: level });
    var tip = pts[3], pr = clamp(Lb * lerp(0.45, 0.62, r()), 0.4, 1.9) * (v === 4 ? 1.15 : 1);
    pad(add(tip, [0, pr * 0.16, 0]), pr, pr * lerp(0.65, 0.95, r()), pr * lerp(0.42, 0.58, r()), f, grp);
    // a smaller pad part way along, set off to one side
    for (var sp = 0; sp < (Lb > 1.4 ? 2 : Lb > 0.7 ? 1 : 0); sp++) {
      var S = onLimb(ids, lerp(0.35, 0.7, r())), off = (sp ? -1 : 1) * (r() < 0.5 ? -1 : 1) * lerp(0.2, 0.5, r());
      var q = add(S.p, [side[0] * off, lerp(0.1, 0.25, r()), side[2] * off]), pr2 = pr * lerp(0.5, 0.72, r());
      addLimb(S.seg, [S.p, q], Math.max(0.035, S.r * 0.65), 0.025);
      pad(add(q, [0, pr2 * 0.15, 0]), pr2, pr2 * lerp(0.7, 0.95, r()), pr2 * lerp(0.45, 0.6, r()), f, grp);
    }
  }
  function pad(c, rx, rz, ty, f, grp) {
    var E = { kind: 'pad', c: c, rx: rx, rz: rz, ty: ty, f: f, seed: (r() * 1e9) | 0, id: T.fol.length,
              snowD: snowK * lerp(0.13, 0.24, r()) * clamp(rx / 0.8, 0.65, 1.3) };
    T.fol.push(E);
    if (grp) grp.push(E);
    return E;
  }
  /* the ropes: from the pole's top to the outer tips of the branches, spread evenly round the tree */
  function ropesTo(pole, list, how) {
    if (!list.length) return;
    var n = Math.max(6, Math.round(lerp(18, 24, r()) * (spec.ropes === undefined ? 1 : spec.ropes)));
    var top = [pole.b[0], pole.b[1] - 0.12, pole.b[2]], used = {};
    for (var i = 0; i < n; i++) {
      var phi = i / n * TAU + (r() - 0.5) * 0.2, best = null, bs = -1e9;
      for (var k = 0; k < list.length; k++) {
        var E = list[k], tip = how === 'tip' ? E.p2 : E.c, dx = tip[0] - top[0], dz = tip[2] - top[2], az = Math.atan2(dx, dz);
        if (tip[1] > top[1] - 0.6) continue;
        var reach = Math.hypot(dx, dz) + (how === 'tip' ? 0 : E.rx * 0.8);
        if (how !== 'tip' && (used[E.id] || 0) >= 2) continue;
        var sc = reach * (1 - Math.min(1, Math.abs(angDiff(az, phi)) / 1.3)) / (1 + (used[E.id] || 0) * (how === 'tip' ? 3 : 1.5)) - (top[1] - tip[1]) * 0.04 + r() * 0.2;
        if (sc > bs) { bs = sc; best = E; }
      }
      if (!best) continue;
      used[best.id] = (used[best.id] || 0) + 1;
      // where it is tied: on the branch inside the foliage (so the needles hide its end, as on a real tree), and the
      // height at which it enters the foliage (from there on it lies behind the needles of the branch it holds)
      var end, enterY, ez;
      if (how === 'tip') {
        var cc3 = [2 * best.p1[0] - (best.p0[0] + best.p2[0]) / 2, 2 * best.p1[1] - (best.p0[1] + best.p2[1]) / 2, 2 * best.p1[2] - (best.p0[2] + best.p2[2]) / 2];
        var tt = 0.85, a1 = (1 - tt) * (1 - tt), a2 = 2 * tt * (1 - tt), a3 = tt * tt;
        end = [a1 * best.p0[0] + a2 * cc3[0] + a3 * best.p2[0], a1 * best.p0[1] + a2 * cc3[1] + a3 * best.p2[1], a1 * best.p0[2] + a2 * cc3[2] + a3 * best.p2[2]];
        enterY = end[1] + 0.07 + best.snowD; ez = (best.p0[2] + best.p2[2] * 2) / 3;
      } else {
        // the point on the branch inside the pad, toward its rim on this rope's side of the tree
        var ux = Math.sin(phi), uz = Math.cos(phi), cx2 = best.c[0] - top[0], cz2 = best.c[2] - top[2];
        var dl = Math.hypot(cx2, cz2) || 1, wx = lerp(cx2 / dl, ux, 0.5), wz = lerp(cz2 / dl, uz, 0.5), wl = Math.hypot(wx, wz) || 1;
        end = [best.c[0] + wx / wl * best.rx * 0.62, best.c[1] - best.ty * 0.05, best.c[2] + wz / wl * best.rz * 0.62];
        enterY = best.c[1] + best.ty * 0.5 + best.snowD; ez = best.c[2];
      }
      // it starts on the straw binding round the pole's top, on its own side of it
      var a0 = [top[0] + Math.sin(phi) * 0.05, top[1] - r() * 0.08, top[2] + Math.cos(phi) * 0.05];
      T.ropes.push({ a: a0, b: end, to: best.id, enterY: enterY, z: ez, phi: phi,
                     w: lerp(0.02, 0.045, Math.pow(r(), 1.4)), tone: r() * 2 - 1, sag: lerp(0.003, 0.012, r()), seed: (r() * 1e9) | 0 });
    }
  }

  /* snow on the wood: the upper side of near-level limbs, less under the pads that shelter them */
  T.segs.forEach(function (S) {
    var dx = S.b[0] - S.a[0], dy = S.b[1] - S.a[1], dz = S.b[2] - S.a[2], l = Math.hypot(dx, dy, dz) || 1, lev = 1 - Math.abs(dy) / l;
    if (lev < 0.55) return;
    var m = lerp3(S.a, S.b, 0.5), cover = 0;
    T.fol.forEach(function (E) {
      if (E.c[1] < m[1]) return;
      var q = Math.pow((m[0] - E.c[0]) / (E.rx * 1.1), 2) + Math.pow((m[2] - E.c[2]) / (E.rz * 1.1), 2);
      if (q < 1) cover = Math.max(cover, 1 - q * 0.6);
    });
    S.snow = snowK * 0.09 * Math.pow((lev - 0.55) / 0.45, 1.2) * (1 - cover) * clamp((S.ra - 0.03) / 0.05, 0, 1) * Math.min(1.5, T.cover);
  });
  /* the snow on each pad: one to three pieces along its top (sheltered pads hold less) */
  T.fol.forEach(function (E) {
    var shelter = 0;
    T.fol.forEach(function (O) {
      if (O === E || O.c[1] < E.c[1] + 0.2 || O.c[1] > E.c[1] + 2.5) return;
      var q = Math.pow((E.c[0] - O.c[0]) / (O.rx + E.rx * 0.5), 2) + Math.pow((E.c[2] - O.c[2]) / (O.rz + E.rz * 0.5), 2);
      if (q < 1) shelter = Math.max(shelter, 1 - q);
    });
    E.snowD *= 1 - shelter * 0.5;
    var pr = rng(E.seed + 5), np = E.kind === 'bough' ? 1 + (pr() < 0.45 ? 1 : 0) : 1 + Math.floor(pr() * 2.6);
    // (how much of it the snow covers: the panel's "snow cover", 1 as before)
    var cvr = clamp(0.55 + 0.45 * T.cover, 0.25, 1.12);
    E.cover = T.cover;
    var u0 = E.kind === 'bough' ? 0.1 : -lerp(0.62, 0.85, pr()) * cvr, u1 = E.kind === 'bough' ? Math.min(0.99, E.reach * clamp(0.6 + 0.4 * T.cover, 0.3, 1.1)) : lerp(0.6, 0.86, pr()) * cvr;
    var cuts = [];
    for (var i = 1; i < np; i++) cuts.push(lerp(u0, u1, (i + (pr() - 0.5) * 0.5) / np));
    var edges = [u0].concat(cuts).concat([u1]);
    E.pieces = [];
    for (var j = 0; j < edges.length - 1; j++) {
      var g = (u1 - u0) * 0.025;
      E.pieces.push({ u0: edges[j] + (j ? g : 0), u1: edges[j + 1] - (j < edges.length - 2 ? g : 0), d: E.snowD * lerp(0.8, 1.15, pr()), seed: (pr() * 1e9) | 0, loose: false });
    }
  });
  return T;
}

/* =====================================================================
   2. THE CAMERA — a tree's metres to the screen (CSS px)
   ===================================================================== */
function project(o) {
  var F = o.cam.F, cx = o.cam.cx, hy = o.cam.hy, eye = o.eye, D = eye * F / Math.max(1, o.footY - hy), X0 = (o.footX - cx) * D / F;
  function P(p) { var z = Math.max(1, D - p[2]); return [cx + F * (X0 + p[0]) / z, hy - F * (p[1] - eye) / z]; }
  P.s = function (z) { return F / Math.max(1, D - z); };
  P.D = D; P.eye = eye; P.X0 = X0; P.F = F; P.cx = cx; P.hy = hy;
  return P;
}

/* =====================================================================
   3. PAINTING — on a layer the size of the tree, in CSS px
   ===================================================================== */
var SNOW_DEF = [246, 246, 250];
function palette(o) {
  var L = o.light, hz = o.haze || 0, hc = o.hazeCol || [230, 225, 225], lx = L.sun[0] < 0 ? -1 : 1;
  function fin(c) { return mix(c, hc, hz); }
  var nd = o.needle || [47, 74, 59], sn = o.snow || SNOW_DEF, sh = o.shade || [190, 196, 220];
  var K = { lx: lx, fin: fin };
  K.under = fin(mix(scl(nd, 0.42), [14, 18, 34], 0.35));
  K.dark = fin(mix(scl(nd, 0.6), [10, 16, 26], 0.2));
  K.mid = fin(shade(nd, [lx * 0.3, 0.35, 0.85], L, 1));
  K.lit = fin(mix(shade(nd, [lx * 0.55, 0.8, 0.2], L, 1.35), [200, 214, 190], 0.12));
  K.hi = fin(mix(shade(nd, [lx * 0.8, 0.7, 0.1], L, 1.45), [214, 226, 196], 0.18));
  // snow: its top lit by the sun (and the sky), its front in the sky's shade (the sun is behind), blue beneath
  K.snowTop = fin(mix(shade(sn, [lx * 0.35, 1, 0.25], L, 1), sh, 0.15));
  K.snowLit = fin(shade(sn, [lx * 0.8, 0.6, 0.1], L, 1.05));
  K.snowFront = fin(mix(sh, sn, 0.18));
  K.snowUnder = fin(mix(sh, [120, 128, 172], 0.3));
  var rp = o.rope || [214, 180, 103], bb = o.bamboo || [196, 160, 84];
  // (straw and bamboo are glossy and pale: the bright sky lights them well even with the sun behind)
  K.rope = fin(mix(shade(rp, [lx * 0.3, 0.4, 0.85], L, 1), rp, 0.5));
  K.ropeLit = fin(mix(shade(rp, [lx * 0.85, 0.4, 0.3], L, 1.1), rp, 0.4));
  K.bamboo = fin(mix(shade(bb, [0, 0.2, 1], L, 1), bb, 0.5));
  K.bambooLit = fin(mix(shade(bb, [lx, 0.2, 0.2], L, 1.2), bb, 0.35));
  K.bambooDk = fin(mix(scl(bb, 0.55), [40, 34, 34], 0.25));
  K.bark = o.bark ? fin(shade(o.bark.bark, [lx * 0.3, 0.3, 0.9], L, 1)) : fin([60, 54, 54]);
  K.barkDk = o.bark ? fin(scl(o.bark.dark, 0.9)) : fin([30, 26, 28]);
  return K;
}
function pathOf(c, A, B) {                          // A left → right along the top, B right → left along the bottom, smooth
  c.beginPath();
  c.moveTo(A[0][0], A[0][1]);
  for (var i = 1; i < A.length; i++) { var p = A[i - 1], q = A[i]; c.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2); }
  c.lineTo(A[A.length - 1][0], A[A.length - 1][1]);
  c.lineTo(B[0][0], B[0][1]);
  for (i = 1; i < B.length; i++) { p = B[i - 1]; q = B[i]; c.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2); }
  c.lineTo(B[B.length - 1][0], B[B.length - 1][1]);
  c.closePath();
}

/* ---------- a pad of pine needles ---------- */
function padShape(E, P) {
  if (E._sh) return E._sh;
  var C = P(E.c), s = P.s(E.c[2]), hw = E.rx * s, th = E.ty * s, rr = rng(E.seed);
  var tilt = clamp((P.eye - E.c[1]) / (P.D - E.c[2]), -0.25, 0.25), surf = E.rz * s * tilt;
  var k1 = lerp(5, 9, rr()), k2 = lerp(11, 17, rr()), p1 = rr() * TAU, p2 = rr() * TAU, n = 24, up = [], lo = [];
  for (var i = 0; i <= n; i++) {
    var u = -1 + 2 * i / n, e = Math.sqrt(Math.max(0, 1 - u * u));
    var bump = 1 + 0.16 * Math.sin(u * k1 + p1) + 0.1 * Math.sin(u * k2 + p2);
    var x = C[0] + hw * u;
    up.push([x, C[1] - th * 0.58 * Math.pow(e, 0.65) * bump - Math.max(0, surf) * e]);
    lo.push([x, C[1] + th * 0.42 * Math.pow(e, 1.1) * (1.05 - 0.12 * Math.sin(u * k2 * 0.7 + p1)) + Math.max(0, -surf) * e]);
  }
  E._sh = { C: C, s: s, hw: hw, th: th, up: up, lo: lo };
  return E._sh;
}
function topAt(Sh, u) { var k = (u + 1) / 2 * (Sh.up.length - 1), i = clamp(Math.floor(k), 0, Sh.up.length - 2); return lerp(Sh.up[i][1], Sh.up[i + 1][1], k - i); }
function botAt(Sh, u) { var k = (u + 1) / 2 * (Sh.lo.length - 1), i = clamp(Math.floor(k), 0, Sh.lo.length - 2); return lerp(Sh.lo[i][1], Sh.lo[i + 1][1], k - i); }
function paintPad(c, E, P, K) {
  var Sh = padShape(E, P), C = Sh.C, s = Sh.s, hw = Sh.hw, th = Sh.th, rr = rng(E.seed + 1), lx = K.lx;
  var lo = Sh.lo.slice().reverse();
  // the needles deep inside the pad, in its own shade
  pathOf(c, Sh.up, lo);
  var g = c.createLinearGradient(0, C[1] - th * 0.6, 0, C[1] + th * 0.45);
  g.addColorStop(0, css(K.mid)); g.addColorStop(0.5, css(K.dark)); g.addColorStop(1, css(K.under));
  c.fillStyle = g; c.fill();
  // tufts of needles, row by row from the bottom up: each a fan of needles springing up and out from its twig,
  // so the pad's top and edges are bristly; the lower rows in shade, the top ones catching the light
  var tw = Math.max(2.2, 0.1 * s), bw = Math.max(0.4, 0.009 * s), rows = Math.max(2, Math.round(th / (tw * 0.5)));
  c.lineCap = 'round';
  for (var ri = 0; ri < rows; ri++) {
    var v = 1 - (ri + 0.5) / rows;                                         // 1 the bottom … 0 the top
    var nAcross = Math.max(2, Math.round(hw * 2 / (tw * 0.6)));
    for (var k = 0; k < nAcross; k++) {
      var u = -1 + 2 * (k + 0.5 + (rr() - 0.5) * 0.7) / nAcross;
      var yt = topAt(Sh, clamp(u, -1, 1)), yb = botAt(Sh, clamp(u, -1, 1));
      if (yb - yt < 1) continue;
      var y = lerp(yt, yb, v * 0.92 + 0.04) + (rr() - 0.5) * tw * 0.3, x = C[0] + hw * u;
      var lean = u * 0.7, litSide = u * lx > 0.1, tone = rr();
      var col = v > 0.7 ? (tone < 0.45 ? K.under : tone < 0.85 ? K.dark : K.mid) : v > 0.4 ? (tone < 0.4 ? K.dark : litSide && tone > 0.85 ? K.lit : K.mid)
              : (litSide ? (tone < 0.25 ? K.hi : tone < 0.7 ? K.lit : K.mid) : (tone < 0.3 ? K.lit : tone < 0.75 ? K.mid : K.dark));
      // a bundle of needles: many fine strokes, uneven in length and angle, in two tones (no stamped shape)
      var ns = 9 + Math.floor(rr() * 7), spread = lerp(1.4, 2.4, rr()), L0 = tw * lerp(0.9, 1.4, rr()), col2 = rr() < 0.5 ? K.dark : col;
      for (var pass = 0; pass < 2; pass++) {
        c.strokeStyle = css(pass ? col : col2, lerp(0.6, 0.9, rr())); c.lineWidth = bw * lerp(0.7, 1.05, rr());
        c.beginPath();
        for (var q = pass; q < ns; q += 2) {
          var a = -PI / 2 + lean + spread * (rr() - 0.5);
          var l = L0 * lerp(0.45, 1.05, rr()), bx2 = x + (rr() - 0.5) * tw * 0.35, by2 = y + rr() * tw * 0.2;
          c.moveTo(bx2, by2); c.quadraticCurveTo(bx2 + Math.cos(a) * l * 0.5, by2 + Math.sin(a) * l * 0.5 - l * 0.06, bx2 + Math.cos(a) * l, by2 + Math.sin(a) * l);
        }
        c.stroke();
      }
    }
  }
  // the hem: tufts hanging under the pad, dark
  var nh = Math.max(2, Math.round(hw * 2 / (tw * 1.4)));
  for (k = 0; k < nh; k++) {
    var u2 = -0.9 + 1.8 * (k + rr()) / nh, x2 = C[0] + hw * u2, y2 = botAt(Sh, u2) - tw * 0.25;
    c.strokeStyle = css(rr() < 0.6 ? K.under : K.dark, 0.85); c.lineWidth = bw;
    c.beginPath();
    for (q = 0; q < 5; q++) { var a2 = PI / 2 + u2 * 0.6 + (q - 2) * 0.32, l2 = tw * lerp(0.4, 0.75, rr()); c.moveTo(x2, y2); c.lineTo(x2 + Math.cos(a2) * l2, y2 + Math.sin(a2) * l2); }
    c.stroke();
  }
  // the snow, piece by piece (the loose ones are drawn by the caller on their own)
  E.pieces.forEach(function (Pc) { if (!Pc.loose) paintPadSnow(c, E, Pc, P, K); });
}
/* the outline of a piece of snow on a pad: its crest and its foot (sunk a little into the needles) */
function padSnowLines(E, Pc, P) {
  var Sh = padShape(E, P), s = Sh.s, hw = Sh.hw, C = Sh.C, d = Pc.d * s, rr = rng(Pc.seed), n = 14, Top = [], Bot = [];
  var ov = 0.04 * s;                                // it rounds over the pad's edge a little
  for (var i = 0; i <= n; i++) {
    var t = i / n, u = lerp(Pc.u0, Pc.u1, t), prof = Math.pow(Math.sin(PI * t), 0.42) * (0.85 + 0.3 * rr());
    var x = C[0] + hw * u + (t === 0 ? -ov : t === 1 ? ov : 0), yt = topAt(Sh, clamp(u, -1, 1));
    Top.push([x, yt - d * prof * 0.9 + d * 0.12]);
    Bot.push([x, yt + d * (0.32 + 0.18 * Math.sin(PI * t)) * (t === 0 || t === 1 ? 0.4 : 1)]);
  }
  return { Top: Top, Bot: Bot, d: d };
}
function paintPadSnow(c, E, Pc, P, K) {
  var Ln = padSnowLines(E, Pc, P), Top = Ln.Top, Bot = Ln.Bot, d = Ln.d, rr = rng(Pc.seed + 3);
  if (d < 0.3) return;
  // its shadow on the needles just under its front
  var Sd = Bot.map(function (p) { return [p[0], p[1] + d * 0.35]; });
  c.save(); c.globalAlpha = 0.35;
  pathOf(c, Bot, Sd.slice().reverse()); c.fillStyle = css(K.under); c.fill();
  c.restore();
  pathOf(c, Top, Bot.slice().reverse());
  var yMin = Math.min.apply(null, Top.map(function (p) { return p[1]; })), yMax = Math.max.apply(null, Bot.map(function (p) { return p[1]; }));
  var g = c.createLinearGradient(0, yMin, 0, yMax);
  g.addColorStop(0, css(K.snowTop)); g.addColorStop(0.42, css(mix(K.snowTop, K.snowFront, 0.5))); g.addColorStop(0.8, css(K.snowFront)); g.addColorStop(1, css(K.snowUnder));
  c.fillStyle = g; c.fill();
  snowLumps(c, Top, d, K, rr);
}
/* soft lumps along the crest of a piece of snow, lit from the sun's side */
function snowLumps(c, Top, d, K, rr) {
  var nl = Math.max(2, Math.round(Math.abs(Top[Top.length - 1][0] - Top[0][0]) / Math.max(3, d * 1.2)));
  for (var i = 0; i < nl; i++) {
    var t = (i + 0.5) / nl, k = t * (Top.length - 1), j = Math.floor(k), p = [lerp(Top[j][0], Top[Math.min(j + 1, Top.length - 1)][0], k - j), lerp(Top[j][1], Top[Math.min(j + 1, Top.length - 1)][1], k - j)];
    var rx = d * lerp(0.5, 0.9, rr()), ry = rx * lerp(0.45, 0.65, rr()), sideLit = (t - 0.5) * K.lx > 0;
    var gl = c.createRadialGradient(p[0] + K.lx * rx * 0.3, p[1] + ry * 0.2, 0, p[0], p[1] + ry * 0.5, rx);
    gl.addColorStop(0, css(sideLit ? K.snowLit : K.snowTop, 0.85)); gl.addColorStop(1, css(K.snowTop, 0));
    c.fillStyle = gl; c.beginPath(); c.ellipse(p[0], p[1] + ry * 0.55, rx, ry, 0, 0, TAU); c.fill();
  }
}

/* ---------- a drooping bough (variant 1) ---------- */
function boughShape(E, P) {
  if (E._sh) return E._sh;
  var A = P(E.p0), M = P(E.p1), B = P(E.p2), s = P.s(E.p1[2]);
  var Cc = [2 * M[0] - (A[0] + B[0]) / 2, 2 * M[1] - (A[1] + B[1]) / 2];
  function Q(t) { var a = (1 - t) * (1 - t), b = 2 * t * (1 - t), cc = t * t; return [a * A[0] + b * Cc[0] + cc * B[0], a * A[1] + b * Cc[1] + cc * B[1]]; }
  E._sh = { A: A, B: B, M: M, Q: Q, s: s, hang: E.hang * s, up: 0.07 * s };
  return E._sh;
}
/* The bough's real structure, in 3D (made once per bough): its main branch (a curve through p0, p1, p2), side
   branchlets along it on both sides (angled forward, drooping, shorter toward the tip, as a spruce's), and small
   twigs hanging from them. Nothing is a filled shape: every part is drawn as needles. */
function smooth01(x) { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); }
function boughPt(E, t) {
  var a = (1 - t) * (1 - t), b = 2 * t * (1 - t), cc = t * t, C = E._cc || (E._cc = [2 * E.p1[0] - (E.p0[0] + E.p2[0]) / 2, 2 * E.p1[1] - (E.p0[1] + E.p2[1]) / 2, 2 * E.p1[2] - (E.p0[2] + E.p2[2]) / 2]);
  return [a * E.p0[0] + b * C[0] + cc * E.p2[0], a * E.p0[1] + b * C[1] + cc * E.p2[1], a * E.p0[2] + b * C[2] + cc * E.p2[2]];
}
function boughModel(E) {
  if (E._m) return E._m;
  var rr = rng(E.seed + 11), L = E.L, tw = [], step = Math.max(0.045, 2 / (E._s || 40)) * lerp(0.9, 1.15, rr());
  // (E._lod: a small, far tree drawn with less detail: branchlets no closer than about 3 px apart on the screen)
  if (E._lod) step = Math.max(step, 3 / (E._s || 40));
  var n = Math.max(E._lod ? 1 : 3, Math.round(L / step));
  for (var i = 0; i < n; i++) {
    var t = (i + 0.35 + rr() * 0.3) / n;
    if (t > 0.98) continue;
    var B = boughPt(E, t), B2 = boughPt(E, Math.min(1, t + 0.02)), tx = B2[0] - B[0], tz = B2[2] - B[2], tl = Math.hypot(tx, tz) || 1;
    tx /= tl; tz /= tl;
    for (var sd = -1; sd <= 1; sd += 2) {
      if (rr() < 0.08) continue;                                         // a gap where a branchlet is missing
      var ang = sd * (lerp(0.6, 1.15, rr()) + smooth01((t - 0.75) / 0.25) * 0.5), ca = Math.cos(ang), sa = Math.sin(ang);   // (round the tip they fan out)
      var dx = tx * ca - tz * sa, dz = tx * sa + tz * ca;                // turned out from the branch, forward
      var lb = (0.34 - 0.06 * t - 0.12 * Math.pow(t, 6)) * lerp(0.75, 1.15, rr()) * Math.min(1, 0.45 + L / 2.2), droop = lerp(0.35, 0.9, rr()) * (0.8 + E.hang / L) * (0.8 + 0.4 * t);
      var base = [B[0], B[1] + 0.01, B[2]];
      var mid = [base[0] + dx * lb * 0.55, base[1] - Math.sin(droop) * lb * 0.25, base[2] + dz * lb * 0.55];
      var tip = [base[0] + dx * lb * Math.cos(droop * 0.7), base[1] - Math.sin(droop) * lb * 0.85, base[2] + dz * lb * Math.cos(droop * 0.7)];
      if (E.floor !== undefined && tip[1] < E.floor) { tip[1] = E.floor; mid[1] = Math.max(mid[1], (base[1] + E.floor) / 2); }
      // little twigs hanging from it (more toward the middle of the bough, where it is heaviest)
      var hang = [], nh = Math.round(lerp(1, 4, rr()) * Math.sin(PI * Math.min(1, t * 1.1 + 0.05)));
      for (var h = 0; h < nh; h++) {
        var f = lerp(0.3, 0.9, rr()), hb = lerp3(base, tip, f), hl = lb * lerp(0.35, 0.7, rr());
        if (E.floor !== undefined) hl = Math.min(hl, Math.max(0, hb[1] - E.floor));
        if (hl > 0.03) hang.push([hb, [hb[0] + dx * hl * 0.2, hb[1] - hl, hb[2] + dz * hl * 0.2]]);
      }
      tw.push({ t: t, side: sd, base: base, mid: mid, tip: tip, hang: hang, lb: lb, z: (base[2] + tip[2]) / 2, tone: rr(), full: lerp(0.75, 1.2, rr()) });
    }
  }
  E._m = { tw: tw };
  return E._m;
}
/* A brush that gathers strokes by colour and draws each colour's strokes at once (one stroke call per colour, not per
   needle); flush() lays them down, the darkest first, so the lit needles lie on top. */
function Brush(c, lw) {
  var B = {}, keys = [];
  return {
    line: function (col, a, pts) {
      var k = css(col, Math.round(a * 8) / 8);
      if (!B[k]) { B[k] = { p: new Path2D(), lum: col[0] * 0.3 + col[1] * 0.59 + col[2] * 0.11 }; keys.push(k); }
      var P2 = B[k].p; P2.moveTo(pts[0][0], pts[0][1]);
      for (var i = 1; i < pts.length; i++) P2.lineTo(pts[i][0], pts[i][1]);
    },
    flush: function (halo) {
      keys.sort(function (a, b) { return B[a].lum - B[b].lum; });
      c.lineCap = 'round'; c.lineJoin = 'round';
      if (halo) {                                   // a faint wider stroke under each needle: the edges blend, not cut
        c.globalAlpha = halo; c.lineWidth = lw * 3;
        keys.forEach(function (k) { c.strokeStyle = k; c.stroke(B[k].p); });
        c.globalAlpha = 1;
      }
      c.lineWidth = lw;
      keys.forEach(function (k) { c.strokeStyle = k; c.stroke(B[k].p); });
      B = {}; keys = [];
    }
  };
}
/* a branchlet's needles: several fine strokes along it, spread across its width and tapering to its tip, then a fringe
   of single needles along its edges */
function needleRun(Bru, pts, wid, s, cols, alphaK, rr, lod) {
  var A = pts[0], M = pts[1], Z = pts[2], ns = wid > 3 ? 6 : wid > 2 ? 5 : wid > 1.2 ? 4 : 3;
  if (lod) ns = Math.max(2, Math.min(ns, Math.round(wid * 1.5)));     // (no more strokes across it than its pixels can show)
  var mx = 2 * M[0] - (A[0] + Z[0]) / 2, my = 2 * M[1] - (A[1] + Z[1]) / 2;
  function at(u) { var a = (1 - u) * (1 - u), b = 2 * u * (1 - u), cc = u * u; return [a * A[0] + b * mx + cc * Z[0], a * A[1] + b * my + cc * Z[1]]; }
  var seg = 4, P0 = [];
  for (var i = 0; i <= seg; i++) P0.push(at(i / seg));
  for (var k = 0; k < ns; k++) {
    var off = (k / (ns - 1) - 0.5) * wid, col = cols[Math.floor(rr() * cols.length)], line = [];
    for (i = 0; i <= seg; i++) {
      var u = i / seg, p = P0[i], q = P0[Math.min(seg, i + 1)], r0 = P0[Math.max(0, i - 1)], dx = q[0] - r0[0], dy = q[1] - r0[1], l = Math.hypot(dx, dy) || 1;
      var o = off * (1 - 0.7 * u) + (rr() - 0.5) * wid * 0.15;
      line.push([p[0] - dy / l * o, p[1] + dx / l * o]);
    }
    Bru.line(col, lerp(0.55, 0.9, rr()) * alphaK, line);
  }
  // single needles standing out along its edges (its edges are never a clean line)
  var nf = Math.round(lerp(1, 3, rr())), nl = Math.max(0.9, 0.04 * s);
  if (lod && s < 30) nf = rr() < 0.3 ? 1 : 0;                        // (single needles: finer than a pixel on a small tree)
  for (i = 0; i < nf; i++) {
    var u2 = rr() * 0.95, p2 = at(u2), q2 = at(Math.min(1, u2 + 0.05)), dx2 = q2[0] - p2[0], dy2 = q2[1] - p2[1], l2 = Math.hypot(dx2, dy2) || 1;
    var sd = rr() < 0.5 ? -1 : 1, w2 = wid * 0.5 * (1 - 0.7 * u2), bx = p2[0] - dy2 / l2 * w2 * sd, by = p2[1] + dx2 / l2 * w2 * sd;
    var ang2 = lerp(0.4, 1.2, rr()), ca2 = Math.cos(ang2), sa2 = Math.sin(ang2), ln2 = nl * lerp(0.5, 1.2, rr());
    var ax = dx2 / l2 * ca2 - dy2 / l2 * sd * sa2, ay = dy2 / l2 * ca2 + dx2 / l2 * sd * sa2 + lerp(0, 0.4, rr());
    Bru.line(cols[Math.floor(rr() * cols.length)], 0.45 * alphaK, [[bx, by], [bx + ax * ln2, by + ay * ln2]]);
  }
}
/* The inside of a tall pine's crown: its inner branches and needles, in deep shade, brushed out from the trunk at
   every height, so the crown is full (the boughs are drawn over it). */
function paintCore(c, T, P, K) {
  var Co = T.core, rr = rng(Co.seed), s = P.s(0), Bru = Brush(c, Math.max(0.5, 0.014 * s)), dy = Math.max(0.035, 1.6 / s);
  for (var y = Co.y0 + 0.1; y < Co.y1; y += dy * lerp(0.7, 1.3, rr())) {
    var C0 = Co.at(y), R = Co.R(y), n = 8 + Math.floor(rr() * 5);
    for (var k = 0; k < n; k++) {
      var th = rr() * TAU, r1 = R * lerp(0.45, 1, Math.sqrt(rr())), dr = lerp(0.2, 0.5, rr());
      if (y - r1 * dr < Co.floor) dr = Math.max(0, (y - Co.floor) / r1);   // (never down over the trunk below the crown)
      var tip = [C0[0] + Math.sin(th) * r1, y - r1 * dr, C0[2] + Math.cos(th) * r1], mid = [C0[0] + Math.sin(th) * r1 * 0.5, y - r1 * dr * 0.3, C0[2] + Math.cos(th) * r1 * 0.5];
      var A = P(C0), M = P(mid), Z = P(tip), tone = rr();
      Bru.line(tone < 0.55 ? K.under : tone < 0.9 ? K.dark : K.mid, lerp(0.6, 0.95, rr()), [A, M, Z, [Z[0] + (rr() - 0.5) * 2, Z[1] + lerp(1, 3, rr())]]);
    }
  }
  Bru.flush();
}
function paintBough(c, E, P, K) {
  var M = boughModel(E), s = P.s(E.p1[2]), rr = rng(E.seed + 1), lx = K.lx, lod = !!E._lod;
  var axisZ = boughPt(E, 0.5)[2], wid0 = Math.max(1, 0.12 * s), Bru = Brush(c, Math.max(0.45, 0.012 * s));
  function twig(T) {
    // its light: deep in the crown (near the trunk) and under the branch, darker; out at the tips and on the sun's
    // side, lighter; the far side of the bough, a little darker (in the bough's own shade)
    var depth = clamp(1 - T.t * 1.3, 0, 1), back = T.z < axisZ ? 0.25 : 0, litSide = (P(T.tip)[0] - P(T.base)[0]) * lx > 0;
    var cols = depth + back > 0.7 ? [K.under, K.dark, K.dark, K.mid] : depth + back > 0.35 ? [K.dark, K.mid, K.mid] : litSide ? [K.mid, K.lit, K.lit, K.hi] : [K.dark, K.mid, K.mid, K.lit];
    var A = P(T.base), Mi = P(T.mid), Z = P(T.tip);
    needleRun(Bru, [A, Mi, Z], wid0 * T.full * (0.6 + 0.4 * (1 - T.t)), s, cols, 1, rr, lod);
    T.hang.forEach(function (H, hi) {
      if (lod && s < 30 && hi > 0) return;                              // (a small tree: one hanging twig is all a pixel can show)
      var hb = P(H[0]), he = P(H[1]);
      needleRun(Bru, [hb, [lerp(hb[0], he[0], 0.5) + (rr() - 0.5) * 2, lerp(hb[1], he[1], 0.5)], he], wid0 * 0.6, s, [K.under, K.dark, K.mid, K.mid], 0.95, rr, lod);
    });
  }
  var backT = M.tw.filter(function (T) { return T.z < axisZ; }), foreT = M.tw.filter(function (T) { return T.z >= axisZ; });
  backT.forEach(twig);
  Bru.flush(0.18);
  // the main branch itself, a thin dark twig, seen in the gaps near the trunk
  c.strokeStyle = css(K.barkDk, 0.85); c.lineWidth = Math.max(0.6, 0.035 * s); c.lineCap = 'round';
  c.beginPath();
  for (var i = 0; i <= 10; i++) { var q = P(boughPt(E, i / 10 * 0.9)); if (i) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); }
  c.stroke();
  foreT.forEach(twig);
  // the tip: the branch's own end, a spray of new growth
  var tp = P(E.p2), tq = P(boughPt(E, 0.9));
  for (var tf = 0, ntf = lod && s < 30 ? 2 : 5; tf < ntf; tf++) {          // a soft rounded tuft at the end (no point)
    var ta = (tf / Math.max(1, ntf - 1) - 0.5) * 1.6 + Math.atan2(tp[1] - tq[1], tp[0] - tq[0]) + 0.3, tl2 = wid0 * lerp(1.2, 1.8, rr());
    needleRun(Bru, [tq, [lerp(tq[0], tp[0], 0.7), lerp(tq[1], tp[1], 0.7)], [tp[0] + Math.cos(ta) * tl2, tp[1] + Math.sin(ta) * tl2 + tl2 * 0.4]], wid0 * 0.7, s, [K.mid, K.lit, K.dark], 0.9, rr, lod);
  }
  Bru.flush(0.18);
  E.pieces.forEach(function (Pc) { if (!Pc.loose) paintBoughSnow(c, E, Pc, P, K); });
}
/* The snow on a bough, piece by piece: it lies only on the branch itself and the inner part of its branchlets, as soft
   rounded cushions along their tops (never wider than the needles under it: snow cannot bridge the air between them),
   thickest near the branch, thinning outward, with gaps where it has fallen; none where the branch slopes steeply. Its
   rounded top is lit, its front lies in the sky's blue shade, and it throws a little shade on the needles under it. */
function noise1(rr, n) { var a = []; for (var i = 0; i <= n; i++) a.push(rr()); return function (x) { x = clamp(x, 0, 1) * n; var i = Math.min(n - 1, Math.floor(x)), f = x - i; f = f * f * (3 - 2 * f); return lerp(a[i], a[i + 1], f); }; }
function boughSnowClumps(E, Pc, P) {
  var key = Pc.u0 + ':' + Pc.u1;
  if (Pc._cl && Pc._clKey === key) return Pc._cl;
  var M = boughModel(E), rr = rng(Pc.seed), s = P.s(E.p1[2]);
  boughPt(E, 0);
  var C = E._cc, dx = E.p2[0] - E.p0[0], dz = E.p2[2] - E.p0[2], hz = Math.hypot(dx, dz) || 1;
  function keepAt(t) { var dy = 2 * (1 - t) * (C[1] - E.p0[1]) + 2 * t * (E.p2[1] - C[1]); return clamp(1 - (Math.atan(Math.abs(dy) / hz) - 0.55) / 0.35, 0, 1); }
  var big = noise1(rr, 6), mid = noise1(rr, 15), list = [];
  // a cushion of snow along a run of branch (3D points a → b): its depth (m) at each end; on the screen it is drawn as a
  // soft rounded ridge lying on the top of that branch, as wide as the branch's needles there and no wider
  function ridge(a, b, d0, d1, wid) {
    var A = P(a), B = P(b), w0 = d0 * s, w1 = d1 * s;
    if (Math.max(w0, w1) < 0.6) return;
    list.push({ A: A, B: B, w0: Math.max(0.3, w0), w1: Math.max(0.3, w1), wid: wid * s, lit: rr() });
  }
  var thr = 0.22 + (1 - (E.cover === undefined ? 1 : E.cover)) * 0.45, have = function (u) { return big(u) * 0.8 + mid(u) * 0.4 > thr; };   // (where it has not fallen off; less with less cover)
  // along the main branch
  var n = Math.max(4, Math.round((Pc.u1 - Pc.u0) * E.L / 0.06));
  for (var i = 0; i < n; i++) {
    var u0 = i / n, u1 = (i + 1) / n, t0 = lerp(Pc.u0, Pc.u1, u0), t1 = lerp(Pc.u0, Pc.u1, u1);
    if (!have((u0 + u1) / 2)) continue;
    var a = boughPt(E, t0), b = boughPt(E, t1), k = keepAt((t0 + t1) / 2), env = Math.sin(PI * clamp((u0 + u1) / 2 * 1.05, 0, 1));
    var d = Pc.d * k * (0.5 + 0.7 * big(u0)) * (0.55 + 0.45 * env) * 0.8;
    ridge([a[0], a[1] + 0.05, a[2]], [b[0], b[1] + 0.05, b[2]], d, d * lerp(0.85, 1.1, rr()), 0.1);
  }
  // along the inner part of each branchlet (where it is still nearly level and densely needled), thinning outward
  M.tw.forEach(function (T) {
    if (T.t < Pc.u0 || T.t > Pc.u1) return;
    var u = (T.t - Pc.u0) / Math.max(1e-3, Pc.u1 - Pc.u0), k = keepAt(T.t);
    if (k < 0.1 || !have(u) || rr() < 0.15) return;
    var reach = lerp(0.35, 0.7, rr()), d = Pc.d * k * (0.45 + 0.6 * big(u)) * 0.7;
    var m1 = lerp3(T.base, T.mid, Math.min(1, reach * 1.6));
    ridge([T.base[0], T.base[1] + 0.035, T.base[2]], [m1[0], m1[1] + 0.03, m1[2]], d, d * 0.35, 0.08);
  });
  var Top = [], Bot = [], dmax = 0;
  list.forEach(function (R) {
    var w = Math.max(R.w0, R.w1);
    Top.push([Math.min(R.A[0], R.B[0]) - w, Math.min(R.A[1], R.B[1]) - w * 1.6], [Math.max(R.A[0], R.B[0]) + w, Math.min(R.A[1], R.B[1]) - w * 1.6]);
    Bot.push([R.A[0], Math.max(R.A[1], R.B[1]) + w]); dmax = Math.max(dmax, w);
  });
  Pc._cl = { list: list, Top: Top.length ? Top : [[0, 0], [0, 0]], Bot: Bot.length ? Bot : [[0, 0]], d: dmax };
  Pc._clKey = key;
  return Pc._cl;
}
function boughSnowLines(E, Pc, P) { return boughSnowClumps(E, Pc, P); }
function paintBoughSnow(c, E, Pc, P, K) {
  var S = boughSnowClumps(E, Pc, P), L = S.list;
  if (!L.length) return;
  c.lineCap = 'round'; c.lineJoin = 'round';
  // each cushion as a tapering ridge: drawn in a few short pieces so its depth can change along it
  function ridgePass(R, lift, wk, col, a) {
    var steps = 3;
    for (var q = 0; q < steps; q++) {
      var f0 = q / steps, f1 = (q + 1) / steps, w = lerp(R.w0, R.w1, (f0 + f1) / 2);
      var x0 = lerp(R.A[0], R.B[0], f0), y0 = lerp(R.A[1], R.B[1], f0) - w * lift, x1 = lerp(R.A[0], R.B[0], f1), y1 = lerp(R.A[1], R.B[1], f1) - w * lift;
      c.strokeStyle = css(col, a); c.lineWidth = Math.max(0.4, w * wk);
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
    }
  }
  var i;
  // 1. the shade it throws on the needles just under it
  for (i = 0; i < L.length; i++) ridgePass(L[i], -0.55, 0.9, K.under, 0.28);
  // 2. the cushion in the sky's blue shade (its front and underside: the sun is behind)
  for (i = 0; i < L.length; i++) ridgePass(L[i], 0.45, 1.0, mix(K.snowFront, K.snowUnder, 0.3), 1);
  // 3. its rounded top, lit, a little higher and narrower
  for (i = 0; i < L.length; i++) ridgePass(L[i], 0.72, 0.62, L[i].lit > 0.5 ? K.snowTop : mix(K.snowTop, K.snowFront, 0.3), 1);
  // 4. the very top catching the light, here and there
  for (i = 0; i < L.length; i++) if (L[i].lit > 0.6) ridgePass(L[i], 0.88, 0.28, K.snowLit, 0.85);
}

/* ---------- the wood's snow, the bamboo, the ropes, the snow at the feet ---------- */
function paintLimbSnow(c, T, P, K) {
  T.segs.forEach(function (S, si) {
    if (S.snow < 0.01) return;
    var A = P(S.a), B = P(S.b), s = P.s((S.a[2] + S.b[2]) / 2), dx = B[0] - A[0], dy = B[1] - A[1], l = Math.hypot(dx, dy) || 1;
    var nx = dy / l, ny = -dx / l;
    if (ny > 0) { nx = -nx; ny = -ny; }                                  // the side facing up on the screen
    var rad = (S.ra + S.rb) / 2 * s, d = S.snow * s;
    if (d < 2.2 || l < d) return;                                        // too thin to read as snow: none (no white specks)
    // one long soft ridge lying along the top of this piece of limb (the pieces overlap, so a limb's snow runs on)
    var ang = Math.atan2(dy, dx), cx = (A[0] + B[0]) / 2 + nx * rad * 0.7, cy = (A[1] + B[1]) / 2 + ny * rad * 0.7;
    c.save(); c.translate(cx, cy); c.rotate(ang > PI / 2 ? ang - PI : ang < -PI / 2 ? ang + PI : ang);
    var w = l * 0.62 + d * 0.4, h = d * 0.6;
    var g = c.createLinearGradient(0, -h, 0, h * 0.6);
    g.addColorStop(0, css(K.snowTop)); g.addColorStop(0.55, css(K.snowFront)); g.addColorStop(1, css(K.snowUnder));
    c.fillStyle = g; c.beginPath(); c.ellipse(0, -h * 0.2, w, h, 0, 0, TAU); c.fill();
    c.restore();
  });
}
function paintBamboo(c, B, P, K, snowD) {
  var A = P(B.a), Z = P(B.b), s = P.s((B.a[2] + B.b[2]) / 2), w = Math.max(0.9, B.r * 2 * s), dx = Z[0] - A[0], dy = Z[1] - A[1], l = Math.hypot(dx, dy) || 1;
  var nx = -dy / l * w / 2, ny = dx / l * w / 2;
  c.beginPath(); c.moveTo(A[0] + nx, A[1] + ny); c.lineTo(Z[0] + nx, Z[1] + ny); c.lineTo(Z[0] - nx, Z[1] - ny); c.lineTo(A[0] - nx, A[1] - ny); c.closePath();
  // shaded round it: the gradient runs across the cane (from its left side to its right), at its middle
  var mx = (A[0] + Z[0]) / 2, my = (A[1] + Z[1]) / 2, sx = nx, sy = ny;
  if (sx > 0) { sx = -sx; sy = -sy; }                                        // (sx, sy): toward its left side
  var g = c.createLinearGradient(mx + sx * 1.05, my + sy * 1.05, mx - sx * 1.05, my - sy * 1.05), lit = K.lx < 0;
  g.addColorStop(0, css(lit ? K.bambooLit : K.bambooDk)); g.addColorStop(0.5, css(K.bamboo)); g.addColorStop(1, css(lit ? K.bambooDk : K.bambooLit));
  c.fillStyle = g; c.fill();
  // nodes every 30-45 cm
  var len3 = Math.hypot(B.b[0] - B.a[0], B.b[1] - B.a[1], B.b[2] - B.a[2]), nn = Math.floor(len3 / 0.38), rr = rng((B.a[0] * 1000 + B.b[1] * 77) | 0);
  if (w > 1.6) {
    c.lineWidth = Math.max(0.4, w * 0.1);
    for (var i = 1; i < nn; i++) {
      var t = (i + (rr() - 0.5) * 0.3) / nn, px = lerp(A[0], Z[0], t), py = lerp(A[1], Z[1], t);
      c.strokeStyle = css(K.bambooDk, 0.5); c.beginPath(); c.moveTo(px + nx * 1.12, py + ny * 1.12); c.lineTo(px - nx * 1.12, py - ny * 1.12); c.stroke();
    }
  }
  if (B.cap) {
    // the straw binding at the top where the ropes gather, and a little snow on it
    var cw = w * 2.1, ch = Math.max(2, 0.3 * s), tx = Z[0], ty = Z[1];
    c.fillStyle = css(K.rope); c.beginPath(); c.moveTo(tx - cw / 2, ty + ch); c.lineTo(tx - cw * 0.35, ty); c.lineTo(tx + cw * 0.35, ty); c.lineTo(tx + cw / 2, ty + ch); c.closePath(); c.fill();
    c.strokeStyle = css(K.bambooDk, 0.55); c.lineWidth = Math.max(0.4, w * 0.15);
    for (var q = 1; q < 4; q++) { var yy = ty + ch * q / 4; c.beginPath(); c.moveTo(tx - cw * (0.35 + 0.15 * q / 4), yy); c.lineTo(tx + cw * (0.35 + 0.15 * q / 4), yy - ch * 0.12); c.stroke(); }
    var sd = Math.max(0.6, (snowD || 0.1) * 0.5 * s);
    c.fillStyle = css(K.snowTop); c.beginPath(); c.ellipse(tx, ty - sd * 0.25, cw * 0.4, sd * 0.6, 0, PI, TAU); c.fill();
  }
}
/* A rope's point a share t along it (a taut straw rope still sags a very little). */
function ropePt(R, t) {
  var p = lerp3(R.a, R.b, t), l = Math.hypot(R.b[0] - R.a[0], R.b[1] - R.a[1], R.b[2] - R.a[2]);
  p[1] -= R.sag * l * 4 * t * (1 - t);
  return p;
}
/* its colour: straw, lit on the sun's side, each rope its own (some newer and paler, some weathered and darker) */
function ropeCol(R, P, K) {
  var A = P(R.a), B = P(R.b), lit = (B[0] - A[0]) * K.lx > 0, c = lit ? K.ropeLit : K.rope;
  c = R.tone < 0 ? mix(c, K.fin([120, 98, 66]), -R.tone * 0.45) : mix(c, K.fin([238, 218, 168]), R.tone * 0.3);
  return { base: c, hi: mix(c, K.fin([250, 236, 196]), 0.45), dk: mix(c, [40, 30, 20], 0.45) };
}
function paintRopeSeg(c, R, t0, t1, P, K) {
  var C = R._col || (R._col = ropeCol(R, P, K)), A = P(ropePt(R, t0)), B = P(ropePt(R, t1));
  var s = P.s(lerp(R.a[2], R.b[2], (t0 + t1) / 2)), w = Math.max(0.8, R.w * s), dx = B[0] - A[0], dy = B[1] - A[1], l = Math.hypot(dx, dy) || 1;
  c.lineCap = 'round';
  c.strokeStyle = css(C.base); c.lineWidth = w;
  c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(B[0], B[1]); c.stroke();
  if (w < 1.3) return;
  // the light along its sun side, and the twist of the straw
  var nx = -dy / l, ny = dx / l;
  if (nx * K.lx < 0) { nx = -nx; ny = -ny; }
  c.strokeStyle = css(C.hi, 0.7); c.lineWidth = w * 0.3;
  c.beginPath(); c.moveTo(A[0] + nx * w * 0.22, A[1] + ny * w * 0.22); c.lineTo(B[0] + nx * w * 0.22, B[1] + ny * w * 0.22); c.stroke();
  var step = w * 1.7, n = Math.floor(l / step), ux = dx / l, uy = dy / l;
  if (n < 1) return;
  c.strokeStyle = css(C.dk, 0.35); c.lineWidth = Math.max(0.35, w * 0.18);
  c.beginPath();
  for (var i = 0; i < n; i++) {
    var px = A[0] + ux * step * (i + 0.5), py = A[1] + uy * step * (i + 0.5);
    c.moveTo(px - nx * w * 0.45 - ux * w * 0.3, py - ny * w * 0.45 - uy * w * 0.3); c.lineTo(px + nx * w * 0.45 + ux * w * 0.3, py + ny * w * 0.45 + uy * w * 0.3);
  }
  c.stroke();
}
/* a piece (t0 … t1) of a bamboo cane: the pole or a prop */
function paintBambooSeg(c, B, t0, t1, P, K, snowD) {
  var B2 = { a: lerp3(B.a, B.b, t0), b: lerp3(B.a, B.b, t1), r: B.r, cap: B.cap && t1 >= 1 };
  paintBamboo(c, B2, P, K, snowD);
  if (B.prop && t1 >= 1) {
    // its top: a short fork under the limb, lashed with straw
    var Z = P(B.b), A = P(lerp3(B.a, B.b, 0.96)), s = P.s(B.b[2]), w = Math.max(1, B.r * 2 * s), f = Math.max(2, 0.14 * s);
    c.strokeStyle = css(K.bamboo); c.lineCap = 'round'; c.lineWidth = w * 0.7;
    c.beginPath(); c.moveTo(Z[0], Z[1] + w * 0.4); c.lineTo(Z[0] - f * 0.55, Z[1] - f * 0.35); c.moveTo(Z[0], Z[1] + w * 0.4); c.lineTo(Z[0] + f * 0.55, Z[1] - f * 0.35); c.stroke();
    c.strokeStyle = css(K.rope); c.lineWidth = Math.max(0.5, w * 0.35);
    c.beginPath();
    for (var i = 0; i < 3; i++) { var y = lerp(A[1], Z[1], 0.3 + i * 0.25) + w * 0.5; c.moveTo(Z[0] - w * 0.75, y + w * 0.25); c.lineTo(Z[0] + w * 0.75, y - w * 0.25); }
    c.stroke();
  }
}
/* Where a trunk (or a cane) goes into the snow. The snow does not end in a straight line: it lies a little uneven
   against the bark, banked up over the surface roots; the bark has melted it back a little (a thin dark gap where the two
   meet), the snow curving down into that gap lies in blue shade, and its crest catches the light on the sun's side.
   join(x) gives, for a point across the screen, how far above the foot the snow reaches there (CSS px). */
function snowJoin(p, half, roots, P, seed) {
  var F = P(p), s = P.s(p[2]), rr = rng(seed), k1 = lerp(0.25, 0.45, rr()) / Math.max(1, half * 0.12), k2 = k1 * lerp(2.1, 3.3, rr()), p1 = rr() * TAU, p2 = rr() * TAU;
  var base = 0.06 * s, R = roots || [];
  return { x: F[0], y: F[1], s: s, half: half, h: function (x) {
    var h = base * (1 + 0.22 * Math.sin(x * k1 + p1) + 0.12 * Math.sin(x * k2 + p2));
    for (var i = 0; i < R.length; i++) { var d = (x - R[i][0]) / R[i][1]; h += R[i][2] * Math.exp(-d * d); }   // banked over a root
    return Math.max(0.5, h);
  } };
}
function clipAbove(c, J, x0, x1, top) {              // keeps what is above the snow's line, across x0 … x1 (beyond: above the foot)
  c.beginPath(); c.moveTo(x0 - 4000, top); c.lineTo(x1 + 4000, top); c.lineTo(x1 + 4000, J.y - J.h(x1)); c.lineTo(x1, J.y - J.h(x1));
  for (var x = x1; x >= x0; x -= 0.5) c.lineTo(x, J.y - J.h(x));
  c.lineTo(x0 - 4000, J.y - J.h(x0)); c.closePath(); c.clip();
}
function paintJoin(c, J, w, K) {
  var x0 = J.x - w, x1 = J.x + w, lx = K.lx, x;
  // the snow just in front of the bark, curving down into the melted gap: in the blue shade (stronger on the side away
  // from the sun), fading out into the snow around
  c.save();
  c.beginPath(); c.moveTo(x0, J.y - J.h(x0));
  for (x = x0; x <= x1; x += 0.5) c.lineTo(x, J.y - J.h(x));
  c.lineTo(x1, J.y + J.s * 0.3); c.lineTo(x0, J.y + J.s * 0.3); c.closePath(); c.clip();
  c.translate(J.x - lx * w * 0.15, J.y - J.h(J.x)); c.scale(1, Math.max(0.05, J.s * 0.1 / (w * 1.1)));
  var g = c.createRadialGradient(0, 0, 0, 0, 0, w * 1.1);
  g.addColorStop(0, css(K.snowUnder, 0.55)); g.addColorStop(0.45, css(K.snowUnder, 0.22)); g.addColorStop(1, css(K.snowUnder, 0));
  c.fillStyle = g; c.fillRect(-w * 1.2, -w * 1.2, w * 2.4, w * 2.4);
  c.restore();
  // the thin dark gap where snow meets bark (only where there is bark: found from the trunk's picture; a cane: its width)
  function barkAt(x) {
    if (!J.bark) return Math.abs(x - J.x) < J.half * 1.05 ? 1 : 0;
    var i = Math.round((x - J.bx0) / 0.5);
    return i >= 0 && i < J.bark.length ? J.bark[i] : 0;
  }
  var dk = mix(K.barkDk, K.snowUnder, 0.35);
  c.lineWidth = Math.max(0.6, J.s * 0.012); c.lineCap = 'round';
  for (x = x0; x < x1; x += 0.5) {
    var a = Math.min(barkAt(x), barkAt(x + 0.5));
    if (a < 0.15) continue;
    c.strokeStyle = css(dk, 0.6 * a);
    c.beginPath(); c.moveTo(x, J.y - J.h(x)); c.lineTo(x + 0.5, J.y - J.h(x + 0.5)); c.stroke();
  }
  // the snow's crest along it, lit on the sun's side (broken, as a soft lip of snow is)
  var rr = rng(Math.round(J.x * 13 + J.y * 7));
  c.strokeStyle = css(K.snowLit, 0.75); c.lineWidth = Math.max(0.5, J.s * 0.01); c.lineCap = 'round';
  c.beginPath();
  for (x = J.x + lx * w * 0.05; Math.abs(x - J.x) < w * 0.9; x += lx * lerp(2, 4, rr())) {
    var l = lerp(1, 3, rr()), y0 = J.y - J.h(x) + 0.9, y1 = J.y - J.h(x + lx * l) + 0.9;
    if (rr() < 0.7 && barkAt(x) > 0.3) { c.moveTo(x, y0); c.lineTo(x + lx * l, y1); }
  }
  c.stroke();
}

/* ---------- the wood: trunks.js (round limbs, the maples' bark) or, without it, painted ---------- */
function paintWood(c, T, P, o, K, box) {
  var nodes = [], map = {};
  T.segs.forEach(function (S, i) {
    var A = P(S.a), B = P(S.b), s = P.s((S.a[2] + S.b[2]) / 2);
    map[i] = nodes.length;
    nodes.push({ p: S.p >= 0 ? map[S.p] : -1, w: Math.max(0.6, (S.ra + S.rb) * s), len: Math.hypot(B[0] - A[0], B[1] - A[1]) || 0.5,
                 abs: Math.atan2(B[1] - A[1], B[0] - A[0]), sx: A[0], sy: A[1], ex: B[0], ey: B[1] });
  });
  var done = false;
  if (o.trunks !== false && typeof Trunks !== 'undefined' && Trunks.state() !== 'none') {
    try {
      var model = Trunks.build({ nodes: nodes, seed: T.seed % 100000 + 7, X: function (x) { return x; }, clumps: [],
                                 look: { girth: 1, bend: 0.4, depth: 0, rootFlare: 1.35, roots: 0, rootLen: 0.55 } });
      var L = o.light, lt = { dir: [L.sun[0], -L.sun[1], L.sun[2]], sun: L.sunCol, sky: scl(L.skyCol, L.amb),
                              bounce: scl([0.62, 0.66, 0.78], L.amb * 0.8), leaf: scl(L.skyCol, L.amb * 0.7), air: o.hazeCol || [230, 225, 225] };
      var bk = o.bark || {};
      var g = Trunks.draw({ model: model, nodes: nodes, X: function (x) { return x; }, extra: [], width: Math.round(o.W * o.PR), height: Math.round(o.H * o.PR),
                            W: o.W, H: o.H, px: o.PR, time: 0, wind: 0, ground: P(T.segs[T.trunk[0]].a)[1],
                            look: { girth: 1, relief: 0.6, fissures: 0.85, streaks: 0.45, lichen: 0.18, moss: 0, mossHeight: 0.05, wet: 0.1,
                                    rim: 0.5, canopyShade: 0, komorebi: 0, crotch: 0.8, air: o.haze || 0, twigCut: 0 },
                            colours: { bark: bk.bark || [62, 55, 54], dark: bk.dark || [26, 22, 23], light: bk.light || [138, 132, 130],
                                       lichen: bk.lichen || [150, 152, 140], moss: bk.moss || [78, 90, 48] }, light: lt });
      if (g) {
        // nothing of the wood shows below the snow's surface: cut it off at the ground line under the tree (its root
        // flare spreads out below the foot)
        var J = T._join = trunkJoin(T, P, model);
        // (copied once into a picture of its own, so where the bark meets the snow can be found from it: the dark gap
        // between them is drawn only where there is bark, never across bare snow)
        var tmp = document.createElement('canvas'); tmp.width = g.w; tmp.height = g.h;
        // (a graphics-chip canvas on purpose: copying the 3D picture into a main-processor canvas reads back the whole
        // screen-sized picture from the chip; here only this small copy is read, by barkAlong)
        var tc = tmp.getContext('2d'); tc.drawImage(g.cnv, 0, 0, g.w, g.h, 0, 0, g.w, g.h);
        J.bark = barkAlong(tc, g, J, o.PR);
        c.save(); clipAbove(c, J, J.x - J.half * 3, J.x + J.half * 3, box.by - 10);
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.drawImage(tmp, g.x - box.bx * o.PR, g.y - box.by * o.PR);
        c.restore(); done = true;
      }
    } catch (e) { done = false; }
  }
  if (done) return 'trunks.js';
  T._join = trunkJoin(T, P, null);
  // painted: each limb a tapering stroke, lit on the sun's side
  c.lineCap = 'round'; c.lineJoin = 'round';
  T.segs.forEach(function (S) {
    var A = P(S.a), B = P(S.b), s = P.s(S.a[2]), w = Math.max(0.6, (S.ra + S.rb) * s);
    c.strokeStyle = css(K.barkDk); c.lineWidth = w;
    c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(B[0], B[1]); c.stroke();
    c.strokeStyle = css(K.bark, 0.8); c.lineWidth = w * 0.4;
    c.beginPath(); c.moveTo(A[0] + K.lx * w * 0.2, A[1]); c.lineTo(B[0] + K.lx * w * 0.2, B[1]); c.stroke();
  });
  return 'painted';
}

/* how much bark there is just above the snow's line, every half CSS px across (0 … 1); read once from the trunk's picture */
function barkAlong(tc, g, J, PR) {
  var x0 = J.x - J.half * 3, n = Math.ceil(J.half * 12), out = new Float32Array(n + 1), ys = [], y0 = Infinity, y1 = -Infinity, i;
  for (i = 0; i <= n; i++) { var y = Math.round((J.y - J.h(x0 + i * 0.5) - 1.5) * PR - g.y); ys.push(y); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  y0 = clamp(y0, 0, g.h - 1); y1 = clamp(y1, 0, g.h - 1);
  var xa = clamp(Math.floor(x0 * PR - g.x), 0, g.w - 1), xb = clamp(Math.ceil((x0 + n * 0.5) * PR - g.x), 0, g.w - 1);
  if (xb <= xa) return out;
  var D = tc.getImageData(xa, y0, xb - xa + 1, y1 - y0 + 1), W = xb - xa + 1;
  for (i = 0; i <= n; i++) {
    var px = Math.round((x0 + i * 0.5) * PR - g.x) - xa, py = clamp(ys[i], y0, y1) - y0;
    if (px < 0 || px >= W) continue;
    out[i] = D.data[(py * W + px) * 4 + 3] / 255;
  }
  J.bx0 = x0;
  return out;
}
/* the snow's line at the foot of the trunk: banked up over each surface root where it leaves the trunk */
function trunkJoin(T, P, model) {
  var S0 = T.segs[T.trunk[0]], s = P.s(S0.a[2]), half = S0.ra * s, roots = [];
  // the flare's lobes on either side, where the snow banks up a little
  var rr = rng(T.seed * 5 + 1), fx = P(S0.a)[0];
  roots.push([fx - half * lerp(1.6, 1.9, rr()), half * 0.6, half * lerp(0.45, 0.6, rr())], [fx + half * lerp(1.6, 1.9, rr()), half * 0.6, half * lerp(0.45, 0.6, rr())]);
  return snowJoin(S0.a, half, roots, P, T.seed * 7 + 3);
}

/* =====================================================================
   4. BAKING — a little at a time
   ===================================================================== */
function bounds(T, P) {
  var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  function inc(p, m) { var q = P(p); x0 = Math.min(x0, q[0] - m); x1 = Math.max(x1, q[0] + m); y0 = Math.min(y0, q[1] - m); y1 = Math.max(y1, q[1] + m); }
  T.segs.forEach(function (S) { inc(S.a, 4); inc(S.b, 4); });
  T.fol.forEach(function (E) {
    var s = P.s(E.c[2]);
    if (E.kind === 'pad') inc(E.c, (E.rx + 0.3) * s + 4);
    else { inc(E.p0, 4); inc(E.p2, 0.25 * s + 4); inc([E.p2[0], E.p2[1] - E.hang, E.p2[2]], 0.2 * s + 4); inc([E.p1[0], E.p1[1] - E.hang, E.p1[2]], 0.2 * s + 4); }
  });
  T.poles.concat(T.props).forEach(function (B) { inc(B.a, 6); inc(B.b, 0.4 * P.s(B.b[2]) + 6); });
  T.ropes.forEach(function (R) { inc(R.b, 4); });
  return { bx: Math.floor(x0), by: Math.floor(y0), w: Math.ceil(x1 - x0) + 1, h: Math.ceil(y1 - y0) + 1 };
}
function zOf(E) { return E.kind === 'pad' ? E.c[2] : (E.p0[2] + E.p2[2] * 2) / 3; }
function bakeJob(T, o) {
  var P = project(o), K = palette(o), box = bounds(T, P), sup = o.lod && o.cpu && !o.into ? SS : 1, PR = o.PR * sup;
  T.fol.forEach(function (E) { E._sh = null; });
  function layer(cpu) { var cv = document.createElement('canvas'); cv.width = Math.max(1, Math.ceil(box.w * PR)); cv.height = Math.max(1, Math.ceil(box.h * PR)); var c = cv.getContext('2d', cpu ? CPU : undefined); c.setTransform(PR, 0, 0, PR, -box.bx * PR, -box.by * PR); return { cnv: cv, c: c }; }
  // o.into: draw straight onto that context (its own transform: CSS px), with no pictures of its own and no softening
  // (the hill's firs: the hill softens each row at once; copying hundreds of small pictures cost far more than the drawing)
  var M0 = o.into ? o.into.getTransform() : null;
  // (work: drawn here, stroke by stroke; body: the finished tree the scene lays down every frame. There is no 'front'
  // picture any more: nothing was ever drawn on it, yet it was laid down for every tree every frame)
  // (o.cpuBody: the finished tree goes onto another picture being built, not onto the screen: keep it on the main processor too)
  var work = o.into ? { cnv: null, c: o.into } : layer(!!(o.lod && o.cpu)), body = o.into ? null : layer(!!o.cpuBody), c = work.c;
  function setT() { if (M0) c.setTransform(M0); else c.setTransform(PR, 0, 0, PR, -box.bx * PR, -box.by * PR); }
  // Everything in depth order (the farthest first), so whatever is nearer covers it: the foliage, the wood (trunk and
  // limbs, about the trunk's depth), and the ropes, the pole and the props piece by piece (each piece at its own depth).
  // A rope's last stretch, inside the foliage of the branch it is tied to, goes just behind that branch's needles.
  var items = [], R = { box: box, P: P, K: K, loose: [], pads: [], wood: '' };
  function segRect(A, B, w) { return [Math.min(A[0], B[0]) - w, Math.min(A[1], B[1]) - w, Math.max(A[0], B[0]) + w, Math.max(A[1], B[1]) + w]; }
  if (T.core) items.push({ z: -1e6, rects: [], draw: function () { paintCore(c, T, P, K); } });
  T.fol.forEach(function (E) {
    E._s = P.s(E.kind === 'pad' ? E.c[2] : E.p1[2]); E._m = null; E._lod = !!o.lod;
    var Sh = E.kind === 'pad' ? padShape(E, P) : boughShape(E, P), r0;
    if (E.kind === 'pad') r0 = [Sh.C[0] - Sh.hw - 2, Sh.C[1] - Sh.th * 0.7, Sh.C[0] + Sh.hw + 2, Sh.C[1] + Sh.th * 0.5];
    else r0 = [Math.min(Sh.A[0], Sh.B[0]) - 2, Math.min(Sh.A[1], Sh.B[1]) - Sh.up - 2, Math.max(Sh.A[0], Sh.B[0]) + 2, Math.max(Sh.A[1], Sh.B[1]) + Sh.hang];
    items.push({ z: zOf(E), E: E, rects: [r0], draw: function () { paintFol(E); } });
  });
  T.ropes.forEach(function (Rp) {
    var tE = clamp((Rp.a[1] - Rp.enterY) / Math.max(0.01, Rp.a[1] - Rp.b[1]), 0.4, 0.98), cuts = [];
    for (var i = 0; i <= 8; i++) cuts.push(tE * i / 8);
    cuts.push(lerp(tE, 1, 0.5), 1);
    for (var k = 0; k < cuts.length - 1; k++) (function (t0, t1) {
      var zz = t0 >= tE - 1e-6 ? Rp.z - 0.02 : lerp(Rp.a[2], Rp.b[2], (t0 + t1) / 2);
      items.push({ z: zz, rects: [segRect(P(ropePt(Rp, t0)), P(ropePt(Rp, t1)), 2)], draw: function () { paintRopeSeg(c, Rp, t0, t1, P, K); } });
    })(cuts[k], cuts[k + 1]);
  });
  T.poles.concat(T.props).forEach(function (B) {
    var n = 6, isPole = T.poles.indexOf(B) >= 0;
    for (var k = 0; k < n; k++) (function (t0, t1) {
      items.push({ z: lerp(B.a[2], B.b[2], (t0 + t1) / 2), rects: [segRect(P(lerp3(B.a, B.b, t0)), P(lerp3(B.a, B.b, t1)), B.r * P.s(B.b[2]) + 4)], draw: function () {
        if (t0 === 0 && !B.brace) {
          var hw = Math.max(0.8, B.r * P.s(B.a[2])), J = snowJoin(B.a, hw, null, P, T.seed * 11 + (B.a[0] * 100 | 0));
          c.save(); clipAbove(c, J, J.x - hw * 3, J.x + hw * 3, box.by - 10);
          paintBambooSeg(c, B, t0, t1, P, K, isPole ? T.snowK * 0.15 : 0);
          c.restore();
          paintJoin(c, J, hw * 1.7, K);
        } else paintBambooSeg(c, B, t0, t1, P, K, isPole ? T.snowK * 0.15 : 0);
      } });
    })(k / n, (k + 1) / n);
  });
  var woodRects = T.segs.map(function (S) { return segRect(P(S.a), P(S.b), (S.ra + S.rb) * P.s(S.a[2]) + 2); });
  items.push({ z: 0, wood: true, rects: woodRects, draw: function () {
    R.wood = paintWood(c, T, P, o, K, box);
    setT();
    paintLimbSnow(c, T, P, K);
    if (T._join) paintJoin(c, T._join, T._join.half * 2.0, K);
  } });
  items.forEach(function (it, i) { it.n = i; });
  items.sort(function (a, b) { return a.z - b.z || a.n - b.n; });
  // which snow can fall: pieces nothing drawn after them covers on the screen (so the clump can be drawn on its own)
  pickLoose();
  var tasks = items.map(function (it) { return it.draw; });
  tasks.push(function () {
    // laid down a little soft, so no edge is ruler-sharp
    if (body) {
      var bc = body.c; bc.save(); bc.setTransform(1, 0, 0, 1, 0, 0);
      var bl = Math.hypot(o.soft || 0, o.dof || 0) * sup;          // (device px of this picture: twice the size for o.lod)
      if (bl > 0.05) bc.filter = 'blur(' + bl.toFixed(2) + 'px)';
      bc.drawImage(work.cnv, 0, 0); bc.restore();
      work.cnv.width = 1;
    }
    // the loose clumps, each on its own little picture
    R.loose.forEach(function (Lc) { bakeClump(Lc); });
    R.pads = T.fol.map(function (E) {
      var top = E.kind === 'pad' ? E.c[1] + E.ty * 0.45 : Math.max(E.p0[1], E.p2[1]) + 0.05;
      var Sh = E._sh || (E.kind === 'pad' ? padShape(E, P) : boughShape(E, P));
      var sc = E.kind === 'pad' ? { x: Sh.C[0], y: Sh.C[1], rx: Sh.hw, ry: Sh.th * 0.55 } : { x: (Sh.A[0] + Sh.B[0]) / 2, y: (Sh.A[1] + Sh.B[1]) / 2 + Sh.hang * 0.3, rx: Math.abs(Sh.B[0] - Sh.A[0]) / 2 + 2, ry: Sh.hang * 0.6 + 2 };
      return { id: E.id, c: E.kind === 'pad' ? E.c : E.p1, rx: E.rx, rz: E.rz, top: top, z: zOf(E), scr: sc };
    });
  });
  R.body = body ? body.cnv : null;
  var ti = 0;
  return {
    result: R,
    step: function (ms) {
      var t0 = performance.now();
      while (ti < tasks.length) {
        setT();
        tasks[ti++]();
        if (performance.now() - t0 > ms) break;
      }
      return ti >= tasks.length;
    }
  };
  function paintFol(E) { if (E.kind === 'pad') paintPad(c, E, P, K); else paintBough(c, E, P, K); }
  function pickLoose() {
    function hit(a, b) { return a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1]; }
    var pr = rng(T.seed * 31 + 7), share = o.loose === undefined ? 0.5 : o.loose;
    if (share <= 0) return;                         // (none can fall: nothing to find)
    items.forEach(function (it, i) {
      var E = it.E;
      if (!E) return;
      E.pieces.forEach(function (Pc) {
        var Ln = E.kind === 'pad' ? padSnowLines(E, Pc, P) : boughSnowLines(E, Pc, P);
        if (Ln.d < 1.2) return;
        var xs = Ln.Top.map(function (p) { return p[0]; }), ys = Ln.Top.concat(Ln.Bot).map(function (p) { return p[1]; });
        var bb = [Math.min.apply(null, xs) - 2, Math.min.apply(null, ys) - 2, Math.max.apply(null, xs) + 2, Math.max.apply(null, ys) + 2];
        for (var j = i + 1; j < items.length; j++) for (var q = 0; q < items[j].rects.length; q++) if (hit(bb, items[j].rects[q])) return;
        if (pr() > share) return;
        Pc.loose = true;
        var mid = (Pc.u0 + Pc.u1) / 2, half = (Pc.u1 - Pc.u0) / 2;
        var pos = E.kind === 'pad' ? [E.c[0] + E.rx * mid, E.c[1] + E.ty * 0.5, E.c[2]] : lerp3(lerp3(E.p0, E.p1, Math.min(1, mid * 2)), lerp3(E.p1, E.p2, Math.max(0, mid * 2 - 1)), mid);
        var outx = E.kind === 'pad' ? (mid >= 0 ? 1 : -1) : Math.sign(E.p2[0] - E.p0[0]) || 1;
        R.loose.push({ E: E, Pc: Pc, bb: bb, pos: pos, out: [outx, 0, E.kind === 'pad' ? 0 : Math.sign(E.p2[2] - E.p0[2]) * 0.3],
                       mass: Pc.d * (E.kind === 'pad' ? E.rx * half * 2 : E.L * (Pc.u1 - Pc.u0)), pad: E.id, z: zOf(E) });
      });
    });
  }
  function bakeClump(Lc) {
    var bb = Lc.bb, cv = document.createElement('canvas'), m = 2;
    cv.width = Math.max(1, Math.ceil((bb[2] - bb[0] + m * 2) * PR)); cv.height = Math.max(1, Math.ceil((bb[3] - bb[1] + m * 2) * PR));
    var cc = cv.getContext('2d');
    cc.setTransform(PR, 0, 0, PR, -(bb[0] - m) * PR, -(bb[1] - m) * PR);
    var bl2 = Math.hypot(o.soft || 0, o.dof || 0);
    if (bl2 > 0.05) cc.filter = 'blur(' + bl2.toFixed(2) + 'px)';
    if (Lc.E.kind === 'pad') paintPadSnow(cc, Lc.E, Lc.Pc, P, K); else paintBoughSnow(cc, Lc.E, Lc.Pc, P, K);
    Lc.spr = cv; Lc.x = bb[0] - m; Lc.y = bb[1] - m; Lc.w = bb[2] - bb[0] + m * 2; Lc.h = bb[3] - bb[1] + m * 2;
    Lc.sx = P(Lc.pos)[0]; Lc.sy = P(Lc.pos)[1];
  }
}

/* =====================================================================
   5. THE SHADOW ON THE SNOW — the sky's shade under the crown, and the
   sun's shadow cast along the sun's direction (the caller clips it to the
   land and lays it down soft)
   ===================================================================== */
function shadow(c, T, o, part) {
  var P = project(o), L = o.light, eye = P.eye;
  function groundPt(x, z) { return P([x, 0, z]); }
  if (part === 'contact') {
    // under the crown, where the sky is hidden: a soft round shade on the ground (seen in perspective)
    var cx = 0, cz = 0, R = 0, n = 0;
    T.fol.forEach(function (E) { var p = E.kind === 'pad' ? E.c : E.p1; cx += p[0]; cz += p[2]; n++; });
    cx /= n || 1; cz /= n || 1;
    T.fol.forEach(function (E) { var p = E.kind === 'pad' ? E.c : E.p2; R = Math.max(R, Math.hypot(p[0] - cx, p[2] - cz) + (E.rx || 0) * 0.5); });
    R *= 0.85;
    var G = groundPt(cx, cz), s = P.s(cz), ry = R * s * eye / (P.D - cz);
    c.save(); c.translate(G[0], G[1]); c.scale(1, Math.max(0.05, ry / (R * s)));
    var g = c.createRadialGradient(0, 0, 0, 0, 0, R * s);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.6, 'rgba(0,0,0,0.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, R * s, 0, TAU); c.fill();
    c.restore();
    return;
  }
  // the sun's shadow: each part of the tree cast onto the ground along the light (x right, y up, z toward you)
  var Ls = norm(L.sun);
  if (Ls[1] < 0.03) return;
  var kx = -Ls[0] / Ls[1], kz = -Ls[2] / Ls[1], sinE = Ls[1];
  function cast(p) { return [p[0] + kx * p[1], 0, p[2] + kz * p[1]]; }
  c.fillStyle = 'rgba(0,0,0,1)'; c.strokeStyle = 'rgba(0,0,0,1)'; c.lineCap = 'round';
  // the shadow of a round thing of radius r: an ellipse on the ground, stretched along the sun's way by 1 / sin(elevation)
  var ax = [-Ls[0], -Ls[2]], al = Math.hypot(ax[0], ax[1]) || 1; ax = [ax[0] / al, ax[1] / al];
  function blob(p, rx, rz) {
    var g = cast(p), k = Math.min(4, 1 / sinE), pts = [];
    for (var i = 0; i < 16; i++) {
      var a = i / 16 * TAU, u = Math.cos(a) * k, w = Math.sin(a), r = (rx + rz) / 2;
      pts.push(P([g[0] + (ax[0] * u - ax[1] * w) * r, 0, g[2] + (ax[1] * u + ax[0] * w) * r]));
    }
    c.beginPath(); pts.forEach(function (q, i) { if (i) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); }); c.closePath(); c.fill();
  }
  T.fol.forEach(function (E) {
    if (E.kind === 'pad') blob(E.c, E.rx * 0.85, E.rz * 0.85);
    else { blob(lerp3(E.p1, E.p2, 0.3), E.L * 0.35, E.L * 0.35); }
  });
  T.segs.forEach(function (S) {
    var A = P(cast(S.a)), B = P(cast(S.b)), s = P.s(cast(S.a)[2]);
    c.lineWidth = Math.max(0.6, (S.ra + S.rb) * s * 0.6);
    c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(B[0], B[1]); c.stroke();
  });
  T.poles.concat(T.props).forEach(function (B) {
    var A = P(cast(B.a)), Z = P(cast(B.b));
    c.lineWidth = Math.max(0.5, B.r * 2 * P.s(B.b[2]) * 0.5);
    c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(Z[0], Z[1]); c.stroke();
  });
}

/* =====================================================================
   6. THE SNOW FALLING OFF — in metres, through the tree's own camera
   ===================================================================== */
var G_ACC = 9.81;
function anim(R) { return { R: R, P: R.P, rest: R.loose.map(function () { return { state: 'rest', a: 1, back: 0 }; }), bits: [], puffs: [], t: 0 }; }
function shed(A, i, delay) {
  var S = A.rest[i];
  if (!S || S.state !== 'rest' || S.a < 0.99) return false;
  S.state = 'wait'; S.t = -(delay || 0); S.slip = lerp(0.35, 0.75, Math.random()); S.ang = 0;
  return true;
}
function update(A, dt, wind, back) {
  A.t += dt;
  var R = A.R, P = A.P;
  for (var i = 0; i < A.rest.length; i++) {
    var S = A.rest[i], Lc = R.loose[i];
    if (S.state === 'gone') {
      if (back > 0) { S.back += dt; if (S.back > back) { S.state = 'rest'; S.a = 0; S.back = 0; } }
      continue;
    }
    if (S.state === 'rest') { if (S.a < 1) S.a = Math.min(1, S.a + dt / 8); continue; }      // snow settling back, slowly
    S.t += dt;
    if (S.state === 'wait') { if (S.t >= 0) { S.state = 'slip'; S.t = 0; } continue; }
    if (S.state === 'slip') {
      // it creeps out over the edge, tipping, faster and faster
      var u = S.t / S.slip;
      S.off = 0.12 * u * u; S.ang = 0.35 * u * u;
      if (u >= 1) {
        S.state = 'gone'; S.back = 0;
        var p = add(Lc.pos, [Lc.out[0] * 0.12, -0.036, Lc.out[2] * 0.12]), n = clamp(Math.round(2 + Lc.mass * 40), 2, 9);
        // the clump goes as one piece first, then breaks
        A.bits.push({ p: p, v: [Lc.out[0] * 0.35, 0, Lc.out[2] * 0.35], r: Math.sqrt(Lc.mass) * 0.9, big: true, spr: Lc, ang: S.ang, spin: Lc.out[0] * 1.2,
                      breakAt: Lc.pos[1] - lerp(0.25, 0.6, Math.random()), hits: {}, src: Lc.pad, n: n, life: 0, z: Lc.z });
        A.puffs.push(puff(Lc.pos, 0.18, 0.35));
      }
    }
  }
  // the falling pieces
  for (var b = A.bits.length - 1; b >= 0; b--) {
    var Bt = A.bits[b];
    Bt.life += dt;
    if (Bt.landed) { Bt.fade -= dt; if (Bt.fade <= 0) A.bits.splice(b, 1); continue; }
    var drag = Bt.big ? 0.15 : 1.4 / Math.max(0.03, Bt.r * 10);
    Bt.v[1] -= G_ACC * dt;
    Bt.v[1] -= Bt.v[1] * Math.min(1, drag * dt);
    Bt.v[0] += (wind * 0.4 - Bt.v[0]) * Math.min(1, drag * 0.5 * dt);
    var py = Bt.p[1];
    Bt.p = add(Bt.p, scl(Bt.v, dt));
    if (Bt.big) Bt.ang += Bt.spin * dt;
    // through a pad below: it strikes it and breaks, a puff of powder flies up
    for (var k = 0; k < R.pads.length; k++) {
      var Pd = R.pads[k];
      if (Pd.id === Bt.src || Bt.hits[Pd.id]) continue;
      if (py > Pd.top && Bt.p[1] <= Pd.top) {
        var q = Math.pow((Bt.p[0] - Pd.c[0]) / Pd.rx, 2) + Math.pow((Bt.p[2] - Pd.c[2]) / Pd.rz, 2);
        if (q < 1) {
          Bt.hits[Pd.id] = 1;
          A.puffs.push(puff([Bt.p[0], Pd.top, Bt.p[2]], 0.2 + Bt.r * 0.8, 0.5));
          if (Bt.big) { breakUp(A, Bt, b); Bt = null; }
          else { Bt.v[1] *= -0.15; Bt.v[0] += (Math.random() - 0.5) * 0.8; Bt.r *= 0.7; }
          // the blow may shake that pad's own snow off
          if (Math.random() < 0.35) for (var j = 0; j < R.loose.length; j++) if (R.loose[j].pad === Pd.id) shed(A, j, lerp(0.05, 0.25, Math.random()));
          break;
        }
      }
    }
    if (!Bt) continue;
    if (Bt.big && Bt.p[1] < Bt.breakAt) { breakUp(A, Bt, b); continue; }
    if (Bt.p[1] <= 0) {
      Bt.p[1] = 0; Bt.landed = true; Bt.fade = 1.2;
      if (Bt.r > 0.04) A.puffs.push(puff(Bt.p, 0.15 + Bt.r, 0.3));
    }
  }
  for (var f = A.puffs.length - 1; f >= 0; f--) {
    var Pf = A.puffs[f];
    Pf.age += dt;
    if (Pf.age > Pf.life) { A.puffs.splice(f, 1); continue; }
    Pf.p[0] += wind * 0.6 * dt; Pf.p[1] = Math.max(0.05, Pf.p[1] - 0.25 * dt);
    Pf.r += dt * 0.35;
  }
}
function puff(p, r, a) { return { p: p.slice(), r: r, a: a, age: 0, life: lerp(1.6, 2.6, Math.random()) }; }
function breakUp(A, Bt, b) {
  A.bits.splice(b, 1);
  var n = Bt.n;
  for (var i = 0; i < n; i++) {
    A.bits.push({ p: [Bt.p[0] + (Math.random() - 0.5) * Bt.r, Bt.p[1] + (Math.random() - 0.5) * Bt.r * 0.5, Bt.p[2] + (Math.random() - 0.5) * Bt.r],
                  v: [Bt.v[0] + (Math.random() - 0.5) * 0.9, Bt.v[1] * lerp(0.5, 0.9, Math.random()), Bt.v[2] + (Math.random() - 0.5) * 0.5],
                  r: Bt.r * lerp(0.18, 0.4, Math.random()), big: false, hits: Bt.hits, src: Bt.src, life: 0, z: Bt.z });
  }
  A.puffs.push(puff(Bt.p, Bt.r * 1.2 + 0.15, 0.45));
}
/* is a point (screen) inside a pad nearer to you than depth z? (then the falling snow there is behind it) */
function hidden(A, x, y, z) {
  var Pd = A.R.pads;
  for (var k = 0; k < Pd.length; k++) {
    var s = Pd[k].scr;
    if (Pd[k].z <= z + 0.05) continue;
    var dx = (x - s.x) / s.rx, dy = (y - s.y) / s.ry;
    if (dx * dx + dy * dy < 0.8) return true;
  }
  return false;
}
function drawRest(c, A) {
  var R = A.R;
  for (var i = 0; i < R.loose.length; i++) {
    var S = A.rest[i], Lc = R.loose[i];
    if (!Lc.spr || S.state === 'gone') continue;
    var a = S.state === 'rest' ? S.a : 1;
    if (a <= 0.01) continue;
    c.globalAlpha = a;
    if (S.state === 'slip') {
      var s = A.P.s(Lc.pos[2]), px = Lc.sx + Lc.out[0] * S.off * s, piv = [Lc.sx, Lc.sy];
      c.save(); c.translate(piv[0] + (px - Lc.sx), piv[1] + S.off * s * 0.3); c.rotate(S.ang * Lc.out[0]); c.translate(-piv[0], -piv[1]);
      c.drawImage(Lc.spr, Lc.x, Lc.y, Lc.w, Lc.h); c.restore();
    } else c.drawImage(Lc.spr, Lc.x, Lc.y, Lc.w, Lc.h);
  }
  c.globalAlpha = 1;
}
function drawFalling(c, A, K, powder) {
  var P = A.P;
  for (var i = 0; i < A.puffs.length; i++) {
    var Pf = A.puffs[i], q = P(Pf.p), s = P.s(Pf.p[2]), k = Pf.age / Pf.life, a = Pf.a * (k < 0.15 ? k / 0.15 : 1 - Math.pow((k - 0.15) / 0.85, 1.4));
    if (a <= 0.01) continue;
    c.globalAlpha = a;
    var r = Math.max(1, Pf.r * s);
    c.drawImage(powder, q[0] - r, q[1] - r * 0.8, r * 2, r * 1.6);
  }
  c.globalAlpha = 1;
  for (var b = 0; b < A.bits.length; b++) {
    var Bt = A.bits[b], q2 = P(Bt.p), s2 = P.s(Bt.p[2]);
    if (hidden(A, q2[0], q2[1], Bt.z)) continue;
    var a2 = Bt.landed ? clamp(Bt.fade / 1.2, 0, 1) : 1;
    if (Bt.big && Bt.spr && Bt.spr.spr) {
      var Lc = Bt.spr, dx = q2[0] - Lc.sx, dy = q2[1] - Lc.sy;
      c.save(); c.globalAlpha = a2; c.translate(Lc.sx + dx, Lc.sy + dy); c.rotate(Bt.ang * (Lc.out[0] || 1)); c.translate(-Lc.sx, -Lc.sy);
      c.drawImage(Lc.spr, Lc.x, Lc.y, Lc.w, Lc.h); c.restore();
      continue;
    }
    var rr = Math.max(0.5, Bt.r * s2);
    c.globalAlpha = a2;
    c.fillStyle = css(K.snowFront); c.beginPath(); c.ellipse(q2[0], q2[1] + rr * 0.15, rr, rr * 0.8, 0, 0, TAU); c.fill();
    c.fillStyle = css(K.snowTop); c.beginPath(); c.ellipse(q2[0] + K.lx * rr * 0.15, q2[1] - rr * 0.15, rr * 0.7, rr * 0.55, 0, 0, TAU); c.fill();
  }
  c.globalAlpha = 1;
}
function busy(A) { if (A.bits.length || A.puffs.length) return true; for (var i = 0; i < A.rest.length; i++) if (A.rest[i].state === 'wait' || A.rest[i].state === 'slip') return true; return false; }

return { build: build, project: project, bakeJob: bakeJob, shadow: shadow, anim: anim, shed: shed, update: update,
         drawRest: drawRest, drawFalling: drawFalling, busy: busy, palette: palette };
})();
