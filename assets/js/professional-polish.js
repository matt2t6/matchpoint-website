/**
 * Professional Polish & Reliability Engine for MatchPoint Systems
 *
 * Implements comprehensive professional polish including:
 * - Scene Transitions: Smooth transitions between demo sections and states
 * - Offline Demo Mode: Full functionality when network is unavailable
 * - Demo Analytics: Track engagement and interest points during presentations
 * - Error Recovery: Automatic recovery mechanisms and graceful degradation
 *
 * @author MatchPoint Systems
 * @version 2.0.0
 */

class ProfessionalPolishEngine {
  constructor() {
    this.isOnline = navigator.onLine;
    this.sceneTransitionDuration = 200; // <200ms requirement
    this.offlineCache = new Map();
    this.analyticsData = {
      engagement: [],
      interactions: [],
      performance: [],
      errors: []
    };
    this.errorRecoveryAttempts = new Map();
    this.maxRecoveryAttempts = 3;
    this.recoveryTimeouts = new Map();

    this.initialize();
  }

  /**
   * Initialize the Professional Polish Engine
   */
  initialize() {
    this.setupNetworkMonitoring();
    this.setupSceneTransitions();
    this.setupOfflineMode();
    this.setupAnalytics();
    this.setupErrorRecovery();
    this.setupPerformanceOptimizations();

    console.log('🎨 Professional Polish Engine initialized');
    this.trackEvent('engine_initialized', { timestamp: Date.now() });
  }

