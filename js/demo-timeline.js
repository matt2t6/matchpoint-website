/**
 * =====================================================
 * MatchPoint 5-Minute Demo Timeline Engine (OPTIMIZED)
 * =====================================================
 * 
 * Orchestrates the investor demo: simulates tennis match with
 * 4 narrative phases (warmup → pressure → crisis → recovery),
 * drives metrics, audio, coaching cues, and animations.
 * 
 * Key Features:
 * - Intelligent cue selection (zero-repeat tracking)
 * - Composure forecasting (30s predictive window)
 * - Phase-aware metric interpolation
 * - Audio lifecycle management (run-ID tracking)
 * - Widget state publishing (live dashboard sync)
 * 
 * @version 2.0.0 (Optimized)
 * @fires window#matchpoint:demo:start
 * @fires window#matchpoint:demo:end
 * @fires window#matchpoint:cue:played
 * @fires window#matchpoint:composure:update
 */

// ========================================
// IMPORTS
// ========================================
import { playSound, stopAllSounds, fadeVolume, stopSound, playCueAudio } from "./audioManager.js";
import { updateMetric, resetMetrics } from "./metricsEngine.js";
import { speakCue } from "./ttsClient.js";
import { updateScore, resetScore, setScoreState, getScore } from "./scoreboard.js";
import { setMomentumLevel, setMomentumTheme, pulseMoment, serveSpeedFlash } from "./momentum-overlay.js";
import { initCueSelector, selectCue, getCueStats } from "./cue-selector.js";


// ========================================
// CONSTANTS (Magic numbers extracted)
// ========================================
const DEMO_DURATION = 300_000;  // 5 minutes
const EVENT_START = "matchpoint:demo:start";
const EVENT_END = "matchpoint:demo:end";

const TIMING = {
  CUE_COOLDOWN_MS: 3500,        // Cooldown between coaching cues
  WIDGET_THROTTLE_MS: 600,      // Widget publish throttle
  RALLY_INTERVAL_MIN: 7000,     // Min time between rallies
  RALLY_INTERVAL_MAX: 11000,    // Max time between rallies
  HIT_INTERVAL_MIN: 700,        // Min time between ball hits
  HIT_INTERVAL_MAX: 940,        // Max time between ball hits
  COMPOSURE_DROP_MIN: 4,        // Min composure loss on error
  COMPOSURE_DROP_MAX: 7,        // Max composure loss on error
  CROWD_FADE_MS: 1200,          // Crowd volume transition time
  DEMO_TICKER_MS: 250,          // Main ticker interval (4 FPS)
  METRICS_UPDATE_MS: 1000       // Metrics update interval
};

// ========================================
// ADVANCED EMOTIONAL INTELLIGENCE ENGINE
// ========================================

// Quantum-inspired emotional state modeling
const EMOTIONAL_DIMENSIONS = {
  COMPOSURE: { weight: 0.3, decay: 0.95, recovery: 1.15 },
  CONFIDENCE: { weight: 0.25, decay: 0.92, recovery: 1.25 },
  FOCUS: { weight: 0.2, decay: 0.88, recovery: 1.35 },
  RESILIENCE: { weight: 0.15, decay: 0.90, recovery: 1.20 },
  AGGRESSION: { weight: 0.1, decay: 0.85, recovery: 1.40 }
};

// Fractal emotional patterns for natural fluctuation
const FRACTAL_NOISE = {
  octaves: 4,
  persistence: 0.5,
  scale: 0.1,
  amplitude: 2.0
};

// Neural network-inspired emotional adaptation
const EMOTIONAL_NEURAL_WEIGHTS = {
  composure_to_confidence: 0.15,
  confidence_to_focus: 0.20,
  focus_to_aggression: 0.12,
  resilience_to_all: 0.08,
  stress_feedback: -0.18
};

// Advanced interpolation curves
const ADVANCED_CURVES = {
  bezier: (t, p0, p1, p2, p3) => {
    const u = 1 - t;
    const uu = u * u;
    const uuu = uu * u;
    const tt = t * t;
    const ttt = tt * t;
    return uuu * p0 + 3 * uu * t * p1 + 3 * u * tt * p2 + ttt * p3;
  },

  elastic: (t, amplitude = 1, period = 0.3) => {
    const decay = Math.exp(-t / period);
    return amplitude * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / period) * decay + 1;
  },

  bounce: (t) => {
    if (t < 1/2.75) return 7.5625 * t * t;
    if (t < 2/2.75) return 7.5625 * (t -= 1.5/2.75) * t + 0.75;
    if (t < 2.5/2.75) return 7.5625 * (t -= 2.25/2.75) * t + 0.9375;
    return 7.5625 * (t -= 2.625/2.75) * t + 0.984375;
  },

  quantum: (t, uncertainty = 0.1) => {
    const base = t + Math.sin(t * Math.PI * 8) * uncertainty;
    return Math.max(0, Math.min(1, base));
  }
};

const METRIC_RANGES = {
  serveSpeed: [112, 138],
  spin: [2400, 3600]
};

const SOUNDS = {
  crowd: "crowd",
  hit: "/assets/audio/ball_hit.mp3",
  forehand: "/assets/audio/forehand.mp3",
  backhand: "/assets/audio/backhand.mp3",
  smash: "smash",
  cheer: "/assets/audio/applause_big.mp3",
  serve: "serve"
};


// ========================================
// WIDGET STATE
// ========================================
const WIDGET_BASELINE = {
  serveSpeed: 120,
  maxServe: 120,
  spinRate: 2600,
  spinType: "Topspin",
  accuracy: 88,
  recentHits: 9,
  coverage: 80,
  distance: 0.8,
  reactionTime: 0.3,
  bestReaction: 0.3,
  rallyCount: 0,
  totalShots: 0,
  avgRally: 0,
  longestRally: 0
};

const WIDGET_STATE = { ...WIDGET_BASELINE };
let lastWidgetDispatch = 0;
let lastPublishedState = null;  // For change detection


/**
 * Determines spin type from RPM value
 * @param {number} spin - Spin rate in RPM
 * @returns {string} Spin type classification
 */
function determineSpinType(spin) {
  const value = Number(spin) || 0;
  if (value >= 3300) return "Kick";
  if (value >= 3000) return "Topspin";
  if (value <= 2100) return "Slice";
  if (value <= 2400) return "Flat";
  return "Sidespin";
}


function resetWidgetState() {
  Object.assign(WIDGET_STATE, { ...WIDGET_BASELINE });
  lastWidgetDispatch = 0;
  lastPublishedState = null;
}


/**
 * Publishes widget state to dashboard (with throttling + change detection)
 * @param {boolean} force - Force publish even if throttled
 */
function publishWidgetSnapshot(force = false) {
  if (typeof window === "undefined") return;
  const now = Date.now();
  
  // Throttle check
  if (!force && now - lastWidgetDispatch < TIMING.WIDGET_THROTTLE_MS) return;
  
  // Change detection (avoid redundant events)
  const stateHash = JSON.stringify(WIDGET_STATE);
  if (!force && stateHash === lastPublishedState) return;
  
  lastWidgetDispatch = now;
  lastPublishedState = stateHash;

  const detail = {
    serveSpeed: sanitizeMetric(WIDGET_STATE.serveSpeed, 0, 200, 0),
    maxServe: sanitizeMetric(WIDGET_STATE.maxServe, 0, 200, 0),
    spinRate: sanitizeMetric(WIDGET_STATE.spinRate, 0, 5000, 0),
    spinType: WIDGET_STATE.spinType,
    accuracy: sanitizeMetric(WIDGET_STATE.accuracy, 0, 100, 0),
    recentHits: Math.max(0, Math.round(WIDGET_STATE.recentHits)),
    coverage: sanitizeMetric(WIDGET_STATE.coverage, 0, 100, 0),
    distance: sanitizeMetric(WIDGET_STATE.distance, 0, 50, 1),
    reactionTime: sanitizeMetric(WIDGET_STATE.reactionTime, 0, 5, 2),
    bestReaction: sanitizeMetric(WIDGET_STATE.bestReaction, 0, 5, 2),
    avgRally: WIDGET_STATE.rallyCount > 0 
      ? sanitizeMetric(WIDGET_STATE.avgRally, 0, 30, 1) 
      : 0,
    longestRally: Math.max(0, Math.round(WIDGET_STATE.longestRally))
  };

  window.dispatchEvent(new CustomEvent("mp:widgets", { detail }));
}


/**
 * Sanitizes metric values (prevents NaN, enforces bounds)
 * @param {any} value - Raw metric value
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @param {number} decimals - Decimal places
 * @returns {number} Sanitized value
 */
function sanitizeMetric(value, min, max, decimals) {
  const num = Number(value);
  if (!Number.isFinite(num)) return min;
  const clamped = Math.max(min, Math.min(max, num));
  return decimals > 0 ? Number(clamped.toFixed(decimals)) : Math.round(clamped);
}

function clampMetric(value, min, max) {
  if (typeof value !== "number") return min;
  return Math.max(min, Math.min(max, value));
}

function lerp(start, end, t) {
  return start + (end - start) * t;
}


// ========================================
// PHASE DEFINITIONS
// ========================================
const PHASES = [
  {
    name: "warmup",
    start: 0,
    end: 60_000,
    crowd: 0.25,
    theme: { glow: "#66ffc2", ring: "rgba(102,255,194,0.6)" },
    caption: "Confident start - baseline established"
  },
  {
    name: "pressure",
    start: 60_000,
    end: 180_000,
    crowd: 0.4,
    theme: { glow: "#4df5ff", ring: "rgba(77,245,255,0.6)" },
    caption: "Pressure builds - composure slipping"
  },
  {
    name: "crisis",
    start: 180_000,
    end: 240_000,
    crowd: 0.55,
    theme: { glow: "#ff9d7a", ring: "rgba(255,157,122,0.65)" },
    caption: "Critical moment - intervention required"
  },
  {
    name: "recovery",
    start: 240_000,
    end: 300_000,
    crowd: 0.65,
    theme: { glow: "#ff7aa2", ring: "rgba(255,122,162,0.6)" },
    caption: "Triumph surge - composure rebuilding fast"
  }
];


