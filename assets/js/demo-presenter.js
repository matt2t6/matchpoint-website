// MatchPoint Demo Presenter Layer
// Synchronises demo timeline events with the investor-facing UI overlays.

const TIMELINE_TOTAL_MS = 300_000;
const TIMELINE_PHASES = [
  { name: "warmup", start: 0, end: 60_000, label: "Warmup", color: "rgba(34,197,94,0.16)" },
  { name: "pressure", start: 60_000, end: 180_000, label: "Pressure", color: "rgba(250,204,21,0.16)" },
  { name: "crisis", start: 180_000, end: 240_000, label: "Crisis", color: "rgba(248,113,113,0.20)" },
  { name: "recovery", start: 240_000, end: 300_000, label: "Recovery", color: "rgba(56,189,248,0.18)" }
];

const DEFAULT_CAPTIONS = {
  warmup: "Confident start - baseline established",
  pressure: "Pressure builds - opponent intensity rising",
  crisis: "Critical moment - coach intervention deployed",
  recovery: "Triumph secured - champion state restored"
};

const RECOVERY_BANDS = [
  { key: "elite", label: "ELITE", threshold: 2.0, caption: "Intervention landed. Momentum surged instantly." },
  { key: "strong", label: "STRONG", threshold: 1.2, caption: "Player is snapping back quickly after cues." },
  { key: "stable", label: "STABLE", threshold: 0.7, caption: "Steady recovery. Maintain consistent coaching." },
  { key: "slow", label: "BUILD", threshold: -Infinity, caption: "Reinforce fundamentals. Schedule another cue." }
];

const gauges = initialiseGauges();
const interventionBadge = document.getElementById("composure-intervention");

const recovery = {
  card: document.getElementById("recovery-card"),
  value: document.getElementById("recovery-value"),
  tier: document.getElementById("recovery-tier"),
  caption: document.getElementById("recovery-caption")
};

const timeline = {
  canvas: document.getElementById("emotional-timeline"),
  ctx: null,
  width: 0,
  height: 0,
  samples: [],
  baseline: 72,
  lastPhase: "warmup",
  running: false
};

const phaseTag = document.getElementById("timeline-phase");
const timelineCaption = document.getElementById("timeline-caption");
const metricsPanelEl = document.getElementById("metrics-panel");

let resizeTimer = null;

initialise();

function initialise() {
  resetVisuals();
  setMetricsPanelActive(false);
  if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(setupCanvas);
  } else {
    setupCanvas();
  }
  window.addEventListener("resize", handleResize);

  window.addEventListener("matchpoint:composure:update", handleComposureUpdate);
  window.addEventListener("matchpoint:recovery:update", handleRecoveryUpdate);
  window.addEventListener("matchpoint:emotional:sample", handleTimelineSample);
  window.addEventListener("matchpoint:emotional:phase", handlePhaseCaption);
  window.addEventListener("matchpoint:demo:start", handleDemoStart);
  window.addEventListener("matchpoint:demo:end", handleDemoEnd);
  window.addEventListener("matchpoint:demo:reset", handleDemoReset);
}

function initialiseGauges() {
  const registry = {};
  ["past", "present", "predicted"].forEach((key) => {
    const root = document.querySelector(`.composure-gauge[data-gauge='${key}']`);
    if (!root) return;
    registry[key] = {
      root,
      valueEl: root.querySelector("[data-gauge-value]")
    };
  });
  return registry;
}

function handleComposureUpdate(event) {
  const detail = event?.detail || {};
  updateGauge("past", detail.past);
  updateGauge("present", detail.present);
  updateGauge("predicted", detail.predicted);
  updateIntervention(detail.intervene === true);
}

function updateGauge(key, value) {
  const entry = gauges[key];
  if (!entry || !entry.root) return;
  if (Number.isFinite(value)) {
    const clamped = clamp(Number(value), 0, 100);
    entry.root.style.setProperty("--value", clamped.toString());
    if (entry.valueEl) entry.valueEl.textContent = Math.round(clamped).toString();
  } else {
    entry.root.style.setProperty("--value", "0");
    if (entry.valueEl) entry.valueEl.textContent = "--";
  }
}

function updateIntervention(active) {
  const predicted = gauges.predicted?.root;
  if (predicted) {
    predicted.classList.toggle("needs-intervention", active);
  }
  if (interventionBadge) {
    interventionBadge.classList.toggle("is-active", active);
    interventionBadge.setAttribute("aria-hidden", active ? "false" : "true");
  }
}

function handleRecoveryUpdate(event) {
  const value = Number(event?.detail?.value);
  if (!recovery.card) return;
  if (!Number.isFinite(value)) {
    resetRecovery();
    return;
  }
  const tier = resolveRecoveryTier(value);
  recovery.card.dataset.tier = tier.key;
  if (recovery.value) recovery.value.textContent = `${value.toFixed(2)}x`;
  if (recovery.tier) recovery.tier.textContent = tier.label;
  if (recovery.caption) recovery.caption.textContent = tier.caption;
}

function resolveRecoveryTier(value) {
  for (const band of RECOVERY_BANDS) {
    if (value >= band.threshold) return band;
  }
  return RECOVERY_BANDS[RECOVERY_BANDS.length - 1];
}

