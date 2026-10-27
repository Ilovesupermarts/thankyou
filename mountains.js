/* ============================================================
   MOUNTAINS — a range of real 3D mountains with a Fuji-like peak,
   drawn once on the graphics chip (WebGL 2) into a picture that the
   scene lays behind everything else. Nothing here runs per frame.

   What makes them look real:
   - The ground is a height map: eroded ridges (noise whose small
     bumps fade where the slope is steep, so the slopes run down in
     smooth gullies) mixed with sharp crests. The Fuji-like cone stands
     far behind, with a narrow flat summit, concave slopes and gullies
     running down from the top.
   - Every point is lit by the sun and shaded by the sky, and the ridges
     cast shadows (a ray is walked from each point towards the sun).
   - Snow lies above a snow line and only where the ground is gentle
     enough to hold it, so it runs down the gullies in streaks; on Fuji
     the cap runs further down in the gullies (tongues).
   - Lower slopes are forest in autumn colours (red, orange, gold, with
     evergreen), the forest thinning out to bare rock above a tree line.
   - The air: far ranges fade into a pale haze, and a low mist lies in
     the valleys between the ranges (霞). Optionally the furthest ranges
     fade into the page's own sky.

   Use:
     var cnv = Mountains.render(o);   // a canvas, or null (no WebGL 2)
   o (screen values are CSS px; the picture is o.width × o.height px,
   drawn for a screen of o.screenW × o.screenH CSS px):
     width, height        size of the picture (px)
     screenW, screenH     the screen it is drawn for (CSS px)
     horizon              CSS px from the top where the ground in front starts
     seed
     lens                 vertical field of view (degrees): small = telephoto
     rangeHeight          how high the ranges stand (fraction of the screen
                          height, for a range 20 km away)
     featureKm            size of the mountains' shapes (km)
     sharpness            0 rounded and eroded … 1 sharp crests
     layering             0 one continuous range … 1 distinct ranges, one
                          behind another, with mist between them
     rangeSpacing         km between those ranges
     nearestKm            the nearest range (km)
     fuji                 true / false
     fujiX, fujiHeight    where its summit is (fraction of screen width) and
                          how high (fraction of screen height above horizon)
     fujiWidth            half its base, in its own heights
     fujiKm               how far away it is (km)
     fujiGullies          0 … 1
     fujiSnow             how far down the cap reaches (fraction of its height)
     fujiTongues          how far the snow runs further down in the gullies
     snowLine             snow on the ranges above this fraction of their height
     snow                 0 … 1, how much snow lies there
     treeLine             forest below this fraction of the ranges' height
     autumn               0 green … 1 full autumn colour in the forest
     sunAzimuth           degrees: 0 = the sun straight ahead, -90 from the
                          left, 90 from the right, 180 from behind you
     sunElevation         degrees above the horizon
     sunColour, skyColour [r, g, b] 0 … 255
     sunStrength, ambient, shadows (0 … 1)
     haze, hazeKm         how strong the far haze is, and the distance at
                          which it is about two-thirds of the way there
     hazeColour, mistColour  [r, g, b]
     mist, mistHeightKm   the low mist in the valleys
     fadeToSky            0 … 1: how much the furthest ranges fade out
                          (become see-through) instead of only turning pale
     colours              { rock, fujiRock, forestRed, forestGold,
                            evergreen, snow } as [r, g, b]
   ============================================================ */
