/* ============================================================
   WINTERMIST — the valley mist of the new winter scene (newwinter.html,
   step 4): freezing ground fog lying in the valley in front of the
   pagoda hill's lower slopes, between the hill and the hall, drifting
   and slowly changing shape. Drawn on the graphics chip (WebGL 2), every
   frame, at a reduced resolution; the page lays the picture down over
   the hill and the far snow and under the hall.

   How it looks real:
   - Its shapes come from fractal noise (fBm: several sizes of smooth
     noise added up) bent by more noise (domain warping, after Inigo
     Quilez's article "warp"), so it curls, thins, tears and gathers as
     real fog does and never repeats.
   - It is ground fog: dense and flat close to the valley floor (the
     horizon line), thinning upward into loose wisps; its sheets are
     drawn out sideways, as fog in still cold air is.
   - Three layers at different depths: the far one finer and slower on
     the screen, the near one larger and quicker (parallax). Each drifts
     with the wind (and a gust's push) and slowly changes shape.
   - Lit by the scene: the side of each bank turned to the sun brighter
     and warm; the rest in the sky's cold blue; thin edges glow toward
     the low sun (light scattered forward through the droplets), the
     dense cores stay cold and bluish.
   - Diamond dust: a few ice crystals catching the sun, twinkling, where
     the mist is thin.
   The noise functions are written here (no library), after the common
   public-domain hash / value-noise / fBm forms.

   If WebGL 2 is not there, or the graphics chip takes the context away
   more than 3 times in 10 minutes, state() is 'off' and the page draws its
   flat mist band instead. After a single loss a fresh context is made (Chrome
   never gives one back that it took because too many were open).

   Use:
     WinterMist.init()              make the context and compile the shader now (on page open)
     WinterMist.state()             'ok', 'off' or 'none'
     WinterMist.render(o)           → the picture (a canvas, premultiplied), or null
       o: w, h          the picture's size (px)
          W, H          the screen (CSS px); top, height: the band drawn (CSS px from the top)
          horizon       CSS px from the top: the valley floor (the eye line)
          time          seconds (the slow change of shape)
          drift         CSS px the mist has drifted (the page adds the wind up over time)
          rise          how high the fog lies above the horizon (share of the screen's height)
          below         how far it reaches down over the far snow (share of the height)
          density, scale, warp, strength (0 … 1.5 each, 1 = as tuned)
          lit, shade, glow   [r, g, b] 0 … 255: the sun's side, the sky's cold blue, the low sun's glow
          sunX, sunY    the sun on the screen (CSS px); warm (0 … 2: the glow toward it)
          sparkle       0 … 2: the ice crystals
   ============================================================ */
