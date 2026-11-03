/* ============================================================
   inkfluid.js — wet paper on the graphics chip (WebGL 2), for the ink
   reveal (inkreveal.js).

   A port of the simulation in Inkwash by Jonathan Whitaker
   (https://github.com/johnowhitaker/inkwash, MIT licence, copyright
   2026 Jonathan Whitaker — the licence text is at the end of this
   file). As there:
     - the water moves: its flow is carried along by itself, swirls are
       kept alive (vorticity confinement), it is made to flow without
       piling up (a pressure solve), and it only moves where the paper is
       wet;
     - the wetness is carried by the flow, creeps outward and dries;
     - the ink is carried by the flow and bleeds into its neighbours, but
       only where the paper is wet, so it feathers out into wet paper and
       stops at the dry edge.
   Here the ink is not one colour but up to twelve "parts" of the scene,
   one in each channel of three RGBA textures, all on the same wet paper,
   so a part's ink can run into the wet of the one next to it (wet on
   wet). Each frame the parts that are appearing are drawn into tiles of
   this module's canvas: one tile is the mask (where the part shows), the
   other the ink darkening it while it is wet, with darker edges and
   paper grain. inkreveal.js lays those tiles over the scene.

   Use (coordinates in CSS px of a W × H screen):
     InkFluid.init()                         true if WebGL 2 with float targets works
     InkFluid.size(W, H, simBase, dyeBase, slots)
     InkFluid.clear()
     InkFluid.wet(x, y, r, amount)           water (the most of it and what is there)
     InkFluid.push(x, y, r, vx, vy)          a push to the water (CSS px a second)
     InkFluid.ink(part, x, y, r, amount)     ink of part 0..11
     InkFluid.step(dt, look)                 look: { flow, swirl, bleed, dry }
     InkFluid.draw(list, look)               list: [{ slot, part, fin }]
     InkFluid.canvas, InkFluid.tileW, InkFluid.tileH, InkFluid.slotY(slot)
     InkFluid.state()                        'ok', 'none' or 'lost'
   ============================================================ */
