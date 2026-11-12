/* ============================================================
   WINTER LAKE — the snow ground, the lake's snow banks and the cold
   water's extras for the new winter scene (newwinter.html, step 6).
   Everything is drawn in code.

   Everything stands on one flat ground seen through the scene's camera
   (the eye on the horizon line, the mountains' lens): a point on the
   ground d px below the eye line is F / d eye heights away, and a thing
   there is drawn 1 / that as large. So the banks' earth faces, the ice
   and the steam all shrink with distance as the real ones would.

   - The snow ground is lit pixel by pixel: soft swells and wind-carved
     drifts (a height field on the ground, in metres), each slope lit by
     the sun and the sky (blue in the shade), hazed into the mist far
     away, warmed where it lies under the low sun, with fine grain and a
     few sparkles. It is baked once.
   - The lake is a hole in the snow, its outline from the reference. Where
     the land lies beyond the water (the banks facing you), the snow ends
     in a rounded lip over a dark face of earth and stone down to the
     waterline, as tall as the bank (bankDrop, m) seen from that distance.
     Where the snow is in front of the water (the near-left shore), it
     curves down out of sight.
   - The water itself is water.js (the autumn lake's shader): this file
     bakes its mirror (the sky, the mountains and the banks turned over),
     and the still things on it: thin ice along the shores and a low mist
     on the far water.
   - Steam (sea smoke) drifts up off the water, each frame.

   Use:
     WinterLake.shore(pts, o)        → the outline: dense points, normals toward the land,
                                       the earth face's height at each point (px), the top
       o: W, H, hy (px), F (lens, px), eye (m), drop (m: the bank's height above the water),
          wobble (0 … 2), seed
     WinterLake.bakeGround(c, o)     the snow ground into the 2D context c (device px), the lake cut out; with o.path (a
                                     WinterPath, winterpath.js) and o.pathLook { grey, shadow } the trodden path in it
     WinterLake.bakeMirror(c, o)     the water's mirror (rows from the water's top down; pad each side)
     WinterLake.bakeStill(c, o)      the thin ice and the mist on the far water (the screen's size)
     WinterLake.steam(S, c, o, t, dt) the steam, each frame (S: its state, {} at first)
   ============================================================ */
