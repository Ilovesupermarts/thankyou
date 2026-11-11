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
var TILE = hex('#3B3A43'), FASCIA = hex('#2C2A30'), SNOW = hex('#F6F6FA'), GOLD = hex('#D2A24A'), STONE = hex('#9C978F');
var GLOW = hex('#FFB65C'), PANE_DAY = hex('#2C2422');

function pagoda(c, cam, o) {
  var hgt = o.foot - o.top;                       // its height on the screen (px)
  // where it stands: from its place and size on the screen, through the camera
  var S = 60;                                      // its height in the world (m): a tall five-storey pagoda
  var Z = cam.F * S / hgt;                         // so this far away
  var X = (o.x - cam.cx) * Z / cam.F, Y0 = (cam.hy - o.foot) * Z / cam.F;
  var yaw = o.yaw || 0, cs = Math.cos(yaw), sn = Math.sin(yaw);
  var P = PAL[o.style] || PAL.timber, lit = o.lit || 0, snowK = o.snow === undefined ? 1 : o.snow;
  // the light, turned into the camera's space (there, toward you is -z)
  var L = { sun: [o.light.sun[0], o.light.sun[1], -o.light.sun[2]], sunCol: o.light.sunCol, skyCol: o.light.skyCol, amb: o.light.amb, haze: o.light.haze };
  var hz = o.haze || 0;
  function Wp(x, y, z) { return [X + x * cs + z * sn, Y0 + y, Z - x * sn + z * cs]; }       // local → world (z local: toward the back)
  var eye = [0, 0, 0];
  function fin(col) { return mix(col, L.haze, hz); }
  var faces = [];
  // a face: points (local), material, the middle of its solid (local, so the outside is known), detail
  function face(pts, mat, mid, det) { faces.push({ p: pts.map(function (q) { return Wp(q[0], q[1], q[2]); }), mat: mat, mid: Wp(mid[0], mid[1], mid[2]), det: det }); }
  function box(cx, cy, cz, hx, hy, hz2, mat, det, sides) {
    var v = [];
    for (var i = 0; i < 8; i++) v.push([cx + (i & 1 ? hx : -hx), cy + (i & 2 ? hy : -hy), cz + (i & 4 ? hz2 : -hz2)]);
    var Q = [[0, 1, 3, 2], [5, 4, 6, 7], [4, 0, 2, 6], [1, 5, 7, 3], [2, 3, 7, 6], [4, 5, 1, 0]];   // front, back, left, right, top, bottom
    for (var f = 0; f < 6; f++) {
      if (f === 5 && sides && sides.bottom === 'none') continue;          // (resting on the ground: no underside)
      var m = (f === 4 && sides && sides.top) || (f === 5 && sides && sides.bottom) || mat;
      face(Q[f].map(function (k) { return v[k]; }), m, [cx, cy, cz], f < 4 ? det : null);
    }
  }
  // the storeys, from the top down, each drawn as its own group (a lower roof hides the storey above it from below)
  var groups = [];
  function group() { faces = []; groups.push(faces); }

  var b0 = 0.105 * S, y = 0;
  var stH = [0.088, 0.076, 0.072, 0.068, 0.064];
  var storeyY = [], st;
  // the stone platform (基壇): its top is the pagoda's floor; snow lies banked against it partway up
  var hp = 0.055 * S, bp = b0 * 1.75, bank = hp * 0.45;
  y = hp;
  for (st = 0; st < 5; st++) { storeyY.push(y); y += stH[st] * S + 0.045 * S; }
  var spireBase = y;
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
  for (st = 4; st >= 0; st--) {
    group();
    var b = b0 * (1 - 0.075 * st), h = stH[st] * S, yb = storeyY[st];
    // the body: posts, a rail, the windows (lit after dusk)
    box(0, yb + h / 2, 0, b, h / 2, b, 'wall', 'wall');
    // the brackets: two stepped bands under the eaves
    box(0, yb + h + 0.006 * S, 0, b * 1.12, 0.006 * S, b * 1.12, 'bracket', 'bracket', { bottom: 'soffit' });
    box(0, yb + h + 0.017 * S, 0, b * 1.3, 0.006 * S, b * 1.3, 'bracket', 'bracket', { bottom: 'soffit' });
    // the roof: hipped, the corners turned up, a dark fascia, the underside, and the snow on it
    var ey = yb + h + 0.024 * S, e = b * (st === 0 ? 2.2 : 2.05), rise = st === 4 ? 0.06 * S : 0.032 * S;
    var inner = st === 4 ? 0.03 * S : b0 * (1 - 0.075 * (st + 1)) * 1.02, lift = 0.022 * S, th = 0.011 * S;
    roof(ey, e, inner, rise, lift, th, st === 4);
    // the balcony (高欄) round the storey above this roof: a low rail on the snow (not on the top roof)
  }
  // the hill's snow round the platform: banked against its walls, then sloping down toward you and to the sides
  // (seen from a little below, this slope is what hides the platform's foot: it stands in the snow, not on it)
  group();
  var run = 0.3 * S, drop = 0.07 * S, wide = bp * 1.9, deep = [0, -S, 0];
  face([[-bp, bank, -bp], [bp, bank, -bp], [wide, -drop, -bp - run], [-wide, -drop, -bp - run]], 'ground', deep);
  face([[bp, bank, -bp], [bp, bank, bp], [bp + run * 0.8, -drop, bp], [wide, -drop, -bp - run]], 'ground', deep);
  face([[-bp, bank, bp], [-bp, bank, -bp], [-wide, -drop, -bp - run], [-bp - run * 0.8, -drop, bp]], 'ground', deep);
  // the platform (only the part above the snow), then the steps up to it from the snow, between two low side walls
  group();
  box(0, (bank + hp) / 2, 0, bp, (hp - bank) / 2, bp, 'stone', 'stonework', { top: 'snow', bottom: 'none' });
  function groundAt(d) { return bank - (bank + drop) * d / run; }      // the snow's height, d in front of the platform
  var nSt = 7, dz = 0.024 * S, Ls = nSt * dz, yEnd = groundAt(Ls), rs = (hp - yEnd) / nSt, ws = bp * 0.42;
  for (var q = 1; q <= nSt; q++) {
    var yk = hp - q * rs, yb = groundAt(q * dz) - 0.01 * S, zc = -bp - (q - 0.5) * dz;
    box(0, (yk + yb) / 2, zc, ws, (yk - yb) / 2, dz / 2, 'stone', null, { top: 'tread', bottom: 'none' });
  }
  [-1, 1].forEach(function (sd) {
    var x0 = sd * ws, x1 = sd * ws * 1.32, cap = 0.014 * S, yA = hp + cap, yB = yEnd + cap, zA = -bp, zB = -bp - Ls;
    var mid = [sd * ws * 1.16, (hp + yEnd) / 2, -bp - Ls / 2];
    face([[x1, bank, zA], [x1, groundAt(Ls), zB], [x1, yB, zB], [x1, yA, zA]], 'stone', mid);       // its outer face
    face([[x0, yEnd, zB], [x0, hp, zA], [x0, yA, zA], [x0, yB, zB]], 'stone', mid);                  // its inner face, over the steps
    face([[x0, yA, zA], [x1, yA, zA], [x1, yB, zB], [x0, yB, zB]], 'snow', mid);                     // the snow along its top
    face([[x0, groundAt(Ls), zB], [x1, groundAt(Ls), zB], [x1, yB, zB], [x0, yB, zB]], 'stone', mid); // its end
  });

  function roof(ey, e, inner, rise, lift, th, top) {
    var seg = 8;
    function eave(u, side, up) {                   // a point on one side's eave, u -1 … 1, lifted toward the corners
      var kk = Math.pow(Math.abs(u), 2.4) * lift + (up || 0);
      var a = u * e, Y = ey + kk;
      return side === 0 ? [a, Y, -e] : side === 1 ? [e, Y, a] : side === 2 ? [-a, Y, e] : [-e, Y, -a];
    }
    function ring(u, side, r, Y) {
      var a = u * r;
      return side === 0 ? [a, Y, -r] : side === 1 ? [r, Y, a] : side === 2 ? [-a, Y, r] : [-r, Y, -a];
    }
    var midUp = [0, ey + rise * 0.2, 0], midDown = [0, ey + rise + th * 4, 0], axis = [0, ey, 0];
    var sT = 0.022 * S * snowK;                    // how thick the snow lies
    for (var side = 0; side < 4; side++) {
      for (var s = 0; s < seg; s++) {
        var u0 = -1 + 2 * s / seg, u1 = -1 + 2 * (s + 1) / seg;
        var a = eave(u0, side), bb = eave(u1, side), A = ring(u0, side, inner, ey + rise), B = ring(u1, side, inner, ey + rise);
        var a2 = eave(u0, side, -th), b2 = eave(u1, side, -th);
        // the underside of the eaves, back to the brackets
        face([a2, b2, ring(u1, side, e * 0.6, ey - th * 1.4), ring(u0, side, e * 0.6, ey - th * 1.4)], 'soffit', midDown, 'rafters');
        // the fascia: the dark edge of the roof
        face([a2, b2, bb, a], 'fascia', axis);
        // the tiles, then the snow lying on them: a pillow set back from the edge, its rounded front a band of its own
        face([a, bb, B, A], 'tile', midUp);
        if (sT > 0) {
          var f0 = 0.1, sa = mix(a, A, f0), sbp = mix(bb, B, f0);
          var up = function (p, k) { return [p[0], p[1] + sT * k, p[2]]; };
          face([sa, sbp, up(sbp, 1), up(sa, 1)], 'snowEdge', axis);
          face([up(sa, 1), up(sbp, 1), up(B, top ? 0.6 : 0.9), up(A, top ? 0.6 : 0.9)], 'snow', midUp);
        }
      }
    }
  }

  // draw: the groups from the top down, inside each the faces turned to the eye, the furthest first
  var Lsun = norm(L.sun);
  groups.forEach(function (G) {
    var vis = [];
    G.forEach(function (f) {
      var p = f.p, n = norm(cross(sub(p[1], p[0]), sub(p[p.length - 1], p[0])));
      var cen = [0, 0, 0]; p.forEach(function (q) { cen[0] += q[0] / p.length; cen[1] += q[1] / p.length; cen[2] += q[2] / p.length; });
      if (dot(n, sub(cen, f.mid)) < 0) n = [-n[0], -n[1], -n[2]];          // pointing out of its solid
      if (dot(n, sub(eye, cen)) <= 0) return;                              // turned away
      vis.push({ f: f, n: n, d: Math.hypot(cen[0], cen[1], cen[2]) });
    });
    vis.sort(function (A, B) { return B.d - A.d; });
    vis.forEach(function (v) { paintFace(v.f, v.n); });
  });

  function paintFace(f, n) {
    var pts = f.p.map(function (q) { return proj(cam, q); });
    var m = f.mat, base, col;
    if (m === 'snow' || m === 'snowEdge' || m === 'ground' || m === 'tread') {
      base = SNOW;
      col = shade(base, n, L, 1);
      col = mix(col, [col[0] * 0.92, col[1] * 0.95, col[2] * 1.06], 0.5);    // snow in shade turns blue
      if (m === 'snowEdge') col = mix(col, [190, 196, 222], 0.25);
      if (m === 'tread') col = mix(col, [205, 205, 214], 0.18);                 // trodden: a little greyer
    } else if (m === 'gold' || m === 'goldLit') {
      col = shade(GOLD, n, L, 1);
      col = mix(col, [255, 226, 150], m === 'goldLit' ? 0.5 : Math.max(0, dot(n, Lsun)) * 0.35);
    } else if (m === 'tile') col = shade(TILE, n, L, 1);
    else if (m === 'fascia') col = shade(FASCIA, n, L, 1);
    else if (m === 'stone') col = shade(STONE, n, L, 1);
    else col = shade(hex(P[m] || P.wall), n, L, 1);
    // the lamps inside light the undersides of the eaves and the brackets warm
    if (lit > 0 && (m === 'soffit' || m === 'bracket')) col = mix(col, [255, 170, 90], clamp(0.35 * lit, 0, 0.6));
    c.fillStyle = css(fin(col));
    if (m === 'ground') {
      // the snow round the platform fades out as it runs down into the hill's own snow (no hard edge)
      var e0 = [(pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2], e1 = [(pts[2][0] + pts[3][0]) / 2, (pts[2][1] + pts[3][1]) / 2];
      var gg = c.createLinearGradient(e0[0], e0[1], e1[0], e1[1]), fc = fin(col);
      gg.addColorStop(0, css(fc, 1)); gg.addColorStop(0.35, css(fc, 0.9)); gg.addColorStop(1, css(fc, 0));
      c.fillStyle = gg;
    }
    c.beginPath();
    pts.forEach(function (q, i) { if (i) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); });
    c.closePath(); c.fill();
    if (m === 'ground') return;
    if (m !== 'wall' && m !== 'gold' && m !== 'goldLit') { c.strokeStyle = c.fillStyle; c.lineWidth = 0.8; c.stroke(); }   // no hairline gaps between pieces
    if (f.det === 'wall') wallDetail(f, pts, n);
    else if (f.det === 'bracket') bracketDetail(pts, col);
    else if (f.det === 'stonework') stoneDetail(pts, col);
    else if (f.det === 'rafters') rafterDetail(pts, col);
  }
  function P2(pts, s, t) {                          // a point in a quad (front faces: 0 bottom-left, 1 bottom-right, 2 top-right, 3 top-left)
    var bl = pts[0], br = pts[1], tr = pts[2], tl = pts[3];
    var bx = lerp(bl[0], br[0], s), by = lerp(bl[1], br[1], s), tx = lerp(tl[0], tr[0], s), ty = lerp(tl[1], tr[1], s);
    return [lerp(bx, tx, t), lerp(by, ty, t)];
  }
  function quad(pts, s0, s1, t0, t1, fill) {
    var a = P2(pts, s0, t0), b = P2(pts, s1, t0), d = P2(pts, s1, t1), e = P2(pts, s0, t1);
    c.fillStyle = fill; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(d[0], d[1]); c.lineTo(e[0], e[1]); c.closePath(); c.fill();
  }
  function wallDetail(f, pts0, n) {
    // order the corners as bottom-left, bottom-right, top-right, top-left on the screen
    var pts = pts0.slice().sort(function (A, B) { return B[1] - A[1]; });
    var bot = pts.slice(0, 2).sort(function (A, B) { return A[0] - B[0]; }), tp = pts.slice(2).sort(function (A, B) { return A[0] - B[0]; });
    var Q = [bot[0], bot[1], tp[1], tp[0]], w = Math.abs(bot[1][0] - bot[0][0]);
    if (w < 3) return;
    var post = css(fin(shade(hex(P.post), n, L, 1))), beam = css(fin(shade(hex(P.beam), n, L, 1)));
    var bays = 3;
    quad(Q, 0, 1, 0, 0.12, css(fin(shade(hex(P.rail), n, L, 1))));          // the balcony rail along the foot
    quad(Q, 0, 1, 0.84, 1, beam);                                           // the tie beam
    for (var j = 0; j < bays; j++) {
      var s0 = j / bays + 0.06, s1 = (j + 1) / bays - 0.06;
      var paneCol = lit > 0 ? mix(PANE_DAY, GLOW, clamp(lit, 0, 1)) : mix(PANE_DAY, shade([150, 140, 150], n, L, 1), 0.25);
      quad(Q, s0, s1, 0.22, 0.76, css(fin(paneCol)));
      // the lattice of the window
      if (w > 14) {
        c.strokeStyle = css(fin(lit > 0 ? mix(GLOW, [120, 60, 30], 0.6) : [40, 28, 24]), 0.9); c.lineWidth = Math.max(0.4, w * 0.006);
        c.beginPath();
        for (var v = 1; v < 4; v++) { var sv = lerp(s0, s1, v / 4), a = P2(Q, sv, 0.22), b = P2(Q, sv, 0.76); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
        var a2 = P2(Q, s0, 0.49), b2 = P2(Q, s1, 0.49); c.moveTo(a2[0], a2[1]); c.lineTo(b2[0], b2[1]);
        c.stroke();
      }
    }
    for (var i = 0; i <= bays; i++) { var s = i / bays; quad(Q, Math.max(0, s - 0.035), Math.min(1, s + 0.035), 0, 1, post); }
    // the shade of the eave above
    var A = P2(Q, 0.5, 1), B = P2(Q, 0.5, 0.5), g = c.createLinearGradient(A[0], A[1], B[0], B[1]);
    g.addColorStop(0, 'rgba(15,8,6,' + (0.45 * (1 - 0.6 * clamp(lit, 0, 1))) + ')'); g.addColorStop(1, 'rgba(15,8,6,0)');
    quad(Q, 0, 1, 0.5, 1, g);
  }
  function bracketDetail(pts, col) {
    var Q = pts, w = Math.hypot(Q[1][0] - Q[0][0], Q[1][1] - Q[0][1]);
    if (w < 6) return;
    var n = clamp(Math.round(w / 4), 4, 30), dk = css(fin(mix(col, [0, 0, 0], 0.45)));
    for (var i = 0; i < n; i++) { var s0 = (i + 0.3) / n, s1 = (i + 0.7) / n; quad(Q, s0, s1, 0.15, 0.85, dk); }
  }
  function stoneDetail(pts, col) {
    var w = Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]);
    if (w < 8) return;
    c.strokeStyle = css(fin(mix(col, [0, 0, 0], 0.3))); c.lineWidth = 0.6;
    c.beginPath();
    var a = P2(pts, 0, 0.55), b = P2(pts, 1, 0.55); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]);      // a course
    var n = clamp(Math.round(w / 9), 3, 16);
    for (var i = 1; i < n; i++) {
      var s0 = (i + (i % 2) * 0.5) / n; if (s0 >= 1) continue;
      var t0 = i % 2 ? 0 : 0.55, t1 = i % 2 ? 0.55 : 1, p0 = P2(pts, s0, t0), p1 = P2(pts, s0, t1);
      c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]);
    }
    c.stroke();
  }
  function rafterDetail(pts, col) {
    var w = Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]);
    if (w < 5) return;
    var n = clamp(Math.round(w / 3), 2, 12); c.strokeStyle = css(fin(mix(col, [0, 0, 0], 0.35))); c.lineWidth = 0.6;
    c.beginPath();
    for (var i = 1; i < n; i++) { var a = P2(pts, i / n, 0), b = P2(pts, i / n, 1); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
    c.stroke();
  }
  // after dusk: a soft warm glow round the lit storeys
  if (lit > 0) {
    c.save(); c.globalCompositeOperation = 'lighter';
    for (st = 0; st < 5; st++) {
      var yy = storeyY[st] + stH[st] * S * 0.5, pc = proj(cam, Wp(0, yy, -b0)), r0 = b0 * 2.4 * cam.F / Z;
      var g = c.createRadialGradient(pc[0], pc[1], 0, pc[0], pc[1], r0);
      g.addColorStop(0, css(GLOW, 0.22 * lit)); g.addColorStop(1, css(GLOW, 0));
      c.fillStyle = g; c.fillRect(pc[0] - r0, pc[1] - r0, r0 * 2, r0 * 2);
    }
    c.restore();
  }
  var stairEnd = proj(cam, Wp(0, yEnd, -bp - Ls));
  return { Z: Z, footY: o.foot, stairs: { x: stairEnd[0], y: stairEnd[1], w: ws * 1.4 * cam.F / Z } };
}

