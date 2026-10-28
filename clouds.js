/* ============================================================
   CLOUDS — soft, realistic clouds for the sky and for the mountains:
   big soft heaps with bright tops and grey, shaded undersides, and low
   banks of cloud lying across the slopes, as in a photo of mountains in
   changing weather. Each cloud is built once and baked into a picture;
   the scene only moves the pictures about.

   How it is made (as in real clouds, there are no hard edges anywhere):
   - The cloud is a density of water droplets, not a solid surface. Its
     rough form (a heap, a tower, a long bank …) is a smooth field, highest
     inside and falling to nothing at the edges.
   - Layers of swirling noise eat into that field, so the edges break up
     into soft billows, ragged wisps and holes, and the inside is thicker
     in some places and thinner in others.
   - How much of it you see (its opacity) follows the density: thick parts
     are solid white or grey, thin parts are see-through, so a mountain
     behind a thin edge still shows faintly.
   - The light: for every point, the cloud lying between it and the sun
     is added up; the more cloud, the less sunlight reaches it (as light
     is scattered away inside a real cloud). So the sunny side and the
     tops are bright, the far side and the bottom are grey, with soft
     shading in between. Light from the sky fills in the shade, thin
     edges glow, and the base is a darker grey.

   The density is built once (in the background); painting it in new
   colours or for a new sun direction is quick, so the scene paints
   again as the light changes through the day.

   Use:
     var sh = Clouds.shape(kind, seed, o);   // build a cloud (no colours yet)
     Clouds.paint(sh, o);                    // paint it; the picture is sh.cnv
     Clouds.free(sh);                        // give back its memory when it is replaced
     Clouds.build(kind, seed, o, function(sh) { … });
                                             // the same as shape(), built in the
                                             // background (a worker) where it can be
   kind: 'tower' (a tall heaped cloud), 'heap' (a wide cumulus),
         'puff' (a small fair-weather cloud), 'flat' (a wide, low layer),
         'mass' (a big, soft mass of cloud), 'bank' (a long, low bank of
         cloud that lies across a mountain's slopes or in a valley)
   sh.w, sh.h   size of the picture (px)
   sh.base      where the base is (fraction of the height from the top)
   sh.size      how wide this kind is drawn, next to the others (heap = 1)
   o (anything left out comes from Clouds.DEFAULTS):
     resolution   picture pixels per unit (the shapes are about 300–900
                  units wide); the clouds are soft, so a low one is fine
     detail       how fine the smallest billows and wisps are (3 … 7)
     billows      0 smooth, misty … 1 heaped, puffy billows
     edge         0 a firmer outline … 1 very soft, fading edges
     wisp         how much the edges break up into wisps and holes
     swirl        how much the billows and wisps swirl
     flatBase     0 a soft, rounded bottom … 1 a flat base
     density      how thick: low = thin and see-through
     sunElevation degrees above the horizon the light comes from
     sunSide      -1 from the left … 1 from the right
     sunFront     0 from the side … 1 from behind you (the cloud's face lit)
     shadow       how much sunlight the cloud soaks up: high = darker undersides
     ambient      light from the sky in the shade
     baseDark     how dark the base is
     silver       a glow on the thin edges
     exposure     more than 1: more of the cloud in full sunlight (for a pale sky)
     colours      { lit, shade, base, sky } '#rrggbb' or [r, g, b]
   ============================================================ */
