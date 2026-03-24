/**
 * Standardized JavaScript Error Handling System
 * Provides consistent error logging, reporting, and recovery mechanisms
 */
export class ErrorHandler {
  constructor(options = {}) {
    this.options = {
      enableConsoleLogging: true,
      enableRemoteLogging: false,
      logLevel: 'error', // 'debug', 'info', 'warn', 'error'
      remoteEndpoint: '/api/errors',
      maxRetries: 3,
      retryDelay: 1000,
      ...options
    };

    this.errorQueue = [];
    this.isOnline = navigator.onLine;
    this.sessionId = this.generateSessionId();

    this.setupGlobalErrorHandling();
    this.setupNetworkMonitoring();
  }

  /**
   * Generate a unique session ID for error tracking
   * @returns {string} Session ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Setup global error handling for unhandled errors and promise rejections
   */
  setupGlobalErrorHandling() {
    // Handle unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.handleError('javascript_error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.stack || event.error?.toString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString()
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError('promise_rejection', {
        reason: event.reason?.stack || event.reason?.toString(),
        promise: event.promise?.toString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Setup network status monitoring
   */
  setupNetworkMonitoring() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushErrorQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  /**
   * Main error handling method
   * @param {string} type - Error type/category
   * @param {Object} details - Error details
   * @param {Object} options - Handling options
   */
  handleError(type, details, options = {}) {
    const errorInfo = {
      type,
      details,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      ...options
    };

    // Console logging
    if (this.options.enableConsoleLogging) {
      this.logToConsole(type, errorInfo);
    }

    // Queue for remote logging
    if (this.options.enableRemoteLogging) {
      this.queueForRemoteLogging(errorInfo);
    }

    // User notification for critical errors
    if (options.notifyUser && this.shouldNotifyUser(type)) {
      this.notifyUser(type, details);
    }

    return errorInfo;
  }

  /**
   * Log error to console with appropriate level
   * @param {string} type - Error type
   * @param {Object} errorInfo - Error information
   */
  logToConsole(type, errorInfo) {
    const message = `[${type.toUpperCase()}] ${errorInfo.details.message || 'Unknown error'}`;
    const data = {
      type,
      details: errorInfo.details,
      sessionId: errorInfo.sessionId,
      url: errorInfo.url
    };

    switch (this.options.logLevel) {
      case 'debug':
        console.debug(message, data);
        break;
      case 'info':
        console.info(message, data);
        break;
      case 'warn':
        console.warn(message, data);
        break;
      case 'error':
      default:
        console.error(message, data);
        break;
    }
  }

  /**
   * Queue error for remote logging
   * @param {Object} errorInfo - Error information
   */
  queueForRemoteLogging(errorInfo) {
    this.errorQueue.push(errorInfo);

    // Auto-flush if online and queue is getting large
    if (this.isOnline && this.errorQueue.length >= 10) {
      this.flushErrorQueue();
    }
  }

  /**
   * Flush queued errors to remote endpoint
   */
  async flushErrorQueue() {
    if (!this.isOnline || this.errorQueue.length === 0) return;

    const errorsToSend = [...this.errorQueue];
    this.errorQueue = [];

    try {
      await fetch(this.options.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          errors: errorsToSend,
          sessionId: this.sessionId,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      // Re-queue errors if remote logging fails
      this.errorQueue.unshift(...errorsToSend);
      console.error('Failed to send error logs:', error);
    }
  }

  /**
   * Determine if user should be notified about an error
   * @param {string} type - Error type
   * @returns {boolean} Whether to notify user
   */
  shouldNotifyUser(type) {
    const criticalErrors = [
      'javascript_error',
      'network_error',
      'authentication_error',
      'payment_error'
    ];

    return criticalErrors.includes(type);
  }

  /**
   * Show user-friendly error notification
   * @param {string} type - Error type
   * @param {Object} details - Error details
   */
  notifyUser(type, details) {
    // Dispatch custom event for UI components to handle
    window.dispatchEvent(new CustomEvent('mp:error:user-notification', {
      detail: {
        type,
        message: this.getUserFriendlyMessage(type, details),
        canRetry: this.canRetry(type)
      }
    }));
  }

  /**
   * Get user-friendly error message
   * @param {string} type - Error type
   * @param {Object} details - Error details
   * @returns {string} User-friendly message
   */
  getUserFriendlyMessage(type, details) {
    const messages = {
      'javascript_error': 'An unexpected error occurred. Please refresh the page.',
      'network_error': 'Connection problem. Please check your internet connection.',
      'authentication_error': 'Please log in again.',
      'permission_error': 'You don\'t have permission to perform this action.',
      'validation_error': details.message || 'Please check your input and try again.',
      'rate_limit_error': 'Too many requests. Please wait a moment and try again.',
      'server_error': 'Server error. Please try again later.',
      'timeout_error': 'Request timed out. Please try again.'
    };

    return messages[type] || 'Something went wrong. Please try again.';
  }

  /**
   * Check if an error type can be retried
   * @param {string} type - Error type
   * @returns {boolean} Whether the operation can be retried
   */
  canRetry(type) {
    const retryableErrors = [
      'network_error',
      'timeout_error',
      'server_error',
      'rate_limit_error'
    ];

    return retryableErrors.includes(type);
  }

  /**
   * Wrap an async function with error handling
   * @param {Function} fn - Function to wrap
   * @param {Object} options - Wrapping options
   * @returns {Function} Wrapped function
   */
  wrapAsync(fn, options = {}) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        this.handleError(options.errorType || 'async_error', {
          message: error.message,
          stack: error.stack,
          functionName: fn.name || 'anonymous'
        }, options);

        // Re-throw if not handled
        if (!options.preventThrow) {
          throw error;
        }
      }
    };
  }

  /**
   * Wrap an event handler with error handling
   * @param {Function} handler - Event handler to wrap
   * @param {Object} options - Wrapping options
   * @returns {Function} Wrapped event handler
   */
  wrapEventHandler(handler, options = {}) {
    return (event) => {
      try {
        return handler(event);
      } catch (error) {
        this.handleError(options.errorType || 'event_handler_error', {
          message: error.message,
          stack: error.stack,
          eventType: event?.type || 'unknown',
          handlerName: handler.name || 'anonymous'
        }, options);
      }
    };
  }

  /**
   * Manual error reporting
   * @param {string} type - Error type
   * @param {string} message - Error message
   * @param {Object} context - Additional context
   */
  reportError(type, message, context = {}) {
    this.handleError(type, {
      message,
      ...context
    });
  }

  /**
   * Get error statistics
   * @returns {Object} Error statistics
   */
  getStats() {
    return {
      queuedErrors: this.errorQueue.length,
      isOnline: this.isOnline,
      sessionId: this.sessionId,
      logLevel: this.options.logLevel
    };
  }
}

// Global error handler instance
export const globalErrorHandler = new ErrorHandler();

// Utility functions for easy usage
export const handleError = (type, details, options) =>
  globalErrorHandler.handleError(type, details, options);

export const wrapAsync = (fn, options) =>
  globalErrorHandler.wrapAsync(fn, options);

export const wrapEventHandler = (handler, options) =>
  globalErrorHandler.wrapEventHandler(handler, options);

export const reportError = (type, message, context) =>
  globalErrorHandler.reportError(type, message, context);