/* ============================================================
   WINTER TORII — the vermilion torii gates for the new winter scene
   (tested in torii.html; later newwinter.html, step 9). Everything is
   drawn in code.

   Each gate is a solid in METRES, standing on the snow, seen through the
   scene's own camera (the eye `eye` m above the snow, on the horizon line
   hy, lens F px; x right of the eye, y up from the snow, z away from it),
   so its size, its perspective and which faces show all follow from
   where it stands and how it is turned:
   - two round pillars (柱), a little thinner at the top and leaning in
     (転び), each with a black sleeve at its foot (根巻);
   - the tie beam (貫) through both pillars, its ends sticking out, with a
     wedge (楔) just outside each pillar; the short centre post (額束);
   - the two upper beams curving up toward their ends (反り): the shimaki
     (島木) and on it the kasagi (笠木), black as in the reference (or
     vermilion with a black top), their ends cut slanting outward;
   - optional: a capital ring at each pillar's top (台輪), a name plaque.
   Every surface is lit by the scene's light from its own direction: the
   sun, the sky, and the light thrown up from the sunlit snow (so the
   beams' undersides are not dark holes); a round pillar is shaded across
   from the normals actually facing the eye. Soft shade where the beams
   meet the pillars. Hazed into the mist by distance, as the snow is.
   Light weathering: grime above the sleeves, rain streaks running down
   from the joints and the beams' ends, faded paint where the sun falls,
   faint grain. Each gate its own (seeded).
   No snow on the gates (the user: first get the gates right).

   Use:
     WinterTorii.build(o) → G (the gate's shape)
       o: span (m between the pillars' centres at the foot), height (m, the snow to the kasagi's top in the middle),
          dia (m, the pillars' diameter at the foot), lean (deg), sori (m: how far the beams' ends rise), overhang (m: the
          kasagi beyond each pillar's top), nukiAt (share of the height), nemaki (share of the height), daiwa, kusabi,
          plaque (true / false), seed
     WinterTorii.draw(c, G, place, cam, light, look)   c: a 2D context set up for CSS px
       place: { x, z (m, camera space: the middle of the gate on the snow), fx, fz (unit: the way the path runs through it) }
       cam: { W, H, hy, F, eye }
       light: { dir: toward the sun [x right, y up, z AWAY], sun: [r,g,b] 0…1+, sky: [r,g,b] 0…1, amb, vis,
                snow: [r,g,b] 0…255 (the snow's colour, for the light it throws up), mist: [r,g,b] (the haze's colour) }
       look: { red, black, stone: [r,g,b], kasagiBlack, vivid (0…1), weather (0…2), haze (0…2), hazeM (m), soft }
       → { x0, y0, x1, y1 } the screen box it covers (CSS px)
     WinterTorii.shadow(c, G, place, cam, light)   the shapes of its shadow on the snow, filled in c's current fillStyle
   ============================================================ */
var WinterTorii = (function () {
'use strict';

var PI = Math.PI, TAU = PI * 2;
function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
function lerp(a, b, t) { return a + (b - a) * t; }
function smooth(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
function mix(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }
function rgb(c, a) {
  return 'rgba(' + Math.round(clamp(c[0], 0, 255)) + ',' + Math.round(clamp(c[1], 0, 255)) + ',' +
         Math.round(clamp(c[2], 0, 255)) + ',' + (a === undefined ? 1 : clamp(a, 0, 1).toFixed(3)) + ')';
}
function rng(seed) {
  var a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function norm(v) { var l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function d(o, k, v) { return o[k] === undefined ? v : o[k]; }
/* convex hull of screen points (monotone chain) */
function hull(P) {
  P = P.slice().sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; });
  if (P.length < 3) return P;
  function cr(o, a, b) { return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); }
  var lo = [], up = [], i;
  for (i = 0; i < P.length; i++) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], P[i]) <= 0) lo.pop(); lo.push(P[i]); }
  for (i = P.length - 1; i >= 0; i--) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], P[i]) <= 0) up.pop(); up.push(P[i]); }
  up.pop(); lo.pop();
  return lo.concat(up);
}
function poly(c, P) { c.beginPath(); for (var i = 0; i < P.length; i++) { if (i) c.lineTo(P[i][0], P[i][1]); else c.moveTo(P[i][0], P[i][1]); } c.closePath(); }

/* ---------------- the shape (local metres: a across, + to the right as you walk through; y up from the snow; b along the
   path, + the way you walk; the face toward b < 0 greets you) ---------------- */
function build(o) {
  var S = d(o, 'span', 5.3), Ht = d(o, 'height', 7.6), r0 = d(o, 'dia', 0.58) / 2, r1 = r0 * 0.9;
  var hs = S / 2, kT = 0.062 * Ht, sT = 0.042 * Ht, yP = Ht - kT - sT;
  var lean = Math.tan(d(o, 'lean', 1.5) * PI / 180) * yP;
  var nY = d(o, 'nukiAt', 0.73) * Ht, nT = 0.05 * Ht, nD = 1.3 * r0, nem = d(o, 'nemaki', 0.13) * Ht;
  function axis(y) { return hs - lean * (y / yP); }               // the pillar's axis (|a|) at height y
  function radius(y) { return lerp(r0, r1, y / yP); }
  var G = { S: S, Ht: Ht, r0: r0, r1: r1, yP: yP, kT: kT, sT: sT, nY: nY, nT: nT, nD: nD, nem: nem, axis: axis, radius: radius,
            seed: d(o, 'seed', 1), daiwa: !!o.daiwa, kusabi: o.kusabi !== false, plaque: !!o.plaque };
  var over = d(o, 'overhang', 0.39 * S), sori = d(o, 'sori', 0.045 * Ht), aT = axis(yP);
  G.kasagi = { half: aT + over, flare: 0.035 * S, y0: yP + sT, th: kT, dep: 2.7 * r0, sori: sori, lift: 1.08 };
  G.shimaki = { half: aT + over * 0.84, flare: 0.012 * S, y0: yP, th: sT, dep: 2.2 * r0, sori: sori * 0.86, lift: 1.0 };
  var aN = axis(nY), rN = radius(nY);
  G.nuki = { aN: aN, rN: rN, over: 0.2 * S, y0: nY - nT / 2, y1: nY + nT / 2, dep: nD };
  G.gaku = { w: 1.15 * r0 * 2 / 2, y0: nY + nT / 2, y1: yP, dep: nD * 0.95 };
  // the shimaki's underside at a (it curves up toward its ends, so over the pillars it is higher than in the middle:
  // each pillar runs up to it, its top following the curve across its own width)
  G.underAt = function (a) { return yP + soriAt(G.shimaki, a / G.shimaki.half); };
  G.topMax = G.underAt(aT + r1) + 0.02;
  G.kus = { kw: Math.max(0.05, rN * 0.3), kH: nT * 1.12, kD: nD * 0.8 };
  G.snow = d(o, 'snow', 0) > 0 ? buildSnow(G, o) : null;
  return G;
}
// the upturn of a beam at u (−1 … 1 along it)
function soriAt(B, u) { var a = Math.max(0, (Math.abs(u) - 0.12) / 0.88); return B.sori * Math.pow(a, 2.1); }

/* ---------------- the snow lying on the gate (local metres, as the gate). Each heap is a run of stations along the
   top of a beam (or a wedge): at each station the snow's depth h and how far it overhangs each edge (ov) and hangs down
   there (dr). A heap piles up high against a wall it meets (a pillar, the centre post, a wedge: the crevices, where the
   snow is held), thins out to nothing at a free end and where the beam slopes up (the kasagi's upturned tips), breaks
   into gaps where it has fallen, and is different on every gate (its own seed: its depth, gaps, lips). ---------------- */
function buildSnow(G, o) {
  var rs = rng((o.seed || 1) * 977 + 5), vary = d(o, 'snowVary', 0.6), crev = d(o, 'crevice', 1);
  var amt = o.snow * (1 + vary * (rs() * 0.9 - 0.45));
  var gapT = lerp(-0.9, -0.15, rs() * vary);                 // how much has fallen off (higher: more gaps)
  var lipK = lerp(0.7, 1.3, rs());
  var tab = []; for (var i = 0; i < 256; i++) tab.push(rs());
  function n1(x, s) { x += s * 17.3; var i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(tab[(i % 256 + 256) % 256], tab[((i + 1) % 256 + 256) % 256], u) * 2 - 1; }
  var heaps = [], seedN = 0;
  // ends: 'free' (thins to nothing) or a wall it piles up against: { half (m: half the wall's depth across the beam: the
  // snow may not overhang past it there), off (m: from the end to the wall's face), cyl (a round pillar: the snow is cut
  // along its curved face) }
  function heap(grp, a0, a1, baseY, hd, H0, e0, e1, slopeK) {
    var M = Math.max(8, Math.round((a1 - a0) / 0.05)), st = [], sN = ++seedN * 3.1;
    var W0 = e0 === 'free' ? null : e0, W1 = e1 === 'free' ? null : e1;
    for (var i = 0; i <= M; i++) {
      var a = lerp(a0, a1, i / M), y = baseY(a), t0 = a - a0 - (W0 ? W0.off || 0 : 0), t1 = a1 - a - (W1 ? W1.off || 0 : 0);
      var h = H0 * (0.8 + 0.25 * n1(a / 0.9, sN) + 0.08 * n1(a / 0.3, sN + 5));
      // a free end rounds off; against a wall the snow is held and piles up in a rounded drift (the crevice)
      if (!W0) h *= Math.sqrt(smooth(0, 0.35, t0)) * (0.55 + 0.45 * smooth(0, 0.8, t0)); else h += H0 * crev * 0.5 * Math.exp(-Math.pow(Math.max(0, t0) / 0.42, 2));
      if (!W1) h *= Math.sqrt(smooth(0, 0.35, t1)) * (0.55 + 0.45 * smooth(0, 0.8, t1)); else h += H0 * crev * 0.5 * Math.exp(-Math.pow(Math.max(0, t1) / 0.42, 2));
      if (slopeK) { var sl = Math.abs(baseY(a + 0.05) - baseY(a - 0.05)) / 0.1; h *= 1 - smooth(0.1, 0.42, sl); }
      // gaps where it has fallen (never right in a crevice)
      var g = n1(a / 1.25, sN + 11), wallNear = (W0 && t0 < 0.25) || (W1 && t1 < 0.25);
      if (!wallNear) h *= lerp(0.3, 1, smooth(gapT - 0.3, gapT + 0.3, g));
      // how far its lips may overhang here: next to a wall no farther than the wall is deep (else they would stand out
      // past it, resting on nothing)
      var lim = 1;
      if (W0) lim = Math.min(lim, lerp(Math.max(0, W0.half * 0.95 - hd), 1, smooth(0.04, 0.45, t0)));
      if (W1) lim = Math.min(lim, lerp(Math.max(0, W1.half * 0.95 - hd), 1, smooth(0.04, 0.45, t1)));
      st.push({ a: a, y: y, h: Math.max(0, h), w: n1(a / 0.7, sN + 21) * 0.5 + 0.5, wb: n1(a / 0.7, sN + 31) * 0.5 + 0.5, lim: lim, t0: t0, t1: t1 });
    }
    // smoothed along the beam (no steps or spikes), then the lips from the smoothed depth, broken and uneven: lumps, thicker
    // and thinner stretches, here and there a drip hanging off (a snow edge is never a clean line)
    for (var pass = 0; pass < 3; pass++) {
      var hs = st.map(function (q) { return q.h; });
      for (i = 1; i < st.length - 1; i++) st[i].h = (hs[i - 1] + 2 * hs[i] + hs[i + 1]) / 4;
    }
    st.forEach(function (q) {
      var a = q.a, ov = Math.min(0.17 * lipK, 0.015 + q.h * 0.5);
      function rough(s1) { return 0.7 + 0.3 * (n1(a / 0.45, s1) * 0.65 + n1(a / 0.19, s1 + 3) * 0.35 + 1); }
      q.ovF = Math.min(ov * (0.75 + 0.45 * q.w) * rough(sN + 41), q.lim); q.ovB = Math.min(ov * (0.7 + 0.4 * q.wb) * rough(sN + 45), q.lim);
      q.dF = Math.min(q.h * 0.55, q.ovF * 1.1) * rough(sN + 51); q.dB = Math.min(q.h * 0.55, q.ovB * 1.1) * rough(sN + 55);
      // a few rounded lumps sagging lower off the lip, unevenly spaced (no teeth)
      var dr = n1(a / 0.16, sN + 61), dr2 = n1(a / 0.16, sN + 65);
      if (dr > 0.62) q.dF += q.h * 0.3 * Math.sqrt((dr - 0.62) / 0.38) * Math.min(1, q.ovF / 0.05);
      if (dr2 > 0.62) q.dB += q.h * 0.3 * Math.sqrt((dr2 - 0.62) / 0.38) * Math.min(1, q.ovB / 0.05);
      q.bmp = n1(a / 0.35, sN + 71) * 0.75 + n1(a / 0.17, sN + 75) * 0.25;
      // toward a wall the snow narrows and rounds off (a drift pressed against it, never a slab cut off at the beam's full
      // depth) and its lips stop hanging; toward a free end it narrows as it thins out
      var w0 = W0 ? smooth(0, 0.35, q.t0) : smooth(0, 0.5, q.t0), w1 = W1 ? smooth(0, 0.35, q.t1) : smooth(0, 0.5, q.t1), ww = Math.min(w0, w1);
      q.sh = lerp(W0 || W1 ? 0.55 : 0.5, 1, ww);
      if (W0) { var k0 = smooth(0, 0.3, q.t0); q.dF *= k0; q.dB *= k0; }
      if (W1) { var k1 = smooth(0, 0.3, q.t1); q.dF *= k1; q.dB *= k1; }
    });
    var hp = { grp: grp, hd: hd, st: st };
    if (W0 && W0.cyl) hp.cyl = { axis: W0.cyl, r: W0.half, side: 'start' };
    if (W1 && W1.cyl) hp.cyl = { axis: W1.cyl, r: W1.half, side: 'end' };
    heaps.push(hp);
  }
  var K = G.kasagi, ht = K.half + K.flare, nk = G.nuki, gw = G.gaku.w, k = G.kus;
  heap('kasagi', -ht * 0.995, ht * 0.995, function (a) { return K.y0 + K.th + soriAt(K, a / ht) * K.lift; }, K.dep / 2, 0.42 * amt, 'free', 'free', true);
  var ny = function () { return nk.y1; };
  var kOut = nk.aN + nk.rN + k.kw * 1.12;
  // the snow runs right up to the pillars (cut along their round face), to the centre post's sides and to the wedges
  var pil = function (sd) { return { half: nk.rN, off: nk.rN, cyl: sd * nk.aN }; }, gak = { half: G.gaku.dep / 2, off: 0 }, kus = { half: k.kD / 2, off: 0 };
  heap('midL', -nk.aN, -gw, ny, nk.dep / 2, 0.26 * amt, pil(-1), gak);
  heap('midR', gw, nk.aN, ny, nk.dep / 2, 0.26 * amt, gak, pil(1));
  heap('endL', -(nk.aN + nk.over) * 0.995, G.kusabi ? -kOut : -nk.aN, ny, nk.dep / 2, 0.24 * amt, 'free', G.kusabi ? kus : pil(-1));
  heap('endR', G.kusabi ? kOut : nk.aN, (nk.aN + nk.over) * 0.995, ny, nk.dep / 2, 0.24 * amt, G.kusabi ? kus : pil(1), 'free');
  if (G.kusabi) {
    var ky = (nk.y0 + nk.y1) / 2 + k.kH / 2;
    [-1, 1].forEach(function (sd) {
      var ka = sd * (nk.aN + nk.rN + k.kw * 0.6);
      heap(sd < 0 ? 'kusL' : 'kusR', ka - k.kw / 2, ka + k.kw / 2, function () { return ky; }, k.kD / 2, 0.1 * amt * (0.6 + 0.4 * crev), 'free', 'free');
    });
  }
  // where clumps may let go and fall (lips with enough snow, and the crevices)
  var emit = [];
  heaps.forEach(function (hp) {
    hp.st.forEach(function (q, i) {
      if (q.h < 0.05 || i % 2) return;
      emit.push({ p: [q.a, q.y - q.dF * 0.4, -(hp.hd + q.ovF)], h: q.h, grp: hp.grp });
      emit.push({ p: [q.a, q.y - q.dB * 0.4, hp.hd + q.ovB], h: q.h, grp: hp.grp });
    });
  });
  return { heaps: heaps, emit: emit, amt: amt, plaster: d(o, 'plaster', 1) * (0.6 + 0.8 * rs()), seed: rs() * 1e4 | 0 };
}
/* one station's cross-section (b across the beam: < 0 the face that greets you; v up from the beam's top), front lip to back lip */
function section(hd, q) {
  var P = [[-hd, -0.004], [-(hd + q.ovF * 0.55), -q.dF * 0.85], [-(hd + q.ovF * 0.9), -q.dF * 0.55], [-(hd + q.ovF), -q.dF * 0.15]];
  for (var j = 1; j <= 11; j++) {
    var t = -1 + 2 * j / 12, w = t < 0 ? hd + q.ovF : hd + q.ovB;
    var bm = (q.bmp || 0) * (1 - Math.abs(t) * 0.5);
    P.push([t * w * 0.97 * (1 + 0.05 * bm * Math.abs(t)), q.h * Math.pow(1 - Math.pow(Math.abs(t), 2.4), 0.55) * (1 + 0.07 * bm) + (q.dF + q.dB) * 0.08 * (1 - Math.abs(t))]);
  }
  P.push([hd + q.ovB, -q.dB * 0.15], [hd + q.ovB * 0.9, -q.dB * 0.55], [hd + q.ovB * 0.55, -q.dB * 0.85], [hd, -0.004]);
  return P;
}

