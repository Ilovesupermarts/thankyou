/* ============================================================
   TORII — one vermilion torii gate in the snow, built in 3D and lit,
   for the winter scene. Drawn once (baked) by the scene.

   The gate is the same build as the autumn gates (section 8c of
   app.js): round pillars leaning in a little with black feet, the tie
   beam (nuki) through them, the short post in the middle, and the two
   upper beams (shimaki and kasagi) curving up toward their ends. Every
   piece is a small solid with faces; each face is lit by the sun and the
   sky from its own direction, so the pillars are round (bright on the
   sunny side, cool on the other) and the beams have a lit top and a
   shaded underside. The faces are drawn from the furthest to the
   nearest. Then the snow: heaped along the top beam and the tie beam
   (bright on top, blue underneath, with lumps hanging over the front
   edge), icicles under the beams, and drifts round the feet.

   Use:
     Torii.draw(ctx, o)    // draws it; returns { top, left, right } (CSS px)
     Torii.top(o)          // how high it reaches (CSS px), without drawing
   o (CSS px; ctx is set up for CSS px):
     x, y          the middle of the gate at its foot
     h             its height (px)
     yaw           degrees it is turned (0 = square on to you)
     view          0 … 1: how much from above you see it (small)
     sunDir        [x, y, z] toward the sun (x right, y up, z toward you)
     sunColour, skyColour  [r, g, b] 0 … 1.5 (the light's colour and strength)
     ambient
     colours       { vermilion, top, feet, snow } [r, g, b] 0 … 255
     haze, hazeColour   how much it fades into the mist, and its colour
     snow          0 … 2: how much snow lies on it
     icicles       0 … 1
     width, pillar, lean, overhang, sori, nukiAt, feet   its proportions
                   (as TORII in app.js; heights are fractions of h)
     seed
   ============================================================ */
