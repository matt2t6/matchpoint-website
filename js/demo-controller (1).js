// ===========================
// MatchPoint DemoController
// ===========================

import {
  setMomentumTheme,
  setMomentumLevel,
  pulseMoment,
  serveSpeedFlash
} from "./momentum-overlay.js";

import { MatchPointSyncEngine } from "./sync-engine.js";

const defaultMomentumTheme = {
  glow: "#4df5ff",
  ring: "rgba(77,245,255,0.65)"
};

const METRIC_CONFIG = Object.freeze({
  serve_speed: { id: "serve-speed", decimals: 0, className: "metric-serve" },
  spin_rate: { id: "spin-rate", decimals: 0, className: "metric-spin" },
  rally_length: { id: "rally-length", decimals: 0, className: "metric-rally" },
  shot_accuracy: { id: "shot-accuracy", decimals: 0, className: "metric-accuracy" },
  reaction_time: { id: "reaction-time", decimals: 2, className: "metric-reaction" },
  court_coverage: { id: "court-coverage", decimals: 0, className: "metric-coverage" }
});

const PHASE_PROFILES = Object.freeze({
  warmup:   { color: "#00f6ff", serve_speed: 95,  spin_rate: 2550, rally_length: 3, shot_accuracy: 76, reaction_time: 0.34, court_coverage: 68 },
  rally:    { color: "#00e0ff", serve_speed: 112, spin_rate: 3100, rally_length: 6, shot_accuracy: 82, reaction_time: 0.28, court_coverage: 74 },
  pressure: { color: "#ff8800", serve_speed: 130, spin_rate: 2950, rally_length: 4, shot_accuracy: 68, reaction_time: 0.24, court_coverage: 70 },
  reset:    { color: "#38bdf8", serve_speed: 118, spin_rate: 3000, rally_length: 5, shot_accuracy: 81, reaction_time: 0.27, court_coverage: 72 },
  extended: { color: "#ff0055", serve_speed: 125, spin_rate: 3350, rally_length: 9, shot_accuracy: 88, reaction_time: 0.26, court_coverage: 78 },
  closing:  { color: "#00ff99", serve_speed: 145, spin_rate: 3200, rally_length: 6, shot_accuracy: 72, reaction_time: 0.22, court_coverage: 81 },
  cooldown: { color: "#00ff99", serve_speed: 80,  spin_rate: 2400, rally_length: 1, shot_accuracy: 62, reaction_time: 0.36, court_coverage: 58 }
});

