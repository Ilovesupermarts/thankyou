/* ============================================================
   WINTERPIECES — the buildings, the lanterns, the cranes and the roped
   pine of the new winter scene, drawn in code after the user's element
   sheet (the reference for how each one looks; no pictures are used).
   Each is laid out in the sheet's own measurements (local units) and
   scaled to where the scene puts it.

     pagoda(c, o)    五重塔 five storeys of heavy dark roofs under snow, the
                     gilt finial; windows and eaves lit after dark
     hall(c, o)      本堂 the hall seen from three-quarters: a deep roof of
                     snow, plaster and dark timber, lattice windows and doors
     lantern(c, o)   雪見灯籠 a stone lantern: base, post, platform, firebox,
                     roof and jewel, snow on every ledge
     crane(c, o)     丹頂鶴 a red-crowned crane standing (pose 'up' or 'bow')
     pine(c, o)      雪吊りの松 a pine in tiers of needle pads under snow, a
                     pole through it and the straw ropes fanned from its top

   o (CSS px; c set up for CSS px):
     x, y          the middle and the foot (where it stands on the snow)
     h             its height (px): the finial's tip, the roof's ridge, the
                   jewel, the head, the rope knot … down to the foot
     lit           0 … 1.5: how brightly its lamps and windows are lit (0 by
                   day; the scene lights them in the evening and at night)
     sunDir, sunColour, skyColour, ambient, haze, hazeColour, seed
   ============================================================ */
var WinterPieces = (function () {
'use strict';

var PI = Math.PI, TAU = PI * 2;
function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
function d(o, k, v) { return o[k] === undefined ? v : o[k]; }
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
function rgb(c, a) {
  return 'rgba(' + Math.round(clamp(c[0], 0, 255)) + ',' + Math.round(clamp(c[1], 0, 255)) + ',' +
         Math.round(clamp(c[2], 0, 255)) + ',' + (a === undefined ? 1 : clamp(a, 0, 1).toFixed(3)) + ')';
}
function mix(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }
function scale(a, k) { return [a[0] * k, a[1] * k, a[2] * k]; }

/* The light: S(base, nx, ny, nz, occ) is the colour base lit from the direction n (x right, y up,
   z toward you), occ how much of the sun reaches it, faded into the haze. Painted things keep part
   of their own colour (S.own), as in the sheet, so the light tints rather than repaints them. */
function shader(o) {
  var L = d(o, 'sunDir', [-0.8, 0.4, 0.3]), sun = d(o, 'sunColour', [1, 0.97, 0.92]), sky = d(o, 'skyColour', [0.7, 0.78, 0.92]);
  var amb = d(o, 'ambient', 0.9), haze = d(o, 'haze', 0), hc = d(o, 'hazeColour', [246, 238, 232]);
  function raw(base, nx, ny, nz, occ) {
    var l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    var k = occ === undefined ? 1 : occ;
    var dl = Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]) * k;
    var sk = (0.6 + 0.4 * ny) * amb * lerp(0.7, 1, k);
    return [base[0] * (sun[0] * dl + sky[0] * sk), base[1] * (sun[1] * dl + sky[1] * sk), base[2] * (sun[2] * dl + sky[2] * sk)];
  }
  var w0 = raw([200, 200, 200], 0, 1, 0.5), bright = clamp((w0[0] + w0[1] + w0[2]) / 600, 0.2, 1.1);
  var tint = [clamp(w0[0] / 200, 0.2, 1.1), clamp(w0[1] / 200, 0.2, 1.1), clamp(w0[2] / 200, 0.2, 1.1)];
  var f = function (base, nx, ny, nz, occ) {
    // half its own colour under the light's tint, half lit from n
    var own = [base[0] * tint[0], base[1] * tint[1], base[2] * tint[2]];
    return mix(mix(own, raw(base, nx, ny, nz, occ), 0.5), hc, haze);
  };
  f.side = L[0] < 0 ? -1 : 1;
  f.bright = bright;
  f.haze = function (col) { return mix(col, hc, haze); };
  f.flat = function (base, k) { return mix([base[0] * tint[0] * k, base[1] * tint[1] * k, base[2] * tint[2] * k], hc, haze); };
  return f;
}
function snowCols(S) {
  var sn = [250, 250, 253];
  return { top: S(sn, S.side * 0.3, 1, 0.5), lit: S(sn, S.side * 0.8, 0.6, 0.6), side: S([240, 242, 250], 0, 0.3, 1, 0.7),
           shade: S([226, 230, 246], -S.side * 0.6, 0.1, 0.8, 0.15) };
}
var WARM = [255, 172, 72], WARM2 = [255, 214, 140];
/* A glow (added light) round x, y. */
function glow(c, x, y, rx, ry, col, a) {
  if (a <= 0.004) return;
  c.save(); c.globalCompositeOperation = 'lighter';
  c.translate(x, y); c.scale(rx, ry);
  var g = c.createRadialGradient(0, 0, 0, 0, 0, 1);
  g.addColorStop(0, rgb(col, a)); g.addColorStop(0.4, rgb(col, a * 0.4)); g.addColorStop(1, rgb(col, 0));
  c.fillStyle = g; c.fillRect(-1, -1, 2, 2);
  c.restore();
}
function poly(c, P) { c.beginPath(); c.moveTo(P[0][0], P[0][1]); for (var i = 1; i < P.length; i++) c.lineTo(P[i][0], P[i][1]); c.closePath(); }
/* A smooth closed or open curve through points (quadratic midpoints). */
function curve(c, P, close) {
  c.beginPath(); c.moveTo(P[0][0], P[0][1]);
  for (var i = 1; i < P.length - 1; i++) c.quadraticCurveTo(P[i][0], P[i][1], (P[i][0] + P[i + 1][0]) / 2, (P[i][1] + P[i + 1][1]) / 2);
  c.lineTo(P[P.length - 1][0], P[P.length - 1][1]);
  if (close) c.closePath();
}
function lingrad(c, x0, y0, x1, y1, stops) {
  var g = c.createLinearGradient(x0, y0, x1, y1);
  stops.forEach(function (s) { g.addColorStop(s[0], rgb(s[1], s[2])); });
  return g;
}
/* A lumpy band of snow lying on a ledge from x0 to x1 at y (local units), th thick. */
function snowLedge(c, x0, x1, y, th, sc, r, overhang) {
  var n = Math.max(4, Math.round((x1 - x0) / (th * 1.6))), i, top = [], bot = [];
  for (i = 0; i <= n; i++) {
    var u = i / n, e = Math.sin(u * PI);
    top.push([lerp(x0, x1, u), y - th * (0.35 + 0.65 * Math.pow(e, 0.4)) * lerp(0.8, 1.15, r())]);
    bot.push([lerp(x0, x1, u), y + (overhang || 0) * th * (0.3 + 0.7 * r()) * Math.pow(e, 0.3)]);
  }
  c.beginPath(); c.moveTo(x0 - th * 0.3, y);
  for (i = 0; i <= n; i++) c.lineTo(top[i][0], top[i][1]);
  c.lineTo(x1 + th * 0.3, y);
  for (i = n; i >= 0; i--) c.lineTo(bot[i][0], bot[i][1]);
  c.closePath();
  c.fillStyle = lingrad(c, 0, y - th, 0, y + th * 0.6, [[0, sc.top], [0.6, sc.top], [1, sc.shade]]);
  c.fill();
}
/* A window: frame, paper (dim by day, glowing when lit) and its lattice. */
function windowPane(c, x, y, w, h, S, lit, cols, rows, frameCol) {
  var paperDay = S([226, 214, 186], 0, 0, 1, 0.25);
  var k = clamp(lit, 0, 1);
  c.fillStyle = rgb(frameCol); c.fillRect(x - w * 0.08, y - w * 0.08, w * 1.16, h + w * 0.16);
  if (k > 0) glow(c, x + w / 2, y + h / 2, w * 2.2, h * 1.6, WARM, 0.55 * k);
  c.fillStyle = lingrad(c, 0, y, 0, y + h, [[0, mix(paperDay, WARM2, k)], [1, mix(scale(paperDay, 0.9), WARM, k)]]);
  c.fillRect(x, y, w, h);
  c.strokeStyle = rgb(mix(scale(frameCol, 1.1), [140, 70, 30], k), 0.85); c.lineWidth = Math.max(0.5, w * 0.06);
  c.beginPath();
  for (var i = 1; i < cols; i++) { c.moveTo(x + w * i / cols, y); c.lineTo(x + w * i / cols, y + h); }
  for (i = 1; i < rows; i++) { c.moveTo(x, y + h * i / rows); c.lineTo(x + w, y + h * i / rows); }
  c.stroke();
}
/* Fine speckle on stone or wood, inside the current clip. */
function speckle(c, x0, y0, x1, y1, n, col, a, r, sz) {
  c.fillStyle = rgb(col, a);
  for (var i = 0; i < n; i++) { var s = sz * lerp(0.4, 1, r()); c.fillRect(lerp(x0, x1, r()), lerp(y0, y1, r()), s, s * lerp(0.5, 1, r())); }
}

