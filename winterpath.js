/* ============================================================
   WINTERPATH — the trodden path through the snow for the new winter
   scene (newwinter.html, step 8). Everything is drawn in code.

   The path is a shape on the ground, in metres, in the scene's own
   camera space (x right of the eye, z away from it, as the snow ground
   in winterlake.js and the hall in winterhall.js have it): a smooth
   curve through the points the page gives, and across it the snow's
   height as people walking it have left it:
   - a floor trodden down below the snow round it (about ankle deep),
     packed and uneven, with footprints (dents in the shape of a sole,
     each its own size, turn and depth, many overlapping), softened
     older prints, and the trodden line a little lower in the middle;
   - each side a wall of snow: rounded at its top lip, its foot meeting
     the floor in a soft curve, its line wandering (no ruler edges), here
     and there a notch where a foot stepped out, and clumps broken off it
     lying at its foot;
   - beyond the wall a low ridge of snow pushed aside, fading into the
     untouched snow.
   It is not a picture: the painters that draw the snow (winterlake.js
   for the field, winterhall.js for the rise the hall stands on) add this
   height to their own and follow each line of sight to it, light it
   with the scene's light (its slopes, the walls' shadows cast into it by
   the sun, the sky's light cut down at the foot of the walls), so it
   blends with the snow round it.

   Use:
     WinterPath.build(o)  → T
       o: pts [[x, z], …] (m, at least 2; the path runs from the first to the last), width (m), depth (m: the walls'
          height above the floor), wall (m: how wide each wall's slope is), berm (m: the ridge pushed aside),
          wobble (0 … 2: how much its edges wander), trod (0 … 2: footprints), endHalf (m: its half width at the end,
          or 0 for its own), cutS (m along it: beyond this it fades out over 2 m; Infinity for none), seed
     T.delta(x, z, fz, coarse)  the snow's height here relative to the untouched snow (m; < 0 in the path), fz: how
                          much ground one pixel covers (m: fine detail fades out where it is smaller than a pixel);
                          coarse: the shape without the footprints and fine relief (for following lines of sight and
                          casting shadows, where they make no difference you could see).
                          Afterwards T.Q holds what was found: a (m from the edge, < 0 inside), floor (0 … 1: how
                          trodden the snow is), u (m across, + right of the way it runs), s (m along it)
     T.near(x, z, m)      false where nothing of the path lies within m metres (a quick test)
     T.sun(x, z, h, L, fz)  0 … 1: how much of the sun reaches the snow at (x, z) at height h (relative, m), L:
                          toward the sun [x right, y up, z AWAY] (only the path's own walls cast these shadows)
     T.sky(x, z, h, fz)   0 … 1: how much of the sky it sees (cut down at the foot of the walls)
     T.maxRise, T.maxDrop (m), T.length (m), T.ends
   ============================================================ */
