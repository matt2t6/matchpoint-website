/**
 * Centralized Scroll Handler Management System
 * Consolidates all scroll event listeners to prevent performance issues
 * and provides proper cleanup mechanisms
 */
export class ScrollManager {
  constructor() {
    this.handlers = new Map();
    this.isListening = false;
    this.throttleMs = 16; // ~60fps
    this.lastScrollTime = 0;
    this.pendingCallbacks = new Set();
  }

  /**
   * Add a scroll handler with automatic throttling and cleanup
   * @param {string} id - Unique identifier for the handler
   * @param {Function} callback - Function to call on scroll
   * @param {Object} options - Configuration options
   * @param {number} options.throttle - Throttle delay in ms (default: 16)
   * @param {boolean} options.passive - Use passive event listener (default: true)
   * @param {Object} options.context - Context to bind the callback to
   */
  addHandler(id, callback, options = {}) {
    const {
      throttle = this.throttleMs,
      passive = true,
      context = null
    } = options;

    if (this.handlers.has(id)) {
      console.warn(`Scroll handler '${id}' already exists. Removing old handler.`);
      this.removeHandler(id);
    }

    const handler = {
      id,
      callback: context ? callback.bind(context) : callback,
      throttle,
      lastCall: 0,
      options: { passive }
    };

    this.handlers.set(id, handler);

    if (!this.isListening) {
      this.startListening();
    }

    return () => this.removeHandler(id); // Return cleanup function
  }

  /**
   * Remove a specific scroll handler
   * @param {string} id - Handler identifier to remove
   */
  removeHandler(id) {
    this.handlers.delete(id);
    if (this.handlers.size === 0 && this.isListening) {
      this.stopListening();
    }
  }

  /**
   * Remove all scroll handlers
   */
  removeAllHandlers() {
    this.handlers.clear();
    if (this.isListening) {
      this.stopListening();
    }
  }

  /**
   * Start listening for scroll events
   */
  startListening() {
    if (this.isListening) return;

    this.isListening = true;
    window.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });
  }

  /**
   * Stop listening for scroll events
   */
  stopListening() {
    if (!this.isListening) return;

    this.isListening = false;
    window.removeEventListener('scroll', this.handleScroll.bind(this));
    this.pendingCallbacks.clear();
  }

  /**
   * Main scroll event handler with throttling
   * @param {Event} event - Scroll event
   */
  handleScroll(event) {
    const now = performance.now();

    // Throttle to prevent excessive calls
    if (now - this.lastScrollTime < this.throttleMs) {
      return;
    }

    this.lastScrollTime = now;

    // Execute all handlers
    for (const handler of this.handlers.values()) {
      try {
        handler.callback(event);
      } catch (error) {
        console.error(`Error in scroll handler '${handler.id}':`, error);
      }
    }
  }

  /**
   * Get all registered handler IDs
   * @returns {string[]} Array of handler IDs
   */
  getHandlerIds() {
    return Array.from(this.handlers.keys());
  }

  /**
   * Check if a handler is registered
   * @param {string} id - Handler identifier
   * @returns {boolean} True if handler exists
   */
  hasHandler(id) {
    return this.handlers.has(id);
  }

  /**
   * Get handler information
   * @param {string} id - Handler identifier
   * @returns {Object|null} Handler info or null if not found
   */
  getHandler(id) {
    return this.handlers.get(id) || null;
  }
}

// Global scroll manager instance
export const scrollManager = new ScrollManager();

// Auto-cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    scrollManager.removeAllHandlers();
  });
}