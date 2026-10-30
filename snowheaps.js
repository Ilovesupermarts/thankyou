/* ============================================================
   SNOWHEAPS — the snow lying on the plum branches, and the lighting
   of any snow lying on things (the branches, the torii) with the snow
   material in snowfield.js. Drawn once (baked); nothing here runs per
   frame.

   A branch is made of straight pieces. On each piece the snow is:
   - a heap along its top: rounded at both ends, gently lumpy, here and
     there wrapping over the edge (sag) or leaving a bare stretch, and
     reaching just over the joint into the next piece, so the heaps of
     a limb meet with a gentle dip;
   - a thin dusting along the top of the wood where the heap is thin
     or missing (on the steep twigs), broken here and there;
   - where a side shoot leaves the piece (a fork), a little snow caught
     in the crook.
   Each piece is drawn in its own frame: x along it from its start, y
   down into it (so up is -y), its axis at y = 0.

   Use:
     var sh = SnowHeaps.shape(p);       // the heap's outline for piece p (below)
     SnowHeaps.draw(ctx, sh, p);        // fills where the snow is (white), in the piece's frame
     var lit = SnowHeaps.light(mask, radius, m);
                                        // the mask (a canvas: where the snow is, in its
                                        // alpha) lit by the snow material; radius: how
                                        // round the heaps are (px); m: see
                                        // Snowfield.material. { img, sx, sy, w, h } (that
                                        // part of img; copy it away at once), or null
                                        // without WebGL 2.
     SnowHeaps.put(ctx, lit, dx, dy);   // copies it onto ctx at dx, dy (device px)
   p: len (px), w0, w1 (half the wood's thickness at its start and end), sa, sb
      (0 … 1: where the snow starts and ends; < 1 a bare stretch), lump[], sag[]
      (n + 1 values each: the heap's height and how far it wraps over the edge,
      along the piece), hS (the heap's height, px), joins (true: the piece goes
      on into another, so the snow reaches over the joint), fork (true: a side
      shoot leaves at its end), dust (0 … 1), seed
   ============================================================ */
var SnowHeaps = (function () {
'use strict';

var PI = Math.PI, TAU = PI * 2;
function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
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
/* A smooth line through the points, from k0 to k1. */
function smoothTo(c, pts, k0, k1) {
  var st = k1 > k0 ? 1 : -1;
  for (var k = k0; k !== k1; k += st) c.quadraticCurveTo(pts[k][0], pts[k][1], (pts[k][0] + pts[k + st][0]) / 2, (pts[k][1] + pts[k + st][1]) / 2);
  c.lineTo(pts[k1][0], pts[k1][1]);
}

/* The heap's outline: its foot (bs: on the wood, wrapping over the edge where it sags) and its top (ts). */
function shape(p) {
  var NS = p.lump.length - 1, bs = [], ts = [], minY = Infinity, maxY = -Infinity, j;
  var ext = Math.min((p.w0 + p.w1) * 0.45, p.len * 0.15);
  var e0 = p.sa > 0 ? 0 : ext, e1 = p.sb < 1 || !p.joins ? 0 : ext;
  for (j = 0; j <= NS; j++) {
    var tj = j / NS;
    var x = lerp(p.len * p.sa - e0, p.len * p.sb + e1, tj), tt = clamp(x / p.len, 0, 1), wA = lerp(p.w0, p.w1, tt);
    var env = Math.pow(Math.sin(PI * lerp(0.03, 0.97, tj)), 0.45);
    var down = wA * (0.8 - 1.1 * p.sag[j] * env), hh = p.hS * env * p.lump[j];
    bs.push([x, -down]); ts.push([x, -down - hh]);
    minY = Math.min(minY, -down - hh); maxY = Math.max(maxY, -down);
  }
  // the dusting reaches a little higher than the wood, and the fork's snow past the end
  var x0 = Math.min(bs[0][0], 0) - 2, x1 = Math.max(bs[NS][0], p.len) + (p.fork ? (p.w1 * 1.6 + p.hS * 0.5) : 0) + 2;
  minY = Math.min(minY, -Math.max(p.w0, p.w1) - 2 - (p.fork ? p.w1 * 1.2 + p.hS * 0.6 : 0));
  maxY = Math.max(maxY, Math.max(p.w0, p.w1) * 0.2);
  return { bs: bs, ts: ts, NS: NS, x0: x0, x1: x1, minY: minY, maxY: maxY };
}

/* Fill where the snow is, in white, in the piece's frame. */
function draw(c, sh, p) {
  var r = rng(p.seed || 1), NS = sh.NS, j;
  c.fillStyle = '#FFFFFF';
  if (p.hS >= 0.4) {
    c.beginPath(); c.moveTo(sh.bs[0][0], sh.bs[0][1]);
    smoothTo(c, sh.ts, 0, NS); smoothTo(c, sh.bs, NS, 0); c.closePath(); c.fill();
  }
  // a thin dusting along the top of the wood, broken here and there
  var dust = p.dust === undefined ? 0.6 : p.dust;
  if (dust > 0) {
    var n = Math.max(6, Math.round(p.len / 3)), ph1 = r() * TAU, ph2 = r() * TAU, f1 = lerp(0.15, 0.3, r()), f2 = lerp(0.5, 0.9, r());
    var top = [], bot = [];
    for (j = 0; j <= n; j++) {
      var x = p.len * j / n, wA = lerp(p.w0, p.w1, j / n);
      var t = (0.55 + 0.35 * Math.sin(x * f1 + ph1) + 0.25 * Math.sin(x * f2 + ph2)) * dust;
      t = Math.max(0, t - 0.25) * Math.max(1, wA * 0.5);        // gaps where it falls below nothing
      bot.push([x, -wA * 0.7]); top.push([x, -wA * 0.7 - t * 1.4]);
    }
    c.beginPath(); c.moveTo(bot[0][0], bot[0][1]);
    smoothTo(c, top, 0, n); smoothTo(c, bot, n, 0); c.closePath(); c.fill();
  }
  // snow caught in the crook where a side shoot leaves
  if (p.fork) {
    var rw = p.w1 * 1.3 + p.hS * 0.45, rh = p.w1 * 0.8 + p.hS * 0.35;
    c.beginPath(); c.ellipse(p.len - p.w1 * 0.2, -p.w1 * 0.75 - rh * 0.35, rw, rh, 0, 0, TAU); c.fill();
  }
}

/* The mask lit by the snow material (snowfield.js). */
var HT = null;
function light(mask, radius, m) {
  if (typeof Snowfield === 'undefined' || !Snowfield.material) return null;
  if (!HT) HT = document.createElement('canvas');
  if (HT.width !== mask.width || HT.height !== mask.height) { HT.width = mask.width; HT.height = mask.height; }
  var h = HT.getContext('2d');
  h.setTransform(1, 0, 0, 1, 0, 0);
  h.clearRect(0, 0, HT.width, HT.height);
  h.filter = 'blur(' + Math.max(0.5, radius).toFixed(1) + 'px)';
  h.drawImage(mask, 0, 0);
  h.filter = 'none';
  return Snowfield.material(mask, HT, m);
}

function put(c, L, dx, dy) {
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
  c.drawImage(L.img, L.sx, L.sy, L.w, L.h, dx, dy, L.w, L.h);
  c.restore();
}

return { shape: shape, draw: draw, light: light, put: put, smoothTo: smoothTo };
})();