/* ---------------- drawing ---------------- */
/* place: { x, z (m, camera space: where the gate's middle stands on the snow), fx, fz (the way it faces: along the path),
   tilt (radians, optional: the whole gate leaned about the line between its feet, + its top toward the face that greets
   you, b < 0), y0 (m, optional: how high the ground stands where its feet are, e.g. the rise the hall stands on) }.
   Turning a gate is only a different fx, fz. */
function frame(place, cam) {
  var fx = place.fx, fz = place.fz, rx = fz, rz = -fx, X = place.x, Z = place.z, eye = cam.eye, F = cam.F, cx = cam.W / 2, hy = cam.hy;
  var tl = place.tilt || 0, ct = Math.cos(tl), st = Math.sin(tl), gy = place.y0 || 0;
  function tw(a, y, b, x0, z0, yy) { var y2 = ct * y + st * b, b2 = ct * b - st * y; return [x0 + a * rx + b2 * fx, y2 + yy, z0 + a * rz + b2 * fz]; }
  // a direction in camera space → the gate's own (a, y, b)
  function loc(vx, vy, vz) { var a = vx * rx + vz * rz, bw = vx * fx + vz * fz; return [a, ct * vy - st * bw, st * vy + ct * bw]; }
  return {
    // local (a, y, b) → camera [x, y (from the snow), z]
    w: function (a, y, b) { return tw(a, y, b, X, Z, gy); },
    n: function (na, ny, nb) { return tw(na, ny, nb, 0, 0, 0); },
    loc: loc,
    locP: function (q) { return loc(q[0] - X, q[1] - gy, q[2] - Z); },
    p: function (q) { var z = Math.max(0.2, q[2]); return [cx + F * q[0] / z, hy - F * (q[1] - eye) / z]; },
    eye: [0, eye, 0], rx: rx, rz: rz, fx: fx, fz: fz
  };
}
function painter(G, place, cam, Lt, look) {
  var T = frame(place, cam), Ls = Lt.dir;
  var zc = Math.max(1, place.z), hazeM = d(look, 'hazeM', 260);
  // (hazeAdd: more of the air between, so each gate farther back stands apart from the one in front: torii.html's separation)
  var hz = clamp((1 - Math.exp(-Math.pow(zc / hazeM, 1.6))) * d(look, 'haze', 1) + d(look, 'hazeAdd', 0), 0, 1);
  var vivid = d(look, 'vivid', 0.5);
  // the light the sunlit snow throws back up (an albedo of about 0.8: the snow's own colour lit by sun and sky)
  var sn = Lt.snow || [250, 250, 252], bo = [], skyB = [];
  for (var ch = 0; ch < 3; ch++) {
    bo.push(sn[ch] / 255 * 0.8 * (Lt.sun[ch] * Math.max(0, Ls[1]) * (Lt.vis === undefined ? 1 : Lt.vis) + Lt.sky[ch] * Lt.amb * 0.9));
    skyB.push(Lt.sky[ch]);
  }
  function vividPaint(out, base) {
    if (vivid <= 0) return out;
    var lo = 0.3 * out[0] + 0.59 * out[1] + 0.11 * out[2], lb = 0.3 * base[0] + 0.59 * base[1] + 0.11 * base[2] || 1;
    var f = lo / lb, k = vivid;
    return [lerp(out[0], Math.min(255, base[0] * f), k), lerp(out[1], Math.min(255, base[1] * f), k), lerp(out[2], Math.min(255, base[2] * f), k)];
  }
  /* a colour lit from the direction n (camera space), occ: how much of the sun and sky reach it (0 … 1) */
  function shade(base, n, occ, spec) {
    n = norm(n);
    var k = occ === undefined ? 1 : occ;
    var dl = Math.max(0, n[0] * Ls[0] + n[1] * Ls[1] + n[2] * Ls[2]) * k;
    var sk = (0.62 + 0.38 * n[1]) * Lt.amb * lerp(0.6, 1, k);
    var up = Math.max(0, 0.55 - 0.45 * n[1]) * 0.55;               // facing down and sideways: the snow's light from below
    var out = [];
    for (var ch = 0; ch < 3; ch++) out.push(base[ch] * (Lt.sun[ch] * dl + skyB[ch] * sk + bo[ch] * up));
    out = vividPaint(out, base);
    if (spec) {                                                      // a dull sheen (old lacquer), toward the sun's reflection
      var v = norm(sub(T.eye, place.c || [place.x, 2, place.z])), hv = norm([Ls[0] + v[0], Ls[1] + v[1], Ls[2] + v[2]]);
      var s = Math.pow(Math.max(0, n[0] * hv[0] + n[1] * hv[1] + n[2] * hv[2]), 18) * spec * k;
      for (ch = 0; ch < 3; ch++) out[ch] += 255 * Lt.sun[ch] * s;
    }
    return mix(out, Lt.mist, hz);
  }
  function facing(n, q) { var v = sub(T.eye, q); return n[0] * v[0] + n[1] * v[1] + n[2] * v[2] > 0; }
  return { T: T, shade: shade, facing: facing, hz: hz };
}

/* the parts as convex solids: each a list of local points (for the outline and the shadow) */
function solids(G) {
  var out = [], N = 20, i, k;
  function cyl(a0, y0, a1, y1, r0, r1, tag) {
    var pts = [];
    for (i = 0; i < N; i++) { var t = i / N * TAU, ca = Math.cos(t), sa = Math.sin(t); pts.push([a0 + ca * r0, y0, sa * r0], [a1 + ca * r1, y1, sa * r1]); }
    out.push({ tag: tag, pts: pts });
  }
  for (var s = -1; s <= 1; s += 2) {
    cyl(s * G.axis(0), -0.1, s * G.axis(G.topMax), G.topMax, G.r0 * 1.06, G.r1, 'pillar');
  }
  var n = G.nuki;
  out.push({ tag: 'nuki', pts: boxPts(-(n.aN + n.over), n.aN + n.over, n.y0, n.y1, -n.dep / 2, n.dep / 2) });
  var g = G.gaku; out.push({ tag: 'gaku', pts: boxPts(-g.w, g.w, g.y0, g.y1, -g.dep / 2, g.dep / 2) });
  [G.shimaki, G.kasagi].forEach(function (B, bi) {
    var M = 8;
    for (k = 0; k < M; k++) {
      var u0 = -1 + 2 * k / M, u1 = -1 + 2 * (k + 1) / M, P = [];
      [u0, u1].forEach(function (u) {
        var hb = B.half, ht = B.half + B.flare, sb = soriAt(B, u);
        P.push([u * hb, B.y0 + sb, -B.dep / 2], [u * hb, B.y0 + sb, B.dep / 2], [u * ht, B.y0 + B.th + sb * B.lift, -B.dep / 2], [u * ht, B.y0 + B.th + sb * B.lift, B.dep / 2]);
      });
      out.push({ tag: bi ? 'kasagi' : 'shimaki', pts: P });
    }
  });
  return out;
}
function newell(Q) {
  var n = [0, 0, 0];
  for (var i = 0; i < Q.length; i++) { var a = Q[i], b = Q[(i + 1) % Q.length]; n[0] += (a[1] - b[1]) * (a[2] + b[2]); n[1] += (a[2] - b[2]) * (a[0] + b[0]); n[2] += (a[0] - b[0]) * (a[1] + b[1]); }
  return norm(n);
}
function boxPts(a0, a1, y0, y1, b0, b1) {
  return [[a0, y0, b0], [a1, y0, b0], [a1, y1, b0], [a0, y1, b0], [a0, y0, b1], [a1, y0, b1], [a1, y1, b1], [a0, y1, b1]];
}