/* ===============================================================
   THE PAGODA. Local units: the sheet's pagoda, 0 at its middle, the
   finial's tip at y 10, the foot of its stone base at y 640.
   =============================================================== */
function pagoda(c, o) {
  var S = shader(o), sc = snowCols(S), r = rng(d(o, 'seed', 3)), lit = d(o, 'lit', 0), sd = S.side, i, k;
  var s = o.h / 630;
  c.save(); c.translate(o.x, o.y - 640 * s); c.scale(s, s);
  var wood = [124, 86, 60], woodDk = [66, 44, 32], gold = [204, 156, 74];
  var T = [244, 310, 378, 446, 515], HW = [118, 134, 152, 170, 188], WW = [74, 84, 96, 108, 120], TH = 30;
  // ---- the finial (sōrin): the jewel, nine rings on a pole, the base ----
  var goldL = S(gold, sd, 0.3, 0.6), goldD = S(scale(gold, 0.6), -sd, 0, 0.8, 0.5);
  c.fillStyle = lingrad(c, -5, 0, 5, 0, [[0, sd < 0 ? goldL : goldD], [1, sd < 0 ? goldD : goldL]]);
  c.fillRect(-4, 34, 8, 210);
  for (k = 0; k < 9; k++) {
    var ry = 74 + k * 16, rw = lerp(13, 17, k / 8);
    c.fillStyle = lingrad(c, -rw, 0, rw, 0, [[0, sd < 0 ? goldL : goldD], [0.5, S(gold, 0, 1, 0.5)], [1, sd < 0 ? goldD : goldL]]);
    c.beginPath(); c.ellipse(0, ry, rw, 4.2, 0, 0, TAU); c.fill();
    c.fillStyle = rgb(scale(goldD, 0.75));
    c.beginPath(); c.ellipse(0, ry + 1.5, rw, 3, 0, 0, PI); c.fill();
  }
  c.fillStyle = lingrad(c, -9, 0, 9, 0, [[0, sd < 0 ? goldL : goldD], [1, sd < 0 ? goldD : goldL]]);
  c.beginPath(); c.moveTo(0, 8); c.bezierCurveTo(9, 18, 9, 30, 0, 36); c.bezierCurveTo(-9, 30, -9, 18, 0, 8); c.fill();
  c.fillRect(-7, 40, 14, 5); c.fillRect(-10, 56, 20, 4);
  c.beginPath(); c.moveTo(-14, 218); c.quadraticCurveTo(0, 200, 14, 218); c.lineTo(18, 226); c.lineTo(-18, 226); c.closePath(); c.fill();
  c.fillStyle = rgb(mix(S(gold, 0, 0, 1), WARM2, clamp(lit, 0, 1) * 0.6));
  c.fillRect(-22, 226, 44, 16);
  glow(c, 0, 232, 34, 22, WARM, 0.7 * lit);
  // ---- the storeys, from the top: roof slab, snow on it, the eave's underside and brackets, the wall ----
  for (i = 0; i < 5; i++) {
    var t = T[i], hw = HW[i], ww = WW[i], ext = 10, wy0 = t + TH + 11, wy1 = i < 4 ? T[i + 1] + 4 : 598;
    // the wall (behind the roof below, which overlaps its foot)
    c.fillStyle = lingrad(c, -ww, 0, ww, 0, [[0, S(woodDk, -1, 0, 0.6, sd < 0 ? 1 : 0.4)], [0.5, S(woodDk, 0, 0, 1, 0.6)], [1, S(woodDk, 1, 0, 0.6, sd < 0 ? 0.4 : 1)]]);
    c.fillRect(-ww, wy0, ww * 2, wy1 - wy0 + 4);
    var wh = wy1 - wy0, frame = S([70, 46, 34], 0, 0, 1, 0.5);
    c.fillStyle = rgb(S(wood, 0, 0.5, 1, 0.5)); c.fillRect(-ww, wy0, ww * 2, 4);               // the top beam
    [-1, 1].forEach(function (sg) {
      var winW = ww * 0.34, wx = sg * ww * 0.56 - winW / 2;
      windowPane(c, wx, wy0 + wh * 0.12, winW, wh * 0.6, S, lit, 3, 2, frame);
    });
    c.fillStyle = rgb(S([44, 30, 24], 0, 0, 1, 0.4)); c.fillRect(-ww * 0.18, wy0 + wh * 0.18, ww * 0.36, wh * 0.82);   // the middle door
    c.strokeStyle = rgb(S(wood, 0, 0, 1, 0.5), 0.8); c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(0, wy0 + wh * 0.18); c.lineTo(0, wy1); c.stroke();
    // the eave's underside: dark, and the row of brackets (lit warm after dark)
    var bw = ww + 20;
    c.fillStyle = rgb(S(woodDk, 0, -1, 0.6, 0.2));
    c.beginPath(); c.moveTo(-hw - 4, t + TH - 6); c.lineTo(hw + 4, t + TH - 6); c.lineTo(bw, wy0); c.lineTo(-bw, wy0); c.closePath(); c.fill();
    var nb = Math.round(bw * 2 / 7), bl = clamp(lit, 0, 1);
    for (k = 0; k < nb; k++) {
      var bx = -bw + (k + 0.5) * bw * 2 / nb;
      c.fillStyle = rgb(mix(S(wood, 0, -0.5, 1, 0.3), WARM2, bl));
      c.fillRect(bx - 1.8, t + TH + 1, 3.6, 8);
    }
    glow(c, 0, t + TH + 6, bw * 1.1, 14, WARM, 0.5 * lit);
    // the roof slab: its front a thick curved band, lowest in the middle, the ends turned up
    var bt = t + TH + 2;
    c.beginPath();
    c.moveTo(-hw, t + 3);
    c.quadraticCurveTo(0, t + 6, hw, t + 3);
    c.quadraticCurveTo(hw + ext * 0.6, t + 2, hw + ext, t - 4);
    c.lineTo(hw + ext - 1, bt - 10);
    c.quadraticCurveTo(hw * 0.55, bt + 1, 0, bt);
    c.quadraticCurveTo(-hw * 0.55, bt + 1, -hw - ext + 1, bt - 10);
    c.lineTo(-hw - ext, t - 4);
    c.quadraticCurveTo(-hw - ext * 0.6, t + 2, -hw, t + 3);
    c.closePath();
    c.fillStyle = lingrad(c, 0, t, 0, bt, [[0, S(scale(wood, 0.75), 0, 0.6, 0.8)], [0.25, S(wood, 0, 0.2, 1)], [0.75, S(scale(wood, 0.85), 0, 0, 1, 0.7)], [1, S(woodDk, 0, -0.4, 1, 0.4)]]);
    c.fill();
    c.save(); c.clip();
    // the planks along it, and the end turned to the sun lighter
    c.strokeStyle = rgb(S(woodDk, 0, 0, 1, 0.5), 0.45); c.lineWidth = 1;
    for (k = 1; k < 6; k++) {
      var py = t + 4 + k * (TH - 6) / 6;
      c.beginPath(); c.moveTo(-hw - ext, py - (k / 6) * 7); c.quadraticCurveTo(0, py + k * 1.2, hw + ext, py - (k / 6) * 7); c.stroke();
    }
    c.fillStyle = lingrad(c, -hw - ext, 0, hw + ext, 0, sd < 0 ? [[0, [255, 230, 200], 0.18], [0.3, [255, 230, 200], 0], [1, [0, 0, 0], 0.18]]
                                                           : [[0, [0, 0, 0], 0.18], [0.7, [255, 230, 200], 0], [1, [255, 230, 200], 0.18]]);
    c.fillRect(-hw - ext - 2, t - 6, (hw + ext) * 2 + 4, TH + 10);
    speckle(c, -hw - ext, t, hw + ext, bt, 60, scale(woodDk, 0.8), 0.25, r, 2);
    c.restore();
    // snow on the roof: a rounded cap, thicker in the middle, a little overhanging
    snowLedge(c, -hw - ext - 2, hw + ext + 2, t + 2, 9 + i * 0.6, sc, r, 0.5);
  }
  // ---- the stone base, snow along its top ----
  var stone = [150, 140, 128];
  c.fillStyle = lingrad(c, 0, 598, 0, 640, [[0, S(stone, 0, 0.4, 1)], [1, S(scale(stone, 0.75), 0, 0, 1, 0.6)]]);
  c.fillRect(-150, 600, 300, 14); c.fillRect(-162, 612, 324, 28);
  snowLedge(c, -158, 158, 602, 6, sc, r, 0.4);
  snowLedge(c, -166, 166, 614, 5, sc, r, 0.3);
  c.restore();
}