/* =====================================================================
   ONE FIR — tiers of drooping needle skirts, each with a pillow of snow
   ===================================================================== */
var NEEDLES = ['#2F4A3B', '#2B4440', '#35473A', '#283C37', '#3A4C3C', '#2E3F3E', '#3E5040'].map(hex);
function fir(c, x, y, h, seed, look) {
  var r = rng(seed * 7919 + 13), L = look.light, hz = look.haze || 0;
  // this tree's own build
  var wr = lerp(0.42, 0.64, r()) * (look.width || 1);           // width / height
  var n = Math.round(lerp(5, 10, r()) * (look.tiers || 1));
  var lean = (r() - 0.5) * 0.09 * h;                           // the top leans this far (px)
  var droop = lerp(0.2, 0.55, r()), snow = clamp(look.snow * lerp(0.55, 1.25, r()), 0, 1.6);
  var needle = mix(NEEDLES[Math.floor(r() * NEEDLES.length)], [r() * 40, 40 + r() * 30, 30 + r() * 30], 0.12);
  var topKind = r(), trunkShow = r() < 0.5 ? lerp(0.04, 0.1, r()) : 0, broken = r() < 0.12;
  var w = h * wr, base = y - h * trunkShow;
  var fin = function (col) { return mix(col, L.haze, hz); };
  var lx = L.sun[0] < 0 ? -1 : 1;                              // which side the light is on
  var dark = fin(mix(needle, [0, 0, 0], 0.25)), mid = fin(shade(needle, [lx * 0.5, 0.4, 0.75], L, 1.2)), sh = fin(mix(needle, [20, 30, 50], 0.35));
  var snowLit = fin(shade(SNOW, norm([lx * 0.7, 0.8, 0.4]), L, 1)), snowSh = fin(mix(shade(SNOW, [0, 1, 0], L, 0), [178, 186, 216], 0.45));
  if (trunkShow) { c.fillStyle = css(fin([58, 44, 40])); c.fillRect(x - h * 0.012, y - h * trunkShow - 1, h * 0.024, h * trunkShow + 1); }
  // the tiers, from the bottom up; each a skirt hanging from the trunk
  var tiers = [];
  for (var i = 0; i < n; i++) {
    var f = i / n, f1 = (i + 1) / n;
    var hem = base - (h * (1 - trunkShow)) * Math.pow(f, 0.92) * lerp(0.96, 1.04, r());
    var tierH = (h * (1 - trunkShow)) / n * lerp(1.5, 2.1, r());
    var half = w / 2 * Math.pow(1 - f, lerp(0.85, 1.05, r())) * lerp(0.82, 1.12, r());
    if (broken && i === Math.floor(n * 0.6)) half *= 0.55;      // a gap where a branch broke
    var off = (r() - 0.5) * half * 0.25 + lean * f;
    tiers.push({ hem: hem, top: hem - tierH, half: Math.max(half, h * 0.02), off: off, sn: snow * lerp(0.6, 1.2, r()), seed: r() * 1000 });
  }
  // the top: a slim spire, sometimes bent, sometimes two leaders
  var tx = x + lean, ty = y - h;
  c.fillStyle = css(dark);
  c.beginPath(); c.moveTo(tx, ty); c.lineTo(tx + h * 0.03, ty + h * 0.14); c.lineTo(tx - h * 0.03, ty + h * 0.14); c.closePath(); c.fill();
  if (topKind < 0.15) { c.beginPath(); c.moveTo(tx + h * 0.04, ty + h * 0.06); c.lineTo(tx + h * 0.06, ty + h * 0.15); c.lineTo(tx + h * 0.02, ty + h * 0.15); c.fill(); }
  for (var j = 0; j < n; j++) tier(tiers[j], j / n);          // bottom up: each tier hangs over the snow on the one below
  function tier(T, f) {
    var rr = rng(T.seed | 0), cx = x + T.off, k = 9;
    // the needle skirt: from the trunk out and down to a ragged hem
    var L0 = [], R0 = [];
    for (var s = 0; s <= k; s++) {
      var u = s / k, dx = T.half * u, dy = T.top + (T.hem - T.top) * (0.25 + 0.75 * Math.pow(u, 1 - droop * 0.6));
      L0.push([cx - dx, dy]); R0.push([cx + dx, dy]);
    }
    var hemPts = [], m = Math.max(5, Math.round(T.half / 2.2));
    for (var q = 0; q <= m; q++) {
      var u2 = q / m, hx = cx - T.half + 2 * T.half * u2, sag = Math.sin(u2 * PI) * (T.hem - T.top) * 0.12;
      hemPts.push([hx, T.hem + sag + (q % 2 ? rr() * (T.hem - T.top) * 0.28 : -rr() * 2)]);
    }
    c.beginPath();
    c.moveTo(cx, T.top);
    R0.forEach(function (p) { c.lineTo(p[0], p[1]); });
    for (var q2 = hemPts.length - 1; q2 >= 0; q2--) c.lineTo(hemPts[q2][0], hemPts[q2][1]);
    L0.slice().reverse().forEach(function (p) { c.lineTo(p[0], p[1]); });
    c.closePath();
    var g = c.createLinearGradient(cx - T.half, 0, cx + T.half, 0);
    if (lx < 0) { g.addColorStop(0, css(mid)); g.addColorStop(0.55, css(dark)); g.addColorStop(1, css(sh)); }
    else { g.addColorStop(0, css(sh)); g.addColorStop(0.45, css(dark)); g.addColorStop(1, css(mid)); }
    c.fillStyle = g; c.fill();
    // the snow on top of it: thick near the trunk, thinning out, lumps over the edge
    if (T.sn > 0.05) {
      var th = (T.hem - T.top) * 0.2 * T.sn;
      c.beginPath();
      var reach = lerp(0.65, 0.98, Math.min(1, T.sn));
      for (var s2 = 0; s2 <= k; s2++) {
        var p = R0[s2]; if (s2 / k > reach) break;
        c[s2 ? 'lineTo' : 'moveTo'](p[0], p[1] - th * (1 - s2 / k * 0.5) - rr() * th * 0.35);
      }
      var lastR = Math.min(k, Math.floor(reach * k));
      for (var s3 = lastR; s3 >= 0; s3--) { var pp = R0[s3]; c.lineTo(pp[0], pp[1] + th * 0.5); }
      for (var s4 = 0; s4 <= lastR; s4++) { var pl = L0[s4]; c.lineTo(pl[0], pl[1] + th * 0.5); }
      for (var s5 = lastR; s5 >= 0; s5--) { var pl2 = L0[s5]; c.lineTo(pl2[0], pl2[1] - th * (1 - s5 / k * 0.5) - rr() * th * 0.35); }
      c.closePath();
      var g2 = c.createLinearGradient(cx - T.half, 0, cx + T.half, 0);
      if (lx < 0) { g2.addColorStop(0, css(snowLit)); g2.addColorStop(0.5, css(mix(snowLit, snowSh, 0.45))); g2.addColorStop(1, css(snowSh)); }
      else { g2.addColorStop(0, css(snowSh)); g2.addColorStop(0.5, css(mix(snowLit, snowSh, 0.45))); g2.addColorStop(1, css(snowLit)); }
      c.fillStyle = g2; c.fill();
    }
  }
}

