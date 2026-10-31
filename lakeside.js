/* ============================================================
   LAKESIDE — the painters for the autumn lake scene: the trees of the
   wooded headland and the groves (杉 cedar, 松 pine, 銀杏 ginkgo,
   紅葉 maple), a five-storey pagoda (五重塔) and a shrine hall (拝殿)
   built in 3D, mossy rocks, red spider lilies (彼岸花), and the susuki
   (ススキ) plumes that sway in the wind.

   Everything except the susuki is drawn once into the scene's baked
   pictures (nothing here runs per frame, apart from Lakeside.susuki,
   which draws one stem and its plume from a baked sprite).

   Colours are given as [r, g, b]. Every painter takes `fin`, a function
   the scene uses to finish a colour (the time of day's light and the
   haze of the distance), so everything here is lit and hazed like the
   rest of the scene. `lx` is where the light comes from across the
   screen (-1 the left, 1 the right).

   Use (all sizes in CSS px, on a context already scaled to CSS px):
     Lakeside.tree(c, kind, o)    kind 'sugi' | 'matsu' | 'ginkgo' | 'momiji' | 'blob'
                                  o: x, y (the foot), h (height), w (width, optional),
                                     seed, lx, fin, pal (optional, see PAL)
     Lakeside.pagoda(o)           the pagoda's faces in the world (see renderFaces)
     Lakeside.hall(o)             the shrine hall's faces
     Lakeside.renderFaces(c, faces, o)   draws faces furthest first, lit and hazed:
                                  o: proj(x, y, z) → [sx, sy], cam [x, y, z], light [x, y, z],
                                     colour(tone) → [r, g, b], fin(rgb, z) → rgb, shade
     Lakeside.rock(c, o)          a mossy rock: x, y (its foot), w, h, seed, lx, fin, moss
     Lakeside.lily(c, o)          a red spider lily: x, y (its foot), h, seed, fin
     Lakeside.plume(o)            a baked susuki plume sprite: { cnv, w, h, ax, ay }
     Lakeside.blades(c, o)        the leaves at the foot of a susuki clump
     Lakeside.stem(c, o)          one stem and its plume, bent by the wind (per frame)
   ============================================================ */
