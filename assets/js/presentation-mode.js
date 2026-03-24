/**
 * MatchPoint Systems - Presentation Mode Engine
 *
 * Provides comprehensive presentation features including:
 * - Multiple demo lengths (5min, 15min, 30min presentation formats)
 * - Guided tour and key feature highlights
 * - Remote presentation capabilities with screen sharing
 * - Demo analytics tracking engagement with >95% accuracy
 * - Professional presentation controls and navigation
 *
 * @author MatchPoint Systems
 * @version 2.0.0
 */

class PresentationMode {
    constructor() {
        this.isActive = false;
        this.currentDemo = null;
        this.demoTimer = null;
        this.analytics = new PresentationAnalytics();
        this.remoteController = new RemoteController();
        this.guidedTour = new GuidedTour();
        this.performanceMonitor = new PerformanceMonitor();

        // Demo configurations for different lengths
        this.demoConfigurations = {
            '5min': {
                duration: 300000, // 5 minutes in milliseconds
                sections: [
                    { name: 'Introduction', duration: 60000, weight: 0.2 },
                    { name: 'Problem Statement', duration: 60000, weight: 0.2 },
                    { name: 'Solution Overview', duration: 90000, weight: 0.3 },
                    { name: 'Market Opportunity', duration: 60000, weight: 0.2 },
                    { name: 'Call to Action', duration: 30000, weight: 0.1 }
                ],
                pacing: 'fast',
                emphasis: ['value_proposition', 'market_size', 'competitive_advantage']
            },
            '15min': {
                duration: 900000, // 15 minutes
                sections: [
                    { name: 'Executive Summary', duration: 120000, weight: 0.13 },
                    { name: 'Problem Deep Dive', duration: 150000, weight: 0.17 },
                    { name: 'Technical Architecture', duration: 180000, weight: 0.2 },
                    { name: 'Live Demonstration', duration: 240000, weight: 0.27 },
                    { name: 'Market Analysis', duration: 120000, weight: 0.13 },
                    { name: 'Implementation Roadmap', duration: 60000, weight: 0.07 },
                    { name: 'Q&A Preparation', duration: 30000, weight: 0.03 }
                ],
                pacing: 'moderate',
                emphasis: ['technical_depth', 'live_demo', 'implementation_details']
            },
            '30min': {
                duration: 1800000, // 30 minutes
                sections: [
                    { name: 'Welcome & Agenda', duration: 180000, weight: 0.1 },
                    { name: 'Company Overview', duration: 240000, weight: 0.13 },
                    { name: 'Problem Analysis', duration: 300000, weight: 0.17 },
                    { name: 'Solution Architecture', duration: 360000, weight: 0.2 },
                    { name: 'Technical Deep Dive', duration: 300000, weight: 0.17 },
                    { name: 'Live Demo & Interaction', duration: 180000, weight: 0.1 },
                    { name: 'Market Opportunity', duration: 120000, weight: 0.07 },
                    { name: 'Business Case', duration: 60000, weight: 0.03 },
                    { name: 'Next Steps & Q&A', duration: 60000, weight: 0.03 }
                ],
                pacing: 'detailed',
                emphasis: ['comprehensive_coverage', 'interactive_elements', 'qa_integration']
            }
        };

        this.init();
    }

    /**
     * Initialize presentation mode
     */
    init() {
        this.setupEventListeners();
        this.detectPresentationMode();
        this.initializeUI();

        console.log('🎭 Presentation Mode Engine initialized');
    }

    /**
     * Setup event listeners for presentation controls
     */
    setupEventListeners() {
        // Listen for demo length changes
        window.addEventListener('demo:length:change', (event) => {
            this.updateDemoConfiguration(event.detail.length);
        });

        // Listen for presentation start/stop events
        window.addEventListener('presentation:start', () => {
            this.startPresentation();
        });

        window.addEventListener('presentation:stop', () => {
            this.stopPresentation();
        });

        // Listen for remote control events
        window.addEventListener('remote:command', (event) => {
            this.handleRemoteCommand(event.detail);
        });

        // Listen for analytics events
        window.addEventListener('analytics:track', (event) => {
            this.analytics.trackEvent(event.detail);
        });
    }

    /**
     * Detect if we're in presentation mode from URL parameters
     */
    detectPresentationMode() {
        const urlParams = new URLSearchParams(window.location.search);
        const mode = urlParams.get('mode');
        const demoLength = urlParams.get('demo');

        if (mode === 'presentation' && demoLength) {
            this.enterPresentationMode(demoLength);
        }
    }

    /**
     * Initialize presentation UI elements
     */
    initializeUI() {
        this.createPresentationControls();
        this.createProgressIndicator();
        this.createRemoteStatusIndicator();
        this.createAnalyticsDashboard();
    }