var Mountains = (function () {
'use strict';

var gl = null, cnv = null, prog = null, failed = false;
var grid = { cols: 0, rows: 0, vbo: null, ibo: null, count: 0 };
var U = {};

/* ---------- shared GLSL: the height of the ground at any (x, z) ---------- */
var HEIGHT_GLSL = [
'uniform vec2  uSeed;',
'uniform float uFeature, uSharp, uHs, uLayer, uSpacing, uNear, uFar, uRise, uTop;',
'uniform vec4  uFuji;        // x, z, height, base radius (km)',
'uniform vec2  uFujiG;       // gullies, flat summit radius (km)',
'uniform float uFujiOn;',
'uniform vec4  uFujiView;    // Fuji on the screen: x from the centre, half its base, its height (px); focal length (px)',
'uniform float uFujiClear;   // 0 ... 1: how much the ranges in front keep below it',
'const mat2 M2 = mat2(0.8, -0.6, 0.6, 0.8);',
'float hash(vec2 p) {',
'  uvec2 q = uvec2(ivec2(p) + ivec2(uSeed));',
'  uint h = q.x * 1597334677u ^ q.y * 3812015801u;',
'  h = (h ^ (h >> 16)) * 0x45d9f3bu; h ^= h >> 16;',
'  return float(h) * (1.0 / 4294967295.0);',
'}',
'// value noise with its slope (Inigo Quilez): x -1..1, yz the slope',
'vec3 noised(vec2 x) {',
'  vec2 p = floor(x), w = fract(x);',
'  vec2 u = w * w * w * (w * (w * 6.0 - 15.0) + 10.0);',
'  vec2 du = 30.0 * w * w * (w * (w - 2.0) + 1.0);',
'  float a = hash(p), b = hash(p + vec2(1, 0)), c = hash(p + vec2(0, 1)), d = hash(p + vec2(1, 1));',
'  float k1 = b - a, k2 = c - a, k4 = a - b - c + d;',
'  return vec3(-1.0 + 2.0 * (a + k1 * u.x + k2 * u.y + k4 * u.x * u.y), 2.0 * du * vec2(k1 + k4 * u.y, k2 + k4 * u.x));',
'}',
'// eroded ridges: each finer layer is damped where the slope so far is steep',
'float ranges(vec2 x, int oct) {',
'  vec2 p = x, d = vec2(0.0);',
'  float a = 0.0, b = 0.5, r = 0.0, rb = 0.5, rw = 1.0;',
'  for (int i = 0; i < 14; i++) {',
'    if (i >= oct) break;',
'    vec3 n = noised(p);',
'    d += n.yz;',
'    a += b * n.x / (1.0 + dot(d, d));',
'    float s = 1.0 - abs(n.x); s *= s;',
'    r += rb * s * rw; rw = clamp(s * 1.6, 0.0, 1.0);',
'    b *= 0.5; rb *= 0.5;',
'    p = M2 * p * 2.0;',
'  }',
'  float eroded = a * 0.9 + 0.42;',
'  float sharp = r * 1.15 - 0.12;',
'  return mix(eroded, sharp, uSharp);',
'}',
'float smax(float a, float b, float k) { float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0); return mix(a, b, h) + k * h * (1.0 - h); }',
'// the Fuji-like cone: x its height, y how deep in a gully (0 ... 1)',
'vec2 fujiAt(vec2 xz, int oct) {',
'  vec2 d = xz - uFuji.xy;',
'  float r = length(d), sh = uFujiG.y, R = uFuji.w, H = uFuji.z;',
'  float u = clamp((r - sh) / (R - sh), 0.0, 1.0);',
'  float h = H * pow(1.0 - u, 2.1);',
'  h -= H * 0.012 * (1.0 - smoothstep(0.0, sh, r));            // the shallow crater',
'  float th = atan(d.y, d.x);',
'  float g = 0.0;',
'  if (oct > 2) {',
'    vec3 n = noised(vec2(th * 9.0, r * 0.35) + vec2(37.0, 11.0));',
'    vec3 n2 = noised(vec2(th * 23.0, r * 0.9) + vec2(5.0, 71.0));',
'    float v = 1.0 - abs(n.x * 0.7 + n2.x * 0.3);',
'    g = pow(clamp(v, 0.0, 1.0), 5.0);',
'  }',
'  float band = smoothstep(0.02, 0.18, u) * (1.0 - smoothstep(0.55, 1.0, u));',
'  h -= H * 0.055 * uFujiG.x * g * band;',
'  return vec2(h * uFujiOn, g * band * uFujiOn);',
'}',
'float layerAt(float z) {',
'  float ph = (z - uNear) / uSpacing;',
'  float bump = 0.5 + 0.5 * cos(6.2831853 * ph);',
'  return mix(1.0, 0.25 + 0.95 * pow(bump, 1.6), uLayer);',
'}',
'float envAt(float z) { return smoothstep(uNear - 3.0, uNear + 2.5, z) * (1.0 - 0.35 * smoothstep(uFar * 0.6, uFar, z)); }',
'// the ranges\' own height, 0 ... about 1, the same near and far',
'float rangeN(vec2 xz, int oct) { return max(0.0, ranges(xz / uFeature, oct)) * layerAt(xz.y); }',
'// further ranges stand higher (foothills in front, high ranges behind)',
'float riseAt(float z) { return pow(clamp(z, 1.0, 36.0) / 20.0, uRise) * (1.0 - 0.45 * smoothstep(50.0, 120.0, z)); }',
'// the ranges near Fuji keep low enough for it to show',
'float clearFuji(vec2 xz, float h) {',
'  if (uFujiOn < 0.5 || uFujiClear <= 0.0) return h;',
'  // Fuji stands alone: the ranges fall away round its foot',
'  h *= mix(1.0, smoothstep(uFuji.w * 0.3, uFuji.w * 0.9, length(xz - uFuji.xy)), uFujiClear);',
'  // in front of it they keep below a third of its height on the screen, behind it below 60%',
'  float sx = uFujiView.w * xz.x / xz.y - uFujiView.x;',
'  float w = exp(-pow(sx / (uFujiView.z * 0.9), 2.0)) * uFujiClear;',
'  float k = mix(0.33, 0.6, smoothstep(uFuji.y - 4.0, uFuji.y + 4.0, xz.y));',
'  float hMax = 0.35 + k * uFujiView.z * xz.y / uFujiView.w;   // 0.35: the camera height',
'  return mix(h, min(h, hMax * 0.7 + h * 0.3), w);',
'}',
'float heightAt(vec2 xz, int oct) {',
'  float h = clearFuji(xz, rangeN(xz, oct) * uHs * envAt(xz.y) * riseAt(xz.y));',
'  if (uFujiOn > 0.5) h = smax(h, fujiAt(xz, oct).x, 0.25);',
'  return h;',
'}'
].join('\n');

var VS = [
'#version 300 es',
'precision highp float;',
'precision highp int;',
'in vec2 aGrid;               // x across the screen 0 ... 1, y 0 far ... 1 near',
'uniform vec2 uScreen;       // screen width, height (CSS px)',
'uniform float uF, uEye, uCamH;',
HEIGHT_GLSL,
'out vec3 vPos;',
'void main() {',
'  float z = 1.0 / mix(1.0 / uFar, 1.0 / (uNear - 4.0), aGrid.y);',
'  float sx = mix(-0.04, 1.04, aGrid.x) * uScreen.x;',
'  float x = (sx - uScreen.x * 0.5) * z / uF;',
'  float y = heightAt(vec2(x, z), 9);',
'  vPos = vec3(x, y, z);',
'  float cx = 2.0 * uF / uScreen.x * x;',
'  float cy = (1.0 - 2.0 * uEye / uScreen.y) * z + 2.0 * uF / uScreen.y * (y - uCamH);',
'  float zn = (z - (uNear - 5.0)) / (uFar - uNear + 5.0) * 2.0 - 1.0;',
'  gl_Position = vec4(cx, cy, zn * z, z);',
'}'
].join('\n');

var FS = [
'#version 300 es',
'precision highp float;',
'precision highp int;',
'uniform float uF, uCamH;',
HEIGHT_GLSL,
'uniform vec3 uSunDir, uSunCol, uSkyCol, uHazeCol, uMistCol;',
'uniform vec3 uRock, uFujiRock, uRed, uGold, uEver, uSnowCol;',
'uniform float uSnowLine, uSnow, uTreeLine, uAutumn, uFujiSnow, uTongues;',
'uniform float uShadows, uAmbient, uHaze, uHazeKm, uMist, uMistH, uFade;',
'in vec3 vPos;',
'out vec4 outCol;',
'float shadowAt(vec3 p, float e) {',
'  float res = 1.0, t = e * 4.0 + 0.06;',
'  for (int i = 0; i < 48; i++) {',
'    vec3 q = p + uSunDir * t;',
'    if (q.y > uTop) break;',
'    float d = q.y - heightAt(q.xz, 6) + 0.012 + t * 0.01;',
'    res = min(res, 10.0 * d / t);',
'    if (res < 0.0) break;',
'    t += clamp(d * 0.7, 0.04 + t * 0.02, 1.6);',
'    if (t > 40.0) break;',
'  }',
'  return smoothstep(0.0, 1.0, clamp(res, 0.0, 1.0));',
'}',
'void main() {',
'  vec3 p = vPos;',
'  float dist = length(p - vec3(0.0, uCamH, 0.0));',
'  float e = max(0.003, dist / uF * 1.2);                     // about one pixel on the ground (km)',
'  int oct = int(clamp(log2(uFeature / e) + 1.5, 4.0, 13.0));',
'  float hx = heightAt(p.xz + vec2(e, 0.0), oct) - heightAt(p.xz - vec2(e, 0.0), oct);',
'  float hz = heightAt(p.xz + vec2(0.0, e), oct) - heightAt(p.xz - vec2(0.0, e), oct);',
'  vec3 n = normalize(vec3(-hx, 2.0 * e, -hz));',
'  float h = heightAt(p.xz, oct);',
'  vec2 fj = fujiAt(p.xz, oct);',
'  float onFuji = uFujiOn * smoothstep(-0.05, 0.05, fj.x - (h - 0.02)) * step(0.02, fj.x);',
'  // small breaks in the ground, for the edges of snow and forest',
'  float n1 = noised(p.xz * 3.1 + 17.0).x, n2 = noised(p.xz * 11.0 + 3.0).x;',
'  float brk = n1 * 0.7 + n2 * 0.3;',
'  float slope = n.y;                                         // 1 flat ... 0 a cliff',
'  // --- the ranges: forest below the tree line, rock above, snow higher up',
'  float hr = rangeN(p.xz, oct) * envAt(p.z);',
'  float forest = (1.0 - smoothstep(uTreeLine - 0.08, uTreeLine + 0.08, hr + brk * 0.08)) * smoothstep(0.45, 0.7, slope);',
'  float m1 = noised(p.xz * 1.7 + 41.0).x, m2 = noised(p.xz * 5.3 + 9.0).x;',
'  vec3 autumnC = mix(uRed, uGold, smoothstep(-0.8, 0.9, m1 + m2 * 0.4));',
'  float ever = smoothstep(0.1, 0.7, noised(p.xz * 2.3 + 77.0).x + 0.25 * m2);',
'  vec3 green = mix(uEver, uGold * vec3(0.75, 0.9, 0.55), 0.35);',
'  vec3 forestC = mix(mix(green, autumnC, uAutumn), uEver, ever * 0.75);',
'  forestC *= 0.82 + 0.25 * m2;',
'  forestC = mix(forestC, vec3(dot(forestC, vec3(0.3, 0.55, 0.15))), 0.3) * 0.85;',
'  vec3 rockC = uRock * (0.86 + 0.22 * n1 + 0.1 * noised(vec2(p.y * 40.0, p.x * 2.0)).x);',
'  vec3 alb = mix(rockC, forestC, forest);',
'  float snowR = smoothstep(uSnowLine - 0.06, uSnowLine + 0.06, hr + brk * 0.1) * smoothstep(0.5, 0.75, slope + brk * 0.08) * uSnow;',
'  // --- Fuji: dark volcanic slopes, forest at its foot, the snow cap with tongues down the gullies',
'  if (uFujiOn > 0.5) {',
'    float hf = fj.x / max(uFuji.z, 0.001);',
'    vec3 fr = uFujiRock * (0.88 + 0.18 * n1);',
'    float fForest = 1.0 - smoothstep(0.18, 0.3, hf + brk * 0.04);',
'    vec3 fAlb = mix(fr, forestC, fForest);',
'    float line = 1.0 - uFujiSnow - uTongues * 0.22 * fj.y;',
'    float fSnow = smoothstep(line - 0.015, line + 0.015, hf + brk * 0.02 + n2 * 0.01) * smoothstep(0.25, 0.5, slope);',
'    alb = mix(alb, fAlb, onFuji);',
'    snowR = mix(snowR, max(fSnow, snowR * 0.3), onFuji);',
'  }',
'  alb = mix(alb, uSnowCol, clamp(snowR, 0.0, 1.0));',
'  // --- light',
'  float sh = mix(1.0, shadowAt(p + n * e * 2.0, e), uShadows);',
'  float dif = max(dot(n, uSunDir), 0.0) * sh;',
'  float sky = 0.55 + 0.45 * n.y;',
'  float bounce = max(0.0, -n.y * 0.5 + 0.2) * 0.25;',
'  vec3 col = alb * (uSunCol * dif + uSkyCol * sky * uAmbient + uSunCol * bounce * uAmbient);',
'  col += snowR * uSunCol * pow(max(dot(reflect(-uSunDir, n), vec3(0.0, 0.0, -1.0)), 0.0), 12.0) * 0.08 * sh;',
'  // --- the air: far haze, then mist lying low in the valleys',
'  float hzA = (1.0 - exp(-dist / uHazeKm)) * uHaze;',
'  col = mix(col, uHazeCol, hzA);',
'  float mist = uMist * exp(-max(p.y, 0.0) / uMistH) * (1.0 - exp(-dist / 8.0));',
'  col = mix(col, uMistCol, clamp(mist, 0.0, 1.0));',
'  float a = 1.0 - uFade * smoothstep(0.35, 1.0, hzA / max(uHaze, 0.001)) * uHaze;',
'  outCol = vec4(col * a, a);',
'}'
].join('\n');

function compile(type, src) {
  var s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.warn('Mountains: shader', gl.getShaderInfoLog(s));
    return null;
  }
  return s;
}
function init() {
  if (gl || failed) return !!gl;
  try {
    cnv = document.createElement('canvas');
    gl = cnv.getContext('webgl2', { premultipliedAlpha: true, preserveDrawingBuffer: true, antialias: true, alpha: true, depth: true });
  } catch (e) { gl = null; }
  if (!gl) { failed = true; return false; }
  var vs = compile(gl.VERTEX_SHADER, VS), fs = compile(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) { failed = true; gl = null; return false; }
  prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs);
  gl.bindAttribLocation(prog, 0, 'aGrid');
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.warn('Mountains: link', gl.getProgramInfoLog(prog));
    failed = true; gl = null; return false;
  }
  var n = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS);
  for (var i = 0; i < n; i++) {
    var name = gl.getActiveUniform(prog, i).name;
    U[name] = gl.getUniformLocation(prog, name);
  }
  cnv.addEventListener('webglcontextlost', function (ev) { ev.preventDefault(); gl = null; grid.cols = 0; });
  return true;
}
/* The ground is one grid: columns across the screen, rows spaced evenly
   in 1 / distance, so each row is about the same height on the screen. */
