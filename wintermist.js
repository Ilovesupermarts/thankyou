/* ============================================================
   WINTERMIST — the drifting fog of the new winter scene (newwinter.html,
   step 4): banks of freezing fog rolling slowly through the valley, past
   and through the pagoda hill and the shrine hall. Made the way the
   smoke of ykob's three.js sketch "fog" is made (sketch-threejs, MIT):
   many large, soft puffs of smoke, each turning slowly and drifting on
   its own path, laid over one another, so together they swirl like smoke.
   Here in winter's light (sunlit white, cold blue-grey in shade, not the
   sketch's changing hues) and with ordinary see-through blending (adding
   light, as the sketch does on black, would burn the snow white).

   - The puff is drawn in code when the page opens (no picture file):
     fractal noise inside a soft round falloff, its billows rounded.
   - Each puff has its own size, place, turning speed, drift and life:
     it fades in, turns and drifts, fades out, and comes back elsewhere
     (so none ever pops in or out).
   - It is lit as a cloud: one look toward the sun in the puff finds less
     smoke on the side turned to it (lit), more inside (shade); the low
     sun glows through the thin edges.
   - LAYERS: the page lays each one down at its own depth (one behind the
     hall, over the hill's foot and the pagoda; one in front of the hall
     and its firs), so the fog passes in front of and behind the buildings.
     In each the fog lies on the floor: thick low down, thinning upward,
     melting into the snow where it touches it.

   If WebGL 2 is not there, or the graphics chip takes the context away
   more than 3 times in 10 minutes, state() is 'off' and the page draws its
   flat mist band instead. After a single loss a fresh context is made.

   Use:
     WinterMist.init()              make the context, the shader and the puff now (on page open)
     WinterMist.state()             'ok', 'off' or 'none'
     WinterMist.render(o)           → { canvas, rects: [{ sx, sy, sw, sh, top, height }] } (premultiplied), or null
       o: w             the picture's width (px); res, PR: the share of the screen's resolution, the pixel ratio
          W, H          the screen (CSS px)
          time          seconds (the puffs' turning and lives)
          lit, shade, glow   [r, g, b] 0 … 255: the sun's side, the cold blue shade, the low sun's glow
          sunX, sunY    the sun on the screen (CSS px); warm (0 … 2)
          layers        [{ top, height: the rows drawn (CSS px), floor: CSS y where it lies thickest,
                           rise, below: how far it reaches above / below the floor (shares of H),
                           drift (CSS px carried by the wind), density (how thick), scale (the puffs' size),
                           warp (how fast they turn), billow (how puffy), cover (higher = fewer puffs, more gaps),
                           alpha, seed }]
   ============================================================ */