(function () {
'use strict';

var gl = null, cnv = null, st = 'none', P = {}, quad = null;
var vel, div, curl, pres, wet, ink = [], shown = [], sim = { w: 0, h: 0 }, dye = { w: 0, h: 0 }, W = 1, H = 1, slots = 1;

var VERT = '#version 300 es\nprecision highp float;\nlayout(location=0) in vec2 aPos;\nout vec2 vUv;\n' +
           'void main(){ vUv = aPos*0.5+0.5; gl_Position = vec4(aPos,0.,1.); }';
var HEAD = '#version 300 es\nprecision highp float; in vec2 vUv; out vec4 o;\n';
var NOISE = 'float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }\n' +
  'float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f);\n' +
  '  float a = hash(i), b = hash(i + vec2(1., 0.)), c = hash(i + vec2(0., 1.)), d = hash(i + vec2(1., 1.));\n' +
  '  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y); }\n' +
  'float fbm(vec2 p){ float v = 0., a = 0.5; for (int i = 0; i < 4; i++){ v += a * vnoise(p); p *= 2.07; a *= 0.5; } return v; }\n';
var FS = {
  copy: HEAD + 'uniform sampler2D uTex; uniform float uValue;\nvoid main(){ o = texture(uTex, vUv) * uValue; }',
  // drawn with additive (or MAX) blending straight into the live texture
  splat: HEAD + 'uniform float uAspect; uniform vec2 uPoint; uniform vec4 uColor; uniform float uRadius;\n' +
    'void main(){ vec2 p = vUv - uPoint; p.x *= uAspect; o = uColor * exp(-dot(p,p) / uRadius); }',
  // the flow: carried by itself, damped, and only where the paper is wet
  advVel: HEAD + 'uniform sampler2D uVelocity, uWet; uniform vec2 uTexel; uniform float uDt, uDissipation;\n' +
    'void main(){\n  vec2 coord = vUv - uDt * texture(uVelocity, vUv).xy * uTexel;\n' +
    '  vec2 vel = texture(uVelocity, coord).xy * uDissipation;\n  float w = texture(uWet, vUv).x;\n' +
    '  o = vec4(vel * smoothstep(0.005, 0.2, w), 0., 1.);\n}',
  // the water: carried by the flow, creeps outward, dries
  advWet: HEAD + 'uniform sampler2D uVelocity, uWet; uniform vec2 uTexel, uSrcTexel; uniform float uDt, uDecay, uSpread;\n' +
    'void main(){\n  vec2 coord = vUv - uDt * texture(uVelocity, vUv).xy * uTexel * 0.6;\n  float w = texture(uWet, coord).x;\n' +
    '  vec2 b = uSrcTexel * 1.6;\n  float n = (texture(uWet, coord + vec2(b.x, 0.)).x + texture(uWet, coord - vec2(b.x, 0.)).x\n' +
    '           + texture(uWet, coord + vec2(0., b.y)).x + texture(uWet, coord - vec2(0., b.y)).x) * 0.25;\n' +
    '  w = mix(w, n, uSpread);\n  o = vec4(w * uDecay, 0., 0., 1.);\n}',
  // the ink: moves only where wet, and bleeds into its neighbours there
  advInk: HEAD + 'uniform sampler2D uVelocity, uSource, uWet; uniform vec2 uTexel, uSrcTexel; uniform float uDt, uBleed;\n' +
    'void main(){\n  float w = texture(uWet, vUv).x;\n  float mob = smoothstep(0.02, 0.45, w);\n  vec4 cur = texture(uSource, vUv);\n' +
    '  if (mob < 0.002){ o = cur; return; }\n  vec2 coord = vUv - uDt * texture(uVelocity, vUv).xy * uTexel * mob;\n' +
    '  vec4 adv = texture(uSource, coord);\n  vec2 b = uSrcTexel * 1.6;\n' +
    '  vec4 n = (texture(uSource, coord + vec2(b.x, 0.)) + texture(uSource, coord - vec2(b.x, 0.))\n' +
    '          + texture(uSource, coord + vec2(0., b.y)) + texture(uSource, coord - vec2(0., b.y))) * 0.25;\n' +
    '  o = mix(cur, mix(adv, n, clamp(uBleed * 0.4 * mob, 0., 0.92)), mob);\n}',
  divergence: HEAD + 'uniform sampler2D uVelocity; uniform vec2 uTexel;\nvoid main(){\n' +
    '  float L = texture(uVelocity, vUv - vec2(uTexel.x, 0.)).x; float R = texture(uVelocity, vUv + vec2(uTexel.x, 0.)).x;\n' +
    '  float B = texture(uVelocity, vUv - vec2(0., uTexel.y)).y; float T = texture(uVelocity, vUv + vec2(0., uTexel.y)).y;\n' +
    '  o = vec4(0.5 * (R - L + T - B), 0., 0., 1.);\n}',
  pressure: HEAD + 'uniform sampler2D uPressure, uDivergence; uniform vec2 uTexel;\nvoid main(){\n' +
    '  float L = texture(uPressure, vUv - vec2(uTexel.x, 0.)).x; float R = texture(uPressure, vUv + vec2(uTexel.x, 0.)).x;\n' +
    '  float B = texture(uPressure, vUv - vec2(0., uTexel.y)).x; float T = texture(uPressure, vUv + vec2(0., uTexel.y)).x;\n' +
    '  o = vec4((L + R + B + T - texture(uDivergence, vUv).x) * 0.25, 0., 0., 1.);\n}',
  gradSub: HEAD + 'uniform sampler2D uPressure, uVelocity; uniform vec2 uTexel;\nvoid main(){\n' +
    '  float L = texture(uPressure, vUv - vec2(uTexel.x, 0.)).x; float R = texture(uPressure, vUv + vec2(uTexel.x, 0.)).x;\n' +
    '  float B = texture(uPressure, vUv - vec2(0., uTexel.y)).x; float T = texture(uPressure, vUv + vec2(0., uTexel.y)).x;\n' +
    '  o = vec4(texture(uVelocity, vUv).xy - 0.5 * vec2(R - L, T - B), 0., 1.);\n}',
  curl: HEAD + 'uniform sampler2D uVelocity; uniform vec2 uTexel;\nvoid main(){\n' +
    '  float L = texture(uVelocity, vUv - vec2(uTexel.x, 0.)).y; float R = texture(uVelocity, vUv + vec2(uTexel.x, 0.)).y;\n' +
    '  float B = texture(uVelocity, vUv - vec2(0., uTexel.y)).x; float T = texture(uVelocity, vUv + vec2(0., uTexel.y)).x;\n' +
    '  o = vec4(0.5 * ((R - L) - (T - B)), 0., 0., 1.);\n}',
  vorticity: HEAD + 'uniform sampler2D uVelocity, uCurl; uniform vec2 uTexel; uniform float uCurlAmt, uDt;\nvoid main(){\n' +
    '  float L = texture(uCurl, vUv - vec2(uTexel.x, 0.)).x; float R = texture(uCurl, vUv + vec2(uTexel.x, 0.)).x;\n' +
    '  float B = texture(uCurl, vUv - vec2(0., uTexel.y)).x; float T = texture(uCurl, vUv + vec2(0., uTexel.y)).x;\n' +
    '  float C = texture(uCurl, vUv).x;\n  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));\n' +
    '  force /= length(force) + 1e-4;\n  force *= uCurlAmt * C * vec2(1., -1.);\n' +
    '  o = vec4(clamp(texture(uVelocity, vUv).xy + force * uDt, -1000., 1000.), 0., 1.);\n}',
  // what each part has shown so far: the most it has ever shown (ink that thins out as it spreads never hides it again)
  shown: HEAD + NOISE + 'uniform sampler2D uInk, uShown; uniform vec2 uRes; uniform float uLo, uHi, uGrain;\n' +
    'void main(){\n  vec2 px = vUv * uRes;\n  float g = 1.0 + (fbm(px * 0.12 + 31.7) - 0.5) * uGrain * 0.8 + (fbm(px * 0.055) - 0.5) * uGrain * 0.5;\n' +
    '  o = max(texture(uShown, vUv), smoothstep(vec4(uLo), vec4(uHi), texture(uInk, vUv) * g));\n}',
  // a part's tile: its mask (uMode 0) or the wet ink over it (uMode 1), premultiplied
  out: HEAD + NOISE + 'uniform sampler2D uInk, uWet, uShown; uniform vec4 uSel; uniform vec2 uTexel, uRes;\n' +
    'uniform float uMode, uFin, uInkAmt, uEdge, uGrain; uniform vec3 uCol;\n' +
    'float dens(vec2 uv){ return dot(texture(uInk, uv), uSel); }\n' +
    'void main(){\n  float d = dens(vUv);\n  vec2 px = vUv * uRes;\n  float grain = fbm(px * 0.12 + 31.7);\n' +
    '  if (uMode < 0.5){\n    float a = max(dot(texture(uShown, vUv), uSel), uFin);\n    o = vec4(a, a, a, a);\n    return;\n  }\n' +
    '  float l = dens(vUv - vec2(uTexel.x, 0.)), r = dens(vUv + vec2(uTexel.x, 0.));\n' +
    '  float b = dens(vUv - vec2(0., uTexel.y)), t = dens(vUv + vec2(0., uTexel.y));\n' +
    '  float edge = length(vec2(r - l, t - b));\n  float w = smoothstep(0.02, 0.6, texture(uWet, vUv).x);\n' +
    '  float absb = min(d, 1.5) * uInkAmt * (1.0 + (grain - 0.5) * uGrain) * (1.0 + edge * uEdge * 3.0);\n' +
    '  float a = (1.0 - exp(-absb * 1.2)) * (0.3 + 0.7 * w) * (1.0 - uFin);\n  a = clamp(a, 0., 0.75);\n' +
    '  o = vec4(uCol * a, a);\n}'
};

function compile(type, src) {
  var s = gl.createShader(type);
  gl.shaderSource(s, src); gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}
function program(vs, fsSrc) {
  var p = gl.createProgram();
  gl.attachShader(p, vs); gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fsSrc));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  var u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (var i = 0; i < n; i++) { var inf = gl.getActiveUniform(p, i); u[inf.name] = gl.getUniformLocation(p, inf.name); }
  return { p: p, u: u, bind: function () { gl.useProgram(p); } };
}
function init() {
  if (st === 'ok') return true;
  if (st === 'lost') return false;
  try {
    cnv = document.createElement('canvas');
    cnv.width = 2; cnv.height = 2;
    gl = cnv.getContext('webgl2', { alpha: true, premultipliedAlpha: true, depth: false, stencil: false, antialias: false, preserveDrawingBuffer: true });
    if (!gl || !gl.getExtension('EXT_color_buffer_float')) { gl = null; st = 'none'; return false; }
    var vs = compile(gl.VERTEX_SHADER, VERT);
    for (var k in FS) P[k] = program(vs, FS[k]);
    quad = gl.createVertexArray();
    gl.bindVertexArray(quad);
    var vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.disable(gl.BLEND);
    cnv.addEventListener('webglcontextlost', function (e) { e.preventDefault(); st = 'lost'; });
    st = 'ok';
    return true;
  } catch (e) {
    gl = null; st = 'none';
    return false;
  }
}

