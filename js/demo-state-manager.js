// MatchPoint Demo State Manager - Handles unattended demo operation
(function() {
'use strict';

  const CROWD_AUDIO_DISABLED = true;

  const DemoState = {
    UNATTENDED: 'unattended',
    INTERACTIVE: 'interactive',
    PRESENTATION: 'presentation'
  };

  class DemoStateManager {
    constructor() {
      this.currentState = DemoState.INTERACTIVE;
      this.narrationEnabled = false;
      this.crowdAudioEnabled = false;
      this.crowdAudioVolume = 0;
      this.autoAdvanceTimer = null;
      this.stateChangeCallbacks = [];
      this.narrationQueue = [];
      this.isRunning = false;
  
      this.init();
    }

    init() {
      // Listen for SSE events
      window.addEventListener('mp:sse:sync', (event) => {
        this.handleSyncEvent(event.detail);
      });

      // Listen for phase transitions
      window.addEventListener('mp:phase:transition', (event) => {
        this.handlePhaseTransition(event.detail);
      });

      // Add demo control UI if not present
      this.addDemoControls();
    }

    setState(newState, options = {}) {
      const oldState = this.currentState;
      this.currentState = newState;

      // Handle state-specific setup
      switch (newState) {
        case DemoState.UNATTENDED:
          this.startUnattendedMode(options);
          break;
        case DemoState.PRESENTATION:
          this.startPresentationMode(options);
          break;
        case DemoState.INTERACTIVE:
        default:
          this.startInteractiveMode();
          break;
      }

      // Notify listeners
      this.stateChangeCallbacks.forEach(callback => {
        try {
          callback(newState, oldState, options);
        } catch (error) {
          console.error('[DemoState] Callback error:', error);
        }
      });

      console.log(`[DemoState] Changed from ${oldState} to ${newState}`);
    }

    startUnattendedMode(options = {}) {
      this.narrationEnabled = options.narration !== false;
      this.isRunning = true;

      // Add CSS class for unattended styling
      document.body.classList.add('unattended-demo');

      // Start auto-advance if specified
      if (options.autoAdvance) {
        this.startAutoAdvance(options.autoAdvanceInterval || 30000); // 30 seconds default
      }

      console.log('[DemoState] Unattended mode started');
    }

    startPresentationMode(options = {}) {
      this.narrationEnabled = true;
      this.crowdAudioEnabled = !CROWD_AUDIO_DISABLED;
      this.isRunning = true;

      // Add presentation styling
      document.body.classList.add('presentation-mode');
      document.body.classList.add('tablet-presentation');

      // Load tablet CSS if not already loaded
      this.loadTabletCSS();

      // Disable debug elements
      this.hideDebugElements();

      // Start crowd audio if available
      if (!CROWD_AUDIO_DISABLED) {
        this.startCrowdAudio();
      } else {
        this.updateCrowdAudioStatus();
      }

      console.log('[DemoState] Presentation mode started');
    }

    startInteractiveMode() {
      this.narrationEnabled = false;
      this.crowdAudioEnabled = false;
      this.isRunning = false;

      // Remove mode-specific classes
      document.body.classList.remove('unattended-demo', 'presentation-mode', 'tablet-presentation');

      // Stop auto-advance
      this.stopAutoAdvance();

      // Stop crowd audio
      this.stopCrowdAudio();
      this.updateCrowdAudioStatus();

      // Show debug elements
      this.showDebugElements();

      console.log('[DemoState] Interactive mode started');
    }

    startAutoAdvance(intervalMs = 30000) {
      this.stopAutoAdvance();

      this.autoAdvanceTimer = setInterval(() => {
        this.triggerAutoAdvance();
      }, intervalMs);

      console.log(`[DemoState] Auto-advance started (${intervalMs}ms)`);
    }

    stopAutoAdvance() {
      if (this.autoAdvanceTimer) {
        clearInterval(this.autoAdvanceTimer);
        this.autoAdvanceTimer = null;
        console.log('[DemoState] Auto-advance stopped');
      }
    }

    triggerAutoAdvance() {
      // Trigger a demo advancement event
      window.dispatchEvent(new CustomEvent('mp:demo:auto_advance'));

      // Could also trigger narration or highlight different sections
      console.log('[DemoState] Auto-advance triggered');
    }

    handleSyncEvent(syncData) {
      if (!this.isRunning) return;

      // Handle sync-based actions for unattended mode
      if (this.currentState === DemoState.UNATTENDED) {
        this.processUnattendedActions(syncData);
      }
    }

    handlePhaseTransition(transitionData) {
      if (!this.isRunning) return;

      // Handle phase-based narration and actions
      if (this.narrationEnabled) {
        this.triggerPhaseNarration(transitionData);
      }

      // Update UI for phase changes
      this.updatePhaseIndicators(transitionData);
    }

    processUnattendedActions(syncData) {
      // Process automated demo actions based on sync data
      const phase = syncData.phase;

      switch (phase) {
        case 'serve':
          this.highlightServeMetrics();
          break;
        case 'rally':
          this.highlightRallyMetrics();
          break;
        case 'point_end':
          this.highlightResultMetrics();
          break;
      }
    }

    triggerPhaseNarration(transitionData) {
      const phaseMessages = {
        'serve': 'Watch this powerful serve being tracked in real-time.',
        'rally': 'The rally is underway - every shot is precisely measured.',
        'point_end': 'Point completed with instant performance analysis.',
        'pause': 'Between points, our system calculates comprehensive analytics.'
      };

      const message = phaseMessages[transitionData.to];
      if (message) {
        // Dispatch narration event for TTS system
        window.dispatchEvent(new CustomEvent('mp:demo:narrate', {
          detail: {
            message: message,
            phase: transitionData.to,
            priority: 'normal'
          }
        }));
      }
    }

    updatePhaseIndicators(transitionData) {
      // Update visual phase indicators
      const phaseIndicator = document.getElementById('phase-indicator');
      if (phaseIndicator) {
        phaseIndicator.textContent = transitionData.to.toUpperCase();
        phaseIndicator.classList.add('phase-changing');

        setTimeout(() => {
          phaseIndicator.classList.remove('phase-changing');
        }, 1000);
      }

      // Update demo control phase display
      const currentPhaseSpan = document.getElementById('current-phase');
      if (currentPhaseSpan) {
        currentPhaseSpan.textContent = transitionData.to.toUpperCase();
      }
    }

    updateCrowdAudioStatus() {
      const crowdAudioStateSpan = document.getElementById('crowd-audio-state');
      if (crowdAudioStateSpan) {
        const status = this.crowdAudioEnabled ? 'Enabled' : 'Disabled';
        const color = this.crowdAudioEnabled ? 'var(--ok)' : 'var(--muted)';
        crowdAudioStateSpan.textContent = status;
        crowdAudioStateSpan.style.color = color;
      }
    }

    highlightServeMetrics() {
      // Highlight serve-related dashboard elements
      const serveElements = document.querySelectorAll('[data-metric="serveSpeed"], [data-metric="spinRate"]');
      serveElements.forEach(el => {
        el.classList.add('demo-highlight');
        setTimeout(() => el.classList.remove('demo-highlight'), 3000);
      });
    }

    highlightRallyMetrics() {
      // Highlight rally-related dashboard elements
      const rallyElements = document.querySelectorAll('[data-metric="accuracy"], [data-metric="reactionTime"]');
      rallyElements.forEach(el => {
        el.classList.add('demo-highlight');
        setTimeout(() => el.classList.remove('demo-highlight'), 3000);
      });
    }

    highlightResultMetrics() {
      // Highlight result-related dashboard elements
      const resultElements = document.querySelectorAll('[data-metric="longestRally"], #broadcast-scoreboard');
      resultElements.forEach(el => {
        el.classList.add('demo-highlight');
        setTimeout(() => el.classList.remove('demo-highlight'), 3000);
      });
    }

    addDemoControls() {
      // Add demo control panel if not present
      if (document.getElementById('demo-controls')) return;

      const controlsHTML = `
        <div id="demo-controls" class="demo-controls-panel" style="display: none;">
          <div class="demo-controls-header">
            <h3>Demo Controls</h3>
            <button id="close-demo-controls" class="demo-close-btn">&times;</button>
          </div>
          <div class="demo-controls-body">
            <div class="demo-mode-selector">
              <label>Demo Mode:</label>
              <select id="demo-mode-select">
                <option value="interactive">Interactive</option>
                <option value="unattended">Unattended</option>
                <option value="presentation">Presentation</option>
              </select>
            </div>

            <div class="demo-options">
              <label>
                <input type="checkbox" id="narration-toggle"> Enable Narration
              </label>
              <label>
                <input type="checkbox" id="crowd-audio-toggle"> Enable Crowd Audio
              </label>
              <label>
                <input type="checkbox" id="auto-advance-toggle"> Auto-Advance (30s)
              </label>
            </div>

            <div class="demo-audio-controls" id="crowd-audio-controls" style="display: none;">
              <label>Crowd Audio Volume:</label>
              <input type="range" id="crowd-volume-slider" min="0" max="1" step="0.1" value="0">
              <span id="crowd-volume-value">0%</span>
            </div>

            <div class="demo-actions">
              <button id="start-demo-btn" class="demo-btn primary">Start Demo</button>
              <button id="stop-demo-btn" class="demo-btn secondary">Stop Demo</button>
              <button id="reset-demo-btn" class="demo-btn danger">Reset</button>
            </div>

            <div class="demo-status">
              <div id="demo-status-text">Ready</div>
              <div id="demo-phase-indicator">Phase: <span id="current-phase">PAUSE</span></div>
              <div id="crowd-audio-status">Crowd Audio: <span id="crowd-audio-state">Disabled</span></div>
            </div>
          </div>
        </div>

        <button id="demo-controls-toggle" class="demo-controls-toggle">
          🎭 Demo
        </button>
      `;

      document.body.insertAdjacentHTML('beforeend', controlsHTML);

      // Set up event listeners
      this.setupDemoControlListeners();
    }

    setupDemoControlListeners() {
      const modeSelect = document.getElementById('demo-mode-select');
      const narrationToggle = document.getElementById('narration-toggle');
      const autoAdvanceToggle = document.getElementById('auto-advance-toggle');
      const crowdAudioToggle = document.getElementById('crowd-audio-toggle');
      const startBtn = document.getElementById('start-demo-btn');
      const stopBtn = document.getElementById('stop-demo-btn');
      const resetBtn = document.getElementById('reset-demo-btn');
      const toggleBtn = document.getElementById('demo-controls-toggle');
      const closeBtn = document.getElementById('close-demo-controls');

      // Toggle controls panel
      toggleBtn?.addEventListener('click', () => {
        const panel = document.getElementById('demo-controls');
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
      });

      closeBtn?.addEventListener('click', () => {
        document.getElementById('demo-controls').style.display = 'none';
      });

      // Mode selection
      modeSelect?.addEventListener('change', () => {
        const mode = modeSelect.value;
        this.setState(mode);

        // Update toggles based on mode
        if (mode === DemoState.PRESENTATION) {
          narrationToggle.checked = true;
          if (crowdAudioToggle) {
            crowdAudioToggle.checked = !CROWD_AUDIO_DISABLED;
          }
          autoAdvanceToggle.checked = false;
        } else if (mode === DemoState.UNATTENDED) {
          narrationToggle.checked = true;
          if (crowdAudioToggle) {
            crowdAudioToggle.checked = !CROWD_AUDIO_DISABLED;
          }
          autoAdvanceToggle.checked = true;
        }

        if (CROWD_AUDIO_DISABLED) {
          this.crowdAudioEnabled = false;
        }

        // Update status displays
        this.updateCrowdAudioStatus();
      });

      // Narration toggle
      narrationToggle?.addEventListener('change', () => {
        this.narrationEnabled = narrationToggle.checked;
        window.dispatchEvent(new CustomEvent('mp:demo:narration_toggled', {
          detail: { enabled: this.narrationEnabled }
        }));
      });

      // Crowd audio toggle
      crowdAudioToggle?.addEventListener('change', () => {
        if (CROWD_AUDIO_DISABLED) {
          crowdAudioToggle.checked = false;
          this.crowdAudioEnabled = false;
          this.updateCrowdAudioStatus();
          return;
        }
        this.crowdAudioEnabled = crowdAudioToggle.checked;
        if (this.crowdAudioEnabled) {
          this.startCrowdAudio();
        } else {
          this.stopCrowdAudio();
        }
        this.updateCrowdAudioStatus();
      });

      // Crowd audio volume slider
      const volumeSlider = document.getElementById('crowd-volume-slider');
      const volumeValue = document.getElementById('crowd-volume-value');

      volumeSlider?.addEventListener('input', (e) => {
        const volume = parseFloat(e.target.value);
        const percentage = Math.round(volume * 100);
        volumeValue.textContent = `${percentage}%`;
        this.setCrowdAudioVolume(volume);
      });

      // Auto-advance toggle
      autoAdvanceToggle?.addEventListener('change', () => {
        if (autoAdvanceToggle.checked) {
          this.startAutoAdvance();
        } else {
          this.stopAutoAdvance();
        }
      });

      // Control buttons
      startBtn?.addEventListener('click', () => {
        const mode = modeSelect.value;
        const options = {
          narration: narrationToggle.checked,
          autoAdvance: autoAdvanceToggle.checked
        };
        this.setState(mode, options);
      });

      stopBtn?.addEventListener('click', () => {
        this.setState(DemoState.INTERACTIVE);
      });

      resetBtn?.addEventListener('click', () => {
        this.resetDemo();
      });
    }

    resetDemo() {
      // Reset demo state
      this.setState(DemoState.INTERACTIVE);

      // Reset form controls
      const modeSelect = document.getElementById('demo-mode-select');
      const narrationToggle = document.getElementById('narration-toggle');
      const crowdAudioToggle = document.getElementById('crowd-audio-toggle');
      const autoAdvanceToggle = document.getElementById('auto-advance-toggle');
      const volumeSlider = document.getElementById('crowd-volume-slider');
      const volumeValue = document.getElementById('crowd-volume-value');

      if (modeSelect) modeSelect.value = 'interactive';
      if (narrationToggle) narrationToggle.checked = false;
      if (crowdAudioToggle) crowdAudioToggle.checked = false;
      if (autoAdvanceToggle) autoAdvanceToggle.checked = false;
      if (volumeSlider) volumeSlider.value = '0';
      if (volumeValue) volumeValue.textContent = '0%';

      console.log('[DemoState] Demo reset');
    }

    hideDebugElements() {
      const debugElements = document.querySelectorAll('[data-dev-chrome], .debug-info, #dev-mode-toggle');
      debugElements.forEach(el => {
        el.style.display = 'none';
      });
    }

    showDebugElements() {
      const debugElements = document.querySelectorAll('[data-dev-chrome], .debug-info, #dev-mode-toggle');
      debugElements.forEach(el => {
        el.style.display = '';
      });
    }

    loadTabletCSS() {
      // Load tablet presentation CSS if not already loaded
      const tabletCSS = document.getElementById('tablet-presentation-css');
      if (tabletCSS) return;

      const link = document.createElement('link');
      link.id = 'tablet-presentation-css';
      link.rel = 'stylesheet';
      link.href = '/assets/css/tablet-presentation.css';
      document.head.appendChild(link);
    }

    startCrowdAudio() {
      if (CROWD_AUDIO_DISABLED) {
        this.crowdAudioEnabled = false;
        this.updateCrowdAudioStatus();
        return;
      }
      // Try to start crowd audio via API call
      fetch('/api/audio/crowd/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          volume: this.crowdAudioVolume,
          fadeIn: true
        })
      }).catch(error => {
        console.log('[DemoState] Crowd audio API not available:', error.message);
      });
    }

    stopCrowdAudio() {
      if (CROWD_AUDIO_DISABLED) {
        this.crowdAudioEnabled = false;
        this.updateCrowdAudioStatus();
        return;
      }
      // Try to stop crowd audio via API call
      fetch('/api/audio/crowd/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fadeOut: true
        })
      }).catch(error => {
        console.log('[DemoState] Crowd audio API not available:', error.message);
      });
    }

    setCrowdAudioVolume(volume) {
      if (CROWD_AUDIO_DISABLED) {
        this.crowdAudioVolume = 0;
        this.updateCrowdAudioStatus();
        return;
      }
      this.crowdAudioVolume = Math.max(0, Math.min(1, volume));

      // Try to set volume via API call
      fetch('/api/audio/crowd/volume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          volume: this.crowdAudioVolume
        })
      }).catch(error => {
        console.log('[DemoState] Crowd audio volume API not available:', error.message);
      });
    }

    onStateChange(callback) {
      if (typeof callback === 'function') {
        this.stateChangeCallbacks.push(callback);
      }
    }

    getStatus() {
      return {
        currentState: this.currentState,
        narrationEnabled: this.narrationEnabled,
        crowdAudioEnabled: this.crowdAudioEnabled,
        crowdAudioVolume: this.crowdAudioVolume,
        isRunning: this.isRunning,
        autoAdvanceActive: this.autoAdvanceTimer !== null
      };
    }
  }

  // Initialize demo state manager
  const demoStateManager = new DemoStateManager();

  // Expose to global scope
  window.DemoStateManager = demoStateManager;
  window.DemoState = DemoState;

  // Auto-detect tablet and enable presentation mode
  if (window.innerWidth <= 1200 || 'ontouchstart' in window) {
    console.log('[DemoState] Tablet detected, enabling presentation optimizations');
    setTimeout(() => {
      demoStateManager.setState(DemoState.PRESENTATION, { narration: true });
    }, 2000); // Delay to allow page load
  }

  console.log('[DemoState] Demo state manager initialized');

})();