function buildDefaultSequence(profiles) {
  return [
    {
      id: "warmup",
      phase: "serve",
      duration: 10000,
      phaseLabel: "Serve Rhythm",
      summary: "Focus on a smooth toss for better serve rhythm.",
      audio: "serve",
      coachCue: "Find your rhythm early - clean toss, clean strike.",
      banner: "Warm-Up",
      bannerColor: profiles.warmup.color,
      metricsProfile: "warmup",
      scoreboardDelta: [0, 0],
      scoreScript: { a: "0", b: "0", leader: "tie" },
      momentumIntensity: 0.8,
      cueAudio: "cue_rhythm",
      narrationStyle: "calm"
    },
    {
      id: "opening-rally",
      phase: "rally",
      duration: 20000,
      phaseLabel: "Opening Rally",
      summary: "Stay low on your backhand - maximize court coverage.",
      audio: "rally_loop",
      rallyShots: 6,
      coachCue: "Own the baseline - stay patient and build pressure.",
      banner: "Rally",
      bannerColor: profiles.rally.color,
      metricsProfile: "rally",
      scoreboardDelta: [1, 0],
      scoreScript: { a: "15", b: "0", leader: "a" },
      momentumIntensity: 1.0,
      cueAudio: "cue_patience",
      narrationStyle: "hype"
    },
    {
      id: "pressure-point",
      phase: "point_end",
      duration: 5000,
      phaseLabel: "Pressure Point",
      summary: "Quick reaction time - that won the point.",
      audio: "applause",
      coachCue: "Lightning reactions - capitalize on the momentum.",
      banner: "Pressure Point",
      bannerColor: profiles.pressure.color,
      metricsProfile: "pressure",
      scoreboardDelta: [0, 1],
      scoreScript: { a: "15", b: "15", leader: "tie" },
      momentumIntensity: 1.2,
      cueAudio: "cue_firstserve",
      narrationStyle: "stern"
    },
    {
      id: "serve-reset",
      phase: "serve",
      duration: 10000,
      phaseLabel: "First Serve Reset",
      summary: "Add more racket head speed to pressure the returner.",
      audio: "serve",
      coachCue: "Big point - trust your first serve and follow it in.",
      banner: "Reset & Focus",
      bannerColor: profiles.reset.color,
      metricsProfile: "reset",
      scoreboardDelta: [1, 0],
      scoreScript: { a: "30", b: "15", leader: "a" },
      momentumIntensity: 0.9,
      cueAudio: "cue_firstserve",
      narrationStyle: "calm"
    },
    {
      id: "extended-rally",
      phase: "rally",
      duration: 20000,
      phaseLabel: "Extended Rally",
      summary: "Excellent spin control - holding 3200 RPM on forehand topspin.",
      audio: "rally_loop",
      rallyShots: 7,
      coachCue: "Keep the depth heavy - make them hit on the stretch.",
      banner: "Extended Rally",
      bannerColor: profiles.extended.color,
      metricsProfile: "extended",
      scoreboardDelta: [1, 0],
      scoreScript: { a: "40", b: "15", leader: "a" },
      momentumIntensity: 1.4,
      cueAudio: "cue_attack",
      narrationStyle: "hype"
    },
    {
      id: "closing-point",
      phase: "point_end",
      duration: 5000,
      phaseLabel: "Closing Pressure",
      summary: "Stay aggressive - your forehand sealed the point.",
      audio: "applause_big",
      coachCue: "Right there! Stay fearless and finish the job.",
      banner: "Closing Pressure",
      bannerColor: profiles.closing.color,
      metricsProfile: "closing",
      scoreboardDelta: [0, 1],
      scoreScript: { a: "40", b: "30", leader: "a" },
      momentumIntensity: 1.5,
      cueAudio: "cue_finish",
      narrationStyle: "hype"
    },
    {
      id: "momentum-equalizer",
      phase: "rally",
      duration: 18000,
      phaseLabel: "Momentum Swing",
      summary: "Opponent digs in - deuce rally incoming.",
      audio: "rally_loop",
      rallyShots: 6,
      coachCue: "Stay patient - absorb the pressure, wait for the short ball.",
      banner: "Deuce Rally",
      bannerColor: profiles.pressure.color,
      metricsProfile: "pressure",
      scoreboardDelta: [0, 1],
      scoreScript: { a: "40", b: "40", leader: "tie" },
      momentumIntensity: 1.1,
      cueAudio: "cue_patience",
      narrationStyle: "stern"
    },
    {
      id: "advantage-serve",
      phase: "serve",
      duration: 9000,
      phaseLabel: "Advantage Serve",
      summary: "Load up the wide slider - open the court.",
      audio: "serve",
      coachCue: "Big moment - paint the corner and close forward.",
      banner: "Advantage In",
      bannerColor: profiles.reset.color,
      metricsProfile: "reset",
      scoreboardDelta: [0, 0],
      scoreScript: { a: "AD", b: "40", leader: "a" },
      momentumIntensity: 1.25,
      cueAudio: "cue_firstserve",
      narrationStyle: "calm"
    },
    {
      id: "advantage-finish",
      phase: "point_end",
      duration: 6000,
      phaseLabel: "Advantage Point",
      summary: "Net rush seals the point - match point earned.",
      audio: "applause_big",
      coachCue: "Perfect finish - keep the foot on the gas.",
      banner: "Match Point Earned",
      bannerColor: profiles.closing.color,
      metricsProfile: "closing",
      scoreboardDelta: [1, 0],
      scoreScript: { a: "GAME", b: "40", leader: "a" },
      momentumIntensity: 1.6,
      cueAudio: "cue_finish",
      narrationStyle: "hype"
    },
    {
      id: "match-point",
      phase: "closing_rally",
      duration: 20000,
      phaseLabel: "Match Point",
      summary: "Strong finish - you're controlling momentum.",
      audio: "rally_loop",
      rallyShots: 8,
      finalSmash: true,
      coachCue: "Final push - empty the tank and own the court.",
      banner: "Game, Set, Match",
      bannerColor: profiles.closing.color,
      metricsTarget: { serve_speed: 142, spin_rate: 3300, rally_length: 7, shot_accuracy: 78, reaction_time: 0.23, court_coverage: 80 },
      scoreboardDelta: [0, 0],
      scoreScript: { a: "GAME", b: "40", leader: "a" },
      momentumIntensity: 1.8,
      cueAudio: "cue_finish",
      narrationStyle: "hype",
      finale: true
    }
  ];
}