var WinterMist = (function () {
'use strict';

var cnv = null, gl = null, prog = null, U = {}, vao = null, buf = null, tex = null, failed = false, lost = false, losses = [], made = 0;
var PUFF = null;                 // the puff's pixels (made once; uploaded again into a fresh context)
var MAXP = 160, data = new Float32Array(MAXP * 6 * 8);

// one corner of a puff: screen point (CSS px), its place on the puff (u, v), its strength, the sun's direction in the
// puff's own turned frame (so the light stays on the sun's side as the puff turns)
var VS = '#version 300 es\n' +
'in vec2 aP; in vec2 aUV; in float aA; in vec2 aSun; in float aH;\n' +
'uniform vec4 uBand;\n' +                    // x: screen width, y: band top, z: band height (CSS px)
'out vec2 vUV; out float vA; out vec2 vSun; out float vY;\n' +
'void main(){ vUV = aUV; vA = aA; vSun = aSun; vY = aP.y;\n' +
'  gl_Position = vec4(aP.x / uBand.x * 2.0 - 1.0, 1.0 - (aP.y - uBand.y) / uBand.z * 2.0, 0.0, 1.0); }';

var FS = '#version 300 es\n' +
'precision highp float;\n' +
'uniform sampler2D uTex;\n' +
'uniform float uFloor, uRise, uBelow, uH, uBillow, uWarm;\n' +
'uniform vec3 uLit, uShade, uGlow; uniform vec2 uSun; uniform float uW;\n' +
'in vec2 vUV; in float vA; in vec2 vSun; in float vY;\n' +
'out vec4 outC;\n' +
'void main(){\n' +
'  vec4 t = texture(uTex, vUV);\n' +
'  float d = mix(t.r, t.g, 0.5 * uBillow);\n' +                                         // r: soft body, g: puffy billows
'  float dl = texture(uTex, vUV + vSun * 0.06).r;\n' +                                   // a look toward the sun
// where it lies: thick on the floor, thinning upward, a little below over the far snow
'  float h = (uFloor - vY) / uH;\n' +
'  float env = (1.0 - smoothstep(uRise * 0.35, uRise * 1.15, h)) * smoothstep(-uBelow, 0.0, h);\n' +
'  float a = clamp(d * vA * env, 0.0, 1.0);\n' +
'  if (a < 0.002) discard;\n' +
'  float hn = clamp(h / max(0.004, uRise), 0.0, 1.0);\n' +
'  float lit = clamp(0.62 + (d - dl) * 3.2 + hn * 0.25 - d * 0.25, 0.0, 1.0);\n' +
'  lit = mix(1.0, lit, smoothstep(0.0, 0.4, hn));\n' +                                   // (melts into the snow it lies on)
'  vec3 c = mix(uShade, uLit, lit);\n' +
'  c += uGlow * exp(-length(vec2(0.0, vY) - vec2(0.0, uSun.y)) / uH * 2.0) * uWarm * (1.0 - d) * 0.35;\n' +
'  outC = vec4(c * a, a);\n' +
'}';

// --- the puff, drawn in code: fractal noise inside a soft round falloff ---
function hash(x, y, s) { var h = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453; return h - Math.floor(h); }
function vnoise(x, y, s) {
  var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  var a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function makePuff() {
  var N = 256, px = new Uint8Array(N * N * 4), P = 6;          // (the noise repeats every P cells, so it tiles round the edge)
  function tn(x, y, s) {                                        // tiling noise
    var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    var m = function (k, p) { return ((k % p) + p) % p; };
    var p = P * s;
    var a = hash(m(xi, p), m(yi, p), s), b = hash(m(xi + 1, p), m(yi, p), s), c = hash(m(xi, p), m(yi + 1, p), s), d = hash(m(xi + 1, p), m(yi + 1, p), s);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  for (var j = 0; j < N; j++) for (var i = 0; i < N; i++) {
    var x = i / N, y = j / N, dx = x - 0.5, dy = y - 0.5, r = Math.sqrt(dx * dx + dy * dy) * 2;
    var fb = 0, bl = 0, a = 0.5, w = 0, f = 1;
    for (var o = 0; o < 5; o++) {
      var n = tn(x * P * f, y * P * f, f);
      fb += a * n; bl += a * (1 - Math.abs(2 * n - 1)); w += a; a *= 0.5; f *= 2;
    }
    fb /= w; bl /= w;
    var fall = Math.max(0, 1 - r); fall = fall * fall * (3 - 2 * fall);
    var body = Math.max(0, Math.min(1, (fb - 0.28) * 1.9)) * fall;
    var puff = Math.max(0, Math.min(1, (bl - 0.42) * 2.2)) * fall;
    var k = (j * N + i) * 4;
    px[k] = Math.round(255 * body); px[k + 1] = Math.round(255 * Math.max(body * 0.6, puff)); px[k + 2] = 0; px[k + 3] = 255;
  }
  return { N: N, px: px };
}

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
    ['uBand', 'uTex', 'uFloor', 'uRise', 'uBelow', 'uH', 'uBillow', 'uWarm', 'uLit', 'uShade', 'uGlow', 'uSun', 'uW']
      .forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });
    if (!PUFF) PUFF = makePuff();
    tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, PUFF.N, PUFF.N, 0, gl.RGBA, gl.UNSIGNED_BYTE, PUFF.px);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, data.byteLength, gl.DYNAMIC_DRAW);
    var st = 8 * 4;
    [['aP', 2, 0], ['aUV', 2, 2], ['aA', 1, 4], ['aSun', 2, 5], ['aH', 1, 7]].forEach(function (A) {
      var loc = gl.getAttribLocation(prog, A[0]);
      if (loc < 0) return;
      gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, A[1], gl.FLOAT, false, st, A[2] * 4);
    });
    gl.bindVertexArray(null);
    lost = false; made++;
    return true;
  } catch (e) { failed = true; gl = null; return false; }
}
function init() { if (!gl && !failed) create(); return !!gl && !failed; }
function state() { return typeof WebGL2RenderingContext === 'undefined' ? 'none' : failed ? 'off' : 'ok'; }
function c3(c) { return [c[0] / 255, c[1] / 255, c[2] / 255]; }
function fr(x) { return x - Math.floor(x); }

/* the puffs of one layer at this moment: each its own size, place, turning and drift; it lives a while (fading in and
   out) and is born again elsewhere (its new place from the seed and the number of its life, so it never jumps) */