var WinterMist = (function () {
'use strict';

var cnv = null, gl = null, prog = null, U = {}, vao = null, failed = false, lost = false, losses = [], made = 0;

var VS = '#version 300 es\n' +
'in vec2 aP; void main(){ gl_Position = vec4(aP, 0.0, 1.0); }';

var FS = '#version 300 es\n' +
'precision highp float;\n' +
'uniform vec2 uRes; uniform vec4 uScr; uniform float uHy, uTime, uDrift, uRise, uBelow, uDensity, uScale, uWarp, uStrength, uWarm, uSparkle;\n' +
'uniform vec3 uLit, uShade, uGlow; uniform vec2 uSun;\n' +
'out vec4 outC;\n' +
'float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }\n' +
'float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);\n' +
'  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y); }\n' +
'const mat2 R = mat2(0.8, -0.6, 0.6, 0.8);\n' +
'float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * noise(p); p = R * p * 2.03 + 17.1; a *= 0.5; } return s; }\n' +
// one layer of fog: its density at screen point (x, h above the horizon), the layer's own depth k (0 far … 2 near)
'float fog(vec2 q, float k, out float lightSide){\n' +
'  float f = mix(2.2, 1.0, k / 2.0);\n' +                                   // far layers: finer on the screen
'  vec2 p = vec2((q.x + uDrift * mix(0.35, 1.0, k / 2.0)) * 0.35, q.y * 2.4) * f * uScale * 3.2 + vec2(k * 31.7, k * 7.3);\n' +
'  float t = uTime * 0.035;\n' +
'  vec2 w1 = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3 - t)));\n' +
'  vec2 w2 = vec2(fbm(p + 3.0 * uWarp * w1 + vec2(1.7, 9.2) + t * 0.7), fbm(p + 3.0 * uWarp * w1 + vec2(8.3, 2.8) - t * 0.5));\n' +
'  float n = fbm(p + 3.5 * uWarp * w2);\n' +
'  float n2 = fbm(p + 3.5 * uWarp * w2 + vec2(-0.09, 0.05));\n' +             // a little toward the sun's side (left, up)
'  lightSide = clamp(0.5 + (n - n2) * 6.0, 0.0, 1.0);\n' +
// ground fog: dense on the floor, thinning upward; each layer lies a little higher the nearer it is
'  float top = uRise * mix(0.75, 1.15, k / 2.0);\n' +
'  float prof = exp(-max(q.y, 0.0) / max(0.003, top * 0.42)) * smoothstep(-uBelow, 0.0, q.y);\n' +
'  float d = smoothstep(0.40, 0.78, n * 0.75 + prof * 0.42 - 0.04);\n' +      // banks with gaps: the noise decides where it is thick and where the far hill shows through\n' +
'  return d * prof * uDensity;\n' +
'}\n' +
'void main(){\n' +
'  vec2 frag = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);\n' +
'  vec2 css = vec2(frag.x / uRes.x * uScr.x, uScr.z + frag.y / uRes.y * uScr.w);\n' +       // CSS px on the screen
'  float H = uScr.y;\n' +
'  vec2 q = vec2(css.x / H, (uHy - css.y) / H);\n' +
'  vec3 col = vec3(0.0); float A = 0.0;\n' +
'  float sd = length((css - uSun) / H);\n' +
'  float glowK = exp(-sd * 2.2) * uWarm;\n' +
'  for (int i = 0; i < 3; i++) {\n' +
'    float k = float(i), ls;\n' +
'    float d = fog(q, k, ls);\n' +
'    float a = clamp(d * mix(0.55, 0.85, k / 2.0), 0.0, 1.0);\n' +
'    if (a <= 0.001) continue;\n' +
// the dense cores cold and bluish, the side toward the sun lighter and warmer, the thin edges glowing toward the low sun
'    vec3 c = mix(uShade, uLit, clamp(ls * 0.7 + 0.2 - d * 0.25 + q.y * 2.0, 0.0, 1.0));\n' +
'    c += uGlow * glowK * (1.0 - d) * 0.55;\n' +
'    col = col * (1.0 - a) + c * a; A = A * (1.0 - a) + a;\n' +
'  }\n' +
// diamond dust: an ice crystal here and there catching the sun, twinkling, where the mist is thin
'  if (uSparkle > 0.0) {\n' +
'    vec2 cell = floor(css / 2.0); float h = hash(cell);\n' +
'    if (h > 0.9965) { float tw = pow(0.5 + 0.5 * sin(uTime * (2.0 + h * 9.0) + h * 400.0), 24.0);\n' +
'      float s = tw * uSparkle * smoothstep(0.02, 0.25, A) * (1.0 - smoothstep(0.55, 0.9, A)) * 0.9;\n' +
'      col += uGlow * s; A = max(A, s * 0.8); }\n' +
'  }\n' +
'  outC = vec4(min(col, vec3(A)) * uStrength, A * uStrength);\n' +
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
    ['uRes', 'uScr', 'uHy', 'uTime', 'uDrift', 'uRise', 'uBelow', 'uDensity', 'uScale', 'uWarp', 'uStrength', 'uWarm', 'uSparkle', 'uLit', 'uShade', 'uGlow', 'uSun']
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
  var w = Math.max(2, Math.round(o.w)), h = Math.max(2, Math.round(o.h));
  if (cnv.width !== w || cnv.height !== h) { cnv.width = w; cnv.height = h; }
  gl.viewport(0, 0, w, h);
  gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(prog);
  gl.uniform2f(U.uRes, w, h);
  gl.uniform4f(U.uScr, o.W, o.H, o.top, o.height);
  gl.uniform1f(U.uHy, o.horizon);
  gl.uniform1f(U.uTime, o.time || 0);
  gl.uniform1f(U.uDrift, (o.drift || 0) / o.H);
  gl.uniform1f(U.uRise, o.rise);
  gl.uniform1f(U.uBelow, o.below);
  gl.uniform1f(U.uDensity, o.density);
  gl.uniform1f(U.uScale, o.scale);
  gl.uniform1f(U.uWarp, o.warp);
  gl.uniform1f(U.uStrength, o.strength);
  gl.uniform1f(U.uWarm, o.warm);
  gl.uniform1f(U.uSparkle, o.sparkle);
  gl.uniform3fv(U.uLit, c3(o.lit)); gl.uniform3fv(U.uShade, c3(o.shade)); gl.uniform3fv(U.uGlow, c3(o.glow));
  gl.uniform2f(U.uSun, o.sunX, o.sunY);
  gl.bindVertexArray(vao);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  gl.bindVertexArray(null);
  if (gl.isContextLost()) return null;
  return cnv;
}
return { init: init, state: state, render: render, renewals: function () { return Math.max(0, made - 1); } };
})();