class AudioManager {
  constructor() {
    this.sounds = {};
    this.context = null;
    this.scorePulse = null;

    this.register("serve", "assets/audio/serve_toss.mp3");
    this.register("forehand", "assets/audio/forehand.mp3");
    this.register("backhand", "assets/audio/backhand.mp3");
    this.register("smash", "assets/audio/smash.mp3");
    this.register("ball_hit", "assets/audio/ball_hit.mp3");
    this.register("rally_loop", "assets/audio/rally_loop.mp3", { loop: true });
    this.register("applause", "assets/audio/applause.mp3");
    this.register("applause_big", "assets/audio/applause_big.mp3");
    this.register("applause_outro", "assets/audio/applause_outro.mp3");

    this.register("cue_rhythm", "assets/audio/coach_s_celebrate_rhythm.mp3");
    this.register("cue_patience", "assets/audio/coach_s_cooldown_quiet.mp3");
    this.register("cue_firstserve", "assets/audio/coach_s_plateau_pressure.mp3");
    this.register("cue_attack", "assets/audio/coach_s_plateau_prove.mp3");
    this.register("cue_finish", "assets/audio/coach_s_unlock_tier2.mp3");

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      try {
        this.context = new AudioContext();
      } catch (err) {
        console.warn("[AudioManager] WebAudio unavailable:", err);
        this.context = null;
      }
    }
  }

  register(name, src, { loop = false } = {}) {
    try {
      const audio = new Audio(src);
      audio.preload = "auto";
      audio.loop = loop;
      this.sounds[name] = audio;
    } catch (err) {
      console.warn(`[AudioManager] Unable to prepare ${name}`, err);
    }
  }

  play(name) {
    const sound = this.sounds[name];
    if (!sound) return;
    try {
      sound.currentTime = 0;
      const result = sound.play();
      if (result && typeof result.catch === "function") {
        result.catch((err) => console.warn("[AudioManager] Play blocked:", err));
      }
    } catch (err) {
      console.warn("[AudioManager] Unable to play sound:", name, err);
    }
  }

  stop(name) {
    const sound = this.sounds[name];
    if (!sound) return;
    try {
      sound.pause();
      sound.currentTime = 0;
    } catch (err) {
      console.warn("[AudioManager] Unable to stop sound:", name, err);
    }
  }

  stopAll() {
    Object.keys(this.sounds).forEach((key) => this.stop(key));
  }

  async playMomentum(intensity = 1) {
    if (!this.context) return;
    try {
      if (this.context.state === "suspended") {
        await this.context.resume();
      }
      const ctx = this.context;
      const now = ctx.currentTime;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(65, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(Math.min(0.28, 0.11 * intensity + 0.06), now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.48);
      oscillator.connect(gain).connect(ctx.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.5);
    } catch (err) {
      console.warn("[AudioManager] Momentum pulse failed:", err);
    }
  }
}

class NarrationManager {
  constructor() {
    this.queue = [];
    this.isSpeaking = false;
    this.voice = null;
    this.voiceProfiles = {
      default: { rate: 1.0, pitch: 1.0, volume: 0.92 },
      calm: { rate: 0.94, pitch: 0.9, volume: 0.85 },
      hype: { rate: 1.12, pitch: 1.05, volume: 0.97 },
      stern: { rate: 1.02, pitch: 0.9, volume: 0.92 }
    };
    if ("speechSynthesis" in window) {
      this.initVoices();
    }
  }

  initVoices() {
    if (!("speechSynthesis" in window)) return;
    const assignVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices || !voices.length) return;
      this.voice = this.pickNaturalVoice(voices);
    };
    assignVoice();
    window.speechSynthesis.onvoiceschanged = assignVoice;
  }

  pickNaturalVoice(voices) {
    const preferred = voices.find((v) => /google|microsoft|allison|olivia|samantha|ava|neural/i.test(v.name));
    if (preferred) return preferred;
    const english = voices.find((v) => /en/i.test(v.lang));
    if (english) return english;
    return voices[0];
  }

  speak(text, style = "default") {
    if (!text) return;
    if (!("speechSynthesis" in window) || !window.SpeechSynthesisUtterance) {
      console.log("[Narration]", text);
      return;
    }
    const profile = this.voiceProfiles[style] || this.voiceProfiles.default;
    const utterance = new SpeechSynthesisUtterance(text);
    if (this.voice) {
      utterance.voice = this.voice;
    }
    utterance.rate = profile.rate;
    utterance.pitch = profile.pitch;
    utterance.volume = profile.volume;
    utterance.onstart = () => {
      this.isSpeaking = true;
    };
    utterance.onend = () => {
      this.isSpeaking = false;
      this.dequeue();
    };
    this.queue.push(utterance);
    if (!this.isSpeaking) {
      this.dequeue();
    }
  }

  dequeue() {
    if (!("speechSynthesis" in window)) {
      this.queue = [];
      this.isSpeaking = false;
      return;
    }
    if (this.queue.length === 0) {
      this.isSpeaking = false;
      return;
    }
    const next = this.queue.shift();
    if (!next) return;
    if (!this.voice) {
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length) {
        this.voice = this.pickNaturalVoice(voices);
        if (this.voice) next.voice = this.voice;
      }
    }
    if (this.voice) {
      next.voice = this.voice;
    }
    try {
      window.speechSynthesis.speak(next);
    } catch (err) {
      console.warn("[Narration] Unable to speak utterance:", err);
      this.isSpeaking = false;
      this.dequeue();
    }
  }

  stopAll() {
    if ("speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (err) {
        console.warn("[Narration] Unable to cancel speech synthesis:", err);
      }
    }
    this.queue = [];
    this.isSpeaking = false;
  }
}