function fbo(w, h, internal, format, filter) {
  var tex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, gl.HALF_FLOAT, null);
  var fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  gl.viewport(0, 0, w, h);
  gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
  return { tex: tex, fbo: fb, w: w, h: h, texel: [1 / w, 1 / h],
           attach: function (unit) { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tex); return unit; },
           free: function () { gl.deleteTexture(tex); gl.deleteFramebuffer(fb); } };
}
function double(w, h, internal, format, filter) {
  var a = fbo(w, h, internal, format, filter), b = fbo(w, h, internal, format, filter);
  return { w: w, h: h, texel: [1 / w, 1 / h], get read() { return a; }, get write() { return b; },
           swap: function () { var t = a; a = b; b = t; }, free: function () { a.free(); b.free(); } };
}
function res(base) { var ar = W / H; return ar > 1 ? { w: Math.round(base * ar), h: base } : { w: base, h: Math.round(base / ar) }; }

var sizeKey = '';
function size(w, h, simBase, dyeBase, nSlots) {
  if (st !== 'ok') return;
  var key = [w, h, simBase, dyeBase, nSlots].join('|');
  if (key === sizeKey) return;
  sizeKey = key;
  W = w; H = h; slots = Math.max(1, nSlots);
  [vel, div, curl, pres, wet].concat(ink, shown).forEach(function (t) { if (t) t.free(); });
  sim = res(simBase); dye = res(dyeBase);
  vel = double(sim.w, sim.h, gl.RG16F, gl.RG, gl.LINEAR);
  div = fbo(sim.w, sim.h, gl.R16F, gl.RED, gl.NEAREST);
  curl = fbo(sim.w, sim.h, gl.R16F, gl.RED, gl.NEAREST);
  pres = double(sim.w, sim.h, gl.R16F, gl.RED, gl.NEAREST);
  wet = double(dye.w, dye.h, gl.R16F, gl.RED, gl.LINEAR);
  ink = [0, 1, 2].map(function () { return double(dye.w, dye.h, gl.RGBA16F, gl.RGBA, gl.LINEAR); });
  shown = [0, 1, 2].map(function () { return double(dye.w, dye.h, gl.RGBA16F, gl.RGBA, gl.LINEAR); });
  cnv.width = dye.w * 2; cnv.height = dye.h * slots;
}
function clear() {
  if (st !== 'ok') return;
  [vel, pres, wet].concat(ink, shown).forEach(function (d) {
    [d.read, d.write].forEach(function (f) { gl.bindFramebuffer(gl.FRAMEBUFFER, f.fbo); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); });
  });
}

