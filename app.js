var BUILD = 'v135';
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
  // the swipe hint and dots sit higher in autumn (see repositionHintGroup)
  if (typeof panels !== 'undefined' && panels && typeof stage !== 'undefined' && stage) repositionHintGroup();
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
   Lifecycle is shared with the chime and the audio-reactive swell
   loop via the .active class on #mapleLeaves. */
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
     · hudCanvas (288×52, six-layer fluid waveform)
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

  /* DL pill, under the end of the artist name — download /
     decompression progress. Independent of the status badge so background
     download of Tracks 2 and 3 stays visible while Track 1 is playing. */
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
   already governs the chime and swell loop. Arming
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
  ambientPlayStartTime = -1;
  ambientPlayDurationSec = 0;
  _hudLastRenderedSec = -1;

  /* Badge revert to standby via the single-authority renderer */
  _hudRenderState();
}

function playAmbientSound() {
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
           sound layers. The particle overlays share the same
           .active gate on #mapleLeaves (autumn) / #snowFlakes
           (winter) — the CSS display rule hides the non-matching
           seasonal pair. */
        if (mapleLeaves) mapleLeaves.classList.add('active');
        if (snowFlakes) snowFlakes.classList.add('active');
        if (audioSpectrumHud) audioSpectrumHud.classList.add('shown');
        startAmbient();

        koiPushTimer(setTimeout(function() {
          if (introOverlay) introOverlay.classList.remove('active', 'finishing');
          if (infoBar) infoBar.classList.add('shown');        /* the toolbar fades in */
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
            '&current=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,cloud_cover,precipitation' +
            '&wind_speed_unit=ms&timezone=Asia%2FTokyo';
  fetch(url).then(function(r) { return r.json(); }).then(function(data) {
    if (!data || !data.current) return;
    if (typeof DynBG !== 'undefined' && DynBG) DynBG.onWeather(data.current);
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

   Sound: the games page opens quietly: the ambient music and the wind
   chime carry on. Only when she taps タッチしてスタート do they fade out
   and a short retro (chiptune) loop, さくら散歩, play instead. If she
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
    /* No new track or chime may start while the old one fades. */
    if (ambientTimer) { clearTimeout(ambientTimer); ambientTimer = null; }
    if (windChimeTimer) { clearTimeout(windChimeTimer); windChimeTimer = null; }
    if (soundAudioCtx) {
      var now = soundAudioCtx.currentTime;
      [ambientGain, windChimeGain].forEach(function (g) {
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
   (wind, rain, cloud, fog, snow); a bare tree in the autumn theme and a
   winter tree with a snowman in the winter theme; a pile of fallen leaves
   or a snow bank along the bottom; and a dragonfly, cricket and fireflies
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
  temperature: 18, cloudCover: 15, rainMm: 0, fogDensity: 0,
  density: 0.4, maxLeaves: 70, sizeScale: 0.6, fallSpeed: 1, sway: 1, flip3d: 0.8,
  shapeVariation: 0.6, wear: 0.35, flurries: 0.5, lulls: 0.5,
  speciesMode: 'koyo', wMomiji: 0.6, wGinkgo: 0.5, wOak: 0.25, wKeyaki: 0.3,
  colorMode: 'auto', colorProgress: 0.3, colorVariety: 0.6, paletteBlend: 0.45, lightTint: 0.7, skyTint: 0.8,
  depthSpread: 0.9, farBlur: 2.75, nearBlur: 1.0, farOpacity: 0.6, nearOpacity: 0.9,
  rainStreaks: 1, rainContrast: 1, splashes: true, lightRays: 1, sunFlicker: 0.5, cloudShadows: 1, fogHaze: 1,
  lightning: true, frost: true, snowMix: true,
  sun: true, sunSize: 1, sunGlow: 1, moon: true, moonSize: 1.05, moonPath: 'arc',
  birds: true, nightSpecks: true, fireflyLand: true, fireflyMax: 4, dawnGlow: true,
  figureSide: 'auto',
  tree: true, treeSize: 0.82, treeSway: 1, treeOpacity: 0.5,
  winterTree: true, winterTreeDensity: 0.4, snowman: true, snowmanSize: 1, snowBank: true, snowBankHeight: 1,
  frontLeaves: 20, frontLeafOpacity: 1, frontLeafMinZ: 0.8, nearShare: 0.2, snowFront: 0.25,
  heroLeaf: true, heroEvery: 3, pile: true, pileMax: 60,
  dragonfly: true, cricket: true, insectSize: 1, tapWind: true, tapStrength: 1,
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
    sy = skyBandY(24 * S.sunSize * (1 + low * 0.35));
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
   switch): autumn theme → kōyō trees and falling leaves, winter theme → bare
   winter tree, snowman and snow. The sakura theme shows none of it (the loop
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
  // The winter theme always has a little snow falling, as the old snowflakes did.
  if (ENV.scene === 'winter') { ENV.snowing = true; ENV.snowAmt = Math.max(ENV.snowAmt, 0.35); }
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
  var dir = Math.abs(ENV.windPx) > 4 ? Math.sign(ENV.windPx) : (Math.random() < 0.5 ? -1 : 1);
  var g = {
    id: gustId++, dir: dir, x: dir > 0 ? -100 : W + 100,
    speed: 650 + ENV.windMs * 30,
    str: (90 + ENV.windMs * 22) * (0.6 + S.gustiness) * (force ? 1.3 : 1)
  };
  gusts.push(g);
  var n = 3 + Math.floor(Math.random() * 5);
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
        if (Math.random() < 0.55) liftFromPile(P, g.dir * g.str * rnd(0.6, 1.2), -rnd(60, 180));
        else P.kick = g.dir * 0.3 * Math.min(1.5, g.str / 150);   // the rest tremble as it passes
      }
    }
    [tree, farTree].forEach(function(T) {
      if (T && T.gid !== g.id && (g.dir > 0 ? T.bx < g.x : T.bx > g.x)) {
        T.gid = g.id;
        T.gustV += g.dir * 0.5 * (g.str / 200);
        if (T.koyo) for (var q = 2 + Math.floor(Math.random() * 4); q > 0; q--) dropKoyoLeaf(T, g.dir * g.str * rnd(0.2, 0.5));
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
var streaks = [], splashes = [], flakes = [], specks = [], birds = [], dragonfly = null;
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

function updateRain(dt) {
  var c = S.condition;
  var drizzle = c === 'drizzle';
  var target = 0;
  if (ENV.rainy) target = drizzle ? 110 * S.rainStreaks : Math.min(450, (40 + S.rainMm * 30) * S.rainStreaks);
  target = Math.round(target);
  while (streaks.length < target) {
    var z = rnd(0.2, 1);
    streaks.push({ x: Math.random() * W, y: Math.random() * H, z: z });
  }
  if (streaks.length > target) streaks.length = target;
  var vx = ENV.windPx * 2.5;
  for (var i = 0; i < streaks.length; i++) {
    var s = streaks[i];
    var spd = (700 + 600 * s.z) * (drizzle ? 0.6 : 1);
    s.y += spd * dt;
    s.x += vx * dt;
    if (s.y > H) {
      if (S.splashes && s.z > 0.6 && Math.random() < 0.5) splashes.push({ x: s.x, y: H - 4 - Math.random() * 24, t: 0, z: s.z });
      s.y = -30 - Math.random() * 60;
      s.x = Math.random() * (W + 200) - 100 - vx * 0.5;
    }
    if (s.x < -100) s.x += W + 200;
    if (s.x > W + 100) s.x -= W + 200;
  }
  for (var j = splashes.length - 1; j >= 0; j--) {
    splashes[j].t += dt;
    if (splashes[j].t > 0.35) splashes.splice(j, 1);
  }
}
function drawRain(ctx) {
  if (!streaks.length && !splashes.length) return;
  var drizzle = S.condition === 'drizzle';
  var lenMul = (drizzle ? 0.75 : 1) * (1 + S.rainMm / 10);
  var ang = Math.atan2(700, ENV.windPx * 2.5);
  var cx = Math.cos(ang), cy = Math.sin(ang);
  for (var pass = 0; pass < 2; pass++) {
    ctx.beginPath();
    for (var i = 0; i < streaks.length; i++) {
      var s = streaks[i];
      if ((s.z >= 0.6) !== (pass === 1)) continue;
      var len = (10 + 18 * s.z) * lenMul;
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - cx * len, s.y - cy * len);
    }
    // Dark plum-grey streaks: pale rain vanished on the silk-white page.
    var ra = pass === 0 ? (drizzle ? 0.16 : 0.22) : (drizzle ? 0.26 : 0.38);
    ctx.strokeStyle = rgba([70, 60, 95], ra * S.rainContrast);
    ctx.lineWidth = pass === 0 ? (drizzle ? 0.8 : 1.0) : (drizzle ? 1.1 : 1.5);
    ctx.stroke();
  }
  ctx.lineWidth = 0.9;
  for (var j = 0; j < splashes.length; j++) {
    var sp = splashes[j], k = sp.t / 0.35, r = (7 + 5 * sp.z) * k;
    ctx.strokeStyle = rgba([70, 60, 95], 0.5 * (1 - k) * S.rainContrast);
    ctx.beginPath();
    ctx.ellipse(sp.x, sp.y, r, r * 0.35, 0, 0, TAU);
    ctx.stroke();
  }
}

/* Snow is drawn on the back canvas (behind the text) in five depth
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
  var target = ENV.snowing ? Math.round(140 * ENV.snowAmt) : 0;
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

function drawSun(ctx, t) {
  var a = ENV.astro.sun;
  if (!S.sun || a.alt < -1.5) return;
  var vis = smooth(-1.5, 1.5, a.alt) * clamp(1 - S.cloudCover / 100 * 0.75, 0.15, 1) *
            (ENV.rainy ? 0.35 : 1) * (S.condition === 'snow' ? 0.4 : 1) * (1 - ENV.fog * 0.5);
  if (vis < 0.01) return;
  var clear = vis * clamp(1 - S.cloudCover / 100 * 0.8, 0, 1) * (1 - ENV.fog * 0.8);
  var low = 1 - smooth(2, 18, a.alt);            // near the horizon: bigger, more orange
  var size = 24 * S.sunSize * (1 + low * 0.35);
  var x = skyToScreen(a.alt, a.az).x, y = skyBandY(size);
  var warm = mixRgb([255, 214, 160], [255, 140, 80], low);
  // wide bloom
  var R = size * 9 * Math.max(0.2, S.sunGlow);
  var g = ctx.createRadialGradient(x, y, 0, x, y, R);
  g.addColorStop(0, rgba([255, 252, 244], 0.9 * vis));
  g.addColorStop(0.08, rgba(warm, 0.55 * vis * S.sunGlow));
  g.addColorStop(0.35, rgba(warm, 0.18 * vis * S.sunGlow));
  g.addColorStop(1, rgba(warm, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - R, y - R, 2 * R, 2 * R);
  if (clear > 0.02) {
    // starburst: thin tapering rays that slowly turn and shimmer
    for (var i = 0; i < 16; i++) {
      var ang = i / 16 * TAU + t * 0.015 + (hash1(i) - 0.5) * 0.3;
      var len = size * (3 + 6 * hash1(i + 9)) * (0.85 + 0.15 * Math.sin(t * 1.3 + i * 2.1)) * S.sunGlow;
      var w = size * 0.1 * (0.5 + hash1(i + 3));
      var nx = -Math.sin(ang) * w, ny = Math.cos(ang) * w;
      var ex = x + Math.cos(ang) * len, ey = y + Math.sin(ang) * len;
      var rg = ctx.createLinearGradient(x, y, ex, ey);
      rg.addColorStop(0, rgba([255, 255, 255], 0.8 * clear));
      rg.addColorStop(0.3, rgba(warm, 0.4 * clear));
      rg.addColorStop(1, rgba(warm, 0));
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.moveTo(x + nx, y + ny);
      ctx.lineTo(ex, ey);
      ctx.lineTo(x - nx, y - ny);
      ctx.closePath();
      ctx.fill();
    }
    // faint lens ghosts on the line toward the centre of the screen
    var cx = W * 0.5, cy = H * 0.5;
    [[0.55, 26, [255, 190, 140]], [0.95, 14, [255, 220, 170]], [1.35, 40, [190, 205, 255]]].forEach(function(gh) {
      var gx = x + (cx - x) * gh[0], gy = y + (cy - y) * gh[0], gr = gh[1] * S.sunSize;
      var gg = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
      gg.addColorStop(0, rgba(gh[2], 0.1 * clear));
      gg.addColorStop(0.7, rgba(gh[2], 0.06 * clear));
      gg.addColorStop(1, rgba(gh[2], 0));
      ctx.fillStyle = gg;
      ctx.beginPath(); ctx.arc(gx, gy, gr, 0, TAU); ctx.fill();
    });
  }
  var cg = ctx.createRadialGradient(x, y, 0, x, y, size);
  cg.addColorStop(0, rgba([255, 255, 255], vis));
  cg.addColorStop(0.7, rgba([255, 253, 246], 0.95 * vis));
  cg.addColorStop(1, rgba([255, 245, 225], 0));
  ctx.fillStyle = cg;
  ctx.beginPath(); ctx.arc(x, y, size, 0, TAU); ctx.fill();
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
    oy = skyBandY(24 * S.sunSize);
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

var birdNext = 0;
function sendBirds() {
  var dir = Math.random() < 0.5 ? -1 : 1;
  var n = 3 + Math.floor(Math.random() * 5);
  var y0 = H * rnd(0.08, 0.35), spd = rnd(40, 70), size = rnd(7, 11);
  for (var i = 0; i < n; i++) {
    var row = Math.ceil(i / 2), side = i % 2 ? 1 : -1;
    birds.push({
      x: (dir > 0 ? -40 : W + 40) - dir * row * 22, y: y0 + side * row * 12,
      vx: dir * spd * rnd(0.95, 1.05), s: size * rnd(0.85, 1.1), ph: rnd(0, TAU), f: rnd(6, 9)
    });
  }
}
function updateBirds(dt, t) {
  var birdTime = ENV.astro.sun.alt > 0 && (ENV.phase === 'dawn' || ENV.phase === 'golden' || ENV.phase === 'morning');
  if (S.birds && t > birdNext && birdTime) {
    if (birdNext > 0) sendBirds();
    birdNext = t + rnd(45, 140);
  }
  if (ENV.astro.sun.alt < -2) birds.length = 0;      // no birds at night
  for (var i = birds.length - 1; i >= 0; i--) {
    var b = birds[i];
    b.x += b.vx * dt;
    b.y += Math.sin(t * 0.8 + b.ph) * 4 * dt;
    if (b.x < -120 || b.x > W + 120) birds.splice(i, 1);
  }
}
function drawBirds(ctx, t) {
  if (!birds.length) return;
  ctx.strokeStyle = 'rgba(80,55,60,0.38)';
  ctx.lineWidth = 1.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (var i = 0; i < birds.length; i++) {
    var b = birds[i], w = Math.sin(t * b.f + b.ph), s = b.s;
    ctx.moveTo(b.x - s, b.y - w * s * 0.5);
    ctx.quadraticCurveTo(b.x - s * 0.5, b.y - w * s, b.x, b.y);
    ctx.quadraticCurveTo(b.x + s * 0.5, b.y - w * s, b.x + s, b.y - w * s * 0.5);
  }
  ctx.stroke();
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
   8b. SEASONAL PICTURE — kōyō trees (autumn theme), bare winter tree (winter theme)
   ============================================================ */
var tree = null;          // the near tree: taller and sharp; the snowman stands beside it
var farTree = null;       // the far tree on the other side: shorter, a little soft and paler
var koyoLeafLayer = document.createElement('canvas');   // the near kōyō tree's foliage, laid down at its own strength
var ctxKL = koyoLeafLayer.getContext('2d');
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
/* A new tree shape every day (seeded by the date), leaning in from one side.
   Autumn: a broad, spreading tree. Winter: a different kind — a tall,
   upright, vase-shaped keyaki (zelkova) with a fine broom of twigs.
   There are two: the near tree stands on ENV.side, the far one on the other
   side, shorter and drawn a little soft (far = true). */
function buildTree(key, far) {
  if (ENV.scene !== 'winter') return buildKoyoTree(key, far);
  var r = rngFrom(strSeed(key));
  var side = far ? (ENV.side === 'left' ? 'right' : 'left') : ENV.side;
  var left = side === 'left', dir = left ? 1 : -1;
  var winter = ENV.scene === 'winter';
  var scale = H * S.treeSize * (winter ? 1.1 : 1) * (far ? FAR_TREE_SCALE : 1);
  var nodes = [], tips = [];
  var dens = S.winterTreeDensity;          // winter only: 0.1 very sparse … 1 the old dense look
  var maxD = winter ? 4 + Math.round(dens * 4) : TREE_DEPTH;
  function grow(parent, abs, len, w, d) {
    var sx = parent < 0 ? bx : nodes[parent].ex, sy = parent < 0 ? H + 6 : nodes[parent].ey;
    var fit = fitBranch(nodes, parent, sx, sy, abs, len, w);
    if (!fit) return;
    abs = fit.abs; len = fit.len;
    var pAbs = parent < 0 ? -PI / 2 : nodes[parent].abs;
    var idx = nodes.length;
    nodes.push({ p: parent, rel: abs - pAbs, abs: abs, len: len, w: w, d: d,
                 ph: r() * TAU, f: 0.6 + r() * 0.8, cur: abs, sx: sx, sy: sy, ex: fit.ex, ey: fit.ey });
    if (d >= maxD || len < scale * (winter ? 0.018 : 0.025)) { tips.push(idx); return; }
    // a sparse winter tree: some twigs simply stop early
    if (winter && d >= 3 && r() < (1 - dens) * 0.4) { tips.push(idx); return; }
    var n, spread, upPull, shrink;
    if (winter) {
      n = d === 0 ? 2 : ((dens > 0.55 && r() < 0.45 * dens) ? 3 : 2);
      spread = (0.36 + r() * 0.2) * (n === 3 ? 0.85 : 1);
      upPull = 0.2;
      shrink = 0.74 + r() * 0.1;
    } else {
      n = d === 0 ? 2 : (r() < 0.3 ? 3 : 2);
      spread = (0.42 + r() * 0.3) * (n === 3 ? 0.8 : 1);
      upPull = 0.1;
      shrink = 0.68 + r() * 0.14;
    }
    for (var i = 0; i < n; i++) {
      var ca = abs + (i - (n - 1) / 2) * spread + (r() - 0.5) * 0.35 + dir * (d < 3 ? 0.1 : 0.04);
      ca = lerp(ca, -PI / 2, upPull);
      grow(idx, ca, len * shrink, Math.max(winter ? 0.9 : 0.7, w * (winter ? 0.64 : 0.66)), d + 1);
    }
    if (nodes.length === idx + 1) tips.push(idx);   // every twig was left off: this is a tip now
  }
  var bx = left ? W * (0.04 + r() * 0.06) : W * (0.9 + r() * 0.06);
  if (winter) grow(-1, -PI / 2 + dir * (0.03 + r() * 0.05), scale * 0.3, Math.max(far ? 3 : 5, scale * 0.026), 0);
  else grow(-1, -PI / 2 + dir * (0.1 + r() * 0.12), scale * 0.24, Math.max(far ? 3.5 : 6, scale * 0.032), 0);
  // branches of one depth share a width, so each depth is drawn with a single stroke
  var byDepth = [];
  for (var q = 0; q < nodes.length; q++) (byDepth[nodes[q].d] = byDepth[nodes[q].d] || []).push(q);
  return { key: key, far: !!far, bx: bx, by: H + 6, nodes: nodes, tips: tips, byDepth: byDepth, gust: 0, gustV: 0, gid: 0,
           scale: scale, maxD: maxD, winter: winter };
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
/* The app's light on the trees: the daytime tint, the night tint, rain. */
function koyoLight(c) {
  var Lt = ENV.light, n = koyoNight(), g = KOYO.nightGlow;
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
function buildKoyoTree(key, far) {
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
  var slide = Math.min(over, (left ? bx : W - bx) + W * 0.08);
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
  T.clumps.forEach(function(C) { bakeClump(C, far); });
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
  c.fillStyle = rgba(bark);
  var ns = T.nodes, i, n;
  function endW(n) { return (n.d >= T.maxD ? n.w * 0.55 : Math.max(0.8, n.w * 0.62)) / 2; }
  c.beginPath();
  for (i = 0; i < ns.length; i++) {
    n = ns[i];
    var w0 = n.w / 2, w1 = endW(n);
    var x0 = koyoX(T, n.sx), y0 = n.sy, x1 = koyoX(T, n.ex), y1 = n.ey;
    var dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1, px = -dy / len, py = dx / len;
    c.moveTo(x0 + px * w0, y0 + py * w0);
    c.lineTo(x1 + px * w1, y1 + py * w1);
    c.lineTo(x1 - px * w1, y1 - py * w1);
    c.lineTo(x0 - px * w0, y0 - py * w0);
    c.closePath();
  }
  c.fill();
  c.beginPath();
  for (i = 0; i < ns.length; i++) {
    n = ns[i];
    if (n.d >= T.maxD) continue;                  // a twig's tip has no fork, so no joint
    var r = endW(n), ex = koyoX(T, n.ex);
    c.moveTo(ex + r, n.ey);
    c.arc(ex, n.ey, r, 0, TAU);
  }
  c.fill();
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
function drawKoyoTrees(ctx, t) {
  if (farTree) {
    koyoGlow(ctx, farTree, 0.6);
    // The far tree's branches go down solid, at half size and scaled up (soft),
    // then its foliage on a half-size layer laid down at the far strength.
    ctxT.setTransform(1, 0, 0, 1, 0, 0);
    ctxT.clearRect(0, 0, treeLayer.width, treeLayer.height);
    ctxT.setTransform(PR * FAR_LAYER_SCALE, 0, 0, PR * FAR_LAYER_SCALE, 0, 0);
    fillKoyoBranches(ctxT, farTree, KOYO.branchOpacity * KOYO.farOpacity);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(treeLayer, 0, 0, farLayer.width, farLayer.height, 0, 0, cvBack.width, cvBack.height);
    ctxFar.setTransform(1, 0, 0, 1, 0, 0);
    ctxFar.clearRect(0, 0, farLayer.width, farLayer.height);
    ctxFar.setTransform(PR * FAR_LAYER_SCALE, 0, 0, PR * FAR_LAYER_SCALE, 0, 0);
    drawKoyoClumps(ctxFar, farTree, t);
    ctx.globalAlpha = KOYO.farOpacity;
    ctx.drawImage(farLayer, 0, 0, farLayer.width, farLayer.height, 0, 0, cvBack.width, cvBack.height);
  }
  if (tree) {
    koyoGlow(ctx, tree, 1);
    // solid branches, then the foliage on its own layer laid down at its strength
    ctxT.setTransform(1, 0, 0, 1, 0, 0);
    ctxT.clearRect(0, 0, treeLayer.width, treeLayer.height);
    ctxT.setTransform(PR, 0, 0, PR, 0, 0);
    fillKoyoBranches(ctxT, tree, KOYO.branchOpacity);
    ctxKL.setTransform(1, 0, 0, 1, 0, 0);
    ctxKL.clearRect(0, 0, koyoLeafLayer.width, koyoLeafLayer.height);
    ctxKL.setTransform(PR, 0, 0, PR, 0, 0);
    drawKoyoClumps(ctxKL, tree, t);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.drawImage(treeLayer, 0, 0);
    ctx.globalAlpha = KOYO.nearOpacity;
    ctx.drawImage(koyoLeafLayer, 0, 0);
  }
  ctx.setTransform(PR, 0, 0, PR, 0, 0);
  ctx.globalAlpha = 1;
}
function ensureTree() {
  var want = (ENV.scene === 'autumn' && S.tree) || (ENV.scene === 'winter' && S.winterTree);
  if (!want) { tree = null; farTree = null; return; }
  var key = ENV.scene + '|' + S.date + '|' + ENV.side + '|' + W + 'x' + H + '|' + S.treeSize + '|' + S.winterTreeDensity;
  if (!tree || tree.key !== key) tree = buildTree(key, false);
  if (!farTree || farTree.key !== key + '|far') farTree = buildTree(key + '|far', true);
}
function updateTree(dt, t) {
  if (farTree) updateOneTree(farTree, dt, t);
  if (tree) updateOneTree(tree, dt, t);
  rebakeClumps(3);
}
function updateOneTree(T, dt, t) {
  var ns = T.nodes;
  // a gust gives the whole tree a push that springs back
  T.gustV += (-6 * T.gust - 1.8 * T.gustV) * dt;
  T.gust += T.gustV * dt;
  var wind = ENV.windPx * 0.0012 * S.treeSway;
  var amp = (0.015 + 0.01 * ENV.windMs) * S.treeSway;
  var spd = 1 + ENV.windMs * 0.08;
  for (var i = 0; i < ns.length; i++) {
    var n = ns[i];
    var k = Math.pow(n.d / T.maxD, 1.6) + 0.02;     // thin twigs move most
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
function strokeTree(c, T) {
  var ns = T.nodes;
  for (var d = 0; d < T.byDepth.length; d++) {
    var arr = T.byDepth[d];
    if (!arr || !arr.length) continue;
    c.lineWidth = ns[arr[0]].w;
    c.beginPath();
    for (var i = 0; i < arr.length; i++) {
      var n = ns[arr[i]];
      c.moveTo(n.sx, n.sy);
      c.lineTo(n.ex, n.ey);
    }
    c.stroke();
  }
}
function drawTree(ctx, t) {
  if (ENV.scene !== 'winter') { drawKoyoTrees(ctx, t); return; }
  var fig = ENV.scene === 'winter' && S.snowman;
  if (!tree && !farTree && !fig) return;
  var tint = ENV.scene === 'winter' ? [78, 66, 72] : [70, 46, 44];
  // The far tree first. It is drawn onto a half-size layer and scaled back up,
  // which softens it a little (no per-frame blur filter), and it is paler and a
  // touch weaker than the near tree.
  if (farTree) {
    ctxFar.setTransform(1, 0, 0, 1, 0, 0);
    ctxFar.clearRect(0, 0, farLayer.width, farLayer.height);
    ctxFar.setTransform(PR * FAR_LAYER_SCALE, 0, 0, PR * FAR_LAYER_SCALE, 0, 0);
    ctxFar.strokeStyle = rgba(mixRgb(mixRgb(tint, [235, 224, 224], 0.2), ENV.light.col, 0.12));
    ctxFar.lineCap = 'round';
    strokeTree(ctxFar, farTree);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = S.treeOpacity * FAR_TREE_ALPHA;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(farLayer, 0, 0, farLayer.width, farLayer.height, 0, 0, cvBack.width, cvBack.height);
  }
  // The near tree (and the snowman's body) go onto their own layer at full
  // strength, then the layer is laid down at the chosen strength, so joints
  // don't show darker spots and the snowman matches the tree.
  ctxT.setTransform(1, 0, 0, 1, 0, 0);
  ctxT.clearRect(0, 0, treeLayer.width, treeLayer.height);
  ctxT.setTransform(PR, 0, 0, PR, 0, 0);
  ctxT.strokeStyle = rgba(mixRgb(tint, ENV.light.col, 0.12));
  ctxT.lineCap = 'round';
  if (tree) strokeTree(ctxT, tree);
  var sm = fig ? snowmanBody(ctxT, t) : null;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = S.treeOpacity;
  ctx.drawImage(treeLayer, 0, 0);
  ctx.setTransform(PR, 0, 0, PR, 0, 0);
  ctx.globalAlpha = 1;
  if (sm) snowmanDress(ctx, t, sm);
}

/* ============================================================
   8b-2. WINTER GROUND — accumulated snow and a snowman silhouette.
   Colours are the site palette: 絹白 silk white, 薄桃 petal-soft and the
   soft cream tiers for the snow; plum, 金木犀 orange and amber for the
   scarf and hat; the same taupe as the winter tree for the silhouette.
   ============================================================ */
var snowAccum = 0;            // 0..1: grows while it snows, melts slowly when mild
var snowman = { wind: 0 };
var _bankPh = 0;
var SNOWC = {
  white: [255, 253, 249], soft1: [251, 236, 224], soft3: [245, 223, 207], petalSoft: [253, 232, 218],
  border1: [238, 210, 192], border2: [222, 192, 172], plum: [136, 46, 71], plumLight: [158, 62, 92],
  accent: [230, 104, 38], accent2: [196, 78, 16], amber: [158, 59, 6]
};
/* Palette colour as it looks in the current light: warmer at dusk, darker at night. */
function snowLit(c) {
  var Lt = ENV.light, o = mixRgb(c, Lt.col, clamp(Lt.amt * S.lightTint * 0.8, 0, 0.5));
  return scaleRgb(o, 1 - Lt.dark * 0.35 * S.lightTint);
}
function updateWinterGround(dt) {
  if (ENV.scene !== 'winter') return;
  _bankPh = (dayOfYear(ENV.p) % 97) * 0.43;                  // a different set of hills each day
  if (S.condition === 'snow') snowAccum = Math.min(1, snowAccum + dt * ENV.snowAmt / 900);
  else if (S.temperature > 3) snowAccum = Math.max(0, snowAccum - dt / 3000);
  var target = clamp(ENV.windPx / 50 + (tree ? tree.gust * 4 : 0), -1.3, 1.3);
  snowman.wind += (target - snowman.wind) * (1 - Math.exp(-dt * 1.5));
}
function bankHeightPx(layer) {
  var base = H * 0.03 * S.snowBankHeight, acc = H * 0.045 * snowAccum * S.snowBankHeight;
  return layer === 'far' ? (base + acc) * 1.7 + H * 0.01 : base + acc;
}
/* Rolling hills: three sine waves of different length. */
function bankSurface(x, layer) {
  var far = layer === 'far', h = bankHeightPx(layer), ph = _bankPh + (far ? 2.1 : 0), k = far ? 0.7 : 1;
  return H - h * (0.72 + 0.28 * Math.sin(x * 0.0042 * k + ph) + 0.14 * Math.sin(x * 0.0105 * k + ph * 1.7 + 1) +
                  0.05 * Math.sin(x * 0.026 + ph * 2.3));
}
function drawSnowBank(ctx, layer) {
  if (ENV.scene !== 'winter' || !S.snowBank) return;
  var far = layer === 'far', hpx = bankHeightPx(layer), x;
  ctx.beginPath();
  ctx.moveTo(-6, H + 6);
  for (x = -6; x <= W + 18; x += 12) ctx.lineTo(x, bankSurface(x, layer));
  ctx.lineTo(W + 6, H + 6);
  ctx.closePath();
  var g = ctx.createLinearGradient(0, H - hpx * 1.25, 0, H);
  if (far) {
    g.addColorStop(0, rgba(snowLit(SNOWC.petalSoft), 0.78));
    g.addColorStop(1, rgba(snowLit(SNOWC.soft3), 0.85));
  } else {
    g.addColorStop(0, rgba(snowLit(SNOWC.white), 0.98));
    g.addColorStop(0.55, rgba(snowLit(SNOWC.soft1), 0.98));
    g.addColorStop(1, rgba(snowLit(SNOWC.soft3), 0.98));
  }
  ctx.fillStyle = g;
  ctx.fill();
  // crest: a thin warm line, plus a bright highlight just above it
  ctx.beginPath();
  for (x = -6; x <= W + 18; x += 12) { if (x === -6) ctx.moveTo(x, bankSurface(x, layer)); else ctx.lineTo(x, bankSurface(x, layer)); }
  ctx.strokeStyle = rgba(snowLit(far ? SNOWC.border1 : SNOWC.border2), far ? 0.5 : 0.65);
  ctx.lineWidth = 1.2;
  ctx.stroke();
  if (!far) {
    ctx.translate(0, -1.6);
    ctx.strokeStyle = rgba(snowLit(SNOWC.white), 0.8);
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.translate(0, 1.6);
  }
}
function snowmanLayout() {
  var left = ENV.side === 'left';
  var bx = tree ? tree.bx : (left ? W * 0.07 : W * 0.93);
  var x = clamp(left ? bx + H * 0.2 : bx - H * 0.2, W * 0.06, W * 0.94);
  var R = H * 0.064 * S.snowmanSize, r2 = R * 0.66;
  var gy = bankSurface(x, 'near') + R * 0.22;               // sinks a little into the snow
  var by = gy - R * 0.92, hy = by - R * 0.78 - r2 * 0.62;
  return { x: x, R: R, r2: r2, gy: gy, by: by, hy: hy, left: left };
}
/* The silhouette itself: two snowballs and twig arms, drawn on the tree's layer. */
function snowmanBody(c, t) {
  var m = snowmanLayout(), x = m.x;
  var col = rgba(mixRgb([78, 66, 72], ENV.light.col, 0.12));
  c.fillStyle = col;
  c.strokeStyle = col;
  c.lineCap = 'round';
  c.beginPath(); c.arc(x, m.by, m.R, 0, TAU); c.fill();
  c.beginPath(); c.arc(x, m.hy, m.r2, 0, TAU); c.fill();
  var sway = Math.sin(t * 0.9 + 1) * 0.04 + snowman.wind * 0.08;
  [-1, 1].forEach(function(sd) {
    var a = (sd > 0 ? -0.55 : PI + 0.55) + sway, len = m.R * 1.25;
    var sx0 = x + sd * m.R * 0.82, sy0 = m.by - m.R * 0.32;
    var ex = sx0 + Math.cos(a) * len, ey = sy0 + Math.sin(a) * len;
    c.lineWidth = Math.max(1.6, m.R * 0.06);
    c.beginPath(); c.moveTo(sx0, sy0); c.lineTo(ex, ey); c.stroke();
    c.lineWidth = Math.max(1.1, m.R * 0.04);
    [0.62, 0.85].forEach(function(f, i) {
      var fx = sx0 + Math.cos(a) * len * f, fy = sy0 + Math.sin(a) * len * f, fa = a + (i ? 0.55 : -0.6) * sd;
      c.beginPath(); c.moveTo(fx, fy); c.lineTo(fx + Math.cos(fa) * len * 0.3, fy + Math.sin(fa) * len * 0.3); c.stroke();
    });
  });
  return m;
}
/* Scarf (flutters in the wind) and bucket hat, in palette colours. */
function snowmanDress(ctx, t, m) {
  var x = m.x, w = snowman.wind, aw = Math.abs(w);
  var ny = m.hy + m.r2 * 0.78;                              // neck
  var Lt = ENV.light, dark = 1 - Lt.dark * 0.3;
  // tails
  var th = Math.atan(w), ax = Math.sin(th), ay = Math.cos(th), nx = ay, nyv = -ax;
  var kx = x + clamp(w, -1, 1) * m.r2 * 0.55, ky = ny + m.r2 * 0.08;
  for (var j = 1; j >= 0; j--) {
    var len = m.R * (1.55 + 0.15 * aw) * (1 - 0.2 * j), N = 14, L = [], Rr = [];
    var amp = m.R * (0.07 + 0.17 * aw), fr = 4.5 + 3 * aw, ph = j * 1.5;
    for (var i = 0; i <= N; i++) {
      var u = i / N;
      var wave = (Math.sin(t * fr - u * 6 + ph) + 0.35 * Math.sin(t * fr * 1.9 - u * 11 + ph)) * amp * u;
      var px = kx - j * m.r2 * 0.14 + ax * len * u + nx * wave;
      var py = ky + ay * len * u + nyv * wave + u * u * m.R * 0.32 * (1 - aw * 0.6);
      var hw = m.r2 * (0.17 - 0.05 * u);
      L.push([px + nx * hw, py + nyv * hw]);
      Rr.push([px - nx * hw, py - nyv * hw]);
    }
    ctx.beginPath();
    ctx.moveTo(L[0][0], L[0][1]);
    for (i = 1; i <= N; i++) ctx.lineTo(L[i][0], L[i][1]);
    for (i = N; i >= 0; i--) ctx.lineTo(Rr[i][0], Rr[i][1]);
    ctx.closePath();
    ctx.fillStyle = rgba(scaleRgb(j ? SNOWC.accent2 : SNOWC.accent, dark), 0.95);
    ctx.fill();
  }
  // band around the neck
  ctx.fillStyle = rgba(scaleRgb(SNOWC.accent, dark), 0.95);
  ctx.beginPath(); ctx.ellipse(x, ny, m.r2 * 0.92, m.r2 * 0.21, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = rgba(scaleRgb(SNOWC.accent2, dark), 0.8);
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.ellipse(x, ny, m.r2 * 0.92, m.r2 * 0.21, 0, 0.1, PI - 0.1); ctx.stroke();
  // bucket hat
  var brimW = m.r2 * 1.5, topW = m.r2 * 0.92, hh = m.r2 * 0.82;
  ctx.save();
  ctx.translate(x + m.r2 * 0.06, m.hy - m.r2 * 0.7);
  ctx.rotate(m.left ? 0.1 : -0.1);
  function wAt(f) { return (brimW + (topW - brimW) * f) / 2; }
  ctx.fillStyle = rgba(scaleRgb(SNOWC.plum, dark), 0.97);
  ctx.beginPath();
  ctx.moveTo(-brimW / 2, 0); ctx.lineTo(brimW / 2, 0); ctx.lineTo(topW / 2, -hh); ctx.lineTo(-topW / 2, -hh);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = rgba(scaleRgb(SNOWC.accent, dark), 0.9);
  ctx.beginPath();
  ctx.moveTo(-wAt(0), 0); ctx.lineTo(wAt(0), 0); ctx.lineTo(wAt(0.26), -hh * 0.26); ctx.lineTo(-wAt(0.26), -hh * 0.26);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = rgba(scaleRgb(SNOWC.plum, dark * 0.9), 0.97);
  ctx.beginPath(); ctx.ellipse(0, 0, brimW * 0.64, hh * 0.13, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = rgba(scaleRgb(SNOWC.plumLight, dark), 0.97);
  ctx.beginPath(); ctx.ellipse(0, -hh, topW / 2, hh * 0.1, 0, 0, TAU); ctx.fill();
  ctx.restore();
  // soft shadow where it stands
  ctx.fillStyle = rgba(snowLit(SNOWC.border2), 0.35);
  ctx.beginPath(); ctx.ellipse(x + m.R * 0.3, m.gy - m.R * 0.04, m.R * 1.1, m.R * 0.16, 0, 0, TAU); ctx.fill();
}

/* ============================================================
   8c. VISITORS — red dragonfly by day, cricket at night.
       They perch on the characters of the message text.
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
  if (dragonfly && dragonfly.perch && dragonfly.perch.glyph) {
    if (dragonfly.state === 'perch') dragonfly.rest = Math.min(dragonfly.rest, 0.2);
    else if (dragonfly.state === 'approach') dragonfly.perch = { x: dragonfly.x, y: dragonfly.y - 30 };
  }
  if (cricket) {
    cricket.seq = cricket.seq.filter(function(sp) { return !sp.glyph; });
    if (cricket.state === 'rest') cricket.rest = Math.min(cricket.rest, 0.3);
  }
}

/* Akatombo: darts and hovers, lands on a character, slowly folds its
   wings in and out while resting, then flies on or leaves. */
var dragonfly = null, dragonflyNext = 0;
function sendDragonfly() {
  var fromLeft = Math.random() < 0.5;
  dragonfly = {
    x: fromLeft ? -40 : W + 40, y: H * rnd(0.15, 0.55), heading: fromLeft ? 0 : PI,
    state: 'dash', tx: W * rnd(0.2, 0.8), ty: H * rnd(0.15, 0.6), hoverT: 0,
    legs: 1 + Math.floor(Math.random() * 3), landings: 1 + Math.floor(Math.random() * 3),
    t: 0, fold: 0, perch: null, perchT: 0, rest: 0, foldRate: 1.5, perchHeading: 0, leaving: false
  };
}
function dfNextLeg(d) {
  if (d.legs > 0) {
    d.legs--;
    d.state = 'dash';
    d.tx = clamp(d.x + rnd(-400, 400), 40, W - 40);
    d.ty = clamp(d.y + rnd(-220, 220), H * 0.1, H * 0.75);
  } else if (d.landings > 0) {
    d.landings--;
    d.perch = pickPerch();
    d.state = 'approach';
  } else {
    d.leaving = true;
    d.state = 'dash';
    d.tx = d.x < W / 2 ? -100 : W + 100;
    d.ty = d.y + rnd(-150, 50);
  }
}
function updateDragonfly(dt, t) {
  var okTime = ENV.light.daylight > 0.5 && !ENV.rainy && S.condition !== 'snow' && S.temperature >= 12 && ENV.scene !== 'winter';
  if (!dragonfly && S.dragonfly && okTime && dynFrontMul > 0.5 && t > dragonflyNext) {
    if (dragonflyNext > 0) sendDragonfly();
    dragonflyNext = t + rnd(60, 180);
  }
  var d = dragonfly;
  if (!d) return;
  d.t += dt;
  if (d.state === 'dash' || d.state === 'approach') {
    var tgt = d.state === 'approach' ? spotPos(d.perch) : { x: d.tx, y: d.ty };
    var dx = tgt.x - d.x, dy = tgt.y - d.y, dist = Math.sqrt(dx * dx + dy * dy);
    var sp = d.state === 'approach' ? Math.min(420, dist * 4 + 20) : Math.min(520, dist * 6);
    if (dist > 0.5) {
      var step = Math.min(dist, sp * dt);
      d.x += dx / dist * step;
      d.y += dy / dist * step;
      if (dist > 6) d.heading += angDiff(Math.atan2(dy, dx), d.heading) * (1 - Math.exp(-dt * 10));
    }
    d.fold += (0 - d.fold) * (1 - Math.exp(-dt * 12));
    if (dist < 2) {
      if (d.state === 'approach') {
        d.state = 'perch';
        d.rest = rnd(3, 8);
        d.perchT = 0;
        d.foldRate = rnd(1.1, 2.2);
        d.perchHeading = (Math.random() < 0.5 ? 0 : PI) + rnd(-0.35, 0.35);
      } else if (d.leaving) {
        dragonfly = null;
        return;
      } else {
        d.state = 'hover';
        d.hoverT = rnd(0.4, 1.2);
      }
    }
  } else if (d.state === 'hover') {
    d.hoverT -= dt;
    d.x += Math.sin(d.t * 7) * 6 * dt;
    d.y += Math.cos(d.t * 9) * 6 * dt;
    if (d.hoverT <= 0) dfNextLeg(d);
  } else if (d.state === 'perch') {
    var p = spotPos(d.perch);
    d.x = p.x; d.y = p.y;
    d.perchT += dt;
    d.rest -= dt;
    d.heading += angDiff(d.perchHeading, d.heading) * (1 - Math.exp(-dt * 4));
    var cyc = 0.5 - 0.5 * Math.cos(d.perchT * d.foldRate);
    d.fold += (Math.pow(cyc, 1.5) - d.fold) * (1 - Math.exp(-dt * 6));
    if (d.rest <= 0) { d.legs = Math.floor(Math.random() * 2); dfNextLeg(d); }
  }
  if (dragonfly && (d.x < -200 || d.x > W + 200)) dragonfly = null;
}
function drawDragonfly(ctx, t) {
  var d = dragonfly;
  if (!d) return;
  var k = 1.2 * S.insectSize;
  var perched = d.state === 'perch';
  ctx.save();
  ctx.translate(d.x, d.y);
  ctx.rotate(d.heading);
  if (perched) {
    ctx.fillStyle = 'rgba(60,40,40,0.12)';
    ctx.beginPath(); ctx.ellipse(-4 * k + 3, 5, 18 * k, 4 * k, 0, 0, TAU); ctx.fill();
  }
  ctx.scale(k, k);
  var flap = perched ? 0 : Math.sin(t * 90) * 0.15;
  var fa = lerp(80, 152, d.fold) - flap * 60;     // 152° = folded back along the body
  var ha = lerp(100, 164, d.fold) - flap * 60;
  ctx.lineWidth = 0.6;
  [[10, -fa, 22, 4.5], [10, fa, 22, 4.5], [6, -ha, 21, 5.5], [6, ha, 21, 5.5]].forEach(function(w) {
    ctx.save();
    ctx.translate(w[0], 0);
    ctx.rotate(w[1] * DEG);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.strokeStyle = 'rgba(90,60,60,0.35)';
    ctx.beginPath(); ctx.ellipse(w[2] / 2, 0, w[2] / 2, w[3] / 2, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(1, 0); ctx.lineTo(w[2] - 1, 0); ctx.stroke();
    ctx.fillStyle = 'rgba(120,60,40,0.55)';
    ctx.fillRect(w[2] - 4, -w[3] * 0.25, 2, w[3] * 0.4);
    ctx.restore();
  });
  ctx.strokeStyle = '#c4361e';
  ctx.lineCap = 'round';
  for (var i = 0; i < 6; i++) {
    ctx.lineWidth = 2.6 - i * 0.18;
    ctx.beginPath(); ctx.moveTo(6 - i * 6, 0); ctx.lineTo(1 - i * 6, 0); ctx.stroke();
  }
  ctx.fillStyle = '#a8321f';
  ctx.beginPath(); ctx.ellipse(10, 0, 5, 3.2, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#7a2a1c';
  ctx.beginPath(); ctx.arc(16, 0, 3.2, 0, TAU); ctx.fill();
  ctx.restore();
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
var LAND_REBAKE = 90;                 // seconds between light-driven re-bakes
var LAND_SCN_RES = 0.6;               // the mountains are blurred, so they are baked at 0.6 resolution
var KOYO_FALL1 = SPECIES.koyo.size * 1.05 * S.sizeScale;   // size of the nearest falling kōyō leaf
var KOYO_LEAF_LO = koyoOutline(23, 0);  // a lighter maple outline for the thousands of leaves on the ground
function landCanvas() { var c = document.createElement('canvas'); return { cnv: c, c: c.getContext('2d') }; }
var LS = { ready: false, key: '', at: -1e9, step: 0, grdTop: 0, scnTop: 0, mist: [], bornN: 0, floorBuilt: false,
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
  LAND_SR = PR * LAND_SCN_RES;
  [LS.SCN, LS.MTN, LS.TMP].forEach(function(o) { o.cnv.width = Math.round(W * LAND_SR); o.cnv.height = Math.round(H * LAND_SR); });
  var m = LS.MTN.c, s = LS.SCN.c;
  landBlurInto(m, LAND.mtnBlur * 1.3, function(c) { landFuji(c, hy); });   // the furthest: palest, softest
  var r = rngFrom(LAND.seed * 131 + 17), R = LAND.ridges;
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
  if (LAND.treeLine) {
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
  s.globalAlpha = LAND.mtnStrength;
  s.drawImage(LS.MTN.cnv, 0, 0);
  s.globalAlpha = 1;
  // the top of the highest peak (with room for its blur and the drifting mist):
  // only the scenery below it is drawn each frame
  LS.scnTop = Math.max(0, Math.floor(hy - Math.max(LAND.fujiHeight, LAND.mtnHeight) * H - 40));
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
/* The loose leaves lying in front, there from the start. */
function buildBed() {
  for (var i = 0; i < LAND.bedLeaves; i++) {
    var gy = rnd(2, LAND.bedDepth);
    var L = makeNearLeaf(lerp(1, LAND.nearZ, gy / Math.max(1, LAND.bedDepth)));
    L.x = rnd(-20, W + 20); L.gy = gy; L.age = 5;
    L.solid = true; L.pileFace = true;
    L.pileSx = Math.random() < 0.5 ? -1 : 1; L.pileSy = rnd(0.45, 0.72);
    bakeLeaf(L);
    addToFloor(L);
  }
  LS.floorBuilt = true;
}

/* ---------- bake when needed, draw each frame ---------- */
function landKey() {
  return [lookVersion, W, H, PR, tree ? tree.key : '', farTree ? farTree.key : ''].join('|');
}
function updateLandscape(t) {
  if (ENV.scene !== 'autumn') return;
  var k = landKey();
  if (LS.step) {                                  // a bake under way: one part per frame, so no single long pause
    if (LS.step === 2) landBakeGround();
    else { landBakeNear(); LS.ready = true; placeFloor(); }
    LS.step = LS.step === 2 ? 3 : 0;
    return;                                       // the loose leaves are laid on a later frame
  } else if (k !== LS.key) {
    var sized = LS.key.split('|').slice(1, 4).join('|') !== k.split('|').slice(1, 4).join('|');
    var scrolling = typeof _scrollActive !== 'undefined' && (_scrollActive || _swipeActive);
    // a new size (or the first bake) at once; a light change at most every LAND_REBAKE seconds, never mid-scroll
    if (!LS.ready || sized || (!scrolling && t - LS.at > LAND_REBAKE)) {
      landBakeScenery();
      LS.key = k; LS.at = t; LS.step = 2;
    }
  }
  if (LS.ready && !LS.floorBuilt) buildBed();
}
function drawLandscape(c, dt) {
  if (ENV.scene !== 'autumn' || !LS.ready) return;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalAlpha = 1;
  var sy0 = Math.floor(LS.scnTop * LAND_SR), sh0 = LS.SCN.cnv.height - sy0;   // the empty sky above the peaks is skipped
  c.drawImage(LS.SCN.cnv, 0, sy0, LS.SCN.cnv.width, sh0, 0, sy0 / LAND_SR * PR, cvBack.width, sh0 / LAND_SR * PR);
  if (LAND.mistDrift > 0) {                                                // mist drifting along the ridges
    var hy = H * LAND.horizon, drift = 0.5 + 0.5 * Math.min(2, ENV.windMs / 3);
    c.setTransform(PR, 0, 0, PR, 0, 0);
    c.globalAlpha = LAND.mistDrift * 0.5;
    for (var i = 0; i < LS.mist.length; i++) {
      var B = LS.mist[i], bw = B.w * W;
      B.x += B.v * dt * drift;
      if (B.x - bw / 2 > W + 50) B.x = -bw / 2 - 40;
      if (B.x + bw / 2 < -50) B.x = W + bw / 2 + 40;
      c.drawImage(LS.MIST.cnv, B.x - bw / 2, hy - LAND.mtnHeight * H * B.y - B.h / 2, bw, B.h);
    }
    c.globalAlpha = 1;
  }
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.drawImage(LS.GRD.cnv, 0, Math.round(LS.grdTop * PR));
  c.setTransform(PR, 0, 0, PR, 0, 0);
}
/* The near band goes under the leaves already drawn on the ground strip
   (it has its own night glow baked in). */
function drawNearBand(c) {
  if (ENV.scene !== 'autumn' || !LS.ready || !LS.nearH) return;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalAlpha = 1;
  c.globalCompositeOperation = 'destination-over';
  c.drawImage(LS.NEAR.cnv, 0, Math.round((GH - LS.nearH) * PR));
  c.globalCompositeOperation = 'source-over';
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
                 leaves and flakes, the dragonfly, cricket and fireflies on
                 the characters. It fades out on the table and thank-you
                 pages.
   ============================================================ */
var cvBack = document.getElementById('dynBack');
var cvGround = document.getElementById('dynGround');
var cvFront = document.getElementById('dynFront');
var cvNear = document.getElementById('dynNear');
var dynVeil = document.getElementById('dynVeil');
var ctx = cvBack ? cvBack.getContext('2d') : null;
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
  cvBack.width = cvFront.width = cvNear.width = treeLayer.width = koyoLeafLayer.width = cw;
  cvBack.height = cvFront.height = cvNear.height = treeLayer.height = koyoLeafLayer.height = ch;
  farLayer.width = Math.ceil(cw * FAR_LAYER_SCALE);
  farLayer.height = Math.ceil(ch * FAR_LAYER_SCALE);
  cvGround.width = cw;
  cvGround.height = Math.round(GH * PR);
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

function prefill() {
  var n = Math.min(S.maxLeaves * 0.6, spawnRate(0) * 25);
  for (var i = 0; i < n; i++) spawnLeaf({ prefill: true });
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

function dynBegin() {
  resize();
  advanceClock();
  computeEnv();
  ensureTree();
  lastScene = ENV.scene;
  lastLookKey = lookKey();
  if (ENV.scene !== 'winter') prefill();
  dynBegun = true;
}
/* Back at the start screen: forget everything and clear the canvases. */
function dynReset() {
  leaves.length = 0; pile.length = 0; hero = null; gusts.length = 0; flurryQueue.length = 0;
  streaks.length = 0; splashes.length = 0; flakes.length = 0; birds.length = 0; specks.length = 0;
  dragonfly = null; cricket = null; tree = null; farTree = null; snowAccum = 0; frontLeafCount = 0; heroNext = 0;
  LS.ready = false; LS.key = ''; LS.step = 0; LS.floorBuilt = false;
  [ctx, ctxG, ctxF, ctxN].forEach(function(c) { c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, c.canvas.width, c.canvas.height); });
  dynBegun = false;
}
function dynApplyOpacity() {
  cvBack.style.opacity = dynMaster.toFixed(3);
  cvGround.style.opacity = dynMaster.toFixed(3);
  cvFront.style.opacity = (dynMaster * dynFrontMul).toFixed(3);
  cvNear.style.opacity = (dynMaster * dynNearMul).toFixed(3);
}

function dynStep(dt, t, want) {
  dynMaster += ((want ? 1 : 0) - dynMaster) * (1 - Math.exp(-dt * 2.2));
  if (!want) { dynApplyOpacity(); return; }
  if (!dynBegun) dynBegin();

  dynScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
  dynFrontMul += (dynFrontTarget() - dynFrontMul) * (1 - Math.exp(-dt * 3));
  dynNearMul += (dynNearTarget() - dynNearMul) * (1 - Math.exp(-dt * 3));

  clockTimer -= dt;
  if (clockTimer <= 0) { advanceClock(); clockTimer = 1; }
  barTimer -= dt;
  if (barTimer <= 0) { measureInfoBar(); updateToolbarLight(); barTimer = 0.5; }
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
      if (ENV.scene === 'winter') { leaves.length = 0; pile.length = 0; hero = null; LS.floorBuilt = false; }
      else if (lastScene === 'winter') prefill();
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
  updateSnow(dt, t);
  updateBirds(dt, t);
  updateSpecks(dt, t);
  updateTree(dt, t);
  updateWinterGround(dt);
  updateDragonfly(dt, t);
  updateCricket(dt, t);
  if (dynFrontMul < 0.05 && (dragonfly || cricket)) { dragonfly = null; cricket = null; insectsLeaveText(); }

  // re-draw a few leaf sprites per frame when the look changed
  var budget = 10, all = leaves.concat(pile);
  if (hero) all.push(hero);
  for (var b = 0; b < all.length && budget > 0; b++) {
    var Lb = all[(rebakeIdx + b) % all.length];
    if (Lb.bakedV !== lookVersion || Lb.geomV !== geomVersion) { bakeLeaf(Lb); budget--; }
  }
  rebakeIdx = all.length ? (rebakeIdx + 10) % all.length : 0;

  // ---- back canvas ----
  drawOffsetY = 0;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.clearRect(0, 0, cvBack.width, cvBack.height);
  ctx.setTransform(PR, 0, 0, PR, 0, 0);
  drawSky(ctx, t);
  drawSun(ctx, t);
  drawMoon(ctx, t);
  drawLandscape(ctx, dt);
  drawCloudShadows(ctx, dt);
  drawRays(ctx, t);
  drawBirds(ctx, t);
  var split = 0;
  while (split < leaves.length && leaves[split].z < 0.5) split++;
  for (var f = 0; f < split; f++) if (!isFrontLeaf(leaves[f])) drawLeaf(leaves[f], t, false);
  ctx.setTransform(PR, 0, 0, PR, 0, 0); ctx.globalAlpha = 1;
  drawSnow(ctx, 'far');
  drawSnowBank(ctx, 'far');
  drawTree(ctx, t);
  drawFog(ctx, dt);
  for (var n = split; n < leaves.length; n++) if (!isFrontLeaf(leaves[n])) drawLeaf(leaves[n], t, false);
  ctx.setTransform(PR, 0, 0, PR, 0, 0); ctx.globalAlpha = 1;
  drawSnow(ctx, 'near');
  drawRain(ctx);
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

  // ---- ground strip: near snow bank and the leaf pile, above the page content ----
  drawOffsetY = H - GH;
  ctxG.setTransform(1, 0, 0, 1, 0, 0);
  ctxG.globalAlpha = 1;
  ctxG.clearRect(0, 0, cvGround.width, cvGround.height);
  ctxG.setTransform(PR, 0, 0, PR, 0, -(H - GH) * PR);
  drawSnowBank(ctxG, 'near');
  for (var p = 0; p < pile.length; p++) drawLeaf(pile[p], t, true, ctxG);
  drawOffsetY = 0;
  if (ENV.scene === 'autumn') {
    ctxG.setTransform(PR, 0, 0, PR, 0, -(H - GH) * PR);
    ctxG.globalAlpha = 1;
    landGlow(ctxG, H);
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
    drawDragonfly(ctxF, t);
    drawCricket(ctxF, t);
    frontCleared = false;
  } else if (!frontCleared) {
    ctxF.setTransform(1, 0, 0, 1, 0, 0);
    ctxF.clearRect(0, 0, cvFront.width, cvFront.height);
    frontCleared = true;
  }
  // ---- near canvas: the nearest falling leaves, on the table too ----
  if (dynNearMul > 0.01) {
    ctxN.setTransform(1, 0, 0, 1, 0, 0);
    ctxN.clearRect(0, 0, cvNear.width, cvNear.height);
    ctxN.setTransform(PR, 0, 0, PR, 0, 0);
    for (var nl = 0; nl < leaves.length; nl++) if (isFrontLeaf(leaves[nl])) drawLeaf(leaves[nl], t, false, ctxN);
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
  var want = dynWantsToRun();
  if (!want && dynMaster < 0.01) {
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
  dynStep(dt, lastT, want);
  requestAnimationFrame(dynLoop);
}

/* ============================================================
   10. TAP & SWIPE WIND — only while the leaves are in front (message panels)
   ============================================================ */
var ptr = null;
window.addEventListener('pointerdown', function(e) {
  if (dynFrontMul < 0.5 || !S.tapWind) { ptr = null; return; }
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
  S.fogDensity = S.condition === 'fog' ? 0.7 : 0;
  envTimer = 0;
}

/* ============================================================
   START
   ============================================================ */
if (cvBack && cvGround && cvFront && cvNear && ctx && ctxG && ctxF && ctxN) {
  makeSprites();
  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', resize);
  requestAnimationFrame(dynLoop);
}
return { onWeather: onWeather };

})();

/* ============ BOOTSTRAP ============ */
applyTimeTheme();
setInterval(applyTimeTheme, 5 * 60 * 1000);
updateGlobalHint();