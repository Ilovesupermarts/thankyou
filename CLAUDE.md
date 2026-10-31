# Notes for future work

- This is a simple website with no build step.
- The main files are `index.html`, `main.css`, `app.js` and `sw.js`.
- `strokes.js` holds the stroke-order data for writing the name. `app.js` loads it after the page has loaded.
- `mountains.js` draws realistic 3D mountains with the Fuji-like peak (WebGL 2). The app uses it for the autumn mountains (settings in `MTN3D` in `app.js`); `bamboo.html` is the test bed for tuning them.
- `trunks.js` draws the autumn maples' trunk and branches in 3D (WebGL 2, every frame, so they sway): round limbs that grow out of each other at the forks, Japanese-maple bark, root flare, moss, and light that matches the leaves and the time of day and weather (with 木漏れ日 spots under the canopy). The app uses it for the autumn trees (settings in `TRUNK` in `app.js`; `buildKoyoTrunk`, `koyoTrunkLight` and `fillKoyoBranches` there); `bamboo.html` is the test bed for tuning them (its panel's 木 Tree page; "Copy values" gives the numbers to move into `TRUNK`).
- `fireworks.js` draws a night fireworks show after the Nagaoka festival. The app uses it in the autumn scene at night (settings in `FIREWORKS` in `app.js`); `fireworks.html` is the test bed for tuning it.
- `clouds.js` draws the realistic day clouds (cumulus) in the sky. The app uses it for the clouds around the sun (settings in `CLOUD_LOOK` in `app.js`); `clouds.html` is the quick test bed for tuning them, and `bamboo-clouds.html` (a copy of `bamboo.html`) tunes them in the full scene, with values for each time of day and weather (`CLOUD` in its script).
- `winter2.html` (a copy of `bamboo.html`) is the test bed for the new winter scene. It is drawn with `mountains.js` (its winter mode: `winter`, `forestSnow`, `snowSlope`), `snowfield.js` (the lit snowfield), `torii.js` (the 3D torii with snow), `conifers.js` (snowy firs and frosted trees), `snowlights.js` (snow lanterns, snow huts, the stone lantern), `snowheaps.js` (the snow on the plum branches; with the snow material in `snowfield.js`, the lit snow on the branches and the torii) and `clouds.js`. `snow-lab.html` is the quick test bed for that snow, seen large. Its panel holds every value and can be dragged by its title bar. The app's winter theme uses these files (section 8d of `app.js`, settings in `WINT` and `WINT_M`; winter clouds in `CLOUD_WINTER`); move values from the panel's "Copy values" into them.
- The text is in Japanese.
- It only runs on one Galaxy Tab S8 Ultra.
- Always explain changes in plain English.
- Other files may be added or changed when it helps, for example splitting code out of `app.js` into its own `.js` file.
- When adding a file the app uses, add it to the `ASSETS` list in `sw.js` and bump the `CACHE` version so the tablet picks it up.