class CoachCueManager {
  constructor(elementId = "cue-text-display") {
    this.elementId = elementId;
  }

  showCue(text) {
    const el = document.getElementById(this.elementId);
    if (!el) return;
    el.textContent = text;
    el.classList.remove("cue-flash");
    void el.offsetWidth;
    el.classList.add("cue-flash");
  }

  reset(defaultText = "Waiting for demo...") {
    const el = document.getElementById(this.elementId);
    if (!el) return;
    el.textContent = defaultText;
    el.classList.remove("cue-flash");
  }
}

export class DemoController {
  constructor(options = {}) {
    this.audio = new AudioManager();
    this.narrator = new NarrationManager();
    this.coach = new CoachCueManager(options.coachCueElementId);

    this.syncEngine = null;

    this.phaseProfiles = { ...PHASE_PROFILES };
    this.sequence = Array.isArray(options.sequence) ? options.sequence : buildDefaultSequence(this.phaseProfiles);

    this.metricDefaults = { serve_speed: 0, spin_rate: 0, rally_length: 0, shot_accuracy: 0, reaction_time: 0, court_coverage: 0 };
    this.metricTargets = { ...this.metricDefaults };
    this.currentPhaseTarget = { ...this.metricDefaults };
    this.metricElements = {};
    Object.entries(METRIC_CONFIG).forEach(([key, config]) => {
      const el = document.getElementById(config.id);
      this.metricElements[key] = { ...config, el };
    });

    this.matchScoreEl = document.getElementById("match-score");
    this.scoreEls = {
      board: document.getElementById("scoreboard"),
      a: document.getElementById("score-a"),
      b: document.getElementById("score-b")
    };
    this.phaseBanner = document.getElementById("phase-banner");
    this.courtOverlay = document.getElementById("court-overlay");
    this.serveOverlay = document.getElementById("serve-speed-overlay");

    this.score = { a: 0, b: 0 };
    this.idx = 0;
    this.timer = null;
    this.metricAnimationFrame = null;
    this.overlayTimer = null;
    this.phaseTimer = null;
    this.scorePulseTimer = null;
    this.serveOverlayFadeTimer = null;
    this.serveOverlayClearTimer = null;
    this.serveBurstTimer = null;
    this.rallyTimers = [];
    this.running = false;

    this.defaults = {
      phase: options.defaultPhase || "PAUSE",
      summary: options.defaultSummary || "Waiting for demo...",
      scoreText: "0-0"
    };

    this.setScoreboard(0, 0, false);
    this.setMetricsImmediate(this.metricDefaults);
    this.updateUI(this.defaults.phase, this.defaults.summary);
    setMomentumTheme(defaultMomentumTheme);
    setMomentumLevel(0.35);
  }

  initializeSyncEngine(config = {}) {
    this.syncEngine = new MatchPointSyncEngine({
      debug: config.debug || true,
      gracefulDegradation: true,
      audioVolume: 0.8,
      ...config
    });

    // Register systems
    this.syncEngine.systems.metrics = this; // Use this for metrics
    this.syncEngine.systems.audio = this.audio;
    this.syncEngine.systems.coaching = this.coach;
    this.syncEngine.systems.ui = this; // Use this for UI updates
    this.syncEngine.systems.demo = this;

    return this.syncEngine;
  }

  start() {
    if (this.running) return;
    this.reset();
    this.running = true;
    this.runStep();
  }

  stop() {
    this.running = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.clearRallyTimeouts();
    if (this.metricAnimationFrame) {
      cancelAnimationFrame(this.metricAnimationFrame);
      this.metricAnimationFrame = null;
    }
    if (this.phaseTimer) {
      clearTimeout(this.phaseTimer);
      this.phaseTimer = null;
    }
    if (this.overlayTimer) {
      clearTimeout(this.overlayTimer);
      this.overlayTimer = null;
    }
    if (this.scorePulseTimer) {
      clearTimeout(this.scorePulseTimer);
      this.scorePulseTimer = null;
    }

    if (this.phaseBanner) {
      this.phaseBanner.classList.remove("show");
    }
    if (this.courtOverlay) {
      this.courtOverlay.classList.remove("active");
      this.courtOverlay.style.opacity = "";
    }
    if (this.scoreEls.board) {
      this.scoreEls.board.classList.remove("momentum-active");
    }
    this.clearServeOverlay();

    this.audio.stopAll();
    this.narrator.stopAll();
  }

