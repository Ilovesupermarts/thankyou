/* ============================================================
   FIREWORKS — a night fireworks show in the background, after the
   Nagaoka festival (長岡まつり大花火大会). Shells rise from behind
   the ridges on a glowing tail, then burst into stars.

   What makes them look real:
   - The rise: a bright comet climbs, slowing as it nears the top, with
     a fading tail and sparks falling away behind it (昇り曲導).
   - The burst: the stars fly out as a sphere seen from the front, so
     the disc is densest at its rim. Each star is slowed by the air and
     then falls, so the flower opens fast, hangs, then droops. Stars
     burn for a while, may change colour on the way (変化), and flicker
     out at the end. Chrysanthemum stars leave orange spark tails, peony
     stars none, kamuro stars long gold trails that glitter.
   - The air: each burst lights the sky round it, and faintly the
     mountains; smoke from each burst hangs and drifts with the wind and
     is lit by the bursts that follow. Clouds hide what is behind them
     and glow with the colour of the bursts inside them.

   Shells (the Nagaoka staples):
     kiku     菊 chrysanthemum: stars with spark tails
     botan    牡丹 peony: stars without tails
     yaeshin  八重芯 double pistil: an outer flower round two cores of
              other colours
     kamuro   冠菊 kamuro: long gold trails weeping down like a willow
     senrin   千輪 a thousand flowers: many small flowers popping at once
     ring     型物 a ring, tilted
     yashi    ヤシ palm: a few thick gold comets that droop
     sanshaku 正三尺玉 the giant 3-shaku shell
   Set pieces: スターマイン (star mine: a rapid barrage from a few sites)
   and フェニックス (Phoenix: launches sweeping across the whole width,
   ending in a wide row of big bursts at once).

   Use:
     var show = Fireworks.create(values);   // values: see DEFAULTS
     show.resize(W, H, PR, horizon);        // CSS px; horizon: y of the ground line
     show.update(dt, t);                    // every frame
     show.drawSky(ctx, occluder);           // behind the mountains: the
                                            // darker sky, the fireworks,
                                            // their smoke and the clouds.
                                            // occluder: a canvas the size of
                                            // the screen (any resolution) whose
                                            // opaque parts are what stands in
                                            // front of the show (the mountains,
                                            // the trees): the show is cut out
                                            // there, so it is never seen
                                            // through them. Make one with
                                            // Fireworks.silhouette(). Nothing
                                            // is drawn below the ground line.
     show.drawFront(ctx);                   // in front of the mountains:
                                            // the light of the bursts on them
     show.launch(kind, o);                  // fire one now ('starmine',
                                            // 'phoenix' or a shell above); o, if
                                            // given: x (0 … 1), height (fraction of
                                            // the screen height), scale
     show.active();                         // false when there is nothing to draw
                                            // (no shells, smoke or cloud): the
                                            // occluder need not be made then
     Fireworks.silhouette(src, dst, lo, hi) // dst (a canvas, any size) = the shape
                                            // of src's alpha: nothing below alpha
                                            // lo, solid above hi, as an occluder
   The values are read every frame, so they can be changed at any time.
   ============================================================ */
