// 📊 MatchPoint Metrics Engine
const METRICS = {
  serveSpeed: 0,
  spin: 0,
  accuracy: 0,
  coverage: 0,
  reaction: 0,
};

const METRIC_DECIMALS = {
  serveSpeed: 0,
  spin: 0,
  accuracy: 0,
  coverage: 0,
  reaction: 2
};

const METRIC_ELEMENT_MAP = {
  serveSpeed: ["metric-serveSpeed", "serve-speed"],
  spin: ["metric-spin", "spin-rate"],
  accuracy: ["metric-accuracy", "shot-accuracy"],
  coverage: ["metric-coverage", "court-coverage"],
  reaction: ["metric-reaction", "reaction-time"]
};

export function updateMetric(name, value) {
  if (!(name in METRICS)) return;
  METRICS[name] = value;
  animateMetric(name, value);
}

export function getMetrics() {
  return { ...METRICS };
}

export function resetMetrics() {
  Object.keys(METRICS).forEach((k) => {
    METRICS[k] = 0;
  });
  updateAllDisplays();
}

function animateMetric(name, value) {
  const el = findMetricElement(name);
  if (!el) return;
  const displayVal = formatDisplayValue(name, value);
  el.style.transition = "color 0.3s, transform 0.3s";
  el.textContent = displayVal;
  el.style.transform = "scale(1.1)";
  el.style.color = "#6ef";
  setTimeout(() => {
    el.style.transform = "scale(1)";
    el.style.color = "#fff";
  }, 300);
}

function updateAllDisplays() {
  for (const [k, v] of Object.entries(METRICS)) {
    const el = findMetricElement(k);
    if (el) el.textContent = formatDisplayValue(k, v);
  }
}

function findMetricElement(name) {
  const ids = METRIC_ELEMENT_MAP[name] || [`metric-${name}`];
  for (const id of ids) {
    const el = document.getElementById(id);
    if (el) return el;
  }
  return null;
}

function formatDisplayValue(name, value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return value ?? "--";
  const decimals = METRIC_DECIMALS[name];
  if (typeof decimals === "number") {
    return value.toFixed(decimals);
  }
  if (Math.abs(value) < 10) {
    return value.toFixed(2);
  }
  return value.toFixed(1);
}
