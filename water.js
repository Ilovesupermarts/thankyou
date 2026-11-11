/* ============================================================
   WATER — the lake's surface, drawn on the graphics chip (WebGL 2), pixel
   by pixel, as water is drawn in a game engine.

   The method is the one of three.js's Water (examples/jsm/objects/Water.js,
   MIT licence, © 2010-2024 three.js authors): a normal map of small wave
   slopes (textures/waternormals.jpg, from three.js, MIT licence) is sampled
   four times at different sizes, each copy drifting its own way, and added
   up into the slope of the water at that point. Then, for every pixel:
   - the mirrored picture of the scene (sky, mountains, Fuji, the far shore,
     the headland and its pagoda, the torii and the lanterns, baked by the
     page) is looked up a little to the side and up or down, by that slope:
     so the reflections ripple softly, more near you, less far away;
   - how much is mirror and how much is the water's own deep colour follows
     the angle you look at the water (Fresnel): far away, at a glancing
     angle, almost all mirror; near you, looking down into it, mostly its
     own colour; and every little wave turned toward you or away from you
     is a little darker or brighter, so the surface rolls;
   - where a wave's slope reflects the sun toward you, a bright sparkle.
   Nothing else is drawn here: the page lays this picture down, then the
   shallows, the floating leaves and the shore over it.

   Safety latch (as trunks.js): if the graphics chip ever takes this
   context away, it is remembered for 12 hours and the page draws its own
   2D water instead, so it can't keep taking the chip from the mountains
   and the trees. Water.unlatch() switches it back on.

   Use:
     Water.init(url)            load the normal map (the page's own copy)
     Water.state()              'ok', 'loading', 'lost', 'latched' or 'none'
     Water.setMirror(canvas)    the mirrored picture (upload once, when baked)
     Water.render(o)            → the picture (a canvas), or null
       o: w, h            size of the picture (px)
          cssW, cssH       the water's size on the screen (CSS px): the screen's
                           width, and from the far shore (top) to the bottom
          top, horizon     CSS px from the top of the screen: the far shore, the eye line
          lens             focal length (CSS px): a point on the water d px below the eye
                           line is lens / d eye heights away
          pad              the mirror picture is wider than the screen by this (CSS px) each side
          time             seconds
          distort          how far the waves move the reflections (CSS px, near you)
          waveSize         the size of the waves (1 = as tuned)
          reflect          0 … 1: how strong the mirror is
          mirror           (optional) 0 … 1: when set, everything is mirrored as real water mirrors it, by
                           the full Fresnel of the angle (far away almost a mirror, near you little), times
                           this; reflect is then not used
          water            the water's own colour, [r, g, b] 0 … 255
          sun              the sparkle's strength (0: none); sunX, sunY: the sun on the
                           screen (CSS px); sunColour [r, g, b]
          fft              (optional, needs fftwaves.js) the waves simulated instead of the
                           normal map: FFTWaves's values (wind, dir, fetch, …), plus
                           eye (m: the eye's height above the water, which sets how big
                           the simulated waves look), height and chop, detail (0.05 … 1: how
                           sharp the far waves stay, 1 = as a plain mipmap), far (0 … 1: how far
                           the waves still push the reflections far away) and shade (how much
                           each wave lightens or darkens the reflection). waveSize is not used then.
          calm             (optional) 0 … 1: the waves flattened toward still water (a winter lake); 0 = as they are
          rain             (optional) 0 … 1: rain on the water, rings where the drops land; rainT
                           its clock (s, 0 … 4096, wrapping), rainSky [r, g, b] the sky's light in them
     Water.fftState()           'ok', 'none' (no fftwaves.js, or the chip can't draw float pictures)
     Water.fftInfo()            { ms, rebuilt, size }: the time to submit a frame's FFT, and the last rebuild
   ============================================================ */
