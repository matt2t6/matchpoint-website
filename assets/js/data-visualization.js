/**
 * Advanced Data Visualization Module for MatchPoint Systems
 * Implements sophisticated visualization features for tennis analytics
 */

import { matchpoint } from 'matchpoint.proto_type.matchflow_director';

class DataVisualizationEngine {
    constructor() {
        this.visualizationCache = new Map();
        this.animationFrame = null;
        this.isInitialized = false;
        this.heatMapData = [];
        this.trajectoryData = [];
        this.performanceData = [];
        this.movementData = [];
        this.predictiveData = [];

        // Configuration for different visualization types
        this.config = {
            heatMap: {
                courtWidth: 1000,
                courtHeight: 600,
                intensityLevels: 10,
                colorScheme: ['#0ea5e9', '#06b6d4', '#14b8a6', '#84cc16', '#eab308', '#f97316', '#ef4444']
            },
            trajectory3D: {
                width: 800,
                height: 600,
                ballRadius: 8,
                trailLength: 15,
                physics: {
                    gravity: 9.81,
                    airResistance: 0.02,
                    spinDecay: 0.98
                }
            },
            performance: {
                updateInterval: 100, // 100ms for real-time updates
                historyLength: 100,
                smoothingFactor: 0.3
            },
            movement: {
                flowResolution: 20,
                particleCount: 50,
                trailOpacity: 0.6
            },
            predictive: {
                confidenceInterval: 0.95,
                forecastHorizon: 20,
                trendSmoothing: 0.7
            }
        };

        this.initialize();
    }

    /**
     * Initialize the visualization engine
     */
    async initialize() {
        try {
            console.log('🎨 Initializing Data Visualization Engine...');

            // Check for required dependencies
            await this.checkDependencies();

            // Initialize visualization components
            await this.initializeHeatMap();
            await this.initializeTrajectory3D();
            await this.initializePerformanceCharts();
            await this.initializeMovementFlow();
            await this.initializePredictiveAnalytics();

            this.isInitialized = true;
            console.log('✅ Data Visualization Engine initialized successfully');

            // Start real-time updates
            this.startRealTimeUpdates();

        } catch (error) {
            console.error('❌ Failed to initialize Data Visualization Engine:', error);
            this.handleInitializationError(error);
        }
    }

    /**
     * Check for required dependencies and libraries
     */
    async checkDependencies() {
        const required = [
            { name: 'Chart.js', check: () => typeof Chart !== 'undefined' },
            { name: 'Three.js', check: () => typeof THREE !== 'undefined' },
            { name: 'D3.js', check: () => typeof d3 !== 'undefined' }
        ];

        const missing = [];
        for (const dep of required) {
            try {
                if (!dep.check()) {
                    missing.push(dep.name);
                }
            } catch (error) {
                missing.push(dep.name);
            }
        }

        if (missing.length > 0) {
            console.warn(`⚠️ Missing dependencies: ${missing.join(', ')}`);
            console.log('🔄 Attempting to load missing dependencies...');

            // Attempt to load missing dependencies
            for (const depName of missing) {
                await this.loadDependency(depName);
            }
        }
    }

    /**
     * Load missing dependencies dynamically
     */
    async loadDependency(name) {
        return new Promise((resolve, reject) => {
            const scripts = {
                'Chart.js': 'https://cdn.jsdelivr.net/npm/chart.js@4.4.2/dist/chart.umd.min.js',
                'Three.js': 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
                'D3.js': 'https://d3js.org/d3.v7.min.js'
            };

            if (!scripts[name]) {
                reject(new Error(`No script URL found for ${name}`));
                return;
            }

            const script = document.createElement('script');
            script.src = scripts[name];
            script.onload = () => {
                console.log(`✅ Loaded ${name}`);
                resolve();
            };
            script.onerror = () => {
                console.error(`❌ Failed to load ${name}`);
                reject(new Error(`Failed to load ${name}`));
            };

            document.head.appendChild(script);
        });
    }

    /**
     * Initialize heat map visualization for shot placement
     */
    async initializeHeatMap() {
        const container = document.getElementById('shot-heatmap-container');
        if (!container) {
            console.warn('⚠️ Heat map container not found');
            return;
        }

        try {
            // Create SVG container for heat map
            this.heatMapSvg = d3.select(container)
                .append('svg')
                .attr('width', this.config.heatMap.courtWidth)
                .attr('height', this.config.heatMap.courtHeight)
                .attr('viewBox', `0 0 ${this.config.heatMap.courtWidth} ${this.config.heatMap.courtHeight}`);

            // Draw tennis court outline
            this.drawCourtOutline();

            // Initialize heat map data structure
            this.heatMapData = this.initializeHeatMapData();

            console.log('✅ Heat map visualization initialized');

        } catch (error) {
            console.error('❌ Failed to initialize heat map:', error);
        }
    }

