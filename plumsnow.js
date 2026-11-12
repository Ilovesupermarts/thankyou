/* ============================================================
   PLUMSNOW — the snow lying on the plum branches of the new winter
   scene (newwinter.html, step 10). Drawn once (baked) for each straight
   piece of a branch; the page lays each picture along its piece every
   frame as the branch sways. Nothing here runs per frame.

   How it is built (after the reference: a thick, soft ridge of snow
   along the top of every limb, white where it faces the sky, slate blue
   on its front face, darkest in the crease where it sits on the bark):
   - a limb is a chain of pieces; the snow runs on along the chain with
     no dip or seam at the joints: its height is blended across each
     joint, its lumps come from one smooth noise along the whole chain
     (by distance along it, not by piece), and each piece's snow reaches
     a little past the joint, rounding off under the next one's;
   - in section the snow is a rounded cushion sitting on the top of the
     round limb and wrapping down over the upper part of its front; each
     pixel's normal comes from where it lies on that cushion (up at the
     crest, toward you on the front face, down-front where it overhangs)
     and from the lumps along it; lit with the scene's sun and sky (the
     sky's own colour, as lit snow in shade shows it), darker in the
     crease against the wood, a soft shoulder so the top is not flat
     white, a faint grain;
   - it ends in a rounded cap where a limb ends or a twig starts; a
     little extra snow is caught where a side shoot leaves (a fork);
   - here and there it hangs a little further down over the front (a
     soft drip), and on twigs it can break off and leave bare wood.
   Each piece is drawn in its own frame: x along it from its start, y down
   into it (up is -y), its axis at y = 0.

   Use:
     var pic = PlumSnow.bake(p, L);  // { cnv, x0, y0, w, h } (the picture covers x0 … x0 + w,
                                     // y0 … y0 + h in the piece's frame) or null
   p: len, w0, w1 (half the wood's thickness at its start and end, px),
      h0, h1 (the snow's height above the wood at its start and end, px),
      capStart, capEnd (true: the snow ends there in a rounded cap; false:
      it runs on into the next piece), sa, sb (0 … 1: where the snow starts
      and ends, for bare stretches; only used at a capped end), s0 (distance
      along the chain at the piece's start, px), chain (the chain's seed),
      fork (true: a side shoot leaves at the end), along [x, y], up [x, y]
      (the piece's direction and its upward side on the screen, y down),
      RS (device px per px)
   L: dir (toward the sun: x right, y up, z toward you), sun, sky ([r, g, b]
      0 … 1+), amb, snow ([r, g, b] 0 … 255), haze (0 … 1), hazeCol ([r, g, b]
      0 … 255), cover (how far down the wood's front the snow wraps, 0 … 1),
      lumps (0 … 2), shade (how dark its front and crease, 0 … 2), contact
      (0 … 1), grain (0 … 1)
   ============================================================ */
