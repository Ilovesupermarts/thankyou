/* ============================================================
   TRUNKS — the trunk and branches of the autumn maples, built in 3D
   and drawn on the graphics chip (WebGL 2) every frame, so they sway
   with the tree.

   What makes them look real:
   - Every branch is a round tube. Each limb runs on as one smooth
     tube through its forks (the "leader": the child running most
     nearly straight on), and bends gently between them. A side branch
     starts inside the limb it grows from and curves out of it, a
     little swollen at its base (the branch collar), so the two always
     join: in 3D the surfaces simply meet, with nothing stuck on.
   - Branches reach toward you and away from you, so where they cross,
     the nearer one is in front.
   - The bark of a Japanese maple: smooth grey-brown with fine
     lengthwise streaks, shallow cracks low on the old trunk, pale
     lichen patches, and moss on the shaded side of its foot. It is
     lit with relief (the streaks and cracks catch the light).
   - The light: the sun from the same side as on the leaves, the sky
     from above, warm light thrown up from the red leaves and the
     litter onto the undersides, and a rim of light along the edges
     on the sun's side. Shade in the forks (where limbs block the
     light from each other).
   - 木漏れ日 (komorebi): branches under the leaves are in their shade,
     with spots of sunlight through them that drift in the wind.
   - The trunk spreads out at its foot in buttress lobes, with roots
     running out into the leaves.
   - It fades into the air (more for the far tree).

   Use:
     var M = Trunks.build(s);      // the tree's shape, once (rest pose)
     var P = Trunks.draw(o);       // { cnv, x, y, w, h }, or null (no WebGL 2, or the
                                   // context was lost): only the box round the tree is
                                   // drawn, into the top-left w × h px of cnv; it goes at
                                   // x, y (device px) in the o.width × o.height picture
     Trunks.flat(c, colour)        // the last tree, flat in one colour, into a 2D
                                   // context set up for CSS px (when draw gave null)
     Trunks.axisAt(M, nodes, X, i, f)   // [x, y, z]: a point on node i's centre line,
                                        // f = 0 its start … 1 its end
     Trunks.state()                // 'ok', 'lost' or 'none'
   s:
     nodes      the branches: { p (parent, -1 for the trunk), w (thickness, px),
                len, abs (angle at rest), sx, sy, ex, ey (rest pose) }; a node
                with perch: true is skipped (draw it as an extra tube)
     X          function (x) → x: the canopy's squeeze toward its trunk
     clumps     [{ x, y, R, back }] the foliage at rest (squeezed): what shades the limbs
     seed
     look       { girth, bend, depth, rootFlare, roots }
   o:
     model, nodes, X        (nodes as they are now)
     extra      more tubes: [{ parent, f, pts: [[x, y]...], r: [...], shade, z }] —
                with a parent, they start on that node's centre line at f;
                without one, they lie at depth z
     width, height          the picture (device px)
     W, H, px               the screen (CSS px), device px per CSS px
     time, wind
     ground     CSS px from the top where the ground meets the trunk
     look       { girth, relief, fissures, streaks, lichen, moss, mossHeight, wet,
                  rim, canopyShade, komorebi, crotch, air }
     colours    { bark, dark, light, lichen, moss } [r, g, b] 0 … 255
     light      { dir [x, y, z] toward the light (x right, y down, z toward you),
                  sun, sky, bounce [r, g, b] 0 … 1.5,
                  leaf [r, g, b] 0 … 1.5: the light that comes through the leaves, in their shade,
                  air [r, g, b] 0 … 255 }
   ============================================================ */
