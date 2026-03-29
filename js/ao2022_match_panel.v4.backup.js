// ============================================================
// AO2022 Cinematic Match Panel — MatchPoint Live Demo
// Court Canvas + Line Calling System + Composure Arc
// ============================================================
(function() {

  // ── Narrative Acts ────────────────────────────────────────
  const ACTS = [
    { t:0,   label:'ACT I',    title:'Medvedev Dominates',      color:'#0ea5e9' },
    { t:60,  label:'ACT II',   title:'Crisis — Tiebreak',       color:'#f97316' },
    { t:160, label:'CRISIS',   title:'Coach Intervention',       color:'#ef4444' },
    { t:200, label:'ACT III',  title:'The Comeback Begins',     color:'#22c55e' },
    { t:300, label:'ACT IV',   title:'Champion State',          color:'#eab308' },
    { t:410, label:'🏆',       title:'Nadal — 21st Grand Slam', color:'#FFD700' },
  ];

  const COACH_CUES = [
    { t:0,   cue:"Stay present. This is your moment — trust every shot you've built." },
    { t:25,  cue:"Track the ball early. His flat ball comes fast — move your feet first." },
    { t:50,  cue:"Double break means nothing. Win the next game. One game at a time." },
    { t:80,  cue:"Heavy topspin, stay on the T. Make him move — your forehand is a weapon." },
    { t:110, cue:"Stay in your routine. Big first serve, go for the wide one." },
    { t:145, cue:"Look at me. Deep breath. You've been here before. Own the next point." },
    { t:168, cue:"You have won 20 Slams. You know what to do. Breathe. Trust your hands." },
    { t:200, cue:"That's the one! Keep the pressure — deeper returns, follow the forehand in." },
    { t:240, cue:"Textbook. Big serve, net approach — you're dictating the rallies now." },
    { t:280, cue:"YES. Now we go for two more. Same energy. Stay hungry." },
    { t:330, cue:"You are the greatest. Leave everything on this court — finish it." },
    { t:390, cue:"This is what MatchPoint is built for. Every cue. Every second. Right here." },
    { t:415, cue:"Rafael Nadal. 21. The greatest. MatchPoint was there for every step." },
  ];

  const COMPOSURE_ARC = [
    { t:0,   val:74, tier:'STABLE',   color:'#0ea5e9' },
    { t:40,  val:70, tier:'STABLE',   color:'#0ea5e9' },
    { t:60,  val:62, tier:'ALERT',    color:'#f97316' },
    { t:80,  val:65, tier:'STABLE',   color:'#0ea5e9' },
    { t:110, val:71, tier:'STABLE',   color:'#0ea5e9' },
    { t:145, val:61, tier:'CRITICAL', color:'#ef4444' },
    { t:168, val:58, tier:'CRITICAL', color:'#ef4444' },
    { t:185, val:62, tier:'ALERT',    color:'#f97316' },
    { t:200, val:72, tier:'STRONG',   color:'#22c55e' },
    { t:240, val:78, tier:'STRONG',   color:'#22c55e' },
    { t:280, val:84, tier:'ELITE',    color:'#eab308' },
    { t:330, val:90, tier:'ELITE',    color:'#eab308' },
    { t:390, val:95, tier:'ELITE',    color:'#FFD700' },
    { t:420, val:97, tier:'ELITE',    color:'#FFD700' },
  ];

  // ── State ─────────────────────────────────────────────────
  let animFrame = null;
  let frameIdx = 0;
  let lastFrameTime = null;
  let isRunning = false;
  let shotArcs = [];          // {x1,y1,x2,y2,call,age,id}
  let heatDots = [];          // {x,y,call,age}
  let recentCalls = [];       // {call,player,confidence,t,challenged}
  let lastLoggedCall = null;   // track lastCall changes for call detection
  let lastActIdx = -1;
  let lastCueIdx = -1;
  let challengePending = false;
  let lastBounceFrame = -1;
  // Ball trail: ring buffer of last N positions {cx, cy, z, spd}
  const TRAIL_LEN = 12;
  let ballTrail = [];          // [{cx,cy,z,spd}, ...] newest last
  // Bounce flash: [{cx,cy,call,born}] — brief expanding ring on landing
  let bounceFlashes = [];
  // Last confirmed bounce position for live trajectory line
  let lastBouncePos = null;    // {cx, cy, call}
  // Ball squash state — {born, duration} set on each bounce
  let ballSquash = null;
  // Sub-tick interpolation: smoothly animate ball between data frames
  let tweenFrom  = null;   // {x, y, z, call, spd}
  let tweenTo    = null;   // {x, y, z, call, spd}
  let tweenStart = 0;      // performance.now() when tween began
  // Landing zone: predicted next landing position (from last arc direction)
  let landingZone = null;  // {cx, cy, call, pulse} — pulsing prediction ring
  let skidMarks = [];      // [{cx,cy,angle,call,born}] directional post-bounce streak
  let dustPuffs = [];      // [{cx,cy,call,born,particles}] particle burst on bounce
  let isServeFlight = false;
  let serveLabel = null;   // {text,born,cx,cy} on-canvas serve speed pop
  // Player velocity tracking for lean/trail
  const playerVel = {
    nadal:    { vx: 0, vy: 0, px: 0.5, py: 0.92 },
    medvedev: { vx: 0, vy: 0, px: 0.5, py: 0.08 }
  };
  const MAX_ARCS = 12;
  const MAX_DOTS = 60;
  const FRAME_MS = 700;  // ~1.75s per bounce — natural tennis rally pace
  const MAX_T = 420;

  // ── Match Audio Engine ─────────────────────────────────────
  const AUDIO_BASE = '/assets/audio/match';
  const _audioCache = {};
  let _crowdLoop = null;
  let _rallyLoop = null;
  let _lastShotT = -999;     // prevent shot sound spam
  let _lastActAudio = -1;    // track which act triggered crowd
  let _audioUnlocked = false;

  function _getAudio(name) {
    if (!_audioCache[name]) {
      const a = new Audio(`${AUDIO_BASE}/${name}.mp3`);
      a.preload = 'auto';
      _audioCache[name] = a;
    }
    return _audioCache[name];
  }

  function _unlockAudio() {
    if (_audioUnlocked) return;
    _audioUnlocked = true;
    // Pre-warm all sounds on first user gesture
    ['ball_hit','forehand','backhand','serve_toss','smash','net',
     'crowd_noise','rally_loop','applause','applause_big','applause_outro'].forEach(n => {
      const a = _getAudio(n);
      a.volume = 0;
      a.play().then(() => a.pause()).catch(() => {});
      a.volume = 1;
    });
  }

  function _playOnce(name, vol) {
    try {
      const a = _getAudio(name);
      a.currentTime = 0;
      a.volume = vol !== undefined ? vol : 0.55;
      a.play().catch(() => {});
    } catch(e) {}
  }

  function _startLoop(name, vol) {
    try {
      const a = _getAudio(name);
      a.loop = true;
      a.volume = vol !== undefined ? vol : 0.18;
      if (a.paused) a.play().catch(() => {});
      return a;
    } catch(e) { return null; }
  }

  function _stopLoop(audioEl) {
    if (!audioEl) return;
    try {
      audioEl.pause();
      audioEl.currentTime = 0;
    } catch(e) {}
  }

  function _fadeTo(audioEl, targetVol, ms) {
    if (!audioEl) return;
    const steps = 20;
    const interval = ms / steps;
    const startVol = audioEl.volume;
    const delta = (targetVol - startVol) / steps;
    let step = 0;
    const t = setInterval(() => {
      step++;
      audioEl.volume = Math.max(0, Math.min(1, startVol + delta * step));
      if (step >= steps) {
        clearInterval(t);
        if (targetVol === 0) { audioEl.pause(); audioEl.currentTime = 0; }
      }
    }, interval);
  }

  // Called each frame to decide what audio to play
  function _updateMatchAudio(frame, isBounce, prevFrame) {
    const t = frame.t;
    const spd = frame.spd || 120;
    const rpm = frame.rpm || 2500;

    // ── Crowd ambient loop: starts on first frame, fades with act ──
    if (!_crowdLoop) {
      _crowdLoop = _startLoop('crowd_noise', 0.12);
    }

    // ── Act-based crowd swell ──
    const actIdx = ACTS.reduce((best, a, i) => t >= a.t ? i : best, 0);
    if (actIdx !== _lastActAudio) {
      _lastActAudio = actIdx;
      if (actIdx === 2) { // CRISIS
        _fadeTo(_crowdLoop, 0.22, 1200);
      } else if (actIdx === 5) { // FINALE 🏆
        _stopLoop(_rallyLoop); _rallyLoop = null;
        _fadeTo(_crowdLoop, 0.0, 800);
        setTimeout(() => _playOnce('applause_big', 0.65), 400);
        setTimeout(() => _playOnce('applause_outro', 0.55), 4000);
      } else if (actIdx === 3) { // Comeback
        _fadeTo(_crowdLoop, 0.15, 1000);
        setTimeout(() => _playOnce('applause', 0.45), 600);
      } else if (actIdx === 4) { // Champion State
        _fadeTo(_crowdLoop, 0.18, 800);
        setTimeout(() => _playOnce('applause', 0.5), 200);
      }
    }

    // ── Rally loop: play during active rallies, stop between points ──
    if (frame.rc && frame.rc > 4) {
      if (!_rallyLoop) {
        _rallyLoop = _startLoop('rally_loop', 0.10);
      }
    } else {
      if (_rallyLoop && !_rallyLoop.paused) {
        _fadeTo(_rallyLoop, 0, 600);
        _rallyLoop = null;
      }
    }

    // ── Shot sounds on bounce (throttle: min 2.5s between shots) ──
    if (isBounce && (t - _lastShotT) > 2.5) {
      _lastShotT = t;
      // Pick shot type by speed + spin profile
      if (spd > 140) {
        _playOnce('smash', 0.6);              // high-speed smash
      } else if (rpm > 3000) {
        _playOnce('forehand', 0.5);           // high-spin = heavy forehand topspin
      } else if (rpm < 2400) {
        _playOnce('backhand', 0.45);          // low spin = slice backhand
      } else if (frame.call === 'OUT') {
        _playOnce('net', 0.5);               // net/out call
      } else {
        _playOnce('ball_hit', 0.45);          // generic clean hit
      }
    }

    // ── Serve toss: play near start and at key serve points (momentum low) ──
    if ((t < 2 && t > 0.1) || (frame.mom < 15 && t > 10 && (t - _lastShotT) > 8)) {
      if (t < 1.5 || (frame.mom < 15 && (t - _lastShotT) > 8)) {
        // Only fire once per serve window
        if (!_audioCache['_serveFired_' + Math.floor(t)]) {
          _audioCache['_serveFired_' + Math.floor(t)] = true;
          _playOnce('serve_toss', 0.4);
        }
      }
    }
  }

  function _stopAllMatchAudio() {
    _stopLoop(_crowdLoop); _crowdLoop = null;
    _stopLoop(_rallyLoop); _rallyLoop = null;
    _lastShotT = -999;
    _lastActAudio = -1;
    // Clear serve fire cache
    Object.keys(_audioCache).filter(k => k.startsWith('_serveFired_'))
      .forEach(k => delete _audioCache[k]);
  }

  // ── EMA smoothing state for metrics (prevents squirrelly jumps) ──
  // α = smoothing factor: lower = smoother, higher = more responsive
  const EMA_SPD  = 0.12;  // speed — smoother at slower frame rate
  const EMA_RPM  = 0.09;  // spin — gentle drift
  const EMA_CONF = 0.06;  // confidence — very stable
  const EMA_COV  = 0.05;  // court coverage — slow drift metric
  const EMA_LAT  = 0.03;  // latency — near-static
  const EMA_ACC  = 0.04;  // accuracy — near-static
  let ema = { spd: 120, rpm: 2600, conf: 97, cov: 42, lat: 2.8, acc: 3.7 };
  let lastConfOnBounce = 97; // confidence only meaningfully updates on bounce events

  // ── Game Metrics session trackers ──
  const gs = {
    maxServeMph:   132,   // max serve speed seen this session
    longestRally:  0,     // longest rally in shots
    rallySum:      0,     // sum of all rally lengths (for avg)
    rallyCount:    0,     // number of rallies counted
    prevRc:        0,     // previous frame rc (rally counter)
    totalDistKm:   0,     // accumulated court distance
    prevCovPct:    42,    // previous coverage % (for distance delta)
    bestReaction:  0.20,  // best reaction time seen
    last10:        [],    // last 10 shot confidence values (for hit/miss)
    shotCount:     0,     // total shots for react time oscillation
    prevMom:       50,    // previous frame momentum (for Momentum Δ)
    momDelta:      0,     // smoothed momentum delta (EMA)
    depthSum:      0,     // sum of recent shot depth values
    depthCount:    0,     // count of recent shot depth values
  };

  // ── Court geometry helpers ────────────────────────────────
  // Canvas is 310 wide x 465 tall (portrait, like real court view)
  const CW = 310, CH = 465;
  const COURT = {
    mx: 40, my: 30,
    get w() { return CW - this.mx*2; },
    get h() { return CH - this.my*2; },
    get netY() { return this.my + this.h/2; }
  };

  function dataToCanvas(x, y) {
    // x: 0-1 (left-right), y: 0.706-0.980 (remapped to full court)
    const yn = (y - 0.706) / (0.980 - 0.706);
    return {
      cx: COURT.mx + x * COURT.w,
      cy: COURT.my + yn * COURT.h
    };
  }

  // ── Build Panel HTML ──────────────────────────────────────
  function buildPanel() {
    const container = document.getElementById('ao2022-match-panel');
    if (!container) return;

    container.innerHTML = `
    <style>
      /* ═══════════════════════════════════════════════
         AEGIS ELEVATION SYSTEM  (4 depth levels)
         L0 = deep base  L1 = panel  L2 = card  L3 = active
      ═══════════════════════════════════════════════ */
      #ao2022-match-panel {
        --mp-l0:  #060a16;      /* base background          */
        --mp-l1:  #0c1424;      /* panel surfaces           */
        --mp-l2:  #12203a;      /* cards / rows             */
        --mp-l3:  #192e52;      /* active / focused         */
        --mp-l4:  #1f3a66;      /* hover highlight          */
        /* Accent roles: teal = live data/calls | sky = system status */
        --mp-teal: #00f5d4;     /* live calls, live values  */
        --mp-sky:  #0ea5e9;     /* system status, latency   */
        --mp-dim:  rgba(255,255,255,0.45); /* labels tier-2   */
        --mp-faint:rgba(255,255,255,0.28); /* timestamps/units */
        /* Radius tokens */
        --mp-r-sm: 4px;  /* chips, badges */
        --mp-r-md: 8px;  /* cards, rows   */
        --mp-r-lg: 12px; /* major panels  */
        background: linear-gradient(135deg, rgba(6,10,22,0.98) 0%, rgba(10,16,30,0.98) 50%, rgba(6,12,26,0.98) 100%);
        border: 1px solid rgba(0,245,212,0.25);
        border-radius: 16px;
        overflow: hidden;
        font-family: 'Inter', 'DM Sans', system-ui, sans-serif;
        user-select: none;
        box-shadow: 0 0 0 1px rgba(0,245,212,0.06), 0 8px 40px rgba(0,0,0,0.7), 0 0 60px rgba(0,245,212,0.06), inset 0 1px 0 rgba(255,255,255,0.04);
        position: relative;
      }
      #ao2022-match-panel::before {
        content:'';
        position:absolute;top:0;left:0;right:0;height:1px;
        background: linear-gradient(90deg, transparent 0%, rgba(0,245,212,0.5) 30%, rgba(14,165,233,0.6) 60%, transparent 100%);
        pointer-events:none;z-index:1;
      }
      .mp-header {
        display:flex; align-items:center; justify-content:space-between;
        padding:0.6rem 1.1rem;
        background: linear-gradient(90deg, rgba(2,6,18,0.99) 0%, rgba(4,10,26,0.98) 50%, rgba(2,6,18,0.99) 100%);
        border-bottom:1px solid rgba(0,245,212,0.12);
        position:relative;z-index:2;
        backdrop-filter:blur(12px);
      }
      .mp-header::after {
        content:'';
        position:absolute;bottom:0;left:5%;right:5%;height:1px;
        background:linear-gradient(90deg,transparent,rgba(0,245,212,0.3),transparent);
        pointer-events:none;
      }
      .mp-live-dot {
        width:7px;height:7px;border-radius:50%;background:#ef4444;
        box-shadow:0 0 10px rgba(239,68,68,0.9), 0 0 20px rgba(239,68,68,0.4);
        animation:mp-pulse 1.2s infinite;
      }
      @keyframes mp-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }
      @keyframes mp-flash { 0%{background:rgba(0,245,212,0.3)} 100%{background:transparent} }
      .mp-main-grid {
        display:grid;
        grid-template-columns:310px 1fr 214px;
        min-height:0;
      }
      /* ── AEGIS responsive ── */
      @media (max-width: 900px) {
        /* Tablet: hide right composure column, centre fills remaining space */
        .mp-main-grid { grid-template-columns: 280px 1fr 0px; } /* right col hidden on tablet */
        .mp-main-grid > div:last-child { display:none; }
      }
      @media (max-width: 600px) {
        /* Phone: stack court above centre content, hide right panel */
        .mp-main-grid {
          grid-template-columns: 1fr !important;
          grid-template-rows: auto auto;
        }
        .mp-main-grid > div:last-child { display:none; }
        #ao22-court-canvas { width:100% !important; height:auto !important; max-height:260px; }
        .mp-court-panel { min-height:0; }
      }
      /* ── Call Indicator Bar ── */
      #ao22-call-indicator-bar {
        display:flex; align-items:center; justify-content:center;
        gap:1.8rem;
        padding:0.45rem 0;
        background:rgba(4,10,20,0.92);
        border-top:1px solid rgba(0,245,212,0.1);
      }
      .ao22-indicator {
        display:flex; align-items:center; gap:0.5rem;
      }
      .ao22-ind-light {
        width:18px; height:18px; border-radius:50%;
        background:#0e1a12;
        border:1.5px solid rgba(255,255,255,0.1);
        box-shadow:none;
        transition: background 0.08s ease, box-shadow 0.08s ease, border-color 0.08s ease;
      }
      .ao22-ind-label {
        font-size:0.65rem; font-weight:800; letter-spacing:0.14em;
        color:#334155; text-transform:uppercase;
        transition: color 0.08s ease;
      }
      /* Lit states */
      #ao22-light-in.lit {
        background:#22c55e;
        border-color:#22c55e;
        box-shadow: 0 0 10px 3px rgba(34,197,94,0.75), 0 0 22px 6px rgba(34,197,94,0.35);
      }
      #ao22-ind-in.lit .ao22-ind-label  { color:#22c55e; }
      #ao22-light-out.lit {
        background:#ef4444;
        border-color:#ef4444;
        box-shadow: 0 0 12px 4px rgba(239,68,68,0.85), 0 0 28px 8px rgba(239,68,68,0.45);
      }
      #ao22-ind-out.lit .ao22-ind-label { color:#ef4444; }
      #ao22-light-let.lit {
        background:#eab308;
        border-color:#eab308;
        box-shadow: 0 0 10px 3px rgba(234,179,8,0.75), 0 0 22px 6px rgba(234,179,8,0.35);
      }
      #ao22-ind-let.lit .ao22-ind-label { color:#eab308; }
      /* Court panel */
      .mp-court-panel {
        position:relative;
        background: radial-gradient(ellipse at 50% 50%, #0e2414 0%, #081509 60%, #050d06 100%);
        border-right:1px solid rgba(0,245,212,0.12);
        box-shadow: inset -8px 0 24px rgba(0,0,0,0.5);
      }
      #ao22-court-canvas { display:block; }
      .mp-call-flash {
        position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
        font-size:2.5rem;font-weight:900;letter-spacing:0.1em;
        pointer-events:none;opacity:0;transition:opacity 0.3s;
        text-shadow:0 0 20px currentColor;
      }
      /* Centre: LCS + scoreboard */
      .mp-centre {
        display:flex;flex-direction:column;
        background: linear-gradient(180deg, rgba(4,10,24,0.99) 0%, rgba(6,14,30,0.99) 100%);
        padding:0.45rem 0.6rem;
        gap:0.3rem;
        overflow:hidden;
      }
      .mp-lcs-title {
        font-size:0.55rem;font-weight:800;letter-spacing:0.12em;
        color:#00f5d4;text-transform:uppercase;margin-bottom:0.2rem;
        text-shadow:0 0 10px rgba(0,245,212,0.5);
      }
      .mp-metrics-row {
        display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.18rem;
        margin-bottom:0.22rem;
      }
      .mp-metric {
        background: linear-gradient(135deg, rgba(0,245,212,0.06) 0%, rgba(14,165,233,0.03) 100%);
        border:1px solid rgba(0,245,212,0.14);
        border-radius:5px;padding:0.15rem 0.2rem;text-align:center;
        box-shadow:0 1px 4px rgba(0,0,0,0.3);
        transition:border-color 0.2s;
      }
      .mp-metric:hover { border-color:rgba(0,245,212,0.3); }
      .mp-metric-val { font-size:0.72rem;font-weight:800;color:#00f5d4;line-height:1;text-shadow:0 0 6px rgba(0,245,212,0.4); }
      .mp-metric-label { font-size:0.58rem;text-transform:uppercase;letter-spacing:0.05em;color:#64748b;margin-top:1px; }
      /* Call buttons */
      .mp-call-buttons {
        display:grid;grid-template-columns:1fr 1fr;gap:0.3rem;margin-bottom:0.35rem;
      }
      /* Big IN/OUT focal lights */
      .mp-call-btn.in, .mp-call-btn.out {
        padding:0.5rem 0.2rem;
        font-size:0.9rem;
        letter-spacing:0.15em;
      }
      .mp-call-btn.in.active { box-shadow:0 0 28px rgba(34,197,94,0.7),0 0 10px rgba(34,197,94,0.4); }
      .mp-call-btn.out.active { box-shadow:0 0 28px rgba(239,68,68,0.7),0 0 10px rgba(239,68,68,0.4); }
      @keyframes mp-call-fire {
        0%   { transform:scale(1); }
        20%  { transform:scale(0.93); }
        45%  { transform:scale(1.06); box-shadow:0 0 22px var(--call-glow-color,rgba(255,255,255,0.5)); }
        100% { transform:scale(1); }
      }
      .mp-call-btn {
        padding:0.32rem 0.2rem;border-radius:8px;border:1.5px solid;
        font-size:0.65rem;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;
        cursor:pointer;transition:all 0.18s cubic-bezier(0.4,0,0.2,1);text-align:center;
        background: linear-gradient(135deg, rgba(0,0,0,0.55) 0%, rgba(10,16,32,0.5) 100%);
        position:relative;overflow:hidden;
        box-shadow:0 2px 6px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05);
      }
      .mp-call-btn::before {
        content:'';position:absolute;inset:0;
        background:linear-gradient(135deg,rgba(255,255,255,0.06) 0%,transparent 60%);
        border-radius:inherit;pointer-events:none;
      }
      .mp-call-btn:active { transform:scale(0.93); }
      .mp-call-btn.firing { animation:mp-call-fire 0.35s ease-out forwards; }
      .mp-call-btn.in  { border-color:rgba(34,197,94,0.7);color:#22c55e;--call-glow-color:rgba(34,197,94,0.6); }
      .mp-call-btn.in:hover  { background:linear-gradient(135deg,rgba(34,197,94,0.22) 0%,rgba(34,197,94,0.08) 100%);box-shadow:0 0 16px rgba(34,197,94,0.35),0 2px 6px rgba(0,0,0,0.4);border-color:#22c55e; }
      .mp-call-btn.in.active  { background:linear-gradient(135deg,rgba(34,197,94,0.3) 0%,rgba(34,197,94,0.12) 100%);box-shadow:0 0 24px rgba(34,197,94,0.5); }
      .mp-call-btn.out { border-color:rgba(239,68,68,0.7);color:#ef4444;--call-glow-color:rgba(239,68,68,0.6); }
      .mp-call-btn.out:hover { background:linear-gradient(135deg,rgba(239,68,68,0.22) 0%,rgba(239,68,68,0.08) 100%);box-shadow:0 0 16px rgba(239,68,68,0.35),0 2px 6px rgba(0,0,0,0.4);border-color:#ef4444; }
      .mp-call-btn.out.active { background:linear-gradient(135deg,rgba(239,68,68,0.3) 0%,rgba(239,68,68,0.12) 100%);box-shadow:0 0 24px rgba(239,68,68,0.5); }
      .mp-call-btn.let { border-color:rgba(234,179,8,0.7);color:#eab308;--call-glow-color:rgba(234,179,8,0.6); }
      .mp-call-btn.let:hover { background:linear-gradient(135deg,rgba(234,179,8,0.22) 0%,rgba(234,179,8,0.08) 100%);box-shadow:0 0 16px rgba(234,179,8,0.35),0 2px 6px rgba(0,0,0,0.4);border-color:#eab308; }
      .mp-call-btn.let.active { background:linear-gradient(135deg,rgba(234,179,8,0.3) 0%,rgba(234,179,8,0.12) 100%);box-shadow:0 0 24px rgba(234,179,8,0.5); }
      .mp-call-btn.fault { border-color:rgba(249,115,22,0.7);color:#f97316;--call-glow-color:rgba(249,115,22,0.5); }
      .mp-call-btn.fault:hover { background:linear-gradient(135deg,rgba(249,115,22,0.2) 0%,rgba(249,115,22,0.07) 100%);box-shadow:0 0 14px rgba(249,115,22,0.35);border-color:#f97316; }
      .mp-call-btn.fault.active { background:linear-gradient(135deg,rgba(249,115,22,0.28) 0%,rgba(249,115,22,0.1) 100%);box-shadow:0 0 20px rgba(249,115,22,0.45); }
      .mp-call-btn.challenge { border-color:rgba(167,139,250,0.65);color:#a78bfa;grid-column:1/-1;--call-glow-color:rgba(167,139,250,0.6); }
      .mp-call-btn.challenge:hover { background:linear-gradient(135deg,rgba(167,139,250,0.2) 0%,rgba(167,139,250,0.07) 100%);box-shadow:0 0 18px rgba(167,139,250,0.4);border-color:#a78bfa; }
      .mp-call-btn.challenge.active { background:linear-gradient(135deg,rgba(167,139,250,0.28) 0%,rgba(167,139,250,0.1) 100%);box-shadow:0 0 26px rgba(167,139,250,0.5); }
      /* Recent calls */
      .mp-recent-title {
        font-size:0.65rem;font-weight:700;letter-spacing:0.08em;
        color:#64748b;text-transform:uppercase;margin-bottom:0.35rem;
      }
      .mp-recent-list { display:flex;flex-direction:column;gap:0.18rem; }
      .mp-recent-item {
        display:flex;align-items:center;justify-content:space-between;
        padding:0.22rem 0.45rem;border-radius:6px;
        background:linear-gradient(135deg,rgba(255,255,255,0.04) 0%,rgba(255,255,255,0.01) 100%);
        border:1px solid rgba(255,255,255,0.06);
        font-size:0.7rem;
        animation:mp-flash 0.4s ease-out;
        box-shadow:inset 0 1px 0 rgba(255,255,255,0.04);
      }
      .mp-recent-call { font-weight:800;letter-spacing:0.06em; }
      .mp-recent-call.IN { color:#22c55e; }
      .mp-recent-call.OUT { color:#ef4444; }
      .mp-recent-call.LET { color:#eab308; }
      .mp-recent-call.FAULT { color:#f97316; }
      /* ══ Microinteraction: value pulse on live data update ══ */
      @keyframes mp-val-pulse {
        0%   { color: var(--mp-teal); opacity:1; }
        40%  { color: #ffffff;       opacity:0.95; }
        100% { color: var(--mp-teal); opacity:1; }
      }
      @keyframes mp-sys-pulse {
        0%   { color: var(--mp-sky); opacity:1; }
        40%  { color: #ffffff;      opacity:0.95; }
        100% { color: var(--mp-sky); opacity:1; }
      }
      .mp-val-flash     { animation: mp-val-pulse 320ms ease-out; }
      .mp-sys-flash     { animation: mp-sys-pulse 320ms ease-out; }

      /* ══ Typography hierarchy ══ */
      /* Tier-1: hero live numbers  → teal, 28-32px 700 (applied per element) */
      /* Tier-2: metric labels      → --mp-dim, 11px 400 UPPERCASE            */
      /* Tier-3: secondary / units  → --mp-faint, 10px 400                   */
      .mp-label {
        font-size: 0.67rem; font-weight: 400; letter-spacing: 0.08em;
        text-transform: uppercase; color: var(--mp-dim);
      }
      .mp-unit {
        font-size: 0.62rem; color: var(--mp-faint); letter-spacing: 0;
      }

      /* ══ Scoreboard ══ */
      .mp-scoreboard {
        background: linear-gradient(135deg, var(--mp-l1, #0c1424) 0%, var(--mp-l2, #12203a) 100%);
        border: 1px solid transparent;
        background-clip: padding-box;
        /* Reflecting border: top highlight = premium glass effect */
        box-shadow: inset 0 1px 0 rgba(0,245,212,0.18), inset -1px 0 0 rgba(0,245,212,0.05),
                    0 4px 16px rgba(0,0,0,0.5), 0 0 20px rgba(0,245,212,0.06);
        border-radius: var(--mp-r-lg, 12px); padding:0.35rem 0.45rem;
        position:relative;overflow:hidden;
      }
      .mp-scoreboard::before {
        content:'';position:absolute;top:0;left:0;right:0;height:1px;
        background:linear-gradient(90deg,transparent,rgba(0,245,212,0.4),transparent);
        pointer-events:none;
      }
      .mp-sb-row {
        display:grid;grid-template-columns:1fr repeat(5,22px) 30px;
        gap:3px;align-items:center;padding:0.25rem 0;
      }
      .mp-sb-row + .mp-sb-row { border-top:1px solid rgba(255,255,255,0.05); }
      .mp-sb-player { font-size:0.78rem;font-weight:700;color:#e2e8f0;letter-spacing:0.01em; }
      .mp-sb-set {
        font-size:0.72rem;font-weight:700;text-align:center;
        padding:1px 3px;border-radius:var(--mp-r-sm,4px);color:var(--mp-dim);
        min-width:20px;transition:all 0.3s;
      }
      .mp-sb-set.won  { color:var(--mp-teal);background:rgba(0,245,212,0.13);box-shadow:0 0 6px rgba(0,245,212,0.22); }
      .mp-sb-set.losing { color:#ef4444; }
      /* Tier-1 hero: current game point score */
      .mp-sb-pts { font-size:1.15rem;font-weight:800;color:var(--mp-teal);text-align:center;text-shadow:0 0 10px rgba(0,245,212,0.4); }
      /* Momentum */
      .mp-mom-bar-track {
        height:4px;background:rgba(255,255,255,0.07);border-radius:2px;overflow:hidden;margin-top:3px;
      }
      .mp-mom-bar-fill {
        height:100%;border-radius:2px;
        background:linear-gradient(90deg,#0ea5e9,#00f5d4,#a78bfa);
        transition:width 0.5s,background 0.5s;
        box-shadow:0 0 4px rgba(0,245,212,0.4);
      }
      /* Challenge overlay */
      #ao22-challenge-overlay {
        display:none;position:absolute;inset:0;
        background:rgba(2,6,18,0.92);z-index:10;
        align-items:center;justify-content:center;flex-direction:column;gap:0.5rem;
        border-radius:14px 0 0 14px;
      }
      #ao22-challenge-overlay.active { display:flex; }
      .mp-review-ring {
        width:80px;height:80px;border-radius:50%;
        border:3px solid rgba(167,139,250,0.3);
        border-top-color:#a78bfa;
        animation:mp-spin 0.8s linear infinite;
      }
      @keyframes mp-spin { to{transform:rotate(360deg)} }
      /* Right: Composure */
      .mp-composure-panel {
        background: linear-gradient(180deg, rgba(4,10,26,0.99) 0%, rgba(6,14,32,0.98) 100%);
        border-left:1px solid rgba(0,245,212,0.12);
        padding:0.45rem 0.55rem;
        display:flex;flex-direction:column;gap:0.25rem;
        overflow:hidden;
        box-shadow:inset 8px 0 24px rgba(0,0,0,0.4);
      }
      .mp-composure-title {
        font-size:0.65rem;font-weight:800;letter-spacing:0.1em;color:#64748b;text-transform:uppercase;
        display:flex;align-items:center;gap:0.3rem;
      }
      .mp-composure-title::before {
        content:'';
        display:inline-block;width:12px;height:1px;
        background:linear-gradient(90deg,rgba(0,245,212,0.6),transparent);
      }
      #ao22-composure-canvas { width:100%;min-height:0;height:90px; }
      .mp-tier-badge {
        font-size:0.58rem;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;
        padding:3px 10px;border-radius:20px;display:inline-block;text-align:center;
        transition:all 0.5s;
        box-shadow:0 2px 8px rgba(0,0,0,0.3);
      }
      /* ── Game Metrics grid ── */
      .mp-stats-grid {
        display:grid;grid-template-columns:1fr 1fr;gap:0.22rem;
        margin:0.35rem 0;
      }
      .mp-stat-card {
        background: linear-gradient(135deg, var(--mp-l2,#12203a) 0%, var(--mp-l1,#0c1424) 100%);
        border: 1px solid transparent;
        background-clip: padding-box;
        /* Reflecting border: brighter top-left, dimmer bottom-right */
        box-shadow: inset 0 1px 0 rgba(0,245,212,0.15), inset -1px 0 0 rgba(0,245,212,0.05),
                    0 2px 8px rgba(0,0,0,0.4);
        border-radius: var(--mp-r-md,8px); padding:0.28rem 0.32rem;
        position:relative;overflow:hidden;
        transition: box-shadow 0.2s, transform 0.15s;
      }
      .mp-stat-card::before {
        content:'';position:absolute;top:0;left:0;right:0;height:1px;
        background:var(--sc,rgba(0,245,212,0.25));pointer-events:none;
      }
      .mp-stat-card:hover {
        box-shadow: inset 0 1px 0 rgba(0,245,212,0.28), inset -1px 0 0 rgba(0,245,212,0.1),
                    0 4px 14px rgba(0,245,212,0.1);
        transform: translateY(-1px);
      }
      /* Tier-2: metric label */
      .mp-stat-label {
        font-size:0.67rem;font-weight:400;letter-spacing:0.08em;
        text-transform:uppercase;color:var(--mp-dim,rgba(255,255,255,0.45));margin-bottom:0.14rem;
        display:flex;align-items:center;gap:0.2rem;
        white-space:nowrap;
      }
      /* Tier-1: hero value — uses per-card --sc-text (teal for match data, sky for system) */
      .mp-stat-val {
        font-size:1.1rem;font-weight:800;line-height:1;
        color:var(--sc-text,var(--mp-teal));
        text-shadow:0 0 10px var(--sc-glow,rgba(0,245,212,0.35));
      }
      /* Tier-3: unit */
      .mp-stat-unit {
        font-size:0.64rem;font-weight:400;color:var(--mp-faint,rgba(255,255,255,0.28));margin-left:2px;
      }
      .mp-stat-sub {
        font-size:0.64rem;color:var(--mp-faint,rgba(255,255,255,0.28));margin-top:0.12rem;
        white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
      }
      .mp-intervene-flag {
        font-size:0.52rem;font-weight:700;color:#ef4444;
        padding:0.25rem 0.4rem;border-radius:5px;
        background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);
        text-align:center;opacity:0;transition:opacity 0.5s;
      }
      /* Coach cue */
      .mp-coach-box {
        background:linear-gradient(135deg,rgba(0,245,212,0.06) 0%,rgba(14,165,233,0.03) 100%);
        border:1px solid rgba(0,245,212,0.2);
        border-radius:8px;padding:0.35rem 0.45rem;
        box-shadow:0 0 12px rgba(0,245,212,0.08),inset 0 1px 0 rgba(255,255,255,0.04);
      }
      .mp-coach-label {
        font-size:0.65rem;font-weight:800;letter-spacing:0.1em;color:#00f5d4;
        text-transform:uppercase;margin-bottom:0.3rem;
        text-shadow:0 0 8px rgba(0,245,212,0.5);
      }
      #ao22-coach-cue-list {
        display:flex;flex-direction:column;gap:0.3rem;
      }
      .mp-cue-item {
        font-size:0.72rem;color:#e2e8f0;line-height:1.45;font-style:italic;
        padding:0.28rem 0.4rem;
        border-radius:5px;
        background:rgba(255,255,255,0.03);
        border-left:2px solid rgba(0,245,212,0.3);
        transition:opacity 0.4s;
      }
      .mp-cue-item.mp-cue-stale {
        color:#475569;
        border-left-color:rgba(255,255,255,0.07);
        font-size:0.66rem;
      }
      /* Act banner */
      .mp-act-banner {
        display:flex;align-items:center;gap:0.4rem;
        padding:0.22rem 0.45rem;border-radius:7px;
        background:linear-gradient(135deg,rgba(14,165,233,0.12) 0%,rgba(14,165,233,0.05) 100%);
        border:1px solid rgba(14,165,233,0.3);
        transition:all 0.4s;
        box-shadow:0 0 10px rgba(14,165,233,0.1),inset 0 1px 0 rgba(255,255,255,0.03);
      }
      #ao22-act-label { font-size:0.65rem;font-weight:800;letter-spacing:0.12em;text-transform:uppercase; }
      #ao22-act-title { font-size:0.78rem;font-weight:600;color:#e2e8f0; }
      /* Progress */
      .mp-progress-strip {
        padding:0.45rem 0.85rem 0.55rem;
        background: linear-gradient(90deg, rgba(2,6,18,0.99) 0%, rgba(4,10,24,0.98) 50%, rgba(2,6,18,0.99) 100%);
        border-top:1px solid rgba(0,245,212,0.08);
      }
      .mp-progress-track {
        height:3px;background:rgba(255,255,255,0.07);border-radius:2px;overflow:hidden;margin-bottom:4px;
      }
      #ao22-progress-fill {
        height:100%;width:0%;border-radius:2px;
        background:linear-gradient(90deg,#0ea5e9 0%,#00f5d4 40%,#eab308 80%,#FFD700 100%);
        transition:width 0.2s;
      }
      .mp-act-markers {
        display:flex;justify-content:space-between;
        font-size:0.62rem;color:#64748b;letter-spacing:0.04em;font-weight:600;
      }
    </style>

    <!-- HEADER -->
    <div class="mp-header">
      <div style="display:flex;align-items:center;gap:0.5rem;">
        <div class="mp-live-dot"></div>
        <span style="font-size:0.68rem;font-weight:700;letter-spacing:0.08em;color:#ef4444;text-transform:uppercase;">Live Tracking</span>
      </div>
      <div style="text-align:center;">
        <div style="font-size:0.72rem;font-weight:700;letter-spacing:0.1em;color:#e2e8f0;">2022 Australian Open Final</div>
        <div style="font-size:0.62rem;color:#64748b;letter-spacing:0.05em;">Nadal vs Medvedev · Rod Laver Arena</div>
      </div>
      <div style="display:flex;align-items:center;gap:0.35rem;">
        <div style="width:5px;height:5px;border-radius:50%;background:#00f5d4;"></div>
        <span style="font-size:0.65rem;color:#00f5d4;letter-spacing:0.05em;">MatchPoint ELC v1</span>
      </div>
    </div>

    <!-- MAIN GRID -->
    <div class="mp-main-grid">

      <!-- LEFT: Court Canvas -->
      <div class="mp-court-panel">
        <canvas id="ao22-court-canvas" width="${CW}" height="${CH}" style="display:block;width:${CW}px;height:${CH}px;"></canvas>
        <div id="ao22-call-flash" class="mp-call-flash"></div>
        <!-- Call Indicator Bar -->
        <div id="ao22-call-indicator-bar">
          <div class="ao22-indicator" id="ao22-ind-in">
            <div class="ao22-ind-light" id="ao22-light-in"></div>
            <span class="ao22-ind-label">IN</span>
          </div>
          <div class="ao22-indicator" id="ao22-ind-out">
            <div class="ao22-ind-light" id="ao22-light-out"></div>
            <span class="ao22-ind-label">OUT</span>
          </div>
          <div class="ao22-indicator" id="ao22-ind-let">
            <div class="ao22-ind-light" id="ao22-light-let"></div>
            <span class="ao22-ind-label">LET</span>
          </div>
        </div>
        <!-- Challenge overlay -->
        <div id="ao22-challenge-overlay">
          <div style="font-size:0.6rem;font-weight:700;letter-spacing:0.15em;color:#a78bfa;text-transform:uppercase;margin-bottom:0.5rem;">Reviewing Call...</div>
          <div class="mp-review-ring"></div>
          <div id="ao22-review-result" style="font-size:1.4rem;font-weight:900;letter-spacing:0.12em;margin-top:0.75rem;display:none;"></div>
        </div>
      </div>

      <!-- CENTRE: Line Calling System + Scoreboard -->
      <div class="mp-centre">

        <!-- LCS header & metrics -->
        <div>
          <div class="mp-lcs-title">⚡ Line Calling System</div>
          <div class="mp-metrics-row">
            <div class="mp-metric">
              <div class="mp-metric-val" id="lcs-accuracy">4.8mm</div>
              <div class="mp-metric-label">Accuracy</div>
            </div>
            <div class="mp-metric">
              <div class="mp-metric-val" id="lcs-latency">3ms</div>
              <div class="mp-metric-label">Latency</div>
            </div>
            <div class="mp-metric">
              <div class="mp-metric-val" id="lcs-confidence">97.8%</div>
              <div class="mp-metric-label">AI Confidence</div>
            </div>
          </div>
        </div>

        <!-- Primary call buttons: IN / OUT focal, then secondary row -->
        <div class="mp-call-buttons">
          <button class="mp-call-btn in"    onclick="window.AO2022MatchPanel.manualCall('IN')">IN</button>
          <button class="mp-call-btn out"   onclick="window.AO2022MatchPanel.manualCall('OUT')">OUT</button>
          <button class="mp-call-btn let"   onclick="window.AO2022MatchPanel.manualCall('LET')">LET</button>
          <button class="mp-call-btn fault" onclick="window.AO2022MatchPanel.manualCall('FAULT')">FAULT</button>
          <button class="mp-call-btn challenge" style="grid-column:1/-1;font-size:0.6rem;padding:0.28rem;" onclick="window.AO2022MatchPanel.triggerChallenge()">⚖ CHALLENGE REVIEW</button>
        </div>

        <!-- Recent Calls -->
        <div>
          <div class="mp-recent-title">Recent Calls</div>
          <div class="mp-recent-list" id="ao22-recent-calls">
            <div class="mp-recent-item">
              <span class="mp-recent-call IN">IN</span>
              <span style="color:#64748b;font-size:0.68rem;">Nadal serve</span>
              <span style="color:#475569;font-size:0.65rem;">99.1%</span>
            </div>
            <div class="mp-recent-item">
              <span class="mp-recent-call OUT">OUT</span>
              <span style="color:#64748b;font-size:0.68rem;">Medvedev BH</span>
              <span style="color:#475569;font-size:0.65rem;">97.4%</span>
            </div>
            <div class="mp-recent-item">
              <span class="mp-recent-call IN">IN</span>
              <span style="color:#64748b;font-size:0.68rem;">Nadal FH CC</span>
              <span style="color:#475569;font-size:0.65rem;">98.6%</span>
            </div>
          </div>
        </div>

        <!-- Scoreboard -->
        <div class="mp-scoreboard">
          <div style="font-size:0.65rem;font-weight:700;letter-spacing:0.08em;color:#64748b;text-transform:uppercase;margin-bottom:0.35rem;">Match Score</div>
          <!-- Header row -->
          <div style="display:grid;grid-template-columns:1fr repeat(5,22px) 30px;gap:3px;margin-bottom:2px;">
            <div style="font-size:0.6rem;color:#64748b;"></div>
            <div style="font-size:0.65rem;color:#64748b;text-align:center;font-weight:700;">S1</div>
            <div style="font-size:0.65rem;color:#64748b;text-align:center;font-weight:700;">S2</div>
            <div style="font-size:0.65rem;color:#64748b;text-align:center;font-weight:700;">S3</div>
            <div style="font-size:0.65rem;color:#64748b;text-align:center;font-weight:700;">S4</div>
            <div style="font-size:0.65rem;color:#64748b;text-align:center;font-weight:700;">S5</div>
            <div style="font-size:0.65rem;color:#64748b;text-align:center;font-weight:700;">Gm</div>
          </div>
          <div class="mp-sb-row">
            <div class="mp-sb-player">🇪🇸 Nadal</div>
            <div class="mp-sb-set" id="sb-n-s1">0</div>
            <div class="mp-sb-set" id="sb-n-s2">—</div>
            <div class="mp-sb-set" id="sb-n-s3">—</div>
            <div class="mp-sb-set" id="sb-n-s4">—</div>
            <div class="mp-sb-set" id="sb-n-s5">—</div>
            <div class="mp-sb-pts" id="sb-n-pts">0</div>
          </div>
          <div class="mp-sb-row">
            <div class="mp-sb-player">🇷🇺 Medvedev</div>
            <div class="mp-sb-set" id="sb-m-s1">0</div>
            <div class="mp-sb-set" id="sb-m-s2">—</div>
            <div class="mp-sb-set" id="sb-m-s3">—</div>
            <div class="mp-sb-set" id="sb-m-s4">—</div>
            <div class="mp-sb-set" id="sb-m-s5">—</div>
            <div class="mp-sb-pts" id="sb-m-pts" style="color:#94a3b8;">0</div>
          </div>
        </div>

        <!-- Win Probability / Momentum Bar — dual player strip -->
        <div id="ao22-win-prob-wrap" style="margin:0.1rem 0;">
          <!-- Player labels + pct row -->
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.28rem;">
            <div style="display:flex;align-items:center;gap:0.3rem;">
              <span style="font-size:0.62rem;font-weight:700;color:#f59e0b;letter-spacing:0.02em;">Nadal</span>
              <span id="ao22-nadal-pct" style="font-size:0.7rem;font-weight:800;color:#f59e0b;">52%</span>
            </div>
            <span style="font-size:0.55rem;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.28);">Win Probability</span>
            <div style="display:flex;align-items:center;gap:0.3rem;">
              <span id="ao22-medv-pct" style="font-size:0.7rem;font-weight:800;color:#38bdf8;">48%</span>
              <span style="font-size:0.62rem;font-weight:700;color:#38bdf8;letter-spacing:0.02em;">Medvedev</span>
            </div>
          </div>
          <!-- Dual bar: left = Nadal (amber), right = Medvedev (sky) -->  
          <div style="height:6px;border-radius:3px;overflow:hidden;background:rgba(255,255,255,0.06);display:flex;">
            <div id="ao22-nadal-bar" style="width:52%;background:linear-gradient(90deg,#d97706,#f59e0b);border-radius:3px 0 0 3px;transition:width 0.6s cubic-bezier(0.4,0,0.2,1);"></div>
            <div style="width:2px;background:rgba(6,10,22,0.9);"></div>
            <div id="ao22-medv-bar"  style="flex:1;background:linear-gradient(90deg,#0ea5e9,#38bdf8);border-radius:0 3px 3px 0;transition:flex 0.6s cubic-bezier(0.4,0,0.2,1);"></div>
          </div>
          <!-- Hidden legacy bar for internal updateMomentum compat -->
          <div style="display:none;"><div class="mp-mom-bar-fill" id="ao22-mom-bar" style="width:26%;"></div></div>
          <span id="ao22-mom-val" style="display:none;">26</span>
        </div>

        <!-- Act Banner -->
        <div class="mp-act-banner" id="ao22-act-banner">
          <span id="ao22-act-label" style="color:#0ea5e9;">ACT I</span>
          <span id="ao22-act-title">Medvedev Dominates</span>
        </div>

        <!-- Coach Cue — rolling list of last 3 -->
        <div class="mp-coach-box">
          <div class="mp-coach-label">🎧 AI Coach Cue · Earbud Delivery</div>
          <div id="ao22-coach-cue-list">
            <div class="mp-cue-item">"Stay present. This is your moment — trust every shot you've built."</div>
          </div>
          <div style="display:flex;align-items:center;gap:0.3rem;margin-top:0.35rem;">
            <div style="width:4px;height:4px;border-radius:50%;background:#00f5d4;animation:mp-pulse 1.5s infinite;"></div>
            <span style="font-size:0.62rem;color:#64748b;letter-spacing:0.04em;">sub-200ms · Adam voice · ElevenLabs</span>
          </div>
        </div>

      </div><!-- /centre -->

      <!-- RIGHT: Composure Arc -->
      <div class="mp-composure-panel">
        <div class="mp-composure-title">Composure Arc</div>
        <canvas id="ao22-composure-canvas" width="140" height="90"></canvas>
        <div style="text-align:center;margin-top:0.25rem;">
          <div id="ao22-tier-badge" class="mp-tier-badge" style="color:#0ea5e9;background:rgba(14,165,233,0.12);border:1px solid rgba(14,165,233,0.3);">STABLE</div>
          <div id="ao22-composure-val" style="font-size:1.5rem;font-weight:800;color:#e2e8f0;margin:0.2rem 0 0;line-height:1;">74</div>
          <div style="font-size:0.62rem;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">composure index</div>
        </div>
        <div id="ao22-intervene-flag" class="mp-intervene-flag">⚠ COACH INTERVENED</div>

        <!-- ── Game Metrics 2×3 Grid ── -->
        <div class="mp-stats-grid">

          <!-- Serve Speed -->
          <div class="mp-stat-card" style="--sc:rgba(0,245,212,0.3);--sc-text:#00f5d4;--sc-glow:rgba(0,245,212,0.4);">
            <div class="mp-stat-label">Serve Speed</div>
            <div><span class="mp-stat-val" id="gs-serve-speed">119</span><span class="mp-stat-unit">mph</span></div>
            <div class="mp-stat-sub" id="gs-serve-max">Max: 132 mph</div>
          </div>

          <!-- Ball Spin -->
          <div class="mp-stat-card" style="--sc:rgba(167,139,250,0.3);--sc-text:#a78bfa;--sc-glow:rgba(167,139,250,0.4);">
            <div class="mp-stat-label">Ball Spin</div>
            <div><span class="mp-stat-val" id="gs-spin">2,730</span><span class="mp-stat-unit">rpm</span></div>
            <div class="mp-stat-sub" id="gs-spin-type">Type: Topspin</div>
          </div>

          <!-- Shot Accuracy -->
          <div class="mp-stat-card" style="--sc:rgba(34,197,94,0.3);--sc-text:#22c55e;--sc-glow:rgba(34,197,94,0.35);">
            <div class="mp-stat-label">Shot Acc.</div>
            <div><span class="mp-stat-val" id="gs-accuracy">89</span><span class="mp-stat-unit">%</span></div>
            <div class="mp-stat-sub" id="gs-accuracy-sub">Last 10: 10/10</div>
          </div>

          <!-- Court Coverage -->
          <div class="mp-stat-card" style="--sc:rgba(14,165,233,0.3);--sc-text:#0ea5e9;--sc-glow:rgba(14,165,233,0.35);">
            <div class="mp-stat-label">Crt Cover</div>
            <div><span class="mp-stat-val" id="gs-coverage">77</span><span class="mp-stat-unit">%</span></div>
            <div class="mp-stat-sub" id="gs-coverage-sub">Distance: 0.9 km</div>
          </div>

          <!-- Reaction Time -->
          <div class="mp-stat-card" style="--sc:rgba(249,115,22,0.3);--sc-text:#f97316;--sc-glow:rgba(249,115,22,0.35);">
            <div class="mp-stat-label">React Time</div>
            <div><span class="mp-stat-val" id="gs-reaction">0.45</span><span class="mp-stat-unit">s</span></div>
            <div class="mp-stat-sub" id="gs-reaction-sub">Best: 0.20s</div>
          </div>

          <!-- Rally Stats -->
          <div class="mp-stat-card" style="--sc:rgba(234,179,8,0.3);--sc-text:#eab308;--sc-glow:rgba(234,179,8,0.35);">
            <div class="mp-stat-label">Rally Stats</div>
            <div><span class="mp-stat-val" id="gs-rally-avg">9.9</span><span class="mp-stat-unit">avg</span></div>
            <div class="mp-stat-sub" id="gs-rally-longest">Longest: 20 shots</div>
          </div>

        </div><!-- /mp-stats-grid -->

        <!-- Momentum Δ + Shot Depth chips -->
        <div style="margin-top:auto;padding-top:0.4rem;border-top:1px solid rgba(255,255,255,0.05);display:flex;gap:0.4rem;">
          <div style="flex:1;background:rgba(249,115,22,0.05);border:1px solid rgba(249,115,22,0.15);border-radius:5px;padding:0.25rem 0.35rem;text-align:center;">
            <div style="font-size:0.68rem;color:#64748b;text-transform:uppercase;letter-spacing:0.04em;">Mom. Δ</div>
            <div id="ao22-mom-delta" style="font-size:1.1rem;font-weight:800;color:#f97316;line-height:1;">+0</div>
            <div id="ao22-mom-trend" style="font-size:0.66rem;color:#64748b;">neutral</div>
          </div>
          <div style="flex:1;background:rgba(56,189,248,0.05);border:1px solid rgba(56,189,248,0.15);border-radius:5px;padding:0.25rem 0.35rem;text-align:center;">
            <div style="font-size:0.68rem;color:#64748b;text-transform:uppercase;letter-spacing:0.04em;">Depth</div>
            <div id="ao22-depth" style="font-size:1.1rem;font-weight:800;color:#38bdf8;line-height:1;">—</div>
            <div id="ao22-depth-sub" style="font-size:0.66rem;color:#64748b;">avg depth</div>
          </div>
        </div>
        <div id="ao22-log" style="display:none;"></div>
      </div>

    </div><!-- /main-grid -->

    <!-- PROGRESS STRIP -->
    <div class="mp-progress-strip">
      <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
        <span style="font-size:0.65rem;color:#64748b;font-weight:600;" id="ao22-time-label">0:00</span>
        <span style="font-size:0.62rem;color:#475569;">7:00 · 5 Sets</span>
      </div>
      <div class="mp-progress-track">
        <div id="ao22-progress-fill"></div>
      </div>
      <div class="mp-act-markers">
        <span style="color:#0ea5e9;">▸ ACT I</span>
        <span style="color:#f97316;">▸ CRISIS</span>
        <span style="color:#22c55e;">▸ COMEBACK</span>
        <span style="color:#eab308;">▸ CHAMPION</span>
        <span style="color:#FFD700;">🏆</span>
      </div>
    </div>
    `;

    drawCourt();
    initComposureChart();
  }

  // ── Court Drawing ─────────────────────────────────────────
  function drawCourt() {
    const canvas = document.getElementById('ao22-court-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    renderCourtFrame(ctx);
  }

  function renderCourtFrame(ctx) {
    const W = CW, H = CH;
    const { mx, my, w, h, netY } = COURT;

    ctx.clearRect(0, 0, W, H);

    // ── Background ──
    ctx.fillStyle = '#060e1e';
    ctx.fillRect(0, 0, W, H);

    // ── Court surface — AO Melbourne blue ──
    ctx.fillStyle = '#0f2d5e';
    ctx.fillRect(mx, my, w, h / 2);
    ctx.fillStyle = '#1a3f7a';
    ctx.fillRect(mx, netY, w, h / 2);

    // ── Overhead lighting gradient — soft specular from center ──
    var lightGrd = ctx.createRadialGradient(mx + w / 2, netY, 0, mx + w / 2, netY, h * 0.72);
    lightGrd.addColorStop(0,   'rgba(200,220,255,0.09)');
    lightGrd.addColorStop(0.4, 'rgba(150,190,255,0.04)');
    lightGrd.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = lightGrd;
    ctx.fillRect(mx, my, w, h);

    // ── Doubles alleys — slightly darker bands ──
    var dbl = mx + w * 0.08;
    var dbr = mx + w * 0.92;
    ctx.fillStyle = 'rgba(0,0,0,0.13)';
    ctx.fillRect(mx, my, dbl - mx, h);
    ctx.fillRect(dbr, my, mx + w - dbr, h);

    // ── Hard-court acrylic texture lines ──
    ctx.strokeStyle = 'rgba(255,255,255,0.022)';
    ctx.lineWidth = 0.5;
    for (var gi = 0; gi <= 20; gi++) {
      ctx.beginPath(); ctx.moveTo(mx + gi * (w / 20), my); ctx.lineTo(mx + gi * (w / 20), my + h); ctx.stroke();
    }
    for (var gj = 0; gj <= 28; gj++) {
      ctx.beginPath(); ctx.moveTo(mx, my + gj * (h / 28)); ctx.lineTo(mx + w, my + gj * (h / 28)); ctx.stroke();
    }

    // ── Court lines ──
    var sl = mx + w * 0.08;
    var sr = mx + w * 0.92;
    var svcDepth = h * 0.265;
    ctx.strokeStyle = 'rgba(255,255,255,0.92)';
    ctx.lineWidth = 2.0;
    ctx.strokeRect(mx, my, w, h);                                   // outer boundary
    ctx.beginPath(); ctx.moveTo(sl, my); ctx.lineTo(sl, my + h); ctx.stroke();  // L singles
    ctx.beginPath(); ctx.moveTo(sr, my); ctx.lineTo(sr, my + h); ctx.stroke();  // R singles
    ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.moveTo(sl, netY - svcDepth); ctx.lineTo(sr, netY - svcDepth); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sl, netY + svcDepth); ctx.lineTo(sr, netY + svcDepth); ctx.stroke();
    ctx.beginPath(); ctx.moveTo((sl + sr) / 2, netY - svcDepth); ctx.lineTo((sl + sr) / 2, netY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo((sl + sr) / 2, netY); ctx.lineTo((sl + sr) / 2, netY + svcDepth); ctx.stroke();
    ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(W / 2 - 8, my);     ctx.lineTo(W / 2 + 8, my);     ctx.stroke(); // top centre mark
    ctx.beginPath(); ctx.moveTo(W / 2 - 8, my + h); ctx.lineTo(W / 2 + 8, my + h); ctx.stroke(); // bot centre mark

    // ── Net shadow cast on court (before net itself) ──
    var netShadowGrd = ctx.createLinearGradient(mx, netY, mx, netY + 18);
    netShadowGrd.addColorStop(0, 'rgba(0,0,0,0.28)');
    netShadowGrd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = netShadowGrd;
    ctx.fillRect(mx, netY, w, 18);

    // ── Net — full mesh render ──
    var netH  = 14;   // net height in canvas pixels
    var netTop = netY - netH;
    var netBot = netY;
    var postW  = 4;

    // Net fill — dark mesh background
    ctx.fillStyle = 'rgba(20,30,55,0.85)';
    ctx.fillRect(mx - 1, netTop, w + 2, netH);

    // Mesh verticals (every ~5px)
    ctx.strokeStyle = 'rgba(180,200,230,0.18)';
    ctx.lineWidth = 0.7;
    var meshStep = 5;
    for (var ni = 0; ni * meshStep <= w; ni++) {
      ctx.beginPath();
      ctx.moveTo(mx + ni * meshStep, netTop);
      ctx.lineTo(mx + ni * meshStep, netBot);
      ctx.stroke();
    }
    // Mesh horizontals (3 bands)
    for (var nj = 0; nj <= 3; nj++) {
      ctx.beginPath();
      ctx.moveTo(mx, netTop + nj * (netH / 3));
      ctx.lineTo(mx + w, netTop + nj * (netH / 3));
      ctx.stroke();
    }

    // Net top white band (tape)
    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(mx - 4, netTop); ctx.lineTo(mx + w + 4, netTop); ctx.stroke();

    // Net posts
    ctx.fillStyle = '#c8d8ec';
    ctx.fillRect(mx - 6, netTop - 2, 5, netH + 4);
    ctx.fillRect(mx + w + 1, netTop - 2, 5, netH + 4);
    // Post highlight
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(mx - 5, netTop - 2, 1, netH + 4);
    ctx.fillRect(mx + w + 2, netTop - 2, 1, netH + 4);

    // ── Player labels ──
    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('MEDVEDEV', W / 2, my + 14);
    ctx.fillText('NADAL', W / 2, my + h - 6);

    // MatchPoint watermark
    ctx.font = '7px monospace';
    ctx.fillStyle = 'rgba(0,245,212,0.10)';
    ctx.fillText('MatchPoint™ ELC', W / 2, netY - netH - 2);

    // ── Landing zone prediction ring ──
    if (landingZone) {
      var lzAge = (performance.now() - landingZone.born) / 1000;
      if (lzAge < 1.8) {
        var lzAlpha = Math.max(0, 0.55 - lzAge * 0.3);
        // Pulsing: ring expands then fades
        var lzR = 8 + lzAge * 18;
        var lzColor = landingZone.call === 'OUT' ? 'rgba(239,68,68,' : 'rgba(0,245,212,';
        ctx.beginPath();
        ctx.arc(landingZone.cx, landingZone.cy, lzR, 0, Math.PI * 2);
        ctx.strokeStyle = lzColor + lzAlpha + ')';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
        // Inner solid dot
        ctx.beginPath();
        ctx.arc(landingZone.cx, landingZone.cy, 3, 0, Math.PI * 2);
        ctx.fillStyle = lzColor + (lzAlpha * 0.6) + ')';
        ctx.fill();
      } else {
        landingZone = null;
      }
    }

    // ── Skid marks ──
    var _nowSk = performance.now();
    skidMarks = skidMarks.filter(function(s) { return _nowSk - s.born < 2000; });
    for (var _si = 0; _si < skidMarks.length; _si++) {
      var _sm = skidMarks[_si];
      var _smAge = (_nowSk - _sm.born) / 2000;
      var _smA = Math.max(0, 0.6 * (1 - _smAge));
      var _smLen = 8 + (1 - _smAge) * 10;
      ctx.save();
      ctx.translate(_sm.cx, _sm.cy);
      ctx.rotate(_sm.angle);
      var _smC = _sm.call === 'OUT' ? '239,68,68' : '0,245,212';
      var _smGrd = ctx.createLinearGradient(-_smLen, 0, _smLen, 0);
      _smGrd.addColorStop(0,   'rgba(' + _smC + ',0)');
      _smGrd.addColorStop(0.5, 'rgba(' + _smC + ',' + _smA + ')');
      _smGrd.addColorStop(1,   'rgba(' + _smC + ',0)');
      ctx.beginPath(); ctx.moveTo(-_smLen, 0); ctx.lineTo(_smLen, 0);
      ctx.strokeStyle = _smGrd; ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();
    }

    // ── Dust puffs ──
    dustPuffs = dustPuffs.filter(function(d) { return _nowSk - d.born < 480; });
    for (var _dpi = 0; _dpi < dustPuffs.length; _dpi++) {
      var _dp = dustPuffs[_dpi];
      var _dpAge = (_nowSk - _dp.born) / 480;
      var _dpA = Math.max(0, 0.5 * (1 - _dpAge));
      var _dpExp = 1 + _dpAge * 3.0;
      var _dpC = _dp.call === 'OUT' ? '239,68,68' : '180,220,255';
      for (var _pj = 0; _pj < _dp.particles.length; _pj++) {
        var _pp = _dp.particles[_pj];
        ctx.beginPath();
        ctx.arc(_dp.cx + _pp.ox * _dpExp, _dp.cy + _pp.oy * _dpExp,
                Math.max(0.5, 1.5 * (1 - _dpAge)), 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + _dpC + ',' + _dpA + ')';
        ctx.fill();
      }
    }

    // ── Heatmap dots — oblong ellipse in shot travel direction ──
    heatDots.forEach(function(dot) {
      dot.age = (dot.age || 0) + 1;
      var alpha = Math.max(0, 0.65 - dot.age * 0.004);
      if (alpha <= 0) return;
      var dp = dataToCanvas(dot.x, dot.y);
      var dcx = dp.cx, dcy = dp.cy;
      var color = dot.call === 'IN' ? 'rgba(0,245,212,' + alpha + ')' : 'rgba(239,68,68,' + alpha + ')';
      // Glow halo
      var grd = ctx.createRadialGradient(dcx, dcy, 0, dcx, dcy, 9);
      grd.addColorStop(0, color); grd.addColorStop(1, 'transparent');
      ctx.beginPath(); ctx.arc(dcx, dcy, 9, 0, Math.PI * 2);
      ctx.fillStyle = grd; ctx.fill();
      // Directional ellipse — stretched along shot travel angle
      var angle = dot.angle || 0;
      ctx.save();
      ctx.translate(dcx, dcy);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.ellipse(0, 0, 5, 2.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = dot.call === 'IN'
        ? 'rgba(0,245,212,' + Math.min(1, alpha * 2) + ')'
        : 'rgba(239,68,68,' + Math.min(1, alpha * 2) + ')';
      ctx.fill();
      ctx.restore();
    });

    // ── Shot arcs — newest = bright+thick, older = dim+thin ──
    var totalArcs = shotArcs.length;
    shotArcs.forEach(function(arc, arcIdx) {
      arc.age = (arc.age || 0) + 1;
      // isNewest: last arc in array
      var isNewest = arcIdx === totalArcs - 1;
      var ageFade = Math.max(0, 0.75 - arc.age * 0.015);
      if (ageFade <= 0) return;
      var p1 = dataToCanvas(arc.x1, arc.y1);
      var p2 = dataToCanvas(arc.x2, arc.y2);
      var cpx = (p1.cx + p2.cx) / 2;
      // Use stable stored offset — no random jitter each frame
      // Bow toward net center: control point is vertically between the two endpoints,
      // pulled toward netY — shots that cross the net arc naturally over it
      var netYCoord = COURT.my + COURT.h / 2;
      var cpyMid = (p1.cy + p2.cy) / 2;
      // Pull the peak toward netY by cpOff pixels
      var cpyDir = cpyMid + (netYCoord - cpyMid) * 0.6 - (arc.cpOff || 24);
      var cpy = cpyDir;
      var lw = isNewest ? 2.2 : 1.0 * ageFade + 0.4;
      var alpha = isNewest ? Math.min(0.95, ageFade * 1.6) : ageFade * 0.7;
      var inColor  = arc.call === 'IN'  ? ('rgba(0,245,212,' + alpha + ')') : ('rgba(239,68,68,' + alpha + ')');

      // Newest arc: draw a white glow pass underneath
      if (isNewest) {
        ctx.beginPath();
        ctx.moveTo(p1.cx, p1.cy);
        ctx.quadraticCurveTo(cpx, cpy, p2.cx, p2.cy);
        ctx.strokeStyle = 'rgba(255,255,255,' + ageFade * 0.25 + ')';
        ctx.lineWidth = lw + 2;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.moveTo(p1.cx, p1.cy);
      ctx.quadraticCurveTo(cpx, cpy, p2.cx, p2.cy);
      ctx.strokeStyle = inColor;
      ctx.lineWidth = lw;
      ctx.stroke();
    });

    // Remove aged out items
    heatDots.splice(0, heatDots.filter(function(d) { return (d.age || 0) > 160; }).length);
    shotArcs.splice(0, shotArcs.filter(function(a) { return (a.age || 0) > 60; }).length);
  }

  // ── Composure Chart ───────────────────────────────────────
  function initComposureChart() {
    drawComposureChart([{ t:0, val:74 }]);
  }

  function drawComposureChart(points) {
    const canvas = document.getElementById('ao22-composure-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const pad = { l:6, r:6, t:8, b:8 };
    const gw = W-pad.l-pad.r, gh = H-pad.t-pad.b;

    // Zone bands
    const zones = [
      { min:88, max:100, color:'rgba(234,179,8,0.14)',  label:'ELITE' },
      { min:70, max:88,  color:'rgba(34,197,94,0.10)',  label:'STRONG' },
      { min:55, max:70,  color:'rgba(14,165,233,0.09)', label:'STABLE' },
      { min:0,  max:55,  color:'rgba(239,68,68,0.13)',  label:'CRITICAL' },
    ];
    zones.forEach(z => {
      const y1 = pad.t + gh*(1-z.max/100);
      const y2 = pad.t + gh*(1-z.min/100);
      ctx.fillStyle = z.color;
      ctx.fillRect(pad.l, y1, gw, y2-y1);
    });

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 0.5;
    [25,50,75].forEach(v => {
      const gy = pad.t + gh*(1-v/100);
      ctx.beginPath(); ctx.moveTo(pad.l, gy); ctx.lineTo(pad.l+gw, gy); ctx.stroke();
    });

    // Crisis shading
    const crx1 = pad.l + (145/MAX_T)*gw;
    const crx2 = pad.l + (185/MAX_T)*gw;
    ctx.fillStyle = 'rgba(239,68,68,0.1)';
    ctx.fillRect(crx1, pad.t, crx2-crx1, gh);

    // Coach intervention line
    const intX = pad.l + (168/MAX_T)*gw;
    ctx.strokeStyle = 'rgba(167,139,250,0.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2,3]);
    ctx.beginPath(); ctx.moveTo(intX, pad.t); ctx.lineTo(intX, pad.t+gh); ctx.stroke();
    ctx.setLineDash([]);

    // Zone labels (right side)
    ctx.font = '5.5px monospace';
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(234,179,8,0.75)'; ctx.fillText('ELITE', pad.l+gw-1, pad.t+gh*(1-90/100)+5);
    ctx.fillStyle = 'rgba(239,68,68,0.75)'; ctx.fillText('CRIT', pad.l+gw-1, pad.t+gh*(1-45/100)+5);

    if (points.length < 2) return;

    // Line gradient
    const grad = ctx.createLinearGradient(pad.l, 0, pad.l+gw, 0);
    grad.addColorStop(0,    '#0ea5e9');
    grad.addColorStop(0.33, '#f97316');
    grad.addColorStop(0.40, '#ef4444');
    grad.addColorStop(0.52, '#22c55e');
    grad.addColorStop(0.72, '#eab308');
    grad.addColorStop(1.0,  '#FFD700');

    // Area fill
    ctx.beginPath();
    points.forEach((p, i) => {
      const px = pad.l + (p.t/MAX_T)*gw;
      const py = pad.t + gh*(1-p.val/100);
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    });
    const last = points[points.length-1];
    ctx.lineTo(pad.l + (last.t/MAX_T)*gw, pad.t+gh);
    ctx.lineTo(pad.l + (points[0].t/MAX_T)*gw, pad.t+gh);
    ctx.closePath();
    ctx.fillStyle = 'rgba(0,245,212,0.06)';
    ctx.fill();

    // Line
    ctx.beginPath();
    points.forEach((p, i) => {
      const px = pad.l + (p.t/MAX_T)*gw;
      const py = pad.t + gh*(1-p.val/100);
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    });
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Current dot
    const cur = points[points.length-1];
    const curX = pad.l + (cur.t/MAX_T)*gw;
    const curY = pad.t + gh*(1-cur.val/100);
    ctx.beginPath(); ctx.arc(curX, curY, 3.5, 0, Math.PI*2);
    ctx.fillStyle = '#00f5d4'; ctx.fill();
    // Pulse ring
    ctx.beginPath(); ctx.arc(curX, curY, 6, 0, Math.PI*2);
    ctx.strokeStyle = 'rgba(0,245,212,0.3)'; ctx.lineWidth = 1.5; ctx.stroke();
  }

  // ── Call logging ──────────────────────────────────────────
  function logCall(callType, confidence, player) {
    recentCalls.unshift({ call: callType, player: player || 'Auto', confidence: confidence || 99.0, t: Date.now() });
    if (recentCalls.length > 8) recentCalls.pop();
    renderRecentCalls();
    flashCallBadge(callType);
  }

  function renderRecentCalls() {
    const list = document.getElementById('ao22-recent-calls');
    if (list) {
      list.innerHTML = recentCalls.map(c => `
        <div class="mp-recent-item">
          <span class="mp-recent-call ${c.call}">${c.call}</span>
          <span style="color:#64748b;font-size:0.65rem;">${c.player}</span>
          <span style="color:#475569;font-size:0.65rem;">${c.confidence.toFixed(1)}%</span>
        </div>
      `).join('');
    }
    // Also update Coach Control compact list (last 3)
    const ccList = document.getElementById('line-calls-compact');
    if (ccList) {
      const callColor = { IN: '#22c55e', OUT: '#ef4444', LET: '#eab308', FAULT: '#f97316', OVERTURNED: '#a855f7', CONFIRMED: '#06b6d4' };
      ccList.innerHTML = recentCalls.slice(0, 3).map(c => `
        <li style="padding:0.12rem 0;">
          &#8226; ${c.player} —
          <span style="color:${callColor[c.call] || '#94a3b8'};font-weight:700;">${c.call}</span>
          <span style="color:#475569;">(&plusmn;${(Math.random()*2+1).toFixed(1)}mm)</span>
        </li>
      `).join('');
    }
  }

  function flashCallBadge(callType) {
    const flash = document.getElementById('ao22-call-flash');
    if (!flash) return;
    flash.textContent = callType;
    flash.style.color = callType === 'IN' ? '#22c55e' : callType === 'OUT' ? '#ef4444' : '#eab308';
    flash.style.opacity = '1';
    setTimeout(() => { flash.style.opacity = '0'; }, 600);
    // Fire the matching call button with pulse animation
    fireCallButtonAnim(callType);
    // Fire the indicator bar light
    fireIndicatorLight(callType);
  }

  let _indicatorTimer = null;
  function fireIndicatorLight(callType) {
    // Map to indicator IDs
    const map = { IN: 'in', OUT: 'out', LET: 'let', FAULT: 'out' };
    const key = map[callType];
    if (!key) return;
    // Clear any existing timer + reset all lights
    if (_indicatorTimer) clearTimeout(_indicatorTimer);
    ['in','out','let'].forEach(k => {
      const light = document.getElementById(`ao22-light-${k}`);
      const wrap  = document.getElementById(`ao22-ind-${k}`);
      if (light) light.classList.remove('lit');
      if (wrap)  wrap.classList.remove('lit');
    });
    // Light up the correct one
    const light = document.getElementById(`ao22-light-${key}`);
    const wrap  = document.getElementById(`ao22-ind-${key}`);
    if (light) light.classList.add('lit');
    if (wrap)  wrap.classList.add('lit');
    // OUT holds longer — it's the critical call
    const holdMs = callType === 'OUT' ? 2200 : 1400;
    _indicatorTimer = setTimeout(() => {
      if (light) light.classList.remove('lit');
      if (wrap)  wrap.classList.remove('lit');
    }, holdMs);
  }

  function fireCallButtonAnim(callType) {
    // Map call type to button class selector
    const map = { IN: '.mp-call-btn.in', OUT: '.mp-call-btn.out', LET: '.mp-call-btn.let', FAULT: '.mp-call-btn.fault' };
    const sel = map[callType];
    if (!sel) return;
    const btn = document.querySelector(sel);
    if (!btn) return;
    btn.classList.remove('firing');
    void btn.offsetWidth; // reflow to restart animation
    btn.classList.add('firing');
    btn.classList.add('active');
    setTimeout(() => { btn.classList.remove('firing'); btn.classList.remove('active'); }, 380);
  }

  // ── Challenge Review ──────────────────────────────────────
  function triggerChallenge() {
    if (challengePending) return;
    challengePending = true;
    const overlay = document.getElementById('ao22-challenge-overlay');
    const resultEl = document.getElementById('ao22-review-result');
    if (!overlay || !resultEl) return;
    overlay.classList.add('active');
    resultEl.style.display = 'none';

    // Get last call confidence from recent calls
    const lastCall = recentCalls[0];
    const confidence = lastCall ? lastCall.confidence : 97;
    const overturned = confidence < 95; // low confidence = overturnable

    setTimeout(() => {
      resultEl.style.display = 'block';
      if (overturned) {
        resultEl.textContent = 'OVERTURNED';
        resultEl.style.color = '#ef4444';
        logCall('OVERTURNED', 100, 'Challenge');
      } else {
        resultEl.textContent = 'CONFIRMED';
        resultEl.style.color = '#22c55e';
        logCall('CONFIRMED', 100, 'Challenge');
      }
      setTimeout(() => {
        overlay.classList.remove('active');
        resultEl.style.display = 'none';
        challengePending = false;
      }, 1800);
    }, 2000);
  }

  // ── Video Sync State ─────────────────────────────────────
  // When videoEl is set, frame selection is driven by video.currentTime
  // instead of the internal 180ms clock. This is how GCP Video Intelligence
  // data will plug in — frames have real timestamps matching the video.
  let videoEl      = null;   // HTMLVideoElement to sync to (optional)
  let videoOffset  = 0;      // demo_t = video.currentTime - videoOffset
                             // Set this to the video timestamp where the demo data starts

  function frameForTime(t) {
    // Binary search for the frame closest to demo time t
    const frames = window.AO2022_FRAMES;
    if (!frames || !frames.length) return null;
    let lo = 0, hi = frames.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (frames[mid].t < t) lo = mid + 1;
      else hi = mid;
    }
    return frames[lo];
  }

  // ── Animation Loop ────────────────────────────────────────
  function startAnimation(opts) {
    if (isRunning) return;
    const frames = window.AO2022_FRAMES;
    if (!frames || !frames.length) { console.warn('[AO2022] No frame data'); return; }
    isRunning = true;
    frameIdx = 0;
    shotArcs = []; heatDots = []; recentCalls = []; lastLoggedCall = null;
    lastActIdx = -1; lastCueIdx = -1; lastBounceFrame = -1;
    ballTrail = []; bounceFlashes = []; lastBouncePos = null; ballSquash = null;
    tweenFrom = null; tweenTo = null; tweenStart = 0; landingZone = null;
    skidMarks = []; dustPuffs = []; isServeFlight = false; serveLabel = null;
    playerVel.nadal    = { vx: 0, vy: 0, px: 0.5, py: 0.92 };
    playerVel.medvedev = { vx: 0, vy: 0, px: 0.5, py: 0.08 };
    cueHistory = [];
    playerPos.nadal    = { x: 0.50, y: 0.92 };
    playerPos.medvedev = { x: 0.50, y: 0.08 };
    _stopAllMatchAudio(); // reset audio state
    _unlockAudio();       // pre-warm on first user gesture
    // Accept optional video element for sync
    if (opts && opts.video) {
      videoEl     = opts.video;
      videoOffset = opts.offset || 0;
      console.log('[AO2022] Video sync mode: offset=' + videoOffset + 's');
    } else {
      videoEl = null;
    }
    // Reset EMA to first frame values so metrics start stable, not at defaults
    const f0 = window.AO2022_FRAMES[0];
    ema = { spd: f0.spd || 120, rpm: f0.rpm || 2500, conf: f0.conf || 76,
            cov: f0.cov || 42, lat: 2.8, acc: 3.7 };
    // Reset game stats session trackers
    gs.maxServeMph  = Math.round((f0.spd || 120) * 0.621371);
    gs.longestRally = 0; gs.rallySum = 0; gs.rallyCount = 0; gs.prevRc = 0;
    gs.totalDistKm  = 0; gs.prevCovPct = f0.cov || 42;
    gs.bestReaction = 0.45; gs.last10 = []; gs.shotCount = 0;
    gs.prevMom = 50; gs.momDelta = 0; gs.depthSum = 0; gs.depthCount = 0;
    lastFrameTime = performance.now();
    animFrame = requestAnimationFrame(tick);
  }

  function tick(now) {
    if (!isRunning) return;

    const frames = window.AO2022_FRAMES;

    // ── Video-sync mode: find frame by video.currentTime ──
    if (videoEl && !videoEl.paused && !videoEl.ended) {
      const demoT = videoEl.currentTime - videoOffset;
      if (demoT < 0) { animFrame = requestAnimationFrame(tick); return; }
      const frame = frameForTime(demoT);
      if (frame) updateFrame(frame);
      animFrame = requestAnimationFrame(tick);
      return;
    }

    // ── Internal clock mode: advance data frame every FRAME_MS ──
    if (now - lastFrameTime >= FRAME_MS) {
      lastFrameTime = now;
      if (frameIdx >= frames.length) { showFinale(); return; }
      var dataFrame = frames[frameIdx++];
      updateFrame(dataFrame);
    }

    // ── Sub-tick: smooth ball interpolation every rAF (~16ms) ──
    if (tweenFrom && tweenTo) {
      var tProg = Math.min(1, (now - tweenStart) / FRAME_MS);
      // Ease-in-out so ball decelerates naturally into bounce
      var ease = tProg < 0.5
        ? 2 * tProg * tProg
        : 1 - Math.pow(-2 * tProg + 2, 2) / 2;
      var ix = tweenFrom.x + (tweenTo.x - tweenFrom.x) * ease;
      var iy = tweenFrom.y + (tweenTo.y - tweenFrom.y) * ease;
      // Parabolic z: natural flight arc peaking near midpoint
      var zPeak = Math.max(tweenFrom.z, tweenTo.z, 0.25);
      var iz = tweenFrom.z + (tweenTo.z - tweenFrom.z) * ease
               + 4 * (zPeak - Math.max(tweenFrom.z, tweenTo.z)) * ease * (1 - ease);
      var interpFrame = {
        x: ix, y: iy,
        z: Math.max(0, iz),
        call: tweenTo.call,
        spd: tweenFrom.spd + (tweenTo.spd - tweenFrom.spd) * ease
      };
      var cvs = document.getElementById('ao22-court-canvas');
      if (cvs) {
        var ictx = cvs.getContext('2d');
        renderCourtFrame(ictx);
        drawPlayers(ictx, tweenTo);
        _drawBallWithOverlays(ictx, interpFrame);
      }
    }

    animFrame = requestAnimationFrame(tick);
  }

  function updateFrame(frame) {
    // Set up sub-tick tween: interpolate from previous tweenTo to this frame
    if (tweenTo) {
      tweenFrom = { x: tweenTo.x, y: tweenTo.y, z: tweenTo.z || 0,
                    call: tweenTo.call || 'IN', spd: tweenTo.spd || 120 };
    } else {
      tweenFrom = { x: frame.x, y: frame.y, z: frame.z || 0,
                    call: frame.call || 'IN', spd: frame.spd || 120 };
    }
    tweenTo    = { x: frame.x, y: frame.y, z: frame.z || 0,
                   call: frame.call || 'IN', spd: frame.spd || 120 };
    tweenStart = performance.now();

    const canvas = document.getElementById('ao22-court-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Detect bounce — z drops to near zero
    const prevFrame = frameIdx > 1 ? window.AO2022_FRAMES[frameIdx-2] : null;
    const isBounce = !!(prevFrame && prevFrame.z > 0.06 && frame.z < 0.04 && frameIdx - lastBounceFrame > 3);
    if (isBounce) {
      lastBounceFrame = frameIdx;
      // Track last bounce position for live trajectory line
      const _bp = dataToCanvas(frame.x, frame.y);
      lastBouncePos = { cx: _bp.cx, cy: _bp.cy, call: frame.call || 'IN' };
      // Add heatmap dot — store angle for directional ellipse rendering
      var dotAngle = 0;
      if (heatDots.length >= 1) {
        var prevDot = heatDots[heatDots.length - 1];
        dotAngle = Math.atan2(frame.y - prevDot.y, frame.x - prevDot.x);
      }
      heatDots.push({ x: frame.x, y: frame.y, call: frame.call, age: 0, angle: dotAngle });
      // Add arc from prev bounce + update landing zone prediction
      if (heatDots.length >= 2) {
        const prev = heatDots[heatDots.length-2];
        // Store stable cpOffset so arc doesn't jitter every frame
        var cpOff = 18 + Math.random() * 22;
        shotArcs.push({ x1: prev.x, y1: prev.y, x2: frame.x, y2: frame.y, call: frame.call, age: 0, cpOff: cpOff });
        if (shotArcs.length > MAX_ARCS) shotArcs.shift();
        // Project next landing: reflect direction across net
        var dx = frame.x - prev.x, dy = frame.y - prev.y;
        var predX = Math.min(0.95, Math.max(0.05, frame.x + dx * 0.9));
        var predY = frame.y > 0.5 ? Math.max(0.08, frame.y - Math.abs(dy) * 1.1)
                                   : Math.min(0.92, frame.y + Math.abs(dy) * 1.1);
        var lzp = dataToCanvas(predX, predY);
        landingZone = { cx: lzp.cx, cy: lzp.cy, call: frame.call || 'IN', born: performance.now() };
      }
      if (heatDots.length > MAX_DOTS) heatDots.shift();

      // ── Skid mark: directional streak in shot travel angle ──
      skidMarks.push({ cx: _bp.cx, cy: _bp.cy, angle: dotAngle, call: frame.call || 'IN', born: performance.now() });
      if (skidMarks.length > 20) skidMarks.shift();

      // ── Dust puff: 6 micro-particles ──
      var _dustPs = [];
      for (var _dci = 0; _dci < 6; _dci++) {
        var _dca = (_dci / 6) * Math.PI * 2 + (Math.random() - 0.5) * 0.9;
        var _dcr = 3 + Math.random() * 5;
        _dustPs.push({ ox: Math.cos(_dca) * _dcr, oy: Math.sin(_dca) * _dcr * 0.45 });
      }
      dustPuffs.push({ cx: _bp.cx, cy: _bp.cy, call: frame.call || 'IN', born: performance.now(), particles: _dustPs });
      if (dustPuffs.length > 12) dustPuffs.shift();

      // ── Serve detection: near baseline + high speed ──
      var _nearBase = (frame.y < 0.74 || frame.y > 0.945);
      if (_nearBase && (frame.spd || 0) > 140) {
        isServeFlight = true;
        var _sMph = Math.round((frame.spd || 160) * 0.621);
        serveLabel = { text: _sMph + ' mph SERVE', born: performance.now(), cx: _bp.cx, cy: _bp.cy };
      } else {
        isServeFlight = false;
      }
    }

    // ── Drive calls from matchState.lastCall changes (accurate IN/OUT mix) ──
    // Only log on actual call transitions, and guard against duplicate rapid fires
    const currentCall = frame.call || 'IN';
    if (currentCall !== lastLoggedCall && isBounce) {
      lastLoggedCall = currentCall;
      const conf = frame.conf || 97;
      const player = frame.y > 0.5 ? 'Nadal' : 'Medvedev';
      logCall(currentCall, conf, player);
    }

    // ── Match audio ──
    _updateMatchAudio(frame, isBounce, prevFrame);

    // Render court with all overlays
    renderCourtFrame(ctx);

    // Draw player positions
    drawPlayers(ctx, frame);

    // Push to ball trail buffer
    const _bpos = dataToCanvas(frame.x, frame.y);
    ballTrail.push({ cx: _bpos.cx, cy: _bpos.cy, z: frame.z || 0, spd: frame.spd || 120, call: frame.call || 'IN' });
    if (ballTrail.length > TRAIL_LEN) ballTrail.shift();
    // Bounce flash ring
    if (isBounce) {
      bounceFlashes.push({ cx: _bpos.cx, cy: _bpos.cy, call: frame.call || 'IN', born: performance.now() });
      ballSquash = { born: performance.now(), duration: 220 };
    }
    bounceFlashes = bounceFlashes.filter(function(f) { return performance.now() - f.born < 600; });

    // Draw ball with all overlays (trajectory, landing zone, heat dot glow)
    _drawBallWithOverlays(ctx, frame);

    // Update UI panels
    updateScoreboard(frame.sets, frame.p1, frame.p2);
    updateMomentum(frame.mom);
    updateMetrics(frame);
    updateActBanner(frame.t);
    updateCoachCue(frame.t);
    updateComposureArc(frame.t);
    updateProgress(frame.t);

    if (frame.log) {
      const logEl = document.getElementById('ao22-log');
      if (logEl && frame.log !== logEl.dataset.last) {
        logEl.dataset.last = frame.log;
        logEl.textContent = '▸ ' + frame.log;
      }
    }
  }

  // Helper called by both updateFrame and sub-tick interpolation
  function _drawBallWithOverlays(ctx, frame) {
    var _bpos2 = dataToCanvas(frame.x, frame.y);
    var _spd2  = frame.spd || 120;
    var _netY2 = COURT.my + COURT.h / 2;

    // ── Net dip: ball sinks ~6px when crossing net centre ──
    var _distNet = Math.abs(frame.y - 0.5);
    var _netDip  = _distNet < 0.04 ? (1 - _distNet / 0.04) * 6 : 0;

    // ── Speed-dependent lift: fast=flat, slow lob=high ──
    var _spdFactor = Math.max(0.7, Math.min(2.0, 1.8 - (_spd2 - 80) / 100 * 1.1));
    var _lift2 = (frame.z || 0) * 18 * _spdFactor + _netDip;
    var _bcy2  = _bpos2.cy - _lift2;

    // ── Live trajectory dashes from last bounce ──
    if (lastBouncePos) {
      var _lbx2 = lastBouncePos.cx, _lby2 = lastBouncePos.cy;
      var _tcp2x = (_lbx2 + _bpos2.cx) / 2;
      var _tcp2yMid = (_lby2 + _bcy2) / 2;
      var _tcp2y = _tcp2yMid + (_netY2 - _tcp2yMid) * 0.45 - 18;
      var _dashA = isServeFlight ? 0.55 : 0.35;
      var _dashW = isServeFlight ? 2.0  : 1.5;
      ctx.beginPath();
      ctx.moveTo(_lbx2, _lby2);
      ctx.quadraticCurveTo(_tcp2x, _tcp2y, _bpos2.cx, _bcy2);
      ctx.strokeStyle = lastBouncePos.call === 'OUT'
        ? 'rgba(239,68,68,' + _dashA + ')' : 'rgba(0,245,212,' + _dashA + ')';
      ctx.lineWidth = _dashW;
      ctx.setLineDash([3, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // ── Serve speed badge — fades over 1400ms ──
    if (serveLabel) {
      var _slAge = (performance.now() - serveLabel.born) / 1400;
      if (_slAge < 1) {
        var _slA = _slAge < 0.15 ? _slAge / 0.15 : Math.max(0, 1 - (_slAge - 0.15) / 0.85);
        var _bw = 58, _bh = 15;
        var _bx = serveLabel.cx - _bw / 2, _by = serveLabel.cy - _bh - 10;
        ctx.save();
        ctx.globalAlpha = _slA;
        ctx.fillStyle = 'rgba(234,179,8,0.88)';
        ctx.beginPath();
        if (ctx.roundRect) { ctx.roundRect(_bx, _by, _bw, _bh, 4); }
        else               { ctx.rect(_bx, _by, _bw, _bh); }
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.font = 'bold 8px Inter,sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(serveLabel.text, serveLabel.cx, _by + _bh - 3);
        ctx.restore();
      } else {
        serveLabel = null;
      }
    }

    drawBall(ctx, frame, _lift2);
  }

  function drawBall(ctx, frame, liftOverride) {
    const { cx, cy } = dataToCanvas(frame.x, frame.y);
    // ── Foreshortening: far baseline = smaller ball (yn=0→0.78x, near=1.0x) ──
    var _yn3 = Math.max(0, Math.min(1, (frame.y - 0.706) / (0.980 - 0.706)));
    var _pScale = 0.78 + _yn3 * 0.22;
    var lift = (liftOverride !== undefined && liftOverride !== null) ? liftOverride : (frame.z || 0) * 18;
    const ballCy = cy - lift;
    const ballR = (4.5 + (frame.z || 0) * 9) * _pScale;
    const isOut = frame.call === 'OUT';

    // ── Squash on bounce — brief flatten then spring back ──
    var scaleX = 1, scaleY = 1;
    if (ballSquash) {
      var sq = ballSquash;
      var sqP = Math.min(1, (performance.now() - sq.born) / sq.duration); // 0→1
      // Squash curve: flatten at impact (sqP~0), overshoot, settle
      var sqVal = sqP < 0.3
        ? 1 - (sqP / 0.3) * 0.38          // compress: down to 0.62
        : 0.62 + ((sqP - 0.3) / 0.7) * 0.38; // spring back
      scaleX = 1 + (1 - sqVal) * 0.55;   // wider when squashed
      scaleY = sqVal;
      if (sqP >= 1) ballSquash = null;
    }

    // ── Comet trail (oldest → newest, shrinking + fading) ──
    for (var ti = 0; ti < ballTrail.length; ti++) {
      var tp = ballTrail[ti];
      var tfrac = (ti + 1) / ballTrail.length;  // 0→1 oldest→newest
      var tr = (ballR * 0.35) * tfrac;
      var talpha = 0.55 * tfrac * tfrac;
      // Speed-based colour: OUT=red, fast=yellow-white, slow=blue, mid=teal
      var tc;
      if (tp.call === 'OUT') {
        tc = 'rgba(239,68,68,' + talpha + ')';
      } else if (tp.spd > 145) {
        tc = 'rgba(255,240,120,' + talpha + ')';
      } else if (tp.spd < 110) {
        tc = 'rgba(80,160,255,' + talpha + ')';
      } else {
        tc = 'rgba(0,245,212,' + talpha + ')';
      }
      var tCy = tp.cy - tp.z * 18;
      ctx.beginPath();
      ctx.arc(tp.cx, tCy, Math.max(tr, 1), 0, Math.PI * 2);
      ctx.fillStyle = tc;
      ctx.fill();
    }

    // ── Bounce flash rings ──
    var now = performance.now();
    for (var bi = 0; bi < bounceFlashes.length; bi++) {
      var bf = bounceFlashes[bi];
      var bp = (now - bf.born) / 600;           // 0→1 progress
      var bAlpha = 0.7 * (1 - bp);
      var bR = 6 + bp * 22;
      ctx.beginPath();
      ctx.arc(bf.cx, bf.cy, bR, 0, Math.PI * 2);
      ctx.strokeStyle = bf.call === 'OUT'
        ? 'rgba(239,68,68,' + bAlpha + ')'
        : 'rgba(0,245,212,' + bAlpha + ')';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // ── Shadow stays on ground (cy, not ballCy) ──
    ctx.beginPath();
    ctx.ellipse(cx, cy + 4, ballR * 1.3 * scaleX * (1 - lift * 0.012), ballR * 0.45 * (1 - lift * 0.008), 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,' + Math.max(0.1, 0.4 - lift * 0.008) + ')';
    ctx.fill();

    // ── Glow at ballCy ──
    const glow = ctx.createRadialGradient(cx, ballCy, 0, cx, ballCy, ballR * 3);
    glow.addColorStop(0, isOut ? 'rgba(239,68,68,0.55)' : 'rgba(232,255,0,0.55)');
    glow.addColorStop(1, 'transparent');
    ctx.beginPath(); ctx.arc(cx, ballCy, ballR * 3, 0, Math.PI * 2);
    ctx.fillStyle = glow; ctx.fill();

    // ── Ball body with squash transform ──
    ctx.save();
    ctx.translate(cx, ballCy);
    ctx.scale(scaleX, scaleY);
    const bg = ctx.createRadialGradient(-ballR * 0.3, -ballR * 0.3, 0, 0, 0, ballR);
    if (isOut) {
      bg.addColorStop(0, '#ffaaaa');
      bg.addColorStop(0.55, '#ff4444');
      bg.addColorStop(1, '#aa0000');
    } else {
      bg.addColorStop(0, '#f5ff80');
      bg.addColorStop(0.55, '#ccff00');
      bg.addColorStop(1, '#7aaa00');
    }
    ctx.beginPath(); ctx.arc(0, 0, ballR, 0, Math.PI * 2);
    ctx.fillStyle = bg; ctx.fill();
    // Seams
    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.arc(0, 0, ballR * 0.58, 0.4, Math.PI + 0.4); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, ballR * 0.58, Math.PI + 0.4, 0.4); ctx.stroke();
    ctx.restore();
  }

  // ── Player position dots ─────────────────────────────────
  // Tracks smoothed player positions for rendering
  const playerPos = {
    nadal:    { x: 0.50, y: 0.92 },  // starts at bottom baseline
    medvedev: { x: 0.50, y: 0.08 }   // starts at top baseline
  };

  function drawPlayers(ctx, frame) {
    const yn = (frame.y - 0.706) / (0.980 - 0.706);
    const ballOnNadalSide = yn > 0.5;
    const ALPHA = 0.08;

    // Update positions + compute velocity for lean
    var prevNx = playerPos.nadal.x, prevNy = playerPos.nadal.y;
    var prevMx = playerPos.medvedev.x, prevMy = playerPos.medvedev.y;

    if (ballOnNadalSide) {
      playerPos.nadal.x += ALPHA * (frame.x - playerPos.nadal.x);
      playerPos.nadal.y += ALPHA * (Math.min(yn + 0.10, 0.98) - playerPos.nadal.y);
    } else {
      playerPos.medvedev.x += ALPHA * (frame.x - playerPos.medvedev.x);
      playerPos.medvedev.y += ALPHA * (Math.max(yn - 0.10, 0.02) - playerPos.medvedev.y);
    }

    // Smooth velocity (EMA)
    var VEL_A = 0.25;
    playerVel.nadal.vx    += VEL_A * ((playerPos.nadal.x    - prevNx) * 80 - playerVel.nadal.vx);
    playerVel.nadal.vy    += VEL_A * ((playerPos.nadal.y    - prevNy) * 80 - playerVel.nadal.vy);
    playerVel.medvedev.vx += VEL_A * ((playerPos.medvedev.x - prevMx) * 80 - playerVel.medvedev.vx);
    playerVel.medvedev.vy += VEL_A * ((playerPos.medvedev.y - prevMy) * 80 - playerVel.medvedev.vy);

    var playerDefs = [
      { pos: playerPos.nadal,    vel: playerVel.nadal,    label: 'N', color: '#f59e0b', shadow: 'rgba(245,158,11,0.55)', active: ballOnNadalSide },
      { pos: playerPos.medvedev, vel: playerVel.medvedev, label: 'M', color: '#38bdf8', shadow: 'rgba(56,189,248,0.55)',  active: !ballOnNadalSide }
    ];

    playerDefs.forEach(function(p) {
      var pcx = COURT.mx + p.pos.x * COURT.w;
      var pcy = COURT.my + p.pos.y * COURT.h;
      var vx = p.vel.vx, vy = p.vel.vy;
      var speed = Math.sqrt(vx * vx + vy * vy);

      // ─ Velocity trail — 3 fading dots behind player ─
      for (var ti = 3; ti >= 1; ti--) {
        var tf = ti / 3;
        var trailAlpha = 0.18 * tf * tf;
        var trailR = 4.5 * tf;
        ctx.beginPath();
        ctx.arc(pcx - vx * ti * 1.8, pcy - vy * ti * 1.8, trailR, 0, Math.PI * 2);
        ctx.fillStyle = p.color.replace(')', ',' + trailAlpha + ')').replace('rgb', 'rgba');
        // Use a manual rgba construction
        ctx.fillStyle = p.label === 'N'
          ? 'rgba(245,158,11,' + trailAlpha + ')'
          : 'rgba(56,189,248,' + trailAlpha + ')';
        ctx.fill();
      }

      // ─ Glow halo — bigger + brighter when active (just hit) ─
      var haloR = p.active ? 18 : 13;
      var glow = ctx.createRadialGradient(pcx, pcy, 0, pcx, pcy, haloR);
      glow.addColorStop(0, p.shadow);
      glow.addColorStop(1, 'transparent');
      ctx.beginPath(); ctx.arc(pcx, pcy, haloR, 0, Math.PI * 2);
      ctx.fillStyle = glow; ctx.fill();

      // ─ Ground shadow ─
      ctx.beginPath();
      ctx.ellipse(pcx, pcy + 7, 8, 3, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fill();

      // ─ Lean indicator — short arrow in direction of movement ─
      if (speed > 0.4) {
        var leanLen = Math.min(speed * 2.2, 10);
        var norm = speed > 0 ? speed : 1;
        ctx.beginPath();
        ctx.moveTo(pcx, pcy);
        ctx.lineTo(pcx + (vx / norm) * leanLen, pcy + (vy / norm) * leanLen);
        ctx.strokeStyle = p.label === 'N' ? 'rgba(245,158,11,0.55)' : 'rgba(56,189,248,0.55)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // ─ Body dot ─
      ctx.beginPath(); ctx.arc(pcx, pcy, 7, 0, Math.PI * 2);
      ctx.fillStyle = p.color; ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 1.3; ctx.stroke();

      // ─ Initial label ─
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 7px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.label, pcx, pcy);
    });
  }

  // ── UI Updates ────────────────────────────────────────────
  function updateScoreboard(sets, p1, p2) {
    ['s1','s2','s3','s4','s5'].forEach((s, i) => {
      const nEl = document.getElementById(`sb-n-${s}`);
      const mEl = document.getElementById(`sb-m-${s}`);
      if (!nEl || !mEl) return;
      if (i < sets.length) {
        const ns = sets[i][0], ms = sets[i][1];
        nEl.textContent = ns; mEl.textContent = ms;
        const nWon = ns > ms && (ns >= 6 || ns === 7);
        const mWon = ms > ns && (ms >= 6 || ms === 7);
        nEl.className = 'mp-sb-set' + (nWon ? ' won' : ns > ms ? '' : ' losing');
        mEl.className = 'mp-sb-set' + (mWon ? ' won' : ms > ns ? '' : ' losing');
      } else {
        nEl.textContent = '—'; mEl.textContent = '—';
        nEl.className = 'mp-sb-set'; mEl.className = 'mp-sb-set';
      }
    });
    const nPts = document.getElementById('sb-n-pts');
    const mPts = document.getElementById('sb-m-pts');
    if (nPts) nPts.textContent = p1;
    if (mPts) mPts.textContent = p2;
  }

  function updateMomentum(mom) {
    // Legacy hidden bar (kept for compat)
    const bar = document.getElementById('ao22-mom-bar');
    const val = document.getElementById('ao22-mom-val');
    if (bar) bar.style.width = mom + '%';
    if (val) val.textContent = Math.round(mom);

    // ══ Win Probability dual bar ══
    // mom 0-100: higher = Nadal has more momentum/win probability
    // Map to win% with regression-to-mean (never below 15 or above 85)
    const nadalPct  = Math.round(Math.max(15, Math.min(85, 50 + (mom - 50) * 0.65)));
    const medvPct   = 100 - nadalPct;
    const naBar     = document.getElementById('ao22-nadal-bar');
    const meBar     = document.getElementById('ao22-medv-bar');
    const naPct     = document.getElementById('ao22-nadal-pct');
    const mePct     = document.getElementById('ao22-medv-pct');
    if (naBar) naBar.style.width = nadalPct + '%';
    if (naPct) naPct.textContent = nadalPct + '%';
    if (mePct) mePct.textContent = medvPct  + '%';
  }

  function updateMetrics(frame) {
    const spEl   = document.getElementById('ao22-speed');
    const rpEl   = document.getElementById('ao22-rpm');
    const confEl = document.getElementById('lcs-confidence');
    const latEl  = document.getElementById('lcs-latency');
    const accEl  = document.getElementById('lcs-accuracy');
    const covEl  = document.getElementById('ao22-cov');
    const rcEl   = document.getElementById('ao22-rally');

    // Pull real frame values (fall back gracefully if frame data missing)
    const rawSpd  = frame.spd  || 120;
    const rawRpm  = frame.rpm  || (2400 + (rawSpd - 111) * 18);
    const rawConf = frame.conf || 97;
    const rawCov  = frame.cov  || 50;
    const rawRc   = frame.rc   || 0;

    // Latency: real hardware would be 2–5ms baseline, tiny thermal drift,
    // occasional micro-spike on heavy-spin shots (rpm > 3200)
    const spinLoad = Math.max(0, (rawRpm - 3000) / 800); // 0 at 3000, 1 at 3800
    const targetLat = 2.2 + spinLoad * 2.1;
    // Accuracy: tighter on clean bounces (z near 0), slightly wider mid-flight
    const inFlight = (frame.z || 0) > 0.15;
    const targetAcc = inFlight ? 4.2 + spinLoad * 1.4 : 3.2 + spinLoad * 0.8;

    // EMA updates
    ema.spd  = ema.spd  + EMA_SPD  * (rawSpd  - ema.spd);
    ema.rpm  = ema.rpm  + EMA_RPM  * (rawRpm  - ema.rpm);
    ema.conf = ema.conf + EMA_CONF * (rawConf  - ema.conf);
    ema.cov  = ema.cov  + EMA_COV  * (rawCov   - ema.cov);
    ema.lat  = ema.lat  + EMA_LAT  * (targetLat - ema.lat);
    ema.acc  = ema.acc  + EMA_ACC  * (targetAcc - ema.acc);

    // Update DOM — only write when element exists
    if (spEl)   spEl.textContent   = Math.round(ema.spd);
    if (rpEl)   rpEl.textContent   = Math.round(ema.rpm).toLocaleString();
    if (confEl) confEl.textContent = ema.conf.toFixed(1) + '%';
    if (latEl)  latEl.textContent  = ema.lat.toFixed(0) + 'ms';
    if (accEl)  accEl.textContent  = ema.acc.toFixed(1) + 'mm';
    if (covEl)  covEl.textContent  = ema.cov.toFixed(1) + '%';
    if (rcEl)   rcEl.textContent   = rawRc;

    // ── Bridge → Coach Control Dashboard ─────────────────────────────────
    // Drive the LIVE tab metrics from real AO2022 frame data
    // Physical  = speed index (how hard Nadal is hitting)
    // Mental    = court coverage (spatial awareness / positioning)
    // Emotional = confidence (system certainty — proxy for composure)
    // Focus     = composite of coverage + momentum
    const physPct  = Math.round(Math.min(99, Math.max(10, (ema.spd - 110) / (161 - 110) * 100)));
    const mentalPct= Math.round(Math.min(99, Math.max(10, ema.cov)));
    const emotPct  = Math.round(Math.min(99, Math.max(10, ema.conf)));
    const focPct   = Math.round(Math.min(99, Math.max(10, (ema.cov * 0.6 + (rawRc / 40) * 40))));
    const composure= Math.round(Math.min(99, Math.max(10, ema.conf - 5 + (frame.mom || 50) * 0.08)));

    // Update Performance State bars (LIVE tab)
    const setBar = (attr, pct) => {
      const fill  = document.querySelector('#cc-tab-live .cc-bar-fill[data-bar="' + attr + '"]');
      const label = document.querySelector('#cc-tab-live .cc-bar-label[data-bar="' + attr + '"]');
      if (fill)  fill.style.width  = pct + '%';
      if (label) label.textContent = pct + '%';
    };
    setBar('physical',  physPct);
    setBar('mental',    mentalPct);
    setBar('emotional', emotPct);
    setBar('focus',     focPct);

    // Update the 6 metric boxes
    const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    // ══ Microinteraction: flash live values on update ══
    // flashLive = teal pulse (match data), flashSys = sky pulse (system data)
    const flashLive = (id) => {
      const el = document.getElementById(id); if (!el) return;
      el.classList.remove('mp-val-flash');
      void el.offsetWidth; // reflow to re-trigger animation
      el.classList.add('mp-val-flash');
      setTimeout(() => el.classList.remove('mp-val-flash'), 380);
    };
    const flashSys = (id) => {
      const el = document.getElementById(id); if (!el) return;
      el.classList.remove('mp-sys-flash');
      void el.offsetWidth;
      el.classList.add('mp-sys-flash');
      setTimeout(() => el.classList.remove('mp-sys-flash'), 380);
    };
    // Flash key metric IDs on every frame
    flashLive('sb-n-pts'); flashLive('sb-m-pts');
    flashLive('gs-serve-speed'); flashLive('gs-spin');
    flashLive('ao22-mom-delta'); flashLive('ao22-depth');
    flashSys('lcs-latency'); flashSys('lcs-confidence');
    flashSys('tof-accuracy-display'); flashSys('sync-latency-display');
    setTxt('physical-score',      physPct);
    setTxt('mental-focus-display',mentalPct);
    setTxt('heat-index',          Math.round(frame.mom || 50));
    setTxt('composure-display',   composure);
    setTxt('sync-latency-display', Math.round(ema.lat));
    // UKF Fusion MPH — convert km/h to MPH
    const ukfMph = Math.round(ema.spd * 0.621371);
    setTxt('ukf-speed',           ukfMph);
    const ukfEl = document.querySelector('#cc-tab-live [id*="ukf"], #cc-tab-live .cc-metric-val span:first-child');
    // sync-latency already updated by ema.lat above via lcs-latency

    // Update Neural Adapt, 1st Serve, Break Pt Conv, Net Points
    const neuralAdapt  = Math.round(85 + (ema.conf - 76) * 0.6);
    const firstServe   = Math.round(65 + physPct * 0.08);
    const breakPtConv  = Math.round(60 + (frame.mom || 50) * 0.27);
    const netPoints    = '+' + Math.round(10 + mentalPct * 0.05) + '%';
    setTxt('neural-adapt-val',  neuralAdapt + '%');
    setTxt('first-serve-val',   firstServe  + '%');
    setTxt('break-pt-val',      breakPtConv + '%');
    setTxt('net-points-val',    netPoints);

    // ── Emotional Intelligence — sync all 6 metrics to Nadal match data ──
    // Confidence = conf field (AI certainty maps well to player confidence arc)
    const confVal   = Math.round(Math.min(99, Math.max(30, ema.conf)));
    // Focus = court coverage * 1.1 (spatial awareness / attention)
    const focusVal  = Math.round(Math.min(99, Math.max(30, ema.cov * 1.1)));
    // Resilience = inverted momentum dip recovery: rises after crisis (t>145)
    const momNorm   = Math.min(99, Math.max(10, frame.mom || 50));
    const resilienceVal = Math.round(Math.min(99, Math.max(30,
      40 + momNorm * 0.45 + (ema.conf - 70) * 0.3)));
    // Aggression = speed index + RPM factor (hitting hard = aggressive)
    const aggressionVal = Math.round(Math.min(99, Math.max(30,
      30 + (ema.spd - 110) / (161 - 110) * 45 + (ema.rpm - 2400) / (3500 - 2400) * 20)));
    // Stability = composure (smoothed conf + mom)
    const stabilityVal  = composure;
    // Recovery = rally count proxy (can sustain rallies = recovery capacity)
    const rcNorm = Math.min(99, Math.max(30, Math.round(40 + (frame.rc || 6) * 4.5)));
    const recoveryVal   = Math.round(Math.min(99, rcNorm));

    const setEI = (id, val, trend) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
      const tEl = document.getElementById(id.replace('-value','-trend').replace('-potential',''));
      // no trend elements needed
    };
    setEI('confidence-value',  confVal);
    setEI('focus-value',       focusVal);
    setEI('resilience-value',  resilienceVal);
    setEI('aggression-value',  aggressionVal);
    setEI('stability-value',   stabilityVal);
    const recEl = document.getElementById('recovery-potential');
    if (recEl) recEl.textContent = recoveryVal;

    // Composure bar + composite value
    const compBar = document.getElementById('composure-bar');
    if (compBar) compBar.style.width = composure + '%';
    const compTxt = document.getElementById('composite-composure');
    if (compTxt) compTxt.textContent = composure;

    // Stability bar
    const stabBar = document.getElementById('stability-bar');
    if (stabBar) stabBar.style.width = stabilityVal + '%';

    // Player names — drive from AO2022 match (Nadal vs Medvedev)
    ['player1-name'].forEach(id => {
      const el = document.getElementById(id);
      if (el && (el.textContent.includes('Serena') || el.textContent.includes('Player A') || el.textContent === '')) {
        el.textContent = '🇪🇸 Nadal';
      }
    });
    ['player2-name'].forEach(id => {
      const el = document.getElementById(id);
      if (el && (el.textContent.includes('Venus') || el.textContent.includes('Player B') || el.textContent === '')) {
        el.textContent = '🇷🇺 Medvedev';
      }
    });

    // ── Update Game Metrics panel ──
    updateGameStats(frame, ukfMph, rawRpm, rawCov, rawRc);

    // ── Coach Control scoreboard sync ────────────────────────────────────
    // set-display = sets won by Nadal (p1) | game-display = sets won by Medvedev (p2)
    // point-display = current game point (p1 score)
    const setsNadal   = (frame.sets || []).filter(s => s[0] > s[1]).length;
    const setsMedv    = (frame.sets || []).filter(s => s[1] > s[0]).length;
    setTxt('set-display',   setsNadal);
    setTxt('game-display',  setsMedv);
    setTxt('point-display', frame.p1 || '0');

    // ── Match Flow Analysis — live data ─────────────────────────────
    // Match Score: show completed set scores e.g. "2-6  6-7  6-4"
    const completedSets = (frame.sets || []).filter(s => (s[0] >= 6 || s[1] >= 6) && Math.abs(s[0]-s[1]) >= 1);
    const scoreStr = completedSets.length > 0
      ? completedSets.map(s => s[0] + '-' + s[1]).join('  ')
      : (frame.sets && frame.sets[0] ? frame.sets[0][0] + '-' + frame.sets[0][1] : '0-0');
    setTxt('mf-match-score', scoreStr);

    // Elapsed time from frame.t (seconds) → m:ss
    const elT = frame.t || 0;
    const elMin = Math.floor(elT / 60);
    const elSec = String(Math.floor(elT % 60)).padStart(2, '0');
    setTxt('mf-duration', elMin + ':' + elSec);

    // Running stats accumulated in gs object
    gs.mfAces       = (gs.mfAces       || 0);
    gs.mfWinners    = (gs.mfWinners    || 0);
    gs.mfUE         = (gs.mfUE         || 0);
    gs.mfBreaksPoss = (gs.mfBreaksPoss || 0);
    gs.mfBreaksWon  = (gs.mfBreaksWon  || 0);
    gs.mfNetPts     = (gs.mfNetPts     || 0);
    gs.mfNetTotal   = (gs.mfNetTotal   || 0);
    gs.mfPrevMom    = (gs.mfPrevMom    || frame.mom || 50);

    // Ace: very fast serve (spd > 145mph) + conf high
    if (ema.spd > 145 && ema.conf > 88 && Math.random() < 0.04) gs.mfAces++;
    // Winner: high speed + momentum spike
    if (ema.spd > 130 && frame.mom > 65 && Math.random() < 0.05) gs.mfWinners++;
    // UE: low conf + low momentum
    if (ema.conf < 78 && frame.mom < 30 && Math.random() < 0.03) gs.mfUE++;
    // Break points: momentum swings create BP opportunities
    if (Math.abs(frame.mom - gs.mfPrevMom) > 18 && Math.random() < 0.12) { gs.mfBreaksPoss++; if (frame.mom > gs.mfPrevMom) gs.mfBreaksWon++; }
    gs.mfPrevMom = frame.mom;
    // Net points: high coverage + low bounce (z near 0) = net approach
    gs.mfNetTotal++;
    if (ema.cov > 60 && (frame.z || 0) < 0.05) gs.mfNetPts++;

    const aceTotal = gs.mfAces;
    const serveTotal = Math.max(1, Math.floor(elT / 4)); // ~1 serve per 4s
    const acePct = Math.round((aceTotal / serveTotal) * 100);
    const netPct = Math.round((gs.mfNetPts / Math.max(1, gs.mfNetTotal)) * 100);
    setTxt('mf-break-points', gs.mfBreaksWon + '/' + gs.mfBreaksPoss);
    setTxt('mf-aces', aceTotal + '/' + serveTotal + ' (' + acePct + '%)');
    setTxt('mf-winners', gs.mfWinners + '/' + Math.max(1, gs.mfUE));
    setTxt('mf-net-pts', netPct + '%');

    // acc-compact and lat-compact in the LIVE MATCH panel bottom row
    const accMm = ema.acc.toFixed(1);
    const latMs = Math.round(ema.lat);
    setTxt('acc-compact', accMm);
    setTxt('lat-compact', latMs);

    // tof-accuracy-display (slightly varies with spin load — realistic drift)
    const tofAcc = (3.0 + spinLoad * 0.8).toFixed(1);
    setTxt('tof-accuracy-display', '\u00B1' + tofAcc + 'mm');

    // cam-health-display — stays 10/10 unless confidence drops low (signal quality)
    const camHealth = ema.conf >= 82 ? '10/10' : ema.conf >= 74 ? '9/10' : '8/10';
    setTxt('cam-health-display', camHealth);

    // ══ Coach Control microinteractions: flash cc-metric values ══
    // Live match metrics → cc-val-flash (teal pulse)
    const ccFlashLive = (id) => {
      const el = document.getElementById(id); if (!el) return;
      el.classList.remove('cc-val-flash');
      void el.offsetWidth;
      el.classList.add('cc-val-flash');
      setTimeout(() => el.classList.remove('cc-val-flash'), 380);
    };
    // System metrics → cc-sys-flash (sky pulse)
    const ccFlashSys = (id) => {
      const el = document.getElementById(id); if (!el) return;
      el.classList.remove('cc-sys-flash');
      void el.offsetWidth;
      el.classList.add('cc-sys-flash');
      setTimeout(() => el.classList.remove('cc-sys-flash'), 380);
    };
    ccFlashLive('physical-score'); ccFlashLive('mental-focus-display');
    ccFlashLive('heat-index');     ccFlashLive('composure-display');
    ccFlashSys('ukf-speed');       ccFlashSys('sync-latency-display');
    ccFlashSys('tof-accuracy-display'); ccFlashSys('cam-health-display');

    // Also update aegisDemo telemetry so data-telemetry bound elements stay in sync
    if (window.MatchPointEventBus) {
      window.MatchPointEventBus.emit('telemetry:updated', {
        ballSpeed:          ukfMph,
        emotionalComposure: emotPct,
        physicalEnergy:     physPct,
        mentalFocus:        mentalPct,
        heatMapIntensity:   Math.round(frame.mom || 50),
        latency:            Math.round(ema.lat),
        accuracy:           ema.acc.toFixed(1)
      });
    }
  }

  function updateGameStats(frame, serveMph, rawRpm, rawCov, rawRc) {
    const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

    // ─ Serve Speed + Max ─
    if (serveMph > gs.maxServeMph) gs.maxServeMph = serveMph;
    setTxt('gs-serve-speed', serveMph);
    setTxt('gs-serve-max', 'Max: ' + gs.maxServeMph + ' mph');

    // ─ Ball Spin + Type ─
    const spinDisp = Math.round(ema.rpm).toLocaleString();
    const spinType = ema.rpm > 3200 ? 'Topspin+' : ema.rpm > 2700 ? 'Topspin' : ema.rpm > 2200 ? 'Flat' : 'Slice';
    setTxt('gs-spin', spinDisp);
    setTxt('gs-spin-type', 'Type: ' + spinType);

    // ─ Shot Accuracy (last 10) ─
    // A "hit" = conf >= 85 (system confident the call was clean)
    const isHit = ema.conf >= 85;
    gs.last10.push(isHit ? 1 : 0);
    if (gs.last10.length > 10) gs.last10.shift();
    const hits = gs.last10.filter(v => v).length;
    const accPct = Math.round((hits / gs.last10.length) * 100);
    const last10Str = hits + '/' + gs.last10.length;
    setTxt('gs-accuracy', accPct);
    setTxt('gs-accuracy-sub', 'Last 10: ' + last10Str);

    // ─ Court Coverage + Distance ─
    const covPct = Math.round(ema.cov);
    // Accumulate distance: each frame ~0.2s, coverage delta → rough km
    const covDelta = Math.abs(ema.cov - gs.prevCovPct);
    gs.totalDistKm += covDelta * 0.0003;  // tuned to give realistic ~1-2 km over demo
    gs.prevCovPct = ema.cov;
    setTxt('gs-coverage', covPct);
    setTxt('gs-coverage-sub', 'Distance: ' + gs.totalDistKm.toFixed(1) + ' km');

    // ─ Reaction Time ─
    // Derived: faster ball = faster reaction required; oscillate around EMA latency
    gs.shotCount++;
    // Base: 0.55s at low speed (111 mph), 0.28s at high speed (161 mph)
    const baseReact = 0.55 - ((serveMph - 111) / (161 - 111)) * 0.27;
    // Add small per-frame noise via sin wave so it fluctuates naturally
    const noise = Math.sin(gs.shotCount * 0.31) * 0.03;
    const reactTime = Math.max(0.20, Math.min(0.75, baseReact + noise));
    if (reactTime < gs.bestReaction) gs.bestReaction = reactTime;
    setTxt('gs-reaction', reactTime.toFixed(2));
    setTxt('gs-reaction-sub', 'Best: ' + gs.bestReaction.toFixed(2) + 's');

    // ─ Momentum Δ ─
    // Rate of change in momentum — who's seizing control right now
    const rawMomDelta = (frame.mom || 50) - gs.prevMom;
    gs.prevMom = frame.mom || 50;
    gs.momDelta = gs.momDelta + 0.18 * (rawMomDelta - gs.momDelta); // EMA
    const momDeltaDisp = (gs.momDelta >= 0 ? '+' : '') + gs.momDelta.toFixed(1);
    const momTrend = gs.momDelta > 2.5 ? 'surging ▲' : gs.momDelta < -2.5 ? 'dropping ▼' : 'stable ■';
    const momDeltaColor = gs.momDelta > 2.5 ? '#22c55e' : gs.momDelta < -2.5 ? '#ef4444' : '#f97316';
    const momDeltaEl = document.getElementById('ao22-mom-delta');
    const momTrendEl = document.getElementById('ao22-mom-trend');
    if (momDeltaEl) { momDeltaEl.textContent = momDeltaDisp; momDeltaEl.style.color = momDeltaColor; }
    if (momTrendEl) { momTrendEl.textContent = momTrend; }

    // ─ Shot Depth ─
    // How deep the ball lands relative to the baseline (0=net, 100=baseline edge)
    // Only sample on bounces (isBounce handled outside — use z near 0 as proxy)
    if ((frame.z || 0) < 0.05) {
      // yn: 0=far baseline, 1=near baseline; depth = how close to either baseline
      const yn = (frame.y - 0.706) / (0.980 - 0.706);
      // Distance from nearest baseline: 0%=mid-court, 100%=right on the line
      const depthPct = Math.round(Math.max(0, Math.min(100,
        (yn < 0.5 ? yn * 2 : (1 - yn) * 2) * 100 // mirrors both halves
      )) * -1 + 100); // invert: 100=baseline, 0=service line
      gs.depthSum += depthPct;
      gs.depthCount++;
      const avgDepth = gs.depthCount > 0 ? Math.round(gs.depthSum / gs.depthCount) : depthPct;
      const depthEl = document.getElementById('ao22-depth');
      const depthSubEl = document.getElementById('ao22-depth-sub');
      const depthColor = avgDepth > 70 ? '#22c55e' : avgDepth > 45 ? '#38bdf8' : '#f97316';
      if (depthEl) { depthEl.textContent = avgDepth + '%'; depthEl.style.color = depthColor; }
      if (depthSubEl) { depthSubEl.textContent = depthPct + '% this shot'; }
    }

    // ─ Rally Stats ─
    // rawRc = running rally counter from frame data
    // Detect rally end: rc resets to 0 or drops significantly
    if (rawRc > 0 && rawRc < gs.prevRc) {
      // Rally just ended (rc reset)
      const finishedRally = gs.prevRc;
      gs.rallySum += finishedRally;
      gs.rallyCount++;
      if (finishedRally > gs.longestRally) gs.longestRally = finishedRally;
    }
    gs.prevRc = rawRc;
    const avgRally = gs.rallyCount > 0 ? (gs.rallySum / gs.rallyCount).toFixed(1) : rawRc > 0 ? rawRc : '0';
    const longestDisp = Math.max(gs.longestRally, rawRc);
    setTxt('gs-rally-avg', avgRally);
    setTxt('gs-rally-longest', 'Longest: ' + longestDisp + ' shots');
  }

  function updateActBanner(t) {
    let idx = 0;
    for (let i = ACTS.length-1; i >= 0; i--) { if (t >= ACTS[i].t) { idx=i; break; } }
    if (idx === lastActIdx) return;
    lastActIdx = idx;
    const act = ACTS[idx];
    const banner = document.getElementById('ao22-act-banner');
    const label = document.getElementById('ao22-act-label');
    const title = document.getElementById('ao22-act-title');
    if (label) { label.textContent = act.label; label.style.color = act.color; }
    if (title) title.textContent = act.title;
    if (banner) {
      banner.style.background = hexAlpha(act.color, 0.1);
      banner.style.borderColor = hexAlpha(act.color, 0.4);
      banner.style.transform = 'scale(1.02)';
      setTimeout(() => banner.style.transform = '', 350);
    }
  }

  let cueHistory = [];  // rolling list of last 3 coach cues

  function updateCoachCue(t) {
    let idx = 0;
    for (let i = COACH_CUES.length-1; i >= 0; i--) { if (t >= COACH_CUES[i].t) { idx=i; break; } }
    if (idx === lastCueIdx) return;
    lastCueIdx = idx;
    const list = document.getElementById('ao22-coach-cue-list');
    if (!list) return;

    // Add new cue to front of history
    cueHistory.unshift('"' + COACH_CUES[idx].cue + '"');
    if (cueHistory.length > 3) cueHistory.pop();

    // Render: newest is full brightness, older ones are dimmed
    list.style.opacity = '0';
    setTimeout(() => {
      list.innerHTML = cueHistory.map((cue, i) =>
        `<div class="mp-cue-item${i > 0 ? ' mp-cue-stale' : ''}">${cue}</div>`
      ).join('');
      list.style.opacity = '1';
    }, 200);
  }

  function updateComposureArc(t) {
    const pts = COMPOSURE_ARC.filter(p => p.t <= t);
    if (!pts.length) return;
    drawComposureChart(pts);
    const cur = pts[pts.length-1];
    const tierEl = document.getElementById('ao22-tier-badge');
    const valEl = document.getElementById('ao22-composure-val');
    const flagEl = document.getElementById('ao22-intervene-flag');
    if (tierEl) { tierEl.textContent = cur.tier; tierEl.style.color = cur.color; tierEl.style.background = hexAlpha(cur.color, 0.12); tierEl.style.borderColor = hexAlpha(cur.color, 0.3); }
    if (valEl) { valEl.textContent = cur.val; valEl.style.color = cur.color; }
    if (flagEl) flagEl.style.opacity = (t >= 145 && t <= 210) ? '1' : '0';
  }

  function updateProgress(t) {
    const fill = document.getElementById('ao22-progress-fill');
    const label = document.getElementById('ao22-time-label');
    if (fill) fill.style.width = Math.min(100, (t/MAX_T)*100) + '%';
    if (label) {
      const m = Math.floor(t/60), s = Math.floor(t%60);
      label.textContent = `${m}:${s.toString().padStart(2,'0')}`;
    }
  }

  function showFinale() {
    isRunning = false;
    _stopAllMatchAudio();
    const label = document.getElementById('ao22-act-label');
    const title = document.getElementById('ao22-act-title');
    const banner = document.getElementById('ao22-act-banner');
    if (label) { label.textContent = '🏆'; label.style.color = '#FFD700'; }
    if (title) title.textContent = 'Nadal — 21st Grand Slam · 2-6  6-7  6-4  7-5  6-4';
    if (banner) { banner.style.background = hexAlpha('#FFD700',0.12); banner.style.borderColor = hexAlpha('#FFD700',0.4); }
    const cue = document.getElementById('ao22-coach-cue');
    if (cue) cue.textContent = '"Rafael Nadal. 21. The greatest. MatchPoint was there for every step."';
  }

  // ── Helpers ───────────────────────────────────────────────
  function hexAlpha(hex, a) {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},${a})`;
  }

  // ── Public API ────────────────────────────────────────────
  window.AO2022MatchPanel = {
    build: buildPanel,
    start: startAnimation,
    stop: () => { isRunning = false; videoEl = null; if (animFrame) cancelAnimationFrame(animFrame); _stopAllMatchAudio(); },
    manualCall: (type) => {
      const confBase = ema.conf;
      const conf = type === 'IN' ? Math.min(99.9, confBase + 1.2) : Math.max(80, confBase - 3.5);
      logCall(type, conf, 'Manual');
    },
    triggerChallenge,
    // Video Sync API ─────────────────────────────────────────────────────────
    // Attach a <video> element so the panel tracks video.currentTime.
    // offset = video timestamp (seconds) where demo_t=0 begins.
    // Once GCP Video Intelligence data arrives, timestamps map 1:1.
    // Example: AO2022MatchPanel.syncToVideo(document.getElementById('match-video'), 2000)
    syncToVideo: (el, offset) => {
      videoEl = el;
      videoOffset = offset || 0;
      if (!isRunning) startAnimation({ video: el, offset: videoOffset });
      console.log('[AO2022] Video sync ON — offset=' + videoOffset + 's');
    },
    detachVideo: () => {
      videoEl = null;
      console.log('[AO2022] Video sync OFF — internal clock active');
    },
    // Seek panel to a specific demo timestamp (scrubbing / seek support)
    seekTo: (t) => { const frame = frameForTime(t); if (frame) updateFrame(frame); },
    frameForTime,
    getVideoOffset: () => videoOffset
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildPanel);
  } else {
    buildPanel();
  }

})();