  reset() {
    this.stop();
    this.idx = 0;
    this.score = { a: 0, b: 0 };
    this.setScoreboard(0, 0, false);
    this.setMetricsImmediate(this.metricDefaults);
    this.metricTargets = { ...this.metricDefaults };
    this.currentPhaseTarget = { ...this.metricDefaults };
    this.coach.reset("Waiting for demo...");
    this.updateUI(this.defaults.phase, this.defaults.summary);
    setMomentumTheme(defaultMomentumTheme);
    setMomentumLevel(0.35);
  }

  runStep() {
    if (!this.running) return;
    if (this.idx >= this.sequence.length) {
      this.stop();
      return;
    }

    const step = this.sequence[this.idx];
    this.updateUI(step.phaseLabel || step.phase.toUpperCase(), step.summary || "");

    if (step.coachCue) {
      this.coach.showCue(step.coachCue);
    }

    if (step.banner) {
      this.showPhase(step.banner, step.bannerColor);
    }

    if (Array.isArray(step.scoreboardDelta)) {
      const [deltaA = 0, deltaB = 0] = step.scoreboardDelta;
      if (deltaA !== 0 || deltaB !== 0) {
        this.updateScoreboard(deltaA, deltaB);
      }
    }

    if (step.scoreScript) {
      this.setScoreScript(step.scoreScript);
    }

    if (step.metricsTarget || step.metricsProfile) {
      const target = step.metricsTarget || this.phaseProfiles[step.metricsProfile];
      if (target) {
        const duration = step.metricsDuration || Math.min(4500, step.duration);
        this.animateMetricsToTarget(target, duration);
      }
    }

    if (step.phase === "serve") {
      this.liveMetricUpdate("serve");
    } else if (step.phase === "point_end") {
      this.liveMetricUpdate("rally");
    } else if (step.phase === "rally") {
      this.liveMetricUpdate("rally");
    }

    if (step.momentumIntensity) {
      this.momentumBurst(step.momentumIntensity);
    }

    this.audio.stopAll();
    if (step.audio) {
      this.audio.play(step.audio);
    }
    if (step.cueAudio) {
      this.audio.play(step.cueAudio);
    }

    if (step.summary) {
      this.narrator.speak(step.summary, step.narrationStyle);
    }

    this.clearRallyTimeouts();
    if (step.rallyShots) {
      this.scheduleRallyShots(step);
    }

    if (step.finalSmash) {
      const smashTimer = setTimeout(() => this.audio.play("smash"), Math.max(0, step.duration - 900));
      const applauseTimer = setTimeout(() => this.audio.play("applause_outro"), Math.max(0, step.duration - 240));
      this.rallyTimers.push(smashTimer, applauseTimer);
    }

    this.idx += 1;
    this.timer = setTimeout(() => this.runStep(), step.duration);
  }

  scheduleRallyShots(step) {
    const interval = step.duration / step.rallyShots;
    for (let i = 0; i < step.rallyShots; i += 1) {
      const handle = setTimeout(() => {
        if (!this.running) return;
        const sound = i % 2 === 0 ? "forehand" : "backhand";
        this.audio.play(sound);
        this.audio.play("ball_hit");
        this.liveMetricUpdate("rally");
      }, i * interval);
      this.rallyTimers.push(handle);
    }
  }

  clearRallyTimeouts() {
    this.rallyTimers.forEach((id) => clearTimeout(id));
    this.rallyTimers = [];
  }

  updateUI(phase, summary) {
    const phaseEl = document.getElementById("match-phase");
    const summaryEl = document.getElementById("match-summary");
    if (phaseEl) phaseEl.textContent = phase;
    if (summaryEl) summaryEl.textContent = summary;
    this.updateMatchScoreText();
  }

  updateMatchScoreText(displayA, displayB) {
    if (!this.matchScoreEl) return;
    const aText = displayA ?? this.score.a;
    const bText = displayB ?? this.score.b;
    this.matchScoreEl.textContent = `A ${aText} \u2013 ${bText} B`;
  }

  setScoreboard(a, b, animate = true) {
    this.score.a = Math.max(0, a);
    this.score.b = Math.max(0, b);
    this.renderScoreboardDisplay(String(this.score.a), String(this.score.b), animate);
    this.updateMatchScoreText();
    this.applyLeader();
  }

  renderScoreboardDisplay(aValue, bValue, animate = true) {
    this.rollDigit(this.scoreEls.a, aValue, animate);
    this.rollDigit(this.scoreEls.b, bValue, animate);
  }

  setScoreScript(script) {
    if (!script) return;
    const displayA = script.a ?? this.score.a;
    const displayB = script.b ?? this.score.b;
    this.renderScoreboardDisplay(displayA, displayB, true);
    this.updateMatchScoreText(displayA, displayB);
    this.applyLeader(script.leader);
  }