var WinterLake = (function () {
'use strict';
var PI = Math.PI, TAU = PI * 2;
function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
function lerp(a, b, t) { return a + (b - a) * t; }
function smooth(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
function mix(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }
function rgb(c, a) {
  return 'rgba(' + Math.round(clamp(c[0], 0, 255)) + ',' + Math.round(clamp(c[1], 0, 255)) + ',' +
         Math.round(clamp(c[2], 0, 255)) + ',' + (a === undefined ? 1 : clamp(a, 0, 1).toFixed(3)) + ')';
}
function rng(seed) {
  var a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/* The final colour of the snow, rolled off softly toward white: the haze and the low sun's warm glow are added after
   the snow's own soft shoulder, and far away under the sun they took it past 255, where every shade was cut off (the
   far path and its walls read as flat paper white). Below KNEE nothing changes; above it the rest is squeezed into the
   last few levels, so the brightest snow stays just short of white and its shading still shows. (winterhall.js uses
   the same curve, so the hall's snow meets the field's without a seam.) */
var TONE_KNEE = 228, TONE_ROOM = 24;
// how much each colour drops in the snow's shade, red most and blue least (measured on the near snow's own shade,
// about 0.89 : 0.94 : 0.98 of the lit snow): far away, where the shading is laid on as a ratio, its shade is this blue
var SHADE_W = [1.55, 0.9, 0.35];
// how much light a shade of depth d (0 … 1) leaves in each colour: light shade in that blue, deep shadow greyer-blue
// as the reference paints its path's shadows (176,183,199 against lit 235,240,245: red 25 %, green 24 %, blue 19 % down)
function shadeMul(d, ch) {
  var k = smooth(0.06, 0.25, d), w = lerp(SHADE_W[ch], [1.05, 1.0, 0.8][ch], k);
  return Math.max(0, 1 - d * w);
}
function tone(v) { return v > TONE_KNEE ? TONE_KNEE + (v - TONE_KNEE) * TONE_ROOM / (v - TONE_KNEE + TONE_ROOM) : v; }
/* smooth value noise, 0 … 1, and its sum over a few sizes, −1 … 1 */
function hash(i, j, s) {
  var h = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(s, 982451653)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function vn(x, y, s) {
  var i = Math.floor(x), j = Math.floor(y), u = x - i, v = y - j;
  u = u * u * (3 - 2 * u); v = v * v * (3 - 2 * v);
  var a = hash(i, j, s), b = hash(i + 1, j, s), c = hash(i, j + 1, s), d = hash(i + 1, j + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, s, oct) {
  var sum = 0, amp = 0.5, tot = 0;
  for (var k = 0; k < oct; k++) { sum += amp * vn(x, y, s + k * 31); tot += amp; x = x * 2.03 + 17.1; y = y * 2.03 + 5.3; amp *= 0.5; }
  return sum / tot * 2 - 1;
}
function inside(P, x, y) {
  var c = false;
  for (var i = 0, j = P.length - 1; i < P.length; j = i++) {
    var a = P[i], b = P[j];
    if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c;
  }
  return c;
}
function polyPath(c, P, dy) {
  c.beginPath();
  for (var i = 0; i < P.length; i++) { var y = P[i][1] + (dy ? dy[i] : 0); if (i) c.lineTo(P[i][0], y); else c.moveTo(P[i][0], y); }
  c.closePath();
}

/* ---------- the shore ---------- */
/* The outline smoothed (Catmull-Rom, a point every few px), made a little uneven as heaped snow is (more near you),
   with, at each point: the normal toward the land, how much the land lies beyond the water there (the banks you
   face; 0 where the snow is in front of the water) and so the height of the earth face (px). */
function shore(pts, o) {
  var W = o.W, H = o.H, hy = o.hy, n = pts.length, out = [], r = rng((o.seed || 7) * 7919 + 11);
  for (var i = 0; i < n; i++) {
    var p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    var len = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]), m = Math.max(2, Math.ceil(len / 3));
    for (var k = 0; k < m; k++) {
      var t = k / m, t2 = t * t, t3 = t2 * t;
      out.push([
        0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
      ]);
    }
  }
  n = out.length;
  // which way round: the normal toward the land is (ty, −tx) for a clockwise outline on the screen
  var A = 0;
  for (i = 0; i < n; i++) { var a = out[i], b = out[(i + 1) % n]; A += a[0] * b[1] - b[0] * a[1]; }
  var sg = A > 0 ? 1 : -1;
  function normals(P) {
    var N = [];
    for (var q = 0; q < P.length; q++) {
      var pa = P[(q - 2 + P.length) % P.length], pb = P[(q + 2) % P.length], tx = pb[0] - pa[0], ty = pb[1] - pa[1], l = Math.hypot(tx, ty) || 1;
      N.push([sg * ty / l, -sg * tx / l]);
    }
    return N;
  }
  var N0 = normals(out), arc = 0, wob = o.wobble === undefined ? 1 : o.wobble;
  // uneven: each point moved along its normal by a slow and a quick wave of noise (heaped snow), more near you
  var P = [], onScreen = [];
  for (i = 0; i < n; i++) {
    if (i) arc += Math.hypot(out[i][0] - out[i - 1][0], out[i][1] - out[i - 1][1]);
    var x = out[i][0], y = out[i][1], d = Math.max(0, y - hy), on = x > -2 && x < W + 2 && y < H + 2;
    var k2 = on ? wob * d * 0.02 * (fbm(arc / 40, 0.5, 91, 2) * 1.0 + fbm(arc / 9, 3.5, 93, 2) * 0.45) : 0;
    P.push([x + N0[i][0] * k2, y + N0[i][1] * k2]);
    onScreen.push(on);
  }
  var N = normals(P), rim = [], wgt = [], drop = (o.drop || 0.25) / Math.max(0.3, o.eye || 3), top = 1e9;
  arc = 0;
  for (i = 0; i < n; i++) {
    if (i) arc += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]);
    var d2 = Math.max(0, P[i][1] - hy);
    // the land beyond the water (its normal points up the screen): the earth face shows, fully once it faces you
    var w = onScreen[i] ? smooth(0.25, -0.65, N[i][1]) : 0;
    wgt.push(w);
    // its height: the bank's (seen from there), uneven along the shore (lumps of snow, stones, hollows)
    rim.push(w * drop * d2 * (0.7 + 0.6 * vn(arc / 22, 1.5, 97)));
    if (P[i][1] < top) top = P[i][1];
  }
  // a short rise and fall at each end of a face, not a step
  var rs = rim.slice();
  for (i = 0; i < n; i++) { var s = 0, ws = 0; for (var j = -4; j <= 4; j++) { var ww = 5 - Math.abs(j); s += rs[(i + j + n) % n] * ww; ws += ww; } rim[i] = s / ws; }
  return { pts: P, nrm: N, rim: rim, wgt: wgt, top: top, inside: function (x, y) { return inside(P, x, y); } };
}

/* ---------- the snow ground ---------- */
/* The ground's height (m) at x (across) and z (away from you), m. Soft swells, and long low drifts the wind has
   carved (fainter far away, where they are smaller than a pixel). fz: how much ground one pixel covers in depth (m). */
function heightAt(x, z, o, fz, dk) {
  var s = o.seed || 7;
  var h = (fbm(x / 22, z / 22, s, 2) * 0.8 + fbm(x / 7.5, z / 7.5, s + 11, 3) * 0.55) * o.swell;
  // (dk: how much of the wind's drifts are left; the trodden path's floor has none)
  if (o.drifts > 0 && (dk === undefined || dk > 0)) {
    var fade = 1 - smooth(0.3, 0.9, fz / 2.4);
    if (fade > 0) {
      var w = fbm(x / 9 + 5.2, z / 9, s + 3, 2);
      var u = (z * 0.92 + x * 0.38) / 2.6 + w * 2.2;
      var rr = 1 - Math.abs(Math.sin(u * PI));
      h += rr * rr * (0.55 + 0.45 * fbm(x / 6, z / 6, s + 7, 2)) * 0.11 * o.drifts * fade * (dk === undefined ? 1 : dk);
    }
    // and long low drifts, tens of metres apart: far away (toward the hall) the small ones are finer than a pixel and
    // fade out, and the snow there read as plain white; these still shade it in soft bands as the wind laid them
    var fadeF = 1 - smooth(8, 20, fz);
    if (fadeF > 0) {
      var w2 = fbm(x / 40 + 1.7, z / 40, s + 13, 2), u2 = (z * 0.95 + x * 0.3) / 34 + w2 * 1.6, r2 = 1 - Math.abs(Math.sin(u2 * PI));
      h += r2 * r2 * (0.5 + 0.5 * fbm(x / 25, z / 25, s + 17, 2)) * 0.3 * o.drifts * fadeF * (dk === undefined ? 1 : dk);
    }
  }
  return h;
}
/* o: W, H, PR (device px per CSS px), hy, F, eye (m), res (share of PR the light is worked out at), shore,
   light { dir [x, y up, z toward you], sun [r, g, b] (0 … ~1.5), vis (0 … 1: how much the sun shows) },
   snow, shade, mist, earth (rgb), sunX (CSS px), sunRGB, swell, drifts, grain, sparkle, haze, hazeM (m), glow, seed;
   path (a WinterPath, or null), pathLook { grey, shadow, bounce } */
function bakeGround(c, o) { groundJob(c, o).step(); }
/* The same, a few rows at a time: job.step(ms) → true when finished; only then is c drawn on (so a page can bake into
   a second picture and show the old one meanwhile). */
function groundJob(c, o) {
  var W = o.W, H = o.H, PR = o.PR, hy = o.hy, F = o.F, eye = o.eye || 3, Sh = o.shore;
  var res = PR * (o.res || 0.6), gw = Math.max(2, Math.round(W * res)), y0 = Math.floor(hy), gh = Math.max(2, Math.round((H - y0) * res));
  var tmp = document.createElement('canvas'); tmp.width = gw; tmp.height = gh;
  var tc = tmp.getContext('2d'), im = tc.createImageData(gw, gh), D = im.data;
  var L = o.light.dir, sun = o.light.sun, snow = o.snow, shade = mix(o.shade, snow, 0.12), mist = o.groundMist || o.mist, glowCol = o.sunRGB || [255, 220, 170];
  var vis = o.light.vis === undefined ? 1 : o.light.vis, hazeM = o.hazeM || 150, eps = 0.18, gs = o.grain || 0;
  /* ---- the trodden path (o.path: a WinterPath). The snow ground is drawn as if flat (its swells only shade it); the
     path's own height is followed along the line of sight: from the eye the ray reaches the flat snow at (x, z) and
     goes on down; it meets the path's surface where its height above the flat snow equals the path's (so the wall
     facing you shows, the one facing away hides behind its own lip, the floor sinks a little up the screen). ---- */
  var PT = o.path || null, PO = o.pathLook || {}, Ls = [L[0], L[1], -L[2]];          // toward the sun, z away
  var pGrey = PO.grey === undefined ? 0.5 : PO.grey, pShade = PO.shadow === undefined ? 1 : PO.shadow, pBounce = PO.bounce === undefined ? 0.5 : PO.bounce;
  var kA = PT ? Math.max(0.02, 1 - PT.maxRise / eye) : 1, kB = PT ? 1 + PT.maxDrop / eye : 1, HK = 0, nPath = 0;
  var dlFlat = Math.max(0, L[1]);                                                     // the sun on level snow
  function farRatio(dl, sk) {
    var a = 0, b = 0;
    for (var ch = 0; ch < 3; ch++) { a += snow[ch] * sun[ch] * dl * 1.25 + shade[ch] * sk; b += snow[ch] * sun[ch] * dlFlat * 1.25 + shade[ch]; }
    return a / Math.max(1, b);
  }
  function pathHit(x, z, fz) {
    var r0 = Math.hypot(x, z);
    // a path over raised ground (up the hall's rise, o.path.riseBox: where the ground stands above the field): the line
    // of sight meets that ground before it reaches the field's level, so it is followed over it from where it comes
    // above the box, in steps as long as its height above the snow allows, then halved down to the surface
    if (PT.riseBox) { var rh = riseHit(x, z, fz); if (rh >= 0) return rh; }
    return pathHit1(x, z, fz, r0);
  }
  function riseHit(x, z, fz) {
    // (it starts where the line of sight is still above the highest snow there could be: at the rise's near edge it
    // is already down at the field's level, and starting there took the edge itself for the snow's surface)
    // It starts 5 m in front of the box (where only the path's own shallow shape lies, and the line of sight is above
    // it), and never steps more than 1.5 m of ground at a time (the rise climbs under the line of sight: a step sized
    // for level ground jumped clean over it)
    var B = PT.riseBox, kTop = 1 - (PT.maxRise + 0.05) / eye;
    var kS = Math.max(0.02, Math.min((B.z0 - 5) / z, kTop)), kE = Math.min(kB, (B.z1 + 1) / z);
    if (kS >= kE) return -1;
    var k = kS, prev = kS, minStep = 0.25 / z, maxStep = 1.5 / z, n = 0;
    while (k <= kE && n++ < 600) {
      var px = x * k, pz = z * k;
      var g = eye * (1 - k) - PT.delta(px, pz, fz, true);
      if (g <= 0) {
        var lo = prev, hi = k;
        for (var b = 0; b < 8; b++) { var m = (lo + hi) / 2; if (eye * (1 - m) - PT.delta(x * m, z * m, fz, true) > 0) lo = m; else hi = m; }
        HK = hi;
        return PT.near(x * hi, z * hi, 0) ? 1 : 0;        // (away from the path the hall's own snow lies over it)
      }
      prev = k;
      k += clamp(g / (eye * 1.25), minStep, maxStep);
    }
    return -1;
  }
  function pathHit1(x, z, fz, r0) {
    if (!PT.near(x, z, r0 * (kB - kA) + 0.5)) return 0;
    // steps of about a pixel over the stretch of screen the path's depth covers here, then halving to the surface
    var parPx = (kB - kA) * eye * F / z * res, n = clamp(Math.ceil(parPx / 2) + 2, 3, 64);
    var prevK = kA;
    if (eye * (1 - kA) - PT.delta(x * kA, z * kA, fz, true) <= 0) { HK = kA; return 1; }
    for (var q = 1; q <= n; q++) {
      var kk = kA + (kB - kA) * q / n;
      if (eye * (1 - kk) - PT.delta(x * kk, z * kk, fz, true) <= 0) {
        var lo = prevK, hi = kk;
        for (var b = 0; b < 6; b++) { var m = (lo + hi) / 2; if (eye * (1 - m) - PT.delta(x * m, z * m, fz, true) > 0) lo = m; else hi = m; }
        HK = hi; return 1;
      }
      prevK = kk;
    }
    HK = kB; return 1;
  }
  function pathPixel(i, j, x, z, fz) {
    var hx = x * HK, hz = z * HK, fzz = fz * HK * HK;
    var dz0 = PT.delta(hx, hz, fzz), Q = PT.Q, fl = Q.floor, far = Q.far, aa = Q.a;
    var dk = 1 - fl;
    var h0 = heightAt(hx, hz, o, fzz, dk), gx = (heightAt(hx + eps, hz, o, fzz, dk) - h0) / eps, gz = (heightAt(hx, hz + eps, o, fzz, dk) - h0) / eps;
    if (!far) {
      // the path's own slopes, found over about a pixel (finer than that they would only flicker)
      var e2 = clamp(Math.min(z / F / res, fzz) * 0.6, 0.012, 0.25);
      gx += (PT.delta(hx + e2, hz, fzz) - PT.delta(hx - e2, hz, fzz)) / (2 * e2);
      gz += (PT.delta(hx, hz + e2, fzz) - PT.delta(hx, hz - e2, fzz)) / (2 * e2);
    }
    var nx = -gx, nz = gz, nl = Math.sqrt(nx * nx + 1 + nz * nz), ny = 1 / nl;
    nx /= nl; nz /= nl;
    // the sun, unless the path's wall stands between (a soft shadow; the footprints are too shallow to cast one that
    // shows: they are shaded by their slopes alone); averaged along the stretch of ground one pixel covers when that is
    // long (seen nearly edge-on far away)
    var sv = 1, skv = 1;
    if (!far && aa < 1.6) {
      if (pShade > 0) {
        var span = Math.min(fzz, 2), ns = span > 0.15 ? 2 : 1, acc = 0, fzS = Math.max(fzz, 0.25);
        for (var q = 0; q < ns; q++) {
          var off = ns > 1 ? ((q + 0.5) / ns - 0.5) * span : 0, qz = hz + off, qx = hx * qz / hz;
          acc += PT.sun(qx, qz, PT.delta(qx, qz, fzS, true), Ls, fzS);
        }
        sv = 1 - pShade * (1 - acc / ns);
      }
      skv = PT.sky(hx, hz, PT.delta(hx, hz, fzz, true), fzz);
    }
    var dl0 = Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]), dl = dl0 * clamp(sv, 0, 1);
    // light thrown back into the shade by the sunlit snow all round (and through the snow's own thin edges): a shadow
    // on snow is lighter than the sky's light alone would make it
    if (pBounce > 0) dl += pBounce * Math.max(0, dlFlat - dl);
    var sk = (0.5 + 0.5 * ny) * skv;
    var hzv = clamp((1 - Math.exp(-Math.pow(hz / hazeM, 1.6))) * o.haze + smooth(8, 0, F * eye / hz) * 0.7, 0, 1);
    var gfar = 1 - Math.exp(-hz / 70), sx = (i + 0.5) / res;
    var kk2 = (i + j * gw) * 4, g = gs ? 1 + (hash(i, j, 5) - 0.5) * 0.035 * gs * (1 + fl) : 1;
    // trodden snow: packed and a little greyer and cooler than the fresh snow round it. Its footprints shade it too, but
    // they grow smaller than a pixel with distance and fade out (winterpath.js): their shading is kept as a tone, so the
    // floor stays the same grey-blue all the way to the hall (and the near wall's lip shows against it)
    var alb = 1 - 0.07 * pGrey * fl, cool = 0.1 * pGrey * fl;
    // (and after the roll-off toward white, a fixed grey-blue tint for packed snow, so it reads the same at every
    // distance: far away, where the floor is lit nearly as bright as the snow round it, the roll-off squeezed the
    // difference away and the far floor went as white as the fresh snow, its near wall's lip lost against it)
    var tk = fl * pGrey * 2, tint0 = 1 - 0.065 * tk, tint1 = 1 - 0.045 * tk, tint2 = 1 - 0.015 * tk;
    // (shaded at every distance as the far snow round it is: level snow's brightness rolled off toward white, the light of the
    // wall or floor laid on as a ratio in the blue of the snow's shade; drawn the old way, the wall's shadow came out
    // grey against the blue-shaded snow beside it)
    var wFp = 1, rLp = farRatio(dl, sk * (1 - 0.04 * pGrey * fl)) * alb;
    for (var ch = 0; ch < 3; ch++) {
      var sc = lerp(snow[ch], shade[ch] * 1.15, cool) * alb;
      var v = sc * sun[ch] * dl * 1.25 + shade[ch] * sk * (1 - 0.04 * pGrey * fl);
      if (v > 226) v = 226 + (v - 226) * 26 / (v - 226 + 26);
      var gl = glowCol[ch] * o.glow * vis * gfar * 0.22 * Math.exp(-Math.pow((sx - o.sunX) / (W * 0.42), 2));
      var vOld = tone(lerp(v, mist[ch], hzv) + gl);
      if (wFp > 0) {
        var vF = snow[ch] * sun[ch] * dlFlat * 1.25 + shade[ch];
        if (vF > 226) vF = 226 + (vF - 226) * 26 / (vF - 226 + 26);
        var rkp = rLp < 1 ? shadeMul(Math.min(1 - rLp, 0.45) * 0.75, ch) : 1 + (rLp - 1) * 0.3 * (1 - hzv);
        vOld = lerp(vOld, tone(lerp(vF, mist[ch], hzv) + gl) * rkp, wFp);
      }
      D[kk2 + ch] = clamp(vOld * g * (ch === 0 ? tint0 : ch === 1 ? tint1 : tint2), 0, 255);
    }
    D[kk2 + 3] = 255;
  }
  function row(j) {
    var sy = y0 + (j + 0.5) / res, d = sy - hy;
    if (d <= 0.3) d = 0.3;
    var z = eye * F / d, fz = eye * F / (d * d) / Math.max(0.3, res / PR);
    var hz = clamp((1 - Math.exp(-Math.pow(z / hazeM, 1.6))) * o.haze + smooth(8, 0, d) * 0.7, 0, 1);
    var gfar = 1 - Math.exp(-z / 70);
    for (var i = 0; i < gw; i++) {
      var sx = (i + 0.5) / res, x = (sx - W / 2) * z / F;
      // the trodden path (winterpath.js): where it may be seen here, the line of sight is followed down into it
      if (PT && pathHit(x, z, fz)) { pathPixel(i, j, x, z, fz); nPath++; continue; }
      var h0 = heightAt(x, z, o, fz), hx = (heightAt(x + eps, z, o, fz) - h0) / eps, hzz = (heightAt(x, z + eps, o, fz) - h0) / eps;
      // the slope's normal, x right, y up, z toward you
      var nx = -hx, ny = 1, nz = hzz, nl = Math.sqrt(nx * nx + 1 + nz * nz);
      nx /= nl; ny /= nl; nz /= nl;
      var dl = Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]), sk = 0.5 + 0.5 * ny;
      var k = (i + j * gw) * 4, g = gs ? 1 + (hash(i, j, 5) - 0.5) * 0.035 * gs : 1;
      // (far away the brightness is found for level snow, rolled off toward white, and the slope's light laid over it as
      // a ratio of brightness: rolled off with the rest, the far snow's shading was squeezed to a third and it read as
      // plain white. Near you, where it showed, the snow is drawn exactly as before)
      var wF = smooth(45, 110, z), rL = farRatio(dl, sk) , rk = 1 + (rL - 1) * 0.6 * (1 - hz);
      for (var ch = 0; ch < 3; ch++) {
        var vA = snow[ch] * sun[ch] * dl * 1.25 + shade[ch] * sk, vF = snow[ch] * sun[ch] * dlFlat * 1.25 + shade[ch];
        if (vA > 226) vA = 226 + (vA - 226) * 26 / (vA - 226 + 26);
        if (vF > 226) vF = 226 + (vF - 226) * 26 / (vF - 226 + 26);
        // the low sun's warmth on the far snow under it
        var gl = glowCol[ch] * o.glow * vis * gfar * 0.22 * Math.exp(-Math.pow((sx - o.sunX) / (W * 0.42), 2));
        // (where a slope gets less light than level snow, it is darkened by its own colour of light: less of the warm sun,
        // the sky's blue left, so its shade is blue as near you; where it gets more, by brightness alone, so no yellow)
        var rkc = rL < 1 ? shadeMul(Math.min(1 - rL, 0.15) * 0.7, ch) : 1 + (rL - 1) * 0.3 * (1 - hz);
        var vOld = tone(lerp(vA, mist[ch], hz) + gl), vNew = tone(lerp(vF, mist[ch], hz) + gl) * rkc;
        D[k + ch] = clamp(lerp(vOld, vNew, wF) * g, 0, 255);
      }
      D[k + 3] = 255;
    }
  }
  function finish() {
    tc.putImageData(im, 0, 0);
    // onto the ground's picture, soft
    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
    c.drawImage(tmp, 0, 0, gw, gh, 0, y0 * PR, W * PR, (H - y0) * PR);
    tmp.width = tmp.height = 1;
    c.setTransform(PR, 0, 0, PR, 0, 0);
    // the sparkle of snow crystals in the sun: a few bright points, more and larger near you
    var r = rng((o.seed || 7) * 131 + 3), nsp = Math.round(1800 * (o.sparkle || 0) * vis);
    for (var q = 0; q < nsp; q++) {
      var v2 = Math.pow(r(), 0.6), yy = hy + 4 + (H - hy - 4) * v2, xx = r() * W;
      var sz = lerp(0.35, 1.1, v2) * lerp(0.6, 1.2, r());
      var spA = lerp(0.25, 0.85, r()) * lerp(0.5, 1, v2);
      if (PT) {                                            // packed snow on the path's floor hardly sparkles
        var zq = eye * F / Math.max(0.3, yy - hy), xq = (xx - W / 2) * zq / F;
        if (PT.near(xq, zq, 0)) { PT.delta(xq, zq, 1); spA *= 1 - 0.85 * PT.Q.floor; }
      }
      c.fillStyle = rgb(mix([255, 255, 255], glowCol, 0.25), spA);
      c.fillRect(xx, yy, sz, sz);
    }
    // the lake cut out of the snow
    c.globalCompositeOperation = 'destination-out';
    polyPath(c, Sh.pts); c.fillStyle = '#000'; c.fill();
    c.globalCompositeOperation = 'source-over';
    drawBanks(c, o);
    c.restore();
  }
  var j = 0, done = false, cpu = 0;
  return {
    step: function (ms) {
      if (done) return true;
      var t0 = performance.now(), lim = ms === undefined ? Infinity : t0 + ms;
      while (j < gh) { row(j++); if (performance.now() > lim) { cpu += performance.now() - t0; return false; } }
      finish(); done = true; cpu += performance.now() - t0; return true;
    },
    cancel: function () { done = true; },
    info: function () { return { rows: gh, pathPixels: nPath, cpu: cpu }; },
    // (for checking: what the line of sight through a point of the screen (CSS px) meets)
    probe: function (sx, sy) {
      var d = Math.max(0.3, sy - hy), z = eye * F / d, x = (sx - W / 2) * z / F, fz = eye * F / (d * d) / Math.max(0.3, res / PR);
      var r = { z: z, x: x }; if (!PT) return r;
      r.box = PT.riseBox || null; r.rise = PT.riseBox ? riseHit(x, z, fz) : -2; r.HKrise = HK;
      r.hit = pathHit(x, z, fz); r.HK = HK; r.near = PT.near(x * HK, z * HK, 0);
      r.delta = PT.delta(x * HK, z * HK, fz, true); r.a = PT.Q.a; r.far = PT.Q.far; r.ray = eye * (1 - HK);
      return r;
    }
  };
}
/* How much a thing at screen height y is hazed into the mist (as the ground is). */
function hazeAt(o, y) {
  var z = o.eye * o.F / Math.max(0.3, y - o.hy);
  return clamp((1 - Math.exp(-Math.pow(z / (o.hazeM || 150), 1.6))) * o.haze, 0, 1);
}
/* A colour hazed into the mist by its distance: a gradient down the screen. */
function hazeGrad(c, o, col, k) {
  var g = c.createLinearGradient(0, o.hy, 0, o.H);
  for (var q = 0; q <= 8; q++) { var u = Math.pow(q / 8, 2), y = lerp(o.hy, o.H, u); g.addColorStop(u, rgb(mix(col, o.mist, hazeAt(o, y) * k))); }
  return g;
}
/* Snow facing up and toward the sun. */
function litSnow(o) {
  var s = o.snow, sun = o.light.sun, L = o.light.dir, sh = o.shade, dl = Math.max(0.25, L[1] + 0.3), out = [];
  for (var k = 0; k < 3; k++) { var v = s[k] * sun[k] * dl * 1.25 + sh[k]; if (v > 226) v = 226 + (v - 226) * 26 / (v - 226 + 26); out.push(v); }
  return out;
}
/* The banks' faces (inside the hole, under the snow's edge) and the snow's lip along every shore. */
function drawBanks(c, o) {
  var Sh = o.shore, P = Sh.pts, R = Sh.rim, Wg = Sh.wgt, N = Sh.nrm, n = P.length, hy = o.hy, H = o.H;
  var r = rng((o.seed || 7) * 577 + 9), sky = o.shade, earth = o.earth, mist = o.mist;
  var sunTop = o.light.sun, L = o.light.dir;
  // the face's colours: earth in shade (it faces you, the sun is behind it), hazed with distance
  function far(y) { return hazeAt(o, y); }
  c.save();
  polyPath(c, P); c.clip();
  // 1. the earth face, between the snow's edge and the waterline
  c.beginPath();
  for (var i = 0; i < n; i++) { if (i) c.lineTo(P[i][0], P[i][1]); else c.moveTo(P[i][0], P[i][1]); }
  for (i = n - 1; i >= 0; i--) c.lineTo(P[i][0], P[i][1] + R[i]);
  c.closePath();
  var e0 = mix(earth, sky, 0.18);
  c.fillStyle = hazeGrad(c, o, e0, 0.9); c.fill();
  // stones, roots and clods in the face: uneven dabs, lighter and darker, never in a row
  for (i = 0; i < n; i += 1) {
    var t = R[i];
    if (t < 2 || r() > 0.35) continue;
    var hz = far(P[i][1]), x = P[i][0] + (r() - 0.5) * 3, yc = P[i][1] + t * lerp(0.6, 0.92, r());
    var light = r() < 0.45, rx = t * lerp(0.08, 0.3, r()), ry = t * lerp(0.05, 0.14, r());
    c.fillStyle = rgb(mix(light ? mix(earth, [170, 160, 150], 0.4) : [34, 28, 26], mist, hz * 0.85), lerp(0.3, 0.7, r()));
    c.beginPath(); c.ellipse(x, yc, rx, ry, (r() - 0.5) * 0.6, 0, TAU); c.fill();
  }
  // 2. the snow lying on the bank, seen from the front where it ends: a thick rounded cushion over the earth (about
  //    half the face), lit along its top, turning blue as it curves under, a dark crease where it overhangs the earth
  var lipC = litSnow(o), deep = mix(sky, [104, 114, 156], 0.35);
  var bandC = [mix(lipC, sky, 0.1), mix(lipC, sky, 0.3), mix(lipC, sky, 0.55), mix(lipC, sky, 0.85), mix(sky, deep, 0.6)];
  function fr(q) { return lerp(0.5, 0.68, vn(q / 9, 2.5, 41)); }
  for (var bk = 0; bk < 5; bk++) {
    c.beginPath();
    for (i = 0; i < n; i++) { var yA = P[i][1] + R[i] * fr(i) * bk / 5; if (i) c.lineTo(P[i][0], yA); else c.moveTo(P[i][0], yA); }
    for (i = n - 1; i >= 0; i--) c.lineTo(P[i][0], P[i][1] + R[i] * fr(i) * (bk + 1) / 5 + 0.4);
    c.closePath();
    c.fillStyle = hazeGrad(c, o, bandC[bk], 0.85); c.fill();
  }
  c.lineJoin = 'round'; c.lineCap = 'round';
  for (i = 1; i < n; i++) {
    var t1 = R[i];
    if (t1 < 1) continue;
    c.strokeStyle = rgb(mix([46, 42, 58], mist, far(P[i][1]) * 0.8), 0.4);
    c.lineWidth = Math.max(0.6, t1 * 0.1);
    c.beginPath(); c.moveTo(P[i - 1][0], P[i - 1][1] + R[i - 1] * fr(i - 1)); c.lineTo(P[i][0], P[i][1] + t1 * fr(i)); c.stroke();
  }
  // 3. the wet dark line at the waterline
  for (i = 1; i < n; i++) {
    if (R[i] < 0.6) continue;
    c.strokeStyle = rgb(mix([24, 22, 24], mist, far(P[i][1]) * 0.7), 0.55);
    c.lineWidth = Math.max(0.5, R[i] * 0.1);
    c.beginPath(); c.moveTo(P[i - 1][0], P[i - 1][1] + R[i - 1]); c.lineTo(P[i][0], P[i][1] + R[i]); c.stroke();
  }
  c.restore();
  // 4. on the snow: the bright rounded lip along the banks you face, and where the snow is in front of the water,
  //    its edge curving away down out of sight (a soft blue shade along it)
  var lip = mix(litSnow(o), [255, 255, 255], 0.3);
  c.save();
  c.lineCap = 'round';
  for (i = 1; i < n; i++) {
    var a = P[i - 1], b = P[i], d = Math.max(1, b[1] - hy), w = (Wg[i - 1] + Wg[i]) / 2, hz2 = far(b[1]);
    if (b[1] > H + 4 || a[0] > o.W + 4 || b[0] < -4) continue;
    if (w > 0.05) {
      // the lip catches the light; just behind it, the snow rounds over (a faint shade)
      c.strokeStyle = rgb(mix(sky, mist, hz2), 0.16 * w);
      c.lineWidth = Math.max(1, d * 0.03);
      var ox = N[i][0] * d * 0.012, oy = N[i][1] * d * 0.012;
      c.beginPath(); c.moveTo(a[0] + ox, a[1] + oy); c.lineTo(b[0] + ox, b[1] + oy); c.stroke();
      c.strokeStyle = rgb(mix(lip, mist, hz2 * 0.6), 0.85 * w);
      c.lineWidth = Math.max(0.6, d * 0.008);
      c.beginPath(); c.moveTo(a[0], a[1] + 0.3); c.lineTo(b[0], b[1] + 0.3); c.stroke();
    }
    if (w < 0.6) {
      var k = 1 - w / 0.6;
      // the snow falling away to the water: a soft blue band inside the edge, darkest at the edge
      for (var s = 0; s < 3; s++) {
        var off = d * (0.01 + s * 0.014);
        c.strokeStyle = rgb(mix(sky, mist, hz2), (0.09 - s * 0.025) * k);
        c.lineWidth = Math.max(1, d * (0.014 + s * 0.014));
        c.beginPath(); c.moveTo(a[0] + N[i][0] * off, a[1] + N[i][1] * off); c.lineTo(b[0] + N[i][0] * off, b[1] + N[i][1] * off); c.stroke();
      }
    }
  }
  c.restore();
}