function puffs(L, o, out) {
  var H = o.H, W = o.W, n = Math.round(Math.min(MAXP / 2, 70 * Math.max(0.2, 1.5 - L.cover) * (L.count || 1)));
  var span = W * 1.5, t = o.time || 0, cnt = 0;
  var sx = o.sunX, sy = o.sunY;
  for (var i = 0; i < n; i++) {
    var s = L.seed * 1000 + i;
    var life = 35 + 30 * hash(s, 1, 1), ph0 = hash(s, 2, 1);
    var age = (t / life + ph0), gen = Math.floor(age), u = age - gen;
    var g = gen + s * 0.37;
    var size = H * L.rise * (0.55 + 0.75 * hash(g, 3, 2)) * L.scale * 1.6;              // a puff a little taller than the fog lies deep
    var x0 = hash(g, 4, 2) * span, own = (hash(s, 5, 1) - 0.4) * 8;                      // (its own slow drift, CSS px a second)
    var x = ((x0 + L.drift * (0.8 + 0.4 * hash(s, 6, 1)) + own * t) % span + span) % span - W * 0.25;
    var y = L.floor - H * L.rise * (0.05 + 0.6 * Math.pow(hash(g, 7, 2), 1.4)) + size * 0.12 + Math.sin(t * 0.07 + s) * size * 0.04;
    var ang = hash(s, 8, 1) * 6.283 + t * (hash(s, 9, 1) - 0.5) * 0.12 * (L.warp || 1);
    var a = Math.sin(Math.PI * u); a = a * a * (0.55 + 0.45 * hash(g, 10, 2)) * L.density * 2.4;
    var w = size * (1.5 + 0.8 * hash(g, 11, 2)), hh = size;                                // (wider than tall: fog lies flat)
    // the sun's direction in the puff's own turned frame
    var dx = sx - x, dy = sy - y, dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl;
    var ca = Math.cos(ang), sa = Math.sin(ang);
    var lu = (dx * ca + dy * sa) * hh / w, lv = (-dx * sa + dy * ca);
    var lm = Math.hypot(lu, lv) || 1; lu /= lm; lv /= lm;
    var C = [[-1, -1, 0, 0], [1, -1, 1, 0], [1, 1, 1, 1], [-1, -1, 0, 0], [1, 1, 1, 1], [-1, 1, 0, 1]];
    for (var c = 0; c < 6; c++) {
      var px = C[c][0] * w / 2, py = C[c][1] * hh / 2;
      var k = (cnt * 6 + c) * 8;
      out[k] = x + px * ca - py * sa; out[k + 1] = y + px * sa + py * ca;
      out[k + 2] = C[c][2]; out[k + 3] = C[c][3]; out[k + 4] = a; out[k + 5] = lu; out[k + 6] = lv; out[k + 7] = 0;
    }
    cnt++;
  }
  return cnt;
}

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
  gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(U.uTex, 0);
  gl.uniform1f(U.uWarm, o.warm); gl.uniform1f(U.uH, o.H); gl.uniform1f(U.uW, o.W);
  gl.uniform3fv(U.uLit, c3(o.lit)); gl.uniform3fv(U.uShade, c3(o.shade)); gl.uniform3fv(U.uGlow, c3(o.glow));
  gl.uniform2f(U.uSun, o.sunX, o.sunY);
  gl.bindVertexArray(vao); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  var rects = [], y = 0;
  for (i = 0; i < Ls.length; i++) {
    var L = Ls[i], vy = cnv.height - y - hs[i];         // (WebGL counts rows from the bottom)
    gl.viewport(0, vy, w, hs[i]);
    gl.uniform4f(U.uBand, o.W, L.top, L.height, 0);
    gl.uniform1f(U.uFloor, L.floor); gl.uniform1f(U.uRise, L.rise); gl.uniform1f(U.uBelow, L.below);
    gl.uniform1f(U.uBillow, L.billow);
    var n = puffs(L, o, data);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, data, 0, n * 6 * 8);
    gl.drawArrays(gl.TRIANGLES, 0, n * 6);
    rects.push({ sx: 0, sy: y, sw: w, sh: hs[i], top: L.top, height: L.height });
    y += hs[i];
  }
  gl.bindVertexArray(null);
  gl.disable(gl.BLEND);
  if (gl.isContextLost()) return null;
  return { canvas: cnv, rects: rects };
}
return { init: init, state: state, render: render, renewals: function () { return Math.max(0, made - 1); } };
})();
