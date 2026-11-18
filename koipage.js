/* ============================================================
   koipage.js — the koi pond page of the app: what she sees after the
   last thank-you message (in place of the Pong game).

   It is koiscreen.html's pond brought into the app, with the values
   chosen there (KOI_SCREEN in app.js): the koi (koipond.js), the rocks
   along the bottom, the bamboo fountain and its sound. There is no
   pond water of its own: the koi, their shadows, the rocks and the
   fountain lie over the app's own background (the Shippō pattern and
   the sky's colour; app.js fades the season's scenery out, as it did
   for the games page).

   How it comes in (start):
     1. the rocks and the fountain are painted in by the same wet ink
        washes as the autumn scene's introduction (inkreveal.js with
        inkfluid.js, the app's RV_LOOK values): the rocks along the
        bottom from left to right, the fountain from the screen's edge
        along the spout to its mouth and the stand;
     2. then the fountain's water starts to run (fading in) with its
        sound (Sound/fountain01.mp3, the test bed's seamless loop,
        played quietly on the app's audio context, straight to the
        speakers, under the music);
     3. and the koi swim in, one after another, from the left, the right
        and the top (under the toolbar), each at a depth of its own
        (koipond.js's enter). Never from under the rocks along the bottom.
   Tap the water: food pellets, as in the test bed.

   Sections 1 and 2 below (the rocks, the fountain) are copied from
   koiscreen.html's sections 3b and 3c, changed only in where they
   draw; when the test bed's drawing changes, copy it again.

   Use (app.js):
     KoiPage.init(root, values, { look, audio })   once: values = KOI_SCREEN
     KoiPage.prepare()   while the messages show: pictures and koi made ahead
     KoiPage.start()     the page comes in (ink, then the water, then the koi)
     KoiPage.stop()      the page goes (sound fades out, koi stop)
     KoiPage.info()      a line for the console
   ============================================================ */