function buildGrid(cols, rows) {
  if (grid.cols === cols && grid.rows === rows) return;
  var v = new Float32Array((cols + 1) * (rows + 1) * 2), k = 0, i, j;
  for (j = 0; j <= rows; j++) for (i = 0; i <= cols; i++) { v[k++] = i / cols; v[k++] = j / rows; }
  var idx = new Uint32Array(cols * rows * 6); k = 0;
  for (j = 0; j < rows; j++) for (i = 0; i < cols; i++) {
    var a = j * (cols + 1) + i, b = a + 1, c = a + cols + 1, d = c + 1;
    idx[k++] = a; idx[k++] = c; idx[k++] = b; idx[k++] = b; idx[k++] = c; idx[k++] = d;
  }
  if (!grid.vbo) { grid.vbo = gl.createBuffer(); grid.ibo = gl.createBuffer(); }
  gl.bindBuffer(gl.ARRAY_BUFFER, grid.vbo);
  gl.bufferData(gl.ARRAY_BUFFER, v, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, grid.ibo);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
  grid.cols = cols; grid.rows = rows; grid.count = idx.length;
}

function c3(c) { return [c[0] / 255, c[1] / 255, c[2] / 255]; }
function d(o, k, v) { return o[k] === undefined ? v : o[k]; }