function blit(target) {
  if (!target) { gl.bindFramebuffer(gl.FRAMEBUFFER, null); }
  else { gl.viewport(0, 0, target.w, target.h); gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo); }
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}
/* A soft round dab into a texture (added, or the most of it and what is there). */
function splat(target, x, y, r, c, useMax) {
  if (st !== 'ok') return;
  var f = target.read, u = x / W, v = 1 - y / H, rr = r / H;
  gl.bindFramebuffer(gl.FRAMEBUFFER, f.fbo);
  gl.viewport(0, 0, f.w, f.h);
  var ex = Math.ceil(rr * 4.5 * f.h) + 2, cx = Math.round(u * f.w), cy = Math.round(v * f.h);
  gl.enable(gl.SCISSOR_TEST);
  gl.scissor(Math.max(cx - ex, 0), Math.max(cy - ex, 0), ex * 2, ex * 2);
  gl.enable(gl.BLEND);
  if (useMax) gl.blendEquation(gl.MAX);
  else { gl.blendEquation(gl.FUNC_ADD); gl.blendFunc(gl.ONE, gl.ONE); }
  P.splat.bind();
  gl.uniform1f(P.splat.u.uAspect, W / H);
  gl.uniform2f(P.splat.u.uPoint, u, v);
  gl.uniform4f(P.splat.u.uColor, c[0], c[1], c[2], c[3]);
  gl.uniform1f(P.splat.u.uRadius, rr * rr);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  gl.blendEquation(gl.FUNC_ADD);
  gl.disable(gl.BLEND);
  gl.disable(gl.SCISSOR_TEST);
}
function putWet(x, y, r, a) { splat(wet, x, y, r, [a, 0, 0, 0], true); }
/* vx, vy in CSS px a second; the flow is kept in its own cells a second (y up). */
function push(x, y, r, vx, vy) { splat(vel, x, y, r, [vx * sim.w / W, -vy * sim.h / H, 0, 0], false); }
function putInk(part, x, y, r, a) {
  var c = [0, 0, 0, 0]; c[part % 4] = a;
  splat(ink[Math.floor(part / 4) % 3], x, y, r, c, false);
}

