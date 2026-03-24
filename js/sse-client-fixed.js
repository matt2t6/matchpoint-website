/**
 * Fixed SSE Client with Race Condition Prevention
 * Thread-safe connection management and proper cleanup
 */
import { globalErrorHandler } from './error-handler.js';
import { globalCleanupManager } from './event-cleanup-manager.js';

export class SSEClient {
  constructor(options = {}) {
    this.options = {
      urls: ['/sse', 'http://localhost:5000/sse', 'http://127.0.0.1:5000/sse'],
      reconnectAttempts: 10,
      reconnectDelay: 1000,
      maxReconnectDelay: 32000,
      healthCheckInterval: 2000,
      heartbeatTimeout: 5000,
      ...options
    };

    // Connection state management
    this.eventSource = null;
    this.currentUrlIndex = 0;
    this.reconnectAttempt = 0;
    this.isConnecting = false;
    this.isConnected = false;
    this.lastHeartbeat = Date.now();

    // Timer management
    this.reconnectTimer = null;
    this.healthCheckTimer = null;

    // Cleanup management
    this.cleanupManager = globalCleanupManager.createScope('sse-client');

    // Bind methods to maintain context
    this.connect = this.connect.bind(this);
    this.reconnect = this.reconnect.bind(this);
    this.checkHealth = this.checkHealth.bind(this);
    this.handleOpen = this.handleOpen.bind(this);
    this.handleError = this.handleError.bind(this);
    this.handleMessage = this.handleMessage.bind(this);

    // Setup event handlers with cleanup
    this.setupEventHandlers();
  }

  /**
   * Setup event handlers with proper cleanup
   */
  setupEventHandlers() {
    // DOM ready handler
    this.cleanupManager.addEventListener(document, 'DOMContentLoaded', () => {
      if (location.protocol !== 'file:') {
        this.connect();
      }
    });

    // Replay handlers
    this.cleanupManager.addEventListener(window, 'mp:replay:golden', () =>
      this.handleReplay('/assets/replays/golden.json'));

    this.cleanupManager.addEventListener(window, 'mp:replay:solar_fast', () =>
      this.handleReplay('/assets/replays/fast_30s.json'));

    this.cleanupManager.addEventListener(window, 'mp:replay:solar_res', () =>
      this.handleReplay('/assets/replays/resilience_60s.json'));
  }

  /**
   * Connect to SSE endpoint with race condition prevention
   */
  connect() {
    // Prevent concurrent connection attempts
    if (this.isConnecting || this.isConnected) {
      return;
    }

    this.isConnecting = true;

    try {
      const url = this.options.urls[this.currentUrlIndex];
      this.eventSource = new EventSource(url);

      this.eventSource.onopen = this.handleOpen;
      this.eventSource.onerror = this.handleError;
      this.eventSource.onmessage = this.handleMessage;

    } catch (error) {
      this.isConnecting = false;
      globalErrorHandler.handleError('sse_connection_error', {
        message: 'Failed to create EventSource',
        error: error.message,
        url: this.options.urls[this.currentUrlIndex]
      });

      this.scheduleReconnect();
    }
  }

  /**
   * Handle successful connection opening
   */
  handleOpen() {
    this.isConnecting = false;
    this.isConnected = true;
    this.reconnectAttempt = 0;
    this.lastHeartbeat = Date.now();

    // Clear any existing timers
    this.clearReconnectTimer();
    this.clearHealthCheckTimer();

    // Start health checking
    this.healthCheckTimer = this.cleanupManager.addInterval(this.checkHealth, this.options.healthCheckInterval);

    // Dispatch connection event
    this.dispatch('mp:sse:open', { url: this.options.urls[this.currentUrlIndex] });
  }

  /**
   * Handle connection errors
   */
  handleError() {
    this.isConnecting = false;
    this.isConnected = false;

    // Clear timers
    this.clearHealthCheckTimer();

    // Close current connection
    this.closeConnection();

    // Dispatch error event
    this.dispatch('mp:sse:error', {
      attempt: this.reconnectAttempt,
      url: this.options.urls[this.currentUrlIndex]
    });

    // Schedule reconnection
    this.scheduleReconnect();
  }

  /**
   * Handle incoming messages
   * @param {MessageEvent} event - Message event
   */
  handleMessage(event) {
    this.lastHeartbeat = Date.now();

    try {
      const data = JSON.parse(event.data);

      // Dispatch heartbeat for any message
      this.dispatch('mp:sse:beat');

      // Dispatch specific message type
      if (data?.type) {
        this.dispatch(data.type, data.detail || {});
      }
    } catch (error) {
      globalErrorHandler.handleError('sse_message_parse_error', {
        message: 'Failed to parse SSE message',
        error: error.message,
        data: event.data
      });
    }
  }