var Clouds = (function() {
  'use strict';

  var DEFAULTS = {
    resolution: 0.7, detail: 5, billows: 0.5, edge: 0.6, wisp: 0.55, swirl: 0.45, flatBase: 0.4, density: 1.2,
    sunElevation: 40, sunSide: -0.35, sunFront: 0.6,
    shadow: 1.6, ambient: 0.5, baseDark: 0.5, silver: 0.4, exposure: 1,
    colours: { lit: '#FFFFFF', shade: '#9AA6BD', base: '#7F8AA2', sky: '#3F6DB4' }
  };

  /* The kinds of cloud: picture size (units), where the base is, the size
     of its features (fraction of the width), how thick the base layer is
     (fraction of the height), and the shape of the top: bumps [where
     across 0 … 1, how high 0 … 1, how wide]. */
  var KINDS = {
    tower: { w: 640, h: 520, base: 0.84, r: 0.1, size: 1,
             bumps: function(r) { var c = 0.4 + r() * 0.2, b = [[c, 1, 0.15 + r() * 0.05]];
                                  for (var i = 0; i < 4; i++) b.push([0.18 + r() * 0.64, 0.2 + r() * 0.3, 0.1 + r() * 0.08]);
                                  return b; } },
    heap:  { w: 760, h: 380, base: 0.82, r: 0.085, size: 1,
             bumps: function(r) { var b = [], n = 3 + Math.floor(r() * 3);
                                  for (var i = 0; i < n; i++) b.push([0.18 + (i + r() * 0.8) / n * 0.64, 0.35 + r() * 0.65, 0.09 + r() * 0.08]);
                                  return b; } },
    puff:  { w: 340, h: 220, base: 0.78, r: 0.13, size: 0.42,
             bumps: function(r) { return [[0.4 + r() * 0.2, 0.8 + r() * 0.2, 0.18 + r() * 0.06],
                                          [0.25 + r() * 0.5, 0.45 + r() * 0.3, 0.13]]; } },
    flat:  { w: 900, h: 280, base: 0.8, r: 0.06, size: 1.15,
             bumps: function(r) { var b = [], n = 6 + Math.floor(r() * 4);
                                  for (var i = 0; i < n; i++) b.push([0.12 + (i + r()) / n * 0.76, 0.35 + r() * 0.65, 0.06 + r() * 0.05]);
                                  return b; } },
    mass:  { w: 820, h: 620, base: 0.86, r: 0.11, size: 1.3,
             bumps: function(r) { var b = [[0.45 + r() * 0.15, 1, 0.24 + r() * 0.06]];
                                  for (var i = 0; i < 4; i++) b.push([0.15 + r() * 0.7, 0.4 + r() * 0.45, 0.12 + r() * 0.1]);
                                  return b; } },
    bank:  { w: 1000, h: 240, base: 0.82, r: 0.05, size: 1.3,
             bumps: function(r) { var b = [], n = 7 + Math.floor(r() * 4);
                                  for (var i = 0; i < n; i++) b.push([0.08 + (i + r()) / n * 0.84, 0.25 + r() * 0.5, 0.05 + r() * 0.06]);
                                  return b; } }
  };

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function smooth(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function rng(seed) {
    var a = seed >>> 0;
    return function() {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function col(c) {
    if (Array.isArray(c)) return c;
    c = c.replace('#', '');
    return [parseInt(c.substr(0, 2), 16), parseInt(c.substr(2, 2), 16), parseInt(c.substr(4, 2), 16)];
  }
  function merged(o) {
    var v = {}, k;
    for (k in DEFAULTS) v[k] = DEFAULTS[k];
    v.colours = {};
    for (k in DEFAULTS.colours) v.colours[k] = DEFAULTS.colours[k];
    if (o) for (k in o) {
      if (k === 'colours') { for (var j in o.colours) v.colours[j] = o.colours[j]; }
      else if (o[k] !== undefined && k in DEFAULTS) v[k] = o[k];
    }
    return v;
  }

  /* Smooth value noise, 0 … 1, and a few octaves of it. */
  function noise(seed) {
    var N = 256, g = new Float32Array(N * N), r = rng(seed);
    for (var i = 0; i < g.length; i++) g[i] = r();
    function n(x, y) {
      var xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
      fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
      var x0 = xi & 255, y0 = yi & 255, x1 = (x0 + 1) & 255, y1 = (y0 + 1) & 255;
      var a = g[y0 * N + x0], b = g[y0 * N + x1], c = g[y1 * N + x0], d = g[y1 * N + x1];
      return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
    }
    return function(x, y, oct, billow) {
      var s = 0, amp = 0.5, tot = 0;
      for (var o = 0; o < oct; o++) {
        var v = n(x, y);
        if (billow) v = v + ((1 - Math.abs(v * 2 - 1)) - v) * billow;   // rounded, heaped billows
        s += v * amp; tot += amp;
        x = x * 2.03 + 17.1; y = y * 2.03 + 5.3; amp *= 0.5;
      }
      return s / tot;
    };
  }

  /* Build a cloud: its density, how high each point is above the base, and
     how much of it is seen. */
  function shape(kind, seed, o) {
    o = merged(o);
    var K = KINDS[kind] || KINDS.heap, res = o.resolution, r = rng(seed * 7919 + 101);
    var W = Math.max(8, Math.round(K.w * res)), H = Math.max(8, Math.round(K.h * res)), R = K.r * W;
    var baseY = K.base * H, tall = baseY - R * 2.4;
    var bumps = K.bumps(r), nz = noise(seed * 31 + 7), nw = noise(seed * 57 + 3);
    var ox = r() * 200, oy = r() * 200;
    function env(u) {
      var e = 0;
      // each bump is a rounded dome; where domes meet they blend softly
      for (var i = 0; i < bumps.length; i++) {
        var d = (u - bumps[i][0]) / (bumps[i][2] * 1.7), k = 1 - d * d;
        if (k > 0) e += Math.pow(bumps[i][1] * Math.sqrt(k), 2.5);
      }
      return Math.pow(e, 0.4) * smooth(0.08, 0.26, Math.min(u, 1 - u));
    }
    var top = new Float32Array(W), baseL = new Float32Array(W);
    for (var x = 0; x < W; x++) {
      // the cloud's height here: the domes, rolling up and down in broad billows
      top[x] = env(x / W) * tall * (0.75 + 0.5 * nw(x / (R * 2.4) + 7.7, 3.3, 3));
      baseL[x] = baseY + (nz(x / R * 0.7 + 3.1, 9.7, 3) - 0.5) * R * (1.4 - o.flatBase);
    }
    // how far each column is from the body of the cloud (in feature sizes), so the wisps along
    // the base fade out beside it and never reach the edge of the picture
    var gap = new Float32Array(W), g = 99;
    for (x = 0; x < W; x++) { g = top[x] > R * 0.35 ? 0 : g + 1 / R; gap[x] = g; }
    for (g = 99, x = W - 1; x >= 0; x--) { g = top[x] > R * 0.35 ? 0 : g + 1 / R; gap[x] = Math.min(gap[x], g); }
    var N = W * H, D = new Uint8Array(N), A = new Uint8Array(N), HG = new Uint8Array(N);
    var f = 1 / (R * 1.1), wf = 1 / (R * 2.2), sw = o.swirl * R * 1.6;
    var ramp = 0.18 + o.edge * 1.1;                          // how far in from the edge the cloud is fully thick
    var baseSoft = R * (0.25 + (1 - o.flatBase) * 1.4);
    var oct = clamp(Math.round(o.detail), 2, 8), bil = clamp(o.billows, 0, 1), dens = o.density;
    for (var y = 0; y < H; y++) for (x = 0; x < W; x++) {
      var e = top[x];
      var bl = baseL[x];
      // how far inside the rough form this point is, in feature sizes (negative: outside)
      var dt = (y - (bl - e)) / R, db = (bl - y) / baseSoft * 1.2;
      var m = Math.min(dt, db, e / R * 0.9, gap[x] > 0 ? 0.6 - gap[x] * 1.5 : 99, Math.min(x, W - 1 - x, y, H - 1 - y) / R - 1.3);
      if (m < -1.6) continue;
      // swirl, then the billows and wisps eating into the edge
      var qx = (nw(x * wf + ox, y * wf + oy, 3) - 0.5) * sw, qy = (nw(x * wf + oy + 31, y * wf + ox, 3) - 0.5) * sw;
      var n = nz((x + qx) * f + ox, (y + qy) * f * 1.15 + oy, oct, bil);
      // the noise breaks up the edges; deep inside, the cloud stays whole
      var d = (m + (n - 0.5) * 2.4 * (0.35 + o.wisp) * (0.3 + 0.7 * smooth(2.2, 0.3, m))) / ramp;
      if (d <= 0) continue;
      var i = y * W + x;
      // how much is seen: thin at the edges, solid inside; the light inside varies with thicker
      // and thinner parts
      var a = 1 - Math.exp(-d * dens * 1.6);
      d = d * (0.65 + 0.7 * n);
      D[i] = Math.min(255, Math.round(d * 40));
      A[i] = Math.round(a * 255);
      HG[i] = Math.round(clamp((bl - y) / (R * 3), 0, 1) * 255);
    }
    var sh = { kind: kind, w: W, h: H, base: baseY / H, size: K.size, R0: R,
               D: D, A: A, HG: HG, cnv: null, img: null };
    if (typeof document !== 'undefined') addCanvas(sh);
    return sh;
  }
  /* The shape's picture. If the tablet runs short of graphics memory, Chrome
     may wipe it; it is then marked unpainted (painted = '', ready = false)
     so the scene paints it again. */
  function addCanvas(sh) {
    var cnv = document.createElement('canvas');
    cnv.width = sh.w; cnv.height = sh.h;
    cnv.addEventListener('contextrestored', function() { sh.painted = ''; sh.ready = false; });
    sh.cnv = cnv;
    return sh;
  }
  /* Give back a shape's memory at once (its picture and buffers), when it is
     no longer used. */
  function free(sh) {
    if (!sh) return;
    if (sh.cnv) { sh.cnv.width = sh.cnv.height = 0; }
    sh.img = null; sh.ready = false;
  }

  /* Paint a cloud in the light and colours of o, into sh.cnv. */
  function paint(sh, o) {
    o = merged(o);
    var W = sh.w, H = sh.h, C = o.colours, R = sh.R0;
    var lit = col(C.lit), shade = col(C.shade), base = col(C.base), sky = col(C.sky);
    // the direction toward the sun on the picture (x right, y down), and how much it comes from in front
    var el = o.sunElevation * Math.PI / 180, side = clamp(o.sunSide, -1, 1), front = clamp(o.sunFront, 0, 1);
    var lx = side * Math.cos(el) * (1 - front * 0.6), ly = -Math.sin(el), ll = Math.sqrt(lx * lx + ly * ly) || 1;
    var sx = lx / ll, sy = ly / ll;
    // a ray toward the sun, its steps longer the further it goes (fine near the point, reaching
    // right through a tall cloud); light from in front passes through less cloud
    var steps = 16, offs = [], wts = [], dist = 0, j;
    for (j = 0; j < steps; j++) {
      var st = R * 0.08 * Math.pow(1.22, j);
      dist += st; offs.push([sx * dist, sy * dist]); wts.push(st / R);
    }
    var absorb = o.shadow * 0.012 * (1 - front * 0.55);
    var ctx = sh.cnv.getContext('2d');
    var img = sh.img || ctx.createImageData(W, H);
    var px = img.data, D = sh.D, A = sh.A, HG = sh.HG;
    var amb = o.ambient, bD = o.baseDark, silver = o.silver, expo = o.exposure;
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
      var i = y * W + x, q = i * 4;
      if (!A[i]) { px[q + 3] = 0; continue; }
      // how much cloud lies between this point and the sun
      var s = D[i] * 0.05;
      for (j = 0; j < steps; j++) {
        var ix = (x + 0.5 + offs[j][0]) | 0, iy = (y + 0.5 + offs[j][1]) | 0;
        if (ix < 0 || ix >= W || iy < 0 || iy >= H) break;
        s += D[iy * W + ix] * wts[j];
      }
      var sun = Math.exp(-s * absorb), a = A[i] / 255, hg = HG[i] / 255;
      var light = clamp((sun * 0.85 + amb * 0.3 * (0.6 + 0.4 * hg) + silver * (1 - a) * sun * 0.8) * expo, 0, 1);
      var rr = shade[0] + (lit[0] - shade[0]) * light, gg = shade[1] + (lit[1] - shade[1]) * light, bb = shade[2] + (lit[2] - shade[2]) * light;
      // the bottom of the cloud: a darker grey
      var under = bD * (1 - smooth(0, 0.45, hg)) * (1 - light * 0.5);
      rr += (base[0] - rr) * under; gg += (base[1] - gg) * under; bb += (base[2] - bb) * under;
      // the blue sky in the shade
      var sk = 0.12 * amb * (1 - light);
      rr += (sky[0] - rr) * sk; gg += (sky[1] - gg) * sk; bb += (sky[2] - bb) * sk;
      px[q] = rr; px[q + 1] = gg; px[q + 2] = bb; px[q + 3] = A[i];
    }
    ctx.putImageData(img, 0, 0);
    sh.img = img;
    return sh.cnv;
  }

  /* Build a cloud in the background (a worker running this same file), so
     the animation does not stop while it is built; cb(shape) when it is
     ready. Where a worker cannot start, it is built here instead. */
  var SRC = typeof document !== 'undefined' && document.currentScript ? document.currentScript.src : 'clouds.js';
  var worker = null, tried = false, jobs = {}, nextId = 1;
  function here(j) { setTimeout(function() { j.cb(shape(j.kind, j.seed, j.o)); }, 0); }
  function build(kind, seed, o, cb) {
    var j = { kind: kind, seed: seed, o: o, cb: cb };
    if (!tried) {
      tried = true;
      try {
        worker = new Worker(SRC);
        worker.onmessage = function(e) {
          var d = e.data, jb = jobs[d.id];
          if (!jb) return;
          delete jobs[d.id];
          jb.cb(addCanvas(d));
        };
        worker.onerror = function(e) {
          if (e && e.preventDefault) e.preventDefault();
          worker = null;
          for (var id in jobs) here(jobs[id]);
          jobs = {};
        };
      } catch (err) { worker = null; }
    }
    if (!worker) { here(j); return; }
    var id = nextId++;
    jobs[id] = j;
    worker.postMessage({ id: id, kind: kind, seed: seed, o: o });
  }

  return { DEFAULTS: DEFAULTS, KINDS: KINDS, shape: shape, paint: paint, build: build, free: free };
})();
if (typeof module !== 'undefined') module.exports = Clouds;
/* Running as the worker for Clouds.build: build the shape and send it back. */
if (typeof document === 'undefined' && typeof importScripts === 'function') {
  self.onmessage = function(e) {
    var d = e.data, sh = Clouds.shape(d.kind, d.seed, d.o);
    sh.id = d.id;
    self.postMessage(sh, [sh.D.buffer, sh.A.buffer, sh.HG.buffer]);
  };
}