function draw(c, G, place, cam, Lt, look) {
  look = look || {};
  var PN = painter(G, place, cam, Lt, look), T = PN.T, shade = PN.shade, facing = PN.facing;
  var RED = look.red || [216, 64, 30], BLACK = look.black || [38, 33, 31], STONE = look.stone || [150, 146, 140];
  var wea = d(look, 'weather', 1), r = rng(G.seed * 7919 + 17);
  var box = { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 };
  function grow(P) { for (var i = 0; i < P.length; i++) { box.x0 = Math.min(box.x0, P[i][0]); box.x1 = Math.max(box.x1, P[i][0]); box.y0 = Math.min(box.y0, P[i][1]); box.y1 = Math.max(box.y1, P[i][1]); } }
  function P(a, y, b) { return T.p(T.w(a, y, b)); }
  function pxPerM(a, y, b) { var q = T.w(a, y, b); return cam.F / Math.max(0.2, q[2]); }
  function fillPoly(Q, col) {
    poly(c, Q); c.fillStyle = col; c.fill();
    c.lineJoin = 'round'; c.strokeStyle = col; c.lineWidth = 0.5; c.stroke();         // (closes the hairline gaps between faces)
    grow(Q);
  }

  /* ---- a box: its faces toward the eye, each lit as it faces ---- */
  function drawBox(a0, a1, y0, y1, b0, b1, base, occ, tag) {
    var F6 = [
      { n: [0, 0, -1], q: [[a0, y0, b0], [a1, y0, b0], [a1, y1, b0], [a0, y1, b0]] },
      { n: [0, 0, 1], q: [[a1, y0, b1], [a0, y0, b1], [a0, y1, b1], [a1, y1, b1]] },
      { n: [-1, 0, 0], q: [[a0, y0, b1], [a0, y0, b0], [a0, y1, b0], [a0, y1, b1]] },
      { n: [1, 0, 0], q: [[a1, y0, b0], [a1, y0, b1], [a1, y1, b1], [a1, y1, b0]] },
      { n: [0, 1, 0], q: [[a0, y1, b0], [a1, y1, b0], [a1, y1, b1], [a0, y1, b1]] },
      { n: [0, -1, 0], q: [[a0, y0, b1], [a1, y0, b1], [a1, y0, b0], [a0, y0, b0]] }];
    var shapes = [];
    for (var i = 0; i < 6; i++) {
      var f = F6[i], nw = T.n(f.n[0], f.n[1], f.n[2]), m = [0, 0, 0];
      f.q.forEach(function (q) { m[0] += q[0] / 4; m[1] += q[1] / 4; m[2] += q[2] / 4; });
      if (!facing(nw, T.w(m[0], m[1], m[2]))) continue;
      var Q = f.q.map(function (q) { return P(q[0], q[1], q[2]); });
      // a box face is lit flat, with a soft roll toward its edges (eased edges, as a planed beam has)
      var col = shade(base, nw, occ);
      fillPoly(Q, rgb(col));
      shapes.push({ Q: Q, n: f.n, col: col });
    }
    return shapes;
  }

  /* ---- a round part (a pillar's length, a sleeve, a ring): its outline is the hull of its two end circles; shaded
     across from the normals that really face the eye ---- */
  function drawCyl(a0, y0, a1, y1, rA, rB, base, opt) {
    opt = opt || {};
    var N = 28, pts = [], i;
    for (i = 0; i < N; i++) {
      var t = i / N * TAU, ca = Math.cos(t), sa = Math.sin(t);
      pts.push(P(a0 + ca * rA, y0, sa * rA), P(a1 + ca * rB, y1, sa * rB));
    }
    var Hh = hull(pts);
    // across: the normals from the left outline to the right one, at mid height
    var am = (a0 + a1) / 2, ym = (y0 + y1) / 2, rm = (rA + rB) / 2, ax = T.w(am, ym, 0);
    var vd = norm([-ax[0], 0, -ax[2]]), pr = [-vd[2], 0, vd[0]];
    var L = P(am, ym, 0), sR = pxPerM(am, ym, 0) * rm;
    var g = c.createLinearGradient(L[0] - sR, L[1], L[0] + sR, L[1]);
    for (i = 0; i <= 12; i++) {
      var tt = i / 12, th = Math.asin(tt * 2 - 1), n = [vd[0] * Math.cos(th) + pr[0] * Math.sin(th), 0, vd[2] * Math.cos(th) + pr[2] * Math.sin(th)];
      g.addColorStop(tt, rgb(shade(base, n, opt.occ, opt.spec)));
    }
    poly(c, Hh); c.fillStyle = g; c.fill(); grow(Hh);
    return { H: Hh, L: L, sR: sR, ppm: pxPerM(am, ym, 0) };
  }

  /* ---- a beam that curves up toward its ends: its strips (under side, front, back, top) and its two end faces ---- */
  function beamPts(B, M) {
    var bf = [], bb = [], tf = [], tb = [];
    for (var i = 0; i <= M; i++) {
      var u = -1 + 2 * i / M, hb = B.half, ht = B.half + B.flare, sb = soriAt(B, u);
      bf.push([u * hb, B.y0 + sb, -B.dep / 2]); bb.push([u * hb, B.y0 + sb, B.dep / 2]);
      tf.push([u * ht, B.y0 + B.th + sb * B.lift, -B.dep / 2]); tb.push([u * ht, B.y0 + B.th + sb * B.lift, B.dep / 2]);
    }
    return { bf: bf, bb: bb, tf: tf, tb: tb, M: M };
  }
  function strip(A, Bq, n, base, occ, grad) {
    var nw = T.n(n[0], n[1], n[2]), mid = A[Math.floor(A.length / 2)];
    if (!facing(nw, T.w(mid[0], mid[1], mid[2]))) return null;
    var Q = A.map(function (q) { return P(q[0], q[1], q[2]); }).concat(Bq.slice().reverse().map(function (q) { return P(q[0], q[1], q[2]); }));
    var col = shade(base, nw, occ);
    if (grad) {
      // rounded off toward its long edges (the light of a face tilted a little up at its top edge, down at its bottom)
      var mA = P(mid[0], mid[1], mid[2]), mB0 = Bq[Math.floor(Bq.length / 2)], mB = P(mB0[0], mB0[1], mB0[2]);
      var g = c.createLinearGradient(mA[0], mA[1], mB[0], mB[1]);
      var nA = T.n(n[0] + grad[0][0], n[1] + grad[0][1], n[2] + grad[0][2]), nB = T.n(n[0] + grad[1][0], n[1] + grad[1][1], n[2] + grad[1][2]);
      g.addColorStop(0, rgb(shade(base, nA, occ))); g.addColorStop(0.18, rgb(col)); g.addColorStop(0.82, rgb(col)); g.addColorStop(1, rgb(shade(base, nB, occ)));
      poly(c, Q); c.fillStyle = g; c.fill(); c.lineJoin = 'round'; c.strokeStyle = rgb(col); c.lineWidth = 0.4; c.stroke(); grow(Q);
    } else fillPoly(Q, rgb(col));
    return { Q: Q, col: col };
  }
  function ends(S, base, occ) {
    var out = [];
    [0, S.M].forEach(function (i) {
      var q = [S.bf[i], S.bb[i], S.tb[i], S.tf[i]], nn = norm(cross(sub(q[1], q[0]), sub(q[3], q[0])));
      if (i === 0) nn = [-nn[0], -nn[1], -nn[2]];
      if (i === 0 ? nn[0] > 0 : nn[0] < 0) nn = [-nn[0], -nn[1], -nn[2]];
      var nw = T.n(nn[0], nn[1], nn[2]), m = [(q[0][0] + q[2][0]) / 2, (q[0][1] + q[2][1]) / 2, 0];
      if (!facing(nw, T.w(m[0], m[1], m[2]))) return;
      var Q = q.map(function (p) { return P(p[0], p[1], p[2]); });
      // end grain: a little darker and browner than the painted faces
      var col = shade(mix(base, [base[0] * 0.8, base[1] * 0.7, base[2] * 0.65], 0.5), nw, occ);
      fillPoly(Q, rgb(col));
      out.push(Q);
    });
    return out;
  }

  /* ---- weathering, laid inside a part's outline ---- */
  function inside(Q, fn) { c.save(); poly(c, Q); c.clip(); fn(); c.restore(); }
  function streaks(Q, xa, xb, yTop, len, n, alpha, col) {     // rain streaks down from yTop (screen), across xa … xb
    if (wea <= 0) return;
    inside(Q, function () {
      for (var i = 0; i < n; i++) {
        var x = lerp(xa, xb, r()), L = len * lerp(0.35, 1, r()), w = Math.max(0.5, (xb - xa) * lerp(0.015, 0.06, r()));
        var g = c.createLinearGradient(0, yTop, 0, yTop + L);
        g.addColorStop(0, rgb(col, alpha * wea * lerp(0.5, 1, r()))); g.addColorStop(1, rgb(col, 0));
        c.fillStyle = g; c.fillRect(x - w / 2, yTop, w, L);
      }
    });
  }

  /* the snow banked round a pillar's foot: the ground's own snow (not snow on the gate), a low uneven collar where the
     wind has drifted it against the post, lit as the snow ground is (the sun's side brighter), its edge soft */
  var fsK = d(look, 'footSnow', 1);
  /* The drift piled round a pillar's foot (the user's reference picture, reference/torii-foot-snow-target.jpg): an opaque,
     billowy pile of snow sitting ON the snow ground, highest against the post, climbing the black sleeve unevenly (a lump
     each side of the post, the front dipping), wide at the ground and trailing off in low tails, the longest away from the
     path. Where the ground drops into the path the pile rolls over the wall's lip and down its face (it follows the
     ground's own height: look.ground), and stops at the wall's foot: it does not spread across the path's floor (except
     right round a post that stands on it). It is a height field (metres) on the ground round the foot, seen through the
     camera pixel by pixel (each line of sight followed to its surface; the post in front hides what lies behind it), and
     lit like the reference: near-white tops, soft lavender-blue in the creases and on the flank turned away from the
     light (a light from the upper right, in front), brighter or darker with the scene's own snow (dusk, night). */
  /* where a post's foot stands lower than the gate's own ground (at the path's sunken edge), the post goes on down into
     that lower snow (the drift then banks round it there) */
  function footY(a0) {
    if (!look.ground || fsK <= 0 || look.drift === false) return 0;
    var w = T.w(a0, 0, 0), g = look.ground(w[0], w[2]).h - (place.y0 || 0);
    return g < -0.005 ? g - 0.02 : 0;
  }
  function footDrift(a0) {
    var GR = look.ground, sd = a0 < 0 ? -1 : 1, rs = G.r0 * 1.07, pw = 2 * rs, Hp = 0.95 * pw * fsK;
    var X = place.x, Z = place.z, rx = T.rx, rz = T.rz, fx = T.fx, fz = T.fz, gy0 = place.y0 || 0;
    function toW(a, b) { return [X + a * rx + b * fx, Z + a * rz + b * fz]; }
    function grd(a, b) { if (!GR) return { h: gy0, fl: 0 }; var w = toW(a, b), r2 = GR(w[0], w[1]); return r2; }
    // the post's foot (the pillar leans in: its axis at the ground)
    var pc = toW(a0, 0), g0 = grd(a0, 0).h;
    // toward the eye, in the gate's (a, b), from the foot
    var ex = -pc[0], ez = -pc[1], ea = ex * rx + ez * rz, eb = ex * fx + ez * fz, el = Math.hypot(ea, eb) || 1; ea /= el; eb /= el;
    // the pile's own random numbers: each foot of each gate its own
    var rp = rng(G.seed * 53 + (sd + 3) * 29 + 11), kn = [];
    for (var q = 0; q < 10; q++) kn.push(rp());
    function nth(th) { var x = ((th / TAU) % 1 + 1) % 1 * 9, i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(kn[i], kn[(i + 1) % 9], u) * 2 - 1; }
    // the pile is a cluster of rounded domes merged smoothly into one (creases where they meet): a heap round the post, a
    // lump each side of it (left and right as seen; one higher, so the snow line climbs the sleeve on a slant), a broad
    // heap away from the path, and low domes along the tails (long away from the path, short toward it)
    var side = [-eb, ea];                                         // across the line of sight (a, b)
    rp();
    var hi = sd * side[0] >= 0 ? 1 : -1, D = [];                  // the side away from the path (a little higher)
    function dome(a, b, r, h, sq) { D.push({ a: a, b: b, r: r, h: h, sq: sq || 1 }); }
    dome(a0, 0, rs + pw * lerp(1.25, 1.45, rp()), pw * lerp(0.8, 0.88, rp()));
    // banked high against the post on BOTH sides (as seen), a little toward the eye
    [-1, 1].forEach(function (k) {
      var dd = rs + pw * lerp(0.3, 0.45, rp()), back = -lerp(0.15, 0.35, rp());
      dome(a0 + (side[0] * k - ea * back) * dd, (side[1] * k - eb * back) * dd, pw * lerp(0.9, 1.05, rp()), pw * (k === hi ? lerp(1.25, 1.35, rp()) : lerp(1.1, 1.2, rp())));
    });
    // a flank on each side running down from the post to the ground: away from the path long, toward it shorter (onto the
    // path's floor, as in the reference)
    [1, -1].forEach(function (o) {
      var len = pw * (o > 0 ? lerp(2.6, 3.4, rp()) : lerp(2.0, 2.5, rp())), ang = (rp() - 0.5) * 0.5, n = 6;
      for (var q = 1; q <= n; q++) {
        var t = q / n, dist = rs + len * t, j = (rp() - 0.5) * pw * 0.35;
        dome(a0 + o * sd * dist * Math.cos(ang) + j * 0.3, dist * Math.sin(ang) + j - eb * pw * 0.2, pw * lerp(0.95, 0.5, t) * lerp(0.85, 1.15, rp()), pw * lerp(0.85, 0.1, Math.pow(t, 0.8)) * lerp(0.85, 1.1, rp()));
      }
    });
    dome(a0 + sd * pw * lerp(1.2, 1.6, rp()), -eb * pw * 0.35 + (rp() - 0.5) * pw * 0.4, pw * lerp(1.3, 1.6, rp()), pw * lerp(0.45, 0.58, rp()));
    for (var q2 = 0; q2 < 2; q2++) {                              // along the path, in front and behind
      var sb = q2 ? 1 : -1;
      dome(a0 + sd * pw * (rp() - 0.3) * 0.5, sb * pw * lerp(1.1, 1.5, rp()), pw * lerp(0.9, 1.1, rp()), pw * lerp(0.3, 0.42, rp()));
    }
    // lumps over its surface (the contours the light picks out)
    for (var q3 = 0; q3 < 5; q3++) {
      var an3 = rp() * TAU, d3 = rs + pw * lerp(0.4, 1.8, Math.sqrt(rp()));
      var hb = 0.95 * Math.exp(-d3 / (1.6 * pw));
      dome(a0 + Math.cos(an3) * d3, Math.sin(an3) * d3, pw * lerp(0.6, 0.85, rp()), pw * (hb + lerp(0.1, 0.2, rp())));
    }
    // a scalloped rim: small lumps round its edge, each its own size
    for (var q4 = 0; q4 < 8; q4++) {
      var an4 = q4 / 8 * TAU + (rp() - 0.5) * 0.35, c4 = Math.cos(an4) * sd, d4 = rs + pw * (c4 > 0 ? lerp(2.0, 3.0, c4) : lerp(1.6, 2.1, -c4)) * lerp(0.8, 1.1, rp());
      dome(a0 + Math.cos(an4) * d4, Math.sin(an4) * d4 * 0.85, pw * lerp(0.5, 0.8, rp()), pw * lerp(0.06, 0.13, rp()));
    }
    var kS = pw * 0.09;                                            // how soft the joins between domes are
    function smax(x, y) { var hh = clamp(0.5 + 0.5 * (x - y) / kS, 0, 1); return lerp(y, x, hh) + kS * hh * (1 - hh); }
    // the pile's thickness (m) at (a, b) on the ground, without (base) and with its billows
    var pileBase = 0;
    function pile(a, b) {
      var h = 0;
      for (var i = 0; i < D.length; i++) {
        var l = D[i], dx = a - l.a, dz = b - l.b, e = (dx * dx + dz * dz) / (l.r * l.r);
        if (e >= 1) continue;
        // a dome: rounded on top, its foot flaring out (squashed: sq > 1 flatter)
        var v = l.h * (1 - e) * (1 - e) * (1 + 0.12 * nth(Math.atan2(dz, dx) * 1.5 + i));
        h = smax(h, v);
      }
      h *= fsK; pileBase = h;
      // broad soft billows on it (no fine noise: it made spots)
      var env = Math.min(1, h / (0.15 * pw));
      var hn = h + env * pw * fsK * 0.07 * n2(a / (0.45 * pw), b / (0.45 * pw), G.seed + 3 + sd);
      // its rim broken: the edge eaten in unevenly where the snow is thin
      return Math.max(0, hn - pw * fsK * 0.05 * (0.6 + 0.4 * n2(a / (0.22 * pw), b / (0.22 * pw), G.seed + 7 + sd)) * (1 - Math.min(1, h / (0.25 * pw))));
    }
    // the height field on a grid round the foot: the ground (with the path cut into it) plus the pile
    var gPost = g0;
    var Rm = pw * 5.2, cell = Math.max(0.008, pw / 40), N = Math.min(260, Math.ceil(2 * Rm / cell) + 1);
    cell = 2 * Rm / (N - 1);
    var A0 = a0 - Rm, B0 = -Rm, HT = new Float32Array(N * N), TH = new Float32Array(N * N), PB = new Float32Array(N * N), GG = new Float32Array(N * N), hMax = -1e9, hMin = 1e9;
    for (var jb = 0; jb < N; jb++) for (var ia = 0; ia < N; ia++) {
      var a = A0 + ia * cell, b = B0 + jb * cell, gq = grd(a, b), p = pile(a, b), pb0 = pileBase;
      // not across the path's floor, but round a post that stands on it (its long tails go out over the wall)
      var rr2 = Math.max(0, Math.hypot(a - a0, b) - rs), sv2 = hi * ((a - a0) * side[0] + b * side[1]) / (Math.hypot(a - a0, b) || 1);
      if (gq.fl > 0) { var fk = 1 - gq.fl * smooth(2.2 * pw, 3.4 * pw, rr2); p *= fk; pb0 *= fk; }
      // a post standing in a hollow (on the path's floor, below the untouched snow round it): the snow fills the hollow
      // round it first, so the pile rises from the level of the snow beside the path, as in the reference
      var hol = Math.max(0, gy0 - gPost);
      if (hol > 0) { var lift = hol * Math.exp(-Math.pow(rr2 / (1.3 * pw), 2)) * Math.min(1, fsK) * Math.min(1, p / (0.1 * pw) + 0.35); p += lift; pb0 += lift; }
      // right against the post: where the snow meets the sleeve, high on one side, sloping down across the front to the
      // other (as in the reference: a slant, not a ring)
      if (fsK > 0) { var need = (Math.max(gPost, gy0) + (0.92 + 0.06 * sv2 + 0.08 * nth(Math.atan2(b, a - a0) * 3)) * pw * fsK - gq.h) * Math.exp(-Math.pow(rr2 / (0.45 * pw), 2)); if (need > p) { pb0 += need - p; p = need; } }
      // and the slant itself, on top of the heap: higher on one side of the post, lower on the other
      if (fsK > 0 && p > 0) { var sl2 = 0.06 * pw * fsK * sv2 * Math.exp(-Math.pow(rr2 / (0.6 * pw), 2)); p = Math.max(0, p + sl2); pb0 = Math.max(0, pb0 + sl2); }
      var k = jb * N + ia; TH[k] = p; PB[k] = pb0; GG[k] = gq.h;
    }
    // drifted snow smooths over what lies under it: the pile and the ground beneath it are softened (the wall's lip and
    // the edge of the path's floor no longer show through it as seams and folds); outside the pile the ground is the
    // ground's own
    function blurF(src, rad) {
      var R = Math.max(1, Math.round(rad / cell)), tmp = new Float32Array(N * N), out = new Float32Array(N * N), i2, j2;
      for (var pass = 0; pass < 2; pass++) {
        var A = pass ? out : src;
        for (j2 = 0; j2 < N; j2++) { var acc = 0, cnt = 0; for (i2 = -R; i2 < N + R; i2++) {
          if (i2 + R < N) { acc += A[j2 * N + Math.min(N - 1, i2 + R)]; cnt++; }
          if (i2 - R - 1 >= 0) { acc -= A[j2 * N + i2 - R - 1]; cnt--; }
          if (i2 >= 0 && i2 < N) tmp[j2 * N + i2] = acc / cnt; } }
        for (i2 = 0; i2 < N; i2++) { var acc2 = 0, cnt2 = 0; for (j2 = -R; j2 < N + R; j2++) {
          if (j2 + R < N) { acc2 += tmp[Math.min(N - 1, j2 + R) * N + i2]; cnt2++; }
          if (j2 - R - 1 >= 0) { acc2 -= tmp[(j2 - R - 1) * N + i2]; cnt2--; }
          if (j2 >= 0 && j2 < N) out[j2 * N + i2] = acc2 / cnt2; } }
      }
      return out;
    }
    var THs = blurF(TH, pw * 0.07), PBs = blurF(PB, pw * 0.07), GGs = blurF(GG, pw * 0.45);
    for (var kq = 0; kq < N * N; kq++) {
      var w2 = smooth(0, 0.25 * pw, THs[kq]), base = lerp(GG[kq], GGs[kq], w2), top = Math.max(GG[kq], base + THs[kq]);
      // (its thickness for the fade and the rim's tint: the pile's own smooth thickness, not its height above the ground,
      // which jumps by the wall's height where the wall's foot runs under it and drew a straight line)
      HT[kq] = top; TH[kq] = top > GG[kq] + 1e-4 ? Math.max(THs[kq], 0.0021) : 0; PB[kq] = PBs[kq];
      if (top > hMax) hMax = top; if (top < hMin) hMin = top;
    }
    function hs(i, j, s) { var v = Math.sin(i * 127.1 + j * 311.7 + s * 74.7) * 43758.5453; return v - Math.floor(v); }
    function n2(x, y, s) {
      var i = Math.floor(x), j = Math.floor(y), u = x - i, v = y - j; u = u * u * (3 - 2 * u); v = v * v * (3 - 2 * v);
      return lerp(lerp(hs(i, j, s), hs(i + 1, j, s), u), lerp(hs(i, j + 1, s), hs(i + 1, j + 1, s), u), v) * 2 - 1;
    }
    function at(Ar, a, b) {
      var x = (a - A0) / cell, y = (b - B0) / cell; if (x < 0 || y < 0 || x > N - 1.001 || y > N - 1.001) return null;
      var i = Math.floor(x), j = Math.floor(y), f = x - i, g = y - j, k = j * N + i;
      return lerp(lerp(Ar[k], Ar[k + 1], f), lerp(Ar[k + N], Ar[k + N + 1], f), g);
    }
    // its outline on the screen
    var X0 = 1e9, Y0 = 1e9, X1 = -1e9, Y1 = -1e9;
    [[A0, B0], [A0 + 2 * Rm, B0], [A0, B0 + 2 * Rm], [A0 + 2 * Rm, B0 + 2 * Rm]].forEach(function (cr) {
      var w = toW(cr[0], cr[1]);
      [hMin, hMax].forEach(function (yy) { var pp = T.p([w[0], yy, w[1]]); X0 = Math.min(X0, pp[0]); X1 = Math.max(X1, pp[0]); Y0 = Math.min(Y0, pp[1]); Y1 = Math.max(Y1, pp[1]); });
    });
    X0 = Math.max(0, Math.floor(X0 - 2)); Y0 = Math.max(0, Math.floor(Y0 - 2)); X1 = Math.min(cam.W, Math.ceil(X1 + 2)); Y1 = Math.min(cam.H, Math.ceil(Y1 + 2));
    if (X1 <= X0 || Y1 <= Y0) return;
    var w = Math.ceil((X1 - X0) * PRD), h = Math.ceil((Y1 - Y0) * PRD);
    if (w * h > 3e6 || w * h < 1) return;
    var im = new ImageData(w, h), D = im.data, any = 0;
    // the light of the reference: from the upper right, in front (camera space: x right, y up, z away)
    var LR = norm([0.55, 0.8, 0.3]);
    // the reference's own colours (measured on it: lit tops about (244, 245, 250), the shade about (185, 196, 214), the
    // creases about (162, 166, 186)), as bright as the scene's snow is now (dusk and night darker)
    // (each channel scaled by the scene's lit snow against its day colour (225, 234, 237): the same at day, the warm and
    // lavender cast of dusk and the blue of night carried over)
    var lit0 = look.snowLit, kc = [Math.min(1.05, lit0[0] / 225), Math.min(1.05, lit0[1] / 234), Math.min(1.05, lit0[2] / 237)];
    var litC = [244 * kc[0], 245 * kc[1], 250 * kc[2]], shC = [185 * kc[0], 196 * kc[1], 214 * kc[2]], deep = [162 * kc[0], 166 * kc[1], 186 * kc[2]];
    var mist = Lt.mist, hzk = PN.hz;
    // the post (to hide what lies behind it): a vertical cylinder at its foot
    var pxC = pc[0], pzC = pc[1], eye = cam.eye, aE = 0;
    var eps = cell;
    for (var j = 0; j < h; j++) {
      var sy = Y0 + (j + 0.5) / PRD, dY = -(sy - cam.hy) / cam.F;
      if (dY >= -1e-4) continue;
      for (var i = 0; i < w; i++) {
        var sx = X0 + (i + 0.5) / PRD, dx = (sx - cam.W / 2) / cam.F;
        // the line of sight (dx t, eye + dY t, t): where it is inside the grid, and between the heights
        var tA = (eye - hMax) / -dY, tB = (eye - hMin + 0.01) / -dY;
        // the grid's (a, b) along it: a(t) = (dx t - X) rx + (t - Z) rz, b(t) likewise (straight lines)
        var aa = dx * rx + rz, ab = -X * rx - Z * rz, ba = dx * fx + fz, bb = -X * fx - Z * fz;
        [[aa, ab, A0 + cell, A0 + 2 * Rm - cell], [ba, bb, B0 + cell, B0 + 2 * Rm - cell]].forEach(function (sl) {
          if (Math.abs(sl[0]) < 1e-9) { if (sl[1] < sl[2] || sl[1] > sl[3]) { tA = 1; tB = 0; } return; }
          var t1 = (sl[2] - sl[1]) / sl[0], t2 = (sl[3] - sl[1]) / sl[0]; if (t1 > t2) { var tt = t1; t1 = t2; t2 = tt; }
          if (t1 > tA) tA = t1; if (t2 < tB) tB = t2;
        });
        if (tA >= tB) continue;
        var stp = cell * 0.7 / Math.hypot(dx, 1), t = tA, prev = tA, hit = -1;
        while (t <= tB) {
          var av = aa * t + ab, bv = ba * t + bb, hv = at(HT, av, bv);
          if (hv !== null && eye + dY * t <= hv) {
            var tl = prev, th2 = t;
            for (var qq = 0; qq < 7; qq++) { var tm = (tl + th2) / 2, hm = at(HT, aa * tm + ab, ba * tm + bb); if (hm !== null && eye + dY * tm <= hm) th2 = tm; else tl = tm; }
            hit = th2; break;
          }
          prev = t; t += stp;
        }
        if (hit < 0) continue;
        var buried = false;
        // hidden behind the post? Only where the post stands above the snow: any part of it below the snow's surface
        // (its foot, which goes down into the ground) is buried, and the snow there is painted over it
        var ox = -pxC, oz = -pzC, qa = dx * dx + 1, qb = 2 * (ox * dx + oz), qc = ox * ox + oz * oz - rs * rs, disc = qb * qb - 4 * qa * qc;
        if (disc > 0) {
          var tc = (-qb - Math.sqrt(disc)) / (2 * qa);
          if (tc > 0 && tc < hit) {
            var hcv = at(HT, aa * tc + ab, ba * tc + bb);
            if (hcv === null || eye + dY * tc > hcv + 0.004) continue;
            hit = tc; var buried = true;                         // buried post: the snow at its face
          }
        }
        var pa = aa * hit + ab, pb = ba * hit + bb, thk = at(TH, pa, pb);
        if (!(thk > 0.002)) continue;
        // the surface's direction (the grid's slope, the gate's a / b turned back to camera space)
        var ha = (at(HT, pa + eps, pb) - at(HT, pa - eps, pb)) / (2 * eps), hb = (at(HT, pa, pb + eps) - at(HT, pa, pb - eps)) / (2 * eps);
        if (!isFinite(ha)) ha = 0; if (!isFinite(hb)) hb = 0;
        ha *= 1.5; hb *= 1.5;                                   // (its slopes read more strongly, as painted)
        var nx = -(ha * rx + hb * fx), nz = -(ha * rz + hb * fz), nl = Math.hypot(nx, 1, nz); nx /= nl; var ny = 1 / nl; nz /= nl;
        // creases: where the pile curves in (between two lumps, at its foot against the ground)
        var e2 = pw * 0.12, lap = (at(PB, pa + e2, pb) + at(PB, pa - e2, pb) + at(PB, pa, pb + e2) + at(PB, pa, pb - e2) - 4 * at(PB, pa, pb)) / (e2 * e2);
        if (!isFinite(lap)) lap = 0;
        var crease = clamp(lap * pw * 0.08, 0, 0.7);
        var dl = nx * LR[0] + ny * LR[1] + nz * LR[2];
        var f = smooth(0.3, 0.82, dl);                          // lit … shade, a soft painted edge between
        var col = [0, 0, 0];
        for (var ch = 0; ch < 3; ch++) col[ch] = lerp(lerp(shC[ch], litC[ch], f), deep[ch], crease * 0.8);
        // against the post: a thin shade where it meets the sleeve
        var rp2 = Math.max(0, Math.hypot(pa - a0, pb) - rs);
        var cs = Math.exp(-rp2 / (0.06 * pw)) * 0.25 * (1 - f);
        for (ch = 0; ch < 3; ch++) col[ch] = lerp(col[ch], deep[ch], cs);
        // its thin edge lies in the lavender of the snow's shade (as the reference's drifts meet the ground)
        var te = 1 - smooth(0, 0.22 * pw, thk);
        for (ch = 0; ch < 3; ch++) col[ch] = lerp(col[ch], lerp(shC[ch], litC[ch], 0.6), te * 0.8);
        var gr = 1 + (ihash(i + X0 * 7, j + Y0 * 3) - 0.5) * 0.03;
        var al = smooth(0.002, 0.05 + 0.07 * (0.5 + 0.5 * n2(pa / (0.12 * pw), pb / (0.12 * pw), G.seed + 21)), thk);   // (feathered into the ground over 5-12 cm; fully opaque wherever thicker)
        var kk = (j * w + i) * 4;
        for (ch = 0; ch < 3; ch++) D[kk + ch] = clamp(lerp(col[ch], mist[ch], hzk) * gr, 0, 255);
        D[kk + 3] = 255 * al; any++;
      }
    }
    if (!any) return;
    var cv = document.createElement('canvas'); cv.width = w; cv.height = h; cv.getContext('2d').putImageData(im, 0, 0);
    c.save(); c.filter = 'blur(' + (1.0 * PRD).toFixed(2) + 'px)'; c.imageSmoothingQuality = 'high';
    c.drawImage(cv, X0, Y0, w / PRD, h / PRD); c.restore();
    grow([[X0, Y0], [X0 + w / PRD, Y0 + h / PRD]]);
  }
  function footSnow(a0) {
    if (fsK <= 0 || !look.snowLit) return;
    if (look.drift !== false) { footDrift(a0); return; }
    var rr0 = G.r0 * 1.07, fc = T.w(a0, 0, 0), vd = norm([-fc[0], 0, -fc[2]]), pr = [-vd[2], 0, vd[0]];
    var kn = [], q;
    for (q = 0; q < 7; q++) kn.push(r());
    function nz(t) { var x = (t + 1) / 2 * 6, i = Math.min(5, Math.floor(x)), f = x - i, u = f * f * (3 - 2 * f); return lerp(kn[i], kn[i + 1], u); }
    var M = 22, inner = [], outer = [], A = PI / 2 * 1.06;
    for (q = 0; q <= M; q++) {
      var t = -1 + 2 * q / M, th = t * A, dx = vd[0] * Math.cos(th) + pr[0] * Math.sin(th), dz = vd[2] * Math.cos(th) + pr[2] * Math.sin(th);
      var ht = (0.07 + 0.12 * nz(t)) * fsK * (1 - 0.3 * t * t), wd = rr0 * 0.3 + (0.25 + 0.3 * nz(-t)) * fsK;
      inner.push(T.p([fc[0] + dx * rr0, ht, fc[2] + dz * rr0]));
      outer.push(T.p([fc[0] + dx * (rr0 + wd), 0, fc[2] + dz * (rr0 + wd)]));
    }
    var Q = inner.concat(outer.reverse());
    var sunRight = pr[0] * Lt.dir[0] + pr[2] * Lt.dir[2] > 0;
    var lit = mix(look.snowLit, Lt.mist, PN.hz), dim = mix(mix(look.snowLit, look.snowShade, 0.55), Lt.mist, PN.hz);
    var xl = Math.min.apply(null, Q.map(function (p) { return p[0]; })), xr = Math.max.apply(null, Q.map(function (p) { return p[0]; }));
    var g = c.createLinearGradient(xl, 0, xr, 0);
    g.addColorStop(0, rgb(sunRight ? dim : lit)); g.addColorStop(0.5, rgb(mix(lit, dim, 0.45))); g.addColorStop(1, rgb(sunRight ? lit : dim));
    c.save(); c.filter = 'blur(1px)'; poly(c, Q); c.fillStyle = g; c.fill(); c.restore();
    grow(Q);
  }

  // which pillar, end and so on is nearer: draw the farther first
  function zOf(a, y, b) { return T.w(a, y, b)[2]; }

  var nk = G.nuki, K = G.kasagi, Sm = G.shimaki;
  var KB = beamPts(K, 24), SB = beamPts(Sm, 24);
  var kBase = look.kasagiBlack === false ? RED : BLACK;
  var occBeam = 0.92;

  /* ---- the snow: lit as the snow ground is (the sun, the sky's blue in the shade, the snow's own light thrown up from
     below), rolled off toward white; thin lips glow where the low sun shines through them from behind; the undersides
     next to the vermilion take a faint warm reflection of it; a few glints where the sun catches it ---- */
  var SN = look.snowRGB || [250, 250, 252], SH = look.shadeRGB || [170, 185, 210], Ls = Lt.dir, sunV = Lt.vis === undefined ? 1 : Lt.vis;
  var gLit = []; for (var ch0 = 0; ch0 < 3; ch0++) gLit.push(SN[ch0] * Lt.sun[ch0] * Math.max(0, Ls[1]) * 1.25 + SH[ch0]);
  function roll(v) { if (v > 226) v = 226 + (v - 226) * 26 / (v - 226 + 26); if (v > 228) v = 228 + (v - 228) * 24 / (v - 228 + 24); return v; }
  function snowShade(n, q, occ, thin, red, sv) {
    if (sv === undefined) sv = 1;
    n = norm(n);
    var k = occ === undefined ? 1 : occ, dl = Math.max(0, n[0] * Ls[0] + n[1] * Ls[1] + n[2] * Ls[2]) * Math.min(k, sv);
    var sk = (0.5 + 0.5 * n[1]) * lerp(0.6, 1, k), up = (0.5 - 0.5 * n[1]) * 0.85;
    var vd = norm(sub(q, T.eye)), back = Math.pow(Math.max(0, vd[0] * Ls[0] + vd[1] * Ls[1] + vd[2] * Ls[2]), 3) * (thin || 0) * sunV * sv;
    // (and its edges seen against the low sun behind it glow: light scattered forward through the crystals at the rim)
    var ndv = Math.abs(n[0] * vd[0] + n[1] * vd[1] + n[2] * vd[2]), sunB = Math.max(0, vd[0] * Ls[0] + vd[1] * Ls[1] + vd[2] * Ls[2]);
    var rim = Math.pow(1 - ndv, 3) * sunB * sunV * Math.max(0, n[1] + 0.3) * 0.5 * sv;
    var out = [];
    for (var ch = 0; ch < 3; ch++) {
      var v = SN[ch] * Lt.sun[ch] * dl * 1.25 + SH[ch] * sk + SN[ch] * gLit[ch] / 255 * up + SN[ch] * Lt.sun[ch] * (0.45 * back + rim);
      out.push(v);
    }
    // the shade's blue as the snow ground's (the sky's blue on its own made the faces turned to you too blue)
    var Lm = 0.3 * out[0] + 0.59 * out[1] + 0.11 * out[2];
    out = out.map(function (v) { return roll(Lm + (v - Lm) * 0.55); });
    if (red) out = mix(out, [out[0] * 1.0, out[1] * 0.84, out[2] * 0.8], 0.1 * red);
    return { col: mix(out, Lt.mist, PN.hz), dl: dl };
  }
  var fbF = zOf(0, G.Ht * 0.6, -1) < zOf(0, G.Ht * 0.6, 1) ? -1 : 1;        // the side of the gate facing the eye (local b)
  /* ---- The snow is not built of faces: each heap is one smooth rounded body (G ≤ 0 inside, local metres): across the
     beam a cushion (a rounded superellipse) domed on top and rounding over into a lip that curls under past the beam's
     edges; along the beam its depth, reach and lip from the stations. Each pixel follows its line of sight from the eye
     into the body, finds where it first meets the snow, and lights that point with the surface's true direction there:
     so the shading is one soft gradient (no facets, no lines) and the outline is the body's own smooth outline. Worked
     out once per gate (kept while nothing changes), at the screen's resolution, laid down a little soft. ---- */
  var PRD = Math.max(1, look.pr || 1);
  function bodyOfHeap(hp) {
    var st = hp.st, n = st.length, a0 = st[0].a, a1 = st[n - 1].a, dA = (a1 - a0) / Math.max(1, n - 1), hd = hp.hd, C = hp.cyl;
    var yMin = 1e9, yMax = -1e9, bMax = 0;
    st.forEach(function (q) {
      var sh = q.sh === undefined ? 1 : q.sh;
      q.BF = hd * sh + q.ovF; q.BB = hd * sh + q.ovB; q.dr = (q.dF + q.dB) / 2;
      yMin = Math.min(yMin, q.y - q.dr - 0.02); yMax = Math.max(yMax, q.y + q.h + 0.02); bMax = Math.max(bMax, q.BF, q.BB);
    });
    var Q = { y: 0, h: 0, BF: 0, BB: 0, dr: 0 };
    function at(a) {
      var f = (a - a0) / dA; if (f < 0 || f > n - 1) return false;
      var i = Math.min(n - 2, Math.floor(f)), t = f - i, A = st[i], B = st[i + 1];
      Q.y = A.y + (B.y - A.y) * t; Q.h = A.h + (B.h - A.h) * t; Q.BF = A.BF + (B.BF - A.BF) * t; Q.BB = A.BB + (B.BB - A.BB) * t; Q.dr = A.dr + (B.dr - A.dr) * t;
      return true;
    }
    function shape(a, y, b) {                                        // the smooth body alone (for its surface's direction)
      if (!at(a) || Q.h < 0.003) return 1;
      var v = y - Q.y, bc = (Q.BB - Q.BF) / 2, Bw = Math.max(0.01, (Q.BF + Q.BB) / 2), vc = (Q.h - Q.dr) / 2, Hh = Math.max(0.004, (Q.h + Q.dr) / 2);
      var X = Math.abs((b - bc) / Bw), Y = (v - vc) / Hh;
      return Math.pow(X, 2.6) + Y * Y - 1;
    }
    function inSnow(a, y, b) {                                       // and where it is: not inside the beam or a pillar
      if (C) { var da = a - C.axis; if (da * da + b * b < C.r * C.r) return 1; }
      var g = shape(a, y, b);
      if (g <= 0 && y < Q.y && Math.abs(b) < hd) return 1;
      return g;
    }
    return { G: inSnow, shape: shape, box: [a0, a1, yMin, yMax, -bMax - 0.01, bMax + 0.01], hd: hd,
             thin: function (a, y, b) { return Math.abs(b) > hd ? 1 : 0.25; }, beamY: function (a) { return at(a) ? Q.y : 0; } };
  }
  function bodyOfRim(sd) {
    var crev = d(look, 'crevice', 1); if (!G.snow || crev <= 0) return null;
    var yR = G.nem + 0.012, ax = sd * G.axis(yR), rIn = G.radius(G.nem), rOut = rIn * 1.1;
    var axw = T.w(ax, yR, 0), evl = T.loc(-axw[0], 0, -axw[2]), ea = evl[0], eb = evl[2];
    var rp = rng(G.seed * 41 + (sd + 3) * 7), k1 = rp() * 6.3, k2 = rp() * 6.3, H0 = 0.05 * crev * G.snow.amt;
    var rc = (rIn + rOut) / 2 + 0.012, Bw = (rOut - rIn) / 2 + 0.03;
    function shape(a, y, b) {
      var da = a - ax, rho = Math.sqrt(da * da + b * b), v = y - yR, phi = Math.atan2(b, da);
      var h = H0 * (1 + 0.35 * Math.sin(phi * 3 + k1) + 0.2 * Math.sin(phi * 7 + k2)), dr = h * 0.35;
      var vc = (h - dr) / 2, Hh = Math.max(0.003, (h + dr) / 2), X = Math.abs((rho - rc) / Bw), Y = (v - vc) / Hh;
      return Math.pow(X, 2.6) + Y * Y - 1;
    }
    function inRim(a, y, b) {
      var da = a - ax, rho = Math.sqrt(da * da + b * b);
      if (rho < rIn) return 1;
      if (da * ea + b * eb < 0) return 1;                              // behind the pillar: never laid over it
      var g = shape(a, y, b);
      if (g <= 0 && y < yR && rho < rOut) return 1;
      return g;
    }
    return { G: inRim, shape: shape, box: [ax - rOut - 0.06, ax + rOut + 0.06, yR - 0.05, yR + H0 * 1.8 + 0.03, -rOut - 0.06, rOut + 0.06], hd: 0,
             thin: function () { return 0.6; }, ring: true, step: 0.005 };
  }
  /* ---- what of the sun and the sky a point of snow sees: the gate's own parts stand in the way (the pillars, the centre
     post, the wedges, the beams), so snow tucked against a post or under a beam lies in their shade ---- */
  var LsL = T.loc(Ls[0], Ls[1], Ls[2]), LsA = LsL[0], LsB = LsL[2], LsY = LsL[1];
  var nkS = G.nuki, gkS = G.gaku, KS = G.kasagi, SS2 = G.shimaki, ksS = G.kus;
  var BOX = [
    [-gkS.w, gkS.w, gkS.y0, gkS.y1, -gkS.dep / 2, gkS.dep / 2],
    [-(nkS.aN + nkS.over), nkS.aN + nkS.over, nkS.y0, nkS.y1, -nkS.dep / 2, nkS.dep / 2],
    [-SS2.half - SS2.flare, SS2.half + SS2.flare, SS2.y0, SS2.y0 + SS2.th, -SS2.dep / 2, SS2.dep / 2],
    // (the kasagi to the height of its middle: the snow lying on it must not count as inside it)
    [-KS.half - KS.flare, KS.half + KS.flare, KS.y0, KS.y0 + KS.th - 0.005, -KS.dep / 2, KS.dep / 2]];
  if (G.kusabi) [-1, 1].forEach(function (sd) {
    var ka = sd * (nkS.aN + nkS.rN + ksS.kw * 0.6), ym = (nkS.y0 + nkS.y1) / 2;
    BOX.push([ka - ksS.kw / 2, ka + ksS.kw / 2, ym - ksS.kH / 2, ym + ksS.kH / 2, -ksS.kD / 2, ksS.kD / 2]);
  });
  function hitBox(B, a, y, b, da, dy, db) {
    var O = [a, y, b], D = [da, dy, db], t0 = 1e-4, t1 = 1e9;
    for (var k = 0; k < 3; k++) {
      var lo = B[k * 2], hi = B[k * 2 + 1];
      if (Math.abs(D[k]) < 1e-9) { if (O[k] < lo || O[k] > hi) return false; continue; }
      var ta = (lo - O[k]) / D[k], tb = (hi - O[k]) / D[k]; if (ta > tb) { var q = ta; ta = tb; tb = q; }
      if (ta > t0) t0 = ta; if (tb < t1) t1 = tb; if (t0 > t1) return false;
    }
    return true;
  }
  function hitPillar(sd, a, y, b, da, dy, db) {
    var ac = sd * G.axis(Math.max(0, y)), r = G.radius(Math.max(0, y)), oa = a - ac;
    var A = da * da + db * db, Bq = 2 * (oa * da + b * db), Cq = oa * oa + b * b - r * r;
    if (A < 1e-12) return false;
    var disc = Bq * Bq - 4 * A * Cq; if (disc < 0) return false;
    var sq = Math.sqrt(disc), t = (-Bq - sq) / (2 * A); if (t < 1e-4) t = (-Bq + sq) / (2 * A); if (t < 1e-4) return false;
    var yy = y + dy * t; return yy > 0 && yy < G.topMax;
  }
  function sunSeen(a, y, b) {
    if (LsY < 0.01) return 0;
    for (var i = 0; i < BOX.length; i++) if (hitBox(BOX[i], a, y, b, LsA, LsY, LsB)) return 0.12;
    if (hitPillar(-1, a, y, b, LsA, LsY, LsB) || hitPillar(1, a, y, b, LsA, LsY, LsB)) return 0.12;
    return 1;
  }
  // the sky's share: less next to a post, a pillar or a wedge (the corner sees half the sky or less)
  function skySeen(a, y, b) {
    var dmin = 9;
    [-1, 1].forEach(function (sd) { var ac = sd * G.axis(Math.max(0, y)); dmin = Math.min(dmin, Math.hypot(a - ac, b) - G.radius(Math.max(0, y))); });
    for (var i = 0; i < BOX.length; i++) {
      var B = BOX[i]; if (i === 1 || i === 3 || i === 2) continue;           // (not the beams it lies on or under)
      if (y < B[2] - 0.05 || y > B[3] + 0.3) continue;
      var dx = Math.max(B[0] - a, 0, a - B[1]), dz = Math.max(B[4] - b, 0, b - B[5]);
      dmin = Math.min(dmin, Math.hypot(dx, dz));
    }
    return lerp(0.55, 1, smooth(0, 0.35, Math.max(0, dmin)));
  }
  function ihash(i, j) { var h = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return h - Math.floor(h); }
  function renderBody(S) {
    var bx = S.box, X0 = 1e9, Y0 = 1e9, X1 = -1e9, Y1 = -1e9;
    for (var i0 = 0; i0 < 2; i0++) for (var j0 = 2; j0 < 4; j0++) for (var k0 = 4; k0 < 6; k0++) {
      var pp = P(bx[i0], bx[j0], bx[k0]); X0 = Math.min(X0, pp[0]); X1 = Math.max(X1, pp[0]); Y0 = Math.min(Y0, pp[1]); Y1 = Math.max(Y1, pp[1]);
    }
    X0 = Math.max(0, Math.floor(X0 - 2)); Y0 = Math.max(0, Math.floor(Y0 - 2)); X1 = Math.min(cam.W, Math.ceil(X1 + 2)); Y1 = Math.min(cam.H, Math.ceil(Y1 + 2));
    if (X1 <= X0 || Y1 <= Y0) return null;
    var w = Math.ceil((X1 - X0) * PRD), h = Math.ceil((Y1 - Y0) * PRD);
    if (w * h > 4e6) return null;
    var imF = new ImageData(w, h), imB = new ImageData(w, h), DF = imF.data, DB = imB.data, nF = 0, nB = 0;
    // the eye in the gate's own (a, y, b)
    var EL = T.locP([0, cam.eye, 0]), aO = EL[0], yO = EL[1], bO = EL[2];
    var lo = [bx[0], bx[2], bx[4]], hi = [bx[1], bx[3], bx[5]], eps = 0.006;
    for (var j = 0; j < h; j++) {
      var sy = Y0 + (j + 0.5) / PRD, dY0 = -(sy - cam.hy) / cam.F;
      for (var i = 0; i < w; i++) {
        var sx = X0 + (i + 0.5) / PRD, dxc = (sx - cam.W / 2) / cam.F;
        // (the line of sight (dxc, dY, 1) in the gate's own a and b)
        var DL = T.loc(dxc, dY0, 1), dAa = DL[0], dY = DL[1], dBb = DL[2];
        var O = [aO, yO, bO], Dd = [dAa, dY, dBb], t0 = 0, t1 = 1e9;
        for (var ax3 = 0; ax3 < 3; ax3++) {
          if (Math.abs(Dd[ax3]) < 1e-9) { if (O[ax3] < lo[ax3] || O[ax3] > hi[ax3]) { t0 = 1; t1 = 0; break; } continue; }
          var ta = (lo[ax3] - O[ax3]) / Dd[ax3], tb = (hi[ax3] - O[ax3]) / Dd[ax3];
          if (ta > tb) { var tt = ta; ta = tb; tb = tt; }
          if (ta > t0) t0 = ta; if (tb < t1) t1 = tb;
        }
        if (t0 >= t1) continue;
        var L = Math.sqrt(dAa * dAa + dY * dY + dBb * dBb), stp = (S.step || 0.018) / L, t = t0, prev = t0, g = S.G(aO + dAa * t, yO + dY * t, bO + dBb * t), hit = -1;
        while (t < t1) {
          if (g <= 0) { var tl = prev, th2 = t; for (var q = 0; q < 7; q++) { var tm = (tl + th2) / 2; if (S.G(aO + dAa * tm, yO + dY * tm, bO + dBb * tm) <= 0) th2 = tm; else tl = tm; } hit = th2; break; }
          prev = t; t += stp; g = S.G(aO + dAa * t, yO + dY * t, bO + dBb * t);
        }
        if (hit < 0) continue;
        var pa = aO + dAa * hit, py = yO + dY * hit, pb = bO + dBb * hit;
        // the surface's direction from the smooth body
        var gx = S.shape(pa + eps, py, pb) - S.shape(pa - eps, py, pb), gy = S.shape(pa, py + eps, pb) - S.shape(pa, py - eps, pb), gz = S.shape(pa, py, pb + eps) - S.shape(pa, py, pb - eps);
        var nl = Math.sqrt(gx * gx + gy * gy + gz * gz) || 1, nw = T.n(gx / nl, gy / nl, gz / nl), pw = T.w(pa, py, pb);
        if (nw[0] * (0 - pw[0]) + nw[1] * (cam.eye - pw[1]) + nw[2] * (0 - pw[2]) < 0) { nw = [-nw[0], -nw[1], -nw[2]]; }
        var sv = sunSeen(pa + gx / nl * 0.012, py + gy / nl * 0.012, pb + gz / nl * 0.012), sk = skySeen(pa, py, pb);
        var sc = snowShade(nw, pw, sk, S.thin(pa, py, pb), gy / nl < -0.3 ? 1 : 0, sv), col = sc.col;
        // a little darker where it sits on the beam (the light cut off in the corner), fine grain, a few glints
        var ao = 1;
        if (!S.ring) { var vv = py - S.beamY(pa); if (Math.abs(pb) < S.hd + 0.03 && vv < 0.05) ao = 0.9 + 0.1 * Math.max(0, vv) / 0.05; }
        var gr = 1 + (ihash(i + X0 * 7, j + Y0 * 3) - 0.5) * 0.035;
        var sp = sc.dl > 0.3 && ihash(i * 3 + 1, j * 5 + 2) < 0.004 ? 28 : 0;
        var back = S.ring ? false : pb * fbF < -0.001, Dt = back ? DB : DF, k = (j * w + i) * 4;
        Dt[k] = clamp(col[0] * ao * gr + sp, 0, 255); Dt[k + 1] = clamp(col[1] * ao * gr + sp, 0, 255); Dt[k + 2] = clamp(col[2] * ao * gr + sp, 0, 255); Dt[k + 3] = 255;
        if (back) nB++; else nF++;
      }
    }
    function pic(im, nn) {
      if (!nn) return null;
      var cv = document.createElement('canvas'); cv.width = w; cv.height = h; cv.getContext('2d').putImageData(im, 0, 0);
      return { cv: cv, x: X0, y: Y0, w: w / PRD, h: h / PRD };
    }
    return { front: pic(imF, nF), back: pic(imB, nB) };
  }
  function lay(P2) {
    if (!P2) return;
    c.save(); c.filter = 'blur(' + (0.45 * PRD).toFixed(2) + 'px)'; c.imageSmoothingQuality = 'high';
    c.drawImage(P2.cv, P2.x, P2.y, P2.w, P2.h); c.restore();
    grow([[P2.x, P2.y], [P2.x + P2.w, P2.y + P2.h]]);
  }
  var SNQ = {};
  if (G.snow) G.snow.heaps.forEach(function (hp) { SNQ[hp.grp] = renderBody(bodyOfHeap(hp)); });
  function snowBack(g) { if (SNQ[g]) lay(SNQ[g].back); }
  function snowFront(g) { if (SNQ[g]) lay(SNQ[g].front); }
  /* snow on a pillar: the windward side plastered in broken patches (it sticks where the wind drives it), and a ring of it
     on the black sleeve's rim (a crevice) */
  function plaster(sd, aShaftH) {
    if (!G.snow || !(G.snow.plaster > 0)) return;
    var wf = look.windFrom || [-1, 0], WL = T.loc(wf[0], 0, wf[1]), phW = Math.atan2(WL[2], WL[0]);
    var rp = rng(G.seed * 71 + (sd + 3) * 19 + G.snow.seed), n = Math.round(lerp(3, 6, rp()) * Math.min(2, G.snow.plaster));
    for (var i = 0; i < n; i++) {
      var y0 = lerp(G.nem + 0.15, G.yP - 0.3, Math.pow(rp(), 0.8)), dh = lerp(0.06, 0.24, rp()) * Math.min(1.5, G.snow.plaster), y1 = Math.min(G.yP - 0.1, y0 + dh);
      var phc = phW + (rp() - 0.5) * 1.1, dph = lerp(0.12, 0.42, rp()), M = 7, Lp = [], Rp = [];
      // the side of the pillar facing the eye, in the gate's own angle: a patch is cut to it
      var axw = T.w(sd * G.axis((y0 + y1) / 2), (y0 + y1) / 2, 0), ex = -axw[0], ez = -axw[2];
      var EV = T.loc(ex, 0, ez), phV = Math.atan2(EV[2], EV[0]);
      function wrap(x) { while (x > PI) x -= TAU; while (x < -PI) x += TAU; return x; }
      var lo = phc - dph, hi = phc + dph, dc = wrap(phc - phV);
      lo = phV + Math.max(wrap(lo - phV), -PI / 2 * 0.98); hi = phV + Math.min(wrap(hi - phV), PI / 2 * 0.98);
      if (Math.abs(dc) > PI / 2 + dph || hi - lo < 0.02) continue;
      var mid = (lo + hi) / 2, hw = (hi - lo) / 2 * lerp(0.4, 0.8, rp()), th0 = lerp(0.012, 0.03, rp()) * Math.min(1.5, G.snow.plaster);
      // a crust with its own thickness (it stands out past the pillar's outline where it is seen edge-on), lumpy,
      // its edges broken
      for (var j = 0; j <= M; j++) {
        var u = j / M, y = lerp(y0, y1, u), env = Math.sin(PI * (0.08 + 0.84 * u));
        var w = hw * (0.55 + 0.45 * env) * lerp(0.7, 1.05, rp()), ax = sd * G.axis(y), th = th0 * env * lerp(0.6, 1.2, rp());
        var aL = Math.max(lo, mid - w), aR = Math.min(hi, mid + w), rr2 = G.radius(y) + th;
        Lp.push(P(ax + Math.cos(aL) * rr2, y, Math.sin(aL) * rr2)); Rp.push(P(ax + Math.cos(aR) * (G.radius(y) + 0.004), y, Math.sin(aR) * (G.radius(y) + 0.004)));
      }
      var cen = T.w(sd * G.axis((y0 + y1) / 2) + Math.cos(mid) * G.r0, (y0 + y1) / 2, Math.sin(mid) * G.r0);
      var nA = T.n(Math.cos(lo), 0.2, Math.sin(lo)), nB = T.n(Math.cos(hi), 0.2, Math.sin(hi));
      var cA = snowShade(nA, cen, 0.95, 0.6, 0).col, cB = snowShade(nB, cen, 0.95, 0.3, 0.6).col, Q = Lp.concat(Rp.reverse());
      var xs = Q.map(function (q) { return q[0]; }), x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs);
      var gq = c.createLinearGradient(Lp[M >> 1][0], 0, Rp[M >> 1][0], 0);
      gq.addColorStop(0, rgb(cA)); gq.addColorStop(1, rgb(cB, 0.9));
      c.save(); c.filter = 'blur(' + (0.9 * PRD).toFixed(2) + 'px)'; poly(c, Q); c.fillStyle = gq; c.fill(); c.restore(); grow(Q);
    }
  }
  function rimSnow(sd) {
    var B = bodyOfRim(sd); if (!B) return;
    var R = renderBody(B); if (R) { lay(R.front); lay(R.back); }
  }

  // 1. the undersides of the two upper beams (seen from below: drawn first, the rest lies over them)
  strip(KB.bb, KB.bf, [0, -1, 0], kBase, 0.8);
  var smU = strip(SB.bb, SB.bf, [0, -1, 0], RED, 0.75);

  // 2. the tie beam: its middle and the ends that lie behind their pillar; soft shade where it goes into the pillars
  function nukiPiece(a0, a1) { return drawBox(a0, a1, nk.y0, nk.y1, -nk.dep / 2, nk.dep / 2, RED, 0.95); }
  function nukiShade(shapes) {
    if (!shapes.length) return;
    shapes.forEach(function (s) {
      inside(s.Q, function () {
        [-1, 1].forEach(function (sd) {
          var p = P(sd * nk.aN, (nk.y0 + nk.y1) / 2, 0), rr = pxPerM(sd * nk.aN, nk.y0, 0) * nk.rN * 2.2;
          var g = c.createRadialGradient(p[0], p[1], rr * 0.35, p[0], p[1], rr);
          g.addColorStop(0, 'rgba(40,12,8,0.28)'); g.addColorStop(1, 'rgba(40,12,8,0)');
          c.fillStyle = g; c.fillRect(p[0] - rr, p[1] - rr, rr * 2, rr * 2);
        });
        // a little grime along its lower edge (water runs along it and drips off)
        var yb = Math.max.apply(null, s.Q.map(function (q) { return q[1]; })), yt = Math.min.apply(null, s.Q.map(function (q) { return q[1]; }));
        var g2 = c.createLinearGradient(0, yt, 0, yb);
        g2.addColorStop(0, 'rgba(255,240,220,' + (0.05 * wea).toFixed(3) + ')'); g2.addColorStop(0.5, 'rgba(0,0,0,0)'); g2.addColorStop(1, 'rgba(50,20,12,' + (0.16 * wea).toFixed(3) + ')');
        c.fillStyle = g2; c.fillRect(-1e4, yt, 2e4, yb - yt);
      });
    });
  }
  var endA = nk.aN + nk.rN * 0.92, endB = nk.aN + nk.over;
  var kw = G.kus.kw, kH = G.kus.kH, kD = G.kus.kD;
  var nearSide = zOf(-nk.aN, nk.y0, 0) < zOf(nk.aN, nk.y0, 0) ? -1 : 1;     // the pillar nearer the eye
  function endPiece(sd) {
    var sh = sd < 0 ? nukiPiece(-endB, -endA) : nukiPiece(endA, endB);
    nukiShade(sh);
    if (G.kusabi) {                                             // the wedge just outside the pillar
      var ka = sd * (nk.aN + nk.rN + kw * 0.6);
      drawBox(ka - kw / 2, ka + kw / 2, (nk.y0 + nk.y1) / 2 - kH / 2, (nk.y0 + nk.y1) / 2 + kH / 2, -kD / 2, kD / 2, mix(RED, BLACK, 0.08), 0.9);
    }
    snowFront(sd < 0 ? 'endL' : 'endR'); snowFront(sd < 0 ? 'kusL' : 'kusR');
  }
  ['midL', 'midR', 'endL', 'endR', 'kusL', 'kusR'].forEach(snowBack);      // (the snow on the far side of the tie beam, behind it)
  nukiShade(nukiPiece(-nk.aN, nk.aN));
  // an end lies behind its pillar when its tip is farther from the eye than the pillar's axis
  var farEnds = [-1, 1].filter(function (sd) { return zOf(sd * endB, nk.y0, 0) >= zOf(sd * nk.aN, nk.y0, 0); });
  var nearEnds = [-1, 1].filter(function (sd) { return farEnds.indexOf(sd) < 0; });
  farEnds.forEach(endPiece);

  // 3. the pillars and the centre post, farthest first
  var items = [-1, 1].map(function (sd) { return { z: zOf(sd * G.axis(G.yP / 2), G.yP / 2, 0), sd: sd }; });
  items.push({ z: zOf(0, (G.gaku.y0 + G.gaku.y1) / 2, 0), gaku: true });
  // the snow on the tie beam between the pillars (a little nearer than what it lies against, so it is drawn after them)
  items.push({ z: zOf(-(nk.aN + G.gaku.w) / 2, nk.y1, 0) - 0.4, snow: 'midL' }, { z: zOf((nk.aN + G.gaku.w) / 2, nk.y1, 0) - 0.4, snow: 'midR' });
  items.sort(function (a, b) { return b.z - a.z; });
  items.forEach(function (it) {
    if (it.snow) { snowFront(it.snow); return; }
    if (it.gaku) {
      var g = G.gaku, gs = drawBox(-g.w, g.w, g.y0, g.y1, -g.dep / 2, g.dep / 2, RED, 0.9);
      gs.forEach(function (s) {
        inside(s.Q, function () {                                   // shade under the shimaki
          var p0 = P(0, g.y1, 0), p1 = P(0, g.y1 - (g.y1 - g.y0) * 0.5, 0), gg = c.createLinearGradient(p0[0], p0[1], p1[0], p1[1]);
          gg.addColorStop(0, 'rgba(30,10,6,0.35)'); gg.addColorStop(1, 'rgba(30,10,6,0)'); c.fillStyle = gg; c.fillRect(-1e4, -1e4, 2e4, 2e4);
        });
      });
      if (G.plaque) {
        var pw = g.w * 1.5, py0 = g.y0 + (g.y1 - g.y0) * 0.14, py1 = g.y1 - (g.y1 - g.y0) * 0.1;
        drawBox(-pw, pw, py0, py1, -g.dep / 2 - 0.08, -g.dep / 2, BLACK, 0.9);
        var fr = [P(-pw * 0.82, py0 + (py1 - py0) * 0.08, -g.dep / 2 - 0.081), P(pw * 0.82, py0 + (py1 - py0) * 0.08, -g.dep / 2 - 0.081),
                  P(pw * 0.82, py1 - (py1 - py0) * 0.08, -g.dep / 2 - 0.081), P(-pw * 0.82, py1 - (py1 - py0) * 0.08, -g.dep / 2 - 0.081)];
        poly(c, fr); c.strokeStyle = rgb(shade([200, 160, 70], T.n(0, 0, -1), 0.9)); c.lineWidth = Math.max(0.6, pxPerM(0, py1, 0) * 0.035); c.stroke();
      }
      return;
    }
    var sd = it.sd, a0 = sd * G.axis(0), aN = sd * G.axis(G.nem), aT = sd * G.axis(G.yP);
    // the vermilion shaft
    var aTop = sd * G.axis(G.topMax);
    // where the pillar meets the shimaki's curved underside, on the side of the pillar facing the eye: the clip's top edge
    var fb = zOf(aT, G.yP, -1) < zOf(aT, G.yP, 1) ? -1 : 1, clipQ = [], nq = 16;
    for (var qi = 0; qi <= nq; qi++) {
      var da = (-1.15 + 2.3 * qi / nq) * G.r1, bb = fb * Math.sqrt(Math.max(0, G.r1 * G.r1 - da * da));
      clipQ.push(P(aT + da, G.underAt(aT + da), bb));
    }
    var cL = clipQ[0], cR = clipQ[nq];
    clipQ.push([cR[0] + 2000, cR[1]], [cR[0] + 2000, cR[1] + 4000], [cL[0] - 2000, cL[1] + 4000], [cL[0] - 2000, cL[1]]);
    c.save(); poly(c, clipQ); c.clip();
    var shaft = drawCyl(aN, G.nem, aTop, G.topMax, G.radius(G.nem), G.r1, RED, { occ: 1 });
    var top = P(aT, G.underAt(aT), 0), nem = P(aN, G.nem, 0), sw = shaft.sR;
    inside(shaft.H, function () {
      // shade under the beams (the sky cut off) and where the tie beam goes through
      var gt = c.createLinearGradient(0, top[1], 0, top[1] + shaft.ppm * 0.6);
      gt.addColorStop(0, 'rgba(30,8,4,0.42)'); gt.addColorStop(1, 'rgba(30,8,4,0)'); c.fillStyle = gt; c.fillRect(-1e4, top[1], 2e4, shaft.ppm * 0.6);
      var pn = P(sd * nk.aN, nk.y0, 0), gn = c.createLinearGradient(0, pn[1], 0, pn[1] + shaft.ppm * 0.35);
      gn.addColorStop(0, 'rgba(30,8,4,0.22)'); gn.addColorStop(1, 'rgba(30,8,4,0)'); c.fillStyle = gn; c.fillRect(-1e4, pn[1], 2e4, shaft.ppm * 0.35);
      if (wea > 0) {
        // faint grain (planed hinoki under the paint) and faded paint on the sun's side, toward the top
        c.globalAlpha = 0.03 * wea;
        for (var q = 0; q < 7; q++) {
          var fx = lerp(-0.8, 0.8, r()), xa = lerp(nem[0], top[0], 0) + fx * sw;
          c.strokeStyle = r() < 0.5 ? '#3a0f06' : '#ffd8b8'; c.lineWidth = Math.max(0.4, sw * 0.05);
          c.beginPath(); c.moveTo(nem[0] + fx * sw, nem[1]); c.lineTo(top[0] + fx * sw * 0.9, top[1]); c.stroke();
        }
        c.globalAlpha = 1;
        var sunSide = Lt.dir[0] * T.rx < 0 ? -1 : 1;
        for (q = 0; q < 5; q++) {
          var yy = lerp(top[1], nem[1], Math.pow(r(), 1.4)), xx = lerp(nem[0], top[0], 0.5) + sw * lerp(-0.8, 0.8, r()), rr2 = sw * lerp(0.4, 1.1, r());
          var gf = c.createRadialGradient(xx, yy, 0, xx, yy, rr2);
          gf.addColorStop(0, 'rgba(255,214,190,' + (0.06 * wea).toFixed(3) + ')'); gf.addColorStop(1, 'rgba(255,214,190,0)');
          c.fillStyle = gf; c.fillRect(xx - rr2, yy - rr2 * 1.6, rr2 * 2, rr2 * 3.2);
        }
        // grime splashed up above the sleeve, and darkening toward it
        var gg = c.createLinearGradient(0, nem[1], 0, nem[1] - shaft.ppm * 0.7);
        gg.addColorStop(0, 'rgba(45,22,14,' + (0.32 * wea).toFixed(3) + ')'); gg.addColorStop(1, 'rgba(45,22,14,0)');
        c.fillStyle = gg; c.fillRect(-1e4, nem[1] - shaft.ppm * 0.7, 2e4, shaft.ppm * 0.7);
      }
    });
    // rain streaks running down from under the tie beam and from the top
    var pn2 = P(sd * nk.aN, nk.y0, 0);
    streaks(shaft.H, pn2[0] - sw * 0.85, pn2[0] + sw * 0.85, pn2[1], shaft.ppm * 2.2, 5, 0.16, [55, 18, 10]);
    streaks(shaft.H, top[0] - sw * 0.85, top[0] + sw * 0.85, top[1] + shaft.ppm * 0.1, shaft.ppm * 1.4, 4, 0.12, [55, 18, 10]);
    plaster(sd, shaft.H);
    c.restore();
    // the black sleeve at its foot (lacquer: a dull sheen) and its rim
    var sl = drawCyl(a0, 0, aN, G.nem, G.r0 * 1.07, G.radius(G.nem) * 1.07, BLACK, { occ: 1, spec: 0.12 });
    inside(sl.H, function () {
      if (wea <= 0) return;
      // dust and dried salt near the snow, scuffs
      var b0 = P(a0, 0, 0), gb = c.createLinearGradient(0, b0[1], 0, b0[1] - sl.ppm * 0.45);
      gb.addColorStop(0, 'rgba(170,165,160,' + (0.22 * wea).toFixed(3) + ')'); gb.addColorStop(1, 'rgba(170,165,160,0)');
      c.fillStyle = gb; c.fillRect(-1e4, b0[1] - sl.ppm * 0.45, 2e4, sl.ppm * 0.45);
      for (var q = 0; q < 2; q++) {
        var yy = lerp(nem[1], b0[1], r()), xx = lerp(b0[0], nem[0], 0.5) + sl.sR * lerp(-0.7, 0.7, r());
        c.fillStyle = 'rgba(160,150,140,' + (0.07 * wea).toFixed(3) + ')';
        c.beginPath(); c.ellipse(xx, yy, sl.sR * lerp(0.08, 0.25, r()), sl.ppm * lerp(0.03, 0.08, r()), 0, 0, TAU); c.fill();
      }
    });
    drawCyl(aN, G.nem - 0.035, aN, G.nem + 0.01, G.radius(G.nem) * 1.1, G.radius(G.nem) * 1.08, mix(BLACK, [120, 100, 80], 0.25), { occ: 1, spec: 0.25 });
    if (G.daiwa) drawCyl(aT, G.underAt(aT) - 0.045 * G.Ht, aT, G.underAt(aT), G.r1 * 1.28, G.r1 * 1.3, BLACK, { occ: 0.85, spec: 0.15 });
    rimSnow(sd);
    footSnow(a0);
  });

  // 4. the tie beam's ends that lie in front of their pillar
  nearEnds.forEach(endPiece);

  // 5. the shimaki: its faces, rounded toward their edges, grime along the bottom, streaks from its ends
  var smF = strip(SB.bf, SB.tf, [0, 0, -1], RED, occBeam, [[0, -0.35, 0], [0, 0.35, 0]]);
  strip(SB.tb, SB.bb, [0, 0, 1], RED, occBeam, [[0, 0.35, 0], [0, -0.35, 0]]);
  var smE = ends(SB, RED, occBeam);
  [smF].forEach(function (s) {
    if (!s || wea <= 0) return;
    inside(s.Q, function () {
      var p0 = P(0, Sm.y0, -Sm.dep / 2), p1 = P(0, Sm.y0 + Sm.th, -Sm.dep / 2);
      var g = c.createLinearGradient(0, p1[1], 0, p0[1]);
      g.addColorStop(0, 'rgba(30,8,4,' + (0.28).toFixed(3) + ')'); g.addColorStop(0.35, 'rgba(30,8,4,0)');
      g.addColorStop(0.75, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(50,20,12,' + (0.14 * wea).toFixed(3) + ')');
      c.fillStyle = g; c.fillRect(-1e4, p1[1] - 50, 2e4, p0[1] - p1[1] + 100);
    });
    var pl = P(-Sm.half, Sm.y0 + Sm.sori, -Sm.dep / 2), prr = P(Sm.half, Sm.y0 + Sm.sori, -Sm.dep / 2);
    streaks(s.Q, pl[0], prr[0], Math.min(pl[1], prr[1]) - 40, 80, 10, 0.08, [60, 20, 12]);
  });

  // 6. the kasagi (black: weathered lacquer or copper gone dark, chalky where the rain runs); the snow on its far side first
  snowBack('kasagi');
  var kF = strip(KB.bf, KB.tf, [0, 0, -1], kBase, 0.97, [[0, -0.4, 0], [0, 0.45, 0]]);
  strip(KB.tb, KB.bb, [0, 0, 1], kBase, 0.97, [[0, 0.45, 0], [0, -0.4, 0]]);
  strip(KB.tf, KB.tb, [0, 1, 0], kBase, 1);
  ends(KB, kBase, 0.97);
  if (kF && look.kasagiBlack === false) {
    // a vermilion kasagi: its top (a third of its height) black
    var capQ = KB.tf.map(function (q) { return P(q[0], q[1], q[2]); });
    var low = KB.tf.slice().reverse().map(function (q) { return P(q[0], q[1] - K.th * 0.35, q[2]); });
    fillPoly(capQ.concat(low), rgb(shade(BLACK, T.n(0, 0.2, -1), 0.97)));
  }
  if (kF && wea > 0) {
    var kl = P(-K.half, K.y0 + K.th, -K.dep / 2), kr = P(K.half, K.y0 + K.th, -K.dep / 2);
    var ktop = Math.min(kl[1], kr[1]) - 30, kbot = Math.max.apply(null, kF.Q.map(function (q) { return q[1]; }));
    streaks(kF.Q, kl[0], kr[0], ktop, kbot - ktop, 16, 0.07, [200, 196, 190]);
    inside(kF.Q, function () {
      var g = c.createLinearGradient(0, ktop + 30, 0, kbot);
      g.addColorStop(0, 'rgba(210,205,198,' + (0.1 * wea).toFixed(3) + ')'); g.addColorStop(0.5, 'rgba(0,0,0,0)');
      c.fillStyle = g; c.fillRect(-1e4, ktop, 2e4, kbot - ktop + 2);
    });
  }
  snowFront('kasagi');
  // where clumps may let go (camera space, m)
  box.emit = G.snow ? G.snow.emit.map(function (e) { return { p: T.w(e.p[0], e.p[1], e.p[2]), h: e.h, grp: e.grp }; }) : [];
  return box;
}