/* =====================================================================
   THE HILL — its snowy body, then rows of firs from the crest down to its
   foot, each row nearer and so larger; the far rows fade into the air
   ===================================================================== */
function hill(c, o) {
  var r = rng(o.seed || 11), L = o.light;
  var prof = o.profile;                                         // the crest: [[x, y] …] in CSS px, left to right
  function crestY(x) {
    for (var i = 1; i < prof.length; i++) if (x <= prof[i][0]) { var t = (x - prof[i - 1][0]) / (prof[i][0] - prof[i - 1][0]); return lerp(prof[i - 1][1], prof[i][1], t); }
    return prof[prof.length - 1][1];
  }
  var x0 = prof[0][0], x1 = prof[prof.length - 1][0], foot = o.foot;
  // the hill's snow, lit from the side of the sun, blue in the hollows
  var snowLit = mix(shade(SNOW, norm([L.sun[0] < 0 ? -0.5 : 0.5, 0.8, 0.3]), L, 1), L.haze, o.hazeFar * 0.6);
  var snowSh = mix(mix(shade(SNOW, [0, 1, 0], L, 0), [176, 184, 214], 0.4), L.haze, o.hazeFar * 0.6);
  c.beginPath(); c.moveTo(x0, foot + 2);
  for (var x = x0; x <= x1; x += 4) c.lineTo(x, crestY(x));
  c.lineTo(x1, foot + 2); c.closePath();
  var g = c.createLinearGradient(x0, 0, x1, 0);
  g.addColorStop(0, css(L.sun[0] < 0 ? snowLit : snowSh)); g.addColorStop(1, css(L.sun[0] < 0 ? snowSh : snowLit));
  c.fillStyle = g; c.fill();
  // the rows of firs
  var rows = o.rows, k = 0;
  for (var row = 0; row < rows; row++) {
    var u = rows > 1 ? row / (rows - 1) : 1;
    if (o.before) o.before(c, u);
    var hgt = lerp(o.treeFar, o.treeNear, Math.pow(u, 1.25));        // nearer rows: larger (perspective)
    var haze = lerp(o.hazeFar, o.hazeNear, u);
    var gap = hgt * lerp(0.28, 0.42, o.density === undefined ? 0.5 : 1 - o.density);
    for (var xx = x0 - hgt * 0.3 + r() * gap; xx < x1 + hgt * 0.2; xx += gap * lerp(0.6, 1.5, r())) {
      var cy = crestY(xx);
      if (cy >= foot - 2) continue;
      // the foot of this row: from just under the crest down to the hill's foot
      var yy = Math.min(foot - 1, lerp(cy + hgt * 0.35, foot, Math.pow(u, 0.9)) + (r() - 0.5) * hgt * 0.25);   // never below the hill's foot
      if (yy < cy + hgt * 0.2) continue;
      if (o.clearing && o.clearing(xx, yy, u)) continue;          // left open (a glade, round the pagoda)
      if (r() > (o.fill === undefined ? 1 : o.fill)) continue;     // a sparse slope leaves gaps
      var hh = hgt * lerp(0.7, 1.3, r()) * (r() < 0.08 ? 1.5 : 1);
      fir(c, xx, yy, hh, (o.seed || 11) * 1000 + (k++), { light: L, haze: haze, snow: o.snow, width: o.treeWidth });
    }
  }
  if (o.before) o.before(c, 2);
}

return { camera: camera, pagoda: pagoda, fir: fir, hill: hill };
})();
