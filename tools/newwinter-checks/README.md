# Checks for the new winter scene (newwinter.html / hill-options.html)

Small Playwright scripts used to look at the work (Chromium and Playwright are pre-installed; `require('playwright')` works).
Serve the repo first: `python3 -m http.server 8765` from the repo root (restart it if a script says ERR_CONNECTION_REFUSED).
Run them with a scratch folder for the pictures, never inside the repo. Each script's first line says how to call it.
`tb.js` uses `--use-gl=swiftshader` so the 3D mountains draw in headless Chromium (about 5 s at 1x, 15 s at 2x).

Added with step 6 (the lake): `shot.js` (any values, any hour, a clip; the one to use first), `layers.js` (the lake's baked pictures on their own), `bake-time.js` (how long each bake step takes).
Run them from the scratchpad folder with `NODE_PATH=$(npm root -g) node <script>` and `timeout`; one at a time. The scripts launch Chromium with `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader`.

Added with step 7 (the roped pines): `pines-variants.html` + `pines-variants.js` (the five variants large on a plain background: `node pines-variants.js OUT.png SCALE '?v=2'`; the page is served from the repo's own server, so serve the repo on 8765 first), `pines-time.html` + `pines-time.js` (how long one big fir takes to bake, ms; add `trunks:false` to the options in the page to see the cost of the 3D bark), `pines-shake.js` (waits for the full bake, shakes every clump, prints each tree's snow states and saves `fall.png`). The full scene takes minutes to bake with the pines in headless Chromium: `shot.js` waits up to 450 s; give it `timeout 900` and run it in the background. Run ONE script at a time.
