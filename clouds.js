/* ============================================================
   CLOUDS — realistic cumulus clouds for the day sky (like a summer
   sky in a photo: bright white heaped tops, blue-grey shaded sides and
   flat, darker bases). Each cloud is built once as a little 3D shape
   and baked into a picture; the scene only moves the pictures about.

   What makes them look real:
   - The shape: a row of big round puffs along a flat base, piled up
     into towers and heaps, and every puff covered in smaller puffs,
     and those in smaller ones again (billows on billows), so the
     outline is the crisp "cauliflower" edge of a real cumulus. The
     bottom is cut flat where the air is too warm for cloud.
   - Every point knows which way it faces, so it is lit by the sun like
     a 3D object: bright where it faces the sun, blue-grey where it
     turns away. Puffs lower down are shaded by the cloud above them,
     the gaps between billows are darker, and the base is a darker grey.
   - The outline is thin where the cloud is thin, so the edges fade
     softly, with a few ragged wisps.

   The shape is baked once (slow, about a tenth of a second); painting
   it in new colours or a new sun direction is quick, so the app paints
   again as the light changes through the day.

   Use:
     var sh = Clouds.shape(kind, seed, o);   // build a cloud (no colours yet)
     Clouds.paint(sh, o);                    // paint it; the picture is sh.cnv
     Clouds.free(sh);                        // give back its memory when it is replaced
     Clouds.build(kind, seed, o, function(sh) { … });
                                             // the same as shape(), built in the
                                             // background (a worker) where it can be
   kind: 'tower' (a tall heaped cloud), 'heap' (a wide cumulus),
         'puff' (a small fair-weather cloud), 'flat' (a wide, low layer)
   sh.w, sh.h   size of the picture (px)
   sh.base      where the flat base is (fraction of the height from the top)
   sh.size      how wide this kind is drawn, next to the others (heap = 1)
   o (anything left out comes from Clouds.DEFAULTS):
     resolution   picture pixels per unit (the shapes are about 300–860
                  units wide)
     detail       levels of billows on billows (1 … 4)
     billows      how many billows on each puff
     flatBase     0 a rounded bottom … 1 a flat, cut base
     edge         0 a crisp outline … 1 a soft one
     wisp         ragged, thin edges
     grain        a fine texture on the surface
     smoothSeams  how softly one puff runs into the next
     billowLight  0 lit as one smooth shape … 1 every billow lit as a ball
     sunElevation degrees above the horizon the light comes from
     sunSide      -1 from the left … 1 from the right
     sunFront     0 from the side … 1 from behind you (the cloud's face lit)
     wrap         how far the light wraps round into the shade
     shadow       how much the upper cloud shades the lower
     crevices     how dark the gaps between billows are
     baseDark     how dark the base is
     silver       a brighter rim on the thin edges
     exposure     more than 1: more of the cloud in full sunlight (for a pale sky)
     colours      { lit, shade, base, sky } '#rrggbb' or [r, g, b]
   ============================================================ */