const PHASE_CUES = {
  warmup: [
    { kind: "audio", file: "/assets/audio/marcus/marcus_intro_welcome.mp3" }
  ],
  pressure: [
    { kind: "audio", file: "/assets/audio/marcus/marcus_focus_fundamentals.mp3" },
    { kind: "audio", file: "/assets/audio/marcus/marcus_pressure_incoming.mp3" }
  ],
  crisis: [
    { kind: "audio", file: "/assets/audio/marcus/marcus_mental_reset.mp3" }
  ],
  recovery: [
    { kind: "audio", file: "/assets/audio/marcus/marcus_momentum_shift.mp3" },
    { kind: "audio", file: "/assets/audio/marcus/marcus_match_point_excellence.mp3" },
    {
      kind: "audio",
      file: "/assets/audio/marcus/marcus_champion_finish.mp3"
    }
  ]
};


const PHASE_METRICS = {
  warmup: {
    duration: 60_000,
    serveSpeed: { start: 112, end: 118, curve: "linear" },
    spin: { start: 2500, end: 2700, curve: "linear" },
    composure: { start: 85, end: 90, curve: "linear" },
    accuracy: { start: 88, end: 92, curve: "linear" },
    coverage: { start: 78, end: 82, curve: "linear" },
    reaction: { start: 0.26, end: 0.22, curve: "ease-out" },
    recoveryVelocity: { start: 1.0, end: 1.15, curve: "linear" }
  },
  pressure: {
    duration: 120_000,
    serveSpeed: { start: 120, end: 130, curve: "exponential" },
    spin: { start: 2850, end: 3000, curve: "exponential" },
    composure: { start: 90, end: 62, curve: "exponential", phaseBaseline: 58, pressureFactor: 0.85 },
    accuracy: { start: 92, end: 72, curve: "ease-in" },
    coverage: { start: 82, end: 70, curve: "ease-in" },
    reaction: { start: 0.23, end: 0.32, curve: "ease-in" },
    recoveryVelocity: { start: 0.9, end: 0.6, curve: "linear" }
  },
  crisis: {
    duration: 60_000,
    serveSpeed: { start: 128, end: 118, curve: "ease-out" },
    spin: { start: 2900, end: 2750, curve: "linear" },
    composure: { start: 62, end: 55, curve: "floor", floor: 55 },
    accuracy: { start: 72, end: 69, curve: "ease-out" },
    coverage: { start: 70, end: 66, curve: "linear" },
    reaction: { start: 0.32, end: 0.34, curve: "linear" },
    recoveryVelocity: { start: 0.6, end: 0.5, curve: "linear" }
  },
  recovery: {
    duration: 60_000,
    serveSpeed: { start: 118, end: 136, curve: "steep" },
    spin: { start: 2750, end: 3300, curve: "steep" },
    composure: { start: 55, end: 88, curve: "steep" },
    accuracy: { start: 69, end: 91, curve: "steep" },
    coverage: { start: 66, end: 84, curve: "steep" },
    reaction: { start: 0.34, end: 0.24, curve: "steep" },
    recoveryVelocity: { start: 0.5, end: 2.3, curve: "steep" }
  }
};


const NARRATIVE_CUES = [
  {
    time: 75_000,
    phase: "pressure",
    audio: "/assets/audio/marcus/marcus_pressure_incoming.mp3",
    text: "Pressure is building. Anchor your feet and let the AI keep the court honest."
  },
  {
    time: 120_000,
    phase: "pressure",
    audio: "/assets/audio/marcus/marcus_focus_fundamentals.mp3",
    text: "Focus on the fundamentals: serve tempo, shot variety, composure telemetry."
  },
  {
    time: 165_000,
    phase: "pressure",
    audio: "/assets/audio/marcus/marcus_breathe_trust.mp3",
    text: "Breathe, trust the pattern—the system is tracking every micro-adjustment."
  },
  {
    time: 195_000,
    phase: "crisis",
    audio: "/assets/audio/marcus/marcus_mental_reset.mp3",
    text: "Mental reset engaged. Coaching intelligence is pivoting the cue strategy."
  },
  {
    time: 225_000,
    phase: "recovery",
    audio: "/assets/audio/marcus/marcus_momentum_shift.mp3",
    text: "Feel that shift—the recovery velocity just spiked above elite thresholds."
  },
  {
    time: 270_000,
    phase: "recovery",
    audio: "/assets/audio/marcus/marcus_match_point_excellence.mp3",
    text: "Match-point excellence on deck—analytics, officiating, and coaching in sync."
  },
  {
    time: 295_000,
    phase: "recovery",
    audio: "/assets/audio/marcus/marcus_champion_finish.mp3",
    text: "Champion finish—this is the investor-grade experience we scale from here."
  }
];


const IMPACT_BANNERS = [
  { time: 80_000, text: "MENTAL EDGE: Composure holding at 88 (+3 from baseline)", color: "green" },
  { time: 125_000, text: "REFOCUS ACTIVE: Shot accuracy stabilizing at 84%", color: "yellow" },
  { time: 170_000, text: "RALLY BATTLE: Composure holding despite heavy pressure", color: "yellow" },
  { time: 200_000, text: "TURNING POINT: Coach intervention engaged. Composure floor = 55", color: "red" },
  { time: 230_000, text: "RECOVERY SURGE: Composure +7 pts in 20 seconds. Velocity = 2.1x!", color: "green" },
  { time: 275_000, text: "ELITE STATE: Accuracy 89% (+20% from crisis). Mental fortress rebuilt.", color: "green" },
  { time: 300_000, text: "MATCH POINT: Composure +33 pts since intervention. Coaching impact = 92%", color: "cyan" }
];


const EMOTIONAL_CAPTIONS = {
  warmup: "Confident start - baseline established",
  pressure: "Pressure builds - opponent intensity rising",
  crisis: "Critical moment - coach intervention deployed",
  recovery: "Triumph secured - champion state restored"
};


// ========================================
// STATE VARIABLES
// ========================================
let demoTicker = null;           // Unified ticker (replaces demoTimer + metricsTimer)
let rallyTimer = null;
let activeHitTimer = null;
let startTime = 0;
let currentPhase = null;
let pointCounter = 0;
let isOurTurn = true;
let cueCooldown = false;
let currentRunId = 0;
let pendingAudioTimers = [];
let scheduledCueTimers = [];
let scheduledBannerTimers = [];
let lastRallyShots = 0;
let isDemoRunning = false;       // NEW: Prevent multiple simultaneous demos
let lastMetricsUpdate = 0;       // NEW: For unified ticker


const metricsState = {
  history: [],
  maxHistory: 360,
  current: {
    composure: 85,
    accuracy: 88,
    coverage: 78,
    reaction: 0.26,
    recoveryVelocity: 1.0,
    serveSpeed: 115,
    spin: 2550
  }
};

// ========================================
// ADVANCED EMOTIONAL STATE MACHINE
// ========================================

class EmotionalIntelligenceEngine {
  constructor() {
    this.emotionalDimensions = new Map();
    this.neuralWeights = { ...EMOTIONAL_NEURAL_WEIGHTS };
    this.fractalSeed = Math.random() * 1000;
    this.adaptationRate = 0.1;
    this.uncertaintyFactor = 0.05;

    // Initialize emotional dimensions
    Object.keys(EMOTIONAL_DIMENSIONS).forEach(dimension => {
      this.emotionalDimensions.set(dimension, {
        value: this.getInitialValue(dimension),
        velocity: 0,
        acceleration: 0,
        lastUpdate: Date.now(),
        history: []
      });
    });
  }

  getInitialValue(dimension) {
    const baseValues = {
      COMPOSURE: 85,
      CONFIDENCE: 78,
      FOCUS: 82,
      RESILIENCE: 75,
      AGGRESSION: 70
    };
    return baseValues[dimension] || 75;
  }

  // Fractal noise for natural emotional fluctuations
  fractalNoise(t, octaves = FRACTAL_NOISE.octaves) {
    let value = 0;
    let amplitude = FRACTAL_NOISE.amplitude;
    let frequency = FRACTAL_NOISE.scale;

    for (let i = 0; i < octaves; i++) {
      value += Math.sin(t * frequency + this.fractalSeed) * amplitude;
      amplitude *= FRACTAL_NOISE.persistence;
      frequency *= 2;
    }

    return value / (2 - Math.pow(FRACTAL_NOISE.persistence, octaves));
  }

