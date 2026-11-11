/* ============================================================
   WINTERHALL — the shrine hall (本堂) under snow and the firs beside it,
   for the new winter scene (newwinter.html, step 5). Written new; the
   pagoda in winterhill.js was the reference for the method, and its
   mistakes are avoided (see the notes in CLAUDE.md, "Gotchas").

   The hall is built in metres and seen through the scene's own camera
   (the eye on the horizon line, the mountains' lens): where it stands on
   the screen and how wide its roof is there say how far away it is and
   how high its ground is (a little below the eye: it stands on a low
   rise above the snow field, and the rise's front slope is part of it).

   The roof is a hipped roof (寄棟) with deep eaves, gently concave
   slopes and corners turned up a little. Its snow is not built from flat
   faces: the snow's surface is a smooth height field over the roof
   (thicker or thinner in soft drifts, rounded over the ridge and the
   hips, ending in a rounded lip that hangs over the eaves), and every
   pixel of it is found by following the line of sight to it and lit
   from its own slope with the scene's light, as the snow ground is
   lit (winterlake.js). The snow round the hall is done the same way:
   banked against the stone base, the level ground it stands on and the
   rise's slope down to the field, with the shadows of the hall and the
   firs cast on it along the sun's direction (found pixel by pixel), the
   shade under the eaves, and after dusk the lamplight from the door and
   windows spilling onto it.

   The timber and plaster are faces with Newell's normals, shaded across
   (no flat colours), the walls darkened under the deep eaves (the sky's
   light is cut off there) and, where the sun reaches a wall, the eave's
   shadow cast on it at the height the sun's angle gives.

     WinterHall.job(o)  → { step(ms) → true when finished, canvas, x, y (CSS px of its corner), cancel(), info }
   o: W, H, PR, cam { F, cx, hy } (CSS px), place { x0, x1, foot } (the roof's ends across and the snow's level at the
      front of the base, CSS px), yaw (radians; + turns its right end toward you), eye (m above the field),
      snow, eave, roof, sori (×), haze (0 … 1, on the hall), footMist (0 … 1.5: the low mist at its foot), shadow (0 … 1.5),
      lit (0 … 1.5: its lamps), spill (0 … 2: their light on the snow), lampCol [r, g, b],
      light { sun: [x, y, z] toward the sun (x right, y up, z toward you), sunCol, skyCol, amb, haze: [r, g, b] mist },
      field { snow, sun, shade, groundMist, haze, hazeM, glow, sunX, sunRGB, vis } (as the snow ground is baked),
      firs [{ x, foot, h, seed, haze }] (CSS px), firLook { … WinterHill.fir's look }
   ============================================================ */