  updateScoreboard(deltaA = 0, deltaB = 0) {
    const nextA = this.score.a + deltaA;
    const nextB = this.score.b + deltaB;
    this.setScoreboard(nextA, nextB, true);
    this.pulseScoreboard();
  }

  pulseScoreboard() {
    if (!this.scoreEls.board) return;
    this.scoreEls.board.classList.add("momentum-active");
    if (this.scorePulseTimer) clearTimeout(this.scorePulseTimer);
    this.scorePulseTimer = setTimeout(() => {
      this.scoreEls.board.classList.remove("momentum-active");
    }, 900);
  }

  rollDigit(el, value, animate) {
    if (!el) return;
    const newValue = value != null ? String(value) : "";
    const previousRaw = el.dataset.value ?? el.textContent ?? "";
    if (!animate) {
      el.textContent = newValue;
      el.dataset.value = newValue;
      el.classList.remove("roll");
      return;
    }
    if (previousRaw === newValue) return;
    const prevNumeric = this.isNumericValue(previousRaw);
    const newNumeric = this.isNumericValue(newValue);
    if (!prevNumeric || !newNumeric) {
      el.classList.remove("roll");
      el.textContent = newValue;
      el.dataset.value = newValue;
      return;
    }
    const previous = Number(previousRaw);
    const numericValue = Number(newValue);
    if (!animate) {
      el.textContent = newValue;
      el.dataset.value = newValue;
      el.classList.remove("roll");
      return;
    }
    if (previous === numericValue) return;
    const top = document.createElement("span");
    const bottom = document.createElement("span");
    top.textContent = String(previous);
    bottom.textContent = String(numericValue);
    el.innerHTML = "";
    el.appendChild(top);
    el.appendChild(bottom);
    el.classList.add("roll");
    setTimeout(() => {
      el.classList.remove("roll");
      el.textContent = String(numericValue);
      el.dataset.value = String(numericValue);
    }, 520);
  }

  isNumericValue(value) {
    if (value === null || value === undefined) return false;
    if (value === "") return false;
    return Number.isFinite(Number(value));
  }

  highlightLeader() {
    this.applyLeader();
  }

  applyLeader(preferredLeader) {
    if (!this.scoreEls.a || !this.scoreEls.b) return;
    this.scoreEls.a.classList.remove("lead");
    this.scoreEls.b.classList.remove("lead");

    if (preferredLeader === "a") {
      this.scoreEls.a.classList.add("lead");
      return;
    }
    if (preferredLeader === "b") {
      this.scoreEls.b.classList.add("lead");
      return;
    }
    if (preferredLeader === "tie") {
      return;
    }
    if (this.score.a > this.score.b) {
      this.scoreEls.a.classList.add("lead");
    } else if (this.score.b > this.score.a) {
      this.scoreEls.b.classList.add("lead");
    }
  }

  showPhase(label, color = "#00f6ff") {
    if (!this.phaseBanner) return;
    this.phaseBanner.textContent = label.toUpperCase();
    this.phaseBanner.style.color = color;
     setMomentumTheme({
      glow: color,
      ring: toRgba(color, 0.6)
    });
    this.phaseBanner.classList.add("show");
    if (this.phaseTimer) clearTimeout(this.phaseTimer);
    this.phaseTimer = setTimeout(() => {
      this.phaseBanner?.classList.remove("show");
    }, 3200);
    this.activateOverlay(0.3, 3200);
  }

  activateOverlay(opacity = 0.25, duration = 900) {
    if (!this.courtOverlay) return;
    this.courtOverlay.classList.add("active");
    this.courtOverlay.style.opacity = String(Math.min(0.6, opacity));
    if (this.overlayTimer) clearTimeout(this.overlayTimer);
    this.overlayTimer = setTimeout(() => {
      if (this.courtOverlay) {
        this.courtOverlay.classList.remove("active");
        this.courtOverlay.style.opacity = "";
      }
    }, duration);
  }

  momentumBurst(intensity = 1) {
    this.audio.playMomentum(intensity);
    this.pulseScoreboard();
    this.activateOverlay(0.2 + intensity * 0.12, 900);
    pulseMoment(Math.max(1, Math.min(3, Math.round(intensity))));
    setMomentumLevel(Math.min(1, 0.35 + intensity * 0.25));
  }