var WinterPath = (function () {
'use strict';

function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
function lerp(a, b, t) { return a + (b - a) * t; }
function smooth(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
function hash1(i, s) { var h = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return h - Math.floor(h); }
function hash2(i, j, s) { var h = Math.sin(i * 127.1 + j * 311.7 + s * 74.7) * 43758.5453; return h - Math.floor(h); }
function n1(x, s) {                                       // smooth value noise along a line, -1 … 1
  var i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return lerp(hash1(i, s), hash1(i + 1, s), u) * 2 - 1;
}
function n2(x, y, s) {
  var i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  return lerp(lerp(hash2(i, j, s), hash2(i + 1, j, s), u), lerp(hash2(i, j + 1, s), hash2(i + 1, j + 1, s), u), v) * 2 - 1;
}

/* A smooth curve through the points (centripetal Catmull-Rom), sampled every ds metres. */
function curve(P, ds) {
  var n = P.length, out = [];
  function pt(i) {
    if (i < 0) return [2 * P[0][0] - P[1][0], 2 * P[0][1] - P[1][1]];
    if (i >= n) return [2 * P[n - 1][0] - P[n - 2][0], 2 * P[n - 1][1] - P[n - 2][1]];
    return P[i];
  }
  for (var i = 0; i < n - 1; i++) {
    var p0 = pt(i - 1), p1 = pt(i), p2 = pt(i + 1), p3 = pt(i + 2);
    var d01 = Math.pow(Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), 0.5) || 1e-3, d12 = Math.pow(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]), 0.5) || 1e-3,
        d23 = Math.pow(Math.hypot(p3[0] - p2[0], p3[1] - p2[1]), 0.5) || 1e-3;
    var t0 = 0, t1 = t0 + d01, t2 = t1 + d12, t3 = t2 + d23;
    var len = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]), m = Math.max(2, Math.ceil(len / ds * 3));
    for (var k = 0; k < m; k++) {
      var t = lerp(t1, t2, k / m), q = [0, 0];
      for (var c = 0; c < 2; c++) {
        var a1 = (t1 - t) / (t1 - t0) * p0[c] + (t - t0) / (t1 - t0) * p1[c];
        var a2 = (t2 - t) / (t2 - t1) * p1[c] + (t - t1) / (t2 - t1) * p2[c];
        var a3 = (t3 - t) / (t3 - t2) * p2[c] + (t - t2) / (t3 - t2) * p3[c];
        var b1 = (t2 - t) / (t2 - t0) * a1 + (t - t0) / (t2 - t0) * a2;
        var b2 = (t3 - t) / (t3 - t1) * a2 + (t - t1) / (t3 - t1) * a3;
        q[c] = (t2 - t) / (t2 - t1) * b1 + (t - t1) / (t2 - t1) * b2;
      }
      out.push(q);
    }
  }
  out.push(P[n - 1].slice());
  // evenly spaced again, ds apart
  var even = [out[0]], acc = 0;
  for (var j = 1; j < out.length; j++) {
    var a = even[even.length - 1], b = out[j], d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    acc = d;
    while (acc >= ds) { var f = ds / acc; a = [lerp(a[0], b[0], f), lerp(a[1], b[1], f)]; even.push(a); acc = Math.hypot(b[0] - a[0], b[1] - a[1]); }
  }
  even.push(out[out.length - 1]);
  return even;
}