var Water = (function () {
'use strict';
var LATCH_KEY = 'waterLatch1', LATCH_MS = 12 * 3600 * 1000;
var cnv = null, gl = null, prog = null, U = {}, progF = null, UF = {}, fftSim = null, fftFailed = false, texM = null, texN = null, normalReady = false, lost = false, failed = false, mirrorW = 1, mirrorH = 1;

function latched() {
  try { var t = parseFloat(localStorage.getItem(LATCH_KEY) || '0'); return t > 0 && Date.now() - t < LATCH_MS; } catch (e) { return false; }
}
function unlatch() { try { localStorage.removeItem(LATCH_KEY); } catch (e) { /* silent */ } lost = false; failed = false; }

var VS = '#version 300 es\n' +
  'out vec2 vUv;\n' +
  'void main() { vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2); vUv = vec2(p.x, 1.0 - p.y); gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0); }';
var FS = [
'#version 300 es',
'precision highp float;',
'uniform sampler2D uMirror, uNormal;',
'uniform float uMirror0;        // (o.mirror) > 0: everything mirrored by the full Fresnel of the angle, times this',
'uniform vec2 uSize;            // the water on the screen (CSS px)',
'uniform float uTop, uHy, uF, uPad, uMirrorW, uTime, uDistort, uWave, uReflect, uSun, uFarK, uShade;',
'uniform float uCalm;           // (o.calm) 0 … 1: the waves flattened toward still water (0: as they are)',
'uniform vec3 uWater, uSunCol, uSunDir;',
'uniform float uRain, uRainT, uPx;   // rain: how hard (0 none … 1), its clock (s, wraps at RAIN_WRAP), CSS px per pixel drawn',
'uniform vec3 uRainSky;              // the light of the sky the rain-roughened water shows',
'in vec2 vUv;',
'out vec4 outColor;',
'// the slope of the water at p (eye heights on the ground): the normal map four times, each its own size and drift',
'vec3 waves(vec2 p) {',
'  p /= uWave;',
'  vec2 uv0 = p / 2.1 + vec2(uTime / 17.0, uTime / 29.0);',
'  vec2 uv1 = p / 2.4 - vec2(uTime / -19.0, uTime / 31.0);',
'  vec2 uv2 = p / vec2(17.0, 19.0) + vec2(uTime / 101.0, uTime / 97.0);',
'  vec2 uv3 = p / vec2(6.8, 6.2) - vec2(uTime / 109.0, uTime / -113.0);',
'  vec4 n = texture(uNormal, uv0) + texture(uNormal, uv1) + texture(uNormal, uv2) + texture(uNormal, uv3);',
'  n = n * 0.5 - 1.0;',
'  return normalize(vec3(n.x * 1.5, n.z, n.y * 1.5));        // y is up',
'}',
'// RAIN ON THE WATER. Each raindrop that lands sends out a ring of small waves (two or three crests, the',
'// short ones leading) that spreads at a walking pace and dies away in a second or two; the rings bend the',
'// reflection like any wave. They are worked out on the water itself (eye heights), so they are ellipses in',
'// perspective. Drops land in cells of a grid, one now and then in each, at a random spot and moment (the',
'// same hash as rainDrops in app.js, which draws the little jets thrown up where the near ones land).',
'uint rh(uint x) { x ^= x >> 16u; x *= 0x7feb352du; x ^= x >> 15u; x *= 0x846ca68bu; x ^= x >> 16u; return x; }',
'float rh3(int a, int b, int c) { return float(rh(uint(a) * 1597334677u ^ rh(uint(b) * 3812015801u ^ rh(uint(c) + 0x9e3779b9u)))) / 4294967295.0; }',
'// one size of drop: cs the cell, P the time between drops in a cell, v how fast the ring spreads, lam its',
'// wavelength, life how fast it dies away. fx, fz: the water under one pixel, across and in depth. g: the slope',
'// (d/dx, d/dz); blip: where a ring is too small to see as a ring, the fleck of light of its splash.',
'void rainLayer(vec2 p, float fx, float fz, int L, float cs, float P, float v, float lam, float life, float dens, float reach, inout vec2 g, inout float blip) {',
'  ivec2 c0 = ivec2(floor(p / cs));',
'  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {',
'    ivec2 c = c0 + ivec2(i, j);',
'    // a cell whose drops all land further off than a ring reaches: nothing from it here',
'    vec2 lo = (vec2(c) + 0.2) * cs, hi = (vec2(c) + 0.8) * cs;',
'    vec2 gap = max(max(lo - p, p - hi), 0.0);',
'    if (gap.x > reach + 3.0 * fx || gap.y > reach + 3.0 * fz) continue;',
'    int cx = c.x + 32768, cz = c.y + 32768;',
'    float N = max(1.0, floor(4096.0 / (P * (0.7 + 0.6 * rh3(cx, cz, L * 8 + 1))) + 0.5)), Pc = 4096.0 / N;',
'    float tt = uRainT + rh3(cx, cz, L * 8 + 2) * Pc, n = floor(tt / Pc), age = tt - n * Pc;',
'    int k = int(mod(n, N));',
'    if (rh3(cx, cz, L * 8 + 3 + k * 64) > dens) continue;',
'    vec2 ctr = (vec2(c) + 0.2 + 0.6 * vec2(rh3(cx, cz, L * 8 + 4 + k * 64), rh3(cx, cz, L * 8 + 5 + k * 64))) * cs;',
'    float s = 0.55 + 0.9 * rh3(cx, cz, L * 8 + 6 + k * 64);',
'    vec2 dv = p - ctr; float r = length(dv);',
'    float env = exp(-age / (life * s)) * smoothstep(0.0, 0.05, age);',
'    // the splash itself: a fleck of light, the first moments',
'    vec2 q = dv / vec2(fx, fz);',
'    // (faded out where a pixel covers a good part of a cell: a fleck spread wider than the cells looked at',
'    // would show their edges as a grid; far off the rain shows only as the dulled mirror below)',
'    blip += s * exp(-age / 0.12) * exp(-dot(q, q) / 2.0) * (1.0 - smoothstep(0.25, 0.4, 3.0 * max(fx, fz) / cs));',
'    if (r < 1e-4 || env < 0.01) continue;',
'    vec2 dir = dv / r;',
'    float fr = length(dir * vec2(fx, fz));',
'    // a ring too fine for the pixels is drawn as fine as they allow, and fainter',
'    float lw = lam * s, lamE = max(lw, 3.6 * fr), w = lamE * 1.15;',
'    float x = r - v * age * (0.8 + 0.4 * s);',
'    if (abs(x) > 3.0 * w) continue;',
'    // a ring fades out before it reaches further than the cells looked at (reach): cut off there, its edge would',
'    // show as a grid line, mostly far away, where a ring can only be drawn far wider than it is',
'    float fit = 1.0 - smoothstep(0.7 * reach, reach, v * age * (0.8 + 0.4 * s) + 3.0 * w);',
'    if (fit <= 0.0) continue;',
'    float kk = 6.2831853 / lamE, ga = exp(-x * x / (w * w)) * fit;',
'    float dh = ga * (cos(kk * x) - 2.0 * x / (kk * w * w) * sin(kk * x));',
'    g += dir * (0.9 * s * env * dh * sqrt(lw / lamE));',
'  }',
'}',
'void main() {',
'  float x = vUv.x * uSize.x, yIn = vUv.y * uSize.y, y = uTop + yIn;',
'  float d = max(0.6, y - uHy), z = uF / d, wx = (x - uSize.x * 0.5) * z / uF;',
'  vec3 n = waves(vec2(wx, z));',
'  vec2 rg = vec2(0.0); float blip = 0.0;',
'  if (uRain > 0.001) {',
'    float fx = z / uF * uPx, fz = z * z / uF * uPx;',
'    rainLayer(vec2(wx, z), fx, fz, 0, 0.8, 2.6, 0.28, 0.06, 0.55, 0.85 * uRain, 0.7, rg, blip);         // big drops',
'    if (z < 16.0) rainLayer(vec2(wx, z), fx, fz, 1, 0.32, 1.3, 0.18, 0.035, 0.3, uRain, 0.28, rg, blip);   // small drops (further off, too small to see)',
'    n = normalize(vec3(n.x - rg.x, n.y, n.z - rg.y));',
'  }',
'  n = normalize(mix(n, vec3(0.0, 1.0, 0.0), uCalm));',
'  vec3 V = normalize(vec3(-wx, 1.0, -z));                    // from the water toward the eye (at height 1)',
'  float cosT = clamp(dot(V, n), 0.0, 1.0);',
'  // how much is mirror (Fresnel): with o.mirror, as real water: the full amount for the angle, the same for the sky,',
'  // the mountains and the shores (far away almost a mirror, near you mostly the water\'s own colour); otherwise damped',
'  float fres = clamp((0.02 + 0.98 * pow(1.0 - cosT, 5.0)) * (uMirror0 > 0.0 ? uMirror0 : uReflect * 1.3), 0.0, 1.0);',
'  // the mirrored picture, moved by the slope of the waves (more near you, where they look bigger)',
'  float near = clamp(d / max(1.0, uSize.y + uTop - uHy), 0.0, 1.0);',
'  vec2 disp = vec2(n.x, n.z) * uDistort * (uFarK + (1.0 - uFarK) * near);',
'  vec2 m = vec2((x + uPad + disp.x) / uMirrorW, (yIn + disp.y) / uSize.y);',
'  vec3 refl = texture(uMirror, clamp(m, vec2(0.0005), vec2(0.9995))).rgb;',
'  // each wave turned toward you shows a lighter patch of sky, turned away a darker one: the surface reads everywhere, not just in the sun',
'  refl *= 1.0 + uShade * clamp(-3.0 * n.z + 1.5 * n.x, -1.0, 1.0);',
'  // the water\'s own colour, a little lighter on the slopes turned up to the sky',
'  vec3 body = uWater * (0.82 + 0.3 * (n.y - 0.9));',
'  vec3 col = mix(body, refl, fres);',
'  // the sun\'s sparkle, where a slope reflects it toward you',
'  vec3 Rr = reflect(-uSunDir, n);',
'  float spec = pow(max(0.0, dot(Rr, V)), 180.0) * uSun;',
'  col += uSunCol * spec;',
'  if (uRain > 0.001) {',
'    // a crest turned toward you shows the sky higher up (lighter), one turned away the water (darker);',
'    // the splashes are flecks of the sky\'s light; and the whole surface, roughened, reflects a little less',
'    // sharply, more so far away where the rings are too small to tell apart',
'    float tilt = clamp(rg.y * 4.0 - rg.x * 0.6, -0.7, 1.0);',
'    col = mix(col, tilt > 0.0 ? uRainSky : col * 0.7, abs(tilt) * 0.7);',
'    col = mix(col, uRainSky, clamp(blip, 0.0, 1.0) * 0.75);',
'    col = mix(col, uRainSky * 0.92 + body * 0.08, uRain * 0.16 * (1.0 - near));',
'  }',
'  outColor = vec4(col, 1.0);',
'}'
].join('\n');
// the same, with the slopes of the simulated waves (fftwaves.js) instead of the normal map:
// two tiles (large and small), in metres on the water (the eye uEye metres above it)
var FS_FFT = FS.replace(/vec3 waves\(vec2 p\) \{[\s\S]*?\n\}\n/, [
'uniform sampler2D uSlope;',
'uniform float uEye, uL0, uL1, uDetail;',
'vec3 waves(vec2 p) {',
'  vec2 q = p * uEye;',
'  vec2 a = q / uL0, b = q / uL1;',
'  // uDetail < 1: sample a sharper mip than the distance asks for, so far waves are not averaged to flat',
'  vec2 s = textureGrad(uSlope, a, dFdx(a) * uDetail, dFdy(a) * uDetail).xy + textureGrad(uSlope, b, dFdx(b) * uDetail, dFdy(b) * uDetail).zw;',
'  return normalize(vec3(-s.x, 1.0, -s.y));',
'}', ''].join('\n'));

function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
function compile(type, src) {
  var s = gl.createShader(type);
  gl.shaderSource(s, src); gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn('water shader:', gl.getShaderInfoLog(s)); return null; }
  return s;
}
function setup() {
  if (gl || failed) return !!gl;
  if (latched()) return false;
  try {
    cnv = document.createElement('canvas'); cnv.width = cnv.height = 2;
    gl = cnv.getContext('webgl2', { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false, preserveDrawingBuffer: true, powerPreference: 'low-power' });
  } catch (e) { gl = null; }
  if (!gl) { failed = true; return false; }
  cnv.addEventListener('webglcontextlost', function (e) {
    e.preventDefault(); lost = true;
    try { localStorage.setItem(LATCH_KEY, String(Date.now())); } catch (er) { /* silent */ }
  });
  var vs = compile(gl.VERTEX_SHADER, VS), fs = compile(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) { failed = true; gl = null; return false; }
  prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.warn('water:', gl.getProgramInfoLog(prog)); failed = true; gl = null; return false; }
  NAMES.forEach(function (k) { U[k] = gl.getUniformLocation(prog, k); });
  texM = gl.createTexture(); texN = gl.createTexture();
  return true;
}
var NAMES = ['uMirror', 'uNormal', 'uSize', 'uTop', 'uHy', 'uF', 'uPad', 'uMirrorW', 'uTime', 'uDistort', 'uWave', 'uReflect', 'uSun', 'uWater', 'uSunCol', 'uSunDir', 'uFarK', 'uShade', 'uRain', 'uRainT', 'uPx', 'uRainSky', 'uMirror0', 'uCalm'];
/* The simulated waves (fftwaves.js), made the first time a page asks for them. */
function fftSetup() {
  if (fftSim) return true;
  if (fftFailed || typeof FFTWaves === 'undefined' || !gl) return false;
  fftSim = FFTWaves.create(gl);
  var vs = fftSim && compile(gl.VERTEX_SHADER, VS), fs = fftSim && compile(gl.FRAGMENT_SHADER, FS_FFT);
  if (!vs || !fs) { fftFailed = true; fftSim = null; return false; }
  progF = gl.createProgram(); gl.attachShader(progF, vs); gl.attachShader(progF, fs); gl.linkProgram(progF);
  if (!gl.getProgramParameter(progF, gl.LINK_STATUS)) { console.warn('water (fft):', gl.getProgramInfoLog(progF)); fftFailed = true; fftSim = null; return false; }
  NAMES.concat(['uSlope', 'uEye', 'uL0', 'uL1', 'uDetail']).forEach(function (k) { UF[k] = gl.getUniformLocation(progF, k); });
  return true;
}
/* The normal map: the page's copy of three.js's waternormals.jpg. If it can't be loaded, one is made here
   from smooth noise (softer, but the water still works). */
