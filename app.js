/* ============================================================
   app.js — v1.3

   ------------------------------------------------------------
   Changelog:
     v1.3 (cross-season late-night starfield)
       - The 33-star far-depth blurred starfield (#starField) is
         extended from being winter-exclusive to running across
         both warm-palette seasons (data-theme="autumn" and
         data-theme="winter"). Every visual parameter is retained
         verbatim — 33 stars, 0.65 peak opacity, 1.30× twinkle
         duration (3.9s–8.6s), 1.15× size scale (13px–32px),
         random (left, top) relocation on animationiteration
         during the opacity: 0 trough, blur(2.4px) base and
         blur(3.8px) on .star-deep — so every star sits in the
         same distant bokeh plane behind both the autumn leaves
         and the winter snowflakes.
       - The starfield's display gate moves from the winter-only
         html:not([data-theme="winter"]) group to a dedicated
         html[data-theme="default"] .star-field rule, mirroring the
         same idiom already used for .ambient-mesh and
         .ambient-mosaic. The starfield is hidden only under the
         sakura default theme.
       - updateStarFieldVisibility() now uses
         isWarmPaletteTheme(currentTheme) rather than
         currentTheme === 'winter'. This is the fourth application
         of the same predicate (applyTheme's acoustic gate,
         drawHudSpectrum's palette branch, playAmbientSound's
         terminal guard, and now the starfield's visibility check),
         so autumn and winter stay unified under a single
         warm-palette definition for both audio management and the
         visual layer.
       - #starField is placed immediately before #mapleLeaves in
         index.html. Both share z-index: -1, and at equal z-index
         paint order is DOM order — so the stars sit below the
         falling leaves in autumn and below the falling snowflakes
         in winter, above .ambient-mosaic at z-index -2 throughout.
         The ordering holds across the 1.8s opacity cross-fade:
         opacity < 1 creates a stacking context within the parent's
         context but does not reorder siblings.
       - Toggling autumn ↔ winter during late-night playback keeps
         the starfield continuously visible. applyTheme() calls
         updateStarFieldVisibility() with the new warm-palette
         theme (no class change), then startAmbient() runs
         stopAmbient() → startAmbient() internally, which removes
         and re-adds .active ~4ms apart — inside a single 8.3ms
         frame at 120Hz. Browsers retarget an in-flight opacity
         transition on property change, so any visible traversal
         is a 1→0.998→1 micro-dip, imperceptible against the 1.8s
         curve. Toggling to default correctly hides the starfield:
         isWarmPaletteTheme('default') is false, so the class is
         removed once and stays removed.
     v1.3 (winter theme — 7-tier snowfall + late-night starfield)
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
         returns true for autumn and winter, so the ambient
         acoustic engine and the HUD spectrum palette both treat
         winter as a first-class autumn-family theme rather than
         a separate code path. playAmbientSound()'s terminal guard
         is now if (!isWarmPaletteTheme(currentTheme)) return 0; —
         an explicit 'autumn' string check would have silently
         killed playback in winter. drawHudSpectrum() reads the
         same predicate for its isAutumn colour branch.
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
       - Late-night sparkling starfield. #starField (z-index -1)
         holds 33 distant 4-point Hoshi-gata stars with a
         radial-gradient halo, two SVG variants (amber-centred
         .sparkle-star, plum-centred .sparkle-star.star-plum),
         and two depth classes (filter: blur(2.4px) default,
         .star-deep at filter: blur(3.8px)). Peak opacity 0.65,
         1.30× twinkle duration (3.9s–8.6s), 1.15× size scale.
         Each star's animationiteration listener re-rolls its
         (left, top) during the opacity: 0 trough at the 72–99%
         keyframe stop — the relocation lands entirely inside the
         invisible window, so it reads as a new star appearing
         elsewhere rather than the existing star drifting.
       - Triple-gated visibility. updateStarFieldVisibility() adds
         .active to #starField only when all three conditions hold:
         the theme is warm-palette, #mapleLeaves carries .active
         (carousel is running, past the name intro), and
         _activeAmbientTrackName === 'latenight' with
         ambientSource !== null. The third gate is what ties the
         starfield to the late-night phase (カタライザー, 22:00–04:59
         JST) rather than the theme alone — winter mornings stay
         starlit-free, and the field only ignites when the
         late-night bed is actually audible.
       - Starfield lifecycle. _activeAmbientTrackName is set in
         playAmbientSound() at the moment ambientSource = src, and
         reset in two places: inside src.onended (guarded by the
         existing if (ambientSource === src) identity check) and
         at the top of stopAmbient()'s state-clearing group. Both
         reset sites call updateStarFieldVisibility() immediately
         so the starfield and the HUD read the cleared state on
         the same tick. The identity guard is load-bearing for the
         same-track loop case: scheduleNextAmbient re-arms at
         playDur * 1000 while the outgoing source is stopped at
         playDur + 0.1, so src2's assignment pre-empts src1's
         onended by 100ms and the guard evaluates false — the
         starfield never pulses between successive plays of
         Latenight.mp3.
       - stopAmbient() teardown order. _activeAmbientTrackName =
         null joins ambientSource = null, ambientGain = null, and
         the timing trio in the same clearing block, and
         updateStarFieldVisibility() sits between that block and
         _hudRenderState(). Both readers therefore observe the
         fully-cleared playback window, and the HUD badge revert
         and the starfield deactivation land in the same frame.
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
         display: block at a time, so the z-index: -1 collision
         between #starField and .maple-leaves-overlay is
         structurally impossible.
       - Reduced-motion handling. A standalone @media
         (prefers-reduced-motion: reduce) block at the bottom of
         main.css disables both .snow-particle and .sparkle-star —
         animation: none, opacity: 0, filter: none. The snowflakes
         and stars are decorative motion with no telemetry role,
         so the accessibility intent here is total suppression
         rather than the amplitude-only-freeze pattern the HUD
         waveform uses. The standalone block keeps the winter
         feature self-contained rather than threading two new
         selectors through the ambient-stage block.
       - app.js top-of-file ownership. themeToggle, mapleLeaves,
         mapleLeavesFront, snowFlakes, snowFlakesFront, and
         starField — all six element lookups — plus currentTheme,
         _themeManuallySet, and _activeAmbientTrackName, now live
         together in the theme-toggle block at the top of app.js.
         The previous arrangement declared mapleLeaves and
         mapleLeavesFront 60% down the file in DOM REFS while
         applyTheme() — defined at the very top — read both. var
         hoisting made it work at runtime, but it was a top-of-
         file dependency on a lower-section assignment with no
         syntactic indication. With <script defer> the parser has
         finished before module evaluation, so the six lookups
         resolve immediately and the theme subsystem owns its
         full state surface at the point of definition.
         stageLattice stays in DOM REFS — it is consumed by
         applySwellToCSS() inside the swell loop, which is
         unrelated to theme ownership.
       - Cold-boot ordering in window.load. startInfoUpdates()
         runs first, which synchronously calls updateInfoDateTime()
         and may flip the theme to winter via the December check.
         buildMotes(), buildSnowflakes(), and buildStars() follow,
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
       - Shippo tracer refactor: concave 4-point star (Hoshi-gata)
         replaces the circle trace.
       - Star placement is unrestricted.
       - Shippo tracer fix: scheduleShippoTracer() no longer calls
         stopShippoTracer() at its head.
       - Ambient Shippo mosaic + circle tracer.
       - Ambient video removed, replaced by CSS light mesh.
       - Default theme switched to autumn.
       - Backdrop-filters removed on overlays.
       - Koi tap flinch gated on the koi PNG.
       - Ambient subtle ripples on the koi screen.
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
   All six element refs and all three state variables live together
   at the top of the file so the theme subsystem owns its full state
   surface at the point of definition. app.js loads with
   <script defer>, so the DOM is fully parsed when this block runs —
   every getElementById resolves immediately, and applyTheme() /
   updateStarFieldVisibility() never read a value that has not yet
   been assigned.

   _themeManuallySet suppresses the December auto-switch for the rest
   of the page session once the user taps the toggle. Reload resets
   it. _activeAmbientTrackName records the logical phase key of the
   ambient track currently playing (null when idle); it is the third
   clause in updateStarFieldVisibility()'s gate. */