var Fireworks = (function () {
'use strict';

var PI = Math.PI, TAU = PI * 2;
function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
function lerp(a, b, t) { return a + (b - a) * t; }
function smooth(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
function rnd(a, b) { return a + (b - a) * Math.random(); }
function mix(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }
function css(c, a) {
  return 'rgba(' + Math.round(clamp(c[0], 0, 255)) + ',' + Math.round(clamp(c[1], 0, 255)) + ',' +
         Math.round(clamp(c[2], 0, 255)) + ',' + (a === undefined ? 1 : clamp(a, 0, 1).toFixed(3)) + ')';
}

/* The colours of real stars: strontium red, barium green, copper blue,
   sodium gold, magnesium white, and the mixes between them. */
var PALETTES = {
  nagaoka: [[255, 52, 40], [60, 255, 110], [80, 130, 255], [255, 192, 72], [255, 248, 236], [190, 96, 255],
            [70, 236, 236], [255, 110, 186], [226, 255, 90]],
  gold:    [[255, 192, 72], [255, 226, 150], [255, 248, 236], [255, 150, 52]],
  warm:    [[255, 52, 40], [255, 124, 36], [255, 192, 72], [255, 110, 186], [255, 226, 150]],
  cool:    [[80, 130, 255], [70, 236, 236], [60, 255, 110], [190, 96, 255], [255, 248, 236]],
  pastel:  [[255, 166, 214], [240, 255, 156], [156, 240, 255], [208, 180, 255], [255, 240, 222]]
};
var GOLD = [255, 178, 70], WHITE = [255, 248, 236], SPARK = [255, 150, 64];

var DEFAULTS = {
  // the show
  program: 'mixed',      // 'mixed', 'singles', 'starmine', 'phoenix', 'sanshaku', 'off'
  pace: 1,               // how busy the show is
  // where and how big
  size: 0.2,             // a burst's radius, as a fraction of the screen height
  sizeVariety: 0.5,
  heightLow: 0.3,        // bursts between these heights above the ground line (fraction of the screen height)
  heightHigh: 0.62,
  spreadLeft: 0.06,      // launched between these points across the screen
  spreadRight: 0.94,
  // the rise
  riseTime: 1,           // × the natural time to climb
  tail: 1,               // how bright the rising tail is
  tailSparks: 1,         // sparks falling from it
  wobble: 0.5,
  // the stars
  density: 1,            // how many stars in a flower
  starSize: 1,
  trail: 1,              // how long the spark tails are
  burn: 1,               // how long the stars burn
  gravity: 1,            // how much the flowers droop
  expand: 1,             // how fast they open
  brightness: 1,
  glow: 0.8,             // the soft bloom round the stars
  colourChange: 0.5,     // how many flowers change colour on the way (変化)
  glitter: 0.35,         // how many twinkle
  saturation: 1,         // 1 = the palette, lower = paler and whiter
  palette: 'nagaoka',
  // the mix of shells
  kiku: 1, botan: 0.7, yaeshin: 0.9, kamuro: 0.6, senrin: 0.35, ring: 0.2, yashi: 0.3,
  // the air
  flash: 0.6,            // how much each burst lights the sky
  mountainLight: 0.5,    // and the mountains in front
  smoke: 0.5,
  wind: 0.3,             // drift to the right (negative: to the left)
  haze: 0.15,            // the bursts are far away: a little dimmer
  skyDark: 0.65,         // the night sky darkened behind the show
  // the clouds
  cloudCover: 0,         // 0 a clear sky … 1 overcast
  cloudThickness: 0.75,  // how much they hide what is behind them
  cloudHeight: 0.3,      // the middle of the cloud layer (fraction of the screen height from the top)
  cloudDepth: 0.32,      // how deep the layer is
  cloudGlow: 1,          // how much the bursts light the clouds from inside
  cloudLight: 0.35,      // moonlight on the clouds
  cloudSpeed: 1
};

/* ---------- sprites: a star's head (white-hot core, coloured edge) and a soft glow ---------- */
var sprites = {};
function sprite(col, soft) {
  var key = (soft ? 's' : 'h') + Math.round(col[0] / 8) + ',' + Math.round(col[1] / 8) + ',' + Math.round(col[2] / 8);
  var S = sprites[key];
  if (S) return S;
  var n = soft ? 32 : 24, cv = document.createElement('canvas');
  cv.width = cv.height = n;
  var c = cv.getContext('2d'), g = c.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
  if (soft) {
    g.addColorStop(0, css(col, 0.9)); g.addColorStop(0.35, css(col, 0.35)); g.addColorStop(1, css(col, 0));
  } else {
    g.addColorStop(0, css(mix(col, [255, 255, 255], 0.7), 1));
    g.addColorStop(0.12, css(mix(col, [255, 255, 255], 0.25), 0.95));
    g.addColorStop(0.3, css(col, 0.45));
    g.addColorStop(0.6, css(col, 0.1));
    g.addColorStop(1, css(col, 0));
  }
  c.fillStyle = g; c.fillRect(0, 0, n, n);
  sprites[key] = cv;
  return cv;
}

/* ---------- a soft periodic noise for the cloud layer ---------- */
function hash2(x, y, s) {
  var h = Math.imul(x * 374761393 + y * 668265263 + s * 2147483647, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function vnoise(x, y, px, s) {
  var ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  var ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  var x0 = ((ix % px) + px) % px, x1 = (x0 + 1) % px;
  var a = hash2(x0, iy, s), b = hash2(x1, iy, s), c = hash2(x0, iy + 1, s), d = hash2(x1, iy + 1, s);
  return lerp(lerp(a, b, ux), lerp(c, d, ux), uy);
}

function create(values) {
  var V = values;
  var W = 0, H = 0, PR = 1, hy = 0, now = 0;
  var shells = [], bursts = [], sparks = [], smokes = [], flashes = [], queue = [];
  var timers = null, starCount = 0;
  // the soft bloom (a quarter of the screen), the light it throws into the clouds
  // (an eighth), and the cloud layer's shape on the screen (an eighth)
  var glowCv = document.createElement('canvas'), glowC = glowCv.getContext('2d');
  var litCv = document.createElement('canvas'), litC = litCv.getContext('2d');
  var maskCv = document.createElement('canvas'), maskC = maskCv.getContext('2d');
  var cloudTex = null, cloudBody = null, cloudKey = '';
  // the show is drawn on a layer of its own, so that what stands in front of it can be cut out
  var layerCv = document.createElement('canvas'), layerC = layerCv.getContext('2d');

  function resize(w, h, pr, horizon) {
    W = w; H = h; PR = pr; hy = horizon;
    layerCv.width = Math.max(1, Math.round(W * PR)); layerCv.height = Math.max(1, Math.round(H * PR));
    glowCv.width = Math.max(1, Math.round(W * PR / 4)); glowCv.height = Math.max(1, Math.round(H * PR / 4));
    litCv.width = maskCv.width = Math.max(1, Math.round(W / 8)); litCv.height = maskCv.height = Math.max(1, Math.round(H / 8));
  }

  /* ---------- colours ---------- */
  function palette() { return PALETTES[V.palette] || PALETTES.nagaoka; }
  function colour(not) {
    var P = palette(), c;
    for (var i = 0; i < 6; i++) { c = P[Math.floor(Math.random() * P.length)]; if (c !== not) break; }
    return mix(WHITE, c, clamp(V.saturation, 0, 1));
  }

  /* ---------- the stars of a burst ----------
     A star at age a (s) is at
       x = cx + dx (1 - e^(-a/τ)) + wind a
       y = cy + dy (1 - e^(-a/τ)) + g τ (a - τ (1 - e^(-a/τ)))
     — thrown out at (dx, dy)/τ, slowed by the air (τ), then falling at g τ. */
  function at(B, s, a) {
    var e = 1 - Math.exp(-a / s.tau);
    return [B.x + s.dx * e + B.wind * a, B.y + s.dy * e + s.g * s.tau * (a - s.tau * e)];
  }
  /* A layer of stars on a sphere (radius R px), seen from the front. */
  function layer(B, o) {
    var n = Math.max(6, Math.round(o.n * V.density)), rot = rnd(0, TAU), off = Math.random();
    var tau = o.tau * Math.sqrt(o.R / (H * 0.17)) / Math.max(0.2, V.expand);
    for (var i = 0; i < n; i++) {
      var z = 1 - 2 * (i + off) / n, r = Math.sqrt(Math.max(0, 1 - z * z)), th = rot + i * 2.39996;
      var sx = Math.cos(th) * r + rnd(-0.03, 0.03), sy = Math.sin(th) * r + rnd(-0.03, 0.03);
      if (o.ring) {                                   // a ring: the stars on a tilted circle
        var a = TAU * i / n, ct = Math.cos(o.tilt);
        var px = Math.cos(a), py = Math.sin(a) * ct;
        sx = px * Math.cos(o.roll) - py * Math.sin(o.roll); sy = px * Math.sin(o.roll) + py * Math.cos(o.roll);
      }
      var sp = o.R * (1 + rnd(-o.vary, o.vary));
      B.stars.push({
        dx: sx * sp, dy: sy * sp, tau: tau * rnd(0.92, 1.08),
        g: o.g * V.gravity * 0.55 * o.R,               // px/s²: a bigger flower is further away, so it falls as far in proportion
        T: o.burn * V.burn * rnd(0.88, 1.12), tr: o.trail * V.trail,
        c1: o.c1, c2: o.c2, f: o.f, glit: o.glit, sz: o.sz * V.starSize, tc: o.tc, pop: o.pop ? rnd(0.5, 1.1) : 0,
        fl: Math.random() * 10
      });
    }
  }
  function changeTo(c) { return Math.random() < V.colourChange ? colour(c) : null; }
  function glit() { return Math.random() < V.glitter; }
  /* Make the stars of one shell kind, bursting at (x, y) with radius R. */
  function fill(B, kind, R) {
    var c1 = colour(), c2, base;
    base = { R: R, n: 160, vary: 0.05, tau: 0.3, g: 1, burn: 2.7, trail: 0.55, sz: 1.7, f: rnd(0.45, 0.6), c1: c1, glit: false, tc: null };
    function L(o) { var k, x = {}; for (k in base) x[k] = base[k]; for (k in o) x[k] = o[k]; layer(B, x); }
    switch (kind) {
      case 'kiku':
        c2 = changeTo(c1);
        L({ c2: c2, tc: mix(c1, SPARK, 0.65), glit: glit() });
        B.tail = true; break;
      case 'botan':
        c2 = changeTo(c1);
        L({ n: 130, c2: c2, trail: 0.05, burn: 1.7, sz: 1.9, glit: glit() });
        break;
      case 'yaeshin':
        c2 = colour(c1); var c3 = colour(c2);
        L({ c2: changeTo(c1), tc: mix(c1, SPARK, 0.6), n: 130 });
        L({ R: R * 0.55, n: 70, c1: c2, c2: null, trail: 0.08, burn: 1.7, sz: 1.5 });
        L({ R: R * 0.27, n: 36, c1: c3, c2: null, trail: 0.05, burn: 1.5, sz: 1.3 });
        B.tail = true; break;
      case 'kamuro':
        var gold = mix(GOLD, WHITE, Math.random() * 0.3);
        L({ n: 80, c1: gold, c2: null, tau: 0.34, g: 2.6, burn: 4.2, trail: 1.1, sz: 1.5, glit: true, tc: GOLD, vary: 0.08 });
        B.tail = true; B.gold = true; break;
      case 'senrin':
        L({ n: 26, c1: [255, 210, 150], c2: null, trail: 0.12, burn: 1.2, sz: 0.9, vary: 0.25, pop: true, tc: SPARK });
        break;
      case 'ring':
        var tilt = rnd(0.2, 1.2), roll = rnd(-0.5, 0.5);
        L({ n: 60, ring: true, tilt: tilt, roll: roll, trail: 0.12, burn: 1.8, c2: changeTo(c1) });
        L({ R: R * 0.25, n: 24, c1: colour(c1), trail: 0.05, burn: 1.3, sz: 1.3 });
        break;
      case 'yashi':
        L({ n: 11, c1: GOLD, c2: null, tau: 0.45, g: 2.4, burn: 2.6, trail: 0.9, sz: 3.2, glit: true, tc: GOLD, vary: 0.1 });
        B.tail = true; B.gold = true; break;
      case 'sanshaku':
        var s2 = colour(c1), s3 = colour(s2);
        L({ n: 380, tau: 0.5, burn: 4.2, trail: 0.5, sz: 2, c2: colour(c1), tc: mix(c1, SPARK, 0.6), glit: glit(), vary: 0.04 });
        L({ R: R * 0.55, n: 150, tau: 0.5, c1: s2, c2: null, burn: 3, trail: 0.12, sz: 1.7 });
        L({ R: R * 0.28, n: 70, tau: 0.5, c1: s3, c2: null, burn: 2.6, trail: 0.08, sz: 1.5 });
        B.tail = true; break;
      case 'mini':                                    // the small flowers of a senrin
        L({ n: 26, R: R, trail: 0.04, burn: 0.9, sz: 1.2, tau: 0.18, c1: colour(), c2: null });
        break;
    }
  }

  /* ---------- launching ---------- */
  function pickKind() {
    var ks = ['kiku', 'botan', 'yaeshin', 'kamuro', 'senrin', 'ring', 'yashi'], tot = 0, i;
    for (i = 0; i < ks.length; i++) tot += Math.max(0, V[ks[i]]);
    if (tot <= 0) return 'kiku';
    var x = Math.random() * tot;
    for (i = 0; i < ks.length; i++) { x -= Math.max(0, V[ks[i]]); if (x <= 0) return ks[i]; }
    return 'kiku';
  }
  /* o: x (0 … 1), height (fraction of the screen height above the ground line),
     scale (× the burst size), rise (× the rise time) */
  function shell(kind, o) {
    o = o || {};
    if (kind === 'sanshaku') { o.scale = o.scale || 2.1; o.height = o.height || V.heightHigh; o.rise = o.rise || 1.6; o.x = o.x !== undefined ? o.x : rnd(0.35, 0.65); }
    var x = (o.x !== undefined ? o.x : rnd(V.spreadLeft, V.spreadRight)) * W;
    var hFrac = o.height !== undefined ? o.height : rnd(V.heightLow, V.heightHigh);
    var R = H * V.size * (o.scale || 1) * rnd(1 - V.sizeVariety / 2, 1 + V.sizeVariety / 2);
    var yb = hy - H * hFrac;
    yb = Math.max(yb, R * 0.6 + 10);                   // keep the flower on the screen
    shells.push({
      kind: kind, x0: x, y0: hy + 6, xb: x + rnd(-0.02, 0.02) * W, yb: yb, R: R,
      t0: now, rise: V.riseTime * (o.rise || 1) * (0.9 + 2.2 * (hy + 6 - yb) / H), wob: rnd(0, 10), sp: 0
    });
  }
  function later(dtS, fn) { queue.push({ at: now + dtS, fn: fn }); }
  /* スターマイン: a barrage from two or three sites close together. Returns its length (s). */
  function starmine() {
    var sites = [rnd(0.2, 0.8)], n = Math.round(rnd(18, 28)), len = rnd(6, 9);
    if (Math.random() < 0.7) sites.push(clamp(sites[0] + rnd(-0.18, 0.18), 0.08, 0.92));
    if (Math.random() < 0.5) sites.push(clamp(sites[0] + rnd(-0.25, 0.25), 0.08, 0.92));
    var kinds = ['botan', 'kiku', 'botan', 'kamuro', 'kiku', 'ring'];
    for (var i = 0; i < n; i++) {
      (function (i) {
        var k = kinds[Math.floor(Math.random() * kinds.length)], site = sites[i % sites.length];
        later(len * (i / n) + rnd(0, 0.15), function () {
          shell(k, { x: site + rnd(-0.04, 0.04), scale: rnd(0.4, 0.75), height: rnd(V.heightLow * 0.5, V.heightHigh * 0.75), rise: 0.55 });
        });
      })(i);
    }
    later(len + 0.2, function () {                   // the end of a star mine: a quick volley
      for (var j = 0; j < 5; j++) shell(Math.random() < 0.5 ? 'kamuro' : 'botan', { x: sites[0] + rnd(-0.1, 0.1), scale: rnd(0.7, 1), rise: 0.7 });
    });
    return len + 3;
  }
  /* フェニックス: launches sweep across the whole width and back, then a wide
     row of big bursts all at once. One colour theme for the whole piece. */
  function phoenix() {
    var keep = V.palette, themes = ['gold', 'nagaoka', 'cool', 'warm'];
    var theme = themes[Math.floor(Math.random() * themes.length)];
    var n = 26, sweep = 4.5;
    for (var i = 0; i < n; i++) {
      (function (i) {
        var u = i / (n - 1), x = i < n / 2 ? lerp(0.04, 0.96, u * 2) : lerp(0.96, 0.04, u * 2 - 1);
        later(sweep * u, function () {
          var was = V.palette; V.palette = theme;
          shell(Math.random() < 0.6 ? 'kiku' : 'kamuro', { x: x, scale: rnd(0.75, 1), height: rnd(V.heightLow, V.heightHigh * 0.85), rise: 0.8 });
          V.palette = was;
        });
      })(i);
    }
    later(sweep + 1.2, function () {
      var was = V.palette; V.palette = theme;
      for (var j = 0; j < 9; j++) shell(j % 2 ? 'kamuro' : 'yaeshin', { x: lerp(0.08, 0.92, j / 8), scale: rnd(1, 1.25), height: V.heightHigh * 0.8, rise: 0.9 });
      V.palette = was;
    });
    V.palette = keep;
    return sweep + 6;
  }
  function launch(kind, o) {
    if (kind === 'starmine') return starmine();
    if (kind === 'phoenix') return phoenix();
    shell(kind || pickKind(), o);
    return 0;
  }

  /* ---------- the programme ---------- */
  function programme() {
    var P = V.program, pace = Math.max(0.05, V.pace);
    if (P === 'off') return;
    if (!timers || timers.p !== P) {
      timers = { p: P, single: now + 1, mine: now + 18 / pace, phoenix: now + 45 / pace, big: now + 75 / pace, busy: 0 };
      if (P === 'starmine') timers.mine = now + 0.5;
      if (P === 'phoenix') timers.phoenix = now + 0.5;
      if (P === 'sanshaku') timers.big = now + 0.5;
    }
    var T = timers;
    if (now < T.busy) return;
    if (P === 'starmine' && now >= T.mine) { T.busy = now + starmine(); T.mine = T.busy + 2 / pace; return; }
    if (P === 'phoenix' && now >= T.phoenix) { T.busy = now + phoenix(); T.phoenix = T.busy + 6 / pace; return; }
    if (P === 'sanshaku' && now >= T.big) { shell('sanshaku'); T.busy = now + 9; T.big = now + 12 / pace; return; }
    if (P === 'mixed') {
      if (now >= T.big) { shell('sanshaku'); T.busy = now + 9; T.big = now + 170 / pace; return; }
      if (now >= T.phoenix) { T.busy = now + phoenix(); T.phoenix = now + 110 / pace; return; }
      if (now >= T.mine) { T.busy = now + starmine(); T.mine = now + 50 / pace; return; }
    }
    if ((P === 'mixed' || P === 'singles') && now >= T.single) {
      shell(pickKind());
      if (Math.random() < 0.25) later(rnd(0.2, 0.6), function () { shell(pickKind()); });   // now and then two together
      T.single = now + rnd(2.5, 6.5) / pace;
    }
  }

  /* ---------- the burst ---------- */
  function burst(S) {
    var B = { x: S.xb, y: S.yb, t0: now, R: S.R, wind: V.wind * 20, stars: [], kind: S.kind, tail: false, gold: false, life: 0 };
    fill(B, S.kind, S.R);
    for (var i = 0; i < B.stars.length; i++) {
      var s = B.stars[i], end = s.T + s.tr;
      if (end > B.life) B.life = end;
    }
    starCount += B.stars.length;
    bursts.push(B);
    var big = S.kind === 'sanshaku' ? 2.2 : S.kind === 'mini' ? 0.25 : 1;
    flashes.push({ x: B.x, y: B.y, R: S.R, c: B.stars.length ? B.stars[0].c1 : WHITE, s: big, t0: now, linger: B.life * 0.6 });
    if (S.kind !== 'mini') smokes.push({ x: B.x, y: B.y, r: S.R * 0.6, t0: now, life: 26, d: rnd(0.8, 1.2) });
  }

  /* ---------- every frame ---------- */
  function update(dt, t) {
    now = t;
    programme();
    for (var q = queue.length - 1; q >= 0; q--) if (now >= queue[q].at) { var f = queue[q].fn; queue.splice(q, 1); f(); }
    // rising shells: sparks off the tail, and the burst at the top
    for (var i = shells.length - 1; i >= 0; i--) {
      var S = shells[i], u = (now - S.t0) / S.rise;
      if (u >= 1) { burst(S); shells.splice(i, 1); continue; }
      S.sp += dt * 55 * V.tailSparks;
      var p = shellAt(S, u);
      while (S.sp >= 1) {
        S.sp -= 1;
        sparks.push({ x: p[0] + rnd(-1, 1), y: p[1] + rnd(0, 3), vx: rnd(-14, 14), vy: rnd(5, 40), t0: now, life: rnd(0.3, 0.8) });
      }
    }
    for (var k = sparks.length - 1; k >= 0; k--) {
      var sp = sparks[k];
      if (now - sp.t0 > sp.life) { sparks.splice(k, 1); continue; }
      sp.vy += 45 * dt; sp.x += (sp.vx + V.wind * 20) * dt; sp.y += sp.vy * dt;
    }
    // the senrin's small shells pop into small flowers
    for (var b = bursts.length - 1; b >= 0; b--) {
      var B = bursts[b], a = now - B.t0;
      if (a > B.life + 0.2) { starCount -= B.stars.length; bursts.splice(b, 1); continue; }
      for (var j = B.stars.length - 1; j >= 0; j--) {
        var st = B.stars[j];
        if (st.pop && a >= st.pop) {
          var pp = at(B, st, a);
          bursts.push({ x: pp[0], y: pp[1], t0: now, R: 0, wind: B.wind, stars: [], kind: 'mini', life: 0 });
          var M = bursts[bursts.length - 1], r = B.R * rnd(0.16, 0.24);
          fill(M, 'mini', r);
          for (var m = 0; m < M.stars.length; m++) M.life = Math.max(M.life, M.stars[m].T + M.stars[m].tr);
          starCount += M.stars.length - 1;
          flashes.push({ x: pp[0], y: pp[1], R: r * 2, c: M.stars[0].c1, s: 0.25, t0: now, linger: 0.4 });
          B.stars.splice(j, 1);
        }
      }
    }
    for (var fI = flashes.length - 1; fI >= 0; fI--) if (now - flashes[fI].t0 > flashes[fI].linger + 1.5) flashes.splice(fI, 1);
    for (var sm = smokes.length - 1; sm >= 0; sm--) if (now - smokes[sm].t0 > smokes[sm].life) smokes.splice(sm, 1);
  }
  function shellAt(S, u) {
    var e = 1 - Math.pow(1 - clamp(u, 0, 1), 1.8);
    var w = V.wobble * 2.5 * Math.sin(u * 9 + S.wob) * u;
    return [lerp(S.x0, S.xb, u) + w, lerp(S.y0, S.yb, e)];
  }
  /* How bright a burst's light is now (the flash, then the stars burning). */
  function flashNow(F) {
    var a = now - F.t0;
    return F.s * (Math.exp(-a / 0.16) + 0.3 * smooth(F.linger + 1.2, F.linger * 0.3, a));
  }

  /* ---------- drawing, behind the mountains ---------- */
  function active() {
    return !!(W && (shells.length || bursts.length || flashes.length || smokes.length || V.cloudCover > 0.01));
  }
  function drawSky(main, occ) {
    if (!W) return;
    var dim = 1 - V.haze * 0.5, bright = V.brightness * dim;
    // the night sky, darkened behind the show
    if (V.skyDark > 0) {
      main.save();
      main.setTransform(PR, 0, 0, PR, 0, 0);
      main.globalAlpha = 1;
      main.globalCompositeOperation = 'source-over';
      var sg = main.createLinearGradient(0, 0, 0, hy);
      sg.addColorStop(0, css([8, 10, 28], V.skyDark * 0.85));
      sg.addColorStop(1, css([20, 22, 44], V.skyDark * 0.5));
      main.fillStyle = sg; main.fillRect(0, 0, W, hy + 4);
      main.restore();
    }
    if (!active()) return;
    // the show, on its layer
    var ctx = layerC;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, layerCv.width, layerCv.height);
    ctx.setTransform(PR, 0, 0, PR, 0, 0);
    ctx.globalCompositeOperation = 'lighter';
    // the light of each burst on the sky round it; many bursts at once
    // brighten the sky more, but never wash it out
    var i, F, I, sum = 0;
    for (i = 0; i < flashes.length; i++) sum += flashNow(flashes[i]);
    var cap = sum > 1.5 ? 1.5 / sum : 1;
    for (i = 0; i < flashes.length; i++) {
      F = flashes[i]; I = flashNow(F) * V.flash * cap;
      if (I < 0.01) continue;
      var fr = F.R * 2.6, fg = ctx.createRadialGradient(F.x, F.y, 0, F.x, F.y, fr);
      fg.addColorStop(0, css(mix(F.c, WHITE, 0.4), 0.22 * I)); fg.addColorStop(0.4, css(F.c, 0.07 * I)); fg.addColorStop(1, css(F.c, 0));
      ctx.fillStyle = fg; ctx.fillRect(F.x - fr, F.y - fr, fr * 2, fr * 2);
    }
    // smoke, lit by the bursts near it
    drawSmoke(ctx);
    // the rising shells
    glowC.setTransform(1, 0, 0, 1, 0, 0);
    glowC.clearRect(0, 0, glowCv.width, glowCv.height);
    glowC.setTransform(PR / 4, 0, 0, PR / 4, 0, 0);
    glowC.globalCompositeOperation = 'lighter';
    drawShells(ctx, bright);
    // the flowers
    for (i = 0; i < bursts.length; i++) drawBurst(ctx, bursts[i], bright);
    // the bloom
    if (V.glow > 0) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = clamp(V.glow * 0.7, 0, 1);
      ctx.drawImage(glowCv, 0, 0, W * PR, H * PR);
      ctx.globalAlpha = 1;
      ctx.setTransform(PR, 0, 0, PR, 0, 0);
    }
    ctx.globalCompositeOperation = 'source-over';
    drawClouds(ctx);
    // what stands in front of it (the mountains, the trees) is cut out, and everything
    // below the ground line: the show is never seen through them
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'destination-out';
    if (occ) ctx.drawImage(occ, 0, 0, layerCv.width, layerCv.height);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, Math.round(hy * PR), layerCv.width, layerCv.height);
    ctx.globalCompositeOperation = 'source-over';
    main.save();
    main.setTransform(1, 0, 0, 1, 0, 0);
    main.globalAlpha = 1;
    main.globalCompositeOperation = 'source-over';
    main.drawImage(layerCv, 0, 0);
    main.restore();
  }
  function drawShells(ctx, bright) {
    var i, S, u, p, K = 8, tailT = 0.3;
    // falling sparks
    ctx.fillStyle = css(mix(GOLD, WHITE, 0.3));
    for (i = 0; i < sparks.length; i++) {
      var sp = sparks[i], a = (now - sp.t0) / sp.life;
      ctx.globalAlpha = clamp((1 - a) * 0.7 * bright * V.tail, 0, 1) * (0.5 + Math.random() * 0.5);
      ctx.fillRect(sp.x - 0.6, sp.y - 0.6, 1.2, 1.2);
    }
    ctx.lineCap = 'round';
    for (i = 0; i < shells.length; i++) {
      S = shells[i]; u = (now - S.t0) / S.rise;
      var du = tailT / S.rise;
      for (var k = 0; k < K; k++) {
        var u0 = u - du * k / K, u1 = u - du * (k + 1) / K;
        if (u0 <= 0) break;
        var p0 = shellAt(S, u0), p1 = shellAt(S, Math.max(0, u1));
        ctx.globalAlpha = clamp(bright * V.tail * Math.pow(1 - k / K, 1.6) * 0.9, 0, 1);
        ctx.strokeStyle = css(mix(WHITE, GOLD, k / K));
        ctx.lineWidth = 1.8 * (1 - k / K * 0.6);
        ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke();
      }
      p = shellAt(S, u);
      ctx.globalAlpha = clamp(bright * V.tail, 0, 1);
      ctx.drawImage(sprite(GOLD), p[0] - 5, p[1] - 5, 10, 10);
      glowC.drawImage(sprite(GOLD, true), p[0] - 14, p[1] - 14, 28, 28);
    }
    ctx.globalAlpha = 1;
  }
  function drawBurst(ctx, B, bright) {
    var a = now - B.t0, i, s, n = B.stars.length;
    if (!n) return;
    // the white flash at the moment of the burst
    if (a < 0.25 && B.kind !== 'mini') {
      var fa = 1 - a / 0.25, fr = B.R * 0.3 * (0.5 + a * 3);
      ctx.globalAlpha = clamp(fa * fa * bright * 0.8, 0, 1);
      ctx.drawImage(sprite(WHITE, true), B.x - fr, B.y - fr, fr * 2, fr * 2);
    }
    // the stars in groups that share their colours, so each segment of the
    // tails is one path for the group
    var groups = {}, keys = [];
    for (i = 0; i < n; i++) {
      s = B.stars[i];
      var key = s.c1.join() + '|' + (s.c2 ? s.c2.join() : '') + '|' + s.tr + '|' + s.sz;
      if (!groups[key]) { groups[key] = []; keys.push(key); }
      groups[key].push(s);
    }
    var K = 6;
    for (var g = 0; g < keys.length; g++) {
      var G = groups[keys[g]], s0 = G[0];
      var u = a / s0.T, col = s0.c2 ? mix(s0.c1, s0.c2, smooth(s0.f, s0.f + 0.06, u)) : s0.c1;
      var b = smooth(0, 0.06, a) * (1 - smooth(0.7, 1, u)) * bright;
      // the tails: the spark trail behind each star, fading back along its path
      if (s0.tr > 0.02 && b > 0.01) {
        var tc = s0.tc || col;
        ctx.strokeStyle = css(tc);
        for (var k = 0; k < K; k++) {
          var a0 = a - s0.tr * k / K, a1 = a - s0.tr * (k + 1) / K;
          if (a0 <= 0) break;
          a1 = Math.max(0, a1);
          ctx.globalAlpha = clamp(b * Math.pow(1 - k / K, 1.1) * 0.85, 0, 1);
          ctx.lineWidth = Math.max(0.6, s0.sz * 0.9 * (1 - 0.55 * k / K));
          ctx.beginPath();
          for (i = 0; i < G.length; i++) {
            var q0 = at(B, G[i], a0), q1 = at(B, G[i], a1);
            ctx.moveTo(q0[0], q0[1]); ctx.lineTo(q1[0], q1[1]);
          }
          ctx.stroke();
        }
      }
      // glittering tails (kamuro, palm): sparkles hanging along the trail
      if (s0.glit && s0.tr > 0.3 && b > 0.01) {
        ctx.fillStyle = css(mix(GOLD, WHITE, 0.5));
        for (i = 0; i < G.length; i++) {
          for (var m = 0; m < 3; m++) {
            var am = a - s0.tr * Math.random();
            if (am <= 0) continue;
            var qm = at(B, G[i], am);
            ctx.globalAlpha = clamp(b * Math.random() * 0.9, 0, 1);
            ctx.fillRect(qm[0] - 0.7, qm[1] - 0.7, 1.4, 1.4);
          }
        }
      }
      // the heads
      var head = sprite(col), soft = sprite(col, true);
      for (i = 0; i < G.length; i++) {
        s = G[i];
        if (s.pop) {                                  // a senrin's small shell, on its way
          var pq = at(B, s, a);
          ctx.globalAlpha = clamp(bright * 0.6, 0, 1);
          ctx.drawImage(head, pq[0] - 2, pq[1] - 2, 4, 4);
          continue;
        }
        var us = a / s.T;
        if (us >= 1) continue;
        var bs = smooth(0, 0.06, a) * (1 - smooth(0.7, 1, us)) * bright;
        if (s.glit) bs *= 0.35 + Math.random() * 1.0;
        else if (us > 0.8) bs *= 0.55 + Math.random() * 0.6;   // flickering out
        if (bs < 0.01) continue;
        var q = at(B, s, a), hs = 2.6 * s.sz * (0.7 + 0.3 * Math.min(1, bs));
        ctx.globalAlpha = clamp(bs, 0, 1);
        ctx.drawImage(head, q[0] - hs, q[1] - hs, hs * 2, hs * 2);
        var gs = hs * 3;
        glowC.globalAlpha = clamp(bs * 0.22, 0, 1);
        glowC.drawImage(soft, q[0] - gs, q[1] - gs, gs * 2, gs * 2);
      }
    }
    ctx.globalAlpha = 1;
    glowC.globalAlpha = 1;
  }
  function drawSmoke(ctx) {
    if (V.smoke <= 0) return;
    for (var i = 0; i < smokes.length; i++) {
      var M = smokes[i], a = now - M.t0, life = a / M.life;
      var x = M.x + V.wind * 14 * a * M.d, y = M.y + a * 1.2, r = M.r * (1 + a * 0.05);
      var fade = smooth(0, 0.08, life) * (1 - smooth(0.4, 1, life));
      // the light falling on it from the bursts near it
      var lit = [0, 0, 0], L = 0;
      for (var j = 0; j < flashes.length; j++) {
        var F = flashes[j], I = flashNow(F);
        if (I < 0.01) continue;
        var d = Math.hypot(F.x - x, F.y - y) / (F.R * 2.2 + r);
        var k = I * Math.max(0, 1 - d);
        if (k <= 0) continue;
        lit = [lit[0] + F.c[0] * k, lit[1] + F.c[1] * k, lit[2] + F.c[2] * k]; L += k;
      }
      var amount = V.smoke * fade * (0.06 + Math.min(1, L) * 0.4);
      if (amount < 0.004) continue;
      var c = L > 0 ? mix([150, 150, 170], [lit[0] / L, lit[1] / L, lit[2] / L], 0.7) : [150, 150, 170];
      var g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, css(c, amount)); g.addColorStop(0.6, css(c, amount * 0.45)); g.addColorStop(1, css(c, 0));
      ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
  }

  /* ---------- the clouds ----------
     One strip of cloud, tileable across, baked when its values change: its
     shape (white, for the light inside it) and its body (moonlit grey). */
  function bakeClouds() {
    var key = [V.cloudCover, V.cloudLight].join();
    if (key === cloudKey) return;
    cloudKey = key;
    var TW = 256, TH = 64, cov = clamp(V.cloudCover, 0, 1);
    cloudTex = document.createElement('canvas'); cloudTex.width = TW; cloudTex.height = TH;
    cloudBody = document.createElement('canvas'); cloudBody.width = TW; cloudBody.height = TH;
    var c = cloudTex.getContext('2d'), img = c.createImageData(TW, TH), d = img.data;
    for (var y = 0; y < TH; y++) {
      var v = y / (TH - 1), prof = smooth(0, 0.35, v) * (1 - smooth(0.6, 1, v));   // soft top and bottom
      for (var x = 0; x < TW; x++) {
        var n = 0, amp = 0.5, fx = x / TW * 6, fy = y / TH * 2.2, per = 6;
        for (var o = 0; o < 5; o++) { n += amp * vnoise(fx, fy, per, 11 + o); fx *= 2; fy *= 2; per *= 2; amp *= 0.5; }
        n /= 0.97;                                       // 0 … 1, about 0.5 on average
        var dens = smooth(1 - cov - 0.15, 1 - cov + 0.2, n) * prof;
        if (cov >= 0.95) dens = Math.max(dens, prof * smooth(0.95, 1, cov) * 0.9);
        var o4 = (y * TW + x) * 4;
        d[o4] = d[o4 + 1] = d[o4 + 2] = 255; d[o4 + 3] = Math.round(clamp(dens, 0, 1) * 255);
      }
    }
    c.putImageData(img, 0, 0);
    var b = cloudBody.getContext('2d');
    b.drawImage(cloudTex, 0, 0);
    b.globalCompositeOperation = 'source-in';
    b.fillStyle = css(mix([26, 28, 44], [150, 156, 184], clamp(V.cloudLight, 0, 1)));
    b.fillRect(0, 0, TW, TH);
  }
  function drawStrip(c, img, scale) {
    var top = H * (V.cloudHeight - V.cloudDepth / 2), h = H * V.cloudDepth;
    var off = ((now * 6 * V.cloudSpeed * (V.wind >= 0 ? 1 : -1)) % W + W) % W;
    c.drawImage(img, (off - W) * scale, top * scale, W * scale, h * scale);
    c.drawImage(img, off * scale, top * scale, W * scale, h * scale);
  }
  function drawClouds(ctx) {
    if (V.cloudCover <= 0.01) return;
    bakeClouds();
    // the clouds hide what is behind them
    ctx.globalAlpha = clamp(V.cloudThickness, 0, 1);
    drawStrip(ctx, cloudBody, 1);
    ctx.globalAlpha = 1;
    // and glow with the light of the bursts inside and behind them
    if (V.cloudGlow > 0) {
      maskC.setTransform(1, 0, 0, 1, 0, 0);
      maskC.globalCompositeOperation = 'source-over';
      maskC.clearRect(0, 0, maskCv.width, maskCv.height);
      drawStrip(maskC, cloudTex, 1 / 8);
      litC.setTransform(1, 0, 0, 1, 0, 0);
      litC.globalCompositeOperation = 'source-over';
      litC.clearRect(0, 0, litCv.width, litCv.height);
      litC.drawImage(glowCv, 0, 0, litCv.width, litCv.height);
      litC.globalCompositeOperation = 'lighter';           // a softer, wider spread of the light inside the cloud
      litC.globalAlpha = 0.6;
      litC.drawImage(litCv, -2, -2, litCv.width + 4, litCv.height + 4);
      litC.globalAlpha = 1;
      litC.globalCompositeOperation = 'destination-in';
      litC.drawImage(maskCv, 0, 0);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = clamp(V.cloudGlow * V.cloudThickness * 1.6, 0, 1);
      ctx.drawImage(litCv, 0, 0, W, H);
      if (V.cloudGlow * V.cloudThickness > 0.62) ctx.drawImage(litCv, 0, 0, W, H);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  /* ---------- drawing, in front of the mountains: the light of the bursts on them ---------- */
  function drawFront(ctx) {
    if (!W || V.mountainLight <= 0) return;
    ctx.save();
    ctx.setTransform(PR, 0, 0, PR, 0, 0);
    ctx.globalCompositeOperation = 'lighter';
    var sum = 0, i;
    for (i = 0; i < flashes.length; i++) sum += flashNow(flashes[i]);
    var cap = sum > 1.5 ? 1.5 / sum : 1;
    for (i = 0; i < flashes.length; i++) {
      var F = flashes[i], I = flashNow(F) * V.mountainLight * cap;
      if (I < 0.01) continue;
      var r = F.R * 4, g = ctx.createRadialGradient(F.x, hy, 0, F.x, hy, r);
      g.addColorStop(0, css(F.c, 0.09 * I)); g.addColorStop(1, css(F.c, 0));
      ctx.fillStyle = g; ctx.fillRect(F.x - r, hy - r, r * 2, r * 1.2);
    }
    ctx.restore();
  }

  return {
    values: V,
    resize: resize, update: update, drawSky: drawSky, drawFront: drawFront, active: active,
    launch: launch,
    clear: function () { shells.length = bursts.length = sparks.length = smokes.length = flashes.length = queue.length = 0; starCount = 0; timers = null; },
    restart: function () { timers = null; },
    info: function () { return shells.length + ' rising, ' + bursts.length + ' flowers, ' + starCount + ' stars'; }
  };
}

/* dst = the shape of src's alpha, as an occluder for drawSky: transparent
   where src's alpha is under lo, solid where it is over hi. Read back from
   the canvas, so make it once (when src is baked), not every frame. */
function silhouette(src, dst, lo, hi) {
  var w = dst.width, h = dst.height, c = dst.getContext('2d');
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalCompositeOperation = 'source-over';
  c.globalAlpha = 1;
  c.clearRect(0, 0, w, h);
  c.drawImage(src, 0, 0, w, h);
  var img = c.getImageData(0, 0, w, h), d = img.data;
  for (var i = 3; i < d.length; i += 4) {
    d[i - 3] = d[i - 2] = d[i - 1] = 0;
    d[i] = Math.round(smooth(lo, hi, d[i] / 255) * 255);
  }
  c.putImageData(img, 0, 0);
}

return { create: create, DEFAULTS: DEFAULTS, PALETTES: PALETTES, silhouette: silhouette };
})();