/* ---------------- its shadow on the snow: each solid's points sent along the sun's direction down to the snow, their
   outline filled (the outline of a solid's shadow is the hull of its points' shadows) ---------------- */
function shadow(c, G, place, cam, Lt) {
  var L = Lt.dir;
  if (L[1] < 0.02) return;
  var T = frame(place, cam), S = solids(G);
  S.forEach(function (s) {
    var Q = s.pts.map(function (p) {
      var q = T.w(p[0], p[1], p[2]), t = (q[1] - (place.y0 || 0)) / L[1];
      return T.p([q[0] - L[0] * t, place.y0 || 0, q[2] - L[2] * t]);
    });
    poly(c, hull(Q)); c.fill();
  });
  if (G.snow) G.snow.heaps.forEach(function (hp) {
    for (var i = 0; i < hp.st.length - 1; i += 4) {
      var Q = [];
      for (var j = i; j <= Math.min(hp.st.length - 1, i + 4); j++) section(hp.hd, hp.st[j]).forEach(function (pp) {
        var q = T.w(hp.st[j].a, hp.st[j].y + pp[1], pp[0]), t = (q[1] - (place.y0 || 0)) / L[1];
        Q.push(T.p([q[0] - L[0] * t, place.y0 || 0, q[2] - L[2] * t]));
      });
      poly(c, hull(Q)); c.fill();
    }
  });
}
/* its outline on the screen (every solid and the snow lying on it), filled in c's current fillStyle: for working out how
   the gates overlap one another */