var Torii = (function () {
'use strict';

var PI = Math.PI, TAU = PI * 2;
function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
function d(o, k, v) { return o[k] === undefined ? v : o[k]; }
function rng(seed) {
  var a = seed >>> 0;
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
         Math.round(clamp(c[2], 0, 255)) + ',' + (a === undefined ? 1 : a) + ')';
}
function mix(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }

/* The pieces of the gate, height 1: faces of 3D points (x across, y up, z toward you) and their tone. */
function pieces(o) {
  var half = d(o, 'width', 0.57) / 2, r = d(o, 'pillar', 0.068) / 2;
  var kt = 0.065, st = 0.05, sori = d(o, 'sori', 0.038), oh = d(o, 'overhang', 0.23);
  var kTop = 1 - sori, kBot = kTop - kt, pTop = kBot - st;
  var lean = Math.tan(d(o, 'lean', 1.8) * PI / 180) * pTop;
  var feetH = d(o, 'feet', 0.125), nukiY = d(o, 'nukiAt', 0.69), nt = 0.05;
  var facets = 16, segs = 12, out = [];
  function pillarAt(y) { return half - lean * (y / pTop); }
  function prism(side, y0, y1, r0, r1, tone) {
    var c0 = side * pillarAt(y0), c1 = side * pillarAt(y1);
    for (var i = 0; i < facets; i++) {
      var a0 = i / facets * TAU, a1 = (i + 1) / facets * TAU;
      out.push({ tone: tone, p: [[c0 + Math.cos(a0) * r0, y0, Math.sin(a0) * r0], [c0 + Math.cos(a1) * r0, y0, Math.sin(a1) * r0],
                                 [c1 + Math.cos(a1) * r1, y1, Math.sin(a1) * r1], [c1 + Math.cos(a0) * r1, y1, Math.sin(a0) * r1]],
                 n: [Math.cos((a0 + a1) / 2), 0, Math.sin((a0 + a1) / 2)] });
    }
  }
  function beam(u0, u1, yb, yt, dd, topTone, n) {
    for (var k = 0; k < n; k++) {
      var a = lerp(u0, u1, k / n), b = lerp(u0, u1, (k + 1) / n);
      var q = [[a, yb(a), -dd], [b, yb(b), -dd], [b, yt(b), -dd], [a, yt(a), -dd],
               [a, yb(a), dd], [b, yb(b), dd], [b, yt(b), dd], [a, yt(a), dd]];
      out.push({ tone: 'v', p: [q[4], q[5], q[6], q[7]] });            // the face toward you
      out.push({ tone: 'v', p: [q[0], q[3], q[2], q[1]] });            // the far face
      out.push({ tone: topTone, p: [q[3], q[7], q[6], q[2]] });        // the top
      out.push({ tone: 'v', p: [q[0], q[1], q[5], q[4]] });            // the underside
      if (k === 0) out.push({ tone: 'v', p: [q[0], q[4], q[7], q[3]] });
      if (k === n - 1) out.push({ tone: 'v', p: [q[1], q[2], q[6], q[5]] });
    }
  }
  [-1, 1].forEach(function (side) {
    if (feetH > 0.001) prism(side, 0, feetH, r * 1.16, r * 1.12, 'f');
    prism(side, feetH, pTop, r, r * 0.94, 'v');
  });
  var nL = pillarAt(nukiY) + r + 0.1, pin = pillarAt(nukiY), nd = r * 0.62;
  function nb() { return nukiY - nt / 2; }
  function ntp() { return nukiY + nt / 2; }
  beam(-nL, -pin - r * 0.9, nb, ntp, nd, 'v', 1);
  beam(-pin + r * 0.9, pin - r * 0.9, nb, ntp, nd, 'v', 6);
  beam(pin + r * 0.9, nL, nb, ntp, nd, 'v', 1);
  beam(-0.035, 0.035, ntp, function () { return pTop; }, r * 0.55, 'v', 1);   // the short post
  var sL = pillarAt(pTop) + oh * 0.82, kL = pillarAt(pTop) + oh;
  function curve(L, amt) { return function (u) { var x = Math.abs(u) / L; return amt * x * x * (0.6 + 0.4 * x); }; }
  var cs = curve(sL, sori * 0.55), ck = curve(kL, sori);
  beam(-sL, sL, function (u) { return pTop + cs(u); }, function (u) { return kBot + cs(u); }, r * 0.9, 'v', segs);
  beam(-kL, kL, function (u) { return kBot + ck(u); }, function (u) { return kTop + ck(u); }, r * 1.25, 't', segs);
  return { faces: out, kL: kL, kTop: kTop, kBot: kBot, ck: ck, kd: r * 1.25, sL: sL, sBot: pTop, cs: cs, sd: r * 0.9,
           nL: nL, pin: pin, pr: r, nukiTop: nukiY + nt / 2, nukiBot: nukiY - nt / 2, nd: nd, pillarAt: pillarAt, feetH: feetH };
}

function top(o) { return o.y - o.h * (1 + 0.09 * d(o, 'snow', 1) + 0.05); }

function draw(c, o) {
  var h = o.h, P = pieces(o), r = rng(d(o, 'seed', 1) * 977 + 3);
  var yaw = d(o, 'yaw', 0) * PI / 180, ca = Math.cos(yaw), sa = Math.sin(yaw);
  var Dc = 7, camY = 0.36 + d(o, 'view', 0.15) * 1.5;               // the camera: 7 gate heights away, about eye height
  function proj(p) {
    var X = p[0] * ca + p[2] * sa, Z = -p[0] * sa + p[2] * ca, Y = p[1];
    var k = Dc / (Dc - Z);
    return [o.x + X * k * h, o.y - ((Y - camY) * k + camY) * h, Dc - Z];
  }
  function rot(n) { return [n[0] * ca + n[2] * sa, n[1], -n[0] * sa + n[2] * ca]; }
  var L = d(o, 'sunDir', [-0.8, 0.4, 0.3]), sun = d(o, 'sunColour', [1, 0.97, 0.92]), sky = d(o, 'skyColour', [0.7, 0.78, 0.92]);
  var amb = d(o, 'ambient', 0.9), haze = d(o, 'haze', 0), hc = d(o, 'hazeColour', [246, 238, 232]);
  var C = o.colours || {}, ver = C.vermilion || [228, 70, 42], tp = C.top || [60, 36, 34], ft = C.feet || [42, 34, 32];
  var snowC = C.snow || [252, 251, 250];
  function lit(base, n, ao) {
    var dl = Math.max(0, n[0] * L[0] + n[1] * L[1] + n[2] * L[2]);
    var sk = (0.6 + 0.4 * n[1]) * amb * (ao || 1);
    var col = [base[0] * (sun[0] * dl + sky[0] * sk), base[1] * (sun[1] * dl + sky[1] * sk), base[2] * (sun[2] * dl + sky[2] * sk)];
    return mix(col, hc, haze);
  }
  // the solid faces, furthest first
  var F = [];
  P.faces.forEach(function (f) {
    var pts = f.p.map(proj), n;
    if (f.n) n = rot(f.n);
    else {                                                  // Newell's normal
      var nx = 0, ny = 0, nz = 0;
      for (var i = 0; i < f.p.length; i++) {
        var a = f.p[i], b = f.p[(i + 1) % f.p.length];
        nx += (a[1] - b[1]) * (a[2] + b[2]); ny += (a[2] - b[2]) * (a[0] + b[0]); nz += (a[0] - b[0]) * (a[1] + b[1]);
      }
      var l = Math.hypot(nx, ny, nz) || 1; n = rot([nx / l, ny / l, nz / l]);
    }
    var cx = 0, cy = 0, cz = 0;
    f.p.forEach(function (p) { cx += p[0]; cy += p[1]; cz += p[2]; });
    cx /= f.p.length; cy /= f.p.length; cz /= f.p.length;
    var cp = proj([cx, cy, cz]);
    // facing the camera?
    var vx = -(cx * ca + cz * sa), vy = camY - cy, vz = Dc - (-cx * sa + cz * ca);
    if (n[0] * vx + n[1] * vy + n[2] * vz <= 0) return;
    var ao = f.tone === 'v' && cy < P.feetH * 2.2 ? lerp(0.7, 1, cy / (P.feetH * 2.2)) : 1;   // a little darker at the foot, where the snow is
    var base = f.tone === 't' ? tp : f.tone === 'f' ? ft : ver;
    F.push({ pts: pts, z: cp[2], col: rgb(lit(base, n, ao)) });
  });
  F.sort(function (a, b) { return b.z - a.z; });
  c.lineJoin = 'round';
  F.forEach(function (f) {
    c.beginPath();
    f.pts.forEach(function (p, i) { if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); });
    c.closePath();
    c.fillStyle = f.col; c.fill();
    c.strokeStyle = f.col; c.lineWidth = 0.6; c.stroke();          // no seams between the faces
  });

  // --- the snow
  var sAmt = d(o, 'snow', 1), ic = d(o, 'icicles', 0.5);
  var snowLit = lit(snowC, [L[0] * 0.3, 1, 0.2], 1), snowTop = lit(snowC, [0, 1, 0], 1);
  var snowFront = lit(snowC, [0, 0.35, 0.94], 0.95), snowUnder = lit(snowC, [0, -0.3, 0.95], 0.75);
  var minY = Infinity, minX = Infinity, maxX = -Infinity;
  // a heap along a beam: its front top edge from u0 to u1 at height yt(u), depth dd, heaped hgt high.
  // Its top is lumpy and its front edge one continuous lip that droops over the beam here and there,
  // with a soft shade under the overhang and a fine grain over all of it.
  function heap(u0, u1, yt, dd, hgt) {
    if (hgt <= 0.001) return;
    var n = 48, crest = [], lip = [], i, H0 = hgt * h;
    var p1 = r() * TAU, p2 = r() * TAU, p3 = r() * TAU, p4 = r() * TAU;
    for (i = 0; i <= n; i++) {
      var u = lerp(u0, u1, i / n), s = i / n, env = Math.pow(Math.sin(PI * lerp(0.02, 0.98, s)), 0.45);
      var lump = 1 + 0.16 * Math.sin(s * 13 + p1) + 0.1 * Math.sin(s * 37 + p2) + (r() - 0.5) * 0.08;
      var droop = Math.max(0, 0.45 * Math.sin(s * 21 + p3) + 0.3 * Math.sin(s * 8 + p4) + 0.15);
      droop = Math.pow(droop, 1.4) * Math.pow(env, 2);
      var y = yt(u), f = proj([u, y, dd * 1.12]);
      crest.push(proj([u, y + hgt * env * lump, dd * 0.15]));
      lip.push([f[0], f[1] + H0 * (0.08 + 0.55 * droop) * (0.6 + 0.4 * env)]);
    }
    function body() {
      c.beginPath();
      c.moveTo(lip[0][0], lip[0][1]);
      for (i = 0; i <= n; i++) c.lineTo(crest[i][0], crest[i][1]);
      c.lineTo(lip[n][0], lip[n][1]);
      for (i = n - 1; i > 0; i--) c.quadraticCurveTo(lip[i][0], lip[i][1], (lip[i][0] + lip[i - 1][0]) / 2, (lip[i][1] + lip[i - 1][1]) / 2);
      c.closePath();
    }
    var y0 = Math.min.apply(null, crest.map(function (q) { return q[1]; })), y1 = Math.max.apply(null, lip.map(function (q) { return q[1]; }));
    body();
    var g = c.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, rgb(snowTop)); g.addColorStop(0.4, rgb(snowLit)); g.addColorStop(0.78, rgb(snowFront)); g.addColorStop(1, rgb(mix(snowFront, snowUnder, 0.6)));
    c.fillStyle = g; c.fill();
    c.save(); body(); c.clip();
    // the side away from the sun is cooler
    var lx = L[0] < 0 ? 1 : -1, x0 = lip[0][0], x1 = lip[n][0];
    var sg = c.createLinearGradient(lx > 0 ? x0 : x1, 0, lx > 0 ? x1 : x0, 0);
    sg.addColorStop(0, rgb(snowUnder, 0)); sg.addColorStop(0.6, rgb(snowUnder, 0)); sg.addColorStop(1, rgb(snowUnder, 0.3));
    c.fillStyle = sg; c.fillRect(x0 - 20, y0 - 20, x1 - x0 + 40, y1 - y0 + 40);
    // a soft shade along the underside of the overhang, deeper where it droops most
    c.filter = 'blur(' + Math.max(0.6, H0 * 0.12).toFixed(1) + 'px)';
    c.strokeStyle = rgb(snowUnder, 0.55); c.lineWidth = Math.max(1, H0 * 0.32); c.lineJoin = 'round'; c.lineCap = 'round';
    c.beginPath(); c.moveTo(lip[0][0], lip[0][1]);
    for (i = 1; i <= n; i++) c.lineTo(lip[i][0], lip[i][1]);
    c.stroke();
    // and a faint bright rim along the top where the light catches it
    c.strokeStyle = rgb(mix(snowTop, [255, 255, 255], 0.4), 0.5); c.lineWidth = Math.max(0.6, H0 * 0.1);
    c.beginPath(); c.moveTo(crest[0][0], crest[0][1] + H0 * 0.06);
    for (i = 1; i <= n; i++) c.lineTo(crest[i][0], crest[i][1] + H0 * 0.06);
    c.stroke();
    c.filter = 'none';
    // the grain: a few tiny, faint bright and cool flecks
    var nF = Math.round((x1 - x0) * Math.max(0.3, H0 * 0.04));
    for (i = 0; i < nF; i++) {
      var k = Math.floor(r() * n), q = r(), fx = lerp(crest[k][0], lip[k][0], q), fy = lerp(crest[k][1], lip[k][1], q);
      var bright = r() < 0.55;
      c.fillStyle = bright ? 'rgba(255,255,255,' + lerp(0.1, 0.25, r()).toFixed(2) + ')' : rgb(snowUnder, lerp(0.05, 0.12, r()));
      c.beginPath(); c.arc(fx + (r() - 0.5) * 2, fy, Math.max(0.25, H0 * lerp(0.008, 0.022, r())), 0, TAU); c.fill();
    }
    c.restore();
    crest.forEach(function (q) { minY = Math.min(minY, q[1]); minX = Math.min(minX, q[0]); maxX = Math.max(maxX, q[0]); });
  }
  // icicles under a beam's front lower edge
  function icicles(u0, u1, yb, dd, amt, maxLen) {
    if (amt <= 0) return;
    var n = Math.round(lerp(4, 26, amt) * (u1 - u0) / 0.8);
    for (var i = 0; i < n; i++) {
      var u = lerp(u0, u1, (i + 0.2 + r() * 0.6) / n);
      if (r() > 0.4 + 0.6 * amt) continue;
      var p = proj([u, yb(u), dd]), len = maxLen * h * Math.pow(r(), 1.8) * lerp(0.4, 1, amt), w = Math.max(0.5, len * 0.12);
      if (len < 1.2) continue;
      var g = c.createLinearGradient(p[0] - w, 0, p[0] + w, 0);
      g.addColorStop(0, rgb(mix(snowUnder, [255, 255, 255], 0.2), 0.85)); g.addColorStop(0.4, rgb(mix(snowLit, [255, 255, 255], 0.5), 0.95));
      g.addColorStop(1, rgb(mix(snowUnder, [150, 170, 210], 0.25), 0.8));
      c.fillStyle = g;
      c.beginPath(); c.moveTo(p[0] - w, p[1] - 0.5); c.lineTo(p[0] + w, p[1] - 0.5); c.lineTo(p[0] + w * 0.1, p[1] + len); c.closePath(); c.fill();
    }
  }
  icicles(-P.sL * 0.95, P.sL * 0.95, function (u) { return P.sBot + P.cs(u); }, P.sd, ic, 0.07);
  icicles(-P.nL * 0.95, P.nL * 0.95, function () { return P.nukiBot; }, P.nd, ic * 0.7, 0.05);
  heap(-P.kL * 1.02, P.kL * 1.02, function (u) { return P.kTop + P.ck(u); }, P.kd, 0.075 * sAmt);
  var nyt = function () { return P.nukiTop; };
  heap(-P.nL, -P.pin - P.pr * 1.05, nyt, P.nd, 0.035 * sAmt);
  heap(-P.pin + P.pr * 1.05, -0.04, nyt, P.nd, 0.04 * sAmt);
  heap(0.04, P.pin - P.pr * 1.05, nyt, P.nd, 0.04 * sAmt);
  heap(P.pin + P.pr * 1.05, P.nL, nyt, P.nd, 0.035 * sAmt);
  // drifts banked round the feet
  [-1, 1].forEach(function (side) {
    var p = proj([side * P.pillarAt(0), 0, 0.02]), rw = P.pr * h * lerp(2.2, 3, r()) * (0.6 + 0.4 * sAmt), rh = P.pr * h * 0.9 * (0.5 + 0.5 * sAmt);
    var g = c.createLinearGradient(0, p[1] - rh, 0, p[1] + rh * 0.4);
    g.addColorStop(0, rgb(snowTop)); g.addColorStop(1, rgb(snowFront));
    c.fillStyle = g;
    c.beginPath(); c.ellipse(p[0], p[1] + rh * 0.15, rw, rh, 0, PI, TAU); c.closePath(); c.fill();
  });
  return { top: Math.min(minY, o.y - h), left: Math.min(minX, o.x - h * 0.6), right: Math.max(maxX, o.x + h * 0.6) };
}

return { draw: draw, top: top };
})();