function step(dt, L) {
  if (st !== 'ok') return;
  var tx = vel.texel;
  P.advVel.bind();
  gl.uniform1i(P.advVel.u.uVelocity, vel.read.attach(0));
  gl.uniform1i(P.advVel.u.uWet, wet.read.attach(1));
  gl.uniform2f(P.advVel.u.uTexel, tx[0], tx[1]);
  gl.uniform1f(P.advVel.u.uDt, dt);
  gl.uniform1f(P.advVel.u.uDissipation, Math.exp(-dt * (3.0 - L.flow * 2.4)));
  blit(vel.write); vel.swap();

  P.curl.bind();
  gl.uniform1i(P.curl.u.uVelocity, vel.read.attach(0));
  gl.uniform2f(P.curl.u.uTexel, tx[0], tx[1]);
  blit(curl);
  P.vorticity.bind();
  gl.uniform1i(P.vorticity.u.uVelocity, vel.read.attach(0));
  gl.uniform1i(P.vorticity.u.uCurl, curl.attach(1));
  gl.uniform2f(P.vorticity.u.uTexel, tx[0], tx[1]);
  gl.uniform1f(P.vorticity.u.uCurlAmt, L.swirl);
  gl.uniform1f(P.vorticity.u.uDt, dt);
  blit(vel.write); vel.swap();

  P.divergence.bind();
  gl.uniform1i(P.divergence.u.uVelocity, vel.read.attach(0));
  gl.uniform2f(P.divergence.u.uTexel, tx[0], tx[1]);
  blit(div);
  P.copy.bind();
  gl.uniform1i(P.copy.u.uTex, pres.read.attach(0));
  gl.uniform1f(P.copy.u.uValue, 0.8);
  blit(pres.write); pres.swap();
  P.pressure.bind();
  gl.uniform1i(P.pressure.u.uDivergence, div.attach(1));
  gl.uniform2f(P.pressure.u.uTexel, tx[0], tx[1]);
  for (var i = 0; i < (L.iterations || 20); i++) {
    gl.uniform1i(P.pressure.u.uPressure, pres.read.attach(0));
    blit(pres.write); pres.swap();
  }
  P.gradSub.bind();
  gl.uniform1i(P.gradSub.u.uPressure, pres.read.attach(0));
  gl.uniform1i(P.gradSub.u.uVelocity, vel.read.attach(1));
  gl.uniform2f(P.gradSub.u.uTexel, tx[0], tx[1]);
  blit(vel.write); vel.swap();

  P.advWet.bind();
  gl.uniform1i(P.advWet.u.uVelocity, vel.read.attach(0));
  gl.uniform1i(P.advWet.u.uWet, wet.read.attach(1));
  gl.uniform2f(P.advWet.u.uTexel, tx[0], tx[1]);
  gl.uniform2f(P.advWet.u.uSrcTexel, wet.texel[0], wet.texel[1]);
  gl.uniform1f(P.advWet.u.uDt, dt);
  gl.uniform1f(P.advWet.u.uDecay, Math.exp(-dt / Math.max(0.2, L.dry)));
  gl.uniform1f(P.advWet.u.uSpread, L.creep);
  blit(wet.write); wet.swap();

  P.advInk.bind();
  gl.uniform2f(P.advInk.u.uTexel, tx[0], tx[1]);
  gl.uniform2f(P.advInk.u.uSrcTexel, ink[0].texel[0], ink[0].texel[1]);
  gl.uniform1f(P.advInk.u.uDt, dt);
  gl.uniform1f(P.advInk.u.uBleed, L.bleed);
  for (var k = 0; k < ink.length; k++) {
    if (L.used !== undefined && k * 4 >= L.used) break;          // only the textures that hold parts
    gl.uniform1i(P.advInk.u.uVelocity, vel.read.attach(0));
    gl.uniform1i(P.advInk.u.uSource, ink[k].read.attach(1));
    gl.uniform1i(P.advInk.u.uWet, wet.read.attach(2));
    blit(ink[k].write); ink[k].swap();
  }

  P.shown.bind();
  gl.uniform2f(P.shown.u.uRes, dye.w, dye.h);
  gl.uniform1f(P.shown.u.uLo, L.lo); gl.uniform1f(P.shown.u.uHi, L.hi); gl.uniform1f(P.shown.u.uGrain, L.grain);
  for (k = 0; k < shown.length; k++) {
    if (L.used !== undefined && k * 4 >= L.used) break;
    gl.uniform1i(P.shown.u.uInk, ink[k].read.attach(0));
    gl.uniform1i(P.shown.u.uShown, shown[k].read.attach(1));
    blit(shown[k].write); shown[k].swap();
  }
}