    /**
     * Initialize 3D trajectory visualization
     */
    async initializeTrajectory3D() {
        const container = document.getElementById('trajectory-3d-container');
        if (!container) {
            console.warn('⚠️ 3D trajectory container not found');
            return;
        }

        try {
            // Initialize Three.js scene
            this.scene = new THREE.Scene();
            this.camera = new THREE.PerspectiveCamera(
                75,
                this.config.trajectory3D.width / this.config.trajectory3D.height,
                0.1,
                1000
            );
            this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

            this.renderer.setSize(this.config.trajectory3D.width, this.config.trajectory3D.height);
            this.renderer.setClearColor(0x000000, 0);
            container.appendChild(this.renderer.domElement);

            // Position camera
            this.camera.position.set(0, 5, 10);
            this.camera.lookAt(0, 0, 0);

            // Create court plane
            this.createCourtGeometry();

            // Create ball and trajectory
            this.createBallGeometry();

            // Add lighting
            this.addLighting();

            console.log('✅ 3D trajectory visualization initialized');

        } catch (error) {
            console.error('❌ Failed to initialize 3D trajectory:', error);
        }
    }

    /**
     * Initialize real-time performance charts
     */
    async initializePerformanceCharts() {
        const containers = [
            'performance-chart-container',
            'comparison-chart-container',
            'trend-chart-container'
        ];

        for (const containerId of containers) {
            const container = document.getElementById(containerId);
            if (!container) {
                console.warn(`⚠️ Performance chart container ${containerId} not found`);
                continue;
            }

            try {
                const canvas = document.createElement('canvas');
                canvas.id = `${containerId}-canvas`;
                container.appendChild(canvas);

                // Initialize chart based on type
                if (containerId.includes('performance')) {
                    this.initializePerformanceChart(canvas);
                } else if (containerId.includes('comparison')) {
                    this.initializeComparisonChart(canvas);
                } else if (containerId.includes('trend')) {
                    this.initializeTrendChart(canvas);
                }

            } catch (error) {
                console.error(`❌ Failed to initialize ${containerId}:`, error);
            }
        }

        console.log('✅ Performance charts initialized');
    }

    /**
     * Initialize player movement flow visualization
     */
    async initializeMovementFlow() {
        const container = document.getElementById('movement-flow-container');
        if (!container) {
            console.warn('⚠️ Movement flow container not found');
            return;
        }

        try {
            // Create SVG for movement flow
            this.movementSvg = d3.select(container)
                .append('svg')
                .attr('width', 800)
                .attr('height', 600)
                .attr('viewBox', '0 0 800 600');

            // Initialize movement tracking
            this.movementData = [];
            this.flowParticles = [];

            console.log('✅ Movement flow visualization initialized');

        } catch (error) {
            console.error('❌ Failed to initialize movement flow:', error);
        }
    }

