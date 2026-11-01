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
          water            the water's own colour, [r, g, b] 0 … 255
          sun              the sparkle's strength (0: none); sunX, sunY: the sun on the
                           screen (CSS px); sunColour [r, g, b]
   ============================================================ */
var Water = (function () {
'use strict';
var LATCH_KEY = 'waterLatch1', LATCH_MS = 12 * 3600 * 1000;
var cnv = null, gl = null, prog = null, U = {}, texM = null, texN = null, normalReady = false, lost = false, failed = false, mirrorW = 1, mirrorH = 1;

function latched() {
  try { var t = parseFloat(localStorage.getItem(LATCH_KEY) || '0'); return t > 0 && Date.now() - t < LATCH_MS; } catch (e) { return false; }
}
function unlatch() { try { localStorage.removeItem(LATCH_KEY); } catch (e) { /* silent */ } lost = false; failed = false; }

var VS = '#version 300 es\n' +
  'out vec2 vUv;\n' +
  'void main() { vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2); vUv = vec2(p.x * 0.5, 1.0 - p.y * 0.5); gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0); }';
var FS = [
'#version 300 es',
'precision highp float;',
'uniform sampler2D uMirror, uNormal;',
'uniform vec2 uSize;            // the water on the screen (CSS px)',
'uniform float uTop, uHy, uF, uPad, uMirrorW, uTime, uDistort, uWave, uReflect, uSun;',
'uniform vec3 uWater, uSunCol, uSunDir;',
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
'void main() {',
'  float x = vUv.x * uSize.x, yIn = vUv.y * uSize.y, y = uTop + yIn;',
'  float d = max(0.6, y - uHy), z = uF / d, wx = (x - uSize.x * 0.5) * z / uF;',
'  vec3 n = waves(vec2(wx, z));',
'  vec3 V = normalize(vec3(-wx, 1.0, -z));                    // from the water toward the eye (at height 1)',
'  float cosT = clamp(dot(V, n), 0.0, 1.0);',
'  float fres = clamp((0.02 + 0.98 * pow(1.0 - cosT, 5.0)) * uReflect * 1.3, 0.0, 1.0);',
'  // the mirrored picture, moved by the slope of the waves (more near you, where they look bigger)',
'  float near = clamp(d / max(1.0, uSize.y + uTop - uHy), 0.0, 1.0);',
'  vec2 disp = vec2(n.x, n.z) * uDistort * (0.2 + 0.8 * near);',
'  vec2 m = vec2((x + uPad + disp.x) / uMirrorW, (yIn + disp.y) / uSize.y);',
'  vec3 refl = texture(uMirror, clamp(m, vec2(0.0005), vec2(0.9995))).rgb;',
'  // the water\'s own colour, a little lighter on the slopes turned up to the sky',
'  vec3 body = uWater * (0.82 + 0.3 * (n.y - 0.9));',
'  vec3 col = mix(body, refl, fres);',
'  // the sun\'s sparkle, where a slope reflects it toward you',
'  vec3 Rr = reflect(-uSunDir, n);',
'  float spec = pow(max(0.0, dot(Rr, V)), 180.0) * uSun;',
'  col += uSunCol * spec;',
'  outColor = vec4(col, 1.0);',
'}'
].join('\n');

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
  ['uMirror', 'uNormal', 'uSize', 'uTop', 'uHy', 'uF', 'uPad', 'uMirrorW', 'uTime', 'uDistort', 'uWave', 'uReflect', 'uSun', 'uWater', 'uSunCol', 'uSunDir']
    .forEach(function (k) { U[k] = gl.getUniformLocation(prog, k); });
  texM = gl.createTexture(); texN = gl.createTexture();
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
  if (!gl || lost || !normalReady || mirrorW < 2 || gl.isContextLost()) return null;
  var w = Math.max(2, Math.round(o.w)), h = Math.max(2, Math.round(o.h));
  if (cnv.width !== w || cnv.height !== h) { cnv.width = w; cnv.height = h; }
  gl.viewport(0, 0, w, h);
  gl.useProgram(prog);
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texM); gl.uniform1i(U.uMirror, 0);
  gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, texN); gl.uniform1i(U.uNormal, 1);
  gl.uniform2f(U.uSize, o.cssW, o.cssH);
  gl.uniform1f(U.uTop, o.top); gl.uniform1f(U.uHy, o.horizon); gl.uniform1f(U.uF, o.lens);
  gl.uniform1f(U.uPad, o.pad); gl.uniform1f(U.uMirrorW, o.cssW + o.pad * 2);
  gl.uniform1f(U.uTime, o.time); gl.uniform1f(U.uDistort, o.distort); gl.uniform1f(U.uWave, o.waveSize || 1);
  gl.uniform1f(U.uReflect, o.reflect);
  gl.uniform3f(U.uWater, o.water[0] / 255, o.water[1] / 255, o.water[2] / 255);
  gl.uniform1f(U.uSun, o.sun || 0);
  var sc = o.sunColour || [255, 245, 225];
  gl.uniform3f(U.uSunCol, sc[0] / 255, sc[1] / 255, sc[2] / 255);
  // toward the sun, from the water: across from where it is on the screen, up by its height above the eye line
  var sx = ((o.sunX || o.cssW / 2) - o.cssW / 2) / o.lens, sy = Math.max(0.02, (o.horizon - (o.sunY || 0)) / o.lens), sl = Math.hypot(sx, sy, 1);
  gl.uniform3f(U.uSunDir, sx / sl, sy / sl, 1 / sl);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  return cnv;
}
function state() {
  if (latched()) return 'latched';
  if (lost) return 'lost';
  if (failed) return 'none';
  if (!gl) return 'none';
  return normalReady ? 'ok' : 'loading';
}
return { init: init, state: state, setMirror: setMirror, render: render, unlatch: unlatch };
})();
