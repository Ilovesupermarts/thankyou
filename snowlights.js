/* ============================================================
   SNOWLIGHTS — the winter scene's lights, after the snow-lantern
   festivals of Hokkaidō (小樽雪あかりの路, 湯西川かまくら祭):
     yuki     雪灯籠 a lantern of packed snow, a candle inside behind an
              arched window
     kamakura かまくら a small snow hut, its doorway glowing
     yukimi   雪見灯籠 a stone snow-viewing lantern: short legs, a
              firebox and a wide roof heaped with snow
   By day they are only snow (and stone) with dark windows. As the light
   goes, the candles are lit: the windows glow and flicker, the snow
   walls round them glow warm from inside, and each throws a pool of
   warm light on the snow in front.

   The bodies are drawn once (baked) by the scene; the light is drawn
   every frame.
   Use:
     Snowlights.body(ctx, o)          // one body; returns { x, y, r }: where its light is
     Snowlights.glow(ctx, L, t, o)    // the light of one lantern L ({ x, y, r, kind, ph,
                                      // foot }) at time t
   o for body() (CSS px):
     kind, x, y (the foot), s (its height, px), seed, lit (0 … 1: the candle's
     glow baked into the walls), sunDir, sunColour, skyColour, ambient, haze,
     hazeColour, colours { snow, stone, flame }
   o for glow():
     strength, flicker (0 … 1), halo, pool (sizes), colours { flame, glow }, wind
   ============================================================ */
var Snowlights = (function () {
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
function shader(o) {
  var L = d(o, 'sunDir', [-0.8, 0.4, 0.3]), sun = d(o, 'sunColour', [1, 0.97, 0.92]), sky = d(o, 'skyColour', [0.7, 0.78, 0.92]);
  var amb = d(o, 'ambient', 0.9), haze = d(o, 'haze', 0), hc = d(o, 'hazeColour', [246, 238, 232]);
  return function (base, nx, ny, nz, occ) {
    var l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    var k = occ === undefined ? 1 : occ;
    var dl = Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]) * k, sk = (0.6 + 0.4 * ny) * amb * lerp(0.75, 1, k);
    return mix([base[0] * (sun[0] * dl + sky[0] * sk), base[1] * (sun[1] * dl + sky[1] * sk), base[2] * (sun[2] * dl + sky[2] * sk)], hc, haze);
  };
}
/* A lit body: shaded left to right like a round thing, lit from the side of the sun. */
function roundFill(c, S, base, x0, x1) {
  var g = c.createLinearGradient(x0, 0, x1, 0);
  for (var i = 0; i <= 4; i++) {
    var u = i / 4, nx = (u - 0.5) * 2;
    g.addColorStop(u, rgb(S(base, nx * 0.9, 0.45, Math.sqrt(Math.max(0.05, 1 - nx * nx)))));
  }
  return g;
}

