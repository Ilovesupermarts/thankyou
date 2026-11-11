# Checks for the new winter scene (newwinter.html / hill-options.html)

Small Playwright scripts used to look at the work (Chromium and Playwright are pre-installed; `require('playwright')` works).
Serve the repo first: `python3 -m http.server 8765` from the repo root (restart it if a script says ERR_CONNECTION_REFUSED).
Run them with a scratch folder for the pictures, never inside the repo. Each script's first line says how to call it.
`tb.js` uses `--use-gl=swiftshader` so the 3D mountains draw in headless Chromium (about 5 s at 1x, 15 s at 2x).