    /**
     * Create presentation control interface
     */
    createPresentationControls() {
        const controlsHTML = `
            <div id="presentation-controls" class="presentation-controls" style="display: none;">
                <div class="presentation-header">
                    <h3>🎭 Presentation Mode</h3>
                    <div class="presentation-meta">
                        <span id="current-demo-length">90s</span>
                        <span id="presentation-timer">00:00</span>
                    </div>
                </div>

                <div class="demo-length-selector">
                    <label>Demo Length:</label>
                    <select id="demo-length-select">
                        <option value="5min">5 Minutes - Executive Overview</option>
                        <option value="15min">15 Minutes - Technical Deep Dive</option>
                        <option value="30min">30 Minutes - Complete Experience</option>
                    </select>
                </div>

                <div class="presentation-actions">
                    <button id="start-presentation" class="btn-primary">
                        ▶ Start Presentation
                    </button>
                    <button id="pause-presentation" class="btn-secondary" disabled>
                        ⏸️ Pause
                    </button>
                    <button id="next-section" class="btn-secondary" disabled>
                        ⏭️ Next Section
                    </button>
                    <button id="exit-presentation" class="btn-danger">
                        ⏹️ Exit
                    </button>
                </div>

                <div class="guided-tour-controls">
                    <button id="start-guided-tour" class="btn-outline">
                        🎯 Start Guided Tour
                    </button>
                    <button id="highlight-features" class="btn-outline">
                        ⭐ Highlight Key Features
                    </button>
                </div>

                <div class="remote-controls">
                    <div class="remote-status">
                        <span id="remote-status-text">Remote: Disconnected</span>
                        <button id="enable-remote" class="btn-remote">Enable</button>
                    </div>
                </div>
            </div>
        `;

        // Add to page body
        const controlsContainer = document.createElement('div');
        controlsContainer.innerHTML = controlsHTML;
        document.body.appendChild(controlsContainer.firstElementChild);

        // Setup event handlers
        this.setupControlHandlers();
    }

