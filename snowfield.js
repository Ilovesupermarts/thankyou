/* ============================================================
   SNOWFIELD — the snow-covered ground in front of the mountains,
   drawn once on the graphics chip (WebGL 2) for the winter scene.
   Nothing here runs per frame.

   The ground is a row of gentle swells, one behind another (the scene
   gives the crest line of each). Every point of every swell is lit as
   real snow is lit:
   - Each point has a slope: sideways, from how its crest rises and
     falls, and toward you, from where it is on the face of its swell
     (flat on top, turned toward you lower down, flat again in the
     hollow at its foot). Long, low drifts run across it, and fine wind
     ripples (sastrugi) lie across the wind, smaller and fainter further
     away, fading out before they are too small to draw.
   - Sunlight falls on the faces turned to the sun; snow lets light in a
     little, so the edge between light and shade is soft. The faces
     turned away are lit only by the sky, which is why snow in shade is
     blue. The hollows between the swells get less of the sky (darker).
   - A fine grain, and the far swells fade into the haze and the mist
     at the horizon.

   Use:
     var cnv = Snowfield.render(o, i, y0, y1);   // swell i alone (everything below
                                         // its crest), or all of them for i = -1;
                                         // only the rows y0 … y1 (CSS px) if given
                                         // (then the canvas is only that tall);
                                         // a canvas o.width × o.height, or null
                                         // (no WebGL 2). Copy it away before the
                                         // next call: the same canvas is reused.
     Snowfield.state()                   // 'ok', 'lost' (try again soon) or 'none'
     Snowfield.losses()                  // how many times the context was taken away
     var map = Snowfield.sunMap(o);      // the same picture, as how much sun
                                         // falls on each point (its alpha)
     var lit = Snowfield.material(mask, height, m);   // snow lying on something
                                         // (the torii, the branches): see MATERIAL
                                         // below; { img, sx, sy, w, h }: the picture is
                                         // that part of img (copy it away before the next
                                         // call), or null
   o (screen values are CSS px; the picture is drawn for a screen of
   o.screenW × o.screenH CSS px):
     width, height       size of the picture (px)
     screenW, screenH
     horizon             the ground line (CSS px from the top)
     swells              [{ crest: Float32Array, u, haze }] from far to near:
                         crest  the crest's height on the screen at
                                crest.length points evenly across from
                                x = -20 to x = screenW + 20
                         u      0 the furthest … 1 the nearest
                         haze   0 … 1, how much it fades into the haze
     sunAzimuth          degrees: -90 from the left, 0 from straight ahead
                         (behind the mountains), 90 from the right
     sunElevation        degrees
     sunColour, skyColour, hazeColour   [r, g, b] 0 … 255
     sunStrength, ambient
     snow                the colour of the snow [r, g, b]
     blue                0 … 1: how blue the shade is
     relief              how strongly the swells rise and fall sideways
     roll                how strongly their faces turn toward you
     drifts              0 … 1: long, low drifts across the field
     ripples             0 … 1: wind ripples
     rippleSize          their size (in camera heights)
     rippleAngle         degrees: which way their crests run (0 = across the
                         screen, 90 = straight toward you)
     grain               0 … 1: the fine grain of the snow
     hollows             0 … 1: how much darker the hollows are
     sheen               0 … 1: the bright sheen where the sun glances off
     seed
   ============================================================ */