var Trunks = (function () {
'use strict';

var PI = Math.PI, TAU = PI * 2;
function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
function smooth(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
function d(o, k, v) { return o && o[k] !== undefined ? o[k] : v; }
function rng(seed) {
  var a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    var t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ============================================================
   1. THE SHAPE — made once per tree, at rest.
   ============================================================ */
function build(s) {
  var ns = s.nodes, r = rng(s.seed), L = s.look || {}, n = ns.length, i;
  var kids = [], lead = [], rEnd = new Float32Array(n);
  for (i = 0; i < n; i++) kids[i] = [];
  for (i = 0; i < n; i++) if (ns[i].p >= 0 && !ns[i].perch) kids[ns[i].p].push(i);
  // the leader: the child running most nearly straight on
  for (i = 0; i < n; i++) {
    var best = -1, bd = Infinity;
    for (var k = 0; k < kids[i].length; k++) {
      var j = kids[i][k], da = Math.abs(Math.atan2(Math.sin(ns[j].abs - ns[i].abs), Math.cos(ns[j].abs - ns[i].abs)));
      if (da < bd) { bd = da; best = j; }
    }
    lead[i] = best;
    // thick enough at its end for the thickest branch growing from it; a twig ends thin
    var wk = 0;
    for (k = 0; k < kids[i].length; k++) wk = Math.max(wk, ns[kids[i][k]].w);
    rEnd[i] = (wk > 0 ? wk : ns[i].w * 0.55) / 2;
  }
  // limbs: runs of leaders. Each side branch starts a limb of its own.
  var limbs = [];
  function walk(start, parent) {
    var limb = { nodes: [], parent: parent, seed: r() * 300 };
    limbs.push(limb);
    for (var cur = start; ; cur = lead[cur]) {
      limb.nodes.push(cur);
      for (var q = 0; q < kids[cur].length; q++) if (kids[cur][q] !== lead[cur]) walk(kids[cur][q], cur);
      if (lead[cur] < 0) break;
    }
  }
  for (i = 0; i < n; i++) if (ns[i].p < 0 && !ns[i].perch) walk(i, -1);
  // depth (toward you / away) and the gentle bends between forks
  var depth = d(L, 'depth', 0.5), bend = d(L, 'bend', 0.5);
  var z0 = new Float32Array(n), z1 = new Float32Array(n), b1 = new Float32Array(n), b2 = new Float32Array(n);
  for (i = 0; i < n; i++) {
    var N = ns[i], isLead = N.p >= 0 && lead[N.p] === i;
    z0[i] = N.p >= 0 ? z1[N.p] : 0;
    z1[i] = z0[i] + N.len * (r() - 0.5) * depth * (N.p < 0 ? 0.3 : isLead ? 0.6 : 1.5);
    var bk = N.p < 0 ? 0.6 : 1;
    b1[i] = (r() - 0.5) * 2 * bend * 0.075 * bk;
    b2[i] = (r() - 0.5) * 2 * bend * 0.035 * bk;
  }
  // how deep in the leaves' shade each node is (at its start, middle and end)
  var X = s.X || function (x) { return x; }, C = s.clumps || [], sh = new Float32Array(n * 3);
  function shadeAt(x, y) {
    var o = 0;
    for (var c = 0; c < C.length; c++) {
      var dx = x - C[c].x, dy = y - C[c].y, dd = Math.hypot(dx, dy) / C[c].R, wgt = C[c].back ? 0.6 : 1;
      if (dd < 1.4) o += (1 - smooth(0.3, 1.4, dd)) * wgt;
      // the canopy overhead keeps the light off what is under it
      else if (dy > 0 && Math.abs(dx) < C[c].R) o += 0.12 * Math.exp(-dy / (C[c].R * 3)) * wgt;
    }
    return clamp(o * 0.7, 0, 1);
  }
  for (i = 0; i < n; i++) {
    for (var f = 0; f < 3; f++) {
      var t = f / 2;
      sh[i * 3 + f] = shadeAt(X(lerp(ns[i].sx, ns[i].ex, t)), lerp(ns[i].sy, ns[i].ey, t));
    }
  }
  // roots running out from the foot of the trunk into the ground
  var roots = [], nr = Math.round(d(L, 'roots', 4)), trunk = -1;
  for (i = 0; i < n; i++) if (ns[i].p < 0 && !ns[i].perch) { trunk = i; break; }
  var r0 = trunk >= 0 ? ns[trunk].w / 2 : 4;
  for (i = 0; i < nr; i++) {
    var side = i % 2 ? 1 : -1;
    if (r() < 0.25) side = -side;
    roots.push({ side: side, drop: lerp(0.18, 0.5, r()), len: r0 * lerp(3, 6, r()), r: r0 * lerp(0.3, 0.45, r()),
                 z: (r() - 0.5) * r0 * 3.5, h: r0 * lerp(1.4, 2.6, r()), bend: (r() - 0.5) * 0.5, seed: r() * 300 });
  }
  return { kids: kids, lead: lead, rEnd: rEnd, limbs: limbs, z0: z0, z1: z1, b1: b1, b2: b2, sh: sh,
           roots: roots, trunk: trunk, r0: r0, lobeAt: r() * TAU, look: L };
}
/* A point on node i's centre line (bent), f = 0 its start … 1 its end. */
function axisAt(M, ns, X, i, f, out) {
  out = out || [0, 0, 0];
  var n = ns[i], sx = X(n.sx), dx = X(n.ex) - sx, dy = n.ey - n.sy, l = Math.hypot(dx, dy) || 1;
  var off = M ? (M.b1[i] * Math.sin(PI * f) + M.b2[i] * Math.sin(TAU * f)) * n.len : 0;
  out[0] = sx + dx * f - dy / l * off;
  out[1] = n.sy + dy * f + dx / l * off;
  out[2] = M ? lerp(M.z0[i], M.z1[i], f) : 0;
  return out;
}

/* ============================================================
   2. THE TUBES — made again every frame from where the branches
   are now. A tube is its centre points with a radius at each.
   ============================================================ */
var tubes = [];          // the last frame's, also for flat()
function newTube(seed, age) { return { x: [], y: [], z: [], r: [], v: [], s: [], seed: seed, age: age, flare: false, cap: true }; }
function put(T, p, rad, v, sh) { T.x.push(p[0]); T.y.push(p[1]); T.z.push(p[2]); T.r.push(rad); T.v.push(v); T.s.push(sh); }
/* Rounds the corners off (positions only; the ends stay where they are). */
function soften(T, passes) {
  var n = T.x.length, a = [T.x, T.y, T.z], q, k, c;
  for (q = 0; q < passes; q++) {
    for (c = 0; c < 3; c++) {
      var A = a[c], prev = A[0];
      for (k = 1; k < n - 1; k++) { var cur = A[k]; A[k] = 0.25 * prev + 0.5 * cur + 0.25 * A[k + 1]; prev = cur; }
    }
  }
}
function makeTubes(o) {
  var M = o.model, ns = o.nodes, X = o.X, g = d(o.look, 'girth', 1), px = o.px, P = [0, 0, 0];
  var r0 = M.r0 * g;
  tubes = [];
  function shadeOf(i, f) { var a = M.sh[i * 3], b = M.sh[i * 3 + 1], c = M.sh[i * 3 + 2]; return f < 0.5 ? lerp(a, b, f * 2) : lerp(b, c, f * 2 - 1); }
  // Thin twigs deep in the leaves are left out (they can't be seen there, and
  // through the slightly see-through foliage they would show as scratches);
  // so is everything growing from them. Parents come before their side branches.
  var hidden = new Uint8Array(ns.length);
  for (var li = 0; li < M.limbs.length; li++) {
    var limb = M.limbs[li], first = ns[limb.nodes[0]];
    var hide = limb.parent >= 0 && hidden[limb.parent];
    if (!hide && limb.parent >= 0 && first.w / 2 * g * px < d(o.look, 'twigCut', 1.8)) {
      var sum = 0;
      for (var hq = 0; hq < limb.nodes.length; hq++) sum += M.sh[limb.nodes[hq] * 3 + 1];
      hide = sum / limb.nodes.length > 0.6;
    }
    if (hide) { for (var hn = 0; hn < limb.nodes.length; hn++) hidden[limb.nodes[hn]] = 1; continue; }
    var T = newTube(limb.seed, 0), v = 0;
    T.age = clamp(first.w / 2 * g / r0, 0, 1);
    if (limb.parent >= 0) {
      // start inside the limb it grows from, a little before the fork, then curve out of it
      var pa = ns[limb.parent], rP = M.rEnd[limb.parent] * g, fb = 1 - clamp(1.4 * rP / (pa.len || 1), 0.04, 0.6);
      axisAt(M, ns, X, limb.parent, fb, P);
      put(T, P, Math.min(first.w / 2 * g, rP * 0.95), -(1 - fb) * pa.len, shadeOf(limb.parent, fb));
    } else {
      T.flare = true;
    }
    for (var q = 0; q < limb.nodes.length; q++) {
      var i = limb.nodes[q], N = ns[i], rs = N.w / 2 * g, re = M.rEnd[i] * g;
      var steps = rs * px < 1.5 ? 1 : clamp(Math.round(N.len / 9), 2, 12);
      for (var j = q === 0 ? 0 : 1; j <= steps; j++) {
        var f = j / steps, rad = lerp(rs, re, f);
        if (q === 0 && j === 0 && limb.parent >= 0) rad *= 1.12;          // the collar at its base
        else if (q === 0 && limb.parent >= 0 && f < 0.5) rad *= 1 + 0.12 * (1 - f * 2);
        axisAt(M, ns, X, i, f, P);
        put(T, P, rad, v + f * N.len, shadeOf(i, f));
      }
      v += N.len;
    }
    soften(T, limb.parent >= 0 ? 2 : 1);
    tubes.push(T);
  }
  // the roots: out from the foot of the trunk, sinking into the ground
  if (M.trunk >= 0) {
    var tn = ns[M.trunk], bx = X(tn.sx), by = tn.sy;
    for (var ri = 0; ri < M.roots.length; ri++) {
      var R = M.roots[ri], RT = newTube(R.seed, 0.8), steps2 = 8;
      for (var k = 0; k <= steps2; k++) {
        var u = k / steps2, ang = R.drop + R.bend * u + u * u * 0.6;
        var x = bx + R.side * Math.cos(ang) * R.len * u * g, y = by - R.h * g + Math.sin(ang) * R.len * u * g + u * u * R.len * 0.3;
        put(RT, [x, y, R.z * u * g], lerp(R.r * g, R.r * g * 0.3, u) * (k === 0 ? 1.4 : 1), u * R.len, 0);
      }
      RT.x[0] = bx; RT.z[0] = 0;                                        // it starts inside the trunk
      soften(RT, 1);
      RT.cap = false;
      tubes.push(RT);
    }
  }
  // extra tubes (the owl's branch), starting on their parent's centre line
  (o.extra || []).forEach(function (E) {
    var on = E.parent !== undefined && E.parent >= 0, ET = newTube(E.seed || 7, 0.3), vv = 0;
    var base = on ? axisAt(M, ns, X, E.parent, E.f, [0, 0, 0]) : [0, 0, d(E, 'z', 0)];
    for (var k = 0; k < E.pts.length; k++) {
      if (k > 0) vv += Math.hypot(E.pts[k][0] - E.pts[k - 1][0], E.pts[k][1] - E.pts[k - 1][1]);
      put(ET, [E.pts[k][0], E.pts[k][1], base[2]], E.r[k], vv, d(E, 'shade', 0.2));
    }
    if (on) { ET.x[0] = base[0]; ET.y[0] = base[1]; }
    tubes.push(ET);
  });
}

/* ============================================================
   3. THE MESH — a half ring (the side facing you) round every
   centre point, with its normals; the end of a limb gets a round cap.
   Per vertex: position (3), normal (3), across / along the bark in
   CSS px (2), radius, the leaves' shade, age (0 twig … 1 trunk), seed.
   ============================================================ */
var FL = 12, vbuf = new Float32Array(FL * 4096), ibuf = new Uint32Array(4096 * 6), nv = 0, ni = 0;
function grow(nVert, nIdx) {
  if ((nv + nVert) * FL > vbuf.length) { var a = new Float32Array(Math.max(vbuf.length * 2, (nv + nVert) * FL * 1.5)); a.set(vbuf); vbuf = a; }
  if (ni + nIdx > ibuf.length) { var b = new Uint32Array(Math.max(ibuf.length * 2, (ni + nIdx) * 1.5)); b.set(ibuf); ibuf = b; }
}
function vert(x, y, z, nx, ny, nz, u, v, r, s, age, seed) {
  var k = nv * FL, l = Math.hypot(nx, ny, nz) || 1;
  vbuf[k] = x; vbuf[k + 1] = y; vbuf[k + 2] = z;
  vbuf[k + 3] = nx / l; vbuf[k + 4] = ny / l; vbuf[k + 5] = nz / l;
  vbuf[k + 6] = u; vbuf[k + 7] = v; vbuf[k + 8] = r; vbuf[k + 9] = s; vbuf[k + 10] = age; vbuf[k + 11] = seed;
  nv++;
}
function meshTube(T, o) {
  var n = T.x.length;
  if (n < 2) return;
  var px = o.px, rMax = 0, k, j;
  for (k = 0; k < n; k++) rMax = Math.max(rMax, T.r[k]);
  var m = clamp(Math.round(rMax * px * 0.7), 2, 14);
  var flare = T.flare ? d(o.look, 'rootFlare', 1) : 0, r0 = o.model.r0 * d(o.look, 'girth', 1), lob = o.model.lobeAt;
  var capR = T.r[n - 1], caps = T.cap && capR * px > 1.2 ? 3 : 0;
  grow((n + caps) * (m + 1), (n + caps - 1) * m * 6);
  var base = nv, tx = 0, ty = 0, tz = 0, Nx = 0, Ny = 0, Nz = 1, Bx = 1, By = 0, Bz = 0;
  function frame(k) {
    var a = Math.max(k - 1, 0), b = Math.min(k + 1, n - 1);
    tx = T.x[b] - T.x[a]; ty = T.y[b] - T.y[a]; tz = T.z[b] - T.z[a];
    var tl = Math.hypot(tx, ty, tz) || 1;
    tx /= tl; ty /= tl; tz /= tl;
    // N: the direction toward you, square to the tube; B = t × N
    Nx = -tx * tz; Ny = -ty * tz; Nz = 1 - tz * tz;
    var nl = Math.hypot(Nx, Ny, Nz);
    if (nl < 1e-4) { Nx = 0; Ny = 0; Nz = 1; } else { Nx /= nl; Ny /= nl; Nz /= nl; }
    Bx = ty * Nz - tz * Ny; By = tz * Nx - tx * Nz; Bz = tx * Ny - ty * Nx;
    return tl;
  }
  for (k = 0; k < n; k++) {
    var span = frame(k), a = Math.max(k - 1, 0), b = Math.min(k + 1, n - 1);
    var drds = span > 0 ? (T.r[b] - T.r[a]) / span : 0, R = T.r[k], v = T.v[k];
    var rad = R, lobeA = 0;
    if (flare > 0) {                                     // the foot spreads out, in buttress lobes
      var h = Math.max(0, v);
      rad = R * (1 + flare * 0.85 * Math.exp(-h / (r0 * 3.2)));
      lobeA = flare * 0.38 * Math.exp(-h / (r0 * 2.4));
      drds -= R * flare * 0.85 * Math.exp(-h / (r0 * 3.2)) / (r0 * 3.2);
    }
    for (j = 0; j <= m; j++) {
      var th = -PI / 2 + PI * j / m, c = Math.cos(th), s = Math.sin(th);
      var dx = Nx * c + Bx * s, dy = Ny * c + By * s, dz = Nz * c + Bz * s;
      var gx = -Nx * s + Bx * c, gy = -Ny * s + By * c, gz = -Nz * s + Bz * c;   // round the ring
      var rr = rad, dr = 0;
      if (lobeA > 0) {
        var cl = Math.cos(5 * th + lob), cp = Math.max(0, cl);
        rr = rad * (1 + lobeA * cp * cp);
        dr = rad * lobeA * 2 * cp * -Math.sin(5 * th + lob) * 5;
      }
      vert(T.x[k] + dx * rr, T.y[k] + dy * rr, T.z[k] + dz * rr,
           dx - gx * dr / rr - tx * drds, dy - gy * dr / rr - ty * drds, dz - gz * dr / rr - tz * drds,
           th * R, v, R, T.s[k], T.age, T.seed);
    }
  }
  // a round cap on the end
  for (var q = 1; q <= caps; q++) {
    var ph = q / caps * PI / 2 * 0.97, cc = Math.cos(ph), ss = Math.sin(ph), e = n - 1;
    frame(e);
    for (j = 0; j <= m; j++) {
      var th2 = -PI / 2 + PI * j / m, c2 = Math.cos(th2), s2 = Math.sin(th2);
      var ex = Nx * c2 + Bx * s2, ey = Ny * c2 + By * s2, ez = Nz * c2 + Bz * s2;
      vert(T.x[e] + tx * capR * ss + ex * capR * cc, T.y[e] + ty * capR * ss + ey * capR * cc, T.z[e] + tz * capR * ss + ez * capR * cc,
           ex * cc + tx * ss, ey * cc + ty * ss, ez * cc + tz * ss, th2 * capR, T.v[e] + capR * ss, capR, T.s[e], T.age, T.seed);
    }
  }
  var rings = n + caps;
  for (k = 0; k < rings - 1; k++) {
    for (j = 0; j < m; j++) {
      var i0 = base + k * (m + 1) + j, i1 = i0 + m + 1;
      ibuf[ni++] = i0; ibuf[ni++] = i1; ibuf[ni++] = i0 + 1;
      ibuf[ni++] = i0 + 1; ibuf[ni++] = i1; ibuf[ni++] = i1 + 1;
    }
  }
}
/* The shade in the forks: a ball just up each side branch from its fork
   darkens what faces it (the other branch, the limb under it). */
var AO_MAX = 48, aoBuf = new Float32Array(AO_MAX * 4), aoN = 0;
function forkBalls(o) {
  var list = [];
  for (var t = 0; t < tubes.length; t++) {
    var T = tubes[t];
    if (T.flare || T.x.length < 3) continue;
    var R = T.r[1];
    if (R * o.px < 1.2) continue;
    // about 1.3 radii out from the fork
    var k = 1, gone = 0;
    while (k < T.x.length - 1 && gone < R * 1.3) { gone += Math.hypot(T.x[k + 1] - T.x[k], T.y[k + 1] - T.y[k]); k++; }
    list.push([T.x[k], T.y[k], T.z[k], R * 1.05]);
  }
  list.sort(function (a, b) { return b[3] - a[3]; });
  aoN = Math.min(AO_MAX, list.length);
  for (var i = 0; i < aoN; i++) { aoBuf[i * 4] = list[i][0]; aoBuf[i * 4 + 1] = list[i][1]; aoBuf[i * 4 + 2] = list[i][2]; aoBuf[i * 4 + 3] = list[i][3]; }
}

/* ============================================================
   4. THE SHADERS
   ============================================================ */
var VS = [
'#version 300 es',
'layout(location = 0) in vec3 aPos;',
'layout(location = 1) in vec3 aN;',
'layout(location = 2) in vec2 aUV;',
'layout(location = 3) in vec4 aX;',
'uniform vec2 uScreen, uOrigin;',
'out vec3 vP; out vec3 vN; out vec2 vUV; out vec4 vX;',
'void main() {',
'  vP = aPos; vN = aN; vUV = aUV; vX = aX;',
'  gl_Position = vec4((aPos.x - uOrigin.x) / uScreen.x * 2.0 - 1.0, 1.0 - (aPos.y - uOrigin.y) / uScreen.y * 2.0, -aPos.z / 6000.0, 1.0);',
'}'
].join('\n');

var FS = [
'#version 300 es',
'precision highp float;',
'in vec3 vP; in vec3 vN; in vec2 vUV; in vec4 vX;',
'uniform vec3 uSunDir, uSunCol, uSkyCol, uBounceCol, uLeafCol, uAirCol;',
'uniform vec3 uBark, uDark, uLight, uLichen, uMoss;',
'uniform float uRelief, uFiss, uStreak, uLichenAmt, uMossAmt, uMossH, uGround, uWet, uRim;',
'uniform float uCanopy, uDapple, uCrotch, uAir, uTime, uWind, uPx;',
'uniform vec4 uAO[' + AO_MAX + '];',
'uniform int uAOn;',
'out vec4 outCol;',
'float hash(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }',
'float noise(vec2 p) {',
'  vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);',
'  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);',
'}',
'float fbm(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * noise(p); p = p * 2.03 + vec2(17.1, 9.7); a *= 0.5; } return s / 0.9375; }',
'void main() {',
'  float R = vX.x, shade = vX.y, age = vX.z;',
'  vec3 L = normalize(uSunDir);',
'  // --- the bark of a Japanese maple: smooth, grey-brown, mottled, its pattern',
'  // growing with the limb and running along it',
'  float sc = clamp(R / 9.0, 0.35, 1.8);',
'  vec2 q = vec2(vUV.x / sc, vUV.y / sc) + vec2(vX.w * 3.7, vX.w * 11.3);',
'  float pa = fbm(vec2(q.x * 0.16 + 3.1, q.y * 0.035));                  // broad mottling',
'  float mo = fbm(vec2(q.x * 0.5, q.y * 0.12) + 9.0);                    // smaller blotches',
'  float ln = noise(vec2(q.x * 0.9, q.y * 0.018));                       // sparse pale lines along the limb',
'  float st = smoothstep(0.72, 0.9, ln) * smoothstep(0.35, 0.65, mo);',
'  float rid = 1.0 - abs(noise(vec2(q.x * 0.32, q.y * 0.028)) * 2.0 - 1.0);   // shallow cracks, on the old wood',
'  float fis = smoothstep(0.84, 0.98, rid) * uFiss * smoothstep(0.3, 0.95, age);',
'  float li = smoothstep(0.6, 0.76, fbm(vec2(q.x * 0.22 + 7.0, q.y * 0.07))) * uLichenAmt;',
'  float grain = noise(q * vec2(1.6, 0.5)) * 0.6 + noise(q * vec2(3.4, 1.1) + 2.0) * 0.4;   // fine roughness',
'  vec3 alb = uBark * (0.8 + 0.42 * pa) * (0.94 + 0.12 * mo);',
'  alb = mix(alb, uLight, st * uStreak * 0.75);',
'  alb = mix(alb, uDark, fis * 0.85);',
'  alb = mix(alb, uLichen * (0.9 + 0.2 * mo), li * 0.75);',
'  // moss on the foot of the trunk, on its shaded side, in patches',
'  float above = uGround - vP.y;',
'  float mz = uMossH * (0.55 + 0.9 * fbm(vec2(vUV.x * 0.05, vUV.y * 0.012) + 5.0));',
'  float side = clamp(0.5 - dot(normalize(vN.xy + vec2(1e-4)), normalize(L.xy + vec2(1e-4))) * 0.7 - vN.y * 0.3, 0.0, 1.0);',
'  float moss = smoothstep(mz, mz * 0.35, above) * smoothstep(0.45, 0.85, age) * uMossAmt;',
'  moss *= smoothstep(0.25, 0.7, side + 0.35 * fbm(vUV * vec2(0.15, 0.06) + 11.0));',
'  float mt = noise(vUV * 0.7);',
'  alb = mix(alb, uMoss * (0.75 + 0.5 * mt), clamp(moss, 0.0, 1.0));',
'  // --- relief: the streaks and cracks catch the light',
'  float h = st * uStreak * 0.35 - fis * 1.4 + li * 0.35 + moss * mt * 0.6 + grain * 0.35 + mo * 0.25;',
'  vec2 gr = vec2(dFdx(h), -dFdy(h)) * uPx;',
'  vec3 n = normalize(vN);',
'  n = normalize(vec3(n.xy - gr * uRelief * 2.2 * clamp(R * 0.4, 0.3, 1.0), n.z));',
'  // --- the light',
'  float ndl = dot(n, L);',
'  float diff = clamp((ndl + 0.2) / 1.2, 0.0, 1.0);',
'  diff *= diff * 0.35 + 0.65;',
'  // the leaves\' shade, with spots of sun through it drifting in the wind (komorebi)',
'  float sd = shade * uCanopy;',
'  vec2 dp = vP.xy / 26.0 + vec2(uTime * (0.05 + 0.18 * uWind), uTime * 0.04);',
'  float spots = smoothstep(0.56, 0.7, noise(dp) * 0.65 + noise(dp * 2.3 + 4.0) * 0.35);',
'  float sunVis = mix(1.0, 0.1 + 0.95 * spots * uDapple, sd);',
'  // the shade in the forks',
'  float occ = 0.0;',
'  for (int i = 0; i < ' + AO_MAX + '; i++) {',
'    if (i >= uAOn) break;',
'    vec3 dv = uAO[i].xyz - vP;',
'    float l2 = max(dot(dv, dv), 1e-3);',
'    occ += clamp(dot(n, dv * inversesqrt(l2)), 0.0, 1.0) * uAO[i].w * uAO[i].w / l2;',
'  }',
'  float ao = 1.0 - uCrotch * clamp(occ * 0.9, 0.0, 0.85);',
'  ao *= 1.0 - fis * 0.35;',
'  vec3 lin = pow(alb, vec3(2.2)) * (1.0 - uWet * 0.45);',
'  float up = 0.5 - 0.5 * n.y;',
'  vec3 lightC = uSunCol * diff * sunVis * mix(1.0, ao, 0.6)',
'             + (mix(uSkyCol, uLeafCol, sd) * (0.35 + 0.65 * up) + uBounceCol * (1.0 - up)) * ao;',
'  vec3 col = lin * lightC;',
'  // a rim of light along the edge on the sun\'s side',
'  float edge = pow(1.0 - clamp(n.z, 0.0, 1.0), 3.0);',
'  float towards = clamp(dot(normalize(n.xy + vec2(1e-4)), normalize(L.xy + vec2(1e-4))), 0.0, 1.0);',
'  col += uSunCol * pow(alb, vec3(1.2)) * edge * towards * uRim * 0.55 * sunVis;',
'  // wet bark: a sheen',
'  vec3 hv = normalize(L + vec3(0.0, 0.0, 1.0));',
'  col += uSunCol * pow(max(dot(n, hv), 0.0), 36.0) * uWet * 0.35 * sunVis * (1.0 - fis);',
'  col = pow(max(col, vec3(0.0)), vec3(1.0 / 2.2));',
'  col = mix(col, uAirCol, uAir);',
'  // a soft outline (no multisampling: it would cost too much graphics memory on the tablet).',
'  // At the outline the surface turns away from you (z of the normal falls to 0).',
'  float nz = normalize(vN).z;',
'  float cover = clamp(nz / max(fwidth(nz), 1e-4) * 0.8, 0.0, 1.0);',
'  cover = max(cover, clamp(1.6 - R * uPx, 0.0, 0.8));               // thin twigs: never fade away',
'  outCol = vec4(col * cover, cover);',
'}'
].join('\n');

/* ============================================================
   5. WEBGL — one canvas and one context for the life of the page,
   made again on it after the graphics chip takes it away for a
   moment (as in mountains.js).
   ============================================================ */
var cnv = null, gl = null, prog = null, U = {}, vbo = null, ibo = null, vao = null, failed = false;
var lost = false, ready = false, lostAt = 0, renewals = 0, losses = 0;
function compile(type, src) {
  var s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn('Trunks: shader', gl.getShaderInfoLog(s)); return null; }
  return s;
}
function create() {
  if (cnv) return !!gl;
  try {
    cnv = document.createElement('canvas');
    gl = cnv.getContext('webgl2', { premultipliedAlpha: true, preserveDrawingBuffer: false, antialias: false, alpha: true, depth: true });
  } catch (e) { gl = null; }
  if (!gl) { failed = true; return false; }
  cnv.addEventListener('webglcontextlost', function (ev) {
    ev.preventDefault();
    if (this !== cnv) return;
    lost = true; ready = false; lostAt = performance.now(); prog = null; U = {};
    // Taken away twice: the tablet is short of graphics memory. Stay flat from now
    // on, so the tree never takes the mountains down with it.
    if (++losses >= 2) failed = true;
  });
  cnv.addEventListener('webglcontextrestored', function () { if (this === cnv) lost = false; });
  return true;
}
function setup() {
  var vs = compile(gl.VERTEX_SHADER, VS), fs = compile(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) { if (!gl.isContextLost()) failed = true; return false; }
  prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    if (!gl.isContextLost()) { console.warn('Trunks: link', gl.getProgramInfoLog(prog)); failed = true; }
    return false;
  }
  U = {};
  var nu = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS);
  for (var i = 0; i < nu; i++) { var name = gl.getActiveUniform(prog, i).name; U[name.replace(/\[0\]$/, '')] = gl.getUniformLocation(prog, name); }
  vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  vbo = gl.createBuffer(); ibo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
  var st = FL * 4;
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, st, 0);
  gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, st, 12);
  gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 2, gl.FLOAT, false, st, 24);
  gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 4, gl.FLOAT, false, st, 32);
  gl.bindVertexArray(null);
  ready = true;
  return true;
}
function init() {
  if (failed || !create()) return false;
  if (lost && renewals < 3 && performance.now() - lostAt > 8000) { renewals++; cnv = null; gl = null; lost = false; ready = false; if (!create()) return false; }
  if (lost || gl.isContextLost()) return false;
  return ready || setup();
}
function state() { return failed ? 'none' : (lost || (gl && gl.isContextLost())) ? 'lost' : 'ok'; }