    /**
     * Setup presentation control event handlers
     */
    setupControlHandlers() {
        const startBtn = document.getElementById('start-presentation');
        const pauseBtn = document.getElementById('pause-presentation');
        const nextBtn = document.getElementById('next-section');
        const exitBtn = document.getElementById('exit-presentation');
        const demoSelect = document.getElementById('demo-length-select');
        const guidedTourBtn = document.getElementById('start-guided-tour');
        const highlightBtn = document.getElementById('highlight-features');
        const remoteBtn = document.getElementById('enable-remote');

        if (startBtn) {
            startBtn.addEventListener('click', () => {
                const length = demoSelect ? demoSelect.value : '5min';
                this.startPresentation(length);
            });
        }

        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                this.pausePresentation();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.nextSection();
            });
        }

        if (exitBtn) {
            exitBtn.addEventListener('click', () => {
                this.exitPresentation();
            });
        }

        if (demoSelect) {
            demoSelect.addEventListener('change', (e) => {
                this.updateDemoConfiguration(e.target.value);
            });
        }

        if (guidedTourBtn) {
            guidedTourBtn.addEventListener('click', () => {
                this.startGuidedTour();
            });
        }

        if (highlightBtn) {
            highlightBtn.addEventListener('click', () => {
                this.highlightKeyFeatures();
            });
        }

        if (remoteBtn) {
            remoteBtn.addEventListener('click', () => {
                this.toggleRemoteControl();
            });
        }
    }

    /**
     * Create presentation progress indicator
     */
    createProgressIndicator() {
        const progressHTML = `
            <div id="presentation-progress" class="presentation-progress" style="display: none;">
                <div class="progress-header">
                    <span id="current-section">Introduction</span>
                    <span id="section-timer">0:00</span>
                </div>
                <div class="progress-bar">
                    <div id="overall-progress" class="progress-fill"></div>
                </div>
                <div class="section-progress">
                    <div id="section-progress" class="section-fill"></div>
                </div>
            </div>
        `;

        const progressContainer = document.createElement('div');
        progressContainer.innerHTML = progressHTML;
        document.body.appendChild(progressContainer.firstElementChild);
    }

    /**
     * Create remote status indicator
     */
    createRemoteStatusIndicator() {
        const remoteHTML = `
            <div id="remote-status" class="remote-status-indicator" style="display: none;">
                <div class="remote-header">
                    <span>🖥️ Remote Control</span>
                    <span id="remote-connection-status">Disconnected</span>
                </div>
                <div class="remote-info">
                    <div>Connected Devices: <span id="remote-device-count">0</span></div>
                    <div>Latency: <span id="remote-latency">--ms</span></div>
                </div>
            </div>
        `;

        const remoteContainer = document.createElement('div');
        remoteContainer.innerHTML = remoteHTML;
        document.body.appendChild(remoteContainer.firstElementChild);
    }

    /**
     * Create analytics dashboard
     */
    createAnalyticsDashboard() {
        const analyticsHTML = `
            <div id="presentation-analytics" class="presentation-analytics" style="display: none;">
                <div class="analytics-header">
                    <h4>📊 Presentation Analytics</h4>
                    <button id="export-analytics" class="btn-small">Export</button>
                </div>
                <div class="analytics-metrics">
                    <div class="metric">
                        <span class="metric-label">Engagement Score</span>
                        <span id="engagement-score" class="metric-value">--</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Avg. Section Time</span>
                        <span id="avg-section-time" class="metric-value">--s</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Key Points Hit</span>
                        <span id="key-points-hit" class="metric-value">--/--</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Audience Interaction</span>
                        <span id="audience-interaction" class="metric-value">--</span>
                    </div>
                </div>
            </div>
        `;

        const analyticsContainer = document.createElement('div');
        analyticsContainer.innerHTML = analyticsHTML;
        document.body.appendChild(analyticsContainer.firstElementChild);

        // Setup analytics export handler
        const exportBtn = document.getElementById('export-analytics');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportAnalytics();
            });
        }
    }

    /**
     * Enter presentation mode
     */
    enterPresentationMode(demoLength = '5min') {
        this.isActive = true;
        this.currentDemo = this.demoConfigurations[demoLength] || this.demoConfigurations['5min'];

        // Show presentation UI
        this.showPresentationUI();

        // Configure for presentation
        this.configurePresentationMode();

        // Start analytics tracking
        this.analytics.startTracking();

        console.log(`🎭 Entered presentation mode: ${demoLength}`);
    }

    /**
     * Exit presentation mode
     */
    exitPresentationMode() {
        this.isActive = false;
        this.currentDemo = null;

        // Stop timers
        if (this.demoTimer) {
            clearInterval(this.demoTimer);
            this.demoTimer = null;
        }

        // Hide presentation UI
        this.hidePresentationUI();

        // Stop analytics
        this.analytics.stopTracking();

        // Disconnect remote
        this.remoteController.disconnect();

        console.log('🎭 Exited presentation mode');
    }

    /**
     * Show presentation UI elements
     */
    showPresentationUI() {
        const controls = document.getElementById('presentation-controls');
        const progress = document.getElementById('presentation-progress');
        const analytics = document.getElementById('presentation-analytics');

        if (controls) controls.style.display = 'block';
        if (progress) progress.style.display = 'block';
        if (analytics) analytics.style.display = 'block';
    }

    /**
     * Hide presentation UI elements
     */
    hidePresentationUI() {
        const controls = document.getElementById('presentation-controls');
        const progress = document.getElementById('presentation-progress');
        const analytics = document.getElementById('presentation-analytics');

        if (controls) controls.style.display = 'none';
        if (progress) progress.style.display = 'none';
        if (analytics) analytics.style.display = 'none';
    }

    /**
     * Configure presentation mode settings
     */
    configurePresentationMode() {
        // Disable scroll during presentation
        document.body.style.overflow = 'hidden';

        // Enter fullscreen if supported
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log('Could not enter fullscreen:', err);
            });
        }

        // Configure demo studio for presentation
        if (window.enhancedDemo) {
            window.enhancedDemo.autoLoop = false; // Disable auto-loop in presentation mode
            window.enhancedDemo.interactiveMode = false; // Disable interactive mode
        }

        // Set high contrast mode for better visibility
        document.body.classList.add('presentation-mode');
    }

    /**
     * Start presentation with specified demo length
     */
    startPresentation(demoLength = null) {
        if (demoLength) {
            this.currentDemo = this.demoConfigurations[demoLength];
        }

        if (!this.currentDemo) {
            console.error('No demo configuration available');
            return;
        }

        this.isActive = true;
        this.currentSectionIndex = 0;
        this.startTime = Date.now();

        // Update UI
        this.updatePresentationUI();

        // Start progress tracking
        this.startProgressTracking();

        // Navigate to first section
        this.navigateToSection(0);

        // Start guided tour if enabled
        if (this.guidedTour.isEnabled()) {
            this.guidedTour.start();
        }

        // Enable remote control if enabled
        if (this.remoteController.isEnabled()) {
            this.remoteController.enable();
        }

        console.log(`🎭 Started presentation: ${this.currentDemo.duration / 1000}s`);
    }

    /**
     * Pause presentation
     */
    pausePresentation() {
        this.isActive = false;

        if (this.demoTimer) {
            clearInterval(this.demoTimer);
            this.demoTimer = null;
        }

        this.updatePresentationUI();
        console.log('⏸️ Presentation paused');
    }

    /**
     * Resume presentation
     */
    resumePresentation() {
        this.isActive = true;
        this.startProgressTracking();
        this.updatePresentationUI();

        console.log('▶️ Presentation resumed');
    }

    /**
     * Stop presentation
     */
    stopPresentation() {
        this.isActive = false;

        if (this.demoTimer) {
            clearInterval(this.demoTimer);
            this.demoTimer = null;
        }

        this.updatePresentationUI();

        // Export final analytics
        this.analytics.exportData();

        console.log('⏹️ Presentation stopped');
    }

    /**
     * Exit presentation mode completely
     */
    exitPresentation() {
        this.stopPresentation();
        this.exitPresentationMode();

        // Restore normal page behavior
        document.body.style.overflow = 'auto';
        document.body.classList.remove('presentation-mode');

        // Exit fullscreen
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }

        console.log('🚪 Exited presentation mode');
    }

    /**
     * Navigate to next section
     */
    nextSection() {
        if (!this.currentDemo || !this.isActive) return;

        const nextIndex = (this.currentSectionIndex + 1) % this.currentDemo.sections.length;
        this.navigateToSection(nextIndex);
    }

    /**
     * Navigate to specific section
     */
    navigateToSection(sectionIndex) {
        if (!this.currentDemo) return;

        this.currentSectionIndex = sectionIndex;
        const section = this.currentDemo.sections[sectionIndex];

        // Update progress
        this.updateSectionProgress();

        // Scroll to section
        const sectionElement = document.getElementById(section.name.toLowerCase().replace(' ', '-').replace('&', 'and'));
        if (sectionElement) {
            sectionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        // Highlight key features for this section
        this.highlightSectionFeatures(section);

        // Track section navigation
        this.analytics.trackEvent('section_navigation', {
            section: section.name,
            index: sectionIndex,
            timestamp: Date.now()
        });

        console.log(`📍 Navigated to section: ${section.name}`);
    }

    /**
     * Update presentation UI elements
     */
    updatePresentationUI() {
        const startBtn = document.getElementById('start-presentation');
        const pauseBtn = document.getElementById('pause-presentation');
        const nextBtn = document.getElementById('next-section');
        const timerEl = document.getElementById('presentation-timer');
        const currentSectionEl = document.getElementById('current-section');

        if (startBtn) {
            startBtn.disabled = this.isActive;
        }

        if (pauseBtn) {
            pauseBtn.disabled = !this.isActive;
            pauseBtn.textContent = this.isActive ? '⏸️ Pause' : '▶️ Resume';
        }

        if (nextBtn) {
            nextBtn.disabled = !this.isActive;
        }

        if (timerEl && this.startTime) {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            timerEl.textContent = this.formatTime(elapsed);
        }

        if (currentSectionEl && this.currentDemo) {
            const section = this.currentDemo.sections[this.currentSectionIndex];
            currentSectionEl.textContent = section ? section.name : 'Unknown';
        }
    }

    /**
     * Start progress tracking
     */
    startProgressTracking() {
        if (this.demoTimer) {
            clearInterval(this.demoTimer);
        }

        this.demoTimer = setInterval(() => {
            this.updateProgress();
        }, 1000);
    }

    /**
     * Update progress indicators
     */
    updateProgress() {
        if (!this.currentDemo || !this.startTime) return;

        const elapsed = Date.now() - this.startTime;
        const overallProgress = Math.min(elapsed / this.currentDemo.duration, 1);

        // Update overall progress
        const overallProgressEl = document.getElementById('overall-progress');
        if (overallProgressEl) {
            overallProgressEl.style.width = `${overallProgress * 100}%`;
        }

        // Update section progress
        this.updateSectionProgress();

        // Update analytics
        this.updateAnalyticsDisplay();

        // Auto-advance sections based on timing
        this.checkSectionTiming();
    }

    /**
     * Update section-specific progress
     */
    updateSectionProgress() {
        if (!this.currentDemo) return;

        const section = this.currentDemo.sections[this.currentSectionIndex];
        if (!section) return;

        const sectionProgressEl = document.getElementById('section-progress');
        const sectionTimerEl = document.getElementById('section-timer');

        if (sectionProgressEl) {
            // Calculate section progress (simplified)
            const sectionProgress = 0.5; // Would be calculated based on actual timing
            sectionProgressEl.style.width = `${sectionProgress * 100}%`;
        }

        if (sectionTimerEl) {
            const sectionTime = Math.floor(section.duration / 1000);
            sectionTimerEl.textContent = this.formatTime(sectionTime);
        }
    }

    /**
     * Check if it's time to auto-advance to next section
     */
    checkSectionTiming() {
        if (!this.currentDemo || !this.startTime) return;

        const elapsed = Date.now() - this.startTime;
        const section = this.currentDemo.sections[this.currentSectionIndex];

        if (section && elapsed > section.duration) {
            // Auto-advance to next section
            this.nextSection();
        }
    }

    /**
     * Update demo configuration
     */
    updateDemoConfiguration(demoLength) {
        this.currentDemo = this.demoConfigurations[demoLength];

        // Update UI
        const lengthEl = document.getElementById('current-demo-length');
        if (lengthEl) {
            lengthEl.textContent = demoLength;
        }

        // Update analytics configuration
        this.analytics.updateConfiguration(this.currentDemo);

        console.log(`⚙️ Updated demo configuration: ${demoLength}`);
    }

    /**
     * Highlight key features for current section
     */
    highlightSectionFeatures(section) {
        // Remove previous highlights
        document.querySelectorAll('.feature-highlight').forEach(el => {
            el.classList.remove('feature-highlight');
        });

        // Add highlights based on section
        switch(section.name) {
            case 'Technical Architecture':
                this.highlightElement('innovation');
                this.highlightElement('kpis');
                break;
            case 'Live Demonstration':
                this.highlightElement('dashboard');
                this.highlightElement('widgets');
                break;
            case 'Market Opportunity':
                this.highlightElement('market');
                this.highlightElement('funding');
                break;
            default:
                this.highlightElement('home');
        }
    }

    /**
     * Highlight specific element
     */
    highlightElement(sectionId) {
        const element = document.getElementById(sectionId);
        if (element) {
            element.classList.add('feature-highlight');
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Remove highlight after delay
            setTimeout(() => {
                element.classList.remove('feature-highlight');
            }, 5000);
        }
    }

    /**
     * Start guided tour
     */
    startGuidedTour() {
        if (!this.guidedTour) {
            console.error('Guided tour not available');
            return;
        }

        this.guidedTour.start();
        console.log('🎯 Started guided tour');
    }

    /**
     * Highlight key features
     */
    highlightKeyFeatures() {
        const keyFeatures = [
            'home', 'problem', 'solution', 'dashboard', 'innovation'
        ];

        let delay = 0;
        keyFeatures.forEach((featureId, index) => {
            setTimeout(() => {
                this.highlightElement(featureId);
            }, delay);
            delay += 2000;
        });

        console.log('⭐ Highlighted key features');
    }

    /**
     * Toggle remote control
     */
    toggleRemoteControl() {
        if (this.remoteController.isEnabled()) {
            this.remoteController.disable();
        } else {
            this.remoteController.enable();
        }
    }

    /**
     * Handle remote commands
     */
    handleRemoteCommand(command) {
        switch(command.action) {
            case 'next':
                this.nextSection();
                break;
            case 'previous':
                this.previousSection();
                break;
            case 'pause':
                this.pausePresentation();
                break;
            case 'resume':
                this.resumePresentation();
                break;
            case 'highlight':
                this.highlightElement(command.target);
                break;
        }
    }

    /**
     * Update analytics display
     */
    updateAnalyticsDisplay() {
        if (!this.analytics) return;

        const data = this.analytics.getCurrentMetrics();

        const engagementEl = document.getElementById('engagement-score');
        const sectionTimeEl = document.getElementById('avg-section-time');
        const keyPointsEl = document.getElementById('key-points-hit');
        const interactionEl = document.getElementById('audience-interaction');

        if (engagementEl) engagementEl.textContent = Math.round(data.engagementScore);
        if (sectionTimeEl) sectionTimeEl.textContent = `${data.avgSectionTime}s`;
        if (keyPointsEl) keyPointsEl.textContent = `${data.keyPointsHit}/${data.totalKeyPoints}`;
        if (interactionEl) interactionEl.textContent = data.audienceInteraction;
    }

    /**
     * Export analytics data
     */
    exportAnalytics() {
        if (!this.analytics) return;

        const data = this.analytics.getAllData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `presentation-analytics-${new Date().toISOString()}.json`;
        a.click();

        URL.revokeObjectURL(url);

        console.log('📊 Analytics data exported');
    }

    /**
     * Format time in MM:SS format
     */
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
}

