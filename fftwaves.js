/* ============================================================
   FFT WAVES — wind waves on the lake, simulated as real water waves are,
   on the graphics chip (WebGL 2). For water.js (it asks for them only
   when the page passes `fft` to Water.render; bamboo.html is the test bed).

   The method is the one of FFT-Ocean by Ivan Pensionerov
   (https://github.com/gasgiant/FFT-Ocean, MIT licence, © 2020 Ivan
   Pensionerov), after Tessendorf's "Simulating Ocean Water", made smaller
   for a lake and ported from Unity's compute shaders to WebGL 2's ordinary
   drawing passes:
   1. The recipe (worked out once, on the main processor, again only when
      the wind or the lake changes): for every wave length and direction,
      how strong the waves are, from the wind's speed, its direction and
      how far it has blown over the water (the fetch): the JONSWAP spectrum
      that oceanographers use, the spread of directions around the wind
      (Donelan-Banner and cos-2s, blended), the depth (TMA). Each wave gets
      a random strength and starting place (seeded, so the same every time).
   2. Each frame, on the graphics chip: every wave is moved on at its own
      speed (long waves faster than short ones; the shortest, a few cm,
      held up by surface tension, as on real water), and the slopes of the
      whole surface are added up from all of them at once with an inverse
      FFT (8 passes across and 8 down for a 256 grid).
   3. A last pass makes the slope picture water.js samples (with mipmaps,
      so far away the waves blur together smoothly): the slope across and
      along, sharpened a little at the crests (the "choppy" waves).
   Two sizes of tile at once ("cascades"): a large one (tens of metres) for
   the waves you see far out, a small one (a few metres) for the ripples
   near you; each holds only its own wave lengths, so nothing counts twice.
   Times are made to loop (every 10 minutes), so the numbers never get too
   big for the graphics chip.

   Use (from water.js, in its own graphics context):
     var sim = FFTWaves.create(gl)   → null if the chip can't draw into float pictures
     sim.update(o, time)             o: see DEFAULTS; time in seconds
     sim.texture                     the slopes (RGBA16F, mipmapped): xy the large tile, zw the small
     sim.L                           [large, small] tile sizes (m)
   ============================================================ */
