/* ============================================================
   koi.js — the koi on the start button, drawn from code (no image).

   Moved from the test bed koi.html (style B, 錦・自由に, swimming
   as in a pool). koi.html stays the place to tune them; move its
   "Copy values" into KOI_LOOK in app.js.

   Each koi has a spine of 24 points laid along the path its head
   swims, with a travelling wave down the body; the body can bend
   only so tightly and keeps its length, so it never folds. A kohaku
   and a gold ogon swim the pond like real koi: a few tail beats then
   a glide, up to the ring and back, round each other. Each decides
   for itself to dive (swims down, swims about at a depth of its own,
   comes back up: smaller, blurrier and fainter the deeper it is) or
   to come up for air (only one at the surface at a time; mouth opens,
   rings on the water). Touching a koi makes it dart off; on swipe up
   both swim forward and down and fade away.

   The canvas is 240px across, larger than the pond inside the ring
   (174px), so nothing near the edge is cut off square; the shadow on
   the pond floor stops at the ring's inner edge.

   Use:
     var pond = KoiPond.create(canvas, settings, isShown);
     pond.start()                  run (stops by itself when isShown() is false)
     pond.reset()                  new koi, swimming as at the start
     pond.hit(clientX, clientY)    true when a koi is under that point
     pond.startle(clientX, clientY) the koi nearest that point darts off
     pond.leave()                  swipe up: both swim down and away
   ============================================================ */