  /**
   * Handle replay requests
   * @param {string} replayUrl - URL to replay file
   */
  async handleReplay(replayUrl) {
    try {
      const response = await fetch(replayUrl, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const payload = await response.json();
      const events = payload.events || [];

      this.dispatch('mp:replay:start');

      // Process events with proper timing
      let cursor = 0;
      const now = Date.now();
      let lastFire = 0;

      events.forEach(event => {
        let delay = 0;

        if (typeof event.delay === 'number') {
          cursor += Math.max(0, event.delay);
          delay = cursor;
        } else if (typeof event.ts === 'number') {
          delay = Math.max(0, event.ts - now);
        } else if (typeof event.offset_ms === 'number') {
          cursor += Math.max(0, event.offset_ms);
          delay = cursor;
        }

        lastFire = Math.max(lastFire, delay);

        this.cleanupManager.addTimer(() => {
          this.dispatch(event.type, event.detail);
        }, delay);
      });

      this.cleanupManager.addTimer(() => {
        this.dispatch('mp:replay:end');
      }, lastFire + 100);

    } catch (error) {
      globalErrorHandler.handleError('sse_replay_error', {
        message: 'Failed to load replay file',
        error: error.message,
        url: replayUrl
      });

      // Fallback replay
      this.dispatch('mp:replay:start');
      this.cleanupManager.addTimer(() => {
        this.dispatch('mp:replay:end');
      }, 300);
    }
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  scheduleReconnect() {
    if (this.reconnectTimer) return;

    const delay = Math.min(
      this.options.reconnectDelay * Math.pow(2, this.reconnectAttempt),
      this.options.maxReconnectDelay
    );

    this.reconnectAttempt++;

    this.dispatch('mp:sse:reconnecting', {
      attempt: this.reconnectAttempt,
      delay,
      maxAttempts: this.options.reconnectAttempts
    });

    this.reconnectTimer = this.cleanupManager.addTimer(() => {
      this.reconnectTimer = null;

      if (this.reconnectAttempt >= this.options.reconnectAttempts) {
        globalErrorHandler.handleError('sse_max_reconnect_attempts', {
          message: 'Maximum reconnection attempts reached',
          attempts: this.reconnectAttempt
        });
        return;
      }

      this.tryNextUrl();
    }, delay);
  }

  /**
   * Try connecting to the next URL in the list
   */
  tryNextUrl() {
    this.currentUrlIndex = (this.currentUrlIndex + 1) % this.options.urls.length;
    this.connect();
  }

  /**
   * Health check for connection liveness
   */
  checkHealth() {
    const now = Date.now();
    const timeSinceLastBeat = now - this.lastHeartbeat;

    if (timeSinceLastBeat > this.options.heartbeatTimeout) {
      this.dispatch('mp:sse:health', {
        healthy: false,
        lastHeartbeat: this.lastHeartbeat,
        timeSinceLastBeat
      });

      if (!this.reconnectTimer) {
        this.handleError();
      }
    } else {
      this.dispatch('mp:sse:health', {
        healthy: true,
        lastHeartbeat: this.lastHeartbeat,
        timeSinceLastBeat
      });
    }
  }

  /**
   * Dispatch custom event safely
   * @param {string} type - Event type
   * @param {Object} detail - Event detail
   */
  dispatch(type, detail = {}) {
    try {
      window.dispatchEvent(new CustomEvent(type, { detail }));
    } catch (error) {
      globalErrorHandler.handleError('sse_dispatch_error', {
        message: 'Failed to dispatch SSE event',
        error: error.message,
        type,
        detail
      });
    }
  }

  /**
   * Close current connection
   */
  closeConnection() {
    if (this.eventSource) {
      try {
        this.eventSource.close();
      } catch (error) {
        globalErrorHandler.handleError('sse_close_error', {
          message: 'Error closing SSE connection',
          error: error.message
        });
      }
      this.eventSource = null;
    }
  }

  /**
   * Clear reconnect timer
   */
  clearReconnectTimer() {
    if (this.reconnectTimer) {
      this.cleanupManager.clearTimer(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Clear health check timer
   */
  clearHealthCheckTimer() {
    if (this.healthCheckTimer) {
      this.cleanupManager.clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
  }

  /**
   * Get connection status
   * @returns {Object} Connection status information
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      currentUrl: this.options.urls[this.currentUrlIndex],
      reconnectAttempt: this.reconnectAttempt,
      lastHeartbeat: this.lastHeartbeat,
      timeSinceLastHeartbeat: Date.now() - this.lastHeartbeat
    };
  }

  /**
   * Cleanup all resources
   */
  cleanup() {
    this.closeConnection();
    this.clearReconnectTimer();
    this.clearHealthCheckTimer();
    this.cleanupManager.cleanup();
  }
}

// Global SSE client instance
export const sseClient = new SSEClient();

// Auto-initialize if DOM is already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Connection will be initialized via setupEventHandlers
  });
} else {
  // DOM already loaded, connect immediately if not file://
  if (location.protocol !== 'file:') {
    sseClient.connect();
  }
}