(function () {
'use strict';

var BASE = '';
var V = null, OPT = {}, root = null, pond = null, pondCv = null, made = false, ready = false, assets = 0;
var CV = {};                 // the page's canvases: shade, pond, fountain, rocks, fx
var PIC = {};                // the rocks', their shade's and the fountain's pictures, cut to where they lie
var koiTimer = 0, active = false, raf = 0, phase = 'off', inkLayer = null, tStart = 0, lastNow = 0, waitReady = 0;
var KINDS = ['kohaku', 'ogon', 'showa', 'tancho', 'sanke', 'platinum', 'asagi', 'shiro', 'bekko', 'goshiki'];

function kindList() {
  var out = [], left = {}, more = true;
  KINDS.forEach(function (k) { left[k] = (V.mix && V.mix[k]) || 0; });
  while (more) {
    more = false;
    KINDS.forEach(function (k) { if (left[k] > 0) { out.push(k); left[k]--; more = true; } });
  }
  return out.length ? out : ['kohaku'];
}
function koiSettings() {
  var o = {};
  for (var k in V) if (k !== 'mix') o[k] = V[k];
  o.kinds = kindList();
  o.floorGap = V.rkGap;
  return o;
}
function assetLoaded() { if (made && rocksLoaded === ROCK_N && fnLoaded) draw(); }
function dprNow() { return Math.min(V.maxDpr || 2, window.devicePixelRatio || 1); }

/* ============================================================
   1. THE ROCKS (koiscreen.html's 3b) ALONG THE BOTTOM (the pond's edge)
   The user's four rock drawings (koi-rocks/rock01 … rock04.webp, cut
   out of their vector sheet: the brown, the grey-brown, the speckled
   and the blue-grey). They are scattered at random along the bottom,
   then wherever the background would still show inside the cluster
   (below the line of the rocks' tops) another rock is put in, until
   none shows; any sliver left is a dark crevice. Each rock is its own:
   size, a little tilt and stretch, way round, colour (hue, warmth,
   brightness), and on some a patch of moss; where a rock lies in front
   of another it casts a soft shadow on it. Drawn once on a canvas of
   their own over the koi (so a koi near the edge swims under them),
   again only when the screen or a rock setting changes. The pond's edge
   gets their outline (rockFloor): the koi turn away rkGap × their length
   above it (they never swim under the rocks), and waves break on it.
   ============================================================ */
var ROCK_N = 4;
var rockImg = [], rocksLoaded = 0;
for (var ri = 1; ri <= ROCK_N; ri++) {
  var im = new Image();
  im.onload = function () { rocksLoaded++; assetLoaded(); };
  im.src = BASE + 'koi-rocks/rock0' + ri + '.webp';
  rockImg.push(im);
}
function rockRng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
var MOSS = [[96, 112, 58], [122, 132, 70], [84, 98, 52], [140, 146, 84]];

// the layout: a list of rocks, the line of their tops, and where the
// cluster lies (the cells of a coarse grid that must be covered)
function layRocks(W, H) {
  var r = rockRng(V.rkSeed * 7919 + 3), band = V.rkHeight * H, list = [], last = -1;
  function make(cx, cy, scale) {
    var k = Math.floor(r() * ROCK_N); if (k === last) k = (k + 1 + Math.floor(r() * (ROCK_N - 1))) % ROCK_N; last = k;
    var im = rockImg[k], h = band * V.rkSize * scale * (1 + (r() * 2 - 1) * V.rkVary);
    var R = { k: k, im: im, cx: cx, cy: cy, h: h, w: h * im.width / im.height * Math.min(1, 1.45 / (im.width / im.height)),
      rot: (r() * 2 - 1) * V.rkTilt * Math.PI / 180, flip: r() < 0.5, sx: 1 + (r() * 2 - 1) * 0.12,
      hue: (r() * 2 - 1) * 8 * V.rkColour, sat: 1 + (r() * 2 - 1) * 0.2 * V.rkColour, bri: 1 + (r() * 2 - 1) * 0.12 * V.rkColour,
      warm: r() * V.rkColour, moss: r() < V.rkMoss, seed: Math.floor(r() * 1e9), z: r() };
    R.w *= R.sx; list.push(R); return R;
  }
  // first: a loose random scatter along the bottom
  var x = -band * 0.4;
  while (x < W + band * 0.4) {
    var R = make(x, H - band * (0.25 + r() * 0.45), 0.8 + r() * 0.4);
    x += R.w * (0.45 + r() * 0.4);
  }
  // then fill every hole inside the cluster, checked on a coarse grid
  var G = 6, gw = Math.ceil(W / G), gh = Math.ceil(H / G);
  var m = document.createElement('canvas'); m.width = gw; m.height = gh;
  var mx = m.getContext('2d', { willReadFrequently: true });
  function stamp(R) {
    mx.save(); mx.scale(1 / G, 1 / G); placeRock(mx, R); mx.drawImage(R.im, -R.w / 2, -R.h / 2, R.w, R.h); mx.restore();
  }
  list.forEach(stamp);
  var top = [], inside = null;
  for (var it = 0; it < 160; it++) {
    var a = mx.getImageData(0, 0, gw, gh).data;
    // each column's highest solid cell; the cluster is below the lower of the nearby tops
    for (var cx = 0; cx < gw; cx++) { top[cx] = gh; for (var cy = 0; cy < gh; cy++) if (a[(cy * gw + cx) * 4 + 3] > 230) { top[cx] = cy; break; } }
    var reach = Math.max(2, Math.round(band * 0.35 / G)), holes = [];
    inside = new Uint8Array(gw * gh);
    for (cx = 0; cx < gw; cx++) {
      var lim = top[cx];
      for (var d = -reach; d <= reach; d++) { var c2 = Math.min(gw - 1, Math.max(0, cx + d)); lim = Math.max(lim, top[c2]); }
      lim = Math.min(lim + 1, gh);
      for (cy = lim; cy < gh; cy++) { inside[cy * gw + cx] = 1; if (a[(cy * gw + cx) * 4 + 3] < 200) holes.push(cy * gw + cx); }
    }
    if (!holes.length) break;
    var hcell = holes[Math.floor(r() * holes.length)];
    var F = make(((hcell % gw) + 0.5) * G, (Math.floor(hcell / gw) + 0.5) * G, 0.55 + r() * 0.35);
    F.z = r() * 0.5;                 // a rock seen through a gap lies behind
    stamp(F);
  }
  // the line of the tops (for the koi): the mean height of the cluster
  var sum = 0; for (cx = 0; cx < gw; cx++) sum += H - top[cx] * G;
  // drawing order: higher on the screen = farther back
  list.sort(function (p, q) { return (p.cy + p.h * 0.5 + p.z * band * 0.3) - (q.cy + q.h * 0.5 + q.z * band * 0.3); });
  return { list: list, band: band, depth: sum / gw, inside: inside, G: G, gw: gw, gh: gh, top: top.slice() };
}
function placeRock(ctx, R) {
  ctx.translate(R.cx, R.cy); ctx.rotate(R.rot); if (R.flip) ctx.scale(-1, 1);
}
// one rock on a little picture of its own: its colour, and its moss
function rockPicture(R, dpr) {
  var c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(R.w * dpr)); c.height = Math.max(1, Math.ceil(R.h * dpr));
  var x = c.getContext('2d');
  x.imageSmoothingQuality = 'high';
  x.filter = 'hue-rotate(' + R.hue.toFixed(1) + 'deg) saturate(' + R.sat.toFixed(2) + ') brightness(' + R.bri.toFixed(2) + ')';
  x.drawImage(R.im, 0, 0, c.width, c.height);
  x.filter = 'none';
  x.globalCompositeOperation = 'source-atop';
  // a little warmth of its own (some rocks sunnier, some cooler)
  x.globalAlpha = 0.12 * R.warm; x.fillStyle = 'rgb(235, 170, 110)'; x.fillRect(0, 0, c.width, c.height);
  // moss in one to three patches on its upper part, in soft dabs
  if (R.moss) {
    var r = rockRng(R.seed), n = 1 + Math.floor(r() * 3);
    for (var p = 0; p < n; p++) {
      var px = c.width * (0.2 + r() * 0.6), py = c.height * (0.12 + r() * 0.3), pr = c.height * (0.08 + r() * 0.12);
      var col = MOSS[Math.floor(r() * MOSS.length)];
      // many small dabs, crisp in the middle (a soft blur reads as a smudge), a few lit tips
      for (var d = 0; d < 90; d++) {
        var aa = r() * Math.PI * 2, dd = Math.pow(r(), 0.7) * pr, rr = c.height * (0.006 + r() * 0.016);
        var bx = px + Math.cos(aa) * dd * 1.7, by = py + Math.sin(aa) * dd * 0.75;
        var k = 0.7 + r() * 0.45, lit = r() < 0.25;
        var cr = Math.round(col[0] * k + (lit ? 40 : 0)), cg = Math.round(col[1] * k + (lit ? 38 : 0)), cb = Math.round(col[2] * k + (lit ? 16 : 0));
        var al = (0.42 + r() * 0.3) * V.rkMossStrength * (1 - dd / pr * 0.5);
        var g = x.createRadialGradient(bx, by, 0, bx, by, rr);
        g.addColorStop(0, 'rgba(' + cr + ',' + cg + ',' + cb + ',' + Math.min(1, al).toFixed(2) + ')');
        g.addColorStop(0.6, 'rgba(' + cr + ',' + cg + ',' + cb + ',' + Math.min(1, al * 0.8).toFixed(2) + ')');
        g.addColorStop(1, 'rgba(' + cr + ',' + cg + ',' + cb + ',0)');
        x.globalAlpha = 1; x.fillStyle = g; x.fillRect(bx - rr, by - rr, rr * 2, rr * 2);
      }
    }
  }
  return c;
}
// yw: the rocks' top, column by column, a little smoothed (the waves
// break on it); y: the line the koi keep to: in each column the highest
// rock within a koi's reach either way, then smoothed (never lower than
// a rock top near it, so no part of a koi swims over a rock)
function rockFloor(L) {
  var G = L.G, n = L.top.length, raw = [], i, d;
  for (i = 0; i < n; i++) raw[i] = L.top[i] * G;
  var kl = (pond.info().length || 100) * (1 + V.sizeVary);
  function avg(src, rad) {
    var out = [], R = Math.max(1, Math.round(rad / G));
    for (i = 0; i < n; i++) { var s = 0, c = 0; for (d = -R; d <= R; d++) { var j = i + d; if (j >= 0 && j < n) { s += src[j]; c++; } } out[i] = s / c; }
    return out;
  }
  var mn = [], Rm = Math.max(1, Math.round(kl * 0.45 / G));
  for (i = 0; i < n; i++) { var m = raw[i]; for (d = -Rm; d <= Rm; d++) { var j2 = i + d; if (j2 >= 0 && j2 < n) m = Math.min(m, raw[j2]); } mn[i] = m; }
  return { g: G, y: avg(mn, kl * 0.3), yw: avg(raw, kl * 0.05), ys: avg(avg(raw, kl * 0.6), kl * 0.6) };
}
var rocksCv = null, shadeCv = null, rocksPlaced = false;
function drawRocksNow() {
  var W = innerWidth, H = innerHeight, dpr = Math.min(V.maxDpr || 2, window.devicePixelRatio || 1);
  rocksCv.width = Math.round(W * dpr); rocksCv.height = Math.round(H * dpr);
  var c = rocksCv.getContext('2d');
  c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, rocksCv.width, rocksCv.height);
  if (!V.rkShow || rocksLoaded < ROCK_N) { shadeCv.width = shadeCv.width; pond.set({ bottomIn: 0, floor: null }); return; }
  var L = layRocks(W, H);
  function sheet() { var s = document.createElement('canvas'); s.width = rocksCv.width; s.height = rocksCv.height; return s; }
  // the rocks, back to front, each casting a soft shadow on those behind it
  var lay = sheet(), lx = lay.getContext('2d');
  // the dark of the crevices, under every rock of the cluster
  var bed = document.createElement('canvas'); bed.width = L.gw; bed.height = L.gh;
  var bx = bed.getContext('2d'), bd = bx.createImageData(L.gw, L.gh);
  for (var i = 0; i < L.inside.length; i++) if (L.inside[i]) { bd.data[i * 4] = 58; bd.data[i * 4 + 1] = 46; bd.data[i * 4 + 2] = 38; bd.data[i * 4 + 3] = 255; }
  bx.putImageData(bd, 0, 0);
  lx.imageSmoothingEnabled = true;
  lx.filter = 'blur(' + (2 * dpr) + 'px)';
  lx.drawImage(bed, 0, 0, L.gw, L.gh, 0, 0, L.gw * L.G * dpr, L.gh * L.G * dpr);
  lx.filter = 'none';
  L.list.forEach(function (R) {
    var pic = rockPicture(R, dpr);
    if (V.rkDepth > 0) {
      var sh = document.createElement('canvas'); sh.width = pic.width; sh.height = pic.height;
      var sx = sh.getContext('2d'); sx.drawImage(pic, 0, 0);
      sx.globalCompositeOperation = 'source-in'; sx.fillStyle = 'rgb(40, 28, 20)'; sx.fillRect(0, 0, sh.width, sh.height);
      lx.save();
      lx.globalCompositeOperation = 'source-atop'; lx.globalAlpha = V.rkDepth;
      lx.filter = 'blur(' + (R.h * 0.06 * dpr).toFixed(1) + 'px)';
      lx.setTransform(dpr, 0, 0, dpr, R.h * 0.05 * dpr, R.h * 0.08 * dpr);
      placeRock(lx, R); lx.drawImage(sh, -R.w / 2, -R.h / 2, R.w, R.h);
      lx.restore();
    }
    lx.save(); lx.imageSmoothingQuality = 'high';
    lx.setTransform(dpr, 0, 0, dpr, 0, 0); placeRock(lx, R);
    lx.drawImage(pic, -R.w / 2, -R.h / 2, R.w, R.h);
    lx.restore();
  });
  // the whole edge warmed a little toward the water's cream
  if (V.rkTone > 0) {
    lx.save(); lx.globalCompositeOperation = 'source-atop'; lx.globalAlpha = V.rkTone;
    lx.fillStyle = 'rgb(240, 190, 140)'; lx.fillRect(0, 0, lay.width, lay.height); lx.restore();
  }
  // the shade the rocks cast on the water along their edge
  // (on a layer of its own under the koi and the waves, so the foam lies on it)
  var shc = shadeCv.getContext('2d');
  shadeCv.width = rocksCv.width; shadeCv.height = rocksCv.height;
  if (V.rkShade > 0) {
    var sc = sheet(), sx2 = sc.getContext('2d');
    sx2.drawImage(lay, 0, 0);
    sx2.globalCompositeOperation = 'source-in'; sx2.fillStyle = 'rgb(150, 70, 30)'; sx2.fillRect(0, 0, sc.width, sc.height);
    shc.save(); shc.filter = 'blur(' + (L.band * 0.1 * dpr).toFixed(1) + 'px)'; shc.globalAlpha = V.rkShade;
    shc.drawImage(sc, 0, -L.band * 0.05 * dpr); shc.restore();
  }
  c.drawImage(lay, 0, 0);
  // the rocks' outline for the pond: the koi keep away from it (they never
  // swim under the rocks) and the waves break on it
  pond.set({ bottomIn: 0, floor: rockFloor(L), floorGap: V.rkGap });
  // (the first time: the koi were placed before the rocks were there; place them again, clear of them)
  if (!rocksPlaced) { rocksPlaced = true; pond.reset(); }
}