function init(url) {
  if (!setup()) return;
  var img = new Image();
  img.onload = function () { if (gl && !lost) { uploadNormal(img); } };
  img.onerror = function () { if (gl && !lost) uploadNormal(makeNormal()); };
  img.src = url;
}
function uploadNormal(src) {
  try {
    gl.bindTexture(gl.TEXTURE_2D, texN);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, src);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    normalReady = true;
  } catch (e) {                                               // e.g. a picture the browser won't hand over (a page opened from a file)
    if (src.tagName === 'IMG') uploadNormal(makeNormal()); else failed = true;
  }
}
function makeNormal() {
  var N = 256, c = document.createElement('canvas'); c.width = c.height = N;
  var x = c.getContext('2d'), im = x.createImageData(N, N), h = new Float32Array(N * N);
  function hash(i, j) { var s = Math.sin(((i % 32 + 32) % 32) * 127.1 + ((j % 32 + 32) % 32) * 311.7) * 43758.5453; return s - Math.floor(s); }
  function vn(px, py, f) {
    var gx = px * f / N, gy = py * f / N, i = Math.floor(gx), j = Math.floor(gy), u = gx - i, v = gy - j;
    u = u * u * (3 - 2 * u); v = v * v * (3 - 2 * v);
    function H(a, b) { return hash(((a % f) + f) % f + 0, ((b % f) + f) % f + 0); }
    return (H(i, j) * (1 - u) + H(i + 1, j) * u) * (1 - v) + (H(i, j + 1) * (1 - u) + H(i + 1, j + 1) * u) * v;
  }
  for (var py = 0; py < N; py++) for (var px = 0; px < N; px++) h[py * N + px] = vn(px, py, 8) * 0.6 + vn(px, py, 16) * 0.3 + vn(px, py, 32) * 0.1;
  for (var y = 0; y < N; y++) for (var xx = 0; xx < N; xx++) {
    var dx = h[y * N + (xx + 1) % N] - h[y * N + (xx + N - 1) % N], dy = h[((y + 1) % N) * N + xx] - h[((y + N - 1) % N) * N + xx];
    var nx = -dx * 6, ny = -dy * 6, nz = 1, l = Math.hypot(nx, ny, nz), k = (y * N + xx) * 4;
    im.data[k] = (nx / l * 0.5 + 0.5) * 255; im.data[k + 1] = (ny / l * 0.5 + 0.5) * 255; im.data[k + 2] = (nz / l * 0.5 + 0.5) * 255; im.data[k + 3] = 255;
  }
  x.putImageData(im, 0, 0);
  return c;
}
function setMirror(src) {
  if (!gl || lost || !src || src.width < 2) return;
  gl.bindTexture(gl.TEXTURE_2D, texM);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  mirrorW = src.width; mirrorH = src.height;
}
function render(o) {
  if (!gl || lost || mirrorW < 2 || gl.isContextLost()) return null;
  var useFft = !!(o.fft && fftSetup() && fftSim.update(o.fft, o.time));
  if (!useFft && !normalReady) return null;
  var w = Math.max(2, Math.round(o.w)), h = Math.max(2, Math.round(o.h));
  if (cnv.width !== w || cnv.height !== h) { cnv.width = w; cnv.height = h; }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, w, h);
  var u = useFft ? UF : U;
  gl.useProgram(useFft ? progF : prog);
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texM); gl.uniform1i(u.uMirror, 0);
  gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, texN); gl.uniform1i(u.uNormal, 1);
  gl.uniform1f(u.uMirror0, o.mirror || 0);
  gl.uniform1f(u.uCalm, clamp01(o.calm || 0));
  if (useFft) {
    gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, fftSim.texture); gl.uniform1i(u.uSlope, 2);
    gl.uniform1f(u.uEye, o.fft.eye || 1.6); gl.uniform1f(u.uDetail, o.fft.detail !== undefined ? o.fft.detail : 0.2); gl.uniform1f(u.uL0, fftSim.L[0]); gl.uniform1f(u.uL1, fftSim.L[1]);
  }
  gl.uniform2f(u.uSize, o.cssW, o.cssH);
  gl.uniform1f(u.uTop, o.top); gl.uniform1f(u.uHy, o.horizon); gl.uniform1f(u.uF, o.lens);
  gl.uniform1f(u.uPad, o.pad); gl.uniform1f(u.uMirrorW, o.cssW + o.pad * 2);
  gl.uniform1f(u.uTime, o.time); gl.uniform1f(u.uDistort, o.distort); gl.uniform1f(u.uWave, o.waveSize || 1);
  gl.uniform1f(u.uReflect, o.reflect);
  gl.uniform1f(u.uFarK, useFft && o.fft.far !== undefined ? o.fft.far : 0.2); gl.uniform1f(u.uShade, useFft && o.fft.shade !== undefined ? o.fft.shade : 0);
  gl.uniform3f(u.uWater, o.water[0] / 255, o.water[1] / 255, o.water[2] / 255);
  gl.uniform1f(u.uSun, o.sun || 0);
  var sc = o.sunColour || [255, 245, 225];
  gl.uniform3f(u.uSunCol, sc[0] / 255, sc[1] / 255, sc[2] / 255);
  // toward the sun, from the water: across from where it is on the screen, up by its height above the eye line
  var sx = ((o.sunX || o.cssW / 2) - o.cssW / 2) / o.lens, sy = Math.max(0.02, (o.horizon - (o.sunY || 0)) / o.lens), sl = Math.hypot(sx, sy, 1);
  gl.uniform3f(u.uSunDir, sx / sl, sy / sl, 1 / sl);
  gl.uniform1f(u.uRain, o.rain || 0); gl.uniform1f(u.uRainT, o.rainT || 0); gl.uniform1f(u.uPx, o.cssW / w);
  var rs = o.rainSky || [200, 204, 212];
  gl.uniform3f(u.uRainSky, rs[0] / 255, rs[1] / 255, rs[2] / 255);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  return cnv;
}
/* Before the water is first shown (the app, while the name stands still): the simulated waves' shaders are
   made and, given the waves' values, their first shape worked out, so the first frame of the lake has neither to do. */
function warm(fft) {
  if (!gl || lost || gl.isContextLost()) return false;
  if (!fftSetup()) return false;
  if (fft) fftSim.update(fft, 0);
  return true;
}
function fftState() { return fftSim ? 'ok' : (typeof FFTWaves === 'undefined' || fftFailed ? 'none' : 'waiting'); }
function fftInfo() { return fftSim ? { ms: fftSim.ms, rebuilt: fftSim.rebuilt, size: fftSim.size() } : null; }
function state() {
  if (latched()) return 'latched';
  if (lost) return 'lost';
  if (failed) return 'none';
  if (!gl) return 'none';
  return normalReady ? 'ok' : 'loading';
}
return { init: init, warm: warm, state: state, setMirror: setMirror, render: render, unlatch: unlatch, fftState: fftState, fftInfo: fftInfo };
})();
