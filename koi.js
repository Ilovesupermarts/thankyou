/* ============================================================
   koi.js — the koi on the start button, drawn from code (no image).

   Moved from the test bed koi2.html (the 錦 style, swimming as in a
   pool). koi2.html stays the place to tune them; move its "Copy values"
   into KOI_LOOK in app.js.

   The koi chosen in KOI_LOOK.kinds swim the pond inside the ring, each a
   different variety (kohaku, yamabuki ogon, showa, tancho, sanke,
   platinum ogon). They swim like fish, in moods picked at random
   (cruising to a spot across the pool, swimming slowly, resting with
   the fins paddling, darting, turning suddenly). Each body follows its
   head like a rope with a soft bend limit, so it never folds, tangles
   or twitches. Each koi decides for itself to dive (to a different
   depth each time, swimming about down there; smaller, blurrier and
   fainter the deeper it is) or to come up for air (one at a time; mouth
   opens, rings on the water). Two koi about to meet at the same depth:
   the deeper dips under. No koi rises or dives through another: it
   swims to a clear spot first. Touching a koi makes it dart off; on
   swipe up all of them swim forward and down and fade away.

   The ring, glow and pond are enlarged by KOI_LOOK.ring (the CSS
   variable --koi-ring); the koi keep their size. The canvas is larger
   than the pond inside the ring, so nothing near the edge is cut off
   square; the shadow on the pond floor stops at the ring's inner edge.

   Use:
     var pond = KoiPond.create(canvas, settings, isShown);
     pond.start()                   run (stops by itself when isShown() is false)
     pond.stop()
     pond.reset()                   new koi, swimming as at the start
     pond.hit(clientX, clientY)     true when a koi is under that point
     pond.startle(clientX, clientY) the koi nearest that point darts off
     pond.leave()                   swipe up: all swim down and away
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
    this.act = null; this.actT = 0; this.actAge = 0; this.actLen = 1; this.goal = null; this.finAmp = 1;
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
               turnR: 0.6,     // smallest turning circle of the head at a good pace (× length)
               turnSlow: 0.45, // when slow it can turn this much tighter (× turnR)
               pivot: 0.9,     // however slow, it can turn at least this fast (radians per second)
               avoidMax: 4.5,  // the strongest push to steer round another koi
               pathClear: 0.45,// a koi does not choose a way that passes closer than this to another (× length)
               bumpTurn: 1.5,  // how quickly a koi that bumps another turns away (radians per second)
               bumpMax: 0.25,  // the fastest a bump moves a koi aside (× length per second)
               minTurnR: 0.35, // its path is never tighter than this (× length), however slowly it swims
               reach: 0.45,    // this close to its spot (× length) counts as there
               goalMaxT: 6,    // after this long (s) chasing one spot it picks another
               across: 0.9,    // a cruising koi's next spot is at least this far away (× the pool's radius)
               dipDepth: 0.38, // how far a koi dips under another it is about to meet (0 = never)
               dipAhead: 1.4,  // it dips when they would meet within this many seconds
               dipClose: 0.42, // … coming closer than this (× length)
               dipTime: 1.6,   // it stays under at least this long (s)
               dipNear: 0.12,  // … or when their bodies come this close (× length)
               dipClear: 0.25, // it comes back up once their bodies are this far apart (× length)
               layer: 0.06,    // a koi this much deeper or shallower counts as above or below (not beside)
               blockGap: 0.12, // a koi above or below closer than this (body gap, × length) is in the way of going up or down
               clearGap: 0.3,  // … and once held, it goes on only when that gap is this big
               clearAway: 1.1, // how far it swims off to find a clear spot (× length)
               clearRetry: 2,  // still not clear after this long (s): it heads for a fresh spot
               wallFace: 0.35, // nose this much into the edge (0 along it, 1 straight at it): it stops and turns
               stuckAfter: 1.2,// stuck at the edge this long (s): it turns the other way round
               brakeAt: 1.1,   // it brakes to turn when its spot is more than this far round (radians)
               brake: 0.45,    // … down to this share of its speed
               turnEase: 4,    // how quickly a turn builds and eases off
               bendR: 0.4,     // tightest bend of the body near the head (× length); the tail may bend twice as tight
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
    // what it feels like doing (cruise, slow, rest, dart, sudden turn):
    // picked at random, each for a random time, so it is never the same
    this.actT -= dt;
    var free = this.mode === 'cruise' || this.mode === 'dip' || (this.mode === 'dive' && !this.diveDown);
    if (!this.act || this.actT <= 0) this.pickAct(free ? null : 'cruise');
    if (!free && (this.act === 'dart' || this.act === 'rest' || this.act === 'snap')) this.pickAct('cruise');
    var A = MOODS[this.act];

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
    var vT, beatT, acc;
    if (leaving) { vT = L * TUNE.exitV * (0.7 + 0.3 * s.speed); beatT = 1; acc = 2.2; }
    else if (this.act === 'cruise') { vT = L * (this.kick ? 0.5 : 0.22) * s.speed * modeV; beatT = this.kick ? 1 : 0.35; acc = this.kick ? 2.2 : 0.7; }
    else if (this.act === 'dart') {
      // a burst, then a long glide
      var f = this.actAge / this.actLen;
      vT = L * (f < 0.35 ? A.v : A.v * 0.25) * s.speed; beatT = f < 0.35 ? 1 : 0.2; acc = f < 0.35 ? 6 : 0.9;
    }
    else { vT = L * A.v * s.speed * modeV; beatT = A.beat; acc = A.acc; }
    // a sharp turn ahead, or the edge close: it brakes (with its fins) to turn tightly
    if (!leaving && this.act !== 'dart' && this.act !== 'rest') {
      var hx0 = Math.cos(this.heading), hy0 = Math.sin(this.heading), la0 = L * TUNE.la0 + this.v * TUNE.la1;
      var gdiff = this.goal ? Math.abs(angDiff(this.heading, Math.atan2(this.goal.y - this.y, this.goal.x - this.x))) : 0;
      var edgeNear = Math.hypot(this.x + hx0 * la0, this.y + hy0 * la0) > lim * TUNE.wall;
      if (gdiff > TUNE.brakeAt || edgeNear || this.orbiting) { vT *= TUNE.brake; acc = Math.max(acc, 2); }
    }
    vT += L * 1.3 * this.burst;
    if (this.burst > 0.05) { beatT = 1; acc = 2.2; }
    this.actAge += dt;
    this.v += (vT - this.v) * Math.min(1, acc * dt);
    this.beat += (beatT - this.beat) * Math.min(1, 3 * dt);
    this.finAmp += ((this.act === 'rest' ? 1.9 : this.act === 'slow' ? 1.3 : 1) - this.finAmp) * Math.min(1, 2 * dt);

    // heading: toward the spot it has in mind, with a little wander
    var hx = Math.cos(this.heading), hy = Math.sin(this.heading);
    this.wTurn += -this.wTurn * 0.9 * dt + gauss(r) * 1.1 * Math.sqrt(dt);
    var turn = this.wTurn * (this.act === 'rest' ? 0.06 : 0.4);   // resting: it hardly turns, so it stays put
    if (this.goal) {
      var gx = this.goal.x - this.x, gy = this.goal.y - this.y;
      turn += clamp(this.goalTurn(Math.atan2(gy, gx)) * A.steer, -3, 3);
      // there: pick the next spot (or, when slow, just drift on)
      var gDist = Math.hypot(gx, gy), gOff = Math.abs(angDiff(this.heading, Math.atan2(gy, gx)));
      this.goalAge = (this.goalAge || 0) + dt;
      // the spot inside its turning circle (it would only circle round it),
      // or chased too long: it gives up and picks another, either side
      // the spot inside its turning circle: it brakes to turn tighter
      // (rather than circle round it); chased too long: it picks another
      var turnCircle = Math.max(this.v, L * 0.12) / Math.max(0.2, Math.abs(this.omega || 0.2));
      this.orbiting = gOff > 1.2 && gDist < turnCircle * 1.3;
      if (gDist < L * TUNE.reach || this.goalAge > TUNE.goalMaxT) {
        this.goal = this.act === 'cruise' || this.act === 'slow' ? this.goalAcross() : null;
        this.goalAge = 0; this.turnSign = 0;
      }
    }

    // the pool's edge: when it is about to reach it, it picks a new spot
    // inside the pool (any way round) and heads there
    var la = L * TUNE.la0 + this.v * TUNE.la1;
    var fx = this.x + hx * la, fy = this.y + hy * la, fd = Math.hypot(fx, fy);
    var wall = lim * TUNE.wall;
    if (fd > wall) {
      // (it keeps that spot until it gets there, so it does not keep changing its mind)
      // (only if its spot is outside the area spots are picked from)
      if (!this.goal || Math.hypot(this.goal.x, this.goal.y) > lim * 0.82) this.goal = this.goalAcross();
      var gx2 = this.goal.x - this.x, gy2 = this.goal.y - this.y;
      turn += clamp(this.goalTurn(Math.atan2(gy2, gx2)) * 2.5, -3, 3) * clamp((fd - wall) / (la * 0.5), 0.3, 1.5);
    }

    // the other koi: steer round where they are and where they are going
    var clear = L * (0.3 * s.girth + TUNE.clear), slow = 0, avoidTurn = 0;
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
            avoidTurn += (rel > 0 ? -1 : 1) * push;
            if (Math.abs(rel) < 0.9) slow = Math.max(slow, push * TUNE.yield);
          }
        }
      }
    }
    this.v *= 1 - clamp(slow, 0, 0.8) * dt * 4;
    // (the push to steer round the other koi is capped, so it can not lock it in place)
    turn += clamp(avoidTurn, -TUNE.avoidMax, TUNE.avoidMax);
    // stuck at the edge for a while: it gives up that way and turns the other way round
    if (Math.hypot(this.x, this.y) > lim * 0.97 && Math.abs(this.omega || 0) < 0.3) this.stuckT = (this.stuckT || 0) + dt;
    else this.stuckT = 0;
    if (this.stuckT > TUNE.stuckAfter) {
      this.stuckT = 0;
      this.turnSign = this.turnSign ? -this.turnSign : (r() < 0.5 ? -1 : 1);
      this.goal = this.newGoal(1.2, Math.PI, true);
    }

    turn += this.turnKick; this.turnKick *= Math.pow(0.02, dt);
    // a koi can only turn so tightly for its speed (its turning circle),
    // and it eases into and out of each turn; when it needs to turn
    // harder than that, it gives a tail kick, as koi do
    // the slower it swims, the tighter it can turn
    var tightness = TUNE.turnSlow + (1 - TUNE.turnSlow) * clamp(this.v / (L * 0.5), 0, 1);
    var maxTurn = Math.max(this.v, L * 0.12) / (L * TUNE.turnR * A.turnR * tightness);
    // when slow it can still turn on the spot with its front fins
    maxTurn = Math.max(maxTurn, this.act === 'rest' ? 0.35 : TUNE.pivot);
    if (Math.abs(turn) > maxTurn * 0.8 && !this.kick && this.act === 'cruise') { this.kick = true; this.gaitT = 0.4 + r() * 0.3; }
    this.omega = (this.omega || 0) + (clamp(turn, -maxTurn, maxTurn) - (this.omega || 0)) * Math.min(1, TUNE.turnEase * A.ease * dt);
    this.heading += this.omega * dt;
    // fish drift forward as they turn: never slower than the turn needs to
    // keep its path no tighter than minTurnR (so the path can not double
    // back in a hairpin, which would make the tail flip from side to side)
    var vMin = Math.abs(this.omega) * L * TUNE.minTurnR;
    if (this.v < vMin) this.v += (vMin - this.v) * Math.min(1, 6 * dt);
    var ox0 = this.x, oy0 = this.y;
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
          // (capped: two koi that find themselves overlapping, say one coming
          // up from under the other, ease apart instead of jumping)
          var k2 = Math.min((touch - ed) * TUNE.bump, L * TUNE.bumpMax * dt);
          var nx2 = -Math.sin(this.heading), ny2 = Math.cos(this.heading);
          var side = (ex * nx2 + ey * ny2) / ed;
          // nose to nose there is no side to slide off: it picks one
          if (Math.abs(side) < 0.35) side = (side !== 0 ? (side > 0 ? 1 : -1) : (this.idx % 2 ? 1 : -1)) * 0.35;
          this.x += nx2 * side * k2; this.y += ny2 * side * k2;
          this.heading += (side > 0 ? 1 : -1) * TUNE.bumpTurn * dt;     // and turns away
          // met head on: it goes off somewhere else
          if (along < 0.3 && (this.bumpGoalT || 0) <= 0) { this.goal = this.newGoal(1.2, Math.PI); this.bumpGoalT = 1.5; this.turnSign = side > 0 ? 1 : -1; }
        }
      }
    }
    this.bumpGoalT = (this.bumpGoalT || 0) - dt;
    // the pool's edge: a step that would take the head past it loses only
    // its outward part, so the koi glides along the edge the way it is
    // facing (a snap straight back inward could move it backwards, fold
    // its path back on itself and flip its tail)
    var dc = Math.hypot(this.x, this.y);
    if (dc > lim) {
      var sx = this.x - ox0, sy = this.y - oy0, ux = this.x / dc, uy = this.y / dc;
      // nose into the edge: it stops and turns first (as a fish does at a wall)
      if (Math.cos(this.heading) * ux + Math.sin(this.heading) * uy > TUNE.wallFace) {
        sx = 0; sy = 0; this.v *= 1 - Math.min(1, 6 * dt);
        // (a dart or a sudden turn ends there: it slows, and swims on calmly)
        if (this.act === 'dart' || this.act === 'snap') this.pickAct('slow');
      }
      var outward = sx * ux + sy * uy;
      if (outward > 0) { sx -= ux * outward; sy -= uy * outward; }
      this.x = ox0 + sx; this.y = oy0 + sy;
      dc = Math.hypot(this.x, this.y);
      if (dc > lim) { this.x *= lim / dc; this.y *= lim / dc; }   // (the last hair, along the curve)
    }

    // depth: a soft spring toward the depth it wants
    this.modeT -= dt;
    // about to meet another koi at the same depth: the one that cruises a
    // little deeper dips under it, and comes back up once they have passed
    // (the one that is deeper now dips: so a koi coming back up stays under)
    if (this.mode === 'cruise' && TUNE.dipDepth > 0) {
      for (j = 0; j < p.fish.length; j++) {
        o = p.fish[j];
        if (o === this || o.mode === 'dip' || Math.abs(o.z - this.z) > 0.25) continue;
        var deeper = this.z > o.z + 0.03 || (Math.abs(this.z - o.z) <= 0.03 && (this.zHome > o.zHome || (this.zHome === o.zHome && this.idx > o.idx)));
        if (!deeper) continue;
        if (this.bodyGap(o) < L * TUNE.dipNear || this.meeting(o) < TUNE.dipAhead) {
          this.mode = 'dip'; this.dipFrom = o; this.zT = Math.max(this.z, this.zHome) + TUNE.dipDepth; this.modeT = TUNE.dipTime; break;
        }
      }
    }
    if (this.mode === 'dip') {
      // (stays under while their bodies are still close)
      if (this.modeT <= 0 && this.bodyGap(this.dipFrom) > L * TUNE.dipClear) { this.mode = 'cruise'; this.zT = this.zHome; this.dipFrom = null; }
    }
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
    if (this.mode === 'dip' || (this.mode === 'cruise' && this.zT === this.zHome && this.z > this.zHome + 0.05 && this.wasDip)) { zk = 5; zc = 4.4; }   // a quick dip
    this.wasDip = this.mode === 'dip' || (this.wasDip && this.z > this.zHome + 0.05);
    // Never through another koi: while a koi is directly above or below it,
    // between its depth now and the depth it is heading for, it holds its
    // depth and swims off to a clear spot; then it carries on up or down.
    var zGoal = this.zT, blocker = null;
    if (this.mode !== 'exit' && Math.abs(this.zT - this.z) > 0.03) blocker = this.depthBlocker(this.zT);
    if (blocker) {
      this.holdT = this.holdZ === undefined ? 0 : (this.holdT || 0) + dt;
      // (a fresh spot every couple of seconds, in case the other koi keeps up with it)
      if (this.holdZ === undefined || this.holdT > TUNE.clearRetry) {
        if (this.holdZ === undefined) this.holdZ = this.z;
        this.holdT = 0;
        // head for a spot well away from the koi in the way
        var bm = blocker.P[10], ax = this.x - bm.x, ay = this.y - bm.y, al = Math.hypot(ax, ay) || 1;
        var glim = s.wanderSpread * p.R * 0.8, gx = this.x + ax / al * L * TUNE.clearAway, gy = this.y + ay / al * L * TUNE.clearAway, gd = Math.hypot(gx, gy);
        if (gd > glim) { gx *= glim / gd; gy *= glim / gd; }
        if (this.act === 'rest') this.pickAct('slow');
        this.goal = { x: gx, y: gy }; this.goalAge = 0; this.turnSign = 0;
      }
      zGoal = this.holdZ;
    } else this.holdZ = undefined;
    this.zv += ((zGoal - this.z) * zk - this.zv * zc) * dt;
    this.z += this.zv * dt;

    // tail beats: faster in a kick, slow in a glide (and fast in a wriggle)
    var sway = this.act === 'rest' ? 0.55 : 1;
    this.phase += dt * TAU * (0.55 + 1.1 * this.beat * s.speed) * sway * (1 + 1.2 * this.burst) * (1 + 1.6 * (this.wrig || 0));
    this.finPhase += dt * TAU * (0.3 + 0.35 * (1 - this.beat)) * (this.act === 'rest' ? 1.8 : 1) * (1 + this.burst);
  };

  // swipe up: a hard wriggle on the spot, then down and away
  Koi.prototype.exitDive = function (delay) {
    this.mode = 'exit'; this.exitT = -delay; this.wrig = 0; this.exitTurned = false;
  };
  /* How far to turn toward a direction. When it is far round behind, the
     koi commits to one way round and keeps to it until it has mostly
     turned (otherwise it keeps changing its mind, left, right, and stays
     put). */
  Koi.prototype.goalTurn = function (dir) {
    var d = angDiff(this.heading, dir);
    if (Math.abs(d) > 2.2) {
      if (!this.turnSign) this.turnSign = d > 0 ? 1 : -1;
      return this.turnSign * Math.abs(d);
    }
    if (Math.abs(d) < 1.6) this.turnSign = 0;
    return d;
  };

  /* The moods a koi swims in. v: speed (× length per second, × the
     speed setting); beat: how hard the tail beats; acc: how quickly it
     gets to that speed; steer: how firmly it heads for its spot; turnR:
     its turning circle (× TUNE.turnR); ease: how quickly a turn builds;
     w: how often it is picked; t: how long it lasts (s, from–to). */
  var MOODS = {
    cruise: { v: 0.36, beat: 0.6,  acc: 1.2, steer: 1.4, turnR: 1,    ease: 1,   w: 0.34, t: [3, 8] },
    slow:   { v: 0.12, beat: 0.28, acc: 0.8, steer: 0.9, turnR: 1,    ease: 0.8, w: 0.26, t: [3, 7] },
    rest:   { v: 0.015, beat: 0.12, acc: 3,   steer: 0.4, turnR: 1,   ease: 0.6, w: 0.18, t: [1.5, 5] },
    dart:   { v: 1.25, beat: 1,    acc: 6,   steer: 3,   turnR: 0.65, ease: 2,   w: 0.12, t: [0.9, 1.6] },
    snap:   { v: 0.42, beat: 0.9,  acc: 3,   steer: 2.5, turnR: 0.75, ease: 1.6, w: 0.10, t: [0.8, 1.3] }
  };
  Koi.prototype.pickAct = function (force) {
    var r = this.r, name = force;
    if (!name) {
      // not the same mood twice running (except cruising)
      var total = 0, k2;
      for (k2 in MOODS) if (k2 !== this.act || k2 === 'cruise') total += MOODS[k2].w;
      var pick = r() * total;
      for (k2 in MOODS) {
        if (k2 === this.act && k2 !== 'cruise') continue;
        pick -= MOODS[k2].w; name = k2; if (pick <= 0) break;
      }
    }
    var M = MOODS[name];
    this.act = name; this.actAge = 0; this.goalAge = 0;
    this.actT = this.actLen = M.t[0] + r() * (M.t[1] - M.t[0]);
    // where it has in mind to go
    if (name === 'dart') this.goal = this.newGoal(1.0, 2.8);        // off at a sharp angle
    else if (name === 'snap') this.goal = this.newGoal(1.6, 3.1);   // a sudden change of direction
    else if (name === 'rest') this.goal = null;                     // stays put
    else this.goal = this.goalAcross();
  };
  /* A spot in the pool, at a turn of minA–maxA (radians, either way) from
     where the koi is heading, as far off as there is room for. */
  Koi.prototype.newGoal = function (minA, maxA, inward) {
    var p = this.pond, lim = p.s.wanderSpread * p.R * 0.8, r = this.r;
    for (var t = 0; t < 24; t++) {
      var a = this.heading + (r() < 0.5 ? -1 : 1) * (minA + r() * (maxA - minA));
      var dist = p.L * (0.5 + r() * 1.3);
      var gx = this.x + Math.cos(a) * dist, gy = this.y + Math.sin(a) * dist, gd = Math.hypot(gx, gy);
      if (inward && gd > Math.hypot(this.x, this.y)) continue;
      if (gd > lim) continue;
      // not a way that runs through another koi (one at about its depth)
      if (t < 20 && this.pathBlocked(gx, gy)) continue;
      return { x: gx, y: gy };
    }
    // no room that way: anywhere in the pool, spread evenly (not at the rim)
    var ra = r() * TAU, rr = lim * 0.85 * Math.sqrt(r());
    return { x: Math.cos(ra) * rr, y: Math.sin(ra) * rr };
  };
  /* A spot somewhere across the pool (anywhere, evenly spread, but well
     away from where the koi is). Heading across the pool every time makes
     it pass through the middle and arrive facing the far edge, where its
     next spot is as likely to its left as to its right: no circling. */
  Koi.prototype.goalAcross = function () {
    var p = this.pond, lim = p.s.wanderSpread * p.R * 0.8, r = this.r, far = lim * TUNE.across, best = null, bestD = -1;
    for (var t = 0; t < 30; t++) {
      var a = r() * TAU, rr = lim * Math.sqrt(r()), gx = Math.cos(a) * rr, gy = Math.sin(a) * rr;
      var d = Math.hypot(gx - this.x, gy - this.y);
      if (d < far) { if (d > bestD) { bestD = d; best = { x: gx, y: gy }; } continue; }
      if (t < 24 && this.pathBlocked(gx, gy)) continue;
      return { x: gx, y: gy };
    }
    return best;
  };
  // the gap between this koi's body and another's (edge to edge, in pixels)
  /* A koi in the way of this one changing depth to zTo: one whose depth is
     between this koi's depth and zTo (not one beside it at the same depth)
     and whose body is under or over this one's, seen from above. Once held,
     the way must be properly clear before it goes on (so it does not keep
     starting and stopping). */
  Koi.prototype.depthBlocker = function (zTo) {
    var p = this.pond, L = p.L, down = zTo > this.z, edge = TUNE.layer;
    var near = L * (this.holdZ !== undefined ? TUNE.clearGap : TUNE.blockGap);
    for (var j = 0; j < p.fish.length; j++) {
      var o = p.fish[j];
      if (o === this || o.mode === 'exit') continue;
      if (down && this.mode === 'dip' && o === this.dipFrom && o.z <= this.z + 0.03) continue;   // (the one it is dipping under)
      // anywhere from level with it to just past where it is heading, on the side it is going
      var between = down ? (o.z >= this.z - 0.005 && o.z < zTo + edge) : (o.z <= this.z + 0.005 && o.z > zTo - edge);
      if (between && this.bodyGap(o) < near) return o;
    }
    return null;
  };
  Koi.prototype.bodyGap = function (o) {
    var g = 1e9;
    for (var a = 0; a < N; a += 3) for (var c = 0; c < N; c += 3)
      g = Math.min(g, Math.hypot(this.P[a].x - o.P[c].x, this.P[a].y - o.P[c].y) - this.W[a] - o.W[c]);
    return g;
  };
  // In how many seconds will this koi's head and another koi pass close
  // (within about a body width), going as they are? (9 when they will not.)
  Koi.prototype.meeting = function (o) {
    var L = this.pond.L, best = 9;
    var vx = Math.cos(this.heading) * this.v, vy = Math.sin(this.heading) * this.v;
    var ux = Math.cos(o.heading) * o.v, uy = Math.sin(o.heading) * o.v;
    // against the other's head and the middle of its body
    var pts = [{ x: o.x, y: o.y }, o.P[8], o.P[14]];
    for (var q = 0; q < pts.length; q++) {
      var dx = pts[q].x - this.x, dy = pts[q].y - this.y, rx = ux - vx, ry = uy - vy, rv = rx * rx + ry * ry;
      if (Math.hypot(dx, dy) < L * TUNE.dipClose) return 0;
      if (rv < 1e-6) continue;
      var tc = -(dx * rx + dy * ry) / rv;
      if (tc <= 0) continue;
      var cx = dx + rx * tc, cy = dy + ry * tc;
      if (Math.hypot(cx, cy) < L * TUNE.dipClose) best = Math.min(best, tc);
    }
    return best;
  };
  // does the way from here to (gx, gy) pass close to another koi?
  Koi.prototype.pathBlocked = function (gx, gy) {
    var p = this.pond, me = this, clear = p.L * TUNE.pathClear;
    return p.fish.some(function (o) {
      if (o === me || depthGap(me, o) > 0.4) return false;
      for (var i = 0; i < 24; i += 6) {
        var px = o.P[i].x, py = o.P[i].y;
        var vx = gx - me.x, vy = gy - me.y, l2 = vx * vx + vy * vy || 1;
        var u = clamp(((px - me.x) * vx + (py - me.y) * vy) / l2, 0, 1);
        if (Math.hypot(me.x + vx * u - px, me.y + vy * u - py) < clear) return true;
      }
      return false;
    });
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
    var a = tr[k], i = 1;
    // (pool: the path is used only once, to lay the body out at the start;
    // after that the body follows the head like a rope, below)
    if (!pool || !this.C) {
    P[0].x = a.x; P[0].y = a.y;
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
      if (pool) this.C = P.map(function (q) { return { x: q.x, y: q.y }; });
    }
    if (pool) {
      // The body follows the head like a rope: each point is pulled along
      // behind the one in front, at a fixed spacing, and may bend from the
      // one before only so much (a soft limit, tighter toward the tail).
      // Nothing depends on the old path, so however the head turns, stops
      // or is nudged, the body can not tangle, fold back or jump.
      var C = this.C, seg0 = L / (N - 1), head = tr[tr.length - 1], pa = 0;
      C[0].x = head.x; C[0].y = head.y;
      for (i = 1; i < N; i++) {
        var ang = Math.atan2(C[i].y - C[i - 1].y, C[i].x - C[i - 1].x);
        if (i > 1) { var lim3 = seg0 / (L * TUNE.bendR) * (1 + i / (N - 1)); ang = pa + lim3 * Math.tanh(angDiff(pa, ang) / lim3); }
        C[i].x = C[i - 1].x + Math.cos(ang) * seg0; C[i].y = C[i - 1].y + Math.sin(ang) * seg0;
        pa = ang;
      }
      // drawn from the rope (shorter while it tilts to change depth)
      P[0].x = C[0].x; P[0].y = C[0].y;
      for (i = 1; i < N; i++) {
        var cx = C[i].x - C[i - 1].x, cy = C[i].y - C[i - 1].y, cl = Math.hypot(cx, cy) || 1;
        P[i].x = P[i - 1].x + cx / cl * seg; P[i].y = P[i - 1].y + cy / cl * seg;
      }
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
        // where the path doubles back, the bend could go either way: it
        // keeps the way it bent last frame, so the tail never flips sides
        var pb = this._bend || (this._bend = []);
        if (Math.abs(dA) > 2.0) {
          // the way it bent here last frame (else the way the body just ahead bends)
          var want = pb[i] ? pb[i] : pb[i - 1];
          if (want && (dA > 0) !== (want > 0)) dA -= (dA > 0 ? 1 : -1) * TAU;
        }
        pb[i] = dA;
        // a soft limit: the bend eases in toward it (a hard stop makes the
        // tail twitch each time the swimming wave pushes it to the limit)
        if (i > 1) aA = prevA + lim2 * Math.tanh(dA / lim2);
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

  // B — a kohaku (white with red), a gold ogon (metallic, scaled), and
  // after them a different variety for every further koi.
  var NISHIKI_MORE = ['showa', 'tancho', 'sanke', 'platinum'];
  LOOKS.nishiki = {
    setup: function (k) {
      var r = k.r;
      // every koi in the pond a different variety: the first two as they
      // always were (a kohaku and a gold ogon), then showa sanshoku, tancho,
      // sanke and platinum ogon; from the seventh on the varieties repeat, but
      // each pattern is laid out from the koi's own seed, so none match
      var kinds = k.pond.s.kinds;
      var kind = kinds && kinds[k.idx] ? kinds[k.idx]
               : k.idx === 0 ? 'kohaku' : k.idx === 1 ? 'ogon' : NISHIKI_MORE[(k.idx - 2) % NISHIKI_MORE.length];
      var own = k.idx >= 2;      // (the first two keep their fixed patterns)
      function spot(x, y, rx, ry, col) {
        if (own) { x += (r() - 0.5) * 0.12; y += (r() - 0.5) * 0.5; rx *= 0.8 + r() * 0.45; ry *= 0.8 + r() * 0.45; }
        return makePatch(r, x, y, rx, ry, col);
      }
      k.sheen = false; k.scales = null;
      if (kind === 'kohaku') {
        k.body = '#FFF8F1';
        k.patches = [
          spot(0.12, 0.05, 0.13, 0.75, '#E04A2C'),
          spot(0.42, -0.25, 0.14, 0.75, '#DD4428'),
          spot(0.66, 0.35, 0.1, 0.6, '#E0502E')
        ];
        k.back = 'rgba(255, 255, 255, 0.0)';
        k.finCol = 'rgba(255, 250, 244, 0.78)';
        k.finRay = 'rgba(214, 196, 186, 0.6)';
        k.finEdge = 'rgba(190, 160, 150, 0.35)';
        k.eye = '#3A2A26'; k.edge = 'rgba(150, 120, 110, 0.35)'; k.rim = 'rgba(255,255,255,0.9)';
        k.scales = 'rgba(200, 160, 150, 0.22)';
      } else if (kind === 'ogon') {
        k.body = '#F3B640';
        k.patches = [ spot(0.5, 0, 0.5, 0.35, '#F8CC66') ];
        k.back = 'rgba(214, 140, 30, 0.35)';
        k.finCol = 'rgba(250, 214, 130, 0.78)';
        k.finRay = 'rgba(255, 246, 210, 0.85)';
        k.finEdge = 'rgba(205, 140, 40, 0.4)';
        k.eye = '#4A3010'; k.edge = 'rgba(170, 110, 20, 0.5)'; k.rim = 'rgba(255, 246, 214, 0.95)';
        k.scales = 'rgba(160, 96, 10, 0.32)';
        k.sheen = true;
      } else if (kind === 'tancho') {
        // white, with one round red crown on the head
        k.body = '#FFFAF5';
        k.patches = [ spot(0.12, 0, 0.075, 0.5, '#D93F28') ];
        k.back = 'rgba(255, 255, 255, 0.0)';
        k.finCol = 'rgba(255, 252, 248, 0.8)';
        k.finRay = 'rgba(210, 198, 192, 0.6)';
        k.finEdge = 'rgba(185, 165, 158, 0.35)';
        k.eye = '#3A2A26'; k.edge = 'rgba(150, 128, 120, 0.32)'; k.rim = 'rgba(255,255,255,0.92)';
        k.scales = 'rgba(190, 165, 158, 0.2)';
      } else if (kind === 'showa') {
        // black, with red and white
        k.body = '#2B2523';
        k.patches = [
          spot(0.14, 0.1, 0.12, 0.7, '#D9472B'),
          spot(0.38, -0.35, 0.1, 0.55, '#FFF6EE'),
          spot(0.5, 0.3, 0.13, 0.6, '#D44528'),
          spot(0.72, -0.2, 0.09, 0.5, '#FFF6EE')
        ];
        k.back = 'rgba(0, 0, 0, 0.25)';
        k.finCol = 'rgba(70, 60, 58, 0.72)';
        k.finRay = 'rgba(255, 244, 236, 0.55)';
        k.finEdge = 'rgba(30, 24, 22, 0.45)';
        k.eye = '#0E0A09'; k.edge = 'rgba(0, 0, 0, 0.45)'; k.rim = 'rgba(255, 236, 226, 0.55)';
        k.scales = 'rgba(255, 240, 230, 0.12)';
      } else if (kind === 'sanke') {
        // white, with red and small black spots
        k.body = '#FFF8F1';
        k.patches = [
          spot(0.16, 0.1, 0.12, 0.7, '#E04A2C'),
          spot(0.52, -0.2, 0.15, 0.7, '#DD4428'),
          spot(0.34, 0.55, 0.05, 0.25, '#2A2321'),
          spot(0.6, 0.45, 0.06, 0.28, '#2A2321'),
          spot(0.74, -0.45, 0.04, 0.22, '#2A2321')
        ];
        k.back = 'rgba(255, 255, 255, 0.0)';
        k.finCol = 'rgba(255, 250, 244, 0.78)';
        k.finRay = 'rgba(214, 196, 186, 0.6)';
        k.finEdge = 'rgba(190, 160, 150, 0.35)';
        k.eye = '#3A2A26'; k.edge = 'rgba(150, 120, 110, 0.35)'; k.rim = 'rgba(255,255,255,0.9)';
        k.scales = 'rgba(200, 160, 150, 0.22)';
      } else {
        // platinum ogon: shining silver-white
        k.body = '#E6EAEC';
        k.patches = [ spot(0.5, 0, 0.5, 0.35, '#F6F8F9') ];
        k.back = 'rgba(150, 160, 168, 0.3)';
        k.finCol = 'rgba(236, 240, 242, 0.8)';
        k.finRay = 'rgba(255, 255, 255, 0.9)';
        k.finEdge = 'rgba(150, 160, 168, 0.4)';
        k.eye = '#2E3236'; k.edge = 'rgba(120, 130, 140, 0.45)'; k.rim = 'rgba(255, 255, 255, 0.95)';
        k.scales = 'rgba(110, 122, 134, 0.3)';
        k.sheen = true;
      }
    },
    draw: drawSolidKoi
  };

  function drawSolidKoi(ctx, k, s) {
    var L = k.pond.L, out = k.outline(), tail = k.tail();
    var fl = 0.32 * s.fins * (k.finAmp || 1);
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
  function Pond(canvas, settings, ringScale) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d');
    this.s = settings; this.ringScale = ringScale || 1;
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
    this.L = this.R / (this.ringScale || 1) * (this.s.length || 0.9);
  };
  Pond.prototype.rebuild = function () {
    this.L = this.R / (this.ringScale || 1) * this.s.length;
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
    this.L = this.R / (this.ringScale || 1) * s.length;
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
    s.kinds = (settings.kinds || ['kohaku', 'ogon']).slice();
    s.count = s.kinds.length;
    var pond = new Pond(canvas, s, +s.ring || 1), raf = 0, last = 0, running = false;
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
