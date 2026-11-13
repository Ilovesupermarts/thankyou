/* ============================================================
   WINTERMIST — the drifting fog of the new winter scene (newwinter.html,
   step 4): banks of freezing fog rolling slowly through the valley, past
   and through the pagoda hill and the shrine hall. Drawn on the graphics
   chip (WebGL 2), every frame, at a reduced resolution, in LAYERS: the
   page lays each one down at its own depth (one behind the hall, over the
   hill's foot and the pagoda; one in front of the hall and its firs), so
   the fog passes both in front of and behind the buildings.

   How it looks like fog (smoke, low cloud), not a stream:
   - Its shapes are 3D value noise (x, y and TIME), so they change
     smoothly and continuously, as smoke does, never sliding as one sheet.
   - Rounded heaps: a puffy ("billow") noise is mixed into the body, so
     the banks' edges are soft cauliflower heaps like cloud.
   - It rolls: the noise is carried round in slow eddies that turn with
     time (domain warping), and drifts with the wind; the far layer drifts
     slower on the screen than the near one (parallax).
   - It lies on its layer's floor: thick low down, its top rising and
     falling in heaps, gaps where the buildings show through.
   - Lit as a cloud: one step toward the sun finds less fog on the side
     turned to it (that side lit, warm-white), more inside (the cold blue
     shade); the low sun glows through the thin edges.
   - Diamond dust: a few ice crystals twinkling where it is thin.
   The noise functions are written here (no library), after the common
   public-domain hash / value-noise / fBm forms.

   If WebGL 2 is not there, or the graphics chip takes the context away
   more than 3 times in 10 minutes, state() is 'off' and the page draws its
   flat mist band instead. After a single loss a fresh context is made.

   Use:
     WinterMist.init()              make the context and compile the shader now (on page open)
     WinterMist.state()             'ok', 'off' or 'none'
     WinterMist.render(o)           → { canvas, rects: [{ sx, sy, sw, sh, top, height }] } (premultiplied), or null
       o: w             the picture's width (px); res, PR: the share of the screen's resolution, the pixel ratio
          W, H          the screen (CSS px)
          time          seconds (the slow change of shape)
          lit, shade, glow   [r, g, b] 0 … 255: the sun's side, the cold blue shade, the low sun's glow
          sunX, sunY    the sun on the screen (CSS px); warm (0 … 2), sparkle (0 … 2)
          layers        [{ top, height: the rows drawn (CSS px), floor: CSS y where it lies thickest,
                           rise, below: how far it reaches above / below the floor (shares of H),
                           drift (CSS px carried by the wind), density, scale, warp, billow, cover
                           (higher = more gaps), alpha, seed }]
   ============================================================ */
