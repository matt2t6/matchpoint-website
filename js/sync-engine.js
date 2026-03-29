// MatchPoint Synchronization Engine
// Orchestrates multi-system coordination for cinematic demo playback

import { comebackEpic } from './timeline-beats.js';

class MatchPointSyncEngine {
  constructor(config = {}) {
    this.timeline = comebackEpic;
    this.isPlaying = false;
    this.currentBeatIndex = 0;
    this.startTime = null;
    this.beatStartTime = null;

    // System references
    this.systems = {
      metrics: null,      // demo-controller metrics display
      audio: null,        // AudioManager
      coaching: null,     // CoachCueManager
      ui: null,           // scoreboard/ui elements
      demo: null          // DemoController
    };

    // Performance tracking
    this.executionLog = [];
    this.timingAnalysis = {};

    // Configuration
    this.config = {
      debug: config.debug || false,
      audioVolume: config.audioVolume || 0.8,
      metricsSmoothness: config.metricsSmoothness || 'easeInOutQuad',
      gracefulDegradation: config.gracefulDegradation || true
    };

    this.registerSystemDependencies();
  }

  registerSystemDependencies() {
    // Will be set by DemoController during integration
  }

  async playSynchronizedEpic() {
    this.isPlaying = true;
    this.startTime = Date.now();
    this.currentBeatIndex = 0;

    try {
      // Get all beats from all phases
      const allBeats = [
        ...this.timeline.struggle,
        ...this.timeline.turningPoint,
        ...this.timeline.challenge,
        ...this.timeline.climax
      ];

      for (let i = 0; i < allBeats.length; i++) {
        const beat = allBeats[i];
        this.currentBeatIndex = i;

        // Wait for exact timing
        await this.waitUntilBeatTime(beat.time);

        // Execute synchronized beat
        await this.executeBeat(beat);
      }

      // Finalize victory state
      await this.executeVictorySequence();

    } catch (error) {
      console.error('❌ Synchronization error:', error);
      this.handleSyncError(error);
    } finally {
      this.isPlaying = false;
    }
  }

  async waitUntilBeatTime(targetTime) {
    const targetMs = targetTime * 1000;
    const elapsed = Date.now() - this.startTime;
    const waitMs = targetMs - elapsed;

    if (waitMs > 0) {
      await this.delay(waitMs);
    }
  }

  async executeBeat(beat) {
    this.beatStartTime = Date.now();

    if (this.config.debug) {
      console.log(`🎬 [${beat.time}s] Executing: ${beat.beat}`);
    }

    // Orchestrate multi-system execution
    const systemPromises = [];

    // 1. Update metrics (usually longest animation)
    if (beat.metrics && this.systems.demo) {
      systemPromises.push(
        this.transitionMetrics(beat.metrics, beat.execution.metricsDuration)
          .catch(err => this.handleSystemError('metrics', err))
      );
    }

    // 2. Manage audio transitions
    if (beat.audio && this.systems.audio) {
      systemPromises.push(
        this.transitionAudio(beat.audio, beat.execution)
          .catch(err => this.handleSystemError('audio', err))
      );
    }

    // 3. Deliver coaching cue (with strategic delay for impact)
    if (beat.coaching && this.systems.coaching) {
      systemPromises.push(
        this.delay(beat.execution.coachingDelay)
          .then(() => this.deliverCoachingCue(beat.coaching))
          .catch(err => this.handleSystemError('coaching', err))
      );
    }

    // 4. Update UI (typically fastest)
    if (beat.ui && this.systems.demo) {
      systemPromises.push(
        this.updateUI(beat.ui)
          .catch(err => this.handleSystemError('ui', err))
      );
    }

    // Wait for all systems to complete their transitions
    const results = await Promise.allSettled(systemPromises);

    // Log timing analysis
    const beatDuration = Date.now() - this.beatStartTime;
    this.executionLog.push({
      beat: beat.id,
      time: beat.time,
      duration: beatDuration,
      systems: results.map(r => r.status)
    });

    if (this.config.debug) {
      console.log(`✅ Beat complete: ${beatDuration}ms`);
    }
  }

  async transitionMetrics(targetMetrics, durationMs) {
    if (!this.systems.demo) return;

    // Convert metrics format to demo-controller format
    const demoMetrics = {};
    if (targetMetrics.confidence !== undefined) demoMetrics.confidence = targetMetrics.confidence;
    if (targetMetrics.accuracy) {
      if (targetMetrics.accuracy.serve !== undefined) demoMetrics.serve_speed = targetMetrics.accuracy.serve;
      if (targetMetrics.accuracy.forehand !== undefined) demoMetrics.shot_accuracy = targetMetrics.accuracy.forehand;
    }
    if (targetMetrics.reaction_time !== undefined) demoMetrics.reaction_time = targetMetrics.reaction_time;
    if (targetMetrics.fatigue !== undefined) demoMetrics.fatigue = targetMetrics.fatigue;
    if (targetMetrics.focus !== undefined) demoMetrics.focus = targetMetrics.focus;

    // Use demo-controller's animateMetricsToTarget
    return this.systems.demo.animateMetricsToTarget(demoMetrics, durationMs);
  }

