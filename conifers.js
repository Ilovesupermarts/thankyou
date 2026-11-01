/* ============================================================
   CONIFERS — trees in the snow for the winter scene: snow-laden firs
   and bare trees white with hoarfrost. Drawn once (baked) by the scene.

   A fir is built branch by branch, as a real one is: tiers of branches
   round the trunk, longest at the bottom. Each branch reaches out and
   droops under its load: a skirt of dark needles hanging from it with a
   ragged hem, and a pillow of snow lying along its top, thick near the
   trunk and thinning toward the tip, lumps hanging over its edge. The
   sun lights the side of the tree turned to it (warm on the snow, the
   needles a little greener); the other side is in the tree's own shade,
   and the snow there is blue. Upper tiers hang over the snow on the
   tiers below, so the tree has depth. A cap of snow on the top, and a
   hollow round the foot (the tree well).

   A frosted tree is a bare tree that branches, bends and thins to fine
   twigs, every twig thick with white rime on the side the wind came
   from, the finest tips a soft white haze.

   Use:
     Conifers.fir(ctx, o)      // returns the top (CSS px)
     Conifers.frost(ctx, o)    // returns the top (CSS px)
   o (CSS px):
     x, y          the foot of the trunk
     h             height (px)
     seed
     sunDir        [x, y, z] toward the sun (x right, y up, z toward you)
     sunColour, skyColour  [r, g, b] 0 … 1.5
     ambient
     haze, hazeColour
     fir:   colours { needle, trunk, snow }, snow (0 … 2), droop (0 … 2),
            fullness (0 … 1: how many tiers), width (0.5 … 1.5)
     frost: colours { bark, rime }, rime (0 … 2), spread (0.5 … 1.5),
            twigs (0 … 1: how finely it branches)
   ============================================================ */
var Conifers = (function () {
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
/* A shader for one tree: a colour lit from the direction n (x right, y up, z toward you). */
function shader(o) {
  var L = d(o, 'sunDir', [-0.8, 0.4, 0.3]), sun = d(o, 'sunColour', [1, 0.97, 0.92]), sky = d(o, 'skyColour', [0.7, 0.78, 0.92]);
  var amb = d(o, 'ambient', 0.9), haze = d(o, 'haze', 0), hc = d(o, 'hazeColour', [246, 238, 232]);
  return function (base, nx, ny, nz, occ) {
    var l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    var dl = Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]) * (occ === undefined ? 1 : occ);
    var sk = (0.6 + 0.4 * ny) * amb * (occ === undefined ? 1 : lerp(0.7, 1, occ));
    var col = [base[0] * (sun[0] * dl + sky[0] * sk), base[1] * (sun[1] * dl + sky[1] * sk), base[2] * (sun[2] * dl + sky[2] * sk)];
    return mix(col, hc, haze);
  };
}

