/**
 * Comprehensive Event Listener Cleanup Framework
 * Provides automatic cleanup, resource management, and memory leak prevention
 */
export class EventCleanupManager {
  constructor(namespace = 'default') {
    this.namespace = namespace;
    this.listeners = new Map();
    this.timers = new Map();
    this.intervals = new Map();
    this.cleanupFunctions = new Set();
    this.isDestroyed = false;
  }

  /**
   * Add an event listener with automatic cleanup tracking
   * @param {Element|Window|Document} target - Event target
   * @param {string} event - Event name
   * @param {Function} handler - Event handler function
   * @param {Object} options - Event listener options
   * @returns {Function} Cleanup function
   */
  addEventListener(target, event, handler, options = {}) {
    if (this.isDestroyed) {
      console.warn('EventCleanupManager is destroyed, cannot add listeners');
      return () => {};
    }

    // Bind handler to maintain context
    const boundHandler = options.context ? handler.bind(options.context) : handler;

    // Add the event listener
    target.addEventListener(event, boundHandler, options);

    // Track for cleanup
    const id = `${target.constructor.name}_${event}_${Date.now()}_${Math.random()}`;
    this.listeners.set(id, {
      target,
      event,
      handler: boundHandler,
      options,
      originalHandler: handler
    });

    // Return cleanup function
    const cleanup = () => {
      this.removeEventListener(id);
    };

    // Auto-cleanup on page unload if specified
    if (options.autoCleanup !== false) {
      this.addCleanupFunction(cleanup);
    }

    return cleanup;
  }

  /**
   * Remove a specific event listener
   * @param {string} id - Listener ID to remove
   */
  removeEventListener(id) {
    const listener = this.listeners.get(id);
    if (!listener) return;

    const { target, event, handler, options } = listener;
    target.removeEventListener(event, handler, options);
    this.listeners.delete(id);
  }

  /**
   * Add a timer with automatic cleanup tracking
   * @param {Function} callback - Timer callback
   * @param {number} delay - Delay in milliseconds
   * @returns {number} Timer ID
   */
  addTimer(callback, delay) {
    if (this.isDestroyed) {
      console.warn('EventCleanupManager is destroyed, cannot add timers');
      return 0;
    }

    const timerId = setTimeout(() => {
      this.timers.delete(timerId);
      callback();
    }, delay);

    this.timers.set(timerId, { callback, delay, created: Date.now() });
    return timerId;
  }

  /**
   * Add an interval with automatic cleanup tracking
   * @param {Function} callback - Interval callback
   * @param {number} interval - Interval in milliseconds
   * @returns {number} Interval ID
   */
  addInterval(callback, interval) {
    if (this.isDestroyed) {
      console.warn('EventCleanupManager is destroyed, cannot add intervals');
      return 0;
    }

    const intervalId = setInterval(callback, interval);
    this.intervals.set(intervalId, { callback, interval, created: Date.now() });
    return intervalId;
  }

  /**
   * Clear a specific timer
   * @param {number} timerId - Timer ID to clear
   */
  clearTimer(timerId) {
    if (this.timers.has(timerId)) {
      clearTimeout(timerId);
      this.timers.delete(timerId);
    }
  }

  /**
   * Clear a specific interval
   * @param {number} intervalId - Interval ID to clear
   */
  clearInterval(intervalId) {
    if (this.intervals.has(intervalId)) {
      clearInterval(intervalId);
      this.intervals.delete(intervalId);
    }
  }

  /**
   * Add a custom cleanup function
   * @param {Function} cleanupFn - Function to call during cleanup
   */
  addCleanupFunction(cleanupFn) {
    if (this.isDestroyed) {
      console.warn('EventCleanupManager is destroyed, cannot add cleanup functions');
      return;
    }

    this.cleanupFunctions.add(cleanupFn);

    // Also register for page unload
    if (typeof window !== 'undefined') {
      const pageCleanup = () => {
        try {
          cleanupFn();
        } catch (error) {
          console.error('Error in cleanup function:', error);
        }
      };

      window.addEventListener('beforeunload', pageCleanup, { once: true });
    }
  }

  /**
   * Remove a cleanup function
   * @param {Function} cleanupFn - Cleanup function to remove
   */
  removeCleanupFunction(cleanupFn) {
    this.cleanupFunctions.delete(cleanupFn);
  }

  /**
   * Clean up all tracked resources
   */
  cleanup() {
    if (this.isDestroyed) return;

    // Clear all event listeners
    for (const [id, listener] of this.listeners) {
      try {
        const { target, event, handler, options } = listener;
        target.removeEventListener(event, handler, options);
      } catch (error) {
        console.error('Error removing event listener:', error);
      }
    }
    this.listeners.clear();

    // Clear all timers
    for (const [timerId] of this.timers) {
      try {
        clearTimeout(timerId);
      } catch (error) {
        console.error('Error clearing timer:', error);
      }
    }
    this.timers.clear();

    // Clear all intervals
    for (const [intervalId] of this.intervals) {
      try {
        clearInterval(intervalId);
      } catch (error) {
        console.error('Error clearing interval:', error);
      }
    }
    this.intervals.clear();

    // Execute all cleanup functions
    for (const cleanupFn of this.cleanupFunctions) {
      try {
        cleanupFn();
      } catch (error) {
        console.error('Error in cleanup function:', error);
      }
    }
    this.cleanupFunctions.clear();

    this.isDestroyed = true;
  }

  /**
   * Get statistics about tracked resources
   * @returns {Object} Resource statistics
   */
  getStats() {
    return {
      listeners: this.listeners.size,
      timers: this.timers.size,
      intervals: this.intervals.size,
      cleanupFunctions: this.cleanupFunctions.size,
      isDestroyed: this.isDestroyed
    };
  }

  /**
   * Create a scoped cleanup manager for a specific component or module
   * @param {string} scopeName - Name of the scope
   * @returns {Object} Scoped cleanup manager
   */
  createScope(scopeName) {
    const scope = new EventCleanupManager(`${this.namespace}_${scopeName}`);

    // Add scope cleanup to this manager
    this.addCleanupFunction(() => scope.cleanup());

    return scope;
  }
}

// Global cleanup manager instance
export const globalCleanupManager = new EventCleanupManager('global');

// Auto-cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    globalCleanupManager.cleanup();
  });
}

// Utility function for easy scoped usage
export function withCleanup(namespace, fn) {
  const manager = new EventCleanupManager(namespace);

  try {
    return fn(manager);
  } finally {
    manager.cleanup();
  }
}