function handleTimelineSample(event) {
  const detail = event?.detail || {};
  const timestamp = Number(detail.timestamp);
  if (!Number.isFinite(timestamp)) return;

  const phaseName = typeof detail.phase === "string" ? detail.phase : timeline.lastPhase;
  timeline.lastPhase = phaseName;
  updatePhaseTag(phaseName);

  const rawValue = Number(detail.metrics?.composure);
  const value = Number.isFinite(rawValue) ? clamp(rawValue, 0, 100) : getLastSampleValue();

  const sample = {
    t: clamp(timestamp, 0, TIMELINE_TOTAL_MS),
    value
  };

  timeline.samples.push(sample);
  if (timeline.samples.length > 420) {
    timeline.samples.shift();
  }

  drawTimeline();
}

function handlePhaseCaption(event) {
  const caption = event?.detail?.caption;
  if (typeof caption === "string" && timelineCaption) {
    timelineCaption.textContent = caption;
  }
}

function handleDemoStart() {
  timeline.running = true;
  timeline.samples = [];
  timeline.lastPhase = "warmup";
  resetVisuals();
  drawTimeline();
  setMetricsPanelActive(true);
}

function handleDemoEnd() {
  timeline.running = false;
  updateIntervention(false);
  setMetricsPanelActive(false);
}

function handleDemoReset() {
  timeline.running = false;
  timeline.samples = [];
  resetVisuals();
  drawTimeline();
  setMetricsPanelActive(false);
}

function resetVisuals() {
  Object.keys(gauges).forEach((key) => updateGauge(key, null));
  updateIntervention(false);
  resetRecovery();
  updatePhaseTag("warmup");
  if (timelineCaption) {
    timelineCaption.textContent = DEFAULT_CAPTIONS.warmup;
  }
}

function resetRecovery() {
  if (recovery.card) recovery.card.dataset.tier = "idle";
  if (recovery.value) recovery.value.textContent = "--";
  if (recovery.tier) recovery.tier.textContent = "--";
  if (recovery.caption) recovery.caption.textContent = "Awaiting live data";
}

function updatePhaseTag(phaseName) {
  if (!phaseTag) return;
  const phase = TIMELINE_PHASES.find((p) => p.name === phaseName);
  phaseTag.textContent = phase?.label || "Live";
  phaseTag.dataset.phase = phase?.name || "live";
  if (timelineCaption && timeline.samples.length === 0 && phase && DEFAULT_CAPTIONS[phase.name]) {
    timelineCaption.textContent = DEFAULT_CAPTIONS[phase.name];
  }
}

function handleResize() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(setupCanvas, 140);
}

function setupCanvas() {
  if (!timeline.canvas) return;
  const parentWidth =
    timeline.canvas.clientWidth ||
    timeline.canvas.parentElement?.clientWidth ||
    320;
  const width = Math.max(260, Math.round(parentWidth));
  const height = 150;
  const dpr = window.devicePixelRatio || 1;

  timeline.canvas.width = Math.round(width * dpr);
  timeline.canvas.height = Math.round(height * dpr);
  timeline.canvas.style.width = "100%";
  timeline.canvas.style.height = `${height}px`;

  timeline.ctx = timeline.canvas.getContext("2d");
  if (!timeline.ctx) return;

  timeline.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  timeline.width = width;
  timeline.height = height;

  drawTimeline();
}

function drawTimeline() {
  if (!timeline.ctx || !timeline.width || !timeline.height) return;
  const ctx = timeline.ctx;

  ctx.clearRect(0, 0, timeline.width, timeline.height);

  TIMELINE_PHASES.forEach((phase) => {
    const startX = (phase.start / TIMELINE_TOTAL_MS) * timeline.width;
    const width = ((phase.end - phase.start) / TIMELINE_TOTAL_MS) * timeline.width;
    ctx.fillStyle = phase.color;
    ctx.fillRect(startX, 0, width, timeline.height);
  });

  ctx.strokeStyle = "rgba(148,163,184,0.3)";
  ctx.lineWidth = 1;
  [50, 70, 90].forEach((value) => {
    const y = timeline.height - (value / 100) * timeline.height;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(timeline.width, y);
    ctx.stroke();
  });

  const samples = timeline.samples.length
    ? timeline.samples
    : [
        { t: 0, value: timeline.baseline },
        { t: TIMELINE_TOTAL_MS, value: timeline.baseline }
      ];

  const points = samples.map((sample) => ({
    x: (sample.t / TIMELINE_TOTAL_MS) * timeline.width,
    y: timeline.height - (clamp(sample.value, 0, 100) / 100) * timeline.height
  }));

  if (!points.length) return;

  const gradient = ctx.createLinearGradient(0, 0, timeline.width, 0);
  gradient.addColorStop(0, "#22c55e");
  gradient.addColorStop(0.45, "#facc15");
  gradient.addColorStop(0.65, "#ef4444");
  gradient.addColorStop(1, "#38bdf8");

  ctx.beginPath();
  points.forEach((pt, index) => {
    if (index === 0) ctx.moveTo(pt.x, pt.y);
    else ctx.lineTo(pt.x, pt.y);
  });
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 2.4;
  ctx.stroke();

  ctx.lineTo(points[points.length - 1].x, timeline.height);
  ctx.lineTo(points[0].x, timeline.height);
  ctx.closePath();
  ctx.fillStyle = "rgba(56,189,248,0.08)";
  ctx.fill();

  const last = points[points.length - 1];
  if (last) {
    ctx.beginPath();
    ctx.arc(last.x, last.y, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = "#38bdf8";
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(255,255,255,0.65)";
    ctx.stroke();
  }
}

function getLastSampleValue() {
  if (!timeline.samples.length) return timeline.baseline;
  const last = timeline.samples[timeline.samples.length - 1];
  return clamp(last.value, 0, 100);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function setMetricsPanelActive(active) {
  if (!metricsPanelEl) return;
  metricsPanelEl.classList.toggle("metrics-panel--inactive", !active);
}