var FFTWaves = (function () {
'use strict';
var DEFAULTS = {
  size: 256,          // the grid (128 or 256)
  wind: 3,            // the wind's speed (m/s, 10 m up)
  dir: 60,            // where it blows (degrees: 0 left to right across the screen, 90 away from you)
  fetch: 400,         // how far it has blown over the water (m)
  depth: 8,           // the lake's depth (m)
  spread: 0.85,       // 0: waves from every way, 1: lined up with the wind
  swell: 0,           // 0 … 1: how long-crested the waves are
  gamma: 3.3,         // the peak of the spectrum (JONSWAP's peak enhancement)
  fade: 0,            // fades the shortest waves (m)
  L0: 40, L1: 4,      // the two tiles (m)
  seed: 1
};
var TWO_PI = Math.PI * 2, G = 9.81, TENSION = 0.074 / 1000, LOOP = 600;

/* ---------- the recipe ---------- */
function omegaOf(k, depth) { return Math.sqrt((G * k + TENSION * k * k * k) * Math.tanh(Math.min(k * depth, 20))); }
function dOmegaDk(k, depth) {
  var th = Math.tanh(Math.min(k * depth, 20)), ch = Math.cosh(Math.min(k * depth, 20)), w = omegaOf(k, depth);
  return ((G + 3 * TENSION * k * k) * th + (G * k + TENSION * k * k * k) * depth / (ch * ch)) / (2 * w);
}
function normFactor(s) {
  var s2 = s * s, s3 = s2 * s, s4 = s3 * s;
  if (s < 5) return -0.000564 * s4 + 0.00776 * s3 - 0.044 * s2 + 0.192 * s + 0.163;
  return -4.80e-08 * s4 + 1.07e-05 * s3 - 9.53e-04 * s2 + 5.90e-02 * s + 3.93e-01;
}
function cosine2s(theta, s) { return normFactor(s) * Math.pow(Math.abs(Math.cos(0.5 * theta)), 2 * s); }
function spreadPower(w, wp) { return w > wp ? 9.77 * Math.pow(w / wp, -2.5) : 6.97 * Math.pow(w / wp, 5); }
function dbBeta(x) {
  if (x < 0.95) return 2.61 * Math.pow(x, 1.3);
  if (x < 1.6) return 2.28 * Math.pow(x, -1.3);
  return Math.pow(10, -0.4 + 0.8393 * Math.exp(-0.567 * Math.log(x * x)));
}
function donelanBanner(theta, w, wp) {
  var b = dbBeta(w / wp), sech = 1 / Math.cosh(b * theta);
  return b / 2 / Math.tanh(b * Math.PI) * sech * sech;
}
function wrapAngle(a) { while (a > Math.PI) a -= TWO_PI; while (a < -Math.PI) a += TWO_PI; return a; }
function direction(theta, w, wp, p) {
  var s = spreadPower(w, wp) + 16 * Math.tanh(Math.min(w / wp, 20)) * p.swell * p.swell;
  var d = wrapAngle(theta - p.dir * Math.PI / 180);
  // the cos-2s spread around the wind (lined up), blended with Donelan-Banner's (waves from more ways at the peak)
  return (1 - p.spread) * donelanBanner(d, w, wp) + p.spread * cosine2s(d, s);
}
function tma(w, depth) {
  var wh = w * Math.sqrt(depth / G);
  if (wh <= 1) return 0.5 * wh * wh;
  if (wh < 2) return 1 - 0.5 * (2 - wh) * (2 - wh);
  return 1;
}
function jonswap(w, p, alpha, wp) {
  var sigma = w <= wp ? 0.07 : 0.09, r = Math.exp(-(w - wp) * (w - wp) / (2 * sigma * sigma * wp * wp)), q = wp / w;
  return tma(w, p.depth) * alpha * G * G / Math.pow(w, 5) * Math.exp(-1.25 * q * q * q * q) * Math.pow(p.gamma, r);
}
// a seeded Gaussian random pair for each grid cell (Box-Muller), the same for the same seed and size
function noise(N, seed) {
  var a = (seed * 2654435761) >>> 0 || 1, out = new Float32Array(N * N * 4);
  function rnd() { a ^= a << 13; a >>>= 0; a ^= a >>> 17; a ^= a << 5; a >>>= 0; return (a + 0.5) / 4294967296; }
  for (var i = 0; i < N * N * 2; i++) {
    var u = rnd(), v = rnd(), m = Math.sqrt(-2 * Math.log(u));
    out[i * 2] = m * Math.cos(TWO_PI * v); out[i * 2 + 1] = m * Math.sin(TWO_PI * v);
  }
  return out;
}
/* The starting waves of one tile: for each cell, h0(k) and the conjugate of h0(-k) (so the surface is real).
   Only wave numbers between kLo and kHi (this tile's share). */
function spectrum(p, N, L, kLo, kHi, nz, off) {
  var alpha = 0.076 * Math.pow(G * p.fetch / (p.wind * p.wind), -0.22);
  var wp = 22 * Math.pow(p.wind * p.fetch / (G * G), -0.33);
  var dk = TWO_PI / L, h0 = new Float32Array(N * N * 2), out = new Float32Array(N * N * 4);
  for (var j = 0; j < N; j++) for (var i = 0; i < N; i++) {
    var nx = i < N / 2 ? i : i - N, ny = j < N / 2 ? j : j - N;
    var kx = nx * dk, kz = ny * dk, k = Math.hypot(kx, kz), idx = j * N + i;
    if (k < kLo || k > kHi || k === 0) continue;
    var w = omegaOf(k, p.depth);
    var S = jonswap(w, p, alpha, wp) * direction(Math.atan2(kz, kx), w, wp, p) * Math.exp(-p.fade * p.fade * k * k);
    var amp = Math.sqrt(Math.max(0, 2 * S * Math.abs(dOmegaDk(k, p.depth)) / k * dk * dk));
    h0[idx * 2] = nz[(off + idx) * 2] * amp; h0[idx * 2 + 1] = nz[(off + idx) * 2 + 1] * amp;
  }
  for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
    var a = y * N + x, b = ((N - y) % N) * N + (N - x) % N;
    out[a * 4] = h0[a * 2]; out[a * 4 + 1] = h0[a * 2 + 1];
    out[a * 4 + 2] = h0[b * 2]; out[a * 4 + 3] = -h0[b * 2 + 1];
  }
  return out;
}

/* ---------- the passes ---------- */
var VS = '#version 300 es\nvoid main() { vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2); gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0); }';
var HEAD = '#version 300 es\nprecision highp float;\nprecision highp int;\nprecision highp sampler2D;\n' +
  'vec2 cmul(vec2 a, vec2 b) { return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x); }\n';
// each wave moved on to the time, and turned into its share of the slopes (sx + i sz) and of the crests' sharpening (Dxx + i Dzz)
var FS_TIME = HEAD + [
'uniform sampler2D uH0a, uH0b;',
'uniform float uN, uDk0, uDk1, uT, uDepth, uW0;',
'layout(location = 0) out vec4 oS;',
'layout(location = 1) out vec4 oD;',
'void wave(vec4 h0, vec2 k, out vec2 s, out vec2 d) {',
'  float kl = length(k);',
'  float w = sqrt((9.81 * kl + 0.000074 * kl * kl * kl) * tanh(min(kl * uDepth, 20.0)));',
'  w = floor(w / uW0) * uW0;                       // so the waves loop',
'  float ph = mod(w * uT, 6.28318530718);',
'  vec2 e = vec2(cos(ph), sin(ph));',
'  vec2 h = cmul(h0.xy, e) + cmul(h0.zw, vec2(e.x, -e.y));',
'  vec2 ih = vec2(-h.y, h.x);',
'  float inv = kl > 0.0 ? 1.0 / kl : 0.0;',
'  s = ih * k.x - h * k.y;',
'  d = -h * k.x * k.x * inv - ih * k.y * k.y * inv;',
'}',
'void main() {',
'  ivec2 ij = ivec2(gl_FragCoord.xy);',
'  vec2 n = vec2(ij); n -= uN * step(uN * 0.5, n);',
'  vec2 s0, d0, s1, d1;',
'  wave(texelFetch(uH0a, ij, 0), n * uDk0, s0, d0);',
'  wave(texelFetch(uH0b, ij, 0), n * uDk1, s1, d1);',
'  oS = vec4(s0, s1); oD = vec4(d0, d1);',
'}'].join('\n');
// one pass of the inverse FFT (Stockham), across or down; each picture holds two complex fields
var FS_FFT = HEAD + [
'uniform sampler2D uA, uB;',
'uniform float uN, uS;',
'uniform int uDown;',
'layout(location = 0) out vec4 oA;',
'layout(location = 1) out vec4 oB;',
'void main() {',
'  ivec2 p = ivec2(gl_FragCoord.xy);',
'  float idx = float(uDown == 1 ? p.y : p.x), hs = uS * 0.5;',
'  float ev = floor(idx / uS) * hs + mod(idx, hs), od = ev + uN * 0.5;',
'  float arg = 6.28318530718 * mod(idx, uS) / uS;',
'  vec2 tw = vec2(cos(arg), sin(arg));',
'  ivec2 pe = uDown == 1 ? ivec2(p.x, int(ev)) : ivec2(int(ev), p.y);',
'  ivec2 po = uDown == 1 ? ivec2(p.x, int(od)) : ivec2(int(od), p.y);',
'  vec4 a = texelFetch(uA, pe, 0), b = texelFetch(uA, po, 0);',
'  oA = vec4(a.xy + cmul(tw, b.xy), a.zw + cmul(tw, b.zw));',
'  a = texelFetch(uB, pe, 0); b = texelFetch(uB, po, 0);',
'  oB = vec4(a.xy + cmul(tw, b.xy), a.zw + cmul(tw, b.zw));',
'}'].join('\n');
// the slope picture: the slopes, sharpened at the crests, and how high the waves are
var FS_MERGE = HEAD + [
'uniform sampler2D uA, uB;',
'uniform float uHeight, uChop;',
'out vec4 o;',
'void main() {',
'  ivec2 p = ivec2(gl_FragCoord.xy);',
'  vec4 s = texelFetch(uA, p, 0) * uHeight, d = texelFetch(uB, p, 0) * uHeight * uChop;',
'  o = vec4(s.x / max(0.2, 1.0 + d.x), s.y / max(0.2, 1.0 + d.y), s.z / max(0.2, 1.0 + d.z), s.w / max(0.2, 1.0 + d.w));',
'}'].join('\n');

function create(gl) {
  if (!gl || !gl.getExtension('EXT_color_buffer_float')) return null;
  var aniso = gl.getExtension('EXT_texture_filter_anisotropic');
  function compile(type, src) {
    var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn('fft waves:', gl.getShaderInfoLog(s)); return null; }
    return s;
  }
  function program(fs, names) {
    var v = compile(gl.VERTEX_SHADER, VS), f = compile(gl.FRAGMENT_SHADER, fs);
    if (!v || !f) return null;
    var pr = gl.createProgram(); gl.attachShader(pr, v); gl.attachShader(pr, f); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { console.warn('fft waves:', gl.getProgramInfoLog(pr)); return null; }
    var u = {}; names.forEach(function (n) { u[n] = gl.getUniformLocation(pr, n); });
    return { p: pr, u: u };
  }
  var PT = program(FS_TIME, ['uH0a', 'uH0b', 'uN', 'uDk0', 'uDk1', 'uT', 'uDepth', 'uW0']);
  var PF = program(FS_FFT, ['uA', 'uB', 'uN', 'uS', 'uDown']);
  var PM = program(FS_MERGE, ['uA', 'uB', 'uHeight', 'uChop']);
  if (!PT || !PF || !PM) return null;

  var N = 0, key = '', h0a = null, h0b = null, pp = [], fbs = [], slope = null, slopeFb = null, nz = null, nzKey = '', lastSrc = 0;
  var sim = { texture: null, L: [DEFAULTS.L0, DEFAULTS.L1], ms: 0, rebuilt: 0 };

  function tex(w, fmt, type, internal, data, mip) {
    var t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, w, 0, fmt, type, data || null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mip ? gl.LINEAR_MIPMAP_LINEAR : gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, mip ? gl.LINEAR : gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    return t;
  }
  function fbo(ts) {
    var f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f);
    ts.forEach(function (t, i) { gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, t, 0); });
    gl.drawBuffers(ts.map(function (t, i) { return gl.COLOR_ATTACHMENT0 + i; }));
    var ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    return ok ? f : null;
  }
  function free() {
    [h0a, h0b, slope].concat(pp).forEach(function (t) { if (t) gl.deleteTexture(t); });
    fbs.concat([slopeFb]).forEach(function (f) { if (f) gl.deleteFramebuffer(f); });
    h0a = h0b = slope = slopeFb = null; pp = []; fbs = [];
  }
  function allocate(n) {
    free(); N = n;
    // two pairs of pictures (slopes, sharpening), drawn into back and forth
    for (var i = 0; i < 4; i++) pp.push(tex(N, gl.RGBA, gl.FLOAT, gl.RGBA32F));
    fbs = [fbo([pp[0], pp[1]]), fbo([pp[2], pp[3]])];
    slope = tex(N, gl.RGBA, gl.HALF_FLOAT, gl.RGBA16F, null, true);
    if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
    slopeFb = fbo([slope]);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return !!(fbs[0] && fbs[1] && slopeFb);
  }
  function rebuild(p) {
    var t0 = performance.now(), n = p.size >= 256 ? 256 : 128;
    if (n !== N && !allocate(n)) { sim.texture = null; return false; }
    var nk = n + ':' + p.seed;
    if (nzKey !== nk) { nz = noise(n, p.seed); nzKey = nk; }
    // each tile holds its own wave lengths: the large one up to 6 of the small tile's longest waves, the small one the rest
    var kB = TWO_PI / p.L1 * 6;
    var A = spectrum(p, n, p.L0, 1e-4, kB, nz, 0), B = spectrum(p, n, p.L1, kB, 1e9, nz, n * n);
    if (h0a) gl.deleteTexture(h0a); if (h0b) gl.deleteTexture(h0b);
    h0a = tex(n, gl.RGBA, gl.FLOAT, gl.RGBA32F, A); h0b = tex(n, gl.RGBA, gl.FLOAT, gl.RGBA32F, B);
    sim.L = [p.L0, p.L1]; sim.rebuilt = performance.now() - t0;
    return true;
  }
  function bindTex(unit, t, loc) { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t); gl.uniform1i(loc, unit); }

  sim.update = function (o, time) {
    var p = {}, k;
    for (k in DEFAULTS) p[k] = (o && o[k] !== undefined) ? o[k] : DEFAULTS[k];
    p.wind = Math.max(0.3, p.wind); p.fetch = Math.max(1, p.fetch); p.depth = Math.max(0.2, p.depth);
    p.L1 = Math.min(p.L1, p.L0 * 0.5);
    var nk = [p.size, p.wind, p.dir, p.fetch, p.depth, p.spread, p.swell, p.gamma, p.fade, p.L0, p.L1, p.seed].join(',');
    if (nk !== key) { key = nk; if (!rebuild(p)) return null; }
    if (!h0a) return null;
    var t0 = performance.now();
    gl.disable(gl.BLEND); gl.disable(gl.DEPTH_TEST);
    gl.viewport(0, 0, N, N);
    // 1. the waves at this time
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbs[0]);
    gl.useProgram(PT.p);
    bindTex(0, h0a, PT.u.uH0a); bindTex(1, h0b, PT.u.uH0b);
    gl.uniform1f(PT.u.uN, N); gl.uniform1f(PT.u.uDk0, TWO_PI / p.L0); gl.uniform1f(PT.u.uDk1, TWO_PI / p.L1);
    gl.uniform1f(PT.u.uT, ((time % LOOP) + LOOP) % LOOP); gl.uniform1f(PT.u.uDepth, p.depth); gl.uniform1f(PT.u.uW0, TWO_PI / LOOP);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    // 2. the inverse FFT, across then down
    gl.useProgram(PF.p);
    gl.uniform1f(PF.u.uN, N);
    var src = 0;
    for (var down = 0; down < 2; down++) {
      gl.uniform1i(PF.u.uDown, down);
      for (var s = 2; s <= N; s *= 2) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbs[1 - src]);
        bindTex(0, pp[src * 2], PF.u.uA); bindTex(1, pp[src * 2 + 1], PF.u.uB);
        gl.uniform1f(PF.u.uS, s);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        src = 1 - src;
      }
    }
    lastSrc = src;
    // 3. the slope picture, and its mipmaps
    gl.bindFramebuffer(gl.FRAMEBUFFER, slopeFb);
    gl.useProgram(PM.p);
    bindTex(0, pp[src * 2], PM.u.uA); bindTex(1, pp[src * 2 + 1], PM.u.uB);
    gl.uniform1f(PM.u.uHeight, o && o.height !== undefined ? o.height : 1);
    gl.uniform1f(PM.u.uChop, o && o.chop !== undefined ? o.chop : 0.8);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, slope);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, null);
    sim.texture = slope; sim.ms = performance.now() - t0;
    return slope;
  };
  // for checking: the FFT's result (before the last pass), [sx0, sz0, sx1, sz1] per cell, read back to the main processor
  sim.debugRead = function () {
    var out = new Float32Array(N * N * 4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbs[lastSrc]);
    gl.readBuffer(gl.COLOR_ATTACHMENT0);
    gl.readPixels(0, 0, N, N, gl.RGBA, gl.FLOAT, out);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return out;
  };
  sim.size = function () { return N; };
  sim.free = free;
  return sim;
}
return { create: create, DEFAULTS: DEFAULTS, _spectrum: spectrum, _noise: noise };
})();
