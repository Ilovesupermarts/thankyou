/* winterbake.js — the bake worker of newwinter.html (the winter test bed).

   The two slow pixel-by-pixel parts of the scene's first load are worked out here, on another processor core, while the
   page goes on with the rest (the hill of firs, the hall's timber and firs): the snow ground's rows (winterlake.js
   groundJob, o.rowsOnly) and the ground round the shrine hall with its edges (winterhall.js job, o.groundOnly). It runs
   THE SAME CODE as the page (the same files, loaded here), so the pixels are exactly the same; the page then finishes
   each picture as before (winterlake.js o.pixelsFrom, winterhall.js o.groundFrom). Pure arithmetic only: no drawing
   happens here that the page uses.

   Messages in: { id, kind: 'field', o, path: { build, hallOpts } | null }
                { id, kind: 'hall', o, path: { build } | null }
   Messages out: { id, ok: true, ... the pixels (transferred) } or { id, ok: false, error }.
   The functions the page's options carry (the path, the painter) cannot be sent: the path is built again here from the
   same numbers (WinterPath.build, WinterHall.job({ locateOnly }), WinterPath.onRise). */
self.window = self;
// (the files make a few small canvases while they set up: OffscreenCanvas stands in for them here)
self.document = { createElement: function () { return new OffscreenCanvas(1, 1); } };
importScripts('winterpath.js', 'winterlake.js', 'winterhall.js');

self.onmessage = function (e) {
  var m = e.data;
  try {
    var o = m.o, P = m.path, T = P && P.build ? WinterPath.build(P.build) : null;
    if (m.kind === 'field') {
      if (T) o.path = P.hallOpts ? WinterPath.onRise(T, WinterHall.job(P.hallOpts)) : T;
      o.rowsOnly = true;
      var t0 = performance.now(), job = WinterLake.groundJob(null, o);
      job.step();
      var D = job.pixels(), buf = D.buffer.slice(0);
      self.postMessage({ id: m.id, ok: true, data: buf, nPath: job.info().pathPixels, cpu: performance.now() - t0 }, [buf]);
    } else if (m.kind === 'hall') {
      if (T) o.path = T;
      o.groundOnly = true;
      var r = WinterHall.job(o).run();
      self.postMessage({ id: m.id, ok: true, gHit: r.gHit, gBack: r.gBack, gFront: r.gFront, ms: r.ms, LW: r.LW, LH: r.LH },
                       [r.gHit.buffer, r.gBack.buffer, r.gFront.buffer]);
    }
  } catch (err) {
    self.postMessage({ id: m.id, ok: false, error: String(err && err.message || err) });
  }
};