var WinterHall = (function () {
'use strict';

var PI = Math.PI, TAU = PI * 2;
function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
function smooth(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
function mix(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }
function hex(h) { var n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function css(c, a) {
  return 'rgba(' + Math.round(clamp(c[0], 0, 255)) + ',' + Math.round(clamp(c[1], 0, 255)) + ',' + Math.round(clamp(c[2], 0, 255)) + ',' +
         (a === undefined ? 1 : clamp(a, 0, 1).toFixed(3)) + ')';
}
function norm(v) { var l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function hash(i, j, s) { var h = Math.sin(i * 127.1 + j * 311.7 + s * 74.7) * 43758.5453; return h - Math.floor(h); }
// a soft |v| (rounds the crease where two slopes meet) and a soft minimum (rounds the hips)
function sabs(v, k) { return Math.sqrt(v * v + k * k); }
function smin(a, b, k) { var h = clamp(0.5 + 0.5 * (b - a) / k, 0, 1); return lerp(b, a, h) - k * h * (1 - h); }

/* light on a timber or plaster surface: the sun on the side turned to it, the sky from above (as winterhill.js) */
// plus the light thrown up off the snow all round (a wall in the shade of a snowy place is lit from below by the snow)
function shadeC(base, n, L, sunK) {
  var d = Math.max(0, dot(n, L.sunW)) * (sunK === undefined ? 1 : sunK), s = (0.55 + 0.45 * n[1]) * L.amb, g = 0.5 - 0.5 * n[1];
  var out = [0, 0, 0];
  for (var ch = 0; ch < 3; ch++) {
    var snowLit = 0.85 * (L.sunCol[ch] * Math.max(0, L.sunW[1]) + L.skyCol[ch] * L.amb * 0.8);   // the snow's own light (albedo 0.85)
    out[ch] = base[ch] * (L.sunCol[ch] * d + L.skyCol[ch] * s + snowLit * g * 0.55);
  }
  return out;
}

var PAL = { plaster: hex('#E8DDC8'), post: hex('#4B2E22'), beam: hex('#553326'), floor: hex('#3A2620'), stone: hex('#9C978F'),
            soffit: hex('#5A3828'), bracket: hex('#6E4430'), fascia: hex('#2E2A2E'), step: hex('#8E8A84'),
            paper: hex('#EDE6D6'), lattice: hex('#3A2419') };
var GLOW = [255, 182, 96];

function job(o) {
  var F = o.cam.F, cx = o.cam.cx, hy = o.cam.hy, PR = o.PR || 1, W = o.W, H = o.H;
  var snowK = o.snow === undefined ? 1 : o.snow, lit = clamp(o.lit || 0, 0, 1.5), lampCol = o.lampCol || GLOW;
  var shadowK = o.shadow === undefined ? 1 : o.shadow, spill = o.spill === undefined ? 1 : o.spill;
  var hz = o.haze || 0, mistC = o.light.haze;

  /* ---------- the hall, in metres: x across its front (right +), y up from the snow at its foot, z toward its back ---------- */
  var ww = 7.0, wd = 4.6;                               // the walls: 14 m × 9.2 m (five bays by three)
  var fh = 1.0, bw = ww + 1.3, bd = wd + 1.3;           // the stone base (基壇) and the floor on it
  var wallTop = 4.3, brTop = 4.85, brOut = 0.35;        // the walls' top; the band of brackets under the eaves
  var eaveBot = 5.0, edgeY = 5.32;                       // the fascia's foot and top at the eave
  var ov = 3.0 * (o.eave || 1), ex = ww + ov, ez = wd + ov;
  var rise = 4.3 * (o.roof || 1), rl = 0.38 * ex, lift = 0.4 * (o.sori === undefined ? 1 : o.sori);
  var Tn = 0.38 * snowK, dr = 0.3, lo = Math.max(0.05, 0.8 * Tn);
  var stepN = 3, stepD = 0.34, stepW = 1.7;               // the steps up to the door
  var yaw = o.yaw || 0, cs = Math.cos(yaw), sn = Math.sin(yaw);
  var X = 0, Y0 = -1, Z = 200;
  function Wp(x, y, z) { return [X + x * cs + z * sn, Y0 + y, Z - x * sn + z * cs]; }
  function P(p) { return [cx + F * p[0] / p[2], hy - F * p[1] / p[2]]; }
  function Pl(x, y, z) { return P(Wp(x, y, z)); }

  /* ---------- the roof: its tiles' surface, and the snow on it ---------- */
  function liftAt(ax, az) { var k = clamp(ax / ex, 0, 1) * clamp(az / ez, 0, 1); return lift * k * k * k * k * k; }
  function roofTop(x, z) {
    var ax = sabs(x, 0.35), az = sabs(z, 0.35);
    var dz = (ez - az) / ez, dx = (ex - ax) / (ex - rl);
    var d = clamp(smin(dx, dz, 0.07), 0, 1);
    return edgeY + rise * (0.45 * d + 0.55 * d * d) + liftAt(Math.abs(x), Math.abs(z));
  }
  function thick(x, z) {                                // drifts: thicker and thinner in soft waves; a little thinner at the turned-up corners
    var ax = Math.abs(x), az = Math.abs(z), k = clamp(ax / ex, 0, 1) * clamp(az / ez, 0, 1);
    return Tn * (1 + 0.1 * Math.sin(0.55 * x + 1.3) * Math.sin(0.7 * z + 0.4) + 0.05 * Math.sin(1.7 * x + 0.9 * z + 2.1)) * (1 - 0.3 * Math.pow(k, 6));
  }
  function snowTop(x, z) { return roofTop(x, z) + thick(x, z); }
  // the lip: past the eave the snow rounds over and hangs a little below the roof's edge (a rounded nose, an ellipse in section)
  function lip(x, z) {
    var ox = Math.abs(x) - ex, oz = Math.abs(z) - ez;
    var e = Math.hypot(Math.max(ox, 0), Math.max(oz, 0));
    if (e > lo) return null;
    var xc = clamp(x, -ex, ex), zc = clamp(z, -ez, ez), base = roofTop(xc, zc), T = thick(xc, zc);
    var b = (0.5 + dr) * T, c0 = base + T - b, s = Math.sqrt(Math.max(0, 1 - (e / lo) * (e / lo)));
    return { e: e, top: c0 + b * s, bot: c0 - b * s, c: c0, b: b, ux: ox > 0 ? Math.sign(x) * Math.max(ox, 0) / (e || 1) : 0, uz: oz > 0 ? Math.sign(z) * Math.max(oz, 0) / (e || 1) : 0 };
  }
  var yRoofMax = edgeY + rise + lift + Tn * 1.3;
  // 1 the ray is in the snow, 0 above it (gap: how far above), -1 it went under the roof (into the tiles or below the eaves)
  var CL = { gap: 0 };
  function roofClass(x, y, z) {
    var inX = Math.abs(x) <= ex, inZ = Math.abs(z) <= ez;
    if (inX && inZ) {
      var rt = roofTop(x, z), st = rt + thick(x, z);
      if (y > st) { CL.gap = y - st; return 0; }
      return y >= rt ? 1 : -1;
    }
    var L = lip(x, z);
    if (!L) { CL.gap = Math.max(Math.abs(x) - ex, Math.abs(z) - ez) - lo; return 0; }
    if (y > L.top) { CL.gap = Math.min(y - L.top, 0.05); return 0; }
    if (y >= L.bot) return 1;
    CL.gap = 0.03; return 0;                            // under the lip: it may still run into the fascia (then -1)
  }
  function roofNormal(x, y, z) {
    var L = (Math.abs(x) > ex || Math.abs(z) > ez) ? lip(x, z) : null;
    if (L) {
      var ne = L.e / (lo * lo), ny = (y - L.c) / (L.b * L.b);
      var nl = Math.hypot(ne, ny) || 1;
      return norm([L.ux * ne / nl, ny / nl, L.uz * ne / nl]);
    }
    var e = 0.04, h0 = snowTop(x, z);
    return norm([-(snowTop(x + e, z) - h0) / e, 1, -(snowTop(x, z + e) - h0) / e]);
  }

  /* ---------- where it stands: its roof's ends and its foot, as the screen has them ---------- */
  function roofExtents() {
    var mn = 1e9, mxx = -1e9;
    for (var side = 0; side < 4; side++) for (var u = -1; u <= 1.0001; u += 0.125) {
      var e = side === 0 ? [u * (ex + lo), -(ez + lo)] : side === 1 ? [ex + lo, u * (ez + lo)] : side === 2 ? [-u * (ex + lo), ez + lo] : [-(ex + lo), -u * (ez + lo)];
      var p = Pl(e[0], edgeY + liftAt(Math.abs(e[0]), Math.abs(e[1])) + Tn, e[1]);
      mn = Math.min(mn, p[0]); mxx = Math.max(mxx, p[0]);
    }
    return [mn, mxx];
  }
  // its size from its height on the screen (the ridge's snow to the snow at its foot: sizes follow the screen's height,
  // as every element's do), then moved across so its roof is centred where the reference has it
  var tc = (o.place.x0 + o.place.x1) / 2, th = Math.max(10, o.place.foot - o.place.top);
  for (var it = 0; it < 10; it++) {
    var hp = Pl(0, 0, -bd)[1] - Pl(0, edgeY + rise + Tn, 0)[1];
    Z *= hp / th;
    var e1 = roofExtents();
    X += (tc - (e1[0] + e1[1]) / 2) * Z / F;
    var fp = Wp(0, 0, -bd);
    Y0 = (hy - o.place.foot) * fp[2] / F;
  }
  var eyeH = o.eye || 3, drop = Math.max(0, eyeH + Y0);     // how high its ground stands above the field (the rise)
  var Lw = norm([o.light.sun[0], o.light.sun[1], -o.light.sun[2]]);          // toward the sun, in the camera's space (z away)
  var Ll = norm([Lw[0] * cs - Lw[2] * sn, Lw[1], Lw[0] * sn + Lw[2] * cs]);   // … and in the hall's own
  var Lsh = o.light.sun;                                    // (x right, y up, z toward you: the snow ground's way)
  var LP = { sunW: Lw, sunCol: o.light.sunCol, skyCol: o.light.skyCol, amb: o.light.amb };
  function toShadeN(n) { var w = [n[0] * cs + n[2] * sn, n[1], -n[0] * sn + n[2] * cs]; return [w[0], w[1], -w[2]]; }
  function toWorldN(n) { return [n[0] * cs + n[2] * sn, n[1], -n[0] * sn + n[2] * cs]; }
  var oL = [-X * cs + Z * sn, -Y0, -X * sn - Z * cs];       // the eye, in the hall's own space
  function dirL(sx, sy) { var d0 = (sx - cx) / F, d1 = (hy - sy) / F; return [d0 * cs - sn, d1, d0 * sn + cs]; }

  /* ---------- the snow round it: banked against the base, the level ground, the rise's slope down to the field ---------- */
  // the rise: a level top (a rounded oblong round the hall and the firs), then a slope of fixed length down to the field
  var TER = { x0: 0, x1: 0, z0: 0, z1: 0, slope: 14 };
  var firs = (o.firs || []).map(function (f) {
    var d = f.foot - hy, D = d > 0.3 ? -Y0 * F / d : 1e4;
    var wx = (f.x - cx) * D / F, wz = D, lx = (wx - X) * cs - (wz - Z) * sn, lz = (wx - X) * sn + (wz - Z) * cs;
    var hm = f.h * D / F;
    return { f: f, x: lx, z: lz, h: hm, r: hm * 0.3 * ((o.firLook && o.firLook.width) || 1), D: D };
  });
  (function () {
    // the rise's slope starts just in front of the stone base (the hall stands at its top), so the shadows and the
    // lamplight that fall in front of it lie on the slope you can see
    TER.z0 = -bd - 1.5; TER.z1 = ez + 6; TER.x0 = -ex - 4; TER.x1 = ex + 4;
    firs.forEach(function (T) { if (T.D < 5e3) { TER.z1 = Math.max(TER.z1, T.z + T.r + 4); TER.x1 = Math.max(TER.x1, T.x + T.r + 3); TER.x0 = Math.min(TER.x0, T.x - T.r - 3); } });
  })();
  function terOut(x, z) {                                   // how far outside the rise's level top (m)
    var dx = Math.max(TER.x0 - x, 0, x - TER.x1), dz = Math.max(TER.z0 - z, 0, z - TER.z1);
    return Math.hypot(dx, dz);
  }
  var maxG = 0.42 * Math.min(1.4, snowK) + 0.42;
  function groundAt(x, z) {
    var g = -drop * smooth(0, TER.slope, terOut(x, z));
    // snow banked up against the stone base, sloping away (none in front of the steps: the way up is kept clear)
    var dx = Math.abs(x) - bw, dz = Math.abs(z) - bd, dp = Math.hypot(Math.max(dx, 0), Math.max(dz, 0)) + Math.min(0, Math.max(dx, dz));
    var bank = dp > -0.01 ? 0.42 * Math.min(1.4, snowK) * Math.exp(-Math.max(0, dp) / 1.3) : 0;
    if (z < -bd + 0.01 && Math.abs(x) < stepW + 0.6) bank *= smooth(stepW + 0.1, stepW + 0.6, Math.abs(x));
    // the wind's soft waves in the snow
    var wav = 0.05 * Math.sin(0.21 * x + 0.13 * z + 0.7) + 0.035 * Math.sin(0.47 * x - 0.31 * z + 2.2);
    // and long low swells, so the rise's top meets the mist in a soft uneven line (not a ruler-straight one)
    var swell = (0.16 * Math.sin(0.093 * x + 0.04 * z + 0.5) + 0.1 * Math.sin(0.21 * x - 0.08 * z + 1.9) + 0.05 * Math.sin(0.43 * x + 0.17 * z + 4.1)) *
                smooth(1, 6, Math.max(Math.abs(x) - bw, Math.abs(z) - bd));
    return g + bank + wav * smooth(0, 3, dp) + swell;
  }
  // the solid parts of the hall (base, floor, walls, brackets, steps), in its own space, for what hides what and the shadows
  var BOX = [[-bw, -0.6, -bd, bw, fh - 0.18, bd], [-(ww + 0.9), fh - 0.18, -(wd + 0.9), ww + 0.9, fh, wd + 0.9], [-ww, fh, -wd, ww, wallTop, wd],
             [-(ww + brOut), wallTop, -(wd + brOut), ww + brOut, brTop, wd + brOut], [-(ww + brOut + 0.1), brTop, -(wd + brOut + 0.1), ww + brOut + 0.1, edgeY, wd + brOut + 0.1]];
  for (var k0 = 1; k0 <= stepN; k0++) BOX.push([-stepW, -0.4, -bd - k0 * stepD, stepW, fh * (1 - k0 / (stepN + 1)), -bd + 0.01]);
  function slab(oo, d, B, tmin) {
    var t0 = tmin, t1 = Infinity;
    for (var a = 0; a < 3; a++) {
      if (Math.abs(d[a]) < 1e-9) { if (oo[a] < B[a] || oo[a] > B[a + 3]) return Infinity; continue; }
      var ta = (B[a] - oo[a]) / d[a], tb = (B[a + 3] - oo[a]) / d[a];
      if (ta > tb) { var q = ta; ta = tb; tb = q; }
      if (ta > t0) t0 = ta; if (tb < t1) t1 = tb;
      if (t0 > t1) return Infinity;
    }
    return t0;
  }
  function slabFar(oo, d, B) {
    var t1 = Infinity;
    for (var a = 0; a < 3; a++) {
      if (Math.abs(d[a]) < 1e-9) continue;
      var ta = (B[a] - oo[a]) / d[a], tb = (B[a + 3] - oo[a]) / d[a];
      t1 = Math.min(t1, Math.max(ta, tb));
    }
    return t1;
  }
  function solidsT(oo, d) { var t = Infinity; for (var i = 0; i < BOX.length; i++) t = Math.min(t, slab(oo, d, BOX[i], 0)); return t; }
  // is the sun hidden from a point (the hall's boxes, its roof, the firs)?
  var ROOFB = [-(ex + lo), 0, -(ez + lo), ex + lo, yRoofMax, ez + lo];
  function inRoofSolid(x, y, z) {
    if (Math.abs(x) <= ex && Math.abs(z) <= ez) { var rt = roofTop(x, z); return y <= rt + thick(x, z) && y >= rt - 0.45; }
    var L = lip(x, z); return !!L && y <= L.top && y >= L.bot;
  }
  function sunHidden(p) {
    for (var i = 0; i < BOX.length; i++) if (slab(p, Ll, BOX[i], 0.02) < Infinity) return true;
    // the roof: everything under its snow's top counts (a ray of sun that gets under the eaves still has to come out
    // through the roof or the walls), stepped by how far above the snow the ray is
    var tr = slab(p, Ll, ROOFB, 0.02);
    if (tr < Infinity) {
      var t1 = slabFar(p, Ll, ROOFB), t = tr;
      while (t <= t1) {
        var qx = p[0] + Ll[0] * t, qy = p[1] + Ll[1] * t, qz = p[2] + Ll[2] * t;
        var top = Math.abs(qx) <= ex && Math.abs(qz) <= ez ? snowTop(qx, qz) : (function () { var L = lip(qx, qz); return L ? L.top : -1e9; })();
        if (qy <= top) return true;
        t += Math.max(0.04, (qy - top) / (1.0 + Math.abs(Ll[1])));
      }
    }
    for (var j = 0; j < firs.length; j++) {
      var T = firs[j], y0 = 0.12 * T.h;
      var tf = slab(p, Ll, [T.x - T.r, y0, T.z - T.r, T.x + T.r, T.h, T.z + T.r], 0.02);
      if (tf === Infinity) continue;
      for (var s = tf; s < tf + 3 * T.r + T.h * 3; s += Math.max(0.1, T.r * 0.12)) {
        var qx = p[0] + Ll[0] * s, qy = p[1] + Ll[1] * s, qz = p[2] + Ll[2] * s;
        if (qy > T.h) break;
        if (qy < y0) continue;
        if (Math.hypot(qx - T.x, qz - T.z) < T.r * (1 - (qy - y0) / (T.h - y0))) return true;
      }
    }
    return false;
  }

  /* ---------- the layer: just the size of what is drawn ---------- */
  var bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
  function grow(p) { bx0 = Math.min(bx0, p[0]); by0 = Math.min(by0, p[1]); bx1 = Math.max(bx1, p[0]); by1 = Math.max(by1, p[1]); }
  [-1, 1].forEach(function (a) { [-1, 1].forEach(function (b) {
    grow(Pl(a * (ex + lo), edgeY + lift + Tn, b * (ez + lo))); grow(Pl(a * rl, yRoofMax, b * 0.5)); grow(Pl(a * bw, -0.6, b * bd));
  }); });
  grow(Pl(0, 0, -bd - stepN * stepD - 1));
  // the rise's slope down to the field, and its sides (where its edge is on the screen)
  for (var a2 = 0; a2 < 48; a2++) {
    var u2 = a2 / 47, sl = TER.slope, gx = a2 < 24 ? lerp(TER.x0 - sl, TER.x1 + sl, u2 * 2) : (a2 < 36 ? TER.x0 - sl : TER.x1 + sl);
    var gz = a2 < 24 ? TER.z0 - sl : lerp(TER.z0 - sl, TER.z1, (a2 % 12) / 11);
    var wpt = Wp(gx, -drop, gz);
    if (wpt[2] > 5) { var sp = P(wpt); if (sp[1] > hy) grow([clamp(sp[0], bx0 - 0.25 * W, bx1 + 0.25 * W), sp[1]]); }
  }
  firs.forEach(function (T) { grow([T.f.x - T.f.h * 0.6, T.f.foot - T.f.h * 1.12]); grow([T.f.x + T.f.h * 0.6, T.f.foot + 4]); });
  bx0 = Math.max(-2, Math.floor(bx0 - 6)); by0 = Math.max(-2, Math.floor(by0 - 6)); bx1 = Math.min(W + 2, Math.ceil(bx1 + 6)); by1 = Math.min(H + 2, Math.ceil(by1 + 6));
  var LW = Math.max(1, Math.round((bx1 - bx0) * PR)), LH = Math.max(1, Math.round((by1 - by0) * PR));
  function mkLayer() { var cv = document.createElement('canvas'); cv.width = LW; cv.height = LH; return cv; }
  var OUT = mkLayer(), BODY = mkLayer(), GB = mkLayer(), GF = mkLayer();
  var gBack = new Float32Array(LW * LH * 8), gFront = new Float32Array(LW * LH * 8), roofI = new Float32Array(LW * LH * 4);
  var gHit = new Uint8Array(LW * LH), rHit = new Uint8Array(LW * LH);   // 0 nothing, 1 back, 2 in front of the hall / 1 snow
  function sx(i) { return bx0 + (i + 0.5) / PR; }
  function sy(j) { return by0 + (j + 0.5) / PR; }

  /* ---------- the snow's light: as the snow ground is lit (winterlake.js), so the two meet without a seam ---------- */
  var FS = o.field, shadeS = mix(FS.shade, FS.snow, 0.12), vis = FS.vis === undefined ? 1 : FS.vis;
  function snowLight(nS, occ, sky, out) {
    var dl = Math.max(0, nS[0] * Lsh[0] + nS[1] * Lsh[1] + nS[2] * Lsh[2]) * occ;
    var sk = (0.5 + 0.5 * nS[1]) * sky + 0.22 * (0.5 - 0.5 * nS[1]);       // (+ the light thrown up off the snow below)
    for (var ch = 0; ch < 3; ch++) {
      var v = FS.snow[ch] * FS.sun[ch] * dl * 1.25 + shadeS[ch] * sk;
      if (v > 226) v = 226 + (v - 226) * 26 / (v - 226 + 26);
      out[ch] = v;
    }
    return out;
  }
  function fieldHaze(zw, sY) {
    var d = Math.max(0.3, sY - hy);
    return clamp((1 - Math.exp(-Math.pow(zw / FS.hazeM, 1.6))) * FS.haze + smooth(8, 0, d) * 0.7, 0, 1);
  }
  // what the snow field itself shows on a row of the screen (flat snow at that row's distance, as winterlake.js lights
  // and hazes it), so the snow here can melt into it without a seam
  var FROW = [0, 0, 0];
  function fieldRow(px, sY) {
    var d = Math.max(0.3, sY - hy), z = eyeH * F / d, dl = Math.max(0, Lsh[1]);
    var hzr = clamp((1 - Math.exp(-Math.pow(z / FS.hazeM, 1.6))) * FS.haze + smooth(8, 0, d) * 0.7, 0, 1), gfar = 1 - Math.exp(-z / 70);
    for (var ch = 0; ch < 3; ch++) {
      var v = FS.snow[ch] * FS.sun[ch] * dl * 1.25 + shadeS[ch];
      if (v > 226) v = 226 + (v - 226) * 26 / (v - 226 + 26);
      v = lerp(v, FS.groundMist[ch], hzr);
      FROW[ch] = v + FS.sunRGB[ch] * FS.glow * vis * gfar * 0.22 * Math.exp(-Math.pow((px - FS.sunX) / (W * 0.42), 2));
    }
    return FROW;
  }
  // the lamps' light from the open door and the windows onto the snow in front (after dusk)
  var OPEN = [[0, fh + 1.3, -wd, 1, 0, -1, 1.6]];
  [-2, -1, 1, 2].forEach(function (b) { OPEN.push([b * 2.8, fh + 1.9, -wd, 1, 0, -1, 0.35]); });
  [-1, 0, 1].forEach(function (b) { OPEN.push([ww, fh + 1.9, b * 3.05, 1, 1, 0, 0.3]); });
  function lampAt(p) {
    if (lit <= 0) return 0;
    var I = 0;
    for (var i = 0; i < OPEN.length; i++) {
      var Q = OPEN[i], dx = p[0] - Q[0], dy = p[1] - Q[1], dz = p[2] - Q[2], dd = Math.hypot(dx, dy, dz) || 1;
      var dirK = Math.max(0, (dx * Q[4] + dz * Q[5]) / dd);
      I += Q[6] * dirK / (1 + (dd / 3.2) * (dd / 3.2));
    }
    return I * lit * spill;
  }

  /* ---------- following the line of sight to the snow on the ground ---------- */
  var COL = [0, 0, 0];
  function groundSample(px, py, outA) {
    var d = dirL(px, py), oo = oL;
    // only where the ground lies: from the near edge of the field round it to its far side
    if (d[1] >= 0 && oo[1] > maxG) return 0;                 // looking level or up: it never comes down to the snow
    if (d[1] >= -1e-6) return 0;
    // it can reach the snow only below the highest snow, and it has reached it by the field's level
    var tLo = oo[1] > maxG ? (oo[1] - maxG) / -d[1] : 0, tHi = (oo[1] + drop + 0.2) / -d[1];
    // … and only inside the outer edge of the rise's slope (an ellipse on the ground)
    var GB2 = [TER.x0 - TER.slope, -drop - 1, TER.z0 - TER.slope, TER.x1 + TER.slope, maxG + 1, TER.z1 + 2];
    var ta = slab(oo, d, GB2, 0);
    if (ta === Infinity) return 0;
    var tb = slabFar(oo, d, GB2);
    var tS = solidsT(oo, d), t = Math.max(20, tLo, ta), tEnd = Math.min(tHi, tb), prev = t, hitT = -1;
    if (t >= tEnd) return 0;
    var y;
    while (t < tEnd) {
      var x = oo[0] + d[0] * t, z = oo[2] + d[2] * t;
      y = oo[1] + d[1] * t;
      var g = groundAt(x, z), gap = y - g;
      if (gap <= 0) { hitT = t; break; }
      prev = t;
      t += clamp(gap / (0.4 + Math.abs(d[1])), 0.02, 6);
    }
    if (hitT < 0) return 0;
    var a = prev, b = hitT;
    for (var q = 0; q < 8; q++) { var m = (a + b) / 2, xm = oo[0] + d[0] * m, zm = oo[2] + d[2] * m; if (oo[1] + d[1] * m - groundAt(xm, zm) > 0) a = m; else b = m; }
    var th = b, hx = oo[0] + d[0] * th, hz2 = oo[2] + d[2] * th, hyy = groundAt(hx, hz2);
    // it melts into the field at the foot of the rise, at its sides and far behind
    var dOut = terOut(hx, hz2);
    var al = drop > 0.05 ? 1 - smooth(0.45, 0.97, -hyy / drop) : 1;
    al *= 1 - smooth(0.4 * TER.slope, TER.slope, dOut);
    al *= 1 - smooth(TER.z1 - 8, TER.z1 + 1, hz2);
    if (al < 0.004) return 0;
    var fade = 1 - al;                                      // 1: it shows just what the field shows on this row
    var e = 0.12, nx = -(groundAt(hx + e, hz2) - hyy) / e, nz = -(groundAt(hx, hz2 + e) - hyy) / e;
    var nL = norm([nx, 1, nz]), nS = toShadeN(nL);
    var p = [hx, hyy + 0.02, hz2];
    // the sun's light on it, averaged over the stretch of ground this pixel covers (seen nearly edge-on, one pixel
    // covers metres: one point alone would leave single dark dots where a shadow's tip lies)
    var dn = norm(d), graze = Math.max(0.004, Math.abs(dot(dn, nL))), span = th / (PR * F) / graze, sunSeen = 0;
    var nSh = span > 0.4 ? clamp(Math.ceil(span / 0.6), 4, 24) : 1;
    for (var si = 0; si < nSh; si++) {
      var tq = th + span * (nSh > 1 ? (si + 0.5) / nSh - 0.5 : 0), qx = oo[0] + d[0] * tq, qz = oo[2] + d[2] * tq;
      if (!sunHidden([qx, groundAt(qx, qz) + 0.02, qz])) sunSeen++;
    }
    var sunFrac = sunSeen / nSh, occ = Math.max(0, 1 - clamp(shadowK, 0, 1.5) * (1 - sunFrac));
    // the sky's light is cut off under the deep eaves and close round the firs' feet
    var sky = 1;
    var mOut = Math.max(Math.abs(hx) - ww, Math.abs(hz2) - wd);
    if (mOut > -0.5) sky *= lerp(0.55, 1, smooth(0, ov + 1.5, mOut));
    for (var fi = 0; fi < firs.length; fi++) { var T = firs[fi], dd = Math.hypot(hx - T.x, hz2 - T.z); if (dd < T.r * 1.6) sky *= lerp(0.6, 1, smooth(0, T.r * 1.6, dd)); }
    // two colours: in the sun and in the shadow; which of them shows (the sun seen, outA[7]) is softened across a few
    // pixels afterwards, so a shadow's edge is soft as the sun's disc and the air make it
    var lamp = lampAt(p), wpt = Wp(hx, hyy, hz2), sY = P(wpt)[1], hzF = fieldHaze(wpt[2], sY);
    var gfar = 1 - Math.exp(-wpt[2] / 70), FC = fieldRow(px, py), fk = smooth(0, 0.85, fade);
    for (var pass = 0; pass < 2; pass++) {
      snowLight(nS, pass ? Math.max(0, 1 - clamp(shadowK, 0, 1.5)) : 1, sky, COL);
      for (var ch = 0; ch < 3; ch++) {
        var v = lerp(COL[ch] + lampCol[ch] * lamp * 0.85, FS.groundMist[ch], hzF);
        v += FS.sunRGB[ch] * FS.glow * vis * gfar * 0.22 * Math.exp(-Math.pow((px - FS.sunX) / (W * 0.42), 2));
        outA[pass * 4 + ch] = lerp(v, FC[ch], fk);
      }
    }
    outA[7] = sunFrac;
    outA[3] = 1 - smooth(0.8, 1, fade);
    return th < tS ? 2 : 1;
  }

  /* ---------- following the line of sight to the snow on the roof ---------- */
  var RB = [-(ex + lo), edgeY - (0.5 + dr) * Tn * 2 - 0.1, -(ez + lo), ex + lo, yRoofMax, ez + lo];
  function roofSample(px, py, outA) {
    var d = dirL(px, py), oo = oL, t = slab(oo, d, RB, 0);
    if (t === Infinity) return 0;
    var tEnd = slabFar(oo, d, RB), prev = t, cls = 0, hitT = -1;
    while (t <= tEnd) {
      var x = oo[0] + d[0] * t, y = oo[1] + d[1] * t, z = oo[2] + d[2] * t;
      cls = roofClass(x, y, z);
      if (cls === 1) { hitT = t; break; }
      if (cls === -1) return 0;
      prev = t;
      t += clamp(CL.gap / (1.3 + Math.abs(d[1])), 0.008, 0.6);
    }
    if (hitT < 0) return 0;
    var a = prev, b = hitT;
    for (var q = 0; q < 8; q++) { var m = (a + b) / 2; if (roofClass(oo[0] + d[0] * m, oo[1] + d[1] * m, oo[2] + d[2] * m) === 1) b = m; else a = m; }
    var hx = oo[0] + d[0] * b, hyy = oo[1] + d[1] * b, hz2 = oo[2] + d[2] * b;
    var nL = roofNormal(hx, hyy, hz2), nS = toShadeN(nL);
    // the sun on it, unless the roof itself stands between (on the slopes turned away; Lambert's law covers the rest)
    snowLight(nS, 1, 1, COL);
    // the lamps inside light the underside of the lip warm
    if (lit > 0 && nL[1] < 0.2) { var k = lit * 0.22 * smooth(0.2, -0.6, nL[1]); for (var ch = 0; ch < 3; ch++) COL[ch] += lampCol[ch] * k * 0.5; }
    var g = 1 + (hash(Math.round(hx * 9), Math.round(hz2 * 9), 3) - 0.5) * 0.02;
    for (ch = 0; ch < 3; ch++) outA[ch] = lerp(COL[ch] * g, mistC[ch], hz);
    outA[3] = 1;
    return 1;
  }

  /* ---------- a raster, row by row; then the edges again with four samples a pixel ---------- */
  var TMP = [0, 0, 0, 0, 0, 0, 0, 0], ACC = [0, 0, 0, 0];
  function rasterRows(kind, j0, j1) {
    var ri0 = 0, ri1 = LW;
    for (var j = j0; j < j1; j++) for (var i = ri0; i < ri1; i++) {
      var k = j * LW + i, f = kind === 'g' ? groundSample(sx(i), sy(j), TMP) : roofSample(sx(i), sy(j), TMP);
      if (kind === 'g') { gHit[k] = f; if (f) { var B = f === 2 ? gFront : gBack; for (var q = 0; q < 8; q++) B[k * 8 + q] = TMP[q]; } }
      else { rHit[k] = f; if (f) { roofI[k * 4] = TMP[0]; roofI[k * 4 + 1] = TMP[1]; roofI[k * 4 + 2] = TMP[2]; roofI[k * 4 + 3] = 1; } }
    }
  }
  var edgeList = null;
  function findEdges(kind) {
    var M = kind === 'g' ? gHit : rHit, out = [];
    for (var j = 0; j < LH; j++) for (var i = 0; i < LW; i++) {
      var k = j * LW + i, v = M[k];
      if ((i > 0 && M[k - 1] !== v) || (i < LW - 1 && M[k + 1] !== v) || (j > 0 && M[k - LW] !== v) || (j < LH - 1 && M[k + LW] !== v)) out.push(k);
    }
    return out;
  }
  var SUBS = [[-0.25, -0.25], [0.25, -0.25], [-0.25, 0.25], [0.25, 0.25]];
  function edgeOne(kind, k) {
    var i = k % LW, j = (k - i) / LW;
    if (kind === 'r') {
      ACC[0] = ACC[1] = ACC[2] = ACC[3] = 0;
      for (var s = 0; s < 4; s++) {
        if (roofSample(sx(i) + SUBS[s][0] / PR, sy(j) + SUBS[s][1] / PR, TMP)) { ACC[0] += TMP[0]; ACC[1] += TMP[1]; ACC[2] += TMP[2]; ACC[3] += 1; }
      }
      if (ACC[3] > 0) { roofI[k * 4] = ACC[0] / ACC[3]; roofI[k * 4 + 1] = ACC[1] / ACC[3]; roofI[k * 4 + 2] = ACC[2] / ACC[3]; }
      roofI[k * 4 + 3] = ACC[3] / 4;
      return;
    }
    // the ground: each sample goes to the layer it belongs to (behind the hall, or in front of it)
    var A = [[0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0]];
    for (var s2 = 0; s2 < 4; s2++) {
      var f = groundSample(sx(i) + SUBS[s2][0] / PR, sy(j) + SUBS[s2][1] / PR, TMP);
      if (!f) continue;
      var Aq = A[f - 1], a = TMP[3];
      for (var q = 0; q < 8; q++) Aq[q] += q === 3 ? a : TMP[q] * a;
    }
    [gBack, gFront].forEach(function (B, q2) {
      var Aq = A[q2], a = Aq[3];
      if (a > 0) for (var q = 0; q < 8; q++) if (q !== 3) B[k * 8 + q] = Aq[q] / a;
      B[k * 8 + 3] = a / 4;
    });
  }
  // the sun seen, softened across a few pixels (only among pixels of snow), then each pixel's two colours mixed by it
  function compose(B) {
    var n = LW * LH, S = new Float32Array(n), T2 = new Float32Array(n), Wt = new Float32Array(n), Wt2 = new Float32Array(n), out = new Float32Array(n * 4);
    var rb = Math.max(1, Math.round(1.3 * PR));
    for (var k = 0; k < n; k++) { var a = B[k * 8 + 3]; if (a > 0) { S[k] = B[k * 8 + 7]; Wt[k] = 1; } }
    for (var j = 0; j < LH; j++) {                         // across
      var acc = 0, w = 0, row = j * LW;
      for (var i = -rb; i < LW; i++) {
        var ia = i + rb, io = i - rb - 1;
        if (ia < LW) { acc += S[row + ia] * Wt[row + ia]; w += Wt[row + ia]; }
        if (io >= 0) { acc -= S[row + io] * Wt[row + io]; w -= Wt[row + io]; }
        if (i >= 0) { T2[row + i] = w > 0 ? acc / w : 0; Wt2[row + i] = w; }
      }
    }
    for (var i2 = 0; i2 < LW; i2++) {                       // and down
      var acc2 = 0, w2 = 0;
      for (var j2 = -rb; j2 < LH; j2++) {
        var ja = j2 + rb, jo = j2 - rb - 1;
        if (ja < LH) { var ka = ja * LW + i2; if (Wt2[ka] > 0) { acc2 += T2[ka]; w2 += 1; } }
        if (jo >= 0) { var ko = jo * LW + i2; if (Wt2[ko] > 0) { acc2 -= T2[ko]; w2 -= 1; } }
        if (j2 >= 0) { var kk = j2 * LW + i2; S[kk] = w2 > 0 ? acc2 / w2 : 1; }
      }
    }
    for (var k2 = 0; k2 < n; k2++) {
      var a2 = B[k2 * 8 + 3];
      if (!(a2 > 0)) continue;
      var sv = Wt[k2] ? clamp(S[k2], 0, 1) : 1;
      for (var ch = 0; ch < 3; ch++) out[k2 * 4 + ch] = lerp(B[k2 * 8 + 4 + ch], B[k2 * 8 + ch], sv);
      out[k2 * 4 + 3] = a2;
    }
    return out;
  }
  function toCanvas(B, cv) {
    var c = cv.getContext('2d'), im = c.createImageData(LW, LH), D = im.data;
    for (var k = 0, n = LW * LH * 4; k < n; k += 4) {
      if (B[k + 3] <= 0) continue;
      D[k] = clamp(B[k], 0, 255); D[k + 1] = clamp(B[k + 1], 0, 255); D[k + 2] = clamp(B[k + 2], 0, 255); D[k + 3] = clamp(B[k + 3] * 255, 0, 255);
    }
    c.putImageData(im, 0, 0);
  }

  /* =====================================================================
     THE TIMBER, PLASTER AND STONE: faces, shaded, back to front
     ===================================================================== */
  var bc = BODY.getContext('2d');
  function fin(col) { return mix(col, mistC, hz); }
  var items = [], cur = null;
  function group(post) { cur = { faces: [], post: post || null }; items.push(cur); }
  // a face from its corners in the hall's space, in the order bottom-left, bottom-right, top-right, top-left as seen
  // from outside (so its details can be laid out across it); mid: a point inside its solid (to turn its normal outward)
  function face(pts, mat, mid, det, info) {
    cur.faces.push({ p: pts.map(function (q) { return Wp(q[0], q[1], q[2]); }), l: pts, mat: mat, mid: Wp(mid[0], mid[1], mid[2]), det: det || null, info: info || {} });
  }
  function box(B, mat, dets, info) {
    var x0 = B[0], y0 = B[1], z0 = B[2], x1 = B[3], y1 = B[4], z1 = B[5], m = [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2];
    dets = dets || {};
    face([[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], mat, m, dets.front, info && info.front);   // front (toward −z)
    face([[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]], mat, m, dets.right, info && info.right);   // right
    face([[x1, y0, z1], [x0, y0, z1], [x0, y1, z1], [x1, y1, z1]], mat, m, dets.back, info && info.back);     // back
    face([[x0, y0, z1], [x0, y0, z0], [x0, y1, z0], [x0, y1, z1]], mat, m, dets.left, info && info.left);     // left
    if (dets.top !== 'none') face([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], dets.topMat || mat, m, null);
    if (dets.bottom !== 'none') face([[x0, y0, z1], [x1, y0, z1], [x1, y0, z0], [x0, y0, z0]], dets.bottomMat || mat, m, null);
  }

  // the stone base, the floor's timber edge, the walls, the brackets, then the eaves' undersides and fascia, the steps
  group();
  box(BOX[0], 'stone', { front: 'stone', right: 'stone', left: 'stone', back: 'stone', bottom: 'none' }, { front: { off: bw - ww }, right: { off: bd - wd } });
  group();
  box(BOX[1], 'floor', { bottom: 'none' });
  group();
  box(BOX[2], 'plaster', { front: 'front', back: 'front', right: 'side', left: 'side', top: 'none', bottom: 'none' }, { front: { off: 0 }, right: { off: 0 } });
  group();
  box(BOX[3], 'bracket', { front: 'bracket', right: 'bracket', left: 'bracket', back: 'bracket', top: 'none', bottomMat: 'soffit' });
  // the eaves: each side's underside (soffit, rafters) and its fascia, following the turned-up corners
  function eavePt(u, side, y, outward) {
    var a = side === 0 || side === 2 ? ex : ez, b = side === 0 || side === 2 ? ez : ex, q = u * (a + (outward || 0)), r = b + (outward || 0);
    var lx = side === 0 ? q : side === 1 ? r : side === 2 ? -q : -r, lz = side === 0 ? -r : side === 1 ? q : side === 2 ? r : -q;
    return [lx, y + liftAt(Math.abs(lx), Math.abs(lz)), lz];
  }
  function innerPt(u, side, y) {
    var a = (side === 0 || side === 2 ? ww : wd) + brOut + 0.1, b = (side === 0 || side === 2 ? wd : ww) + brOut + 0.1, q = u * a;
    return side === 0 ? [q, y, -b] : side === 1 ? [b, y, q] : side === 2 ? [-q, y, b] : [-b, y, -q];
  }
  group();
  var SEG = 10;
  for (var side = 0; side < 4; side++) {
    for (var s = 0; s < SEG; s++) {
      var u0 = -1 + 2 * s / SEG, u1 = -1 + 2 * (s + 1) / SEG;
      face([eavePt(u0, side, eaveBot), eavePt(u1, side, eaveBot), innerPt(u1, side, brTop), innerPt(u0, side, brTop)], 'soffit', [0, edgeY + 2, 0], 'rafters');
      face([eavePt(u0, side, eaveBot), eavePt(u1, side, eaveBot), eavePt(u1, side, edgeY), eavePt(u0, side, edgeY)], 'fascia', [0, eaveBot, 0], 'fascia');
    }
  }
  group(stepSnow);
  for (var k1 = 1; k1 <= stepN; k1++) box(BOX[4 + k1], 'step', { front: 'riser', top: 'none', bottom: 'none', back: 'none' });

  // how each material's colour runs across its face, from its foot to its top (the shade under the eaves comes separately)
  var RAMP = { plaster: [1.0, 0.92], post: [1, 0.9], stone: [0.92, 1.04], floor: [0.9, 1.08], bracket: [1.08, 0.82], soffit: [0.75, 1.1], fascia: [0.9, 1.1], step: [0.85, 1.05] };
  function P2(pts, s, t) {                              // a point in a quad (0 bottom-left, 1 bottom-right, 2 top-right, 3 top-left)
    var bl = pts[0], br = pts[1], tr = pts[2], tl = pts[3];
    return [lerp(lerp(bl[0], br[0], s), lerp(tl[0], tr[0], s), t), lerp(lerp(bl[1], br[1], s), lerp(tl[1], tr[1], s), t)];
  }
  function quadPath(c, pts, s0, s1, t0, t1) {
    var a = P2(pts, s0, t0), b = P2(pts, s1, t0), d = P2(pts, s1, t1), e = P2(pts, s0, t1);
    c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(d[0], d[1]); c.lineTo(e[0], e[1]); c.closePath();
  }
  function quad(c, pts, s0, s1, t0, t1, fill) { quadPath(c, pts, s0, s1, t0, t1); c.fillStyle = fill; c.fill(); }
  function poly(c, pts) { c.beginPath(); pts.forEach(function (p, i) { if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }); c.closePath(); }
  function matCol(m) { return PAL[m] || PAL.plaster; }
  // the colour of a material on a face: the sun and the sky, the lamps' warmth on the eaves after dusk, the haze
  function faceCol(base, n, sunK) {
    var col = shadeC(base, n, LP, sunK);
    return col;
  }
  function paintFace(c, f, n) {
    var pts = f.p.map(P), m = f.mat, base = matCol(m), col = faceCol(base, n, 1);
    if (lit > 0 && (m === 'soffit' || m === 'bracket')) col = mix(col, mix(lampCol, [255, 150, 80], 0.3), clamp(0.3 * lit, 0, 0.5));
    var ramp = RAMP[m] || [1, 1];
    var e0 = [(pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2], e1 = [(pts[2][0] + pts[3][0]) / 2, (pts[2][1] + pts[3][1]) / 2];
    var g = c.createLinearGradient(e0[0], e0[1], e1[0] + 0.01, e1[1] + 0.01);
    g.addColorStop(0, css(fin([col[0] * ramp[0], col[1] * ramp[0], col[2] * ramp[0]])));
    g.addColorStop(1, css(fin([col[0] * ramp[1], col[1] * ramp[1], col[2] * ramp[1]])));
    poly(c, pts); c.fillStyle = g; c.fill();
    c.strokeStyle = css(fin(col)); c.lineWidth = 0.6; c.lineJoin = 'round'; c.stroke();    // (round joins: no spikes; no hairline gaps)
    // the light falls off across a face, away from the sun's side
    var xs = pts.map(function (p) { return p[0]; }), xa = Math.min.apply(null, xs), xb = Math.max.apply(null, xs);
    if (xb - xa > 2) {
      var gx = c.createLinearGradient(xa, 0, xb, 0), litLeft = Lw[0] < 0;
      gx.addColorStop(litLeft ? 0 : 1, 'rgba(255,238,215,0.06)'); gx.addColorStop(litLeft ? 1 : 0, 'rgba(25,18,40,0.1)');
      poly(c, pts); c.fillStyle = gx; c.fill();
    }
    if (f.det === 'front') wallDetail(c, pts, n, 5, 2);
    else if (f.det === 'side') wallDetail(c, pts, n, 3, -1);
    else if (f.det === 'stone') stoneDetail(c, pts, col);
    else if (f.det === 'bracket') bracketDetail(c, pts, col);
    else if (f.det === 'rafters') rafterDetail(c, pts, col);
    else if (f.det === 'fascia') fasciaDetail(c, pts, col);
    else if (f.det === 'riser') riserDetail(c, pts);
    // a wall in the sun: the eave's shadow cast on it, as low as the sun's angle takes it
    if ((m === 'plaster' || m === 'stone') && f.info && f.info.off !== undefined) eaveShadow(c, f, pts, n, base);
  }
  function eaveShadow(c, f, pts, n, base) {
    var dl = dot(n, Lw);
    if (dl <= 0.001) return;
    // the sun's height seen across this wall: rise over the run straight out from it
    var hn = Math.hypot(n[0], n[2]) || 1, out = (Lw[0] * n[0] + Lw[2] * n[2]) / hn;
    if (out <= 0.01) return;
    var y0 = f.l[0][1], y1 = f.l[2][1], reach = ov - f.info.off;      // how far the eave stands out past this face
    var ys = eaveBot - reach * Lw[1] / out;                             // the shadow's lower edge on it
    var ts = clamp((ys - y0) / (y1 - y0), 0, 1);
    if (ts >= 1) return;
    var lit0 = shadeC(base, n, LP, 1), dark = shadeC(base, n, LP, 0);
    var k = [dark[0] / Math.max(1, lit0[0]), dark[1] / Math.max(1, lit0[1]), dark[2] / Math.max(1, lit0[2])];
    c.save(); c.globalCompositeOperation = 'multiply';
    var A = P2(pts, 0.5, Math.max(0, ts - 0.03)), B = P2(pts, 0.5, Math.min(1, ts + 0.03)), g = c.createLinearGradient(A[0], A[1], B[0], B[1] + 0.01);
    g.addColorStop(0, 'rgb(255,255,255)'); g.addColorStop(1, css([255 * k[0], 255 * k[1], 255 * k[2]]));
    quad(c, pts, 0, 1, Math.max(0, ts - 0.03), 1, g);
    c.restore();
  }
  // the front (five bays: windows either side, the doors in the middle) and the sides (three bays of windows)
  function wallDetail(c, Q, n, bays, door) {
    var w = Math.hypot(Q[1][0] - Q[0][0], Q[1][1] - Q[0][1]);
    if (w < 3) return;
    var post = css(fin(faceCol(PAL.post, n, 1))), beam = css(fin(faceCol(PAL.beam, n, 1))), bar = css(fin(mix(faceCol(PAL.lattice, n, 1), [0, 0, 0], 0.1)));
    var pw = 0.28 / (bays === 5 ? 2 * ww : 2 * wd);                    // a post is 28 cm wide
    var paper = faceCol(PAL.paper, n, 1), lampK = clamp(lit, 0, 1);
    function pane(s0, s1, t0, t1, isDoor) {
      // the paper behind the bars: in the day the shaded paper; after dusk lit from inside, brightest in the middle
      var base2 = lampK > 0 ? mix(paper, lampCol, lampK) : paper;
      quad(c, Q, s0, s1, t0, t1, css(fin(base2)));
      if (lampK > 0) {
        var Cn = P2(Q, (s0 + s1) / 2, (t0 + t1) / 2), rr = Math.max(1, Math.hypot(P2(Q, s1, t1)[0] - Cn[0], P2(Q, s1, t1)[1] - Cn[1]));
        var g = c.createRadialGradient(Cn[0], Cn[1], 0, Cn[0], Cn[1], rr);
        g.addColorStop(0, css([255, 236, 190], 0.55 * lampK)); g.addColorStop(1, css([255, 236, 190], 0));
        quadPath(c, Q, s0, s1, t0, t1); c.fillStyle = g; c.fill();
      }
      // its frame and its bars (a lattice of squares on the doors, upright bars in the windows)
      c.strokeStyle = bar; c.lineWidth = Math.max(0.35, w * 0.0035);
      c.beginPath();
      var nv = isDoor ? Math.max(3, Math.round(w * (s1 - s0) / 3.2)) : Math.max(3, Math.round(w * (s1 - s0) / 2.2));
      for (var v = 1; v < nv; v++) { var sv = lerp(s0, s1, v / nv), a = P2(Q, sv, t0), b = P2(Q, sv, t1); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
      if (isDoor) {
        var nh = Math.max(4, Math.round(nv * (t1 - t0) / (s1 - s0) * 0.45));
        for (var hh = 1; hh < nh; hh++) { var tv = lerp(t0, t1, hh / nh), l = P2(Q, s0, tv), r = P2(Q, s1, tv); c.moveTo(l[0], l[1]); c.lineTo(r[0], r[1]); }
      }
      c.stroke();
      c.lineWidth = Math.max(0.6, w * 0.007);
      quadPath(c, Q, s0, s1, t0, t1); c.stroke();
      if (isDoor) { var m0 = P2(Q, (s0 + s1) / 2, t0), m1 = P2(Q, (s0 + s1) / 2, t1); c.beginPath(); c.moveTo(m0[0], m0[1]); c.lineTo(m1[0], m1[1]); c.stroke(); }
    }
    for (var j = 0; j < bays; j++) {
      var a = j / bays, b = (j + 1) / bays, mid = (a + b) / 2, bw2 = b - a;
      if (j === door) pane(mid - bw2 * 0.38, mid + bw2 * 0.38, 0.06, 0.84, true);
      else pane(mid - bw2 * 0.24, mid + bw2 * 0.24, 0.42, 0.72, false);
    }
    // the sill along the foot, the tie beams, the posts
    quad(c, Q, 0, 1, 0, 0.05, beam);
    quad(c, Q, 0, 1, 0.86, 0.93, beam);
    for (var i = 0; i <= bays; i++) { var s = i / bays; quad(c, Q, Math.max(0, s - pw / 2), Math.min(1, s + pw / 2), 0, 1, post); }
    // the sky's light cut off under the deep eaves: the wall darkens toward its top (less so when the lamps are on)
    var A = P2(Q, 0.5, 1), B = P2(Q, 0.5, 0.25), g2 = c.createLinearGradient(A[0], A[1], B[0], B[1] + 0.01);
    g2.addColorStop(0, 'rgba(14,8,10,' + (0.42 * (1 - 0.5 * lampK)).toFixed(3) + ')'); g2.addColorStop(1, 'rgba(14,8,10,0)');
    quad(c, Q, 0, 1, 0.25, 1, g2);
  }
  function stoneDetail(c, Q, col) {
    var w = Math.hypot(Q[1][0] - Q[0][0], Q[1][1] - Q[0][1]);
    if (w < 6) return;
    var n = clamp(Math.round(w / 7), 3, 30), r = 0;
    c.strokeStyle = css(fin(mix(col, [0, 0, 0], 0.35)), 0.5); c.lineWidth = 0.4; c.beginPath();
    for (var i = 1; i < n; i++) { var s = (i + (hash(i, 3, 1) - 0.5) * 0.3) / n, a = P2(Q, s, 0), b = P2(Q, s, 1); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
    var m0 = P2(Q, 0, 0.55), m1 = P2(Q, 1, 0.55); c.moveTo(m0[0], m0[1]); c.lineTo(m1[0], m1[1]);
    c.stroke();
    // the top's edge catches the light
    c.strokeStyle = css(fin(mix(col, [255, 250, 240], 0.25)), 0.6); c.lineWidth = 0.5;
    var t0 = P2(Q, 0, 0.97), t1 = P2(Q, 1, 0.97); c.beginPath(); c.moveTo(t0[0], t0[1]); c.lineTo(t1[0], t1[1]); c.stroke();
  }
  function bracketDetail(c, Q, col) {
    var w = Math.hypot(Q[1][0] - Q[0][0], Q[1][1] - Q[0][1]);
    if (w < 6) return;
    var n = clamp(Math.round(w / 3.2), 4, 60), lt = css(fin(mix(col, [255, 226, 180], lit > 0 ? 0.35 : 0.18))), dk = css(fin(mix(col, [0, 0, 0], 0.5)));
    quad(c, Q, 0, 1, 0.45, 0.58, dk);
    for (var i = 0; i < n; i++) { var s0 = (i + 0.25) / n, s1 = (i + 0.75) / n; quad(c, Q, s0, s1, 0.12, 0.42, lt); quad(c, Q, s0 + 0.1 / n, s1 - 0.1 / n, 0.62, 0.9, lt); }
  }
  function rafterDetail(c, Q, col) {
    var w = Math.hypot(Q[1][0] - Q[0][0], Q[1][1] - Q[0][1]);
    if (w < 4) return;
    var n = clamp(Math.round(w / 2.4), 2, 14); c.strokeStyle = css(fin(mix(col, [0, 0, 0], 0.35)), 0.5); c.lineWidth = 0.45;
    c.beginPath();
    for (var i = 1; i < n; i++) { var a = P2(Q, i / n, 0), b = P2(Q, i / n, 1); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
    c.stroke();
  }
  function fasciaDetail(c, Q, col) {                    // the rafters' ends in a row along the fascia's foot
    var w = Math.hypot(Q[1][0] - Q[0][0], Q[1][1] - Q[0][1]);
    if (w < 4) return;
    var n = clamp(Math.round(w / 2.2), 2, 14), lt = css(fin(mix(col, [200, 180, 160], 0.22)));
    for (var i = 0; i < n; i++) quad(c, Q, (i + 0.3) / n, (i + 0.7) / n, 0.05, 0.4, lt);
  }
  function riserDetail(c, Q) {
    var A = P2(Q, 0.5, 0), B = P2(Q, 0.5, 1), g = c.createLinearGradient(A[0], A[1], B[0], B[1] + 0.01);
    g.addColorStop(0, 'rgba(40,34,44,0.35)'); g.addColorStop(0.6, 'rgba(40,34,44,0.05)'); g.addColorStop(1, 'rgba(40,34,44,0)');
    quad(c, Q, 0, 1, 0, 1, g);
  }
  // the snow lying on each step, seen at its front edge: a soft rounded band along it, lit on top, blue underneath
  function stepSnow() {
    var c = bc, top = snowLight([0, 1, 0], 1, 1, [0, 0, 0]), under = snowLight([0, 0.2, 1], 1, 0.8, [0, 0, 0]);
    for (var kk = 1; kk <= stepN; kk++) {
      var yk = BOX[4 + kk][4], zf = BOX[4 + kk][2], Lp = Pl(-stepW, yk, zf), Rp = Pl(stepW, yk, zf), th = Math.max(0.6, 0.07 * F / Wp(0, yk, zf)[2]);
      var g = c.createLinearGradient(0, Lp[1] - th, 0, Lp[1] + th * 0.6);
      g.addColorStop(0, css(fin(top))); g.addColorStop(1, css(fin(under)));
      c.save(); c.filter = 'blur(' + (0.4 * PR).toFixed(2) + 'px)';
      c.beginPath(); c.moveTo(Lp[0] - th * 0.4, Lp[1]); c.quadraticCurveTo((Lp[0] + Rp[0]) / 2, Lp[1] - th * 1.2, Rp[0] + th * 0.4, Rp[1]);
      c.lineTo(Rp[0] + th * 0.2, Rp[1] + th * 0.5); c.lineTo(Lp[0] - th * 0.2, Lp[1] + th * 0.5); c.closePath();
      c.fillStyle = g; c.fill(); c.restore();
    }
  }
  function drawBody() {
    var c = bc, eye = [0, 0, 0];
    c.setTransform(PR, 0, 0, PR, -bx0 * PR, -by0 * PR);
    items.forEach(function (itm) {
      var vis2 = [];
      itm.faces.forEach(function (f) {
        var p = f.p, n = [0, 0, 0];
        for (var qi = 0; qi < p.length; qi++) {                // Newell's normal: from every edge (a twisted face never flips)
          var A0 = p[qi], B0 = p[(qi + 1) % p.length];
          n[0] += (A0[1] - B0[1]) * (A0[2] + B0[2]); n[1] += (A0[2] - B0[2]) * (A0[0] + B0[0]); n[2] += (A0[0] - B0[0]) * (A0[1] + B0[1]);
        }
        n = norm(n);
        var cen = [0, 0, 0]; p.forEach(function (q) { cen[0] += q[0] / p.length; cen[1] += q[1] / p.length; cen[2] += q[2] / p.length; });
        if (dot(n, sub(cen, f.mid)) < 0) n = [-n[0], -n[1], -n[2]];
        if (dot(n, sub(eye, cen)) <= 0) return;
        vis2.push({ f: f, n: n, d: Math.hypot(cen[0], cen[1], cen[2]) });
      });
      vis2.sort(function (A, B) { return B.d - A.d; });
      vis2.forEach(function (v) { paintFace(c, v.f, v.n); });
      if (itm.post) itm.post();
    });
  }

  /* ---------- after dusk: the warm glow round the door and the windows, in the air ---------- */
  function glows(c) {
    if (lit <= 0) return;
    c.save(); c.setTransform(PR, 0, 0, PR, -bx0 * PR, -by0 * PR); c.globalCompositeOperation = 'lighter';
    OPEN.forEach(function (Q) {
      var p = Pl(Q[0] + Q[4] * 0.05, Q[1], Q[2] + Q[5] * 0.05), pw = Wp(Q[0], Q[1], Q[2]), r0 = (Q[6] > 1 ? 3.4 : 1.8) * F / pw[2];
      var g = c.createRadialGradient(p[0], p[1], 0, p[0], p[1], r0);
      g.addColorStop(0, css(lampCol, 0.2 * lit * Math.min(1, Q[6] + 0.3))); g.addColorStop(1, css(lampCol, 0));
      c.fillStyle = g; c.fillRect(p[0] - r0, p[1] - r0, r0 * 2, r0 * 2);
    });
    c.restore();
  }
  /* ---------- the low mist lying at the foot of the hall and the firs (the field is hazier than the air above it) ---------- */
  function footMist(c) {
    var k = clamp(o.footMist || 0, 0, 1.5);
    if (k <= 0) return;
    var fy = P(Wp(0, 0, -bd))[1], top = P(Wp(0, 3.5, -bd))[1];
    var hzF = clamp(fieldHaze(Wp(0, 0, -bd)[2], fy) - hz, 0, 1) * k;
    if (hzF <= 0.01) return;
    c.save(); c.setTransform(PR, 0, 0, PR, -bx0 * PR, -by0 * PR); c.globalCompositeOperation = 'source-atop';
    var g = c.createLinearGradient(0, fy + 2, 0, top);
    g.addColorStop(0, css(FS.groundMist, clamp(hzF * 1.6, 0, 0.9))); g.addColorStop(0.2, css(FS.groundMist, clamp(hzF, 0, 0.9)));
    g.addColorStop(0.55, css(FS.groundMist, clamp(hzF * 0.35, 0, 0.9))); g.addColorStop(1, css(FS.groundMist, 0));
    c.fillStyle = g; c.fillRect(bx0, by0, bx1 - bx0, by1 - by0);
    c.restore();
  }

  /* ---------- the job: a few rows or a tree at a time ---------- */
  var TT = [], tasks = [], ti = 0, row = 0, edges = null, ei = 0, firI = 0, done = false, t00 = 0, info = '';
  var ROWS = 4;
  tasks.push(function (lim) { while (row < LH) { rasterRows('g', row, Math.min(LH, row + ROWS)); row += ROWS; if (performance.now() > lim) return false; } row = 0; return true; });
  tasks.push(function (lim) { if (!edges) { edges = findEdges('g'); ei = 0; } while (ei < edges.length) { edgeOne('g', edges[ei++]); if ((ei & 63) === 0 && performance.now() > lim) return false; } edges = null; return true; });
  tasks.push(function () { toCanvas(compose(gBack), GB); toCanvas(compose(gFront), GF); gBack = gFront = null; return true; });
  tasks.push(function (lim) {
    // the firs beside the hall, farthest first (each its own tree, from its own seed)
    if (typeof WinterHill === 'undefined') return true;
    bc.setTransform(PR, 0, 0, PR, -bx0 * PR, -by0 * PR);
    var order = firs.slice().sort(function (A, B) { return B.D - A.D; });
    while (firI < order.length) {
      var T = order[firI++], look = {};
      for (var kk in (o.firLook || {})) look[kk] = o.firLook[kk];
      look.light = o.light; look.haze = T.f.haze === undefined ? 0.4 : T.f.haze;
      WinterHill.fir(bc, T.f.x, T.f.foot, T.f.h, T.f.seed, look);
      if (performance.now() > lim) return false;
    }
    return true;
  });
  tasks.push(function () { drawBody(); return true; });
  tasks.push(function (lim) { while (row < LH) { rasterRows('r', row, Math.min(LH, row + ROWS)); row += ROWS; if (performance.now() > lim) return false; } row = 0; return true; });
  tasks.push(function (lim) { if (!edges) { edges = findEdges('r'); ei = 0; } while (ei < edges.length) { edgeOne('r', edges[ei++]); if ((ei & 63) === 0 && performance.now() > lim) return false; } edges = null; return true; });
  tasks.push(function () {
    var RC = mkLayer(); toCanvas(roofI, RC); roofI = null;
    bc.save(); bc.setTransform(1, 0, 0, 1, 0, 0); bc.filter = 'blur(' + (0.35 * PR).toFixed(2) + 'px)'; bc.drawImage(RC, 0, 0); bc.restore();
    bc.save(); bc.setTransform(1, 0, 0, 1, 0, 0); bc.drawImage(RC, 0, 0); bc.restore();   // (sharp over its own soft copy: a soft edge, no see-through)
    footMist(bc);
    // all of it laid down: the snow behind and under the hall, the firs and the hall, the snow in front of it, the lamps' glow
    var oc = OUT.getContext('2d');
    oc.save(); oc.filter = 'blur(' + (0.45 * PR).toFixed(2) + 'px)'; oc.drawImage(GB, 0, 0); oc.restore();
    oc.drawImage(GB, 0, 0);
    oc.save(); oc.filter = 'blur(' + (0.3 * PR).toFixed(2) + 'px)'; oc.drawImage(BODY, 0, 0); oc.restore();
    oc.save(); oc.filter = 'blur(' + (0.45 * PR).toFixed(2) + 'px)'; oc.drawImage(GF, 0, 0); oc.restore();
    glows(oc);
    GB.width = GB.height = GF.width = GF.height = BODY.width = BODY.height = RC.width = RC.height = 1;
    return true;
  });
  info = 'hall ' + (2 * ex).toFixed(1) + ' m wide at the eaves, ' + Z.toFixed(0) + ' m away, its ground ' + drop.toFixed(2) + ' m above the field; ' + firs.length + ' firs';
  return {
    canvas: OUT, x: bx0, y: by0, info: info,
    step: function (ms) {
      if (done) return true;
      if (!t00) t00 = performance.now();
      var lim = performance.now() + (ms === undefined ? 1e9 : ms);
      while (ti < tasks.length) {
        var ts0 = performance.now(), okT = tasks[ti](lim);
        TT[ti] = (TT[ti] || 0) + performance.now() - ts0;
        if (!okT) return false;
        ti++;
        if (performance.now() > lim) return ti >= tasks.length ? (done = true) : false;
      }
      done = true; return true;
    },
    cancel: function () { done = true; },
    times: function () { return ['ground', 'its edges', 'ground pictures', 'firs', 'timber', 'roof snow', 'its edges', 'laid down'].map(function (n, i) { return n + ' ' + Math.round(TT[i] || 0); }).join(', ') + ' ms'; },
    geom: { X: X, Y0: Y0, Z: Z, drop: drop, firs: firs, Ll: Ll, TER: TER }
  };
}

return { job: job };
})();