    /**
     * Initialize predictive analytics visualization
     */
    async initializePredictiveAnalytics() {
        const container = document.getElementById('predictive-analytics-container');
        if (!container) {
            console.warn('⚠️ Predictive analytics container not found');
            return;
        }

        try {
            // Create chart for predictive analytics
            const canvas = document.createElement('canvas');
            canvas.id = 'predictive-chart-canvas';
            container.appendChild(canvas);

            this.predictiveChart = new Chart(canvas, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [
                        {
                            label: 'Actual Performance',
                            data: [],
                            borderColor: '#00f5d4',
                            backgroundColor: 'rgba(0, 245, 212, 0.1)',
                            borderWidth: 3,
                            pointRadius: 0,
                            tension: 0.4
                        },
                        {
                            label: 'Predicted Performance',
                            data: [],
                            borderColor: '#a855f7',
                            backgroundColor: 'rgba(168, 85, 247, 0.1)',
                            borderWidth: 2,
                            pointRadius: 0,
                            tension: 0.4,
                            borderDash: [5, 5]
                        },
                        {
                            label: 'Confidence Interval',
                            data: [],
                            borderColor: '#a855f7',
                            backgroundColor: 'rgba(168, 85, 247, 0.2)',
                            borderWidth: 1,
                            pointRadius: 0,
                            tension: 0.4,
                            fill: '+1'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    },
                    plugins: {
                        legend: {
                            labels: {
                                color: '#c9d1d9',
                                font: { size: 14 }
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(22, 27, 34, 0.9)',
                            borderColor: '#00f5d4',
                            borderWidth: 1
                        }
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Time',
                                color: '#c9d1d9'
                            },
                            ticks: { color: '#8b949e' },
                            grid: { color: 'rgba(139, 148, 158, 0.1)' }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Performance Score',
                                color: '#c9d1d9'
                            },
                            ticks: { color: '#8b949e' },
                            grid: { color: 'rgba(139, 148, 158, 0.1)' }
                        }
                    }
                }
            });

            console.log('✅ Predictive analytics visualization initialized');

        } catch (error) {
            console.error('❌ Failed to initialize predictive analytics:', error);
        }
    }

    /**
     * Draw tennis court outline for heat map
     */
    drawCourtOutline() {
        const court = this.heatMapSvg.append('g').attr('class', 'court');

        // Court dimensions (proportional)
        const courtWidth = 780;
        const courtHeight = 360;
        const netHeight = 10;

        // Main court rectangle
        court.append('rect')
            .attr('x', (this.config.heatMap.courtWidth - courtWidth) / 2)
            .attr('y', (this.config.heatMap.courtHeight - courtHeight) / 2)
            .attr('width', courtWidth)
            .attr('height', courtHeight)
            .attr('fill', 'none')
            .attr('stroke', '#00f5d4')
            .attr('stroke-width', 3);

        // Net line
        court.append('line')
            .attr('x1', this.config.heatMap.courtWidth / 2)
            .attr('y1', (this.config.heatMap.courtHeight - courtHeight) / 2)
            .attr('x2', this.config.heatMap.courtWidth / 2)
            .attr('y2', (this.config.heatMap.courtHeight + courtHeight) / 2)
            .attr('stroke', '#00f5d4')
            .attr('stroke-width', 2);

        // Service boxes
        const serviceBoxWidth = courtWidth / 2 - 40;
        const serviceBoxHeight = courtHeight / 2 - 40;

        // Left service box
        court.append('rect')
            .attr('x', (this.config.heatMap.courtWidth - courtWidth) / 2 + 20)
            .attr('y', (this.config.heatMap.courtHeight - courtHeight) / 2 + 20)
            .attr('width', serviceBoxWidth)
            .attr('height', serviceBoxHeight)
            .attr('fill', 'none')
            .attr('stroke', '#00f5d4')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '5,5');

        // Right service box
        court.append('rect')
            .attr('x', this.config.heatMap.courtWidth / 2 + 20)
            .attr('y', (this.config.heatMap.courtHeight - courtHeight) / 2 + 20)
            .attr('width', serviceBoxWidth)
            .attr('height', serviceBoxHeight)
            .attr('fill', 'none')
            .attr('stroke', '#00f5d4')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '5,5');
    }

    /**
     * Initialize heat map data structure
     */
    initializeHeatMapData() {
        const gridSize = 20;
        const data = [];

        for (let x = 0; x < this.config.heatMap.courtWidth; x += gridSize) {
            for (let y = 0; y < this.config.heatMap.courtHeight; y += gridSize) {
                data.push({
                    x: x,
                    y: y,
                    intensity: 0,
                    shots: 0,
                    lastUpdate: 0
                });
            }
        }

        return data;
    }

    /**
     * Create 3D court geometry
     */
    createCourtGeometry() {
        // Court plane
        const courtGeometry = new THREE.PlaneGeometry(20, 12);
        const courtMaterial = new THREE.MeshLambertMaterial({
            color: 0x1a4d3a,
            transparent: true,
            opacity: 0.8
        });

        this.court = new THREE.Mesh(courtGeometry, courtMaterial);
        this.court.rotation.x = -Math.PI / 2;
        this.scene.add(this.court);

        // Court lines
        this.createCourtLines();
    }

    /**
     * Create court lines in 3D
     */
    createCourtLines() {
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00f5d4 });

        // Baseline
        const baselineGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-10, 0, 6),
            new THREE.Vector3(10, 0, 6)
        ]);
        const baseline = new THREE.Line(baselineGeometry, lineMaterial);
        this.scene.add(baseline);

        // Service line
        const serviceLineGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-10, 0, 2),
            new THREE.Vector3(10, 0, 2)
        ]);
        const serviceLine = new THREE.Line(serviceLineGeometry, lineMaterial);
        this.scene.add(serviceLine);

        // Net
        const netGeometry = new THREE.PlaneGeometry(20, 0.1);
        const netMaterial = new THREE.MeshLambertMaterial({ color: 0x00f5d4 });
        this.net = new THREE.Mesh(netGeometry, netMaterial);
        this.net.position.set(0, 0, 0);
        this.scene.add(this.net);
    }

    /**
     * Create ball geometry and trajectory system
     */
    createBallGeometry() {
        // Ball sphere
        const ballGeometry = new THREE.SphereGeometry(this.config.trajectory3D.ballRadius, 16, 16);
        const ballMaterial = new THREE.MeshPhongMaterial({
            color: 0xd4ff00,
            emissive: 0x444400,
            shininess: 100
        });

        this.ball = new THREE.Mesh(ballGeometry, ballMaterial);
        this.scene.add(this.ball);

        // Trajectory trail
        this.trailGeometry = new THREE.BufferGeometry();
        this.trailMaterial = new THREE.LineBasicMaterial({
            color: 0x00f5d4,
            transparent: true,
            opacity: 0.6
        });

        this.trail = new THREE.Line(this.trailGeometry, this.trailMaterial);
        this.scene.add(this.trail);

        // Trail positions
        this.trailPositions = [];
    }

    /**
     * Add lighting to 3D scene
     */
    addLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);

        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);

        // Point light for ball illumination
        const pointLight = new THREE.PointLight(0x00f5d4, 1, 100);
        pointLight.position.set(0, 5, 0);
        this.scene.add(pointLight);
    }

    /**
     * Initialize performance chart
     */
    initializePerformanceChart(canvas) {
        this.performanceChart = new Chart(canvas, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Player A Performance',
                        data: [],
                        borderColor: '#00f5d4',
                        backgroundColor: 'rgba(0, 245, 212, 0.1)',
                        borderWidth: 3,
                        pointRadius: 0,
                        tension: 0.4
                    },
                    {
                        label: 'Player B Performance',
                        data: [],
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        borderWidth: 3,
                        pointRadius: 0,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: this.config.performance.updateInterval
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        labels: {
                            color: '#c9d1d9',
                            font: { size: 14 }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(22, 27, 34, 0.9)',
                        borderColor: '#00f5d4',
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Time',
                            color: '#c9d1d9'
                        },
                        ticks: { color: '#8b949e' },
                        grid: { color: 'rgba(139, 148, 158, 0.1)' }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Performance Score',
                            color: '#c9d1d9'
                        },
                        min: 0,
                        max: 100,
                        ticks: { color: '#8b949e' },
                        grid: { color: 'rgba(139, 148, 158, 0.1)' }
                    }
                }
            }
        });
    }

    /**
     * Initialize comparison chart
     */
    initializeComparisonChart(canvas) {
        this.comparisonChart = new Chart(canvas, {
            type: 'radar',
            data: {
                labels: ['Speed', 'Accuracy', 'Consistency', 'Power', 'Endurance', 'Strategy'],
                datasets: [
                    {
                        label: 'Player A',
                        data: [85, 78, 82, 76, 79, 88],
                        borderColor: '#00f5d4',
                        backgroundColor: 'rgba(0, 245, 212, 0.2)',
                        borderWidth: 3,
                        pointBackgroundColor: '#00f5d4',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2
                    },
                    {
                        label: 'Player B',
                        data: [79, 85, 76, 88, 82, 74],
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245, 158, 11, 0.2)',
                        borderWidth: 3,
                        pointBackgroundColor: '#f59e0b',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#c9d1d9',
                            font: { size: 14 }
                        }
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            color: '#8b949e',
                            backdropColor: 'transparent',
                            font: { size: 12 }
                        },
                        grid: {
                            color: 'rgba(139, 148, 158, 0.2)',
                            lineWidth: 1
                        },
                        angleLines: {
                            color: 'rgba(139, 148, 158, 0.2)'
                        },
                        pointLabels: {
                            color: '#c9d1d9',
                            font: { size: 16, weight: 'bold' }
                        }
                    }
                }
            }
        });
    }

    /**
     * Initialize trend chart
     */
    initializeTrendChart(canvas) {
        this.trendChart = new Chart(canvas, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Performance Trend',
                        data: [],
                        borderColor: '#00f5d4',
                        backgroundColor: 'rgba(0, 245, 212, 0.1)',
                        borderWidth: 3,
                        pointRadius: 0,
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Moving Average',
                        data: [],
                        borderColor: '#a855f7',
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        pointRadius: 0,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: this.config.performance.updateInterval
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        labels: {
                            color: '#c9d1d9',
                            font: { size: 14 }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(22, 27, 34, 0.9)',
                        borderColor: '#00f5d4',
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Time',
                            color: '#c9d1d9'
                        },
                        ticks: { color: '#8b949e' },
                        grid: { color: 'rgba(139, 148, 158, 0.1)' }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Performance',
                            color: '#c9d1d9'
                        },
                        ticks: { color: '#8b949e' },
                        grid: { color: 'rgba(139, 148, 158, 0.1)' }
                    }
                }
            }
        });
    }

    /**
     * Start real-time updates for all visualizations
     */
    startRealTimeUpdates() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }

        const update = () => {
            if (this.isInitialized) {
                this.updateHeatMap();
                this.updateTrajectory3D();
                this.updatePerformanceCharts();
                this.updateMovementFlow();
                this.updatePredictiveAnalytics();
            }

            this.animationFrame = requestAnimationFrame(update);
        };

        update();
        console.log('🔄 Real-time visualization updates started');
    }

    /**
     * Update heat map with new shot data
     */
    updateHeatMap() {
        if (!this.heatMapSvg) return;

        // Generate sample shot data for demonstration
        const sampleShots = this.generateSampleShotData();

        // Update heat map data
        sampleShots.forEach(shot => {
            const gridX = Math.floor((shot.x / this.config.heatMap.courtWidth) * (this.config.heatMap.courtWidth / 20));
            const gridY = Math.floor((shot.y / this.config.heatMap.courtHeight) * (this.config.heatMap.courtHeight / 20));

            const gridIndex = gridY * (this.config.heatMap.courtWidth / 20) + gridX;
            if (this.heatMapData[gridIndex]) {
                this.heatMapData[gridIndex].intensity += shot.intensity;
                this.heatMapData[gridIndex].shots += 1;
                this.heatMapData[gridIndex].lastUpdate = Date.now();
            }
        });

        // Update visualization
        this.renderHeatMap();
    }

    /**
     * Render heat map visualization
     */
    renderHeatMap() {
        // Clear existing heat map
        this.heatMapSvg.selectAll('.heat-cell').remove();

        // Create heat map cells
        const cells = this.heatMapSvg.selectAll('.heat-cell')
            .data(this.heatMapData)
            .enter()
            .append('rect')
            .attr('class', 'heat-cell')
            .attr('x', d => d.x)
            .attr('y', d => d.y)
            .attr('width', 20)
            .attr('height', 20)
            .attr('fill', d => this.getHeatMapColor(d.intensity))
            .attr('opacity', d => Math.max(0.1, Math.min(0.8, d.intensity / 100)))
            .attr('rx', 2);

        // Add shot count labels for high-intensity areas
        this.heatMapSvg.selectAll('.heat-label')
            .data(this.heatMapData.filter(d => d.shots > 5))
            .enter()
            .append('text')
            .attr('class', 'heat-label')
            .attr('x', d => d.x + 10)
            .attr('y', d => d.y + 15)
            .attr('text-anchor', 'middle')
            .attr('fill', '#00f5d4')
            .attr('font-size', '10px')
            .attr('font-weight', 'bold')
            .text(d => d.shots);
    }

    /**
     * Get color for heat map intensity
     */
    getHeatMapColor(intensity) {
        const level = Math.min(Math.floor(intensity / 10), this.config.heatMap.colorScheme.length - 1);
        return this.config.heatMap.colorScheme[level];
    }

    /**
     * Update 3D trajectory visualization
     */
    updateTrajectory3D() {
        if (!this.scene) return;

        // Generate sample trajectory data
        const trajectory = this.generateSampleTrajectory();

        if (trajectory.length > 0) {
            // Update ball position
            const currentPos = trajectory[trajectory.length - 1];
            this.ball.position.set(currentPos.x, currentPos.y, currentPos.z);

            // Update trajectory trail
            this.updateTrajectoryTrail(trajectory);

            // Apply physics
            this.applyBallPhysics(currentPos);
        }

        // Render scene
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Update trajectory trail
     */
    updateTrajectoryTrail(trajectory) {
        this.trailPositions = trajectory.slice(-this.config.trajectory3D.trailLength);

        if (this.trailPositions.length > 1) {
            const points = this.trailPositions.map(pos =>
                new THREE.Vector3(pos.x, pos.y, pos.z)
            );

            this.trailGeometry.setFromPoints(points);
            this.trailGeometry.attributes.position.needsUpdate = true;
        }
    }

    /**
     * Apply realistic ball physics
     */
    applyBallPhysics(position) {
        // Simple physics simulation
        const physics = this.config.trajectory3D.physics;

        // Apply gravity effect
        if (position.y > 0.1) {
            position.y -= physics.gravity * 0.01;
        }

        // Apply air resistance
        position.x *= (1 - physics.airResistance);
        position.z *= (1 - physics.airResistance);

        // Apply spin decay
        if (position.spin) {
            position.spin *= physics.spinDecay;
        }
    }

    /**
     * Update performance charts with real-time data
     */
    updatePerformanceCharts() {
        if (!this.performanceChart || !this.comparisonChart || !this.trendChart) return;

        const now = new Date();
        const timeLabel = now.toLocaleTimeString();

        // Generate sample performance data
        const performanceData = this.generateSamplePerformanceData();

        // Update performance chart
        this.updateChartData(this.performanceChart, timeLabel, performanceData);

        // Update comparison chart
        this.updateComparisonData();

        // Update trend chart
        this.updateTrendData(timeLabel, performanceData);
    }

    /**
     * Update chart data with new values
     */
    updateChartData(chart, label, data) {
        if (chart.data.labels.length > this.config.performance.historyLength) {
            chart.data.labels.shift();
            chart.data.datasets.forEach(dataset => {
                dataset.data.shift();
            });
        }

        chart.data.labels.push(label);
        chart.data.datasets[0].data.push(data.playerA);
        chart.data.datasets[1].data.push(data.playerB);

        chart.update('none'); // Update without animation for real-time feel
    }

    /**
     * Update comparison chart data
     */
    updateComparisonData() {
        // Update with latest performance metrics
        const latestData = this.performanceData.slice(-1)[0];
        if (latestData && this.comparisonChart) {
            // Update comparison data based on current performance
            this.comparisonChart.data.datasets[0].data = [
                latestData.playerA.speed || 85,
                latestData.playerA.accuracy || 78,
                latestData.playerA.consistency || 82,
                latestData.playerA.power || 76,
                latestData.playerA.endurance || 79,
                latestData.playerA.strategy || 88
            ];

            this.comparisonChart.data.datasets[1].data = [
                latestData.playerB.speed || 79,
                latestData.playerB.accuracy || 85,
                latestData.playerB.consistency || 76,
                latestData.playerB.power || 88,
                latestData.playerB.endurance || 82,
                latestData.playerB.strategy || 74
            ];

            this.comparisonChart.update('none');
        }
    }

    /**
     * Update trend chart data
     */
    updateTrendData(label, data) {
        if (!this.trendChart) return;

        // Calculate moving average
        const rawData = data.playerA || 80;
        const movingAverage = this.calculateMovingAverage(rawData);

        this.updateChartData(this.trendChart, label, { value: rawData, movingAverage });
    }

    /**
     * Update movement flow visualization
     */
    updateMovementFlow() {
        if (!this.movementSvg) return;

        // Generate sample movement data
        const movementData = this.generateSampleMovementData();

        // Update flow particles
        this.updateFlowParticles(movementData);

        // Render movement flow
        this.renderMovementFlow();
    }

    /**
     * Update predictive analytics visualization
     */
    updatePredictiveAnalytics() {
        if (!this.predictiveChart) return;

        // Generate predictive data
        const predictiveData = this.generatePredictiveData();

        // Update chart with predictions and confidence intervals
        this.updatePredictiveChart(predictiveData);
    }

    /**
     * Generate sample shot data for heat map
     */
    generateSampleShotData() {
        const shots = [];
        const numShots = Math.floor(Math.random() * 5) + 3; // 3-8 shots

        for (let i = 0; i < numShots; i++) {
            shots.push({
                x: Math.random() * this.config.heatMap.courtWidth,
                y: Math.random() * this.config.heatMap.courtHeight,
                intensity: Math.random() * 50 + 10, // 10-60 intensity
                type: ['forehand', 'backhand', 'serve', 'volley'][Math.floor(Math.random() * 4)]
            });
        }

        return shots;
    }

    /**
     * Generate sample trajectory data
     */
    generateSampleTrajectory() {
        const trajectory = [];
        const numPoints = Math.floor(Math.random() * 10) + 5; // 5-15 points

        for (let i = 0; i < numPoints; i++) {
            const progress = i / (numPoints - 1);
            trajectory.push({
                x: progress * 15 - 7.5, // -7.5 to 7.5
                y: Math.sin(progress * Math.PI) * 8, // Ball arc
                z: progress * 10 - 5, // -5 to 5
                spin: Math.random() * 100 - 50 // -50 to 50
            });
        }

        return trajectory;
    }

    /**
     * Generate sample performance data
     */
    generateSamplePerformanceData() {
        return {
            playerA: {
                performance: Math.random() * 30 + 70, // 70-100
                speed: Math.random() * 20 + 80,
                accuracy: Math.random() * 15 + 75,
                consistency: Math.random() * 20 + 70
            },
            playerB: {
                performance: Math.random() * 30 + 70,
                speed: Math.random() * 20 + 75,
                accuracy: Math.random() * 15 + 75,
                consistency: Math.random() * 20 + 70
            }
        };
    }

    /**
     * Generate sample movement data
     */
    generateSampleMovementData() {
        const movements = [];
        const numMovements = Math.floor(Math.random() * 10) + 5;

        for (let i = 0; i < numMovements; i++) {
            movements.push({
                x: Math.random() * 800,
                y: Math.random() * 600,
                velocity: Math.random() * 2 + 1,
                direction: Math.random() * Math.PI * 2,
                intensity: Math.random()
            });
        }

        return movements;
    }

    /**
     * Generate predictive analytics data
     */
    generatePredictiveData() {
        const currentPerformance = this.performanceData.slice(-1)[0]?.playerA?.performance || 80;
        const trend = (Math.random() - 0.5) * 10; // -5 to 5 trend
        const forecast = [];

        // Generate forecast with confidence intervals
        for (let i = 0; i < this.config.predictive.forecastHorizon; i++) {
            const predictedValue = currentPerformance + (trend * (i + 1) * 0.1) + (Math.random() - 0.5) * 5;
            const confidenceRange = 5 * Math.sqrt(i + 1); // Increasing uncertainty

            forecast.push({
                predicted: Math.max(0, Math.min(100, predictedValue)),
                upperBound: Math.max(0, Math.min(100, predictedValue + confidenceRange)),
                lowerBound: Math.max(0, Math.min(100, predictedValue - confidenceRange))
            });
        }

        return forecast;
    }

    /**
     * Calculate moving average for trend analysis
     */
    calculateMovingAverage(newValue) {
        if (this.performanceData.length === 0) return newValue;

        const alpha = this.config.performance.smoothingFactor;
        const lastMA = this.performanceData.slice(-1)[0].movingAverage || newValue;

        return alpha * newValue + (1 - alpha) * lastMA;
    }

    /**
     * Update flow particles for movement visualization
     */
    updateFlowParticles(movementData) {
        // Update existing particles
        this.flowParticles.forEach((particle, index) => {
            const movement = movementData[index % movementData.length];

            particle.x += Math.cos(movement.direction) * movement.velocity;
            particle.y += Math.sin(movement.direction) * movement.velocity;

            // Wrap around screen
            if (particle.x < 0) particle.x = 800;
            if (particle.x > 800) particle.x = 0;
            if (particle.y < 0) particle.y = 600;
            if (particle.y > 600) particle.y = 0;

            particle.opacity = movement.intensity;
        });

        // Add new particles if needed
        while (this.flowParticles.length < this.config.movement.particleCount) {
            const movement = movementData[Math.floor(Math.random() * movementData.length)];
            this.flowParticles.push({
                x: movement.x,
                y: movement.y,
                opacity: movement.intensity,
                life: 100
            });
        }
    }

    /**
     * Render movement flow visualization
     */
    renderMovementFlow() {
        // Clear existing flow
        this.movementSvg.selectAll('.flow-particle').remove();

        // Render flow particles
        this.movementSvg.selectAll('.flow-particle')
            .data(this.flowParticles)
            .enter()
            .append('circle')
            .attr('class', 'flow-particle')
            .attr('cx', d => d.x)
            .attr('cy', d => d.y)
            .attr('r', d => 2 + d.opacity * 3)
            .attr('fill', d => `rgba(0, 245, 212, ${d.opacity * this.config.movement.trailOpacity})`)
            .attr('opacity', d => d.life / 100);

        // Update particle life
        this.flowParticles.forEach(particle => {
            particle.life -= 1;
        });

        // Remove dead particles
        this.flowParticles = this.flowParticles.filter(particle => particle.life > 0);
    }

    /**
     * Update predictive analytics chart
     */
    updatePredictiveChart(predictiveData) {
        if (!this.predictiveChart || predictiveData.length === 0) return;

        // Update chart labels
        const labels = predictiveData.map((_, i) => `T+${i + 1}`);
        this.predictiveChart.data.labels = labels;

        // Update datasets
        this.predictiveChart.data.datasets[0].data = predictiveData.map(d => d.predicted);
        this.predictiveChart.data.datasets[1].data = predictiveData.map(d => d.predicted);
        this.predictiveChart.data.datasets[2].data = predictiveData.map(d => d.upperBound);

        // Update confidence interval (reverse for lower bound)
        if (this.predictiveChart.data.datasets.length > 3) {
            this.predictiveChart.data.datasets[3].data = predictiveData.map(d => d.lowerBound).reverse();
        }

        this.predictiveChart.update('none');
    }

    /**
     * Handle initialization errors gracefully
     */
    handleInitializationError(error) {
        console.error('Visualization engine initialization failed:', error);

        // Show fallback UI
        this.showFallbackInterface();

        // Attempt to reinitialize after delay
        setTimeout(() => {
            console.log('🔄 Attempting to reinitialize visualization engine...');
            this.initialize();
        }, 5000);
    }

    /**
     * Show fallback interface when visualization fails
     */
    showFallbackInterface() {
        const containers = [
            'shot-heatmap-container',
            'trajectory-3d-container',
            'performance-chart-container',
            'movement-flow-container',
            'predictive-analytics-container'
        ];

        containers.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = `
                    <div style="
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        height: 100%;
                        background: rgba(22, 27, 34, 0.9);
                        border: 2px solid rgba(0, 245, 212, 0.3);
                        border-radius: 15px;
                        color: #00f5d4;
                        text-align: center;
                        padding: 2rem;
                    ">
                        <div>
                            <div style="font-size: 3rem; margin-bottom: 1rem;">📊</div>
                            <div style="font-size: 1.2rem; font-weight: bold; margin-bottom: 0.5rem;">
                                Advanced Visualization
                            </div>
                            <div style="font-size: 0.9rem; opacity: 0.8;">
                                Loading interactive analytics...
                            </div>
                            <div style="margin-top: 1rem;">
                                <div style="width: 200px; height: 4px; background: rgba(0, 245, 212, 0.2); border-radius: 2px; overflow: hidden;">
                                    <div style="width: 60%; height: 100%; background: linear-gradient(90deg, #00f5d4, #0ea5e9); animation: loading-pulse 2s ease-in-out infinite;"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }
        });
    }

    /**
     * Public API methods for external interaction
     */

    /**
     * Add shot data to heat map
     */
    addShotData(x, y, intensity = 10, type = 'unknown') {
        if (!this.isInitialized) return;

        const shot = { x, y, intensity, type };
        const gridX = Math.floor((x / this.config.heatMap.courtWidth) * (this.config.heatMap.courtWidth / 20));
        const gridY = Math.floor((y / this.config.heatMap.courtHeight) * (this.config.heatMap.courtHeight / 20));

        const gridIndex = gridY * (this.config.heatMap.courtWidth / 20) + gridX;
        if (this.heatMapData[gridIndex]) {
            this.heatMapData[gridIndex].intensity += intensity;
            this.heatMapData[gridIndex].shots += 1;
            this.heatMapData[gridIndex].lastUpdate = Date.now();
        }

        this.renderHeatMap();
    }

    /**
     * Add trajectory point to 3D visualization
     */
    addTrajectoryPoint(x, y, z, spin = 0) {
        if (!this.isInitialized || !this.ball) return;

        const point = { x, y, z, spin };
        this.ball.position.set(x, y, z);

        // Update trail
        this.trailPositions.push(point);
        if (this.trailPositions.length > this.config.trajectory3D.trailLength) {
            this.trailPositions.shift();
        }

        this.updateTrajectoryTrail(this.trailPositions);
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Update performance data
     */
    updatePerformanceData(playerAData, playerBData) {
        if (!this.isInitialized) return;

        const performancePoint = {
            timestamp: new Date(),
            playerA: playerAData,
            playerB: playerBData,
            movingAverage: this.calculateMovingAverage(playerAData.performance || 80)
        };

        this.performanceData.push(performancePoint);

        // Keep only recent data
        if (this.performanceData.length > this.config.performance.historyLength) {
            this.performanceData.shift();
        }

        // Update charts
        this.updatePerformanceCharts();
    }

    /**
     * Add movement data point
     */
    addMovementData(x, y, velocity, direction, intensity) {
        if (!this.isInitialized) return;

        const movement = { x, y, velocity, direction, intensity };
        this.movementData.push(movement);

        // Keep only recent movements
        if (this.movementData.length > 100) {
            this.movementData.shift();
        }

        this.updateMovementFlow();
    }

    /**
     * Update predictive model
     */
    updatePredictiveModel(currentPerformance, trend) {
        if (!this.isInitialized) return;

        const forecast = this.generatePredictiveData(currentPerformance, trend);
        this.updatePredictiveChart(forecast);
    }

    /**
     * Export visualization data
     */
    exportData() {
        return {
            heatMap: this.heatMapData,
            trajectory: this.trailPositions,
            performance: this.performanceData,
            movement: this.movementData,
            predictive: this.predictiveData,
            timestamp: new Date().toISOString(),
            config: this.config
        };
    }

    /**
     * Reset all visualizations
     */
    reset() {
        // Clear all data
        this.heatMapData.forEach(cell => {
            cell.intensity = 0;
            cell.shots = 0;
            cell.lastUpdate = 0;
        });

        this.trailPositions = [];
        this.performanceData = [];
        this.movementData = [];
        this.predictiveData = [];

        // Reset visual elements
        this.renderHeatMap();
        this.updateTrajectoryTrail([]);
        this.updatePerformanceCharts();

        console.log('🔄 All visualizations reset');
    }

    /**
     * Cleanup resources
     */
    destroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }

        if (this.scene) {
            this.scene.clear();
        }

        if (this.renderer) {
            this.renderer.dispose();
        }

        this.isInitialized = false;
        console.log('🗑️ Data visualization engine destroyed');
    }
}

// Create global instance
window.dataVisualizationEngine = new DataVisualizationEngine();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataVisualizationEngine;
}