/* ---------- the water's mirror ---------- */
/* o: W, H, hy, top (CSS px: the water's top), pad, res (device px per CSS px), mtn (the mountains' picture, the whole
   screen, or null), skyAt(y) → rgb (the sky at height y, CSS px), shore, earth, snowLit, mist, haze, eye, F, hazeM,
   before(c) (optional: draws what stands beyond the water, turned over, before the banks) */
function bakeMirror(c, o) {
  var W = o.W, H = o.H, hy = o.hy, top = o.top, pad = o.pad, res = o.res;
  c.setTransform(res, 0, 0, res, pad * res, -top * res);
  // the sky turned over: the row at y shows the sky at 2·hy − y
  var g = c.createLinearGradient(0, top, 0, H);
  for (var k = 0; k <= 8; k++) { var y = lerp(top, H, k / 8); g.addColorStop(k / 8, rgb(o.skyAt(2 * hy - y))); }
  c.fillStyle = g; c.fillRect(-pad, top, W + pad * 2, H - top + 2);
  // the mountains and Fuji turned over about the eye line
  if (o.mtn && o.mtn.width > 2) {
    c.save();
    c.setTransform(res, 0, 0, -res, pad * res, (2 * hy - top) * res);
    c.globalAlpha = o.mtnAlpha === undefined ? 1 : o.mtnAlpha;
    c.drawImage(o.mtn, 0, 0, W, H);
    c.restore();
    c.setTransform(res, 0, 0, res, pad * res, -top * res);
  }
  // what stands on the land beyond the water (the right bank's trees), turned over by the caller: before the banks,
  // which are nearer and hide its foot
  if (o.before) { c.save(); o.before(c); c.restore(); c.setTransform(res, 0, 0, res, pad * res, -top * res); }
  // the banks turned over about their waterlines: the earth face as tall again below it, then the front of the snow's
  // cushion, then the first of the snow beyond, fading into the sky's reflection (each one continuous strip)
  var Sh = o.shore, P = Sh.pts, R = Sh.rim, n = P.length;
  function strip(f0, f1, col, a) {
    c.beginPath();
    for (var i = 0; i < n; i++) { var y = P[i][1] + R[i] * (1 + f0); if (i) c.lineTo(P[i][0], y); else c.moveTo(P[i][0], y); }
    for (i = n - 1; i >= 0; i--) c.lineTo(P[i][0], P[i][1] + R[i] * (1 + f1));
    c.closePath();
    c.fillStyle = hazeGrad(c, o, col, 0.85); c.globalAlpha = a; c.fill(); c.globalAlpha = 1;
  }
  c.save();
  polyPath(c, P); c.clip();
  strip(-0.05, 0.5, mix(o.earth, [92, 98, 118], 0.45), 0.85);
  strip(0.5, 1.05, scaleC(o.snowLit, 0.92), 0.9);
  strip(1.05, 1.6, scaleC(o.snowLit, 0.86), 0.45);
  c.restore();
  c.setTransform(1, 0, 0, 1, 0, 0);
}
function scaleC(a, k) { return [a[0] * k, a[1] * k, a[2] * k]; }