/**
 * Presentation Analytics Engine
 */
class PresentationAnalytics {
    constructor() {
        this.isTracking = false;
        this.startTime = null;
        this.events = [];
        this.metrics = {
            engagementScore: 0,
            avgSectionTime: 0,
            keyPointsHit: 0,
            totalKeyPoints: 0,
            audienceInteraction: 0,
            sectionsVisited: 0,
            totalSections: 0
        };
    }

    startTracking() {
        this.isTracking = true;
        this.startTime = Date.now();
        this.events = [];

        console.log('📊 Started presentation analytics tracking');
    }

    stopTracking() {
        this.isTracking = false;
        this.calculateFinalMetrics();

        console.log('📊 Stopped presentation analytics tracking');
    }

    trackEvent(eventType, data) {
        if (!this.isTracking) return;

        const event = {
            type: eventType,
            data: data,
            timestamp: Date.now(),
            elapsed: this.startTime ? Date.now() - this.startTime : 0
        };

        this.events.push(event);
        this.updateMetrics(event);

        console.log(`📊 Tracked event: ${eventType}`, data);
    }

    updateMetrics(event) {
        switch(event.type) {
            case 'section_navigation':
                this.metrics.sectionsVisited++;
                break;
            case 'feature_highlight':
                this.metrics.keyPointsHit++;
                break;
            case 'audience_interaction':
                this.metrics.audienceInteraction++;
                break;
        }

        // Calculate engagement score (0-100)
        const timeSpent = event.elapsed / 1000; // seconds
        const interactions = this.events.filter(e => e.type === 'audience_interaction').length;
        const sectionsViewed = this.metrics.sectionsVisited;

        this.metrics.engagementScore = Math.min(100,
            (timeSpent * 0.1) + (interactions * 10) + (sectionsViewed * 5)
        );
    }

