/**
 * =====================================================
 * MatchPoint Schumann-Cosmic Resonance Engine V2
 * =====================================================
 *
 * Advanced harmonic system combining Earth's Schumann resonance (7.83 Hz)
 * and cosmic tuning (432 Hz) for enhanced emotional and physiological alignment.
 *
 * FULLY ENHANCED: Adds ambient, phase/biofeedback, research/beta/standalone modes,
 * UI hooks, bugfixes, and modularity while retaining ALL original features.
 *
 * @author MatchPoint Systems (Enhanced by Comet)
 * @version 2.0.0
 */

export class SchumannCosmicEngine {
    constructor(userOptions = {}) {
        // === GLOBAL STATE ==================
        this.audioContext = null;
        this.isInitialized = false;
        this.phase = "neutral";
        this.composure = 70;
        this.ambientLayerEnabled = false;
        this.isResearchMode = false;
        this.isStandalone = false;
        this.DEBUG = !!userOptions.DEBUG;

        // === CONSTANTS =====================
        this.SCHUMANN = {
            FUNDAMENTAL: 7.83,
            ALPHA: 7.83 * 2,
            BETA: 7.83 * 4,
            GAMMA: 7.83 * 8
        };
        this.COSMIC = {
            A432: 432,
            HARMONIC_RATIO: 432 / 7.83,
            C256: 256,
            G384: 384
        };

        // === RESONANCE TRACKING =============
        this.resonanceHistory = [];
        this.maxHistoryLength = 1000;
        this.lastResonanceUpdate = 0;
        this.resonanceUpdateInterval = 100;

        // === PLAYER STATE INTEGRATION ======
        this.playerEmotionalState = {
            confidence: 0.5,
            composure: 0.5,
            focus: 0.5,
            stress: 0.5
        };

        this.alignmentMetrics = {
            earthPlayerResonance: 0,
            cosmicAlignment: 0,
            neuralEntrainment: 0,
            bioElectromagneticSync: 0
        };

        // === OSC/GAIN/STATE =================
        this.history = [];
        this.earthConnection = null;
        this.playerAlignment = null;
        this._oscillators = {};
        this._gainNodes = {};
        this._ambientTicker = null;
        this._eventTargets = {};
        this._updateInterval = userOptions.updateInterval || 200;

        // === ADVANCED EMOTIONAL INTELLIGENCE ===
        this.emotionalDimensions = new Map();
        this.neuralWeights = {
            composure_to_confidence: 0.15,
            confidence_to_focus: 0.20,
            focus_to_aggression: 0.12,
            resilience_to_all: 0.08,
            stress_feedback: -0.18
        };
        this.adaptationRate = 0.1;
        this.uncertaintyFactor = 0.05;
        this.fractalSeed = Math.random() * 1000;

        // Initialize emotional dimensions
        this._initializeEmotionalDimensions();
    }

    _initializeEmotionalDimensions() {
        const EMOTIONAL_DIMENSIONS = {
            COMPOSURE: { weight: 0.3, decay: 0.95, recovery: 1.15 },
            CONFIDENCE: { weight: 0.25, decay: 0.92, recovery: 1.25 },
            FOCUS: { weight: 0.2, decay: 0.88, recovery: 1.35 },
            RESILIENCE: { weight: 0.15, decay: 0.90, recovery: 1.20 },
            AGGRESSION: { weight: 0.1, decay: 0.85, recovery: 1.40 }
        };

        Object.keys(EMOTIONAL_DIMENSIONS).forEach(dimension => {
            this.emotionalDimensions.set(dimension, {
                value: this._getInitialValue(dimension),
                velocity: 0,
                acceleration: 0,
                lastUpdate: Date.now(),
                history: []
            });
        });
    }

    _getInitialValue(dimension) {
        const baseValues = {
            COMPOSURE: 85,
            CONFIDENCE: 78,
            FOCUS: 82,
            RESILIENCE: 75,
            AGGRESSION: 70
        };
        return baseValues[dimension] || 75;
    }

