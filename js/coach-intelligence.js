/**
 * Advanced AI Coaching Intelligence System
 * Provides context-aware, emotionally intelligent coaching that adapts to player performance patterns
 *
 * Features:
 * - Context Awareness Engine for real-time match situation analysis
 * - Emotional Intelligence Analysis for player state detection
 * - Dynamic Coaching Strategies based on performance patterns
 * - Real-time Coaching Adjustments for live strategy modifications
 * - Coaching History & Learning for tracking effectiveness and progression
 */

class AICoachingIntelligence {
    constructor() {
        this.isActive = false;
        this.sessionId = null;
        this.playerProfile = null;
        this.coachingHistory = [];
        this.emotionalState = {
            confidence: 0.5,
            composure: 0.5,
            motivation: 0.5,
            fatigue: 0.0,
            stress: 0.0
        };
        this.contextState = {
            matchPhase: 'warmup',
            pressureLevel: 0.0,
            momentum: 0.0,
            performanceTrend: 'stable',
            recentOutcomes: []
        };
        this.coachingStrategies = new Map();
        this.learningModel = {
            effectiveness: new Map(),
            patterns: new Map(),
            adaptations: []
        };
        this.relevanceThreshold = 0.85;
        this.emotionAccuracyThreshold = 0.80;

        // Initialize sub-engines
        this.contextEngine = new ContextAwarenessEngine();
        this.emotionEngine = new EmotionalIntelligenceEngine();
        this.strategyEngine = new DynamicCoachingStrategyEngine();
        this.adjustmentEngine = new RealTimeAdjustmentEngine();
        this.historyEngine = new CoachingHistoryEngine();

        console.log('🤖 AI Coaching Intelligence initialized');
    }

    /**
     * Start AI coaching session
     */
    async startSession(playerProfile = null) {
        this.isActive = true;
        this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        if (playerProfile) {
            this.playerProfile = playerProfile;
        } else {
            // Create default player profile
            this.playerProfile = {
                playerId: 'default_player',
                skillLevel: 'intermediate',
                preferredStyle: 'balanced',
                strengths: ['forehand', 'serve'],
                weaknesses: ['backhand', 'volley'],
                emotionalBaseline: { ...this.emotionalState }
            };
        }

        // Initialize all sub-engines
        await this.contextEngine.initialize(this.playerProfile);
        await this.emotionEngine.initialize(this.playerProfile);
        await this.strategyEngine.initialize(this.playerProfile);
        await this.adjustmentEngine.initialize(this.playerProfile);
        await this.historyEngine.initialize(this.playerProfile);

        // Load existing coaching history if available
        await this.loadCoachingHistory();

        // Start real-time monitoring
        this.startRealTimeMonitoring();

        console.log('🎯 AI Coaching session started:', this.sessionId);
        this.emitEvent('ai-coaching:started', { sessionId: this.sessionId, playerProfile: this.playerProfile });
    }

    /**
     * Stop AI coaching session
     */
    async stopSession() {
        this.isActive = false;

        // Save coaching history and learning data
        await this.saveCoachingHistory();

        // Stop real-time monitoring
        this.stopRealTimeMonitoring();

        // Shutdown sub-engines
        this.contextEngine.shutdown();
        this.emotionEngine.shutdown();
        this.strategyEngine.shutdown();
        this.adjustmentEngine.shutdown();
        this.historyEngine.shutdown();

        console.log('⏹️ AI Coaching session stopped:', this.sessionId);
        this.emitEvent('ai-coaching:stopped', { sessionId: this.sessionId });
    }

    /**
     * Process real-time match data and generate coaching cues
     */
    async processMatchData(matchData) {
        if (!this.isActive) return null;

        try {
            // Step 1: Analyze context
            const contextAnalysis = await this.contextEngine.analyzeContext(matchData);

            // Step 2: Analyze emotional state
            const emotionalAnalysis = await this.emotionEngine.analyzeEmotion(matchData, contextAnalysis);

            // Step 3: Determine optimal coaching strategy
            const strategy = await this.strategyEngine.selectStrategy(contextAnalysis, emotionalAnalysis);

            // Step 4: Generate real-time adjustments
            const adjustments = await this.adjustmentEngine.generateAdjustments(matchData, strategy);

            // Step 5: Create coaching cue
            const coachingCue = await this.generateCoachingCue(strategy, adjustments, contextAnalysis, emotionalAnalysis);

            // Step 6: Record in history and learning
            await this.historyEngine.recordCoachingInteraction({
                timestamp: Date.now(),
                matchData,
                contextAnalysis,
                emotionalAnalysis,
                strategy,
                adjustments,
                coachingCue,
                sessionId: this.sessionId
            });

            // Step 7: Update learning model
            await this.updateLearningModel(coachingCue, matchData);

            console.log('🎯 Generated coaching cue:', coachingCue.category, coachingCue.relevance);
            this.emitEvent('ai-coaching:cue-generated', coachingCue);

            return coachingCue;

        } catch (error) {
            console.error('❌ Error processing match data:', error);
            this.emitEvent('ai-coaching:error', { error: error.message });
            return null;
        }
    }