/* ---------- the fir ---------- */
function fir(c, o) {
  var r = rng(d(o, 'seed', 1)), h = o.h, x = o.x, yb = o.y, S = shader(o), L = d(o, 'sunDir', [-0.8, 0.4, 0.3]);
  var C = o.colours || {}, needle = C.needle || [52, 74, 62], trunk = C.trunk || [60, 46, 42], snowC = C.snow || [252, 251, 250];
  var load = d(o, 'snow', 1), droop = d(o, 'droop', 1), full = d(o, 'fullness', 0.6), wk = d(o, 'width', 1);
  var sunSide = L[0] < 0 ? -1 : 1;                              // the side the sun is on
  var wMax = h * 0.3 * wk, tiers = Math.round(lerp(9, 17, full));
  // the trunk, mostly hidden
  c.fillStyle = rgb(S(trunk, sunSide * 0.3, 0.1, 1, 0.5));
  c.beginPath(); c.moveTo(x - h * 0.016, yb); c.lineTo(x + h * 0.016, yb); c.lineTo(x + h * 0.003, yb - h); c.lineTo(x - h * 0.003, yb - h); c.closePath(); c.fill();
  // the tree well: a soft blue hollow round the foot
  var wg = c.createRadialGradient(x, yb, 0, x, yb, wMax * 1.2);
  wg.addColorStop(0, rgb(S(snowC, 0, 0.6, 0.6, 0.25), 0.6)); wg.addColorStop(1, rgb(S(snowC, 0, 0.6, 0.6, 0.25), 0));
  c.fillStyle = wg;
  c.beginPath(); c.ellipse(x, yb, wMax * 1.2, h * 0.04, 0, 0, TAU); c.fill();
  // one branch: from the trunk at (x, y) out to side s (-1 / 1), length len; k: 0 behind … 1 in front
  function branch(y, s, len, k, tierT) {
    var sag = len * (0.18 + 0.22 * droop) * lerp(0.7, 1.2, r());
    var n = 9, top = [], i;
    for (i = 0; i <= n; i++) {
      var u = i / n;
      top.push([x + s * len * u, y - len * 0.06 * Math.sin(PI * u * 0.8) + sag * u * u]);
    }
    var thick = len * lerp(0.36, 0.5, r()) * (0.7 + 0.3 * tierT);
    var lit = s === sunSide;                                     // this branch is on the sunny side
    var occ = lit ? lerp(0.75, 1, k) : lerp(0.1, 0.3, k);        // how much sun reaches its needles
    var nc = S(needle, s * 0.6, 0.15, 0.7, occ);
    // the needles hanging from it, the hem ragged
    c.fillStyle = rgb(nc);
    c.beginPath(); c.moveTo(top[0][0], top[0][1]);
    for (i = 1; i <= n; i++) c.lineTo(top[i][0], top[i][1]);
    var hem = 3 + Math.round(len / (h * 0.025));
    for (i = hem; i >= 0; i--) {
      var u2 = i / hem, bx = x + s * len * u2 * 1.02, by = top[Math.round(u2 * n)][1] + thick * (1 - u2 * 0.65) * (i % 2 ? 1 : lerp(0.55, 0.8, r()));
      c.lineTo(bx, by);
    }
    c.closePath(); c.fill();
    // a darker band under the snow, where its shadow falls on the needles
    c.fillStyle = rgb(S(needle, s * 0.3, -0.2, 0.7, 0.05), 0.55);
    c.beginPath(); c.moveTo(top[0][0], top[0][1]);
    for (i = 1; i <= n; i++) c.lineTo(top[i][0], top[i][1]);
    for (i = n; i >= 0; i--) c.lineTo(top[i][0], top[i][1] + thick * 0.38 * (1 - i / n * 0.6));
    c.closePath(); c.fill();
    if (load <= 0.02) return;
    // the snow pillow along the top
    var sh = thick * 0.55 * load, up = [], lo = [];
    for (i = 0; i <= n; i++) {
      var u3 = i / n, env = Math.pow(1 - u3 * 0.92, 0.7) * (0.85 + 0.3 * r());
      up.push([top[i][0], top[i][1] - sh * env * 0.65]);
      lo.push([top[i][0], top[i][1] + sh * env * 0.18]);
    }
    var occS = lit ? lerp(0.8, 1, k) : lerp(0.05, 0.35, k);
    var sTop = S(snowC, s * 0.45, 1, 0.35, occS), sFront = S(snowC, s * 0.3, 0.25, 0.95, occS * 0.85), sUnder = S(snowC, s * 0.2, -0.4, 0.9, occS * 0.3);
    c.beginPath(); c.moveTo(lo[0][0], lo[0][1]);
    for (i = 0; i <= n; i++) c.lineTo(up[i][0], up[i][1]);
    c.quadraticCurveTo(up[n][0] + s * sh * 0.15, (up[n][1] + lo[n][1]) / 2, lo[n][0], lo[n][1]);
    for (i = n; i >= 0; i--) c.lineTo(lo[i][0], lo[i][1]);
    c.closePath();
    var g = c.createLinearGradient(0, y - sh * 0.7, 0, y + sag + sh * 0.35);
    g.addColorStop(0, rgb(sTop)); g.addColorStop(0.55, rgb(sFront)); g.addColorStop(1, rgb(sUnder));
    c.fillStyle = g; c.fill();
    // lumps hanging over the edge
    for (i = 1; i < n; i += 1) {
      if (r() > 0.5) continue;
      var lx = lo[i][0], ly = lo[i][1], rw = sh * lerp(0.22, 0.4, r()) * (1 - i / n * 0.5), rh = rw * lerp(0.8, 1.3, r());
      var lg = c.createLinearGradient(0, ly - rh, 0, ly + rh);
      lg.addColorStop(0, rgb(sFront)); lg.addColorStop(1, rgb(sUnder));
      c.fillStyle = lg;
      c.beginPath(); c.ellipse(lx, ly, rw, rh, 0, 0, TAU); c.fill();
    }
    // a bright rim where the sun catches the top
    if (lit && occS > 0.6) {
      c.strokeStyle = rgb(mix(sTop, [255, 255, 255], 0.3), 0.6); c.lineWidth = Math.max(0.5, sh * 0.12);
      c.beginPath(); c.moveTo(up[0][0], up[0][1]);
      for (i = 1; i <= n * 0.8; i++) c.lineTo(up[i][0], up[i][1]);
      c.stroke();
    }
  }
  // a branch pointing toward you: a clump in front of the trunk
  function clump(y, len, tierT) {
    var rw = len * lerp(0.3, 0.42, r()), rh = rw * 0.4, cx = x + (r() < 0.5 ? -1 : 1) * len * lerp(0.25, 0.55, r()), cy = y + len * 0.18;
    c.fillStyle = rgb(S(needle, 0, 0, 1, 0.45));
    c.beginPath(); c.ellipse(cx, cy + rh * 0.6, rw * 0.9, rh * 1.1, 0, 0, TAU); c.fill();
    if (load <= 0.02) return;
    var sh2 = rh * lerp(0.9, 1.3, load);
    var g = c.createLinearGradient(0, cy - sh2, 0, cy + sh2 * 0.6);
    g.addColorStop(0, rgb(S(snowC, sunSide * 0.3, 1, 0.4, 0.9))); g.addColorStop(1, rgb(S(snowC, 0, 0.1, 1, 0.45)));
    c.fillStyle = g;
    c.beginPath(); c.ellipse(cx, cy, rw, sh2 * 0.75, 0, 0, TAU); c.fill();
    var sg = c.createLinearGradient(cx - rw * sunSide, 0, cx + rw * sunSide, 0);
    sg.addColorStop(0, rgb(S(snowC, 0, 0, 1, 0), 0)); sg.addColorStop(0.55, rgb(S(snowC, 0, 0, 1, 0), 0)); sg.addColorStop(1, rgb(S(snowC, 0, 0, 1, 0), 0.4));
    c.fillStyle = sg; c.fill();
  }
  // the tiers, from the bottom up, so each hangs over the snow on the one below
  for (var i = tiers - 1; i >= 0; i--) {
    var t = (i + 0.6) / tiers, y = yb - h + h * 0.93 * Math.pow(t, 1.04) - h * 0.03;
    var len = wMax * Math.pow(t, 0.85) * lerp(0.85, 1.12, r()) + h * 0.015;
    branch(y + len * 0.04, -1, len * 0.75, 0.2, t);             // the ones behind, shorter and in shade
    branch(y + len * 0.04, 1, len * 0.75, 0.2, t);
    branch(y, -1, len, 1, t);
    branch(y, 1, len, 1, t);
    if (t > 0.3 && r() < 0.3) clump(y, len * 0.6, t);
  }
  // the top: a spire with a cap of snow
  var tx = x, ty = yb - h;
  c.fillStyle = rgb(S(needle, 0, 0.3, 1, 0.6));
  c.beginPath(); c.moveTo(tx, ty - h * 0.03); c.lineTo(tx + h * 0.03, ty + h * 0.08); c.lineTo(tx - h * 0.03, ty + h * 0.08); c.closePath(); c.fill();
  if (load > 0.02) {
    var cg = c.createLinearGradient(0, ty - h * 0.03, 0, ty + h * 0.06);
    cg.addColorStop(0, rgb(S(snowC, sunSide * 0.4, 1, 0.3, 1))); cg.addColorStop(1, rgb(S(snowC, -sunSide * 0.3, 0.3, 1, 0.4)));
    c.fillStyle = cg;
    var cw = h * 0.026 * (0.7 + 0.3 * load);
    c.beginPath(); c.moveTo(tx, ty - h * 0.025); c.quadraticCurveTo(tx + cw, ty + h * 0.02, tx + cw * 1.1, ty + h * 0.055);
    c.quadraticCurveTo(tx, ty + h * 0.075, tx - cw * 1.1, ty + h * 0.055); c.quadraticCurveTo(tx - cw, ty + h * 0.02, tx, ty - h * 0.025); c.fill();
  }
  // a heap of snow at its foot, over the lowest needles
  var fg = c.createLinearGradient(0, yb - h * 0.03, 0, yb + h * 0.02);
  fg.addColorStop(0, rgb(S(snowC, 0, 1, 0.3, 0.8))); fg.addColorStop(1, rgb(S(snowC, 0, 0.2, 1, 0.6)));
  c.fillStyle = fg;
  c.beginPath(); c.ellipse(x, yb, wMax * 0.95, h * 0.028, 0, PI, TAU); c.closePath(); c.fill();
  return yb - h * 1.04;
}

