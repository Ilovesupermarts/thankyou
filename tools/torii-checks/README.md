# torii.html checks

- `shot.js`: renders `torii.html` in headless Chromium and saves a picture. Usage (from this folder, with `python3 -m http.server 8765` running in the repo root; restart it on ERR_CONNECTION_REFUSED):
  `node shot.js out.png 2 "$(cat user-values.json)" '{"x":0,"y":700,"width":1400,"height":1148}'`
  (arguments: output file, device scale (2 = the tablet's real size), JSON `{"V":{...}}` of values to set, optional clip). It clears localStorage, sets the values, rebuilds the snow ground, waits for `!toriiLab.busy()` (about 40-52 s at 2x in the sandbox: software graphics), prints the info line (each gate's distance, height, width) and saves the picture. Crop and magnify with PIL afterwards (`Image.crop(...).resize(..., Image.LANCZOS)`).
- `user-values.json`: the user's final panel values for torii.html (their last "Copy values", gates 3, first gate 54.5 m, heights 1.61, sizes 0.63 / 0.81 / 0.94, etc.). Use it so a picture shows exactly what they see.
- `../../reference/torii-foot-snow-target.jpg`: the user's own picture of how the snow at the gates' feet must look (see "Torii lab" in CLAUDE.md). Compare every try against it, side by side and magnified, BEFORE sending anything.

## Added in the stone-lantern session
- `shot.js` now copies `colours` from the values into `V.colours` (so a test can recolour e.g. the sleeves).
- `day.json`, `dusk.json`, `night.json`: the user's values plus `timeOfDay`.
- `lantern-times.js`: loads the page at 2x with the day values and prints `lantInfo` (each lantern's drawing time).
- `foot-drift-probe.js`: prints the ground heights at each gate's feet (needs a temporary `window.__FD.push(...)` line inside `footDrift`; it was removed from the code).
