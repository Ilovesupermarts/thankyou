/* ============================================================
   app.js — v1.3

   ------------------------------------------------------------
   Changelog:
     v1.3
       - Shippo tracer fix: scheduleShippoTracer() no longer calls
         stopShippoTracer() at its head. The previous version added
         .drawing inside triggerShippoCircle() and then removed it
         synchronously in the recursive scheduleShippoTracer() call
         on the very next line, all within the same JS task — so
         the browser never rendered a single frame of the stroke-
         dashoffset animation and the tracers were invisible.
         Now split into two functions: clearShippoDrawings() only
         strips the class, stopShippoTracer() cancels the timer and
         clears drawings (used by lifecycle hooks), and
         scheduleShippoTracer() only cancels a pending timer tick.
       - Ambient Shippo mosaic + circle tracer added. Replaces the
         washi watermark (removed in index.html and main.css). The
         mosaic is a static tiled SVG pattern at z-index -2; the
         tracer pool is three 68x68 SVG circles that snap to tile
         vertices and play a 2.5s stroke-dashoffset draw animation.
         Gated to autumn and to the active carousel state
         (mapleLeaves.classList.contains('active')) so the name
         screen, the koi pond, and the intro stay clean.
       - Ambient video removed. Replaced by a pre-feathered CSS
         light mesh (.ambient-mesh, three radial-gradient orbs).
       - Default theme switched to autumn.
       - Backdrop-filters removed in main.css on .summary, .msg-3,
         .reject-row, .confirm-screen, .alert-screen, .tanzaku-screen.
       - will-change: opacity, transform removed from .panel-phrase.
       - Koi tap flinch: gated on the tap landing on the koi PNG.
       - Ambient subtle ripples on the koi screen.
       - Receipt landing serialization.
       - Receipt close restores previous scroll position.
       - Panel-1 post-beat delay lengthened 500 → 1000ms.
       - Scroll gate: body scroll only unlocked at last panel.
       - Reset hot-spot.
       - Transition-line accordion drift.
       - Maple leaf overlay: z-index -1, seven Momiji.
       - Ambient sound rotation: wind chime and nature recording
         alternate at random intervals, random offset and duration
         per play, with per-play fade envelopes. Silence between
         plays is intentional and expected.
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

/* ============ THEME TOGGLE ============ */
var themeToggle = document.getElementById('themeToggle');
var currentTheme = 'autumn';
function applyTheme(theme) {
  currentTheme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  if (themeToggle) themeToggle.textContent = (theme === 'autumn') ? '🍁' : '🌸';
  /* v1.3: tracer lifecycle. The single source of truth for "is
     the app past the intro?" is the .active class on the maple
     leaves overlay — it is added the moment Panel 0 mounts inside
     triggerKoiStart() and removed synchronously in
     returnToStartScreen(). Gating on that instead of introHasRun
     closes the mid-intro race.

     The ambient sound rotation shares this exact lifecycle: it
     starts and stops in lockstep with the tracer so a mid-run theme
     toggle cannot leave sound playing alone against a sakura theme. */
  var isCarouselRunning = mapleLeaves && mapleLeaves.classList.contains('active');
  if (theme === 'autumn' && isCarouselRunning) {
    scheduleShippoTracer();
    startAmbient();
  } else {
    stopShippoTracer();
    stopAmbient();
  }
}
if (themeToggle) {
  themeToggle.addEventListener('click', function(e) {
    e.preventDefault(); e.stopPropagation();
    haptic(10);
    applyTheme(currentTheme === 'autumn' ? 'default' : 'autumn');
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

document.addEventListener('touchstart', function(e) {
  if (e.touches.length > 1) e.preventDefault();
}, { passive: false });

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

var DROP_SOUND_URL = 'Sound/cave-water-drop-echo-a053fcdf.mp3';

/* Ambient rotation pool. Each entry: { name, url, peak }. peak is the
   per-play maximum gain relative to the master gain (0.5), before the
   per-play random variance of 0.75–1.25× applied in playAmbientSound().
   The wind chime can sit higher than the nature recording because its
   energy is sparse and time-localised (isolated chimes with long
   decays); a continuous birds-forest-river bed at the same peak reads
   as more intrusive. */
var AMBIENT_SOUNDS = [
  { name: 'windChime', url: 'Sound/freesound_community-wind-chimes-32150.mp3', peak: 0.22 },
  { name: 'nature',    url: 'Sound/baranova_n-birds-forest-river-409229.mp3',  peak: 0.18 }
];

function initSound() {
  if (soundAudioCtx) return;
  try {
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    soundAudioCtx = new Ctx();
    soundMasterGain = soundAudioCtx.createGain();
    soundMasterGain.gain.value = 0.5;
    soundMasterGain.connect(soundAudioCtx.destination);
    if (soundAudioCtx.state === 'suspended') {
      try { soundAudioCtx.resume(); } catch (e) {}
    }
    Promise.all([
      synthesizeTock(),
      synthesizeCheck(),
      synthesizePaper(),
      loadDropBuffer(),
      loadAudioBuffer(AMBIENT_SOUNDS[0].url),
      loadAudioBuffer(AMBIENT_SOUNDS[1].url)
    ]).then(function(bufs) {
      soundBuffers.tock = bufs[0];
      soundBuffers.check = bufs[1];
      soundBuffers.paper = bufs[2];
      if (bufs[3]) soundBuffers.drop = bufs[3];
      if (bufs[4]) soundBuffers[AMBIENT_SOUNDS[0].name] = bufs[4];
      if (bufs[5]) soundBuffers[AMBIENT_SOUNDS[1].name] = bufs[5];
      soundReady = true;
    }).catch(function() { /* silent */ });
  } catch (e) { /* silent */ }
}

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

function loadDropBuffer() {
  return fetch(DROP_SOUND_URL)
    .then(function(r) {
      if (!r.ok) throw new Error('drop fetch failed');
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

/* ============ AMBIENT SOUND ROTATION ============
   Two ambient nature recordings alternate at random intervals. Each
   play picks a random 6–14s window from the source buffer at a random
   offset, with linear fade-in / fade-out envelopes so no play ever
   clicks at the head or tail.

   Scheduling: the gap is measured start-to-start. A play of 6–14s
   followed by a 30–45s gap yields roughly 16–39 seconds of silence
   between sounds. Silence between plays is intentional; there is no
   requirement that one of the two be playing at any given moment.

   Lifecycle is shared with the Shippō tracer and maple leaves via the
   .active class on #mapleLeaves. That means:
     - triggerKoiStart() calls startAmbient() alongside
       scheduleShippoTracer() the moment Panel 0 mounts.
     - returnToStartScreen() calls stopAmbient() alongside
       stopShippoTracer().
     - applyTheme() toggles both in lockstep so a mid-run theme
       switch cannot leave sound playing alone.

   Buffers are loaded once, on the first pointerdown, well before the
   koi screen completes. If a load failed (offline, decode error, file
   missing), playAmbientSound() skips that entry silently and the
   rotation continues — the next entry is tried normally. */
var AMBIENT_FIRST_MIN  = 0;      // first sound: immediate
var AMBIENT_FIRST_MAX  = 0;      // (set MAX above MIN for jitter)
var AMBIENT_GAP_MIN    = 30000;  // start-to-start gap between plays
var AMBIENT_GAP_MAX    = 45000;
var AMBIENT_PLAY_MIN   = 6000;   // min play duration (6s)
var AMBIENT_PLAY_MAX   = 14000;  // max play duration (14s)
var AMBIENT_FADE_IN    = 2000;   // nominal fade-in
var AMBIENT_FADE_OUT   = 3000;   // nominal fade-out

var ambientTimer = null;
var ambientSource = null;
var ambientGain = null;
var ambientIndex = 0;

function startAmbient() {
  stopAmbient();
  ambientIndex = 0;
  var firstGap = AMBIENT_FIRST_MIN +
    Math.random() * (AMBIENT_FIRST_MAX - AMBIENT_FIRST_MIN);
  ambientTimer = setTimeout(function() {
    ambientTimer = null;
    playAmbientSound();
    scheduleNextAmbient();
  }, firstGap);
}

function scheduleNextAmbient() {
  var gap = AMBIENT_GAP_MIN +
    Math.random() * (AMBIENT_GAP_MAX - AMBIENT_GAP_MIN);
  ambientTimer = setTimeout(function() {
    ambientTimer = null;
    playAmbientSound();
    scheduleNextAmbient();
  }, gap);
}

function stopAmbient() {
  if (ambientTimer) {
    clearTimeout(ambientTimer);
    ambientTimer = null;
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
}

function playAmbientSound() {
  if (!SOUND_ENABLED || !soundReady || !soundAudioCtx) return;
  if (!mapleLeaves || !mapleLeaves.classList.contains('active')) return;
  if (!AMBIENT_SOUNDS.length) return;

  /* Advance the rotation first, so a failed play (missing buffer)
     still consumes its slot and the next tick tries the other sound. */
  var entry = AMBIENT_SOUNDS[ambientIndex];
  ambientIndex = (ambientIndex + 1) % AMBIENT_SOUNDS.length;

  var buffer = soundBuffers[entry.name];
  if (!buffer) return;

  var bufferDur = buffer.duration;
  var playDur = AMBIENT_PLAY_MIN +
    Math.random() * (AMBIENT_PLAY_MAX - AMBIENT_PLAY_MIN);
  if (playDur > bufferDur - 1) playDur = bufferDur - 1;
  if (playDur <= 0) return;

  var maxStart = Math.max(0, bufferDur - playDur - 0.5);
  var startOffset = Math.random() * maxStart;

  /* Cap the fades against the play duration so a short play still has
     a sustain region rather than a pure triangle envelope. */
  var fadeIn = Math.min(AMBIENT_FADE_IN, playDur * 0.25);
  var fadeOut = Math.min(AMBIENT_FADE_OUT, playDur * 0.35);
  var peak = entry.peak * (0.75 + Math.random() * 0.5);

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

  ambientSource = src;
  ambientGain = gain;

  src.onended = function() {
    if (ambientSource === src) ambientSource = null;
    if (ambientGain === gain) ambientGain = null;
    try { gain.disconnect(); } catch (e) {}
  };
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

function loadPresetsFromServer() {
  return fetch('presets.json?v=' + Date.now())
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
  return fetch('quotes.json?v=' + Date.now())
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
function loadPanelInto(anchorId, url) {
  return fetch(url + '?v=' + Date.now())
    .then(function(r) { if (!r.ok) throw new Error(); return r.text(); })
    .then(function(text) {
      var anchor = document.getElementById(anchorId);
      if (anchor) anchor.innerHTML = convertPanelText(text);
    })
    .catch(function() { /* silent */ });
}
function loadPanelHtml(url) {
  return fetch(url + '?v=' + Date.now())
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
   ODOMETER ENGINE
   ============================================================ */
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
   COUNTER ODOMETER
   ============================================================ */
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
   RUNTIME DIGIT ADVANCE MEASUREMENT
   ============================================================ */
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

/* ============ DOM REFS ============ */
var nameScreen = document.getElementById('nameScreen');
var nameInput = document.getElementById('nameInput');
var nameBtn = document.getElementById('nameBtn');
var nameScreenRows = document.getElementById('nameScreenRows');
var nameScreenTable = document.getElementById('nameScreenTable');
var nameScreenTotalValue = document.getElementById('nameScreenTotalValue');
var therapistNameEl = document.getElementById('therapistName');
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
var therapistGreeting = null;
var tableUnlocked = false;
var tableVisited = false;
var currentPanel = 0;
var totalPanels = 5;
var rejected = false;
var confirmedTipAmount = 1500;
var firstServiceInReceipt = false;
var stageWidth = window.innerWidth;
var refWidth = Math.min(window.innerWidth, 600);
var rejectScrollTimer = null;

var startBtn = document.getElementById('startBtn');
var blossomScreen = document.getElementById('blossomScreen');
var introOverlay = document.getElementById('introOverlay');
var nameColumn = document.getElementById('nameColumn');
var introHasRun = false;

/* Koi water effect DOM refs */
var koiDiveWrap = document.getElementById('koiDiveWrap');
var rippleLayer = document.getElementById('rippleLayer');

/* v1.3: maple leaf overlay. */
var mapleLeaves = document.getElementById('mapleLeaves');

/* v1.3: Shippo mosaic circle tracer pool — three reusable nodes. */
var shippoTracers = [
  document.getElementById('shippoTracer0'),
  document.getElementById('shippoTracer1'),
  document.getElementById('shippoTracer2')
];
var shippoTracerIndex = 0;
var shippoTimer = null;

var submitBtn = document.getElementById('submitBtn');
var confirmScreen = document.getElementById('confirmScreen');
var confirmYes = document.getElementById('confirmYes');
var confirmNo = document.getElementById('confirmNo');
var receiptScreen = document.getElementById('receiptScreen');
var receiptItems = document.getElementById('receiptItems');
var receiptTotal = document.getElementById('receiptTotal');
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
  if (isReceiptOpen) {
    numpad.classList.add('receipt-mode');
    numpad.classList.add('visible');
    repositionNumpad();
    return;
  } else {
    numpad.classList.remove('receipt-mode');
  }
  if (!tableCard) return;
  if (window.innerWidth <= 1250) return;
  if (rejected || numpadSuppressed) {
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
   PANEL PHRASE REVEAL
   ============================================================ */
var PANEL_PHRASE_MIN = 5;
var PANEL_PHRASE_MAX = 10;
var PANEL_PHRASE_RISE = 30;
var PANEL_PHRASE_DURATION = 500;
var PANEL_PHRASE_STAGGER_MAX = 600;
var PANEL_PHRASE_DELAY = 300;
var PANEL_PHRASE_MODE = 'coexist';

var PANEL_1_POST_BEAT_DELAY = 1000;

var panelPhraseTimers = [];

function escapeHtmlForPhrase(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/* ============================================================
   CHUNKER
   ============================================================ */
function isJapanesePunctuation(ch) {
  return ch === '、' || ch === '。' || ch === '！' || ch === '？';
}

function chunkPanelText(text) {
  var clean = String(text).replace(/\s+/g, '');
  if (clean === '') return [];

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
   RECURSIVE TEXT-NODE WALKER
   ============================================================ */
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
   PANEL-1 SPECIAL SEQUENCE
   ============================================================ */
function buildPanel1OpeningBeats(panelEl) {
  if (!panelEl) return;
  var contentEl = panelEl.querySelector('.panel-content');
  if (!contentEl) return;
  var body = contentEl.querySelector('#panel1Body');
  if (!body) return;

  if (therapistGreeting === null) {
    var captured = '';
    var srcSpan = contentEl.querySelector('.therapist-name');
    if (srcSpan) {
      var cur = srcSpan.nextSibling;
      while (cur && cur !== body) {
        if (cur.nodeType === 3) captured += cur.nodeValue || '';
        else if (cur.nodeType === 1) captured += cur.textContent || '';
        cur = cur.nextSibling;
      }
    }
    captured = captured.replace(/\s+/g, '');
    var fc = captured.indexOf('、');
    therapistGreeting = (fc >= 0) ? captured.substring(fc) : captured;
    if (therapistGreeting === '') therapistGreeting = '、初めまして。';
  }

  var staleBeats = contentEl.querySelectorAll('.panel-1-beat');
  for (var s = 0; s < staleBeats.length; s++) {
    if (staleBeats[s].parentNode) staleBeats[s].parentNode.removeChild(staleBeats[s]);
  }

  var child = contentEl.firstChild;
  while (child && child !== body) {
    var nextChild = child.nextSibling;
    if (child.nodeType === 3) {
      contentEl.removeChild(child);
    } else if (child.nodeType === 1 && child !== body) {
      contentEl.removeChild(child);
    }
    child = nextChild;
  }

  var full = therapistDisplayName + therapistGreeting;
  var commaIdx = full.indexOf('、');
  var beat1Text, beat2Text;
  if (commaIdx >= 0) {
    beat1Text = full.substring(0, commaIdx + 1);
    beat2Text = full.substring(commaIdx + 1);
  } else {
    beat1Text = full;
    beat2Text = '';
  }
  var nameOnly = beat1Text.replace(/、$/, '').replace(/さん$/, '');
  if (nameOnly === '') nameOnly = beat1Text.replace(/、$/, '');

  var beat1 = document.createElement('span');
  beat1.className = 'panel-phrase panel-1-beat';
  beat1.setAttribute('data-beat', '1');
  var nameSpan = document.createElement('span');
  nameSpan.id = 'therapistName';
  nameSpan.className = 'therapist-name';
  nameSpan.textContent = nameOnly + 'さん';
  beat1.appendChild(nameSpan);
  if (commaIdx >= 0) beat1.appendChild(document.createTextNode('、'));

  var beat2 = document.createElement('span');
  beat2.className = 'panel-phrase panel-1-beat';
  beat2.setAttribute('data-beat', '2');
  beat2.textContent = beat2Text;

  contentEl.insertBefore(beat1, body);
  contentEl.insertBefore(beat2, body);

  therapistNameEl = nameSpan;
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
  var body = contentEl.querySelector('#panel1Body');

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
    var baseDelay = PANEL_PHRASE_MODE === 'sequence'
      ? PANEL_PHRASE_DELAY
      : Math.max(0, PANEL_PHRASE_DELAY - 300);
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
   PANEL PHRASE REVEAL (general)
   ============================================================ */
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

  var baseDelay = PANEL_PHRASE_MODE === 'sequence'
    ? PANEL_PHRASE_DELAY
    : Math.max(0, PANEL_PHRASE_DELAY - 300);

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

  var isPanel1 = panelEl.getAttribute('data-panel') === '0';

  if (isPanel1) {
    var body = contentEl.querySelector('#panel1Body');
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

  var isPanel1 = targetPanel.getAttribute('data-panel') === '0';

  if (isPanel1) {
    resetPanel1Beats(targetPanel);
    var body = targetPanel.querySelector('#panel1Body');
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

/* v1.3: return to the blossom start screen. */
function returnToStartScreen() {
  if (!nameConfirmed) return;
  if (receiptScreen && receiptScreen.classList.contains('visible')) return;
  if (thankyouScreen && thankyouScreen.classList.contains('visible')) return;

  stopAmbientRipple();
  clearKoiTimers();
  resetWind();

  if (mapleLeaves) mapleLeaves.classList.remove('active');
  stopShippoTracer();
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
    }
  }

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
function updateIntroHintVisibility() {
  if (!globalHint) return;
  if (!nameConfirmed) { globalHint.classList.remove('shown'); return; }
  if (blossomScreen.classList.contains('visible')) {
    globalHint.classList.remove('shown');
    return;
  }
  if (!tableEnteredView) { globalHint.classList.add('shown'); return; }
  var rect = tableCard.getBoundingClientRect();
  var vh = window.innerHeight;
  if (rect.top < vh * 0.6) globalHint.classList.remove('shown');
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

/* ============ FIX-002 ============ */
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
var windEnabled = true;

try {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
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
   TRANSITION-LINE BODY WRAPPER
   ============================================================ */
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
   TRANSITION-LINE ACCORDION DRIFT
   ============================================================ */
var DRIFT_CONFIG = {
  LINE_SPREAD_FACTOR: 0.075,
  MAX_LINE_SPREAD_PX: 38,
  GLOBAL_DRIFT_FACTOR: 0.08,
  HORIZONTAL_SWAY_PX: 20,
  CORE_ZONE_PX: 180,
  MAX_ZONE_PX: 420
};

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
  var rect = lineWrapper.getBoundingClientRect();
  var blockCenter = rect.top + rect.height / 2;
  var d = blockCenter - vc;
  var absDist = Math.abs(d);

  if (scrollY <= 0 || absDist >= DRIFT_CONFIG.MAX_ZONE_PX) {
    for (var k = 0; k < totalItems; k++) {
      driftItems[k].style.transform = '';
    }
    return;
  }

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

    item.style.transform = 'translate(' + swayX.toFixed(2) + 'px, ' + totalY.toFixed(2) + 'px)';
  }
}

var tbRafPending = false;
function scheduleTransitionBodyUpdate() {
  if (tbRafPending) return;
  tbRafPending = true;
  requestAnimationFrame(function() {
    tbRafPending = false;
    updateTransitionBodyEffects();
  });
}

/* ============================================================
   RECEIPT SCROLL RESET + INDICATOR
   ============================================================ */
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
   ============================================================ */
var RIPPLE_COLOURS_STRONG = [
  'rgba(253, 243, 216, 0.95)',
  'rgba(247, 185, 60, 0.85)',
  'rgba(255, 240, 200, 0.70)'
];
var RIPPLE_COLOURS_SUBTLE = [
  'rgba(247, 185, 60, 0.55)',
  'rgba(255, 240, 200, 0.40)'
];
var RIPPLE_COLOURS_TRAIL  = ['rgba(247, 185, 60, 0.40)'];

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

/* ============================================================
   KOI FLINCH
   ============================================================ */
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
        activatePanel(0);

        /* v1.3: activate the ambient maple leaves, start the
           Shippo tracer, and start the ambient sound rotation.
           All three share the same .active gate on #mapleLeaves,
           which is the single source of truth for "past the intro,
           carousel running". */
        if (mapleLeaves) mapleLeaves.classList.add('active');
        scheduleShippoTracer();
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

  var p1Panel = document.querySelector('.panel[data-panel="0"]');
  if (p1Panel) buildPanel1OpeningBeats(p1Panel);

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
    var p3Panel = document.querySelector('.panel[data-panel="2"]');
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

  nameInput.classList.add('confirmed');
  haptic(14);
  setTimeout(function() {
    try { nameInput.blur(); } catch (err) {}
    nameScreen.classList.add('hidden');
    blossomScreen.classList.add('visible');
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
  startInfoUpdates();
  loadPresetsFromServer().then(function() {
    buildNameScreenRows();
    setTimeout(function() { try { nameInput.focus(); } catch (err) {} }, 300);
  });
  loadQuotesFromServer();
  loadAllPanels().then(function() {
    repositionHintGroupAfterLayout();
    repositionNumpad();
    for (var i = 0; i < panels.length; i++) {
      preparePanel(panels[i]);
    }
  });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function() {
      repositionHintGroupAfterLayout();
      repositionNumpad();
    });
  }
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(function() {});
  }
  buildMotes();

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
  var firstRowIncluded = false;
  var preset0Val = (PRESETS[0] && PRESETS[0].name) ? PRESETS[0].name : '';
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
    if (itemCount === 0 && preset0Val !== '' && name === preset0Val) firstRowIncluded = true;
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
  firstServiceInReceipt = firstRowIncluded;

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
    firstServiceInReceipt = false;
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

    if (!receiptHasLanded) {
      receiptHasLanded = true;
      var paperWrap = receiptScreen.querySelector('.receipt-paper-wrap');

      if (paperWrap) {
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
    e.preventDefault();
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
stage.addEventListener('touchmove', onTouchMove, { passive: false });
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

document.addEventListener('touchmove', function(e) {
  if (tableUnlocked) return;
  if (isHorizontal) return;
  if (e.target && e.target.closest && e.target.closest('#nameScreen')) return;
  e.preventDefault();
}, { passive: false });

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

function updateSummaryVisibility() {
  var rows = getRows();
  var vh = window.innerHeight;

  if (summaryEverShown && rows.length >= 2) {
    var secondRect = rows[1].getBoundingClientRect();
    var firstRect  = rows[0].getBoundingClientRect();
    var secondVisible  = (secondRect.top < vh && secondRect.bottom > 0);
    var firstOffBottom = (firstRect.top >= vh);
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

  var tableRect = tableCard.getBoundingClientRect();
  var rejectRect = rejectRow.getBoundingClientRect();
  var top = Math.min(tableRect.top, rejectRect.top);
  var bottom = Math.max(tableRect.bottom, rejectRect.bottom);
  var totalHeight = bottom - top;
  if (totalHeight <= 0) {
    summaryBar.classList.remove('visible');
    summaryHysteresisOn = false;
    updateNumpadVisibility();
    return;
  }
  var visibleTop = Math.max(top, 0);
  var visibleBottom = Math.min(bottom, vh);
  var visibleHeight = Math.max(0, visibleBottom - visibleTop);
  var ratio = visibleHeight / totalHeight;
  var spansViewport = (top <= 0 && bottom >= vh);
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

function evaluateScrollState() {
  var lineRect = transitionLine.getBoundingClientRect();
  var vh = window.innerHeight;
  if (lineRect.top < vh - 20) {
    revealTableSection();
  }
  updateSummaryVisibility();
  updateIntroHintVisibility();
}

var rafPending = false;
function scheduleEvaluation() {
  if (rafPending) return;
  rafPending = true;
  requestAnimationFrame(function() {
    rafPending = false;
    evaluateScrollState();
  });
}

window.addEventListener('scroll', function() {
  var y = window.pageYOffset || document.documentElement.scrollTop;
  var goingDown = y > lastScrollY + 1;
  var goingUp = y < lastScrollY - 1;
  lastScrollY = y;
  if (goingDown) lastScrollDirection = 'down';
  else if (goingUp) lastScrollDirection = 'up';

  scheduleTransitionBodyUpdate();

  if (goingDown || goingUp) {
    scheduleEvaluation();
  }

  if (!tableVisited && tableCard) {
    var tcRect = tableCard.getBoundingClientRect();
    if (tcRect.top < window.innerHeight && tcRect.bottom > 0) {
      tableVisited = true;
    }
  }
}, { passive: true });

window.addEventListener('resize', function() {
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
}
function fetchNagoyaWeather() {
  var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + NAGOYA.lat + '&longitude=' + NAGOYA.lon +
            '&current=temperature_2m,weather_code&timezone=Asia%2FTokyo';
  fetch(url).then(function(r) { return r.json(); }).then(function(data) {
    if (!data || !data.current) return;
    var temp = data.current.temperature_2m;
    var code = data.current.weather_code;
    if (typeof temp === 'number') infoTemp.textContent = Math.round(temp) + '°';
    if (typeof code === 'number') {
      var bucket = weatherBucket(code);
      infoWeather.textContent = weatherEmoji(bucket);
      document.documentElement.setAttribute('data-weather', bucket);
    }
  }).catch(function() {});
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
function applyTyPanel1Content() {
  if (!tyPanel1Content) return;
  if (firstServiceInReceipt) tyPanel1Content.innerHTML = TY_PANEL1_MICROBIKINI_HTML;
  else tyPanel1Content.innerHTML = TY_PANEL1_DEFAULT_HTML;
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

/* ============================================================
   SHIPPO MOSAIC RANDOM CIRCLE TRACER
   ------------------------------------------------------------
   Mathematical snap:
   In Shippo (60x60 tile, r=30), circle centers occur at
   (j * 30px, k * 30px) where (j + k) is even.
   SVG center offset is 34px (from 68x68 viewbox), so the
   translate is (j*30 - 34, k*30 - 34).

   v1.3 fix: scheduleShippoTracer() no longer calls
   stopShippoTracer() at its head. The previous version added
   .drawing inside triggerShippoCircle() and then removed it
   synchronously in the recursive scheduleShippoTracer() call on
   the very next line, all within the same JS task — so the
   browser never rendered a single frame of the stroke-dashoffset
   animation and the tracers were invisible.

   Now split into three functions:
     clearShippoDrawings()  strips .drawing from all three nodes
     stopShippoTracer()     cancels the timer AND clears drawings
                            (used by lifecycle hooks)
     scheduleShippoTracer() only cancels a pending timer tick
   ============================================================ */
function triggerShippoCircle() {
  if (currentTheme !== 'autumn') return;
  var tracer = shippoTracers[shippoTracerIndex];
  if (!tracer) return;
  shippoTracerIndex = (shippoTracerIndex + 1) % shippoTracers.length;

  var vw = window.innerWidth;
  var vh = window.innerHeight;
  var maxCols = Math.floor(vw / 30);
  var maxRows = Math.floor(vh / 30);

  var j = 1 + Math.floor(Math.random() * Math.max(1, maxCols - 2));
  var k = 1 + Math.floor(Math.random() * Math.max(1, maxRows - 2));

  /* Enforce Shippo geometric parity — circles only sit at even
     (j + k) intersections of the 60px grid. */
  if ((j + k) % 2 !== 0) j += 1;

  var x = (j * 30) - 34;
  var y = (k * 30) - 34;
  var startAngle = Math.floor(Math.random() * 4) * 90;

  tracer.style.transform = 'translate3d(' + x + 'px, ' + y + 'px, 0) rotate(' + startAngle + 'deg)';
  tracer.classList.remove('drawing');
  void tracer.offsetWidth; /* force reflow so the animation restarts */
  tracer.classList.add('drawing');
}

function clearShippoDrawings() {
  for (var i = 0; i < shippoTracers.length; i++) {
    if (shippoTracers[i]) shippoTracers[i].classList.remove('drawing');
  }
}

function stopShippoTracer() {
  if (shippoTimer) {
    clearTimeout(shippoTimer);
    shippoTimer = null;
  }
  clearShippoDrawings();
}

function scheduleShippoTracer() {
  /* Only clear a pending timer tick — do NOT remove .drawing from
     active tracers, or the animation gets cancelled in the same
     task it was started in. */
  if (shippoTimer) {
    clearTimeout(shippoTimer);
    shippoTimer = null;
  }
  if (currentTheme !== 'autumn') return;

  /* Average 1.0s cadence (0.75s to 1.25s organic jitter). */
  var delay = 750 + Math.random() * 500;
  shippoTimer = setTimeout(function() {
    triggerShippoCircle();
    scheduleShippoTracer();
  }, delay);
}

/* ============ BOOTSTRAP ============ */
applyTimeTheme();
setInterval(applyTimeTheme, 5 * 60 * 1000);
updateGlobalHint();