var Snowfield = (function () {
'use strict';

var gl = null, cnv = null, prog = null, failed = false, tex = null, vbo = null;
var U = {};
var MAXS = 24;

var VS = [
'#version 300 es',
'in vec2 aPos;',
'void main() { gl_Position = vec4(aPos, 0.0, 1.0); }'
].join('\n');

var FS = [
'#version 300 es',
'precision highp float;',
'precision highp int;',
'uniform sampler2D uCrest;      // one row per swell: the crest\'s screen y across the screen',
'uniform int   uN, uOnly, uNx, uMode;',
'uniform vec4  uSw[' + MAXS + '];   // u, haze, -, -',
'uniform vec2  uScreen;          // CSS px',
'uniform float uScale, uHorizon, uLens, uSeed, uTop, uPicH;   // uTop: the picture\'s top on the screen (CSS px), uPicH its height (px)',
'uniform vec3  uSunDir, uSunCol, uSkyCol, uHazeCol, uSnow;',
'uniform float uAmbient, uRelief, uRoll, uDrifts, uRipples, uRipSize, uRipAng, uGrain, uHollows, uSheen;',
'out vec4 outCol;',
'float hash(vec2 p) {',
'  uvec2 q = uvec2(ivec2(floor(p)) + ivec2(int(uSeed) * 37, int(uSeed) * 101));',
'  uint h = q.x * 1597334677u ^ q.y * 3812015801u;',
'  h = (h ^ (h >> 16)) * 0x45d9f3bu; h ^= h >> 16;',
'  return float(h) * (1.0 / 4294967295.0);',
'}',
'float vnoise(vec2 x) {',
'  vec2 p = floor(x), w = fract(x);',
'  vec2 u = w * w * (3.0 - 2.0 * w);',
'  float a = hash(p), b = hash(p + vec2(1, 0)), c = hash(p + vec2(0, 1)), d = hash(p + vec2(1, 1));',
'  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y) * 2.0 - 1.0;',
'}',
'float fbm(vec2 x) { float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * vnoise(x); x = mat2(0.8, -0.6, 0.6, 0.8) * x * 2.03; a *= 0.5; } return s; }',
'float crest(int i, float x) {',
'  float fx = clamp((x + 20.0) / (uScreen.x + 40.0), 0.0, 1.0) * float(uNx - 1);',
'  int j = int(floor(fx)); int j1 = min(j + 1, uNx - 1);',
'  return mix(texelFetch(uCrest, ivec2(j, i), 0).r, texelFetch(uCrest, ivec2(j1, i), 0).r, fract(fx));',
'}',
'// the ripples\' height on the ground at (X, Z) (camera heights): long ridges across the wind, broken up',
'float ripH(vec2 g) {',
'  float a = radians(uRipAng);',
'  vec2 q = mat2(cos(a), -sin(a), sin(a), cos(a)) * g / uRipSize;',
'  float n = fbm(q * vec2(0.35, 1.0) * 0.7);',
'  float r = sin((q.y + n * 1.2) * 6.2831853);',
'  r = 1.0 - abs(r);                                   // sharp crests, as wind ripples have',
'  return (r * r - 0.4) * (0.55 + 0.45 * vnoise(q * 0.21 + 7.0));',
'}',
'void main() {',
'  float x = gl_FragCoord.x / uScale;',
'  float y = uTop + (uPicH - gl_FragCoord.y) / uScale;',
'  // which swell this point is on: the nearest one whose crest is above it (or only uOnly)',
'  int own = -1; float yc = 0.0;',
'  if (uOnly >= 0) { yc = crest(uOnly, x); if (y >= yc - 1.0) own = uOnly; }',
'  else for (int i = ' + (MAXS - 1) + '; i >= 0; i--) { if (i >= uN) continue; float c = crest(i, x); if (y >= c - 1.0) { own = i; yc = c; break; } }',
'  if (own < 0) discard;',
'  float edge = clamp((y - yc) * uScale + 0.5, 0.0, 1.0);',
'  float d = max(0.0, y - yc);',
'  float nextC = own + 1 < uN ? crest(own + 1, x) : uScreen.y + (uScreen.y - uHorizon) * 0.4;',
'  float gap = max(2.0, nextC - yc);',
'  float s = d / gap;                                   // 0 the crest … 1 the next crest',
'  vec4 SW = uSw[own];',
'  // where it is on the ground (camera heights): further = smaller on the screen',
'  float below = max(0.75, y - uHorizon);',
'  float Z = uLens / below, X = (x - uScreen.x * 0.5) * Z / uLens;',
'  float fpZ = Z * Z / uLens;                           // ground per pixel, up the screen',
'  // the slopes: sideways from the crest line, toward you down the face',
'  float dc = (crest(own, x + 4.0) - crest(own, x - 4.0)) / 8.0;',
'  float side = exp(-s * 1.6);',
'  float nx = dc * uRelief * 7.0 * side;',
'  float nz = uRoll * 0.55 * sin(3.14159 * clamp(s * 1.15, 0.0, 1.0)) * (0.6 + 0.4 * SW.x);',
'  // long, low drifts',
'  if (uDrifts > 0.0) {',
'    vec2 g = vec2(X, Z) * 0.18;',
'    float e = 0.15;',
'    float h0 = fbm(g), hx = fbm(g + vec2(e, 0.0)), hz = fbm(g + vec2(0.0, e));',
'    float fade = 1.0 - smoothstep(0.6, 2.5, fpZ * 0.18);',
'    nx -= (hx - h0) / e * 0.18 * uDrifts * fade;',
'    nz += (hz - h0) / e * 0.18 * uDrifts * fade;',
'  }',
'  // wind ripples, fading out before they get too small to draw',
'  if (uRipples > 0.0) {',
'    float fade = 1.0 - smoothstep(uRipSize * 0.08, uRipSize * 0.35, fpZ);',
'    if (fade > 0.0) {',
'      vec2 g = vec2(X, Z);',
'      float e = uRipSize * 0.06;',
'      float h0 = ripH(g), hx = ripH(g + vec2(e, 0.0)), hz = ripH(g + vec2(0.0, e));',
'      float k = uRipples * fade * 0.035 * uRipSize / e;',
'      nx -= (hx - h0) * k;',
'      nz += (hz - h0) * k;',
'    }',
'  }',
'  vec3 n = normalize(vec3(nx, 1.0, nz));',
'  // --- light: soft-edged sunlight (light goes a little way into snow), blue sky light in the shade',
'  float ndl = dot(n, uSunDir);',
'  float dif = clamp((ndl + 0.18) / 1.18, 0.0, 1.0);',
'  dif = dif * dif * (3.0 - 2.0 * dif) * smoothstep(-0.02, 0.06, uSunDir.y);',
'  float hollow = 1.0 - uHollows * 0.5 * smoothstep(0.5, 1.0, s) * smoothstep(1.25, 0.95, s);',
'  float hdif = 1.0 - uHollows * 0.6 * smoothstep(0.62, 1.0, s) * smoothstep(1.25, 0.95, s);   // the sun reaches less into the hollows too',
'  float sky = (0.62 + 0.38 * n.y) * hollow;',
'  if (uMode == 1) { outCol = vec4(dif * edge); return; }',
'  vec3 col = uSnow * (uSunCol * dif * hdif + uSkyCol * sky * uAmbient);',
'  // the sheen where the sun glances off toward you',
'  vec3 hv = normalize(uSunDir + vec3(0.0, 0.25, 1.0));',
'  col += uSunCol * uSheen * 0.35 * pow(max(dot(n, hv), 0.0), 18.0) * dif;',
'  // the grain',
'  float gr = hash(gl_FragCoord.xy) - 0.5;',
'  col *= 1.0 + gr * 0.035 * uGrain;',
'  // the haze: each swell its own, and all of them thicker toward the horizon',
'  float hz = clamp(SW.y + (1.0 - SW.y) * 0.5 * exp(-(y - uHorizon) / max(4.0, (uScreen.y - uHorizon) * 0.12)), 0.0, 1.0);',
'  col = mix(col, uHazeCol, hz);',
'  // a soft shoulder, so the brightest snow keeps a little shape instead of clipping to flat white',
'  col = mix(col, 0.82 + 0.18 * (1.0 - exp(-(col - 0.82) / 0.18)), step(0.82, col));',
'  outCol = vec4(clamp(col, 0.0, 1.0) * edge, edge);',
'}'
].join('\n');

/* ---------- MATERIAL — snow lying on things (the torii's beams, the branches) ----------
   The caller draws where the snow is (mask: its alpha, soft at the edges) and the same
   drawn blurred (height: its alpha); the blur turns the flat outline into a rounded
   pillow, highest in the middle and curving down to its edges, so every pixel has a
   slope. The pillow faces mostly up (it lies on top of something) and a little toward
   you. Each pixel is then lit as the snowfield is: soft-edged sunlight on the side
   turned to the sun, blue sky light in the shade, and less of both underneath where it
   sits on the wood (contact). Light shows through the thin edges when the sun is behind
   it (glow); a fine bumpiness catches the light (grain), and here and there a crystal
   glints (sparkle). m (screen values; directions with x right, y up, z toward you):
     sunDir, sunColour (0 … 1.5), skyColour (0 … 1), ambient, blue (0 … 1),
     snow [r, g, b] 0 … 255, thick (how round: the slope at the edges), grain, glow,
     contact, sparkle (0 … 1), haze (0 … 1), hazeColour [r, g, b] 0 … 255, seed */
var MAT_FS = [
'#version 300 es',
'precision highp float;',
'uniform sampler2D uMask, uHeight;',
'uniform vec2  uSize;',
'uniform float uThick, uGrain, uGlow, uContact, uSparkle, uAmbient, uHaze, uSeed;',
'uniform vec3  uSunDir, uSunCol, uSkyCol, uSnow, uHazeCol;',
'out vec4 outCol;',
'float hash(vec2 p) { p = fract(p * vec2(443.897, 441.423) + uSeed * 0.013); p += dot(p, p.yx + 19.19); return fract((p.x + p.y) * p.x); }',
'float vnoise(vec2 x) {',
'  vec2 p = floor(x), w = fract(x), u = w * w * (3.0 - 2.0 * w);',
'  return mix(mix(hash(p), hash(p + vec2(1, 0)), u.x), mix(hash(p + vec2(0, 1)), hash(p + vec2(1, 1)), u.x), u.y) * 2.0 - 1.0;',
'}',
'float body(vec2 px) { return texture(uHeight, px / uSize).a; }',
'// the surface: the rounded pillow, with a fine bumpiness on it',
'float hgt(vec2 px) {',
'  float b = body(px);',
'  return pow(b, 0.75) + uGrain * 0.006 * (0.75 * vnoise(px * 0.22) + 0.25 * vnoise(px * 0.6 + 7.0)) * smoothstep(0.0, 0.3, b);',
'}',
'void main() {',
'  vec2 px = gl_FragCoord.xy;',
'  float a = texture(uMask, px / uSize).a;',
'  if (a < 0.004) discard;',
'  float hx = hgt(px + vec2(1.0, 0.0)) - hgt(px - vec2(1.0, 0.0));',
'  float hy = hgt(px + vec2(0.0, 1.0)) - hgt(px - vec2(0.0, 1.0));',
'  // snow lying on something faces mostly up, to the sky, and a little toward you; the rounding',
'  // tips it toward its edges (over the top, down at its foot, out at its ends)',
'  vec3 n = normalize(vec3(-hx * uThick, -hy * uThick, 0.0) + vec3(0.0, 0.8, 0.6));',
'  float core = body(px);                                   // 0 at the edge ... 1 deep inside',
'  // sunlight: soft-edged, as light goes a little way into snow',
'  float ndl = dot(n, uSunDir);',
'  float dif = clamp((ndl + 0.25) / 1.25, 0.0, 1.0);',
'  dif = dif * dif * (3.0 - 2.0 * dif) * smoothstep(-0.05, 0.1, uSunDir.y + 0.08);',
'  // underneath, where it sits on the wood, it gets less of the sun and the sky',
'  float under = clamp(-n.y, 0.0, 1.0) * (1.0 - 0.5 * core);',
'  float occ = 1.0 - uContact * 0.65 * under;',
'  float sky = (0.62 + 0.38 * n.y) * occ;',
'  vec3 col = uSnow * (uSunCol * dif * mix(1.0, occ, 0.6) + uSkyCol * sky * uAmbient);',
'  // light through the thin edges, when the sun is low and in front of you (behind the snow)',
'  float thin = pow(1.0 - clamp(core * 1.5, 0.0, 1.0), 2.0);',
'  col += uSnow * uSunCol * uGlow * 0.55 * thin * clamp(-uSunDir.z + 0.25, 0.0, 1.0) * smoothstep(-0.02, 0.12, uSunDir.y);',
'  // here and there a crystal glints toward you',
'  vec3 hv = normalize(uSunDir + vec3(0.0, 0.0, 1.0));',
'  float gl = step(1.0 - 0.025 * uSparkle, hash(floor(px / 2.0))) * pow(max(dot(n, hv), 0.0), 24.0) * dif;',
'  col += uSunCol * gl * 1.2;',
'  col = mix(col, 0.82 + 0.18 * (1.0 - exp(-(col - 0.82) / 0.18)), step(0.82, col));   // a soft shoulder, not flat white',
'  col = mix(col, uHazeCol, uHaze);',
'  outCol = vec4(clamp(col, 0.0, 1.0) * a, a);',
'}'
].join('\n');
var prog2 = null, U2 = {}, texM = null, texH = null;

function compile(type, src) {
  var s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn('Snowfield: shader', gl.getShaderInfoLog(s)); return null; }
  return s;
}
/* One canvas and one WebGL context for the whole life of the page. When
   the tablet runs short of graphics memory, Chrome may take the context
   away for a moment ("lost") and give it back ("restored"); the program
   and buffers are then made again on it. A new context is never asked for
   in its place: after a loss Chrome may refuse new ones. While it is lost,
   render() returns null and state() says 'lost': try again a moment later. */
var lost = false, ready = false, losses = 0, lostAt = 0, renewals = 0;   // losses: how many times the context was taken away
function create() {
  if (cnv) return !!gl;
  try {
    cnv = document.createElement('canvas');
    gl = cnv.getContext('webgl2', { premultipliedAlpha: true, preserveDrawingBuffer: false, antialias: false, alpha: true, depth: false });
  } catch (e) { gl = null; }
  if (!gl) { failed = true; return false; }
  cnv.addEventListener('webglcontextlost', function (ev) { ev.preventDefault(); if (this !== cnv) return; lost = true; ready = false; losses++; lostAt = performance.now(); U = {}; lastUp = null; });
  cnv.addEventListener('webglcontextrestored', function () { if (this === cnv) lost = false; });
  return true;
}
function setup() {
  var vs = compile(gl.VERTEX_SHADER, VS), fs = compile(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) { if (!gl.isContextLost()) failed = true; return false; }
  prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs);
  gl.bindAttribLocation(prog, 0, 'aPos');
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    if (!gl.isContextLost()) { console.warn('Snowfield: link', gl.getProgramInfoLog(prog)); failed = true; }
    return false;
  }
  U = {};
  var n = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS);
  for (var i = 0; i < n; i++) { var name = gl.getActiveUniform(prog, i).name; U[name.replace(/\[0\]$/, '')] = gl.getUniformLocation(prog, name); }
  vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  tex = gl.createTexture();
  // the material's program
  var vs2 = compile(gl.VERTEX_SHADER, VS), fs2 = compile(gl.FRAGMENT_SHADER, MAT_FS);
  if (!vs2 || !fs2) { if (!gl.isContextLost()) failed = true; return false; }
  prog2 = gl.createProgram();
  gl.attachShader(prog2, vs2); gl.attachShader(prog2, fs2);
  gl.bindAttribLocation(prog2, 0, 'aPos');
  gl.linkProgram(prog2);
  if (!gl.getProgramParameter(prog2, gl.LINK_STATUS)) {
    if (!gl.isContextLost()) { console.warn('Snowfield: material link', gl.getProgramInfoLog(prog2)); failed = true; }
    return false;
  }
  U2 = {};
  var n2 = gl.getProgramParameter(prog2, gl.ACTIVE_UNIFORMS);
  for (var i2 = 0; i2 < n2; i2++) { var nm = gl.getActiveUniform(prog2, i2).name; U2[nm] = gl.getUniformLocation(prog2, nm); }
  texM = gl.createTexture(); texH = gl.createTexture();
  lastUp = null;
  ready = true;
  return true;
}
function init() {
  if (failed || !create()) return false;
  // after a reset of the graphics chip Chrome may never give the context back: after 8 s, ask for a fresh one (at most 3 times)
  if (lost && renewals < 3 && performance.now() - lostAt > 8000) { renewals++; cnv = null; gl = null; lost = false; ready = false; lastUp = null; if (!create()) return false; }
  if (lost || gl.isContextLost()) return false;
  return ready || setup();
}
function state() {
  if (lost && renewals < 3 && performance.now() - lostAt > 8000) init();   // time to ask for a fresh context
  return failed ? 'none' : (lost || (gl && gl.isContextLost())) ? 'lost' : 'ok';
}
function c3(c) { return [c[0] / 255, c[1] / 255, c[2] / 255]; }
function d(o, k, v) { return o[k] === undefined ? v : o[k]; }