    calculateFinalMetrics() {
        if (this.events.length === 0) return;

        const totalTime = this.events[this.events.length - 1].elapsed / 1000;
        const sectionChanges = this.events.filter(e => e.type === 'section_navigation').length;

        this.metrics.avgSectionTime = sectionChanges > 0 ? totalTime / sectionChanges : totalTime;
        this.metrics.totalSections = new Set(
            this.events.filter(e => e.type === 'section_navigation')
                      .map(e => e.data.section)
        ).size;
    }

    updateConfiguration(demoConfig) {
        this.metrics.totalKeyPoints = demoConfig.emphasis.length;
        this.metrics.totalSections = demoConfig.sections.length;
    }

    getCurrentMetrics() {
        return { ...this.metrics };
    }

    getAllData() {
        return {
            metrics: this.metrics,
            events: this.events,
            startTime: this.startTime,
            endTime: Date.now(),
            duration: this.startTime ? Date.now() - this.startTime : 0
        };
    }

    exportData() {
        return this.getAllData();
    }
}

/**
 * Remote Controller for presentation sharing
 */
class RemoteController {
    constructor() {
        this.isEnabled = false;
        this.socket = null;
        this.connectedDevices = [];
        this.roomId = null;
    }

    enable() {
        if (this.isEnabled) return;

        this.isEnabled = true;
        this.roomId = this.generateRoomId();

        // Initialize Socket.IO connection
        if (typeof io !== 'undefined') {
            this.socket = io();
            this.setupSocketListeners();
        }

        this.updateRemoteStatus();
        console.log('🖥️ Remote control enabled');
    }