(function () {
  'use strict';

  /* ============================================================
     2. SMALL HELPERS
     ============================================================ */
  var TAU = Math.PI * 2;
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function angDiff(a, b) { var d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; }
  function rng(seed) { var s = seed >>> 0 || 1; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

  /* Body half-width along the fish, x = 0 nose … 1 tail root. Blunt
     rounded head, widest at about a quarter, tapering to a slim
     tail root, as a koi seen from above. */
  function bodyW(x) {
    if (x <= 0) return 0;
    if (x < 0.27) return 0.5 + 0.5 * Math.sin(Math.PI / 2 * x / 0.27);
    if (x < 0.88) return 0.2 + 0.8 * (Math.cos(Math.PI * (x - 0.27) / 0.61) + 1) / 2;
    return 0.2 - 0.04 * (x - 0.88) / 0.12;
  }

  /* Smooth closed curve through points (midpoint quadratic splines). */
  function smoothClosed(ctx, pts) {
    var n = pts.length, a = pts[n - 1], b = pts[0];
    ctx.moveTo((a.x + b.x) / 2, (a.y + b.y) / 2);
    for (var i = 0; i < n; i++) {
      var p = pts[i], q = pts[(i + 1) % n];
      ctx.quadraticCurveTo(p.x, p.y, (p.x + q.x) / 2, (p.y + q.y) / 2);
    }
    ctx.closePath();
  }
  function smoothOpen(ctx, pts) {
    ctx.moveTo(pts[0].x, pts[0].y);
    for (var i = 1; i < pts.length - 1; i++) {
      var p = pts[i], q = pts[i + 1];
      ctx.quadraticCurveTo(p.x, p.y, (p.x + q.x) / 2, (p.y + q.y) / 2);
    }
    var l = pts[pts.length - 1]; ctx.lineTo(l.x, l.y);
  }

  /* ============================================================
     3. ONE KOI
     The head swims along a path; the body is laid along the trail
     the head has left (so it bends into turns like a real fish),
     then a travelling wave is added that grows toward the tail.
     ============================================================ */
  var N = 24;

  function Koi(pond, idx, seed) {
    this.pond = pond; this.idx = idx;
    this.r = rng(seed);
    this.trail = [];        // head positions, newest last
    this.phase = this.r() * TAU;
    this.finPhase = this.r() * TAU;
    this.heading = this.r() * TAU;
    this.burst = 0;         // startle: extra speed, decays
    this.turnKick = 0;
    this.n1 = this.r() * 100; this.n2 = this.r() * 100; this.n3 = this.r() * 100;
    this.P = []; this.T = []; this.Nn = []; this.W = [];
    for (var i = 0; i < N; i++) { this.P.push({ x: 0, y: 0 }); this.T.push({ x: 1, y: 0 }); this.Nn.push({ x: 0, y: 1 }); this.W.push(0); }
    this.patches = [];
    this.wake = [];
    // pool swimming
    this.v = 0; this.kick = this.r() < 0.5; this.gaitT = this.r(); this.beat = 1;
    this.wTurn = 0; this.pref = this.r() < 0.5 ? -1 : 1;
    this.z = 0.2; this.zv = 0; this.zHome = 0.12 + this.r() * 0.18; this.zT = this.zHome;
    this.mode = 'cruise'; this.modeT = 0; this.gulps = 0; this.mouth = 0; this.wrig = 0;
  }

  Koi.prototype.reset = function () {
    this.trail.length = 0;
    var p = this.pond, s = p.s;
    this.theta = this.idx / p.fish.length * TAU;
    var R = s.wanderSpread * p.R;
    this.x = Math.cos(this.theta) * R * 0.5; this.y = Math.sin(this.theta) * R * 0.5;
    this.heading = this.theta + Math.PI / 2;
    if (s.path === 'pool') {
      this.heading = this.theta + (this.r() - 0.5) * 2;
      this.v = p.L * 0.3; this.z = this.zT = this.zHome; this.mode = 'cruise';
    }
  };

  Koi.prototype.step = function (dt, t) {
    var p = this.pond, s = p.s, L = p.L;
    var boost = 1 + 2.4 * this.burst;
    this.burst = Math.max(0, this.burst - dt * 1.3);
    var hx, hy;
    if (s.path === 'orbit') {
      // even chase around the circle, the radius breathing a little
      var R = s.orbit * p.R;
      var w = TAU / 12 * s.speed;
      this.theta += w * dt * boost;
      var rr = R * (1 + 0.05 * Math.sin(t * 0.7 + this.n1) + 0.03 * Math.sin(t * 1.9 + this.n2));
      hx = Math.cos(this.theta) * rr; hy = Math.sin(this.theta) * rr;
    } else if (s.path === 'pool') {
      this.stepPool(dt, boost);
      hx = this.x; hy = this.y;
    } else {
      // free swim: a wandering heading, steered back from the pond edge
      // and gently away from the other koi
      var lim = s.wanderSpread * p.R;
      var d = Math.hypot(this.x, this.y);
      var turn = 0.55 * Math.sin(t * 0.31 + this.n1) + 0.35 * Math.sin(t * 0.73 + this.n2) + 0.2 * Math.sin(t * 1.37 + this.n3);
      var home = Math.atan2(-this.y, -this.x);
      var edge = clamp((d - lim * 0.55) / (lim * 0.45), 0, 1);
      turn = turn * (1 - edge * 0.7) + angDiff(this.heading, home) * edge * 2.2;
      for (var j = 0; j < p.fish.length; j++) {
        var o = p.fish[j]; if (o === this) continue;
        var dx = this.x - o.x, dy = this.y - o.y, dd = Math.hypot(dx, dy);
        if (dd < L * 0.7 && dd > 0.01) turn += angDiff(this.heading, Math.atan2(dy, dx)) * (1 - dd / (L * 0.7)) * 0.9;
      }
      turn += this.turnKick; this.turnKick *= Math.pow(0.02, dt);
      this.heading += clamp(turn, -2.4, 2.4) * dt * (0.8 + 0.4 * s.speed);
      var v = L * 0.42 * s.speed * (0.85 + 0.25 * Math.sin(t * 0.5 + this.n3)) * boost;
      this.x += Math.cos(this.heading) * v * dt; this.y += Math.sin(this.heading) * v * dt;
      hx = this.x; hy = this.y;
    }
    if (s.path === 'orbit') { this.x = hx; this.y = hy; }
    // tail beat: faster when the koi goes faster (the pool sets its own)
    if (s.path !== 'pool') {
      this.phase += dt * TAU * (0.75 + 0.5 * s.speed) * (1 + 1.3 * this.burst);
      this.finPhase += dt * TAU * 0.45 * (1 + this.burst);
    }
    // the newest point is the live head; a new point is fixed each
    // time the head has moved a little way past the one before it
    var tr = this.trail, n = tr.length;
    if (n < 2) { tr.push({ x: hx, y: hy }); if (n === 0) tr.push({ x: hx, y: hy }); }
    else {
      var prev = tr[n - 2];
      tr[n - 1].x = hx; tr[n - 1].y = hy;
      if (Math.hypot(hx - prev.x, hy - prev.y) > L * 0.012) tr.push({ x: hx, y: hy });
    }
    // keep just over one body length of trail
    var need = L * 1.25, acc = 0;
    for (var k = tr.length - 1; k > 0; k--) {
      acc += Math.hypot(tr[k].x - tr[k - 1].x, tr[k].y - tr[k - 1].y);
      if (acc > need) { if (k > 1) tr.splice(0, k - 1); break; }
    }
  };

  /* ------------------------------------------------------------
     POOL SWIMMING (style B)
     Like real koi: a few tail beats, then a glide; a slow wander in
     heading; they look ahead and turn back along the pool's edge, and
     steer round the other koi (looking ahead at where they will be).
     Each has its own depth: it cruises just under the surface, and now
     and then one dives (smaller, blurred, fainter) or comes up to the
     surface for air (gulps, with rings on the water), then returns.
     ------------------------------------------------------------ */
  // steering constants for the pool (tuned with the overlap checks)
  var TUNE = { la0: 0.3, la1: 0.5, wall: 0.85, wallGain: 7, avoid: 6, clear: 0.3, bump: 0.35,
               backAt: 0.8, backSpread: 1.0, backRate: 2.2, yield: 0.35,
               turnR: 0.6,     // smallest turning circle of the head (× length)
               turnEase: 4,    // how quickly a turn builds and eases off
               bendR: 0.55,    // tightest bend of the body near the head (× length); the tail may bend twice as tight
               pitch: 1.1,     // how much a koi tilts nose-down / nose-up when it changes depth
               exitV: 0.8 };   // swimming speed when it swims away (× length per second)
  // how far apart two koi are in depth, counting the depth each is
  // heading for (so one coming back up already counts as at that depth)
  function depthGap(a, b) {
    return Math.min(Math.abs(a.z - b.z), Math.abs(a.zT - b.z), Math.abs(a.z - b.zT));
  }
  function gauss(r) { return (r() + r() + r() + r() - 2) * 1.7; }

  Koi.prototype.stepPool = function (dt, boost) {
    var p = this.pond, s = p.s, L = p.L, r = this.r;
    var lim = s.wanderSpread * p.R;
    // gait: kick (a few strong beats) then glide
    this.gaitT -= dt;
    if (this.gaitT <= 0) {
      this.kick = !this.kick;
      this.gaitT = this.kick ? 0.5 + r() * 0.7 : 0.7 + r() * 1.8;
    }
    // swimming down (swipe up, or the way down in a dive): strong tail
    // beats, swimming forward at a good pace
    var leaving = (this.mode === 'exit' && this.exitT >= 0) || (this.mode === 'dive' && this.diveDown);
    if (leaving) { this.kick = true; this.gaitT = 1; }
    var modeV = this.mode === 'air' ? 0.55 : 1;
    var vT = leaving ? L * TUNE.exitV * (0.7 + 0.3 * s.speed)
                     : L * (this.kick ? 0.5 : 0.22) * s.speed * modeV + L * 1.3 * this.burst;
    this.v += (vT - this.v) * (this.kick || this.burst > 0 ? 2.2 : 0.7) * dt;
    this.beat += ((this.kick || this.burst > 0.05 ? 1 : 0.35) - this.beat) * 3 * dt;

    // slow, smooth wander of the heading
    this.wTurn += -this.wTurn * 0.9 * dt + gauss(r) * 1.1 * Math.sqrt(dt);
    var turn = this.wTurn * 0.55;
    var hx = Math.cos(this.heading), hy = Math.sin(this.heading);

    // the pool's edge: look ahead; if that point is past the edge, turn
    // away from the wall (the way the koi is already angled), harder the
    // closer it gets, so it swims up to the edge and turns back
    var la = L * TUNE.la0 + this.v * TUNE.la1;
    var fx = this.x + hx * la, fy = this.y + hy * la, fd = Math.hypot(fx, fy);
    var wall = lim * TUNE.wall;
    var out = Math.atan2(this.y, this.x);
    if (fd > wall) {
      var d = angDiff(out, this.heading);
      var sg = Math.abs(d) > 0.08 ? (d > 0 ? 1 : -1) : this.pref;
      turn += sg * (1.6 + TUNE.wallGain * (fd - wall) / la);
      // at the edge it decides on a way back across the pool, a little
      // different each time, and keeps turning until it faces that way
      if (this.turnTo === undefined && Math.hypot(this.x, this.y) > lim * TUNE.backAt)
        this.turnTo = out + Math.PI + (r() - 0.5) * TUNE.backSpread;
    }
    if (this.turnTo !== undefined) {
      var td = angDiff(this.heading, this.turnTo);
      turn += clamp(td * 2.4, -TUNE.backRate, TUNE.backRate);
      if (Math.abs(td) < 0.3) this.turnTo = undefined;
    }

    // the other koi: steer round where they are and where they are going
    var clear = L * (0.3 * s.girth + TUNE.clear), slow = 0;
    var probes = [0, 0.35, 0.7, 1.05];
    for (var j = 0; j < p.fish.length; j++) {
      var o = p.fish[j]; if (o === this) continue;
      var wz = 1 - clamp((depthGap(this, o) - 0.35) / 0.4, 0, 1) * 0.75; // one far below: less need
      var tr = o.trail;
      for (var q = tr.length - 1; q >= 0; q -= 8) {
        var pt = tr[q];
        var dx2 = pt.x - this.x, dy2 = pt.y - this.y;
        var rel = angDiff(this.heading, Math.atan2(dy2, dx2));
        if (Math.abs(rel) > 2.0) continue;          // behind me: not my problem
        for (var pi = 0; pi < probes.length; pi++) {
          var ax = this.x + hx * la * probes[pi], ay = this.y + hy * la * probes[pi];
          var near = Math.hypot(pt.x - ax, pt.y - ay);
          if (near < clear) {
            var push = (1 - near / clear) * (TUNE.avoid - pi * 0.8) * wz;
            turn += (rel > 0 ? -1 : 1) * push;
            if (Math.abs(rel) < 0.9) slow = Math.max(slow, push * TUNE.yield);
          }
        }
      }
    }
    this.v *= 1 - clamp(slow, 0, 0.8) * dt * 4;

    turn += this.turnKick; this.turnKick *= Math.pow(0.02, dt);
    // a koi can only turn so tightly for its speed (its turning circle),
    // and it eases into and out of each turn; when it needs to turn
    // harder than that, it gives a tail kick, as koi do
    var maxTurn = Math.max(this.v, L * 0.15) / (L * TUNE.turnR);
    if (Math.abs(turn) > maxTurn * 0.8 && !this.kick) { this.kick = true; this.gaitT = 0.4 + r() * 0.3; }
    this.omega = (this.omega || 0) + (clamp(turn, -maxTurn, maxTurn) - (this.omega || 0)) * Math.min(1, TUNE.turnEase * dt);
    this.heading += this.omega * dt;
    this.x += Math.cos(this.heading) * this.v * dt;
    this.y += Math.sin(this.heading) * this.v * dt;
    // a soft bump: if the head is touching another koi at about the same
    // depth, it is nudged off (and turns away), as koi slide past each other
    var headR = L * 0.14 * s.girth;
    for (j = 0; j < p.fish.length; j++) {
      o = p.fish[j]; if (o === this || depthGap(this, o) > 0.4) continue;
      tr = o.trail;
      var n = tr.length;
      for (q = n - 1; q >= 0; q -= 4) {
        var along = (n - 1 - q) / Math.max(1, n - 1) * 1.25;   // 0 head … 1 tail root
        var touch = headR * 0.9 + L * 0.14 * s.girth * bodyW(clamp(along, 0.05, 1));
        var ex = this.x - tr[q].x, ey = this.y - tr[q].y, ed = Math.hypot(ex, ey);
        if (ed < touch && ed > 0.001) {
          // nudged sideways only (never pushed back into its own body)
          var k2 = (touch - ed) * TUNE.bump;
          var nx2 = -Math.sin(this.heading), ny2 = Math.cos(this.heading);
          var side = (ex * nx2 + ey * ny2) / ed;
          this.x += nx2 * side * k2; this.y += ny2 * side * k2;
        }
      }
    }
    var dc = Math.hypot(this.x, this.y);
    if (dc > lim) { this.x *= lim / dc; this.y *= lim / dc; }

    // depth: a soft spring toward the depth it wants
    this.modeT -= dt;
    if (this.mode === 'dive') {
      // swims about down there, its depth drifting a little, then comes up
      this.diveT = (this.diveT || 0) + dt;
      this.zT = this.deepZ + 0.07 * Math.sin(this.diveT * 0.7 + this.n2);
      this.diveDown = this.diveDown && this.z < this.zHome + (this.deepZ - this.zHome) * 0.8;   // once down, it stays down
      // strong beats on the way down, easing off once it is there
      this.wrig += ((this.diveDown ? 0.45 : 0) - (this.wrig || 0)) * Math.min(1, 3 * dt);
      if (this.modeT <= 0) { this.mode = 'cruise'; this.zT = this.zHome; this.diveDown = false; }
    } else if (this.mode !== 'exit' && this.wrig) {
      this.wrig = Math.max(0, this.wrig - 3 * dt);
    }
    if (this.mode === 'air') {
      if (this.z < -0.06 && this.gulps > 0 && this.modeT <= 0) {
        this.gulps--; this.modeT = 0.55 + r() * 0.35; this.gulpT = 0;
        var m = this.at(0, 0); p.rings.push({ x: m.x, y: m.y, t: 0 });
      }
      if (this.gulps === 0 && this.modeT <= 0) { this.mode = 'cruise'; this.zT = this.zHome; }
    }
    if (this.mode === 'exit') {
      this.exitT += dt;
      // swims away: strong tail beats, forward and down, then out of sight
      if (this.exitT >= 0) {
        this.wrig = 0.45;
        this.zT = 1.6;
        if (!this.exitTurned) { this.exitTurned = true; this.turnKick = (r() < 0.5 ? -1 : 1) * (0.4 + r() * 0.4); }
      }
    }
    if (this.gulpT !== undefined) { this.gulpT += dt; this.mouth = Math.max(0, Math.sin(Math.min(1, this.gulpT / 0.45) * Math.PI)); }
    var leavingDown = (this.mode === 'exit' && this.exitT >= 0) || (this.mode === 'dive' && this.diveDown);
    var zk = leavingDown ? 3.2 : 2.4, zc = leavingDown ? 2.6 : 2.9;
    this.zv += ((this.zT - this.z) * zk - this.zv * zc) * dt;
    this.z += this.zv * dt;

    // tail beats: faster in a kick, slow in a glide (and fast in a wriggle)
    this.phase += dt * TAU * (0.55 + 1.1 * this.beat * s.speed) * (1 + 1.2 * this.burst) * (1 + 1.6 * (this.wrig || 0));
    this.finPhase += dt * TAU * (0.3 + 0.35 * (1 - this.beat)) * (1 + this.burst);
  };

  // swipe up: a hard wriggle on the spot, then down and away
  Koi.prototype.exitDive = function (delay) {
    this.mode = 'exit'; this.exitT = -delay; this.wrig = 0; this.exitTurned = false;
  };
  Koi.prototype.startMode = function (mode) {
    var r = this.r;
    this.mode = mode;
    if (mode === 'dive') {
      // a different depth each time: anywhere from just under the
      // surface to the deepest, and clearly apart from its last dive
      // and, if other koi are down too, apart from their depths
      var lo = this.zHome + 0.2, hi = 0.98, me = this, dz, best = null, bestGap = -1;
      var avoid = this.pond.fish.filter(function (o) { return o !== me && o.mode === 'dive'; }).map(function (o) { return o.deepZ; });
      if (this.lastDeep !== undefined) avoid.push(this.lastDeep);
      for (var t = 0; t < 12; t++) {
        dz = lo + r() * (hi - lo);
        var gap = avoid.reduce(function (g, a) { return Math.min(g, Math.abs(dz - a)); }, 9);
        if (gap >= 0.2) { best = dz; break; }
        if (gap > bestGap) { bestGap = gap; best = dz; }   // crowded: the best spread found
      }
      dz = best;
      this.deepZ = this.lastDeep = dz; this.zT = this.deepZ; this.diveT = 0; this.diveDown = true; this.wrig = this.wrig || 0;
      this.turnKick = (r() < 0.5 ? -1 : 1) * (0.4 + r() * 0.4);   // a gentle curve as it heads down
      this.modeT = this.pond.s.deepTime * (0.7 + r() * 0.6) + 2;   // + the time to get down
    }
    else { this.zT = -0.12; this.gulps = 2 + Math.floor(r() * 2); this.modeT = 1.6; }
  };

  /* Lay the spine along the trail and add the swimming wave. */
  Koi.prototype.build = function () {
    var p = this.pond, s = p.s, L = p.L, tr = this.trail, P = this.P;
    var seg = L / (N - 1), k = tr.length - 1, want = 0, acc = 0;
    var pool = s.path === 'pool';
    if (pool) {
      // tilting nose-down (or up) as it changes depth: seen from above,
      // the body looks shorter
      var pitch = clamp((this.zv || 0) * TUNE.pitch, -0.7, 0.9);
      seg *= Math.cos(pitch);
    }
    var a = tr[k];
    P[0].x = a.x; P[0].y = a.y;
    var i = 1;
    while (i < N) {
      want = i * seg;
      if (k <= 0) { // ran out: continue straight
        var px = P[i - 1], pq = P[Math.max(0, i - 2)];
        var dx = px.x - pq.x, dy = px.y - pq.y, dl = Math.hypot(dx, dy) || 1;
        P[i].x = px.x + dx / dl * seg; P[i].y = px.y + dy / dl * seg; i++; continue;
      }
      var b = tr[k - 1], d = Math.hypot(a.x - b.x, a.y - b.y);
      if (acc + d >= want) {
        var f = d > 0 ? (want - acc) / d : 0;
        P[i].x = lerp(a.x, b.x, f); P[i].y = lerp(a.y, b.y, f); i++;
      } else { acc += d; k--; a = b; }
    }
    // normals of the plain spine, then the wave along them
    var amp = L * 0.055 * s.wave * (1 + 0.6 * this.burst) * (s.path === 'pool' ? (0.45 + 0.55 * this.beat) * (1 + 1.1 * (this.wrig || 0)) : 1);
    var tmp = this._tmp || (this._tmp = []);
    for (i = 0; i < N; i++) {
      var i0 = Math.max(0, i - 1), i1 = Math.min(N - 1, i + 1);
      var tx = P[i1].x - P[i0].x, ty = P[i1].y - P[i0].y, tl = Math.hypot(tx, ty) || 1;
      var x = i / (N - 1);
      var A = amp * (0.12 + 0.88 * x * x);
      var off = A * Math.sin(this.phase - x * TAU * 0.95);
      tmp[i] = { x: P[i].x - ty / tl * off, y: P[i].y + tx / tl * off };
    }
    for (i = 0; i < N; i++) { P[i].x = tmp[i].x; P[i].y = tmp[i].y; }
    if (pool) {
      // the body can bend only so tightly (tighter toward the tail) and
      // keeps its length: whatever the path did, it never folds or kinks
      var prevA = Math.atan2(P[1].y - P[0].y, P[1].x - P[0].x);
      for (i = 1; i < N; i++) {
        var aA = Math.atan2(P[i].y - P[i - 1].y, P[i].x - P[i - 1].x);
        var lim2 = seg / (L * TUNE.bendR) * (1 + i / (N - 1));
        var dA = angDiff(prevA, aA);
        if (i > 1) aA = prevA + clamp(dA, -lim2, lim2);
        P[i].x = P[i - 1].x + Math.cos(aA) * seg; P[i].y = P[i - 1].y + Math.sin(aA) * seg;
        prevA = aA;
      }
    }
    for (i = 0; i < N; i++) {
      var j0 = Math.max(0, i - 1), j1 = Math.min(N - 1, i + 1);
      var ux = P[j1].x - P[j0].x, uy = P[j1].y - P[j0].y, ul = Math.hypot(ux, uy) || 1;
      this.T[i].x = ux / ul; this.T[i].y = uy / ul;        // points toward the tail
      this.Nn[i].x = -uy / ul; this.Nn[i].y = ux / ul;      // left side
      this.W[i] = bodyW(i / (N - 1)) * L * 0.14 * s.girth;
    }
  };

  /* A point on the body: x along (0 nose, 1 tail root), y across (-1..1). */
  Koi.prototype.at = function (x, y) {
    var f = clamp(x, 0, 1) * (N - 1), i = Math.min(N - 2, Math.floor(f)), t = f - i;
    var P = this.P, Nn = this.Nn;
    var cx = lerp(P[i].x, P[i + 1].x, t), cy = lerp(P[i].y, P[i + 1].y, t);
    var nx = lerp(Nn[i].x, Nn[i + 1].x, t), ny = lerp(Nn[i].y, Nn[i + 1].y, t);
    var w = bodyW(clamp(x, 0.02, 1)) * this.pond.L * 0.14 * this.pond.s.girth;
    return { x: cx + nx * y * w, y: cy + ny * y * w };
  };

  Koi.prototype.outline = function () {
    var P = this.P, Nn = this.Nn, W = this.W, pts = [];
    pts.push({ x: P[0].x - this.T[0].x * W[1] * 0.25, y: P[0].y - this.T[0].y * W[1] * 0.25 });
    for (var i = 1; i < N; i++) pts.push({ x: P[i].x + Nn[i].x * W[i], y: P[i].y + Nn[i].y * W[i] });
    for (i = N - 1; i >= 1; i--) pts.push({ x: P[i].x - Nn[i].x * W[i], y: P[i].y - Nn[i].y * W[i] });
    return pts;
  };

  /* Pectoral (front) and pelvic fins: paddle in and out. */
  Koi.prototype.fin = function (x, side, len, spread, flap) {
    var L = this.pond.L, f = clamp(x, 0, 1) * (N - 1), i = Math.round(f);
    var P = this.P[i], T = this.T[i], Nn = this.Nn[i], w = this.W[i];
    var rx = P.x + Nn.x * side * w * 0.8, ry = P.y + Nn.y * side * w * 0.8;
    var a = spread + flap;
    var dx = T.x * Math.cos(a) + Nn.x * side * Math.sin(a), dy = T.y * Math.cos(a) + Nn.y * side * Math.sin(a);
    var l = len * L;
    function rot(ang) { var c = Math.cos(ang), s = Math.sin(ang) * side; return { x: dx * c - dy * s, y: dx * s + dy * c }; }
    var e1 = rot(-0.38), e2 = rot(0.42), m = rot(0.02);
    return {
      root: { x: rx, y: ry },
      a: { x: rx + e1.x * l, y: ry + e1.y * l },
      b: { x: rx + e2.x * l * 0.9, y: ry + e2.y * l * 0.9 },
      tip: { x: rx + m.x * l * 1.22, y: ry + m.y * l * 1.22 },
      rays: [rot(-0.3), rot(-0.1), rot(0.1), rot(0.3)].map(function (r) { return { x: rx + r.x * l * 1.05, y: ry + r.y * l * 1.05 }; })
    };
  };
  function finPath(ctx, F) {
    ctx.moveTo(F.root.x, F.root.y);
    ctx.quadraticCurveTo((F.root.x + F.a.x) / 2 + (F.a.x - F.b.x) * 0.15, (F.root.y + F.a.y) / 2 + (F.a.y - F.b.y) * 0.15, F.a.x, F.a.y);
    ctx.quadraticCurveTo(F.tip.x, F.tip.y, F.b.x, F.b.y);
    ctx.quadraticCurveTo((F.root.x + F.b.x) / 2, (F.root.y + F.b.y) / 2, F.root.x, F.root.y);
  }

  /* Tail fin: a soft two-lobed fan that trails and flutters. */
  Koi.prototype.tail = function () {
    var s = this.pond.s, L = this.pond.L, e = N - 1;
    var P = this.P[e], T = this.T[e], Nn = this.Nn[e];
    var flick = 0.35 * s.fins * Math.sin(this.phase - TAU * 1.05) * (1 + 0.5 * this.burst);
    var lag = 0.25 * s.fins * Math.sin(this.phase - TAU * 1.25);
    function dir(a) { return { x: T.x * Math.cos(a) + Nn.x * Math.sin(a), y: T.y * Math.cos(a) + Nn.y * Math.sin(a) }; }
    var tl = L * 0.36, bw = this.W[e] * 1.1;
    var spread = 0.5 + 0.08 * Math.sin(this.finPhase * 1.3);
    var d1 = dir(flick + lag + spread), d2 = dir(flick + lag - spread), d0 = dir(flick), dm = dir(flick + lag * 1.4);
    var bl = { x: P.x + Nn.x * bw, y: P.y + Nn.y * bw }, br = { x: P.x - Nn.x * bw, y: P.y - Nn.y * bw };
    var t1 = { x: P.x + d1.x * tl, y: P.y + d1.y * tl }, t2 = { x: P.x + d2.x * tl, y: P.y + d2.y * tl };
    var notch = { x: P.x + dm.x * tl * 0.62, y: P.y + dm.y * tl * 0.62 };
    var c1 = { x: P.x + dir(flick + lag * 0.5 + spread * 0.55).x * tl * 0.75, y: P.y + dir(flick + lag * 0.5 + spread * 0.55).y * tl * 0.75 };
    var c2 = { x: P.x + dir(flick + lag * 0.5 - spread * 0.55).x * tl * 0.75, y: P.y + dir(flick + lag * 0.5 - spread * 0.55).y * tl * 0.75 };
    var rays = [];
    for (var r = -2; r <= 2; r++) {
      var dd = dir(flick + lag * (0.6 + Math.abs(r) * 0.15) + spread * r / 2.2);
      rays.push({ x: P.x + dd.x * tl * (0.82 - 0.12 * (r === 0)), y: P.y + dd.y * tl * (0.82 - 0.12 * (r === 0)) });
    }
    return { base: P, bl: bl, br: br, t1: t1, t2: t2, notch: notch, c1: c1, c2: c2, d0: d0, rays: rays };
  };
  function tailPath(ctx, F) {
    ctx.moveTo(F.bl.x, F.bl.y);
    ctx.quadraticCurveTo(F.c1.x, F.c1.y, F.t1.x, F.t1.y);
    ctx.quadraticCurveTo((F.t1.x + F.notch.x) / 2 + (F.notch.x - F.base.x) * 0.12, (F.t1.y + F.notch.y) / 2 + (F.notch.y - F.base.y) * 0.12, F.notch.x, F.notch.y);
    ctx.quadraticCurveTo((F.t2.x + F.notch.x) / 2 + (F.notch.x - F.base.x) * 0.12, (F.t2.y + F.notch.y) / 2 + (F.notch.y - F.base.y) * 0.12, F.t2.x, F.t2.y);
    ctx.quadraticCurveTo(F.c2.x, F.c2.y, F.br.x, F.br.y);
    ctx.closePath();
  }

  /* Colour patches, in body space, with uneven organic edges. */
  function makePatch(r, x, y, rx, ry, color) {
    var pts = [], n = 14;
    for (var i = 0; i < n; i++) {
      var a = i / n * TAU, j = 0.78 + r() * 0.4;
      pts.push({ x: x + Math.cos(a) * rx * j, y: y + Math.sin(a) * ry * j });
    }
    return { pts: pts, color: color };
  }

  /* ============================================================
     4. LOOKS
     ============================================================ */
  var LOOKS = {};

  // B — a kohaku (white with red) and a gold ogon (metallic, scaled).
  LOOKS.nishiki = {
    setup: function (k) {
      var r = k.r;
      if (k.idx % 2 === 0) {
        k.body = '#FFF8F1';
        k.patches = [
          makePatch(r, 0.12, 0.05, 0.13, 0.75, '#E04A2C'),
          makePatch(r, 0.42, -0.25, 0.14, 0.75, '#DD4428'),
          makePatch(r, 0.66, 0.35, 0.1, 0.6, '#E0502E')
        ];
        k.back = 'rgba(255, 255, 255, 0.0)';
        k.finCol = 'rgba(255, 250, 244, 0.78)';
        k.finRay = 'rgba(214, 196, 186, 0.6)';
        k.finEdge = 'rgba(190, 160, 150, 0.35)';
        k.eye = '#3A2A26'; k.edge = 'rgba(150, 120, 110, 0.35)'; k.rim = 'rgba(255,255,255,0.9)';
        k.scales = 'rgba(200, 160, 150, 0.22)';
      } else {
        k.body = '#F3B640';
        k.patches = [ makePatch(r, 0.5, 0, 0.5, 0.35, '#F8CC66') ];
        k.back = 'rgba(214, 140, 30, 0.35)';
        k.finCol = 'rgba(250, 214, 130, 0.78)';
        k.finRay = 'rgba(255, 246, 210, 0.85)';
        k.finEdge = 'rgba(205, 140, 40, 0.4)';
        k.eye = '#4A3010'; k.edge = 'rgba(170, 110, 20, 0.5)'; k.rim = 'rgba(255, 246, 214, 0.95)';
        k.scales = 'rgba(160, 96, 10, 0.32)';
        k.sheen = true;
      }
    },
    draw: drawSolidKoi
  };

  function drawSolidKoi(ctx, k, s) {
    var L = k.pond.L, out = k.outline(), tail = k.tail();
    var fl = 0.32 * s.fins;
    var fins = [
      k.fin(0.2, 1, 0.24, 0.95, fl * Math.sin(k.finPhase)),
      k.fin(0.2, -1, 0.24, 0.95, fl * Math.sin(k.finPhase + 0.6)),
      k.fin(0.52, 1, 0.13, 0.8, fl * 0.7 * Math.sin(k.finPhase + 1.3)),
      k.fin(0.52, -1, 0.13, 0.8, fl * 0.7 * Math.sin(k.finPhase + 1.9))
    ];
    // shadow on the pond floor
    if (s.shadow > 0) {
      ctx.save();
      if (s.path === 'pool') {
        // the shadow lies on the pond floor, so it ends at the ring's
        // inner edge (as if it slips under the ring); the circle is set
        // in pond space, whatever scale the koi is drawn at
        var pd = k.pond, m = ctx.getTransform();
        ctx.setTransform(pd.dpr, 0, 0, pd.dpr, pd.half * pd.dpr, pd.half * pd.dpr);
        ctx.beginPath(); ctx.arc(0, 0, pd.R, 0, TAU);
        ctx.setTransform(m);
        ctx.clip();
      }
      ctx.translate(L * 0.035 * s.shadow, L * 0.075 * s.shadow);
      ctx.filter = 'blur(' + (L * 0.035 * s.shadow).toFixed(1) + 'px)';
      ctx.fillStyle = 'rgba(176, 72, 22, ' + (0.16 + 0.04 * s.shadow).toFixed(3) + ')';
      ctx.beginPath(); smoothClosed(ctx, out); tailPath(ctx, tail);
      fins.forEach(function (F) { finPath(ctx, F); });
      ctx.fill();
      ctx.restore();
    }
    // fins and tail, under the body
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    fins.concat([null]).forEach(function (F) {
      ctx.beginPath();
      if (F) finPath(ctx, F); else tailPath(ctx, tail);
      ctx.fillStyle = k.finCol; ctx.fill();
      ctx.lineWidth = L * 0.008; ctx.strokeStyle = k.finEdge; ctx.stroke();
      ctx.beginPath();
      var root = F ? F.root : tail.base, rays = F ? F.rays : tail.rays;
      rays.forEach(function (p) { ctx.moveTo(root.x, root.y); ctx.lineTo(p.x, p.y); });
      ctx.lineWidth = L * 0.007; ctx.strokeStyle = k.finRay; ctx.stroke();
    });
    // body
    ctx.save();
    ctx.beginPath(); smoothClosed(ctx, out);
    ctx.fillStyle = k.body; ctx.fill();
    ctx.clip();
    k.patches.forEach(function (pt) {
      ctx.beginPath(); smoothClosed(ctx, pt.pts.map(function (q) { return k.at(q.x, q.y); }));
      ctx.fillStyle = pt.color; ctx.fill();
    });
    // a darker band down the back
    var spine = [];
    for (var i = 2; i < N - 1; i++) spine.push(k.P[i]);
    ctx.beginPath(); smoothOpen(ctx, spine);
    ctx.strokeStyle = k.back; ctx.lineWidth = L * 0.05; ctx.lineCap = 'round'; ctx.stroke();
    // scales
    if (k.scales) {
      ctx.strokeStyle = k.scales; ctx.lineWidth = L * 0.006;
      ctx.beginPath();
      for (var sx = 0.26, row = 0; sx < 0.9; sx += 0.055, row++) {
        for (var sy = -0.75 + (row % 2) * 0.25; sy <= 0.76; sy += 0.5) {
          var c = k.at(sx, sy), ii = Math.round(sx * (N - 1)), T = k.T[ii];
          var ang = Math.atan2(T.y, T.x), rr = L * 0.03 * bodyW(sx);
          ctx.moveTo(c.x + Math.cos(ang - 1.2) * rr, c.y + Math.sin(ang - 1.2) * rr);
          ctx.arc(c.x, c.y, rr, ang - 1.2, ang + 1.2);
        }
      }
      ctx.stroke();
    }
    // light along the top of the back, shade at the sides
    ctx.beginPath(); smoothOpen(ctx, spine);
    ctx.strokeStyle = k.sheen ? 'rgba(255, 250, 225, 0.55)' : 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = L * (k.sheen ? 0.04 : 0.025); ctx.stroke();
    ctx.beginPath(); smoothClosed(ctx, out);
    ctx.strokeStyle = k.edge; ctx.lineWidth = L * 0.05; ctx.stroke();
    ctx.restore();
    // rim
    ctx.beginPath(); smoothClosed(ctx, out);
    ctx.strokeStyle = k.rim; ctx.lineWidth = L * 0.01; ctx.stroke();
    // eyes
    drawEyes(ctx, k, k.eye, L * 0.022);
    // the mouth opening at the surface (coming up for air)
    if (k.mouth > 0.02) {
      var m = k.at(0.012, 0);
      ctx.beginPath(); ctx.arc(m.x, m.y, L * 0.032 * k.mouth, 0, TAU);
      ctx.fillStyle = 'rgba(70, 30, 26, ' + (0.75 * k.mouth).toFixed(3) + ')'; ctx.fill();
      ctx.lineWidth = L * 0.008; ctx.strokeStyle = 'rgba(255, 220, 205, ' + (0.8 * k.mouth).toFixed(3) + ')'; ctx.stroke();
    }
  }

  function drawEyes(ctx, k, color, rad) {
    ctx.fillStyle = color;
    [1, -1].forEach(function (sd) {
      var e = k.at(0.075, sd * 0.68);
      ctx.beginPath(); ctx.arc(e.x, e.y, rad, 0, TAU); ctx.fill();
    });
  }

  /* ============================================================
     5. THE POND (one canvas, its koi, its own loop)
     ============================================================ */
  var PAD = 240 / 174;   // canvas size ÷ pond size
  function Pond(canvas, settings) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d');
    this.s = settings;
    this.fish = []; this.t = 0; this.acc = 0; this.rings = []; this.eventT = 3;
    this.off = document.createElement('canvas'); this.offCtx = this.off.getContext('2d');
    this.resize(); this.rebuild();
  }
  Pond.prototype.resize = function () {
    var r = this.canvas.getBoundingClientRect();
    this.size = r.width || 174;
    var dpr = Math.min(3, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(this.size * dpr); this.canvas.height = Math.round(this.size * dpr);
    this.off.width = this.canvas.width; this.off.height = this.canvas.height;
    this.dpr = dpr;
    this.half = this.size / 2;          // canvas centre
    this.R = this.half / PAD;           // the pond's radius (inside the ring)
    this.L = this.R * (this.s.length || 0.9);
  };
  Pond.prototype.rebuild = function () {
    this.L = this.R * this.s.length;
    this.fish = [];
    for (var i = 0; i < (this.s.count || 2); i++) this.fish.push(new Koi(this, i, 1234 + i * 777));
    var look = LOOKS[this.s.look];
    this.fish.forEach(function (k) { look.setup(k); });
    this.fish.forEach(function (k) { k.reset(); });
    // warm up together, so the koi already have trails (and keep apart)
    this.rings = []; this.t = 0; this.eventT = 2 + Math.random() * 2;
    for (var w = 0; w < 500; w++) {
      this.t += 1 / 120;
      for (i = 0; i < this.fish.length; i++) this.fish[i].step(1 / 120, this.t);
    }
    this.rings = [];
  };

  /* Pool: now and then one koi (only one at a time) dives or comes up
     for air; the others stay at their own cruising depth. */
  Pond.prototype.events = function (dt) {
    var s = this.s;
    for (var i = this.rings.length - 1; i >= 0; i--) { this.rings[i].t += dt; if (this.rings[i].t > 1.6) this.rings.splice(i, 1); }
    if (!(s.eventEvery > 0) || this.leaving) return;
    // each koi decides for itself, so several can be down at once (each
    // at its own depth); only the surface is one at a time: a koi comes
    // up for air only while no other koi is up there or on its way
    var fish = this.fish, n = fish.length;
    for (var j = 0; j < n; j++) {
      var k = fish[j];
      if (k.mode !== 'cruise' || Math.abs(k.z - k.zHome) > 0.08) continue;
      if (k.restT === undefined) k.restT = s.eventEvery * n * (0.3 + Math.random() * 0.9);
      k.restT -= dt;
      if (k.restT > 0) continue;
      k.restT = s.eventEvery * n * (0.6 + Math.random() * 0.8);
      var surfaceTaken = fish.some(function (o) { return o !== k && (o.mode === 'air' || o.z < o.zHome - 0.03); });
      k.startMode(Math.random() < s.airShare && !surfaceTaken ? 'air' : 'dive');
    }
  };

  /* Pool: draw each koi at its own depth — deeper is smaller, blurrier
     and fainter; the deepest are drawn first, so nearer koi pass over. */
  Pond.prototype.drawPool = function (ctx, look, s) {
    var oc = this.offCtx, dpr = this.dpr, R = this.half, fish = this.fish.slice();
    fish.sort(function (a, b) { return b.z - a.z; });
    for (var i = 0; i < fish.length; i++) {
      // measured from the koi's own cruising depth: every koi that is
      // just cruising is drawn at full size, sharp and solid
      var k = fish[i], z = k.z;
      var gone = clamp((z - 1) / 0.5, 0, 1);       // past the deepest (swipe up): fading out
      var zd = clamp((z - k.zHome) / (1 - k.zHome), 0, 1) + gone * 0.5;
      if (gone >= 1) continue;
      var up = clamp((k.zHome - z) / (k.zHome + 0.12), 0, 1);
      var sc = up > 0 ? 1 + 0.05 * up : 1 - (1 - s.deepSize) * zd;
      var se = Object.create(s);
      se.shadow = s.shadow * (1 + 0.4 * up - 0.7 * zd);
      var c = k.P[9];
      if (zd < 0.01) {           // not diving: drawn straight onto the pond
        ctx.save();
        ctx.translate(c.x, c.y); ctx.scale(sc, sc); ctx.translate(-c.x, -c.y);
        look.draw(ctx, k, se);
        ctx.restore();
        continue;
      }
      // diving: drawn on its own layer, then laid down blurred and faded;
      // only the square around the koi is cleared and copied
      var half = this.L * 0.95, bx = Math.max(0, Math.floor((R + c.x - half) * dpr)), by = Math.max(0, Math.floor((R + c.y - half) * dpr));
      var bw = Math.min(this.off.width - bx, Math.ceil(half * 2 * dpr)), bh = Math.min(this.off.height - by, Math.ceil(half * 2 * dpr));
      if (bw <= 0 || bh <= 0) continue;
      oc.setTransform(1, 0, 0, 1, 0, 0);
      oc.clearRect(bx, by, bw, bh);
      oc.setTransform(dpr, 0, 0, dpr, 0, 0);
      oc.translate(R + c.x, R + c.y); oc.scale(sc, sc); oc.translate(-c.x, -c.y);
      oc.save(); look.draw(oc, k, se); oc.restore();
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      var blur = s.deepBlur * zd * dpr;
      if (blur > 0.15) ctx.filter = 'blur(' + blur.toFixed(2) + 'px)';
      ctx.globalAlpha = (1 - s.deepFade * Math.min(zd, 1)) * (1 - gone);
      ctx.drawImage(this.off, bx, by, bw, bh, bx, by, bw, bh);
      ctx.restore();
    }
    // rings on the water where a koi gulped air
    for (i = 0; i < this.rings.length; i++) {
      var g = this.rings[i];
      for (var j = 0; j < 2; j++) {
        var t = g.t - j * 0.28; if (t <= 0) continue;
        var f = t / 1.6, rad = this.L * (0.05 + 0.32 * (1 - Math.pow(1 - f, 2.2)));
        ctx.beginPath(); ctx.arc(g.x, g.y, rad, 0, TAU);
        ctx.lineWidth = this.L * 0.03 * (1 - f) + 0.4;
        ctx.strokeStyle = 'rgba(196, 96, 40, ' + (0.18 * (1 - f)).toFixed(3) + ')'; ctx.stroke();
        ctx.lineWidth = this.L * 0.016 * (1 - f) + 0.3;
        ctx.strokeStyle = 'rgba(255, 253, 249, ' + (0.9 * (1 - f)).toFixed(3) + ')'; ctx.stroke();
      }
    }
  };
  Pond.prototype.frame = function (dt) {
    var s = this.s, ctx = this.ctx, look = LOOKS[s.look];
    this.L = this.R * s.length;
    dt = Math.min(dt, 0.1);
    this.acc += dt;
    var steps = 0;
    while (this.acc >= 1 / 120 && steps < 16) {
      this.t += 1 / 120; this.acc -= 1 / 120; steps++;
      for (var i = 0; i < this.fish.length; i++) this.fish[i].step(1 / 120, this.t);
      if (s.path === 'pool') this.events(1 / 120);
    }
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.size, this.size);
    ctx.translate(this.half, this.half);
    for (i = 0; i < this.fish.length; i++) this.fish[i].build();
    if (s.path === 'pool') { this.drawPool(ctx, look, s); return; }
    for (i = 0; i < this.fish.length; i++) { ctx.save(); look.draw(ctx, this.fish[i], s); ctx.restore(); }
  };
  Pond.prototype.leave = function () {
    this.leaving = true;
    this.fish.forEach(function (k, i) { k.exitDive(i * 0.12); });
  };
  Pond.prototype.startle = function (px, py) {
    var best = null, bd = 1e9;
    this.fish.forEach(function (k) {
      var d = px === undefined ? 0 : Math.hypot(k.P[6].x - px, k.P[6].y - py);
      if (d < bd) { bd = d; best = k; }
    });
    this.fish.forEach(function (k) {
      k.burst = k === best ? 1 : 0.5;
      k.turnKick = (k.r() < 0.5 ? -1 : 1) * 3;
    });
  };

  /* ============================================================
     THE APP'S HANDLE
     ============================================================ */
  function create(canvas, settings, isShown) {
    var s = {};
    for (var key in settings) s[key] = settings[key];
    s.look = 'nishiki'; s.path = 'pool';
    var pond = new Pond(canvas, s), raf = 0, last = 0, running = false;
    function shown() { try { return !isShown || isShown(); } catch (e) { return true; } }
    function loop(now) {
      raf = 0;
      if (!running) return;
      if (!shown()) { running = false; return; }
      var dt = last ? (now - last) / 1000 : 0; last = now;
      if (!document.hidden) pond.frame(dt);
      raf = requestAnimationFrame(loop);
    }
    function local(x, y) {
      var r = canvas.getBoundingClientRect();
      return { x: (x - r.left) * pond.size / (r.width || 1) - pond.half, y: (y - r.top) * pond.size / (r.height || 1) - pond.half };
    }
    var api = {
      start: function () {
        if (running) return;
        running = true; last = 0;
        if (pond.size !== (canvas.getBoundingClientRect().width || pond.size)) pond.resize();
        if (!raf) raf = requestAnimationFrame(loop);
      },
      stop: function () { running = false; if (raf) { cancelAnimationFrame(raf); raf = 0; } },
      reset: function () { pond.leaving = false; pond.resize(); pond.rebuild(); },
      hit: function (x, y) {
        var p = local(x, y), reach = pond.L * 0.3;
        return pond.fish.some(function (k) {
          if (k.z > 1) return false;
          for (var i = 0; i < k.P.length; i += 2) if (Math.hypot(k.P[i].x - p.x, k.P[i].y - p.y) < reach) return true;
          return false;
        });
      },
      startle: function (x, y) { var p = local(x, y); pond.startle(p.x, p.y); },
      leave: function () { pond.leave(); },
      pond: pond
    };
    window.addEventListener('resize', function () { pond.resize(); });
    return api;
  }

  window.KoiPond = { create: create, TUNE: TUNE };
})();
