// ===========================
// MatchPoint Sync Engine Core
// ===========================

class MatchPointSyncEngine {
  constructor(demoController) {
    if (!demoController) {
      throw new Error('MatchPointSyncEngine requires a DemoController instance');
    }

    this.demoController = demoController;
    this.timeline = null;
    this.currentBeatIndex = 0;
    this.isPlaying = false;
    this.isPaused = false;
    this.startTime = null;
    this.pauseTime = null;
    this.beatStartTime = null;
    this.beatTimeout = null;
    this.executionReports = [];
    this.config = {
      debug: false,
      autoAdvance: true
    };

    // 🔧 RELIABILITY HARDENING: Audio Health Monitoring
    this.audioHealth = {
      lastCheck: 0,
      checkInterval: 5000,
      requiredSounds: ['crowd_noise', 'forehand', 'backhand', 'serve', 'smash', 'rally_loop', 'applause_big', 'applause_outro']
    };

    // 🔧 RELIABILITY HARDENING: Browser Focus Monitoring
    this.pageVisibility = {
      hiddenStartTime: null,
      totalHiddenTime: 0
    };

    // 🔧 RELIABILITY HARDENING: Audio Context Health
    this.audioContextHealth = {
      lastCheck: 0,
      checkInterval: 10000,
      contextState: 'unknown'
    };

    // 🔧 RELIABILITY HARDENING: User Interaction Debouncing
    this.interactionLock = {
      playButton: false,
      pauseButton: false,
      resumeButton: false,
      stopButton: false,
      debounceMs: 500
    };

    // 🔧 RELIABILITY HARDENING: Performance Monitoring
    this.performanceMonitor = {
      frameDrops: 0,
      lastFrameTime: performance.now(),
      memoryWarnings: 0,
      startTime: null
    };

    // 🔧 RELIABILITY HARDENING: Timing Drift Compensation
    this.timingCompensation = {
      driftThreshold: 50, // ms
      lastBeatTime: 0,
      accumulatedDrift: 0
    };

    // 🔧 RELIABILITY HARDENING: Failure Recovery
    this.failureRecovery = {
      maxRetries: 3,
      retryDelay: 1000,
      consecutiveFailures: 0
    };

    // 🔧 RELIABILITY HARDENING: Browser Focus Monitoring
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pageVisibility.hiddenStartTime = performance.now();
        if (this.isPlaying && !this.isPaused) {
          console.log('[SyncEngine] Page hidden - auto-pausing demo');
          this.pause();
        }
      } else {
        if (this.pageVisibility.hiddenStartTime) {
          const hiddenDuration = performance.now() - this.pageVisibility.hiddenStartTime;
          this.pageVisibility.totalHiddenTime += hiddenDuration;
          this.pageVisibility.hiddenStartTime = null;

          if (this.config.debug) {
            console.log(`[SyncEngine] Page was hidden for ${hiddenDuration.toFixed(0)}ms`);
          }
        }
      }
    });

    console.log('✅ Sync engine ready. Call syncEngine.play() to start demo.');
  }

  /**
   * Load a timeline for execution
   */
  setTimeline(timeline) {
    if (!Array.isArray(timeline)) {
      throw new Error('Timeline must be an array of beat objects');
    }

    this.timeline = timeline;
    this.currentBeatIndex = 0;
    this.executionReports = [];

    if (this.config.debug) {
      console.log(`[SyncEngine] Loaded timeline with ${timeline.length} beats`);
    }
  }

  /**
   * Start the synchronized demo
   */
  async play() {
    if (this.interactionLock.playButton) return;
    this.interactionLock.playButton = true;

    if (!this.timeline) {
      console.error('[SyncEngine] No timeline set. Call setTimeline() first.');
      this.interactionLock.playButton = false;
      return;
    }

    if (this.isPlaying && !this.isPaused) {
      console.warn('[SyncEngine] Already playing');
      this.interactionLock.playButton = false;
      return;
    }

    // 🔧 RELIABILITY: Check audio health before starting
    const audioReady = await this.verifyAudioHealth();
    if (!audioReady) {
      console.warn('[SyncEngine] Audio not ready - starting anyway with graceful degradation');
    }

    this.isPlaying = true;
    this.isPaused = false;

    if (!this.startTime) {
      this.startTime = performance.now();
      this.performanceMonitor.startTime = this.startTime;
    }

    if (this.config.debug) {
      console.log(`[SyncEngine] Starting demo at beat ${this.currentBeatIndex}`);
    }

    setTimeout(() => {
      this.interactionLock.playButton = false;
    }, this.interactionLock.debounceMs);

    this.executeNextBeat();
  }

  /**
   * Pause the demo
   */
  pause() {
    if (this.interactionLock.pauseButton) return;
    this.interactionLock.pauseButton = true;

    if (!this.isPlaying || this.isPaused) {
      console.warn('[SyncEngine] Not currently playing or already paused');
      setTimeout(() => {
        this.interactionLock.pauseButton = false;
      }, this.interactionLock.debounceMs);
      return;
    }

    this.isPaused = true;
    this.pauseTime = performance.now();

    if (this.beatTimeout) {
      clearTimeout(this.beatTimeout);
      this.beatTimeout = null;
    }

    this.demoController.audio.stopAll();

    if (this.config.debug) {
      console.log(`[SyncEngine] Paused at beat ${this.currentBeatIndex}`);
    }

    setTimeout(() => {
      this.interactionLock.pauseButton = false;
    }, this.interactionLock.debounceMs);
  }

  /**
   * Resume the demo from pause
   */
  resume() {
    if (this.interactionLock.resumeButton) return;
    this.interactionLock.resumeButton = true;

    if (!this.isPlaying || !this.isPaused) {
      console.warn('[SyncEngine] Not paused or not playing');
      setTimeout(() => {
        this.interactionLock.resumeButton = false;
      }, this.interactionLock.debounceMs);
      return;
    }

    this.isPaused = false;
    const pauseDuration = performance.now() - this.pauseTime;

    // Adjust start time to account for pause
    this.startTime += pauseDuration;

    if (this.config.debug) {
      console.log(`[SyncEngine] Resumed from beat ${this.currentBeatIndex}`);
    }

    setTimeout(() => {
      this.interactionLock.resumeButton = false;
    }, this.interactionLock.debounceMs);

    this.executeNextBeat();
  }

  /**
   * Stop the demo completely
   */
  stop() {
    this.isPlaying = false;
    this.isPaused = false;

    if (this.beatTimeout) {
      clearTimeout(this.beatTimeout);
      this.beatTimeout = null;
    }

    this.demoController.stop();
    this.demoController.reset();

    this.currentBeatIndex = 0;
    this.startTime = null;
    this.pauseTime = null;
    this.beatStartTime = null;

    if (this.config.debug) {
      console.log('[SyncEngine] Stopped and reset');
    }
  }

  /**
   * Execute the next beat in the timeline
   */
  executeNextBeat() {
    if (!this.isPlaying || this.isPaused) {
      return;
    }

    if (this.currentBeatIndex >= this.timeline.length) {
      console.log('[SyncEngine] Timeline complete - executing victory sequence');
      this.executeVictorySequence().then(() => {
        this.stop();
      });
      return;
    }

    const beat = this.timeline[this.currentBeatIndex];
    this.beatStartTime = performance.now();

    // 🔧 RELIABILITY: Monitor performance
    this.monitorPerformance();

    // 🔧 RELIABILITY: Ensure audio context is ready
    this.ensureAudioContext();

    // 🔧 RELIABILITY: Compensate for timing drift
    this.compensateTimingDrift(beat);

    if (this.config.debug) {
      console.log(`[SyncEngine] Executing beat ${this.currentBeatIndex}: ${beat.id}`);
    }

    try {
      this.executeBeat(beat);
    } catch (error) {
      console.error(`[SyncEngine] Error executing beat ${beat.id}:`, error);
      // 🔧 RELIABILITY: Use failure recovery
      this.handleSystemError('beat_execution', error, async () => {
        this.executeBeat(beat);
      });
      this.reportBeatExecution(beat, this.beatStartTime, performance.now(), error);
      this.currentBeatIndex++;
      this.executeNextBeat();
      return;
    }

    // Schedule next beat
    const nextBeatDelay = this.calculateNextBeatDelay(beat);
    this.beatTimeout = setTimeout(() => {
      this.reportBeatExecution(beat, this.beatStartTime, performance.now());
      this.currentBeatIndex++;
      this.executeNextBeat();
    }, nextBeatDelay);
  }

  /**
   * Execute a single beat's actions
   */
  executeBeat(beat) {
    const execution = beat.execution || {};

    // Execute metrics animation
    if (beat.metrics && execution.metricsDuration) {
      setTimeout(() => {
        if (this.isPlaying && !this.isPaused) {
          this.demoController.animateMetricsToTarget(beat.metrics, execution.metricsDuration);
        }
      }, execution.coachingDelay || 0);
    }

    // Execute audio
    if (beat.audio) {
      if (beat.audio.ambient) {
        this.demoController.audio.play(beat.audio.ambient);
      }
      if (beat.audio.sfx && execution.coachingDelay) {
        setTimeout(() => {
          if (this.isPlaying && !this.isPaused) {
            this.demoController.audio.play(beat.audio.sfx);
          }
        }, execution.coachingDelay);
      }
    }

    // Execute coaching cues
    if (beat.coaching && beat.coaching.cue) {
      setTimeout(() => {
        if (this.isPlaying && !this.isPaused) {
          this.demoController.coach.showCue(beat.coaching.cue);
        }
      }, execution.coachingDelay || 0);
    }

    // Execute UI updates
    if (beat.ui && beat.ui.score) {
      setTimeout(() => {
        if (this.isPlaying && !this.isPaused) {
          this.demoController.setScoreScript({ a: beat.ui.score, b: '0', leader: 'a' });
        }
      }, execution.coachingDelay || 0);
    }
  }

  /**
   * Execute victory celebration sequence
   */
  async executeVictorySequence() {
    console.log('[SyncEngine] 🎉 Executing victory celebration sequence');

    try {
      // Victory celebration with extended applause and coaching
      this.demoController.audio.play('applause_big');
      this.demoController.audio.play('applause_outro');

      // Show victory coaching cue
      setTimeout(() => {
        this.demoController.coach.showCue("🎉 CHAMPIONSHIP VICTORY! You conquered the comeback! 🎾🏆");
      }, 1000);

      // Set final victory scoreboard
      setTimeout(() => {
        this.demoController.setScoreScript({ a: 'WIN', b: '0', leader: 'a' });
      }, 500);

      // Victory metrics animation
      this.demoController.animateMetricsToTarget({
        serve_speed: 150,
        spin_rate: 3500,
        rally_length: 8,
        shot_accuracy: 100,
        reaction_time: 0.18,
        court_coverage: 100
      }, 3000);

      // Wait for celebration to complete
      await new Promise(resolve => setTimeout(resolve, 8000));

      console.log('[SyncEngine] ✅ Victory sequence complete');

    } catch (error) {
      console.error('[SyncEngine] Error in victory sequence:', error);
    }
  }

  /**
   * Calculate delay until next beat execution
   */
  calculateNextBeatDelay(beat) {
    const execution = beat.execution || {};
    const baseDuration = beat.time || 0;

    // If this is not the first beat, calculate relative timing
    if (this.currentBeatIndex > 0) {
      const prevBeat = this.timeline[this.currentBeatIndex - 1];
      const prevTime = prevBeat.time || 0;
      return Math.max(100, baseDuration - prevTime); // Minimum 100ms between beats
    }

    return baseDuration;
  }

  /**
   * Report beat execution for performance analysis
   */
  reportBeatExecution(beat, startTime, endTime, error = null) {
    const report = {
      beatId: beat.id,
      beatIndex: this.currentBeatIndex,
      startTime,
      endTime,
      executionDuration: endTime - startTime,
      expectedTime: beat.time || 0,
      timingVariance: (endTime - startTime) - (beat.time || 0),
      error: error ? error.message : null,
      timestamp: Date.now()
    };

    this.executionReports.push(report);

    if (this.config.debug) {
      console.log(`[SyncEngine] Beat ${beat.id} executed in ${report.executionDuration}ms (expected: ${report.expectedTime}ms)`);
    }
  }

  /**
   * Export timing report for analysis
   */
  exportReport() {
    const report = {
      totalBeats: this.timeline ? this.timeline.length : 0,
      executedBeats: this.executionReports.length,
      totalDuration: this.executionReports.length > 0 ?
        this.executionReports[this.executionReports.length - 1].endTime - this.executionReports[0].startTime : 0,
      averageTimingVariance: this.executionReports.reduce((sum, r) => sum + r.timingVariance, 0) / this.executionReports.length,
      beatReports: this.executionReports,
      config: { ...this.config },
      exportTime: Date.now()
    };

    console.log('[SyncEngine] Timing Report:', report);

    // Create downloadable JSON file
    const dataStr = JSON.stringify(report, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `sync-engine-timing-report-${Date.now()}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    return report;
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      currentBeatIndex: this.currentBeatIndex,
      totalBeats: this.timeline ? this.timeline.length : 0,
      currentBeat: this.timeline && this.currentBeatIndex < this.timeline.length ?
        this.timeline[this.currentBeatIndex] : null,
      executionReports: this.executionReports.length,
      config: { ...this.config }
    };
  }

  // 🔧 RELIABILITY HARDENING METHODS

  /**
   * 🔧 Audio Preloading & Health Checks
   */
  async verifyAudioHealth() {
    const now = Date.now();
    if (now - this.audioHealth.lastCheck < this.audioHealth.checkInterval) {
      return true; // Skip frequent checks
    }

    this.audioHealth.lastCheck = now;
    const missingSounds = [];

    for (const soundName of this.audioHealth.requiredSounds) {
      try {
        const audio = this.demoController.audio.sounds[soundName];
        if (!audio || audio.readyState === 0) {
          missingSounds.push(soundName);
        }
      } catch (error) {
        missingSounds.push(soundName);
      }
    }

    if (missingSounds.length > 0) {
      console.warn('[SyncEngine] Audio health check failed for:', missingSounds);
      return false;
    }

    if (this.config.debug) {
      console.log('[SyncEngine] ✅ Audio health check passed');
    }
    return true;
  }

  /**
   * 🔧 Audio Context Management
   */
  async ensureAudioContext() {
    const now = Date.now();
    if (now - this.audioContextHealth.lastCheck < this.audioContextHealth.checkInterval) {
      return;
    }

    this.audioContextHealth.lastCheck = now;

    try {
      if (this.demoController.audio.context) {
        const state = this.demoController.audio.context.state;

        if (state === 'suspended') {
          console.log('[SyncEngine] Resuming suspended audio context');
          await this.demoController.audio.context.resume();
        }

        this.audioContextHealth.contextState = state;

        if (this.config.debug) {
          console.log(`[SyncEngine] Audio context state: ${state}`);
        }
      }
    } catch (error) {
      console.warn('[SyncEngine] Audio context check failed:', error);
    }
  }

  /**
   * 🔧 Performance Monitoring
   */
  monitorPerformance() {
    const now = performance.now();
    const frameTime = now - this.performanceMonitor.lastFrameTime;

    if (frameTime > 20) { // Frame drop detection (50fps baseline)
      this.performanceMonitor.frameDrops++;

      if (this.performanceMonitor.frameDrops > 10) {
        console.warn('[SyncEngine] Performance degradation detected - consider restarting browser');
      }
    }

    this.performanceMonitor.lastFrameTime = now;

    // Memory monitoring (if available)
    if (performance.memory) {
      const memUsage = performance.memory.usedJSHeapSize / performance.memory.totalJSHeapSize;
      if (memUsage > 0.8) {
        this.performanceMonitor.memoryWarnings++;
        console.warn('[SyncEngine] High memory usage detected');
      }
    }
  }

  /**
   * 🔧 Graceful Failure Recovery
   */
  async handleSystemError(systemName, error, retryCallback) {
    console.error(`[SyncEngine] ${systemName} error:`, error);

    this.failureRecovery.consecutiveFailures++;

    if (this.failureRecovery.consecutiveFailures < this.failureRecovery.maxRetries) {
      console.log(`[SyncEngine] Attempting recovery (${this.failureRecovery.consecutiveFailures}/${this.failureRecovery.maxRetries})`);

      await this.delay(this.failureRecovery.retryDelay);

      try {
        await retryCallback();
        this.failureRecovery.consecutiveFailures = 0; // Success, reset counter
        return;
      } catch (retryError) {
        console.error(`[SyncEngine] Recovery attempt failed:`, retryError);
      }
    }

    // Fallback to graceful degradation
    console.warn(`[SyncEngine] ${systemName} failed ${this.failureRecovery.maxRetries} times, continuing without it`);
    this.executionReports.push({
      type: 'error',
      system: systemName,
      error: error.message,
      timestamp: Date.now(),
      recoveryAttempts: this.failureRecovery.maxRetries
    });
  }

  /**
   * 🔧 Timing Drift Compensation
   */
  compensateTimingDrift(beat) {
    const scheduledTime = beat.time;
    const currentTime = performance.now() - this.startTime - this.pageVisibility.totalHiddenTime;
    const timingDrift = currentTime - scheduledTime;

    this.timingCompensation.accumulatedDrift += timingDrift;

    if (Math.abs(timingDrift) > this.timingCompensation.driftThreshold) {
      console.warn(`[SyncEngine] Large timing drift detected: ${timingDrift.toFixed(1)}ms`);

      // Adjust next beat timing to compensate
      const compensation = timingDrift * 0.5; // Partial compensation
      beat.time += compensation;
    }
  }

  /**
   * 🔧 Health Status Report
   */
  getHealthStatus() {
    return {
      audioHealth: {
        lastCheck: this.audioHealth.lastCheck,
        status: this.audioHealth.lastCheck > 0 ? 'checked' : 'unchecked'
      },
      pageVisibility: {
        totalHiddenTime: this.pageVisibility.totalHiddenTime,
        currentlyHidden: document.hidden
      },
      audioContext: {
        state: this.audioContextHealth.contextState,
        lastCheck: this.audioContextHealth.lastCheck
      },
      performance: {
        frameDrops: this.performanceMonitor.frameDrops,
        memoryWarnings: this.performanceMonitor.memoryWarnings
      },
      timing: {
        accumulatedDrift: this.timingCompensation.accumulatedDrift
      },
      failures: {
        consecutiveFailures: this.failureRecovery.consecutiveFailures
      }
    };
  }

  /**
   * 🔧 Diagnostic Report Export
   */
  exportDiagnosticReport() {
    const healthStatus = this.getHealthStatus();
    const diagnosticReport = {
      timestamp: Date.now(),
      sessionDuration: this.startTime ? performance.now() - this.startTime : 0,
      healthStatus,
      executionSummary: {
        totalBeats: this.timeline ? this.timeline.length : 0,
        executedBeats: this.executionReports.length,
        errors: this.executionReports.filter(r => r.type === 'error').length
      },
      performanceMetrics: {
        averageTimingVariance: this.executionReports.length > 0 ?
          this.executionReports.reduce((sum, r) => sum + (r.timingVariance || 0), 0) / this.executionReports.length : 0,
        maxTimingVariance: Math.max(...this.executionReports.map(r => r.timingVariance || 0)),
        frameDrops: this.performanceMonitor.frameDrops
      },
      config: { ...this.config }
    };

    console.log('[SyncEngine] Diagnostic Report:', diagnosticReport);

    // Create downloadable JSON file
    const dataStr = JSON.stringify(diagnosticReport, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `sync-engine-diagnostic-${Date.now()}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    return diagnosticReport;
  }

  /**
   * Utility delay method
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Make globally available
if (typeof window !== 'undefined') {
  window.MatchPointSyncEngine = MatchPointSyncEngine;
}

export default MatchPointSyncEngine;