var lastKey = null, lastUp = null;
function upload(o) {
  var S = o.swells, N = Math.min(MAXS, S.length), nx = S[0].crest.length;
  var data = new Float32Array(nx * N);
  for (var i = 0; i < N; i++) data.set(S[i].crest, i * nx);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, nx, N, 0, gl.RED, gl.FLOAT, data);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return { N: N, nx: nx };
}

function render(o, only, mode, y0, y1) {
  if (!init() || !o.swells || !o.swells.length) return null;
  // the picture: the whole screen, or only the rows y0 … y1 (CSS px) when they are given
  var sc = o.width / o.screenW, top = y0 === undefined ? 0 : Math.max(0, y0);
  var ph = y0 === undefined ? o.height : Math.max(1, Math.round((Math.min(o.screenH, y1) - top) * sc));
  if (cnv.width !== o.width || cnv.height !== ph) { cnv.width = o.width; cnv.height = ph; }
  gl.viewport(0, 0, cnv.width, cnv.height);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.disable(gl.DEPTH_TEST); gl.disable(gl.BLEND); gl.disable(gl.SCISSOR_TEST);
  gl.useProgram(prog);
  if (lastKey !== o.swells || !lastUp) { lastKey = o.swells; lastUp = upload(o); }
  var up = lastUp;
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  function u1(n, v) { if (U[n]) gl.uniform1f(U[n], v); }
  function i1(n, v) { if (U[n]) gl.uniform1i(U[n], v); }
  function u3(n, c) { if (U[n]) gl.uniform3f(U[n], c[0], c[1], c[2]); }
  i1('uCrest', 0);
  i1('uN', up.N); i1('uOnly', only === undefined ? -1 : only); i1('uNx', up.nx); i1('uMode', mode || 0);
  var sw = new Float32Array(MAXS * 4);
  for (var i = 0; i < up.N; i++) { sw[i * 4] = d(o.swells[i], 'u', i / Math.max(1, up.N - 1)); sw[i * 4 + 1] = d(o.swells[i], 'haze', 0); }
  if (U.uSw) gl.uniform4fv(U.uSw, sw);
  if (U.uScreen) gl.uniform2f(U.uScreen, o.screenW, o.screenH);
  u1('uScale', sc);
  u1('uTop', top);
  u1('uPicH', ph);
  u1('uHorizon', o.horizon);
  u1('uLens', o.screenH * 1.2);
  u1('uSeed', d(o, 'seed', 7) % 997);
  var az = d(o, 'sunAzimuth', -100) * Math.PI / 180, el = d(o, 'sunElevation', 20) * Math.PI / 180;
  u3('uSunDir', [Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)]);
  var sS = d(o, 'sunStrength', 0.9);
  u3('uSunCol', c3(d(o, 'sunColour', [255, 246, 232])).map(function (v) { return v * sS; }));
  var sky = c3(d(o, 'skyColour', [178, 196, 226])), bl = d(o, 'blue', 0.5), L = (sky[0] + sky[1] + sky[2]) / 3;
  u3('uSkyCol', [sky[0] + (L * 0.8 - sky[0]) * bl, sky[1] + (L * 0.94 - sky[1]) * bl, sky[2] + (L * 1.2 - sky[2]) * bl]);
  u3('uHazeCol', c3(d(o, 'hazeColour', [246, 238, 232])));
  u3('uSnow', c3(d(o, 'snow', [250, 250, 252])));
  u1('uAmbient', d(o, 'ambient', 1.1));
  u1('uRelief', d(o, 'relief', 1));
  u1('uRoll', d(o, 'roll', 1));
  u1('uDrifts', d(o, 'drifts', 0.5));
  u1('uRipples', d(o, 'ripples', 0.6));
  u1('uRipSize', d(o, 'rippleSize', 0.35));
  u1('uRipAng', d(o, 'rippleAngle', 10));
  u1('uGrain', d(o, 'grain', 0.5));
  u1('uHollows', d(o, 'hollows', 0.6));
  u1('uSheen', d(o, 'sheen', 0.4));
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  if (gl.isContextLost()) return null;
  return cnv;
}