function build(o) {
  var seed = o.seed || 7, D0 = o.depth === undefined ? 0.12 : o.depth, W0 = (o.width || 4) / 2, wallW = o.wall || 0.22;
  var berm = o.berm === undefined ? 0.03 : o.berm, wob = o.wobble === undefined ? 1 : o.wobble, trod = o.trod === undefined ? 1 : o.trod;
  var endHalf = o.endHalf || 0, cutS = o.cutS === undefined ? Infinity : o.cutS;
  var ds = 0.25, C = curve(o.pts, ds), N = C.length;
  var X = new Float64Array(N), Z = new Float64Array(N), S = new Float64Array(N);
  for (var i = 0; i < N; i++) { X[i] = C[i][0]; Z[i] = C[i][1]; S[i] = i ? S[i - 1] + Math.hypot(X[i] - X[i - 1], Z[i] - Z[i - 1]) : 0; }
  var L = S[N - 1];
  // where the end comes in (its width there), and what lies where on the ground: a grid of 1 m cells, each with the
  // nearest point of the curve (within R m)
  var R = 22, x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (i = 0; i < N; i++) { x0 = Math.min(x0, X[i]); x1 = Math.max(x1, X[i]); z0 = Math.min(z0, Z[i]); z1 = Math.max(z1, Z[i]); }
  x0 = Math.floor(x0 - R); z0 = Math.floor(z0 - R); x1 = Math.ceil(x1 + R); z1 = Math.ceil(z1 + R);
  var GW = x1 - x0, GH = z1 - z0, gi = new Int32Array(GW * GH).fill(-1), gd = new Float32Array(GW * GH).fill(1e9);
  for (i = 0; i < N; i++) {
    var ci = Math.floor(X[i] - x0), cj = Math.floor(Z[i] - z0);
    for (var b = -R; b <= R; b++) {
      var jj = cj + b; if (jj < 0 || jj >= GH) continue;
      for (var a = -R; a <= R; a++) {
        var ii = ci + a; if (ii < 0 || ii >= GW) continue;
        var k = jj * GW + ii, d = Math.hypot(x0 + ii + 0.5 - X[i], z0 + jj + 0.5 - Z[i]);
        if (d < gd[k]) { gd[k] = d; gi[k] = i; }
      }
    }
  }
  // the half width along it: wandering a little (each side its own), narrowing to endHalf at the end
  function halfW(s, side) {
    var w = W0 + wob * (0.13 * n1(s / 3.1, seed + side * 7) + 0.05 * n1(s / 0.9, seed + 3 + side * 7));
    if (endHalf > 0) w = lerp(w, endHalf, smooth(L - 12, L - 1, s));
    return w;
  }
  function depthAt(s) { return D0 * (1 + 0.22 * wob * n1(s / 5.3, seed + 21)); }

  var Q = { a: 1e9, floor: 0, u: 0, s: 0, far: true };
  // where (x, z) is relative to the path: along it (s), across it (u, + to the right of the way it runs)
  function locate(x, z) {
    var ci = Math.floor(x - x0), cj = Math.floor(z - z0);
    if (ci < 0 || cj < 0 || ci >= GW || cj >= GH) return false;
    var k = cj * GW + ci, i0 = gi[k];
    if (i0 < 0 || gd[k] > R - 1.5) return false;
    var best = 1e18, bs = 0, bu = 0;
    for (var q = Math.max(0, i0 - 5); q < Math.min(N - 1, i0 + 5); q++) {
      var ax = X[q], az = Z[q], bx = X[q + 1] - ax, bz = Z[q + 1] - az, ll = bx * bx + bz * bz || 1e-9;
      var t = clamp(((x - ax) * bx + (z - az) * bz) / ll, 0, 1);
      if (q === 0) t = Math.min(t, ((x - ax) * bx + (z - az) * bz) / ll);                 // before the start: past its end
      if (q === N - 2) t = Math.max(t, ((x - ax) * bx + (z - az) * bz) / ll);
      var px = ax + bx * t, pz = az + bz * t, dd = (x - px) * (x - px) + (z - pz) * (z - pz);
      if (dd < best) { best = dd; var l = Math.sqrt(ll); bs = S[q] + t * l; bu = ((x - ax) * bz - (z - az) * bx) / l; }
    }
    Q.s = bs; Q.u = bu;
    return true;
  }
  var maxRise = berm * 1.6 + 0.01, maxDrop = D0 * (1 + 0.22 * wob) + 0.06;

  /* The snow's height relative to the untouched snow round it. */
  function delta(x, z, fz, coarse) {
    Q.a = 1e9; Q.floor = 0; Q.far = true;
    if (!locate(x, z)) return 0;
    Q.far = false;
    var s = Q.s, u = Q.u, side = u >= 0 ? 1 : 0, hw = halfW(s, side), au = Math.abs(u);
    // the edge as a rounded end where it stops (after its last point)
    var dU = au - hw, dS = s - L;
    var a = dS > 0 ? (dU > 0 ? Math.hypot(dU, dS) : Math.max(dU, dS)) : dU;
    // here and there the edge is pushed out a little where feet stepped wide: a broad, shallow scoop in the wall (each
    // its own length and depth; most stretches have none). (They were narrow pockets cut the full depth of the wall:
    // up close each cast a sharp dark crescent that read as a mistake in the drawing.)
    var nk = Math.floor(s / 2.3), nr = hash2(nk, side, seed + 41);
    if (nr < 0.22 * trod) {
      var nc = (nk + 0.15 + 0.7 * hash2(nk, side, seed + 43)) * 2.3, nw = 0.55 + 0.45 * hash2(nk, side, seed + 45), nd = (s - nc) / nw;
      a -= (0.03 + 0.05 * hash2(nk, side, seed + 47)) * Math.exp(-nd * nd) * smooth(0.6, -0.2, a);
    }
    Q.a = a;
    if (a > wallW + 1.2) return 0;
    var D = depthAt(s), ww = wallW * (0.85 + 0.3 * n1(s / 2.3, seed + 31 + side));
    var fine = coarse ? 0 : 1 - smooth(0.04, 0.22, fz || 0);   // detail smaller than a pixel fades out (coarse: the shape alone)
    // across the wall: from the floor (-D) up to the untouched snow, the lip rounded over, the foot a soft curve
    var t = clamp((a + ww) / ww, 0, 1), prof = t * t * t * (t * (6 * t - 15) + 10);
    var h = -D * (1 - prof);
    // the ridge of snow thrown aside along the top
    if (berm > 0) { var bq = (a - 0.18) / 0.32; h += berm * (0.75 + 0.5 * n1(s / 1.6, seed + 51 + side)) * Math.exp(-bq * bq) * smooth(-0.1, 0.06, a); }
    var fl = 1 - smooth(-ww * 0.9, -ww * 0.15, a);          // the floor (1) … up the wall (0)
    Q.floor = fl;
    if (fl > 0) {
      // the trodden line a little lower in the middle, and the floor's own unevenness (old prints softened by more feet)
      h -= 0.014 * D / 0.12 * (1 - Math.pow(au / Math.max(0.3, hw), 2)) * fl;
      // trampled: the two lines most feet take a little deeper, and the floor heaped and hollowed by many feet at every
      // size from a cluster of prints to a stride (these stay visible far away, where single prints are too small)
      var tk = Math.min(1.5, trod), lane = hw * 0.32 * (1 + 0.25 * n1(s / 4.1, seed + 65));
      h -= 0.024 * tk * (Math.exp(-Math.pow((u - lane) / 0.32, 2)) + Math.exp(-Math.pow((u + lane) / 0.32, 2))) * fl * (0.6 + 0.4 * n1(s / 1.3, seed + 67));
      h += tk * fl * 0.02 * n2(s / 1.4, u / 0.9, seed + 61);
      if (!coarse) h += tk * fl * (0.02 * n2(s / 0.55, u / 0.4, seed + 62) + 0.008 * n2(s / 0.23, u / 0.23, seed + 63) * fine);
      // footprints: a sole-shaped dent in each cell of a grid laid along the path, if a foot came down there
      if (trod > 0 && fine > 0) {
        var cs = 0.34, cu = 0.26, is = Math.floor(s / cs), iu = Math.floor(u / cu), dent = 0;
        for (var di = -1; di <= 1; di++) for (var dj = -1; dj <= 1; dj++) {
          var ks = is + di, ku = iu + dj;
          if (hash2(ks, ku, seed + 71) > 0.62 * Math.min(1.5, trod)) continue;
          var cs0 = (ks + 0.5 + 0.7 * (hash2(ks, ku, seed + 73) - 0.5)) * cs, cu0 = (ku + 0.5 + 0.6 * (hash2(ks, ku, seed + 75) - 0.5)) * cu;
          var ang = (hash2(ks, ku, seed + 77) - 0.5) * 0.7 + (hash2(ks, ku, seed + 79) < 0.3 ? Math.PI : 0);
          var len = 0.13 + 0.04 * hash2(ks, ku, seed + 81), wid = 0.05 + 0.015 * hash2(ks, ku, seed + 83);
          var ds2 = s - cs0, du2 = u - cu0, ca = Math.cos(ang), sa = Math.sin(ang);
          var p = ds2 * ca + du2 * sa, q2 = -ds2 * sa + du2 * ca;
          // a sole: the toe wider than the heel, a waist between them
          var wq = wid * (1 + 0.25 * Math.tanh(p / len * 2)) * (1 - 0.18 * Math.exp(-Math.pow(p / (len * 0.3), 2)));
          var r = Math.hypot(p / len, q2 / wq);
          if (r > 1.25) continue;
          var dd = (0.012 + 0.022 * hash2(ks, ku, seed + 85)) * (1 - smooth(0.55, 1.0, r)) - 0.004 * Math.exp(-Math.pow((r - 1.08) / 0.1, 2));
          if (dd > dent) dent = dd;
        }
        h -= dent * fine * fl * Math.min(1.3, trod);
      }
      // clumps broken off the wall lying at its foot
      var ck = Math.floor(s / 1.6), cr = fine > 0 ? hash2(ck, side, seed + 91) : 1;
      if (cr < 0.3) {
        var cc = (ck + 0.15 + 0.7 * hash2(ck, side, seed + 93)) * 1.6, rad = 0.06 + 0.1 * hash2(ck, side, seed + 95);
        var off = -ww - rad * 0.4 - 0.25 * hash2(ck, side, seed + 97);
        var dq = Math.hypot((s - cc) / rad, (a - off) / rad);
        if (dq < 1) h += rad * 0.45 * Math.sqrt(1 - dq * dq) * fine;
      }
    }
    // fading out past where the hall's rise takes over (cutS)
    if (s > cutS) h *= 1 - smooth(cutS, cutS + 2, s);
    return h;
  }
  function near(x, z, m) {
    var ci = Math.floor(x - x0), cj = Math.floor(z - z0);
    if (ci < 0 || cj < 0 || ci >= GW || cj >= GH) return false;
    var k = cj * GW + ci;
    return gi[k] >= 0 && gd[k] < W0 + wallW + 1.6 + m;
  }
  /* the sun: a soft shadow cast by the path's walls (marched toward the sun, along the ground) */
  // how far (m) a point is from where a wall or the ridge along it could stand (from the last delta() call)
  function wallGap() { if (Q.far) return 1e9; var a = Q.a; return a > 0 ? Math.max(0, a - (wallW + 0.7)) : Math.max(0, -a - wallW * 1.2); }
  // (call it just after delta() at the same point, as the painters do: it uses what that found)
  function sun(x, z, h, Ls, fz) {
    var hl = Math.hypot(Ls[0], Ls[2]);
    if (Ls[1] <= 0.01) return 0;
    if (hl < 1e-4) return 1;
    var ux = Ls[0] / hl, uz = Ls[2] / hl, rise = Ls[1] / hl, top = maxRise - h;
    if (top <= 0) return 1;
    var tMax = Math.min(4, top / rise);
    if (wallGap() > tMax) return 1;                          // nothing that could cast a shadow lies within reach
    var n = clamp(Math.ceil(tMax / 0.07), 3, 10), res = 1, soft = 3;
    for (var k = 1; k <= n; k++) {
      var t = tMax * k / n, g = delta(x + ux * t, z + uz * t, fz, true), ry = h + rise * t;
      var gap = ry - g;
      if (gap < 0) return 0;
      res = Math.min(res, soft * gap / t);
    }
    return clamp(res, 0, 1);
  }
  /* the sky it sees: the walls on either side hide some of it (at their foot) */
  var SD = [0.1, 0.25, 0.5];
  function sky(x, z, h, fz) {
    delta(x, z, fz, true);
    if (Q.far || wallGap() > 0.6) return 1;
    var s = Q.s;
    // across the path here: the curve's normal
    var i = clamp(Math.round(s / ds), 0, N - 2), tx = X[i + 1] - X[i], tz = Z[i + 1] - Z[i], tl = Math.hypot(tx, tz) || 1;
    var nx = tz / tl, nz = -tx / tl, occ = 0;
    for (var side = -1; side <= 1; side += 2) {
      var m = 0;
      for (var k = 0; k < SD.length; k++) {
        var d = SD[k], g = delta(x + nx * d * side, z + nz * d * side, fz, true);
        m = Math.max(m, (g - h) / d);
      }
      occ += Math.atan(m) / (Math.PI / 2);
    }
    return clamp(1 - 0.5 * occ, 0, 1);
  }
  return { delta: delta, near: near, sun: sun, sky: sky, Q: Q, maxRise: maxRise, maxDrop: maxDrop, length: L,
           ends: [[X[0], Z[0]], [X[N - 1], Z[N - 1]]], at: function (s) { var i = clamp(Math.round(s / ds), 0, N - 1); return [X[i], Z[i]]; },
           sAt: function (x, z) { return locate(x, z) ? Q.s : -1; } };
}

return { build: build };
})();