function silhouette(c, G, place, cam, only) {
  var T = frame(place, cam), S = solids(G);
  S.forEach(function (s) { if (only && s.tag !== only) return; poly(c, hull(s.pts.map(function (p) { return T.p(T.w(p[0], p[1], p[2])); }))); c.fill(); });
  if (G.snow) G.snow.heaps.forEach(function (hp) {
    if (only && hp.grp !== only) return;
    for (var i = 0; i < hp.st.length - 1; i += 3) {
      var Q = [];
      for (var j = i; j <= Math.min(hp.st.length - 1, i + 3); j++) section(hp.hd, hp.st[j]).forEach(function (pp) { Q.push(T.p(T.w(hp.st[j].a, hp.st[j].y + pp[1], pp[0]))); });
      poly(c, hull(Q)); c.fill();
    }
  });
}
/* its upright members on the screen (the two pillars and the centre post): { x0, x1, y0, y1 } CSS px */
function members(G, place, cam) {
  var T = frame(place, cam), out = [];
  [-1, 1].forEach(function (sd) {
    var yb = G.nY, a = sd * G.axis(yb), r = G.radius(yb), L = T.p(T.w(a - r, yb, 0)), R = T.p(T.w(a + r, yb, 0));
    var top = T.p(T.w(sd * G.axis(G.yP), G.yP, 0)), foot = T.p(T.w(sd * G.axis(0), 0, 0));
    out.push({ x0: Math.min(L[0], R[0]), x1: Math.max(L[0], R[0]), y0: top[1], y1: foot[1] });
  });
  var g = G.gaku, l = T.p(T.w(-g.w, (g.y0 + g.y1) / 2, 0)), r2 = T.p(T.w(g.w, (g.y0 + g.y1) / 2, 0));
  out.push({ x0: Math.min(l[0], r2[0]), x1: Math.max(l[0], r2[0]), y0: T.p(T.w(0, g.y1, 0))[1], y1: T.p(T.w(0, g.y0, 0))[1] });
  return out;
}
/* where each pillar stands (camera space, m) and its radius: for the soft shade at its foot */
function feet(G, place) {
  var T = frame(place, { W: 0, H: 0, hy: 0, F: 1, eye: 0 });
  return [-1, 1].map(function (sd) { var q = T.w(sd * G.axis(0), 0, 0); return { x: q[0], z: q[2], r: G.r0 * 1.07 }; });
}

return { build: build, draw: draw, shadow: shadow, feet: feet, silhouette: silhouette, members: members };
})();