/* ---------- the frosted tree ---------- */
function frost(c, o) {
  var r = rng(d(o, 'seed', 1)), h = o.h, S = shader(o), L = d(o, 'sunDir', [-0.8, 0.4, 0.3]);
  var C = o.colours || {}, bark = C.bark || [96, 86, 90], rimeC = C.rime || [250, 250, 252];
  var rime = d(o, 'rime', 1), spread = d(o, 'spread', 1), twigs = d(o, 'twigs', 0.6);
  var maxD = Math.round(lerp(4, 7, twigs)), segs = [], tips = [];
  function br(x, y, a, len, w, dep) {
    var bend = (r() - 0.5) * 0.4, steps = 3, px = x, py = y, aa = a;
    for (var s = 0; s < steps; s++) {
      aa += bend / steps;
      var nx = px + Math.cos(aa) * len / steps, ny = py + Math.sin(aa) * len / steps;
      segs.push([px, py, nx, ny, w * (1 - s / steps * 0.25), dep]);
      px = nx; py = ny;
    }
    if (dep >= maxD) { tips.push([px, py]); return; }
    var n = dep === 0 ? 3 : 2 + (r() < 0.4 ? 1 : 0);
    for (var i = 0; i < n; i++) {
      var ca = aa + ((n > 1 ? i / (n - 1) : 0.5) - 0.5) * lerp(0.6, 1.05, r()) * (dep === 0 ? 1.5 : 1) * spread + (r() - 0.5) * 0.3;
      ca = lerp(ca, -PI / 2, 0.12);
      br(px, py, ca, len * lerp(0.6, 0.78, r()), Math.max(0.35, w * 0.6), dep + 1);
    }
  }
  br(o.x, o.y, -PI / 2 + (r() - 0.5) * 0.1, h * 0.3, Math.max(0.9, h * 0.035), 0);
  c.lineCap = 'round';
  var barkC = S(bark, L[0] * 0.5, 0.2, 0.8, 0.6), rimeLit = S(rimeC, L[0] * 0.8, 0.6, 0.4, 1), rimeSh = S(rimeC, -L[0] * 0.8, 0.2, 0.6, 0.15);
  // the bark: dark, a little lighter on the sunny side of the thick limbs
  for (var i = 0; i < segs.length; i++) {
    var s = segs[i];
    c.strokeStyle = rgb(barkC); c.lineWidth = s[4];
    c.beginPath(); c.moveTo(s[0], s[1]); c.lineTo(s[2], s[3]); c.stroke();
  }
  if (rime <= 0) return o.y - h;
  // the rime: thick on every twig, on the windward (sunny) side brightest
  var off = L[0] < 0 ? -1 : 1;
  for (i = 0; i < segs.length; i++) {
    var q = segs[i], w = q[4];
    c.strokeStyle = rgb(rimeSh, clamp(0.5 * rime, 0, 0.9)); c.lineWidth = w * (1 + 0.6 * rime) + 0.4;
    c.beginPath(); c.moveTo(q[0], q[1]); c.lineTo(q[2], q[3]); c.stroke();
    c.strokeStyle = rgb(rimeLit, clamp(0.75 * rime, 0, 1)); c.lineWidth = w * (0.55 + 0.35 * rime);
    c.beginPath(); c.moveTo(q[0] + off * w * 0.25, q[1] - w * 0.3); c.lineTo(q[2] + off * w * 0.25, q[3] - w * 0.3); c.stroke();
  }
  // the finest tips: a soft white haze of frost
  for (i = 0; i < tips.length; i++) {
    var t = tips[i], rr = h * 0.022 * (0.6 + 0.6 * r()) * Math.min(1.5, rime);
    var g = c.createRadialGradient(t[0], t[1], 0, t[0], t[1], rr);
    var tc = r() < 0.5 + 0.3 * off * (t[0] - o.x) / h ? rimeSh : rimeLit;
    g.addColorStop(0, rgb(tc, 0.55)); g.addColorStop(1, rgb(tc, 0));
    c.fillStyle = g; c.beginPath(); c.arc(t[0], t[1], rr, 0, TAU); c.fill();
  }
  // a little snow banked at the foot
  c.fillStyle = rgb(S(rimeC, 0, 1, 0.4, 0.8));
  c.beginPath(); c.ellipse(o.x, o.y, h * 0.06, h * 0.014, 0, PI, TAU); c.closePath(); c.fill();
  return o.y - h * 1.05;
}

return { fir: fir, frost: frost };
})();