  // Advanced interpolation with multiple curve types
  advancedInterpolate(config, progress, phaseContext = {}) {
    if (!config) return 0;

    const { start = 0, end = 0, curve = "linear", controlPoints = [] } = config;
    let eased = progress;

    switch (curve) {
      case "bezier":
        if (controlPoints.length >= 4) {
          return ADVANCED_CURVES.bezier(progress, start, controlPoints[0], controlPoints[1], end);
        }
        break;

      case "elastic":
        eased = ADVANCED_CURVES.elastic(progress);
        break;

      case "bounce":
        eased = ADVANCED_CURVES.bounce(progress);
        break;

      case "quantum":
        eased = ADVANCED_CURVES.quantum(progress, this.uncertaintyFactor);
        break;

      case "fractal":
        const fractalInfluence = this.fractalNoise(progress * 10);
        eased = progress + fractalInfluence * 0.1;
        break;

      case "neural":
        // Neural network inspired adaptation
        const neuralInput = this.calculateNeuralInput(phaseContext);
        eased = this.neuralActivation(progress + neuralInput);
        break;

      default:
        // Enhanced easing functions
        switch (curve) {
          case "exponential":
            eased = 1 - Math.pow(1 - progress, 2.5);
            break;
          case "ease-in":
            eased = Math.pow(progress, 1.8);
            break;
          case "ease-out":
            eased = 1 - Math.pow(1 - progress, 2.2);
            break;
          case "steep":
            eased = Math.pow(progress, 0.4);
            break;
          case "floor":
            eased = progress;
            break;
        }
    }

    // Apply phase-specific modifications
    let value = start + (end - start) * Math.max(0, Math.min(1, eased));

    // Add contextual modifications
    if (phaseContext.stressLevel) {
      value *= (1 - phaseContext.stressLevel * 0.1);
    }

    if (phaseContext.momentum) {
      value *= (1 + phaseContext.momentum * 0.05);
    }

    return Math.max(0, Math.min(100, value));
  }

  calculateNeuralInput(phaseContext) {
    let input = 0;

    // Inter-dimensional influences
    this.emotionalDimensions.forEach((state, dimension) => {
      const weight = EMOTIONAL_NEURAL_WEIGHTS[`${dimension.toLowerCase()}_influence`] || 0;
      input += state.value * weight;
    });

    // Phase context influences
    if (phaseContext.pressure) input -= phaseContext.pressure * 0.1;
    if (phaseContext.success) input += phaseContext.success * 0.15;

    return input;
  }

  neuralActivation(input) {
    // Sigmoid activation with adaptive steepness
    const steepness = 0.1 + (this.adaptationRate * 2);
    return 1 / (1 + Math.exp(-input * steepness));
  }

  // Update emotional dimensions with physics-based modeling
  updateEmotionalDimensions(phaseName, elapsed, phaseProgress) {
    const now = Date.now();
    const deltaTime = (now - this.lastUpdate) / 1000;
    this.lastUpdate = now;

    const phaseConfig = PHASE_METRICS[phaseName];
    if (!phaseConfig) return;

    this.emotionalDimensions.forEach((state, dimension) => {
      const config = phaseConfig[dimension.toLowerCase()];
      if (!config) return;

      // Calculate target value with advanced interpolation
      const phaseContext = this.buildPhaseContext(phaseName, elapsed);
      const targetValue = this.advancedInterpolate(config, phaseProgress, phaseContext);

      // Physics-based emotional dynamics
      const dimensionConfig = EMOTIONAL_DIMENSIONS[dimension];
      const error = targetValue - state.value;
      const force = error * dimensionConfig.weight;

      // Apply forces with damping
      state.acceleration = force - (state.velocity * 0.1);
      state.velocity += state.acceleration * deltaTime;
      state.velocity *= dimensionConfig.decay;

      // Update position
      state.value += state.velocity * deltaTime;

      // Apply natural fluctuations
      const fractalFluctuation = this.fractalNoise(elapsed * 0.001 + dimension.hashCode()) * 0.5;
      state.value += fractalFluctuation;

      // Neural network cross-influences
      this.applyNeuralInfluences(dimension, state);

      // Clamp and record
      state.value = Math.max(0, Math.min(100, state.value));
      state.history.push({
        time: elapsed,
        value: state.value,
        phase: phaseName,
        velocity: state.velocity
      });

      // Maintain history size
      if (state.history.length > 100) {
        state.history.shift();
      }
    });
  }

  buildPhaseContext(phaseName, elapsed) {
    const context = {
      phaseName,
      elapsed,
      timeOfDay: (elapsed / 1000) % 24,
      pressure: this.calculatePressureLevel(phaseName),
      momentum: this.calculateMomentum(),
      recentPerformance: this.calculateRecentPerformance()
    };

    return context;
  }

  calculatePressureLevel(phaseName) {
    const phasePressure = {
      warmup: 0.1,
      pressure: 0.7,
      crisis: 0.9,
      recovery: 0.3
    };
    return phasePressure[phaseName] || 0.5;
  }

  calculateMomentum() {
    // Calculate momentum based on recent emotional trends
    let totalMomentum = 0;
    this.emotionalDimensions.forEach((state) => {
      const recentTrend = state.velocity > 0 ? 1 : -1;
      totalMomentum += recentTrend * state.value * 0.01;
    });
    return Math.max(-1, Math.min(1, totalMomentum));
  }

  calculateRecentPerformance() {
    // Analyze recent performance trends
    const recentHistory = Array.from(this.emotionalDimensions.values())[0]?.history.slice(-10) || [];
    if (recentHistory.length < 2) return 0.5;

    const trend = recentHistory.reduce((acc, curr, index) => {
      if (index === 0) return 0;
      return acc + (curr.value - recentHistory[index - 1].value);
    }, 0);

    return Math.max(0, Math.min(1, 0.5 + trend * 0.1));
  }

  applyNeuralInfluences(dimension, state) {
    // Apply cross-dimensional neural influences
    this.emotionalDimensions.forEach((otherState, otherDimension) => {
      if (dimension === otherDimension) return;

      const influenceKey = `${dimension.toLowerCase()}_to_${otherDimension.toLowerCase()}`;
      const weight = this.neuralWeights[influenceKey] || 0;

      if (weight !== 0) {
        const influence = (otherState.value - 50) * weight * 0.01;
        state.value += influence;
      }
    });
  }

  // Get current emotional state
  getEmotionalState() {
    const state = {};
    this.emotionalDimensions.forEach((data, dimension) => {
      state[dimension.toLowerCase()] = {
        value: Math.round(data.value * 100) / 100,
        velocity: Math.round(data.velocity * 100) / 100,
        trend: data.velocity > 0.1 ? 'rising' : data.velocity < -0.1 ? 'falling' : 'stable'
      };
    });

    // Calculate composite metrics
    state.composite_composure = this.calculateCompositeComposure();
    state.emotional_stability = this.calculateEmotionalStability();
    state.recovery_potential = this.calculateRecoveryPotential();

    return state;
  }

  calculateCompositeComposure() {
    // Weighted average with neural network influences
    let total = 0;
    let weightSum = 0;

    this.emotionalDimensions.forEach((state, dimension) => {
      const weight = EMOTIONAL_DIMENSIONS[dimension]?.weight || 0.2;
      total += state.value * weight;
      weightSum += weight;
    });

    return total / Math.max(1, weightSum);
  }

  calculateEmotionalStability() {
    // Measure how stable the emotional state is
    const velocities = Array.from(this.emotionalDimensions.values())
      .map(state => Math.abs(state.velocity));

    const avgVelocity = velocities.reduce((a, b) => a + b, 0) / velocities.length;
    return Math.max(0, 1 - avgVelocity);
  }

  calculateRecoveryPotential() {
    // Calculate how quickly the system can recover
    const resilience = this.emotionalDimensions.get('RESILIENCE')?.value || 50;
    const confidence = this.emotionalDimensions.get('CONFIDENCE')?.value || 50;
    const composure = this.emotionalDimensions.get('COMPOSURE')?.value || 50;

    return (resilience * 0.4 + confidence * 0.3 + composure * 0.3) / 100;
  }

  // Apply external influence (from coaching cues, point outcomes, etc.)
  applyInfluence(influence) {
    const { type, magnitude = 1, dimensions = ['COMPOSURE', 'CONFIDENCE'] } = influence;

    dimensions.forEach(dimension => {
      const state = this.emotionalDimensions.get(dimension);
      if (!state) return;

      const config = EMOTIONAL_DIMENSIONS[dimension];
      let influenceValue = magnitude;

      // Apply type-specific modifications
      switch (type) {
        case 'encouragement':
          influenceValue *= config.recovery;
          break;
        case 'pressure':
          influenceValue *= -config.decay;
          break;
        case 'success':
          influenceValue *= config.recovery * 1.2;
          break;
        case 'failure':
          influenceValue *= -config.decay * 1.3;
          break;
      }

      state.velocity += influenceValue * 0.1;
    });
  }
}

// Global emotional intelligence engine instance
const emotionalEngine = new EmotionalIntelligenceEngine();


// ========================================
// CUE SELECTOR INITIALIZATION
// ========================================
// MOVED INSIDE startDemoTimeline() to avoid top-level async issues
let cueSelectorInitialized = false;
let cueSelectorFailed = false;


// ========================================
// AUDIO TIMER MANAGEMENT
// ========================================
function clearPendingAudioTimers() {
  for (const timer of pendingAudioTimers) {
    clearTimeout(timer);
  }
  pendingAudioTimers.length = 0;
}


function scheduleAudioTimer(runId, delay, callback) {
  const timer = setTimeout(() => {
    if (currentRunId !== runId) return;
    try {
      callback();
    } finally {
      const index = pendingAudioTimers.indexOf(timer);
      if (index >= 0) pendingAudioTimers.splice(index, 1);
    }
  }, delay);
  pendingAudioTimers.push(timer);
  return timer;
}


// ========================================
// DEMO LIFECYCLE
// ========================================

/**
 * Starts the 5-minute investor demo timeline
 * Orchestrates phases, metrics, audio, and coaching cues
 * @returns {void}
 * @fires window#matchpoint:demo:start
 */
