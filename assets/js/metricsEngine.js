/**
 * MatchPoint Metrics Engine
 *
 * Generic metrics store and legacy-widget renderer.
 *
 * Important ownership rule:
 * - This module may render legacy IDs listed in METRIC_ELEMENT_MAP.
 * - AO2022 cinematic AEGIS panel IDs such as gs-serve-speed, gs-spin,
 *   gs-rally-avg, and gs-rally-longest remain owned by ao2022_match_panel-8.js.
 * - Do not add gs-* IDs here, or this module becomes a duplicate writer.
 *
 * Event semantics:
 * - Serve speed changes only through recordServe().
 * - Spin changes through recordShot().
 * - Rally averages and longest rally are integer shot counts.
 * - Accuracy is deterministic and based on supplied outcomes/confidence.
 */

const SOURCE_TYPES = Object.freeze([
  'observed',
  'derived',
  'estimated',
  'system',
  'narrative',
  'static'
]);

const METRIC_DEFINITIONS = Object.freeze({
  serveSpeed: {
    defaultValue: 0,
    decimals: 0,
    unit: 'mph',
    sourceType: 'observed',
    eventOnly: 'serve'
  },
  maxServe: {
    defaultValue: 0,
    decimals: 0,
    unit: 'mph',
    sourceType: 'derived',
    eventOnly: 'serve'
  },
  spin: {
    defaultValue: 0,
    decimals: 0,
    unit: 'rpm',
    sourceType: 'observed',
    eventOnly: 'shot'
  },
  accuracy: {
    defaultValue: 0,
    decimals: 0,
    unit: '%',
    sourceType: 'derived'
  },
  coverage: {
    defaultValue: 0,
    decimals: 0,
    unit: '%',
    sourceType: 'derived'
  },
  reaction: {
    defaultValue: 0,
    decimals: 2,
    unit: 's',
    sourceType: 'derived'
  },
  rallyAverage: {
    defaultValue: 0,
    decimals: 0,
    unit: 'shots avg',
    sourceType: 'derived'
  },
  longestRally: {
    defaultValue: 0,
    decimals: 0,
    unit: 'shots',
    sourceType: 'derived'
  },
  rallyCurrent: {
    defaultValue: 0,
    decimals: 0,
    unit: 'shots',
    sourceType: 'observed'
  }
});

/**
 * These are legacy/general dashboard IDs only.
 * Do not place AO2022 cinematic gs-* IDs in this mapping.
 */
const METRIC_ELEMENT_MAP = Object.freeze({
  serveSpeed: ['metric-serveSpeed', 'serve-speed'],
  maxServe: ['metric-maxServe', 'max-serve'],
  spin: ['metric-spin', 'spin-rate'],
  accuracy: ['metric-accuracy', 'shot-accuracy'],
  coverage: ['metric-coverage', 'court-coverage'],
  reaction: ['metric-reaction', 'reaction-time'],
  rallyAverage: ['metric-rallyAverage', 'rally-length'],
  longestRally: ['metric-longestRally', 'longest-rally'],
  rallyCurrent: ['metric-rallyCurrent', 'current-rally']
});

const METRICS = Object.create(null);
const METADATA = Object.create(null);
const listeners = new Set();

let batchDepth = 0;
let pendingNotification = false;
let lastRenderAt = 0;

const RENDER_THROTTLE_MS = 32;

const rallyState = {
  currentShots: 0,
  completedRallies: 0,
  completedShotTotal: 0,
  longestShots: 0
};

const accuracyState = {
  outcomes: [],
  maxSamples: 10
};

initializeState();

function initializeState() {
  for (const [name, definition] of Object.entries(METRIC_DEFINITIONS)) {
    METRICS[name] = definition.defaultValue;
    METADATA[name] = createMetadata(definition.sourceType);
  }
}

function createMetadata(sourceType) {
  return {
    sourceType: normalizeSourceType(sourceType),
    updatedAt: null,
    replayTime: null,
    eventType: null,
    confidence: null,
    explanation: null
  };
}

