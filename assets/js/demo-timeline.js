// Demo Timeline Module
// Handles timeline functionality for the demo

class DemoTimeline {
  constructor() {
    this.events = [];
    this.currentTime = 0;
    this.isPlaying = false;
    this.playbackRate = 1.0;
  }

  addEvent(event) {
    this.events.push(event);
    this.events.sort((a, b) => a.time - b.time);
  }

  start() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    console.log('[DemoTimeline] Playback started');
  }

  pause() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    console.log('[DemoTimeline] Playback paused');
  }

  stop() {
    this.isPlaying = false;
    this.currentTime = 0;
    console.log('[DemoTimeline] Playback stopped');
  }

  setPlaybackRate(rate) {
    this.playbackRate = rate;
    console.log(`[DemoTimeline] Playback rate set to ${rate}x`);
  }

  getCurrentTime() {
    return this.currentTime;
  }

  getEvents() {
    return this.events;
  }

  clearEvents() {
    this.events = [];
    console.log('[DemoTimeline] Events cleared');
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DemoTimeline;
}

// Global instance for browser use
if (typeof window !== 'undefined') {
  window.DemoTimeline = DemoTimeline;
  window.demoTimeline = new DemoTimeline();
}
