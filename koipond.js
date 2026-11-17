/* ============================================================
   koipond.js — a whole screen of koi, seen from above (koiscreen.html).

   Started as a copy of koi.js (the start button's koi, which is left
   exactly as it is). The koi swim the same way: moods picked at random
   (cruise, slow, rest, dart, sudden turn), a few tail beats then a
   glide, the body following the head like a rope with a soft bend
   limit, each at its own depth (deeper = smaller, blurrier, fainter),
   diving now and then or coming up for air, the deeper one dipping
   under another it is about to meet, never rising or diving through
   another koi.

   What is new here:
     · the pond is the whole canvas: a rectangle with rounded corners
       (the koi turn back along its edges as they did along the ring);
     · any number of koi, each a little different in size;
     · more varieties: asagi, shiro utsuri, bekko, goshiki (and the six
       of the start button), each koi's pattern laid out from its own
       seed, so no two match;
     · feeding: a tap scatters pellets that float on the water; koi
       that notice come over, rise and take them one by one (mouth
       opening, rings on the water); pellets nobody eats slowly sink.

   Use:
     var pond = KoiScreen.create(canvas, settings);
     pond.start() / pond.stop()
     pond.reset()                   new koi (after changing the mix)
     pond.feed(clientX, clientY)    scatter food there
     pond.set(settings)             change settings live
     pond.info()                    counts for the panel
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
    // each koi its own size (a real pond has young and old fish)
    this.sizeU = this.r() * 2 - 1;
    this.sizeK = 1; this.L = pond.L;
    this.food = null; this.feedT = 0;
  }
  Koi.prototype.size = function () {
    var p = this.pond;
    this.sizeK = 1 + (p.s.sizeVary || 0) * this.sizeU;
    this.L = p.L * this.sizeK;
  };

  Koi.prototype.reset = function () {
    this.trail.length = 0; this.C = null; this._bend = null;
    var p = this.pond, me = this, pt = null;
    this.size();
    // somewhere in the pond, clear of the koi placed before it
    for (var t = 0; t < 40; t++) {
      pt = p.randomPoint(this.L * 0.5);
      if (!p.fish.some(function (o) { return o !== me && o.placed && Math.hypot(o.x - pt.x, o.y - pt.y) < me.L * 1.4; })) break;
    }
    this.x = pt.x; this.y = pt.y; this.placed = true;
    this.heading = this.r() * TAU;
    this.v = this.L * 0.3; this.z = this.zT = this.zHome; this.zv = 0; this.mode = 'cruise';
    this.act = null; this.goal = null; this.food = null; this.restT = undefined;
  };

  Koi.prototype.step = function (dt, t) {
    var p = this.pond, s = p.s, L = this.L;
    var boost = 1 + 2.4 * this.burst;
    this.burst = Math.max(0, this.burst - dt * 1.3);
    var hx, hy;
    this.stepPool(dt, boost);
    hx = this.x; hy = this.y;
    // tail beat: faster when the koi goes faster (the pool sets its own)
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
               exitV: 0.8,     // swimming speed when it swims away (× length per second)
               wallIn: 0.2,    // it starts turning back this far inside the pond's edge (× length)
               goalIn: 0.3,    // spots it swims to are at least this far inside the edge (× length)
               suck: 0.14,     // … and sucks in a pellet this close in front of its mouth (× length)
               eatReach: 0.09, // its mouth this close to a pellet (× length): it takes it
               retarget: 0.4,  // a feeding koi looks again for the nearest pellet this often (s)
               eatRise: 1.6 }; // this close to its pellet (× length) it rises to the surface
  // the shadows' softness against the old blur filter's (calibrated by
  // comparing the two at the same moment) and the largest little picture
  // a diving koi is drawn on (device pixels across)
  var SHADOW_SOFT = 0.5, SMALL_SIG = 1.2, DIVE_SIG = 2;
  // how far apart two koi are in depth, counting the depth each is
  // heading for (so one coming back up already counts as at that depth)
  function depthGap(a, b) {
    return Math.min(Math.abs(a.z - b.z), Math.abs(a.zT - b.z), Math.abs(a.z - b.zT));
  }
  function gauss(r) { return (r() + r() + r() + r() - 2) * 1.7; }

  Koi.prototype.stepPool = function (dt, boost) {
    var p = this.pond, s = p.s, L = this.L, r = this.r;
    // what it feels like doing (cruise, slow, rest, dart, sudden turn):
    // picked at random, each for a random time, so it is never the same
    this.actT -= dt;
    var free = this.mode !== 'feed' && (this.mode === 'cruise' || this.mode === 'dip' || (this.mode === 'dive' && !this.diveDown));
    if (this.mode === 'feed') { if (this.act !== 'feed') this.pickAct('feed'); this.actT = 9; }
    else if (!this.act || this.actT <= 0) this.pickAct(free ? null : 'cruise');
    if (!free && this.mode !== 'feed' && (this.act === 'dart' || this.act === 'rest' || this.act === 'snap')) this.pickAct('cruise');
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
    else { vT = L * A.v * s.speed * modeV * (this.mode === 'feed' ? this.feedSlow : 1); beatT = A.beat; acc = A.acc; }
    // a sharp turn ahead, or the edge close: it brakes (with its fins) to turn tightly
    if (!leaving && this.act !== 'dart' && this.act !== 'rest') {
      var hx0 = Math.cos(this.heading), hy0 = Math.sin(this.heading), la0 = L * TUNE.la0 + this.v * TUNE.la1;
      var gdiff = this.goal ? Math.abs(angDiff(this.heading, Math.atan2(this.goal.y - this.y, this.goal.x - this.x))) : 0;
      var edgeNear = p.sdf(this.x + hx0 * la0, this.y + hy0 * la0) > -L * TUNE.wallIn;
      if (gdiff > TUNE.brakeAt || edgeNear || this.orbiting) { vT *= TUNE.brake; acc = Math.max(acc, 2); }
    }
    vT += L * 1.3 * this.burst;
    if (this.burst > 0.05) { beatT = 1; acc = 2.2; }
    this.actAge += dt;
    this.v += (vT - this.v) * Math.min(1, acc * dt);
    this.beat += (beatT - this.beat) * Math.min(1, 3 * dt);
    this.finAmp += ((this.act === 'rest' ? 1.9 : this.act === 'slow' ? 1.3 : 1) - this.finAmp) * Math.min(1, 2 * dt);

    if (this.mode === 'feed') this.stepFeed(dt);
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
    var fx = this.x + hx * la, fy = this.y + hy * la, fd = p.sdf(fx, fy) + L * TUNE.wallIn;
    if (fd > 0) {
      // (it keeps that spot until it gets there, so it does not keep changing its mind)
      // (only if its spot is outside the area spots are picked from)
      if (!this.goal || p.sdf(this.goal.x, this.goal.y) > -L * TUNE.goalIn * 0.9) this.goal = this.goalAcross();
      var gx2 = this.goal.x - this.x, gy2 = this.goal.y - this.y;
      turn += clamp(this.goalTurn(Math.atan2(gy2, gx2)) * 2.5, -3, 3) * clamp(fd / (la * 0.5), 0.3, 1.5);
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
    // (a feeding koi close to its food does not give way: it pushes in, and the bump below slides it off the others)
    if (!(this.mode === 'feed' && this.food && Math.hypot(this.food.x - this.x, this.food.y - this.y) < L * 2.5)) this.v *= 1 - clamp(slow, 0, 0.8) * dt * 4;
    // (the push to steer round the other koi is capped, so it can not lock it in place)
    // (a feeding koi close to its food jostles: it steers round the others less and the bump slides it past)
    var feedNear = this.mode === 'feed' && this.food && Math.hypot(this.food.x - this.x, this.food.y - this.y) < L * 2.5;
    turn += clamp(avoidTurn * (feedNear ? 0.25 : this.mode === 'feed' ? 0.45 : 1), -TUNE.avoidMax, TUNE.avoidMax);
    // stuck at the edge for a while: it gives up that way and turns the other way round
    if (p.sdf(this.x, this.y) > -L * 0.04 && Math.abs(this.omega || 0) < 0.3) this.stuckT = (this.stuckT || 0) + dt;
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
    // a fin or the tail close to a pole of the fountain's stand: it turns
    // more gently, so its tail does not swing hard into the pole
    if (this.postNear) maxTurn *= 0.5;
    if (Math.abs(turn) > maxTurn * 0.8 && !this.kick && this.act === 'cruise') { this.kick = true; this.gaitT = 0.4 + r() * 0.3; }
    this.omega = (this.omega || 0) + (clamp(turn, -maxTurn, maxTurn) - (this.omega || 0)) * Math.min(1, TUNE.turnEase * A.ease * dt);
    this.heading += this.omega * dt;
    // fish drift forward as they turn: never slower than the turn needs to
    // keep its path no tighter than minTurnR (so the path can not double
    // back in a hairpin, which would make the tail flip from side to side)
    var vMin = Math.abs(this.omega) * L * TUNE.minTurnR * (this.mode === 'feed' && this.feedSlow < 0.6 ? 0.5 : 1);
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
    var dc = p.sdf(this.x, this.y);
    if (dc > 0) {
      var sx = this.x - ox0, sy = this.y - oy0, un = p.normal(this.x, this.y), ux = un.x, uy = un.y;
      // nose into the edge: it stops and turns first (as a fish does at a wall)
      if (Math.cos(this.heading) * ux + Math.sin(this.heading) * uy > TUNE.wallFace) {
        sx = 0; sy = 0; this.v *= 1 - Math.min(1, 6 * dt);
        // (a dart or a sudden turn ends there: it slows, and swims on calmly)
        if (this.act === 'dart' || this.act === 'snap') this.pickAct('slow');
      }
      var outward = sx * ux + sy * uy;
      if (outward > 0) { sx -= ux * outward; sy -= uy * outward; }
      this.x = ox0 + sx; this.y = oy0 + sy;
      var back = p.clampIn(this.x, this.y, 0); this.x = back.x; this.y = back.y;   // (the last hair, along the edge)
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
        var gq = p.clampIn(this.x + ax / al * L * TUNE.clearAway, this.y + ay / al * L * TUNE.clearAway, L * TUNE.goalIn);
        if (this.act === 'rest') this.pickAct('slow');
        // (a feeding koi keeps heading for its food, at the depth it holds)
        if (this.mode !== 'feed') { this.goal = gq; this.goalAge = 0; this.turnSign = 0; }
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

  /* FEEDING. The koi has noticed food: it swims over (at its own depth,
     rising to the surface as it gets close), takes the pellet with its
     mouth (rings on the water), and goes on to the next pellet near it;
     when there is none left near it, it swims on as before. */
  Koi.prototype.startFeed = function () {
    if (this.mode === 'exit') return;
    this.mode = 'feed'; this.dipFrom = null; this.diveDown = false; this.gulps = 0;
    this.food = null; this.feedSlow = 1; this.eatCool = 0;
    this.pickAct('feed');
  };
  Koi.prototype.stepFeed = function (dt) {
    var p = this.pond, L = this.L, i;
    this.eatCool = (this.eatCool || 0) - dt;
    var jz = -0.1 + (this.idx % 7) * 0.006;      // its own hair of depth at the surface (crowding koi keep their order)

    // 1. at the surface it takes whatever pellet is just in front of its
    // mouth (any pellet, not only the one it was after): it sucks it in
    // from very close, then takes it
    var near = 1e9, best = null, bd = 1e9;
    for (i = 0; i < p.food.length; i++) {
      var g = p.food[i];
      if (g.gone || g.sinking || g.t < 0) continue;
      var dg = Math.hypot(g.x - this.x, g.y - this.y);
      if (dg < near) near = dg;
      if (dg < L * TUNE.suck && dg < bd && Math.abs(angDiff(this.heading, Math.atan2(g.y - this.y, g.x - this.x))) < 1.2) { bd = dg; best = g; }
    }
    if (best && this.z < 0.06) {
      if (!this.suckFrom) this.suckFrom = bd / L;          // (kept for the checks)
      var pull = Math.min(bd, L * 0.9 * dt) / (bd || 1);
      best.x += (this.x - best.x) * pull; best.y += (this.y - best.y) * pull; best.vx = best.vy = 0;
      bd = Math.hypot(best.x - this.x, best.y - this.y);
      if (bd < L * TUNE.eatReach && this.eatCool <= 0) {
        p.eat(best, this);
        this.gulpT = 0; this.eatCool = 0.45 + this.r() * 0.4; this.suckFrom = 0;
        if (this.food === best) this.food = null;
      }
    }
    // near any food it stays up at the surface, whatever it is doing
    this.zT = near < L * TUNE.eatRise ? jz : Math.min(this.zHome, 0.12);

    // 2. which pellet it goes for: the nearest (they compete: the first
    // mouth there gets it), looked for again now and then as the others move
    var f = this.food;
    if (f && f === this.lastFood) {
      this.foodAge += dt;
      // chased the same pellet too long: it lets it go for a moment
      if (this.foodAge > 10) { f.skip = this; f.skipT = 2.5; f = this.food = null; }
    }
    this.retargetT = (this.retargetT || 0) - dt;
    if (!f || f.gone || f.sinking || this.retargetT <= 0) {
      this.retargetT = TUNE.retarget * (0.7 + this.r() * 0.6);
      f = this.food = p.nearestFood(this);
    }
    if (f !== this.lastFood) { this.lastFood = f; this.foodAge = 0; }
    if (!f) {
      if (near < 1e9) {
        // the only food near it is the pellet it let go for a moment: it
        // swims on a little and comes round again
        this.goal = { x: this.x + Math.cos(this.heading) * L, y: this.y + Math.sin(this.heading) * L }; this.goalAge = 0;
        this.feedSlow = 0.6;
        return;
      }
      // nothing left: back to its own swimming and depth
      this.mode = 'cruise'; this.zT = this.zHome; this.food = null; this.feedSlow = 1;
      this.pickAct('slow');
      return;
    }

    // 3. steering
    var d = Math.hypot(f.x - this.x, f.y - this.y);
    var off = Math.abs(angDiff(this.heading, Math.atan2(f.y - this.y, f.x - this.x)));
    // close, with the pellet off to its side, it lies inside its turning
    // circle: it can never bring its mouth onto it by turning, so it swims
    // straight on a little and comes round to it again (as koi do)
    this.outT = (this.outT || 0) - dt;
    if (this.outT <= 0 && ((d < L * 0.55 && off > 0.85) || (d < L * 1.5 && off > 1.6)) && d > L * TUNE.suck) this.outT = 0.35 + this.r() * 0.25;
    if (this.outT > 0) {
      this.goal = { x: this.x + Math.cos(this.heading) * L, y: this.y + Math.sin(this.heading) * L }; this.goalAge = 0;
      this.feedSlow = 0.55;
      return;
    }
    this.goal = { x: f.x, y: f.y }; this.goalAge = 0;
    // close: it slows to take it gently
    this.feedSlow = clamp(d / L, 0.45, 1) * (d < L * 1.5 ? Math.max(d < L * 0.8 ? 0.3 : 0.12, Math.cos(Math.min(off, Math.PI / 2))) : 1);
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
    snap:   { v: 0.42, beat: 0.9,  acc: 3,   steer: 2.5, turnR: 0.75, ease: 1.6, w: 0.10, t: [0.8, 1.3] },
    // swimming over to food (never picked at random)
    feed:   { v: 0.6,  beat: 0.85, acc: 2.2, steer: 2.2, turnR: 0.55, ease: 1.4, w: 0,    t: [9, 9] }
  };
  Koi.prototype.pickAct = function (force) {
    var r = this.r, name = force;
    if (!name) {
      // not the same mood twice running (except cruising)
      var total = 0, k2;
      for (k2 in MOODS) if ((k2 !== this.act || k2 === 'cruise') && MOODS[k2].w > 0) total += MOODS[k2].w;
      var pick = r() * total;
      for (k2 in MOODS) {
        if ((k2 === this.act && k2 !== 'cruise') || !(MOODS[k2].w > 0)) continue;
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
    else if (name === 'feed') this.goal = this.food ? { x: this.food.x, y: this.food.y } : this.goal;
    else this.goal = this.goalAcross();
  };
  /* A spot in the pool, at a turn of minA–maxA (radians, either way) from
     where the koi is heading, as far off as there is room for. */
  Koi.prototype.newGoal = function (minA, maxA, inward) {
    var p = this.pond, inset = this.L * TUNE.goalIn, r = this.r, here = p.sdf(this.x, this.y);
    for (var t = 0; t < 24; t++) {
      var a = this.heading + (r() < 0.5 ? -1 : 1) * (minA + r() * (maxA - minA));
      var dist = this.L * (0.5 + r() * 1.3);
      var gx = this.x + Math.cos(a) * dist, gy = this.y + Math.sin(a) * dist, gd = p.sdf(gx, gy);
      if (inward && gd > here) continue;
      if (gd > -inset) continue;
      // not a way that runs through another koi (one at about its depth)
      if (t < 20 && this.pathBlocked(gx, gy)) continue;
      return { x: gx, y: gy };
    }
    // no room that way: anywhere in the pond, spread evenly
    return p.randomPoint(inset * 1.2);
  };
  /* A spot somewhere across the pond (anywhere, evenly spread, but well
     away from where the koi is: at least s.roam × the pond's shorter
     half-size). Heading across every time makes it pass through open
     water and arrive facing the far side, where its next spot is as
     likely to its left as to its right: no circling. */
  Koi.prototype.goalAcross = function () {
    var p = this.pond, inset = this.L * TUNE.goalIn, best = null, bestD = -1;
    var far = Math.max(this.L * 1.1, (p.s.roam || 0.8) * p.span);
    for (var t = 0; t < 30; t++) {
      var q = p.randomPoint(inset), d = Math.hypot(q.x - this.x, q.y - this.y);
      if (d < far) { if (d > bestD) { bestD = d; best = q; } continue; }
      if (t < 24 && this.pathBlocked(q.x, q.y)) continue;
      return q;
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
    var p = this.pond, L = this.L, down = zTo > this.z, edge = TUNE.layer;
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
    var L = this.L, best = 9;
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
    var p = this.pond, me = this, clear = this.L * TUNE.pathClear;
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
    var p = this.pond, s = p.s, L = this.L, tr = this.trail, P = this.P;
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
    // a pole standing in the water (the fountain's stand): no part of the koi,
    // body, fins or tail, may pass through it. The body is never bent to dodge
    // it (that kinked it); the whole koi is moved off it as one piece, as a fish
    // nudging a post would be, keeping its natural shape.
    if (pool && p.posts && p.posts.length) {
      // (each pole in turn: the koi is moved to the side of the pole its body's
      // middle is on, by as much as its farthest-in point needs; a tip that has
      // got across is pulled back with the rest, never pushed on through)
      var self = this, sides = this._postSide || (this._postSide = []);
      var deepest = function (extra) {
        var pts = self.reachPoints(), mx = 0, my = 0, mm = 0, at = null;
        for (var qi = 0; qi < p.posts.length; qi++) {
          var q = p.posts[qi], vx = q.x1 - q.x0, vy = q.y1 - q.y0, ll = Math.sqrt(vx * vx + vy * vy) || 1;
          var nx = -vy / ll, ny = vx / ll, mid = P[9];
          // (the side is kept while the koi is near the pole, so a koi curving
          // round the pole's end is never flung across to the other side)
          var mc = (mid.x - q.x0) * nx + (mid.y - q.y0) * ny, mt = ((mid.x - q.x0) * vx + (mid.y - q.y0) * vy) / (ll * ll);
          var far = Math.abs(mc) > q.r + L || mt < -0.6 || mt > 1.6;
          if (!sides[qi] || far) sides[qi] = mc >= 0 ? 1 : -1;
          var side = sides[qi];
          for (var j = 0; j < pts.length; j++) {
            var px = pts[j].x - q.x0, py = pts[j].y - q.y0, t = (px * vx + py * vy) / (ll * ll), need = q.w + pts[j].h + extra, dx = 0, dy = 0;
            if (t >= 0 && t <= 1) {
              var dd = (px * nx + py * ny) * side;
              if (dd < need) { dx = nx * side * (need - dd); dy = ny * side * (need - dd); }
            } else {
              var ex = t < 0 ? px : pts[j].x - q.x1, ey = t < 0 ? py : pts[j].y - q.y1, ed = Math.hypot(ex, ey) || 1e-6;
              if (ed < need) { dx = ex / ed * (need - ed); dy = ey / ed * (need - ed); }
            }
            var pm = dx * dx + dy * dy; if (pm > mm) { mm = pm; mx = dx; my = dy; at = pts[j]; }
          }
        }
        return { x: mx, y: my, m: Math.sqrt(mm), at: at };
      };
      // the koi is turned about its head, as a fish whose tail meets a post
      // pivots away from it (its head stays put, so it never jumps); only a
      // touch right at the head moves it as one piece
      var head = P[0];
      var nudge = function (d, at) {
        var rx = at.x - head.x, ry = at.y - head.y, rr = rx * rx + ry * ry;
        if (rr < (L * 0.25) * (L * 0.25)) {
          for (var j = 0; j < N; j++) { P[j].x += d.x; P[j].y += d.y; if (self.C) { self.C[j].x += d.x; self.C[j].y += d.y; } }
          self.x += d.x; self.y += d.y;
          var hl = tr[tr.length - 1]; if (hl) { hl.x += d.x; hl.y += d.y; }
          return;
        }
        // the turn that moves the touching point across the pole by d
        var th = (rx * d.y - ry * d.x) / rr, need = Math.hypot(d.x, d.y) / Math.sqrt(rr);
        th = (th >= 0 ? 1 : -1) * Math.max(Math.abs(th), need * 0.9);
        var c = Math.cos(th), sn = Math.sin(th), hx = head.x, hy = head.y;
        var rot = function (o) { var ox = o.x - hx, oy = o.y - hy; o.x = hx + ox * c - oy * sn; o.y = hy + ox * sn + oy * c; };
        for (var j = 1; j < N; j++) { rot(P[j]); if (self.C) rot(self.C[j]); }
        self.heading += th;
      };
      // first gently, a little each frame, as soon as a fin or the tail comes
      // near (so the koi eases off the pole instead of being knocked off it)
      var soft = deepest(L * 0.18);
      if (soft.m > 0) {
        var cap = Math.min(soft.m, L * 0.012) / soft.m;
        nudge({ x: soft.x * cap, y: soft.y * cap }, soft.at)
      }
      this.postNear = soft.m > 0;
      // then, only if still touching, all the way off
      for (var pk = 0; pk < 6; pk++) {
        var hard = deepest(0);
        if (!hard.m) break;
        nudge(hard, hard.at);
      }
      // (the body's directions follow the turn)
      for (i = 0; i < N; i++) {
        var j0 = Math.max(0, i - 1), j1 = Math.min(N - 1, i + 1);
        var ux = P[j1].x - P[j0].x, uy = P[j1].y - P[j0].y, ul = Math.hypot(ux, uy) || 1;
        this.T[i].x = ux / ul; this.T[i].y = uy / ul; this.Nn[i].x = -uy / ul; this.Nn[i].y = ux / ul;
      }
    }
  };
  // every point of the koi as it will be drawn this frame, with how far round
  // it reaches: the body's spine (its half width), the four fins (their edges
  // and tips) and the tail fan; a small margin for the slight growth of a koi
  // coming up to the surface (drawn up to 5 % larger about its middle)
  Koi.prototype.reachPoints = function () {
    var L = this.L, m = L * 0.03, out = [], i, Pp = this.P;
    for (i = 0; i < N; i++) out.push({ x: Pp[i].x, y: Pp[i].y, h: this.W[i] + m });
    var parts = koiParts(this, this.pond.s);
    parts.fins.forEach(function (F) {
      [F.a, F.b, F.tip].concat(F.rays).forEach(function (q) { out.push({ x: q.x, y: q.y, h: m }); });
      out.push({ x: (F.root.x + F.tip.x) / 2, y: (F.root.y + F.tip.y) / 2, h: m });
    });
    var T = parts.tail;
    [T.t1, T.t2, T.notch, T.c1, T.c2].concat(T.rays).forEach(function (q) { out.push({ x: q.x, y: q.y, h: m }); });
    [[T.base, T.t1], [T.base, T.t2]].forEach(function (e) { out.push({ x: (e[0].x + e[1].x) / 2, y: (e[0].y + e[1].y) / 2, h: m }); });
    return out;
  };

  /* A point on the body: x along (0 nose, 1 tail root), y across (-1..1). */
  Koi.prototype.at = function (x, y) {
    var f = clamp(x, 0, 1) * (N - 1), i = Math.min(N - 2, Math.floor(f)), t = f - i;
    var P = this.P, Nn = this.Nn;
    var cx = lerp(P[i].x, P[i + 1].x, t), cy = lerp(P[i].y, P[i + 1].y, t);
    var nx = lerp(Nn[i].x, Nn[i + 1].x, t), ny = lerp(Nn[i].y, Nn[i + 1].y, t);
    var w = bodyW(clamp(x, 0.02, 1)) * this.L * 0.14 * this.pond.s.girth;
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
    var L = this.L, f = clamp(x, 0, 1) * (N - 1), i = Math.round(f);
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
    var s = this.pond.s, L = this.L, e = N - 1;
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
      // (the pond gives each koi its variety; every pattern is laid out
      // from the koi's own seed, so no two koi match)
      var kind = k.kind || 'kohaku';
      var own = true;
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
      } else if (kind === 'asagi') {
        // asagi: a blue-grey back netted with darker scales, the head pale,
        // red-orange low along the sides and at the base of the fins
        k.body = '#9AAAB8';
        k.patches = [
          spot(0.1, 0, 0.11, 0.6, '#D9DFE3'),
          spot(0.36, 0.92, 0.2, 0.22, '#D9663A'),
          spot(0.36, -0.92, 0.2, 0.22, '#D66438'),
          spot(0.68, 0.88, 0.16, 0.2, '#DC6E40'),
          spot(0.68, -0.88, 0.16, 0.2, '#D86A3C')
        ];
        k.back = 'rgba(60, 82, 104, 0.35)';
        k.finCol = 'rgba(226, 132, 92, 0.72)';
        k.finRay = 'rgba(255, 226, 206, 0.6)';
        k.finEdge = 'rgba(170, 84, 50, 0.4)';
        k.eye = '#22282E'; k.edge = 'rgba(60, 76, 92, 0.45)'; k.rim = 'rgba(236, 242, 246, 0.8)';
        k.scales = 'rgba(46, 64, 84, 0.55)'; k.net = true;
      } else if (kind === 'shiro') {
        // shiro utsuri: ink black wrapping a white body
        k.body = '#FFF8F1';
        k.patches = [
          spot(0.14, -0.3, 0.12, 0.65, '#27211F'),
          spot(0.36, 0.45, 0.16, 0.7, '#2A2321'),
          spot(0.6, -0.4, 0.14, 0.75, '#27211F'),
          spot(0.82, 0.3, 0.1, 0.6, '#2A2321')
        ];
        k.back = 'rgba(0, 0, 0, 0.0)';
        k.finCol = 'rgba(250, 246, 240, 0.78)';
        k.finRay = 'rgba(60, 52, 48, 0.55)';
        k.finEdge = 'rgba(40, 34, 32, 0.4)';
        k.eye = '#1A1412'; k.edge = 'rgba(90, 80, 76, 0.35)'; k.rim = 'rgba(255,255,255,0.85)';
        k.scales = 'rgba(160, 140, 132, 0.2)';
      } else if (kind === 'bekko') {
        // shiro bekko: white, with small black spots on the back only (none on the head)
        k.body = '#FFF9F3';
        k.patches = [
          spot(0.3, 0.3, 0.05, 0.3, '#2A2321'),
          spot(0.42, -0.25, 0.06, 0.32, '#27211F'),
          spot(0.56, 0.35, 0.05, 0.26, '#2A2321'),
          spot(0.68, -0.15, 0.045, 0.24, '#27211F'),
          spot(0.8, 0.2, 0.04, 0.2, '#2A2321')
        ];
        k.back = 'rgba(255, 255, 255, 0.0)';
        k.finCol = 'rgba(255, 252, 248, 0.8)';
        k.finRay = 'rgba(205, 192, 186, 0.6)';
        k.finEdge = 'rgba(180, 160, 152, 0.35)';
        k.eye = '#3A2A26'; k.edge = 'rgba(150, 128, 120, 0.32)'; k.rim = 'rgba(255,255,255,0.92)';
        k.scales = 'rgba(190, 165, 158, 0.2)';
      } else if (kind === 'goshiki') {
        // goshiki: red patches over a dark blue-grey netted body (five colours)
        k.body = '#6A727C';
        k.patches = [
          spot(0.13, 0.05, 0.12, 0.7, '#C8402A'),
          spot(0.44, -0.2, 0.15, 0.72, '#C33C28'),
          spot(0.7, 0.3, 0.1, 0.6, '#C8442C'),
          spot(0.3, 0.75, 0.07, 0.25, '#A9B1B8')
        ];
        k.back = 'rgba(30, 36, 44, 0.35)';
        k.finCol = 'rgba(150, 156, 164, 0.72)';
        k.finRay = 'rgba(236, 238, 240, 0.55)';
        k.finEdge = 'rgba(50, 56, 64, 0.45)';
        k.eye = '#15181C'; k.edge = 'rgba(30, 36, 44, 0.5)'; k.rim = 'rgba(226, 230, 234, 0.6)';
        k.scales = 'rgba(28, 34, 44, 0.5)'; k.net = true;
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

  function koiParts(k, s) {
    var fl = 0.32 * s.fins * (k.finAmp || 1);
    return {
      out: k.outline(), tail: k.tail(),
      fins: [
        k.fin(0.2, 1, 0.24, 0.95, fl * Math.sin(k.finPhase)),
        k.fin(0.2, -1, 0.24, 0.95, fl * Math.sin(k.finPhase + 0.6)),
        k.fin(0.52, 1, 0.13, 0.8, fl * 0.7 * Math.sin(k.finPhase + 1.3)),
        k.fin(0.52, -1, 0.13, 0.8, fl * 0.7 * Math.sin(k.finPhase + 1.9))
      ]
    };
  }
  /* The koi's shadow on the pond floor, filled flat (no blur filter: the
     pond lays all the shadows on one small picture and scales it up, which
     softens them). */
  // the panel's shadow opacity (a multiplier, 1 = as it was) and feather
  // (a multiplier on how far the shadow's edge softens out, 1 = as it was)
  function shadowOp(s) { return s.shadowOpacity == null ? 1 : s.shadowOpacity; }
  function shadowFe(s) { return s.shadowFeather == null ? 1 : s.shadowFeather; }
  function drawKoiShadow(ctx, k, s) {
    var P = koiParts(k, s), L = k.L;
    ctx.translate(L * 0.035 * s.shadow, L * 0.075 * s.shadow);
    ctx.fillStyle = 'rgba(176, 72, 22, ' + Math.min(1, (0.16 + 0.04 * s.shadow) * shadowOp(s)).toFixed(3) + ')';
    ctx.beginPath(); smoothClosed(ctx, P.out); tailPath(ctx, P.tail);
    P.fins.forEach(function (F) { finPath(ctx, F); });
    ctx.fill();
  }

  function drawSolidKoi(ctx, k, s) {
    var L = k.L, parts = koiParts(k, s), out = parts.out, tail = parts.tail, fins = parts.fins;
    // (the pond draws the shadows itself, on their own small picture)
    if (false) {
      ctx.save();
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
      ctx.strokeStyle = k.scales; ctx.lineWidth = L * (k.net ? 0.009 : 0.006);
      ctx.beginPath();
      for (var sx = 0.26, row = 0; sx < 0.9; sx += 0.055, row++) {
        for (var sy = -0.75 + (row % 2) * (k.net ? 0.17 : 0.25); sy <= 0.76; sy += k.net ? 0.34 : 0.5) {
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
     5. THE POND (the whole canvas, its koi, its food, its own loop)
     The pond's edge is a rectangle with rounded corners, a margin
     inside the canvas (s.edge × the koi's length), so the koi turn
     back before they leave the screen. sdf(x, y) is how far a point
     is outside that edge (negative inside), in pixels.
     ============================================================ */
  function Pond(canvas, settings) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d');
    this.s = settings;
    this.fish = []; this.t = 0; this.acc = 0; this.rings = []; this.food = []; this.laps = []; this.lapT = 0; this.drops = []; this.rnd = rng(97);
    this.off = document.createElement('canvas'); this.offCtx = this.off.getContext('2d');
    this.resize(); this.rebuild();
  }
  Pond.prototype.resize = function () {
    var r = this.canvas.getBoundingClientRect();
    this.W = r.width || 800; this.H = r.height || 600;
    var dpr = Math.min(this.s.maxDpr || 2, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(this.W * dpr); this.canvas.height = Math.round(this.H * dpr);
    this.off.width = 64; this.off.height = 64;   // (the little picture for diving koi: grows when needed)
    this.dpr = dpr;
    this.hw = this.W / 2; this.hh = this.H / 2;        // the canvas's middle
    this.shape();
  };
  // the koi's length and the pond's edge from the settings
  Pond.prototype.shape = function () {
    var s = this.s;
    this.L = Math.min(this.W, this.H) * (s.length || 0.16);
    var m = this.L * (s.edge === undefined ? 0.6 : s.edge);
    // s.bottomIn: CSS pixels kept clear along the bottom (the rocks of the
    // pond's edge in koiscreen.html); the pond's middle moves up by half of it
    var bi = Math.max(0, Math.min(s.bottomIn || 0, this.H * 0.6));
    this.oy = -bi / 2;
    this.ex = Math.max(this.L, this.hw - m); this.ey = Math.max(this.L, this.hh - m - bi / 2);
    this.rc = Math.min(this.ex, this.ey) * 0.45;         // rounded corners
    this.span = Math.min(this.ex, this.ey);
    // s.floor: the line of the rocks along the bottom (koiscreen.html):
    // { g: CSS pixels a column, y: [screen y of the rocks' top, a column] };
    // the koi keep s.floorGap × their length above it
    this.fl = (s.floor && s.floor.y && s.floor.y.length) ? s.floor : null;
    this.flGap = this.L * (s.floorGap === undefined ? 0.35 : s.floorGap);
    // s.fountain: where the fountain's water lands (koiscreen.html), { x, y, r }
    // in screen pixels: the koi keep out of that circle, as from an edge
    this.fn = (s.fountain && s.fountain.r > 0) ? { x: s.fountain.x - this.hw, y: s.fountain.y - this.hh, r: s.fountain.r } : null;
    // s.posts: things standing in the water the koi must swim round (the
    // fountain's poles, koiscreen.html): [{ x0, y0, x1, y1, r }] in screen
    // pixels, each a line from x0,y0 to x1,y1 kept r clear on every side
    var hw = this.hw, hh = this.hh;
    this.posts = (s.posts || []).map(function (P) { return { x0: P.x0 - hw, y0: P.y0 - hh, x1: P.x1 - hw, y1: P.y1 - hh, r: P.r, w: P.w || 0 }; });
    for (var i = 0; i < this.fish.length; i++) this.fish[i].size();
  };
  // the rocks' line at x (pond coordinates; gap: kept clear above it) and its slope
  // (gap false: the rocks' own outline, for the waves; gap true: the line the koi keep to)
  Pond.prototype.rockLine = function (x, gap) {
    var F = this.fl, Y = gap ? F.y : (F.yw || F.y), n = Y.length, u = clamp((x + this.hw) / F.g, 0, n - 1.001), i = Math.floor(u), f = u - i;
    var y0 = Y[i], y1 = Y[Math.min(n - 1, i + 1)];
    return { y: y0 + (y1 - y0) * f - this.hh - (gap ? this.flGap : 0), slope: (y1 - y0) / F.g };
  };
  Pond.prototype.sdf = function (x, y) {
    var x0 = x, y0 = y;
    y -= this.oy || 0;
    var qx = Math.abs(x) - (this.ex - this.rc), qy = Math.abs(y) - (this.ey - this.rc);
    var d = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - this.rc;
    if (this.fl) {
      var R = this.rockLine(x0, true);
      d = Math.max(d, (y0 - R.y) / Math.sqrt(1 + R.slope * R.slope));
    }
    if (this.fn || (this.posts && this.posts.length)) { var o = this.obstacle(x0, y0); if (o) d = Math.max(d, o.d); }
    return d;
  };
  // a point of a koi's body (with its half width) inside a pole: how far to
  // move it so it lies clear of the pole (null when clear)
  Pond.prototype.postOut = function (x, y, half) {
    var P = this.posts; if (!P || !P.length) return null;
    var mx = 0, my = 0, hit = false;
    for (var i = 0; i < P.length; i++) {
      var q = P[i], vx = q.x1 - q.x0, vy = q.y1 - q.y0, ll = vx * vx + vy * vy || 1;
      var t = clamp(((x + mx - q.x0) * vx + (y + my - q.y0) * vy) / ll, 0, 1);
      var ax = x + mx - (q.x0 + vx * t), ay = y + my - (q.y0 + vy * t), ad = Math.hypot(ax, ay), need = q.w + half;
      if (ad >= need) continue;
      if (ad < 1e-6) { ax = -vy; ay = vx; ad = Math.sqrt(ll); }
      mx += ax / ad * (need - ad); my += ay / ad * (need - ad); hit = true;
    }
    return hit ? { x: mx, y: my } : null;
  };
  // the obstacle standing in the water nearest to being entered at (x, y):
  // { d: how far inside its keep-clear zone (negative: outside), x, y: the way out of it }
  Pond.prototype.obstacle = function (x, y) {
    var best = null;
    if (this.fn) {
      var fx = x - this.fn.x, fy = y - this.fn.y, fd = Math.hypot(fx, fy) || 1;
      best = { d: this.fn.r - fd, x: fx / fd, y: fy / fd };
    }
    var P = this.posts || [];
    for (var i = 0; i < P.length; i++) {
      var q = P[i], vx = q.x1 - q.x0, vy = q.y1 - q.y0, ll = vx * vx + vy * vy || 1;
      var t = clamp(((x - q.x0) * vx + (y - q.y0) * vy) / ll, 0, 1);
      var ax = x - (q.x0 + vx * t), ay = y - (q.y0 + vy * t), ad = Math.hypot(ax, ay);
      if (ad < 1e-6) { ax = -vy; ay = vx; ad = Math.sqrt(ll); }
      var dd = q.r - ad;
      if (!best || dd > best.d) best = { d: dd, x: ax / ad, y: ay / ad };
    }
    return best;
  };
  // the outward direction of the edge nearest (x, y)
  Pond.prototype.normal = function (x, y) {
    if (this.fn || (this.posts && this.posts.length)) {
      // inside (or nearest) the fountain's circle or a pole's zone: out of it is "inward"
      var o = this.obstacle(x, y);
      if (o && o.d >= this.sdfNoFn(x, y)) return { x: -o.x, y: -o.y };
    }
    if (this.fl) {
      var R = this.rockLine(x, true), l0 = Math.sqrt(1 + R.slope * R.slope), df = (y - R.y) / l0;
      var yy = y - (this.oy || 0), qx0 = Math.abs(x) - (this.ex - this.rc), qy0 = Math.abs(yy) - (this.ey - this.rc);
      var dr = Math.hypot(Math.max(qx0, 0), Math.max(qy0, 0)) + Math.min(Math.max(qx0, qy0), 0) - this.rc;
      if (df >= dr) return { x: -R.slope / l0, y: 1 / l0 };
    }
    y -= this.oy || 0;
    var qx = Math.abs(x) - (this.ex - this.rc), qy = Math.abs(y) - (this.ey - this.rc), nx, ny;
    if (qx > 0 && qy > 0) { var l = Math.hypot(qx, qy) || 1; nx = qx / l; ny = qy / l; }
    else if (qx > qy) { nx = 1; ny = 0; } else { nx = 0; ny = 1; }
    return { x: nx * (x < 0 ? -1 : 1), y: ny * (y < 0 ? -1 : 1) };
  };
  Pond.prototype.sdfNoFn = function (x, y) {
    var keep = this.fn, kp = this.posts; this.fn = null; this.posts = null;
    var d = this.sdf(x, y); this.fn = keep; this.posts = kp; return d;
  };
  // (x, y) moved inside the edge by at least inset, along the edge's normal
  Pond.prototype.clampIn = function (x, y, inset) {
    for (var k = 0; k < 3; k++) {
      var d = this.sdf(x, y) + inset;
      if (d <= 0) break;
      var n = this.normal(x, y); x -= n.x * d; y -= n.y * d;
    }
    return { x: x, y: y };
  };
  Pond.prototype.randomPoint = function (inset) {
    var r = this.rnd;
    for (var t = 0; t < 30; t++) {
      var x = (r() * 2 - 1) * this.ex, y = (this.oy || 0) + (r() * 2 - 1) * this.ey;
      if (this.sdf(x, y) < -inset) return { x: x, y: y };
    }
    return { x: 0, y: 0 };
  };
  Pond.prototype.rebuild = function () {
    var s = this.s;
    this.fish = []; this.food = []; this.rings = []; this.laps = []; this.drops = [];
    var kinds = s.kinds || ['kohaku'];
    for (var i = 0; i < kinds.length; i++) {
      var k = new Koi(this, i, (s.seed || 1) * 1234 + i * 777);
      k.kind = kinds[i];
      this.fish.push(k);
    }
    var look = LOOKS.nishiki;
    this.fish.forEach(function (k) { look.setup(k); });
    this.fish.forEach(function (k) { k.reset(); });
    // warm up together, so the koi already have trails (and keep apart)
    this.t = 0;
    for (var w = 0; w < 500; w++) {
      this.t += 1 / 120;
      for (i = 0; i < this.fish.length; i++) this.fish[i].step(1 / 120, this.t);
    }
    this.rings = [];
  };

  /* Waves lapping at the rocks. A pond, not the sea: a small, low ripple
     starts only a short way out (s.lapStart × the koi's length short of
     the highest rock it will reach) and runs in as a gentle, nearly
     straight line along the rocks' broad line (ys). Each part of it meets
     the rocks' outline (yw) at its own moment: the taller rocks first,
     the dips between them later. Where it meets them it breaks (white
     foam along the rock), and from there it runs back out as the mirror
     of the incoming line about the outline (y = 2·yw − y_in), so the
     returning ripple takes the rocks' shape only once it has hit them,
     weaker, fading as it goes. They come by themselves now and then
     (s.lapEvery s apart, on average) and from a koi swimming close to the
     rocks (its wake: s.koiWake). */
  Pond.prototype.lapLines = function (x) {
    var F = this.fl, n = F.yw.length, u = clamp((x + this.hw) / F.g, 0, n - 1.001), i0 = Math.floor(u), f0 = u - i0;
    var yw = F.yw[i0] + (F.yw[i0 + 1] - F.yw[i0]) * f0, ys = F.ys ? F.ys[i0] + (F.ys[i0 + 1] - F.ys[i0]) * f0 : yw;
    return { yw: yw - this.hh + this.L * 0.015, ys: ys - this.hh };
  };
  Pond.prototype.addLap = function (x, d0, a, hl) {
    if (this.laps.length > 24) return;
    var L = this.L, lo = 1e9, hi = -1e9;
    for (var j = 0; j <= 16; j++) {
      var q = this.lapLines(x + (j / 8 - 1) * hl), g = q.yw - q.ys;
      lo = Math.min(lo, g); hi = Math.max(hi, g);
    }
    this.laps.push({ x: x, hl: hl, a: a, s: lo - d0, sEnd: hi + L * 0.75, v: L * (0.2 + this.rnd() * 0.08) * (this.s.lapSpeed || 1),
                     seed: Math.floor(this.rnd() * 1e6), t: 0 });
  };
  Pond.prototype.stepLaps = function (dt) {
    var s = this.s, L = this.L;
    if (!this.fl) { this.laps.length = 0; return; }
    var start = s.lapStart === undefined ? 0.3 : s.lapStart;
    var every = s.lapEvery === undefined ? 1.4 : s.lapEvery;
    if (every > 0 && this.rnd() < dt / every)
      this.addLap((this.rnd() * 2 - 1) * this.hw, L * start * (0.7 + this.rnd() * 0.6), 0.55 + this.rnd() * 0.45, L * (0.3 + this.rnd() * 0.45));
    // a koi near the rocks: its wake runs on to them
    var wake = s.koiWake === undefined ? 1 : s.koiWake;
    if (wake > 0) for (var j = 0; j < this.fish.length; j++) {
      var k = this.fish[j];
      k.wakeT = (k.wakeT || 0) - dt;
      if (k.wakeT > 0 || k.z > 0.35 || k.v < L * 0.15) continue;
      var q = this.lapLines(k.x), dd = q.yw - k.y;
      if (dd > 0 && dd < L * 1.1) {
        this.addLap(k.x, clamp(dd * 0.4, L * 0.1, L * start), wake * clamp(k.v / (L * 0.6), 0.35, 1) * 0.7, L * (0.22 + 0.15 * this.rnd()));
        k.wakeT = 1.6 + this.rnd() * 1.4;
      }
    }
    for (var i = this.laps.length - 1; i >= 0; i--) {
      var w = this.laps[i];
      w.t += dt; w.s += w.v * dt;
      if (w.s > w.sEnd) this.laps.splice(i, 1);
    }
  };
  Pond.prototype.drawLaps = function (ctx) {
    if (!this.fl || !this.laps.length) return;
    var s = this.s, L = this.L, str = s.lapStrength === undefined ? 1 : s.lapStrength;
    if (str <= 0) return;
    var N = 32, P = [];
    ctx.save(); ctx.lineCap = 'butt'; ctx.lineJoin = 'round';
    function seg(p0, p1, w, col, al) {
      if (al <= 0.004) return;
      ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y);
      ctx.lineWidth = w; ctx.strokeStyle = 'rgba(' + col + ', ' + Math.min(1, al).toFixed(3) + ')'; ctx.stroke();
    }
    for (var i = 0; i < this.laps.length; i++) {
      var w = this.laps[i], a = w.a * str * clamp(w.t / 0.5, 0, 1);
      // each sample across the ripple: where the incoming line is now, and
      // how far past the rock's outline it has run (> 0: it has hit there)
      for (var j = 0; j <= N; j++) {
        var u = j / N * 2 - 1, x = w.x + u * w.hl, q = this.lapLines(x);
        var yi = q.ys + w.s + (1 - u * u) * L * 0.03;        // its middle a little ahead
        P[j] = { x: x, u: u, yi: yi, yw: q.yw, ys: q.ys, past: yi - q.yw, taper: Math.pow(Math.cos(u * Math.PI / 2), 1.3) };
      }
      for (j = 0; j < N; j++) {
        var A = P[j], B = P[j + 1], um = (A.u + B.u) / 2, tp = (A.taper + B.taper) / 2;
        if (A.past < 0 && B.past < 0) {
          // coming in: trough behind (toward the open water), crest ahead
          seg({ x: A.x, y: A.yi - L * 0.04 }, { x: B.x, y: B.yi - L * 0.04 }, L * 0.05 + 0.5, '186, 88, 36', 0.22 * a * tp);
          seg({ x: A.x, y: A.yi }, { x: B.x, y: B.yi }, L * 0.022 + 0.5, '255, 255, 255', 0.85 * a * tp);
        } else if (A.past > 0 && B.past > 0) {
          // running back out: the mirror of the incoming line about the rocks
          // (just off the rocks it has their shape; it smooths out quickly as
          // it spreads, toward a plain line about the rocks' broad line)
          var ka = clamp(A.past / (L * 0.3), 0, 1), kb = clamp(B.past / (L * 0.3), 0, 1);
          ka = ka * ka * (3 - 2 * ka); kb = kb * kb * (3 - 2 * kb);
          var ya = 2 * A.yw - A.yi + (2 * A.ys - 2 * A.yw) * ka, yb = 2 * B.yw - B.yi + (2 * B.ys - 2 * B.yw) * kb, tr = (A.past + B.past) / 2;
          var fade = 0.6 * Math.max(0, 1 - tr / (L * 0.75));
          seg({ x: A.x, y: ya + L * 0.04 }, { x: B.x, y: yb + L * 0.04 }, L * 0.05 + 0.5, '186, 88, 36', 0.2 * a * tp * fade);
          seg({ x: A.x, y: ya }, { x: B.x, y: yb }, L * 0.022 + 0.5, '255, 255, 255', 0.85 * a * tp * fade);
        }
        // breaking: foam along the rock where it has just hit
        var pm = (A.past + B.past) / 2;
        if (pm > -L * 0.01 && pm < L * 0.22) {
          var fo = Math.pow(1 - clamp(pm / (L * 0.22), 0, 1), 1.4);
          seg({ x: A.x, y: A.yw - L * 0.02 }, { x: B.x, y: B.yw - L * 0.02 }, L * (0.05 + 0.04 * (1 - fo)), '255, 255, 255', 0.5 * a * tp * fo);
        }
      }
      // flecks of foam: each its own spot, showing just after the ripple reaches it
      var r = rng(w.seed);
      for (var f = 0; f < 34; f++) {
        var fu = r() * 2 - 1, fx = w.x + fu * w.hl, qf = this.lapLines(fx);
        var fyi = qf.ys + w.s + (1 - fu * fu) * L * 0.03, fp = fyi - qf.yw - r() * L * 0.04;
        if (fp < 0 || fp > L * 0.25) continue;
        var ff = 1 - fp / (L * 0.25), rr = L * (0.008 + r() * 0.018) * (0.6 + ff * 0.5);
        ctx.beginPath(); ctx.arc(fx, qf.yw - L * (0.01 + r() * 0.06) * (1 + (1 - ff) * 1.5), rr, 0, TAU);
        ctx.fillStyle = 'rgba(255, 255, 255, ' + Math.min(1, 0.95 * a * ff * Math.cos(fu * Math.PI / 2)).toFixed(3) + ')'; ctx.fill();
      }
    }
    ctx.restore();
  };

  /* Koi snatching for food churn the water: each koi taking food at the
     surface sends little rings out from its mouth now and then, and where
     several crowd the same food they slap with their tails and throw up
     drops (s.feedSplash scales it all; eating itself splashes too). */
  Pond.prototype.stepChurn = function (dt) {
    var ch = this.s.feedSplash === undefined ? 1 : this.s.feedSplash, L = this.L, fish = this.fish;
    for (var i = this.drops.length - 1; i >= 0; i--) {
      var d = this.drops[i]; d.t += dt; d.x += d.vx * dt; d.y += d.vy * dt; d.vx *= Math.pow(0.05, dt); d.vy *= Math.pow(0.05, dt);
      if (d.t > d.life) { this.drops.splice(i, 1); if (this.rnd() < 0.25 && this.rings.length < 70) this.rings.push({ x: d.x, y: d.y, t: 0.6, L: L * 0.25 }); }
    }
    if (ch <= 0) return;
    for (var j = 0; j < fish.length; j++) {
      var k = fish[j];
      if (k.mode !== 'feed' || k.z > 0.08 || !k.food) continue;
      var m = k.at(0, 0);
      if (Math.hypot(k.food.x - m.x, k.food.y - m.y) > k.L * 1.3) continue;
      // how many others crowd the same food
      var crowd = 0;
      for (var o = 0; o < fish.length; o++) {
        var ko = fish[o];
        if (ko !== k && ko.mode === 'feed' && ko.z < 0.1 && Math.hypot(ko.x - k.x, ko.y - k.y) < k.L * 1.2) crowd++;
      }
      // mouth ripples (more when crowded and when it is pushing hard)
      if (this.rnd() < dt * ch * (1.6 + crowd * 1.2) && this.rings.length < 70)
        this.rings.push({ x: m.x, y: m.y, t: 0.2 + this.rnd() * 0.3, L: k.L * (0.4 + 0.25 * this.rnd()) });
      if (crowd > 0) {
        // tail slaps and the swirl behind a jostling koi
        if (this.rnd() < dt * ch * crowd * 0.9 && this.rings.length < 70) {
          var tl = k.P[k.P.length - 1];
          this.rings.push({ x: tl.x, y: tl.y, t: 0.1, L: k.L * (0.45 + 0.3 * this.rnd()) });
          this.splash(tl.x, tl.y, Math.round(2 + 3 * ch), k.L * 0.6);
        }
        // drops off the mouths as they gulp at the surface together
        if (this.rnd() < dt * ch * crowd * 1.4) this.splash(m.x, m.y, Math.round(1 + 2 * ch), k.L * 0.5);
      }
    }
  };
  Pond.prototype.drawDrops = function (ctx) {
    if (!this.drops.length) return;
    for (var i = 0; i < this.drops.length; i++) {
      var d = this.drops[i], f = d.t / d.life, al = Math.sin(Math.PI * Math.min(1, f * 1.2 + 0.1));
      // a drop in the air: its little shadow on the water, then the drop
      ctx.beginPath(); ctx.arc(d.x + d.r * 1.6, d.y + d.r * 2.4, d.r * 0.9, 0, TAU);
      ctx.fillStyle = 'rgba(176, 72, 22, ' + (0.16 * al).toFixed(3) + ')'; ctx.fill();
      ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, TAU);
      ctx.fillStyle = 'rgba(255, 255, 255, ' + (0.95 * al).toFixed(3) + ')'; ctx.fill();
    }
  };

  /* Now and then a koi dives or comes up for air (s.airMax at most at the
     surface at once); the others stay at their own cruising depth. */
  Pond.prototype.events = function (dt) {
    var s = this.s;
    for (var i = this.rings.length - 1; i >= 0; i--) { this.rings[i].t += dt; if (this.rings[i].t > 1.6) this.rings.splice(i, 1); }
    this.stepLaps(dt);
    this.stepChurn(dt);
    var fish = this.fish, n = fish.length;
    // koi that noticed food come over after a moment
    for (var j = 0; j < n; j++) {
      var f = fish[j];
      if (f.feedDelay === undefined) continue;
      f.feedDelay -= dt;
      if (f.feedDelay <= 0) { f.feedDelay = undefined; if (f.mode !== 'feed' && this.nearestFood(f)) f.startFeed(); }
    }
    // a koi swimming near floating food notices it and joins in
    if (this.food.length) {
      for (j = 0; j < n; j++) {
        var kj = fish[j];
        if (kj.mode === 'feed' || kj.mode === 'exit' || kj.feedDelay !== undefined || (kj.mode === 'dive' && kj.diveDown)) continue;
        if (Math.random() > dt * 2) continue;                 // about twice a second it looks
        for (var fi = 0; fi < this.food.length; fi++) {
          var fd = this.food[fi];
          if (fd.gone || fd.sinking || fd.t < 0) continue;
          if (Math.hypot(fd.x - kj.x, fd.y - kj.y) < kj.L * 2.5 && Math.random() < (s.feedJoin === undefined ? 0.85 : s.feedJoin)) { kj.feedDelay = 0.2 + Math.random() * 0.5; break; }
        }
      }
    }
    if (!(s.eventEvery > 0)) return;
    // each koi decides for itself, so several can be down at once (each
    // at its own depth); only so many at the surface at a time
    var nEv = Math.min(n, 6);     // (in a big pond the events don't get rarer per koi beyond 6)
    for (j = 0; j < n; j++) {
      var k = fish[j];
      if (k.mode !== 'cruise' || Math.abs(k.z - k.zHome) > 0.08 || k.feedDelay !== undefined) continue;
      if (k.restT === undefined) k.restT = s.eventEvery * nEv * (0.3 + Math.random() * 0.9);
      k.restT -= dt;
      if (k.restT > 0) continue;
      k.restT = s.eventEvery * nEv * (0.6 + Math.random() * 0.8);
      var up = fish.filter(function (o) { return o !== k && (o.mode === 'air' || o.z < o.zHome - 0.03); }).length;
      k.startMode(Math.random() < s.airShare && up < (s.airMax || 1) ? 'air' : 'dive');
    }
  };

  /* FOOD. A tap scatters s.foodCount pellets round the point; each floats,
     drifting a little, and after s.foodLife seconds, if nobody ate it,
     sinks and fades. Koi within s.feedNear (× the pond's shorter size)
     notice it (each with the chance s.feedJoin), the nearest first. */
  Pond.prototype.feed = function (x, y) {
    var s = this.s, L = this.L, r = this.rnd, c = this.clampIn(x, y, L * 0.45);
    var n = Math.max(1, Math.round(s.foodCount || 6));
    for (var i = 0; i < n && this.food.length < 80; i++) {
      var a = r() * TAU, d = L * (s.foodSpread || 0.4) * Math.sqrt(r());
      var q = this.clampIn(c.x + Math.cos(a) * d, c.y + Math.sin(a) * d, L * 0.4);
      // (it lands still moving: it glides on outward from the throw, slowing)
      var gl = L * (0.12 + r() * 0.3) * (s.foodDrift === undefined ? 1 : s.foodDrift);
      this.food.push({ x: q.x, y: q.y, vx: Math.cos(a) * gl + (r() - 0.5) * L * 0.08, vy: Math.sin(a) * gl + (r() - 0.5) * L * 0.08,
                       t: -r() * 0.25, size: 0.8 + r() * 0.45, tone: r(), spin: r() * TAU, sv: (r() - 0.5) * 0.8,
                       wa: r() * TAU, sinking: false, sinkT: 0, gone: false });
    }
    // the koi that notice it
    var near = (s.feedNear || 0.7) * Math.min(this.W, this.H);
    for (var j = 0; j < this.fish.length; j++) {
      var k = this.fish[j];
      if (k.mode === 'exit') continue;
      var dk = Math.hypot(k.x - c.x, k.y - c.y);
      var chance = (s.feedJoin === undefined ? 0.85 : s.feedJoin) * (dk < near ? 1 : 0.3);
      if (k.mode === 'feed' || Math.random() > chance) continue;
      var delay = 0.25 + dk / (L * 5) + Math.random() * 1.2;
      k.feedDelay = k.feedDelay === undefined ? delay : Math.min(k.feedDelay, delay);
    }
  };
  // the pellet this koi goes for: the nearest floating one, a little
  // further if another koi is already closer to it
  Pond.prototype.nearestFood = function (k, any) {
    var best = null, bd = 1e9, L = k.L, reach = (this.s.feedNear || 0.7) * Math.min(this.W, this.H) * 1.6;
    for (var i = 0; i < this.food.length; i++) {
      var f = this.food[i];
      if (f.gone || f.sinking || f.t < 0 || (f.skip === k && f.skipT > 0)) continue;
      var d = Math.hypot(f.x - k.x, f.y - k.y);
      if (d > reach) continue;
      // (a pellet already crowded by nearer koi counts a little farther, so
      // they spread over the food a bit; but they still compete for it)
      for (var j = 0; j < this.fish.length; j++) {
        var o = this.fish[j];
        if (o !== k && o.food === f && Math.hypot(f.x - o.x, f.y - o.y) < d) d += L * 0.25;
      }
      if (d < bd) { bd = d; best = f; }
    }
    return best;
  };
  Pond.prototype.eat = function (f, k) {
    f.gone = true;
    var L = this.L, ch = this.s.feedSplash === undefined ? 1 : this.s.feedSplash;
    this.rings.push({ x: f.x, y: f.y, t: 0, L: k.L });
    if (ch <= 0) return;
    this.rings.push({ x: f.x, y: f.y, t: 0.15, L: k.L * 0.6 });
    this.splash(f.x, f.y, Math.round(5 + 6 * ch), k.L * 0.9);
    // the swirl of the snatch pushes the pellets near it away
    for (var i = 0; i < this.food.length; i++) {
      var o = this.food[i];
      if (o === f || o.gone || o.t < 0) continue;
      var dx = o.x - f.x, dy = o.y - f.y, d = Math.hypot(dx, dy);
      if (d < L * 0.6 && d > 0.01) { var p = L * 0.35 * ch * (1 - d / (L * 0.6)); o.vx += dx / d * p; o.vy += dy / d * p; }
    }
  };
  // drops thrown up off the water, falling back round where they rose
  Pond.prototype.splash = function (x, y, n, size) {
    var r = this.rnd;
    for (var i = 0; i < n && this.drops.length < 160; i++) {
      var a = r() * TAU, sp = size * (0.3 + r() * 0.7);
      this.drops.push({ x: x + Math.cos(a) * size * 0.05, y: y + Math.sin(a) * size * 0.05, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
                        t: 0, life: 0.25 + r() * 0.3, r: size * (0.012 + r() * 0.02) });
    }
  };
  Pond.prototype.stepFood = function (dt) {
    var s = this.s, L = this.L, life = s.foodLife || 40;
    for (var i = this.food.length - 1; i >= 0; i--) {
      var f = this.food[i];
      var was = f.t; f.t += dt;
      if (was < 0 && f.t >= 0) this.rings.push({ x: f.x, y: f.y, t: 0.5, L: L * 0.5 });   // a small plop as it lands
      if (f.t < 0) continue;
      if (f.gone) { this.food.splice(i, 1); continue; }
      if (f.skipT > 0) f.skipT -= dt;
      // drifting on the water: the pond's slow current (turning slowly)
      // and each pellet's own wander, which its speed settles toward
      // (the glide from the throw and every push die away gently)
      var dr = s.foodDrift === undefined ? 1 : s.foodDrift;
      var ca = this.t * 0.05 + Math.sin(this.t * 0.031) * 2, cs = L * 0.035 * dr;
      f.wa += (this.rnd() - 0.5) * 1.6 * dt;
      var tx = Math.cos(ca) * cs + Math.cos(f.wa) * L * 0.03 * dr, ty = Math.sin(ca) * cs + Math.sin(f.wa) * L * 0.03 * dr;
      var ease = Math.pow(0.55, dt);
      f.vx = tx + (f.vx - tx) * ease; f.vy = ty + (f.vy - ty) * ease;
      // pushed along by a koi swimming past (its bow wave)
      for (var j = 0; j < this.fish.length; j++) {
        var k = this.fish[j];
        if (k.z > 0.25 || k.food === f) continue;
        var dx = f.x - k.x, dy = f.y - k.y, d = Math.hypot(dx, dy);
        if (d < k.L * 0.45 && d > 0.01) {
          var push = (1 - d / (k.L * 0.45)) * k.v * 0.9 * dt, hx = Math.cos(k.heading), hy = Math.sin(k.heading);
          f.vx += (dx / d * 0.6 + hx * 0.4) * push; f.vy += (dy / d * 0.6 + hy * 0.4) * push;
        }
      }
      // the water falling from the fountain pushes the pellets out from where it lands
      if (this.fn) {
        var fx = f.x - this.fn.x, fy = f.y - this.fn.y, fd = Math.hypot(fx, fy) || 1, fr = this.fn.r * 2;
        if (fd < fr) { var fp = L * 0.9 * (1 - fd / fr) * dt; f.vx += fx / fd * fp; f.vy += fy / fd * fp; }
      }
      f.spin += f.sv * dt;
      f.x += f.vx * dt; f.y += f.vy * dt;
      // kept off the pond's edge (and the fountain's circle) as before; the stand's
      // poles are another matter: a pellet only has to stay clear of the pole itself,
      // not out of the koi's wide keep-clear zone (that zone leaves no free spot
      // between the two poles, and the pellet was pushed back and forth, wriggling,
      // for ever). It slides along the pole instead, losing the speed into it.
      var kp = this.posts; this.posts = null;
      var q = this.clampIn(f.x, f.y, L * 0.35); this.posts = kp;
      f.x = q.x; f.y = q.y;
      // (kept out of the koi's keep-clear zone round each pole, so a koi can
      // always reach it without turning tight round the pole; the pushes from
      // both poles add up, so between them it is moved out to open water)
      var pz = this.posts && this.posts.length ? this.posts[0].r - this.posts[0].w + L * 0.1 : 0;
      var po = null;
      for (var pi = 0; pi < 6; pi++) {
        var pq = this.postOut(f.x + (po ? po.x : 0), f.y + (po ? po.y : 0), pz);
        if (!pq) break;
        po = po ? { x: po.x + pq.x, y: po.y + pq.y } : pq;
      }
      if (po) {
        var pl = Math.hypot(po.x, po.y) || 1, nx = po.x / pl, ny = po.y / pl, vin = f.vx * nx + f.vy * ny;
        f.x += po.x; f.y += po.y;
        if (vin < 0) { f.vx -= vin * nx; f.vy -= vin * ny; }
      }
      if (!f.sinking && f.t > life) f.sinking = true;
      if (f.sinking) { f.sinkT += dt; if (f.sinkT > 5) this.food.splice(i, 1); }
    }
  };
  // pellets: their soft shadows on the floor first (under the koi), the
  // pellets themselves after the koi (they float on top)
  Pond.prototype.drawFood = function (ctx, shadows) {
    var L = this.L, s = this.s;
    for (var i = 0; i < this.food.length; i++) {
      var f = this.food[i];
      if (f.t < 0) continue;
      var sink = f.sinking ? clamp(f.sinkT / 5, 0, 1) : 0, rad = L * 0.026 * f.size * (1 - 0.35 * sink);
      var a = 1 - sink;
      if (shadows) {
        ctx.beginPath(); ctx.arc(f.x + L * 0.03 * s.shadow * (1 - sink * 0.6), f.y + L * 0.06 * s.shadow * (1 - sink * 0.6), rad * 1.3, 0, TAU);
        ctx.fillStyle = 'rgba(176, 72, 22, ' + Math.min(1, 0.13 * a * shadowOp(s)).toFixed(3) + ')'; ctx.fill();
        continue;
      }
      ctx.save();
      ctx.globalAlpha = a * (f.sinking ? 0.85 : 1);
      ctx.translate(f.x, f.y); ctx.rotate(f.spin);
      ctx.beginPath(); ctx.ellipse(0, 0, rad, rad * 0.86, 0, 0, TAU);
      var g = ctx.createRadialGradient(-rad * 0.35, -rad * 0.35, rad * 0.1, 0, 0, rad);
      var c0 = f.tone < 0.5 ? '#D9A066' : '#C98F55', c1 = f.tone < 0.5 ? '#A96A36' : '#99602F';
      g.addColorStop(0, c0); g.addColorStop(1, c1);
      ctx.fillStyle = g; ctx.fill();
      ctx.lineWidth = Math.max(0.5, rad * 0.12); ctx.strokeStyle = 'rgba(120, 70, 30, 0.45)'; ctx.stroke();
      ctx.beginPath(); ctx.arc(-rad * 0.32, -rad * 0.3, rad * 0.28, 0, TAU);
      ctx.fillStyle = 'rgba(255, 244, 222, 0.55)'; ctx.fill();
      ctx.restore();
    }
  };

  /* The depth each koi is drawn at: deeper is smaller and fainter. */
  Pond.prototype.depthLook = function (k, s) {
    var z = k.z, gone = clamp((z - 1) / 0.5, 0, 1);
    var zd = clamp((z - k.zHome) / (1 - k.zHome), 0, 1) + gone * 0.5;
    var up = clamp((k.zHome - z) / (k.zHome + 0.12), 0, 1);
    k.dGone = gone; k.dZd = zd; k.dUp = up;
    k.dSc = up > 0 ? 1 + 0.05 * up : 1 - (1 - s.deepSize) * zd;
    k.dShadow = s.shadow * (1 + 0.4 * up - 0.7 * zd);
  };
  /* A small blank picture of at least w x h, cleared all over (so nothing
     left from an earlier, bigger picture can bleed in at its edges when it
     is scaled up). */
  function smallCanvas(o, key, w, h) {
    var c = o[key] || (o[key] = document.createElement('canvas'));
    if (c.width < w || c.height < h) { c.width = Math.max(c.width, w); c.height = Math.max(c.height, h); }
    var x = c._ctx || (c._ctx = c.getContext('2d'));
    x.setTransform(1, 0, 0, 1, 0, 0); x.filter = 'none'; x.globalAlpha = 1;
    x.clearRect(0, 0, c.width, c.height);
    return c;
  }
  /* Soften a small picture with a real (Gaussian) blur into a second one.
     The pictures are small, so this is cheap; done on the whole screen at
     full size for every koi it was what made the pond stutter. */
  function blurInto(src, dst, w, h, sigma) {
    var x = dst._ctx;
    if (sigma > 0.6) x.filter = 'blur(' + sigma.toFixed(2) + 'px)';
    x.drawImage(src, 0, 0, w, h, 0, 0, w, h);
    x.filter = 'none';
  }
  /* All the koi's shadows, drawn flat on one small picture (about 1.2
     small pixels to the blur), softened with a real blur, then scaled up:
     a smooth picture scales up smooth (no blocks). */
  Pond.prototype.drawShadows = function (ctx, fish, s) {
    if (!(s.shadow > 0)) return;
    var dpr = this.dpr;
    var sig = this.L * 0.035 * s.shadow * SHADOW_SOFT * shadowFe(s);       // the shadows' blur, CSS pixels
    var sc = clamp(SMALL_SIG / Math.max(0.5, sig), 0.06, 1);     // small-picture pixels per CSS pixel
    var pad = Math.ceil(sig * sc * 3) + 2;
    var sw = Math.ceil(this.W * sc) + pad * 2, sh = Math.ceil(this.H * sc) + pad * 2;
    var A = smallCanvas(this, 'shA', sw, sh), B = smallCanvas(this, 'shB', sw, sh), c2 = A._ctx;
    for (var i = 0; i < fish.length; i++) {
      var k = fish[i];
      if (k.dGone >= 1 || k.dShadow <= 0.001) continue;
      var c = k.P[9], se = Object.create(s); se.shadow = k.dShadow;
      c2.setTransform(sc, 0, 0, sc, this.hw * sc + pad, this.hh * sc + pad);
      c2.translate(c.x, c.y); c2.scale(k.dSc, k.dSc); c2.translate(-c.x, -c.y);
      drawKoiShadow(c2, k, se);
    }
    blurInto(A, B, sw, sh, sig * sc);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    var k2 = dpr / sc;
    ctx.drawImage(B, 0, 0, sw, sh, -pad * k2, -pad * k2, sw * k2, sh * k2);
    ctx.restore();
  };

  /* Each koi at its own depth — deeper is smaller, blurrier and fainter;
     the deepest are drawn first, so nearer koi pass over. */
  Pond.prototype.drawPool = function (ctx, look, s) {
    var oc = this.offCtx, dpr = this.dpr, hw = this.hw, hh = this.hh, fish = this.fish.slice();
    fish.sort(function (a, b) { return b.z - a.z; });
    for (var i = 0; i < fish.length; i++) this.depthLook(fish[i], s);
    this.drawShadows(ctx, fish, s);
    for (i = 0; i < fish.length; i++) {
      // measured from the koi's own cruising depth: every koi that is
      // just cruising is drawn at full size, sharp and solid
      var k = fish[i], zd = k.dZd, gone = k.dGone, sc = k.dSc;
      if (gone >= 1) continue;
      var se = Object.create(s);
      se.shadow = 0;
      var c = k.P[9];
      if (zd < 0.01) {           // not diving: drawn straight onto the pond
        ctx.save();
        ctx.translate(c.x, c.y); ctx.scale(sc, sc); ctx.translate(-c.x, -c.y);
        look.draw(ctx, k, se);
        ctx.restore();
        continue;
      }
      // diving: drawn on a little picture that fits the koi's own outline
      // (body, fins, tail), smaller only as much as its blur hides (so a koi
      // just under the surface keeps all its detail), softened there with a
      // real blur, then scaled up and laid down faded. The blur in device
      // pixels is the old blur filter's.
      var blur = s.deepBlur * zd * dpr * k.sizeK * (this.L / 83);
      var q = Math.max(1, blur / DIVE_SIG);                  // how many times smaller it is drawn
      // (shrinking and scaling back up softens it by about half a small pixel: take that off the blur)
      var sig = Math.sqrt(Math.max(0, (blur / q) * (blur / q) - (q > 1 ? 0.25 : 0)));
      var bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9, P = k.P, Lk = k.L, j2;
      for (j2 = 0; j2 < P.length; j2++) {
        if (P[j2].x < bx0) bx0 = P[j2].x; if (P[j2].x > bx1) bx1 = P[j2].x;
        if (P[j2].y < by0) by0 = P[j2].y; if (P[j2].y > by1) by1 = P[j2].y;
      }
      var tt = P[P.length - 1], tT = k.T[P.length - 1], tx = tt.x + tT.x * Lk * 0.42, ty = tt.y + tT.y * Lk * 0.42;
      bx0 = Math.min(bx0, tx); bx1 = Math.max(bx1, tx); by0 = Math.min(by0, ty); by1 = Math.max(by1, ty);
      var fm = Lk * 0.45;                                    // the fins and tail reach this far round the spine
      bx0 = c.x + (bx0 - fm - c.x) * sc; bx1 = c.x + (bx1 + fm - c.x) * sc;
      by0 = c.y + (by0 - fm - c.y) * sc; by1 = c.y + (by1 + fm - c.y) * sc;
      var pad = Math.ceil(sig * 3) + 2;
      var iw = Math.ceil((bx1 - bx0) * dpr / q), ih = Math.ceil((by1 - by0) * dpr / q);
      var nw = iw + pad * 2, nh = ih + pad * 2;
      var A = smallCanvas(this, 'dvA', nw, nh), B = smallCanvas(this, 'dvB', nw, nh), ac = A._ctx;
      var kk = dpr / q;                                      // little-picture pixels per CSS pixel
      ac.setTransform(kk, 0, 0, kk, pad - bx0 * kk, pad - by0 * kk);
      ac.translate(c.x, c.y); ac.scale(sc, sc); ac.translate(-c.x, -c.y);
      ac.save(); look.draw(ac, k, se); ac.restore();
      blurInto(A, B, nw, nh, sig);
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
      ctx.globalAlpha = (1 - s.deepFade * Math.min(zd, 1)) * (1 - gone);
      ctx.drawImage(B, 0, 0, nw, nh, (hw + bx0) * dpr - pad * q, (hh + by0) * dpr - pad * q, nw * q, nh * q);
      ctx.restore();
    }
    // s.hide (koiscreen.html): a picture as large as the screen of what stands over
    // the water and hides the koi (the fountain's poles where they go into the water):
    // the koi and their shadows are cut out there, so none shows through
    if (s.hide) {
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'destination-out';
      ctx.drawImage(s.hide, 0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.restore();
    }
    this.drawFood(ctx, false);
    this.drawLaps(ctx);
    // rings on the water where a koi gulped air or took food
    for (i = 0; i < this.rings.length; i++) {
      var g = this.rings[i], gL = g.L || this.L;
      for (var j = 0; j < 2; j++) {
        var t = g.t - j * 0.28; if (t <= 0) continue;
        var f = t / 1.6, rad = gL * (0.05 + 0.32 * (1 - Math.pow(1 - f, 2.2)));
        ctx.beginPath(); ctx.arc(g.x, g.y, rad, 0, TAU);
        ctx.lineWidth = gL * 0.03 * (1 - f) + 0.4;
        ctx.strokeStyle = 'rgba(196, 96, 40, ' + (0.18 * (1 - f)).toFixed(3) + ')'; ctx.stroke();
        ctx.lineWidth = gL * 0.016 * (1 - f) + 0.3;
        ctx.strokeStyle = 'rgba(255, 253, 249, ' + (0.9 * (1 - f)).toFixed(3) + ')'; ctx.stroke();
      }
    }
    this.drawDrops(ctx);
  };
  Pond.prototype.frame = function (dt) {
    var s = this.s, ctx = this.ctx, look = LOOKS.nishiki;
    dt = Math.min(dt, 0.1);
    this.acc += dt;
    var steps = 0;
    while (this.acc >= 1 / 120 && steps < 16) {
      this.t += 1 / 120; this.acc -= 1 / 120; steps++;
      for (var i = 0; i < this.fish.length; i++) this.fish[i].step(1 / 120, this.t);
      this.events(1 / 120);
      this.stepFood(1 / 120);
    }
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.W, this.H);
    ctx.translate(this.hw, this.hh);
    for (i = 0; i < this.fish.length; i++) this.fish[i].build();
    this.drawPool(ctx, look, s);
  };

  /* ============================================================
     THE PAGE'S HANDLE
     ============================================================ */
  function create(canvas, settings) {
    var s = {};
    for (var key in settings) s[key] = settings[key];
    s.look = 'nishiki'; s.path = 'pool';
    s.kinds = (settings.kinds || ['kohaku', 'ogon']).slice();
    var pond = new Pond(canvas, s), raf = 0, last = 0, running = false, fps = 0, fpsN = 0, fpsT = 0;
    function loop(now) {
      raf = 0;
      if (!running) return;
      var dt = last ? (now - last) / 1000 : 0; last = now;
      if (!document.hidden) {
        pond.frame(dt);
        fpsN++; fpsT += dt; if (fpsT > 1) { fps = fpsN / fpsT; fpsN = 0; fpsT = 0; }
      }
      raf = requestAnimationFrame(loop);
    }
    function local(x, y) {
      var r = canvas.getBoundingClientRect();
      return { x: (x - r.left) * pond.W / (r.width || 1) - pond.hw, y: (y - r.top) * pond.H / (r.height || 1) - pond.hh };
    }
    var api = {
      start: function () { if (running) return; running = true; last = 0; if (!raf) raf = requestAnimationFrame(loop); },
      stop: function () { running = false; if (raf) { cancelAnimationFrame(raf); raf = 0; } },
      reset: function () { pond.resize(); pond.rebuild(); },
      feed: function (x, y) { var p = local(x, y); pond.feed(p.x, p.y); },
      set: function (o) {
        for (var k in o) s[k] = o[k];
        if (o.kinds) s.kinds = o.kinds.slice();
        if ('maxDpr' in o) pond.resize(); else pond.shape();
      },
      info: function () {
        var eating = pond.fish.filter(function (k) { return k.mode === 'feed'; }).length;
        return { koi: pond.fish.length, food: pond.food.filter(function (f) { return !f.gone; }).length, eating: eating, fps: fps,
                 length: pond.L, w: pond.W, h: pond.H };
      },
      pond: pond
    };
    window.addEventListener('resize', function () {
      var r = canvas.getBoundingClientRect();
      if (Math.round(r.width) !== Math.round(pond.W) || Math.round(r.height) !== Math.round(pond.H)) pond.resize();
    });
    return api;
  }

  window.KoiScreen = { create: create, TUNE: TUNE, kinds: ['kohaku', 'ogon', 'showa', 'tancho', 'sanke', 'platinum', 'asagi', 'shiro', 'bekko', 'goshiki'] };
})();
