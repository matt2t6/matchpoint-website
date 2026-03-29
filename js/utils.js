// =====================
// 📦 MatchPoint Utilities
// =====================

// ---- DOM Helpers ----
export const $ = (id) => document.getElementById(id);

export const setText = (id, value) => {
  const el = $(id);
  if (el) el.textContent = value;
  return !!el;
};

export const setHTMLStatic = (id, html) => {
  // For trusted static templates ONLY
  const el = $(id);
  if (el) el.innerHTML = html;
  return !!el;
};

// ---- Interval Management ----
window.__mpIntervals = window.__mpIntervals || [];

export function createInterval(fn, delay) {
  const id = setInterval(fn, delay);
  window.__mpIntervals.push(id);
  return id;
}

export function clearAllIntervals() {
  (window.__mpIntervals || []).forEach(clearInterval);
  window.__mpIntervals = [];
}
window.addEventListener("beforeunload", clearAllIntervals);

// ---- Chart Guard ----
let kalmanChartInstance = null;
export function initializeKalmanChart(ctx, config) {
  if (kalmanChartInstance) {
    kalmanChartInstance.destroy();
    kalmanChartInstance = null;
  }
  kalmanChartInstance = new Chart(ctx, config);
  return kalmanChartInstance;
}

// ---- API Config ----
const API_CONFIG = {
  development: "", // dev proxy
  fallback: "http://localhost:5000",
};

export const API_BASE_URL = (() => {
  if (window.__MP__?.API) return window.__MP__.API;
  const isDev =
    location.hostname === "localhost" && location.port === "3000";
  return isDev ? API_CONFIG.development : API_CONFIG.fallback;
})();

// ---- Error Boundary ----
const isProd = ["production", "prod"].includes(
  (window.__MP__?.ENV || "").toLowerCase()
);

window.addEventListener("error", (e) => {
  console.error("[MatchPoint Error]", e.message, e.error);
  if (!isProd) {
    fetch(`${API_BASE_URL}/api/client-errors`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: e.message,
        stack: e.error?.stack?.slice(0, 2000),
        url: location.href,
        ts: Date.now(),
      }),
    }).catch(() => {});
  }
});

// ---- RNG Utility ----
export function makeSeededRNG(seed = 42) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- Error Handling Wrapper ----
export function withErrorHandling(fn, fnName = 'anonymous') {
  return async function(...args) {
    try {
      return await fn.apply(this, args);
    } catch (error) {
      console.error(`[MatchPoint] Error in ${fnName}:`, error);
      if (!isProd) {
        // In development, you might want to show user-friendly errors
        console.warn(`Function ${fnName} failed, but continuing execution`);
      }
      throw error; // Re-throw for caller to handle
    }
  };
}

// ---- Safe JSON Parse ----
export function safeJsonParse(str, fallback = null) {
  try {
    return JSON.parse(str);
  } catch (e) {
    console.warn('[MatchPoint] JSON parse failed:', e.message);
    return fallback;
  }
}