/* ===============================================================
   THE HALL, seen from three-quarters (its front and its right side).
   Local units: the sheet's hall, x 18 … 745, the ridge at y 18, the foot
   of the base at y 312. o.x is its middle (local 381), o.h the ridge to
   the foot.
   =============================================================== */
function hall(c, o) {
  var S = shader(o), sc = snowCols(S), r = rng(d(o, 'seed', 4)), lit = d(o, 'lit', 0), sd = S.side, k;
  var s = o.h / 296;
  c.save(); c.translate(o.x - 381 * s, o.y - 312 * s); c.scale(s, s);
  var timber = [74, 48, 34], plaster = [238, 232, 218], stone = [160, 156, 150];
  var frontLit = sd < 0 ? 1 : 0.55, sideLit = sd < 0 ? 0.35 : 1;
  // ---- the stone base and the steps ----
  c.fillStyle = rgb(S(stone, 0, 0, 1, frontLit)); c.fillRect(95, 286, 505, 26);
  c.fillStyle = rgb(S(stone, 1, 0, 0.3, sideLit)); poly(c, [[600, 286], [715, 280], [715, 302], [600, 312]]); c.fill();
  c.fillStyle = rgb(sc.top); c.fillRect(92, 283, 510, 4); poly(c, [[600, 283], [717, 277], [717, 281], [600, 287]]); c.fill();
  for (k = 0; k < 3; k++) {
    var sx0 = 250 + k * 8, sx1 = 390 - k * 8, sy = 304 - k * 8;
    c.fillStyle = rgb(S(stone, 0, 0, 1, frontLit)); c.fillRect(sx0, sy, sx1 - sx0, 8);
    c.fillStyle = rgb(sc.top); c.fillRect(sx0, sy - 1, sx1 - sx0, 2.5);
  }
  // ---- the right side wall, going away ----
  function sideAt(u, v) { return [lerp(545, 652, u), lerp(lerp(165, 176, u), lerp(286, 276, u), v)]; }
  poly(c, [sideAt(0, 0), sideAt(1, 0), sideAt(1, 1), sideAt(0, 1)]);
  c.fillStyle = rgb(S(scale(plaster, 0.92), 1, 0, 0.3, sideLit)); c.fill();
  [[0.08, 0.3], [0.42, 0.6], [0.72, 0.92]].forEach(function (b) {
    var p0 = sideAt(b[0], 0.33), p1 = sideAt(b[1], 0.33), p2 = sideAt(b[1], 0.68), p3 = sideAt(b[0], 0.68);
    c.save(); c.setTransform(c.getTransform().multiply(new DOMMatrix([(p1[0] - p0[0]) / 20, (p1[1] - p0[1]) / 20, (p3[0] - p0[0]) / 30, (p3[1] - p0[1]) / 30, p0[0], p0[1]])));
    windowPane(c, 0, 0, 20, 30, S, lit * 0.9, 2, 3, S(timber, 0, 0, 1, sideLit));
    c.restore();
  });
  c.fillStyle = rgb(S(timber, 1, 0, 0.3, sideLit));
  [0, 0.37, 0.66, 1].forEach(function (u) { var a = sideAt(u, 0), b = sideAt(u, 1); c.fillRect(a[0] - 3.5, a[1], 7, b[1] - a[1]); });
  poly(c, [sideAt(0, 0), sideAt(1, 0), sideAt(1, 0.17), sideAt(0, 0.17)]); c.fill();
  poly(c, [sideAt(0, 0.88), sideAt(1, 0.88), sideAt(1, 1), sideAt(0, 1)]); c.fill();
  // ---- the front wall: plaster between dark timbers, four windows and the double door ----
  c.fillStyle = lingrad(c, 0, 185, 0, 270, [[0, S(plaster, 0, 0, 1, 0.35 * frontLit)], [1, S(plaster, 0, 0, 1, frontLit)]]);
  c.fillRect(145, 165, 400, 121);
  windowPane(c, 168, 200, 38, 40, S, lit, 3, 4, S(timber, 0, 0, 1, 0.5));
  windowPane(c, 245, 200, 38, 40, S, lit, 3, 4, S(timber, 0, 0, 1, 0.5));
  windowPane(c, 407, 200, 38, 40, S, lit, 3, 4, S(timber, 0, 0, 1, 0.5));
  windowPane(c, 484, 200, 38, 40, S, lit, 3, 4, S(timber, 0, 0, 1, 0.5));
  windowPane(c, 313, 193, 29, 80, S, lit * 1.15, 4, 8, S(timber, 0, 0, 1, 0.5));
  windowPane(c, 344, 193, 29, 80, S, lit * 1.15, 4, 8, S(timber, 0, 0, 1, 0.5));
  c.fillStyle = rgb(S(timber, 0, 0, 1, frontLit));
  [145, 222, 300, 385, 462, 545].forEach(function (x) { c.fillRect(x - 4.5, 165, 9, 121); });
  c.fillRect(145, 165, 400, 22);                              // the frieze under the eaves
  c.fillRect(145, 270, 400, 16);                              // the sill
  c.fillStyle = rgb(S(scale(timber, 1.5), 0, 0.3, 1, frontLit)); c.fillRect(145, 176, 400, 2); c.fillRect(145, 270, 400, 1.5);
  if (lit > 0) glow(c, 343, 286, 120, 16, WARM, 0.4 * lit);
  // ---- the eaves' underside, dark, with the rows of bracket ends ----
  c.fillStyle = rgb(S([46, 32, 26], 0, -1, 0.6, 0.2));
  poly(c, [[26, 140], [592, 158], [742, 150], [652, 176], [545, 165], [145, 165]]); c.fill();
  var bl = clamp(lit, 0, 1);
  for (k = 0; k < 74; k++) {
    var u = (k + 0.5) / 74, bx = lerp(46, 588, u), by = lerp(149, 163, u);
    c.fillStyle = rgb(mix(S([150, 110, 78], 0, -0.4, 1, 0.3), WARM2, bl)); c.fillRect(bx - 1.6, by - 3, 3.2, 5);
  }
  for (k = 0; k < 18; k++) {
    var u2 = (k + 0.5) / 18, bx2 = lerp(600, 734, u2), by2 = lerp(164, 156, u2);
    c.fillStyle = rgb(mix(S([150, 110, 78], 0, -0.4, 1, 0.2), WARM2, bl)); c.fillRect(bx2 - 1.4, by2 - 3, 2.8, 4.5);
  }
  glow(c, 320, 160, 300, 16, WARM, 0.35 * lit);
  // the fascia board along the eaves
  c.strokeStyle = rgb(S([60, 42, 34], 0, 0, 1, 0.5)); c.lineWidth = 3; c.lineJoin = 'round';
  c.beginPath(); c.moveTo(24, 142); c.lineTo(592, 160); c.lineTo(744, 151); c.stroke();
  // ---- the roof, deep in snow: its front face, and the hipped side turned from the sun ----
  var front = [[18, 128], [70, 103], [150, 68], [232, 33], [272, 21], [400, 16], [525, 18], [594, 156], [300, 150], [120, 143], [26, 139]];
  var side = [[525, 18], [585, 52], [655, 96], [742, 140], [745, 148], [700, 151], [594, 157]];
  curve(c, front, true);
  c.fillStyle = lingrad(c, 0, 16, 0, 155, [[0, sc.top], [0.55, mix(sc.top, sc.lit, 0.4)], [1, mix(sc.top, sc.shade, 0.35)]]);
  c.fill();
  c.save(); c.clip();
  // soft drifts across the front face
  for (k = 0; k < 9; k++) {
    var dx = lerp(80, 520, r()), dy = lerp(40, 130, r());
    c.fillStyle = rgb(k % 2 ? sc.shade : sc.lit, 0.18);
    c.beginPath(); c.ellipse(dx, dy, lerp(40, 110, r()), lerp(5, 12, r()), -0.08, 0, TAU); c.fill();
  }
  c.restore();
  curve(c, side, true);
  c.fillStyle = lingrad(c, 525, 0, 745, 0, [[0, mix(sc.shade, sc.side, 0.3)], [1, sc.shade]]);
  if (sd > 0) c.fillStyle = lingrad(c, 525, 0, 745, 0, [[0, sc.lit], [1, sc.top]]);
  c.fill();
  // the hip line between them, and the ridge
  c.strokeStyle = rgb(sc.shade, 0.7); c.lineWidth = 2.5;
  c.beginPath(); c.moveTo(527, 20); c.quadraticCurveTo(560, 80, 594, 156); c.stroke();
  c.strokeStyle = rgb(sc.top); c.lineWidth = 5; c.lineCap = 'round';
  c.beginPath(); c.moveTo(276, 20); c.quadraticCurveTo(400, 12, 522, 18); c.stroke();
  // the thick rounded edge of snow along the eaves, and its shadow
  c.strokeStyle = rgb(sc.shade, 0.6); c.lineWidth = 7;
  c.beginPath(); c.moveTo(24, 141); c.quadraticCurveTo(300, 156, 594, 161); c.quadraticCurveTo(680, 157, 744, 151); c.stroke();
  c.strokeStyle = rgb(mix(sc.top, sc.side, 0.3)); c.lineWidth = 7;
  c.beginPath(); c.moveTo(20, 135); c.quadraticCurveTo(300, 150, 594, 155); c.quadraticCurveTo(680, 151, 745, 145); c.stroke();
  c.restore();
}