  animateMetricsToTarget(target, duration = 2500) {
    if (!target) return;
    if (this.metricAnimationFrame) {
      cancelAnimationFrame(this.metricAnimationFrame);
      this.metricAnimationFrame = null;
    }

    const startValues = {};
    const activeKeys = [];
    Object.entries(this.metricElements).forEach(([key, info]) => {
      if (!info.el || target[key] === undefined) return;
      const current = parseFloat(info.el.dataset.value ?? info.el.textContent) || 0;
      startValues[key] = current;
      this.markMetricPulse(info.el, info.className);
      activeKeys.push(key);
    });

    this.metricTargets = { ...this.metricTargets, ...target };
    this.currentPhaseTarget = { ...this.currentPhaseTarget, ...target };

    if (activeKeys.length === 0) return;

    const startTime = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 0.5 - Math.cos(progress * Math.PI) / 2;
      activeKeys.forEach((key) => {
        const info = this.metricElements[key];
        if (!info.el) return;
        const from = startValues[key];
        const to = target[key];
        const value = from + (to - from) * eased;
        this.setMetricText(info.el, value, info.decimals);
      });
      if (progress < 1) {
        this.metricAnimationFrame = requestAnimationFrame(tick);
      } else {
        this.metricAnimationFrame = null;
      }
    };

