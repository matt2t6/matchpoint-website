/**
 * Interval Manager - Prevents memory leaks from unmanaged intervals
 * Provides centralized tracking and cleanup of all intervals
 */

// Global interval registry
window.__mpIntervals = window.__mpIntervals || [];

export function createManagedInterval(fn, delay, name = 'unnamed') {
  const id = setInterval(fn, delay);
  window.__mpIntervals.push({
    id,
    name,
    fn: fn.toString().substring(0, 50) + '...',
    created: Date.now()
  });
  console.log(`🕒 Created managed interval: ${name} (${id})`);
  return id;
}

export function clearManagedInterval(id, name = 'unnamed') {
  const index = window.__mpIntervals.findIndex(interval => interval.id === id);
  if (index > -1) {
    window.__mpIntervals.splice(index, 1);
    console.log(`🕒 Cleared managed interval: ${name} (${id})`);
  }
  return clearInterval(id);
}

export function clearAllManagedIntervals() {
  console.log(`🕒 Clearing ${window.__mpIntervals.length} managed intervals`);
  window.__mpIntervals.forEach(interval => {
    clearInterval(interval.id);
  });
  window.__mpIntervals = [];
}

export function getActiveIntervals() {
  return [...window.__mpIntervals];
}

// Enhanced cleanup on page unload
window.addEventListener("beforeunload", () => {
  clearAllManagedIntervals();
  console.log('🧹 All managed intervals cleared on page unload');
});

// Cleanup on visibility change (when tab becomes hidden)
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    console.log('👁️ Tab hidden - intervals still active but page paused');
  } else {
    console.log('👁️ Tab visible - resuming normal operation');
  }
});