/* ============================================================
   2. THE BAMBOO FOUNTAIN (koiscreen.html's 3c) (筧, kakei)
   The bamboo is the user's own drawing: the stalk they circled, drawn
   sharp from the vector data of their sheet and straightened
   (koi-bamboo/stalk.webp; how: tools/koi-bamboo/README.md). From the
   right edge the spout comes in over the water; it rests on two crossed
   bamboo poles lashed with black rope. Seen from straight above (see
   below). Where the water lands it foams and splashes and sends rings
   out over the water. The koi keep out of the
   spot where it lands and the pellets are pushed away from it.
   The bamboo is drawn once (#fountain, under the rocks); the water each
   frame (#fnFx, over all).
   ============================================================ */
var FN_IMG = new Image(), fnLoaded = false;
FN_IMG.onload = function () { fnLoaded = true; assetLoaded(); };
FN_IMG.src = BASE + 'koi-bamboo/stalk.webp';
// where the nodes are along the picture (share of its length, from the top)
var FN_NODES = [0.165, 0.418, 0.675, 0.923], FN_X0 = 18 / 216, FN_X1 = 210 / 216;
var fnCv = null, fxCv = null;
var FN = null;            // the fountain's geometry, worked out from the screen and the settings
var FN_WATERLINE = 0.45;  // how far from the crossing to its foot each pole goes into the water

// Everything seen from straight above, as the rest of the pond: the spout
// lies flat over the water, its slanting notch an oval opening on its top
// near the end; the two poles of the stand lean out sideways, so from above
// they show short, crossing under the spout, their open tops nearest you
// and their feet going down into the water; the water drops away from you,
// so the stream is a short tongue past the lip and the splash bursts out
// round where it lands; the bamboo throws a soft shadow on the water.
function fnGeometry() {
  var W = innerWidth, H = innerHeight;
  var u = 0.045 * H * V.fnSize;                          // the spout's thickness
  var a = V.fnTurn * Math.PI / 180;
  var ex = { x: Math.cos(a), y: -Math.sin(a) };          // along the spout, from its mouth back to the edge
  var ey = { x: -ex.y, y: ex.x };                        // across it
  var E = { x: W * (1 - V.fnReach), y: H * V.fnY };       // the spout's tip
  var len = (W - E.x) / Math.max(0.2, Math.cos(a)) + u * 1.5;
  var P = function (lx, ly) { return { x: E.x + ex.x * lx + ey.x * ly, y: E.y + ex.y * lx + ey.y * ly }; };
  var lip = P(u * 0.08, 0);                               // the water runs out over the tip
  var land = P(-u * V.fnThrow * (0.45 + 0.55 * V.fnFlow), 0);                        // and falls a little way out beyond it
  var cross = P(len * 0.42 + u * 0.4, 0);                 // where the poles cross, right under the spout
  return { W: W, H: H, u: u, a: a, ex: ex, ey: ey, E: E, len: len, P: P, lip: lip, land: land, cross: cross };
}

// a length of the bamboo picture laid from p0 to p1 at the given thickness
// (s0, s1: the stretch of the picture used, share of its length from the top)
function fnPole(ctx, p0, p1, w, s0, s1) {
  var dx = p1.x - p0.x, dy = p1.y - p0.y, l = Math.hypot(dx, dy);
  var iw = FN_IMG.width, ih = FN_IMG.height, cw = (FN_X1 - FN_X0) * iw;
  ctx.save();
  ctx.translate(p0.x, p0.y); ctx.rotate(Math.atan2(dy, dx) - Math.PI / 2);
  ctx.drawImage(FN_IMG, FN_X0 * iw, s0 * ih, cw, (s1 - s0) * ih, -w / 2, 0, w, l);
  ctx.restore();
}
// a cut open end seen from above: the ring of pale fresh wood and the dark hollow
function fnOpenEnd(ctx, c, ang, rx, ry, deep) {
  ctx.save();
  ctx.translate(c.x, c.y); ctx.rotate(ang);
  var g = ctx.createLinearGradient(-rx, -ry, rx, ry);
  g.addColorStop(0, '#F5E9BE'); g.addColorStop(0.55, '#E4CF90'); g.addColorStop(1, '#C9AE68');
  ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
  ctx.lineWidth = Math.max(0.7, Math.min(rx, ry) * 0.08); ctx.strokeStyle = 'rgba(120, 86, 30, 0.5)'; ctx.stroke();
  var h = ctx.createRadialGradient(rx * (deep || 0), 0, 0, 0, 0, Math.max(rx, ry) * 0.85);
  h.addColorStop(0, '#1E150A'); h.addColorStop(0.65, '#3E2C10'); h.addColorStop(1, '#6E521E');
  ctx.beginPath(); ctx.ellipse(0, 0, rx * 0.8, ry * 0.76, 0, 0, Math.PI * 2); ctx.fillStyle = h; ctx.fill();
  ctx.restore();
}
// black rope seen from above: turns round the spout where it lies on the
// crossing, and the cord crossing over the poles on either side of it
function fnRope(ctx, G, along, legs) {
  var u = G.u, r = u * 0.06;
  ctx.save(); ctx.lineCap = 'round';
  function cord(path, w) {
    ctx.beginPath(); path(); ctx.lineWidth = w; ctx.strokeStyle = '#141210'; ctx.stroke();
    ctx.save(); ctx.translate(-w * 0.2, -w * 0.2);
    ctx.beginPath(); path(); ctx.lineWidth = w * 0.3; ctx.strokeStyle = 'rgba(150, 140, 125, 0.5)'; ctx.stroke();
    ctx.restore();
  }
  for (var k = -1.5; k <= 1.5; k += 1) {
    var lx = along + k * r * 2.3;
    var a0 = G.P(lx, -u * 0.53), a1 = G.P(lx + r * 0.5, u * 0.53), mid = G.P(lx - r * 0.6, 0);
    cord(function () { ctx.moveTo(a0.x, a0.y); ctx.quadraticCurveTo(mid.x, mid.y, a1.x, a1.y); }, r * 2);
  }
  // the cord over each pole just outside the spout, crossing in an X
  legs.forEach(function (Lg) {
    for (var j = -1; j <= 1; j += 2) {
      var p0 = G.P(along + j * r * 3, -Lg.sd * u * 0.5), p1 = G.P(along - j * u * 0.12, -Lg.sd * u * 0.78);
      cord(function () { ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); }, r * 1.6);
    }
  });
  // the knot and two short ends lying on the spout
  var kn = G.P(along + u * 0.05, -u * 0.08);
  ctx.beginPath(); ctx.ellipse(kn.x, kn.y, r * 2, r * 1.6, G.a, 0, Math.PI * 2); ctx.fillStyle = '#141210'; ctx.fill();
  var e1 = G.P(along + u * 0.42, -u * 0.22), e2 = G.P(along + u * 0.36, u * 0.12);
  cord(function () { ctx.moveTo(kn.x, kn.y); ctx.quadraticCurveTo((kn.x + e1.x) / 2, (kn.y + e1.y) / 2 - r * 2, e1.x, e1.y); }, r * 1.4);
  cord(function () { ctx.moveTo(kn.x, kn.y); ctx.quadraticCurveTo((kn.x + e2.x) / 2, (kn.y + e2.y) / 2 + r * 2, e2.x, e2.y); }, r * 1.4);
  ctx.restore();
}