function render(o) {
  if (!init()) return null;
  var W = o.screenW, H = o.screenH;
  if (cnv.width !== o.width || cnv.height !== o.height) { cnv.width = o.width; cnv.height = o.height; }

  // The camera: a little above the ground, looking level. Its eye line sits
  // just above where the ground in front starts, so the far valleys show.
  var lens = d(o, 'lens', 22) * Math.PI / 180;
  var f = H / (2 * Math.tan(lens / 2));
  var eye = o.horizon - H * 0.012, camH = 0.35;
  var near = d(o, 'nearestKm', 8), far = 140;
  // How high the ranges stand: a peak 20 km away reaches rangeHeight of the screen.
  var Hs = (d(o, 'rangeHeight', 0.26) * H) * 20 / f * 1.9 + camH;
  // Fuji: its summit at fujiX across and fujiHeight above the ground line.
  var fz = d(o, 'fujiKm', 45), fx = (d(o, 'fujiX', 0.73) * W - W / 2) * fz / f;
  var fH = camH + (eye - (o.horizon - d(o, 'fujiHeight', 0.34) * H)) * fz / f;
  var fR = fH * d(o, 'fujiWidth', 2.6);
  var seed = d(o, 'seed', 7);

  gl.viewport(0, 0, cnv.width, cnv.height);
  gl.clearColor(0, 0, 0, 0);
  gl.clearDepth(1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LESS);
  gl.disable(gl.CULL_FACE);
  gl.useProgram(prog);

  var cols = Math.min(1600, Math.max(200, Math.round(cnv.width / 1.5)));
  var rows = Math.min(900, Math.max(150, Math.round(cnv.height / 1.2)));
  buildGrid(cols, rows);
  gl.bindBuffer(gl.ARRAY_BUFFER, grid.vbo);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, grid.ibo);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  function u1(n, v) { if (U[n]) gl.uniform1f(U[n], v); }
  function u2(n, a, b) { if (U[n]) gl.uniform2f(U[n], a, b); }
  function u3(n, c) { if (U[n]) gl.uniform3f(U[n], c[0], c[1], c[2]); }
  var az = d(o, 'sunAzimuth', -100) * Math.PI / 180, el = d(o, 'sunElevation', 22) * Math.PI / 180;
  var C = o.colours || {};
  var sunS = d(o, 'sunStrength', 1.15);
  var sunCol = c3(d(o, 'sunColour', [255, 247, 236])).map(function (v) { return v * sunS * 1.1; });

  u2('uScreen', W, H);
  u1('uF', f); u1('uEye', eye); u1('uCamH', camH);
  u2('uSeed', (seed * 7919) % 100003, (seed * 104729) % 100019);
  u1('uFeature', d(o, 'featureKm', 12));
  u1('uSharp', d(o, 'sharpness', 0.6));
  u1('uHs', Hs);
  u1('uLayer', d(o, 'layering', 0.5));
  u1('uSpacing', d(o, 'rangeSpacing', 9));
  u1('uNear', near); u1('uFar', far);
  var rise = d(o, 'farRise', 1.4);
  u1('uRise', rise);
  u1('uTop', Math.max(fH, Hs * Math.pow(36 / 20, rise) * 1.6) + 0.5);
  if (U.uFuji) gl.uniform4f(U.uFuji, fx, fz, fH, fR);
  u2('uFujiG', d(o, 'fujiGullies', 0.6), fH * 0.1);
  u1('uFujiOn', o.fuji === false ? 0 : 1);
  if (U.uFujiView) gl.uniform4f(U.uFujiView, fx * f / fz, fR * f / fz, (fH - camH) * f / fz, f);
  u1('uFujiClear', d(o, 'fujiClear', 0.9));
  u3('uSunDir', [Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)]);
  u3('uSunCol', sunCol);
  u3('uSkyCol', c3(d(o, 'skyColour', [178, 196, 226])));
  u3('uHazeCol', c3(d(o, 'hazeColour', [220, 205, 210])));
  u3('uMistCol', c3(d(o, 'mistColour', [251, 236, 224])));
  u3('uRock', c3(C.rock || [150, 132, 118]));
  u3('uFujiRock', c3(C.fujiRock || [84, 72, 80]));
  u3('uRed', c3(C.forestRed || [176, 74, 44]));
  u3('uGold', c3(C.forestGold || [212, 154, 68]));
  u3('uEver', c3(C.evergreen || [74, 90, 62]));
  u3('uSnowCol', c3(C.snow || [246, 246, 250]));
  u1('uSnowLine', d(o, 'snowLine', 0.85));
  u1('uSnow', d(o, 'snow', 0.6));
  u1('uTreeLine', d(o, 'treeLine', 0.8));
  u1('uAutumn', d(o, 'autumn', 0.75));
  u1('uFujiSnow', d(o, 'fujiSnow', 0.25));
  u1('uTongues', d(o, 'fujiTongues', 0.6));
  u1('uShadows', d(o, 'shadows', 0.85));
  u1('uAmbient', d(o, 'ambient', 0.55));
  u1('uHaze', d(o, 'haze', 0.72));
  u1('uHazeKm', d(o, 'hazeKm', 24));
  u1('uMist', d(o, 'mist', 0.6));
  u1('uMistH', d(o, 'mistHeightKm', 0.35));
  u1('uFade', d(o, 'fadeToSky', 0.3));

  gl.drawElements(gl.TRIANGLES, grid.count, gl.UNSIGNED_INT, 0);
  gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));   // waits for the drawing to finish, so it is timed truly
  return cnv;
}

return { render: render, supported: function () { return init(); } };
})();