export function startDemoTimeline() {
  // CRITICAL FIX #1: If demo is running, reset it first
  if (isDemoRunning) {
    console.log("[DemoTimeline] Demo already running. Resetting and restarting.");
    resetDemoTimeline();
    // Small delay to ensure clean reset
    setTimeout(() => {
      startDemoTimeline();
    }, 100);
    return;
  }
  isDemoRunning = true;

  currentRunId += 1;
  clearPendingAudioTimers();

  if (typeof window !== "undefined") {
    window.__mpDemoMode = true;
  }

  // Initialize cue selector (moved from module top-level)
  if (!cueSelectorInitialized && !cueSelectorFailed) {
    initCueSelector()
      .then(() => {
        cueSelectorInitialized = true;
        console.log("[DemoTimeline] Cue selector initialized");
      })
      .catch((err) => {
        cueSelectorFailed = true;
        console.warn("[DemoTimeline] Cue selector init failed, using fallback", err);
      });
  }

  resetWidgetState();
  publishWidgetSnapshot(true);

  resetMetrics();
  resetScore();
  setScoreState({ points: { us: 0, opp: 0 }, games: { us: 0, opp: 0 }, server: "us" });
  stopAllSounds();

  playSound(SOUNDS.crowd, { loop: true, volume: 0 });
  fadeVolume(SOUNDS.crowd, PHASES[0].crowd, 1600);
  setMomentumTheme(PHASES[0].theme);
  setMomentumLevel(0.35);

  startTime = Date.now();
  pointCounter = 0;
  isOurTurn = true;
  currentPhase = null;
  cueCooldown = false;  // CRITICAL FIX #2: Reset cooldown on start
  metricsState.history = [];
  lastMetricsUpdate = Date.now();
  if (typeof window !== "undefined") {
    window.interventionFired = false;
  }

  // OPTIMIZATION #1: Unified ticker (250ms instead of two 1s timers)
  demoTicker = setInterval(() => {
    const now = Date.now();
    const elapsed = now - startTime;

    // Phase check
    const phase = PHASES.find((p) => elapsed >= p.start && elapsed < p.end);
    if (phase && phase.name !== currentPhase) {
      currentPhase = phase.name;
      handlePhaseChange(phase);
    }

    // Update advanced emotional intelligence every 250ms
    updateAdvancedEmotionalState(elapsed, phase);

    // Update metrics every 1s
    if (now - lastMetricsUpdate >= TIMING.METRICS_UPDATE_MS) {
      updateLiveMetrics();
      updateDemoProgress(elapsed);  // NEW: Progress indicator
      lastMetricsUpdate = now;
    }

    // End check
    if (elapsed >= DEMO_DURATION) {
      endDemoTimeline();
    }
  }, TIMING.DEMO_TICKER_MS);

  scheduleNextRally();
  scheduleNarrativeEvents();
  window.dispatchEvent(new CustomEvent(EVENT_START));
  toggleScoreboardActive(true);
  updateDemoButtonStates('playing');
}


/**
 * Ends the demo and cleans up all timers/audio
 * @param {Object|string} options - Config object or legacy reason string
 * @param {boolean} [options.playCheer=true] - Play victory audio on end
 * @param {string} [options.reason] - End reason (for logging)
 * @fires window#matchpoint:demo:end
 */
export function endDemoTimeline(options = {}) {
  const config = typeof options === "string" ? { reason: options } : options || {};
  const { playCheer = true } = config;

  clearNarrativeSchedules();
  clearPendingAudioTimers();

  // OPTIMIZATION #2: Clear unified ticker
  if (demoTicker) {
    clearInterval(demoTicker);
    demoTicker = null;
  }
  if (rallyTimer) {
    clearTimeout(rallyTimer);
    rallyTimer = null;
  }
  if (activeHitTimer) {
    clearInterval(activeHitTimer);
    activeHitTimer = null;
  }

  const wasRunning = isDemoRunning;
  isDemoRunning = false;  // CRITICAL FIX #3: Reset running flag

  if (typeof window !== "undefined") {
    window.__mpDemoMode = false;
  }

  clearPendingAudioTimers();
  const runId = currentRunId;

  cueCooldown = false;  // CRITICAL FIX #4: Reset cooldown on end

  if (wasRunning) {
    // Enhanced fade-out sequence with crowd cheer
    console.log(`[DemoTimeline] Ending demo: ${config.reason || 'user_requested'}`);

    // Play immediate crowd cheer for satisfying stop experience
    playSound(SOUNDS.cheer, { volume: 0.8 });

    // Fade out crowd noise over 3 seconds
    fadeVolume(SOUNDS.crowd, 0, 3000);

    // Schedule complete cleanup after 8-10 seconds
    const cleanupDelay = playCheer ? 8000 : 3000;
    scheduleAudioTimer(runId, cleanupDelay, () => {
      if (!isDemoRunning) {
        console.log('[DemoTimeline] Complete cleanup - stopping all sounds');
        stopAllSounds();
        stopSound(SOUNDS.crowd);
        stopSound(SOUNDS.cheer);
        stopResidualClips();
      }
    });

    // Stop cheer sound after 6 seconds
    scheduleAudioTimer(runId, 6000, () => {
      if (!isDemoRunning) {
        stopSound(SOUNDS.cheer);
      }
    });

    // Visual feedback - update button states
    updateDemoButtonStates('stopped');
  } else {
    stopAllSounds();
  }

  stopResidualClips();
  window.dispatchEvent(new CustomEvent(EVENT_END, { detail: { reason: config.reason } }));
  toggleScoreboardActive(false);
  updateDemoButtonStates('ready');
}


/**
 * Resets demo to initial state
 * @fires window#matchpoint:demo:reset
 */
export function resetDemoTimeline() {
  endDemoTimeline({ reason: "reset", playCheer: false });
  resetMetrics();
  resetScore();
  setScoreState({ points: { us: 0, opp: 0 }, games: { us: 0, opp: 0 }, server: "us" });
  setMomentumTheme(PHASES[0].theme);
  setMomentumLevel(0.35);
  cueCooldown = false;
  currentPhase = null;
  stopSound(SOUNDS.crowd);
  stopSound(SOUNDS.cheer);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("matchpoint:demo:reset"));
  }
  metricsState.history = [];
  startTime = null;
  pointCounter = 0;
  lastRallyShots = 0;
  isOurTurn = true;
  toggleScoreboardActive(false);
  resetWidgetState();
  publishWidgetSnapshot(true);
}


// ========================================
// PHASE MANAGEMENT
// ========================================
function handlePhaseChange(phase) {
  fadeVolume(SOUNDS.crowd, phase.crowd, TIMING.CROWD_FADE_MS);
  setMomentumTheme(phase.theme);
  setMomentumLevel(0.4 + PHASES.indexOf(phase) * 0.1);
  playPhaseCue(phase.name);
  const caption = EMOTIONAL_CAPTIONS[phase.name] || phase.caption;
  dispatchEmotionalCaption(caption);
}


// ========================================
// RALLY SIMULATION
// ========================================
function scheduleNextRally() {
  if (rallyTimer) clearTimeout(rallyTimer);
  rallyTimer = setTimeout(() => {
    playPoint();
    scheduleNextRally();
  }, TIMING.RALLY_INTERVAL_MIN + Math.random() * (TIMING.RALLY_INTERVAL_MAX - TIMING.RALLY_INTERVAL_MIN));
}


function playPoint() {
  pointCounter += 1;
  // Phase-aware rally lengths for realistic tennis flow
  let baseLength, variance;
  switch (currentPhase) {
    case "warmup":
      baseLength = 4; variance = 3; // 4-6 shots (easier, shorter points)
      break;
    case "pressure":
      baseLength = 6; variance = 5; // 6-10 shots (longer rallies under pressure)
      break;
    case "crisis":
      baseLength = 8; variance = 5; // 8-12 shots (very long, intense rallies)
      break;
    case "recovery":
      baseLength = 5; variance = 4; // 5-8 shots (confident, controlled play)
      break;
    default:
      baseLength = 4; variance = 6; // fallback
  }
  const rallyLength = Math.floor(baseLength + Math.random() * variance);
  lastRallyShots = rallyLength;

  updateServeSpeed();
  playSound(SOUNDS.serve, { volume: 0.88 });
  serveSpeedFlash();
  pulseMoment(2);

  let hitIndex = 0;
  if (activeHitTimer) {
    clearInterval(activeHitTimer);
    activeHitTimer = null;
  }

  activeHitTimer = setInterval(() => {
    const isOurHit = isOurTurn || hitIndex % 2 === 0;
    const swingClip = isOurHit
      ? (hitIndex % 2 === 0 ? SOUNDS.forehand : SOUNDS.backhand)
      : SOUNDS.hit;
    playSound(swingClip, { volume: isOurHit ? 0.78 : 0.55 });
    if (isOurHit) pulseMoment(1, 90);
    if (isOurHit && Math.random() < 0.18) {
      playPhaseCue(currentPhase);
    }

    updateBallMetrics(isOurHit, hitIndex, rallyLength);

    hitIndex += 1;
    isOurTurn = !isOurTurn;

    if (hitIndex >= rallyLength) {
      clearInterval(activeHitTimer);
      activeHitTimer = null;
      completePoint(Math.random() > 0.55 ? "us" : "opponent");
    }
  }, TIMING.HIT_INTERVAL_MIN + Math.random() * (TIMING.HIT_INTERVAL_MAX - TIMING.HIT_INTERVAL_MIN));
}