function body(c, o) {
  var S = shader(o), r = rng(d(o, 'seed', 1)), s = o.s, x = o.x, y = o.y, lit = d(o, 'lit', 0);
  var C = o.colours || {}, snow = C.snow || [252, 251, 250], stone = C.stone || [150, 146, 140], flame = C.flame || [255, 170, 90];
  var L = d(o, 'sunDir', [-0.8, 0.4, 0.3]);
  var dark = mix(S(snow, 0, 0, 1, 0.1), [40, 34, 40], 0.75);
  function windowArch(wx, wy, ww, wh) {
    c.beginPath();
    c.moveTo(wx - ww / 2, wy + wh / 2); c.lineTo(wx - ww / 2, wy - wh / 2 + ww / 2);
    c.arc(wx, wy - wh / 2 + ww / 2, ww / 2, PI, TAU);
    c.lineTo(wx + ww / 2, wy + wh / 2); c.closePath();
  }
  function warmWalls(cx, cy, rad) {             // the snow round the candle glows from inside
    if (lit <= 0) return;
    var g = c.createRadialGradient(cx, cy, 0, cx, cy, rad);
    g.addColorStop(0, rgb(flame, 0.55 * lit)); g.addColorStop(0.5, rgb(flame, 0.22 * lit)); g.addColorStop(1, rgb(flame, 0));
    c.save(); c.globalCompositeOperation = 'source-atop'; c.fillStyle = g; c.fillRect(cx - rad, cy - rad, rad * 2, rad * 2); c.restore();
  }
  if (o.kind === 'kamakura') {
    var w = s * 1.15, hh = s;
    c.save();
    c.beginPath(); c.moveTo(x - w, y); c.bezierCurveTo(x - w, y - hh * 0.95, x - w * 0.35, y - hh * 1.05, x, y - hh);
    c.bezierCurveTo(x + w * 0.35, y - hh * 1.05, x + w, y - hh * 0.95, x + w, y); c.closePath();
    c.fillStyle = roundFill(c, S, snow, x - w, x + w, y - hh, y);
    c.fill();
    var tg = c.createLinearGradient(0, y - hh, 0, y);                                   // lit from above, cooler low down
    tg.addColorStop(0, rgb(S(snow, 0, 1, 0.2), 0.35)); tg.addColorStop(1, rgb(S(snow, 0, -0.2, 1, 0.4), 0.3));
    c.fillStyle = tg; c.fill();
    var dw = w * 0.62, dh = hh * 0.62, dy = y - dh / 2;
    windowArch(x + w * 0.05, dy, dw, dh); c.fillStyle = rgb(dark); c.fill();
    warmWalls(x + w * 0.05, dy, w * 1.4);
    c.restore();
    c.fillStyle = rgb(S(snow, 0, 1, 0.4, 0.9));                                         // snow banked at the door
    c.beginPath(); c.ellipse(x + w * 0.05, y, dw * 0.75, hh * 0.06, 0, PI, TAU); c.fill();
    return { x: x + w * 0.05, y: dy + dh * 0.15, r: s * 0.55, foot: y, kind: 'kamakura' };
  }
  if (o.kind === 'yukimi') {
    var cr = (L[0] < 0 ? -1 : 1);
    function stoneAt(nx, ny, nz, occ) { return S(stone, nx, ny, nz, occ); }
    // three short legs, curving out
    var legH = s * 0.32, spread = s * 0.42;
    c.lineCap = 'round';
    [-1, 0, 1].forEach(function (k) {
      c.strokeStyle = rgb(stoneAt(k * 0.7, 0.2, k === 0 ? 1 : 0.6, k === 0 ? 0.8 : 0.5)); c.lineWidth = s * (k === 0 ? 0.07 : 0.06);
      c.beginPath(); c.moveTo(x + k * spread * 0.18, y - legH); c.quadraticCurveTo(x + k * spread * 0.55, y - legH * 0.45, x + k * spread, y); c.stroke();
    });
    // the base ring and the firebox with its window
    var by = y - legH, bw = s * 0.32, bh = s * 0.08;
    c.fillStyle = roundFill(c, S, stone, x - bw, x + bw, by - bh, by); c.fillRect(x - bw, by - bh, bw * 2, bh);
    var fw = s * 0.2, fh = s * 0.2, fy = by - bh - fh;
    c.fillStyle = roundFill(c, S, stone, x - fw, x + fw, fy, fy + fh); c.fillRect(x - fw, fy, fw * 2, fh);
    windowArch(x, fy + fh * 0.52, fw * 0.9, fh * 0.7); c.fillStyle = rgb(dark); c.fill();
    // the roof: wide and low, its edges curling up a touch
    var rw = s * 0.62, rh = s * 0.13, ry = fy - rh * 0.15;
    c.beginPath(); c.moveTo(x - rw, ry + rh * 0.15); c.quadraticCurveTo(x, ry - rh * 1.4, x + rw, ry + rh * 0.15);
    c.quadraticCurveTo(x, ry + rh * 0.45, x - rw, ry + rh * 0.15); c.closePath();
    c.fillStyle = roundFill(c, S, stone, x - rw, x + rw, ry - rh, ry); c.fill();
    // the snow heaped on it, thick, overhanging, with the jewel on top buried
    var sh = s * 0.2, top = ry - rh * 0.6;
    c.beginPath(); c.moveTo(x - rw * 1.04, ry + rh * 0.1);
    c.bezierCurveTo(x - rw * 0.95, top - sh * 0.6, x - rw * 0.25, top - sh * 1.15, x, top - sh * 1.05);
    c.bezierCurveTo(x + rw * 0.25, top - sh * 1.15, x + rw * 0.95, top - sh * 0.6, x + rw * 1.04, ry + rh * 0.1);
    c.quadraticCurveTo(x, ry + rh * 0.55, x - rw * 1.04, ry + rh * 0.1); c.closePath();
    var sg = c.createLinearGradient(0, top - sh, 0, ry + rh * 0.5);
    sg.addColorStop(0, rgb(S(snow, cr * 0.4, 1, 0.3))); sg.addColorStop(0.6, rgb(S(snow, cr * 0.2, 0.4, 0.9))); sg.addColorStop(1, rgb(S(snow, 0, -0.3, 1, 0.4)));
    c.fillStyle = sg; c.fill();
    var sx = c.createLinearGradient(x - rw * cr, 0, x + rw * cr, 0);
    sx.addColorStop(0, rgb(S(snow, 0, 0, 1, 0), 0)); sx.addColorStop(0.6, rgb(S(snow, 0, 0, 1, 0), 0)); sx.addColorStop(1, rgb(S(snow, 0, 0, 1, 0), 0.35));
    c.fillStyle = sx; c.fill();
    for (var q = 0; q < 5; q++) {                                                      // lumps over the edge
      var lx = x + lerp(-0.9, 0.9, (q + r() * 0.6) / 5) * rw, lr = s * lerp(0.03, 0.06, r());
      c.fillStyle = rgb(S(snow, 0, 0.1, 1, 0.6));
      c.beginPath(); c.ellipse(lx, ry + rh * 0.2, lr, lr * 1.4, 0, 0, TAU); c.fill();
    }
    c.fillStyle = rgb(S(snow, 0, 1, 0.4, 0.8));                                        // snow round the feet
    c.beginPath(); c.ellipse(x, y, spread * 1.3, s * 0.05, 0, PI, TAU); c.fill();
    return { x: x, y: fy + fh * 0.55, r: s * 0.3, foot: y, kind: 'yukimi' };
  }
  // the snow lantern: a packed drum of snow, a little uneven, with an arched window
  var ww2 = s * lerp(0.36, 0.44, r()), top2 = y - s;
  c.beginPath(); c.moveTo(x - ww2, y);
  c.lineTo(x - ww2 * 0.95, top2 + s * 0.18);
  c.quadraticCurveTo(x - ww2 * 0.9, top2 - s * 0.02, x, top2 - s * lerp(0.02, 0.08, r()));
  c.quadraticCurveTo(x + ww2 * 0.9, top2 - s * 0.02, x + ww2 * 0.95, top2 + s * 0.18);
  c.lineTo(x + ww2, y); c.closePath();
  c.fillStyle = roundFill(c, S, snow, x - ww2, x + ww2, top2, y); c.fill();
  var cap = c.createLinearGradient(0, top2 - s * 0.05, 0, top2 + s * 0.3);
  cap.addColorStop(0, rgb(S(snow, 0, 1, 0.2), 0.5)); cap.addColorStop(1, rgb(S(snow, 0, 1, 0.2), 0));
  c.fillStyle = cap; c.fill();
  c.save(); c.clip();
  var wy2 = y - s * 0.45;
  warmWalls(x, wy2, s * 0.9);
  c.restore();
  windowArch(x, wy2, ww2 * 0.62, s * 0.36); c.fillStyle = rgb(dark); c.fill();
  c.fillStyle = rgb(S(snow, 0, 1, 0.4, 0.85));
  c.beginPath(); c.ellipse(x, y, ww2 * 1.25, s * 0.07, 0, PI, TAU); c.fill();
  return { x: x, y: wy2 + s * 0.05, r: s * 0.3, foot: y, kind: 'yuki' };
}