  /**
   * Setup network monitoring for offline/online detection
   */
  setupNetworkMonitoring() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.handleNetworkRecovery();
      this.trackEvent('network_online', { timestamp: Date.now() });
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.handleNetworkOffline();
      this.trackEvent('network_offline', { timestamp: Date.now() });
    });
  }

  /**
   * Setup smooth scene transitions
   */
  setupSceneTransitions() {
    // Enhanced CSS transitions for sections
    const transitionCSS = `
      .scene-transition {
        transition: all ${this.sceneTransitionDuration}ms cubic-bezier(0.4, 0, 0.2, 1);
      }

      .scene-enter {
        opacity: 0;
        transform: translateY(20px) scale(0.98);
      }

      .scene-enter-active {
        opacity: 1;
        transform: translateY(0) scale(1);
      }

      .scene-exit {
        opacity: 1;
        transform: translateY(0) scale(1);
      }

      .scene-exit-active {
        opacity: 0;
        transform: translateY(-20px) scale(1.02);
      }

      .fade-transition {
        transition: opacity ${this.sceneTransitionDuration}ms ease-in-out;
      }

      .slide-transition {
        transition: transform ${this.sceneTransitionDuration}ms cubic-bezier(0.4, 0, 0.2, 1);
      }

      .scale-transition {
        transition: transform ${this.sceneTransitionDuration}ms cubic-bezier(0.4, 0, 0.2, 1);
      }
    `;

    const style = document.createElement('style');
    style.textContent = transitionCSS;
    document.head.appendChild(style);

    // Setup intersection observer for smooth reveals
    this.setupIntersectionObserver();
  }

  /**
   * Setup intersection observer for smooth section reveals
   */
  setupIntersectionObserver() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.revealSection(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '-50px'
      }
    );

    // Observe all major sections
    document.querySelectorAll('section[id], .glass-card, .widget-card').forEach(el => {
      el.classList.add('scene-transition');
      observer.observe(el);
    });
  }

  /**
   * Reveal section with smooth animation
   */
  revealSection(element) {
    element.classList.add('scene-enter-active');
    element.classList.remove('scene-enter');

    // Track section engagement
    const sectionId = element.id || element.className;
    this.trackEngagement('section_view', {
      section: sectionId,
      timestamp: Date.now(),
      timeOnPage: Date.now() - this.getPageLoadTime()
    });
  }

  /**
   * Setup offline mode functionality
   */
  setupOfflineMode() {
    this.preloadOfflineAssets();
    this.setupOfflineFallbacks();
    this.setupOfflineIndicators();
  }

  /**
   * Preload assets for offline functionality
   */
  preloadOfflineAssets() {
    const offlineAssets = [
      'assets/audio/coach_s_calibration.mp3',
      'assets/audio/reset/reset_01.mp3',
      'assets/audio/tactical/tactical_01.mp3',
      'assets/audio/recovery/recovery_01.mp3',
      'assets/mini matchpoint logo.svg'
    ];

    offlineAssets.forEach(asset => {
      this.cacheAsset(asset);
    });
  }

  /**
   * Build validated URL for safe requests
   */
  buildValidatedUrl(baseUrl) {
    try {
      // Minimal path validation
      if (baseUrl.includes('/../') || /\/%2e%2e\//i.test(baseUrl)) {
        throw new Error('Invalid path');
      }

      const url = new URL(baseUrl);

      // Protocol check
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Invalid protocol');
      }

      return url.href;
    } catch {
      throw new Error('Invalid URL');
    }
  }

  /**
   * Cache asset for offline use
   */
  async cacheAsset(assetPath) {
    try {
      if (this.offlineCache.has(assetPath)) return;

      const validatedUrl = this.buildValidatedUrl(assetPath);
      const response = await fetch(validatedUrl);
      if (response.ok) {
        const blob = await response.blob();
        this.offlineCache.set(assetPath, blob);
        console.log(`📦 Cached offline asset: ${assetPath}`);
      }
    } catch (error) {
      console.warn(`⚠️ Failed to cache offline asset: ${assetPath}`, error);
    }
  }

  /**
   * Setup offline fallbacks for critical functionality
   */
  setupOfflineFallbacks() {
    // Override fetch for offline mode
    this.originalFetch = window.fetch;
    window.fetch = this.offlineFetch.bind(this);

    // Setup offline demo data
    this.setupOfflineDemoData();
  }

  /**
   * Offline-aware fetch wrapper
   */
  async offlineFetch(url, options = {}) {
    if (this.isOnline) {
      return this.originalFetch(url, options);
    }

    // Try to serve from cache for offline mode
    if (this.offlineCache.has(url)) {
      const blob = this.offlineCache.get(url);
      return new Response(blob);
    }

    // Return offline fallback response
    return this.createOfflineResponse(url);
  }

  /**
   * Create offline fallback response
   */
  createOfflineResponse(url) {
    if (url.includes('/api/')) {
      return new Response(JSON.stringify(this.getOfflineDemoData()), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response('Offline mode - content not available', {
      status: 503,
      statusText: 'Service Unavailable - Offline Mode'
    });
  }

  /**
   * Setup offline demo data
   */
  setupOfflineDemoData() {
    this.offlineDemoData = {
      validation: {
        scenario: 'offline_demo',
        summary: 'Offline demonstration mode with cached data',
        metrics: {
          rmse: 4.2,
          latency: 45,
          accuracy: 94.5
        }
      },
      history: {
        recent_cues: [
          {
            timestamp: new Date().toISOString(),
            cue_category: 'Tactical',
            original_cue: 'Perfect your serve - every ball counts!',
            audit_score: 0.92
          }
        ],
        emotional_drift_trend: [
          { confidence_change: 0.02, composure_change: 0.01 },
          { confidence_change: 0.03, composure_change: 0.02 }
        ]
      },
      widgets: {
        serveSpeed: 125,
        spinRate: 2800,
        accuracy: 87,
        coverage: 78,
        reactionTime: 0.32,
        rallyLength: 6.2
      }
    };
  }

  /**
   * Get offline demo data
   */
  getOfflineDemoData() {
    return this.offlineDemoData;
  }

  /**
   * Setup offline indicators
   */
  setupOfflineIndicators() {
    this.createOfflineIndicator();
    this.updateOfflineIndicator();
  }

  /**
   * Create offline mode indicator
   */
  createOfflineIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'offline-indicator';
    indicator.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: ${this.isOnline ? 'rgba(34, 197, 94, 0.9)' : 'rgba(239, 68, 68, 0.9)'};
      color: white;
      padding: 8px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
      z-index: 10000;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    `;
    indicator.textContent = this.isOnline ? '🟢 Online' : '🔴 Offline';
    document.body.appendChild(indicator);
  }

  /**
   * Update offline indicator
   */
  updateOfflineIndicator() {
    const indicator = document.getElementById('offline-indicator');
    if (indicator) {
      indicator.style.background = this.isOnline ? 'rgba(34, 197, 94, 0.9)' : 'rgba(239, 68, 68, 0.9)';
      indicator.textContent = this.isOnline ? '🟢 Online' : '🔴 Offline';
    }
  }

  /**
   * Handle network recovery
   */
  handleNetworkRecovery() {
    this.updateOfflineIndicator();
    this.syncOfflineData();
    this.showNotification('🟢 Back online - syncing data...', 'success');

    // Attempt to recover failed operations
    this.attemptErrorRecovery('network');
  }

  /**
   * Handle network offline
   */
  handleNetworkOffline() {
    this.updateOfflineIndicator();
    this.showNotification('🔴 Offline mode - using cached data', 'warning');

    // Switch to offline fallbacks
    this.enableOfflineMode();
  }

  /**
   * Enable offline mode
   */
  enableOfflineMode() {
    // Disable network-dependent features gracefully
    this.disableNetworkFeatures();

    // Enable offline alternatives
    this.enableOfflineAlternatives();
  }

  /**
   * Disable network-dependent features
   */
  disableNetworkFeatures() {
    // Hide SSE-dependent elements
    const sseElements = document.querySelectorAll('[data-requires-network]');
    sseElements.forEach(el => {
      el.style.opacity = '0.5';
      el.style.pointerEvents = 'none';
    });
  }

  /**
   * Enable offline alternatives
   */
  enableOfflineAlternatives() {
    // Show offline demo controls
    const offlineControls = document.querySelectorAll('[data-offline-mode]');
    offlineControls.forEach(el => {
      el.style.display = 'block';
    });

    // Start offline demo if not already running
    if (!this.isDemoRunning()) {
      this.startOfflineDemo();
    }
  }

  /**
   * Start offline demo mode
   */
  startOfflineDemo() {
    console.log('🎭 Starting offline demo mode');

    // Use cached demo data
    const offlineData = this.getOfflineDemoData();

    // Simulate demo progression
    this.offlineDemoInterval = setInterval(() => {
      this.updateOfflineWidgets(offlineData);
    }, 2000);

    this.trackEvent('offline_demo_started', { timestamp: Date.now() });
  }

  /**
   * Update widgets with offline data
   */
  updateOfflineWidgets(data) {
    // Simulate realistic data changes
    const widgets = ['serve-speed', 'spin-rate', 'shot-accuracy', 'court-coverage'];

    widgets.forEach(widgetId => {
      const element = document.getElementById(widgetId);
      if (element && data.widgets) {
        const baseValue = data.widgets[widgetId.replace('-', '')];
        if (baseValue) {
          const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
          const newValue = Math.round(baseValue * (1 + variation));

          // Animate the change
          this.animateValue(element, parseFloat(element.textContent) || baseValue, newValue);
        }
      }
    });
  }

  /**
   * Setup analytics tracking
   */
  setupAnalytics() {
    this.setupEngagementTracking();
    this.setupInteractionTracking();
    this.setupPerformanceTracking();
  }

  /**
   * Setup engagement tracking
   */
  setupEngagementTracking() {
    // Track section visibility
    const sections = document.querySelectorAll('section[id]');
    sections.forEach(section => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.trackEngagement('section_engagement', {
                section: section.id,
                visibilityRatio: entry.intersectionRatio,
                timestamp: Date.now()
              });
            }
          });
        },
        { threshold: [0.25, 0.5, 0.75, 1.0] }
      );

      observer.observe(section);
    });

    // Track time spent on page
    this.trackPageTime();
  }

  /**
   * Setup interaction tracking
   */
  setupInteractionTracking() {
    // Track button clicks
    document.addEventListener('click', (event) => {
      const target = event.target;
      if (target.tagName === 'BUTTON' || target.closest('button')) {
        const button = target.tagName === 'BUTTON' ? target : target.closest('button');
        this.trackInteraction('button_click', {
          buttonText: button.textContent.trim(),
          buttonId: button.id,
          section: this.getCurrentSection()
        });
      }
    });

    // Track demo interactions
    document.addEventListener('mp:demo:start', () => {
      this.trackInteraction('demo_started', { scenario: this.getCurrentDemoScenario() });
    });

    document.addEventListener('mp:demo:end', () => {
      this.trackInteraction('demo_completed', { duration: this.getDemoDuration() });
    });
  }

  /**
   * Setup performance tracking
   */
  setupPerformanceTracking() {
    // Track page load performance
    if ('performance' in window) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const perfData = performance.getEntriesByType('navigation')[0];
          if (perfData) {
            this.trackPerformance('page_load', {
              loadTime: perfData.loadEventEnd - perfData.loadEventStart,
              domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
              totalTime: perfData.loadEventEnd - perfData.fetchStart
            });
          }
        }, 0);
      });
    }

    // Track demo performance
    this.trackDemoPerformance();
  }

  /**
   * Setup error recovery mechanisms
   */
  setupErrorRecovery() {
    this.setupGlobalErrorHandler();
    this.setupNetworkErrorRecovery();
    this.setupResourceErrorRecovery();
  }

  /**
   * Setup global error handler
   */
  setupGlobalErrorHandler() {
    window.addEventListener('error', (event) => {
      this.handleError('javascript_error', {
        message: event.message,
        filename: event.filename,
        line: event.lineno,
        column: event.colno,
        stack: event.error?.stack
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.handleError('promise_rejection', {
        reason: event.reason,
        promise: event.promise
      });
    });
  }

  /**
   * Setup network error recovery
   */
  setupNetworkErrorRecovery() {
    // Monitor fetch requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        if (!response.ok && response.status >= 500) {
          this.handleError('network_error', {
            url: args[0],
            status: response.status,
            statusText: response.statusText
          });
        }
        return response;
      } catch (error) {
        this.handleError('fetch_error', {
          url: args[0],
          error: error.message
        });
        throw error;
      }
    };
  }

  /**
   * Setup resource error recovery
   */
  setupResourceErrorRecovery() {
    // Monitor resource loading
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.handleError('resource_error', {
          src: event.target.src || event.target.href,
          type: event.target.tagName.toLowerCase()
        });
      }
    }, true);
  }

  /**
   * Handle errors with recovery mechanisms
   */
  handleError(type, errorData) {
    const errorKey = `${type}_${Date.now()}`;

    // Track error
    this.trackEvent('error_occurred', {
      type,
      ...errorData,
      timestamp: Date.now()
    });

    // Attempt recovery
    this.attemptErrorRecovery(type, errorData);

    // Show user-friendly error message
    this.showErrorNotification(type, errorData);
  }

  /**
   * Attempt error recovery
   */
  async attemptErrorRecovery(errorType, errorData) {
    const attempts = this.errorRecoveryAttempts.get(errorType) || 0;

    if (attempts >= this.maxRecoveryAttempts) {
      console.warn(`🚫 Max recovery attempts reached for ${errorType}`);
      return;
    }

    this.errorRecoveryAttempts.set(errorType, attempts + 1);

    try {
      switch (errorType) {
        case 'network_error':
          await this.recoverNetworkError(errorData);
          break;
        case 'resource_error':
          await this.recoverResourceError(errorData);
          break;
        case 'javascript_error':
          await this.recoverJavaScriptError(errorData);
          break;
        default:
          await this.genericErrorRecovery(errorType, errorData);
      }

      console.log(`✅ Error recovery successful for ${errorType}`);
      this.trackEvent('error_recovered', { type: errorType, attempt: attempts + 1 });

    } catch (recoveryError) {
      console.error(`❌ Error recovery failed for ${errorType}:`, recoveryError);

      // Schedule retry with exponential backoff
      const delay = Math.pow(2, attempts) * 1000;
      this.recoveryTimeouts.set(errorType, setTimeout(() => {
        this.attemptErrorRecovery(errorType, errorData);
      }, delay));
    }
  }

  /**
   * Recover from network errors
   */
  async recoverNetworkError(errorData) {
    // Wait for network to come back
    if (!navigator.onLine) {
      await this.waitForNetwork();
    }

    // Retry the failed request
    if (errorData.url) {
      const validatedUrl = this.buildValidatedUrl(errorData.url);
      const response = await fetch(validatedUrl);
      if (response.ok) {
        this.showNotification('🔄 Network connection restored', 'success');
      }
    }
  }

  /**
   * Recover from resource errors
   */
  async recoverResourceError(errorData) {
    // Try alternative resource paths
    const alternativePaths = this.getAlternativePaths(errorData.src);

    for (const path of alternativePaths) {
      try {
        await this.testResource(path);
        // If successful, update the src
        if (errorData.type === 'script' || errorData.type === 'link') {
          // Create new element with working path
          this.replaceResourceElement(errorData, path);
        }
        return;
      } catch (error) {
        continue;
      }
    }

    throw new Error(`No alternative paths available for ${errorData.src}`);
  }

  /**
   * Recover from JavaScript errors
   */
  async recoverJavaScriptError(errorData) {
    // For critical errors, attempt graceful degradation
    if (errorData.filename && errorData.filename.includes('critical')) {
      this.enableGracefulDegradation();
    }
  }

  /**
   * Generic error recovery
   */
  async genericErrorRecovery(errorType, errorData) {
    // Wait a bit and retry
    await new Promise(resolve => setTimeout(resolve, 1000));

    // If it's a transient error, it might work now
    throw new Error('Generic recovery failed');
  }

  /**
   * Setup performance optimizations
   */
  setupPerformanceOptimizations() {
    this.optimizeAnimations();
    this.optimizeResourceLoading();
    this.setupMemoryManagement();
  }

  /**
   * Optimize animations for smooth performance
   */
  optimizeAnimations() {
    // Use transform3d for hardware acceleration
    const animatedElements = document.querySelectorAll('.glass-card, .widget-card, .scene-transition');

    animatedElements.forEach(el => {
      el.style.willChange = 'transform, opacity';
    });

    // Monitor frame rate
    this.monitorFrameRate();
  }

  /**
   * Optimize resource loading
   */
  optimizeResourceLoading() {
    // Preload critical resources
    const criticalResources = [
      'assets/css/investor-demo-layout.css',
      'assets/js/sse-client.js',
      'assets/audio/coach_s_calibration.mp3'
    ];

    criticalResources.forEach(resource => {
      this.preloadResource(resource);
    });
  }

  /**
   * Setup memory management
   */
  setupMemoryManagement() {
    // Clean up event listeners periodically
    setInterval(() => {
      this.cleanupMemory();
    }, 30000);

    // Monitor memory usage
    if ('memory' in performance) {
      setInterval(() => {
        const memInfo = performance.memory;
        if (memInfo.usedJSHeapSize > memInfo.jsHeapSizeLimit * 0.9) {
          this.forceGarbageCollection();
        }
      }, 10000);
    }
  }

  /**
   * Track analytics events
   */
  trackEvent(eventType, data) {
    const event = {
      type: eventType,
      timestamp: Date.now(),
      sessionId: this.getSessionId(),
      ...data
    };

    this.analyticsData.performance.push(event);

    // Send to analytics endpoint if online
    if (this.isOnline) {
      this.sendAnalyticsEvent(event);
    }
  }

  /**
   * Track engagement metrics
   */
  trackEngagement(eventType, data) {
    const event = {
      type: eventType,
      timestamp: Date.now(),
      sessionId: this.getSessionId(),
      ...data
    };

    this.analyticsData.engagement.push(event);
  }

  /**
   * Track interaction metrics
   */
  trackInteraction(eventType, data) {
    const event = {
      type: eventType,
      timestamp: Date.now(),
      sessionId: this.getSessionId(),
      ...data
    };

    this.analyticsData.interactions.push(event);
  }

  /**
   * Track performance metrics
   */
  trackPerformance(eventType, data) {
    const event = {
      type: eventType,
      timestamp: Date.now(),
      sessionId: this.getSessionId(),
      ...data
    };

    this.analyticsData.performance.push(event);
  }

  /**
   * Get or create session ID
   */
  getSessionId() {
    if (!this.sessionId) {
      this.sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    return this.sessionId;
  }

  /**
   * Get page load time
   */
  getPageLoadTime() {
    if ('performance' in window && performance.timing) {
      return performance.timing.loadEventEnd - performance.timing.navigationStart;
    }
    return Date.now();
  }

  /**
   * Get current section
   */
  getCurrentSection() {
    const sections = document.querySelectorAll('section[id]');
    let currentSection = '';

    for (const section of sections) {
      const rect = section.getBoundingClientRect();
      if (rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2) {
        currentSection = section.id;
        break;
      }
    }

    return currentSection;
  }

  /**
   * Get current demo scenario
   */
  getCurrentDemoScenario() {
    const scenarioSelect = document.getElementById('demo-scenario');
    return scenarioSelect ? scenarioSelect.value : 'unknown';
  }

  /**
   * Get demo duration
   */
  getDemoDuration() {
    return this.demoStartTime ? Date.now() - this.demoStartTime : 0;
  }

  /**
   * Check if demo is running
   */
  isDemoRunning() {
    return this.demoStartTime && !this.demoEndTime;
  }

  /**
   * Animate value changes smoothly
   */
  animateValue(element, from, to, duration = 300) {
    if (!element) return;

    const start = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - start;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = from + (to - from) * easeOutQuart;

      element.textContent = typeof to === 'number' ? Math.round(current) : current;

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  /**
   * Show notification
   */
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? 'rgba(34, 197, 94, 0.9)' : type === 'error' ? 'rgba(239, 68, 68, 0.9)' : 'rgba(59, 130, 246, 0.9)'};
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      z-index: 10000;
      font-weight: bold;
      font-size: 12px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
      animation: slideInFade 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  /**
   * Show error notification
   */
  showErrorNotification(type, errorData) {
    let message = 'An error occurred';

    switch (type) {
      case 'network_error':
        message = '🌐 Network connection issue - attempting recovery...';
        break;
      case 'resource_error':
        message = '📦 Resource loading error - using fallback...';
        break;
      case 'javascript_error':
        message = '⚡ Script error - maintaining functionality...';
        break;
      default:
        message = '🔧 System error - graceful degradation active...';
    }

    this.showNotification(message, 'error');
  }

  /**
   * Send analytics event to backend
   */
  async sendAnalyticsEvent(event) {
    try {
      await fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
    } catch (error) {
      // Silently fail - analytics shouldn't break the app
      console.warn('Failed to send analytics event:', error);
    }
  }

  /**
   * Sync offline data when back online
   */
  async syncOfflineData() {
    if (this.analyticsData.engagement.length > 0) {
      try {
        await fetch('/api/analytics/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            engagement: this.analyticsData.engagement,
            interactions: this.analyticsData.interactions,
            performance: this.analyticsData.performance,
            errors: this.analyticsData.errors
          })
        });

        // Clear synced data
        this.analyticsData = {
          engagement: [],
          interactions: [],
          performance: [],
          errors: []
        };

        console.log('📊 Offline analytics data synced');
      } catch (error) {
        console.warn('Failed to sync offline data:', error);
      }
    }
  }

  /**
   * Wait for network connectivity
   */
  waitForNetwork(timeout = 10000) {
    return new Promise((resolve, reject) => {
      if (navigator.onLine) {
        resolve();
        return;
      }

      const timeoutId = setTimeout(() => {
        reject(new Error('Network timeout'));
      }, timeout);

      const checkOnline = () => {
        if (navigator.onLine) {
          clearTimeout(timeoutId);
          resolve();
        }
      };

      window.addEventListener('online', checkOnline);
    });
  }

  /**
   * Get alternative resource paths
   */
  getAlternativePaths(originalPath) {
    const alternatives = [];

    // Try CDN fallbacks
    if (originalPath.includes('cdn.jsdelivr.net')) {
      alternatives.push(originalPath.replace('cdn.jsdelivr.net', 'cdnjs.cloudflare.com'));
    }

    // Try local fallbacks
    if (originalPath.includes('/assets/')) {
      alternatives.push(originalPath.replace('/assets/', '/assets/fallback/'));
    }

    return alternatives;
  }

  /**
   * Test if resource is available
   */
  async testResource(path) {
    const response = await fetch(path, { method: 'HEAD' });
    return response.ok;
  }

  /**
   * Replace resource element with working path
   */
  replaceResourceElement(errorData, workingPath) {
    const newElement = document.createElement(errorData.type);

    if (errorData.type === 'script') {
      newElement.src = workingPath;
    } else if (errorData.type === 'link') {
      newElement.href = workingPath;
      newElement.rel = 'stylesheet';
    }

    // Replace in DOM
    if (errorData.target && errorData.target.parentNode) {
      errorData.target.parentNode.replaceChild(newElement, errorData.target);
    }
  }

  /**
   * Enable graceful degradation
   */
  enableGracefulDegradation() {
    // Disable advanced features that might cause issues
    const advancedFeatures = document.querySelectorAll('[data-advanced-feature]');
    advancedFeatures.forEach(el => {
      el.style.display = 'none';
    });

    // Show basic functionality message
    this.showNotification('🔧 Running in basic mode for stability', 'warning');
  }

  /**
   * Monitor frame rate
   */
  monitorFrameRate() {
    let lastTime = performance.now();
    let frameCount = 0;

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();

      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));

        if (fps < 30) {
          this.optimizeForLowPerformance();
        }

        frameCount = 0;
        lastTime = currentTime;
      }

      requestAnimationFrame(measureFPS);
    };

    requestAnimationFrame(measureFPS);
  }

  /**
   * Optimize for low performance
   */
  optimizeForLowPerformance() {
    // Reduce animation complexity
    const style = document.createElement('style');
    style.textContent = `
      * {
        animation-duration: 0.5s !important;
        transition-duration: 0.2s !important;
      }
    `;
    document.head.appendChild(style);

    this.showNotification('🐌 Optimized for lower performance', 'info');
  }

  /**
   * Preload resource
   */
  preloadResource(resourcePath) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resourcePath;
    link.as = resourcePath.endsWith('.js') ? 'script' : 'style';
    document.head.appendChild(link);
  }

  /**
   * Cleanup memory
   */
  cleanupMemory() {
    // Clear any accumulated event listeners or cached data
    this.offlineCache.clear();

    // Force garbage collection if available
    if (window.gc) {
      window.gc();
    }
  }

  /**
   * Force garbage collection
   */
  forceGarbageCollection() {
    // Suggest to browser that GC might be good
    if (window.gc) {
      window.gc();
    }

    this.showNotification('🧹 Memory cleanup performed', 'info');
  }

  /**
   * Track page time
   */
  trackPageTime() {
    setInterval(() => {
      const timeOnPage = Date.now() - this.getPageLoadTime();
      this.trackEngagement('time_on_page', {
        duration: Math.round(timeOnPage / 1000),
        section: this.getCurrentSection()
      });
    }, 30000); // Every 30 seconds
  }

  /**
   * Track demo performance
   */
  trackDemoPerformance() {
    // Monitor demo smoothness
    let lastFrameTime = performance.now();

    const trackDemoFrame = () => {
      const currentTime = performance.now();
      const frameTime = currentTime - lastFrameTime;

      if (frameTime > 50) { // Slower than 20fps
        this.trackPerformance('demo_performance_issue', {
          frameTime,
          timestamp: currentTime
        });
      }

      lastFrameTime = currentTime;
      requestAnimationFrame(trackDemoFrame);
    };

    requestAnimationFrame(trackDemoFrame);
  }

  /**
   * Get analytics summary
   */
  getAnalyticsSummary() {
    return {
      sessionId: this.getSessionId(),
      totalEngagementEvents: this.analyticsData.engagement.length,
      totalInteractions: this.analyticsData.interactions.length,
      totalPerformanceEvents: this.analyticsData.performance.length,
      totalErrors: this.analyticsData.errors.length,
      isOnline: this.isOnline,
      sessionDuration: Date.now() - this.getPageLoadTime()
    };
  }

  /**
   * Export analytics data
   */
  exportAnalyticsData() {
    const data = {
      summary: this.getAnalyticsSummary(),
      engagement: this.analyticsData.engagement,
      interactions: this.analyticsData.interactions,
      performance: this.analyticsData.performance,
      errors: this.analyticsData.errors
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `matchpoint-analytics-${this.getSessionId()}.json`;
    a.click();

    URL.revokeObjectURL(url);
  }
}

// Initialize Professional Polish Engine when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.professionalPolish = new ProfessionalPolishEngine();

  // Add export button to demo controls
  const exportBtn = document.createElement('button');
  exportBtn.textContent = '📊 Export Analytics';
  exportBtn.style.cssText = `
    background: rgba(168, 85, 247, 0.9);
    border: none;
    border-radius: 6px;
    color: white;
    font-weight: bold;
    padding: 8px 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 11px;
    margin-top: 10px;
  `;

  exportBtn.addEventListener('click', () => {
    window.professionalPolish.exportAnalyticsData();
  });

  // Add to demo controls if they exist
  const demoControls = document.getElementById('demo-controls');
  if (demoControls) {
    demoControls.appendChild(exportBtn);
  }

  console.log('🎨 Professional Polish Engine loaded and ready');
});

// Add CSS animations for notifications
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
  @keyframes slideInFade {
    0% {
      opacity: 0;
      transform: translateX(100%);
    }
    100% {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .scene-transition {
    transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  .scene-enter {
    opacity: 0;
    transform: translateY(20px) scale(0.98);
  }

  .scene-enter-active {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;
document.head.appendChild(notificationStyles);