// the bamboo's pieces, in drawing order (the lower parts first), each a
// function drawing it onto ctx; used for the shadow as well
function fnPieces(G) {
  var u = G.u, out = [], pw = u * 0.62, along = (G.cross.x - G.E.x) * G.ex.x + (G.cross.y - G.E.y) * G.ex.y;
  var legs = [];
  if (V.fnStand) {
    // each pole leans out to one side: from above, its foot shows a way out on
    // that side (down in the water) and its top a little out on the other
    [[-1, 0.3, 0.98, 0.3], [1, 0.12, 0.8, -0.3]].forEach(function (Lg) {
      var sd = Lg[0], skew = Lg[3];
      var foot = G.P(along + skew * u * 3.5, sd * u * 3.8), top = G.P(along - skew * u * 0.55, -sd * u * 0.95);
      legs.push({ foot: foot, top: top, s0: Lg[1], s1: Lg[2], sd: sd });
    });
    legs.forEach(function (Lg) {
      out.push({ kind: 'leg', draw: function (c) { fnPole(c, Lg.top, Lg.foot, pw, Lg.s0, Lg.s1); } , leg: Lg });
    });
  }
  out.push({ kind: 'spout', draw: function (c) {
    var nl = V.fnNotch * u, back = G.P(G.len, 0);
    var sEnd = 0.79, sLen = G.len / u * (FN_X1 - FN_X0) * FN_IMG.width / FN_IMG.height, s0 = Math.max(0, sEnd - sLen);
    c.save();
    // the end, seen from above: rounded off where the notch is cut, the lower
    // half of the pipe reaching out to the tip
    c.beginPath();
    for (var i = 0; i <= 24; i++) {
      var th = -Math.PI / 2 + Math.PI * i / 24, pt = G.P(nl - nl * Math.cos(th), u / 2 * Math.sin(th));
      if (i) c.lineTo(pt.x, pt.y); else c.moveTo(pt.x, pt.y);
    }
    var qb = G.P(G.len + u, u / 2), qa = G.P(G.len + u, -u / 2);
    c.lineTo(qb.x, qb.y); c.lineTo(qa.x, qa.y); c.closePath();
    c.clip();
    fnPole(c, back, G.P(0, 0), u, s0, sEnd);
    c.restore();
  } });
  if (V.fnStand) {
    // the poles' tops stand up past the spout (nearer you): their short upper part and the open top
    legs.forEach(function (Lg) {
      out.push({ kind: 'top', draw: function (c) {
        var mid = { x: (Lg.top.x + G.cross.x) / 2, y: (Lg.top.y + G.cross.y) / 2 };
        var tl = Math.hypot(Lg.top.x - G.cross.x, Lg.top.y - G.cross.y), d = { x: (Lg.top.x - G.cross.x) / tl, y: (Lg.top.y - G.cross.y) / tl };
        var from = { x: Lg.top.x - d.x * u * 0.55, y: Lg.top.y - d.y * u * 0.55 };
        fnPole(c, from, Lg.top, pw * 1.04, Lg.s0, Lg.s0 + 0.03);
        fnOpenEnd(c, Lg.top, Math.atan2(d.y, d.x), pw * 0.52, pw * 0.5, 0);
      } });
    });
  }
  return { list: out, legs: legs, along: along };
}

function drawFountain() {
  var dpr = Math.min(V.maxDpr || 2, window.devicePixelRatio || 1);
  fnCv.width = Math.round(innerWidth * dpr); fnCv.height = Math.round(innerHeight * dpr);
  fxCv.width = fnCv.width; fxCv.height = fnCv.height;
  var c = fnCv.getContext('2d');
  c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, innerWidth, innerHeight);
  if (!V.fnShow || !fnLoaded) { FN = null; pond.set({ fountain: null, hide: null, posts: [] }); return; }
  FN = fnGeometry();
  var G = FN, u = G.u, PC = fnPieces(G);
  c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
  // its shadow on the water: the whole bamboo's outline, soft, thrown down-right as the koi's are
  if (V.fnShadow > 0) {
    var sc = document.createElement('canvas'); sc.width = fnCv.width; sc.height = fnCv.height;
    var sx = sc.getContext('2d'); sx.setTransform(dpr, 0, 0, dpr, 0, 0);
    PC.list.forEach(function (p) { if (p.kind !== 'leg') p.draw(sx); });
    sx.setTransform(1, 0, 0, 1, 0, 0); sx.globalCompositeOperation = 'source-in';
    sx.fillStyle = 'rgb(176, 72, 22)'; sx.fillRect(0, 0, sc.width, sc.height);
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
    c.filter = 'blur(' + (u * 0.22 * dpr).toFixed(1) + 'px)'; c.globalAlpha = 0.3 * V.fnShadow;
    c.drawImage(sc, u * 0.45 * dpr, u * 0.8 * dpr); c.restore();
  }
  // where the poles stand in the water: a mask the pond cuts the koi out of, so no
  // part of a koi shows through a pole's underwater part (it fades toward its foot)
  var hide = document.createElement('canvas'); hide.width = fnCv.width; hide.height = fnCv.height;
  var hx = hide.getContext('2d');
  PC.list.forEach(function (p) {
    if (p.kind === 'leg') {
      // the pole goes down into the water: drawn on a picture of its own, the
      // water's colour laid over it below the waterline, deeper and deeper, and
      // it fades out to nothing long before its foot (no end to be seen), the
      // fading edge a little uneven
      var Lg = p.leg, tc = document.createElement('canvas'); tc.width = fnCv.width; tc.height = fnCv.height;
      var tx = tc.getContext('2d'); tx.setTransform(dpr, 0, 0, dpr, 0, 0); tx.imageSmoothingQuality = 'high';
      p.draw(tx);
      // the mask: the pole's own outline, solid wherever any of the pole shows,
      // fading only where the pole itself has faded to nothing
      var mc = document.createElement('canvas'); mc.width = fnCv.width; mc.height = fnCv.height;
      var mx = mc.getContext('2d'); mx.drawImage(tc, 0, 0);
      var mg = mx.createLinearGradient(G.cross.x * dpr, G.cross.y * dpr, Lg.foot.x * dpr, Lg.foot.y * dpr);
      mg.addColorStop(0, 'rgba(0, 0, 0, 1)'); mg.addColorStop(0.72, 'rgba(0, 0, 0, 1)'); mg.addColorStop(0.8, 'rgba(0, 0, 0, 0)'); mg.addColorStop(1, 'rgba(0, 0, 0, 0)');
      mx.globalCompositeOperation = 'destination-in'; mx.fillStyle = mg; mx.fillRect(0, 0, mc.width, mc.height);
      hx.drawImage(mc, 0, 0);
      var g = tx.createLinearGradient(G.cross.x, G.cross.y, Lg.foot.x, Lg.foot.y), wl = FN_WATERLINE;
      g.addColorStop(0, 'rgba(253, 238, 225, 0)'); g.addColorStop(wl - 0.01, 'rgba(253, 238, 225, 0.04)');
      g.addColorStop(wl + 0.04, 'rgba(252, 236, 222, 0.38)'); g.addColorStop(0.75, 'rgba(250, 232, 218, 0.7)'); g.addColorStop(1, 'rgba(250, 232, 218, 0.9)');
      tx.save(); tx.globalCompositeOperation = 'source-atop'; tx.fillStyle = g; tx.fillRect(0, 0, innerWidth, innerHeight); tx.restore();
      var fg = tx.createLinearGradient(G.cross.x, G.cross.y, Lg.foot.x, Lg.foot.y);
      fg.addColorStop(0, 'rgba(0, 0, 0, 1)'); fg.addColorStop(wl + 0.03, 'rgba(0, 0, 0, 1)');
      fg.addColorStop(wl + 0.2, 'rgba(0, 0, 0, 0.55)'); fg.addColorStop(0.62, 'rgba(0, 0, 0, 0.22)'); fg.addColorStop(0.78, 'rgba(0, 0, 0, 0)'); fg.addColorStop(1, 'rgba(0, 0, 0, 0)');
      tx.save(); tx.globalCompositeOperation = 'destination-in'; tx.fillStyle = fg; tx.fillRect(0, 0, innerWidth, innerHeight); tx.restore();
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(tc, 0, 0); c.restore();
    } else p.draw(c);
  });
  // the notch: an oval opening on the spout's top, the cut face round it, the hollow deep at its back end
  var nl = V.fnNotch * u, oc = G.P(nl * 0.6, 0);
  fnOpenEnd(c, oc, G.a + Math.PI, nl * 0.6, u * 0.43, -0.45);
  // (the water in it is drawn each frame with the stream, as one body: fnFrame)
  // the rope round the spout and the crossing
  if (V.fnStand) fnRope(c, G, PC.along, PC.legs);
  // the koi keep out of where the water lands
  // where each pole goes into the water (its waves are drawn each frame)
  G.legs = PC.legs.map(function (Lg) {
    var dx = Lg.foot.x - G.cross.x, dy = Lg.foot.y - G.cross.y, l = Math.hypot(dx, dy);
    return { x: G.cross.x + dx * FN_WATERLINE, y: G.cross.y + dy * FN_WATERLINE, d: { x: dx / l, y: dy / l }, w: u * 0.62, seed: Lg.sd };
  });
  // the poles stand in the water: the koi swim round them (each pole kept
  // clear by half its thickness and fnPostGap × the koi's length), never through
  var KL = pond.info().length || 100;
  var posts = V.fnStand ? PC.legs.map(function (Lg) { return { x0: Lg.top.x, y0: Lg.top.y, x1: Lg.foot.x, y1: Lg.foot.y, r: u * 0.31 + KL * V.fnPostGap, w: u * 0.31 }; }) : [];
  pond.set({ fountain: { x: G.land.x, y: G.land.y, r: KL * V.fnAvoid }, hide: V.fnStand ? hide : null, posts: posts });
}

