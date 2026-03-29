/**
 * =====================================================
 * MatchPoint Schumann-Cosmic Resonance Demo
 * =====================================================
 *
 * Demonstration and testing utilities for the Schumann-Cosmic
 * resonance engine integration.
 *
 * Features:
 * - Interactive testing of resonance modes
 * - Real-time visualization of Earth-Player alignment
 * - Audio frequency analysis and display
 * - Performance benchmarking
 *
 * @version 1.0.0 (Demo)
 */

// Demo utilities for Schumann-Cosmic engine
class SchumannCosmicDemo {
  constructor() {
    this.isRunning = false;
    this.demoInterval = null;
    this.testData = [];
    this.charts = {};
  }

  /**
   * Start interactive demo of Schumann-Cosmic features
   */
  async startDemo() {
    if (this.isRunning) return;

    console.log('[Schumann-Cosmic Demo] Starting interactive demonstration');

    try {
      // Initialize engine if not already done
      if (!window.schumannCosmicEngine) {
        await initializeSchumannCosmic();
      }

      this.isRunning = true;
      this.runDemoSequence();

    } catch (error) {
      console.error('[Schumann-Cosmic Demo] Failed to start:', error);
    }
  }

  /**
   * Stop the demo
   */
  stopDemo() {
    if (!this.isRunning) return;

    console.log('[Schumann-Cosmic Demo] Stopping demonstration');

    this.isRunning = false;

    if (this.demoInterval) {
      clearInterval(this.demoInterval);
      this.demoInterval = null;
    }

    // Stop any active resonance
    if (window.schumannCosmicEngine) {
      window.schumannCosmicEngine.stopResonance();
    }
  }

  /**
   * Run the demo sequence
   */
  runDemoSequence() {
    const demoSteps = [
      { action: 'showWelcome', delay: 1000 },
      { action: 'testGrounding', delay: 3000 },
      { action: 'testFocus', delay: 6000 },
      { action: 'testRecovery', delay: 9000 },
      { action: 'testPeak', delay: 12000 },
      { action: 'testBinaural', delay: 15000 },
      { action: 'showSummary', delay: 18000 }
    ];

    let currentStep = 0;

    const runNextStep = () => {
      if (!this.isRunning || currentStep >= demoSteps.length) {
        this.stopDemo();
        return;
      }

      const step = demoSteps[currentStep];
      this[step.action]();
      currentStep++;

      if (currentStep < demoSteps.length) {
        setTimeout(runNextStep, step.delay);
      }
    };

    runNextStep();
  }

  /**
   * Show welcome message
   */
  showWelcome() {
    this.showDemoToast('🌍 Welcome to Schumann-Cosmic Resonance Demo!', 'info');
  }

  /**
   * Test grounding mode
   */
  testGrounding() {
    if (!window.schumannCosmicEngine) return;

    console.log('[Demo] Testing Grounding mode');
    window.schumannCosmicEngine.startResonance({
      schumannIntensity: 0.4,
      cosmicIntensity: 0.2,
      modulationRate: 0.03
    });

    this.showDemoToast('🌱 Grounding Mode: Connecting to Earth\'s 7.83 Hz frequency', 'success');
  }

  /**
   * Test focus mode
   */
  testFocus() {
    if (!window.schumannCosmicEngine) return;

    console.log('[Demo] Testing Focus mode');
    window.schumannCosmicEngine.startResonance({
      schumannIntensity: 0.2,
      cosmicIntensity: 0.5,
      modulationRate: 0.08
    });

    this.showDemoToast('🎯 Focus Mode: Enhanced cosmic frequencies for concentration', 'success');
  }

  /**
   * Test recovery mode
   */
  testRecovery() {
    if (!window.schumannCosmicEngine) return;

    console.log('[Demo] Testing Recovery mode');
    window.schumannCosmicEngine.startResonance({
      schumannIntensity: 0.3,
      cosmicIntensity: 0.3,
      modulationRate: 0.05
    });

    this.showDemoToast('🔋 Recovery Mode: Balanced frequencies for restoration', 'success');
  }

  /**
   * Test peak performance mode
   */
  testPeak() {
    if (!window.schumannCosmicEngine) return;

    console.log('[Demo] Testing Peak Performance mode');
    window.schumannCosmicEngine.startResonance({
      schumannIntensity: 0.35,
      cosmicIntensity: 0.45,
      modulationRate: 0.06
    });

    this.showDemoToast('⚡ Peak Mode: Optimal frequency alignment', 'success');
  }

  /**
   * Test binaural beats
   */
  testBinaural() {
    if (!window.schumannCosmicEngine) {
      console.log('[Demo] Engine not available for binaural test');
      return;
    }

    console.log('[Demo] Testing binaural beats');
    window.schumannCosmicEngine.generateBinauralBeats('alpha', 0.5);
    this.showDemoToast('α Alpha Binaural: Brainwave entrainment for relaxed focus', 'success');
  }

  /**
   * Show demo summary
   */
  showSummary() {
    const state = window.schumannCosmicEngine?.getState();
    const summary = `
      Demo Complete! 🎉

      Schumann-Cosmic Features Demonstrated:
      • Earth-Player Resonance: ${state?.earthPlayerResonance ? (state.earthPlayerResonance * 100).toFixed(1) + '%' : 'N/A'}
      • Cosmic Alignment: ${state?.cosmicAlignment ? (state.cosmicAlignment * 100).toFixed(1) + '%' : 'N/A'}
      • Neural Entrainment: ${state?.neuralEntrainment ? (state.neuralEntrainment * 100).toFixed(1) + '%' : 'N/A'}

      This revolutionary system combines:
      • Earth's natural 7.83 Hz frequency
      • 432 Hz cosmic tuning
      • Real-time emotional state modulation
      • Advanced neural entrainment
    `;

    console.log('[Schumann-Cosmic Demo] Summary:', summary);
    this.showDemoToast('Demo complete! Check console for full summary.', 'success');
  }