/* ===============================================================
   THE STONE LANTERN, seen from three-quarters. Local units: the sheet's
   lantern, its middle at x 100, the snow on its jewel at y 12, the foot
   at y 372.
   =============================================================== */
function lantern(c, o) {
  var S = shader(o), sc = snowCols(S), r = rng(d(o, 'seed', 9)), lit = d(o, 'lit', 0), sd = S.side;
  var s = o.h / 360;
  c.save(); c.translate(o.x - 100 * s, o.y - 372 * s); c.scale(s, s);
  var stone = [118, 118, 116], fK = sd < 0 ? 0.6 : 1, sK = sd < 0 ? 1 : 0.4;      // the front faces right-ish, the side faces left
  var front = function (k) { return S(scale(stone, k || 1), 0.4, 0, 1, fK); }, side = function (k) { return S(scale(stone, k || 1), -1, 0, 0.4, sK); };
  function box(x0, x1, xs, y0, y1, k, topY) {                   // front face x0 … x1, side face xs … x0
    c.fillStyle = rgb(side(k)); poly(c, [[xs, y0 + (topY || 0)], [x0, y0], [x0, y1], [xs, y1 - 3]]); c.fill();
    c.fillStyle = lingrad(c, 0, y0, 0, y1, [[0, front(k * 1.05)], [1, front(k * 0.85)]]); c.fillRect(x0, y0, x1 - x0, y1 - y0);
  }
  // the snow round its foot
  c.fillStyle = rgb(sc.shade, 0.7); c.beginPath(); c.ellipse(96, 368, 92, 11, 0, 0, TAU); c.fill();
  // the base, the post, the platform
  box(42, 160, 22, 344, 366, 1);
  box(48, 152, 30, 333, 346, 1.08);
  box(76, 136, 54, 205, 334, 0.82);
  c.save(); poly(c, [[54, 205], [136, 205], [136, 334], [54, 334]]); c.clip();
  speckle(c, 54, 205, 136, 334, 140, [60, 60, 62], 0.35, r, 2.2); speckle(c, 54, 205, 136, 334, 60, [190, 190, 186], 0.25, r, 1.6);
  c.restore();
  box(50, 152, 28, 180, 206, 1.05);
  c.fillStyle = rgb(S(stone, 0, 1, 0.3)); poly(c, [[28, 176], [50, 170], [152, 170], [152, 180], [50, 180], [28, 184]]); c.fill();
  // the firebox: a lit window in front and on the side
  box(72, 140, 44, 112, 172, 0.95);
  var k = clamp(lit, 0, 1);
  if (k > 0) glow(c, 105, 142, 90, 70, WARM, 0.55 * lit);
  windowPane(c, 80, 121, 50, 44, S, lit, 3, 3, front(0.7));
  c.save(); c.setTransform(c.getTransform().multiply(new DOMMatrix([1, -0.12, 0, 1, 0, 0])));
  windowPane(c, 51, 132, 14, 32, S, lit * 0.8, 1, 3, side(0.7));
  c.restore();
  // the roof: its underside, the sloping faces, corners turned up
  c.fillStyle = rgb(S([70, 70, 72], 0, -1, 0.5, 0.2)); poly(c, [[18, 100], [168, 100], [158, 112], [30, 112]]); c.fill();
  c.fillStyle = lingrad(c, 14, 0, 168, 0, [[0, side(0.8)], [0.35, front(0.85)], [1, front(0.75)]]);
  c.beginPath(); c.moveTo(12, 96); c.quadraticCurveTo(40, 82, 68, 64); c.lineTo(128, 62); c.quadraticCurveTo(150, 82, 170, 95);
  c.lineTo(166, 104); c.lineTo(16, 104); c.closePath(); c.fill();
  // the snow capping the roof
  c.beginPath(); c.moveTo(14, 93);
  c.quadraticCurveTo(36, 80, 62, 62); c.quadraticCurveTo(70, 52, 96, 52); c.quadraticCurveTo(126, 52, 134, 62);
  c.quadraticCurveTo(152, 78, 168, 92); c.quadraticCurveTo(150, 97, 130, 92); c.quadraticCurveTo(100, 98, 70, 93);
  c.quadraticCurveTo(40, 99, 14, 93); c.closePath();
  c.fillStyle = lingrad(c, 14, 0, 168, 0, sd < 0 ? [[0, sc.top], [1, sc.shade]] : [[0, sc.shade], [1, sc.top]]); c.fill();
  // the jewel on top, snow on it
  c.fillStyle = rgb(front(0.95)); c.fillRect(86, 48, 28, 10);
  c.fillStyle = lingrad(c, 78, 0, 122, 0, [[0, side(1)], [1, front(1.05)]]);
  c.beginPath(); c.ellipse(100, 38, 20, 15, 0, 0, TAU); c.fill();
  c.fillStyle = lingrad(c, 0, 12, 0, 34, [[0, sc.top], [1, sc.shade]]);
  c.beginPath(); c.moveTo(78, 33); c.quadraticCurveTo(80, 12, 100, 12); c.quadraticCurveTo(121, 12, 122, 33); c.quadraticCurveTo(100, 28, 78, 33); c.fill();
  // snow on the ledges
  snowLedge(c, 30, 152, 172, 6, sc, r, 0.5);
  snowLedge(c, 32, 152, 334, 5, sc, r, 0.6);
  snowLedge(c, 24, 160, 345, 4, sc, r, 0.4);
  c.restore();
  return { x: o.x, y: o.y - (372 - 142) * s, r: 50 * s };
}