var WinterMist = (function () {
'use strict';

var cnv = null, gl = null, prog = null, U = {}, vao = null, failed = false, lost = false, losses = [], made = 0;

var VS = '#version 300 es\n' +
'in vec2 aP; void main(){ gl_Position = vec4(aP, 0.0, 1.0); }';

var FS = '#version 300 es\n' +
'precision highp float;\n' +
'uniform vec4 uVp; uniform vec4 uScr; uniform float uFloor, uRise, uBelow, uTime, uDrift, uDensity, uScale, uWarp, uBillow, uCover, uAlpha, uSeed, uWarm, uSparkle;\n' +
'uniform vec3 uLit, uShade, uGlow; uniform vec2 uSun;\n' +
'out vec4 outC;\n' +
// value noise in 3D (x, y on the screen, z = time: the shapes change smoothly, never jump), Dave Hoskins' hash
'float hash(vec3 p){ p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }\n' +
'float noise(vec3 p){ vec3 i = floor(p), f = fract(p); vec3 u = f * f * (3.0 - 2.0 * f);\n' +
'  return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), u.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), u.x), u.y),\n' +
'             mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), u.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), u.x), u.y), u.z); }\n' +
'const mat2 R = mat2(0.8, -0.6, 0.6, 0.8);\n' +
'float fbm(vec2 p, float t, int n){ float s = 0.0, a = 0.5, w = 0.0; for (int i = 0; i < 6; i++) { if (i >= n) break; s += a * noise(vec3(p, t)); w += a; p = R * p * 2.02 + 7.3; t *= 1.35; a *= 0.5; } return s / w; }\n' +
// puffy: each octave folded (1 - |2n - 1|) so the edges come out as rounded heaps, like cumulus or smoke
'float billow(vec2 p, float t){ float s = 0.0, a = 0.5, w = 0.0; for (int i = 0; i < 4; i++) { s += a * (1.0 - abs(2.0 * noise(vec3(p, t)) - 1.0)); w += a; p = R * p * 2.07 + 3.1; t *= 1.4; a *= 0.5; } return s / w; }\n' +
// the fog's density at a point of the screen (q: x across, y up from this layer's floor, both in screen heights);
// h: how far up its heap it is there (0 on the floor, 1 at its top)
'float dens(vec2 q, out float h){\n' +
'  float t = uTime * 0.06 + uSeed * 3.7;\n' +
'  float x = q.x + uDrift;\n' +
'  vec2 p = vec2(x * 5.6, q.y * 9.1) * uScale + vec2(uSeed * 11.3, uSeed * 5.1);\n' +
// it is carried round in slow eddies (the warp turns with time), so it rolls and swirls as it drifts instead of sliding
'  vec2 w = vec2(fbm(p * 0.45 + vec2(0.0, 4.1), t * 0.55, 3), fbm(p * 0.45 + vec2(6.7, 1.9), t * 0.55, 3)) - 0.5;\n' +
'  vec2 pw = p + w * 2.4 * uWarp;\n' +
'  float n = mix(fbm(pw, t, 5), billow(pw * 1.8 + 2.3, t * 1.3), 0.45 * uBillow);\n' +
// along the valley its banks pile up to different heights and its foot wanders (no level top, no straight line)
'  float big = fbm(vec2(x * 3.2 * uScale + uSeed * 3.1, uSeed) + w * 0.8, t * 0.5, 3);\n' +
'  float y = q.y + (big - 0.5) * uRise * 0.35;\n' +
'  h = max(y, 0.0) / (uRise * (0.45 + 1.1 * big));\n' +
'  float env = (1.0 - smoothstep(0.3, 1.0, h + (n - 0.5) * 0.9)) * smoothstep(-uBelow, 0.0, y);\n' +
// thick low down with holes where the noise is thin; higher up only its heaps; the far hill shows through the gaps
'  float d = smoothstep(uCover, uCover + 0.16, n * 0.85 + env * 0.3) * env;\n' +
'  return clamp(d * uDensity, 0.0, 1.0);\n' +
'}\n' +
'void main(){\n' +
'  vec2 loc = (gl_FragCoord.xy - uVp.xy) / uVp.zw;\n' +
'  vec2 css = vec2(loc.x * uScr.x, uScr.z + (1.0 - loc.y) * uScr.w);\n' +          // CSS px on the screen
'  float H = uScr.y;\n' +
'  vec2 q = vec2(css.x / H, (uFloor - css.y) / H);\n' +
'  float h; float d = dens(q, h);\n' +
'  float A = d * uAlpha * 0.92;\n' +
'  vec3 col = vec3(0.0);\n' +
'  if (A > 0.002) {\n' +
// lit as a cloud: a step toward the sun finds less fog on the side turned to it (that side lit), more inside (shade)
'    vec2 toSun = normalize(uSun - css + vec2(0.001));\n' +
'    float hl; float dl = dens(q + vec2(toSun.x, -toSun.y) * 0.02, hl);\n' +
'    float lit = clamp(0.7 + (d - dl) * 4.0 + min(h, 1.0) * 0.2 - d * d * 0.35, 0.0, 1.0);\n' +
'    lit = mix(1.0, lit, smoothstep(0.0, 0.45, h));\n' +                       // (where it lies on the snow it melts into it: no shaded underline)
'    col = mix(uShade, uLit, lit);\n' +
// the low sun shining through the thin edges (light scattered forward in the droplets)
'    float sd = length((css - uSun) / H);\n' +
'    col += uGlow * exp(-sd * 2.0) * uWarm * (1.0 - d) * 0.5;\n' +
'    col *= A;\n' +
'  }\n' +
// diamond dust: an ice crystal here and there catching the sun, twinkling, where the fog is thin
'  if (uSparkle > 0.0) {\n' +
'    vec2 cell = floor(css / 2.0); float hh = hash(vec3(cell, uSeed));\n' +
'    if (hh > 0.9965) { float tw = pow(0.5 + 0.5 * sin(uTime * (2.0 + hh * 9.0) + hh * 400.0), 24.0);\n' +
'      float s = tw * uSparkle * smoothstep(0.02, 0.25, A) * (1.0 - smoothstep(0.55, 0.9, A)) * 0.9;\n' +
'      col += uGlow * s; A = max(A, s * 0.8); }\n' +
'  }\n' +
'  outC = vec4(min(col, vec3(A)), A);\n' +
'}';

function compile(type, src) {
  var s = gl.createShader(type);
  gl.shaderSource(s, src); gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { var e = gl.getShaderInfoLog(s); gl.deleteShader(s); throw new Error(e); }
  return s;
}
function create() {
  try {
    cnv = document.createElement('canvas'); cnv.width = cnv.height = 4;
    gl = cnv.getContext('webgl2', { alpha: true, antialias: false, depth: false, stencil: false, premultipliedAlpha: true, preserveDrawingBuffer: true, powerPreference: 'low-power' });
    if (!gl) { failed = true; return false; }
    cnv.addEventListener('webglcontextlost', function (e) {
      e.preventDefault(); lost = true;
      var now = Date.now(); losses.push(now); losses = losses.filter(function (t) { return now - t < 600000; });
      if (losses.length >= 3) failed = true;           // (three in ten minutes: the page's flat band from now on)
    });
    prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    ['uVp', 'uScr', 'uFloor', 'uRise', 'uBelow', 'uTime', 'uDrift', 'uDensity', 'uScale', 'uWarp', 'uBillow', 'uCover', 'uAlpha', 'uSeed', 'uWarm', 'uSparkle', 'uLit', 'uShade', 'uGlow', 'uSun']
      .forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });
    vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'aP');
    gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
    lost = false; made++;
    return true;
  } catch (e) { failed = true; gl = null; return false; }
}
function init() { if (!gl && !failed) create(); return !!gl && !failed; }
function state() { return typeof WebGL2RenderingContext === 'undefined' ? 'none' : failed ? 'off' : 'ok'; }
function c3(c) { return [c[0] / 255, c[1] / 255, c[2] / 255]; }
function render(o) {
  if (failed) return null;
  if (lost || !gl || gl.isContextLost()) { if (!create()) return null; }
  // every layer in one picture, one above the other (no new picture each frame): layer i gets the rows rect[i]
  var Ls = o.layers, w = Math.max(2, Math.round(o.w)), hs = [], h = 0, i;
  for (i = 0; i < Ls.length; i++) { hs.push(Math.max(2, Math.round(Ls[i].height * o.res * o.PR))); h += hs[i]; }
  if (cnv.width !== w || cnv.height < h) { cnv.width = w; cnv.height = Math.max(h, cnv.height, 2); }
  gl.viewport(0, 0, cnv.width, cnv.height);
  gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(prog);
  gl.uniform1f(U.uTime, o.time || 0);
  gl.uniform1f(U.uWarm, o.warm); gl.uniform1f(U.uSparkle, o.sparkle);
  gl.uniform3fv(U.uLit, c3(o.lit)); gl.uniform3fv(U.uShade, c3(o.shade)); gl.uniform3fv(U.uGlow, c3(o.glow));
  gl.uniform2f(U.uSun, o.sunX, o.sunY);
  gl.bindVertexArray(vao);
  var rects = [], y = 0;
  for (i = 0; i < Ls.length; i++) {
    var L = Ls[i], vy = cnv.height - y - hs[i];         // (WebGL counts rows from the bottom)
    gl.viewport(0, vy, w, hs[i]);
    gl.uniform4f(U.uVp, 0, vy, w, hs[i]);
    gl.uniform4f(U.uScr, o.W, o.H, L.top, L.height);
    gl.uniform1f(U.uFloor, L.floor); gl.uniform1f(U.uRise, L.rise); gl.uniform1f(U.uBelow, L.below);
    gl.uniform1f(U.uDrift, (L.drift || 0) / o.H);
    gl.uniform1f(U.uDensity, L.density); gl.uniform1f(U.uScale, L.scale); gl.uniform1f(U.uWarp, L.warp);
    gl.uniform1f(U.uBillow, L.billow); gl.uniform1f(U.uCover, L.cover); gl.uniform1f(U.uAlpha, L.alpha); gl.uniform1f(U.uSeed, L.seed);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    rects.push({ sx: 0, sy: y, sw: w, sh: hs[i], top: L.top, height: L.height });
    y += hs[i];
  }
  gl.bindVertexArray(null);
  if (gl.isContextLost()) return null;
  return { canvas: cnv, rects: rects };
}
return { init: init, state: state, render: render, renewals: function () { return Math.max(0, made - 1); } };
})();