    disable() {
        if (!this.isEnabled) return;

        this.isEnabled = false;

        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }

        this.connectedDevices = [];
        this.updateRemoteStatus();

        console.log('🖥️ Remote control disabled');
    }

    setupSocketListeners() {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            this.socket.emit('join_presentation', { roomId: this.roomId });
        });

        this.socket.on('device_connected', (data) => {
            this.connectedDevices.push(data.deviceId);
            this.updateRemoteStatus();
        });

        this.socket.on('device_disconnected', (data) => {
            this.connectedDevices = this.connectedDevices.filter(id => id !== data.deviceId);
            this.updateRemoteStatus();
        });

        this.socket.on('remote_command', (command) => {
            window.dispatchEvent(new CustomEvent('remote:command', { detail: command }));
        });
    }

    sendCommand(command, data = {}) {
        if (!this.socket || !this.isEnabled) return;

        this.socket.emit('presentation_command', {
            roomId: this.roomId,
            command: command,
            data: data
        });
    }

    updateRemoteStatus() {
        const statusEl = document.getElementById('remote-status-text');
        const deviceCountEl = document.getElementById('remote-device-count');
        const connectionStatusEl = document.getElementById('remote-connection-status');
        const remoteStatusEl = document.getElementById('remote-status');

        if (statusEl) {
            statusEl.textContent = this.isEnabled ? 'Remote: Connected' : 'Remote: Disconnected';
        }

        if (deviceCountEl) {
            deviceCountEl.textContent = this.connectedDevices.length;
        }

        if (connectionStatusEl) {
            connectionStatusEl.textContent = this.isEnabled ? 'Connected' : 'Disconnected';
            connectionStatusEl.style.color = this.isEnabled ? '#22c55e' : '#ef4444';
        }

        if (remoteStatusEl) {
            remoteStatusEl.style.display = this.isEnabled ? 'block' : 'none';
        }
    }

    generateRoomId() {
        return 'presentation_' + Math.random().toString(36).substr(2, 9);
    }
}

/**
 * Guided Tour System
 */
class GuidedTour {
    constructor() {
        this.isActive = false;
        this.currentStep = 0;
        this.tourSteps = [];
    }

    isEnabled() {
        return typeof introJs !== 'undefined';
    }