/* ===============================================================
   A CRANE. Local units: feet at y 0, the head about y -280, facing
   right (o.dir -1 faces left). pose 'up': standing tall, the head raised;
   'bow': the neck curved forward, the head lowered toward the other.
   =============================================================== */
function crane(c, o) {
  var S = shader(o), r = rng(d(o, 'seed', 7)), dir = d(o, 'dir', 1), bow = d(o, 'pose', 'up') === 'bow';
  var s = o.h / 290;
  c.save(); c.translate(o.x, o.y); c.scale(s * dir, s);
  var white = scale(S([252, 252, 252], 0.3 * dir * S.side, 0.6, 0.8), 1.28), whiteSh = scale(S([222, 226, 238], 0, -0.5, 0.8, 0.3), 1.22),
      black = S([24, 26, 34], 0, 0, 1), blackHi = S([70, 76, 96], 0, 1, 0.5), leg = S([66, 66, 70], 0, 0, 1),
      beak = S([196, 176, 96], 0, 0.5, 1), red = [214, 30, 36];
  // the shadow on the snow
  c.fillStyle = rgb(S([200, 206, 226], 0, 1, 0, 0.1), 0.6);
  c.beginPath(); c.ellipse(0, 2, 46, 6, 0, 0, TAU); c.fill();
  // the legs
  c.strokeStyle = rgb(leg); c.lineCap = 'round'; c.lineJoin = 'round';
  c.lineWidth = 3.6;
  c.beginPath(); c.moveTo(4, -88); c.lineTo(-2, -48); c.lineTo(-8, -1); c.stroke();
  c.beginPath(); c.moveTo(18, -88); c.lineTo(22, -46); c.lineTo(16, -2); c.stroke();
  c.lineWidth = 2; c.beginPath(); c.moveTo(-8, -1); c.lineTo(-20, 0); c.moveTo(16, -2); c.lineTo(30, -1); c.stroke();
  // the black plumes over the tail (behind the body)
  var plumes = [[-20, -160, -96, -76], [-30, -150, -102, -62], [-36, -140, -88, -52], [-38, -130, -72, -56], [-24, -152, -80, -86], [-14, -142, -60, -70], [-44, -146, -98, -90]];
  plumes.forEach(function (P, i) {
    c.fillStyle = rgb(i % 2 ? black : mix(black, blackHi, 0.25));
    c.beginPath(); c.moveTo(P[0], P[1]);
    c.bezierCurveTo(P[0] - 22, P[1] + 10, P[2] + 6, P[3] - 30, P[2], P[3]);
    c.bezierCurveTo(P[2] + 14, P[3] - 22, P[0] + 4, P[1] + 24, P[0] + 10, P[1] + 6);
    c.closePath(); c.fill();
  });
  // the body: a teardrop, the folded wing over it
  var body = [[42, -172], [64, -146], [64, -114], [46, -90], [12, -78], [-26, -82], [-56, -100], [-66, -128], [-50, -156], [-14, -170], [22, -178], [42, -172]];
  curve(c, body, true);
  c.fillStyle = lingrad(c, 0, -172, 0, -82, [[0, white], [0.6, white], [1, whiteSh]]); c.fill();
  c.save(); curve(c, body, true); c.clip();
  c.fillStyle = rgb(whiteSh, 0.55);
  c.beginPath(); c.moveTo(44, -150); c.quadraticCurveTo(10, -118, -44, -112); c.quadraticCurveTo(-10, -96, 30, -104); c.quadraticCurveTo(50, -120, 44, -150); c.fill();
  c.strokeStyle = rgb(whiteSh, 0.8); c.lineWidth = 1.2;
  for (var f = 0; f < 6; f++) {
    var fy = -150 + f * 9;
    c.beginPath(); c.moveTo(36 - f * 3, fy); c.quadraticCurveTo(0, fy + 12, -36 + f * 2, fy + 18); c.stroke();
  }
  c.restore();
  // the neck: an S, black in front, a white stripe down the nape
  var N = bow ? [[36, -170], [48, -200], [58, -230], [68, -252], [78, -264]] : [[36, -170], [44, -200], [38, -230], [42, -258], [46, -276]];
  var head = bow ? [86, -266] : [48, -282];
  function neckPath(off, w0, w1) {
    var L = [], R = [];
    for (var i = 0; i < N.length; i++) {
      var p = N[i], q = N[Math.min(N.length - 1, i + 1)], pp = N[Math.max(0, i - 1)];
      var tx = q[0] - pp[0], ty = q[1] - pp[1], l = Math.hypot(tx, ty) || 1, nx = -ty / l, ny = tx / l, w = lerp(w0, w1, i / (N.length - 1));
      L.push([p[0] + nx * (w + off), p[1] + ny * (w + off)]); R.push([p[0] - nx * (w - off), p[1] - ny * (w - off)]);
    }
    c.beginPath(); c.moveTo(L[0][0], L[0][1]);
    for (i = 1; i < L.length; i++) c.lineTo(L[i][0], L[i][1]);
    for (i = R.length - 1; i >= 0; i--) c.lineTo(R[i][0], R[i][1]);
    c.closePath();
  }
  neckPath(0, 11, 6); c.fillStyle = rgb(black); c.fill();
  neckPath(-4.5, 3.2, 2.6); c.fillStyle = rgb(white); c.fill();
  // the head: black face, white cheek, the red crown, the long beak
  c.save(); c.translate(head[0], head[1]); c.rotate(bow ? 0.4 : 0.08);
  c.fillStyle = rgb(black); c.beginPath(); c.ellipse(0, 0, 10, 8, 0, 0, TAU); c.fill();
  c.fillStyle = rgb(white); c.beginPath(); c.ellipse(-5, 3, 6, 5, 0, 0, TAU); c.fill();
  c.fillStyle = rgb(red); c.beginPath(); c.ellipse(-1, -6, 7, 4, 0, 0, TAU); c.fill();
  c.fillStyle = rgb(beak);
  c.beginPath(); c.moveTo(7, -3); c.lineTo(42, 8); c.lineTo(8, 3); c.closePath(); c.fill();
  c.fillStyle = rgb([20, 20, 22]); c.beginPath(); c.arc(4, -1.5, 1.2, 0, TAU); c.fill();
  c.restore();
  c.restore();
}

