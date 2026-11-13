# Checks for the new winter scene (newwinter.html / hill-options.html)

Small Playwright scripts used to look at the work (Chromium and Playwright are pre-installed; `require('playwright')` works).
Serve the repo first: `python3 -m http.server 8765` from the repo root (restart it if a script says ERR_CONNECTION_REFUSED).
Run them with a scratch folder for the pictures, never inside the repo. Each script's first line says how to call it.
`tb.js` uses `--use-gl=swiftshader` so the 3D mountains draw in headless Chromium (about 5 s at 1x, 15 s at 2x).

Added with step 6 (the lake): `shot.js` (any values, any hour, a clip; the one to use first), `layers.js` (the lake's baked pictures on their own), `bake-time.js` (how long each bake step takes).
Run them from the scratchpad folder with `NODE_PATH=$(npm root -g) node <script>` and `timeout`; one at a time. The scripts launch Chromium with `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader`.

Added with step 7 (the roped pines): `pines-variants.html` + `pines-variants.js` (the five variants large on a plain background: `node pines-variants.js OUT.png SCALE '?v=2'`; the page is served from the repo's own server, so serve the repo on 8765 first), `pines-time.html` + `pines-time.js` (how long one big fir takes to bake, ms; add `trunks:false` to the options in the page to see the cost of the 3D bark), `pines-shake.js` (waits for the full bake, shakes every clump, prints each tree's snow states and saves `fall.png`). The full scene takes minutes to bake with the pines in headless Chromium: `shot.js` waits up to 450 s; give it `timeout 900` and run it in the background. Run ONE script at a time.

Added with step 5 (the shrine hall): `hall.js` (`node hall.js PREFIX SCALE '{"V":{...}}'`: PREFIX-full.png, PREFIX-hall.png a clip round the hall, PREFIX-layer.png the hall's own picture over grey; the pines are off unless set), `lamps.js` (the lamps' level from an hour before sunset to after it).

Added in the step 8 session (each script's first line says how to call it):
- `trail.js` — the test bed at any scale with values set, waits for every bake (the field job, the hall), saves PREFIX-full.png and prints the Report lines for the field, hall and path. Use it first for the path (step 8).
- `layers-compare.js` — saves the baked snow ground and hall layer; run against this branch and a `git worktree` of `main` on another port (BASE=…) and compare with PIL to prove nothing else moved.
- `path-geometry.js` — the hall's rise numbers and the path's centre line in metres.
- `water-evict.js`, `water-apppath.js` — the lake water losing its graphics context (too many contexts open) and recovering (test bed) or latching (as the app).
- `pagoda-dof.js` — the pagoda's depth of field at several focus distances.

Added at the end of the step 8 session (run from this folder; each script's first line says how):
- `user-scene.js` + `user-values.json` — the test bed with the user's own panel values (now the page's defaults), any overrides, saves PREFIX-full.png. The quick check for path / hall / snow changes: SCALE 1 and `{"V":{"ytShow":false,"showMountains":false,"hillShow":false,"pagodaShow":false}}`, about 2.5 min. The full check is SCALE 2 without the overrides except `ytShow:false` (about 7 min; it needs `timeout 1700` and `run_in_background`).
- `field-probe.js` — what a line of sight through a screen point meets in the snow field's path code. `path-band.js` — the path's edges on the screen. `hall-field-layers.js` — the hall's and the field's own pictures.

Added in the plum-branches / time-phase / hill-firs / optimisation session (run from this folder with `NODE_PATH=$(npm root -g) node <script>`; scratch pictures to the scratchpad, never the repo; ONE script at a time; long ones with `run_in_background` and a long `timeout`, then wait for the notification):
- `plum-shot.js` — the one to use first now (see its first line): values, clips, `PORT`, `BUDGET`, `FREEZE`. With `{"V":{"ytShow":false,"showMountains":false,"hillShow":false,"pagodaShow":false,"hallShow":false,"trailShow":false}}` and a clip over a plum branch it is a quick check of the branches (about 40 s at 2x); the hill and shrine firs need `BUDGET=3000` and no `hillShow:false`.
- `load-profile.js` (pines off) and `load-profile-plain.js` (everything at the defaults) — a full load with a CPU profile: the Report's timing lines, then self time by file and by function. `winterLab.stepBudget(5000)` makes the headless browser's one-frame-at-a-time baking finish in minutes (it draws a frame in about 1.5 s). Use these before any speed work: measure first.
- `fir-profile.js` — where the time goes in one small hill fir; `fir-canvas-truth.js` — the same trees drawn on a graphics-chip canvas, a main-processor canvas, and 8x larger then shrunk (the true look), with the mean differences: how the 2x-and-shrink rule was found.
- `phase.js` — the Time phase drop-down: each choice lands on its own phase and the slider follows. `plum-pieces.js` — the plum branches' pieces and their snow pictures (positions, sizes) by `winterLab.plums()`.

Added in the kept-pictures / loading session (`NODE_PATH=$(npm root -g) node <script>`; each script's first line says how; ONE at a time, long ones `run_in_background`):
- `kept-pictures.js` — a full bake, then a reload: every layer of both loads saved as PNGs, the Report lines printed; the two sets must be pixel-identical (the check that a kept picture is the same as the baked one).
- `kept-changes.js` — change one plum value, then one hill value: which kept pictures are laid down and which are baked again.
- `kept-labels.js` — what each kept picture's label is made of (the functions its code reaches, the values it reads).
- `old-yukitsuri.js` — the page with an old `yukitsuri.js` (no `pack`): no error, the pines not kept.
Added in the frosted-trees session:
- `frost-tree.html` + `frost-tree.js` — one frosted tree (frosttree.js) large on a plain background, lit as the scene at 15:30, with its shadow: `node frost-tree.js OUT.png 2 'seed=5&D=145&h=9&twigs=0.35&feather=0.6'` (D: metres away; `bark3d=0` painted wood). Under a second per tree: the quick place to tune the tree's look.