/* ---------- what lies still on the water ---------- */
/* Thin ice along the shores (a pale skin that does not ripple, wider where the water is quiet, broken into a few
   plates at its edge), and a low mist on the far water. o: W, H, PR, hy, F, eye, shore, ice (0 … 1), iceWidth (m),
   mist (rgb), mistK (0 … 1), skyLight (rgb: the light the ice shows), snowLit, seed */
function bakeStill(c, o) {
  var W = o.W, H = o.H, hy = o.hy, F = o.F, eye = o.eye || 3, Sh = o.shore, P = Sh.pts, R = Sh.rim, N = Sh.nrm, n = P.length;
  var r = rng((o.seed || 7) * 911 + 5);
  c.save();
  c.setTransform(o.PR, 0, 0, o.PR, 0, 0);
  polyPath(c, P); c.clip();
  if (o.ice > 0) {
    // the ice's outer edge: out from the waterline across the water, by its width on the ground (seen from there)
    var B = [], O = [], arc = 0;
    for (var i = 0; i < n; i++) {
      if (i) arc += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]);
      var d = Math.max(0.5, P[i][1] + R[i] - hy), s = o.iceWidth / eye * Math.max(0, 0.35 + 0.9 * fbm(arc / 60, 7.5, 61, 3));
      var bx = P[i][0], by = P[i][1] + R[i];
      B.push([bx, by]);
      // across the water: sideways as far as it is wide, in depth foreshortened (d / F as much)
      O.push([bx - N[i][0] * s * d, by - N[i][1] * s * d * Math.max(d / F, 0.08)]);
    }
    var iceC = mix(o.skyLight, [236, 240, 248], 0.5);
    c.beginPath();
    for (i = 0; i < n; i++) { if (i) c.lineTo(B[i][0], B[i][1]); else c.moveTo(B[i][0], B[i][1]); }
    for (i = n - 1; i >= 0; i--) c.lineTo(O[i][0], O[i][1]);
    c.closePath();
    c.fillStyle = rgb(iceC, 0.42 * o.ice); c.fill();
    // the ice's edge catching the light, and the dark water just beyond it
    c.lineJoin = 'round'; c.lineCap = 'round';
    for (i = 1; i < n; i++) {
      var dd = Math.max(1, O[i][1] - hy);
      c.strokeStyle = rgb(mix(iceC, [255, 255, 255], 0.5), 0.3 * o.ice); c.lineWidth = Math.max(0.5, dd * 0.006);
      c.beginPath(); c.moveTo(O[i - 1][0], O[i - 1][1]); c.lineTo(O[i][0], O[i][1]); c.stroke();
      c.strokeStyle = rgb([60, 70, 92], 0.08 * o.ice); c.lineWidth = Math.max(0.5, dd * 0.008);
      c.beginPath(); c.moveTo(O[i - 1][0], O[i - 1][1] + dd * 0.006); c.lineTo(O[i][0], O[i][1] + dd * 0.006); c.stroke();
    }
    // a few loose plates just off the edge, and fine cracks in the ice
    for (i = 0; i < n; i += 3) {
      var d3 = Math.max(1, O[i][1] - hy), sz = d3 * 0.05 * lerp(0.4, 1, r());
      if (sz < 1.2 || r() > 0.22 * o.ice) continue;
      var px = O[i][0] - N[i][0] * sz * lerp(0.8, 2.5, r()), py = O[i][1] - N[i][1] * sz * 0.3 * lerp(1, 3, r()) + sz * 0.1;
      c.fillStyle = rgb(iceC, 0.4 * o.ice);
      c.beginPath(); c.ellipse(px, py, sz, sz * Math.max(0.12, d3 / F * 1.2), (r() - 0.5) * 0.3, 0, TAU); c.fill();
      c.strokeStyle = rgb([255, 255, 255], 0.35 * o.ice); c.lineWidth = 0.6; c.stroke();
    }
    c.strokeStyle = rgb([255, 255, 255], 0.22 * o.ice); c.lineWidth = 0.5;
    for (i = 0; i < n; i += 2) {
      if (r() > 0.25) continue;
      var a2 = B[i], b2 = O[i], u0 = r() * 0.3, u1 = lerp(0.5, 1, r());
      c.beginPath(); c.moveTo(lerp(a2[0], b2[0], u0), lerp(a2[1], b2[1], u0)); c.lineTo(lerp(a2[0], b2[0], u1) + (r() - 0.5) * 4, lerp(a2[1], b2[1], u1)); c.stroke();
    }
  }
  // the low mist lying on the far water
  if (o.mistK > 0) {
    var gm = c.createLinearGradient(0, Sh.top, 0, Sh.top + (H - hy) * 0.35);
    gm.addColorStop(0, rgb(o.mist, 0.55 * o.mistK)); gm.addColorStop(1, rgb(o.mist, 0));
    c.fillStyle = gm; c.fillRect(0, Sh.top - 2, W, (H - hy) * 0.35 + 2);
  }
  c.restore();
}