  async transitionAudio(audioState, execution) {
    if (!this.systems.audio) return;

    const transitions = [];

    // Handle ambient audio transitions
    if (audioState.ambient) {
      // For now, just play the ambient sound (assuming it's a key in sounds)
      transitions.push(
        this.systems.audio.play(audioState.ambient)
      );
    }

    // Handle SFX
    if (audioState.sfx) {
      transitions.push(
        this.systems.audio.play(audioState.sfx)
      );
    }

    // Handle music layer (if any)
    if (audioState.music) {
      // Placeholder for music
      console.log('Music layer:', audioState.music);
    }

    return Promise.all(transitions);
  }

  async deliverCoachingCue(coaching) {
    if (!this.systems.coaching) return;

    return this.systems.coaching.showCue(coaching.cue);
  }

  async updateUI(uiState) {
    if (!this.systems.demo) return;

    const updates = [];

    if (uiState.score) {
      updates.push(this.systems.demo.setScoreScript({ a: uiState.score.split('-')[0], b: uiState.score.split('-')[1] }));
    }

    if (uiState.momentum_display) {
      // Update momentum theme based on display
      const themes = {
        neutral: { glow: "#4df5ff", ring: "rgba(77,245,255,0.65)" },
        negative: { glow: "#ff8800", ring: "rgba(255,136,0,0.65)" },
        positive: { glow: "#00ff99", ring: "rgba(0,255,153,0.65)" },
        victory: { glow: "#ffff00", ring: "rgba(255,255,0,0.65)" }
      };
      if (themes[uiState.momentum_display]) {
        // Assuming setMomentumTheme is available globally or via demo
        if (window.setMomentumTheme) {
          window.setMomentumTheme(themes[uiState.momentum_display]);
        }
      }
    }

    if (uiState.set !== undefined) {
      // Update set display if available
      console.log('Set update:', uiState.set);
    }

    return Promise.all(updates);
  }

  async executeVictorySequence() {
    // Play victory audio and final coaching
    if (this.systems.audio) {
      this.systems.audio.play('applause_outro');
    }
    if (this.systems.coaching) {
      setTimeout(() => {
        this.systems.coaching.showCue("Remember this feeling - you are unstoppable!");
      }, 2000);
    }
  }

  handleSystemError(systemName, error) {
    console.error(`⚠️ ${systemName} error:`, error);

    // Log for debugging
    this.executionLog.push({
      type: 'error',
      system: systemName,
      error: error.message,
      timestamp: Date.now()
    });

    if (!this.config.gracefulDegradation) {
      throw error;
    }

    // Continue playing demo even if one system fails
    console.log(`✅ Continuing demo without ${systemName}`);
    return null;
  }

  handleSyncError(error) {
    // Attempt to restore playback state
    console.error('🚨 Critical sync error:', error);

    // Pause and show error
    this.pause();
  }

  pause() {
    this.isPlaying = false;
  }

  resume() {
    if (!this.isPlaying) {
      this.playSynchronizedEpic();
    }
  }

  stop() {
    this.isPlaying = false;
    this.executionLog = [];
  }

  async verifySystemsReady() {
    const health = {};

    health.metrics = this.systems.demo ? 'ready' : 'missing';
    health.audio = this.systems.audio ? 'ready' : 'missing';
    health.coaching = this.systems.coaching ? 'ready' : 'missing';
    health.ui = this.systems.demo ? 'ready' : 'missing';

    const allReady = Object.values(health).every(status => status === 'ready');

    if (!allReady) {
      console.warn('⚠️ Some systems not ready:', health);
    }

    return health;
  }

  getExecutionReport() {
    const report = {
      totalBeats: this.executionLog.length,
      totalDuration: this.executionLog.length > 0 ? this.executionLog[this.executionLog.length - 1].time : 0,
      avgBeatDuration: this.executionLog.length > 0 ? this.executionLog.reduce((sum, b) => sum + b.duration, 0) / this.executionLog.length : 0,
      timing: this.executionLog.map(beat => ({
        id: beat.beat,
        scheduledTime: beat.time,
        executionTime: beat.duration,
        systems: beat.systems
      }))
    };

    return report;
  }

  exportTimingAnalysis() {
    return JSON.stringify(this.getExecutionReport(), null, 2);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }
}

export { MatchPointSyncEngine };