// ---- the water, each frame (seen from above) ----
var fnDrops = [], fnLast = 0, fnRingT = 0;
function fnFrame(now) {
  var dt = Math.min(0.05, fnLast ? (now - fnLast) / 1000 : 0); fnLast = now;
  var c = fxCv.getContext('2d'), dpr = fxCv.width / innerWidth;
  c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, fxCv.width, fxCv.height);
  if (!FN || !V.fnShow) return;
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  var G = FN, u = G.u, t = now / 1000, M = G.lip, Lp = G.land, flow = V.fnFlow;
  var out = { x: -G.ex.x, y: -G.ex.y }, nrm = { x: G.ey.x, y: G.ey.y };
  var dist = Math.hypot(Lp.x - M.x, Lp.y - M.y);
  // the water: ONE body, from the back of the hollow down the notch, over the tip and
  // out to where it plunges. One width all along (it follows the flow's strength but is
  // never wider than the hollow it comes from); in the hollow it narrows to the hollow's
  // own round back; past the tip it narrows a little as it falls away from you.
  var nl = V.fnNotch * u, hc = nl * 0.6, hrx = nl * 0.48, hry = u * 0.43 * 0.76;
  var w0 = Math.min(hry * 0.88, u * (0.07 + 0.07 * flow));
  var lip0 = u * 0.08, back = hc + hrx * 0.94;
  var Ni = 8, N = 16, pts = [];
  for (var i = 0; i <= Ni; i++) {                       // in the hollow, back to the tip
    var lx = back + (lip0 - back) * (i / Ni), w = w0;
    if (lx > hc) { var e = (lx - hc) / hrx; w = Math.min(w0, hry * 0.9 * Math.sqrt(Math.max(0, 1 - e * e))); }
    var P0 = G.P(lx, 0); pts.push({ x: P0.x, y: P0.y, w: Math.max(0.3, w) });
  }
  for (i = 1; i <= N; i++) {                            // out over the tip to the water
    var s = i / N, ws = w0 * (1 - 0.4 * s) + 0.3;
    var wob = Math.sin(t * 8 + s * 9) * ws * 0.18 * s;
    pts.push({ x: M.x + out.x * dist * s + nrm.x * wob, y: M.y + out.y * dist * s + nrm.y * wob, w: ws });
  }
  var NT = pts.length - 1, Bk = pts[0], fi = Ni / NT;
  c.save();
  c.beginPath();
  pts.forEach(function (p, k) { var X = p.x + nrm.x * p.w, Y = p.y + nrm.y * p.w; if (k) c.lineTo(X, Y); else c.moveTo(X, Y); });
  for (i = NT; i >= 0; i--) { var p = pts[i]; c.lineTo(p.x - nrm.x * p.w, p.y - nrm.y * p.w); }
  c.closePath();
  var sg = c.createLinearGradient(Bk.x, Bk.y, Lp.x, Lp.y);
  sg.addColorStop(0, 'rgba(200, 220, 228, 0)'); sg.addColorStop(fi * 0.45, 'rgba(210, 228, 236, 0.5)');
  sg.addColorStop(fi, 'rgba(228, 242, 250, 0.8)'); sg.addColorStop(1, 'rgba(240, 248, 252, 0.95)');
  c.fillStyle = sg; c.fill();
  c.lineWidth = 0.8; c.strokeStyle = 'rgba(150, 100, 60, 0.25)'; c.stroke();
  c.lineCap = 'round';
  for (var k = 0; k < 5; k++) {
    var off = (k / 4 - 0.5) * 1.2, ph = (t * 1.8 * (0.5 + 0.5 * V.fnSpeed) * (0.85 + k * 0.08) + k * 0.31) % 1;
    var a0 = Math.min(NT, Math.floor(ph * NT)), a1 = Math.min(NT, a0 + 4);
    c.beginPath();
    for (var j = a0; j <= a1; j++) { var q = pts[j], X2 = q.x + nrm.x * q.w * off, Y2 = q.y + nrm.y * q.w * off; if (j === a0) c.moveTo(X2, Y2); else c.lineTo(X2, Y2); }
    c.lineWidth = 1; c.strokeStyle = 'rgba(255, 255, 255, ' + (a0 < Ni ? 0.45 : 0.75) + ')'; c.stroke();
  }
  // where it plunges: a white boil of foam, bubbles circling out round it
  var fr = u * 0.5 * (0.6 + 0.4 * flow) * (0.5 + 0.5 * V.fnFoam), foam = V.fnFoam;
  var g = c.createRadialGradient(Lp.x, Lp.y, 0, Lp.x, Lp.y, fr * 1.5);
  g.addColorStop(0, 'rgba(255, 255, 255, ' + Math.min(1, 0.85 * foam).toFixed(3) + ')'); g.addColorStop(0.5, 'rgba(255, 255, 255, ' + Math.min(1, 0.4 * foam).toFixed(3) + ')'); g.addColorStop(1, 'rgba(255, 255, 255, 0)');
  c.fillStyle = g; c.beginPath(); c.arc(Lp.x, Lp.y, fr * 1.5, 0, Math.PI * 2); c.fill();
  for (k = 0; k < Math.round(16 * foam); k++) {
    var life = (t * 0.45 + k * 0.618) % 1;                       // each bubble drifts out and pops
    var ba = k * 2.39996 + Math.sin(t * 0.7 + k) * 0.3, br = fr * (0.4 + 1.4 * life);
    var bx = Lp.x + Math.cos(ba) * br, by = Lp.y + Math.sin(ba) * br, rr = u * (0.018 + 0.03 * ((k * 0.37) % 1));
    c.beginPath(); c.arc(bx, by, rr, 0, Math.PI * 2);
    c.lineWidth = 0.9; c.strokeStyle = 'rgba(255, 255, 255, ' + (0.85 * (1 - life)).toFixed(3) + ')'; c.stroke();
    c.strokeStyle = 'rgba(160, 100, 60, ' + (0.2 * (1 - life)).toFixed(3) + ')'; c.beginPath(); c.arc(bx + 0.4, by + 0.6, rr, 0.2, 2.6); c.stroke();
  }
  // the splash: drops thrown out every way round where it lands (seen from above they fly
  // out over the water, a little larger and with their shadow further off while high)
  var rate = 46 * V.fnSplash * flow, nn = Math.floor(rate * dt + Math.random());
  for (k = 0; k < nn && fnDrops.length < 140; k++) {
    var sa = Math.random() * Math.PI * 2, sp = u * (0.5 + Math.random() * 1.5) * (0.6 + 0.4 * V.fnSpeed);
    fnDrops.push({ x: Lp.x + Math.cos(sa) * fr * 0.3, y: Lp.y + Math.sin(sa) * fr * 0.3, vx: Math.cos(sa) * sp, vy: Math.sin(sa) * sp,
                   h: 0, vh: u * (1.5 + Math.random() * 2), r: u * (0.02 + Math.random() * 0.035) });
  }
  for (i = fnDrops.length - 1; i >= 0; i--) {
    var dr = fnDrops[i];
    dr.x += dr.vx * dt; dr.y += dr.vy * dt; dr.vh -= u * 16 * dt; dr.h += dr.vh * dt;
    if (dr.h <= 0 && dr.vh < 0) {
      fnDrops.splice(i, 1);
      if (Math.random() < 0.35 && V.fnRipple > 0) pond.pond.rings.push({ x: dr.x - pond.pond.hw, y: dr.y - pond.pond.hh, t: 0.7, L: pond.pond.L * 0.22 });
      continue;
    }
    var up = dr.h / u;
    c.beginPath(); c.arc(dr.x + dr.h * 0.35, dr.y + dr.h * 0.6, dr.r * 0.9, 0, Math.PI * 2); c.fillStyle = 'rgba(176, 72, 22, 0.12)'; c.fill();
    c.beginPath(); c.arc(dr.x, dr.y, dr.r * (1 + up * 0.25), 0, Math.PI * 2); c.fillStyle = 'rgba(255, 255, 255, 0.95)'; c.fill();
  }
  c.restore();
  // where each pole of the stand goes into the water: the water heaps against
  // it and runs round it in a wavy line, and little waves spread out from it
  if (V.fnStand && G.legs && V.fnLegWaves > 0) {
    var lw = V.fnLegWaves;
    G.legs.forEach(function (W) {
      var ang = Math.atan2(W.d.y, W.d.x), rA = W.w * 0.62, rB = W.w * 0.5;   // the pole cut by the water: an ellipse along it
      c.save(); c.translate(W.x, W.y); c.rotate(ang);
      // (local: x along the pole toward its foot, under the water; x < 0 is the dry part
      // above the water, which nothing of the water may be drawn over)
      c.save();
      c.beginPath(); c.rect(-W.w * 40, -W.w * 40, W.w * 80, W.w * 80); c.rect(-W.w * 6, -W.w * 0.52, W.w * 6, W.w * 1.04);
      c.clip('evenodd');
      // spreading wavelets, each a little wavy, fading as it grows (over the water and the pole under it)
      for (var q = 0; q < 3; q++) {
        var ph = (t * 0.55 + q / 3 + W.seed * 0.17) % 1, gr = 1 + ph * 2.2;
        c.beginPath();
        for (var m = 0; m <= 40; m++) {
          var th = m / 40 * Math.PI * 2, wv = 1 + 0.045 * Math.sin(th * 5 + t * 3 + q) + 0.03 * Math.sin(th * 3 - t * 2);
          var X = Math.cos(th) * rA * gr * wv, Y = Math.sin(th) * rB * gr * wv;
          if (m) c.lineTo(X, Y); else c.moveTo(X, Y);
        }
        c.lineWidth = Math.max(0.6, W.w * 0.06 * (1 - ph));
        c.strokeStyle = 'rgba(186, 88, 36, ' + (0.16 * (1 - ph) * lw).toFixed(3) + ')'; c.stroke();
        c.save(); c.translate(-0.6, -0.8);
        c.strokeStyle = 'rgba(255, 255, 255, ' + Math.min(1, 0.75 * (1 - ph) * lw).toFixed(3) + ')'; c.stroke();
        c.restore();
      }
      // the water heaped against each side of the pole: a small bright wavy bulge
      [-1, 1].forEach(function (sd) {
        // (in short pieces, each as bright as the bulge is high there, so it fades at both ends)
        var prev = null;
        c.lineCap = 'round';
        for (var m2 = 0; m2 <= 18; m2++) {
          var s2 = m2 / 18, xx = s2 * W.w * 0.9;
          var hgt = Math.sin(Math.PI * s2) * (1 + 0.3 * Math.sin(t * 5 + s2 * 6 + sd));
          var yy = sd * (W.w * 0.5 + W.w * 0.11 * hgt);
          if (prev) {
            c.beginPath(); c.moveTo(prev.x, prev.y); c.lineTo(xx, yy);
            c.lineWidth = Math.max(0.8, W.w * 0.06); c.strokeStyle = 'rgba(255, 255, 255, ' + Math.min(1, 0.8 * lw * Math.max(0, hgt)).toFixed(3) + ')'; c.stroke();
          }
          prev = { x: xx, y: yy };
        }
      });
      // a few flecks of foam caught round it
      for (m = 0; m < 7; m++) {
        var fa = m * 0.9 - 1.5 + Math.sin(t * 1.7 + m) * 0.35, fd = 1.15 + 0.15 * Math.sin(t * 2.3 + m * 2);
        c.beginPath(); c.arc(Math.cos(fa) * rA * fd, Math.sin(fa) * rB * fd, Math.max(0.6, W.w * 0.035), 0, Math.PI * 2);
        c.fillStyle = 'rgba(255, 255, 255, ' + Math.min(1, 0.85 * lw).toFixed(3) + ')'; c.fill();
      }
      c.restore();
      // the waterline across the pole: wavy, bright, with the water's shade just under it
      c.beginPath();
      for (m = 0; m <= 20; m++) {
        var s3 = m / 20, yy3 = (s3 - 0.5) * W.w * 1.08;
        var xx3 = W.w * 0.1 * Math.cos(Math.PI * (s3 - 0.5)) + W.w * 0.04 * Math.sin(t * 5 + s3 * 9);
        if (m) c.lineTo(xx3, yy3); else c.moveTo(xx3, yy3);
      }
      c.lineWidth = Math.max(1, W.w * 0.09); c.strokeStyle = 'rgba(255, 255, 255, ' + Math.min(1, 0.85 * lw).toFixed(3) + ')'; c.stroke();
      c.save(); c.translate(W.w * 0.07, 0);
      c.lineWidth = Math.max(0.8, W.w * 0.07); c.strokeStyle = 'rgba(186, 88, 36, ' + (0.22 * lw).toFixed(3) + ')'; c.stroke();
      c.restore();
      c.restore();
    });
  }
  // rings spreading over the pond from where it lands
  if (V.fnRipple > 0) {
    fnRingT -= dt;
    if (fnRingT <= 0) {
      fnRingT = (0.16 + Math.random() * 0.14) / (V.fnRipple * (0.5 + 0.5 * V.fnSpeed));
      var P0 = pond.pond;
      if (P0.rings.length < 70) P0.rings.push({ x: Lp.x - P0.hw + (Math.random() - 0.5) * fr, y: Lp.y - P0.hh + (Math.random() - 0.5) * fr, t: 0, L: P0.L * (0.7 + Math.random() * 0.6) });
    }
  }
}

