# Checks for the new winter scene (newwinter.html / hill-options.html)

Small Playwright scripts used to look at the work (Chromium and Playwright are pre-installed; `require('playwright')` works).
Serve the repo first: `python3 -m http.server 8765` from the repo root (restart it if a script says ERR_CONNECTION_REFUSED).
Run them with a scratch folder for the pictures, never inside the repo. Each script's first line says how to call it.
`tb.js` uses `--use-gl=swiftshader` so the 3D mountains draw in headless Chromium (about 5 s at 1x, 15 s at 2x).

Added with step 6 (the lake): `shot.js` (any values, any hour, a clip; the one to use first), `layers.js` (the lake's baked pictures on their own), `bake-time.js` (how long each bake step takes).
Run them from the scratchpad folder with `NODE_PATH=$(npm root -g) node <script>` and `timeout`; one at a time. The scripts launch Chromium with `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader`.
