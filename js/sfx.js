// ===== 효과음 엔진 =====
// 샘플을 한 번만 내려받아 디코딩해 두고 Web Audio로 재생한다.
// 발사할 때마다 Audio 요소를 복제하면 재생 대기열이 밀려서, 전투가 끝난 뒤에도 소리가 한참 이어진다.
// 여기서는 아직 준비되지 않았거나 간격이 너무 짧은 요청은 쌓지 않고 버린다.
(function (root) {
  'use strict';

  var BASE = 'audio/sfx/';
  var VERSION = '20261109_02';

  // gain: 믹스 음량, gap: 같은 소리의 최소 간격(ms), voices: 동시 재생 수, pitch: 재생 속도 흔들림 폭
  var BANK = {
    // 초당 여러 번 울리는 소리는 작고 짧게
    shot:        { files: ['shot-1', 'shot-2'], gain: 0.07, gap: 80, voices: 3, pitch: 0.08 },
    laser:       { files: ['laser'], gain: 0.07, gap: 80, voices: 3, pitch: 0.1 },
    bossHit:     { files: ['boss-hit-1', 'boss-hit-2'], gain: 0.14, gap: 90, voices: 3, pitch: 0.1 },
    coin:        { files: ['coin-1', 'coin-2', 'coin-3'], gain: 0.18, gap: 35, voices: 4, pitch: 0.05 },
    shatter:     { files: ['shatter-1', 'shatter-2'], gain: 0.2, gap: 70, voices: 3, pitch: 0.08 },
    hurt:        { files: ['hurt'], gain: 0.32, gap: 200, voices: 1, pitch: 0.05 },
    fruit:       { files: ['fruit'], gain: 0.24, gap: 200, voices: 1 },
    heart:       { files: ['heart'], gain: 0.4, gap: 200, voices: 1 },
    // 진화
    evolve:            { files: ['evolve'], gain: 0.42, gap: 500, voices: 1 },
    evoAnomalocaris:   { files: ['evo-anomalocaris'], gain: 0.36, gap: 500, voices: 1 },
    evoDunkleosteus:   { files: ['evo-dunkleosteus'], gain: 0.36, gap: 500, voices: 1 },
    evoTiktaalik:      { files: ['evo-tiktaalik'], gain: 0.36, gap: 500, voices: 1 },
    evoPlesiosaur:     { files: ['evo-plesiosaur'], gain: 0.36, gap: 500, voices: 1 },
    evoQuetzalcoatlus: { files: ['evo-quetzalcoatlus'], gain: 0.36, gap: 500, voices: 1 },
    evoFinch:          { files: ['evo-finch'], gain: 0.36, gap: 500, voices: 1 },
    levelUp:           { files: ['level-up'], gain: 0.22, gap: 500, voices: 1 },
    // 보스
    bossWarning:   { files: ['boss-warning'], gain: 0.38, gap: 1000, voices: 1 },
    bossAmmonite:  { files: ['boss-ammonite'], gain: 0.45, gap: 1000, voices: 1 },
    bossMegalodon: { files: ['boss-megalodon'], gain: 0.45, gap: 1000, voices: 1 },
    bossTrex:      { files: ['boss-trex'], gain: 0.45, gap: 1000, voices: 1 },
    bossUfo:       { files: ['boss-ufo'], gain: 0.45, gap: 1000, voices: 1 },
    atkInk:        { files: ['atk-ink'], gain: 0.16, gap: 150, voices: 2, pitch: 0.08 },
    atkTooth:      { files: ['atk-tooth'], gain: 0.16, gap: 150, voices: 2, pitch: 0.08 },
    atkFire:       { files: ['atk-fire'], gain: 0.16, gap: 150, voices: 2, pitch: 0.08 },
    atkBeam:       { files: ['atk-beam'], gain: 0.16, gap: 150, voices: 2, pitch: 0.08 },
    bossDefeat:    { files: ['boss-defeat'], gain: 0.5, gap: 1000, voices: 1 },
    // 세계와 능력
    turbulence: { files: ['turbulence'], gain: 0.22, gap: 1000, voices: 1 },
    thunder:    { files: ['thunder'], gain: 0.2, gap: 3500, voices: 1, pitch: 0.08 },
    blackHole:  { files: ['black-hole'], gain: 0.3, gap: 5000, voices: 1 },
    booster:    { files: ['booster'], gain: 0.28, gap: 500, voices: 1 },
    slowmo:     { files: ['slowmo'], gain: 0.3, gap: 500, voices: 1 },
    splash:     { files: ['splash'], gain: 0.35, gap: 500, voices: 1 },
    revive:     { files: ['revive'], gain: 0.3, gap: 500, voices: 1 },
    gameOver:   { files: ['game-over'], gain: 0.3, gap: 1000, voices: 1 },
    reward:     { files: ['reward'], gain: 0.25, gap: 200, voices: 1 }
  };

  var SFX = root.SFX = {};
  var ctx = null, output = null;
  var unlocked = false, loaded = 0, failed = 0, total = 0;
  var slots = {};

  Object.keys(BANK).forEach(function (name) {
    slots[name] = { buffers: [], last: -Infinity, turn: 0, voices: [] };
    total += BANK[name].files.length;
  });

  function now() { return (root.performance && performance.now) ? performance.now() : Date.now(); }

  function fetchBuffer(name, file, done) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', BASE + file + '.mp3?v=' + VERSION, true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = function () {
      if (xhr.status && xhr.status >= 400) { failed++; done(); return; }
      // 사파리 호환을 위해 콜백 방식으로 디코딩한다
      ctx.decodeAudioData(xhr.response, function (buffer) {
        slots[name].buffers.push(buffer);
        loaded++;
        done();
      }, function () { failed++; done(); });
    };
    xhr.onerror = function () { failed++; done(); };
    xhr.send();
  }

  function loadAll() {
    var queue = [];
    Object.keys(BANK).forEach(function (name) {
      BANK[name].files.forEach(function (file) { queue.push([name, file]); });
    });
    var running = 0;
    function next() {
      while (running < 4 && queue.length) {
        var job = queue.shift();
        running++;
        fetchBuffer(job[0], job[1], function () { running--; next(); });
      }
    }
    next();
  }

  // 브라우저 자동재생 정책 때문에 첫 입력이 들어온 뒤에 오디오를 연다
  function unlock() {
    if (unlocked) return;
    try {
      ctx = getAudioCtx();
      var limiter = ctx.createDynamicsCompressor();
      limiter.threshold.value = -12;
      limiter.knee.value = 10;
      limiter.ratio.value = 6;
      limiter.attack.value = 0.003;
      limiter.release.value = 0.14;
      limiter.connect(ctx.destination);
      output = limiter;
      unlocked = true;
      // iOS는 실제로 한 번 재생해야 소리가 풀린다
      var silent = ctx.createBufferSource();
      silent.buffer = ctx.createBuffer(1, 1, 22050);
      silent.connect(ctx.destination);
      silent.start(0);
      loadAll();
    } catch (e) { unlocked = false; }
  }

  SFX.init = function () {
    ['mousedown', 'pointerup', 'touchend', 'keydown'].forEach(function (type) {
      document.addEventListener(type, unlock, true);
    });
  };

  function release(slot, voice) {
    var i = slot.voices.indexOf(voice);
    if (i >= 0) slot.voices.splice(i, 1);
    try { voice.gain.disconnect(); } catch (e) {}
  }

  function fadeOut(voice, ms) {
    var t = ctx.currentTime, end = t + ms / 1000;
    try {
      voice.gain.gain.cancelScheduledValues(t);
      voice.gain.gain.setValueAtTime(voice.gain.gain.value, t);
      voice.gain.gain.linearRampToValueAtTime(0, end);
      voice.source.stop(end + 0.01);
    } catch (e) {}
  }

  SFX.play = function (name) {
    var cfg = BANK[name], slot = slots[name];
    if (!cfg || !ctx || !slot.buffers.length) return;
    // 멈춘 컨텍스트에 예약하면 재개될 때 한꺼번에 터지므로 버린다
    if (ctx.state !== 'running') { if (ctx.resume) ctx.resume(); return; }
    var t = now();
    if (t - slot.last < cfg.gap) return;
    slot.last = t;

    if (slot.voices.length >= cfg.voices) {
      var oldest = slot.voices.shift();
      fadeOut(oldest, 25);
    }

    try {
      var source = ctx.createBufferSource();
      source.buffer = slot.buffers[slot.turn++ % slot.buffers.length];
      if (cfg.pitch) source.playbackRate.value = 1 + (Math.random() * 2 - 1) * cfg.pitch;
      var gain = ctx.createGain();
      gain.gain.value = sfxVol(cfg.gain);
      source.connect(gain);
      gain.connect(output);
      var voice = { source: source, gain: gain };
      slot.voices.push(voice);
      source.onended = function () { release(slot, voice); };
      source.start(0);
    } catch (e) {}
  };

  // 전투가 끝나는 순간처럼 이어지면 안 되는 소리를 짧게 줄여 끊는다
  SFX.stop = function (names, ms) {
    if (!ctx) return;
    names.forEach(function (name) {
      var slot = slots[name];
      if (!slot) return;
      while (slot.voices.length) fadeOut(slot.voices.shift(), ms || 60);
    });
  };

  SFX.stats = function () {
    var voices = 0;
    Object.keys(slots).forEach(function (name) { voices += slots[name].voices.length; });
    return { total: total, loaded: loaded, failed: failed, voices: voices, unlocked: unlocked, state: ctx ? ctx.state : 'none' };
  };

})(window);