  /**
   * Show demo toast notification
   * @param {string} message - Message to display
   * @param {string} type - Toast type (info, success, warning, error)
   */
  showDemoToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.textContent = message;

    const typeStyles = {
      info: 'rgba(59, 130, 246, 0.9)',
      success: 'rgba(34, 197, 94, 0.9)',
      warning: 'rgba(245, 158, 11, 0.9)',
      error: 'rgba(239, 68, 68, 0.9)'
    };

    toast.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      background: ${typeStyles[type] || typeStyles.info};
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-weight: 600;
      z-index: 10000;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      animation: slideInRight 0.3s ease;
      max-width: 300px;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideOutRight 0.3s ease';
      setTimeout(() => {
        try {
          document.body.removeChild(toast);
        } catch (e) {
          // Element might already be removed
        }
      }, 300);
    }, 3000);
  }

  /**
   * Generate test data for visualization
   * @param {number} duration - Duration in seconds
   * @param {number} interval - Update interval in ms
   */
  generateTestData(duration = 60, interval = 1000) {
    const dataPoints = duration * (1000 / interval);
    const testData = [];

    for (let i = 0; i < dataPoints; i++) {
      const time = i * (interval / 1000);
      const phase = (time / duration) * Math.PI * 2;

      testData.push({
        time,
        earthResonance: 0.5 + 0.3 * Math.sin(phase * 2),
        cosmicAlignment: 0.4 + 0.4 * Math.cos(phase * 1.5),
        neuralEntrainment: 0.6 + 0.2 * Math.sin(phase * 3),
        emotionalState: {
          confidence: 0.5 + 0.2 * Math.sin(phase),
          composure: 0.5 + 0.2 * Math.cos(phase * 1.2),
          focus: 0.5 + 0.2 * Math.sin(phase * 0.8),
          stress: 0.3 + 0.1 * Math.cos(phase * 2)
        }
      });
    }

    this.testData = testData;
    return testData;
  }

  /**
   * Create visualization of resonance data
   * @param {HTMLElement} container - Container element for the chart
   */
  createVisualization(container) {
    if (!container) return;

    const canvas = document.createElement('canvas');
    canvas.width = container.clientWidth || 600;
    canvas.height = 300;
    canvas.style.border = '1px solid rgba(75, 85, 99, 0.5)';
    canvas.style.borderRadius = '8px';
    canvas.style.background = 'rgba(17, 24, 39, 0.8)';

    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    this.charts.resonance = { canvas, ctx };

    this.startVisualization();
  }

  /**
   * Start real-time visualization
   */
  startVisualization() {
    if (!this.charts.resonance) return;

    const { canvas, ctx } = this.charts.resonance;
    let animationId;

    const animate = () => {
      if (!this.isRunning) return;

      // Clear canvas
      ctx.fillStyle = 'rgba(17, 24, 39, 0.9)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw resonance visualization
      this.drawResonanceVisualization(ctx, canvas.width, canvas.height);

      animationId = requestAnimationFrame(animate);
    };

    animate();
  }

  /**
   * Draw resonance visualization
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   */
  drawResonanceVisualization(ctx, width, height) {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 4;

    // Draw Earth frequency circle
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Draw cosmic frequency circle
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 1.2, 0, Math.PI * 2);
    ctx.stroke();

    // Draw current resonance state
    if (window.schumannCosmicEngine) {
      const state = window.schumannCosmicEngine.getState();

      // Earth-Player connection
      const earthAngle = state.earthPlayerResonance * Math.PI * 2;
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.8, 0, earthAngle);
      ctx.stroke();

      // Cosmic alignment
      const cosmicAngle = state.cosmicAlignment * Math.PI * 2;
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.1, 0, cosmicAngle);
      ctx.stroke();

      // Connection line between Earth and Cosmic
      const earthX = centerX + Math.cos(earthAngle) * radius * 0.8;
      const earthY = centerY + Math.sin(earthAngle) * radius * 0.8;
      const cosmicX = centerX + Math.cos(cosmicAngle) * radius * 1.1;
      const cosmicY = centerY + Math.sin(cosmicAngle) * radius * 1.1;

      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(earthX, earthY);
      ctx.lineTo(cosmicX, cosmicY);
      ctx.stroke();
    }

    // Draw legend
    ctx.fillStyle = '#9ca3af';
    ctx.font = '12px Inter';
    ctx.fillText('Earth-Player Resonance', 10, height - 40);
    ctx.fillText('Cosmic Alignment', 10, height - 20);

    ctx.fillStyle = '#22c55e';
    ctx.fillRect(width - 30, height - 45, 8, 8);
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(width - 30, height - 25, 8, 8);
  }
}

// Global demo instance
const schumannCosmicDemo = new SchumannCosmicDemo();

// Export for use in other modules
window.SchumannCosmicDemo = SchumannCosmicDemo;
window.schumannCosmicDemo = schumannCosmicDemo;

// Add CSS animations for demo toasts
const demoStyles = document.createElement('style');
demoStyles.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(demoStyles);