    /**
     * Generate contextually appropriate coaching cue
     */
    async generateCoachingCue(strategy, adjustments, contextAnalysis, emotionalAnalysis) {
        const baseCue = {
            id: `cue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            sessionId: this.sessionId,
            category: strategy.category,
            priority: strategy.priority,
            relevance: 0.0,
            confidence: 0.0,
            content: {
                message: '',
                tone: 'neutral',
                deliveryStyle: 'direct',
                duration: 'medium'
            },
            context: {
                matchPhase: contextAnalysis.matchPhase,
                pressureLevel: contextAnalysis.pressureLevel,
                performanceTrend: contextAnalysis.performanceTrend
            },
            emotional: {
                targetEmotion: emotionalAnalysis.targetEmotion,
                currentState: emotionalAnalysis.currentState,
                desiredState: emotionalAnalysis.desiredState
            },
            strategy: {
                type: strategy.type,
                focus: strategy.focus,
                adjustments: adjustments
            },
            effectiveness: {
                predicted: 0.0,
                actual: null,
                feedback: []
            }
        };

        // Apply strategy-specific content generation
        switch (strategy.category) {
            case 'tactical':
                baseCue.content = await this.generateTacticalCue(strategy, contextAnalysis);
                break;
            case 'motivational':
                baseCue.content = await this.generateMotivationalCue(strategy, emotionalAnalysis);
                break;
            case 'technical':
                baseCue.content = await this.generateTechnicalCue(strategy, contextAnalysis);
                break;
            case 'mental':
                baseCue.content = await this.generateMentalCue(strategy, emotionalAnalysis);
                break;
            case 'recovery':
                baseCue.content = await this.generateRecoveryCue(strategy, contextAnalysis);
                break;
            default:
                baseCue.content = await this.generateGeneralCue(strategy);
        }

        // Calculate relevance and confidence scores
        baseCue.relevance = this.calculateRelevance(baseCue, contextAnalysis, emotionalAnalysis);
        baseCue.confidence = this.calculateConfidence(baseCue, strategy);

        // Apply real-time adjustments
        if (adjustments.length > 0) {
            baseCue = await this.applyAdjustments(baseCue, adjustments);
        }

        // Validate cue meets quality thresholds
        if (baseCue.relevance < this.relevanceThreshold) {
            console.warn('⚠️ Cue relevance below threshold:', baseCue.relevance);
            baseCue.needsImprovement = true;
        }

        return baseCue;
    }

    /**
     * Generate tactical coaching cue
     */
    async generateTacticalCue(strategy, context) {
        const tacticalPatterns = {
            serve: [
                "Focus on placement over power - target the corners",
                "Vary your serve pattern to keep them guessing",
                "Use slice serves to disrupt their rhythm"
            ],
            rally: [
                "Move your opponent around the court strategically",
                "Target their weaker wing consistently",
                "Use depth to push them behind the baseline"
            ],
            pressure: [
                "Maintain consistent depth under pressure",
                "Focus on first-strike opportunities",
                "Use patterns to force predictable responses"
            ]
        };

        const phase = context.matchPhase || 'rally';
        const patterns = tacticalPatterns[phase] || tacticalPatterns.rally;
        const message = patterns[Math.floor(Math.random() * patterns.length)];

        return {
            message,
            tone: 'analytical',
            deliveryStyle: 'strategic',
            duration: 'medium',
            tactical: {
                focus: strategy.focus,
                targetArea: context.targetArea,
                pattern: context.pattern
            }
        };
    }

    /**
     * Generate motivational coaching cue
     */
    async generateMotivationalCue(strategy, emotional) {
        const motivationalCues = {
            low_confidence: [
                "Trust your training - you've done this before",
                "Stay present - focus on one point at a time",
                "Remember why you love this game"
            ],
            high_pressure: [
                "Embrace the pressure - this is where champions shine",
                "Channel nervous energy into focused intensity",
                "You've prepared for moments like this"
            ],
            momentum_loss: [
                "Reset and refocus - every point is a new opportunity",
                "Stay committed to your game plan",
                "Use this as fuel to come back stronger"
            ]
        };

        const emotionalState = emotional.currentState;
        let cueSet = motivationalCues.momentum_loss;

        if (emotionalState.confidence < 0.3) {
            cueSet = motivationalCues.low_confidence;
        } else if (emotionalState.stress > 0.7) {
            cueSet = motivationalCues.high_pressure;
        }

        const message = cueSet[Math.floor(Math.random() * cueSet.length)];

        return {
            message,
            tone: 'encouraging',
            deliveryStyle: 'empathetic',
            duration: 'medium',
            motivational: {
                targetEmotion: emotional.targetEmotion,
                intensity: strategy.intensity,
                timing: 'immediate'
            }
        };
    }

    /**
     * Generate technical coaching cue
     */
    async generateTechnicalCue(strategy, context) {
        const technicalCues = {
            footwork: [
                "Quick feet create opportunities - stay light on your toes",
                "Split step timing is crucial for first-strike advantage",
                "Efficient movement conserves energy for crucial points"
            ],
            stroke_production: [
                "Focus on clean contact - watch the ball to your strings",
                "Maintain racket head speed through the hitting zone",
                "Balance power and control in your groundstrokes"
            ],
            positioning: [
                "Court positioning determines shot selection options",
                "Anticipate rather than react to improve positioning",
                "Use the court geometry to your advantage"
            ]
        };

        const focus = strategy.focus || 'general';
        const cues = technicalCues[focus] || technicalCues.stroke_production;
        const message = cues[Math.floor(Math.random() * cues.length)];

        return {
            message,
            tone: 'instructional',
            deliveryStyle: 'technical',
            duration: 'long',
            technical: {
                focus: strategy.focus,
                correction: context.correction,
                drill: context.drill
            }
        };
    }

    /**
     * Generate mental coaching cue
     */
    async generateMentalCue(strategy, emotional) {
        const mentalCues = {
            focus: [
                "Clear your mind - focus only on the current point",
                "Develop a pre-serve routine to maintain consistency",
                "Use breathing to stay centered between points"
            ],
            resilience: [
                "Adversity builds character - stay mentally tough",
                "Learn from every point, regardless of outcome",
                "Maintain perspective - it's just one match"
            ],
            composure: [
                "Stay composed - let your preparation show",
                "Control what you can control - your attitude and effort",
                "Use positive self-talk to maintain confidence"
            ]
        };

        const target = emotional.targetEmotion || 'focus';
        const cues = mentalCues[target] || mentalCues.focus;
        const message = cues[Math.floor(Math.random() * cues.length)];

        return {
            message,
            tone: 'calm',
            deliveryStyle: 'supportive',
            duration: 'medium',
            mental: {
                target: emotional.targetEmotion,
                technique: strategy.technique,
                duration: 'ongoing'
            }
        };
    }

    /**
     * Generate recovery coaching cue
     */
    async generateRecoveryCue(strategy, context) {
        const recoveryCues = {
            fatigue: [
                "Conserve energy between points - stay efficient",
                "Focus on footwork patterns to maintain court coverage",
                "Use smart shot selection to manage physical demands"
            ],
            error_chain: [
                "Break the error pattern - focus on fundamentals",
                "Reset your mental approach after unforced errors",
                "Use positive patterns to rebuild confidence"
            ],
            momentum_loss: [
                "Stay patient - momentum comes and goes",
                "Focus on process over results in tough moments",
                "Trust your training during difficult stretches"
            ]
        };

        const situation = context.situation || 'general';
        const cues = recoveryCues[situation] || recoveryCues.fatigue;
        const message = cues[Math.floor(Math.random() * cues.length)];

        return {
            message,
            tone: 'supportive',
            deliveryStyle: 'encouraging',
            duration: 'medium',
            recovery: {
                type: context.recoveryType,
                focus: strategy.focus,
                timeline: 'immediate'
            }
        };
    }

    /**
     * Generate general coaching cue
     */
    async generateGeneralCue(strategy) {
        const generalCues = [
            "Stay focused on the process - results will follow",
            "Trust your preparation and play your game",
            "Every point is an opportunity to improve",
            "Maintain positive energy throughout the match"
        ];

        const message = generalCues[Math.floor(Math.random() * generalCues.length)];

        return {
            message,
            tone: 'balanced',
            deliveryStyle: 'general',
            duration: 'short'
        };
    }

    /**
     * Calculate relevance score for coaching cue
     */
    calculateRelevance(cue, context, emotional) {
        let relevance = 0.5; // Base relevance

        // Context relevance (40% weight)
        const contextMatch = this.calculateContextMatch(cue, context);
        relevance += contextMatch * 0.4;

        // Emotional relevance (35% weight)
        const emotionalMatch = this.calculateEmotionalMatch(cue, emotional);
        relevance += emotionalMatch * 0.35;

        // Strategy alignment (25% weight)
        const strategyAlignment = this.calculateStrategyAlignment(cue, context);
        relevance += strategyAlignment * 0.25;

        return Math.min(1.0, Math.max(0.0, relevance));
    }

    /**
     * Calculate context match score
     */
    calculateContextMatch(cue, context) {
        let match = 0.0;

        // Match phase alignment
        if (cue.context.matchPhase === context.matchPhase) {
            match += 0.3;
        }

        // Pressure level appropriateness
        const pressureDiff = Math.abs(cue.context.pressureLevel - context.pressureLevel);
        match += (1 - pressureDiff) * 0.3;

        // Performance trend alignment
        if (cue.context.performanceTrend === context.performanceTrend) {
            match += 0.2;
        }

        // Recent outcomes consideration
        if (context.recentOutcomes && context.recentOutcomes.length > 0) {
            const recentSuccess = context.recentOutcomes.filter(o => o.success).length / context.recentOutcomes.length;
            if (cue.category === 'motivational' && recentSuccess < 0.5) {
                match += 0.2;
            } else if (cue.category === 'tactical' && recentSuccess >= 0.5) {
                match += 0.2;
            }
        }

        return Math.min(1.0, match);
    }

    /**
     * Calculate emotional match score
     */
    calculateEmotionalMatch(cue, emotional) {
        let match = 0.0;

        // Target emotion alignment
        if (cue.emotional.targetEmotion === emotional.targetEmotion) {
            match += 0.4;
        }

        // Current emotional state appropriateness
        const emotionalState = emotional.currentState;
        if (cue.category === 'motivational' && emotionalState.confidence < 0.4) {
            match += 0.3;
        } else if (cue.category === 'mental' && emotionalState.stress > 0.6) {
            match += 0.3;
        } else if (cue.category === 'recovery' && emotionalState.fatigue > 0.5) {
            match += 0.3;
        }

        // Desired state achievability
        const stateDiff = this.calculateEmotionalStateDifference(emotionalState, emotional.desiredState);
        if (stateDiff < 0.3) { // Achievable change
            match += 0.3;
        }

        return Math.min(1.0, match);
    }

    /**
     * Calculate strategy alignment score
     */
    calculateStrategyAlignment(cue, context) {
        let alignment = 0.0;

        // Strategy type appropriateness for context
        if (context.matchPhase === 'pressure' && cue.strategy.type === 'mental') {
            alignment += 0.4;
        } else if (context.matchPhase === 'rally' && cue.strategy.type === 'tactical') {
            alignment += 0.4;
        } else if (context.performanceTrend === 'declining' && cue.strategy.type === 'recovery') {
            alignment += 0.4;
        }

        // Focus area relevance
        if (cue.strategy.focus && context.needs && cue.strategy.focus === context.needs) {
            alignment += 0.3;
        }

        // Adjustment effectiveness
        if (cue.strategy.adjustments && cue.strategy.adjustments.length > 0) {
            alignment += 0.3;
        }

        return Math.min(1.0, alignment);
    }

    /**
     * Calculate confidence score for coaching cue
     */
    calculateConfidence(cue, strategy) {
        let confidence = 0.5; // Base confidence

        // Strategy confidence (40% weight)
        confidence += strategy.confidence * 0.4;

        // Historical effectiveness (30% weight)
        const historicalEffectiveness = this.getHistoricalEffectiveness(cue.category);
        confidence += historicalEffectiveness * 0.3;

        // Context certainty (20% weight)
        const contextCertainty = this.calculateContextCertainty(cue.context);
        confidence += contextCertainty * 0.2;

        // Emotional certainty (10% weight)
        const emotionalCertainty = this.calculateEmotionalCertainty(cue.emotional);
        confidence += emotionalCertainty * 0.1;

        return Math.min(1.0, Math.max(0.0, confidence));
    }

    /**
     * Apply real-time adjustments to coaching cue
     */
    async applyAdjustments(cue, adjustments) {
        const adjustedCue = { ...cue };

        for (const adjustment of adjustments) {
            switch (adjustment.type) {
                case 'tone':
                    adjustedCue.content.tone = adjustment.value;
                    break;
                case 'timing':
                    adjustedCue.timing = adjustment.value;
                    break;
                case 'intensity':
                    adjustedCue.content.intensity = adjustment.value;
                    break;
                case 'content':
                    adjustedCue.content.message = adjustment.value;
                    break;
                case 'delivery':
                    adjustedCue.content.deliveryStyle = adjustment.value;
                    break;
            }
        }

        // Recalculate relevance after adjustments
        adjustedCue.relevance = this.calculateRelevance(adjustedCue, cue.context, cue.emotional);

        return adjustedCue;
    }

    /**
     * Update learning model based on coaching effectiveness
     */
    async updateLearningModel(cue, matchData) {
        // Track cue effectiveness patterns
        const patternKey = `${cue.category}_${cue.context.matchPhase}_${cue.emotional.targetEmotion}`;
        const currentEffectiveness = this.learningModel.effectiveness.get(patternKey) || 0.5;

        // Update effectiveness based on match outcomes (simplified)
        const outcomeImprovement = this.calculateOutcomeImprovement(matchData);
        const newEffectiveness = (currentEffectiveness * 0.8) + (outcomeImprovement * 0.2);

        this.learningModel.effectiveness.set(patternKey, newEffectiveness);

        // Track adaptation patterns
        this.learningModel.adaptations.push({
            timestamp: Date.now(),
            cueCategory: cue.category,
            context: cue.context,
            emotional: cue.emotional,
            effectiveness: newEffectiveness,
            adjustments: cue.strategy.adjustments
        });

        // Maintain adaptation history (keep last 1000 entries)
        if (this.learningModel.adaptations.length > 1000) {
            this.learningModel.adaptations = this.learningModel.adaptations.slice(-1000);
        }
    }

    /**
     * Calculate outcome improvement after coaching cue
     */
    calculateOutcomeImprovement(matchData) {
        // Simplified improvement calculation based on match outcomes
        // In a real implementation, this would analyze actual performance metrics
        if (!matchData.outcomes || matchData.outcomes.length === 0) {
            return 0.5; // Neutral if no data
        }

        const recentOutcomes = matchData.outcomes.slice(-5); // Last 5 points
        const successRate = recentOutcomes.filter(o => o.success).length / recentOutcomes.length;

        // Convert success rate to improvement score (-1 to 1)
        return (successRate - 0.5) * 2;
    }

    /**
     * Get historical effectiveness for cue category
     */
    getHistoricalEffectiveness(category) {
        let totalEffectiveness = 0;
        let count = 0;

        for (const [key, effectiveness] of this.learningModel.effectiveness) {
            if (key.startsWith(category + '_')) {
                totalEffectiveness += effectiveness;
                count++;
            }
        }

        return count > 0 ? totalEffectiveness / count : 0.5;
    }

    /**
     * Calculate context certainty
     */
    calculateContextCertainty(context) {
        let certainty = 0.0;

        // Match phase certainty
        if (context.matchPhase) certainty += 0.3;

        // Pressure level certainty
        if (typeof context.pressureLevel === 'number') certainty += 0.3;

        // Performance trend certainty
        if (context.performanceTrend) certainty += 0.2;

        // Recent outcomes certainty
        if (context.recentOutcomes && context.recentOutcomes.length > 0) {
            certainty += 0.2;
        }

        return certainty;
    }

    /**
     * Calculate emotional certainty
     */
    calculateEmotionalCertainty(emotional) {
        let certainty = 0.0;

        // Target emotion certainty
        if (emotional.targetEmotion) certainty += 0.4;

        // Current state certainty
        if (emotional.currentState && typeof emotional.currentState.confidence === 'number') {
            certainty += 0.3;
        }

        // Desired state certainty
        if (emotional.desiredState && typeof emotional.desiredState.confidence === 'number') {
            certainty += 0.3;
        }

        return certainty;
    }

    /**
     * Calculate emotional state difference
     */
    calculateEmotionalStateDifference(current, desired) {
        if (!current || !desired) return 1.0;

        const diff = Math.abs(current.confidence - desired.confidence) +
                    Math.abs(current.composure - desired.composure) +
                    Math.abs(current.motivation - desired.motivation);

        return Math.min(1.0, diff / 3); // Normalize to 0-1 range
    }

    /**
     * Load coaching history from storage
     */
    async loadCoachingHistory() {
        try {
            // In a real implementation, this would load from backend/localStorage
            const stored = localStorage.getItem(`ai_coaching_history_${this.playerProfile?.playerId}`);
            if (stored) {
                this.coachingHistory = JSON.parse(stored);
                console.log('📚 Loaded coaching history:', this.coachingHistory.length, 'entries');
            }
        } catch (error) {
            console.warn('⚠️ Could not load coaching history:', error);
        }
    }

    /**
     * Save coaching history to storage
     */
    async saveCoachingHistory() {
        try {
            // In a real implementation, this would save to backend/localStorage
            const historyToSave = {
                sessionId: this.sessionId,
                playerId: this.playerProfile?.playerId,
                timestamp: Date.now(),
                entries: this.coachingHistory,
                learningModel: this.learningModel,
                summary: {
                    totalCues: this.coachingHistory.length,
                    averageRelevance: this.calculateAverageRelevance(),
                    averageConfidence: this.calculateAverageConfidence(),
                    mostEffectiveCategory: this.getMostEffectiveCategory()
                }
            };

            localStorage.setItem(`ai_coaching_history_${this.playerProfile?.playerId}`, JSON.stringify(historyToSave));
            console.log('💾 Saved coaching history and learning data');
        } catch (error) {
            console.warn('⚠️ Could not save coaching history:', error);
        }
    }

    /**
     * Calculate average relevance across all cues
     */
    calculateAverageRelevance() {
        if (this.coachingHistory.length === 0) return 0.0;

        const totalRelevance = this.coachingHistory.reduce((sum, entry) => sum + (entry.coachingCue?.relevance || 0), 0);
        return totalRelevance / this.coachingHistory.length;
    }

    /**
     * Calculate average confidence across all cues
     */
    calculateAverageConfidence() {
        if (this.coachingHistory.length === 0) return 0.0;

        const totalConfidence = this.coachingHistory.reduce((sum, entry) => sum + (entry.coachingCue?.confidence || 0), 0);
        return totalConfidence / this.coachingHistory.length;
    }

    /**
     * Get most effective coaching category
     */
    getMostEffectiveCategory() {
        const categoryEffectiveness = new Map();

        this.coachingHistory.forEach(entry => {
            const cue = entry.coachingCue;
            if (cue && cue.category) {
                const current = categoryEffectiveness.get(cue.category) || { total: 0, count: 0 };
                current.total += cue.relevance || 0;
                current.count += 1;
                categoryEffectiveness.set(cue.category, current);
            }
        });

        let mostEffective = null;
        let highestAverage = 0;

        for (const [category, stats] of categoryEffectiveness) {
            const average = stats.total / stats.count;
            if (average > highestAverage) {
                highestAverage = average;
                mostEffective = category;
            }
        }

        return mostEffective;
    }

    /**
     * Start real-time monitoring of match data
     */
    startRealTimeMonitoring() {
        // Listen for match data events
        window.addEventListener('mp:match:data', (event) => {
            this.processMatchData(event.detail);
        });

        // Listen for player state updates
        window.addEventListener('mp:player:state', (event) => {
            this.updatePlayerState(event.detail);
        });

        // Listen for emotional state updates
        window.addEventListener('mp:emotional:state', (event) => {
            this.updateEmotionalState(event.detail);
        });

        console.log('👂 Real-time monitoring started');
    }

    /**
     * Stop real-time monitoring
     */
    stopRealTimeMonitoring() {
        window.removeEventListener('mp:match:data', this.processMatchData);
        window.removeEventListener('mp:player:state', this.updatePlayerState);
        window.removeEventListener('mp:emotional:state', this.updateEmotionalState);

        console.log('🔇 Real-time monitoring stopped');
    }

    /**
     * Update player state
     */
    updatePlayerState(playerState) {
        if (this.playerProfile) {
            this.playerProfile = { ...this.playerProfile, ...playerState };
        }

        // Update context engine with new player state
        if (this.contextEngine) {
            this.contextEngine.updatePlayerState(playerState);
        }
    }

    /**
     * Update emotional state
     */
    updateEmotionalState(emotionalState) {
        this.emotionalState = { ...this.emotionalState, ...emotionalState };

        // Update emotion engine with new emotional state
        if (this.emotionEngine) {
            this.emotionEngine.updateEmotionalState(emotionalState);
        }
    }

    /**
     * Get coaching statistics
     */
    getCoachingStats() {
        return {
            sessionId: this.sessionId,
            isActive: this.isActive,
            totalCues: this.coachingHistory.length,
            averageRelevance: this.calculateAverageRelevance(),
            averageConfidence: this.calculateAverageConfidence(),
            mostEffectiveCategory: this.getMostEffectiveCategory(),
            emotionalState: this.emotionalState,
            contextState: this.contextState,
            learningModel: {
                patternsLearned: this.learningModel.patterns.size,
                adaptationsMade: this.learningModel.adaptations.length,
                effectivenessByCategory: Object.fromEntries(this.learningModel.effectiveness)
            }
        };
    }

    /**
     * Emit custom event
     */
    emitEvent(eventName, detail) {
        const event = new CustomEvent(eventName, { detail });
        window.dispatchEvent(event);
    }
}

/**
 * Context Awareness Engine - Real-time match situation analysis
 */
class ContextAwarenessEngine {
    constructor() {
        this.playerProfile = null;
        this.matchHistory = [];
        this.contextPatterns = new Map();
    }

    async initialize(playerProfile) {
        this.playerProfile = playerProfile;
        console.log('🎯 Context Awareness Engine initialized');
    }

    async analyzeContext(matchData) {
        const context = {
            matchPhase: this.determineMatchPhase(matchData),
            pressureLevel: this.calculatePressureLevel(matchData),
            momentum: this.calculateMomentum(matchData),
            performanceTrend: this.analyzePerformanceTrend(matchData),
            recentOutcomes: this.getRecentOutcomes(matchData),
            tacticalSituation: this.analyzeTacticalSituation(matchData),
            physicalState: this.analyzePhysicalState(matchData),
            opponentAnalysis: this.analyzeOpponent(matchData),
            gameState: this.analyzeGameState(matchData)
        };

        // Update context patterns for learning
        this.updateContextPatterns(context);

        return context;
    }

    determineMatchPhase(matchData) {
        const gameProgress = matchData.gameProgress || 0;
        const pressureLevel = this.calculatePressureLevel(matchData);

        if (gameProgress < 0.2) return 'warmup';
        if (gameProgress > 0.8) return 'closing';
        if (pressureLevel > 0.7) return 'pressure';
        if (matchData.rallyLength > 8) return 'extended_rally';
        return 'rally';
    }

    calculatePressureLevel(matchData) {
        let pressure = 0.0;

        // Score-based pressure
        if (matchData.score) {
            const scoreDiff = Math.abs(matchData.score.playerA - matchData.score.playerB);
            if (scoreDiff <= 2) pressure += 0.4;
            if (Math.max(matchData.score.playerA, matchData.score.playerB) >= 5) pressure += 0.3;
        }

        // Game situation pressure
        if (matchData.breakPoint) pressure += 0.3;
        if (matchData.gamePoint) pressure += 0.4;
        if (matchData.matchPoint) pressure += 0.5;

        // Recent performance pressure
        const recentErrors = matchData.recentOutcomes?.filter(o => !o.success).length || 0;
        if (recentErrors > 2) pressure += 0.2;

        return Math.min(1.0, pressure);
    }

    calculateMomentum(matchData) {
        const recentOutcomes = matchData.recentOutcomes || [];
        if (recentOutcomes.length < 3) return 0.0;

        const recent = recentOutcomes.slice(-5);
        const wins = recent.filter(o => o.success).length;
        const momentum = (wins - (recent.length - wins)) / recent.length;

        return Math.max(-1.0, Math.min(1.0, momentum));
    }

    analyzePerformanceTrend(matchData) {
        const recentOutcomes = matchData.recentOutcomes || [];
        if (recentOutcomes.length < 5) return 'insufficient_data';

        const firstHalf = recentOutcomes.slice(0, Math.floor(recentOutcomes.length / 2));
        const secondHalf = recentOutcomes.slice(Math.floor(recentOutcomes.length / 2));

        const firstHalfSuccess = firstHalf.filter(o => o.success).length / firstHalf.length;
        const secondHalfSuccess = secondHalf.filter(o => o.success).length / secondHalf.length;

        const trend = secondHalfSuccess - firstHalfSuccess;

        if (trend > 0.2) return 'improving';
        if (trend < -0.2) return 'declining';
        return 'stable';
    }

    getRecentOutcomes(matchData) {
        return matchData.recentOutcomes || [];
    }

    analyzeTacticalSituation(matchData) {
        return {
            courtPosition: matchData.courtPosition || 'center',
            shotType: matchData.shotType || 'groundstroke',
            targetArea: matchData.targetArea || 'center',
            pattern: matchData.pattern || 'neutral'
        };
    }

    analyzePhysicalState(matchData) {
        return {
            fatigue: matchData.fatigue || 0.0,
            movementSpeed: matchData.movementSpeed || 1.0,
            reactionTime: matchData.reactionTime || 0.3,
            courtCoverage: matchData.courtCoverage || 0.75
        };
    }

    analyzeOpponent(matchData) {
        return {
            preferredPatterns: matchData.opponentPatterns || [],
            weaknesses: matchData.opponentWeaknesses || [],
            tendencies: matchData.opponentTendencies || {}
        };
    }

    analyzeGameState(matchData) {
        return {
            score: matchData.score || { playerA: 0, playerB: 0 },
            server: matchData.server || 'A',
            gameState: matchData.gameState || 'neutral',
            breakPoints: matchData.breakPoints || 0
        };
    }

    updateContextPatterns(context) {
        const patternKey = `${context.matchPhase}_${context.performanceTrend}_${Math.round(context.pressureLevel * 10) / 10}`;
        const currentCount = this.contextPatterns.get(patternKey) || 0;
        this.contextPatterns.set(patternKey, currentCount + 1);
    }

    updatePlayerState(playerState) {
        if (this.playerProfile) {
            this.playerProfile = { ...this.playerProfile, ...playerState };
        }
    }

    shutdown() {
        console.log('🔇 Context Awareness Engine shutdown');
    }
}

/**
 * Emotional Intelligence Engine - Player state detection and response
 */
class EmotionalIntelligenceEngine {
    constructor() {
        this.playerProfile = null;
        this.emotionalBaseline = null;
        this.emotionPatterns = new Map();
        this.emotionHistory = [];
    }

    async initialize(playerProfile) {
        this.playerProfile = playerProfile;
        this.emotionalBaseline = playerProfile.emotionalBaseline || {
            confidence: 0.5,
            composure: 0.5,
            motivation: 0.5,
            stress: 0.0,
            focus: 0.5
        };
        console.log('🧠 Emotional Intelligence Engine initialized');
    }

    async analyzeEmotion(matchData, contextAnalysis) {
        // Detect current emotional state
        const currentState = this.detectEmotionalState(matchData, contextAnalysis);

        // Compare with baseline to identify drift
        const emotionalDrift = this.calculateEmotionalDrift(currentState);

        // Determine target emotional state for coaching
        const targetEmotion = this.determineTargetEmotion(currentState, contextAnalysis);

        // Calculate desired emotional state
        const desiredState = this.calculateDesiredState(currentState, targetEmotion, contextAnalysis);

        // Update emotion patterns and history
        this.updateEmotionPatterns(currentState, contextAnalysis);
        this.recordEmotionalState(currentState, contextAnalysis);

        return {
            currentState,
            emotionalDrift,
            targetEmotion,
            desiredState,
            confidence: this.calculateEmotionConfidence(currentState),
            recommendations: this.generateEmotionalRecommendations(currentState, desiredState, contextAnalysis)
        };
    }

    detectEmotionalState(matchData, context) {
        const state = { ...this.emotionalBaseline };

        // Confidence based on recent outcomes
        const recentOutcomes = context.recentOutcomes || [];
        if (recentOutcomes.length > 0) {
            const successRate = recentOutcomes.filter(o => o.success).length / recentOutcomes.length;
            state.confidence = 0.3 + (successRate * 0.6); // Scale from 0.3 to 0.9
        }

        // Composure based on pressure and error patterns
        const pressureLevel = context.pressureLevel || 0;
        const recentErrors = recentOutcomes.filter(o => !o.success).length;
        state.composure = Math.max(0.1, 0.8 - (pressureLevel * 0.4) - (recentErrors * 0.1));

        // Motivation based on match progress and momentum
        const momentum = context.momentum || 0;
        const gameProgress = matchData.gameProgress || 0;
        state.motivation = 0.4 + (momentum * 0.3) + (gameProgress * 0.2);

        // Stress based on pressure and physical state
        const fatigue = matchData.fatigue || 0;
        state.stress = (pressureLevel * 0.6) + (fatigue * 0.3);

        // Focus based on composure and recent performance
        state.focus = state.composure * 0.7 + (state.confidence * 0.3);

        return state;
    }

    calculateEmotionalDrift(currentState) {
        const drift = {};

        for (const [emotion, currentValue] of Object.entries(currentState)) {
            const baselineValue = this.emotionalBaseline[emotion] || 0.5;
            drift[emotion] = currentValue - baselineValue;
        }

        return drift;
    }

    determineTargetEmotion(currentState, context) {
        // Determine which emotion needs the most attention
        const emotions = Object.keys(currentState);
        let targetEmotion = 'confidence'; // Default
        let maxNeed = 0;

        for (const emotion of emotions) {
            const currentValue = currentState[emotion];
            const need = this.calculateEmotionNeed(emotion, currentValue, context);

            if (need > maxNeed) {
                maxNeed = need;
                targetEmotion = emotion;
            }
        }

        return targetEmotion;
    }

    calculateEmotionNeed(emotion, currentValue, context) {
        let need = 0;

        switch (emotion) {
            case 'confidence':
                if (context.performanceTrend === 'declining') need += 0.4;
                if (context.pressureLevel > 0.6) need += 0.3;
                need += Math.max(0, (0.5 - currentValue) * 0.6);
                break;
            case 'composure':
                if (context.pressureLevel > 0.7) need += 0.5;
                if (context.matchPhase === 'pressure') need += 0.3;
                need += Math.max(0, (0.6 - currentValue) * 0.4);
                break;
            case 'focus':
                if (context.matchPhase === 'extended_rally') need += 0.3;
                need += Math.max(0, (0.5 - currentValue) * 0.5);
                break;
            case 'motivation':
                if (context.momentum < -0.3) need += 0.4;
                need += Math.max(0, (0.4 - currentValue) * 0.3);
                break;
        }

        return Math.min(1.0, need);
    }

    calculateDesiredState(currentState, targetEmotion, context) {
        const desiredState = { ...currentState };

        // Set target values based on context and emotion
        switch (targetEmotion) {
            case 'confidence':
                desiredState.confidence = Math.min(0.9, currentState.confidence + 0.2);
                break;
            case 'composure':
                desiredState.composure = Math.min(0.9, currentState.composure + 0.3);
                break;
            case 'focus':
                desiredState.focus = Math.min(0.9, currentState.focus + 0.2);
                break;
            case 'motivation':
                desiredState.motivation = Math.min(0.9, currentState.motivation + 0.2);
                break;
        }

        return desiredState;
    }

    calculateEmotionConfidence(currentState) {
        // Calculate confidence in emotional state detection
        let confidence = 0.0;

        // More data points increase confidence
        const dataPoints = Object.values(currentState).filter(v => typeof v === 'number').length;
        confidence += (dataPoints / 5) * 0.4; // Max 0.4 for having all 5 emotions

        // Consistency with recent history increases confidence
        if (this.emotionHistory.length > 0) {
            const recentState = this.emotionHistory[this.emotionHistory.length - 1];
            const consistency = this.calculateStateConsistency(currentState, recentState);
            confidence += consistency * 0.3;
        }

        // Context certainty increases confidence
        const contextCertainty = this.calculateContextCertainty(currentState);
        confidence += contextCertainty * 0.3;

        return Math.min(1.0, confidence);
    }

    calculateStateConsistency(current, recent) {
        if (!recent) return 0.5;

        let totalDiff = 0;
        const emotions = Object.keys(current);

        for (const emotion of emotions) {
            const diff = Math.abs(current[emotion] - recent[emotion]);
            totalDiff += diff;
        }

        const averageDiff = totalDiff / emotions.length;
        return Math.max(0, 1 - averageDiff * 2); // Convert difference to consistency score
    }

    calculateContextCertainty(currentState) {
        // Higher emotional activation increases certainty
        const activation = Object.values(currentState).reduce((sum, val) => sum + Math.abs(val - 0.5), 0) / 5;
        return Math.min(1.0, activation * 2);
    }

    generateEmotionalRecommendations(currentState, desiredState, context) {
        const recommendations = [];

        // Generate specific recommendations based on emotional gaps
        for (const [emotion, currentValue] of Object.entries(currentState)) {
            const desiredValue = desiredState[emotion];
            const gap = desiredValue - currentValue;

            if (gap > 0.2) { // Significant gap
                recommendations.push({
                    emotion,
                    currentValue,
                    desiredValue,
                    gap,
                    strategy: this.getEmotionStrategy(emotion, gap, context)
                });
            }
        }

        return recommendations;
    }

    getEmotionStrategy(emotion, gap, context) {
        const strategies = {
            confidence: [
                'positive_reinforcement',
                'skill_focus',
                'progress_reminders'
            ],
            composure: [
                'breathing_techniques',
                'routine_establishment',
                'pressure_normalization'
            ],
            focus: [
                'attention_training',
                'distraction_elimination',
                'present_moment_awareness'
            ],
            motivation: [
                'goal_setting',
                'effort_recognition',
                'purpose_connection'
            ]
        };

        const emotionStrategies = strategies[emotion] || strategies.confidence;
        return emotionStrategies[Math.floor(Math.random() * emotionStrategies.length)];
    }

    updateEmotionPatterns(currentState, context) {
        const patternKey = `${context.matchPhase}_${Math.round(context.pressureLevel * 5) / 5}`;
        const pattern = this.emotionPatterns.get(patternKey) || {
            count: 0,
            emotionalStates: []
        };

        pattern.count++;
        pattern.emotionalStates.push({ ...currentState, timestamp: Date.now() });

        // Keep only last 50 states per pattern
        if (pattern.emotionalStates.length > 50) {
            pattern.emotionalStates = pattern.emotionalStates.slice(-50);
        }

        this.emotionPatterns.set(patternKey, pattern);
    }

    recordEmotionalState(currentState, context) {
        this.emotionHistory.push({
            timestamp: Date.now(),
            state: { ...currentState },
            context: {
                matchPhase: context.matchPhase,
                pressureLevel: context.pressureLevel,
                momentum: context.momentum
            }
        });

        // Keep only last 100 states
        if (this.emotionHistory.length > 100) {
            this.emotionHistory = this.emotionHistory.slice(-100);
        }
    }

    updateEmotionalState(emotionalState) {
        this.emotionalBaseline = { ...this.emotionalBaseline, ...emotionalState };
    }

    shutdown() {
        console.log('🔇 Emotional Intelligence Engine shutdown');
    }
}

/**
 * Dynamic Coaching Strategy Engine - Adaptive coaching based on performance patterns
 */
class DynamicCoachingStrategyEngine {
    constructor() {
        this.playerProfile = null;
        this.strategyPatterns = new Map();
        this.performanceHistory = [];
    }

    async initialize(playerProfile) {
        this.playerProfile = playerProfile;
        console.log('🎯 Dynamic Coaching Strategy Engine initialized');
    }

    async selectStrategy(contextAnalysis, emotionalAnalysis) {
        // Analyze current situation
        const situation = this.analyzeSituation(contextAnalysis, emotionalAnalysis);

        // Determine optimal strategy category
        const category = this.determineStrategyCategory(situation, contextAnalysis, emotionalAnalysis);

        // Select specific strategy within category
        const strategy = this.selectSpecificStrategy(category, situation, contextAnalysis);

        // Calculate strategy confidence
        strategy.confidence = this.calculateStrategyConfidence(strategy, situation);

        return strategy;
    }

    analyzeSituation(context, emotional) {
        return {
            urgency: this.calculateUrgency(context, emotional),
            complexity: this.calculateComplexity(context),
            opportunity: this.calculateOpportunity(context, emotional),
            risk: this.calculateRisk(context, emotional)
        };
    }

    calculateUrgency(context, emotional) {
        let urgency = 0.0;

        // High pressure situations increase urgency
        if (context.pressureLevel > 0.7) urgency += 0.3;

        // Declining performance increases urgency
        if (context.performanceTrend === 'declining') urgency += 0.3;

        // Low emotional states increase urgency
        if (emotional.currentState.confidence < 0.3) urgency += 0.2;
        if (emotional.currentState.composure < 0.3) urgency += 0.2;

        return Math.min(1.0, urgency);
    }

    calculateComplexity(context) {
        let complexity = 0.0;

        // Match phase affects complexity
        const phaseComplexity = {
            'warmup': 0.1,
            'rally': 0.3,
            'pressure': 0.6,
            'extended_rally': 0.7,
            'closing': 0.8
        };
        complexity += phaseComplexity[context.matchPhase] || 0.3;

        // Tactical situation complexity
        if (context.tacticalSituation.pattern === 'complex') complexity += 0.2;

        return Math.min(1.0, complexity);
    }

    calculateOpportunity(context, emotional) {
        let opportunity = 0.0;

        // Positive momentum creates opportunities
        if (context.momentum > 0.3) opportunity += 0.3;

        // Improving performance trend
        if (context.performanceTrend === 'improving') opportunity += 0.3;

        // High emotional states create opportunities
        if (emotional.currentState.confidence > 0.7) opportunity += 0.2;
        if (emotional.currentState.focus > 0.7) opportunity += 0.2;

        return Math.min(1.0, opportunity);
    }

    calculateRisk(context, emotional) {
        let risk = 0.0;

        // High pressure increases risk
        if (context.pressureLevel > 0.6) risk += 0.3;

        // Low emotional states increase risk
        if (emotional.currentState.confidence < 0.4) risk += 0.2;
        if (emotional.currentState.composure < 0.4) risk += 0.2;

        // Declining performance increases risk
        if (context.performanceTrend === 'declining') risk += 0.3;

        return Math.min(1.0, risk);
    }

    determineStrategyCategory(situation, context, emotional) {
        // Priority order for strategy categories
        const categoryPriority = [
            { category: 'recovery', condition: () => situation.urgency > 0.7 || context.performanceTrend === 'declining' },
            { category: 'mental', condition: () => emotional.currentState.composure < 0.4 || emotional.currentState.focus < 0.4 },
            { category: 'motivational', condition: () => emotional.currentState.confidence < 0.4 || emotional.currentState.motivation < 0.4 },
            { category: 'tactical', condition: () => situation.opportunity > 0.5 || context.tacticalSituation.pattern === 'advantage' },
            { category: 'technical', condition: () => situation.complexity > 0.5 && situation.urgency < 0.6 }
        ];

        for (const { category, condition } of categoryPriority) {
            if (condition()) {
                return category;
            }
        }

        return 'general'; // Default fallback
    }

    selectSpecificStrategy(category, situation, context) {
        const strategies = {
            tactical: [
                { type: 'aggressive', focus: 'first_strike', priority: 0.8, condition: () => situation.opportunity > 0.6 },
                { type: 'defensive', focus: 'consistency', priority: 0.7, condition: () => situation.risk > 0.5 },
                { type: 'balanced', focus: 'patterns', priority: 0.6, condition: () => true }
            ],
            motivational: [
                { type: 'encouragement', focus: 'confidence', priority: 0.8, condition: () => situation.urgency > 0.5 },
                { type: 'challenge', focus: 'growth', priority: 0.7, condition: () => situation.opportunity > 0.5 },
                { type: 'support', focus: 'resilience', priority: 0.6, condition: () => true }
            ],
            technical: [
                { type: 'correction', focus: 'fundamentals', priority: 0.8, condition: () => situation.urgency > 0.6 },
                { type: 'refinement', focus: 'technique', priority: 0.7, condition: () => situation.complexity > 0.5 },
                { type: 'optimization', focus: 'efficiency', priority: 0.6, condition: () => true }
            ],
            mental: [
                { type: 'focus', focus: 'concentration', priority: 0.9, condition: () => situation.urgency > 0.7 },
                { type: 'calm', focus: 'composure', priority: 0.8, condition: () => situation.risk > 0.6 },
                { type: 'resilience', focus: 'perspective', priority: 0.7, condition: () => true }
            ],
            recovery: [
                { type: 'reset', focus: 'fundamentals', priority: 0.9, condition: () => situation.urgency > 0.8 },
                { type: 'rebuild', focus: 'confidence', priority: 0.8, condition: () => situation.risk > 0.5 },
                { type: 'maintain', focus: 'consistency', priority: 0.7, condition: () => true }
            ]
        };

        const categoryStrategies = strategies[category] || strategies.tactical;
        const availableStrategies = categoryStrategies.filter(s => s.condition());

        if (availableStrategies.length === 0) {
            return categoryStrategies[0]; // Fallback to first strategy
        }

        // Select strategy with highest priority
        return availableStrategies.reduce((best, current) =>
            current.priority > best.priority ? current : best
        );
    }

    calculateStrategyConfidence(strategy, situation) {
        let confidence = strategy.priority; // Base confidence from priority

        // Adjust based on situation alignment
        if (strategy.category === 'recovery' && situation.urgency > 0.7) {
            confidence += 0.2;
        } else if (strategy.category === 'tactical' && situation.opportunity > 0.5) {
            confidence += 0.2;
        } else if (strategy.category === 'mental' && situation.risk > 0.6) {
            confidence += 0.2;
        }

        // Historical performance adjustment
        const historicalPerformance = this.getHistoricalStrategyPerformance(strategy);
        confidence = (confidence * 0.7) + (historicalPerformance * 0.3);

        return Math.min(1.0, Math.max(0.0, confidence));
    }

    getHistoricalStrategyPerformance(strategy) {
        // Look up historical performance for this strategy type
        const patternKey = `${strategy.category}_${strategy.type}`;
        const performance = this.strategyPatterns.get(patternKey);

        if (performance && performance.count > 0) {
            return performance.successRate;
        }

        return 0.5; // Neutral if no historical data
    }

    shutdown() {
        console.log('🔇 Dynamic Coaching Strategy Engine shutdown');
    }
}

/**
 * Real-time Coaching Adjustment Engine - Live strategy modifications
 */
class RealTimeAdjustmentEngine {
    constructor() {
        this.playerProfile = null;
        this.adjustmentHistory = [];
        this.currentAdjustments = [];
    }

    async initialize(playerProfile) {
        this.playerProfile = playerProfile;
        console.log('⚡ Real-time Adjustment Engine initialized');
    }

    async generateAdjustments(matchData, strategy) {
        const adjustments = [];

        // Analyze need for adjustments
        const adjustmentNeeds = this.analyzeAdjustmentNeeds(matchData, strategy);

        // Generate specific adjustments
        for (const need of adjustmentNeeds) {
            const adjustment = await this.generateSpecificAdjustment(need, matchData, strategy);
            if (adjustment) {
                adjustments.push(adjustment);
            }
        }

        // Record adjustments for learning
        this.recordAdjustments(adjustments, matchData, strategy);

        return adjustments;
    }

    analyzeAdjustmentNeeds(matchData, strategy) {
        const needs = [];

        // Timing adjustments
        if (this.needsTimingAdjustment(matchData, strategy)) {
            needs.push({ type: 'timing', priority: 0.8 });
        }

        // Tone adjustments
        if (this.needsToneAdjustment(matchData, strategy)) {
            needs.push({ type: 'tone', priority: 0.7 });
        }

        // Content adjustments
        if (this.needsContentAdjustment(matchData, strategy)) {
            needs.push({ type: 'content', priority: 0.9 });
        }

        // Intensity adjustments
        if (this.needsIntensityAdjustment(matchData, strategy)) {
            needs.push({ type: 'intensity', priority: 0.6 });
        }

        // Delivery adjustments
        if (this.needsDeliveryAdjustment(matchData, strategy)) {
            needs.push({ type: 'delivery', priority: 0.5 });
        }

        return needs.sort((a, b) => b.priority - a.priority);
    }

    needsTimingAdjustment(matchData, strategy) {
        // Adjust timing based on match intensity and player state
        const highIntensity = matchData.matchIntensity > 0.7;
        const playerFatigue = matchData.fatigue > 0.6;

        return highIntensity || playerFatigue;
    }

    needsToneAdjustment(matchData, strategy) {
        // Adjust tone based on emotional state and recent outcomes
        const recentSuccess = matchData.recentOutcomes?.filter(o => o.success).length || 0;
        const recentTotal = matchData.recentOutcomes?.length || 1;
        const successRate = recentSuccess / recentTotal;

        return successRate < 0.3 || successRate > 0.8; // Extreme performance needs tone adjustment
    }

    needsContentAdjustment(matchData, strategy) {
        // Adjust content based on repeated patterns or lack of effectiveness
        const repeatedErrors = this.detectRepeatedErrors(matchData);
        const strategyIneffective = this.isStrategyIneffective(strategy, matchData);

        return repeatedErrors || strategyIneffective;
    }

    needsIntensityAdjustment(matchData, strategy) {
        // Adjust intensity based on pressure and emotional state
        const highPressure = matchData.pressureLevel > 0.7;
        const lowConfidence = matchData.emotionalState?.confidence < 0.4;

        return highPressure || lowConfidence;
    }

    needsDeliveryAdjustment(matchData, strategy) {
        // Adjust delivery based on player preferences and context
        const preferenceMismatch = this.checkPreferenceMismatch(strategy, matchData);
        const contextMismatch = this.checkContextMismatch(strategy, matchData);

        return preferenceMismatch || contextMismatch;
    }

    detectRepeatedErrors(matchData) {
        const recentOutcomes = matchData.recentOutcomes || [];
        if (recentOutcomes.length < 5) return false;

        // Look for patterns in error types
        const errorTypes = recentOutcomes.filter(o => !o.success).map(o => o.errorType);
        const mostCommonError = this.getMostFrequentItem(errorTypes);

        return errorTypes.filter(type => type === mostCommonError).length >= 3;
    }

    isStrategyIneffective(strategy, matchData) {
        // Check if current strategy is producing desired results
        const recentOutcomes = matchData.recentOutcomes || [];
        if (recentOutcomes.length < 3) return false;

        const successRate = recentOutcomes.filter(o => o.success).length / recentOutcomes.length;
        return successRate < 0.4; // Less than 40% success rate indicates potential ineffectiveness
    }

    checkPreferenceMismatch(strategy, matchData) {
        // Check if strategy aligns with player preferences
        if (!this.playerProfile) return false;

        const preferredStyle = this.playerProfile.preferredStyle;
        const strategyStyle = strategy.deliveryStyle;

        return preferredStyle !== strategyStyle && preferredStyle !== 'balanced';
    }

    checkContextMismatch(strategy, matchData) {
        // Check if strategy is appropriate for current context
        const matchPhase = matchData.matchPhase;
        const strategyCategory = strategy.category;

        // Define context appropriateness
        const appropriateness = {
            warmup: ['technical', 'general'],
            rally: ['tactical', 'technical'],
            pressure: ['mental', 'motivational'],
            extended_rally: ['mental', 'recovery'],
            closing: ['motivational', 'mental']
        };

        const appropriateCategories = appropriateness[matchPhase] || ['general'];
        return !appropriateCategories.includes(strategyCategory);
    }

    async generateSpecificAdjustment(need, matchData, strategy) {
        switch (need.type) {
            case 'timing':
                return this.generateTimingAdjustment(matchData, strategy);
            case 'tone':
                return this.generateToneAdjustment(matchData, strategy);
            case 'content':
                return this.generateContentAdjustment(matchData, strategy);
            case 'intensity':
                return this.generateIntensityAdjustment(matchData, strategy);
            case 'delivery':
                return this.generateDeliveryAdjustment(matchData, strategy);
            default:
                return null;
        }
    }

    generateTimingAdjustment(matchData, strategy) {
        const highIntensity = matchData.matchIntensity > 0.7;
        const playerFatigue = matchData.fatigue > 0.6;

        if (highIntensity) {
            return {
                type: 'timing',
                value: 'immediate',
                reason: 'High match intensity requires immediate feedback',
                confidence: 0.8
            };
        } else if (playerFatigue) {
            return {
                type: 'timing',
                value: 'delayed',
                reason: 'Player fatigue suggests delayed coaching for better absorption',
                confidence: 0.7
            };
        }

        return {
            type: 'timing',
            value: 'standard',
            reason: 'Standard timing appropriate for current situation',
            confidence: 0.6
        };
    }

    generateToneAdjustment(matchData, strategy) {
        const recentSuccess = matchData.recentOutcomes?.filter(o => o.success).length || 0;
        const recentTotal = matchData.recentOutcomes?.length || 1;
        const successRate = recentSuccess / recentTotal;

        if (successRate < 0.3) {
            return {
                type: 'tone',
                value: 'encouraging',
                reason: 'Low success rate requires more encouraging tone',
                confidence: 0.8
            };
        } else if (successRate > 0.8) {
            return {
                type: 'tone',
                value: 'challenging',
                reason: 'High success rate allows for more challenging tone',
                confidence: 0.7
            };
        }

        return {
            type: 'tone',
            value: 'balanced',
            reason: 'Moderate success rate suggests balanced tone',
            confidence: 0.6
        };
    }

    generateContentAdjustment(matchData, strategy) {
        const repeatedErrors = this.detectRepeatedErrors(matchData);

        if (repeatedErrors) {
            return {
                type: 'content',
                value: `Focus on correcting ${repeatedErrors} - that's been the main issue`,
                reason: 'Repeated errors detected, adjusting content to address specific issue',
                confidence: 0.9
            };
        }