var Clouds = (function() {
  'use strict';

  var DEFAULTS = {
    resolution: 1.2, detail: 3, billows: 1, billowLight: 0.45, smoothSeams: 0.4, flatBase: 0.85, edge: 0.35, wisp: 0.35, grain: 0.5,
    sunElevation: 40, sunSide: -0.35, sunFront: 0.6,
    wrap: 0.2, shadow: 1.8, crevices: 0.6, baseDark: 0.75, silver: 0.35, exposure: 1,
    colours: { lit: '#FFFFFF', shade: '#909DB6', base: '#78839A', sky: '#3F6DB4' }
  };

  /* The kinds of cloud: picture size (units), where the base is, the size
     of the big puffs (fraction of the width), and the shape of the top:
     bumps [where across 0 … 1, how high 0 … 1, how wide]. */
  var KINDS = {
    tower: { w: 640, h: 500, base: 0.88, r: 0.085, size: 1,
             bumps: function(r) { var c = 0.4 + r() * 0.2, b = [[c, 1, 0.16 + r() * 0.05]];
                                  for (var i = 0; i < 4; i++) b.push([0.15 + r() * 0.7, 0.18 + r() * 0.3, 0.08 + r() * 0.08]);
                                  return b; } },
    heap:  { w: 760, h: 360, base: 0.86, r: 0.07, size: 1,
             bumps: function(r) { var b = [], n = 3 + Math.floor(r() * 3);
                                  for (var i = 0; i < n; i++) b.push([0.12 + (i + r() * 0.8) / n * 0.76, 0.3 + r() * 0.7, 0.07 + r() * 0.08]);
                                  return b; } },
    puff:  { w: 320, h: 200, base: 0.82, r: 0.11, size: 0.4,
             bumps: function(r) { return [[0.38 + r() * 0.24, 0.8 + r() * 0.2, 0.2 + r() * 0.08],
                                          [0.2 + r() * 0.6, 0.45 + r() * 0.3, 0.14]]; } },
    flat:  { w: 860, h: 260, base: 0.84, r: 0.05, size: 1.15,
             bumps: function(r) { var b = [], n = 6 + Math.floor(r() * 4);
                                  for (var i = 0; i < n; i++) b.push([0.06 + (i + r()) / n * 0.88, 0.35 + r() * 0.65, 0.05 + r() * 0.05]);
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
      else if (o[k] !== undefined) v[k] = o[k];
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
    return function(x, y, oct) {
      var s = 0, amp = 0.5, tot = 0;
      for (var o = 0; o < oct; o++) { s += n(x, y) * amp; tot += amp; x = x * 2.03 + 17.1; y = y * 2.03 + 5.3; amp *= 0.5; }
      return s / tot;
    };
  }

  /* A blur of a float picture (box blur three times ≈ a gaussian). */
  function blur(src, w, h, rad) {
    rad = Math.max(1, Math.round(rad));
    var a = new Float32Array(src), b = new Float32Array(src.length), x, y, i, s, k;
    for (var pass = 0; pass < 3; pass++) {
      for (y = 0; y < h; y++) {
        var row = y * w; s = 0;
        for (k = -rad; k <= rad; k++) s += a[row + clamp(k, 0, w - 1)];
        for (x = 0; x < w; x++) {
          b[row + x] = s / (rad * 2 + 1);
          s += a[row + Math.min(x + rad + 1, w - 1)] - a[row + Math.max(x - rad, 0)];
        }
      }
      for (x = 0; x < w; x++) {
        s = 0;
        for (k = -rad; k <= rad; k++) s += b[clamp(k, 0, h - 1) * w + x];
        for (y = 0; y < h; y++) {
          a[y * w + x] = s / (rad * 2 + 1);
          s += b[Math.min(y + rad + 1, h - 1) * w + x] - b[Math.max(y - rad, 0) * w + x];
        }
      }
    }
    return a;
  }

  /* Build a cloud: its puffs, then the surface seen from the front. */
  function shape(kind, seed, o) {
    o = merged(o);
    var K = KINDS[kind] || KINDS.heap, res = o.resolution, r = rng(seed * 7919 + 101);
    var W = Math.round(K.w * res), H = Math.round(K.h * res), R0 = K.r * W;
    var baseY = K.base * H, topY = R0 * 1.3, tall = baseY - topY;
    var bumps = K.bumps(r), nz = noise(seed * 31 + 7);
    function env(u) {
      var e = 0;
      for (var i = 0; i < bumps.length; i++) { var d = (u - bumps[i][0]) / bumps[i][2]; e = Math.max(e, bumps[i][1] * Math.exp(-d * d)); }
      var m = Math.min(u, 1 - u) / 0.3; return e * (m >= 1 ? 1 : Math.sqrt(Math.max(0, m)));
    }

    // the big puffs: columns along the base, piled up to the shape of the top
    var P = [];   // [x, y, z, radius, level]
    var x = R0 * 2.8;
    while (x < W - R0 * 2.8) {
      var top = baseY - env(x / W) * tall;
      var rr = R0 * (0.75 + r() * 0.5), y = baseY - rr * 0.35;
      if (env(x / W) > 0.04) {
        for (var guard = 0; guard < 40; guard++) {
          P.push([x + (r() - 0.5) * R0 * 0.7, y, (r() - 0.5) * R0 * 1.2, rr, 0]);
          if (y - rr <= top) break;
          y -= rr * (0.75 + r() * 0.25);
          rr = Math.min(R0 * (0.7 + r() * 0.55), Math.max(R0 * 0.45, (y - top) * 0.9 + R0 * 0.3));
        }
      }
      x += R0 * (0.55 + r() * 0.35);
    }
    // billows on billows
    var counts = [6, 5, 4, 3], ratio = [0.5, 0.45, 0.45, 0.45];
    var levels = clamp(Math.round(o.detail), 0, 4), from = 0;
    for (var lv = 0; lv < levels; lv++) {
      var to = P.length;
      for (var p = from; p < to; p++) {
        var Q = P[p], n = Math.round(counts[lv] * o.billows * (0.7 + r() * 0.6));
        for (var c = 0; c < n; c++) {
          // a direction on the puff, mostly up, out to the sides and toward us
          var dx = r() * 2 - 1, dy = r() * 2 - 1, dz = r() * 2 - 1, dl = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
          dx /= dl; dy /= dl; dz /= dl;
          if (dy > 0.25) dy = -dy * 0.6;
          dz = Math.abs(dz) * 0.8;
          var cr = Q[3] * ratio[lv] * (0.65 + r() * 0.6), reach = Q[3] - cr * 0.35;
          var cy = Q[1] + dy * reach, cx = Q[0] + dx * reach;
          if (cy - cr > baseY || cx - cr < 1 || cx + cr > W - 1 || cy - cr < 1) continue;
          P.push([cx, cy, Q[2] + dz * reach, cr, lv + 1]);
        }
      }
      from = to;
    }

    // the surface: for every pixel the nearest point of any puff, which way it faces, and how thick the cloud is
    var N = W * H, Z = new Float32Array(N).fill(-1e9), T = new Float32Array(N);
    var NX = new Float32Array(N), NY = new Float32Array(N), NZ = new Float32Array(N);
    // the same for the big puffs alone (the lobes of the cloud, which carry its light and shade)
    var ZC = new Float32Array(N).fill(-1e9), CX = new Float32Array(N), CY = new Float32Array(N), CZ = new Float32Array(N);
    var baseLine = new Float32Array(W), soft = (1 - o.flatBase) * R0 * 1.4 + R0 * 0.12;
    for (x = 0; x < W; x++) baseLine[x] = baseY + (nz(x / R0 * 0.8, 3.7, 3) - 0.5) * R0 * 0.25 * (1.2 - o.flatBase) + soft * 0.5;
    var zMin = 1e9;
    for (p = 0; p < P.length; p++) {
      Q = P[p];
      var qx = Q[0], qy = Q[1], qz = Q[2], qr = Q[3], qr2 = qr * qr;
      var x0 = Math.max(0, Math.floor(qx - qr)), x1 = Math.min(W - 1, Math.ceil(qx + qr));
      var y0 = Math.max(0, Math.floor(qy - qr)), y1 = Math.min(H - 1, Math.ceil(qy + qr));
      if (qz - qr < zMin) zMin = qz - qr;
      for (y = y0; y <= y1; y++) {
        var ddy = y + 0.5 - qy, ry = qr2 - ddy * ddy;
        if (ry <= 0) continue;
        for (var px = x0; px <= x1; px++) {
          var ddx = px + 0.5 - qx, d2 = ry - ddx * ddx;
          if (d2 <= 0) continue;
          var hgt = Math.sqrt(d2), i = y * W + px;
          // below the base the cloud thins out quickly (flatBase: how sharply)
          var cut = y > baseLine[px] - soft ? 1 - smooth(baseLine[px] - soft, baseLine[px] + soft * 0.3, y) : 1;
          if (cut <= 0) continue;
          T[i] += hgt * 2 * cut;
          var zf = qz + hgt;
          if (zf > Z[i]) { Z[i] = zf; NX[i] = ddx / qr; NY[i] = ddy / qr; NZ[i] = hgt / qr; }
          if (Q[4] <= 1 && zf > ZC[i]) { ZC[i] = zf; CX[i] = ddx / qr; CY[i] = ddy / qr; CZ[i] = hgt / qr; }
        }
      }
    }

    // crevices: where the surface lies behind the surface around it
    for (i = 0; i < N; i++) if (Z[i] < -1e8) Z[i] = zMin;
    var ZB = blur(Z, W, H, R0 * 0.18);
    // soften the seams where one puff runs into another
    var sf = R0 * 0.03 * (1 + o.smoothSeams * 3);
    NX = blur(NX, W, H, sf * 0.3); NY = blur(NY, W, H, sf * 0.3); NZ = blur(NZ, W, H, sf * 0.3);
    for (i = 0; i < N; i++) if (ZC[i] < -1e8) { CX[i] = NX[i]; CY[i] = NY[i]; CZ[i] = NZ[i]; }
    CX = blur(CX, W, H, sf); CY = blur(CY, W, H, sf); CZ = blur(CZ, W, H, sf);

    var A = new Uint8Array(N), A0 = new Uint8Array(N), TH = new Uint8Array(N), AO = new Uint8Array(N), HG = new Uint8Array(N);
    var NI = new Int8Array(N * 3);
    var kEdge = R0 * (0.03 + o.edge * 0.5), gS = 1 / (R0 * 0.09), wS = 1 / (R0 * 0.35), e = 1.5;
    var dm = o.billowLight;
    function lerpN(a, b) { return a + (b - a) * dm; }
    var cloudTop = H;
    for (i = 0; i < N; i++) if (T[i] > 0) { cloudTop = Math.floor(i / W); break; }
    var span = Math.max(1, baseY - cloudTop);
    for (y = 0; y < H; y++) for (x = 0; x < W; x++) {
      i = y * W + x;
      if (T[i] <= 0) continue;
      var a0 = 1 - Math.exp(-T[i] / kEdge);
      var wn = nz(x * wS, y * wS, 3);
      var a = clamp(a0 - o.wisp * (1 - a0) * (0.4 + wn) * 1.4 + (1 - a0) * 0.1, 0, 1);
      if (a < 0.004) continue;
      // the fine texture tilts the surface a little
      // the light falls on the cloud's lobes; the small billows only add to it
      var nx, ny, nzv;
      nx = lerpN(CX[i], NX[i]); ny = lerpN(CY[i], NY[i]); nzv = lerpN(CZ[i], NZ[i]);
      var nl0 = Math.sqrt(nx * nx + ny * ny + nzv * nzv) || 1;
      nx /= nl0; ny /= nl0; nzv /= nl0;
      if (o.grain > 0) {
        var gx = (nz((x + e) * gS, y * gS, 2) - nz((x - e) * gS, y * gS, 2)) / (2 * e * gS);
        var gy = (nz(x * gS, (y + e) * gS, 2) - nz(x * gS, (y - e) * gS, 2)) / (2 * e * gS);
        nx += gx * o.grain * 0.45; ny += gy * o.grain * 0.45;
        var nl = Math.sqrt(nx * nx + ny * ny + nzv * nzv) || 1;
        nx /= nl; ny /= nl; nzv /= nl;
      }
      NI[i * 3] = Math.round(nx * 127); NI[i * 3 + 1] = Math.round(ny * 127); NI[i * 3 + 2] = Math.round(nzv * 127);
      A[i] = Math.round(a * 255); A0[i] = Math.round(a0 * 255);
      TH[i] = Math.round((1 - Math.exp(-T[i] / (R0 * 1.2))) * 255);
      AO[i] = Math.round(clamp((ZB[i] - Z[i]) / (R0 * 0.22), 0, 1) * 255);
      HG[i] = Math.round(clamp((baseY - y) / (R0 * 2.5), 0, 1) * 255);
    }
    var sh = { kind: kind, w: W, h: H, base: baseY / H, size: K.size, R0: R0,
               N: NI, A: A, A0: A0, T: TH, AO: AO, HG: HG, cnv: null, img: null };
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
    sh.img = null; sh.SH = null; sh.ready = false;
  }

  /* Paint a cloud in the light and colours of o, into sh.cnv. */
  function paint(sh, o) {
    o = merged(o);
    var W = sh.w, H = sh.h, C = o.colours;
    var lit = col(C.lit), shade = col(C.shade), base = col(C.base), sky = col(C.sky);
    // the direction toward the sun (x right, y down, z toward us)
    var el = o.sunElevation * Math.PI / 180, side = clamp(o.sunSide, -1, 1), front = clamp(o.sunFront, 0, 1);
    var hz = Math.cos(el), lx = side * hz * (1 - front * 0.6), lz = front * hz + 0.15, ly = -Math.sin(el);
    var ll = Math.sqrt(lx * lx + ly * ly + lz * lz); lx /= ll; ly /= ll; lz /= ll;
    var sl = Math.sqrt(lx * lx + ly * ly) || 1, sx = lx / sl, sy = ly / sl;
    // the shade of the cloud above: how far a ray toward the sun runs inside the cloud
    var step = Math.max(1, sh.R0 * 0.08), steps = 22, mx = sx * step, my = sy * step;
    var shK = o.shadow * step / (sh.R0 * 0.9) * (1 - lz * 0.6);
    var j;
    var ctx = sh.cnv.getContext('2d');
    if (!sh.img) sh.img = ctx.createImageData(W, H);
    var px = sh.img.data, NI = sh.N, A = sh.A, A0 = sh.A0, T = sh.T, AO = sh.AO, HG = sh.HG;
    var wrap = o.wrap, crev = o.crevices, bD = o.baseDark, silver = o.silver;
    // how much cloud lies between each point and the sun (softened, as the light scatters)
    if (!sh.SH) sh.SH = new Float32Array(W * H);
    var SH = sh.SH, x, y, i;
    SH.fill(0);
    for (y = 0; y < H; y++) for (x = 0; x < W; x++) {
      i = y * W + x;
      if (!A[i]) continue;
      var s = 0, fx = x + 0.5, fy = y + 0.5;
      for (j = 0; j < steps; j++) {
        fx += mx; fy += my;
        var ix = fx | 0, iy = fy | 0;
        if (ix < 0 || ix >= W || iy < 0 || iy >= H) break;
        var tq = T[iy * W + ix];
        if (!tq) break;
        s += tq / 255;
      }
      SH[i] = s;
    }
    SH = blurF(SH, W, H, sh.R0 * 0.12);
    for (y = 0; y < H; y++) for (x = 0; x < W; x++) {
      i = y * W + x; var q = i * 4;
      if (!A[i]) { px[q + 3] = 0; continue; }
      var nx = NI[i * 3] / 127, ny = NI[i * 3 + 1] / 127, nzv = NI[i * 3 + 2] / 127;
      var d = nx * lx + ny * ly + nzv * lz, lam = clamp((d + wrap) / (1 + wrap), 0, 1);
      var s = SH[i];
      var hg = HG[i] / 255, ao = AO[i] / 255, a0 = A0[i] / 255;
      var light = lam * Math.exp(-s * shK) * (1 - crev * ao);
      light = clamp((light + (1 - a0) * 0.35) * o.exposure, 0, 1);    // thin edges let the light through
      var r = shade[0] + (lit[0] - shade[0]) * light, g = shade[1] + (lit[1] - shade[1]) * light, b = shade[2] + (lit[2] - shade[2]) * light;
      // the base: the lowest part, facing down, is a darker grey
      var under = bD * (1 - smooth(0, 0.5, hg)) * (0.55 + 0.45 * clamp(ny, 0, 1)) * (1 - light * 0.6);
      r += (base[0] - r) * under; g += (base[1] - g) * under; b += (base[2] - b) * under;
      // the blue sky lights the shaded parts that face up
      var sk = 0.16 * (1 - light) * clamp(-ny + 0.3, 0, 1);
      r += (sky[0] - r) * sk; g += (sky[1] - g) * sk; b += (sky[2] - b) * sk;
      // a brighter rim on the thin edges
      var rim = silver * (1 - a0) * (0.4 + 0.6 * lam);
      r += (lit[0] - r) * rim; g += (lit[1] - g) * rim; b += (lit[2] - b) * rim;
      px[q] = r; px[q + 1] = g; px[q + 2] = b; px[q + 3] = A[i];
    }
    ctx.putImageData(sh.img, 0, 0);
    return sh.cnv;
  }

  var blurF = blur;

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
    self.postMessage(sh, [sh.N.buffer, sh.A.buffer, sh.A0.buffer, sh.T.buffer, sh.AO.buffer, sh.HG.buffer]);
  };
}