function completePoint(winner) {
  if (winner === "us") {
    playSound(SOUNDS.smash, { volume: 0.6 });
    pulseMoment(3, 120);
    setMomentumLevel(Math.min(1, 0.66));
  } else {
    pulseMoment(1);
    setMomentumLevel(0.42);
    degradeComposureOnError();
  }
  updateScore(winner);

  const accuracy = Number(metricsState.current?.accuracy ?? WIDGET_STATE.accuracy);
  if (Number.isFinite(accuracy)) {
    WIDGET_STATE.accuracy = accuracy;
    WIDGET_STATE.recentHits = Math.max(0, Math.round((accuracy / 100) * 10));
  }

  const coverage = Number(metricsState.current?.coverage ?? WIDGET_STATE.coverage);
  if (Number.isFinite(coverage)) {
    WIDGET_STATE.coverage = coverage;
    WIDGET_STATE.distance = Math.max(
      0,
      Number((WIDGET_STATE.distance + Math.max(0.03, lastRallyShots * 0.015)).toFixed(2))
    );
  }

  const reaction = Number(metricsState.current?.reaction ?? WIDGET_STATE.reactionTime);
  if (Number.isFinite(reaction)) {
    WIDGET_STATE.reactionTime = reaction;
    WIDGET_STATE.bestReaction = Math.min(WIDGET_STATE.bestReaction, reaction);
  }

  WIDGET_STATE.rallyCount += 1;
  WIDGET_STATE.totalShots += lastRallyShots;
  if (WIDGET_STATE.rallyCount > 0) {
    // Use whole numbers for average rally length (realistic tennis stats)
    WIDGET_STATE.avgRally = Math.round(WIDGET_STATE.totalShots / WIDGET_STATE.rallyCount);
  }
  WIDGET_STATE.longestRally = Math.max(WIDGET_STATE.longestRally, lastRallyShots);

  publishWidgetSnapshot(true);
}


function updateServeSpeed() {
  const baseline = metricsState.current?.serveSpeed ?? rand(METRIC_RANGES.serveSpeed);
  const serveSpeed = Math.max(95, Math.min(155, baseline + (Math.random() - 0.5) * 4));
  updateMetric("serveSpeed", serveSpeed);
  metricsState.current.serveSpeed = serveSpeed;
  setMomentumLevel(Math.min(1, 0.4 + serveSpeed / 220));
  WIDGET_STATE.serveSpeed = serveSpeed;
  WIDGET_STATE.maxServe = Math.max(WIDGET_STATE.maxServe, serveSpeed);
}


function updateBallMetrics(isOurHit, hitIndex, rallyLength) {
  if (!isOurHit) return;
  const baselineSpin = metricsState.current?.spin ?? rand(METRIC_RANGES.spin);
  const spin = Math.max(2200, Math.min(3600, baselineSpin + (Math.random() - 0.5) * 120));
  updateMetric("spin", spin);
  metricsState.current.spin = spin;
  WIDGET_STATE.spinRate = spin;
  WIDGET_STATE.spinType = determineSpinType(spin);

  const phaseName = currentPhase || "warmup";
  const phaseConfig = PHASE_METRICS[phaseName] || PHASE_METRICS.warmup;
  const progress = rallyLength > 0 ? Math.min(1, hitIndex / rallyLength) : 0;
  const coverageTrend = (phaseConfig.coverage?.start ?? 70) + ((phaseConfig.coverage?.end ?? 80) - (phaseConfig.coverage?.start ?? 70)) * progress;
  const coverageNoise = (Math.random() - 0.5) * 1.5;
  const coverageValue = clampMetric(coverageTrend + coverageNoise, 65, 92);
  metricsState.current.coverage = lerp(metricsState.current.coverage ?? coverageValue, coverageValue, 0.35 + Math.random() * 0.2);
  WIDGET_STATE.coverage = metricsState.current.coverage;

  const distanceDelta = 0.02 + Math.random() * 0.015;
  metricsState.current.distance = +(Math.max(0, (metricsState.current.distance ?? 0) + distanceDelta).toFixed(2));
  WIDGET_STATE.distance = metricsState.current.distance;

  const reactionStart = phaseConfig.reaction?.start ?? 0.26;
  const reactionEnd = phaseConfig.reaction?.end ?? 0.32;
  const reactionBase = reactionStart + (reactionEnd - reactionStart) * progress;
  const reactionNoise = (Math.random() - 0.5) * 0.04;
  const reactionValue = clampMetric(reactionBase + reactionNoise, 0.2, 0.5);
  metricsState.current.reaction = reactionValue;
  WIDGET_STATE.reactionTime = reactionValue;
  WIDGET_STATE.bestReaction = Math.min(WIDGET_STATE.bestReaction, reactionValue);

  if (typeof metricsState.current.accuracy === "number") {
    const accuracyDrift = (Math.random() - 0.5) * 0.4;
    metricsState.current.accuracy = clampMetric(metricsState.current.accuracy + accuracyDrift * (1 - progress * 0.5), 65, 95);
    WIDGET_STATE.accuracy = metricsState.current.accuracy;
    WIDGET_STATE.recentHits = Math.max(0, Math.round((metricsState.current.accuracy / 100) * 10));
  }
}


function rand([min, max]) {
  return +(Math.random() * (max - min) + min).toFixed(2);
}


// ========================================
// CUE SELECTION & PLAYBACK
// ========================================

/**
 * Selects and plays a coaching cue based on current phase and composure
 * Falls back to hardcoded audio if intelligent selector fails
 * @param {string} phaseName - One of: warmup, pressure, crisis, recovery
 * @returns {Promise<void>}
 * @fires window#matchpoint:cue:played
 */
async function playPhaseCue(phaseName) {
  if (!phaseName || cueCooldown) return;
  cueCooldown = true;

  const releaseCooldown = () => {
    setTimeout(() => {
      cueCooldown = false;
    }, TIMING.CUE_COOLDOWN_MS);
  };

  // Try intelligent selector first
  if (!cueSelectorFailed) {
    try {
      const selection = await selectCue({
        category: mapPhaseToCategory(phaseName),
        phase: phaseName,
        composure: Number(metricsState.current?.composure)
      });

      if (selection) {
        const success = await playCueAudio(selection.path);
        if (success) {
          updateCuePanel(selection);
          boostComposureOnCue(phaseName);
          releaseCooldown();
          window.dispatchEvent(
            new CustomEvent("matchpoint:cue:played", {
              detail: { ...selection, phase: phaseName }
            })
          );
          return;
        }
      }
    } catch (error) {
      console.warn("[DemoTimeline] Cue selector fallback", error);
    }
  }

  // Fallback to hardcoded cues
  try {
    playFallbackCue(phaseName, releaseCooldown);
  } catch (fallbackError) {
    console.error("[DemoTimeline] All cue methods failed", fallbackError);
    // Last resort: TTS-only mode
    const emergencyText = `Phase ${phaseName}. Stay focused.`;
    speakCue(emergencyText).finally(releaseCooldown);
  }
}


function playFallbackCue(phaseName, releaseCooldown) {
  const cues = resolvePhaseCueList(phaseName);
  if (!cues.length) {
    releaseCooldown();
    return;
  }

  const cue = cues[Math.floor(Math.random() * cues.length)];

  if (typeof cue === "object" && cue) {
    if (cue.kind === "audio" && cue.file) {
      playSound(cue.file, { volume: 0.95 });
      updateCuePanel({ text: "", path: cue.file });
      boostComposureOnCue(phaseName);
      releaseCooldown();
      return;
    }
    if (cue.kind === "tts" && cue.text) {
      updateCuePanel({ text: cue.text });
      boostComposureOnCue(phaseName);
      Promise.resolve(speakCue(cue.text)).finally(releaseCooldown);
      return;
    }
  }

  if (typeof cue === "string" && cue.toLowerCase().endsWith(".mp3")) {
    playSound(cue, { volume: 0.95 });
    updateCuePanel({ text: "", path: cue });
    boostComposureOnCue(phaseName);
    releaseCooldown();
    return;
  }

  const line = typeof cue === "string" ? cue : String(cue);
  updateCuePanel({ text: line });
  boostComposureOnCue(phaseName);
  Promise.resolve(speakCue(line)).finally(releaseCooldown);
}


function resolvePhaseCueList(phaseName) {
  const custom = window.MATCHPOINT_DEMO_CUES?.[phaseName];
  if (Array.isArray(custom) && custom.length > 0) return custom;
  const cues = PHASE_CUES[phaseName];
  if (!Array.isArray(cues) || cues.length === 0) {
    console.warn("No cues for phase", phaseName);
    return [];
  }
  return cues;
}


function mapPhaseToCategory(phaseName) {
  switch ((phaseName || "").toLowerCase()) {
    case "warmup":
      return "tactical";
    case "pressure":
      return "pressure";
    case "crisis":
      return "reset";
    case "recovery":
      return "recovery";
    default:
      return "general";
  }
}


function updateCuePanel(selection) {
  if (!selection) return;
  const cueTextEl = document.getElementById("cue-text-display");
  if (cueTextEl) {
    const text = selection.text || selection.metadata?.cue_text || "Cue triggered";
    cueTextEl.textContent = text;
    cueTextEl.classList.add("cue-flash");
    setTimeout(() => cueTextEl.classList.remove("cue-flash"), 600);
  }

  const auditEl = document.getElementById("audit-score-display");
  if (auditEl) {
    if (typeof selection.auditScore === "number") {
      auditEl.textContent = selection.auditScore.toFixed(2);
    } else {
      const emotion = (selection.metadata?.emotion || "N/A").toString();
      auditEl.textContent = emotion.toUpperCase();
    }
  }

  const feedbackEl = document.getElementById("gemini-feedback");
  if (feedbackEl) {
    if (typeof selection.feedback === "string") {
      feedbackEl.textContent = selection.feedback;
    } else if (selection.metadata?.manual) {
      feedbackEl.textContent = "Cue passed all checks.";
    }
  }

  const badge = document.getElementById("cue-zero-repeats");
  if (!badge) return;

  const stats = getCueStats();
  if (!stats || !stats.total) {
    if (selection.metadata?.manual) {
      badge.textContent = "Manual cue triggered";
      badge.classList.remove("hidden", "text-amber-300");
      badge.classList.add("text-emerald-300");
    } else {
      badge.classList.add("hidden");
    }
    return;
  }

  if (stats.unique === stats.total) {
    badge.textContent = `Zero repeats streak: ${stats.total}`;
    badge.classList.remove("hidden", "text-amber-300");
    badge.classList.add("text-emerald-300");
  } else {
    badge.textContent = `Unique cues: ${stats.unique}/${stats.total}`;
    badge.classList.remove("hidden", "text-emerald-300");
    badge.classList.add("text-amber-300");
  }
}