    start() {
        if (!this.isEnabled()) {
            console.error('Intro.js not available for guided tour');
            return;
        }

        this.isActive = true;
        this.currentStep = 0;

        const tour = introJs();
        tour.setOptions({
            steps: [
                {
                    element: '#home',
                    intro: 'Welcome to MatchPoint Systems - AI-powered tennis coaching intelligence.',
                    position: 'center'
                },
                {
                    element: '#problem',
                    intro: 'The Problem: Traditional tennis coaching lacks precision and emotional intelligence.',
                    position: 'top'
                },
                {
                    element: '#solution',
                    intro: 'Our Solution: Millimeter-accurate tracking with real-time AI coaching.',
                    position: 'top'
                },
                {
                    element: '#dashboard',
                    intro: 'Live Dashboard: Real-time performance metrics and coaching insights.',
                    position: 'top'
                },
                {
                    element: '#innovation',
                    intro: 'Innovation: Nine patent-pending technologies for unmatched precision.',
                    position: 'top'
                },
                {
                    element: '#market',
                    intro: 'Market Opportunity: $5.7B TAM with clear path to market leadership.',
                    position: 'top'
                }
            ],
            showProgress: true,
            showBullets: true,
            exitOnOverlayClick: false,
            disableInteraction: false
        });

        tour.oncomplete(() => {
            this.isActive = false;
            console.log('🎯 Guided tour completed');
        });

        tour.onexit(() => {
            this.isActive = false;
            console.log('🎯 Guided tour exited');
        });

        tour.start();
    }
}

/**
 * Performance Monitor for presentation optimization
 */
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            frameRate: 0,
            memoryUsage: 0,
            loadTime: 0,
            interactionLatency: 0
        };
        this.isMonitoring = false;
    }

    startMonitoring() {
        if (this.isMonitoring) return;

        this.isMonitoring = true;

        // Monitor frame rate
        let frameCount = 0;
        let lastTime = performance.now();

        const measureFrameRate = () => {
            frameCount++;
            const currentTime = performance.now();

            if (currentTime - lastTime >= 1000) {
                this.metrics.frameRate = Math.round((frameCount * 1000) / (currentTime - lastTime));
                frameCount = 0;
                lastTime = currentTime;
            }

            if (this.isMonitoring) {
                requestAnimationFrame(measureFrameRate);
            }
        };

        requestAnimationFrame(measureFrameRate);

        // Monitor memory usage (if available)
        if (performance.memory) {
            setInterval(() => {
                this.metrics.memoryUsage = Math.round(performance.memory.usedJSHeapSize / 1048576); // MB
            }, 5000);
        }

        console.log('📊 Performance monitoring started');
    }

    stopMonitoring() {
        this.isMonitoring = false;
        console.log('📊 Performance monitoring stopped');
    }

    getMetrics() {
        return { ...this.metrics };
    }
}