/* How bright a candle is now: a slow wander, and now and then a quick flutter (more in the wind). */
function flick(L, t, amt, wind) {
  var ph = L.ph || 0;
  var slow = 0.5 + 0.25 * Math.sin(t * 1.7 + ph) + 0.15 * Math.sin(t * 3.9 + ph * 2.3) + 0.1 * Math.sin(t * 8.3 + ph * 0.7);
  var fl = Math.pow(Math.max(0, Math.sin(t * 0.37 + ph * 5.1)), 18) * Math.sin(t * 23 + ph) * (1 + (wind || 0));
  return clamp(1 - amt * (0.55 * (1 - slow) + 0.35 * Math.abs(fl)), 0.15, 1.1);
}
function glow(c, L, t, o) {
  var k = d(o, 'strength', 1);
  if (k <= 0.005) return;
  var C = o.colours || {}, flame = C.flame || [255, 170, 90], gl = C.glow || [255, 214, 150];
  var f = flick(L, t, d(o, 'flicker', 0.5), d(o, 'wind', 0)) * k, r = L.r;
  c.save();
  c.globalCompositeOperation = 'lighter';
  // the pool of light on the snow in front
  var pr = r * 4.2 * d(o, 'pool', 1), py = L.foot + r * 0.25;
  c.translate(L.x, py); c.scale(1, 0.32);
  var pg = c.createRadialGradient(0, 0, 0, 0, 0, pr);
  pg.addColorStop(0, rgb(flame, 0.38 * f)); pg.addColorStop(0.45, rgb(flame, 0.14 * f)); pg.addColorStop(1, rgb(flame, 0));
  c.fillStyle = pg; c.fillRect(-pr, -pr, pr * 2, pr * 2);
  c.restore();
  c.save();
  c.globalCompositeOperation = 'lighter';
  // the window, bright and warm
  var wr = r * (L.kind === 'kamakura' ? 0.9 : 0.55);
  var wg = c.createRadialGradient(L.x, L.y, 0, L.x, L.y, wr);
  wg.addColorStop(0, rgb([255, 236, 190], 0.95 * f)); wg.addColorStop(0.45, rgb(gl, 0.6 * f)); wg.addColorStop(1, rgb(flame, 0));
  c.fillStyle = wg; c.beginPath(); c.arc(L.x, L.y, wr, 0, TAU); c.fill();
  // the halo in the cold air round it
  var hr = r * 3.2 * d(o, 'halo', 1);
  var hg = c.createRadialGradient(L.x, L.y, 0, L.x, L.y, hr);
  hg.addColorStop(0, rgb(gl, 0.28 * f)); hg.addColorStop(0.35, rgb(flame, 0.1 * f)); hg.addColorStop(1, rgb(flame, 0));
  c.fillStyle = hg; c.fillRect(L.x - hr, L.y - hr, hr * 2, hr * 2);
  c.restore();
}

return { body: body, glow: glow, flick: flick };
})();
