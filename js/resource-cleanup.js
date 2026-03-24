/**
 * Resource Cleanup Utilities
 * Provides comprehensive cleanup for timers, intervals, event listeners, and other resources
 */
import { globalCleanupManager } from './event-cleanup-manager.js';

export class ResourceCleanupManager {
  constructor(namespace = 'resource-manager') {
    this.namespace = namespace;
    this.cleanupManager = globalCleanupManager.createScope(namespace);
    this.resources = new Map();
    this.finalizers = new Set();
  }

  /**
   * Register a resource for cleanup
   * @param {string} id - Unique resource identifier
   * @param {Object} resource - Resource object with cleanup method
   * @param {Function} cleanupFn - Cleanup function for this resource
   */
  registerResource(id, resource, cleanupFn) {
    if (this.resources.has(id)) {
      console.warn(`Resource '${id}' already registered. Overwriting.`);
    }

    this.resources.set(id, {
      resource,
      cleanupFn,
      registeredAt: Date.now()
    });

    return () => this.unregisterResource(id);
  }

  /**
   * Unregister a resource
   * @param {string} id - Resource identifier to remove
   */
  unregisterResource(id) {
    const resourceInfo = this.resources.get(id);
    if (resourceInfo) {
      try {
        if (resourceInfo.cleanupFn) {
          resourceInfo.cleanupFn();
        }
      } catch (error) {
        console.error(`Error cleaning up resource '${id}':`, error);
      }
      this.resources.delete(id);
    }
  }

  /**
   * Register a finalizer function that will be called during cleanup
   * @param {Function} finalizerFn - Function to call during cleanup
   */
  registerFinalizer(finalizerFn) {
    this.finalizers.add(finalizerFn);
    return () => this.finalizers.delete(finalizerFn);
  }

  /**
   * Create a managed timer that auto-registers for cleanup
   * @param {Function} callback - Timer callback
   * @param {number} delay - Delay in milliseconds
   * @param {string} id - Optional timer identifier
   * @returns {number} Timer ID
   */
  createManagedTimer(callback, delay, id = null) {
    const timerId = this.cleanupManager.addTimer(callback, delay);

    if (id) {
      this.registerResource(`timer_${id}`, { timerId }, () => {
        this.cleanupManager.clearTimer(timerId);
      });
    }

    return timerId;
  }

  /**
   * Create a managed interval that auto-registers for cleanup
   * @param {Function} callback - Interval callback
   * @param {number} interval - Interval in milliseconds
   * @param {string} id - Optional interval identifier
   * @returns {number} Interval ID
   */
  createManagedInterval(callback, interval, id = null) {
    const intervalId = this.cleanupManager.addInterval(callback, interval);

    if (id) {
      this.registerResource(`interval_${id}`, { intervalId }, () => {
        this.cleanupManager.clearInterval(intervalId);
      });
    }

    return intervalId;
  }

  /**
   * Create a managed event listener that auto-registers for cleanup
   * @param {Element} target - Event target
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   * @param {Object} options - Event listener options
   * @param {string} id - Optional listener identifier
   * @returns {Function} Cleanup function
   */
  createManagedEventListener(target, event, handler, options = {}, id = null) {
    const cleanup = this.cleanupManager.addEventListener(target, event, handler, options);

    if (id) {
      this.registerResource(`listener_${id}`, { target, event, handler }, cleanup);
    }

    return cleanup;
  }

  /**
   * Create a managed animation frame that auto-registers for cleanup
   * @param {Function} callback - Animation frame callback
   * @param {string} id - Optional animation frame identifier
   * @returns {number} Animation frame ID
   */
  createManagedAnimationFrame(callback, id = null) {
    if (typeof requestAnimationFrame === 'undefined') {
      console.warn('requestAnimationFrame not available');
      return 0;
    }

    const frameId = requestAnimationFrame(callback);

    if (id) {
      this.registerResource(`animation_${id}`, { frameId }, () => {
        if (typeof cancelAnimationFrame !== 'undefined') {
          cancelAnimationFrame(frameId);
        }
      });
    }

    return frameId;
  }

  /**
   * Register a DOM element for cleanup
   * @param {Element} element - DOM element
   * @param {string} id - Element identifier
   */
  registerElement(element, id) {
    return this.registerResource(`element_${id}`, element, () => {
      if (element && element.parentNode) {
        element.parentNode.removeChild(element);
      }
    });
  }

  /**
   * Register an object with a destroy/dispose method
   * @param {Object} obj - Object with destroy/dispose method
   * @param {string} id - Object identifier
   */
  registerDisposableObject(obj, id) {
    return this.registerResource(`disposable_${id}`, obj, () => {
      if (obj && typeof obj.destroy === 'function') {
        obj.destroy();
      } else if (obj && typeof obj.dispose === 'function') {
        obj.dispose();
      } else if (obj && typeof obj.cleanup === 'function') {
        obj.cleanup();
      }
    });
  }

  /**
   * Create a promise with automatic cleanup on timeout
   * @param {Promise} promise - Promise to manage
   * @param {number} timeout - Timeout in milliseconds
   * @param {string} id - Optional promise identifier
   * @returns {Promise} Managed promise
   */
  createManagedPromise(promise, timeout = 5000, id = null) {
    let timeoutId = null;
    let cleanupPromise = null;

    const managedPromise = new Promise((resolve, reject) => {
      // Set up timeout
      timeoutId = this.createManagedTimer(() => {
        reject(new Error(`Promise timeout after ${timeout}ms`));
      }, timeout, id ? `promise_timeout_${id}` : undefined);

      // Handle promise resolution
      cleanupPromise = promise
        .then(result => {
          if (timeoutId) {
            this.cleanupManager.clearTimer(timeoutId);
          }
          resolve(result);
        })
        .catch(error => {
          if (timeoutId) {
            this.cleanupManager.clearTimer(timeoutId);
          }
          reject(error);
        });
    });

    if (id) {
      this.registerResource(`promise_${id}`, { promise: managedPromise }, () => {
        if (timeoutId) {
          this.cleanupManager.clearTimer(timeoutId);
        }
      });
    }

    return managedPromise;
  }