function material(mask, height, m) {
  if (!init() || !mask || mask.width < 1 || mask.height < 1) return null;
  var w = mask.width, h = mask.height;
  // the canvas only grows (many small pictures in a row): the picture is drawn in its corner (see .rect)
  if (cnv.width < w || cnv.height < h) { cnv.width = Math.max(cnv.width, w); cnv.height = Math.max(cnv.height, h); }
  gl.viewport(0, 0, w, h);
  gl.enable(gl.SCISSOR_TEST); gl.scissor(0, 0, w, h);
  gl.disable(gl.DEPTH_TEST); gl.disable(gl.BLEND);
  gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
  gl.disable(gl.SCISSOR_TEST);
  gl.useProgram(prog2);
  function put(t, unit, src) {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);              // the picture's top row at the top
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }
  put(texM, 0, mask); put(texH, 1, height);
  function u1(n, v) { if (U2[n]) gl.uniform1f(U2[n], v); }
  function u3(n, c) { if (U2[n]) gl.uniform3f(U2[n], c[0], c[1], c[2]); }
  if (U2.uMask) gl.uniform1i(U2.uMask, 0);
  if (U2.uHeight) gl.uniform1i(U2.uHeight, 1);
  if (U2.uSize) gl.uniform2f(U2.uSize, w, h);
  var L = d(m, 'sunDir', [-0.6, 0.4, 0.5]), ll = Math.hypot(L[0], L[1], L[2]) || 1;
  u3('uSunDir', [L[0] / ll, L[1] / ll, L[2] / ll]);
  u3('uSunCol', d(m, 'sunColour', [1, 0.97, 0.92]));
  var sky = d(m, 'skyColour', [0.7, 0.77, 0.89]), bl = d(m, 'blue', 0.5), Lm = (sky[0] + sky[1] + sky[2]) / 3;
  u3('uSkyCol', [sky[0] + (Lm * 0.8 - sky[0]) * bl, sky[1] + (Lm * 0.94 - sky[1]) * bl, sky[2] + (Lm * 1.2 - sky[2]) * bl]);
  u3('uSnow', c3(d(m, 'snow', [250, 250, 252])));
  u3('uHazeCol', c3(d(m, 'hazeColour', [246, 238, 232])));
  u1('uAmbient', d(m, 'ambient', 0.9));
  u1('uThick', d(m, 'thick', 6));
  u1('uGrain', d(m, 'grain', 0.5));
  u1('uGlow', d(m, 'glow', 0.5));
  u1('uContact', d(m, 'contact', 0.6));
  u1('uSparkle', d(m, 'sparkle', 0.5));
  u1('uHaze', d(m, 'haze', 0));
  u1('uSeed', d(m, 'seed', 1) % 997);
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  gl.activeTexture(gl.TEXTURE0);
  if (gl.isContextLost()) return null;
  return { img: cnv, sx: 0, sy: cnv.height - h, w: w, h: h };   // the picture is this part of img; copy it away before the next call
}

return {
  material: material,
  render: function (o, i, y0, y1) { return render(o, i, 0, y0, y1); },
  sunMap: function (o) { return render(o, -1, 1); },
  supported: function () { return init(); },
  state: state,
  losses: function () { return losses; }
};
})();
