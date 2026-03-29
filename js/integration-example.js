// ===========================
// MatchPoint Sync Engine Integration - CLEANED & FIXED
// ===========================

document.addEventListener('DOMContentLoaded', function() {
  console.log('[Integration] Initializing MatchPoint Sync Engine...');

  // Create DemoController instance
  const demoController = new window.MatchPointDemoController({
    coachCueElementId: 'cue-text-display'
  });

  // Create Sync Engine
  const syncEngine = new window.MatchPointSyncEngine(demoController);

  // Load the epic timeline
  syncEngine.setTimeline(window.COMEBACK_EPIC_TIMELINE);

  // Make globally available for debugging
  window.syncEngine = syncEngine;
  window.demoController = demoController;

  console.log('[Integration] ✅ Sync engine initialized and ready');

  // 🔧 RELIABILITY HARDENING: Browser Focus Monitoring
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      syncEngine.pageVisibility.hiddenStartTime = performance.now();
      if (syncEngine.isPlaying && !syncEngine.isPaused) {
        console.log('[SyncEngine] Page hidden - auto-pausing demo');
        syncEngine.pause();
      }
    } else {
      if (syncEngine.pageVisibility.hiddenStartTime) {
        const hiddenDuration = performance.now() - syncEngine.pageVisibility.hiddenStartTime;
        syncEngine.pageVisibility.totalHiddenTime += hiddenDuration;
        syncEngine.pageVisibility.hiddenStartTime = null;

        if (syncEngine.config.debug) {
          console.log(`[SyncEngine] Page was hidden for ${hiddenDuration.toFixed(0)}ms`);
        }
      }
    }
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (event) => {
    // Space bar for play/pause
    if (event.code === 'Space') {
      event.preventDefault();
      if (syncEngine.isPlaying && !syncEngine.isPaused) {
        syncEngine.pause();
      } else if (syncEngine.isPlaying && syncEngine.isPaused) {
        syncEngine.resume();
      } else {
        syncEngine.play();
      }
    }

    // Escape for stop
    if (event.code === 'Escape') {
      event.preventDefault();
      syncEngine.stop();
    }
  });

  // Utility function for downloading files
  window.downloadFile = function(content, filename, contentType = 'text/plain') {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Add export timing report method to syncEngine
  syncEngine.exportTimingReport = function() {
    const report = this.exportReport();
    const jsonContent = JSON.stringify(report, null, 2);
    const filename = `matchpoint-timing-report-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    window.downloadFile(jsonContent, filename, 'application/json');
    console.log('[Integration] Timing report exported:', filename);
  };

  // Add diagnostic report method to syncEngine
  syncEngine.exportDiagnosticReport = function() {
    const report = this.exportDiagnosticReport();
    const jsonContent = JSON.stringify(report, null, 2);
    const filename = `sync-engine-diagnostic-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    window.downloadFile(jsonContent, filename, 'application/json');
    console.log('[Integration] Diagnostic report exported:', filename);
  };


  // 🔧 STATUS UPDATE FUNCTION
  function updateDemoStatus() {
    const statusEl = document.getElementById('demo-status');
    const beatEl = document.getElementById('current-beat');
    const timeEl = document.getElementById('demo-time');

    if (statusEl) {
      if (syncEngine.isPlaying && !syncEngine.isPaused) {
        statusEl.textContent = 'Running';
        statusEl.style.color = '#00ff88';
      } else if (syncEngine.isPlaying && syncEngine.isPaused) {
        statusEl.textContent = 'Paused';
        statusEl.style.color = '#ffa500';
      } else {
        statusEl.textContent = 'Ready';
        statusEl.style.color = '#888';
      }
    }

    if (beatEl) {
      beatEl.textContent = `${syncEngine.currentBeatIndex}/${syncEngine.timeline ? syncEngine.timeline.length : 19}`;
    }

    if (timeEl && syncEngine.startTime) {
      const elapsed = Math.floor((performance.now() - syncEngine.startTime - syncEngine.pageVisibility.totalHiddenTime) / 1000);
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;
      timeEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }

  // Update status every second
  setInterval(updateDemoStatus, 1000);

  // 🔧 BUTTON CLICK HANDLERS - Single consolidated set
  const startBtn = document.getElementById('start-demo-btn');
  if (startBtn) {
    startBtn.addEventListener('click', async function() {
      console.log('[Integration] Start Demo button clicked');
      try {
        await syncEngine.play();
        startBtn.textContent = 'Demo Running...';
        startBtn.disabled = true;
        updateDemoStatus();
      } catch (error) {
        console.error('[Integration] Failed to start demo:', error);
        startBtn.textContent = 'Start Failed - Check Console';
      }
    });
  } else {
    console.warn('[Integration] start-demo-btn not found in DOM');
  }

  // Pause Button
  const pauseBtn = document.getElementById('pause-demo-btn');
  if (pauseBtn) {
    pauseBtn.addEventListener('click', function() {
      console.log('[Integration] Pause Demo button clicked');
      syncEngine.pause();
      updateDemoStatus();
    });
  }

  // Resume Button
  const resumeBtn = document.getElementById('resume-demo-btn');
  if (resumeBtn) {
    resumeBtn.addEventListener('click', function() {
      console.log('[Integration] Resume Demo button clicked');
      syncEngine.resume();
      updateDemoStatus();
    });
  }

  // Stop Button
  const stopBtn = document.getElementById('stop-demo-btn');
  if (stopBtn) {
    stopBtn.addEventListener('click', function() {
      console.log('[Integration] Stop Demo button clicked');
      syncEngine.stop();
      const startBtn = document.getElementById('start-demo-btn');
      if (startBtn) {
        startBtn.textContent = 'Start 5-Min Epic';
        startBtn.disabled = false;
      }
      updateDemoStatus();
    });
  }

  console.log('[Integration] 🎬 MatchPoint Sync Engine ready with reliability hardening!');
  console.log('[Integration] 🔧 Hardened Features: Audio health checks, focus monitoring, context management, debouncing, performance monitoring, timing compensation, failure recovery');
  console.log('[Integration] Available commands:');
  console.log('[Integration]   syncEngine.play() - Start the 5-minute epic demo');
  console.log('[Integration]   syncEngine.pause() - Pause execution');
  console.log('[Integration]   syncEngine.resume() - Resume from pause');
  console.log('[Integration]   syncEngine.stop() - Stop and reset');
  console.log('[Integration]   syncEngine.exportTimingReport() - Export timing analysis');
  console.log('[Integration]   syncEngine.exportDiagnosticReport() - Export full diagnostic report');
  console.log('[Integration]   syncEngine.getStatus() - Get current status');
  console.log('[Integration]   syncEngine.getHealthStatus() - Get system health status');
  console.log('[Integration] Keyboard shortcuts: Space (play/pause), Escape (stop)');
  console.log('[Integration] 🔒 Reliability: Auto-pause on tab switch, audio context recovery, interaction debouncing');
});