/* ============================================================
   3. THE FOUNTAIN'S SOUND (as koiscreen.html's section 3d: the same
   seamless loop and level, played on the app's audio context)
   ============================================================ */
var FN_SOUND_URL = BASE + 'Sound/fountain01.mp3';
var FN_SOUND_GAIN = 6.1;            // about +15.7 dB: -48 LUFS -> about -32 LUFS at volume 1
var fnAC = null, fnGain = null, fnSrc = null, fnBuf = null, fnLoading = false;
function fnLoopBuffer(ac, b) {
  var sr = b.sampleRate, edge = Math.round(0.06 * sr), X = Math.round(2 * sr);
  var n = b.length - 2 * edge, L = n - X;
  var out = ac.createBuffer(b.numberOfChannels, L, sr);
  for (var ch = 0; ch < b.numberOfChannels; ch++) {
    var a = b.getChannelData(ch), o = out.getChannelData(ch), i;
    for (i = 0; i < L; i++) o[i] = a[edge + i];
    for (i = 0; i < X; i++) {
      var t = i / X;
      o[i] = a[edge + i] * Math.sin(t * Math.PI / 2) + a[edge + L + i] * Math.cos(t * Math.PI / 2);
    }
  }
  return out;
}
function audioCtx() { try { return OPT.audio ? OPT.audio() : null; } catch (e) { return null; } }
// the recording fetched and made into its loop ahead (while the messages show)
function fnSoundLoad() {
  var ac = audioCtx();
  if (!ac || fnBuf || fnLoading) return;
  fnLoading = true;
  fetch(FN_SOUND_URL).then(function (r) { return r.arrayBuffer(); })
    .then(function (ab) { return new Promise(function (ok, bad) { ac.decodeAudioData(ab, ok, bad); }); })
    .then(function (b) { fnBuf = fnLoopBuffer(ac, b); fnLoading = false; if (active && phase === 'live') fnSoundOn(); })
    .catch(function (e) { fnLoading = false; console.warn('fountain sound:', e); });
}
function fnSoundOn() {
  var ac = audioCtx();
  if (!ac || !V.fnShow || !(V.fnSound > 0)) return;
  if (!fnBuf) { fnSoundLoad(); return; }
  if (ac.state === 'suspended') { try { ac.resume(); } catch (e) {} }
  if (fnSrc) return;
  fnAC = ac;
  fnGain = ac.createGain(); fnGain.gain.value = 0; fnGain.connect(ac.destination);
  fnSrc = ac.createBufferSource(); fnSrc.buffer = fnBuf; fnSrc.loop = true;
  fnSrc.connect(fnGain); fnSrc.start();
  var now = ac.currentTime;
  fnGain.gain.setValueAtTime(0, now);
  fnGain.gain.linearRampToValueAtTime(FN_SOUND_GAIN * V.fnSound, now + Math.max(0.05, V.soundFade === undefined ? 2 : V.soundFade));     // fades in over soundFade s
}
function fnSoundOff() {
  if (!fnSrc) return;
  var src = fnSrc, g = fnGain, now = fnAC.currentTime;
  fnSrc = null; fnGain = null;
  try {
    g.gain.cancelScheduledValues(now); g.gain.setValueAtTime(g.gain.value, now);
    g.gain.linearRampToValueAtTime(0, now + 0.8);
    src.stop(now + 0.85);
  } catch (e) {}
  setTimeout(function () { try { src.disconnect(); g.disconnect(); } catch (e) {} }, 1200);
}