        return {
            type: 'content',
            value: 'Adjust your approach - try a different tactic',
            reason: 'Strategy appears ineffective, suggesting content adjustment',
            confidence: 0.7
        };
    }

    generateIntensityAdjustment(matchData, strategy) {
        const highPressure = matchData.pressureLevel > 0.7;
        const lowConfidence = matchData.emotionalState?.confidence < 0.4;

        if (highPressure) {
            return {
                type: 'intensity',
                value: 'high',
                reason: 'High pressure situation requires high intensity coaching',
                confidence: 0.8
            };
        } else if (lowConfidence) {
            return {
                type: 'intensity',
                value: 'low',
                reason: 'Low confidence requires gentle, low intensity approach',
                confidence: 0.7
            };
        }

        return {
            type: 'intensity',
            value: 'medium',
            reason: 'Moderate situation suggests medium intensity',
            confidence: 0.6
        };
    }

    generateDeliveryAdjustment(matchData, strategy) {
        const preferenceMismatch = this.checkPreferenceMismatch(strategy, matchData);

        if (preferenceMismatch) {
            const preferredStyle = this.playerProfile?.preferredStyle || 'direct';
            return {
                type: 'delivery',
                value: preferredStyle,
                reason: 'Adjusting delivery to match player preference',
                confidence: 0.8
            };
        }

        return {
            type: 'delivery',
            value: 'adaptive',
            reason: 'Delivery style appropriate for current context',
            confidence: 0.6
        };
    }

    recordAdjustments(adjustments, matchData, strategy) {
        this.adjustmentHistory.push({
            timestamp: Date.now(),
            adjustments: adjustments,
            matchData: matchData,
            strategy: strategy,
            effectiveness: null // To be updated based on outcomes
        });

        // Keep only last 500 adjustments
        if (this.adjustmentHistory.length > 500) {
            this.adjustmentHistory = this.adjustmentHistory.slice(-500);
        }
    }

    getMostFrequentItem(array) {
        const frequency = {};
        let maxCount = 0;
        let mostFrequent = null;

        for (const item of array) {
            frequency[item] = (frequency[item] || 0) + 1;
            if (frequency[item] > maxCount) {
                maxCount = frequency[item];
                mostFrequent = item;
            }
        }

        return mostFrequent;
    }

    shutdown() {
        console.log('🔇 Real-time Adjustment Engine shutdown');
    }
}