// ========================================
// EVENT LISTENERS (Prevent duplicate attachment)
// ========================================
if (typeof window !== "undefined" && !window.__mpTimelineListenersAttached) {
  window.__mpTimelineListenersAttached = true;  // CRITICAL FIX #5: Prevent memory leak
  window.__matchpointUpdateCuePanel = updateCuePanel;

  window.addEventListener("matchpoint:manualCue", (event) => {
    const detail = event.detail || {};
    updateCuePanel({
      text: detail.text,
      path: detail.path,
      auditScore: typeof detail.auditScore === "number" ? detail.auditScore : undefined,
      feedback: detail.feedback,
      metadata: {
        emotion: (detail.category || "manual").toUpperCase(),
        category: detail.category,
        manual: true
      }
    });
  });
}


// ========================================
// COMPOSURE MANAGEMENT
// ========================================
function boostComposureOnCue(phaseName) {
  if (!isDemoRunning) return;
  if (typeof startTime !== "number") return;

  const boostAmount = resolveCueBoost(phaseName);
  const current = Number(metricsState.current?.composure ?? 72);
  const boosted = clampValue(current + boostAmount, 0, 100);
  metricsState.current = {
    ...metricsState.current,
    composure: boosted
  };

  const elapsed = Date.now() - startTime;
  recordMetricHistory(elapsed, phaseName, { ...metricsState.current });
  updateComposureDisplay(computeTripleStateForecast());
}


function degradeComposureOnError() {
  if (!isDemoRunning) return;
  if (typeof startTime !== "number") return;

  const current = Number(metricsState.current?.composure ?? 72);
  const drop = TIMING.COMPOSURE_DROP_MIN + Math.random() * (TIMING.COMPOSURE_DROP_MAX - TIMING.COMPOSURE_DROP_MIN);
  const reduced = clampValue(current - drop, 0, 100);
  metricsState.current = {
    ...metricsState.current,
    composure: reduced
  };
  const elapsed = Date.now() - startTime;
  const activePhase = currentPhase || "pressure";
  recordMetricHistory(elapsed, activePhase, { ...metricsState.current });
  updateComposureDisplay(computeTripleStateForecast());
}


function resolveCueBoost(phaseName) {
  switch ((phaseName || "").toLowerCase()) {
    case "crisis":
      return 7;
    case "recovery":
      return 9;
    case "pressure":
      return 5;
    default:
      return 3.5;
  }
}


function clampValue(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}


// ========================================
// UI HELPERS
// ========================================
function toggleScoreboardActive(isActive) {
  const sb = document.getElementById("scoreboard");
  const phaseEl = document.getElementById("match-phase");
  const summaryEl = document.getElementById("match-summary");

  if (sb) {
    sb.classList.toggle("is-active", isActive);
    sb.classList.toggle("is-inactive", !isActive);
  }

  if (phaseEl) {
    phaseEl.textContent = isActive ? "LIVE" : "PAUSE";
  }

  if (summaryEl) {
    if (!summaryEl.dataset.defaultText) {
      summaryEl.dataset.defaultText = summaryEl.textContent || "Waiting for demo...";
    }
    summaryEl.textContent = isActive
      ? "MatchPoint Demo in progress"
      : summaryEl.dataset.defaultText || "Waiting for demo...";
  }
}


function stopResidualClips() {
  stopSound(SOUNDS.hit);
  stopSound(SOUNDS.forehand);
  stopSound(SOUNDS.backhand);
  stopSound(SOUNDS.smash);
}


// ========================================
// ADVANCED EMOTIONAL STATE UPDATE
// ========================================
function updateAdvancedEmotionalState(elapsed, phase) {
  if (!isDemoRunning || !phase) return;

  const phaseConfig = PHASE_METRICS[phase.name];
  const phaseElapsed = Math.max(0, elapsed - phase.start);
  const progress = Math.min(1, phaseElapsed / Math.max(1, phaseConfig?.duration ?? 1));

  // Update advanced emotional dimensions
  emotionalEngine.updateEmotionalDimensions(phase.name, elapsed, progress);

  // Get current emotional state
  const emotionalState = emotionalEngine.getEmotionalState();

  // Update legacy metrics with advanced emotional data
  updateMetricsWithEmotionalIntelligence(emotionalState, phase, progress);
}

// ========================================
// ENHANCED METRICS ENGINE
// ========================================
function updateMetricsWithEmotionalIntelligence(emotionalState, phase, progress) {
  if (!isDemoRunning) return;

  const phaseConfig = PHASE_METRICS[phase.name];
  const now = Date.now();
  const elapsed = now - startTime;

  // Get advanced emotional values
  const composure = emotionalState.composite_composure || 75;
  const confidence = emotionalState.confidence?.value || 75;
  const focus = emotionalState.focus?.value || 75;
  const resilience = emotionalState.resilience?.value || 75;
  const aggression = emotionalState.aggression?.value || 75;

  // Advanced metric calculation with emotional influence
  const projected = {
    serveSpeed: calculateAdvancedMetric(phaseConfig?.serveSpeed, progress, {
      confidence: confidence / 100,
      aggression: aggression / 100,
      baseMultiplier: 1.0
    }),

    spin: calculateAdvancedMetric(phaseConfig?.spin, progress, {
      focus: focus / 100,
      confidence: confidence / 100,
      aggression: aggression / 100
    }),

    composure: composure,

    accuracy: calculateAdvancedMetric(phaseConfig?.accuracy, progress, {
      composure: composure / 100,
      focus: focus / 100,
      confidence: confidence / 100
    }),

    coverage: calculateAdvancedMetric(phaseConfig?.coverage, progress, {
      composure: composure / 100,
      resilience: resilience / 100,
      focus: focus / 100
    }),

    reaction: calculateAdvancedMetric(phaseConfig?.reaction, progress, {
      focus: focus / 100,
      composure: composure / 100,
      inverse: true // Lower is better for reaction time
    }),

    recoveryVelocity: emotionalState.recovery_potential || 1.0
  };

  // Apply emotional state machine influences
  applyEmotionalInfluences(projected, emotionalState);

  // Update global state
  metricsState.current = {
    ...metricsState.current,
    ...projected
  };

  // Update widget state with enhanced calculations
  updateWidgetStateWithEmotionalData(projected, emotionalState);

  // Record comprehensive history
  recordAdvancedMetricHistory(elapsed, phase.name, projected, emotionalState);

  // Update UI with advanced emotional data
  updateAdvancedUI(emotionalState, projected);

  // Publish to dashboard
  publishWidgetSnapshot();
}

// Advanced metric calculation with emotional factors
function calculateAdvancedMetric(config, progress, emotionalFactors) {
  if (!config) return 0;

  // Base interpolation
  let value = emotionalEngine.advancedInterpolate(config, progress);

  // Apply emotional influences
  if (emotionalFactors.confidence !== undefined) {
    value *= (0.8 + emotionalFactors.confidence * 0.4); // ±20% range
  }

  if (emotionalFactors.focus !== undefined) {
    value *= (0.85 + emotionalFactors.focus * 0.3); // ±15% range
  }

  if (emotionalFactors.aggression !== undefined) {
    value *= (0.9 + emotionalFactors.aggression * 0.2); // ±10% range
  }

  if (emotionalFactors.composure !== undefined) {
    value *= (0.75 + emotionalFactors.composure * 0.5); // ±25% range
  }

  if (emotionalFactors.inverse) {
    // For reaction time (lower is better)
    value = 1 / (0.5 + value * 0.5);
  }

  return Math.max(0, Math.min(200, value));
}

// Apply complex emotional influences between metrics
function applyEmotionalInfluences(projected, emotionalState) {
  const { confidence, focus, resilience } = emotionalState;

  // Confidence affects serve speed and accuracy
  if (confidence?.value > 80) {
    projected.serveSpeed *= 1.1; // 10% boost
    projected.accuracy *= 1.05;  // 5% boost
  } else if (confidence?.value < 60) {
    projected.serveSpeed *= 0.9; // 10% reduction
    projected.accuracy *= 0.95;  // 5% reduction
  }

  // Focus affects reaction time and spin control
  if (focus?.value > 85) {
    projected.reaction *= 0.9; // 10% improvement
    projected.spin *= 1.08;   // 8% boost
  }

  // Resilience affects recovery from errors
  if (resilience?.value > 75) {
    projected.recoveryVelocity *= 1.3; // 30% faster recovery
  }
}

// Enhanced widget state updates
function updateWidgetStateWithEmotionalData(projected, emotionalState) {
  // Update accuracy with emotional factors
  if (typeof projected.accuracy === "number") {
    WIDGET_STATE.accuracy = projected.accuracy;
    WIDGET_STATE.recentHits = Math.max(0, Math.round((projected.accuracy / 100) * 10));
  }

  // Update coverage with resilience factors
  if (typeof projected.coverage === "number") {
    WIDGET_STATE.coverage = projected.coverage;
  }

  // Update reaction time with focus factors
  if (typeof projected.reaction === "number") {
    WIDGET_STATE.reactionTime = projected.reaction;
    WIDGET_STATE.bestReaction = Math.min(WIDGET_STATE.bestReaction, projected.reaction);
  }

  // Update spin with aggression factors
  if (typeof projected.spin === "number") {
    WIDGET_STATE.spinRate = projected.spin;
    WIDGET_STATE.spinType = determineSpinType(projected.spin);
  }

  // Update serve speed with confidence factors
  if (typeof projected.serveSpeed === "number") {
    WIDGET_STATE.serveSpeed = projected.serveSpeed;
    WIDGET_STATE.maxServe = Math.max(WIDGET_STATE.maxServe, projected.serveSpeed);
  }
}