/* The tiles of the parts that are appearing: in row 'slot' (from the top), the mask on the left and the ink on the right. */
function draw(list, L) {
  if (st !== 'ok') return;
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  P.out.bind();
  gl.uniform2f(P.out.u.uTexel, ink[0].texel[0], ink[0].texel[1]);
  gl.uniform2f(P.out.u.uRes, dye.w, dye.h);
  gl.uniform1f(P.out.u.uInkAmt, L.ink); gl.uniform1f(P.out.u.uEdge, L.edge); gl.uniform1f(P.out.u.uGrain, L.grain);
  gl.uniform3f(P.out.u.uCol, L.col[0], L.col[1], L.col[2]);
  gl.uniform1i(P.out.u.uWet, wet.read.attach(1));
  list.forEach(function (it) {
    var sel = [0, 0, 0, 0]; sel[it.part % 4] = 1;
    gl.uniform1i(P.out.u.uInk, ink[Math.floor(it.part / 4) % 3].read.attach(0));
    gl.uniform1i(P.out.u.uShown, shown[Math.floor(it.part / 4) % 3].read.attach(2));
    gl.uniform4f(P.out.u.uSel, sel[0], sel[1], sel[2], sel[3]);
    gl.uniform1f(P.out.u.uFin, it.fin);
    var y0 = (slots - 1 - it.slot) * dye.h;
    for (var m = 0; m < 2; m++) {
      gl.uniform1f(P.out.u.uMode, m);
      gl.viewport(m * dye.w, y0, dye.w, dye.h);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
  });
}

window.InkFluid = {
  init: init, size: size, clear: clear, step: step, draw: draw,
  wet: putWet, push: push, ink: putInk,
  get canvas() { return cnv; }, get tileW() { return dye.w; }, get tileH() { return dye.h; },
  slotY: function (s) { return s * dye.h; },
  state: function () { return st; },
  info: function () { return st === 'ok' ? 'flow ' + sim.w + '×' + sim.h + ', ink ' + dye.w + '×' + dye.h : st; }
};
})();

/* Inkwash — MIT License

   Copyright 2026 Jonathan Whitaker

   Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
   documentation files (the "Software"), to deal in the Software without restriction, including without limitation
   the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
   to permit persons to whom the Software is furnished to do so, subject to the following conditions:

   The above copyright notice and this permission notice shall be included in all copies or substantial portions of
   the Software.

   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
   THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
   CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
   IN THE SOFTWARE. */