  /**
   * Clean up all registered resources
   */
  cleanup() {
    // Execute all finalizers
    for (const finalizer of this.finalizers) {
      try {
        finalizer();
      } catch (error) {
        console.error('Error in finalizer:', error);
      }
    }
    this.finalizers.clear();

    // Clean up all resources
    for (const [id] of this.resources) {
      this.unregisterResource(id);
    }
    this.resources.clear();

    // Clean up the cleanup manager
    this.cleanupManager.cleanup();
  }

  /**
   * Get statistics about managed resources
   * @returns {Object} Resource statistics
   */
  getStats() {
    return {
      resources: this.resources.size,
      finalizers: this.finalizers.size,
      cleanupManagerStats: this.cleanupManager.getStats()
    };
  }

  /**
   * Create a resource scope for component lifecycle management
   * @param {string} componentName - Name of the component
   * @returns {ResourceCleanupManager} Scoped cleanup manager
   */
  createComponentScope(componentName) {
    const scope = new ResourceCleanupManager(`${this.namespace}_${componentName}`);

    // Register scope cleanup
    this.registerFinalizer(() => scope.cleanup());

    return scope;
  }
}

// Global resource cleanup manager
export const globalResourceManager = new ResourceCleanupManager('global');

// Utility functions for common cleanup patterns
export const cleanupUtils = {
  /**
   * Create a debounced function with automatic cleanup
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @param {string} id - Optional debounce identifier
   * @returns {Function} Debounced function
   */
  debounce: (func, wait, id = null) => {
    let timeoutId = null;

    const debouncedFunc = function(...args) {
      const context = this;

      if (timeoutId) {
        globalResourceManager.cleanupManager.clearTimer(timeoutId);
      }

      timeoutId = globalResourceManager.cleanupManager.addTimer(() => {
        func.apply(context, args);
      }, wait);

      if (id) {
        globalResourceManager.registerResource(`debounce_${id}`, { timeoutId }, () => {
          if (timeoutId) {
            globalResourceManager.cleanupManager.clearTimer(timeoutId);
          }
        });
      }
    };

    return debouncedFunc;
  },

  /**
   * Create a throttled function with automatic cleanup
   * @param {Function} func - Function to throttle
   * @param {number} limit - Throttle limit in milliseconds
   * @param {string} id - Optional throttle identifier
   * @returns {Function} Throttled function
   */
  throttle: (func, limit, id = null) => {
    let inThrottle = false;

    const throttledFunc = function(...args) {
      const context = this;

      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;

        const timeoutId = globalResourceManager.cleanupManager.addTimer(() => {
          inThrottle = false;
        }, limit);

        if (id) {
          globalResourceManager.registerResource(`throttle_${id}`, { timeoutId }, () => {
            if (timeoutId) {
              globalResourceManager.cleanupManager.clearTimer(timeoutId);
            }
          });
        }
      }
    };

    return throttledFunc;
  },

  /**
   * Create a managed WebSocket connection
   * @param {string} url - WebSocket URL
   * @param {Object} handlers - Event handlers
   * @param {string} id - Optional WebSocket identifier
   * @returns {WebSocket} Managed WebSocket
   */
  createManagedWebSocket: (url, handlers = {}, id = null) => {
    const ws = new WebSocket(url);

    const cleanup = () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };

    if (id) {
      globalResourceManager.registerResource(`websocket_${id}`, ws, cleanup);
    }

    // Setup event handlers
    if (handlers.onopen) ws.onopen = handlers.onopen;
    if (handlers.onmessage) ws.onmessage = handlers.onmessage;
    if (handlers.onerror) ws.onerror = handlers.onerror;
    if (handlers.onclose) ws.onclose = handlers.onclose;

    return ws;
  },

  /**
   * Create a managed fetch request with timeout
   * @param {string} url - Request URL
   * @param {Object} options - Fetch options
   * @param {number} timeout - Timeout in milliseconds
   * @param {string} id - Optional request identifier
   * @returns {Promise} Managed fetch promise
   */
  createManagedFetch: async (url, options = {}, timeout = 5000, id = null) => {
    const controller = new AbortController();
    const timeoutId = globalResourceManager.cleanupManager.addTimer(() => {
      controller.abort();
    }, timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      if (timeoutId) {
        globalResourceManager.cleanupManager.clearTimer(timeoutId);
      }

      return response;
    } catch (error) {
      if (timeoutId) {
        globalResourceManager.cleanupManager.clearTimer(timeoutId);
      }

      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }

      throw error;
    }
  }
};

// Auto-cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    globalResourceManager.cleanup();
  });

  // Also cleanup on visibility change (when tab becomes hidden)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Optional: cleanup some resources when tab becomes hidden
      // globalResourceManager.cleanup();
    }
  });
}

// Export convenience functions
export const registerResource = (id, resource, cleanupFn) =>
  globalResourceManager.registerResource(id, resource, cleanupFn);

export const createManagedTimer = (callback, delay, id) =>
  globalResourceManager.createManagedTimer(callback, delay, id);

export const createManagedInterval = (callback, interval, id) =>
  globalResourceManager.createManagedInterval(callback, interval, id);

export const createManagedEventListener = (target, event, handler, options, id) =>
  globalResourceManager.createManagedEventListener(target, event, handler, options, id);