var themeToggle = document.getElementById('themeToggle');
var mapleLeaves = document.getElementById('mapleLeaves');
var mapleLeavesFront = document.getElementById('mapleLeavesFront');
var snowFlakes = document.getElementById('snowFlakes');
var snowFlakesFront = document.getElementById('snowFlakesFront');
var starField = document.getElementById('starField');
var currentTheme = 'autumn';
var _themeManuallySet = false;
var _activeAmbientTrackName = null;

function isWarmPaletteTheme(theme) {
  return theme === 'autumn' || theme === 'winter';
}

/* True from 1 Dec 00:01 JST through 31 Dec 23:59 JST */
function isNagoyaWinterSeason() {
  var p = nagoyaDateParts();
  if (p.month !== 12) return false;
  return (p.day > 1 || p.hour > 0 || p.minute >= 1);
}

/* Stars only appear when:
   1. Theme is 'autumn' or 'winter' (isWarmPaletteTheme)
   2. Carousel is active (post-name-intro, #mapleLeaves has .active)
   3. Late-night ambient music ('latenight') is actively playing */
function updateStarFieldVisibility() {
  if (!starField) return;
  var isCarouselRunning = !!(mapleLeaves && mapleLeaves.classList.contains('active'));
  var isLateNightPlaying = (ambientSource !== null && _activeAmbientTrackName === 'latenight');
  starField.classList.toggle('active', isWarmPaletteTheme(currentTheme) && isCarouselRunning && isLateNightPlaying);
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

     The ambient sound rotation, the audio-reactive swell loop, and
     the late-night starfield share this exact lifecycle so a mid-
     run theme toggle cannot leave sound, animation, or stars
     running alone against a sakura theme. */
  var isCarouselRunning = mapleLeaves && mapleLeaves.classList.contains('active');
  updateStarFieldVisibility();
  if (isWarmPaletteTheme(theme) && isCarouselRunning) {
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

var DROP_SOUND_URL = 'Sound/cave-water-drop-echo-a053fcdf.mp3';
var STREAM_SOUND_URL = 'Sound/alex_jauk-calm-zen-river-flowing-228223.mp3';
var WIND_CHIME_URL = 'Sound/freesound_community-wind-chimes-32150.mp3';

/* ============ TRACK METADATA (3 PHASES, 3 PHYSICAL BUFFERS) ============
   Three Nagoya time phases, three distinct MP3 files. The
   bufferName field is the physical soundBuffers key; for the
   current configuration each phase resolves to a 1:1 buffer, but
   the indirection is preserved so a future change (e.g. sharing
   one clip across two phases, or a dedicated late-night clip
   replacing the placeholder) does not require editing the loader
   or the playback path.

     morning      05:00–16:59  Sound/Morning.mp3       (17 min, full)
     earlyevening 17:00–21:59  Sound/Earlyevening.mp3  (~16 min, capped at 16:00)
     latenight    22:00–04:59  Sound/Latenight.mp3     (18 min, full)

   Each play runs the buffer end-to-end — or up to maxPlaySec, if
   set — with a linear fade-in at the head and a linear fade-out at
   the tail, then immediately re-arms for the next cycle. The hour
   check runs at play time, not at schedule time, so a clip that is
   mid-flight when the wall clock crosses a bucket boundary
   finishes naturally and the next cycle picks the correct track.

   Peaks are 1.00 for all three beds, tuned by ear against the
   wind chime layer that sits on top during the morning window.
   Lifecycle is shared with the chime, the audio-reactive swell
   loop, and the late-night starfield via the .active class on
   #mapleLeaves. */
var AMBIENT_TRACKS = [
  {
    name: 'morning',
    bufferName: 'morning',
    url: 'Sound/Morning.mp3',
    title: '草原の風',
    artist: '小久保隆',
    peak: 1.00,
    maxPlaySec: null
  },
  {
    name: 'earlyevening',
    bufferName: 'earlyevening',
    url: 'Sound/Earlyevening.mp3',
    title: '虹を見た日',
    artist: '小久保隆',
    peak: 1.00,
    maxPlaySec: 16 * 60
  },
  {
    name: 'latenight',
    bufferName: 'latenight',
    url: 'Sound/Latenight.mp3',
    title: 'カタライザー',
    artist: '小久保隆',
    peak: 1.00,
    maxPlaySec: null
  }
];

var AMBIENT_FADE_IN  = 3.0;  // seconds
var AMBIENT_FADE_OUT = 4.0;  // seconds

/* Wind chime layer. Runs only during the morning window
   (05:00–16:59 Nagoya) and layers on top of Morning.mp3. */
var WIND_CHIME_PEAK        = 0.600;
var WIND_CHIME_PLAY_MIN    = 12;    // seconds
var WIND_CHIME_PLAY_MAX    = 14;    // seconds
var WIND_CHIME_FADE_IN     = 2.0;   // seconds
var WIND_CHIME_FADE_OUT    = 1.5;   // seconds
var WIND_CHIME_SILENCE_MIN = 500;   // ms
var WIND_CHIME_SILENCE_MAX = 2000;  // ms

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
     · hudStatusBadge (top-left)  — 待機中 / 再生中 / 展開中 / 待機完了
     · hudPctStatus   (top-right) — DL XX% / PCM展開中 / DL 100%
     · hudTrackTitle · hudTrackArtist (centred meta row)
     · hudCanvas (288×44, six-layer fluid waveform)
     · hudGaugeFill (playback progress with glowing playhead)
     · hudTimeElapsed / hudTimeTotal (split timestamps below the bar)

   Status and download have independent DOM targets under the
   revamp, so the cold-launch dual-writer race that previously
   flapped the single label row between "DL 48%" and "00:04 /
   17:00" is structurally closed. */
var audioSpectrumHud = document.getElementById('audioSpectrumHud');
var hudTrackTitle    = document.getElementById('hudTrackTitle');
var hudTrackArtist   = document.getElementById('hudTrackArtist');
var hudStatusBadge   = document.getElementById('hudStatusBadge');
var hudCanvas        = document.getElementById('hudCanvas');
var hudCtx           = hudCanvas ? hudCanvas.getContext('2d') : null;
var hudGaugeFill     = document.getElementById('hudGaugeFill');
var hudPctStatus     = document.getElementById('hudPctStatus');
var hudTimeElapsed   = document.getElementById('hudTimeElapsed');
var hudTimeTotal     = document.getElementById('hudTimeTotal');

/* Must equal .audio-spectrum-hud's content-box width in main.css:
   318px card − 2px borders − 28px horizontal padding = 288. The
   canvas backing store is sized to this constant; drift re-
   introduces the aspect stretch the v1.3 amendment closed. */
var HUD_DISPLAY_W = 288;
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
  if (!hudStatusBadge || !hudGaugeFill) return;

  var totalExpected = 0;
  var totalLoaded = 0;
  for (var url in _hudBytesTotalMap) {
    totalExpected += _hudBytesTotalMap[url];
    totalLoaded += (_hudBytesLoadedMap[url] || 0);
  }
  /* 41 MB fallback (16 + 16 + 9) before Content-Length headers resolve */
  if (totalExpected === 0) totalExpected = 41000000;

  var pct = Math.min(1.0, totalLoaded / totalExpected);
  var pctInt = Math.round(pct * 100);
  var isPlaying = (ambientSource !== null);

  var currentTrack = getCurrentAmbientTrack();
  var slotReady = !!(soundBuffers && soundBuffers[currentTrack.bufferName]);
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
  hudStatusBadge.classList.remove('loading', 'decoding', 'ready');
  if (hudPctStatus) hudPctStatus.classList.remove('decoding', 'ready');

  /* Top-right yellow box — download / decompression progress.
     Independent of the status badge so background download of
     Tracks 2 and 3 stays visible while Track 1 is playing. */
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

  /* Top-left red box — playback status. Gauge fill classes carry
     the amber→plum readiness signal; the width is owned by the
     swell loop during playback. */
  if (isPlaying) {
    hudStatusBadge.textContent = '再生中';
    hudStatusBadge.classList.add('ready');

    /* Plum fill only when all three raw MP3s are downloaded. The
       amber→plum transition signals background I/O completion and
       must not be short-circuited by the fact that the currently-
       playing slot is, by definition, decoded. */
    if (pct >= 1.0) {
      hudGaugeFill.classList.add('ready');
    }

    var elapsed = getPlaybackElapsed();
    if (hudTimeElapsed) hudTimeElapsed.textContent = formatHudTime(elapsed);
    if (hudTimeTotal)   hudTimeTotal.textContent   = formatHudTime(ambientPlayDurationSec);
    _hudLastRenderedSec = Math.floor(elapsed);
  } else if (!slotReady || pct < 1.0) {
    /* Priority 2 — either the active slot is decoding, or raw
       streams are still in flight. Both must resolve before the
       badge may claim 待機完了, so the badge and gauge stay in
       agreement throughout the cold-launch window. Only claim
       PCM decompression when the raw bytes are actually resident. */
    if (isDecodingCurrent) {
      hudGaugeFill.classList.add('decoding');
      hudStatusBadge.textContent = '展開中';
      hudStatusBadge.classList.add('decoding');
    } else {
      hudStatusBadge.textContent = '待機中';
      hudStatusBadge.classList.add('loading');
    }
    if (hudTimeElapsed) hudTimeElapsed.textContent = '00:00';
    if (hudTimeTotal)   hudTimeTotal.textContent   = '--:--';
  } else {
    /* Priority 3 — active slot decoded AND all raw buffers
       resident in RAM. */
    hudGaugeFill.classList.add('ready');
    hudStatusBadge.textContent = '待機完了';
    hudStatusBadge.classList.add('ready');
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
  if (ambientSource === null) return;
  if (ambientPlayStartTime < 0 || ambientPlayDurationSec <= 0) return;

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
function loadAudioBufferRaw(url) {
  return fetch(url)
    .then(function(res) {
      if (!res.ok) throw new Error('audio fetch failed: ' + url);
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
   one of the three Nagoya bucket edges (05:00, 17:00, 22:00 JST).
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
   already governs the chime, swell loop, and starfield. Arming
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
  var p = nagoyaDateParts();
  var h = p.hour;
  if (h >= 5 && h < 17)  return AMBIENT_TRACKS[1]; // Next: 17:00 Early Evening
  if (h >= 17 && h < 22) return AMBIENT_TRACKS[2]; // Next: 22:00 Late Night
  return AMBIENT_TRACKS[0];                        // Next: 05:00 Morning
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

  if (h < 5) {
    targetHour = 5;
  } else if (h < 17) {
    targetHour = 17;
  } else if (h < 22) {
    targetHour = 22;
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

/* Streaming loader for non-ambient one-shots (drop, stream,
   chime). These are small enough to decode inline — the split
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
  var col0 = isAutumn ? '#882E47' : '#b04a5a';
  var col1 = isAutumn ? '#C44E10' : '#a34a56';
  var col2 = isAutumn ? '#E66826' : '#d46a7a';
  var col3 = isAutumn ? '#F07D40' : '#e8a8b0';
  var col4 = isAutumn ? '#FFA259' : '#e8b4bc';
  var col5 = '#FFFDF9';

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
  drawFluidRibbon(2, col2, 0.42,  1.35, 3.4, 2.4, 0.92);
  drawFluidRibbon(3, col3, 0.50, -1.10, 5.1, 2.8, 0.86);
  drawFluidRibbon(4, col4, 0.44,  1.25, 6.8, 3.2, 0.78);
  drawFluidRibbon(5, col5, 0.32, -0.85, 8.5, 3.6, 0.62);
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

    loadAudioBuffer(WIND_CHIME_URL).then(function(buf) {
      if (buf) soundBuffers.windChime = buf;
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
   playback-window state stays in one cohort.

   _activeAmbientTrackName records the logical phase key of the
   track that is currently audible — null when idle. It is the
   third clause in updateStarFieldVisibility()'s gate, so the
   late-night starfield ignites only when カタライザー is actually
   playing. */
var ambientTimer = null;
var ambientSource = null;
var ambientGain = null;
var _ambientBufferRetries = 0;
var ambientPlayStartTime = -1;
var ambientPlayDurationSec = 0;

/* Three-way Nagoya hour dispatch. Function declarations hoist, so
   referencing nagoyaDateParts here — even though it is declared
   later in the file — is safe at runtime. */
function getCurrentAmbientTrack() {
  var p = nagoyaDateParts();
  var h = p.hour;
  if (h >= 5 && h < 17)  return AMBIENT_TRACKS[0]; // 05:00–16:59 Morning
  if (h >= 17 && h < 22) return AMBIENT_TRACKS[1]; // 17:00–21:59 Early evening
  return AMBIENT_TRACKS[2];                        // 22:00–04:59 Late night
}

function startAmbient() {
  stopAmbient();
  _ambientBufferRetries = 0;
  ambientTimer = setTimeout(function() {
    ambientTimer = null;
    var playMs = playAmbientSound();
    scheduleNextAmbient(playMs);
  }, 0);
  startWindChime();
  startSwellLoop();
  /* Arm the phase-boundary pre-decode scheduler here rather than in
     initSound(). The scheduler's lifecycle is now tied to the same
     .active gate the chime and swell loop share: a return-to-start
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
  stopWindChime();
  stopSwellLoop();
  _ambientBufferRetries = 0;
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
  _activeAmbientTrackName = null;
  ambientPlayStartTime = -1;
  ambientPlayDurationSec = 0;
  _hudLastRenderedSec = -1;

  /* Starfield reads the cleared playback window on the same tick
     as the HUD badge revert below — both writers observe the same
     state. */
  updateStarFieldVisibility();

  /* Badge revert to standby via the single-authority renderer */
  _hudRenderState();
}

function playAmbientSound() {
  /* Terminal guards: sound disabled, non-warm-palette theme, or
     carousel inactive. Each of these states is not expected to
     flip without a fresh user gesture (or a full reload), so the
     scheduler stops rather than retrying. */
  if (!SOUND_ENABLED) return 0;
  if (!isWarmPaletteTheme(currentTheme)) return 0;
  if (!mapleLeaves || !mapleLeaves.classList.contains('active')) return 0;

  /* Terminal guard: AudioContext failed or unavailable. Since
     initSound() already ran via the first pointerdown before
     startAmbient() could fire, a null soundAudioCtx here means
     AudioContext construction failed or is unsupported — waiting
     500ms will never change that. */
  if (!soundAudioCtx) return 0;

  var track = getCurrentAmbientTrack();
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
  if (hudTrackTitle)  hudTrackTitle.textContent = track.title;
  if (hudTrackArtist) hudTrackArtist.textContent = track.artist;

  /* Release every other decoded slot's PCM before we commit to
     this one. Safe: the currently-playing AudioBufferSourceNode
     (if any) holds its own strong reference to its buffer, so a
     cross-boundary fade-out is unaffected. */
  releaseNonCurrentAmbientSlots(track.bufferName);

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

  var maxFade = playDur * 0.10;
  var fadeIn  = Math.min(AMBIENT_FADE_IN,  maxFade);
  var fadeOut = Math.min(AMBIENT_FADE_OUT, maxFade);
  var peak = track.peak;

  var now = soundAudioCtx.currentTime;
  var src = soundAudioCtx.createBufferSource();
  src.buffer = buffer;
  var gain = soundAudioCtx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(peak, now + fadeIn);
  gain.gain.setValueAtTime(peak, now + playDur - fadeOut);
  gain.gain.linearRampToValueAtTime(0, now + playDur);

  src.connect(gain);
  gain.connect(soundMasterGain);
  src.start(now);
  src.stop(now + playDur + 0.1);

  ambientSource = src;
  ambientGain = gain;
  ambientPlayStartTime = now;
  ambientPlayDurationSec = playDur;
  _activeAmbientTrackName = track.name;
  updateStarFieldVisibility();

  /* Badge transitions to 再生中 via the single-authority renderer */
  _hudRenderState();

  src.onended = function() {
    /* The source is stopped 100ms past the fade-out tail while
       scheduleNextAmbient() re-arms right on playDur, so src1's
       onended can fire during the first frames of src2. Guarding
       the timing reset behind the identity check keeps src2's
       start time and duration intact — without this, the HUD
       pins to 00:00 / 00:00 after every track transition.

       The starfield reset rides in the same guard for the same
       reason: a same-track loop's src1.onended must not clear
       _activeAmbientTrackName, because src2 has already set it. */
    if (ambientSource === src) {
      ambientSource = null;
      _activeAmbientTrackName = null;
      ambientPlayStartTime = -1;
      ambientPlayDurationSec = 0;
      _hudLastRenderedSec = -1;
      updateStarFieldVisibility();
    }
    if (ambientGain === gain) ambientGain = null;
    try { gain.disconnect(); } catch (e) {}
    /* Defensive: keep the HUD in sync if the re-arm timing changes */
    _hudRenderState();
  };

  return playDur * 1000;
}

/* ============ WIND CHIME ROTATION ============ */
var windChimeTimer = null;
var windChimeSource = null;
var windChimeGain = null;

function isMorningWindChimeHours() {
  var p = nagoyaDateParts();
  return (p.hour >= 5 && p.hour < 17);
}

function startWindChime() {
  stopWindChime();
  windChimeTimer = setTimeout(function() {
    windChimeTimer = null;
    var playMs = playWindChimeSound();
    scheduleNextWindChime(playMs);
  }, 0);
}

function scheduleNextWindChime(prevPlayMs) {
  var delay;
  if (!isMorningWindChimeHours()) {
    delay = 60000;
  } else {
    var silenceGap = WIND_CHIME_SILENCE_MIN +
      Math.random() * (WIND_CHIME_SILENCE_MAX - WIND_CHIME_SILENCE_MIN);
    delay = (prevPlayMs || 0) + silenceGap;
  }
  windChimeTimer = setTimeout(function() {
    windChimeTimer = null;
    var playMs = playWindChimeSound();
    scheduleNextWindChime(playMs);
  }, delay);
}

function stopWindChime() {
  if (windChimeTimer) {
    clearTimeout(windChimeTimer);
    windChimeTimer = null;
  }
  if (windChimeSource && windChimeGain && soundAudioCtx) {
    try {
      var now = soundAudioCtx.currentTime;
      windChimeGain.gain.cancelScheduledValues(now);
      windChimeGain.gain.setTargetAtTime(0, now, 0.1);
      windChimeSource.stop(now + 0.5);
    } catch (e) {
      try { windChimeSource.stop(); } catch (e2) {}
    }
  }
  windChimeSource = null;
  windChimeGain = null;
}

function playWindChimeSound() {
  if (!SOUND_ENABLED || !soundReady || !soundAudioCtx) return 0;
  if (!mapleLeaves || !mapleLeaves.classList.contains('active')) return 0;
  if (!isMorningWindChimeHours()) return 0;

  var buffer = soundBuffers.windChime;
  if (!buffer) return 0;

  var bufferDur = buffer.duration;
  var playDur = WIND_CHIME_PLAY_MIN +
    Math.random() * (WIND_CHIME_PLAY_MAX - WIND_CHIME_PLAY_MIN);
  if (playDur > bufferDur - 1) playDur = bufferDur - 1;
  if (playDur <= 0) return 0;

  var maxStart = Math.max(0, bufferDur - playDur - 0.5);
  var startOffset = Math.random() * maxStart;

  var fadeIn  = Math.min(WIND_CHIME_FADE_IN,  playDur * 0.25);
  var fadeOut = Math.min(WIND_CHIME_FADE_OUT, playDur * 0.35);
  var peak = WIND_CHIME_PEAK;

  var now = soundAudioCtx.currentTime;
  var src = soundAudioCtx.createBufferSource();
  src.buffer = buffer;
  var gain = soundAudioCtx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(peak, now + fadeIn);
  gain.gain.setValueAtTime(peak, now + playDur - fadeOut);
  gain.gain.linearRampToValueAtTime(0, now + playDur);

  src.connect(gain);
  gain.connect(soundMasterGain);
  src.start(now, startOffset, playDur + 0.1);
  src.stop(now + playDur + 0.15);

  windChimeSource = src;
  windChimeGain = gain;

  src.onended = function() {
    if (windChimeSource === src) windChimeSource = null;
    if (windChimeGain === gain) windChimeGain = null;
    try { gain.disconnect(); } catch (e) {}
  };

  return playDur * 1000;
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

  if (!_scrollActive) {
    applySwellToCSS(swellEnergy);
    if (_hudShouldDraw()) {
      drawHudSpectrum();
      updateHudProgress();
    }
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

/* ============ QUOTES ============ */
var AMBIENT_LINES = [
  '静かな時間も、また大切な時間です。',
  'お茶の香りも、どうぞごゆっくりお楽しみください。',
  '窓の外の音に、そっと耳を澄ましてみてください。',
  'どうぞ、心穏やかな時間をお過ごしください。'
];
function loadQuotesFromServer() {
  return fetch('quotes.json')
    .then(function(r) { if (!r.ok) throw new Error(); return r.json(); })
    .then(function(data) {
      if (data && Array.isArray(data.quotes) && data.quotes.length > 0) AMBIENT_LINES = data.quotes.slice();
      return AMBIENT_LINES;
    })
    .catch(function() { return AMBIENT_LINES; });
}

/* ============ PANEL LOADER ============ */
var panel3DefaultHtml = '';
var panel3NoHtml = '';
var transitionBodyDefault = '';
var transitionBodyNoPresets =
  'それでは、本日は少し特別な癒しのオプションについてご相談がございます。<br><br>' +
  'もし、ご自身からご提案いただけるサービスなどがございましたら、下の空欄にご自由にご記入いただき、ご希望の料金をご入力ください。<br><br>' +
  'もちろん、もしご提案が難しい場合は、無理にご提案いただかなくても大丈夫です。すべて見送っていただいても構いません。<br><br>' +
  'ありがとうございます。';

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
   Theme-owned refs (themeToggle, mapleLeaves, mapleLeavesFront,
   snowFlakes, snowFlakesFront, starField) live at the top of the
   file — see the THEME TOGGLE block. stageLattice stays here
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
var nameColumn = document.getElementById('nameColumn');
var introHasRun = false;

var blossomGreetingTimeEl = document.getElementById('blossomGreetingTime');
var blossomGreetingNameEl = document.getElementById('blossomGreetingName');

var koiDiveWrap = document.getElementById('koiDiveWrap');
var rippleLayer = document.getElementById('rippleLayer');

var stageLattice = document.getElementById('stageLattice');

var submitBtn = document.getElementById('submitBtn');
var confirmScreen = document.getElementById('confirmScreen');
var confirmYes = document.getElementById('confirmYes');
var confirmNo = document.getElementById('confirmNo');
var receiptScreen = document.getElementById('receiptScreen');
var receiptItems = document.getElementById('receiptItems');
var receiptConfirmBtn = document.getElementById('receiptConfirmBtn');
var receiptBackBtn = document.getElementById('receiptBackBtn');

var thankyouScreen = document.getElementById('thankyouScreen');

var infoBar = document.getElementById('infoBar');
var infoCity = document.getElementById('infoCity');
var infoDate = document.getElementById('infoDate');
var infoTime = document.getElementById('infoTime');
var infoTemp = document.getElementById('infoTemp');
var infoWeather = document.getElementById('infoWeather');
var tickerWrap = document.getElementById('tickerWrap');
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
var blossomDivider = document.getElementById('blossomDivider');
var quoteLine = document.getElementById('quoteLine');
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
  else { numpadAppend(target, key); haptic(8); }
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
function updateNumpadVisibility() {
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
  playPaper(true);
  tanzakuTargetRow = row;
  tanzakuInput.value = svcInput.value || '';
  tanzakuScreen.classList.add('visible');
  setTimeout(function() {
    try { tanzakuInput.focus(); } catch (e) {}
    try {
      var len = tanzakuInput.value.length;
      tanzakuInput.setSelectionRange(len, len);
    } catch (e) {}
  }, 100);
}
function closeTanzaku() {
  playPaper(false);
  tanzakuScreen.classList.remove('visible');
  try { tanzakuInput.blur(); } catch (e) {}
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

  fireBeat(beat1);

  function startBodyReveal() {
    if (!body) return;
    var phrases = body.querySelectorAll('.panel-phrase');
    if (!phrases.length) return;
    var baseDelay = 0;
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
  clearKoiTimers();
  resetWind();

  if (mapleLeaves) mapleLeaves.classList.remove('active');
  if (mapleLeavesFront) mapleLeavesFront.classList.remove('active');
  if (snowFlakes) snowFlakes.classList.remove('active');
  if (snowFlakesFront) snowFlakesFront.classList.remove('active');
  if (starField) starField.classList.remove('active');
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
}

function updateGlobalHint() {
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
  track.style.transform = 'translateX(-' + (currentPanel * (100 / totalPanels)) + '%)';
  for (var i = 0; i < dots.length; i++) dots[i].classList.toggle('active', i === currentPanel);
  activatePanel(currentPanel);
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
  row.classList.remove('service-hint');
  void row.offsetWidth;
  row.classList.add('service-hint');
  setTimeout(function() { row.classList.remove('service-hint'); }, 1000);
  try { row.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {}
}
function tryOpenCustomService(row, withHint) {
  if (!row) return;
  if (!isAllowedCustomRow(row)) {
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
   the snowflakes and stars (decoration, fully suppressed). */
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
    setTimeout(function() { try { input.select(); } catch (err) {} }, 50);
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
    setTimeout(function() { try { input.select(); } catch (err) {} }, 50);
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
    setTimeout(function() { tipInput.select(); }, 50);
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
  MAX_ZONE_PX: 420
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

  for (var i = 0; i < totalItems; i++) {
    var item = driftItems[i];
    var lineDistFromCenter = i - centerIdx;

    var itemMaxSpread = DRIFT_CONFIG.MAX_LINE_SPREAD_PX * (Math.abs(lineDistFromCenter) / centerIdx);
    var rawSpread = lineDistFromCenter * (absDist * DRIFT_CONFIG.LINE_SPREAD_FACTOR);
    var relativeSeparation = Math.max(-itemMaxSpread, Math.min(itemMaxSpread, rawSpread)) * envelope;

    var totalY = globalShift + relativeSeparation;

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
      r.style.animationDelay = (idx * 80) + 'ms';
      r.style.width  = (baseSize + idx * 6) + 'px';
      r.style.height = (baseSize + idx * 6) + 'px';
      rippleLayer.appendChild(r);
      setTimeout(function() {
        if (r.parentNode) r.parentNode.removeChild(r);
      }, 1185 + idx * 80);
    })(i);
  }
}

function renderIntroGlyph(text) {
  if (!nameColumn) return;
  nameColumn.innerHTML = '';
  var chars = (text || '心').split('');
  for (var i = 0; i < chars.length; i++) {
    var span = document.createElement('span');
    span.className = 'name-char';
    span.textContent = chars[i];
    span.style.animationDelay = (i * 0.22) + 's';
    nameColumn.appendChild(span);
  }
}

function isBlossomInteractive() {
  return blossomScreen && blossomScreen.classList.contains('visible') && !introHasRun;
}

function stopAmbientRipple() {
  if (ambientRippleTimer) {
    clearTimeout(ambientRippleTimer);
    ambientRippleTimer = null;
  }
}

function spawnAmbientBurst() {
  if (!rippleLayer) return;
  var count = 1 + Math.floor(Math.random() * 5);
  var inset = 40;
  var vw = window.innerWidth;
  var vh = window.innerHeight;
  for (var i = 0; i < count; i++) {
    (function(idx) {
      var delay = idx * 80;
      setTimeout(function() {
        if (!isBlossomInteractive()) return;
        var x = inset + Math.random() * Math.max(1, vw - inset * 2);
        var y = inset + Math.random() * Math.max(1, vh - inset * 2);
        spawnRipples(x, y, 'subtle');
      }, delay);
    })(i);
  }
}

function scheduleAmbientRipple() {
  stopAmbientRipple();
  var interval = 2500 + Math.random() * 2500;
  ambientRippleTimer = setTimeout(function() {
    ambientRippleTimer = null;
    if (isBlossomInteractive()) {
      spawnAmbientBurst();
      scheduleAmbientRipple();
    }
  }, interval);
}

/* ============ AMBIENT LEAF DISTRIBUTION ============
   Called at the moment the carousel activates. Returns any leaves
   previously promoted to the front overlay (fresh start on
   re-entry), collects the mid + near pool from the back overlay,
   and Fisher-Yates-partial-shuffles two of them into the front.

   The far-plane leaves are deliberately excluded from the pool —
   the depth-of-field layer always stays behind the text. See
   main.css for the scoped opacity override (mid 0.86 / near 0.90)
   that makes front-promoted leaves read at higher opacity so the
   text behind them visibly disappears during a crossing. */
function distributeFrontLeaves() {
  if (!mapleLeavesFront || !mapleLeaves) return;

  /* Return any leaves previously promoted to the front overlay.
     Clear the runtime-assigned left so each leaf reverts to its
     authored back-plane position (the per-leaf classes in main.css)
     before it re-enters the pool. The reference must be captured
     before appendChild, because appendChild mutates firstChild. */
  while (mapleLeavesFront.firstChild) {
    var returning = mapleLeavesFront.firstChild;
    returning.style.left = '';
    mapleLeaves.appendChild(returning);
  }

  /* Pool = all mid + near leaves now in the back overlay. Far-plane
     leaves are deliberately excluded — the depth-of-field layer
     stays behind the text. */
  var pool = [];
  var midNear = mapleLeaves.querySelectorAll('.leaf-mid, .leaf-near');
  for (var i = 0; i < midNear.length; i++) pool.push(midNear[i]);
  if (pool.length < 2) return;

  /* Fisher–Yates partial shuffle: move two random leaves to the
     front overlay. Only the first two positions need to be settled.

     Each promoted leaf gets a randomised horizontal position in the
     25–75% band so both crossings reliably intersect the text
     column at every breakpoint. Without this, a leaf drawn from the
     edge cluster (6 of the 12 pool leaves sit at left 5–14% or
     88–92%) drifts only ±40px — roughly ±10% of a phone viewport —
     and never reaches the prose. Two edge draws co-occur on
     ~23% of activations, which read as "no leaves in front". The
     inline left is cleared in the return loop above so the next
     activation re-rolls cleanly. */
  for (var j = 0; j < 2; j++) {
    var k = j + Math.floor(Math.random() * (pool.length - j));
    var tmp = pool[j]; pool[j] = pool[k]; pool[k] = tmp;
    pool[j].style.left = (25 + Math.random() * 50) + '%';
    mapleLeavesFront.appendChild(pool[j]);
  }
}

/* ============ WINTER SNOWFLAKES + LATE-NIGHT STARFIELD BUILDERS ===
   Two standalone 6-fold snowflake SVG shapes from the reference
   image. Shape A is the Dendritic Ring-Centre Crystal, Shape B is
   the Diamond-Tipped Crystal with inner secondary rays. The two
   shapes are authored 1:2 across the 32-particle pool (indices
   0..17 explicit, 18..31 scattered). */
var SNOWFLAKE_PATH_A =
  '<path fill-rule="evenodd" d="M 96.0,75.0 L 96.0,59.6 L 71.2,34.8 L 76.0,30.0 L 96.0,50.0 L 96.0,42.6 L 78.7,25.3 L 83.5,20.5 L 96.0,33.0 L 96.0,28.0 L 90.5,24.5 L 100.0,10.0 L 109.5,24.5 L 104.0,28.0 L 104.0,33.0 L 116.5,20.5 L 121.3,25.3 L 104.0,42.6 L 104.0,50.0 L 124.0,30.0 L 128.8,34.8 L 104.0,59.6 L 104.0,75.0 L 116.5,71.4 L 119.7,84.0 L 133.0,76.3 L 142.1,42.5 L 148.6,44.2 L 141.3,71.5 L 147.7,67.8 L 154.0,44.2 L 160.6,46.0 L 156.0,63.0 L 160.4,60.5 L 160.6,54.0 L 177.9,55.0 L 170.1,70.5 L 164.4,67.5 L 160.0,70.0 L 177.1,74.5 L 175.3,81.1 L 151.7,74.8 L 145.3,78.5 L 172.6,85.8 L 170.9,92.3 L 137.0,83.3 L 123.7,91.0 L 133.0,100.0 L 123.7,109.0 L 137.0,116.7 L 170.9,107.7 L 172.6,114.2 L 145.3,121.5 L 151.7,125.2 L 175.3,118.9 L 177.1,125.5 L 160.0,130.0 L 164.4,132.5 L 170.1,129.5 L 177.9,145.0 L 160.6,146.0 L 160.4,139.5 L 156.0,137.0 L 160.6,154.0 L 154.0,155.8 L 147.7,132.2 L 141.3,128.5 L 148.6,155.8 L 142.1,157.5 L 133.0,123.7 L 119.7,116.0 L 116.5,128.6 L 104.0,125.0 L 104.0,140.4 L 128.8,165.2 L 124.0,170.0 L 104.0,150.0 L 104.0,157.4 L 121.3,174.7 L 116.5,179.5 L 104.0,167.0 L 104.0,172.0 L 109.5,175.5 L 100.0,190.0 L 90.5,175.5 L 96.0,172.0 L 96.0,167.0 L 83.5,179.5 L 78.7,174.7 L 96.0,157.4 L 96.0,150.0 L 76.0,170.0 L 71.2,165.2 L 96.0,140.4 L 96.0,125.0 L 83.5,128.6 L 80.3,116.0 L 67.0,123.7 L 57.9,157.5 L 51.4,155.8 L 58.7,128.5 L 52.3,132.2 L 46.0,155.8 L 39.4,154.0 L 44.0,137.0 L 39.6,139.5 L 39.4,146.0 L 22.1,145.0 L 29.9,129.5 L 35.6,132.5 L 40.0,130.0 L 22.9,125.5 L 24.7,118.9 L 48.3,125.2 L 54.7,121.5 L 27.4,114.2 L 29.1,107.7 L 63.0,116.7 L 76.3,109.0 L 67.0,100.0 L 76.3,91.0 L 63.0,83.3 L 29.1,92.3 L 27.4,85.8 L 54.7,78.5 L 48.3,74.8 L 24.7,81.1 L 22.9,74.5 L 40.0,70.0 L 35.6,67.5 L 29.9,70.5 L 22.1,55.0 L 39.4,54.0 L 39.6,60.5 L 44.0,63.0 L 39.4,46.0 L 46.0,44.2 L 52.3,67.8 L 58.7,71.5 L 51.4,44.2 L 57.9,42.5 L 67.0,76.3 L 80.3,84.0 L 83.5,71.4 Z M 100.0,85.0 A 15.0,15.0 0 1,0 100.0,115.0 A 15.0,15.0 0 1,0 100.0,85.0 Z"/>';

var SNOWFLAKE_PATH_B =
  '<path d="M 91.8,66.6 L 91.2,79.6 L 96.2,87.9 L 96.2,59.3 L 70.7,38.3 A 3.8,3.8 0 0,1 75.5,32.5 L 96.2,49.5 L 96.2,41.5 L 85.5,27.0 L 100.0,10.0 L 114.5,27.0 L 103.8,41.5 L 103.8,49.5 L 124.5,32.5 A 3.8,3.8 0 0,1 129.3,38.3 L 103.8,59.3 L 103.8,87.9 L 108.8,79.6 L 108.2,66.6 L 123.0,60.2 L 124.8,76.2 L 113.3,82.2 L 108.6,90.7 L 133.4,76.4 L 138.8,43.8 A 3.8,3.8 0 0,1 146.2,45.0 L 141.8,71.5 L 148.8,67.5 L 156.0,50.9 L 177.9,55.0 L 170.5,76.1 L 152.6,74.0 L 145.6,78.0 L 170.7,87.5 A 3.8,3.8 0 0,1 168.1,94.5 L 137.2,82.9 L 112.4,97.2 L 122.1,97.4 L 133.0,90.4 L 146.0,100.0 L 133.0,109.6 L 122.1,102.6 L 112.4,102.8 L 137.2,117.1 L 168.1,105.5 A 3.8,3.8 0 0,1 170.7,112.5 L 145.6,122.0 L 152.6,126.0 L 170.5,123.9 L 177.9,145.0 L 156.0,149.1 L 148.8,132.5 L 141.8,128.5 L 146.2,155.0 A 3.8,3.8 0 0,1 138.8,156.2 L 133.4,123.6 L 108.6,109.3 L 113.3,117.8 L 124.8,123.8 L 123.0,139.8 L 108.2,133.4 L 108.8,120.4 L 103.8,112.1 L 103.8,140.7 L 129.3,161.7 A 3.8,3.8 0 0,1 124.5,167.5 L 103.8,150.5 L 103.8,158.5 L 114.5,173.0 L 100.0,190.0 L 85.5,173.0 L 96.2,158.5 L 96.2,150.5 L 75.5,167.5 A 3.8,3.8 0 0,1 70.7,161.7 L 96.2,140.7 L 96.2,112.1 L 91.2,120.4 L 91.8,133.4 L 77.0,139.8 L 75.2,123.8 L 86.7,117.8 L 91.4,109.3 L 66.6,123.6 L 61.2,156.2 A 3.8,3.8 0 0,1 53.8,155.0 L 58.2,128.5 L 51.2,132.5 L 44.0,149.1 L 22.1,145.0 L 29.5,123.9 L 47.4,126.0 L 54.4,122.0 L 29.3,112.5 A 3.8,3.8 0 0,1 31.9,105.5 L 62.8,117.1 L 87.6,102.8 L 77.9,102.6 L 67.0,109.6 L 54.0,100.0 L 67.0,90.4 L 77.9,97.4 L 87.6,97.2 L 62.8,82.9 L 31.9,94.5 A 3.8,3.8 0 0,1 29.3,87.5 L 54.4,78.0 L 47.4,74.0 L 29.5,76.1 L 22.1,55.0 L 44.0,50.9 L 51.2,67.5 L 58.2,71.5 L 53.8,45.0 A 3.8,3.8 0 0,1 61.2,43.8 L 66.6,76.4 L 91.4,90.7 L 86.7,82.2 L 75.2,76.2 L 77.0,60.2 Z"/>';

var SNOW_BASE_SLOTS = [
  /* Tier 1 (Ultra-Far, blur 5.0px) */
  { tier: 1, size: 30, fill: '#9E3B06', left: 22, dur: 20.0, delay: -3.0,  shape: 'A' },
  { tier: 1, size: 28, fill: '#F07D40', left: 16, dur: 21.0, delay: -2.0,  shape: 'B' },
  { tier: 1, size: 30, fill: '#882E47', left: 62, dur: 19.5, delay: -11.0, shape: 'B' },
  /* Tier 2 (Far, blur 3.4px) */
  { tier: 2, size: 34, fill: '#882E47', left: 48, dur: 18.5, delay: -8.0,  shape: 'A' },
  { tier: 2, size: 32, fill: '#E66826', left: 34, dur: 19.0, delay: -6.0,  shape: 'B' },
  { tier: 2, size: 36, fill: '#C44E10', left: 78, dur: 17.5, delay: -14.0, shape: 'B' },
  /* Tier 3 (Mid-Far, blur 2.2px) */
  { tier: 3, size: 48, fill: '#882E47', left: 8,  dur: 13.5, delay: -2.0,  shape: 'A' },
  { tier: 3, size: 46, fill: '#F07D40', left: 14, dur: 14.0, delay: -1.0,  shape: 'B' },
  { tier: 3, size: 42, fill: '#E66826', left: 64, dur: 13.0, delay: -8.0,  shape: 'B' },
  /* Tier 4 (Mid-Near, blur 1.25px) */
  { tier: 4, size: 58, fill: '#C44E10', left: 24, dur: 12.0, delay: -7.0,  shape: 'A' },
  { tier: 4, size: 52, fill: '#882E47', left: 38, dur: 12.5, delay: -5.0,  shape: 'B' },
  { tier: 4, size: 54, fill: '#C44E10', left: 74, dur: 11.5, delay: -9.5,  shape: 'B' },
  /* Tier 5 (Near-Soft, blur 0.55px) */
  { tier: 5, size: 64, fill: '#F07D40', left: 12, dur: 10.2, delay: -3.0,  shape: 'B' },
  { tier: 5, size: 60, fill: '#C44E10', left: 92, dur: 10.0, delay: -12.5, shape: 'B' },
  /* Tier 6 (Near-Crisp, 0px blur) */
  { tier: 6, size: 70, fill: '#E66826', left: 5,  dur: 9.5,  delay: -4.0,  shape: 'A' },
  { tier: 6, size: 74, fill: '#9E3B06', left: 88, dur: 9.8,  delay: -6.0,  shape: 'A' },
  { tier: 6, size: 80, fill: '#9E3B06', left: 42, dur: 10.4, delay: -7.0,  shape: 'B' },
  { tier: 6, size: 68, fill: '#882E47', left: 68, dur: 9.0,  delay: -11.0, shape: 'B' }
];

/* Builds 32 snowflakes (30 back + 2 mid/near candidates for front
   promotion) with snowScale = 1.10 and fallDurationMul = 1.90 baked
   in. See main.css for the seven-tier blur/opacity ladder and the
   snowFallCw / snowFallCcw keyframes. */
function buildSnowflakes() {
  if (!snowFlakes) return;
  snowFlakes.innerHTML = '';
  if (snowFlakesFront) snowFlakesFront.innerHTML = '';

  var total = 32;
  var snowScale = 1.10;
  var fallDurationMul = 1.90;

  for (var i = 0; i < total; i++) {
    var spec = SNOW_BASE_SLOTS[i % SNOW_BASE_SLOTS.length];
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 200 200');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('class', 'snow-particle snow-tier-' + spec.tier);

    var leftPos = (i < SNOW_BASE_SLOTS.length) ? spec.left : (6 + ((i * 19) % 88));
    var sizePx  = Math.round(spec.size * snowScale);
    var durSec  = (spec.dur * fallDurationMul).toFixed(2);
    var delaySec = (i < SNOW_BASE_SLOTS.length)
      ? spec.delay.toFixed(2)
      : (-((i * 2.3) % (spec.dur * fallDurationMul))).toFixed(2);

    svg.setAttribute('data-orig-left', leftPos + '%');
    svg.style.width  = sizePx + 'px';
    svg.style.height = sizePx + 'px';
    svg.style.fill   = spec.fill;
    svg.style.left   = leftPos + '%';
    svg.style.animationName = (i % 2 === 0) ? 'snowFallCw' : 'snowFallCcw';
    svg.style.animationDuration = durSec + 's';
    svg.style.animationDelay = delaySec + 's';

    svg.innerHTML = (spec.shape === 'A') ? SNOWFLAKE_PATH_A : SNOWFLAKE_PATH_B;
    snowFlakes.appendChild(svg);
  }
}

/* Mirrors distributeFrontLeaves(): returns any previously promoted
   snowflakes to #snowFlakes, then promotes 2 random mid/near
   (Tiers 3..6) snowflakes into #snowFlakesFront within the 25–75%
   horizontal band. The far-plane tiers (1..2) are never promoted,
   matching the leaf system's depth-of-field exclusion. */
function distributeFrontSnow() {
  if (!snowFlakesFront || !snowFlakes) return;

  while (snowFlakesFront.firstChild) {
    var returning = snowFlakesFront.firstChild;
    returning.style.left = returning.getAttribute('data-orig-left') || '';
    snowFlakes.appendChild(returning);
  }

  var pool = [];
  var midNear = snowFlakes.querySelectorAll('.snow-tier-3, .snow-tier-4, .snow-tier-5, .snow-tier-6');
  for (var i = 0; i < midNear.length; i++) pool.push(midNear[i]);
  if (pool.length < 2) return;

  for (var j = 0; j < 2; j++) {
    var k = j + Math.floor(Math.random() * (pool.length - j));
    var tmp = pool[j]; pool[j] = pool[k]; pool[k] = tmp;
    pool[j].style.left = (25 + Math.random() * 50).toFixed(1) + '%';
    snowFlakesFront.appendChild(pool[j]);
  }
}

/* Builds 33 far-depth blurred sparkling stars with starDurationMul
   = 1.30 and starScale = 1.15. Each star re-rolls its (left, top)
   coordinates on animationiteration, landing the relocation inside
   the opacity: 0 trough so it reads as a new star appearing rather
   than the existing one drifting. Reduced motion suppresses
   construction entirely — the media query in main.css also kills
   any pre-existing stars, but skipping build saves 33 DOM nodes. */
function buildStars() {
  if (!starField) return;
  starField.innerHTML = '';
  if (_prefersReducedMotion) return;
  var count = 33;
  var starDurationMul = 1.30;
  var starScale = 1.15;

  for (var i = 0; i < count; i++) {
    (function(idx) {
      var s = document.createElement('div');
      var depthCls = (idx % 2 === 0) ? ' star-deep' : '';
      var hueCls   = (idx % 4 === 0) ? ' star-plum' : '';
      s.className = 'sparkle-star' + depthCls + hueCls;
      var baseSize = (idx % 3 === 0) ? (11 + Math.random() * 6)
                   : (idx % 3 === 1) ? (16 + Math.random() * 7)
                   :                   (21 + Math.random() * 8);
      var size = baseSize * starScale;
      s.style.width  = size.toFixed(1) + 'px';
      s.style.height = size.toFixed(1) + 'px';
      s.style.left   = (4 + Math.random() * 92).toFixed(1) + '%';
      s.style.top    = (4 + Math.random() * 92).toFixed(1) + '%';
      var dur = (3.0 + Math.random() * 3.6) * starDurationMul;
      s.style.setProperty('--star-dur', dur.toFixed(2) + 's');
      s.style.setProperty('--star-delay', (-Math.random() * dur).toFixed(2) + 's');

      s.addEventListener('animationiteration', function() {
        s.style.left = (4 + Math.random() * 92).toFixed(1) + '%';
        s.style.top  = (4 + Math.random() * 92).toFixed(1) + '%';
      });
      starField.appendChild(s);
    })(i);
  }
}

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
  stopBlossomStream();
  if (koiGestureState === 'diving' || koiGestureState === 'done' || koiGestureState === 'startling') return;
  koiGestureState = 'startling';
  introHasRun = true;

  playDrop();
  haptic(12);
  document.body.classList.add('info-visible');
  if (infoBar) infoBar.classList.add('shown');
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
      renderIntroGlyph(nameText);
      if (introOverlay) introOverlay.classList.add('active');

      var totalChars = nameText.length;
      var arrivalTime = (totalChars * 220) + 1100;
      var holdTime = 1200;

      koiPushTimer(setTimeout(function() {
        var fadingChars = nameColumn ? nameColumn.querySelectorAll('.name-char') : [];
        for (var f = 0; f < fadingChars.length; f++) {
          fadingChars[f].style.transitionDelay = (f * 0.18) + 's';
        }
        if (introOverlay) introOverlay.classList.add('finishing');
        if (dotsEl) dotsEl.classList.add('visible');
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
           sound layers. All four particle overlays share the same
           .active gate on #mapleLeaves (autumn) / #snowFlakes
           (winter) — the CSS display rule hides the non-matching
           seasonal pair. distributeFrontLeaves() and
           distributeFrontSnow() both run before the .active class
           is added to their front overlays so the shuffle happens
           off-screen.

           startAmbient() runs immediately after this block, and
           its playAmbientSound() call will fire
           updateStarFieldVisibility() with the newly-set
           _activeAmbientTrackName — igniting the late-night
           starfield in one pass if カタライザー is the current
           track. */
        if (mapleLeaves) mapleLeaves.classList.add('active');
        if (mapleLeavesFront) {
          distributeFrontLeaves();
          mapleLeavesFront.classList.add('active');
        }
        if (snowFlakes) snowFlakes.classList.add('active');
        if (snowFlakesFront) {
          distributeFrontSnow();
          snowFlakesFront.classList.add('active');
        }
        if (audioSpectrumHud) audioSpectrumHud.classList.add('shown');
        startAmbient();

        koiPushTimer(setTimeout(function() {
          if (introOverlay) introOverlay.classList.remove('active', 'finishing');
          repositionHintGroupAfterLayout();
          repositionNumpad();
          koiGestureState = 'done';
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
    updateBlossomGreeting();
    tryStartBlossomStream();
    updateAllRowLocks();
    recalc();
    scheduleAmbientRipple();
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
  startInfoUpdates();
  loadPresetsFromServer().then(function() {
    buildNameScreenRows();
    setTimeout(function() { try { nameInput.focus(); } catch (err) {} }, 300);
  });
  loadQuotesFromServer();
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
  /* Winter particles are built once and persist across the session.
     The seasonal gate is CSS-only (display: none for the non-
     matching theme), so the DOM nodes are stable. */
  buildSnowflakes();
  buildStars();

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
        setTimeout(function() { input.select(); }, 50);
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
});

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
receiptConfirmBtn.addEventListener('click', function(e) {
  e.preventDefault();
  haptic(8);
  cancelPendingReceiptShake();

  var activeItems = 0;
  var receiptItemEls = receiptItems.querySelectorAll('.receipt-item');
  for (var i = 0; i < receiptItemEls.length; i++) {
    if (receiptItemEls[i].getAttribute('data-removing') === 'true') continue;
    if (receiptItemEls[i].classList.contains('removing')) continue;
    activeItems++;
  }
  if (activeItems === 0) {
    showAlert(
      'すべての項目が削除されています。',
      '内容をご確認のうえ、もう一度お試しください。',
      null,
      null
    );
    return;
  }

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
});

/* ============ BACK TO TABLE ============ */
function returnToTable() {
  clearAllTyTimers();
  cancelPendingReceiptShake();
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
    quoteLine.classList.remove('shown', 'leaving');
    quoteLine.textContent = '';
    blossomDivider.innerHTML = '';
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
  haptic(10);
  returnToTable();
});

/* ============ MAIN CAROUSEL SWIPE ============ */
var startX = 0, startY = 0, currentX = 0;
var dragging = false, decided = false, isHorizontal = false;
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
      if (isHorizontal) track.classList.add('dragging');
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
      if (panels[currentPanel]) {
        var curC = panels[currentPanel].querySelector('.panel-content');
        if (curC) curC.style.opacity = 1 - dragRatio;
      }
      if (panels[currentPanel + 1]) {
        var nextC = panels[currentPanel + 1].querySelector('.panel-content');
        if (nextC) {
          nextC.style.opacity = dragRatio;
          nextC.style.transform = 'translateX(' + (40 - 40 * dragRatio) + 'px)';
          nextC.style.filter = 'blur(' + (4 - 4 * dragRatio) + 'px)';
        }
      }
    } else if (deltaX > 0) {
      if (panels[currentPanel]) {
        var curC2 = panels[currentPanel].querySelector('.panel-content');
        if (curC2) curC2.style.opacity = 1 - dragRatio;
      }
      if (panels[currentPanel - 1]) {
        var prevC = panels[currentPanel - 1].querySelector('.panel-content');
        if (prevC) {
          prevC.style.opacity = dragRatio;
          prevC.style.transform = 'translateX(' + (-40 + 40 * dragRatio) + 'px)';
          prevC.style.filter = 'blur(' + (4 - 4 * dragRatio) + 'px)';
        }
      }
    }
  }
}
function clearInlineFades() {
  for (var c = 0; c < panels.length; c++) {
    var content = panels[c].querySelector('.panel-content');
    if (content) {
      content.style.opacity = '';
      content.style.transform = '';
      content.style.filter = '';
    }
  }
}
function onTouchEnd() {
  if (!dragging) return;
  dragging = false;
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
  if (receiptScreen && receiptScreen.classList.contains('visible')) return;
  if (window.scrollY > 30) infoBar.classList.add('hidden');
  else infoBar.classList.remove('hidden');
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
function applyTimeTheme() { document.documentElement.setAttribute('data-time', getTimeOfDayInNagoya()); }

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

  el.innerHTML = '<p>' + entry.text + '</p><p>' + closing + '</p>';

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
            '&current=temperature_2m,weather_code&timezone=Asia%2FTokyo';
  fetch(url).then(function(r) { return r.json(); }).then(function(data) {
    if (!data || !data.current) return;
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
  var html = '<span>' + escapeHtml(half) + '</span><span>' + escapeHtml(half) + '</span>';
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

function updateTySwipeHint() {
  if (!tySwipeHint || !tySwipeHintLabel) return;
  if (tyExited) { tySwipeHint.classList.remove('shown'); return; }
  if (tyCurrentPanel === TY_TOTAL_PANELS - 1) tySwipeHintLabel.textContent = 'もう一度スワイプ';
  else tySwipeHintLabel.textContent = 'スワイプ';
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
  tyTrack.style.transform = 'translateX(-' + (tyCurrentPanel * (100 / TY_TOTAL_PANELS)) + '%)';
  for (var i = 0; i < tyDots.length; i++) tyDots[i].classList.toggle('active', i === tyCurrentPanel);
  activateTyPanel(tyCurrentPanel);
  updateTySwipeHint();
}
function exitTyToQuotes() {
  if (tyExited) return;
  tyExited = true;
  tySwipeHint.classList.remove('shown');
  tyDotsEl.classList.add('hidden');
  tyCarousel.classList.add('hidden-out');
  tyPushTimeout(function() {
    tyAmbientStage.classList.add('shown');
    buildBlossomDivider();
    startQuoteCycle();
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
    if (deltaX < -threshold) { exitTyToQuotes(); return; }
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
    if (deltaX < -threshold) { exitTyToQuotes(); return; }
    if (deltaX > threshold && tyCurrentPanel > 0) { goToTyPanel(tyCurrentPanel - 1); return; }
    goToTyPanel(tyCurrentPanel); return;
  }
  if (deltaX < -threshold && tyCurrentPanel < TY_TOTAL_PANELS - 1) goToTyPanel(tyCurrentPanel + 1);
  else if (deltaX > threshold && tyCurrentPanel > 0) goToTyPanel(tyCurrentPanel - 1);
  else goToTyPanel(tyCurrentPanel);
});

/* ============ QUOTES + BLOSSOMS ============ */
var BLOSSOM_COUNT = 10;
var BLOSSOM_INTERVAL = 1000;
var QUOTE_FADE = 1500;
var tyTimers = [];
var tyIntervals = [];
var currentQuoteIndex = 0;
function clearAllTyTimers() {
  for (var i = 0; i < tyTimers.length; i++) clearTimeout(tyTimers[i]);
  for (var j = 0; j < tyIntervals.length; j++) clearInterval(tyIntervals[j]);
  tyTimers = [];
  tyIntervals = [];
}
function tyPushTimeout(fn, ms) {
  var id = setTimeout(fn, ms);
  tyTimers.push(id);
  return id;
}
function buildBlossomDivider() {
  blossomDivider.innerHTML = '';
  for (var b = 0; b < BLOSSOM_COUNT; b++) {
    var mark = document.createElement('span');
    mark.className = 'blossom-mark';
    mark.textContent = '❀';
    blossomDivider.appendChild(mark);
  }
}
function resetBlossomDivider() {
  var els = blossomDivider.querySelectorAll('.blossom-mark');
  for (var i = 0; i < els.length; i++) {
    els[i].classList.remove('appeared');
    els[i].classList.add('resetting');
  }
}
function startQuoteCycle() { showQuote(0); }
function showQuote(index) {
  currentQuoteIndex = index;
  var text = AMBIENT_LINES[index % AMBIENT_LINES.length];
  buildBlossomDivider();
  quoteLine.textContent = text;
  quoteLine.classList.remove('shown', 'leaving');
  void quoteLine.offsetWidth;
  quoteLine.classList.add('shown');
  tyPushTimeout(function() {
    var els = blossomDivider.querySelectorAll('.blossom-mark');
    var current = 0;
    els[0].classList.add('appeared');
    current = 1;
    var interval = setInterval(function() {
      if (current < BLOSSOM_COUNT) {
        els[current].classList.add('appeared');
        current += 1;
      } else {
        clearInterval(interval);
        tyPushTimeout(function() {
          quoteLine.classList.remove('shown');
          quoteLine.classList.add('leaving');
          resetBlossomDivider();
          tyPushTimeout(function() { showQuote((index + 1) % AMBIENT_LINES.length); }, QUOTE_FADE);
        }, 1000);
      }
    }, BLOSSOM_INTERVAL);
    tyIntervals.push(interval);
  }, 400);
}

/* ============ THANK-YOU SEQUENCE ============ */
function startThankyouSequence() {
  clearAllTyTimers();
  document.body.classList.add('thankyou-active');
  if (tyReceiptBtnLabel) {
    tyReceiptBtnLabel.textContent = rejected ? 'サービス選択に戻る' : '内容を確認する';
  }
  applyTyPanel1Content();
  tyExited = false;
  tyCarousel.classList.remove('hidden-out');
  tyDotsEl.classList.remove('hidden');
  tyAmbientStage.classList.remove('shown');
  quoteLine.classList.remove('shown', 'leaving');
  quoteLine.textContent = '';
  blossomDivider.innerHTML = '';
  tyReceiptBtn.classList.add('shown');
  tyCurrentPanel = 0;
  tyTrack.style.transform = 'translateX(0%)';
  for (var i = 0; i < tyDots.length; i++) tyDots[i].classList.toggle('active', i === 0);
  activateTyPanel(0);
  updateTySwipeHint();
  if (numpad) numpad.classList.remove('visible', 'receipt-mode');
}
function resumeThankyouSequence() {
  applyTyPanel1Content();
  tyReceiptBtn.classList.add('shown');
  if (tyExited) {
    tyAmbientStage.classList.add('shown');
    showQuote(currentQuoteIndex);
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
  buildReceipt();
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
  }, 100);
});

/* ============ BOOTSTRAP ============ */
applyTimeTheme();
setInterval(applyTimeTheme, 5 * 60 * 1000);
updateGlobalHint();