/* ---------- steam off the water ---------- */
/* Cold air over warmer water: thin wisps rise off it, drift with the wind and thin out. Each wisp starts at a spot on
   the water, grows and rises as it goes, and is drawn as soft as the mist (its size from its distance). Drawn over
   the banks too (a wisp rising in front of a far bank is seen against it), but never over the snow in front of the
   water. S: the state (kept by the page); o: W, H, PR, hy, eye, shore, steam (0 … 1), rise, wind (−… +), colour (rgb). */
function steamSprite() {
  var cn = document.createElement('canvas'); cn.width = 128; cn.height = 64;
  // (the gradient is given in the stretched space: its middle at 32, 32 there is the picture's middle)
  var x = cn.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,0.5)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.setTransform(2, 0, 0, 1, 0, 0); x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  return cn;
}
function tinted(S, col) {
  var key = col.map(Math.round).join(',');
  if (S.tintKey === key && S.tint) return S.tint;
  var src = S.spr || (S.spr = steamSprite()), cn = document.createElement('canvas'); cn.width = src.width; cn.height = src.height;
  var x = cn.getContext('2d'); x.drawImage(src, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = rgb(col); x.fillRect(0, 0, cn.width, cn.height);
  S.tint = cn; S.tintKey = key;
  return cn;
}
function steam(S, c, o, t, dt) {
  var Sh = o.shore, hy = o.hy, H = o.H, want = Math.round(22 * o.steam);
  if (!S.list) S.list = [];
  if (want <= 0 || !Sh) return;
  var L = S.list;
  while (L.length < want) {
    // a spot on the water (the nearer, the fewer: far wisps are smaller, and many together read as the mist)
    for (var tries = 0; tries < 12; tries++) {
      var x = Math.random() * o.W, y = lerp(Sh.top + 2, H, Math.pow(Math.random(), 1.6));
      if (Sh.inside(x, y)) { L.push({ x: x, y: y, age: L.length < want && !S.started ? Math.random() * 10 : 0, life: lerp(8, 14, Math.random()), s: lerp(0.7, 1.3, Math.random()), ph: Math.random() * TAU }); break; }
    }
    if (tries >= 12) break;
  }
  S.started = true;
  var spr = tinted(S, o.colour);
  c.save();
  c.setTransform(o.PR, 0, 0, o.PR, 0, 0);
  // where the steam may show: the water, and above it as far as it rises (not the snow in front of it)
  var P = Sh.pts, lift = (H - hy) * 0.12 * o.rise;
  c.beginPath();
  for (var i = 0; i < P.length; i++) { if (i) c.lineTo(P[i][0], P[i][1]); else c.moveTo(P[i][0], P[i][1]); } c.closePath();
  for (i = 0; i < P.length; i++) { var up = lift * Math.max(0.2, (P[i][1] - hy) / (H - hy)); if (i) c.lineTo(P[i][0], P[i][1] - up); else c.moveTo(P[i][0], P[i][1] - up); } c.closePath();
  c.clip('nonzero');
  for (i = L.length - 1; i >= 0; i--) {
    var w = L[i];
    w.age += dt;
    if (w.age > w.life || i >= want) { L.splice(i, 1); continue; }
    var k = w.age / w.life, d = Math.max(1, w.y - hy), env = Math.sin(k * PI);
    var sz = d * 0.55 * w.s * (0.6 + 0.8 * k);
    var x2 = w.x + o.wind * d * 0.05 * w.age + Math.sin(t * 0.4 + w.ph) * d * 0.02;
    var y2 = w.y - d * 0.11 * o.rise * w.age / 6;
    c.globalAlpha = clamp(env * 0.42 * o.steam * (0.6 + 0.4 * Math.sin(t * 0.7 + w.ph)), 0, 1);
    c.drawImage(spr, x2 - sz, y2 - sz * 0.32, sz * 2, sz * 0.64);
  }
  c.restore();
}

return { shore: shore, bakeGround: bakeGround, groundJob: groundJob, bakeMirror: bakeMirror, bakeStill: bakeStill, steam: steam, heightAt: heightAt, SHADE_W: SHADE_W, shadeMul: shadeMul };
})();