/**
 * Coaching History Engine - Track effectiveness and progression
 */
class CoachingHistoryEngine {
    constructor() {
        this.playerProfile = null;
        this.coachingHistory = [];
        this.sessionSummaries = [];
        this.effectivenessMetrics = new Map();
    }

    async initialize(playerProfile) {
        this.playerProfile = playerProfile;
        console.log('📚 Coaching History Engine initialized');
    }

    async recordCoachingInteraction(interaction) {
        const historyEntry = {
            id: `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            sessionId: interaction.sessionId,
            playerId: this.playerProfile?.playerId,
            matchData: interaction.matchData,
            contextAnalysis: interaction.contextAnalysis,
            emotionalAnalysis: interaction.emotionalAnalysis,
            strategy: interaction.strategy,
            adjustments: interaction.adjustments,
            coachingCue: interaction.coachingCue,
            outcomes: {
                immediate: null,
                shortTerm: null,
                longTerm: null
            },
            effectiveness: {
                relevance: interaction.coachingCue?.relevance || 0,
                confidence: interaction.coachingCue?.confidence || 0,
                impact: null,
                feedback: []
            }
        };

        this.coachingHistory.push(historyEntry);

        // Keep only last 1000 interactions
        if (this.coachingHistory.length > 1000) {
            this.coachingHistory = this.coachingHistory.slice(-1000);
        }

        // Update effectiveness metrics
        this.updateEffectivenessMetrics(historyEntry);

        console.log('📝 Recorded coaching interaction:', historyEntry.id);
    }

    updateEffectivenessMetrics(entry) {
        const key = `${entry.strategy.category}_${entry.contextAnalysis.matchPhase}`;

        if (!this.effectivenessMetrics.has(key)) {
            this.effectivenessMetrics.set(key, {
                totalInteractions: 0,
                totalRelevance: 0,
                totalConfidence: 0,
                totalImpact: 0,
                successfulInteractions: 0
            });
        }

        const metrics = this.effectivenessMetrics.get(key);
        metrics.totalInteractions++;
        metrics.totalRelevance += entry.effectiveness.relevance;
        metrics.totalConfidence += entry.effectiveness.confidence;

        // Update success rate (simplified - would be based on actual outcomes)
        if (entry.effectiveness.relevance > 0.7) {
            metrics.successfulInteractions++;
        }

        this.effectivenessMetrics.set(key, metrics);
    }

    async generateSessionSummary(sessionId) {
        const sessionInteractions = this.coachingHistory.filter(h => h.sessionId === sessionId);

        if (sessionInteractions.length === 0) {
            return null;
        }

        const summary = {
            sessionId,
            playerId: this.playerProfile?.playerId,
            timestamp: Date.now(),
            duration: this.calculateSessionDuration(sessionInteractions),
            totalInteractions: sessionInteractions.length,
            categories: this.categorizeInteractions(sessionInteractions),
            effectiveness: this.calculateSessionEffectiveness(sessionInteractions),
            progression: this.analyzeProgression(sessionInteractions),
            recommendations: this.generateRecommendations(sessionInteractions),
            insights: this.generateInsights(sessionInteractions)
        };

        this.sessionSummaries.push(summary);
        return summary;
    }

    calculateSessionDuration(interactions) {
        if (interactions.length < 2) return 0;

        const timestamps = interactions.map(i => i.timestamp).sort((a, b) => a - b);
        return timestamps[timestamps.length - 1] - timestamps[0];
    }

    categorizeInteractions(interactions) {
        const categories = {};

        for (const interaction of interactions) {
            const category = interaction.strategy.category;
            if (!categories[category]) {
                categories[category] = {
                    count: 0,
                    totalRelevance: 0,
                    totalConfidence: 0
                };
            }

            categories[category].count++;
            categories[category].totalRelevance += interaction.effectiveness.relevance;
            categories[category].totalConfidence += interaction.effectiveness.confidence;
        }

        // Calculate averages
        for (const category of Object.keys(categories)) {
            const cat = categories[category];
            cat.averageRelevance = cat.totalRelevance / cat.count;
            cat.averageConfidence = cat.totalConfidence / cat.count;
        }

        return categories;
    }

    calculateSessionEffectiveness(interactions) {
        const totalRelevance = interactions.reduce((sum, i) => sum + i.effectiveness.relevance, 0);
        const totalConfidence = interactions.reduce((sum, i) => sum + i.effectiveness.confidence, 0);

        return {
            averageRelevance: totalRelevance / interactions.length,
            averageConfidence: totalConfidence / interactions.length,
            overallEffectiveness: (totalRelevance + totalConfidence) / (2 * interactions.length)
        };
    }

    analyzeProgression(interactions) {
        if (interactions.length < 5) {
            return { trend: 'insufficient_data', confidence: 0 };
        }

        // Analyze relevance trend over time
        const midPoint = Math.floor(interactions.length / 2);
        const firstHalf = interactions.slice(0, midPoint);
        const secondHalf = interactions.slice(midPoint);

        const firstHalfAvg = firstHalf.reduce((sum, i) => sum + i.effectiveness.relevance, 0) / firstHalf.length;
        const secondHalfAvg = secondHalf.reduce((sum, i) => sum + i.effectiveness.relevance, 0) / secondHalf.length;

        const trend = secondHalfAvg - firstHalfAvg;
        let trendLabel = 'stable';

        if (trend > 0.1) trendLabel = 'improving';
        else if (trend < -0.1) trendLabel = 'declining';

        return {
            trend: trendLabel,
            confidence: Math.abs(trend),
            firstHalfAverage: firstHalfAvg,
            secondHalfAverage: secondHalfAvg
        };
    }

    generateRecommendations(interactions) {
        const recommendations = [];

        // Analyze which strategies work best
        const strategyPerformance = new Map();

        for (const interaction of interactions) {
            const key = interaction.strategy.category;
            if (!strategyPerformance.has(key)) {
                strategyPerformance.set(key, {
                    total: 0,
                    relevance: 0,
                    confidence: 0
                });
            }

            const perf = strategyPerformance.get(key);
            perf.total++;
            perf.relevance += interaction.effectiveness.relevance;
            perf.confidence += interaction.effectiveness.confidence;
        }

        // Generate recommendations based on performance
        for (const [strategy, perf] of strategyPerformance) {
            const avgRelevance = perf.relevance / perf.total;
            const avgConfidence = perf.confidence / perf.total;

            if (avgRelevance < 0.6) {
                recommendations.push({
                    type: 'strategy_adjustment',
                    strategy,
                    issue: 'Low relevance',
                    suggestion: `Consider adjusting ${strategy} strategy approach`,
                    priority: 'medium'
                });
            }

            if (avgConfidence < 0.5) {
                recommendations.push({
                    type: 'confidence_improvement',
                    strategy,
                    issue: 'Low confidence',
                    suggestion: `Improve confidence in ${strategy} strategy through better context analysis`,
                    priority: 'high'
                });
            }
        }

        return recommendations;
    }

    generateInsights(interactions) {
        const insights = [];

        // Emotional progression insight
        const emotionalStates = interactions.map(i => i.emotionalAnalysis?.currentState).filter(Boolean);
        if (emotionalStates.length > 0) {
            const avgConfidence = emotionalStates.reduce((sum, s) => sum + s.confidence, 0) / emotionalStates.length;
            const avgComposure = emotionalStates.reduce((sum, s) => sum + s.composure, 0) / emotionalStates.length;

            if (avgConfidence > 0.7) {
                insights.push({
                    type: 'emotional',
                    insight: 'Player maintained high confidence throughout session',
                    significance: 'positive'
                });
            }

            if (avgComposure < 0.4) {
                insights.push({
                    type: 'emotional',
                    insight: 'Player struggled with composure - consider mental coaching focus',
                    significance: 'concern'
                });
            }
        }

        // Context adaptation insight
        const contexts = interactions.map(i => i.contextAnalysis?.matchPhase).filter(Boolean);
        const uniqueContexts = [...new Set(contexts)];

        if (uniqueContexts.length > 3) {
            insights.push({
                type: 'contextual',
                insight: 'Coaching adapted well across multiple match phases',
                significance: 'positive'
            });
        }

        return insights;
    }

    async getCoachingReport(timeframe = 'session') {
        let relevantInteractions = this.coachingHistory;

        if (timeframe === 'session' && this.coachingHistory.length > 0) {
            const currentSession = this.coachingHistory[this.coachingHistory.length - 1].sessionId;
            relevantInteractions = this.coachingHistory.filter(h => h.sessionId === currentSession);
        }

        return {
            timeframe,
            totalInteractions: relevantInteractions.length,
            effectiveness: this.calculateSessionEffectiveness(relevantInteractions),
            categories: this.categorizeInteractions(relevantInteractions),
            progression: this.analyzeProgression(relevantInteractions),
            recommendations: this.generateRecommendations(relevantInteractions),
            insights: this.generateInsights(relevantInteractions),
            trends: this.analyzeTrends(relevantInteractions)
        };
    }

    analyzeTrends(interactions) {
        const trends = {
            relevance: [],
            confidence: [],
            categories: new Map(),
            contexts: new Map()
        };

        // Group interactions by time windows (every 10 interactions)
        for (let i = 0; i < interactions.length; i += 10) {
            const window = interactions.slice(i, i + 10);

            if (window.length > 0) {
                const avgRelevance = window.reduce((sum, inter) => sum + inter.effectiveness.relevance, 0) / window.length;
                const avgConfidence = window.reduce((sum, inter) => sum + inter.effectiveness.confidence, 0) / window.length;

                trends.relevance.push(avgRelevance);
                trends.confidence.push(avgConfidence);

                // Category distribution in this window
                const categoryCount = {};
                window.forEach(inter => {
                    const category = inter.strategy.category;
                    categoryCount[category] = (categoryCount[category] || 0) + 1;
                });

                trends.categories.set(i / 10, categoryCount);

                // Context distribution in this window
                const contextCount = {};
                window.forEach(inter => {
                    const context = inter.contextAnalysis?.matchPhase;
                    if (context) {
                        contextCount[context] = (contextCount[context] || 0) + 1;
                    }
                });

                trends.contexts.set(i / 10, contextCount);
            }
        }

        return trends;
    }

    shutdown() {
        console.log('🔇 Coaching History Engine shutdown');
    }
}

// Initialize global AI coaching intelligence instance
window.aiCoachingIntelligence = new AICoachingIntelligence();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AICoachingIntelligence,
        ContextAwarenessEngine,
        EmotionalIntelligenceEngine,
        DynamicCoachingStrategyEngine,
        RealTimeAdjustmentEngine,
        CoachingHistoryEngine
    };
}