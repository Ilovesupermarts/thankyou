/* winterbake.js — the bake worker of newwinter.html (the winter test bed).

   The two slow pixel-by-pixel parts of the scene's first load are worked out here, on another processor core, while the
   page goes on with the rest (the hill of firs, the hall's timber and firs): the snow ground's rows (winterlake.js
   groundJob, o.rowsOnly) and the ground round the shrine hall with its edges (winterhall.js job, o.groundOnly). It runs
   THE SAME CODE as the page (the same files, loaded here), so the pixels are exactly the same; the page then finishes
   each picture as before (winterlake.js o.pixelsFrom, winterhall.js o.groundFrom). Pure arithmetic only: no drawing
   happens here that the page uses.

   Messages in: { id, kind: 'field', o, path: { build, hallOpts } | null }
                { id, kind: 'hall', o, path: { build } | null }
                (o.band = [p, n]: the p-th of n bands of rows; the hall's o.edgePart = [p, n] with o.hitAll: a part of its edges)
                { id, kind: 'gate', build, place, cam, Lt, look, path } / { id, kind: 'lantern', place, cam, Lt, look, path, win }:
                the per-pixel parts of a torii gate or a stone lantern (wintertorii.js), several at once on several workers
   Messages out: { id, ok: true, ... the pixels (transferred) } or { id, ok: false, error }.
   The functions the page's options carry (the path, the painter) cannot be sent: the path is built again here from the
   same numbers (WinterPath.build, WinterHall.job({ locateOnly }), WinterPath.onRise). */
self.window = self;
// (the files make a few small canvases while they set up: OffscreenCanvas stands in for them here)
self.document = { createElement: function () { return new OffscreenCanvas(1, 1); } };
importScripts('winterpath.js', 'winterlake.js', 'winterhall.js', 'wintertorii.js');

// the snow's own height at a point of the ground, as the page's torii have it (newwinter.html TORII groundFn)
function groundFn(T, rise) {
  return function (x, z) { var h = T.delta(x, z, 0, true), fl = T.Q.far ? 0 : T.Q.floor; return { h: h + (rise ? Math.max(0, rise(x, z)) : 0), fl: fl }; };
}
// a drawing context that draws nothing (the torii's drawing runs through it here only for its pixel work)
var GRAD = { addColorStop: function () {} };
function NOOP() { return GRAD; }
var NULLC = new Proxy({}, { get: function (t, k) { return k in t ? t[k] : NOOP; }, set: function (t, k, v) { t[k] = v; return true; } });

self.onmessage = function (e) {
  var m = e.data;
  try {
    var o = m.o, P = m.path, T = P && P.build ? WinterPath.build(P.build) : null;
    if (m.kind === 'field') {
      if (T) o.path = P.hallOpts ? WinterPath.onRise(T, WinterHall.job(P.hallOpts)) : T;
      o.rowsOnly = true;
      var t0 = performance.now(), job = WinterLake.groundJob(null, o);
      job.step();
      var D = job.pixels(), buf = D.slice().buffer;          // (o.band: that band's rows alone, job.rows())
      self.postMessage({ id: m.id, ok: true, data: buf, rows: job.rows(), nPath: job.info().pathPixels, cpu: performance.now() - t0 }, [buf]);
    } else if (m.kind === 'gate' || m.kind === 'lantern') {
      // a torii gate's or a stone lantern's pixel work (wintertorii.js "pixel sites"), drawn on a context that draws
      // nothing; the page lays the pixels down in the same order (look.px.use)
      var look = m.look, rise = P && P.hallOpts ? WinterHall.job(P.hallOpts).ground : null;
      look.ground = T ? groundFn(T, rise) : null;
      look.px = { make: true, out: [] };
      if (m.kind === 'gate') WinterTorii.draw(NULLC, WinterTorii.build(m.build), m.place, m.cam, m.Lt, look);
      else WinterTorii.lanternLit(NULLC, NULLC, m.place, m.cam, m.Lt, look);   // (the page always hands it a window layer)
      var out = look.px.out, tr = [];
      out.forEach(function (r) { if (!r) return; [r.im, r.wim, r.front && r.front.im, r.back && r.back.im].forEach(function (im) { if (im && tr.indexOf(im.data.buffer) < 0) tr.push(im.data.buffer); }); });
      self.postMessage({ id: m.id, ok: true, out: out, miss: !!(look.groundPix && look.groundPix.miss) }, tr);
    } else if (m.kind === 'hall') {
      if (T) o.path = T;
      o.groundOnly = true;
      var r = WinterHall.job(o).run(), tr = [];       // (o.band: a band of rows of the raster; o.edgePart: a part of its edges)
      ['gHit', 'gBack', 'gFront', 'ks', 'vals'].forEach(function (k) { if (r[k]) tr.push(r[k].buffer); });
      r.id = m.id; r.ok = true;
      self.postMessage(r, tr);
    }
  } catch (err) {
    self.postMessage({ id: m.id, ok: false, error: String(err && err.message || err) });
  }
};
