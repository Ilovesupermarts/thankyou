# Notes for future work

- This is a simple website with no build step.
- The main files are `index.html`, `main.css`, `app.js` and `sw.js`.
- `strokes.js` holds the stroke-order data for writing the name. `app.js` loads it after the page has loaded.
- The text is in Japanese.
- It only runs on one Galaxy Tab S8 Ultra.
- Always explain changes in plain English.
- Other files may be added or changed when it helps, for example splitting code out of `app.js` into its own `.js` file.
- When adding a file the app uses, add it to the `ASSETS` list in `sw.js` and bump the `CACHE` version so the tablet picks it up.