/* ===============================================================
   THE ROPED PINE (雪吊り). Local units: the sheet's pine, the rope knot
   at x 238, y 10, the foot of the trunk at y 605. The ropes behind the
   tree, the pole, the trunk, the pads of needles with snow on them,
   then the ropes in front.
   =============================================================== */
function pine(c, o) {
  var S = shader(o), sc = snowCols(S), r = rng(d(o, 'seed', 21)), sd = S.side, i, k;
  var s = o.h / 595;
  c.save(); c.translate(o.x - 238 * s, o.y - 605 * s); c.scale(s, s);
  var straw = [214, 172, 92], green = [36, 70, 46], bark = [70, 56, 50];
  var nR = 18, knot = [238, 34];
  function rope(i, front) {
    var a = (i + 0.5) / nR * TAU, sx = Math.cos(a), sz = Math.sin(a);
    if ((sz > 0) !== front) return;
    var ex = 238 + sx * 205, ey = 528 + sz * 58;
    var col = S(straw, sx * sd * 0.8 + 0.3, 0.3, 0.6 + sz * 0.4, front ? 1 : 0.5);
    c.strokeStyle = rgb(col, front ? 1 : 0.8); c.lineWidth = front ? 3 : 2.4; c.lineCap = 'round';
    c.beginPath(); c.moveTo(knot[0], knot[1]); c.quadraticCurveTo(lerp(knot[0], ex, 0.5), lerp(knot[1], ey, 0.5) + 6, ex, ey); c.stroke();
    if (front) { c.strokeStyle = rgb(mix(col, [255, 244, 210], 0.5), 0.55); c.lineWidth = 1; c.stroke(); }
  }
  for (i = 0; i < nR; i++) rope(i, false);
  // the pole and the knot of straw at its top
  c.fillStyle = lingrad(c, 234, 0, 243, 0, [[0, S([180, 150, 96], -1, 0, 0.6, 0.6)], [1, S([206, 176, 116], 1, 0, 0.6)]]);
  c.fillRect(235, 30, 7, 570);
  c.fillStyle = rgb(S(straw, sd * 0.5, 0.5, 0.7)); c.fillRect(231, 6, 15, 30);
  c.fillStyle = rgb(S(scale(straw, 0.7), 0, 0, 1)); c.fillRect(230, 28, 17, 4);
  c.strokeStyle = rgb(S(scale(straw, 0.8), 0, 0, 1), 0.7); c.lineWidth = 1;
  for (k = 0; k < 4; k++) { c.beginPath(); c.moveTo(233 + k * 3.5, 8); c.lineTo(233 + k * 3.5, 28); c.stroke(); }
  // the trunk, bending as it rises
  var tr = [[270, 606], [266, 566], [250, 510], [232, 450], [222, 404], [232, 352], [246, 300], [246, 230]];
  var tw = [16, 14, 13, 12, 11, 9, 7, 4];
  c.beginPath();
  for (i = 0; i < tr.length; i++) i ? c.lineTo(tr[i][0] - tw[i], tr[i][1]) : c.moveTo(tr[i][0] - tw[i] * 1.4, tr[i][1]);
  for (i = tr.length - 1; i >= 0; i--) c.lineTo(tr[i][0] + tw[i] * (i ? 1 : 1.4), tr[i][1]);
  c.closePath();
  c.fillStyle = lingrad(c, 215, 0, 290, 0, [[0, S(bark, -1, 0, 0.5, sd < 0 ? 1 : 0.4)], [1, S(bark, 1, 0, 0.5, sd < 0 ? 0.4 : 1)]]); c.fill();
  c.save(); c.clip();
  c.strokeStyle = rgb(S(scale(bark, 0.6), 0, 0, 1), 0.6); c.lineWidth = 1.2;
  for (k = 0; k < 40; k++) { var by = lerp(240, 600, r()), bx = 230 + r() * 40; c.beginPath(); c.moveTo(bx, by); c.lineTo(bx + 6, by + 2); c.stroke(); }
  c.restore();
  // the pads of needles, as in the sheet: uneven clumps, wider toward the foot, some to one side only,
  // each on a branch from the trunk: [middle x, y, half width, thickness]
  var pads = [[250, 222, 22, 16], [232, 250, 34, 18], [276, 262, 40, 18], [200, 290, 52, 20], [290, 300, 50, 20],
              [180, 336, 62, 22], [298, 344, 66, 22], [236, 318, 30, 18], [150, 384, 70, 24], [318, 392, 76, 24], [240, 372, 36, 20],
              [120, 432, 84, 26], [312, 438, 96, 26], [214, 418, 44, 22], [96, 482, 92, 26], [258, 476, 70, 26], [380, 488, 74, 26],
              [168, 470, 50, 24], [64, 512, 50, 22], [330, 520, 72, 22], [200, 512, 60, 22]];
  var greenD = S(green, -sd * 0.5, -0.3, 0.9, 0.35), greenM = S(green, 0, 0.3, 1, 0.75), greenL = S(scale(green, 1.4), sd * 0.8, 0.6, 0.6, 1);
  pads.sort(function (a, b) { return a[1] - b[1]; });
  pads.forEach(function (P) {
    var px = P[0] + (r() - 0.5) * 8, py = P[1] + (r() - 0.5) * 6, hw = P[2] * lerp(0.9, 1.1, r()), th = P[3] * 1.8, x0 = px - hw, x1 = px + hw;
    // the branch out to it from the trunk
    var tx = py > 400 ? lerp(230, 262, (py - 400) / 200) : 240;
    c.strokeStyle = rgb(S(bark, 0, 0, 1, 0.5)); c.lineWidth = lerp(2, 4.5, (py - 220) / 300);
    c.beginPath(); c.moveTo(tx, py + th * 0.6); c.quadraticCurveTo(lerp(tx, px, 0.5), py + th * 0.2, px, py + th * 0.15); c.stroke();
    // the mass: a domed top, a ragged drooping hem
    var n = Math.max(7, Math.round(hw / 5));
    c.fillStyle = rgb(greenD);
    c.beginPath(); c.moveTo(x0, py + th * 0.2);
    for (k = 0; k <= n; k++) { var u = k / n; c.lineTo(lerp(x0, x1, u), py - th * 0.5 * Math.pow(Math.sin(u * PI), 0.7) * lerp(0.75, 1.15, r())); }
    for (k = n; k >= 0; k--) { var u2 = k / n; c.lineTo(lerp(x0, x1, u2), py + th * (0.45 + 0.35 * r()) * (0.6 + 0.4 * Math.sin(u2 * PI))); }
    c.closePath(); c.fill();
    // the needles in sprays: lighter on top and on the sun's side, darker hanging below
    c.lineCap = 'round';
    for (k = 0; k < n * 16; k++) {
      var nx = lerp(x0, x1, r()), ny = py + lerp(-0.4, 0.6, r()) * th * Math.sin(clamp((nx - x0) / (x1 - x0), 0.05, 0.95) * PI), ln = lerp(4, 9, r());
      var out = nx < px ? -1 : 1, ang = ny < py ? -PI / 2 + out * lerp(0.3, 1.1, r()) : PI / 2 - out * lerp(0.2, 1, r());
      var sunny = (out === sd);
      c.strokeStyle = rgb(ny < py ? (sunny ? greenL : greenM) : greenD, 0.9); c.lineWidth = 1.1;
      c.beginPath(); c.moveTo(nx, ny); c.lineTo(nx + Math.cos(ang) * ln, ny + Math.sin(ang) * ln); c.stroke();
    }
    // snow lying on it in soft clumps
    var m = Math.max(2, Math.round(hw / 14));
    for (k = 0; k < m; k++) {
      var sx = lerp(x0 + hw * 0.2, x1 - hw * 0.2, (k + r() * 0.8) / m), sy = py - th * 0.42 * Math.sin(clamp((sx - x0) / (x1 - x0), 0, 1) * PI);
      var rw = lerp(8, 15, r()) * Math.min(1, hw / 40), rh = rw * lerp(0.38, 0.5, r());
      c.fillStyle = rgb(sc.shade, 0.9); c.beginPath(); c.ellipse(sx, sy + rh * 0.45, rw, rh, 0, 0, TAU); c.fill();
      c.fillStyle = rgb((sx < px) === (sd < 0) ? sc.top : mix(sc.top, sc.side, 0.5)); c.beginPath(); c.ellipse(sx, sy, rw * 0.95, rh * 0.85, 0, 0, TAU); c.fill();
    }
  });
  for (i = 0; i < nR; i++) rope(i, true);
  c.restore();
}

return { pagoda: pagoda, hall: hall, lantern: lantern, crane: crane, pine: pine };
})();
