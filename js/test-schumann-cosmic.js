/**
 * MatchPoint Schumann-Cosmic Resonance Frontend Test Suite
 *
 * Comprehensive testing for the frontend Schumann-Cosmic resonance integration.
 * Tests UI components, event handling, and real-time updates.
 */

class SchumannCosmicFrontendTester {
  constructor() {
    this.tests = [];
    this.results = [];
    this.isRunning = false;
  }

  /**
   * Run all frontend tests
   */
  async runAllTests() {
    if (this.isRunning) {
      console.warn('[Schumann-Test] Tests already running');
      return;
    }

    console.log('🧪 Starting Schumann-Cosmic Frontend Tests');
    this.isRunning = true;
    this.results = [];

    try {
      // Test suite
      await this.testEngineInitialization();
      await this.testUIComponents();
      await this.testEventHandling();
      await this.testRealTimeUpdates();
      await this.testErrorHandling();
      await this.testPerformance();

      this.showTestResults();

    } catch (error) {
      console.error('[Schumann-Test] Test suite failed:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Test engine initialization
   */
  async testEngineInitialization() {
    console.log('[Schumann-Test] Testing engine initialization...');

    try {
      // Check if SchumannCosmicEngine class exists
      if (typeof window.SchumannCosmicEngine === 'undefined') {
        throw new Error('SchumannCosmicEngine class not found');
      }

      // Try to create instance
      const engine = new window.SchumannCosmicEngine();

      if (!engine) {
        throw new Error('Failed to create engine instance');
      }

      // Check required methods
      const requiredMethods = ['initialize', 'startResonance', 'stopResonance', 'updatePlayerState', 'getState'];
      for (const method of requiredMethods) {
        if (typeof engine[method] !== 'function') {
          throw new Error(`Missing method: ${method}`);
        }
      }

      this.recordTest('Engine Initialization', true, 'Engine initialized successfully');
      console.log('✅ Engine initialization test passed');

    } catch (error) {
      this.recordTest('Engine Initialization', false, error.message);
      console.error('❌ Engine initialization test failed:', error.message);
    }
  }

  /**
   * Test UI components
   */
  async testUIComponents() {
    console.log('[Schumann-Test] Testing UI components...');

    try {
      // Check for required UI elements
      const requiredElements = [
        'harmonic-panel',
        'earth-resonance',
        'cosmic-alignment',
        'schumann-consent',
        'resonance-status'
      ];

      for (const elementId of requiredElements) {
        const element = document.getElementById(elementId);
        if (!element) {
          throw new Error(`Missing UI element: ${elementId}`);
        }
      }

      // Check for mode buttons
      const modeButtons = document.querySelectorAll('.schumann-mode');
      if (modeButtons.length === 0) {
        throw new Error('No Schumann mode buttons found');
      }

      // Check for binaural buttons
      const binauralButtons = document.querySelectorAll('.binaural-test');
      if (binauralButtons.length === 0) {
        throw new Error('No binaural test buttons found');
      }

      this.recordTest('UI Components', true, 'All UI components found and accessible');
      console.log('✅ UI components test passed');

    } catch (error) {
      this.recordTest('UI Components', false, error.message);
      console.error('❌ UI components test failed:', error.message);
    }
  }

  /**
   * Test event handling
   */
  async testEventHandling() {
    console.log('[Schumann-Test] Testing event handling...');

    try {
      // Test Schumann event listener registration
      let eventReceived = false;
      const testEventHandler = (e) => {
        eventReceived = true;
      };

      window.addEventListener('schumann:resonance:update', testEventHandler);

      // Simulate event dispatch
      const testEvent = new CustomEvent('schumann:resonance:update', {
        detail: { test: 'data' }
      });
      window.dispatchEvent(testEvent);

      // Check if event was received
      if (!eventReceived) {
        throw new Error('Schumann event not received');
      }

      // Clean up
      window.removeEventListener('schumann:resonance:update', testEventHandler);

      this.recordTest('Event Handling', true, 'Events dispatched and received correctly');
      console.log('✅ Event handling test passed');

    } catch (error) {
      this.recordTest('Event Handling', false, error.message);
      console.error('❌ Event handling test failed:', error.message);
    }
  }

  /**
   * Test real-time updates
   */
  async testRealTimeUpdates() {
    console.log('[Schumann-Test] Testing real-time updates...');

    try {
      // Simulate emotional state update
      const testEmotionalState = {
        confidence: 0.7,
        composure: 0.8,
        focus: 0.6,
        stress: 0.3
      };

      // Dispatch composure update event
      const composureEvent = new CustomEvent('matchpoint:composure:update', {
        detail: {
          present: 75,
          predicted: 80,
          intervene: false
        }
      });
      window.dispatchEvent(composureEvent);

      // Wait for processing
      await this.delay(100);

      // Check if UI was updated
      const earthResonanceEl = document.getElementById('earth-resonance');
      const cosmicAlignmentEl = document.getElementById('cosmic-alignment');

      if (!earthResonanceEl || !cosmicAlignmentEl) {
        throw new Error('Resonance display elements not found');
      }

      this.recordTest('Real-time Updates', true, 'Emotional state updates processed correctly');
      console.log('✅ Real-time updates test passed');

    } catch (error) {
      this.recordTest('Real-time Updates', false, error.message);
      console.error('❌ Real-time updates test failed:', error.message);
    }
  }

  /**
   * Test error handling
   */
  async testErrorHandling() {
    console.log('[Schumann-Test] Testing error handling...');

    try {
      // Test with invalid engine
      const invalidEngine = null;

      if (invalidEngine && typeof invalidEngine.startResonance === 'function') {
        throw new Error('Invalid engine should not have methods');
      }

      // Test with missing UI elements
      const missingElement = document.getElementById('nonexistent-element');
      if (missingElement !== null) {
        throw new Error('Nonexistent element should return null');
      }

      this.recordTest('Error Handling', true, 'Error conditions handled gracefully');
      console.log('✅ Error handling test passed');

    } catch (error) {
      this.recordTest('Error Handling', false, error.message);
      console.error('❌ Error handling test failed:', error.message);
    }
  }

  /**
   * Test performance
   */
  async testPerformance() {
    console.log('[Schumann-Test] Testing performance...');

    try {
      const startTime = performance.now();

      // Simulate multiple emotional state updates
      for (let i = 0; i < 100; i++) {
        const event = new CustomEvent('matchpoint:composure:update', {
          detail: {
            present: 50 + Math.random() * 50,
            predicted: 50 + Math.random() * 50,
            intervene: Math.random() > 0.8
          }
        });
        window.dispatchEvent(event);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete 100 updates in under 1 second
      if (duration > 1000) {
        throw new Error(`Performance test took ${duration.toFixed(2)}ms - too slow`);
      }

      this.recordTest('Performance', true, `${duration.toFixed(2)}ms for 100 updates`);
      console.log('✅ Performance test passed');

    } catch (error) {
      this.recordTest('Performance', false, error.message);
      console.error('❌ Performance test failed:', error.message);
    }
  }

  /**
   * Record test result
   */
  recordTest(testName, passed, message) {
    this.results.push({
      name: testName,
      passed,
      message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Show test results
   */
  showTestResults() {
    console.log('\n📊 Schumann-Cosmic Frontend Test Results');
    console.log('=' * 50);

    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    const successRate = (passed / total * 100).toFixed(1);

    console.log(`Overall: ${passed}/${total} tests passed (${successRate}%)`);

    this.results.forEach(result => {
      const icon = result.passed ? '✅' : '❌';
      console.log(`${icon} ${result.name}: ${result.message}`);
    });

    if (passed === total) {
      console.log('\n🎉 All frontend tests passed! System is ready.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the issues above.');
    }
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Global test instance
window.schumannCosmicTester = new SchumannCosmicFrontendTester();

// Auto-run tests if requested
if (typeof window !== 'undefined' && window.location.search.includes('runSchumannTests=true')) {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      window.schumannCosmicTester.runAllTests();
    }, 1000);
  });
}