/* ============================================================
   4. THE PAGE
   ============================================================ */
function canvas(cls) {
  var c = document.createElement('canvas'); c.className = 'koi-cv ' + cls; c.setAttribute('aria-hidden', 'true');
  root.appendChild(c); return c;
}
function init(el, values, opt) {
  root = el; OPT = opt || {};
  V = JSON.parse(JSON.stringify(values));
  // in the test bed's order, bottom to top: the rocks' shade on the water,
  // the koi, the bamboo, the rocks, the fountain's water
  CV.shade = canvas('koi-shade'); CV.pond = canvas('koi-pond'); CV.fountain = canvas('koi-fountain');
  CV.rocks = canvas('koi-rocks'); CV.fx = canvas('koi-fx');
  shadeCv = CV.shade; rocksCv = CV.rocks; fnCv = CV.fountain; fxCv = CV.fx;
  // tap the water: food (only once the koi are in)
  root.addEventListener('pointerdown', function (e) {
    if (!active || phase !== 'live' || !pond) return;
    e.preventDefault();
    pond.feed(e.clientX, e.clientY);
  });
  window.addEventListener('resize', function () {
    if (!made || !rocksCv) return;
    var dpr = dprNow();
    if (rocksCv.width === Math.round(innerWidth * dpr) && rocksCv.height === Math.round(innerHeight * dpr)) return;
    ready = false; draw();
    if (active && phase !== 'ink') showAll();
  });
}
/* Made ahead, while the messages show, a piece at a time: the koi (their
   warm-up), the pictures loaded, the rocks and the fountain drawn, the
   ink's graphics context, the sound. Nothing shows yet. */
function prepare() {
  if (!root || made) { fnSoundLoad(); return; }
  made = true;
  setTimeout(function () {
    pond = KoiScreen.create(CV.pond, koiSettings());
    setTimeout(function () { if (rocksLoaded === ROCK_N && fnLoaded) draw(); }, 120);
  }, 0);
  setTimeout(function () { if (typeof InkFluid !== 'undefined' && OPT.look && OPT.look.engine === 'gpu') InkFluid.init(); }, 400);
  fnSoundLoad();
}
// the rocks and the fountain drawn, then cut into pictures of their own (kept
// for the ink), the page's canvases left empty
function draw() {
  if (!pond || !rocksCv) return;
  drawRocksNow();
  drawFountain();
  var dpr = dprNow(), W = innerWidth, H = innerHeight;
  var band = V.rkHeight * H;
  PIC.rocksR = devRect(0, Math.max(0, H - band * 2.4), W, H, dpr);
  PIC.rocks = crop(rocksCv, PIC.rocksR); PIC.shade = crop(shadeCv, PIC.rocksR);
  PIC.fnR = null; PIC.fountain = null;
  if (FN) {
    var u = FN.u, xs = [FN.E.x, FN.land.x, FN.cross.x], ys = [FN.E.y, FN.land.y, FN.cross.y];
    (FN.legs || []).forEach(function (Lw) { xs.push(Lw.x); ys.push(Lw.y); });
    var x0 = Math.min.apply(null, xs) - u * 4.5, y0 = Math.min.apply(null, ys) - u * 4.5, y1 = Math.max.apply(null, ys) + u * 5;
    PIC.fnR = devRect(x0, y0, W, y1, dpr);
    PIC.fountain = crop(fnCv, PIC.fnR);
  }
  [rocksCv, shadeCv, fnCv].forEach(function (c) { c.getContext('2d').setTransform(1, 0, 0, 1, 0, 0); c.getContext('2d').clearRect(0, 0, c.width, c.height); });
  ready = true;
}
function devRect(x0, y0, x1, y1, dpr) {
  var X0 = Math.max(0, Math.floor(x0 * dpr)), Y0 = Math.max(0, Math.floor(y0 * dpr));
  var X1 = Math.min(Math.round(innerWidth * dpr), Math.ceil(x1 * dpr)), Y1 = Math.min(Math.round(innerHeight * dpr), Math.ceil(y1 * dpr));
  return { x: X0, y: Y0, w: Math.max(1, X1 - X0), h: Math.max(1, Y1 - Y0) };
}
function crop(src, R) {
  var c = document.createElement('canvas'); c.width = R.w; c.height = R.h;
  c.getContext('2d').drawImage(src, R.x, R.y, R.w, R.h, 0, 0, R.w, R.h);
  return c;
}
function lay(cv, pic, R) {
  var c = cv.getContext('2d');
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  c.clearRect(0, 0, cv.width, cv.height);
  if (pic) c.drawImage(pic, R.x, R.y);
}
function showAll() {
  lay(CV.shade, PIC.shade, PIC.rocksR); lay(CV.rocks, PIC.rocks, PIC.rocksR);
  lay(CV.fountain, PIC.fountain, PIC.fnR);
}