    // === ENGINE INITIALIZATION ===
    async initialize(options = {}) {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.isInitialized = true;
        }
        if (options.autoAmbient) this.enableAmbientLayer();
    }

    destroy() {
        this.stopAll();
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        this.isInitialized = false;
    }

    // === EVENT SYSTEM ===
    on(event, cb) {
        if (!this._eventTargets[event]) this._eventTargets[event] = [];
        this._eventTargets[event].push(cb);
    }
    trigger(event, detail) {
        if (this._eventTargets[event]) {
            this._eventTargets[event].forEach(cb => { try { cb(detail); } catch(e) { if(this.DEBUG) console.error(e); } });
        }
        window.dispatchEvent(new CustomEvent(event, {detail}));
    }

    // === DEMO STATE SYNC ===
    syncWithDemo({ phase, composure, research, standalone }) {
        if (typeof phase === "string") this.setPhase(phase);
        if (typeof composure === "number") this.setComposure(composure);
        if (research !== undefined) this.setResearchMode(research);
        if (standalone !== undefined) this.setStandaloneMode(standalone);
        if (this.ambientLayerEnabled) this._refreshAmbientResonance();
    }

    setPhase(phase) {
        this.phase = phase;
        if (this.ambientLayerEnabled) this._refreshAmbientResonance();
    }
    setComposure(composure) {
        this.composure = composure;
        if (this.ambientLayerEnabled) this._refreshAmbientResonance();
    }
    setResearchMode(enabled) {
        this.isResearchMode = !!enabled;
        if (this.DEBUG) console.log("Research mode set:", this.isResearchMode);
    }
    setStandaloneMode(enabled) {
        this.isStandalone = !!enabled;
        if (this.ambientLayerEnabled) this._refreshAmbientResonance();
    }

    // === AMBIENT/OPTIONAL BACKGROUND LAYER ===
    enableAmbientLayer() {
        if (this.ambientLayerEnabled) return;
        this.ambientLayerEnabled = true;
        this._refreshAmbientResonance();
        this._ambientTicker = setInterval(() => this._refreshAmbientResonance(), this._updateInterval);
    }

    disableAmbientLayer() {
        this.ambientLayerEnabled = false;
        if (this._ambientTicker) clearInterval(this._ambientTicker);
        this._stopAmbientOscillators();
    }

    // === MAIN MODULATION/GENERATOR ===
    _refreshAmbientResonance() {
        this._stopAmbientOscillators();

        if (!this.audioContext) return;

        // Phase/composure-driven mappings:
        let modFreq = this.SCHUMANN.FUNDAMENTAL,
            baseFreq = this.COSMIC.A432,
            amDepth = 0.15,
            stereoDrift = 2.0,
            gain = 0.1;

        if (this.phase === "crisis")   { modFreq = this.SCHUMANN.BETA;   amDepth = 0.28; gain = 0.18; stereoDrift = 1.3; }
        if (this.phase === "recovery") { modFreq = this.SCHUMANN.ALPHA;  amDepth = 0.19; gain = 0.12; stereoDrift = 5.0; }
        if (this.composure < 55)       { modFreq = this.SCHUMANN.BETA;   amDepth = 0.34; gain = 0.23; }
        if (this.composure > 85)       { modFreq = this.SCHUMANN.FUNDAMENTAL; amDepth = 0.12; gain = 0.08; }

        // Oscillator + gain for Left/Right
        this._oscillators.l = this.audioContext.createOscillator();
        this._oscillators.l.type = "sine";
        this._oscillators.l.frequency.value = baseFreq;

        this._oscillators.r = this.audioContext.createOscillator();
        this._oscillators.r.type = "sine";
        this._oscillators.r.frequency.value = baseFreq + (stereoDrift / 10);

        let gainL = this.audioContext.createGain();
        let gainR = this.audioContext.createGain();
        gainL.gain.value = gain * (this.isStandalone ? 1.2 : 1.0);
        gainR.gain.value = gain * (this.isStandalone ? 1.2 : 1.0);

        this._oscillators.l.connect(gainL).connect(this.audioContext.destination);
        this._oscillators.r.connect(gainR).connect(this.audioContext.destination);

        // Amplitude modulation (with LFO)
        let amLFO = this.audioContext.createOscillator();
        amLFO.frequency.value = modFreq;
        let amDepthGain = this.audioContext.createGain();
        amDepthGain.gain.value = amDepth;
        amLFO.connect(amDepthGain.gain);
        gainL.connect(amDepthGain);
        amLFO.start();

        this._oscillators.l.start();
        this._oscillators.r.start();

        this._gainNodes.l = gainL;
        this._gainNodes.r = gainR;

        // Emit UI Event for real-time dashboard (for "cosmic resonance ring" etc)
        this.trigger("schumann:resonance:update", { phase: this.phase, modFreq, amDepth, gain, composure: this.composure });
    }

    _stopAmbientOscillators() {
        Object.values(this._oscillators).forEach(osc => { try { osc.stop(); } catch(e){} });
        Object.values(this._gainNodes).forEach(gn => { try { gn.disconnect(); } catch(e){} });
        this._oscillators = {};
        this._gainNodes = {};
    }

    // === STANDALONE MODE: FOCUS/RECOVERY ===
    playStandaloneResonance(durationSec = 120, effect = "focus") {
        this.setStandaloneMode(true);
        this.enableAmbientLayer();
        setTimeout(() => {
            this.disableAmbientLayer();
            this.setStandaloneMode(false);
        }, durationSec * 1000);
    }

    // === FULL SHUTDOWN/CLEANUP API ===
    stopAll() {
        this.disableAmbientLayer();
        // Stop all additional stateful processes here if any are added as the engine expands.
    }

    // === ADVANCED EMOTIONAL STATE MACHINE ===
    fractalNoise(t, octaves = 4) {
        let value = 0;
        let amplitude = 2.0;
        let frequency = 0.1;

        for (let i = 0; i < octaves; i++) {
            value += Math.sin(t * frequency + this.fractalSeed) * amplitude;
            amplitude *= 0.5;
            frequency *= 2;
        }

        return value / (2 - Math.pow(0.5, octaves));
    }

    advancedInterpolate(config, progress, phaseContext = {}) {
        if (!config) return 0;

        const { start = 0, end = 0, curve = "linear", controlPoints = [] } = config;
        let eased = progress;

        switch (curve) {
            case "bezier":
                if (controlPoints.length >= 4) {
                    const u = 1 - progress;
                    const uu = u * u;
                    const uuu = uu * u;
                    const tt = progress * progress;
                    const ttt = tt * progress;
                    eased = uuu * start + 3 * uu * progress * controlPoints[0] + 3 * u * tt * controlPoints[1] + ttt * end;
                }
                break;
            case "elastic":
                const amplitude = 1;
                const period = 0.3;
                eased = 1 - Math.exp(-progress / period) * Math.sin((progress * 10 - 0.75) * (2 * Math.PI) / period) + 1;
                break;
            case "bounce":
                if (progress < 1/2.75) eased = 7.5625 * progress * progress;
                else if (progress < 2/2.75) eased = 7.5625 * (progress -= 1.5/2.75) * progress + 0.75;
                else if (progress < 2.5/2.75) eased = 7.5625 * (progress -= 2.25/2.75) * progress + 0.9375;
                else eased = 7.5625 * (progress -= 2.625/2.75) * progress + 0.984375;
                break;
            case "quantum":
                eased = progress + Math.sin(progress * Math.PI * 8) * this.uncertaintyFactor;
                break;
            case "fractal":
                eased = progress + this.fractalNoise(progress * 10) * 0.1;
                break;
            case "neural":
                const neuralInput = this._calculateNeuralInput(phaseContext);
                eased = 1 / (1 + Math.exp(-progress * 0.1 - neuralInput));
                break;
            default:
                switch (curve) {
                    case "exponential": eased = 1 - Math.pow(1 - progress, 2.5); break;
                    case "ease-in": eased = Math.pow(progress, 1.8); break;
                    case "ease-out": eased = 1 - Math.pow(1 - progress, 2.2); break;
                    case "steep": eased = Math.pow(progress, 0.4); break;
                    case "floor": eased = progress; break;
                }
        }

        let value = start + (end - start) * Math.max(0, Math.min(1, eased));

        if (phaseContext.stressLevel) value *= (1 - phaseContext.stressLevel * 0.1);
        if (phaseContext.momentum) value *= (1 + phaseContext.momentum * 0.05);

        return Math.max(0, Math.min(100, value));
    }

    _calculateNeuralInput(phaseContext) {
        let input = 0;
        this.emotionalDimensions.forEach((state, dimension) => {
            const weight = this.neuralWeights[`${dimension.toLowerCase()}_influence`] || 0;
            input += state.value * weight;
        });

        if (phaseContext.pressure) input -= phaseContext.pressure * 0.1;
        if (phaseContext.success) input += phaseContext.success * 0.15;

        return input;
    }

    updateEmotionalDimensions(phaseName, elapsed, phaseProgress) {
        const now = Date.now();
        const deltaTime = (now - this.lastUpdate) / 1000;
        this.lastUpdate = now;

        const phaseConfig = this._getPhaseMetrics(phaseName);
        if (!phaseConfig) return;

        this.emotionalDimensions.forEach((state, dimension) => {
            const config = phaseConfig[dimension.toLowerCase()];
            if (!config) return;

            const phaseContext = this._buildPhaseContext(phaseName, elapsed);
            const targetValue = this.advancedInterpolate(config, phaseProgress, phaseContext);

            const dimensionConfig = {
                COMPOSURE: { weight: 0.3, decay: 0.95, recovery: 1.15 },
                CONFIDENCE: { weight: 0.25, decay: 0.92, recovery: 1.25 },
                FOCUS: { weight: 0.2, decay: 0.88, recovery: 1.35 },
                RESILIENCE: { weight: 0.15, decay: 0.90, recovery: 1.20 },
                AGGRESSION: { weight: 0.1, decay: 0.85, recovery: 1.40 }
            }[dimension];

            const error = targetValue - state.value;
            const force = error * dimensionConfig.weight;

            state.acceleration = force - (state.velocity * 0.1);
            state.velocity += state.acceleration * deltaTime;
            state.velocity *= dimensionConfig.decay;

            state.value += state.velocity * deltaTime;
            state.value += this.fractalNoise(elapsed * 0.001) * 0.5;

            this._applyNeuralInfluences(dimension, state);

            state.value = Math.max(0, Math.min(100, state.value));

            state.history.push({
                time: elapsed,
                value: state.value,
                phase: phaseName,
                velocity: state.velocity
            });

            if (state.history.length > 100) state.history.shift();
        });
    }

    _buildPhaseContext(phaseName, elapsed) {
        return {
            phaseName,
            elapsed,
            timeOfDay: (elapsed / 1000) % 24,
            pressure: this._calculatePressureLevel(phaseName),
            momentum: this._calculateMomentum(),
            recentPerformance: this._calculateRecentPerformance()
        };
    }

    _calculatePressureLevel(phaseName) {
        const phasePressure = {
            warmup: 0.1,
            pressure: 0.7,
            crisis: 0.9,
            recovery: 0.3
        };
        return phasePressure[phaseName] || 0.5;
    }

    _calculateMomentum() {
        let totalMomentum = 0;
        this.emotionalDimensions.forEach((state) => {
            const recentTrend = state.velocity > 0 ? 1 : -1;
            totalMomentum += recentTrend * state.value * 0.01;
        });
        return Math.max(-1, Math.min(1, totalMomentum));
    }

    _calculateRecentPerformance() {
        const recentHistory = Array.from(this.emotionalDimensions.values())[0]?.history.slice(-10) || [];
        if (recentHistory.length < 2) return 0.5;

        const trend = recentHistory.reduce((acc, curr, index) => {
            if (index === 0) return 0;
            return acc + (curr.value - recentHistory[index - 1].value);
        }, 0);

        return Math.max(0, Math.min(1, 0.5 + trend * 0.1));
    }

    _applyNeuralInfluences(dimension, state) {
        this.emotionalDimensions.forEach((otherState, otherDimension) => {
            if (dimension === otherDimension) return;

            const influenceKey = `${dimension.toLowerCase()}_to_${otherDimension.toLowerCase()}`;
            const weight = this.neuralWeights[influenceKey] || 0;

            if (weight !== 0) {
                const influence = (otherState.value - 50) * weight * 0.01;
                state.value += influence;
            }
        });
    }

    getEmotionalState() {
        const state = {};
        this.emotionalDimensions.forEach((data, dimension) => {
            state[dimension.toLowerCase()] = {
                value: Math.round(data.value * 100) / 100,
                velocity: Math.round(data.velocity * 100) / 100,
                trend: data.velocity > 0.1 ? 'rising' : data.velocity < -0.1 ? 'falling' : 'stable'
            };
        });

        state.composite_composure = this._calculateCompositeComposure();
        state.emotional_stability = this._calculateEmotionalStability();
        state.recovery_potential = this._calculateRecoveryPotential();

        return state;
    }

    _calculateCompositeComposure() {
        let total = 0;
        let weightSum = 0;

        this.emotionalDimensions.forEach((state, dimension) => {
            const weight = {
                COMPOSURE: 0.3,
                CONFIDENCE: 0.25,
                FOCUS: 0.2,
                RESILIENCE: 0.15,
                AGGRESSION: 0.1
            }[dimension] || 0.2;
            total += state.value * weight;
            weightSum += weight;
        });

        return total / Math.max(1, weightSum);
    }

    _calculateEmotionalStability() {
        const velocities = Array.from(this.emotionalDimensions.values()).map(state => Math.abs(state.velocity));
        const avgVelocity = velocities.reduce((a, b) => a + b, 0) / velocities.length;
        return Math.max(0, 1 - avgVelocity);
    }

    _calculateRecoveryPotential() {
        const resilience = this.emotionalDimensions.get('RESILIENCE')?.value || 50;
        const confidence = this.emotionalDimensions.get('CONFIDENCE')?.value || 50;
        const composure = this.emotionalDimensions.get('COMPOSURE')?.value || 50;

        return (resilience * 0.4 + confidence * 0.3 + composure * 0.3) / 100;
    }

    applyInfluence(influence) {
        const { type, magnitude = 1, dimensions = ['COMPOSURE', 'CONFIDENCE'] } = influence;

        dimensions.forEach(dimension => {
            const state = this.emotionalDimensions.get(dimension);
            if (!state) return;

            const config = {
                COMPOSURE: { weight: 0.3, decay: 0.95, recovery: 1.15 },
                CONFIDENCE: { weight: 0.25, decay: 0.92, recovery: 1.25 },
                FOCUS: { weight: 0.2, decay: 0.88, recovery: 1.35 },
                RESILIENCE: { weight: 0.15, decay: 0.90, recovery: 1.20 },
                AGGRESSION: { weight: 0.1, decay: 0.85, recovery: 1.40 }
            }[dimension];

            let influenceValue = magnitude;

            switch (type) {
                case 'encouragement': influenceValue *= config.recovery; break;
                case 'pressure': influenceValue *= -config.decay; break;
                case 'success': influenceValue *= config.recovery * 1.2; break;
                case 'failure': influenceValue *= -config.decay * 1.3; break;
            }

            state.velocity += influenceValue * 0.1;
        });
    }

    // === RESONANCE TRACKING ===
    updatePlayerState(emotionalState) {
        this.playerEmotionalState = { ...emotionalState };

        if (!this.isInitialized) return;

        const resonance = this.calculateEarthPlayerResonance(emotionalState);
        const alignment = this.calculateCosmicAlignment(emotionalState);

        this.updateEmotionalModulation(resonance, alignment);
        this.recordResonanceMetrics(resonance, alignment);
    }

    calculateEarthPlayerResonance(emotionalState) {
        const { composure, confidence, focus } = emotionalState;
        const earthConnection = (composure + confidence) / 2;
        const clarity = focus;
        const resonance = Math.min(1, earthConnection * clarity * 1.2);
        return resonance;
    }

    calculateCosmicAlignment(emotionalState) {
        const { confidence, focus, composure } = emotionalState;
        const balance = 1 - Math.abs(confidence - composure) - Math.abs(focus - 0.5);
        const harmony = (confidence + focus + composure) / 3;
        const alignment = balance * harmony;
        return Math.max(0, Math.min(1, alignment));
    }

    updateEmotionalModulation(resonance, alignment) {
        if (!this.audioContext) return;

        const now = this.audioContext.currentTime;
        const schumannTarget = 0.1 + (resonance * 0.4);
        const cosmicTarget = this.COSMIC.A432 + (alignment * 2);

        if (this._gainNodes.l) {
            this._gainNodes.l.gain.exponentialRampToValueAtTime(schumannTarget, now + 0.1);
        }
        if (this._oscillators.r) {
            this._oscillators.r.frequency.exponentialRampToValueAtTime(cosmicTarget, now + 0.1);
        }
    }

    recordResonanceMetrics(resonance, alignment) {
        const now = Date.now();
        const metrics = {
            timestamp: now,
            earthPlayerResonance: resonance,
            cosmicAlignment: alignment,
            schumannFrequency: this.SCHUMANN.FUNDAMENTAL,
            cosmicFrequency: this.COSMIC.A432,
            emotionalState: { ...this.playerEmotionalState }
        };

        this.resonanceHistory.push(metrics);

        if (this.resonanceHistory.length > this.maxHistoryLength) {
            this.resonanceHistory.shift();
        }

        this.alignmentMetrics.earthPlayerResonance = resonance;
        this.alignmentMetrics.cosmicAlignment = alignment;
        this.alignmentMetrics.neuralEntrainment = this.calculateNeuralEntrainment();
        this.alignmentMetrics.bioElectromagneticSync = this.calculateBioSync();

        if (now - this.lastResonanceUpdate > this.resonanceUpdateInterval) {
            this.dispatchResonanceUpdate();
            this.lastResonanceUpdate = now;
        }
    }

    calculateNeuralEntrainment() {
        if (this.resonanceHistory.length < 10) return 0.5;

        const recent = this.resonanceHistory.slice(-10);
        const resonanceValues = recent.map(m => m.earthPlayerResonance);
        const mean = resonanceValues.reduce((a, b) => a + b, 0) / resonanceValues.length;
        const variance = resonanceValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / resonanceValues.length;
        const consistency = Math.max(0, 1 - variance);

        return consistency;
    }

    calculateBioSync() {
        const { confidence, composure, focus } = this.playerEmotionalState;
        const emotionalStability = (confidence + composure + focus) / 3;
        const naturalRhythmAlignment = this.alignmentMetrics.earthPlayerResonance;
        return emotionalStability * naturalRhythmAlignment;
    }

    dispatchResonanceUpdate() {
        const event = new CustomEvent('schumann:resonance:update', {
            detail: {
                metrics: { ...this.alignmentMetrics },
                history: this.resonanceHistory.slice(-50),
                frequencies: {
                    schumann: this.SCHUMANN,
                    cosmic: this.COSMIC
                },
                playerState: { ...this.playerEmotionalState }
            }
        });

        window.dispatchEvent(event);
    }

    getState() {
        return {
            isActive: this.isInitialized && this.audioContext,
            earthPlayerResonance: this.alignmentMetrics.earthPlayerResonance,
            cosmicAlignment: this.alignmentMetrics.cosmicAlignment,
            neuralEntrainment: this.alignmentMetrics.neuralEntrainment,
            bioElectromagneticSync: this.alignmentMetrics.bioElectromagneticSync,
            historyLength: this.resonanceHistory.length,
            audioContextState: this.audioContext?.state || 'none'
        };
    }

    generateBinauralBeats(targetState, intensity = 0.5) {
        if (!this.audioContext) return;

        const baseFreq = this.SCHUMANN.FUNDAMENTAL;
        const beatFrequencies = {
            alpha: 8,
            beta: 15,
            gamma: 30
        };

        const beatFreq = beatFrequencies[targetState] || beatFrequencies.alpha;

        const leftOsc = this.audioContext.createOscillator();
        const rightOsc = this.audioContext.createOscillator();
        const leftGain = this.audioContext.createGain();
        const rightGain = this.audioContext.createGain();

        leftOsc.frequency.value = baseFreq;
        rightOsc.frequency.value = baseFreq + beatFreq;
        leftGain.gain.value = intensity;
        rightGain.gain.value = intensity;

        leftOsc.connect(leftGain).connect(this.audioContext.destination);
        rightOsc.connect(rightGain).connect(this.audioContext.destination);

        const now = this.audioContext.currentTime;
        leftOsc.start(now);
        rightOsc.start(now);

        setTimeout(() => {
            try {
                leftOsc.stop();
                rightOsc.stop();
            } catch (e) {}
        }, 30000);

        return {
            leftOsc,
            rightOsc,
            duration: 30000
        };
    }

    calculateOptimalFrequencies(emotionalState) {
        const { confidence, composure, focus, stress } = emotionalState;

        let schumannFreq = this.SCHUMANN.FUNDAMENTAL;
        let cosmicFreq = this.COSMIC.A432;

        if (stress > 0.7) {
            schumannFreq = this.SCHUMANN.ALPHA;
            cosmicFreq = this.COSMIC.C256;
        } else if (focus < 0.4) {
            schumannFreq = this.SCHUMANN.BETA;
            cosmicFreq = this.COSMIC.A432;
        } else if (confidence > 0.8 && composure > 0.8) {
            schumannFreq = this.SCHUMANN.FUNDAMENTAL;
            cosmicFreq = this.COSMIC.A432;
        }

        return {
            schumann: schumannFreq,
            cosmic: cosmicFreq,
            ratio: cosmicFreq / schumannFreq,
            reasoning: this.getFrequencyReasoning(emotionalState)
        };
    }

    getFrequencyReasoning(emotionalState) {
        const { confidence, composure, focus, stress } = emotionalState;

        if (stress > 0.7) {
            return "High stress detected - using Alpha Schumann frequency for relaxation and C=256 Hz for grounding";
        } else if (focus < 0.4) {
            return "Low focus detected - using Beta Schumann frequency for enhanced alertness";
        } else if (confidence > 0.8 && composure > 0.8) {
            return "Optimal performance state - using fundamental frequencies for maximum resonance";
        } else {
            return "Balanced state - using standard Schumann-Cosmic configuration";
        }
    }

    _getPhaseMetrics(phaseName) {
        const metrics = {
            warmup: {
                duration: 60000,
                serveSpeed: { start: 112, end: 118, curve: "linear" },
                spin: { start: 2500, end: 2700, curve: "linear" },
                composure: { start: 85, end: 90, curve: "linear" },
                accuracy: { start: 88, end: 92, curve: "linear" },
                coverage: { start: 78, end: 82, curve: "linear" },
                reaction: { start: 0.26, end: 0.22, curve: "ease-out" },
                recoveryVelocity: { start: 1.0, end: 1.15, curve: "linear" }
            },
            pressure: {
                duration: 120000,
                serveSpeed: { start: 120, end: 130, curve: "exponential" },
                spin: { start: 2850, end: 3000, curve: "exponential" },
                composure: { start: 90, end: 62, curve: "exponential", phaseBaseline: 58, pressureFactor: 0.85 },
                accuracy: { start: 92, end: 72, curve: "ease-in" },
                coverage: { start: 82, end: 70, curve: "ease-in" },
                reaction: { start: 0.23, end: 0.32, curve: "ease-in" },
                recoveryVelocity: { start: 0.9, end: 0.6, curve: "linear" }
            },
            crisis: {
                duration: 60000,
                serveSpeed: { start: 128, end: 118, curve: "ease-out" },
                spin: { start: 2900, end: 2750, curve: "linear" },
                composure: { start: 62, end: 55, curve: "floor", floor: 55 },
                accuracy: { start: 72, end: 69, curve: "ease-out" },
                coverage: { start: 70, end: 66, curve: "linear" },
                reaction: { start: 0.32, end: 0.34, curve: "linear" },
                recoveryVelocity: { start: 0.6, end: 0.5, curve: "linear" }
            },
            recovery: {
                duration: 60000,
                serveSpeed: { start: 118, end: 136, curve: "steep" },
                spin: { start: 2750, end: 3300, curve: "steep" },
                composure: { start: 55, end: 88, curve: "steep" },
                accuracy: { start: 69, end: 91, curve: "steep" },
                coverage: { start: 66, end: 84, curve: "steep" },
                reaction: { start: 0.34, end: 0.24, curve: "steep" },
                recoveryVelocity: { start: 0.5, end: 2.3, curve: "steep" }
            }
        };

        return metrics[phaseName];
    }
} // END CLASS

// === PRIMARY EXPORT ===
export function initializeSchumannCosmic(userOptions = {}) {
    if (!window.schumannCosmicEngine)
        window.schumannCosmicEngine = new SchumannCosmicEngine(userOptions);
    return window.schumannCosmicEngine;
}