// Enhanced metric history recording
function recordAdvancedMetricHistory(elapsed, phaseName, metrics, emotionalState) {
  const historyEntry = {
    t: elapsed,
    phase: phaseName,
    timestamp: Date.now(),
    metrics: { ...metrics },
    emotional: {
      composite_composure: emotionalState.composite_composure,
      emotional_stability: emotionalState.emotional_stability,
      recovery_potential: emotionalState.recovery_potential,
      dimensions: {}
    }
  };

  // Record individual emotional dimensions
  Object.keys(EMOTIONAL_DIMENSIONS).forEach(dimension => {
    const dimData = emotionalEngine.emotionalDimensions.get(dimension);
    if (dimData) {
      historyEntry.emotional.dimensions[dimension.toLowerCase()] = {
        value: dimData.value,
        velocity: dimData.velocity,
        trend: dimData.velocity > 0.1 ? 'rising' : dimData.velocity < -0.1 ? 'falling' : 'stable'
      };
    }
  });

  metricsState.history.push(historyEntry);

  if (metricsState.history.length > metricsState.maxHistory) {
    metricsState.history.splice(0, metricsState.history.length - metricsState.maxHistory);
  }
}

// Advanced UI updates with emotional intelligence
function updateAdvancedUI(emotionalState, metrics) {
  // Update composure display with advanced forecasting
  const advancedTriple = {
    past: emotionalState.composite_composure * 0.9,
    present: emotionalState.composite_composure,
    predicted: emotionalState.composite_composure * (1 + emotionalState.recovery_potential * 0.1)
  };

  updateComposureDisplay(advancedTriple);
  updateRecoveryVelocity(metrics.recoveryVelocity);

  // Dispatch advanced emotional sample
  dispatchAdvancedEmotionalSample(Date.now() - startTime, currentPhase, emotionalState, metrics);

  // Update momentum with emotional factors
  const emotionalMomentum = calculateEmotionalMomentum(emotionalState);
  setMomentumLevel(Math.min(1, 0.35 + emotionalMomentum));

  // Publish advanced widget state
  publishAdvancedWidgetSnapshot(metrics, emotionalState);
}

// Calculate emotional momentum for momentum ring
function calculateEmotionalMomentum(emotionalState) {
  const { confidence, focus, aggression } = emotionalState;
  const momentumFactors = [
    (confidence?.velocity || 0) * 0.3,
    (focus?.velocity || 0) * 0.25,
    (aggression?.velocity || 0) * 0.2
  ];

  return momentumFactors.reduce((a, b) => a + b, 0);
}

// Advanced widget snapshot publishing
function publishAdvancedWidgetSnapshot(metrics, emotionalState) {
  const detail = {
    serveSpeed: sanitizeMetric(metrics.serveSpeed, 0, 200, 0),
    maxServe: sanitizeMetric(WIDGET_STATE.maxServe, 0, 200, 0),
    spinRate: sanitizeMetric(metrics.spin, 0, 5000, 0),
    spinType: WIDGET_STATE.spinType,
    accuracy: sanitizeMetric(metrics.accuracy, 0, 100, 0),
    recentHits: Math.max(0, Math.round(WIDGET_STATE.recentHits)),
    coverage: sanitizeMetric(metrics.coverage, 0, 100, 0),
    distance: sanitizeMetric(WIDGET_STATE.distance, 0, 50, 1),
    reactionTime: sanitizeMetric(metrics.reaction, 0, 5, 2),
    bestReaction: sanitizeMetric(WIDGET_STATE.bestReaction, 0, 5, 2),
    avgRally: WIDGET_STATE.rallyCount > 0
      ? sanitizeMetric(WIDGET_STATE.avgRally, 0, 30, 1)
      : 0,
    longestRally: Math.max(0, Math.round(WIDGET_STATE.longestRally)),

    // NEW: Advanced emotional metrics
    emotional_composure: sanitizeMetric(emotionalState.composite_composure, 0, 100, 1),
    emotional_stability: sanitizeMetric(emotionalState.emotional_stability, 0, 1, 2),
    recovery_potential: sanitizeMetric(emotionalState.recovery_potential, 0, 1, 2),
    confidence_level: sanitizeMetric(emotionalState.confidence?.value || 0, 0, 100, 1),
    focus_level: sanitizeMetric(emotionalState.focus?.value || 0, 0, 100, 1),
    resilience_level: sanitizeMetric(emotionalState.resilience?.value || 0, 0, 100, 1),
    aggression_level: sanitizeMetric(emotionalState.aggression?.value || 0, 0, 100, 1)
  };

  window.dispatchEvent(new CustomEvent("mp:widgets", { detail }));
}

// Advanced emotional sample dispatch
function dispatchAdvancedEmotionalSample(elapsed, phaseName, emotionalState, metrics) {
  window.dispatchEvent(
    new CustomEvent("matchpoint:advanced:emotional", {
      detail: {
        timestamp: elapsed,
        phase: phaseName,
        emotional: {
          composite_composure: emotionalState.composite_composure,
          stability: emotionalState.emotional_stability,
          recovery_potential: emotionalState.recovery_potential,
          dimensions: emotionalState
        },
        metrics: metrics,
        predictions: {
          next_phase_impact: predictNextPhaseImpact(phaseName),
          intervention_needed: emotionalState.composite_composure < 55,
          peak_performance_window: calculatePeakPerformanceWindow(emotionalState)
        }
      }
    })
  );
}

// Predict impact of next phase
function predictNextPhaseImpact(currentPhase) {
  const phaseIndex = PHASES.findIndex(p => p.name === currentPhase);
  if (phaseIndex === -1 || phaseIndex >= PHASES.length - 1) return 0;

  const nextPhase = PHASES[phaseIndex + 1];
  const nextConfig = PHASE_METRICS[nextPhase.name];

  // Simple prediction based on next phase characteristics
  return nextConfig?.composure?.end < 60 ? -15 : 10;
}

// Calculate optimal performance window
function calculatePeakPerformanceWindow(emotionalState) {
  const { confidence, focus, composure } = emotionalState;

  // Peak when confidence and focus are high, composure is stable
  const peakScore = (confidence?.value + focus?.value + composure) / 3;
  return Math.max(0, Math.min(100, peakScore));
}

// ========================================
// METRICS ENGINE
// ========================================
function updateLiveMetrics() {
  if (!isDemoRunning) return;
  const now = Date.now();
  const elapsed = now - startTime;
  const phase =
    PHASES.find((p) => elapsed >= p.start && elapsed < p.end) ?? PHASES[PHASES.length - 1];
  if (!phase) return;

  // Get current emotional state
  const emotionalState = emotionalEngine.getEmotionalState();

  // Update with advanced emotional intelligence
  updateMetricsWithEmotionalIntelligence(emotionalState, phase, 0);

  // Legacy metric updates for compatibility
  const phaseConfig = PHASE_METRICS[phase.name];
  const phaseElapsed = Math.max(0, elapsed - phase.start);
  const progress = Math.min(1, phaseElapsed / Math.max(1, phaseConfig?.duration ?? 1));

  // Update basic metrics for display
  if (typeof metricsState.current.serveSpeed === "number") {
    updateMetric("serveSpeed", metricsState.current.serveSpeed);
  }
  if (typeof metricsState.current.spin === "number") {
    updateMetric("spin", metricsState.current.spin);
  }
  if (typeof metricsState.current.accuracy === "number") {
    updateMetric("accuracy", metricsState.current.accuracy);
  }
  if (typeof metricsState.current.coverage === "number") {
    updateMetric("coverage", metricsState.current.coverage);
  }
  if (typeof metricsState.current.reaction === "number") {
    updateMetric("reaction", metricsState.current.reaction);
  }

  // Record for compatibility
  recordMetricHistory(elapsed, phase.name, metricsState.current);

  // Update UI elements
  const triple = computeTripleStateForecast();
  updateComposureDisplay(triple);
  updateRecoveryVelocity(metricsState.current.recoveryVelocity);

  // Legacy dispatch for compatibility
  dispatchTimelineSample(elapsed, phase.name, phase.caption, metricsState.current);

  // Enhanced momentum calculation
  const emotionalMomentum = calculateEmotionalMomentum(emotionalState);
  setMomentumLevel(Math.min(1, 0.35 + (metricsState.current.coverage + emotionalMomentum) / 200));
}


function interpolateMetric(config, progress) {
  if (!config) return undefined;
  if (typeof config === "number") return Number(config.toFixed(2));
  if (typeof config.value === "number") {
    const decimals = Math.abs(config.value) < 10 ? 2 : config.value % 1 === 0 ? 0 : 1;
    return Number(config.value.toFixed(decimals));
  }
  const { start = 0, end = 0, curve = "linear", floor, phaseBaseline, pressureFactor } = config;

  let eased = progress;
  switch (curve) {
    case "exponential":
      eased = 1 - Math.pow(1 - progress, 2);
      break;
    case "ease-in":
      eased = Math.pow(progress, 2);
      break;
    case "ease-out":
      eased = 1 - Math.pow(1 - progress, 1.6);
      break;
    case "steep":
      eased = Math.pow(progress, 0.55);
      break;
    case "floor":
      eased = progress;
      break;
    default:
      eased = progress;
  }

  let value = start + (end - start) * eased;
  if (curve === "floor" && typeof floor === "number") {
    value = Math.max(floor, value);
  }
  if (typeof phaseBaseline === "number" && typeof pressureFactor === "number") {
    value = value * pressureFactor + phaseBaseline * (1 - pressureFactor);
  }

  const decimals = Math.abs(start) < 10 || Math.abs(end) < 10 ? 2 : 1;
  return Number(value.toFixed(decimals));
}


