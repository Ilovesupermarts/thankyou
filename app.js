var BUILD = 'v148';
(function () {
  var m = document.querySelector('meta[name="build"]');
  var css = getComputedStyle(document.documentElement).getPropertyValue('--build').replace(/["'\s]/g, '');
  var bad = (m && m.content !== BUILD) || (css && css !== BUILD);
  var retried = /[?&]r=1/.test(location.search);
  if (bad && !retried) { location.replace(location.pathname + '?r=1'); throw new Error('build mismatch'); }
  if (!bad && retried) history.replaceState(null, '', location.pathname);
})();
/* ============================================================
   app.js — v1.3

   Dynamic background (v1.4)
       - The twelve CSS-animated leaves and the DOM snowflakes are
         replaced by DynBG (search "DYNAMIC BACKGROUND (v1.4)"), a
         canvas drawn in code that follows the real time, sun, moon
         and weather over Nagoya. There is a tall, sharp tree on one side
         (alternating daily) and a shorter, slightly soft one on the other. See the comment above it, the
         canvases in index.html and the .dyn-* rules in main.css.
       - The music display moved to the top right (top aligned with
         the weather line) and its two "lift" rules were removed.
       - The summary bar still covers the snow and leaf strip at the
         bottom; the table and the text scroll in behind that strip.
       - Kōyō (紅葉) trees and leaves, as tuned on koyo.html (values in
         KOYO / KOYO_SHARES / KOYO_FAMILIES). Autumn trees are a branch
         skeleton (6 levels) carrying foliage clumps of small maple
         leaves, baked once per clump and re-baked a few per frame when
         the light changes. The canopy stays within 30% of the screen
         width: the trunk slides up to 8% past the edge first, then the
         spread is squeezed. At night the trees are lit from below by
         warm lamps (koyoNight / koyoGlow). The small leaves that hung
         on the old bare branches are gone. Falling leaves use the same
         maple (shape, size, colour families, no wear spots) with the
         depth ladder unchanged; 60% fall from the top, the rest drop
         from the trees (dropKoyoLeaf), more in a gust. Leaf strength
         0.6 far → 0.9 near (was 0.2 → 0.42); density 0.4 (was 1), so
         about 27 leaves are on screen. The winter tree is unchanged.
       - Autumn landscape, as tuned on landscape.html (values in LAND,
         section 8c): faint blurred mountains with a Fuji-like peak and
         mist between the ridges, a strip of ground covered in fallen
         leaves, and a band of near leaves along the bottom edge that the
         text and table scroll in behind. Only the nearest leaves (z 0.8+)
         fall in front of the content, at the band's size, and they land
         on it (settling flat, with a soft shadow); a gust lifts them, and
         when there are too many the oldest is blown away. Leaves falling
         behind the content settle on the far ground and fade into it. A
         fifth of all leaves are near ones (S.nearShare), up to 20 at a time
         in front; the leaves in front and on the ground are lit and shaded
         like the band (they used to be brighter or pinker at dusk); gusts,
         which blow leaves off the ground, come with a 40% shorter interval
         (GUST_MORE). The
         kōyō branches are solid and taper smoothly at the forks. In
         autumn the swipe hint and dots stay clear of the leaves (dots at
         least 136px up, hint 184px). The winter scene is unchanged.
       - Bamboo groves (autumn), as tuned on bamboo.html (values in
         BAMBOO, section 8b): a dense grove shooting in from the side of
         the screen behind each kōyō tree, taller than its tree but below
         the top of the screen, softened and hazed for its depth, swaying
         and pushed by the gusts. The trees are cut out of the bamboo, so
         none shows through their leaves. The grove behind the bigger tree
         is there by day (it fades in after sunrise and out around sunset);
         the one behind the smaller tree stays through the evening and the
         night, lit from beneath by the same lamps as the trees (a warm
         pool of light behind it and a warm tint rising from the ground up
         its stems and leaves, as strong as the trees' lamps: koyoNight() ×
         KOYO.nightGlow). The birds now fly at three depths among the
         groves and trees (BIRD_HIDE).
       - Bamboo, lighter and smooth: the groves as re-tuned on bamboo.html
         (13 and 16 stems, leafiness 1 and 1.9). Nothing is blurred or
         filled as a shape any more while it moves: each stem and each leaf
         spray is drawn once, with its blur, onto a sheet, and every frame
         (at the full rate, BAMBOO_EVERY) they are only placed: a stem as
         slices of its picture laid along its curve. A change of light
         re-bakes one grove a frame.
       - Torii gates and a gravel path (autumn), as tuned on bamboo.html
         (values in TORII, section 8c): a long line of vermilion torii
         winds across the ground of fallen leaves, from the horizon on the
         left, along it and back toward you, ending with a gate that faces
         you square on. Each gate is in perspective and in proportion to
         the ground it stands on (the furthest the smallest), with the
         same depth of field and haze as the rest of the scene. A pale
         gravel path, as wide as the shadow each gate throws, runs
         through them and straight on out of the bottom of the screen. They
         are baked with the landscape (its last step) and lit by the app's
         light.
       - 3D mountains (autumn), as tuned on bamboo.html (values in
         MTN3D, section 8c): mountains.js draws real 3D ranges and the
         Fuji-like peak on the graphics chip, once per bake, in place of
         the painted ridges and Fuji. They are lit by the app's sun (low
         and warm near sunrise and sunset, moonlit at night, softer under
         cloud) with shadows, snow on the high ground, autumn forest
         below a tree line, haze, and mist in the valleys and along their
         foot. Without WebGL 2 the painted ridges are drawn as before.
       - Fireworks (autumn, at night), as tuned on fireworks.html (values
         in FIREWORKS, section 8c): fireworks.js draws a show after the
         Nagaoka festival. Single shells (chrysanthemum, peony, double
         pistil, kamuro) rise from behind the ridges and burst high in the
         sky; the bursts light the sky, Fuji's snow cap and the clouds, and
         are hidden behind the mountains, the trees and the bamboo. Each
         rising shell whistles (whistling2.mp3, timed to end as it bursts)
         and the bang (big-boom-14752.mp3) follows 0.4 s after the flash,
         echoing off the mountains. It comes on as night falls and stops
         launching at dawn; the sound starts on the first tap.
       - Winter landscape, as tuned on winter2.html (values in WINT and
         WINT_M, section 8d): the whole winter scene drawn with its own
         files. Fuji and the ranges in 3D in their winter mode (mountains.js:
         snow down to the valleys, dark conifers in it, the alpenglow at
         dusk), drawn a band a frame; a snowfield lit like real snow
         (snowfield.js: warm in the sun, blue in the shade, drifts, wind
         ripples, glints); the torii built in 3D with snow and icicles
         (torii.js); snow-laden firs and frosted trees (conifers.js); a
         winding line of snow lanterns lit from dusk with flickering
         candlelight on the snow (snowlights.js); shadows on the snow that
         follow the sun. The snow on the torii and the plum branches is lit
         by one snow material (snowfield.js, snowheaps.js): rounded heaps,
         a shade where they sit on the wood, light through their thin
         edges at dusk, a dusting along the twigs, snow in the forks.
         Diamond dust glitters in the air on clear days; flakes are caught
         by the sun, the lanterns and the head torches. The snowdrift along
         the bottom is lit as the snowfield. The light follows the app's
         time and weather; in winter the clouds are the winter kinds and
         drift in front of Fuji too (CLOUD_WINTER). If Chrome takes a WebGL
         context away or wipes a picture, the scene is baked again once it
         is back.
       - Winter skiers, as tuned on winter2.html (values in WINT): cross-
         country skiers stride across the snowfield at every depth, each
         with their own outfit and a fluttering scarf, passing behind the
         nearer swells, trees and torii. Each casts a shadow on the snow,
         leaves tracks that fade and kicks up powder; after dusk each wears
         a head torch with a soft beam and a pool of light on the snow.
       - Koi screen and name animation: the time-of-day sky colour shows
         from the koi screen on (#dynSky, a quarter-size canvas under
         #dynBack, see dynPrelude), so the session starts on the evening or
         night sky and nothing changes colour later. The setup screen before
         the koi keeps the plain palette. The games page keeps the sky colour
         too; only the scene (trees, leaves, landscape) fades out there. The sun and moon,
         trees, leaves, landscape and toolbar still come after the name;
         the landscape is baked during the name so that work is done first.
         In autumn that work is spread over the name's frames so the name
         does not stutter: the landscape a part per frame, the fallen leaves
         ten at a time, then the first leaves and the tree clumps (about
         8 ms a frame, each clump painted once so the scene's first frame
         does not have to). If any is left when the scene would show, its
         fade-in waits up to 1.5 s for it (dynSetupStep, dynHoldForSetup).
         None of it runs while the characters are still arriving: it starts
         once they have landed (nameLandsAt) and, while the name stands
         still (until nameLeavesAt), takes bigger steps, since a long frame
         does not show then. Both themes.
       - The name is written stroke by stroke in the proper stroke order,
         like the macOS "hello" screen (search "THE NAME, WRITTEN STROKE BY
         STROKE"): a round brush following each stroke uncovers the Yuji
         Syuku character, pressing at the start of a stroke and lifting at
         the end; fresh ink is wet with a pale bloom and dries sharp, and a
         faint light rides the brush tip. The whole name takes at most
         about 4.5 s to arrive. Characters with no stroke data are brushed
         in from the top down as before (inkBrush and inkDry in main.css,
         settled 1.7 s after they start, NAME_ARRIVE). On the way out the ink softens, blooms a
         little and sinks back into the paper (inkFade), each character
         0.24 s after the one above it (NAME_EXIT_STAGGER) over 1.4 s
         (NAME_EXIT); the overlay goes once the last has faded, and lets
         touches through while they fade.
       - Night text: from 18:00 to 06:00 Nagoya time the message
         text and the ordinary thank-you lines use the darkest brown
         (applyNightText, .night-text in main.css).

   Background (霞灯) and falling-particle pass
       - The three drifting orbs were replaced by 霞灯 (Kasumi +
         Akari): two bands of mist plus Shippō "lantern" rings that
         light up one at a time. The mist is static markup in
         index.html; buildLanterns() below creates the lanterns,
         steps each one to a neighbouring ring every glow cycle, and
         rebuilds them on resize. applySwellToCSS() now also writes
         --audio-swell onto #lanternBloom, and applyWind() also
         writes --wind-x onto #mistLitStage so the lit mist follows
         the swipe wind like the soft mist does.
       - Falling leaves and snowflakes: only the blurred ones are
         kept. The sharp near-plane leaves (6) and the sharp tier-6
         snowflakes (4) were removed, and so was the front overlay
         (distributeFrontLeaves / distributeFrontSnow), because the
         two promoted particles it put in front of the text were
         sharp. Totals are now 12 leaves and 28 snowflakes.

   ------------------------------------------------------------
   Changelog:
     v1.3 (winter theme — 7-tier snowfall)
       - A third theme, data-theme="winter" (❄️), is added
         alongside autumn (🍁) and default sakura (🌸). Winter
         inherits the entire 金木犀 (Kinmokusei) & 葡萄染
         (Ebizome) colour system — every token, gradient, shadow,
         HUD badge colour, Shippō stroke, and acoustic-engine
         constant — so the seasonal split is decorative, not
         chromatic. Every html[data-theme="autumn"] X rule in
         main.css is paired with an html[data-theme="winter"] X
         twin. The visible delta between autumn and winter is
         entirely carried by which ambient particle overlay is
         active.
       - Auto-switchover from 1 Dec 00:01 JST.
         isNagoyaWinterSeason() returns true when Nagoya wall-clock
         is 1 December 00:01 or later (month === 12 && (day > 1 ||
         hour > 0 || minute >= 1)). Checked in two places: inside
         updateInfoDateTime() so a session left running across the
         boundary flips on the next 30s clock tick, and in
         window.load so a cold boot in December lands on winter
         without waiting for the first clock update. Both sites
         are gated on _themeManuallySet — once the user taps the
         toggle, auto-switch is suppressed for the rest of the
         session. Reload restores it.
       - Three-way toggle. #themeToggle cycles 🍁 autumn → ❄️
         winter → 🌸 default → 🍁 autumn. isWarmPaletteTheme(theme)
         returns true for autumn and winter. It now only picks the
         HUD spectrum colours (drawHudSpectrum()); the ambient music
         plays in every theme, sakura included.
       - 7-tier falling snowflakes. Two overlays,
         .snow-flakes-overlay (z-index -1) and
         .snow-flakes-overlay-front (z-index 5), mirroring the
         maple-leaf pair's structure. 32 particles built at
         window.load from SNOW_BASE_SLOTS — 30 remain in the back
         overlay, 2 are promoted to the front by
         distributeFrontSnow(). Two standalone 6-fold snowflake
         SVG shapes from the reference image (Shape A: Dendritic
         Ring-Centre Crystal, Shape B: Diamond-Tipped Crystal with
         inner secondary rays) in a 1:2 ratio across the
         32-particle set. Each particle's shape, tier, size, fill,
         horizontal position, drift direction, duration, and delay
         are per-slot authored in SNOW_BASE_SLOTS for indices 0–17
         and deterministically scattered for 18–31.
       - Optical depth ladder. Six back-plane tiers, blur 5.00px
         → 0px, opacity 0.16 → 0.47. Tier 7 is the front-promoted
         pair: filter: none, --flake-opacity: 0.90, randomised
         into the 25–75% horizontal band on promotion. The
         --flake-opacity custom property is the peak-opacity
         source of truth — the drift keyframes' intermediate stops
         read var(--flake-opacity, 0.32), so the per-tier value is
         inherited without any keyframe branching. Same mechanism
         as the leaf planes: element-level opacity: 0 is the
         fallback for the no-animation state (reduced motion), not
         the animated value.
       - Motion. snowFallCw / snowFallCcw keyframes on a monotonic
         vertical descent: ±60px S-curve horizontal sway,
         continuous ±495° axial rotation over the fall, 1.10× size
         scale, 1.90× duration multiplier (17.1s–39.9s per
         particle at the authored base durations). Direction
         alternates on i % 2 so the two keyframe families run
         concurrently. animation-timing-function: linear — the
         S-curve is baked into the transform stops rather than an
         easing curve, so the sway reads as wind rather than a
         spring.
       - Maple-leaf hiding generalised. The previous
         html[data-theme="default"] .maple-leaves-overlay
         { display: none; } becomes
         html:not([data-theme="autumn"]) .maple-leaves-overlay
         { display: none; }. The old selector would have left the
         leaves visible in winter — the intent was always "leaves
         only in autumn", not "leaves hidden in sakura", and the
         negation form states that intent directly. The snowflake
         overlay carries the mirror-image rule
         (html:not([data-theme="winter"]) hides it under autumn
         and sakura). Only one seasonal overlay is ever
         display: block at a time.
       - Reduced-motion handling. A standalone @media
         (prefers-reduced-motion: reduce) block at the bottom of
         main.css disables .snow-particle —
         animation: none, opacity: 0, filter: none. The snowflakes
         are decorative motion with no telemetry role,
         so the accessibility intent here is total suppression
         rather than the amplitude-only-freeze pattern the HUD
         waveform uses. The standalone block keeps the winter
         feature self-contained rather than threading a new
         selector through the ambient-stage block.
       - app.js top-of-file ownership. themeToggle, mapleLeaves and
         snowFlakes — the element lookups — plus currentTheme and
         _themeManuallySet, live together in the theme-toggle block
         at the top of app.js, so the theme subsystem owns its full
         state surface at the point of definition. stageLattice
         stays in DOM REFS — it is consumed by applySwellToCSS()
         inside the swell loop, which is unrelated to theme
         ownership.
       - Cold-boot ordering in window.load. startInfoUpdates()
         runs first, which synchronously calls updateInfoDateTime()
         and may flip the theme to winter via the December check.
         buildMotes() and buildSnowflakes() follow,
         then the explicit window.load winter re-check. By the
         time any particle is appended, document.documentElement
         already carries its final data-theme for the session, so
         the html:not([data-theme="winter"]) gate is stable from
         the first paint and there is no cold-boot flicker in
         December.
     v1.3 (receipt numpad focus gate)
       - updateNumpadVisibility() no longer conflates the numpad's
         appearance toggle with its functional toggle. The previous
         form added .visible unconditionally on receipt open and
         returned early, but resetReceiptScroll() blurs the active
         element one statement before the function runs, so
         getActivePriceInput() returned null and every numpad tap
         fell through handleNumpadKey's null-target guard. The
         keypad surfaced with no target to service.
       - The fix splits the two concerns.
         numpad.classList.toggle('receipt-mode', !!isReceiptOpen)
         applies the receipt skin unconditionally; .visible is added
         only inside the isPriceFocused branch that already governs
         the main table. Matches the table's interaction model.
       - The rejected clause is now (rejected && !isReceiptOpen).
         Under the previous early-return form, rejected === true
         never reached the rejected check because the receipt branch
         had already returned. A straight (rejected || numpadSuppressed)
         in the unified form would lock the numpad out of the receipt
         for the entire declined flow — rejected stays true from the
         moment the reject row is selected through receipt confirm —
         and the ささやかなお礼 line item that buildReceipt()
         synthesizes under the itemCount === 0 && rejected clause
         would have had its only editable field permanently
         unserviceable. Inline comment documents the carve-out.
       - The width guard is now
         if (!tableCard || window.innerWidth <= 1250)
           { numpad.classList.remove('visible'); return; }.
         Previously a bare return past a window.innerWidth <= 1250
         test relied on the @media (max-width: 1250px) { .numpad
         { display: none; } } rule to suppress an element that still
         carried .visible in the DOM. Any resize crossing the 1250px
         boundary surfaced the class for one paint. Explicit teardown
         keeps DOM state synchronized with layout reality on every
         path; symmetrical across all four exit branches.
       - repositionNumpad() moved inside the isPriceFocused branch.
         Coordinates are inert while the element is hidden; focusin
         re-enters the function for every focus event, so no drift
         accumulates across scroll or the numpad's own show/hide.
       - numpadSuppressed needs no additional reset on receipt open.
         The document-level focusin handler routes .service-input and
         .tanzaku-input into the branch that sets the flag; every
         other focusable target, including .receipt-price-input,
         falls into the else that clears it and calls
         updateNumpadVisibility(). The two states are mutually
         exclusive by construction.
     v1.3 (boot-time scroll evaluation gate)
       - evaluateScrollState() now early-returns on
         !tableUnlocked || _tlDocTop <= 0. The module-level
         scheduleEvaluation() call at the bottom of app.js fires on
         script parse, ahead of the window.load handler that runs
         refreshTransitionGeometry(). On that first tick _tlDocTop
         is still its initial 0, so evaluateScrollState() computed
         lineTop = _tlDocTop − scrollY = 0, saw 0 < winH − 20, and
         called revealTableSection() — adding body.warm-background
         (the apricot #FBECE0 canvas tint) and activating .divider,
         .reject-row, and .table-card while the name screen was
         still up.
       - The visible symptom was a background shift on cold boot;
         the name screen carries background: transparent, so the
         body's warm-background class showed through. The state
         symptom was worse — tableEnteredView was pinned to true
         before the user had done anything, so the transition-line
         reveal that should fire when the user scrolls past panel 5
         was silently pre-empted.
       - Two clauses. !tableUnlocked is the primary gate; _tlDocTop
         <= 0 is the geometry-readiness check that covers any
         hypothetical path reaching scheduleEvaluation() after
         unlock but before the first refreshTransitionGeometry()
         completes.
       - The guard does not strand updateSummaryVisibility() or
         updateIntroHintVisibility(). Both have independent entry
         points that the early return does not reach, and both are
         inert while the body is locked. The 80ms scheduleEvaluation()
         in goToPanel(5) does not itself trigger revealTableSection()
         — at panel 5 with scrollY === 0 the transition line sits
         well below winH − 20. What the 80ms tick does is re-enter
         updateSummaryVisibility() and updateIntroHintVisibility()
         against a populated geometry cache for the first time.
       - updateTransitionBodyEffects() is left unguarded. Its
         scrollY <= 0 early return already neutralises the pre-load
         tick, and the position: fixed body lock makes a non-zero
         scrollY before window.load nearly unreachable.
     v1.3 (receipt first-service re-derivation)
       - applyTyPanel1Content() now derives the panel-1 variant
         from the live receipt DOM rather than reading the
         firstServiceInReceipt snapshot captured inside
         buildReceipt(). The snapshot was set once when the receipt
         was first constructed and never refreshed, so a therapist
         who checked the first preset, advanced to the receipt, and
         then removed that line item via the × button still saw the
         microbikini variant on the thank-you carousel.
       - The same stale-flag leak ran through the reopened-from-
         thankyou path. tyReceiptBtn calls buildReceipt() on reopen,
         but the reopened confirm routes into
         resumeThankyouSequence(), which does not re-render panel-1
         content. Any change made during the reopen was invisible
         when she resumed. resumeThankyouSequence() now calls
         applyTyPanel1Content() at its head. The receipt's DOM is
         still live at this point — the screen is hidden but not
         torn down.
       - The derivation walks .receipt-item elements in DOM order,
         skips those with data-removing === 'true' or the .removing
         class, and tests whether the first survivor's
         .receipt-item-name matches PRESETS[0].name. That mirrors
         buildReceipt()'s original predicate exactly — "first item
         built matches" — rather than a looser "any item matches"
         test that would collapse to the same truth value today but
         drift under a future re-ordering amendment.
       - A rejected early return sits at the head of the function.
         confirmYes's rejected branch transitions directly to
         thankyouScreen without calling buildReceipt(), so
         receiptItems may still hold the previous session's
         elements — and returnToTable() does not clear them. Without
         the guard, the DOM walk would find the stale first-preset
         item and paint the microbikini variant for a session that
         rejected everything. The guard short-circuits to
         TY_PANEL1_DEFAULT_HTML and sets the flag false before the
         walk runs.
       - firstServiceInReceipt is now derived, not stored. The four
         supporting sites in buildReceipt() — the firstRowIncluded
         local, the preset0Val local, the itemCount === 0 &&
         preset0Val !== '' && name === preset0Val conditional, and
         the firstServiceInReceipt = firstRowIncluded assignment —
         are all retired. preset0Val had no other reader once the
         assignment was gone. The firstServiceInReceipt = false
         assignment inside confirmYes's rejected branch is also
         removed: the guard sets it on the next
         applyTyPanel1Content() call, and applyTyPanel1Content()
         becomes the single writer of the flag.
     v1.3 (HUD width alignment)
       - The canvas backing store was 282 CSS pixels wide while the
         card's content box was 288px. The card declares width:
         318px, box-sizing: border-box (set globally), 1px borders
         each side (2px), and 24px 14px 10px 14px padding (28px
         horizontal). 318 − 2 − 28 = 288. The canvas at width: 100%
         displayed at 288px, stretching the 282-wide raster by ~2.1%
         horizontally. Every wave peak landed 2.1% further right
         than the drawing math intends.
       - The stale value was inherited from the retired 25-column
         waterline renderer and never revisited when the fluid-
         waveform design landed at v1.3. Fixing the number that was
         wrong (the coordinate space) rather than warping a correct
         number (the padding) preserves the card's internal
         proportions. HUD_DISPLAY_W is only read as a scalar width
         in drawHudSpectrum() and drawFluidRibbon(); 282 → 288
         shifts every x-coordinate proportionally.
       - The invariant HUD_DISPLAY_W === .audio-spectrum-hud
         content-box width is now documented at both sites — as a
         comment on the var declaration in app.js and as a comment
         on the CSS rule in main.css — so a future amendment that
         changes the card's width or horizontal padding cannot
         silently reintroduce the mismatch.
     v1.3 (HUD Hann pre-compute and dead-code pruning)
       - drawFluidRibbon()'s per-frame Hann window is now a lookup
         table. The envelope term — Math.sin(norm * π)² for every
         one of the 28 control points, on each of the 6 layers,
         every animation frame — recomputed the same 28 constants
         6× per frame at up to 120 Hz, roughly 20,160 redundant
         trig evaluations and squarings per second. _hudHannWindow
         is a 28-entry Float32Array populated once at module scope
         by a self-invoking function; the loop in drawFluidRibbon()
         collapses to a single array read. The IIFE is deliberate —
         a plain for at module scope would leak its loop counters as
         window globals, since app.js is a classic script.
       - PANEL_PHRASE_MODE retired. It was a two-way tuning switch
         between 'coexist' and 'sequence'; the codebase has only
         ever run 'coexist', and the 'sequence' branch's baseDelay =
         PANEL_PHRASE_DELAY was never exercised. Both ternaries in
         playPanel1SpecialSequence() and playPanelPhraseReveal() now
         read var baseDelay = 0; directly. PANEL_PHRASE_DELAY = 300
         retires with it — its only reader was the
         Math.max(0, PANEL_PHRASE_DELAY - 300) expression inside the
         dead branch, which always evaluated to 0.
       - Three dead DOM refs removed. nameScreenTable was declared
         at module scope and never read. therapistNameEl was assigned
         twice (declaration and inside buildPanel1OpeningBeats())
         and never read. receiptTotal was declared and never read —
         the receipt total is written through receiptTotalNumber,
         the digit-roll container inside #receiptTotal.
     v1.3 (fluid waveform HUD revamp)
       - The HUD layout is rebuilt around the reference design:
         red box (top-left) — playback status · yellow box
         (top-right) — download progress · blue box (centre) —
         track · artist · six-layer fluid spectrum resting flush
         on top of the progress bar · split timestamps below.
       - Top-left and top-right badges are absolutely positioned
         at top: 8px matching the left/right 8px side inset, so
         再生中 pins hard to the top-left corner and DL XX% to the
         top-right. The dual-writer race that existed under the
         previous single-slot label row disappears: status and
         download now own independent DOM targets.
       - The 25-column waterline-mirror spectrum is replaced by a
         six-layer fluid waveform. Each layer reads its own
         frequency band — LAYER_BIN_START/END span bins 3 through
         120, ~280 Hz to ~11 kHz at 48 kHz with fftSize 512 — so
         the stack covers a wider slice of the spectrum than the
         previous shared-band renderer. Bands overlap slightly so
         transitions between layers do not leave visible gaps.
       - Canvas height grows from 26 to 44px so the taller peaks
         have room. HUD_WAVE_PTS is 28 control points per layer
         (previously 16), finer spatial resolution across each
         band. _hudMirrorValues is resized to 6 × 28 = 168 floats,
         a single pre-allocated Float32Array so the renderer
         remains zero-allocation at 120Hz.
       - Each ribbon is drawn with quadratic smoothing between
         consecutive control points, then snapped to the final
         computed vertex before closing down to the baseline at
         the right edge. Without the snap-to-vertex, the last
         quadratic curve ends at the midpoint between the final
         two control points and the closing lineTo(w, baseY)
         leaves a sub-pixel diagonal seam.
       - Hann window (sin²) modulates the per-layer amplitude so
         the fluid hills taper smoothly into the progress bar at
         both ends.
       - The gauge bar is thickened from 6 to 5px and gains a
         glowing playhead dot (::after) at the right tip of the
         fill. Fill uses a linear-gradient from --glow to
         --accent; the ready state swaps in --accent → #882E47
         so background-I/O completion remains visible.
       - Split timestamps (#hudTimeElapsed / #hudTimeTotal) replace
         the previous MM:SS / MM:SS single-label readout. During
         playback the elapsed time updates once per whole second
         in updateHudProgress(); _hudRenderState() writes the
         initial 00:00 / MM:SS at the moment playback starts so
         the row is never briefly blank.
       - HUD card adopts the tanzaku paper texture — background-
         color #fcfbf9 plus icons/1790678998862.jpg at bottom
         right — matching the tanzaku focus modal's material.
         Sakura block gains --secondary-accent: #9a3e4d in
         lockstep so --secondary-accent becomes a cross-theme
         token rather than an autumn-only ad-hoc property.
       - _prefersReducedMotion is declared once in the wind field
         section as a global accessibility intent, distinct from
         windEnabled (stage particle physics). Under reduced
         motion, _hudPhase freezes so the travelling phase stops,
         but the amplitude response to live audio stays active:
         vertical displacement is state feedback, lateral drift
         is decorative. Badge/gauge pulses are killed by a
         media query in main.css.
       - src.onended timing guard. The source is stopped 100ms
         past the fade-out tail while scheduleNextAmbient() re-
         arms right on playDur, so src1's onended can fire during
         the first frames of src2. Previously the ambientSource
         null was guarded but the timing trio was not, so src1's
         handler clobbered src2's start time and duration and the
         HUD pinned to 00:00 / 00:00 after every transition. All
         three timing resets now sit behind the identity check.
     v1.3 (front-layer falling leaves)
       - A second overlay, .maple-leaves-overlay-front (z-index 5),
         receives 2 randomly-chosen mid/near leaves at each carousel
         activation so the panel prose reads as nestled among the
         foliage. The back overlay (z-index -1) keeps the remaining
         10 mid/near leaves and all 6 far-plane leaves.
       - distributeFrontLeaves() runs at the moment
         triggerKoiStart() adds .active to #mapleLeaves. It returns
         any leaves previously promoted to the front (so re-entry
         re-rolls cleanly), collects the mid+near pool from the
         back overlay, and Fisher-Yates-partial-shuffles two of
         them into the front.
       - Far-plane leaves are deliberately excluded from the pool —
         the depth-of-field layer always stays behind the text.
         Blur never appears in front of the prose.
       - Front-promoted leaves read at higher opacity so the text
         behind them visibly disappears during a crossing rather
         than tinting through. The scoped override lives in
         main.css:
             .maple-leaves-overlay-front .leaf-mid  { --leaf-opacity: 0.86; }
             .maple-leaves-overlay-front .leaf-near { --leaf-opacity: 0.90; }
         Back-plane siblings keep their 0.32 / 0.44. The drift
         keyframes read var(--leaf-opacity, 0.32) at their peak
         stops, so the new values are inherited automatically — no
         keyframe changes required.
       - The front overlay's .active class mirrors the back
         overlay's at the two existing call sites — triggerKoiStart()
         and returnToStartScreen(). Return-to-start does not return
         the promoted leaves to the back; the next activation's
         distributeFrontLeaves() call handles that as its first
         step, so the cleanup lives in one place rather than
         spread across exit and entry.
       - z-index 5 was chosen to sit above panel content (default
         auto / 0) but below every interactive control: theme toggle
         (10), global hint (9), dots (10), HUD (40), summary (50),
         numpad (120), every modal (100+), receipt (300),
         thank-you (350). No leaf ever covers a tappable element.
     v1.3 (phrase-aware text reveal via Intl.Segmenter)
       - chunkPanelText() rewritten around Intl.Segmenter('ja',
         { granularity: 'word' }). The previous implementation cut
         at random 5-10 character windows using String.substr,
         which landed inside Japanese lexical units — お部屋までお
         / 越しいただき instead of お部屋まで / お越しいただき —
         and made the stagger reveal read as mechanical fragments
         rather than the breath-rhythm it was tuned for.
       - Three aggregation rules replace the old fixed-window cut:
           1. Flush when appending the next segment would exceed
              PANEL_PHRASE_MAX, provided PANEL_PHRASE_MIN density
              is already met.
           2. Flush on 、。！？ only after PANEL_PHRASE_MIN weight
              is met. Formal Japanese uses 、 densely; flushing
              unconditionally fragments polite lead-ins like
              「もし、」 or 「どうぞ、」 into isolated 2-3 character
              flashes. Deferring the flush binds the punctuation
              to its following clause.
           3. Fuse any undersized tail remainder into the preceding
              chunk so no standalone sliver reaches the DOM.
       - The ~25-line post-processing block in the old chunker —
         leading-punctuation scan, peel-off, graft onto previous,
         two-pass under-length merge — is retired entirely.
         Segmenter returns punctuation as distinct segments and
         the accumulator only appends, so leading punctuation is
         structurally impossible and the tail-merge reduces to a
         single conditional.
       - codepointCount(str) = Array.from(str).length replaces
         UTF-16 .length for the size checks. Array.from iterates
         code points, so a surrogate pair counts as one visual
         character. The old substr path could split a surrogate
         pair at an odd boundary and corrupt the DOM node with a
         replacement glyph — latent today (panel content is BMP-
         only) but the fix is free once the chunker operates on
         tokens.
       - The size accumulator is hoisted out of the loop and
         incremented by segLen per segment, reset to 0 on each
         flush. Calling codepointCount(currentChunk) on every
         iteration would re-parse the whole accumulated chunk per
         segment, making the pass quadratic in total segments;
         the incremental form is a clean linear O(N).
       - chunkPanelTextFallback(clean) retains the previous body
         verbatim as the non-Segmenter path. Feature detection
         covers any engine that lacks Intl.Segmenter (Chromium
         87+ / Safari 14.1+ / Firefox 125+ all have it, so the
         fallback never fires on target hardware). The fallback's
         header comment notes it still uses UTF-16 code units and
         can split surrogate pairs — it is a non-breaking legacy
         path, not an equivalent implementation.
       - escapeHtmlForPhrase() deleted. Unreferenced —
         wrapTextNodeInPhrases uses textContent, and the
         punctuation-shuffling code that might have needed it is
         retired with the rewrite.
       - isJapanesePunctuation() retained unchanged — it now
         serves as the flush oracle rather than a boundary-
         shuffler, but the predicate itself is identical.
       - segmenterJa is constructed once at module scope, not per
         call. preparePanel() runs once per panel on load, so the
         whole pass is off the frame budget.
     v1.3 (raw fetch retry + pre-decode window reduction)
       - Ambient raw MP3 fetches are now retried on demand. The
         previous architecture fetched each ambient URL exactly
         once, from initSound(). A failed download on flaky Wi-Fi
         left _ambientRawBuffers[url] permanently unpopulated, so
         playAmbientSound()'s 500ms retry polling drained its
         120-attempt counter over ~60s and then terminated the
         schedule — the slot stayed silent until a page reload.
       - fetchAmbientRaw(track) memoizes the in-flight fetch
         promise in _ambientRawPromises[url]. All callers — the
         boot loop in initSound() and the on-demand path from
         decodeAmbientSlot() — share a single in-flight fetch per
         URL. Without the memo, a boot fetch that hasn't resolved
         by the time playAmbientSound() first polls would spawn a
         second parallel download of the same 16 MB file on a
         connection that is already struggling.
       - decodeAmbientSlot(track) now calls fetchAmbientRaw(track)
         instead of reading _ambientRawBuffers[url] directly. When
         the raw bytes are missing, the fetch is kicked off and
         awaited; when the fetch fails, the promise resolves null
         and the _ambientDecodingPromises entry is deleted, so the
         next 500ms tick re-enters cleanly and retries. The 120-
         attempt cap in playAmbientSound() still bounds the whole
         retry window at ~60s, preserving the existing terminal-
         stop contract.
       - The `res` passthrough on the trailing .then() in
         decodeAmbientSlot() preserves the resolved AudioBuffer
         (or null) for callers. Today's callers ignore the value,
         but the omission would have silently resolved the whole
         chain to undefined and made the helper unusable for any
         future caller that wants the buffer back.
       - _hudRenderState()'s 展開中 branch now requires
         _ambientRawBuffers[currentTrack.url] alongside the in-
         flight-decode check. Under the new architecture
         _ambientDecodingPromises[bufferName] is set before the
         raw fetch resolves — that is the shape of the chain — so
         without the guard the badge would claim PCM展開中 while
         bytes were still on the wire. The badge now reads DL XX%
         during a re-fetch and snaps to PCM展開中 only once
         decodeAudioData actually starts.
       - SLOT_PRE_WINDOW_MS reduced from 10 minutes to 2 minutes.
         The 10-minute window kept current + next slot decoded in
         parallel for ten full minutes per transition, exposing
         ~750 MB of PCM for twice the useful duration. Decode
         takes ~1.2s on Adreno; the shorter window still leaves
         ample headroom for the decode plus a cold-launch download
         race, and cuts the dual-resident exposure by ~5×. The
         scheduler comment block has been rewritten to reason from
         the new value.
       - makeSeamlessLoop() copies the prefix via
         dst.set(src.subarray(0, newLength)) instead of a manual
         index loop. Same result, single built-in call.
     v1.3 (loadDropBuffer removal)
       - The loadDropBuffer() helper was a byte-for-byte duplicate
         of loadAudioBuffer() with the URL hardcoded and the error
         string swapped. The two differed only in DROP_SOUND_URL
         versus the url argument, and in the thrown error text —
         the latter is swallowed by .catch(function() { return
         null; }) at the tail, so it is not observable. The
         function has been removed and the initSound() call site
         now reads loadAudioBuffer(DROP_SOUND_URL). Function
         hoisting makes the textual reorder safe: loadAudioBuffer
         is a function declaration, hoisted to the top of its
         enclosing scope before any statement runs.
     v1.3 (slot pre-decode lifecycle scoping + busy-loop fix)
       - scheduleNextSlotPreDecode() split into two clauses gated
         on SLOT_PRE_WINDOW_MS (10 minutes). The previous single-
         timer form fired at (boundary - 10min); if that moment
         fell inside the pre-window itself, msUntilNextPhaseBoundary
         returned a value ≤ SLOT_PRE_WINDOW_MS, the subtraction
         clamped to 0, and the setTimeout callback re-entered the
         same branch ~250 times per second for the full 10-minute
         window — ~150,000 timer wakeups plus three Date
         allocations per tick, twice per day cycle on a battery-
         powered tablet. The dead-reschedule (toBoundary + 1000ms)
         parks the timer just past the boundary so the next
         evaluation sees a fresh multi-hour value and drops into
         the outside-window clause.
       - The 5-hour premature decode is closed by the same split.
         The previous form, on the fire that followed the boundary,
         saw current and next already flipped and routed into the
         else-if branch, decoding the following slot five hours
         early. The new clause 2 is a pure arm — it only decodes
         when current or next is missing, which after a normal
         boundary crossing is never.
       - Cold-boot inside the pre-window (e.g. tab opened at 16:55)
         is covered by clause 1's !soundBuffers[nextEarly.bufferName]
         check, which kicks the incoming slot's decode immediately
         and then sleeps past the boundary.
       - Lifecycle scoping: scheduleNextSlotPreDecode() is now
         armed by startAmbient() and disarmed by stopAmbient(),
         matching the .active gate that already governs the chime
         and swell loop. The arming previously lived in
         initSound()'s decode .then(), which meant a tablet parked
         on the name / blossom screen could wake at 16:50 / 21:50 /
         04:50 to decompress ~375 MB PCM for an inaudible engine,
         and a user who tapped the reset hotspot to return to the
         start screen left the timer running indefinitely across
         day/night boundaries. Under the new scoping, a phase flip
         while idle is recovered by playAmbientSound()'s transient
         guard via the 500ms retry path — decode resolves in
         ~1.2s, well inside Panel 0's 1.4–2.0s visual entrance
         envelope.
     v1.3 (HUD rides above the summary bar)
       - The audio HUD lifts by the summary bar's rendered height
         when the price summary becomes visible, preserving the
         same 28px + safe-area gap it carries against the viewport
         bottom. The height is measured at runtime into
         --summary-h rather than hard-coded, because the summary's
         padding, breakpoint scaling, and env(safe-area-inset-
         bottom) all vary with viewport.
       - Motion is coupled to the summary's own slide: both the
         summary bar and the HUD's transform leg run at 0.5s on the
         same cubic-bezier(0.4, 0.0, 0.2, 1) — an asymmetric
         S-curve with zero initial slope (soft lift-off) and near-
         zero terminal slope (soft arrival). Matching durations
         ensures both motions land at the same instant; matching
         curves ensures the HUD's 28px gap against the summary's
         moving top edge holds at every intermediate frame, not
         just at the endpoints. The previous ease-out curve placed
         maximum velocity at t=0, which read as a lurch on a
         ~75px displacement.
       - The lift is gated on :has(.summary.visible) in main.css,
         so every existing call site that toggles the summary's
         visibility picks it up automatically — no coupling
         between the summary state machine and the HUD. On hide,
         the :has() selector stops matching, the cascade falls
         back to the base .shown rule's translateY(0), and the HUD
         descends over the same transition. The measured
         --summary-h is not consulted on the descent; the target
         is always the base position, so a mid-flight height
         change cannot strand the HUD off-anchor.
       - measureSummaryHeight() writes the value to --summary-h on
         documentElement. Re-measured by a ResizeObserver bound to
         the summary element (fires on observe plus on any layout
         change: font-load reflow, breakpoint crossing, safe-area
         recomputation) and by the existing window resize /
         orientationchange handlers.
       - The HUD's opacity leg stays at 0.6s ease — it governs the
         HUD's intro show, which is unrelated to the summary
         choreography.
     v1.3 (HUD visible on the thank-you screen)
       - The audio HUD now remains visible on the thank-you
         carousel, elevated above the 内容を確認する button. The
         base shown-state CSS gate drops :not(.thankyou-active);
         an elevated-position rule under body.thankyou-active
         applies a 60px lift, which clears the ty-receipt-btn's
         top edge across all breakpoints (button top edge at
         ~50 / 64 / 70px from viewport bottom, HUD bottom at 28px
         base + 60px lift = 88px).
       - _hudShouldDraw()'s thankyou-active clause is removed so
         canvas rasterization continues during the thank-you
         sequence. The receipt-locked clause is retained: the
         receipt overlay keeps the HUD hidden, matching the
         "Receipt page no hud" requirement.
       - The full cycle thank-you → receipt → service table
         produces exactly one opacity transition per state change.
         .shown is added once in triggerKoiStart() and removed
         only in returnToStartScreen(), so it does not toggle
         across this cycle; opacity is driven purely by the two
         body-class gates. The receiptOpenedFromThankyou window —
         where thankyou-active and receipt-locked are both set —
         keeps the HUD hidden via the :not(.receipt-locked)
         clause, so closing that receipt and returning to the
         thank-you screen produces one fade-in, not a fade-in-
         then-fade-out.
     v1.3 (lazy slot-based decode)
       - The three ambient beds are downloaded in parallel but
         only the current Nagoya phase is decoded into PCM at
         boot. Previously all three decoded eagerly, putting
         ~1.13 GB of linear float32 PCM into the tab's Web Audio
         heap — right on the Android renderer's 1.5-2.0 GB LMK
         boundary, and the primary cause of observed tab reloads
         during long sessions.
       - Steady-state footprint drops from ~1.13 GB to a single
         decoded slot (~358-396 MB, dependent on phase) plus
         ~48 MB of compressed MP3 ArrayBuffers held for later
         decode plus ~6-8 MB of one-shot buffers (stream, chime,
         drop, UI synths). Cold-boot heap snapshot should show
         exactly one large AudioBuffer allocation.
       - Slot transitions: scheduleNextSlotPreDecode() fires
         10 minutes before the next Nagoya boundary (05:00,
         17:00, 22:00 JST) and pre-decodes the incoming phase.
         Peak during the overlap window is ~730-770 MB. Once
         the outgoing track's fade-out completes and
         src.onended fires, gain.disconnect() plus the nulling
         of soundBuffers[oldSlot] releases the ~375 MB block for
         garbage collection.
       - decodeAmbientSlot() memoizes in-flight decode promises
         in _ambientDecodingPromises[bufferName]. Without this
         guard, playAmbientSound()'s 500ms retry polling would
         stack 2-3 concurrent decodeAudioData passes on a
         ~1.2s mobile decode, spiking transient heap back up
         past 1 GB — the exact problem the redesign was meant to
         solve.
       - raw.slice(0) before decodeAudioData is load-bearing,
         not defensive: the Web Audio spec detaches the passed
         ArrayBuffer, and without the clone _ambientRawBuffers
         entries would be neutered after their first decode.
       - HUD: _hudDecodedCount / _hudTotalFiles removed. The
         "fully resident" state is now derived per-frame from
         soundBuffers[getCurrentAmbientTrack().bufferName]
         (slot ready) plus pct >= 1.0 (all raw MP3s downloaded).
         The badge ladder is preserved:
           playing              → 再生中
           decoding current slot → 展開中
           transfer in flight    → DL XX%
           slot ready + settled  → 待機完了
         The gauge fill's amber→plum transition remains gated on
         pct >= 1.0 so it still signals background I/O
         completion.
     v1.3 (HUD timestamp readout)
       - The HUD label row now shows elapsed / total playback time
         (mm:ss / mm:ss) during the playing state, replacing the
         blank text that used to leave the 10px label row empty.
         Written once per second from updateHudProgress(), using the
         same soundAudioCtx.currentTime source as the gauge fill.
         Zero-padded both fields so the string width is constant
         and the label does not jitter horizontally as seconds tick.
       - _hudRenderState() writes the initial 00:00 / MM:SS
         timestamp at the moment playback starts, so the label is
         never briefly blank between the "待機完了" state and the
         first updateHudProgress() tick.
       - getPlaybackElapsed() centralises the elapsed-time clamp so
         both writers read from a single source of truth.
       - During playback the label shows the timestamp
         unconditionally, regardless of whether background ambient
         beds are still streaming. This closes a cold-launch dual-
         writer race where _hudRenderState() at 10Hz would flap
         between "DL 48%" and "00:04 / 17:00" while Tracks 2 and 3
         were still downloading. The badge remains the indicator of
         background decode progress; the gauge fill transitions
         from amber to plum when the full acoustic bed is resident.
       - _hudLastRenderedSec resets to -1 in stopAmbient() alongside
         ambientPlayStartTime and ambientPlayDurationSec, keeping
         the three playback-window state variables in one cohort.
       - Assumes tracks under one hour. All current AMBIENT_TRACKS
         are 16-18 minutes; a longer bed would need hh:mm:ss.
     v1.3 (HUD gauge repurposed: playback progress)
       - The gauge bar now tracks playback progress of the current
         ambient bed rather than download progress. While playing,
         the fill advances from 0% to 100% over playDur (or
         maxPlaySec, if the track is capped); on track end the bar
         reverts to loading mode and resets on the next cycle.
       - The MB (RAM) byte readout is removed. The badge already
         surfaces loading state (DL XX% / 展開中 / 待機完了 /
         再生中) and hudPctStatus carries the numeric percent
         during download, so the byte line was redundant.
       - The bar is thickened from 2px to 6px so playback position
         is legible at a glance on the silk-white HUD card;
         border-radius tracks the new height.
       - Single-writer discipline: _hudRenderState() skips its
         width write whenever ambientSource !== null; the swell
         loop is the sole writer of the fill during playback. The
         two never race.
       - Progress is computed from soundAudioCtx.currentTime, so
         the fill is accurate across fade-in, main body, and
         fade-out.
     v1.3 (sound readiness decoupling)
       - soundReady now flips after the three synthesised UI
         sounds (tock / check / paper) finish rendering via
         OfflineAudioContext — ~5ms after the audio context is
         created — rather than waiting on the 50 MB of ambient
         MP3s to stream and decode. The audible UI feedback
         (checkbox taps, numpad presses, paper transitions) is
         now available from the very first user tap on a cold
         cache.
       - Ambient beds, stream, wind chime, and the koi drop one-
         shot load asynchronously in parallel; each call site
         already guards on its specific buffer so a not-yet-
         resident buffer bails silently rather than playing a
         partial or double-start.
       - playAmbientSound() now distinguishes terminal guards
         (sound disabled, non-autumn theme, carousel inactive,
         no AudioContext) from transient guards (UI synth
         pending, ambient buffer not yet resident). Terminal
         guards return 0 and stop the schedule; transient guards
         return 500 (ms retry delay) and are capped at 120
         attempts ≈ 60s, after which the schedule terminates.
         scheduleNextAmbient() exits on any prevPlayMs <= 0,
         closing the zombie-poll race where a mid-flight tick
         could re-arm after stopAmbient() already cleared the
         timer.
       - playSound() gains a defensive soundAudioCtx.resume() so
         a context that was suspended between the first user
         gesture and a subsequent tap is revived on the tap
         rather than silently swallowing the sound.
     v1.3 (audio spectrum HUD)
       - New bottom-left persistent HUD surfacing the currently-
         playing ambient bed: track title, artist, a 25-column
         waterline-mirror spectrum on a 282×26 micro-canvas at 2×
         DPR, and a two-stage loading gauge that distinguishes
         stream transfer from PCM decompression.
       - Three logical Nagoya time phases decoupled from physical
         buffers: Morning (草原の風) plays Sound/Morning.mp3,
         Early Evening (虹を見た日) plays Sound/Earlyevening.mp3,
         Late Night (カタライザー) plays Sound/Latenight.mp3. Each
         phase resolves its buffer through track.bufferName so the
         phase-to-file mapping stays 1:1 in memory.
       - Aggregated loading tracker: three unique URLs tracked in
         _hudBytesLoadedMap / _hudBytesTotalMap.
       - Single-authority state renderer _hudRenderState(). Both
         the streaming loader and the playback lifecycle call it;
         they never write badge or gauge state directly.
       - Streaming loader switched from response.arrayBuffer() to
         response.body.getReader(), with a byte counter feeding the
         gauge. Updates are throttled to 100ms with a force bypass
         on stream-end and decode-end so the final state transitions
         land immediately.
       - Canvas rendering is gated on both _scrollActive (shared
         with the swell CSS write) and _hudShouldDraw() (a JS mirror
         of the CSS visibility rule), so the 120Hz redraw is halted
         whenever the HUD is hidden — during the receipt dwell, the
         thank-you sequence, or an active scroll.
       - Zero per-frame allocations in drawHudSpectrum(): the two
         gradient stops per bar were replaced with solid fills
         (themeAccent above the waterline, themePetal at
         globalAlpha 0.46 below), eliminating 6,000 CanvasGradient
         allocations per second at 120Hz.
       - roundRect feature-detected; falls back to rect on any
         engine that lacks it.
     v1.3 (passive-touch scroll path)
       - The stage's touchmove listener is now passive. Its
         horizontal branch no longer calls preventDefault because
         .stage's touch-action: pan-y already tells the browser to
         route vertical gestures to the scroller and horizontal
         gestures to JS. A non-passive touchmove forces Chromium to
         wait for the handler before it can begin the scroll, which
         made the scroll position lag behind the finger even when
         frames were otherwise healthy.
       - The document-level scroll guard is now attached
         conditionally — only while the table is locked. It is
         registered by attachScrollGuard() and removed by
         detachScrollGuard(), both of which use a single named
         function reference so add/removeEventListener pair
         correctly across the carousel lifecycle. Previously the
         guard was registered globally and returned early after the
         table unlocked, which still forced the browser to wait for
         the (empty) handler on every touchmove.
       - The document-wide touchstart listener that suppressed
         pinch-zoom via a preventDefault was removed. touch-action:
         pan-y on body plus the viewport meta already handle that.
       - onDocTouchMoveGuard remains non-passive: it is the one
         listener that genuinely needs preventDefault, and it is
         only live while the user is on the koi screen or the panel
         carousel.
     v1.3 (scroll-aware swell gate)
       - The swell loop's CSS write (applySwellToCSS) is now gated on
         a _scrollActive flag. During scroll, the loop keeps updating
         its energy envelope but skips the custom-property write,
         because that write forces a style recalc down the full
         ambient stage subtree and competes with the scroll tick for
         the same frame budget. The energy envelope continues to
         track the audio so there is no step-function when scroll
         ends.
       - The flag is armed on every scroll event, refreshed by a
         200ms fallback timer, and cleared immediately by the native
         scrollend event where supported (Chromium 114+, which
         covers Samsung Internet on the S8 Ultra).
       - stopSwellLoop() now clears the pending timer and resets the
         flag, so a return-to-start-screen mid-scroll leaves no
         leaked timer or stale gate state.
     v1.3 (blossom stream deferred start)
       - tryStartBlossomStream() wrapper. startBlossomStream() was
         being called from confirmName()'s 420ms animation timeout
         and from returnToStartScreen(), neither of which is
         coupled to audio readiness. On a warm cache the stream MP3
         decoded in under 420ms and played; on a cold cache or slow
         network it was still decoding, hit the readiness guard, and
         returned silently with no retry. The wrapper polls
         soundReady / soundBuffers.stream up to 15 times at 400ms
         intervals and starts the stream when both are true. It
         self-terminates on the isBlossomInteractive() guard so a
         user who swipes away mid-decode does not get a spurious
         stream later.
     v1.3 (numpad isolation, no JS-side change)
       - The numpad GPU-dropout fix is entirely in main.css
         (visibility: hidden on the base state, asymmetric
         visibility transition, will-change on .visible, reduced
         shadow blur). updateNumpadVisibility() continues toggling
         the .visible class unchanged.
     v1.3 (scroll performance, rAF consolidation)
       - Merged the two independent scroll rAF loops
         (scheduleEvaluation and scheduleTransitionBodyUpdate) into
         a single scheduleScrollTick dispatcher. Running them as
         two separate requestAnimationFrame callbacks allowed them
         to interleave within a frame in either order, so a
         transform write from one could land after the geometry
         read from the other and invalidate the read. One rAF, one
         order, no thrash.
       - Eliminated every getBoundingClientRect() call from the
         active scroll path. refreshTransitionGeometry() now caches
         document-relative offsets for #transitionLine, #tableCard,
         #rejectRow, and the first two table rows. All scroll-time
         visibility decisions are pure arithmetic against the cache
         and window.scrollY. The cache is invalidated from:
           · window.load (boot)
           · window.resize / orientationchange
           · document.fonts.ready
           · confirmName() after the dynamic rows are appended
           · after loadAllPanels() resolves
       - updateTransitionBodyEffects() now writes transforms only
         when the composed string actually changes. At 120Hz the
         drift values quantise to the same .toFixed(2) output
         across many consecutive frames, so the majority of writes
         are skipped. An out-of-zone latch (_tlDriftActive) fires
         the transform reset once on zone exit rather than on every
         out-of-zone frame.
       - updateIntroHintVisibility() and updateSummaryVisibility()
         take scrollY / vh arguments with undefined-safe fallbacks,
         so the non-scroll callers (updateGlobalHint, rejectRow
         timeouts) continue to read window state without silently
         producing NaN.
     v1.3 (audio-reactive swell system)
       - New parallel analyser tap feeding a Web Audio analysis
         loop that drives two CSS custom properties on the
         background layers: --audio-swell on the Layer 1 diffuse
         mesh and on the new Layer 2 mirrored-lattice mask.
         The tap is a leaf node off soundMasterGain via a 2.0×
         compensation gain so the analyser sees the pre-master-
         attenuation signal and the sandbox calibration (noise
         floor 80, gain 3.5, attack 0.06, decay 0.010) transfers
         unchanged. The audible path is untouched.
       - Lifecycle piggybacks on startAmbient() / stopAmbient(),
         which are already gated on the #mapleLeaves .active class.
         stopSwellLoop() flushes --audio-swell to 0 so the
         background does not freeze half-inflated if the user
         returns to the start screen mid-beat.
       - Guardrail: the swell drives opacity and transform only.
         No per-frame filter recalculations.
       - Epsilon deadband: applySwellToCSS() skips the style write
         when the energy envelope has moved less than 0.005 since
         the last write, except when the new value is exactly 0
         while the previous write was not. The predicate is split
         into two clauses — an identity check for the settled-zero
         case and a delta check for the general case — because a
         single compound predicate cannot express both intents.
         The identity check is what stops the write on every frame
         after the fallback branch has clamped swellEnergy to
         exactly 0; a single `Math.abs(val - last) < 0.005 &&
         val !== 0` would have evaluated to false in that state and
         allowed the write through on every frame of silence.
     v1.3 (acoustic engine unit convention + wind chime fixes)
       - Wind chime scheduler pileup fixed. playWindChimeSound()
         was returning raw seconds (~13) to scheduleNextWindChime(),
         which treats the value as milliseconds. The delay collapsed
         to 13ms + silenceGap, so chimes re-armed every ~1.5s while
         the previous one was still playing. Fixed at the return
         boundary: playDur * 1000.
       - Wind chime random windowing restored. WIND_CHIME_PLAY_MIN
         and MAX were expressed in ms while bufferDur is in seconds,
         so the bufferDur-based clamp (playDur > bufferDur - 1)
         always fired. Every chime played the full file minus one
         second, and maxStart collapsed to 0.5s so the random offset
         never moved. Constants now expressed in seconds to match
         the Web Audio scheduling world, and the off-hours 60s
         backoff replaces the ~1.5s re-arm between 17:00 and 04:59.
       - AMBIENT_FADE_IN / AMBIENT_FADE_OUT standardised to seconds
         (3.0 / 4.0). The /1000 divisions inside playAmbientSound()
         are dropped; bufferDur was already in seconds, so the
         expression now reads consistently on both sides.
       - Architectural convention now enforced across the entire
         acoustic engine:
             · playback parameters (play windows, fades) → seconds,
               consumed by Web Audio scheduling calls
             · scheduler timers (silence gaps, re-arm delays) → ms,
               consumed by setTimeout
             · the only crossing between the two worlds is
               `return playDur * 1000` at the tail of each player
               function
         Constant declarations carry an inline // seconds or // ms
         label so the two conventions are visible at the point of
         authoring rather than needing to be inferred from usage.
       - Earlyevening.mp3 gains a 16-minute playback cap via the
         maxPlaySec field on AMBIENT_TRACKS. The last minute of
         the source file is no longer played; the loop re-arms on
         the fade-out tail at 16:00. Morning.mp3 has maxPlaySec:
         null and continues to play the full 17 minutes.
     v1.3 (ambient revamp, phase 2)
       - Wind chime reinstated as a morning-window layer. Runs
         independently of the main ambient bed for the life of the
         carousel, on the pre-revamp random-window / random-offset /
         random-silence schedule:
             12–14s play window at a random offset into the buffer
             2s fade-in, 1.5s fade-out
             500–2000ms silence measured from play END
         Window: 05:00–16:59 Nagoya only. The hour check runs at
         play time, not at schedule time, so a chime mid-flight at
         the 17:00 boundary finishes naturally and the next cycle
         sees the closed window and skips. The timer keeps re-arming
         around the clock regardless, at a flat 60s cadence during
         off-hours so device suspend/resume self-heals without
         needing a page refresh.
         Peak 0.60 — tuned against the new Morning.mp3 bed at peak
         1.00, which is much louder than the old pool members the
         chime used to sit beside. Amplitude ratio bed:chime is
         1.67:1, so the chime reads as a layered presence rather
         than as a texture buried under the bed.
       - Ambient background tracks replaced with a time-bucketed
         full-track loop. Three logical Nagoya phases, three
         physical files (see v1.3 audio spectrum HUD above for
         the current mapping).
         Each play runs the buffer end-to-end (or up to maxPlaySec)
         with a 3s fade-in and a 4s fade-out, then immediately
         re-arms. The hour is checked at play time, not at schedule
         time, so a clip mid-flight when the wall clock crosses a
         bucket boundary finishes naturally and the next cycle
         picks the correct track.
       - Removed from the ambient pool: the nature recording
         (baranova_n-birds-forest-river-409229.mp3) and both night
         clips (Sound/Wind.mp3 and Sound/jauk-calm-zen-river-
         flowing.mp3). Their supporting code is gone.
       - Kept: the koi-dive drop effect (one-shot, start button),
         the blossom-screen flowing-stream bed and its
         makeSeamlessLoop crossfade (start button), and the three
         synthesised UI sounds (tock, check, paper).
     v1.3
       - Shippo tracer fix: scheduleShippoTracer() no longer calls
         stopShippoTracer() at its head.
       - Ambient Shippo mosaic + circle tracer.
       - Ambient video removed, replaced by CSS light mesh.
       - Default theme switched to autumn.
       - Backdrop-filters removed on overlays.
       - Koi tap flinch gated on the koi PNG.
       - Ambient subtle ripples on the koi screen.
       - Start screen reworked: one 4s breath, water-like ripples, pond
         light, bubbles, florets and a koi that blurs as it sinks.
       - Receipt landing serialization.
       - Receipt close restores previous scroll position.
       - Panel-1 post-beat delay lengthened 500 → 1000ms.
       - Scroll gate: body scroll only unlocked at last panel.
       - Reset hot-spot.
       - Transition-line accordion drift.
       - Maple leaf overlay: z-index -1, seven Momiji.
       - 6-panel carousel expansion.
       - Blossom screen: time greeting with the therapist's name
         below, plus three poetic interaction hints.
       - Seamless loop for the flowing-stream bed via
         makeSeamlessLoop().
       - Greeting set revised: warmer, more observational phrasing
         across all 17 branches.
       - Greeting engine consolidated. GREETING_TABLE is a single
         dictionary mapping each tier to { text, burden }.
       - Editorial rule for burden documented in the GREETING_TABLE
         header comment.
       - A1 phrasing aligned to the A-tier scaffolding.
     v1.17.2
       - Panel-1 opening line source of truth.
       - Transition-line focus snap.
       - Carousel edge and under-swipe.
       - Custom-row sequential lockout fix.
       - Koi screen water effects.
       - Receipt item counter odometer.
     v1.17.1
       - Panel-1 opening line: correct insertion anchor.
       - Panel-1 beats rebuilt after confirmName() runs.
     v1.17
       - Panel phrase reveal.
     v1.16
       - Panel messages phrase reveal on every panel activation.
     v1.15
       - Receipt scroll reset + indicator.
     v1.14
       - Odometer, receipt landing, MP3 koi sound.
     v1.13
       - Washi paper, reject state fixes, ghost-checkbox fix.
   ============================================================ */

/* ============ THEME TOGGLE ============
   All element refs and state variables live together at the top of
   the file so the theme subsystem owns its full state surface at the
   point of definition. app.js loads with <script defer>, so the DOM
   is fully parsed when this block runs — every getElementById
   resolves immediately, and applyTheme() never reads a value that
   has not yet been assigned.

   _themeManuallySet suppresses the December auto-switch for the rest
   of the page session once the user taps the toggle. Reload resets
   it. */
var themeToggle = document.getElementById('themeToggle');
var mapleLeaves = document.getElementById('mapleLeaves');
var snowFlakes = document.getElementById('snowFlakes');
var currentTheme = 'autumn';
var _themeManuallySet = false;

function isWarmPaletteTheme(theme) {
  return theme === 'autumn' || theme === 'winter';
}

/* True from 1 Dec 00:01 JST through 31 Dec 23:59 JST */
function isNagoyaWinterSeason() {
  var p = nagoyaDateParts();
  if (p.month !== 12) return false;
  return (p.day > 1 || p.hour > 0 || p.minute >= 1);
}

function applyTheme(theme) {
  currentTheme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  if (themeToggle) {
    themeToggle.textContent = (theme === 'autumn') ? '🍁' : (theme === 'winter' ? '❄️' : '🌸');
  }
  /* v1.3: ambient lifecycle. The single source of truth for "is
     the app past the intro?" is the .active class on the maple
     leaves overlay — it is added the moment Panel 0 mounts inside
     triggerKoiStart() and removed synchronously in
     returnToStartScreen(). Gating on that instead of introHasRun
     closes the mid-intro race.

     The ambient sound rotation and the audio-reactive swell loop
     share this exact lifecycle so a mid-run theme toggle cannot
     leave sound or animation running alone against a sakura
     theme. */
  // the swipe hint and dots sit higher in autumn and winter (see repositionHintGroup)
  if (typeof panels !== 'undefined' && panels && typeof stage !== 'undefined' && stage) repositionHintGroup();
  if (typeof repositionTySwipeHint === 'function') repositionTySwipeHint();
  var isCarouselRunning = mapleLeaves && mapleLeaves.classList.contains('active');
  if (isCarouselRunning) {
    startAmbient();
  } else {
    stopAmbient();
  }
}
if (themeToggle) {
  themeToggle.addEventListener('click', function(e) {
    e.preventDefault(); e.stopPropagation();
    haptic(10);
    _themeManuallySet = true;
    var nextTheme = (currentTheme === 'autumn')
      ? 'winter'
      : (currentTheme === 'winter' ? 'default' : 'autumn');
    applyTheme(nextTheme);
  });
}

/* v1.3: reset hot-spot. */
var resetHotspot = document.getElementById('resetHotspot');
if (resetHotspot) {
  resetHotspot.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    haptic(14);
    returnToStartScreen();
  });
}

/* ============ HAPTIC FEEDBACK ============ */
function haptic(ms) {
  var strength = ms || 8;
  try {
    if (navigator.vibrate) navigator.vibrate(strength);
  } catch (e) { /* silent */ }
}

/* ============ INPUT HYGIENE ============ */
['gesturestart', 'gesturechange', 'gestureend'].forEach(function(evt) {
  document.addEventListener(evt, function(e) { e.preventDefault(); }, { passive: false });
});

document.addEventListener('contextmenu', function(e) {
  var t = e.target;
  if (!t) { e.preventDefault(); return; }
  if (t.tagName === 'INPUT') {
    if (t.classList.contains('price-input') || t.classList.contains('receipt-price-input')) {
      e.preventDefault();
      return;
    }
    return;
  }
  if (t.tagName === 'TEXTAREA' || t.isContentEditable) return;
  e.preventDefault();
});

/* ============ ACOUSTIC ENGINE ============ */
var SOUND_ENABLED = true;
var soundAudioCtx = null;
var soundMasterGain = null;
var ambientBus = null;   // every ambient source runs through this: the mute button rides on it
var soundBuffers = {};
var soundReady = false;

/* Audio-reactive swell state. These are set up in initSound() as a
   parallel leaf branch off soundMasterGain; the analyser never
   connects to destination, so the audible output is unchanged.

   _lastAppliedSwell tracks the last value actually written to the
   CSS custom property so applySwellToCSS() can skip subtree style
   recalculation when the energy envelope has settled. Initialised
   to -1 (a value outside the [0, 1] range) so the first write of
   any lifecycle always fires. */
var swellAnalyserNode = null;
var swellCompensationGain = null;
var swellFreqData = null;
var swellEnergy = 0.0;
var _lastAppliedSwell = -1;
var swellRafId = null;
var swellIsRunning = false;

/* Scroll-active gate. While the user is scrolling, the swell loop
   continues updating its energy envelope (so the value doesn't
   jump when scroll ends) but skips the CSS custom-property write.
   That write forces a style recalc down the full ambient stage
   subtree, and during scroll it competes with the scroll tick for
   the same frame budget. The visual difference is invisible — the
   user is reading text, not watching the background. */
var _scrollActive = false;
var _scrollEndTimer = null;
var _hudScrollFrameSkip = false;
/* Set while a finger is dragging the main panels sideways. The swell
   loop and the sky loop ease off exactly as they do for a scroll, so
   the swipe gets the frame budget. */
var _swipeActive = false;

var DROP_SOUND_URL = 'Sound/cave-water-drop-echo-a053fcdf.mp3';
var STREAM_SOUND_URL = 'Sound/alex_jauk-calm-zen-river-flowing-228223.mp3';
var BAMBOO_URL = 'Sound/morning/Windbamboo.mp3';
var CHIRP_URL = 'Sound/Chirping2.mp3';

/* ============ TRACK METADATA (4 PHASES) ============
   Four Nagoya time phases, the page colour theme's own
   (getTimeOfDayInNagoya, which also sets data-time). Three of them
   play a playlist — a folder of numbered songs on the playlist engine
   (see PLAYLISTS & MUSIC BUTTONS below); night plays one file on the
   buffer engine, whose bufferName is the physical soundBuffers key.

     morning  05:00–10:59  playlist 'morning'  Sound/morning/1.m4a, 2.m4a, …
     day      11:00–16:59  playlist 'morning'  (no day music yet)
     evening  17:00–20:59  playlist 'evening'  Sound/Evening/1.m4a, 2.m4a, …
     night    21:00–04:59  Sound/Latenight.mp3 (18 min, full)

   Each buffer-engine play runs the buffer end-to-end — or up to
   maxPlaySec, if set — with a linear fade-in at the head and a linear
   fade-out at the tail, then immediately re-arms for the next cycle.
   The hour check runs at play time, not at schedule time, so a clip
   that is mid-flight when the wall clock crosses a bucket boundary
   finishes naturally and the next cycle picks the correct track.

   Lifecycle is shared with the audio-reactive swell loop via the
   .active class on #mapleLeaves. */
var AMBIENT_TRACKS = [
  { name: 'morning', playlist: 'morning' },
  { name: 'day',     playlist: 'morning' },
  { name: 'evening', playlist: 'evening' },
  {
    name: 'night',
    bufferName: 'night',
    url: 'Sound/Latenight.mp3',
    title: 'カタライザー',
    artist: '小久保隆',
    peak: 1.00,
    maxPlaySec: null
  }
];

var AMBIENT_FADE_IN  = 3.0;  // seconds
var AMBIENT_FADE_OUT = 4.0;  // seconds

/* ============ AUDIO SPECTRUM & METADATA HUD ============
   Persistent bottom-left card surfacing the currently-playing
   ambient bed. Its visibility is governed by two gates that must
   stay in sync:

     · CSS — body.info-visible:not(.receipt-locked)
     · JS  — _hudShouldDraw(), which mirrors the same body-class
              conditions plus the .shown class on the HUD element.

   The JS mirror exists to skip 120Hz canvas rasterization whenever
   the CSS rule hides the HUD — during the receipt dwell and any
   state where the card is at opacity 0.

   Canvas animation shares the swell loop's _scrollActive gate so
   the HUD never competes with gesture dispatch during scroll.

   Loading state is aggregated across all unique AMBIENT_TRACKS
   URLs via _hudBytesLoadedMap / _hudBytesTotalMap. The decode
   state is derived per-frame rather than tracked with a counter:
   "fully resident" is true when the current Nagoya phase's buffer
   is decoded AND all three raw MP3s have finished downloading.

   The gauge bar tracks playback progress of the current track.
   During playback, updateHudProgress() is the sole writer of
   hudGaugeFill's width; _hudRenderState() skips its width write
   whenever ambientSource is non-null so the two never race.

   Layout (post-revamp):
     · hudTrackTitle · hudTrackArtist (meta row, back / next buttons
       at its two ends)
     · pause · mute buttons, and hudPctStatus at the right end of
       that row — DL XX% / PCM展開中 / DL 100%
       (the old 再生中 pill is gone: the pause / play icon says it)
     · hudCanvas (288×52, six-layer fluid waveform)
     · hudGaugeFill (playback progress with glowing playhead)
     · hudTimeElapsed / hudTimeTotal (split timestamps below the bar)

   Status and download used to have independent DOM targets, which
   closed the cold-launch dual-writer race that flapped the single
   label row between "DL 48%" and "00:04 / 17:00". */
var audioSpectrumHud = document.getElementById('audioSpectrumHud');
var hudTrackTitle    = document.getElementById('hudTrackTitle');
var hudTrackArtist   = document.getElementById('hudTrackArtist');
var hudTrackSep      = document.getElementById('hudTrackSep');
var hudCanvas        = document.getElementById('hudCanvas');
var hudCtx           = hudCanvas ? hudCanvas.getContext('2d') : null;
var hudGaugeFill     = document.getElementById('hudGaugeFill');
var hudPctStatus     = document.getElementById('hudPctStatus');
var hudTimeElapsed   = document.getElementById('hudTimeElapsed');
var hudTimeTotal     = document.getElementById('hudTimeTotal');

/* Must equal .audio-spectrum-hud's content-box width in main.css:
   440px card − 2px borders − 28px horizontal padding = 410. The
   canvas backing store is sized to this constant; drift re-
   introduces the aspect stretch the v1.3 amendment closed. */
var HUD_DISPLAY_W = 410;
var HUD_DISPLAY_H = 44;
var HUD_WAVE_PTS  = 28;
var HUD_LAYERS    = 6;

/* Each layer reads its own frequency band so the six-ribbon stack
   covers a wider slice of the spectrum than a single shared band
   could. Bins span ~280 Hz (layer 0) to ~11 kHz (layer 5) at 48 kHz
   with fftSize 512 (93.75 Hz per bin). Bands overlap slightly so
   transitions between layers do not leave visible gaps. */
var LAYER_BIN_START = [3, 15, 35, 55, 75, 95];
var LAYER_BIN_END   = [22, 42, 62, 82, 100, 120];

var _hudMirrorValues = new Float32Array(HUD_LAYERS * HUD_WAVE_PTS);

/* Static Hann window (sin²) pre-computed once at module scope so
   drawFluidRibbon() reads a lookup table instead of computing 28
   trig evaluations and squarings per layer per frame — roughly
   20,160 redundant evaluations per second at 120Hz across the six
   layers. The IIFE is deliberate: a plain for at module scope
   would leak _hi / _hs as window globals, since app.js is a
   classic script. */
var _hudHannWindow = new Float32Array(HUD_WAVE_PTS);
(function() {
  var last = HUD_WAVE_PTS - 1;
  for (var hi = 0; hi <= last; hi++) {
    var s = Math.sin((hi / last) * Math.PI);
    _hudHannWindow[hi] = s * s;
  }
})();

var _hudPhase = 0;

if (hudCanvas && hudCtx) {
  var _hudDpr = window.devicePixelRatio || 1;
  hudCanvas.width  = HUD_DISPLAY_W * _hudDpr;
  hudCanvas.height = HUD_DISPLAY_H * _hudDpr;
  hudCtx.scale(_hudDpr, _hudDpr);
}

/* Aggregated loading tracker */
var _hudBytesLoadedMap = {};
var _hudBytesTotalMap  = {};
var _hudLastUpdateMs   = 0;

/* Timestamp throttling gate: the last whole-second value rendered
   into the split timestamp row during playback. Initialised to -1
   so the first write of any playback window always fires. Reset to
   -1 in stopAmbient() alongside ambientPlayStartTime and
   ambientPlayDurationSec, keeping the three playback-window state
   variables in one cohort. */
var _hudLastRenderedSec = -1;

/* JS-side visibility mirror of the CSS gate. Halted canvas work
   when the card is hidden. The receipt-locked class is the only
   body-class hidden condition — the HUD is visible on the
   thank-you screen and the earlier thankyou-active exclusion was
   removed in lockstep with the CSS gate. */
function _hudShouldDraw() {
  if (!audioSpectrumHud) return false;
  if (!document.body.classList.contains('info-visible')) return false;
  if (document.body.classList.contains('receipt-locked')) return false;
  if (!audioSpectrumHud.classList.contains('shown')) return false;
  return true;
}

/* Single-authority state renderer. Both the streaming loader and
   the playback lifecycle funnel through this function; neither
   writes badge state directly. The gauge fill is written here only
   while playback is NOT active — during playback the swell loop's
   updateHudProgress() owns the fill and advances it over playDur.

   Under the revamp the status badge and the download badge are
   independent DOM targets. This function writes both, plus the
   split timestamp row (during playback) or the initial standby
   values (00:00 / --:--).

   The slot-ready check and the in-flight-decode check both read
   from a single currentTrack snapshot so a single Nagoya
   wall-clock evaluation drives the whole branch.

   The 展開中 branch requires _ambientRawBuffers[currentTrack.url]
   alongside the in-flight-decode check. Under the raw-fetch-retry
   architecture, _ambientDecodingPromises[bufferName] is set before
   the raw fetch resolves — that is the shape of the chain — so
   without the guard the badge would claim PCM展開中 while bytes
   were still on the wire. */
function _hudRenderState() {
  if (!hudGaugeFill) return;

  var totalExpected = 0;
  var totalLoaded = 0;
  for (var url in _hudBytesTotalMap) {
    totalExpected += _hudBytesTotalMap[url];
    totalLoaded += (_hudBytesLoadedMap[url] || 0);
  }
  /* 30 MB fallback before Content-Length headers resolve */
  if (totalExpected === 0) totalExpected = 30000000;

  /* The songs are found one after another, so the byte total keeps
     growing until the last song in every folder has been seen. Hold
     the pill at 99% until then rather than let it reach 100% and
     fall back. */
  var pct = Math.min(_playlistsDone() ? 1.0 : 0.99, totalLoaded / totalExpected);
  var pctInt = Math.round(pct * 100);
  var isPlaying = _ambientActive();

  var currentTrack = getCurrentAmbientTrack();
  var slotReady = currentTrack.playlist
    ? MUSIC_PLAYLISTS[currentTrack.playlist].songs.length > 0
    : !!(soundBuffers && soundBuffers[currentTrack.bufferName]);
  var isDecodingCurrent = !!(_ambientDecodingPromises[currentTrack.bufferName] && _ambientRawBuffers[currentTrack.url]);

  /* Gauge width: during playback the swell loop's updateHudProgress()
     owns the fill (playback position over playDur). When idle or
     loading, this function writes download progress. Writing width
     here during playback would stomp the playback position on every
     state change. */
  if (!isPlaying) {
    hudGaugeFill.style.width = pctInt + '%';
  }
  hudGaugeFill.classList.remove('decoding', 'ready');
  if (hudPctStatus) hudPctStatus.classList.remove('decoding', 'ready');

  /* DL pill, at the right end of the control row — download /
     decompression progress. Background download of the other
     phases stays visible while the current one is playing. */
  if (hudPctStatus) {
    if (isDecodingCurrent) {
      hudPctStatus.textContent = 'PCM展開中';
      hudPctStatus.classList.add('decoding');
    } else if (pct < 1.0) {
      hudPctStatus.textContent = 'DL ' + pctInt + '%';
    } else {
      hudPctStatus.textContent = 'DL 100%';
      hudPctStatus.classList.add('ready');
    }
  }

  /* Gauge fill classes carry the amber→plum readiness signal; the
     width is owned by the swell loop during playback. */
  if (isPlaying) {
    /* Plum fill only when every raw MP3 is downloaded. The
       amber→plum transition signals background I/O completion and
       must not be short-circuited by the fact that the currently-
       playing slot is, by definition, ready. */
    if (pct >= 1.0) {
      hudGaugeFill.classList.add('ready');
    }

    var elapsed = getPlaybackElapsed();
    if (hudTimeElapsed) hudTimeElapsed.textContent = formatHudTime(elapsed);
    if (hudTimeTotal)   hudTimeTotal.textContent   = formatHudTime(ambientPlayDurationSec);
    _hudLastRenderedSec = Math.floor(elapsed);
  } else if (!slotReady || pct < 1.0) {
    if (isDecodingCurrent) {
      hudGaugeFill.classList.add('decoding');
    }
    if (hudTimeElapsed) hudTimeElapsed.textContent = '00:00';
    if (hudTimeTotal)   hudTimeTotal.textContent   = '--:--';
  } else {
    hudGaugeFill.classList.add('ready');
    if (hudTimeElapsed) hudTimeElapsed.textContent = '00:00';
    if (hudTimeTotal)   hudTimeTotal.textContent   = '--:--';
  }
}

/* Throttled wrapper. 100ms gap during streaming; force === true
   bypasses the gate for state transitions (decode start, decode
   end, playback start/stop). */
function updateHudLoadingAggregated(force) {
  var now = performance.now();
  if (!force && now - _hudLastUpdateMs < 100) return;
  _hudLastUpdateMs = now;
  _hudRenderState();
}

/* Format a duration in seconds as zero-padded mm:ss. Assumes
   durations under an hour — all current AMBIENT_TRACKS are 16–18
   minutes. If a longer ambient bed is ever added, this needs an
   hh:mm:ss branch. */
function formatHudTime(sec) {
  if (!isFinite(sec) || sec < 0) sec = 0;
  var total = Math.floor(sec);
  var m = Math.floor(total / 60);
  var s = total % 60;
  return (m < 10 ? '0' + m : String(m)) + ':' + (s < 10 ? '0' + s : String(s));
}

/* Elapsed playback seconds, clamped to the current track's playDur.
   Shared by _hudRenderState() (state transitions) and
   updateHudProgress() (per-second tick) so both writers of the
   timestamp read from a single source of truth. Returns 0 when no
   playback is active or when the timing state is unset. */
function getPlaybackElapsed() {
  if (_plOn && _plAudio) {
    var t = _plAudio.currentTime;
    if (ambientPlayDurationSec > 0 && t > ambientPlayDurationSec) t = ambientPlayDurationSec;
    return t > 0 ? t : 0;
  }
  if (ambientSource === null) return 0;
  if (ambientPlayStartTime < 0 || ambientPlayDurationSec <= 0) return 0;
  var elapsed = soundAudioCtx.currentTime - ambientPlayStartTime;
  if (elapsed < 0) elapsed = 0;
  if (elapsed > ambientPlayDurationSec) elapsed = ambientPlayDurationSec;
  return elapsed;
}

/* Advances the HUD gauge fill over the current ambient track's
   duration and updates the split timestamp row once per whole
   second. Called from the swell loop alongside drawHudSpectrum()
   whenever the HUD is visible and the scroll gate is released.

   During playback this is the sole writer of hudGaugeFill's width;
   _hudRenderState() skips its width write whenever ambientSource
   is non-null so the two never race.

   Progress is computed from soundAudioCtx.currentTime so the fill
   is accurate across fade-in, main body, and fade-out — no
   integration of animation frames required.

   The timestamp strings are gated on integer-second changes: the
   underlying time advances every rAF tick, but the mm:ss string
   only changes when the whole-second value increments. Writing on
   every frame would be 100+ redundant DOM mutations per second for
   no visible effect. */
function updateHudProgress() {
  if (!hudGaugeFill) return;
  if (!_ambientActive()) return;
  if (ambientPlayDurationSec <= 0) return;

  var elapsed = getPlaybackElapsed();

  /* Gauge fill — advances every rAF tick */
  var pct = (elapsed / ambientPlayDurationSec) * 100;
  hudGaugeFill.style.width = pct.toFixed(2) + '%';

  /* Split timestamps — updates once per integer second */
  var elapsedSec = Math.floor(elapsed);
  if (elapsedSec !== _hudLastRenderedSec) {
    _hudLastRenderedSec = elapsedSec;
    if (hudTimeElapsed) hudTimeElapsed.textContent = formatHudTime(elapsed);
    if (hudTimeTotal)   hudTimeTotal.textContent   = formatHudTime(ambientPlayDurationSec);
  }
}

/* ============ AMBIENT RAW BUFFER LOADER (v1.3) ============
   Streaming loader with byte-level progress reporting. The
   ReadableStream reader drives the HUD gauge during transfer; the
   assembled ArrayBuffer is handed back to the caller WITHOUT
   decoding. Under the lazy slot-based architecture only the
   current Nagoya phase is decoded (see decodeAmbientSlot); the
   other two are stashed in _ambientRawBuffers until their phase
   arrives or their boundary pre-decode fires.

   Decoding all three at boot put ~1.13 GB of linear float32 PCM
   into the tab's Web Audio heap, straddling the Android renderer
   LMK boundary. The split loader caps steady-state at one decoded
   slot (~360-396 MB) plus ~48 MB of compressed MP3s.

   The final byte total is flushed before resolving so the gauge
   snaps to 100% for this URL and the aggregate pct updates
   immediately. */
var _ambientMissing = {};   // urls the server answered 404 for

function loadAudioBufferRaw(url) {
  return fetch(url)
    .then(function(res) {
      if (!res.ok) {
        if (res.status === 404) _ambientMissing[url] = true;
        throw new Error('audio fetch failed: ' + url);
      }
      var len = res.headers.get('content-length');
      _hudBytesTotalMap[url] = len ? parseInt(len, 10) : 16000000;
      _hudBytesLoadedMap[url] = 0;

      var reader = res.body.getReader();
      var chunks = [];
      var loaded = 0;

      function read() {
        return reader.read().then(function(result) {
          if (result.done) {
            _hudBytesLoadedMap[url] = loaded;
            updateHudLoadingAggregated(true);

            var all = new Uint8Array(loaded);
            var pos = 0;
            for (var i = 0; i < chunks.length; i++) {
              all.set(chunks[i], pos);
              pos += chunks[i].length;
            }
            return all.buffer;
          }

          chunks.push(result.value);
          loaded += result.value.length;
          _hudBytesLoadedMap[url] = loaded;
          updateHudLoadingAggregated(false);
          return read();
        });
      }
      return read();
    })
    .catch(function() { return null; });
}

/* ============ AMBIENT RAW FETCH MEMOIZATION (v1.3) ============
   fetchAmbientRaw(track) is the single authority for fetching an
   ambient MP3's bytes and for writing into _ambientRawBuffers.
   Every caller — the boot loop in initSound() and the on-demand
   retry path from decodeAmbientSlot() — goes through this helper.

   Without the memo, a boot fetch that hadn't resolved by the time
   playAmbientSound() first polls would spawn a second parallel
   download of the same 16 MB file on a connection that is already
   struggling. _ambientRawPromises[url] holds the in-flight promise
   for the duration of the fetch and is deleted on both success and
   failure, so the next caller either gets the cached buffer or
   starts a fresh fetch cleanly.

   On failure the promise resolves with null (the inner
   loadAudioBufferRaw already swallows its own errors). The
   on-demand retry path treats that as "not yet available" and
   leaves the slot for the next 500ms tick of playAmbientSound()'s
   polling loop. The 120-attempt cap on _ambientBufferRetries
   bounds the whole retry window at ~60s, preserving the existing
   terminal-stop contract. */
var _ambientRawPromises = {};

function fetchAmbientRaw(track) {
  if (_ambientRawBuffers[track.url]) return Promise.resolve(_ambientRawBuffers[track.url]);
  if (_ambientRawPromises[track.url]) return _ambientRawPromises[track.url];

  var p = loadAudioBufferRaw(track.url).then(function(buf) {
    delete _ambientRawPromises[track.url];
    if (buf) _ambientRawBuffers[track.url] = buf;
    return buf;
  });

  _ambientRawPromises[track.url] = p;
  return p;
}

/* ============ SLOT DECODE (v1.3) ============
   Decodes one ambient phase into soundBuffers[track.bufferName].

   The function's promise chain is: fetchAmbientRaw → decode → .catch
   → trailing .then(cleanup). The chain shape matters:

     · fetchAmbientRaw(track) is the first link. When the raw bytes
       are missing (a failed earlier download, or boot racing the
       first poll), it kicks off the fetch and awaits it. When the
       fetch fails, the promise resolves null and the chain
       short-circuits to the trailing cleanup — so the next 500ms
       tick re-enters cleanly and retries, rather than the slot
       being permanently dead until a page reload.

     · raw.slice(0) before decodeAudioData is load-bearing, not
       defensive. The Web Audio spec detaches the passed
       ArrayBuffer; without the clone the entry in
       _ambientRawBuffers would be neutered after its first
       decode, and the 05:00 re-decode the following morning
       would throw. The transient ~16 MB copy is negligible
       against the ~375 MB decoded PCM.

     · The .catch(function() { return null; }) before the trailing
       .then guarantees the cleanup runs on both the success and
       failure paths. Without it, a rejection would skip the
       cleanup and leave a permanent stale entry in
       _ambientDecodingPromises, blocking every future retry of
       that slot.

     · The trailing .then(function(res) { ... return res; })
       passthrough preserves the resolved AudioBuffer (or null)
       for the caller. Today's callers ignore the value, but
       letting the chain resolve to undefined would make the
       helper unusable for any future caller that wants the
       buffer back.

   The _ambientDecodingPromises[track.bufferName] memo remains in
   place: playAmbientSound()'s 500ms retry polling would otherwise
   stack 2-3 concurrent decodeAudioData passes on a ~1.2s mobile
   decode, spiking transient heap back past 1 GB. The entry is set
   before the raw fetch resolves, so a caller entering while the
   fetch is still in flight gets the same shared promise rather
   than starting a second fetch-and-decode job. */
var _ambientRawBuffers = {};
var _ambientDecodingPromises = {};

function decodeAmbientSlot(track) {
  if (track.playlist) return Promise.resolve(null);   // streamed by the playlist engine, never decoded to PCM
  if (soundBuffers[track.bufferName]) return Promise.resolve(soundBuffers[track.bufferName]);
  if (_ambientDecodingPromises[track.bufferName]) return _ambientDecodingPromises[track.bufferName];

  var p = fetchAmbientRaw(track).then(function(raw) {
    if (!raw) return null;
    return new Promise(function(resolve, reject) {
      var prom = soundAudioCtx.decodeAudioData(raw.slice(0), function(decoded) {
        soundBuffers[track.bufferName] = decoded;
        _hudRenderState();
        resolve(decoded);
      }, reject);
      if (prom && typeof prom.then === 'function') prom.then(resolve, reject);
    });
  }).catch(function() {
    return null;
  }).then(function(res) {
    delete _ambientDecodingPromises[track.bufferName];
    return res;
  });

  _ambientDecodingPromises[track.bufferName] = p;
  return p;
}

/* ============ PHASE BOUNDARY SCHEDULER (v1.3) ============
   Every play cycle runs end-to-end at the current phase, so the
   only cross-boundary risk is the moment the wall clock crosses
   one of the four Nagoya phase edges (05:00, 11:00, 17:00, 21:00 JST).
   scheduleNextSlotPreDecode() arms a single timer for
   (time-until-boundary − SLOT_PRE_WINDOW_MS) so the incoming phase
   is already decoded into PCM before playAmbientSound() asks for
   it.

   The pre-decode window is 2 minutes. Decode of a ~16 MB ambient
   MP3 into PCM is ~1.2s on Adreno, and the raw bytes are in the
   SW's unversioned AUDIO cache after the first session — so the
   pre-decode step itself is pure PCM expansion, not a download.
   The shorter window (down from 10 minutes) cuts the dual-
   resident exposure of current + next slots (~750 MB combined)
   by ~5× per transition, twice a day. Because the on-demand
   retry path in decodeAmbientSlot() now handles a phase flip
   that catches the pre-decode mid-flight, the pre-decode is a
   hedge rather than a dependency — the shorter window is safe.

   TWO-CLAUSE STRUCTURE (v1.3). The previous single-timer form
   fired its callback at (boundary − SLOT_PRE_WINDOW_MS), which on
   entry into the pre-window itself evaluated to 0 and produced a
   setTimeout(fn, 0) that re-entered the same callback every ~4ms
   for the full window — the wakeup count scaled with the window
   length. The same form, on the fire that followed the boundary,
   saw current and next already flipped and routed into the else-if
   branch, decoding the following slot hours early. Both are closed
   by the clause split:

     Clause 1 (inside the pre-window, toBoundary <= PRE_WINDOW):
       ensure the incoming slot is decoding (cold-boot catch), then
       sleep toBoundary + 1000ms — just past the boundary. The next
       evaluation sees a fresh multi-hour toBoundary and drops into
       clause 2. No spin.

     Clause 2 (outside the pre-window, toBoundary > PRE_WINDOW):
       sleep toBoundary − PRE_WINDOW, then on fire decode current
       (suspend catch-up if the tablet slept past a boundary) or
       next if current is already resident. Reschedule. No
       premature decode of the subsequent slot at a boundary
       crossing, because the callback is not re-entered until the
       following clause-2 arm.

   Two edge cases handled by the callback:

     · suspend-across-boundary. If the tablet slept through the
       pre-window, the timer fires late. The current-slot check
       catches the case where the phase flipped during sleep and
       the incoming slot was never decoded.

     · re-arming. The callback reschedules itself for the
       following boundary so a session left running for days keeps
       its pre-decode window current.

   LIFECYCLE (v1.3). The scheduler is armed by startAmbient() and
   disarmed by stopAmbient(), matching the .active gate that
   already governs the swell loop. Arming
   previously lived in initSound()'s decode .then(), which meant a
   tablet parked on the name / blossom screen could wake at 16:58 /
   21:58 / 04:58 to decompress ~375 MB PCM for an inaudible
   engine. Under the new scoping, a phase flip while idle is
   recovered by playAmbientSound()'s transient guard on the next
   startAmbient() — decode resolves in ~1.2s, inside Panel 0's
   1.4–2.0s visual entrance envelope.

   Nagoya has no DST, so the boundary math reduces to UTC+9
   arithmetic. If the app is ever deployed to a DST zone, the
   computed delay would shift by at most one hour — still well
   inside the 5-7 hour phase width. */
var _slotPreDecodeTimer = null;
var SLOT_PRE_WINDOW_MS = 2 * 60 * 1000; // ms

function getNextAmbientTrack() {
  var cur = getCurrentAmbientTrack();
  return AMBIENT_TRACKS[(AMBIENT_TRACKS.indexOf(cur) + 1) % AMBIENT_TRACKS.length];
}

function msUntilNextPhaseBoundary() {
  var now = new Date();
  /* Nagoya is UTC+9. Build a Date whose local-time accessors read
     as Nagoya wall clock, without Intl parsing. */
  var nagoyaMs = now.getTime() + (9 * 60 + now.getTimezoneOffset()) * 60 * 1000;
  var nagoyaDate = new Date(nagoyaMs);
  var h = nagoyaDate.getHours();

  var targetHour;
  var addDays = 0;

  /* the four phase edges: 05:00, 11:00, 17:00, 21:00 */
  if (h < 5) {
    targetHour = 5;
  } else if (h < 11) {
    targetHour = 11;
  } else if (h < 17) {
    targetHour = 17;
  } else if (h < 21) {
    targetHour = 21;
  } else {
    targetHour = 5;
    addDays = 1;
  }

  var targetDate = new Date(nagoyaDate);
  targetDate.setDate(targetDate.getDate() + addDays);
  targetDate.setHours(targetHour, 0, 0, 0);

  return Math.max(0, targetDate.getTime() - nagoyaDate.getTime());
}

function scheduleNextSlotPreDecode() {
  if (_slotPreDecodeTimer) {
    clearTimeout(_slotPreDecodeTimer);
    _slotPreDecodeTimer = null;
  }

  var toBoundary = msUntilNextPhaseBoundary();

  /* Clause 1 — inside the pre-window. Ensure the incoming slot is
     decoding (covers cold boot into the window, e.g. launch at
     16:59, where the boundary is only a minute away and no earlier
     pre-decode could have fired). Then sleep just past the
     boundary. The next evaluation sees a fresh multi-hour
     toBoundary and drops into clause 2. */
  if (toBoundary <= SLOT_PRE_WINDOW_MS) {
    var nextEarly = getNextAmbientTrack();
    if (!soundBuffers[nextEarly.bufferName]) {
      decodeAmbientSlot(nextEarly);
    }
    _slotPreDecodeTimer = setTimeout(function() {
      _slotPreDecodeTimer = null;
      scheduleNextSlotPreDecode();
    }, toBoundary + 1000);
    return;
  }

  /* Clause 2 — outside the pre-window. Sleep until the pre-window
     opens, then on fire decode the incoming slot (or the current
     slot first, if the tablet slept past a boundary and current is
     still missing). Reschedule for the following boundary. */
  var ms = toBoundary - SLOT_PRE_WINDOW_MS;
  _slotPreDecodeTimer = setTimeout(function() {
    _slotPreDecodeTimer = null;
    var current = getCurrentAmbientTrack();
    var next = getNextAmbientTrack();
    if (!soundBuffers[current.bufferName]) {
      decodeAmbientSlot(current);
    } else if (!soundBuffers[next.bufferName]) {
      decodeAmbientSlot(next);
    }
    scheduleNextSlotPreDecode();
  }, ms);
}

/* Release every decoded ambient buffer except the one about to
   play. Setting soundBuffers[name] = null severs the JS reference;
   the active AudioBufferSourceNode already holds its own strong
   reference via src.buffer, so any in-flight fade-out across a
   phase boundary is unaffected. GC reclaims the PCM block once
   src.onended fires and gain.disconnect() drops the last Blink-
   side reference. */
function releaseNonCurrentAmbientSlots(keepBufferName) {
  for (var i = 0; i < AMBIENT_TRACKS.length; i++) {
    var n = AMBIENT_TRACKS[i].bufferName;
    if (n !== keepBufferName && soundBuffers[n]) {
      soundBuffers[n] = null;
    }
  }
}

/* Streaming loader for non-ambient one-shots (drop and
   stream). These are small enough to decode inline — the split
   loader exists specifically for the three multi-megabyte ambient
   beds. */
function loadAudioBuffer(url) {
  return fetch(url)
    .then(function(r) {
      if (!r.ok) throw new Error('audio fetch failed: ' + url);
      return r.arrayBuffer();
    })
    .then(function(ab) {
      return new Promise(function(resolve, reject) {
        var prom = soundAudioCtx.decodeAudioData(ab, resolve, reject);
        if (prom && typeof prom.then === 'function') prom.then(resolve, reject);
      });
    })
    .catch(function() { return null; });
}

/* Zero-allocation multi-layer fluid spectrum resting flush on top
   of the progress bar. Six translucent ribbons, each reading its
   own frequency band from the shared FFT buffer, modulated by a
   Hann window (sin²) so the hills taper smoothly into the bar at
   both ends.

   Palette is back-to-front: Ebizome plum, deep amber, Kinmokusei,
   petal coral, glow amber, and the Kinushiro cream core. The
   compounded opacity through the crest lands around 0.75–0.85,
   warm and dense without going chalky.

   Phase freezes under _prefersReducedMotion: lateral drift is the
   vestibular trigger. The amplitude response to live audio is
   state feedback and stays live regardless. */
function drawHudSpectrum() {
  if (!hudCtx) return;
  hudCtx.clearRect(0, 0, HUD_DISPLAY_W, HUD_DISPLAY_H);

  var isAutumn = isWarmPaletteTheme(currentTheme);
  /* One palette step darker than before so the ribbons stay visible over
     the frosted glass (sun, leaves) at any hour; the old cream front layer
     vanished on a light pane. */
  var col0 = isAutumn ? '#882E47' : '#9a3e4d';
  var col1 = isAutumn ? '#882E47' : '#9a3e4d';
  var col2 = isAutumn ? '#9E3B06' : '#a34a56';
  var col3 = isAutumn ? '#C44E10' : '#b04a5a';
  var col4 = isAutumn ? '#E66826' : '#d46a7a';
  var col5 = isAutumn ? '#F07D40' : '#e8a8b0';

  if (!_prefersReducedMotion) {
    _hudPhase += 0.038;
  }

  /* Update smoothed FFT control points, one band per layer */
  var lastIdx = HUD_WAVE_PTS - 1;
  for (var layer = 0; layer < HUD_LAYERS; layer++) {
    var binStart = LAYER_BIN_START[layer];
    var binEnd   = LAYER_BIN_END[layer];
    var base = layer * HUD_WAVE_PTS;
    for (var i = 0; i < HUD_WAVE_PTS; i++) {
      var target;
      if (swellAnalyserNode && swellFreqData && swellIsRunning) {
        var t = i / lastIdx;
        var binIdx = binStart + Math.floor(t * (binEnd - binStart));
        /* 1.35× boost brings ambient program material up into the
           visible range, clamped at 1.0. */
        target = Math.max(0.08, Math.min(1.0, (swellFreqData[binIdx] / 255) * 1.35));
      } else {
        target = 0.18 + Math.sin(_hudPhase + i * 0.35 + layer * 0.9) * 0.12;
      }
      _hudMirrorValues[base + i] += (target - _hudMirrorValues[base + i]) * 0.25;
    }
  }

  /* 6 ribbons, back-to-front. Taller heightScale on the front
     layers keeps the peak height visually commanding rather than
     buried behind the wide back ribbons. */
  drawFluidRibbon(0, col0, 0.24,  1.00, 0.0, 1.6, 1.00);
  drawFluidRibbon(1, col1, 0.30, -1.20, 1.7, 2.0, 0.96);
  drawFluidRibbon(2, col2, 0.46,  1.35, 3.4, 2.4, 0.92);
  drawFluidRibbon(3, col3, 0.54, -1.10, 5.1, 2.8, 0.86);
  drawFluidRibbon(4, col4, 0.50,  1.25, 6.8, 3.2, 0.78);
  drawFluidRibbon(5, col5, 0.40, -0.85, 8.5, 3.6, 0.62);
}

/* Draws one translucent fluid ribbon anchored at y = HUD_DISPLAY_H
   (the bottom of the canvas, flush with the top edge of the gauge
   bar). Uses quadratic curves for smoothing between control
   points, then snaps to the final computed vertex before closing
   down to the baseline at the right edge. Without that snap the
   last quadratic curve ends at the midpoint between the final two
   control points and the closing lineTo(w, baseY) leaves a
   sub-pixel diagonal seam.

   The Hann window (sin²) tapers wave amplitude to 0 at both edges
   of the ribbon. It is read from _hudHannWindow — a 28-entry
   lookup table populated once at module scope — rather than
   recomputed per frame per layer. */
function drawFluidRibbon(layerIdx, fillHex, alpha, speedMul, phaseOffset, freqMul, heightScale) {
  var w = HUD_DISPLAY_W;
  var baseY = HUD_DISPLAY_H;
  var maxH = (HUD_DISPLAY_H - 2) * heightScale;
  var lastIdx = HUD_WAVE_PTS - 1;
  var stepX = w / lastIdx;
  var base = layerIdx * HUD_WAVE_PTS;

  hudCtx.fillStyle = fillHex;
  hudCtx.globalAlpha = alpha;
  hudCtx.beginPath();
  hudCtx.moveTo(0, baseY);

  var prevX = 0;
  var prevY = baseY;

  for (var i = 0; i <= lastIdx; i++) {
    var norm = i / lastIdx;
    var envelope = _hudHannWindow[i];

    var undulation = 0.72 + 0.28 * Math.sin(_hudPhase * speedMul + norm * Math.PI * freqMul + phaseOffset);
    var amp = _hudMirrorValues[base + i] * undulation * envelope;
    var x = i * stepX;
    var y = baseY - (amp * maxH);

    if (i === 0) {
      hudCtx.lineTo(x, y);
    } else {
      var midX = (prevX + x) * 0.5;
      var midY = (prevY + y) * 0.5;
      hudCtx.quadraticCurveTo(prevX, prevY, midX, midY);
    }
    prevX = x;
    prevY = y;
  }

  /* Snap to the final computed vertex, drop to the baseline, close. */
  hudCtx.lineTo(prevX, prevY);
  hudCtx.lineTo(w, baseY);
  hudCtx.closePath();
  hudCtx.fill();
  hudCtx.globalAlpha = 1.0;
}

function initSound() {
  if (soundAudioCtx) return;
  try {
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    soundAudioCtx = new Ctx();
    soundMasterGain = soundAudioCtx.createGain();
    soundMasterGain.gain.value = 0.5;
    soundMasterGain.connect(soundAudioCtx.destination);

    ambientBus = soundAudioCtx.createGain();
    ambientBus.gain.value = _musicMuted ? 0 : 1;
    ambientBus.connect(soundMasterGain);

    /* Parallel analyser tap for the audio-reactive swell system
       and the HUD spectrum. Leaf node, no destination connection. */
    swellCompensationGain = soundAudioCtx.createGain();
    swellCompensationGain.gain.value = 2.0;
    swellAnalyserNode = soundAudioCtx.createAnalyser();
    swellAnalyserNode.fftSize = 512;
    swellAnalyserNode.smoothingTimeConstant = 0.8;
    swellFreqData = new Uint8Array(swellAnalyserNode.frequencyBinCount);
    soundMasterGain.connect(swellCompensationGain);
    swellCompensationGain.connect(swellAnalyserNode);

    if (soundAudioCtx.state === 'suspended') {
      try { soundAudioCtx.resume(); } catch (e) {}
    }

    /* FAST PATH: UI sounds are synthesized in memory via
       OfflineAudioContext. Takes ~5ms and requires zero network
       requests, so soundReady flips long before the ambient MP3s
       have finished streaming. Unblocks playSound() for the very
       first tap on a cold cache. */
    Promise.all([
      synthesizeTock(),
      synthesizeCheck(),
      synthesizePaper()
    ]).then(function(uiBufs) {
      soundBuffers.tock = uiBufs[0];
      soundBuffers.check = uiBufs[1];
      soundBuffers.paper = uiBufs[2];
      soundReady = true;
      /* Heavier than the UI taps, so rendered after they are ready. */
      synthesizeStampChime().then(function(buf) { soundBuffers.stampChime = buf; }).catch(function() { /* silent */ });
    }).catch(function() { /* silent */ });

    /* ASYNC BACKGROUND PATH: one-shots and loop beds load
       concurrently without blocking the UI fast path. Each call
       site downstream guards on its own buffer being present, so
       a not-yet-resident buffer is skipped rather than played
       partial. The drop one-shot uses loadAudioBuffer() directly
       — the old loadDropBuffer() wrapper was a byte-for-byte
       duplicate with the URL hardcoded. */
    loadAudioBuffer(DROP_SOUND_URL).then(function(buf) {
      if (buf) soundBuffers.drop = buf;
    });

    loadAudioBuffer(STREAM_SOUND_URL).then(function(buf) {
      if (buf) soundBuffers.stream = makeSeamlessLoop(buf, 1.5);
    });

    loadAudioBuffer(BAMBOO_URL).then(function(buf) {
      if (buf) soundBuffers.bamboo = buf;
    });

    loadAudioBuffer(CHIRP_URL).then(function(buf) {
      if (buf) soundBuffers.chirp = buf;
    });

    /* AMBIENT BEDS: three raw MP3s download in parallel, but only
       the current Nagoya phase decodes. The other two sit in
       _ambientRawBuffers until their boundary arrives or the
       pre-decode timer fires. This is the memory redesign — see
       the changelog entry and decodeAmbientSlot() above.

       Every fetch goes through fetchAmbientRaw(t) so the boot
       download is registered in _ambientRawPromises[url]. Without
       that routing, a playAmbientSound() tick that fires before
       the boot fetch resolves would see an empty memo map and
       spawn a second parallel download of the active track — on
       exactly the cold-boot case the memo exists to prevent.

       The decode of the current slot is the ONLY arming the loader
       does. scheduleNextSlotPreDecode() is called from
       startAmbient() instead — see the LIFECYCLE note on the
       scheduler. */
    var currentTrack = getCurrentAmbientTrack();
    AMBIENT_TRACKS.forEach(function(t) {
      if (t.playlist) { probePlaylist(MUSIC_PLAYLISTS[t.playlist]); return; }
      fetchAmbientRaw(t).then(function(rawBuf) {
        if (!rawBuf) return;
        /* Decode the current slot the instant its own bytes land,
           without waiting for the other two downloads. This avoids
           head-of-line blocking on a cold launch: Morning might
           finish in 2s while Latenight takes 15s, and we want the
           HUD to flip to 再生中 the moment the former is ready. */
        if (t.name === currentTrack.name && !soundBuffers[t.bufferName]) {
          decodeAmbientSlot(t);
        }
      });
    });

  } catch (e) { /* silent */ }
}

/* ============================================================
   SEAMLESS LOOP */
function makeSeamlessLoop(buffer, crossfadeSec) {
  var sr = buffer.sampleRate;
  var fadeSamples = Math.floor(sr * crossfadeSec);
  var originalLength = buffer.length;

  if (fadeSamples <= 0 || originalLength <= fadeSamples * 2) return buffer;

  var channels = buffer.numberOfChannels;
  var newLength = originalLength - fadeSamples;
  var out = soundAudioCtx.createBuffer(channels, newLength, sr);

  for (var ch = 0; ch < channels; ch++) {
    var src = buffer.getChannelData(ch);
    var dst = out.getChannelData(ch);

    /* Prefix copy via built-in set/subarray — the JS index loop
       was the only hot cost here. The crossfade tail below stays
       a manual loop because it reads two source windows per write. */
    dst.set(src.subarray(0, newLength));

    for (var j = 0; j < fadeSamples; j++) {
      var t = j / fadeSamples;
      dst[j] = src[j] * t + src[newLength + j] * (1 - t);
    }
  }

  return out;
}

/* The stamp jingle (about 3s): a two-step bell fanfare, a quick koto-style
   flourish up the scale, then a long shimmering chord with a few twinkles.
   D major pentatonic, built from sine/triangle partials and a short
   reverb, like the other synthesized UI sounds. Rendered once, off the
   critical path, and played through playSound('stampChime'). */
function synthesizeStampChime() {
  var sr = soundAudioCtx.sampleRate;
  var seconds = 3.0;
  var offline = new OfflineAudioContext(1, Math.floor(sr * seconds), sr);

  var master = offline.createGain();
  master.connect(offline.destination);
  var dry = offline.createGain();
  dry.gain.value = 0.9;
  dry.connect(master);

  var irLen = Math.floor(sr * 1.6);
  var ir = offline.createBuffer(1, irLen, sr);
  var irData = ir.getChannelData(0);
  var seed = 12345;
  for (var n = 0; n < irLen; n++) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    var noise = (seed / 4294967296) * 2 - 1;
    irData[n] = noise * Math.exp(-n / (sr * 0.45)) * (n < 200 ? n / 200 : 1);
  }
  var reverb = offline.createConvolver();
  reverb.buffer = ir;
  var reverbOut = offline.createGain();
  reverbOut.gain.value = 0.55;
  reverb.connect(reverbOut);
  reverbOut.connect(master);
  var wet = offline.createGain();
  wet.connect(reverb);

  function bell(dest, t, f, vol, dur) {
    var parts = [[1, 1.0, 1.0], [2.01, 0.42, 0.55], [2.76, 0.28, 0.35], [4.07, 0.14, 0.22], [5.4, 0.07, 0.15]];
    for (var i = 0; i < parts.length; i++) {
      var o = offline.createOscillator();
      o.type = 'sine';
      o.frequency.value = f * parts[i][0];
      var g = offline.createGain();
      var pd = dur * parts[i][2];
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(vol * parts[i][1], t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + pd);
      o.connect(g);
      g.connect(dest);
      o.start(t);
      o.stop(t + pd + 0.05);
    }
  }
  function pluck(dest, t, f, vol, dur) {
    var o = offline.createOscillator();
    o.type = 'triangle';
    o.frequency.value = f;
    var lp = offline.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(f * 9, t);
    lp.frequency.exponentialRampToValueAtTime(f * 1.6, t + dur * 0.8);
    var g = offline.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(lp);
    lp.connect(g);
    g.connect(dest);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  var D5 = 587.33, Fs5 = 739.99, A5 = 880.0, B5 = 987.77;
  var D6 = 1174.66, E6 = 1318.51, Fs6 = 1479.98, A6 = 1760.0, B6 = 1975.53, D7 = 2349.32, E7 = 2637.02;

  [D5, Fs5, A5].forEach(function(f) { bell(dry, 0.05, f, 0.26, 0.55); bell(wet, 0.05, f, 0.2, 0.55); });
  var flourish = [A5, B5, D6, E6, Fs6, A6];
  flourish.forEach(function(f, i) { pluck(dry, 0.30 + i * 0.055, f, 0.22, 0.5); pluck(wet, 0.30 + i * 0.055, f, 0.18, 0.5); });
  var t = 0.30 + flourish.length * 0.055 + 0.02;
  [D6, Fs6, A6, D7].forEach(function(f, k) { bell(dry, t + k * 0.01, f, 0.28, 4.0); bell(wet, t + k * 0.01, f, 0.24, 4.0); });
  [[E7, 0.35], [B6, 0.62], [Fs6 * 2, 0.88], [A6, 1.12], [D7, 1.35]].forEach(function(p) {
    bell(wet, t + p[1], p[0], 0.13, 1.6);
  });

  return offline.startRendering().then(function(buf) {
    /* Level it like the other UI sounds and ease the last 0.25s to silence. */
    var d = buf.getChannelData(0);
    var peak = 0, i;
    for (i = 0; i < d.length; i++) peak = Math.max(peak, Math.abs(d[i]));
    var scale = peak > 0 ? 0.7 / peak : 1;
    var fadeStart = d.length - Math.floor(sr * 0.25);
    for (i = 0; i < d.length; i++) {
      var v = d[i] * scale;
      if (i > fadeStart) v *= (d.length - i) / (d.length - fadeStart);
      d[i] = v;
    }
    return buf;
  });
}

function synthesizeTock() {
  var sr = soundAudioCtx.sampleRate;
  var length = Math.floor(sr * 0.10);
  var offline = new OfflineAudioContext(1, length, sr);

  var noiseLen = Math.floor(sr * 0.08);
  var noiseBuf = offline.createBuffer(1, noiseLen, sr);
  var nd = noiseBuf.getChannelData(0);
  for (var i = 0; i < noiseLen; i++) nd[i] = Math.random() * 2 - 1;
  var noiseSrc = offline.createBufferSource();
  noiseSrc.buffer = noiseBuf;
  var noiseFilter = offline.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.value = 2500;
  noiseFilter.Q.value = 1.5;
  var noiseGain = offline.createGain();
  noiseGain.gain.setValueAtTime(0.35, 0);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, 0.020);
  noiseSrc.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(offline.destination);
  noiseSrc.start(0);
  noiseSrc.stop(0.08);

  var osc = offline.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = 1800;
  var oscGain = offline.createGain();
  oscGain.gain.setValueAtTime(0.65, 0);
  oscGain.gain.exponentialRampToValueAtTime(0.0001, 0.060);
  osc.connect(oscGain);
  oscGain.connect(offline.destination);
  osc.start(0);
  osc.stop(0.10);

  return offline.startRendering();
}

function synthesizeCheck() {
  var sr = soundAudioCtx.sampleRate;
  var length = Math.floor(sr * 0.08);
  var offline = new OfflineAudioContext(1, length, sr);

  var noiseLen = Math.floor(sr * 0.06);
  var noiseBuf = offline.createBuffer(1, noiseLen, sr);
  var nd = noiseBuf.getChannelData(0);
  for (var i = 0; i < noiseLen; i++) nd[i] = Math.random() * 2 - 1;
  var noiseSrc = offline.createBufferSource();
  noiseSrc.buffer = noiseBuf;
  var noiseFilter = offline.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.value = 2200;
  noiseFilter.Q.value = 1.2;
  var noiseGain = offline.createGain();
  noiseGain.gain.setValueAtTime(0.45, 0);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, 0.015);
  noiseSrc.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(offline.destination);
  noiseSrc.start(0);
  noiseSrc.stop(0.06);

  var osc = offline.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = 1200;
  var oscGain = offline.createGain();
  oscGain.gain.setValueAtTime(0.55, 0);
  oscGain.gain.exponentialRampToValueAtTime(0.0001, 0.045);
  osc.connect(oscGain);
  oscGain.connect(offline.destination);
  osc.start(0);
  osc.stop(0.08);

  return offline.startRendering();
}

function synthesizePaper() {
  var sr = soundAudioCtx.sampleRate;
  var length = Math.floor(sr * 0.35);
  var offline = new OfflineAudioContext(1, length, sr);

  var noiseLen = Math.floor(sr * 0.32);
  var noiseBuf = offline.createBuffer(1, noiseLen, sr);
  var nd = noiseBuf.getChannelData(0);
  for (var i = 0; i < noiseLen; i++) nd[i] = Math.random() * 2 - 1;
  var noiseSrc = offline.createBufferSource();
  noiseSrc.buffer = noiseBuf;

  var bp = offline.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 1.2;
  bp.frequency.setValueAtTime(1200, 0);
  bp.frequency.exponentialRampToValueAtTime(400, 0.25);

  var gain = offline.createGain();
  gain.gain.setValueAtTime(0.0001, 0);
  gain.gain.exponentialRampToValueAtTime(0.5, 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, 0.25);

  noiseSrc.connect(bp);
  bp.connect(gain);
  gain.connect(offline.destination);
  noiseSrc.start(0);
  noiseSrc.stop(0.32);

  return offline.startRendering();
}

function playSound(name, rate) {
  if (!SOUND_ENABLED || !soundReady || !soundAudioCtx) return;
  if (soundAudioCtx.state === 'suspended') {
    try { soundAudioCtx.resume(); } catch (e) {}
  }
  var buf = soundBuffers[name];
  if (!buf) return;
  try {
    var src = soundAudioCtx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = rate || 1.0;
    var perPlay = soundAudioCtx.createGain();
    perPlay.gain.value = 1.0;
    src.connect(perPlay);
    perPlay.connect(soundMasterGain);
    src.start(0);
  } catch (e) { /* silent */ }
}

function getKeyPlaybackRate(key) {
  if (key && key.length === 1 && key >= '0' && key <= '9') {
    return 0.96 + (parseInt(key, 10) / 9) * 0.08;
  }
  if (key === '00') return 1.00;
  if (key === 'back') return 0.97;
  if (key === 'done') return 1.03;
  return 1.0;
}

function playTock(key) { playSound('tock', getKeyPlaybackRate(key)); }
function playCheck(isChecked) { playSound('check', isChecked ? 1.02 : 0.96); }
function playPaper(isOpen) { playSound('paper', isOpen ? 1.0 : 0.92); }
function playDrop() { playSound('drop', 1.0); }

/* ============ BLOSSOM STREAM AMBIENT ============ */
var BLOSSOM_STREAM_PEAK = 0.20;
var BLOSSOM_STREAM_FADE_IN = 2.2;
var BLOSSOM_STREAM_FADE_OUT = 1.4;

var blossomStreamSource = null;
var blossomStreamGain = null;

function startBlossomStream() {
  if (!SOUND_ENABLED || !soundReady || !soundAudioCtx) return;
  if (!soundBuffers.stream) return;
  if (blossomStreamSource) return;

  var buffer = soundBuffers.stream;
  var now = soundAudioCtx.currentTime;

  var src = soundAudioCtx.createBufferSource();
  src.buffer = buffer;
  src.loop = true;

  var gain = soundAudioCtx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(BLOSSOM_STREAM_PEAK, now + BLOSSOM_STREAM_FADE_IN);

  src.connect(gain);
  gain.connect(soundMasterGain);
  src.start(now);

  blossomStreamSource = src;
  blossomStreamGain = gain;
}

function stopBlossomStream() {
  if (!blossomStreamSource || !blossomStreamGain || !soundAudioCtx) {
    blossomStreamSource = null;
    blossomStreamGain = null;
    return;
  }
  try {
    var now = soundAudioCtx.currentTime;
    var src = blossomStreamSource;
    var gain = blossomStreamGain;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(0, now + BLOSSOM_STREAM_FADE_OUT);
    src.stop(now + BLOSSOM_STREAM_FADE_OUT + 0.1);
    setTimeout(function() {
      try { gain.disconnect(); } catch (e) {}
    }, (BLOSSOM_STREAM_FADE_OUT + 0.3) * 1000);
  } catch (e) { /* silent */ }
  blossomStreamSource = null;
  blossomStreamGain = null;
}

function tryStartBlossomStream(retries) {
  if (typeof retries !== 'number') retries = 15;
  if (!SOUND_ENABLED) return;
  if (!isBlossomInteractive()) return;
  if (soundReady && soundBuffers.stream) {
    startBlossomStream();
    return;
  }
  if (retries <= 0) return;
  setTimeout(function() { tryStartBlossomStream(retries - 1); }, 400);
}

/* ============ AMBIENT SOUND ROTATION ============
   The scheduler is a linear setTimeout recursion, not a fixed-rate
   interval. Each cycle plays a full buffer (or maxPlaySec) and
   re-arms on the fade-out tail via the return value of
   playAmbientSound():

     · positive number  → milliseconds until the next tick
     · 0                → terminal stop; scheduleNextAmbient() exits

   The return value doubles as a signal channel. Terminal states
   (sound disabled, non-warm-palette theme, carousel inactive,
   missing AudioContext) return 0; transient states (UI synth
   pending, current slot not yet decoded) return 500 and are
   counted by _ambientBufferRetries, which caps the retry window at
   ~60s before giving up. This closes both the busy-loop that a 0
   return would produce (setTimeout(fn, 0)) and the zombie-poll
   that an uncapped transient return would produce after a
   permanently failed fetch.

   Because decodeAmbientSlot() now performs an on-demand raw fetch
   when _ambientRawBuffers is empty, a failed boot download no
   longer leaves the slot permanently dead — the 500ms polling
   loop retries the fetch alongside the decode. The 120-attempt
   cap still bounds the whole retry window at ~60s, preserving the
   terminal-stop contract.

   ambientPlayStartTime / ambientPlayDurationSec are set at each
   playAmbientSound() call and consumed by updateHudProgress() to
   advance the HUD gauge fill and the split timestamp row. All
   three of ambientPlayStartTime, ambientPlayDurationSec, and
   _hudLastRenderedSec reset together in stopAmbient() so the
   playback-window state stays in one cohort. */
var ambientTimer = null;
var ambientSource = null;
var ambientGain = null;
var _ambientBufferRetries = 0;
var ambientPlayStartTime = -1;
var ambientPlayDurationSec = 0;

/* The track for the page colour theme's phase. Function declarations
   hoist, so referencing getTimeOfDayInNagoya here — even though it is
   declared later in the file — is safe at runtime. */
function getCurrentAmbientTrack() {
  var phase = getTimeOfDayInNagoya();
  for (var i = 0; i < AMBIENT_TRACKS.length; i++) {
    if (AMBIENT_TRACKS[i].name === phase) return AMBIENT_TRACKS[i];
  }
  return AMBIENT_TRACKS[AMBIENT_TRACKS.length - 1];
}

function startAmbient() {
  stopAmbient();
  _ambientBufferRetries = 0;
  bambooStart();
  ambientTimer = setTimeout(function() {
    ambientTimer = null;
    var playMs = playAmbientSound();
    scheduleNextAmbient(playMs);
  }, 0);
  startSwellLoop();
  /* Arm the phase-boundary pre-decode scheduler here rather than in
     initSound(). The scheduler's lifecycle is now tied to the same
     .active gate the swell loop shares: a return-to-start
     screen disarms it, and a carousel mount re-arms it. */
  scheduleNextSlotPreDecode();
}

function scheduleNextAmbient(prevPlayMs) {
  /* Exit condition: 0 or negative signals terminal stop; break
     the recursion without re-arming. */
  if (!prevPlayMs || prevPlayMs <= 0) return;

  ambientTimer = setTimeout(function() {
    ambientTimer = null;
    var playMs = playAmbientSound();
    scheduleNextAmbient(playMs);
  }, prevPlayMs);
}

function stopAmbient() {
  bambooStop();
  chirpStop();
  stopSwellLoop();
  _ambientBufferRetries = 0;
  _plStop();
  _bufferResumeAt = 0;
  if (ambientTimer) {
    clearTimeout(ambientTimer);
    ambientTimer = null;
  }
  /* Disarm the phase-boundary pre-decode scheduler alongside the
     playback timer. Idle states must not pre-decode a slot the
     acoustic engine will never consume — see the LIFECYCLE note
     on scheduleNextSlotPreDecode(). */
  if (_slotPreDecodeTimer) {
    clearTimeout(_slotPreDecodeTimer);
    _slotPreDecodeTimer = null;
  }
  if (ambientSource && ambientGain && soundAudioCtx) {
    try {
      var now = soundAudioCtx.currentTime;
      ambientGain.gain.cancelScheduledValues(now);
      ambientGain.gain.setTargetAtTime(0, now, 0.1);
      ambientSource.stop(now + 0.5);
    } catch (e) {
      try { ambientSource.stop(); } catch (e2) {}
    }
  }
  ambientSource = null;
  ambientGain = null;
  ambientPlayStartTime = -1;
  ambientPlayDurationSec = 0;
  _hudLastRenderedSec = -1;

  /* Badge revert to standby via the single-authority renderer */
  _hudRenderState();
}

function playAmbientSound(offsetSec) {
  /* Terminal guards: sound disabled or carousel inactive. Every theme
     (autumn, winter, sakura) plays the same ambient music. Each of these states is not expected to
     flip without a fresh user gesture (or a full reload), so the
     scheduler stops rather than retrying. */
  if (!SOUND_ENABLED) return 0;
  if (!mapleLeaves || !mapleLeaves.classList.contains('active')) return 0;

  /* Terminal guard: AudioContext failed or unavailable. Since
     initSound() already ran via the first pointerdown before
     startAmbient() could fire, a null soundAudioCtx here means
     AudioContext construction failed or is unsupported — waiting
     500ms will never change that. */
  if (!soundAudioCtx) return 0;

  var track = getCurrentAmbientTrack();

  /* A phase with a playlist runs on the playlist engine. */
  if (track.playlist) return playPlaylistSong();

  var buffer = soundBuffers[track.bufferName];

  /* Transient guard: current slot not decoded yet. decodeAmbientSlot
     is now responsible for the fetch too — if the raw bytes are
     missing (a failed boot download, or a boot that hadn't
     resolved yet), the helper kicks off an on-demand fetch and
     awaits it alongside the decode. The memo maps in
     fetchAmbientRaw() and decodeAmbientSlot() ensure this does not
     stack concurrent fetches or decodes across successive 500ms
     ticks. The 120-attempt cap below bounds the whole retry
     window at ~60s. */
  if (!soundReady || !buffer) {
    if (!buffer) decodeAmbientSlot(track);
    _ambientBufferRetries++;
    if (_ambientBufferRetries > 120) {
      _ambientBufferRetries = 0;
      return 0;
    }
    return 500;
  }
  _ambientBufferRetries = 0;

  /* Synchronise HUD metadata to the currently-selected phase */
  _hudSetMeta(track.title, track.artist);

  /* Release every other decoded slot's PCM before we commit to
     this one. Safe: the currently-playing AudioBufferSourceNode
     (if any) holds its own strong reference to its buffer, so a
     cross-boundary fade-out is unaffected. */
  releaseNonCurrentAmbientSlots(track.bufferName);

  /* Paused (now, or when the app was last closed): the card shows the
     track, nothing plays, and no re-arm timer runs. The play button
     starts it again through this same function. */
  if (_musicPaused) return 0;

  var bufferDur = buffer.duration;
  /* Terminal guard: a successfully decoded AudioBuffer always has
     positive duration. A zero/negative value would mean decode
     produced an invalid buffer, which is not a state polling can
     resolve. Return 0 to halt the schedule. */
  if (bufferDur <= 0) return 0;

  var playDur = bufferDur;
  if (track.maxPlaySec && track.maxPlaySec < bufferDur) {
    playDur = track.maxPlaySec;
  }

  /* A resume after the pause button picks up where it stopped, with a
     short fade-in instead of the 3-second one. */
  var startAt = (offsetSec > 0 && offsetSec < playDur - 5) ? offsetSec : 0;
  var remaining = playDur - startAt;

  var maxFade = playDur * 0.10;
  var fadeIn  = Math.min(startAt > 0 ? 0.5 : AMBIENT_FADE_IN, maxFade);
  var fadeOut = Math.min(AMBIENT_FADE_OUT, maxFade);
  var peak = track.peak;

  var now = soundAudioCtx.currentTime;
  var src = soundAudioCtx.createBufferSource();
  src.buffer = buffer;
  var gain = soundAudioCtx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(peak, now + fadeIn);
  gain.gain.setValueAtTime(peak, now + remaining - fadeOut);
  gain.gain.linearRampToValueAtTime(0, now + remaining);

  src.connect(gain);
  gain.connect(ambientBus || soundMasterGain);
  src.start(now, startAt);
  src.stop(now + remaining + 0.1);

  ambientSource = src;
  ambientGain = gain;
  ambientPlayStartTime = now - startAt;
  ambientPlayDurationSec = playDur;
  _ambientPlayingName = track.name;

  /* Badge transitions to 再生中 via the single-authority renderer */
  _hudRenderState();

  src.onended = function() {
    /* The source is stopped 100ms past the fade-out tail while
       scheduleNextAmbient() re-arms right on playDur, so src1's
       onended can fire during the first frames of src2. Guarding
       the timing reset behind the identity check keeps src2's
       start time and duration intact — without this, the HUD
       pins to 00:00 / 00:00 after every track transition. */
    if (ambientSource === src) {
      ambientSource = null;
      ambientPlayStartTime = -1;
      ambientPlayDurationSec = 0;
      _hudLastRenderedSec = -1;
    }
    if (ambientGain === gain) ambientGain = null;
    try { gain.disconnect(); } catch (e) {}
    /* Defensive: keep the HUD in sync if the re-arm timing changes */
    _hudRenderState();
  };

  return remaining * 1000;
}

/* ============ PLAYLISTS & MUSIC BUTTONS ============
   Morning, day and evening play folders of numbered songs; night plays one
   file on the buffer engine above. The folders:

     Sound/morning/1.m4a, 2.m4a, …   plays in the morning and the day
     Sound/Evening/1.m4a, 2.m4a, …   plays in the evening

   A static site cannot list a folder, so probePlaylist() asks for 1, 2, 3
   … one after another and stops at the first the server answers 404 for.
   Adding a song is adding the next number; nothing here changes. A
   folder is M4A (AAC in an MP4 container) or MP3 as its entry in
   MUSIC_PLAYLISTS says; a file of the other kind in the folder is
   never asked for; the title and artist come from the file's own
   tags — ID3 in an MP3 (readId3Tags), the iTunes-style ©nam / ©ART atoms
   in an M4A (readMp4Tags) — once its bytes have arrived.

   The phases are the page colour theme's (getTimeOfDayInNagoya): morning
   05:00, day 11:00, evening 17:00, night 21:00. There is no day music
   yet, so the day carries on with the morning songs without a break.

   A playlist runs on one <audio> element fed from the downloaded bytes
   (a Blob), routed through the Web Audio graph so the HUD wave and the
   swell loop still hear it and the mute button, which sits on
   ambientBus, still covers it. Nothing is decoded to PCM, so a song
   costs its file size in memory, not ~100 MB.

   The engine is driven by the element's 'ended' event, not by the timer
   chain: playPlaylistSong() returns 0, so scheduleNextAmbient() does not
   re-arm. At the end of a song, if the clock has moved into a phase with
   a different playlist (or the night file), startAmbient() hands over —
   a song that is mid-flight when the hour changes still finishes.

   Between songs, whether a song ran out or next / back was tapped, the
   old one fades out and the new one fades in. Running out, the song's own
   last seconds fade (AMBIENT_FADE_OUT); tapped, it fades over
   PL_FADE_OUT_MS.

   Button behaviour:
     · back   — tap: the song starts again from the beginning; a second
                tap within 0.45 s: the previous song. On the single-song
                night phase both just start the song again.
     · next   — the next song; the song again at night.
     · pause  — stops with a short fade and remembers the position,
                the icon turns to ▶. Skipping or restarting while
                paused starts playing again.
     · mute   — silences the music only. UI sounds and the wind chime
                are not on ambientBus.
   Paused and muted are kept in localStorage, so the card comes back
   in the state it was left in. */
var PL_MAX_SONGS = 30;
var PL_FADE_OUT_MS = 1000;       // the fade-out when next / back is tapped
var PL_FADE_IN = 1.5;            // seconds, every song that follows another
var PL_QUICK_MS = 130;           // the quick duck before a restart
var MUSIC_DOUBLE_TAP_MS = 450;

function _makePlaylist(dir, ext, mime) {
  return { dir: dir, ext: ext, mime: mime, songs: [], index: 0,
           done: false, probing: false, probeN: 0, retries: 0 };
}
var MUSIC_PLAYLISTS = {
  morning: _makePlaylist('Sound/morning/', 'm4a', 'audio/mp4'),
  evening: _makePlaylist('Sound/Evening/', 'm4a', 'audio/mp4')
};

var _pl = null;                  // the playlist the engine holds
var _plAudio = null;             // the one <audio> element, reused for every song
var _plGain = null;              // fades each song in and out
var _plUrl = '';                 // blob URL of the song loaded now
var _plOn = false;               // the engine holds a song (playing or paused)
var _plSeq = 0;                  // bumped by every change of song, so late timers stand down
var _plTarget = -1;              // the song a pending skip is heading for
var _plErrors = 0;

var _ambientPlayingName = '';    // phase name of the buffer-engine track on air
var _bufferResumeAt = 0;         // seconds into it when it was paused
var _bufferResumeName = '';
var _backTapAt = 0;

function _musicLoadFlag(k) {
  try { return localStorage.getItem('thankyouMusic' + k) === '1'; } catch (e) { return false; }
}
function _musicSaveFlag(k, v) {
  try { localStorage.setItem('thankyouMusic' + k, v ? '1' : '0'); } catch (e) {}
}
var _musicPaused = _musicLoadFlag('Paused');
var _musicMuted  = _musicLoadFlag('Muted');

var hudBtnBack = document.getElementById('hudBtnBack');
var hudBtnNext = document.getElementById('hudBtnNext');
var hudBtnPlay = document.getElementById('hudBtnPlay');
var hudBtnMute = document.getElementById('hudBtnMute');

/* True while either engine holds a track — the HUD reads this where it
   used to read ambientSource. */
function _ambientActive() {
  return ambientSource !== null || _plOn;
}

/* True once every playlist has been walked to its end. */
function _playlistsDone() {
  for (var k in MUSIC_PLAYLISTS) if (!MUSIC_PLAYLISTS[k].done) return false;
  return true;
}

/* Title and artist on the meta row. With no artist the bullet goes (it
   keeps its place, so the layout does not shift). */
function _hudSetMeta(title, artist) {
  if (hudTrackTitle)  hudTrackTitle.textContent = title;
  if (hudTrackArtist) hudTrackArtist.textContent = artist || '';
  if (hudTrackSep)    hudTrackSep.classList.toggle('hud-dot-off', !artist);
}

/* ---------- tags ---------- */
function _id3Text(bytes, enc) {
  var text = '';
  try {
    if (enc === 1) {
      var bomBE = bytes[0] === 0xFE && bytes[1] === 0xFF;
      var bomLE = bytes[0] === 0xFF && bytes[1] === 0xFE;
      text = new TextDecoder(bomBE ? 'utf-16be' : 'utf-16le').decode(bytes.subarray(bomBE || bomLE ? 2 : 0));
    } else if (enc === 2) {
      text = new TextDecoder('utf-16be').decode(bytes);
    } else if (enc === 3) {
      text = new TextDecoder('utf-8').decode(bytes);
    } else {
      text = new TextDecoder('windows-1252').decode(bytes);
    }
  } catch (e) { return ''; }
  /* A frame can hold several NUL-separated values; the first is the main one. */
  return text.split('\u0000')[0].trim();
}

/* Title (TIT2) and artist (TPE1) from an ID3v2.3 / v2.4 tag at the head
   of an MP3. Anything it cannot read comes back as ''. */
function readId3Tags(buf) {
  var out = { title: '', artist: '' };
  try {
    var b = new Uint8Array(buf);
    if (b.length < 10 || b[0] !== 0x49 || b[1] !== 0x44 || b[2] !== 0x33) return out;
    var ver = b[3];
    if (ver !== 3 && ver !== 4) return out;
    var end = Math.min(b.length, 10 + ((b[6] << 21) | (b[7] << 14) | (b[8] << 7) | b[9]));
    var pos = 10;
    if (b[5] & 0x40) {   // extended header: skip it
      pos += ver === 4
        ? ((b[10] << 21) | (b[11] << 14) | (b[12] << 7) | b[13])
        : (b[10] * 16777216 + (b[11] << 16) + (b[12] << 8) + b[13] + 4);
    }
    while (pos + 10 <= end && b[pos] !== 0) {
      var id = String.fromCharCode(b[pos], b[pos + 1], b[pos + 2], b[pos + 3]);
      var size = ver === 4
        ? ((b[pos + 4] << 21) | (b[pos + 5] << 14) | (b[pos + 6] << 7) | b[pos + 7])
        : (b[pos + 4] * 16777216 + (b[pos + 5] << 16) + (b[pos + 6] << 8) + b[pos + 7]);
      if (size <= 1 || pos + 10 + size > end) break;
      if (id === 'TIT2') out.title  = _id3Text(b.subarray(pos + 11, pos + 10 + size), b[pos + 10]);
      if (id === 'TPE1') out.artist = _id3Text(b.subarray(pos + 11, pos + 10 + size), b[pos + 10]);
      pos += 10 + size;
    }
  } catch (e) {}
  return out;
}

/* The boxes ("atoms") of an MP4 between start and end, as
   { type, body, end }: body is where the box's contents begin. */
function _mp4Boxes(dv, start, end) {
  var list = [];
  var pos = start;
  while (pos + 8 <= end) {
    var size = dv.getUint32(pos);
    var type = String.fromCharCode(dv.getUint8(pos + 4), dv.getUint8(pos + 5), dv.getUint8(pos + 6), dv.getUint8(pos + 7));
    var head = 8;
    if (size === 1) {   // 64-bit size
      size = dv.getUint32(pos + 8) * 4294967296 + dv.getUint32(pos + 12);
      head = 16;
    } else if (size === 0) {
      size = end - pos;
    }
    if (size < head || pos + size > end) break;
    list.push({ type: type, body: pos + head, end: pos + size });
    pos += size;
  }
  return list;
}

function _mp4Find(list, type) {
  for (var i = 0; i < list.length; i++) if (list[i].type === type) return list[i];
  return null;
}

/* Title (©nam) and artist (©ART, or aART) from the iTunes-style tags of an
   M4A: moov › udta › meta › ilst. Anything it cannot read comes back as ''. */
function readMp4Tags(buf) {
  var out = { title: '', artist: '' };
  try {
    var dv = new DataView(buf);
    var moov = _mp4Find(_mp4Boxes(dv, 0, buf.byteLength), 'moov');
    if (!moov) return out;
    var udta = _mp4Find(_mp4Boxes(dv, moov.body, moov.end), 'udta');
    if (!udta) return out;
    var meta = _mp4Find(_mp4Boxes(dv, udta.body, udta.end), 'meta');
    if (!meta) return out;
    /* meta is a "full" box (4 bytes of version and flags) in MP4, a plain
       box in old QuickTime files: a leading zero word says which. */
    var inner = dv.getUint32(meta.body) === 0 ? meta.body + 4 : meta.body;
    var ilst = _mp4Find(_mp4Boxes(dv, inner, meta.end), 'ilst');
    if (!ilst) return out;
    var items = _mp4Boxes(dv, ilst.body, ilst.end);
    var text = function(type) {
      var item = _mp4Find(items, type);
      if (!item) return '';
      var data = _mp4Find(_mp4Boxes(dv, item.body, item.end), 'data');
      if (!data) return '';
      /* 1 byte version, 3 of flags (1 = UTF-8 text), 4 of locale, then the text */
      return new TextDecoder('utf-8').decode(new Uint8Array(buf, data.body + 8, data.end - data.body - 8)).trim();
    };
    out.title  = text('©nam');
    out.artist = text('©ART') || text('aART');
  } catch (e) {}
  return out;
}

function _readTags(buf) {
  var b = new Uint8Array(buf, 0, Math.min(buf.byteLength, 3));
  if (b[0] === 0x49 && b[1] === 0x44 && b[2] === 0x33) return readId3Tags(buf);
  return readMp4Tags(buf);
}

/* An MP3 starts with an ID3 tag or a frame sync; an M4A with an 'ftyp'
   box. A host that answers a missing file with a 200 page is caught here,
   not played. */
function _looksLikeAudio(buf) {
  if (buf.byteLength < 12) return false;
  var b = new Uint8Array(buf, 0, 12);
  return (b[0] === 0x49 && b[1] === 0x44 && b[2] === 0x33) ||
         (b[0] === 0xFF && (b[1] & 0xE0) === 0xE0) ||
         (b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70);
}

/* ---------- finding the songs ---------- */
function probePlaylist(pl) {
  if (pl.probing || pl.done) return;
  pl.probing = true;

  function step() {
    var n = pl.probeN + 1;
    if (n > PL_MAX_SONGS) {
      pl.probing = false;
      pl.done = true;
      _hudRenderState();
      return;
    }
    var song = { url: pl.dir + n + '.' + pl.ext, title: '', artist: '' };
    fetchAmbientRaw(song).then(function(raw) {
      if (!raw || !_looksLikeAudio(raw)) {
        pl.probing = false;
        if (raw) {
          /* a 200 that is not audio: the folder has ended */
          delete _ambientRawBuffers[song.url];
          pl.done = true;
        } else if (_ambientMissing[song.url]) {
          pl.done = true;
        } else if (++pl.retries <= 20) {
          /* the network, not the folder: ask again shortly */
          setTimeout(function() { probePlaylist(pl); }, 3000);
        } else {
          pl.done = true;
        }
        _hudRenderState();
        return;
      }
      var tags = _readTags(raw);
      song.title  = tags.title || ('トラック ' + n);
      song.artist = tags.artist;
      pl.songs.push(song);
      pl.probeN = n;
      pl.retries = 0;
      step();
    });
  }
  step();
}

/* ---------- the playlist engine ---------- */
function _plEnsureGraph() {
  if (_plAudio) return true;
  if (!soundAudioCtx) return false;
  try {
    var a = new Audio();
    a.preload = 'auto';
    var node = soundAudioCtx.createMediaElementSource(a);
    _plGain = soundAudioCtx.createGain();
    _plGain.gain.value = 0;
    node.connect(_plGain);
    _plGain.connect(ambientBus || soundMasterGain);
    a.addEventListener('ended', function() {
      if (_plOn) _plStep(1, 0);
    });
    a.addEventListener('playing', function() { _plErrors = 0; });
    a.addEventListener('error', function() {
      /* A file the browser cannot play: move on, unless every song fails. */
      if (!_plOn || !_pl || ++_plErrors > _pl.songs.length) return;
      _plStep(1, 500);
    });
    _plAudio = a;
  } catch (e) {
    return false;
  }
  return true;
}

function _plLoadSong(idx) {
  var song = _pl.songs[idx];
  var raw = _ambientRawBuffers[song.url];
  if (!raw || !_plAudio) return false;
  var a = _plAudio;
  var seq = _plSeq;
  var old = _plUrl;
  _plUrl = URL.createObjectURL(new Blob([raw], { type: _pl.mime }));
  a.src = _plUrl;
  if (old) URL.revokeObjectURL(old);
  _pl.index = idx;
  _plOn = true;
  /* Every song comes in from silence, whatever the one before ended on. */
  try {
    var now = soundAudioCtx.currentTime;
    _plGain.gain.cancelScheduledValues(now);
    _plGain.gain.setValueAtTime(0, now);
  } catch (e) {}
  ambientPlayDurationSec = 0;
  a.onloadedmetadata = function() {
    if (seq !== _plSeq) return;
    ambientPlayDurationSec = a.duration;
    _hudRenderState();
  };
  _hudSetMeta(song.title, song.artist);
  return true;
}

/* Play the loaded song, fading in over fadeIn seconds from wherever the
   gain is, and lay down the fade-out for its last seconds. */
function _plStart(fadeIn) {
  var a = _plAudio;
  var seq = _plSeq;
  if (!a) return;
  var begin = function() {
    if (seq !== _plSeq || _musicPaused) return;
    var now = soundAudioCtx.currentTime;
    var g = _plGain.gain;
    var left = a.duration - a.currentTime;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(1, now + fadeIn);
    if (isFinite(left)) {
      var tail = Math.min(AMBIENT_FADE_OUT, a.duration * 0.10);
      if (left > fadeIn + tail) {
        g.setValueAtTime(1, now + left - tail);
        g.linearRampToValueAtTime(0, now + left);
      }
    }
    _hudRenderState();
  };
  var p = a.play();
  if (p && p.then) {
    p.then(begin, function() {
      /* The browser refused to start it: show it as paused, and do not
         remember that as the user's choice. */
      if (seq !== _plSeq) return;
      _musicPaused = true;
      _musicSyncButtons();
    });
  } else {
    begin();
  }
}

/* Ramp the song's gain to nothing over sec seconds, from where it is. */
function _plFadeOut(sec) {
  if (!_plGain || !soundAudioCtx) return;
  var now = soundAudioCtx.currentTime;
  var g = _plGain.gain;
  try {
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(0, now + sec);
  } catch (e) {}
}

function _plPause() {
  var a = _plAudio;
  var seq = _plSeq;
  if (!a) return;
  _plFadeOut(0.25);
  setTimeout(function() {
    if (seq === _plSeq && _musicPaused) a.pause();
  }, 300);
  _hudRenderState();
}

/* Release the engine (stopAmbient). The song fades out first; the
   element is emptied only if no new song has been loaded since. */
function _plStop() {
  var seq = ++_plSeq;
  _plTarget = -1;
  if (!_plOn) return;
  _plOn = false;
  var a = _plAudio;
  var url = _plUrl;
  _plUrl = '';
  _plFadeOut(0.25);
  setTimeout(function() {
    if (seq === _plSeq && a) {
      try { a.pause(); a.removeAttribute('src'); a.load(); } catch (e) {}
    }
    if (url) URL.revokeObjectURL(url);
  }, 300);
}

/* Called by playAmbientSound() while the phase has a playlist. */
function playPlaylistSong() {
  var pl = MUSIC_PLAYLISTS[getCurrentAmbientTrack().playlist];
  if (!pl.songs.length) {
    /* No song has arrived yet: keep asking, as the buffer engine does. */
    probePlaylist(pl);
    _ambientBufferRetries++;
    if (_ambientBufferRetries > 120) {
      _ambientBufferRetries = 0;
      return 0;
    }
    return 500;
  }
  _ambientBufferRetries = 0;
  if (!_plEnsureGraph()) return 0;
  _pl = pl;
  _plSeq++;
  _plTarget = -1;
  if (_plLoadSong(pl.index % pl.songs.length) && !_musicPaused) {
    _plStart(1.5);
  }
  return 0;   // song changes come from the element's 'ended' event
}

/* Move delta songs on (1 or −1). The song on air fades out over delayMs
   (nothing to fade when it has run out: 0), then the next fades in.
   Always plays: skipping from the paused state starts the music. Taps
   that come while a skip is pending count from the song it is heading
   for. */
function _plStep(delta, delayMs) {
  if (!_plOn) return;
  _musicSetPaused(false);
  /* The hour has moved on to a phase with other music: it takes over. */
  var track = getCurrentAmbientTrack();
  if (!track.playlist || MUSIC_PLAYLISTS[track.playlist] !== _pl) { startAmbient(); return; }
  var n = _pl.songs.length;
  if (!n) return;
  var base = _plTarget >= 0 ? _plTarget : _pl.index;
  var idx = (((base + delta) % n) + n) % n;
  _plTarget = idx;
  var seq = ++_plSeq;
  if (delayMs > 0) _plFadeOut(delayMs / 1000);
  _hudSetMeta(_pl.songs[idx].title, _pl.songs[idx].artist);
  setTimeout(function() {
    if (seq !== _plSeq || !_plOn) return;
    _plTarget = -1;
    if (_plLoadSong(idx)) _plStart(PL_FADE_IN);
  }, delayMs);
}

function _plRestart() {
  _musicSetPaused(false);
  var seq = ++_plSeq;
  _plTarget = -1;
  _plFadeOut(PL_QUICK_MS / 1000);
  /* a skip that was pending is cancelled: the card shows the song on air */
  var song = _pl.songs[_pl.index];
  _hudSetMeta(song.title, song.artist);
  setTimeout(function() {
    if (seq !== _plSeq || !_plOn) return;
    try { _plAudio.currentTime = 0; } catch (e) {}
    _plStart(0.6);
  }, PL_QUICK_MS);
}

/* ---------- the single-song phase: pause, resume, restart ---------- */
function _bufferPause() {
  if (ambientTimer) { clearTimeout(ambientTimer); ambientTimer = null; }
  if (ambientSource === null) return;
  _bufferResumeAt = getPlaybackElapsed();
  _bufferResumeName = _ambientPlayingName;
  try {
    var now = soundAudioCtx.currentTime;
    ambientGain.gain.cancelScheduledValues(now);
    ambientGain.gain.setValueAtTime(ambientGain.gain.value, now);
    ambientGain.gain.setTargetAtTime(0, now, 0.08);
    ambientSource.stop(now + 0.4);
  } catch (e) {
    try { ambientSource.stop(); } catch (e2) {}
  }
  ambientSource = null;
  ambientGain = null;
  ambientPlayStartTime = -1;
  ambientPlayDurationSec = 0;
  _hudLastRenderedSec = -1;
  _hudRenderState();
}

function _bufferResume() {
  if (ambientTimer || ambientSource !== null) return;
  var at = (_bufferResumeName === getCurrentAmbientTrack().name) ? _bufferResumeAt : 0;
  _bufferResumeAt = 0;
  var ms = playAmbientSound(at);
  scheduleNextAmbient(ms);
}

/* ---------- the buttons ---------- */
function _musicSyncButtons() {
  if (hudBtnPlay) {
    hudBtnPlay.classList.toggle('on', _musicPaused);
    hudBtnPlay.setAttribute('aria-label', _musicPaused ? '再生' : '一時停止');
  }
  if (hudBtnMute) {
    hudBtnMute.classList.toggle('on', _musicMuted);
    hudBtnMute.setAttribute('aria-pressed', _musicMuted ? 'true' : 'false');
  }
}

function _musicSetPaused(p) {
  if (_musicPaused === p) return;
  _musicPaused = p;
  _musicSaveFlag('Paused', p);
  _musicSyncButtons();
}

function musicTogglePause() {
  if (_musicPaused) {
    _musicSetPaused(false);
    if (_plOn) _plStart(0.5);
    else _bufferResume();
  } else {
    _musicSetPaused(true);
    if (_plOn) _plPause();
    else _bufferPause();
  }
}

function musicToggleMute() {
  _musicMuted = !_musicMuted;
  _musicSaveFlag('Muted', _musicMuted);
  _musicSyncButtons();
  if (ambientBus && soundAudioCtx) {
    var now = soundAudioCtx.currentTime;
    ambientBus.gain.cancelScheduledValues(now);
    ambientBus.gain.setValueAtTime(ambientBus.gain.value, now);
    ambientBus.gain.setTargetAtTime(_musicMuted ? 0 : 1, now, 0.06);
  }
}

/* The single-song phase has nothing to skip to: both buttons start the
   song again. */
function _musicRestartTrack() {
  _musicSetPaused(false);
  _bufferResumeAt = 0;
  startAmbient();
}

function musicNext() {
  if (_plOn) _plStep(1, PL_FADE_OUT_MS);
  else _musicRestartTrack();
}

function musicBack() {
  var now = Date.now();
  var again = now - _backTapAt < MUSIC_DOUBLE_TAP_MS;
  _backTapAt = again ? 0 : now;
  if (!_plOn) _musicRestartTrack();
  else if (again) _plStep(-1, PL_FADE_OUT_MS);
  else _plRestart();
}

/* Only the four buttons take touches (the card around them ignores them),
   and a press on one must not also reach the page behind: the swipe and
   koi handlers listen on the document. initSound() is called here
   because the press never reaches the document's own first-touch hook. */
(function bindMusicButtons() {
  function bind(el, action) {
    if (!el) return;
    ['pointerdown', 'pointerup', 'touchstart', 'touchend'].forEach(function(type) {
      el.addEventListener(type, function(e) { e.stopPropagation(); }, { passive: true });
    });
    el.addEventListener('click', function(e) {
      e.stopPropagation();
      initSound();
      haptic(8);
      action();
    });
  }
  bind(hudBtnBack, musicBack);
  bind(hudBtnNext, musicNext);
  bind(hudBtnPlay, musicTogglePause);
  bind(hudBtnMute, musicToggleMute);
  _musicSyncButtons();
})();

/* ============ WIND IN THE BAMBOO ============
   An ambient layer for the morning and the day (the page colour theme's
   morning and day phases, 05:00–16:59), under the music. Sound/morning/
   Windbamboo.mp3 is a 57-second field recording; every so often a random
   12-second piece of it is played, fading in over its first 2 seconds and
   out over its last 2.

   Timing: the next piece starts 5–15 seconds after the last one has
   finished, at random. A strong gust — one the landscape or the winter
   scene sends that is at least the threshold strength — starts a piece at
   once when none is playing, so the rustle arrives with the wind; during
   a piece, or in another phase, a gust does nothing.

   It runs while the ambient music does (startAmbient / stopAmbient), and
   keeps asking the clock, so a page left open carries on at 05:00 and
   falls silent at 17:00 without being restarted. It is wind, not music:
   it does not go through ambientBus, so the music's mute and pause
   buttons leave it alone, as they do the wind chime. BAMBOO_PEAK is its
   loudness — the recording itself is quiet (about 17 dB under the songs). */
var BAMBOO_CLIP_SEC = 12;
var BAMBOO_FADE = 2;               // seconds, in and out
var BAMBOO_GAP_MIN = 5;            // seconds between one piece's end and the next's start
var BAMBOO_GAP_MAX = 15;
var BAMBOO_PEAK = 1.8;
var BAMBOO_GUST_STR = 120;         // a landscape gust this strong (startGust's str) brings a piece in
var BAMBOO_WIN_GUST_STR = 0.7;     // …and the winter scene's, on its own scale

var _bambooOn = false;
var _bambooTimer = null;
var _bambooSrc = null;
var _bambooGain = null;

function _bambooPhaseOk() {
  var phase = getTimeOfDayInNagoya();
  return phase === 'morning' || phase === 'day';
}

function _bambooSchedule() {
  if (!_bambooOn) return;
  var gap = BAMBOO_GAP_MIN + Math.random() * (BAMBOO_GAP_MAX - BAMBOO_GAP_MIN);
  _bambooTimer = setTimeout(function() {
    _bambooTimer = null;
    _bambooPlay();
  }, gap * 1000);
}

function _bambooPlay() {
  if (!_bambooOn || _bambooSrc) return;
  /* The birds' chirping is playing, or has only just stopped (see "Birds
     chirping"): the two never sound together, so wait for another gap. */
  if (_chirpBusy()) { _bambooSchedule(); return; }
  var buf = soundBuffers.bamboo;
  /* Not the morning or the day, or the recording has not arrived yet:
     ask again after another gap. */
  if (!_bambooPhaseOk() || !buf || !soundAudioCtx) { _bambooSchedule(); return; }

  var len = Math.min(BAMBOO_CLIP_SEC, buf.duration);
  var offset = Math.random() * (buf.duration - len);
  var fade = Math.min(BAMBOO_FADE, len / 2);
  var now = soundAudioCtx.currentTime;
  var src = soundAudioCtx.createBufferSource();
  src.buffer = buf;
  var gain = soundAudioCtx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(BAMBOO_PEAK, now + fade);
  gain.gain.setValueAtTime(BAMBOO_PEAK, now + len - fade);
  gain.gain.linearRampToValueAtTime(0, now + len);
  src.connect(gain);
  gain.connect(soundMasterGain);
  src.start(now, offset, len);
  _bambooSrc = src;
  _bambooGain = gain;
  src.onended = function() {
    try { gain.disconnect(); } catch (e) {}
    if (_bambooSrc === src) {
      _bambooSrc = null;
      _bambooGain = null;
      _bambooSchedule();
    }
  };
}

function bambooStart() {
  bambooStop();
  if (!SOUND_ENABLED) return;
  _bambooOn = true;
  _bambooSchedule();
}

function bambooStop() {
  _bambooOn = false;
  if (_bambooTimer) { clearTimeout(_bambooTimer); _bambooTimer = null; }
  if (_bambooSrc && _bambooGain && soundAudioCtx) {
    try {
      var now = soundAudioCtx.currentTime;
      _bambooGain.gain.cancelScheduledValues(now);
      _bambooGain.gain.setValueAtTime(_bambooGain.gain.value, now);
      _bambooGain.gain.setTargetAtTime(0, now, 0.1);
      _bambooSrc.stop(now + 0.5);
    } catch (e) {
      try { _bambooSrc.stop(); } catch (e2) {}
    }
  }
  _bambooSrc = null;
  _bambooGain = null;
}

/* A gust has started; strength is its own strength over the threshold, so
   1 or more is a strong one. */
function bambooGust(strength) {
  if (strength < 1 || !_bambooOn || _bambooSrc || _chirpBusy() || !_bambooPhaseOk()) return;
  if (_bambooTimer) { clearTimeout(_bambooTimer); _bambooTimer = null; }
  _bambooPlay();
}

/* ============ BIRDS CHIRPING ============
   While birds are in the scene (see "Birds"), a random 10-second piece of
   Sound/Chirping2.mp3 (36 seconds of small birds) is played, fading in over
   its first 1.5 seconds and out over its last 1.5. The first one starts
   1–3 seconds after the first bird comes on screen; while birds stay, the
   next piece starts 4–12 seconds after the last has finished (or 1.5–3
   seconds after a bamboo piece, if that is later). If the birds
   have all gone, the piece in the air fades out at once, over 1.5 seconds.

   It is blended in under the music and next to the wind in the bamboo:
   - Level: the recording is steady (about -32.6 LUFS) and the songs run at
     about -19 LUFS, so at CHIRP_PEAK 1 it sits some 13 dB under the music,
     just under the bamboo piece (which BAMBOO_PEAK lifts to about -31 LUFS).
   - Tone: the birds are all in the upper voice (1–8 kHz) and the wind in
     the low (mostly under 300 Hz), so the two do not mask each other; the
     birds' own faint low rumble is cut (CHIRP_LOW_CUT) so it does not pile
     onto the wind's.
   - Time: they never sound together. The chirping waits for a bamboo piece
     to finish, and a bamboo piece (or a gust) waits for the chirping.
   Like the wind, it is nature, not music: it does not go through
   ambientBus, so the music's mute and pause buttons leave it alone. */
var CHIRP_CLIP_SEC = 10;
var CHIRP_FADE = 1.5;              // seconds, in and out
var CHIRP_LEAVE_FADE = 1.5;        // seconds, when the birds have gone
var CHIRP_PEAK = 1.0;
var CHIRP_LOW_CUT = 450;           // Hz
var CHIRP_FIRST_MIN = 1;           // seconds from the first bird on screen to the first piece
var CHIRP_FIRST_MAX = 3;
var CHIRP_GAP_MIN = 4;             // seconds between one piece's end and the next's start
var CHIRP_GAP_MAX = 12;
var CHIRP_BREATH_MIN = 1.5;          // seconds of quiet between the end of a bamboo piece and a chirping piece
var CHIRP_BREATH_MAX = 3;

var _chirpSrc = null;
var _chirpGain = null;
var _chirpNextAt = 0;              // the clock of the birds (updateBirds' t)
var _chirpT = 0;
var _chirpHadBirds = false;
var _chirpLastOffset = -99;
var _chirpSawBamboo = false;
var _chirpEndCtx = -99;            // the audio clock when the last piece ended

/* A piece is playing, or ended less than a breath ago. */
function _chirpBusy() {
  return !!_chirpSrc || (!!soundAudioCtx && soundAudioCtx.currentTime - _chirpEndCtx < CHIRP_BREATH_MIN);
}

/* Called every frame by updateBirds: present is true while a bird is on screen. */
function chirpBirds(present, t) {
  _chirpT = t;
  /* After a bamboo piece it takes a short breath (not a whole gap, or the
     wind would crowd the birds out) so the two do not run on with no pause. */
  if (_bambooSrc) _chirpSawBamboo = true;
  else if (_chirpSawBamboo) {
    _chirpSawBamboo = false;
    _chirpNextAt = Math.max(_chirpNextAt, t + CHIRP_BREATH_MIN + Math.random() * (CHIRP_BREATH_MAX - CHIRP_BREATH_MIN));
  }
  if (!present) {
    _chirpHadBirds = false;
    if (_chirpSrc) _chirpFade(CHIRP_LEAVE_FADE);
    return;
  }
  if (!_chirpHadBirds) {
    _chirpHadBirds = true;
    _chirpNextAt = Math.max(_chirpNextAt, t + CHIRP_FIRST_MIN + Math.random() * (CHIRP_FIRST_MAX - CHIRP_FIRST_MIN));
  }
  if (_chirpSrc || t < _chirpNextAt) return;
  /* Sound off, not ready, or the wind in the bamboo is playing: look again in a moment. */
  if (!SOUND_ENABLED || !soundReady || !soundAudioCtx || soundAudioCtx.state !== 'running' || _bambooSrc) { _chirpNextAt = t + 1; return; }
  var buf = soundBuffers.chirp;
  if (!buf) { _chirpNextAt = t + 2; return; }
  _chirpPlay(buf);
}

function _chirpPlay(buf) {
  var len = Math.min(CHIRP_CLIP_SEC, buf.duration);
  /* Not the very start (it fades in from silence) or the last second; and
     not nearly the same piece as the last. */
  var lo = Math.min(2, buf.duration - len), hi = Math.max(lo, buf.duration - len - 1), offset = lo;
  for (var k = 0; k < 8; k++) {
    offset = lo + Math.random() * (hi - lo);
    if (Math.abs(offset - _chirpLastOffset) > len / 2) break;
  }
  _chirpLastOffset = offset;
  var fade = Math.min(CHIRP_FADE, len / 2);
  var now = soundAudioCtx.currentTime;
  var src = soundAudioCtx.createBufferSource();
  src.buffer = buf;
  var hp = soundAudioCtx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = CHIRP_LOW_CUT;
  hp.Q.value = 0.7;
  var gain = soundAudioCtx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(CHIRP_PEAK, now + fade);
  gain.gain.setValueAtTime(CHIRP_PEAK, now + len - fade);
  gain.gain.linearRampToValueAtTime(0, now + len);
  src.connect(hp);
  hp.connect(gain);
  gain.connect(soundMasterGain);
  src.start(now, offset, len);
  _chirpSrc = src;
  _chirpGain = gain;
  src.onended = function() {
    try { gain.disconnect(); hp.disconnect(); } catch (e) {}
    if (_chirpSrc === src) {
      _chirpSrc = null;
      _chirpGain = null;
      _chirpEndCtx = soundAudioCtx.currentTime;
      _chirpNextAt = Math.max(_chirpNextAt, _chirpT + CHIRP_GAP_MIN + Math.random() * (CHIRP_GAP_MAX - CHIRP_GAP_MIN));
    }
  };
}

/* The piece in the air fades out over sec seconds, from wherever it is. */
function _chirpFade(sec) {
  if (!_chirpSrc || !_chirpGain || !soundAudioCtx) return;
  try {
    var now = soundAudioCtx.currentTime, g = _chirpGain.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(0, now + sec);
    _chirpSrc.stop(now + sec + 0.05);
  } catch (e) {
    try { _chirpSrc.stop(); } catch (e2) {}
  }
}

/* Back at the start screen: silence at once. */
function chirpStop() {
  _chirpHadBirds = false;
  _chirpNextAt = 0;
  _chirpFade(0.3);
}

/* ============================================================
   AUDIO-REACTIVE SWELL SYSTEM */
function startSwellLoop() {
  if (swellRafId) cancelAnimationFrame(swellRafId);
  swellIsRunning = true;
  swellRafId = requestAnimationFrame(swellTick);
}

function stopSwellLoop() {
  swellIsRunning = false;
  if (swellRafId) {
    cancelAnimationFrame(swellRafId);
    swellRafId = null;
  }
  if (_scrollEndTimer) {
    clearTimeout(_scrollEndTimer);
    _scrollEndTimer = null;
  }
  _scrollActive = false;
  swellEnergy = 0;
  _lastAppliedSwell = -1;
  applySwellToCSS(0);
}

function swellTick() {
  if (!swellIsRunning) {
    swellRafId = null;
    return;
  }

  if (!swellAnalyserNode || !swellFreqData) {
    swellEnergy += (0 - swellEnergy) * 0.05;
    if (swellEnergy < 0.005) swellEnergy = 0;
  } else {
    swellAnalyserNode.getByteFrequencyData(swellFreqData);

    var sum = 0;
    for (var i = 4; i < 34; i++) sum += swellFreqData[i];
    var avg = sum / 30;

    var cleanEnergy = Math.max(0, avg - 80);
    var normalized = Math.min(1.0, cleanEnergy / (140 / 3.5));
    var targetEnergy = Math.pow(normalized, 1.35);

    if (targetEnergy > swellEnergy) {
      swellEnergy += (targetEnergy - swellEnergy) * 0.06;
    } else {
      swellEnergy += (targetEnergy - swellEnergy) * 0.010;
    }
  }

  /* Only the background swell write waits for the scroll to end.
     The HUD wave keeps moving while a finger is held down and
     dragging; during a scroll it draws every other frame (about
     60 a second) so it stays light next to the scroll work. */
  var _gestureBusy = _scrollActive || _swipeActive;
  if (!_gestureBusy) applySwellToCSS(swellEnergy);
  _hudScrollFrameSkip = _gestureBusy ? !_hudScrollFrameSkip : false;
  if (!_hudScrollFrameSkip && _hudShouldDraw()) {
    drawHudSpectrum();
    updateHudProgress();
  }

  if (swellIsRunning) {
    swellRafId = requestAnimationFrame(swellTick);
  } else {
    swellRafId = null;
  }
}

/* Writes --audio-swell on both background layers. The guard has
   two clauses — an identity check for the settled-zero case and a
   delta check for everything else — because a single compound
   predicate cannot express both intents. See the changelog block
   at the top of the file for the full rationale. */
function applySwellToCSS(val) {
  if (_lastAppliedSwell === val || (val !== 0 && Math.abs(val - _lastAppliedSwell) < 0.005)) return;
  _lastAppliedSwell = val;
  var vStr = val.toFixed(3);
  if (ambientStage) ambientStage.style.setProperty('--audio-swell', vStr);
  if (stageLattice) stageLattice.style.setProperty('--audio-swell', vStr);
  if (lanternBloom) lanternBloom.style.setProperty('--audio-swell', vStr);
}

document.addEventListener('pointerdown', initSound, { once: true });

/* ============ NUMBER FORMATTING ============ */
function formatWithComma(num) {
  if (num === '' || num === null || typeof num === 'undefined') return '';
  var n = parseInt(num, 10);
  if (isNaN(n)) return '';
  return n.toLocaleString();
}
function parseFormatted(str) {
  if (!str) return 0;
  var digits = String(str).replace(/[^0-9]/g, '');
  if (digits === '') return 0;
  return parseInt(digits, 10) || 0;
}

/* ============ PRESETS ============ */
var PRESETS = [
  { name: 'ダミーテキスト1', price: 0 },
  { name: 'ダミーテキスト2', price: 0 },
  { name: 'ダミーテキスト3', price: 0 },
  { name: 'ダミーテキスト4', price: 0 },
  { name: 'ダミーテキスト5', price: 0 },
  { name: 'ダミーテキスト6', price: 0 }
];

function normalizePresets(data) {
  if (!data || !Array.isArray(data.presets) || data.presets.length === 0) return null;
  var out = [];
  for (var i = 0; i < data.presets.length; i++) {
    var entry = data.presets[i];
    if (typeof entry === 'string') {
      var trimmed = entry.trim();
      if (trimmed === '') continue;
      out.push({ name: trimmed, price: 0 });
    } else if (entry && typeof entry === 'object' && typeof entry.name === 'string') {
      var n = entry.name.trim();
      if (n === '') continue;
      var p = 0;
      if (typeof entry.price === 'number' && isFinite(entry.price)) {
        p = Math.max(0, Math.floor(entry.price));
      } else if (typeof entry.price === 'string') {
        p = parseFormatted(entry.price);
      }
      out.push({ name: n, price: p });
    }
  }
  return out.length > 0 ? out : null;
}

/* No ?v= cache-buster. The SW's network-first strategy for this path
   plus the CACHE name bump on every deploy already provide freshness.
   A unique query string per call would also miss the precache offline,
   because caches.match() matches by full URL including the search. */
function loadPresetsFromServer() {
  return fetch('presets.json')
    .then(function(r) { if (!r.ok) throw new Error(); return r.json(); })
    .then(function(data) {
      var normalized = normalizePresets(data);
      if (normalized) PRESETS = normalized;
      return PRESETS;
    })
    .catch(function() { return PRESETS; });
}

/* ============ PANEL LOADER ============ */
var panel3DefaultHtml = '';
var panel3NoHtml = '';
var transitionBodyDefault = '';
var transitionBodyNoPresets =
  'それでは、本日は少し特別な癒しのオプションについて、ご相談させていただければと思います。<br><br>' +
  'もし、ほかにもご提供いただけるオプションがございましたら、下の空欄にご自由にご記入ください。ご希望の料金もあわせてお聞かせいただけますと幸いです。<br><br>' +
  'どうぞよろしくお願いいたします。';

function convertPanelText(raw) {
  if (!raw) return '';
  var text = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  text = text.replace(/^\s+|\s+$/g, '');
  if (text === '') return '';
  var paragraphs = text.split(/\n{2,}/);
  var out = [];
  for (var i = 0; i < paragraphs.length; i++) {
    var para = paragraphs[i].trim();
    if (para === '') continue;
    para = para.split('\n').map(function(line) { return line.trim(); }).join('<br>');
    out.push('<p>' + para + '</p>');
  }
  return out.join('');
}
/* Same reasoning as loadPresetsFromServer — no query string, so the
   precache URL matches offline. */
function loadPanelInto(anchorId, url) {
  return fetch(url)
    .then(function(r) { if (!r.ok) throw new Error(); return r.text(); })
    .then(function(text) {
      var anchor = document.getElementById(anchorId);
      if (anchor) anchor.innerHTML = convertPanelText(text);
    })
    .catch(function() { /* silent */ });
}
function loadPanelHtml(url) {
  return fetch(url)
    .then(function(r) { if (!r.ok) throw new Error(); return r.text(); })
    .then(function(text) { return convertPanelText(text); })
    .catch(function() { return ''; });
}
function loadAllPanels() {
  return Promise.all([
    loadPanelInto('panel1Body', 'panel-1.html'),
    loadPanelInto('panel2Body', 'panel-2.html'),
    loadPanelHtml('panel-3.html').then(function(html) { panel3DefaultHtml = html; }),
    loadPanelHtml('panel-3-no.html').then(function(html) { panel3NoHtml = html; }),
    loadPanelInto('panel4Body', 'panel-4.html')
  ]);
}

/* ============================================================
   ODOMETER ENGINE */
var NUM_COLS = 6;
var COMMA_AFTER = 2;
var SNAP_WINDOW_MS = 260;

function isColVisible(value, colIndex) {
  if (value === 0) return colIndex === NUM_COLS - 1;
  var placeValue = Math.pow(10, NUM_COLS - 1 - colIndex);
  return value >= placeValue;
}
function getDigitAt(value, colIndex) {
  var placeValue = Math.pow(10, NUM_COLS - 1 - colIndex);
  return Math.floor(value / placeValue) % 10;
}
function buildDigitColumns(container, initialValue) {
  if (!container) return;
  container.innerHTML = '';
  for (var i = 0; i < NUM_COLS; i++) {
    var col = document.createElement('span');
    col.className = 'digit-col hidden';
    col.setAttribute('data-digit', '0');
    var strip = document.createElement('span');
    strip.className = 'digit-strip';
    for (var d = 0; d <= 9; d++) {
      var de = document.createElement('span');
      de.className = 'digit';
      de.textContent = d;
      strip.appendChild(de);
    }
    strip.style.transform = 'translateY(0)';
    col.appendChild(strip);
    container.appendChild(col);
    if (i === COMMA_AFTER) {
      var comma = document.createElement('span');
      comma.className = 'digit-static hidden';
      comma.setAttribute('data-comma', '1');
      comma.textContent = ',';
      container.appendChild(comma);
    }
  }
  container.classList.add('no-transition');
  applyDigitValue(container, initialValue, { instant: true, stagger: 0 });
  void container.offsetWidth;
  container.classList.remove('no-transition');
}
function applyDigitValue(container, value, opts) {
  if (!container) return;
  opts = opts || {};
  var instant = !!opts.instant;
  var stagger = opts.stagger != null ? opts.stagger : 45;
  if (instant) container.classList.add('no-transition');
  var cols = container.querySelectorAll('.digit-col');
  var comma = container.querySelector('.digit-static[data-comma]');
  for (var i = 0; i < cols.length; i++) {
    var col = cols[i];
    var strip = col.querySelector('.digit-strip');
    var visible = isColVisible(value, i);
    var newDigit = getDigitAt(value, i);
    var oldDigit = parseInt(col.getAttribute('data-digit') || '0', 10);
    var fromRight = NUM_COLS - 1 - i;
    var delay = instant ? 0 : fromRight * stagger;
    if (instant) {
      strip.style.transitionDelay = '0ms';
      strip.style.transform = 'translateY(' + (-newDigit * 10) + '%)';
    } else if (newDigit !== oldDigit) {
      strip.style.transitionDelay = delay + 'ms';
      strip.style.transform = 'translateY(' + (-newDigit * 10) + '%)';
    }
    col.classList.toggle('hidden', !visible);
    col.setAttribute('data-digit', newDigit);
  }
  if (comma) comma.classList.toggle('hidden', value < 1000);
  if (instant) {
    void container.offsetWidth;
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        container.classList.remove('no-transition');
      });
    });
  }
}
var lastSummaryUpdate = 0;
function updateSummaryTotal(targetAmount) {
  var container = document.getElementById('summaryDigits');
  if (!container) return;
  var now = performance.now();
  var elapsed = now - lastSummaryUpdate;
  var shouldSnap = lastSummaryUpdate > 0 && elapsed < SNAP_WINDOW_MS;
  lastSummaryUpdate = now;
  applyDigitValue(container, targetAmount, { instant: shouldSnap, stagger: 45 });
}
function updateReceiptTotal() {
  var container = document.getElementById('receiptTotalNumber');
  if (!container) return;
  var sum = 0;
  var receiptPriceInputs = receiptItems.querySelectorAll('.receipt-price-input');
  for (var i = 0; i < receiptPriceInputs.length; i++) {
    var item = receiptPriceInputs[i].closest('.receipt-item');
    if (item && item.getAttribute('data-removing') === 'true') continue;
    sum += parseFormatted(receiptPriceInputs[i].value);
  }
  applyDigitValue(container, sum, { instant: false, stagger: 80 });
}

/* ============================================================
   COUNTER ODOMETER */
var COUNTER_COLS = 2;

function counterIsColVisible(value, colIndex) {
  if (value === 0) return colIndex === COUNTER_COLS - 1;
  var placeValue = Math.pow(10, COUNTER_COLS - 1 - colIndex);
  return value >= placeValue;
}
function counterGetDigitAt(value, colIndex) {
  var placeValue = Math.pow(10, COUNTER_COLS - 1 - colIndex);
  return Math.floor(value / placeValue) % 10;
}
function buildCounterColumns(container, initialValue) {
  if (!container) return;
  container.innerHTML = '';
  for (var i = 0; i < COUNTER_COLS; i++) {
    var col = document.createElement('span');
    col.className = 'digit-col hidden';
    col.setAttribute('data-digit', '0');
    var strip = document.createElement('span');
    strip.className = 'digit-strip';
    for (var d = 0; d <= 9; d++) {
      var de = document.createElement('span');
      de.className = 'digit';
      de.textContent = d;
      strip.appendChild(de);
    }
    strip.style.transform = 'translateY(0)';
    col.appendChild(strip);
    container.appendChild(col);
  }
  container.classList.add('no-transition');
  applyCounterValue(container, initialValue, { instant: true });
  void container.offsetWidth;
  container.classList.remove('no-transition');
}
function applyCounterValue(container, value, opts) {
  if (!container) return;
  opts = opts || {};
  var instant = !!opts.instant;
  if (instant) container.classList.add('no-transition');
  var cols = container.querySelectorAll('.digit-col');
  for (var i = 0; i < cols.length; i++) {
    var col = cols[i];
    var strip = col.querySelector('.digit-strip');
    var visible = counterIsColVisible(value, i);
    var newDigit = counterGetDigitAt(value, i);
    var oldDigit = parseInt(col.getAttribute('data-digit') || '0', 10);
    var delay = instant ? 0 : (COUNTER_COLS - 1 - i) * 40;
    if (instant) {
      strip.style.transitionDelay = '0ms';
      strip.style.transform = 'translateY(' + (-newDigit * 10) + '%)';
    } else if (newDigit !== oldDigit) {
      strip.style.transitionDelay = delay + 'ms';
      strip.style.transform = 'translateY(' + (-newDigit * 10) + '%)';
    }
    col.classList.toggle('hidden', !visible);
    col.setAttribute('data-digit', newDigit);
  }
  if (instant) {
    void container.offsetWidth;
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        container.classList.remove('no-transition');
      });
    });
  }
}

function updateReceiptItemCount() {
  var container = document.getElementById('itemCountDigits');
  if (!container) return;
  var activeItems = 0;
  var receiptItemEls = receiptItems.querySelectorAll('.receipt-item');
  for (var i = 0; i < receiptItemEls.length; i++) {
    if (receiptItemEls[i].getAttribute('data-removing') === 'true') continue;
    if (receiptItemEls[i].classList.contains('removing')) continue;
    activeItems++;
  }
  applyCounterValue(container, activeItems, { instant: false });
}

/* ============================================================
   RUNTIME DIGIT ADVANCE MEASUREMENT */
function measureDigitAdvance() {
  var titleEl = document.querySelector('.receipt-title');
  if (!titleEl) return null;
  var cs = window.getComputedStyle(titleEl);

  var probe = document.createElement('span');
  probe.textContent = '0000000000';
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  probe.style.pointerEvents = 'none';
  probe.style.whiteSpace = 'nowrap';
  probe.style.fontFamily = cs.fontFamily;
  probe.style.fontSize = cs.fontSize;
  probe.style.fontWeight = cs.fontWeight;
  probe.style.fontStyle = cs.fontStyle;
  probe.style.letterSpacing = cs.letterSpacing;
  probe.style.lineHeight = '1';
  document.body.appendChild(probe);

  var w = probe.getBoundingClientRect().width;
  document.body.removeChild(probe);

  if (!w || w <= 0) return null;
  return w / 10;
}

function applyCounterCellWidth() {
  var advance = measureDigitAdvance();
  if (!advance) return;
  var container = document.getElementById('itemCountDigits');
  if (!container) return;
  container.style.setProperty('--counter-cell-w', advance.toFixed(3) + 'px');
}

/* ============ DOM REFS ============
   Theme-owned refs (themeToggle, mapleLeaves, snowFlakes) live at
   the top of the file — see the THEME TOGGLE block. stageLattice stays here
   because it is consumed by applySwellToCSS() inside the swell
   loop, which is unrelated to theme ownership. */
var nameScreen = document.getElementById('nameScreen');
var nameInput = document.getElementById('nameInput');
var nameBtn = document.getElementById('nameBtn');
var nameScreenRows = document.getElementById('nameScreenRows');
var nameScreenTotalValue = document.getElementById('nameScreenTotalValue');
var track = document.getElementById('track');
var stage = document.getElementById('stage');
var dotsEl = document.getElementById('dots');
var dots = document.querySelectorAll('.dot');
var panels = document.querySelectorAll('.panel');
var divider = document.getElementById('divider');
var tableCard = document.getElementById('tableCard');
var summaryBar = document.getElementById('summaryBar');
var rejectRow = document.getElementById('rejectRow');
var rejectThanks = document.getElementById('rejectThanks');
var rejectGiftAmountEl = document.getElementById('rejectGiftAmount');
var rejectThanksLine = document.getElementById('rejectThanksLine');
var rejectThanksSub  = document.getElementById('rejectThanksSub');
var tipInput = document.getElementById('tipInput');
var tipMinus = document.getElementById('tipMinus');
var tipPlus = document.getElementById('tipPlus');
var petalOverlay = document.getElementById('petalOverlay');
var transitionLine = document.getElementById('transitionLine');
var globalHint = document.getElementById('globalHint');
var globalHintLayerSwipe = document.getElementById('globalHintLayerSwipe');
var globalHintLayerScroll = document.getElementById('globalHintLayerScroll');
var alertScreen = document.getElementById('alertScreen');
var alertList = document.getElementById('alertList');
var alertTitle = document.getElementById('alertTitle');
var alertSub = document.getElementById('alertSub');
var alertOk = document.getElementById('alertOk');
var numpad = document.getElementById('numpad');
var numpadBtns = numpad ? numpad.querySelectorAll('.numpad-btn') : [];

var tanzakuScreen = document.getElementById('tanzakuScreen');
var tanzakuInput = document.getElementById('tanzakuInput');
var tanzakuCancel = document.getElementById('tanzakuCancel');
var tanzakuConfirm = document.getElementById('tanzakuConfirm');
var tanzakuTargetRow = null;

/* The on-screen keyboard the tanzaku brings up changes the screen's height
   on this tablet, and every resize handler then runs: the scene rebuilds
   all its canvases and re-bakes its trees, the lanterns are rebuilt, and so
   on. Doing that while the tanzaku fades in or out dropped frames and left
   the table half drawn. So while the tanzaku is open, and for a moment
   after it closes, height-only resizes are held back here (this listener is
   added before all the others, so stopping it stops them). When the hold
   ends, one resize is sent if the size really changed. */
var keyboardResizeHold = null;     /* the size before the keyboard, while held */
var keyboardResizeTimer = null;
window.addEventListener('resize', function(e) {
  if (!keyboardResizeHold) return;
  if (window.innerWidth !== keyboardResizeHold.w) return;
  e.stopImmediatePropagation();
});
function holdKeyboardResizes() {
  if (keyboardResizeTimer) { clearTimeout(keyboardResizeTimer); keyboardResizeTimer = null; }
  if (!keyboardResizeHold) keyboardResizeHold = { w: window.innerWidth, h: window.innerHeight };
}
function releaseKeyboardResizes() {
  if (keyboardResizeTimer) clearTimeout(keyboardResizeTimer);
  /* the 0.5s fade-out plus time for the keyboard to finish going down */
  keyboardResizeTimer = setTimeout(function() {
    keyboardResizeTimer = null;
    var held = keyboardResizeHold;
    keyboardResizeHold = null;
    if (held && (window.innerWidth !== held.w || window.innerHeight !== held.h)) {
      window.dispatchEvent(new Event('resize'));
    }
  }, 1200);
}

var nameConfirmed = false;
var therapistDisplayName = '桜庭さん';
var tableUnlocked = false;
var tableVisited = false;
var currentPanel = 0;
var totalPanels = 6;
var rejected = false;
var confirmedTipAmount = 1500;
var firstServiceInReceipt = false;
var stageWidth = window.innerWidth;
var refWidth = Math.min(window.innerWidth, 600);
var rejectScrollTimer = null;

var currentTemp = null;
var currentWeatherBucket = 'clear';
var greetingFinalized = false;

var startBtn = document.getElementById('startBtn');
var blossomScreen = document.getElementById('blossomScreen');
var introOverlay = document.getElementById('introOverlay');
/* When the name's characters have all arrived, and when they start to leave:
   in between the name is still, and the background does its heavy setup
   then (see dynPrelude). */
var nameLandsAt = 0, nameLeavesAt = 0;
var nameColumn = document.getElementById('nameColumn');
var introHasRun = false;

var blossomGreetingTimeEl = document.getElementById('blossomGreetingTime');
var blossomGreetingNameEl = document.getElementById('blossomGreetingName');

var koiDiveWrap = document.getElementById('koiDiveWrap');
var rippleLayer = document.getElementById('rippleLayer');

var stageLattice = document.getElementById('stageLattice');
var lanternBloom = document.getElementById('lanternBloom');
var lanternLit = document.getElementById('lanternLit');
var mistLitStage = document.getElementById('mistLitStage');

var submitBtn = document.getElementById('submitBtn');
var confirmScreen = document.getElementById('confirmScreen');
var confirmYes = document.getElementById('confirmYes');
var confirmNo = document.getElementById('confirmNo');
var receiptScreen = document.getElementById('receiptScreen');
var receiptItems = document.getElementById('receiptItems');
var receiptConfirmBtn = document.getElementById('receiptConfirmBtn');
var receiptBackBtn = document.getElementById('receiptBackBtn');
var receiptStampEl = document.getElementById('receiptStamp');

var thankyouScreen = document.getElementById('thankyouScreen');

var infoBar = document.getElementById('infoBar');

/* ============ 七十二候 (TOOLBAR, LEFT) ============
   Today's micro-season. The year is split by the sun's ecliptic longitude
   into 24 節気 of 15°, each into three 候 of 5°; the list starts at 立春
   (315°). The longitude comes from the same low-precision formula as the
   sun in the background (good to well under an hour at a boundary). The
   dates shown are the Japanese (JST) days the 候 starts and ends on.
   Updated on load and every 10 minutes. */
var SEKKI_NAMES = ['立春', '雨水', '啓蟄', '春分', '清明', '穀雨', '立夏', '小満', '芒種', '夏至', '小暑', '大暑',
                   '立秋', '処暑', '白露', '秋分', '寒露', '霜降', '立冬', '小雪', '大雪', '冬至', '小寒', '大寒'];
var KO_PART = ['初候', '次候', '末候'];
var KO_LIST = [
  ['東風解凍', 'はるかぜこおりをとく'], ['黄鶯睍睆', 'うぐいすなく'], ['魚上氷', 'うおこおりをいずる'],
  ['土脉潤起', 'つちのしょううるおいおこる'], ['霞始靆', 'かすみはじめてたなびく'], ['草木萌動', 'そうもくめばえいずる'],
  ['蟄虫啓戸', 'すごもりむしとをひらく'], ['桃始笑', 'ももはじめてさく'], ['菜虫化蝶', 'なむしちょうとなる'],
  ['雀始巣', 'すずめはじめてすくう'], ['櫻始開', 'さくらはじめてさく'], ['雷乃発声', 'かみなりすなわちこえをはっす'],
  ['玄鳥至', 'つばめきたる'], ['鴻雁北', 'こうがんかえる'], ['虹始見', 'にじはじめてあらわる'],
  ['葭始生', 'あしはじめてしょうず'], ['霜止出苗', 'しもやんでなえいずる'], ['牡丹華', 'ぼたんはなさく'],
  ['蛙始鳴', 'かわずはじめてなく'], ['蚯蚓出', 'みみずいずる'], ['竹笋生', 'たけのこしょうず'],
  ['蚕起食桑', 'かいこおきてくわをはむ'], ['紅花栄', 'べにばなさかう'], ['麦秋至', 'むぎのときいたる'],
  ['蟷螂生', 'かまきりしょうず'], ['腐草為螢', 'くされたるくさほたるとなる'], ['梅子黄', 'うめのみきばむ'],
  ['乃東枯', 'なつかれくさかるる'], ['菖蒲華', 'あやめはなさく'], ['半夏生', 'はんげしょうず'],
  ['温風至', 'あつかぜいたる'], ['蓮始開', 'はすはじめてひらく'], ['鷹乃学習', 'たかすなわちわざをならう'],
  ['桐始結花', 'きりはじめてはなをむすぶ'], ['土潤溽暑', 'つちうるおうてむしあつし'], ['大雨時行', 'たいうときどきふる'],
  ['涼風至', 'すずかぜいたる'], ['寒蝉鳴', 'ひぐらしなく'], ['蒙霧升降', 'ふかききりまとう'],
  ['綿柎開', 'わたのはなしべひらく'], ['天地始粛', 'てんちはじめてさむし'], ['禾乃登', 'こくものすなわちみのる'],
  ['草露白', 'くさのつゆしろし'], ['鶺鴒鳴', 'せきれいなく'], ['玄鳥去', 'つばめさる'],
  ['雷乃収声', 'かみなりすなわちこえをおさむ'], ['蟄虫坏戸', 'むしかくれてとをふさぐ'], ['水始涸', 'みずはじめてかるる'],
  ['鴻雁来', 'こうがんきたる'], ['菊花開', 'きくのはなひらく'], ['蟋蟀在戸', 'きりぎりすとにあり'],
  ['霜始降', 'しもはじめてふる'], ['霎時施', 'こさめときどきふる'], ['楓蔦黄', 'もみじつたきばむ'],
  ['山茶始開', 'つばきはじめてひらく'], ['地始凍', 'ちはじめてこおる'], ['金盞香', 'きんせんかさく'],
  ['虹蔵不見', 'にじかくれてみえず'], ['朔風払葉', 'きたかぜこのはをはらう'], ['橘始黄', 'たちばなはじめてきばむ'],
  ['閉塞成冬', 'そらさむくふゆとなる'], ['熊蟄穴', 'くまあなにこもる'], ['鱖魚群', 'さけのうおむらがる'],
  ['乃東生', 'なつかれくさしょうず'], ['麋角解', 'さわしかのつのおつる'], ['雪下出麦', 'ゆきわたりてむぎのびる'],
  ['芹乃栄', 'せりすなわちさかう'], ['水泉動', 'しみずあたたかをふくむ'], ['雉始雊', 'きじはじめてなく'],
  ['款冬華', 'ふきのはなさく'], ['水沢腹堅', 'さわみずこおりつめる'], ['鶏始乳', 'にわとりはじめてとやにつく']
];
function sunLongitudeAt(ms) {
  var d = ms / 86400000 + 2440587.5 - 2451545.0;
  var g = (357.528 + 0.9856003 * d) * Math.PI / 180;
  var lam = 280.460 + 0.9856474 * d + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g);
  return ((lam % 360) + 360) % 360;
}
function koIndexAt(ms) {
  return Math.floor((((sunLongitudeAt(ms) - 315) % 360 + 360) % 360) / 5) % 72;
}
function jstMonthDay(ms) {
  var j = new Date(ms + 9 * 3600000);                  // JST has no daylight saving
  return [j.getUTCMonth() + 1, j.getUTCDate()];
}
function updateSeasonKo() {
  var nameEl = document.getElementById('koName');
  var yomiEl = document.getElementById('koYomi');
  var subEl = document.getElementById('koSub');
  if (!nameEl || !yomiEl || !subEl) return;
  var now = Date.now(), H = 3600000, k = koIndexAt(now);
  var start = now, end = now, i;
  for (i = 0; i < 24 * 8 && koIndexAt(start - H) === k; i++) start -= H;
  for (i = 0; i < 24 * 8 && koIndexAt(end + H) === k; i++) end += H;
  /* the last day is the day before the next 候 starts */
  var a = jstMonthDay(start), b = jstMonthDay(end + H - 86400000);
  var dates = a[0] + '月' + a[1] + '日〜' + (b[0] === a[0] ? '' : b[0] + '月') + b[1] + '日';
  nameEl.textContent = KO_LIST[k][0];
  yomiEl.textContent = KO_LIST[k][1];
  subEl.textContent = SEKKI_NAMES[Math.floor(k / 3)] + ' · ' + KO_PART[k % 3] + ' · ' + dates;
}
updateSeasonKo();
setInterval(updateSeasonKo, 600000);

/* ============ 風鈴 (TOOLBAR, LEFT — AUTUMN AND WINTER) ============
   In the autumn and winter themes an iron wind chime takes the 七十二候's
   place (the sakura theme keeps the 七十二候; main.css shows one or the
   other). It hangs on a cord from the top of the screen: the bell on the
   glass, the clapper inside it, and below the glass's edge the paper
   strip (短冊) that catches the wind, with 秋の風 and a momiji leaf in
   autumn, 冬の便り and small white flowers in winter. Beside it two lines
   in the music display's type: 風鈴にそっとふれると、音が鳴ります, and
   名古屋の風 · <the live wind>.
   Three linked swings (bell, clapper, strip) plus the strip turning on its
   cord. The wind on the strip is the live Nagoya wind (a steady lean and a
   restless flutter; handed over by fetchNagoyaWeather) plus the scene's
   gusts as they sweep past (DynBG.furinGust). It rings when the clapper
   really hits the bell: from the wind only when it hits hard enough, from
   a tap every time. The ring is made here (makeSynth), no sound file.
   Every value was tuned on winter.html. Angles are from straight down;
   positive swings to the right. Runs on its own frames, only while the
   toolbar is showing in autumn or winter. */
var Furin = (function () {
'use strict';
var FC = {
  volume: 0.8, pitch: 2890, ringLength: 2.6, shimmer: 1.45, brightness: 0.74, strike: 0.64, pitchVary: 76,
  clapperGap: 0.2, ringThreshold: 1.85, windRingGap: 0,
  windPush: 1, gustPush: 2.55, flutter: 1, touchPush: 1,
  bellSwing: 1, clapperSwing: 1, stripSwing: 1, twirl: 1, swingSpeed: 1, settle: 1,
  x: 45, size: 0.99, cordLen: 19, bellW: 32, bellH: 30, stripCord: 22, stripW: 23, stripH: 58,
  rimLight: 0.55, pattern: 0.45, flowers: 7, stripes: 0.5, shadow: 0.35,
  inkSize: 10.5, leafSize: 1,
  colours: {
    bell: '#1C2742', cord: '#B4693C', string: '#2E3548',
    paper: '#F6D8C1', paperBack: '#E9C3A9', flower: '#FFFFFF',
    ink: '#4A2A26', momiji: '#C8361F'
  }
};
var PI = Math.PI, TAU = PI * 2;
function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
function lerp(a, b, t) { return a + (b - a) * t; }
function rnd(a, b) { return a + Math.random() * (b - a); }
function rngFrom(seed) {
  var a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    var t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash1(i) { var s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
function noise1(x) {                          // smooth 1-D value noise, 0..1
  var i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return lerp(hash1(i), hash1(i + 1), u);
}
function hex(h) { var n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function mix(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }
function rgb(c, a) {
  return 'rgba(' + Math.round(clamp(c[0], 0, 255)) + ',' + Math.round(clamp(c[1], 0, 255)) + ',' +
         Math.round(clamp(c[2], 0, 255)) + ',' + (a === undefined ? 1 : clamp(a, 0, 1).toFixed(3)) + ')';
}
function ellipse(c, x, y, rx, ry) { c.moveTo(x + rx, y); c.ellipse(x, y, rx, ry, 0, 0, TAU); }

var fcv = document.getElementById('furinCanvas'), fhit = document.getElementById('furinHit');
if (!fcv || !fhit) return { onWeather: function () {} };
var fctx = fcv.getContext('2d');
var FG = {};                                   // geometry in CSS px (set by layoutFurin)
var FS = { b: 0, bv: 0, z: 0, zv: 0, s: 0, sv: 0, p: 0, pv: 0 };
var furinT = 0, tapUntil = -1, lastRing = -9, lastWindRing = -9, furinFlowers = [];
var liveWind = null;                           // { ms, dir } from fetchNagoyaWeather()

function layoutFurin() {
  var S = FC.size;
  FG.L0 = FC.cordLen * S; FG.bw = FC.bellW * S; FG.bh = FC.bellH * S;
  FG.lc = FC.stripCord * S; FG.sw = FC.stripW * S; FG.sh = FC.stripH * S;
  FG.piv = FG.L0 + FG.bh * 0.16;               // where the clapper hangs, inside the bell's top
  FG.lz = FG.bh * 0.8;                          // to the clapper, which sits just inside the rim
  FG.rc = Math.max(2, FG.bw * 0.13);            // the clapper's half-width
  var tot = FG.piv + FG.lz + FG.lc + FG.sh;
  FG.cw = Math.ceil(2 * (tot * 0.62 + FG.bw));
  FG.ch = Math.ceil(tot + 30 * S);
  var pr = window.devicePixelRatio || 1;
  FG.pr = pr;
  fcv.width = Math.round(FG.cw * pr); fcv.height = Math.round(FG.ch * pr);
  fcv.style.width = FG.cw + 'px'; fcv.style.height = FG.ch + 'px';
  fcv.style.left = (FC.x - FG.cw / 2) + 'px';
  FG.hw = Math.max(FG.bw, FG.sw) + 18 * S;
  fhit.style.width = FG.hw + 'px'; fhit.style.height = (tot + 8 * S) + 'px';
  // the flowers on the strip, the same every time
  var r = rngFrom(41);
  furinFlowers = [];
  for (var i = 0; i < FC.flowers; i++) {
    furinFlowers.push({ u: (i % 2 ? 0.36 : -0.36) + lerp(-0.03, 0.03, r()), v: lerp(0.2, 0.92, (i + 0.3 + 0.4 * r()) / Math.max(1, FC.flowers)),
                        k: lerp(0.65, 0.95, r()), a: r() * TAU });
  }
}

/* ---- the wind ---- */
function windMs() { return liveWind ? liveWind.ms : 2.5; }   // a light breeze until the first reading
function windSide() {                         // -1..1: how much of it blows across the screen, and which way
  return liveWind ? -Math.sin(liveWind.dir * PI / 180) : 1;   // from the west (270°) blows to the right
}
function windWord(m) {
  if (m < 0.3) return '無風';
  if (m < 1.6) return '微風';
  if (m < 3.4) return 'そよ風';
  if (m < 5.5) return '心地よい風';
  if (m < 8) return 'やや強い風';
  return '強い風';
}
/* 名古屋の風 alone until the first reading; then · そよ風 2.5m/s */
var furinWindEl = document.getElementById('furinWind');
function updateWindLine() {
  if (!furinWindEl) return;
  var sep = furinWindEl.previousElementSibling;
  if (sep) sep.style.display = liveWind ? '' : 'none';
  furinWindEl.textContent = liveWind ? windWord(liveWind.ms) + ' ' + liveWind.ms.toFixed(1) + 'm/s' : '';
}
function onWeather(c) {
  if (!c || typeof c.wind_speed_10m !== 'number') return;
  liveWind = { ms: c.wind_speed_10m, dir: typeof c.wind_direction_10m === 'number' ? c.wind_direction_10m : 270 };
  updateWindLine();
}

/* ---- the swings ---- */
function furinStep(t, h, gustLean) {
  var m = windMs(), side = windSide();
  var lean = side * FC.windPush * 0.24 * (1 - Math.exp(-m / 4));
  var fl = FC.flutter * (0.04 + 0.035 * m) * ((noise1(t * 1.3) + 0.6 * noise1(t * 3.1 + 7) - 0.8) * 1.6);
  var Fw = lean + fl + gustLean;
  var sp = FC.swingSpeed, se = FC.settle;
  var ws = TAU / 0.95 * sp, wz = TAU / 1.15 * sp, wb = TAU / 1.7 * sp, wp = TAU / 2.6 * sp;
  var X = FS;
  var pull = X.s - X.z - Fw * FC.stripSwing;  // the strip pulls on the clapper's cord
  var as = -ws * ws * pull - 2 * 0.12 * se * ws * (X.sv - X.zv);
  var az = -wz * wz * (X.z - X.b - Fw * 0.3 * FC.clapperSwing) - 2 * 0.08 * se * wz * (X.zv - X.bv) + 0.5 * wz * wz * pull * FC.clapperSwing;
  var ab = -wb * wb * (X.b - Fw * 0.06 * FC.bellSwing) - 2 * 0.18 * se * wb * X.bv + 0.08 * wz * wz * (X.z - X.b) * FC.bellSwing;
  var tq = FC.twirl * 0.5 * ((noise1(t * 0.9 + 31) - 0.5) * 2 * (0.6 + m * 0.5 + Math.abs(gustLean) * 8) + (X.sv - X.zv) * 0.8);
  var ap = wp * wp * (tq - X.p) - 2 * 0.06 * se * wp * X.pv;
  X.sv += as * h; X.zv += az * h; X.bv += ab * h; X.pv += ap * h;
  X.s += X.sv * h; X.z += X.zv * h; X.b += X.bv * h; X.p += X.pv * h;
  // the clapper hits the inside of the bell
  var rel = X.z - X.b;
  if (Math.abs(rel) > FC.clapperGap) {
    var sg = rel > 0 ? 1 : -1, rv = X.zv - X.bv;
    X.z = X.b + sg * FC.clapperGap;
    if (rv * sg > 0) {
      X.zv = X.bv - rv * 0.4;
      X.bv += rv * 0.12 * FC.bellSwing;
      furinHit(Math.abs(rv), t);
    }
  }
}
function furinHit(speed, t) {
  if (t - lastRing < 0.12) return;
  var tap = t < tapUntil;
  if (tap ? speed < 0.3 : (speed < FC.ringThreshold * 0.3 || t - lastWindRing < FC.windRingGap)) return;
  lastRing = t;
  if (!tap) lastWindRing = t;
  playRing(clamp(speed / 2, 0.25, 1));     // the wind rings it softly, a tap clearly
}
function updateFurin(t, dt) {
  furinT = t;
  var gl = FC.gustPush * (DynBG ? DynBG.furinGust(FC.x) : 0) * 0.35;
  var n = 4, h = dt / n;
  for (var i = 0; i < n; i++) furinStep(t + i * h, h, gl);
}
function tapFurin(dir) {
  var k = FC.touchPush;
  FS.zv += dir * 3.2 * k; FS.sv += dir * 3.8 * k; FS.bv += dir * 0.5 * k; FS.pv += rnd(-3, 3) * k;
  tapUntil = furinT + 0.8;
}

/* ---- touch: the hit area follows the chime; a tap swings it away from
   the finger, a flick pushes it along ---- */
var fptr = null;
fhit.addEventListener('pointerdown', function (e) {
  /* initSound() runs from the document's first pointerdown, after this */
  if (soundAudioCtx && soundAudioCtx.state === 'suspended') { try { soundAudioCtx.resume(); } catch (er) {} }
  var r = fhit.getBoundingClientRect();
  var dir = e.clientX < r.left + r.width / 2 ? 1 : -1;
  tapFurin(dir);
  fptr = { id: e.pointerId, x: e.clientX };
  try { fhit.setPointerCapture(e.pointerId); } catch (er) {}
  e.preventDefault();
});
fhit.addEventListener('pointermove', function (e) {
  if (!fptr || e.pointerId !== fptr.id) return;
  var dx = e.clientX - fptr.x; fptr.x = e.clientX;
  var k = FC.touchPush;
  FS.sv += dx * 0.03 * k; FS.zv += dx * 0.02 * k; FS.pv += dx * 0.02 * k;
  tapUntil = furinT + 0.8;
});
function fptrEnd() { fptr = null; }
fhit.addEventListener('pointerup', fptrEnd);
fhit.addEventListener('pointercancel', fptrEnd);

/* ---- drawing ---- */
/* The words run down the strip in Yuji Syuku, the brush face the app uses
   for the therapist's name. Autumn adds a momiji leaf under 秋の風. */
document.fonts && document.fonts.load('12px "Yuji Syuku"');
function momiji(c, x, y, r, col, rot) {
  c.save(); c.translate(x, y); c.rotate(rot);
  var tips = [1, 0.92, 0.7, 0.7, 0.92];
  c.fillStyle = rgb(col); c.strokeStyle = rgb(col); c.lineJoin = 'round'; c.lineWidth = r * 0.12;
  c.beginPath();
  for (var k = 0; k < 5; k++) {
    var a = -PI / 2 + k * TAU / 5, v = a + TAU / 10, a2 = a + TAU / 5;
    c.lineTo(Math.cos(a) * r * tips[k], Math.sin(a) * r * tips[k]);
    c.lineTo(Math.cos(a + TAU / 20) * r * 0.62, Math.sin(a + TAU / 20) * r * 0.62);   // a small point on the way down
    c.lineTo(Math.cos(v) * r * 0.34, Math.sin(v) * r * 0.34);
    c.lineTo(Math.cos(a2 - TAU / 20) * r * 0.62, Math.sin(a2 - TAU / 20) * r * 0.62);
  }
  c.closePath(); c.fill(); c.stroke();
  c.strokeStyle = rgb(mix(col, [255, 255, 255], 0.35), 0.6); c.lineWidth = r * 0.07;
  c.beginPath();
  for (var q = 0; q < 5; q++) { var aa = -PI / 2 + q * TAU / 5; c.moveTo(0, 0); c.lineTo(Math.cos(aa) * r * tips[q] * 0.72, Math.sin(aa) * r * tips[q] * 0.72); }
  c.stroke();
  c.strokeStyle = rgb(col); c.lineWidth = r * 0.12;
  c.beginPath(); c.moveTo(0, r * 0.2); c.lineTo(0, r * 1.2); c.stroke();
  c.restore();
}
function drawStripWords(c, text, L, S, autumn) {
  var n = text.length, y0 = 11.5 * S, tail = autumn ? 14 * S * FC.leafSize + 3 * S : 3 * S;
  var px = Math.min(FC.inkSize * S, (L - y0 - tail) / (n * 1.06));
  if (px < 4) return;
  c.save();
  c.font = px.toFixed(2) + 'px "Yuji Syuku", "Hiragino Mincho ProN", "Yu Mincho", "Noto Serif JP", serif';
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillStyle = FC.colours.ink;
  for (var i = 0; i < n; i++) c.fillText(text.charAt(i), 0, y0 + (i + 0.5) * px * 1.06);
  c.restore();
  if (autumn) momiji(c, 0, y0 + n * px * 1.06 + 2 * S + 4.2 * S * FC.leafSize, 4.2 * S * FC.leafSize, hex(FC.colours.momiji), 0.25);
}
function shade(c, k) { return [c[0] * k, c[1] * k, c[2] * k]; }
function drawFurin() {
  var c = fctx, S = FC.size, X = FS;
  var bell = hex(FC.colours.bell), cord = hex(FC.colours.cord), str = hex(FC.colours.string);
  c.setTransform(FG.pr, 0, 0, FG.pr, 0, 0);
  c.clearRect(0, 0, FG.cw, FG.ch);
  c.translate(FG.cw / 2, 0);
  var sh = FC.shadow;
  function shadowOn() { c.shadowColor = 'rgba(40,24,34,' + (0.5 * sh).toFixed(3) + ')'; c.shadowBlur = 7 * S; c.shadowOffsetY = 3 * S; c.shadowOffsetX = 1.5 * S; }
  function shadowOff() { c.shadowColor = 'rgba(0,0,0,0)'; c.shadowBlur = 0; c.shadowOffsetX = c.shadowOffsetY = 0; }

  // where things are: the clapper hangs inside the bell, the strip from the clapper
  var px = Math.sin(X.b) * FG.piv, py = Math.cos(X.b) * FG.piv;
  var bx = px + Math.sin(X.z) * FG.lz, by = py + Math.cos(X.z) * FG.lz;
  var cx0 = bx + Math.sin(X.z) * 2.5 * S, cy0 = by + Math.cos(X.z) * 2.5 * S;
  var sx0 = cx0 + Math.sin(X.s) * FG.lc, sy0 = cy0 + Math.cos(X.s) * FG.lc;

  // the cord down to the strip, bowing a little as it swings
  var bow = clamp((X.sv - X.zv) * 2 * S, -6 * S, 6 * S);
  c.strokeStyle = rgb(cord); c.lineWidth = 1.3 * S; c.lineCap = 'round';
  c.beginPath(); c.moveTo(cx0, cy0);
  c.quadraticCurveTo((cx0 + sx0) / 2 - bow * Math.cos(X.s), (cy0 + sy0) / 2 + bow * Math.sin(X.s), sx0, sy0);
  c.stroke();

  // the paper strip, turning on its cord
  c.save();
  c.translate(sx0, sy0); c.rotate(-X.s);
  var cp = Math.cos(X.p), ac = Math.max(0.04, Math.abs(cp)), front = cp >= 0;
  var hw = FG.sw / 2, L = FG.sh;
  c.save();
  c.scale(ac, 1);
  shadowOn();
  c.fillStyle = FC.colours[front ? 'paper' : 'paperBack'];
  c.beginPath(); c.rect(-hw, 0, hw * 2, L); c.fill();
  shadowOff();
  // the fine lines in the paper
  if (FC.stripes > 0) {
    c.strokeStyle = 'rgba(255,255,255,' + (0.35 * FC.stripes).toFixed(3) + ')';
    c.lineWidth = 0.6 * S;
    c.beginPath();
    for (var lx = -hw + 1.6 * S; lx < hw; lx += 2.2 * S) { c.moveTo(lx, 0.5); c.lineTo(lx, L - 0.5); }
    c.stroke();
  }
  // the wording, brushed down the middle (the back of the strip is blank)
  var autumn = currentTheme === 'autumn';
  if (front) drawStripWords(c, autumn ? '秋の風' : '冬の便り', L, S, autumn);
  // small white flowers down the two sides (winter)
  if (front && !autumn) {
    var fl = hex(FC.colours.flower);
    for (var i = 0; i < furinFlowers.length; i++) {
      var F = furinFlowers[i], fx = F.u * hw * 2, fy = F.v * L, fr = 1.15 * S * F.k;
      c.fillStyle = rgb(fl, 0.85);
      c.beginPath();
      for (var q = 0; q < 5; q++) { var a = F.a + q * TAU / 5; ellipse(c, fx + Math.cos(a) * fr, fy + Math.sin(a) * fr, fr * 0.78, fr * 0.78); }
      c.fill();
      c.fillStyle = rgb(mix(fl, hex(FC.colours.paper), 0.45), 0.9);
      c.beginPath(); ellipse(c, fx, fy, fr * 0.42, fr * 0.42); c.fill();
    }
  }
  // turned edge-on, the strip reads darker
  c.fillStyle = 'rgba(80,44,30,' + ((1 - ac) * 0.28 + (front ? 0 : 0.06)).toFixed(3) + ')';
  c.fillRect(-hw, 0, hw * 2, L);
  // the hole the cord is tied through
  c.fillStyle = 'rgba(120,70,50,0.35)';
  c.beginPath(); ellipse(c, 0, 5 * S, 1.7 * S, 1.7 * S); c.fill();
  c.restore();
  // the knot
  c.strokeStyle = rgb(cord); c.lineWidth = 1.2 * S;
  c.beginPath(); c.moveTo(0, -1 * S); c.lineTo(0, 4 * S); c.stroke();
  c.fillStyle = rgb(shade(cord, 0.85));
  c.beginPath(); ellipse(c, 0, -0.5 * S, 1.5 * S, 1.2 * S); c.fill();
  c.restore();

  // the clapper (its lower edge just shows under the rim)
  c.save();
  c.translate(bx, by); c.rotate(-X.z);
  c.fillStyle = rgb(shade(bell, 0.75));
  c.beginPath(); c.rect(-FG.rc, -3 * S, FG.rc * 2, 5.5 * S); c.fill();
  c.restore();

  // the cord from the top of the screen, and the bell
  c.save();
  c.rotate(-X.b);
  var w = FG.bw / 2, yT = FG.L0, yB = FG.L0 + FG.bh, bh = FG.bh, ry = Math.max(2, 3.2 * S);
  c.strokeStyle = rgb(str); c.lineWidth = 1.2 * S;
  c.beginPath(); c.moveTo(0, -4); c.lineTo(0, yT - 2 * S); c.stroke();
  c.fillStyle = rgb(shade(bell, 0.8));
  c.beginPath(); c.rect(-2.4 * S, yT - 3.6 * S, 4.8 * S, 4.2 * S); c.fill();
  function bellPath() {
    c.beginPath();
    c.moveTo(-w * 1.02, yB);
    c.bezierCurveTo(-w * 0.98, yB - bh * 0.35, -w * 0.95, yT + bh * 0.02, 0, yT);
    c.bezierCurveTo(w * 0.95, yT + bh * 0.02, w * 0.98, yB - bh * 0.35, w * 1.02, yB);
    c.ellipse(0, yB, w * 1.02, ry, 0, 0, PI);
    c.closePath();
  }
  shadowOn();
  c.fillStyle = rgb(bell);
  bellPath(); c.fill();
  shadowOff();
  c.save();
  bellPath(); c.clip();
  var lit = mix(bell, [205, 214, 238], 0.38 * FC.rimLight);
  var g = c.createLinearGradient(-w, 0, w, 0);
  g.addColorStop(0, rgb(shade(bell, 0.62)));
  g.addColorStop(0.3, rgb(lit));
  g.addColorStop(0.58, rgb(bell));
  g.addColorStop(1, rgb(shade(bell, 0.5)));
  c.fillStyle = g; c.fillRect(-w * 1.1, yT - 1, w * 2.2, bh + ry + 2);
  var sp = c.createRadialGradient(-w * 0.32, yT + bh * 0.24, 0, -w * 0.32, yT + bh * 0.24, w * 0.62);
  sp.addColorStop(0, 'rgba(255,255,255,' + (0.3 * FC.rimLight).toFixed(3) + ')');
  sp.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = sp; c.fillRect(-w * 1.1, yT - 1, w * 2.2, bh + ry + 2);
  // the pattern pressed into the iron: a leaf on a curling stem, and a few
  // dots, catching the light
  if (FC.pattern > 0) {
    var pc = 'rgba(190,200,230,';
    c.strokeStyle = pc + (0.3 * FC.pattern).toFixed(3) + ')';
    c.lineWidth = 0.7 * S;
    c.beginPath();
    c.moveTo(-w * 0.62, yB - bh * 0.12); c.bezierCurveTo(-w * 0.5, yB - bh * 0.42, -w * 0.2, yB - bh * 0.5, -w * 0.05, yB - bh * 0.62);
    c.stroke();
    c.fillStyle = pc + (0.18 * FC.pattern).toFixed(3) + ')';
    c.beginPath();
    c.moveTo(-w * 0.05, yB - bh * 0.62);
    c.quadraticCurveTo(w * 0.05, yT + bh * 0.12, w * 0.42, yT + bh * 0.2);
    c.quadraticCurveTo(w * 0.22, yB - bh * 0.5, -w * 0.05, yB - bh * 0.62);
    c.fill(); c.stroke();
    c.fillStyle = pc + (0.25 * FC.pattern).toFixed(3) + ')';
    c.beginPath();
    ellipse(c, w * 0.5, yB - bh * 0.3, 0.8 * S, 0.8 * S); ellipse(c, w * 0.62, yB - bh * 0.18, 0.6 * S, 0.6 * S);
    ellipse(c, -w * 0.72, yT + bh * 0.45, 0.7 * S, 0.7 * S);
    c.fill();
  }
  c.restore();
  // the mouth: the dark inside, and the lip catching the light
  c.fillStyle = rgb(shade(bell, 0.38));
  c.beginPath(); ellipse(c, 0, yB, w * 1.0, ry * 0.8); c.fill();
  c.strokeStyle = 'rgba(220,228,248,' + (0.12 + 0.3 * FC.rimLight).toFixed(3) + ')';
  c.lineWidth = 1 * S;
  c.beginPath(); c.ellipse(0, yB, w * 1.01, ry, 0, 0.15, PI - 0.15); c.stroke();
  c.restore();

  // the touch area follows the chime
  fhit.style.transform = 'translate(' + (FC.x - FG.hw / 2) + 'px,0) rotate(' + (-(X.b + X.s) / 2) + 'rad)';
}

/* ---- sound: a ring made here, straight to the speakers at the volume
   approved on winter.html (not through the music's master gain, so the
   music display's wave does not take it for music) ---- */
var synthBuf = null, voices = [];
/* An iron 風鈴: a clear high note with a few inharmonic overtones that
   die away faster, a second note a hair apart (the slow beat, ゆらぎ),
   and a short tick where the clapper hits. */
function makeSynth() {
  if (synthBuf) return synthBuf;
  var sr = soundAudioCtx.sampleRate, dur = Math.min(10, FC.ringLength * 1.6 + 0.2), N = Math.round(sr * dur);
  var buf = soundAudioCtx.createBuffer(1, N, sr), d = buf.getChannelData(0);
  var f0 = FC.pitch, tau = FC.ringLength / 6.9, br = FC.brightness * 2;
  var parts = [[1, 1, 1], [1 + 0.0035 * FC.shimmer, 0.55 * Math.min(1, FC.shimmer), 0.95],
               [2.76, 0.42 * br, 0.45], [5.40, 0.22 * br, 0.26], [8.93, 0.1 * br, 0.15]];
  var peak = 0, prev = 0, i, j;
  for (i = 0; i < N; i++) {
    var t = i / sr, v = 0, att = Math.min(1, t / 0.0015);
    for (j = 0; j < parts.length; j++) {
      var P = parts[j];
      if (!P[1] || f0 * P[0] > sr / 2.2) continue;
      v += P[1] * Math.exp(-t / (tau * P[2])) * Math.sin(TAU * f0 * P[0] * t + j);
    }
    v *= att;
    if (t < 0.02 && FC.strike > 0) {
      var nz = Math.random() * 2 - 1;
      v += (nz - prev) * 0.6 * FC.strike * Math.exp(-t / 0.0018);
      prev = nz;
    }
    d[i] = v;
    if (Math.abs(v) > peak) peak = Math.abs(v);
  }
  var k = peak > 0 ? 0.9 / peak : 1;
  for (i = 0; i < N; i++) d[i] *= k;
  synthBuf = buf;
  return buf;
}
function playRing(strength) {
  if (!SOUND_ENABLED || !soundAudioCtx || soundAudioCtx.state !== 'running') return;
  var buf = makeSynth();
  var now = soundAudioCtx.currentTime;
  var src = soundAudioCtx.createBufferSource(); src.buffer = buf;
  src.playbackRate.value = Math.pow(2, rnd(-1, 1) * FC.pitchVary / 1200);
  var g = soundAudioCtx.createGain(); g.gain.value = FC.volume * strength;
  src.connect(g); g.connect(soundAudioCtx.destination);
  src.start(now);
  var vo = { src: src, g: g };
  voices.push(vo);
  src.onended = function () { var i = voices.indexOf(vo); if (i >= 0) voices.splice(i, 1); };
  if (voices.length > 6) {                     // too many still ringing: fade the oldest
    var old = voices.shift();
    try { old.g.gain.setTargetAtTime(0, now, 0.05); old.src.stop(now + 0.3); } catch (e) {}
  }
}

/* ============================================================

/* ---- frames: only while the toolbar shows the chime ---- */
function showing() {
  return (currentTheme === 'autumn' || currentTheme === 'winter') && !document.hidden &&
         infoBar && infoBar.classList.contains('shown') && !infoBar.classList.contains('hidden') &&
         document.body.classList.contains('info-visible');
}
var lastMs = 0;
function loop(ms) {
  if (!showing()) {
    lastMs = 0;
    setTimeout(function () { requestAnimationFrame(loop); }, 300);
    return;
  }
  var dt = lastMs ? Math.min(0.05, (ms - lastMs) / 1000) : 0.016;
  lastMs = ms;
  updateFurin(ms / 1000, dt);
  drawFurin();
  requestAnimationFrame(loop);
}
layoutFurin();
updateWindLine();
window.addEventListener('resize', layoutFurin);
requestAnimationFrame(loop);
return { onWeather: onWeather };
})();

var infoCity = document.getElementById('infoCity');
var infoDate = document.getElementById('infoDate');
var infoTime = document.getElementById('infoTime');
var infoTemp = document.getElementById('infoTemp');
var infoWeather = document.getElementById('infoWeather');
var tickerWrap = document.getElementById('tickerWrap');

/* Measures where the ticker row really sits (it lands a few px lower than
   the sum of the paddings and font sizes) and hands main.css the two
   numbers the toolbar's layers hang off: --ticker-top (the 七十二候's
   second line) and --pane-h (the glass ends 24px below the ticker; the
   music display's wave rests on that edge). Re-run whenever the bar
   changes size and once the fonts have loaded. */
var _toolbarKey = '';
function layoutToolbar() {
  var line = document.getElementById('infoLine');
  if (!infoBar || !line || !tickerWrap) return;
  var b = infoBar.getBoundingClientRect(), t = tickerWrap.getBoundingClientRect();
  if (b.height < 1 || t.height < 1) return;
  var top = (t.top - b.top).toFixed(1), pane = (t.bottom - b.top + 24).toFixed(1);
  var key = top + ',' + pane;
  if (key === _toolbarKey) return;
  _toolbarKey = key;
  infoBar.style.setProperty('--ticker-top', top + 'px');
  infoBar.style.setProperty('--pane-h', pane + 'px');
}
if (infoBar && typeof ResizeObserver !== 'undefined') new ResizeObserver(layoutToolbar).observe(infoBar);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(layoutToolbar);
var tickerTrack = document.getElementById('tickerTrack');

var tyCarousel = document.getElementById('tyCarousel');
var tyTrack = document.getElementById('tyTrack');
var tyPanels = document.querySelectorAll('.ty-panel');
var tyDotsEl = document.getElementById('tyDots');
var tyDots = document.querySelectorAll('.ty-dot');
var tySwipeHint = document.getElementById('tySwipeHint');
var tySwipeHintLabel = document.getElementById('tySwipeHintLabel');
var tyPanel1Content = document.getElementById('tyPanel1Content');
var tyAmbientStage = document.getElementById('tyAmbientStage');
var tyReceiptBtn = document.getElementById('tyReceiptBtn');
var tyReceiptBtnLabel = document.getElementById('tyReceiptBtnLabel');

var receiptOpenedFromThankyou = false;
var receiptHasLanded = false;
var receiptScrollIndicatorEl = null;
var receiptScrollY = 0;

var NAGOYA = { lat: 35.1815, lon: 136.9066, tz: 'Asia/Tokyo', name: '名古屋市' };
var JP_WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

var TICKER_CITIES = [
  { key: 'nagoya', name: '名古屋市', lat: 35.1815, lon: 136.9066 },
  { key: 'tokyo', name: '東京都', lat: 35.6762, lon: 139.6503 },
  { key: 'osaka', name: '大阪市', lat: 34.6937, lon: 135.5023 },
  { key: 'kyoto', name: '京都市', lat: 35.0116, lon: 135.7681 },
  { key: 'okinawa', name: '那覇市', lat: 26.2124, lon: 127.6809 },
  { key: 'sendai', name: '仙台市', lat: 38.2682, lon: 140.8694 },
  { key: 'sapporo', name: '札幌市', lat: 43.0618, lon: 141.3545 }
];

var TY_PANEL1_DEFAULT_HTML =
  '<div class="ty-mark">❀</div>' +
  '<div class="ty-line">ありがとうございます。</div>' +
  '<div class="ty-line accent">それでは、シャワーを浴びてまいります。</div>' +
  '<div class="ty-line spacer">どうぞごゆっくりお待ちください。</div>' +
  '<div class="ty-line">本日はよろしくお願いいたします。</div>' +
  '<div class="ty-rule"></div>' +
  '<div class="ty-line">シャワーは10分ほどで済ませます。</div>';

var TY_PANEL1_MICROBIKINI_HTML =
  '<div class="ty-mark">❀</div>' +
  '<div class="ty-line">ありがとうございます。</div>' +
  '<div class="ty-line">それでは、シャワーを浴びてまいります。どうぞごゆっくりお待ちください。本日はよろしくお願いいたします。</div>' +
  '<div class="ty-rule"></div>' +
  '<div class="ty-line accent">シャワーは10分ほどで済ませます。マイクロビキニへのお着替えは、私がシャワーから戻ってきてからお願いできますでしょうか。</div>';

window.addEventListener('resize', function() {
  stageWidth = window.innerWidth;
  refWidth = Math.min(window.innerWidth, 600);
  track.style.transform = 'translateX(-' + (currentPanel * (100 / totalPanels)) + '%)';
  tyStageWidth = window.innerWidth;
  tyRefWidth = Math.min(window.innerWidth, 600);
  tyTrack.style.transform = 'translateX(-' + (tyCurrentPanel * (100 / TY_TOTAL_PANELS)) + '%)';
  repositionHintGroup();
  repositionTySwipeHint();
  repositionNumpad();
  updateNumpadVisibility();
});

/* ============ HINT GROUP POSITIONING ============ */
function repositionHintGroup() {
  if (!panels.length || !stage) return;
  var stageHeight = stage.offsetHeight;
  if (stageHeight <= 0) return;
  var maxContentH = 0;
  for (var i = 0; i < panels.length; i++) {
    var content = panels[i].querySelector('.panel-content');
    if (content && content.offsetHeight > maxContentH) maxContentH = content.offsetHeight;
  }
  var infoBarEl = document.getElementById('infoBar');
  var infoH = infoBarEl ? infoBarEl.offsetHeight : 0;
  if (infoH < 40) infoH = 88;
  var infoBottom = infoH + 10;
  var hintH = 24, dotsH = 12, spaceBetween = 24;
  var totalDotsBlockH = hintH + spaceBetween + dotsH;
  var minBottomMargin = 40;
  var optimalDotsTop = stageHeight - minBottomMargin - totalDotsBlockH;
  var totalGapSpace = optimalDotsTop - infoBottom - maxContentH;
  var gap = totalGapSpace / 2;
  if (gap < 30) gap = 30;
  var pTop = infoBottom + gap;
  var pBottom = stageHeight - (infoBottom + gap + maxContentH);
  if (pBottom < 0) pBottom = 0;
  for (var j = 0; j < panels.length; j++) {
    panels[j].style.paddingTop = pTop + 'px';
    panels[j].style.paddingBottom = pBottom + 'px';
  }
  var textBottom = infoBottom + gap + maxContentH;
  var actualDotsTop = textBottom + gap;
  var actualDotsBottomFromStage = stageHeight - (actualDotsTop + totalDotsBlockH);
  var hintBottom = actualDotsBottomFromStage + dotsH + spaceBetween;
  var dotsBottom = actualDotsBottomFromStage;
  // Autumn: keep them clear of the band of leaves along the bottom edge (the
  // positions chosen on landscape.html: dots at least 136px up, hint 184px).
  if (currentTheme === 'autumn') {
    var lift = Math.max(0, 136 - dotsBottom, 184 - hintBottom);
    dotsBottom += lift; hintBottom += lift;
    // The button and the dots then move up together, as one group, so the
    // button sits just under the longest message (18px below it, the button
    // is 32px tall), in the open sky above the torii.
    var hintUnderText = stageHeight - textBottom - 18 - 32;
    hintBottom = hintUnderText;
    // The dots travel with the button as one group, 7px under it (the dots
    // are 6px).
    dotsBottom = hintBottom - 7 - 6;
    if (dotsBottom < 0) { hintBottom -= dotsBottom; dotsBottom = 0; }
  }
  // Winter: clear of the snowdrift (as placed on winter.html: dots at least 140px up, hint 208px).
  if (currentTheme === 'winter') {
    var liftW = Math.max(0, 140 - dotsBottom, 208 - hintBottom);
    dotsBottom += liftW; hintBottom += liftW;
  }
  if (globalHint) globalHint.style.bottom = hintBottom + 'px';
  if (dotsEl) dotsEl.style.bottom = dotsBottom + 'px';
}
function repositionHintGroupAfterLayout() {
  requestAnimationFrame(function() {
    requestAnimationFrame(function() { repositionHintGroup(); });
  });
  setTimeout(repositionHintGroup, 150);
}

/* ============ NUMPAD ============ */
var numpadSuppressed = false;
var lastNumpadWinW = 0;

function repositionNumpad() {
  if (!numpad) return;
  if (window.innerWidth <= 1250) return;
  if (window.innerWidth === lastNumpadWinW) return;
  lastNumpadWinW = window.innerWidth;
  var numpadWidth = 232;
  var theoreticalRightEdge = (window.innerWidth / 2) + 300;
  var rightSpace = window.innerWidth - theoreticalRightEdge;
  var left = theoreticalRightEdge + (rightSpace - numpadWidth) / 2;
  numpad.style.left = left + 'px';
  numpad.style.top = '50%';
}

function getActivePriceInput() {
  var active = document.activeElement;
  if (active && active.classList && (active.classList.contains('price-input') || active.classList.contains('receipt-price-input')) && !active.disabled) {
    return active;
  }
  return null;
}

function fireInputEvent(input) {
  var evt;
  try { evt = new Event('input', { bubbles: true }); }
  catch (e) {
    evt = document.createEvent('Event');
    evt.initEvent('input', true, true);
  }
  input.dispatchEvent(evt);
}

function inputHasSelection(input) {
  try {
    var s = input.selectionStart, e = input.selectionEnd;
    return (s !== null && e !== null && s !== e);
  } catch (err) { return false; }
}

function numpadAppend(input, digits) {
  if (!input) return;
  var cur = inputHasSelection(input) ? '' : (input.value || '').replace(/[^0-9]/g, '');
  cur = cur + digits;
  if (cur.length > 5) cur = cur.slice(0, 5);
  if (cur === '') { input.value = ''; }
  else {
    var parsed = parseInt(cur, 10);
    input.value = parsed === 0 ? '0' : parsed.toLocaleString();
  }
  fireInputEvent(input);
}

function numpadBackspace(input) {
  if (!input) return;
  var cur;
  if (inputHasSelection(input)) { cur = ''; }
  else {
    cur = (input.value || '').replace(/[^0-9]/g, '');
    cur = cur.slice(0, -1);
  }
  if (cur === '') input.value = '';
  else input.value = parseInt(cur, 10).toLocaleString();
  fireInputEvent(input);
}

function numpadShake(input) {
  var wrap = input.closest('.price-wrap') || input.closest('.receipt-item-price-wrap');
  if (wrap) {
    wrap.classList.remove('shake');
    void wrap.offsetWidth;
    wrap.classList.add('shake');
    setTimeout(function() { wrap.classList.remove('shake'); }, 350);
    if (wrap.classList.contains('price-wrap')) Hints && Hints.say(wrap, '料金をご入力ください');
  }
  haptic(15);
}

function handleNumpadKey(key) {
  var isReceiptOpen = receiptScreen && receiptScreen.classList.contains('visible');
  if (rejected && !isReceiptOpen) return;
  var target = getActivePriceInput();
  if (!target) return;
  playTock(key);
  if (key === 'done') {
    if ((target.value || '').trim() === '') { numpadShake(target); }
    else { haptic(10); try { target.blur(); } catch (e) {} }
    return;
  }
  if (key === 'back') { numpadBackspace(target); haptic(8); }
  else { numpadAppend(target, key); haptic(8); Hints && Hints.onDigit(); }
}
for (var nb = 0; nb < numpadBtns.length; nb++) {
  (function(btn) {
    btn.addEventListener('pointerdown', function(e) {
      e.preventDefault();
      e.stopPropagation();
      if (numpadSuppressed) return;
      var key = btn.getAttribute('data-key');
      if (key) handleNumpadKey(key);
    });
    btn.addEventListener('contextmenu', function(e) { e.preventDefault(); });
  })(numpadBtns[nb]);
}
/* Works out whether the keypad shows; the hints are told whenever that changes. */
function updateNumpadVisibility() {
  updateNumpadVisibilityNow();
  Hints && Hints.syncNumpad();
}
function updateNumpadVisibilityNow() {
  if (!numpad) return;
  if (tanzakuScreen && tanzakuScreen.classList.contains('visible')) {
    numpad.classList.remove('visible');
    return;
  }
  var isReceiptOpen = receiptScreen && receiptScreen.classList.contains('visible');
  numpad.classList.toggle('receipt-mode', !!isReceiptOpen);

  if (!tableCard || window.innerWidth <= 1250) {
    numpad.classList.remove('visible');
    return;
  }
  /* Allow numpad on receipt even if rejected, so tip remains editable */
  if ((rejected && !isReceiptOpen) || numpadSuppressed) {
    numpad.classList.remove('visible');
    return;
  }
  var activeEl = document.activeElement;
  var isPriceFocused = activeEl && activeEl.classList &&
    (activeEl.classList.contains('price-input') ||
     activeEl.classList.contains('receipt-price-input'));
  if (isPriceFocused) {
    repositionNumpad();
    numpad.classList.add('visible');
  } else {
    numpad.classList.remove('visible');
  }
}
document.addEventListener('focusin', function(e) {
  var t = e.target;
  if (!t || !t.classList) return;
  if (t.classList.contains('price-input')) {
    var row = t.closest('.row');
    if (row && row.closest('#tableCard') && refuseIfPending(row)) return;
  }
  if (t.classList.contains('service-input') || t.classList.contains('tanzaku-input')) {
    numpadSuppressed = true;
    if (numpad) numpad.classList.remove('visible');
  } else {
    numpadSuppressed = false;
    updateNumpadVisibility();
  }
});
document.addEventListener('focusout', function(e) {
  setTimeout(updateNumpadVisibility, 10);
});

/* ============ TANZAKU FOCUS MODAL ============ */
function openTanzaku(row) {
  if (!row) return;
  var svcInput = row.querySelector('.service-input');
  if (!svcInput) return;
  Hints && Hints.interrupt();
  playPaper(true);
  holdKeyboardResizes();
  tanzakuTargetRow = row;
  tanzakuInput.value = svcInput.value || '';
  tanzakuScreen.classList.add('visible');
  /* Focus (which brings up the on-screen keyboard) only once the 0.5s fade
     has finished. Focusing during the fade made the keyboard slide in on
     top of it and the fade dropped frames. */
  var openId = ++tanzakuOpenId;
  var focused = false;
  function focusInput(e) {
    if (e && (e.target !== tanzakuScreen || e.propertyName !== 'opacity')) return;
    tanzakuScreen.removeEventListener('transitionend', focusInput);
    if (focused || openId !== tanzakuOpenId || !tanzakuScreen.classList.contains('visible')) return;
    focused = true;
    try { tanzakuInput.focus(); } catch (e2) {}
    try {
      var len = tanzakuInput.value.length;
      tanzakuInput.setSelectionRange(len, len);
    } catch (e2) {}
  }
  tanzakuScreen.addEventListener('transitionend', focusInput);
  setTimeout(focusInput, 600);
}
var tanzakuOpenId = 0;
/* Decodes the card's photo (icons/1790678998862.jpg, main.css) ahead of
   time. Otherwise it is decoded on the first frame of the fade-in, which
   stalls it. Done again after each close in case the browser has let the
   decoded copy go. */
var tanzakuPhoto = null;
function predecodeTanzakuPhoto() {
  try {
    if (!tanzakuPhoto) {
      tanzakuPhoto = new Image();
      tanzakuPhoto.src = 'icons/1790678998862.jpg';
    }
    if (tanzakuPhoto.decode) tanzakuPhoto.decode().catch(function() {});
  } catch (e) {}
}
predecodeTanzakuPhoto();
function closeTanzaku() {
  tanzakuOpenId++;
  setTimeout(predecodeTanzakuPhoto, 700);
  playPaper(false);
  tanzakuScreen.classList.remove('visible');
  try { tanzakuInput.blur(); } catch (e) {}
  releaseKeyboardResizes();
  tanzakuTargetRow = null;
  numpadSuppressed = false;
  updateNumpadVisibility();
}
function confirmTanzaku() {
  if (!tanzakuTargetRow) { closeTanzaku(); return; }
  var svcInput = tanzakuTargetRow.querySelector('.service-input');
  if (!svcInput) { closeTanzaku(); return; }
  var val = (tanzakuInput.value || '').trim();
  if (val === '') {
    tanzakuInput.classList.remove('shake');
    void tanzakuInput.offsetWidth;
    tanzakuInput.classList.add('shake');
    setTimeout(function() { tanzakuInput.classList.remove('shake'); }, 350);
    haptic(15);
    return;
  }
  svcInput.value = val;
  fireInputEvent(svcInput);
  haptic(10);
  var priceFieldToFocus = tanzakuTargetRow.querySelector('.price-input');
  closeTanzaku();
  if (priceFieldToFocus && !priceFieldToFocus.disabled) {
    setTimeout(function() {
      try { priceFieldToFocus.focus(); } catch(e) {}
    }, 50);
  }
}
tanzakuCancel.addEventListener('click', function(e) { e.preventDefault(); haptic(8); closeTanzaku(); });
tanzakuConfirm.addEventListener('click', function(e) { e.preventDefault(); confirmTanzaku(); });
tanzakuInput.addEventListener('keydown', function(e) {
  if (e.key === 'Enter' || e.keyCode === 13) { e.preventDefault(); confirmTanzaku(); }
  else if (e.key === 'Escape' || e.keyCode === 27) { e.preventDefault(); closeTanzaku(); }
});
tanzakuScreen.addEventListener('click', function(e) {
  if (e.target === tanzakuScreen) closeTanzaku();
});

/* ============================================================
   PANEL PHRASE REVEAL */
var PANEL_PHRASE_MIN = 5;
var PANEL_PHRASE_MAX = 10;
var PANEL_PHRASE_RISE = 30;
var PANEL_PHRASE_DURATION = 500;
var PANEL_PHRASE_STAGGER_MAX = 600;
/* PANEL_PHRASE_DELAY and PANEL_PHRASE_MODE retired. The latter was
   a tuning switch between 'coexist' and 'sequence'; the codebase
   has only ever run 'coexist', and the sequence branch's baseDelay
   was never exercised. Its constant input, PANEL_PHRASE_DELAY, had
   no reader once both ternaries were inlined to baseDelay = 0. */

var PANEL_1_POST_BEAT_DELAY = 1000;

var panelPhraseTimers = [];

/* ============================================================
   CHUNKER (Intl.Segmenter, Code-Point Safe) */
var segmenterJa = (typeof Intl !== 'undefined' && Intl.Segmenter)
  ? new Intl.Segmenter('ja', { granularity: 'word' })
  : null;

function codepointCount(str) {
  return Array.from(str).length;
}

function isJapanesePunctuation(ch) {
  return ch === '、' || ch === '。' || ch === '！' || ch === '？';
}

function chunkPanelText(text) {
  var clean = String(text).replace(/\s+/g, '');
  if (clean === '') return [];

  /* Legacy fallback for environments lacking Intl.Segmenter.
     Note: Still relies on UTF-16 code units (substr) and can split
     surrogate pairs. Retained solely as a non-breaking legacy path. */
  if (!segmenterJa) {
    return chunkPanelTextFallback(clean);
  }

  var segments = Array.from(segmenterJa.segment(clean), function(s) { return s.segment; });
  var chunks = [];
  var currentChunk = '';
  var currentLen = 0;
  var seg = '';
  var segLen = 0;

  for (var i = 0; i < segments.length; i++) {
    seg = segments[i];
    segLen = codepointCount(seg);

    /* 1. Flush when appending this segment exceeds MAX, provided MIN
          density is already met. */
    if (currentLen >= PANEL_PHRASE_MIN && (currentLen + segLen) > PANEL_PHRASE_MAX) {
      chunks.push(currentChunk);
      currentChunk = '';
      currentLen = 0;
    }

    /* 1b. Punctuation orphaned by the size flush above belongs to
           the phrase it terminates, not the phrase it precedes.
           Japanese 、。！？ always trail their clause. Without this
           guard, a comma arriving after a size flush becomes the
           first character of the next chunk — visible on Panel 4
           line 5, where 、 preceded お選びいただけますでしょうか。 */
    if (isJapanesePunctuation(seg) && currentLen === 0 && chunks.length > 0) {
      chunks[chunks.length - 1] += seg;
      continue;
    }

    currentChunk += seg;
    currentLen += segLen;

    /* 2. Flush on punctuation only after MIN visual weight is met.
          Keeps short formal lead-ins (e.g. 「もし、」) bound to their clause. */
    if (isJapanesePunctuation(seg) && currentLen >= PANEL_PHRASE_MIN) {
      chunks.push(currentChunk);
      currentChunk = '';
      currentLen = 0;
    }
  }

  /* 3. Fuse undersized tail fragments into the preceding chunk. */
  if (currentChunk !== '') {
    if (chunks.length > 0 && currentLen < PANEL_PHRASE_MIN) {
      chunks[chunks.length - 1] += currentChunk;
    } else {
      chunks.push(currentChunk);
    }
  }

  return chunks;
}

/* ============================================================
   LEGACY CHUNKER FALLBACK (Pre-Intl.Segmenter Engines) */
function chunkPanelTextFallback(clean) {
  var raw = [];
  var i = 0;
  while (i < clean.length) {
    var len = PANEL_PHRASE_MIN + Math.floor(Math.random() * (PANEL_PHRASE_MAX - PANEL_PHRASE_MIN + 1));
    if (i + len > clean.length) len = clean.length - i;
    raw.push(clean.substr(i, len));
    i += len;
  }

  if (raw.length >= 2) {
    var lastIdx = raw.length - 1;
    if (raw[lastIdx].length < PANEL_PHRASE_MIN) {
      raw[lastIdx - 1] = raw[lastIdx - 1] + raw[lastIdx];
      raw.pop();
    }
  }

  var out = [];
  for (var k = 0; k < raw.length; k++) {
    var piece = raw[k];
    if (k === 0 || !isJapanesePunctuation(piece.charAt(0))) {
      out.push(piece);
      continue;
    }
    var lead = '';
    var p = 0;
    while (p < piece.length && isJapanesePunctuation(piece.charAt(p))) {
      lead += piece.charAt(p);
      p++;
    }
    var rest = piece.substr(p);
    if (out.length > 0) {
      out[out.length - 1] = out[out.length - 1] + lead;
    }
    if (rest !== '') out.push(rest);
  }

  if (out.length >= 2) {
    var li = out.length - 1;
    if (out[li].length < PANEL_PHRASE_MIN) {
      out[li - 1] = out[li - 1] + out[li];
      out.pop();
    }
  }

  return out;
}

/* ============================================================
   RECURSIVE TEXT-NODE WALKER */
function shouldSkipTextNode(node) {
  var parent = node.parentNode;
  while (parent && parent.nodeType === 1) {
    if (parent.classList) {
      if (parent.classList.contains('panel-phrase')) return true;
      if (parent.classList.contains('therapist-name')) return true;
    }
    parent = parent.parentNode;
  }
  return false;
}

function wrapTextNodeInPhrases(textNode) {
  if (shouldSkipTextNode(textNode)) return;
  var raw = textNode.nodeValue || '';
  if (raw.trim() === '') return;
  var chunks = chunkPanelText(raw);
  if (chunks.length === 0) return;

  var frag = document.createDocumentFragment();
  for (var c = 0; c < chunks.length; c++) {
    var sp = document.createElement('span');
    sp.className = 'panel-phrase';
    sp.textContent = chunks[c];
    frag.appendChild(sp);
  }
  textNode.parentNode.replaceChild(frag, textNode);
}

function wrapPhrasesRecursively(root) {
  if (!root) return;
  var walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        if (shouldSkipTextNode(node)) return NodeFilter.FILTER_REJECT;
        if ((node.nodeValue || '').trim() === '') return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    },
    false
  );

  var collected = [];
  var n;
  while ((n = walker.nextNode())) collected.push(n);

  for (var i = 0; i < collected.length; i++) {
    wrapTextNodeInPhrases(collected[i]);
  }
}

/* ============================================================
   PANEL-0 SPECIAL SEQUENCE */
function buildPanel1OpeningBeats(panelEl) {
  if (!panelEl) return;
  var contentEl = panelEl.querySelector('.panel-content');
  if (!contentEl) return;
  var body = contentEl.querySelector('#panelGreetingBody');
  if (!body) return;

  var child = contentEl.firstChild;
  while (child && child !== body) {
    var nextChild = child.nextSibling;
    contentEl.removeChild(child);
    child = nextChild;
  }

  var beat1 = document.createElement('span');
  beat1.className = 'panel-phrase panel-1-beat';
  beat1.setAttribute('data-beat', '1');
  var nameSpan = document.createElement('span');
  nameSpan.id = 'therapistName';
  nameSpan.className = 'therapist-name';
  nameSpan.textContent = therapistDisplayName;
  beat1.appendChild(nameSpan);
  beat1.appendChild(document.createTextNode('、'));

  var beat2 = document.createElement('span');
  beat2.className = 'panel-phrase panel-1-beat';
  beat2.setAttribute('data-beat', '2');
  beat2.textContent = '初めまして。';

  contentEl.insertBefore(beat1, body);
  contentEl.insertBefore(beat2, body);
}

function resetPanel1Beats(panelEl) {
  if (!panelEl) return;
  var beats = panelEl.querySelectorAll('.panel-1-beat');
  for (var i = 0; i < beats.length; i++) {
    beats[i].classList.remove('shown');
    beats[i].style.transitionDelay = '0ms';
    beats[i].style.removeProperty('--phrase-start-x');
  }
}

function playPanel1SpecialSequence(panelEl) {
  if (!panelEl) return;
  var contentEl = panelEl.querySelector('.panel-content');
  if (!contentEl) return;

  var beat1 = contentEl.querySelector('.panel-1-beat[data-beat="1"]');
  var beat2 = contentEl.querySelector('.panel-1-beat[data-beat="2"]');
  var body = contentEl.querySelector('#panelGreetingBody');

  if (body) {
    var bodyPhrases = body.querySelectorAll('.panel-phrase');
    for (var j = 0; j < bodyPhrases.length; j++) {
      bodyPhrases[j].classList.remove('shown');
      bodyPhrases[j].style.transitionDelay = '0ms';
      bodyPhrases[j].style.removeProperty('--phrase-start-x');
    }
  }

  function fireBeat(el) {
    if (!el) return;
    var dir = Math.random() < 0.5 ? -1 : 1;
    el.style.setProperty('--phrase-start-x', (dir * PANEL_PHRASE_RISE) + 'px');
    el.classList.add('shown');
  }

  /* The greeting waits for the background: on the first visit the scene
     (dynMaster) is still fading in when this panel opens, so the name would
     appear on a blank screen. Poll until the scene is mostly visible, or
     give up after 4 s (or at once when no scene is drawn at all). */
  function sceneVisible() {
    if (document.hidden || (currentTheme !== 'autumn' && currentTheme !== 'winter')) return true;
    if (typeof DynBG === 'undefined' || !DynBG || !DynBG.sceneShown) return true;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
    return DynBG.sceneShown() > 0.6;
  }
  var greetWaitStart = performance.now();
  function fireBeat1WhenSceneReady() {
    if (sceneVisible() || performance.now() - greetWaitStart > 4000) { fireBeat(beat1); runBeatChain(); return; }
    panelPhraseTimers.push(setTimeout(fireBeat1WhenSceneReady, 60));
  }

  function startBodyReveal() {
    if (!body) return;
    var phrases = body.querySelectorAll('.panel-phrase');
    if (!phrases.length) return;
    var baseDelay = 0;
    var navId = setTimeout(revealNavControls, PANEL_PHRASE_STAGGER_MAX + PANEL_PHRASE_DURATION + 300);
    panelPhraseTimers.push(navId);
    void body.offsetWidth;
    for (var k = 0; k < phrases.length; k++) {
      (function(el) {
        var d = Math.random() < 0.5 ? -1 : 1;
        el.style.setProperty('--phrase-start-x', (d * PANEL_PHRASE_RISE) + 'px');
        var stagger = PANEL_PHRASE_STAGGER_MAX > 0
          ? Math.random() * PANEL_PHRASE_STAGGER_MAX
          : 0;
        var total = baseDelay + stagger;
        if (total > 0) {
          var id = setTimeout(function() { el.classList.add('shown'); }, total);
          panelPhraseTimers.push(id);
        } else {
          el.classList.add('shown');
        }
      })(phrases[k]);
    }
  }

  function runBeatChain() {
  if (beat2 && beat2.textContent !== '') {
    var started = false;
    function onBeat2Start() {
      if (started) return;
      started = true;
      beat1.removeEventListener('transitionend', onBeat2Start);
      fireBeat(beat2);
      var bodyFired = false;
      function onBeat2End() {
        if (bodyFired) return;
        bodyFired = true;
        beat2.removeEventListener('transitionend', onBeat2End);
        var tid = setTimeout(startBodyReveal, PANEL_1_POST_BEAT_DELAY);
        panelPhraseTimers.push(tid);
      }
      beat2.addEventListener('transitionend', onBeat2End);
      var fb2 = setTimeout(function() {
        beat2.removeEventListener('transitionend', onBeat2End);
        var tid = setTimeout(startBodyReveal, PANEL_1_POST_BEAT_DELAY);
        panelPhraseTimers.push(tid);
      }, PANEL_PHRASE_DURATION + 100);
      panelPhraseTimers.push(fb2);
    }
    beat1.addEventListener('transitionend', onBeat2Start);
    var fb1 = setTimeout(function() {
      beat1.removeEventListener('transitionend', onBeat2Start);
      onBeat2Start();
    }, PANEL_PHRASE_DURATION + 100);
    panelPhraseTimers.push(fb1);
  } else {
    var tid0 = setTimeout(startBodyReveal, PANEL_PHRASE_DURATION + PANEL_1_POST_BEAT_DELAY);
    panelPhraseTimers.push(tid0);
  }
  }
  fireBeat1WhenSceneReady();
}

/* ============================================================
   PANEL PHRASE REVEAL (general) */
function clearPanelPhraseTimers() {
  for (var i = 0; i < panelPhraseTimers.length; i++) clearTimeout(panelPhraseTimers[i]);
  panelPhraseTimers = [];
}

function resetPanelPhrases(panelEl) {
  var phrases = panelEl.querySelectorAll('.panel-phrase');
  for (var i = 0; i < phrases.length; i++) {
    phrases[i].classList.remove('shown');
    phrases[i].style.transitionDelay = '0ms';
    phrases[i].style.removeProperty('--phrase-start-x');
  }
}

function playPanelPhraseReveal(panelEl) {
  var phrases = panelEl.querySelectorAll('.panel-phrase');
  if (!phrases.length) return;

  var baseDelay = 0;

  void panelEl.offsetWidth;

  for (var i = 0; i < phrases.length; i++) {
    (function(el) {
      var dir = Math.random() < 0.5 ? -1 : 1;
      el.style.setProperty('--phrase-start-x', (dir * PANEL_PHRASE_RISE) + 'px');
      var stagger = PANEL_PHRASE_STAGGER_MAX > 0
        ? Math.random() * PANEL_PHRASE_STAGGER_MAX
        : 0;
      var total = baseDelay + stagger;
      if (total > 0) {
        var id = setTimeout(function() { el.classList.add('shown'); }, total);
        panelPhraseTimers.push(id);
      } else {
        el.classList.add('shown');
      }
    })(phrases[i]);
  }
}

/* ============ PANEL WRAPPING (post-load) ============ */
function preparePanel(panelEl) {
  if (!panelEl) return;
  var contentEl = panelEl.querySelector('.panel-content');
  if (!contentEl) return;

  var isPanel0 = panelEl.getAttribute('data-panel') === '0';

  if (isPanel0) {
    var body = contentEl.querySelector('#panelGreetingBody');
    if (body) wrapPhrasesRecursively(body);
    buildPanel1OpeningBeats(panelEl);
    return;
  }

  wrapPhrasesRecursively(contentEl);
}

/* ============ MAIN CAROUSEL ============ */
function activatePanel(index) {
  for (var i = 0; i < panels.length; i++) {
    panels[i].classList.remove('active', 'leaving');
    if (i === index) panels[i].classList.add('active');
    else if (i < index) panels[i].classList.add('leaving');
  }

  clearPanelPhraseTimers();
  var targetPanel = panels[index];
  if (!targetPanel) return;

  var isPanel0 = targetPanel.getAttribute('data-panel') === '0';

  if (isPanel0) {
    resetPanel1Beats(targetPanel);
    var body = targetPanel.querySelector('#panelGreetingBody');
    if (body) {
      var bodyPhrases = body.querySelectorAll('.panel-phrase');
      for (var p = 0; p < bodyPhrases.length; p++) {
        bodyPhrases[p].classList.remove('shown');
        bodyPhrases[p].style.transitionDelay = '0ms';
        bodyPhrases[p].style.removeProperty('--phrase-start-x');
      }
    }
    void targetPanel.offsetWidth;
    playPanel1SpecialSequence(targetPanel);
  } else {
    revealNavControls();
    resetPanelPhrases(targetPanel);
    void targetPanel.offsetWidth;
    playPanelPhraseReveal(targetPanel);
  }
}
function unlockTable() {
  if (tableUnlocked) return;
  tableUnlocked = true;
  document.body.classList.remove('table-locked');
}
function relockTable() {
  if (!tableUnlocked) return;
  tableUnlocked = false;
  window.scrollTo(0, 0);
  document.body.classList.add('table-locked');
}

function returnToStartScreen() {
  if (!nameConfirmed) return;
  if (receiptScreen && receiptScreen.classList.contains('visible')) return;
  if (thankyouScreen && thankyouScreen.classList.contains('visible')) return;

  stopAmbientRipple();
  stopPondLife();
  clearKoiTimers();
  resetWind();

  if (mapleLeaves) mapleLeaves.classList.remove('active');
  if (snowFlakes) snowFlakes.classList.remove('active');
  if (audioSpectrumHud) audioSpectrumHud.classList.remove('shown');
  stopAmbient();

  koiGestureState = 'idle';
  koiActivePointerId = null;
  koiFlinchActive = false;
  introHasRun = false;

  if (koiDiveWrap) {
    koiDiveWrap.classList.remove('dragging', 'flinching');
    koiDiveWrap.style.removeProperty('--koi-rise-y');
    koiDiveWrap.style.removeProperty('--flinch-rot');
    koiDiveWrap.style.removeProperty('--flinch-scale');
    koiDiveWrap.style.removeProperty('--flinch-x');
    koiDiveWrap.style.removeProperty('--flinch-y');
  }
  if (startBtn) {
    startBtn.classList.remove('ready', 'startling', 'diving', 'done');
  }
  if (blossomScreen) {
    blossomScreen.classList.remove('diving');
    blossomScreen.style.removeProperty('opacity');
    blossomScreen.style.removeProperty('transition');
  }
  if (introOverlay) {
    introOverlay.classList.remove('active', 'finishing');
  }
  if (nameColumn) {
    nameColumn.innerHTML = '';
  }

  clearPanelPhraseTimers();
  for (var p = 0; p < panels.length; p++) {
    panels[p].classList.remove('active', 'leaving');
  }
  currentPanel = 0;
  track.style.transform = 'translateX(0%)';
  for (var d = 0; d < dots.length; d++) {
    dots[d].classList.toggle('active', d === 0);
  }
  if (dotsEl) dotsEl.classList.remove('visible');

  tableVisited = false;
  tableEnteredView = false;
  if (tableUnlocked) {
    tableUnlocked = false;
    document.body.classList.add('table-locked');
  }
  window.scrollTo(0, 0);

  if (transitionLine) {
    var existingDriftItems = transitionLine.querySelectorAll('.transition-line-divider, .transition-line-body p');
    for (var t = 0; t < existingDriftItems.length; t++) {
      existingDriftItems[t].style.transform = '';
      existingDriftItems[t]._lastDriftStr = '';
    }
  }
  _tlDriftActive = false;

  document.body.classList.remove('info-visible');
  if (infoBar) {
    infoBar.classList.remove('shown');
    infoBar.classList.remove('hidden');
  }
  if (globalHint) globalHint.classList.remove('shown');

  if (summaryBar) summaryBar.classList.remove('visible');
  if (numpad) numpad.classList.remove('visible');
  if (divider) divider.classList.remove('active');
  if (tableCard) tableCard.classList.remove('active');
  if (rejectRow) rejectRow.classList.remove('active');
  document.body.classList.remove('warm-background');

  if (blossomScreen) blossomScreen.classList.add('visible');
  updateBlossomGreeting();
  tryStartBlossomStream();
  scheduleAmbientRipple();
  startPondLife();
  /* back at the start: the next pass through the app gets its hints again */
  if (Hints) { Hints.reset(); Hints.onStartScreen(); }
  NavSpring && NavSpring.reset();
}

/* After the name animation the swipe text and the page dots are held back
   until the scenery and the greeting text are in. */
var navControlsHeld = false;
function revealNavControls() {
  if (!navControlsHeld) return;
  navControlsHeld = false;
  if (dotsEl) dotsEl.classList.add('visible');
  updateGlobalHint();
}
function updateGlobalHint() {
  if (navControlsHeld) { if (globalHint) globalHint.classList.remove('shown'); return; }
  if (!globalHint || !globalHintLayerSwipe || !globalHintLayerScroll) return;
  if (!nameConfirmed) { globalHint.classList.remove('shown'); return; }
  if (currentPanel === totalPanels - 1) {
    globalHintLayerSwipe.classList.remove('active');
    globalHintLayerScroll.classList.add('active');
  } else {
    globalHintLayerScroll.classList.remove('active');
    globalHintLayerSwipe.classList.add('active');
  }
  globalHint.classList.add('shown');
  updateIntroHintVisibility();
}
function updateIntroHintVisibility(scrollY, vh) {
  if (!globalHint) return;
  if (navControlsHeld) { globalHint.classList.remove('shown'); return; }
  if (!nameConfirmed) { globalHint.classList.remove('shown'); return; }
  if (blossomScreen && blossomScreen.classList.contains('visible')) {
    globalHint.classList.remove('shown');
    return;
  }
  if (!tableEnteredView) { globalHint.classList.add('shown'); return; }

  var sY = (scrollY !== undefined) ? scrollY : (window.scrollY || window.pageYOffset || 0);
  var winH = (vh !== undefined) ? vh : window.innerHeight;
  var tcTop = _tcDocTop - sY;

  if (tcTop < winH * 0.6) globalHint.classList.remove('shown');
  else globalHint.classList.add('shown');
}
function goToPanel(index, noGust) {
  var newPanel = Math.max(0, Math.min(totalPanels - 1, index));
  if (!noGust && newPanel !== currentPanel && windEnabled) {
    var dir = newPanel > currentPanel ? -1 : 1;
    gustWind(KEYBOARD_GUST * dir);
  }
  currentPanel = newPanel;
  NavSpring && NavSpring.panelChanged('msg', currentPanel);
  track.style.transform = 'translateX(-' + (currentPanel * (100 / totalPanels)) + '%)';
  for (var i = 0; i < dots.length; i++) dots[i].classList.toggle('active', i === currentPanel);
  activatePanel(currentPanel);
  Hints && Hints.onPanelChange(currentPanel);
  if (currentPanel === totalPanels - 1) {
    unlockTable();
  } else if (!tableVisited) {
    relockTable();
  }
  if (transitionLine && currentPanel !== totalPanels - 1) {
    summaryBar.classList.remove('visible');
    if (numpad) numpad.classList.remove('visible');
  }
  updateGlobalHint();
  setTimeout(repositionHintGroup, 30);
  if (currentPanel === totalPanels - 1 && typeof scheduleEvaluation === 'function') {
    setTimeout(scheduleEvaluation, 80);
  }
}
function bounceToCurrentPanel() {
  track.classList.remove('dragging');
  track.style.transform = 'translateX(-' + (currentPanel * (100 / totalPanels)) + '%)';
}

/* ============ TABLE ============ */
function getRows() { return tableCard.querySelectorAll('.row'); }

function recalc() {
  var rows = getRows();
  var sum = 0;
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    var priceInput = row.querySelector('.price-input');
    if (!priceInput) continue;
    var val = parseFormatted(priceInput.value);
    var check = row.querySelector('.row-check');
    var isChecked = check && check.classList.contains('checked');
    if (isChecked) { row.classList.add('filled'); sum += val; }
    else { row.classList.remove('filled'); }
  }
  var displayTotal = rejected ? confirmedTipAmount : sum;
  updateSummaryTotal(displayTotal);
  updateSubmitState();
}

function updateSubmitState() {
  var rows = getRows();
  var anyActive = false;
  for (var i = 0; i < rows.length; i++) {
    var check = rows[i].querySelector('.row-check');
    if (check && check.classList.contains('checked')) { anyActive = true; break; }
  }
  submitBtn.disabled = !(anyActive || rejected);
}

function updateRowLock(row) {
  if (!row) return;
  var serviceText = row.querySelector('.service-input');
  var serviceDisplay = row.querySelector('.service-display');
  var priceInput = row.querySelector('.price-input');
  if (!priceInput) return;
  var hasName = false;
  if (serviceText) hasName = (serviceText.value || '').trim() !== '';
  else if (serviceDisplay) hasName = (serviceDisplay.textContent || '').trim() !== '';
  if (hasName) {
    priceInput.disabled = false;
    row.classList.remove('locked');
  } else {
    priceInput.disabled = true;
    priceInput.value = '';
    row.classList.add('locked');
  }
}
function updateAllRowLocks() {
  var rows = getRows();
  for (var i = 0; i < rows.length; i++) updateRowLock(rows[i]);
}

function getCustomRows() {
  var all = tableCard.querySelectorAll('.row');
  var out = [];
  for (var i = 0; i < all.length; i++) {
    if (all[i].querySelector('.service-input')) out.push(all[i]);
  }
  return out;
}
function customRowHasName(row) {
  var svc = row.querySelector('.service-input');
  return !!(svc && (svc.value || '').trim() !== '');
}
function firstUnnamedCustomRow() {
  var rows = getCustomRows();
  for (var i = 0; i < rows.length; i++) {
    if (!customRowHasName(rows[i])) return rows[i];
  }
  return null;
}
function isAllowedCustomRow(row) {
  if (customRowHasName(row)) return true;

  var rows = getCustomRows();
  for (var i = 0; i < rows.length; i++) {
    if (rows[i] === row) return true;
    if (!customRowHasName(rows[i])) return false;
  }
  return false;
}
function flashCustomRowHint(row) {
  if (!row) return;
  Hints && Hints.say(row.querySelector('.service-input'), '上の欄から順にご入力ください');
  row.classList.remove('service-hint');
  void row.offsetWidth;
  row.classList.add('service-hint');
  setTimeout(function() { row.classList.remove('service-hint'); }, 1000);
  try { row.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {}
}
function tryOpenCustomService(row, withHint) {
  if (!row) return;
  if (!isAllowedCustomRow(row)) {
    var tapped = row.querySelector('.service-input');
    if (tapped && document.activeElement === tapped) { try { tapped.blur(); } catch (e) {} }
    var first = firstUnnamedCustomRow();
    if (first) { flashCustomRowHint(first); haptic(15); }
    return;
  }
  if (withHint) {
    row.classList.remove('service-hint');
    void row.offsetWidth;
    row.classList.add('service-hint');
    setTimeout(function() { row.classList.remove('service-hint'); }, 1000);
    haptic(6);
  }
  openTanzaku(row);
}
function flashServiceInput(row) {
  if (!row) return;
  var svc = row.querySelector('.service-input');
  if (!svc) return;
  tryOpenCustomService(row, true);
}

/* ============ AUTO-COPY ============ */
function fallbackCopyTextToClipboard(text) {
  var textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "-9999px";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    var successful = document.execCommand('copy');
    if (successful) haptic(10);
  } catch (err) { /* silent */ }
  document.body.removeChild(textArea);
}
function copyCustomServices() {
  var serviceInputs = document.querySelectorAll('.service-input');
  var allServices = [];
  for (var i = 0; i < serviceInputs.length; i++) {
    var v = serviceInputs[i].value.trim();
    if (v !== '') allServices.push(v);
  }
  var combined = allServices.join('\n');
  if (combined === '') {
    try {
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText('');
    } catch (e) { /* silent */ }
    return;
  }
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(combined).then(function() { haptic(10); })
      .catch(function() { fallbackCopyTextToClipboard(combined); });
  } else {
    fallbackCopyTextToClipboard(combined);
  }
}

/* ============ UNPRICED SERVICES ============ */
function findUnpricedServices() {
  var rows = getRows();
  var missing = [];
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    var priceInput = row.querySelector('.price-input');
    if (!priceInput) continue;
    var check = row.querySelector('.row-check');
    var isChecked = check && check.classList.contains('checked');
    var rawVal = (priceInput.value || '').trim();
    var hasPrice = rawVal !== '';
    if (!isChecked) continue;
    if (!hasPrice) {
      var display = row.querySelector('.service-display');
      var textInput = row.querySelector('.service-input');
      var name = '';
      if (display) name = (display.textContent || '').trim();
      else if (textInput) name = (textInput.value || '').trim();
      if (!name) name = 'サービス ' + (i + 1);
      missing.push(name);
    }
  }
  return missing;
}

/* ============ EMPTY-BLUR SHAKE + REFOCUS ============ */
var pendingShakeRow = null;
var pendingShakeTimeout = null;

function cancelPendingShake() {
  if (pendingShakeTimeout) {
    clearTimeout(pendingShakeTimeout);
    pendingShakeTimeout = null;
  }
  pendingShakeRow = null;
}

function scheduleEmptyBlurShake(row, input, box) {
  cancelPendingShake();
  pendingShakeRow = row;
  pendingShakeTimeout = setTimeout(function() {
    pendingShakeTimeout = null;
    pendingShakeRow = null;
    if (rejected) return;
    if (alertScreen.classList.contains('visible')) return;
    if (confirmScreen.classList.contains('visible')) return;
    if (receiptScreen && receiptScreen.classList.contains('visible')) return;
    if (tanzakuScreen && tanzakuScreen.classList.contains('visible')) return;
    if (document.activeElement === input) return;
    if (!box.classList.contains('checked')) return;
    if ((input.value || '').trim() !== '') return;
    var wrap = input.closest('.price-wrap');
    if (wrap) {
      wrap.classList.remove('shake');
      void wrap.offsetWidth;
      wrap.classList.add('shake');
      setTimeout(function() { wrap.classList.remove('shake'); }, 350);
    }
    haptic(6);
    Hints && Hints.say(wrap, '料金をご入力ください');
    var active = document.activeElement;
    var otherInputFocused = active && active.tagName === 'INPUT';
    if (!otherInputFocused) { try { input.focus(); } catch (e) {} }
  }, 150);
}

/* ============ PENDING-ROW LOCK ============ */
function findPendingUnpricedRow() {
  var rows = getRows();
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    var box = r.querySelector('.row-check');
    if (!box || !box.classList.contains('checked')) continue;
    var pi = r.querySelector('.price-input');
    if (!pi) continue;
    if ((pi.value || '').trim() !== '') continue;
    return r;
  }
  return null;
}
function shakeAndRefocusPending(row) {
  if (!row) return;
  var input = row.querySelector('.price-input');
  if (!input || input.disabled) return;
  if (pendingShakeRow === row) cancelPendingShake();
  var wrap = input.closest('.price-wrap');
  if (wrap) {
    wrap.classList.remove('shake');
    void wrap.offsetWidth;
    wrap.classList.add('shake');
    setTimeout(function() { wrap.classList.remove('shake'); }, 350);
  }
  haptic(6);
  Hints && Hints.say(wrap, '料金をご入力ください');
  try { input.focus(); } catch (e) {}
}
function refuseIfPending(row) {
  var pending = findPendingUnpricedRow();
  if (pending && pending !== row) {
    shakeAndRefocusPending(pending);
    return true;
  }
  return false;
}

/* ============ RECEIPT EMPTY-BLUR SHAKE + REFOCUS ============ */
var pendingShakeReceiptItem = null;
var pendingShakeReceiptTimeout = null;

function cancelPendingReceiptShake() {
  if (pendingShakeReceiptTimeout) {
    clearTimeout(pendingShakeReceiptTimeout);
    pendingShakeReceiptTimeout = null;
  }
  pendingShakeReceiptItem = null;
}
function scheduleReceiptEmptyBlurShake(item, input) {
  cancelPendingReceiptShake();
  pendingShakeReceiptItem = item;
  pendingShakeReceiptTimeout = setTimeout(function() {
    pendingShakeReceiptTimeout = null;
    pendingShakeReceiptItem = null;
    if (!receiptScreen.classList.contains('visible')) return;
    if (!item.isConnected) return;
    if (item.classList.contains('removing')) return;
    if (document.activeElement === input) return;
    if ((input.value || '').trim() !== '') return;
    var wrap = input.closest('.receipt-item-price-wrap');
    if (wrap) {
      wrap.classList.remove('shake');
      void wrap.offsetWidth;
      wrap.classList.add('shake');
      setTimeout(function() { wrap.classList.remove('shake'); }, 350);
    }
    haptic(6);
    var active = document.activeElement;
    var otherInputFocused = active && active.tagName === 'INPUT';
    if (!otherInputFocused) { try { input.focus(); } catch (e) {} }
  }, 150);
}

/* ============ RECEIPT BODY LOCK ============ */
function lockBodyForReceipt() {
  receiptScrollY = window.scrollY || window.pageYOffset || 0;
  document.body.style.top = (-receiptScrollY) + 'px';
  document.body.classList.add('receipt-locked');
}
function unlockBodyForReceipt() {
  if (!document.body.classList.contains('receipt-locked')) return;
  document.body.classList.remove('receipt-locked');
  document.body.style.top = '';
  window.scrollTo(0, receiptScrollY);
}

/* ============ WIND FIELD ============ */
var ambientStage = document.getElementById('ambientStage');
var moteField = document.getElementById('moteField');
var ambientStyle = ambientStage ? ambientStage.style : null;

var currentWindOffset = 0;
var currentWindVelocity = 0;
var windRafId = null;

/* ============ ACCESSIBILITY / MOTION QUERY ============
   _prefersReducedMotion is a global accessibility intent, distinct
   from windEnabled, which describes stage particle physics. Each
   subsystem answers its own question against the shared probe
   below.

   Architectural rule for reduced-motion audits:
     · Reactive telemetry (vertical displacement driven by live
       acoustic energy) is state feedback — the visualiser confirms
       the audio engine is processing signal. Keep it under reduced
       motion; disabling it removes real-time information the user
       can act on.
     · Vestibular drift (travelling phase, continuous lateral
       propagation) is decorative motion. Freeze it. Lateral motion
       is the vestibular trigger; a static envelope that still rises
       and falls with the audio satisfies both the accessibility
       intent and the informative purpose.
   The same distinction applies elsewhere in the codebase — koi
   flinch (feedback) vs. swim-circle rotation (decoration), the
   drift keyframes (decoration) vs. opacity arrival (feedback),
   the snowflakes (decoration, fully suppressed). */
var _prefersReducedMotion = false;
var windEnabled = true;

try {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    _prefersReducedMotion = true;
    windEnabled = false;
  }
} catch (e) {}

var WIND_VELOCITY_SCALE   = 0.25;
var WIND_VELOCITY_CAP     = 14;
var WIND_STIFFNESS        = 0.10;
var WIND_DAMPING          = 0.82;
var WIND_OFFSET_CLAMP     = 120;
var WIND_SETTLE_VELOCITY  = 0.15;
var WIND_SETTLE_OFFSET    = 0.4;
var KEYBOARD_GUST         = 9;

var swipeSamples = [];

function startSwipeTracking() { swipeSamples = []; }
function recordSwipeSample(x) {
  var now = performance.now();
  swipeSamples.push({ x: x, t: now });
  while (swipeSamples.length > 2 && now - swipeSamples[0].t > 120) {
    swipeSamples.shift();
  }
  if (swipeSamples.length > 10) swipeSamples.shift();
}
function computeSwipeVelocity() {
  if (swipeSamples.length < 2) return 0;
  var oldest = swipeSamples[0];
  var newest = swipeSamples[swipeSamples.length - 1];
  var dt = newest.t - oldest.t;
  if (dt <= 0) return 0;
  return (newest.x - oldest.x) / dt;
}
function applyWind(x) {
  if (!ambientStyle) return;
  ambientStyle.setProperty('--wind-x', x + 'px');
  ambientStyle.setProperty('--wind-x-extra', (x * 0.4) + 'px');
  if (mistLitStage) mistLitStage.style.setProperty('--wind-x', x + 'px');
}
function windStep(now) {
  var dt = 1;
  if (windStep.lastTime) {
    dt = Math.min(32, now - windStep.lastTime) / 16.67;
    if (dt <= 0) dt = 1;
  }
  windStep.lastTime = now;
  currentWindOffset += currentWindVelocity * dt;
  currentWindVelocity -= currentWindOffset * WIND_STIFFNESS * dt;
  currentWindVelocity *= Math.pow(WIND_DAMPING, dt);
  if (currentWindOffset > WIND_OFFSET_CLAMP) {
    currentWindOffset = WIND_OFFSET_CLAMP;
    currentWindVelocity *= 0.5;
  } else if (currentWindOffset < -WIND_OFFSET_CLAMP) {
    currentWindOffset = -WIND_OFFSET_CLAMP;
    currentWindVelocity *= 0.5;
  }
  applyWind(currentWindOffset);
  if (Math.abs(currentWindVelocity) < WIND_SETTLE_VELOCITY &&
      Math.abs(currentWindOffset) < WIND_SETTLE_OFFSET) {
    currentWindOffset = 0;
    currentWindVelocity = 0;
    applyWind(0);
    windRafId = null;
    windStep.lastTime = 0;
    return;
  }
  windRafId = requestAnimationFrame(windStep);
}
function gustWind(impulse) {
  if (!windEnabled) return;
  currentWindVelocity += impulse;
  if (windRafId) cancelAnimationFrame(windRafId);
  windStep.lastTime = 0;
  windRafId = requestAnimationFrame(windStep);
}
function releaseSwipeGust() {
  if (!windEnabled) return;
  var velocityPxPerMs = computeSwipeVelocity();
  var velocityPxPerFrame = velocityPxPerMs * 16.67;
  var impulse = velocityPxPerFrame * WIND_VELOCITY_SCALE;
  if (impulse > WIND_VELOCITY_CAP) impulse = WIND_VELOCITY_CAP;
  if (impulse < -WIND_VELOCITY_CAP) impulse = -WIND_VELOCITY_CAP;
  if (Math.abs(impulse) < 0.3) return;
  gustWind(impulse);
}
function resetWind() {
  if (windRafId) { cancelAnimationFrame(windRafId); windRafId = null; }
  currentWindOffset = 0;
  currentWindVelocity = 0;
  swipeSamples = [];
  windStep.lastTime = 0;
  applyWind(0);
}
function buildMotes() {
  if (!moteField) return;
  moteField.innerHTML = '';
  if (!windEnabled) return;
  var count = 8;
  for (var i = 0; i < count; i++) {
    var m = document.createElement('div');
    m.className = 'mote';
    var size = 14 + Math.random() * 16;
    m.style.width = size + 'px';
    m.style.height = size + 'px';
    m.style.left = (Math.random() * 100) + '%';
    m.style.top  = (Math.random() * 100) + '%';
    var dur = 18 + Math.random() * 20;
    m.style.setProperty('--mote-dur', dur + 's');
    m.style.setProperty('--mote-delay', (-Math.random() * dur) + 's');
    m.style.setProperty('--mote-ax', (Math.random() * 26 - 13).toFixed(1) + 'px');
    m.style.setProperty('--mote-ay', (Math.random() * 22 - 11).toFixed(1) + 'px');
    m.style.setProperty('--mote-peak', (0.16 + Math.random() * 0.22).toFixed(2));
    moteField.appendChild(m);
  }
}
window.addEventListener('resize', function() {
  if (Math.abs(currentWindOffset) > WIND_OFFSET_CLAMP) {
    currentWindOffset = currentWindOffset > 0 ? WIND_OFFSET_CLAMP : -WIND_OFFSET_CLAMP;
    applyWind(currentWindOffset);
  }
});

/* ============ NAME SCREEN PRESET TABLE ============ */
function buildNameScreenRows() {
  if (!nameScreenRows) return;
  nameScreenRows.innerHTML = '';
  for (var i = 0; i < PRESETS.length; i++) {
    var preset = PRESETS[i];
    var rowDiv = document.createElement('div');
    rowDiv.className = 'row';
    var boxDiv = document.createElement('div');
    boxDiv.className = 'row-check';
    boxDiv.setAttribute('role', 'checkbox');
    boxDiv.setAttribute('aria-checked', 'false');
    var labelSpan = document.createElement('span');
    labelSpan.className = 'service-display';
    labelSpan.textContent = preset.name;
    var priceWrap = document.createElement('div');
    priceWrap.className = 'price-wrap';
    var priceInput = document.createElement('input');
    priceInput.type = 'text';
    priceInput.className = 'price-input';
    priceInput.placeholder = '料金を入力';
    priceInput.setAttribute('inputmode', 'none');
    priceInput.setAttribute('enterkeyhint', 'done');
    if (preset.price && preset.price > 0) priceInput.value = preset.price.toLocaleString();
    var yenSpan = document.createElement('span');
    yenSpan.className = 'yen';
    yenSpan.textContent = '円';
    priceWrap.appendChild(priceInput);
    priceWrap.appendChild(yenSpan);
    rowDiv.appendChild(boxDiv);
    rowDiv.appendChild(labelSpan);
    rowDiv.appendChild(priceWrap);
    nameScreenRows.appendChild(rowDiv);
  }
  updateNameScreenTotal();
}
function updateNameScreenTotal() {
  if (!nameScreenRows || !nameScreenTotalValue) return;
  var sum = 0;
  var rows = nameScreenRows.querySelectorAll('.row');
  for (var i = 0; i < rows.length; i++) {
    var box = rows[i].querySelector('.row-check');
    if (!box || !box.classList.contains('checked')) continue;
    var pi = rows[i].querySelector('.price-input');
    if (pi) sum += parseFormatted(pi.value);
  }
  nameScreenTotalValue.textContent = '¥' + sum.toLocaleString();
}
nameScreenRows.addEventListener('click', function(e) {
  if (e.target.closest('.price-wrap')) return;
  var row = e.target.closest('.row');
  if (!row) return;
  var box = row.querySelector('.row-check');
  if (!box) return;
  e.preventDefault();
  if (box.classList.contains('checked')) {
    box.classList.remove('checked');
    box.setAttribute('aria-checked', 'false');
    row.classList.remove('filled');
    playCheck(false);
  } else {
    box.classList.add('checked');
    box.setAttribute('aria-checked', 'true');
    row.classList.add('filled');
    playCheck(true);
  }
  haptic(6);
  updateNameScreenTotal();
});
nameScreenRows.addEventListener('input', function(e) {
  var input = e.target;
  if (!input.classList.contains('price-input')) return;
  var digits = input.value.replace(/[^0-9]/g, '');
  if (digits.length > 5) digits = digits.slice(0, 5);
  if (digits === '') input.value = '';
  else input.value = parseInt(digits, 10).toLocaleString();
  updateNameScreenTotal();
});
nameScreenRows.addEventListener('focusin', function(e) {
  var input = e.target;
  if (input && input.classList.contains('price-input')) {
    setTimeout(function() {
      if (document.activeElement !== input) return;
      try { input.select(); } catch (err) {}
    }, 50);
  }
});

/* ============ TABLE LISTENERS ============ */
tableCard.addEventListener('click', function(e) {
  if (rejected) return;
  if (e.target.closest('.price-wrap')) return;
  if (e.target.closest('.service-input')) return;
  var row = e.target.closest('.row');
  if (!row) return;
  var box = row.querySelector('.row-check');
  if (!box) return;
  var tappedCheckbox = !!e.target.closest('.row-check');
  var isCustomRow = !!row.querySelector('.service-input');
  if (row.classList.contains('locked') && !tappedCheckbox) return;
  if (isCustomRow && !tappedCheckbox) return;
  if (refuseIfPending(row)) return;
  if (pendingShakeRow === row) cancelPendingShake();
  var priceInput = row.querySelector('.price-input');
  var serviceText = row.querySelector('.service-input');
  if (box.classList.contains('checked')) {
    haptic(6);
    playCheck(false);
    if (priceInput) {
      if (priceInput.value !== '') box.setAttribute('data-saved-price', priceInput.value);
      priceInput.value = '';
      try { priceInput.blur(); } catch (err) {}
    }
    if (isCustomRow && serviceText) {
      var currentService = serviceText.value;
      if (currentService !== '') box.setAttribute('data-saved-service', currentService);
      serviceText.value = '';
    }
    box.classList.remove('checked');
    box.setAttribute('aria-checked', 'false');
    if (isCustomRow) updateRowLock(row);
  } else {
    if (isCustomRow) {
      var currentService2 = serviceText ? (serviceText.value || '').trim() : '';
      var savedService = box.getAttribute('data-saved-service');
      var hasSavedService = savedService !== null && savedService.trim() !== '';
      if (currentService2 === '' && !hasSavedService) {
        flashServiceInput(row);
        return;
      }
    }
    haptic(10);
    playCheck(true);
    if (priceInput) {
      var saved = box.getAttribute('data-saved-price');
      if (saved !== null && saved !== '') priceInput.value = saved;
    }
    if (isCustomRow && serviceText) {
      var savedService2 = box.getAttribute('data-saved-service');
      if (savedService2 !== null && savedService2 !== '') serviceText.value = savedService2;
    }
    if (isCustomRow) updateRowLock(row);
    box.classList.add('checked');
    box.setAttribute('aria-checked', 'true');
    if (priceInput && !priceInput.disabled) {
      try { priceInput.focus(); } catch (err) {}
    }
  }
  recalc();
  if (box.classList.contains('checked')) Hints && Hints.onTick(row);
});
tableCard.addEventListener('click', function(e) {
  var svcInput = e.target.closest('.service-input');
  if (!svcInput) return;
  if (rejected) return;
  var row = svcInput.closest('.row');
  if (!row) return;
  if (refuseIfPending(row)) return;
  tryOpenCustomService(row, false);
});
tableCard.addEventListener('click', function(e) {
  var row = e.target.closest('.row');
  if (!row) return;
  if (!row.classList.contains('locked')) return;
  if (!e.target.closest('.price-wrap')) return;
  if (refuseIfPending(row)) return;
  flashServiceInput(row);
});
tableCard.addEventListener('focusout', function(e) {
  var input = e.target;
  if (!input || !input.classList || !input.classList.contains('price-input')) return;
  if (rejected) return;
  var row = input.closest('.row');
  if (!row) return;
  var box = row.querySelector('.row-check');
  if (!box || !box.classList.contains('checked')) return;
  if ((input.value || '').trim() !== '') return;
  scheduleEmptyBlurShake(row, input, box);
});
tableCard.addEventListener('input', function(e) {
  var input = e.target;
  if (!input.classList.contains('price-input')) return;
  if (rejected) return;
  if (input.disabled) return;
  var digits = input.value.replace(/[^0-9]/g, '');
  if (digits.length > 5) digits = digits.slice(0, 5);
  if (digits === '') input.value = '';
  else input.value = parseInt(digits, 10).toLocaleString();
  var row = input.closest('.row');
  if (row) {
    var box = row.querySelector('.row-check');
    if (box) {
      if (digits !== '') {
        box.setAttribute('data-saved-price', input.value);
        var serviceText = row.querySelector('.service-input');
        var serviceDisplay = row.querySelector('.service-display');
        var serviceConditionMet = false;
        if (serviceText) {
          var currentService = (serviceText.value || '').trim();
          var savedService = box.getAttribute('data-saved-service');
          var hasSavedService = savedService !== null && savedService.trim() !== '';
          serviceConditionMet = currentService !== '' || hasSavedService;
        } else if (serviceDisplay) {
          serviceConditionMet = (serviceDisplay.textContent || '').trim() !== '';
        }
        if (serviceConditionMet && !box.classList.contains('checked')) {
          box.classList.add('checked');
          box.setAttribute('aria-checked', 'true');
          Hints && Hints.onAutoTick(row, false);
        }
      } else {
        box.removeAttribute('data-saved-price');
        var serviceText2 = row.querySelector('.service-input');
        var serviceDisplay2 = row.querySelector('.service-display');
        var hasService = false;
        if (serviceText2) hasService = serviceText2.value.trim() !== '';
        else if (serviceDisplay2) hasService = (serviceDisplay2.textContent || '').trim() !== '';
        if (!hasService) {
          box.classList.remove('checked');
          box.setAttribute('aria-checked', 'false');
        }
      }
    }
  }
  recalc();
});
tableCard.addEventListener('input', function(e) {
  var inp = e.target;
  if (!inp.classList.contains('service-input')) return;
  if (rejected) return;
  var row = inp.closest('.row');
  updateRowLock(row);
  if (row) {
    var box = row.querySelector('.row-check');
    if (box) {
      if (inp.value.trim() !== '') {
        if (!box.classList.contains('checked')) {
          box.classList.add('checked');
          box.setAttribute('aria-checked', 'true');
          Hints && Hints.onAutoTick(row, true);
        }
      } else {
        box.classList.remove('checked');
        box.setAttribute('aria-checked', 'false');
      }
    }
  }
  recalc();
});
tableCard.addEventListener('keydown', function(e) {
  if (e.key === 'Enter' || e.keyCode === 13) {
    if (rejected) return;
    if (e.target.classList.contains('service-input')) {
      e.preventDefault();
      var row = e.target.closest('.row');
      if (row) tryOpenCustomService(row, false);
    } else if (e.target.classList.contains('price-input')) {
      if (e.target.disabled) return;
      if (e.target.value.trim() === '') {
        e.preventDefault();
        var wrap = e.target.closest('.price-wrap');
        if (wrap) {
          wrap.classList.remove('shake');
          void wrap.offsetWidth;
          wrap.classList.add('shake');
          setTimeout(function() { wrap.classList.remove('shake'); }, 350);
        }
        haptic(15);
      } else {
        e.preventDefault();
        e.target.blur();
      }
    }
  }
});
tableCard.addEventListener('focusin', function(e) {
  var input = e.target;
  if (input && input.classList.contains('price-input')) {
    /* Only select if the field still has focus. If the pending-row
       lock bounced focus back to another row, calling select() here
       would pull focus back to this field and start a loop. */
    setTimeout(function() {
      if (document.activeElement !== input) return;
      try { input.select(); } catch (err) {}
    }, 50);
  }
});

/* ============ TIP INPUT ============ */
if (tipInput) {
  tipInput.addEventListener('input', function() {
    var digits = tipInput.value.replace(/[^0-9]/g, '');
    if (digits.length > 5) digits = digits.slice(0, 5);
    if (digits === '') tipInput.value = '';
    else tipInput.value = parseInt(digits, 10).toLocaleString();
  });
  tipInput.addEventListener('focus', function() {
    setTimeout(function() {
      if (document.activeElement !== tipInput) return;
      tipInput.select();
    }, 50);
  });
}
function setTipValue(value) {
  if (!tipInput) return;
  var v = Math.max(0, Math.min(99999, value));
  if (v === 0) tipInput.value = '';
  else tipInput.value = v.toLocaleString();
}
function getTipValue() { return tipInput ? parseFormatted(tipInput.value) : 0; }
function stepTip(delta) {
  var current = getTipValue();
  var next = current + delta;
  if (next < 0) next = 0;
  if (next > 99999) next = 99999;
  if (next === current) return false;
  setTipValue(next);
  return true;
}
function attachHoldAcceleration(buttonEl, delta) {
  if (!buttonEl) return;
  var holdDelay = 400;
  var holdTimeout = null, holdInterval = null, holdStart = 0;
  function rateForElapsed(ms) {
    if (ms < 1500) return 200;
    if (ms < 3000) return 100;
    return 50;
  }
  function tick() {
    var changed = stepTip(delta);
    if (!changed) { stop(); return; }
    var elapsed = Date.now() - holdStart;
    holdInterval = setTimeout(tick, rateForElapsed(elapsed));
  }
  function start() {
    holdStart = Date.now();
    stepTip(delta);
    haptic(10);
    holdTimeout = setTimeout(function() { tick(); }, holdDelay);
  }
  function stop() {
    if (holdTimeout) { clearTimeout(holdTimeout); holdTimeout = null; }
    if (holdInterval) { clearTimeout(holdInterval); holdInterval = null; }
  }
  buttonEl.addEventListener('contextmenu', function(e) { e.preventDefault(); });
  buttonEl.addEventListener('pointerdown', function(e) {
    e.preventDefault();
    try { buttonEl.setPointerCapture(e.pointerId); } catch (err) {}
    start();
  });
  buttonEl.addEventListener('pointerup', function() { stop(); });
  buttonEl.addEventListener('pointercancel', function() { stop(); });
  buttonEl.addEventListener('pointerleave', function() { stop(); });
  if (!window.PointerEvent) {
    buttonEl.addEventListener('touchstart', function(e) { e.preventDefault(); start(); }, { passive: false });
    buttonEl.addEventListener('touchend', function() { stop(); });
    buttonEl.addEventListener('touchcancel', function() { stop(); });
  }
}
attachHoldAcceleration(tipMinus, -100);
attachHoldAcceleration(tipPlus, 100);

/* ============ REJECT THANKS CONTENT VARIANTS ============ */
function updateRejectThanksContent() {
  var noTip = (confirmedTipAmount === 0);
  if (noTip) {
    if (rejectThanksLine) rejectThanksLine.textContent = 'どうぞお気になさらないでください。';
    if (rejectThanksSub) rejectThanksSub.innerHTML = 'マッサージを楽しみにしています。<br>本日はお部屋まで来ていただき、ありがとうございます。';
    rejectThanks.classList.add('no-tip');
  } else {
    if (rejectThanksLine) rejectThanksLine.textContent = 'かしこまりました。';
    if (rejectThanksSub) rejectThanksSub.textContent = '本日もどうぞよろしくお願いいたします。';
    rejectThanks.classList.remove('no-tip');
    if (rejectGiftAmountEl) rejectGiftAmountEl.textContent = confirmedTipAmount.toLocaleString();
  }
}

/* ============================================================
   TRANSITION-LINE BODY WRAPPER */
function wrapTransitionBody() {
  var bodyEl = document.getElementById('transitionLineBody');
  if (!bodyEl) return;
  if (bodyEl.querySelector('p')) return;
  var html = bodyEl.innerHTML;
  var parts = html.split(/<br\s*\/?>\s*<br\s*\/?>/i);
  var out = [];
  for (var i = 0; i < parts.length; i++) {
    var p = parts[i].trim();
    if (p === '') continue;
    out.push('<p>' + p + '</p>');
  }
  bodyEl.innerHTML = out.join('');
}

/* ============================================================
   TRANSITION-LINE & TABLE GEOMETRY CACHE */
var _tlDocTop = 0, _tlHeight = 0;
var _tcDocTop = 0, _tcHeight = 0;
var _rrDocTop = 0, _rrHeight = 0;
var _row0DocTop = 0;
var _row1DocTop = 0, _row1Height = 0;

function refreshTransitionGeometry() {
  var scrollY = window.scrollY || window.pageYOffset || 0;

  var lineWrapper = document.getElementById('transitionLine');
  if (lineWrapper) {
    var rTl = lineWrapper.getBoundingClientRect();
    _tlDocTop = rTl.top + scrollY;
    _tlHeight = rTl.height;
  }

  var tc = document.getElementById('tableCard');
  if (tc) {
    var rTc = tc.getBoundingClientRect();
    _tcDocTop = rTc.top + scrollY;
    _tcHeight = rTc.height;

    var rows = tc.querySelectorAll('.row');
    if (rows.length > 0) {
      _row0DocTop = rows[0].getBoundingClientRect().top + scrollY;
    }
    if (rows.length > 1) {
      var r1 = rows[1].getBoundingClientRect();
      _row1DocTop = r1.top + scrollY;
      _row1Height = r1.height;
    }
  }

  var rr = document.getElementById('rejectRow');
  if (rr) {
    var rRr = rr.getBoundingClientRect();
    _rrDocTop = rRr.top + scrollY;
    _rrHeight = rRr.height;
  }
}

/* ============================================================
   SUMMARY HEIGHT MEASUREMENT
   ------------------------------------------------------------
   Publishes --summary-h on the root element so the HUD-lift rule
   in main.css (body.info-visible:has(.summary.visible)
   .audio-spectrum-hud.shown) can raise the HUD by the summary's
   rendered height. Measured rather than hard-coded because the
   summary's padding, breakpoint scaling (min-width 700 / 1100,
   max-height 700 / 600), and env(safe-area-inset-bottom) all vary
   with viewport.

   offsetHeight is unaffected by the summary's visibility
   transition — the show/hide animation runs on opacity and
   transform, neither of which changes layout height — so the
   measured value is stable across the toggle. Re-measured by a
   ResizeObserver bound in window.load and by the existing resize /
   orientationchange handlers. */
function measureSummaryHeight() {
  if (!summaryBar) return;
  var h = summaryBar.offsetHeight;
  if (h > 0) {
    document.documentElement.style.setProperty('--summary-h', h + 'px');
  }
}

/* ============================================================
   TRANSITION-LINE ACCORDION DRIFT */
var DRIFT_CONFIG = {
  LINE_SPREAD_FACTOR: 0.075,
  MAX_LINE_SPREAD_PX: 38,
  GLOBAL_DRIFT_FACTOR: 0.08,
  HORIZONTAL_SWAY_PX: 20,
  CORE_ZONE_PX: 180,
  MAX_ZONE_PX: 420,
  LAST_LINE_MAX_DOWN_PX: 6
};
var _tlDriftActive = false;

function updateTransitionBodyEffects() {
  var lineWrapper = document.getElementById('transitionLine');
  var bodyEl = document.getElementById('transitionLineBody');
  if (!lineWrapper || !bodyEl) return;

  var dividerEl = lineWrapper.querySelector('.transition-line-divider');
  var paragraphs = Array.prototype.slice.call(bodyEl.querySelectorAll('p'));
  if (!paragraphs.length) return;

  var driftItems = dividerEl ? [dividerEl].concat(paragraphs) : paragraphs;
  var totalItems = driftItems.length;
  var centerIdx = (totalItems - 1) / 2;

  var scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
  var vh = window.innerHeight;
  var vc = vh / 2;

  var rectTop = _tlDocTop - scrollY;
  var blockCenter = rectTop + _tlHeight / 2;
  var d = blockCenter - vc;
  var absDist = Math.abs(d);

  if (scrollY <= 0 || absDist >= DRIFT_CONFIG.MAX_ZONE_PX) {
    if (_tlDriftActive) {
      _tlDriftActive = false;
      for (var k = 0; k < totalItems; k++) {
        driftItems[k]._lastDriftStr = '';
        driftItems[k].style.transform = '';
      }
    }
    return;
  }
  _tlDriftActive = true;

  var envelope = 1.0;
  if (absDist > DRIFT_CONFIG.CORE_ZONE_PX) {
    var t = (DRIFT_CONFIG.MAX_ZONE_PX - absDist) / (DRIFT_CONFIG.MAX_ZONE_PX - DRIFT_CONFIG.CORE_ZONE_PX);
    envelope = t * t * (3 - 2 * t);
  }

  var globalShift = -d * DRIFT_CONFIG.GLOBAL_DRIFT_FACTOR * envelope;
  var normalizedD = Math.max(-1, Math.min(1, d / (vh / 2)));

  function itemShiftY(idx) {
    var distFromCenter = idx - centerIdx;
    var maxSpread = DRIFT_CONFIG.MAX_LINE_SPREAD_PX * (Math.abs(distFromCenter) / centerIdx);
    var spread = distFromCenter * (absDist * DRIFT_CONFIG.LINE_SPREAD_FACTOR);
    return globalShift + Math.max(-maxSpread, Math.min(maxSpread, spread)) * envelope;
  }

  /* The divider below the block does not drift, and the gap to it is
     small, so the last line may only travel down a few pixels. Anything
     beyond that moves the whole block up, which keeps the spacing
     between the lines and stops the last line sliding under the divider. */
  var blockLift = Math.max(0, itemShiftY(totalItems - 1) - DRIFT_CONFIG.LAST_LINE_MAX_DOWN_PX);

  for (var i = 0; i < totalItems; i++) {
    var item = driftItems[i];
    var lineDistFromCenter = i - centerIdx;

    var totalY = itemShiftY(i) - blockLift;

    var swayMultiplier = (dividerEl && i === 0) ? 0.35 : 1.0;
    var swayDir = (i % 2 === 0) ? 1 : -1;
    var swayX = swayDir * normalizedD * DRIFT_CONFIG.HORIZONTAL_SWAY_PX * swayMultiplier * envelope;

    var nextTransform = 'translate(' + swayX.toFixed(2) + 'px, ' + totalY.toFixed(2) + 'px)';
    if (item._lastDriftStr !== nextTransform) {
      item._lastDriftStr = nextTransform;
      item.style.transform = nextTransform;
    }
  }
}

/* ============================================================
   RECEIPT SCROLL RESET + INDICATOR */
var RECEIPT_IND_X = 26;
var RECEIPT_IND_Y = 10;
var RECEIPT_IND_SIZE = 34;

function resetReceiptScroll() {
  try {
    if (document.activeElement && document.activeElement.blur) {
      document.activeElement.blur();
    }
  } catch (e) { /* silent */ }
  if (receiptScreen) receiptScreen.scrollTop = 0;
  if (receiptScreen) {
    var paper = receiptScreen.querySelector('.receipt-paper');
    if (paper) paper.scrollTop = 0;
  }
}

function updateReceiptScrollIndicator() {
  if (!receiptScrollIndicatorEl) {
    receiptScrollIndicatorEl = document.getElementById('receiptScrollIndicator');
  }
  if (!receiptScrollIndicatorEl || !receiptScreen) return;

  if (!receiptScreen.classList.contains('visible')) {
    receiptScrollIndicatorEl.classList.remove('shown');
    return;
  }

  var paper = receiptScreen.querySelector('.receipt-paper');
  if (!paper) {
    receiptScrollIndicatorEl.classList.remove('shown');
    return;
  }

  var scrollable = paper.scrollHeight > paper.clientHeight + 4;
  var atBottom = paper.scrollTop + paper.clientHeight >= paper.scrollHeight - 4;
  if (!scrollable || atBottom) {
    receiptScrollIndicatorEl.classList.remove('shown');
    return;
  }

  var rect = paper.getBoundingClientRect();
  var left = rect.right - RECEIPT_IND_X - RECEIPT_IND_SIZE / 2;
  var bottom = (window.innerHeight - rect.bottom) + RECEIPT_IND_Y;
  receiptScrollIndicatorEl.style.left = left + 'px';
  receiptScrollIndicatorEl.style.bottom = bottom + 'px';
  receiptScrollIndicatorEl.classList.add('shown');
}

/* ============================================================
   KOI WATER EFFECTS
   ------------------------------------------------------------
   The ripple palettes mirror the autumn tokens --bg-base (絹白
   Kinushiro), --glow (金木犀 glow), and --petal-soft. Update them
   in lockstep with the palette block in main.css if those tokens
   change. The sakura theme reuses the same literals here because
   the ripples are only ever spawned on the koi screen, which is
   gated behind the same mapleLeaves .active class the theme
   toggle already keys on. */
var RIPPLE_COLOURS_STRONG = [
  'rgba(255, 253, 249, 0.95)',
  'rgba(255, 162, 89, 0.85)',
  'rgba(253, 232, 218, 0.70)'
];
var RIPPLE_COLOURS_SUBTLE = [
  'rgba(255, 162, 89, 0.55)',
  'rgba(253, 232, 218, 0.40)'
];
var RIPPLE_COLOURS_TRAIL  = ['rgba(255, 162, 89, 0.40)'];

var KOI_RISE_MAX = 40;
var KOI_RISE_FACTOR = 0.35;
var KOI_SWIPE_THRESHOLD = 60;
var KOI_TRAIL_INTERVAL = 90;
var KOI_TRAIL_MIN_TRAVEL = 18;
var KOI_TAP_MAX_TRAVEL = 8;
var KOI_TAP_MAX_MS = 250;

var koiGestureState = 'idle';
var koiActivePointerId = null;
var koiStartY = 0;
var koiCurrentY = 0;
var koiLastTrailAt = 0;
var koiTimers = [];

var koiFlinchActive = false;
var koiTapStartX = 0;
var koiTapStartY = 0;
var koiTapStartTime = 0;
var koiTapOnKoi = false;

var ambientRippleTimer = null;

function koiPushTimer(id) { koiTimers.push(id); return id; }
function clearKoiTimers() {
  for (var i = 0; i < koiTimers.length; i++) clearTimeout(koiTimers[i]);
  koiTimers = [];
}

function spawnRipples(clientX, clientY, intensity) {
  if (!rippleLayer) return;
  var palette, cls, baseSize;
  if (intensity === 'strong') {
    palette = RIPPLE_COLOURS_STRONG;
    cls = '';
    baseSize = 30;
  } else if (intensity === 'trail') {
    palette = RIPPLE_COLOURS_TRAIL;
    cls = ' trail';
    baseSize = 22;
  } else {
    palette = RIPPLE_COLOURS_SUBTLE;
    cls = ' subtle';
    baseSize = 26;
  }

  for (var i = 0; i < palette.length; i++) {
    (function(idx) {
      var r = document.createElement('div');
      r.className = 'ripple' + cls;
      var jitterX = (idx - (palette.length - 1) / 2) * 3 + (Math.random() * 4 - 2);
      var jitterY = (idx - (palette.length - 1) / 2) * 3 + (Math.random() * 4 - 2);
      r.style.left = (clientX + jitterX) + 'px';
      r.style.top  = (clientY + jitterY) + 'px';
      r.style.color = palette[idx];
      r.style.animationDelay = (idx * 150) + 'ms';
      r.style.width  = (baseSize + idx * 6) + 'px';
      r.style.height = (baseSize + idx * 6) + 'px';
      rippleLayer.appendChild(r);
      setTimeout(function() {
        if (r.parentNode) r.parentNode.removeChild(r);
      }, 2110 + idx * 150);
    })(i);
  }
}

/* ============ THE NAME, WRITTEN STROKE BY STROKE ============
   Like the macOS "hello" screen, the name is written one stroke at a
   time in the proper stroke order, the pen lifting between strokes.
   What appears is the Yuji Syuku character itself: a round brush that
   follows each stroke's centre line (NAME_STROKE_DATA, in strokes.js)
   uncovers it. The brush presses a little at the start of a
   stroke and lifts at the end. Fresh ink is wet (soft, with a pale
   bloom) and dries sharp over about half a second, and a faint light
   rides the brush tip. Once a character's last stroke is done, any edge
   the brush missed fills in softly (NAME_SETTLE s). Each character is a
   canvas (.name-char-drawn in main.css); the fade-out (inkFade) is as
   before. A character with no stroke data (a rare kanji, an emoji) is
   brushed in the old way (inkBrush / inkDry) in its turn, and has
   settled NAME_ARRIVE s after it starts.

   Pacing: a stroke takes NAME_STROKE_BASE s plus NAME_STROKE_PER_LEN s
   per full character width of length; the pen lifts NAME_PEN_LIFT s
   between strokes and NAME_CHAR_GAP s between characters. If the name
   would take longer than NAME_WRITE_MAX s, all of it is sped up to fit.
   On the way out each character fades NAME_EXIT_STAGGER s after the one
   above it, over NAME_EXIT s. */
var NAME_STAGGER = 0.42, NAME_ARRIVE = 1.7, NAME_EXIT_STAGGER = 0.24, NAME_EXIT = 1.4;
var NAME_LEAD_IN = 0.25, NAME_STROKE_BASE = 0.14, NAME_STROKE_PER_LEN = 0.24,
    NAME_PEN_LIFT = 0.07, NAME_CHAR_GAP = 0.2, NAME_WRITE_MAX = 4.2,
    NAME_BRUSH = 0.1, NAME_WET = 0.55, NAME_SETTLE = 0.4;
var nameStrokeIndex = null, nameDrawRaf = 0, nameInkTmp = null, nameWetTmp = null;

/* The stroke data is in strokes.js (about 1.4 MB), loaded once the page
   has loaded, well before a name is confirmed. Until it arrives, or if it
   fails to load, a name is brushed in the old way (see nameStrokes); a
   failed load is tried again the next time a name is written. */
function loadNameStrokes() {
  if (typeof NAME_STROKE_DATA === 'string' || document.getElementById('nameStrokesScript')) return;
  var s = document.createElement('script');
  s.id = 'nameStrokesScript';
  s.src = 'strokes.js';
  s.onerror = function() { s.remove(); };
  document.head.appendChild(s);
}

/* The strokes of one character, or null. Each coordinate is one
   character: 91 steps from -6 to 115 on KanjiVG's 109-unit square. A
   stroke is its start point, then cubic segments (two control points
   and an end point); each is sampled into a polyline with its running
   length. */
function nameStrokes(ch) {
  if (typeof NAME_STROKE_DATA !== 'string') return null;
  if (!nameStrokeIndex) {
    nameStrokeIndex = {};
    var list = NAME_STROKE_DATA.split(',');
    for (var i = 0; i < list.length; i++) {
      var key = String.fromCodePoint(list[i].codePointAt(0));
      nameStrokeIndex[key] = list[i].slice(key.length);
    }
  }
  var raw = nameStrokeIndex[ch];
  if (!raw) return null;
  var strokes = raw.split(' '), out = [];
  for (var s = 0; s < strokes.length; s++) {
    var str = strokes[s], v = [];
    for (var k = 0; k < str.length; k++) {
      var c = str.charCodeAt(k);
      v.push(-6 + (c - 0x21 - (c > 0x22) - (c > 0x2c) - (c > 0x5c)) * (121 / 90));
    }
    var pts = [v[0], v[1]], lens = [0], total = 0;
    for (var j = 2; j + 5 < v.length; j += 6) {
      var x0 = pts[pts.length - 2], y0 = pts[pts.length - 1];
      for (var n = 1; n <= 12; n++) {
        var t = n / 12, u = 1 - t;
        var x = u * u * u * x0 + 3 * u * u * t * v[j] + 3 * u * t * t * v[j + 2] + t * t * t * v[j + 4];
        var y = u * u * u * y0 + 3 * u * u * t * v[j + 1] + 3 * u * t * t * v[j + 3] + t * t * t * v[j + 5];
        total += Math.hypot(x - pts[pts.length - 2], y - pts[pts.length - 1]);
        pts.push(x, y); lens.push(total);
      }
    }
    out.push({ pts: pts, lens: lens, total: total, drawn: -1, seg: 0 });
  }
  return out;
}

function nameCanvas(w) {
  var c = document.createElement('canvas');
  c.width = c.height = w;
  return c;
}

/* Draws the character in the brush font onto item.glyph, placed as the
   old span placed it (line-height 1), and fits the stroke centre lines
   to its ink: KanjiVG's square is one em, nudged and stretched (within
   limits) per axis so the strokes sit over this font's strokes. */
function nameGlyph(item) {
  var g = item.glyph.getContext('2d'), em = item.em * item.dpr, off = 0.3 * em;
  g.clearRect(0, 0, item.glyph.width, item.glyph.height);
  g.font = '500 ' + em + 'px ' + item.family;
  g.fillStyle = '#FFFDF9';
  g.textAlign = 'center';
  g.textBaseline = 'alphabetic';
  var m = g.measureText(item.ch);
  var asc = m.fontBoundingBoxAscent, desc = m.fontBoundingBoxDescent;
  if (!(asc + desc > 0)) { asc = em * 0.88; desc = em * 0.12; }
  var base = off + (em - asc - desc) / 2 + asc;
  g.fillText(item.ch, off + em / 2, base);

  var k = em / 109, minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
  for (var s = 0; s < item.strokes.length; s++) {
    var p = item.strokes[s].pts;
    for (var i = 0; i < p.length; i += 2) {
      if (p[i] < minX) minX = p[i]; if (p[i] > maxX) maxX = p[i];
      if (p[i + 1] < minY) minY = p[i + 1]; if (p[i + 1] > maxY) maxY = p[i + 1];
    }
  }
  function fit(sMin, sMax, iMin, iMax) {
    var a = k;
    if (!(iMax > iMin)) return [a, off];
    var sw = (sMax - sMin) * k, iw = (iMax - iMin) - 0.09 * em;   /* the ink box includes the stroke's width */
    if (sw > em * 0.25 && iw > 0) a = k * Math.max(0.8, Math.min(1.25, iw / sw));
    return [a, (iMin + iMax) / 2 - a * (sMin + sMax) / 2];
  }
  var cx = off + em / 2;
  var fx = fit(minX, maxX, cx - m.actualBoundingBoxLeft, cx + m.actualBoundingBoxRight);
  var fy = fit(minY, maxY, base - m.actualBoundingBoxAscent, base + m.actualBoundingBoxDescent);
  item.ax = fx[0]; item.bx = fx[1]; item.ay = fy[0]; item.by = fy[1];
}

/* Moves the brush along stroke st to distance d (units), stamping round
   dabs on the mask and on the wet layer. It presses a little at the
   start (wider) and lifts at the end (narrower). */
function nameBrushTo(item, st, d) {
  var from = Math.max(0, st.drawn), mk = item.mask.getContext('2d'), wt = item.wet.getContext('2d');
  var r0 = NAME_BRUSH * item.em * item.dpr;
  mk.fillStyle = wt.fillStyle = '#fff';
  for (var at = from; ; at = Math.min(d, at + 0.8)) {
    while (st.seg < st.lens.length - 2 && st.lens[st.seg + 1] < at) st.seg++;
    var i = st.seg, l0 = st.lens[i], l1 = st.lens[i + 1] !== undefined ? st.lens[i + 1] : l0;
    var f = l1 > l0 ? Math.min(1, Math.max(0, (at - l0) / (l1 - l0))) : 0;
    var p = st.pts, j = i * 2;
    var X = p[j] + ((p[j + 2] !== undefined ? p[j + 2] : p[j]) - p[j]) * f;
    var Y = p[j + 1] + ((p[j + 3] !== undefined ? p[j + 3] : p[j + 1]) - p[j + 1]) * f;
    var u = st.total > 0 ? at / st.total : 1;
    var press = Math.max(0, 1 - u / 0.2), lift = Math.max(0, (u - 0.8) / 0.2);
    var r = r0 * (1 + 0.15 * press * press - 0.12 * lift * lift);
    var px = item.ax * X + item.bx, py = item.ay * Y + item.by;
    mk.beginPath(); mk.arc(px, py, r, 0, Math.PI * 2); mk.fill();
    wt.beginPath(); wt.arc(px, py, r, 0, Math.PI * 2); wt.fill();
    item.tipX = px; item.tipY = py;
    if (at >= d) break;
  }
  st.drawn = d;
}

/* One frame of one character: the ink so far (with the old text
   shadow), the wet ink over it, soft and glowing, and the light at the
   brush tip. */
function nameCompose(item, dt) {
  var W = item.el.width;
  if (!nameInkTmp || nameInkTmp.width !== W) { nameInkTmp = nameCanvas(W); nameWetTmp = nameCanvas(W); }
  var ic = nameInkTmp.getContext('2d'), wc = nameWetTmp.getContext('2d'), wt = item.wet.getContext('2d');
  var v = item.el.getContext('2d'), dpr = item.dpr;

  ic.globalCompositeOperation = 'copy'; ic.drawImage(item.mask, 0, 0);
  ic.globalCompositeOperation = 'source-in'; ic.drawImage(item.glyph, 0, 0);
  ic.globalCompositeOperation = 'source-over';
  if (item.settle > 0) { ic.globalAlpha = item.settle; ic.drawImage(item.glyph, 0, 0); ic.globalAlpha = 1; }

  wt.globalCompositeOperation = 'destination-out';
  wt.fillStyle = 'rgba(0, 0, 0, ' + (1 - Math.exp(-dt / NAME_WET)) + ')';
  wt.fillRect(0, 0, W, W);
  wt.globalCompositeOperation = 'source-over';

  v.clearRect(0, 0, W, W);
  v.save();
  v.shadowColor = 'rgba(80, 40, 10, 0.35)'; v.shadowBlur = 20 * dpr; v.shadowOffsetY = 2 * dpr;
  v.drawImage(nameInkTmp, 0, 0);
  v.restore();
  if (!item.done) {
    wc.globalCompositeOperation = 'copy'; wc.drawImage(item.wet, 0, 0);
    wc.globalCompositeOperation = 'source-in'; wc.drawImage(item.glyph, 0, 0);
    wc.globalCompositeOperation = 'source-over';
    v.save();
    v.filter = 'blur(' + (2.5 * dpr) + 'px)';
    v.shadowColor = 'rgba(255, 246, 230, 0.55)'; v.shadowBlur = 26 * dpr;
    v.drawImage(nameWetTmp, 0, 0);
    v.restore();
    if (item.tip > 0.01) {
      var R = 0.16 * item.em * dpr;
      var gr = v.createRadialGradient(item.tipX, item.tipY, 0, item.tipX, item.tipY, R);
      gr.addColorStop(0, 'rgba(255, 250, 238, ' + (0.45 * item.tip) + ')');
      gr.addColorStop(1, 'rgba(255, 250, 238, 0)');
      v.fillStyle = gr;
      v.fillRect(item.tipX - R, item.tipY - R, R * 2, R * 2);
    }
  }
}

function nameDrawFrame(items, t0, last) {
  nameDrawRaf = requestAnimationFrame(function (now) {
    var T = (now - t0) / 1000, dt = Math.min(0.1, (now - last) / 1000), busy = false;
    for (var n = 0; n < items.length; n++) {
      var item = items[n];
      if (item.done || !item.el.isConnected) continue;
      busy = true;
      if (T < item.start) continue;
      var drawing = false;
      for (var s = 0; s < item.strokes.length; s++) {
        var st = item.strokes[s], plan = item.plan[s];
        if (T < plan.start || st.drawn >= st.total) continue;
        var q = Math.min(1, (T - plan.start) / (plan.end - plan.start));
        var e = 0.35 * q + 0.65 * (0.5 - 0.5 * Math.cos(Math.PI * q));   /* eases in and out of the stroke */
        nameBrushTo(item, st, q >= 1 ? st.total : st.total * e);
        if (q < 1) drawing = true;
      }
      item.tip = drawing ? 1 : item.tip * Math.exp(-dt / 0.12);
      item.settle = Math.max(0, Math.min(1, (T - item.end) / NAME_SETTLE));
      if (T > item.end + NAME_SETTLE + NAME_WET * 4) item.done = true;
      nameCompose(item, dt);
    }
    if (busy) nameDrawFrame(items, t0, now);
    else nameDrawRaf = 0;
  });
}

/* Builds the name in #nameColumn and starts writing it. Returns how
   long (s) until the whole name has arrived. */
function renderIntroGlyph(text) {
  loadNameStrokes();
  if (!nameColumn) return 0;
  if (nameDrawRaf) { cancelAnimationFrame(nameDrawRaf); nameDrawRaf = 0; }
  nameColumn.innerHTML = '';
  var chars = Array.from(text || '心');
  var dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  var t = NAME_LEAD_IN, items = [], all = [];
  for (var i = 0; i < chars.length; i++) {
    var strokes = nameStrokes(chars[i]), el = null;
    if (strokes && strokes.length) {
      el = document.createElement('canvas');
      el.className = 'name-char name-char-drawn';
      el.textContent = chars[i];
      if (!el.getContext('2d')) el = null;
    }
    if (!el) {
      el = document.createElement('span');
      el.className = 'name-char';
      el.textContent = chars[i];
      nameColumn.appendChild(el);
      all.push({ el: el, start: t });
      t += NAME_STAGGER + NAME_CHAR_GAP;
      continue;
    }
    nameColumn.appendChild(el);
    var cs = getComputedStyle(el), em = parseFloat(cs.fontSize) || 120;
    var W = Math.round(1.6 * em * dpr);
    el.width = el.height = W;
    var item = { el: el, ch: chars[i], strokes: strokes, em: em, dpr: dpr, family: cs.fontFamily,
                 glyph: nameCanvas(W), mask: nameCanvas(W), wet: nameCanvas(W),
                 start: t, plan: [], tip: 0, tipX: 0, tipY: 0, settle: 0, done: false };
    for (var s = 0; s < strokes.length; s++) {
      var dur = NAME_STROKE_BASE + NAME_STROKE_PER_LEN * strokes[s].total / 109;
      item.plan.push({ start: t, end: t + dur });
      t += dur + NAME_PEN_LIFT;
    }
    t += NAME_CHAR_GAP - NAME_PEN_LIFT;
    nameGlyph(item);
    items.push(item); all.push(item);
  }
  /* too long: speed the whole name up to fit */
  var span = t - NAME_CHAR_GAP - NAME_LEAD_IN;
  var f = span > NAME_WRITE_MAX ? NAME_WRITE_MAX / span : 1;
  function sc(x) { return NAME_LEAD_IN + (x - NAME_LEAD_IN) * f; }
  var arrive = 0;
  for (var a = 0; a < all.length; a++) {
    var it = all[a];
    it.start = sc(it.start);
    if (!it.plan) {
      it.el.style.animationDelay = it.start + 's';
      arrive = Math.max(arrive, it.start + NAME_ARRIVE);
      continue;
    }
    for (var p = 0; p < it.plan.length; p++) { it.plan[p].start = sc(it.plan[p].start); it.plan[p].end = sc(it.plan[p].end); }
    it.end = it.plan[it.plan.length - 1].end;
    arrive = Math.max(arrive, it.end + NAME_SETTLE);
  }
  /* if the brush font is still on its way, draw the characters again in
     it once it has come (strokes already written stay where they are) */
  if (items.length && document.fonts && document.fonts.load) {
    document.fonts.load('500 ' + items[0].em + 'px ' + items[0].family, text).then(function () {
      for (var r = 0; r < items.length; r++) {
        var it = items[r];
        if (it.done || !it.el.isConnected) continue;
        var fitWas = [it.ax, it.bx, it.ay, it.by];
        nameGlyph(it);
        if (it.strokes[0].drawn >= 0) { it.ax = fitWas[0]; it.bx = fitWas[1]; it.ay = fitWas[2]; it.by = fitWas[3]; }
      }
    }).catch(function () {});
  }
  if (items.length) { var t0 = performance.now(); nameDrawFrame(items, t0, t0); }
  return arrive;
}

function isBlossomInteractive() {
  return blossomScreen && blossomScreen.classList.contains('visible') && !introHasRun;
}

/* ============ START-SCREEN NOTICE ============
   The start screen is shown and sounding as normal; this box simply
   floats over it. It swallows touches until dismissed. On tap the text
   fades, then the box. */
var startNoticeOpen = false;
function showStartNotice() {
  var box = document.getElementById('startNotice');
  var btn = document.getElementById('startNoticeBtn');
  if (!box || !btn || startNoticeOpen) return;
  startNoticeOpen = true;
  blossomScreen.classList.add('notice-hold');
  ['pointerdown', 'pointermove', 'pointerup', 'touchstart', 'touchmove', 'touchend'].forEach(function(type) {
    box.addEventListener(type, function(e) { e.stopPropagation(); }, { passive: true });
  });
  btn.addEventListener('click', function() {
    /* the box swallows the press, so the document's own first-touch
       hook never sees it: start (or wake) the sound from here */
    initSound();
    if (soundAudioCtx && soundAudioCtx.state === 'suspended') { try { soundAudioCtx.resume(); } catch (e) {} }
    haptic(8);
    box.classList.add('text-out');
    setTimeout(function() {
      box.classList.add('closing');
      /* the start screen's own text arrives as the box fades */
      blossomScreen.classList.remove('notice-hold');
      tryStartBlossomStream();
      setTimeout(function() {
        box.classList.remove('shown', 'closing');
        startNoticeOpen = false;
        Hints && Hints.onStartScreen();
      }, 700);
    }, 600);
  }, { once: true });
  box.classList.add('shown');
}

function stopAmbientRipple() {
  if (ambientRippleTimer) {
    clearTimeout(ambientRippleTimer);
    ambientRippleTimer = null;
  }
}

function spawnAmbientBurst() {
  if (!rippleLayer) return;
  var count = Math.random() < 0.25 ? 2 : 1;
  var inset = 40;
  var vw = window.innerWidth;
  var vh = window.innerHeight;
  for (var i = 0; i < count; i++) {
    (function(idx) {
      var delay = idx * (400 + Math.random() * 500);
      setTimeout(function() {
        if (!isBlossomInteractive()) return;
        var x = inset + Math.random() * Math.max(1, vw - inset * 2);
        var y = inset + Math.random() * Math.max(1, vh - inset * 2);
        spawnRipples(x, y, 'subtle');
      }, delay);
    })(i);
  }
}

/* ============ POND LIFE (bubbles and florets) ============
   Two quiet extras on the start screen, run on the same lifecycle as
   the ambient ripples (startPondLife / stopPondLife are called next to
   scheduleAmbientRipple / stopAmbientRipple):

     bubbles — 1–3 small bubbles rise past the koi about every 2s,
               a nudge that "up" is the way in
     florets — a 金木犀 floret drifts down about every 1s, lands on
               the water with a small ripple, floats, then fades

   Both are Web Animations on transform and opacity, so the
   compositor does the work. Under reduced motion neither is built. */
var pondBubbleBox = document.getElementById('pondBubbles');
var floretLayer = document.getElementById('floretLayer');
var pondBubbleTimer = null;
var floretTimer = null;
var pondClearTimer = null;

var FLORET_SVG = '<svg viewBox="-7 -7 14 14" width="14" height="14">' +
  '<g fill="#F07D40"><circle cx="0" cy="-3" r="2.9"/><circle cx="3" cy="0" r="2.9"/>' +
  '<circle cx="0" cy="3" r="2.9"/><circle cx="-3" cy="0" r="2.9"/></g>' +
  '<circle r="1.5" fill="#C44E10"/></svg>';

function spawnPondBubble(delay) {
  if (!pondBubbleBox) return;
  var b = document.createElement('div');
  b.className = 'pond-bubble';
  var size = 4 + Math.random() * 4;
  var x0 = Math.random() * 36 - 18;
  var rise = 95 + Math.random() * 40;
  var dur = 2600 + Math.random() * 1200;
  var wob = 4 + Math.random() * 4;
  b.style.width = b.style.height = size + 'px';
  b.style.marginLeft = b.style.marginTop = (-size / 2) + 'px';
  b.style.opacity = '0';
  pondBubbleBox.appendChild(b);
  var a = b.animate([
    { transform: 'translate(' + x0 + 'px, 62px) scale(0.6)', opacity: 0 },
    { transform: 'translate(' + (x0 + wob) + 'px, 30px) scale(0.85)', opacity: 0.9, offset: 0.25 },
    { transform: 'translate(' + (x0 - wob) + 'px, -5px) scale(1)', opacity: 0.9, offset: 0.55 },
    { transform: 'translate(' + (x0 + wob * 0.5) + 'px, ' + (62 - rise * 0.85) + 'px) scale(1.1)', opacity: 0.85, offset: 0.88 },
    { transform: 'translate(' + x0 + 'px, ' + (62 - rise) + 'px) scale(1.9)', opacity: 0 }
  ], { duration: dur, delay: delay, easing: 'cubic-bezier(0.4, 0, 0.7, 1)', fill: 'both' });
  a.onfinish = function() { if (b.parentNode) b.parentNode.removeChild(b); };
}

function spawnFloret() {
  if (!floretLayer) return;
  var f = document.createElement('div');
  f.className = 'kinmokusei-floret';
  f.innerHTML = FLORET_SVG;
  floretLayer.appendChild(f);
  var W = window.innerWidth, H = window.innerHeight;
  var x0 = W * (0.12 + Math.random() * 0.76);
  var x1 = Math.min(W - 30, Math.max(30, x0 + (Math.random() * 160 - 80)));
  var y1 = H * (0.3 + Math.random() * 0.55);
  var s = 0.8 + Math.random() * 0.5;
  var r0 = Math.random() * 360;
  var sway = 22 + Math.random() * 18;
  var fall = 7000 + Math.random() * 3000;
  var steps = [];
  for (var i = 0; i <= 6; i++) {
    var t = i / 6;
    var x = x0 + (x1 - x0) * t + Math.sin(t * Math.PI * 3) * sway * (1 - t * 0.6);
    var y = -20 + (y1 + 20) * t;
    steps.push({
      transform: 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) rotate(' + (r0 + t * 220).toFixed(0) + 'deg) scale(' + s.toFixed(2) + ')',
      opacity: i === 0 ? 0 : 1
    });
  }
  var a = f.animate(steps, { duration: fall, easing: 'cubic-bezier(0.3, 0, 0.55, 1)', fill: 'forwards' });
  a.onfinish = function() {
    if (!f.parentNode) return;
    spawnRipples(x1 + 7 * s, y1 + 7 * s, 'trail');
    var end = 'translate(' + (x1 + 10).toFixed(1) + 'px,' + (y1 + 4).toFixed(1) + 'px) rotate(' + (r0 + 250).toFixed(0) + 'deg) scale(' + (s * 0.9).toFixed(2) + ')';
    var b = f.animate([steps[6], { transform: end, opacity: 0 }], { duration: 6000, easing: 'ease-in', fill: 'forwards' });
    b.onfinish = function() { if (f.parentNode) f.parentNode.removeChild(f); };
  };
}

function schedulePondBubble(first) {
  var wait = first ? 3200 : 2000 * (0.7 + Math.random() * 0.6);
  pondBubbleTimer = setTimeout(function() {
    pondBubbleTimer = null;
    if (!isBlossomInteractive()) return;
    var count = 1 + Math.floor(Math.random() * 3);
    for (var i = 0; i < count; i++) spawnPondBubble(i * (260 + Math.random() * 300));
    schedulePondBubble(false);
  }, wait);
}

function scheduleFloret(first) {
  var wait = first ? 1800 : 1000 * (0.7 + Math.random() * 0.6);
  floretTimer = setTimeout(function() {
    floretTimer = null;
    if (!isBlossomInteractive()) return;
    spawnFloret();
    scheduleFloret(false);
  }, wait);
}

function startPondLife() {
  if (_prefersReducedMotion) return;
  if (pondClearTimer) { clearTimeout(pondClearTimer); pondClearTimer = null; }
  if (floretLayer) { floretLayer.style.transition = ''; floretLayer.style.opacity = ''; }
  if (pondBubbleTimer) clearTimeout(pondBubbleTimer);
  if (floretTimer) clearTimeout(floretTimer);
  schedulePondBubble(true);
  scheduleFloret(true);
}

/* Stops new bubbles and florets and lets the ones in flight fade out
   with the start screen, so nothing is left over the panels. */
function stopPondLife() {
  if (pondBubbleTimer) { clearTimeout(pondBubbleTimer); pondBubbleTimer = null; }
  if (floretTimer) { clearTimeout(floretTimer); floretTimer = null; }
  if (floretLayer) {
    floretLayer.style.transition = 'opacity 600ms ease';
    floretLayer.style.opacity = '0';
  }
  if (pondClearTimer) clearTimeout(pondClearTimer);
  pondClearTimer = setTimeout(function() {
    pondClearTimer = null;
    if (floretLayer) floretLayer.innerHTML = '';
    if (pondBubbleBox) pondBubbleBox.innerHTML = '';
  }, 700);
}

function scheduleAmbientRipple() {
  stopAmbientRipple();
  var interval = 500 * (0.7 + Math.random() * 0.6);
  ambientRippleTimer = setTimeout(function() {
    ambientRippleTimer = null;
    if (isBlossomInteractive()) {
      spawnAmbientBurst();
      scheduleAmbientRipple();
    }
  }, interval);
}

/* (The DOM snowflake builder that stood here was replaced by the canvas
   snow in DynBG, further down.) */

/* ============ 霞灯 LANTERNS (Akari half of the background) ============
   Each lantern is a small glowing dot sitting on the centre of one
   Shippō circle, plus a larger, fainter bloom behind the pattern.
   The 60×60 tile has circle centres every 30px on a checkerboard
   (column + row even), so a lantern at grid (i, j) lands exactly on
   a ring. The CSS animation (lanternGlow) only fades opacity; when a
   lantern finishes a cycle, animationiteration moves it to a
   neighbouring ring, mostly continuing in the same diagonal, like
   lights being lit along a path. Numbers from the tablet tuning:
   10 lights, ×1.90 speed (set in main.css). Under reduced motion
   nothing is built — the lanterns would be invisible anyway. */
var LANTERN_COUNT = 10;
var LANTERN_TILE = 60;
var _lanterns = [];

function lanternBounds() {
  var half = LANTERN_TILE / 2;
  return { half: half, maxI: Math.floor(window.innerWidth / half), maxJ: Math.floor(window.innerHeight / half) };
}
function lanternPlace(L) {
  var half = LANTERN_TILE / 2;
  var dot = LANTERN_TILE * 1.5, glow = LANTERN_TILE * 4;
  L.dot.style.transform = 'translate3d(' + (L.i * half - dot / 2) + 'px,' + (L.j * half - dot / 2) + 'px,0)';
  L.glow.style.transform = 'translate3d(' + (L.i * half - glow / 2) + 'px,' + (L.j * half - glow / 2) + 'px,0)';
}
function lanternRandomSpot() {
  var b = lanternBounds();
  var i = 1 + Math.floor(Math.random() * Math.max(1, b.maxI - 1));
  var j = 1 + Math.floor(Math.random() * Math.max(1, b.maxJ - 1));
  if ((i + j) % 2) j += 1;
  return { i: i, j: j };
}
function lanternStep(L) {
  var b = lanternBounds();
  var all = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  var open = [];
  for (var t = 0; t < all.length; t++) {
    var ni = L.i + all[t][0], nj = L.j + all[t][1];
    if (ni > 0 && nj > 0 && ni < b.maxI && nj < b.maxJ) open.push(all[t]);
  }
  if (!open.length) {
    var s = lanternRandomSpot();
    L.i = s.i; L.j = s.j; L.dir = null;
    return;
  }
  /* Keep going the same way 60% of the time if that way is still
     open; otherwise pick any open direction at random. The pick must
     be random: trying the directions in a fixed order always favours
     one corner, and every lantern ends up stuck there. */
  var pick = null;
  if (L.dir && Math.random() < 0.6) {
    for (var k = 0; k < open.length; k++) {
      if (open[k][0] === L.dir[0] && open[k][1] === L.dir[1]) pick = open[k];
    }
  }
  if (!pick) pick = open[Math.floor(Math.random() * open.length)];
  L.i += pick[0]; L.j += pick[1]; L.dir = pick;
}
function buildLanterns() {
  if (!lanternLit || !lanternBloom) return;
  lanternLit.innerHTML = '';
  lanternBloom.innerHTML = '';
  _lanterns = [];
  if (_prefersReducedMotion) return;
  var dotSize = LANTERN_TILE * 1.5, glowSize = LANTERN_TILE * 4;
  for (var k = 0; k < LANTERN_COUNT; k++) {
    var delay = (-7 * k / LANTERN_COUNT).toFixed(2) + 's';
    var dot = document.createElement('div');
    var glow = document.createElement('div');
    dot.className = 'lantern';
    glow.className = 'lantern-bloom';
    dot.style.setProperty('--d', delay);
    glow.style.setProperty('--d', delay);
    dot.style.width = dot.style.height = dotSize + 'px';
    glow.style.width = glow.style.height = glowSize + 'px';
    lanternLit.appendChild(dot);
    lanternBloom.appendChild(glow);
    var spot = lanternRandomSpot();
    var L = { dot: dot, glow: glow, i: spot.i, j: spot.j, dir: null };
    lanternPlace(L);
    _lanterns.push(L);
    dot.addEventListener('animationiteration', (function(L) {
      return function() { lanternStep(L); lanternPlace(L); };
    })(L));
  }
}
var _lanternResizeTimer = null;
window.addEventListener('resize', function() {
  if (_lanternResizeTimer) clearTimeout(_lanternResizeTimer);
  _lanternResizeTimer = setTimeout(buildLanterns, 250);
});

/* ============================================================
   KOI FLINCH */
function triggerKoiFlinch() {
  if (!koiDiveWrap) return;
  if (koiFlinchActive) return;
  if (!isBlossomInteractive()) return;
  if (koiGestureState !== 'idle') return;

  koiFlinchActive = true;

  var dir = Math.random() < 0.5 ? -1 : 1;
  var rot = (22 + Math.random() * 12) * dir;
  var scale = 1.14 + Math.random() * 0.08;
  var xMag = 10 + Math.random() * 10;
  var yMag = -(6 + Math.random() * 8);

  koiDiveWrap.style.setProperty('--flinch-rot', rot.toFixed(2) + 'deg');
  koiDiveWrap.style.setProperty('--flinch-scale', scale.toFixed(3));
  koiDiveWrap.style.setProperty('--flinch-x', (xMag * dir).toFixed(2) + 'px');
  koiDiveWrap.style.setProperty('--flinch-y', yMag.toFixed(2) + 'px');

  koiDiveWrap.classList.remove('flinching');
  void koiDiveWrap.offsetWidth;
  koiDiveWrap.classList.add('flinching');

  koiDiveWrap.addEventListener('animationend', function onFlinchEnd() {
    koiDiveWrap.classList.remove('flinching');
    koiDiveWrap.removeEventListener('animationend', onFlinchEnd);
    koiFlinchActive = false;
  });
}

function onKoiPointerDown(e) {
  if (!isBlossomInteractive()) return;
  if (koiGestureState !== 'idle') return;
  if (koiActivePointerId !== null) return;
  if (e.target && e.target.closest && e.target.closest('.theme-toggle')) return;

  koiActivePointerId = e.pointerId;
  koiStartY = e.clientY;
  koiCurrentY = e.clientY;
  koiLastTrailAt = Date.now();
  koiTapStartX = e.clientX;
  koiTapStartY = e.clientY;
  koiTapStartTime = Date.now();
  koiTapOnKoi = !!(e.target && e.target.closest && e.target.closest('.koi-image'));

  spawnRipples(e.clientX, e.clientY, 'strong');

  if (koiDiveWrap) {
    koiDiveWrap.classList.add('dragging');
    koiDiveWrap.style.setProperty('--koi-rise-y', '0px');
  }
  koiGestureState = 'swiping';
}

function onKoiPointerMove(e) {
  if (e.pointerId !== koiActivePointerId) return;
  if (koiGestureState !== 'swiping') return;

  koiCurrentY = e.clientY;
  var deltaY = koiCurrentY - koiStartY;
  var upward = Math.max(0, -deltaY);

  if (koiDiveWrap) {
    var riseY = -Math.min(KOI_RISE_MAX, upward * KOI_RISE_FACTOR);
    koiDiveWrap.style.setProperty('--koi-rise-y', riseY + 'px');
  }

  if (startBtn) {
    if (upward >= KOI_SWIPE_THRESHOLD) startBtn.classList.add('ready');
    else startBtn.classList.remove('ready');
  }

  var now = Date.now();
  if (upward > KOI_TRAIL_MIN_TRAVEL && (now - koiLastTrailAt) > KOI_TRAIL_INTERVAL) {
    koiLastTrailAt = now;
    spawnRipples(e.clientX, koiCurrentY, 'trail');
  }
}

function onKoiPointerUp(e) {
  if (e.pointerId !== koiActivePointerId) return;
  koiActivePointerId = null;

  if (koiGestureState !== 'swiping') {
    if (koiDiveWrap) koiDiveWrap.classList.remove('dragging');
    return;
  }

  if (koiDiveWrap) koiDiveWrap.classList.remove('dragging');

  var upX = (e.clientX != null) ? e.clientX : koiTapStartX;
  var upY = (e.clientY != null) ? e.clientY : koiTapStartY;
  var dx = upX - koiTapStartX;
  var dy = upY - koiTapStartY;
  var travel = Math.sqrt(dx * dx + dy * dy);
  var elapsed = Date.now() - koiTapStartTime;

  if (travel < KOI_TAP_MAX_TRAVEL && elapsed < KOI_TAP_MAX_MS) {
    if (koiDiveWrap) koiDiveWrap.style.setProperty('--koi-rise-y', '0px');
    if (startBtn) startBtn.classList.remove('ready');
    koiGestureState = 'idle';
    if (koiTapOnKoi) triggerKoiFlinch();
    return;
  }

  var deltaY = koiCurrentY - koiStartY;
  var upward = Math.max(0, -deltaY);

  if (upward >= KOI_SWIPE_THRESHOLD) {
    if (startBtn) startBtn.classList.remove('ready');
    triggerKoiStart();
  } else {
    if (koiDiveWrap) koiDiveWrap.style.setProperty('--koi-rise-y', '0px');
    if (startBtn) startBtn.classList.remove('ready');
    koiGestureState = 'idle';
  }
}

function triggerKoiStart() {
  stopAmbientRipple();
  stopPondLife();
  stopBlossomStream();
  Hints && Hints.onKoiStart();
  if (koiGestureState === 'diving' || koiGestureState === 'done' || koiGestureState === 'startling') return;
  koiGestureState = 'startling';
  introHasRun = true;

  playDrop();
  haptic(12);
  /* The toolbar takes its place now (so the layout does not move later),
     but stays invisible until the name animation has finished. */
  document.body.classList.add('info-visible');
  repositionHintGroupAfterLayout();
  repositionNumpad();

  if (startBtn) startBtn.classList.add('startling');

  koiPushTimer(setTimeout(function() {
    if (startBtn) {
      startBtn.classList.remove('startling');
      startBtn.classList.add('diving');
    }
    if (blossomScreen) blossomScreen.classList.add('diving');
    koiGestureState = 'diving';

    blossomScreen.style.transition = 'opacity 0.6s ease';
    blossomScreen.style.opacity = '0';

    koiPushTimer(setTimeout(function() {
      var nameText = (therapistDisplayName || '心').replace(/さん$/, '');
      var arrivalTime = renderIntroGlyph(nameText) * 1000 + 220;
      if (introOverlay) introOverlay.classList.add('active');
      var holdTime = 1200;
      nameLandsAt = performance.now() + arrivalTime;
      nameLeavesAt = nameLandsAt + holdTime;

      koiPushTimer(setTimeout(function() {
        var fadingChars = nameColumn ? nameColumn.querySelectorAll('.name-char') : [];
        for (var f = 0; f < fadingChars.length; f++) {
          fadingChars[f].style.animationDelay = (f * NAME_EXIT_STAGGER) + 's';
        }
        if (introOverlay) introOverlay.classList.add('finishing');
        // once the last character has faded the overlay goes; the characters
        // are cleared first so the arrival does not play again behind it
        var exitTime = ((fadingChars.length - 1) * NAME_EXIT_STAGGER + NAME_EXIT) * 1000 + 100;
        koiPushTimer(setTimeout(function() {
          if (nameColumn) nameColumn.innerHTML = '';
          if (introOverlay) introOverlay.classList.remove('active', 'finishing');
        }, Math.max(1400, exitTime)));
        /* The swipe text and the page dots wait: they come last, after the
           scenery and the greeting text (revealNavControls, below). The
           timer is a fallback so they always come. */
        navControlsHeld = true;
        koiPushTimer(setTimeout(revealNavControls, 9000));
        if (blossomScreen) {
          blossomScreen.classList.remove('visible');
          blossomScreen.style.opacity = '';
          blossomScreen.style.transition = '';
        }
        updateGlobalHint();
        document.body.classList.add('table-locked');
        window.scrollTo(0, 0);
        currentPanel = 0;
        track.style.transform = 'translateX(0%)';
        for (var d = 0; d < dots.length; d++) dots[d].classList.toggle('active', d === 0);

        greetingFinalized = true;

        activatePanel(0);

        /* Activate the ambient maple leaves, activate the winter
           snowflakes, show the audio HUD, and start the ambient
           sound layers. The particle overlays share the same
           .active gate on #mapleLeaves (autumn) / #snowFlakes
           (winter) — the CSS display rule hides the non-matching
           seasonal pair. */
        if (mapleLeaves) mapleLeaves.classList.add('active');
        if (snowFlakes) snowFlakes.classList.add('active');
        if (audioSpectrumHud) audioSpectrumHud.classList.add('shown');
        startAmbient();

        koiPushTimer(setTimeout(function() {
          if (infoBar) infoBar.classList.add('shown');        /* the toolbar fades in */
          repositionHintGroupAfterLayout();
          repositionNumpad();
          koiGestureState = 'done';
          Hints && Hints.onPanelsReady();
        }, 1400));
      }, arrivalTime + holdTime));
    }, 420));
  }, 200));
}

document.addEventListener('pointerdown', onKoiPointerDown, { passive: true });
document.addEventListener('pointermove', onKoiPointerMove, { passive: true });
document.addEventListener('pointerup', onKoiPointerUp, { passive: true });
document.addEventListener('pointercancel', onKoiPointerUp, { passive: true });

/* ============ NAME CONFIRM ============ */
function confirmName() {
  if (nameConfirmed) return;
  var entered = (nameInput.value || '').trim();
  if (entered === '') {
    nameInput.focus();
    nameInput.style.borderColor = 'var(--accent)';
    var originalPlaceholder = nameInput.placeholder;
    nameInput.placeholder = 'お名前を入力してください';
    setTimeout(function() {
      nameInput.style.borderColor = '';
      nameInput.placeholder = originalPlaceholder;
    }, 1800);
    return;
  }
  nameConfirmed = true;
  Hints && Hints.reset();
  NavSpring && NavSpring.reset();

  therapistDisplayName = entered + 'さん';
  confirmedTipAmount = getTipValue();
  if (rejectGiftAmountEl) rejectGiftAmountEl.textContent = confirmedTipAmount.toLocaleString();

  var p0Panel = document.querySelector('.panel[data-panel="0"]');
  if (p0Panel) buildPanel1OpeningBeats(p0Panel);

  var dynamicRows = document.getElementById('dynamicRows');
  dynamicRows.innerHTML = '';
  var nameRows = nameScreenRows.querySelectorAll('.row');
  var anyPresetSelected = false;
  for (var i = 0; i < nameRows.length; i++) {
    var row = nameRows[i];
    var box = row.querySelector('.row-check');
    if (!box || !box.classList.contains('checked')) continue;
    var display = row.querySelector('.service-display');
    var priceInput = row.querySelector('.price-input');
    var nameVal = display ? (display.textContent || '').trim() : '';
    if (nameVal === '') continue;
    var priceVal = priceInput ? (priceInput.value || '').trim() : '';

    var rowDiv = document.createElement('div');
    rowDiv.className = 'row';
    var boxDiv = document.createElement('div');
    boxDiv.className = 'row-check';
    boxDiv.setAttribute('role', 'checkbox');
    boxDiv.setAttribute('aria-checked', 'false');
    var labelSpan = document.createElement('span');
    labelSpan.className = 'service-display';
    labelSpan.textContent = nameVal;
    var priceWrap = document.createElement('div');
    priceWrap.className = 'price-wrap';
    var priceField = document.createElement('input');
    priceField.type = 'text';
    priceField.className = 'price-input';
    priceField.placeholder = '料金を入力';
    priceField.setAttribute('inputmode', 'none');
    priceField.setAttribute('enterkeyhint', 'done');
    priceField.value = priceVal;
    var yenSpan = document.createElement('span');
    yenSpan.className = 'yen';
    yenSpan.textContent = '円';
    priceWrap.appendChild(priceField);
    priceWrap.appendChild(yenSpan);
    rowDiv.appendChild(boxDiv);
    rowDiv.appendChild(labelSpan);
    rowDiv.appendChild(priceWrap);
    dynamicRows.appendChild(rowDiv);
    anyPresetSelected = true;
  }

  var panel3Anchor = document.getElementById('panel3Body');
  if (panel3Anchor) {
    panel3Anchor.innerHTML = anyPresetSelected ? panel3DefaultHtml : panel3NoHtml;
    var p3Panel = document.querySelector('.panel[data-panel="3"]');
    if (p3Panel) preparePanel(p3Panel);
  }

  if (transitionBodyDefault === '') {
    var tlBodyCapture = document.getElementById('transitionLineBody');
    if (tlBodyCapture) transitionBodyDefault = tlBodyCapture.innerHTML;
  }
  var tlBody = document.getElementById('transitionLineBody');
  if (tlBody) {
    tlBody.innerHTML = anyPresetSelected ? transitionBodyDefault : transitionBodyNoPresets;
    wrapTransitionBody();
    requestAnimationFrame(function() {
      updateTransitionBodyEffects();
    });
  }

  refreshTransitionGeometry();

  nameInput.classList.add('confirmed');
  haptic(14);
  setTimeout(function() {
    try { nameInput.blur(); } catch (err) {}
    nameScreen.classList.add('hidden');
    blossomScreen.classList.add('visible');
    showStartNotice();
    updateBlossomGreeting();
    tryStartBlossomStream();
    updateAllRowLocks();
    recalc();
    scheduleAmbientRipple();
    startPondLife();
  }, 420);
}

/* ============ RESET ============ */
function resetAll() {
  cancelPendingShake();
  resetWind();
  rejected = false;
  rejectRow.classList.remove('selected');
  rejectThanks.classList.remove('shown');
  petalOverlay.classList.remove('active');
  var rows = getRows();
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    var priceInput = row.querySelector('.price-input');
    var serviceText = row.querySelector('.service-input');
    var box = row.querySelector('.row-check');
    if (box) {
      if (priceInput && priceInput.value !== '') box.setAttribute('data-saved-price', priceInput.value);
      if (serviceText && serviceText.value.trim() !== '') box.setAttribute('data-saved-service', serviceText.value);
      box.classList.remove('checked');
      box.setAttribute('aria-checked', 'false');
    }
    if (priceInput) priceInput.value = '';
    if (serviceText) serviceText.value = '';
    row.classList.remove('disabled', 'filled');
  }
  if (rejectGiftAmountEl) rejectGiftAmountEl.textContent = confirmedTipAmount.toLocaleString();
  updateAllRowLocks();
  recalc();
  if (typeof updateSummaryVisibility === 'function') updateSummaryVisibility();
}

nameBtn.addEventListener('click', function(e) { e.preventDefault(); confirmName(); });
nameInput.addEventListener('keydown', function(e) {
  if (e.key === 'Enter' || e.keyCode === 13) { e.preventDefault(); confirmName(); }
});
document.getElementById('resetBtn').addEventListener('click', resetAll);

window.addEventListener('load', function() {
  refreshTransitionGeometry();
  loadNameStrokes();
  startInfoUpdates();
  loadPresetsFromServer().then(function() {
    buildNameScreenRows();
    setTimeout(function() { try { nameInput.focus(); } catch (err) {} }, 300);
  });
  loadAllPanels().then(function() {
    repositionHintGroupAfterLayout();
    repositionNumpad();
    updateGreetingPanel();
    for (var i = 1; i < panels.length; i++) {
      preparePanel(panels[i]);
    }
    refreshTransitionGeometry();
  });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function() {
      repositionHintGroupAfterLayout();
      repositionNumpad();
      refreshTransitionGeometry();
    });
  }
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(function() {});
  }
  buildMotes();
  buildLanterns();

  /* Cold-boot December switchover. startInfoUpdates() above already
     ran updateInfoDateTime() synchronously, which may have flipped
     the theme to winter via the same check. The duplicate is
     harmless (applyTheme is idempotent) and guarantees the initial
     state even if startInfoUpdates were ever reordered or
     deferred. */
  if (!_themeManuallySet && isNagoyaWinterSeason()) {
    applyTheme('winter');
  }

  buildDigitColumns(document.getElementById('summaryDigits'), 0);
  buildDigitColumns(document.getElementById('receiptTotalNumber'), 0);
  buildCounterColumns(document.getElementById('itemCountDigits'), 3);

  applyCounterCellWidth();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(applyCounterCellWidth);
  }
  window.addEventListener('resize', applyCounterCellWidth);

  var receiptPaperEl = receiptScreen ? receiptScreen.querySelector('.receipt-paper') : null;
  if (receiptPaperEl) {
    receiptPaperEl.addEventListener('scroll', updateReceiptScrollIndicator, { passive: true });
  }
  if (receiptScreen) {
    receiptScreen.addEventListener('scroll', updateReceiptScrollIndicator, { passive: true });
  }
  if (window.ResizeObserver && receiptItems) {
    var ro = new ResizeObserver(function() {
      updateReceiptScrollIndicator();
    });
    ro.observe(receiptItems);
  }
  /* Publish --summary-h for the HUD-lift rule. The observer fires
     once on observe — establishing the initial value — and again
     on any layout change to the summary bar: font-load reflow,
     breakpoint crossing, safe-area recomputation. */
  measureSummaryHeight();
  if (window.ResizeObserver && summaryBar) {
    var roSummary = new ResizeObserver(function() {
      measureSummaryHeight();
    });
    roSummary.observe(summaryBar);
  }
});

/* ============ RECEIPT ============ */
function revealReceiptItems(staggerMs) {
  var items = receiptItems.querySelectorAll('.receipt-item');
  if (!items.length) return;
  var stagger = staggerMs == null ? 80 : staggerMs;
  for (var i = 0; i < items.length; i++) {
    (function(item, idx) {
      if (stagger <= 0) {
        item.classList.add('revealed');
      } else {
        setTimeout(function() { item.classList.add('revealed'); }, idx * stagger);
      }
    })(items[i], i);
  }
}

function buildReceipt(opts) {
  opts = opts || {};
  var deferItems = !!opts.deferItems;

  cancelPendingReceiptShake();
  if (opts.keepStamp) cancelReceiptStampTimers(); else resetReceiptStamp();
  receiptItems.innerHTML = '';
  var receiptToName = document.getElementById('receiptToName');
  if (receiptToName) {
    var currentName = therapistDisplayName || '桜庭さん';
    receiptToName.textContent = currentName + 'へ';
  }
  var rows = getRows();
  var itemCount = 0;
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    var priceInput = row.querySelector('.price-input');
    if (!priceInput) continue;
    var price = parseFormatted(priceInput.value);
    var check = row.querySelector('.row-check');
    var isChecked = check && check.classList.contains('checked');
    if (!isChecked) continue;
    var display = row.querySelector('.service-display');
    var textInput = row.querySelector('.service-input');
    var name = '';
    if (display) name = (display.textContent || '').trim();
    else if (textInput) name = (textInput.value || '').trim();
    if (!name) name = 'サービス ' + (i + 1);
    var itemDiv = document.createElement('div');
    itemDiv.className = 'receipt-item';
    itemDiv._srcRow = row;
    var nameSpan = document.createElement('span');
    nameSpan.className = 'receipt-item-name';
    nameSpan.textContent = name;
    var priceWrap = document.createElement('span');
    priceWrap.className = 'receipt-item-price-wrap';
    var yenSymbol = document.createElement('span');
    yenSymbol.className = 'yen-symbol';
    yenSymbol.textContent = '¥';
    var priceField = document.createElement('input');
    priceField.type = 'text';
    priceField.setAttribute('inputmode', 'none');
    priceField.className = 'receipt-price-input';
    priceField.value = formatWithComma(price);
    priceWrap.appendChild(yenSymbol);
    priceWrap.appendChild(priceField);
    var removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'receipt-item-remove';
    removeBtn.setAttribute('aria-label', '削除');
    removeBtn.textContent = '×';
    var undoBtn = document.createElement('button');
    undoBtn.type = 'button';
    undoBtn.className = 'receipt-item-undo';
    undoBtn.setAttribute('aria-label', '元に戻す');
    undoBtn.textContent = '↺ 元に戻す';
    itemDiv.appendChild(nameSpan);
    itemDiv.appendChild(priceWrap);
    itemDiv.appendChild(removeBtn);
    itemDiv.appendChild(undoBtn);
    receiptItems.appendChild(itemDiv);
    itemCount++;
  }
  if (itemCount === 0 && rejected) {
    var rejectDiv = document.createElement('div');
    rejectDiv.className = 'receipt-item';
    var rejectName = document.createElement('span');
    rejectName.className = 'receipt-item-name';
    rejectName.textContent = 'ささやかなお礼';
    var rejectPriceWrap = document.createElement('span');
    rejectPriceWrap.className = 'receipt-item-price-wrap';
    var rejectYen = document.createElement('span');
    rejectYen.className = 'yen-symbol';
    rejectYen.textContent = '¥';
    var rejectPriceField = document.createElement('input');
    rejectPriceField.type = 'text';
    rejectPriceField.setAttribute('inputmode', 'none');
    rejectPriceField.className = 'receipt-price-input';
    rejectPriceField.value = formatWithComma(confirmedTipAmount);
    rejectPriceWrap.appendChild(rejectYen);
    rejectPriceWrap.appendChild(rejectPriceField);
    rejectDiv.appendChild(rejectName);
    rejectDiv.appendChild(rejectPriceWrap);
    receiptItems.appendChild(rejectDiv);
    itemCount++;
  }

  var itemCountDigits = document.getElementById('itemCountDigits');
  if (itemCountDigits) buildCounterColumns(itemCountDigits, itemCount);

  bindReceiptItemListeners();
  updateReceiptTotal();

  if (opts.keepStamp) restoreReceiptStamp();

  if (!deferItems) revealReceiptItems(80);
}

function bindReceiptItemListeners() {
  var receiptPriceInputs = receiptItems.querySelectorAll('.receipt-price-input');
  for (var i = 0; i < receiptPriceInputs.length; i++) {
    (function(input) {
      input.addEventListener('input', function() {
        var digits = input.value.replace(/[^0-9]/g, '');
        if (digits.length > 5) digits = digits.slice(0, 5);
        if (digits === '') input.value = '';
        else input.value = parseInt(digits, 10).toLocaleString();
        var item = input.closest('.receipt-item');
        if (item && item._srcRow) {
          var srcPriceInput = item._srcRow.querySelector('.price-input');
          if (srcPriceInput) srcPriceInput.value = input.value;
          recalc();
        } else {
          var newTip = parseFormatted(input.value);
          confirmedTipAmount = newTip;
          setTipValue(newTip);
          updateRejectThanksContent();
          recalc();
        }
        updateReceiptTotal();
      });
      input.addEventListener('focus', function() {
        setTimeout(function() {
          if (document.activeElement !== input) return;
          input.select();
        }, 50);
      });
      input.addEventListener('focusout', function() {
        var item = input.closest('.receipt-item');
        if (!item) return;
        if (item.classList.contains('removing')) return;
        if (item.getAttribute('data-removing') === 'true') return;
        if ((input.value || '').trim() !== '') return;
        scheduleReceiptEmptyBlurShake(item, input);
      });
    })(receiptPriceInputs[i]);
  }

  var removeButtons = receiptItems.querySelectorAll('.receipt-item-remove');
  for (var r = 0; r < removeButtons.length; r++) {
    (function(btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        var item = btn.closest('.receipt-item');
        if (!item) return;
        if (item.classList.contains('removing')) return;
        if (receiptStamped) return;
        haptic(8);
        cancelPendingReceiptShake();
        if (item._srcRow) {
          var srcBox = item._srcRow.querySelector('.row-check');
          var srcPrice = item._srcRow.querySelector('.price-input');
          var srcService = item._srcRow.querySelector('.service-input');
          if (srcBox) {
            if (srcPrice && srcPrice.value !== '') srcBox.setAttribute('data-saved-price', srcPrice.value);
            if (srcService && srcService.value.trim() !== '') srcBox.setAttribute('data-saved-service', srcService.value);
            srcBox.classList.remove('checked');
            srcBox.setAttribute('aria-checked', 'false');
          }
          if (srcPrice) srcPrice.value = '';
          if (srcService) srcService.value = '';
          updateRowLock(item._srcRow);
          recalc();
        }
        item.setAttribute('data-removing', 'true');
        item.classList.add('removing');
        updateReceiptItemCount();
        updateReceiptTotal();
        updateReceiptScrollIndicator();
      });
    })(removeButtons[r]);
  }

  var undoButtons = receiptItems.querySelectorAll('.receipt-item-undo');
  for (var u = 0; u < undoButtons.length; u++) {
    (function(btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        var item = btn.closest('.receipt-item');
        if (!item) return;
        if (!item.classList.contains('removing')) return;
        if (receiptStamped) return;
        haptic(10);
        if (item._srcRow) {
          var srcBox = item._srcRow.querySelector('.row-check');
          var srcPrice = item._srcRow.querySelector('.price-input');
          var srcService = item._srcRow.querySelector('.service-input');
          if (srcBox) {
            srcBox.classList.add('checked');
            srcBox.setAttribute('aria-checked', 'true');
            var savedPrice = srcBox.getAttribute('data-saved-price');
            if (savedPrice !== null && savedPrice !== '' && srcPrice) srcPrice.value = savedPrice;
            var savedService = srcBox.getAttribute('data-saved-service');
            if (savedService !== null && savedService !== '' && srcService) srcService.value = savedService;
          }
          updateRowLock(item._srcRow);
          recalc();
        }
        item.classList.remove('removing');
        item.setAttribute('data-removing', 'false');
        updateReceiptItemCount();
        updateReceiptTotal();
        updateReceiptScrollIndicator();
      });
    })(undoButtons[u]);
  }
}

/* ============ ALERT HELPER ============ */
var alertOkCallback = null;
function showAlert(title, sub, items, onOk) {
  if (alertTitle) alertTitle.textContent = title;
  if (alertSub) alertSub.textContent = sub;
  alertList.innerHTML = '';
  if (items && items.length > 0) {
    for (var i = 0; i < items.length; i++) {
      var li = document.createElement('li');
      li.textContent = items[i];
      alertList.appendChild(li);
    }
  }
  alertOkCallback = onOk || null;
  alertScreen.classList.add('visible');
}

function scrollToFirstUnpricedRow() {
  setTimeout(function() {
    var rows = getRows();
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var check = row.querySelector('.row-check');
      var priceInput = row.querySelector('.price-input');
      if (!priceInput || priceInput.disabled) continue;
      var isChecked = check && check.classList.contains('checked');
      var hasPrice = (priceInput.value || '').trim() !== '';
      if (isChecked && !hasPrice) {
        row.scrollIntoView({ behavior: 'auto', block: 'nearest' });
        row.classList.remove('price-hint');
        void row.offsetWidth;
        row.classList.add('price-hint');
        setTimeout(function() { row.classList.remove('price-hint'); }, 1000);
        priceInput.focus();
        break;
      }
    }
  }, 400);
}

/* ============ SUBMIT ============ */
submitBtn.addEventListener('click', function(e) {
  e.preventDefault();
  haptic(10);
  Hints && Hints.interrupt();
  cancelPendingShake();
  var missing = findUnpricedServices();
  if (missing.length > 0) {
    showAlert(
      '以下のサービスの料金が入力されていません。',
      '料金をご入力ください。',
      missing,
      scrollToFirstUnpricedRow
    );
    return;
  }
  copyCustomServices();
  confirmScreen.classList.add('visible');
  callMe();
});

/* ============ 呼び出し (NTFY) ============
   Tapping 確認する tells me on my phone that she has finished choosing,
   through ntfy (ntfy.sh): the phone runs the ntfy app subscribed to
   CALL.topic. The message says only that she is ready, never what she
   chose or how much, so the privacy note on the table stays true. Sent as
   JSON to the root URL with no custom headers, so the browser needs no
   preflight and the Japanese title needs no header encoding. A second tap
   within CALL.cooldown ms (内容を変更する, then 確認する again) sends
   nothing more. Offline or a failed send is silent: she never sees an
   error. */
var CALL = {
  topic: 'thankyou-call-653e1e512b6b6caf',
  title: '確認するが押されました',
  message: 'お選びいただけました。お戻りください。',
  cooldown: 60000
};
var lastCall = -Infinity;
function callMe() {
  var now = Date.now();
  if (now - lastCall < CALL.cooldown) return;
  lastCall = now;
  try {
    fetch('https://ntfy.sh/', {
      method: 'POST',
      keepalive: true,
      body: JSON.stringify({ topic: CALL.topic, title: CALL.title, message: CALL.message, priority: 5, tags: ['bell'] })
    }).catch(function() { lastCall = -Infinity; });
  } catch (err) { lastCall = -Infinity; }
}

alertOk.addEventListener('click', function(e) {
  e.preventDefault();
  haptic(8);
  alertScreen.classList.remove('visible');
  var cb = alertOkCallback;
  alertOkCallback = null;
  if (typeof cb === 'function') cb();
});
alertScreen.addEventListener('click', function(e) {
  if (e.target === alertScreen) alertOk.click();
});

/* ============ CONFIRM DIALOG ============ */
confirmYes.addEventListener('click', function(e) {
  e.preventDefault();
  haptic(14);
  confirmScreen.classList.remove('visible');

  if (rejected) {
    thankyouScreen.style.transition = 'none';
    thankyouScreen.classList.add('visible');
    void thankyouScreen.offsetWidth;
    thankyouScreen.style.transition = '';
    startThankyouSequence();
    tableCard.classList.remove('active');
    rejectRow.classList.remove('active');
    divider.classList.remove('active');
    summaryBar.classList.remove('visible');
    infoBar.classList.remove('hidden');
    return;
  }

  buildReceipt({ deferItems: true });
  tableCard.classList.remove('active');
  rejectRow.classList.remove('active');
  divider.classList.remove('active');
  summaryBar.classList.remove('visible');
  setTimeout(function() {
    resetReceiptScroll();
    lockBodyForReceipt();

    receiptScreen.style.transition = 'none';
    receiptScreen.classList.add('visible');
    void receiptScreen.offsetWidth;
    receiptScreen.style.transition = '';

    infoBar.classList.add('hidden');
    updateNumpadVisibility();

    var willRunLanding = false;
    if (!receiptHasLanded) {
      receiptHasLanded = true;
      var paperWrap = receiptScreen.querySelector('.receipt-paper-wrap');

      if (paperWrap) {
        willRunLanding = true;
        paperWrap.classList.remove('landing');
        void paperWrap.offsetWidth;

        paperWrap.classList.add('landing');
        paperWrap.addEventListener('animationend', function onLandingEnd() {
          paperWrap.classList.remove('landing');
          paperWrap.removeEventListener('animationend', onLandingEnd);
          revealReceiptItems(80);
        });
      }
    }

    if (!willRunLanding) {
      revealReceiptItems(80);
    }

    requestAnimationFrame(updateReceiptScrollIndicator);
    setTimeout(updateReceiptScrollIndicator, 100);
    setTimeout(updateReceiptScrollIndicator, 1000);
  }, 450);
});

confirmNo.addEventListener('click', function(e) {
  e.preventDefault();
  haptic(8);
  confirmScreen.classList.remove('visible');
});

/* ============ RECEIPT CONFIRM ============ */
/* Hanko stamp. The empty box between 合計 and the price is a signing box.
   Tapping it presses the 承 seal exactly where she tapped (so it can land on
   other content, like a real seal), plays a short jingle and locks the
   receipt. A small ⊗ beside the seal lifts it off and unlocks again.
   receiptStampMemo remembers where the seal sits so it comes back in the
   same place when she reopens the receipt from the thank-you screen; it is
   cleared when she lifts the seal, goes back to the service table, or a
   fresh receipt is built. */
var receiptStampBusy = false;
var receiptStamped = false;
var receiptStampMemo = null;
var receiptStampTimers = [];
var receiptStampZone = document.getElementById('receiptStampZone');
var receiptStampHolder = document.getElementById('receiptStampHolder');
var receiptStampX = document.getElementById('receiptStampX');

function cancelReceiptStampTimers() {
  for (var i = 0; i < receiptStampTimers.length; i++) clearTimeout(receiptStampTimers[i]);
  receiptStampTimers = [];
  receiptStampBusy = false;
  if (receiptScreen) receiptScreen.classList.remove('stamping');
}

/* Locked = stamped: no price edits, no removals. */
function setReceiptLocked(locked) {
  receiptScreen.classList.toggle('stamped', locked);
  var inputs = receiptItems.querySelectorAll('.receipt-price-input');
  for (var i = 0; i < inputs.length; i++) inputs[i].readOnly = locked;
}

function resetReceiptStamp() {
  cancelReceiptStampTimers();
  receiptStamped = false;
  receiptStampMemo = null;
  if (receiptStampEl) receiptStampEl.classList.remove('stamping', 'shown', 'lifting');
  if (receiptStampX) receiptStampX.classList.remove('on');
  if (receiptScreen) { receiptScreen.classList.remove('stamp-confirm'); setReceiptLocked(false); }
}

function placeReceiptStampAt(memo) {
  receiptStampHolder.style.left = (memo.fx * 100) + '%';
  receiptStampHolder.style.top = (memo.fy * 100) + '%';
  receiptStampEl.style.setProperty('--stamp-rot', memo.rot + 'deg');
}

/* Reopened from the thank-you screen: the seal is already there, in the
   same place, with no animation and no jingle. */
function restoreReceiptStamp() {
  if (!receiptStampMemo) { setReceiptLocked(false); return; }
  placeReceiptStampAt(receiptStampMemo);
  receiptStampEl.classList.remove('stamping', 'lifting');
  receiptStampEl.classList.add('shown');
  receiptStampX.classList.add('on');
  receiptScreen.classList.add('stamp-confirm');
  receiptStamped = true;
  setReceiptLocked(true);
}

function countActiveReceiptItems() {
  var n = 0;
  var els = receiptItems.querySelectorAll('.receipt-item');
  for (var i = 0; i < els.length; i++) {
    if (els[i].getAttribute('data-removing') === 'true') continue;
    if (els[i].classList.contains('removing')) continue;
    n++;
  }
  return n;
}

function showNoItemsAlert() {
  showAlert(
    'すべての項目が削除されています。',
    '内容をご確認のうえ、\nもう一度お試しください。',
    null,
    null
  );
}

/* The confirm button opens below サービスの選択に戻る once the seal is on, and
   the receipt paper often scrolls, so bring the new button into view. */
function scrollReceiptConfirmIntoView() {
  var paper = receiptScreen.querySelector('.receipt-paper');
  if (!paper || !receiptConfirmBtn || !receiptStamped) return;
  var pr = paper.getBoundingClientRect();
  var br = receiptConfirmBtn.getBoundingClientRect();
  if (br.bottom > pr.bottom - 20) {
    var shift = br.bottom - pr.bottom + 28;
    try { paper.scrollBy({ top: shift, behavior: 'smooth' }); } catch (err) { paper.scrollTop += shift; }
  }
}

/* She tapped something that is locked while the seal is on: wiggle the ✕ to
   show how to unlock. */
function wiggleReceiptStampX() {
  if (!receiptStampX) return;
  haptic(6);
  receiptStampX.classList.remove('wiggle');
  void receiptStampX.offsetWidth;
  receiptStampX.classList.add('wiggle');
  setTimeout(function() { receiptStampX.classList.remove('wiggle'); }, 550);
}

/* An item with a blank price is incomplete: shake it and put the cursor
   back in it instead of stamping (same nudge the receipt already gives). */
function firstEmptyReceiptPriceItem() {
  var els = receiptItems.querySelectorAll('.receipt-item');
  for (var i = 0; i < els.length; i++) {
    if (els[i].classList.contains('removing')) continue;
    if (els[i].getAttribute('data-removing') === 'true') continue;
    var input = els[i].querySelector('.receipt-price-input');
    if (input && (input.value || '').trim() === '') return els[i];
  }
  return null;
}

if (receiptStampZone) {
  receiptStampZone.addEventListener('click', function(e) {
    e.preventDefault();
    if (e.target.closest && e.target.closest('.receipt-stamp-x')) return;
    if (receiptStampBusy || receiptStamped) return;
    cancelPendingReceiptShake();

    if (countActiveReceiptItems() === 0) { showNoItemsAlert(); return; }

    var emptyItem = firstEmptyReceiptPriceItem();
    if (emptyItem) {
      var wrap = emptyItem.querySelector('.receipt-item-price-wrap');
      if (wrap) {
        wrap.classList.remove('shake');
        void wrap.offsetWidth;
        wrap.classList.add('shake');
        setTimeout(function() { wrap.classList.remove('shake'); }, 350);
      }
      haptic(6);
      var emptyInput = emptyItem.querySelector('.receipt-price-input');
      if (emptyInput) { try { emptyInput.focus(); } catch (err) { /* silent */ } }
      return;
    }

    haptic(8);
    /* A price still being typed counts as confirmed: close the keypad. */
    try {
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    } catch (err) { /* silent */ }
    updateNumpadVisibility();

    /* Where she tapped, as a share of the box so it survives a resize. */
    var w = receiptStampZone.offsetWidth || 1;
    var h = receiptStampZone.offsetHeight || 1;
    var zr = receiptStampZone.getBoundingClientRect();
    var ox, oy;
    if (e.target === receiptStampZone && typeof e.offsetX === 'number') {
      ox = e.offsetX; oy = e.offsetY;
    } else {
      ox = e.clientX - zr.left; oy = e.clientY - zr.top;
    }
    ox = Math.max(0, Math.min(w, ox));
    oy = Math.max(0, Math.min(h, oy));
    /* Keep the whole seal, and its ⊗, on the paper. */
    var paper = receiptScreen.querySelector('.receipt-paper');
    if (paper) {
      var pr = paper.getBoundingClientRect();
      var minX = (pr.left + 56) - zr.left;
      var maxX = (pr.right - 62) - zr.left;
      if (minX < maxX) ox = Math.max(minX, Math.min(maxX, ox));
    }
    var memo = { fx: ox / w, fy: oy / h, rot: Math.round((Math.random() * 28 - 14) * 10) / 10 };

    var reduced = false;
    try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (err) { /* silent */ }

    receiptStampBusy = true;
    receiptStampMemo = memo;
    receiptScreen.classList.add('stamping');
    setReceiptLocked(true);
    placeReceiptStampAt(memo);
    receiptStampEl.classList.remove('shown', 'lifting');
    void receiptStampEl.offsetWidth;
    receiptStampEl.classList.add('stamping');

    /* Impact is about 55% through the 0.55s press: buzz and jingle there. */
    receiptStampTimers.push(setTimeout(function() {
      haptic(18);
      playSound('stampChime', 1.0);
    }, reduced ? 0 : 300));
    receiptStampTimers.push(setTimeout(function() {
      receiptStampBusy = false;
      receiptStamped = true;
      receiptScreen.classList.remove('stamping');
    }, reduced ? 100 : 600));
    receiptStampTimers.push(setTimeout(function() {
      receiptStampX.classList.add('on');
      receiptScreen.classList.add('stamp-confirm');
      Hints && Hints.onStamp();
    }, reduced ? 150 : 1100));
    receiptStampTimers.push(setTimeout(scrollReceiptConfirmIntoView, reduced ? 250 : 1800));
  });
}

/* A tap on a locked item (price, ×, undo) wiggles the ✕. */
receiptItems.addEventListener('click', function() {
  if (receiptStamped) wiggleReceiptStampX();
});

/* ✕: lift the seal off, bring the box back, unlock the receipt. */
if (receiptStampX) {
  receiptStampX.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    if (receiptStampBusy || !receiptStamped) return;
    haptic(8);
    playPaper(false);
    Hints && Hints.clear();
    receiptStamped = false;
    receiptStampMemo = null;
    receiptStampX.classList.remove('on');
    receiptScreen.classList.remove('stamp-confirm');
    receiptStampEl.classList.remove('stamping', 'shown');
    receiptStampEl.classList.add('lifting');
    receiptStampTimers.push(setTimeout(function() {
      receiptStampEl.classList.remove('lifting');
    }, 450));
    setReceiptLocked(false);
  });
}

receiptConfirmBtn.addEventListener('click', function(e) {
  e.preventDefault();
  if (receiptStampBusy) return;
  haptic(8);
  Hints && Hints.clear();
  cancelPendingReceiptShake();

  if (countActiveReceiptItems() === 0) {
    showNoItemsAlert();
    return;
  }

  /* The button only appears once the seal is on; this is a safety net. */
  if (!receiptStamped) return;
  continueAfterReceiptStamp();
});

function continueAfterReceiptStamp() {
  if (receiptOpenedFromThankyou) {
    receiptOpenedFromThankyou = false;
    unlockBodyForReceipt();
    receiptScreen.classList.remove('visible', 'reopened');
    infoBar.classList.remove('hidden');
    var resumed = false;
    function finishResume() {
      if (resumed) return;
      resumed = true;
      receiptScreen.removeEventListener('transitionend', onFade);
      resumeThankyouSequence();
    }
    function onFade(ev) {
      if (ev.target === receiptScreen && ev.propertyName === 'opacity') finishResume();
    }
    receiptScreen.addEventListener('transitionend', onFade);
    setTimeout(finishResume, 1200);
    return;
  }
  receiptScreen.classList.add('above-thankyou');
  thankyouScreen.style.transition = 'none';
  thankyouScreen.classList.add('visible');
  void thankyouScreen.offsetWidth;
  thankyouScreen.style.transition = '';
  startThankyouSequence();
  unlockBodyForReceipt();
  requestAnimationFrame(function() {
    receiptScreen.classList.remove('visible');
    infoBar.classList.remove('hidden');
  });
  setTimeout(function() {
    receiptScreen.classList.remove('above-thankyou');
  }, 1100);
}

/* ============ BACK TO TABLE ============ */
function returnToTable() {
  clearAllTyTimers();
  thankyouScreen.classList.remove('under-receipt');
  cancelPendingReceiptShake();
  resetReceiptStamp();
  var receiptWasVisible = receiptScreen.classList.contains('visible');
  if (thankyouScreen.classList.contains('visible')) {
    thankyouScreen.style.transition = 'none';
    thankyouScreen.classList.remove('visible');
    void thankyouScreen.offsetWidth;
    thankyouScreen.style.transition = '';
  }
  document.body.classList.remove('thankyou-active');
  unlockBodyForReceipt();
  receiptScreen.classList.remove('visible', 'reopened', 'above-thankyou');
  infoBar.classList.remove('hidden');
  var finished = false;
  function finishReturn() {
    if (finished) return;
    finished = true;
    receiptScreen.removeEventListener('transitionend', onFade);
    tyAmbientStage.classList.remove('shown');
    GameWindow.stop();
    tyReceiptBtn.classList.remove('shown');
    currentPanel = totalPanels - 1;
    track.style.transform = 'translateX(-' + (currentPanel * (100 / totalPanels)) + '%)';
    for (var j = 0; j < dots.length; j++) dots[j].classList.toggle('active', j === currentPanel);
    activatePanel(currentPanel);
    unlockTable();
    setTimeout(function() {
      tableCard.classList.add('active');
      rejectRow.classList.add('active');
      divider.classList.add('active');
      var scrollSettled = false;
      function onScrollEnd() {
        if (scrollSettled) return;
        scrollSettled = true;
        window.removeEventListener('scrollend', onScrollEnd);
        receiptOpenedFromThankyou = false;
        if (typeof scheduleEvaluation === 'function') setTimeout(scheduleEvaluation, 400);
      }
      if ('onscrollend' in window) window.addEventListener('scrollend', onScrollEnd);
      setTimeout(function() {
        try {
          tableCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch (err) {
          var y = tableCard.getBoundingClientRect().top + window.pageYOffset - 100;
          window.scrollTo(0, y);
        }
        setTimeout(onScrollEnd, 1500);
      }, 150);
    }, 300);
  }
  function onFade(ev) {
    if (ev.target === receiptScreen && ev.propertyName === 'opacity') finishReturn();
  }
  if (receiptWasVisible) {
    receiptScreen.addEventListener('transitionend', onFade);
    setTimeout(finishReturn, 1200);
  } else {
    finishReturn();
  }
}
receiptBackBtn.addEventListener('click', function(e) {
  e.preventDefault();
  Hints && Hints.clear();
  /* While the seal is on, going back is on hold until she lifts it. */
  if (receiptStamped || receiptStampBusy) { wiggleReceiptStampX(); return; }
  haptic(10);
  returnToTable();
});

/* ============ MAIN CAROUSEL SWIPE ============ */
var startX = 0, startY = 0, currentX = 0;
var dragging = false, decided = false, isHorizontal = false;
/* The .panel-content nodes never change (panel text loads into an
   anchor inside them), so look them up once instead of on every
   touchmove. */
var panelContents = [];
for (var _pc = 0; _pc < panels.length; _pc++) {
  panelContents[_pc] = panels[_pc].querySelector('.panel-content');
}
/* The incoming panel's blur only changes in 0.5px steps. Each new
   blur value makes the GPU redo the blur on the whole text block,
   so writing a fresh value on every touchmove was the costliest
   part of the drag; eight steps look the same to the eye. */
function swipeBlur(el, px) {
  var b = Math.round(px * 2) / 2;
  if (el._swipeBlur === b) return;
  el._swipeBlur = b;
  el.style.filter = 'blur(' + b + 'px)';
}
function onTouchStart(e) {
  startX = e.touches[0].clientX;
  startY = e.touches[0].clientY;
  currentX = startX;
  dragging = true; decided = false; isHorizontal = false;
  startSwipeTracking();
  recordSwipeSample(startX);
}
function onTouchMove(e) {
  if (!dragging) return;
  var x = e.touches[0].clientX, y = e.touches[0].clientY;
  var deltaX = x - startX, deltaY = y - startY;
  if (!decided) {
    if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) {
      decided = true;
      isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
      if (isHorizontal) {
        track.classList.add('dragging');
        _swipeActive = true;
      }
    }
  }
  if (isHorizontal) {
    currentX = x;
    recordSwipeSample(x);
    if (currentPanel === totalPanels - 1 && deltaX < 0) {
      var baseOffsetEnd = -currentPanel * stageWidth;
      var offsetEnd = baseOffsetEnd + deltaX * 0.35;
      var pctEnd = (offsetEnd / stageWidth) * (100 / totalPanels);
      track.style.transform = 'translateX(' + pctEnd + '%)';
      return;
    }
    if (currentPanel === 0 && deltaX > 0) {
      var baseOffsetStart = -currentPanel * stageWidth;
      var offsetStart = baseOffsetStart + deltaX * 0.35;
      var pctStart = (offsetStart / stageWidth) * (100 / totalPanels);
      track.style.transform = 'translateX(' + pctStart + '%)';
      return;
    }
    var baseOffset = -currentPanel * stageWidth;
    var offset = baseOffset + deltaX;
    var pct = (offset / stageWidth) * (100 / totalPanels);
    track.style.transform = 'translateX(' + pct + '%)';
    var dragRatio = Math.min(1, Math.abs(deltaX) / (refWidth * 0.35));
    if (deltaX < 0) {
      var curC = panelContents[currentPanel];
      if (curC) curC.style.opacity = 1 - dragRatio;
      var nextC = panelContents[currentPanel + 1];
      if (nextC) {
        nextC.style.opacity = dragRatio;
        nextC.style.transform = 'translateX(' + (40 - 40 * dragRatio) + 'px)';
        swipeBlur(nextC, 4 - 4 * dragRatio);
      }
    } else if (deltaX > 0) {
      var curC2 = panelContents[currentPanel];
      if (curC2) curC2.style.opacity = 1 - dragRatio;
      var prevC = panelContents[currentPanel - 1];
      if (prevC) {
        prevC.style.opacity = dragRatio;
        prevC.style.transform = 'translateX(' + (-40 + 40 * dragRatio) + 'px)';
        swipeBlur(prevC, 4 - 4 * dragRatio);
      }
    }
  }
}
function clearInlineFades() {
  for (var c = 0; c < panelContents.length; c++) {
    var content = panelContents[c];
    if (content) {
      content.style.opacity = '';
      content.style.transform = '';
      content.style.filter = '';
      content._swipeBlur = undefined;
    }
  }
}
function onTouchEnd() {
  if (!dragging) return;
  dragging = false;
  _swipeActive = false;
  track.classList.remove('dragging');
  if (!isHorizontal) { clearInlineFades(); return; }
  clearInlineFades();
  releaseSwipeGust();
  var deltaX = currentX - startX;
  var threshold = refWidth * 0.12;
  if (currentPanel === totalPanels - 1) {
    if (deltaX > threshold) goToPanel(currentPanel - 1, true);
    else bounceToCurrentPanel();
    return;
  }
  if (currentPanel === 0) {
    if (deltaX < -threshold) goToPanel(currentPanel + 1, true);
    else bounceToCurrentPanel();
    return;
  }
  if (deltaX < -threshold && currentPanel < totalPanels - 1) goToPanel(currentPanel + 1, true);
  else if (deltaX > threshold && currentPanel > 0) goToPanel(currentPanel - 1, true);
  else bounceToCurrentPanel();
}
stage.addEventListener('touchstart', onTouchStart, { passive: true });
stage.addEventListener('touchmove', onTouchMove, { passive: true });
stage.addEventListener('touchend', onTouchEnd, { passive: true });
stage.addEventListener('touchcancel', onTouchEnd, { passive: true });

var mouseDown = false;
stage.addEventListener('mousedown', function(e) {
  mouseDown = true;
  startX = e.clientX; currentX = e.clientX;
  startSwipeTracking();
  recordSwipeSample(startX);
  track.classList.add('dragging');
});
window.addEventListener('mousemove', function(e) {
  if (!mouseDown) return;
  currentX = e.clientX;
  recordSwipeSample(currentX);
  var deltaX = currentX - startX;
  if (currentPanel === totalPanels - 1 && deltaX < 0) {
    var baseOffsetEnd = -currentPanel * stageWidth;
    var offsetEnd = baseOffsetEnd + deltaX * 0.35;
    var pctEnd = (offsetEnd / stageWidth) * (100 / totalPanels);
    track.style.transform = 'translateX(' + pctEnd + '%)';
    return;
  }
  if (currentPanel === 0 && deltaX > 0) {
    var baseOffsetStart = -currentPanel * stageWidth;
    var offsetStart = baseOffsetStart + deltaX * 0.35;
    var pctStart = (offsetStart / stageWidth) * (100 / totalPanels);
    track.style.transform = 'translateX(' + pctStart + '%)';
    return;
  }
  var baseOffset = -currentPanel * stageWidth;
  var offset = baseOffset + deltaX;
  var pct = (offset / stageWidth) * (100 / totalPanels);
  track.style.transform = 'translateX(' + pct + '%)';
});
window.addEventListener('mouseup', function() {
  if (!mouseDown) return;
  mouseDown = false;
  track.classList.remove('dragging');
  clearInlineFades();
  releaseSwipeGust();
  var deltaX = currentX - startX;
  var threshold = refWidth * 0.12;
  if (currentPanel === totalPanels - 1) {
    if (deltaX > threshold) goToPanel(currentPanel - 1, true);
    else bounceToCurrentPanel();
    return;
  }
  if (currentPanel === 0) {
    if (deltaX < -threshold) goToPanel(currentPanel + 1, true);
    else bounceToCurrentPanel();
    return;
  }
  if (deltaX < -threshold && currentPanel < totalPanels - 1) goToPanel(currentPanel + 1, true);
  else if (deltaX > threshold && currentPanel > 0) goToPanel(currentPanel - 1, true);
  else bounceToCurrentPanel();
});

document.addEventListener('keydown', function(e) {
  if (!nameConfirmed) return;
  if (e.key === 'ArrowRight') goToPanel(currentPanel + 1);
  if (e.key === 'ArrowLeft') goToPanel(currentPanel - 1);
});

window.addEventListener('scroll', function() {
  if (!tableUnlocked && window.scrollY > 0) { window.scrollTo(0, 0); return; }
}, { passive: true });

/* ============ TRANSITION LINE / TABLE VISIBILITY ============ */
var tableEnteredView = false;
var lastScrollY = 0;
var summaryHysteresisOn = false;
var summaryEverShown = false;
var lastScrollDirection = null;

function revealTableSection() {
  if (!tableEnteredView) {
    tableEnteredView = true;
    Hints && Hints.onTableReveal();
    document.body.classList.add('warm-background');
    divider.classList.add('active');
    rejectRow.classList.add('active');
    tableCard.classList.add('active');
  }
}

function updateSummaryVisibility(scrollY, vh) {
  var rows = getRows();
  var sY = (scrollY !== undefined) ? scrollY : (window.scrollY || window.pageYOffset || 0);
  var winH = (vh !== undefined) ? vh : window.innerHeight;

  if (summaryEverShown && rows.length >= 2 && _row1Height > 0) {
    var secondTop = _row1DocTop - sY;
    var secondBottom = secondTop + _row1Height;
    var firstTop = _row0DocTop - sY;

    var secondVisible = (secondTop < winH && secondBottom > 0);
    var firstOffBottom = (firstTop >= winH);

    if (lastScrollDirection === 'down' && secondVisible) {
      summaryHysteresisOn = true;
      summaryBar.classList.add('visible');
    } else if (lastScrollDirection === 'up' && firstOffBottom) {
      summaryHysteresisOn = false;
      summaryBar.classList.remove('visible');
    }
    updateNumpadVisibility();
    return;
  }

  var top = Math.min(_tcDocTop - sY, _rrDocTop - sY);
  var bottom = Math.max((_tcDocTop + _tcHeight) - sY, (_rrDocTop + _rrHeight) - sY);
  var totalHeight = bottom - top;
  if (totalHeight <= 0) {
    summaryBar.classList.remove('visible');
    summaryHysteresisOn = false;
    updateNumpadVisibility();
    return;
  }

  var visibleTop = Math.max(top, 0);
  var visibleBottom = Math.min(bottom, winH);
  var visibleHeight = Math.max(0, visibleBottom - visibleTop);
  var ratio = visibleHeight / totalHeight;
  var spansViewport = (top <= 0 && bottom >= winH);
  var effective = spansViewport ? 1 : ratio;

  if (!summaryHysteresisOn && effective >= 0.9) summaryHysteresisOn = true;
  else if (summaryHysteresisOn && effective < 0.5) summaryHysteresisOn = false;

  if (summaryHysteresisOn) {
    summaryBar.classList.add('visible');
    summaryEverShown = true;
  } else {
    summaryBar.classList.remove('visible');
  }
  updateNumpadVisibility();
}

function evaluateScrollState(scrollY, vh) {
  if (!tableUnlocked || _tlDocTop <= 0) return;

  var sY = (scrollY !== undefined) ? scrollY : (window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0);
  var winH = (vh !== undefined) ? vh : window.innerHeight;
  var lineTop = _tlDocTop - sY;

  if (lineTop < winH - 20) {
    revealTableSection();
  }
  updateSummaryVisibility(sY, winH);
  updateIntroHintVisibility(sY, winH);
}

/* ============================================================
   MERGED SCROLL DISPATCHER */
var scrollRafPending = false;

function scheduleScrollTick() {
  if (scrollRafPending) return;
  scrollRafPending = true;
  requestAnimationFrame(function() {
    scrollRafPending = false;
    var scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
    var vh = window.innerHeight;
    evaluateScrollState(scrollY, vh);
    updateTransitionBodyEffects();
  });
}

function scheduleEvaluation() { scheduleScrollTick(); }
function scheduleTransitionBodyUpdate() { scheduleScrollTick(); }

window.addEventListener('scroll', function() {
  _scrollActive = true;
  if (_scrollEndTimer) clearTimeout(_scrollEndTimer);
  _scrollEndTimer = setTimeout(function() {
    _scrollActive = false;
    _scrollEndTimer = null;
  }, 200);

  var y = window.pageYOffset || document.documentElement.scrollTop || 0;
  var goingDown = y > lastScrollY + 1;
  var goingUp = y < lastScrollY - 1;
  lastScrollY = y;
  if (goingDown) lastScrollDirection = 'down';
  else if (goingUp) lastScrollDirection = 'up';

  scheduleScrollTick();

  if (!tableVisited && _tcHeight > 0) {
    var tcTop = _tcDocTop - y;
    var tcBottom = tcTop + _tcHeight;
    if (tcTop < window.innerHeight && tcBottom > 0) {
      tableVisited = true;
    }
  }
}, { passive: true });

if ('onscrollend' in window) {
  window.addEventListener('scrollend', function() {
    if (_scrollEndTimer) {
      clearTimeout(_scrollEndTimer);
      _scrollEndTimer = null;
    }
    _scrollActive = false;
  }, { passive: true });
}

window.addEventListener('resize', function() {
  refreshTransitionGeometry();
  measureSummaryHeight();
  scheduleEvaluation();
  scheduleTransitionBodyUpdate();
  updateReceiptScrollIndicator();
});
window.addEventListener('orientationchange', function() {
  setTimeout(scheduleEvaluation, 120);
  setTimeout(repositionHintGroup, 200);
  setTimeout(repositionNumpad, 200);
  setTimeout(updateNumpadVisibility, 200);
  setTimeout(function() {
    refreshTransitionGeometry();
    measureSummaryHeight();
    scheduleTransitionBodyUpdate();
    updateReceiptScrollIndicator();
  }, 300);
});

scheduleEvaluation();
updateSummaryVisibility();
updateAllRowLocks();

/* ============ REJECT ROW ============ */
rejectRow.addEventListener('click', function() {
  haptic(10);
  Hints && Hints.interrupt();
  rejected = !rejected;
  if (rejected) {
    rejectRow.classList.add('selected');
    var rows = getRows();
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      row.classList.add('disabled');
      var ci = row.querySelector('.row-check');
      var pi = row.querySelector('.price-input');
      var ti = row.querySelector('.service-input');
      if (ci) {
        ci.setAttribute('data-reject-checked', ci.classList.contains('checked') ? '1' : '0');
        if (pi && pi.value !== '') ci.setAttribute('data-reject-price', pi.value);
        else ci.removeAttribute('data-reject-price');
        if (ti && ti.value.trim() !== '') ci.setAttribute('data-reject-service', ti.value);
        else ci.removeAttribute('data-reject-service');
        ci.classList.remove('checked');
        ci.setAttribute('aria-checked', 'false');
      }
      if (pi) pi.value = '';
      if (ti) ti.value = '';
      row.classList.remove('filled');
      updateRowLock(row);
    }
    updateRejectThanksContent();
    setTimeout(function() { rejectThanks.classList.add('shown'); }, 350);
    petalOverlay.classList.remove('active');
    void petalOverlay.offsetWidth;
    petalOverlay.classList.add('active');
    if (numpad) numpad.classList.remove('visible');

    if (rejectScrollTimer) { clearTimeout(rejectScrollTimer); rejectScrollTimer = null; }
    rejectScrollTimer = setTimeout(function() {
      rejectScrollTimer = null;
      var rect = rejectRow.getBoundingClientRect();
      var vh = window.innerHeight;
      var summaryH = 0;
      if (summaryBar) {
        var sr = summaryBar.getBoundingClientRect();
        if (sr.height > 0) summaryH = sr.height;
      }
      if (summaryH < 60) summaryH = 80;
      var bottomSafe = summaryH + 40;
      var overflow = rect.bottom - (vh - bottomSafe);
      if (overflow > 0) {
        try { window.scrollBy({ top: overflow, behavior: 'smooth' }); }
        catch (e) { window.scrollBy(0, overflow); }
      }
    }, 1300);
  } else {
    if (rejectScrollTimer) { clearTimeout(rejectScrollTimer); rejectScrollTimer = null; }
    rejectRow.classList.remove('selected');
    rejectThanks.classList.remove('shown');
    petalOverlay.classList.remove('active');
    var rows2 = getRows();
    for (var j = 0; j < rows2.length; j++) {
      var row2 = rows2[j];
      row2.classList.remove('disabled');
      var ci2 = row2.querySelector('.row-check');
      var pi2 = row2.querySelector('.price-input');
      var ti2 = row2.querySelector('.service-input');
      if (ci2) {
        var wasChecked = ci2.getAttribute('data-reject-checked') === '1';
        var savedPrice = ci2.getAttribute('data-reject-price');
        var savedService = ci2.getAttribute('data-reject-service');
        if (savedService !== null && savedService !== '' && ti2) ti2.value = savedService;
        if (savedPrice !== null && savedPrice !== '' && pi2) pi2.value = savedPrice;
        if (wasChecked) {
          ci2.classList.add('checked');
          ci2.setAttribute('aria-checked', 'true');
          row2.classList.add('filled');
        } else {
          ci2.classList.remove('checked');
          ci2.setAttribute('aria-checked', 'false');
          row2.classList.remove('filled');
        }
        ci2.removeAttribute('data-reject-checked');
        ci2.removeAttribute('data-reject-price');
        ci2.removeAttribute('data-reject-service');
      }
      updateRowLock(row2);
    }
  }
  recalc();
  updateSubmitState();
  setTimeout(updateSummaryVisibility, 400);
  setTimeout(updateSummaryVisibility, 900);
});

recalc();

/* ============ THEME / WEATHER ============ */
function getTimeOfDayInNagoya() {
  var h;
  try {
    var parts = new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: NAGOYA.tz }).formatToParts(new Date());
    for (var i = 0; i < parts.length; i++) if (parts[i].type === 'hour') { h = parseInt(parts[i].value, 10); break; }
  } catch (e) { h = new Date().getHours(); }
  if (h === undefined) h = new Date().getHours();
  if (h >= 5 && h < 11) return 'morning';
  if (h >= 11 && h < 17) return 'day';
  if (h >= 17 && h < 21) return 'evening';
  return 'night';
}
function applyTimeTheme() { document.documentElement.setAttribute('data-time', getTimeOfDayInNagoya()); applyNightText(); }

/* Night text: from 18:00 to 06:00 Nagoya time <body> carries .night-text, and
   main.css swaps the message and thank-you text to a darker brown. */
function applyNightText() {
  var p = nagoyaDateParts();
  document.body.classList.toggle('night-text', p.hour >= 18 || p.hour < 6);
}

function weatherBucket(code) {
  if (code === 0) return 'clear';
  if (code === 1 || code === 2) return 'clouds';
  if (code === 3) return 'clouds';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 57) return 'drizzle';
  if (code >= 61 && code <= 67) return 'rain';
  if (code >= 71 && code <= 77) return 'snow';
  if (code >= 80 && code <= 82) return 'rain';
  if (code === 85 || code === 86) return 'snow';
  if (code >= 95) return 'thunderstorm';
  return 'clear';
}
function weatherEmoji(bucket) {
  if (bucket === 'clear') return '☀';
  if (bucket === 'clouds') return '☁';
  if (bucket === 'fog') return '🌫';
  if (bucket === 'drizzle') return '🌦';
  if (bucket === 'rain') return '🌧';
  if (bucket === 'snow') return '❄';
  if (bucket === 'thunderstorm') return '⛈';
  return '—';
}
function nagoyaDateParts() {
  var now = new Date();
  try {
    var parts = new Intl.DateTimeFormat('en-US', {
      month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric',
      weekday: 'short', hour12: false, timeZone: NAGOYA.tz
    }).formatToParts(now);
    var result = { month: 0, day: 0, hour: 0, minute: 0, weekday: 0 };
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      if (p.type === 'month') result.month = parseInt(p.value, 10);
      if (p.type === 'day') result.day = parseInt(p.value, 10);
      if (p.type === 'hour') result.hour = parseInt(p.value, 10);
      if (p.type === 'minute') result.minute = parseInt(p.value, 10);
      if (p.type === 'weekday') {
        var map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
        result.weekday = map[p.value] !== undefined ? map[p.value] : 0;
      }
    }
    return result;
  } catch (e) {
    var d = new Date();
    return { month: d.getMonth() + 1, day: d.getDate(), hour: d.getHours(), minute: d.getMinutes(), weekday: d.getDay() };
  }
}
function updateInfoDateTime() {
  var p = nagoyaDateParts();
  var hhPadded = (p.hour < 10) ? ('0' + p.hour) : String(p.hour);
  var mmPadded = (p.minute < 10) ? ('0' + p.minute) : String(p.minute);
  var wd = JP_WEEKDAYS[p.weekday];
  infoDate.textContent = p.month + '月' + p.day + '日(' + wd + ')';
  infoTime.textContent = hhPadded + '時' + mmPadded + '分';
  applyNightText();

  /* December auto-switchover. Fires on the 30s clock tick so a
     session left running across the 1 Dec 00:01 boundary flips
     without waiting for a reload. Suppressed once the user has
     tapped the toggle. Duplicate of the window.load check — both
     sites are idempotent and each covers a distinct timing case. */
  if (!_themeManuallySet && currentTheme === 'autumn' && isNagoyaWinterSeason()) {
    applyTheme('winter');
  }
}

/* ============================================================
   DYNAMIC GREETING (Panel 0) */
var GREETING_TABLE = {
  A1: { text: '雪の降る中、夜遅いお時間に、お部屋までお越しいただき、誠にありがとうございます。', burden: true },
  A2: { text: '雨で足元の悪い中、夜遅いお時間にお部屋までお越しいただき、誠にありがとうございます。', burden: true },
  A3: { text: '冷え込みの厳しい中、夜遅いお時間にお部屋までお越しいただき、誠にありがとうございます。', burden: true },
  A4: { text: '雨の中、朝早くからお部屋までお越しいただき、誠にありがとうございます。', burden: true },
  A5: { text: '朝の冷え込みが厳しい中、お部屋までお越しいただき、誠にありがとうございます。', burden: true },

  B1: { text: 'あいにくのお天気の中、無事にお部屋までお越しいただき、誠にありがとうございます。', burden: true },
  B2: { text: '雨で足元の悪い中、お部屋までお越しいただき、誠にありがとうございます。', burden: true },
  B3: { text: '雪の降る寒い中、お部屋までお越しいただき、誠にありがとうございます。', burden: true },
  B4: { text: '霧で視界の悪い中、無事にお越しいただき、誠にありがとうございます。', burden: true },

  C1: { text: '冷え込みの厳しい中、お部屋までお越しいただき、誠にありがとうございます。', burden: true },
  C2: { text: '肌寒い中、お部屋までお越しいただき、ありがとうございます。', burden: false },
  C3: { text: '暑い中、お部屋までお越しいただき、誠にありがとうございます。', burden: true },

  D1: { text: '夜遅いお時間にもかかわらず、お部屋までお越しいただき、誠にありがとうございます。', burden: false },
  D2: { text: '朝早くからお部屋までお越しいただき、誠にありがとうございます。', burden: false },
  D3: { text: '夕方のお時間に、お部屋までお越しいただき、誠にありがとうございます。', burden: false },
  D4: { text: '穏やかなお天気の中、お部屋までお越しいただき、誠にありがとうございます。', burden: false },

  E1: { text: '秋風の心地よい中、お部屋までお越しいただき、誠にありがとうございます。', burden: false }
};

/* A seasonal line for Panel 0, picked by the current month in Nagoya.
   It comes right after 「〇〇さん、初めまして。」, before the line about
   the weather. Index 0 is January. */
var SEASONAL_LINES = [
  '冬晴れの澄んだ空に、心もすっと晴れるようですね。',
  '梅の花がほころび、春の気配を感じる頃ですね。',
  'やわらかな日差しに、春の訪れを感じますね。',
  '桜が咲き、街の景色も華やぐ季節になりましたね。',
  '若葉がみずみずしく、風も心地よい季節ですね。',
  '雨に濡れた緑が、ひときわ鮮やかに感じられますね。',
  '夏の日差しに、季節の移ろいを感じる頃ですね。',
  '夏空の広がる、暑い日が続いておりますね。',
  '少しずつ暑さが和らぎ、秋の気配が感じられますね。',
  '金木犀の甘い香りに、秋の深まりを感じる頃ですね。',
  '木々の葉が少しずつ色づき、秋も深まってまいりましたね。',
  '朝晩の冷え込みに、冬の訪れを感じる頃ですね。'
];
function seasonalLineFor(month) {
  var m = parseInt(month, 10);
  if (!(m >= 1 && m <= 12)) return '';
  return SEASONAL_LINES[m - 1];
}

function getGreetingTier() {
  var time = getTimeOfDayInNagoya();
  var weather = currentWeatherBucket;
  var temp = currentTemp;

  var isRain = (weather === 'rain' || weather === 'drizzle');
  var isCold = (temp !== null && temp <= 9);
  var isNight = (time === 'night');
  var isMorning = (time === 'morning');

  if (weather === 'snow' && isNight) return 'A1';
  if (isRain && isNight) return 'A2';
  if (isCold && isNight) return 'A3';
  if (isRain && isMorning) return 'A4';
  if (isCold && isMorning) return 'A5';

  if (weather === 'thunderstorm') return 'B1';
  if (isRain) return 'B2';
  if (weather === 'snow') return 'B3';
  if (weather === 'fog') return 'B4';

  if (isCold) return 'C1';
  if (temp !== null && temp <= 14) return 'C2';
  if (temp !== null && temp >= 28) return 'C3';

  if (temp !== null) {
    if (isNight) return 'D1';
    if (isMorning) return 'D2';
    if (time === 'evening') return 'D3';
    if (time === 'day') return 'D4';
  }

  return 'E1';
}

function updateGreetingPanel() {
  var el = document.getElementById('panelGreetingBody');
  if (!el) return;

  var tier = getGreetingTier();
  if (!GREETING_TABLE[tier]) {
    console.warn('Unmapped greeting tier:', tier);
  }
  var entry = GREETING_TABLE[tier] || GREETING_TABLE.E1;

  var closing = entry.burden
    ? 'どうぞご無理なさらず、おくつろぎください。'
    : 'どうぞ肩の力を抜いて、おくつろぎください。';

  var seasonal = seasonalLineFor(nagoyaDateParts().month);
  el.innerHTML = (seasonal ? '<p>' + seasonal + '</p>' : '') + '<p>' + entry.text + '</p><p>' + closing + '</p>';

  var p0 = document.querySelector('.panel[data-panel="0"]');
  if (p0) preparePanel(p0);
}

function getTimeGreeting() {
  var t = getTimeOfDayInNagoya();
  if (t === 'morning') return 'おはようございます';
  if (t === 'day') return 'こんにちは';
  return 'こんばんは';
}

function updateBlossomGreeting() {
  if (blossomGreetingTimeEl) {
    blossomGreetingTimeEl.textContent = getTimeGreeting();
  }
  if (blossomGreetingNameEl) {
    blossomGreetingNameEl.textContent = therapistDisplayName || '桜庭さん';
  }
}

function fetchNagoyaWeather() {
  var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + NAGOYA.lat + '&longitude=' + NAGOYA.lon +
            '&current=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,cloud_cover,precipitation,relative_humidity_2m' +
            '&wind_speed_unit=ms&models=jma_seamless&timezone=Asia%2FTokyo';
  fetch(url).then(function(r) { return r.json(); }).then(function(data) {
    if (!data || !data.current) return;
    if (typeof DynBG !== 'undefined' && DynBG) DynBG.onWeather(data.current);
    if (Furin) Furin.onWeather(data.current);
    var temp = data.current.temperature_2m;
    var code = data.current.weather_code;
    if (typeof temp === 'number') {
      currentTemp = Math.round(temp);
      infoTemp.textContent = currentTemp + '°';
    }
    if (typeof code === 'number') {
      currentWeatherBucket = weatherBucket(code);
      infoWeather.textContent = weatherEmoji(currentWeatherBucket);
      document.documentElement.setAttribute('data-weather', currentWeatherBucket);
    }
    if (!greetingFinalized) {
      updateGreetingPanel();
    }
  }).catch(function() {
    if (!greetingFinalized) {
      updateGreetingPanel();
    }
  });
}

/* ============ TICKER ============ */
function buildTickerUrl() {
  var lats = TICKER_CITIES.map(function(c) { return c.lat; }).join(',');
  var lons = TICKER_CITIES.map(function(c) { return c.lon; }).join(',');
  return 'https://api.open-meteo.com/v1/forecast?latitude=' + lats + '&longitude=' + lons +
         '&hourly=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code' +
         '&timezone=Asia%2FTokyo&forecast_days=2';
}
function formatTemp(t) { if (t === null || t === undefined) return '—'; return Math.round(t) + '°'; }
function getNext3Hours(hourly, nowHour) {
  if (!hourly || !hourly.time || !hourly.temperature_2m) return [];
  var times = hourly.time, temps = hourly.temperature_2m, codes = hourly.weather_code || [];
  var out = [];
  for (var i = 0; i < times.length && out.length < 3; i++) {
    var h = parseInt(times[i].slice(11, 13), 10);
    if (out.length === 0) {
      if (h >= nowHour) out.push({ h: h, t: temps[i], c: codes[i] });
    } else {
      out.push({ h: h, t: temps[i], c: codes[i] });
    }
  }
  return out;
}
function getTomorrowDaily(daily) {
  if (!daily || !daily.time || daily.time.length < 2) return null;
  return { date: daily.time[1], high: daily.temperature_2m_max[1], low: daily.temperature_2m_min[1], code: daily.weather_code[1] };
}
function buildTickerText(responses) {
  if (!responses || responses.length === 0) return '';
  var parts = [];
  var nagoyaData = responses[0];
  if (nagoyaData) {
    var nowP = nagoyaDateParts();
    var next3 = getNext3Hours(nagoyaData.hourly, nowP.hour);
    if (next3.length > 0) {
      var hours = next3.map(function(x) { return weatherEmoji(weatherBucket(x.c)) + formatTemp(x.t); }).join(' → ');
      parts.push('名古屋市 3時間 ' + hours);
    }
  }
  var tomorrowParts = [];
  for (var i = 0; i < responses.length && i < TICKER_CITIES.length; i++) {
    var data = responses[i];
    if (!data) continue;
    var t = getTomorrowDaily(data.daily);
    if (!t) continue;
    var e = weatherEmoji(weatherBucket(t.code));
    tomorrowParts.push(TICKER_CITIES[i].name + ' ' + e + ' ' + formatTemp(t.high) + '/' + formatTemp(t.low));
  }
  if (tomorrowParts.length > 0) parts.push('明日: ' + tomorrowParts.join(' ・ '));
  return parts.join(' ・ ');
}
function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function renderTicker(text) {
  if (!tickerTrack || !tickerWrap) return;
  if (!text || text === '') { tickerWrap.classList.remove('shown'); tickerTrack.textContent = ''; return; }
  var half = text + ' ・ ';
  /* The bullets are the wind line's: the same · glyph and size (.hud-sep). */
  var halfHtml = escapeHtml(half).split('・').join('<span class="hud-sep">·</span>');
  var html = '<span>' + halfHtml + '</span><span>' + halfHtml + '</span>';
  tickerTrack.innerHTML = html;
  tickerWrap.classList.add('shown');
}
function fetchTickerData() {
  fetch(buildTickerUrl()).then(function(r) { return r.json(); }).then(function(data) {
    var responses = Array.isArray(data) ? data : [data];
    var text = buildTickerText(responses);
    renderTicker(text);
    if (tickerTrack) {
      tickerTrack.style.animation = 'none';
      void tickerTrack.offsetWidth;
      tickerTrack.style.animation = '';
    }
  }).catch(function() {});
}
var clockInterval = null, weatherInterval = null, tickerInterval = null;
function startInfoUpdates() {
  infoCity.textContent = NAGOYA.name;
  updateInfoDateTime();
  fetchNagoyaWeather();
  fetchTickerData();
  if (clockInterval) clearInterval(clockInterval);
  clockInterval = setInterval(updateInfoDateTime, 30000);
  if (weatherInterval) clearInterval(weatherInterval);
  weatherInterval = setInterval(fetchNagoyaWeather, 5 * 60 * 1000);
  if (tickerInterval) clearInterval(tickerInterval);
  tickerInterval = setInterval(fetchTickerData, 15 * 60 * 1000);
}

/* ============ THANK-YOU CAROUSEL ============ */
var TY_TOTAL_PANELS = 4;
var tyCurrentPanel = 0;
var tyStageWidth = window.innerWidth;
var tyRefWidth = Math.min(window.innerWidth, 600);
var tyExited = false;

/* Autumn: the thank-you swipe hint and its dots (moved together) sit just under the longest of the four
   screens' text (18px below it), clear of the torii and lanterns. In
   the other themes the stylesheet position applies. */
function repositionTySwipeHint() {
  if (!tySwipeHint || !thankyouScreen) return;
  if (currentTheme !== 'autumn') {
    tySwipeHint.style.bottom = '';
    if (tyDotsEl) tyDotsEl.style.bottom = '';
    return;
  }
  var screenRect = thankyouScreen.getBoundingClientRect();
  if (screenRect.height <= 0) return;
  var contents = thankyouScreen.querySelectorAll('.ty-panel-content');
  var lowest = 0;
  for (var i = 0; i < contents.length; i++) {
    var b = contents[i].getBoundingClientRect().bottom - screenRect.top;
    if (b > lowest) lowest = b;
  }
  if (lowest <= 0) return;
  var tyHintBottom = Math.max(0, screenRect.height - lowest - 18 - 32);
  tySwipeHint.style.bottom = tyHintBottom + 'px';
  if (tyDotsEl) tyDotsEl.style.bottom = Math.max(0, tyHintBottom - 7 - 6) + 'px';
}
function updateTySwipeHint() {
  if (!tySwipeHint || !tySwipeHintLabel) return;
  repositionTySwipeHint();
  if (tyExited) { tySwipeHint.classList.remove('shown'); return; }
  if (tyCurrentPanel === TY_TOTAL_PANELS - 1) tySwipeHintLabel.textContent = 'もう一度左にスワイプ';
  else tySwipeHintLabel.textContent = '左にスワイプ';
  tySwipeHint.classList.add('shown');
}
/* Panel-1 content is derived from the live receipt DOM at paint
   time. The previous form read firstServiceInReceipt, a snapshot
   taken inside buildReceipt() and never refreshed when the
   therapist removed the first-preset line item via the × button.
   Confirming a receipt whose first item had been removed still
   rendered the microbikini variant. The same stale flag leaked
   through the reopened-from-thankyou path, where the receipt was
   re-built on reopen but resumeThankyouSequence() never
   re-rendered the panel. Deriving from the DOM closes both: the
   receipt's elements are still present at every
   applyTyPanel1Content() call site (direct path: receiptScreen
   still .visible; reopened path: screen hidden but DOM intact).

   The rejected guard covers the one path that does not rebuild
   the receipt: confirmYes's rejected branch transitions straight
   to thankyouScreen without calling buildReceipt(), so
   receiptItems may still hold the previous session's elements.
   Without the guard the DOM walk would find that stale
   first-preset item and paint the microbikini variant for a
   session that rejected everything. */
function applyTyPanel1Content() {
  if (!tyPanel1Content) return;

  /* If the session was rejected, always show the default polite message */
  if (rejected) {
    firstServiceInReceipt = false;
    tyPanel1Content.innerHTML = TY_PANEL1_DEFAULT_HTML;
    return;
  }

  var preset0Name = (PRESETS[0] && PRESETS[0].name) ? PRESETS[0].name : '';
  var firstMatches = false;
  if (preset0Name !== '' && receiptItems) {
    var items = receiptItems.querySelectorAll('.receipt-item');
    for (var i = 0; i < items.length; i++) {
      var el = items[i];
      if (el.getAttribute('data-removing') === 'true') continue;
      if (el.classList.contains('removing')) continue;
      var nameEl = el.querySelector('.receipt-item-name');
      firstMatches = !!(nameEl && nameEl.textContent.trim() === preset0Name);
      break;
    }
  }
  firstServiceInReceipt = firstMatches;

  if (firstServiceInReceipt) {
    tyPanel1Content.innerHTML = TY_PANEL1_MICROBIKINI_HTML;
  } else {
    tyPanel1Content.innerHTML = TY_PANEL1_DEFAULT_HTML;
  }
}
function activateTyPanel(index) {
  for (var i = 0; i < tyPanels.length; i++) {
    tyPanels[i].classList.remove('active', 'leaving');
    if (i === index) tyPanels[i].classList.add('active');
    else if (i < index) tyPanels[i].classList.add('leaving');
  }
}
function goToTyPanel(index) {
  var clamped = Math.max(0, Math.min(TY_TOTAL_PANELS - 1, index));
  tyCurrentPanel = clamped;
  NavSpring && NavSpring.panelChanged('ty', tyCurrentPanel);
  tyTrack.style.transform = 'translateX(-' + (tyCurrentPanel * (100 / TY_TOTAL_PANELS)) + '%)';
  for (var i = 0; i < tyDots.length; i++) tyDots[i].classList.toggle('active', i === tyCurrentPanel);
  activateTyPanel(tyCurrentPanel);
  updateTySwipeHint();
}
function exitTyToGames() {
  if (tyExited) return;
  tyExited = true;
  tySwipeHint.classList.remove('shown');
  tyDotsEl.classList.add('hidden');
  tyCarousel.classList.add('hidden-out');
  tyPushTimeout(function() {
    tyAmbientStage.classList.add('shown');
    GameWindow.start();
  }, 700);
}
var tyStartX = 0, tyStartY = 0, tyCurrentX = 0;
var tyDragging = false, tyDecided = false, tyHorizontal = false;
var tyMouseDown = false;
function tyTouchStart(e) {
  if (tyExited) return;
  tyStartX = e.touches[0].clientX;
  tyStartY = e.touches[0].clientY;
  tyCurrentX = tyStartX;
  tyDragging = true; tyDecided = false; tyHorizontal = false;
  startSwipeTracking();
  recordSwipeSample(tyStartX);
}
function tyTouchMove(e) {
  if (!tyDragging || tyExited) return;
  var x = e.touches[0].clientX, y = e.touches[0].clientY;
  var deltaX = x - tyStartX, deltaY = y - tyStartY;
  if (!tyDecided) {
    if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) {
      tyDecided = true;
      tyHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
      if (tyHorizontal) tyTrack.classList.add('dragging');
    }
  }
  if (tyHorizontal) {
    e.preventDefault();
    tyCurrentX = x;
    recordSwipeSample(x);
    var baseOffset = -tyCurrentPanel * tyStageWidth;
    var offset = baseOffset + deltaX;
    if (tyCurrentPanel === 0 && deltaX > 0) offset = baseOffset + deltaX * 0.35;
    if (tyCurrentPanel === TY_TOTAL_PANELS - 1 && deltaX < 0) offset = baseOffset + deltaX * 0.5;
    var pct = (offset / tyStageWidth) * (100 / TY_TOTAL_PANELS);
    tyTrack.style.transform = 'translateX(' + pct + '%)';
    var dragRatio = Math.min(1, Math.abs(deltaX) / (tyRefWidth * 0.35));
    if (deltaX < 0) {
      if (tyPanels[tyCurrentPanel]) {
        var curC = tyPanels[tyCurrentPanel].querySelector('.ty-panel-content');
        if (curC) curC.style.opacity = 1 - dragRatio * 0.9;
      }
      if (tyPanels[tyCurrentPanel + 1]) {
        var nextC = tyPanels[tyCurrentPanel + 1].querySelector('.ty-panel-content');
        if (nextC) {
          nextC.style.opacity = dragRatio;
          nextC.style.transform = 'translateX(' + (40 - 40 * dragRatio) + 'px)';
          nextC.style.filter = 'blur(' + (4 - 4 * dragRatio) + 'px)';
        }
      }
    } else if (deltaX > 0) {
      if (tyPanels[tyCurrentPanel]) {
        var curC2 = tyPanels[tyCurrentPanel].querySelector('.ty-panel-content');
        if (curC2) curC2.style.opacity = 1 - dragRatio;
      }
      if (tyPanels[tyCurrentPanel - 1]) {
        var prevC = tyPanels[tyCurrentPanel - 1].querySelector('.ty-panel-content');
        if (prevC) {
          prevC.style.opacity = dragRatio;
          prevC.style.transform = 'translateX(' + (-40 + 40 * dragRatio) + 'px)';
          prevC.style.filter = 'blur(' + (4 - 4 * dragRatio) + 'px)';
        }
      }
    }
  }
}
function clearTyInlineFades() {
  for (var c = 0; c < tyPanels.length; c++) {
    var content = tyPanels[c].querySelector('.ty-panel-content');
    if (content) { content.style.opacity = ''; content.style.transform = ''; content.style.filter = ''; }
  }
}
function tyTouchEnd() {
  if (!tyDragging) return;
  tyDragging = false;
  tyTrack.classList.remove('dragging');
  if (!tyHorizontal) { clearTyInlineFades(); return; }
  clearTyInlineFades();
  releaseSwipeGust();
  var deltaX = tyCurrentX - tyStartX;
  var threshold = tyRefWidth * 0.12;
  if (tyCurrentPanel === TY_TOTAL_PANELS - 1) {
    if (deltaX < -threshold) { exitTyToGames(); return; }
    if (deltaX > threshold && tyCurrentPanel > 0) { goToTyPanel(tyCurrentPanel - 1); return; }
    goToTyPanel(tyCurrentPanel); return;
  }
  if (deltaX < -threshold && tyCurrentPanel < TY_TOTAL_PANELS - 1) goToTyPanel(tyCurrentPanel + 1);
  else if (deltaX > threshold && tyCurrentPanel > 0) goToTyPanel(tyCurrentPanel - 1);
  else goToTyPanel(tyCurrentPanel);
}
tyCarousel.addEventListener('touchstart', tyTouchStart, { passive: true });
tyCarousel.addEventListener('touchmove', tyTouchMove, { passive: false });
tyCarousel.addEventListener('touchend', tyTouchEnd, { passive: true });
tyCarousel.addEventListener('touchcancel', tyTouchEnd, { passive: true });
tyCarousel.addEventListener('mousedown', function(e) {
  if (tyExited) return;
  tyMouseDown = true;
  tyStartX = e.clientX; tyCurrentX = e.clientX;
  startSwipeTracking();
  recordSwipeSample(tyStartX);
  tyTrack.classList.add('dragging');
});
window.addEventListener('mousemove', function(e) {
  if (!tyMouseDown || tyExited) return;
  tyCurrentX = e.clientX;
  recordSwipeSample(tyCurrentX);
  var deltaX = tyCurrentX - tyStartX;
  var baseOffset = -tyCurrentPanel * tyStageWidth;
  var offset = baseOffset + deltaX;
  if (tyCurrentPanel === 0 && deltaX > 0) offset = baseOffset + deltaX * 0.35;
  if (tyCurrentPanel === TY_TOTAL_PANELS - 1 && deltaX < 0) offset = baseOffset + deltaX * 0.5;
  var pct = (offset / tyStageWidth) * (100 / TY_TOTAL_PANELS);
  tyTrack.style.transform = 'translateX(' + pct + '%)';
});
window.addEventListener('mouseup', function() {
  if (!tyMouseDown) return;
  tyMouseDown = false;
  if (tyExited) return;
  tyTrack.classList.remove('dragging');
  clearTyInlineFades();
  releaseSwipeGust();
  var deltaX = tyCurrentX - tyStartX;
  var threshold = tyRefWidth * 0.12;
  if (tyCurrentPanel === TY_TOTAL_PANELS - 1) {
    if (deltaX < -threshold) { exitTyToGames(); return; }
    if (deltaX > threshold && tyCurrentPanel > 0) { goToTyPanel(tyCurrentPanel - 1); return; }
    goToTyPanel(tyCurrentPanel); return;
  }
  if (deltaX < -threshold && tyCurrentPanel < TY_TOTAL_PANELS - 1) goToTyPanel(tyCurrentPanel + 1);
  else if (deltaX > threshold && tyCurrentPanel > 0) goToTyPanel(tyCurrentPanel - 1);
  else goToTyPanel(tyCurrentPanel);
});

/* ============ THANK-YOU TIMERS ============ */
var tyTimers = [];
var tyIntervals = [];

/* ============ GAMES IN THE ROUND WINDOW (ポン) ============
   Shown when she swipes past the last thank-you message, in place of
   the quotes. The same round window (丸窓): the faint ring, the halo,
   the pond and three ripples on the 4-second breath. Inside it, a
   one-finger Pong:

     · two curved paddles on the ring, opposite each other, follow the
       finger (they point where the finger is, anywhere on the screen);
     · a round lasts 60 seconds, one full turn of the countdown ring;
     · one point per paddle hit; after every 4 hits in a row another
       ball joins (up to 5), with a ripple and ボール追加！;
     · the paddles shrink from 60° to 10° over the first 50 seconds;
     · the last 10 seconds glow on the ring and tick softly;
     · the centre shows 現在のスコア / 最高スコア / 残り時間, a button
       (タッチしてスタート before a round, the result and
       ここをタップして続ける after one) and short instructions.
       The button sits exactly at the centre of the ring.

   Only the button starts or continues a round, and pressing it does
   not move the paddles. The top score is kept for this visit only
   (newVisit() clears it).

   Look: while the games page is showing, the falling leaves (snow in winter)
   fade out (body.games-active in main.css).

   Sound: the games page opens quietly: the ambient music carries on.
   Only when she taps タッチしてスタート does it fade out and a short
   retro (chiptune) loop, さくら散歩, play instead. If she
   doesn't continue within G.idleReturn ms after a round, the game music
   fades out and the ambient music comes back (tapping
   ここをタップして続ける before that keeps the game music). When she
   leaves the page (the receipt, back to the table) the game music fades
   out and the ambient music comes back. The music display on the toolbar
   stays throughout; while the game music plays it shows the ambient
   track as paused. Game sounds go straight to the
   speakers through their own gain, not through soundMasterGain, so
   they don't drive the swell analyser.

   The numbers in G and QW are the settings chosen in
   games-preview.html (“Copy values”).

   Public: GameWindow.start(), .stop(), .newVisit() */
var GameWindow = (function() {
  var G = {
    size: 610,
    round: 60,                 /* seconds per round: one full turn of the countdown */
    warnSecs: 10,              /* the last seconds glow and tick */
    overGuard: 1200,           /* ms after a round ends before the continue button counts */
    idleReturn: 20000,         /* ms after a round with no tap on continue: the ambient music returns */
    steerSlop: 20,             /* px: the finger that started a round must move this far before it steers */
    deadCentre: 20,            /* px: a finger this close to the ring's centre doesn't turn the paddles */
    scoreShadow: 0.6,          /* drop shadow under 現在のスコア */
    howtoFill: 66,             /* instructions: the longest line fills this % of the ring */
    howtoMin: 13,              /* instructions: never smaller than this (px) */
    howtoLine: 2,              /* instructions: line height */
    gapEm: 3,                  /* space between the button and the scores / instructions (em) */
    volume: 0.35,              /* chimes */
    musicVol: 0.5,
    cPaddle: '#725750', cBall: '#E66826',
    ballSpeed: 220,            /* px/s at the start */
    speedUp: 15,               /* % per paddle hit */
    maxSpeed: 770,             /* px/s */
    ballR: 12,
    padStart: 60, padMin: 10, shrinkSecs: 50,     /* paddle length (degrees) shrinks over the round */
    padW: 14,
    english: 36,               /* edge hits angle the ball by up to this many degrees */
    respawn: 1.4,              /* s before a new ball moves */
    trailLen: 85,              /* px of soft trail behind the ball */
    extraHits: 4,              /* hits in a row for an extra ball */
    maxBalls: 5
  };
  var QW = {
    size: 610, band: 10, soft: 4, track: 0.8,
    bodyW: 12, headW: 23, neck: 40, head: true,
    tail: 360, taper: 0.6, startFade: 58,
    bloom: true, fadeBack: 1.4, ripReach: 1.4,
    dprCap: 1.5,
    cRing: '#FFFDF9', cStart: '#EE9A5C', cEnd: '#B5262B',
    cHalo: '#E0705F'
  };
  var HOWTO = [
    '指を置いた方向へ、パドルが動きます',
    'ボールを輪の外に出さないよう、打ち返しましょう',
    G.extraHits + '回続けて打ち返すと、ボールが増えます',
    G.round + '秒で、最高スコアを目指しましょう'
  ];

  var stage = document.getElementById('tyAmbientStage');
  var inner = stage ? stage.querySelector('.ty-ambient-inner') : null;
  var win = document.getElementById('quoteWindow');
  var ringCv = document.getElementById('quoteRingCanvas');
  var ripCv = document.getElementById('quoteRippleCanvas');
  var gameCv = document.getElementById('gameCanvas');
  var scoreBox = document.getElementById('gameScore');
  var scoreNowEl = document.getElementById('gameScoreNow');
  var scoreBestEl = document.getElementById('gameScoreBest');
  var scoreTimeEl = document.getElementById('gameScoreTime');
  var btnEl = document.getElementById('gameBtn');
  var msgEl = document.getElementById('gameMsg');
  var tapEl = document.getElementById('gameTap');
  var howEl = document.getElementById('gameHow');
  var softGlow = win ? win.querySelector('.soft-glow') : null;
  if (!stage || !inner || !win || !ringCv || !ripCv || !gameCv || !scoreBox || !btnEl || !howEl || !softGlow) {
    return { start: function() {}, stop: function() {}, newVisit: function() {} };
  }
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var BREATH = 4000;
  var DEG = Math.PI / 180;

  /* ---------- colours ---------- */
  function rgbOf(hex) {
    var h = String(hex).replace('#', '');
    if (h.length === 3) h = h.replace(/(.)/g, '$1$1');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function blend(a, b, t) {
    var x = rgbOf(a), y = rgbOf(b);
    return [0, 1, 2].map(function (i) { return Math.round(x[i] + (y[i] - x[i]) * t); });
  }
  function rgbaA(c, a) { return 'rgba(' + c[0] + ', ' + c[1] + ', ' + c[2] + ', ' + a + ')'; }
  function lerpC(a, b, t) { return [0, 1, 2].map(function (i) { return Math.round(a[i] + (b[i] - a[i]) * t); }); }
  function smooth(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function wrapAng(a) { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; }

  /* ============================================================
     THE RING — the faint track, the countdown (the round's clock),
     the bloom when it completes, and the ripples on the breath.
     Same drawing as the quotes window had.
     ============================================================ */
  var ringCtx = ringCv.getContext('2d');
  var ripCtx = ripCv.getContext('2d');
  var CV = { key: '', S: 0, dpr: 1, RS: 0 };
  var COL = { start: rgbOf(QW.cStart), end: rgbOf(QW.cEnd), ring: rgbOf(QW.cRing), rip: blend(QW.cRing, QW.cHalo, 0.5) };
  var PASSES = 5;
  var breathOrigin = 0;
  var prevSweep = null;
  var finalCv = document.createElement('canvas');
  var finalCtx = finalCv.getContext('2d');
  var S = { D: 1, prog: 0, t0: 0, phase: 'idle' };

  function stepAlpha(p, total) { return (total / PASSES) / (1 - total * p / PASSES); }
  function canvasPad() { return Math.ceil(QW.headW * 1.9 + 14); }

  function sizeCanvases() {
    var D = QW.size;
    var Sz = D + 2 * canvasPad();
    var dpr = Math.min(QW.dprCap, window.devicePixelRatio || 1);
    var RS = Math.ceil(D * QW.ripReach + 20);
    var key = [Sz, dpr, RS].join();
    if (key === CV.key) return;
    CV = { key: key, S: Sz, dpr: dpr, RS: RS };
    ringCv.width = ringCv.height = finalCv.width = finalCv.height = Math.round(Sz * dpr);
    ringCv.style.width = ringCv.style.height = Sz + 'px';
    ringCv.style.margin = (-Sz / 2) + 'px 0 0 ' + (-Sz / 2) + 'px';
    ripCv.width = ripCv.height = RS;
    ripCv.style.width = ripCv.style.height = RS + 'px';
    ripCv.style.margin = (-RS / 2) + 'px 0 0 ' + (-RS / 2) + 'px';
    GS = QW.size + 2 * GAME_PAD;
    GDPR = dpr;
    gameCv.width = gameCv.height = Math.round(GS * GDPR);
    gameCv.style.width = gameCv.style.height = GS + 'px';
    gameCv.style.margin = (-GS / 2) + 'px 0 0 ' + (-GS / 2) + 'px';
  }

  function drawTrack(ctx, cx, cy) {
    var R = QW.size / 2, T = QW.band, Rc = R - T / 2;
    var k = Math.min(0.9, 2 * QW.soft / T);
    ctx.fillStyle = rgbaA(COL.ring, 1);
    for (var p = 0; p < PASSES; p++) {
      var half = T / 2 * (1 - k * p / PASSES);
      ctx.globalAlpha = stepAlpha(p, QW.track);
      ctx.beginPath();
      ctx.arc(cx, cy, Rc + half, 0, 2 * Math.PI);
      ctx.arc(cx, cy, Rc - half, 0, 2 * Math.PI, true);
      ctx.fill();
    }
  }

  /* One countdown: the arc from the top round to the water-drop head.
     frac is how far round (0 to 1); alpha fades the whole thing. */
  function drawSweep(ctx, cx, cy, frac, alpha) {
    var R = QW.size / 2, T = QW.band, Rc = R - T / 2;
    var SEAM = 0.4, phi = Math.min(frac * 360, 359.3);
    if (phi < 0.5 || alpha <= 0.002) return;
    var hb = QW.bodyW / 2;
    var r = QW.head ? Math.max(hb, QW.headW / 2) : hb;
    var Lt = QW.head ? Math.max(10, QW.neck) : 10;
    var pxDeg = Rc * DEG;
    var sMax = (phi - SEAM) * pxDeg;
    var lo = 0, hi = 80 * DEG, al = 0, k;
    if (r > hb + 0.01) {
      for (k = 0; k < 24; k++) {
        al = (lo + hi) / 2;
        if (Math.tan(al) * Lt > 2.5 * (r * Math.cos(al) - hb)) hi = al; else lo = al;
      }
      al = lo;
    }
    var phi0 = Math.PI / 2 + al;
    var d0 = r * (1 - Math.cos(phi0)), h0 = r * Math.sin(phi0), m0 = -Math.tan(al);
    var ss = [], ww = [], i, s;
    function put(d, h) { if (d > sMax) { d = sMax; h = hb; } ss.push(d); ww.push(2 * h); }
    for (i = 0; i <= 24; i++) {
      var f = phi0 * i / 24;
      put(r * (1 - Math.cos(f)), r * Math.sin(f));
    }
    for (i = 1; i <= 24; i++) {
      var t = i / 24, t2 = t * t, t3 = t2 * t;
      put(d0 + Lt * t, (2 * t3 - 3 * t2 + 1) * h0 + (t3 - 2 * t2 + t) * Lt * m0 + (-2 * t3 + 3 * t2) * hb);
    }
    for (s = d0 + Lt + 2 * pxDeg; s < sMax; s += 2 * pxDeg) put(s, hb);
    put(sMax, hb);
    var N = ss.length - 1;
    var grad = ctx.createConicGradient ? ctx.createConicGradient(-Math.PI / 2, cx, cy) : null;
    if (grad) {
      var L = QW.tail, SFd = QW.startFade, M = 48;
      for (i = 0; i <= M; i++) {
        var u = phi * i / M;
        var tt = Math.min(1, (phi - u) / L);
        var a1 = Math.pow(1 - tt, QW.taper) * smooth(u / SFd);
        grad.addColorStop(Math.min(1, u / 360), rgbaA(lerpC(COL.start, COL.end, u / 360), a1));
      }
      var endC = rgbaA(lerpC(COL.start, COL.end, phi / 360), 0);
      grad.addColorStop(Math.min(1, phi / 360 + 0.0006), endC);
      grad.addColorStop(1, endC);
    }
    ctx.fillStyle = grad || rgbaA(lerpC(COL.start, COL.end, frac), 1);
    for (var p = 0; p < PASSES; p++) {
      var inset = QW.soft * p / PASSES * 2;
      ctx.globalAlpha = stepAlpha(p, alpha);
      ctx.beginPath();
      for (i = 0; i <= N; i++) {
        var a = (phi - ss[i] / pxDeg - 90) * DEG, rr = Rc + Math.max(0, ww[i] - inset) / 2;
        if (i === 0) ctx.moveTo(cx + rr * Math.cos(a), cy + rr * Math.sin(a));
        else ctx.lineTo(cx + rr * Math.cos(a), cy + rr * Math.sin(a));
      }
      for (i = N; i >= 0; i--) {
        var b = (phi - ss[i] / pxDeg - 90) * DEG, q = Rc - Math.max(0, ww[i] - inset) / 2;
        ctx.lineTo(cx + q * Math.cos(b), cy + q * Math.sin(b));
      }
      ctx.closePath();
      ctx.fill();
    }
  }

  function snapshotFinal() {
    var c = finalCtx;
    c.setTransform(CV.dpr, 0, 0, CV.dpr, 0, 0);
    c.globalAlpha = 1;
    c.clearRect(0, 0, CV.S, CV.S);
    drawSweep(c, CV.S / 2, CV.S / 2, 1, 1);
    c.globalAlpha = 1;
  }

  function drawBloom(ctx, cx, cy, p) {
    var R = QW.size / 2, Rc = R - QW.band / 2;
    var e = 1 - Math.pow(1 - p, 3);
    var r = QW.headW / 2 * (0.8 + 2.8 * e);
    var a = 0.5 * (1 - p) * (1 - p);
    var x = cx, y = cy - Rc;
    var g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgbaA(COL.end, a));
    g.addColorStop(0.5, rgbaA(COL.end, a * 0.5));
    g.addColorStop(1, rgbaA(COL.end, 0));
    ctx.globalAlpha = 1;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fill();
  }

  /* Seconds left when inside the warning window, otherwise null. */
  function warnLeft() {
    if (round.state !== 'play' || !(G.warnSecs > 0)) return null;
    var left = Math.max(0, (S.D - S.prog) / 1000);
    return left <= G.warnSecs ? left : null;
  }
  /* The last seconds: a warm glow on the ring that swells once a second. */
  function drawWarn(ctx, cx, cy) {
    var left = warnLeft();
    if (left === null) return;
    var beat = left - Math.floor(left);
    var a = 0.18 + 0.4 * beat * beat;
    var Rr = QW.size / 2 - QW.band / 2;
    ctx.globalAlpha = 1;
    ctx.strokeStyle = rgbaA(COL.end, a * 0.35);
    ctx.lineWidth = QW.band + 16;
    ctx.beginPath(); ctx.arc(cx, cy, Rr, 0, 2 * Math.PI); ctx.stroke();
    ctx.strokeStyle = rgbaA(COL.end, a);
    ctx.lineWidth = QW.band;
    ctx.beginPath(); ctx.arc(cx, cy, Rr, 0, 2 * Math.PI); ctx.stroke();
  }

  function drawRing(now) {
    var ctx = ringCtx, cs = CV.S, cx = cs / 2, cy = cs / 2;
    ctx.setTransform(CV.dpr, 0, 0, CV.dpr, 0, 0);
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, cs, cs);
    drawTrack(ctx, cx, cy);
    drawWarn(ctx, cx, cy);
    if (prevSweep) {
      var age = now - prevSweep.t, fb = QW.fadeBack * 1000;
      if (age >= Math.max(fb, 1200)) {
        prevSweep = null;
      } else {
        var a = 1 - smooth(age / fb);
        if (a > 0.003) {
          ctx.globalAlpha = a;
          ctx.drawImage(finalCv, 0, 0, cs, cs);
          ctx.globalAlpha = 1;
        }
        if (QW.bloom && age < 1200) drawBloom(ctx, cx, cy, age / 1200);
      }
    }
    if (S.phase !== 'idle') {
      var e = smooth((now - S.t0) / 450);
      drawSweep(ctx, cx, cy, Math.max(0, Math.min(1, S.prog / S.D)), e);
    }
    ctx.globalAlpha = 1;
  }

  /* cubic-bezier easing, the same curve main.css uses for ring ripples. */
  function bezierEase(x1, y1, x2, y2) {
    return function (x) {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      var t = x;
      for (var i = 0; i < 6; i++) {
        var cxv = 3 * x1 * t * (1 - t) * (1 - t) + 3 * x2 * t * t * (1 - t) + t * t * t - x;
        var dx = 3 * x1 * (1 - t) * (1 - t) + 6 * (x2 - x1) * t * (1 - t) + 3 * (1 - x2) * t * t;
        if (Math.abs(dx) < 1e-6) break;
        t -= cxv / dx;
      }
      t = Math.max(0, Math.min(1, t));
      return 3 * y1 * t * (1 - t) * (1 - t) + 3 * y2 * t * t * (1 - t) + t * t * t;
    };
  }
  var rippleEase = bezierEase(0.15, 0.55, 0.3, 1);
  var RIPPLE_DELAYS = [1290, 2990, 690];
  var RIPPLE_STROKES = [[4.5, 0.14], [3, 0.24], [1.5, 0.62]];

  /* The halo's own animation is the clock for the 4s breath. */
  function syncBreath() {
    var list = softGlow.getAnimations ? softGlow.getAnimations() : [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].animationName === 'glowBreath' && list[i].currentTime != null) {
        breathOrigin = (document.timeline.currentTime || performance.now()) - list[i].currentTime;
        return;
      }
    }
  }
  function drawRipples(now) {
    var ctx = ripCtx, RS = CV.RS;
    ctx.clearRect(0, 0, RS, RS);
    if (reduced) return;
    var R = QW.size / 2, c = RS / 2;
    var ph = (((now - breathOrigin) % BREATH) + BREATH) % BREATH;
    for (var k = 0; k < 3; k++) {
      var tau = ((((ph - RIPPLE_DELAYS[k]) % BREATH) + BREATH) % BREATH) / BREATH;
      var e = rippleEase(tau);
      var a = 0.9 * (1 - e);
      if (a < 0.01) continue;
      var r = R * (1 + (QW.ripReach - 1) * e);
      for (var s = 0; s < RIPPLE_STROKES.length; s++) {
        ctx.lineWidth = RIPPLE_STROKES[s][0];
        ctx.strokeStyle = rgbaA(COL.rip, a * RIPPLE_STROKES[s][1]);
        ctx.beginPath();
        ctx.arc(c, c, r, 0, 2 * Math.PI);
        ctx.stroke();
      }
    }
  }

  /* ============================================================
     LAYOUT — fit the window to the screen, size the instructions,
     and keep the button exactly between the scores and the
     instructions.
     ============================================================ */
  function fitStage() {
    scoreBox.style.fontSize = Math.round(QW.size * 0.034) + 'px';
    var k = Math.min(1, (window.innerHeight - 40) / (QW.size + 60), (window.innerWidth - 40) / QW.size);
    inner.style.transform = k < 0.999 ? 'scale(' + k.toFixed(3) + ')' : '';
    fitHowto();
  }
  /* Instructions: as large as lets the longest line fill G.howtoFill % of the ring,
     never smaller than G.howtoMin. (Letter spacing is in em, so one measurement
     at 10px is enough.) */
  function fitHowto() {
    if (!howEl.firstChild) return;
    howEl.style.fontSize = '10px';
    var w10 = howEl.offsetWidth;
    if (!w10) return;
    var px = 10 * (QW.size * G.howtoFill / 100) / w10;
    howEl.style.fontSize = Math.max(G.howtoMin, px).toFixed(1) + 'px';
    balanceHowto();
  }
  /* The centre of the ring should be exactly halfway between the last line of the
     scores and the first line of the instructions. The two blocks have different
     line spacing, so measure the real text edges and nudge the instructions. */
  function balanceHowto() {
    var first = howEl.firstElementChild, timeRow = scoreTimeEl.parentNode;
    if (!first) return;
    howEl.style.marginTop = '0px';
    var qr = win.getBoundingClientRect();
    var k = qr.width / win.offsetWidth || 1;
    var C = qr.top + qr.height / 2;
    var a = document.createRange(); a.selectNodeContents(timeRow);
    var b = document.createRange(); b.selectNodeContents(first);
    var above = C - a.getBoundingClientRect().bottom, below = b.getBoundingClientRect().top - C;
    howEl.style.marginTop = ((above - below) / k).toFixed(1) + 'px';
  }
  function buildHowto() {
    howEl.textContent = '';
    HOWTO.forEach(function (t) { var d = document.createElement('div'); d.textContent = t; howEl.appendChild(d); });
  }

  /* ============================================================
     SOUND — soft sine chimes (pentatonic) and the music. Played on
     the app's AudioContext, straight to the speakers.
     ============================================================ */
  var out = null;
  function audioOut() {
    if (!SOUND_ENABLED || !soundAudioCtx) return null;
    if (soundAudioCtx.state === 'suspended') { try { soundAudioCtx.resume(); } catch (e) {} }
    if (!out) {
      out = soundAudioCtx.createGain();
      out.gain.value = 1;
      out.connect(soundAudioCtx.destination);
    }
    return out;
  }
  var SCALE = [];
  [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28].forEach(function (st) { SCALE.push(523.25 * Math.pow(2, st / 12)); });
  function playBell(f, peak, len) {
    var o = audioOut();
    if (!o || peak <= 0) return;
    var ac = soundAudioCtx, t = ac.currentTime;
    var g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    g.connect(o);
    [[1, 1], [2.01, 0.25]].forEach(function (h) {
      var osc = ac.createOscillator();
      var hg = ac.createGain();
      osc.type = 'sine';
      osc.frequency.value = f * h[0];
      hg.gain.value = h[1];
      osc.connect(hg); hg.connect(g);
      osc.start(t); osc.stop(t + len + 0.1);
    });
  }
  function chime(step, soft) {
    playBell(SCALE[Math.max(0, Math.min(SCALE.length - 1, step))], 0.18 * G.volume * (soft ? 0.5 : 1), 1.4);
  }
  /* A soft tick each second in the last seconds; higher for the final three. */
  function tick(final) { playBell(final ? 1760 : 1320, 0.07 * G.volume, 0.12); }

  /* ---------- music: さくら散歩, a short 8-bit loop ----------
     8 bars of 8 eighth notes. A note (A4, F#4 …) starts a note, "-" holds
     it, "." is a rest. Bass: R = chord root, F = fifth. Arp: 0–3 = notes of
     the bar's chord. Drums: k = kick, h = hi-hat. */
  var CHORDS = {
    D: { b: 'D3', t: ['D4', 'F#4', 'A4', 'D5'] },
    G: { b: 'G2', t: ['G3', 'B3', 'D4', 'G4'] },
    A: { b: 'A2', t: ['A3', 'C#4', 'E4', 'A4'] }
  };
  var SONG = {
    bpm: 96, lead: 0.5, leadVol: 0.07,
    chords: 'D D G A D G A D',
    melody: 'A4 - B4 A4 F#4 - E4 - | D4 - E4 F#4 A4 - - . | B4 - A4 B4 D5 - B4 - | A4 - - - . . . . |' +
            'F#4 - A4 B4 D5 - E5 - | D5 - B4 A4 B4 - - . | A4 - F#4 E4 D4 - E4 - | D4 - - - . . . .',
    bass:  'R - F - R - F -',
    arp:   '. 0 . 2 . 1 . 2',
    drums: 'k . h . k . h .'
  };
  var MUSIC_LEVEL = 0.55;
  function midiOf(name) {
    var m = /^([A-G])(#|b)?(-?\d)$/.exec(name);
    var semi = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
    return 12 * (+m[3] + 1) + semi;
  }
  function hz(midi) { return 440 * Math.pow(2, (midi - 69) / 12); }
  function toks(str) { return str.replace(/\|/g, ' ').split(/\s+/).filter(Boolean); }
  function notesFrom(list, offset, outMap, toMidi) {
    for (var i = 0; i < list.length; i++) {
      var tk = list[i];
      if (tk === '-' || tk === '.') continue;
      var n = 1;
      while (i + n < list.length && list[i + n] === '-') n++;
      outMap[offset + i] = [toMidi(tk), n];
    }
  }
  function compileSong(sg) {
    var chords = toks(sg.chords), len = chords.length * 8;
    var c = { bpm: sg.bpm, len: len, lead: sg.lead, leadVol: sg.leadVol, mel: {}, bass: {}, arp: {}, drums: {} };
    notesFrom(toks(sg.melody), 0, c.mel, midiOf);
    var bassT = toks(sg.bass), arpT = toks(sg.arp), drumT = toks(sg.drums);
    chords.forEach(function (name, bar) {
      var ch = CHORDS[name], root = midiOf(ch.b);
      notesFrom(bassT, bar * 8, c.bass, function (tk) { return root + (tk === 'F' ? 7 : tk === 'O' ? 12 : 0); });
      arpT.forEach(function (tk, i) { if (/^\d$/.test(tk)) c.arp[bar * 8 + i] = [midiOf(ch.t[+tk]), 1]; });
      drumT.forEach(function (tk, i) { if (tk !== '.') c.drums[bar * 8 + i] = tk; });
    });
    return c;
  }
  var SONG_C = compileSong(SONG);
  var pulseWaves = {}, noiseBuf = null;
  function pulseWave(duty) {
    if (pulseWaves[duty]) return pulseWaves[duty];
    var N = 40, re = new Float32Array(N), im = new Float32Array(N);
    for (var n = 1; n < N; n++) re[n] = 2 / (n * Math.PI) * Math.sin(n * Math.PI * duty);
    return (pulseWaves[duty] = soundAudioCtx.createPeriodicWave(re, im));
  }
  function noise() {
    if (noiseBuf) return noiseBuf;
    var ac = soundAudioCtx;
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    var d = noiseBuf.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return noiseBuf;
  }
  function voice(dest, wave, f, t, len, vol) {
    var ac = soundAudioCtx, o = ac.createOscillator();
    if (typeof wave === 'string') o.type = wave; else o.setPeriodicWave(wave);
    o.frequency.value = f;
    var g = ac.createGain();
    var hold = Math.max(0.09, len - 0.04);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.006);
    g.gain.exponentialRampToValueAtTime(vol * 0.6, t + 0.08);
    g.gain.setValueAtTime(vol * 0.6, t + hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t + hold + 0.08);
    o.connect(g); g.connect(dest);
    o.start(t); o.stop(t + hold + 0.1);
  }
  function drum(dest, kind, t) {
    var ac = soundAudioCtx, g = ac.createGain();
    g.connect(dest);
    if (kind === 'k') {
      var o = ac.createOscillator();
      o.frequency.setValueAtTime(140, t);
      o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
      g.gain.setValueAtTime(0.32, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      o.connect(g); o.start(t); o.stop(t + 0.18);
      return;
    }
    var src = ac.createBufferSource();
    src.buffer = noise();
    var f = ac.createBiquadFilter();
    f.type = kind === 's' ? 'bandpass' : 'highpass';
    f.frequency.value = kind === 's' ? 1800 : 7000;
    var dur = kind === 's' ? 0.11 : 0.035;
    g.gain.setValueAtTime(kind === 's' ? 0.1 : 0.035, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g);
    src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.02);
  }
  var music = { on: false };
  /* Fade the music in over about two seconds and keep it looping. */
  function musicStart() {
    musicStop(true);
    var o = audioOut();
    if (!o) return;
    var ac = soundAudioCtx;
    var mOut = ac.createGain();
    var lp = ac.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 3600;
    mOut.gain.setValueAtTime(0.0001, ac.currentTime);
    mOut.gain.setTargetAtTime(MUSIC_LEVEL * G.musicVol, ac.currentTime, 0.6);
    mOut.connect(lp); lp.connect(o);
    music = { on: true, step: 0, next: ac.currentTime + 0.1, out: mOut, lp: lp, timer: 0 };
    music.timer = setInterval(pumpMusic, 25);
    pumpMusic();
  }
  function musicStop(quick) {
    if (!music.on) return;
    var m = music;
    m.on = false;
    clearInterval(m.timer);
    var t = soundAudioCtx.currentTime;
    try {
      m.out.gain.cancelScheduledValues(t);
      m.out.gain.setValueAtTime(Math.max(0.0001, m.out.gain.value), t);
      m.out.gain.exponentialRampToValueAtTime(0.0001, t + (quick ? 0.05 : 1.5));
    } catch (e) {}
    setTimeout(function () { try { m.out.disconnect(); m.lp.disconnect(); } catch (e) {} }, quick ? 300 : 1900);
  }
  /* Schedule the next notes slightly ahead on the audio clock, so the beat
     stays steady even when a frame is late. */
  function pumpMusic() {
    var m = music;
    if (!m.on) return;
    var sg = SONG_C, dur = 60 / sg.bpm / 2;
    /* After the screen sleeps the timer stalls but the audio clock may
       not. Skip the missed notes instead of playing them all at once. */
    if (m.next < soundAudioCtx.currentTime) m.next = soundAudioCtx.currentTime + 0.05;
    while (m.next < soundAudioCtx.currentTime + 0.15) {
      var i = m.step % sg.len, t = m.next, e;
      if ((e = sg.mel[i]))  voice(m.out, pulseWave(sg.lead), hz(e[0]), t, e[1] * dur, sg.leadVol);
      if ((e = sg.bass[i])) voice(m.out, 'triangle', hz(e[0]), t, e[1] * dur * 0.95, 0.16);
      if ((e = sg.arp[i]))  voice(m.out, pulseWave(0.125), hz(e[0]), t, dur * 0.5, 0.025);
      if (sg.drums[i]) drum(m.out, sg.drums[i], t);
      m.next += dur;
      m.step++;
    }
  }

  /* ---------- the ambient music steps aside ----------
     The music display stays on the toolbar (it never leaves the games
     page); it shows the ambient track as paused until the music returns. */
  var ambientHandedOver = false, ambientStopTimer = 0;
  function fadeAmbientOut() {
    if (ambientHandedOver) return;
    ambientHandedOver = true;
    /* The music buttons sit out the game: they would start the ambient
       music over it. */
    if (audioSpectrumHud) audioSpectrumHud.classList.add('music-locked');
    /* No new track may start while the old one fades. */
    if (ambientTimer) { clearTimeout(ambientTimer); ambientTimer = null; }
    if (soundAudioCtx) {
      var now = soundAudioCtx.currentTime;
      [ambientGain, _plGain].forEach(function (g) {
        if (!g) return;
        try {
          g.gain.cancelScheduledValues(now);
          g.gain.setValueAtTime(g.gain.value, now);
          g.gain.setTargetAtTime(0, now, 0.5);
        } catch (e) {}
      });
    }
    ambientStopTimer = setTimeout(function () { ambientStopTimer = 0; stopAmbient(); }, 2500);
  }
  function restoreAmbient() {
    if (!ambientHandedOver) return;
    ambientHandedOver = false;
    if (audioSpectrumHud) audioSpectrumHud.classList.remove('music-locked');
    if (ambientStopTimer) { clearTimeout(ambientStopTimer); ambientStopTimer = 0; }
    stopAmbient();
    if (audioSpectrumHud) audioSpectrumHud.classList.add('shown');
    startAmbient();
  }

  /* ============================================================
     THE FINGER — one pointer, anywhere on the stage, in the game's
     own coordinates (px from the ring's centre, before the
     fit-to-screen scale).
     ============================================================ */
  var finger = { down: false, id: null, x: 0, y: 0, ang: 0, armed: false, ax: 0, ay: 0 };
  function toWorld(e) {
    var r = gameCv.getBoundingClientRect();
    var k = r.width / GS;
    return { x: (e.clientX - r.left) / k - GS / 2, y: (e.clientY - r.top) / k - GS / 2 };
  }
  stage.addEventListener('pointerdown', function (e) {
    if (!running || finger.down) return;
    var onBtn = !!(e.target.closest && e.target.closest('#gameBtn'));
    var p = toWorld(e);
    /* Only the button starts or continues a round. If that press starts
       a round, the same finger can carry on and steer, but the paddles
       stay put until it has moved a little from where it pressed. */
    if (round.state !== 'play') {
      if (onBtn) pressButton(performance.now());
      e.preventDefault();
      if (round.state !== 'play') return;
      finger.armed = true; finger.ax = p.x; finger.ay = p.y;
    } else {
      finger.armed = false;
    }
    finger.down = true; finger.id = e.pointerId;
    finger.x = p.x; finger.y = p.y;
    /* Near the centre the angle jumps about, so keep the paddles where they are. */
    finger.ang = (!finger.armed && Math.hypot(p.x, p.y) >= G.deadCentre) ? Math.atan2(p.y, p.x) : pad.ang;
    try { stage.setPointerCapture(e.pointerId); } catch (er) {}
    e.preventDefault();
  });
  stage.addEventListener('pointermove', function (e) {
    if (!finger.down || e.pointerId !== finger.id) return;
    var p = toWorld(e);
    finger.x = p.x; finger.y = p.y;
    if (finger.armed) {
      if (Math.hypot(p.x - finger.ax, p.y - finger.ay) < G.steerSlop) return;
      finger.armed = false;
    }
    if (Math.hypot(p.x, p.y) < G.deadCentre) return;
    finger.ang = Math.atan2(p.y, p.x);
  });
  function lift(e) { if (e.pointerId === finger.id) { finger.down = false; finger.id = null; } }
  stage.addEventListener('pointerup', lift);
  stage.addEventListener('pointercancel', lift);

  /* ============================================================
     THE GAME CANVAS, EFFECTS, BALLS AND PADDLES
     ============================================================ */
  var gameCtx = gameCv.getContext('2d');
  var GS = 0, GDPR = 1, GAME_PAD = 70;
  function Rc() { return QW.size / 2 - QW.band / 2; }

  var effects = [];
  function addRipple(x, y, col, r1, dur) {
    effects.push({ x: x, y: y, col: rgbOf(col), r1: r1 || 40, t0: performance.now(), dur: dur || 900 });
  }
  function drawEffects(ctx, now) {
    for (var i = effects.length - 1; i >= 0; i--) {
      var fx = effects[i], p = (now - fx.t0) / fx.dur;
      if (p >= 1) { effects.splice(i, 1); continue; }
      var e = 1 - Math.pow(1 - p, 3);
      ctx.globalAlpha = 0.7 * (1 - p);
      ctx.strokeStyle = rgbaA(fx.col, 1);
      ctx.lineWidth = 2.2 * (1 - p) + 0.6;
      ctx.beginPath();
      ctx.arc(fx.x, fx.y, 4 + fx.r1 * e, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
  function glowDot(ctx, x, y, r, col, a) {
    var c = rgbOf(col);
    var g = ctx.createRadialGradient(x, y, 0, x, y, r * 2.6);
    g.addColorStop(0, rgbaA(c, 0.9 * a));
    g.addColorStop(0.35, rgbaA(c, 0.45 * a));
    g.addColorStop(1, rgbaA(c, 0));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r * 2.6, 0, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = rgbaA(lerpC(c, [255, 253, 249], 0.55), a);
    ctx.beginPath(); ctx.arc(x, y, r * 0.75, 0, 2 * Math.PI); ctx.fill();
  }
  /* The paddle: an arc lying on the ring. */
  function drawPaddle(ctx, ang, deg, w) {
    var R = Rc(), half = deg * DEG / 2;
    var c = rgbOf(G.cPaddle);
    ctx.lineCap = 'round';
    ctx.strokeStyle = rgbaA(c, 0.22);
    ctx.lineWidth = w + 10;
    ctx.beginPath(); ctx.arc(0, 0, R, ang - half, ang + half); ctx.stroke();
    ctx.strokeStyle = rgbaA(c, 0.95);
    ctx.lineWidth = w;
    ctx.beginPath(); ctx.arc(0, 0, R, ang - half, ang + half); ctx.stroke();
    ctx.strokeStyle = rgbaA([255, 253, 249], 0.45);
    ctx.lineWidth = Math.max(1, w * 0.22);
    ctx.beginPath(); ctx.arc(0, 0, R - w * 0.18, ang - half * 0.85, ang + half * 0.85); ctx.stroke();
  }

  var pad = { ang: -Math.PI / 2, prev: -Math.PI / 2, delta: 0, t: 0 };
  var balls = [], rally = 0;
  /* Paddle length now: from G.padStart to G.padMin over G.shrinkSecs. When the
     round is over it keeps the length it had when time ran out. */
  function padDeg() {
    if (round.state === 'play') pad.t = Math.min(1, S.prog / (G.shrinkSecs * 1000));
    else if (round.state === 'ready') pad.t = 0;
    return G.padStart + (G.padMin - G.padStart) * pad.t;
  }
  /* Where the two paddles are part-way through this frame (f = 0 → 1), so a fast
     sweep can't jump over a ball. */
  function paddlesAt(f) { var a = pad.prev + pad.delta * f; return [a, a + Math.PI]; }
  function live() { return balls.filter(function (b) { return b.state !== 'lost'; }).length; }
  function serve(now, wait) {
    var ang = Math.random() * 2 * Math.PI;
    balls.push({ x: 0, y: 0, vx: Math.cos(ang) * G.ballSpeed, vy: Math.sin(ang) * G.ballSpeed,
                 state: 'serve', t0: now, wait: wait, alpha: 0, trail: [] });
  }
  function resetBalls() {
    balls = []; rally = 0; pad.t = 0;
    pad.ang = pad.prev = -Math.PI / 2; pad.delta = 0;
  }
  /* The round is over: every ball fades away where it is. */
  function fadeBalls(now) {
    balls.forEach(function (b) { if (b.state !== 'lost') { b.state = 'lost'; b.t0 = now; b.vx *= 0.15; b.vy *= 0.15; } });
  }

  /* Everything that happens when a ball is returned. */
  function paddleHit(cx, cy, now) {
    rally++;
    addScore(1);
    addRipple(cx, cy, G.cPaddle, 34, 800);
    chime(Math.min(8, 2 + (rally % 7)));
    /* Every G.extraHits hits in a row, one more ball (up to G.maxBalls). */
    if (rally % G.extraHits === 0 && live() < G.maxBalls) {
      serve(now, 0.6);
      addRipple(0, 0, G.cBall, Rc() * 0.8, 1400);
      addRipple(0, 0, G.cPaddle, Rc() * 0.5, 1100);
      round.flash = { text: 'ボール追加！', until: now + 1300 };
      setTimeout(function () { playBell(1567.98, 0.12 * G.volume, 1.2); }, 120);
    }
  }

  function moveBall(b, dt, now) {
    var R = Rc(), br = G.ballR, pw = G.padW;
    var speed = Math.hypot(b.vx, b.vy);
    var steps = Math.max(1, Math.min(150, Math.ceil((speed * dt + Math.abs(pad.delta) * R) / Math.max(2, br * 0.5))));
    var h = dt / steps;
    for (var s = 0; s < steps; s++) {
      b.x += b.vx * h; b.y += b.vy * h;
      var d = Math.hypot(b.x, b.y);
      var inner = R - pw / 2;
      if (d + br >= inner && d < R) {
        var nx = b.x / d, ny = b.y / d;
        if (b.vx * nx + b.vy * ny > 0) {
          var ang = Math.atan2(b.y, b.x);
          var reach = padDeg() * DEG / 2 + Math.asin(Math.min(1, br / d));
          var hit = null;
          paddlesAt((s + 1) / steps).forEach(function (pa) { var off = wrapAng(ang - pa); if (Math.abs(off) <= reach) hit = off / reach; });
          if (hit !== null) {
            /* Bounce off the ring's normal, then angle it by where it hit. */
            var dot = b.vx * nx + b.vy * ny;
            var rx = b.vx - 2 * dot * nx, ry = b.vy - 2 * dot * ny;
            var sp = Math.min(G.maxSpeed, Math.hypot(rx, ry) * (1 + G.speedUp / 100));
            var dir = Math.atan2(ry, rx) + hit * G.english * DEG;
            /* Never let it skim along the edge: at most 65° from straight back in. */
            var back = Math.atan2(-ny, -nx), dev = wrapAng(dir - back), lim = 65 * DEG;
            if (dev > lim) dir = back + lim; else if (dev < -lim) dir = back - lim;
            b.vx = Math.cos(dir) * sp; b.vy = Math.sin(dir) * sp;
            var back2 = inner - br - 0.5;
            b.x = nx * back2; b.y = ny * back2;
            paddleHit(nx * R, ny * R, now);
          }
        }
      }
      if (d > R + 6) {
        b.state = 'lost'; b.t0 = now;
        rally = 0;
        return;
      }
    }
    /* A point every 5px along the path; the trail is cut to G.trailLen. */
    var last = b.trail[b.trail.length - 1];
    if (!last || Math.hypot(b.x - last.x, b.y - last.y) >= 5) b.trail.push({ x: b.x, y: b.y });
    var run = 0, tr = b.trail;
    for (var ti = tr.length - 1; ti > 0; ti--) {
      run += Math.hypot(tr[ti].x - tr[ti - 1].x, tr[ti].y - tr[ti - 1].y);
      if (run > G.trailLen) { tr.splice(0, ti - 1); break; }
    }
  }

  function updateGame(dt, now) {
    /* The paddles point where the finger is (instantly). */
    pad.prev = pad.ang;
    if (finger.down && round.state === 'play') pad.ang = finger.ang;
    pad.delta = wrapAng(pad.ang - pad.prev);
    for (var i = balls.length - 1; i >= 0; i--) {
      var b = balls[i];
      if (b.state === 'lost') {
        b.x += b.vx * dt; b.y += b.vy * dt;
        b.alpha = Math.max(0, 1 - (now - b.t0) / 500);
        if (now - b.t0 > 600) balls.splice(i, 1);
        continue;
      }
      if (b.state === 'serve') {
        b.alpha = smooth((now - b.t0) / 500);
        if (now - b.t0 >= b.wait * 1000) { b.state = 'play'; b.alpha = 1; }
        continue;
      }
      moveBall(b, dt, now);
    }
    if (round.state === 'play' && live() === 0) serve(now, G.respawn);
  }
  function drawGame(ctx, now) {
    var deg = padDeg();
    paddlesAt(1).forEach(function (pa) { drawPaddle(ctx, pa, deg, G.padW); });
    var br = G.ballR;
    balls.forEach(function (b) {
      if (b.state === 'play') {
        for (var i = 0; i < b.trail.length; i++) {
          var tp = b.trail[i], f = (i + 1) / b.trail.length;
          ctx.globalAlpha = 0.18 * f;
          ctx.fillStyle = G.cBall;
          ctx.beginPath(); ctx.arc(tp.x, tp.y, br * (0.4 + 0.6 * f), 0, 2 * Math.PI); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
      var pulse = b.state === 'serve' ? 0.85 + 0.15 * Math.sin(now / 140) : 1;
      glowDot(ctx, b.x, b.y, br * pulse, G.cBall, b.alpha);
    });
  }

  /* ============================================================
     ROUNDS: ready → (button) → play for G.round seconds → over →
     (button) → play …  The countdown ring is the round's clock.
     ============================================================ */
  var best = 0;
  var round = { state: 'ready', score: 0, overAt: 0, newBest: false, flash: null, lastTick: -1 };
  function addScore(n) {
    if (round.state !== 'play') return;
    round.score += n;
    scoreNowEl.textContent = round.score;
    scoreNowEl.classList.add('pop');
    requestAnimationFrame(function () { requestAnimationFrame(function () { scoreNowEl.classList.remove('pop'); }); });
  }
  var idleTimer = 0;
  function clearIdleTimer() { if (idleTimer) { clearTimeout(idleTimer); idleTimer = 0; } }
  function readyRound() {
    clearIdleTimer();
    effects = [];
    round.state = 'ready'; round.score = 0; round.flash = null;
    S.phase = 'idle'; S.prog = 0; prevSweep = null;
    resetBalls();
  }
  function startRound(now) {
    clearIdleTimer();
    /* The game music takes over from the ambient music only now. */
    fadeAmbientOut();
    musicStart();
    effects = [];
    resetBalls();
    serve(now, G.respawn);
    round.state = 'play'; round.score = 0; round.newBest = false; round.flash = null; round.lastTick = -1;
    scoreNowEl.textContent = '0';
    S.phase = 'showing'; S.D = G.round * 1000; S.prog = 0; S.t0 = now; prevSweep = null;
    chime(3);
  }
  function endRound(now) {
    round.state = 'over';
    round.overAt = now;
    if (round.score > best) { best = round.score; round.newBest = true; }
    /* The finished ring blooms and fades back. */
    snapshotFinal(); prevSweep = { t: now };
    S.phase = 'idle';
    fadeBalls(now);
    chime(4); setTimeout(function () { chime(6); }, 180); setTimeout(function () { chime(8); }, 360);
    /* Nobody continued: let the room go back to the ambient music. */
    clearIdleTimer();
    idleTimer = setTimeout(function () {
      idleTimer = 0;
      if (!running || round.state !== 'over') return;
      musicStop(false);
      restoreAmbient();
    }, G.idleReturn);
  }
  /* The button: タッチしてスタート works at once; the continue button waits a moment. */
  function pressButton(now) {
    if (round.state === 'ready' || (round.state === 'over' && now - round.overAt > G.overGuard)) {
      haptic(10);
      startRound(now);
    }
  }

  var shown = {};
  function setText(el, key, t) { if (shown[key] !== t) { shown[key] = t; el.textContent = t; } }
  function updateScoreBox(now) {
    var left = round.state === 'play' ? Math.max(0, Math.ceil((S.D - S.prog) / 1000))
             : round.state === 'ready' ? G.round : 0;
    setText(scoreNowEl, 'now', String(round.score));
    setText(scoreBestEl, 'best', String(best));
    setText(scoreTimeEl, 'time', String(left));
    var warn = warnLeft() !== null;
    if (shown.warn !== warn) { shown.warn = warn; scoreTimeEl.parentNode.classList.toggle('warn', warn); }
    var msg = '', title = false;
    if (round.state === 'ready') { msg = 'タッチしてスタート'; title = true; }
    else if (round.state === 'play' && round.flash && now < round.flash.until) { msg = round.flash.text; title = true; }
    else if (round.state === 'over') { msg = round.newBest ? '最高スコア更新！' : 'おつかれさまでした'; title = true; }
    setText(msgEl, 'msg', msg);
    if (shown.title !== title) { shown.title = title; msgEl.classList.toggle('title', title); }
    var tapOn = round.state === 'over' && now - round.overAt > G.overGuard;
    if (shown.tap !== tapOn) { shown.tap = tapOn; tapEl.classList.toggle('on', tapOn); }
    setText(tapEl, 'tapText', round.state === 'over' ? 'ここをタップして続ける' : '');
    var isBtn = round.state === 'ready' || round.state === 'over';
    if (shown.isBtn !== isBtn) { shown.isBtn = isBtn; btnEl.classList.toggle('is-btn', isBtn); }
    var liveBtn = round.state === 'ready' || tapOn;
    if (shown.live !== liveBtn) { shown.live = liveBtn; btnEl.classList.toggle('live', liveBtn); }
    /* The instructions go faint while a round is being played. */
    var faint = round.state === 'play';
    if (shown.faint !== faint) { shown.faint = faint; howEl.classList.toggle('faint', faint); }
  }

  /* ============================================================
     THE LOOP
     ============================================================ */
  var rafId = 0, lastNow = 0, frameNo = 0, running = false;
  function frame() {
    rafId = requestAnimationFrame(frame);
    var now = performance.now();
    var dtMs = Math.min(100, now - lastNow);
    lastNow = now;
    if (round.state === 'play') {
      S.prog += dtMs;
      var wl = warnLeft();
      if (wl !== null) {
        var sec = Math.ceil(wl);
        if (sec !== round.lastTick && sec > 0) { round.lastTick = sec; tick(sec <= 3); }
      }
      if (S.prog >= S.D) endRound(now);
    }
    if ((frameNo++ % 90) === 0) syncBreath();
    drawRing(now);
    drawRipples(now);
    var ctx = gameCtx;
    ctx.setTransform(GDPR, 0, 0, GDPR, GS / 2 * GDPR, GS / 2 * GDPR);
    ctx.clearRect(-GS / 2, -GS / 2, GS, GS);
    updateGame(Math.min(0.05, dtMs / 1000), now);
    drawGame(ctx, now);
    drawEffects(ctx, now);
    updateScoreBox(now);
  }

  function wipe() {
    if (CV.S) {
      ringCtx.setTransform(1, 0, 0, 1, 0, 0);
      ringCtx.clearRect(0, 0, ringCv.width, ringCv.height);
      ripCtx.clearRect(0, 0, ripCv.width, ripCv.height);
      gameCtx.setTransform(1, 0, 0, 1, 0, 0);
      gameCtx.clearRect(0, 0, gameCv.width, gameCv.height);
    }
  }

  /* Leave the games page: the round in progress is dropped, the music
     fades out and the ambient music comes back. */
  function stop() {
    var was = running;
    running = false;
    if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    window.removeEventListener('resize', fitStage);
    document.body.classList.remove('games-active');      /* the falling leaves / snow come back */
    finger.down = false; finger.id = null;
    readyRound();
    wipe();
    if (was) musicStop(false);
    restoreAmbient();
  }

  /* Show the games page: the round waits for タッチしてスタート (only then
     does the game music take over from the ambient music). */
  function start() {
    if (running) return;
    running = true;
    readyRound();
    shown = {};
    sizeCanvases();
    if (!howEl.firstChild) buildHowto();
    scoreBox.style.setProperty('--score-shadow', String(G.scoreShadow));
    scoreBox.style.setProperty('--ring', QW.size + 'px');
    scoreBox.style.rowGap = G.gapEm + 'em';
    howEl.style.lineHeight = String(G.howtoLine);
    fitStage();
    window.addEventListener('resize', fitStage);
    document.body.classList.add('games-active');         /* the falling leaves / snow fade out */
    syncBreath();
    lastNow = performance.now();
    rafId = requestAnimationFrame(frame);
    /* The instruction size is measured against the real font, so measure again once it has loaded. */
    var ready = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
    ready.then(function () { if (running) fitHowto(); });
  }

  return {
    start: start,
    stop: stop,
    /* A new visit: the top score starts again from 0. */
    newVisit: function () { best = 0; }
  };
})();

function clearAllTyTimers() {
  for (var i = 0; i < tyTimers.length; i++) clearTimeout(tyTimers[i]);
  for (var j = 0; j < tyIntervals.length; j++) clearInterval(tyIntervals[j]);
  tyTimers = [];
  tyIntervals = [];
  /* The games page stops with everything else on this screen (going to the
     receipt, back to the table). Stopping it fades the game music out and
     brings the ambient music back. */
  if (typeof GameWindow !== 'undefined') GameWindow.stop();
}
function tyPushTimeout(fn, ms) {
  var id = setTimeout(fn, ms);
  tyTimers.push(id);
  return id;
}

/* ============ THANK-YOU SEQUENCE ============ */
function startThankyouSequence() {
  clearAllTyTimers();
  thankyouScreen.classList.remove('under-receipt');
  document.body.classList.add('thankyou-active');
  if (tyReceiptBtnLabel) {
    tyReceiptBtnLabel.textContent = rejected ? 'サービス選択に戻る' : '内容を確認する';
  }
  applyTyPanel1Content();
  tyExited = false;
  tyCarousel.classList.remove('hidden-out');
  tyDotsEl.classList.remove('hidden');
  tyAmbientStage.classList.remove('shown');
  GameWindow.stop();
  GameWindow.newVisit();                 /* the top score is for this visit only */
  tyReceiptBtn.classList.add('shown');
  tyCurrentPanel = 0;
  NavSpring && NavSpring.reset('ty');
  tyTrack.style.transform = 'translateX(0%)';
  for (var i = 0; i < tyDots.length; i++) tyDots[i].classList.toggle('active', i === 0);
  activateTyPanel(0);
  updateTySwipeHint();
  if (numpad) numpad.classList.remove('visible', 'receipt-mode');
}
function resumeThankyouSequence() {
  thankyouScreen.classList.remove('under-receipt');
  applyTyPanel1Content();
  tyReceiptBtn.classList.add('shown');
  if (tyExited) {
    tyAmbientStage.classList.add('shown');
    GameWindow.start();
  } else {
    updateTySwipeHint();
  }
  updateInfoDateTime();
}
tyReceiptBtn.addEventListener('click', function(e) {
  e.preventDefault();
  haptic(10);
  if (rejected) {
    clearAllTyTimers();
    returnToTable();
    return;
  }
  clearAllTyTimers();
  buildReceipt({ keepStamp: true });
  thankyouScreen.classList.add('under-receipt');
  receiptOpenedFromThankyou = true;
  receiptScreen.classList.add('reopened');
  setTimeout(function() {
    resetReceiptScroll();
    lockBodyForReceipt();
    receiptScreen.classList.add('visible');
    infoBar.classList.add('hidden');
    updateNumpadVisibility();
    requestAnimationFrame(updateReceiptScrollIndicator);
    setTimeout(updateReceiptScrollIndicator, 100);
    setTimeout(updateReceiptScrollIndicator, 500);
    if (receiptStamped) setTimeout(scrollReceiptConfirmIntoView, 1000);
  }, 100);
});

/* ============================================================
   DYNAMIC BACKGROUND (v1.4)
   ------------------------------------------------------------
   Replaces the old twelve CSS-animated leaves and the DOM snowflakes
   with a canvas drawn in code (no images): leaves of four kinds that
   each have their own shape, colour and way of falling; the real sun
   and moon over Nagoya; weather from the app's own Open-Meteo request
   (wind, rain, cloud, fog, snow); kōyō trees and an autumn landscape in
   the autumn theme (8b, 8c) and a snowy landscape with plum branches in
   the winter theme (8d); and a cricket and fireflies
   that land on the message text. It was tuned on dynamic.html and the
   values there are the ones baked into S below.
   Wrapped in a function so none of its names can clash with the app's.
   ============================================================ */
var DynBG = (function () {
/* ============================================================
   0. SMALL HELPERS
   ============================================================ */
var PI = Math.PI, TAU = Math.PI * 2, DEG = Math.PI / 180;
function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function lerp(a, b, t) { return a + (b - a) * t; }
function smooth(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
function bell(x, m, s) { var d = (x - m) / s; return Math.exp(-d * d); }
function angDiff(a, b) { return Math.atan2(Math.sin(a - b), Math.cos(a - b)); }
function hexToRgb(h) {
  h = h.replace('#', '');
  return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)];
}
function mixRgb(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }
function rgba(c, a) {
  return 'rgba(' + Math.round(clamp(c[0], 0, 255)) + ',' + Math.round(clamp(c[1], 0, 255)) + ',' +
         Math.round(clamp(c[2], 0, 255)) + ',' + (a === undefined ? 1 : clamp(a, 0, 1)).toFixed(3) + ')';
}
function scaleRgb(c, k) { return [c[0] * k, c[1] * k, c[2] * k]; }

/* Seeded random (mulberry32) so a leaf keeps the same shape when it is redrawn. */
function rngFrom(seed) {
  var a = seed >>> 0;
  return function() {
    a = (a + 0x6D2B79F5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash1(i) { var s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
/* Smooth 1-D value noise, 0..1 */
function noise1(x) {
  var i = Math.floor(x), f = x - i;
  var u = f * f * (3 - 2 * f);
  return lerp(hash1(i), hash1(i + 1), u);
}
function rnd(a, b) { return a + Math.random() * (b - a); }

/* ============================================================
   1. SETTINGS — the values tuned on dynamic.html. Leaf size 0.6, tree
   size 0.82 and moon size 1.05 are the three that were changed from the
   preview's starting values; everything else is as it was.
   ============================================================ */
var NAGOYA = { lat: 35.1815, lon: 136.9066 };
var SITE_LEAF_COLOURS = ['#9E3B06', '#882E47', '#F07D40', '#E66826', '#C44E10'];

var _tokyoFmt = null;
function tokyoNow() {
  var p = {};
  try {
    if (!_tokyoFmt) _tokyoFmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    });
    _tokyoFmt.formatToParts(new Date()).forEach(function(x) { p[x.type] = x.value; });
    return {
      date: p.year + '-' + p.month + '-' + p.day,
      hour: (parseInt(p.hour, 10) % 24) + parseInt(p.minute, 10) / 60 + parseInt(p.second, 10) / 3600
    };
  } catch (e) {
    var d = new Date();
    return {
      date: d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2),
      hour: d.getHours() + d.getMinutes() / 60
    };
  }
}

var S = {
  hour: 12, date: '2026-01-01',
  condition: 'clear', windSpeed: 2.5, windDir: 300, gustiness: 0.35,
  temperature: 18, cloudCover: 15, rainMm: 0, fogDensity: 0, humidity: 75,
  density: 0.4, maxLeaves: 70, sizeScale: 0.6, fallSpeed: 1, sway: 1, flip3d: 0.8,
  shapeVariation: 0.6, wear: 0.35, flurries: 0.5, lulls: 0.5,
  speciesMode: 'koyo', wMomiji: 0.6, wGinkgo: 0.5, wOak: 0.25, wKeyaki: 0.3,
  colorMode: 'auto', colorProgress: 0.3, colorVariety: 0.6, paletteBlend: 0.45, lightTint: 0.7, skyTint: 0.8,
  depthSpread: 0.9, farBlur: 2.75, nearBlur: 1.0, farOpacity: 0.6, nearOpacity: 0.9,
  rainStreaks: 1, rainContrast: 1, splashes: true, lightRays: 1, sunFlicker: 0.5, cloudShadows: 1, fogHaze: 1,
  lightning: true, frost: true, snowMix: true,
  sun: true, sunSize: 1, moon: true, moonSize: 1.05, moonPath: 'arc',
  birds: true, nightSpecks: true, fireflyLand: true, fireflyMax: 4, dawnGlow: true,
  figureSide: 'auto',
  tree: true, treeSize: 0.82, treeSway: 1, treeOpacity: 0.5,
  frontLeaves: 20, frontLeafOpacity: 1, frontLeafMinZ: 0.8, nearShare: 0.2, snowFront: 0.25,
  heroLeaf: true, heroEvery: 3, pile: true, pileMax: 60,
  cricket: true, insectSize: 1, tapWind: true, tapStrength: 1,
  renderScale: 0.75
};

/* ============================================================
   2. TIME, SUN, MOON, SEASON
   ============================================================ */
function parseDate(s) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
  if (!m) { var n = tokyoNow(); m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(n.date); }
  return { y: +m[1], m: +m[2], d: +m[3] };
}
function fmtDate(y, m, d) { return y + '-' + ('0' + m).slice(-2) + '-' + ('0' + d).slice(-2); }
function addDays(s, n) {
  var p = parseDate(s), t = new Date(Date.UTC(p.y, p.m - 1, p.d + n));
  return fmtDate(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
}
function dayOfYear(p) { return (Date.UTC(p.y, p.m - 1, p.d) - Date.UTC(p.y, 0, 0)) / 864e5; }

/* Sunrise / sunset in Nagoya (NOAA approximation), hours in JST. */
function sunTimes(p) {
  var N = dayOfYear(p), g = TAU / 365 * (N - 1);
  var decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) +
             0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  var eqt = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) -
             0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  var lat = NAGOYA.lat * DEG;
  var cosHa = Math.cos(90.833 * DEG) / (Math.cos(lat) * Math.cos(decl)) - Math.tan(lat) * Math.tan(decl);
  var ha = Math.acos(clamp(cosHa, -1, 1)) / DEG;
  var noon = 720 - 4 * NAGOYA.lon - eqt + 540;
  return { rise: (noon - 4 * ha) / 60, set: (noon + 4 * ha) / 60, noon: noon / 60 };
}

/* Real sun and moon positions for Nagoya (low-precision almanac
   formulas, good to well under a degree for drawing). Azimuth is
   measured from north toward east. */
function astro(p, hour) {
  var d = (Date.UTC(p.y, p.m - 1, p.d) + (hour - 9) * 3600e3) / 864e5 - 10957.5;
  var T = d / 36525;
  function sd(x) { return Math.sin(x * DEG); }
  var g = (357.528 + 0.9856003 * d) * DEG;
  var lamS = 280.46 + 0.9856474 * d + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g);
  var lamM = 218.32 + 481267.881 * T + 6.29 * sd(134.9 + 477198.85 * T) - 1.27 * sd(259.2 - 413335.38 * T) +
             0.66 * sd(235.7 + 890534.23 * T) + 0.21 * sd(269.9 + 954397.70 * T) - 0.19 * sd(357.5 + 35999.05 * T) -
             0.11 * sd(186.6 + 966404.05 * T);
  var betM = 5.13 * sd(93.3 + 483202.03 * T) + 0.28 * sd(228.2 + 960400.87 * T) -
             0.28 * sd(318.3 + 6003.18 * T) - 0.17 * sd(217.6 - 407332.20 * T);
  var eps = 23.439 * DEG, lat = NAGOYA.lat * DEG;
  var lst = (280.46061837 + 360.98564736629 * d + NAGOYA.lon) * DEG;
  function horizon(lamDeg, betDeg) {
    var lam = lamDeg * DEG, bet = betDeg * DEG;
    var ra = Math.atan2(Math.sin(lam) * Math.cos(eps) - Math.tan(bet) * Math.sin(eps), Math.cos(lam));
    var dec = Math.asin(Math.sin(bet) * Math.cos(eps) + Math.cos(bet) * Math.sin(eps) * Math.sin(lam));
    var ha = lst - ra;
    var alt = Math.asin(Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(ha));
    var az = Math.atan2(-Math.sin(ha), Math.tan(dec) * Math.cos(lat) - Math.sin(lat) * Math.cos(ha)) / DEG;
    return { alt: alt / DEG, az: (az + 360) % 360 };
  }
  var elong = (((lamM - lamS) % 360) + 360) % 360;
  return {
    sun: horizon(lamS, 0), moon: horizon(lamM, betM),
    elong: elong, illum: (1 - Math.cos(elong * DEG)) / 2, waxing: elong < 180
  };
}
function moonName(a) {
  var k = a.illum;
  if (k < 0.03) return 'New moon 新月';
  if (k > 0.97) return 'Full moon 満月';
  if (a.waxing) return k < 0.35 ? 'Waxing crescent 三日月' : (k < 0.65 ? 'First quarter 上弦の月' : 'Waxing gibbous 十三夜');
  return k < 0.35 ? 'Waning crescent 有明月' : (k < 0.65 ? 'Last quarter 下弦の月' : 'Waning gibbous 寝待月');
}
function compassName(az) {
  var n = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return n[Math.round(az / 22.5) % 16];
}
/* Sky to screen: right edge = east, left edge = west, bottom = horizon.
   Used for left/right placement, and for which way the moon's lit side faces. */
function skyToScreen(alt, az) {
  var x = W * (0.5 + angDiff(180 * DEG, az * DEG) / DEG / 220);
  var e = (alt < 0 ? -1 : 1) * Math.pow(Math.min(Math.abs(alt), 90) / 80, 0.6);
  return { x: x, y: H * 0.9 - H * 0.82 * e };
}

/* The sun and moon sit in a band just under the info bar (both lines). */
var _barBottom = 93;   // the info bar is 93px tall; measured twice a second so drawing never forces a layout
function measureInfoBar() {
  var bar = document.getElementById('infoBar');
  _barBottom = (bar && bar.offsetHeight > 0) ? Math.max(bar.getBoundingClientRect().bottom, 40) : 93;
}
function skyBandY(radius) { return _barBottom + radius + 18; }

/* The toolbar across the top is frosted glass; this tells its CSS where the
   light is (see .info-bar::before in main.css). The sun is the light by day,
   the moon (much weaker) by night. Written twice a second, and only when the
   numbers change, so it costs no layout or style work most of the time. */
var _glassKey = '';
function updateToolbarLight() {
  var bar = document.getElementById('infoBar');
  if (!bar) return;
  var sx = 0, sy = 0, str = 0, a = ENV.astro;
  if (a && sunIsUp()) {
    var low = 1 - smooth(2, 18, a.sun.alt);
    str = smooth(-1.5, 1.5, a.sun.alt) * clamp(1 - S.cloudCover / 100 * 0.75, 0.15, 1) *
          (ENV.rainy ? 0.35 : 1) * (S.condition === 'snow' ? 0.4 : 1) * (1 - ENV.fog * 0.5);
    sx = skyToScreen(a.sun.alt, a.sun.az).x;
    sy = skyBandY(sunRadius(a.sun.alt));
  } else if (a && S.moon) {
    var P = moonPlacement(28 * S.moonSize);
    if (P) { str = P.fade * 0.3 * clamp(1 - S.cloudCover / 100 * 0.7, 0.2, 1); sx = P.x; sy = P.y; }
  }
  var key;
  if (str < 0.02) {
    key = 'off';
    if (key !== _glassKey) {
      _glassKey = key;
      bar.style.removeProperty('--glass-i');
    }
    return;
  }
  var r = bar.getBoundingClientRect();
  if (r.width < 1) return;
  /* the pane (.info-bar::before) ends where the rim strip ends */
  var rim = bar.querySelector('.bar-rim');
  var rb = rim ? rim.getBoundingClientRect().bottom : r.bottom;
  var paneL = r.left, paneW = r.width, paneT = r.top, paneH = Math.max(1, rb - r.top);
  var i = str.toFixed(2);
  var px = clamp((sx - paneL) / paneW * 100, -20, 120).toFixed(1);
  var py = clamp((sy - paneT) / paneH * 100, 0, 400).toFixed(0);
  key = px + ',' + py + ',' + i;
  if (key === _glassKey) return;
  _glassKey = key;
  bar.style.setProperty('--glass-sx', px + '%');
  bar.style.setProperty('--glass-sy', py + '%');
  bar.style.setProperty('--glass-i', i);
}
function sunIsUp() { return S.sun && ENV.astro.sun.alt > -1.5; }

/* The picture follows the app's theme (the 🍁 / ❄️ toggle and the December
   switch): autumn theme → kōyō trees and falling leaves, winter theme → the
   snowy landscape with plum branches and falling snow (8d). The sakura theme shows none of it (the loop
   does not run). Which months get which picture is still to be decided. */
function sceneFor(p) {
  return (typeof currentTheme === 'string' && currentTheme === 'winter') ? 'winter' : 'autumn';
}

/* How far autumn has turned, 0 (green) .. 1 (bare brown), from the date. */
function seasonProgress(p) {
  var doy = dayOfYear(p);
  var pts = [[258, 0], [288, 0.25], [314, 0.55], [334, 0.8], [354, 1]];
  if (doy < 60) return 1;
  if (doy <= pts[0][0]) return 0;
  for (var i = 1; i < pts.length; i++) {
    if (doy <= pts[i][0]) return lerp(pts[i - 1][1], pts[i][1], (doy - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]));
  }
  return 1;
}

/* Light colour through the day, keyed to the real sunrise/sunset. */
var LIGHT_STOPS_FN = function(sr, ss, noon) {
  return [
    [sr - 1.6, '#46557f', 0.26, 0.60],
    [sr - 0.6, '#6d6a96', 0.22, 0.50],
    [sr,       '#f2a3a0', 0.20, 0.25],
    [sr + 0.7, '#ffc77a', 0.16, 0.05],
    [sr + 2.5, '#fff3df', 0.05, 0.00],
    [noon,     '#ffffff', 0.00, 0.00],
    [ss - 2.2, '#fff0d6', 0.05, 0.00],
    [ss - 0.9, '#ffb055', 0.18, 0.00],
    [ss - 0.1, '#ee8a7a', 0.22, 0.12],
    [ss + 0.6, '#8d7fb0', 0.24, 0.40],
    [ss + 1.5, '#46557f', 0.26, 0.60]
  ];
};
function lightAt(h, sun) {
  var st = LIGHT_STOPS_FN(sun.rise, sun.set, sun.noon);
  var col, amt, dark;
  if (h <= st[0][0] || h >= st[st.length - 1][0]) {
    col = hexToRgb('#46557f'); amt = 0.26; dark = 0.6;
  } else {
    for (var i = 1; i < st.length; i++) {
      if (h <= st[i][0]) {
        var t = (h - st[i - 1][0]) / (st[i][0] - st[i - 1][0]);
        col = mixRgb(hexToRgb(st[i - 1][1]), hexToRgb(st[i][1]), t);
        amt = lerp(st[i - 1][2], st[i][2], t);
        dark = lerp(st[i - 1][3], st[i][3], t);
        break;
      }
    }
  }
  var phase;
  if (h < sun.rise - 0.8 || h > sun.set + 0.9) phase = 'night';
  else if (h < sun.rise + 1) phase = 'dawn';
  else if (h > sun.set - 0.3) phase = 'dusk';
  else if (h > sun.set - 1.6) phase = 'golden';
  else if (h < 11) phase = 'morning';
  else phase = 'day';
  var daylight = smooth(sun.rise - 0.3, sun.rise + 0.8, h) * (1 - smooth(sun.set - 0.6, sun.set + 0.4, h));
  return { col: col, amt: amt, dark: dark, phase: phase, daylight: daylight };
}
var PHASE_NAMES = { night: 'Night 夜', dawn: 'Dawn 夜明け', morning: 'Morning 朝', day: 'Midday 昼', golden: 'Golden hour 夕方', dusk: 'Dusk 黄昏' };

/* ============================================================
   3. ENVIRONMENT (recomputed a few times a second)
   ============================================================ */
var ENV = {};
function computeEnv() {
  var p = parseDate(S.date);
  var sun = sunTimes(p);
  var L = lightAt(S.hour, sun);
  var c = S.condition;
  var rainy = (c === 'rain' || c === 'drizzle' || c === 'thunderstorm');
  var wet = rainy ? clamp(0.3 + S.rainMm / 5, 0.3, 1) : 0;
  var frost = (S.frost && S.temperature < 5) ? clamp((5 - S.temperature) / 8, 0, 1) : 0;
  var autoP = seasonProgress(p);
  var P = S.colorMode === 'auto' ? autoP : S.colorProgress;
  var fog = c === 'fog' ? Math.max(S.fogDensity, 0.15) : S.fogDensity;
  var sunAmt = 0;
  if (c === 'clear') sunAmt = 1 - S.cloudCover / 140;
  else if (c === 'clouds') sunAmt = Math.max(0, 0.6 - S.cloudCover / 120);
  sunAmt *= L.daylight;
  var windScreen = S.windSpeed * -Math.sin(S.windDir * DEG);
  ENV = {
    p: p, sun: sun, light: L, phase: L.phase, rainy: rainy, wet: wet, frost: frost,
    season: P, autoSeason: autoP, fog: fog, sunAmt: sunAmt,
    windPx: windScreen * 14, windMs: S.windSpeed,
    snowing: c === 'snow' || (S.snowMix && S.temperature < 3),
    snowAmt: c === 'snow' ? clamp(0.4 + S.rainMm / 3, 0.4, 1.6) : (S.snowMix && S.temperature < 3 ? 0.12 : 0),
    astro: astro(p, S.hour),
    scene: sceneFor(p),
    side: S.figureSide === 'auto' ? (dayOfYear(p) % 2 ? 'left' : 'right') : S.figureSide
  };
}

/* ============================================================
   4. LEAF SHAPES — built in code, a little different every time.
      Unit space: leaf length 1, blade base at (0,0), tip toward -y.
   ============================================================ */
var SPECIES = {
  momiji: { name: 'Momiji (maple)', size: 56, ramp: [[0, '#6b8f3a'], [0.25, '#a7a336'], [0.4, '#e0a02c'], [0.55, '#E66826'], [0.7, '#C44E10'], [0.82, '#9E3B06'], [0.9, '#882E47'], [1, '#6e4a35']],
            site: [0, 1, 2, 3, 4], modes: { flutter: 0.5, tumble: 0.25, glide: 0.15, spiral: 0.1 } },
  ginkgo: { name: 'Ginkgo (ichō)',   size: 46, ramp: [[0, '#7d9a3c'], [0.2, '#b8b440'], [0.35, '#e8c534'], [0.6, '#f0b429'], [0.8, '#d99a2b'], [1, '#9c7a3a']],
            site: [2, 3], modes: { flutter: 0.3, tumble: 0.15, glide: 0.1, spiral: 0.45 } },
  oak:    { name: 'Oak (konara)',    size: 50, ramp: [[0, '#6a7f3a'], [0.3, '#9a8a3a'], [0.5, '#b8823a'], [0.7, '#9a5e2c'], [1, '#6b4a30']],
            site: [0, 4], modes: { flutter: 0.35, tumble: 0.4, glide: 0.2, spiral: 0.05 } },
  keyaki: { name: 'Zelkova (keyaki)', size: 40, ramp: [[0, '#73903c'], [0.3, '#c0a03a'], [0.5, '#d9822e'], [0.7, '#b0502a'], [0.85, '#8a4a2a'], [1, '#6e4b33']],
            site: [3, 4, 1], modes: { flutter: 0.45, tumble: 0.2, glide: 0.25, spiral: 0.1 } },
  koyo:   { name: 'Kōyō maple',      size: 37, ramp: [[0, '#7A1F1F'], [0.5, '#C8321E'], [1, '#E2552A']],
            site: [0], modes: { flutter: 0.5, tumble: 0.25, glide: 0.15, spiral: 0.1 } },
  generic: { name: 'Tree leaf', size: 20, ramp: [[0, '#7d9440'], [0.25, '#c4a83a'], [0.45, '#e09a34'], [0.65, '#cc6a2c'], [0.85, '#9a5a32'], [1, '#76553a']],
            site: [2, 3, 4], modes: { flutter: 0.5, tumble: 0.25, glide: 0.15, spiral: 0.1 } }
};
(function prepRamps() {
  for (var k in SPECIES) SPECIES[k].rampRgb = SPECIES[k].ramp.map(function(s) { return [s[0], hexToRgb(s[1])]; });
})();
var SITE_RGB = SITE_LEAF_COLOURS.map(hexToRgb);

/* Kōyō (紅葉) — the autumn trees and falling leaves, with the values chosen
   on koyo.html. Each leaf and each foliage clump belongs to one colour
   family [shade, mid, lit]; KOYO_SHARES is how often each family is used. */
var KOYO = {
  treeSize: 0.94, twigDepth: 6, maxWidth: 30, fullness: 0.8, leafDensity: 1, leafSize: 1,
  patchiness: 0.39, shadeDepth: 0.55, lightFrom: -0.4, nearOpacity: 0.88, farOpacity: 0.76,
  farHaze: 0.09, branchOpacity: 0.5, nightGlow: 0.7, fallTop: 0.6
};
var KOYO_SHARES = { red: 0.55, orange: 0.25, gold: 0.12, green: 0.05, evergreen: 0.03 };
var KOYO_FAMILIES = (function() {
  var h = hexToRgb;
  var shadeDeep = h('#7A1F1F'), red = h('#C8321E'), redOrange = h('#E2552A'), orange = h('#E66826'),
      orangeLit = h('#F08A30'), gold = h('#F2B33A'), goldLit = h('#E8C547'), green = h('#B5BE4A'), ever = h('#3E5A3A');
  return {
    red:       [shadeDeep, red, redOrange],
    orange:    [mixRgb(red, shadeDeep, 0.3), orange, orangeLit],
    gold:      [mixRgb(orange, redOrange, 0.4), gold, goldLit],
    green:     [mixRgb(green, ever, 0.55), green, mixRgb(green, goldLit, 0.5)],
    evergreen: [scaleRgb(ever, 0.7), ever, mixRgb(ever, green, 0.35)]
  };
})();
var KOYO_PLUM = hexToRgb('#882E47'), KOYO_BARK = hexToRgb('#3A2624'), KOYO_PAPER = hexToRgb('#FBECE0');
var KOYO_LAMP = [255, 196, 128];
function rampAt(r, p) {
  p = clamp(p, 0, 1);
  for (var i = 1; i < r.length; i++) {
    if (p <= r[i][0]) return mixRgb(r[i - 1][1], r[i][1], (p - r[i - 1][0]) / (r[i][0] - r[i - 1][0]));
  }
  return r[r.length - 1][1];
}

function geoMomiji(r, v) {
  var n = r() < 0.12 * v ? (r() < 0.5 ? 5 : 9) : 7;
  var spread = (235 + (r() - 0.5) * 30 * v) * DEG;
  var gap = spread / (n - 1), mid = (n - 1) / 2;
  var prof = [1, 0.92, 0.74, 0.48, 0.32];
  var lobes = [];
  for (var i = 0; i < n; i++) {
    var d = Math.round(Math.abs(i - mid));
    lobes.push({
      a: -PI / 2 + (i - mid) * gap + (r() - 0.5) * gap * 0.25 * v,
      L: prof[Math.min(d, 4)] * (1 + (r() - 0.5) * 0.28 * v),
      w: gap * (0.78 + (r() - 0.5) * 0.2 * v)
    });
  }
  var rs = 0.3 * (1 + (r() - 0.5) * 0.5 * v);
  var teeth = 70 + r() * 40, toothAmp = 0.03 + 0.025 * r();
  var pts = [], N = 340;
  for (var k = 0; k < N; k++) {
    var th = PI / 2 + TAU * k / N;
    var rr = 0;
    for (var j = 0; j < n; j++) {
      var x = Math.abs(angDiff(th, lobes[j].a)) / lobes[j].w;
      if (x < 1) rr = Math.max(rr, lobes[j].L * Math.pow(1 - x, 0.75));
    }
    var fromUp = Math.abs(angDiff(th, -PI / 2));
    var floor = 0.05 + (rs - 0.05) * smooth(spread / 2 + gap * 0.6, spread / 2, fromUp);
    rr = Math.max(rr, floor);
    if (rr > 0.4) {
      var tf = th * teeth / TAU; tf = tf - Math.floor(tf);
      rr *= 1 + toothAmp * (Math.abs(2 * tf - 1) - 0.5) * Math.min(1, (rr - 0.4) / 0.3);
    }
    pts.push([rr * Math.cos(th), rr * Math.sin(th)]);
  }
  var veins = lobes.map(function(l) { return [0, 0, 0.85 * l.L * Math.cos(l.a), 0.85 * l.L * Math.sin(l.a)]; });
  return { pts: pts, veins: veins, veinStyle: 'light', stem: [[0, 0], [0.03 * (r() - 0.5), 0.2], [0.08 * (r() - 0.5), 0.42]] };
}

function geoGinkgo(r, v) {
  var phi = (62 + r() * 18) * DEG;
  var R = 0.95 * (1 + (r() - 0.5) * 0.15 * v);
  var notch = r() < 0.7 ? (0.15 + 0.35 * r()) * (0.5 + 0.5 * v) : 0.03;
  var wavK = 6 + r() * 10, wavA = 0.025 * v + 0.01, ph = r() * 6;
  var pts = [[-0.015, 0.0], [0.45 * R * Math.cos(-PI / 2 - phi * 0.86), 0.45 * R * Math.sin(-PI / 2 - phi * 0.86)]];
  var N = 140;
  for (var k = 0; k <= N; k++) {
    var th = -PI / 2 - phi + 2 * phi * k / N;
    var dd = th + PI / 2;
    var rr = R * (1 + wavA * Math.sin(th * wavK + ph)) * (1 - notch * Math.exp(-Math.pow(dd / 0.07, 2)));
    rr *= 1 - 0.25 * Math.pow(Math.abs(dd) / phi, 8);
    pts.push([rr * Math.cos(th), rr * Math.sin(th)]);
  }
  pts.push([0.45 * R * Math.cos(-PI / 2 + phi * 0.86), 0.45 * R * Math.sin(-PI / 2 + phi * 0.86)]);
  pts.push([0.015, 0.0]);
  var veins = [];
  for (var i = 0; i < 16; i++) {
    var a = -PI / 2 - phi * 0.92 + (2 * phi * 0.92) * i / 15;
    veins.push([0, 0, 0.88 * R * Math.cos(a), 0.88 * R * Math.sin(a)]);
  }
  return { pts: pts, veins: veins, veinStyle: 'fine', stem: [[0, 0], [0.02 * (r() - 0.5), 0.28], [0.06 * (r() - 0.5), 0.55]] };
}

function geoOak(r, v) {
  var nL = 4 + Math.floor(r() * 3);
  var W = 0.3 * (1 + (r() - 0.5) * 0.25 * v);
  var depth = 0.25 + 0.2 * r() * (0.5 + v);
  var phL = r() * 0.6 * v, phR = r() * 0.6 * v;
  function hw(t, ph) {
    var env = Math.pow(Math.sin(PI * Math.pow(t, 0.75)), 0.85);
    return W * env * ((1 - depth) + depth * Math.abs(Math.sin(PI * nL * t + ph)));
  }
  var pts = [], N = 90, i, t;
  for (i = 0; i <= N; i++) { t = i / N; pts.push([-hw(t, phL), -t]); }
  for (i = N; i >= 0; i--) { t = i / N; pts.push([hw(t, phR), -t]); }
  var veins = [[0, 0, 0, -0.95]];
  for (var k = 0; k < nL; k++) {
    t = (k + 0.5) / nL;
    if (t > 0.9) continue;
    veins.push([0, -t * 0.85, -hw(t, phL) * 0.8, -t - 0.04]);
    veins.push([0, -t * 0.85, hw(t, phR) * 0.8, -t - 0.04]);
  }
  return { pts: pts, veins: veins, veinStyle: 'light', stem: [[0, 0], [0.01, 0.1], [0.02 * (r() - 0.5), 0.18]] };
}

function geoKeyaki(r, v) {
  var W = 0.22 * (1 + (r() - 0.5) * 0.3 * v);
  var teeth = 10 + r() * 5, amp = 0.05 + 0.04 * r();
  function hw(t) {
    var base = W * Math.pow(Math.sin(PI * Math.pow(t, 0.62)), 1.1);
    if (t > 0.12) { var f = t * teeth; f = f - Math.floor(f); base *= 1 + amp * f; }
    return base;
  }
  var pts = [], N = 110, i, t;
  for (i = 0; i <= N; i++) { t = i / N; pts.push([-hw(t), -t]); }
  for (i = N; i >= 0; i--) { t = i / N; pts.push([hw(t), -t]); }
  var veins = [[0, 0, 0, -0.95]];
  for (var k = 1; k < teeth - 1; k++) {
    t = k / teeth;
    veins.push([0, -t, -0.85 * hw(t + 0.08), -(t + 0.08)]);
    veins.push([0, -t, 0.85 * hw(t + 0.08), -(t + 0.08)]);
  }
  return { pts: pts, veins: veins, veinStyle: 'light', stem: [[0, 0], [0.01, 0.07], [0.02 * (r() - 0.5), 0.13]] };
}
/* Kōyō maple: a seven-lobed star with short lobes by the stem. n points
   round the edge, centred at (0, cy), half a leaf across. */
function koyoOutline(n, cy) {
  var pts = [];
  for (var i = 0; i <= n; i++) {
    var a = -PI / 2 + (i / n) * TAU, rel = a + PI / 2;
    var lobe = Math.pow(Math.abs(Math.cos(rel * 3.5)), 0.6);
    var rr = (0.4 + 0.6 * lobe) * (Math.cos(rel) < -0.6 ? 0.55 : 1);
    pts.push([Math.cos(a) * rr * 0.5, Math.sin(a) * rr * 0.5 + cy]);
  }
  return pts;
}
/* The falling kōyō leaf: no veins and no visible stem (it sits under the blade). */
function geoKoyo(r, v) {
  return { pts: koyoOutline(140, -0.5), veins: [], veinStyle: 'light', stem: [[0, -0.5], [0, -0.45], [0, -0.4]] };
}
/* Plain, generic leaf for the bare tree: a small almond shape with a midrib. */
function geoGeneric(r, v) {
  var W2 = 0.2 * (1 + (r() - 0.5) * 0.4 * v), N = 40, pts = [], i, t;
  function hw(tt) { return W2 * Math.pow(Math.sin(PI * Math.pow(tt, 0.75)), 0.9); }
  for (i = 0; i <= N; i++) { t = i / N; pts.push([-hw(t), -t]); }
  for (i = N; i >= 0; i--) { t = i / N; pts.push([hw(t), -t]); }
  return { pts: pts, veins: [[0, 0, 0, -0.9]], veinStyle: 'light', stem: [[0, 0], [0.01, 0.08], [0.02 * (r() - 0.5), 0.15]] };
}
var GEO = { momiji: geoMomiji, ginkgo: geoGinkgo, oak: geoOak, keyaki: geoKeyaki, koyo: geoKoyo, generic: geoGeneric };

/* Build one leaf's geometry from its seed, then bend it and add wear. */
function buildGeometry(L) {
  var r = rngFrom(L.seed);
  var v = S.shapeVariation;
  var g = GEO[L.species](r, v);
  var bend = (r() - 0.5) * 0.4 * v;
  var bendFn = function(p) { return [p[0] + bend * p[1] * p[1], p[1]]; };
  g.pts = g.pts.map(bendFn);
  g.stem = g.stem.map(bendFn);
  g.veins = g.veins.map(function(s) {
    var a = bendFn([s[0], s[1]]), b = bendFn([s[2], s[3]]);
    return [a[0], a[1], b[0], b[1]];
  });
  var w = L.species === 'koyo' ? 0 : S.wear;     // the kōyō leaves stay clean
  var wr = r();
  g.bites = [];
  g.spots = [];
  if (wr < w * 0.7) {
    var nb = 1 + Math.floor(r() * 2);
    for (var i = 0; i < nb; i++) {
      var q = g.pts[Math.floor(r() * g.pts.length)];
      g.bites.push([q[0] * 1.05, q[1] * 1.05, 0.06 + r() * 0.08]);
    }
  }
  if (r() < w) {
    var ns = 2 + Math.floor(r() * 6);
    for (var j = 0; j < ns; j++) {
      var pt = g.pts[Math.floor(r() * g.pts.length)], f = 0.2 + r() * 0.55;
      g.spots.push([pt[0] * f, pt[1] * f, 0.015 + r() * 0.03]);
    }
  }
  g.dry = clamp(w * (0.4 + ENV.season) * r(), 0, 1);
  L.geo = g;
}

/* ============================================================
   5. LEAF SPRITES — each leaf is drawn once into its own small
      canvas (colour, veins, wear, light, wetness, frost, blur
      baked in), then just moved and turned each frame.
   ============================================================ */
var PR = 1;
var scratch = document.createElement('canvas');
var sctx = scratch.getContext('2d');
var HAS_FILTER = typeof sctx.filter === 'string';
var lookVersion = 1, geomVersion = 1;

function leafBlur(L) {
  if (L.hero) return 0;
  // A leaf falling in front of the text or table at full strength is in focus. It
  // stays sharp after it lands (L.solid), so a later re-bake doesn't soften it.
  if (L.solid || (isFrontLeaf(L) && S.frontLeafOpacity >= 1)) return 0;
  var zc = clamp(L.z, 0, 1);
  return lerp(S.farBlur, S.nearBlur, zc) + ENV.fog * (1 - zc) * 2;
}
function leafColours(L) {
  if (L.species === 'koyo') {
    // shade at the stem, lit at the tip; a little warm lamp light at night
    var tones = KOYO_FAMILIES[L.fam] || KOYO_FAMILIES.red, kk = 1 + L.bright, n = koyoNight() * KOYO.nightGlow;
    if (L.front || L.solid) {
      // in front of the text and table, or lying on the ground: lit like the
      // near band (koyoLight, its shade, its share of older browner leaves), so
      // a leaf matches the ground it lands on (8c)
      var sh = (1 - LAND.nearShade * 0.8) * kk, ag = L.aged || 0;
      var near = function(c) { return koyoLight(scaleRgb(ag ? mixRgb(c, landLitter(L.agedTone), ag) : c, sh)); };
      return { base: near(tones[0]), mid: near(tones[1]), tip: near(mixRgb(tones[1], tones[2], 0.5)), lit: true };
    }
    return { base: scaleRgb(tones[0], kk), mid: scaleRgb(mixRgb(tones[1], KOYO_LAMP, n * 0.12), kk),
             tip: scaleRgb(mixRgb(tones[2], KOYO_LAMP, n * 0.18), kk) };
  }
  var sp = SPECIES[L.species];
  var p = clamp(ENV.season + L.pj * 0.2 * S.colorVariety, 0, 1);
  var site = SITE_RGB[sp.site[L.palIdx % sp.site.length]];
  var k = 1 + L.bright * S.colorVariety;
  function at(pp) { return scaleRgb(mixRgb(rampAt(sp.rampRgb, pp), site, S.paletteBlend), k); }
  return { base: at(p - 0.08), mid: at(p), tip: at(p + (L.species === 'ginkgo' ? 0.14 : 0.1)) };
}
function tracePath(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
}

function bakeLeaf(L) {
  if (L.geomV !== geomVersion || !L.geo) { buildGeometry(L); L.geomV = geomVersion; }
  var g = L.geo;
  var pr = L.hero ? Math.min(PR, 1.5) : PR;
  var blur = leafBlur(L);
  var s = L.size * pr;
  var side = Math.ceil(2.4 * s + blur * pr * 6 + 4);
  if (scratch.width < side || scratch.height < side) {
    scratch.width = Math.max(scratch.width, side);
    scratch.height = Math.max(scratch.height, side);
  }
  sctx.setTransform(1, 0, 0, 1, 0, 0);
  sctx.globalCompositeOperation = 'source-over';
  sctx.globalAlpha = 1;
  sctx.clearRect(0, 0, side, side);
  sctx.setTransform(s, 0, 0, s, side / 2, side / 2 + 0.25 * s);

  var C = leafColours(L);
  var grad = sctx.createLinearGradient(0, 0.1, 0, -1);
  grad.addColorStop(0, rgba(C.base));
  grad.addColorStop(0.5, rgba(C.mid));
  grad.addColorStop(1, rgba(C.tip));

  // stem
  sctx.strokeStyle = rgba(scaleRgb(C.base, 0.7));
  sctx.lineWidth = L.species === 'ginkgo' ? 0.022 : 0.028;
  sctx.lineCap = 'round';
  sctx.beginPath();
  sctx.moveTo(g.stem[0][0], g.stem[0][1]);
  sctx.quadraticCurveTo(g.stem[1][0], g.stem[1][1], g.stem[2][0], g.stem[2][1]);
  sctx.stroke();

  // blade
  tracePath(sctx, g.pts);
  sctx.fillStyle = grad;
  sctx.fill();

  sctx.save();
  sctx.clip();
  // veins
  sctx.lineWidth = g.veinStyle === 'fine' ? 0.007 : 0.014;
  sctx.strokeStyle = g.veinStyle === 'fine' ? 'rgba(120,80,20,0.14)' : 'rgba(255,236,205,0.24)';
  sctx.beginPath();
  for (var i = 0; i < g.veins.length; i++) {
    sctx.moveTo(g.veins[i][0], g.veins[i][1]);
    sctx.lineTo(g.veins[i][2], g.veins[i][3]);
  }
  sctx.stroke();
  // brown spots
  sctx.fillStyle = 'rgba(90,50,25,0.45)';
  for (var j = 0; j < g.spots.length; j++) {
    sctx.beginPath();
    sctx.arc(g.spots[j][0], g.spots[j][1], g.spots[j][2], 0, TAU);
    sctx.fill();
  }
  // dry edge
  if (g.dry > 0.05) {
    tracePath(sctx, g.pts);
    sctx.strokeStyle = 'rgba(110,70,35,' + (0.5 * g.dry).toFixed(3) + ')';
    sctx.lineWidth = 0.07;
    sctx.stroke();
  }
  // wet: darker (already in the light for C.lit) + a thin shine
  if (ENV.wet > 0) {
    sctx.fillStyle = 'rgba(40,20,22,' + (0.22 * ENV.wet * (C.lit ? 0 : 1)).toFixed(3) + ')';
    sctx.fillRect(-2, -2, 4, 4);
    sctx.strokeStyle = 'rgba(255,255,255,' + (0.38 * ENV.wet).toFixed(3) + ')';
    sctx.lineWidth = 0.025;
    sctx.beginPath();
    sctx.moveTo(-0.16, -0.2);
    sctx.quadraticCurveTo(-0.2, -0.45, -0.06, -0.72);
    sctx.stroke();
  }
  // time-of-day light on the leaf
  var Lt = ENV.light;
  if (S.lightTint > 0 && !C.lit) {                // C.lit: the light is already in the colours
    sctx.fillStyle = rgba(Lt.col, S.lightTint * Lt.amt * 1.5);
    sctx.fillRect(-2, -2, 4, 4);
    if (Lt.dark > 0) {
      sctx.fillStyle = 'rgba(28,32,58,' + (S.lightTint * Lt.dark * 0.5).toFixed(3) + ')';
      sctx.fillRect(-2, -2, 4, 4);
    }
  }
  // fog fades far leaves toward the paper colour
  var zc = clamp(L.z, 0, 1);
  if (ENV.fog > 0 && !L.hero) {
    sctx.fillStyle = 'rgba(250,246,240,' + (ENV.fog * (1 - zc) * 0.55).toFixed(3) + ')';
    sctx.fillRect(-2, -2, 4, 4);
  }
  // frost on the edges when cold
  if (ENV.frost > 0) {
    sctx.fillStyle = 'rgba(225,235,250,' + (0.18 * ENV.frost).toFixed(3) + ')';
    sctx.fillRect(-2, -2, 4, 4);
    tracePath(sctx, g.pts);
    sctx.strokeStyle = 'rgba(250,252,255,' + (0.8 * ENV.frost).toFixed(3) + ')';
    sctx.lineWidth = 0.08;
    sctx.stroke();
  }
  sctx.restore();

  // bites and tears
  if (g.bites.length) {
    sctx.globalCompositeOperation = 'destination-out';
    for (var b = 0; b < g.bites.length; b++) {
      sctx.beginPath();
      sctx.arc(g.bites[b][0], g.bites[b][1], g.bites[b][2], 0, TAU);
      sctx.fill();
    }
    sctx.globalCompositeOperation = 'source-over';
  }

  // copy into the leaf's own sprite, with its depth blur
  if (!L.spr || L.spr.width !== side) {
    L.spr = document.createElement('canvas');
    L.spr.width = L.spr.height = side;
    L.back = document.createElement('canvas');
    L.back.width = L.back.height = side;
  }
  var c1 = L.spr.getContext('2d');
  c1.clearRect(0, 0, side, side);
  if (HAS_FILTER && blur > 0.05) c1.filter = 'blur(' + (blur * pr).toFixed(2) + 'px)';
  c1.drawImage(scratch, 0, 0, side, side, 0, 0, side, side);
  if (HAS_FILTER) c1.filter = 'none';
  var c2 = L.back.getContext('2d');
  c2.clearRect(0, 0, side, side);
  if (HAS_FILTER) c2.filter = 'brightness(1.12) saturate(0.7)';
  else c2.globalAlpha = 0.85;
  c2.drawImage(L.spr, 0, 0);
  if (HAS_FILTER) c2.filter = 'none';
  c2.globalAlpha = 1;
  L.hs = side / (2 * pr);
  L.bakedV = lookVersion;
  if (L.shd) bakeLeafShadow(L);        // on the ground (or just lifted): its soft shadow, re-made in the new light
}

/* ============================================================
   6. LEAF MOTION
   ============================================================ */
var leaves = [];   // falling, sorted far → near
var pile = [];     // landed at the bottom edge
var hero = null;   // the occasional close-up leaf
var nextId = 1;

function speciesWeights() {
  if (S.speciesMode === 'manual') {
    return { momiji: S.wMomiji, ginkgo: S.wGinkgo, oak: S.wOak, keyaki: S.wKeyaki };
  }
  if (S.speciesMode === 'koyo') return { koyo: 1 };
  var p = ENV.season;
  return {
    ginkgo: 0.03 + bell(p, 0.4, 0.3),
    momiji: 0.03 + bell(p, 0.65, 0.3),
    keyaki: 0.03 + 0.6 * bell(p, 0.45, 0.35),
    oak:    0.03 + 0.7 * bell(p, 0.85, 0.25)
  };
}
function pickWeighted(w) {
  var tot = 0, k;
  for (k in w) tot += Math.max(0, w[k]);
  if (tot <= 0) return null;
  var x = Math.random() * tot;
  for (k in w) { x -= Math.max(0, w[k]); if (x <= 0) return k; }
  return k;
}
function setMode(L, forced) {
  var w = {};
  var base = SPECIES[L.species].modes;
  for (var k in base) w[k] = base[k];
  if (ENV.windMs > 6) { w.tumble *= 1.8; w.glide *= 1.5; }
  if (ENV.rainy) { w.tumble *= 2; w.flutter *= 0.5; }
  if (ENV.frost > 0) { w.flutter *= 0.6; w.tumble *= 1.4; }
  var m = forced || pickWeighted(w);
  var depth = 0.5 + 0.5 * clamp(L.z, 0, 1.4);
  L.mode = m;
  L.modeVx = 0;
  if (m === 'flutter') {
    L.swayAmp = rnd(18, 48) * S.sway * depth; L.sf = rnd(1.4, 2.6);
    L.flipV = (Math.random() - 0.5) * 1.2; L.fallMul = 0.85; L.modeT = rnd(2, 6);
  } else if (m === 'tumble') {
    L.swayAmp = 6 * S.sway; L.sf = 2;
    L.flipV = (Math.random() < 0.5 ? -1 : 1) * rnd(5, 9); L.rotV = (Math.random() < 0.5 ? -1 : 1) * rnd(1.5, 3.5);
    L.fallMul = 1.35; L.modeT = rnd(1, 3);
  } else if (m === 'glide') {
    L.glideDir = Math.abs(ENV.windPx) > 20 && Math.random() < 0.7 ? Math.sign(ENV.windPx) : (Math.random() < 0.5 ? -1 : 1);
    L.modeVx = L.glideDir * rnd(40, 90) * depth;
    L.swayAmp = 4; L.sf = 1; L.flipV = (Math.random() - 0.5) * 0.6;
    L.fallMul = 0.55; L.modeT = rnd(1.2, 2.5);
  } else {
    L.swayAmp = rnd(14, 32) * S.sway * depth; L.sf = rnd(3, 5);
    L.flipV = L.sf; L.rotV = (Math.random() < 0.5 ? -1 : 1) * 2.4;
    L.fallMul = 0.95; L.modeT = rnd(2, 5);
  }
}

function makeLeaf(opts) {
  opts = opts || {};
  var species = opts.species || pickWeighted(speciesWeights()) || 'momiji';
  // S.nearShare of the leaves are near ones (they fall in front of the text and table); the rest spread over all depths
  var z = opts.z !== undefined ? opts.z :
          (Math.random() < S.nearShare ? rnd(S.frontLeafMinZ, 1) : lerp(1, 0, S.depthSpread * Math.pow(Math.random(), 0.8)));
  var L = {
    id: nextId++, seed: (Math.random() * 4294967296) >>> 0, species: species, z: z,
    hero: !!opts.hero,
    size: SPECIES[species].size * (0.45 + 0.6 * clamp(z, 0, 1)) * S.sizeScale * rnd(0.85, 1.15) * (opts.hero ? 1.3 : 1),
    x: 0, y: 0, vx: 0, vy: 0, rot: rnd(-PI, PI), baseRot: rnd(-0.6, 0.6),
    phi: rnd(0, TAU), sp: rnd(0, TAU), so: 0, age: 0,
    fallJ: rnd(0.8, 1.2),
    pj: (Math.random() + Math.random() + Math.random() - 1.5) * 1.4,
    palIdx: Math.floor(Math.random() * 5), bright: rnd(-0.06, 0.06),
    gid: 0, settled: false
  };
  if (species === 'koyo') L.fam = pickWeighted(KOYO_SHARES);
  L.aged = Math.random() < LAND.leafAge ? rnd(0.4, 0.85) : 0;   // older, browner (used for leaves in front, 8c)
  L.agedTone = rnd(0.2, 1);
  setMode(L);
  return L;
}
function insertSorted(L) {
  var i = leaves.length;
  while (i > 0 && leaves[i - 1].z > L.z) i--;
  leaves.splice(i, 0, L);
}
function spawnLeaf(opts) {
  opts = opts || {};
  if (ENV.scene === 'winter' && !opts.hero) return null;
  if (leaves.length >= S.maxLeaves && !opts.force) return null;
  // Gusts and puffs may add leaves past the normal cap, but never past this
  // ceiling, so a long gust cannot pile leaves up until the frame rate drops.
  if (leaves.length >= S.maxLeaves * 1.25) return null;
  var L = makeLeaf(opts);
  // The nearest leaves fall in front of the text (a few at a time).
  if (S.frontLeaves > 0 && L.z >= S.frontLeafMinZ && frontLeafCount < S.frontLeaves) {
    L.front = true; frontLeafCount++;
    L.size = nearLeafPx() * rnd(0.85, 1.15);   // nearest to the glass: the near band's size (8c)
    if (L.fam === 'green' || L.fam === 'evergreen') L.fam = 'orange';   // big green leaves stood out this close
  }
  var wp = ENV.windPx;
  if (opts.x !== undefined) { L.x = opts.x; L.y = opts.y; }
  else if (Math.abs(wp) > 30 && Math.random() < Math.min(0.5, Math.abs(wp) / 250)) {
    L.x = wp > 0 ? -L.size : W + L.size;
    L.y = Math.random() * H * 0.5;
  } else {
    L.x = Math.random() * W * 1.2 - W * 0.1 - wp * 3;
    L.y = -L.size * 1.2 - Math.random() * 40;
  }
  if (opts.vx !== undefined) L.vx = opts.vx;
  if (opts.prefill) { L.y = Math.random() * H; L.age = 5; }
  bakeLeaf(L);
  insertSorted(L);
  return L;
}

function updateLeaf(L, dt, t) {
  L.age += dt;
  L.modeT -= dt;
  if (L.modeT <= 0) setMode(L);
  var zc = clamp(L.z, 0, 1.4);
  var T = 46 * (0.45 + 0.55 * zc) * S.fallSpeed * L.fallJ * (L.hero ? 0.7 : 1) * (ENV.rainy ? 1 + 0.25 * ENV.wet : 1);
  var gustEnv = Math.max(0.2, 1 + S.gustiness * 0.6 * (noise1(t * 0.25) * 2 - 1));
  var turb = (ENV.windMs * 6 + 8) * (noise1(L.seed % 997 + t * 0.7) * 2 - 1);
  var wx = (ENV.windPx * gustEnv + turb) * (0.35 + 0.65 * zc);
  var tvx = wx + L.modeVx;
  if (L.blown) tvx = L.blown * 170;              // blown off the ground: carried away on the wind
  L.vx += (tvx - L.vx) * (1 - Math.exp(-dt * 1.6));
  L.sp += L.sf * dt;
  var tvy = T * L.fallMul;
  var targetSo = 0;
  if (L.mode === 'flutter') {
    tvy *= 0.55 + 0.9 * Math.abs(Math.cos(L.sp));
    targetSo = L.swayAmp * Math.sin(L.sp);
    var rt = L.baseRot + 0.55 * Math.cos(L.sp) * Math.min(1.5, S.sway);
    L.rot += angDiff(rt, L.rot) * (1 - Math.exp(-dt * 3));
    L.baseRot += (Math.random() - 0.5) * dt * 0.4;
  } else if (L.mode === 'tumble' || L.mode === 'spiral') {
    targetSo = L.swayAmp * Math.sin(L.sp);
    L.rot += L.rotV * dt;
  } else {
    var gt = L.baseRot + L.glideDir * 0.5;
    L.rot += angDiff(gt, L.rot) * (1 - Math.exp(-dt * 2));
  }
  if (L.blown) tvy = -20;                         // and rising gently, so it leaves the screen
  L.vy += (tvy - L.vy) * (1 - Math.exp(-dt * 2.2));
  L.so += (targetSo - L.so) * (1 - Math.exp(-dt * 4));
  L.phi += L.flipV * dt * (0.5 + 0.5 * S.flip3d);
  L.x += L.vx * dt;
  L.y += L.vy * dt;
}

/* Landing (only the leaves falling in front of the text and table land, on
   the near band's ground — see 8c). The leaf keeps its turn and settles flat
   over a moment, from how it was falling to how it lies, and its soft shadow
   fades in, instead of switching at once. */
function settleLeaf(L, t) {
  var f = Math.min(1, S.flip3d), c = Math.cos(L.phi), sx = lerp(1, c, f);
  if (Math.abs(sx) < 0.06) sx = sx < 0 ? -0.06 : 0.06;
  L.sx0 = sx;
  L.sy0 = 1 - 0.18 * f * (0.5 + 0.5 * Math.sin(L.phi * 0.7 + (L.seed % 10)));
  L.pileFace = c >= 0 || f < 0.05;
  L.pileSx = sx < 0 ? -1 : 1;
  L.pileSy = rnd(0.45, 0.72);
  L.x += L.so; L.so = 0;
  L.y0 = L.y; L.st = t; L.liftT = undefined; L.blown = 0;
  addToFloor(L);
  bakeLeafShadow(L);
}
/* A leaf leaves the ground (a gust, a tap, or blown away): it stays in front
   of the text and table, and eases from how it lay into its falling shape. */
function liftFromPile(L, vx, vy) {
  var i = pile.indexOf(L);
  if (i >= 0) pile.splice(i, 1);
  L.settled = false;
  L.front = true;
  L.vx = vx; L.vy = vy;
  L.liftT = lastT; L.st = undefined; L.fade = undefined;
  L.land = Math.random() < LAND.landShare; L.gy = rnd(2, LAND.bedDepth);
  setMode(L, 'tumble');
  L.phi = L.pileFace === false ? PI : 0;          // its flip starts as it lay
  insertSorted(L);
}

/* ============================================================
   7. WIND EVENTS — gusts, tap/swipe puffs, lightning scatter
   ============================================================ */
var gusts = [], gustId = 1;
function startGust(force) {
  if (gusts.length >= 2 && !force) return;          // one gust at a time is plenty; never a continuous chain
  var dir = Math.abs(ENV.windPx) > 4 ? Math.sign(ENV.windPx) : (Math.random() < 0.5 ? -1 : 1);
  var g = {
    id: gustId++, dir: dir, x: dir > 0 ? -100 : W + 100,
    speed: 650 + ENV.windMs * 30,
    str: (90 + ENV.windMs * 22) * (0.6 + S.gustiness) * (force ? 1.3 : 1),
    lifts: 10                                       // most leaves it may lift off the ground
  };
  gusts.push(g);
  bambooGust(g.str / BAMBOO_GUST_STR);
  var n = Math.round((3 + Math.floor(Math.random() * 5)) * 0.8);   // 20% fewer leaves blown in
  for (var i = 0; i < n; i++) {
    spawnLeaf({ x: dir > 0 ? -30 : W + 30, y: Math.random() * H * 0.6, vx: dir * g.str * rnd(0.5, 1), force: force });
  }
}
function updateGusts(dt) {
  for (var i = gusts.length - 1; i >= 0; i--) {
    var g = gusts[i];
    g.x += g.dir * g.speed * dt;
    for (var j = 0; j < leaves.length; j++) {
      var L = leaves[j];
      if (L.gid === g.id) continue;
      if (g.dir > 0 ? L.x < g.x : L.x > g.x) {
        L.gid = g.id;
        L.vx += g.dir * g.str * (0.5 + 0.5 * clamp(L.z, 0, 1)) * rnd(0.7, 1.3);
        L.vy -= g.str * 0.25 * Math.random();
      }
    }
    for (var k = pile.length - 1; k >= 0; k--) {
      var P = pile[k];
      if (P.gid === g.id) continue;
      if (g.dir > 0 ? P.x < g.x : P.x > g.x) {
        P.gid = g.id;
        if (g.lifts > 0 && leaves.length < S.maxLeaves * 1.25 && Math.random() < 0.44 && g.lifts--) liftFromPile(P, g.dir * g.str * rnd(0.6, 1.2), -rnd(60, 180));
        else P.kick = g.dir * 0.3 * Math.min(1.5, g.str / 150);   // the rest tremble as it passes
      }
    }
    [tree, farTree].forEach(function(T) {
      if (T && T.gid !== g.id && (g.dir > 0 ? T.bx < g.x : T.bx > g.x)) {
        T.gid = g.id;
        // push in proportion to the gust's strength, but less the further the
        // tree is already leaning that way, so gusts in a row cannot pin it bent
        var lean = T.gust * g.dir > 0 ? 1 - Math.min(1, Math.abs(T.gust) / 0.35) : 1;
        T.gustV += g.dir * (g.str / 400) * lean;
        if (T.koyo) for (var q = Math.round((2 + Math.floor(Math.random() * 4)) * 0.8); q > 0; q--) dropKoyoLeaf(T, g.dir * g.str * rnd(0.2, 0.5));
      }
    });
    bambooGroves.forEach(function(G) {              // the bamboo groves get a push as it passes them too
      if (G.gid !== g.id && (g.dir > 0 ? G.x < g.x : G.x > g.x)) {
        G.gid = g.id;
        G.gustV += g.dir * (g.str / 400) * 0.6 * G.B.gustResponse;
      }
    });
    if (g.x < -200 || g.x > W + 200) gusts.splice(i, 1);
  }
}
function pushAround(px, py, radius, fx, fy, radial, liftChance) {
  var all = leaves.slice();
  if (hero) all.push(hero);
  for (var i = 0; i < all.length; i++) {
    var L = all[i];
    var dx = L.x - px, dy = L.y - py, d = Math.sqrt(dx * dx + dy * dy);
    if (d > radius) continue;
    var f = 1 - d / radius;
    var nx = d > 0.01 ? dx / d : 0, ny = d > 0.01 ? dy / d : -1;
    var k = f * (0.5 + 0.5 * clamp(L.z, 0, 1.4));
    L.vx += (fx + nx * radial) * k;
    L.vy += (fy + ny * radial) * k;
    if (L.mode !== 'tumble' && Math.random() < f) setMode(L, 'tumble');
  }
  for (var j = pile.length - 1; j >= 0; j--) {
    var P = pile[j];
    var ex = P.x - px, ey = P.y - py, e = Math.sqrt(ex * ex + ey * ey);
    if (e < radius * 0.8 && Math.random() < liftChance) {
      liftFromPile(P, fx * 0.6 + (ex / (e || 1)) * radial * 0.8, -rnd(120, 260));
    }
  }
}

var lightningNext = 0, flashes = [];
function strikeLightning() {
  var t0 = performance.now() / 1000;
  flashes.push({ at: t0, a: 0.55 }, { at: t0 + 0.18, a: 0.35 });
  setTimeout(function() {
    pushAround(Math.random() * W, Math.random() * H * 0.6, Math.max(W, H), 0, -40, 220, 0.8);
  }, 250);
}

/* ============================================================
   8. WEATHER & TIME-OF-DAY LAYERS
   ============================================================ */
var streaks = [], splashes = [], flakes = [], specks = [];
var cloudSprite = null, fogSprite = null, speckSprite = null;
var cloudShadowsPos = [{ x: 0, y: 0.1 }, { x: 0.55, y: 0.45 }, { x: 1.1, y: 0.2 }];
var fogBands = [{ x: 0, y: 0.25, s: 1 }, { x: 0.4, y: 0.55, s: 0.7 }, { x: 0.8, y: 0.8, s: 1.2 }];

function makeSprites() {
  makeSnowSprites();
  cloudSprite = document.createElement('canvas');
  cloudSprite.width = 320; cloudSprite.height = 220;
  var c = cloudSprite.getContext('2d');
  // every blob fades out well inside the sprite, so no hard edges
  var blobs = [[100, 120, 60], [150, 105, 70], [200, 125, 55], [130, 135, 50], [230, 110, 45]];
  blobs.forEach(function(b) {
    var g = c.createRadialGradient(b[0], b[1], 0, b[0], b[1], b[2]);
    g.addColorStop(0, 'rgba(70,50,60,0.55)');
    g.addColorStop(1, 'rgba(70,50,60,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, 320, 220);
  });
  fogSprite = document.createElement('canvas');
  fogSprite.width = 640; fogSprite.height = 240;
  var f = fogSprite.getContext('2d');
  for (var i = 0; i < 9; i++) {
    var x = 130 + i * 47.5, y = 120 + (Math.random() - 0.5) * 30, r = 60 + Math.random() * 40;
    var g2 = f.createRadialGradient(x, y, 0, x, y, r);
    g2.addColorStop(0, 'rgba(252,249,245,0.6)');
    g2.addColorStop(1, 'rgba(252,249,245,0)');
    f.fillStyle = g2;
    f.fillRect(0, 0, 640, 240);
  }
  speckSprite = document.createElement('canvas');
  speckSprite.width = speckSprite.height = 32;
  var sp = speckSprite.getContext('2d');
  var g3 = sp.createRadialGradient(16, 16, 0, 16, 16, 16);
  // firefly light: a bright yellow-green centre in a soft warm halo
  g3.addColorStop(0, 'rgba(250,255,200,1)');
  g3.addColorStop(0.18, 'rgba(214,236,110,0.9)');
  g3.addColorStop(0.45, 'rgba(230,200,90,0.35)');
  g3.addColorStop(1, 'rgba(255,170,90,0)');
  sp.fillStyle = g3;
  sp.fillRect(0, 0, 32, 32);
}

/* Rain like the Samsung Weather app: long thin glassy streaks that fall
   almost straight down, very fast. Each streak is a soft white line that
   fades in from its tail and is brightest just above its tip, with a faint
   cool-grey edge so it still shows on the pale page. Streaks are drawn from
   three pre-made sprites (far, middle, near), stretched to each length. */
var RAIN_TIERS = [
  { w: 1.0, halo: 2.2, core: 0.75, edge: 0.14 },   // far: hair-thin, faint
  { w: 1.4, halo: 3.0, core: 0.9,  edge: 0.2 },
  { w: 1.9, halo: 3.8, core: 1.0,  edge: 0.26 }    // near: a little wider, brighter
];
var rainSprites = [], rainSpritePR = 0;
function makeRainSprites() {
  rainSpritePR = PR;
  rainSprites = RAIN_TIERS.map(function(tr) {
    var c = document.createElement('canvas');
    var hw = Math.ceil(tr.halo * 2 * PR) + 4, h = 128;
    c.width = hw; c.height = h;
    var x = c.getContext('2d'), mid = hw / 2;
    // the cool-grey edge, a soft wide line under the white
    var ge = x.createLinearGradient(0, 0, 0, h);
    ge.addColorStop(0, 'rgba(90,108,132,0)');
    ge.addColorStop(0.55, 'rgba(90,108,132,' + (tr.edge * 0.6) + ')');
    ge.addColorStop(0.9, 'rgba(90,108,132,' + tr.edge + ')');
    ge.addColorStop(1, 'rgba(90,108,132,0)');
    x.fillStyle = ge;
    if (HAS_FILTER) x.filter = 'blur(' + (0.8 * PR).toFixed(1) + 'px)';
    x.fillRect(mid - tr.halo * PR / 2, 2, tr.halo * PR, h - 4);
    x.filter = 'none';
    // the white core: clear at the tail, brightest just above the tip
    var gc = x.createLinearGradient(0, 0, 0, h);
    gc.addColorStop(0, 'rgba(255,255,255,0)');
    gc.addColorStop(0.45, 'rgba(255,255,255,' + (tr.core * 0.45) + ')');
    gc.addColorStop(0.88, 'rgba(255,255,255,' + tr.core + ')');
    gc.addColorStop(1, 'rgba(255,255,255,0.2)');
    x.fillStyle = gc;
    x.fillRect(mid - tr.w * PR / 2, 0, tr.w * PR, h);
    return c;
  });
}
function rainTier(z) { return z < 0.45 ? 0 : (z < 0.75 ? 1 : 2); }
function newStreak(s, top) {
  s.z = Math.pow(Math.random(), 0.8) * 0.8 + 0.2;
  s.a = rnd(0.45, 1);                                  // some streaks bright, many faint
  s.len = (22 + 70 * s.z) * rnd(0.7, 1.3);
  s.x = Math.random() * (W + 200) - 100;
  s.y = top ? -s.len - Math.random() * H * 0.4 : Math.random() * H;
  s.age = top ? 0 : 1;
  return s;
}

function updateRain(dt) {
  var c = S.condition;
  var drizzle = c === 'drizzle';
  var target = 0;
  if (ENV.rainy) target = drizzle ? 90 * S.rainStreaks : Math.min(320, (70 + S.rainMm * 25) * S.rainStreaks);
  target = Math.round(target);
  while (streaks.length < target) streaks.push(newStreak({}, false));
  if (streaks.length > target) streaks.length = target;
  var vx = ENV.windPx * 1.2;
  for (var i = 0; i < streaks.length; i++) {
    var s = streaks[i];
    var spd = (1100 + 1200 * s.z) * (drizzle ? 0.55 : 1);
    s.y += spd * dt;
    s.x += vx * dt;
    s.age += dt;
    if (s.y - s.len > H) {
      if (S.splashes && s.z > 0.6 && Math.random() < 0.35) splashes.push({ x: s.x, y: H - 4 - Math.random() * 24, t: 0, z: s.z });
      newStreak(s, true);
      s.x -= vx * 0.5;
    }
    if (s.x < -100) s.x += W + 200;
    if (s.x > W + 100) s.x -= W + 200;
  }
  for (var j = splashes.length - 1; j >= 0; j--) {
    splashes[j].t += dt;
    if (splashes[j].t > 0.3) splashes.splice(j, 1);
  }
}
function drawRain(ctx) {
  if (!streaks.length && !splashes.length) return;
  if (rainSpritePR !== PR || !rainSprites.length) makeRainSprites();
  var drizzle = S.condition === 'drizzle';
  var lenMul = (drizzle ? 0.6 : 1) * (1 + S.rainMm / 20);
  var aMul = (drizzle ? 0.7 : 1) * Math.min(1.5, S.rainContrast);
  // the slight lean in the wind: a shear, so each sprite stays one drawImage
  var lean = -ENV.windPx * 1.2 / 1700;
  ctx.setTransform(PR, 0, lean * PR, PR, 0, 0);
  for (var tier = 0; tier < 3; tier++) {
    var spr = rainSprites[tier], sw = spr.width / PR;
    for (var i = 0; i < streaks.length; i++) {
      var s = streaks[i];
      if (rainTier(s.z) !== tier) continue;
      var len = s.len * lenMul;
      ctx.globalAlpha = Math.min(1, s.a * aMul * Math.min(1, s.age / 0.06));
      ctx.drawImage(spr, s.x - lean * s.y - sw / 2, s.y - len, sw, len);
    }
  }
  ctx.globalAlpha = 1;
  ctx.setTransform(PR, 0, 0, PR, 0, 0);
  // tiny pale splashes where near drops land
  ctx.lineWidth = 0.8;
  for (var j = 0; j < splashes.length; j++) {
    var sp = splashes[j], k = sp.t / 0.3, r = (5 + 4 * sp.z) * k;
    ctx.strokeStyle = rgba([255, 255, 255], 0.7 * (1 - k) * aMul);
    ctx.beginPath();
    ctx.ellipse(sp.x, sp.y, r, r * 0.3, 0, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = rgba([90, 108, 132], 0.18 * (1 - k) * aMul);
    ctx.beginPath();
    ctx.ellipse(sp.x, sp.y + 0.8, r, r * 0.3, 0, 0, TAU);
    ctx.stroke();
  }
}

/* Rain on the glass toolbar (#barRain). Raindrops hit the pane with a
   small splash and leave a drop behind, plus a few tiny droplets thrown
   out from the splash. Drops that touch join into one. A drop wider than
   about 1.3mm (radius) can no longer hold on and runs down,
   leaving a wet trail and a line of tiny droplets; at the bottom edge it
   hangs, and once it is heavy enough it drips off. Everything else dries.

   The timings follow real water on glass, with the pane at a scale of
   1px = 0.2mm:
     - how often drops land: the rain rate (mm/h) turned into raindrops
       per square metre per second, over the pane's area;
     - evaporation: a drop's radius² shrinks at a steady rate that depends
       on the temperature, the humidity and the wind. While it rains the
       air at the glass is saturated, so nothing dries. Afterwards a tiny
       droplet is gone in a minute or two and a big drop lingers for
       twenty minutes or more (longer on a humid, still day);
     - running drops move at a few cm/s, faster the bigger they are.
   Drying uses the real clock, so drops keep drying while the scene is
   paused. */
var GLASS_MM = 0.2;                        // mm of glass per CSS px
var GLASS_HANG = 36;                       // px of canvas under the pane, for hanging drops
var glassCv = document.getElementById('barRain');
var glassCtx = glassCv ? glassCv.getContext('2d') : null;
var gDrops = [], gSplats = [], gTrails = [];
var gW = 0, gPaneH = 0, gSizeT = 0, gImpactAcc = 0, gWallMs = 0, gDrawn = false;
var gSpr = null, gSprPR = 0;

function gSatVapour(T) {                   // water vapour at saturation, kg/m³ (Magnus)
  return 611.2 * Math.exp(17.62 * T / (243.12 + T)) / (461.5 * (T + 273.15));
}
/* how fast a drop's radius² shrinks, in px²/s */
function gEvapRate() {
  var T = S.temperature, rh = clamp((S.humidity || 75) / 100, 0, 1);
  if (ENV.rainy) rh = Math.max(rh, 0.995);
  var D = 2.5e-5 * Math.pow((T + 273.15) / 293.15, 1.75);       // vapour diffusion in air, m²/s
  var flow = 1 + 1.7 * Math.sqrt(Math.max(0, S.windSpeed));        // wind carries the damp air away
  var k = 2 * D * gSatVapour(T) * (1 - rh) / 1000 * 1.5 * flow;   // m²/s (×1.5: flat drops on glass)
  var px = GLASS_MM / 1000;
  return k / (px * px);
}
function gVol(r) { return r * r * r; }
function gAddDrop(x, y, r) {
  var d = { x: x, y: y, r: r, vy: 0, vx: 0, run: false, hang: false, trailAt: y, wob: rnd(0, TAU) };
  gMerge(d);
  gDrops.push(d);
  return d;
}
/* join every drop that touches d into d */
function gMerge(d) {
  for (var i = gDrops.length - 1; i >= 0; i--) {
    var o = gDrops[i];
    if (o === d || o.drip) continue;
    var dx = o.x - d.x, dy = o.y - d.y, rr = (o.r + d.r) * 0.85;
    if (dx * dx + dy * dy > rr * rr) continue;
    var v1 = gVol(d.r), v2 = gVol(o.r), v = v1 + v2;
    d.x = (d.x * v1 + o.x * v2) / v;
    if (!o.hang) d.y = (d.y * v1 + o.y * v2) / v;
    d.r = Math.cbrt(v);
    d.hang = d.hang || o.hang;
    if (d.hang) d.y = gPaneH;
    if (o.run && !d.run) { d.run = true; d.vy = o.vy; d.trailAt = d.y; }
    gDrops.splice(i, 1);
  }
}
/* one raindrop hitting the pane: diameter in mm */
function gImpact(dmm) {
  var x = Math.random() * gW, y = Math.random() * (gPaneH - 4) + 2;
  var r = dmm / 2 * 0.84 * 1.4 / GLASS_MM;          // 60% stays and spreads out on the glass
  if (gDrops.length < 600) gAddDrop(x, y, r);
  if (dmm > 0.9) {                                    // big drops splash
    gSplats.push({ x: x, y: y, r: r, t: 0 });
    var n = Math.round(dmm * 2.5 * Math.random());
    for (var i = 0; i < n && gDrops.length < 600; i++) {
      var a = rnd(-0.2, Math.PI + 0.2) + (Math.random() < 0.3 ? Math.PI : 0), dist = r * rnd(1.8, 4.5);
      var sx = x + Math.cos(a) * dist, sy = y + Math.sin(a) * dist * 0.8;
      if (sy > 1 && sy < gPaneH - 1) gAddDrop(sx, sy, rnd(0.1, 0.3) / GLASS_MM);
    }
  }
}
function gSizeCanvas() {
  if (!glassCv) return;
  var w = glassCv.clientWidth, h = glassCv.clientHeight;
  if (w < 1 || h < 1) return;
  var pane = h - GLASS_HANG;
  if (gW && (w !== gW || Math.abs(pane - gPaneH) > 0.5)) {        // the pane changed size: keep drops on it
    for (var i = gDrops.length - 1; i >= 0; i--) {
      var d = gDrops[i];
      if (d.x > w) { gDrops.splice(i, 1); continue; }
      if (d.hang) d.y = pane; else if (d.y > pane - 1) d.y = pane - 1;
    }
  }
  gW = w; gPaneH = pane;
  if (glassCv.width !== Math.round(w * PR) || glassCv.height !== Math.round(h * PR)) {
    glassCv.width = Math.round(w * PR); glassCv.height = Math.round(h * PR);
    gDrawn = true;                                   // resized canvas: draw again
  }
}

function updateGlassRain(dt) {
  if (!glassCtx) return;
  gSizeT -= dt;
  if (gSizeT <= 0) { gSizeCanvas(); gSizeT = 0.5; }
  if (!gW || gPaneH < 10) return;
  var now = Date.now(), wall = gWallMs ? Math.min(3600, Math.max(0, (now - gWallMs) / 1000)) : 0;
  gWallMs = now;

  // raindrops landing
  if (ENV.rainy && S.condition !== 'snow') {
    var drizzle = S.condition === 'drizzle';
    // light rain would leave a few specks nobody can see on a tablet: the pane counts it as at least 1.5 (drizzle) or 3 (rain) mm/h
    var R = Math.max(S.rainMm, drizzle ? 1.5 : 3);                    // mm/h
    var dMean = drizzle ? 0.8 : Math.min(2.6, 1.3 + 0.06 * R);        // mm
    var vol = Math.PI / 6 * dMean * dMean * dMean;                    // mm³
    var area = (gW * GLASS_MM / 1000) * (gPaneH * GLASS_MM / 1000);    // m²
    var exposure = 0.7 + 0.6 * Math.min(1, Math.abs(S.windSpeed) / 6.5);   // the slanting rain that reaches the pane
    gImpactAcc += R / 3600 * 1e6 / vol * area * exposure * dt;
    while (gImpactAcc >= 1) {
      gImpactAcc -= 1;
      gImpact(drizzle ? rnd(0.5, 1.1) : clamp(0.5 - Math.log(1 - Math.random()) * (dMean - 0.5), 0.5, 4.5));
    }
  } else gImpactAcc = 0;

  var evap = gEvapRate() * wall;
  var runR = 1.3 / GLASS_MM;                        // a drop this wide (1.3mm radius) starts to run
  var dripR = 1.8 / GLASS_MM;                       // a hanging drop this big drips off
  var g = 9.81 * 1000 / GLASS_MM;                   // px/s²
  for (var i = gDrops.length - 1; i >= 0; i--) {
    var d = gDrops[i];
    if (!d) continue;                               // merges removed drops further down the list
    if (evap) {
      var r2 = d.r * d.r - evap;
      if (r2 < 0.09) { gDrops.splice(i, 1); continue; }
      d.r = Math.sqrt(r2);
    }
    if (d.drip) {                                   // falling away under the pane
      d.vy += g * dt; d.y += d.vy * dt;
      if (d.y - d.r > gPaneH + GLASS_HANG) gDrops.splice(i, 1);
      continue;
    }
    if (d.hang) {
      if (d.r > dripR) {                            // too heavy: it lets go and a small drop stays
        var keep = d.r * 0.55;
        d.r = Math.cbrt(gVol(d.r) - gVol(keep));
        d.drip = true; d.hang = false; d.vy = 40;
        gDrops.push({ x: d.x, y: gPaneH, r: keep, vy: 0, vx: 0, run: false, hang: true, wob: 0 });
      }
      continue;
    }
    if (!d.run && d.r > runR) { d.run = true; d.vy = 0; d.trailAt = d.y; }
    if (d.run) {
      // a few cm/s, faster for bigger drops; it wanders a little and the wind pushes it
      var vT = (12 + 40 * (d.r / runR - 1)) / GLASS_MM;
      vT = Math.min(vT, 150 / GLASS_MM);
      d.wob += dt * rnd(2, 5);
      d.vy += (vT * (0.7 + 0.3 * Math.sin(d.wob * 1.7)) - d.vy) * Math.min(1, dt * 6);
      d.vx = Math.sin(d.wob) * 6 + ENV.windPx * 0.15;
      var y0 = d.y, x0 = d.x;
      d.y += d.vy * dt; d.x += d.vx * dt;
      gTrails.push({ x1: x0, y1: y0, x2: d.x, y2: d.y, w: d.r * 0.5, t: 0 });
      // it leaves a line of tiny droplets behind
      if (d.y - d.trailAt > rnd(5, 12)) {
        d.trailAt = d.y;
        var tr = d.r * rnd(0.12, 0.22);
        d.r = Math.cbrt(gVol(d.r) - gVol(tr));
        gDrops.push({ x: x0 + rnd(-0.5, 0.5), y: y0, r: tr, vy: 0, vx: 0, run: false, hang: false, wob: 0 });
      }
      gMerge(d);
      if (d.r < runR * 0.75) { d.run = false; d.vy = 0; }        // too small now: it sticks again
      if (d.y + d.r * 0.3 >= gPaneH) {              // reached the bottom edge: it hangs there
        d.run = false; d.hang = true; d.y = gPaneH; d.vy = 0;
        gMerge(d);
      }
      if (d.x < -10 || d.x > gW + 10) { gDrops.splice(gDrops.indexOf(d), 1); continue; }
    }
  }
  for (var j = gSplats.length - 1; j >= 0; j--) { gSplats[j].t += dt; if (gSplats[j].t > 0.12) gSplats.splice(j, 1); }
  for (var k = gTrails.length - 1; k >= 0; k--) { gTrails[k].t += dt; if (gTrails[k].t > 2.5) gTrails.splice(k, 1); }
}

/* One drop, drawn once large and stretched to size: a clear lens of
   water. The glass behind it shows through upside down, so the drop is
   dark along its top edge and bright low down, with a small glint near
   the top and a faint shadow below. */
function gMakeSprite() {
  gSprPR = PR;
  var c = document.createElement('canvas'), n = 64, m = n / 2, R = 24;
  c.width = c.height = n;
  var x = c.getContext('2d');
  // the faint shadow it casts on the frosted glass
  var sh = x.createRadialGradient(m + 1.5, m + 3, R * 0.6, m + 1.5, m + 3, R * 1.15);
  sh.addColorStop(0, 'rgba(60,70,85,0.16)'); sh.addColorStop(1, 'rgba(60,70,85,0)');
  x.fillStyle = sh; x.fillRect(0, 0, n, n);
  // the body: clearer in the middle, darker at the top edge
  var b = x.createRadialGradient(m, m + R * 0.25, R * 0.2, m, m, R);
  b.addColorStop(0, 'rgba(255,255,255,0.28)');
  b.addColorStop(0.7, 'rgba(225,232,240,0.22)');
  b.addColorStop(1, 'rgba(70,85,105,0.65)');
  x.fillStyle = b; x.beginPath(); x.arc(m, m, R, 0, TAU); x.fill();
  var top = x.createLinearGradient(0, m - R, 0, m + R);
  top.addColorStop(0, 'rgba(55,68,88,0.45)'); top.addColorStop(0.45, 'rgba(55,68,88,0)');
  x.fillStyle = top; x.beginPath(); x.arc(m, m, R, 0, TAU); x.fill();
  // the bright low crescent, where light comes through the lens
  var lo = x.createRadialGradient(m, m + R * 0.55, 0, m, m + R * 0.55, R * 0.7);
  lo.addColorStop(0, 'rgba(255,255,255,0.75)'); lo.addColorStop(1, 'rgba(255,255,255,0)');
  x.save(); x.beginPath(); x.arc(m, m, R * 0.92, 0, TAU); x.clip();
  x.fillStyle = lo; x.fillRect(0, 0, n, n); x.restore();
  // the glint
  var gl = x.createRadialGradient(m - R * 0.35, m - R * 0.45, 0, m - R * 0.35, m - R * 0.45, R * 0.28);
  gl.addColorStop(0, 'rgba(255,255,255,0.95)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = gl; x.fillRect(0, 0, n, n);
  gSpr = c;
}
function drawGlassRain() {
  if (!glassCtx || !gW) return;
  if (!gDrops.length && !gSplats.length && !gTrails.length) {
    if (gDrawn) { glassCtx.setTransform(1, 0, 0, 1, 0, 0); glassCtx.clearRect(0, 0, glassCv.width, glassCv.height); gDrawn = false; }
    return;
  }
  if (!gSpr || gSprPR !== PR) gMakeSprite();
  var x = glassCtx;
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.clearRect(0, 0, glassCv.width, glassCv.height);
  x.setTransform(PR, 0, 0, PR, 0, 0);
  gDrawn = true;
  // wet trails: a thin film that breaks up and dries within a few seconds
  x.lineCap = 'round';
  for (var k = 0; k < gTrails.length; k++) {
    var tr = gTrails[k], f = 1 - tr.t / 2.5;
    x.strokeStyle = 'rgba(255,255,255,' + (0.3 * f).toFixed(3) + ')';
    x.lineWidth = Math.max(0.6, tr.w * (0.6 + 0.4 * f));
    x.beginPath(); x.moveTo(tr.x1, tr.y1); x.lineTo(tr.x2, tr.y2); x.stroke();
  }
  var s = 64 / 48;                                  // sprite size per drop diameter
  for (var i = 0; i < gDrops.length; i++) {
    var d = gDrops[i], w = d.r * 2 * s, h = w;
    if (d.run) h *= 1 + Math.min(0.35, d.vy * GLASS_MM / 400);   // a running drop stretches
    if (d.drip) h *= 1.6;
    if (d.hang) h *= 1.15;                                         // hanging drops sag
    x.globalAlpha = Math.min(1, d.r / 1.2);
    x.drawImage(gSpr, d.x - w / 2, d.y - h / 2 - (d.run ? (h - w) * 0.3 : 0), w, h);
  }
  x.globalAlpha = 1;
  // splashes: a quick bright ring as a raindrop bursts on the glass
  x.lineWidth = 0.8;
  for (var j = 0; j < gSplats.length; j++) {
    var sp = gSplats[j], q = sp.t / 0.12, rr = sp.r * (1 + 2.2 * q);
    x.strokeStyle = 'rgba(255,255,255,' + (0.8 * (1 - q)).toFixed(3) + ')';
    x.beginPath(); x.arc(sp.x, sp.y, rr, 0, TAU); x.stroke();
    x.strokeStyle = 'rgba(70,85,105,' + (0.25 * (1 - q)).toFixed(3) + ')';
    x.beginPath(); x.arc(sp.x, sp.y + 0.7, rr, 0, TAU); x.stroke();
  }
}

/* Snow when it really snows in the autumn theme (the winter theme has its
   own, 8d). It is drawn on the back canvas (behind the text) in five depth
   tiers: far flakes are small, slow, faint and blurred; near flakes
   are bigger, faster and sharper. Each tier is one pre-blurred sprite. */
var SNOW_TIERS = [
  { blur: 3.2, r: 1.8, a: 0.45, v: 22 },
  { blur: 2.2, r: 2.4, a: 0.55, v: 32 },
  { blur: 1.4, r: 3.0, a: 0.55, v: 44 },
  { blur: 0.8, r: 3.8, a: 0.7,  v: 58 },
  { blur: 0.3, r: 4.8, a: 0.85, v: 74 }
];
var snowSprites = [];
function makeSnowSprites() {
  snowSprites = SNOW_TIERS.map(function(tr) {
    var c = document.createElement('canvas'), sz = 64;
    c.width = c.height = sz;
    var x = c.getContext('2d');
    if (HAS_FILTER) x.filter = 'blur(' + (tr.blur * 3).toFixed(1) + 'px)';
    var g = x.createRadialGradient(sz / 2, sz / 2, 0, sz / 2, sz / 2, 15);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.65, 'rgba(244,243,250,1)');
    g.addColorStop(1, 'rgba(150,140,180,0.9)');   // soft lilac rim so flakes show on the silk-white page
    x.fillStyle = g;
    x.beginPath(); x.arc(sz / 2, sz / 2, 15, 0, TAU); x.fill();
    return c;
  });
}
function updateSnow(dt, t) {
  var target = ENV.snowing && ENV.scene !== 'winter' ? Math.round(140 * ENV.snowAmt) : 0;   // winter has its own snow (8d)
  while (flakes.length < target) {
    flakes.push({ x: Math.random() * W, y: -10 - Math.random() * H, tier: Math.floor(Math.pow(Math.random(), 1.3) * 5),
                  ph: rnd(0, TAU), sw: rnd(8, 18), sf: rnd(0.8, 1.6), r: Math.random() });
  }
  if (flakes.length > target) flakes.length = target;
  for (var i = 0; i < flakes.length; i++) {
    var f = flakes[i], tr = SNOW_TIERS[f.tier], depth = (f.tier + 1) / 5;
    f.y += tr.v * dt;
    f.x += (ENV.windPx * 0.6 * depth + Math.sin(t * f.sf + f.ph) * f.sw * depth) * dt;
    if (f.y > H + 10) { f.y = -10; f.x = Math.random() * W; }
    if (f.x < -20) f.x += W + 40;
    if (f.x > W + 20) f.x -= W + 40;
  }
}
/* Which tier group to draw:
   'far'   — the small, soft far tiers (behind the tree and fog)
   'near'  — the larger tiers, still behind the text
   'front' — a random share of the larger flakes, drawn above the text */
function isFrontFlake(f) { return f.tier >= 2 && f.r < S.snowFront; }
function drawSnow(c, mode) {
  if (!flakes.length) return;
  for (var i = 0; i < flakes.length; i++) {
    var f = flakes[i], fr = isFrontFlake(f);
    if (mode === 'front') { if (!fr) continue; }
    else if (fr || (f.tier >= 3) !== (mode === 'near')) continue;
    var tr = SNOW_TIERS[f.tier], d = tr.r * 2 * (64 / 30);
    c.globalAlpha = mode === 'front' ? tr.a * 0.85 : tr.a;
    c.drawImage(snowSprites[f.tier], f.x - d / 2, f.y - d / 2, d, d);
  }
  c.globalAlpha = 1;
}

function drawSky(ctx, t) {
  var Lt = ENV.light;
  var a = S.skyTint * Lt.amt * 1.2;
  if (a > 0.003) {
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, rgba(Lt.col, a));
    g.addColorStop(1, rgba(Lt.col, a * 0.5));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  if (Lt.dark > 0.01) {
    ctx.fillStyle = 'rgba(35,40,70,' + (S.skyTint * Lt.dark * 0.35).toFixed(3) + ')';
    ctx.fillRect(0, 0, W, H);
  }
  var wd = S.skyTint * (S.cloudCover / 100 * 0.1 + (ENV.rainy ? 0.06 : 0) + (S.condition === 'thunderstorm' ? 0.1 : 0));
  if (wd > 0.003) {
    ctx.fillStyle = 'rgba(70,64,82,' + wd.toFixed(3) + ')';
    ctx.fillRect(0, 0, W, H);
  }
  if (S.dawnGlow && Lt.phase === 'dawn') {
    var k = 1 - Math.min(1, Math.abs(S.hour - ENV.sun.rise) / 1.2);
    var rg = ctx.createRadialGradient(W * 0.3, H * 1.05, 0, W * 0.3, H * 1.05, Math.max(W, H) * 0.8);
    rg.addColorStop(0, 'rgba(255,184,150,' + (0.22 * k).toFixed(3) + ')');
    rg.addColorStop(1, 'rgba(255,184,150,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, W, H);
  }
}

/* ============================================================
   THE SUN AND THE SKY AROUND IT — the look tuned on bamboo.html (Sun Lab).
   The sun is drawn every frame at the very back, from soft pieces baked
   once: a white-hot disc with a soft edge, a smooth glow that fades with no
   visible rings, a wide faint brightening of the sky, thin streaks of uneven
   length, fine spikes, a few broad soft beams, and faint lens ghosts, added
   together as light. The weather changes how it is seen (clear, a few
   clouds, sun and cloud, thin high cloud, cloudy, haze, rain, snow): the
   weather eases from one to the next, soft clouds drift across and dim the
   sun as they pass, and a sheet of cloud or haze lies over the sky. At night
   the clouds are faint, pale and bluish so the message stays readable.
   ============================================================ */
var SUN_LOOK = {
  strength: 0.93, below: 18,
  coreSize: 19, coreSoftness: 0.7, coreBrightness: 0.92,
  glow: 1.54, glowSize: 20.5, glowFalloff: 2.46, haze: 1.07, hazeSize: 25.5, warmth: 0.53,
  streaks: 14, streakLength: 11, streakVariety: 0.75, longStreaks: 3, streakWidth: 1.1, streakStrength: 0.7,
  spikes: 30, spikeLength: 2.4, spikeStrength: 0.96, beams: 4, beamStrength: 0.22, beamWidth: 1,
  irregular: 0.75, seed: 3, turn: 4, shimmer: 0.45, shimmerSpeed: 1,
  ghosts: 0.35, ghostSize: 1, ring: 0.5, ringSize: 9,
  veil: 0.99,
  colours: { core: '#FFFFFF', glow: '#F2FAFF', haze: '#E4F1FF', low: '#FFB47E', ghost: '#D2E2FF' }
};
/* What each weather does to the sun (multipliers on the look above):
   core / blur — how much of the bright disc shows, and how much it is spread
   into a dull patch; glow, glowSize, haze — the glows; rays — streaks, spikes
   and beams; veil — a sheet of cloud or haze over the sky; ring — the halo
   seen through thin cloud. The clouds themselves are in CLOUD_LOOK. */
var SUN_WEATHER = {
  clear:  { core: 1, blur: 0, glow: 1, glowSize: 1, haze: 1, rays: 1, ghosts: 1, ring: 0, veil: 0, veilCol: [255, 255, 255] },
  sunny:  { core: 1, blur: 0, glow: 1, glowSize: 1, haze: 1, rays: 1, ghosts: 0.9, ring: 0, veil: 0, veilCol: [255, 255, 255] },
  partly: { core: 1, blur: 0, glow: 0.95, glowSize: 1, haze: 1, rays: 0.9, ghosts: 0.7, ring: 0, veil: 0.08, veilCol: [244, 244, 250] },
  thin:   { core: 0.85, blur: 0.3, glow: 1.1, glowSize: 1.4, haze: 1.4, rays: 0.2, ghosts: 0.25, ring: 1, veil: 0.32, veilCol: [244, 245, 250] },
  cloudy: { core: 0.4, blur: 1, glow: 0.55, glowSize: 1.8, haze: 0.8, rays: 0, ghosts: 0, ring: 0, veil: 0.5, veilCol: [218, 216, 226] },
  mist:   { core: 0.7, blur: 0.15, glow: 0.7, glowSize: 2, haze: 1.7, rays: 0.05, ghosts: 0, ring: 0, veil: 0.45, veilCol: [250, 246, 240] },
  rain:   { core: 0.2, blur: 1, glow: 0.3, glowSize: 2.2, haze: 0.6, rays: 0, ghosts: 0, ring: 0, veil: 0.75, veilCol: [178, 180, 194] },
  snow:   { core: 0.3, blur: 1, glow: 0.45, glowSize: 2, haze: 0.9, rays: 0, ghosts: 0, ring: 0, veil: 0.7, veilCol: [228, 230, 238] }
};
function sunCanvas() { var c = document.createElement('canvas'); return { cnv: c, c: c.getContext('2d') }; }
var SUN_SPR = { core: sunCanvas(), glow: sunCanvas(), haze: sunCanvas(), soft: sunCanvas(), ray: sunCanvas(),
                beam: sunCanvas(), ghost: sunCanvas(), ring: sunCanvas() };
var sunBakedKey = '', sunBakedAt = -99, sunCloudKey = '', sunCloudAt = -99, sunLastT = 0;
var sunRays = [], sunSpikes = [], sunBeams = [], sunClouds = [], sunCur = null;

/* The weather the sun is seen through, from the real weather. */
function sunWeatherKey() {
  var c = S.condition, cc = S.cloudCover;
  if (c === 'fog' || ENV.fog > 0.5) return 'mist';
  if (c === 'snow') return 'snow';
  if (ENV.rainy) return 'rain';
  if (cc < 12) return 'clear';
  if (cc < 32) return 'sunny';
  if (cc < 55) return 'partly';
  if (cc < 75) return 'thin';
  return 'cloudy';
}
function sunLerpWeather(a, b, k) {
  var o = {};
  for (var key in b) o[key] = Array.isArray(b[key]) ? mixRgb(a[key], b[key], k) : lerp(a[key], b[key], k);
  return o;
}
function sunRadius(alt) { return SUN_LOOK.coreSize * S.sunSize * (1 + (1 - smooth(2, 22, alt)) * 0.25); }
/* The sun's colours now: white with a cool edge high up, warmer and more
   orange the lower it is. */
function sunColours(low) {
  var C = {}; for (var k in SUN_LOOK.colours) C[k] = hexToRgb(SUN_LOOK.colours[k]);
  return {
    core: mixRgb(C.core, mixRgb(C.low, [255, 255, 255], 0.55), low),
    glow: mixRgb(C.glow, C.low, low), haze: mixRgb(C.haze, C.low, low * 0.9), ghost: mixRgb(C.ghost, C.low, low * 0.5)
  };
}
/* A round sprite of radius n px: f(p) is the brightness at p (0 centre, 1 edge). */
function sunBakeRound(Sp, n, f, col) {
  var d = n * 2, c = Sp.c;
  Sp.cnv.width = Sp.cnv.height = d;
  var img = c.createImageData(d, d), px = img.data, r = rngFrom(97);
  for (var y = 0; y < d; y++) for (var x = 0; x < d; x++) {
    var dx = x + 0.5 - n, dy = y + 0.5 - n, p = Math.sqrt(dx * dx + dy * dy) / n;
    if (p >= 1) continue;
    var I = f(p);
    if (I <= 0) continue;
    var C = col(p), o = (y * d + x) * 4;
    px[o] = C[0]; px[o + 1] = C[1]; px[o + 2] = C[2];
    px[o + 3] = clamp(Math.floor(I * 255 + r()), 0, 255);
  }
  c.putImageData(img, 0, 0);
}
/* A ray lying along +x from the sun's centre to its tip: bright and narrow at
   the root, fading and thinning toward the tip, with a soft cross-section. */
function sunBakeRay(Sp, w, h, across, along, colIn, colOut) {
  var c = Sp.c;
  Sp.cnv.width = w; Sp.cnv.height = h;
  var img = c.createImageData(w, h), px = img.data, r = rngFrom(31);
  for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
    var u = (x + 0.5) / w, v = (y + 0.5 - h / 2) / (h / 2);
    var k = v / (across * lerp(1, 0.3, u));
    var I = along(u) * Math.exp(-k * k * 2.2);
    if (I <= 0.0005) continue;
    var C = mixRgb(colIn, colOut, Math.min(1, u * 1.5)), o = (y * w + x) * 4;
    px[o] = C[0]; px[o + 1] = C[1]; px[o + 2] = C[2];
    px[o + 3] = clamp(Math.floor(I * 255 + r()), 0, 255);
  }
  c.putImageData(img, 0, 0);
}
function sunBake(low) {
  var K = sunColours(low), white = [255, 255, 255], L = SUN_LOOK;
  var s = L.coreSoftness, e0 = 0.62 * (1 - s * 0.45), e1 = 0.62 + s * 0.3;
  sunBakeRound(SUN_SPR.core, 64, function(p) { return 1 - smooth(e0, e1, p) * (1 - 0.12 * Math.exp(-p * 4)); },
               function(p) { return mixRgb(white, K.core, smooth(0.3, 0.7, p)); });
  var F = L.glowFalloff;
  sunBakeRound(SUN_SPR.glow, 200, function(p) {
    return (0.62 * Math.exp(-p * 13 * F) + 0.3 * Math.exp(-p * 5 * F) + 0.14 * Math.exp(-p * 2 * F)) * Math.pow(1 - p * p, 2);
  }, function(p) { return mixRgb(mixRgb(white, K.core, 0.5), K.glow, smooth(0, 0.25, p)); });
  sunBakeRound(SUN_SPR.haze, 160, function(p) { return Math.exp(-p * p * 3.2) * Math.pow(1 - p * p, 2); }, function() { return K.haze; });
  sunBakeRound(SUN_SPR.soft, 96, function(p) { return Math.exp(-p * p * 4) * (1 - p * p); }, function(p) { return mixRgb(K.core, K.glow, p); });
  sunBakeRay(SUN_SPR.ray, 256, 24, 0.42, function(u) { return Math.pow(1 - u, 1.4) * (0.3 + 0.7 * Math.exp(-u * 3.5)); },
             mixRgb(white, K.core, 0.5), K.glow);
  sunBakeRay(SUN_SPR.beam, 128, 48, 0.75, function(u) { return Math.pow(1 - u, 1.8) * smooth(0, 0.18, u); }, K.glow, K.glow);
  sunBakeRound(SUN_SPR.ghost, 64, function(p) { return (0.55 + 0.45 * smooth(0.55, 0.92, p)) * (1 - smooth(0.88, 1, p)); },
               function() { return K.ghost; });
  sunBakeRound(SUN_SPR.ring, 160, function(p) { var k = (p - 0.86) / 0.045; return Math.exp(-k * k) + 0.25 * Math.exp(-p * 3) * (1 - smooth(0.7, 0.86, p)); },
               function(p) { return p < 0.86 ? mixRgb([255, 200, 170], white, smooth(0.78, 0.86, p)) : mixRgb(white, [205, 222, 255], smooth(0.86, 0.95, p)); });
}
/* Where each streak, spike and beam points, how long and thick it is, and its
   own shimmer. Fixed by the pattern number. */
function sunBuildRays() {
  var L = SUN_LOOK, r = rngFrom(L.seed * 7919 + 13), irr = L.irregular, i, n = L.streaks;
  sunRays = []; sunSpikes = []; sunBeams = [];
  var off = r() * TAU;
  for (i = 0; i < n; i++) {
    sunRays.push({ a: off + (i + (r() - 0.5) * irr * 1.6) / n * TAU + (r() - 0.5) * irr * 0.25,
                   len: 1 - L.streakVariety * (1 - Math.pow(r(), 2.5)) * 0.8, w: lerp(1, 0.45 + r() * 1.1, irr),
                   b: lerp(1, 0.45 + r() * 0.75, irr), ph: r() * 100, sp: 0.6 + r() * 0.9, long: false });
  }
  for (i = 0; i < L.longStreaks; i++) {
    sunRays.push({ a: r() * TAU, len: 2 + r() * 1.4, w: 0.55 + r() * 0.4, b: 0.35 + r() * 0.3, ph: r() * 100, sp: 0.4 + r() * 0.6, long: true });
  }
  for (i = 0; i < L.spikes; i++) {
    sunSpikes.push({ a: (i + (r() - 0.5) * irr) / Math.max(1, L.spikes) * TAU, len: 0.55 + r() * 0.75, w: 0.4 + r() * 0.5,
                     b: 0.4 + r() * 0.6, ph: r() * 100, sp: 1 + r() * 1.5 });
  }
  for (i = 0; i < L.beams; i++) {
    sunBeams.push({ a: r() * TAU, len: 0.6 + r() * 0.5, w: 0.7 + r() * 0.8, b: 0.5 + r() * 0.5, ph: r() * 100, sp: 0.2 + r() * 0.3 });
  }
}
/* Slow, smooth wandering, 0..1 (a few sines out of step). */
function sunWander(t, ph) {
  return 0.5 + 0.22 * Math.sin(t * 0.9 + ph) + 0.16 * Math.sin(t * 2.3 + ph * 1.7) + 0.12 * Math.sin(t * 5.1 + ph * 0.6);
}
/* The clouds (clouds.js), as approved on bamboo-clouds.html (the Cloud
   Lab): soft clouds with wispy edges, white tops and grey shaded
   undersides, lit from the sun's side of the sky. The shapes are built
   once in the background and painted again (one a frame) when the light,
   the time of day or the weather changes. The values for each time of day
   are blended as the light changes (day → evening → night), and those for
   each weather follow the real weather (sunWeatherKey). Low banks of cloud
   drift in front of Fuji in the cloudier weathers (drawFrontClouds). */
var CLOUD_LOOK = {
  // the shapes: how many of each kind, and how they are built
  seed: 1, heaps: 2, masses: 1, towers: 1, puffs: 1, flats: 1, banks: 3,
  resolution: 0.7, detail: 3, billows: 0.5, edge: 1, wisp: 0.55, swirl: 0.75, flatBase: 0.4, density: 1.2,
  // in the sky: how many in a fully clouded sky, their size, drift, the share near the sun,
  // the band the rest are spread across (fractions of the screen height from the top), and how
  // much they hide the sun
  count: 18, size: 2.3, sizeVariety: 0.8, speed: 0.85, nearSun: 0.5, highest: 0.05, lowest: 0.45, block: 0.75,
  // in front of Fuji: how many at most, their size (next to Fuji), drift, the band of the
  // mountain they cross (0 summit … 1 foot), how far either side of the summit (in Fuji
  // heights), how solid, and how much and how often they thin out to show its outline
  front: { count: 12, size: 1, speed: 0.1, high: 0.15, low: 0.8, spread: 0.95, opacity: 0.59,
           thinning: 0.15, thinEvery: 1 },
  // the light (the side it comes from follows the sun)
  shadow: 1.6, ambient: 0.5, baseDark: 0.5, silver: 0.4, sky: '#8FA9D0',
  // each time of day: the light's height and how much it comes from in front, how bright,
  // a tint over the colours (lit, shade, base) and how strong it is, and how solid the clouds are
  times: {
    day:     { elevation: 40, front: 0.7, exposure: 1.4, tint: 0, lit: '#FFFFFF', shade: '#FFFFFF', base: '#FFFFFF', opacity: 1 },
    evening: { elevation: 8, front: 0.5, exposure: 1.3, tint: 0.4, lit: '#FFC4A0', shade: '#AA788C', base: '#966478', opacity: 1 },
    night:   { elevation: 60, front: 1, exposure: 1.2, tint: 0.6, lit: '#969EC4', shade: '#60668E', base: '#50567C', opacity: 0.22 }
  },
  // each kind of weather: how much of the sky the clouds cover, how big and solid they are, how
  // fast they move, the share of the clouds in front of Fuji, and their colours
  weather: {
    clear:  { cover: 0,    size: 1,   opacity: 0.9,  speed: 1,   front: 0,    lit: '#FFFFFF', shade: '#B8C1D4', base: '#9CA6BB' },
    sunny:  { cover: 0.3,  size: 1,   opacity: 0.9,  speed: 1,   front: 0,    lit: '#FFFFFF', shade: '#B8C1D4', base: '#9CA6BB' },
    partly: { cover: 0.7,  size: 1.2, opacity: 0.92, speed: 1,   front: 0.5,  lit: '#FFFFFF', shade: '#ABB3CB', base: '#919AB3' },
    thin:   { cover: 0,    size: 1,   opacity: 0.7,  speed: 1,   front: 0,    lit: '#FFFFFF', shade: '#C5CFE0', base: '#A7B2C6' },
    cloudy: { cover: 1,    size: 1.7, opacity: 0.95, speed: 1.2, front: 0.9,  lit: '#F0EEF4', shade: '#8A8FA5', base: '#757B92' },
    mist:   { cover: 0,    size: 1,   opacity: 0.7,  speed: 0.6, front: 0.8,  lit: '#FFFFFF', shade: '#CAD1DA', base: '#ACB4C1' },
    rain:   { cover: 0.85, size: 1.9, opacity: 0.95, speed: 1.5, front: 1,    lit: '#CECED8', shade: '#70768B', base: '#5F657B' },
    snow:   { cover: 0.6,  size: 1.5, opacity: 0.9,  speed: 0.8, front: 0.85, lit: '#F4F4F8', shade: '#9EA8BD', base: '#8691A7' }
  }
};
/* In the winter theme, as tuned on winter2.html: no towering summer clouds, more flat layers and
   low banks, and the clouds in front of Fuji drift across its flanks (8d). */
var CLOUD_WINTER = {
  heaps: 1, masses: 1, towers: 0, puffs: 2, flats: 2, banks: 2, detail: 5, edge: 0.6, swirl: 0.45,
  front: { count: 7, size: 1, speed: 0.5, high: 0.15, low: 0.8, spread: 1.6, opacity: 0.92, thinning: 0.7, thinEvery: 1 },
  weather: { snow: { cover: 0.85, front: 1 } }
};
/* A cloud value for the theme now. */
function cloudCfg(k) { return ENV.scene === 'winter' && k in CLOUD_WINTER ? CLOUD_WINTER[k] : CLOUD_LOOK[k]; }
/* A kind of weather's cloud values for the theme now. */
function cloudWeather(wk) {
  var base = CLOUD_LOOK.weather[wk], w = ENV.scene === 'winter' && CLOUD_WINTER.weather[wk];
  if (!w) return base;
  var o = {}, k;
  for (k in base) o[k] = base[k];
  for (k in w) o[k] = w[k];
  return o;
}
/* The theme has changed: the clouds are built again in its kinds. */
function cloudsForTheme() {
  cloudShapes.forEach(function(sh) { if (sh && typeof Clouds !== 'undefined' && Clouds.free) Clouds.free(sh); });
  cloudShapes = []; sunClouds = []; frontClouds = []; cloudsAsked = false; cloudGen++; sunCloudKey = '';
}
var CLOUD_SHAPE_KEYS = ['resolution', 'detail', 'billows', 'edge', 'wisp', 'swirl', 'flatBase', 'density'];
var cloudShapes = [], cloudPaint = null, cloudsAsked = false, cloudW = null, frontClouds = [], cloudGen = 0;
/* The kinds of shape, as on the Cloud Lab (the same order and seeds, so the
   clouds are the ones approved there). */
function cloudKinds() {
  var k = [], n = { heap: cloudCfg('heaps'), mass: cloudCfg('masses'), tower: cloudCfg('towers'), puff: cloudCfg('puffs'),
                    flat: cloudCfg('flats'), bank: cloudCfg('banks') };
  for (var i = 0; i < 4; i++) for (var name in n) if (i < n[name]) k.push(name);
  return k.length ? k : ['heap'];
}
/* The shapes for the sky (all but the low banks), or for in front of Fuji (the banks, else the flat ones). */
function cloudIdx(front) {
  var idx = [];
  cloudShapes.forEach(function(sh, i) { if (sh && (sh.kind === 'bank') === !!front) idx.push(i); });
  if (!idx.length && front) cloudShapes.forEach(function(sh, i) { if (sh && sh.kind === 'flat') idx.push(i); });
  return idx;
}
/* The weather's cloud values, easing toward the weather now (the colours change at once: they are painted). */
function cloudLerpWeather(a, b, k) {
  var o = {};
  for (var key in b) o[key] = typeof b[key] === 'number' ? lerp(a[key], b[key], k) : b[key];
  return o;
}
/* The time of day's values, blended: day → evening (eK) → night (nK). */
function cloudTime(eK, nK) {
  var T = CLOUD_LOOK.times, o = {};
  for (var key in T.day) {
    if (typeof T.day[key] === 'number') o[key] = lerp(lerp(T.day[key], T.evening[key], eK), T.night[key], nK);
    else o[key] = mixRgb(mixRgb(hexToRgb(T.day[key]), hexToRgb(T.evening[key]), eK), hexToRgb(T.night[key]), nK);
  }
  return o;
}
/* Build the shapes (once, in the background), then paint them in the light now: one a frame. */
function sunPaintClouds(look) {
  if (!cloudsAsked) {
    cloudsAsked = true;
    var o = {}, kinds = cloudKinds(), got = 0, gen = cloudGen;
    CLOUD_SHAPE_KEYS.forEach(function(k) { o[k] = cloudCfg(k); });
    kinds.forEach(function(kind, i) {
      Clouds.build(kind, CLOUD_LOOK.seed * 1000 + 300 + i * 37, o, function(sh) {
        if (gen !== cloudGen) { if (Clouds.free) Clouds.free(sh); return; }   // the theme changed meanwhile
        sh.painted = ''; cloudShapes[i] = sh;
        if (++got === kinds.length) { sunBuildClouds(); frontClouds = []; }
      });
    });
  }
  cloudPaint = look;
  for (var i = 0; i < cloudShapes.length; i++) {
    var sh = cloudShapes[i];
    if (sh && sh.painted !== look.key) { Clouds.paint(sh, look.o); sh.painted = look.key; sh.ready = true; sh.img = null; return; }
  }
}
/* The clouds in the sky: where each one is, its size, speed and shape. */
function sunBuildClouds() {
  var C = CLOUD_LOOK, r = rngFrom(2024 + C.seed), sky = cloudIdx(false), old = sunClouds;
  sunClouds = [];
  if (!sky.length) return;
  for (var i = 0; i < C.count; i++) {
    sunClouds.push({ x: r() * 1.4 - 0.2, near: r() < C.nearSun, yr: r(), s: r(), v: 0.5 + r(),
                     k: sky[i % sky.length], a: old[i] ? old[i].a : 0, want: r() });
  }
}
/* The clouds in front of Fuji: low banks drifting across the mountain's
   flanks, as clouds catch on a high peak. They form and fade at the ends of
   their path, and now and then thin out, so Fuji's outline shows through
   for a while before it is hidden again. Drawn over the mountains, under
   the ground and everything in front of it (drawLandscape). */
function buildFrontClouds() {
  var F = cloudCfg('front'), r = rngFrom(4049 + CLOUD_LOOK.seed), idx = cloudIdx(true);
  frontClouds = [];
  if (!idx.length) return;
  for (var i = 0; i < F.count; i++) {
    frontClouds.push({ u: r() * 2 - 1, yr: r(), s: r(), v: 0.6 + r() * 0.8, k: idx[i % idx.length], ph: r() * 100, a: 0, want: r() });
  }
}
function drawFrontClouds(c, t, dt) {
  if (!cloudW || !cloudShapes.length || (ENV.scene !== 'autumn' && ENV.scene !== 'winter')) return;
  if (!frontClouds.length) buildFrontClouds();
  var win = ENV.scene === 'winter', F = cloudCfg('front'), M = win ? WINT_M : LS.is3d ? MTN3D : LAND, night = 1 - smooth(0.05, 0.5, ENV.light.daylight);
  var hy = H * (win ? WINT.horizon : LAND.horizon), Hf = M.fujiHeight * H, fx = M.fujiX * W, top = hy - Hf, reach = Hf * F.spread;
  var shown = Math.round(cloudW.front * frontClouds.length), wind = (0.6 + 0.4 * clamp(S.windSpeed / 2.5, 0, 2.5)) * cloudW.speed;
  var op = lerp(1, CLOUD_LOOK.times.night.opacity, night);
  c.setTransform(PR, 0, 0, PR, 0, 0);
  for (var i = 0; i < frontClouds.length; i++) {
    var Fc = frontClouds[i], Spr = cloudShapes[Fc.k];
    Fc.u += F.speed * Fc.v * wind * dt * 9 / reach;
    if (Fc.u > 1.15) { Fc.u = -1.15; Fc.yr = Math.random(); }
    // it thins out now and then, then thickens again (slowly, out of step with the others)
    var thin = 1 - F.thinning * smooth(0.45, 0.8, sunWander(t * 0.05 * F.thinEvery, Fc.ph));
    var ends = smooth(1.15, 0.75, Math.abs(Fc.u));                 // forming and fading at the ends
    var want = i < shown ? F.opacity * (0.7 + 0.3 * Fc.want) * op : 0;
    Fc.a += (want - Fc.a) * (1 - Math.exp(-dt / 1.5));
    var al = Fc.a * thin * ends;
    if (!Spr || !Spr.ready || al < 0.005) continue;
    var cw = Hf * 1.3 * F.size * (0.6 + 0.8 * Fc.s) * Spr.size, ch = cw * Spr.h / Spr.w;
    c.globalAlpha = Math.min(1, al);
    c.drawImage(Spr.cnv, fx + Fc.u * reach - cw / 2, top + Hf * lerp(F.high, F.low, Fc.yr) - ch * Spr.base, cw, ch);
  }
  c.globalAlpha = 1;
}

/* Clouds, the veil over the sky, and the sun. Called once a frame, first. */
function drawSun(ctx, t) {
  var dt = sunLastT ? clamp(t - sunLastT, 0, 0.1) : 0.016;
  sunLastT = t;
  var L = SUN_LOOK, a = ENV.astro.sun;
  var wk = sunWeatherKey(), target = SUN_WEATHER[wk];
  sunCur = sunCur ? sunLerpWeather(sunCur, target, 1 - Math.exp(-dt / 0.8)) : sunLerpWeather(target, target, 1);
  var cur = sunCur;
  if (!sunRays.length) sunBuildRays();
  var night = 1 - smooth(0.05, 0.5, ENV.light.daylight);          // 0 by day, 1 in the dark
  var low = 1 - smooth(2, 22, a.alt);                              // 1 as the sun nears the horizon
  var lowK = Math.round(Math.max(low, L.warmth * 0.6) * 12) / 12;

  // the sun's pieces, baked again only when its colour has really changed (and not more than once in a while)
  var bk = String(lowK);
  if (bk !== sunBakedKey && (t - sunBakedAt > 1.5 || !sunBakedKey)) { sunBakedKey = bk; sunBakedAt = t; sunBake(lowK); }
  var P = { x: skyToScreen(a.alt, a.az).x }, R = sunRadius(a.alt);
  P.y = skyBandY(R); var X = P.x, Y = P.y;
  // the clouds: the weather's values ease in; the time of day is blended (in steps, so they are
  // not painted again every frame); the light comes from the sun's side of the sky (flat at night)
  var CL = CLOUD_LOOK, Wt = cloudWeather(wk);
  cloudW = cloudW ? cloudLerpWeather(cloudW, Wt, 1 - Math.exp(-dt / 0.8)) : cloudLerpWeather(Wt, Wt, 1);
  var nK = Math.round(night * 8) / 8, eK = Math.round(low * (1 - night) * 8) / 8;
  var sideK = nK >= 0.5 ? 0 : Math.round(clamp((X - W / 2) / (W / 2), -1, 1) * 4) / 4;
  var ck = wk + '|' + nK + '|' + eK + '|' + sideK;
  if (typeof Clouds !== 'undefined') {
    if (ck !== sunCloudKey && (t - sunCloudAt > 2 || !sunCloudKey)) {
      sunCloudKey = ck; sunCloudAt = t;
      var T = cloudTime(eK, nK), o = {};
      var tinted = function(c, tc) { return mixRgb(hexToRgb(c), tc, T.tint); };
      ['shadow', 'ambient', 'baseDark', 'silver'].forEach(function(k) { o[k] = CL[k]; });
      o.sunSide = sideK; o.sunElevation = T.elevation; o.sunFront = T.front; o.exposure = T.exposure;
      o.colours = { lit: tinted(Wt.lit, T.lit), shade: tinted(Wt.shade, T.shade), base: tinted(Wt.base, T.base),
                    sky: mixRgb(hexToRgb(CL.sky), [40, 50, 90], nK) };
      cloudPaint = { key: ck, o: o };
    }
    if (cloudPaint) sunPaintClouds(cloudPaint);
  }
  ctx.setTransform(PR, 0, 0, PR, 0, 0);
  ctx.globalAlpha = 1;

  // the veil: a sheet of cloud or haze over the sky (none in the dark)
  var va = cur.veil * L.veil * (1 - night);
  if (va > 0.003) {
    var hz = H * 0.9, vg = ctx.createLinearGradient(0, 0, 0, hz);
    vg.addColorStop(0, rgba(cur.veilCol, clamp(va * 0.75, 0, 1))); vg.addColorStop(1, rgba(cur.veilCol, clamp(va * 0.45, 0, 1)));
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, hz);
  }
  // the clouds, and how much of the sun they hide
  var shown = Math.round(cloudW.cover * sunClouds.length), occl = 0;
  var wind = CL.speed * cloudW.speed * (0.6 + 0.4 * clamp(S.windSpeed / 2.5, 0, 2.5));
  var op = lerp(1, CL.times.night.opacity, night);                // faint at night, so the text stays readable
  for (var i = 0; i < sunClouds.length; i++) {
    var Cl = sunClouds[i], Spr = cloudShapes[Cl.k];
    var want = i < shown ? cloudW.opacity * (0.75 + 0.25 * Cl.want) * op : 0;
    Cl.a += (want - Cl.a) * (1 - Math.exp(-dt / 1.2));
    if (!Spr) continue;
    var cw = 300 * (1 + (Cl.s - 0.5) * CL.sizeVariety) * CL.size * cloudW.size * Spr.size, ch = cw * 170 / 360;
    Cl.x += (5 + 9 * Cl.v) * wind * dt / W;
    if (Cl.x * W - cw / 2 > W + 20) Cl.x = (-cw / 2 - 20) / W;
    if (Cl.a < 0.005 || !Spr.ready) continue;
    var cx = Cl.x * W, cy = Cl.near ? Y + (Cl.yr - 0.5) * ch * 1.2 : H * lerp(CL.highest, CL.lowest, Cl.yr);
    var sh2 = cw * Spr.h / Spr.w;
    ctx.globalAlpha = Math.min(1, Cl.a * 1.15);   // solid, so one cloud's base does not show through another
    ctx.drawImage(Spr.cnv, cx - cw / 2, cy + ch * 0.18 - sh2 * Spr.base, cw, sh2);
    var dx = (X - cx) / (cw * 0.4), dy = (Y - cy + ch * 0.1) / (ch * 0.3), d = Math.sqrt(dx * dx + dy * dy);
    occl = 1 - (1 - occl) * (1 - Cl.a * (1 - smooth(0.5, 1, d)));
  }
  ctx.globalAlpha = 1;

  if (!S.sun || a.alt < -1.5) return;
  var vis = L.strength * smooth(-1.5, 1.5, a.alt);
  if (vis < 0.005) return;
  var block = occl * CL.block, clear = vis * cur.rays * (1 - block);
  var c = ctx;
  c.globalCompositeOperation = 'lighter';
  function round(Sp, r, al) { if (al > 0.002) { c.globalAlpha = clamp(al, 0, 1); c.drawImage(Sp.cnv, X - r, Y - r, r * 2, r * 2); } }
  var spin = t * L.turn / 60 * PI / 180, shim = L.shimmer, ss = L.shimmerSpeed;
  function ray(Sp, ang, len, wid, al, root) {
    if (al < 0.003 || len < 1) return;
    var co = Math.cos(ang), si = Math.sin(ang);
    c.setTransform(PR * co, PR * si, -PR * si, PR * co, PR * X, PR * Y);
    c.globalAlpha = clamp(al, 0, 1);
    c.drawImage(Sp.cnv, root, -wid / 2, len, wid);
  }
  var breathe = 1 + shim * 0.06 * (sunWander(t * 0.3 * ss, 1.3) - 0.5);
  round(SUN_SPR.haze, R * L.hazeSize * Math.sqrt(cur.glowSize), L.haze * cur.haze * 0.4 * vis * (1 - block * 0.3));
  var gA = L.glow * cur.glow * vis * (1 - block * 0.55);
  round(SUN_SPR.glow, R * L.glowSize * cur.glowSize * breathe, gA);
  round(SUN_SPR.soft, R * 3.4 * Math.sqrt(cur.glowSize) * breathe, gA * 0.8 * (1 - cur.blur * 0.75));
  for (i = 0; i < sunBeams.length; i++) {
    var Bm = sunBeams[i], fl = 1 - shim * (1 - sunWander(t * Bm.sp * ss, Bm.ph));
    ray(SUN_SPR.beam, Bm.a + spin * 0.5, R * L.streakLength * 0.9 * Bm.len, R * 3.2 * L.beamWidth * Bm.w, L.beamStrength * Bm.b * fl * clear, R * 0.6);
  }
  for (i = 0; i < sunRays.length; i++) {
    var Ry = sunRays[i], f1 = 1 - shim * (1 - sunWander(t * Ry.sp * ss, Ry.ph));
    var rl = R * L.streakLength * Ry.len, rw = R * 0.42 * L.streakWidth * Ry.w * (Ry.long ? 0.6 : 1), ra = L.streakStrength * Ry.b * f1 * clear;
    ray(SUN_SPR.ray, Ry.a + spin, rl * 0.85, rw * 4, ra * 0.3, 0);
    ray(SUN_SPR.ray, Ry.a + spin, rl, rw, ra, 0);
  }
  for (i = 0; i < sunSpikes.length; i++) {
    var Sp = sunSpikes[i], f2 = 1 - shim * (1 - sunWander(t * Sp.sp * ss, Sp.ph));
    ray(SUN_SPR.ray, Sp.a - spin * 0.7, R * L.spikeLength * Sp.len, R * 0.22 * L.streakWidth * Sp.w, L.spikeStrength * Sp.b * f2 * clear, 0);
  }
  c.setTransform(PR, 0, 0, PR, 0, 0);
  var coreA = L.coreBrightness * cur.core * vis;
  round(SUN_SPR.core, R / 0.62, coreA * (1 - cur.blur) * (1 - block));
  round(SUN_SPR.soft, R * 3.2 * (1 + cur.blur * 0.8), coreA * cur.blur * 0.6 * (1 - block * 0.6));
  round(SUN_SPR.ring, R * L.ringSize, L.ring * cur.ring * 0.22 * vis);
  var ga = L.ghosts * cur.ghosts * clear;
  if (ga > 0.003) {
    var mx = W * 0.5, my = H * 0.5;
    [[0.45, 0.7, 0.10], [0.9, 1.6, 0.06], [1.35, 0.9, 0.09], [1.75, 4.2, 0.05]].forEach(function(gh) {
      var gx = X + (mx - X) * gh[0], gy = Y + (my - Y) * gh[0], gr = R * gh[1] * L.ghostSize;
      c.globalAlpha = clamp(ga * gh[2], 0, 1);
      c.drawImage(SUN_SPR.ghost.cnv, gx - gr, gy - gr, gr * 2, gr * 2);
    });
  }
  c.globalAlpha = 1;
  c.globalCompositeOperation = 'source-over';
}

/* The moon at its real place and real phase. The lit side always
   faces the sun, so a crescent, half moon or full moon looks right. */
/* Night window for the moon: 20:00–05:00. Returns 0..1 through the
   night, or -1 outside it. */
function moonNightU() {
  var h = S.hour;
  if (h >= 20) return (h - 20) / 9;
  if (h < 5) return (h + 4) / 9;
  return -1;
}
/* Where the moon is drawn, and how visible it is.
   'arc'  — one smooth glide every night, east (right) at 20:00 to west
            (left) at 05:00, like the sun. Phase is real, position is not.
   'real' — its real place in the sky; it fades out as it sinks to the
            horizon and is not shown while it is really below it. */
function moonPlacement(r) {
  var m = ENV.astro.moon, cx, fade;
  if (sunIsUp()) return null;                 // never together with the sun
  if (S.moonPath === 'real') {
    fade = smooth(-0.8, 2.5, m.alt);
    cx = skyToScreen(m.alt, m.az).x;
  } else {
    var u = moonNightU();
    if (u < 0) return null;
    fade = smooth(0, 0.03, u) * (1 - smooth(0.97, 1, u));
    cx = W * lerp(0.85, 0.15, u);
  }
  if (fade < 0.02) return null;
  return { x: cx, y: skyBandY(r), fade: fade };
}
function moonNote() {
  if (sunIsUp()) return ' (hidden while the sun is shown)';
  if (S.moonPath === 'real') return ENV.astro.moon.alt > 0 ? '' : ' (below the horizon, so not shown in real-sky mode)';
  return moonNightU() < 0 ? ' (moon is shown 20:00–05:00)' : '';
}
function drawMoon(ctx, t) {
  if (!S.moon) return;
  var A = ENV.astro;
  var r = 28 * S.moonSize;
  var P = moonPlacement(r);
  if (!P) return;
  var day = ENV.light.daylight;
  var vis = P.fade * lerp(1, 0.55, day) * clamp(1 - S.cloudCover / 100 * 0.7, 0.2, 1) *
            (ENV.rainy ? 0.4 : 1) * (1 - ENV.fog * 0.6);
  if (vis < 0.02) return;
  var cx = P.x, cy = P.y;
  // The lit side faces the sun. The sun is below the horizon at night, so
  // this is worked out from the phase alone: a waxing moon is lit toward
  // the west (left), a waning one toward the east (right), tilted down.
  // It changes smoothly with the phase, so the moon never flips.
  var toSun = Math.atan2(1, -Math.sin(A.elong * DEG) * 2.5);
  var litCol = mixRgb([255, 246, 226], [236, 240, 250], day);
  var glowA = 0.32 * vis * (1 - day * 0.7) * A.illum;
  if (glowA > 0.005) {
    var glow = ctx.createRadialGradient(cx, cy, r * 0.8, cx, cy, r * 4.5);
    glow.addColorStop(0, rgba([255, 240, 215], glowA));
    glow.addColorStop(1, rgba([255, 240, 215], 0));
    ctx.fillStyle = glow;
    ctx.fillRect(cx - r * 4.5, cy - r * 4.5, r * 9, r * 9);
  }
  var k = Math.cos(A.elong * DEG);
  function litPath() {
    ctx.beginPath();
    ctx.arc(0, 0, r, -PI / 2, PI / 2, false);
    ctx.ellipse(0, 0, r * Math.abs(k), r, 0, PI / 2, -PI / 2, k > 0);
    ctx.closePath();
  }
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(toSun);
  if (A.illum > 0.015) {
    litPath();
    ctx.fillStyle = rgba(litCol, 0.92 * vis);
    ctx.fill();
    // grey "seas" on the lit part, fixed to the moon's face
    ctx.save();
    ctx.clip();
    ctx.rotate(-toSun);
    ctx.fillStyle = rgba(day > 0.5 ? [160, 165, 190] : [200, 185, 160], 0.3 * vis);
    [[-0.25, -0.3, 0.28], [0.2, -0.15, 0.22], [0.05, 0.3, 0.2], [-0.35, 0.15, 0.16], [0.4, 0.25, 0.12]].forEach(function(mr) {
      ctx.beginPath(); ctx.arc(mr[0] * r, mr[1] * r, mr[2] * r, 0, TAU); ctx.fill();
    });
    ctx.restore();
  }
  ctx.restore();
}

function drawCloudShadows(ctx, dt) {
  var a = 0.07 * S.cloudShadows * (S.cloudCover / 100) * (0.3 + 0.7 * ENV.light.daylight);
  var drift = (ENV.windPx * 0.25 + 8) * dt;
  for (var i = 0; i < cloudShadowsPos.length; i++) {
    var c = cloudShadowsPos[i];
    c.x += drift / W;
    if (c.x > 1.3) c.x -= 2.2;
    if (c.x < -0.9) c.x += 2.2;
  }
  if (a < 0.003) return;
  ctx.globalAlpha = a / 0.55;
  for (var j = 0; j < cloudShadowsPos.length; j++) {
    var p = cloudShadowsPos[j];
    ctx.drawImage(cloudSprite, p.x * W - W * 0.45, p.y * H, W * 0.9, H * 0.55);
  }
  ctx.globalAlpha = 1;
}

function drawRays(ctx, t) {
  var amt = ENV.sunAmt * S.lightRays;
  if (amt < 0.01) return;
  var sun = ENV.sun, h = S.hour;
  var u = clamp((h - sun.rise) / (sun.set - sun.rise), 0, 1);
  var golden = ENV.light.phase === 'golden' || ENV.light.phase === 'dawn' ? 1.6 : 1;
  var ox = lerp(-0.15, 1.15, u) * W, oy = -0.25 * H;
  if (S.sun && ENV.astro.sun.alt > 0) {
    ox = skyToScreen(ENV.astro.sun.alt, ENV.astro.sun.az).x;
    oy = skyBandY(sunRadius(ENV.astro.sun.alt));
  }
  var ang0 = Math.atan2(H * 0.9 - oy, W * 0.5 - ox);
  var len = Math.sqrt(W * W + H * H) * 1.4;
  var col = mixRgb(ENV.light.col, [255, 214, 150], 0.5);
  for (var i = 0; i < 5; i++) {
    var a = ang0 + (i - 2) * 0.12 + 0.05 * Math.sin(t * 0.07 + i * 1.7);
    var w = 0.035 + 0.03 * noise1(t * 0.05 + i * 3.1);
    var alpha = 0.06 * amt * golden * (0.6 + 0.4 * Math.sin(t * 0.3 + i));
    var ex = ox + Math.cos(a) * len, ey = oy + Math.sin(a) * len;
    var g = ctx.createLinearGradient(ox, oy, ex, ey);
    g.addColorStop(0, rgba(col, alpha * 0.2));
    g.addColorStop(0.35, rgba(col, alpha));
    g.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(ox + Math.cos(a - w) * len, oy + Math.sin(a - w) * len);
    ctx.lineTo(ox + Math.cos(a + w) * len, oy + Math.sin(a + w) * len);
    ctx.closePath();
    ctx.fill();
  }
}

function drawFog(ctx, dt) {
  var f = ENV.fog * S.fogHaze;
  for (var i = 0; i < fogBands.length; i++) {
    var b = fogBands[i];
    b.x += (ENV.windPx * 0.15 + 6 * b.s) * dt / W;
    if (b.x > 1.2) b.x -= 2.4;
    if (b.x < -1.2) b.x += 2.4;
  }
  if (f < 0.01) return;
  ctx.fillStyle = 'rgba(250,247,243,' + (f * 0.25).toFixed(3) + ')';
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = clamp(f * 0.9, 0, 1);
  for (var j = 0; j < fogBands.length; j++) {
    var p = fogBands[j];
    var bw = W * 1.6 * p.s, bh = H * 0.6 * p.s;
    ctx.drawImage(fogSprite, p.x * W - bw * 0.3, p.y * H - bh / 2, bw, bh);
    ctx.drawImage(fogSprite, p.x * W - bw * 0.3 - bw, p.y * H - bh / 2, bw, bh);
  }
  ctx.globalAlpha = 1;
}

/* Birds: small dark swallow-like birds wheel in loose flocks across the
   autumn sky, from sunrise to 17:00 (not in rain or snow, never in winter),
   as tuned on bamboo.html. They are only silhouettes: near-black, with
   swept-back pointed wings, a short body and a forked tail, but each bird
   is posed in 3D every frame (turned, leaning into its turns, wings
   anywhere in the beat) and seen a little from below, so its outline keeps
   changing (a "T", a "V", an "r", a thin line) as it beats and glides.
   - They beat their wings fast in short bursts, then glide with the wings
     swept back, each bird on its own timing.
   - A flock follows one leader that sweeps across the sky and wheels round
     in big flat loops. Every bird follows the same path a moment later, a
     little off to one side, so the flock strings out and bunches up; now
     and then one darts off and catches up.
   - A bird keeps well above the ground line: it climbs away from it long
     before it gets low and can never go below a hard limit.
   - The near birds skirt round the message text: they never aim for the
     sky behind the words, and a bird about to fly over them swerves over,
     under or round the side, whichever is nearest. The box round the words
     is read from the page, so a short message leaves more open sky than a
     long one, and it moves with a panel as it slides.
   - Now and then a near flock flies down and perches along the top of the
     front torii gate, the birds coming in one after another, each to its
     own spot, braking with their wings up. While they sit, each bird does
     things of its own now and then (PERCH_ACTS): looks back over its
     shoulder or up at the sky, preens under a wing or its breast, stretches
     one wing or both, beats its wings, fluffs up and shakes, sidles along
     the beam, hops, turns round, flicks its tail. Then they take off, all
     at once or one by one, and the flock flies on. On the gate they are at
     the gate's depth: behind the far tree and the near grove and tree.
   - Three depths (FLOCK_TIERS): the near flocks are bigger and cross the
     screen faster, the far ones tiny, paler and low over the mountains. Each
     depth sits among the groves and trees (BIRD_HIDE): the far one behind
     everything, the middle one in front of the far tree but behind the near
     grove, the near one in front of the near grove but behind the big tree.
     drawKoyoTrees hides each fully behind whatever is in front of it
     (birdLayer).
   Everything is in metres and seconds. BIRD holds the values approved on
   bamboo.html. While birds are on the screen a random piece of
   Chirping2.mp3 plays (see "Birds chirping"). */
var BIRD = {
  flocks: 2, flockMin: 4, flockMax: 7, stay: 30, pause: 2.5,   // flocks in the sky at once, birds in a flock, seconds in view, seconds before the next flock
  nearW: 0.4, midW: 0.3, farW: 0.3,                            // how often a flock is near, middle or far
  size: 14, speed: 2.4, turn: 1.4, loops: 0.55, swoop: 0.5,    // a near bird's body length (px), flying speed, how sharply the leader wheels, how often it loops, rises and dips
  spread: 2.6, trail: 0.2, wander: 0.6, dart: 0.5, bank: 1.25, // how loosely the flock holds together (m), how far each bird lags on the path (s), drift, darting off, leaning into turns
  flapHz: 8, flapAmp: 40, beatsMin: 2, beatsMax: 7,            // wingbeats a second, how far the wings swing (degrees), beats in a burst
  glideMin: 0.25, glideMax: 1.1, wingLen: 1.05, sweep: 0.4, tail: 0.5,   // seconds of gliding between bursts, wing length, wingtips swept back, forked tail (body lengths)
  colour: '#1E1D22', haze: 0.5, view: 43,                      // the far birds' paleness, how far we look up at them (degrees)
  floorSoft: 0.16, floorHard: 0.1,                             // how far above the ground line (fraction of the screen height) they start to climb away, and the lowest they can go
  textPad: 22, textLook: 0.7,                                  // the near birds skirt the message text: how far clear of the words they keep (px), and how far ahead they look (s)
  // perching on the front torii gate (near flocks only): the chance a second that a flock goes down to it, how long
  // it must have flown first and between visits (s), how long it stays (s), the seconds over which the birds come
  // in, a perched bird's body length (× the gate's height on the screen), and the pause between one bird's actions (s)
  perch: 0.07, perchAfter: 8, perchAgain: 30, perchStay: [20, 45], perchArrive: 2.5, perchSize: 0.08, perchIdle: [1, 4.5]
};
/* What a perched bird does now and then, and how often (weights) and how long (s). */
var PERCH_ACTS = {
  look:        { w: 3,   dur: [0.8, 2] },     // turns its head to look back over its shoulder
  glance:      { w: 1.5, dur: [0.4, 0.8] },   // a quick look up at the sky
  preen:       { w: 3,   dur: [2, 5] },       // cleans itself: under the wing and along the back, or the breast
  stretchOne:  { w: 1.2, dur: [1.2, 1.8] },   // stretches one wing out, down and back
  stretchBoth: { w: 0.8, dur: [0.9, 1.3] },   // raises both wings high over its back
  flap:        { w: 1.2, dur: [0.6, 1.4] },   // beats its wings without letting go
  fluff:       { w: 1,   dur: [0.8, 1.1] },   // puffs up its feathers and shakes them down
  shuffle:     { w: 1,   dur: [0.6, 1] },     // sidles a step along the beam
  hop:         { w: 0.5, dur: [0.8, 1.1] },   // flutters up and lands again, sometimes facing the other way
  turn:        { w: 1,   dur: [0.3, 0.4] },   // turns round to face the other way
  wag:         { w: 1,   dur: [0.5, 0.8] }    // flicks its tail
};
var BIRD_HIDE = [['nt'], ['ng', 'nt'], ['fg', 'ft', 'ng', 'nt'], ['ft', 'ng', 'nt']];   // what is in front of each depth: near, middle, far, and on the gate (as the gates)
var BODY_M = 0.17;                                    // a swallow's body length (m)
// depth tiers: size on screen (× BIRD.size), how far away (m, for the gentle perspective
// within a flock), how pale, the screen band its leader keeps to (fractions of the height)
var FLOCK_TIERS = [
  { k: 1,    dist: 22, haze: 0,    top: 0.07, bot: 0.5 },    // near
  { k: 0.62, dist: 36, haze: 0.45, top: 0.1,  bot: 0.58 },   // middle
  { k: 0.36, dist: 62, haze: 1,    top: 0.3,  bot: 0.7 }     // far: low, over the mountains
];
var flocks = [], flockNext = 0;
var BIRD_UP = [0, 1, 0];

// small vector helpers for the birds (x right, y up, z away)
function bVAdd(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
function bVSub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function bVMul(a, k) { return [a[0] * k, a[1] * k, a[2] * k]; }
function bVDot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function bVCross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
function bVNorm(a) { var l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }
function bWrap(a) { while (a > PI) a -= TAU; while (a < -PI) a += TAU; return a; }
function bCam() { var e = BIRD.view * PI / 180; return { c: Math.cos(e), s: Math.sin(e) }; }
function pxPerM(F) { return BIRD.size * FLOCK_TIERS[F.tier].k / BODY_M; }
/* World (X right, Y up, Z away, metres from the flock's middle) onto the screen. */
function bScreen(F, p, cam) {
  // a bird can come no nearer than a third of the flock's distance, so the perspective never breaks down
  var m = pxPerM(F) * F.dist / Math.max(F.dist * 0.35, F.dist + p[2] * cam.c + (p[1] - F.y0) * cam.s);
  return [W / 2 + p[0] * m, H * LAND.horizon - (p[1] * cam.c - p[2] * cam.s) * m, m];
}
/* A goal for the leader: a random place in its band of sky. */
/* The message text: the box round the words of each message panel on the
   screen, padded by BIRD.textPad (CSS px, as the birds'). Read from the page
   about four times a second. */
var birdText = [], birdTextT = -1, birdTextRange = document.createRange();
function birdTextBoxes(t) {
  if (t >= birdTextT && t - birdTextT < 0.25) return birdText;
  birdTextT = t; birdText = [];
  var cs = document.querySelectorAll('#track .panel-content'), pad = BIRD.textPad;
  for (var i = 0; i < cs.length; i++) {
    // the words themselves (each piece of text), not the full-width paragraphs round them
    var l = Infinity, tp = Infinity, rr = -Infinity, bt = -Infinity, n;
    var walk = document.createTreeWalker(cs[i], NodeFilter.SHOW_TEXT, null);
    while ((n = walk.nextNode())) {
      if (!/\S/.test(n.nodeValue)) continue;
      birdTextRange.selectNodeContents(n);
      var r = birdTextRange.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      l = Math.min(l, r.left); tp = Math.min(tp, r.top); rr = Math.max(rr, r.right); bt = Math.max(bt, r.bottom);
    }
    if (l === Infinity || rr < 0 || l > W || bt < 0 || tp > H) continue;   // hidden, or a panel off the screen
    birdText.push({ l: l - pad, r: rr + pad, t: tp - pad, b: bt + pad });
  }
  return birdText;
}
function inBirdText(x, y, extra) {
  for (var i = 0; i < birdText.length; i++) {
    var b = birdText[i];
    if (x > b.l - extra && x < b.r + extra && y > b.t - extra && y < b.b + extra) return b;
  }
  return null;
}
/* For a near bird at p flying at v: if now or `look` seconds ahead it is over
   the text, the way out — the nearest edge of the box from where it is
   heading — as a screen direction (ux, uy), and how far in that point is (px). */
function textEscape(F, p, v, cam) {
  if (F.tier !== 0 || !birdText.length) return null;
  var L = BIRD.textLook, q = [p[0] + v[0] * L, p[1] + v[1] * L, p[2] + v[2] * L];
  var a = bScreen(F, p, cam), s = bScreen(F, q, cam), b = inBirdText(s[0], s[1], 0);
  if (!b) { b = inBirdText(a[0], a[1], 0); s = a; }
  if (!b) return null;
  var d = [s[1] - b.t, b.b - s[1], s[0] - b.l, b.r - s[0]], k = 0;     // to the top, bottom, left and right edges
  for (var i = 1; i < 4; i++) if (d[i] < d[k]) k = i;
  return { ux: k === 2 ? -1 : (k === 3 ? 1 : 0), uy: k === 0 ? -1 : (k === 1 ? 1 : 0), depth: d[k], m: a[2] };
}
function newGoal(F, cam, middle) {
  var T = FLOCK_TIERS[F.tier], m = pxPerM(F), mx = middle ? 0.3 : 0.12;
  var gx = W * rnd(mx, 1 - mx), gy = H * rnd(T.top, T.bot), gz = rnd(-5, 5);
  // a near flock never aims for the sky behind the words
  for (var n = 0; n < 12 && F.tier === 0 && inBirdText(gx, gy, 40); n++) { gx = W * rnd(mx, 1 - mx); gy = H * rnd(T.top, T.bot); }
  F.goal = [(gx - W / 2) / m, ((H * LAND.horizon - gy) / m + gz * cam.s) / cam.c, gz];
  F.goalT = rnd(3, 7);
}
function pickTier() {
  var w = [BIRD.nearW, BIRD.midW, BIRD.farW], used = flocks.map(function (f) { return f.tier; });
  // a depth no flock is at yet, if there is one
  var free = w.map(function (x, i) { return used.indexOf(i) < 0 ? x : x * 0.15; });
  var sum = free[0] + free[1] + free[2];
  if (sum <= 0) return 0;
  var r = Math.random() * sum;
  for (var i = 0; i < 3; i++) { r -= free[i]; if (r <= 0) return i; }
  return 2;
}
function sendFlock(t) {
  var cam = bCam(), tier = pickTier(), T = FLOCK_TIERS[tier];
  var F = { tier: tier, dist: T.dist, born: t, life: BIRD.stay * rnd(0.7, 1.3), leaving: false, birds: [], hist: [], loopT: 0, loopDir: 1, w: 0, vy: 0 };
  var m = pxPerM(F), side = Math.random() < 0.5 ? -1 : 1;
  var sy = H * rnd(T.top + 0.05, T.bot - 0.05);
  F.y0 = (H * LAND.horizon - sy) / m / cam.c;
  // the leader comes in from off one side, heading inward and a little up or down
  F.p = [side * (W / 2 + 60) / m, F.y0, rnd(-4, 4)];
  F.yaw = (side < 0 ? 0 : PI) + rnd(-0.35, 0.35);
  F.v = BIRD.speed;
  newGoal(F, cam);
  // its path so far, straight in from further out, so the birds behind it have somewhere to be
  for (var k = 60; k >= 1; k--) {
    var back = k / 20;
    F.hist.push({ t: t - back, p: [F.p[0] - Math.cos(F.yaw) * F.v * back, F.p[1], F.p[2] - Math.sin(F.yaw) * F.v * back],
                  v: [Math.cos(F.yaw) * F.v, 0, Math.sin(F.yaw) * F.v] });
  }
  var n = Math.round(rnd(Math.min(BIRD.flockMin, BIRD.flockMax), Math.max(BIRD.flockMin, BIRD.flockMax)));
  var order = [];
  for (var i = 0; i < n; i++) order.push(i);
  order.sort(function () { return Math.random() - 0.5; });
  for (var j = 0; j < n; j++) {
    var B = {
      lag: order[j] * BIRD.trail * rnd(0.6, 1.4) + rnd(0, 0.15),
      off: [rnd(-1, 1) * BIRD.spread, rnd(-0.6, 0.6) * BIRD.spread, rnd(-1, 1) * BIRD.spread],
      wph: [rnd(0, TAU), rnd(0, TAU), rnd(0, TAU)], wf: rnd(0.25, 0.6),
      dartV: [0, 0, 0], acc: [0, 0, 0],
      hz: BIRD.flapHz * rnd(0.85, 1.15), ph: rnd(0, TAU), beats: Math.round(rnd(BIRD.beatsMin, BIRD.beatsMax)), glide: 0,
      wing: 0, ext: 1, sw: 0, roll: 0
    };
    var tg = flockTarget(F, B, t);
    B.p = tg.p.slice(); B.v = tg.v.slice();
    F.birds.push(B);
  }
  flocks.push(F);
}
/* Where the leader was lag seconds ago. */
function histAt(F, tt) {
  var h = F.hist, i = h.length - 1;
  while (i > 0 && h[i].t > tt) i--;
  var a = h[i], b = h[Math.min(i + 1, h.length - 1)];
  var u = b.t > a.t ? clamp((tt - a.t) / (b.t - a.t), 0, 1) : 0;
  return { p: [lerp(a.p[0], b.p[0], u), lerp(a.p[1], b.p[1], u), lerp(a.p[2], b.p[2], u)],
           v: [lerp(a.v[0], b.v[0], u), lerp(a.v[1], b.v[1], u), lerp(a.v[2], b.v[2], u)] };
}
/* Where one bird wants to be: on the leader's path a moment back, off to its own side. */
function flockTarget(F, B, t) {
  var h = histAt(F, t - B.lag), wa = BIRD.wander * BIRD.spread * 0.6;
  for (var a = 0; a < 3; a++) h.p[a] += B.off[a] + Math.sin(t * B.wf * (1 + a * 0.3) + B.wph[a]) * wa * (a === 1 ? 0.6 : 1);
  return h;
}
function updateLeader(F, t, dt, cam) {
  var s = bScreen(F, F.p, cam), T = FLOCK_TIERS[F.tier];
  var out = s[0] < W * 0.06 || s[0] > W * 0.94 || s[1] < H * (T.top - 0.05) || s[1] > H * (T.bot + 0.08);
  if (!F.leaving && !F.perch && t - F.born > F.life) {
    F.leaving = true;
    var side = s[0] < W / 2 ? -1 : 1, m = pxPerM(F);
    F.goal = [side * (W / 2 + 400) / m, F.p[1] + rnd(0, 4), F.p[2]];
    F.loopT = 0;
  }
  if (!F.leaving) {
    F.goalT -= dt;
    var dx = F.goal[0] - F.p[0], dz = F.goal[2] - F.p[2];
    if (F.goalT <= 0 || dx * dx + dz * dz < 4) newGoal(F, cam);
    else if (out && !F.wasOut) newGoal(F, cam, true);   // drifting off the screen: back toward the middle
    // now and then it wheels right round (not when near the edges)
    if (F.loopT <= 0 && !out && Math.random() < dt * BIRD.loops * 0.35) {
      F.loopT = rnd(0.6, 1.25) * TAU / Math.max(0.2, BIRD.turn);
      F.loopDir = Math.random() < 0.5 ? -1 : 1;
    }
  }
  // about to fly over the message text: round the side, or over or under it
  var esc = textEscape(F, F.p, [Math.cos(F.yaw) * F.v, F.vy, Math.sin(F.yaw) * F.v], cam);
  if (esc) F.loopT = 0;
  var wantW;
  if (esc && esc.ux) wantW = clamp(bWrap((esc.ux < 0 ? PI : 0) - F.yaw) * 3, -BIRD.turn * 1.5, BIRD.turn * 1.5);
  else if (F.loopT > 0 && !out && !F.leaving) { F.loopT -= dt; wantW = F.loopDir * BIRD.turn; }
  else {
    F.loopT = 0;
    var gy = Math.atan2(F.goal[2] - F.p[2], F.goal[0] - F.p[0]);
    wantW = clamp(bWrap(gy - F.yaw) * 1.6, -BIRD.turn, BIRD.turn);
  }
  F.w += (wantW - F.w) * Math.min(1, dt * 1.8);
  F.yaw = bWrap(F.yaw + F.w * dt);
  // speed: a little faster when diving, slower when climbing
  F.v += (BIRD.speed * (1 - F.vy * 0.04) - F.v) * Math.min(1, dt);
  // up and down: toward the goal's height, with swoops
  var wantVy = clamp((F.goal[1] - F.p[1]) * (out ? 1 : 0.5), -3, 3) + (out ? 0 : 1) * BIRD.swoop * 3.2 * Math.sin(t * 0.7 + F.born) * Math.sin(t * 0.31 + F.born * 2);
  if (esc && esc.uy) wantVy = -esc.uy * 3.5;                    // screen up is world up
  F.vy += (wantVy - F.vy) * Math.min(1, dt * (esc ? 3 : 1.5));
  var vel = [Math.cos(F.yaw) * F.v, F.vy, Math.sin(F.yaw) * F.v];
  for (var a = 0; a < 3; a++) F.p[a] += vel[a] * dt;
  F.wasOut = out;
  F.hist.push({ t: t, p: F.p.slice(), v: vel });
  while (F.hist.length > 2 && F.hist[1].t < t - 8) F.hist.shift();
}
function updateBird(F, B, t, dt) {
  if (B.mode && B.mode !== 'fly') { perchBird(F, B, t, dt); return; }
  if (F.perch && F.perch.state === 'landing' && t > B.landAt) { startLanding(F, B, t, bCam()); return; }
  var tg = flockTarget(F, B, t);
  // follows its place: pulled toward it, matching its speed (and any dart dies away)
  for (var a = 0; a < 3; a++) {
    var acc = (tg.p[a] - B.p[a]) * 3.2 + (tg.v[a] + B.dartV[a] - B.v[a]) * 2.6;
    B.acc[a] = clamp(acc, -30, 30);
  }
  // a near bird heading over the message text swerves away to the nearest edge, harder the further in
  var esc = textEscape(F, B.p, B.v, bCam());
  if (esc) {
    var push = 12 + Math.min(30, esc.depth / esc.m * 25), cc = bCam().c;
    B.acc[0] += esc.ux * push;
    B.acc[1] -= esc.uy * push / cc;
    if (esc.ux * B.dartV[0] < 0) B.dartV[0] = 0;                    // and no dart carries it in
    if (-esc.uy * B.dartV[1] < 0) B.dartV[1] = 0;
  }
  for (var c = 0; c < 3; c++) { B.v[c] += B.acc[c] * dt; B.p[c] += B.v[c] * dt; B.dartV[c] *= Math.max(0, 1 - dt * 1.4); }
  // the ground: it pulls itself up well before it gets low, and can never go below the hard limit
  var cam = bCam(), sc = bScreen(F, B.p, cam), soft = H * (LAND.horizon - BIRD.floorSoft), hard = H * (LAND.horizon - BIRD.floorHard);
  if (sc[1] > soft) {
    var depth = (sc[1] - soft) / sc[2];                              // metres into the soft zone
    B.v[1] += depth * 14 * dt + 6 * dt;                              // a firm lift, stronger the lower it is
    if (B.dartV[1] < 0) B.dartV[1] = 0;
    if (B.v[1] < 0) B.v[1] *= Math.max(0, 1 - dt * 5);               // a dive is checked
    if (sc[1] > hard) {                                              // nudged back up until it is above the limit (the perspective shifts as it rises)
      for (var it = 0; it < 6 && sc[1] > hard; it++) { B.p[1] += (sc[1] - hard) / sc[2] / cam.c + 0.02; sc = bScreen(F, B.p, cam); }
      B.v[1] = Math.max(B.v[1], 0.5);
    }
  }
  // now and then it darts off to one side, up or down, and comes back
  if (Math.random() < dt * BIRD.dart * 0.12) {
    var ang = rnd(0, TAU), sp = rnd(3, 6);
    B.dartV = [Math.cos(ang) * sp, rnd(-1, 1) * sp * 0.7, Math.sin(ang) * sp];
    if (bScreen(F, B.p, bCam())[1] > H * (LAND.horizon - BIRD.floorSoft - 0.1)) B.dartV[1] = Math.abs(B.dartV[1]);   // not downward when already low
    B.beats = Math.max(B.beats, 3); B.glide = 0;                  // and beats hard to do it
  }
  // leans into its turns: the sideways pull against gravity
  var f = bVNorm(B.v), r = bVNorm(bVCross(BIRD_UP, f));
  var want = -Math.atan(bVDot(B.acc, r) / 9.8) * BIRD.bank;
  B.roll += (clamp(want, -1.3, 1.3) - B.roll) * Math.min(1, dt * 6);
  // wings: a burst of beats, then a glide
  var far = Math.hypot(tg.p[0] - B.p[0], tg.p[1] - B.p[1], tg.p[2] - B.p[2]);
  if (B.glide > 0) {
    B.glide -= dt;
    if (B.v[1] > 1.2 || far > BIRD.spread * 1.6) B.glide = 0;    // climbing or falling behind: back to beating
    if (B.glide <= 0) { B.beats = Math.round(rnd(BIRD.beatsMin, BIRD.beatsMax)); B.ph = -PI / 2; }
    B.wing += (-0.06 - B.wing) * Math.min(1, dt * 10);           // held level, a touch down
    B.ext += (1 - B.ext) * Math.min(1, dt * 8);
    B.sw += (1 - B.sw) * Math.min(1, dt * 6);                    // swept back
  } else {
    var before = B.ph;
    B.ph += TAU * B.hz * dt;
    if (Math.floor((B.ph + PI / 2) / TAU) > Math.floor((before + PI / 2) / TAU) && --B.beats <= 0) {
      B.glide = rnd(Math.min(BIRD.glideMin, BIRD.glideMax), Math.max(BIRD.glideMin, BIRD.glideMax));
    }
    var amp = BIRD.flapAmp * PI / 180;
    B.wing = Math.sin(B.ph) * amp;
    B.ext = 0.78 + 0.22 * Math.cos(B.ph - PI / 2 + 0.6);        // spread wide on the downstroke, drawn in on the way up
    B.sw += (0.35 - B.sw) * Math.min(1, dt * 8);
  }
}
function updateBirds(dt, t) {
  if (dt <= 0) return;
  var h = S.hour, sky = !ENV.rainy && !ENV.snowing && S.condition !== 'thunderstorm';
  var birdTime = S.birds && ENV.scene === 'autumn' && sky && h >= ENV.sun.rise && h < 17;
  // the landscape and trees fully drawn and the scene faded in
  var ready = LS.ready && !LS.step && LS.floorBuilt && !dynSetupLeft && dynMaster > 0.9;
  var cam = bCam(), target = birdTime ? BIRD.flocks : 0;
  birdNow = t;
  if (flocks.length) birdTextBoxes(t);
  var live = 0, q;
  for (q = 0; q < flocks.length; q++) if (!flocks[q].leaving) live++;
  if (birdTime && ready) {
    if (!flockNext) flockNext = t + rnd(0.5, 2);     // the first flock is in view within a few seconds
    else if (live < target && t > flockNext) { sendFlock(t); flockNext = t + BIRD.pause * rnd(0.6, 1.4); live++; }
  }
  // the weather turns or the day ends: the flocks fly off. None in winter, and none left over when the clock is moved outside the hours.
  for (q = 0; q < flocks.length && live > target; q++) if (!flocks[q].leaving) { flocks[q].life = 0; flocks[q].dismissed = true; live--; }
  if (!S.birds || ENV.scene !== 'autumn' || h < ENV.sun.rise - 0.1 || h > 17.5) flocks.length = 0;
  var birdsOn = false;                               // a bird is on the screen: the chirping plays (chirpBirds)
  for (var i = flocks.length - 1; i >= 0; i--) {
    var F = flocks[i];
    perchFlock(F, t, dt, cam);
    if (!F.perch || F.perch.state !== 'perched') updateLeader(F, t, dt, cam);   // the leader waits while they all sit
    var anyIn = false;
    for (var j = 0; j < F.birds.length; j++) {
      updateBird(F, F.birds[j], t, dt);
      var s = birdXY(F, F.birds[j], cam);
      if (s[0] > -80 && s[0] < W + 80 && s[1] > -80) anyIn = true;
      if (s[0] > 0 && s[0] < W && s[1] > 0 && s[1] < H) birdsOn = true;
    }
    if (F.leaving && !anyIn) { flocks.splice(i, 1); flockNext = Math.max(flockNext, t + BIRD.pause * rnd(0.6, 1.4)); }
  }
  chirpBirds(birdsOn, t);
}

/* One bird, posed in 3D and drawn flat as a dark silhouette. */
function drawBird(c, F, B, cam, col) {
  var s = bScreen(F, B.p, cam);
  if (s[0] < -60 || s[0] > W + 60 || s[1] < -60 || s[1] > H) return;
  drawBirdShape(c, s[0], s[1], s[2] * BODY_M, B.v, B, cam, col);
}
/* The flying shape at (ox, oy), m px per body length, flying along v (world). */
function drawBirdShape(c, ox, oy, m, v, B, cam, col) {
  var f = bVNorm(v), u0 = bVNorm(bVSub(BIRD_UP, bVMul(f, bVDot(BIRD_UP, f))));
  var r0 = bVCross(u0, f), cr = Math.cos(B.roll), sr = Math.sin(B.roll);
  var r = bVAdd(bVMul(r0, cr), bVMul(u0, sr)), u = bVSub(bVMul(u0, cr), bVMul(r0, sr));
  function P(w) { return [ox + w[0] * m, oy - (w[1] * cam.c - w[2] * cam.s) * m]; }
  c.fillStyle = col; c.strokeStyle = col;
  // the wings
  var sweep = BIRD.sweep * (0.75 + 0.6 * B.sw), L = BIRD.wingLen * B.ext;
  for (var side = -1; side <= 1; side += 2) {
    var ca = Math.cos(B.wing), sa = Math.sin(B.wing);
    var dir = bVAdd(bVMul(r, side * ca), bVMul(u, sa));
    var rf = P(bVAdd(bVMul(f, 0.2), bVMul(dir, 0.03)));
    var rb = P(bVAdd(bVMul(f, -0.14), bVMul(dir, 0.03)));
    var wr = P(bVAdd(bVMul(dir, 0.42 * L), bVMul(f, 0.13)));
    var tip = P(bVAdd(bVMul(dir, L), bVMul(f, -sweep)));
    var t1 = P(bVAdd(bVMul(dir, 0.62 * L), bVMul(f, -sweep * 0.4)));
    var t2 = P(bVAdd(bVMul(dir, 0.2 * L), bVMul(f, -0.2)));
    c.beginPath();
    c.moveTo(rf[0], rf[1]);
    c.quadraticCurveTo(wr[0], wr[1], tip[0], tip[1]);               // leading edge, bowed forward at the wrist
    c.bezierCurveTo(t1[0], t1[1], t2[0], t2[1], rb[0], rb[1]);      // trailing edge: narrow at the tip, broad by the body
    c.closePath(); c.fill();
  }
  // the body: a tapered spindle, from the head to the base of the tail
  var hd = P(bVMul(f, 0.5)), mid = P(bVMul(f, 0.12)), tb = P(bVMul(f, -0.32));
  var dx = hd[0] - tb[0], dy = hd[1] - tb[1], dl = Math.hypot(dx, dy) || 1, nx = -dy / dl, ny = dx / dl;
  var bw = Math.max(0.6, 0.1 * m);
  c.beginPath();
  c.moveTo(hd[0], hd[1]);
  c.quadraticCurveTo(mid[0] + nx * bw * 1.6, mid[1] + ny * bw * 1.6, tb[0] + nx * bw * 0.4, tb[1] + ny * bw * 0.4);
  c.lineTo(tb[0] - nx * bw * 0.4, tb[1] - ny * bw * 0.4);
  c.quadraticCurveTo(mid[0] - nx * bw * 1.6, mid[1] - ny * bw * 1.6, hd[0], hd[1]);
  c.fill();
  c.beginPath(); c.arc(mid[0], mid[1], bw, 0, TAU); c.fill();
  // the forked tail, in the plane of the wings: broad where it starts, two thin points
  if (BIRD.tail > 0) {
    var tl = BIRD.tail, fl = P(bVAdd(bVMul(f, -0.3), bVMul(r, 0.07))), fr = P(bVAdd(bVMul(f, -0.3), bVMul(r, -0.07)));
    var notch = P(bVMul(f, -0.32 - tl * 0.45));
    var pl = P(bVAdd(bVMul(f, -0.32 - tl), bVMul(r, tl * 0.28))), pr = P(bVAdd(bVMul(f, -0.32 - tl), bVMul(r, -tl * 0.28)));
    c.beginPath();
    c.moveTo(fl[0], fl[1]); c.lineTo(pl[0], pl[1]); c.lineTo(notch[0], notch[1]); c.lineTo(pr[0], pr[1]); c.lineTo(fr[0], fr[1]);
    c.closePath(); c.fill();
    c.lineWidth = Math.max(0.5, 0.035 * m); c.lineJoin = 'round';
    c.stroke();
  }
}
var BIRD_HAZE = hexToRgb('#E9CDBF');                       // the pale, warm air the far birds are seen through
/* Which depth slot a bird is drawn in (BIRD_HIDE): its flock's depth (0 near,
   1 middle, 2 far) while it flies, 3 (the gate's) on the gate and on the
   nearer part of the way down to it or up from it. */
function birdSlot(F, B) { return B.mode && B.mode !== 'fly' && B.gate ? 3 : F.tier; }
function birdSlotUsed(slot) {
  for (var i = 0; i < flocks.length; i++)
    for (var j = 0; j < flocks[i].birds.length; j++) if (birdSlot(flocks[i], flocks[i].birds[j]) === slot) return true;
  return false;
}
/* Where a bird is on the screen. */
function birdXY(F, B, cam) { return B.mode && B.mode !== 'fly' ? [B.sx, B.sy] : bScreen(F, B.p, cam); }
/* The birds in one depth slot. */
function drawBirds(c, slot) {
  if (!flocks.length) return;
  var cam = bCam(), base = hexToRgb(BIRD.colour);
  c.setTransform(PR, 0, 0, PR, 0, 0);
  for (var i = 0; i < flocks.length; i++) {
    var F = flocks[i];
    var col = rgba(mixRgb(base, BIRD_HAZE, BIRD.haze * FLOCK_TIERS[F.tier].haze));
    for (var j = 0; j < F.birds.length; j++) {
      var B = F.birds[j];
      if (birdSlot(F, B) !== slot) continue;
      if (B.mode === 'perch') drawPerched(c, B, col);
      else if (B.mode === 'land' || B.mode === 'takeoff') drawBirdShape(c, B.sx, B.sy, B.sm, B.v3, B, cam, col);
      else drawBird(c, F, B, cam, col);
    }
  }
  c.setTransform(1, 0, 0, 1, 0, 0);
}
/* ---------- Perching on the front torii gate ----------
   TOR.perch (torBake) is the top edge of the front gate's upper beam on the
   screen, end to end. A perched bird stands on it at its own place u (0 the
   left end … 1 the right); the way down and the way up are drawn as the
   flying bird, along a smooth curve on the screen that starts and ends with
   the bird's own speed, growing or shrinking to the size it is on the gate. */
var birdNow = 0;                                                    // the time of the last update (the perched poses are drawn for it)
function perchL() { return TOR.perch.px * BIRD.perchSize; }   // a perched bird's body length (px)
function perchAt(u) {
  var P = TOR.perch.pts, k = clamp(u, 0, 1) * (P.length - 1), i = Math.min(P.length - 2, Math.floor(k)), f = k - i;
  return [lerp(P[i][0], P[i + 1][0], f), lerp(P[i][1], P[i + 1][1], f)];
}
/* A cubic (Hermite) curve from p0 to p1 over dur s, leaving at v0 and arriving at v1 (px/s). */
function hermAt(sg, k) {
  var k2 = k * k, k3 = k2 * k, d = sg.dur;
  var h00 = 2 * k3 - 3 * k2 + 1, h10 = k3 - 2 * k2 + k, h01 = -2 * k3 + 3 * k2, h11 = k3 - k2;
  var g00 = 6 * k2 - 6 * k, g10 = 3 * k2 - 4 * k + 1, g01 = -6 * k2 + 6 * k, g11 = 3 * k2 - 2 * k;
  var out = [];
  for (var a = 0; a < 2; a++) {
    out.push(h00 * sg.p0[a] + h10 * d * sg.v0[a] + h01 * sg.p1[a] + h11 * d * sg.v1[a]);
  }
  for (var b = 0; b < 2; b++) out.push((g00 * sg.p0[b] + g10 * d * sg.v0[b] + g01 * sg.p1[b] + g11 * d * sg.v1[b]) / d);
  return out;                                                       // x, y, vx, vy
}
function hermSeg(p0, v0, p1, v1, speed) {
  return { p0: p0, v0: v0, p1: p1, v1: v1, dur: clamp(Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) / speed, 0.6, 3) };
}
/* A flock goes down to the gate: each bird gets its own place along the beam, with gaps here and there. */
function startPerch(F, t) {
  var n = F.birds.length, slots = n + 2 + Math.floor(rnd(0, 2)), us = [];
  for (var k = 0; k < slots; k++) us.push(lerp(0.1, 0.9, (k + 0.5) / slots) + rnd(-0.2, 0.2) / slots);
  us.sort(function () { return Math.random() - 0.5; });
  for (var i = 0; i < n; i++) { F.birds[i].pu = us[i]; F.birds[i].landAt = t + rnd(0, BIRD.perchArrive); }
  F.perch = { state: 'landing' };
}
function perchFlock(F, t, dt, cam) {
  if (!F.perch) {
    if (F.tier === 0 && !F.leaving && !F.dismissed && TOR.perch && t - F.born > BIRD.perchAfter &&
        t - (F.lastPerch || -1e9) > BIRD.perchAgain && Math.random() < dt * BIRD.perch &&
        !flocks.some(function (o) { return o !== F && o.perch; })) startPerch(F, t);
    return;
  }
  var st = F.perch;
  if (!TOR.perch && st.state !== 'takeoff') { beginTakeoff(F, t, cam, true); return; }   // the gate is gone (the scene changed)
  if (st.state === 'landing') {
    if (F.dismissed) beginTakeoff(F, t, cam, true);
    else if (F.birds.every(function (b) { return b.mode === 'perch'; })) { st.state = 'perched'; st.until = t + rnd(BIRD.perchStay[0], BIRD.perchStay[1]); }
  } else if (st.state === 'perched') {
    if (t > st.until || F.dismissed) beginTakeoff(F, t, cam, F.dismissed);
  } else if (F.birds.every(function (b) { return !b.mode || b.mode === 'fly'; })) {
    F.perch = null; F.lastPerch = t;
    if (!F.dismissed) F.life = Math.max(F.life, t - F.born + rnd(8, 20));   // they fly on for a while before leaving
  }
}
/* One bird leaves the flock and comes down to its place on the beam. If the
   message text is in the way it goes round the side of it first. */
function startLanding(F, B, t, cam) {
  var s = bScreen(F, B.p, cam), s2 = bScreen(F, bVAdd(B.p, bVMul(B.v, 0.05)), cam), L = perchL();
  var p0 = [s[0], s[1]], v0 = [(s2[0] - s[0]) / 0.05, (s2[1] - s[1]) / 0.05];
  var end = perchAt(B.pu); end = [end[0], end[1] - 0.3 * L];
  var side = end[0] >= p0[0] ? 1 : -1, v1 = [side * 35, 60];        // comes in gently, from a little above
  var one = hermSeg(p0, v0, end, v1, 240), segs = [one], box = null;
  for (var k = 1; k < 12 && !box; k++) { var h = hermAt(one, k / 12); box = inBirdText(h[0], h[1], 0); }
  if (box) {
    var wx = end[0] > (box.l + box.r) / 2 ? box.r + 40 : box.l - 40, way = [wx, box.b - 10];
    var dx = end[0] - way[0], dy = end[1] - way[1], dl = Math.hypot(dx, dy) || 1, wv = [dx / dl * 200, dy / dl * 200];
    segs = [hermSeg(p0, v0, way, wv, 260), hermSeg(way, wv, end, v1, 240)];
  }
  B.mode = 'land'; B.gate = false; B.roll = 0;
  B.fl = { t0: t, segs: segs, m0: s[2] * BODY_M, dur: segs.reduce(function (d, g) { return d + g.dur; }, 0) };
  B.sx = p0[0]; B.sy = p0[1]; B.sm = B.fl.m0; B.v3 = B.v.slice();
}
/* Time to go: the leader starts again just above the gate, climbing away
   toward the middle of the sky, and the birds take off after it — all at
   once (startled, or sent off) or one by one. */
function beginTakeoff(F, t, cam, now) {
  F.perch.state = 'takeoff';
  var gx = 0, gy = 0, n = 0;                                          // where they are: the middle of those down at the gate
  for (var i = 0; i < F.birds.length; i++) if (F.birds[i].mode && F.birds[i].mode !== 'fly') { gx += F.birds[i].sx; gy += F.birds[i].sy; n++; }
  if (n) { gx /= n; gy /= n; } else { gx = W / 2; gy = H * 0.6; }
  var m = pxPerM(F), dir = gx > W / 2 ? -1 : 1;
  F.y0 = ((H * LAND.horizon - (gy - 40)) / m) / cam.c;
  F.p = [(gx - W / 2) / m, F.y0, 0];
  F.yaw = (dir > 0 ? 0 : PI) + dir * rnd(-0.5, -0.2); F.v = BIRD.speed; F.vy = 2.5; F.w = 0; F.loopT = 0;
  F.hist = [];
  for (var k = 40; k >= 0; k--) {
    var back = k / 20, vel = [Math.cos(F.yaw) * F.v, F.vy, Math.sin(F.yaw) * F.v];
    F.hist.push({ t: t - back, p: [F.p[0] - vel[0] * back, F.p[1] - vel[1] * back, F.p[2] - vel[2] * back], v: vel });
  }
  newGoal(F, cam, true);
  var together = now || Math.random() < 0.55;
  for (var j = 0; j < F.birds.length; j++) F.birds[j].offAt = t + (together ? rnd(0, 0.5) : rnd(0, 3));
}
function startTakeoff(F, B, t) {
  var face = B.per ? B.per.face : 1;
  B.mode = 'takeoff'; B.gate = true; B.roll = 0;
  var dur = rnd(0.9, 1.3);                                            // up and away, toward its place in the flock (perchBird)
  B.fl = { t0: t, segs: [{ p0: [B.sx, B.sy], v0: [face * 90, -260], p1: [B.sx, B.sy], v1: [0, 0], dur: dur }], m0: TOR.perch ? perchL() : B.sm, dur: dur };
  B.glide = 0; B.ph = 0;
}
/* A bird on its way down, on the gate, or on its way up. */
function perchBird(F, B, t, dt) {
  var cam = bCam();
  if (B.mode === 'perch') {
    if (!TOR.perch || (F.perch && F.perch.state === 'takeoff' && t > B.offAt)) { startTakeoff(F, B, t); return; }
    perchActs(F, B, t);
    var at = perchAt(B.pu), L = perchL();
    B.sx = at[0]; B.sy = at[1] - 0.3 * L; B.sm = L; B.gate = true;
    return;
  }
  var fl = B.fl, el = t - fl.t0, k = clamp(el / fl.dur, 0, 1), sg = fl.segs[0], e0 = 0;
  for (var i = 0; i < fl.segs.length - 1 && el > e0 + fl.segs[i].dur; i++) e0 += fl.segs[i].dur;
  sg = fl.segs[i];
  var m1 = fl.m0;
  if (B.mode === 'land') {
    if (!TOR.perch) { B.mode = 'perch'; startTakeoff(F, B, t); return; }
    var end = perchAt(B.pu);
    fl.segs[fl.segs.length - 1].p1 = [end[0], end[1] - 0.3 * perchL()];
    m1 = perchL();
  } else {                                                           // taking off: heading for its place in the flock as it is now
    var tg = flockTarget(F, B, t), s = bScreen(F, tg.p, cam), s2 = bScreen(F, bVAdd(tg.p, bVMul(tg.v, 0.05)), cam);
    sg.p1 = [s[0], s[1]]; sg.v1 = [(s2[0] - s[0]) / 0.05, (s2[1] - s[1]) / 0.05]; m1 = s[2] * BODY_M;
    if (k >= 1) {
      B.mode = 'fly'; B.gate = false; B.p = tg.p.slice(); B.v = tg.v.slice(); B.dartV = [0, 0, 0];
      B.beats = Math.max(B.beats, 4); B.per = null;
      return;
    }
  }
  var h = hermAt(sg, clamp((el - e0) / sg.dur, 0, 1));
  B.sx = h[0]; B.sy = h[1];
  B.sm = lerp(fl.m0, m1, k * k * (3 - 2 * k));
  B.gate = B.mode === 'land' ? k > 0.35 : k < 0.5;                  // at the gate's depth near the gate
  // facing the way it moves (screen down is world down), pitching up to brake at the end of the way down
  var v3 = [h[2], -h[3] / cam.c, 0], flare = B.mode === 'land' ? smooth(0.7, 1, k) : 0;
  if (Math.hypot(v3[0], v3[1]) < 1) v3 = [B.v3 ? B.v3[0] : 1, 0.2, 0];
  var vl = Math.hypot(v3[0], v3[1]);
  B.v3 = [v3[0] / vl * (1 - flare * 0.7), v3[1] / vl * (1 - flare * 0.7) + flare * 0.9, 0.15];
  // beating hard all the way, the wings held high and spread to brake as it touches down
  B.ph += TAU * B.hz * 1.2 * dt;
  B.wing = lerp(Math.sin(B.ph) * BIRD.flapAmp * PI / 180 * 1.2, 0.95, flare);
  B.ext = lerp(0.8 + 0.2 * Math.cos(B.ph - PI / 2 + 0.6), 1, flare);
  B.sw = lerp(B.sw, 0.2, Math.min(1, dt * 4));
  B.roll *= Math.max(0, 1 - dt * 6);
  if (B.mode === 'land' && k >= 1) {
    B.mode = 'perch'; B.gate = true;
    B.per = { face: h[2] < 0 ? -1 : 1, act: null, next: t + rnd(0.3, 1.5), seed: rnd(0, TAU) };
    B.sx = h[0]; B.sy = h[1]; B.sm = m1;
  }
}
/* What a perched bird is doing: an action now and then, from PERCH_ACTS. */
function perchActs(F, B, t) {
  var P = B.per;
  if (P.act) {
    if (t < P.act.t0 + P.act.dur) return;
    if (P.act.kind === 'shuffle') B.pu = P.act.to;
    if (P.act.flip) P.face = -P.face;
    P.act = null; P.next = t + rnd(BIRD.perchIdle[0], BIRD.perchIdle[1]);
    return;
  }
  if (t < P.next || (F.perch && F.perch.state === 'takeoff')) return;
  var sum = 0, r, kind, kk;
  for (kk in PERCH_ACTS) sum += PERCH_ACTS[kk].w;
  r = Math.random() * sum;
  for (kk in PERCH_ACTS) { r -= PERCH_ACTS[kk].w; if (r <= 0) { kind = kk; break; } }
  kind = kind || 'look';
  var D = PERCH_ACTS[kind], act = { kind: kind, t0: t, dur: rnd(D.dur[0], D.dur[1]), v: Math.random() < 0.5 ? 0 : 1 };
  if (kind === 'shuffle') {
    // a step along the beam, if there is room beside it
    var gapU = 1.3 * perchL() / Math.max(1, TOR.perch.x1 - TOR.perch.x0), to = clamp(B.pu + (Math.random() < 0.5 ? -1 : 1) * rnd(0.03, 0.07), 0.08, 0.92);
    var free = F.birds.every(function (o) { return o === B || o.mode !== 'perch' || (Math.abs(o.pu - to) > gapU && !(o.per && o.per.act && o.per.act.to !== undefined && Math.abs(o.per.act.to - to) < gapU)); });
    if (!free) { act.kind = 'turn'; act.dur = rnd(PERCH_ACTS.turn.dur[0], PERCH_ACTS.turn.dur[1]); }
    else { act.from = B.pu; act.to = to; P.face = to > B.pu ? 1 : -1; }
  }
  if (act.kind === 'turn' || (act.kind === 'hop' && act.v)) act.flip = true;
  P.act = act;
}
function perchEnv(k) { return smooth(0, 0.2, k) * (1 - smooth(0.75, 1, k)); }
/* The pose of a perched bird now. Angles in radians; lengths in body lengths. */
function perchPose(B, t) {
  var P = B.per, A = P.act, Q = { u: B.pu, face: P.face, tilt: 0, puff: 1, headBack: 0, headDown: 0, beak: 0,
    wingN: 0.12, spreadN: 0, wingF: 0.12, spreadF: 0, lift: 0, jit: 0, tail: 0.05 * Math.sin(t * 1.3 + P.seed) };
  if (!A) return Q;
  var k = clamp((t - A.t0) / A.dur, 0, 1), e = perchEnv(k), osc;
  if (A.flip && k > 0.5) Q.face = -P.face;
  switch (A.kind) {
    case 'look': Q.beak = PI * 0.85 * e; Q.headBack = 0.25 * e; break;
    case 'glance': Q.beak = -0.6 * e; break;
    case 'preen':
      if (A.v) { Q.headDown = e; Q.beak = -0.9 * e + 0.15 * Math.sin(t * TAU * 3) * e; }        // the breast
      else {                                                                                   // under the wing and along the back
        Q.headBack = e; Q.beak = (PI * 0.75 + 0.25 * Math.sin(t * TAU * 3)) * e;
        Q.wingN = 0.12 + 0.35 * e; Q.spreadN = 0.25 * e;
      }
      break;
    case 'stretchOne':
      if (A.v) { Q.wingN = 0.12 + 0.35 * e; Q.spreadN = e; } else { Q.wingF = 0.12 + 0.35 * e; Q.spreadF = e; }   // out, down and back, spread
      Q.tilt = -0.15 * e; break;
    case 'stretchBoth': Q.wingN = 0.12 + 1.75 * e; Q.wingF = 0.12 + 1.35 * e; Q.spreadN = Q.spreadF = 0.85 * e; Q.tilt = 0.15 * e; Q.beak = -0.2 * e; break;
    case 'flap':
    case 'hop':
      if (A.kind === 'hop') { e = Math.sin(PI * k); Q.lift = 1.3 * e; } else Q.lift = 0.12 * e;
      osc = 0.5 + 0.5 * Math.sin(t * TAU * 9 + P.seed);
      Q.wingN = 0.12 + e * (0.35 + 1.2 * osc); Q.wingF = 0.12 + e * (0.15 + 1.4 * osc); Q.spreadN = Q.spreadF = 0.8 * e; Q.tilt = 0.25 * e; break;
    case 'fluff':
      Q.puff = 1 + 0.35 * e; Q.headBack = 0.1 * e;
      if (k > 0.45 && k < 0.8) Q.jit = 0.05 * Math.sin(t * TAU * 18);
      break;
    case 'shuffle':
      Q.u = lerp(A.from, A.to, smooth(0, 1, k)); Q.lift = 0.08 * Math.abs(Math.sin(k * PI * 3)); break;
    case 'turn': Q.lift = 0.25 * Math.sin(PI * k); break;
    case 'wag': Q.tail = 0.3 * Math.sin(k * TAU * 3) * e; break;
  }
  return Q;
}
/* A perched bird, seen from the side, as a dark silhouette, shaped like a
   small songbird on a branch: a plump, upright, egg-shaped body sitting on
   the beam, a round head on top with a short beak, the tail hanging straight
   down behind the beam, the folded wings tucked into the body (only their
   tips show, crossing the base of the tail), and short legs. Raised, the
   wings are broad with the long flight feathers spread at their ends, and
   the tail fans out. Units: body lengths (L px), x forward, y up, the feet
   at (0, 0). */
function drawPerched(c, B, col) {
  if (!TOR.perch) return;
  var t = birdNow, Q = perchPose(B, t), L = perchL(), at = perchAt(Q.u), f = Q.face;
  var x0 = at[0] + Q.jit * L, y0 = at[1] - Q.lift * L;
  function S(x, y) { return [x0 + x * f * L, y0 - y * L]; }
  function mv(p) { c.moveTo(p[0], p[1]); }
  function ln(p) { c.lineTo(p[0], p[1]); }
  function qd(p, q) { c.quadraticCurveTo(p[0], p[1], q[0], q[1]); }
  var th = 1.15 + Q.tilt * 0.6, ax = Math.cos(th), ay = Math.sin(th);   // the body's long axis: up, a little forward
  var bx = -ay, by = ax;                                                // toward its back
  var pf = Q.puff, cx = -0.03, cy = 0.35 + 0.05 * (pf - 1);              // the middle of the body
  var spread = Math.max(Q.spreadN, Q.spreadF);
  c.fillStyle = col; c.strokeStyle = col; c.lineCap = 'round'; c.lineJoin = 'round';
  // a wing at angle `raise` (as perchPose gives it: about 0.1 folded, 1.9 straight up over the back)
  function wing(raise, sp, off) {
    if (raise < 0.3 && sp < 0.08) return;                              // folded: inside the body's outline
    var ang = -1.92 - raise * 1.6, dx = Math.cos(ang), dy = Math.sin(ang), px = dy, py = -dx;
    var len = 0.62 + 0.28 * sp, w = 0.12 + 0.14 * sp;
    var sx = cx + ax * 0.12 + bx * (0.07 + off), sy = cy + ay * 0.12 + by * (0.07 + off);
    function P(a, b) { return S(sx + dx * a + px * b, sy + dy * a + py * b); }
    c.beginPath();
    mv(P(0, w * 0.6));
    qd(P(len * 0.45, w * 1.1), P(len, w * 0.15));                      // the leading edge out to the tip
    var n = sp > 0.3 ? 4 : 1;                                          // the long flight feathers at the end, spread
    for (var i = 0; i < n; i++) {
      var k0 = len * (1 - 0.1 * i), k1 = len * (0.93 - 0.1 * i);
      ln(P(k0 - 0.02, -w * (0.15 + 0.22 * i)));
      if (i < n - 1) ln(P(k1 - 0.05, -w * (0.2 + 0.22 * i)));
    }
    qd(P(len * 0.35, -w * 1.05), P(0, -w * 0.55));                     // the inner trailing edge back to the body
    c.closePath(); c.fill();
  }
  wing(Q.wingF, Q.spreadF, 0.02);                                       // the far wing, behind
  // the tail: hanging down behind the beam, fanned out when the wings open
  var ta = -1.82 + Q.tail, tdx = Math.cos(ta), tdy = Math.sin(ta), tpx = -tdy, tpy = tdx;
  var tbx = cx - ax * 0.24 + bx * 0.05, tby = cy - ay * 0.24 + by * 0.05;
  var tl = 0.32 + BIRD.tail * 0.25, w0 = 0.05, w1 = 0.065 + 0.14 * spread;
  function T(a, b) { return S(tbx + tdx * a + tpx * b, tby + tdy * a + tpy * b); }
  c.beginPath(); mv(T(0, w0)); ln(T(tl, w1)); ln(T(tl * 0.9, 0)); ln(T(tl, -w1)); ln(T(0, -w0)); c.closePath(); c.fill();
  // the body: an egg, round at the breast, narrowing to the tail
  var rl = 0.3, rw = 0.23 * pf;
  function E(a, b) { return S(cx + ax * a + bx * b, cy + ay * a + by * b); }
  c.beginPath();
  mv(E(rl, 0));
  c.bezierCurveTo.apply(c, E(rl, -rw * 1.05).concat(E(0, -rw * 1.15), E(-rl * 0.75, -rw * 0.6)));   // the breast and belly
  qd(E(-rl * 1.05, -rw * 0.1), E(-rl * 0.95, rw * 0.35));                                            // the vent, round to the tail
  c.bezierCurveTo.apply(c, E(-rl * 0.4, rw * 0.95).concat(E(rl * 0.7, rw * 1.0), E(rl, 0)));        // the back
  c.closePath(); c.fill();
  // the folded wingtips, crossing the base of the tail
  if (Q.wingN < 0.3 && Q.spreadN < 0.08) {
    c.beginPath(); mv(E(0.02, rw * 0.9)); qd(E(-rl * 0.9, rw * 0.85), E(-rl * 1.4, rw * 0.4)); ln(E(-rl * 0.6, rw * 0.25)); c.closePath(); c.fill();
  }
  // the head: on top of the body (turned back and down onto its back to preen, or bent to its breast)
  var hx = cx + ax * 0.33 - bx * 0.03, hy = cy + ay * 0.33 - by * 0.03;
  hx = lerp(hx, cx + ax * 0.18 + bx * 0.1, Q.headBack); hy = lerp(hy, cy + ay * 0.18 + by * 0.1, Q.headBack);
  hx = lerp(hx, cx + ax * 0.22 - bx * 0.14, Q.headDown); hy = lerp(hy, cy + ay * 0.22 - by * 0.14, Q.headDown);
  var hr = 0.125 * Math.sqrt(pf), hc = S(hx, hy);
  c.beginPath(); c.arc(hc[0], hc[1], hr * L, 0, TAU); c.fill();
  var nk = S(cx + ax * 0.15, cy + ay * 0.15);                           // the neck, so the head sits on the body smoothly
  c.lineWidth = hr * 1.6 * L; c.beginPath(); mv(nk); ln(hc); c.stroke();
  // a short pointed beak
  var ba = -0.08 + Q.beak, bcx = Math.cos(ba), bcy = Math.sin(ba);
  c.beginPath();
  mv(S(hx + bcx * hr * 0.6 - bcy * 0.045, hy + bcy * hr * 0.6 + bcx * 0.045));
  ln(S(hx + bcx * (hr + 0.11), hy + bcy * (hr + 0.11)));
  ln(S(hx + bcx * hr * 0.6 + bcy * 0.045, hy + bcy * hr * 0.6 - bcx * 0.045));
  c.closePath(); c.fill();
  wing(Q.wingN, Q.spreadN, 0);                                          // the near wing
  // short legs to the beam, the toes round it (tucked up in a hop)
  if (Q.lift < 0.4) {
    c.lineWidth = Math.max(0.6, 0.045 * L);
    c.beginPath();
    for (var s = -1; s <= 1; s += 2) { mv(S(cx + 0.04 + s * 0.035, cy - 0.16)); ln(S(0.03 + s * 0.04, -Q.lift)); }
    mv(S(-0.05, -Q.lift)); ln(S(0.11, -Q.lift));
    c.stroke();
  }
}


/* Fireflies: most drift behind the text; now and then some fly to a
   message character, land on it and glow there for a while, then lift
   off again. Several can sit on different characters at once. */
var fireflyGlyphs = [], fireflyGlyphsAt = -10;
function freeGlyphFor(t) {
  if (t - fireflyGlyphsAt > 1) { fireflyGlyphs = glyphSpots(); fireflyGlyphsAt = t; }
  if (!fireflyGlyphs.length) return null;
  for (var tries = 0; tries < 6; tries++) {
    var g = fireflyGlyphs[Math.floor(Math.random() * fireflyGlyphs.length)], taken = false;
    for (var i = 0; i < specks.length; i++) {
      var o = specks[i].target;
      if (o && Math.abs(o.x - g.x) < 4 && Math.abs(o.y - g.y) < 4) { taken = true; break; }
    }
    if (!taken) return g;
  }
  return null;
}
function updateSpecks(dt, t) {
  var target = (S.nightSpecks && (ENV.phase === 'night' || ENV.phase === 'dusk')) ? 24 : 0;
  while (specks.length < target) specks.push({ x: Math.random() * W, y: Math.random() * H, s: Math.random() * 1000, r: rnd(5, 11), state: 'drift' });
  if (specks.length > target) specks.length = target;
  var landed = 0;
  for (var k = 0; k < specks.length; k++) if (specks[k].state !== 'drift') landed++;
  for (var i = 0; i < specks.length; i++) {
    var p = specks[i];
    if (p.state === 'drift') {
      p.x += ((noise1(p.s + t * 0.15) - 0.5) * 40 + ENV.windPx * 0.15) * dt;
      p.y += (noise1(p.s + 50 + t * 0.15) - 0.5) * 30 * dt;
      if (p.x < -20) p.x += W + 40;
      if (p.x > W + 20) p.x -= W + 40;
      if (p.y < -20) p.y += H + 40;
      if (p.y > H + 20) p.y -= H + 40;
      if (S.fireflyLand && dynFrontMul > 0.5 && landed < S.fireflyMax && Math.random() < dt * 0.05) {
        var g = freeGlyphFor(t);
        if (g) { p.state = 'fly'; p.target = g; landed++; }
      }
    } else if (p.state === 'fly') {
      // a gentle, wavering flight to the character
      var dx = p.target.x - p.x, dy = p.target.y - 3 - p.y, d = Math.sqrt(dx * dx + dy * dy);
      var sp = Math.min(70, d * 1.5 + 10);
      if (d > 1.5) {
        p.x += (dx / d * sp + Math.sin(t * 3 + p.s) * 14 * Math.min(1, d / 60)) * dt;
        p.y += (dy / d * sp + Math.cos(t * 2.4 + p.s) * 10 * Math.min(1, d / 60)) * dt;
      } else {
        p.state = 'perch';
        p.rest = rnd(3, 9);
      }
    } else if (p.state === 'perch') {
      p.x = p.target.x; p.y = p.target.y - 3;
      p.rest -= dt;
      if (p.rest <= 0) { p.state = 'drift'; p.target = null; p.y -= 6; }
    }
  }
}
function fireflyAlpha(p, t) {
  if (p.state === 'perch') return 0.45 + 0.5 * (0.5 + 0.5 * Math.sin(t * 2.2 + p.s));   // slow glow pulse
  return 0.15 + 0.55 * noise1(p.s * 3 + t * 0.9);
}
/* front = false: drifting fireflies behind the text; true: the ones
   flying to, or sitting on, a character (drawn above the text). */
function drawSpecks(ctx, t, front) {
  for (var i = 0; i < specks.length; i++) {
    var p = specks[i];
    if ((p.state !== 'drift') !== !!front) continue;
    var r = front ? 14 : p.r;
    var a = fireflyAlpha(p, t);
    if (front) {
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(60,45,30,0.7)';       // tiny body, so it reads as an insect on the character
      ctx.beginPath(); ctx.ellipse(p.x - 1.5, p.y, 2.6, 1.4, 0, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = a;
    ctx.drawImage(speckSprite, p.x - r, p.y - r, r * 2, r * 2);
  }
  ctx.globalAlpha = 1;
}
function fireflyOnText() {
  for (var i = 0; i < specks.length; i++) if (specks[i].state !== 'drift') return true;
  return false;
}

/* ============================================================
   8b. SEASONAL PICTURE — kōyō trees (autumn theme; the winter scene is 8d)
   ============================================================ */
var tree = null;          // the near tree: taller and sharp
var farTree = null;       // the far tree on the other side: shorter, a little soft and paler
var koyoLeafLayer = document.createElement('canvas');   // the near kōyō tree's foliage, laid down at its own strength
var ctxKL = koyoLeafLayer.getContext('2d');
// The birds go on a layer of their own and the trees in front are cut out of
// it, so a bird behind a tree is hidden completely (the foliage itself is laid
// down a little see-through). Only the box around the birds is worked on.
var birdLayer = document.createElement('canvas');
var ctxBL = birdLayer.getContext('2d');
var birdSlotLayer = document.createElement('canvas');   // one depth slot's birds at a time, before they go onto birdLayer
var ctxBS = birdSlotLayer.getContext('2d');
var farBranchLayer = document.createElement('canvas');  // the far tree's branches (half size, as its foliage on farLayer)
var ctxFB = farBranchLayer.getContext('2d');
var birdBox = null;
function birdBounds() {
  if (!flocks.length) return null;
  var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, pad = 80, cam = bCam();
  for (var i = 0; i < flocks.length; i++) {
    var F = flocks[i];
    for (var k = 0; k < F.birds.length; k++) {
      var s = birdXY(F, F.birds[k], cam);
      x0 = Math.min(x0, s[0]); x1 = Math.max(x1, s[0]); y0 = Math.min(y0, s[1]); y1 = Math.max(y1, s[1]);
    }
  }
  if (x0 === Infinity) return null;
  x0 = Math.max(0, Math.floor((x0 - pad) * PR)); y0 = Math.max(0, Math.floor((y0 - pad) * PR));
  x1 = Math.min(birdLayer.width, Math.ceil((x1 + pad) * PR)); y1 = Math.min(birdLayer.height, Math.ceil((y1 + pad) * PR));
  return x1 > x0 && y1 > y0 ? { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } : null;
}
// Cut a layer in front (k: its size against the screen, alpha: how strongly it
// is laid down) out of the birds on c. The foliage is cut three times so its
// soft, part see-through leaves hide them too.
function birdsCutOut(c, src, k, times, alpha) {
  var B = birdBox;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalAlpha = alpha === undefined ? 1 : alpha;
  c.globalCompositeOperation = 'destination-out';
  for (var i = 0; i < times; i++) c.drawImage(src, B.x * k, B.y * k, B.w * k, B.h * k, B.x, B.y, B.w, B.h);
  c.globalCompositeOperation = 'source-over';
  c.globalAlpha = 1;
}
var TREE_DEPTH = 7;
var FAR_TREE_SCALE = 0.6;     // far tree height as a share of the near tree
var FAR_TREE_ALPHA = 0.8;     // and how strong it looks next to the near tree
var FAR_LAYER_SCALE = 0.5;    // the far tree is drawn at half resolution and scaled up: that is its blur
function strSeed(str) {
  var h = 2166136261;
  for (var i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}
/* No branch may cross or touch another, apart from where it forks off.
   A new branch that would is turned a little either way, then tried
   shorter, and if none of those fit it is left off. Sisters share their
   fork, so for them only the tips must stay clear. BRANCH_GAP is the
   least clear space (CSS px) between two branches' edges. */
var BRANCH_GAP = 3;
var BRANCH_LENGTHS = [1, 0.75, 0.55];
var BRANCH_TURNS = [0, 0.14, -0.14, 0.28, -0.28, 0.42, -0.42, 0.56, -0.56];
function pointSegDist(px, py, ax, ay, bx, by) {
  var dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
  var u = l2 ? clamp(((px - ax) * dx + (py - ay) * dy) / l2, 0, 1) : 0;
  return Math.hypot(px - ax - u * dx, py - ay - u * dy);
}
function segSegDist(ax, ay, bx, by, cx, cy, dx, dy) {
  var d1 = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax), d2 = (bx - ax) * (dy - ay) - (by - ay) * (dx - ax);
  var d3 = (dx - cx) * (ay - cy) - (dy - cy) * (ax - cx), d4 = (dx - cx) * (by - cy) - (dy - cy) * (bx - cx);
  if (d1 * d2 < 0 && d3 * d4 < 0) return 0;
  return Math.min(pointSegDist(ax, ay, cx, cy, dx, dy), pointSegDist(bx, by, cx, cy, dx, dy),
                  pointSegDist(cx, cy, ax, ay, bx, by), pointSegDist(dx, dy, ax, ay, bx, by));
}
function branchClear(nodes, parent, sx, sy, ex, ey, w) {
  for (var i = 0; i < nodes.length; i++) {
    var o = nodes[i], room = (w + o.w) / 2 + BRANCH_GAP;
    if (i === parent) continue;
    if (o.p === parent) {
      if (pointSegDist(ex, ey, o.sx, o.sy, o.ex, o.ey) < room ||
          pointSegDist(o.ex, o.ey, sx, sy, ex, ey) < room) return false;
    } else if (segSegDist(sx, sy, ex, ey, o.sx, o.sy, o.ex, o.ey) < room) return false;
  }
  return true;
}
function fitBranch(nodes, parent, sx, sy, abs, len, w) {
  for (var s = 0; s < BRANCH_LENGTHS.length; s++) {
    var l = len * BRANCH_LENGTHS[s];
    for (var i = 0; i < BRANCH_TURNS.length; i++) {
      var a = abs + BRANCH_TURNS[i], ex = sx + Math.cos(a) * l, ey = sy + Math.sin(a) * l;
      if (branchClear(nodes, parent, sx, sy, ex, ey, w)) return { abs: a, len: l, ex: ex, ey: ey };
    }
  }
  return null;
}
/* ---------- Kōyō trees (autumn) — the koyo.html design ----------
   A branch skeleton with fewer levels, carrying foliage clumps: each clump
   is a dense mass of small maple leaves baked once into its own sprite,
   darker underneath and lit on the light side, then moved with its branch.
   Neighbouring clumps tend to share a colour (patches, as in the photo).
   The canopy is squeezed toward its trunk so it stays within KOYO.maxWidth
   percent of the screen. At night the trees are lit up from below by warm
   lamps instead of going dark. Clumps are re-baked a few per frame when the
   light changes (lookVersion). */
var KOYO_CLUMP_LEAF = koyoOutline(70, 0);
function koyoNight() { return smooth(0.25, 0.5, ENV.light ? ENV.light.dark : 0); }   // 0 day … 1 night
/* The app's light on the trees: the daytime tint, the night tint, rain.
   glow: how strongly lamps light things at night (KOYO.nightGlow by default). */
function koyoLight(c, glow) {
  var Lt = ENV.light, n = koyoNight(), g = glow === undefined ? KOYO.nightGlow : glow;
  var day = scaleRgb(mixRgb(c, Lt.col, clamp(Lt.amt * 0.9, 0, 0.25)), 1 - Lt.dark * 0.1);
  var night = scaleRgb(mixRgb(c, [60, 52, 96], 0.14 * (1 - g * 0.5)), lerp(0.72, 0.95, g));
  var o = mixRgb(day, night, n);
  return ENV.wet > 0 ? scaleRgb(o, 1 - 0.18 * ENV.wet) : o;
}
function koyoFamily(r) {
  var x = r(), acc = 0;
  for (var k in KOYO_SHARES) { acc += KOYO_SHARES[k]; if (x <= acc) return k; }
  return 'red';
}
function koyoLeafPath(c, x, y, size, rot) {
  var cs = Math.cos(rot) * size, sn = Math.sin(rot) * size, P = KOYO_CLUMP_LEAF;
  c.beginPath();
  for (var i = 0; i < P.length; i++) {
    var px = x + P[i][0] * cs - P[i][1] * sn, py = y + P[i][0] * sn + P[i][1] * cs;
    if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
  }
  c.closePath();
}
/* Draw one clump into its sprite (made once, re-drawn when the light changes). */
function bakeClump(C, far) {
  var r = rngFrom(C.seed), tones = KOYO_FAMILIES[C.fam], R = C.R;
  var res = PR * (far ? FAR_LAYER_SCALE : 1), side = Math.ceil(R * 2.6 * res);
  if (!C.cnv || C.cnv.width !== side) { C.cnv = document.createElement('canvas'); C.cnv.width = C.cnv.height = side; }
  var c = C.cnv.getContext('2d');
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, side, side);
  c.setTransform(res, 0, 0, res, side / 2, side / 2);
  var n = koyoNight(), glow = KOYO.nightGlow * n, shade = KOYO.shadeDepth;
  // by day the light comes from above, at night from the lamps below
  var lx = KOYO.lightFrom * lerp(1, 0.5, n), ly = lerp(-0.85, 0.8, n), ll = Math.hypot(lx, ly); lx /= ll; ly /= ll;
  function col(c0) {
    var o = c0;
    if (C.back) o = mixRgb(o, KOYO_PLUM, 0.2 + shade * 0.25);
    if (far) o = mixRgb(o, KOYO_PAPER, KOYO.farHaze);
    return koyoLight(o);
  }
  // a lumpy darker core so the clump reads as one mass
  var core = mixRgb(col(scaleRgb(tones[0], 1 - shade * 0.25)), col(tones[1]), glow * 0.45);
  c.fillStyle = rgba(core);
  for (var b = 0; b < 9; b++) {
    var ba = r() * TAU, bd = r() * 0.4;
    c.beginPath();
    c.arc(Math.cos(ba) * bd * R, Math.sin(ba) * bd * R * 0.75 + R * 0.05, R * (0.32 + r() * 0.18), 0, TAU);
    c.fill();
  }
  var count = Math.round(85 * KOYO.leafDensity * (far ? 0.7 : 1)), dabs = [];
  for (var i = 0; i < count; i++) {
    var a = r() * TAU, d = Math.sqrt(r()), edge = r() < 0.28;     // bigger leaves round the rim
    if (edge) d = 0.85 + r() * 0.2;
    var x = Math.cos(a) * d * R * 0.95, y = Math.sin(a) * d * R * 0.78;
    if (y > R * 0.45) y *= 0.8;                                    // flatter underside
    dabs.push({ x: x, y: y, t: (x * lx + y * ly) / R + (r() - 0.5) * 0.5,
                s: R * (edge ? 0.3 : 0.24) * KOYO.leafSize * (0.7 + r() * 0.6),
                rot: (r() - 0.5) * 1.6 + (x / R) * 0.6, j: r() });
  }
  dabs.sort(function(p, q) { return p.t - q.t; });                // shade first, lit leaves on top
  for (var k = 0; k < dabs.length; k++) {
    var D = dabs[k], tone;
    if (D.t < -0.25) tone = mixRgb(tones[0], tones[1], clamp((D.t + 1) / 0.75, 0, 1) * 0.5);
    else if (D.t < 0.35) tone = mixRgb(tones[1], tones[0], clamp((0.35 - D.t) / 0.6, 0, 1) * 0.35);
    else tone = mixRgb(tones[1], tones[2], clamp((D.t - 0.35) / 0.5, 0, 1));
    tone = scaleRgb(tone, 1 - shade * 0.3 * clamp(-D.t, 0, 1) + (D.j - 0.5) * 0.1);
    var lit = col(tone);
    if (glow > 0) lit = scaleRgb(mixRgb(lit, KOYO_LAMP, glow * 0.22 * clamp(D.t + 0.3, 0, 1.3)), 1 + glow * 0.12 * clamp(D.t, 0, 1));
    koyoLeafPath(c, D.x, D.y, D.s, D.rot);
    c.fillStyle = rgba(lit);
    c.fill();
    if (D.t > 0.4 && !far) {                                       // a faint midrib on the lit leaves
      c.strokeStyle = 'rgba(255,236,205,0.18)';
      c.lineWidth = Math.max(0.6, D.s * 0.04);
      c.beginPath();
      c.moveTo(D.x, D.y + D.s * 0.15);
      c.lineTo(D.x + Math.sin(D.rot) * D.s * 0.4, D.y - Math.cos(D.rot) * D.s * 0.4);
      c.stroke();
    }
  }
  C.half = side / (2 * res);
  C.bakedV = lookVersion;
}
function buildKoyoTree(key, far, lazy) {
  var r = rngFrom(strSeed(key));
  var side = far ? (ENV.side === 'left' ? 'right' : 'left') : ENV.side;
  var left = side === 'left', dir = left ? 1 : -1;
  var sc = H * KOYO.treeSize * (far ? FAR_TREE_SCALE : 1), maxD = KOYO.twigDepth, nodes = [];
  function grow(parent, abs, len, w, d) {
    var sx = parent < 0 ? bx : nodes[parent].ex, sy = parent < 0 ? H + 6 : nodes[parent].ey;
    var fit = fitBranch(nodes, parent, sx, sy, abs, len, w);
    if (!fit) return;
    abs = fit.abs; len = fit.len;
    var pAbs = parent < 0 ? -PI / 2 : nodes[parent].abs, idx = nodes.length;
    nodes.push({ p: parent, rel: abs - pAbs, abs: abs, len: len, w: w, d: d,
                 ph: r() * TAU, f: 0.6 + r() * 0.8, cur: abs, sx: sx, sy: sy, ex: fit.ex, ey: fit.ey });
    if (d >= maxD) return;
    var n = d === 0 ? 2 : (r() < 0.3 ? 3 : 2);
    var spread = (0.42 + r() * 0.3) * (n === 3 ? 0.8 : 1);
    var shrink = (0.68 + r() * 0.14) * lerp(1.1, 1, (maxD - 4) / 3);   // fewer levels: each a little longer
    for (var i = 0; i < n; i++) {
      var ca = abs + (i - (n - 1) / 2) * spread + (r() - 0.5) * 0.35 + dir * (d < 3 ? 0.1 : 0.04);
      grow(idx, lerp(ca, -PI / 2, 0.1), len * shrink, Math.max(0.8, w * 0.62), d + 1);
    }
  }
  var bx = left ? W * (0.04 + r() * 0.06) : W * (0.9 + r() * 0.06);
  grow(-1, -PI / 2 + dir * (0.1 + r() * 0.12), sc * 0.26, Math.max(far ? 4 : 7, sc * 0.034), 0);
  var byDepth = [];
  for (var q = 0; q < nodes.length; q++) (byDepth[nodes[q].d] = byDepth[nodes[q].d] || []).push(q);
  var T = { key: key, far: !!far, koyo: true, left: left, bx: bx, by: H + 6, nodes: nodes, byDepth: byDepth, clumps: [],
            gust: 0, gustV: 0, gid: 0, scale: sc, maxD: maxD, winter: false, k: 1 };
  // rest pose, to place the clumps
  for (var m = 0; m < nodes.length; m++) {
    var nd = nodes[m], par = nd.p < 0 ? null : nodes[nd.p];
    nd.sx = par ? par.ex : bx; nd.sy = par ? par.ey : T.by;
    nd.ex = nd.sx + Math.cos(nd.abs) * nd.len; nd.ey = nd.sy + Math.sin(nd.abs) * nd.len;
  }
  var keep = KOYO.fullness, cell = sc * 0.16, cellFam = {};
  for (var j = 1; j < nodes.length; j++) {
    var N = nodes[j], upper = N.d >= maxD - 1, mid = N.d >= 2 && N.d < maxD - 1;
    if (!upper && !mid) continue;
    if (r() > (upper ? keep : keep * 0.6)) continue;
    var R = sc * (upper ? lerp(0.07, 0.1, r()) : lerp(0.09, 0.12, r())) * lerp(0.75, 1.1, KOYO.fullness);
    var ck = Math.floor(N.ex / cell) + ',' + Math.floor(N.ey / cell);
    if (!cellFam[ck]) cellFam[ck] = koyoFamily(r);
    var fam = r() < KOYO.patchiness ? cellFam[ck] : koyoFamily(r);
    if (fam === 'evergreen' && upper) fam = 'red';                  // evergreen only low and behind
    T.clumps.push({ node: j, R: R, fam: fam, back: mid || r() < 0.3, seed: (r() * 4294967296) >>> 0,
                    ox: (r() - 0.5) * R * 0.5, oy: (r() - 0.5) * R * 0.4 - R * 0.2, ph: r() * TAU, bakedV: -1 });
  }
  // No holes: the dice above can leave a gap that the bare twigs show through.
  // Walk along every twig and, wherever no clump covers a point, add one there.
  var fillR = sc * 0.095 * lerp(0.75, 1.1, KOYO.fullness);
  for (var g = 1; g < nodes.length; g++) {
    var GN = nodes[g];
    if (GN.d < 2) continue;
    for (var s = 0; s < 3; s++) {
      var gf = (s + 1) / 3, gx = lerp(GN.sx, GN.ex, gf), gy = lerp(GN.sy, GN.ey, gf), covered = false;
      for (var h = 0; h < T.clumps.length && !covered; h++) {
        var HC = T.clumps[h], hn = nodes[HC.node];
        covered = Math.hypot(hn.ex + HC.ox - gx, hn.ey + HC.oy - gy) < HC.R * 0.8;
      }
      if (covered) continue;
      var gk = Math.floor(GN.ex / cell) + ',' + Math.floor(GN.ey / cell);
      if (!cellFam[gk]) cellFam[gk] = koyoFamily(r);
      var gfam = r() < KOYO.patchiness ? cellFam[gk] : koyoFamily(r);
      if (gfam === 'evergreen' && GN.d >= maxD - 1) gfam = 'red';
      T.clumps.push({ node: g, R: fillR, fam: gfam, back: GN.d < maxD - 1, seed: (r() * 4294967296) >>> 0,
                      ox: gx - GN.ex, oy: gy - GN.ey - fillR * 0.2, ph: r() * TAU, bakedV: -1 });
    }
  }
  // back clumps first, then low to high so the top of the canopy sits in front
  T.clumps.sort(function(a, b) {
    if (a.back !== b.back) return a.back ? -1 : 1;
    return nodes[b.node].ey - nodes[a.node].ey;
  });
  // Keep within the width limit (outer leaves reach ~1.25 R): first slide the
  // trunk partly past the screen edge (at most 8% of the width), then squeeze
  // the spread toward the trunk for whatever is still too wide.
  var limit = KOYO.maxWidth / 100 * W, k = 1, over = 0;
  T.clumps.forEach(function(C) {
    var cn = nodes[C.node];
    over = Math.max(over, (left ? cn.ex : W - cn.ex) + C.R * 1.25 - limit);
  });
  var slide = Math.min(over, Math.max(0, (left ? bx : W - bx) - W * 0.03));   // the trunk's foot always stays on the screen
  if (slide > 0) {
    bx += left ? -slide : slide;
    T.bx = bx;
    nodes.forEach(function(nd) { nd.sx += left ? -slide : slide; nd.ex += left ? -slide : slide; });
  }
  T.clumps.forEach(function(C) {
    var cn = nodes[C.node], dx = left ? cn.ex - bx : bx - cn.ex;
    var room = (left ? limit - bx : limit - (W - bx)) - C.R * 1.25;
    if (dx > 0 && dx * k > room) k = Math.max(0.3, room / dx);
  });
  T.k = k;
  // where the canopy sits, for the night glow
  var sx = 0, sy = 0, top = H, bot = 0;
  T.clumps.forEach(function(C) {
    var cn = nodes[C.node];
    sx += koyoX(T, cn.ex); sy += cn.ey; top = Math.min(top, cn.ey - C.R); bot = Math.max(bot, cn.ey + C.R);
  });
  var nc = T.clumps.length || 1;
  T.cx = sx / nc; T.cy = sy / nc; T.cr = Math.max(40, (bot - top) * 0.75);
  if (!lazy) T.clumps.forEach(function(C) { bakeClump(C, far); });   // lazy (during the name): baked a few per frame by bakePendingClumps
  return T;
}
function koyoX(T, x) { return T.bx + (x - T.bx) * T.k; }   // the width squeeze
/* A leaf drops from a random clump; it falls at that tree's depth. */
function dropKoyoLeaf(T, vx) {
  if (!T || !T.clumps.length) return;
  var C = T.clumps[Math.floor(Math.random() * T.clumps.length)], n = T.nodes[C.node];
  spawnLeaf({ x: koyoX(T, n.ex + C.ox), y: n.ey + C.oy, z: T.far ? rnd(0.2, 0.45) : rnd(S.frontLeafMinZ, 1),
              vx: vx !== undefined ? vx : ENV.windPx * 0.4, force: vx !== undefined });
}
/* Re-draw a few clumps per frame after the light changed. */
function rebakeClumps(budget) {
  [tree, farTree].forEach(function(T) {
    if (!T || !T.koyo) return;
    for (var i = 0; i < T.clumps.length && budget > 0; i++) {
      if (T.clumps[i].bakedV !== lookVersion) { bakeClump(T.clumps[i], T.far); budget--; }
    }
  });
}
/* During the name: bake the clumps still waiting for about ms milliseconds
   (at least one; Infinity bakes them all). True when none are left. Each one
   is also drawn once onto a 1-pixel canvas: the browser only really paints a
   sprite the first time it is used, and otherwise would paint all of them in
   the scene's first frame. */
var clumpWarm = document.createElement('canvas');
clumpWarm.width = clumpWarm.height = 1;
var ctxWarm = clumpWarm.getContext('2d');
function bakePendingClumps(ms) {
  var t0 = performance.now(), done = true;
  [tree, farTree].forEach(function(T) {
    if (!T || !T.koyo) return;
    for (var i = 0; i < T.clumps.length; i++) {
      var C = T.clumps[i];
      if (C.bakedV === lookVersion) continue;
      if (performance.now() - t0 > ms) { done = false; return; }
      bakeClump(C, T.far);
      ctxWarm.drawImage(C.cnv, 0, 0, 1, 1);
    }
  });
  return done;
}
/* The branches, solid: their soft look comes from mixing the bark toward the
   paper colour by the strength they used to be laid down at, so nothing (the
   mountains) shows through the trunk. Each branch tapers from its own
   thickness to the thickness of the branches that grow from it, with a round
   joint at the fork, so there are no steps (notches) at the forks. The tapers
   and the joints are two fills: in one path, where they overlap with opposite
   winding the canvas would leave a hole. */
function fillKoyoBranches(c, T, strength) {
  var bark = T.far ? mixRgb(KOYO_BARK, KOYO_PAPER, KOYO.farHaze) : KOYO_BARK;
  bark = koyoLight(mixRgb(bark, KOYO_PAPER, 1 - strength));
  bark = mixRgb(bark, [150, 96, 70], koyoNight() * KOYO.nightGlow * 0.4);   // trunks catch the lamp light
  var ns = T.nodes, i, n;
  function endW(n) { return (n.d >= T.maxD ? n.w * 0.55 : Math.max(0.8, n.w * 0.62)) / 2; }
  var night = koyoNight(), lx = KOYO.lightFrom * lerp(1, 0.5, night), ly = lerp(-0.85, 0.8, night), ll = Math.hypot(lx, ly);
  lx /= ll; ly /= ll;                              // towards the light: the same as for the leaves
  var mid = rgba(bark), hi = scaleRgb(mixRgb(scaleRgb(bark, 1.25), KOYO_PAPER, 0.18), 1), lo = scaleRgb(bark, 0.55);
  if (!T.limbs) T.limbs = koyoLimbs(T);
  var THICK = Math.max(5, T.scale * 0.0075), thin = [];
  // thin twigs first: flat, in one path (a fill each for the tapers and the joints: where they overlap with
  // opposite winding the canvas would leave a hole)
  c.fillStyle = mid;
  c.beginPath();
  for (i = 0; i < ns.length; i++) {
    n = ns[i];
    if (n.w >= THICK) continue;
    thin.push(n);
    var v0 = n.w / 2, v1 = endW(n);
    var ax = koyoX(T, n.sx), ay = n.sy, bx = koyoX(T, n.ex), by = n.ey;
    var ex = bx - ax, ey = by - ay, el = Math.hypot(ex, ey) || 1, qx = -ey / el, qy = ex / el;
    c.moveTo(ax + qx * v0, ay + qy * v0);
    c.lineTo(bx + qx * v1, by + qy * v1);
    c.lineTo(bx - qx * v1, by - qy * v1);
    c.lineTo(ax - qx * v0, ay - qy * v0);
    c.closePath();
  }
  c.fill();
  c.beginPath();
  for (i = 0; i < thin.length; i++) {
    n = thin[i];
    if (n.d >= T.maxD) continue;                  // a twig's tip has no fork, so no joint
    var r = endW(n), jx = koyoX(T, n.ex);
    c.moveTo(jx + r, n.ey);
    c.arc(jx, n.ey, r, 0, TAU);
  }
  c.fill();
  // The thick limbs are each one smooth, tapering curve (see koyoLimbs). The
  // thinner limbs go under the thicker ones, so every branch comes out from
  // behind the one it grows from, with no joints or flat ends showing.
  function paintLimb(S, roundEnd) { paintBark(c, S, roundEnd, mid, hi, lo, lx, ly); }
  for (var li = 0; li < T.limbs.length; li++) {
    var L = T.limbs[li], vx = [], vy = [], hw = [];
    for (var k = 0; k < L.length; k++) {
      n = ns[L[k]];
      if (k === 0) { vx.push(koyoX(T, n.sx)); vy.push(n.sy); hw.push(n.w / 2); }
      vx.push(koyoX(T, n.ex)); vy.push(n.ey); hw.push(endW(n));
    }
    paintLimb(smoothLimb(vx, vy, hw), true);
  }
}
/* The thick part of the tree as limbs: from each fork the "leader" (the child
   running most nearly straight on) carries the limb on; the other children
   start limbs of their own. Deepest first, so the trunk is drawn last. The
   tree's shape never changes (only its sway), so this is made once. */
function koyoLimbs(T) {
  var ns = T.nodes, THICK = Math.max(5, T.scale * 0.0075), kids = [], limbs = [], i;
  for (i = 0; i < ns.length; i++) kids[i] = [];
  for (i = 0; i < ns.length; i++) if (ns[i].p >= 0) kids[ns[i].p].push(i);
  function lead(list, par) {
    var best = -1, bd = Infinity;
    list.forEach(function (j) {
      if (ns[j].w < THICK) return;
      var d = Math.abs(Math.atan2(Math.sin(ns[j].abs - par.abs), Math.cos(ns[j].abs - par.abs)));
      if (d < bd) { bd = d; best = j; }
    });
    return best;
  }
  function walk(start) {
    var limb = [start], cur = start;
    for (;;) {
      var nx = lead(kids[cur], ns[cur]);
      kids[cur].forEach(function (j) { if (j !== nx && ns[j].w >= THICK) walk(j); });
      if (nx < 0) break;
      limb.push(nx); cur = nx;
    }
    limbs.push(limb);
  }
  for (i = 0; i < ns.length; i++) if (ns[i].p < 0 && ns[i].w >= THICK) walk(i);
  limbs.sort(function (a, b) { return ns[b[0]].d - ns[a[0]].d; });
  return limbs;
}
/* A smooth curve through the corners of a limb: it follows the straight pieces
   but rounds each corner off (quadratic curves between the pieces' middles).
   The half-width is given at each corner and fades smoothly along the curve.
   Returns samples { x, y, hw, nx, ny }. */
function smoothLimb(vx, vy, hw) {
  var m = vx.length - 1, px = [vx[0]], py = [vy[0]], k, j;
  function mid2(a, b) { return (a + b) / 2; }
  if (m >= 2) {
    px.push(mid2(vx[0], vx[1])); py.push(mid2(vy[0], vy[1]));
    for (k = 1; k < m; k++) {
      var sx = mid2(vx[k - 1], vx[k]), sy = mid2(vy[k - 1], vy[k]), ex = mid2(vx[k], vx[k + 1]), ey = mid2(vy[k], vy[k + 1]);
      for (j = 1; j <= 6; j++) {
        var t = j / 6, u = 1 - t;
        px.push(u * u * sx + 2 * u * t * vx[k] + t * t * ex);
        py.push(u * u * sy + 2 * u * t * vy[k] + t * t * ey);
      }
    }
  } else {
    px.push(mid2(vx[0], vx[1])); py.push(mid2(vy[0], vy[1]));
  }
  px.push(vx[m]); py.push(vy[m]);
  // where along the curve each corner is (by the length of the straight pieces), to fade the width
  var pos = [0], tot = 0;
  for (k = 1; k <= m; k++) { tot += Math.hypot(vx[k] - vx[k - 1], vy[k] - vy[k - 1]); pos.push(tot); }
  var cum = [0], clen = 0, S = [];
  for (k = 1; k < px.length; k++) { clen += Math.hypot(px[k] - px[k - 1], py[k] - py[k - 1]); cum.push(clen); }
  var seg = 1;
  for (k = 0; k < px.length; k++) {
    var d = clen > 0 ? cum[k] / clen * tot : 0;
    while (seg < m && pos[seg] < d) seg++;
    var f = pos[seg] > pos[seg - 1] ? clamp((d - pos[seg - 1]) / (pos[seg] - pos[seg - 1]), 0, 1) : 0;
    var dx = (px[Math.min(k + 1, px.length - 1)] - px[Math.max(k - 1, 0)]), dy = (py[Math.min(k + 1, px.length - 1)] - py[Math.max(k - 1, 0)]), dl = Math.hypot(dx, dy) || 1;
    S.push({ x: px[k], y: py[k], hw: lerp(hw[seg - 1], hw[seg], f), nx: -dy / dl, ny: dx / dl });
  }
  return S;
}
/* One limb: its outline in the bark colour, then soft shading laid on in a few
   thin layers. Which edge is dark and which is lit follows the direction the
   limb is running at that point (no switching, so nothing jumps along it). */
function paintBark(c, S, roundEnd, mid, hi, lo, lx, ly) {
  var i, n = S.length, e = S[n - 1];
  function edge(off, rev) {
    for (var q = 0; q < n; q++) {
      var P = S[rev ? n - 1 - q : q], o = off(rev ? n - 1 - q : q);
      c.lineTo(P.x + P.nx * P.hw * o, P.y + P.ny * P.hw * o);
    }
  }
  function band(o0, o1, col, alpha) {
    c.beginPath();
    c.moveTo(S[0].x + S[0].nx * S[0].hw * o0(0), S[0].y + S[0].ny * S[0].hw * o0(0));
    edge(o0, false);
    edge(o1, true);
    c.closePath();
    c.fillStyle = rgba(col, alpha);
    c.fill();
  }
  c.fillStyle = mid;
  c.beginPath();
  c.moveTo(S[0].x + S[0].nx * S[0].hw, S[0].y + S[0].ny * S[0].hw);
  edge(function () { return 1; }, false);
  if (roundEnd) c.arc(e.x, e.y, e.hw, Math.atan2(e.ny, e.nx), Math.atan2(-e.ny, -e.nx), true);
  edge(function () { return -1; }, true);
  c.closePath();
  c.fill();
  function t(q) { return S[q].nx * lx + S[q].ny * ly; }   // 1: the +normal side faces the light
  // dark edges: wider on the side away from the light
  for (i = 0; i < 3; i++) {
    var k = 1 - i * 0.3;
    band(function (q) { return 1 - (0.12 + 0.6 * Math.max(0, -t(q))) * k; }, function () { return 1; }, lo, 0.22);
    band(function (q) { return -1 + (0.12 + 0.6 * Math.max(0, t(q))) * k; }, function () { return -1; }, lo, 0.22);
  }
  // a soft highlight on the lit side, close to its edge (never along the middle: a stripe
  // down the middle of a trunk looks like a seam). It narrows away to nothing where the limb
  // runs along the light, so it never has to jump from one side to the other.
  function lean(q) { return clamp(t(q) * 4, -1, 1); }
  for (i = 0; i < 3; i++) {
    var w = 0.26 - i * 0.08;
    band(function (q) { return 0.6 * lean(q) - w * Math.abs(lean(q)); }, function (q) { return 0.6 * lean(q) + w * Math.abs(lean(q)); }, hi, 0.14);
  }
}
function drawKoyoClumps(c, T, t) {
  var ns = T.nodes;
  for (var i = 0; i < T.clumps.length; i++) {
    var C = T.clumps[i], n = ns[C.node];
    if (!C.cnv) continue;
    var rot = (n.cur - n.abs) * 0.6 + Math.sin(t * 0.9 + C.ph) * 0.015 * S.treeSway;
    c.save();
    c.translate(koyoX(T, n.ex + C.ox), n.ey + C.oy);
    c.rotate(rot);
    c.drawImage(C.cnv, -C.half, -C.half, C.half * 2, C.half * 2);
    c.restore();
  }
}
/* Night: a soft warm pool of lamp light under each lit canopy. */
function koyoGlow(ctx, T, strength) {
  var a = koyoNight() * KOYO.nightGlow * strength;
  if (a <= 0.01 || !T.clumps.length) return;
  ctx.setTransform(PR, 0, 0, PR, 0, 0);
  ctx.globalAlpha = 1;
  var gy = T.cy + T.cr * 0.25, g = ctx.createRadialGradient(T.cx, gy, 0, T.cx, gy, T.cr * 1.3);
  g.addColorStop(0, 'rgba(255,184,110,' + (0.32 * a).toFixed(3) + ')');
  g.addColorStop(0.5, 'rgba(255,170,96,' + (0.14 * a).toFixed(3) + ')');
  g.addColorStop(1, 'rgba(255,160,90,0)');
  ctx.fillStyle = g;
  ctx.fillRect(T.cx - T.cr * 1.4, gy - T.cr * 1.4, T.cr * 2.8, T.cr * 2.8);
}
/* The trees' layers, built at the top of the frame (before the sky): the
   fireworks, the bamboo and the birds behind them are cut by them. */
function buildKoyoLayers(t) {
  if (farTree) {
    // the far tree's branches go down solid, at half size and scaled up (soft),
    // and its foliage on a half-size layer laid down at the far strength
    ctxFB.setTransform(1, 0, 0, 1, 0, 0);
    ctxFB.clearRect(0, 0, farBranchLayer.width, farBranchLayer.height);
    ctxFB.setTransform(PR * FAR_LAYER_SCALE, 0, 0, PR * FAR_LAYER_SCALE, 0, 0);
    fillKoyoBranches(ctxFB, farTree, KOYO.branchOpacity * KOYO.farOpacity);
    ctxFar.setTransform(1, 0, 0, 1, 0, 0);
    ctxFar.clearRect(0, 0, farLayer.width, farLayer.height);
    ctxFar.setTransform(PR * FAR_LAYER_SCALE, 0, 0, PR * FAR_LAYER_SCALE, 0, 0);
    drawKoyoClumps(ctxFar, farTree, t);
  }
  if (tree) {
    // solid branches, and the foliage on its own layer laid down at its strength
    ctxT.setTransform(1, 0, 0, 1, 0, 0);
    ctxT.clearRect(0, 0, treeLayer.width, treeLayer.height);
    ctxT.setTransform(PR, 0, 0, PR, 0, 0);
    fillKoyoBranches(ctxT, tree, KOYO.branchOpacity);
    ctxKL.setTransform(1, 0, 0, 1, 0, 0);
    ctxKL.clearRect(0, 0, koyoLeafLayer.width, koyoLeafLayer.height);
    ctxKL.setTransform(PR, 0, 0, PR, 0, 0);
    drawKoyoClumps(ctxKL, tree, t);
  }
}
function drawKoyoTrees(ctx, t) {
  birdBox = birdBounds();
  // (The trees' layers were built at the top of the frame, buildKoyoLayers.)
  var farCut = farTree ? [[farBranchLayer, 1], [farLayer, 3]] : [], nearCut = tree ? [[treeLayer, 1], [koyoLeafLayer, 3]] : [];
  renderBamboo(t);
  var gFar = bambooGrove('far'), gNear = bambooGrove('near');
  if (gFar) {                                     // the bamboo behind the far tree (and the near tree, where it reaches it)
    bamGlow(ctx, gFar);                           // at night, the lamps' pool of light behind it
    if (gFar.fresh) {                             // the trees are cut out when it is redrawn; in between it is laid down as it was
      var reach = (KOYO.maxWidth / 100 + 0.12) * W * PR * BAM_RES, fb = gFar.box;
      var meets = tree && (tree.left ? fb.x < reach : fb.x + fb.w > gFar.out.cnv.width - reach);
      bamCutOut(gFar, meets ? farCut.concat(nearCut) : farCut);
    }
    bamLayDown(ctx, gFar);
  }
  torDrawGates(ctx);                              // the line of torii gates, standing on the path, behind the far tree
  if (farTree) {
    koyoGlow(ctx, farTree, 0.6);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(farBranchLayer, 0, 0, farBranchLayer.width, farBranchLayer.height, 0, 0, cvBack.width, cvBack.height);
    ctx.globalAlpha = KOYO.farOpacity;
    ctx.drawImage(farLayer, 0, 0, farLayer.width, farLayer.height, 0, 0, cvBack.width, cvBack.height);
  }
  if (gNear) { bamGlow(ctx, gNear); if (gNear.fresh) bamCutOut(gNear, nearCut); bamLayDown(ctx, gNear); }   // the bamboo behind the near tree
  if (tree) {
    koyoGlow(ctx, tree, 1);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.drawImage(treeLayer, 0, 0);
    ctx.globalAlpha = KOYO.nearOpacity;
    ctx.drawImage(koyoLeafLayer, 0, 0);
  }
  if (birdBox) {
    // each depth slot's birds on their own, with whatever is in front of them
    // cut out, then all of them laid down over the scene
    var B = birdBox, front = {
      fg: gFar ? [[gFar.out.cnv, BAM_RES, 2, gFar.a]] : [],
      ft: farTree ? [[farBranchLayer, FAR_LAYER_SCALE, 1, 1], [farLayer, FAR_LAYER_SCALE, 3, 1]] : [],
      ng: gNear ? [[gNear.out.cnv, BAM_RES, 2, gNear.a]] : [],
      nt: tree ? [[treeLayer, 1, 1, 1], [koyoLeafLayer, 1, 3, 1]] : []
    };
    ctxBL.setTransform(1, 0, 0, 1, 0, 0);
    ctxBL.clearRect(B.x, B.y, B.w, B.h);
    for (var so = 0; so < 4; so++) {                 // far first, then those on the gate, then the middle and the near flocks
      var si = [2, 3, 1, 0][so];
      if (!birdSlotUsed(si)) continue;
      ctxBS.setTransform(1, 0, 0, 1, 0, 0);
      ctxBS.clearRect(B.x, B.y, B.w, B.h);
      drawBirds(ctxBS, si);
      BIRD_HIDE[si].forEach(function(h) {
        front[h].forEach(function(f) { birdsCutOut(ctxBS, f[0], f[1], f[2], f[3]); });
      });
      ctxBL.drawImage(birdSlotLayer, B.x, B.y, B.w, B.h, B.x, B.y, B.w, B.h);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.drawImage(birdLayer, B.x, B.y, B.w, B.h, B.x, B.y, B.w, B.h);
  }
  ctx.setTransform(PR, 0, 0, PR, 0, 0);
  ctx.globalAlpha = 1;
}
/* ---------- Bamboo groves (autumn) — as tuned on bamboo.html ----------
   Two dense groves of bamboo (values in BAMBOO): 'far' behind the far
   (smaller) tree and 'near' behind the near (bigger) tree. The stems shoot
   in from the side of the screen on their tree's side (never seen from the
   ground), lean in toward the middle and bend over at the top. Each top
   ends between heightMin and heightMax × its tree's height above the
   tree's root, so the grove is taller than its tree, but never higher than
   topMargin below the top of the screen: a stem is shortened until its
   leaves fit, and anything a gust still takes higher fades out. Each stem
   has joints, a shine down one side and sprays of narrow hanging leaves.
   It sways on its own and with its grove; the gusts push each grove as
   they pass it (updateGusts) and it rocks back on a spring.
   Depth of field: the blur (blurNear for the nearer half of the stems,
   blurFar for the rest) and the haze toward the paper are baked into the
   pictures, once, when a grove is built (bamStemSheet, bamSpraySheet): a
   stem is drawn straight, blurred, and kept as one strip on a sheet; each
   frame it is laid along its curve as BAM_SEG slices of that strip, and
   the leaf sprays (also blurred once, on their own sheet) are placed at
   their joints. So a frame is only drawImage calls from two sheets, no
   path fills and no filters, which is cheap on the graphics chip. A grove
   is drawn at half resolution into its own canvas (G.out). The trees in
   front are then cut out of G.out, so no bamboo shows through their
   see-through foliage, and the birds use it to hide behind a grove
   (BIRD_SLOTS). The grove behind the bigger tree shows by day only: it fades
   in after sunrise and out around sunset (ENV.light.daylight); the one behind
   the smaller tree stays up through the evening and the night. At night both
   are lit from beneath like the trees: bamGlow lays a warm pool of lamp light
   behind a grove, and drawGrove tints what it has drawn, strongest at the
   bottom of the screen and fading upward (G.glow: koyoNight() ×
   KOYO.nightGlow, so it comes on with the trees' lamps). A grove is rebuilt
   when the trees change, and at most once a minute when the light changes
   (then one grove a frame); one not showing (the bigger tree's at night) is
   not built.
   Every BAMBOO_EVERY-th frame each grove is redrawn (1: every frame; 2: the
   two in turn, each at half the rate). */
var BAMBOO_COLOURS = {
  culm: '#9DBE78', culmLit: '#DDEBB4', culmShade: '#4E6E3C', node: '#55703F', ring: '#E9F0D2',
  yellow: '#C9C98A', leaf: '#6FA83E', leafDark: '#355F2A', twig: '#7C8F55'
};
var BAMBOO = {
  far: {
    show: true, culms: 13, seed: 48, entryTop: 0.52, entryBottom: 0.92, heightMin: 1.15, heightMax: 1.5, topMargin: 0.04,
    lean: 24, leanVariety: 0.5, arch: 0.35,
    thickness: 12.5, taper: 0.6, nodeSpacing: 0.08, nodeMark: 0.8, highlight: 0.1, colourVariety: 1, colours: BAMBOO_COLOURS,
    leafiness: 1, leafFrom: 0.3, leafSize: 1.15, leafDroop: 1.6,
    blurNear: 1.6, blurFar: 3, haze: 0.28, depthHaze: 0.32, strength: 1,
    swayAmount: 1, swaySpeed: 1, swayVariety: 0.6, tipWhip: 2, gustResponse: 1, gustSpring: 1, leafFlutter: 1
  },
  near: {
    show: true, culms: 16, seed: 45, entryTop: 0.23, entryBottom: 0.97, heightMin: 1.41, heightMax: 1.4, topMargin: 0.04,
    lean: 32, leanVariety: 0.45, arch: 0.55,
    thickness: 12.5, taper: 0.6, nodeSpacing: 0.08, nodeMark: 0.8, highlight: 0.1, colourVariety: 1, colours: BAMBOO_COLOURS,
    leafiness: 1.9, leafFrom: 0.22, leafSize: 1.15, leafDroop: 1.8,
    blurNear: 0.5, blurFar: 1.3, haze: 0.22, depthHaze: 0.3, strength: 1,
    swayAmount: 1, swaySpeed: 1, swayVariety: 0.6, tipWhip: 2, gustResponse: 1, gustSpring: 1, leafFlutter: 2.1
  }
};
var BAM_RES = 0.5, BAM_SEG = 22;                 // half resolution (as the far tree); segments along each stem
var BAMBOO_EVERY = 1;                            // each grove is redrawn every this many frames (the groves in turn when above 1)
var bambooFrame = 0;
var bambooGroves = [], bambooKey = '', bambooLook = -1, bambooBuiltAt = -1e9;
function bamCanvas() { var c = document.createElement('canvas'); return { cnv: c, c: c.getContext('2d') }; }
/* How strongly a grove shows: the one behind the smaller tree (far) all day
   and night, the one behind the bigger tree (near) with the daylight. */
/* The grove behind the smaller tree stays through the evening and the night; the one behind the
   bigger tree is there by day only, gone by the time the golden hour (the evening) has begun. */
function bambooAlpha(key) {
  if (ENV.scene !== 'autumn' || !ENV.light) return 0;
  if (key === 'far') return 1;
  return ENV.light.daylight * (1 - smooth(ENV.sun.set - 1.6, ENV.sun.set - 0.9, S.hour));
}
/* The colours the bamboo is drawn in. At night they are lit like the far tree's
   foliage, only a little less (the lamps' own light is laid on top, bamGlow and
   drawGrove). */
function bamTone(c, haze) { return koyoLight(mixRgb(c, KOYO_PAPER, clamp(haze, 0, 0.95)), KOYO.nightGlow * 0.3); }
/* From a tree's root to the top of its leaves. */
function bamTreeHeight(T) {
  var top = T.by;
  T.nodes.forEach(function(n) { top = Math.min(top, n.ey); });
  T.clumps.forEach(function(C) { top = Math.min(top, T.nodes[C.node].ey + C.oy - C.R); });
  return T.by - top;
}
/* One leaf spray, in two steps. Its shape (bamSprayShape) takes the random
   numbers in the same order as ever, so every arrangement stays as tuned; it
   is then drawn (bamSprayDraw) once for each look it is needed in. A thin
   twig along +x with narrow leaves hanging from it, u (CSS px) long. */
function bamSprayShape(B, r, u) {
  var tx = u * lerp(0.5, 0.75, r()), ty = u * lerp(0.05, 0.2, r()) * B.leafDroop;
  var S2 = { u: u, tx: tx, ty: ty, cx: tx * 0.5, cy: -u * 0.05, leaves: [] };
  var n = 4 + Math.floor(r() * 4);
  for (var i = 0; i < n; i++) {
    var p = lerp(0.3, 1, i / (n - 1)), q = 1 - p;
    var L = u * lerp(0.3, 0.48, r()), lw = L * lerp(0.1, 0.14, r());
    var ang = clamp((lerp(0.25, 1.2, r()) - (i === n - 1 ? 0.2 : 0)) * B.leafDroop, -0.3, 1.5);
    S2.leaves.push({ x: 2 * q * p * S2.cx + p * p * tx, y: 2 * q * p * S2.cy + p * p * ty, L: L, lw: lw, ang: ang, t: r() });
  }
  return S2;
}
/* Drawn at k device px to the CSS px with pad device px round it, its root at
   (ox, oy) CSS px from the top left of the image. */
function bamSprayDraw(g, B, S2, haze, k, pad, ox, oy) {
  var Cl = hexToRgb(B.colours.leaf), Cd = hexToRgb(B.colours.leafDark), Ct = hexToRgb(B.colours.twig);
  g.setTransform(k, 0, 0, k, pad, pad);
  g.translate(ox, oy);
  g.strokeStyle = rgba(bamTone(Ct, haze)); g.lineWidth = Math.max(0.6, S2.u * 0.012); g.lineCap = 'round';
  g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(S2.cx, S2.cy, S2.tx, S2.ty); g.stroke();
  for (var i = 0; i < S2.leaves.length; i++) {
    var l = S2.leaves[i];
    g.save(); g.translate(l.x, l.y); g.rotate(l.ang);
    g.fillStyle = rgba(bamTone(mixRgb(Cd, Cl, l.t), haze));
    g.beginPath(); g.moveTo(0, 0);
    g.bezierCurveTo(l.L * 0.15, -l.lw, l.L * 0.55, -l.lw * 0.8, l.L, 0);
    g.bezierCurveTo(l.L * 0.55, l.lw * 0.8, l.L * 0.15, l.lw, 0, 0);
    g.fill(); g.restore();
  }
}
/* All the sprays on one sheet, each blurred for its depth. A stem is on layer
   0 (the nearer half: blurNear) or layer 1 (blurFar) and in haze band 0-2, so
   a spray has one of four looks: (layer 0, band 0), (0, 1), (1, 1), (1, 2),
   look = layer * 2 + band - layer; four variants of each (shapes[band][v]).
   sheet[look][v]: { cnv, sx, sy, sw, sh, ox, oy, w, h } to drawImage from. */
function bamSpraySheet(B, shapes, u, k) {
  var looks = [[0, 0], [0, 1], [1, 1], [1, 2]], ox = u * 0.04, oy = u * 0.3;
  var pad = Math.ceil(Math.max(B.blurNear, B.blurFar) * k * 3) + 1;
  var cw = Math.ceil(u * 1.4 * k) + 2 * pad + 1, ch = Math.ceil(u * 1.35 * k) + 2 * pad + 1;
  var sheet = document.createElement('canvas'); sheet.width = cw * 4; sheet.height = ch * 4;
  var sc = sheet.getContext('2d'), tmp = document.createElement('canvas'); tmp.width = cw; tmp.height = ch;
  var tc = tmp.getContext('2d'), out = [];
  looks.forEach(function(lk, li) {
    var blur = (lk[0] === 0 ? B.blurNear : B.blurFar) * k, haze = B.haze + B.depthHaze * lk[1] / 2;
    out.push([]);
    for (var v = 0; v < 4; v++) {
      tc.setTransform(1, 0, 0, 1, 0, 0); tc.clearRect(0, 0, cw, ch);
      bamSprayDraw(tc, B, shapes[lk[1]][v], haze, k, pad, ox, oy);
      sc.filter = blur > 0.05 ? 'blur(' + blur.toFixed(2) + 'px)' : 'none';
      sc.drawImage(tmp, v * cw, li * ch);
      sc.filter = 'none';
      out[li].push({ cnv: sheet, sx: v * cw, sy: li * ch, sw: cw, sh: ch, ox: ox + pad / k, oy: oy + pad / k, w: cw / k, h: ch / k });
    }
  });
  return out;
}
function bamNewSpray(r, s, side, tip, cs) {
  return { s: s, side: side, spread: tip ? lerp(0.15, 0.45, r()) : lerp(0.7, 1.2, r()),
           sc: lerp(0.75, 1.15, r()) * lerp(0.8, 1, cs), v: Math.floor(r() * 4), ph: r() * TAU };
}
function buildBambooGrove(key, T, old) {
  var B = BAMBOO[key], cw = Math.round(W * PR), ch = Math.round(H * PR);
  var out = bamCanvas();                          // the grove, as drawn (half resolution)
  out.cnv.width = Math.ceil(cw * BAM_RES); out.cnv.height = Math.ceil(ch * BAM_RES);
  var r = rngFrom(B.seed * 977 + 13), k = PR * BAM_RES, u = H * 0.075 * B.leafSize;
  var shapes = [];                                // 3 haze bands of 4 sprays, as ever
  for (var band = 0; band < 3; band++) {
    shapes.push([]);
    for (var v = 0; v < 4; v++) shapes[band].push(bamSprayShape(B, r, u));
  }
  var treeH = bamTreeHeight(T), root = T.by, left = T.left, prev = null;
  old.forEach(function(o) { if (o.key === key) prev = o; });
  var G = { key: key, B: B, left: left, x: left ? W * 0.15 : W * 0.85, gust: prev ? prev.gust : 0, gustV: prev ? prev.gustV : 0,
            gid: prev ? prev.gid : -1, ph: r() * TAU, culms: [], out: out, sprays: null, stems: null, u: u, a: 0, box: null };
  for (var i = 0; i < B.culms; i++) {
    var d = r();                                   // 0 nearest … 1 furthest back
    var lean = (B.lean * PI / 180) * (1 + (r() - 0.5) * 1.6 * B.leanVariety) + (r() - 0.5) * 0.12 * B.leanVariety;
    var cs = lerp(1, 0.55, d);
    // where it crosses the edge of the screen; it starts just outside
    var y0 = H * lerp(B.entryTop, Math.max(B.entryTop, B.entryBottom), r()), out = 3 + r() * W * 0.015;
    // where its top should end: above its tree, below the top of the screen
    // (the tops that would go past the limit are spread a little below it instead of all on one line)
    var want = root - treeH * lerp(B.heightMin, Math.max(B.heightMin, B.heightMax), r()), limit = H * B.topMargin;
    var topY = want >= limit ? want : limit + r() * H * 0.1;
    var arch = B.arch * lerp(0.7, 1.3, r());
    var yell = r() < 0.5, shade = r();
    var base = mixRgb(hexToRgb(B.colours.culm), hexToRgb(yell ? B.colours.yellow : B.colours.culmShade), B.colourVariety * shade * (yell ? 0.8 : 0.45));
    var haze = B.haze + B.depthHaze * d;
    var C = {
      x: left ? -out : W + out, y: y0, inward: left ? 1 : -1, lean: lean, arch: arch, len: 1, d: d,
      w: B.thickness / 2 * cs, band: Math.round(d * 2), layer: d < 0.5 ? 0 : 1,
      body: rgba(bamTone(base, haze)),
      lit: rgba(bamTone(mixRgb(base, hexToRgb(B.colours.culmLit), 0.7), haze)),
      dark: rgba(bamTone(mixRgb(base, hexToRgb(B.colours.culmShade), 0.75), haze)),
      node: rgba(bamTone(hexToRgb(B.colours.node), haze)), ring: rgba(bamTone(hexToRgb(B.colours.ring), haze)),
      f: lerp(0.75, 1.25, r()), rp: r(), rp2: r(), gk: lerp(0.75, 1.25, r()),
      nodes: [], sprays: [], px: new Float32Array(BAM_SEG + 1), py: new Float32Array(BAM_SEG + 1), pa: new Float32Array(BAM_SEG + 1),
      pc: new Float32Array(BAM_SEG), ps: new Float32Array(BAM_SEG)      // cos and sin of each segment's direction
    };
    // its length: what brings its top, standing still, up to topY
    var rise = 0;
    for (var si = 0; si < BAM_SEG; si++) { var sm = (si + 0.5) / BAM_SEG; rise -= Math.sin(-PI / 2 + C.inward * (lean + arch * sm * sm)) / BAM_SEG; }
    C.len = Math.max(H * 0.06, y0 - topY) / Math.max(0.2, rise);
    // joints, a little further apart toward the middle of the stem
    for (var s = B.nodeSpacing * lerp(0.4, 1, r()); s < 0.99; s += B.nodeSpacing * lerp(0.85, 1.15, r()) * (0.75 + 0.5 * Math.sin(PI * s))) C.nodes.push(s);
    // leaf sprays at the joints on the upper part, on alternating sides, and a tuft at the top
    var sd = r() < 0.5 ? 1 : -1;
    for (var j = 0; j < C.nodes.length; j++) {
      var sj = C.nodes[j];
      if (sj < B.leafFrom) continue;
      var up = (sj - B.leafFrom) / Math.max(0.05, 1 - B.leafFrom);
      for (var nn = B.leafiness * lerp(0.6, 1.3, up); nn > 0; nn -= 1) {
        if (r() < nn) C.sprays.push(bamNewSpray(r, sj, sd, false, cs));
        sd = -sd;
      }
    }
    if (B.leafiness > 0) for (var tq = 0; tq < 3; tq++) C.sprays.push(bamNewSpray(r, lerp(0.95, 1, r()), tq % 2 ? 1 : -1, true, cs));
    // then shorter, if its leaves would reach higher than topMargin
    for (var it = 0; it < 4; it++) {
      bamShape(C, G, 0, true);
      var hi = bamHighest(C, u), lim = H * B.topMargin + H * 0.015;   // a little room for the sway and the blur
      if (hi >= lim) break;
      C.len *= Math.max(0.3, (C.y - lim) / (C.y - hi));
    }
    G.culms.push(C);
  }
  G.culms.sort(function(a, b) { return b.d - a.d; });   // further back first
  G.sprays = bamSpraySheet(B, shapes, u, k);
  bamStemSheet(G, k);
  return G;
}
/* Each stem is drawn once, straight and along +x (stem, shine, joints), blurred
   for its depth and kept as one strip on a sheet (G.stems). Every frame it is
   laid along its curve in BAM_SEG slices of that strip (bamDrawGrove). The
   strip is a whole number of device pixels per slice, so the slices cut
   cleanly. */
function bamStemSheet(G, k) {
  var B = G.B, items = [], atW = 4, atH = 0, maxH = 4;
  G.culms.forEach(function(C) {
    var blur = (C.layer === 0 ? B.blurNear : B.blurFar) * k, pad = Math.ceil(blur * 3) + 2;
    var sliceW = Math.max(3, Math.round(C.len * k / BAM_SEG)), w = sliceW * BAM_SEG + 2 * pad + 1;
    var h = Math.ceil(2 * (C.w * 1.08 + 1) * k) + 2 * pad;
    items.push({ C: C, blur: blur, pad: pad, sliceW: sliceW, w: w, h: h, y: atH });
    atW = Math.max(atW, w); maxH = Math.max(maxH, h); atH += h + 1;
  });
  var sheet = document.createElement('canvas'); sheet.width = atW; sheet.height = Math.max(1, atH);
  var sc = sheet.getContext('2d'), tmp = document.createElement('canvas'); tmp.width = atW; tmp.height = maxH;
  var tc = tmp.getContext('2d');
  items.forEach(function(it) {
    var C = it.C, step = C.len / BAM_SEG, T = { w: C.w, nodes: C.nodes, body: C.body, dark: C.dark, lit: C.lit, node: C.node, ring: C.ring,
      px: new Float32Array(BAM_SEG + 1), py: new Float32Array(BAM_SEG + 1), pa: new Float32Array(BAM_SEG + 1) };
    for (var j = 0; j <= BAM_SEG; j++) T.px[j] = j * step;                  // straight, along +x
    tc.setTransform(1, 0, 0, 1, 0, 0); tc.clearRect(0, 0, it.w, it.h);
    tc.setTransform(it.sliceW * BAM_SEG / C.len, 0, 0, k, it.pad, it.h / 2);   // its length in whole slices of device pixels
    bamDrawStem(tc, B, T);
    sc.filter = it.blur > 0.05 ? 'blur(' + it.blur.toFixed(2) + 'px)' : 'none';
    sc.drawImage(tmp, 0, 0, it.w, it.h, 0, it.y, it.w, it.h);
    sc.filter = 'none';
    C.sy = it.y; C.sPad = it.pad; C.sW = it.sliceW; C.sH = it.h;
    C.sUx = step / it.sliceW;                                              // CSS px along the stem per picture px
  });
  G.stems = sheet;
}
/* The groves that show, when the trees or the size change, or (at most once a
   minute) the light. Only with both trees there; a grove that is not showing
   (the bigger tree's at night) is left alone. */
function ensureBamboo() {
  if (!tree || !farTree || ENV.scene !== 'autumn') return;
  var key = tree.key + '|' + farTree.key + '|' + PR, now = performance.now() / 1000;
  if (key !== bambooKey) {                              // new trees or a new size: afresh
    bambooKey = key; bambooGroves = []; bambooLook = lookVersion; bambooBuiltAt = now;
  }
  // the light has moved on: re-baked in its colours at most once a minute, one grove a frame
  if (bambooLook !== lookVersion && now - bambooBuiltAt >= 60) { bambooLook = lookVersion; bambooBuiltAt = now; }
  var rebaked = false;
  ['far', 'near'].forEach(function(k) {
    if (bambooAlpha(k) <= 0) return;                    // not showing: not built
    var at = -1, i, G;
    for (i = 0; i < bambooGroves.length; i++) if (bambooGroves[i].key === k) at = i;
    G = at < 0 ? null : bambooGroves[at];
    if (G && (G.look === bambooLook || rebaked)) return;
    var ng = buildBambooGrove(k, k === 'far' ? farTree : tree, bambooGroves);
    ng.look = bambooLook;
    if (at < 0) bambooGroves.push(ng); else { bambooGroves[at] = ng; rebaked = true; }
  });
}
function bambooGrove(key) {
  for (var i = 0; i < bambooGroves.length; i++) if (bambooGroves[i].key === key && bambooGroves[i].a > 0 && bambooGroves[i].box) return bambooGroves[i];
  return null;
}
function bamSway(dt) {
  bambooGroves.forEach(function(G) {
    var ks = 6 * G.B.gustSpring, cs = 1.5 * Math.sqrt(G.B.gustSpring);
    G.gustV += (-ks * G.gust - cs * G.gustV) * dt;
    G.gust = clamp(G.gust + G.gustV * dt, -0.3, 0.3);
  });
}
/* The highest point of a stem and its leaves (roughly: how far each spray
   reaches up from where it grows). */
function bamHighest(C, u) {
  var top = C.py[BAM_SEG];
  for (var i = 0; i < C.sprays.length; i++) {
    var S2 = C.sprays[i], q = bamAt(C, S2.s);
    top = Math.min(top, q.y - u * S2.sc * 1.45 * Math.max(0.4, -Math.sin(q.a + S2.side * S2.spread)));
  }
  return top;
}
/* A stem's curve this frame (standing still if rest). sw is how far its top
   swings (radians from the root); tipWhip puts that bend toward the top. */
function bamShape(C, G, t, rest, wind) {
  var B = G.B, A = 0.035 * B.swayAmount * (wind || 1), sp = B.swaySpeed, vr = B.swayVariety;
  var sw = rest ? 0 : A * (Math.sin(t * 0.9 * sp * C.f + G.ph + C.rp * vr * TAU) + 0.4 * Math.sin(t * 2.1 * sp * C.f + G.ph * 1.7 + C.rp2 * vr * TAU)) +
           A * 0.6 * Math.sin(t * 0.31 * sp + G.ph) + G.gust * C.gk;
  var e = B.tipWhip - 1, step = C.len / BAM_SEG;
  function ang(s) { return -PI / 2 + C.inward * (C.lean + C.arch * s * s) + sw * B.tipWhip * Math.pow(s, e); }
  var x = C.x, y = C.y;
  for (var i = 0; i <= BAM_SEG; i++) {
    C.px[i] = x; C.py[i] = y; C.pa[i] = ang(i / BAM_SEG);
    if (i === BAM_SEG) break;
    var am = ang((i + 0.5) / BAM_SEG), co = Math.cos(am), si = Math.sin(am);
    C.pc[i] = co; C.ps[i] = si;
    x += co * step; y += si * step;
  }
}
var BAMP = { x: 0, y: 0, a: 0 };                 // bamAt's answer, reused (nothing is made per call)
function bamAt(C, s) {
  var f = clamp(s, 0, 1) * BAM_SEG, i = Math.min(BAM_SEG - 1, Math.floor(f)), u = f - i;
  BAMP.x = lerp(C.px[i], C.px[i + 1], u); BAMP.y = lerp(C.py[i], C.py[i + 1], u); BAMP.a = lerp(C.pa[i], C.pa[i + 1], u);
  return BAMP;
}
function bamW(B, C, s) { return C.w * (1 - B.taper * s) * (s > 0.92 ? lerp(1, 0.35, (s - 0.92) / 0.08) : 1); }
/* Fill the band between o0 and o1 across the stem (-1 its left edge … 1 its right). */
function bamStrip(c, B, C, o0, o1) {
  var i, w, nx, ny;
  c.beginPath();
  for (i = 0; i <= BAM_SEG; i++) {
    w = bamW(B, C, i / BAM_SEG); nx = -Math.sin(C.pa[i]); ny = Math.cos(C.pa[i]);
    c.lineTo(C.px[i] + nx * w * o1, C.py[i] + ny * w * o1);
  }
  for (i = BAM_SEG; i >= 0; i--) {
    w = bamW(B, C, i / BAM_SEG); nx = -Math.sin(C.pa[i]); ny = Math.cos(C.pa[i]);
    c.lineTo(C.px[i] + nx * w * o0, C.py[i] + ny * w * o0);
  }
  c.closePath();
  c.fill();
}
/* One joint line into the current path: across the stem at s, back toward
   the root by back × its width, as thick as thick × its width (at least min). */
function bamJoint(c, B, C, s, back, thick, min) {
  var p = bamAt(C, s), w = bamW(B, C, s) * 1.08, h = Math.max(min, w * thick) / 2;
  var nx = -Math.sin(p.a), ny = Math.cos(p.a), dx = Math.cos(p.a), dy = Math.sin(p.a);
  var cx = p.x - dx * w * back, cy = p.y - dy * w * back;
  c.moveTo(cx - nx * w - dx * h, cy - ny * w - dy * h);
  c.lineTo(cx + nx * w - dx * h, cy + ny * w - dy * h);
  c.lineTo(cx + nx * w + dx * h, cy + ny * w + dy * h);
  c.lineTo(cx - nx * w + dx * h, cy - ny * w + dy * h);
  c.closePath();
}
/* A stem's body, shine and joints, on its own (it is drawn straight, once). */
function bamDrawStem(c, B, C) {
  c.globalAlpha = 1; c.fillStyle = C.body; bamStrip(c, B, C, -1, 1);
  c.globalAlpha = 0.8; c.fillStyle = C.dark; bamStrip(c, B, C, 0.35, 1);
  if (B.highlight > 0) { c.globalAlpha = B.highlight; c.fillStyle = C.lit; bamStrip(c, B, C, -0.65, -0.15); }
  // the joints: a dark line across, with a pale ring just under it. Each line
  // is the band a butt-capped stroke would cover, and all of a stem's rings,
  // then all its dark lines, are filled as one shape (two fills a stem).
  if (B.nodeMark > 0) {
    c.globalAlpha = B.nodeMark * 0.7; c.fillStyle = C.ring; c.beginPath();
    for (var i = 0; i < C.nodes.length; i++) bamJoint(c, B, C, C.nodes[i], 0.35, 0.2, 0.5);
    c.fill();
    c.globalAlpha = B.nodeMark; c.fillStyle = C.node; c.beginPath();
    for (i = 0; i < C.nodes.length; i++) bamJoint(c, B, C, C.nodes[i], 0, 0.24, 0.6);
    c.fill();
  }
  c.globalAlpha = 1;
}
/* One stem this frame, onto c (the grove's canvas, at k device px to the CSS px):
   its slices along the curve, then its leaf sprays at their joints, each in one
   drawImage from a sheet. */
function bamDrawCulm(c, C, G, t, wind, k) {
  var B = G.B, sheet = G.stems, j, step = C.len / BAM_SEG;
  var sy = C.sy, sh = C.sH, dy = -sh / (2 * k), sw = C.sW + 1;                   // one picture pixel more, so the slices overlap a little
  for (j = 0; j < BAM_SEG; j++) {
    var co = C.pc[j] * k, si = C.ps[j] * k;
    c.setTransform(co, si, -si, co, C.px[j] * k, C.py[j] * k);
    c.drawImage(sheet, C.sPad + j * C.sW, sy, sw, sh, 0, dy, sw * C.sUx, sh / k);
  }
  // the leaves (one transform each: the layer's scale k, then to the spray, turned and sized)
  var set = G.sprays[C.layer * 2 + C.band - C.layer], fl = 0.07 * B.leafFlutter * wind, sp = B.swaySpeed;
  for (j = 0; j < C.sprays.length; j++) {
    var S2 = C.sprays[j], q = bamAt(C, S2.s), spr = set[S2.v];
    var dir = q.a + S2.side * S2.spread + Math.sin(t * 2.6 * sp + S2.ph) * fl + Math.sin(t * 4.3 * sp + S2.ph * 2.3) * fl * 0.4 + G.gust * 0.4;
    var cs = Math.cos(dir) * S2.sc * k, sn = Math.sin(dir) * S2.sc * k, fy = S2.side < 0 ? -1 : 1;
    c.setTransform(cs, sn, -sn * fy, cs * fy, q.x * k, q.y * k);
    c.drawImage(spr.cnv, spr.sx, spr.sy, spr.sw, spr.sh, -spr.ox, -spr.oy, spr.w, spr.h);
  }
}
/* G.a: how strongly each grove is laid down this frame (0: not shown). Each
   grove shown is redrawn into its G.out (not yet cut by the trees) every
   BAMBOO_EVERY-th frame, and marked fresh. */
function renderBamboo(t) {
  ensureBamboo();
  var k = PR * BAM_RES, wind = S.treeSway * (0.85 + 0.03 * Math.min(ENV.windMs, 10)), lamps = koyoNight() * KOYO.nightGlow;
  bambooFrame++;
  bambooGroves.forEach(function(G, gi) {
    var a = bambooAlpha(G.key);
    G.a = G.B.show && a > 0.003 ? a * G.B.strength : 0;
    G.glow = G.a ? lamps : 0;                     // how strongly the lamps light it (as the trees)
    G.fresh = false;
    if (!G.a) {                                   // not shown: what it drew is cleared
      if (G.box) { G.out.c.setTransform(1, 0, 0, 1, 0, 0); G.out.c.clearRect(G.box.x, G.box.y, G.box.w, G.box.h); }
      G.box = null; G.drawn = false;
      return;
    }
    if (!G.drawn || (bambooFrame + gi) % BAMBOO_EVERY === 0) drawGrove(G);
  });
  function drawGrove(G) {
    var B = G.B, c = G.out.c;
    G.fresh = G.drawn = true;
    // clear what it drew last time (all of it lies inside that box)
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalAlpha = 1;
    if (G.box) c.clearRect(G.box.x, G.box.y, G.box.w, G.box.h);
    G.box = null;
    var x0 = Infinity, x1 = -Infinity, y0 = Infinity;
    for (var i = 0; i < G.culms.length; i++) {      // further back first
      var C = G.culms[i];
      bamShape(C, G, t, false, wind);
      bamDrawCulm(c, C, G, t, wind, k);
      for (var q = 0; q <= BAM_SEG; q += 2) { x0 = Math.min(x0, C.px[q]); x1 = Math.max(x1, C.px[q]); y0 = Math.min(y0, C.py[q]); }
    }
    // the part of the screen it covers (with room for the leaves), in out's pixels:
    // the trees are cut out and it is laid down only there
    var pad = G.u * 1.8 + 4 * Math.max(B.blurNear, B.blurFar) + 4;
    var bx0 = clamp(Math.floor((x0 - pad) * k), 0, G.out.cnv.width), bx1 = clamp(Math.ceil((x1 + pad) * k), 0, G.out.cnv.width);
    var by0 = clamp(Math.floor((y0 - pad) * k), 0, G.out.cnv.height);
    G.box = bx1 > bx0 && by0 < G.out.cnv.height ? { x: bx0, y: by0, w: bx1 - bx0, h: G.out.cnv.height - by0 } : null;
    // where its mass is (about a third of the way up its stems), for the lamps' pool of light
    var mx = 0, my = 0;
    for (i = 0; i < G.culms.length; i++) { mx += G.culms[i].px[7]; my += G.culms[i].py[7]; }
    G.gx = mx / Math.max(1, G.culms.length); G.gy = my / Math.max(1, G.culms.length);
    G.gr = Math.max(H * 0.3, G.box ? G.box.h / k * 0.55 : 0);
    // the lamps light it from beneath: what it has drawn is tinted warm, most at the
    // bottom of the screen and less and less higher up (the same lamp colour as the trees)
    if (G.glow > 0.01 && G.box) {
      var lg = c.createLinearGradient(0, H, 0, H * 0.1);
      lg.addColorStop(0, rgba(KOYO_LAMP, 1 * G.glow));
      lg.addColorStop(0.4, rgba(KOYO_LAMP, 0.55 * G.glow));
      lg.addColorStop(0.75, rgba(KOYO_LAMP, 0.16 * G.glow));
      lg.addColorStop(1, rgba(KOYO_LAMP, 0.04 * G.glow));
      c.setTransform(k, 0, 0, k, 0, 0);
      c.globalCompositeOperation = 'source-atop';
      c.fillStyle = lg;
      c.fillRect(G.box.x / k, G.box.y / k, G.box.w / k, G.box.h / k);
      c.globalCompositeOperation = 'source-over';
    }
    // a safety net: a gust or the biggest leaves never take it above topMargin (fades out just under it)
    var lim = H * B.topMargin, fade = H * 0.02;
    c.setTransform(k, 0, 0, k, 0, 0);
    if (lim > 0) {
      var g = c.createLinearGradient(0, lim, 0, lim + fade);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.globalCompositeOperation = 'destination-out';
      c.fillStyle = 'rgba(0,0,0,1)'; c.fillRect(0, 0, W, lim);
      c.fillStyle = g; c.fillRect(0, lim, W, fade);
      c.globalCompositeOperation = 'source-over';
    }
  }
}
/* Night: a soft warm pool of lamp light behind a grove, as koyoGlow does for a tree. */
function bamGlow(ctx, G) {
  var a = G.glow * G.a;
  if (a <= 0.01) return;
  ctx.setTransform(PR, 0, 0, PR, 0, 0);
  ctx.globalAlpha = 1;
  var gy = G.gy + G.gr * 0.25, g = ctx.createRadialGradient(G.gx, gy, 0, G.gx, gy, G.gr * 1.3);
  g.addColorStop(0, 'rgba(255,184,110,' + (0.34 * a).toFixed(3) + ')');
  g.addColorStop(0.5, 'rgba(255,170,96,' + (0.15 * a).toFixed(3) + ')');
  g.addColorStop(1, 'rgba(255,160,90,0)');
  ctx.fillStyle = g;
  ctx.fillRect(G.gx - G.gr * 1.4, gy - G.gr * 1.4, G.gr * 2.8, G.gr * 2.8);
}
/* Cut the trees in front out of a grove: list of [canvas, times] (each
   canvas covers the whole screen; foliage is cut three times, as it is a
   little see-through). */
function bamCutOut(G, list) {
  var c = G.out.c, b = G.box;
  if (!b) return;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalAlpha = 1;
  c.globalCompositeOperation = 'destination-out';
  list.forEach(function(e) {
    var sx = e[0].width / G.out.cnv.width, sy = e[0].height / G.out.cnv.height;
    for (var i = 0; i < e[1]; i++) c.drawImage(e[0], b.x * sx, b.y * sy, b.w * sx, b.h * sy, b.x, b.y, b.w, b.h);
  });
  c.globalCompositeOperation = 'source-over';
}
function bamLayDown(ctx, G) {
  var b = G.box;
  if (!b) return;
  var sx = cvBack.width / G.out.cnv.width, sy = cvBack.height / G.out.cnv.height;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = G.a;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(G.out.cnv, b.x, b.y, b.w, b.h, b.x * sx, b.y * sy, b.w * sx, b.h * sy);
  ctx.globalAlpha = 1;
}
function ensureTree(lazy) {
  if (ENV.scene !== 'autumn' || !S.tree) { tree = null; farTree = null; return; }
  var key = ENV.scene + '|' + S.date + '|' + ENV.side + '|' + W + 'x' + H + '|' + S.treeSize;
  if (!tree || tree.key !== key) { tree = buildKoyoTree(key, false, lazy); if (lazy) dynSetupLeft = true; }
  if (!farTree || farTree.key !== key + '|far') { farTree = buildKoyoTree(key + '|far', true, lazy); if (lazy) dynSetupLeft = true; }
}
function updateTree(dt, t) {
  if (farTree) updateOneTree(farTree, dt, t);
  if (tree) updateOneTree(tree, dt, t);
  bamSway(dt);
  rebakeClumps(3);
}
function updateOneTree(T, dt, t) {
  var ns = T.nodes;
  // a gust gives the whole tree a push that springs back
  // A springy response (damping ratio ~0.17): a strong gust leans the tree
  // well over, it bounces back past upright a few times and settles in about
  // two seconds. The limits only stop several gusts stacking without bound.
  T.gustV += (-9 * T.gust - 1.0 * T.gustV) * dt;
  T.gustV = clamp(T.gustV, -1.1, 1.1);
  T.gust += T.gustV * dt;
  if (Math.abs(T.gust) > 0.35) {                    // hitting the limit stops the tree there, it does not stay pushed against it
    T.gust = 0.35 * Math.sign(T.gust);
    if (T.gustV * T.gust > 0) T.gustV = 0;
  }
  var wind = clamp(ENV.windPx * 0.0012, -0.07, 0.07) * S.treeSway;
  var amp = (0.015 + 0.01 * Math.min(ENV.windMs, 10)) * S.treeSway;
  var spd = 1 + Math.min(ENV.windMs, 10) * 0.08;
  for (var i = 0; i < ns.length; i++) {
    var n = ns[i];
    // Each branch's bend is added to its parent's, so down the six levels the
    // angles pile up. The weights below sum to about 1 along any trunk-to-twig
    // chain (thin twigs still bend most), so the tip turns by the amounts
    // above and no more.
    var k = (Math.pow(n.d / T.maxD, 1.6) + 0.02) * 0.34;
    var sway = (wind + Math.sin(t * n.f * spd + n.ph) * amp +
                Math.sin(t * 0.37 * spd + n.ph * 0.3) * amp * 0.6 + T.gust) * k;
    var par = n.p < 0 ? null : ns[n.p];
    n.cur = (par ? par.cur : -PI / 2) + n.rel + sway;
    n.sx = par ? par.ex : T.bx;
    n.sy = par ? par.ey : T.by;
    n.ex = n.sx + Math.cos(n.cur) * n.len;
    n.ey = n.sy + Math.sin(n.cur) * n.len;
  }
}
function drawTree(ctx, t) {
  if (ENV.scene === 'autumn') drawKoyoTrees(ctx, t);
}

/* ============================================================
   8c. VISITORS — a cricket at night (the red dragonfly was removed).
       It perches on the characters of the message text.
   ============================================================ */
var _glyphsReadyAt = 0;   // characters are still sliding in until this time
function glyphSpots() {
  if (performance.now() < _glyphsReadyAt || dynFrontMul < 0.5) return [];
  var root = document.querySelector('.stage .panel.active .panel-content');
  if (!root) return [];
  var out = [], range = document.createRange();
  var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  var node;
  while ((node = walker.nextNode())) {
    var ph = node.parentNode && node.parentNode.closest ? node.parentNode.closest('.panel-phrase') : null;
    if (ph && !ph.classList.contains('shown')) continue;          // phrase has not faded in yet
    var txt = node.nodeValue;
    for (var i = 0; i < txt.length; i++) {
      if (/[\s、。，．！？（）「」・…]/.test(txt.charAt(i))) continue;
      range.setStart(node, i);
      range.setEnd(node, i + 1);
      var r = range.getBoundingClientRect();
      if (r.width < 3 || r.height < 3) continue;
      out.push({ x: r.left + r.width / 2, y: r.top + r.height * 0.14, glyph: true });
    }
  }
  return out;
}
function spotPos(sp) {
  if (sp.node !== undefined && tree && tree.nodes[sp.node]) return { x: tree.nodes[sp.node].ex, y: tree.nodes[sp.node].ey };
  return sp;
}
function pickPerch(near, textOnly) {
  var g = glyphSpots(), extra = [];
  if (tree && !textOnly) {
    for (var i = 0; i < 8; i++) {
      var idx = Math.floor(Math.random() * tree.nodes.length);
      if (tree.nodes[idx].d >= 3) extra.push({ node: idx });
    }
  }
  var pool = (g.length && (Math.random() < 0.8 || !extra.length)) ? g : extra;
  if (!pool.length) return { x: W * rnd(0.2, 0.8), y: H * rnd(0.3, 0.7) };
  if (near) {
    var close = pool.filter(function(sp) {
      var p = spotPos(sp), dx = p.x - near.x, dy = p.y - near.y, d = Math.sqrt(dx * dx + dy * dy);
      return d > 50 && d < 380;
    });
    if (close.length) pool = close;
  }
  return pool[Math.floor(Math.random() * pool.length)];
}
/* When the panel changes, the text they stand on is gone. */
function insectsLeaveText() {
  fireflyGlyphsAt = -10;
  for (var i = 0; i < specks.length; i++) {
    if (specks[i].state !== 'drift') { specks[i].state = 'drift'; specks[i].target = null; }
  }
  if (cricket) {
    cricket.seq = cricket.seq.filter(function(sp) { return !sp.glyph; });
    if (cricket.state === 'rest') cricket.rest = Math.min(cricket.rest, 0.3);
  }
}

/* Cricket (コオロギ): hops from character to character, sometimes
   chirps, then hops off the screen. */
var cricket = null, cricketNext = 0;
function sendCricket() {
  var seq = [], last = null, n = 3 + Math.floor(Math.random() * 5);
  for (var i = 0; i < n; i++) {
    var p = pickPerch(last, true);     // crickets only use the text, never the tree
    seq.push(p);
    last = spotPos(p);
  }
  var fromLeft = Math.random() < 0.5;
  cricket = { x: fromLeft ? -30 : W + 30, y: H * rnd(0.6, 0.9), seq: seq, i: 0, state: 'rest', rest: 0,
              exiting: false, facing: fromLeft ? 1 : -1, t: 0, hop: null, cur: null, chirpT: 0, u: 0 };
}
function crHop(c, to) {
  var tp = spotPos(to), dx = tp.x - c.x, dy = tp.y - c.y, dist = Math.sqrt(dx * dx + dy * dy);
  c.hop = { fx: c.x, fy: c.y, to: to, t: 0, dur: 0.3 + dist / 1100, h: 30 + dist * 0.3 };
  c.state = 'hop';
  c.u = 0;
  if (Math.abs(dx) > 2) c.facing = dx > 0 ? 1 : -1;
}
function updateCricket(dt, t) {
  var night = ENV.phase === 'night' || ENV.phase === 'dusk';
  if (!cricket && S.cricket && night && dynFrontMul > 0.5 && ENV.scene !== 'winter' && !(ENV.rainy && S.rainMm > 2) && S.condition !== 'snow' && t > cricketNext) {
    if (cricketNext > 0) sendCricket();
    cricketNext = t + rnd(60, 180);
  }
  var c = cricket;
  if (!c) return;
  c.t += dt;
  if (c.state === 'rest') {
    if (c.cur) { var p = spotPos(c.cur); c.x = p.x; c.y = p.y; }
    c.rest -= dt;
    if (c.chirpT > 0) c.chirpT -= dt;
    else if (night && c.cur && Math.random() < dt * 0.6) c.chirpT = rnd(0.6, 1.4);
    if (c.rest <= 0) {
      c.chirpT = 0;
      if (c.i < c.seq.length) crHop(c, c.seq[c.i++]);
      else if (!c.exiting) { c.exiting = true; crHop(c, { x: c.x < W / 2 ? -60 : W + 60, y: c.y + rnd(-40, 80) }); }
      else cricket = null;
    }
  } else {
    var h = c.hop;
    h.t += dt;
    var u = Math.min(1, h.t / h.dur), tp = spotPos(h.to);
    c.x = lerp(h.fx, tp.x, u);
    c.y = lerp(h.fy, tp.y, u) - h.h * 4 * u * (1 - u);
    c.u = u;
    if (u >= 1) {
      if (c.exiting) { cricket = null; return; }
      c.state = 'rest';
      c.cur = h.to;
      c.rest = rnd(0.6, 2.2);
    }
  }
}
function drawCricket(ctx, t) {
  var c = cricket;
  if (!c) return;
  var k = 1.15 * S.insectSize;
  var hopping = c.state === 'hop', u = hopping ? c.u : 0;
  ctx.save();
  ctx.translate(c.x, c.y);
  if (!hopping) {
    ctx.fillStyle = 'rgba(40,25,20,0.18)';
    ctx.beginPath(); ctx.ellipse(0, 1, 10 * k, 2.2 * k, 0, 0, TAU); ctx.fill();
  }
  ctx.scale(c.facing * k, k);
  if (hopping) ctx.rotate(lerp(-0.5, 0.45, u));    // nose up on take-off, down for landing
  // hind legs stretch out on take-off and fold again for landing
  var ext = hopping ? Math.sin(Math.min(1, u * 3) * PI / 2) * (1 - smooth(0.6, 1, u)) : 0;
  var knee = [lerp(-8, -12, ext), lerp(-12, -5, ext)], foot = [lerp(-13, -21, ext), lerp(0, -1, ext)];
  ctx.lineCap = 'round';
  // far hind leg
  ctx.strokeStyle = '#6b5040';
  ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.moveTo(0.5, -5); ctx.lineTo(knee[0] + 1.5, knee[1] + 0.5); ctx.stroke();
  ctx.lineWidth = 0.9;
  ctx.beginPath(); ctx.moveTo(knee[0] + 1.5, knee[1] + 0.5); ctx.lineTo(foot[0] + 1.5, foot[1]); ctx.stroke();
  // front and middle legs
  ctx.strokeStyle = '#3a2a20';
  ctx.lineWidth = 1;
  ctx.beginPath();
  if (hopping) { ctx.moveTo(6, -4); ctx.lineTo(9, -2); ctx.moveTo(2, -4); ctx.lineTo(1, -1.5); }
  else { ctx.moveTo(6, -4); ctx.lineTo(8.5, 0); ctx.moveTo(2, -4); ctx.lineTo(0.5, 0); }
  ctx.stroke();
  // body
  ctx.fillStyle = '#3a2a20';
  ctx.beginPath(); ctx.ellipse(-2, -6, 8, 3.6, 0, 0, TAU); ctx.fill();
  var chirping = c.chirpT > 0 && !hopping;
  ctx.fillStyle = '#5a4330';
  ctx.beginPath(); ctx.ellipse(-3, -7.6, 7, 2.6, chirping ? -0.12 + Math.sin(t * 40) * 0.06 : 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(200,170,120,0.25)';
  ctx.lineWidth = 0.4;
  ctx.beginPath(); ctx.moveTo(-9, -7.6); ctx.lineTo(3, -7.8); ctx.moveTo(-7, -6.4); ctx.lineTo(1, -8.8); ctx.stroke();
  ctx.fillStyle = '#2e211a';
  ctx.beginPath(); ctx.ellipse(4.5, -6.8, 3, 3, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#2a1d16';
  ctx.beginPath(); ctx.arc(8.5, -6, 3, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(210,180,130,0.8)';
  ctx.beginPath(); ctx.arc(9.6, -6.8, 0.8, 0, TAU); ctx.fill();
  // tail feelers (cerci) and long twitching antennae
  ctx.strokeStyle = '#3a2a20';
  ctx.lineWidth = 0.6;
  var tw = Math.sin(t * 7) * 2 + Math.sin(t * 13 + 1);
  ctx.beginPath();
  ctx.moveTo(-10, -6); ctx.lineTo(-15, -8.5);
  ctx.moveTo(-10, -5.5); ctx.lineTo(-15, -4.5);
  ctx.moveTo(10.5, -8); ctx.quadraticCurveTo(17, -18, 26, -16 + tw);
  ctx.moveTo(10, -8); ctx.quadraticCurveTo(14, -20, 22, -22 + tw * 0.7);
  ctx.stroke();
  // near hind leg: big jumping leg
  ctx.strokeStyle = '#2e211a';
  ctx.lineWidth = 2.6;
  ctx.beginPath(); ctx.moveTo(-1, -5); ctx.lineTo(knee[0], knee[1]); ctx.stroke();
  ctx.lineWidth = 1.1;
  ctx.beginPath(); ctx.moveTo(knee[0], knee[1]); ctx.lineTo(foot[0], foot[1]); ctx.stroke();
  // chirp: little sound arcs
  if (chirping) {
    for (var j = 0; j < 3; j++) {
      var rr = 4 + j * 3 + (t * 12) % 3;
      ctx.strokeStyle = 'rgba(120,90,60,' + (0.35 * (1 - j / 3)).toFixed(3) + ')';
      ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.arc(-4, -12, rr, -PI * 0.8, -PI * 0.2); ctx.stroke();
    }
  }
  ctx.restore();
}

/* ============================================================
   8c. AUTUMN LANDSCAPE — as tuned on landscape.html (values in LAND).
   Autumn theme only; the winter scene is unchanged.
     #dynBack    faint blurred mountains with a Fuji-like peak and mist
                 between the ridges (霞), and a strip of ground covered in
                 fallen leaves, behind the trees. Baked, not drawn per frame.
     #dynGround  the band of near leaves along the bottom edge, above the
                 text and table (they scroll in behind it), and on it the
                 loose leaves and every leaf that lands.
   Everything is lit by the app's own light (koyoLight / koyoNight) and is
   baked again when the light changes, at most every LAND_REBAKE seconds and
   never mid-scroll.
   ============================================================ */
var LAND = {
  seed: 7,
  // mountains
  ridges: 3, horizon: 0.86, mtnHeight: 0.2, mtnStrength: 1, mtnHaze: 0.67, mtnBlur: 2.5,
  mist: 0.82, mistDrift: 0.6, treeLine: true,
  // the Fuji-like peak
  fujiX: 0.73, fujiHeight: 0.34, fujiWidth: 2.6, fujiSnow: 0.1,
  // the ground of fallen leaves
  groundStrength: 1, carpetDensity: 1.1, carpetSize: 1, leafAge: 0.35, groundHaze: 0.5,
  // loose leaves lying in front, and how much they tremble
  bedLeaves: 110, bedDepth: 17, tremble: 1,
  // the near band in front of the text and table
  nearHeight: 32, nearDensity: 0.9, nearSize: 1.2, nearShade: 0.15, nearBlur: 0, nearCover: 1,
  nearShadow: 0.73, nearShadowSize: 4.5,
  // only leaves this near or nearer fall in front of the text and table, and land
  nearZ: 0.8, landShare: 0.7
};
var LAND_C = (function() {
  var h = hexToRgb;
  return { mtnFar: h('#B4B8CC'), mtnMid: h('#9198B2'), mtnNear: h('#737C95'), fujiSnow: h('#F7F3EC'),
           mist: h('#FBECE0'), treeLine: h('#5F6B48'), soil: h('#4A2A20'), litterBrown: h('#7E4A30'), litterTan: h('#B7814F') };
})();
/* The 3D mountains (mountains.js), as tuned on bamboo.html: they replace the
   painted ridges and Fuji in the autumn landscape. Real 3D ranges and the
   Fuji-like peak, lit by the app's sun with shadows, snow on the high
   ground, autumn forest, haze and mist in the valleys; drawn once into the
   baked scenery, so nothing extra is drawn per frame. Where WebGL 2 is
   missing the painted ridges are drawn as before. */
var MTN3D = {
  on: true, seed: 7,
  // the ranges
  rangeHeight: 0.08, featureKm: 9.5, sharpness: 0.6, layering: 0.94, rangeSpacing: 9, nearestKm: 8, farRise: 1.4, lens: 22,
  // Fuji
  fujiX: 0.78, fujiHeight: 0.46, fujiWidth: 2.6, fujiKm: 45, fujiGullies: 0.1, fujiSnow: 0.4, fujiTongues: 0.6, fujiClear: 0.9,
  // snow and forest
  snowLine: 1.05, snow: 0.35, treeLine: 0.94, autumn: 1,
  // the light (the sun moves from eveningElevation to sunElevation over the
  // two hours after sunrise, and back before sunset)
  sunAzimuth: -100, sunElevation: 22, eveningElevation: 4.5, sunStrength: 1.15, ambient: 0.55, shadows: 0.85,
  // the air
  haze: 0.53, hazeKm: 34, mist: 0.6, mistHeightKm: 0.3, fadeToSky: 0.22, footMist: 0.6,
  // the picture
  strength: 1, softness: 0.4, resolution: 0.85, treeDots: true,
  colours: { rock: '#968476', fujiRock: '#544850', forestRed: '#B04A2C', forestGold: '#D49A44',
             evergreen: '#4A5A3E', snow: '#F6F6FA', haze: '#DCCDD2' }
};
/* The fireworks (fireworks.js), as tuned on fireworks.html: a show after the
   Nagaoka festival in the autumn scene at night. Shells rise from behind the
   ridges with a whistle timed to the rise, burst into flowers of stars, and
   the bang follows soundDelay s after the flash, echoing off the mountains.
   The show is cut out wherever the mountains, the trees or the bamboo stand
   in front of it, and its colours fall on Fuji's snow cap. It comes on as
   the night falls (fireworksUpdate) and stops launching at dawn, letting the
   last shells finish. The sound starts on the first tap. */
var FIREWORKS = (function() {
  var v = typeof Fireworks !== 'undefined' ? JSON.parse(JSON.stringify(Fireworks.DEFAULTS)) : {};
  var approved = {
    // the show
    program: 'singles', pace: 0.5,
    // the clouds
    cloudCover: 0.35, cloudThickness: 0.75, cloudHeight: 0.3, cloudDepth: 0.32, cloudGlow: 1, cloudLight: 0.38, cloudSpeed: 1,
    // where and how big
    size: 0.225, sizeVariety: 0.41, heightLow: 0.77, heightHigh: 0.9, spreadLeft: 0.06, spreadRight: 0.94,
    // the rise
    riseTime: 1, tail: 1.3, tailSparks: 2.2, wobble: 2.6,
    // the stars
    density: 1.55, starSize: 1.8, trail: 1.15, burn: 1.5, gravity: 1.7, expand: 1, brightness: 0.5, glow: 1.6,
    colourChange: 0.39, glitter: 0.56, saturation: 1, palette: 'nagaoka',
    // the mix of shells
    kiku: 1, botan: 1.4, yaeshin: 0.9, kamuro: 0.6, senrin: 0, ring: 0, yashi: 0,
    // the air
    flash: 1.25, mountainLight: 2, smoke: 0.9, wind: 0.3, haze: 0.15, skyDark: 0.65,
    // the sound
    sound: true, volume: 0.03, whistleVolume: 1.5, whistleChance: 1, boomVolume: 1.25, soundDelay: 0.4,
    echo: 0.75, muffle: 0, launchThump: 0.75, whistleBelowBang: 6
  };
  for (var k in approved) v[k] = approved[k];
  return v;
})();
var FW_PROGRAM = FIREWORKS.program;   // the programme at night; 'off' by day
var FW_CLOUDS = FIREWORKS.cloudThickness;   // the show's dark night clouds, faded in with the night (fireworksUpdate)
var fwShow = null, fwNight = 0, fwSize = '';
if (typeof Fireworks !== 'undefined') {
  FIREWORKS.program = 'off';
  fwShow = Fireworks.create(FIREWORKS);
  // whistling2.mp3: the whistle sounds from 0.42 to 3.4 s; the recording is quiet with a
  // low rumble under it, so it is cut below 900 Hz and raised 60 times (as on fireworks.html; 30 was barely heard on the tablet, 120 was too loud).
  // The bang is nearly all deep rumble, which a tablet's speakers and the ear hardly notice (as heard it was
  // 16 dB under the whistle), so it is raised 16 times, to sit about 7 dB over it; both are measured when
  // loaded and a whistle is never allowed to be within whistleBelowBang dB of its bang.
  fwShow.enableSound({ whistle: 'Sound/whistling2.mp3', boom: 'Sound/big-boom-14752.mp3',
                       whistleFrom: 0.42, whistleTo: 3.4, whistleGain: 60, whistleHighpass: 900, boomGain: 16 });
}
var LAND_REBAKE = 90;                 // seconds between light-driven re-bakes
var LAND_SCN_RES = 0.6;               // the mountains are blurred, so they are baked at 0.6 resolution
var KOYO_FALL1 = SPECIES.koyo.size * 1.05 * S.sizeScale;   // size of the nearest falling kōyō leaf
var KOYO_LEAF_LO = koyoOutline(23, 0);  // a lighter maple outline for the thousands of leaves on the ground
function landCanvas() { var c = document.createElement('canvas'); return { cnv: c, c: c.getContext('2d') }; }
var LS = { refl3d: false, SIL: landCanvas(), REFL: landCanvas(), OCC: landCanvas(),   // for the fireworks (8c)
           ready: false, key: '', at: -1e9, step: 0, grdTop: 0, scnTop: 0, mist: [], bornN: 0, floorBuilt: false, bedN: 0,
           SCN: landCanvas(), MTN: landCanvas(), TMP: landCanvas(), GRD: landCanvas(), MIST: landCanvas(),
           NEAR: landCanvas(), NEART: landCanvas(), nearH: 0, surf: null, sr: 2, nearTop: 0 };

/* Size of a leaf in front of the text and table (falling on #dynNear or lying
   on the ground): the near band's scale, so it looks as near as the band. */
function nearLeafPx() { return KOYO_FALL1 * Math.max(1.25, LAND.nearSize); }
function landLitter(p) {
  var st = [LAND_C.soil, LAND_C.litterBrown, LAND_C.litterTan];
  p = clamp(p, 0, 1) * 2;
  var i = Math.min(1, Math.floor(p));
  return mixRgb(st[i], st[i + 1], p - i);
}
function landLeafLo(c, size, rot) {
  var cs = Math.cos(rot) * size, sn = Math.sin(rot) * size, P = KOYO_LEAF_LO;
  c.beginPath();
  for (var i = 0; i < P.length; i++) {
    var px = P[i][0] * cs - P[i][1] * sn, py = P[i][0] * sn + P[i][1] * cs;
    if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
  }
  c.closePath();
}
/* The subtle shadow a leaf lying on top casts on the text and table below it.
   Canvas shadow offsets are in device pixels, so they are scaled here. */
function landShadow(c, on) {
  if (!on || LAND.nearShadow <= 0) { c.shadowColor = 'rgba(0,0,0,0)'; c.shadowBlur = 0; c.shadowOffsetY = 0; return; }
  c.shadowColor = 'rgba(40,18,12,' + (0.55 * LAND.nearShadow).toFixed(3) + ')';
  c.shadowBlur = LAND.nearShadowSize * PR;
  c.shadowOffsetX = 0;
  c.shadowOffsetY = 1.5 * PR;
}
/* At night the lamps under the trees also light the fallen leaves round their roots. */
function landGlow(c, yBase) {
  var n = koyoNight() * KOYO.nightGlow;
  if (n <= 0.01) return;
  c.globalCompositeOperation = 'source-atop';
  [tree, farTree].forEach(function(T) {
    if (!T) return;
    var R = W * (T.far ? 0.14 : 0.2), a = 0.5 * n * (T.far ? 0.6 : 1);
    var g = c.createRadialGradient(T.bx, yBase, 0, T.bx, yBase, R);
    g.addColorStop(0, 'rgba(255,184,110,' + a.toFixed(3) + ')');
    g.addColorStop(1, 'rgba(255,170,96,0)');
    c.fillStyle = g;
    c.fillRect(T.bx - R, yBase - R, R * 2, R * 2);
  });
  c.globalCompositeOperation = 'source-over';
}

/* ---------- mountains, the Fuji-like peak, mist ---------- */
var LAND_SR = 1;
function landBlurInto(dst, blurCss, draw) {
  var t = LS.TMP.c;
  t.setTransform(1, 0, 0, 1, 0, 0);
  t.clearRect(0, 0, LS.TMP.cnv.width, LS.TMP.cnv.height);
  t.setTransform(LAND_SR, 0, 0, LAND_SR, 0, 0);
  draw(t);
  dst.save();
  dst.setTransform(1, 0, 0, 1, 0, 0);
  var px = blurCss * LAND_SR;
  dst.filter = HAS_FILTER && px > 0.05 ? 'blur(' + px.toFixed(2) + 'px)' : 'none';
  dst.drawImage(LS.TMP.cnv, 0, 0);
  dst.restore();
}
/* A ridge line: sharp-peaked waves of four lengths. Returns -1 … 1. */
function landRidge(r) {
  var lams = [0.55, 0.23, 0.09, 0.035], amps = [1, 0.5, 0.22, 0.08], waves = [];
  for (var k = 0; k < 4; k++) waves.push({ f: PI / (W * lams[k] * lerp(0.8, 1.25, r())), p: r() * TAU, a: amps[k] });
  return function(x) {
    var s = 0;
    for (var i = 0; i < 4; i++) { var w = waves[i]; s += w.a * (1 - 2 * Math.abs(Math.sin(x * w.f + w.p))); }
    return s / 1.8;
  };
}
/* The Fuji-like cone: a narrow flat summit and concave slopes that flatten
   toward the base, with a snow cap whose lower edge runs down in gullies. */
function landFuji(c, hy) {
  var C = LAND_C, Hf = LAND.fujiHeight * H, fx = LAND.fujiX * W, top = hy - Hf, bh = Hf * LAND.fujiWidth, sh = Hf * 0.1;
  function py(x) {
    var dx = Math.abs(x - fx);
    if (dx <= sh) return top + Hf * 0.008 * Math.sin(dx * 0.35);
    var u = Math.min(1, (dx - sh) / (bh - sh));
    return top + Hf * (1 - Math.pow(1 - u, 2.1));
  }
  function cone() {
    c.beginPath(); c.moveTo(fx - bh - 10, hy + 40);
    for (var x = fx - bh; x <= fx + bh; x += 3) c.lineTo(x, py(x));
    c.lineTo(fx + bh + 10, hy + 40); c.closePath();
  }
  var body = koyoLight(mixRgb(C.mtnFar, C.mist, LAND.mtnHaze * 0.8));
  cone(); c.fillStyle = rgba(body); c.fill();
  if (LAND.fujiSnow <= 0) return;
  var snow = koyoLight(mixRgb(C.fujiSnow, C.mist, LAND.mtnHaze * 0.25));
  var ys = top + Hf * LAND.fujiSnow;
  var u = 1 - Math.pow(1 - LAND.fujiSnow, 1 / 2.1), xs = sh + u * (bh - sh);
  var r = rngFrom(LAND.seed * 977 + 5), n = 9 + Math.floor(r() * 4), pts = [];
  for (var i = 0; i <= n; i++) {
    var x = fx + xs * 1.25 - (i / n) * xs * 2.5, mid = 1 - Math.abs(x - fx) / (xs * 1.3);
    pts.push([x, ys - Hf * 0.015 * r()]);
    if (i < n) pts.push([x - xs * 1.25 / n, ys + Hf * lerp(0.03, 0.13, r()) * (0.4 + 0.6 * Math.max(0, mid))]);
  }
  function cap() {
    c.beginPath(); c.moveTo(fx + xs * 1.3, top - 30); c.lineTo(fx + xs * 1.3, ys);
    for (var j = 0; j < pts.length; j++) c.lineTo(pts[j][0], pts[j][1]);
    c.lineTo(fx - xs * 1.3, top - 30); c.closePath();
  }
  c.save(); cone(); c.clip();
  cap(); c.fillStyle = rgba(snow); c.fill();
  c.beginPath(); c.rect(fx, top - 40, bh, Hf + 80); c.clip();     // the side away from the light, a little shaded
  cap(); c.fillStyle = rgba(mixRgb(snow, body, 0.22)); c.fill();
  c.restore();
}
function landBakeScenery() {
  var C = LAND_C, hy = H * LAND.horizon, mistC = koyoLight(C.mist);
  var try3d = MTN3D.on && typeof Mountains !== 'undefined';
  LAND_SR = PR * (try3d ? MTN3D.resolution : LAND_SCN_RES);   // the 3D mountains are sharp, so they are baked finer
  [LS.SCN, LS.MTN, LS.TMP].forEach(function(o) { o.cnv.width = Math.round(W * LAND_SR); o.cnv.height = Math.round(H * LAND_SR); });
  var m = LS.MTN.c, s = LS.SCN.c;
  // the fireworks' canvases, at half the screen's resolution
  [LS.SIL, LS.REFL, LS.OCC].forEach(function(o) {
    o.cnv.width = Math.max(1, Math.round(W * PR / 2)); o.cnv.height = Math.max(1, Math.round(H * PR / 2));
  });
  var is3d = try3d && landDrawMountains3d(m, hy);
  LS.refl3d = LS.is3d = is3d;
  if (try3d && !is3d) {                           // no WebGL 2 after all: the painted ridges, at their own resolution
    LAND_SR = PR * LAND_SCN_RES;
    [LS.SCN, LS.MTN, LS.TMP].forEach(function(o) { o.cnv.width = Math.round(W * LAND_SR); o.cnv.height = Math.round(H * LAND_SR); });
  }
  // the painted ridges and Fuji, when the 3D mountains can't be drawn
  if (!is3d) landBlurInto(m, LAND.mtnBlur * 1.3, function(c) { landFuji(c, hy); });   // the furthest: palest, softest
  var r = rngFrom(LAND.seed * 131 + 17), R = is3d ? 0 : LAND.ridges;
  for (var i = 0; i < R; i++) {
    var d = R === 1 ? 0.6 : i / (R - 1);                                   // 0 far … 1 near
    var top = LAND.mtnHeight * H * lerp(1, 0.5, d);
    var base = hy - top * 0.6, amp = top * 0.42, f = landRidge(r);
    var col = d < 0.5 ? mixRgb(C.mtnFar, C.mtnMid, d * 2) : mixRgb(C.mtnMid, C.mtnNear, (d - 0.5) * 2);
    col = koyoLight(mixRgb(col, C.mist, LAND.mtnHaze * (1 - d * 0.6)));
    (function(col, base, amp, f) {
      landBlurInto(m, LAND.mtnBlur * lerp(1.3, 0.7, d), function(c) {
        c.fillStyle = rgba(col);
        c.beginPath(); c.moveTo(-20, hy + 40);
        for (var x = -20; x <= W + 20; x += 6) c.lineTo(x, base - amp * f(x));
        c.lineTo(W + 20, hy + 40); c.closePath(); c.fill();
      });
    })(col, base, amp, f);
    if (LAND.mist > 0) {                                                  // mist rising from the foot of the ridge (霞)
      var y0 = base - amp * 0.1, y1 = hy + 6;
      m.setTransform(LAND_SR, 0, 0, LAND_SR, 0, 0);
      var g = m.createLinearGradient(0, y0, 0, y1);
      g.addColorStop(0, rgba(mistC, 0));
      g.addColorStop(0.65, rgba(mistC, LAND.mist * 0.5));
      g.addColorStop(1, rgba(mistC, LAND.mist * 0.85));
      m.fillStyle = g; m.fillRect(-20, y0, W + 40, y1 - y0);
    }
  }
  if (is3d ? MTN3D.treeDots : LAND.treeLine) {
    var r2 = rngFrom(LAND.seed * 53 + 9), tl = rgba(koyoLight(mixRgb(C.treeLine, C.mist, 0.3 + LAND.mtnHaze * 0.3)));
    landBlurInto(m, Math.max(0.6, LAND.mtnBlur * 0.35), function(c) {
      c.fillStyle = tl;
      var x = -10;
      while (x < W + 10) {
        if (r2() < 0.45) {
          var run = lerp(30, 170, r2());
          for (var xx = x; xx < x + run; xx += lerp(4, 9, r2())) {
            var rr = lerp(2.5, 7, r2());
            c.beginPath(); c.arc(xx, hy - rr * 0.4 + 3, rr, 0, TAU); c.fill();
          }
          x += run;
        } else x += lerp(40, 220, r2());
      }
    });
  }
  s.setTransform(1, 0, 0, 1, 0, 0);
  s.globalAlpha = is3d ? MTN3D.strength : LAND.mtnStrength;
  s.drawImage(LS.MTN.cnv, 0, 0);
  s.globalAlpha = 1;
  // the mountains' outline, for the fireworks behind them: the haze makes them see-through,
  // and the fireworks must not show through
  if (fwShow) Fireworks.silhouette(LS.MTN.cnv, LS.SIL.cnv, 0.55, 0.85);
  // the top of the highest peak (with room for its blur and the drifting mist):
  // only the scenery below it is drawn each frame. The 3D ranges stand at
  // most about four times rangeHeight (the far ones rise), Fuji at fujiHeight.
  var peak = is3d ? Math.max(MTN3D.fujiHeight, MTN3D.rangeHeight * 4) : Math.max(LAND.fujiHeight, LAND.mtnHeight);
  LS.scnTop = Math.max(0, Math.floor(hy - peak * H - 40));
  // one soft mist blob, drawn a few times per frame drifting along the ridges
  var mc = LS.MIST.c; LS.MIST.cnv.width = LS.MIST.cnv.height = 128;
  var rg = mc.createRadialGradient(64, 64, 0, 64, 64, 64);
  rg.addColorStop(0, rgba(mistC, 1)); rg.addColorStop(0.5, rgba(mistC, 0.55)); rg.addColorStop(1, rgba(mistC, 0));
  mc.fillStyle = rg; mc.fillRect(0, 0, 128, 128);
  if (!LS.mist.length) {
    var r4 = rngFrom(LAND.seed * 17 + 1);
    for (var b = 0; b < 5; b++) {
      LS.mist.push({ x: r4() * W * 1.4 - W * 0.2, y: lerp(0.05, 0.45, r4()), w: lerp(0.35, 0.6, r4()), h: lerp(28, 70, r4()),
                     v: lerp(4, 10, r4()) * (r4() < 0.8 ? 1 : -1) });
    }
  }
}

/* ---------- the 3D mountains (MTN3D) ---------- */
/* Everything mountains.js needs, for the app's light now. */
function mtnOptions(hy) {
  var M = MTN3D, col = {}, k;
  for (k in M.colours) col[k] = hexToRgb(M.colours[k]);
  var n = koyoNight(), sun = ENV.sun;
  // how far into the day: 0 at sunrise and sunset, 1 two hours or more from them
  var t = smooth(0, 2.2, Math.min(S.hour - sun.rise, sun.set - S.hour));
  // how clear the sky is: cloud softens the sunlight and the shadows
  var clear = ENV.light.daylight > 0.01 ? clamp(ENV.sunAmt / ENV.light.daylight, 0, 1) : 1;
  var sunC = mixRgb([255, 168, 102], [255, 247, 236], t), sky = mixRgb([176, 160, 196], [178, 196, 226], t);
  var o = {};
  for (k in M) if (k !== 'colours') o[k] = M[k];
  o.width = LS.MTN.cnv.width; o.height = LS.MTN.cnv.height; o.screenW = W; o.screenH = H; o.horizon = hy;
  o.fuji = true;
  o.sunElevation = lerp(lerp(M.eveningElevation, M.sunElevation, t), 38, n);
  o.sunColour = mixRgb(sunC, [150, 165, 220], n);
  o.skyColour = mixRgb(sky, [80, 92, 140], n);
  o.sunStrength = M.sunStrength * lerp(1, 0.3, n) * lerp(0.6, 1, clear);
  o.ambient = M.ambient * lerp(1, 0.7, n);
  o.shadows = M.shadows * lerp(0.4, 1, clear);
  o.hazeColour = koyoLight(col.haze); o.mistColour = koyoLight(LAND_C.mist);
  o.colours = { rock: col.rock, fujiRock: col.fujiRock, forestRed: col.forestRed, forestGold: col.forestGold,
                evergreen: col.evergreen, snow: col.snow };
  return o;
}
/* The 3D mountains into LS.MTN, softened a little, with mist along their
   foot. False when they can't be drawn here (no WebGL 2). */
function landDrawMountains3d(m, hy) {
  if (!MTN3D.on || typeof Mountains === 'undefined') return false;
  var o3 = mtnOptions(hy), g3 = Mountains.render(o3);
  if (!g3) return false;
  m.save();
  m.setTransform(1, 0, 0, 1, 0, 0);
  var px = MTN3D.softness * LAND_SR;
  m.filter = HAS_FILTER && px > 0.05 ? 'blur(' + px.toFixed(2) + 'px)' : 'none';
  m.drawImage(g3, 0, 0, LS.MTN.cnv.width, LS.MTN.cnv.height);
  m.restore();
  // how strongly each point reflects the fireworks' light (Fuji's snow cap most)
  if (fwShow && Mountains.reflectance) {
    var rf = Mountains.reflectance(o3), rc = LS.REFL.c;
    rc.setTransform(1, 0, 0, 1, 0, 0);
    rc.clearRect(0, 0, LS.REFL.cnv.width, LS.REFL.cnv.height);
    if (rf) rc.drawImage(rf, 0, 0, LS.REFL.cnv.width, LS.REFL.cnv.height);
  }
  if (MTN3D.footMist > 0) {
    var mistC = koyoLight(LAND_C.mist), y0 = hy - H * 0.07, y1 = hy + 6;
    m.setTransform(LAND_SR, 0, 0, LAND_SR, 0, 0);
    var g = m.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, rgba(mistC, 0));
    g.addColorStop(0.7, rgba(mistC, MTN3D.footMist * 0.55));
    g.addColorStop(1, rgba(mistC, MTN3D.footMist * 0.85));
    m.fillStyle = g; m.fillRect(-20, y0, W + 40, y1 - y0);
  }
  return true;
}

/* ---------- the ground of fallen leaves, behind the trees ---------- */
function landBakeGround() {
  var C = LAND_C, F = KOYO_FAMILIES, hy = H * LAND.horizon, r = rngFrom(LAND.seed * 71 + 3), ph1 = r() * TAU, ph2 = r() * TAU;
  var grdTop = LS.grdTop = Math.max(0, Math.floor(hy - 8));
  LS.GRD.cnv.width = Math.round(W * PR); LS.GRD.cnv.height = Math.max(1, Math.round((H - grdTop) * PR));
  var c = LS.GRD.c;
  c.setTransform(PR, 0, 0, PR, 0, -grdTop * PR);
  c.save();
  c.globalAlpha = LAND.groundStrength;
  c.beginPath(); c.moveTo(-10, H + 10);                                    // a gently uneven edge at the horizon
  for (var x = -10; x <= W + 10; x += 8) c.lineTo(x, hy + 2 * Math.sin(x * 0.004 + ph1) + 1.5 * Math.sin(x * 0.013 + ph2));
  c.lineTo(W + 10, H + 10); c.closePath(); c.clip();
  var g = c.createLinearGradient(0, hy, 0, H), warm = F.red[0];          // leaf-litter base, hazy at the horizon
  g.addColorStop(0, rgba(koyoLight(mixRgb(mixRgb(landLitter(0.7), warm, 0.25), C.mist, LAND.groundHaze * 0.75))));
  g.addColorStop(0.35, rgba(koyoLight(mixRgb(mixRgb(landLitter(0.45), warm, 0.3), C.mist, LAND.groundHaze * 0.3))));
  g.addColorStop(1, rgba(koyoLight(mixRgb(landLitter(0.2), warm, 0.35))));
  c.fillStyle = g;
  c.fillRect(-10, hy - 10, W + 20, H - hy + 20);
  var depthPx = Math.max(1, H - hy), n = Math.round(W * depthPx / 16 * LAND.carpetDensity), list = [];
  for (var i = 0; i < n; i++) {                                            // the carpet, far rows first
    var u = r(), fam = koyoFamily(r);
    if (fam === 'evergreen') fam = 'red';                                  // evergreens don't shed onto the ground
    var tones = F[fam], tone = mixRgb(tones[0], tones[2], r());
    if (r() < LAND.leafAge) tone = mixRgb(tone, landLitter(0.2 + r() * 0.8), lerp(0.4, 0.85, r()));
    tone = scaleRgb(tone, lerp(0.74, 1.05, r()));                          // some lie in shade
    tone = mixRgb(tone, C.mist, LAND.groundHaze * Math.pow(1 - u, 2) * 0.8);
    list.push({ x: r() * (W + 40) - 20, y: hy + 2 + (depthPx - 2) * u,
                s: lerp(4.5, 18, Math.pow(u, 1.2)) * LAND.carpetSize * lerp(0.75, 1.25, r()),
                rot: r() * TAU, sy: lerp(0.35, 0.6, r()) * lerp(0.6, 1, u), col: rgba(koyoLight(tone)) });
  }
  list.sort(function(a, b) { return a.y - b.y; });
  for (var j = 0; j < list.length; j++) {
    var L = list[j];
    c.setTransform(PR, 0, 0, PR * L.sy, L.x * PR, (L.y - grdTop) * PR);
    landLeafLo(c, L.s, L.rot);
    c.fillStyle = L.col;
    c.fill();
  }
  c.setTransform(PR, 0, 0, PR, 0, -grdTop * PR);                          // haze where it meets the mountains
  var mz = c.createLinearGradient(0, hy - 2, 0, hy + depthPx * 0.45), mistC = koyoLight(C.mist);
  mz.addColorStop(0, rgba(mistC, 0.85 * LAND.groundHaze));
  mz.addColorStop(1, rgba(mistC, 0));
  c.globalAlpha = 1;
  c.fillStyle = mz;
  c.fillRect(-10, hy - 10, W + 20, depthPx * 0.45 + 12);
  c.restore();
  c.setTransform(PR, 0, 0, PR, 0, -grdTop * PR);
  landGlow(c, H - depthPx * 0.3);
}

/* ---------- the near band, above the text and table ----------
   Big, slightly darker maple leaves with a subtle shadow, lying on ground
   shaped like a real heap:
    1. G: the topmost edge of the big leaves in each column (a hair inside),
       never lower than the band's base line.
    2. G spread into gentle curved mounds, so a high leaf rests on a heap that
       slopes away on both sides, never on a straight-sided column.
    3. Solid ground below that, softened a touch, packed with small leaves.
    4. A continuous row of overlapping leaves along its edge, sunk in so the
       edge is always behind them, then the big leaves on top.
   So every visible edge is a leaf outline and every leaf has ground under it:
   no straight edges and no pockets of text between the leaves. */
function landBakeNear() {
  var nH = LAND.nearHeight, hh = Math.min(GH, Math.ceil(nH * 1.6 + 30));
  LS.nearH = hh;
  LS.NEAR.cnv.width = LS.NEART.cnv.width = Math.round(W * PR);
  LS.NEAR.cnv.height = LS.NEART.cnv.height = Math.max(1, Math.round(hh * PR));
  var c = LS.NEAR.c, t = LS.NEART.c, F = KOYO_FAMILIES, r = rngFrom(LAND.seed * 29 + 7), q, x;
  t.setTransform(PR, 0, 0, PR, 0, 0);                                      // y = hh is the bottom of the screen
  var base = koyoLight(scaleRgb(mixRgb(landLitter(0.2), F.red[0], 0.35), 1 - LAND.nearShade * 0.5));
  function famNear() { var fm = koyoFamily(r); return fm === 'evergreen' || fm === 'green' ? 'orange' : fm; }   // big green leaves stood out this close
  function shaded(k0, k1) {
    var ft = F[famNear()], fc = mixRgb(ft[0], ft[1], r());
    if (r() < LAND.leafAge) fc = mixRgb(fc, landLitter(0.2 + r() * 0.6), 0.6);
    return rgba(koyoLight(scaleRgb(fc, lerp(k0, k1, r()) * (1 - LAND.nearShade * 0.5))));
  }
  var size0 = KOYO_FALL1 * LAND.nearSize, list = [];
  var n = Math.round(W * nH / (size0 * size0 * 0.2) * 1.4 * LAND.nearDensity);
  for (var i = 0; i < n; i++) {
    var u = Math.pow(r(), 1.5), y = hh + 4 - nH * u;                      // more toward the bottom, few at the top edge
    var tones = F[famNear()], tone = mixRgb(tones[0], tones[2], r());
    if (r() < LAND.leafAge) tone = mixRgb(tone, landLitter(0.2 + r() * 0.8), lerp(0.4, 0.85, r()));
    tone = scaleRgb(tone, lerp(0.8, 1.05, r()) * (1 - LAND.nearShade * lerp(1, 0.6, u)));
    list.push({ x: r() * (W + 60) - 30, y: y, s: size0 * lerp(1.15, 0.8, u) * lerp(0.8, 1.2, r()),
                sy: lerp(0.55, 0.85, r()), rot: r() * TAU, col: rgba(koyoLight(tone)) });
  }
  list.sort(function(a, b) { return a.y - b.y; });                      // lower = nearer, drawn on top
  var CR = 2, nC = Math.ceil(W * CR) + 4, baseY = hh - nH * 0.3, P = KOYO_CLUMP_LEAF;
  var G = new Float32Array(nC), cov = new Float32Array(nC);
  for (q = 0; q < nC; q++) G[q] = baseY;
  for (q = 0; q < list.length; q++) {                                    // 1. walk each big leaf's outline
    var A = list[q], cs = Math.cos(A.rot) * A.s * 0.97, sn = Math.sin(A.rot) * A.s * 0.97, px0 = 0, py0 = 0;
    for (var m = 0; m < P.length; m++) {
      var px1 = (A.x + P[m][0] * cs - P[m][1] * sn) * CR, py1 = A.y + (P[m][0] * sn + P[m][1] * cs) * A.sy;
      if (m > 0) {
        var xa = Math.min(px0, px1), xb = Math.max(px0, px1), span = px1 - px0;
        for (x = Math.max(0, Math.ceil(xa)); x <= Math.min(nC - 1, Math.floor(xb)); x++) {
          var yv = span === 0 ? Math.min(py0, py1) : py0 + (py1 - py0) * (x - px0) / span;
          if (yv < G[x]) G[x] = yv;
        }
      }
      px0 = px1; py0 = py1;
    }
  }
  var es0 = size0 * 0.7, kc = 0.8 / es0, Rw = Math.ceil(Math.sqrt((nH * 1.5) / kc) * CR);   // 2. mounds
  for (x = 0; x < nC; x++) {
    var best = G[x];
    for (var d = 1; d <= Rw; d++) {
      var dd = d / CR, add = kc * dd * dd;
      if (x - d >= 0 && G[x - d] + add < best) best = G[x - d] + add;
      if (x + d < nC && G[x + d] + add < best) best = G[x + d] + add;
    }
    cov[x] = best;
  }
  function covAt(xx) { return cov[Math.max(0, Math.min(nC - 1, Math.round(xx * CR)))]; }
  function covMax(x0, x1) {
    var mm = -Infinity;
    for (var k = Math.max(0, Math.floor(x0 * CR)); k <= Math.min(nC - 1, Math.ceil(x1 * CR)); k++) if (cov[k] > mm) mm = cov[k];
    return mm;
  }
  t.save();                                                              // 3. the ground, softened a touch
  t.globalAlpha = LAND.nearCover;
  if (HAS_FILTER) t.filter = 'blur(' + (1.2 * PR).toFixed(2) + 'px)';
  t.fillStyle = rgba(base);
  t.beginPath();
  t.moveTo(-10, hh + 30);
  t.lineTo(-10, cov[0] + es0 * 0.08);
  for (x = 0; x < nC; x++) t.lineTo(x / CR, cov[x] + es0 * 0.08);
  t.lineTo(W + 10, cov[nC - 1] + es0 * 0.08);
  t.lineTo(W + 10, hh + 30);
  t.closePath();
  t.fill();
  t.restore();
  var fs = size0 * 0.47, nf = Math.round(W * nH / (fs * fs * 0.25) * 1.2);   // small leaves in shade, kept inside it
  for (q = 0; q < nf; q++) {
    var fx = r() * (W + 40) - 20, fsz = fs * lerp(0.75, 1.3, r()), fsy = lerp(0.5, 0.8, r());
    var top0 = covMax(fx - fsz * 0.5, fx + fsz * 0.5) + fsz * 0.5 * fsy + es0 * 0.15;
    if (top0 > hh + 4) continue;
    t.setTransform(PR, 0, 0, PR * fsy, fx * PR, lerp(top0, hh + 4, r()) * PR);
    landLeafLo(t, fsz, r() * TAU);
    t.fillStyle = shaded(0.6, 0.8);
    t.fill();
  }
  landShadow(t, true);                                                   // 4. the row along the edge, then the big leaves
  for (x = -es0; x < W + es0; x += es0 * 0.25) {
    var ex = x + (r() - 0.5) * es0 * 0.1, esz = es0 * lerp(0.85, 1.15, r()), esy = lerp(0.55, 0.8, r());
    t.setTransform(PR, 0, 0, PR * esy, ex * PR, (covAt(ex) + esz * esy * 0.4) * PR);
    koyoLeafPath(t, 0, 0, esz, r() * TAU);
    t.fillStyle = shaded(0.68, 0.9);
    t.fill();
  }
  for (var j = 0; j < list.length; j++) {
    var L = list[j];
    t.setTransform(PR, 0, 0, PR * L.sy, L.x * PR, L.y * PR);
    koyoLeafPath(t, 0, 0, L.s, L.rot);
    t.fillStyle = L.col;
    t.fill();
  }
  landShadow(t, false);
  t.setTransform(PR, 0, 0, PR, 0, 0);
  landGlow(t, hh);
  c.setTransform(1, 0, 0, 1, 0, 0);
  if (HAS_FILTER && LAND.nearBlur > 0.05) c.filter = 'blur(' + (LAND.nearBlur * PR).toFixed(2) + 'px)';
  c.drawImage(LS.NEART.cnv, 0, 0);
  if (HAS_FILTER) c.filter = 'none';
  LS.surf = cov; LS.sr = CR; LS.nearTop = H - hh;                         // local y + nearTop = screen y
}

/* ---------- leaves on the ground ---------- */
/* Where a leaf lying in front rests: on the near band's ground, at the lowest
   ground edge under most of its width (so there is ground under the whole
   leaf), sunk in a little. */
function floorY(x, gy) {
  var sf = LS.surf, y = H - 6;
  if (sf) {
    y = -Infinity;
    var hw = nearLeafPx() * 0.4;
    for (var i = Math.max(0, Math.round((x - hw) * LS.sr)); i <= Math.min(sf.length - 1, Math.round((x + hw) * LS.sr)); i++) if (sf[i] > y) y = sf[i];
    y += LS.nearTop;
  }
  return y + nearLeafPx() * 0.15 + gy * 0.35;
}
/* Where a leaf falling behind the content meets the far ground: further back =
   nearer the horizon. It settles there and fades into the carpet. */
function backGroundY(L) {
  var hy = H * LAND.horizon;
  return hy + (H - hy) * (0.1 + 0.75 * clamp(L.z / LAND.nearZ, 0, 1));
}
function placeFloor() {
  for (var i = 0; i < pile.length; i++) pile[i].y = floorY(pile[i].x, pile[i].gy);
  pile.sort(function(a, b) { return a.y - b.y; });
}
/* A leaf in front of the text and table: the band's size, sharp and solid. */
function makeNearLeaf(z) {
  var L = makeLeaf({ species: 'koyo', z: z });
  if (L.fam === 'green' || L.fam === 'evergreen') L.fam = 'orange';     // big green leaves stood out this close
  L.front = true;
  L.size = nearLeafPx() * rnd(0.85, 1.15);
  return L;
}
/* Its soft shadow, baked into a copy of its sprite (re-made when it is re-baked). */
function bakeLeafShadow(L) {
  if (!L.spr) return;
  var side = L.spr.width;
  if (!L.shd || L.shd.width !== side) { L.shd = document.createElement('canvas'); L.shd.width = L.shd.height = side; }
  var c = L.shd.getContext('2d');
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, side, side);
  landShadow(c, true);
  c.drawImage(L.pileFace === false ? L.back : L.spr, 0, 0);
  landShadow(c, false);
}
/* Put a leaf on the ground, in drawing order (further back first). */
function addToFloor(L) {
  L.y = floorY(L.x, L.gy);
  L.settled = true; L.solid = true; L.front = false;
  L.wob = rnd(0.5, 1.2) * (Math.random() < 0.5 ? -1 : 1); L.wph = rnd(0, TAU); L.kick = 0;
  L.born = LS.bornN++;
  var i = pile.length;
  while (i > 0 && pile[i - 1].y > L.y) i--;
  pile.splice(i, 0, L);
  trimFloor();
}
/* Too many leaves on the ground: the oldest is blown away, never just removed. */
function trimFloor() {
  while (pile.length > LAND.bedLeaves + S.pileMax) {
    var o = 0;
    for (var i = 1; i < pile.length; i++) if (pile[i].born < pile[o].born) o = i;
    var P = pile[o], dir = Math.abs(ENV.windPx) > 4 ? Math.sign(ENV.windPx) : (Math.random() < 0.5 ? 1 : -1);
    liftFromPile(P, dir * rnd(120, 200), -rnd(30, 70));
    P.blown = dir; P.land = false;
  }
}
/* The loose leaves lying in front, there from the start: at most batch of
   them per call (all at once when batch is left out). */
function buildBed(batch) {
  var n = Math.min(LAND.bedLeaves - LS.bedN, batch === undefined ? Infinity : batch);
  for (var i = 0; i < n; i++) {
    var gy = rnd(2, LAND.bedDepth);
    var L = makeNearLeaf(lerp(1, LAND.nearZ, gy / Math.max(1, LAND.bedDepth)));
    L.x = rnd(-20, W + 20); L.gy = gy; L.age = 5;
    L.solid = true; L.pileFace = true;
    L.pileSx = Math.random() < 0.5 ? -1 : 1; L.pileSy = rnd(0.45, 0.72);
    bakeLeaf(L);
    addToFloor(L);
  }
  LS.bedN += n;
  if (LS.bedN >= LAND.bedLeaves) LS.floorBuilt = true;
}

/* ---------- bake when needed, draw each frame ---------- */
function landKey() {
  return [lookVersion, W, H, PR, tree ? tree.key : '', farTree ? farTree.key : '', ENV.scene].join('|');
}
/* Both scenes bake this way: the autumn one here (8c), the winter one in 8d.
   bedBatch: during the name the fallen leaves are laid a few per frame. */
function updateLandscape(t, bedBatch) {
  if (ENV.scene !== 'autumn' && ENV.scene !== 'winter') return;
  var win = ENV.scene === 'winter', k = landKey();
  if (LS.step) {                                  // a bake under way: one part per frame, so no single long pause
    if (win && WIN_MTN.job) { winStepScenery(); return; }   // the winter mountains: a band a frame, first (8d)
    if (LS.step === 2) { if (win) winBakeGround(); else landBakeGround(); }
    else if (LS.step === 4) { torBake(); }                   // the torii gates and the gravel path (autumn only), once the rest is ready
    else if (win) { winBakeNear(); winBakeSprites(); LS.ready = true; }
    else { landBakeNear(); LS.ready = true; placeFloor(); }
    LS.step = LS.step === 2 ? 3 : (LS.step === 3 && !win ? 4 : 0);
    return;                                       // the loose leaves are laid on a later frame
  } else if (k !== LS.key) {
    var was = LS.key.split('|'), now = k.split('|');
    var sized = was.slice(1, 4).join('|') !== now.slice(1, 4).join('|') || was[was.length - 1] !== now[now.length - 1];
    var scrolling = typeof _scrollActive !== 'undefined' && (_scrollActive || _swipeActive);
    // a new size or scene (or the first bake) at once; a light change at most every LAND_REBAKE seconds, never mid-scroll
    if (!LS.ready || sized || (!scrolling && t - LS.at > LAND_REBAKE)) {
      if (win) winBakeScenery(); else landBakeScenery();
      LS.key = k; LS.at = t; LS.step = 2;
    }
  }
  if (!win && LS.ready && !LS.floorBuilt) buildBed(bedBatch);
}
function drawLandscape(c, dt) {
  if ((ENV.scene !== 'autumn' && ENV.scene !== 'winter') || !LS.ready) return;
  var P = ENV.scene === 'winter' ? WINT : LAND;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalAlpha = 1;
  if (ENV.scene === 'autumn') fireworksDrawSky(c);                     // the fireworks, behind the mountains (8c)
  var sy0 = Math.floor(LS.scnTop * LAND_SR), sh0 = LS.SCN.cnv.height - sy0;   // the empty sky above the peaks is skipped
  c.drawImage(LS.SCN.cnv, 0, sy0, LS.SCN.cnv.width, sh0, 0, sy0 / LAND_SR * PR, cvBack.width, sh0 / LAND_SR * PR);
  if (P.mistDrift > 0) {                                                   // mist drifting along the ridges
    var hy = H * P.horizon, drift = 0.5 + 0.5 * Math.min(2, ENV.windMs / 3);
    c.setTransform(PR, 0, 0, PR, 0, 0);
    c.globalAlpha = P.mistDrift * 0.5;
    for (var i = 0; i < LS.mist.length; i++) {
      var B = LS.mist[i], bw = B.w * W;
      B.x += B.v * dt * drift;
      if (B.x - bw / 2 > W + 50) B.x = -bw / 2 - 40;
      if (B.x + bw / 2 < -50) B.x = W + bw / 2 + 40;
      c.drawImage(LS.MIST.cnv, B.x - bw / 2, hy - P.mtnHeight * H * B.y - B.h / 2, bw, B.h);
    }
    c.globalAlpha = 1;
  }
  if (ENV.scene === 'autumn' && fwShow) fwShow.drawFront(c, LS.refl3d ? LS.REFL.cnv : null);   // the bursts' light on the mountains
  drawFrontClouds(c, lastT, dt);                                       // the clouds drifting in front of Fuji
  c.setTransform(1, 0, 0, 1, 0, 0);
  if (ENV.scene === 'winter') winDrawGround(c, lastT);          // in slices, with the skiers between them (8d)
  else { c.drawImage(LS.GRD.cnv, 0, Math.round(LS.grdTop * PR)); torDrawGravel(c); }   // the gravel path lies on the ground
  c.setTransform(PR, 0, 0, PR, 0, 0);
}
/* ---------- the fireworks (FIREWORKS) ---------- */
/* Every frame: the show comes on as the night falls (autumn only, once the
   landscape is ready) and stops launching by day, letting the last shells finish. */
function fireworksUpdate(dt, t) {
  if (!fwShow) return;
  var on = ENV.scene === 'autumn' && LS.ready && ENV.light;
  fwNight += ((on ? smooth(0.5, 0.9, koyoNight()) : 0) - fwNight) * (1 - Math.exp(-dt / 3));
  FIREWORKS.program = fwNight > 0.5 ? FW_PROGRAM : 'off';
  // the show's own clouds are night clouds (dark, lit by the moon and the bursts): none by day
  FIREWORKS.cloudThickness = FW_CLOUDS * fwNight;
  var size = W + 'x' + H + '@' + PR;
  if (size !== fwSize) { fwSize = size; fwShow.resize(W, H, PR, H * LAND.horizon); }
  fwShow.update(dt, t);
}
/* The darker night sky behind the show, under the sun and the moon. */
function fireworksDrawDark(c) {
  if (fwShow && ENV.scene === 'autumn' && fwNight > 0.01) fwShow.drawDark(c, fwNight);
}
/* The show behind the mountains, cut out wherever something stands in front of
   it: the mountains' outline, the trees (their layers are built at the top of the
   frame, buildKoyoLayers) and the bamboo (as it was last drawn). Thin or
   see-through parts are laid down a few times so they block it fully. */
function fireworksDrawSky(c) {
  if (!fwShow || fwNight < 0.01 || !fwShow.active()) return;   // by day, nothing (not even its night clouds)
  var O = LS.OCC, oc = O.c, ow = O.cnv.width, oh = O.cnv.height, i;
  oc.setTransform(1, 0, 0, 1, 0, 0);
  oc.globalCompositeOperation = 'source-over';
  oc.globalAlpha = 1;
  oc.clearRect(0, 0, ow, oh);
  oc.drawImage(LS.SIL.cnv, 0, 0, ow, oh);                         // the mountains
  if (farTree) {
    for (i = 0; i < 3; i++) oc.drawImage(farBranchLayer, 0, 0, ow, oh);
    for (i = 0; i < 2; i++) oc.drawImage(farLayer, 0, 0, ow, oh);
  }
  if (tree) {
    for (i = 0; i < 3; i++) oc.drawImage(treeLayer, 0, 0, ow, oh);
    for (i = 0; i < 2; i++) oc.drawImage(koyoLeafLayer, 0, 0, ow, oh);
  }
  ['far', 'near'].forEach(function(key) {
    var g = bambooGrove(key);
    if (!g) return;
    oc.globalAlpha = g.a;
    for (var j = 0; j < 2; j++) oc.drawImage(g.out.cnv, 0, 0, ow, oh);
    oc.globalAlpha = 1;
  });
  fwShow.drawSky(c, O.cnv, true);
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalAlpha = 1;
  c.globalCompositeOperation = 'source-over';
}

/* The near band (leaves in autumn, the snowdrift in winter) goes under the
   leaves or flakes already drawn on the ground strip (it has its own night
   glow baked in). */
function drawNearBand(c) {
  if (!LS.ready || !LS.nearH) return;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalAlpha = 1;
  c.globalCompositeOperation = 'destination-over';
  c.drawImage(LS.NEAR.cnv, 0, Math.round((GH - LS.nearH) * PR));
  c.globalCompositeOperation = 'source-over';
}

/* ============================================================
   8c. TORII GATES AND GRAVEL PATH (autumn theme) — as tuned on bamboo.html
   (values in TORII). A long line of vermilion torii (as at Takayama
   Inari) winds across the ground of fallen leaves, from the far left of
   the horizon, along it and back toward you, ending with a gate that
   faces you square on. A gravel path runs through the gates, as wide as
   the shadow each gate throws, and carries straight on past the last
   gate and out of the bottom of the screen.
   Perspective: the scene is seen by a camera at eye height (1 unit)
   looking level, so the horizon (LAND.horizon) is the eye line. A point
   on the ground d px below the horizon is lens / d units away, and a
   thing h units tall standing there is h × d px tall: every gate is as
   tall as its foot is far below the horizon, so the far gates are the
   smallest and each one is in proportion to the ground it stands on.
   Each gate is built in 3D (round pillars with black feet leaning in a
   little, the tie beam, the short post, the upper beam with curled-up
   ends) and every piece of every gate is drawn from the furthest to the
   nearest, so the gates overlap as they really would.
   Stone lanterns stand beside the path, lit and flickering after dusk (see
   "Stone lanterns" below, values in LANT).
   Depth of field: further gates are blurred (in six steps) and hazed
   toward the mist colour, as the ground is at the horizon. Everything is
   lit by the app's own light (koyoLight) and baked, with the landscape,
   as its last step (see updateLandscape): the path is drawn on the
   ground (torDrawGravel, from drawLandscape) and the gates stand on it
   behind the far tree (torDrawGates, from drawKoyoTrees).
   ============================================================ */
var TORII = {
  show: true,
  // the path: x × screen width, y × screen height, from the start to the gate facing you
  path: [[0.252027027027027, 0.862], [0.3625, 0.8766666666666667], [0.45135135135135135, 0.884],
         [0.5253378378378378, 0.8973333333333333], [0.5689189189189189, 0.9053333333333333], [0.6608108108108108, 0.9353333333333333]],
  straightEnd: 1.3, lens: 0.72,
  // the gates
  gateHeight: 2.78, count: 59, width: 0.57, pillar: 0.068, lean: 1.8, overhang: 0.23, sori: 0.038,
  nukiAt: 0.69, feet: 0.125, gakuzuka: true,
  colours: { vermilion: '#E4462A', shade: '#8C2316', top: '#B8341F', feet: '#2A2220', ground: '#3A1C14',
             gravel: '#D8C3A0', gravelLight: '#F4E8D0', gravelDark: '#A88F6E' },
  // light and shadow
  lightFrom: -0.8, shadeDepth: 0.45, shadow: 0.31, shadowBlur: 2.8,
  // depth of field
  focusDepth: 0.5, blurNear: 0.2, blurFar: 1.85, hazeNear: 0.04, hazeFar: 0.4, strength: 1,
  // the gravel path
  gravel: true, pathWidth: 1.06, pebbles: 1, pebbleSize: 1.8, edgeSoft: 0.14, pathLeaves: 1.1
};
/* The stone lanterns, as set on bamboo.html. */
var LANT = {
  show: true,
  // where they stand: one in every gap between two gates, on both sides; "along" is where in the
  // gap (0 by the gate further from you, 1 by the nearer), "fromEdge" the gap from the gravel (× lantern height)
  every: 1, side: 'both', rightAlong: 0.89, rightFromEdge: 0.3, leftAlong: 0.38, leftFromEdge: 0.3,
  // the lantern
  size: 1.38, sides: 6, pillar: 0.07, box: 0.1, roof: 0.28, curls: true,
  moss: 0.53, variety: 0.78, roofLeaves: 1.75,
  colours: { stone: '#B3ADA3', stoneShade: '#5F5B56', moss: '#6E7A4C', paper: '#F4EEE2', flame: '#FFAE52', glow: '#FFD89A' },
  // the light
  lightEvening: 1.3, lightNight: 1.34, windowGlow: 0.43, halo: 0.7, haloSize: 2.05, pool: 1.1, poolSize: 1.25,
  castLight: 0.7, reach: 2.2,
  // the flicker: strength, seconds between flickers and how long one lasts (on average, for each lantern),
  // speed, the gentle unsteadiness between flickers, and the extra flicker in a gust
  flicker: 0.77, flickerEvery: 1, flickerLength: 1.2, flickerSpeed: 1, wobble: 0.58, windFlicker: 1
};
var TOR = { gate: landCanvas(), grav: landCanvas(), mask: landCanvas(), maskB: landCanvas(), gateTop: 0, gravTop: 0, ready: false, perch: null };
var TOR_BANDS = 6;
function torLens() { return TORII.lens * W; }
function torScreen(x, y, z) { var F = torLens(); return [W / 2 + F * x / z, H * LAND.horizon + F * (1 - y) / z]; }
function torGround(sx, sy) {
  var F = torLens(), d = Math.max(0.5, sy - H * LAND.horizon), z = F / d;
  return { x: (sx - W / 2) * z / F, z: z };
}
/* The path on the ground: a smooth curve through the points, in ground
   units. Each stretch is a cubic curve whose end directions are taken
   from the points either side, so it winds without loops even though
   the far stretches are far longer than the near ones. Before the end
   it runs straight toward you for TORII.straightEnd × gate height. */
function torPath() {
  var P = TORII.path.map(function (p) { return torGround(p[0] * W, p[1] * H); });
  var end = P[P.length - 1], run = TORII.straightEnd * TORII.gateHeight;
  if (run > 0.01) P.splice(P.length - 1, 0, { x: end.x, z: end.z + run });
  var n = P.length, dir = [];
  for (var i = 0; i < n; i++) {
    var dx = 0, dz = 0;
    if (i > 0) { var l0 = Math.hypot(P[i].x - P[i - 1].x, P[i].z - P[i - 1].z) || 1; dx += (P[i].x - P[i - 1].x) / l0; dz += (P[i].z - P[i - 1].z) / l0; }
    if (i < n - 1) { var l1 = Math.hypot(P[i + 1].x - P[i].x, P[i + 1].z - P[i].z) || 1; dx += (P[i + 1].x - P[i].x) / l1; dz += (P[i + 1].z - P[i].z) / l1; }
    var ll = Math.hypot(dx, dz) || 1;
    dir.push([dx / ll, dz / ll]);
  }
  // the last stretch comes straight at you
  dir[n - 1] = [0, -1];
  if (run > 0.01) dir[n - 2] = [0, -1];
  // each bend reaches no further than the shorter stretch beside it, so a
  // long far stretch cannot throw a loop into a short near one
  var len = [];
  for (var li = 0; li < n - 1; li++) len.push(Math.hypot(P[li + 1].x - P[li].x, P[li + 1].z - P[li].z));
  var pts = [], acc = 0;
  for (var s = 0; s < n - 1; s++) {
    var A = P[s], Bp = P[s + 1], L = len[s];
    var m1 = Math.min(L, s > 0 ? len[s - 1] : L) * 0.3, m2 = Math.min(L, s < n - 2 ? len[s + 1] : L) * 0.3;
    var c1x = A.x + dir[s][0] * m1, c1z = A.z + dir[s][1] * m1;
    var c2x = Bp.x - dir[s + 1][0] * m2, c2z = Bp.z - dir[s + 1][1] * m2;
    var steps = Math.max(8, Math.min(400, Math.round(L * 3)));
    for (var k = s === 0 ? 0 : 1; k <= steps; k++) {
      var t = k / steps, u = 1 - t;
      var x = u * u * u * A.x + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * Bp.x;
      var z = u * u * u * A.z + 3 * u * u * t * c1z + 3 * u * t * t * c2z + t * t * t * Bp.z;
      if (pts.length) acc += Math.hypot(x - pts[pts.length - 1].x, z - pts[pts.length - 1].z);
      pts.push({ x: x, z: z, s: acc });
    }
  }
  return { pts: pts, len: acc };
}
/* Where along the path (s ground units from its start), and which way it runs. */
function torPathAt(path, s) {
  var p = path.pts, lo = 0, hi = p.length - 1;
  while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (p[mid].s < s) lo = mid; else hi = mid; }
  var a = p[lo], b = p[hi], seg = Math.max(1e-6, b.s - a.s), t = clamp((s - a.s) / seg, 0, 1);
  var tx = b.x - a.x, tz = b.z - a.z, tl = Math.hypot(tx, tz) || 1;
  return { x: lerp(a.x, b.x, t), z: lerp(a.z, b.z, t), tx: tx / tl, tz: tz / tl };
}

/* The pieces of one gate. Each piece is a small closed solid (a box, a
   curved box or a many-sided pillar) given as faces of 3D points; tone
   says how it is coloured. Local units: u across the gate, y up, v along
   the path. */
function torPieces(lod) {
  var h = TORII.gateHeight, half = TORII.width * h / 2, r = TORII.pillar * h / 2;
  var kt = 0.065 * h, st = 0.05 * h, sori = TORII.sori * h;
  var kTop = h - sori, kBot = kTop - kt, pTop = kBot - st;     // the upper beam's middle, and the top of the pillars
  var lean = Math.tan(TORII.lean * PI / 180) * pTop;                // how far the pillar tops come in
  var feetH = TORII.feet * h, nukiY = TORII.nukiAt * h, nt = 0.05 * h;
  var facets = lod > 0.5 ? 10 : lod > 0.15 ? 6 : 4, segs = lod > 0.5 ? 10 : lod > 0.15 ? 4 : 2;
  var pieces = [];
  function pillarAt(y) { return half - lean * (y / pTop); }      // the pillar's middle, from the gate's middle, at height y
  // a pillar (or a foot): a many-sided solid from y0 to y1
  function prism(side, y0, y1, r0, r1, tone, cap) {
    var faces = [];
    var c0 = side * pillarAt(y0), c1 = side * pillarAt(y1);
    for (var i = 0; i < facets; i++) {
      var a0 = (i / facets) * TAU, a1 = ((i + 1) / facets) * TAU;
      faces.push({ tone: tone, p: [[c0 + Math.cos(a0) * r0, y0, Math.sin(a0) * r0], [c0 + Math.cos(a1) * r0, y0, Math.sin(a1) * r0],
                                   [c1 + Math.cos(a1) * r1, y1, Math.sin(a1) * r1], [c1 + Math.cos(a0) * r1, y1, Math.sin(a0) * r1]] });
    }
    if (cap) {
      var ring = [];
      for (var j = 0; j < facets; j++) { var aa = (j / facets) * TAU; ring.push([c1 + Math.cos(aa) * r1, y1, Math.sin(aa) * r1]); }
      faces.push({ tone: tone, p: ring });
    }
    pieces.push({ faces: faces, c: [(c0 + c1) / 2, (y0 + y1) / 2, 0] });
  }
  // a beam from u0 to u1, its bottom and top following yb(u) and yt(u), d deep;
  // cut into pieces so each sorts on its own against the gates around it
  function beam(u0, u1, yb, yt, d, topTone, n) {
    for (var k = 0; k < n; k++) {
      var a = lerp(u0, u1, k / n), b = lerp(u0, u1, (k + 1) / n);
      var q = [[a, yb(a), -d], [b, yb(b), -d], [b, yt(b), -d], [a, yt(a), -d],
               [a, yb(a), d], [b, yb(b), d], [b, yt(b), d], [a, yt(a), d]];
      var faces = [
        { tone: 'v', p: [q[0], q[1], q[2], q[3]] },            // one face
        { tone: 'v', p: [q[4], q[7], q[6], q[5]] },            // the other face
        { tone: topTone, p: [q[3], q[2], q[6], q[7]] },        // top
        { tone: 'v', p: [q[0], q[4], q[5], q[1]] }             // underside
      ];
      if (k === 0) faces.push({ tone: 'v', p: [q[0], q[3], q[7], q[4]] });
      if (k === n - 1) faces.push({ tone: 'v', p: [q[1], q[5], q[6], q[2]] });
      pieces.push({ faces: faces, c: [(a + b) / 2, (yb(a) + yt(b)) / 2, 0] });
    }
  }
  // pillars and feet
  [-1, 1].forEach(function (side) {
    if (feetH > 0.001) prism(side, 0, feetH, r * 1.16, r * 1.12, 'f', true);
    prism(side, feetH, pTop, r, r * 0.94, 'v', false);
  });
  // the tie beam (nuki) through the pillars, its ends showing past them
  var nL = pillarAt(nukiY) + r + 0.1 * h, pin = pillarAt(nukiY), nd = r * 0.62;
  var nb = function () { return nukiY - nt / 2; }, ntp = function () { return nukiY + nt / 2; };
  beam(-nL, -pin - r * 0.9, nb, ntp, nd, 'v', 1);
  beam(-pin + r * 0.9, pin - r * 0.9, nb, ntp, nd, 'v', Math.max(1, segs - 2));
  beam(pin + r * 0.9, nL, nb, ntp, nd, 'v', 1);
  // the short post in the middle
  if (TORII.gakuzuka && lod > 0.08) beam(-0.035 * h, 0.035 * h, ntp, function () { return pTop; }, r * 0.55, 'v', 1);
  // the upper beams: the shimaki, and the kasagi on it, both curving up toward the ends
  var sL = pillarAt(pTop) + TORII.overhang * h * 0.82, kL = pillarAt(pTop) + TORII.overhang * h;
  function curve(L, amt) { return function (u) { var x = Math.abs(u) / L; return amt * x * x * (0.6 + 0.4 * x); }; }
  var cs = curve(sL, sori * 0.55), ck = curve(kL, sori);
  beam(-sL, sL, function (u) { return pTop + cs(u); }, function (u) { return kBot + cs(u); }, r * 0.9, 'v', segs);
  beam(-kL, kL, function (u) { return kBot + ck(u); }, function (u) { return kTop + ck(u); }, r * 1.25, 't', segs);
  return pieces;
}
/* One gate's pieces into the world at (x, z), its across direction (ax, az)
   and along the path (tx, tz). */
function torPlace(pieces, g) {
  function w(p) { return [g.x + g.ax * p[0] + g.tx * p[2], p[1], g.z + g.az * p[0] + g.tz * p[2]]; }
  return pieces.map(function (pc) {
    return { faces: pc.faces.map(function (f) { return { tone: f.tone, p: f.p.map(w) }; }), c: w(pc.c), g: g };
  });
}
/* The gravel path. It is laid on the ground along the same winding path as
   the gates, as wide as the shadow each gate throws (the same footprint
   the shadows in bakeGates use), and after the last gate it carries on
   straight toward you until it is off the bottom of the screen. Both
   edges are worked out on the ground and then put through the same
   camera as the gates, so it narrows toward the horizon and the gates
   stand on it in proportion. It is a packed base with pebbles on it
   (counted by how much of the screen they cover, so the far ones are
   tiny and the near ones are not too few), a few of them drifting out
   onto the leaves at the edges, and a few fallen leaves. The same mist
   as the ground is laid over it, so it melts into the horizon. Baked
   into GRAV, with the gates. */
function torBakeGravel(path) {
  if (!W || !TORII.gravel || !path || path.pts.length < 2) return;
  var hy = H * LAND.horizon, F = torLens(), h = TORII.gateHeight, r = rngFrom(97531);
  var wu = (TORII.width * h / 2 + TORII.pillar * h * 1.5) * TORII.pathWidth;      // half the shadow's width
  var C = {}; for (var ck in TORII.colours) C[ck] = hexToRgb(TORII.colours[ck]);
  // the middle line: the path, then straight on toward you, past the bottom of the screen
  var mid = path.pts.map(function (p) { return { x: p.x, z: p.z }; });
  var last = mid[mid.length - 1], zExit = F / Math.max(8, (1.08 - LAND.horizon) * H);
  if (last.z > zExit) {
    var steps = Math.max(2, Math.ceil((last.z - zExit) / 0.6));
    for (var e = 1; e <= steps; e++) mid.push({ x: last.x, z: lerp(last.z, zExit, e / steps) });
  }
  // both edges at a fraction of the width (-1 … 1 across), on the screen
  var nM = mid.length, nrm = [];
  for (var i = 0; i < nM; i++) {
    var a = mid[Math.max(0, i - 1)], b = mid[Math.min(nM - 1, i + 1)];
    var tx = b.x - a.x, tz = b.z - a.z, tl = Math.hypot(tx, tz) || 1;
    nrm.push([-tz / tl, tx / tl]);
  }
  function across(i, v) { return torScreen(mid[i].x + nrm[i][0] * wu * v, 0, Math.max(0.3, mid[i].z + nrm[i][1] * wu * v)); }
  TOR.gravTop = Math.max(0, Math.floor(hy - 8));
  var cw = Math.round(W * PR), chh = Math.max(1, Math.round((H - TOR.gravTop) * PR));
  TOR.grav.cnv.width = cw; TOR.grav.cnv.height = chh;
  var c = TOR.grav.c, es = TORII.edgeSoft, base = 1 - es * 0.6;
  c.setTransform(PR, 0, 0, PR, 0, -TOR.gravTop * PR);
  // the packed base
  var L = [], R = [];
  for (var j = 0; j < nM; j++) { L.push(across(j, -base)); R.push(across(j, base)); }
  c.fillStyle = rgba(koyoLight(mixRgb(C.gravel, C.gravelDark, 0.12)));
  c.beginPath();
  L.forEach(function (p, k) { if (k) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); });
  for (var k2 = nM - 1; k2 >= 0; k2--) c.lineTo(R[k2][0], R[k2][1]);
  c.closePath(); c.fill();
  // pebbles and leaves, a stretch of the path at a time (stretches under 2 px long are joined)
  var keep = [0];
  for (var q = 1; q < nM; q++) {
    var kp = keep[keep.length - 1];
    if (Math.abs(L[q][1] - L[kp][1]) + Math.abs(L[q][0] - L[kp][0]) >= 2 || q === nM - 1) keep.push(q);
  }
  var leafTones = [KOYO_FAMILIES.red[1], KOYO_FAMILIES.red[2], KOYO_FAMILIES.orange[1], KOYO_FAMILIES.gold[1]];
  var total = 0, MAXP = 60000, ctlP = 0.11 * TORII.pebbles, ctlL = 0.0007 * TORII.pathLeaves, ctlE = 0.0016 * TORII.pathLeaves;
  var span = 1 + es;
  for (var s = 0; s < keep.length - 1 && total < MAXP; s++) {
    var i0 = keep[s], i1 = keep[s + 1];
    var A0 = across(i0, -span), A1 = across(i0, span), B0 = across(i1, -span), B1 = across(i1, span);
    if (Math.max(A0[1], A1[1], B0[1], B1[1]) < hy - 4) continue;
    var area = Math.abs((A0[0] * A1[1] - A1[0] * A0[1]) + (A1[0] * B1[1] - B1[0] * A1[1]) + (B1[0] * B0[1] - B0[0] * B1[1]) + (B0[0] * A0[1] - A0[0] * B0[1])) / 2;
    var zc = (mid[i0].z + mid[i1].z) / 2, pu = F / zc;                 // px per ground unit here
    var nP = Math.min(MAXP - total, Math.round(area * ctlP)), nL = Math.round(area * ctlL + (r() < (area * ctlL) % 1 ? 1 : 0));
    total += nP;
    for (var m = 0; m < nP; m++) {
      var u = r(), v = (r() * 2 - 1) * span;
      if (Math.abs(v) > 1 && r() > (span - Math.abs(v)) / Math.max(0.001, es)) continue;   // thinning out past the edge
      var p2 = across(i0, v), pn = across(i1, v), px = lerp(p2[0], pn[0], u), py = lerp(p2[1], pn[1], u);
      if (py < hy - 2) continue;
      var sz = Math.max(0.6, 0.04 * pu * TORII.pebbleSize * lerp(0.5, 1.5, r() * r()));
      var tone = r() < 0.2 ? C.gravel : mixRgb(C.gravelDark, C.gravelLight, r());
      tone = scaleRgb(tone, lerp(0.92, 1.06, r()));
      c.setTransform(PR, 0, 0, PR * lerp(0.4, 0.6, r()), px * PR, (py - TOR.gravTop) * PR);
      c.fillStyle = rgba(koyoLight(tone));
      c.beginPath(); c.arc(0, 0, sz / 2, 0, TAU); c.fill();
    }
    var nE = Math.round(area * ctlE + (r() < (area * ctlE) % 1 ? 1 : 0));      // leaves across the edges, to break the line
    for (var lf = 0; lf < nL + nE; lf++) {
      var lv = lf < nL ? (r() * 2 - 1) * (1 + es * 0.5) : (r() < 0.5 ? -1 : 1) * lerp(0.82, 1.1, r()), lu = r(), la = across(i0, lv), lb = across(i1, lv);
      var lx = lerp(la[0], lb[0], lu), ly = lerp(la[1], lb[1], lu);
      if (ly < hy + 2) continue;
      var lt = leafTones[Math.floor(r() * leafTones.length)];
      lt = scaleRgb(mixRgb(lt, C.gravelDark, r() * 0.35), lerp(0.74, 1.05, r()));
      c.setTransform(PR, 0, 0, PR * lerp(0.35, 0.6, r()), lx * PR, (ly - TOR.gravTop) * PR);
      landLeafLo(c, Math.max(2, 0.2 * pu * lerp(0.7, 1.3, r())), r() * TAU);
      c.fillStyle = rgba(koyoLight(lt)); c.fill();
    }
  }
  // the same mist as the ground, lying over it: thick at the horizon, thinning toward you
  c.setTransform(PR, 0, 0, PR, 0, -TOR.gravTop * PR);
  var mistC = koyoLight(LAND_C.mist), gh = LAND.groundHaze, mz = c.createLinearGradient(0, hy - 2, 0, H);
  mz.addColorStop(0, rgba(mistC, 0.9 * gh)); mz.addColorStop(0.2, rgba(mistC, 0.4 * gh));
  mz.addColorStop(0.55, rgba(mistC, 0.12 * gh)); mz.addColorStop(1, rgba(mistC, 0));
  c.globalCompositeOperation = 'source-atop';
  c.fillStyle = mz; c.fillRect(-10, hy - 10, W + 20, H - hy + 20);
  c.globalCompositeOperation = 'source-over';
}
function torDrawGravel(c) {
  if (!TOR.ready || !TORII.gravel || TOR.grav.cnv.width < 2 || ENV.scene !== 'autumn') return;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.drawImage(TOR.grav.cnv, 0, Math.round(TOR.gravTop * PR));
  torDrawPools(c, lastT);                                   // the lanterns' pools of light on it, after dusk
}
/* ---------- Stone lanterns (tōrō) beside the gravel path ----------
   As tuned on bamboo.html (values in LANT). A Kasuga-style lantern of grey
   granite stands beside the path in the gap between two gates, on both
   sides: a plinth and base, a round pillar with two rings, a lotus platform,
   a six-sided light box with a paper window in each side, a roof with
   curled-up corners, and a jewel on top. Each is a little different (paler or
   darker, more or less moss) and has a few red leaves on its roof and base.
   Each is built in 3D like the gates and drawn in among their pieces, so
   gates and lanterns overlap as they really would.
   From sunset the windows glow (LANT.lightEvening, then LANT.lightNight at
   night, following the app's own light, torLampLevel). The light they throw
   on the nearby gate pillars and stone is baked in, and the rest is added each
   frame: the windows brighten and dim (a mask of just the parts of each window
   that are not hidden behind a gate or another lantern), a soft glow in the
   air around each, and a pool of light on the ground under it. Every lantern
   flickers on its own, at random moments, and never keeps step with another
   (torFlameAt). With reduced motion on, the light stays steady. */
var TOR_LEAF_TONES = [KOYO_FAMILIES.red[1], KOYO_FAMILIES.red[2], KOYO_FAMILIES.orange[1], KOYO_FAMILIES.red[0]];
var torLanterns = [], torLanternCount = 0;      // the lanterns on the screen, as last baked
function torLanternPieces(lod, rs) {
  var h = LANT.size, n = Math.round(LANT.sides), off = PI / n, P = LANT.pillar * h, B = LANT.box * h, R = LANT.roof * h;
  // detail by size on the screen (lod: its height / 90 px): the far ones, only a few px tall, are built
  // from far fewer faces (no rings, petals, curls or jewel detail), which cannot be seen at that size
  var round = lod > 0.5 ? 12 : lod > 0.2 ? 8 : lod > 0.08 ? 6 : 4, full = lod > 0.3, tiny = lod <= 0.1;
  var pieces = [];
  function ring(cx, cz, y, r, k, o) {
    var out = [];
    for (var i = 0; i < k; i++) { var a = o + (i / k) * TAU; out.push([cx + Math.cos(a) * r, y, cz + Math.sin(a) * r]); }
    return out;
  }
  // a solid from y0 to y1 with k sides, r0 at the bottom and r1 at the top; its middle can move (c0 → c1)
  function frustum(y0, y1, r0, r1, k, o, tone, opt) {
    opt = opt || {};
    var c0 = opt.c0 || [0, 0], c1 = opt.c1 || c0;
    var lo = ring(c0[0], c0[1], y0, r0, k, o), hi = ring(c1[0], c1[1], y1, r1, k, o), faces = [];
    for (var i = 0; i < k; i++) {
      var j = (i + 1) % k;
      faces.push({ tone: opt.alt && i % 2 ? opt.alt : tone, p: [lo[i], lo[j], hi[j], hi[i]] });
    }
    if (opt.top && r1 > 1e-4) faces.push({ tone: opt.topTone || tone, p: hi.slice().reverse() });
    if (opt.bottom && r0 > 1e-4) faces.push({ tone: tone, p: lo });
    if (opt.windows) {                                  // a paper window set into each side, just proud of it
      for (var w = 0; w < k; w++) {
        var a = lo[w], b = lo[(w + 1) % k], mx = (a[0] + b[0]) / 2, mz = (a[2] + b[2]) / 2, ml = Math.hypot(mx, mz) || 1;
        var px = mx / ml * 0.004 * h, pz = mz / ml * 0.004 * h, f = opt.windows;
        var ya = y0 + (y1 - y0) * 0.14, yb = y1 - (y1 - y0) * 0.12;
        var wp = function (t, y) { return [lerp(mx, lerp(a[0], b[0], t), f) + px, y, lerp(mz, lerp(a[2], b[2], t), f) + pz]; };
        faces.push({ tone: 'w', p: [wp(0, ya), wp(1, ya), wp(1, yb), wp(0, yb)] });
      }
    }
    pieces.push({ faces: faces, c: [(c0[0] + c1[0]) / 2, (y0 + y1) / 2, (c0[1] + c1[1]) / 2], part: opt.part || 's' });
  }
  var yPl = 0.035 * h, yBa = 0.085 * h, yNk = 0.105 * h, yR1 = 0.27 * h, yR2 = 0.3 * h, rH = 0.014 * h, yPt = 0.5 * h;
  var yLo = 0.565 * h, yLb = 0.595 * h, yBx = 0.745 * h, yEv = 0.77 * h, yRf = 0.875 * h;
  // plinth and base
  if (tiny) frustum(0, yBa, B * 1.9, B * 1.2, n, off, 'm', { top: true });
  else {
    frustum(0, yPl, B * 1.9, B * 1.86, n, off, 'm', { top: true });
    frustum(yPl, yBa, B * 1.5, B * 1.2, n, off, 'm', { top: true });
    frustum(yBa, yNk, P * 1.3, P * 1.08, round, 0, 's', { top: true });
  }
  // the pillar, with two rings round it
  if (full) {
    frustum(yNk, yR1, P, P * 0.97, round, 0, 's');
    frustum(yR1, yR1 + rH, P * 1.13, P * 1.13, round, 0, 's', { top: true });
    frustum(yR1 + rH, yR2, P * 0.965, P * 0.96, round, 0, 's');
    frustum(yR2, yR2 + rH, P * 1.12, P * 1.12, round, 0, 's', { top: true });
    frustum(yR2 + rH, yPt, P * 0.955, P * 0.92, round, 0, 's');
  } else frustum(tiny ? yBa : yNk, yPt, P, P * 0.92, round, 0, 's');
  // the lotus platform: petals flaring out, then a band
  if (tiny) frustum(yPt, yLb, P * 1.05, B * 1.5, n, off, 's', { top: true });
  else {
    frustum(yPt, yLo, P * 1.05, B * 1.55, full ? Math.max(n * 3, round + 4) : n, full ? 0 : off, 's', full ? { alt: 'd' } : {});
    frustum(yLo, yLb, B * 1.55, B * 1.5, n, off, 's', { top: true });
  }
  // the light box, its windows facing the path and the other sides
  frustum(yLb, yBx, B, B, n, off, 'b', { windows: 0.66, part: 'box' });
  // the roof: the eaves, the slope up to the top, and the corners curling up
  frustum(yBx, yEv, R, R * 0.97, n, off, 's', { bottom: true });
  frustum(yEv, yRf, R * 0.97, 0.055 * h, n, off, 'r', { top: true });
  if (LANT.curls && lod > 0.25) {
    ring(0, 0, 0, R, n, off).forEach(function (v) {
      frustum(yEv - 0.012 * h, yEv + 0.03 * h, 0.016 * h, 0.01 * h, 4, PI / 4, 'r',
              { c0: [v[0] * 0.97, v[2] * 0.97], c1: [v[0] * 1.05, v[2] * 1.05], top: true });
    });
  }
  // the jewel on top
  var J = full ? [[yRf, 0.035], [0.9 * h, 0.04], [0.925 * h, 0.052], [0.952 * h, 0.05], [0.976 * h, 0.032], [h, 0.002]]
               : tiny ? [[yRf, 0.045], [h, 0.002]] : [[yRf, 0.035], [0.925 * h, 0.052], [h, 0.002]];
  for (var j = 0; j < J.length - 1; j++) frustum(J[j][0], J[j + 1][0], J[j][1] * h, J[j + 1][1] * h, round, 0, 's', { top: j === J.length - 2 });
  // a few fallen leaves on the roof and the base, as in the photos
  pieces.leaves = [];
  var nLv = Math.round(LANT.roofLeaves * (lod > 0.4 ? 7 : lod > 0.12 ? 3 : 0) * lerp(0.4, 1.6, rs()));
  for (var q = 0; q < nLv; q++) {
    var onRoof = rs() < 0.6, a2 = rs() * TAU, rr = onRoof ? lerp(0.1, 0.75, rs()) : lerp(0.75, 0.98, rs());
    var r2 = onRoof ? lerp(R * 0.97, 0.055 * h, rr) : B * 1.86 * rr, y2 = onRoof ? lerp(yEv, yRf, rr) + 0.004 * h : yPl + 0.003 * h;
    pieces.leaves.push({ p: [Math.cos(a2) * r2, y2, Math.sin(a2) * r2], s: 0.022 * h * lerp(0.7, 1.3, rs()),
                         rot: rs() * TAU, t: rs(), roof: onRoof });
  }
  return pieces;
}
/* Where the lanterns stand: in the gaps between the gates (every LANT.every
   gap), beside the path, just off the gravel. Each side has its own place
   in the gap (LANT.rightAlong, LANT.leftAlong) and its own gap from the gravel. */
function torPlaceLanterns(path, gap) {
  var out = [];
  if (!LANT.show || !path || path.len <= 0) return out;
  var h = TORII.gateHeight, wu = (TORII.width * h / 2 + TORII.pillar * h * 1.5) * TORII.pathWidth;
  var every = Math.max(1, Math.round(LANT.every)), k = 0;
  for (var s = path.len - gap; s > -1e-6; s -= gap, k++) {          // s: the gate at the start of this gap (further from you)
    if (k % every) continue;
    var sides;
    // right as you walk toward the gate facing you is (tz, -tx); the gates' across direction (ax, az) is the left
    if (LANT.side === 'both') sides = [-1, 1];
    else if (LANT.side === 'alternate') sides = [(k / every) % 2 ? 1 : -1];
    else sides = [LANT.side === 'left' ? 1 : -1];
    sides.forEach(function (sd) {
      var right = sd < 0, along = right ? LANT.rightAlong : LANT.leftAlong;
      // from the middle of the path to the middle of the lantern
      var off = wu + (right ? LANT.rightFromEdge : LANT.leftFromEdge) * LANT.size + LANT.box * LANT.size * 1.9;
      var q = torPathAt(path, clamp(s + along * gap, 0, path.len));
      out.push({ x: q.x - q.tz * off * sd, z: q.z + q.tx * off * sd, tx: q.tx, tz: q.tz, ax: -q.tz * sd, az: q.tx * sd,
                 seed: (k * 7919 + (sd > 0 ? 3 : 0)) >>> 0 });
    });
  }
  return out;
}
/* How bright the lanterns are now: 0 by day, coming on as the light dims at
   sunset (LANT.lightEvening) and full at night (LANT.lightNight), and going
   out again after sunrise. It follows the app's own light, so it changes
   smoothly with the time of day. */
function torLampLevel() {
  var d = ENV.light ? ENV.light.dark : 0;
  return smooth(0.04, 0.2, d) * lerp(LANT.lightEvening, LANT.lightNight, koyoNight());
}

/* Both baked at once (the last step of a landscape bake). */
/* The top edge of a gate's upper beam (kasagi) on the screen, end to end, as
   torPieces builds it: where the birds perch (see "Birds"). Its front edge,
   which is the top of the beam as it is seen from below. */
function torPerchLine(g) {
  var h = TORII.gateHeight, half = TORII.width * h / 2, r = TORII.pillar * h / 2, sori = TORII.sori * h;
  var kTop = h - sori, pTop = kTop - 0.065 * h - 0.05 * h;
  var kL = half - Math.tan(TORII.lean * PI / 180) * pTop + TORII.overhang * h, d = r * 1.25, pts = [];
  for (var i = 0; i <= 32; i++) {
    var u = lerp(-kL, kL, i / 32), x = Math.abs(u) / kL, y = kTop + sori * x * x * (0.6 + 0.4 * x);
    pts.push(torScreen(g.x + g.ax * u + g.tx * d, y, g.z + g.az * u + g.tz * d));
  }
  if (pts[0][0] > pts[32][0]) pts.reverse();
  if (pts[0][0] < 0 || pts[32][0] > W || pts[16][1] < 0) return null;   // only a gate whose top is all on the screen
  return { pts: pts, px: g.px, x0: pts[0][0], x1: pts[32][0] };
}
function torBake() {
  TOR.ready = false;
  TOR.perch = null;
  torLanterns = []; torLanternCount = 0;
  TOR.gate.cnv.width = 1; TOR.gate.cnv.height = 1;
  TOR.grav.cnv.width = 1; TOR.grav.cnv.height = 1;
  if (!W) return;
  var path = torPath();
  torBakeGravel(path);
  var hy = H * LAND.horizon, F = torLens(), C = {}, LC = {};
  for (var ck in TORII.colours) C[ck] = hexToRgb(TORII.colours[ck]);
  for (var lk in LANT.colours) LC[lk] = hexToRgb(LANT.colours[lk]);
  var mistC = koyoLight(LAND_C.mist), lit = torLampLevel();
  var gap = Math.max(0.05, path.len / Math.max(1, TORII.count - 1));
  function depthOf(foot) {
    var depth = clamp((foot - hy) / Math.max(1, H - hy), 0, 1);       // 0 at the horizon … 1 at the bottom
    var farness = 1 - smooth(0, Math.max(0.02, TORII.focusDepth), depth);
    return { haze: lerp(TORII.hazeNear, TORII.hazeFar, Math.pow(farness, 1.3)), band: Math.round(farness * (TOR_BANDS - 1)) };
  }
  // the gates, from the end (the one facing you) back to the start
  var gates = [];
  if (TORII.show) for (var s = path.len; s >= 0; s -= gap) {
    var q = torPathAt(path, s);
    if (q.z < 0.6) continue;                           // behind or right at the camera
    var foot = hy + F / q.z;                           // its foot on the screen
    var px = TORII.gateHeight * F / q.z;                   // its height on the screen
    var x0 = W / 2 + F * q.x / q.z;
    if (x0 < -px * 2 || x0 > W + px * 2) continue;     // well off the screen
    var dq = depthOf(foot);
    gates.push({ x: q.x, z: q.z, tx: q.tx, tz: q.tz, ax: -q.tz, az: q.tx, px: px, foot: foot, haze: dq.haze, band: dq.band });
  }
  // the lanterns
  torPlaceLanterns(path, gap).forEach(function (Lp) {
    if (Lp.z < 0.6) return;
    var foot = hy + F / Lp.z, px = LANT.size * F / Lp.z, x0 = W / 2 + F * Lp.x / Lp.z;
    if (x0 < -px || x0 > W + px) return;
    var dq = depthOf(foot), rs = rngFrom(Lp.seed * 31 + 17);
    Lp.foot = foot; Lp.px = px; Lp.haze = dq.haze; Lp.band = dq.band; Lp.lantern = true;
    Lp.tone = lerp(1 - 0.12 * LANT.variety, 1 + 0.08 * LANT.variety, rs());          // paler or darker granite
    Lp.moss = clamp(LANT.moss * lerp(1 - LANT.variety * 0.8, 1 + LANT.variety * 0.6, rs()), 0, 1);
    Lp.ly = 0.67 * LANT.size;                                                     // the flame, in the middle of the light box
    Lp.rs = rs;
    torLanterns.push(Lp);
  });
  torLanternCount = torLanterns.length;
  // the birds perch on the nearest gate
  var front = null;
  gates.forEach(function (g) { if (!front || g.foot > front.foot) front = g; });
  if (front) TOR.perch = torPerchLine(front);
  if (!gates.length && !torLanterns.length) { TOR.ready = true; return; }
  // the light: from above, in front, and to the side TORII.lightFrom
  var Lx = TORII.lightFrom, Ly = 1.1, Lz = -0.6, Ll = Math.hypot(Lx, Ly, Lz); Lx /= Ll; Ly /= Ll; Lz /= Ll;
  // every piece of every gate, furthest first; each lantern goes in whole, at the distance of its middle
  var all = [], minY = H;
  gates.forEach(function (g) {
    var lod = clamp(g.px / 120, 0, 1);
    torPlace(torPieces(lod), g).forEach(function (pc) {
      var dx = pc.c[0], dy = pc.c[1] - 1, dz = pc.c[2];
      pc.dist = dx * dx + dy * dy + dz * dz;
      all.push(pc);
    });
    minY = Math.min(minY, g.foot - g.px * 1.15);
  });
  torLanterns.forEach(function (Lp) {
    var lod = clamp(Lp.px / 90, 0, 1), raw = torLanternPieces(lod, Lp.rs);
    var dy = LANT.size * 0.5 - 1, D = Lp.x * Lp.x + dy * dy + Lp.z * Lp.z;
    torPlace(raw, Lp).forEach(function (pc, i) {
      pc.dist = D - i * 1e-7;                          // its own pieces from the ground up
      pc.part = raw[i].part;
      all.push(pc);
    });
    Lp.leaves = raw.leaves.map(function (lf) {
      var p = lf.p;
      return { w: [Lp.x + Lp.ax * p[0] + Lp.tx * p[2], p[1], Lp.z + Lp.az * p[0] + Lp.tz * p[2]], s: lf.s, rot: lf.rot, t: lf.t, roof: lf.roof };
    });
    all[all.length - 1].leavesOf = Lp;                 // drawn just after its last piece
    minY = Math.min(minY, Lp.foot - Lp.px * 1.1);
  });
  all.sort(function (a, b) { return b.dist - a.dist; });
  TOR.gateTop = Math.max(0, Math.floor(minY - 12));
  var cw = Math.round(W * PR), chh = Math.max(1, Math.round((H - TOR.gateTop) * PR));
  var bands = [];
  for (var bi = 0; bi < TOR_BANDS; bi++) { var Lb = landCanvas(); Lb.cnv.width = cw; Lb.cnv.height = chh; Lb.c.setTransform(PR, 0, 0, PR, 0, -TOR.gateTop * PR); bands.push(Lb); }
  // the shadow of the line of gates (and of each lantern) on the ground, thrown away from the light
  var SH = landCanvas(); SH.cnv.width = cw; SH.cnv.height = chh;
  var sc = SH.c;
  sc.setTransform(PR, 0, 0, PR, 0, -TOR.gateTop * PR);
  function shadowQuad(o, wu, wv, k, alpha) {
    var corners = [[-wu, -wv], [wu, -wv], [wu, wv], [-wu, wv]].map(function (c) {
      var x = o.x + o.ax * c[0] + o.tx * c[1] + shx * k, z = o.z + o.az * c[0] + o.tz * c[1] + shz * k;
      return torScreen(x, 0, Math.max(0.3, z));
    });
    sc.fillStyle = rgba(C.ground, alpha);
    sc.beginPath(); corners.forEach(function (p, i) { if (i) sc.lineTo(p[0], p[1]); else sc.moveTo(p[0], p[1]); }); sc.closePath(); sc.fill();
  }
  var shx = -Lx / Ly * TORII.gateHeight * 0.35, shz = -Lz / Ly * TORII.gateHeight * 0.35;
  if (TORII.shadow > 0) {
    gates.forEach(function (g) {
      shadowQuad(g, TORII.width * TORII.gateHeight / 2 + TORII.pillar * TORII.gateHeight * 1.5, gap * 0.52, 0.5, TORII.shadow * (1 - g.haze));
    });
    var lsk = LANT.size / TORII.gateHeight;
    torLanterns.forEach(function (Lp) {
      var r0 = LANT.box * LANT.size * 2.2;
      shadowQuad(Lp, r0, r0, 0.5 * lsk, TORII.shadow * 1.1 * (1 - Lp.haze));
    });
  }
  // the light the lanterns throw on what is near them (evening and night)
  var flame = LC.flame, reach = Math.max(0.1, LANT.reach * LANT.size), cast = LANT.castLight * lit;
  // the lanterns in squares of the ground as wide as the light reaches, so each face only looks at the ones near it
  var lampGrid = {};
  if (cast > 0) torLanterns.forEach(function (Lp) {
    var key = Math.floor(Lp.x / reach) + ',' + Math.floor(Lp.z / reach);
    (lampGrid[key] || (lampGrid[key] = [])).push(Lp);
  });
  function lampLight(pc, cx, cy, cz, nx, ny, nz) {
    if (cast <= 0) return 0;
    var sum = 0, gx = Math.floor(cx / reach), gz = Math.floor(cz / reach);
    for (var q = 0; q < 9; q++) {
     var cell = lampGrid[(gx + q % 3 - 1) + ',' + (gz + Math.floor(q / 3) - 1)];
     if (cell) for (var i = 0; i < cell.length; i++) {
      var Lp = cell[i];
      if (pc.g === Lp && pc.part === 'box') continue;  // its own light box is lit from inside, through the windows
      var vx = Lp.x - cx, vy = Lp.ly - cy, vz = Lp.z - cz, d = Math.hypot(vx, vy, vz);
      if (d >= reach || d < 1e-6) continue;
      var lam = (nx * vx + ny * vy + nz * vz) / d;
      if (lam <= 0) continue;
      var fall = 1 - d / reach;
      sum += lam * fall * fall;
     }
    }
    return Math.min(1.2, sum) * cast;
  }
  // the windows of the lit lanterns, on one canvas (TOR.mask) over the part of the screen they cover: each window
  // is added as it is drawn, and any face drawn later (nearer) over it rubs it out, so just the parts of the
  // windows that are not hidden are left. Each lantern has its own box on it, for its own flicker.
  // Only made from the golden hour to the morning (the lamps are out all through the morning and the day,
  // so there is nothing to flicker), and ready before they come on.
  var masks = [], ux0 = 1e9, uy0 = 1e9, ux1 = -1e9, uy1 = -1e9;
  var lightsSoon = lit > 0 || (ENV.light && ENV.light.phase !== 'morning' && ENV.light.phase !== 'day');
  if (lightsSoon) torLanterns.forEach(function (Lp) {
    var hb = LANT.box * LANT.size * 1.05, y0 = 0.595 * LANT.size, y1 = 0.745 * LANT.size, xs = [], ys = [];
    [[-hb, -hb], [hb, -hb], [hb, hb], [-hb, hb]].forEach(function (c) {
      [y0, y1].forEach(function (y) {
        var sp = torScreen(Lp.x + Lp.ax * c[0] + Lp.tx * c[1], y, Lp.z + Lp.az * c[0] + Lp.tz * c[1]);
        xs.push(sp[0]); ys.push(sp[1]);
      });
    });
    var pad = 2 + lerp(TORII.blurNear, TORII.blurFar, Lp.band / (TOR_BANDS - 1)) * 3;
    var bx0 = Math.min.apply(null, xs) - pad, by0 = Math.min.apply(null, ys) - pad;
    var bx1 = Math.max.apply(null, xs) + pad, by1 = Math.max.apply(null, ys) + pad;
    bx0 = Math.max(bx0, -2); by0 = Math.max(by0, -2); bx1 = Math.min(bx1, W + 2); by1 = Math.min(by1, H + 2);
    if (bx1 <= bx0 || by1 <= by0) return;
    Lp.mask = { x0: bx0, y0: by0, x1: bx1, y1: by1, on: false, area: 0 };
    ux0 = Math.min(ux0, bx0); uy0 = Math.min(uy0, by0); ux1 = Math.max(ux1, bx1); uy1 = Math.max(uy1, by1);
    masks.push(Lp);
  });
  var maskGrid = {}, MCELL = 48, MC = null, mOp = '';
  if (masks.length) {
    TOR.mask.cnv.width = Math.max(1, Math.ceil((ux1 - ux0) * PR)); TOR.mask.cnv.height = Math.max(1, Math.ceil((uy1 - uy0) * PR));
    MC = TOR.mask.c;
    MC.setTransform(PR, 0, 0, PR, -ux0 * PR, -uy0 * PR);
    MC.lineWidth = 0.8;
    masks.forEach(function (Lp) {                    // which squares of the screen each window box covers
      var Mk = Lp.mask;
      Mk.ax = Math.max(0, Math.floor((Mk.x0 - ux0) * PR)); Mk.ay = Math.max(0, Math.floor((Mk.y0 - uy0) * PR));
      Mk.aw = Math.max(1, Math.min(TOR.mask.cnv.width - Mk.ax, Math.ceil((Mk.x1 - Mk.x0) * PR)));
      Mk.ah = Math.max(1, Math.min(TOR.mask.cnv.height - Mk.ay, Math.ceil((Mk.y1 - Mk.y0) * PR)));
      Mk.sx = ux0 + Mk.ax / PR; Mk.sy = uy0 + Mk.ay / PR;
      for (var gx = Math.floor(Mk.x0 / MCELL); gx <= Math.floor(Mk.x1 / MCELL); gx++)
        for (var gy = Math.floor(Mk.y0 / MCELL); gy <= Math.floor(Mk.y1 / MCELL); gy++) {
          var key = gx + ',' + gy;
          (maskGrid[key] || (maskGrid[key] = [])).push(Lp);
        }
    });
  }
  function facePath(c, scr) {
    c.beginPath();
    for (var m = 0; m < scr.length; m++) { if (m) c.lineTo(scr[m][0], scr[m][1]); else c.moveTo(scr[m][0], scr[m][1]); }
    c.closePath();
  }
  var glowWin = mixRgb(LC.paper, LC.flame, 0.55), hotWin = mixRgb(LC.flame, LC.glow, 0.6);
  // the pieces, each into the layer of its gate's (or lantern's) blur
  all.forEach(function (pc) {
    var g = pc.g, c = bands[g.band].c;
    pc.faces.forEach(function (f) {
      var n = f.p.length, cx = 0, cy = 0, cz = 0;
      for (var i = 0; i < n; i++) { cx += f.p[i][0]; cy += f.p[i][1]; cz += f.p[i][2]; }
      cx /= n; cy /= n; cz /= n;
      // its outward normal (pointing away from the middle of its piece)
      var a = f.p[0], b = f.p[1], d = f.p[n - 1];
      var ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
      var nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, nl = Math.hypot(nx, ny, nz);
      if (nl < 1e-9) return;
      nx /= nl; ny /= nl; nz /= nl;
      if (nx * (cx - pc.c[0]) + ny * (cy - pc.c[1]) + nz * (cz - pc.c[2]) < 0) { nx = -nx; ny = -ny; nz = -nz; }
      // only the faces turned toward the camera
      if (nx * cx + ny * (cy - 1) + nz * cz >= 0) return;
      for (var j = 0; j < n; j++) if (f.p[j][2] < 0.3) return;
      var lam = Math.max(0, nx * Lx + ny * Ly + nz * Lz), k = 1 - TORII.shadeDepth * (1 - lam), col, done = false;
      if (g.lantern) {
        var stone = scaleRgb(LC.stone, g.tone), shadeC = scaleRgb(LC.stoneShade, g.tone);
        if (f.tone === 'w') {                    // the paper window: plain by day, glowing (as far as it is lit) after dusk
          var wk = clamp(lit * 2, 0, 1);
          var plain = koyoLight(mixRgb(mixRgb(scaleRgb(LC.paper, 0.72), LC.paper, k), mistC, g.haze));
          var glow = mixRgb(mixRgb(glowWin, hotWin, clamp(lit * LANT.windowGlow * 0.5, 0, 1)), mistC, g.haze * 0.5);
          col = mixRgb(plain, glow, wk); done = true;
        } else {
          col = mixRgb(shadeC, stone, k);
          if (f.tone === 'd') col = scaleRgb(col, 0.84);                          // between the lotus petals
          var mossK = g.moss * (f.tone === 'm' ? 0.75 : f.tone === 'r' ? (ny > 0.2 ? 0.6 : 0.3) : 0.22 * clamp(1 - cy / LANT.size * 1.4, 0, 1));
          col = mixRgb(col, scaleRgb(LC.moss, lerp(0.7, 1.05, k)), mossK);
          if (f.tone === 'b') col = scaleRgb(col, 0.92);
        }
      } else if (f.tone === 'f') col = scaleRgb(C.feet, lerp(0.75, 1.3, lam));
      else if (f.tone === 't' && ny > 0.3) col = mixRgb(scaleRgb(C.top, 0.7), C.top, k);
      else col = mixRgb(C.shade, C.vermilion, k);
      if (!done) {
        if (ny < -0.5) col = scaleRgb(col, 0.82);                 // the undersides, in shade
        col = koyoLight(mixRgb(col, mistC, g.haze));
        var ll = lampLight(pc, cx, cy, cz, nx, ny, nz) * (1 - g.haze * 0.7);
        if (ll > 0) col = [col[0] + (col[0] * 0.6 + 70) * ll * flame[0] / 255, col[1] + (col[1] * 0.6 + 70) * ll * flame[1] / 255,
                           col[2] + (col[2] * 0.6 + 70) * ll * flame[2] / 255];
      }
      var scr = f.p.map(function (p) { return torScreen(p[0], p[1], p[2]); });
      var st = rgba(col);
      c.fillStyle = st; c.strokeStyle = st; c.lineWidth = 0.6; c.lineJoin = 'round';
      facePath(c, scr); c.fill(); c.stroke();
      // the lanterns' masks: its own windows are added; anything drawn later (nearer) over a window hides it
      if (MC) {
        if (f.tone === 'w' && g.lantern && g.mask) {
          if (mOp !== 'add') { MC.globalCompositeOperation = 'source-over'; MC.fillStyle = '#fff'; mOp = 'add'; }
          g.mask.on = true;
          var ar = 0;
          for (var e2 = 0; e2 < n; e2++) { var p1 = scr[e2], p2 = scr[(e2 + 1) % n]; ar += p1[0] * p2[1] - p2[0] * p1[1]; }
          g.mask.area += Math.abs(ar) / 2;
          facePath(MC, scr); MC.fill();
        } else {
          // over a window already drawn? then it rubs out what it covers (once, whichever lanterns' windows those are)
          var fx0 = 1e9, fy0 = 1e9, fx1 = -1e9, fy1 = -1e9, hit = false;
          for (var e = 0; e < n; e++) { fx0 = Math.min(fx0, scr[e][0]); fx1 = Math.max(fx1, scr[e][0]); fy0 = Math.min(fy0, scr[e][1]); fy1 = Math.max(fy1, scr[e][1]); }
          for (var gx2 = Math.floor(fx0 / MCELL); gx2 <= Math.floor(fx1 / MCELL) && !hit; gx2++)
            for (var gy2 = Math.floor(fy0 / MCELL); gy2 <= Math.floor(fy1 / MCELL) && !hit; gy2++) {
              var cellM = maskGrid[gx2 + ',' + gy2];
              if (cellM) for (var mi = 0; mi < cellM.length; mi++) {
                var Mk = cellM[mi].mask;
                if (Mk.on && fx1 >= Mk.x0 && fx0 <= Mk.x1 && fy1 >= Mk.y0 && fy0 <= Mk.y1) { hit = true; break; }
              }
            }
          if (hit) {
            if (mOp !== 'cut') { MC.globalCompositeOperation = 'destination-out'; MC.fillStyle = MC.strokeStyle = '#000'; mOp = 'cut'; }
            facePath(MC, scr); MC.fill(); MC.stroke();
          }
        }
      }
    });
    // the leaves lying on a lantern, once all of it is drawn
    if (pc.leavesOf) pc.leavesOf.leaves.forEach(function (lf) {
      if (lf.w[2] < 0.3) return;
      var sp = torScreen(lf.w[0], lf.w[1], lf.w[2]), sz = lf.s * F / lf.w[2];
      if (sz < 0.8) return;
      var Lq = pc.leavesOf, tones = TOR_LEAF_TONES;
      var lc = tones[Math.floor(lf.t * tones.length) % tones.length];
      lc = koyoLight(mixRgb(lc, mistC, Lq.haze));
      if (lit > 0 && lf.roof === false) lc = mixRgb(lc, flame, 0.12 * lit);
      c.save();
      c.setTransform(PR, 0, 0, PR * 0.45, sp[0] * PR, (sp[1] - TOR.gateTop) * PR);
      landLeafLo(c, sz, lf.rot);
      c.fillStyle = rgba(lc); c.fill();
      c.restore();
    });
  });
  // all of it into the gate picture: the shadow, then the layers from the softest (furthest) to the sharpest
  TOR.gate.cnv.width = cw; TOR.gate.cnv.height = chh;
  var o = TOR.gate.c;
  o.setTransform(1, 0, 0, 1, 0, 0);
  o.filter = TORII.shadowBlur > 0.05 ? 'blur(' + (TORII.shadowBlur * PR).toFixed(2) + 'px)' : 'none';
  o.drawImage(SH.cnv, 0, 0);
  for (var bj = TOR_BANDS - 1; bj >= 0; bj--) {
    var bl = lerp(TORII.blurNear, TORII.blurFar, bj / (TOR_BANDS - 1));
    o.filter = bl > 0.05 ? 'blur(' + (bl * PR).toFixed(2) + 'px)' : 'none';
    o.drawImage(bands[bj].cnv, 0, 0);
  }
  o.filter = 'none';
  // each lantern's mask: how much of its windows can be seen, then softened as its depth of field
  if (masks.length) {
    var data = TOR.mask.c.getImageData(0, 0, TOR.mask.cnv.width, TOR.mask.cnv.height).data, AWd = TOR.mask.cnv.width;
    TOR.maskB.cnv.width = TOR.mask.cnv.width; TOR.maskB.cnv.height = TOR.mask.cnv.height;
    var mb = TOR.maskB.c, byBand = {};
    masks.forEach(function (Lp) {
      var Mk = Lp.mask;
      if (!Mk.on || Mk.area <= 0) { Lp.mask = null; Lp.vis = 0; return; }
      var sum = 0;
      for (var yy = Mk.ay; yy < Mk.ay + Mk.ah; yy++) for (var xx = Mk.ax, ii = (yy * AWd + xx) * 4 + 3; xx < Mk.ax + Mk.aw; xx++, ii += 4) sum += data[ii];
      Lp.vis = clamp(sum / 255 / (PR * PR) / Mk.area, 0, 1);
      if (Lp.vis < 0.01) { Lp.mask = null; return; }
      (byBand[Lp.band] || (byBand[Lp.band] = [])).push(Mk);
    });
    // softened as their depth of field: one pass for all the masks of each step of blur
    for (var bb in byBand) {
      var bl = lerp(TORII.blurNear, TORII.blurFar, bb / (TOR_BANDS - 1)) + 0.6;
      mb.save();
      mb.beginPath();
      byBand[bb].forEach(function (Mk) { mb.rect(Mk.ax, Mk.ay, Mk.aw, Mk.ah); });
      mb.clip();
      mb.filter = 'blur(' + (bl * PR).toFixed(2) + 'px)';
      mb.drawImage(TOR.mask.cnv, 0, 0);
      mb.restore();
    }
    TOR.mask.cnv.width = TOR.mask.cnv.height = 1;
  } else TOR.maskB.cnv.width = TOR.maskB.cnv.height = 1;   // no masks by day: last night's is let go
  torLanterns.forEach(function (Lp) {
    var sp = torScreen(Lp.x, Lp.ly, Lp.z), ft = torScreen(Lp.x, 0, Lp.z);
    Lp.sx = sp[0]; Lp.sy = sp[1]; Lp.fx = ft[0]; Lp.fy = ft[1];
    if (Lp.vis === undefined) Lp.vis = 0;
    delete Lp.rs; delete Lp.leaves;
  });
  bands.forEach(function (Lb) { Lb.cnv.width = Lb.cnv.height = 1; });      // the scratch layers are let go
  SH.cnv.width = SH.cnv.height = 1;
  TOR.ready = true;
}
/* The gates and lanterns, nearest last, then the flicker in the lanterns'
   windows and the glow in the air around them. */
function torDrawGates(c) {
  if (!TOR.ready || TOR.gate.cnv.width < 2 || ENV.scene !== 'autumn') return;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalAlpha = TORII.strength;
  c.drawImage(TOR.gate.cnv, 0, Math.round(TOR.gateTop * PR));
  c.globalAlpha = 1;
  torDrawGlow(c, lastT);
}
/* How hard the wind is blowing at x just now, from the app's own gusts: a
   gust's front is felt just ahead of it and fades away behind. */
function torGustAt(x) {
  var s = 0;
  for (var i = 0; i < gusts.length; i++) {
    var g = gusts[i], d = (g.x - x) * g.dir;
    s += g.dir * (g.str / 300) * (d < 0 ? Math.exp(-(d * d) / 8100) : Math.exp(-d / 260));
  }
  return s;
}
/* Each lantern's flame now. Every lantern has its own flicker, kept from
   bake to bake (TOR_FLAMES, by the lantern's seed), and none keeps step with
   another:
   - between flickers, a slow uneven breathing (smooth random noise, its
     own for each lantern, never repeating);
   - now and then, at a random moment (on average every LANT.flickerEvery
     seconds, the gap drawn afresh each time), a flicker of a random
     length and strength, in one of three ways: a quick stutter, a dip
     that dims and recovers, or a sputter of short drops;
   - and in a gust of wind, more stutter (LANT.windFlicker). */
var TOR_FLAMES = {};
function torHash(i, seed) {
  var h = Math.imul(i ^ Math.imul(seed, 0x27D4EB2D), 0x9E3779B1);
  h ^= h >>> 15; h = Math.imul(h, 0x85EBCA77); h ^= h >>> 13;
  return ((h >>> 0) / 4294967295) * 2 - 1;
}
function torNoise(x, seed) {                     // smooth random noise, -1 … 1
  var i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return lerp(torHash(i, seed), torHash(i + 1, seed), u);
}
function torNextGap() { return -Math.log(1 - Math.random() * 0.98) * LANT.flickerEvery; }   // random, about LANT.flickerEvery on average
function torFlameAt(Lp, t) {
  if (Lp.flT === t) return Lp.fl;                // worked out once a frame
  Lp.flT = t; Lp.fl = 1;
  if (dynReduceMotion || (LANT.flicker <= 0 && LANT.wobble <= 0)) return 1;
  var st = TOR_FLAMES[Lp.seed];
  if (!st) st = TOR_FLAMES[Lp.seed] = { n: (Math.random() * 1e9) | 0, rate: lerp(0.7, 1.4, Math.random()), next: t + Math.random() * LANT.flickerEvery * 1.5, end: -1 };
  var sp = LANT.flickerSpeed * st.rate, v = 0;
  // the gentle breathing
  v += LANT.wobble * 0.14 * (0.65 * torNoise(t * 0.9 * st.rate, st.n) + 0.35 * torNoise(t * 3.1 * st.rate, st.n + 7));
  // a flicker: start one when it is due
  if (t > st.end && t >= st.next) {
    st.start = t; st.len = LANT.flickerLength * lerp(0.4, 1.7, Math.random());
    st.end = t + st.len; st.next = st.end + torNextGap();
    st.kind = Math.floor(Math.random() * 3); st.amp = lerp(0.55, 1.2, Math.random()); st.k = (Math.random() * 1e9) | 0;
  }
  if (st.next - t > LANT.flickerEvery * 6) st.next = t + torNextGap();     // the timing was turned down on the panel
  if (t < st.end) {
    var u = (t - st.start) / st.len, env = Math.sin(PI * clamp(u, 0, 1)), A = st.amp * LANT.flicker;
    if (st.kind === 0) v += A * env * 0.55 * torNoise(t * 16 * sp, st.k);                                  // a quick stutter
    else if (st.kind === 1) v += A * (-0.6 * env * env + 0.12 * env * torNoise(t * 11 * sp, st.k));       // a dip, and back
    else v += A * env * (torNoise(t * 9 * sp, st.k) > 0.15 ? -0.55 : 0.06);                             // a sputter of short drops
  }
  // a gust of wind
  var gust = Math.min(1.5, Math.abs(torGustAt(Lp.sx)) * LANT.windFlicker);
  if (gust > 0.02) v += LANT.flicker * gust * 0.35 * torNoise(t * 14 * sp, st.n + 13);
  return (Lp.fl = clamp(1 + v, 0.2, 1.5));
}
/* The soft round lights, drawn once and laid down scaled (all the same
   colour, so each lantern only changes how strongly). */
var TOR_SPR = null;
function torSprites() {
  if (TOR_SPR) return TOR_SPR;
  var gc = hexToRgb(LANT.colours.glow), fc = hexToRgb(LANT.colours.flame);
  function make(stops) {
    var o = landCanvas(); o.cnv.width = o.cnv.height = 128;
    var g = o.c.createRadialGradient(64, 64, 0, 64, 64, 64);
    stops.forEach(function (st) { g.addColorStop(st[0], rgba(st[1], st[2])); });
    o.c.fillStyle = g; o.c.fillRect(0, 0, 128, 128);
    return o.cnv;
  }
  TOR_SPR = {
    pool: make([[0, mixRgb(gc, fc, 0.3), 1], [0.35, fc, 0.45], [1, fc, 0]]),
    halo: make([[0, gc, 1], [0.18, mixRgb(gc, fc, 0.5), 0.55], [0.5, fc, 0.16], [1, fc, 0]])
  };
  return TOR_SPR;
}
/* The pool of light on the ground under each lit lantern (laid on the ground
   and the gravel, before the gates and lanterns stand on it). */
function torDrawPools(c, t) {
  var lit = torLampLevel();
  if (lit <= 0 || LANT.pool <= 0 || !torLanterns.length || !TOR.ready) return;
  var F = torLens(), spr = torSprites().pool;
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (var i = 0; i < torLanterns.length; i++) {
    var Lp = torLanterns[i], rx = LANT.poolSize * LANT.size * F / Lp.z, ry = rx / Lp.z;
    if (rx < 1.5) continue;
    if (Lp.fx + rx < 0 || Lp.fx - rx > W) continue;
    var a = LANT.pool * lit * 0.5 * torFlameAt(Lp, t) * (1 - Lp.haze * 0.8);
    c.globalAlpha = clamp(a, 0, 1);
    c.setTransform(PR * rx, 0, 0, PR * Math.max(ry, rx * 0.06), Lp.fx * PR, Lp.fy * PR);
    c.drawImage(spr, -1, -1, 2, 2);
  }
  c.restore();
}
/* The flicker in the windows (just the parts of them that can be seen) and the
   glow in the air around each lit lantern, drawn just after the gates. */
function torDrawGlow(c, t) {
  var lit = torLampLevel();
  if (lit <= 0 || !torLanterns.length) return;
  var spr = torSprites().halo;
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (var i = 0; i < torLanterns.length; i++) {
    var Lp = torLanterns[i];
    if (!Lp.vis) continue;
    var fl = torFlameAt(Lp, t), fade = 1 - Lp.haze * 0.6;
    if (Lp.mask && LANT.windowGlow > 0) {               // the windows brighten and dim
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.globalAlpha = clamp(LANT.windowGlow * lit * 0.55 * fl * fade, 0, 1);
      var Mq = Lp.mask;
      c.drawImage(TOR.maskB.cnv, Mq.ax, Mq.ay, Mq.aw, Mq.ah, Math.round(Mq.sx * PR), Math.round(Mq.sy * PR), Mq.aw, Mq.ah);
    }
    var r = LANT.haloSize * Lp.px * 0.5;
    if (LANT.halo > 0 && r > 1) {                       // the glow in the air
      c.globalAlpha = clamp(LANT.halo * lit * 0.3 * fl * Lp.vis * fade, 0, 1);
      c.setTransform(PR * r, 0, 0, PR * r, Lp.sx * PR, Lp.sy * PR);
      c.drawImage(spr, -1, -1, 2, 2);
    }
  }
  c.restore();
}

/* ============================================================
   8d. WINTER LANDSCAPE — as tuned on winter2.html (values in WINT and
   WINT_M). Winter theme only; the autumn scene is unchanged. It uses the
   autumn landscape's canvases and bake rhythm (LS, section 8c: baked
   again when the light changes, at most every LAND_REBAKE seconds and
   never mid-scroll, a part per frame), and is drawn with its own files:
     mountains.js   Fuji and the ranges in 3D, in their winter mode (snow
                    down to the valleys, dark conifers in it), drawn a band
                    a frame so the graphics chip is never busy for long
     snowfield.js   the snowfield, lit like real snow (warm in the sun,
                    blue in the shade, drifts, wind ripples, hollows), one
                    swell at a time; and the snow material that lights the
                    snow on the torii and the branches
     torii.js       the torii, built in 3D, with snow and icicles
     conifers.js    the snow-laden firs and the frosted trees
     snowlights.js  the snow lanterns (lit from dusk), with flickering
                    candlelight on the snow
     snowheaps.js   the snow on the plum branches
   The sky (sun, moon, clouds) is the app's own; in winter the clouds are
   the winter kinds (CLOUD_WINTER) and drift in front of Fuji too.
     #dynBack    the mountains and mist, the snowfield in slices (one per
                 swell) with what stands on each, the shadows they cast on
                 the snow, the skiers (with their tracks, powder, shadows and,
                 after dusk, head torches) and the lanterns' light between
                 the slices; the glints and the diamond dust; the far snow;
                 the plum branches hanging in from the top corners (they
                 sway, shed snow and drop petals).
     #dynGround  the snowdrift along the bottom, above the text and table
                 (lit as the snowfield), where the nearest flakes land and melt.
     #dynNear    the nearest flakes, the big soft ones close to the glass,
                 and the skiers that pass the page dots.
   The light follows the app's (winSceneLight): the sun's height and
   colour through the day (warm and low near sunrise and sunset, with
   the alpenglow on the peaks), the moon at night, and the weather (cloud
   softens the sunlight and the shadows). The real wind sets the wind's
   strength and direction; a sideways swipe sends a gust. If the tablet
   runs short of graphics memory and Chrome takes a WebGL context away
   or wipes a picture, the scene is baked again once it is back (winCheck).
   ============================================================ */
var WINT = {
  seed: 7, showMountains: true, lampGlow: 0.78,
  wind: 1.85, gustEvery: 30, gustStrength: 1.4,
  // the light on everything on the ground (the mountains have their own strength in WINT_M)
  sunAzimuth: -60, sunElevation: 22, eveningElevation: 5, sunStrength: 0.85, ambient: 0.9, blueShade: 0.6, moonLight: 0.45,
  // the snowfield (snowfield.js); mtnHeight: where the drifting mist lies above the ground line
  horizon: 0.79, swells: 7, swellHeight: 0.65, relief: 0.45, roll: 0.75, drifts: 0.25, ripples: 0.1, rippleSize: 1.23, rippleAngle: 72,
  grain: 0.5, hollows: 0.28, sheen: 1.1, groundHaze: 0.85, groundSoft: 0.6, sparkle: 1.17, mistDrift: 0.9, mtnHeight: 0.12,
  // the shadows cast on the snow
  shadows: 0.71, shadowLength: 1, shadowSoft: 1.5,
  // the torii (torii.js)
  toriiX: 0.04, toriiDepth: 0.18, toriiSize: 0.225, toriiTurn: 0, toriiView: 0.15, toriiSnow: 0.7, icicles: 0.5,
  // the firs and frosted trees (conifers.js)
  firs: 4, firX: 0.96, firSize: 0.95, firSnow: 1.95, firDroop: 1.4, firFull: 0.42, firWidth: 0.96,
  frostTrees: 13, frostSize: 1.35, rime: 0.65, frostTwigs: 0.67,
  // the lights (snowlights.js)
  lanterns: 14, lanternSize: 1, kamakura: 0, yukimi: false, lightEvening: 1.15, lightNight: 1.15, flicker: 0.7, halo: 2.45, pool: 1.6,
  // diamond dust (clear, cold days)
  diamondDust: 0.6,
  // the skiers
  maxSkiers: 5, skiGapMin: 1, skiGapMax: 5, skiSpeed: 1.05, skiSize: 0.75, skiFar: 0, skiNear: 1,
  skiFarBlur: 1.7, skiNearBlur: 0.1, skiFront: 0.33, scarfLength: 1.25, scarfFlutter: 0.5,
  skiShadow: 0.6, tracks: 0.6, trackFade: 40, powder: 0.9,
  // the skiers' head torches (after dusk)
  torch: true, torchNight: 1, torchEvening: 0.5, torchBeam: 0.7, torchReach: 2.4, torchWidth: 0.35, torchSpill: 1, torchGlow: 0.85,
  torchBob: 0.5, torchFlakes: 1,
  // the plum branches
  branchCount: 3, branchSize: 0.9, branchDroop: 1.7, branchTop: 73, blossoms: 0.9, blossomSize: 1.05, branchSnow: 1.22,
  sway: 2.5, swayRandom: 1.7, shedEvery: 3, shedAmount: 1, regrow: 2.35, petals: 2.75, barkLight: 0.6, branchDepth: 0.35,
  // the snow on the torii and the branches (the snow material in snowfield.js)
  snowRound: 0.15, snowRelief: 0.4, snowContact: 1.15, snowGlow: 1.85, snowGrain: 0.5, snowSparkle: 0, branchDust: 1.1, branchForks: true,
  // the falling snow
  flakes: 334, sizeFar: 0.9, sizeNear: 4.6, farBlur: 7.1, nearBlur: 0.65, fallSpeed: 0.6, flakeSway: 3.9,
  frontShare: 0.17, landShare: 0.7, meltTime: 16.5, bokeh: 6, backlight: 0.6,
  // the snowdrift in front of the text and table
  nearHeight: 33, nearLumps: 0.09, nearShade: 0.36, nearShadow: 0.05, nearShadowSize: 19,
  colours: {
    snow: '#FAFAFC', mist: '#F3EEEC', vermilion: '#E4462A', toriiTop: '#3C2422', toriiFeet: '#2A2220',
    needle: '#33493D', trunk: '#3C2E2A', bark: '#5E5558', rime: '#FAFAFC', stone: '#9A958E', flame: '#FFAA5A',
    branch: '#3B2B2A', blossom: '#D93B3B', blossomDeep: '#A8212E', stamen: '#F4D27A', torch: '#FFF3D6'
  }
};
/* The winter mountains (mountains.js in its winter mode), as tuned on winter2.html. */
var WINT_M = {
  seed: 7, rangeHeight: 0.05, featureKm: 6, sharpness: 0.41, layering: 0.81, rangeSpacing: 9, nearestKm: 8, farRise: 1.4, lens: 22,
  fujiX: 0.93, fujiHeight: 0.4, fujiWidth: 2.9, fujiKm: 45, fujiGullies: 0.05, fujiSnow: 0.65, fujiTongues: 1.15, fujiClear: 0.9,
  snowLine: 0.25, snow: 0.9, treeLine: 1.12, forestSnow: 0.65, snowSlope: 0.55,
  sunStrength: 1.15, ambient: 0.65, shadows: 0.55, alpenglow: 0.6,
  haze: 0.44, hazeKm: 43, mist: 0.52, mistHeightKm: 0.3, fadeToSky: 0.78, footMist: 0.69,
  strength: 1, softness: 0.9, resolution: 0.85,
  colours: { rock: '#7C7473', fujiRock: '#4E4A55', evergreen: '#33473C', snow: '#F6F7FB', haze: '#DCD8E2' }
};
var WINT_C = null;
function winCols() {
  if (!WINT_C) { WINT_C = {}; for (var k in WINT.colours) WINT_C[k] = hexToRgb(WINT.colours[k]); }
  return WINT_C;
}
function winLight(c) { return koyoLight(c, WINT.lampGlow); }
function winEllipse(c, x, y, rx, ry) { c.moveTo(x + rx, y); c.ellipse(x, y, rx, ry, 0, 0, TAU); }

/* ---------- the light on the ground ---------- */
/* As the 3D mountains' light (mtnOptions, 8c): t, how far into the day (0 at sunrise and sunset,
   1 two hours or more from them); n, how dark (0 day … 1 night); dusk, the low warm light
   either side of it; clear, how clear the sky is (cloud softens the sun and the shadows). The
   sun or moon's colour and height, and the sky's light, follow them. */
var WL = null, WSHADE = null, winDust = [];
function winSceneLight() {
  var n = koyoNight(), sun = ENV.sun;
  var t = smooth(0, 2.2, Math.min(S.hour - sun.rise, sun.set - S.hour));
  var clear = ENV.light.daylight > 0.01 ? clamp(ENV.sunAmt / ENV.light.daylight, 0, 1) : 1;
  var cs = lerp(0.22, 1, clear) * (ENV.snowing ? 0.7 : 1);
  var el = lerp(lerp(WINT.eveningElevation, WINT.sunElevation, t), 36, n);
  var sunC = mixRgb(mixRgb([255, 156, 96], [255, 247, 236], t), [150, 168, 225], n);
  var sky = mixRgb(mixRgb([164, 152, 198], [178, 196, 226], t), [64, 76, 124], n);
  sky = mixRgb(sky, mixRgb([214, 214, 226], [80, 84, 110], n), (1 - cs) * 0.6);   // under cloud the sky light is greyer
  var sS = WINT.sunStrength * lerp(1, WINT.moonLight, n) * cs, amb = WINT.ambient * lerp(1, 0.8, n) * lerp(1.15, 1, cs);
  var a = WINT.sunAzimuth * PI / 180, e = el * PI / 180;
  return { el: el, t: t, n: n, dusk: (1 - t) * (1 - n), clear: cs, vis: cs * lerp(1, 0.45, n),
           dir: [Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e)],
           sunRGB: sunC, skyRGB: sky, sS: sS, amb: amb, sun: scaleRgb(sunC, sS / 255), sky: scaleRgb(sky, 1 / 255) };
}
/* A colour lit from the direction n (x right, y up, z toward you); occ: how much sun reaches it. */
function winLit(base, nx, ny, nz, occ) {
  var l = Math.hypot(nx, ny, nz) || 1, L = WL.dir, k = occ === undefined ? 1 : occ;
  nx /= l; ny /= l; nz /= l;
  var dl = Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]) * k, sk = (0.6 + 0.4 * ny) * WL.amb * lerp(0.75, 1, k);
  return [base[0] * (WL.sun[0] * dl + WL.sky[0] * sk), base[1] * (WL.sun[1] * dl + WL.sky[1] * sk), base[2] * (WL.sun[2] * dl + WL.sky[2] * sk)];
}
/* Snow in shade: lit by the sky alone, as blue as snowfield.js makes it. */
function winShadeColour() {
  var sk = WL.sky, L = (sk[0] + sk[1] + sk[2]) / 3, b = WINT.blueShade, sn = hexToRgb(WINT.colours.snow);
  var c = [sk[0] + (L * 0.8 - sk[0]) * b, sk[1] + (L * 0.94 - sk[1]) * b, sk[2] + (L * 1.2 - sk[2]) * b];
  return [clamp(sn[0] * c[0] * WL.amb * 0.92, 0, 255), clamp(sn[1] * c[1] * WL.amb * 0.92, 0, 255), clamp(sn[2] * c[2] * WL.amb * 0.92, 0, 255)];
}
/* What the drawing files need to light a thing, haze: how much it fades into the mist. */
function winLightFor(haze) {
  return { sunDir: WL.dir, sunColour: WL.sun, skyColour: WL.sky, ambient: WL.amb, haze: haze, hazeColour: winLight(hexToRgb(WINT.colours.mist)) };
}
function winWithLight(o, haze) { var L = winLightFor(haze); for (var k in L) o[k] = L[k]; return o; }
/* The lanterns: lit at dusk, brightest at night. */
function winNightLights() { return WL ? WINT.lightNight * WL.n + WINT.lightEvening * WL.dusk : 0; }
/* Where the app's sun is on the screen (drawSun), and how much of it shows. */
function winSunPos() {
  var a = ENV.astro.sun, R = sunRadius(a.alt);
  var vis = S.sun ? smooth(-1.5, 1.5, a.alt) * (WL ? WL.clear : 1) * (1 - koyoNight()) : 0;
  return { x: skyToScreen(a.alt, a.az).x, y: skyBandY(R), R: R, vis: vis };
}
/* True when one row of a kept picture has (almost) nothing in it: wiped (winCheck). */
function winBlankRow(P, y) {
  var w = P.cnv.width;
  if (w < 2 || P.cnv.height < 2) return false;
  var row = P.c.getImageData(0, clamp(Math.round(y), 0, P.cnv.height - 1), w, 1).data, seen = 0;
  for (var q = 3; q < row.length; q += 16) if (row[q] > 8 && ++seen >= 3) return false;
  return true;
}

/* ---------- the mountains, behind everything ---------- */
/* mountains.js draws them a band at a time, one band a frame (drawn in one go, the low sun's
   shadows could keep the graphics chip busy for seconds, and the tablet reset it). winBakeScenery
   starts the job; updateLandscape runs it a band a frame (winStepScenery) before the snowfield
   is baked. Without WebGL 2, soft painted ridges. */
var WIN_MTN = { job: null, t0: 0, is3d: false, loss: undefined };
function winMtnOptions(hy) {
  var col = {}; for (var k in WINT_M.colours) col[k] = hexToRgb(WINT_M.colours[k]);
  var o = {};
  for (var key in WINT_M) if (key !== 'colours') o[key] = WINT_M[key];
  o.width = LS.MTN.cnv.width; o.height = LS.MTN.cnv.height; o.screenW = W; o.screenH = H; o.horizon = hy;
  o.fuji = true; o.winter = 1; o.autumn = 0;
  o.sunAzimuth = WINT.sunAzimuth; o.sunElevation = WL.el;
  o.sunStrength = WINT_M.sunStrength * WL.sS / Math.max(0.01, WINT.sunStrength);
  o.ambient = WINT_M.ambient * WL.amb / Math.max(0.01, WINT.ambient);
  o.shadows = WINT_M.shadows * lerp(0.4, 1, WL.clear);
  o.sunColour = mixRgb(WL.sunRGB, [255, 128, 140], WINT_M.alpenglow * 0.5 * WL.dusk);   // the alpenglow on the snowy peaks
  o.skyColour = WL.skyRGB;
  o.hazeColour = winLight(col.haze); o.mistColour = winLight(hexToRgb(WINT.colours.mist));
  o.colours = { rock: col.rock, fujiRock: col.fujiRock, forestRed: col.rock, forestGold: col.rock, evergreen: col.evergreen, snow: col.snow };
  return o;
}
function winBakeScenery() {
  WL = winSceneLight();
  WSHADE = winShadeColour();
  LAND_SR = PR * WINT_M.resolution;
  var w = Math.round(W * LAND_SR), h = Math.round(H * LAND_SR);
  if (LS.MTN.cnv.width !== w || LS.MTN.cnv.height !== h) { LS.MTN.cnv.width = w; LS.MTN.cnv.height = h; }
  WIN_MTN.job = null;
  if (WINT.showMountains && typeof Mountains !== 'undefined' && Mountains.start) {
    WIN_MTN.t0 = performance.now();
    var job = Mountains.start(winMtnOptions(H * WINT.horizon), 8);
    if (job) { WIN_MTN.job = job; return; }                // finished a band a frame (winStepScenery)
    if (Mountains.state && Mountains.state() === 'lost') {  // WebGL is away: the old picture stays, unless it was wiped
      WS.retry = true;
      if (LS.SCN.cnv.width === w && !winBlankRow(LS.SCN, (H * WINT.horizon - H * 0.02) * LAND_SR)) return;
    }
  }
  winFinishScenery(null);
}
/* One band of the mountains; true once they are done. */
function winStepScenery() {
  var r = WIN_MTN.job.step();
  if (r === null) return false;
  WIN_MTN.job = null;
  if (r === false) {                                        // the context was lost on the way
    WS.retry = true;
    if (LS.SCN.cnv.width === LS.MTN.cnv.width && !winBlankRow(LS.SCN, (H * WINT.horizon - H * 0.02) * LAND_SR)) return true;
    r = null;
  }
  winFinishScenery(r);
  return true;
}
/* The mountains (g3: their picture, or null for the painted ridges) into LS.MTN, with mist along
   their foot, then onto LS.SCN, which is what is drawn; and the mist that drifts along them. */
function winFinishScenery(g3) {
  var C = winCols(), hy = H * WINT.horizon, mistC = winLight(C.mist), m = LS.MTN.c;
  m.setTransform(1, 0, 0, 1, 0, 0); m.clearRect(0, 0, LS.MTN.cnv.width, LS.MTN.cnv.height);
  WIN_MTN.is3d = false;
  if (WINT.showMountains) {
    if (g3) {
      WIN_MTN.is3d = true;
      m.save();
      var px = WINT_M.softness * LAND_SR;
      m.filter = HAS_FILTER && px > 0.05 ? 'blur(' + px.toFixed(2) + 'px)' : 'none';
      m.drawImage(g3, 0, 0, LS.MTN.cnv.width, LS.MTN.cnv.height);
      m.restore();
      if (typeof Mountains.losses === 'function') WIN_MTN.loss = Mountains.losses();
      // Chrome can take the context away just after the drawing, leaving the picture blank
      // without saying so: if nothing is along the mountains' foot, they are drawn again soon
      if (winBlankRow(LS.MTN, (hy - H * 0.02) * LAND_SR)) WS.retry = true;
    } else {                                                // no WebGL 2: three soft pale ridges
      var r = rngFrom(WINT.seed * 131 + 17), mc = hexToRgb(WINT_M.colours.haze);
      for (var i = 0; i < 3; i++) {
        var top = Math.max(0.08, WINT_M.rangeHeight * 2) * H * lerp(1.4, 0.7, i / 2), base = hy - top * 0.6, amp = top * 0.42, f = landRidge(r);
        m.setTransform(LAND_SR, 0, 0, LAND_SR, 0, 0);
        m.fillStyle = rgba(winLight(mixRgb(mixRgb(mc, [120, 126, 146], 0.2 + i * 0.15), C.mist, 0.3 - i * 0.08)));
        m.beginPath(); m.moveTo(-20, hy + 40);
        for (var x = -20; x <= W + 20; x += 6) m.lineTo(x, base - amp * f(x));
        m.lineTo(W + 20, hy + 40); m.closePath(); m.fill();
      }
    }
    if (WINT_M.footMist > 0) {                              // mist along the foot of the mountains
      var y0 = hy - H * 0.07, y1 = hy + 6;
      m.setTransform(LAND_SR, 0, 0, LAND_SR, 0, 0);
      var g = m.createLinearGradient(0, y0, 0, y1);
      g.addColorStop(0, rgba(mistC, 0)); g.addColorStop(0.7, rgba(mistC, WINT_M.footMist * 0.55)); g.addColorStop(1, rgba(mistC, WINT_M.footMist * 0.85));
      m.fillStyle = g; m.fillRect(-20, y0, W + 40, y1 - y0);
    }
  }
  if (LS.SCN.cnv.width !== LS.MTN.cnv.width || LS.SCN.cnv.height !== LS.MTN.cnv.height) { LS.SCN.cnv.width = LS.MTN.cnv.width; LS.SCN.cnv.height = LS.MTN.cnv.height; }
  var s = LS.SCN.c;
  s.setTransform(1, 0, 0, 1, 0, 0); s.clearRect(0, 0, LS.SCN.cnv.width, LS.SCN.cnv.height);
  s.globalAlpha = WINT_M.strength;
  s.drawImage(LS.MTN.cnv, 0, 0);
  s.globalAlpha = 1;
  LS.scnTop = Math.max(0, Math.floor(hy - Math.max(WINT_M.fujiHeight, WINT_M.rangeHeight * 4) * H - 40));
  // one soft white blob: the mist drifting along the ridges, and the powder shaken off the branches
  var mc2 = LS.MIST.c; LS.MIST.cnv.width = LS.MIST.cnv.height = 128;
  var rg = mc2.createRadialGradient(64, 64, 0, 64, 64, 64);
  rg.addColorStop(0, rgba(mistC, 1)); rg.addColorStop(0.5, rgba(mistC, 0.55)); rg.addColorStop(1, rgba(mistC, 0));
  mc2.fillStyle = rg; mc2.fillRect(0, 0, 128, 128);
  if (!LS.mist.length) {
    var r4 = rngFrom(WINT.seed * 17 + 1);
    for (var b = 0; b < 5; b++) {
      LS.mist.push({ x: r4() * W * 1.4 - W * 0.2, y: lerp(0.05, 0.45, r4()), w: lerp(0.35, 0.6, r4()), h: lerp(28, 70, r4()),
                     v: lerp(4, 10, r4()) * (r4() < 0.8 ? 1 : -1) });
    }
  }
}

/* ---------- wind: a steady breeze with ripples, and gust fronts ---------- */
function winWindDir() { return ENV.windPx < -4 ? -1 : 1; }
function winWind() { return WINT.wind * clamp(0.6 + ENV.windMs / 6, 0.6, 1.6); }
function winStartGust(dir, k) {
  var str = 0.5 * WINT.gustStrength * (k || 1) * (0.7 + 0.6 * Math.random());
  WS.gusts.push({ dir: dir, x: dir > 0 ? -200 : W + 200, v: 300 + Math.random() * 120,
                  str: str, hit: {} });
  bambooGust(str / BAMBOO_WIN_GUST_STR);
}
function winUpdateField(t) {
  var FB = 10, cnt = Math.ceil(W / FB) + 2, wk = winWind() * winWindDir(), F = WS.field, G = WS.gusts;
  for (var i = 0; i < cnt; i++) {
    var x = i * FB, gs = 0;
    for (var g = 0; g < G.length; g++) {
      var d = (G[g].x - x) * G[g].dir;
      gs += G[g].dir * G[g].str * (d < 0 ? Math.exp(-(d * d) / 8100) : Math.exp(-d / 260));
    }
    F[i] = wk * (0.12 + 0.1 * Math.sin(x * 0.0055 - t * 1.25) + 0.05 * Math.sin(x * 0.013 - t * 2.1 + 1.3)) + gs;
  }
  F.length = cnt;
}
function winFieldAt(x) { var F = WS.field, i = Math.round(x / 10); i = i < 0 ? 0 : i >= F.length ? F.length - 1 : i; return F[i] || 0; }
function winUpdateGusts(dt) {
  WS.gustTimer -= dt;
  if (WS.gustTimer <= 0) {
    if (WINT.gustStrength > 0) winStartGust((Math.random() < 0.8 ? 1 : -1) * winWindDir());
    WS.gustTimer = WINT.gustEvery * (0.6 + 0.8 * Math.random());
  }
  for (var i = WS.gusts.length - 1; i >= 0; i--) {
    var g = WS.gusts[i];
    g.x += g.dir * g.v * dt;
    for (var ti = 0; ti < WS.branches.length; ti++) {
      var T = WS.branches[ti], side = T.left ? -1 : 1;
      if (!g.hit[ti] && (g.x - (T.left ? 0 : W)) * g.dir > 0) {
        g.hit[ti] = 1;
        T.gustV += g.dir * g.str * 0.4 * side;
        for (var s = 0; s < T.springs.length; s++) T.springs[s].v += g.dir * g.str * rnd(0.1, 0.5) * side;
        for (var q = 0; q < T.groups.length; q++) if (Math.random() < 0.25 * g.str) umeShed(T, q, 0.35);
      }
    }
    if (g.x < -1400 || g.x > W + 1400) WS.gusts.splice(i, 1);
  }
  WS.shedTimer -= dt;                                         // now and then a shoot sheds its snow on its own
  if (WS.shedTimer <= 0) {
    var T2 = WS.branches[Math.floor(Math.random() * WS.branches.length)];
    if (T2) umeShed(T2, Math.floor(Math.random() * T2.groups.length), lerp(0.3, 0.6, Math.random()));
    WS.shedTimer = WINT.shedEvery * (0.4 + 1.2 * Math.random());
  }
}


function winUpdateDust(t, dt) {
  var on = WL && WL.n < 0.5 && WINT.diamondDust > 0 && WL.clear > 0.8 && !ENV.snowing;
  var want = on ? Math.round(WINT.diamondDust * 140) : 0;
  while (winDust.length < want) winDust.push({ x: rnd(-0.05, 1.05) * W, y: rnd(0.1, 0.85) * H, z: Math.random(), ph: rnd(0, TAU), f: rnd(0.3, 0.9), vy: rnd(1, 4), sw: rnd(2, 7) });
  if (winDust.length > want) winDust.length = want;
  for (var i = 0; i < winDust.length; i++) {
    var D = winDust[i];
    D.y += D.vy * dt; D.x += (winFieldAt(D.x) * 40 + Math.sin(t * 0.4 + D.ph) * D.sw) * dt;
    if (D.y > H * 0.9) { D.y = H * 0.1; D.x = rnd(0, W); }
    if (D.x > W + 20) D.x = -20; else if (D.x < -20) D.x = W + 20;
  }
}
function winDrawDust(c, t) {
  if (!winDust.length) return;
  var P = winSunPos(), warm = WL.dusk > 0.4;
  c.setTransform(PR, 0, 0, PR, 0, 0);
  c.globalCompositeOperation = 'lighter';
  c.strokeStyle = warm ? 'rgb(255,226,190)' : 'rgb(255,255,255)'; c.fillStyle = c.strokeStyle; c.lineWidth = 0.6;
  for (var i = 0; i < winDust.length; i++) {
    var D = winDust[i], near = Math.exp(-Math.pow(Math.hypot(D.x - P.x, D.y - P.y) / (H * 0.55), 2));
    var gl = Math.pow(Math.max(0, Math.sin(t * D.f * 2.2 + D.ph)), 30);
    var a = WINT.diamondDust * (0.12 + 0.88 * gl) * (0.35 + 0.65 * near) * (0.2 + 0.8 * P.vis);
    if (a < 0.03) continue;
    var s = lerp(0.5, 1.4, D.z);
    c.globalAlpha = clamp(a, 0, 1);
    c.beginPath(); c.arc(D.x, D.y, s * 0.5, 0, TAU); c.fill();
    if (gl > 0.3) {
      c.beginPath(); c.moveTo(D.x - s * 3, D.y); c.lineTo(D.x + s * 3, D.y); c.moveTo(D.x, D.y - s * 3); c.lineTo(D.x, D.y + s * 3); c.stroke();
    }
  }
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
}

/* ============================================================
   8. THE SNOWFIELD — snowfield.js draws each swell, from the far ones
   to the near ones; each is baked into a slice of its own (WS.slabs) with
   everything that stands on it, so the skiers on it can be drawn between
   the slices. On each swell: the shadows of the things on it first, then
   the things themselves: frosted trees (conifers.js), firs (conifers.js),
   the torii (torii.js) and the lights (snowlights.js).
   ============================================================ */
var WS = { torii: null, sparkles: [], bKey: '', branches: [], puffs: [], petals: [], shedTimer: 3, petalTimer: 2,
           SHD: landCanvas(), SKS: landCanvas(), FTMP: landCanvas(), SMAP: landCanvas(), retry: false, checkAt: 0, wipeAt: 0,
           blooms: [], flakeSpr: [], warmSpr: null, flakes: [], filled: false, landed: [], bokeh: [], gusts: [], gustTimer: 4, field: [],
           wood: '', woodLit: '', petal: '', petalDk: '', swells: [], slabs: [], gmist: null, skiers: [],
           skiTimer: 1.5, dots: null, lights: [], tracks: [], powder: [], shadow: null, driftY: 0 };
function winSwellFn(r, u) {
  var sc = lerp(0.5, 1, u);
  var L = [lerp(1.3, 2.2, r()) * sc, lerp(0.6, 0.9, r()) * sc], p = [r() * TAU, r() * TAU];
  return function (x) { return 0.75 * Math.sin(x / (W * L[0]) * TAU + p[0]) + 0.25 * Math.sin(x / (W * L[1]) * TAU + p[1]); };
}
var WIN_FROST = [[0.25, 0.2, 1], [0.31, 0.12, 0.75], [0.19, 0.28, 0.85], [0.73, 0.22, 0.9],
                 [0.67, 0.14, 0.7], [0.6, 0.08, 0.6], [0.4, 0.06, 0.55], [0.79, 0.32, 0.8]];
var WIN_FIRS = [[0, 0.42, 1], [-0.05, 0.36, 0.8], [0.045, 0.48, 0.9], [-0.095, 0.3, 0.65],
                [0.085, 0.4, 0.7], [-0.13, 0.25, 0.55], [0.12, 0.52, 0.75], [-0.025, 0.55, 0.6]];
/* The snow lanterns wind across the middle of the field (雪あかりの路), the huts stand by the firs and in the middle. */
var WIN_LANTERN_PATH = [[0.12, 0.32], [0.3, 0.46], [0.5, 0.52], [0.68, 0.44], [0.84, 0.58]];
var WIN_HUT_SPOTS = [[0.8, 0.5], [0.4, 0.3], [0.58, 0.62], [0.16, 0.6]];
function winPlan(r) {
  var list = [], i;
  for (i = 0; i < WINT.frostTrees; i++) {
    var s = i < WIN_FROST.length ? WIN_FROST[i] : [r(), r() * 0.4, lerp(0.5, 0.9, r())];
    list.push({ type: 'frost', x: (s[0] + (r() - 0.5) * 0.03) * W, u: s[1], size: s[2] * lerp(0.85, 1.15, r()), seed: Math.floor(r() * 1e9) });
  }
  for (i = 0; i < WINT.firs; i++) {
    var f = WIN_FIRS[i % WIN_FIRS.length];
    list.push({ type: 'fir', x: (WINT.firX + f[0]) * W, u: f[1], size: f[2] * lerp(0.9, 1.1, r()), seed: Math.floor(r() * 1e9) });
  }
  list.push({ type: 'torii', x: WINT.toriiX * W, u: WINT.toriiDepth, size: 1, seed: 1 });
  if (WINT.yukimi) list.push({ type: 'light', kind: 'yukimi', x: (WINT.toriiX + 0.12) * W, u: Math.min(1, WINT.toriiDepth + 0.06), size: 1, seed: 11 });
  for (i = 0; i < WINT.lanterns; i++) {
    var q = (i + 0.5) / WINT.lanterns * (WIN_LANTERN_PATH.length - 1), j = Math.min(WIN_LANTERN_PATH.length - 2, Math.floor(q)), fq = q - j;
    var A = WIN_LANTERN_PATH[j], B = WIN_LANTERN_PATH[j + 1];
    list.push({ type: 'light', kind: 'yuki', x: (lerp(A[0], B[0], fq) + (r() - 0.5) * 0.02) * W, u: lerp(A[1], B[1], fq), size: lerp(0.85, 1.15, r()), seed: Math.floor(r() * 1e9) });
  }
  for (i = 0; i < WINT.kamakura; i++) {
    var hs = WIN_HUT_SPOTS[i % WIN_HUT_SPOTS.length];
    list.push({ type: 'light', kind: 'kamakura', x: hs[0] * W, u: hs[1], size: lerp(0.9, 1.1, r()), seed: Math.floor(r() * 1e9) });
  }
  var order = { frost: 0, fir: 1, torii: 2, light: 3 };
  list.sort(function (a, b) { return a.u - b.u || order[a.type] - order[b.type]; });
  return list;
}
/* How tall each thing is (px), and how far it reaches either side. */
function winThingH(B) {
  if (B.type === 'frost') return H * lerp(0.08, 0.2, B.u) * B.size * WINT.frostSize;
  if (B.type === 'fir') return H * lerp(0.17, 0.3, B.u) * B.size * WINT.firSize;
  if (B.type === 'torii') return H * WINT.toriiSize;
  var k = B.kind === 'yukimi' ? lerp(0.05, 0.09, B.u) : B.kind === 'kamakura' ? lerp(0.03, 0.075, B.u) : lerp(0.016, 0.042, B.u);
  return H * k * B.size * WINT.lanternSize;
}
function winThingTop(B) {
  if (B.type === 'torii') return Torii.top({ y: B.yb, h: winThingH(B), snow: WINT.toriiSnow }) - 6;
  return B.yb - winThingH(B) * (B.type === 'light' ? 1.5 : 1.12);
}
function winThingHalfW(B) {
  var h = winThingH(B);
  return B.type === 'torii' ? h * 0.75 : B.type === 'fir' ? h * 0.36 * WINT.firWidth : B.type === 'frost' ? h * 0.4 : B.kind === 'kamakura' ? h * 1.3 : h * 0.7;
}
function winDrawThing(c, B, haze) {
  var C = winCols(), h = winThingH(B);
  if (B.type === 'frost') {
    Conifers.frost(c, winWithLight({ x: B.x, y: B.yb, h: h, seed: B.seed, colours: { bark: C.bark, rime: C.rime }, rime: WINT.rime,
                                  twigs: WINT.frostTwigs, spread: 1 }, haze));
  } else if (B.type === 'fir') {
    Conifers.fir(c, winWithLight({ x: B.x, y: B.yb, h: h, seed: B.seed, colours: { needle: C.needle, trunk: C.trunk, snow: C.snow },
                                snow: WINT.firSnow, droop: WINT.firDroop, fullness: WINT.firFull, width: WINT.firWidth }, haze));
  } else if (B.type === 'torii') {
    var to = winWithLight({ x: B.x, y: B.yb, h: h, yaw: WINT.toriiTurn, view: WINT.toriiView, snow: WINT.toriiSnow, icicles: WINT.icicles, seed: 3,
                         colours: { vermilion: C.vermilion, top: C.toriiTop, feet: C.toriiFeet, snow: C.snow } }, haze);
    // its snow: drawn where it is (a mask, over the box round the gate), then lit by the snow material
    var useMat = !B.plain && typeof SnowHeaps !== 'undefined' && typeof Snowfield !== 'undefined' && Snowfield.supported();
    if (useMat) {
      var T0 = c.getTransform(), bx0 = B.x - h * 1.1, by0 = Torii.top(to) - 10, bx1 = B.x + h * 1.1, by1 = B.yb + h * 0.12;
      var dx = Math.floor(T0.a * bx0 + T0.e), dy = Math.floor(T0.d * by0 + T0.f);
      if (!WS.tmask) WS.tmask = landCanvas();
      var TM = WS.tmask;
      TM.cnv.width = Math.max(1, Math.ceil((bx1 - bx0) * T0.a)); TM.cnv.height = Math.max(1, Math.ceil((by1 - by0) * T0.d));
      TM.c.setTransform(T0.a, 0, 0, T0.d, T0.e - dx, T0.f - dy);
      to.snowMask = TM.c;
    }
    var res = Torii.draw(c, to);
    if (useMat) {
      var R = h * 0.09 * WINT.toriiSnow * WINT.snowRound * T0.a, m = winSnowMat(null, haze);
      m.thick = R * WINT.snowRelief;
      var litPic = SnowHeaps.light(TM.cnv, R, m);
      if (litPic) SnowHeaps.put(c, litPic, dx, dy);
      else { to.snowMask = null; Torii.draw(c, to); }          // WebGL away: the plain snow, drawn over
      TM.cnv.width = TM.cnv.height = 1;
    }
    WS.torii = { x: B.x, y: B.yb, h: h, top: res.top };
  } else {
    var Lb = Snowlights.body(c, winWithLight({ kind: B.kind, x: B.x, y: B.yb, s: h, seed: B.seed, lit: winNightLights(),
                                            colours: { snow: C.snow, stone: C.stone, flame: C.flame } }, haze));
    if (B.record) { Lb.k = B.k; Lb.ph = Math.random() * 100; Lb.haze = haze; WS.lights.push(Lb); }
  }
}
/* The shadow a thing casts on the snow: its outline, laid flat on the ground away from the sun
   (longer the lower the sun, foreshortened by the distance), soft, in the colour of snow in shade. */
function winShadowShape(fy) {
  var e = Math.max(2.5, WL.el) * PI / 180, a = WINT.sunAzimuth * PI / 180, cot = Math.min(7, 1 / Math.tan(e)) * WINT.shadowLength;
  // across: as long as the sun is low; toward you or away: laid out a little, so it reads on the screen
  var sx = clamp(-Math.sin(a) * cot, -3.5, 3.5), sy = clamp(-Math.cos(a) * cot * 0.35, -0.9, 0.9);
  return [1, 0, -sx, sy, sx * fy, fy * (1 - sy)];
}
function winCastShadow(tg, B, haze) {
  var k = WINT.shadows * WL.vis;
  if (k < 0.01) return;
  var h = winThingH(B), hw = winThingHalfW(B), bx0 = B.x - hw * 1.2, by0 = winThingTop(B) - 4, bw = hw * 2.4, bh = B.yb - by0 + h * 0.1;
  var cw = Math.max(1, Math.ceil(bw * PR)), ch = Math.max(1, Math.ceil(bh * PR));
  WS.SHD.cnv.width = cw; WS.SHD.cnv.height = ch;
  var s = WS.SHD.c;
  s.setTransform(PR, 0, 0, PR, -bx0 * PR, -by0 * PR);
  var rec = B.record; B.record = false; B.plain = true;
  winDrawThing(s, B, 0);
  B.record = rec; B.plain = false;
  s.setTransform(1, 0, 0, 1, 0, 0);
  s.globalCompositeOperation = 'source-in';
  s.fillStyle = rgba(mixRgb(WSHADE, winLight(hexToRgb(WINT.colours.mist)), haze)); s.fillRect(0, 0, cw, ch);
  s.globalCompositeOperation = 'source-over';
  var A = winShadowShape(B.yb);
  tg.save();
  tg.globalCompositeOperation = 'source-atop';
  tg.globalAlpha = clamp(k, 0, 1);
  var bl = WINT.shadowSoft * (0.6 + h * 0.01) * PR;
  tg.filter = bl > 0.1 ? 'blur(' + bl.toFixed(1) + 'px)' : 'none';
  tg.transform(A[0], A[1], A[2], A[3], A[4], A[5]);
  tg.transform(1 / PR, 0, 0, 1 / PR, bx0, by0);
  tg.drawImage(WS.SHD.cnv, 0, 0);
  tg.restore();
}
/* Without WebGL 2: a plain swell with a soft band of shade under its crest. */
function winFlatSwell(t, S, haze) {
  var C = winCols(), litC = mixRgb(winLit(C.snow, 0, 1, 0.3), winLight(C.mist), haze), shC = mixRgb(WSHADE, winLight(C.mist), haze);
  t.beginPath(); t.moveTo(-10, H + 10);
  for (var x = -10; x <= W + 10; x += 6) t.lineTo(x, S.yk - S.amp * S.f(x));
  t.lineTo(W + 10, H + 10); t.closePath();
  var g = t.createLinearGradient(0, S.yk - S.amp, 0, S.yk + S.amp + (H - H * WINT.horizon) * 0.18);
  g.addColorStop(0, rgba(litC)); g.addColorStop(1, rgba(mixRgb(litC, shC, 0.3)));
  t.fillStyle = g; t.fill();
}
function winCrestY(S, x) { return S.yk - S.amp * S.f(x); }
/* What snowfield.js needs, for these swells (the snowfield's, or the snowdrift's). */
function winSfOptions(sw) {
  var C = winCols();
  return { width: Math.round(W * PR), height: Math.round(H * PR), screenW: W, screenH: H, horizon: H * WINT.horizon, swells: sw,
           sunAzimuth: WINT.sunAzimuth, sunElevation: WL.el, sunColour: WL.sunRGB, skyColour: WL.skyRGB,
           sunStrength: WL.sS, ambient: WL.amb, hazeColour: winLight(C.mist), snow: C.snow, blue: WINT.blueShade,
           relief: WINT.relief, roll: WINT.roll, drifts: WINT.drifts, ripples: WINT.ripples, rippleSize: WINT.rippleSize,
           rippleAngle: WINT.rippleAngle, grain: WINT.grain, hollows: WINT.hollows, sheen: WINT.sheen, seed: WINT.seed };
}
function winBakeGround() {
  var t0 = performance.now(), C = winCols(), hy = H * WINT.horizon, r = rngFrom(WINT.seed * 71 + 3), N = Math.max(2, Math.round(WINT.swells));
  var depthPx = Math.max(1, H - hy), k, b, NX = 256;
  if (!LS.GTMP) LS.GTMP = landCanvas();
  WS.sparkles = []; WS.torii = null; WS.lights = [];
  var things = winPlan(rngFrom(WINT.seed * 313 + 11)), swells = WS.swells = [];
  for (k = 0; k < N; k++) {
    var u0 = k / (N - 1);
    var Sk = { u: u0, yk: hy + depthPx * 0.92 * Math.pow(k / N, 1.25), amp: lerp(3, 26, Math.pow(u0, 1.4)) * WINT.swellHeight,
               f: winSwellFn(r, u0), things: [], haze: WINT.groundHaze * Math.pow(1 - u0, 2) * 0.9 };
    Sk.crest = new Float32Array(NX);
    for (var j = 0; j < NX; j++) Sk.crest[j] = winCrestY(Sk, -20 + j / (NX - 1) * (W + 40));
    swells.push(Sk);
  }
  for (b = 0; b < things.length; b++) {
    var B = things[b], kb = Math.round(B.u * (N - 1)), Sb = swells[kb];
    B.yb = winCrestY(Sb, B.x) + Sb.amp * 0.5 + 2; B.k = kb; B.record = B.type === 'light';
    Sb.things.push(B);
    if (B.type === 'torii') { WS.torii = { x: B.x, y: B.yb, h: winThingH(B) }; WS.toriiK = kb; }
  }
  var sfo = winSfOptions(swells.map(function (S) { return { crest: S.crest, u: S.u, haze: S.haze }; }));
  var gl3 = typeof Snowfield !== 'undefined' && Snowfield.supported();
  if (!gl3 && typeof Snowfield !== 'undefined' && Snowfield.state && Snowfield.state() === 'lost') {
    WS.retry = true;                                       // drawn again once WebGL is back (winCheck)
    var lastSl = WS.slabs[WS.slabs.length - 1];
    if (lastSl && !winBlankRow(lastSl, lastSl.cnv.height - 2)) return;   // the old picture stays meanwhile
  }
  var old = WS.slabs; WS.slabs = []; WS.sfGL = false;
  for (k = 0; k < N; k++) {
    var S0 = swells[k], top = S0.yk - S0.amp - 8;
    for (b = 0; b < S0.things.length; b++) top = Math.min(top, winThingTop(S0.things[b]) - 12);
    top = Math.max(0, Math.floor(top));
    var bottom = k < N - 1 ? Math.min(H, Math.ceil(swells[k + 1].yk + swells[k + 1].amp + 14)) : H;
    var slab = old[k] || landCanvas(), cw = Math.round(W * PR), ch = Math.max(1, Math.round((bottom - top) * PR));
    slab.top = top; slab.k = k;
    if (slab.cnv.width !== cw || slab.cnv.height !== ch) { slab.cnv.width = cw; slab.cnv.height = ch; }
    else { slab.c.setTransform(1, 0, 0, 1, 0, 0); slab.c.clearRect(0, 0, cw, ch); }
    LS.GTMP.cnv.width = cw; LS.GTMP.cnv.height = ch;
    var tg = LS.GTMP.c;
    tg.setTransform(1, 0, 0, 1, 0, 0); tg.clearRect(0, 0, cw, ch);
    var sf = gl3 ? Snowfield.render(sfo, k, top, bottom) : null;
    if (gl3 && !sf) WS.retry = true;                       // lost on the way: plain swells for now, the real ones soon
    if (sf) { tg.drawImage(sf, 0, 0, cw, ch, 0, 0, cw, ch); WS.sfGL = true; }
    tg.setTransform(PR, 0, 0, PR, 0, -top * PR);
    if (!sf) winFlatSwell(tg, S0, S0.haze);
    for (b = 0; b < S0.things.length; b++) {                  // the shadows first, on the snow only
      var T = S0.things[b], hz = WINT.groundHaze * Math.pow(1 - T.u, 2) * 0.9;
      winCastShadow(tg, T, hz);
    }
    for (b = 0; b < S0.things.length; b++) {
      var T2 = S0.things[b], hz2 = WINT.groundHaze * Math.pow(1 - T2.u, 2) * 0.9;
      winDrawThing(tg, T2, T2.type === 'torii' ? hz2 * 0.8 : hz2);
    }
    slab.c.save();
    var bl = lerp(1.4, 0, S0.u) * PR * WINT.groundSoft;
    slab.c.filter = bl > 0.05 ? 'blur(' + bl.toFixed(2) + 'px)' : 'none';
    slab.c.drawImage(LS.GTMP.cnv, 0, 0);
    slab.c.restore();
    WS.slabs.push(slab);
  }
  LS.GTMP.cnv.width = LS.GTMP.cnv.height = 1;
  WS.SHD.cnv.width = WS.SHD.cnv.height = 1;
  for (k = N; k < old.length; k++) old[k].cnv.width = old[k].cnv.height = 1;   // swells no longer there: give back their memory
  // the points that glint: where the sun falls on the snow (read once from a small map of the sunlight)
  if (WINT.sparkle > 0 && gl3) {
    var so = {}; for (var key in sfo) so[key] = sfo[key];
    so.width = Math.max(1, Math.round(W / 4)); so.height = Math.max(1, Math.round(H / 4));
    var map = Snowfield.sunMap(so);
    if (map) {
      WS.SMAP.cnv.width = so.width; WS.SMAP.cnv.height = so.height;
      WS.SMAP.c.clearRect(0, 0, so.width, so.height); WS.SMAP.c.drawImage(map, 0, 0);
      var px = WS.SMAP.c.getImageData(0, 0, so.width, so.height).data, want = Math.round(WINT.sparkle * 110 * WL.vis), tries = 0;
      while (WS.sparkles.length < want && tries++ < 8000) {
        var sx = Math.random() * W, sy = hy + 4 + Math.random() * (H - hy - 4);
        var a = px[(Math.min(so.height - 1, Math.floor(sy / 4)) * so.width + Math.min(so.width - 1, Math.floor(sx / 4))) * 4 + 3];
        if (a < 150 + Math.random() * 90) continue;
        var dep = clamp((sy - hy) / (H - hy), 0, 1);
        WS.sparkles.push({ x: sx, y: sy, ph: Math.random() * TAU, f: lerp(0.4, 1.1, Math.random()), s: lerp(1, 3.6, dep) });
      }
    }
  }
  // mist lying low where the snowfield meets the mountains
  var my0 = hy - depthPx * 0.15, mh = depthPx * 0.5;
  if (!WS.gmist) WS.gmist = landCanvas();
  WS.gmist.top = my0;
  WS.gmist.cnv.width = Math.round(W * PR); WS.gmist.cnv.height = Math.max(1, Math.round(mh * PR));
  var gm = WS.gmist.c;
  gm.setTransform(PR, 0, 0, PR, 0, -my0 * PR);
  var mz = gm.createLinearGradient(0, my0, 0, my0 + mh), mc = winLight(C.mist);
  mz.addColorStop(0, rgba(mc, 0)); mz.addColorStop(0.35, rgba(mc, 0.55 * WINT.groundHaze)); mz.addColorStop(1, rgba(mc, 0));
  gm.fillStyle = mz; gm.fillRect(-10, my0, W + 20, mh);
  // the skiers' shadows: the same as the things', worked out once
  var e = Math.max(2.5, WL.el) * PI / 180, az = WINT.sunAzimuth * PI / 180, cot = Math.min(7, 1 / Math.tan(e)) * WINT.shadowLength;
  WS.shadow = { sx: clamp(-Math.sin(az) * cot, -3.5, 3.5), sy: clamp(-Math.cos(az) * cot * 0.35, -0.9, 0.9), col: rgba(WSHADE), k: WINT.skiShadow * WL.vis };
  WS.trackLo = rgba(mixRgb(WSHADE, winLit(C.snow, 0, 0.6, 0.8, 0), 0.3)); WS.trackHi = rgba(winLit(C.snow, WL.dir[0] * 0.5, 1, 0.3, 1));
  if (gl3 && typeof Snowfield.losses === 'function') WS.sfLoss = Snowfield.losses();
}
/* #dynBack: each slice, then on it the tracks, the skiers, the powder they kick up and the lights. */
function winDrawGround(c, t) {
  for (var i = 0; i < WS.slabs.length; i++) {
    var SL = WS.slabs[i];
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.drawImage(SL.cnv, 0, Math.round(SL.top * PR));
    winDrawTracks(c, SL.k, t);
    for (var j = 0; j < WS.skiers.length; j++) if (WS.skiers[j].k === SL.k && !WS.skiers[j].dots) winDrawSkier(c, WS.skiers[j], t);
    winDrawPowder(c, SL.k);
    winDrawLights(c, SL.k, t);
  }
  if (WS.gmist) { c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(WS.gmist.cnv, 0, Math.round(WS.gmist.top * PR)); }
}
function winDrawLights(c, k, t) {
  var s = winNightLights();
  if (s <= 0.005) return;
  c.setTransform(PR, 0, 0, PR, 0, 0);
  var C = winCols(), o = { strength: s, flicker: WINT.flicker, halo: WINT.halo, pool: WINT.pool, wind: Math.abs(winFieldAt(W / 2)) * 3,
                        colours: { flame: C.flame, glow: mixRgb(C.flame, [255, 255, 255], 0.45) } };
  for (var i = 0; i < WS.lights.length; i++) {
    var L = WS.lights[i];
    if (L.k !== k) continue;
    o.strength = s * (1 - L.haze * 0.6);
    Snowlights.glow(c, L, t, o);
  }
}
function winDrawGlints(c, t) {
  var sp = WS.sparkles;
  if (!sp.length) return;
  c.setTransform(PR, 0, 0, PR, 0, 0);
  var col = WL.n > 0.5 ? 'rgba(220,228,255,1)' : WL.dusk > 0.5 ? 'rgba(255,232,200,1)' : 'rgba(255,255,255,1)';
  c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 0.7;
  for (var i = 0; i < sp.length; i++) {
    var S0 = sp[i], a = Math.pow(Math.max(0, Math.sin(t * S0.f + S0.ph)), 12) * Math.min(1, WINT.sparkle * 1.5);
    if (a < 0.02) continue;
    c.globalAlpha = a;
    c.beginPath();
    c.moveTo(S0.x - S0.s * 1.6, S0.y); c.lineTo(S0.x + S0.s * 1.6, S0.y);
    c.moveTo(S0.x, S0.y - S0.s * 1.6); c.lineTo(S0.x, S0.y + S0.s * 1.6);
    c.stroke();
    c.beginPath(); c.arc(S0.x, S0.y, S0.s * 0.35, 0, TAU); c.fill();
  }
  c.globalAlpha = 1;
}

/* ============================================================
   9. SKIERS — as in the app (WINT): cross-country skiers striding
   across the snowfield at every depth, each in their own outfit with a
   fluttering scarf. New: each casts a shadow on the snow that follows
   the sun, leaves a pair of tracks behind (they fade after trackFade s),
   and kicks up a little powder with each stride.
   ============================================================ */
var WIN_JACKETS = ['#C8321E', '#882E47', '#2F4A6B', '#3E5A3A', '#E66826', '#5A4A7A', '#D9A23A', '#1F6F78', '#F2EDE4'];
var WIN_PANTS = ['#2A2A35', '#3B3F52', '#4A3A3E', '#2F4A6B', '#5B4636', '#3E4A3A'];
var WIN_HATS = ['#F2EDE4', '#C8321E', '#E66826', '#2F4A6B', '#882E47', '#F2B33A', '#1F6F78'];
var WIN_SCARVES = ['#D93B3B', '#F2B33A', '#E66826', '#882E47', '#1F6F78', '#F2EDE4', '#7FA35A', '#5A4A7A'];
var WIN_SKIS = ['#A8212E', '#2F4A6B', '#E6E1D8', '#E66826', '#3B3B44'];
var WIN_SKIN = ['#EBC7AA', '#DDB091', '#C89878'];
function winPick(a) { return a[Math.floor(Math.random() * a.length)]; }
function winSkiY(S, x) { return S.yk - S.amp * S.f(x) + S.amp * 0.85 + 4; }
function winMeasureDots() {
  var de = document.getElementById('dots');
  WS.dots = null;
  if (!de || !de.classList.contains('visible')) return;
  var ds = de.querySelectorAll('.dot'), x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (var i = 0; i < ds.length; i++) {
    var rc = ds[i].getBoundingClientRect();
    if (!rc.width) continue;
    x0 = Math.min(x0, rc.left); x1 = Math.max(x1, rc.right); y0 = Math.min(y0, rc.top); y1 = Math.max(y1, rc.bottom);
  }
  if (x1 > x0) WS.dots = { x0: x0 - 12, x1: x1 + 12, y0: y0 - 12, y1: y1 + 12 };
}
function winSpawnSkier() {
  var SW = WS.swells, N = SW.length;
  if (!N) return;
  var a = Math.round(clamp(WINT.skiFar, 0, 1) * (N - 1)), z = Math.round(clamp(WINT.skiNear, 0, 1) * (N - 1));
  var lo = Math.min(a, z), hi = Math.max(a, z), hk = WINT.skiSize * rnd(0.9, 1.08);
  function hOf(u) { return H * lerp(0.04, 0.09, u) * hk; }
  function pickIn(k0, k1) { k0 = clamp(k0, lo, hi); k1 = clamp(k1, k0, hi); return k0 + Math.floor(Math.random() * (k1 - k0 + 1)); }
  var kD = -1, offD = 0, B = WS.dots;
  if (B) {
    var dx = (B.x0 + B.x1) / 2, dy = (B.y0 + B.y1) / 2, best = Infinity;
    for (var q = 0; q < N; q++) {
      var gap = dy + hOf(SW[q].u) * 0.55 - winSkiY(SW[q], dx);
      if (gap >= 0 && gap < best) { best = gap; kD = q; offD = gap; }
    }
  }
  var kT = WS.toriiK === undefined ? 0 : WS.toriiK, kMid = kD >= 0 ? kD : kT;
  var r = Math.random(), f = kD >= 0 ? WINT.skiFront : 0, k, off, dots = false;
  if (r < f) { k = kD; dots = true; off = Math.max(0, offD + hOf(SW[k].u) * rnd(-0.18, 0.18)); }
  else {
    if (r < f + (1 - f) / 2) k = pickIn(lo, Math.min(kT, kMid) - 1);
    else {
      var kN = hi, top = WS.driftY || H;
      while (kN > kMid + 1 && winSkiY(SW[kN], W / 2) > top - 6) kN--;
      k = pickIn(kMid + 1, kN);
    }
    var room = k < N - 1 ? SW[k + 1].yk - SW[k].yk : SW[k].amp + 10;
    off = rnd(0, 0.5) * room;
    if (WS.driftY) off = Math.min(off, Math.max(0, WS.driftY - 6 - winSkiY(SW[k], W / 2)));
  }
  var u = k < N - 1 ? lerp(SW[k].u, SW[k + 1].u, clamp(off / (SW[k + 1].yk - SW[k].yk), 0, 1)) : SW[k].u;
  var h = hOf(u), dir = Math.random() < 0.5 ? 1 : -1;
  var jacket = winPick(WIN_JACKETS), scarf = winPick(WIN_SCARVES);
  while (scarf === jacket) scarf = winPick(WIN_SCARVES);
  var K = { k: k, u: u, h: h, off: off, dir: dir, x: dir > 0 ? -h * 1.6 : W + h * 1.6, vb: rnd(1.1, 2.4), v: 0, dots: dots,
            ph: rnd(0, TAU), sph: rnd(0, TAU), sf: rnd(0.8, 1.3), stripe: Math.random() < 0.5, blit: null, step: 0,
            col: { jacket: hexToRgb(jacket), pants: hexToRgb(winPick(WIN_PANTS)), hat: hexToRgb(winPick(WIN_HATS)), pom: hexToRgb(winPick(WIN_HATS)),
                   scarf: hexToRgb(scarf), skis: hexToRgb(winPick(WIN_SKIS)), skin: hexToRgb(winPick(WIN_SKIN)) },
            cnv: document.createElement('canvas') };
  K.trk = { k: k, u: u, h: h, pts: [], gone: 0, dots: dots };
  WS.tracks.push(K.trk);
  WS.skiers.push(K);
}
function winUpdateSkiers(t, dt) {
  WS.skiTimer -= dt;
  if (WS.skiTimer <= 0) {
    if (WS.skiers.length < WINT.maxSkiers) winSpawnSkier();
    WS.skiTimer = rnd(WINT.skiGapMin, WINT.skiGapMax);
  }
  for (var i = WS.skiers.length - 1; i >= 0; i--) {
    var K = WS.skiers[i], S = WS.swells[K.k];
    if (!S) { WS.skiers.splice(i, 1); continue; }
    var down = K.dir * (winSkiY(S, K.x + 3) - winSkiY(S, K.x - 3)) / 6;
    K.v = K.vb * K.h * WINT.skiSpeed * clamp(1 + 1.5 * down, 0.55, 1.5);
    K.x += K.dir * K.v * dt;
    K.ph += dt * TAU * K.v / (K.h * 1.7);
    // the tracks behind, a point every few px
    var P = K.trk.pts, fy = winSkiY(S, K.x) + K.off;
    if (!P.length || Math.abs(P[P.length - 1][0] - K.x) > 4) P.push([K.x, fy]);
    // a puff of powder at each kick
    var st = Math.floor(K.ph / PI);
    if (st !== K.step) {
      K.step = st;
      if (WINT.powder > 0) for (var q = 0; q < 3; q++) {
        WS.powder.push({ k: K.k, dots: K.dots, x: K.x - K.dir * K.h * rnd(0.1, 0.45), y: fy - K.h * rnd(0, 0.04), vx: -K.dir * rnd(4, 14) * K.h / 60,
                         vy: -rnd(2, 6) * K.h / 60, r: K.h * rnd(0.03, 0.06), age: 0, life: rnd(0.7, 1.3), u: K.u });
      }
    }
    if (K.dir > 0 ? K.x > W + K.h * 1.6 : K.x < -K.h * 1.6) { K.trk.gone = t; WS.skiers.splice(i, 1); }
  }
  for (var j = WS.tracks.length - 1; j >= 0; j--) { var Tr = WS.tracks[j]; if (Tr.gone && t - Tr.gone > WINT.trackFade) WS.tracks.splice(j, 1); }
  for (var p = WS.powder.length - 1; p >= 0; p--) {
    var Pw = WS.powder[p];
    Pw.age += dt;
    if (Pw.age > Pw.life) { WS.powder.splice(p, 1); continue; }
    Pw.vx += (winFieldAt(Pw.x) * 30 - Pw.vx) * (1 - Math.exp(-dt * 2)); Pw.vy += 6 * dt;
    Pw.x += Pw.vx * dt; Pw.y += Pw.vy * dt; Pw.r += dt * Pw.r * 0.8;
  }
}
function winDrawTracks(c, k, t) {
  if (WINT.tracks <= 0) return;
  c.setTransform(PR, 0, 0, PR, 0, 0);
  for (var i = 0; i < WS.tracks.length; i++) {
    var Tr = WS.tracks[i], P = Tr.pts;
    if (Tr.k !== k || P.length < 2) continue;
    var a = WINT.tracks * (Tr.gone ? 1 - (t - Tr.gone) / WINT.trackFade : 1) * lerp(0.5, 1, Tr.u);
    if (a <= 0.01) continue;
    var gap = Math.max(0.7, Tr.h * 0.022), w = Math.max(0.5, Tr.h * 0.016);
    c.globalAlpha = clamp(a, 0, 1);
    for (var s = 0; s < 2; s++) {
      var dy = s ? gap : -gap * 0.3;
      c.strokeStyle = WS.trackLo; c.lineWidth = w;
      c.beginPath(); c.moveTo(P[0][0], P[0][1] + dy);
      for (var q = 1; q < P.length; q++) c.lineTo(P[q][0], P[q][1] + dy);
      c.stroke();
      c.strokeStyle = WS.trackHi; c.lineWidth = w * 0.6;
      c.beginPath(); c.moveTo(P[0][0], P[0][1] + dy + w * 0.9);
      for (q = 1; q < P.length; q++) c.lineTo(P[q][0], P[q][1] + dy + w * 0.9);
      c.stroke();
    }
  }
  c.globalAlpha = 1;
}
function winDrawPowder(c, k, front) {
  if (!WS.powder.length) return;
  c.setTransform(PR, 0, 0, PR, 0, 0);
  for (var i = 0; i < WS.powder.length; i++) {
    var Pw = WS.powder[i];
    if (front ? !Pw.dots : (Pw.k !== k || Pw.dots)) continue;
    var q = Pw.age / Pw.life;
    c.globalAlpha = clamp(WINT.powder * 0.7 * (q < 0.2 ? q / 0.2 : 1 - (q - 0.2) / 0.8), 0, 1) * lerp(0.6, 1, Pw.u);
    c.drawImage(LS.MIST.cnv, Pw.x - Pw.r, Pw.y - Pw.r * 0.7, Pw.r * 2, Pw.r * 1.4);
  }
  c.globalAlpha = 1;
}
/* One skier on its own small canvas (as in the app). */
function winPaintSkier(K, t) {
  var C = winCols(), S = WS.swells[K.k], h = K.h, mistC = winLight(C.mist);
  var haze = WINT.groundHaze * Math.pow(1 - K.u, 2) * 0.9;
  function col(x, k) { return rgba(mixRgb(winLight(scaleRgb(x, k || 1)), mistC, haze)); }
  var blur = lerp(WINT.skiFarBlur, WINT.skiNearBlur, K.u), res = clamp(PR / (1 + blur * PR * 0.9), 0.12, PR);
  var bw = h * 3, bh = h * 1.7, ox = h * 1.5, oy = h * 1.35;
  var cw = Math.max(1, Math.ceil(bw * res)), ch = Math.max(1, Math.ceil(bh * res));
  if (K.cnv.width !== cw || K.cnv.height !== ch) { K.cnv.width = cw; K.cnv.height = ch; }
  var g = K.cnv.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cw, ch);
  g.setTransform(res * K.dir, 0, 0, res, ox * res, oy * res);
  var gy0 = winSkiY(S, K.x) + K.off, ms = K.dir * (winSkiY(S, K.x + 4) - winSkiY(S, K.x - 4)) / 8;
  function gY(lx) { return lx * ms; }
  var p = K.ph, s1 = Math.sin(p), bob = Math.abs(Math.cos(p)) * 0.018 * h;
  var hip = [0.02 * h, -0.47 * h - bob], lean = 0.4;
  var sho = [hip[0] + Math.sin(lean) * 0.31 * h, hip[1] - Math.cos(lean) * 0.31 * h];
  var head = [sho[0] + 0.06 * h, sho[1] - 0.1 * h], hr = 0.068 * h;
  var fN = 0.24 * h * s1, fF = -fN;
  g.lineCap = 'round'; g.lineJoin = 'round';
  function ski(fx, k) {
    var x0 = fx - 0.45 * h, x1 = fx + 0.65 * h;
    g.strokeStyle = col(K.col.skis, k); g.lineWidth = Math.max(0.6, 0.028 * h);
    g.beginPath(); g.moveTo(x0, gY(x0)); g.lineTo(x1 - 0.06 * h, gY(x1 - 0.06 * h));
    g.quadraticCurveTo(x1, gY(x1), x1 + 0.02 * h, gY(x1) - 0.05 * h); g.stroke();
  }
  function leg(fx, k) {
    var fy = gY(fx) - 0.02 * h, kn = [(hip[0] + fx) / 2 + 0.07 * h, (hip[1] + fy) / 2];
    g.strokeStyle = col(K.col.pants, k); g.lineWidth = 0.075 * h;
    g.beginPath(); g.moveTo(hip[0], hip[1]); g.lineTo(kn[0], kn[1]); g.lineTo(fx, fy); g.stroke();
    g.strokeStyle = col([40, 36, 40], k); g.lineWidth = 0.07 * h;
    g.beginPath(); g.moveTo(fx - 0.02 * h, fy); g.lineTo(fx + 0.06 * h, gY(fx + 0.06 * h) - 0.02 * h); g.stroke();
  }
  function arm(sw, k) {
    var hand = [sho[0] + 0.05 * h + 0.26 * h * sw, sho[1] + 0.24 * h - 0.05 * h * sw];
    var el = [(sho[0] + hand[0]) / 2 - 0.02 * h, (sho[1] + hand[1]) / 2 + 0.04 * h];
    var tipX = hand[0] - 0.24 * h, tip = [tipX, gY(tipX) - 0.01 * h];
    g.strokeStyle = col([60, 58, 66], k); g.lineWidth = Math.max(0.5, 0.016 * h);
    g.beginPath(); g.moveTo(hand[0], hand[1] - 0.03 * h); g.lineTo(tip[0], tip[1]); g.stroke();
    g.strokeStyle = col(K.col.jacket, k); g.lineWidth = 0.06 * h;
    g.beginPath(); g.moveTo(sho[0], sho[1]); g.lineTo(el[0], el[1]); g.lineTo(hand[0], hand[1]); g.stroke();
    g.fillStyle = col([50, 44, 48], k); g.beginPath(); g.arc(hand[0], hand[1], 0.03 * h, 0, TAU); g.fill();
  }
  ski(fF, 0.82); leg(fF, 0.82); arm(-s1, 0.82);
  g.strokeStyle = col(K.col.jacket); g.lineWidth = 0.15 * h;
  g.beginPath(); g.moveTo(hip[0], hip[1]); g.lineTo(sho[0], sho[1]); g.stroke();
  // the jacket lit on the sunny side
  var sunny = (WL.dir[0] < 0 ? -1 : 1) * K.dir;
  g.strokeStyle = rgba([255, 240, 220], 0.18 * WL.vis); g.lineWidth = 0.05 * h;
  g.beginPath(); g.moveTo(hip[0] + sunny * 0.04 * h, hip[1]); g.lineTo(sho[0] + sunny * 0.04 * h, sho[1]); g.stroke();
  if (K.stripe) {
    g.strokeStyle = col(K.col.scarf, 0.95); g.lineWidth = 0.03 * h;
    g.beginPath(); g.moveTo(lerp(hip[0], sho[0], 0.45) - 0.07 * h, lerp(hip[1], sho[1], 0.45) - 0.02 * h);
    g.lineTo(lerp(hip[0], sho[0], 0.45) + 0.07 * h, lerp(hip[1], sho[1], 0.45) + 0.02 * h); g.stroke();
  }
  ski(fN, 1); leg(fN, 1);
  var flow = clamp(K.v / (h * 2), 0.3, 1.5) + clamp(K.dir * winFieldAt(K.x) * 3, -0.6, 1.2);
  var a0 = Math.atan2(0.45, -Math.max(0.15, flow)), neck = [sho[0] + 0.03 * h, sho[1] - 0.02 * h];
  var segL = 0.055 * h * WINT.scarfLength, nS = 7, fl = WINT.scarfFlutter;
  for (var tail = 0; tail < 2; tail++) {
    var px = neck[0], py = neck[1] + tail * 0.025 * h, pts = [[px, py]];
    for (var j = 1; j <= nS; j++) {
      var a = a0 + tail * 0.12 + Math.sin(t * (7 + 3 * flow) * fl * K.sf - j * 0.8 + K.sph + tail * 1.3) * 0.28 * fl * (j / nS) * (0.5 + 0.5 * flow);
      px += Math.cos(a) * segL; py += Math.sin(a) * segL; pts.push([px, py]);
    }
    g.strokeStyle = col(K.col.scarf, tail ? 0.85 : 1);
    for (j = 0; j < nS; j++) {
      g.lineWidth = Math.max(0.5, 0.05 * h * (1 - j / nS * 0.45));
      g.beginPath(); g.moveTo(pts[j][0], pts[j][1]); g.lineTo(pts[j + 1][0], pts[j + 1][1]); g.stroke();
    }
  }
  arm(s1, 1);
  g.fillStyle = col(K.col.scarf); g.beginPath(); winEllipse(g, neck[0], neck[1], 0.075 * h, 0.04 * h); g.fill();
  g.fillStyle = col(K.col.skin); g.beginPath(); g.arc(head[0], head[1], hr, 0, TAU); g.fill();
  g.fillStyle = col(K.col.hat);
  g.beginPath(); g.arc(head[0] - 0.005 * h, head[1] - 0.012 * h, hr * 1.04, PI * 1.02, PI * 2.02); g.fill();
  g.fillRect(head[0] - hr * 1.08, head[1] - 0.025 * h, hr * 2.1, 0.03 * h);
  g.fillStyle = col(K.col.pom); g.beginPath(); g.arc(head[0] - 0.02 * h, head[1] - hr - 0.03 * h, 0.032 * h, 0, TAU); g.fill();
  K.blit = [K.x - ox, gy0 - oy, bw, bh];
  K.feet = gy0;
  K.head = [head[0], head[1], hr];                         // where the head is, for the torch (feet at 0, 0; up is -y)
}
/* ---------- the head torch ----------
   After dusk each skier wears a lamp on the forehead. By day it is nothing. The light: a small
   bright lamp with a glow round it, a faint cone of light in the cold air running forward and down
   from the lamp to the snow, and where the cone meets the snow a soft pool of light. The beam bobs
   a little with every stride (torchBob), it fades with the distance (haze), and the snowflakes
   that fall through it are lit (torchFlakes, see drawFlakes). op: how it is laid down ('lighter'
   on the scene; 'source-over' on a skier's own layer). */
var winTorchCol = { key: '', rgb: [255, 243, 214] };
function winTorchLevel() {
  if (!WINT.torch) return 0;
  return WL ? WINT.torchNight * WL.n + WINT.torchEvening * WL.dusk : 0;
}
/* One soft cone, lying along +x from its point (left, middle) to its wide end (right), in the
   light's colour: it widens from a point at the lamp, fades along its length and fades smoothly
   to nothing toward its sides. */
var winTorchBeamSpr = null, winTorchBeamKey = '';
function winTorchBeamSprite(col) {
  var key = col.join(',');
  if (winTorchBeamSpr && winTorchBeamKey === key) return winTorchBeamSpr;
  winTorchBeamKey = key;
  var w = 256, h = 128, cnv = winTorchBeamSpr || document.createElement('canvas');
  cnv.width = w; cnv.height = h;
  var c = cnv.getContext('2d'), img = c.createImageData(w, h), d = img.data;
  for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
    var u = (x + 0.5) / w, v = ((y + 0.5) / h - 0.5) * 2;                  // 0 … 1 along it, -1 … 1 across the full width
    var vn = v / (0.02 + 0.98 * u);                                          // across the cone's own width here: a point at the lamp
    var across = Math.abs(vn) >= 1 ? 0 : Math.exp(-vn * vn * 2.4) * Math.pow(1 - vn * vn, 1.5);
    var along = Math.pow(1 - u, 1.1) * (1 - Math.exp(-u * 40)) + 0.18 * (1 - u);   // bright at the lamp, fading toward the snow
    var a = across * along, o = (y * w + x) * 4;
    d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = Math.min(255, Math.floor(a * 255 + Math.random()));
  }
  c.putImageData(img, 0, 0);
  winTorchBeamSpr = cnv;
  return cnv;
}
function winTorchSpot(K, t) {
  var h = K.h, bob = Math.sin(K.ph * 2) * 0.5 + 0.5, hx = K.x + K.dir * (K.head[0] + K.head[2] * 0.95);   // on the forehead, at the front of the head
  var hy = K.feet + K.head[1] - K.head[2] * 0.15;
  var d0 = WINT.torchReach * h * (1 + (bob - 0.5) * 0.35 * WINT.torchBob);               // where the middle of the beam meets the snow
  return { x: hx, y: hy, d0: d0, gx: hx + K.dir * d0, gy: K.feet + 0.012 * h, bob: bob };
}
function winDrawTorch(c, K, t, ox, oy, op) {
  var lv = winTorchLevel();
  if (lv <= 0.005 || !K.head) return;
  if (winTorchCol.key !== WINT.colours.torch) { winTorchCol.key = WINT.colours.torch; winTorchCol.rgb = hexToRgb(WINT.colours.torch); }
  var col = winTorchCol.rgb, h = K.h, S = winTorchSpot(K, t), haze = WINT.groundHaze * Math.pow(1 - K.u, 2) * 0.9;
  var k = lv * (1 - haze * 0.55) * lerp(0.7, 1, K.u);
  var hx = S.x, hy = S.y, d0 = S.d0, w = WINT.torchWidth, x1 = hx + K.dir * d0 * (1 - w), x2 = hx + K.dir * d0 * (1 + w);
  c.save();
  c.setTransform(PR, 0, 0, PR, -(ox || 0) * PR, -(oy || 0) * PR);
  c.globalCompositeOperation = op || 'lighter';
  // the pool of light on the snow where the beam lands: wide and flat, brightest in the middle
  var pw = Math.abs(x2 - x1) * 0.75 + h * 0.2, ph = pw * 0.2;
  if (WINT.torchSpill > 0) {
    c.save();
    c.translate((x1 + x2) / 2, S.gy); c.scale(1, ph / pw);
    var pg = c.createRadialGradient(0, 0, 0, 0, 0, pw);
    pg.addColorStop(0, rgba(col, 0.55 * WINT.torchSpill * k)); pg.addColorStop(0.4, rgba(col, 0.25 * WINT.torchSpill * k)); pg.addColorStop(1, rgba(col, 0));
    c.fillStyle = pg; c.fillRect(-pw, -pw, pw * 2, pw * 2);
    c.restore();
  }
  // the cone in the air: one smooth beam from the lamp to the snow, laid down from a soft picture of a
  // cone (bright at the lamp, fading along its length, and fading to nothing toward its sides)
  if (WINT.torchBeam > 0) {
    var mx = (x1 + x2) / 2, base = Math.abs(x2 - x1);
    c.save();
    c.transform(mx - hx, S.gy - hy, base, 0, hx, hy);
    c.globalAlpha = clamp(0.62 * WINT.torchBeam * k, 0, 1);
    c.imageSmoothingEnabled = true;
    c.drawImage(winTorchBeamSprite(col), 0, -0.5, 1, 1);
    c.restore();
  }
  // the lamp: a bright point with a glow round it
  if (WINT.torchGlow > 0) {
    var gr = h * 0.1 * WINT.torchGlow, lg = c.createRadialGradient(hx, hy, 0, hx, hy, gr);
    lg.addColorStop(0, rgba([255, 255, 255], 0.95 * k)); lg.addColorStop(0.25, rgba(col, 0.55 * k)); lg.addColorStop(0.6, rgba(col, 0.15 * k)); lg.addColorStop(1, rgba(col, 0));
    c.fillStyle = lg; c.fillRect(hx - gr, hy - gr, gr * 2, gr * 2);
  }
  c.restore();
}
/* The skier's shadow: its outline, laid on the snow away from the sun (ox, oy: where c's own origin is, CSS px). */
function winSkierShadow(c, K, ox, oy) {
  var SHw = WS.shadow;
  if (!SHw || SHw.k <= 0.01) return;
  var cw = K.cnv.width, ch = K.cnv.height;
  if (WS.SKS.cnv.width !== cw || WS.SKS.cnv.height !== ch) { WS.SKS.cnv.width = cw; WS.SKS.cnv.height = ch; }
  var s = WS.SKS.c;
  s.setTransform(1, 0, 0, 1, 0, 0); s.globalCompositeOperation = 'source-over'; s.clearRect(0, 0, cw, ch);
  s.drawImage(K.cnv, 0, 0);
  s.globalCompositeOperation = 'source-in'; s.fillStyle = SHw.col; s.fillRect(0, 0, cw, ch);
  s.globalCompositeOperation = 'source-over';
  var fy = K.feet, sy = SHw.sy;
  c.save();
  c.globalAlpha = clamp(SHw.k * lerp(0.5, 1, K.u), 0, 1);
  c.setTransform(PR, 0, 0, PR, -(ox || 0) * PR, -(oy || 0) * PR);
  c.transform(1, 0, -SHw.sx, sy, SHw.sx * fy, fy * (1 - sy));
  c.drawImage(WS.SKS.cnv, K.blit[0], K.blit[1], K.blit[2], K.blit[3]);
  c.restore();
}
function winDrawSkier(c, K, t) {
  winPaintSkier(K, t);
  winSkierShadow(c, K);
  c.setTransform(PR, 0, 0, PR, 0, 0);
  c.imageSmoothingEnabled = true;
  c.drawImage(K.cnv, K.blit[0], K.blit[1], K.blit[2], K.blit[3]);
  winDrawTorch(c, K, t);
}
/* #dynNear: the skiers that pass the page dots (as in the app), with their shadows and powder: on a
   small layer of their own, hidden where the nearer swells cover them and washed by the low mist. */
function winDrawFrontSkiers(c, t) {
  for (var i = 0; i < WS.skiers.length; i++) {
    var K = WS.skiers[i];
    if (!K.dots) continue;
    winPaintSkier(K, t);
    // the layer holds the skier and, after dusk, the whole of its beam and the pool of light on the snow
    var ext = Math.max(K.h * 2, winTorchLevel() > 0.005 ? K.h * (WINT.torchReach * (1 + WINT.torchWidth) * 1.15 + 0.7) : 0);
    var bx = K.blit[0] - ext, by = K.blit[1] - K.h * 0.5, bw = K.blit[2] + ext * 2, bh = K.blit[3] + K.h;
    var fw = Math.ceil(bw * PR), fh = Math.ceil(bh * PR), F = WS.FTMP, f = F.c;
    if (F.cnv.width !== fw || F.cnv.height !== fh) { F.cnv.width = fw; F.cnv.height = fh; }
    f.setTransform(1, 0, 0, 1, 0, 0); f.globalCompositeOperation = 'source-over'; f.clearRect(0, 0, fw, fh);
    winSkierShadow(f, K, bx, by);
    f.setTransform(PR, 0, 0, PR, -bx * PR, -by * PR);
    f.imageSmoothingEnabled = true;
    f.drawImage(K.cnv, K.blit[0], K.blit[1], K.blit[2], K.blit[3]);
    winDrawTorch(f, K, t, bx, by, 'source-over');
    f.setTransform(1, 0, 0, 1, 0, 0);
    f.globalCompositeOperation = 'destination-out';
    for (var j = 0; j < WS.slabs.length; j++) {
      var SL = WS.slabs[j];
      if (SL.k > K.k) f.drawImage(SL.cnv, -bx * PR, Math.round(SL.top * PR) - by * PR);
    }
    if (WS.gmist) { f.globalCompositeOperation = 'source-atop'; f.drawImage(WS.gmist.cnv, -bx * PR, Math.round(WS.gmist.top * PR) - by * PR); }
    f.globalCompositeOperation = 'source-over';
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.drawImage(F.cnv, bx * PR, by * PR);
  }
  winDrawPowder(c, -1, true);
}

/* ============================================================
   10. THE SNOWDRIFT in front of the text and table (as in the app),
   now lit by the scene's light: warm on top in the sun, blue in its
   hollows.
   ============================================================ */
function winBakeNear() {
  var C = winCols(), nH = WINT.nearHeight, hh = Math.min(GH, Math.ceil(nH * 1.6 + 30));
  LS.nearH = hh;
  LS.NEAR.cnv.width = LS.NEART.cnv.width = Math.round(W * PR);
  LS.NEAR.cnv.height = LS.NEART.cnv.height = Math.max(1, Math.round(hh * PR));
  var c = LS.NEAR.c, t = LS.NEART.c;
  t.setTransform(1, 0, 0, 1, 0, 0); t.clearRect(0, 0, LS.NEART.cnv.width, LS.NEART.cnv.height);
  c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, LS.NEAR.cnv.width, LS.NEAR.cnv.height);
  t.setTransform(PR, 0, 0, PR, 0, 0);
  var r = rngFrom(WINT.seed * 29 + 7), CR = 2, nC = Math.ceil(W * CR) + 4, surf = new Float32Array(nC), x, q;
  var L = [lerp(420, 700, r()), lerp(180, 300, r())], p = [r() * TAU, r() * TAU], base = hh - nH * 0.6;
  for (q = 0; q < nC; q++) {
    var xx = q / CR, v = 0.65 * Math.sin(xx / L[0] * TAU + p[0]) + 0.35 * Math.sin(xx / L[1] * TAU + p[1]);
    surf[q] = clamp(base - nH * 0.4 * WINT.nearLumps * v, hh - nH * 1.25, hh - nH * 0.2);
  }
  var litC = winLit(C.snow, WL.dir[0] * 0.3, 1, 0.5), sh = winLit(C.snow, -WL.dir[0] * 0.3, 0.4, 1, 0.15), deep = winLit(C.snow, 0, -0.2, 1, 0);
  function outline() {
    t.beginPath(); t.moveTo(-10, hh + 10); t.lineTo(-10, surf[0]);
    for (q = 0; q < nC; q += 4) t.lineTo(q / CR, surf[q]);
    t.lineTo(W + 10, surf[nC - 1]); t.lineTo(W + 10, hh + 10); t.closePath();
  }
  t.save();
  t.shadowColor = rgba(scaleRgb(deep, 0.7), 0.5 * WINT.nearShadow);
  t.shadowBlur = WINT.nearShadowSize * PR;
  t.shadowOffsetY = -0.5 * PR;
  var g = t.createLinearGradient(0, hh - nH * 1.25, 0, hh);
  g.addColorStop(0, rgba(litC)); g.addColorStop(1, rgba(mixRgb(litC, sh, WINT.nearShade * 0.5)));
  outline(); t.fillStyle = g; t.fill();
  t.restore();
  // its surface drawn by snowfield.js as one more swell (the nearest), so it matches the field behind it
  var sfOk = typeof Snowfield !== 'undefined' && Snowfield.supported();
  if (sfOk) {
    var NX = 256, cr = new Float32Array(NX);
    for (var j = 0; j < NX; j++) cr[j] = H - hh + surf[clamp(Math.round((-20 + j / (NX - 1) * (W + 40)) * CR), 0, nC - 1)];
    var pic = Snowfield.render(winSfOptions([{ crest: cr, u: 1, haze: 0 }]), 0, H - hh, H);
    if (pic) {
      t.save(); outline(); t.clip();
      t.setTransform(1, 0, 0, 1, 0, 0);
      t.drawImage(pic, 0, 0, LS.NEART.cnv.width, LS.NEART.cnv.height);
      t.restore();
      t.setTransform(PR, 0, 0, PR, 0, 0);
    } else WS.retry = true;
  } else if (typeof Snowfield !== 'undefined' && Snowfield.state && Snowfield.state() === 'lost') WS.retry = true;
  if (WINT.nearShade > 0) {
    var bl = Math.max(3, nH * 0.22), bottom = [];
    t.save(); outline(); t.clip();
    t.filter = 'blur(' + (bl * PR).toFixed(1) + 'px)';
    t.beginPath();
    for (x = -20; x <= W + 20; x += 6) {
      var y = surf[clamp(Math.round(x * CR), 0, nC - 1)] + bl * 1.1;
      var dn = (surf[clamp(Math.round((x + 6) * CR), 0, nC - 1)] - surf[clamp(Math.round((x - 6) * CR), 0, nC - 1)]) / 12 * 6 * (WL.dir[0] < 0 ? 1 : -1);
      if (x === -20) t.moveTo(x, y); else t.lineTo(x, y);
      bottom.push([x, y + nH * 0.5 * clamp(0.6 + dn, 0.3, 1.3)]);
    }
    for (q = bottom.length - 1; q >= 0; q--) t.lineTo(bottom[q][0], bottom[q][1]);
    t.closePath();
    t.fillStyle = rgba(sh, WINT.nearShade * 0.7); t.fill();
    t.restore();
  }
  c.drawImage(LS.NEART.cnv, 0, 0);
  LS.surf = surf; LS.sr = CR; LS.nearTop = H - hh;
  for (var sum = 0, sq = 0; sq < nC; sq += 8) sum += surf[sq];
  WS.driftY = LS.nearTop + sum / Math.ceil(nC / 8);
}
function winFloorY(x) {
  var sf = LS.surf;
  if (!sf) return H - 4;
  return sf[clamp(Math.round(x * LS.sr), 0, sf.length - 1)] + LS.nearTop + 1.5;
}

/* ============================================================
   12. THE PLUM BRANCHES — as in the app, now lit by the scene's light:
   the bark is lighter on the side toward the light and the snow on the
   branches bright on top and blue underneath; the branches further in
   (behind the main limbs) are a little softer and paler.
   ============================================================ */
var UME_S0 = 20, UME_SN = 12;                // blossom sprites are drawn for a 20px flower; UME_SN points along each piece's snow
function umeBakeBlooms() {
  var C = winCols(), RS = 2, red = winLight(C.blossom), deep = winLight(C.blossomDeep), st = winLight(C.stamen);
  WS.blooms = [];
  for (var kind = 0; kind < 3; kind++) {
    for (var v = 0; v < 3; v++) {
      var side = Math.ceil(UME_S0 * 1.4 * RS), cnv = document.createElement('canvas');
      cnv.width = cnv.height = side;
      var c = cnv.getContext('2d'), r = rngFrom(kind * 31 + v * 7 + 5), p;
      c.setTransform(RS, 0, 0, RS, side / 2, side / 2);
      if (kind === 0) {
        for (p = 0; p < 5; p++) {
          var a = -PI / 2 + p * TAU / 5 + (r() - 0.5) * 0.25, pr = UME_S0 * 0.24 * lerp(0.9, 1.1, r());
          var g = c.createRadialGradient(0, 0, 0, 0, 0, UME_S0 * 0.5);
          g.addColorStop(0, rgba(deep)); g.addColorStop(0.45, rgba(red)); g.addColorStop(1, rgba(mixRgb(red, [255, 255, 255], 0.14)));
          c.fillStyle = g; c.beginPath(); c.arc(Math.cos(a) * UME_S0 * 0.24, Math.sin(a) * UME_S0 * 0.24, pr, 0, TAU); c.fill();
        }
        c.fillStyle = rgba(scaleRgb(deep, 0.85)); c.beginPath(); c.arc(0, 0, UME_S0 * 0.09, 0, TAU); c.fill();
        c.fillStyle = rgba(st);
        for (var q = 0; q < 8; q++) {
          var aa = q * TAU / 8 + r() * 0.3, dd = UME_S0 * lerp(0.12, 0.18, r());
          c.beginPath(); c.arc(Math.cos(aa) * dd, Math.sin(aa) * dd, UME_S0 * 0.026, 0, TAU); c.fill();
        }
      } else if (kind === 1) {
        c.fillStyle = rgba(red);
        for (p = 0; p < 3; p++) { c.beginPath(); winEllipse(c, (p - 1) * UME_S0 * 0.14, -UME_S0 * 0.04 + Math.abs(p - 1) * UME_S0 * 0.03, UME_S0 * 0.15, UME_S0 * 0.2); c.fill(); }
        c.fillStyle = rgba(deep); c.beginPath(); winEllipse(c, 0, UME_S0 * 0.12, UME_S0 * 0.13, UME_S0 * 0.07); c.fill();
      } else {
        c.fillStyle = rgba(deep); c.beginPath(); winEllipse(c, 0, 0, UME_S0 * 0.12, UME_S0 * 0.14); c.fill();
        c.fillStyle = rgba(mixRgb(red, [255, 255, 255], 0.25), 0.8); c.beginPath(); winEllipse(c, -UME_S0 * 0.03, -UME_S0 * 0.04, UME_S0 * 0.04, UME_S0 * 0.05); c.fill();
      }
      WS.blooms.push({ cnv: cnv, half: side / (2 * RS) });
    }
  }
  var mistC = winLight(C.mist), back = WINT.branchDepth;
  var wood = winLit(C.branch, 0, 0.2, 1, 0.3), woodLit = mixRgb(winLit(C.branch, WL.dir[0], 0.8, 0.3, 1), [255, 236, 210], 0.12);
  WS.wood = [rgba(wood), rgba(mixRgb(wood, mistC, back * 0.5))];
  WS.woodLit = [rgba(woodLit, WINT.barkLight * 0.55), rgba(mixRgb(woodLit, mistC, back * 0.5), WINT.barkLight * 0.4)];
  WS.petal = rgba(winLight(C.blossom)); WS.petalDk = rgba(winLight(C.blossomDeep));
  WS.branches.forEach(umeBakeSnow);
}
function umeBuild(left, idx) {
  var r = rngFrom(WINT.seed * 7919 + (left ? 0 : 101) + idx * 577);
  function M(a) { return left ? a : PI - a; }
  var sc = Math.min(W * 0.42, H * 0.62) * WINT.branchSize * [1, 0.62, 0.5][idx];
  var nodes = [], springs = [], blooms = [], groups = [];
  function add(parent, abs, len, w, flex, sp, g) {
    var pAbs = parent < 0 ? -PI / 2 : nodes[parent].abs, lump = [], sag = [], sp = [];
    // the snow on it: a lumpy top (two waves and a little noise), places where it wraps over the
    // edge (sag), now and then a bare stretch at either end, and flecks of texture
    var q1 = r() * TAU, q2 = r() * TAU, f1 = lerp(1.2, 2.6, r()), f2 = lerp(3.5, 6.5, r());
    for (var i = 0; i <= UME_SN; i++) {
      var qq = i / UME_SN;
      lump.push(clamp(1 + 0.16 * Math.sin(qq * f1 * TAU + q1) + 0.06 * Math.sin(qq * f2 * TAU + q2) + (r() - 0.5) * 0.04, 0.6, 1.4));
      sag.push(Math.pow(r(), 3) * 0.7);
    }
    for (i = 0; i < 4 + Math.floor(r() * 6); i++) sp.push({ t: r(), h: lerp(0.15, 0.85, r()), s: lerp(0.35, 1, r()), lt: r() < 0.6 });
    nodes.push({ p: parent, rel: abs - pAbs, abs: abs, len: len, w: w, flex: flex, sp: sp === undefined ? -1 : sp, g: g,
                 ph: r() * TAU, f: 0.6 + r() * 0.8, cur: abs, sx: 0, sy: 0, ex: 0, ey: 0,
                 snow: WINT.branchSnow * lerp(0.7, 1, r()), lump: lump, sag: sag, sp: sp,
                 sa: r() < 0.3 ? r() * 0.35 : 0, sb: r() < 0.3 ? 1 - r() * 0.3 : 1 });
    groups[g].nodes.push(nodes.length - 1);
    return nodes.length - 1;
  }
  function bloomOn(ni, k) {
    var n = nodes[ni], cnt = Math.round(lerp(1, 3.5, r()) * WINT.blossoms * (k || 1) * clamp(n.len / (sc * 0.07), 0.5, 2));
    for (var q = 0; q < cnt; q++) {
      var kind = r() < 0.62 ? 0 : (r() < 0.55 ? 1 : 2);
      blooms.push({ node: ni, t: lerp(0.15, 1, r()), off: (r() - 0.5) * Math.max(4, n.w * 2.2), rot: r() * TAU,
                    size: sc * lerp(0.024, 0.034, r()) * WINT.blossomSize * (kind === 2 ? 0.8 : 1), spr: kind * 3 + Math.floor(r() * 3), kind: kind });
    }
  }
  groups.push({ sp: -1, nodes: [] });
  var bx = left ? -sc * 0.04 : W + sc * 0.04, by = WINT.branchTop + lerp(-10, 20, r()), a0 = lerp(0.12, 0.3, r());
  if (idx === 1) { var ix = W * lerp(0.1, 0.16, r()); bx = left ? ix : W - ix; by = -sc * 0.12; a0 = lerp(0.85, 1.1, r()); }
  if (idx === 2) { by = WINT.branchTop + lerp(110, 170, r()); a0 = lerp(-0.1, 0.08, r()); }
  var nM = 7, prev = -1, mains = [], las = [], i;
  for (i = 0; i < nM; i++) {
    var la = a0 + 0.075 * WINT.branchDroop * i + (i % 2 ? 1 : -1) * lerp(0.12, 0.28, r());
    prev = add(prev, M(la), sc * 0.95 / nM * lerp(0.8, 1.2, r()), lerp(sc * 0.05, sc * 0.012, i / (nM - 1)),
               0.02 + 0.1 * Math.pow(i / nM, 1.3), undefined, 0);
    mains.push(prev); las.push(la);
  }
  for (i = 1; i < nM; i++) {
    var nb = r() < 0.7 ? 2 : 1;
    for (var b = 0; b < nb; b++) {
      var up = r() < 0.55;
      var la2 = up ? lerp(-1.3, -0.5, r()) : las[i] + lerp(0.4, 1.0, r());
      var len = sc * lerp(0.12, 0.24, r()) * (1 - i / nM * 0.35);
      springs.push({ o: 0, v: 0, up: left ? -1 : 1 });
      var sp = springs.length - 1, g = groups.length;
      groups.push({ sp: sp, nodes: [] });
      var segs = 2 + (r() < 0.5 ? 1 : 0), p0 = mains[i];
      for (var s = 0; s < segs; s++) {
        var node = add(p0, M(la2), len / segs * lerp(0.8, 1.2, r()), lerp(sc * 0.014, sc * 0.006, s / segs), 0.15 + 0.15 * s, s === 0 ? sp : undefined, g);
        if (r() < 0.6) {
          var ta = la2 + (r() < 0.5 ? -1 : 1) * lerp(0.4, 0.8, r());
          bloomOn(add(node, M(ta), sc * lerp(0.04, 0.08, r()), sc * 0.004, 0.5, undefined, g));
        }
        bloomOn(node);
        p0 = node; la2 += (r() - 0.5) * 0.35;
      }
    }
  }
  for (i = 3; i < nM; i++) bloomOn(mains[i], 0.6);
  var T = { left: left, idx: idx, bx: bx, by: by, nodes: nodes, springs: springs, blooms: blooms, groups: groups, sc: sc, gust: 0, gustV: 0 };
  T.endW = nodes.map(function (n, j) {
    for (var q = j + 1; q < nodes.length; q++) if (nodes[q].p === j) return nodes[q].w / 2;
    return n.w * 0.3;
  });
  umePose(T, 0, 0);
  return T;
}
function umeBuildAll() {
  WS.branches = []; WS.puffs = []; WS.petals = [];
  for (var idx = WINT.branchCount - 1; idx >= 0; idx--) { WS.branches.push(umeBuild(true, idx)); WS.branches.push(umeBuild(false, idx)); }
  WS.branches.forEach(umeBakeSnow);
}
/* The snow on the branches and on the torii: the shapes from snowheaps.js and torii.js, lit
   by the snow material (snowfield.js): a rounded pillow for every heap, lit pixel by pixel
   like the snowfield (warm in the sun, blue in the shade, darker where it sits on the wood,
   light through its thin edges when the sun is low in front, a fine grain and the odd
   glint). Tuned on snow-lab.html. Each branch piece's snow is drawn once, at its fullest, as
   a small picture in the piece's own frame (x along it, y down into it); umeDraw lays it
   along the piece every frame. Without WebGL 2 the heaps are shaded with a plain fade. */
function winSnowTone(base, n, ao) {                          // the colour of snow facing n, as torii.js works it out
  var L = WL.dir, dl = Math.max(0, n[0] * L[0] + n[1] * L[1] + n[2] * L[2]), sk = (0.6 + 0.4 * n[1]) * WL.amb * ao;
  return [base[0] * (WL.sun[0] * dl + WL.sky[0] * sk), base[1] * (WL.sun[1] * dl + WL.sky[1] * sk), base[2] * (WL.sun[2] * dl + WL.sky[2] * sk)];
}
/* What the snow material needs: the light (in a piece's own frame when given), the snow's values, and the haze. */
function winSnowMat(dir, haze) {
  return { sunDir: dir || WL.dir, sunColour: WL.sun, skyColour: WL.sky, ambient: WL.amb, blue: WINT.blueShade, snow: hexToRgb(WINT.colours.snow),
           grain: WINT.snowGrain, glow: WINT.snowGlow, contact: WINT.snowContact, sparkle: WINT.snowSparkle,
           haze: haze || 0, hazeColour: winLight(hexToRgb(WINT.colours.mist)), seed: WINT.seed };
}
function umeBakeSnow(T) {
  if (!WL) return;
  var C = winCols(), back = T.idx > 0 ? WINT.branchDepth : 0, RS = PR * 1.25, kids = {}, L = WL.dir;
  T.nodes.forEach(function (n) { if (n.p >= 0) kids[n.p] = (kids[n.p] || 0) + 1; });
  var useMat = typeof SnowHeaps !== 'undefined' && typeof Snowfield !== 'undefined' && Snowfield.supported();
  T.snow = T.nodes.map(function (n, i) {
    var ca = Math.cos(n.abs), sa = Math.sin(n.abs), ux0 = Math.abs(ca);
    var hS = (n.w * 0.5 + 1.2 + T.sc * 0.005) * 1.35 * WINT.branchSnow * Math.pow(ux0, 0.8);
    if ((hS < 0.4 && WINT.branchDust <= 0) || n.len < 1) return null;
    var p = { len: n.len, w0: n.w / 2, w1: T.endW[i], sa: n.sa, sb: n.sb, lump: n.lump, sag: n.sag, hS: hS, joins: !!kids[i],
              fork: WINT.branchForks && kids[i] > 1, dust: WINT.branchDust * WINT.branchSnow / 1.22, seed: WINT.seed * 7 + i * 31 + T.idx };
    var sh = SnowHeaps.shape(p), pad = 4 + hS * 0.8;
    var x0 = sh.x0 - pad, y0 = sh.minY - pad, w = sh.x1 - sh.x0 + pad * 2, h = sh.maxY - sh.minY + pad * 2;
    var cnv = document.createElement('canvas');
    cnv.width = Math.max(1, Math.ceil(w * RS)); cnv.height = Math.max(1, Math.ceil(h * RS));
    var c = cnv.getContext('2d');
    c.setTransform(RS, 0, 0, RS, -x0 * RS, -y0 * RS);
    var done = false;
    if (useMat) {
      SnowHeaps.draw(c, sh, p);
      // the light in the piece's own frame: x along it, y up (away from the wood)
      var mx = sa, my = -ca;
      if (my > 0) { mx = -mx; my = -my; }
      var ld = [L[0] * ca + L[1] * -sa, L[0] * mx + L[1] * -my, L[2]], R = Math.max(1, hS * WINT.snowRound) * RS;
      var m = winSnowMat(ld, back * 0.35);
      m.thick = R * WINT.snowRelief;
      var litPic = SnowHeaps.light(cnv, R, m);
      if (litPic) { c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cnv.width, cnv.height); SnowHeaps.put(c, litPic, 0, 0); done = true; }
      else { c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cnv.width, cnv.height); c.setTransform(RS, 0, 0, RS, -x0 * RS, -y0 * RS); }
    }
    if (!done) {                                           // no WebGL 2 (or it is away): a plain fade, top to bottom
      if (hS < 0.4) return null;
      var mistC = winLight(C.mist), top = mixRgb(winSnowTone(C.snow, [0, 1, 0], 1), mistC, back * 0.35), under = mixRgb(winSnowTone(C.snow, [0, -0.3, 0.95], 0.75), mistC, back * 0.35);
      c.beginPath(); c.moveTo(sh.bs[0][0], sh.bs[0][1]);
      SnowHeaps.smoothTo(c, sh.ts, 0, sh.NS); SnowHeaps.smoothTo(c, sh.bs, sh.NS, 0); c.closePath();
      var g = c.createLinearGradient(0, sh.minY, 0, sh.maxY);
      g.addColorStop(0, rgba(top)); g.addColorStop(1, rgba(under));
      c.fillStyle = g; c.fill();
    }
    return { cnv: cnv, x0: x0, y0: y0, w: w, h: h, piv: (n.w / 2 + T.endW[i]) / 2 * 0.8, ux: Math.max(0.05, Math.pow(ux0, 0.8)) };
  });
}
function umePose(T, t, amp) {
  var ns = T.nodes;
  for (var i = 0; i < ns.length; i++) {
    var n = ns[i];
    var sw = (Math.sin(t * n.f + n.ph) * amp + Math.sin(t * 0.37 + n.ph * 0.3) * amp * 0.6 + T.gust) * n.flex;
    if (n.sp >= 0) sw += T.springs[n.sp].o;
    var par = n.p < 0 ? null : ns[n.p];
    n.cur = (par ? par.cur : -PI / 2) + n.rel + sw;
    n.sx = par ? par.ex : T.bx; n.sy = par ? par.ey : T.by;
    n.ex = n.sx + Math.cos(n.cur) * n.len; n.ey = n.sy + Math.sin(n.cur) * n.len;
  }
}
function umeSway(T, t, dt) {
  var wk = winWind();
  T.gustV += (-6 * T.gust - 1.8 * T.gustV) * dt;
  T.gust += T.gustV * dt;
  if (Math.random() < dt * 0.08 * WINT.swayRandom) T.gustV += (Math.random() - 0.5) * 0.12 * WINT.swayRandom;
  for (var s = 0; s < T.springs.length; s++) {
    var B = T.springs[s];
    B.v += (-9 * B.o - 2.2 * B.v) * dt;
    B.o += B.v * dt;
    if (Math.random() < dt * 0.3 * WINT.swayRandom) B.v += (Math.random() - 0.5) * 0.4 * WINT.swayRandom * (0.5 + 0.5 * wk);
  }
  umePose(T, t, 0.02 * wk * WINT.sway);
  var grow = dt * 0.012 * WINT.regrow, ns = T.nodes;
  for (var i = 0; i < ns.length; i++) ns[i].snow = Math.min(WINT.branchSnow, ns[i].snow + grow);
  for (var g = 1; g < T.groups.length; g++) {
    if (Math.abs(T.springs[T.groups[g].sp].v) > 0.45 && Math.random() < dt * 3) umeShed(T, g, 0.4);
  }
}
function umeShed(T, gi, frac) {
  var G = T.groups[gi];
  if (!G || WINT.shedAmount <= 0) return;
  var tot = 0, cx = 0, cy = 0, cn = 0;
  for (var i = 0; i < G.nodes.length; i++) {
    var n = T.nodes[G.nodes[i]];
    if (n.snow < 0.1) continue;
    var dd = Math.min(n.snow, n.snow * frac * lerp(0.7, 1.3, Math.random()));
    n.snow -= dd; tot += dd;
    var cnt = Math.round(clamp(n.len / 6, 2, 14) * dd * 2 * WINT.shedAmount);
    for (var q = 0; q < cnt; q++) {
      var tt = Math.random();
      WS.puffs.push({ x: lerp(n.sx, n.ex, tt), y: lerp(n.sy, n.ey, tt) - n.w * 0.6, vx: (Math.random() - 0.5) * 24, vy: rnd(-10, 8),
                      r: rnd(0.8, 2.6), a: rnd(0.7, 1), life: rnd(2.5, 4.5), age: 0, kind: 0 });
    }
    cx += (n.sx + n.ex) / 2; cy += (n.sy + n.ey) / 2; cn++;
  }
  if (cn && tot > 0.15) {
    for (var c = 0, nc = Math.round(1 + tot * WINT.shedAmount); c < nc; c++) {
      WS.puffs.push({ x: cx / cn + (Math.random() - 0.5) * 30, y: cy / cn, vx: (Math.random() - 0.5) * 12, vy: rnd(10, 25),
                      r: T.sc * lerp(0.04, 0.08, Math.random()), a: 0.5 * Math.min(1, tot) * WINT.shedAmount, life: rnd(1.6, 2.6), age: 0, kind: 1 });
    }
  }
  if (G.sp >= 0) T.springs[G.sp].v += T.springs[G.sp].up * 0.3 * Math.min(1, tot);
}
function umeUpdatePuffs(dt) {
  for (var i = WS.puffs.length - 1; i >= 0; i--) {
    var P = WS.puffs[i];
    P.age += dt;
    if (P.age > P.life || P.y > H + 20) { WS.puffs.splice(i, 1); continue; }
    if (P.kind === 0) { P.vy = Math.min(P.vy + 160 * dt, 85); P.vx += (winFieldAt(P.x) * 90 - P.vx) * (1 - Math.exp(-dt * 1.5)); }
    else { P.vy *= Math.exp(-dt * 1.2); P.r += dt * P.r * 0.5; P.vx += (winFieldAt(P.x) * 60 - P.vx) * (1 - Math.exp(-dt)); }
    P.x += P.vx * dt; P.y += P.vy * dt;
  }
}
function umeBloomPos(T, B) {
  var n = T.nodes[B.node], dx = n.ex - n.sx, dy = n.ey - n.sy, len = Math.hypot(dx, dy) || 1;
  return { x: n.sx + dx * B.t - dy / len * B.off, y: n.sy + dy * B.t + dx / len * B.off, rot: B.rot + (n.cur - n.abs) };
}
function umeUpdatePetals(t, dt) {
  WS.petalTimer -= dt * WINT.petals;
  if (WS.petalTimer <= 0 && WS.branches.length) {
    var T = WS.branches[Math.floor(Math.random() * WS.branches.length)], B = T.blooms[Math.floor(Math.random() * T.blooms.length)];
    if (B && B.kind === 0) {
      var p = umeBloomPos(T, B);
      WS.petals.push({ x: p.x, y: p.y, vx: 0, vy: rnd(14, 24), s: B.size * 0.28, rot: rnd(0, TAU), vr: rnd(-2, 2),
                       f: rnd(1.5, 3), ph: rnd(0, TAU), sw: rnd(12, 26), at: t });
    }
    WS.petalTimer = rnd(1.5, 5);
  }
  for (var i = WS.petals.length - 1; i >= 0; i--) {
    var P = WS.petals[i];
    P.vx += (winFieldAt(P.x) * 120 - P.vx) * (1 - Math.exp(-dt * 1.2));
    P.x += (P.vx + Math.sin(t * 0.9 + P.ph) * P.sw) * dt;
    P.y += P.vy * WINT.fallSpeed * dt;
    P.rot += P.vr * dt;
    if (P.y > H + 20 || P.x < -60 || P.x > W + 60) WS.petals.splice(i, 1);
  }
}
/* A smooth line through the points, from k0 to k1, onto the path P. */
function winSmoothTo(P, pts, k0, k1) {
  var st = k1 > k0 ? 1 : -1;
  for (var k = k0; k !== k1; k += st) P.quadraticCurveTo(pts[k][0], pts[k][1], (pts[k][0] + pts[k + st][0]) / 2, (pts[k][1] + pts[k + st][1]) / 2);
  P.lineTo(pts[k1][0], pts[k1][1]);
}
function umeDraw(c, T) {
  var ns = T.nodes, i, n, b = T.idx > 0 ? 1 : 0;
  c.setTransform(PR, 0, 0, PR, 0, 0);
  c.fillStyle = WS.wood[b];
  c.beginPath();
  for (i = 0; i < ns.length; i++) {
    n = ns[i];
    var w0 = n.w / 2, w1 = T.endW[i];
    var dx = n.ex - n.sx, dy = n.ey - n.sy, len = Math.hypot(dx, dy) || 1, px = -dy / len, py = dx / len;
    c.moveTo(n.sx + px * w0, n.sy + py * w0);
    c.lineTo(n.ex + px * w1, n.ey + py * w1);
    c.lineTo(n.ex - px * w1, n.ey - py * w1);
    c.lineTo(n.sx - px * w0, n.sy - py * w0);
    c.closePath();
  }
  c.fill();
  c.beginPath();
  for (i = 0; i < ns.length; i++) { n = ns[i]; c.moveTo(n.ex + T.endW[i], n.ey); c.arc(n.ex, n.ey, T.endW[i], 0, TAU); }
  c.fill();
  // the bark lit along the side toward the light
  if (WINT.barkLight > 0) {
    c.strokeStyle = WS.woodLit[b]; c.lineCap = 'round';
    var lx = WL.dir[0], ly = -WL.dir[1];
    for (i = 0; i < ns.length; i++) {
      n = ns[i];
      if (n.w < 1.6) continue;
      var ddx = n.ex - n.sx, ddy = n.ey - n.sy, L = Math.hypot(ddx, ddy) || 1, nx = -ddy / L, ny = ddx / L;
      if (nx * lx + ny * ly < 0) { nx = -nx; ny = -ny; }
      var o = n.w * 0.28;
      c.lineWidth = n.w * 0.28;
      c.beginPath(); c.moveTo(n.sx + nx * o, n.sy + ny * o); c.lineTo(n.ex + nx * T.endW[i] * 0.55, n.ey + ny * T.endW[i] * 0.55); c.stroke();
    }
  }
  // the snow: each piece's own picture of its snow (umeBakeSnow), laid along the piece as it sways,
  // its height following how much snow is on it now (it sheds and builds back up)
  if (T.snow) for (i = 0; i < ns.length; i++) {
    n = ns[i];
    var SP = T.snow[i];
    if (!SP || n.snow < 0.03) continue;
    var ex = n.ex - n.sx, ey = n.ey - n.sy, LL = Math.hypot(ex, ey) || 1, ux = ex / LL, uy = ey / LL;
    var mx = uy, my = -ux;
    if (my > 0) { mx = -mx; my = -my; }                    // the side facing up
    var k3 = clamp(n.snow / Math.max(0.01, WINT.branchSnow), 0, 1) * clamp(Math.pow(Math.abs(ux), 0.8) / SP.ux, 0, 1.25);
    if (k3 < 0.05) continue;
    c.setTransform(PR * ux, PR * uy, -PR * mx, -PR * my, PR * n.sx, PR * n.sy);   // x along the piece, y down into it
    c.translate(0, -SP.piv); c.scale(1, k3); c.translate(0, SP.piv);
    c.drawImage(SP.cnv, SP.x0, SP.y0, SP.w, SP.h);
  }
  c.setTransform(PR, 0, 0, PR, 0, 0);
  for (i = 0; i < T.blooms.length; i++) {
    var B = T.blooms[i], p = umeBloomPos(T, B), S0 = WS.blooms[B.spr], k = B.size / UME_S0;
    var cs = Math.cos(p.rot) * k * PR, sn = Math.sin(p.rot) * k * PR;
    c.setTransform(cs, sn, -sn, cs, PR * p.x, PR * p.y);
    c.drawImage(S0.cnv, -S0.half, -S0.half, S0.half * 2, S0.half * 2);
  }
  c.setTransform(PR, 0, 0, PR, 0, 0);
}

/* ============================================================
   14. FALLING SNOW — as in the app (every flake has its own depth),
   now caught by the light: flakes passing in front of the sun glow,
   and after dark the flakes near a lantern are lit warm.
   ============================================================ */
var WIN_LEVELS = 8, WIN_QMAX = 2.4, WIN_R0 = 10;
function winBakeFlakes() {
  var C = winCols(), core = winLight(C.snow), rim = winLight(mixRgb(mixRgb(winLit(C.snow, 0, 0.4, 1, 0), [150, 140, 180], 0.3), C.snow, 0.4)), RS = 2;
  WS.flakeSpr = [];
  for (var i = 0; i < WIN_LEVELS; i++) {
    var b = i / (WIN_LEVELS - 1) * WIN_QMAX * WIN_R0, pad = b * 2.2 + 2;
    var side = Math.ceil((WIN_R0 + pad) * 2 * RS), cnv = document.createElement('canvas');
    cnv.width = cnv.height = side;
    var c = cnv.getContext('2d');
    if (b > 0.05) c.filter = 'blur(' + (b * RS * 0.6).toFixed(2) + 'px)';
    var g = c.createRadialGradient(side / 2, side / 2, 0, side / 2, side / 2, WIN_R0 * RS);
    g.addColorStop(0, rgba(core, 1)); g.addColorStop(0.65, rgba(mixRgb(core, rim, 0.15), 1)); g.addColorStop(1, rgba(rim, 0.9));
    c.fillStyle = g;
    c.beginPath(); c.arc(side / 2, side / 2, WIN_R0 * RS, 0, TAU); c.fill();
    WS.flakeSpr.push({ cnv: cnv, half: side / (2 * RS) });
  }
  var wc = document.createElement('canvas'); wc.width = wc.height = 64;
  var w = wc.getContext('2d'), wg = w.createRadialGradient(32, 32, 0, 32, 32, 32), fl = C.flame;
  wg.addColorStop(0, rgba(mixRgb(fl, [255, 255, 255], 0.5), 1)); wg.addColorStop(0.4, rgba(fl, 0.6)); wg.addColorStop(1, rgba(fl, 0));
  w.fillStyle = wg; w.fillRect(0, 0, 64, 64);
  WS.warmSpr = wc;
  var tc = document.createElement('canvas'); tc.width = tc.height = 64;
  var tt = tc.getContext('2d'), tg2 = tt.createRadialGradient(32, 32, 0, 32, 32, 32), tcol = hexToRgb(WINT.colours.torch);
  tg2.addColorStop(0, rgba(mixRgb(tcol, [255, 255, 255], 0.5), 1)); tg2.addColorStop(0.4, rgba(tcol, 0.6)); tg2.addColorStop(1, rgba(tcol, 0));
  tt.fillStyle = tg2; tt.fillRect(0, 0, 64, 64);
  WS.torchSpr = tc;
}
function winFlake(c, x, y, rad, blurPx) {
  var lv = Math.round(clamp(blurPx / Math.max(0.3, rad) / WIN_QMAX, 0, 1) * (WIN_LEVELS - 1));
  var S0 = WS.flakeSpr[lv], h = S0.half * rad / WIN_R0;
  c.drawImage(S0.cnv, x - h, y - h, h * 2, h * 2);
}
function winNearZ() { return 1 - WINT.frontShare; }
function winMakeFlake(prefill) {
  var z = Math.pow(Math.random(), 1.15);
  return { z: z, x: rnd(-0.1, 1.1) * W, y: prefill ? rnd(-0.05, 0.95) * H : rnd(-30, -8),
           vy: lerp(14, 72, z) * rnd(0.8, 1.2), vx: 0, sw: lerp(4, 22, z) * rnd(0.6, 1.3), sf: rnd(0.5, 1.4), ph: rnd(0, TAU),
           s: rnd(0.75, 1.25), land: Math.random() < WINT.landShare };
}
function winFlakeRad(f) { return lerp(WINT.sizeFar, WINT.sizeNear, Math.pow(f.z, 1.6)) * f.s; }
function winFlakeBlur(f) { return lerp(WINT.farBlur, WINT.nearBlur, Math.pow(f.z, 0.8)); }
function winBackY(f) { var hy = H * WINT.horizon; return hy + (H - hy) * (0.08 + 0.8 * clamp(f.z / winNearZ(), 0, 1)); }
function winUpdateFlakes(t, dt) {
  var F = WS.flakes, nz = winNearZ(), wk = winWind() * winWindDir();
  while (F.length < WINT.flakes) F.push(winMakeFlake(!WS.filled));
  if (F.length > WINT.flakes) F.length = WINT.flakes;
  WS.filled = true;
  for (var i = 0; i < F.length; i++) {
    var f = F[i];
    if (f.fade !== undefined) { f.fade -= dt / 1.2; if (f.fade <= 0) F[i] = winMakeFlake(false); continue; }
    var depth = 0.35 + 0.65 * f.z;
    f.vx += ((winFieldAt(f.x) * 130 + 6 * wk) * depth - f.vx) * (1 - Math.exp(-dt * 1.4));
    f.x += (f.vx + Math.sin(t * f.sf + f.ph) * f.sw * WINT.flakeSway) * dt;
    f.y += f.vy * WINT.fallSpeed * dt;
    if (f.z >= nz) {
      if (f.land && LS.surf && f.y >= winFloorY(f.x)) {
        WS.landed.push({ x: f.x, y: winFloorY(f.x), r: winFlakeRad(f), b: Math.min(winFlakeBlur(f), 0.6), at: t });
        if (WS.landed.length > 200) WS.landed.shift();
        F[i] = winMakeFlake(false);
        continue;
      }
      if (f.y > H + 12) F[i] = winMakeFlake(false);
    } else if (f.y >= winBackY(f)) f.fade = 1;
    if (f.x < -40) f.x += W + 80; else if (f.x > W + 40) f.x -= W + 80;
  }
  for (var j = WS.landed.length - 1; j >= 0; j--) if (t - WS.landed[j].at > WINT.meltTime) WS.landed.splice(j, 1);
  var Bk = WS.bokeh;
  while (Bk.length < WINT.bokeh) Bk.push({ x: rnd(0, W), y: Bk.ready ? rnd(-80, -40) : rnd(0, H), r: rnd(14, 30),
                                       vy: rnd(28, 50), sw: rnd(10, 30), sf: rnd(0.2, 0.5), ph: rnd(0, TAU), a: rnd(0.16, 0.3) });
  if (Bk.length > WINT.bokeh) Bk.length = WINT.bokeh;
  Bk.ready = true;
  for (var b = 0; b < Bk.length; b++) {
    var B = Bk[b];
    B.y += B.vy * WINT.fallSpeed * dt;
    B.x += (winFieldAt(B.x) * 160 + Math.sin(t * B.sf + B.ph) * B.sw) * dt;
    if (B.y > H + 40) { B.y = rnd(-80, -40); B.x = rnd(0, W); }
  }
}
function winDrawFlakes(c, from, to) {
  var F = WS.flakes, bl = WINT.backlight;
  var P = winSunPos(), sunOn = bl > 0 ? P.vis : 0;
  var lamps = bl > 0 ? winNightLights() : 0, LL = WS.lights;
  var tl = WINT.torchFlakes > 0 ? winTorchLevel() : 0, TS = [];
  if (tl > 0) for (var q = 0; q < WS.skiers.length; q++) if (WS.skiers[q].head) { var Sq = winTorchSpot(WS.skiers[q], 0); Sq.r = WS.skiers[q].h; Sq.dir = WS.skiers[q].dir; TS.push(Sq); }
  c.setTransform(PR, 0, 0, PR, 0, 0);
  for (var i = 0; i < F.length; i++) {
    var f = F[i];
    if (f.z < from || f.z >= to) continue;
    var a = lerp(0.45, 0.95, f.z) * (f.fade === undefined ? 1 : f.fade), rad = winFlakeRad(f), blr = winFlakeBlur(f);
    c.globalAlpha = a;
    winFlake(c, f.x, f.y, rad, blr);
    // caught by the light: in front of the sun, or near a lantern after dark
    var g = 0, warm = false;
    if (sunOn > 0) { var ds = Math.hypot(f.x - P.x, f.y - P.y) / (P.R * 9); g = sunOn * Math.exp(-ds * ds) * 0.8; }
    if (lamps > 0) {
      for (var j = 0; j < LL.length; j++) {
        var Lj = LL[j], dl = Math.hypot(f.x - Lj.x, f.y - Lj.y) / (Lj.r * 5);
        if (dl < 1.5) { var gl = lamps * Math.exp(-dl * dl * 2); if (gl > g) { g = gl; warm = true; } }
      }
    }
    if (TS.length) {                                           // lit by a skier's head torch: inside the cone
      var gt = 0;
      for (var j2 = 0; j2 < TS.length; j2++) {
        var T2 = TS[j2], fx = (f.x - T2.x) * T2.dir;
        if (fx < 0 || fx > T2.d0 * 1.45) continue;
        var u2 = fx / (T2.d0 * 1.2), cy = lerp(T2.y, T2.gy, Math.min(1, u2)), half = (T2.r * 0.05 + fx * 0.4 * WINT.torchWidth) + 2;
        var off = Math.abs(f.y - cy) / half;
        if (off < 1) gt = Math.max(gt, tl * WINT.torchFlakes * (1 - off * off) * (1 - u2 * 0.5));
      }
      if (gt > 0.03) {
        var tr = (rad + blr) * 1.8;
        c.globalCompositeOperation = 'lighter';
        c.globalAlpha = clamp(gt * a, 0, 1);
        c.drawImage(WS.torchSpr, f.x - tr, f.y - tr, tr * 2, tr * 2);
        c.globalCompositeOperation = 'source-over';
      }
    }
    if (g * bl > 0.03) {
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = clamp(g * bl * a, 0, 1);
      var rr = (rad + blr) * 1.6;
      if (warm) c.drawImage(WS.warmSpr, f.x - rr, f.y - rr, rr * 2, rr * 2);
      else winFlake(c, f.x, f.y, rad * 1.2, blr + 1);
      c.globalCompositeOperation = 'source-over';
    }
  }
  c.globalAlpha = 1;
}
function winDrawBack(c, t) {
  if (!WS.flakeSpr.length) return;
  winDrawFlakes(c, -1, winNearZ());
  for (var i = 0; i < WS.branches.length; i++) umeDraw(c, WS.branches[i]);
  c.setTransform(PR, 0, 0, PR, 0, 0);
  for (i = 0; i < WS.puffs.length; i++) {
    var P = WS.puffs[i], k = P.age / P.life, a = P.a * (k < 0.15 ? k / 0.15 : 1 - Math.pow((k - 0.15) / 0.85, 1.5));
    c.globalAlpha = clamp(a, 0, 1);
    if (P.kind === 1) c.drawImage(LS.MIST.cnv, P.x - P.r, P.y - P.r * 0.7, P.r * 2, P.r * 1.4);
    else winFlake(c, P.x, P.y, P.r, 0.4);
  }
  for (i = 0; i < WS.petals.length; i++) {
    var Q = WS.petals[i], fl = Math.cos(t * Q.f + Q.ph);
    c.setTransform(PR, 0, 0, PR, PR * Q.x, PR * Q.y);
    c.rotate(Q.rot); c.scale(fl, 1);
    c.globalAlpha = clamp((t - Q.at) / 0.4, 0, 1);
    c.fillStyle = fl > 0 ? WS.petal : WS.petalDk;
    c.beginPath(); winEllipse(c, 0, 0, Q.s, Q.s * 0.8); c.fill();
  }
  c.globalAlpha = 1;
  c.setTransform(PR, 0, 0, PR, 0, 0);
}
function winDrawLanded(c, t) {
  if (!WS.flakeSpr.length) return;
  for (var i = 0; i < WS.landed.length; i++) {
    var L = WS.landed[i], k = (t - L.at) / WINT.meltTime;
    c.globalAlpha = clamp(k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4, 0, 1) * 0.95;
    c.save(); c.translate(L.x, L.y); c.scale(1, 0.6);
    winFlake(c, 0, 0, L.r * lerp(1, 0.55, k), L.b);
    c.restore();
  }
  c.globalAlpha = 1;
}
function winDrawNear(c) {
  if (!WS.flakeSpr.length) return;
  winDrawFrontSkiers(c, lastT);
  winDrawFlakes(c, winNearZ(), 2);
  c.setTransform(PR, 0, 0, PR, 0, 0);
  for (var i = 0; i < WS.bokeh.length; i++) { var B = WS.bokeh[i]; c.globalAlpha = B.a; winFlake(c, B.x, B.y, B.r, B.r * WIN_QMAX); }
  c.globalAlpha = 1;
}


/* ---------- each frame ---------- */
function winReset() {
  WS.bKey = ''; WS.branches = []; WS.puffs = []; WS.petals = []; WS.flakes = []; WS.filled = false;
  WS.landed = []; WS.bokeh = []; WS.gusts = []; WS.sparkles = []; WS.tracks = []; WS.powder = []; WS.lights = [];
  WS.skiers = []; WS.slabs = []; WS.swells = []; WS.dots = null; WS.retry = false;
  winDust = [];
  if (WIN_MTN.job) { WIN_MTN.job.cancel(); WIN_MTN.job = null; }
}
/* The light-dependent sprites (blossoms and the snow on the branches, flakes), baked with the
   landscape; the branches themselves only when the screen size changes. */
function winBakeSprites() {
  umeBakeBlooms();
  winBakeFlakes();
  var key = W + 'x' + H;
  if (WS.bKey !== key) { WS.bKey = key; umeBuildAll(); }
}
/* Bake the whole scene again on the next frame (the light is unchanged). */
function winForceRebake() { LS.key = ''; LS.at = -1e9; }
/* Once a second: a WebGL context was lost (and is back), a picture came out blank, or (every
   3 s) a kept picture was wiped: the scene is baked again. */
function winCheck(t) {
  if (t < WS.checkAt || LS.step) return;
  WS.checkAt = t + 1;
  var mOk = typeof Mountains === 'undefined' || !Mountains.state || Mountains.state() !== 'lost';
  var sOk = typeof Snowfield === 'undefined' || !Snowfield.state || Snowfield.state() !== 'lost';
  if (!mOk || !sOk) return;                                 // still away: wait
  var lostSince = (WIN_MTN.is3d && WIN_MTN.loss !== undefined && Mountains.losses && Mountains.losses() !== WIN_MTN.loss) ||
                  (WS.sfLoss !== undefined && Snowfield.losses && Snowfield.losses() !== WS.sfLoss);
  if (WS.retry || lostSince) { WS.retry = false; winForceRebake(); return; }
  if (t < WS.wipeAt) return;
  WS.wipeAt = t + 3;
  var SL = WS.slabs[WS.slabs.length - 1];
  if ((WIN_MTN.is3d && winBlankRow(LS.SCN, (H * WINT.horizon - H * 0.02) * LAND_SR)) || (SL && SL.cnv.height > 2 && winBlankRow(SL, SL.cnv.height - 2))) winForceRebake();
}
function winUpdate(dt, t) {
  if (!LS.ready || !WS.flakeSpr.length) return;
  if (!LS.step && t > (WS.lightAt || 0)) { WS.lightAt = t + 2; WL = winSceneLight(); }   // the lights, torches and dust follow the light now
  winUpdateGusts(dt);
  winUpdateField(t);
  for (var i = 0; i < WS.branches.length; i++) umeSway(WS.branches[i], t, dt);
  umeUpdatePuffs(dt);
  umeUpdatePetals(t, dt);
  winUpdateFlakes(t, dt);
  winUpdateSkiers(t, dt);
  winUpdateDust(t, dt);
  winCheck(t);
}
/* #dynBack, after the landscape: the glints on the snow and the diamond dust in the air. */
function winDrawSparkles(c, t) {
  if (!LS.ready || !WL) return;
  winDrawGlints(c, t);
  winDrawDust(c, t);
}

/* ============================================================
   9. CANVAS, SPAWNING, MAIN LOOP
   ============================================================ */
/* ============================================================
   9. CANVASES, SPAWNING, MAIN LOOP
   Three canvases (see index.html and main.css):
     #dynBack    behind everything (z -1): sky, sun, moon, far leaves and
                 snow, trees, snowman, fog, rain
     #dynGround  a short strip along the bottom edge ABOVE the page content
                 (z 8): the near snow bank and the pile of fallen leaves, so
                 text and the table scroll in behind them. The summary bar
                 (z 50) still covers it.
     #dynFront   full screen above the message text (z 10): the nearest
                 leaves and flakes, the cricket and fireflies on
                 the characters. It fades out on the table and thank-you
                 pages.
   ============================================================ */
var cvSky = document.getElementById('dynSky');      // the sky colour only (see dynPrelude)
var cvBack = document.getElementById('dynBack');
var cvGround = document.getElementById('dynGround');
var cvFront = document.getElementById('dynFront');
var cvNear = document.getElementById('dynNear');
var dynVeil = document.getElementById('dynVeil');
var ctx = cvBack ? cvBack.getContext('2d') : null;
var ctxSky = cvSky ? cvSky.getContext('2d') : null;
var SKY_RES = 0.25;                          // the sky is smooth gradients: a quarter-size canvas, stretched
var ctxG = cvGround ? cvGround.getContext('2d') : null;
var ctxF = cvFront ? cvFront.getContext('2d') : null;
var ctxN = cvNear ? cvNear.getContext('2d') : null;
var treeLayer = document.createElement('canvas');
var ctxT = treeLayer.getContext('2d');
var farLayer = document.createElement('canvas');          // half-size layer for the far tree
var ctxFar = farLayer.getContext('2d');
var W = 0, H = 0, GH = 150;                  // GH: height (CSS px) of the ground strip
var drawOffsetY = 0, dynFrontMul = 0;
function resize() {
  W = window.innerWidth; H = window.innerHeight;
  PR = (window.devicePixelRatio || 1) * S.renderScale;
  var cw = Math.round(W * PR), ch = Math.round(H * PR);
  cvBack.width = cvFront.width = cvNear.width = treeLayer.width = koyoLeafLayer.width = birdLayer.width = birdSlotLayer.width = cw;
  cvBack.height = cvFront.height = cvNear.height = treeLayer.height = koyoLeafLayer.height = birdLayer.height = birdSlotLayer.height = ch;
  farLayer.width = farBranchLayer.width = Math.ceil(cw * FAR_LAYER_SCALE);
  farLayer.height = farBranchLayer.height = Math.ceil(ch * FAR_LAYER_SCALE);
  cvGround.width = cw;
  cvGround.height = Math.round(GH * PR);
  cvSky.width = Math.max(1, Math.round(W * PR * SKY_RES));
  cvSky.height = Math.max(1, Math.round(H * PR * SKY_RES));
  skyTimer = 0;
  lookVersion++;
}

var flurryQueue = [];
var heroNext = 0;
var GUST_MORE = 1 / 0.6;     // gusts (which blow leaves off the ground) come with a 40% shorter interval
function spawnRate(t) {
  var timeMul = { night: 0.5, dawn: 0.8, morning: 1, day: 1.2, golden: 1.05, dusk: 0.9 }[ENV.phase] || 1;
  var weatherMul = 1 + ENV.windMs / 6;
  if (ENV.rainy) weatherMul *= 1.1;
  if (S.condition === 'snow') weatherMul *= 0.5;
  var lull = 1 - S.lulls * smooth(0.55, 0.85, noise1(t / 18 + 7.3));
  return 1.1 * S.density * timeMul * weatherMul * lull;
}
function spawnTick(dt, t) {
  var rate = spawnRate(t);
  var n = rate * dt;
  while (n > 0) { if (Math.random() < n) spawnLeaf(); n -= 1; }
  // The rest of the kōyō leaves drop from the trees (KOYO.fallTop come from the top).
  if (ENV.scene !== 'winter' && leaves.length < S.maxLeaves) {
    var m = rate * (1 - KOYO.fallTop) / KOYO.fallTop * dt;
    while (m > 0) { if (Math.random() < m) dropKoyoLeaf(Math.random() < 0.7 || !farTree ? tree : farTree); m -= 1; }
  }
  if (Math.random() < S.flurries * 0.06 * dt * S.density) {
    var x0 = Math.random() * W, k = 3 + Math.floor(Math.random() * 4);
    for (var i = 0; i < k; i++) flurryQueue.push({ at: t + Math.random() * 1.5, x: x0 + rnd(-80, 80) });
  }
  for (var j = flurryQueue.length - 1; j >= 0; j--) {
    if (flurryQueue[j].at <= t) {
      spawnLeaf({ x: flurryQueue[j].x - ENV.windPx * 2, y: -40 - Math.random() * 30 });
      flurryQueue.splice(j, 1);
    }
  }
  if (Math.random() < S.gustiness * (0.012 + ENV.windMs * 0.008) * GUST_MORE * dt) startGust(false);
  if (S.condition === 'thunderstorm' && S.lightning) {
    if (lightningNext === 0) lightningNext = t + rnd(8, 25);
    if (t > lightningNext) { strikeLightning(); lightningNext = t + rnd(8, 25); }
  }
  if (S.heroLeaf && !hero && ENV.scene !== 'winter') {
    if (heroNext === 0) heroNext = t + S.heroEvery * 60 * rnd(0.6, 1.4);
    if (t > heroNext) { sendHero(); heroNext = t + S.heroEvery * 60 * rnd(0.6, 1.4); }
  }
}
function sendHero() {
  hero = makeLeaf({ hero: true, z: 1.35 });
  hero.x = W * rnd(0.15, 0.85);
  hero.y = -hero.size * 1.3;
  setMode(hero, 'flutter');
  hero.swayAmp = rnd(60, 110) * S.sway;
  hero.sf = rnd(0.9, 1.3);
  bakeLeaf(hero);
}

function leafAlpha(L, t) {
  var zc = clamp(L.z, 0, 1);
  var a = L.hero ? 0.6 : (L.solid ? 1 : (isFrontLeaf(L) ? S.frontLeafOpacity : lerp(S.farOpacity, S.nearOpacity, zc)));
  a *= Math.min(1, L.age / (L.fadeDur || 0.6));
  if (L.fade !== undefined) a *= Math.max(0, L.fade);   // settling into the far ground (8c)
  if (L.solid || (isFrontLeaf(L) && S.frontLeafOpacity >= 1)) return clamp(a, 0, 1);   // full strength: no fog or sun dimming
  if (!L.hero) a *= 1 - ENV.fog * (1 - zc) * 0.6;
  if (ENV.sunAmt > 0.05 && S.sunFlicker > 0) a *= 1 - S.sunFlicker * 0.35 * ENV.sunAmt * noise1(L.x * 0.004 + t * 0.8 + (L.seed % 100));
  return clamp(a, 0, 1);
}
function isFrontLeaf(L) { return !!L.front && S.frontLeaves > 0; }
function drawLeaf(L, t, inPile, target) {
  if (!L.spr) return;
  var g = target || ctx;
  var sx, sy, rot = L.rot, x = L.x + (inPile ? 0 : L.so), y = L.y, spr, shdA = 0;
  if (inPile) {
    var k = L.st === undefined ? 1 : clamp((t - L.st) / 0.45, 0, 1);
    k = k * k * (3 - 2 * k);                      // just landed: settling flat
    if (k >= 1) L.st = undefined;
    sx = k < 1 ? lerp(L.sx0, L.pileSx, k) : L.pileSx;
    sy = k < 1 ? lerp(L.sy0, L.pileSy, k) : L.pileSy;
    if (k < 1) y = lerp(L.y0, L.y, k);
    rot += (L.wob || 0) * LAND.tremble * ((L.kick || 0) + 0.03 * Math.min(2, ENV.windMs / 3) * Math.sin(t * 1.7 + (L.wph || 0)));
    spr = L.pileFace ? L.spr : L.back;
    shdA = L.shd ? k : 0;
  } else {
    var f = Math.min(1, S.flip3d), c = Math.cos(L.phi);
    sx = lerp(1, c, f);
    if (Math.abs(sx) < 0.06) sx = sx < 0 ? -0.06 : 0.06;
    sy = 1 - 0.18 * f * (0.5 + 0.5 * Math.sin(L.phi * 0.7 + (L.seed % 10)));
    spr = c >= 0 || f < 0.05 ? L.spr : L.back;
    if (L.liftT !== undefined) {                  // just lifted: from how it lay into its falling shape
      var kl = clamp((t - L.liftT) / 0.35, 0, 1);
      sx = lerp(L.pileSx, sx, kl); sy = lerp(L.pileSy, sy, kl);
      shdA = L.shd ? 1 - kl : 0;
      if (kl >= 1) L.liftT = undefined;
    }
  }
  var cs = Math.cos(rot), sn = Math.sin(rot);
  g.setTransform(cs * sx * PR, sn * sx * PR, -sn * sy * PR, cs * sy * PR, x * PR, (y - drawOffsetY) * PR);
  var a = inPile && !L.solid ? leafAlpha(L, t) * 0.95 : leafAlpha(L, t);
  g.globalAlpha = a;
  g.drawImage(spr, -L.hs, -L.hs, L.hs * 2, L.hs * 2);
  if (shdA > 0.01) {                              // its soft shadow on the text and table below
    g.globalAlpha = a * shdA;
    g.drawImage(L.shd, -L.hs, -L.hs, L.hs * 2, L.hs * 2);
  }
}


var lastT = 0, envTimer = 0, clockTimer = 0, barTimer = 0, lastLookKey = '';
var rebakeIdx = 0, lastScene = '', frontLeafCount = 0;
var dynNearMul = 0, nearCleared = true;
var dynMaster = 0, dynScrollY = 0, dynLastMs = 0, dynBegun = false, _lastPanel = -1;
var skyMaster = 0, skyTimer = 0;
var dynReduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

function lookKey() {
  var Lt = ENV.light;
  return [Math.round(Lt.amt * 40), Math.round(Lt.dark * 40), Lt.col.map(function(v) { return Math.round(v / 12); }).join('.'),
          Math.round(ENV.wet * 10), Math.round(ENV.frost * 10), Math.round(ENV.fog * 20), Math.round(ENV.season * 40)].join('|');
}


/* Nagoya clock, once a second. */
function advanceClock() {
  var n = tokyoNow();
  S.hour = n.hour; S.date = n.date;
}

var prefillLeft = 0, dynSetupLeft = false;
function prefill(later) {
  prefillLeft = Math.min(S.maxLeaves * 0.6, spawnRate(0) * 25);
  if (!later) prefillSome(Infinity);
}
function prefillSome(max) {
  for (var i = 0; i < max && prefillLeft > 0; i++, prefillLeft--) spawnLeaf({ prefill: true });
}

/* Past the intro (the same flag the ambient sound uses), a warm theme, the
   page visible, and not on the games page. */
function dynIntroDone() {
  return typeof mapleLeaves !== 'undefined' && !!mapleLeaves && mapleLeaves.classList.contains('active');
}
function dynWantsToRun() {
  if (dynReduceMotion || document.hidden) return false;
  if (typeof currentTheme !== 'string' || (currentTheme !== 'autumn' && currentTheme !== 'winter')) return false;
  return dynIntroDone() && !document.body.classList.contains('games-active');
}
/* The nearest leaves: 1 everywhere, the table included, and 0 only on the
   thank-you pages and the receipt. */
function dynNearTarget() {
  var cl = document.body.classList;
  return (cl.contains('thankyou-active') || cl.contains('receipt-locked')) ? 0 : 1;
}
/* 1 on the message panels, fading to 0 as the page scrolls to the table, and 0
   on the thank-you pages and the receipt (the same rule for all of them). */
function dynFrontTarget() {
  var cl = document.body.classList;
  if (cl.contains('thankyou-active') || cl.contains('receipt-locked')) return 0;
  return 1 - smooth(20, 160, dynScrollY);
}

/* lazy (during the name): the trees' clumps and the first leaves are left for
   dynSetupStep to do a few per frame. */
function dynBegin(lazy) {
  resize();
  advanceClock();
  computeEnv();
  ensureTree(lazy);
  lastScene = ENV.scene;
  lastLookKey = lookKey();
  if (ENV.scene !== 'winter') { prefill(lazy); if (lazy) dynSetupLeft = true; }
  dynBegun = true;
}
/* One frame's share of the work dynBegin(true) left: the landscape first (a
   part per frame, then the fallen leaves ten at a time), then the first
   leaves, then the tree clumps (about 8 ms a frame). still: the name is
   standing still, so a long frame does not show and each frame does more
   (all the fallen leaves, all the first leaves, about 50 ms of clumps). */
function dynSetupStep(t, still) {
  if (ENV.scene === 'autumn' || ENV.scene === 'winter') {
    if (!LS.ready || LS.step || (ENV.scene === 'autumn' && !LS.floorBuilt)) { updateLandscape(t, still ? undefined : 10); return; }
  }
  if (!dynSetupLeft) return;
  if (prefillLeft > 0) { prefillSome(still ? Infinity : 6); return; }
  if (bakePendingClumps(still ? 50 : 8)) { ensureBamboo(); dynSetupLeft = false; }
}
/* The scene would show, but the name's setup is not finished (a slow
   moment): it carries on a little per frame and the scene's fade-in waits,
   for at most 1.5 s; then whatever is left is done at once. True while
   waiting. */
var dynHoldUntil = 0;
function dynHoldForSetup(t) {
  if (!dynSetupLeft) { dynHoldUntil = 0; return false; }
  if (!dynHoldUntil) dynHoldUntil = t + 1.5;
  if (t < dynHoldUntil) { dynSetupStep(t); return true; }
  dynFinishSetup();
  dynHoldUntil = 0;
  return false;
}
function dynFinishSetup() {
  prefillSome(Infinity);
  bakePendingClumps(Infinity);
  ensureBamboo();
  dynSetupLeft = false;
}
/* Back at the start screen: forget everything and clear the canvases (the
   sky colour stays: the koi screen shows it). */
function dynReset() {
  leaves.length = 0; pile.length = 0; hero = null; gusts.length = 0; flurryQueue.length = 0;
  streaks.length = 0; splashes.length = 0; flakes.length = 0; flocks.length = 0; specks.length = 0; flockNext = 0;
  cricket = null; tree = null; farTree = null; frontLeafCount = 0; heroNext = 0;
  bambooGroves = []; bambooKey = '';
  LS.ready = false; LS.key = ''; LS.step = 0; LS.floorBuilt = false; LS.bedN = 0; TOR.ready = false;
  prefillLeft = 0; dynSetupLeft = false; dynHoldUntil = 0;
  winReset();
  [ctx, ctxG, ctxF, ctxN].forEach(function(c) { c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, c.canvas.width, c.canvas.height); });
  dynBegun = false;
}
function dynApplyOpacity() {
  cvSky.style.opacity = skyMaster.toFixed(3);
  cvBack.style.opacity = dynMaster.toFixed(3);
  cvGround.style.opacity = dynMaster.toFixed(3);
  cvFront.style.opacity = (dynMaster * dynFrontMul).toFixed(3);
  cvNear.style.opacity = (dynMaster * dynNearMul).toFixed(3);
}

/* The time-of-day sky colour on its own quarter-size canvas. It changes
   slowly, so it is repainted every two seconds (or after a resize). */
function updateSkyLayer(dt, t) {
  skyTimer -= dt;
  if (skyTimer > 0) return;
  skyTimer = 2;
  ctxSky.setTransform(1, 0, 0, 1, 0, 0);
  ctxSky.globalAlpha = 1;
  ctxSky.clearRect(0, 0, cvSky.width, cvSky.height);
  ctxSky.setTransform(PR * SKY_RES, 0, 0, PR * SKY_RES, 0, 0);
  drawSky(ctxSky, t);
}
/* The koi screen and the name animation, before the message panels. Only the
   time-of-day sky colour shows, so the session starts on the evening or night
   sky and nothing changes colour later; the sun and moon, trees, leaves and
   landscape still wait for the message panels (dynWantsToRun). The setup
   screen before the koi keeps the plain palette. On the games page the scene
   fades out but the sky colour stays, so the colour doesn't jump there. */
function dynNaming() {
  return typeof introOverlay !== 'undefined' && !!introOverlay && introOverlay.classList.contains('active');
}
function dynSkyWanted() {
  if (dynReduceMotion || document.hidden) return false;
  if (typeof currentTheme !== 'string' || (currentTheme !== 'autumn' && currentTheme !== 'winter')) return false;
  // the games page keeps the sky colour too (only the scene fades out there)
  var koi = typeof blossomScreen !== 'undefined' && !!blossomScreen && blossomScreen.classList.contains('visible');
  return dynIntroDone() || koi || dynNaming();
}
function dynPrelude(dt, t, skyWant) {
  skyMaster += ((skyWant ? 1 : 0) - skyMaster) * (1 - Math.exp(-dt * 2.2));
  var naming = dynNaming();
  if (dynBegun && !naming && !dynIntroDone()) dynReset();   // back at the koi screen: the scene starts afresh next time
  if (skyWant) {
    clockTimer -= dt;
    if (clockTimer <= 0) { advanceClock(); clockTimer = 1; }
    envTimer -= dt;
    if (envTimer <= 0) { computeEnv(); envTimer = 0.25; if (dynBegun) ensureTree(naming); }
    // During the name the scene is set up and the landscape baked, so that work
    // is done before it shows (not on the koi screen, where it could make the
    // koi stutter while someone touches the water). It is spread out, one small
    // part per frame, so the name animation does not stutter either.
    // Nothing heavy while the characters are still arriving: it waits until
    // they have landed and the name stands still.
    var nowMs = performance.now();
    if (naming && nowMs >= nameLandsAt) {
      if (!dynBegun) dynBegin(true);
      else dynSetupStep(t, nowMs < nameLeavesAt);
    }
    updateSkyLayer(dt, t);
  }
  dynApplyOpacity();
}
function dynStep(dt, t, want, skyWant) {
  var hold = want && dynBegun && dynHoldForSetup(t);
  dynMaster += ((want && !hold ? 1 : 0) - dynMaster) * (1 - Math.exp(-dt * 2.2));
  skyMaster += ((skyWant ? 1 : 0) - skyMaster) * (1 - Math.exp(-dt * 2.2));
  if (!want || hold) { dynApplyOpacity(); return; }
  if (!dynBegun) dynBegin();
  updateSkyLayer(dt, t);

  dynScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
  dynFrontMul += (dynFrontTarget() - dynFrontMul) * (1 - Math.exp(-dt * 3));
  dynNearMul += (dynNearTarget() - dynNearMul) * (1 - Math.exp(-dt * 3));

  clockTimer -= dt;
  if (clockTimer <= 0) { advanceClock(); clockTimer = 1; }
  barTimer -= dt;
  if (barTimer <= 0) { measureInfoBar(); updateToolbarLight(); if (ENV.scene === 'winter') winMeasureDots(); barTimer = 0.5; }
  if (typeof currentPanel !== 'undefined' && currentPanel !== _lastPanel) {   // a new message panel: insects leave the old text
    _lastPanel = currentPanel;
    insectsLeaveText();
    _glyphsReadyAt = performance.now() + 1800;
  }
  envTimer -= dt;
  if (envTimer <= 0) {
    computeEnv();
    envTimer = 0.25;
    var k = lookKey();
    if (k !== lastLookKey) { lastLookKey = k; lookVersion++; }
    if (ENV.scene !== lastScene) {           // theme toggled between autumn and winter
      LS.ready = false; LS.step = 0; TOR.ready = false;   // the other scene's landscape is baked afresh
      if (ENV.scene === 'winter') { leaves.length = 0; pile.length = 0; hero = null; LS.floorBuilt = false; LS.bedN = 0; }
      else if (lastScene === 'winter') { winReset(); prefill(); }
      cloudsForTheme();                        // each theme has its own kinds of cloud
      tree = null; farTree = null;
      lastScene = ENV.scene;
    }
    ensureTree();
  }

  updateLandscape(t);
  spawnTick(dt, t);
  updateGusts(dt);
  var nFront = 0;
  for (var i = leaves.length - 1; i >= 0; i--) {
    var L = leaves[i];
    if (L.fade !== undefined) {                   // on the far ground: comes to rest and fades into the carpet
      var damp = Math.exp(-dt * 5);
      L.vx *= damp; L.vy *= damp; L.so *= damp;
      L.x += L.vx * dt; L.y += L.vy * dt;
      L.fade -= dt / 1.8;
      if (L.fade <= 0) leaves.splice(i, 1);
      continue;
    }
    updateLeaf(L, dt, t);
    if (isFrontLeaf(L)) nFront++;
    if (ENV.scene === 'autumn' && LS.ready) {
      if (isFrontLeaf(L)) {                       // in front of the text and table: lands on the near band
        if (L.land === undefined) { L.land = Math.random() < LAND.landShare; L.gy = rnd(2, LAND.bedDepth); }
        if (S.pile && L.land && L.vy > 0 && L.y >= floorY(L.x, L.gy)) {
          leaves.splice(i, 1);
          settleLeaf(L, t);
          continue;
        }
      } else if (L.vy > 0 && L.y >= backGroundY(L)) L.fade = 1;   // behind the content: settles on the far ground
    }
    if (L.y > H + L.size * 1.5 || L.y < -H * 0.3 - 200 || L.x < -W * 0.4 - 200 || L.x > W * 1.4 + 200) leaves.splice(i, 1);
  }
  for (var pk = 0; pk < pile.length; pk++) if (pile[pk].kick) pile[pk].kick *= Math.exp(-dt * 3);
  frontLeafCount = nFront;
  if (hero) {
    updateLeaf(hero, dt, t);
    if (hero.y > H + hero.size * 1.5 || hero.x < -400 || hero.x > W + 400) hero = null;
  }
  updateRain(dt);
  updateGlassRain(dt);
  updateSnow(dt, t);
  updateBirds(dt, t);
  updateSpecks(dt, t);
  updateTree(dt, t);
    if (ENV.scene === 'winter') winUpdate(dt, t);
  updateCricket(dt, t);
  if (dynFrontMul < 0.05 && cricket) { cricket = null; insectsLeaveText(); }

  // re-draw a few leaf sprites per frame when the look changed
  var budget = 10, all = leaves.concat(pile);
  if (hero) all.push(hero);
  for (var b = 0; b < all.length && budget > 0; b++) {
    var Lb = all[(rebakeIdx + b) % all.length];
    if (Lb.bakedV !== lookVersion || Lb.geomV !== geomVersion) { bakeLeaf(Lb); budget--; }
  }
  rebakeIdx = all.length ? (rebakeIdx + 10) % all.length : 0;

  if (ENV.scene === 'autumn') buildKoyoLayers(t);   // the trees' layers first: the fireworks are cut out behind them
  fireworksUpdate(dt, t);

  // ---- back canvas ----
  drawOffsetY = 0;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.clearRect(0, 0, cvBack.width, cvBack.height);
  ctx.setTransform(PR, 0, 0, PR, 0, 0);
  fireworksDrawDark(ctx);
  ctx.setTransform(PR, 0, 0, PR, 0, 0);
  drawSun(ctx, t);
  drawMoon(ctx, t);
  drawLandscape(ctx, dt);
  if (ENV.scene === 'winter') winDrawSparkles(ctx, t);
  drawCloudShadows(ctx, dt);
  drawRays(ctx, t);
  var split = 0;
  while (split < leaves.length && leaves[split].z < 0.5) split++;
  for (var f = 0; f < split; f++) if (!isFrontLeaf(leaves[f])) drawLeaf(leaves[f], t, false);
  ctx.setTransform(PR, 0, 0, PR, 0, 0); ctx.globalAlpha = 1;
  drawSnow(ctx, 'far');
  drawTree(ctx, t);
  drawFog(ctx, dt);
  if (ENV.scene === 'winter') winDrawBack(ctx, t);
  for (var n = split; n < leaves.length; n++) if (!isFrontLeaf(leaves[n])) drawLeaf(leaves[n], t, false);
  ctx.setTransform(PR, 0, 0, PR, 0, 0); ctx.globalAlpha = 1;
  drawSnow(ctx, 'near');
  drawRain(ctx);
  drawGlassRain();
  drawSpecks(ctx, t, false);

  var flashA = 0;
  for (var q = flashes.length - 1; q >= 0; q--) {
    var age = t - flashes[q].at;
    if (age < 0) continue;
    if (age > 0.4) { flashes.splice(q, 1); continue; }
    flashA = Math.max(flashA, flashes[q].a * (1 - age / 0.4));
  }
  if (flashA > 0) { ctx.fillStyle = 'rgba(255,255,255,' + flashA.toFixed(3) + ')'; ctx.fillRect(0, 0, W, H); }
  if (dynVeil) dynVeil.style.opacity = (flashA * 0.35 * dynMaster).toFixed(3);

  // ---- ground strip: the near band and what lies on it, above the page content ----
  drawOffsetY = H - GH;
  ctxG.setTransform(1, 0, 0, 1, 0, 0);
  ctxG.globalAlpha = 1;
  ctxG.clearRect(0, 0, cvGround.width, cvGround.height);
  ctxG.setTransform(PR, 0, 0, PR, 0, -(H - GH) * PR);
  for (var p = 0; p < pile.length; p++) drawLeaf(pile[p], t, true, ctxG);
  drawOffsetY = 0;
  if (ENV.scene === 'autumn') {
    ctxG.setTransform(PR, 0, 0, PR, 0, -(H - GH) * PR);
    ctxG.globalAlpha = 1;
    landGlow(ctxG, H);
    drawNearBand(ctxG);
  } else if (ENV.scene === 'winter') {
    ctxG.setTransform(PR, 0, 0, PR, 0, -(H - GH) * PR);
    winDrawLanded(ctxG, t);
    drawNearBand(ctxG);
  }

  // ---- front canvas: only while it is visible ----
  if (dynFrontMul > 0.01) {
    ctxF.setTransform(1, 0, 0, 1, 0, 0);
    ctxF.clearRect(0, 0, cvFront.width, cvFront.height);
    ctxF.setTransform(PR, 0, 0, PR, 0, 0);
    drawSnow(ctxF, 'front');
    if (hero) drawLeaf(hero, t, false, ctxF);
    ctxF.setTransform(PR, 0, 0, PR, 0, 0); ctxF.globalAlpha = 1;
    drawSpecks(ctxF, t, true);
    drawCricket(ctxF, t);
    frontCleared = false;
  } else if (!frontCleared) {
    ctxF.setTransform(1, 0, 0, 1, 0, 0);
    ctxF.clearRect(0, 0, cvFront.width, cvFront.height);
    frontCleared = true;
  }
  // ---- near canvas: the nearest falling leaves (or flakes), on the table too ----
  if (dynNearMul > 0.01) {
    ctxN.setTransform(1, 0, 0, 1, 0, 0);
    ctxN.clearRect(0, 0, cvNear.width, cvNear.height);
    ctxN.setTransform(PR, 0, 0, PR, 0, 0);
    for (var nl = 0; nl < leaves.length; nl++) if (isFrontLeaf(leaves[nl])) drawLeaf(leaves[nl], t, false, ctxN);
    if (ENV.scene === 'winter') winDrawNear(ctxN);
    ctxN.setTransform(PR, 0, 0, PR, 0, 0); ctxN.globalAlpha = 1;
    nearCleared = false;
  } else if (!nearCleared) {
    ctxN.setTransform(1, 0, 0, 1, 0, 0);
    ctxN.clearRect(0, 0, cvNear.width, cvNear.height);
    nearCleared = true;
  }
  dynApplyOpacity();
}
var frontCleared = true;

/* rAF while running; a slow poll while idle (start screen, sakura theme,
   games page, hidden tab) so nothing is drawn or kept busy. At most 60
   frames a second (the tablet is 120Hz), and about 30 while scrolling, as the
   music display also holds back its drawing during a scroll. */
function dynLoop(ms) {
  var want = dynWantsToRun(), skyWant = want || dynSkyWanted();
  if (!skyWant && dynMaster < 0.01 && skyMaster < 0.01) {
    if (dynBegun && !dynIntroDone()) dynReset();
    dynLastMs = 0;
    setTimeout(function() { requestAnimationFrame(dynLoop); }, 250);
    return;
  }
  var gap = (typeof _scrollActive !== 'undefined' && (_scrollActive || _swipeActive)) ? 30 : 15;
  if (dynLastMs && ms - dynLastMs < gap) { requestAnimationFrame(dynLoop); return; }
  var dt = dynLastMs ? Math.min(0.05, (ms - dynLastMs) / 1000) : 0.016;
  dynLastMs = ms;
  lastT = ms / 1000;
  if (!want && dynMaster < 0.01) dynPrelude(dt, lastT, skyWant);
  else dynStep(dt, lastT, want, skyWant);
  requestAnimationFrame(dynLoop);
}

/* ============================================================
   10. TAP & SWIPE WIND — only while the leaves are in front (message panels)
   ============================================================ */
var ptr = null;
window.addEventListener('pointerdown', function(e) {
  if (dynFrontMul < 0.5 || !S.tapWind) { ptr = null; return; }
  if (e.target && e.target.closest && e.target.closest('.furin-hit')) { ptr = null; return; }   // the 風鈴 takes its own touches
  ptr = { x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, t: performance.now(), moved: 0 };
}, { passive: true });
window.addEventListener('pointermove', function(e) {
  if (!ptr || dynFrontMul < 0.5) return;
  var now = performance.now(), dts = Math.max(0.008, (now - ptr.t) / 1000);
  var dx = e.clientX - ptr.x, dy = e.clientY - ptr.y;
  ptr.moved += Math.abs(dx) + Math.abs(dy);
  var vx = clamp(dx / dts, -2500, 2500), vy = clamp(dy / dts, -2500, 2500);
  pushAround(e.clientX, e.clientY, 200, vx * 0.06 * S.tapStrength, vy * 0.06 * S.tapStrength, 0, 0.15 * S.tapStrength);
  ptr.x = e.clientX; ptr.y = e.clientY; ptr.t = now;
}, { passive: true });
window.addEventListener('pointerup', function(e) {
  if (!ptr) return;
  if (ptr.moved < 12 && dynFrontMul >= 0.5) pushAround(e.clientX, e.clientY, 180, 0, -30 * S.tapStrength, 160 * S.tapStrength, 0.7);
  var sdx = e.clientX - ptr.x0;                   // winter: a sideways swipe sends a gust through the branches and snow
  if (ENV.scene === 'winter' && Math.abs(sdx) > 50 && Math.abs(sdx) > Math.abs(e.clientY - ptr.y0)) winStartGust(sdx < 0 ? -1 : 1, 1.3);
  ptr = null;
}, { passive: true });
window.addEventListener('pointercancel', function() { ptr = null; }, { passive: true });

/* ============================================================
   11. LIVE WEATHER — the app's own Open-Meteo request (fetchNagoyaWeather)
   hands its `current` block here every 5 minutes. Offline, the defaults
   in S simply stay.
   ============================================================ */
function onWeather(c) {
  if (!c) return;
  if (typeof c.weather_code === 'number' && typeof weatherBucket === 'function') S.condition = weatherBucket(c.weather_code);
  if (typeof c.temperature_2m === 'number') S.temperature = Math.round(c.temperature_2m);
  if (typeof c.wind_speed_10m === 'number') S.windSpeed = Math.round(c.wind_speed_10m * 2) / 2;
  if (typeof c.wind_direction_10m === 'number') S.windDir = Math.round(c.wind_direction_10m / 5) * 5 % 360;
  if (typeof c.wind_gusts_10m === 'number' && typeof c.wind_speed_10m === 'number') {
    S.gustiness = clamp(Math.round(((c.wind_gusts_10m - c.wind_speed_10m) / 8) * 20) / 20, 0.1, 1);
  }
  if (typeof c.cloud_cover === 'number') S.cloudCover = Math.round(c.cloud_cover / 5) * 5;
  if (typeof c.precipitation === 'number') S.rainMm = Math.round(c.precipitation * 5) / 5;
  if (typeof c.relative_humidity_2m === 'number') S.humidity = c.relative_humidity_2m;
  S.fogDensity = S.condition === 'fog' ? 0.7 : 0;
  envTimer = 0;
}

/* ============================================================
   START
   ============================================================ */
if (cvSky && cvBack && cvGround && cvFront && cvNear && ctxSky && ctx && ctxG && ctxF && ctxN) {
  makeSprites();
  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', resize);
  requestAnimationFrame(dynLoop);
}
/* The 風鈴 on the toolbar (Furin, above) asks how much the scene's gusts
   push at its x: in winter the wind field the branches and snow follow,
   less its steady breeze; in autumn each gust front as it sweeps past,
   on the same scale. 0 while the scene is not running. */
function furinGust(x) {
  if (dynMaster < 0.01) return 0;
  if (ENV.scene === 'winter') return winFieldAt(x) - winWind() * winWindDir() * 0.12;
  var gs = 0;
  for (var i = 0; i < gusts.length; i++) {
    var g = gusts[i], d = (g.x - x) * g.dir;
    gs += g.dir * 0.7 * (g.str / 140) * (d < 0 ? Math.exp(-(d * d) / 8100) : Math.exp(-d / 260));
  }
  return gs;
}
return { onWeather: onWeather, furinGust: furinGust, sceneShown: function() { return dynMaster; } };

})();

/* ============ BOOTSTRAP ============ */
applyTimeTheme();
setInterval(applyTimeTheme, 5 * 60 * 1000);
/* ============================================================
   FIRST-USE HINTS
   ------------------------------------------------------------
   Short, quiet hints that teach the therapist the app as she meets
   each part of it. They are drawn into #hintLayer (see main.css):
   a line drawn around something like a brush stroke, a ghost
   finger showing the gesture, and a small caption.

   Each hint shows once per session (a session starts when the name
   is confirmed, or when the start screen is returned to), plays and
   fades by itself, and is never waited on: she can ignore it, or do
   the thing at any moment, and it simply goes.

     Start screen    a finger traces up the water, three times,
                     with a caption beside it.
     Message pages   a line around the スワイプ hint and a finger
                     swiping left, once; on the last page, a line
                     around the scroll hint and a finger dragging up.
     Table           three hints that follow one another, each
                     playing once:
                       6a  a circle round the first ○ and a tapping finger
                       6b  a circle round the price and a tapping finger
                       6d  a box round the first その他 row, when she
                           has scrolled to it
                     and, whenever they happen:
                       6c  the first service she selects gets a caption
                           just under its row saying how to undo it
                           (a service selected by keying in its price, or
                           a custom one, gets it when the keypad closes
                           or the writing screen has closed)
                       keypad  the first time the keypad appears, a box
                           round it with a caption under it, until she
                           keys in her first digit. When the keypad opens
                           at the same moment as her first selection, the
                           caption goes first, stays 6.5 seconds, and the
                           keypad hint follows it
                     plus a caption on the shake when a price is
                     missing or the custom rows are filled out of order.
     Receipt         after the stamp, a circle round the ✕ with a caption.

   The rest of the app only calls the small functions returned at the
   bottom of this block. Nothing here changes what the app does.
   ============================================================ */
var Hints = (function () {
  var layer = document.getElementById('hintLayer');
  var svg = document.getElementById('hintSvg');
  if (!layer || !svg) return null;
  var NS = 'http://www.w3.org/2000/svg';

  /* ---------- the drawing layer ----------
     show({ targets: [{ el, shape: 'box' | 'circle' | 'none', pad, text, place, fade, content }],
            finger: { el, kind: 'tap' | 'swipe' | 'up', dx, dy },
            hold: ms the hint stays before done() runs (and it plays one pass),
            fadeAfter: fade it away once held, done: function, loops: finger passes,
            fade: caption fades by itself, kind: a tag for clearing it later,
            watch: let it go if its target leaves the screen, urgent: replace what is showing quickly })

     A hint's life: it fades in, plays, then fades away. Only one is ever on screen, and
     the next one waits until the one before has fully faded, so nothing ever pops in or out.
     Positions are read from the page every frame while a hint is up, so a line keeps
     following its target as the page scrolls or moves. */
  var FADE_IN = 400;          /* ms for a hint to fade in */
  var FADE_OUT = 450;         /* ms for a hint to fade away when it has simply finished */
  var FADE_QUICK = 180;       /* ms when something she did makes the hint beside the point */
  var opts = null, nodes = [], ghostEl = null, ghostLast = '', holdT = null, outT = null, rafId = 0;
  var phase = 'idle';         /* 'idle': nothing showing, 'in': showing, 'out': fading away */
  var queued = null;          /* the next hint, shown once the current one has faded away */

  function mk(cls) {
    var p = document.createElementNS(NS, 'path');
    p.setAttribute('class', cls);
    p.setAttribute('pathLength', '1');
    return p;
  }
  /* Where an element is on screen. With content: true, the box of what is inside it instead
     (the app's swipe and scroll hints are as wide as the page, but their text is small).
     That is measured from where the children are laid out, not where they are drawn, so
     the swipe arrow sliding to and fro does not make the box breathe. */
  function rectOf(el, content) {
    if (!el || !el.isConnected) return null;
    var r = el.getBoundingClientRect();
    if (!(r.width > 0 || r.height > 0)) return null;
    if (content && el.children.length) {
      var l = 1e9, t = 1e9, rt = -1e9, bt = -1e9;
      for (var i = 0; i < el.children.length; i++) {
        var k = el.children[i];
        l = Math.min(l, k.offsetLeft); t = Math.min(t, k.offsetTop);
        rt = Math.max(rt, k.offsetLeft + k.offsetWidth); bt = Math.max(bt, k.offsetTop + k.offsetHeight);
      }
      return { x: r.left + l, y: r.top + t, w: rt - l, h: bt - t };
    }
    return { x: r.left, y: r.top, w: r.width, h: r.height };
  }

  /* A rounded box, drawn clockwise from the top-left with a small overlap. */
  function boxPath(r, pad) {
    var x = r.x - pad, y = r.y - pad, w = r.w + pad * 2, h = r.h + pad * 2, k = Math.min(18, h / 2, w / 2);
    return 'M' + (x + k + 14) + ' ' + (y - 1) +
      ' L' + (x + w - k) + ' ' + y + ' Q' + (x + w) + ' ' + y + ' ' + (x + w) + ' ' + (y + k) +
      ' L' + (x + w + 1) + ' ' + (y + h - k) + ' Q' + (x + w) + ' ' + (y + h) + ' ' + (x + w - k) + ' ' + (y + h) +
      ' L' + (x + k) + ' ' + (y + h + 1) + ' Q' + x + ' ' + (y + h) + ' ' + x + ' ' + (y + h - k) +
      ' L' + (x - 1) + ' ' + (y + k) + ' Q' + x + ' ' + y + ' ' + (x + k) + ' ' + y +
      ' L' + (x + k + 46) + ' ' + (y - 3);
  }
  /* A circle that goes a little over one turn and wobbles slightly, like a brush. */
  function circlePath(r, pad) {
    var cx = r.x + r.w / 2, cy = r.y + r.h / 2, rx = r.w / 2 + pad, ry = r.h / 2 + pad, d = '';
    var a0 = -Math.PI * 0.62, turn = Math.PI * 2 * 1.07, n = 72;
    for (var i = 0; i <= n; i++) {
      var t = i / n, a = a0 + turn * t;
      var wob = 1 + 0.035 * Math.sin(a * 3 + 1) + 0.06 * Math.max(0, t - 0.9) * 10;
      d += (i ? ' L' : 'M') + (cx + Math.cos(a) * rx * wob).toFixed(1) + ' ' + (cy + Math.sin(a) * ry * wob).toFixed(1);
    }
    return d;
  }

  /* The part of the screen the table can use: under the toolbar, above the summary bar. */
  function bounds() {
    var top = 0, bottom = window.innerHeight;
    if (infoBar && infoBar.classList.contains('shown') && !infoBar.classList.contains('hidden')) {
      top = infoBar.getBoundingClientRect().bottom;
    }
    if (summaryBar && summaryBar.classList.contains('visible')) {
      bottom = summaryBar.getBoundingClientRect().top;
    }
    return { top: top, bottom: bottom };
  }
  function fullyVisible(el) {
    if (!el) return false;
    var r = el.getBoundingClientRect(), b = bounds();
    return r.height > 0 && r.top >= b.top - 1 && r.bottom <= b.bottom + 1;
  }

  /* Takes everything down at once. Only used between sessions, when nothing is on screen anyway
     or a fresh start is wanted; everything else goes through end() so it fades. */
  function teardown() {
    clearTimeout(holdT);
    clearTimeout(outT);
    if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    layer.classList.remove('on', 'go', 'once', 'seen');
    layer.style.transitionDuration = '';
    layer.style.transition = '';
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].cap && nodes[i].cap.parentNode) nodes[i].cap.parentNode.removeChild(nodes[i].cap);
    }
    if (ghostEl && ghostEl.parentNode) ghostEl.parentNode.removeChild(ghostEl);
    nodes = []; ghostEl = null; ghostLast = ''; opts = null; phase = 'idle';
  }
  function clearNow() { queued = null; teardown(); }

  /* Fades the current hint away, then starts whatever is waiting. It is taken down only once
     the browser says the fade has really finished (the page can be slow to start a fade, and
     going by a timer cut it off half way, so the next hint appeared at half strength); the
     timer is only a safety net. */
  function end(ms) {
    if (phase === 'idle') { startQueued(); return; }
    if (phase === 'out') return;
    phase = 'out';
    clearTimeout(holdT);
    var finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      layer.removeEventListener('transitionend', onEnd);
      clearTimeout(outT);
      teardown();
      startQueued();
    }
    function onEnd(e) { if (e.target === layer && e.propertyName === 'opacity') finish(); }
    layer.addEventListener('transitionend', onEnd);
    layer.style.transitionDuration = ms + 'ms';
    layer.classList.remove('seen');
    outT = setTimeout(finish, ms + 1500);
    /* already invisible (it was taken down before it had faded in): nothing to wait for */
    if (parseFloat(getComputedStyle(layer).opacity) < 0.01) finish();
  }
  function startQueued() {
    var q = queued;
    queued = null;
    if (q) start(q);
  }
  /* Lets the current hint go (and cancels any that was waiting). */
  function clear(ms) { queued = null; end(ms == null ? FADE_OUT : ms); }
  function fadeOut() { end(FADE_OUT); }

  function setHidden(n, hide) {
    n.hidden = hide;
    var v = hide ? 'hidden' : '';
    if (n.ink) { n.ink.style.visibility = v; n.casing.style.visibility = v; n.glow.style.visibility = v; }
    if (n.cap) n.cap.style.visibility = v;
  }

  /* A caption sits beside, above or below its target. Beside it, a caption that
     would not fit on one line wraps instead. 'belowLeft' floats over the line
     under a table row (about a third of it above the line), with its left edge
     poking out of the table so it does not read as part of it; with no room
     below, it sits over the line above the row instead. The caption's size is
     measured once when it is made, so following a target costs no layout. */
  function placeCaption(n, r, pad, W, H, b) {
    var cap = n.cap, gap = pad + 16, p = n.t.place || 'below', x, y;
    var cw = n.nat.w, ch = n.nat.h;
    if (p === 'left' || p === 'right') {
      var avail = p === 'left' ? r.x - gap - 8 : W - 8 - (r.x + r.w + gap);
      if (cw > avail) {
        var w = Math.max(160, Math.round(avail));
        if (n.wrapW !== w) {
          cap.style.whiteSpace = 'normal';
          cap.style.width = w + 'px';
          n.wrapW = w; n.wrapH = cap.offsetHeight;
        }
        cw = w; ch = n.wrapH;
      } else if (n.wrapW) {
        cap.style.whiteSpace = '';
        cap.style.width = '';
        n.wrapW = 0;
      }
    }
    if (p === 'belowLeft') {
      x = r.x - 14; y = r.y + r.h - Math.round(ch * 0.37);
      if (y + ch > b.bottom) y = r.y - Math.round(ch * 0.63);
    } else if (p === 'below') { x = r.x + r.w / 2 - cw / 2; y = r.y + r.h + gap; }
    else if (p === 'above') { x = r.x + r.w / 2 - cw / 2; y = r.y - gap - ch; }
    else if (p === 'right') { x = r.x + r.w + gap; y = r.y + r.h / 2 - ch / 2; }
    else { x = r.x - gap - cw; y = r.y + r.h / 2 - ch / 2; }
    cap.style.left = Math.max(8, Math.min(W - cw - 8, x)) + 'px';
    cap.style.top = Math.max(8, Math.min(H - ch - 8, y)) + 'px';
  }

  /* Re-reads where everything is (all the reads first, then all the writes, so the page is
     never made to lay out twice). Skips anything that has not moved. */
  function place(force) {
    if (!opts) return;
    var W = window.innerWidth, H = window.innerHeight, i, n;
    var b = bounds();
    for (i = 0; i < nodes.length; i++) nodes[i].r = rectOf(nodes[i].t.el, nodes[i].t.content);
    var fr = (ghostEl && opts.finger) ? rectOf(opts.finger.el) : null;
    for (i = 0; i < nodes.length; i++) {
      n = nodes[i];
      var r = n.r, t = n.t;
      if (!r) { if (!n.hidden) setHidden(n, true); continue; }
      var key = r.x.toFixed(1) + ',' + r.y.toFixed(1) + ',' + r.w.toFixed(1) + ',' + r.h.toFixed(1) + ',' + W + ',' + H + ',' + Math.round(b.bottom);
      if (!force && key === n.key && !n.hidden) continue;
      n.key = key;
      if (n.hidden) setHidden(n, false);
      var pad = t.pad != null ? t.pad : 10;
      if (n.ink) {
        var d = t.shape === 'circle' ? circlePath(r, pad) : boxPath(r, pad);
        n.ink.setAttribute('d', d);
        n.casing.setAttribute('d', d);
        n.glow.setAttribute('d', d);
      }
      if (n.cap) placeCaption(n, r, pad, W, H, b);
    }
    if (fr) {
      var gx = fr.x + fr.w / 2 + (opts.finger.dx || 0), gy = fr.y + fr.h / 2 + (opts.finger.dy || 0);
      var gk = gx.toFixed(1) + ',' + gy.toFixed(1);
      if (force || gk !== ghostLast) {
        ghostEl.style.left = gx + 'px';
        ghostEl.style.top = gy + 'px';
        ghostLast = gk;
      }
    }
    /* A hint about something in the table lets go once that thing has scrolled out of view
       (having once been in view), instead of hanging at the edge of the screen. */
    if (opts.watch && phase === 'in' && nodes.length && nodes[0].r) {
      var c = nodes[0].r.y + nodes[0].r.h / 2;
      if (c >= b.top && c <= b.bottom) opts.inView = true;
      else if (opts.inView && !opts.gone) {
        var o = opts;
        o.gone = true;
        clearTimeout(holdT);
        if (o.done) o.done(); else end(FADE_OUT);
      }
    }
  }
  function frame() {
    rafId = 0;
    if (!opts) return;
    place(false);
    if (opts) rafId = requestAnimationFrame(frame);
  }

  function start(o) {
    phase = 'in';
    opts = o;
    /* always begin fully transparent: with no fade in progress, and not carrying over any
       opacity left by the hint before */
    layer.style.transition = 'none';
    layer.classList.remove('seen');
    layer.classList.add('on');
    if (o.hold) layer.classList.add('once');
    var targets = o.targets || [], i, n;
    for (i = 0; i < targets.length; i++) {
      var t = targets[i];
      n = { t: t, key: '', hidden: false, r: null, nat: null, wrapW: 0, wrapH: 0 };
      if (t.shape && t.shape !== 'none') {
        n.glow = mk('coach-glow'); n.casing = mk('coach-casing'); n.ink = mk('coach-ink');
        svg.appendChild(n.glow); svg.appendChild(n.casing); svg.appendChild(n.ink);
      }
      if (t.text) {
        n.cap = document.createElement('div');
        n.cap.className = 'coach-cap' + ((o.fade || t.fade) ? ' fade' : '');
        n.cap.textContent = t.text;
        layer.appendChild(n.cap);
      }
      nodes.push(n);
    }
    if (o.finger) {
      ghostEl = document.createElement('div');
      ghostEl.className = 'coach-ghost ' + o.finger.kind;
      if (o.loops) ghostEl.style.animationIterationCount = o.loops;
      layer.appendChild(ghostEl);
    }
    /* measure each caption once, as one line */
    for (i = 0; i < nodes.length; i++) {
      n = nodes[i];
      if (n.cap) n.nat = { w: n.cap.offsetWidth, h: n.cap.offsetHeight };
    }
    place(true);
    /* the layer is on the page at full transparency: now let it fade in and start drawing */
    void layer.offsetWidth;
    layer.style.transition = '';
    layer.style.transitionDuration = FADE_IN + 'ms';
    void layer.offsetWidth;
    layer.classList.add('go', 'seen');
    if (o.hold) {
      holdT = setTimeout(function () {
        if (opts !== o || phase !== 'in' || o.gone) return;
        if (o.fadeAfter) end(FADE_OUT);
        if (o.done) o.done();
      }, o.hold);
    }
    if (!rafId) rafId = requestAnimationFrame(frame);
  }

  /* Shows a hint. If one is showing, it fades away first and this one follows it. */
  function show(o) {
    if (phase === 'idle') { start(o); return; }
    queued = o;
    if (phase === 'in') end(o.urgent ? FADE_QUICK : FADE_OUT);
  }

  /* ---------- what has been shown this session ---------- */
  var seenKoi = false, seenSwipe = false, seenScroll = false, seenStamp = false;
  var kpShown = false, kpOn = false, kpPending = false, numpadWas = false;
  var tickShown = false, pendingTick = null;
  var seq = 'off', revealAt = 0, pollT = 0, done6d = false;
  var timers = [];

  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function clearTimers() { for (var i = 0; i < timers.length; i++) clearTimeout(timers[i]); timers = []; }
  function modalOpen() {
    var screens = [tanzakuScreen, alertScreen, confirmScreen, receiptScreen, thankyouScreen];
    for (var i = 0; i < screens.length; i++) {
      if (screens[i] && screens[i].classList.contains('visible')) return true;
    }
    return false;
  }

  /* A new session: forget everything that has been shown. */
  function reset() {
    clearNow(); clearTimers();
    clearInterval(pollT); pollT = 0;
    seenKoi = seenSwipe = seenScroll = seenStamp = false;
    kpShown = kpOn = kpPending = numpadWas = false;
    tickShown = false; pendingTick = null;
    seq = 'off'; done6d = false;
  }
  /* She started something else (the writing screen, 確認する, すべて見送る): the table hints are over. */
  function interrupt() {
    clear(FADE_QUICK);
    kpOn = false; kpPending = false; pendingTick = null;
    endSeq();
  }

  /* ---------- start screen ---------- */
  function onStartScreen() {
    if (seenKoi) return;
    later(function () {
      if (seenKoi || introHasRun || !blossomScreen || !blossomScreen.classList.contains('visible') ||
          blossomScreen.classList.contains('notice-hold')) return;
      var ring = document.querySelector('#startBtn .gold-band') || startBtn;
      seenKoi = true;
      /* the finger traces up three times (0.8s to start, 2.4s each), the caption stays, then it fades */
      show({ kind: 'koi', hold: 8000, fadeAfter: true, loops: 3,
        targets: [{ el: ring, shape: 'none', pad: 20, text: '水面を上へなぞると、はじまります', place: 'right' }],
        finger: { el: ring, kind: 'up' } });
    }, 2600);
  }
  function onKoiStart() {
    seenKoi = true;
    clearTimers();
    clear(300);
  }

  /* ---------- message pages ---------- */
  /* The swipe and scroll lines are now a button that shows what to do by itself
     (NavSpring below), so they no longer get an outline and a ghost finger. */
  function onPanelsReady() { seenSwipe = true; }
  function onPanelChange(index) {
    seenSwipe = true;
    if (opts && (opts.kind === 'swipe' || opts.kind === 'scroll')) clear(300);
  }

  /* ---------- table: 6a, 6b, 6d one after another ---------- */
  function endSeq() { seq = 'T'; clearInterval(pollT); pollT = 0; }
  function onTableReveal() {
    if (seq !== 'off') return;
    seq = 'wait';
    revealAt = Date.now();
    if (!pollT) pollT = setInterval(poll, 300);
  }
  function firstTickedRow() {
    var rows = getRows();
    for (var i = 0; i < rows.length; i++) {
      var box = rows[i].querySelector('.row-check');
      if (box && box.classList.contains('checked')) return rows[i];
    }
    return null;
  }

  function poll() {
    if (seq !== 'wait' && seq !== '6d') { clearInterval(pollT); pollT = 0; return; }
    if (opts || numpadWas || modalOpen() || rejected) return;
    if (seq === 'wait') {
      var rows = getRows();
      if (!rows.length || !tableCard.classList.contains('active') || Date.now() - revealAt < 1300) return;
      /* wait until the first row is whole on screen and well up the page, so the hint has her attention */
      if (!fullyVisible(rows[0]) || rows[0].getBoundingClientRect().top > window.innerHeight * 0.72) return;
      /* with no services picked on the name screen the first row is a custom one: go straight to 6d */
      if (rows[0].querySelector('.service-input')) runStep('6d');
      else runStep(tickShown ? '6b' : '6a');
    } else {
      check6d();
    }
  }

  function runStep(id) {
    seq = id;
    var rows = getRows(), row;
    if (id === '6a') {
      if (tickShown) { runStep('6b'); return; }
      row = rows[0];
      if (!row) { endSeq(); return; }
      var check = row.querySelector('.row-check');
      show({ kind: '6a', hold: 4000, watch: true, done: function () { if (seq === '6a') runStep('6b'); },
        targets: [{ el: check, shape: 'circle', pad: 12, text: '○をタップして選択', place: 'left' }],
        finger: { el: check, kind: 'tap' } });
    } else if (id === '6b') {
      if (kpShown) { runStep('6d'); return; }
      row = firstTickedRow() || rows[0];
      if (!row) { endSeq(); return; }
      var price = row.querySelector('.price-wrap'), input = row.querySelector('.price-input');
      var filled = !!(input && (input.value || '').trim() !== '');
      show({ kind: '6b', hold: 4000, watch: true, done: function () { if (seq === '6b') runStep('6d'); },
        targets: [{ el: price, shape: 'circle', pad: 14, text: filled ? '料金を変更するには、ここをタップ' : 'ここをタップして料金を入力', place: 'below' }],
        finger: { el: price, kind: 'tap' } });
    } else {
      /* 6d waits until the first その他 row is fully on screen */
      clear();
      if (!pollT) pollT = setInterval(poll, 300);
      check6d();
    }
  }
  function check6d() {
    if (done6d) { endSeq(); return; }
    var row = firstUnnamedCustomRow();
    if (!row) { endSeq(); return; }
    if (opts || numpadWas) return;
    if (row.getBoundingClientRect().bottom < bounds().top) { endSeq(); return; }   /* scrolled past it */
    if (!fullyVisible(row)) return;
    show({ kind: '6d', hold: 4000, watch: true,
      done: function () { if (seq === '6d') { done6d = true; clear(); endSeq(); } },
      targets: [{ el: row, shape: 'box', pad: 6, text: '一覧にない対応可能なオプションがあれば、こちらにご記入ください', place: 'above' }] });
  }

  /* ---------- 6c: the first service she selects ---------- */
  /* How long the caption stays when the keypad hint is waiting behind it: time to notice it,
     read its 16 characters and take them in, with the fades included. */
  var TICK_FIRST_HOLD = 6500;
  function drawTick(row, done, hold) {
    tickShown = true;
    show({ kind: 'tick', hold: hold || 4000, watch: true, urgent: true, done: done,
      targets: [{ el: row, shape: 'none', pad: 6, text: 'もう一度タップすると解除できます', place: 'belowLeft' }] });
  }
  /* After a caption or the keypad hint, the guided hints carry on. Tapping a price skips 6b. */
  function afterTick() {
    if (seq === '6a') runStep('6b');
    else if (seq === '6b' || seq === '6d') runStep(seq);
    else clear();
  }
  function afterKeypad() {
    if (seq === '6a' || seq === '6b' || seq === '6d') runStep('6d');
    else clear();
  }
  /* The caption came first because the keypad opened at the same moment: once it has had its
     time, the keypad hint follows (unless she has started keying in, or closed the keypad). */
  function afterFirstTick() {
    if (kpOn && kpPending) drawKeypadHint();
    else afterTick();
  }
  /* She tapped a ○. (The app also puts the cursor in that row's price, which brings the keypad
     up straight away: then the caption goes first and the keypad hint follows it.) */
  function onTick(row) {
    if (tickShown || !row || rejected) return;
    if (kpOn) { kpPending = true; drawTick(row, afterFirstTick, TICK_FIRST_HOLD); return; }
    drawTick(row, afterTick);
  }
  /* A row was selected by keying in its price, or by writing a custom service's name.
     The caption waits for the keypad to close, or for the keypad to come up. */
  function onAutoTick(row, custom) {
    if (tickShown || !row) return;
    pendingTick = { row: row, custom: !!custom };
  }

  /* ---------- keypad hint ---------- */
  function drawKeypadHint() {
    kpPending = true;
    show({ kind: 'kp', urgent: true,
      targets: [{ el: numpad, shape: 'box', pad: 10, text: '入力後、「決定」をタップ', place: 'below' }] });
  }
  function onNumpadShown() {
    if (!tableCard.classList.contains('active') || modalOpen() || rejected) return;
    var custom = (pendingTick && pendingTick.custom && !tickShown) ? pendingTick.row : null;
    if (!kpShown) {
      kpShown = true; kpOn = true; kpPending = true;
      if (custom) {
        /* a custom service just written: its caption first, then the keypad hint */
        pendingTick = null;
        drawTick(custom, afterFirstTick, TICK_FIRST_HOLD);
      } else {
        /* a ○ tap brings the keypad up before the caption is asked for (a moment later in the
           same tap): let that happen first, so the keypad hint is not drawn only to be replaced */
        setTimeout(function () {
          if (!kpOn || !kpPending) return;
          if ((opts && opts.kind === 'tick') || (queued && queued.kind === 'tick')) return;
          drawKeypadHint();
        }, 0);
      }
    } else if (custom) {
      pendingTick = null;
      drawTick(custom, function () { clear(); });
    }
  }
  function onNumpadHidden() {
    var wasKp = kpOn;
    kpOn = false; kpPending = false;
    var keyed = (pendingTick && !pendingTick.custom && !tickShown) ? pendingTick.row : null;
    if (keyed) { pendingTick = null; drawTick(keyed, afterKeypad); return; }
    if (wasKp) {
      /* she closed the keypad while the caption was up: let the caption finish */
      if (opts && opts.kind === 'tick') return;
      clear(FADE_QUICK);
      afterKeypad();
    }
  }
  /* Called every time the app works out whether the keypad shows. Acts only when that changes. */
  function syncNumpad() {
    var vis = !!numpad && numpad.classList.contains('visible') && !numpad.classList.contains('receipt-mode');
    if (vis === numpadWas) return;
    numpadWas = vis;
    if (vis) onNumpadShown(); else onNumpadHidden();
  }
  /* The first digit she keys in ends the keypad hint (backspace does not count). */
  function onDigit() {
    if (kpOn && kpPending) {
      kpPending = false;
      /* if the caption is still up (the keypad hint is waiting behind it), the keypad hint
         simply never comes; the caption carries on to the end */
      if (opts && opts.kind === 'kp') fadeOut();
    }
  }

  /* ---------- a caption on the shake ---------- */
  function say(el, text) {
    if (!el || modalOpen()) return;
    /* the same caption is already up (or on its way): leave it alone rather than restart it */
    if (opts && opts.kind === 'say' && opts.sayText === text && opts.sayEl === el && phase === 'in') return;
    if (queued && queued.kind === 'say' && queued.sayText === text && queued.sayEl === el) return;
    show({ kind: 'say', sayText: text, sayEl: el, hold: 4200, watch: true, urgent: true,
      done: function () {
        if (kpOn && kpPending) { drawKeypadHint(); return; }
        if (seq === '6a' || seq === '6b' || seq === '6d') { runStep(seq); return; }
        clear();
      },
      targets: [{ el: el, shape: 'box', pad: 6, text: text, place: 'above' }] });
  }

  /* ---------- receipt ---------- */
  function onStamp() {
    if (!receiptStampX || seenStamp) return;
    seenStamp = true;
    show({ kind: 'stamp', hold: 3400, fadeAfter: true,
      targets: [{ el: receiptStampX, shape: 'circle', pad: 8, text: '変更は印の×から', place: 'right' }] });
  }

  var api = {
    reset: reset, clear: clear, interrupt: interrupt,
    onStartScreen: onStartScreen, onKoiStart: onKoiStart,
    onPanelsReady: onPanelsReady, onPanelChange: onPanelChange,
    onTableReveal: onTableReveal,
    onTick: onTick, onAutoTick: onAutoTick,
    syncNumpad: syncNumpad, onDigit: onDigit,
    say: say, onStamp: onStamp
  };
  /* The app calls these from inside its own handlers. If a hint ever went wrong it must
     not take the app down with it: any error is swallowed and the hint is cleared. */
  function safely(fn) {
    return function () {
      try { return fn.apply(null, arguments); }
      catch (e) { try { clearNow(); } catch (e2) { /* silent */ } }
    };
  }
  for (var name in api) api[name] = safely(api[name]);
  return api;
})();

/* ============ NEXT / DOWN BUTTON ============
   Tapping it does what the old line described: the next message, or down to
   the table (and, on the thank-you screens, the next screen, or on to the games).
   Every so often the button is drawn out the way its arrow points (right, or down
   for the table) and let go on a spring, so the word and the arrow swing together
   until they settle. These are the numbers chosen on bamboo.html.

   When it bounces:
   - the swipe button bounces on the first message until the therapist swipes
     (the panel changes). It starts 5 seconds after all the text of the first
     message has appeared, not before. On the later messages it waits quietly, and starts
     bouncing again only after 10 seconds with no touch while she is still on that
     message; the next swipe stops it again. The thank-you screens work the same way.
   - the scroll button bounces until she scrolls, then stops for good. */
var NavSpring = (function () {
  var SET = { response: 0.2, damping: 0.05, pull: 11.5, pullTime: 300, kick: 180, pause: 0.9 };
  var AFTER_TOUCH = 1400;                    // a touch anywhere holds the swing back this long (ms)
  var QUIET = 10000;                         // no touch for this long on a later message: bounce again (ms)
  var INTRO_WAIT = 5000;                     // the first message: bounce this long after all its text has appeared (ms)
  var introPending = true, textReadyAt = 0;  // still on the first message, and when its text will have been up for INTRO_WAIT
  var path = null, startT = 0, raf = 0, timer = 0, moving = null, movingBtn = null, down = false, lastTouch = -1e9;
  var quietUntil = { msg: 0, ty: 0 };        // the swipe buttons stay still until this time
  var lastIndex = { msg: 0, ty: 0 };
  var scrolled = false;                      // she has scrolled: the scroll button is done

  function easeOut(p) { return 1 - Math.pow(1 - p, 3); }
  /* [offset, ...] every 1/240 s: drawn out, let go, then a damped spring until it stops. */
  function simulate() {
    var out = [], dt = 1 / 240, n = Math.round(SET.pullTime / 1000 / dt), i;
    for (i = 1; i <= n; i++) out.push(-SET.pull * easeOut(i / n));
    var w = 2 * Math.PI / SET.response, k = w * w, c = 2 * SET.damping * w;
    var x = -SET.pull, v = SET.kick;
    for (i = 0; i < 240 * 8; i++) {
      v += (-k * x - c * v) * dt;
      x += v * dt;
      out.push(x);
      if (Math.abs(x) < 0.03 && Math.abs(v) < 0.6) break;
    }
    out.push(0);
    return out;
  }
  /* which rule a button follows */
  function groupOf(btn) {
    if (btn.id === 'tySwipeBtn') return 'ty';
    return btn.getAttribute('data-dir') === 'down' ? 'scroll' : 'msg';
  }
  /* every phrase of the first message is on show (they fade in a few at a time) */
  function firstTextShown() {
    var list = document.querySelectorAll('.panel[data-panel="0"] .panel-phrase');
    if (!list.length) return false;
    for (var i = 0; i < list.length; i++) if (!list[i].classList.contains('shown')) return false;
    return true;
  }
  function mayBounce(btn) {
    var g = groupOf(btn), now = performance.now();
    if (g === 'scroll') return !scrolled;
    if (g === 'msg' && introPending) {
      /* the last phrase takes PANEL_PHRASE_DURATION to fade in; the 5 seconds count from when it is fully up */
      if (!firstTextShown()) { textReadyAt = 0; return false; }
      if (!textReadyAt) textReadyAt = now + PANEL_PHRASE_DURATION + INTRO_WAIT;
      return now >= textReadyAt;
    }
    return now >= quietUntil[g];
  }
  function stopSwing() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    if (moving) moving.style.transform = '';
    moving = movingBtn = null;
    clearTimeout(timer);
    timer = setTimeout(play, 600);
  }
  /* the button that is on show right now, if any */
  function visibleButton() {
    var list = document.querySelectorAll('.nav-btn');
    for (var i = 0; i < list.length; i++) {
      var hint = list[i].closest('.action-hint'), layer = list[i].closest('.hint-layer');
      if (!hint || !hint.classList.contains('shown')) continue;
      if (layer && !layer.classList.contains('active')) continue;
      if (list[i].offsetParent === null) continue;
      return list[i];
    }
    return null;
  }
  function frame(now) {
    var i = Math.max(0, Math.floor((now - startT) / 1000 * 240));
    if (i >= path.length) {
      moving.style.transform = ''; raf = 0; moving = null;
      timer = setTimeout(play, Math.max(SET.pause * 1000, lastTouch + AFTER_TOUCH - now));
      return;
    }
    var x = -path[i];                         // positive = the way the arrow points
    moving.style.transform = down ? 'translateY(' + x.toFixed(2) + 'px)' : 'translateX(' + x.toFixed(2) + 'px)';
    raf = requestAnimationFrame(frame);
  }
  function play() {
    clearTimeout(timer); timer = 0;
    var btn = visibleButton();
    if (!btn || !mayBounce(btn)) { timer = setTimeout(play, 250); return; }      // nothing to bounce just now: look again shortly
    movingBtn = btn;
    moving = btn.querySelector('.nav-move');
    down = btn.getAttribute('data-dir') === 'down';
    path = simulate();
    startT = performance.now();
    raf = requestAnimationFrame(frame);
  }
  /* After a touch it waits a moment before the next swing. A swing already under way is
     let finish, so the button never jumps away from the finger. */
  window.addEventListener('pointerdown', function () {
    var now = performance.now();
    lastTouch = now;
    /* on a later message, every touch starts the 10 seconds again */
    for (var g in quietUntil) if (now < quietUntil[g]) quietUntil[g] = now + QUIET;
    if (!raf) { clearTimeout(timer); timer = setTimeout(play, AFTER_TOUCH); }
  }, true);
  /* a swipe moves her on to another message: the bouncing stops, and waits 10 quiet seconds */
  function panelChanged(group, index) {
    if (index === lastIndex[group]) return;
    lastIndex[group] = index;
    if (group === 'msg') introPending = false;
    quietUntil[group] = performance.now() + QUIET;
    if (group === 'msg') scrolled = false;                    // the scroll button starts afresh on the last message
    if (raf) stopSwing();
  }
  /* once she scrolls, the scroll button has done its job */
  window.addEventListener('scroll', function () {
    if (scrolled || (window.scrollY || window.pageYOffset || 0) <= 4) return;
    var btn = visibleButton();
    if (!btn || groupOf(btn) !== 'scroll') return;
    scrolled = true;
    if (raf) stopSwing();
  }, { passive: true });
  /* back at the start: everything bounces from the first message again */
  function reset(which) {
    if (!which || which === 'msg') { quietUntil.msg = 0; lastIndex.msg = 0; scrolled = false; introPending = true; textReadyAt = 0; }
    if (!which || which === 'ty') { quietUntil.ty = 0; lastIndex.ty = 0; }
  }
  if (!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) timer = setTimeout(play, 1200);

  /* what a tap does */
  var swipeBtn = globalHintLayerSwipe && globalHintLayerSwipe.querySelector('.nav-btn');
  var scrollBtn = globalHintLayerScroll && globalHintLayerScroll.querySelector('.nav-btn');
  var tyBtn = document.getElementById('tySwipeBtn');
  if (swipeBtn) swipeBtn.addEventListener('click', function () { goToPanel(currentPanel + 1); });
  if (scrollBtn) scrollBtn.addEventListener('click', function () {
    try { tableCard.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    catch (e) { window.scrollTo(0, tableCard.getBoundingClientRect().top + (window.pageYOffset || 0) - 100); }
  });
  if (tyBtn) tyBtn.addEventListener('click', function () {
    if (tyExited) return;
    if (tyCurrentPanel === TY_TOTAL_PANELS - 1) exitTyToGames();
    else goToTyPanel(tyCurrentPanel + 1);
  });
  return { play: play, panelChanged: panelChanged, reset: reset };
})();

updateGlobalHint();