var Lakeside = (function () {
'use strict';
var PI = Math.PI, TAU = PI * 2;
function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
function lerp(a, b, t) { return a + (b - a) * t; }
function mix(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }
function scale(a, k) { return [a[0] * k, a[1] * k, a[2] * k]; }
function rgb(c, a) {
  var r = Math.round(clamp(c[0], 0, 255)), g = Math.round(clamp(c[1], 0, 255)), b = Math.round(clamp(c[2], 0, 255));
  return a === undefined ? 'rgb(' + r + ',' + g + ',' + b + ')' : 'rgba(' + r + ',' + g + ',' + b + ',' + clamp(a, 0, 1).toFixed(3) + ')';
}
function rng(seed) {
  var s = (seed >>> 0) || 1;
  return function () { s = (s + 0x6D2B79F5) >>> 0; var t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function hex(h) { var n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function same(c) { return c; }

/* The palettes: deep (in shade), mid, lit, and a highlight. */
var PAL = {
  sugi:   { deep: hex('#1C2C22'), mid: hex('#2E4632'), lit: hex('#4B6741'), hi: hex('#6F8550'), trunk: hex('#5A3A2C'), rust: hex('#6A5034') },
  matsu:  { deep: hex('#1A2A20'), mid: hex('#2C4632'), lit: hex('#527046'), hi: hex('#7C9058'), trunk: hex('#7A4A36'), trunkLit: hex('#A8684A') },
  ginkgo: { deep: hex('#A86E14'), mid: hex('#DDA126'), lit: hex('#F3CB45'), hi: hex('#FFE680'), trunk: hex('#5E5048') },
  momiji: { deep: hex('#7E1E1A'), mid: hex('#C2381F'), lit: hex('#E5632A'), hi: hex('#F39A3A'), trunk: hex('#4A3530') },
  kaede:  { deep: hex('#8C3A16'), mid: hex('#D06A22'), lit: hex('#EE9430'), hi: hex('#F7BC4A'), trunk: hex('#4A3530') },
  blob:   { deep: hex('#26362A'), mid: hex('#3A5038'), lit: hex('#5A6E46'), hi: hex('#7A8456'), trunk: hex('#3A3028') }
};

/* A dab of foliage: a soft clump, darker underneath. */
function dab(c, x, y, rx, ry, rot, col, under) {
  if (under) {
    c.fillStyle = under;
    c.beginPath(); c.ellipse(x + rx * 0.12, y + ry * 0.28, rx, ry, rot, 0, TAU); c.fill();
  }
  c.fillStyle = col;
  c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, TAU); c.fill();
}
/* A small fan of a ginkgo leaf, or a maple leaf's star, for near trees. */
function fan(c, x, y, s, rot, col) {
  c.fillStyle = col;
  c.beginPath();
  c.moveTo(x, y);
  c.arc(x, y, s, rot - 0.9, rot + 0.9);
  c.closePath(); c.fill();
}
function star(c, x, y, s, rot, col) {
  c.fillStyle = col;
  c.beginPath();
  for (var i = 0; i < 10; i++) {
    var a = rot + i * PI / 5, r = i % 2 ? s * 0.42 : s;
    if (i) c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); else c.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  c.closePath(); c.fill();
}

/* ---------------- TREES ---------------- */
/* How lit a point of a crown is: 0 in its own shade … 1 full light.
   u, v: where in the crown (-1 … 1 across, -1 top … 1 bottom). */
function litAt(u, v, lx, j) { return clamp(0.5 - 0.42 * lx * u - 0.3 * v + j, 0, 1); }
function tone(P, k) {
  return k < 0.5 ? mix(P.deep, P.mid, k * 2) : k < 0.85 ? mix(P.mid, P.lit, (k - 0.5) / 0.35) : mix(P.lit, P.hi, (k - 0.85) / 0.15);
}

/* 杉 — Japanese cedar: tall and narrow, a rounded point at the top, its
   foliage in dense spiky clumps that stand out from the cone. */
function sugi(c, o, P, r) {
  var x = o.x, y = o.y, h = o.h, w = o.w || h * 0.3, fin = o.fin, lx = o.lx;
  var top = y - h, foot = y - h * 0.1;                       // the foliage, from the top down to just above the foot
  // the trunk, where it shows below the branches
  c.fillStyle = rgb(fin(scale(P.trunk, 0.8)));
  c.fillRect(x - w * 0.06, foot - h * 0.04, w * 0.12, y - foot + h * 0.04);
  var rust = r() < 0.3 ? 0.25 * r() : 0;                    // a few cedars turn a little rusty in autumn
  function hw(t) { return w * (0.08 + 0.92 * Math.pow(t, 0.85)) * 0.5; }   // half-width t of the way down
  // the dark body
  c.fillStyle = rgb(fin(P.deep));
  c.beginPath(); c.moveTo(x, top);
  var steps = Math.max(6, Math.round(h / 7));
  for (var i = 1; i <= steps; i++) { var t = i / steps; c.lineTo(x + hw(t) * lerp(0.75, 1.05, r()), lerp(top, foot, t)); }
  for (var j = steps; j >= 1; j--) { var t2 = j / steps; c.lineTo(x - hw(t2) * lerp(0.75, 1.05, r()), lerp(top, foot, t2)); }
  c.closePath(); c.fill();
  // the clumps, back to front: darker first, the lit ones on top
  var n = clamp(Math.round(h * h / 40), 10, 170), list = [];
  for (var k = 0; k < n; k++) {
    var tt = Math.pow(r(), 0.85), u = r() * 2 - 1;
    var cx = x + u * hw(tt) * 0.9, cy = lerp(top + h * 0.03, foot, tt);
    var s = w * lerp(0.1, 0.19, r()) * lerp(0.6, 1.1, tt);
    var lit = litAt(u, tt * 2 - 1, lx, (r() - 0.5) * 0.3) * lerp(1, 0.8, tt);
    list.push({ x: cx, y: cy, s: s, k: lit });
  }
  list.sort(function (a, b) { return a.k - b.k; });
  var under = rgb(fin(scale(P.deep, 0.85)));
  for (var m = 0; m < list.length; m++) {
    var D = list[m], col = tone(P, D.k);
    if (rust) col = mix(col, P.rust, rust);
    dab(c, D.x, D.y, D.s, D.s * 0.62, (r() - 0.5) * 0.5, rgb(fin(col)), D.s > 2 ? under : null);
  }
}

/* 松 — Japanese red pine: a leaning, curving reddish trunk and flat
   cloud-like pads of needles at the ends of the branches. */
function matsu(c, o, P, r) {
  var x = o.x, y = o.y, h = o.h, w = o.w || h * 0.9, fin = o.fin, lx = o.lx;
  var lean = (r() - 0.5) * 0.5 + (o.lean || 0), tw = Math.max(1, h * 0.035);
  function trunkAt(t) { return [x + lean * h * t * t * 0.6 + Math.sin(t * 3 + lean * 4) * h * 0.03 * t, y - h * 0.82 * t]; }
  // the trunk: a darker side and a lit side
  var pts = []; for (var i = 0; i <= 10; i++) pts.push(trunkAt(i / 10));
  c.lineCap = 'round'; c.lineJoin = 'round';
  c.strokeStyle = rgb(fin(scale(P.trunk, 0.7)));
  for (var s = 0; s < 10; s++) { c.lineWidth = tw * lerp(1.3, 0.45, s / 10); c.beginPath(); c.moveTo(pts[s][0], pts[s][1]); c.lineTo(pts[s + 1][0], pts[s + 1][1]); c.stroke(); }
  c.strokeStyle = rgb(fin(P.trunkLit));
  for (var s2 = 0; s2 < 10; s2++) { c.lineWidth = tw * lerp(0.55, 0.2, s2 / 10); c.beginPath(); c.moveTo(pts[s2][0] + lx * tw * 0.3, pts[s2][1]); c.lineTo(pts[s2 + 1][0] + lx * tw * 0.3, pts[s2 + 1][1]); c.stroke(); }
  // the pads, from the top down (lower pads in front, as seen from below)
  var nP = 3 + Math.floor(r() * 4), pads = [];
  for (var p = 0; p < nP; p++) {
    var t = p === 0 ? 1 : lerp(0.4, 0.92, r()), base = trunkAt(t);
    var side = p === 0 ? 0 : (p % 2 ? 1 : -1) * (r() < 0.8 ? 1 : -1);
    var reach = p === 0 ? 0 : w * lerp(0.22, 0.48, r()) * lerp(1.1, 0.6, t);
    var px = base[0] + side * reach, py = base[1] - h * lerp(0.02, 0.08, r());
    pads.push({ bx: base[0], by: base[1], x: px, y: py, w: w * lerp(0.22, 0.34, r()) * (p === 0 ? 1.15 : 1), t: t });
  }
  pads.sort(function (a, b) { return a.y - b.y; });
  pads.forEach(function (Pd) {
    if (Pd.x !== Pd.bx) {
      c.strokeStyle = rgb(fin(scale(P.trunk, 0.75)));
      c.lineWidth = tw * 0.4;
      c.beginPath(); c.moveTo(Pd.bx, Pd.by); c.quadraticCurveTo((Pd.bx + Pd.x) / 2, Pd.by - Math.abs(Pd.x - Pd.bx) * 0.25, Pd.x, Pd.y); c.stroke();
    }
    var pw = Pd.w, ph = pw * 0.36;
    dab(c, Pd.x, Pd.y + ph * 0.25, pw * 0.5, ph * 0.5, 0, rgb(fin(P.deep)));
    var n = clamp(Math.round(pw * pw / 30), 6, 60), list = [];
    for (var k = 0; k < n; k++) {
      var a = r() * TAU, d = Math.sqrt(r());
      var u = Math.cos(a) * d, v = Math.sin(a) * d;
      list.push({ x: Pd.x + u * pw * 0.48, y: Pd.y + v * ph * 0.45, s: pw * lerp(0.08, 0.15, r()), k: litAt(u, v * 1.6 - 0.2, lx, (r() - 0.5) * 0.3) });
    }
    list.sort(function (a, b) { return a.k - b.k; });
    list.forEach(function (D) { dab(c, D.x, D.y, D.s, D.s * 0.5, 0, rgb(fin(tone(P, D.k)))); });
  });
}

/* A rounded broadleaf crown of dabs (ginkgo, maple, far trees). shape: rx, ry as fractions of h. */
function crown(c, o, P, r, kind) {
  var x = o.x, y = o.y, h = o.h, fin = o.fin, lx = o.lx;
  var ginkgo = kind === 'ginkgo', blob = kind === 'blob';
  var w = o.w || h * (ginkgo ? 0.62 : blob ? 0.7 : 0.95);
  var cy = y - h * (ginkgo ? 0.56 : 0.58), rx = w * 0.5, ry = h * (ginkgo ? 0.44 : 0.4);
  // the trunk (and for a maple, a fork showing under the crown)
  var tw = Math.max(0.8, h * 0.035);
  c.strokeStyle = rgb(fin(P.trunk)); c.lineCap = 'round';
  c.lineWidth = tw;
  c.beginPath(); c.moveTo(x, y); c.lineTo(x + (r() - 0.5) * tw, cy + ry * 0.2); c.stroke();
  if (!ginkgo && !blob && h > 20) {
    c.lineWidth = tw * 0.6;
    c.beginPath(); c.moveTo(x, cy + ry * 0.75); c.lineTo(x - rx * 0.45, cy + ry * 0.1); c.moveTo(x, cy + ry * 0.7); c.lineTo(x + rx * 0.4, cy + ry * 0.05); c.stroke();
  }
  // a lumpy outline: a few big lobes in the shade colour
  var lobes = 5 + Math.floor(r() * 4);
  c.fillStyle = rgb(fin(P.deep));
  for (var b = 0; b < lobes; b++) {
    var a = (b / lobes) * TAU + r() * 0.5, d = lerp(0.35, 0.55, r());
    c.beginPath(); c.ellipse(x + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d, rx * lerp(0.45, 0.6, r()), ry * lerp(0.42, 0.55, r()), 0, 0, TAU); c.fill();
  }
  // the dabs
  var n = clamp(Math.round(h * h / (ginkgo ? 32 : 40)), 8, ginkgo ? 190 : 150), list = [];
  for (var k = 0; k < n; k++) {
    var a2 = r() * TAU, d2 = Math.sqrt(r()) * 0.98;
    var u = Math.cos(a2) * d2, v = Math.sin(a2) * d2;
    var lumpy = 1 + 0.12 * Math.sin(a2 * 3 + o.seed);
    list.push({ x: x + u * rx * lumpy, y: cy + v * ry * lumpy, s: h * lerp(0.05, 0.09, r()), k: litAt(u, v, lx, (r() - 0.5) * 0.35), rot: r() * TAU });
  }
  list.sort(function (a, b) { return a.k - b.k; });
  var shapes = h > 60 && !blob;
  for (var m = 0; m < list.length; m++) {
    var D = list[m], col = rgb(fin(tone(P, D.k)));
    if (shapes && m % 3 === 0) { if (ginkgo) fan(c, D.x, D.y, D.s * 1.1, D.rot, col); else star(c, D.x, D.y, D.s * 1.05, D.rot, col); }
    else dab(c, D.x, D.y, D.s, D.s * 0.8, 0, col);
  }
}

function tree(c, kind, o) {
  var r = rng((o.seed || 1) * 2654435761);
  var P = o.pal || PAL[kind] || PAL.blob;
  o.fin = o.fin || same; o.lx = o.lx === undefined ? -0.7 : o.lx;
  c.save();
  if (kind === 'sugi') sugi(c, o, P, r);
  else if (kind === 'matsu') matsu(c, o, P, r);
  else crown(c, o, P, r, kind);
  c.restore();
}

/* ---------------- 3D BUILDINGS ----------------
   Faces in world units: { p: [[x, y, z] …], tone, c: [x, y, z] (the middle of
   its solid, to know which way is out) }. */
function boxFaces(out, cx, cy, cz, hx, hy, hz, yaw, tones, ox, oz) {
  var cs = Math.cos(yaw), sn = Math.sin(yaw);
  function W(x, y, z) { return [ox + x * cs - z * sn, y, oz + x * sn + z * cs]; }
  var v = [];
  for (var i = 0; i < 8; i++) v.push(W(cx + (i & 1 ? hx : -hx), cy + (i & 2 ? hy : -hy), cz + (i & 4 ? hz : -hz)));
  var mid = W(cx, cy, cz), q = [[0, 1, 3, 2], [4, 6, 7, 5], [0, 4, 5, 1], [2, 3, 7, 6], [0, 2, 6, 4], [1, 5, 7, 3]];
  var tn = [tones.side, tones.side, tones.bottom || tones.side, tones.top || tones.side, tones.side, tones.side];
  for (var f = 0; f < 6; f++) out.push({ p: q[f].map(function (k) { return v[k]; }), tone: tn[f], c: mid });
}
/* A hipped roof with upturned corners (反り): eaves at y, half-widths ex, ez,
   rising to a ridge (or a point) at y + rise. */
function roofFaces(out, y, ex, ez, rise, ridge, lift, thick, yaw, ox, oz, seg) {
  var cs = Math.cos(yaw), sn = Math.sin(yaw);
  function W(x, yy, z) { return [ox + x * cs - z * sn, yy, oz + x * sn + z * cs]; }
  var mid = W(0, y + rise * 0.3, 0);
  function eave(u, side) {               // a point along one side's eave, u -1 … 1, lifted toward the corners
    var k = Math.pow(Math.abs(u), 2.2) * lift;
    if (side === 0) return [u * ex, y + k, -ez];
    if (side === 1) return [ex, y + k, u * ez];
    if (side === 2) return [-u * ex, y + k, ez];
    return [-ex, y + k, -u * ez];
  }
  function top(u, side) {                 // the matching point at the top: a ridge along x (ridge > 0) or a square ring (ridge < 0)
    var yy = y + rise;
    if (ridge < 0) {
      var rr = -ridge * ex;
      if (side === 0) return [u * rr, yy, -rr];
      if (side === 1) return [rr, yy, u * rr];
      if (side === 2) return [-u * rr, yy, rr];
      return [-rr, yy, -u * rr];
    }
    var rx = ridge * ex;
    if (side === 0) return [u * rx, yy, 0];
    if (side === 1) return [rx, yy, 0];
    if (side === 2) return [-u * rx, yy, 0];
    return [-rx, yy, 0];
  }
  for (var side = 0; side < 4; side++) {
    for (var s = 0; s < seg; s++) {
      var u0 = -1 + 2 * s / seg, u1 = -1 + 2 * (s + 1) / seg;
      var a = eave(u0, side), b = eave(u1, side), A = top(u0, side), B = top(u1, side);
      var a2 = [a[0] * 0.985, a[1] - thick, a[2] * 0.985], b2 = [b[0] * 0.985, b[1] - thick, b[2] * 0.985];
      out.push({ p: [W(a[0], a[1], a[2]), W(b[0], b[1], b[2]), W(B[0], B[1], B[2]), W(A[0], A[1], A[2])], tone: 'roof', c: mid });
      out.push({ p: [W(a2[0], a2[1], a2[2]), W(b2[0], b2[1], b2[2]), W(b[0], b[1], b[2]), W(a[0], a[1], a[2])], tone: 'fascia', c: mid });
      // the underside of the eaves, back to the wall
      var ia = [a2[0] * 0.55, a2[1] - thick * 0.6, a2[2] * 0.55], ib = [b2[0] * 0.55, b2[1] - thick * 0.6, b2[2] * 0.55];
      out.push({ p: [W(a2[0], a2[1], a2[2]), W(ia[0], ia[1], ia[2]), W(ib[0], ib[1], ib[2]), W(b2[0], b2[1], b2[2])], tone: 'soffit', c: W(0, y + rise, 0) });
    }
  }
}
/* 五重塔 — five storeys, each a little narrower, each under a wide roof with
   upturned corners, on a stone base, with the bronze spire (相輪) on top.
   o: x, y (the foot, world), z, size (the height to the top of the spire), yaw. */
function pagoda(o) {
  var out = [], S = o.size, yaw = o.yaw || 0.5, X = o.x, Z = o.z, Y = o.y;
  var b0 = 0.13 * S, y = Y;
  boxFaces(out, 0, y + 0.012 * S, 0, b0 * 1.55, 0.012 * S, b0 * 1.55, yaw, { side: 'stone', top: 'stone' }, X, Z);
  boxFaces(out, 0, y + 0.03 * S, 0, b0 * 1.35, 0.008 * S, b0 * 1.35, yaw, { side: 'stone', top: 'stone' }, X, Z);
  y += 0.038 * S;
  for (var i = 0; i < 5; i++) {
    var b = b0 * (1 - 0.085 * i), bh = (i === 0 ? 0.088 : 0.07) * S;
    boxFaces(out, 0, y + bh / 2, 0, b, bh / 2, b, yaw, { side: 'wall', top: 'wall' }, X, Z);
    // the band of brackets under the eaves
    boxFaces(out, 0, y + bh + 0.008 * S, 0, b * 1.12, 0.008 * S, b * 1.12, yaw, { side: 'bracket', bottom: 'soffit' }, X, Z);
    var ey = y + bh + 0.022 * S, e = b * (i === 4 ? 2.05 : 1.95);
    var rise = i === 4 ? 0.075 * S : 0.034 * S, ridge = i === 4 ? -0.03 : -(b0 * (1 - 0.085 * (i + 1))) / e;
    roofFaces(out, ey, e, e, rise, ridge, 0.024 * S, 0.012 * S, yaw, X, Z, 5);
    y = ey + (i === 4 ? rise : 0.012 * S);
  }
  // the spire: a pole with nine rings and a finial
  var py = y, ph = 0.2 * S;
  boxFaces(out, 0, py + ph / 2, 0, 0.007 * S, ph / 2, 0.007 * S, yaw, { side: 'bronze' }, X, Z);
  for (var k = 0; k < 9; k++) {
    var ry = py + 0.035 * S + k * 0.012 * S;
    boxFaces(out, 0, ry, 0, 0.022 * S, 0.0035 * S, 0.022 * S, yaw, { side: 'bronze', top: 'bronze' }, X, Z);
  }
  boxFaces(out, 0, py + ph * 0.96, 0, 0.012 * S, 0.012 * S, 0.012 * S, yaw, { side: 'bronze' }, X, Z);
  return out;
}
/* 拝殿 — a low hall with a big hipped roof. o: x, y, z, size (its width), yaw. */
function hall(o) {
  var out = [], S = o.size, yaw = o.yaw || -0.3, X = o.x, Z = o.z, y = o.y;
  boxFaces(out, 0, y + 0.03 * S, 0, 0.55 * S, 0.03 * S, 0.36 * S, yaw, { side: 'stone', top: 'stone' }, X, Z);
  boxFaces(out, 0, y + 0.06 * S + 0.13 * S, 0, 0.46 * S, 0.13 * S, 0.29 * S, yaw, { side: 'wall', top: 'wall' }, X, Z);
  boxFaces(out, 0, y + 0.33 * S, 0, 0.5 * S, 0.012 * S, 0.33 * S, yaw, { side: 'bracket', bottom: 'soffit' }, X, Z);
  roofFaces(out, y + 0.35 * S, 0.66 * S, 0.47 * S, 0.3 * S, 0.45, 0.04 * S, 0.022 * S, yaw, X, Z, 6);
  return out;
}
/* Faces, furthest first, only those turned toward the camera, each lit by
   how it faces the light. */
function renderFaces(c, faces, o) {
  var cam = o.cam, Lt = o.light, shade = o.shade === undefined ? 0.5 : o.shade;
  var list = [];
  for (var i = 0; i < faces.length; i++) {
    var f = faces[i], p = f.p, n = p.length, cx = 0, cy = 0, cz = 0;
    for (var j = 0; j < n; j++) { cx += p[j][0]; cy += p[j][1]; cz += p[j][2]; }
    cx /= n; cy /= n; cz /= n;
    var a = p[0], b = p[1], d = p[n - 1];
    var ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
    var nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, nl = Math.hypot(nx, ny, nz);
    if (nl < 1e-12) continue;
    nx /= nl; ny /= nl; nz /= nl;
    if (nx * (cx - f.c[0]) + ny * (cy - f.c[1]) + nz * (cz - f.c[2]) < 0) { nx = -nx; ny = -ny; nz = -nz; }
    if (nx * (cam[0] - cx) + ny * (cam[1] - cy) + nz * (cam[2] - cz) <= 0) continue;
    var dx = cx - cam[0], dy = cy - cam[1], dz = cz - cam[2];
    list.push({ f: f, d: dx * dx + dy * dy + dz * dz, lam: Math.max(0, nx * Lt[0] + ny * Lt[1] + nz * Lt[2]), ny: ny, z: cz });
  }
  list.sort(function (A, B) { return B.d - A.d; });
  c.lineJoin = 'round';
  for (var k = 0; k < list.length; k++) {
    var L = list[k], base = o.colour(L.f.tone), lit = 1 - shade * (1 - L.lam);
    var col = scale(base, lit);
    if (L.ny < -0.5) col = scale(col, 0.8);
    col = o.fin(col, L.z);
    var scr = L.f.p.map(function (q) { return o.proj(q[0], q[1], q[2]); });
    var st = rgb(col);
    c.fillStyle = st; c.strokeStyle = st; c.lineWidth = 0.5;
    c.beginPath();
    for (var m = 0; m < scr.length; m++) { if (m) c.lineTo(scr[m][0], scr[m][1]); else c.moveTo(scr[m][0], scr[m][1]); }
    c.closePath(); c.fill(); c.stroke();
  }
}

/* ---------------- THE SHORE ---------------- */
/* A rounded rock, lit on one side, with moss on top. */
function rock(c, o) {
  var r = rng((o.seed || 1) * 40503), x = o.x, y = o.y, w = o.w, h = o.h || w * 0.55, fin = o.fin || same, lx = o.lx === undefined ? -0.7 : o.lx;
  var stone = o.stone || [138, 130, 120], moss = o.mossCol || [96, 112, 62];
  var n = 9, pts = [];
  for (var i = 0; i < n; i++) {
    var a = PI + (i / (n - 1)) * PI;                      // the top half: from the left foot over to the right
    var rr = lerp(0.8, 1.08, r());
    pts.push([x + Math.cos(a) * w * 0.5 * rr, y + Math.sin(a) * h * rr]);
  }
  function outline() {
    c.beginPath(); c.moveTo(x - w * 0.52, y);
    for (var k = 0; k < pts.length; k++) c.lineTo(pts[k][0], pts[k][1]);
    c.lineTo(x + w * 0.52, y); c.closePath();
  }
  // shadow under it
  c.fillStyle = 'rgba(20,14,10,0.35)';
  c.beginPath(); c.ellipse(x - lx * w * 0.12, y, w * 0.6, Math.max(1, h * 0.18), 0, 0, TAU); c.fill();
  var g = c.createLinearGradient(x + lx * w * 0.5, y - h, x - lx * w * 0.5, y);
  g.addColorStop(0, rgb(fin(scale(stone, 1.15))));
  g.addColorStop(0.6, rgb(fin(stone)));
  g.addColorStop(1, rgb(fin(scale(stone, 0.55))));
  outline(); c.fillStyle = g; c.fill();
  // the moss on the top
  var mk = o.moss === undefined ? 0.6 : o.moss;
  if (mk > 0) {
    c.save(); outline(); c.clip();
    var nm = Math.max(3, Math.round(w / 3));
    for (var j = 0; j < nm; j++) {
      var u = r() * 2 - 1, mx = x + u * w * 0.45, my = y - h * lerp(0.75, 1.05, r()) * Math.sqrt(1 - u * u * 0.7);
      var ms = w * lerp(0.1, 0.22, r()) * mk;
      c.fillStyle = rgb(fin(scale(moss, lerp(0.75, 1.2, r()) * (u * lx < 0 ? 1.08 : 0.85))));
      c.beginPath(); c.ellipse(mx, my, ms, ms * 0.55, 0, 0, TAU); c.fill();
    }
    c.restore();
  }
}
/* 彼岸花 — a red spider lily: a bare green stem with a ring of narrow
   recurved petals and long stamens curving up and out. */
function lily(c, o) {
  var r = rng((o.seed || 1) * 7907), x = o.x, y = o.y, h = o.h, fin = o.fin || same;
  var red = o.red || [206, 28, 30], deep = o.deep || [128, 12, 22], stemC = o.stem || [92, 116, 52];
  var lean = (r() - 0.5) * 0.3, hx = x + lean * h, hy = y - h;
  c.strokeStyle = rgb(fin(stemC)); c.lineWidth = Math.max(0.5, h * 0.035); c.lineCap = 'round';
  c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x, y - h * 0.6, hx, hy); c.stroke();
  var R = h * 0.32;
  if (R < 1.6) { c.fillStyle = rgb(fin(red)); c.beginPath(); c.arc(hx, hy, Math.max(0.8, R), 0, TAU); c.fill(); return; }
  // stamens first (behind), then the petals
  c.lineWidth = Math.max(0.35, R * 0.04);
  c.strokeStyle = rgb(fin(mix(red, [240, 80, 70], 0.3)));
  for (var s = 0; s < 7; s++) {
    var a = -PI / 2 + (s / 6 - 0.5) * 2.6 + (r() - 0.5) * 0.2, L = R * lerp(1.1, 1.45, r());
    c.beginPath(); c.moveTo(hx, hy);
    c.quadraticCurveTo(hx + Math.cos(a) * L * 0.7, hy + Math.sin(a) * L * 0.4, hx + Math.cos(a) * L, hy + Math.sin(a) * L * 0.75 - L * 0.25);
    c.stroke();
  }
  for (var p = 0; p < 6; p++) {
    var b = (p / 6) * TAU + r() * 0.3, pl = R * lerp(0.55, 0.75, r());
    var ex = hx + Math.cos(b) * pl, ey = hy + Math.sin(b) * pl * 0.45;
    c.strokeStyle = rgb(fin(p % 2 ? deep : red)); c.lineWidth = Math.max(0.6, R * 0.13);
    c.beginPath(); c.moveTo(hx, hy); c.quadraticCurveTo((hx + ex) / 2, (hy + ey) / 2 - R * 0.15, ex, ey - R * 0.2); c.stroke();
  }
  c.fillStyle = rgb(fin(deep)); c.beginPath(); c.arc(hx, hy, R * 0.16, 0, TAU); c.fill();
}

/* ---------------- SUSUKI ---------------- */
/* A plume, baked once: silky, drooping strands fanning from the top of the
   stem, silver-gold, lit warmly from one side. Drawn pointing up; (ax, ay)
   is where it joins the stem. */
function plume(o) {
  var r = rng((o.seed || 1) * 9973), res = o.res || 1, L = o.len || 60, fin = o.fin || same;
  var w = Math.ceil(L * 0.75), h = Math.ceil(L * 1.1);
  var cnv = document.createElement('canvas');
  cnv.width = Math.ceil(w * res); cnv.height = Math.ceil(h * res);
  var c = cnv.getContext('2d');
  c.setTransform(res, 0, 0, res, 0, 0);
  var ax = w / 2, ay = h - 2, droop = lerp(0.25, 0.6, r()), side = r() < 0.5 ? -1 : 1;
  var base = o.colour || [226, 206, 176], lit = o.lit || [255, 236, 196], shade = o.shade || [168, 140, 112];
  c.lineCap = 'round';
  var n = Math.round(lerp(18, 28, r()));
  for (var i = 0; i < n; i++) {
    var t = i / (n - 1), start = ay - L * lerp(0.05, 0.6, t);      // the strands come off the top part of the stem
    var ang = -PI / 2 + side * droop * lerp(0.2, 1, r()) + (r() - 0.5) * 0.5;
    var len = L * lerp(0.35, 0.6, r()) * lerp(1, 0.7, t);
    var ex = ax + Math.cos(ang) * len, ey = start + Math.sin(ang) * len + len * droop * 0.35;
    var k = clamp(0.5 + (r() - 0.5) * 0.8 - side * 0.2, 0, 1);
    // a soft glow for the silk, then a fine bright strand
    c.strokeStyle = rgb(fin(mix(shade, base, k)), 0.4); c.lineWidth = L * 0.085;
    c.beginPath(); c.moveTo(ax, start); c.quadraticCurveTo(ax + (ex - ax) * 0.3, start - len * 0.45, ex, ey); c.stroke();
    c.strokeStyle = rgb(fin(mix(base, lit, k)), 0.95); c.lineWidth = Math.max(0.6, L * 0.026);
    c.beginPath(); c.moveTo(ax, start); c.quadraticCurveTo(ax + (ex - ax) * 0.3, start - len * 0.45, ex, ey); c.stroke();
  }
  // the top of the stem inside it
  c.strokeStyle = rgb(fin(shade), 0.8); c.lineWidth = Math.max(0.5, L * 0.02);
  c.beginPath(); c.moveTo(ax, ay); c.lineTo(ax, ay - L * 0.6); c.stroke();
  return { cnv: cnv, w: w, h: h, ax: ax, ay: ay, res: res };
}
/* The long arching leaves at the foot of a clump (baked). */
function blades(c, o) {
  var r = rng((o.seed || 1) * 5003), x = o.x, y = o.y, h = o.h, fin = o.fin || same;
  var green = o.green || [118, 124, 70], tan = o.tan || [176, 148, 96];
  var n = Math.round(lerp(8, 14, r()));
  c.lineCap = 'round';
  for (var i = 0; i < n; i++) {
    var a = -PI / 2 + (r() - 0.5) * 2.2, L = h * lerp(0.4, 0.8, r());
    var ex = x + Math.cos(a) * L, ey = y + Math.sin(a) * L * 0.8;
    var droop = L * lerp(0.15, 0.4, r()) * (Math.cos(a) < 0 ? -1 : 1);
    c.strokeStyle = rgb(fin(mix(green, tan, r())));
    c.lineWidth = Math.max(0.5, h * 0.025);
    c.beginPath(); c.moveTo(x + (r() - 0.5) * h * 0.08, y);
    c.quadraticCurveTo(x + Math.cos(a) * L * 0.55, y + Math.sin(a) * L * 0.75, ex + droop, ey + Math.abs(droop) * 0.6);
    c.stroke();
  }
}
/* One stem with its plume, bent by the wind: bend (radians at the tip). */
function stem(c, o) {
  var x = o.x, y = o.y, L = o.len, b = o.bend, a0 = o.angle || 0;
  var tipA = a0 + b, midA = a0 + b * 0.4;
  var mx = x + Math.sin(midA) * L * 0.5, my = y - Math.cos(midA) * L * 0.5;
  var tx = x + Math.sin(a0 + b * 0.55) * L, ty = y - Math.cos(a0 + b * 0.55) * L * lerp(1, 0.92, Math.abs(b));
  c.strokeStyle = o.stemCol; c.lineWidth = o.width;
  c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(mx, my, tx, ty); c.stroke();
  var P = o.plume, s = o.size / P.h;
  c.save();
  c.translate(tx, ty); c.rotate(tipA); c.scale(s, s);
  c.drawImage(P.cnv, -P.ax, -P.ay, P.w, P.h);
  c.restore();
}

return { tree: tree, pagoda: pagoda, hall: hall, renderFaces: renderFaces, rock: rock, lily: lily,
         plume: plume, blades: blades, stem: stem, PAL: PAL, rng: rng };
})();