/* The drops of the washes (CSS px; times on the reveal's clock). */
function rockSeeds() {
  var W = innerWidth, H = innerHeight, band = V.rkHeight * H * Math.max(0.6, V.rkSize), out = [];
  var st = band * 0.62, n = 0;
  for (var x = -st * 0.3; x < W + st; x += st, n++) {
    var at = x / W * 1.3;
    out.push({ x: x, y: H - band * 0.95, r: band * 0.62, at: at });
    out.push({ x: x + st * 0.45, y: H - band * 0.35, r: band * 0.55, at: at + 0.12 });
  }
  return [{ seeds: out, fall: 0.3 }];
}
function fountainSeeds() {
  var out = [];
  if (!FN) return [{ seeds: out }];
  var G = FN, u = G.u, len = Math.max(u, G.len - u * 1.5);
  for (var f = 1, i = 0; f >= -0.01; f -= 0.18, i++) {                 // from the screen's edge along the spout to its mouth
    var p = G.P(len * f, 0); out.push({ x: p.x, y: p.y, r: u * 1.25, at: i * 0.12 });
  }
  (G.legs || []).forEach(function (Lw, k) { out.push({ x: Lw.x, y: Lw.y, r: u * 1.6, at: 0.75 + k * 0.1 }); });   // the stand
  out.push({ x: G.cross.x, y: G.cross.y, r: u * 1.8, at: 0.7 });
  return [{ seeds: out, fall: 0.2 }];
}
// the ink's parts: id, starts at, lasts. KOI_SCREEN gives them in seconds (inkRocksAt, inkRocksDur,
// inkFnAt, inkFnDur); the ink's own clock runs at InkReveal.look.speed, so they are turned into it here
function inkParts() {
  var sp = (OPT.look && OPT.look.speed) || 0.5, n = function (v, d) { return v === undefined ? d : v; };
  return [
    ['rocks', n(V.inkRocksAt, 0) * sp, Math.max(0.1, n(V.inkRocksDur, 4)) * sp],
    ['fountain', n(V.inkFnAt, 1.8) * sp, Math.max(0.1, n(V.inkFnDur, 3)) * sp]
  ];
}
function inkOk() { return typeof InkReveal !== 'undefined' && !OPT.reduceMotion && OPT.look; }
function startInk(t) {
  try {
    if (OPT.beforeInk) OPT.beforeInk();
    for (var k in OPT.look) InkReveal.look[k] = OPT.look[k];
    // the last soft fill of each wash (inkFinish, seconds)
    if (V.inkFinish !== undefined) InkReveal.look.finish = V.inkFinish * InkReveal.look.speed;
    InkReveal.setup(innerWidth, innerHeight);
    InkReveal.plan(inkParts().map(function (p) {
      return { id: p[0], kind: 'wash', at: p[1], dur: p[2], washes: p[0] === 'rocks' ? rockSeeds() : fountainSeeds() };
    }));
    InkReveal.play(t);
    if (!inkLayer) inkLayer = document.createElement('canvas');
    inkLayer.width = CV.rocks.width; inkLayer.height = CV.rocks.height;
    return true;
  } catch (e) { console.warn('koi page ink:', e); return false; }
}
function stopInk() {
  if (typeof InkReveal !== 'undefined') InkReveal.stop();
  if (typeof InkFluid !== 'undefined' && InkFluid.release) InkFluid.release();
  if (inkLayer) { inkLayer.width = inkLayer.height = 1; }
}
// one picture through the ink: drawn onto the layer where it lies, cut to its
// wet paper and laid on its canvas
function inkLay(cv, pic, R, id) {
  var c = cv.getContext('2d');
  c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(R.x, R.y, R.w, R.h);
  if (!pic) return;
  var st = InkReveal.state(id);
  if (st === 0) return;
  if (st === 2) { c.drawImage(pic, R.x, R.y); return; }
  var l = inkLayer.getContext('2d');
  l.setTransform(1, 0, 0, 1, 0, 0); l.globalAlpha = 1; l.globalCompositeOperation = 'source-over';
  l.clearRect(R.x, R.y, R.w, R.h);
  l.drawImage(pic, R.x, R.y);
  InkReveal.composite(c, inkLayer, id, dprNow(), R);
}

function frame(now) {
  raf = 0;
  if (!active) return;
  raf = requestAnimationFrame(frame);
  var t = now / 1000, dt = Math.min(0.05, lastNow ? t - lastNow : 0); lastNow = t;
  if (phase === 'wait') {                         // (the pictures not made yet: at most a few seconds)
    if (ready) begin(t);
    else if (t - waitReady > 6) { phase = 'live'; goLive(); }
    return;
  }
  if (phase === 'ink') {
    InkReveal.update(t, dt);
    inkLay(CV.shade, PIC.shade, PIC.rocksR, 'rocks');
    inkLay(CV.rocks, PIC.rocks, PIC.rocksR, 'rocks');
    if (PIC.fountain) inkLay(CV.fountain, PIC.fountain, PIC.fnR, 'fountain');
    if (!InkReveal.running() || t - tStart > 30) { stopInk(); showAll(); goLive(); }
    return;
  }
  if (phase === 'fade') {
    if (t - tStart > 1.2) goLive();
    return;
  }
  if (phase === 'live' && FN && V.fnShow) fnFrame(now);
}
function begin(t) {
  tStart = t;
  if (inkOk() && startInk(t)) { phase = 'ink'; return; }
  // (no ink: the rocks and the fountain fade in)
  showAll();
  root.classList.add('soft-in');
  phase = 'fade';
}
// the rocks and the fountain are in: the water runs, its sound, and the koi swim in
function goLive() {
  phase = 'live';
  CV.fx.style.transition = 'opacity ' + Math.max(0, V.waterFade === undefined ? 1.6 : V.waterFade) + 's ease';   // the fountain's water fades in over waterFade s
  root.classList.add('water-on');
  fnSoundOn();
  clearTimeout(koiTimer);
  // the koi start coming in koiAfter s after the ink is done
  koiTimer = setTimeout(function () {
    if (!active || !pond) return;
    pond.enter({ over: V.enterOver === undefined ? 7 : V.enterOver, zLo: 0, zHi: V.enterDepth === undefined ? 0.6 : V.enterDepth });
    pond.start();
  }, Math.max(0, V.koiAfter || 0) * 1000);
}
function start() {
  if (!root) return;
  prepare();
  if (active) return;
  active = true; phase = 'wait'; lastNow = 0; waitReady = performance.now() / 1000;
  root.classList.remove('water-on', 'soft-in');
  [CV.shade, CV.rocks, CV.fountain, CV.fx].forEach(function (c) { c.getContext('2d').setTransform(1, 0, 0, 1, 0, 0); c.getContext('2d').clearRect(0, 0, c.width, c.height); });
  if (pond) pond.stop();                                      // (no koi until the rocks are in)
  if (pond) { var pc = CV.pond.getContext('2d'); pc.setTransform(1, 0, 0, 1, 0, 0); pc.clearRect(0, 0, CV.pond.width, CV.pond.height); }
  root.classList.add('shown');
  if (!raf) raf = requestAnimationFrame(frame);
}
function stop() {
  if (!active) return;
  active = false;
  clearTimeout(koiTimer);
  if (raf) { cancelAnimationFrame(raf); raf = 0; }
  if (phase === 'ink') stopInk();
  phase = 'off';
  fnSoundOff();
  if (pond) pond.stop();
  root.classList.remove('shown', 'water-on', 'soft-in');
}
function info() {
  return { phase: phase, ready: ready, koi: pond ? pond.info() : null, ink: typeof InkReveal !== 'undefined' && phase === 'ink' ? InkReveal.stats() : '',
           sound: { loaded: !!fnBuf, playing: !!fnSrc } };
}

window.KoiPage = { init: init, prepare: prepare, start: start, stop: stop, info: info, get pond() { return pond; } };
})();
