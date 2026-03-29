// MatchPoint Cinematic Tour System
// Enhanced guided tour with smooth transitions and professional polish

class CinematicTour {
  constructor() {
    this.currentStep = 0;
    this.isActive = false;
    this.steps = [];
    this.tourData = null;
  }

  // Initialize the cinematic tour
  async initialize() {
    try {
      // Load tour configuration
      this.tourData = await this.loadTourConfig();
      this.setupTourSteps();
      this.bindEvents();
      console.log('🎬 Cinematic Tour initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Cinematic Tour:', error);
    }
  }

  // Load tour configuration from JSON or use defaults
  async loadTourConfig() {
    try {
      const response = await fetch('assets/tour-config.json');
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.log('Using default tour configuration');
    }

    // Default tour configuration
    return {
      steps: [
        {
          element: '#home',
          title: 'Welcome to MatchPoint',
          content: 'Experience the future of emotionally intelligent tennis coaching.',
          position: 'center'
        },
        {
          element: '#dashboard',
          title: 'Live Intelligence Dashboard',
          content: 'Real-time analytics and AI coaching insights.',
          position: 'top'
        },
        {
          element: '#demo-controls',
          title: 'Demo Studio',
          content: 'Control all demo scenarios and visual effects from here.',
          position: 'left'
        }
      ],
      settings: {
        autoPlay: false,
        showProgress: true,
        allowKeyboard: true,
        exitOnOverlay: false
      }
    };
  }

  // Setup tour steps based on configuration
  setupTourSteps() {
    if (!this.tourData) return;

    this.steps = this.tourData.steps.map(step => ({
      element: step.element,
      title: step.title,
      content: step.content,
      position: step.position || 'auto'
    }));
  }

  // Bind event listeners
  bindEvents() {
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (!this.isActive) return;

      switch(e.key) {
        case 'ArrowRight':
        case ' ':
          e.preventDefault();
          this.nextStep();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          this.previousStep();
          break;
        case 'Escape':
          e.preventDefault();
          this.endTour();
          break;
      }
    });
  }

  // Start the cinematic tour
  startTour() {
    if (this.steps.length === 0) {
      console.error('No tour steps available');
      return;
    }

    this.isActive = true;
    this.currentStep = 0;

    // Create tour overlay
    this.createTourOverlay();
    this.showStep(0);

    // Trigger tour start event
    window.dispatchEvent(new CustomEvent('cinematic-tour:start'));

    console.log('🎬 Cinematic Tour started');
  }

  // Create tour overlay elements
  createTourOverlay() {
    // Remove existing overlay
    const existing = document.getElementById('cinematic-tour-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'cinematic-tour-overlay';
    overlay.innerHTML = `
      <div class="tour-backdrop"></div>
      <div class="tour-tooltip">
        <div class="tour-content">
          <h3 class="tour-title"></h3>
          <p class="tour-description"></p>
        </div>
        <div class="tour-controls">
          <div class="tour-progress"></div>
          <div class="tour-buttons">
            <button class="tour-btn tour-prev">Previous</button>
            <button class="tour-btn tour-next">Next</button>
            <button class="tour-btn tour-end">End Tour</button>
          </div>
        </div>
      </div>
    `;

    // Add styles
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 10000;
      pointer-events: none;
      font-family: 'Inter', sans-serif;
    `;

    // Style backdrop
    const backdrop = overlay.querySelector('.tour-backdrop');
    backdrop.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(5px);
    `;

    // Style tooltip
    const tooltip = overlay.querySelector('.tour-tooltip');
    tooltip.style.cssText = `
      position: absolute;
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      border: 2px solid #22d3ee;
      border-radius: 16px;
      padding: 2rem;
      max-width: 400px;
      box-shadow: 0 25px 50px rgba(34, 211, 238, 0.2);
      pointer-events: all;
    `;

    document.body.appendChild(overlay);

    // Bind control events
    overlay.querySelector('.tour-prev').addEventListener('click', () => this.previousStep());
    overlay.querySelector('.tour-next').addEventListener('click', () => this.nextStep());
    overlay.querySelector('.tour-end').addEventListener('click', () => this.endTour());
  }

  // Show specific tour step
  showStep(stepIndex) {
    if (stepIndex < 0 || stepIndex >= this.steps.length) return;

    const step = this.steps[stepIndex];
    const overlay = document.getElementById('cinematic-tour-overlay');
    const tooltip = overlay.querySelector('.tour-tooltip');
    const title = overlay.querySelector('.tour-title');
    const description = overlay.querySelector('.tour-description');
    const progress = overlay.querySelector('.tour-progress');

    // Update content
    title.textContent = step.title;
    description.textContent = step.content;

    // Update progress
    const progressPercent = ((stepIndex + 1) / this.steps.length) * 100;
    progress.style.cssText = `
      width: 100%;
      height: 4px;
      background: rgba(34, 211, 238, 0.2);
      border-radius: 2px;
      margin-bottom: 1rem;
      position: relative;
    `;

    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
      height: 100%;
      width: ${progressPercent}%;
      background: linear-gradient(90deg, #22d3ee, #06b6d4);
      border-radius: 2px;
      transition: width 0.3s ease;
    `;
    progress.innerHTML = '';
    progress.appendChild(progressBar);

    // Position tooltip
    this.positionTooltip(tooltip, step.element, step.position);

    // Highlight target element
    this.highlightElement(step.element);
  }

  // Position tooltip relative to target element
  positionTooltip(tooltip, elementSelector, position = 'auto') {
    const element = document.querySelector(elementSelector);
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    let top, left;

    switch (position) {
      case 'top':
        top = rect.top - tooltipRect.height - 20;
        left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        break;
      case 'bottom':
        top = rect.bottom + 20;
        left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        break;
      case 'left':
        top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
        left = rect.left - tooltipRect.width - 20;
        break;
      case 'right':
        top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
        left = rect.right + 20;
        break;
      default: // center
        top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
        left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
    }

    // Keep tooltip in viewport
    top = Math.max(20, Math.min(top, window.innerHeight - tooltipRect.height - 20));
    left = Math.max(20, Math.min(left, window.innerWidth - tooltipRect.width - 20));

    tooltip.style.top = top + 'px';
    tooltip.style.left = left + 'px';
  }

  // Highlight target element
  highlightElement(elementSelector) {
    // Remove previous highlight
    const previous = document.querySelector('.tour-highlight');
    if (previous) previous.classList.remove('tour-highlight');

    const element = document.querySelector(elementSelector);
    if (element) {
      element.classList.add('tour-highlight');
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  // Go to next step
  nextStep() {
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      this.showStep(this.currentStep);
    } else {
      this.endTour();
    }
  }

  // Go to previous step
  previousStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.showStep(this.currentStep);
    }
  }

  // End the tour
  endTour() {
    this.isActive = false;

    // Remove overlay
    const overlay = document.getElementById('cinematic-tour-overlay');
    if (overlay) {
      overlay.remove();
    }

    // Remove highlights
    const highlighted = document.querySelector('.tour-highlight');
    if (highlighted) highlighted.classList.remove('tour-highlight');

    // Trigger tour end event
    window.dispatchEvent(new CustomEvent('cinematic-tour:end'));

    console.log('🎬 Cinematic Tour ended');
  }
}

// Global tour instance
window.cinematicTour = new CinematicTour();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.cinematicTour.initialize();
});

// Global function to start tour
window.startCinematicTour = () => {
  window.cinematicTour.startTour();
};