    this.metricAnimationFrame = requestAnimationFrame(tick);
  }

  markMetricPulse(el, className) {
    if (!el) return;
    el.classList.add("metric");
    if (className) {
      el.classList.add(className);
    }
    el.classList.remove("metric-pulse");
    void el.offsetWidth;
    el.classList.add("metric-pulse");
    setTimeout(() => el.classList.remove("metric-pulse"), 600);
  }

  setMetricText(el, value, decimals) {
    if (!el) return;
    const formatted = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();
    el.textContent = formatted;
    el.dataset.value = String(value);
  }

  setMetricsImmediate(values) {
    Object.entries(this.metricElements).forEach(([key, info]) => {
      if (!info.el) return;
      const value = values[key] !== undefined ? values[key] : 0;
      this.setMetricText(info.el, value, info.decimals);
      this.metricTargets[key] = value;
    });
    this.currentPhaseTarget = { ...this.currentPhaseTarget, ...values };
  }

  clearServeOverlay() {
    if (this.serveOverlayFadeTimer) {
      clearTimeout(this.serveOverlayFadeTimer);
      this.serveOverlayFadeTimer = null;
    }
    if (this.serveOverlayClearTimer) {
      clearTimeout(this.serveOverlayClearTimer);
      this.serveOverlayClearTimer = null;
    }
    if (this.serveOverlay) {
      this.serveOverlay.classList.remove("active", "fade-out");
      this.serveOverlay.textContent = "";
    }
    if (this.scoreEls.board) {
      this.scoreEls.board.classList.remove("serve-burst-active");
    }
  }

  flashServeSpeedOverlay(speed, label = "SERVE") {
    if (!this.serveOverlay) return;
    this.clearServeOverlay();
    const numericSpeed = Number.isFinite(speed) ? speed : 120;
    this.serveOverlay.textContent = `${Math.round(numericSpeed)} MPH ${label}`;
    this.serveOverlay.classList.remove("fade-out");
    void this.serveOverlay.offsetWidth;
    this.serveOverlay.classList.add("active");
    this.serveOverlayFadeTimer = setTimeout(() => {
      this.serveOverlay?.classList.add("fade-out");
    }, 900);
    this.serveOverlayClearTimer = setTimeout(() => {
      if (!this.serveOverlay) return;
      this.serveOverlay.classList.remove("active", "fade-out");
      this.serveOverlay.textContent = "";
      this.serveOverlayFadeTimer = null;
      this.serveOverlayClearTimer = null;
    }, 1600);
    if (this.scoreEls.board) {
      this.scoreEls.board.classList.add("serve-burst-active");
      if (this.serveBurstTimer) clearTimeout(this.serveBurstTimer);
      this.serveBurstTimer = setTimeout(() => {
        this.scoreEls.board?.classList.remove("serve-burst-active");
      }, 850);
    }
    serveSpeedFlash();
    pulseMoment(2, 110);
    setMomentumLevel(Math.min(1, 0.45 + Math.abs(numericSpeed) / 220));
  }

  liveMetricUpdate(context = "rally") {
    const defaults = {
      serve_speed: 110,
      spin_rate: 2950,
      rally_length: 5,
      shot_accuracy: 80,
      reaction_time: 0.28,
      court_coverage: 72
    };
    const base = { ...defaults, ...(this.currentPhaseTarget || {}) };

    if (context === "serve") {
      const serveInfo = this.metricElements.serve_speed;
      if (serveInfo?.el) {
        const current = parseFloat(serveInfo.el.dataset.value ?? serveInfo.el.textContent) || base.serve_speed;
        const target = base.serve_speed;
        const jitter = (Math.random() - 0.5) * 12;
        const next = this.clamp(this.blendTowards(current, target, 0.6) + jitter, target - 12, target + 14);
        this.setMetricText(serveInfo.el, next, serveInfo.decimals);
        this.markMetricPulse(serveInfo.el, serveInfo.className);
        this.metricTargets.serve_speed = next;
        this.flashServeSpeedOverlay(next, Math.random() > 0.82 ? "ACE!" : "SERVE");
      }
    }

    const spinInfo = this.metricElements.spin_rate;
    if (spinInfo?.el) {
      const current = parseFloat(spinInfo.el.dataset.value ?? spinInfo.el.textContent) || base.spin_rate;
      const target = base.spin_rate;
      const jitter = (Math.random() - 0.5) * 220;
      const next = this.clamp(this.blendTowards(current, target, 0.35) + jitter, target - 260, target + 260);
      this.setMetricText(spinInfo.el, next, spinInfo.decimals);
      this.markMetricPulse(spinInfo.el, spinInfo.className);
      this.metricTargets.spin_rate = next;
    }

    const accuracyInfo = this.metricElements.shot_accuracy;
    if (accuracyInfo?.el) {
      const current = parseFloat(accuracyInfo.el.dataset.value ?? accuracyInfo.el.textContent) || base.shot_accuracy;
      const target = base.shot_accuracy;
      const jitter = (Math.random() - 0.5) * 6;
      const next = this.clamp(this.blendTowards(current, target, 0.45) + jitter, Math.max(52, target - 15), Math.min(100, target + 10));
      this.setMetricText(accuracyInfo.el, next, accuracyInfo.decimals);
      this.markMetricPulse(accuracyInfo.el, accuracyInfo.className);
      this.metricTargets.shot_accuracy = next;
    }

    const reactionInfo = this.metricElements.reaction_time;
    if (reactionInfo?.el) {
      const current = parseFloat(reactionInfo.el.dataset.value ?? reactionInfo.el.textContent) || base.reaction_time;
      const target = base.reaction_time;
      const jitter = (Math.random() - 0.5) * 0.025;
      const next = this.clamp(this.blendTowards(current, target, 0.35) + jitter, 0.18, 0.45);
      this.setMetricText(reactionInfo.el, next, reactionInfo.decimals);
      this.markMetricPulse(reactionInfo.el, reactionInfo.className);
      this.metricTargets.reaction_time = next;
    }

    const rallyInfo = this.metricElements.rally_length;
    if (rallyInfo?.el) {
      const current = parseFloat(rallyInfo.el.dataset.value ?? rallyInfo.el.textContent) || base.rally_length;
      const target = base.rally_length + (context === "rally" && Math.random() > 0.55 ? 1 : 0);
      const next = this.clamp(this.blendTowards(current, target, 0.5), 2, 18);
      this.setMetricText(rallyInfo.el, next, rallyInfo.decimals);
      this.markMetricPulse(rallyInfo.el, rallyInfo.className);
      this.metricTargets.rally_length = next;
    }

    const coverageInfo = this.metricElements.court_coverage;
    if (coverageInfo?.el) {
      const current = parseFloat(coverageInfo.el.dataset.value ?? coverageInfo.el.textContent) || base.court_coverage;
      const target = base.court_coverage;
      const jitter = (Math.random() - 0.5) * 4;
      const next = this.clamp(this.blendTowards(current, target, 0.3) + jitter, 50, 100);
      this.setMetricText(coverageInfo.el, next, coverageInfo.decimals);
      this.markMetricPulse(coverageInfo.el, coverageInfo.className);
      this.metricTargets.court_coverage = next;
    }
    const rallyMomentum = Math.min(1, 0.25 + (this.metricTargets.rally_length || 4) / 16);
    setMomentumLevel(rallyMomentum);
  }

  // Synchronization Engine Integration Methods
  startSyncDemo() {
    if (!this.syncEngine) {
      console.error('Sync engine not initialized. Call initializeSyncEngine() first.');
      return;
    }

    // Pre-flight checks
    const health = this.syncEngine.verifySystemsReady();
    console.log('System health:', health);

    // Reset to initial state
    this.reset();

    // Start synchronized epic
    return this.syncEngine.playSynchronizedEpic();
  }

  pauseSyncDemo() {
    if (this.syncEngine) {
      this.syncEngine.pause();
    }
  }

  resumeSyncDemo() {
    if (this.syncEngine) {
      this.syncEngine.resume();
    }
  }

  stopSyncDemo() {
    if (this.syncEngine) {
      this.syncEngine.stop();
    }
    // Reset to initial state
    this.reset();
  }

  getSyncReport() {
    if (this.syncEngine) {
      return this.syncEngine.getExecutionReport();
    }
    return null;
  }

  blendTowards(current, target, factor) {
    return current + (target - current) * factor;
  }

  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }
}

function toRgba(hexOrColor, alpha = 0.6) {
  if (!hexOrColor) return `rgba(77,245,255,${alpha})`;
  const hex = hexOrColor.replace("#", "");
  if (hex.length === 6 || hex.length === 3) {
    const fullHex = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
    const bigint = parseInt(fullHex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return hexOrColor;
}

if (typeof window !== "undefined") {
  window.MatchPointDemoController = DemoController;
}