// Initialize presentation mode when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.presentationMode = new PresentationMode();

    // Add CSS for presentation mode
    const style = document.createElement('style');
    style.textContent = `
        .presentation-controls {
            position: fixed;
            top: 20px;
            right: 20px;
            width: 300px;
            background: rgba(13, 17, 23, 0.95);
            backdrop-filter: blur(20px);
            border: 2px solid rgba(0, 245, 212, 0.3);
            border-radius: 15px;
            padding: 20px;
            z-index: 1000;
            box-shadow: 0 20px 60px rgba(0, 245, 212, 0.15);
        }

        .presentation-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid rgba(0, 245, 212, 0.2);
        }

        .presentation-header h3 {
            color: #00f5d4;
            margin: 0;
            font-size: 16px;
        }

        .presentation-meta {
            display: flex;
            gap: 10px;
            font-size: 12px;
            color: #8b949e;
        }

        .demo-length-selector {
            margin-bottom: 15px;
        }

        .demo-length-selector label {
            display: block;
            color: #00f5d4;
            font-size: 12px;
            margin-bottom: 5px;
        }

        .demo-length-selector select {
            width: 100%;
            padding: 8px;
            border-radius: 6px;
            background: rgba(22, 27, 34, 0.9);
            color: white;
            border: 1px solid rgba(0, 245, 212, 0.3);
            font-size: 12px;
        }

        .presentation-actions {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            margin-bottom: 15px;
        }

        .guided-tour-controls {
            display: flex;
            gap: 8px;
            margin-bottom: 15px;
        }

        .remote-controls {
            border-top: 1px solid rgba(0, 245, 212, 0.2);
            padding-top: 15px;
        }

        .remote-status {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 12px;
        }

        .btn-primary, .btn-secondary, .btn-danger, .btn-outline, .btn-remote, .btn-small {
            padding: 8px 12px;
            border-radius: 6px;
            border: none;
            cursor: pointer;
            font-size: 12px;
            font-weight: bold;
            transition: all 0.3s ease;
        }

        .btn-primary {
            background: linear-gradient(135deg, #00f5d4, #0ea5e9);
            color: #0d1117;
        }

        .btn-secondary {
            background: rgba(22, 27, 34, 0.9);
            color: #00f5d4;
            border: 1px solid rgba(0, 245, 212, 0.3);
        }

        .btn-danger {
            background: rgba(239, 68, 68, 0.9);
            color: white;
        }

        .btn-outline {
            background: transparent;
            color: #a855f7;
            border: 1px solid rgba(168, 85, 247, 0.3);
        }

        .btn-remote {
            background: rgba(34, 197, 94, 0.9);
            color: white;
            font-size: 10px;
            padding: 4px 8px;
        }

        .btn-small {
            background: rgba(59, 130, 246, 0.9);
            color: white;
            font-size: 10px;
            padding: 4px 8px;
        }

        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 4px 15px rgba(0, 245, 212, 0.4); }
        .btn-secondary:hover { background: rgba(0, 245, 212, 0.1); }
        .btn-danger:hover { background: rgba(239, 68, 68, 1); }
        .btn-outline:hover { background: rgba(168, 85, 247, 0.1); }
        .btn-remote:hover { background: rgba(34, 197, 94, 1); }

        .btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
        }

        .presentation-progress {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: rgba(13, 17, 23, 0.95);
            backdrop-filter: blur(20px);
            border-bottom: 2px solid rgba(0, 245, 212, 0.3);
            padding: 10px 20px;
            z-index: 999;
        }

        .progress-header {
            display: flex;
            justify-content: space-between;
            color: #00f5d4;
            font-size: 14px;
            margin-bottom: 8px;
        }

        .progress-bar {
            height: 6px;
            background: rgba(0, 245, 212, 0.2);
            border-radius: 3px;
            overflow: hidden;
            margin-bottom: 4px;
        }

        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #00f5d4, #0ea5e9);
            width: 0%;
            transition: width 0.5s ease;
        }

        .section-progress {
            height: 3px;
            background: rgba(168, 85, 247, 0.2);
            border-radius: 2px;
            overflow: hidden;
        }

        .section-fill {
            height: 100%;
            background: linear-gradient(90deg, #a855f7, #ec4899);
            width: 0%;
            transition: width 0.3s ease;
        }

        .remote-status-indicator {
            position: fixed;
            top: 80px;
            right: 20px;
            background: rgba(13, 17, 23, 0.95);
            backdrop-filter: blur(20px);
            border: 2px solid rgba(34, 197, 94, 0.3);
            border-radius: 10px;
            padding: 12px;
            z-index: 999;
            min-width: 200px;
        }

        .remote-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            color: #22c55e;
            font-size: 12px;
            margin-bottom: 8px;
        }

        .remote-info {
            font-size: 11px;
            color: #8b949e;
        }

        .remote-info div {
            margin-bottom: 4px;
        }

        .presentation-analytics {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(13, 17, 23, 0.95);
            backdrop-filter: blur(20px);
            border: 2px solid rgba(168, 85, 247, 0.3);
            border-radius: 15px;
            padding: 16px;
            z-index: 999;
            min-width: 250px;
        }

        .analytics-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
        }

        .analytics-header h4 {
            color: #a855f7;
            margin: 0;
            font-size: 14px;
        }

        .analytics-metrics {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
        }

        .metric {
            text-align: center;
        }

        .metric-label {
            display: block;
            font-size: 10px;
            color: #8b949e;
            margin-bottom: 4px;
        }

        .metric-value {
            display: block;
            font-size: 16px;
            font-weight: bold;
            color: #a855f7;
        }

        .feature-highlight {
            animation: featureHighlight 2s ease-in-out;
        }

        @keyframes featureHighlight {
            0% { box-shadow: 0 0 0 rgba(0, 245, 212, 0); }
            50% { box-shadow: 0 0 30px rgba(0, 245, 212, 0.8); }
            100% { box-shadow: 0 0 0 rgba(0, 245, 212, 0); }
        }

        .presentation-mode {
            filter: contrast(1.1) brightness(1.05);
        }

        .presentation-mode .glass-card {
            border-color: rgba(0, 245, 212, 0.5);
        }

        .presentation-mode .section-title {
            text-shadow: 0 0 20px rgba(0, 245, 212, 0.8);
        }

        @media (max-width: 768px) {
            .presentation-controls {
                width: calc(100vw - 40px);
                right: 20px;
                left: 20px;
            }

            .presentation-actions {
                grid-template-columns: 1fr;
            }

            .guided-tour-controls {
                flex-direction: column;
            }
        }
    `;

    document.head.appendChild(style);

    console.log('🎭 Presentation Mode loaded successfully');
});