function c3(c) { return [c[0] / 255, c[1] / 255, c[2] / 255]; }
function draw(o) {
  makeTubes(o);
  nv = 0; ni = 0;
  for (var t = 0; t < tubes.length; t++) meshTube(tubes[t], o);
  forkBalls(o);
  if (!init() || !nv) return null;
  // Only the box round the tree is drawn (in device px of the picture), not the whole screen.
  var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (var q = 0; q < nv; q++) {
    var vx = vbuf[q * FL], vy = vbuf[q * FL + 1];
    if (vx < x0) x0 = vx; if (vx > x1) x1 = vx; if (vy < y0) y0 = vy; if (vy > y1) y1 = vy;
  }
  var px = o.px;
  var bx = clamp(Math.floor((x0 - 2) * px), 0, o.width), by = clamp(Math.floor((y0 - 2) * px), 0, o.height);
  var bw = clamp(Math.ceil((x1 + 2) * px), 0, o.width) - bx, bh = clamp(Math.ceil((y1 + 2) * px), 0, o.height) - by;
  if (bw < 1 || bh < 1) return null;
  // the canvas only grows, in steps (a new size each frame would be slow); the picture is its top-left corner
  if (cnv.width < bw || cnv.height < bh) {
    cnv.width = Math.max(cnv.width, Math.ceil(bw * 1.1 / 64) * 64);
    cnv.height = Math.max(cnv.height, Math.ceil(bh * 1.1 / 64) * 64);
  }
  gl.viewport(0, cnv.height - bh, bw, bh);
  gl.enable(gl.SCISSOR_TEST);
  gl.scissor(0, cnv.height - bh, bw, bh);
  gl.clearColor(0, 0, 0, 0);
  gl.clearDepth(1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.disable(gl.SCISSOR_TEST);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.disable(gl.CULL_FACE);
  gl.enable(gl.BLEND);                                // the soft outlines (premultiplied)
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.useProgram(prog);
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, vbuf.subarray(0, nv * FL), gl.DYNAMIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, ibuf.subarray(0, ni), gl.DYNAMIC_DRAW);
  var lk = o.look || {}, C = o.colours, Lt = o.light;
  gl.uniform2f(U.uScreen, bw / px, bh / px);
  gl.uniform2f(U.uOrigin, bx / px, by / px);
  gl.uniform3fv(U.uSunDir, Lt.dir);
  gl.uniform3fv(U.uSunCol, Lt.sun);
  gl.uniform3fv(U.uSkyCol, Lt.sky);
  gl.uniform3fv(U.uBounceCol, Lt.bounce);
  gl.uniform3fv(U.uLeafCol, Lt.leaf || Lt.sky);
  gl.uniform3fv(U.uAirCol, c3(Lt.air));
  gl.uniform3fv(U.uBark, c3(C.bark));
  gl.uniform3fv(U.uDark, c3(C.dark));
  gl.uniform3fv(U.uLight, c3(C.light));
  gl.uniform3fv(U.uLichen, c3(C.lichen));
  gl.uniform3fv(U.uMoss, c3(C.moss));
  gl.uniform1f(U.uRelief, d(lk, 'relief', 0.6));
  gl.uniform1f(U.uFiss, d(lk, 'fissures', 0.5));
  gl.uniform1f(U.uStreak, d(lk, 'streaks', 0.5));
  gl.uniform1f(U.uLichenAmt, d(lk, 'lichen', 0.35));
  gl.uniform1f(U.uMossAmt, d(lk, 'moss', 0.5));
  gl.uniform1f(U.uMossH, d(lk, 'mossHeight', 0.1) * o.H);
  gl.uniform1f(U.uGround, o.ground);
  gl.uniform1f(U.uWet, d(lk, 'wet', 0));
  gl.uniform1f(U.uRim, d(lk, 'rim', 0.45));
  gl.uniform1f(U.uCanopy, d(lk, 'canopyShade', 0.7));
  gl.uniform1f(U.uDapple, d(lk, 'komorebi', 0.6));
  gl.uniform1f(U.uCrotch, d(lk, 'crotch', 0.6));
  gl.uniform1f(U.uAir, d(lk, 'air', 0.1));
  gl.uniform1f(U.uTime, o.time || 0);
  gl.uniform1f(U.uWind, d(o, 'wind', 0.5));
  gl.uniform1f(U.uPx, o.px);
  gl.uniform4fv(U.uAO, aoBuf);
  gl.uniform1i(U.uAOn, aoN);
  gl.drawElements(gl.TRIANGLES, ni, gl.UNSIGNED_INT, 0);
  gl.bindVertexArray(null);
  if (gl.isContextLost()) return null;
  return { cnv: cnv, x: bx, y: by, w: bw, h: bh };
}
/* The last tree, flat, when it can't be drawn on the graphics chip. */
function flat(c, colour) {
  c.fillStyle = colour;
  for (var t = 0; t < tubes.length; t++) {
    var T = tubes[t], n = T.x.length, k;
    if (n < 2) continue;
    c.beginPath();
    for (k = 0; k < n; k++) {
      var a = Math.max(k - 1, 0), b = Math.min(k + 1, n - 1), dx = T.x[b] - T.x[a], dy = T.y[b] - T.y[a], l = Math.hypot(dx, dy) || 1;
      c.lineTo(T.x[k] - dy / l * T.r[k], T.y[k] + dx / l * T.r[k]);
    }
    for (k = n - 1; k >= 0; k--) {
      var a2 = Math.max(k - 1, 0), b2 = Math.min(k + 1, n - 1), ex = T.x[b2] - T.x[a2], ey = T.y[b2] - T.y[a2], l2 = Math.hypot(ex, ey) || 1;
      c.lineTo(T.x[k] + ey / l2 * T.r[k], T.y[k] - ex / l2 * T.r[k]);
    }
    c.closePath();
    c.fill();
  }
}

return { build: build, draw: draw, flat: flat, axisAt: axisAt, state: state };
})();