function recordMetricHistory(timestamp, phaseName, metrics) {
  metricsState.history.push({
    t: timestamp,
    phase: phaseName,
    serveSpeed: metrics.serveSpeed,
    spin: metrics.spin,
    composure: metrics.composure,
    accuracy: metrics.accuracy,
    coverage: metrics.coverage,
    reaction: metrics.reaction,
    recoveryVelocity: metrics.recoveryVelocity
  });
  if (metricsState.history.length > metricsState.maxHistory) {
    metricsState.history.splice(0, metricsState.history.length - metricsState.maxHistory);
  }
}


function computeTripleStateForecast() {
  const history = metricsState.history;
  if (!history.length) return { past: 0, present: 0, predicted: 0 };

  const latest = history[history.length - 1];
  const present = latest.composure ?? 0;
  const pastEntry = findPastSample(history, latest.t, 30_000) ?? history[0];
  const past = pastEntry.composure ?? present;

  const windowSamples = history.slice(-6);
  let slope = 0;
  if (windowSamples.length >= 2) {
    const first = windowSamples[0];
    const last = windowSamples[windowSamples.length - 1];
    const deltaComp = (last.composure ?? present) - (first.composure ?? past);
    const deltaTime = (last.t - first.t) || 1;
    slope = deltaComp / deltaTime;
  }
  let predicted = present + slope * 30_000;
  if (!Number.isFinite(predicted)) predicted = present;
  predicted = Math.max(0, Math.min(100, predicted));

  return {
    past: Math.round(past),
    present: Math.round(present),
    predicted: Math.round(predicted)
  };
}


function updateComposureDisplay(triple) {
  window.dispatchEvent(
    new CustomEvent("matchpoint:composure:update", {
      detail: {
        past: triple.past,
        present: triple.present,
        predicted: triple.predicted,
        intervene: triple.predicted < 50
      }
    })
  );
}


function updateRecoveryVelocity(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return;
  window.dispatchEvent(
    new CustomEvent("matchpoint:recovery:update", {
      detail: { value: Number(value.toFixed(2)) }
    })
  );
}


/**
 * NEW: Dispatches demo progress for UI indicator
 * @param {number} elapsed - Milliseconds elapsed
 */
function updateDemoProgress(elapsed) {
  if (typeof window === "undefined") return;
  const progress = Math.min(100, (elapsed / DEMO_DURATION) * 100);
  window.dispatchEvent(
    new CustomEvent("matchpoint:demo:progress", {
      detail: {
        percent: progress.toFixed(1),
        elapsed: Math.floor(elapsed / 1000),
        remaining: Math.floor((DEMO_DURATION - elapsed) / 1000),
        phase: currentPhase || "warmup"
      }
    })
  );
}


function dispatchTimelineSample(timestamp, phaseName, caption, metrics) {
  window.dispatchEvent(
    new CustomEvent("matchpoint:emotional:sample", {
      detail: {
        timestamp,
        phase: phaseName,
        caption,
        metrics: {
          serveSpeed: metrics.serveSpeed,
          spin: metrics.spin,
          composure: metrics.composure,
          accuracy: metrics.accuracy,
          coverage: metrics.coverage,
          reaction: metrics.reaction,
          recoveryVelocity: metrics.recoveryVelocity
        }
      }
    })
  );
}


function dispatchEmotionalCaption(caption) {
  if (!caption) return;
  window.dispatchEvent(
    new CustomEvent("matchpoint:emotional:phase", {
      detail: { caption }
    })
  );
}


function findPastSample(history, currentTime, lookbackMs) {
  for (let i = history.length - 1; i >= 0; i -= 1) {
    const entry = history[i];
    if (currentTime - entry.t >= lookbackMs) {
      return entry;
    }
  }
  return null;
}


// ========================================
// NARRATIVE EVENTS
// ========================================
function scheduleNarrativeEvents() {
  clearNarrativeSchedules();
  const runId = currentRunId;
  NARRATIVE_CUES.forEach((cue) => {
    const timer = setTimeout(() => {
      if (currentRunId !== runId) return;
      playNarrativeCue(cue);
    }, cue.time);
    scheduledCueTimers.push(timer);
  });
  IMPACT_BANNERS.forEach((banner) => {
    const timer = setTimeout(() => {
      if (currentRunId !== runId) return;
      showImpactBanner(banner);
    }, banner.time);
    scheduledBannerTimers.push(timer);
  });
}


function clearNarrativeSchedules() {
  scheduledCueTimers.forEach((id) => clearTimeout(id));
  scheduledBannerTimers.forEach((id) => clearTimeout(id));
  scheduledCueTimers = [];
  scheduledBannerTimers = [];
}


function playNarrativeCue(cue) {
  if (!cue) return;
  cueCooldown = true;
  const release = () => {
    setTimeout(() => {
      cueCooldown = false;
    }, 1200);
  };

  const attempt = cue.audio ? playSound(cue.audio, { volume: 0.95 }) : Promise.resolve(null);
  Promise.resolve(attempt)
    .then((source) => {
      if (!source && cue.text) {
        return speakCue(cue.text);
      }
      return null;
    })
    .catch(() => {
      if (cue.text) return speakCue(cue.text);
      return null;
    })
    .finally(() => {
      release();
      window.dispatchEvent(
        new CustomEvent("matchpoint:narrative:cue", {
          detail: { ...cue }
        })
      );
    });
}


function showImpactBanner(banner) {
  if (!banner?.text) return;
  window.dispatchEvent(
    new CustomEvent("matchpoint:narrative:banner", {
      detail: { ...banner }
    })
  );

  const mount = document.createElement("div");
  mount.className = "impact-banner";
  mount.textContent = banner.text;
  mount.style.background = getBannerGradient(banner.color);
  document.body.appendChild(mount);

  requestAnimationFrame(() => {
    mount.classList.add("impact-banner--visible");
  });

  setTimeout(() => {
    mount.classList.remove("impact-banner--visible");
    setTimeout(() => mount.remove(), 600);
  }, 3200);
}


function getBannerGradient(color) {
  switch (color) {
    case "green":
      return "linear-gradient(135deg, rgba(16,185,129,0.92), rgba(5,150,105,0.9))";
    case "yellow":
      return "linear-gradient(135deg, rgba(251,191,36,0.92), rgba(245,158,11,0.9))";
    case "red":
      return "linear-gradient(135deg, rgba(239,68,68,0.92), rgba(220,38,38,0.9))";
    case "cyan":
    default:
      return "linear-gradient(135deg, rgba(14,165,233,0.9), rgba(6,182,212,0.9))";
  }
}


// ========================================
// DEMO CONTROL FUNCTIONS
// ========================================

/**
 * Updates demo button states based on current demo status
 * @param {string} state - 'ready', 'playing', 'stopped'
 */
function updateDemoButtonStates(state) {
  if (typeof window === "undefined") return;

  const playBtn = document.getElementById('play-tennis-demo-btn');
  const resetBtn = document.getElementById('reset-tennis-demo-btn');

  switch (state) {
    case 'playing':
      if (playBtn) {
        playBtn.innerHTML = '&#x23F8; Demo Playing...';
        playBtn.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
        playBtn.disabled = false;
      }
      if (resetBtn) {
        resetBtn.innerHTML = '&#x23F9; Stop Demo';
        resetBtn.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
        resetBtn.disabled = false;
      }
      break;

    case 'stopped':
      if (playBtn) {
        playBtn.innerHTML = '&#x26BE; Play 5-Min Demo';
        playBtn.style.background = 'linear-gradient(135deg, #8b5cf6, #ec4899)';
        playBtn.disabled = false;
      }
      if (resetBtn) {
        resetBtn.innerHTML = '&#x23F9; Demo Stopped';
        resetBtn.style.background = 'linear-gradient(135deg, #6b7280, #4b5563)';
        resetBtn.disabled = true;
        // Re-enable after 2 seconds
        setTimeout(() => {
          if (resetBtn && !isDemoRunning) {
            resetBtn.innerHTML = '&#x23F9; Reset Demo';
            resetBtn.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
            resetBtn.disabled = false;
          }
        }, 2000);
      }
      break;

    case 'ready':
    default:
      if (playBtn) {
        playBtn.innerHTML = '&#x26BE; Play 5-Min Demo';
        playBtn.style.background = 'linear-gradient(135deg, #8b5cf6, #ec4899)';
        playBtn.disabled = false;
      }
      if (resetBtn) {
        resetBtn.innerHTML = '&#x23F9; Reset Demo';
        resetBtn.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
        resetBtn.disabled = false;
      }
      break;
  }
}

// ========================================
// DEBUG TOOLS (for QA/testing)
// ========================================
if (typeof window !== "undefined") {
  /**
   * Debug: Skip to specific phase (for testing)
   * @param {string} phaseName - Phase to skip to (warmup, pressure, crisis, recovery)
   * @example window.__mpDebugSkipToPhase("crisis")
   */
  window.__mpDebugSkipToPhase = (phaseName) => {
    if (!isDemoRunning) {
      console.error("[Debug] Demo must be running to skip phases");
      return;
    }
    const phase = PHASES.find(p => p.name === phaseName);
    if (!phase) {
      console.error("[Debug] Unknown phase:", phaseName);
      return;
    }
    startTime = Date.now() - phase.start;
    currentPhase = null;  // Force phase change trigger
    console.log(`[Debug] Skipped to ${phaseName} phase`);
  };

  /**
   * Debug: Enable console logging of metrics
   * @example window.__mpDebugMode = true
   */
  window.__mpDebugMode = false;
}