function normalizeSourceType(value) {
  return SOURCE_TYPES.includes(value) ? value : 'derived';
}

function isKnownMetric(name) {
  return Object.prototype.hasOwnProperty.call(METRIC_DEFINITIONS, name);
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function toFiniteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function toInteger(value, fallback = 0) {
  return Math.round(toFiniteNumber(value, fallback));
}

function setMetricValue(name, value, options = {}) {
  if (!isKnownMetric(name)) {
    return false;
  }

  const definition = METRIC_DEFINITIONS[name];
  const numericValue = toFiniteNumber(value, definition.defaultValue);
  const normalizedValue =
    definition.decimals === 0 ? Math.round(numericValue) : numericValue;

  const previousValue = METRICS[name];
  const metadata = METADATA[name];

  METRICS[name] = normalizedValue;
  METADATA[name] = {
    ...metadata,
    sourceType: normalizeSourceType(options.sourceType || definition.sourceType),
    updatedAt: Date.now(),
    replayTime: Number.isFinite(options.replayTime)
      ? options.replayTime
      : metadata.replayTime,
    eventType: options.eventType || metadata.eventType,
    confidence: Number.isFinite(options.confidence)
      ? clamp(options.confidence, 0, 100)
      : metadata.confidence,
    explanation: options.explanation || metadata.explanation
  };

  if (previousValue !== normalizedValue || options.forceRender === true) {
    renderMetric(name, options.animate !== false);
    queueNotification();
  }

  return true;
}

function queueNotification() {
  if (batchDepth > 0) {
    pendingNotification = true;
    return;
  }

  notifySubscribers();
}

function notifySubscribers() {
  const snapshot = getMetricSnapshot();

  for (const listener of listeners) {
    try {
      listener(snapshot);
    } catch (error) {
      console.error('[MetricsEngine] subscriber failed:', error);
    }
  }
}

function beginBatch() {
  batchDepth += 1;
}

function endBatch() {
  batchDepth = Math.max(0, batchDepth - 1);

  if (batchDepth === 0 && pendingNotification) {
    pendingNotification = false;
    notifySubscribers();
  }
}

function withBatch(callback) {
  beginBatch();

  try {
    return callback();
  } finally {
    endBatch();
  }
}

function findMetricElement(name) {
  const ids = METRIC_ELEMENT_MAP[name] || [`metric-${name}`];

  for (const id of ids) {
    const element = document.getElementById(id);

    if (element) {
      return element;
    }
  }

  return null;
}

function formatDisplayValue(name, value) {
  if (!isKnownMetric(name)) {
    return value ?? '--';
  }

  if (!Number.isFinite(value)) {
    return '--';
  }

  const definition = METRIC_DEFINITIONS[name];

  if (definition.decimals === 0) {
    return String(Math.round(value));
  }

  return value.toFixed(definition.decimals);
}

function renderMetric(name, animate = true) {
  const element = findMetricElement(name);

  if (!element) {
    return;
  }

  const now = performance.now();

  if (now - lastRenderAt < RENDER_THROTTLE_MS && animate === false) {
    element.textContent = formatDisplayValue(name, METRICS[name]);
    return;
  }

  lastRenderAt = now;
  element.textContent = formatDisplayValue(name, METRICS[name]);

  if (!animate) {
    return;
  }

  element.style.transition = 'color 180ms ease, transform 180ms ease';
  element.style.transform = 'scale(1.06)';
  element.style.color = '#6ef';

  window.setTimeout(() => {
    element.style.transform = 'scale(1)';
    element.style.color = '';
  }, 180);
}

function renderAllMetrics(animate = false) {
  for (const name of Object.keys(METRIC_DEFINITIONS)) {
    renderMetric(name, animate);
  }
}

function normaliseCall(call) {
  return String(call || '').trim().toUpperCase();
}

function resolveShotOutcome({ call, confidence, isHit } = {}) {
  if (typeof isHit === 'boolean') {
    return isHit;
  }

  const normalizedCall = normaliseCall(call);

  if (normalizedCall === 'IN') {
    return true;
  }

  if (
    normalizedCall === 'OUT' ||
    normalizedCall === 'FAULT' ||
    normalizedCall === 'NET' ||
    normalizedCall === 'DOUBLE_FAULT'
  ) {
    return false;
  }

  return toFiniteNumber(confidence, 0) >= 75;
}

function updateAccuracyFromWindow(options = {}) {
  const hits = accuracyState.outcomes.filter(Boolean).length;
  const total = accuracyState.outcomes.length;
  const percentage = total === 0 ? 0 : Math.round((hits / total) * 100);

  setMetricValue('accuracy', percentage, {
    ...options,
    sourceType: 'derived',
    eventType: 'shot',
    explanation: `Rolling accuracy window: ${hits}/${total} successful shots.`
  });

  return {
    hits,
    total,
    percentage
  };
}

/**
 * Backward-compatible generic update method.
 *
 * Prefer recordServe(), recordShot(), recordRallyProgress(), and
 * completeRally() for match-flow code because they preserve metric semantics.
 */
export function updateMetric(name, value, options = {}) {
  return setMetricValue(name, value, options);
}

export function updateMetrics(values, options = {}) {
  if (!values || typeof values !== 'object') {
    return false;
  }

  return withBatch(() => {
    let updated = false;

    for (const [name, value] of Object.entries(values)) {
      updated = setMetricValue(name, value, options) || updated;
    }

    return updated;
  });
}

/**
 * Use only when a new serve event is detected.
 * This intentionally does not update on normal rally shots.
 */
export function recordServe(mph, options = {}) {
  const serveMph = Math.max(0, toInteger(mph));
  const currentMax = Math.max(0, toInteger(METRICS.maxServe));

  return withBatch(() => {
    setMetricValue('serveSpeed', serveMph, {
      ...options,
      sourceType: 'observed',
      eventType: 'serve',
      explanation: 'Last detected serve speed.'
    });

    setMetricValue('maxServe', Math.max(currentMax, serveMph), {
      ...options,
      sourceType: 'derived',
      eventType: 'serve',
      explanation: 'Highest detected serve speed in the current session.'
    });

    return {
      serveSpeed: serveMph,
      maxServe: Math.max(currentMax, serveMph)
    };
  });
}

/**
 * Use for every valid post-contact shot or shot event.
 * Spin is live per-shot telemetry and may change several times within a rally.
 */
export function recordShot({
  rpm,
  speedMph,
  call,
  confidence,
  isHit,
  replayTime
} = {}) {
  const spinRpm = Math.max(0, toInteger(rpm));
  const shotSpeed = Math.max(0, toFiniteNumber(speedMph, 0));
  const outcome = resolveShotOutcome({ call, confidence, isHit });

  return withBatch(() => {
    setMetricValue('spin', spinRpm, {
      sourceType: 'observed',
      eventType: 'shot',
      replayTime,
      confidence,
      explanation: 'Current ball-spin telemetry from the latest valid shot.'
    });

    accuracyState.outcomes.push(outcome);

    if (accuracyState.outcomes.length > accuracyState.maxSamples) {
      accuracyState.outcomes.shift();
    }

    const accuracy = updateAccuracyFromWindow({
      replayTime,
      confidence
    });

    return {
      spin: spinRpm,
      shotSpeed,
      outcome,
      accuracy
    };
  });
}

/**
 * Update the visible in-progress rally count.
 * Counts are always whole shots.
 */
export function recordRallyProgress(shots, options = {}) {
  rallyState.currentShots = Math.max(0, toInteger(shots));

  return setMetricValue('rallyCurrent', rallyState.currentShots, {
    ...options,
    sourceType: 'observed',
    eventType: 'rally-progress',
    explanation: 'Current rally shot count.'
  });
}

/**
 * Complete the current rally and update all session rally metrics.
 */
export function completeRally(shots = rallyState.currentShots, options = {}) {
  const completedShots = Math.max(0, toInteger(shots));

  if (completedShots <= 0) {
    return getRallyStats();
  }

  return withBatch(() => {
    rallyState.currentShots = 0;
    rallyState.completedRallies += 1;
    rallyState.completedShotTotal += completedShots;
    rallyState.longestShots = Math.max(rallyState.longestShots, completedShots);

    const averageShots = Math.round(
      rallyState.completedShotTotal / rallyState.completedRallies
    );

    setMetricValue('rallyCurrent', 0, {
      ...options,
      sourceType: 'observed',
      eventType: 'rally-end',
      explanation: 'Rally completed.'
    });

    setMetricValue('rallyAverage', averageShots, {
      ...options,
      sourceType: 'derived',
      eventType: 'rally-end',
      explanation: 'Average completed rally length, rounded to whole shots.'
    });

    setMetricValue('longestRally', rallyState.longestShots, {
      ...options,
      sourceType: 'derived',
      eventType: 'rally-end',
      explanation: 'Longest completed rally in whole shots.'
    });

    return getRallyStats();
  });
}

/**
 * Use the current measured shot speed, not the held last-serve speed.
 */
export function recordReactionTime(seconds, options = {}) {
  return setMetricValue('reaction', Math.max(0, toFiniteNumber(seconds)), {
    ...options,
    sourceType: 'derived',
    eventType: 'reaction',
    explanation: 'Reaction-time estimate for the current incoming shot.'
  });
}

export function recordCoverage(percent, options = {}) {
  return setMetricValue('coverage', clamp(toFiniteNumber(percent), 0, 100), {
    ...options,
    sourceType: 'derived',
    eventType: 'coverage',
    explanation: 'Current court-coverage estimate.'
  });
}

export function getMetrics() {
  return { ...METRICS };
}

export function getMetricMetadata(name) {
  if (!isKnownMetric(name)) {
    return null;
  }

  return { ...METADATA[name] };
}

export function getMetricSnapshot() {
  const values = getMetrics();
  const metadata = {};

  for (const name of Object.keys(METRIC_DEFINITIONS)) {
    metadata[name] = getMetricMetadata(name);
  }

  return {
    values,
    metadata,
    rally: getRallyStats(),
    accuracy: getAccuracyStats()
  };
}

export function getRallyStats() {
  return {
    currentShots: rallyState.currentShots,
    completedRallies: rallyState.completedRallies,
    completedShotTotal: rallyState.completedShotTotal,
    averageShots:
      rallyState.completedRallies > 0
        ? Math.round(
            rallyState.completedShotTotal / rallyState.completedRallies
          )
        : 0,
    longestShots: rallyState.longestShots
  };
}

export function getAccuracyStats() {
  const hits = accuracyState.outcomes.filter(Boolean).length;
  const total = accuracyState.outcomes.length;

  return {
    hits,
    total,
    percentage: total === 0 ? 0 : Math.round((hits / total) * 100),
    outcomes: [...accuracyState.outcomes]
  };
}

export function subscribe(listener) {
  if (typeof listener !== 'function') {
    throw new TypeError('MetricsEngine.subscribe requires a function.');
  }

  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function resetMetrics({ render = true } = {}) {
  withBatch(() => {
    for (const [name, definition] of Object.entries(METRIC_DEFINITIONS)) {
      METRICS[name] = definition.defaultValue;
      METADATA[name] = createMetadata(definition.sourceType);
    }

    rallyState.currentShots = 0;
    rallyState.completedRallies = 0;
    rallyState.completedShotTotal = 0;
    rallyState.longestShots = 0;

    accuracyState.outcomes = [];

    if (render) {
      renderAllMetrics(false);
    }

    pendingNotification = true;
  });
}

export function refreshMetricDisplays({ animate = false } = {}) {
  renderAllMetrics(animate);
}

export function getMetricDefinitions() {
  return Object.fromEntries(
    Object.entries(METRIC_DEFINITIONS).map(([name, definition]) => [
      name,
      { ...definition }
    ])
  );
}