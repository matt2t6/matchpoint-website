// MatchPoint Utils - Essential utility functions for the demo system
// Provides missing functions that app.js depends on

// jQuery-like selector function
export function $(selector) {
  if (typeof selector === 'string') {
    return document.querySelector(selector);
  }
  return selector;
}

// Text setting utility (safe DOM manipulation)
export function setText(id, value, formatter) {
  const el = document.getElementById(id);
  if (!el) return;

  let text = value;
  if (value === null || value === undefined) return;

  if (typeof formatter === "function") {
    try {
      text = formatter(value);
    } catch (err) {
      console.warn("[Utils] formatter failed for", id, err);
    }
  }

  el.textContent = String(text);
}

// Safe HTML setting utility
export function setHTMLStatic(id, html) {
  const el = document.getElementById(id);
  if (!el) return;

  // Clear existing content
  el.innerHTML = '';

  // Only set HTML if provided and safe
  if (html && typeof html === 'string') {
    el.innerHTML = html;
  }
}

// Enhanced interval management
const intervalRegistry = new Set();

export function createInterval(callback, delay, ...args) {
  const id = setInterval(callback, delay, ...args);
  intervalRegistry.add(id);
  return id;
}

export function clearAllIntervals() {
  intervalRegistry.forEach(id => {
    try {
      clearInterval(id);
    } catch (e) {
      console.warn("[Utils] Failed to clear interval:", id);
    }
  });
  intervalRegistry.clear();
}

// API base URL configuration
export const API_BASE_URL = (window.__MP__ && window.__MP__.API) || '';

// Seeded random number generator for deterministic demo data
export function makeSeededRNG(seed = 42) {
  let m = 2 ** 35 - 31;
  let a = 185852;
  let s = seed % m;

  return function() {
    return (s = (s * a) % m) / m;
  };
}

// Kalman filter chart initialization (placeholder for now)
export function initializeKalmanChart() {
  console.log("[Utils] Kalman chart initialization placeholder");
  // This would initialize the Kalman filter chart
  // For now, it's handled in app.js
}

// Export other utilities that might be needed
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Safe event listener attachment
export function safeAddEventListener(element, event, handler, options = {}) {
  if (!element || typeof element.addEventListener !== 'function') {
    console.warn("[Utils] Cannot add event listener to:", element);
    return;
  }

  try {
    element.addEventListener(event, handler, options);
  } catch (error) {
    console.error("[Utils] Failed to add event listener:", error);
  }
}

// Safe element removal
export function safeRemoveElement(element) {
  if (element && element.parentNode) {
    try {
      element.parentNode.removeChild(element);
    } catch (error) {
      console.error("[Utils] Failed to remove element:", error);
    }
  }
}

// Animation utilities
export function animateValue(elementId, start, end, duration = 1000, suffix = "") {
  const element = document.getElementById(elementId);
  if (!element) return;

  let startTime = null;
  const step = (timestamp) => {
    if (!startTime) startTime = timestamp;
    const progress = Math.min((timestamp - startTime) / duration, 1);

    // Easing function for smooth animation
    const easeOutQuart = 1 - Math.pow(1 - progress, 4);
    const current = start + (end - start) * easeOutQuart;

    element.textContent = Math.round(current) + suffix;

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  };

  requestAnimationFrame(step);
}

// Cleanup function for when page unloads
export function cleanupUtils() {
  clearAllIntervals();
  console.log("[Utils] Cleanup completed");
}

// Auto-cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', cleanupUtils);
}

console.log("[Utils] MatchPoint utilities loaded successfully");