var PlumSnow = (function () {
'use strict';

var PI = Math.PI;
function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
function smooth(e0, e1, x) { var t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); }
function hash(n) { n = Math.sin(n * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); }
/* Smooth value noise along a line (-1 … 1). */
function noise1(x, seed) {
  var i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return lerp(hash(i + seed * 17.13), hash(i + 1 + seed * 17.13), u) * 2 - 1;
}
function noise2(x, y, seed) {
  var i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  function h(a, b) { return hash(a * 57.0 + b * 113.0 + seed * 7.31); }
  return lerp(lerp(h(i, j), h(i + 1, j), u), lerp(h(i, j + 1), h(i + 1, j + 1), u), v) * 2 - 1;
}

function bake(p, L) {
  var len = p.len, RS = p.RS || 2, lumpK = L.lumps === undefined ? 1 : L.lumps;
  var hMax = Math.max(p.h0, p.h1);
  if (hMax < 0.25 || len < 1) return null;
  // how far the snow reaches past each end: on into the next piece, or out to its rounded cap
  // (a joined start begins exactly at the joint: the piece before reaches on under it, so nothing is laid over its snow)
  var ext0 = 0;
  var ext1 = p.capEnd ? (p.fork ? p.w1 * 0.8 : 0) : Math.min(p.w1 * 1.3 + 1, len * 0.3);
  var xs = p.capStart ? len * (p.sa || 0) : -ext0, xe = p.capEnd ? len * (p.sb === undefined ? 1 : p.sb) + ext1 : len + ext1;
  if (xe - xs < 1) return null;
  var cover = L.cover === undefined ? 0.3 : L.cover;
  // the snow's line along the piece, every half device pixel: its crest (top, negative y) and its foot on the wood
  var step = 0.5 / RS, n = Math.ceil((xe - xs) / step) + 1, top = new Float32Array(n), foot = new Float32Array(n);
  var cap0 = Math.max(1.2, Math.min((p.h0 + p.w0) * 1.1, (xe - xs) * 0.45));
  var cap1 = Math.max(1.2, Math.min((p.h1 + p.w1) * 1.1, (xe - xs) * 0.45));
  var lam1 = Math.max(10, (p.w0 + p.w1) * 3.5), lam2 = Math.max(4, lam1 * 0.33);
  var minY = 0, maxY = -1e9;
  for (var i = 0; i < n; i++) {
    var x = xs + i * step, t = clamp(x / len, 0, 1), w = lerp(p.w0, p.w1, t), s = p.s0 + x;
    var h = lerp(p.h0, p.h1, t);
    // lumps along the whole chain (one smooth noise by distance along it), so joints do not show
    var lump = 1 + lumpK * (0.17 * noise1(s / lam1, p.chain) + 0.08 * noise1(s / lam2, p.chain + 3.7));
    h *= Math.max(0.35, lump);
    // a fork: a little more snow caught where the side shoot leaves
    if (p.fork) { var df = (x - len) / Math.max(2, p.w1 * 2.2); h += Math.max(p.w1 * 0.9, p.h1 * 0.5) * Math.exp(-df * df); }
    // rounded caps: where the snow ends (a capped end) or where it runs on past a joint (rounding off under the next piece)
    var e = 1;
    if (p.capStart && x - xs < cap0) { var a0 = (x - xs) / cap0; e = Math.min(e, Math.sqrt(Math.max(0, 1 - (1 - a0) * (1 - a0)))); }
    if (p.capEnd && xe - x < cap1) { var a1 = (xe - x) / cap1; e = Math.min(e, Math.sqrt(Math.max(0, 1 - (1 - a1) * (1 - a1)))); }
    if (!p.capEnd && x > len) e = Math.min(e, 1 - 0.15 * (x - len) / Math.max(0.5, ext1));   // past the joint, a little under the next piece's snow
    // the foot: wrapping down over the upper part of the wood's front, a little further here and there (a soft drip)
    var drip = Math.max(0, noise1(s / lam2 * 0.9, p.chain + 11.3)) * lumpK;
    var fy = -w + w * 2 * clamp(cover * (0.75 + 0.5 * drip) * Math.sqrt(e), 0, 0.92);
    var ty = -w - h * e;
    if (ty > fy - 0.15) ty = fy - 0.15;
    top[i] = ty; foot[i] = fy;
    if (ty < minY) minY = ty;
    if (fy > maxY) maxY = fy;
  }
  var pad = 2, x0 = xs - pad, y0 = minY - pad, wP = xe - xs + pad * 2, hP = maxY - minY + pad * 2;
  var cw = Math.max(1, Math.ceil(wP * RS)), ch = Math.max(1, Math.ceil(hP * RS));
  var cnv = document.createElement('canvas');
  cnv.width = cw; cnv.height = ch;
  var c = cnv.getContext('2d'), img = c.createImageData(cw, ch), D = img.data;
  // the light: the piece's directions in 3D (x right, y up, z toward you)
  var A = [p.along[0], -p.along[1], 0], U = [p.up[0], -p.up[1], 0], Ld = L.dir, ll = Math.hypot(Ld[0], Ld[1], Ld[2]) || 1;
  var lx = Ld[0] / ll, ly = Ld[1] / ll, lz = Ld[2] / ll;
  var sn = L.snow, sun = L.sun, sky = L.sky, amb = L.amb, hz = L.haze || 0, hc = L.hazeCol || [246, 238, 232];
  var shadeK = L.shade === undefined ? 1 : L.shade, contact = L.contact === undefined ? 0.6 : L.contact, grain = L.grain === undefined ? 0.5 : L.grain;
  var lowSun = smooth(-0.05, 0.1, ly + 0.08), skyW = (sky[0] + sky[1] + sky[2]) / 3 * 1.18;   // the sky overhead, whiter
  function sampleIdx(x) { return clamp((x - xs) / step, 0, n - 1); }
  function at(arr, x) { var f = sampleIdx(x), i0 = Math.floor(f), i1 = Math.min(n - 1, i0 + 1), u = f - i0; return arr[i0] + (arr[i1] - arr[i0]) * u; }
  for (var px = 0; px < cw; px++) {
    var X = x0 + (px + 0.5) / RS;
    if (X < xs - 0.5 / RS || X > xe + 0.5 / RS) continue;
    var yT = at(top, X), yB = at(foot, X), span = yB - yT;
    if (span <= 0.05) continue;
    var slope = (at(top, X + 0.6) - at(top, X - 0.6)) / 1.2;
    // how far into the snow this column is from its ends (thin ends let light through and look softer)
    var endIn = Math.min(p.capStart ? X - xs : 1e9, p.capEnd ? xe - X : 1e9);
    var yA = Math.floor((yT - y0) * RS - 1), yZ = Math.ceil((yB - y0) * RS + 1);
    for (var py = Math.max(0, yA); py < Math.min(ch, yZ); py++) {
      var Y = y0 + (py + 0.5) / RS;
      // coverage: soft at the crest (about a device pixel and a half), crisp at the foot on the wood
      var cov = clamp((Y - yT) * RS / 1.5 + 0.5, 0, 1) * clamp((yB - Y) * RS / 0.9 + 0.5, 0, 1);
      if (cov <= 0.003) continue;
      var v = clamp((Y - yT) / span, 0, 1);
      // where on the cushion: the crest faces up, the front toward you, its foot down and out over the wood
      var th = Math.acos(clamp(1 - 1.62 * Math.pow(v, 1.35), -1, 1));
      var ct = Math.cos(th), st = Math.sin(th), tx = slope * 1.6 * Math.max(0, ct);
      // its ends round off sideways
      var ex = endIn < span * 1.5 ? ((p.capStart ? X - xs : 1e9) < (p.capEnd ? xe - X : 1e9) ? -1 : 1) * (1 - endIn / (span * 1.5)) * 0.8 : 0;
      tx += ex;
      var nx = tx * A[0] + ct * U[0], ny = tx * A[1] + ct * U[1], nz = st;
      // the fine lumpy surface tips the normal a little
      var gx = noise2(X * 0.45, Y * 0.45, p.chain) * 0.18 * grain, gy = noise2(X * 0.45 + 9, Y * 0.45, p.chain) * 0.18 * grain;
      nx += gx; ny += gy;
      var nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
      // sun: soft-edged (light goes a little way into snow)
      var dl = clamp((nx * lx + ny * ly + nz * lz + 0.22) / 1.22, 0, 1);
      dl = dl * dl * (3 - 2 * dl) * lowSun;
      // sky: the snow facing you takes the sky's own colour; facing up a little brighter, facing down darker
      var skyK = ny >= 0 ? 1 + 0.12 * ny : 1 + 0.5 * shadeK * ny;
      // the crease where it sits on the bark gets less of everything
      var crease = smooth(0.72, 1, v) * contact * 0.55 * shadeK;
      var occ = 1 - crease;
      // the front face a little deeper in tone than the crest (as painted)
      var face = 1 - 0.1 * shadeK * smooth(0.25, 0.7, v);
      var up = Math.max(0, ny) * 0.65, sR = lerp(sky[0], skyW, up), sG = lerp(sky[1], skyW, up), sB = lerp(sky[2], skyW, up);
      var r = sn[0] / 255 * (sun[0] * dl * occ + sR * amb * skyK * occ * face);
      var g = sn[1] / 255 * (sun[1] * dl * occ + sG * amb * skyK * occ * face);
      var b = sn[2] / 255 * (sun[2] * dl * occ + sB * amb * skyK * occ * face);
      // light through the thin ends and the thin crest when the sun is low and behind the snow
      var thin = Math.pow(1 - clamp(Math.min(endIn / 3, span / 4), 0, 1), 2) * clamp(-lz + 0.2, 0, 1) * lowSun * 0.35;
      r += sun[0] * thin; g += sun[1] * thin; b += sun[2] * thin;
      // a faint grain
      var gr = 1 + noise2(X * 1.7, Y * 1.7, p.chain + 5) * 0.025 * grain;
      r *= gr; g *= gr; b *= gr;
      // a soft shoulder: the brightest snow rolls off toward white instead of clipping flat
      r = r > 0.84 ? 0.84 + 0.16 * (1 - Math.exp(-(r - 0.84) / 0.16)) : r;
      g = g > 0.84 ? 0.84 + 0.16 * (1 - Math.exp(-(g - 0.84) / 0.16)) : g;
      b = b > 0.84 ? 0.84 + 0.16 * (1 - Math.exp(-(b - 0.84) / 0.16)) : b;
      r = lerp(r * 255, hc[0], hz); g = lerp(g * 255, hc[1], hz); b = lerp(b * 255, hc[2], hz);
      var k = (py * cw + px) * 4;
      D[k] = clamp(r, 0, 255); D[k + 1] = clamp(g, 0, 255); D[k + 2] = clamp(b, 0, 255); D[k + 3] = Math.round(cov * 255);
    }
  }
  c.putImageData(img, 0, 0);
  return { cnv: cnv, x0: x0, y0: y0, w: wP, h: hP, top: top, xs: xs, step: step };
}

return { bake: bake };
})();