// ---- Debounce Utility ----
export function debounce(fn, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

// ---- Throttle Utility ----
export function throttle(fn, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// ---- Local Storage Helpers ----
export function getStored(key, fallback = null) {
  try {
    const item = localStorage.getItem(key);
    return item ? safeJsonParse(item, fallback) : fallback;
  } catch (e) {
    console.warn('[MatchPoint] LocalStorage read failed:', e.message);
    return fallback;
  }
}

export function setStored(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.warn('[MatchPoint] LocalStorage write failed:', e.message);
    return false;
  }
}

// ---- Performance Monitoring ----
export function measurePerformance(fn, label = 'operation') {
  return async function(...args) {
    const start = performance.now();
    try {
      const result = await fn.apply(this, args);
      const duration = performance.now() - start;
      console.log(`[MatchPoint Perf] ${label}: ${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.error(`[MatchPoint Perf] ${label} failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  };
}

// ---- Array Utilities ----
export function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export function removeDuplicates(array, keyFn = x => x) {
  const seen = new Set();
  return array.filter(item => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ---- String Utilities ----
export function sanitizeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function formatNumber(num, decimals = 2) {
  return Number(num).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

export function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

// ---- Event Helpers ----
export function createCustomEvent(type, detail = {}) {
  return new CustomEvent(type, { detail });
}

export function dispatchCustomEvent(type, detail = {}) {
  window.dispatchEvent(createCustomEvent(type, detail));
}

// ---- Animation Helpers ----
export function fadeIn(element, duration = 300) {
  element.style.opacity = '0';
  element.style.display = 'block';

  const start = performance.now();
  function animate(currentTime) {
    const elapsed = currentTime - start;
    const progress = Math.min(elapsed / duration, 1);

    element.style.opacity = progress.toString();

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }

  requestAnimationFrame(animate);
}

export function fadeOut(element, duration = 300) {
  const start = performance.now();
  const initialOpacity = parseFloat(getComputedStyle(element).opacity);

  function animate(currentTime) {
    const elapsed = currentTime - start;
    const progress = Math.min(elapsed / duration, 1);

    element.style.opacity = (initialOpacity * (1 - progress)).toString();

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      element.style.display = 'none';
    }
  }

  requestAnimationFrame(animate);
}

// ---- Network Helpers ----
export async function fetchWithTimeout(url, options = {}, timeout = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
}

export function isOnline() {
  return navigator.onLine;
}

// ---- Validation Helpers ----
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// ---- Color Helpers ----
export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

export function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// ---- Math Helpers ----
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function lerp(start, end, factor) {
  return start + (end - start) * factor;
}

export function mapRange(value, fromMin, fromMax, toMin, toMax) {
  return toMin + (value - fromMin) * (toMax - toMin) / (fromMax - fromMin);
}

// ---- Object Helpers ----
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function isEmpty(obj) {
  return obj == null || Object.keys(obj).length === 0;
}

export function pick(object, keys) {
  return keys.reduce((obj, key) => {
    if (key in object) {
      obj[key] = object[key];
    }
    return obj;
  }, {});
}

export function omit(object, keys) {
  const result = { ...object };
  keys.forEach(key => delete result[key]);
  return result;
}

// ---- Console Helpers ----
export function logWithTimestamp(message, level = 'log') {
  const timestamp = new Date().toISOString();
  console[level](`[${timestamp}] ${message}`);
}

export function createLogger(prefix = 'MatchPoint') {
  return {
    info: (msg) => console.info(`[${prefix}] ${msg}`),
    warn: (msg) => console.warn(`[${prefix}] ${msg}`),
    error: (msg) => console.error(`[${prefix}] ${msg}`),
    debug: (msg) => console.debug(`[${prefix}] ${msg}`)
  };
}

// ---- Browser Detection ----
export const BrowserInfo = {
  isChrome: /Chrome/.test(navigator.userAgent),
  isFirefox: /Firefox/.test(navigator.userAgent),
  isSafari: /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent),
  isEdge: /Edge/.test(navigator.userAgent),
  isMobile: /Mobi|Android/i.test(navigator.userAgent),
  supportsWebGL: !!document.createElement('canvas').getContext('webgl'),
  supportsWebAudio: !!(window.AudioContext || window.webkitAudioContext)
};

// ---- Feature Detection ----
export const FeatureSupport = {
  webRTC: !!(window.RTCPeerConnection || window.webkitRTCPeerConnection),
  webSockets: 'WebSocket' in window,
  serviceWorker: 'serviceWorker' in navigator,
  localStorage: (() => {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  })(),
  geolocation: 'geolocation' in navigator,
  notifications: 'Notification' in window,
  clipboard: navigator.clipboard !== undefined
};

// ---- Constants ----
export const Constants = {
  ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 300,
  THROTTLE_LIMIT: 100,
  API_TIMEOUT: 5000,
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000
};

// ---- Export Logger Instance ----
export const logger = createLogger('MatchPoint');